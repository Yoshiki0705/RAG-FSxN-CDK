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
// タグ設定
const tagging_config_1 = require("../../config/tagging-config");
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
    /** プロジェクト名（内部参照用） */
    projectName;
    /** 環境名（内部参照用） */
    environmentName;
    constructor(scope, id, props) {
        super(scope, id, props);
        // プロパティの初期化
        this.projectName = props.projectName;
        this.environmentName = props.environment;
        console.log('💾 DataStack初期化開始...');
        console.log('📝 スタック名:', id);
        console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');
        // コスト配布タグの適用（FSx for ONTAP専用タグを含む）
        const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(props.projectName, props.environment);
        tagging_config_1.TaggingStrategy.applyTagsToStack(this, taggingConfig);
        // 注意: 依存関係は main-deployment-stack.ts で一元管理されます
        // セキュリティスタックとの依存関係は親スタックで設定済み
        // VPCをインポート（props.vpcがオブジェクトの場合）
        let vpc;
        if (props.vpc && typeof props.vpc === 'object' && 'vpcId' in props.vpc) {
            const ec2 = require('aws-cdk-lib/aws-ec2');
            vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVpc', props.vpc);
        }
        else {
            vpc = props.vpc;
        }
        // 統合ストレージコンストラクト作成
        this.storage = new storage_construct_1.StorageConstruct(this, 'Storage', {
            config: props.config.storage,
            projectName: props.projectName,
            environment: props.environment,
            kmsKey: props.securityStack?.kmsKey,
            vpc: vpc,
            privateSubnetIds: props.privateSubnetIds,
        });
        // 統合データベースコンストラクト作成
        this.database = new database_construct_1.DatabaseConstruct(this, 'Database', {
            config: props.config.database,
            projectName: props.projectName,
            environment: props.environment,
            kmsKey: props.securityStack?.kmsKey,
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
     * S3バケットの型ガード
     */
    isValidS3Bucket(bucket) {
        return typeof bucket === 'object' &&
            bucket !== null &&
            'bucketName' in bucket &&
            typeof bucket.bucketName === 'string';
    }
    /**
     * DynamoDBテーブルの型ガード
     */
    isValidDynamoDbTable(table) {
        return typeof table === 'object' &&
            table !== null &&
            'tableName' in table &&
            typeof table.tableName === 'string';
    }
    /**
     * 他スタックからの参照用プロパティ設定（型安全性強化版）
     */
    setupCrossStackReferences() {
        try {
            // S3バケット名の設定（型安全性強化）
            if (this.storage.outputs?.s3Buckets) {
                Object.entries(this.storage.outputs.s3Buckets).forEach(([name, bucket]) => {
                    if (this.isValidS3Bucket(bucket)) {
                        this.s3BucketNames[name] = bucket.bucketName;
                    }
                    else {
                        console.warn(`⚠️ 無効なS3バケット設定をスキップ: ${name}`);
                    }
                });
            }
            // DynamoDBテーブル名の設定（型安全性強化）
            if (this.database.outputs?.dynamoDbTables) {
                Object.entries(this.database.outputs.dynamoDbTables).forEach(([name, table]) => {
                    if (this.isValidDynamoDbTable(table)) {
                        this.dynamoDbTableNames[name] = table.tableName;
                    }
                    else {
                        console.warn(`⚠️ 無効なDynamoDBテーブル設定をスキップ: ${name}`);
                    }
                });
            }
            // OpenSearchエンドポイントの設定（型安全性強化）
            if (this.database.outputs?.openSearchEndpoint &&
                typeof this.database.outputs.openSearchEndpoint === 'string') {
                this.openSearchEndpoint = this.database.outputs.openSearchEndpoint;
            }
            console.log('🔗 他スタック参照用プロパティ設定完了');
        }
        catch (error) {
            console.error('❌ 他スタック参照用プロパティ設定エラー:', error);
            throw new Error(`DataStack参照設定に失敗しました: ${error}`);
        }
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
     * スタックタグ設定（統一タグ戦略準拠）
     */
    addStackTags() {
        try {
            // プロジェクト標準タグ設定を取得（propsから取得）
            const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(this.projectName || 'permission-aware-rag', this.environmentName || 'dev');
            // 環境別タグ設定をマージ
            const envConfig = tagging_config_1.PermissionAwareRAGTags.getEnvironmentConfig(this.environmentName || 'dev');
            const mergedConfig = { ...taggingConfig, ...envConfig };
            // セキュリティ要件タグをマージ
            const securityConfig = tagging_config_1.PermissionAwareRAGTags.getSecurityConfig(this.environmentName || 'dev');
            const finalConfig = { ...mergedConfig, ...securityConfig };
            // データスタック固有のカスタムタグを追加
            finalConfig.customTags = {
                ...finalConfig.customTags,
                'Module': 'Storage+Database',
                'StackType': 'Integrated',
                'Architecture': 'Modular',
                'StorageTypes': 'S3+FSx+EFS',
                'DatabaseTypes': 'DynamoDB+OpenSearch',
                'IndividualDeploySupport': 'Yes',
                'Data-Classification': 'Sensitive',
                'Backup-Required': 'true',
                'Encryption-Required': 'true',
            };
            // 統一タグ戦略を適用
            tagging_config_1.TaggingStrategy.applyTagsToStack(this, finalConfig);
            console.log('🏷️ DataStack統一タグ設定完了');
        }
        catch (error) {
            console.error('❌ DataStackタグ設定エラー:', error);
            // フォールバック: 基本タグのみ設定
            cdk.Tags.of(this).add('Module', 'Storage+Database');
            cdk.Tags.of(this).add('StackType', 'Integrated');
            cdk.Tags.of(this).add('ManagedBy', 'CDK');
            console.log('⚠️ DataStackフォールバックタグ設定完了');
        }
    }
}
exports.DataStack = DataStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUduQywrQkFBK0I7QUFDL0IsMEZBQXNGO0FBRXRGLGdDQUFnQztBQUNoQyw2RkFBeUY7QUFTekYsT0FBTztBQUNQLGdFQUFzRjtBQWlCdEY7Ozs7O0dBS0c7QUFDSCxNQUFhLFNBQVUsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN0QyxxQkFBcUI7SUFDTCxPQUFPLENBQW1CO0lBRTFDLHNCQUFzQjtJQUNOLFFBQVEsQ0FBb0I7SUFFNUMsMkJBQTJCO0lBQ1gsYUFBYSxHQUE4QixFQUFFLENBQUM7SUFFOUQsaUNBQWlDO0lBQ2pCLGtCQUFrQixHQUE4QixFQUFFLENBQUM7SUFFbkUseUNBQXlDO0lBQ2xDLGtCQUFrQixDQUFVO0lBRW5DLHFCQUFxQjtJQUNKLFdBQVcsQ0FBUztJQUVyQyxpQkFBaUI7SUFDQSxlQUFlLENBQVM7SUFFekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFxQjtRQUM3RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixZQUFZO1FBQ1osSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztRQUV6QyxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FB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QUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDcEQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNqRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0gsQ0FBQztDQUdGO0FBdlBELDhCQXVQQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRGF0YVN0YWNrIC0g57Wx5ZCI44OH44O844K/44K544K/44OD44Kv77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj5a++5b+c77yJXG4gKiBcbiAqIOapn+iDvTpcbiAqIC0g57Wx5ZCI44K544OI44Os44O844K444O744OH44O844K/44OZ44O844K544Kz44Oz44K544OI44Op44Kv44OI44Gr44KI44KL5LiA5YWD566h55CGXG4gKiAtIFMz44O7RlN444O7RHluYW1vRELjg7tPcGVuU2VhcmNo44Gu57Wx5ZCIXG4gKiAtIEFnZW50IFN0ZWVyaW5n5rqW5oug5ZG95ZCN6KaP5YmH5a++5b+cXG4gKiAtIOWAi+WIpeOCueOCv+ODg+OCr+ODh+ODl+ODreOCpOWujOWFqOWvvuW/nFxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLy8g57Wx5ZCI44K544OI44Os44O844K444Kz44Oz44K544OI44Op44Kv44OI77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj77yJXG5pbXBvcnQgeyBTdG9yYWdlQ29uc3RydWN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9zdG9yYWdlL2NvbnN0cnVjdHMvc3RvcmFnZS1jb25zdHJ1Y3QnO1xuXG4vLyDntbHlkIjjg4fjg7zjgr/jg5njg7zjgrnjgrPjg7Pjgrnjg4jjg6njgq/jg4jvvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6PvvIlcbmltcG9ydCB7IERhdGFiYXNlQ29uc3RydWN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9kYXRhYmFzZS9jb25zdHJ1Y3RzL2RhdGFiYXNlLWNvbnN0cnVjdCc7XG5cbi8vIOOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuaW1wb3J0IHsgU3RvcmFnZUNvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvc3RvcmFnZS9pbnRlcmZhY2VzL3N0b3JhZ2UtY29uZmlnJztcbmltcG9ydCB7IERhdGFiYXNlQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9kYXRhYmFzZS9pbnRlcmZhY2VzL2RhdGFiYXNlLWNvbmZpZyc7XG5cbi8vIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruS+neWtmOmWouS/glxuaW1wb3J0IHsgU2VjdXJpdHlTdGFjayB9IGZyb20gJy4vc2VjdXJpdHktc3RhY2snO1xuXG4vLyDjgr/jgrDoqK3lrppcbmltcG9ydCB7IFRhZ2dpbmdTdHJhdGVneSwgUGVybWlzc2lvbkF3YXJlUkFHVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdnaW5nLWNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVN0YWNrQ29uZmlnIHtcbiAgcmVhZG9ubHkgc3RvcmFnZTogU3RvcmFnZUNvbmZpZztcbiAgcmVhZG9ubHkgZGF0YWJhc2U6IERhdGFiYXNlQ29uZmlnO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICByZWFkb25seSBjb25maWc6IERhdGFTdGFja0NvbmZpZzsgLy8g5Z6L5a6J5YWo44Gq57Wx5ZCI6Kit5a6a44Kq44OW44K444Kn44Kv44OIXG4gIHJlYWRvbmx5IHNlY3VyaXR5U3RhY2s/OiBTZWN1cml0eVN0YWNrOyAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgr/jg4Pjgq/vvIjjgqrjg5fjgrfjg6fjg7PvvIlcbiAgcmVhZG9ubHkgbmFtaW5nR2VuZXJhdG9yPzogYW55OyAvLyBBZ2VudCBTdGVlcmluZ+a6luaLoOWRveWQjeOCuOOCp+ODjeODrOODvOOCv+ODvO+8iOOCquODl+OCt+ODp+ODs++8iVxuICByZWFkb25seSBwcm9qZWN0TmFtZTogc3RyaW5nOyAvLyDjg5fjg63jgrjjgqfjgq/jg4jlkI3vvIjjgrPjgrnjg4jphY3luIPnlKjvvIlcbiAgcmVhZG9ubHkgZW52aXJvbm1lbnQ6IHN0cmluZzsgLy8g55Kw5aKD5ZCN77yI44Kz44K544OI6YWN5biD55So77yJXG4gIHJlYWRvbmx5IHZwYz86IGFueTsgLy8gVlBD77yITmV0d29ya2luZ1N0YWNr44GL44KJ77yJXG4gIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRJZHM/OiBzdHJpbmdbXTsgLy8g44OX44Op44Kk44OZ44O844OI44K144OW44ON44OD44OISUTvvIhOZXR3b3JraW5nU3RhY2vjgYvjgonvvIlcbn1cblxuLyoqXG4gKiDntbHlkIjjg4fjg7zjgr/jgrnjgr/jg4Pjgq/vvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plr77lv5zvvIlcbiAqIFxuICog57Wx5ZCI44K544OI44Os44O844K444O744OH44O844K/44OZ44O844K544Kz44Oz44K544OI44Op44Kv44OI44Gr44KI44KL5LiA5YWD566h55CGXG4gKiDlgIvliKXjgrnjgr/jg4Pjgq/jg4fjg5fjg63jgqTlrozlhajlr77lv5xcbiAqL1xuZXhwb3J0IGNsYXNzIERhdGFTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIC8qKiDntbHlkIjjgrnjg4jjg6zjg7zjgrjjgrPjg7Pjgrnjg4jjg6njgq/jg4ggKi9cbiAgcHVibGljIHJlYWRvbmx5IHN0b3JhZ2U6IFN0b3JhZ2VDb25zdHJ1Y3Q7XG4gIFxuICAvKiog57Wx5ZCI44OH44O844K/44OZ44O844K544Kz44Oz44K544OI44Op44Kv44OIICovXG4gIHB1YmxpYyByZWFkb25seSBkYXRhYmFzZTogRGF0YWJhc2VDb25zdHJ1Y3Q7XG4gIFxuICAvKiogUzPjg5DjgrHjg4Pjg4jlkI3vvIjku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjvvIkgKi9cbiAgcHVibGljIHJlYWRvbmx5IHMzQnVja2V0TmFtZXM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcbiAgXG4gIC8qKiBEeW5hbW9EQuODhuODvOODluODq+WQje+8iOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqO+8iSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZHluYW1vRGJUYWJsZU5hbWVzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG4gIFxuICAvKiogT3BlblNlYXJjaOODieODoeOCpOODs+OCqOODs+ODieODneOCpOODs+ODiO+8iOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqO+8iSAqL1xuICBwdWJsaWMgb3BlblNlYXJjaEVuZHBvaW50Pzogc3RyaW5nO1xuXG4gIC8qKiDjg5fjg63jgrjjgqfjgq/jg4jlkI3vvIjlhoXpg6jlj4LnhafnlKjvvIkgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBwcm9qZWN0TmFtZTogc3RyaW5nO1xuICBcbiAgLyoqIOeSsOWig+WQje+8iOWGhemDqOWPgueFp+eUqO+8iSAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGVudmlyb25tZW50TmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBEYXRhU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8g44OX44Ot44OR44OG44Kj44Gu5Yid5pyf5YyWXG4gICAgdGhpcy5wcm9qZWN0TmFtZSA9IHByb3BzLnByb2plY3ROYW1lO1xuICAgIHRoaXMuZW52aXJvbm1lbnROYW1lID0gcHJvcHMuZW52aXJvbm1lbnQ7XG5cbiAgICBjb25zb2xlLmxvZygn8J+SviBEYXRhU3RhY2vliJ3mnJ/ljJbplovlp4suLi4nKTtcbiAgICBjb25zb2xlLmxvZygn8J+TnSDjgrnjgr/jg4Pjgq/lkI06JywgaWQpO1xuICAgIGNvbnNvbGUubG9nKCfwn4+377iPIEFnZW50IFN0ZWVyaW5n5rqW5ougOicsIHByb3BzLm5hbWluZ0dlbmVyYXRvciA/ICdZZXMnIDogJ05vJyk7XG5cbiAgICAvLyDjgrPjgrnjg4jphY3luIPjgr/jgrDjga7pgannlKjvvIhGU3ggZm9yIE9OVEFQ5bCC55So44K/44Kw44KS5ZCr44KA77yJXG4gICAgY29uc3QgdGFnZ2luZ0NvbmZpZyA9IFBlcm1pc3Npb25Bd2FyZVJBR1RhZ3MuZ2V0U3RhbmRhcmRDb25maWcoXG4gICAgICBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIHByb3BzLmVudmlyb25tZW50XG4gICAgKTtcbiAgICBUYWdnaW5nU3RyYXRlZ3kuYXBwbHlUYWdzVG9TdGFjayh0aGlzLCB0YWdnaW5nQ29uZmlnKTtcblxuICAgIC8vIOazqOaEjzog5L6d5a2Y6Zai5L+C44GvIG1haW4tZGVwbG95bWVudC1zdGFjay50cyDjgafkuIDlhYPnrqHnkIbjgZXjgozjgb7jgZlcbiAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgr/jg4Pjgq/jgajjga7kvp3lrZjplqLkv4Ljga/opqrjgrnjgr/jg4Pjgq/jgafoqK3lrprmuIjjgb9cblxuICAgIC8vIFZQQ+OCkuOCpOODs+ODneODvOODiO+8iHByb3BzLnZwY+OBjOOCquODluOCuOOCp+OCr+ODiOOBruWgtOWQiO+8iVxuICAgIGxldCB2cGM7XG4gICAgaWYgKHByb3BzLnZwYyAmJiB0eXBlb2YgcHJvcHMudnBjID09PSAnb2JqZWN0JyAmJiAndnBjSWQnIGluIHByb3BzLnZwYykge1xuICAgICAgY29uc3QgZWMyID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjMicpO1xuICAgICAgdnBjID0gZWMyLlZwYy5mcm9tVnBjQXR0cmlidXRlcyh0aGlzLCAnSW1wb3J0ZWRWcGMnLCBwcm9wcy52cGMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2cGMgPSBwcm9wcy52cGM7XG4gICAgfVxuXG4gICAgLy8g57Wx5ZCI44K544OI44Os44O844K444Kz44Oz44K544OI44Op44Kv44OI5L2c5oiQXG4gICAgdGhpcy5zdG9yYWdlID0gbmV3IFN0b3JhZ2VDb25zdHJ1Y3QodGhpcywgJ1N0b3JhZ2UnLCB7XG4gICAgICBjb25maWc6IHByb3BzLmNvbmZpZy5zdG9yYWdlLFxuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrPy5rbXNLZXksXG4gICAgICB2cGM6IHZwYyxcbiAgICAgIHByaXZhdGVTdWJuZXRJZHM6IHByb3BzLnByaXZhdGVTdWJuZXRJZHMsXG4gICAgfSk7XG5cbiAgICAvLyDntbHlkIjjg4fjg7zjgr/jg5njg7zjgrnjgrPjg7Pjgrnjg4jjg6njgq/jg4jkvZzmiJBcbiAgICB0aGlzLmRhdGFiYXNlID0gbmV3IERhdGFiYXNlQ29uc3RydWN0KHRoaXMsICdEYXRhYmFzZScsIHtcbiAgICAgIGNvbmZpZzogcHJvcHMuY29uZmlnLmRhdGFiYXNlLFxuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrPy5rbXNLZXksXG4gICAgfSk7XG5cbiAgICAvLyDku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjjg5fjg63jg5Hjg4bjgqPoqK3lrppcbiAgICB0aGlzLnNldHVwQ3Jvc3NTdGFja1JlZmVyZW5jZXMoKTtcblxuICAgIC8vIOOCueOCv+ODg+OCr+WHuuWKm1xuICAgIHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgLy8g44K/44Kw6Kit5a6aXG4gICAgdGhpcy5hZGRTdGFja1RhZ3MoKTtcblxuICAgIGNvbnNvbGUubG9nKCfinIUgRGF0YVN0YWNr5Yid5pyf5YyW5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICogUzPjg5DjgrHjg4Pjg4jjga7lnovjgqzjg7zjg4lcbiAgICovXG4gIHByaXZhdGUgaXNWYWxpZFMzQnVja2V0KGJ1Y2tldDogdW5rbm93bik6IGJ1Y2tldCBpcyB7IGJ1Y2tldE5hbWU6IHN0cmluZyB9IHtcbiAgICByZXR1cm4gdHlwZW9mIGJ1Y2tldCA9PT0gJ29iamVjdCcgJiYgXG4gICAgICAgICAgIGJ1Y2tldCAhPT0gbnVsbCAmJiBcbiAgICAgICAgICAgJ2J1Y2tldE5hbWUnIGluIGJ1Y2tldCAmJiBcbiAgICAgICAgICAgdHlwZW9mIChidWNrZXQgYXMgYW55KS5idWNrZXROYW1lID09PSAnc3RyaW5nJztcbiAgfVxuXG4gIC8qKlxuICAgKiBEeW5hbW9EQuODhuODvOODluODq+OBruWei+OCrOODvOODiVxuICAgKi9cbiAgcHJpdmF0ZSBpc1ZhbGlkRHluYW1vRGJUYWJsZSh0YWJsZTogdW5rbm93bik6IHRhYmxlIGlzIHsgdGFibGVOYW1lOiBzdHJpbmcgfSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0YWJsZSA9PT0gJ29iamVjdCcgJiYgXG4gICAgICAgICAgIHRhYmxlICE9PSBudWxsICYmIFxuICAgICAgICAgICAndGFibGVOYW1lJyBpbiB0YWJsZSAmJiBcbiAgICAgICAgICAgdHlwZW9mICh0YWJsZSBhcyBhbnkpLnRhYmxlTmFtZSA9PT0gJ3N0cmluZyc7XG4gIH1cblxuICAvKipcbiAgICog5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6a77yI5Z6L5a6J5YWo5oCn5by35YyW54mI77yJXG4gICAqL1xuICBwcml2YXRlIHNldHVwQ3Jvc3NTdGFja1JlZmVyZW5jZXMoKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFMz44OQ44Kx44OD44OI5ZCN44Gu6Kit5a6a77yI5Z6L5a6J5YWo5oCn5by35YyW77yJXG4gICAgICBpZiAodGhpcy5zdG9yYWdlLm91dHB1dHM/LnMzQnVja2V0cykge1xuICAgICAgICBPYmplY3QuZW50cmllcyh0aGlzLnN0b3JhZ2Uub3V0cHV0cy5zM0J1Y2tldHMpLmZvckVhY2goKFtuYW1lLCBidWNrZXRdKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNWYWxpZFMzQnVja2V0KGJ1Y2tldCkpIHtcbiAgICAgICAgICAgIHRoaXMuczNCdWNrZXROYW1lc1tuYW1lXSA9IGJ1Y2tldC5idWNrZXROYW1lO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYOKaoO+4jyDnhKHlirnjgapTM+ODkOOCseODg+ODiOioreWumuOCkuOCueOCreODg+ODlzogJHtuYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIER5bmFtb0RC44OG44O844OW44Or5ZCN44Gu6Kit5a6a77yI5Z6L5a6J5YWo5oCn5by35YyW77yJXG4gICAgICBpZiAodGhpcy5kYXRhYmFzZS5vdXRwdXRzPy5keW5hbW9EYlRhYmxlcykge1xuICAgICAgICBPYmplY3QuZW50cmllcyh0aGlzLmRhdGFiYXNlLm91dHB1dHMuZHluYW1vRGJUYWJsZXMpLmZvckVhY2goKFtuYW1lLCB0YWJsZV0pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5pc1ZhbGlkRHluYW1vRGJUYWJsZSh0YWJsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZHluYW1vRGJUYWJsZU5hbWVzW25hbWVdID0gdGFibGUudGFibGVOYW1lO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYOKaoO+4jyDnhKHlirnjgapEeW5hbW9EQuODhuODvOODluODq+ioreWumuOCkuOCueOCreODg+ODlzogJHtuYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE9wZW5TZWFyY2jjgqjjg7Pjg4njg53jgqTjg7Pjg4jjga7oqK3lrprvvIjlnovlronlhajmgKflvLfljJbvvIlcbiAgICAgIGlmICh0aGlzLmRhdGFiYXNlLm91dHB1dHM/Lm9wZW5TZWFyY2hFbmRwb2ludCAmJiBcbiAgICAgICAgICB0eXBlb2YgdGhpcy5kYXRhYmFzZS5vdXRwdXRzLm9wZW5TZWFyY2hFbmRwb2ludCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5vcGVuU2VhcmNoRW5kcG9pbnQgPSB0aGlzLmRhdGFiYXNlLm91dHB1dHMub3BlblNlYXJjaEVuZHBvaW50O1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygn8J+UlyDku5bjgrnjgr/jg4Pjgq/lj4LnhafnlKjjg5fjg63jg5Hjg4bjgqPoqK3lrprlrozkuoYnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOS7luOCueOCv+ODg+OCr+WPgueFp+eUqOODl+ODreODkeODhuOCo+ioreWumuOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYERhdGFTdGFja+WPgueFp+ioreWumuOBq+WkseaVl+OBl+OBvuOBl+OBnzogJHtlcnJvcn1gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv5Ye65Yqb5L2c5oiQ77yI5YCL5Yil44OH44OX44Ot44Kk5a++5b+c77yJXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgLy8gUzPjg5DjgrHjg4Pjg4jlkI3lh7rlipvvvIjku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjvvIlcbiAgICBPYmplY3QuZW50cmllcyh0aGlzLnMzQnVja2V0TmFtZXMpLmZvckVhY2goKFtuYW1lLCBidWNrZXROYW1lXSkgPT4ge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYFMzQnVja2V0JHtuYW1lfU5hbWVgLCB7XG4gICAgICAgIHZhbHVlOiBidWNrZXROYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogYFMzICR7bmFtZX0gQnVja2V0IE5hbWVgLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tUzNCdWNrZXQke25hbWV9TmFtZWAsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIER5bmFtb0RC44OG44O844OW44Or5ZCN5Ye65Yqb77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJXG4gICAgT2JqZWN0LmVudHJpZXModGhpcy5keW5hbW9EYlRhYmxlTmFtZXMpLmZvckVhY2goKFtuYW1lLCB0YWJsZU5hbWVdKSA9PiB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgRHluYW1vRGIke25hbWV9VGFibGVOYW1lYCwge1xuICAgICAgICB2YWx1ZTogdGFibGVOYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogYER5bmFtb0RCICR7bmFtZX0gVGFibGUgTmFtZWAsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1EeW5hbW9EYiR7bmFtZX1UYWJsZU5hbWVgLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBPcGVuU2VhcmNo44Ko44Oz44OJ44Od44Kk44Oz44OI5Ye65Yqb77yI5a2Y5Zyo44GZ44KL5aC05ZCI44Gu44G/77yJXG4gICAgaWYgKHRoaXMub3BlblNlYXJjaEVuZHBvaW50KSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnT3BlblNlYXJjaEVuZHBvaW50Jywge1xuICAgICAgICB2YWx1ZTogdGhpcy5vcGVuU2VhcmNoRW5kcG9pbnQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnT3BlblNlYXJjaCBEb21haW4gRW5kcG9pbnQnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tT3BlblNlYXJjaEVuZHBvaW50YCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOOCueODiOODrOODvOOCuOe1seWQiOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLnN0b3JhZ2Uub3V0cHV0cykge1xuICAgICAgLy8gRlN4IEZpbGUgU3lzdGVtIElEXG4gICAgICBpZiAodGhpcy5zdG9yYWdlLm91dHB1dHMuZnN4RmlsZVN5c3RlbUlkKSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdGc3hGaWxlU3lzdGVtSWQnLCB7XG4gICAgICAgICAgdmFsdWU6IHRoaXMuc3RvcmFnZS5vdXRwdXRzLmZzeEZpbGVTeXN0ZW1JZCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZTeCBmb3IgTmV0QXBwIE9OVEFQIEZpbGUgU3lzdGVtIElEJyxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRnN4RmlsZVN5c3RlbUlkYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEVGUyBGaWxlIFN5c3RlbSBJRFxuICAgICAgaWYgKHRoaXMuc3RvcmFnZS5vdXRwdXRzLmVmc0ZpbGVTeXN0ZW1JZCkge1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRWZzRmlsZVN5c3RlbUlkJywge1xuICAgICAgICAgIHZhbHVlOiB0aGlzLnN0b3JhZ2Uub3V0cHV0cy5lZnNGaWxlU3lzdGVtSWQsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdFRlMgRmlsZSBTeXN0ZW0gSUQnLFxuICAgICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FZnNGaWxlU3lzdGVtSWRgLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn8J+TpCBEYXRhU3RhY2vlh7rlipvlgKTkvZzmiJDlrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgr/jg4Pjgq/jgr/jgrDoqK3lrprvvIjntbHkuIDjgr/jgrDmiKbnlaXmupbmi6DvvIlcbiAgICovXG4gIHByaXZhdGUgYWRkU3RhY2tUYWdzKCk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICAvLyDjg5fjg63jgrjjgqfjgq/jg4jmqJnmupbjgr/jgrDoqK3lrprjgpLlj5blvpfvvIhwcm9wc+OBi+OCieWPluW+l++8iVxuICAgICAgY29uc3QgdGFnZ2luZ0NvbmZpZyA9IFBlcm1pc3Npb25Bd2FyZVJBR1RhZ3MuZ2V0U3RhbmRhcmRDb25maWcoXG4gICAgICAgIHRoaXMucHJvamVjdE5hbWUgfHwgJ3Blcm1pc3Npb24tYXdhcmUtcmFnJyxcbiAgICAgICAgdGhpcy5lbnZpcm9ubWVudE5hbWUgfHwgJ2RldidcbiAgICAgICk7XG4gICAgICBcbiAgICAgIC8vIOeSsOWig+WIpeOCv+OCsOioreWumuOCkuODnuODvOOCuFxuICAgICAgY29uc3QgZW52Q29uZmlnID0gUGVybWlzc2lvbkF3YXJlUkFHVGFncy5nZXRFbnZpcm9ubWVudENvbmZpZyh0aGlzLmVudmlyb25tZW50TmFtZSB8fCAnZGV2Jyk7XG4gICAgICBjb25zdCBtZXJnZWRDb25maWcgPSB7IC4uLnRhZ2dpbmdDb25maWcsIC4uLmVudkNvbmZpZyB9O1xuICAgICAgXG4gICAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPopoHku7bjgr/jgrDjgpLjg57jg7zjgrhcbiAgICAgIGNvbnN0IHNlY3VyaXR5Q29uZmlnID0gUGVybWlzc2lvbkF3YXJlUkFHVGFncy5nZXRTZWN1cml0eUNvbmZpZyh0aGlzLmVudmlyb25tZW50TmFtZSBhcyBhbnkgfHwgJ2RldicpO1xuICAgICAgY29uc3QgZmluYWxDb25maWcgPSB7IC4uLm1lcmdlZENvbmZpZywgLi4uc2VjdXJpdHlDb25maWcgfTtcbiAgICAgIFxuICAgICAgLy8g44OH44O844K/44K544K/44OD44Kv5Zu65pyJ44Gu44Kr44K544K/44Og44K/44Kw44KS6L+95YqgXG4gICAgICBmaW5hbENvbmZpZy5jdXN0b21UYWdzID0ge1xuICAgICAgICAuLi5maW5hbENvbmZpZy5jdXN0b21UYWdzLFxuICAgICAgICAnTW9kdWxlJzogJ1N0b3JhZ2UrRGF0YWJhc2UnLFxuICAgICAgICAnU3RhY2tUeXBlJzogJ0ludGVncmF0ZWQnLFxuICAgICAgICAnQXJjaGl0ZWN0dXJlJzogJ01vZHVsYXInLFxuICAgICAgICAnU3RvcmFnZVR5cGVzJzogJ1MzK0ZTeCtFRlMnLFxuICAgICAgICAnRGF0YWJhc2VUeXBlcyc6ICdEeW5hbW9EQitPcGVuU2VhcmNoJyxcbiAgICAgICAgJ0luZGl2aWR1YWxEZXBsb3lTdXBwb3J0JzogJ1llcycsXG4gICAgICAgICdEYXRhLUNsYXNzaWZpY2F0aW9uJzogJ1NlbnNpdGl2ZScsXG4gICAgICAgICdCYWNrdXAtUmVxdWlyZWQnOiAndHJ1ZScsXG4gICAgICAgICdFbmNyeXB0aW9uLVJlcXVpcmVkJzogJ3RydWUnLFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8g57Wx5LiA44K/44Kw5oim55Wl44KS6YGp55SoXG4gICAgICBUYWdnaW5nU3RyYXRlZ3kuYXBwbHlUYWdzVG9TdGFjayh0aGlzLCBmaW5hbENvbmZpZyk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCfwn4+377iPIERhdGFTdGFja+e1seS4gOOCv+OCsOioreWumuWujOS6hicpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwgRGF0YVN0YWNr44K/44Kw6Kit5a6a44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIFxuICAgICAgLy8g44OV44Kp44O844Or44OQ44OD44KvOiDln7rmnKzjgr/jgrDjga7jgb/oqK3lrppcbiAgICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTW9kdWxlJywgJ1N0b3JhZ2UrRGF0YWJhc2UnKTtcbiAgICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RhY2tUeXBlJywgJ0ludGVncmF0ZWQnKTtcbiAgICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZygn4pqg77iPIERhdGFTdGFja+ODleOCqeODvOODq+ODkOODg+OCr+OCv+OCsOioreWumuWujOS6hicpO1xuICAgIH1cbiAgfVxuICBcblxufSJdfQ==