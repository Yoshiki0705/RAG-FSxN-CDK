#!/usr/bin/env node
/**
 * NetworkingStack & DataStack デプロイ専用エントリーポイント
 * 
 * 機能:
 * - NetworkingStack: VPC・サブネット・Cognito VPC Endpoint
 * - SecurityStack: IAM・KMS・WAF
 * - DataStack: S3・DynamoDB・OpenSearch・FSx
 * 
 * 使用方法:
 *   export PROJECT_NAME=permission-aware-rag
 *   export ENVIRONMENT=prod
 *   export CDK_DEFAULT_ACCOUNT=178625946981
 *   export CDK_DEFAULT_REGION=ap-northeast-1
 *   npx cdk deploy --app "node bin/networking-datastack-app.js"
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkingStack } from '../lib/stacks/integrated/networking-stack';
import { SecurityStack } from '../lib/stacks/integrated/security-stack';
import { DataStack } from '../lib/stacks/integrated/data-stack';
import { TaggingStrategy, PermissionAwareRAGTags } from '../lib/config/tagging-config';
import { tokyoProductionConfig } from '../lib/config/environments/tokyo-production-config';

const app = new cdk.App();

// プロジェクト設定の取得と検証
const projectName = process.env.PROJECT_NAME || 'permission-aware-rag';
const environment = process.env.ENVIRONMENT || 'prod';
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
const taggingConfig = PermissionAwareRAGTags.getStandardConfig(projectName, environment);
const environmentConfig = PermissionAwareRAGTags.getEnvironmentConfig(environment);

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
const networkingStack = new NetworkingStack(app, 'NetworkingStack', {
  config: tokyoProductionConfig.networking,
  projectName,
  environment: environment as 'dev' | 'staging' | 'prod' | 'test',
  env: { account, region },
});

// 2. SecurityStack - IAM・KMS・WAF
const securityStack = new SecurityStack(app, 'SecurityStack', {
  config: tokyoProductionConfig.security,
  projectName,
  environment,
  env: { account, region },
});
securityStack.addDependency(networkingStack);

// 3. DataStack - S3・DynamoDB・OpenSearch・FSx
const dataStack = new DataStack(app, 'DataStack', {
  config: {
    storage: tokyoProductionConfig.storage,
    database: tokyoProductionConfig.database,
  },
  securityStack,
  projectName,
  environment,
  env: { account, region },
});
dataStack.addDependency(securityStack);

console.log('');
console.log('📦 デプロイ対象スタック:');
console.log('  1. NetworkingStack - VPC・サブネット・Cognito VPC Endpoint');
console.log('  2. SecurityStack - IAM・KMS・WAF');
console.log('  3. DataStack - S3・DynamoDB・OpenSearch・FSx');

// CDK合成実行
try {
  console.log('🔄 CloudFormationテンプレート合成中...');
  app.synth();
  console.log('✅ CloudFormationテンプレート合成完了');
} catch (error) {
  console.error('❌ CDK合成エラー:', error);
  process.exit(1);
}
