#!/usr/bin/env node

/**
 * OpenSearch Multimodal Embeddingデプロイメントアプリケーション
 * 
 * Titan Multimodal Embedding用OpenSearchクラスターのデプロイ
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OpenSearchMultimodalStack } from '../lib/stacks/opensearch-multimodal-stack';

const app = new cdk.App();

// 環境設定取得
const environment = app.node.tryGetContext('environment') || 'dev';
const projectName = app.node.tryGetContext('projectName') || 'multimodal-rag';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
const performanceTier = app.node.tryGetContext('performanceTier') || 'standard';
const useVpc = app.node.tryGetContext('useVpc') === 'true';
const existingVpcId = app.node.tryGetContext('existingVpcId');
const enableKmsEncryption = app.node.tryGetContext('enableKmsEncryption') !== 'false';

// AWS環境設定
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: region,
};

// スタック名生成
const stackName = `${projectName}-${environment}-opensearch-multimodal`;

console.log('🚀 OpenSearch Multimodal Embeddingスタックデプロイ開始');
console.log(`📍 設定情報:`);
console.log(`  • 環境: ${environment}`);
console.log(`  • プロジェクト名: ${projectName}`);
console.log(`  • リージョン: ${region}`);
console.log(`  • パフォーマンスティア: ${performanceTier}`);
console.log(`  • VPC使用: ${useVpc}`);
console.log(`  • KMS暗号化: ${enableKmsEncryption}`);
console.log(`  • スタック名: ${stackName}`);

// OpenSearchスタック作成
const openSearchStack = new OpenSearchMultimodalStack(app, stackName, {
  env,
  environment,
  projectName,
  performanceTier: performanceTier as 'standard' | 'high',
  useVpc,
  existingVpcId,
  enableKmsEncryption,
  tags: {
    DeployedBy: 'CDK',
    DeploymentDate: new Date().toISOString().split('T')[0],
    EmbeddingModel: 'TitanMultimodal',
  },
  description: `OpenSearch cluster for ${projectName} multimodal embedding (${environment})`,
});

// スタック依存関係とメタデータ
cdk.Tags.of(openSearchStack).add('CDKApp', 'OpenSearchMultimodal');
cdk.Tags.of(openSearchStack).add('Version', '1.0.0');

console.log('✅ OpenSearch Multimodal Embeddingスタック設定完了');
console.log('💡 デプロイコマンド例:');
console.log(`   cdk deploy ${stackName} -c environment=${environment} -c region=${region}`);
console.log('💡 削除コマンド例:');
console.log(`   cdk destroy ${stackName} -c environment=${environment} -c region=${region}`);