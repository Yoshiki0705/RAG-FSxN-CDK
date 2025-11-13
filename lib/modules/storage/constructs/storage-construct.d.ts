/**
 * ストレージコンストラクト
 *
 * S3、FSx for NetApp ONTAP、EFSの統合管理を提供
 */
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
export declare class StorageConstruct extends Construct {
    private props;
    readonly outputs: StorageOutputs;
    documentsBucket?: s3.Bucket;
    backupBucket?: s3.Bucket;
    embeddingsBucket?: s3.Bucket;
    fsxFileSystem?: fsx.CfnFileSystem;
    fsxSvm?: fsx.CfnStorageVirtualMachine;
    fsxDataVolume?: fsx.CfnVolume;
    fsxDatabaseVolume?: fsx.CfnVolume;
    efsFileSystem?: efs.FileSystem;
    constructor(scope: Construct, id: string, props: StorageConstructProps);
    /**
     * S3リソース作成
     */
    private createS3Resources;
    /**
     * S3バケット作成ヘルパー
     */
    private createS3Bucket;
    /**
     * FSx for ONTAP リソース作成
     */
    private createFSxOntapResources;
    /**
     * EFS リソース作成
     */
    private createEfsResources;
    /**
     * 出力値作成
     */
    private createOutputs;
    /**
     * タグ適用
     */
    private applyTags;
}
