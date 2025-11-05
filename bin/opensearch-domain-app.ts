#!/usr/bin/env node

/**
 * OpenSearch Domain CDKアプリケーション
 * 
 * 通常のOpenSearchクラスター（非Serverless）をデプロイ
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OpenSearchDomainStack } from '../lib/stacks/opensearch-domain-stack';

const app = new cdk.App();

// コンテキスト変数取得
const environment = app.node.tryGetContext('environment') || 'dev';
const projectName = app.node.tryGetContext('projectName') || 'multimodal';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
const useVpc = app.node.tryGetContext('useVpc') === 'true';
const existingVpcId = app.node.tryGetContext('existingVpcId');
const enableKmsEncryption = app.node.tryGetContext('enableKmsEncryption') === 'true';

// スタック名生成（Agent Steering命名規則準拠）
const getRegionPrefix = (region: string): string => {
  switch (region) {
    case 'ap-northeast-1': return 'TokyoRegion';
    case 'ap-northeast-3': return 'OsakaRegion';
    case 'us-east-1': return 'USEastRegion';
    case 'us-west-2': return 'USWestRegion';
    case 'eu-west-1': return 'EuropeRegion';
    default: return 'DefaultRegion';
  }
};

const regionPrefix = getRegionPrefix(region);
const stackName = app.node.tryGetContext('stackName') || `${regionPrefix}-${projectName}-${environment}-ExternalVectorDB`;

// OpenSearch Domainスタック作成
new OpenSearchDomainStack(app, stackName, {
  environment,
  projectName,
  useVpc,
  existingVpcId,
  enableKmsEncryption,
  
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
  
  tags: {
    Environment: environment,
    ProjectName: projectName,
    Component: 'OpenSearch',
    Purpose: 'MultimodalEmbedding',
    ManagedBy: 'CDK',
    DeployedBy: process.env.USER || 'unknown',
    DeployedAt: new Date().toISOString(),
  },
  
  description: `OpenSearch Domain for ${projectName} ${environment} environment - Multimodal Embedding`,
});