#!/usr/bin/env node
/**
 * NetworkingStack専用エントリーポイント
 * 
 * Cognito VPC Endpoint統合のテスト用
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { NetworkingStack } from '../lib/stacks/integrated/networking-stack';

const app = new cdk.App();

// 環境変数の取得
const account = process.env.CDK_DEFAULT_ACCOUNT || '533267025162';
const region = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';
const projectName = 'permission-aware-rag';
const environment = 'prod';

console.log(`🚀 NetworkingStackデプロイ設定:`);
console.log(`   プロジェクト名: ${projectName}`);
console.log(`   環境: ${environment}`);
console.log(`   リージョン: ${region}`);
console.log(`   アカウント: ${account}`);

// Cognito Private Endpoint設定
const cognitoPrivateEndpoint = app.node.tryGetContext('cognitoPrivateEndpoint') === true;
console.log(`   Cognito Private Endpoint: ${cognitoPrivateEndpoint ? '有効' : '無効'}`);

// NetworkingStack設定
const networkingConfig = {
  vpcCidr: '10.0.0.0/16',
  maxAzs: 2,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  enablePublicSubnets: true,
  enablePrivateSubnets: true,
  enableIsolatedSubnets: false,
  enableNatGateway: true,
  enableFlowLogs: true,
  securityGroups: {
    web: true,
    api: true,
    database: true,
    lambda: true,
  },
  vpcEndpoints: {
    s3: true,
    dynamodb: true,
  },
};

// NetworkingStackのデプロイ
const networkingStack = new NetworkingStack(app, 'NetworkingStack', {
  config: networkingConfig as any,
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
