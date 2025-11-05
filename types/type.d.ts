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
/**
 * FSx for NetApp ONTAP Embedding Server Architecture Upgrade
 * 複数アーキテクチャパターン対応の設定インターフェース定義
 */
/**
 * アーキテクチャパターンの種類
 */
export type EmbeddingArchitecturePattern = 'ec2-ondemand' | 'ec2-spot' | 'aws-batch' | 'ecs-ec2';
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
        alertThresholds: number[];
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
        trafficSplitPercentages: number[];
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
    schedule: string;
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
export declare class EmbeddingConfigValidator {
    /**
     * 拡張Embedding設定の妥当性を検証
     * @param config 検証対象の設定
     * @returns エラーメッセージの配列（空の場合は妥当）
     */
    static validateExtendedEmbeddingConfig(config: ExtendedEmbeddingConfig): string[];
    /**
     * cron式の妥当性を検証
     */
    private static isValidCronExpression;
    /**
     * FSxマウント設定の検証
     */
    private static validateFsxMountConfig;
    /**
     * 処理制限設定の検証
     */
    private static validateProcessingLimits;
    /**
     * Spot設定の検証
     */
    private static validateSpotConfig;
    /**
     * Batch設定の検証
     */
    private static validateBatchConfig;
    /**
     * ECS設定の検証
     */
    private static validateEcsConfig;
}
/**
 * デフォルト設定値
 */
export declare const DEFAULT_EXTENDED_EMBEDDING_CONFIG: Partial<ExtendedEmbeddingConfig>;
/**
 * 型ガード関数群
 */
export declare function isExtendedEmbeddingConfig(obj: any): obj is ExtendedEmbeddingConfig;
export declare function hasSpotConfig(config: ExtendedEmbeddingConfig): config is ExtendedEmbeddingConfig & {
    spotConfig: SpotInstanceConfig;
};
export declare function hasBatchConfig(config: ExtendedEmbeddingConfig): config is ExtendedEmbeddingConfig & {
    batchConfig: BatchConfig;
};
export declare function hasEcsConfig(config: ExtendedEmbeddingConfig): config is ExtendedEmbeddingConfig & {
    ecsConfig: EcsConfig;
};
/**
 * FSx for NetApp ONTAP Embedding Server Architecture Upgrade
 * 環境変数パーサーとコンフィグマネージャー実装
 */
import { App, Stack } from 'aws-cdk-lib';
import { ExtendedEmbeddingConfig, EmbeddingArchitecturePattern, SpotInstanceConfig, BatchConfig, EcsConfig, FSxMountConfig, ProcessingLimits, SqliteUpsertConfig, MonitoringConfig, CostAnalysisConfig, MigrationConfig } from './types/type';
/**
 * CDK Context変数のキー定数
 */
