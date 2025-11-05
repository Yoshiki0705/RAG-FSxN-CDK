import { StackProps } from 'aws-cdk-lib';

export interface NetworkConfig {
  vpcCidr?: string;
  subnetCidrMask?: number;
  availabilityZones?: string[];
  existingVpc?: boolean;
  vpcId?: string;
  cidr?: string;
  maxAzs?: number;
  publicSubnet?: any;
  natSubnet?: any;
  isolatedSubnet?: any;
  cidrMask?: number;
}

export interface AdConfig {
  domainName?: string;
  adminPassword?: string;
  adAdminPassword?: string;
  adDomainName?: string;
  existingAd?: boolean;
  adDnsIps?: string[];
  serviceAccountUserName?: string;
  serviceAccountPassword?: string;
  svmNetBiosName?: string;
  adOu?: string;
  fileSystemAdministratorsGroup?: string;
}

export interface FsxConfig {
  storageCapacity?: number;
  throughputCapacity?: number;
  deploymentType?: string;
  fsxAdminPassword?: string;
  adConfig?: AdConfig;
}

export interface ChatAppConfig {
  enabled?: boolean;
  containerPort?: number;
  cpu?: number;
  memory?: number;
  subnets?: any[];
  lambdaVpcId?: string;
  lambdaVpcSubnets?: any[];
  imagePath?: string;
  tag?: string;
  albFargateServiceProps?: any;
}

export interface DatabaseConfig {
  engine?: string;
  instanceClass?: string;
  allocatedStorage?: number;
  userAccessTable?: string;
  partitionKey?: any;
}

export interface VectorConfig {
  indexName?: string;
  dimension?: number;
}

// Stack Props interfaces
export interface CopmuteStackProps extends StackProps {
  projectName?: string;
  environment?: string;
}

export interface WebAppStackProps extends StackProps {
  projectName?: string;
  environment?: string;
}

export interface NetworkOnlyProps extends StackProps {
  projectName?: string;
  environment?: string;
}

export interface EmbeddingServerProps extends StackProps {
  projectName?: string;
  environment?: string;
  vpc?: any;
  config?: any;
  vectorDB?: any;
  database?: any;
}

export interface LambdaWebAdapterProps extends StackProps {
  projectName?: string;
  environment?: string;
  vpc?: any;
  wafAttrArn?: string;
  edgeFnVersion?: any;
  imagePath?: string;
  tag?: string;
}

export interface VectorDBProps extends StackProps {
  projectName?: string;
  environment?: string;
  vector?: any;
  collectionName?: string;
  config?: any;
}

export interface AdProps extends StackProps {
  adConfig?: AdConfig;
  subnetIds?: string[];
}

export interface FSxNProps extends StackProps {
  subnetIds?: string[];
  deploymentType?: string;
  fsxAdminPassword?: string;
  storageCapacity?: number;
  throughputCapacity?: number;
  adConfig?: AdConfig;
}

export interface ApiProps extends StackProps {
  imagePath?: string;
  tag?: string;
}

export interface ChatAppProps extends StackProps {
  imagePath?: string;
  tag?: string;
  albFargateServiceProps?: any;
}

// === Embedding Server Architecture Upgrade - 拡張設定インターフェース ===
/**
 * FSx for NetApp ONTAP Embedding Server Architecture Upgrade
 * 複数アーキテクチャパターン対応の設定インターフェース定義
 */

/**
 * アーキテクチャパターンの種類
 */
export type EmbeddingArchitecturePattern = 
  | 'ec2-ondemand'    // 現在構成（EC2オンデマンド24/7稼働）
  | 'ec2-spot'        // EC2 Spot + EventBridge（90%コスト削減）
  | 'aws-batch'       // AWS Batch + EventBridge（フルマネージド）
  | 'ecs-ec2';        // ECS on EC2 + EventBridge（ECS統合管理）

/**
 * FSx ONTAP マウント設定
 */
export interface FSxMountConfig {
  /** ファイルシステムID */
  fileSystemId: string;
  /** SVM ID */
  svmId: string;
  /** ボリューム設定 */
  volumes: {
    /** ドキュメントボリューム（SMB/CIFS） */
    documents: {
      path: string;
      protocol: 'SMB' | 'NFS';
      mountPoint: string;
    };
    /** 埋め込みボリューム（NFS） */
    embeddings: {
      path: string;
      protocol: 'NFS';
      mountPoint: string;
    };
    /** インデックスボリューム（NFS） */
    index: {
      path: string;
      protocol: 'NFS';
      mountPoint: string;
    };
  };
}

/**
 * EC2 Spot インスタンス設定
 */
export interface SpotInstanceConfig {
  /** 最大価格（USD/時間） */
  maxPrice?: string;
  /** インスタンスタイプのリスト */
  instanceTypes: string[];
  /** 複数AZ配置 */
  availabilityZones: string[];
  /** 中断時の自動再試行回数 */
  maxRetries?: number;
  /** 処理完了後の自動終了 */
  autoTerminate?: boolean;
}

/**
 * AWS Batch 設定
 */
export interface BatchConfig {
  /** 最大vCPU数 */
  maxvCpus: number;
  /** 最小vCPU数 */
  minvCpus?: number;
  /** 希望vCPU数 */
  desiredvCpus?: number;
  /** リトライ回数 */
  retryAttempts: number;
  /** ジョブタイムアウト（秒） */
  jobTimeoutSeconds?: number;
  /** コンピュート環境タイプ */
  computeEnvironmentType?: 'MANAGED' | 'UNMANAGED';
  /** インスタンスタイプ */
  instanceTypes?: string[];
  /** Spot価格使用フラグ */
  useSpotInstances?: boolean;
}

