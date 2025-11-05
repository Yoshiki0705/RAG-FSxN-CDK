#!/usr/bin/env node
/**
 * Embedding Batch デプロイメントアプリケーション
 * 
 * Agent Steeringルール準拠:
 * - 実際のAWS環境へのCDKデプロイ実行
 * - Batchリソース作成確認
 * - FSx for NetApp ONTAPマウント動作確認
 * 
 * Requirements: 1.4, 1.5, 8.3
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { EmbeddingStack } from '../lib/stacks/integrated/embedding-stack';

const app = new cdk.App();

// 環境設定
const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

// Batch統合設定
const enableBatchIntegration = app.node.tryGetContext('enableBatchIntegration') ?? true;
const enableBatchTesting = app.node.tryGetContext('enableBatchTesting') ?? false;
const imagePath = app.node.tryGetContext('imagePath') || 'embedding-server';
const imageTag = app.node.tryGetContext('imageTag') || 'latest';

// スタック名生成（統一命名規則）
const stackName = `${projectName}-${environment}-embedding-batch`;

// EmbeddingStackのデプロイ
const embeddingStack = new EmbeddingStack(app, 'EmbeddingBatchStack', {
  stackName,
  env: {
    account,
    region,
  },
  
  // 既存の設定（型安全な設定）
  computeConfig: {
    lambda: {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: 300,
      memorySize: 512,
    },
    ecs: {
      enabled: false,
      cluster: { 
        containerInsights: false 
      }
    },
    batch: {
      enabled: enableBatchIntegration,
      computeEnvironments: [],
      jobQueues: []
    },
  },
  aiConfig: {
    bedrock: {
      enabled: true,
      models: {
        embedding: 'amazon.titan-embed-text-v1',
        textGeneration: 'anthropic.claude-3-sonnet-20240229-v1:0',
      },
    },
  },
  
  // Embedding Batch統合設定
  projectName,
  environment,
  enableBatchIntegration,
  enableBatchTesting,
  imagePath,
  imageTag,
  
  // 既存システムとの分離
  vpcId: app.node.tryGetContext('vpcId'), // 既存VPCを使用する場合
  privateSubnetIds: app.node.tryGetContext('privateSubnetIds'),
  securityGroupIds: app.node.tryGetContext('securityGroupIds'),
  
  // リソース設定
  kmsKeyArn: app.node.tryGetContext('kmsKeyArn'),
  s3BucketArns: app.node.tryGetContext('s3BucketArns'),
  dynamoDbTableArns: app.node.tryGetContext('dynamoDbTableArns'),
  openSearchCollectionArn: app.node.tryGetContext('openSearchCollectionArn'),
  
  // タグ設定
  tags: {
    Project: projectName,
    Environment: environment,
    Component: 'Embedding',
    Module: 'BATCH_DEPLOYMENT',
    ManagedBy: 'CDK',
    DeploymentType: 'BatchIntegration',
  },
});

// CloudFormation出力
new cdk.CfnOutput(embeddingStack, 'DeploymentInfo', {
  value: JSON.stringify({
    stackName: embeddingStack.stackName,
    region: embeddingStack.region,
    account: embeddingStack.account,
    batchIntegrationEnabled: enableBatchIntegration,
    batchTestingEnabled: enableBatchTesting,
    embeddingConfig: {
      awsBatchEnabled: embeddingStack.getEmbeddingConfig().awsBatch.enabled,
      projectName: embeddingStack.getEmbeddingConfig().projectName,
      environment: embeddingStack.getEmbeddingConfig().environment,
    },
  }),
  description: 'Embedding Batch Deployment Information',
});

// デプロイメント後の確認用出力
new cdk.CfnOutput(embeddingStack, 'PostDeploymentChecklist', {
  value: JSON.stringify({
    steps: [
      '1. Batch Compute Environment が VALID 状態であることを確認',
      '2. Job Definition が ACTIVE 状態であることを確認',
      '3. Job Queue が ENABLED 状態であることを確認',
      '4. FSx for NetApp ONTAP ファイルシステムが AVAILABLE 状態であることを確認',
      '5. テストジョブを実行してFSxマウントを確認',
      '6. 自動スケーリング・自動復旧機能をテスト',
    ],
    testCommands: [
      'aws batch describe-compute-environments --compute-environments <compute-env-name>',
      'aws batch describe-job-definitions --job-definition-name <job-def-name>',
      'aws batch describe-job-queues --job-queues <job-queue-name>',
      'aws fsx describe-file-systems --file-system-ids <fsx-id>',
    ],
  }),
  description: 'Post-deployment verification checklist',
});

// 環境別設定例の出力
new cdk.CfnOutput(embeddingStack, 'ContextExample', {
  value: JSON.stringify(EmbeddingStack.getContextExample(environment), null, 2),
  description: `CDK Context example for ${environment} environment`,
});

app.synth();