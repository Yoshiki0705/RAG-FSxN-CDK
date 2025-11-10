#!/usr/bin/env node
/**
 * NetworkingStackのみをデプロイするエントリーポイント
 * 
 * 既存のTypeScriptエラーを回避し、NetworkingStackのみをビルド・デプロイ可能にする
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkingStack } from '../lib/stacks/integrated/networking-stack';
import { NetworkingConfig } from '../lib/modules/networking/interfaces/networking-config';

const app = new cdk.App();

// CDKコンテキスト変数から設定を取得
const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
const environment = app.node.tryGetContext('environment') || 'prod';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';
const account = process.env.CDK_DEFAULT_ACCOUNT || '178625946981';

// リージョンプレフィックスの生成
const regionPrefixes: { [key: string]: string } = {
  'ap-northeast-1': 'TokyoRegion',
  'ap-northeast-3': 'OsakaRegion',
  'us-east-1': 'VirginiaRegion',
  'us-west-2': 'OregonRegion',
  'eu-west-1': 'IrelandRegion',
  'eu-central-1': 'FrankfurtRegion',
};

const regionPrefix = regionPrefixes[region] || 'DefaultRegion';

// NetworkingConfig設定
const networkingConfig: NetworkingConfig = {
  vpcCidr: '10.0.0.0/16',
  maxAzs: 2,
  enablePublicSubnets: true,
  enablePrivateSubnets: true,
  enableIsolatedSubnets: true,
  enableNatGateway: true,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  enableFlowLogs: false,
  
  // VPCエンドポイント設定
  vpcEndpoints: {
    s3: true,
    dynamodb: true,
    lambda: false,
    opensearch: false,
    // Cognito VPC Endpoint（CDKコンテキスト変数で制御）
    cognito: {
      enabled: app.node.tryGetContext('cognitoPrivateEndpoint') || false,
      enablePrivateDns: true,
      subnets: {
        subnetType: 'PRIVATE_WITH_EGRESS',
      },
    },
  },
  
  // セキュリティグループ設定
  securityGroups: {
    web: true,
    api: true,
    database: true,
    lambda: true,
  },
};

// NetworkingStackの作成
const stackName = `${regionPrefix}-${projectName}-${environment}-NetworkingStack`;

new NetworkingStack(app, stackName, {
  config: networkingConfig,
  projectName,
  environment: environment as 'dev' | 'staging' | 'prod' | 'test',
  env: {
    account,
    region,
  },
  description: `Networking infrastructure for ${projectName} (${environment})`,
  tags: {
    Project: projectName,
    Environment: environment,
    Stack: 'NetworkingStack',
    ManagedBy: 'CDK',
  },
});

app.synth();