/**
 * ECS on EC2 設定
 */
export interface EcsConfig {
  /** 希望タスク数 */
  desiredCount: number;
  /** CPU単位（1024 = 1 vCPU） */
  cpu: number;
  /** メモリ（MB） */
  memory: number;
  /** 最大タスク数 */
  maxCapacity?: number;
  /** 最小タスク数 */
  minCapacity?: number;
  /** Auto Scaling設定 */
  autoScaling?: {
    targetCpuUtilization: number;
    targetMemoryUtilization: number;
    scaleOutCooldown?: number;
    scaleInCooldown?: number;
  };
  /** プラットフォームバージョン */
  platformVersion?: string;
}

/**
 * 処理制限設定
 */
export interface ProcessingLimits {
  /** 最大ファイル数 */
  maxFiles: number;
  /** 最大フォルダー数 */
  maxFolders: number;
  /** 最大データサイズ（GB） */
  maxDataSizeGB: number;
  /** バッチサイズ（ファイル/バッチ） */
  batchSize: number;
  /** 並列処理数 */
  maxParallelJobs: number;
  /** メモリ使用量制限（MB） */
  memoryLimitMB?: number;
  /** ディスク容量制限（GB） */
  diskLimitGB?: number;
}

/**
 * SQLite UPSERT Manager 統合設定
 */
export interface SqliteUpsertConfig {
  /** リトライ設定 */
  retryConfig: {
    maxRetries: number;
    backoffMs: number;
    exponentialBackoff?: boolean;
  };
  /** トランザクション設定 */
  transactionConfig: {
    batchSize: number;
    timeoutMs: number;
  };
  /** 監視設定 */
  monitoringConfig: {
    enableMetrics: boolean;
    enableDetailedLogs: boolean;
    metricsNamespace?: string;
  };
}

/**
 * 監視・アラート設定
 */
export interface MonitoringConfig {
  /** CloudWatch設定 */
  cloudWatch: {
    namespace: string;
    metrics: string[];
    retentionDays?: number;
  };
  /** アラート設定 */
  alerts: {
    jobFailureThreshold: number;
    executionTimeThresholdMinutes: number;
    errorRateThreshold: number;
    snsTopicArn?: string;
  };
  /** ダッシュボード設定 */
  dashboard?: {
    enabled: boolean;
    name?: string;
    widgets?: string[];
  };
}

/**
 * コスト分析設定
 */
export interface CostAnalysisConfig {
  /** コスト追跡有効化 */
  enabled: boolean;
  /** レポート生成頻度 */
  reportFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  /** コスト比較ベースライン */
  baselineCostPattern?: EmbeddingArchitecturePattern;
  /** 予算アラート設定 */
  budgetAlerts?: {
    monthlyBudgetUSD: number;
    alertThresholds: number[]; // パーセンテージ
  };
}

/**
 * 段階的移行設定
 */
export interface MigrationConfig {
  /** 並行稼働期間（日） */
  parallelRunDays: number;
  /** カナリアデプロイメント設定 */
  canaryDeployment: {
    enabled: boolean;
    trafficSplitPercentages: number[]; // 例: [5, 15, 50, 100]
    evaluationPeriodMinutes: number;
    autoRollbackEnabled: boolean;
  };
  /** 検証設定 */
  validation: {
    enableResultComparison: boolean;
    samplePercentage: number;
    toleranceThreshold: number;
  };
}

/**
 * 拡張されたEmbedding設定インターフェース
 * 複数アーキテクチャパターンに対応
 */
export interface ExtendedEmbeddingConfig {
  /** アーキテクチャパターン選択 */
  pattern: EmbeddingArchitecturePattern;
  
  /** 共通設定 */
  schedule: string; // cron式（例: "0 2 * * *"）
  dockerImage: string;
  
  /** FSx ONTAP統合設定 */
  fsxMountConfig: FSxMountConfig;
  
  /** 処理制限設定 */
  processingLimits: ProcessingLimits;
  
  /** SQLite UPSERT Manager統合設定 */
  sqliteConfig: SqliteUpsertConfig;
  
  /** 監視・アラート設定 */
  monitoringConfig: MonitoringConfig;
  
  /** コスト分析設定 */
  costAnalysisConfig?: CostAnalysisConfig;
  
  /** 段階的移行設定 */
  migrationConfig?: MigrationConfig;
  
  /** パターン固有設定 */
  spotConfig?: SpotInstanceConfig;
  batchConfig?: BatchConfig;
  ecsConfig?: EcsConfig;
  
  /** 既存設定との互換性 */
  cifsdataVolName?: string;
  ragdbVolPath?: string;
  batchSize?: number;
  concurrency?: number;
  model?: string;
}

/**
 * 設定検証ユーティリティクラス
 */
