/**
 * Embedding設定ファクトリー
 * 
 * Agent Steeringルール準拠:
 * - 設定外部化とフラグ制御システム
 * - CDKコンテキストによる設定制御機能
 * - 各モジュールの独立した有効化/無効化フラグ機能
 * 
 * Requirements: 4.4, 4.5
 */

import * as cdk from 'aws-cdk-lib';
import {
  EmbeddingConfig,
  EmbeddingBatchConfig,
  EmbeddingEcsConfig,
  EmbeddingSpotFleetConfig,
  EmbeddingCommonResourcesConfig,
  EmbeddingMonitoringConfig,
  EmbeddingJobDefinitionConfig,
  EmbeddingFsxIntegrationConfig,
  EmbeddingActiveDirectoryConfig,
  EmbeddingBedrockConfig,
  EmbeddingOpenSearchIntegrationConfig,
  EmbeddingRdsConfig
} from '../../modules/ai/interfaces/embedding-config';

/**
 * Embedding設定ファクトリー
 */
export class EmbeddingConfigFactory {
  /**
   * CDKコンテキストから設定を生成
   */
  static createFromContext(app: cdk.App, environment: string): EmbeddingConfig {
    const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
    const region = app.node.tryGetContext('region') || 'ap-northeast-1';

    const flags = EmbeddingConfigFactory.getFeatureFlags(app);
    const envConfig = EmbeddingConfigFactory.getEnvironmentConfig(app, environment);

    return {
      projectName,
      environment,
      awsBatch: EmbeddingConfigFactory.createBatchConfig(app, flags, envConfig),
      ecsOnEC2: EmbeddingConfigFactory.createEcsConfig(app, flags, envConfig),
      spotFleet: EmbeddingConfigFactory.createSpotFleetConfig(app, flags, envConfig),
      commonResources: EmbeddingConfigFactory.createCommonResourcesConfig(app, envConfig),
      monitoring: EmbeddingConfigFactory.createMonitoringConfig(app, envConfig),
      jobDefinition: EmbeddingConfigFactory.createJobDefinitionConfig(app, envConfig),
      fsxIntegration: EmbeddingConfigFactory.createFsxIntegrationConfig(app),
      activeDirectory: EmbeddingConfigFactory.createActiveDirectoryConfig(app),
      bedrock: EmbeddingConfigFactory.createBedrockConfig(app),
      openSearch: EmbeddingConfigFactory.createOpenSearchIntegrationConfig(app),
      rds: EmbeddingConfigFactory.createRdsConfig(app),
    };
  }

  /**
   * 機能フラグを取得
   */
  private static getFeatureFlags(app: cdk.App): EmbeddingFeatureFlags {
    return {
      enableAwsBatch: app.node.tryGetContext('embedding:enableAwsBatch') ?? true,
      enableEcsOnEC2: app.node.tryGetContext('embedding:enableEcsOnEC2') ?? false,
      enableSpotFleet: app.node.tryGetContext('embedding:enableSpotFleet') ?? false,
      enableMonitoring: app.node.tryGetContext('embedding:enableMonitoring') ?? true,
      enableAutoScaling: app.node.tryGetContext('embedding:enableAutoScaling') ?? true,
    };
  }

