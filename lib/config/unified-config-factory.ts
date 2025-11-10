/**
 * 統一設定ファクトリー
 * タスク3.3: 統一設定システムの構築
 */

import * as cdk from 'aws-cdk-lib';
import { 
  UnifiedConfig, 
  Environment, 
  Region, 
  IConfigFactory, 
  IConfigProvider,
  ConfigValidationResult 
} from './interfaces/unified-config';
import { 
  productionConfig, 
  developmentConfig, 
  stagingConfig, 
  getConfigByEnvironment,
  getCurrentConfig 
} from './production';

/**
 * 統一設定ファクトリー実装
 */
export class UnifiedConfigFactory implements IConfigFactory {
  
  /**
   * 環境別設定を取得
   */
  getConfig(environment: Environment, region: Region): UnifiedConfig {
    const baseConfig = getConfigByEnvironment(environment);
    
    // リージョン固有の設定を適用
    return this.applyRegionSpecificConfig(baseConfig, region);
  }
  
  /**
   * 設定をバリデーション
   */
  validateConfig(config: UnifiedConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // プロジェクト設定のバリデーション
    if (!config.project.name) {
      errors.push('Project name is required');
    }
    
    if (!config.project.version) {
      warnings.push('Project version is not specified');
    }
    
    // 環境設定のバリデーション
    if (!['dev', 'staging', 'prod', 'test'].includes(config.environment.name)) {
      errors.push(`Invalid environment: ${config.environment.name}`);
    }
    
    // ネットワーク設定のバリデーション
    if (!this.isValidCidr(config.networking.vpcCidr)) {
      errors.push(`Invalid VPC CIDR: ${config.networking.vpcCidr}`);
    }
    
    if (config.networking.maxAzs < 1 || config.networking.maxAzs > 6) {
      errors.push(`Invalid maxAzs: ${config.networking.maxAzs}. Must be between 1 and 6`);
    }
    
    // セキュリティ設定のバリデーション
    if (config.environment.name === 'prod') {
      if (!config.security.kms.enabled) {
        warnings.push('KMS should be enabled in production environment');
      }
      
      if (!config.security.waf.enabled) {
        warnings.push('WAF should be enabled in production environment');
      }
      
      if (!config.security.cognito.mfaRequired) {
        warnings.push('MFA should be required in production environment');
      }
      
      if (!config.environment.deletionProtection) {
        warnings.push('Deletion protection should be enabled in production environment');
      }
    }
    
    // データ設定のバリデーション
    if (config.data.opensearch.enabled) {
      if (config.data.opensearch.instanceCount < 1) {
        errors.push('OpenSearch instance count must be at least 1');
      }
    }
    
    // コンピュート設定のバリデーション
    if (config.compute.lambda.timeout > 900) {
      errors.push('Lambda timeout cannot exceed 900 seconds');
    }
    
    if (config.compute.lambda.memorySize < 128 || config.compute.lambda.memorySize > 10240) {
      errors.push('Lambda memory size must be between 128 and 10240 MB');
    }
    
    // AWS設定のバリデーション
    if (!this.isValidRegion(config.aws.region)) {
      errors.push(`Invalid AWS region: ${config.aws.region}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * 設定をマージ
   */
  mergeConfigs(base: Partial<UnifiedConfig>, override: Partial<UnifiedConfig>): UnifiedConfig {
    return this.deepMerge(base, override) as UnifiedConfig;
  }
  
  /**
   * リージョン固有の設定を適用
   */
  private applyRegionSpecificConfig(config: UnifiedConfig, region: Region): UnifiedConfig {
    const regionConfig = { ...config };
    
    // AWS設定のリージョンを更新
    regionConfig.aws = {
      ...config.aws,
      region,
    };
    
    // CDK設定のリージョンを更新
    regionConfig.cdk = {
      ...config.cdk,
      stackProps: {
        ...config.cdk.stackProps,
        env: {
          ...config.cdk.stackProps.env,
          region,
        },
      },
    };
    
    // Bedrock設定のリージョンを更新
    regionConfig.compute = {
      ...config.compute,
      bedrock: {
        ...config.compute.bedrock,
        region,
        // リージョン別のモデル可用性を調整
        models: this.getAvailableModelsForRegion(region),
      },
    };
    
    return regionConfig;
  }
  
  /**
   * リージョン別の利用可能なBedrockモデルを取得
   */
  private getAvailableModelsForRegion(region: Region): string[] {
    const modelsByRegion: Record<Region, string[]> = {
      'ap-northeast-1': [ // 東京
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'amazon.titan-embed-text-v1',
        'amazon.titan-embed-text-v2:0',
      ],
      'ap-northeast-3': [ // 大阪
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'amazon.titan-embed-text-v1',
        'amazon.titan-embed-text-v2:0',
      ],
      'us-east-1': [ // バージニア
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'anthropic.claude-3-opus-20240229-v1:0',
        'amazon.titan-embed-text-v1',
        'amazon.titan-embed-text-v2:0',
        'cohere.embed-english-v3',
        'cohere.embed-multilingual-v3',
      ],
      'us-west-2': [ // オレゴン
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'amazon.titan-embed-text-v1',
        'amazon.titan-embed-text-v2:0',
      ],
      'eu-west-1': [ // アイルランド
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'amazon.titan-embed-text-v1',
      ],
    };
    
    return modelsByRegion[region] || [];
  }
  
  /**
   * CIDR形式の妥当性チェック
   */
  private isValidCidr(cidr: string): boolean {
    const cidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/;
    return cidrRegex.test(cidr);
  }
  
  /**
   * AWSリージョンの妥当性チェック
   */
  private isValidRegion(region: string): boolean {
    const validRegions: Region[] = [
      'ap-northeast-1',
      'ap-northeast-3',
      'us-east-1',
      'us-west-2',
      'eu-west-1',
    ];
    return validRegions.includes(region as Region);
  }
  
  /**
   * オブジェクトの深いマージ
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

/**
 * 統一設定プロバイダー実装
 */
export class UnifiedConfigProvider implements IConfigProvider {
  private configFactory: UnifiedConfigFactory;
  
  constructor() {
    this.configFactory = new UnifiedConfigFactory();
  }
  
  /**
   * 現在の設定を取得
   */
  getCurrentConfig(): UnifiedConfig {
    return getCurrentConfig();
  }
  
  /**
   * 環境変数から設定を読み込み
   */
  loadFromEnvironment(): Partial<UnifiedConfig> {
    const envConfig: Partial<UnifiedConfig> = {};
    
    // 環境変数から基本設定を読み込み
    if (process.env.PROJECT_NAME) {
      envConfig.project = {
        ...envConfig.project,
        name: process.env.PROJECT_NAME,
      } as any;
    }
    
    if (process.env.ENVIRONMENT) {
      envConfig.environment = {
        ...envConfig.environment,
        name: process.env.ENVIRONMENT as Environment,
      } as any;
    }
    
    if (process.env.AWS_REGION) {
      envConfig.aws = {
        ...envConfig.aws,
        region: process.env.AWS_REGION as Region,
      } as any;
    }
    
    if (process.env.CDK_DEFAULT_ACCOUNT) {
      envConfig.aws = {
        ...envConfig.aws,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      } as any;
    }
    
    // デバッグモードの設定
    if (process.env.DEBUG === 'true') {
      envConfig.environment = {
        ...envConfig.environment,
        debug: true,
        logLevel: 'DEBUG',
      } as any;
    }
    
    return envConfig;
  }
  
  /**
   * CDKコンテキストから設定を読み込み
   */
  loadFromContext(app: cdk.App): Partial<UnifiedConfig> {
    const contextConfig: Partial<UnifiedConfig> = {};
    
    // CDKコンテキストから設定を読み込み
    const projectName = app.node.tryGetContext('projectName');
    if (projectName) {
      contextConfig.project = {
        ...contextConfig.project,
        name: projectName,
      } as any;
    }
    
    const environment = app.node.tryGetContext('environment');
    if (environment) {
      contextConfig.environment = {
        ...contextConfig.environment,
        name: environment as Environment,
      } as any;
    }
    
    const region = app.node.tryGetContext('region');
    if (region) {
      contextConfig.aws = {
        ...contextConfig.aws,
        region: region as Region,
      } as any;
    }
    
    // VPC CIDR設定
    const vpcCidr = app.node.tryGetContext('vpcCidr');
    if (vpcCidr) {
      contextConfig.networking = {
        ...contextConfig.networking,
        vpcCidr,
      } as any;
    }
    
    return contextConfig;
  }
}

/**
 * 統一設定マネージャー
 */
export class UnifiedConfigManager {
  private factory: UnifiedConfigFactory;
  private provider: UnifiedConfigProvider;
  
  constructor() {
    this.factory = new UnifiedConfigFactory();
    this.provider = new UnifiedConfigProvider();
  }
  
  /**
   * 完全な設定を取得（環境変数とCDKコンテキストを統合）
   */
  getCompleteConfig(app?: cdk.App): UnifiedConfig {
    // ベース設定を取得
    let config = this.provider.getCurrentConfig();
    
    // 環境変数から設定を読み込み
    const envConfig = this.provider.loadFromEnvironment();
    config = this.factory.mergeConfigs(config, envConfig);
    
    // CDKコンテキストから設定を読み込み（appが提供された場合）
    if (app) {
      const contextConfig = this.provider.loadFromContext(app);
      config = this.factory.mergeConfigs(config, contextConfig);
    }
    
    // 設定をバリデーション
    const validation = this.factory.validateConfig(config);
    if (!validation.isValid) {
      console.error('❌ Configuration validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Invalid configuration');
    }
    
    // 警告があれば表示
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    return config;
  }
  
  /**
   * 環境とリージョンを指定して設定を取得
   */
  getConfigForEnvironmentAndRegion(environment: Environment, region: Region): UnifiedConfig {
    const config = this.factory.getConfig(environment, region);
    
    // バリデーション
    const validation = this.factory.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration for ${environment}/${region}: ${validation.errors.join(', ')}`);
    }
    
    return config;
  }
}

// シングルトンインスタンス
export const configManager = new UnifiedConfigManager();