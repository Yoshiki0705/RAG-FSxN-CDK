#!/usr/bin/env node
/**
 * 本番環境デプロイメント統合アプリケーション（TypeScript版）
 * 既存の東京リージョンスタックと高度権限制御システムを統合
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AdvancedPermissionStack } from '../lib/stacks/integrated/advanced-permission-stack';
import { getAdvancedPermissionDeploymentConfig } from '../lib/config/environments/advanced-permission-deployment-config';
import { StackNamingGenerator, StackComponent } from '../lib/config/naming/stack-naming-generator';

interface DeploymentConfig {
  environment: string;
  projectName: string;
  region: string;
  opensearchEndpoint: string;
  account: string;
}

class ProductionDeploymentApp {
  private app: cdk.App;
  private config: DeploymentConfig;
  private namingGenerator: StackNamingGenerator;

  constructor() {
    this.app = new cdk.App();
    this.validateEnvironment();
    this.initializeConfig();
    this.initializeNamingGenerator();
  }

  /**
   * 環境変数の検証
   */
  private validateEnvironment(): void {
    const requiredEnvVars = ['CDK_DEFAULT_ACCOUNT', 'OPENSEARCH_ENDPOINT'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ 必須環境変数が設定されていません:', missingVars.join(', '));
      console.error('設定例:');
      console.error('export CDK_DEFAULT_ACCOUNT=123456789012');
      console.error('export OPENSEARCH_ENDPOINT=https://your-opensearch-endpoint.ap-northeast-1.es.amazonaws.com');
      process.exit(1);
    }
  }

  /**
   * 設定の初期化
   */
  private initializeConfig(): void {
    this.config = {
      environment: this.app.node.tryGetContext('environment') || 'prod',
      projectName: this.app.node.tryGetContext('projectName') || 'permission-aware-rag',
      region: this.app.node.tryGetContext('region') || 'ap-northeast-1',
      opensearchEndpoint: process.env.OPENSEARCH_ENDPOINT!,
      account: process.env.CDK_DEFAULT_ACCOUNT!
    };

    console.log('🚀 本番環境デプロイメント開始...');
    console.log('📝 プロジェクト名:', this.config.projectName);
    console.log('🌍 環境:', this.config.environment);
    console.log('🗾 リージョン:', this.config.region);
  }

  /**
   * 命名ジェネレーターの初期化
   */
  private initializeNamingGenerator(): void {
    this.namingGenerator = new StackNamingGenerator({
      projectName: this.config.projectName,
      environment: this.config.environment,
      regionPrefix: 'TokyoRegion'
    });
  }

  /**
   * 既存スタック出力値の安全な参照
   */
  private safeImportValue(exportName: string, fallbackValue?: string): string | undefined {
    try {
      return cdk.Fn.importValue(exportName);
    } catch (error) {
      console.warn(`⚠️ 出力値の参照に失敗: ${exportName}`);
      if (fallbackValue === undefined && !exportName.includes('Optional')) {
        throw new Error(`必須の出力値が見つかりません: ${exportName}`);
      }
      return fallbackValue;
    }
  }

  /**
   * 高度権限制御スタックの作成
   */
  private createAdvancedPermissionStack(): void {
    try {
      // 外部設定ファイルから設定を取得
      const deploymentConfig = getAdvancedPermissionDeploymentConfig(this.config.environment);
      console.log('✅ 環境設定読み込み完了');

      // 既存スタックからの出力値を安全に参照
      const existingStackOutputs = {
        vpcId: this.safeImportValue('TokyoRegion-permission-aware-rag-prod-Networking-VpcId'),
        kmsKeyArn: this.safeImportValue('TokyoRegion-permission-aware-rag-prod-Security-KmsKeyArn-Optional'),
        opensearchEndpoint: this.config.opensearchEndpoint
      };

      // 高度権限制御スタックの作成
      const advancedPermissionStack = new AdvancedPermissionStack(
        this.app,
        this.namingGenerator.generateStackName(StackComponent.ADVANCED_PERMISSION),
        {
          env: {
            account: this.config.account,
            region: this.config.region,
          },
          config: deploymentConfig,
          environment: this.config.environment,
          opensearchEndpoint: existingStackOutputs.opensearchEndpoint,
          kmsKeyArn: existingStackOutputs.kmsKeyArn,
          vpcId: existingStackOutputs.vpcId,
          namingGenerator: this.namingGenerator
        }
      );

      console.log('✅ 高度権限制御スタック設定完了');
    } catch (error) {
      console.error('❌ スタック作成エラー:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * タグの設定
   */
  private applyTags(): void {
    cdk.Tags.of(this.app).add('Project', this.config.projectName);
    cdk.Tags.of(this.app).add('Environment', this.config.environment);
    cdk.Tags.of(this.app).add('Region', this.config.region);
    cdk.Tags.of(this.app).add('DeploymentType', 'Production');
    cdk.Tags.of(this.app).add('IntegrationType', 'ExistingStack');
    cdk.Tags.of(this.app).add('ManagedBy', 'CDK');
    cdk.Tags.of(this.app).add('Architecture', 'Modular');
    cdk.Tags.of(this.app).add('SecurityLevel', 'Enterprise');
  }

  /**
   * アプリケーションの実行
   */
  public deploy(): void {
    try {
      this.createAdvancedPermissionStack();
      this.applyTags();

      console.log('✅ 本番環境デプロイメント設定完了');
      console.log('📦 デプロイ対象スタック:', this.namingGenerator.generateStackName(StackComponent.ADVANCED_PERMISSION));

      this.app.synth();
      console.log('🎉 CDKテンプレート生成完了');
    } catch (error) {
      console.error('❌ CDKテンプレート生成エラー:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}

// アプリケーションの実行
const deploymentApp = new ProductionDeploymentApp();
deploymentApp.deploy();