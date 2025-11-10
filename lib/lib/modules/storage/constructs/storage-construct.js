"use strict";
/**
 * ストレージコンストラクト
 *
 * S3、FSx for NetApp ONTAP、EFSの統合管理を提供
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const fsx = __importStar(require("aws-cdk-lib/aws-fsx"));
const efs = __importStar(require("aws-cdk-lib/aws-efs"));
const constructs_1 = require("constructs");
class StorageConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
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
    createS3Resources() {
        // Documents Bucket
        if (this.props.config.s3.documents.enabled) {
            this.documentsBucket = this.createS3Bucket('DocumentsBucket', this.props.config.s3.documents.bucketName, this.props.config.s3.documents);
        }
        // Backup Bucket
        if (this.props.config.s3.backup.enabled) {
            this.backupBucket = this.createS3Bucket('BackupBucket', this.props.config.s3.backup.bucketName, this.props.config.s3.backup);
        }
        // Embeddings Bucket
        if (this.props.config.s3.embeddings.enabled) {
            this.embeddingsBucket = this.createS3Bucket('EmbeddingsBucket', this.props.config.s3.embeddings.bucketName, this.props.config.s3.embeddings);
        }
    }
    /**
     * S3バケット作成ヘルパー
     */
    createS3Bucket(id, bucketName, config) {
        const lifecycleRules = [];
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
    createFSxOntapResources() {
        if (!this.props.vpc || !this.props.privateSubnetIds) {
            throw new Error('VPC and private subnets are required for FSx ONTAP');
        }
        const config = this.props.config.fsxOntap;
        // バックアップ設定の検証（本番環境保護）
        const backupRetentionDays = config.automaticBackupRetentionDays ?? 0;
        if (this.props.environment === 'prod' && backupRetentionDays === 0) {
            if (!config.disableBackupConfirmed) {
                throw new Error('本番環境でFSx自動バックアップを無効化しようとしています。\n' +
                    'この操作を実行するには、設定で disableBackupConfirmed=true を設定してください。\n' +
                    '注意: 自動バックアップを無効化すると、データ損失のリスクが高まります。');
            }
            console.warn('⚠️  警告: 本番環境でFSx自動バックアップが無効化されています');
            console.warn('⚠️  手動バックアップの定期実行を強く推奨します');
        }
        // バックアップ設定のログ出力
        if (backupRetentionDays === 0) {
            console.log('✅ FSx自動バックアップ: 無効（コスト最適化モード）');
            console.log('ℹ️  手動バックアップは引き続き利用可能です');
        }
        else {
            console.log(`✅ FSx自動バックアップ: 有効（保持期間: ${backupRetentionDays}日）`);
        }
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
                // 自動バックアップ設定（0で無効化）
                automaticBackupRetentionDays: backupRetentionDays,
                // バックアップ無効時はdailyAutomaticBackupStartTimeを未設定
                dailyAutomaticBackupStartTime: backupRetentionDays > 0
                    ? config.dailyAutomaticBackupStartTime
                    : undefined,
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
    createEfsResources() {
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
    createOutputs() {
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
    applyTags() {
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
exports.StorageConstruct = StorageConstruct;