export declare const CDK_CONTEXT_KEYS: {
    readonly EMBEDDING_PATTERN: "embeddingPattern";
    readonly EMBEDDING_SCHEDULE: "embeddingSchedule";
    readonly EMBEDDING_DOCKER_IMAGE: "embeddingDockerImage";
    readonly FSX_FILE_SYSTEM_ID: "fsxFileSystemId";
    readonly FSX_SVM_ID: "fsxSvmId";
    readonly FSX_DOCUMENTS_PATH: "fsxDocumentsPath";
    readonly FSX_EMBEDDINGS_PATH: "fsxEmbeddingsPath";
    readonly FSX_INDEX_PATH: "fsxIndexPath";
    readonly MAX_FILES: "maxFiles";
    readonly MAX_FOLDERS: "maxFolders";
    readonly MAX_DATA_SIZE_GB: "maxDataSizeGB";
    readonly BATCH_SIZE: "batchSize";
    readonly MAX_PARALLEL_JOBS: "maxParallelJobs";
    readonly SPOT_MAX_PRICE: "spotMaxPrice";
    readonly SPOT_INSTANCE_TYPES: "spotInstanceTypes";
    readonly SPOT_AVAILABILITY_ZONES: "spotAvailabilityZones";
    readonly SPOT_MAX_RETRIES: "spotMaxRetries";
    readonly BATCH_MAX_VCPUS: "batchMaxvCpus";
    readonly BATCH_MIN_VCPUS: "batchMinvCpus";
    readonly BATCH_RETRY_ATTEMPTS: "batchRetryAttempts";
    readonly BATCH_JOB_TIMEOUT: "batchJobTimeout";
    readonly BATCH_USE_SPOT: "batchUseSpot";
    readonly ECS_DESIRED_COUNT: "ecsDesiredCount";
    readonly ECS_CPU: "ecsCpu";
    readonly ECS_MEMORY: "ecsMemory";
    readonly ECS_MAX_CAPACITY: "ecsMaxCapacity";
    readonly ECS_MIN_CAPACITY: "ecsMinCapacity";
    readonly MONITORING_NAMESPACE: "monitoringNamespace";
    readonly MONITORING_RETENTION_DAYS: "monitoringRetentionDays";
    readonly ALERT_JOB_FAILURE_THRESHOLD: "alertJobFailureThreshold";
    readonly ALERT_EXECUTION_TIME_THRESHOLD: "alertExecutionTimeThreshold";
    readonly ALERT_ERROR_RATE_THRESHOLD: "alertErrorRateThreshold";
    readonly COST_ANALYSIS_ENABLED: "costAnalysisEnabled";
    readonly COST_REPORT_FREQUENCY: "costReportFrequency";
    readonly COST_BASELINE_PATTERN: "costBaselinePattern";
    readonly MIGRATION_PARALLEL_RUN_DAYS: "migrationParallelRunDays";
    readonly MIGRATION_CANARY_ENABLED: "migrationCanaryEnabled";
    readonly MIGRATION_TRAFFIC_SPLIT: "migrationTrafficSplit";
    readonly CIFSDATAVOL_NAME: "cifsdataVolName";
    readonly RAGDB_VOL_PATH: "ragdbVolPath";
    readonly EMBEDDING_MODEL: "embeddingModel";
};
/**
 * 環境変数パーサークラス
 * CDK context変数から設定を読み取り、検証を行う
 */
export declare class EmbeddingConfigParser {
    private app;
    private stack;
    constructor(app: App, stack: Stack);
    /**
     * CDK context変数から拡張Embedding設定を解析
     * @returns 解析された設定オブジェクト
     */
    parseEmbeddingConfig(): ExtendedEmbeddingConfig;
    /**
     * FSx ONTAP マウント設定の解析
     */
    private parseFsxMountConfig;
    /**
     * 処理制限設定の解析
     */
    private parseProcessingLimits;
    /**
     * SQLite UPSERT設定の解析
     */
    private parseSqliteUpsertConfig;
    /**
     * 監視設定の解析
     */
    private parseMonitoringConfig;
    /**
     * コスト分析設定の解析
     */
    private parseCostAnalysisConfig;
    /**
     * 移行設定の解析
     */
    private parseMigrationConfig;
    /**
     * Spot設定の解析
     */
    private parseSpotConfig;
    /**
     * Batch設定の解析
     */
    private parseBatchConfig;
    /**
     * ECS設定の解析
     */
    private parseEcsConfig;
    /**
     * CDK context変数から値を取得（型安全）
     */
    private getContextValue;
    /**
     * 設定の検証
     */
    private validateConfig;
    /**
     * 設定の詳細情報を出力
     */
    printConfigSummary(config: ExtendedEmbeddingConfig): void;
}
/**
 * 設定ファクトリークラス
 * 環境に応じた設定の生成を行う
 */
export declare class EmbeddingConfigFactory {
    /**
     * 開発環境用の設定を生成
     */
    static createDevelopmentConfig(): Partial<ExtendedEmbeddingConfig>;
    /**
     * 本番環境用の設定を生成
     */
    static createProductionConfig(): Partial<ExtendedEmbeddingConfig>;
    /**
     * テスト環境用の設定を生成
     */
    static createTestConfig(): Partial<ExtendedEmbeddingConfig>;
}
/**
 * 設定ユーティリティ関数群
 */
export declare class EmbeddingConfigUtils {
    /**
     * 設定をJSON形式で出力
     */
    static exportConfigAsJson(config: ExtendedEmbeddingConfig): string;
    /**
     * 設定をYAML形式で出力（簡易版）
     */
    static exportConfigAsYaml(config: ExtendedEmbeddingConfig): string;
    /**
     * 設定の差分を比較
     */
    static compareConfigs(config1: ExtendedEmbeddingConfig, config2: ExtendedEmbeddingConfig): string[];
    /**
     * 設定のコスト見積もり（概算）
     */
    static estimateMonthlyCost(config: ExtendedEmbeddingConfig): number;
}