export class EmbeddingConfigValidator {
  /**
   * 拡張Embedding設定の妥当性を検証
   * @param config 検証対象の設定
   * @returns エラーメッセージの配列（空の場合は妥当）
   */
  static validateExtendedEmbeddingConfig(config: ExtendedEmbeddingConfig): string[] {
    const errors: string[] = [];
    
    // 基本設定の検証
    if (!config.pattern) {
      errors.push('アーキテクチャパターンの指定が必要です');
    }
    
    if (!config.schedule) {
      errors.push('スケジュール（cron式）の指定が必要です');
    } else if (!this.isValidCronExpression(config.schedule)) {
      errors.push('無効なcron式です: ' + config.schedule);
    }
    
    if (!config.dockerImage) {
      errors.push('Dockerイメージの指定が必要です');
    }
    
    // FSx設定の検証
    if (!config.fsxMountConfig) {
      errors.push('FSx ONTAP マウント設定が必要です');
    } else {
      errors.push(...this.validateFsxMountConfig(config.fsxMountConfig));
    }
    
    // 処理制限の検証
    if (!config.processingLimits) {
      errors.push('処理制限設定が必要です');
    } else {
      errors.push(...this.validateProcessingLimits(config.processingLimits));
    }
    
    // パターン固有設定の検証
    switch (config.pattern) {
      case 'ec2-spot':
        if (!config.spotConfig) {
          errors.push('EC2 SpotパターンにはspotConfigが必要です');
        } else {
          errors.push(...this.validateSpotConfig(config.spotConfig));
        }
        break;
      case 'aws-batch':
        if (!config.batchConfig) {
          errors.push('AWS BatchパターンにはbatchConfigが必要です');
        } else {
          errors.push(...this.validateBatchConfig(config.batchConfig));
        }
        break;
      case 'ecs-ec2':
        if (!config.ecsConfig) {
          errors.push('ECS on EC2パターンにはecsConfigが必要です');
        } else {
          errors.push(...this.validateEcsConfig(config.ecsConfig));
        }
        break;
    }
    
    return errors;
  }
  
  /**
   * cron式の妥当性を検証
   */
  private static isValidCronExpression(cron: string): boolean {
    // 基本的なcron式の検証（5フィールド形式）
    const cronRegex = /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([012]?\d|3[01])) (\*|([0]?\d|1[0-2])) (\*|([0-6]))$/;
    return cronRegex.test(cron);
  }
  
  /**
   * FSxマウント設定の検証
   */
  private static validateFsxMountConfig(config: FSxMountConfig): string[] {
    const errors: string[] = [];
    
    if (!config.fileSystemId) {
      errors.push('FSx ファイルシステムIDが必要です');
    }
    
    if (!config.svmId) {
      errors.push('SVM IDが必要です');
    }
    
    if (!config.volumes) {
      errors.push('ボリューム設定が必要です');
    } else {
      if (!config.volumes.documents) {
        errors.push('ドキュメントボリューム設定が必要です');
      }
      if (!config.volumes.embeddings) {
        errors.push('埋め込みボリューム設定が必要です');
      }
      if (!config.volumes.index) {
        errors.push('インデックスボリューム設定が必要です');
      }
    }
    
    return errors;
  }
  
  /**
   * 処理制限設定の検証
   */
  private static validateProcessingLimits(config: ProcessingLimits): string[] {
    const errors: string[] = [];
    
    if (config.maxFiles <= 0) {
      errors.push('最大ファイル数は1以上である必要があります');
    }
    
    if (config.maxFolders <= 0) {
      errors.push('最大フォルダー数は1以上である必要があります');
    }
    
    if (config.maxDataSizeGB <= 0) {
      errors.push('最大データサイズは1GB以上である必要があります');
    }
    
    if (config.batchSize <= 0) {
      errors.push('バッチサイズは1以上である必要があります');
    }
    
    if (config.maxParallelJobs <= 0) {
      errors.push('並列処理数は1以上である必要があります');
    }
    
    return errors;
  }
  
  /**
   * Spot設定の検証
   */
  private static validateSpotConfig(config: SpotInstanceConfig): string[] {
    const errors: string[] = [];
    
    if (!config.instanceTypes || config.instanceTypes.length === 0) {
      errors.push('インスタンスタイプの指定が必要です');
    }
    
    if (!config.availabilityZones || config.availabilityZones.length === 0) {
      errors.push('アベイラビリティゾーンの指定が必要です');
    }
    
    if (config.maxPrice && parseFloat(config.maxPrice) <= 0) {
      errors.push('最大価格は0より大きい値である必要があります');
    }
    
    return errors;
  }
  
  /**
   * Batch設定の検証
   */
  private static validateBatchConfig(config: BatchConfig): string[] {
    const errors: string[] = [];
    
    if (config.maxvCpus <= 0) {
      errors.push('最大vCPU数は1以上である必要があります');
    }
    
    if (config.minvCpus && config.minvCpus < 0) {
      errors.push('最小vCPU数は0以上である必要があります');
    }
    
    if (config.retryAttempts < 0) {
      errors.push('リトライ回数は0以上である必要があります');
    }
    
    return errors;
  }
  
  /**
   * ECS設定の検証
   */
  private static validateEcsConfig(config: EcsConfig): string[] {
    const errors: string[] = [];
    
    if (config.desiredCount <= 0) {
      errors.push('希望タスク数は1以上である必要があります');
    }
    
    if (config.cpu <= 0) {
      errors.push('CPU設定は1以上である必要があります');
    }
    
    if (config.memory <= 0) {
      errors.push('メモリ設定は1以上である必要があります');
    }
    
    return errors;
  }
}

/**
 * デフォルト設定値
 */
