#!/usr/bin/env node
/**
 * シンプル埋め込みワークロードアプリケーション
 * FSx for NetApp ONTAP統合埋め込み処理用のCDKアプリケーション
 */
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleWorkloadStack } from '../lib/stacks/simple-workload-stack';

/**
 * アプリケーション設定インターフェース
 */
interface SimpleWorkloadAppConfig {
  readonly projectName: string;
  readonly environment: 'dev' | 'test' | 'staging' | 'prod';
  readonly region: string;
}

/**
 * プロジェクト名の検証
 */
function validateProjectName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('プロジェクト名が指定されていません');
  }
  
  // 英数字とハイフンのみ許可（3-64文字）
  if (!/^[a-zA-Z0-9-]{3,64}$/.test(name)) {
    throw new Error('プロジェクト名は英数字とハイフンのみ使用可能（3-64文字）');
  }
  
  return name;
}

/**
 * リージョンの検証
 */
function validateRegion(region: string): string {
  const validRegions = [
    'us-east-1', 'us-west-2', 'us-west-1',
    'eu-west-1', 'eu-central-1', 'eu-north-1',
    'ap-northeast-1', 'ap-northeast-3', 'ap-southeast-1', 'ap-southeast-2',
    'ap-south-1', 'ca-central-1', 'sa-east-1'
  ];
  
  if (!validRegions.includes(region)) {
    throw new Error(`サポートされていないリージョン: ${region}`);
  }
  
  return region;
}

/**
 * 環境名の検証
 */
function validateEnvironment(environment: string): 'dev' | 'test' | 'staging' | 'prod' {
  const allowedEnvironments = ['dev', 'test', 'staging', 'prod'] as const;
  
  if (!allowedEnvironments.includes(environment as any)) {
    throw new Error(`無効な環境名: ${environment}. 有効な値: ${allowedEnvironments.join(', ')}`);
  }
  
  return environment as 'dev' | 'test' | 'staging' | 'prod';
}

/**
 * 設定全体の検証
 */
function validateConfig(config: SimpleWorkloadAppConfig): void {
  // 追加の設定検証ロジック
  console.log(`✅ 設定検証完了: ${config.projectName}-${config.environment} (${config.region})`);
}

/**
 * メイン処理
 */
function main(): void {
  try {
    const app = new cdk.App();

    // コンテキスト変数の取得と検証
    const appConfig: SimpleWorkloadAppConfig = {
      projectName: validateProjectName(
        app.node.tryGetContext('projectName') || 'embedding-workload'
      ),
      environment: validateEnvironment(
        app.node.tryGetContext('environment') || 'dev'
      ),
      region: validateRegion(
        app.node.tryGetContext('region') || 'us-east-1'
      )
    };

    // 設定の最終検証
    validateConfig(appConfig);

    // スタック名の生成（命名規則に準拠）
    const stackName = `${appConfig.projectName}-${appConfig.environment}-simple-stack`;

    // SimpleWorkloadStackの作成
    new SimpleWorkloadStack(app, stackName, {
      projectName: appConfig.projectName,
      environment: appConfig.environment,
      env: {
        region: appConfig.region,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
      description: `Simple Embedding Workload Stack for ${appConfig.environment} environment`,
      tags: {
        Project: appConfig.projectName,
        Environment: appConfig.environment,
        Component: 'SimpleWorkload',
        ManagedBy: 'CDK',
        CreatedAt: new Date().toISOString(),
      },
    });

    // CloudFormationテンプレートの生成
    app.synth();
    
    console.log(`🚀 CDKアプリケーション初期化完了: ${stackName}`);
    
  } catch (error) {
    console.error('❌ CDKアプリケーション初期化失敗:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// グレースフルシャットダウンの設定
process.on('SIGINT', () => {
  console.log('\n⚠️ SIGINT受信、アプリケーションを終了します...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ SIGTERM受信、アプリケーションを終了します...');
  process.exit(0);
});

// メイン処理の実行
main();