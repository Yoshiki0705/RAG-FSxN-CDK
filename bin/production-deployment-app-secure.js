#!/usr/bin/env node
/**
 * 本番環境デプロイメント統合アプリケーション（セキュリティ強化版）
 * 既存の東京リージョンスタックと高度権限制御システムを統合
 */

require('source-map-support/register');
const cdk = require('aws-cdk-lib');
const { AdvancedPermissionStack } = require('../lib/stacks/integrated/advanced-permission-stack');
const { getAdvancedPermissionDeploymentConfig } = require('../lib/config/environments/advanced-permission-deployment-config');

const app = new cdk.App();

// 環境設定（検証付き）
const environment = app.node.tryGetContext('environment') || 'prod';
const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';

// 必須環境変数の検証
const requiredEnvVars = ['CDK_DEFAULT_ACCOUNT', 'OPENSEARCH_ENDPOINT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 必須環境変数が設定されていません:', missingVars.join(', '));
  console.error('設定例:');
  console.error('export CDK_DEFAULT_ACCOUNT=123456789012');
  console.error('export OPENSEARCH_ENDPOINT=https://your-opensearch-endpoint.ap-northeast-1.es.amazonaws.com');
  process.exit(1);
}

console.log('🚀 本番環境デプロイメント開始...');
console.log('📝 プロジェクト名:', projectName);
console.log('🌍 環境:', environment);
console.log('🗾 リージョン:', region);

// 外部設定ファイルから設定を取得
let config;
try {
  config = getAdvancedPermissionDeploymentConfig(environment);
  console.log('✅ 環境設定読み込み完了');
} catch (error) {
  console.error('❌ 環境設定読み込みエラー:', error.message);
  process.exit(1);
}

// 命名ジェネレーター（既存のものを使用）
const { StackNamingGenerator, StackComponent } = require('../lib/config/naming/stack-naming-generator');
const namingGenerator = new StackNamingGenerator({
  projectName,
  environment,
  regionPrefix: 'TokyoRegion'
});

// 既存スタック出力値の安全な参照
function safeImportValue(exportName, fallbackValue = null) {
  try {
    return cdk.Fn.importValue(exportName);
  } catch (error) {
    console.warn(`⚠️ 出力値の参照に失敗: ${exportName}`);
    if (fallbackValue === null) {
      throw new Error(`必須の出力値が見つかりません: ${exportName}`);
    }
    return fallbackValue;
  }
}

// 既存スタックからの出力値を安全に参照
const existingStackOutputs = {
  // VPC ID（必須）
  vpcId: safeImportValue('TokyoRegion-permission-aware-rag-prod-Networking-VpcId'),
  
  // KMS Key ARN（オプション）
  kmsKeyArn: safeImportValue('TokyoRegion-permission-aware-rag-prod-Security-KmsKeyArn', undefined),
  
  // OpenSearch Endpoint（環境変数から取得）
  opensearchEndpoint: process.env.OPENSEARCH_ENDPOINT
};

// 高度権限制御スタックのデプロイ
try {
  const advancedPermissionStack = new AdvancedPermissionStack(
    app, 
    namingGenerator.generateStackName(StackComponent.ADVANCED_PERMISSION), 
    {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
      },
      config,
      environment,
      opensearchEndpoint: existingStackOutputs.opensearchEndpoint,
      kmsKeyArn: existingStackOutputs.kmsKeyArn,
      vpcId: existingStackOutputs.vpcId,
      namingGenerator
    }
  );

  console.log('✅ 高度権限制御スタック設定完了');
} catch (error) {
  console.error('❌ スタック作成エラー:', error.message);
  process.exit(1);
}

// タグ設定
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Region', region);
cdk.Tags.of(app).add('DeploymentType', 'Production');
cdk.Tags.of(app).add('IntegrationType', 'ExistingStack');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Architecture', 'Modular');
cdk.Tags.of(app).add('SecurityLevel', 'Enterprise');

console.log('✅ 本番環境デプロイメント設定完了');
console.log('📦 デプロイ対象スタック:', namingGenerator.generateStackName(StackComponent.ADVANCED_PERMISSION));

// エラーハンドリング付きでsynth実行
try {
  app.synth();
  console.log('🎉 CDKテンプレート生成完了');
} catch (error) {
  console.error('❌ CDKテンプレート生成エラー:', error.message);
  process.exit(1);
}