export const DEFAULT_EXTENDED_EMBEDDING_CONFIG: Partial<ExtendedEmbeddingConfig> = {
  pattern: 'ec2-ondemand',
  schedule: '0 2 * * *', // 毎日午前2時
  processingLimits: {
    maxFiles: 10000,
    maxFolders: 1000,
    maxDataSizeGB: 100,
    batchSize: 1000,
    maxParallelJobs: 10,
    memoryLimitMB: 8192,
    diskLimitGB: 50
  },
  sqliteConfig: {
    retryConfig: {
      maxRetries: 3,
      backoffMs: 1000,
      exponentialBackoff: true
    },
    transactionConfig: {
      batchSize: 100,
      timeoutMs: 30000
    },
    monitoringConfig: {
      enableMetrics: true,
      enableDetailedLogs: true,
      metricsNamespace: 'FSxONTAP/EmbeddingServer'
    }
  },
  monitoringConfig: {
    cloudWatch: {
      namespace: 'FSxONTAP/EmbeddingServer',
      metrics: ['JobDuration', 'FilesProcessed', 'ErrorRate', 'CostPerJob'],
      retentionDays: 30
    },
    alerts: {
      jobFailureThreshold: 3,
      executionTimeThresholdMinutes: 120,
      errorRateThreshold: 0.05
    },
    dashboard: {
      enabled: true,
      name: 'EmbeddingServerDashboard'
    }
  },
  costAnalysisConfig: {
    enabled: true,
    reportFrequency: 'MONTHLY',
    baselineCostPattern: 'ec2-ondemand'
  }
};

/**
 * 型ガード関数群
 */
export function isExtendedEmbeddingConfig(obj: any): obj is ExtendedEmbeddingConfig {
  return obj && 
         typeof obj.pattern === 'string' && 
         typeof obj.schedule === 'string' &&
         typeof obj.dockerImage === 'string';
}

export function hasSpotConfig(config: ExtendedEmbeddingConfig): config is ExtendedEmbeddingConfig & { spotConfig: SpotInstanceConfig } {
  return config.pattern === 'ec2-spot' && config.spotConfig !== undefined;
}

export function hasBatchConfig(config: ExtendedEmbeddingConfig): config is ExtendedEmbeddingConfig & { batchConfig: BatchConfig } {
  return config.pattern === 'aws-batch' && config.batchConfig !== undefined;
}

export function hasEcsConfig(config: ExtendedEmbeddingConfig): config is ExtendedEmbeddingConfig & { ecsConfig: EcsConfig } {
  return config.pattern === 'ecs-ec2' && config.ecsConfig !== undefined;
}

// === 環境変数パーサーとコンフィグマネージャー ===
/**
 * FSx for NetApp ONTAP Embedding Server Architecture Upgrade
 * 環境変数パーサーとコンフィグマネージャー実装
 */

import { App, Stack } from 'aws-cdk-lib';
import { 
  ExtendedEmbeddingConfig, 
  EmbeddingArchitecturePattern,
  SpotInstanceConfig,
  BatchConfig,
  EcsConfig,
  FSxMountConfig,
  ProcessingLimits,
  SqliteUpsertConfig,
  MonitoringConfig,
  CostAnalysisConfig,
  MigrationConfig,
  DEFAULT_EXTENDED_EMBEDDING_CONFIG,
  EmbeddingConfigValidator
} from './types/type';

/**
 * CDK Context変数のキー定数
 */
export const CDK_CONTEXT_KEYS = {
  // アーキテクチャパターン選択
  EMBEDDING_PATTERN: 'embeddingPattern',
  
  // 共通設定
  EMBEDDING_SCHEDULE: 'embeddingSchedule',
  EMBEDDING_DOCKER_IMAGE: 'embeddingDockerImage',
  
  // FSx ONTAP設定
  FSX_FILE_SYSTEM_ID: 'fsxFileSystemId',
  FSX_SVM_ID: 'fsxSvmId',
  FSX_DOCUMENTS_PATH: 'fsxDocumentsPath',
  FSX_EMBEDDINGS_PATH: 'fsxEmbeddingsPath',
  FSX_INDEX_PATH: 'fsxIndexPath',
  
  // 処理制限設定
  MAX_FILES: 'maxFiles',
  MAX_FOLDERS: 'maxFolders',
  MAX_DATA_SIZE_GB: 'maxDataSizeGB',
  BATCH_SIZE: 'batchSize',
  MAX_PARALLEL_JOBS: 'maxParallelJobs',
  
  // Spot設定
  SPOT_MAX_PRICE: 'spotMaxPrice',
  SPOT_INSTANCE_TYPES: 'spotInstanceTypes',
  SPOT_AVAILABILITY_ZONES: 'spotAvailabilityZones',
  SPOT_MAX_RETRIES: 'spotMaxRetries',
  
  // Batch設定
  BATCH_MAX_VCPUS: 'batchMaxvCpus',
  BATCH_MIN_VCPUS: 'batchMinvCpus',
  BATCH_RETRY_ATTEMPTS: 'batchRetryAttempts',
  BATCH_JOB_TIMEOUT: 'batchJobTimeout',
  BATCH_USE_SPOT: 'batchUseSpot',
  
  // ECS設定
  ECS_DESIRED_COUNT: 'ecsDesiredCount',
  ECS_CPU: 'ecsCpu',
  ECS_MEMORY: 'ecsMemory',
  ECS_MAX_CAPACITY: 'ecsMaxCapacity',
  ECS_MIN_CAPACITY: 'ecsMinCapacity',
  
  // 監視設定
  MONITORING_NAMESPACE: 'monitoringNamespace',
  MONITORING_RETENTION_DAYS: 'monitoringRetentionDays',
  ALERT_JOB_FAILURE_THRESHOLD: 'alertJobFailureThreshold',
  ALERT_EXECUTION_TIME_THRESHOLD: 'alertExecutionTimeThreshold',
  ALERT_ERROR_RATE_THRESHOLD: 'alertErrorRateThreshold',
  
  // コスト分析設定
  COST_ANALYSIS_ENABLED: 'costAnalysisEnabled',
  COST_REPORT_FREQUENCY: 'costReportFrequency',
  COST_BASELINE_PATTERN: 'costBaselinePattern',
  
  // 移行設定
  MIGRATION_PARALLEL_RUN_DAYS: 'migrationParallelRunDays',
  MIGRATION_CANARY_ENABLED: 'migrationCanaryEnabled',
  MIGRATION_TRAFFIC_SPLIT: 'migrationTrafficSplit',
  
  // 既存設定との互換性
  CIFSDATAVOL_NAME: 'cifsdataVolName',
  RAGDB_VOL_PATH: 'ragdbVolPath',
  EMBEDDING_MODEL: 'embeddingModel'
} as const;

