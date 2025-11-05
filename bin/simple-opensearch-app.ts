#!/usr/bin/env node

/**
 * シンプルなOpenSearchデプロイメントアプリケーション
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleOpenSearchStack } from '../lib/stacks/simple-opensearch-stack';

const app = new cdk.App();

// 環境設定取得
const environment = app.node.tryGetContext('environment') || 'dev';
const projectName = app.node.tryGetContext('projectName') || 'multimodal';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';

// AWS環境設定
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: region,
};

// スタック名生成
const stackName = `${projectName}-${environment}-opensearch`;

console.log('🚀 シンプルOpenSearchスタックデプロイ開始');
console.log(`📍 設定情報:`);
console.log(`  • 環境: ${environment}`);
console.log(`  • プロジェクト名: ${projectName}`);
console.log(`  • リージョン: ${region}`);
console.log(`  • スタック名: ${stackName}`);

// OpenSearchスタック作成
const openSearchStack = new SimpleOpenSearchStack(app, stackName, {
  env,
  environment,
  projectName,
  description: `Simple OpenSearch cluster for ${projectName} (${environment})`,
});

console.log('✅ シンプルOpenSearchスタック設定完了');