  /**
   * 環境別設定を取得
   */
  private static getEnvironmentConfig(app: cdk.App, environment: string): EmbeddingEnvironmentConfig {
    const baseConfig = {
      instanceTypes: app.node.tryGetContext('embedding:instanceTypes') || ['m5.large', 'm5.xlarge'],
      maxvCpus: app.node.tryGetContext('embedding:maxvCpus') || 1000,
      minvCpus: app.node.tryGetContext('embedding:minvCpus') || 0,
      multiAz: app.node.tryGetContext('embedding:multiAz') ?? true,
    };

    switch (environment) {
      case 'prod':
      case 'production':
        return {
          ...baseConfig,
          maxvCpus: app.node.tryGetContext('embedding:prod:maxvCpus') || 2000,
          multiAz: true,
        };

      case 'dev':
      case 'development':
        return {
          ...baseConfig,
          maxvCpus: app.node.tryGetContext('embedding:dev:maxvCpus') || 500,
          instanceTypes: ['m5.large'],
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Job Definition設定を作成
   */
  private static createJobDefinitionConfig(
    app: cdk.App,
    envConfig: EmbeddingEnvironmentConfig
  ): EmbeddingJobDefinitionConfig {
    return {
      jobDefinitionName: app.node.tryGetContext('embedding:jobDefinition:name') || 'embedding-job-definition',
      cpu: app.node.tryGetContext('embedding:jobDefinition:cpu') || 2,
      memoryMiB: app.node.tryGetContext('embedding:jobDefinition:memoryMiB') || 4096,
      timeoutHours: app.node.tryGetContext('embedding:jobDefinition:timeoutHours') || 1,
      retryAttempts: app.node.tryGetContext('embedding:jobDefinition:retryAttempts') || 3,
      platformCapabilities: app.node.tryGetContext('embedding:jobDefinition:platformCapabilities') || ['EC2'],
    };
  }

  /**
   * FSx統合設定を作成
   */
  private static createFsxIntegrationConfig(app: cdk.App): EmbeddingFsxIntegrationConfig {
    return {
      fileSystemId: app.node.tryGetContext('embedding:fsx:fileSystemId') || process.env.FSX_ID,
      svmRef: app.node.tryGetContext('embedding:fsx:svmRef') || process.env.SVM_REF,
      svmId: app.node.tryGetContext('embedding:fsx:svmId') || process.env.SVM_ID,
      cifsdataVolName: app.node.tryGetContext('embedding:fsx:cifsdataVolName') || process.env.CIFSDATA_VOL_NAME || 'smb_share',
      ragdbVolPath: app.node.tryGetContext('embedding:fsx:ragdbVolPath') || process.env.RAGDB_VOL_PATH || '/smb_share/ragdb',
    };
  }

  /**
   * Active Directory設定を作成
   */
  private static createActiveDirectoryConfig(app: cdk.App): EmbeddingActiveDirectoryConfig {
    return {
      domain: app.node.tryGetContext('embedding:ad:domain') || 'example.com',
      username: app.node.tryGetContext('embedding:ad:username') || 'admin',
      passwordSecretArn: app.node.tryGetContext('embedding:ad:passwordSecretArn') || '',
    };
  }

  /**
   * Bedrock設定を作成
   */
  private static createBedrockConfig(app: cdk.App): EmbeddingBedrockConfig {
    return {
      region: app.node.tryGetContext('embedding:bedrock:region') || app.node.tryGetContext('region') || 'us-east-1',
      modelId: app.node.tryGetContext('embedding:bedrock:modelId') || 'amazon.titan-embed-text-v1',
    };
  }

  /**
   * OpenSearch統合設定を作成
   */
  private static createOpenSearchIntegrationConfig(app: cdk.App): EmbeddingOpenSearchIntegrationConfig {
    return {
      collectionName: app.node.tryGetContext('embedding:openSearch:collectionName'),
      indexName: app.node.tryGetContext('embedding:openSearch:indexName') || 'documents',
    };
  }

  /**
   * RDS設定を作成
   */
  private static createRdsConfig(app: cdk.App): EmbeddingRdsConfig | undefined {
    const secretName = app.node.tryGetContext('embedding:rds:secretName');
    if (!secretName) {
      return undefined;
    }

    return {
      secretName,
      secretArn: app.node.tryGetContext('embedding:rds:secretArn') || '',
      clusterArn: app.node.tryGetContext('embedding:rds:clusterArn') || '',
    };
  }

  // 他のメソッドは簡略化のため省略
  private static createBatchConfig(app: cdk.App, flags: any, envConfig: any): EmbeddingBatchConfig {
    return {} as EmbeddingBatchConfig;
  }

  private static createEcsConfig(app: cdk.App, flags: any, envConfig: any): EmbeddingEcsConfig {
    return {} as EmbeddingEcsConfig;
  }

  private static createSpotFleetConfig(app: cdk.App, flags: any, envConfig: any): EmbeddingSpotFleetConfig {
    return {} as EmbeddingSpotFleetConfig;
  }

  private static createCommonResourcesConfig(app: cdk.App, envConfig: any): EmbeddingCommonResourcesConfig {
    return {} as EmbeddingCommonResourcesConfig;
  }

  private static createMonitoringConfig(app: cdk.App, envConfig: any): EmbeddingMonitoringConfig {
    return {} as EmbeddingMonitoringConfig;
  }
}

/**
 * Embedding機能フラグ
 */
export interface EmbeddingFeatureFlags {
  readonly enableAwsBatch: boolean;
  readonly enableEcsOnEC2: boolean;
  readonly enableSpotFleet: boolean;
  readonly enableMonitoring: boolean;
  readonly enableAutoScaling: boolean;
}

/**
 * Embedding環境設定
 */
export interface EmbeddingEnvironmentConfig {
  readonly instanceTypes: string[];
  readonly maxvCpus: number;
  readonly minvCpus: number;
  readonly multiAz: boolean;
}