/**
 * 環境変数パーサークラス
 * CDK context変数から設定を読み取り、検証を行う
 */
export class EmbeddingConfigParser {
  private app: App;
  private stack: Stack;

  constructor(app: App, stack: Stack) {
    this.app = app;
    this.stack = stack;
  }

  /**
   * CDK context変数から拡張Embedding設定を解析
   * @returns 解析された設定オブジェクト
   */
  parseEmbeddingConfig(): ExtendedEmbeddingConfig {
    console.log('🔧 Embedding設定を解析中...');

    // 基本設定の解析
    const pattern = this.getContextValue<EmbeddingArchitecturePattern>(
      CDK_CONTEXT_KEYS.EMBEDDING_PATTERN,
      'ec2-ondemand'
    );

    const schedule = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.EMBEDDING_SCHEDULE,
      '0 2 * * *'
    );

    const dockerImage = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.EMBEDDING_DOCKER_IMAGE,
      'public.ecr.aws/lambda/python:3.11'
    );

    // FSx ONTAP設定の解析
    const fsxMountConfig = this.parseFsxMountConfig();

    // 処理制限設定の解析
    const processingLimits = this.parseProcessingLimits();

    // SQLite UPSERT設定の解析
    const sqliteConfig = this.parseSqliteUpsertConfig();

    // 監視設定の解析
    const monitoringConfig = this.parseMonitoringConfig();

    // コスト分析設定の解析
    const costAnalysisConfig = this.parseCostAnalysisConfig();

    // 移行設定の解析
    const migrationConfig = this.parseMigrationConfig();

    // パターン固有設定の解析
    const spotConfig = pattern === 'ec2-spot' ? this.parseSpotConfig() : undefined;
    const batchConfig = pattern === 'aws-batch' ? this.parseBatchConfig() : undefined;
    const ecsConfig = pattern === 'ecs-ec2' ? this.parseEcsConfig() : undefined;

    // 既存設定との互換性
    const cifsdataVolName = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.CIFSDATAVOL_NAME,
      'cifsdata'
    );

    const ragdbVolPath = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.RAGDB_VOL_PATH,
      '/ragdb'
    );

    const model = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.EMBEDDING_MODEL,
      'amazon.titan-embed-text-v1'
    );

    // 設定オブジェクトの構築
    const config: ExtendedEmbeddingConfig = {
      pattern,
      schedule,
      dockerImage,
      fsxMountConfig,
      processingLimits,
      sqliteConfig,
      monitoringConfig,
      costAnalysisConfig,
      migrationConfig,
      spotConfig,
      batchConfig,
      ecsConfig,
      cifsdataVolName,
      ragdbVolPath,
      batchSize: processingLimits.batchSize,
      concurrency: processingLimits.maxParallelJobs,
      model
    };

    // 設定の検証
    this.validateConfig(config);

    console.log(`✅ Embedding設定解析完了: パターン=${pattern}`);
    return config;
  }

  /**
   * FSx ONTAP マウント設定の解析
   */
  private parseFsxMountConfig(): FSxMountConfig {
    const fileSystemId = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.FSX_FILE_SYSTEM_ID,
      ''
    );

    const svmId = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.FSX_SVM_ID,
      ''
    );

    const documentsPath = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.FSX_DOCUMENTS_PATH,
      '/documents'
    );

    const embeddingsPath = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.FSX_EMBEDDINGS_PATH,
      '/embeddings'
    );

    const indexPath = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.FSX_INDEX_PATH,
      '/index'
    );

    return {
      fileSystemId,
      svmId,
      volumes: {
        documents: {
          path: documentsPath,
          protocol: 'SMB',
          mountPoint: '/mnt/documents'
        },
        embeddings: {
          path: embeddingsPath,
          protocol: 'NFS',
          mountPoint: '/mnt/embeddings'
        },
        index: {
          path: indexPath,
          protocol: 'NFS',
          mountPoint: '/mnt/index'
        }
      }
    };
  }

  /**
   * 処理制限設定の解析
   */
  private parseProcessingLimits(): ProcessingLimits {
    return {
      maxFiles: this.getContextValue<number>(
        CDK_CONTEXT_KEYS.MAX_FILES,
        DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits!.maxFiles
      ),
      maxFolders: this.getContextValue<number>(
        CDK_CONTEXT_KEYS.MAX_FOLDERS,
        DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits!.maxFolders
      ),
      maxDataSizeGB: this.getContextValue<number>(
        CDK_CONTEXT_KEYS.MAX_DATA_SIZE_GB,
        DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits!.maxDataSizeGB
      ),
      batchSize: this.getContextValue<number>(
        CDK_CONTEXT_KEYS.BATCH_SIZE,
        DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits!.batchSize
      ),
      maxParallelJobs: this.getContextValue<number>(
        CDK_CONTEXT_KEYS.MAX_PARALLEL_JOBS,
        DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits!.maxParallelJobs
      ),
      memoryLimitMB: DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits!.memoryLimitMB,
      diskLimitGB: DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits!.diskLimitGB
    };
  }

  /**
   * SQLite UPSERT設定の解析
   */
  private parseSqliteUpsertConfig(): SqliteUpsertConfig {
    return DEFAULT_EXTENDED_EMBEDDING_CONFIG.sqliteConfig!;
  }

  /**
   * 監視設定の解析
   */
  private parseMonitoringConfig(): MonitoringConfig {
    const namespace = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.MONITORING_NAMESPACE,
      DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig!.cloudWatch.namespace
    );

    const retentionDays = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.MONITORING_RETENTION_DAYS,
      DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig!.cloudWatch.retentionDays!
    );

    const jobFailureThreshold = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.ALERT_JOB_FAILURE_THRESHOLD,
      DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig!.alerts.jobFailureThreshold
    );

    const executionTimeThreshold = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.ALERT_EXECUTION_TIME_THRESHOLD,
      DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig!.alerts.executionTimeThresholdMinutes
    );

    const errorRateThreshold = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.ALERT_ERROR_RATE_THRESHOLD,
      DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig!.alerts.errorRateThreshold
    );

    return {
      cloudWatch: {
        namespace,
        metrics: DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig!.cloudWatch.metrics,
        retentionDays
      },
      alerts: {
        jobFailureThreshold,
        executionTimeThresholdMinutes: executionTimeThreshold,
        errorRateThreshold
      },
      dashboard: DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig!.dashboard
    };
  }

  /**
   * コスト分析設定の解析
   */
  private parseCostAnalysisConfig(): CostAnalysisConfig | undefined {
    const enabled = this.getContextValue<boolean>(
      CDK_CONTEXT_KEYS.COST_ANALYSIS_ENABLED,
      DEFAULT_EXTENDED_EMBEDDING_CONFIG.costAnalysisConfig!.enabled
    );

    if (!enabled) {
      return undefined;
    }

    const reportFrequency = this.getContextValue<'DAILY' | 'WEEKLY' | 'MONTHLY'>(
      CDK_CONTEXT_KEYS.COST_REPORT_FREQUENCY,
      DEFAULT_EXTENDED_EMBEDDING_CONFIG.costAnalysisConfig!.reportFrequency
    );

    const baselinePattern = this.getContextValue<EmbeddingArchitecturePattern>(
      CDK_CONTEXT_KEYS.COST_BASELINE_PATTERN,
      DEFAULT_EXTENDED_EMBEDDING_CONFIG.costAnalysisConfig!.baselineCostPattern!
    );

    return {
      enabled,
      reportFrequency,
      baselineCostPattern: baselinePattern
    };
  }

  /**
   * 移行設定の解析
   */
  private parseMigrationConfig(): MigrationConfig | undefined {
    const parallelRunDays = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.MIGRATION_PARALLEL_RUN_DAYS,
      7
    );

    const canaryEnabled = this.getContextValue<boolean>(
      CDK_CONTEXT_KEYS.MIGRATION_CANARY_ENABLED,
      false
    );

    const trafficSplitStr = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.MIGRATION_TRAFFIC_SPLIT,
      '5,15,50,100'
    );

    const trafficSplitPercentages = trafficSplitStr
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));

    return {
      parallelRunDays,
      canaryDeployment: {
        enabled: canaryEnabled,
        trafficSplitPercentages,
        evaluationPeriodMinutes: 30,
        autoRollbackEnabled: true
      },
      validation: {
        enableResultComparison: true,
        samplePercentage: 10,
        toleranceThreshold: 0.05
      }
    };
  }

  /**
   * Spot設定の解析
   */
  private parseSpotConfig(): SpotInstanceConfig {
    const maxPrice = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.SPOT_MAX_PRICE,
      '0.10'
    );

    const instanceTypesStr = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.SPOT_INSTANCE_TYPES,
      'm5.large,m5.xlarge,m4.large,m4.xlarge'
    );

    const instanceTypes = instanceTypesStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const availabilityZonesStr = this.getContextValue<string>(
      CDK_CONTEXT_KEYS.SPOT_AVAILABILITY_ZONES,
      'us-east-1a,us-east-1b,us-east-1c'
    );

    const availabilityZones = availabilityZonesStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const maxRetries = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.SPOT_MAX_RETRIES,
      3
    );

    return {
      maxPrice,
      instanceTypes,
      availabilityZones,
      maxRetries,
      autoTerminate: true
    };
  }

  /**
   * Batch設定の解析
   */
  private parseBatchConfig(): BatchConfig {
    const maxvCpus = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.BATCH_MAX_VCPUS,
      256
    );

    const minvCpus = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.BATCH_MIN_VCPUS,
      0
    );

    const retryAttempts = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.BATCH_RETRY_ATTEMPTS,
      3
    );

    const jobTimeoutSeconds = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.BATCH_JOB_TIMEOUT,
      7200
    );

    const useSpotInstances = this.getContextValue<boolean>(
      CDK_CONTEXT_KEYS.BATCH_USE_SPOT,
      true
    );

    return {
      maxvCpus,
      minvCpus,
      desiredvCpus: 0,
      retryAttempts,
      jobTimeoutSeconds,
      computeEnvironmentType: 'MANAGED',
      instanceTypes: ['optimal'],
      useSpotInstances
    };
  }

  /**
   * ECS設定の解析
   */
  private parseEcsConfig(): EcsConfig {
    const desiredCount = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.ECS_DESIRED_COUNT,
      1
    );

    const cpu = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.ECS_CPU,
      2048
    );

    const memory = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.ECS_MEMORY,
      4096
    );

    const maxCapacity = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.ECS_MAX_CAPACITY,
      10
    );

    const minCapacity = this.getContextValue<number>(
      CDK_CONTEXT_KEYS.ECS_MIN_CAPACITY,
      1
    );

    return {
      desiredCount,
      cpu,
      memory,
      maxCapacity,
      minCapacity,
      autoScaling: {
        targetCpuUtilization: 70,
        targetMemoryUtilization: 80,
        scaleOutCooldown: 300,
        scaleInCooldown: 300
      },
      platformVersion: 'LATEST'
    };
  }

  /**
   * CDK context変数から値を取得（型安全）
   */
  private getContextValue<T>(key: string, defaultValue: T): T {
    const value = this.stack.node.tryGetContext(key);
    
    if (value === undefined || value === null) {
      console.log(`📝 Context変数 '${key}' が未設定のため、デフォルト値を使用: ${defaultValue}`);
      return defaultValue;
    }

    // 型変換の試行
    try {
      if (typeof defaultValue === 'number') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) {
          console.warn(`⚠️  Context変数 '${key}' の値 '${value}' を数値に変換できません。デフォルト値を使用: ${defaultValue}`);
          return defaultValue;
        }
        return numValue as T;
      }

      if (typeof defaultValue === 'boolean') {
        if (typeof value === 'string') {
          const boolValue = value.toLowerCase() === 'true' || value === '1';
          return boolValue as T;
        }
        return Boolean(value) as T;
      }

      if (typeof defaultValue === 'string') {
        return String(value) as T;
      }

      return value as T;
    } catch (error) {
      console.warn(`⚠️  Context変数 '${key}' の型変換でエラーが発生しました: ${error}. デフォルト値を使用: ${defaultValue}`);
      return defaultValue;
    }
  }

  /**
   * 設定の検証
   */
  private validateConfig(config: ExtendedEmbeddingConfig): void {
    console.log('🔍 Embedding設定を検証中...');

    const errors = EmbeddingConfigValidator.validateExtendedEmbeddingConfig(config);

    if (errors.length > 0) {
      console.error('❌ Embedding設定の検証エラー:');
      errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });
      throw new Error(`Embedding設定の検証に失敗しました: ${errors.length}個のエラーが見つかりました`);
    }

    console.log('✅ Embedding設定の検証が完了しました');
  }

  /**
   * 設定の詳細情報を出力
   */
  printConfigSummary(config: ExtendedEmbeddingConfig): void {
    console.log('\n=== Embedding Server Architecture 設定サマリー ===');
    console.log(`🏗️  アーキテクチャパターン: ${config.pattern}`);
    console.log(`⏰ スケジュール: ${config.schedule}`);
    console.log(`🐳 Dockerイメージ: ${config.dockerImage}`);
    console.log(`📁 FSx ファイルシステムID: ${config.fsxMountConfig.fileSystemId}`);
    console.log(`📊 最大ファイル数: ${config.processingLimits.maxFiles.toLocaleString()}`);
    console.log(`🔄 バッチサイズ: ${config.processingLimits.batchSize.toLocaleString()}`);
    console.log(`⚡ 並列処理数: ${config.processingLimits.maxParallelJobs}`);

    if (config.spotConfig) {
      console.log(`💰 Spot最大価格: $${config.spotConfig.maxPrice}/時間`);
      console.log(`🖥️  Spotインスタンスタイプ: ${config.spotConfig.instanceTypes.join(', ')}`);
    }

    if (config.batchConfig) {
      console.log(`🔢 Batch最大vCPU: ${config.batchConfig.maxvCpus}`);
      console.log(`🔁 Batchリトライ回数: ${config.batchConfig.retryAttempts}`);
    }

    if (config.ecsConfig) {
      console.log(`📦 ECS希望タスク数: ${config.ecsConfig.desiredCount}`);
      console.log(`💾 ECS CPU/メモリ: ${config.ecsConfig.cpu}/${config.ecsConfig.memory}`);
    }

    console.log(`📈 監視ネームスペース: ${config.monitoringConfig.cloudWatch.namespace}`);
    
    if (config.costAnalysisConfig?.enabled) {
      console.log(`💹 コスト分析: 有効 (${config.costAnalysisConfig.reportFrequency})`);
    }

    console.log('================================================\n');
  }
}

