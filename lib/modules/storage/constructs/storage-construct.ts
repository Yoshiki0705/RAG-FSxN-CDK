/**
 * ストレージコンストラクト
 * 
 * S3、FSx for NetApp ONTAP、EFSの統合管理を提供
 */

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as fsx from 'aws-cdk-lib/aws-fsx';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { StorageConfig, StorageOutputs } from '../interfaces/storage-config';

export interface StorageConstructProps {
  config: StorageConfig;
  projectName: string;
  environment: string;
  vpc?: ec2.IVpc;
  kmsKey?: kms.IKey;
  privateSubnetIds?: string[];
}

export class StorageConstruct extends Construct {
  public readonly outputs: StorageOutputs;
  public documentsBucket?: s3.Bucket;
  public backupBucket?: s3.Bucket;
  public embeddingsBucket?: s3.Bucket;
  public fsxFileSystem?: fsx.CfnFileSystem;
  public fsxSvm?: fsx.CfnStorageVirtualMachine;
  public fsxDataVolume?: fsx.CfnVolume;
  public fsxDatabaseVolume?: fsx.CfnVolume;
  public efsFileSystem?: efs.FileSystem;

  constructor(scope: Construct, id: string, private props: StorageConstructProps) {
    super(scope, id);

    // S3バケット作成
    this.createS3Resources();

    // FSx for ONTAP作成
    if (this.props.config.fsxOntap.enabled) {
      this.createFSxOntapResources();
    }

    // EFS作成
    if (this.props.config.efs.enabled) {
      this.createEfsResources();
    }

    // 出力値の設定
    this.outputs = this.createOutputs();

    // タグ設定
    this.applyTags();
  }

  /**
   * S3リソース作成
   */
  private createS3Resources(): void {
    // Documents Bucket
    if (this.props.config.s3.documents.enabled) {
      this.documentsBucket = this.createS3Bucket(
        'DocumentsBucket',
        this.props.config.s3.documents.bucketName,
        this.props.config.s3.documents
      );
    }

    // Backup Bucket
    if (this.props.config.s3.backup.enabled) {
      this.backupBucket = this.createS3Bucket(
        'BackupBucket',
        this.props.config.s3.backup.bucketName,
        this.props.config.s3.backup
      );
    }

    // Embeddings Bucket
    if (this.props.config.s3.embeddings.enabled) {
      this.embeddingsBucket = this.createS3Bucket(
        'EmbeddingsBucket',
        this.props.config.s3.embeddings.bucketName,
        this.props.config.s3.embeddings
      );
    }
  }

  /**
   * S3バケット作成ヘルパー
   */
  private createS3Bucket(
    id: string,
    bucketName: string | undefined,
    config: any
  ): s3.Bucket {
    const lifecycleRules: s3.LifecycleRule[] = [];

    if (config.lifecycle?.enabled) {
      lifecycleRules.push({
        id: `${id}LifecycleRule`,
        enabled: true,
        transitions: [
          {
            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            transitionAfter: cdk.Duration.days(config.lifecycle.transitionToIADays),
          },
          {
            storageClass: s3.StorageClass.GLACIER,
            transitionAfter: cdk.Duration.days(config.lifecycle.transitionToGlacierDays),
          },
        ],
        expiration: cdk.Duration.days(config.lifecycle.expirationDays),
      });
    }

    return new s3.Bucket(this, id, {
      bucketName,
      versioned: config.versioning,
      encryption: config.encryption.enabled
        ? (this.props.kmsKey 
            ? s3.BucketEncryption.KMS 
            : s3.BucketEncryption.S3_MANAGED)
        : s3.BucketEncryption.S3_MANAGED,
      encryptionKey: config.encryption.enabled ? this.props.kmsKey : undefined,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules,
      removalPolicy: this.props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: this.props.environment !== 'prod',
    });
  }

