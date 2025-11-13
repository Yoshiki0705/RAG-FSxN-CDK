#!/usr/bin/env node
/**
 * WebAppStack統合デプロイエントリーポイント
 * 
 * 用途:
 * - WebAppStackの標準デプロイ
 * - 環境変数による柔軟な設定
 * - MultiRegionConfigFactoryによる設定管理
 * 
 * 使用方法:
 *   npx cdk deploy -a "npx ts-node bin/deploy-webapp.ts"
 * 
 * 環境変数:
 *   PROJECT_NAME: プロジェクト名（デフォルト: permission-aware-rag）
 *   ENVIRONMENT: 環境名（デフォルト: prod）
 *   CDK_DEFAULT_REGION: リージョン（デフォルト: ap-northeast-1）
 *   CDK_DEFAULT_ACCOUNT: AWSアカウントID（必須）
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebAppStack } from '../lib/stacks/integrated/webapp-stack';
import { tokyoProductionConfig } from '../lib/config/environments/tokyo-production-config';

const app = new cdk.App();

// 環境設定
const projectName = process.env.PROJECT_NAME || 'permission-aware-rag';
const environment = process.env.ENVIRONMENT || 'prod';
const region = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;

if (!account) {
  console.error('❌ エラー: CDK_DEFAULT_ACCOUNT環境変数が設定されていません');
  console.error('');
  console.error('設定方法:');
  console.error('  export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)');
  process.exit(1);
}

console.log('🚀 WebAppStackデプロイ設定:');
console.log(`   プロジェクト名: ${projectName}`);
console.log(`   環境: ${environment}`);
console.log(`   リージョン: ${region}`);
console.log(`   アカウント: ${account}`);

// 設定読み込み
const config = tokyoProductionConfig;
console.log('✅ 設定読み込み完了');

// スタック名生成
const stackName = `${config.naming.regionPrefix}-${projectName}-${environment}-WebApp`;

// WebAppStackのデプロイ
try {
  const webAppStack = new WebAppStack(app, stackName, {
    env: {
      account,
      region,
    },
    config,
  });

  console.log(`✅ WebAppStack "${webAppStack.stackName}" を初期化しました`);

  // タグ設定
  cdk.Tags.of(app).add('Project', projectName);
  cdk.Tags.of(app).add('Environment', environment);
  cdk.Tags.of(app).add('ManagedBy', 'CDK');
  cdk.Tags.of(app).add('Region', region);

  app.synth();
} catch (error) {
  console.error('❌ WebAppStack初期化エラー:', error);
  process.exit(1);
}
