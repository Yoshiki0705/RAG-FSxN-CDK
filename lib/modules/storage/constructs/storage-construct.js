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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdG9yYWdlLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHlEQUEyQztBQUMzQyx5REFBMkM7QUFHM0MsMkNBQXVDO0FBWXZDLE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVM7SUFXSztJQVZsQyxPQUFPLENBQWlCO0lBQ2pDLGVBQWUsQ0FBYTtJQUM1QixZQUFZLENBQWE7SUFDekIsZ0JBQWdCLENBQWE7SUFDN0IsYUFBYSxDQUFxQjtJQUNsQyxNQUFNLENBQWdDO0lBQ3RDLGFBQWEsQ0FBaUI7SUFDOUIsaUJBQWlCLENBQWlCO0lBQ2xDLGFBQWEsQ0FBa0I7SUFFdEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBVSxLQUE0QjtRQUM1RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRCtCLFVBQUssR0FBTCxLQUFLLENBQXVCO1FBRzVFLFdBQVc7UUFDWCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUV6QixrQkFBa0I7UUFDbEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVELFFBQVE7UUFDUixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRUQsU0FBUztRQUNULElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXBDLE9BQU87UUFDUCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7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RyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN6QixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUEvU0QsNENBK1NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjgrnjg4jjg6zjg7zjgrjjgrPjg7Pjgrnjg4jjg6njgq/jg4hcbiAqIFxuICogUzPjgIFGU3ggZm9yIE5ldEFwcCBPTlRBUOOAgUVGU+OBrue1seWQiOeuoeeQhuOCkuaPkOS+m1xuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgZnN4IGZyb20gJ2F3cy1jZGstbGliL2F3cy1mc3gnO1xuaW1wb3J0ICogYXMgZWZzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lZnMnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBTdG9yYWdlQ29uZmlnLCBTdG9yYWdlT3V0cHV0cyB9IGZyb20gJy4uL2ludGVyZmFjZXMvc3RvcmFnZS1jb25maWcnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JhZ2VDb25zdHJ1Y3RQcm9wcyB7XG4gIGNvbmZpZzogU3RvcmFnZUNvbmZpZztcbiAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgdnBjPzogZWMyLklWcGM7XG4gIGttc0tleT86IGttcy5JS2V5O1xuICBwcml2YXRlU3VibmV0SWRzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBTdG9yYWdlQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IG91dHB1dHM6IFN0b3JhZ2VPdXRwdXRzO1xuICBwdWJsaWMgZG9jdW1lbnRzQnVja2V0PzogczMuQnVja2V0O1xuICBwdWJsaWMgYmFja3VwQnVja2V0PzogczMuQnVja2V0O1xuICBwdWJsaWMgZW1iZWRkaW5nc0J1Y2tldD86IHMzLkJ1Y2tldDtcbiAgcHVibGljIGZzeEZpbGVTeXN0ZW0/OiBmc3guQ2ZuRmlsZVN5c3RlbTtcbiAgcHVibGljIGZzeFN2bT86IGZzeC5DZm5TdG9yYWdlVmlydHVhbE1hY2hpbmU7XG4gIHB1YmxpYyBmc3hEYXRhVm9sdW1lPzogZnN4LkNmblZvbHVtZTtcbiAgcHVibGljIGZzeERhdGFiYXNlVm9sdW1lPzogZnN4LkNmblZvbHVtZTtcbiAgcHVibGljIGVmc0ZpbGVTeXN0ZW0/OiBlZnMuRmlsZVN5c3RlbTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcml2YXRlIHByb3BzOiBTdG9yYWdlQ29uc3RydWN0UHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gUzPjg5DjgrHjg4Pjg4jkvZzmiJBcbiAgICB0aGlzLmNyZWF0ZVMzUmVzb3VyY2VzKCk7XG5cbiAgICAvLyBGU3ggZm9yIE9OVEFQ5L2c5oiQXG4gICAgaWYgKHRoaXMucHJvcHMuY29uZmlnLmZzeE9udGFwLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlRlN4T250YXBSZXNvdXJjZXMoKTtcbiAgICB9XG5cbiAgICAvLyBFRlPkvZzmiJBcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuZWZzLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlRWZzUmVzb3VyY2VzKCk7XG4gICAgfVxuXG4gICAgLy8g5Ye65Yqb5YCk44Gu6Kit5a6aXG4gICAgdGhpcy5vdXRwdXRzID0gdGhpcy5jcmVhdGVPdXRwdXRzKCk7XG5cbiAgICAvLyDjgr/jgrDoqK3lrppcbiAgICB0aGlzLmFwcGx5VGFncygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFMz44Oq44K944O844K55L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVMzUmVzb3VyY2VzKCk6IHZvaWQge1xuICAgIC8vIERvY3VtZW50cyBCdWNrZXRcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuczMuZG9jdW1lbnRzLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuZG9jdW1lbnRzQnVja2V0ID0gdGhpcy5jcmVhdGVTM0J1Y2tldChcbiAgICAgICAgJ0RvY3VtZW50c0J1Y2tldCcsXG4gICAgICAgIHRoaXMucHJvcHMuY29uZmlnLnMzLmRvY3VtZW50cy5idWNrZXROYW1lLFxuICAgICAgICB0aGlzLnByb3BzLmNvbmZpZy5zMy5kb2N1bWVudHNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQmFja3VwIEJ1Y2tldFxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy5zMy5iYWNrdXAuZW5hYmxlZCkge1xuICAgICAgdGhpcy5iYWNrdXBCdWNrZXQgPSB0aGlzLmNyZWF0ZVMzQnVja2V0KFxuICAgICAgICAnQmFja3VwQnVja2V0JyxcbiAgICAgICAgdGhpcy5wcm9wcy5jb25maWcuczMuYmFja3VwLmJ1Y2tldE5hbWUsXG4gICAgICAgIHRoaXMucHJvcHMuY29uZmlnLnMzLmJhY2t1cFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBFbWJlZGRpbmdzIEJ1Y2tldFxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy5zMy5lbWJlZGRpbmdzLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuZW1iZWRkaW5nc0J1Y2tldCA9IHRoaXMuY3JlYXRlUzNCdWNrZXQoXG4gICAgICAgICdFbWJlZGRpbmdzQnVja2V0JyxcbiAgICAgICAgdGhpcy5wcm9wcy5jb25maWcuczMuZW1iZWRkaW5ncy5idWNrZXROYW1lLFxuICAgICAgICB0aGlzLnByb3BzLmNvbmZpZy5zMy5lbWJlZGRpbmdzXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTM+ODkOOCseODg+ODiOS9nOaIkOODmOODq+ODkeODvFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVTM0J1Y2tldChcbiAgICBpZDogc3RyaW5nLFxuICAgIGJ1Y2tldE5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICBjb25maWc6IGFueVxuICApOiBzMy5CdWNrZXQge1xuICAgIGNvbnN0IGxpZmVjeWNsZVJ1bGVzOiBzMy5MaWZlY3ljbGVSdWxlW10gPSBbXTtcblxuICAgIGlmIChjb25maWcubGlmZWN5Y2xlPy5lbmFibGVkKSB7XG4gICAgICBsaWZlY3ljbGVSdWxlcy5wdXNoKHtcbiAgICAgICAgaWQ6IGAke2lkfUxpZmVjeWNsZVJ1bGVgLFxuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLklORlJFUVVFTlRfQUNDRVNTLFxuICAgICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cyhjb25maWcubGlmZWN5Y2xlLnRyYW5zaXRpb25Ub0lBRGF5cyksXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5HTEFDSUVSLFxuICAgICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cyhjb25maWcubGlmZWN5Y2xlLnRyYW5zaXRpb25Ub0dsYWNpZXJEYXlzKSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBleHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cyhjb25maWcubGlmZWN5Y2xlLmV4cGlyYXRpb25EYXlzKSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgczMuQnVja2V0KHRoaXMsIGlkLCB7XG4gICAgICBidWNrZXROYW1lLFxuICAgICAgdmVyc2lvbmVkOiBjb25maWcudmVyc2lvbmluZyxcbiAgICAgIGVuY3J5cHRpb246IGNvbmZpZy5lbmNyeXB0aW9uLmVuYWJsZWRcbiAgICAgICAgPyAodGhpcy5wcm9wcy5rbXNLZXkgXG4gICAgICAgICAgICA/IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TIFxuICAgICAgICAgICAgOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQpXG4gICAgICAgIDogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgZW5jcnlwdGlvbktleTogY29uZmlnLmVuY3J5cHRpb24uZW5hYmxlZCA/IHRoaXMucHJvcHMua21zS2V5IDogdW5kZWZpbmVkLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIGxpZmVjeWNsZVJ1bGVzLFxuICAgICAgcmVtb3ZhbFBvbGljeTogdGhpcy5wcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2QnIFxuICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiBcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRoaXMucHJvcHMuZW52aXJvbm1lbnQgIT09ICdwcm9kJyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGU3ggZm9yIE9OVEFQIOODquOCveODvOOCueS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVGU3hPbnRhcFJlc291cmNlcygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMucHJvcHMudnBjIHx8ICF0aGlzLnByb3BzLnByaXZhdGVTdWJuZXRJZHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVlBDIGFuZCBwcml2YXRlIHN1Ym5ldHMgYXJlIHJlcXVpcmVkIGZvciBGU3ggT05UQVAnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZy5mc3hPbnRhcDtcblxuICAgIC8vIOODkOODg+OCr+OCouODg+ODl+ioreWumuOBruaknOiovO+8iOacrOeVqueSsOWig+S/neitt++8iVxuICAgIGNvbnN0IGJhY2t1cFJldGVudGlvbkRheXMgPSBjb25maWcuYXV0b21hdGljQmFja3VwUmV0ZW50aW9uRGF5cyA/PyAwO1xuICAgIFxuICAgIGlmICh0aGlzLnByb3BzLmVudmlyb25tZW50ID09PSAncHJvZCcgJiYgYmFja3VwUmV0ZW50aW9uRGF5cyA9PT0gMCkge1xuICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUJhY2t1cENvbmZpcm1lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ+acrOeVqueSsOWig+OBp0ZTeOiHquWLleODkOODg+OCr+OCouODg+ODl+OCkueEoeWKueWMluOBl+OCiOOBhuOBqOOBl+OBpuOBhOOBvuOBmeOAglxcbicgK1xuICAgICAgICAgICfjgZPjga7mk43kvZzjgpLlrp/ooYzjgZnjgovjgavjga/jgIHoqK3lrprjgacgZGlzYWJsZUJhY2t1cENvbmZpcm1lZD10cnVlIOOCkuioreWumuOBl+OBpuOBj+OBoOOBleOBhOOAglxcbicgK1xuICAgICAgICAgICfms6jmhI86IOiHquWLleODkOODg+OCr+OCouODg+ODl+OCkueEoeWKueWMluOBmeOCi+OBqOOAgeODh+ODvOOCv+aQjeWkseOBruODquOCueOCr+OBjOmrmOOBvuOCiuOBvuOBmeOAgidcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2Fybign4pqg77iPICDorablkYo6IOacrOeVqueSsOWig+OBp0ZTeOiHquWLleODkOODg+OCr+OCouODg+ODl+OBjOeEoeWKueWMluOBleOCjOOBpuOBhOOBvuOBmScpO1xuICAgICAgY29uc29sZS53YXJuKCfimqDvuI8gIOaJi+WLleODkOODg+OCr+OCouODg+ODl+OBruWumuacn+Wun+ihjOOCkuW8t+OBj+aOqOWlqOOBl+OBvuOBmScpO1xuICAgIH1cblxuICAgIC8vIOODkOODg+OCr+OCouODg+ODl+ioreWumuOBruODreOCsOWHuuWKm1xuICAgIGlmIChiYWNrdXBSZXRlbnRpb25EYXlzID09PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pyFIEZTeOiHquWLleODkOODg+OCr+OCouODg+ODlzog54Sh5Yq577yI44Kz44K544OI5pyA6YGp5YyW44Oi44O844OJ77yJJyk7XG4gICAgICBjb25zb2xlLmxvZygn4oS577iPICDmiYvli5Xjg5Djg4Pjgq/jgqLjg4Pjg5fjga/lvJXjgY3ntprjgY3liKnnlKjlj6/og73jgafjgZknKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYOKchSBGU3joh6rli5Xjg5Djg4Pjgq/jgqLjg4Pjg5c6IOacieWKue+8iOS/neaMgeacn+mWkzogJHtiYWNrdXBSZXRlbnRpb25EYXlzfeaXpe+8iWApO1xuICAgIH1cblxuICAgIC8vIEZTeCBGaWxlIFN5c3RlbeS9nOaIkFxuICAgIHRoaXMuZnN4RmlsZVN5c3RlbSA9IG5ldyBmc3guQ2ZuRmlsZVN5c3RlbSh0aGlzLCAnRlN4RmlsZVN5c3RlbScsIHtcbiAgICAgIGZpbGVTeXN0ZW1UeXBlOiAnT05UQVAnLFxuICAgICAgc3RvcmFnZUNhcGFjaXR5OiBjb25maWcuc3RvcmFnZUNhcGFjaXR5LFxuICAgICAgc3VibmV0SWRzOiBjb25maWcuZGVwbG95bWVudFR5cGUgPT09ICdTSU5HTEVfQVpfMScgXG4gICAgICAgID8gW2NvbmZpZy5wcmVmZXJyZWRTdWJuZXRJZCB8fCB0aGlzLnByb3BzLnByaXZhdGVTdWJuZXRJZHNbMF1dXG4gICAgICAgIDogdGhpcy5wcm9wcy5wcml2YXRlU3VibmV0SWRzLnNsaWNlKDAsIDIpLFxuICAgICAgb250YXBDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIGRlcGxveW1lbnRUeXBlOiBjb25maWcuZGVwbG95bWVudFR5cGUsXG4gICAgICAgIHRocm91Z2hwdXRDYXBhY2l0eTogY29uZmlnLnRocm91Z2hwdXRDYXBhY2l0eSxcbiAgICAgICAgcHJlZmVycmVkU3VibmV0SWQ6IGNvbmZpZy5wcmVmZXJyZWRTdWJuZXRJZCB8fCB0aGlzLnByb3BzLnByaXZhdGVTdWJuZXRJZHNbMF0sXG4gICAgICAgIHJvdXRlVGFibGVJZHM6IGNvbmZpZy5yb3V0ZVRhYmxlSWRzLFxuICAgICAgICAvLyDoh6rli5Xjg5Djg4Pjgq/jgqLjg4Pjg5foqK3lrprvvIgw44Gn54Sh5Yq55YyW77yJXG4gICAgICAgIGF1dG9tYXRpY0JhY2t1cFJldGVudGlvbkRheXM6IGJhY2t1cFJldGVudGlvbkRheXMsXG4gICAgICAgIC8vIOODkOODg+OCr+OCouODg+ODl+eEoeWKueaZguOBr2RhaWx5QXV0b21hdGljQmFja3VwU3RhcnRUaW1l44KS5pyq6Kit5a6aXG4gICAgICAgIGRhaWx5QXV0b21hdGljQmFja3VwU3RhcnRUaW1lOiBiYWNrdXBSZXRlbnRpb25EYXlzID4gMCBcbiAgICAgICAgICA/IGNvbmZpZy5kYWlseUF1dG9tYXRpY0JhY2t1cFN0YXJ0VGltZSBcbiAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgd2Vla2x5TWFpbnRlbmFuY2VTdGFydFRpbWU6IGNvbmZpZy53ZWVrbHlNYWludGVuYW5jZVN0YXJ0VGltZSxcbiAgICAgICAgZGlza0lvcHNDb25maWd1cmF0aW9uOiBjb25maWcuZGlza0lvcHNDb25maWd1cmF0aW9uLFxuICAgICAgfSxcbiAgICAgIHRhZ3M6IFt7XG4gICAgICAgIGtleTogJ05hbWUnLFxuICAgICAgICB2YWx1ZTogY29uZmlnLmZpbGVTeXN0ZW1OYW1lIHx8IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tZnN4YCxcbiAgICAgIH1dLFxuICAgIH0pO1xuXG4gICAgLy8gU3RvcmFnZSBWaXJ0dWFsIE1hY2hpbmUgKFNWTSkg5L2c5oiQXG4gICAgdGhpcy5mc3hTdm0gPSBuZXcgZnN4LkNmblN0b3JhZ2VWaXJ0dWFsTWFjaGluZSh0aGlzLCAnRlN4U1ZNJywge1xuICAgICAgZmlsZVN5c3RlbUlkOiB0aGlzLmZzeEZpbGVTeXN0ZW0ucmVmLFxuICAgICAgbmFtZTogY29uZmlnLnN2bS5uYW1lIHx8IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tc3ZtYCxcbiAgICAgIHJvb3RWb2x1bWVTZWN1cml0eVN0eWxlOiBjb25maWcuc3ZtLnJvb3RWb2x1bWVTZWN1cml0eVN0eWxlLFxuICAgICAgYWN0aXZlRGlyZWN0b3J5Q29uZmlndXJhdGlvbjogY29uZmlnLnN2bS5hY3RpdmVEaXJlY3RvcnlDb25maWd1cmF0aW9uLFxuICAgICAgdGFnczogW3tcbiAgICAgICAga2V5OiAnTmFtZScsXG4gICAgICAgIHZhbHVlOiBjb25maWcuc3ZtLm5hbWUgfHwgYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1zdm1gLFxuICAgICAgfV0sXG4gICAgfSk7XG5cbiAgICAvLyBEYXRhIFZvbHVtZeS9nOaIkFxuICAgIGlmIChjb25maWcudm9sdW1lcy5kYXRhLmVuYWJsZWQpIHtcbiAgICAgIC8vIEZTeCBPTlRBUOODnOODquODpeODvOODoOWQjeOBr+ODj+OCpOODleODs+OBjOS9v+eUqOOBp+OBjeOBquOBhOOBn+OCgeOAgeOCouODs+ODgOODvOOCueOCs+OCouOBq+e9ruOBjeaPm+OBiFxuICAgICAgY29uc3QgZGF0YVZvbHVtZU5hbWUgPSBjb25maWcudm9sdW1lcy5kYXRhLm5hbWUgfHwgYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZS5yZXBsYWNlKC8tL2csICdfJyl9XyR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH1fZGF0YWA7XG4gICAgICBcbiAgICAgIHRoaXMuZnN4RGF0YVZvbHVtZSA9IG5ldyBmc3guQ2ZuVm9sdW1lKHRoaXMsICdGU3hEYXRhVm9sdW1lJywge1xuICAgICAgICBuYW1lOiBkYXRhVm9sdW1lTmFtZSxcbiAgICAgICAgdm9sdW1lVHlwZTogJ09OVEFQJyxcbiAgICAgICAgb250YXBDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgc3RvcmFnZVZpcnR1YWxNYWNoaW5lSWQ6IHRoaXMuZnN4U3ZtLnJlZixcbiAgICAgICAgICBqdW5jdGlvblBhdGg6IGNvbmZpZy52b2x1bWVzLmRhdGEuanVuY3Rpb25QYXRoLFxuICAgICAgICAgIHNpemVJbk1lZ2FieXRlczogY29uZmlnLnZvbHVtZXMuZGF0YS5zaXplSW5NZWdhYnl0ZXMudG9TdHJpbmcoKSxcbiAgICAgICAgICBzdG9yYWdlRWZmaWNpZW5jeUVuYWJsZWQ6IGNvbmZpZy52b2x1bWVzLmRhdGEuc3RvcmFnZUVmZmljaWVuY3lFbmFibGVkLnRvU3RyaW5nKCksXG4gICAgICAgICAgc2VjdXJpdHlTdHlsZTogY29uZmlnLnZvbHVtZXMuZGF0YS5zZWN1cml0eVN0eWxlLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiBbe1xuICAgICAgICAgIGtleTogJ05hbWUnLFxuICAgICAgICAgIHZhbHVlOiBkYXRhVm9sdW1lTmFtZSxcbiAgICAgICAgfV0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBEYXRhYmFzZSBWb2x1bWXkvZzmiJBcbiAgICBpZiAoY29uZmlnLnZvbHVtZXMuZGF0YWJhc2UuZW5hYmxlZCkge1xuICAgICAgLy8gRlN4IE9OVEFQ44Oc44Oq44Ol44O844Og5ZCN44Gv44OP44Kk44OV44Oz44GM5L2/55So44Gn44GN44Gq44GE44Gf44KB44CB44Ki44Oz44OA44O844K544Kz44Ki44Gr572u44GN5o+b44GIXG4gICAgICBjb25zdCBkYXRhYmFzZVZvbHVtZU5hbWUgPSBjb25maWcudm9sdW1lcy5kYXRhYmFzZS5uYW1lIHx8IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWUucmVwbGFjZSgvLS9nLCAnXycpfV8ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9X2RhdGFiYXNlYDtcbiAgICAgIFxuICAgICAgdGhpcy5mc3hEYXRhYmFzZVZvbHVtZSA9IG5ldyBmc3guQ2ZuVm9sdW1lKHRoaXMsICdGU3hEYXRhYmFzZVZvbHVtZScsIHtcbiAgICAgICAgbmFtZTogZGF0YWJhc2VWb2x1bWVOYW1lLFxuICAgICAgICB2b2x1bWVUeXBlOiAnT05UQVAnLFxuICAgICAgICBvbnRhcENvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBzdG9yYWdlVmlydHVhbE1hY2hpbmVJZDogdGhpcy5mc3hTdm0ucmVmLFxuICAgICAgICAgIGp1bmN0aW9uUGF0aDogY29uZmlnLnZvbHVtZXMuZGF0YWJhc2UuanVuY3Rpb25QYXRoLFxuICAgICAgICAgIHNpemVJbk1lZ2FieXRlczogY29uZmlnLnZvbHVtZXMuZGF0YWJhc2Uuc2l6ZUluTWVnYWJ5dGVzLnRvU3RyaW5nKCksXG4gICAgICAgICAgc3RvcmFnZUVmZmljaWVuY3lFbmFibGVkOiBjb25maWcudm9sdW1lcy5kYXRhYmFzZS5zdG9yYWdlRWZmaWNpZW5jeUVuYWJsZWQudG9TdHJpbmcoKSxcbiAgICAgICAgICBzZWN1cml0eVN0eWxlOiBjb25maWcudm9sdW1lcy5kYXRhYmFzZS5zZWN1cml0eVN0eWxlLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiBbe1xuICAgICAgICAgIGtleTogJ05hbWUnLFxuICAgICAgICAgIHZhbHVlOiBkYXRhYmFzZVZvbHVtZU5hbWUsXG4gICAgICAgIH1dLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVGUyDjg6rjgr3jg7zjgrnkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRWZzUmVzb3VyY2VzKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5wcm9wcy52cGMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVlBDIGlzIHJlcXVpcmVkIGZvciBFRlMnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZy5lZnM7XG5cbiAgICB0aGlzLmVmc0ZpbGVTeXN0ZW0gPSBuZXcgZWZzLkZpbGVTeXN0ZW0odGhpcywgJ0Vmc0ZpbGVTeXN0ZW0nLCB7XG4gICAgICB2cGM6IHRoaXMucHJvcHMudnBjLFxuICAgICAgcGVyZm9ybWFuY2VNb2RlOiBjb25maWcucGVyZm9ybWFuY2VNb2RlID09PSAnZ2VuZXJhbFB1cnBvc2UnIFxuICAgICAgICA/IGVmcy5QZXJmb3JtYW5jZU1vZGUuR0VORVJBTF9QVVJQT1NFIFxuICAgICAgICA6IGVmcy5QZXJmb3JtYW5jZU1vZGUuTUFYX0lPLFxuICAgICAgdGhyb3VnaHB1dE1vZGU6IGNvbmZpZy50aHJvdWdocHV0TW9kZSA9PT0gJ3Byb3Zpc2lvbmVkJyBcbiAgICAgICAgPyBlZnMuVGhyb3VnaHB1dE1vZGUuUFJPVklTSU9ORUQgXG4gICAgICAgIDogZWZzLlRocm91Z2hwdXRNb2RlLkJVUlNUSU5HLFxuICAgICAgcHJvdmlzaW9uZWRUaHJvdWdocHV0UGVyU2Vjb25kOiBjb25maWcudGhyb3VnaHB1dE1vZGUgPT09ICdwcm92aXNpb25lZCcgXG4gICAgICAgID8gY2RrLlNpemUubWViaWJ5dGVzKGNvbmZpZy5wcm92aXNpb25lZFRocm91Z2hwdXRJbk1pYnBzIHx8IDEwMClcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBlbmNyeXB0ZWQ6IGNvbmZpZy5lbmNyeXB0ZWQsXG4gICAgICBrbXNLZXk6IGNvbmZpZy5lbmNyeXB0ZWQgPyB0aGlzLnByb3BzLmttc0tleSA6IHVuZGVmaW5lZCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IHRoaXMucHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kJyBcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlh7rlipvlgKTkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0cygpOiBTdG9yYWdlT3V0cHV0cyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC8vIFMz5Ye65YqbXG4gICAgICBkb2N1bWVudHNCdWNrZXROYW1lOiB0aGlzLmRvY3VtZW50c0J1Y2tldD8uYnVja2V0TmFtZSxcbiAgICAgIGRvY3VtZW50c0J1Y2tldEFybjogdGhpcy5kb2N1bWVudHNCdWNrZXQ/LmJ1Y2tldEFybixcbiAgICAgIGJhY2t1cEJ1Y2tldE5hbWU6IHRoaXMuYmFja3VwQnVja2V0Py5idWNrZXROYW1lLFxuICAgICAgYmFja3VwQnVja2V0QXJuOiB0aGlzLmJhY2t1cEJ1Y2tldD8uYnVja2V0QXJuLFxuICAgICAgZW1iZWRkaW5nc0J1Y2tldE5hbWU6IHRoaXMuZW1iZWRkaW5nc0J1Y2tldD8uYnVja2V0TmFtZSxcbiAgICAgIGVtYmVkZGluZ3NCdWNrZXRBcm46IHRoaXMuZW1iZWRkaW5nc0J1Y2tldD8uYnVja2V0QXJuLFxuXG4gICAgICAvLyBGU3jlh7rliptcbiAgICAgIGZzeEZpbGVTeXN0ZW1JZDogdGhpcy5mc3hGaWxlU3lzdGVtPy5yZWYsXG4gICAgICBmc3hGaWxlU3lzdGVtQXJuOiB0aGlzLmZzeEZpbGVTeXN0ZW0/LmF0dHJSZXNvdXJjZUFybixcbiAgICAgIGZzeEZpbGVTeXN0ZW1EbnNOYW1lOiB0aGlzLmZzeEZpbGVTeXN0ZW0/LmF0dHJEbnNOYW1lLFxuICAgICAgZnN4U3ZtSWQ6IHRoaXMuZnN4U3ZtPy5yZWYsXG4gICAgICBmc3hEYXRhVm9sdW1lSWQ6IHRoaXMuZnN4RGF0YVZvbHVtZT8ucmVmLFxuICAgICAgZnN4RGF0YWJhc2VWb2x1bWVJZDogdGhpcy5mc3hEYXRhYmFzZVZvbHVtZT8ucmVmLFxuXG4gICAgICAvLyBFRlPlh7rliptcbiAgICAgIGVmc0ZpbGVTeXN0ZW1JZDogdGhpcy5lZnNGaWxlU3lzdGVtPy5maWxlU3lzdGVtSWQsXG4gICAgICBlZnNGaWxlU3lzdGVtQXJuOiB0aGlzLmVmc0ZpbGVTeXN0ZW0/LmZpbGVTeXN0ZW1Bcm4sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgr/jgrDpgannlKhcbiAgICovXG4gIHByaXZhdGUgYXBwbHlUYWdzKCk6IHZvaWQge1xuICAgIGNvbnN0IHRhZ3MgPSB0aGlzLnByb3BzLmNvbmZpZy50YWdzO1xuICAgIFxuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RvcmFnZVR5cGUnLCB0YWdzLlN0b3JhZ2VUeXBlKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0JhY2t1cEVuYWJsZWQnLCB0YWdzLkJhY2t1cEVuYWJsZWQudG9TdHJpbmcoKSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbmNyeXB0aW9uRW5hYmxlZCcsIHRhZ3MuRW5jcnlwdGlvbkVuYWJsZWQudG9TdHJpbmcoKSk7XG4gICAgXG4gICAgaWYgKHRhZ3MuRGF0YUNsYXNzaWZpY2F0aW9uKSB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0RhdGFDbGFzc2lmaWNhdGlvbicsIHRhZ3MuRGF0YUNsYXNzaWZpY2F0aW9uKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRhZ3MuUmV0ZW50aW9uUGVyaW9kKSB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1JldGVudGlvblBlcmlvZCcsIHRhZ3MuUmV0ZW50aW9uUGVyaW9kKTtcbiAgICB9XG4gIH1cbn0iXX0=