  /**
   * FSx for ONTAP リソース作成
   */
  private createFSxOntapResources(): void {
    if (!this.props.vpc || !this.props.privateSubnetIds) {
      throw new Error('VPC and private subnets are required for FSx ONTAP');
    }

    const config = this.props.config.fsxOntap;

    // FSx File System作成
    this.fsxFileSystem = new fsx.CfnFileSystem(this, 'FSxFileSystem', {
      fileSystemType: 'ONTAP',
      storageCapacity: config.storageCapacity,
      subnetIds: config.deploymentType === 'SINGLE_AZ_1' 
        ? [config.preferredSubnetId || this.props.privateSubnetIds[0]]
        : this.props.privateSubnetIds.slice(0, 2),
      ontapConfiguration: {
        deploymentType: config.deploymentType,
        throughputCapacity: config.throughputCapacity,
        preferredSubnetId: config.preferredSubnetId || this.props.privateSubnetIds[0],
        routeTableIds: config.routeTableIds,
        automaticBackupRetentionDays: config.automaticBackupRetentionDays,
        dailyAutomaticBackupStartTime: config.dailyAutomaticBackupStartTime,
        weeklyMaintenanceStartTime: config.weeklyMaintenanceStartTime,
        diskIopsConfiguration: config.diskIopsConfiguration,
      },
      tags: [{
        key: 'Name',
        value: config.fileSystemName || `${this.props.projectName}-${this.props.environment}-fsx`,
      }],
    });

    // Storage Virtual Machine (SVM) 作成
    this.fsxSvm = new fsx.CfnStorageVirtualMachine(this, 'FSxSVM', {
      fileSystemId: this.fsxFileSystem.ref,
      name: config.svm.name || `${this.props.projectName}-${this.props.environment}-svm`,
      rootVolumeSecurityStyle: config.svm.rootVolumeSecurityStyle,
      activeDirectoryConfiguration: config.svm.activeDirectoryConfiguration,
      tags: [{
        key: 'Name',
        value: config.svm.name || `${this.props.projectName}-${this.props.environment}-svm`,
      }],
    });

    // Data Volume作成
    if (config.volumes.data.enabled) {
      // FSx ONTAPボリューム名はハイフンが使用できないため、アンダースコアに置き換え
      const dataVolumeName = config.volumes.data.name || `${this.props.projectName.replace(/-/g, '_')}_${this.props.environment}_data`;
      
      this.fsxDataVolume = new fsx.CfnVolume(this, 'FSxDataVolume', {
        name: dataVolumeName,
        volumeType: 'ONTAP',
        ontapConfiguration: {
          storageVirtualMachineId: this.fsxSvm.ref,
          junctionPath: config.volumes.data.junctionPath,
          sizeInMegabytes: config.volumes.data.sizeInMegabytes.toString(),
          storageEfficiencyEnabled: config.volumes.data.storageEfficiencyEnabled.toString(),
          securityStyle: config.volumes.data.securityStyle,
        },
        tags: [{
          key: 'Name',
          value: dataVolumeName,
        }],
      });
    }

    // Database Volume作成
    if (config.volumes.database.enabled) {
      // FSx ONTAPボリューム名はハイフンが使用できないため、アンダースコアに置き換え
      const databaseVolumeName = config.volumes.database.name || `${this.props.projectName.replace(/-/g, '_')}_${this.props.environment}_database`;
      
      this.fsxDatabaseVolume = new fsx.CfnVolume(this, 'FSxDatabaseVolume', {
        name: databaseVolumeName,
        volumeType: 'ONTAP',
        ontapConfiguration: {
          storageVirtualMachineId: this.fsxSvm.ref,
          junctionPath: config.volumes.database.junctionPath,
          sizeInMegabytes: config.volumes.database.sizeInMegabytes.toString(),
          storageEfficiencyEnabled: config.volumes.database.storageEfficiencyEnabled.toString(),
          securityStyle: config.volumes.database.securityStyle,
        },
        tags: [{
          key: 'Name',
          value: databaseVolumeName,
        }],
      });
    }
  }

  /**
   * EFS リソース作成
   */
  private createEfsResources(): void {
    if (!this.props.vpc) {
      throw new Error('VPC is required for EFS');
    }

    const config = this.props.config.efs;

    this.efsFileSystem = new efs.FileSystem(this, 'EfsFileSystem', {
      vpc: this.props.vpc,
      performanceMode: config.performanceMode === 'generalPurpose' 
        ? efs.PerformanceMode.GENERAL_PURPOSE 
        : efs.PerformanceMode.MAX_IO,
      throughputMode: config.throughputMode === 'provisioned' 
        ? efs.ThroughputMode.PROVISIONED 
        : efs.ThroughputMode.BURSTING,
      provisionedThroughputPerSecond: config.throughputMode === 'provisioned' 
        ? cdk.Size.mebibytes(config.provisionedThroughputInMibps || 100)
        : undefined,
      encrypted: config.encrypted,
      kmsKey: config.encrypted ? this.props.kmsKey : undefined,
      removalPolicy: this.props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });
  }

  /**
   * 出力値作成
   */
  private createOutputs(): StorageOutputs {
    return {
      // S3出力
      documentsBucketName: this.documentsBucket?.bucketName,
      documentsBucketArn: this.documentsBucket?.bucketArn,
      backupBucketName: this.backupBucket?.bucketName,
      backupBucketArn: this.backupBucket?.bucketArn,
      embeddingsBucketName: this.embeddingsBucket?.bucketName,
      embeddingsBucketArn: this.embeddingsBucket?.bucketArn,

      // FSx出力
      fsxFileSystemId: this.fsxFileSystem?.ref,
      fsxFileSystemArn: this.fsxFileSystem?.attrResourceArn,
      fsxFileSystemDnsName: this.fsxFileSystem?.attrDnsName,
      fsxSvmId: this.fsxSvm?.ref,
      fsxDataVolumeId: this.fsxDataVolume?.ref,
      fsxDatabaseVolumeId: this.fsxDatabaseVolume?.ref,

      // EFS出力
      efsFileSystemId: this.efsFileSystem?.fileSystemId,
      efsFileSystemArn: this.efsFileSystem?.fileSystemArn,
    };
  }

  /**
   * タグ適用
   */
  private applyTags(): void {
    const tags = this.props.config.tags;
    
    cdk.Tags.of(this).add('StorageType', tags.StorageType);
    cdk.Tags.of(this).add('BackupEnabled', tags.BackupEnabled.toString());
    cdk.Tags.of(this).add('EncryptionEnabled', tags.EncryptionEnabled.toString());
    
    if (tags.DataClassification) {
      cdk.Tags.of(this).add('DataClassification', tags.DataClassification);
    }
    
    if (tags.RetentionPeriod) {
      cdk.Tags.of(this).add('RetentionPeriod', tags.RetentionPeriod);
    }
  }
}