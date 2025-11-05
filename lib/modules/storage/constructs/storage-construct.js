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
    props;
    outputs;
    documentsBucket;
    backupBucket;
    embeddingsBucket;
    fsxFileSystem;
    fsxSvm;
    fsxDataVolume;
    fsxDatabaseVolume;
    efsFileSystem;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdG9yYWdlLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHlEQUEyQztBQUMzQyx5REFBMkM7QUFHM0MsMkNBQXVDO0FBWXZDLE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVM7SUFXSztJQVZsQyxPQUFPLENBQWlCO0lBQ2pDLGVBQWUsQ0FBYTtJQUM1QixZQUFZLENBQWE7SUFDekIsZ0JBQWdCLENBQWE7SUFDN0IsYUFBYSxDQUFxQjtJQUNsQyxNQUFNLENBQWdDO0lBQ3RDLGFBQWEsQ0FBaUI7SUFDOUIsaUJBQWlCLENBQWlCO0lBQ2xDLGFBQWEsQ0FBa0I7SUFFdEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBVSxLQUE0QjtRQUM1RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRCtCLFVBQUssR0FBTCxLQUFLLENBQXVCO1FBRzVFLFdBQVc7UUFDWCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUV6QixrQkFBa0I7UUFDbEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVELFFBQVE7UUFDUixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRUQsU0FBUztRQUNULElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXBDLE9BQU87UUFDUCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7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LElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUU5RSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzVCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDekIsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNqRSxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBcFJELDRDQW9SQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog44K544OI44Os44O844K444Kz44Oz44K544OI44Op44Kv44OIXG4gKiBcbiAqIFMz44CBRlN4IGZvciBOZXRBcHAgT05UQVDjgIFFRlPjga7ntbHlkIjnrqHnkIbjgpLmj5DkvptcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGZzeCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZnN4JztcbmltcG9ydCAqIGFzIGVmcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWZzJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGttcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgU3RvcmFnZUNvbmZpZywgU3RvcmFnZU91dHB1dHMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0b3JhZ2UtY29uZmlnJztcblxuZXhwb3J0IGludGVyZmFjZSBTdG9yYWdlQ29uc3RydWN0UHJvcHMge1xuICBjb25maWc6IFN0b3JhZ2VDb25maWc7XG4gIHByb2plY3ROYW1lOiBzdHJpbmc7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHZwYz86IGVjMi5JVnBjO1xuICBrbXNLZXk/OiBrbXMuSUtleTtcbiAgcHJpdmF0ZVN1Ym5ldElkcz86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY2xhc3MgU3RvcmFnZUNvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBvdXRwdXRzOiBTdG9yYWdlT3V0cHV0cztcbiAgcHVibGljIGRvY3VtZW50c0J1Y2tldD86IHMzLkJ1Y2tldDtcbiAgcHVibGljIGJhY2t1cEJ1Y2tldD86IHMzLkJ1Y2tldDtcbiAgcHVibGljIGVtYmVkZGluZ3NCdWNrZXQ/OiBzMy5CdWNrZXQ7XG4gIHB1YmxpYyBmc3hGaWxlU3lzdGVtPzogZnN4LkNmbkZpbGVTeXN0ZW07XG4gIHB1YmxpYyBmc3hTdm0/OiBmc3guQ2ZuU3RvcmFnZVZpcnR1YWxNYWNoaW5lO1xuICBwdWJsaWMgZnN4RGF0YVZvbHVtZT86IGZzeC5DZm5Wb2x1bWU7XG4gIHB1YmxpYyBmc3hEYXRhYmFzZVZvbHVtZT86IGZzeC5DZm5Wb2x1bWU7XG4gIHB1YmxpYyBlZnNGaWxlU3lzdGVtPzogZWZzLkZpbGVTeXN0ZW07XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJpdmF0ZSBwcm9wczogU3RvcmFnZUNvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIFMz44OQ44Kx44OD44OI5L2c5oiQXG4gICAgdGhpcy5jcmVhdGVTM1Jlc291cmNlcygpO1xuXG4gICAgLy8gRlN4IGZvciBPTlRBUOS9nOaIkFxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy5mc3hPbnRhcC5lbmFibGVkKSB7XG4gICAgICB0aGlzLmNyZWF0ZUZTeE9udGFwUmVzb3VyY2VzKCk7XG4gICAgfVxuXG4gICAgLy8gRUZT5L2c5oiQXG4gICAgaWYgKHRoaXMucHJvcHMuY29uZmlnLmVmcy5lbmFibGVkKSB7XG4gICAgICB0aGlzLmNyZWF0ZUVmc1Jlc291cmNlcygpO1xuICAgIH1cblxuICAgIC8vIOWHuuWKm+WApOOBruioreWumlxuICAgIHRoaXMub3V0cHV0cyA9IHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgLy8g44K/44Kw6Kit5a6aXG4gICAgdGhpcy5hcHBseVRhZ3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTM+ODquOCveODvOOCueS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVTM1Jlc291cmNlcygpOiB2b2lkIHtcbiAgICAvLyBEb2N1bWVudHMgQnVja2V0XG4gICAgaWYgKHRoaXMucHJvcHMuY29uZmlnLnMzLmRvY3VtZW50cy5lbmFibGVkKSB7XG4gICAgICB0aGlzLmRvY3VtZW50c0J1Y2tldCA9IHRoaXMuY3JlYXRlUzNCdWNrZXQoXG4gICAgICAgICdEb2N1bWVudHNCdWNrZXQnLFxuICAgICAgICB0aGlzLnByb3BzLmNvbmZpZy5zMy5kb2N1bWVudHMuYnVja2V0TmFtZSxcbiAgICAgICAgdGhpcy5wcm9wcy5jb25maWcuczMuZG9jdW1lbnRzXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEJhY2t1cCBCdWNrZXRcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuczMuYmFja3VwLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuYmFja3VwQnVja2V0ID0gdGhpcy5jcmVhdGVTM0J1Y2tldChcbiAgICAgICAgJ0JhY2t1cEJ1Y2tldCcsXG4gICAgICAgIHRoaXMucHJvcHMuY29uZmlnLnMzLmJhY2t1cC5idWNrZXROYW1lLFxuICAgICAgICB0aGlzLnByb3BzLmNvbmZpZy5zMy5iYWNrdXBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW1iZWRkaW5ncyBCdWNrZXRcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuczMuZW1iZWRkaW5ncy5lbmFibGVkKSB7XG4gICAgICB0aGlzLmVtYmVkZGluZ3NCdWNrZXQgPSB0aGlzLmNyZWF0ZVMzQnVja2V0KFxuICAgICAgICAnRW1iZWRkaW5nc0J1Y2tldCcsXG4gICAgICAgIHRoaXMucHJvcHMuY29uZmlnLnMzLmVtYmVkZGluZ3MuYnVja2V0TmFtZSxcbiAgICAgICAgdGhpcy5wcm9wcy5jb25maWcuczMuZW1iZWRkaW5nc1xuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUzPjg5DjgrHjg4Pjg4jkvZzmiJDjg5jjg6vjg5Hjg7xcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlUzNCdWNrZXQoXG4gICAgaWQ6IHN0cmluZyxcbiAgICBidWNrZXROYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gICAgY29uZmlnOiBhbnlcbiAgKTogczMuQnVja2V0IHtcbiAgICBjb25zdCBsaWZlY3ljbGVSdWxlczogczMuTGlmZWN5Y2xlUnVsZVtdID0gW107XG5cbiAgICBpZiAoY29uZmlnLmxpZmVjeWNsZT8uZW5hYmxlZCkge1xuICAgICAgbGlmZWN5Y2xlUnVsZXMucHVzaCh7XG4gICAgICAgIGlkOiBgJHtpZH1MaWZlY3ljbGVSdWxlYCxcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5JTkZSRVFVRU5UX0FDQ0VTUyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoY29uZmlnLmxpZmVjeWNsZS50cmFuc2l0aW9uVG9JQURheXMpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuR0xBQ0lFUixcbiAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoY29uZmlnLmxpZmVjeWNsZS50cmFuc2l0aW9uVG9HbGFjaWVyRGF5cyksXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoY29uZmlnLmxpZmVjeWNsZS5leHBpcmF0aW9uRGF5cyksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IHMzLkJ1Y2tldCh0aGlzLCBpZCwge1xuICAgICAgYnVja2V0TmFtZSxcbiAgICAgIHZlcnNpb25lZDogY29uZmlnLnZlcnNpb25pbmcsXG4gICAgICBlbmNyeXB0aW9uOiBjb25maWcuZW5jcnlwdGlvbi5lbmFibGVkXG4gICAgICAgID8gKHRoaXMucHJvcHMua21zS2V5IFxuICAgICAgICAgICAgPyBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyBcbiAgICAgICAgICAgIDogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VEKVxuICAgICAgICA6IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGVuY3J5cHRpb25LZXk6IGNvbmZpZy5lbmNyeXB0aW9uLmVuYWJsZWQgPyB0aGlzLnByb3BzLmttc0tleSA6IHVuZGVmaW5lZCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICBsaWZlY3ljbGVSdWxlcyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IHRoaXMucHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kJyBcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0aGlzLnByb3BzLmVudmlyb25tZW50ICE9PSAncHJvZCcsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRlN4IGZvciBPTlRBUCDjg6rjgr3jg7zjgrnkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRlN4T250YXBSZXNvdXJjZXMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnByb3BzLnZwYyB8fCAhdGhpcy5wcm9wcy5wcml2YXRlU3VibmV0SWRzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZQQyBhbmQgcHJpdmF0ZSBzdWJuZXRzIGFyZSByZXF1aXJlZCBmb3IgRlN4IE9OVEFQJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWcuZnN4T250YXA7XG5cbiAgICAvLyBGU3ggRmlsZSBTeXN0ZW3kvZzmiJBcbiAgICB0aGlzLmZzeEZpbGVTeXN0ZW0gPSBuZXcgZnN4LkNmbkZpbGVTeXN0ZW0odGhpcywgJ0ZTeEZpbGVTeXN0ZW0nLCB7XG4gICAgICBmaWxlU3lzdGVtVHlwZTogJ09OVEFQJyxcbiAgICAgIHN0b3JhZ2VDYXBhY2l0eTogY29uZmlnLnN0b3JhZ2VDYXBhY2l0eSxcbiAgICAgIHN1Ym5ldElkczogY29uZmlnLmRlcGxveW1lbnRUeXBlID09PSAnU0lOR0xFX0FaXzEnIFxuICAgICAgICA/IFtjb25maWcucHJlZmVycmVkU3VibmV0SWQgfHwgdGhpcy5wcm9wcy5wcml2YXRlU3VibmV0SWRzWzBdXVxuICAgICAgICA6IHRoaXMucHJvcHMucHJpdmF0ZVN1Ym5ldElkcy5zbGljZSgwLCAyKSxcbiAgICAgIG9udGFwQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBkZXBsb3ltZW50VHlwZTogY29uZmlnLmRlcGxveW1lbnRUeXBlLFxuICAgICAgICB0aHJvdWdocHV0Q2FwYWNpdHk6IGNvbmZpZy50aHJvdWdocHV0Q2FwYWNpdHksXG4gICAgICAgIHByZWZlcnJlZFN1Ym5ldElkOiBjb25maWcucHJlZmVycmVkU3VibmV0SWQgfHwgdGhpcy5wcm9wcy5wcml2YXRlU3VibmV0SWRzWzBdLFxuICAgICAgICByb3V0ZVRhYmxlSWRzOiBjb25maWcucm91dGVUYWJsZUlkcyxcbiAgICAgICAgYXV0b21hdGljQmFja3VwUmV0ZW50aW9uRGF5czogY29uZmlnLmF1dG9tYXRpY0JhY2t1cFJldGVudGlvbkRheXMsXG4gICAgICAgIGRhaWx5QXV0b21hdGljQmFja3VwU3RhcnRUaW1lOiBjb25maWcuZGFpbHlBdXRvbWF0aWNCYWNrdXBTdGFydFRpbWUsXG4gICAgICAgIHdlZWtseU1haW50ZW5hbmNlU3RhcnRUaW1lOiBjb25maWcud2Vla2x5TWFpbnRlbmFuY2VTdGFydFRpbWUsXG4gICAgICAgIGRpc2tJb3BzQ29uZmlndXJhdGlvbjogY29uZmlnLmRpc2tJb3BzQ29uZmlndXJhdGlvbixcbiAgICAgIH0sXG4gICAgICB0YWdzOiBbe1xuICAgICAgICBrZXk6ICdOYW1lJyxcbiAgICAgICAgdmFsdWU6IGNvbmZpZy5maWxlU3lzdGVtTmFtZSB8fCBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LWZzeGAsXG4gICAgICB9XSxcbiAgICB9KTtcblxuICAgIC8vIFN0b3JhZ2UgVmlydHVhbCBNYWNoaW5lIChTVk0pIOS9nOaIkFxuICAgIHRoaXMuZnN4U3ZtID0gbmV3IGZzeC5DZm5TdG9yYWdlVmlydHVhbE1hY2hpbmUodGhpcywgJ0ZTeFNWTScsIHtcbiAgICAgIGZpbGVTeXN0ZW1JZDogdGhpcy5mc3hGaWxlU3lzdGVtLnJlZixcbiAgICAgIG5hbWU6IGNvbmZpZy5zdm0ubmFtZSB8fCBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LXN2bWAsXG4gICAgICByb290Vm9sdW1lU2VjdXJpdHlTdHlsZTogY29uZmlnLnN2bS5yb290Vm9sdW1lU2VjdXJpdHlTdHlsZSxcbiAgICAgIGFjdGl2ZURpcmVjdG9yeUNvbmZpZ3VyYXRpb246IGNvbmZpZy5zdm0uYWN0aXZlRGlyZWN0b3J5Q29uZmlndXJhdGlvbixcbiAgICAgIHRhZ3M6IFt7XG4gICAgICAgIGtleTogJ05hbWUnLFxuICAgICAgICB2YWx1ZTogY29uZmlnLnN2bS5uYW1lIHx8IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tc3ZtYCxcbiAgICAgIH1dLFxuICAgIH0pO1xuXG4gICAgLy8gRGF0YSBWb2x1bWXkvZzmiJBcbiAgICBpZiAoY29uZmlnLnZvbHVtZXMuZGF0YS5lbmFibGVkKSB7XG4gICAgICAvLyBGU3ggT05UQVDjg5zjg6rjg6Xjg7zjg6DlkI3jga/jg4/jgqTjg5Xjg7PjgYzkvb/nlKjjgafjgY3jgarjgYTjgZ/jgoHjgIHjgqLjg7Pjg4Djg7zjgrnjgrPjgqLjgavnva7jgY3mj5vjgYhcbiAgICAgIGNvbnN0IGRhdGFWb2x1bWVOYW1lID0gY29uZmlnLnZvbHVtZXMuZGF0YS5uYW1lIHx8IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWUucmVwbGFjZSgvLS9nLCAnXycpfV8ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9X2RhdGFgO1xuICAgICAgXG4gICAgICB0aGlzLmZzeERhdGFWb2x1bWUgPSBuZXcgZnN4LkNmblZvbHVtZSh0aGlzLCAnRlN4RGF0YVZvbHVtZScsIHtcbiAgICAgICAgbmFtZTogZGF0YVZvbHVtZU5hbWUsXG4gICAgICAgIHZvbHVtZVR5cGU6ICdPTlRBUCcsXG4gICAgICAgIG9udGFwQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIHN0b3JhZ2VWaXJ0dWFsTWFjaGluZUlkOiB0aGlzLmZzeFN2bS5yZWYsXG4gICAgICAgICAganVuY3Rpb25QYXRoOiBjb25maWcudm9sdW1lcy5kYXRhLmp1bmN0aW9uUGF0aCxcbiAgICAgICAgICBzaXplSW5NZWdhYnl0ZXM6IGNvbmZpZy52b2x1bWVzLmRhdGEuc2l6ZUluTWVnYWJ5dGVzLnRvU3RyaW5nKCksXG4gICAgICAgICAgc3RvcmFnZUVmZmljaWVuY3lFbmFibGVkOiBjb25maWcudm9sdW1lcy5kYXRhLnN0b3JhZ2VFZmZpY2llbmN5RW5hYmxlZC50b1N0cmluZygpLFxuICAgICAgICAgIHNlY3VyaXR5U3R5bGU6IGNvbmZpZy52b2x1bWVzLmRhdGEuc2VjdXJpdHlTdHlsZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczogW3tcbiAgICAgICAgICBrZXk6ICdOYW1lJyxcbiAgICAgICAgICB2YWx1ZTogZGF0YVZvbHVtZU5hbWUsXG4gICAgICAgIH1dLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRGF0YWJhc2UgVm9sdW1l5L2c5oiQXG4gICAgaWYgKGNvbmZpZy52b2x1bWVzLmRhdGFiYXNlLmVuYWJsZWQpIHtcbiAgICAgIC8vIEZTeCBPTlRBUOODnOODquODpeODvOODoOWQjeOBr+ODj+OCpOODleODs+OBjOS9v+eUqOOBp+OBjeOBquOBhOOBn+OCgeOAgeOCouODs+ODgOODvOOCueOCs+OCouOBq+e9ruOBjeaPm+OBiFxuICAgICAgY29uc3QgZGF0YWJhc2VWb2x1bWVOYW1lID0gY29uZmlnLnZvbHVtZXMuZGF0YWJhc2UubmFtZSB8fCBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lLnJlcGxhY2UoLy0vZywgJ18nKX1fJHt0aGlzLnByb3BzLmVudmlyb25tZW50fV9kYXRhYmFzZWA7XG4gICAgICBcbiAgICAgIHRoaXMuZnN4RGF0YWJhc2VWb2x1bWUgPSBuZXcgZnN4LkNmblZvbHVtZSh0aGlzLCAnRlN4RGF0YWJhc2VWb2x1bWUnLCB7XG4gICAgICAgIG5hbWU6IGRhdGFiYXNlVm9sdW1lTmFtZSxcbiAgICAgICAgdm9sdW1lVHlwZTogJ09OVEFQJyxcbiAgICAgICAgb250YXBDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgc3RvcmFnZVZpcnR1YWxNYWNoaW5lSWQ6IHRoaXMuZnN4U3ZtLnJlZixcbiAgICAgICAgICBqdW5jdGlvblBhdGg6IGNvbmZpZy52b2x1bWVzLmRhdGFiYXNlLmp1bmN0aW9uUGF0aCxcbiAgICAgICAgICBzaXplSW5NZWdhYnl0ZXM6IGNvbmZpZy52b2x1bWVzLmRhdGFiYXNlLnNpemVJbk1lZ2FieXRlcy50b1N0cmluZygpLFxuICAgICAgICAgIHN0b3JhZ2VFZmZpY2llbmN5RW5hYmxlZDogY29uZmlnLnZvbHVtZXMuZGF0YWJhc2Uuc3RvcmFnZUVmZmljaWVuY3lFbmFibGVkLnRvU3RyaW5nKCksXG4gICAgICAgICAgc2VjdXJpdHlTdHlsZTogY29uZmlnLnZvbHVtZXMuZGF0YWJhc2Uuc2VjdXJpdHlTdHlsZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczogW3tcbiAgICAgICAgICBrZXk6ICdOYW1lJyxcbiAgICAgICAgICB2YWx1ZTogZGF0YWJhc2VWb2x1bWVOYW1lLFxuICAgICAgICB9XSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFRlMg44Oq44K944O844K55L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUVmc1Jlc291cmNlcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMucHJvcHMudnBjKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZQQyBpcyByZXF1aXJlZCBmb3IgRUZTJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWcuZWZzO1xuXG4gICAgdGhpcy5lZnNGaWxlU3lzdGVtID0gbmV3IGVmcy5GaWxlU3lzdGVtKHRoaXMsICdFZnNGaWxlU3lzdGVtJywge1xuICAgICAgdnBjOiB0aGlzLnByb3BzLnZwYyxcbiAgICAgIHBlcmZvcm1hbmNlTW9kZTogY29uZmlnLnBlcmZvcm1hbmNlTW9kZSA9PT0gJ2dlbmVyYWxQdXJwb3NlJyBcbiAgICAgICAgPyBlZnMuUGVyZm9ybWFuY2VNb2RlLkdFTkVSQUxfUFVSUE9TRSBcbiAgICAgICAgOiBlZnMuUGVyZm9ybWFuY2VNb2RlLk1BWF9JTyxcbiAgICAgIHRocm91Z2hwdXRNb2RlOiBjb25maWcudGhyb3VnaHB1dE1vZGUgPT09ICdwcm92aXNpb25lZCcgXG4gICAgICAgID8gZWZzLlRocm91Z2hwdXRNb2RlLlBST1ZJU0lPTkVEIFxuICAgICAgICA6IGVmcy5UaHJvdWdocHV0TW9kZS5CVVJTVElORyxcbiAgICAgIHByb3Zpc2lvbmVkVGhyb3VnaHB1dFBlclNlY29uZDogY29uZmlnLnRocm91Z2hwdXRNb2RlID09PSAncHJvdmlzaW9uZWQnIFxuICAgICAgICA/IGNkay5TaXplLm1lYmlieXRlcyhjb25maWcucHJvdmlzaW9uZWRUaHJvdWdocHV0SW5NaWJwcyB8fCAxMDApXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgZW5jcnlwdGVkOiBjb25maWcuZW5jcnlwdGVkLFxuICAgICAga21zS2V5OiBjb25maWcuZW5jcnlwdGVkID8gdGhpcy5wcm9wcy5rbXNLZXkgOiB1bmRlZmluZWQsXG4gICAgICByZW1vdmFsUG9saWN5OiB0aGlzLnByb3BzLmVudmlyb25tZW50ID09PSAncHJvZCcgXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOIFxuICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog5Ye65Yqb5YCk5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogU3RvcmFnZU91dHB1dHMge1xuICAgIHJldHVybiB7XG4gICAgICAvLyBTM+WHuuWKm1xuICAgICAgZG9jdW1lbnRzQnVja2V0TmFtZTogdGhpcy5kb2N1bWVudHNCdWNrZXQ/LmJ1Y2tldE5hbWUsXG4gICAgICBkb2N1bWVudHNCdWNrZXRBcm46IHRoaXMuZG9jdW1lbnRzQnVja2V0Py5idWNrZXRBcm4sXG4gICAgICBiYWNrdXBCdWNrZXROYW1lOiB0aGlzLmJhY2t1cEJ1Y2tldD8uYnVja2V0TmFtZSxcbiAgICAgIGJhY2t1cEJ1Y2tldEFybjogdGhpcy5iYWNrdXBCdWNrZXQ/LmJ1Y2tldEFybixcbiAgICAgIGVtYmVkZGluZ3NCdWNrZXROYW1lOiB0aGlzLmVtYmVkZGluZ3NCdWNrZXQ/LmJ1Y2tldE5hbWUsXG4gICAgICBlbWJlZGRpbmdzQnVja2V0QXJuOiB0aGlzLmVtYmVkZGluZ3NCdWNrZXQ/LmJ1Y2tldEFybixcblxuICAgICAgLy8gRlN45Ye65YqbXG4gICAgICBmc3hGaWxlU3lzdGVtSWQ6IHRoaXMuZnN4RmlsZVN5c3RlbT8ucmVmLFxuICAgICAgZnN4RmlsZVN5c3RlbUFybjogdGhpcy5mc3hGaWxlU3lzdGVtPy5hdHRyUmVzb3VyY2VBcm4sXG4gICAgICBmc3hGaWxlU3lzdGVtRG5zTmFtZTogdGhpcy5mc3hGaWxlU3lzdGVtPy5hdHRyRG5zTmFtZSxcbiAgICAgIGZzeFN2bUlkOiB0aGlzLmZzeFN2bT8ucmVmLFxuICAgICAgZnN4RGF0YVZvbHVtZUlkOiB0aGlzLmZzeERhdGFWb2x1bWU/LnJlZixcbiAgICAgIGZzeERhdGFiYXNlVm9sdW1lSWQ6IHRoaXMuZnN4RGF0YWJhc2VWb2x1bWU/LnJlZixcblxuICAgICAgLy8gRUZT5Ye65YqbXG4gICAgICBlZnNGaWxlU3lzdGVtSWQ6IHRoaXMuZWZzRmlsZVN5c3RlbT8uZmlsZVN5c3RlbUlkLFxuICAgICAgZWZzRmlsZVN5c3RlbUFybjogdGhpcy5lZnNGaWxlU3lzdGVtPy5maWxlU3lzdGVtQXJuLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44K/44Kw6YGp55SoXG4gICAqL1xuICBwcml2YXRlIGFwcGx5VGFncygpOiB2b2lkIHtcbiAgICBjb25zdCB0YWdzID0gdGhpcy5wcm9wcy5jb25maWcudGFncztcbiAgICBcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1N0b3JhZ2VUeXBlJywgdGFncy5TdG9yYWdlVHlwZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdCYWNrdXBFbmFibGVkJywgdGFncy5CYWNrdXBFbmFibGVkLnRvU3RyaW5nKCkpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRW5jcnlwdGlvbkVuYWJsZWQnLCB0YWdzLkVuY3J5cHRpb25FbmFibGVkLnRvU3RyaW5nKCkpO1xuICAgIFxuICAgIGlmICh0YWdzLkRhdGFDbGFzc2lmaWNhdGlvbikge1xuICAgICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdEYXRhQ2xhc3NpZmljYXRpb24nLCB0YWdzLkRhdGFDbGFzc2lmaWNhdGlvbik7XG4gICAgfVxuICAgIFxuICAgIGlmICh0YWdzLlJldGVudGlvblBlcmlvZCkge1xuICAgICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdSZXRlbnRpb25QZXJpb2QnLCB0YWdzLlJldGVudGlvblBlcmlvZCk7XG4gICAgfVxuICB9XG59Il19