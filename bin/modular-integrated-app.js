#!/usr/bin/env node
"use strict";
/**
 * モジュラー統合アプリケーション エントリーポイント
 * Embedding Batch統合用の統一エントリーポイント
 *
 * 機能:
 * - Amazon Nova Pro統合によるコスト最適化（60-80%削減）
 * - 統一タグ戦略によるコスト配布管理
 * - 環境別設定の自動適用
 * - FSx for NetApp ONTAP統合
 * - SQLite負荷試験機能
 * - エラーハンドリングとログ出力
 *
 * 使用方法:
 *   export PROJECT_NAME=permission-aware-rag
 *   export ENVIRONMENT=dev
 *   export CDK_DEFAULT_ACCOUNT=123456789012
 *   export CDK_DEFAULT_REGION=ap-northeast-1
 *   npx cdk deploy
 *
 * 設定例:
 *   cdk.json の context セクションで詳細設定が可能
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const networking_stack_1 = require("../lib/stacks/integrated/networking-stack");
const security_stack_1 = require("../lib/stacks/integrated/security-stack");
const data_stack_1 = require("../lib/stacks/integrated/data-stack");
const embedding_stack_1 = require("../lib/stacks/integrated/embedding-stack");
const tagging_config_1 = require("../lib/config/tagging-config");
const tokyo_production_config_1 = require("../lib/config/environments/tokyo-production-config");
const app = new cdk.App();
// プロジェクト設定の取得と検証
const projectName = process.env.PROJECT_NAME || 'permission-aware-rag';
const environment = process.env.ENVIRONMENT || 'dev';
const region = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;
// 必須環境変数の検証
if (!account) {
    console.error('❌ エラー: CDK_DEFAULT_ACCOUNT環境変数が設定されていません');
    process.exit(1);
}
// 環境名の検証
const validEnvironments = ['dev', 'staging', 'prod'];
if (!validEnvironments.includes(environment)) {
    console.error(`❌ エラー: 無効な環境名です: ${environment}. 有効な値: ${validEnvironments.join(', ')}`);
    process.exit(1);
}
console.log(`🚀 デプロイ設定:`);
console.log(`   プロジェクト名: ${projectName}`);
console.log(`   環境: ${environment}`);
console.log(`   リージョン: ${region}`);
console.log(`   アカウント: ${account}`);
// アプリケーションレベルでのタグ設定
const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(projectName, environment);
const environmentConfig = tagging_config_1.PermissionAwareRAGTags.getEnvironmentConfig(environment);
// 全体タグの適用
Object.entries(taggingConfig.customTags || {}).forEach(([key, value]) => {
    cdk.Tags.of(app).add(key, value);
});
Object.entries(environmentConfig.customTags || {}).forEach(([key, value]) => {
    cdk.Tags.of(app).add(key, value);
});
// コスト配布タグの適用
cdk.Tags.of(app).add('cost', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('CDK-Application', 'Permission-aware-RAG-FSxN');
cdk.Tags.of(app).add('Management-Method', 'AWS-CDK');
// 1. NetworkingStack - VPC・サブネット・VPC Endpoint
const networkingStack = new networking_stack_1.NetworkingStack(app, 'NetworkingStack', {
    config: tokyo_production_config_1.tokyoProductionConfig.networking,
    projectName,
    environment: environment,
    env: { account, region },
});
// 2. SecurityStack - IAM・KMS・WAF
const securityStack = new security_stack_1.SecurityStack(app, 'SecurityStack', {
    config: tokyo_production_config_1.tokyoProductionConfig.security,
    projectName,
    environment,
    env: { account, region },
});
securityStack.addDependency(networkingStack);
// 3. DataStack - S3・DynamoDB・OpenSearch・FSx
const dataStack = new data_stack_1.DataStack(app, 'DataStack', {
    config: {
        storage: tokyo_production_config_1.tokyoProductionConfig.storage,
        database: tokyo_production_config_1.tokyoProductionConfig.database,
    },
    securityStack,
    projectName,
    environment,
    env: { account, region },
});
dataStack.addDependency(securityStack);
// 4. EmbeddingStack - Embedding処理
try {
    const embeddingStack = new embedding_stack_1.EmbeddingStack(app, 'EmbeddingStack', {
        computeConfig: {
            // CDKコンテキストから設定を取得（パフォーマンス最適化）
            enableBatch: app.node.tryGetContext('embedding:enableAwsBatch') ?? true,
            enableEcs: app.node.tryGetContext('embedding:enableEcsOnEC2') ?? false,
            enableSpotFleet: app.node.tryGetContext('embedding:enableSpotFleet') ?? false,
            enableMonitoring: app.node.tryGetContext('embedding:enableMonitoring') ?? true,
            enableAutoScaling: app.node.tryGetContext('embedding:enableAutoScaling') ?? true,
        },
        aiConfig: {
            // AI設定（必要に応じて拡張）
            enableBedrock: true,
        },
        // Bedrock設定は直接プロパティとして指定
        bedrockRegion: app.node.tryGetContext('embedding:bedrock:region') ?? 'us-east-1',
        bedrockModelId: app.node.tryGetContext('embedding:bedrock:modelId') ?? 'amazon.nova-pro-v1:0',
        projectName,
        environment,
        // FSx統合設定（パフォーマンス向上）
        fsxFileSystemId: app.node.tryGetContext('embedding:fsx:fileSystemId'),
        fsxSvmId: app.node.tryGetContext('embedding:fsx:svmId'),
        fsxVolumeId: app.node.tryGetContext('embedding:fsx:volumeId'),
        // 負荷試験設定
        enableSqliteLoadTest: app.node.tryGetContext('embedding:enableSqliteLoadTest') ?? false,
        enableWindowsLoadTest: app.node.tryGetContext('embedding:enableWindowsLoadTest') ?? false,
        env: {
            account,
            region,
        },
    });
    embeddingStack.addDependency(dataStack);
    console.log(`✅ スタック "${embeddingStack.stackName}" を正常に初期化しました`);
}
catch (error) {
    console.error('❌ EmbeddingStack初期化エラー:', error);
    console.error('⚠️  EmbeddingStackはオプションです。他のスタックは正常にデプロイされます。');
}
console.log('');
console.log('📦 デプロイ対象スタック:');
console.log('  1. NetworkingStack - VPC・サブネット・Cognito VPC Endpoint');
console.log('  2. SecurityStack - IAM・KMS・WAF');
console.log('  3. DataStack - S3・DynamoDB・OpenSearch');
console.log('  4. EmbeddingStack - Embedding処理（オプション）');
// CDK合成実行
try {
    console.log('🔄 CloudFormationテンプレート合成中...');
    app.synth();
    console.log('✅ CloudFormationテンプレート合成完了');
}
catch (error) {
    console.error('❌ CDK合成エラー:', error);
    process.exit(1);
}
