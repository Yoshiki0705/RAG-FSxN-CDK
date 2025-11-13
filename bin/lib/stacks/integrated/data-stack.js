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
    constructor(scope, id, props) {
        super(scope, id, props);
        /** S3バケット名（他スタックからの参照用） */
        this.s3BucketNames = {};
        /** DynamoDBテーブル名（他スタックからの参照用） */
        this.dynamoDbTableNames = {};
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
        // 統合ストレージコンストラクト作成
        this.storage = new storage_construct_1.StorageConstruct(this, 'Storage', {
            config: props.config.storage,
            projectName: props.projectName,
            environment: props.environment,
            kmsKey: props.securityStack?.kmsKey,
            vpc: props.vpc,
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
