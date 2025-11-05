"use strict";
/**
 * DataStack - 統合データスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合ストレージ・データベースコンストラクトによる一元管理
 * - S3・FSx・DynamoDB・OpenSearchの統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
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
exports.DataStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
// 統合ストレージコンストラクト（モジュラーアーキテクチャ）
const storage_construct_1 = require("../../modules/storage/constructs/storage-construct");
// 統合データベースコンストラクト（モジュラーアーキテクチャ）
const database_construct_1 = require("../../modules/database/constructs/database-construct");
/**
 * 統合データスタック（モジュラーアーキテクチャ対応）
 *
 * 統合ストレージ・データベースコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
class DataStack extends cdk.Stack {
    /** 統合ストレージコンストラクト */
    storage;
    /** 統合データベースコンストラクト */
    database;
    /** S3バケット名（他スタックからの参照用） */
    s3BucketNames = {};
    /** DynamoDBテーブル名（他スタックからの参照用） */
    dynamoDbTableNames = {};
    /** OpenSearchドメインエンドポイント（他スタックからの参照用） */
    openSearchEndpoint;
    constructor(scope, id, props) {
        super(scope, id, props);
        console.log('💾 DataStack初期化開始...');
        console.log('📝 スタック名:', id);
        console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');
        // セキュリティスタックとの依存関係設定（存在する場合）
        if (props.securityStack) {
            this.addDependency(props.securityStack);
            console.log('🔗 SecurityStackとの依存関係設定完了');
        }
        // 統合ストレージコンストラクト作成
        this.storage = new storage_construct_1.StorageConstruct(this, 'Storage', {
            config: props.config.storage,
            projectName: props.config.project.name,
            environment: props.config.environment,
            kmsKey: props.securityStack?.kmsKey,
            namingGenerator: props.namingGenerator,
        });
        // 統合データベースコンストラクト作成
        this.database = new database_construct_1.DatabaseConstruct(this, 'Database', {
            config: props.config.database,
            projectName: props.config.project.name,
            environment: props.config.environment,
            kmsKey: props.securityStack?.kmsKey,
            namingGenerator: props.namingGenerator,
        });
        // 他スタックからの参照用プロパティ設定
        this.setupCrossStackReferences();
        // スタック出力
        this.createOutputs();
        // タグ設定
        this.addStackTags();
        console.log('✅ DataStack初期化完了');
    }
    /**
     * 他スタックからの参照用プロパティ設定
     */
    setupCrossStackReferences() {
        // S3バケット名の設定（存在する場合）
        if (this.storage.outputs?.s3Buckets) {
            Object.entries(this.storage.outputs.s3Buckets).forEach(([name, bucket]) => {
                if (bucket && typeof bucket === 'object' && 'bucketName' in bucket) {
                    this.s3BucketNames[name] = bucket.bucketName;
                }
            });
        }
        // DynamoDBテーブル名の設定（存在する場合）
        if (this.database.outputs?.dynamoDbTables) {
            Object.entries(this.database.outputs.dynamoDbTables).forEach(([name, table]) => {
                if (table && typeof table === 'object' && 'tableName' in table) {
                    this.dynamoDbTableNames[name] = table.tableName;
                }
            });
        }
        // OpenSearchエンドポイントの設定（存在する場合）
        if (this.database.outputs?.openSearchEndpoint) {
            this.openSearchEndpoint = this.database.outputs.openSearchEndpoint;
        }
        console.log('🔗 他スタック参照用プロパティ設定完了');
    }
    /**
     * スタック出力作成（個別デプロイ対応）
     */
    createOutputs() {
        // S3バケット名出力（他スタックからの参照用）
        Object.entries(this.s3BucketNames).forEach(([name, bucketName]) => {
            new cdk.CfnOutput(this, `S3Bucket${name}Name`, {
                value: bucketName,
                description: `S3 ${name} Bucket Name`,
                exportName: `${this.stackName}-S3Bucket${name}Name`,
            });
        });
        // DynamoDBテーブル名出力（他スタックからの参照用）
        Object.entries(this.dynamoDbTableNames).forEach(([name, tableName]) => {
            new cdk.CfnOutput(this, `DynamoDb${name}TableName`, {
                value: tableName,
                description: `DynamoDB ${name} Table Name`,
                exportName: `${this.stackName}-DynamoDb${name}TableName`,
            });
        });
        // OpenSearchエンドポイント出力（存在する場合のみ）
        if (this.openSearchEndpoint) {
            new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
                value: this.openSearchEndpoint,
                description: 'OpenSearch Domain Endpoint',
                exportName: `${this.stackName}-OpenSearchEndpoint`,
            });
        }
        // ストレージ統合出力（存在する場合のみ）
        if (this.storage.outputs) {
            // FSx File System ID
            if (this.storage.outputs.fsxFileSystemId) {
                new cdk.CfnOutput(this, 'FsxFileSystemId', {
                    value: this.storage.outputs.fsxFileSystemId,
                    description: 'FSx for NetApp ONTAP File System ID',
                    exportName: `${this.stackName}-FsxFileSystemId`,
                });
            }
            // EFS File System ID
            if (this.storage.outputs.efsFileSystemId) {
                new cdk.CfnOutput(this, 'EfsFileSystemId', {
                    value: this.storage.outputs.efsFileSystemId,
                    description: 'EFS File System ID',
                    exportName: `${this.stackName}-EfsFileSystemId`,
                });
            }
        }
        console.log('📤 DataStack出力値作成完了');
    }
    /**
     * スタックタグ設定（Agent Steering準拠）
     */
    addStackTags() {
        cdk.Tags.of(this).add('Module', 'Storage+Database');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Architecture', 'Modular');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('StorageTypes', 'S3+FSx+EFS');
        cdk.Tags.of(this).add('DatabaseTypes', 'DynamoDB+OpenSearch');
        cdk.Tags.of(this).add('IndividualDeploySupport', 'Yes');
        console.log('🏷️ DataStackタグ設定完了');
    }
    /** FSx for NetApp ONTAPコンストラクト */
    fsx;
    /** EFSコンストラクト */
    efs;
    /** DynamoDBコンストラクト */
    dynamoDb;
    /** OpenSearchコンストラクト */
    openSearch;
    /** RDSコンストラクト */
    rds;
    constructor(scope, id, props) {
        super(scope, id, props);
        // スタック依存関係設定
        this.addDependency(props.networkingStack);
        this.addDependency(props.securityStack);
        // S3ストレージ作成
        this.s3 = new S3Construct(this, 'S3', {
            projectName: props.projectName,
            environment: props.environment,
            kmsKey: props.securityStack.kms.mainKey,
            s3Config: props.storageConfig.s3,
        });
        // FSx for NetApp ONTAP作成
        this.fsx = new FsxConstruct(this, 'Fsx', {
            projectName: props.projectName,
            environment: props.environment,
            vpc: props.networkingStack.vpc.vpc,
            privateSubnets: props.networkingStack.subnets.privateSubnets,
            securityGroup: props.networkingStack.securityGroups.fsxSecurityGroup,
            kmsKey: props.securityStack.kms.mainKey,
            fsxConfig: props.storageConfig.fsx,
        });
        // EFS作成
        this.efs = new EfsConstruct(this, 'Efs', {
            projectName: props.projectName,
            environment: props.environment,
            vpc: props.networkingStack.vpc.vpc,
            privateSubnets: props.networkingStack.subnets.privateSubnets,
            securityGroup: props.networkingStack.securityGroups.efsSecurityGroup,
            kmsKey: props.securityStack.kms.mainKey,
            efsConfig: props.storageConfig.efs,
        });
        // DynamoDB作成
        this.dynamoDb = new DynamoDbConstruct(this, 'DynamoDb', {
            projectName: props.projectName,
            environment: props.environment,
            kmsKey: props.securityStack.kms.mainKey,
            dynamoDbConfig: props.databaseConfig.dynamoDb,
        });
        // OpenSearch Serverless作成
        this.openSearch = new OpenSearchConstruct(this, 'OpenSearch', {
            projectName: props.projectName,
            environment: props.environment,
            vpc: props.networkingStack.vpc.vpc,
            privateSubnets: props.networkingStack.subnets.privateSubnets,
            securityGroup: props.networkingStack.securityGroups.openSearchSecurityGroup,
            kmsKey: props.securityStack.kms.mainKey,
            openSearchConfig: props.databaseConfig.openSearch,
        });
        // RDS作成（オプション）
        if (props.databaseConfig.rds.enabled) {
            this.rds = new RdsConstruct(this, 'Rds', {
                projectName: props.projectName,
                environment: props.environment,
                vpc: props.networkingStack.vpc.vpc,
                databaseSubnets: props.networkingStack.subnets.databaseSubnets,
                securityGroup: props.networkingStack.securityGroups.rdsSecurityGroup,
                kmsKey: props.securityStack.kms.mainKey,
                rdsConfig: props.databaseConfig.rds,
            });
        }
        // スタック出力
        this.createOutputs();
        // タグ設定
        this.addStackTags(props);
    }
    /**
     * スタック出力作成
     */
    createOutputs() {
        // S3出力
        new cdk.CfnOutput(this, 'DocumentsBucketName', {
            value: this.s3.documentsBucket.bucketName,
            description: 'Documents S3 Bucket Name',
            exportName: `${this.stackName}-DocumentsBucketName`,
        });
        new cdk.CfnOutput(this, 'DocumentsBucketArn', {
            value: this.s3.documentsBucket.bucketArn,
            description: 'Documents S3 Bucket ARN',
            exportName: `${this.stackName}-DocumentsBucketArn`,
        });
        // FSx出力
        new cdk.CfnOutput(this, 'FsxFileSystemId', {
            value: this.fsx.fileSystem.ref,
            description: 'FSx File System ID',
            exportName: `${this.stackName}-FsxFileSystemId`,
        });
        new cdk.CfnOutput(this, 'FsxDnsName', {
            value: this.fsx.fileSystem.attrDnsName,
            description: 'FSx DNS Name',
            exportName: `${this.stackName}-FsxDnsName`,
        });
        // DynamoDB出力
        new cdk.CfnOutput(this, 'SessionsTableName', {
            value: this.dynamoDb.sessionsTable.tableName,
            description: 'Sessions DynamoDB Table Name',
            exportName: `${this.stackName}-SessionsTableName`,
        });
        new cdk.CfnOutput(this, 'SessionsTableArn', {
            value: this.dynamoDb.sessionsTable.tableArn,
            description: 'Sessions DynamoDB Table ARN',
            exportName: `${this.stackName}-SessionsTableArn`,
        });
        // OpenSearch出力
        new cdk.CfnOutput(this, 'OpenSearchCollectionArn', {
            value: this.openSearch.collection.attrArn,
            description: 'OpenSearch Collection ARN',
            exportName: `${this.stackName}-OpenSearchCollectionArn`,
        });
        new cdk.CfnOutput(this, 'OpenSearchCollectionEndpoint', {
            value: this.openSearch.collection.attrCollectionEndpoint,
            description: 'OpenSearch Collection Endpoint',
            exportName: `${this.stackName}-OpenSearchCollectionEndpoint`,
        });
    }
    /**
     * スタックタグ設定
     */
    addStackTags(props) {
        cdk.Tags.of(this).add('Module', 'Data');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Project', props.projectName);
        cdk.Tags.of(this).add('Environment', props.environment);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('DataClassification', 'Sensitive');
    }
}
exports.DataStack = DataStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUduQywrQkFBK0I7QUFDL0IsMEZBQXNGO0FBRXRGLGdDQUFnQztBQUNoQyw2RkFBeUY7QUFlekY7Ozs7O0dBS0c7QUFDSCxNQUFhLFNBQVUsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN0QyxxQkFBcUI7SUFDTCxPQUFPLENBQW1CO0lBRTFDLHNCQUFzQjtJQUNOLFFBQVEsQ0FBb0I7SUFFNUMsMkJBQTJCO0lBQ1gsYUFBYSxHQUE4QixFQUFFLENBQUM7SUFFOUQsaUNBQWlDO0lBQ2pCLGtCQUFrQixHQUE4QixFQUFFLENBQUM7SUFFbkUseUNBQXlDO0lBQ3pCLGtCQUFrQixDQUFVO0lBRTVDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBcUI7UUFDN0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUzRSw2QkFBNkI7UUFDN0IsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxtQkFBbUI7UUFDbkIsSUFBSSxDQUFDLE9B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QXFCO1FBQ3hDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNqRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN4RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUMzRCxDQUFDO0NBQ0Y7QUE5VEQsOEJBOFRDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBEYXRhU3RhY2sgLSDntbHlkIjjg4fjg7zjgr/jgrnjgr/jg4Pjgq/vvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plr77lv5zvvIlcbiAqIFxuICog5qmf6IO9OlxuICogLSDntbHlkIjjgrnjg4jjg6zjg7zjgrjjg7vjg4fjg7zjgr/jg5njg7zjgrnjgrPjg7Pjgrnjg4jjg6njgq/jg4jjgavjgojjgovkuIDlhYPnrqHnkIZcbiAqIC0gUzPjg7tGU3jjg7tEeW5hbW9EQuODu09wZW5TZWFyY2jjga7ntbHlkIhcbiAqIC0gQWdlbnQgU3RlZXJpbmfmupbmi6Dlkb3lkI3opo/liYflr77lv5xcbiAqIC0g5YCL5Yil44K544K/44OD44Kv44OH44OX44Ot44Kk5a6M5YWo5a++5b+cXG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vLyDntbHlkIjjgrnjg4jjg6zjg7zjgrjjgrPjg7Pjgrnjg4jjg6njgq/jg4jvvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6PvvIlcbmltcG9ydCB7IFN0b3JhZ2VDb25zdHJ1Y3QgfSBmcm9tICcuLi8uLi9tb2R1bGVzL3N0b3JhZ2UvY29uc3RydWN0cy9zdG9yYWdlLWNvbnN0cnVjdCc7XG5cbi8vIOe1seWQiOODh+ODvOOCv+ODmeODvOOCueOCs+ODs+OCueODiOODqeOCr+ODiO+8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo++8iVxuaW1wb3J0IHsgRGF0YWJhc2VDb25zdHJ1Y3QgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2RhdGFiYXNlL2NvbnN0cnVjdHMvZGF0YWJhc2UtY29uc3RydWN0JztcblxuLy8g44Kk44Oz44K/44O844OV44Kn44O844K5XG5pbXBvcnQgeyBTdG9yYWdlQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9zdG9yYWdlL2ludGVyZmFjZXMvc3RvcmFnZS1jb25maWcnO1xuaW1wb3J0IHsgRGF0YWJhc2VDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2RhdGFiYXNlL2ludGVyZmFjZXMvZGF0YWJhc2UtY29uZmlnJztcblxuLy8g5LuW44K544K/44OD44Kv44GL44KJ44Gu5L6d5a2Y6Zai5L+CXG5pbXBvcnQgeyBTZWN1cml0eVN0YWNrIH0gZnJvbSAnLi9zZWN1cml0eS1zdGFjayc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHJlYWRvbmx5IGNvbmZpZzogYW55OyAvLyDntbHlkIjoqK3lrprjgqrjg5bjgrjjgqfjgq/jg4hcbiAgcmVhZG9ubHkgc2VjdXJpdHlTdGFjaz86IFNlY3VyaXR5U3RhY2s7IC8vIOOCu+OCreODpeODquODhuOCo+OCueOCv+ODg+OCr++8iOOCquODl+OCt+ODp+ODs++8iVxuICByZWFkb25seSBuYW1pbmdHZW5lcmF0b3I/OiBhbnk7IC8vIEFnZW50IFN0ZWVyaW5n5rqW5oug5ZG95ZCN44K444Kn44ON44Os44O844K/44O877yI44Kq44OX44K344On44Oz77yJXG59XG5cbi8qKlxuICog57Wx5ZCI44OH44O844K/44K544K/44OD44Kv77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj5a++5b+c77yJXG4gKiBcbiAqIOe1seWQiOOCueODiOODrOODvOOCuOODu+ODh+ODvOOCv+ODmeODvOOCueOCs+ODs+OCueODiOODqeOCr+ODiOOBq+OCiOOCi+S4gOWFg+euoeeQhlxuICog5YCL5Yil44K544K/44OD44Kv44OH44OX44Ot44Kk5a6M5YWo5a++5b+cXG4gKi9cbmV4cG9ydCBjbGFzcyBEYXRhU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAvKiog57Wx5ZCI44K544OI44Os44O844K444Kz44Oz44K544OI44Op44Kv44OIICovXG4gIHB1YmxpYyByZWFkb25seSBzdG9yYWdlOiBTdG9yYWdlQ29uc3RydWN0O1xuICBcbiAgLyoqIOe1seWQiOODh+ODvOOCv+ODmeODvOOCueOCs+ODs+OCueODiOODqeOCr+ODiCAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YWJhc2U6IERhdGFiYXNlQ29uc3RydWN0O1xuICBcbiAgLyoqIFMz44OQ44Kx44OD44OI5ZCN77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJICovXG4gIHB1YmxpYyByZWFkb25seSBzM0J1Y2tldE5hbWVzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG4gIFxuICAvKiogRHluYW1vRELjg4bjg7zjg5bjg6vlkI3vvIjku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjvvIkgKi9cbiAgcHVibGljIHJlYWRvbmx5IGR5bmFtb0RiVGFibGVOYW1lczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuICBcbiAgLyoqIE9wZW5TZWFyY2jjg4njg6HjgqTjg7Pjgqjjg7Pjg4njg53jgqTjg7Pjg4jvvIjku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjvvIkgKi9cbiAgcHVibGljIHJlYWRvbmx5IG9wZW5TZWFyY2hFbmRwb2ludD86IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRGF0YVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnNvbGUubG9nKCfwn5K+IERhdGFTdGFja+WIneacn+WMlumWi+Wniy4uLicpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OdIOOCueOCv+ODg+OCr+WQjTonLCBpZCk7XG4gICAgY29uc29sZS5sb2coJ/Cfj7fvuI8gQWdlbnQgU3RlZXJpbmfmupbmi6A6JywgcHJvcHMubmFtaW5nR2VuZXJhdG9yID8gJ1llcycgOiAnTm8nKTtcblxuICAgIC8vIOOCu+OCreODpeODquODhuOCo+OCueOCv+ODg+OCr+OBqOOBruS+neWtmOmWouS/guioreWumu+8iOWtmOWcqOOBmeOCi+WgtOWQiO+8iVxuICAgIGlmIChwcm9wcy5zZWN1cml0eVN0YWNrKSB7XG4gICAgICB0aGlzLmFkZERlcGVuZGVuY3kocHJvcHMuc2VjdXJpdHlTdGFjayk7XG4gICAgICBjb25zb2xlLmxvZygn8J+UlyBTZWN1cml0eVN0YWNr44Go44Gu5L6d5a2Y6Zai5L+C6Kit5a6a5a6M5LqGJyk7XG4gICAgfVxuXG4gICAgLy8g57Wx5ZCI44K544OI44Os44O844K444Kz44Oz44K544OI44Op44Kv44OI5L2c5oiQXG4gICAgdGhpcy5zdG9yYWdlID0gbmV3IFN0b3JhZ2VDb25zdHJ1Y3QodGhpcywgJ1N0b3JhZ2UnLCB7XG4gICAgICBjb25maWc6IHByb3BzLmNvbmZpZy5zdG9yYWdlLFxuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLmNvbmZpZy5wcm9qZWN0Lm5hbWUsXG4gICAgICBlbnZpcm9ubWVudDogcHJvcHMuY29uZmlnLmVudmlyb25tZW50LFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrPy5rbXNLZXksXG4gICAgICBuYW1pbmdHZW5lcmF0b3I6IHByb3BzLm5hbWluZ0dlbmVyYXRvcixcbiAgICB9KTtcblxuICAgIC8vIOe1seWQiOODh+ODvOOCv+ODmeODvOOCueOCs+ODs+OCueODiOODqeOCr+ODiOS9nOaIkFxuICAgIHRoaXMuZGF0YWJhc2UgPSBuZXcgRGF0YWJhc2VDb25zdHJ1Y3QodGhpcywgJ0RhdGFiYXNlJywge1xuICAgICAgY29uZmlnOiBwcm9wcy5jb25maWcuZGF0YWJhc2UsXG4gICAgICBwcm9qZWN0TmFtZTogcHJvcHMuY29uZmlnLnByb2plY3QubmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5jb25maWcuZW52aXJvbm1lbnQsXG4gICAgICBrbXNLZXk6IHByb3BzLnNlY3VyaXR5U3RhY2s/Lmttc0tleSxcbiAgICAgIG5hbWluZ0dlbmVyYXRvcjogcHJvcHMubmFtaW5nR2VuZXJhdG9yLFxuICAgIH0pO1xuXG4gICAgLy8g5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6aXG4gICAgdGhpcy5zZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk7XG5cbiAgICAvLyDjgrnjgr/jg4Pjgq/lh7rliptcbiAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcblxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIHRoaXMuYWRkU3RhY2tUYWdzKCk7XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIERhdGFTdGFja+WIneacn+WMluWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqOODl+ODreODkeODhuOCo+ioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk6IHZvaWQge1xuICAgIC8vIFMz44OQ44Kx44OD44OI5ZCN44Gu6Kit5a6a77yI5a2Y5Zyo44GZ44KL5aC05ZCI77yJXG4gICAgaWYgKHRoaXMuc3RvcmFnZS5vdXRwdXRzPy5zM0J1Y2tldHMpIHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuc3RvcmFnZS5vdXRwdXRzLnMzQnVja2V0cykuZm9yRWFjaCgoW25hbWUsIGJ1Y2tldF0pID0+IHtcbiAgICAgICAgaWYgKGJ1Y2tldCAmJiB0eXBlb2YgYnVja2V0ID09PSAnb2JqZWN0JyAmJiAnYnVja2V0TmFtZScgaW4gYnVja2V0KSB7XG4gICAgICAgICAgdGhpcy5zM0J1Y2tldE5hbWVzW25hbWVdID0gYnVja2V0LmJ1Y2tldE5hbWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIER5bmFtb0RC44OG44O844OW44Or5ZCN44Gu6Kit5a6a77yI5a2Y5Zyo44GZ44KL5aC05ZCI77yJXG4gICAgaWYgKHRoaXMuZGF0YWJhc2Uub3V0cHV0cz8uZHluYW1vRGJUYWJsZXMpIHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuZGF0YWJhc2Uub3V0cHV0cy5keW5hbW9EYlRhYmxlcykuZm9yRWFjaCgoW25hbWUsIHRhYmxlXSkgPT4ge1xuICAgICAgICBpZiAodGFibGUgJiYgdHlwZW9mIHRhYmxlID09PSAnb2JqZWN0JyAmJiAndGFibGVOYW1lJyBpbiB0YWJsZSkge1xuICAgICAgICAgIHRoaXMuZHluYW1vRGJUYWJsZU5hbWVzW25hbWVdID0gdGFibGUudGFibGVOYW1lO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBPcGVuU2VhcmNo44Ko44Oz44OJ44Od44Kk44Oz44OI44Gu6Kit5a6a77yI5a2Y5Zyo44GZ44KL5aC05ZCI77yJXG4gICAgaWYgKHRoaXMuZGF0YWJhc2Uub3V0cHV0cz8ub3BlblNlYXJjaEVuZHBvaW50KSB7XG4gICAgICB0aGlzLm9wZW5TZWFyY2hFbmRwb2ludCA9IHRoaXMuZGF0YWJhc2Uub3V0cHV0cy5vcGVuU2VhcmNoRW5kcG9pbnQ7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ/CflJcg5LuW44K544K/44OD44Kv5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6a5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv5Ye65Yqb5L2c5oiQ77yI5YCL5Yil44OH44OX44Ot44Kk5a++5b+c77yJXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgLy8gUzPjg5DjgrHjg4Pjg4jlkI3lh7rlipvvvIjku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjvvIlcbiAgICBPYmplY3QuZW50cmllcyh0aGlzLnMzQnVja2V0TmFtZXMpLmZvckVhY2goKFtuYW1lLCBidWNrZXROYW1lXSkgPT4ge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYFMzQnVja2V0JHtuYW1lfU5hbWVgLCB7XG4gICAgICAgIHZhbHVlOiBidWNrZXROYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogYFMzICR7bmFtZX0gQnVja2V0IE5hbWVgLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tUzNCdWNrZXQke25hbWV9TmFtZWAsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIER5bmFtb0RC44OG44O844OW44Or5ZCN5Ye65Yqb77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJXG4gICAgT2JqZWN0LmVudHJpZXModGhpcy5keW5hbW9EYlRhYmxlTmFtZXMpLmZvckVhY2goKFtuYW1lLCB0YWJsZU5hbWVdKSA9PiB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgRHluYW1vRGIke25hbWV9VGFibGVOYW1lYCwge1xuICAgICAgICB2YWx1ZTogdGFibGVOYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogYER5bmFtb0RCICR7bmFtZX0gVGFibGUgTmFtZWAsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1EeW5hbW9EYiR7bmFtZX1UYWJsZU5hbWVgLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBPcGVuU2VhcmNo44Ko44Oz44OJ44Od44Kk44Oz44OI5Ye65Yqb77yI5a2Y5Zyo44GZ44KL5aC05ZCI44Gu44G/77yJXG4gICAgaWYgKHRoaXMub3BlblNlYXJjaEVuZHBvaW50KSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnT3BlblNlYXJjaEVuZHBvaW50Jywge1xuICAgICAgICB2YWx1ZTogdGhpcy5vcGVuU2VhcmNoRW5kcG9pbnQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnT3BlblNlYXJjaCBEb21haW4gRW5kcG9pbnQnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tT3BlblNlYXJjaEVuZHBvaW50YCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOOCueODiOODrOODvOOCuOe1seWQiOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLnN0b3JhZ2Uub3V0cHV0cykge1xuICAgICAgLy8gRlN4IEZpbGUgU3lzdGVtIElEXG4gICAgICBpZiAodGhpcy5zdG9yYWdlLm91dHB1dHMuZnN4RmlsZVN5c3RlbUlkKSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdGc3hGaWxlU3lzdGVtSWQnLCB7XG4gICAgICAgICAgdmFsdWU6IHRoaXMuc3RvcmFnZS5vdXRwdXRzLmZzeEZpbGVTeXN0ZW1JZCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZTeCBmb3IgTmV0QXBwIE9OVEFQIEZpbGUgU3lzdGVtIElEJyxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRnN4RmlsZVN5c3RlbUlkYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEVGUyBGaWxlIFN5c3RlbSBJRFxuICAgICAgaWYgKHRoaXMuc3RvcmFnZS5vdXRwdXRzLmVmc0ZpbGVTeXN0ZW1JZCkge1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRWZzRmlsZVN5c3RlbUlkJywge1xuICAgICAgICAgIHZhbHVlOiB0aGlzLnN0b3JhZ2Uub3V0cHV0cy5lZnNGaWxlU3lzdGVtSWQsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdFRlMgRmlsZSBTeXN0ZW0gSUQnLFxuICAgICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FZnNGaWxlU3lzdGVtSWRgLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn8J+TpCBEYXRhU3RhY2vlh7rlipvlgKTkvZzmiJDlrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgr/jg4Pjgq/jgr/jgrDoqK3lrprvvIhBZ2VudCBTdGVlcmluZ+a6luaLoO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhZGRTdGFja1RhZ3MoKTogdm9pZCB7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNb2R1bGUnLCAnU3RvcmFnZStEYXRhYmFzZScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RhY2tUeXBlJywgJ0ludGVncmF0ZWQnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0FyY2hpdGVjdHVyZScsICdNb2R1bGFyJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdTdG9yYWdlVHlwZXMnLCAnUzMrRlN4K0VGUycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRGF0YWJhc2VUeXBlcycsICdEeW5hbW9EQitPcGVuU2VhcmNoJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdJbmRpdmlkdWFsRGVwbG95U3VwcG9ydCcsICdZZXMnKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygn8J+Pt++4jyBEYXRhU3RhY2vjgr/jgrDoqK3lrprlrozkuoYnKTtcbiAgfVxuICBcbiAgLyoqIEZTeCBmb3IgTmV0QXBwIE9OVEFQ44Kz44Oz44K544OI44Op44Kv44OIICovXG4gIHB1YmxpYyByZWFkb25seSBmc3g6IEZzeENvbnN0cnVjdDtcbiAgXG4gIC8qKiBFRlPjgrPjg7Pjgrnjg4jjg6njgq/jg4ggKi9cbiAgcHVibGljIHJlYWRvbmx5IGVmczogRWZzQ29uc3RydWN0O1xuICBcbiAgLyoqIER5bmFtb0RC44Kz44Oz44K544OI44Op44Kv44OIICovXG4gIHB1YmxpYyByZWFkb25seSBkeW5hbW9EYjogRHluYW1vRGJDb25zdHJ1Y3Q7XG4gIFxuICAvKiogT3BlblNlYXJjaOOCs+ODs+OCueODiOODqeOCr+ODiCAqL1xuICBwdWJsaWMgcmVhZG9ubHkgb3BlblNlYXJjaDogT3BlblNlYXJjaENvbnN0cnVjdDtcbiAgXG4gIC8qKiBSRFPjgrPjg7Pjgrnjg4jjg6njgq/jg4ggKi9cbiAgcHVibGljIHJlYWRvbmx5IHJkczogUmRzQ29uc3RydWN0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBEYXRhU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8g44K544K/44OD44Kv5L6d5a2Y6Zai5L+C6Kit5a6aXG4gICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLm5ldHdvcmtpbmdTdGFjayk7XG4gICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLnNlY3VyaXR5U3RhY2spO1xuXG4gICAgLy8gUzPjgrnjg4jjg6zjg7zjgrjkvZzmiJBcbiAgICB0aGlzLnMzID0gbmV3IFMzQ29uc3RydWN0KHRoaXMsICdTMycsIHtcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjay5rbXMubWFpbktleSxcbiAgICAgIHMzQ29uZmlnOiBwcm9wcy5zdG9yYWdlQ29uZmlnLnMzLFxuICAgIH0pO1xuXG4gICAgLy8gRlN4IGZvciBOZXRBcHAgT05UQVDkvZzmiJBcbiAgICB0aGlzLmZzeCA9IG5ldyBGc3hDb25zdHJ1Y3QodGhpcywgJ0ZzeCcsIHtcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIHZwYzogcHJvcHMubmV0d29ya2luZ1N0YWNrLnZwYy52cGMsXG4gICAgICBwcml2YXRlU3VibmV0czogcHJvcHMubmV0d29ya2luZ1N0YWNrLnN1Ym5ldHMucHJpdmF0ZVN1Ym5ldHMsXG4gICAgICBzZWN1cml0eUdyb3VwOiBwcm9wcy5uZXR3b3JraW5nU3RhY2suc2VjdXJpdHlHcm91cHMuZnN4U2VjdXJpdHlHcm91cCxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjay5rbXMubWFpbktleSxcbiAgICAgIGZzeENvbmZpZzogcHJvcHMuc3RvcmFnZUNvbmZpZy5mc3gsXG4gICAgfSk7XG5cbiAgICAvLyBFRlPkvZzmiJBcbiAgICB0aGlzLmVmcyA9IG5ldyBFZnNDb25zdHJ1Y3QodGhpcywgJ0VmcycsIHtcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIHZwYzogcHJvcHMubmV0d29ya2luZ1N0YWNrLnZwYy52cGMsXG4gICAgICBwcml2YXRlU3VibmV0czogcHJvcHMubmV0d29ya2luZ1N0YWNrLnN1Ym5ldHMucHJpdmF0ZVN1Ym5ldHMsXG4gICAgICBzZWN1cml0eUdyb3VwOiBwcm9wcy5uZXR3b3JraW5nU3RhY2suc2VjdXJpdHlHcm91cHMuZWZzU2VjdXJpdHlHcm91cCxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjay5rbXMubWFpbktleSxcbiAgICAgIGVmc0NvbmZpZzogcHJvcHMuc3RvcmFnZUNvbmZpZy5lZnMsXG4gICAgfSk7XG5cbiAgICAvLyBEeW5hbW9EQuS9nOaIkFxuICAgIHRoaXMuZHluYW1vRGIgPSBuZXcgRHluYW1vRGJDb25zdHJ1Y3QodGhpcywgJ0R5bmFtb0RiJywge1xuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrLmttcy5tYWluS2V5LFxuICAgICAgZHluYW1vRGJDb25maWc6IHByb3BzLmRhdGFiYXNlQ29uZmlnLmR5bmFtb0RiLFxuICAgIH0pO1xuXG4gICAgLy8gT3BlblNlYXJjaCBTZXJ2ZXJsZXNz5L2c5oiQXG4gICAgdGhpcy5vcGVuU2VhcmNoID0gbmV3IE9wZW5TZWFyY2hDb25zdHJ1Y3QodGhpcywgJ09wZW5TZWFyY2gnLCB7XG4gICAgICBwcm9qZWN0TmFtZTogcHJvcHMucHJvamVjdE5hbWUsXG4gICAgICBlbnZpcm9ubWVudDogcHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICB2cGM6IHByb3BzLm5ldHdvcmtpbmdTdGFjay52cGMudnBjLFxuICAgICAgcHJpdmF0ZVN1Ym5ldHM6IHByb3BzLm5ldHdvcmtpbmdTdGFjay5zdWJuZXRzLnByaXZhdGVTdWJuZXRzLFxuICAgICAgc2VjdXJpdHlHcm91cDogcHJvcHMubmV0d29ya2luZ1N0YWNrLnNlY3VyaXR5R3JvdXBzLm9wZW5TZWFyY2hTZWN1cml0eUdyb3VwLFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrLmttcy5tYWluS2V5LFxuICAgICAgb3BlblNlYXJjaENvbmZpZzogcHJvcHMuZGF0YWJhc2VDb25maWcub3BlblNlYXJjaCxcbiAgICB9KTtcblxuICAgIC8vIFJEU+S9nOaIkO+8iOOCquODl+OCt+ODp+ODs++8iVxuICAgIGlmIChwcm9wcy5kYXRhYmFzZUNvbmZpZy5yZHMuZW5hYmxlZCkge1xuICAgICAgdGhpcy5yZHMgPSBuZXcgUmRzQ29uc3RydWN0KHRoaXMsICdSZHMnLCB7XG4gICAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAgICB2cGM6IHByb3BzLm5ldHdvcmtpbmdTdGFjay52cGMudnBjLFxuICAgICAgICBkYXRhYmFzZVN1Ym5ldHM6IHByb3BzLm5ldHdvcmtpbmdTdGFjay5zdWJuZXRzLmRhdGFiYXNlU3VibmV0cyxcbiAgICAgICAgc2VjdXJpdHlHcm91cDogcHJvcHMubmV0d29ya2luZ1N0YWNrLnNlY3VyaXR5R3JvdXBzLnJkc1NlY3VyaXR5R3JvdXAsXG4gICAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjay5rbXMubWFpbktleSxcbiAgICAgICAgcmRzQ29uZmlnOiBwcm9wcy5kYXRhYmFzZUNvbmZpZy5yZHMsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDjgrnjgr/jg4Pjgq/lh7rliptcbiAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcblxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIHRoaXMuYWRkU3RhY2tUYWdzKHByb3BzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgr/jg4Pjgq/lh7rlipvkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0cygpOiB2b2lkIHtcbiAgICAvLyBTM+WHuuWKm1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEb2N1bWVudHNCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuczMuZG9jdW1lbnRzQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0RvY3VtZW50cyBTMyBCdWNrZXQgTmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRG9jdW1lbnRzQnVja2V0TmFtZWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRG9jdW1lbnRzQnVja2V0QXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMuczMuZG9jdW1lbnRzQnVja2V0LmJ1Y2tldEFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnRG9jdW1lbnRzIFMzIEJ1Y2tldCBBUk4nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LURvY3VtZW50c0J1Y2tldEFybmAsXG4gICAgfSk7XG5cbiAgICAvLyBGU3jlh7rliptcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRnN4RmlsZVN5c3RlbUlkJywge1xuICAgICAgdmFsdWU6IHRoaXMuZnN4LmZpbGVTeXN0ZW0ucmVmLFxuICAgICAgZGVzY3JpcHRpb246ICdGU3ggRmlsZSBTeXN0ZW0gSUQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUZzeEZpbGVTeXN0ZW1JZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRnN4RG5zTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmZzeC5maWxlU3lzdGVtLmF0dHJEbnNOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdGU3ggRE5TIE5hbWUnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUZzeERuc05hbWVgLFxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vRELlh7rliptcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU2Vzc2lvbnNUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5keW5hbW9EYi5zZXNzaW9uc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2Vzc2lvbnMgRHluYW1vREIgVGFibGUgTmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tU2Vzc2lvbnNUYWJsZU5hbWVgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1Nlc3Npb25zVGFibGVBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5keW5hbW9EYi5zZXNzaW9uc1RhYmxlLnRhYmxlQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdTZXNzaW9ucyBEeW5hbW9EQiBUYWJsZSBBUk4nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVNlc3Npb25zVGFibGVBcm5gLFxuICAgIH0pO1xuXG4gICAgLy8gT3BlblNlYXJjaOWHuuWKm1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdPcGVuU2VhcmNoQ29sbGVjdGlvbkFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLm9wZW5TZWFyY2guY29sbGVjdGlvbi5hdHRyQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdPcGVuU2VhcmNoIENvbGxlY3Rpb24gQVJOJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1PcGVuU2VhcmNoQ29sbGVjdGlvbkFybmAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnT3BlblNlYXJjaENvbGxlY3Rpb25FbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLm9wZW5TZWFyY2guY29sbGVjdGlvbi5hdHRyQ29sbGVjdGlvbkVuZHBvaW50LFxuICAgICAgZGVzY3JpcHRpb246ICdPcGVuU2VhcmNoIENvbGxlY3Rpb24gRW5kcG9pbnQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LU9wZW5TZWFyY2hDb2xsZWN0aW9uRW5kcG9pbnRgLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+OCv+OCsOioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBhZGRTdGFja1RhZ3MocHJvcHM6IERhdGFTdGFja1Byb3BzKTogdm9pZCB7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNb2R1bGUnLCAnRGF0YScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RhY2tUeXBlJywgJ0ludGVncmF0ZWQnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1Byb2plY3QnLCBwcm9wcy5wcm9qZWN0TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIHByb3BzLmVudmlyb25tZW50KTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0RhdGFDbGFzc2lmaWNhdGlvbicsICdTZW5zaXRpdmUnKTtcbiAgfVxufSJdfQ==