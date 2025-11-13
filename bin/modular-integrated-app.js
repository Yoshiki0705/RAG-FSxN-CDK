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
const embedding_stack_1 = require("../lib/stacks/integrated/embedding-stack");
const tagging_config_1 = require("../lib/config/tagging-config");
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
// Embedding Batch統合スタックのデプロイ
try {
    const embeddingStack = new embedding_stack_1.EmbeddingStack(app, 'EmbeddingStack', {
        aiConfig: {
            bedrock: {
                enabled: true,
                models: {
                    titanEmbeddings: true,
                },
                monitoring: {
                    cloudWatchMetrics: true,
                },
            },
            embedding: {
                enabled: true,
                model: app.node.tryGetContext('embedding:bedrock:modelId') ?? 'amazon.titan-embed-text-v1',
                dimensions: 1536,
            },
            model: {
                enabled: false,
                customModels: false,
            },
        },
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
    console.log(`✅ スタック "${embeddingStack.stackName}" を正常に初期化しました`);
}
catch (error) {
    console.error('❌ スタック初期化エラー:', error);
    process.exit(1);
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxhci1pbnRlZ3JhdGVkLWFwcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZHVsYXItaW50ZWdyYXRlZC1hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUJHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsdUNBQXFDO0FBQ3JDLGlEQUFtQztBQUNuQyw4RUFBMEU7QUFDMUUsaUVBQXVGO0FBRXZGLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLGlCQUFpQjtBQUNqQixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxzQkFBc0IsQ0FBQztBQUN2RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUM7QUFDckQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxnQkFBZ0IsQ0FBQztBQUNsRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0FBRWhELFlBQVk7QUFDWixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7SUFDMUQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDO0FBRUQsU0FBUztBQUNULE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3JELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztJQUM3QyxPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixXQUFXLFdBQVcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN4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KiDjg6Ljgrjjg6Xjg6njg7zntbHlkIjjgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7Mg44Ko44Oz44OI44Oq44O844Od44Kk44Oz44OIXG4gKiBFbWJlZGRpbmcgQmF0Y2jntbHlkIjnlKjjga7ntbHkuIDjgqjjg7Pjg4jjg6rjg7zjg53jgqTjg7Pjg4hcbiAqIFxuICog5qmf6IO9OlxuICogLSBBbWF6b24gTm92YSBQcm/ntbHlkIjjgavjgojjgovjgrPjgrnjg4jmnIDpganljJbvvIg2MC04MCXliYrmuJvvvIlcbiAqIC0g57Wx5LiA44K/44Kw5oim55Wl44Gr44KI44KL44Kz44K544OI6YWN5biD566h55CGXG4gKiAtIOeSsOWig+WIpeioreWumuOBruiHquWLlemBqeeUqFxuICogLSBGU3ggZm9yIE5ldEFwcCBPTlRBUOe1seWQiFxuICogLSBTUUxpdGXosqDojbfoqabpqJPmqZ/og71cbiAqIC0g44Ko44Op44O844OP44Oz44OJ44Oq44Oz44Kw44Go44Ot44Kw5Ye65YqbXG4gKiBcbiAqIOS9v+eUqOaWueazlTpcbiAqICAgZXhwb3J0IFBST0pFQ1RfTkFNRT1wZXJtaXNzaW9uLWF3YXJlLXJhZ1xuICogICBleHBvcnQgRU5WSVJPTk1FTlQ9ZGV2XG4gKiAgIGV4cG9ydCBDREtfREVGQVVMVF9BQ0NPVU5UPTEyMzQ1Njc4OTAxMlxuICogICBleHBvcnQgQ0RLX0RFRkFVTFRfUkVHSU9OPWFwLW5vcnRoZWFzdC0xXG4gKiAgIG5weCBjZGsgZGVwbG95XG4gKiBcbiAqIOioreWumuS+izpcbiAqICAgY2RrLmpzb24g44GuIGNvbnRleHQg44K744Kv44K344On44Oz44Gn6Kmz57Sw6Kit5a6a44GM5Y+v6IO9XG4gKi9cblxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEVtYmVkZGluZ1N0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9pbnRlZ3JhdGVkL2VtYmVkZGluZy1zdGFjayc7XG5pbXBvcnQgeyBUYWdnaW5nU3RyYXRlZ3ksIFBlcm1pc3Npb25Bd2FyZVJBR1RhZ3MgfSBmcm9tICcuLi9saWIvY29uZmlnL3RhZ2dpbmctY29uZmlnJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8g44OX44Ot44K444Kn44Kv44OI6Kit5a6a44Gu5Y+W5b6X44Go5qSc6Ki8XG5jb25zdCBwcm9qZWN0TmFtZSA9IHByb2Nlc3MuZW52LlBST0pFQ1RfTkFNRSB8fCAncGVybWlzc2lvbi1hd2FyZS1yYWcnO1xuY29uc3QgZW52aXJvbm1lbnQgPSBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVCB8fCAnZGV2JztcbmNvbnN0IHJlZ2lvbiA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAnYXAtbm9ydGhlYXN0LTEnO1xuY29uc3QgYWNjb3VudCA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQ7XG5cbi8vIOW/hemgiOeSsOWig+WkieaVsOOBruaknOiovFxuaWYgKCFhY2NvdW50KSB7XG4gIGNvbnNvbGUuZXJyb3IoJ+KdjCDjgqjjg6njg7w6IENES19ERUZBVUxUX0FDQ09VTlTnkrDlooPlpInmlbDjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufVxuXG4vLyDnkrDlooPlkI3jga7mpJzoqLxcbmNvbnN0IHZhbGlkRW52aXJvbm1lbnRzID0gWydkZXYnLCAnc3RhZ2luZycsICdwcm9kJ107XG5pZiAoIXZhbGlkRW52aXJvbm1lbnRzLmluY2x1ZGVzKGVudmlyb25tZW50KSkge1xuICBjb25zb2xlLmVycm9yKGDinYwg44Ko44Op44O8OiDnhKHlirnjgarnkrDlooPlkI3jgafjgZk6ICR7ZW52aXJvbm1lbnR9LiDmnInlirnjgarlgKQ6ICR7dmFsaWRFbnZpcm9ubWVudHMuam9pbignLCAnKX1gKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufVxuXG5jb25zb2xlLmxvZyhg8J+agCDjg4fjg5fjg63jgqToqK3lrpo6YCk7XG5jb25zb2xlLmxvZyhgICAg44OX44Ot44K444Kn44Kv44OI5ZCNOiAke3Byb2plY3ROYW1lfWApO1xuY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtlbnZpcm9ubWVudH1gKTtcbmNvbnNvbGUubG9nKGAgICDjg6rjg7zjgrjjg6fjg7M6ICR7cmVnaW9ufWApO1xuY29uc29sZS5sb2coYCAgIOOCouOCq+OCpuODs+ODiDogJHthY2NvdW50fWApO1xuXG4vLyDjgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7Pjg6zjg5njg6vjgafjga7jgr/jgrDoqK3lrppcbmNvbnN0IHRhZ2dpbmdDb25maWcgPSBQZXJtaXNzaW9uQXdhcmVSQUdUYWdzLmdldFN0YW5kYXJkQ29uZmlnKHByb2plY3ROYW1lLCBlbnZpcm9ubWVudCk7XG5jb25zdCBlbnZpcm9ubWVudENvbmZpZyA9IFBlcm1pc3Npb25Bd2FyZVJBR1RhZ3MuZ2V0RW52aXJvbm1lbnRDb25maWcoZW52aXJvbm1lbnQpO1xuXG4vLyDlhajkvZPjgr/jgrDjga7pgannlKhcbk9iamVjdC5lbnRyaWVzKHRhZ2dpbmdDb25maWcuY3VzdG9tVGFncyB8fCB7fSkuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gIGNkay5UYWdzLm9mKGFwcCkuYWRkKGtleSwgdmFsdWUpO1xufSk7XG5cbk9iamVjdC5lbnRyaWVzKGVudmlyb25tZW50Q29uZmlnLmN1c3RvbVRhZ3MgfHwge30pLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICBjZGsuVGFncy5vZihhcHApLmFkZChrZXksIHZhbHVlKTtcbn0pO1xuXG4vLyDjgrPjgrnjg4jphY3luIPjgr/jgrDjga7pgannlKhcbmNkay5UYWdzLm9mKGFwcCkuYWRkKCdjb3N0JywgcHJvamVjdE5hbWUpO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ0Vudmlyb25tZW50JywgZW52aXJvbm1lbnQpO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ1Byb2plY3QnLCBwcm9qZWN0TmFtZSk7XG5jZGsuVGFncy5vZihhcHApLmFkZCgnQ0RLLUFwcGxpY2F0aW9uJywgJ1Blcm1pc3Npb24tYXdhcmUtUkFHLUZTeE4nKTtcbmNkay5UYWdzLm9mKGFwcCkuYWRkKCdNYW5hZ2VtZW50LU1ldGhvZCcsICdBV1MtQ0RLJyk7XG5cbi8vIEVtYmVkZGluZyBCYXRjaOe1seWQiOOCueOCv+ODg+OCr+OBruODh+ODl+ODreOCpFxudHJ5IHtcbiAgY29uc3QgZW1iZWRkaW5nU3RhY2sgPSBuZXcgRW1iZWRkaW5nU3RhY2soYXBwLCAnRW1iZWRkaW5nU3RhY2snLCB7XG4gICAgYWlDb25maWc6IHtcbiAgICAgIGJlZHJvY2s6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgbW9kZWxzOiB7XG4gICAgICAgICAgdGl0YW5FbWJlZGRpbmdzOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBtb25pdG9yaW5nOiB7XG4gICAgICAgICAgY2xvdWRXYXRjaE1ldHJpY3M6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgZW1iZWRkaW5nOiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIG1vZGVsOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6YmVkcm9jazptb2RlbElkJykgPz8gJ2FtYXpvbi50aXRhbi1lbWJlZC10ZXh0LXYxJyxcbiAgICAgICAgZGltZW5zaW9uczogMTUzNixcbiAgICAgIH0sXG4gICAgICBtb2RlbDoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgY3VzdG9tTW9kZWxzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwcm9qZWN0TmFtZSxcbiAgICBlbnZpcm9ubWVudCxcbiAgICAvLyBGU3jntbHlkIjoqK3lrprvvIjjg5Hjg5Xjgqnjg7zjg57jg7PjgrnlkJHkuIrvvIlcbiAgICBmc3hGaWxlU3lzdGVtSWQ6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpmc3g6ZmlsZVN5c3RlbUlkJyksXG4gICAgZnN4U3ZtSWQ6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpmc3g6c3ZtSWQnKSxcbiAgICBmc3hWb2x1bWVJZDogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmZzeDp2b2x1bWVJZCcpLFxuICAgIC8vIOiyoOiNt+ippumok+ioreWumlxuICAgIGVuYWJsZVNxbGl0ZUxvYWRUZXN0OiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6ZW5hYmxlU3FsaXRlTG9hZFRlc3QnKSA/PyBmYWxzZSxcbiAgICBlbmFibGVXaW5kb3dzTG9hZFRlc3Q6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzplbmFibGVXaW5kb3dzTG9hZFRlc3QnKSA/PyBmYWxzZSxcbiAgICBlbnY6IHtcbiAgICAgIGFjY291bnQsXG4gICAgICByZWdpb24sXG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc29sZS5sb2coYOKchSDjgrnjgr/jg4Pjgq8gXCIke2VtYmVkZGluZ1N0YWNrLnN0YWNrTmFtZX1cIiDjgpLmraPluLjjgavliJ3mnJ/ljJbjgZfjgb7jgZfjgZ9gKTtcbiAgXG59IGNhdGNoIChlcnJvcikge1xuICBjb25zb2xlLmVycm9yKCfinYwg44K544K/44OD44Kv5Yid5pyf5YyW44Ko44Op44O8OicsIGVycm9yKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufVxuXG4vLyBDREvlkIjmiJDlrp/ooYxcbnRyeSB7XG4gIGNvbnNvbGUubG9nKCfwn5SEIENsb3VkRm9ybWF0aW9u44OG44Oz44OX44Os44O844OI5ZCI5oiQ5LitLi4uJyk7XG4gIGFwcC5zeW50aCgpO1xuICBjb25zb2xlLmxvZygn4pyFIENsb3VkRm9ybWF0aW9u44OG44Oz44OX44Os44O844OI5ZCI5oiQ5a6M5LqGJyk7XG59IGNhdGNoIChlcnJvcikge1xuICBjb25zb2xlLmVycm9yKCfinYwgQ0RL5ZCI5oiQ44Ko44Op44O8OicsIGVycm9yKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufVxuIl19