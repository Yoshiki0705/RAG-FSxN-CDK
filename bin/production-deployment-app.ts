#!/usr/bin/env node
/**
 * 本番環境デプロイメント統合アプリケーション
 * 既存の東京リージョンスタックと高度権限制御システムを統合
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AdvancedPermissionStack } from '../lib/stacks/integrated/advanced-permission-stack';
import { MultiRegionConfigFactory } from '../lib/config/multi-region-config-factory';
import { Region } from '../lib/config/interfaces/multi-region-config';
import { StackNamingGenerator } from '../lib/config/naming/stack-naming-generator';
import { StackComponent } from '../lib/config/interfaces/naming-config';

const app = new cdk.App();

// 環境設定と検証
const environment = app.node.tryGetContext('environment');
const projectName = app.node.tryGetContext('projectName');
const region = app.node.tryGetContext('region') || 'ap-northeast-1';

// 必須パラメータの検証
if (!environment) {
  throw new Error('環境変数 "environment" が設定されていません');
}
if (!['dev', 'staging', 'prod'].includes(environment)) {
  throw new Error(`無効な環境: ${environment}. dev, staging, prod のいずれかを指定してください`);
}
if (!projectName) {
  throw new Error('プロジェクト名 "projectName" が設定されていません');
}

console.log('🚀 本番環境デプロイメント開始...');
console.log('📝 プロジェクト名:', projectName);
console.log('🌍 環境:', environment);
console.log('🗾 リージョン:', region);

// 東京リージョン設定取得
let config;
try {
  config = MultiRegionConfigFactory.getConfig(Region.TOKYO);
  console.log('✅ 設定読み込み完了');
} catch (error) {
  console.error('❌ 設定読み込みエラー:', error);
  process.exit(1);
}

// 命名ジェネレーター初期化
const namingGenerator = new StackNamingGenerator({
  projectName,
  environment,
  regionPrefix: 'TokyoRegion'
});

// 既存スタックからの出力値を参照
const existingStackOutputs = {
  // 既存のNetworkingスタックから
  vpcId: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Networking-VpcId'),
  
  // 既存のSecurityスタックから
  kmsKeyArn: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Security-KmsKeyArn'),
  
  // 既存のDataスタックから
  opensearchEndpoint: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Data-OpenSearchEndpoint'),
  
  // 既存のComputeスタックから
  lambdaExecutionRoleArn: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Compute-LambdaExecutionRoleArn')
};

// 高度権限制御スタックのデプロイ
const advancedPermissionStack = new AdvancedPermissionStack(
  app, 
  namingGenerator.generateStackName(StackComponent.ADVANCED_PERMISSION), 
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    },
    config: {
      project: {
        name: projectName
      },
      region: config.region,
      networking: config.networking,
      security: config.security,
      storage: config.storage,
      database: config.database,
      compute: config.compute,
      ai: config.ai,
      monitoring: config.monitoring,
      enterprise: config.enterprise
    },
    environment,
    opensearchEndpoint: existingStackOutputs.opensearchEndpoint,
    kmsKeyArn: existingStackOutputs.kmsKeyArn,
    vpcId: existingStackOutputs.vpcId,
    namingGenerator
  }
);

// 既存スタックが存在することを前提としているため、
// 明示的な依存関係設定は不要（CloudFormation出力値の参照で自動的に依存関係が設定される）

// タグ設定
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Region', region);
cdk.Tags.of(app).add('DeploymentType', 'Production');
cdk.Tags.of(app).add('IntegrationType', 'ExistingStack');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Architecture', 'Modular');

console.log('✅ 本番環境デプロイメント設定完了');
console.log('📦 デプロイ対象スタック:', namingGenerator.generateStackName(StackComponent.ADVANCED_PERMISSION));

app.synth();