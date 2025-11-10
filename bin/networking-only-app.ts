#!/usr/bin/env node
/**
 * NetworkingStack専用エントリーポイント
 * 既存のビルドエラーを回避してNetworkingStackのみをデプロイ
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkingStack } from '../lib/stacks/integrated/networking-stack';
import { tokyoProductionConfig } from '../lib/config/environments/tokyo-production-config';

const app = new cdk.App();

// 環境変数の取得
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';
const projectName = 'permission-aware-rag';
const environment = 'prod';

if (!account) {
  console.error('❌ エラー: CDK_DEFAULT_ACCOUNT環境変数が設定されていません');
  process.exit(1);
}

console.log(`🚀 NetworkingStackデプロイ設定:`);
console.log(`   プロジェクト名: ${projectName}`);
console.log(`   環境: ${environment}`);
console.log(`   リージョン: ${region}`);
console.log(`   アカウント: ${account}`);

// Cognito Private Endpoint設定
const cognitoPrivateEndpoint = app.node.tryGetContext('cognitoPrivateEndpoint') === true;
const existingVpcId = app.node.tryGetContext('existingVpcId');

console.log(`   Cognito Private Endpoint: ${cognitoPrivateEndpoint ? '有効' : '無効'}`);
console.log(`   既存VPC ID: ${existingVpcId || '新規作成'}`);

// NetworkingStack設定（既存VPC IDを設定に追加）
const networkingConfig = {
  ...tokyoProductionConfig.networking,
  existingVpcId: existingVpcId || undefined,
};

// NetworkingStackのデプロイ
new NetworkingStack(app, 'NetworkingStack', {
  config: networkingConfig,
  projectName,
  environment: environment as any,
  env: {
    account,
    region,
  },
});

// タグ設定
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');

app.synth();