/**
 * 設定ファクトリークラス
 * 環境に応じた設定の生成を行う
 */
export class EmbeddingConfigFactory {
  /**
   * 開発環境用の設定を生成
   */
  static createDevelopmentConfig(): Partial<ExtendedEmbeddingConfig> {
    return {
      pattern: 'ec2-ondemand',
      schedule: '0 3 * * *', // 毎日午前3時
      processingLimits: {
        maxFiles: 1000,
        maxFolders: 100,
        maxDataSizeGB: 10,
        batchSize: 100,
        maxParallelJobs: 2,
        memoryLimitMB: 2048,
        diskLimitGB: 20
      },
      monitoringConfig: {
        cloudWatch: {
          namespace: 'FSxONTAP/EmbeddingServer/Dev',
          metrics: ['JobDuration', 'FilesProcessed', 'ErrorRate'],
          retentionDays: 7
        },
        alerts: {
          jobFailureThreshold: 5,
          executionTimeThresholdMinutes: 60,
          errorRateThreshold: 0.1
        }
      }
    };
  }

  /**
   * 本番環境用の設定を生成
   */
  static createProductionConfig(): Partial<ExtendedEmbeddingConfig> {
    return {
      pattern: 'aws-batch',
      schedule: '0 2 * * *', // 毎日午前2時
      processingLimits: {
        maxFiles: 50000,
        maxFolders: 5000,
        maxDataSizeGB: 500,
        batchSize: 1000,
        maxParallelJobs: 20,
        memoryLimitMB: 16384,
        diskLimitGB: 200
      },
      batchConfig: {
        maxvCpus: 1000,
        minvCpus: 0,
        desiredvCpus: 0,
        retryAttempts: 3,
        jobTimeoutSeconds: 14400, // 4時間
        computeEnvironmentType: 'MANAGED',
        instanceTypes: ['optimal'],
        useSpotInstances: true
      },
      monitoringConfig: {
        cloudWatch: {
          namespace: 'FSxONTAP/EmbeddingServer/Prod',
          metrics: ['JobDuration', 'FilesProcessed', 'ErrorRate', 'CostPerJob', 'ThroughputMBps'],
          retentionDays: 90
        },
        alerts: {
          jobFailureThreshold: 2,
          executionTimeThresholdMinutes: 240,
          errorRateThreshold: 0.02
        },
        dashboard: {
          enabled: true,
          name: 'EmbeddingServerProductionDashboard'
        }
      },
      costAnalysisConfig: {
        enabled: true,
        reportFrequency: 'WEEKLY',
        baselineCostPattern: 'ec2-ondemand',
        budgetAlerts: {
          monthlyBudgetUSD: 1000,
          alertThresholds: [50, 80, 95]
        }
      }
    };
  }

  /**
   * テスト環境用の設定を生成
   */
  static createTestConfig(): Partial<ExtendedEmbeddingConfig> {
    return {
      pattern: 'ec2-spot',
      schedule: '0 4 * * *', // 毎日午前4時
      processingLimits: {
        maxFiles: 100,
        maxFolders: 10,
        maxDataSizeGB: 1,
        batchSize: 10,
        maxParallelJobs: 1,
        memoryLimitMB: 1024,
        diskLimitGB: 10
      },
      spotConfig: {
        maxPrice: '0.05',
        instanceTypes: ['t3.medium', 't3.large'],
        availabilityZones: ['us-east-1a', 'us-east-1b'],
        maxRetries: 2,
        autoTerminate: true
      },
      monitoringConfig: {
        cloudWatch: {
          namespace: 'FSxONTAP/EmbeddingServer/Test',
          metrics: ['JobDuration', 'FilesProcessed'],
          retentionDays: 3
        },
        alerts: {
          jobFailureThreshold: 10,
          executionTimeThresholdMinutes: 30,
          errorRateThreshold: 0.2
        }
      }
    };
  }
}

/**
 * 設定ユーティリティ関数群
 */
export class EmbeddingConfigUtils {
  /**
   * 設定をJSON形式で出力
   */
  static exportConfigAsJson(config: ExtendedEmbeddingConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * 設定をYAML形式で出力（簡易版）
   */
  static exportConfigAsYaml(config: ExtendedEmbeddingConfig): string {
    const yamlLines: string[] = [];
    
    yamlLines.push('# FSx ONTAP Embedding Server Configuration');
    yamlLines.push(`pattern: ${config.pattern}`);
    yamlLines.push(`schedule: "${config.schedule}"`);
    yamlLines.push(`dockerImage: ${config.dockerImage}`);
    yamlLines.push('');
    
    yamlLines.push('fsxMountConfig:');
    yamlLines.push(`  fileSystemId: ${config.fsxMountConfig.fileSystemId}`);
    yamlLines.push(`  svmId: ${config.fsxMountConfig.svmId}`);
    yamlLines.push('');
    
    yamlLines.push('processingLimits:');
    yamlLines.push(`  maxFiles: ${config.processingLimits.maxFiles}`);
    yamlLines.push(`  maxFolders: ${config.processingLimits.maxFolders}`);
    yamlLines.push(`  maxDataSizeGB: ${config.processingLimits.maxDataSizeGB}`);
    yamlLines.push(`  batchSize: ${config.processingLimits.batchSize}`);
    yamlLines.push(`  maxParallelJobs: ${config.processingLimits.maxParallelJobs}`);
    
    return yamlLines.join('\n');
  }

  /**
   * 設定の差分を比較
   */
  static compareConfigs(
    config1: ExtendedEmbeddingConfig, 
    config2: ExtendedEmbeddingConfig
  ): string[] {
    const differences: string[] = [];
    
    if (config1.pattern !== config2.pattern) {
      differences.push(`パターン: ${config1.pattern} → ${config2.pattern}`);
    }
    
    if (config1.schedule !== config2.schedule) {
      differences.push(`スケジュール: ${config1.schedule} → ${config2.schedule}`);
    }
    
    if (config1.processingLimits.maxFiles !== config2.processingLimits.maxFiles) {
      differences.push(`最大ファイル数: ${config1.processingLimits.maxFiles} → ${config2.processingLimits.maxFiles}`);
    }
    
    return differences;
  }

  /**
   * 設定のコスト見積もり（概算）
   */
  static estimateMonthlyCost(config: ExtendedEmbeddingConfig): number {
    let baseCost = 0;
    
    switch (config.pattern) {
      case 'ec2-ondemand':
        // 24/7稼働のEC2コスト（概算）
        baseCost = 100; // $100/月
        break;
      case 'ec2-spot':
        // Spot価格での実行（90%削減）
        baseCost = 10; // $10/月
        break;
      case 'aws-batch':
        // Batch実行コスト（使用時のみ）
        baseCost = 15; // $15/月
        break;
      case 'ecs-ec2':
        // ECS on EC2コスト
        baseCost = 20; // $20/月
        break;
    }
    
    // 処理量に応じた追加コスト
    const processingCost = Math.ceil(config.processingLimits.maxFiles / 10000) * 5;
    
    return baseCost + processingCost;
  }
}
