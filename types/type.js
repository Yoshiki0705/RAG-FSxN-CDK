"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingConfigUtils = exports.EmbeddingConfigFactory = exports.EmbeddingConfigParser = exports.CDK_CONTEXT_KEYS = exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG = exports.EmbeddingConfigValidator = void 0;
exports.isExtendedEmbeddingConfig = isExtendedEmbeddingConfig;
exports.hasSpotConfig = hasSpotConfig;
exports.hasBatchConfig = hasBatchConfig;
exports.hasEcsConfig = hasEcsConfig;
/**
 * 設定検証ユーティリティクラス
 */
class EmbeddingConfigValidator {
    /**
     * 拡張Embedding設定の妥当性を検証
     * @param config 検証対象の設定
     * @returns エラーメッセージの配列（空の場合は妥当）
     */
    static validateExtendedEmbeddingConfig(config) {
        const errors = [];
        // 基本設定の検証
        if (!config.pattern) {
            errors.push('アーキテクチャパターンの指定が必要です');
        }
        if (!config.schedule) {
            errors.push('スケジュール（cron式）の指定が必要です');
        }
        else if (!this.isValidCronExpression(config.schedule)) {
            errors.push('無効なcron式です: ' + config.schedule);
        }
        if (!config.dockerImage) {
            errors.push('Dockerイメージの指定が必要です');
        }
        // FSx設定の検証
        if (!config.fsxMountConfig) {
            errors.push('FSx ONTAP マウント設定が必要です');
        }
        else {
            errors.push(...this.validateFsxMountConfig(config.fsxMountConfig));
        }
        // 処理制限の検証
        if (!config.processingLimits) {
            errors.push('処理制限設定が必要です');
        }
        else {
            errors.push(...this.validateProcessingLimits(config.processingLimits));
        }
        // パターン固有設定の検証
        switch (config.pattern) {
            case 'ec2-spot':
                if (!config.spotConfig) {
                    errors.push('EC2 SpotパターンにはspotConfigが必要です');
                }
                else {
                    errors.push(...this.validateSpotConfig(config.spotConfig));
                }
                break;
            case 'aws-batch':
                if (!config.batchConfig) {
                    errors.push('AWS BatchパターンにはbatchConfigが必要です');
                }
                else {
                    errors.push(...this.validateBatchConfig(config.batchConfig));
                }
                break;
            case 'ecs-ec2':
                if (!config.ecsConfig) {
                    errors.push('ECS on EC2パターンにはecsConfigが必要です');
                }
                else {
                    errors.push(...this.validateEcsConfig(config.ecsConfig));
                }
                break;
        }
        return errors;
    }
    /**
     * cron式の妥当性を検証
     */
    static isValidCronExpression(cron) {
        // 基本的なcron式の検証（5フィールド形式）
        const cronRegex = /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([012]?\d|3[01])) (\*|([0]?\d|1[0-2])) (\*|([0-6]))$/;
        return cronRegex.test(cron);
    }
    /**
     * FSxマウント設定の検証
     */
    static validateFsxMountConfig(config) {
        const errors = [];
        if (!config.fileSystemId) {
            errors.push('FSx ファイルシステムIDが必要です');
        }
        if (!config.svmId) {
            errors.push('SVM IDが必要です');
        }
        if (!config.volumes) {
            errors.push('ボリューム設定が必要です');
        }
        else {
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
    static validateProcessingLimits(config) {
        const errors = [];
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
    static validateSpotConfig(config) {
        const errors = [];
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
    static validateBatchConfig(config) {
        const errors = [];
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
    static validateEcsConfig(config) {
        const errors = [];
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
exports.EmbeddingConfigValidator = EmbeddingConfigValidator;
/**
 * デフォルト設定値
 */
exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG = {
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
function isExtendedEmbeddingConfig(obj) {
    return obj &&
        typeof obj.pattern === 'string' &&
        typeof obj.schedule === 'string' &&
        typeof obj.dockerImage === 'string';
}
function hasSpotConfig(config) {
    return config.pattern === 'ec2-spot' && config.spotConfig !== undefined;
}
function hasBatchConfig(config) {
    return config.pattern === 'aws-batch' && config.batchConfig !== undefined;
}
function hasEcsConfig(config) {
    return config.pattern === 'ecs-ec2' && config.ecsConfig !== undefined;
}
const type_1 = require("./types/type");
/**
 * CDK Context変数のキー定数
 */
exports.CDK_CONTEXT_KEYS = {
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
};
/**
 * 環境変数パーサークラス
 * CDK context変数から設定を読み取り、検証を行う
 */
class EmbeddingConfigParser {
    app;
    stack;
    constructor(app, stack) {
        this.app = app;
        this.stack = stack;
    }
    /**
     * CDK context変数から拡張Embedding設定を解析
     * @returns 解析された設定オブジェクト
     */
    parseEmbeddingConfig() {
        console.log('🔧 Embedding設定を解析中...');
        // 基本設定の解析
        const pattern = this.getContextValue(exports.CDK_CONTEXT_KEYS.EMBEDDING_PATTERN, 'ec2-ondemand');
        const schedule = this.getContextValue(exports.CDK_CONTEXT_KEYS.EMBEDDING_SCHEDULE, '0 2 * * *');
        const dockerImage = this.getContextValue(exports.CDK_CONTEXT_KEYS.EMBEDDING_DOCKER_IMAGE, 'public.ecr.aws/lambda/python:3.11');
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
        const cifsdataVolName = this.getContextValue(exports.CDK_CONTEXT_KEYS.CIFSDATAVOL_NAME, 'cifsdata');
        const ragdbVolPath = this.getContextValue(exports.CDK_CONTEXT_KEYS.RAGDB_VOL_PATH, '/ragdb');
        const model = this.getContextValue(exports.CDK_CONTEXT_KEYS.EMBEDDING_MODEL, 'amazon.titan-embed-text-v1');
        // 設定オブジェクトの構築
        const config = {
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
    parseFsxMountConfig() {
        const fileSystemId = this.getContextValue(exports.CDK_CONTEXT_KEYS.FSX_FILE_SYSTEM_ID, '');
        const svmId = this.getContextValue(exports.CDK_CONTEXT_KEYS.FSX_SVM_ID, '');
        const documentsPath = this.getContextValue(exports.CDK_CONTEXT_KEYS.FSX_DOCUMENTS_PATH, '/documents');
        const embeddingsPath = this.getContextValue(exports.CDK_CONTEXT_KEYS.FSX_EMBEDDINGS_PATH, '/embeddings');
        const indexPath = this.getContextValue(exports.CDK_CONTEXT_KEYS.FSX_INDEX_PATH, '/index');
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
    parseProcessingLimits() {
        return {
            maxFiles: this.getContextValue(exports.CDK_CONTEXT_KEYS.MAX_FILES, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits.maxFiles),
            maxFolders: this.getContextValue(exports.CDK_CONTEXT_KEYS.MAX_FOLDERS, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits.maxFolders),
            maxDataSizeGB: this.getContextValue(exports.CDK_CONTEXT_KEYS.MAX_DATA_SIZE_GB, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits.maxDataSizeGB),
            batchSize: this.getContextValue(exports.CDK_CONTEXT_KEYS.BATCH_SIZE, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits.batchSize),
            maxParallelJobs: this.getContextValue(exports.CDK_CONTEXT_KEYS.MAX_PARALLEL_JOBS, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits.maxParallelJobs),
            memoryLimitMB: exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits.memoryLimitMB,
            diskLimitGB: exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.processingLimits.diskLimitGB
        };
    }
    /**
     * SQLite UPSERT設定の解析
     */
    parseSqliteUpsertConfig() {
        return exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.sqliteConfig;
    }
    /**
     * 監視設定の解析
     */
    parseMonitoringConfig() {
        const namespace = this.getContextValue(exports.CDK_CONTEXT_KEYS.MONITORING_NAMESPACE, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig.cloudWatch.namespace);
        const retentionDays = this.getContextValue(exports.CDK_CONTEXT_KEYS.MONITORING_RETENTION_DAYS, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig.cloudWatch.retentionDays);
        const jobFailureThreshold = this.getContextValue(exports.CDK_CONTEXT_KEYS.ALERT_JOB_FAILURE_THRESHOLD, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig.alerts.jobFailureThreshold);
        const executionTimeThreshold = this.getContextValue(exports.CDK_CONTEXT_KEYS.ALERT_EXECUTION_TIME_THRESHOLD, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig.alerts.executionTimeThresholdMinutes);
        const errorRateThreshold = this.getContextValue(exports.CDK_CONTEXT_KEYS.ALERT_ERROR_RATE_THRESHOLD, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig.alerts.errorRateThreshold);
        return {
            cloudWatch: {
                namespace,
                metrics: exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig.cloudWatch.metrics,
                retentionDays
            },
            alerts: {
                jobFailureThreshold,
                executionTimeThresholdMinutes: executionTimeThreshold,
                errorRateThreshold
            },
            dashboard: exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.monitoringConfig.dashboard
        };
    }
    /**
     * コスト分析設定の解析
     */
    parseCostAnalysisConfig() {
        const enabled = this.getContextValue(exports.CDK_CONTEXT_KEYS.COST_ANALYSIS_ENABLED, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.costAnalysisConfig.enabled);
        if (!enabled) {
            return undefined;
        }
        const reportFrequency = this.getContextValue(exports.CDK_CONTEXT_KEYS.COST_REPORT_FREQUENCY, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.costAnalysisConfig.reportFrequency);
        const baselinePattern = this.getContextValue(exports.CDK_CONTEXT_KEYS.COST_BASELINE_PATTERN, exports.DEFAULT_EXTENDED_EMBEDDING_CONFIG.costAnalysisConfig.baselineCostPattern);
        return {
            enabled,
            reportFrequency,
            baselineCostPattern: baselinePattern
        };
    }
    /**
     * 移行設定の解析
     */
    parseMigrationConfig() {
        const parallelRunDays = this.getContextValue(exports.CDK_CONTEXT_KEYS.MIGRATION_PARALLEL_RUN_DAYS, 7);
        const canaryEnabled = this.getContextValue(exports.CDK_CONTEXT_KEYS.MIGRATION_CANARY_ENABLED, false);
        const trafficSplitStr = this.getContextValue(exports.CDK_CONTEXT_KEYS.MIGRATION_TRAFFIC_SPLIT, '5,15,50,100');
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
    parseSpotConfig() {
        const maxPrice = this.getContextValue(exports.CDK_CONTEXT_KEYS.SPOT_MAX_PRICE, '0.10');
        const instanceTypesStr = this.getContextValue(exports.CDK_CONTEXT_KEYS.SPOT_INSTANCE_TYPES, 'm5.large,m5.xlarge,m4.large,m4.xlarge');
        const instanceTypes = instanceTypesStr
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        const availabilityZonesStr = this.getContextValue(exports.CDK_CONTEXT_KEYS.SPOT_AVAILABILITY_ZONES, 'us-east-1a,us-east-1b,us-east-1c');
        const availabilityZones = availabilityZonesStr
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        const maxRetries = this.getContextValue(exports.CDK_CONTEXT_KEYS.SPOT_MAX_RETRIES, 3);
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
    parseBatchConfig() {
        const maxvCpus = this.getContextValue(exports.CDK_CONTEXT_KEYS.BATCH_MAX_VCPUS, 256);
        const minvCpus = this.getContextValue(exports.CDK_CONTEXT_KEYS.BATCH_MIN_VCPUS, 0);
        const retryAttempts = this.getContextValue(exports.CDK_CONTEXT_KEYS.BATCH_RETRY_ATTEMPTS, 3);
        const jobTimeoutSeconds = this.getContextValue(exports.CDK_CONTEXT_KEYS.BATCH_JOB_TIMEOUT, 7200);
        const useSpotInstances = this.getContextValue(exports.CDK_CONTEXT_KEYS.BATCH_USE_SPOT, true);
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
    parseEcsConfig() {
        const desiredCount = this.getContextValue(exports.CDK_CONTEXT_KEYS.ECS_DESIRED_COUNT, 1);
        const cpu = this.getContextValue(exports.CDK_CONTEXT_KEYS.ECS_CPU, 2048);
        const memory = this.getContextValue(exports.CDK_CONTEXT_KEYS.ECS_MEMORY, 4096);
        const maxCapacity = this.getContextValue(exports.CDK_CONTEXT_KEYS.ECS_MAX_CAPACITY, 10);
        const minCapacity = this.getContextValue(exports.CDK_CONTEXT_KEYS.ECS_MIN_CAPACITY, 1);
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
    getContextValue(key, defaultValue) {
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
                return numValue;
            }
            if (typeof defaultValue === 'boolean') {
                if (typeof value === 'string') {
                    const boolValue = value.toLowerCase() === 'true' || value === '1';
                    return boolValue;
                }
                return Boolean(value);
            }
            if (typeof defaultValue === 'string') {
                return String(value);
            }
            return value;
        }
        catch (error) {
            console.warn(`⚠️  Context変数 '${key}' の型変換でエラーが発生しました: ${error}. デフォルト値を使用: ${defaultValue}`);
            return defaultValue;
        }
    }
    /**
     * 設定の検証
     */
    validateConfig(config) {
        console.log('🔍 Embedding設定を検証中...');
        const errors = type_1.EmbeddingConfigValidator.validateExtendedEmbeddingConfig(config);
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
    printConfigSummary(config) {
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
exports.EmbeddingConfigParser = EmbeddingConfigParser;
/**
 * 設定ファクトリークラス
 * 環境に応じた設定の生成を行う
 */
class EmbeddingConfigFactory {
    /**
     * 開発環境用の設定を生成
     */
    static createDevelopmentConfig() {
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
    static createProductionConfig() {
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
    static createTestConfig() {
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
exports.EmbeddingConfigFactory = EmbeddingConfigFactory;
/**
 * 設定ユーティリティ関数群
 */
class EmbeddingConfigUtils {
    /**
     * 設定をJSON形式で出力
     */
    static exportConfigAsJson(config) {
        return JSON.stringify(config, null, 2);
    }
    /**
     * 設定をYAML形式で出力（簡易版）
     */
    static exportConfigAsYaml(config) {
        const yamlLines = [];
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
    static compareConfigs(config1, config2) {
        const differences = [];
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
    static estimateMonthlyCost(config) {
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
exports.EmbeddingConfigUtils = EmbeddingConfigUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInR5cGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBeW9CQSw4REFLQztBQUVELHNDQUVDO0FBRUQsd0NBRUM7QUFFRCxvQ0FFQztBQXBSRDs7R0FFRztBQUNILE1BQWEsd0JBQXdCO0lBQ25DOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsK0JBQStCLENBQUMsTUFBK0I7UUFDcEUsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBRTVCLFVBQVU7UUFDVixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQixNQUFNLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDdkMsQ0FBQzthQUFNLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDeEQsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsV0FBVztRQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRUQsVUFBVTtRQUNW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Q3hFLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzVFLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxNQUFNLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzNHLENBQUM7UUFFRCxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBK0I7UUFDeEQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBRWpCLFFBQVEsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZCLEtBQUssY0FBYztnQkFDakIsb0JBQW9CO2dCQUNwQixRQUFRLEdBQUcsR0FBRyxDQUFDLENBQUMsU0FBUztnQkFDekIsTUFBTTtZQUNSLEtBQUssVUFBVTtnQkFDYixvQkFBb0I7Z0JBQ3BCLFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxRQUFRO2dCQUN2QixNQUFNO1lBQ1IsS0FBSyxXQUFXO2dCQUNkLG9CQUFvQjtnQkFDcEIsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLFFBQVE7Z0JBQ3ZCLE1BQU07WUFDUixLQUFLLFNBQVM7Z0JBQ1osZ0JBQWdCO2dCQUNoQixRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsUUFBUTtnQkFDdkIsTUFBTTtRQUNWLENBQUM7UUFFRCxlQUFlO1FBQ2YsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUvRSxPQUFPLFFBQVEsR0FBRyxjQUFjLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBekZELG9EQXlGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0YWNrUHJvcHMgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV0d29ya0NvbmZpZyB7XG4gIHZwY0NpZHI/OiBzdHJpbmc7XG4gIHN1Ym5ldENpZHJNYXNrPzogbnVtYmVyO1xuICBhdmFpbGFiaWxpdHlab25lcz86IHN0cmluZ1tdO1xuICBleGlzdGluZ1ZwYz86IGJvb2xlYW47XG4gIHZwY0lkPzogc3RyaW5nO1xuICBjaWRyPzogc3RyaW5nO1xuICBtYXhBenM/OiBudW1iZXI7XG4gIHB1YmxpY1N1Ym5ldD86IGFueTtcbiAgbmF0U3VibmV0PzogYW55O1xuICBpc29sYXRlZFN1Ym5ldD86IGFueTtcbiAgY2lkck1hc2s/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWRDb25maWcge1xuICBkb21haW5OYW1lPzogc3RyaW5nO1xuICBhZG1pblBhc3N3b3JkPzogc3RyaW5nO1xuICBhZEFkbWluUGFzc3dvcmQ/OiBzdHJpbmc7XG4gIGFkRG9tYWluTmFtZT86IHN0cmluZztcbiAgZXhpc3RpbmdBZD86IGJvb2xlYW47XG4gIGFkRG5zSXBzPzogc3RyaW5nW107XG4gIHNlcnZpY2VBY2NvdW50VXNlck5hbWU/OiBzdHJpbmc7XG4gIHNlcnZpY2VBY2NvdW50UGFzc3dvcmQ/OiBzdHJpbmc7XG4gIHN2bU5ldEJpb3NOYW1lPzogc3RyaW5nO1xuICBhZE91Pzogc3RyaW5nO1xuICBmaWxlU3lzdGVtQWRtaW5pc3RyYXRvcnNHcm91cD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGc3hDb25maWcge1xuICBzdG9yYWdlQ2FwYWNpdHk/OiBudW1iZXI7XG4gIHRocm91Z2hwdXRDYXBhY2l0eT86IG51bWJlcjtcbiAgZGVwbG95bWVudFR5cGU/OiBzdHJpbmc7XG4gIGZzeEFkbWluUGFzc3dvcmQ/OiBzdHJpbmc7XG4gIGFkQ29uZmlnPzogQWRDb25maWc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhdEFwcENvbmZpZyB7XG4gIGVuYWJsZWQ/OiBib29sZWFuO1xuICBjb250YWluZXJQb3J0PzogbnVtYmVyO1xuICBjcHU/OiBudW1iZXI7XG4gIG1lbW9yeT86IG51bWJlcjtcbiAgc3VibmV0cz86IGFueVtdO1xuICBsYW1iZGFWcGNJZD86IHN0cmluZztcbiAgbGFtYmRhVnBjU3VibmV0cz86IGFueVtdO1xuICBpbWFnZVBhdGg/OiBzdHJpbmc7XG4gIHRhZz86IHN0cmluZztcbiAgYWxiRmFyZ2F0ZVNlcnZpY2VQcm9wcz86IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEYXRhYmFzZUNvbmZpZyB7XG4gIGVuZ2luZT86IHN0cmluZztcbiAgaW5zdGFuY2VDbGFzcz86IHN0cmluZztcbiAgYWxsb2NhdGVkU3RvcmFnZT86IG51bWJlcjtcbiAgdXNlckFjY2Vzc1RhYmxlPzogc3RyaW5nO1xuICBwYXJ0aXRpb25LZXk/OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmVjdG9yQ29uZmlnIHtcbiAgaW5kZXhOYW1lPzogc3RyaW5nO1xuICBkaW1lbnNpb24/OiBudW1iZXI7XG59XG5cbi8vIFN0YWNrIFByb3BzIGludGVyZmFjZXNcbmV4cG9ydCBpbnRlcmZhY2UgQ29wbXV0ZVN0YWNrUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgcHJvamVjdE5hbWU/OiBzdHJpbmc7XG4gIGVudmlyb25tZW50Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdlYkFwcFN0YWNrUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgcHJvamVjdE5hbWU/OiBzdHJpbmc7XG4gIGVudmlyb25tZW50Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5ldHdvcmtPbmx5UHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgcHJvamVjdE5hbWU/OiBzdHJpbmc7XG4gIGVudmlyb25tZW50Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVtYmVkZGluZ1NlcnZlclByb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XG4gIHByb2plY3ROYW1lPzogc3RyaW5nO1xuICBlbnZpcm9ubWVudD86IHN0cmluZztcbiAgdnBjPzogYW55O1xuICBjb25maWc/OiBhbnk7XG4gIHZlY3RvckRCPzogYW55O1xuICBkYXRhYmFzZT86IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYW1iZGFXZWJBZGFwdGVyUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgcHJvamVjdE5hbWU/OiBzdHJpbmc7XG4gIGVudmlyb25tZW50Pzogc3RyaW5nO1xuICB2cGM/OiBhbnk7XG4gIHdhZkF0dHJBcm4/OiBzdHJpbmc7XG4gIGVkZ2VGblZlcnNpb24/OiBhbnk7XG4gIGltYWdlUGF0aD86IHN0cmluZztcbiAgdGFnPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZlY3RvckRCUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgcHJvamVjdE5hbWU/OiBzdHJpbmc7XG4gIGVudmlyb25tZW50Pzogc3RyaW5nO1xuICB2ZWN0b3I/OiBhbnk7XG4gIGNvbGxlY3Rpb25OYW1lPzogc3RyaW5nO1xuICBjb25maWc/OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWRQcm9wcyBleHRlbmRzIFN0YWNrUHJvcHMge1xuICBhZENvbmZpZz86IEFkQ29uZmlnO1xuICBzdWJuZXRJZHM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGU3hOUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgc3VibmV0SWRzPzogc3RyaW5nW107XG4gIGRlcGxveW1lbnRUeXBlPzogc3RyaW5nO1xuICBmc3hBZG1pblBhc3N3b3JkPzogc3RyaW5nO1xuICBzdG9yYWdlQ2FwYWNpdHk/OiBudW1iZXI7XG4gIHRocm91Z2hwdXRDYXBhY2l0eT86IG51bWJlcjtcbiAgYWRDb25maWc/OiBBZENvbmZpZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcGlQcm9wcyBleHRlbmRzIFN0YWNrUHJvcHMge1xuICBpbWFnZVBhdGg/OiBzdHJpbmc7XG4gIHRhZz86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDaGF0QXBwUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgaW1hZ2VQYXRoPzogc3RyaW5nO1xuICB0YWc/OiBzdHJpbmc7XG4gIGFsYkZhcmdhdGVTZXJ2aWNlUHJvcHM/OiBhbnk7XG59XG5cbi8vID09PSBFbWJlZGRpbmcgU2VydmVyIEFyY2hpdGVjdHVyZSBVcGdyYWRlIC0g5ouh5by16Kit5a6a44Kk44Oz44K/44O844OV44Kn44O844K5ID09PVxuLyoqXG4gKiBGU3ggZm9yIE5ldEFwcCBPTlRBUCBFbWJlZGRpbmcgU2VydmVyIEFyY2hpdGVjdHVyZSBVcGdyYWRlXG4gKiDopIfmlbDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjg5Hjgr/jg7zjg7Plr77lv5zjga7oqK3lrprjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrnlrprnvqlcbiAqL1xuXG4vKipcbiAqIOOCouODvOOCreODhuOCr+ODgeODo+ODkeOCv+ODvOODs+OBrueorumhnlxuICovXG5leHBvcnQgdHlwZSBFbWJlZGRpbmdBcmNoaXRlY3R1cmVQYXR0ZXJuID0gXG4gIHwgJ2VjMi1vbmRlbWFuZCcgICAgLy8g54++5Zyo5qeL5oiQ77yIRUMy44Kq44Oz44OH44Oe44Oz44OJMjQvN+eovOWDje+8iVxuICB8ICdlYzItc3BvdCcgICAgICAgIC8vIEVDMiBTcG90ICsgRXZlbnRCcmlkZ2XvvIg5MCXjgrPjgrnjg4jliYrmuJvvvIlcbiAgfCAnYXdzLWJhdGNoJyAgICAgICAvLyBBV1MgQmF0Y2ggKyBFdmVudEJyaWRnZe+8iOODleODq+ODnuODjeODvOOCuOODie+8iVxuICB8ICdlY3MtZWMyJzsgICAgICAgIC8vIEVDUyBvbiBFQzIgKyBFdmVudEJyaWRnZe+8iEVDU+e1seWQiOeuoeeQhu+8iVxuXG4vKipcbiAqIEZTeCBPTlRBUCDjg57jgqbjg7Pjg4joqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGU3hNb3VudENvbmZpZyB7XG4gIC8qKiDjg5XjgqHjgqTjg6vjgrfjgrnjg4bjg6BJRCAqL1xuICBmaWxlU3lzdGVtSWQ6IHN0cmluZztcbiAgLyoqIFNWTSBJRCAqL1xuICBzdm1JZDogc3RyaW5nO1xuICAvKiog44Oc44Oq44Ol44O844Og6Kit5a6aICovXG4gIHZvbHVtZXM6IHtcbiAgICAvKiog44OJ44Kt44Ol44Oh44Oz44OI44Oc44Oq44Ol44O844Og77yIU01CL0NJRlPvvIkgKi9cbiAgICBkb2N1bWVudHM6IHtcbiAgICAgIHBhdGg6IHN0cmluZztcbiAgICAgIHByb3RvY29sOiAnU01CJyB8ICdORlMnO1xuICAgICAgbW91bnRQb2ludDogc3RyaW5nO1xuICAgIH07XG4gICAgLyoqIOWfi+OCgei+vOOBv+ODnOODquODpeODvOODoO+8iE5GU++8iSAqL1xuICAgIGVtYmVkZGluZ3M6IHtcbiAgICAgIHBhdGg6IHN0cmluZztcbiAgICAgIHByb3RvY29sOiAnTkZTJztcbiAgICAgIG1vdW50UG9pbnQ6IHN0cmluZztcbiAgICB9O1xuICAgIC8qKiDjgqTjg7Pjg4fjg4Pjgq/jgrnjg5zjg6rjg6Xjg7zjg6DvvIhORlPvvIkgKi9cbiAgICBpbmRleDoge1xuICAgICAgcGF0aDogc3RyaW5nO1xuICAgICAgcHJvdG9jb2w6ICdORlMnO1xuICAgICAgbW91bnRQb2ludDogc3RyaW5nO1xuICAgIH07XG4gIH07XG59XG5cbi8qKlxuICogRUMyIFNwb3Qg44Kk44Oz44K544K/44Oz44K56Kit5a6aXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3BvdEluc3RhbmNlQ29uZmlnIHtcbiAgLyoqIOacgOWkp+S+oeagvO+8iFVTRC/mmYLplpPvvIkgKi9cbiAgbWF4UHJpY2U/OiBzdHJpbmc7XG4gIC8qKiDjgqTjg7Pjgrnjgr/jg7Pjgrnjgr/jgqTjg5fjga7jg6rjgrnjg4ggKi9cbiAgaW5zdGFuY2VUeXBlczogc3RyaW5nW107XG4gIC8qKiDopIfmlbBBWumFjee9riAqL1xuICBhdmFpbGFiaWxpdHlab25lczogc3RyaW5nW107XG4gIC8qKiDkuK3mlq3mmYLjga7oh6rli5Xlho3oqabooYzlm57mlbAgKi9cbiAgbWF4UmV0cmllcz86IG51bWJlcjtcbiAgLyoqIOWHpueQhuWujOS6huW+jOOBruiHquWLlee1guS6hiAqL1xuICBhdXRvVGVybWluYXRlPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBV1MgQmF0Y2gg6Kit5a6aXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmF0Y2hDb25maWcge1xuICAvKiog5pyA5aSndkNQVeaVsCAqL1xuICBtYXh2Q3B1czogbnVtYmVyO1xuICAvKiog5pyA5bCPdkNQVeaVsCAqL1xuICBtaW52Q3B1cz86IG51bWJlcjtcbiAgLyoqIOW4jOacm3ZDUFXmlbAgKi9cbiAgZGVzaXJlZHZDcHVzPzogbnVtYmVyO1xuICAvKiog44Oq44OI44Op44Kk5Zue5pWwICovXG4gIHJldHJ5QXR0ZW1wdHM6IG51bWJlcjtcbiAgLyoqIOOCuOODp+ODluOCv+OCpOODoOOCouOCpuODiO+8iOenku+8iSAqL1xuICBqb2JUaW1lb3V0U2Vjb25kcz86IG51bWJlcjtcbiAgLyoqIOOCs+ODs+ODlOODpeODvOODiOeSsOWig+OCv+OCpOODlyAqL1xuICBjb21wdXRlRW52aXJvbm1lbnRUeXBlPzogJ01BTkFHRUQnIHwgJ1VOTUFOQUdFRCc7XG4gIC8qKiDjgqTjg7Pjgrnjgr/jg7Pjgrnjgr/jgqTjg5cgKi9cbiAgaW5zdGFuY2VUeXBlcz86IHN0cmluZ1tdO1xuICAvKiogU3BvdOS+oeagvOS9v+eUqOODleODqeOCsCAqL1xuICB1c2VTcG90SW5zdGFuY2VzPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBFQ1Mgb24gRUMyIOioreWumlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEVjc0NvbmZpZyB7XG4gIC8qKiDluIzmnJvjgr/jgrnjgq/mlbAgKi9cbiAgZGVzaXJlZENvdW50OiBudW1iZXI7XG4gIC8qKiBDUFXljZjkvY3vvIgxMDI0ID0gMSB2Q1BV77yJICovXG4gIGNwdTogbnVtYmVyO1xuICAvKiog44Oh44Oi44Oq77yITULvvIkgKi9cbiAgbWVtb3J5OiBudW1iZXI7XG4gIC8qKiDmnIDlpKfjgr/jgrnjgq/mlbAgKi9cbiAgbWF4Q2FwYWNpdHk/OiBudW1iZXI7XG4gIC8qKiDmnIDlsI/jgr/jgrnjgq/mlbAgKi9cbiAgbWluQ2FwYWNpdHk/OiBudW1iZXI7XG4gIC8qKiBBdXRvIFNjYWxpbmfoqK3lrpogKi9cbiAgYXV0b1NjYWxpbmc/OiB7XG4gICAgdGFyZ2V0Q3B1VXRpbGl6YXRpb246IG51bWJlcjtcbiAgICB0YXJnZXRNZW1vcnlVdGlsaXphdGlvbjogbnVtYmVyO1xuICAgIHNjYWxlT3V0Q29vbGRvd24/OiBudW1iZXI7XG4gICAgc2NhbGVJbkNvb2xkb3duPzogbnVtYmVyO1xuICB9O1xuICAvKiog44OX44Op44OD44OI44OV44Kp44O844Og44OQ44O844K444On44OzICovXG4gIHBsYXRmb3JtVmVyc2lvbj86IHN0cmluZztcbn1cblxuLyoqXG4gKiDlh6bnkIbliLbpmZDoqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm9jZXNzaW5nTGltaXRzIHtcbiAgLyoqIOacgOWkp+ODleOCoeOCpOODq+aVsCAqL1xuICBtYXhGaWxlczogbnVtYmVyO1xuICAvKiog5pyA5aSn44OV44Kp44Or44OA44O85pWwICovXG4gIG1heEZvbGRlcnM6IG51bWJlcjtcbiAgLyoqIOacgOWkp+ODh+ODvOOCv+OCteOCpOOCuu+8iEdC77yJICovXG4gIG1heERhdGFTaXplR0I6IG51bWJlcjtcbiAgLyoqIOODkOODg+ODgeOCteOCpOOCuu+8iOODleOCoeOCpOODqy/jg5Djg4Pjg4HvvIkgKi9cbiAgYmF0Y2hTaXplOiBudW1iZXI7XG4gIC8qKiDkuKbliJflh6bnkIbmlbAgKi9cbiAgbWF4UGFyYWxsZWxKb2JzOiBudW1iZXI7XG4gIC8qKiDjg6Hjg6Ljg6rkvb/nlKjph4/liLbpmZDvvIhNQu+8iSAqL1xuICBtZW1vcnlMaW1pdE1CPzogbnVtYmVyO1xuICAvKiog44OH44Kj44K544Kv5a656YeP5Yi26ZmQ77yIR0LvvIkgKi9cbiAgZGlza0xpbWl0R0I/OiBudW1iZXI7XG59XG5cbi8qKlxuICogU1FMaXRlIFVQU0VSVCBNYW5hZ2VyIOe1seWQiOioreWumlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNxbGl0ZVVwc2VydENvbmZpZyB7XG4gIC8qKiDjg6rjg4jjg6njgqToqK3lrpogKi9cbiAgcmV0cnlDb25maWc6IHtcbiAgICBtYXhSZXRyaWVzOiBudW1iZXI7XG4gICAgYmFja29mZk1zOiBudW1iZXI7XG4gICAgZXhwb25lbnRpYWxCYWNrb2ZmPzogYm9vbGVhbjtcbiAgfTtcbiAgLyoqIOODiOODqeODs+OCtuOCr+OCt+ODp+ODs+ioreWumiAqL1xuICB0cmFuc2FjdGlvbkNvbmZpZzoge1xuICAgIGJhdGNoU2l6ZTogbnVtYmVyO1xuICAgIHRpbWVvdXRNczogbnVtYmVyO1xuICB9O1xuICAvKiog55uj6KaW6Kit5a6aICovXG4gIG1vbml0b3JpbmdDb25maWc6IHtcbiAgICBlbmFibGVNZXRyaWNzOiBib29sZWFuO1xuICAgIGVuYWJsZURldGFpbGVkTG9nczogYm9vbGVhbjtcbiAgICBtZXRyaWNzTmFtZXNwYWNlPzogc3RyaW5nO1xuICB9O1xufVxuXG4vKipcbiAqIOebo+imluODu+OCouODqeODvOODiOioreWumlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1vbml0b3JpbmdDb25maWcge1xuICAvKiogQ2xvdWRXYXRjaOioreWumiAqL1xuICBjbG91ZFdhdGNoOiB7XG4gICAgbmFtZXNwYWNlOiBzdHJpbmc7XG4gICAgbWV0cmljczogc3RyaW5nW107XG4gICAgcmV0ZW50aW9uRGF5cz86IG51bWJlcjtcbiAgfTtcbiAgLyoqIOOCouODqeODvOODiOioreWumiAqL1xuICBhbGVydHM6IHtcbiAgICBqb2JGYWlsdXJlVGhyZXNob2xkOiBudW1iZXI7XG4gICAgZXhlY3V0aW9uVGltZVRocmVzaG9sZE1pbnV0ZXM6IG51bWJlcjtcbiAgICBlcnJvclJhdGVUaHJlc2hvbGQ6IG51bWJlcjtcbiAgICBzbnNUb3BpY0Fybj86IHN0cmluZztcbiAgfTtcbiAgLyoqIOODgOODg+OCt+ODpeODnOODvOODieioreWumiAqL1xuICBkYXNoYm9hcmQ/OiB7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIHdpZGdldHM/OiBzdHJpbmdbXTtcbiAgfTtcbn1cblxuLyoqXG4gKiDjgrPjgrnjg4jliIbmnpDoqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb3N0QW5hbHlzaXNDb25maWcge1xuICAvKiog44Kz44K544OI6L+96Leh5pyJ5Yq55YyWICovXG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIC8qKiDjg6zjg53jg7zjg4jnlJ/miJDpoLvluqYgKi9cbiAgcmVwb3J0RnJlcXVlbmN5OiAnREFJTFknIHwgJ1dFRUtMWScgfCAnTU9OVEhMWSc7XG4gIC8qKiDjgrPjgrnjg4jmr5TovIPjg5njg7zjgrnjg6njgqTjg7MgKi9cbiAgYmFzZWxpbmVDb3N0UGF0dGVybj86IEVtYmVkZGluZ0FyY2hpdGVjdHVyZVBhdHRlcm47XG4gIC8qKiDkuojnrpfjgqLjg6njg7zjg4joqK3lrpogKi9cbiAgYnVkZ2V0QWxlcnRzPzoge1xuICAgIG1vbnRobHlCdWRnZXRVU0Q6IG51bWJlcjtcbiAgICBhbGVydFRocmVzaG9sZHM6IG51bWJlcltdOyAvLyDjg5Hjg7zjgrvjg7Pjg4bjg7zjgrhcbiAgfTtcbn1cblxuLyoqXG4gKiDmrrXpmo7nmoTnp7vooYzoqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb25Db25maWcge1xuICAvKiog5Lim6KGM56i85YON5pyf6ZaT77yI5pel77yJICovXG4gIHBhcmFsbGVsUnVuRGF5czogbnVtYmVyO1xuICAvKiog44Kr44OK44Oq44Ki44OH44OX44Ot44Kk44Oh44Oz44OI6Kit5a6aICovXG4gIGNhbmFyeURlcGxveW1lbnQ6IHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHRyYWZmaWNTcGxpdFBlcmNlbnRhZ2VzOiBudW1iZXJbXTsgLy8g5L6LOiBbNSwgMTUsIDUwLCAxMDBdXG4gICAgZXZhbHVhdGlvblBlcmlvZE1pbnV0ZXM6IG51bWJlcjtcbiAgICBhdXRvUm9sbGJhY2tFbmFibGVkOiBib29sZWFuO1xuICB9O1xuICAvKiog5qSc6Ki86Kit5a6aICovXG4gIHZhbGlkYXRpb246IHtcbiAgICBlbmFibGVSZXN1bHRDb21wYXJpc29uOiBib29sZWFuO1xuICAgIHNhbXBsZVBlcmNlbnRhZ2U6IG51bWJlcjtcbiAgICB0b2xlcmFuY2VUaHJlc2hvbGQ6IG51bWJlcjtcbiAgfTtcbn1cblxuLyoqXG4gKiDmi6HlvLXjgZXjgozjgZ9FbWJlZGRpbmfoqK3lrprjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbiAqIOikh+aVsOOCouODvOOCreODhuOCr+ODgeODo+ODkeOCv+ODvOODs+OBq+WvvuW/nFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnIHtcbiAgLyoqIOOCouODvOOCreODhuOCr+ODgeODo+ODkeOCv+ODvOODs+mBuOaKniAqL1xuICBwYXR0ZXJuOiBFbWJlZGRpbmdBcmNoaXRlY3R1cmVQYXR0ZXJuO1xuICBcbiAgLyoqIOWFsemAmuioreWumiAqL1xuICBzY2hlZHVsZTogc3RyaW5nOyAvLyBjcm9u5byP77yI5L6LOiBcIjAgMiAqICogKlwi77yJXG4gIGRvY2tlckltYWdlOiBzdHJpbmc7XG4gIFxuICAvKiogRlN4IE9OVEFQ57Wx5ZCI6Kit5a6aICovXG4gIGZzeE1vdW50Q29uZmlnOiBGU3hNb3VudENvbmZpZztcbiAgXG4gIC8qKiDlh6bnkIbliLbpmZDoqK3lrpogKi9cbiAgcHJvY2Vzc2luZ0xpbWl0czogUHJvY2Vzc2luZ0xpbWl0cztcbiAgXG4gIC8qKiBTUUxpdGUgVVBTRVJUIE1hbmFnZXLntbHlkIjoqK3lrpogKi9cbiAgc3FsaXRlQ29uZmlnOiBTcWxpdGVVcHNlcnRDb25maWc7XG4gIFxuICAvKiog55uj6KaW44O744Ki44Op44O844OI6Kit5a6aICovXG4gIG1vbml0b3JpbmdDb25maWc6IE1vbml0b3JpbmdDb25maWc7XG4gIFxuICAvKiog44Kz44K544OI5YiG5p6Q6Kit5a6aICovXG4gIGNvc3RBbmFseXNpc0NvbmZpZz86IENvc3RBbmFseXNpc0NvbmZpZztcbiAgXG4gIC8qKiDmrrXpmo7nmoTnp7vooYzoqK3lrpogKi9cbiAgbWlncmF0aW9uQ29uZmlnPzogTWlncmF0aW9uQ29uZmlnO1xuICBcbiAgLyoqIOODkeOCv+ODvOODs+WbuuacieioreWumiAqL1xuICBzcG90Q29uZmlnPzogU3BvdEluc3RhbmNlQ29uZmlnO1xuICBiYXRjaENvbmZpZz86IEJhdGNoQ29uZmlnO1xuICBlY3NDb25maWc/OiBFY3NDb25maWc7XG4gIFxuICAvKiog5pei5a2Y6Kit5a6a44Go44Gu5LqS5o+b5oCnICovXG4gIGNpZnNkYXRhVm9sTmFtZT86IHN0cmluZztcbiAgcmFnZGJWb2xQYXRoPzogc3RyaW5nO1xuICBiYXRjaFNpemU/OiBudW1iZXI7XG4gIGNvbmN1cnJlbmN5PzogbnVtYmVyO1xuICBtb2RlbD86IHN0cmluZztcbn1cblxuLyoqXG4gKiDoqK3lrprmpJzoqLzjg6bjg7zjg4bjgqPjg6rjg4bjgqPjgq/jg6njgrlcbiAqL1xuZXhwb3J0IGNsYXNzIEVtYmVkZGluZ0NvbmZpZ1ZhbGlkYXRvciB7XG4gIC8qKlxuICAgKiDmi6HlvLVFbWJlZGRpbmfoqK3lrprjga7lpqXlvZPmgKfjgpLmpJzoqLxcbiAgICogQHBhcmFtIGNvbmZpZyDmpJzoqLzlr77osaHjga7oqK3lrppcbiAgICogQHJldHVybnMg44Ko44Op44O844Oh44OD44K744O844K444Gu6YWN5YiX77yI56m644Gu5aC05ZCI44Gv5aal5b2T77yJXG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGVFeHRlbmRlZEVtYmVkZGluZ0NvbmZpZyhjb25maWc6IEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICAvLyDln7rmnKzoqK3lrprjga7mpJzoqLxcbiAgICBpZiAoIWNvbmZpZy5wYXR0ZXJuKSB7XG4gICAgICBlcnJvcnMucHVzaCgn44Ki44O844Kt44OG44Kv44OB44Oj44OR44K/44O844Oz44Gu5oyH5a6a44GM5b+F6KaB44Gn44GZJyk7XG4gICAgfVxuICAgIFxuICAgIGlmICghY29uZmlnLnNjaGVkdWxlKSB7XG4gICAgICBlcnJvcnMucHVzaCgn44K544Kx44K444Ol44O844Or77yIY3JvbuW8j++8ieOBruaMh+WumuOBjOW/heimgeOBp+OBmScpO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMuaXNWYWxpZENyb25FeHByZXNzaW9uKGNvbmZpZy5zY2hlZHVsZSkpIHtcbiAgICAgIGVycm9ycy5wdXNoKCfnhKHlirnjgapjcm9u5byP44Gn44GZOiAnICsgY29uZmlnLnNjaGVkdWxlKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCFjb25maWcuZG9ja2VySW1hZ2UpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdEb2NrZXLjgqTjg6Hjg7zjgrjjga7mjIflrprjgYzlv4XopoHjgafjgZknKTtcbiAgICB9XG4gICAgXG4gICAgLy8gRlN46Kit5a6a44Gu5qSc6Ki8XG4gICAgaWYgKCFjb25maWcuZnN4TW91bnRDb25maWcpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdGU3ggT05UQVAg44Oe44Km44Oz44OI6Kit5a6a44GM5b+F6KaB44Gn44GZJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9ycy5wdXNoKC4uLnRoaXMudmFsaWRhdGVGc3hNb3VudENvbmZpZyhjb25maWcuZnN4TW91bnRDb25maWcpKTtcbiAgICB9XG4gICAgXG4gICAgLy8g5Yem55CG5Yi26ZmQ44Gu5qSc6Ki8XG4gICAgaWYgKCFjb25maWcucHJvY2Vzc2luZ0xpbWl0cykge1xuICAgICAgZXJyb3JzLnB1c2goJ+WHpueQhuWItumZkOioreWumuOBjOW/heimgeOBp+OBmScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvcnMucHVzaCguLi50aGlzLnZhbGlkYXRlUHJvY2Vzc2luZ0xpbWl0cyhjb25maWcucHJvY2Vzc2luZ0xpbWl0cykpO1xuICAgIH1cbiAgICBcbiAgICAvLyDjg5Hjgr/jg7zjg7Plm7rmnInoqK3lrprjga7mpJzoqLxcbiAgICBzd2l0Y2ggKGNvbmZpZy5wYXR0ZXJuKSB7XG4gICAgICBjYXNlICdlYzItc3BvdCc6XG4gICAgICAgIGlmICghY29uZmlnLnNwb3RDb25maWcpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaCgnRUMyIFNwb3Tjg5Hjgr/jg7zjg7Pjgavjga9zcG90Q29uZmln44GM5b+F6KaB44Gn44GZJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goLi4udGhpcy52YWxpZGF0ZVNwb3RDb25maWcoY29uZmlnLnNwb3RDb25maWcpKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2F3cy1iYXRjaCc6XG4gICAgICAgIGlmICghY29uZmlnLmJhdGNoQ29uZmlnKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goJ0FXUyBCYXRjaOODkeOCv+ODvOODs+OBq+OBr2JhdGNoQ29uZmln44GM5b+F6KaB44Gn44GZJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goLi4udGhpcy52YWxpZGF0ZUJhdGNoQ29uZmlnKGNvbmZpZy5iYXRjaENvbmZpZykpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZWNzLWVjMic6XG4gICAgICAgIGlmICghY29uZmlnLmVjc0NvbmZpZykge1xuICAgICAgICAgIGVycm9ycy5wdXNoKCdFQ1Mgb24gRUMy44OR44K/44O844Oz44Gr44GvZWNzQ29uZmln44GM5b+F6KaB44Gn44GZJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goLi4udGhpcy52YWxpZGF0ZUVjc0NvbmZpZyhjb25maWcuZWNzQ29uZmlnKSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBlcnJvcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBjcm9u5byP44Gu5aal5b2T5oCn44KS5qSc6Ki8XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBpc1ZhbGlkQ3JvbkV4cHJlc3Npb24oY3Jvbjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgLy8g5Z+65pys55qE44GqY3JvbuW8j+OBruaknOiovO+8iDXjg5XjgqPjg7zjg6vjg4nlvaLlvI/vvIlcbiAgICBjb25zdCBjcm9uUmVnZXggPSAvXihcXCp8KFswLTVdP1xcZCkpIChcXCp8KFswMV0/XFxkfDJbMC0zXSkpIChcXCp8KFswMTJdP1xcZHwzWzAxXSkpIChcXCp8KFswXT9cXGR8MVswLTJdKSkgKFxcKnwoWzAtNl0pKSQvO1xuICAgIHJldHVybiBjcm9uUmVnZXgudGVzdChjcm9uKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEZTeOODnuOCpuODs+ODiOioreWumuOBruaknOiovFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgdmFsaWRhdGVGc3hNb3VudENvbmZpZyhjb25maWc6IEZTeE1vdW50Q29uZmlnKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICBpZiAoIWNvbmZpZy5maWxlU3lzdGVtSWQpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdGU3gg44OV44Kh44Kk44Or44K344K544OG44OgSUTjgYzlv4XopoHjgafjgZknKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCFjb25maWcuc3ZtSWQpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdTVk0gSUTjgYzlv4XopoHjgafjgZknKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCFjb25maWcudm9sdW1lcykge1xuICAgICAgZXJyb3JzLnB1c2goJ+ODnOODquODpeODvOODoOioreWumuOBjOW/heimgeOBp+OBmScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWNvbmZpZy52b2x1bWVzLmRvY3VtZW50cykge1xuICAgICAgICBlcnJvcnMucHVzaCgn44OJ44Kt44Ol44Oh44Oz44OI44Oc44Oq44Ol44O844Og6Kit5a6a44GM5b+F6KaB44Gn44GZJyk7XG4gICAgICB9XG4gICAgICBpZiAoIWNvbmZpZy52b2x1bWVzLmVtYmVkZGluZ3MpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goJ+Wfi+OCgei+vOOBv+ODnOODquODpeODvOODoOioreWumuOBjOW/heimgeOBp+OBmScpO1xuICAgICAgfVxuICAgICAgaWYgKCFjb25maWcudm9sdW1lcy5pbmRleCkge1xuICAgICAgICBlcnJvcnMucHVzaCgn44Kk44Oz44OH44OD44Kv44K544Oc44Oq44Ol44O844Og6Kit5a6a44GM5b+F6KaB44Gn44GZJyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBlcnJvcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDlh6bnkIbliLbpmZDoqK3lrprjga7mpJzoqLxcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIHZhbGlkYXRlUHJvY2Vzc2luZ0xpbWl0cyhjb25maWc6IFByb2Nlc3NpbmdMaW1pdHMpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGlmIChjb25maWcubWF4RmlsZXMgPD0gMCkge1xuICAgICAgZXJyb3JzLnB1c2goJ+acgOWkp+ODleOCoeOCpOODq+aVsOOBrzHku6XkuIrjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGNvbmZpZy5tYXhGb2xkZXJzIDw9IDApIHtcbiAgICAgIGVycm9ycy5wdXNoKCfmnIDlpKfjg5Xjgqnjg6vjg4Djg7zmlbDjga8x5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIGlmIChjb25maWcubWF4RGF0YVNpemVHQiA8PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaCgn5pyA5aSn44OH44O844K/44K144Kk44K644GvMUdC5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIGlmIChjb25maWcuYmF0Y2hTaXplIDw9IDApIHtcbiAgICAgIGVycm9ycy5wdXNoKCfjg5Djg4Pjg4HjgrXjgqTjgrrjga8x5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIGlmIChjb25maWcubWF4UGFyYWxsZWxKb2JzIDw9IDApIHtcbiAgICAgIGVycm9ycy5wdXNoKCfkuKbliJflh6bnkIbmlbDjga8x5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBlcnJvcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTcG906Kit5a6a44Gu5qSc6Ki8XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyB2YWxpZGF0ZVNwb3RDb25maWcoY29uZmlnOiBTcG90SW5zdGFuY2VDb25maWcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGlmICghY29uZmlnLmluc3RhbmNlVHlwZXMgfHwgY29uZmlnLmluc3RhbmNlVHlwZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaCgn44Kk44Oz44K544K/44Oz44K544K/44Kk44OX44Gu5oyH5a6a44GM5b+F6KaB44Gn44GZJyk7XG4gICAgfVxuICAgIFxuICAgIGlmICghY29uZmlnLmF2YWlsYWJpbGl0eVpvbmVzIHx8IGNvbmZpZy5hdmFpbGFiaWxpdHlab25lcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGVycm9ycy5wdXNoKCfjgqLjg5njgqTjg6njg5Pjg6rjg4bjgqPjgr7jg7zjg7Pjga7mjIflrprjgYzlv4XopoHjgafjgZknKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGNvbmZpZy5tYXhQcmljZSAmJiBwYXJzZUZsb2F0KGNvbmZpZy5tYXhQcmljZSkgPD0gMCkge1xuICAgICAgZXJyb3JzLnB1c2goJ+acgOWkp+S+oeagvOOBrzDjgojjgorlpKfjgY3jgYTlgKTjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGVycm9ycztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJhdGNo6Kit5a6a44Gu5qSc6Ki8XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyB2YWxpZGF0ZUJhdGNoQ29uZmlnKGNvbmZpZzogQmF0Y2hDb25maWcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGlmIChjb25maWcubWF4dkNwdXMgPD0gMCkge1xuICAgICAgZXJyb3JzLnB1c2goJ+acgOWkp3ZDUFXmlbDjga8x5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIGlmIChjb25maWcubWludkNwdXMgJiYgY29uZmlnLm1pbnZDcHVzIDwgMCkge1xuICAgICAgZXJyb3JzLnB1c2goJ+acgOWwj3ZDUFXmlbDjga8w5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIGlmIChjb25maWcucmV0cnlBdHRlbXB0cyA8IDApIHtcbiAgICAgIGVycm9ycy5wdXNoKCfjg6rjg4jjg6njgqTlm57mlbDjga8w5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBlcnJvcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFQ1PoqK3lrprjga7mpJzoqLxcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIHZhbGlkYXRlRWNzQ29uZmlnKGNvbmZpZzogRWNzQ29uZmlnKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICBpZiAoY29uZmlnLmRlc2lyZWRDb3VudCA8PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaCgn5biM5pyb44K/44K544Kv5pWw44GvMeS7peS4iuOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmScpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoY29uZmlnLmNwdSA8PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaCgnQ1BV6Kit5a6a44GvMeS7peS4iuOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmScpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoY29uZmlnLm1lbW9yeSA8PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaCgn44Oh44Oi44Oq6Kit5a6a44GvMeS7peS4iuOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmScpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZXJyb3JzO1xuICB9XG59XG5cbi8qKlxuICog44OH44OV44Kp44Or44OI6Kit5a6a5YCkXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUc6IFBhcnRpYWw8RXh0ZW5kZWRFbWJlZGRpbmdDb25maWc+ID0ge1xuICBwYXR0ZXJuOiAnZWMyLW9uZGVtYW5kJyxcbiAgc2NoZWR1bGU6ICcwIDIgKiAqIConLCAvLyDmr47ml6XljYjliY0y5pmCXG4gIHByb2Nlc3NpbmdMaW1pdHM6IHtcbiAgICBtYXhGaWxlczogMTAwMDAsXG4gICAgbWF4Rm9sZGVyczogMTAwMCxcbiAgICBtYXhEYXRhU2l6ZUdCOiAxMDAsXG4gICAgYmF0Y2hTaXplOiAxMDAwLFxuICAgIG1heFBhcmFsbGVsSm9iczogMTAsXG4gICAgbWVtb3J5TGltaXRNQjogODE5MixcbiAgICBkaXNrTGltaXRHQjogNTBcbiAgfSxcbiAgc3FsaXRlQ29uZmlnOiB7XG4gICAgcmV0cnlDb25maWc6IHtcbiAgICAgIG1heFJldHJpZXM6IDMsXG4gICAgICBiYWNrb2ZmTXM6IDEwMDAsXG4gICAgICBleHBvbmVudGlhbEJhY2tvZmY6IHRydWVcbiAgICB9LFxuICAgIHRyYW5zYWN0aW9uQ29uZmlnOiB7XG4gICAgICBiYXRjaFNpemU6IDEwMCxcbiAgICAgIHRpbWVvdXRNczogMzAwMDBcbiAgICB9LFxuICAgIG1vbml0b3JpbmdDb25maWc6IHtcbiAgICAgIGVuYWJsZU1ldHJpY3M6IHRydWUsXG4gICAgICBlbmFibGVEZXRhaWxlZExvZ3M6IHRydWUsXG4gICAgICBtZXRyaWNzTmFtZXNwYWNlOiAnRlN4T05UQVAvRW1iZWRkaW5nU2VydmVyJ1xuICAgIH1cbiAgfSxcbiAgbW9uaXRvcmluZ0NvbmZpZzoge1xuICAgIGNsb3VkV2F0Y2g6IHtcbiAgICAgIG5hbWVzcGFjZTogJ0ZTeE9OVEFQL0VtYmVkZGluZ1NlcnZlcicsXG4gICAgICBtZXRyaWNzOiBbJ0pvYkR1cmF0aW9uJywgJ0ZpbGVzUHJvY2Vzc2VkJywgJ0Vycm9yUmF0ZScsICdDb3N0UGVySm9iJ10sXG4gICAgICByZXRlbnRpb25EYXlzOiAzMFxuICAgIH0sXG4gICAgYWxlcnRzOiB7XG4gICAgICBqb2JGYWlsdXJlVGhyZXNob2xkOiAzLFxuICAgICAgZXhlY3V0aW9uVGltZVRocmVzaG9sZE1pbnV0ZXM6IDEyMCxcbiAgICAgIGVycm9yUmF0ZVRocmVzaG9sZDogMC4wNVxuICAgIH0sXG4gICAgZGFzaGJvYXJkOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgbmFtZTogJ0VtYmVkZGluZ1NlcnZlckRhc2hib2FyZCdcbiAgICB9XG4gIH0sXG4gIGNvc3RBbmFseXNpc0NvbmZpZzoge1xuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgcmVwb3J0RnJlcXVlbmN5OiAnTU9OVEhMWScsXG4gICAgYmFzZWxpbmVDb3N0UGF0dGVybjogJ2VjMi1vbmRlbWFuZCdcbiAgfVxufTtcblxuLyoqXG4gKiDlnovjgqzjg7zjg4nplqLmlbDnvqRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRXh0ZW5kZWRFbWJlZGRpbmdDb25maWcob2JqOiBhbnkpOiBvYmogaXMgRXh0ZW5kZWRFbWJlZGRpbmdDb25maWcge1xuICByZXR1cm4gb2JqICYmIFxuICAgICAgICAgdHlwZW9mIG9iai5wYXR0ZXJuID09PSAnc3RyaW5nJyAmJiBcbiAgICAgICAgIHR5cGVvZiBvYmouc2NoZWR1bGUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICB0eXBlb2Ygb2JqLmRvY2tlckltYWdlID09PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1Nwb3RDb25maWcoY29uZmlnOiBFeHRlbmRlZEVtYmVkZGluZ0NvbmZpZyk6IGNvbmZpZyBpcyBFeHRlbmRlZEVtYmVkZGluZ0NvbmZpZyAmIHsgc3BvdENvbmZpZzogU3BvdEluc3RhbmNlQ29uZmlnIH0ge1xuICByZXR1cm4gY29uZmlnLnBhdHRlcm4gPT09ICdlYzItc3BvdCcgJiYgY29uZmlnLnNwb3RDb25maWcgIT09IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0JhdGNoQ29uZmlnKGNvbmZpZzogRXh0ZW5kZWRFbWJlZGRpbmdDb25maWcpOiBjb25maWcgaXMgRXh0ZW5kZWRFbWJlZGRpbmdDb25maWcgJiB7IGJhdGNoQ29uZmlnOiBCYXRjaENvbmZpZyB9IHtcbiAgcmV0dXJuIGNvbmZpZy5wYXR0ZXJuID09PSAnYXdzLWJhdGNoJyAmJiBjb25maWcuYmF0Y2hDb25maWcgIT09IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0Vjc0NvbmZpZyhjb25maWc6IEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnKTogY29uZmlnIGlzIEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnICYgeyBlY3NDb25maWc6IEVjc0NvbmZpZyB9IHtcbiAgcmV0dXJuIGNvbmZpZy5wYXR0ZXJuID09PSAnZWNzLWVjMicgJiYgY29uZmlnLmVjc0NvbmZpZyAhPT0gdW5kZWZpbmVkO1xufVxuXG4vLyA9PT0g55Kw5aKD5aSJ5pWw44OR44O844K144O844Go44Kz44Oz44OV44Kj44Kw44Oe44ON44O844K444Oj44O8ID09PVxuLyoqXG4gKiBGU3ggZm9yIE5ldEFwcCBPTlRBUCBFbWJlZGRpbmcgU2VydmVyIEFyY2hpdGVjdHVyZSBVcGdyYWRlXG4gKiDnkrDlooPlpInmlbDjg5Hjg7zjgrXjg7zjgajjgrPjg7Pjg5XjgqPjgrDjg57jg43jg7zjgrjjg6Pjg7zlrp/oo4VcbiAqL1xuXG5pbXBvcnQgeyBBcHAsIFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgXG4gIEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnLCBcbiAgRW1iZWRkaW5nQXJjaGl0ZWN0dXJlUGF0dGVybixcbiAgU3BvdEluc3RhbmNlQ29uZmlnLFxuICBCYXRjaENvbmZpZyxcbiAgRWNzQ29uZmlnLFxuICBGU3hNb3VudENvbmZpZyxcbiAgUHJvY2Vzc2luZ0xpbWl0cyxcbiAgU3FsaXRlVXBzZXJ0Q29uZmlnLFxuICBNb25pdG9yaW5nQ29uZmlnLFxuICBDb3N0QW5hbHlzaXNDb25maWcsXG4gIE1pZ3JhdGlvbkNvbmZpZyxcbiAgREVGQVVMVF9FWFRFTkRFRF9FTUJFRERJTkdfQ09ORklHLFxuICBFbWJlZGRpbmdDb25maWdWYWxpZGF0b3Jcbn0gZnJvbSAnLi90eXBlcy90eXBlJztcblxuLyoqXG4gKiBDREsgQ29udGV4dOWkieaVsOOBruOCreODvOWumuaVsFxuICovXG5leHBvcnQgY29uc3QgQ0RLX0NPTlRFWFRfS0VZUyA9IHtcbiAgLy8g44Ki44O844Kt44OG44Kv44OB44Oj44OR44K/44O844Oz6YG45oqeXG4gIEVNQkVERElOR19QQVRURVJOOiAnZW1iZWRkaW5nUGF0dGVybicsXG4gIFxuICAvLyDlhbHpgJroqK3lrppcbiAgRU1CRURESU5HX1NDSEVEVUxFOiAnZW1iZWRkaW5nU2NoZWR1bGUnLFxuICBFTUJFRERJTkdfRE9DS0VSX0lNQUdFOiAnZW1iZWRkaW5nRG9ja2VySW1hZ2UnLFxuICBcbiAgLy8gRlN4IE9OVEFQ6Kit5a6aXG4gIEZTWF9GSUxFX1NZU1RFTV9JRDogJ2ZzeEZpbGVTeXN0ZW1JZCcsXG4gIEZTWF9TVk1fSUQ6ICdmc3hTdm1JZCcsXG4gIEZTWF9ET0NVTUVOVFNfUEFUSDogJ2ZzeERvY3VtZW50c1BhdGgnLFxuICBGU1hfRU1CRURESU5HU19QQVRIOiAnZnN4RW1iZWRkaW5nc1BhdGgnLFxuICBGU1hfSU5ERVhfUEFUSDogJ2ZzeEluZGV4UGF0aCcsXG4gIFxuICAvLyDlh6bnkIbliLbpmZDoqK3lrppcbiAgTUFYX0ZJTEVTOiAnbWF4RmlsZXMnLFxuICBNQVhfRk9MREVSUzogJ21heEZvbGRlcnMnLFxuICBNQVhfREFUQV9TSVpFX0dCOiAnbWF4RGF0YVNpemVHQicsXG4gIEJBVENIX1NJWkU6ICdiYXRjaFNpemUnLFxuICBNQVhfUEFSQUxMRUxfSk9CUzogJ21heFBhcmFsbGVsSm9icycsXG4gIFxuICAvLyBTcG906Kit5a6aXG4gIFNQT1RfTUFYX1BSSUNFOiAnc3BvdE1heFByaWNlJyxcbiAgU1BPVF9JTlNUQU5DRV9UWVBFUzogJ3Nwb3RJbnN0YW5jZVR5cGVzJyxcbiAgU1BPVF9BVkFJTEFCSUxJVFlfWk9ORVM6ICdzcG90QXZhaWxhYmlsaXR5Wm9uZXMnLFxuICBTUE9UX01BWF9SRVRSSUVTOiAnc3BvdE1heFJldHJpZXMnLFxuICBcbiAgLy8gQmF0Y2joqK3lrppcbiAgQkFUQ0hfTUFYX1ZDUFVTOiAnYmF0Y2hNYXh2Q3B1cycsXG4gIEJBVENIX01JTl9WQ1BVUzogJ2JhdGNoTWludkNwdXMnLFxuICBCQVRDSF9SRVRSWV9BVFRFTVBUUzogJ2JhdGNoUmV0cnlBdHRlbXB0cycsXG4gIEJBVENIX0pPQl9USU1FT1VUOiAnYmF0Y2hKb2JUaW1lb3V0JyxcbiAgQkFUQ0hfVVNFX1NQT1Q6ICdiYXRjaFVzZVNwb3QnLFxuICBcbiAgLy8gRUNT6Kit5a6aXG4gIEVDU19ERVNJUkVEX0NPVU5UOiAnZWNzRGVzaXJlZENvdW50JyxcbiAgRUNTX0NQVTogJ2Vjc0NwdScsXG4gIEVDU19NRU1PUlk6ICdlY3NNZW1vcnknLFxuICBFQ1NfTUFYX0NBUEFDSVRZOiAnZWNzTWF4Q2FwYWNpdHknLFxuICBFQ1NfTUlOX0NBUEFDSVRZOiAnZWNzTWluQ2FwYWNpdHknLFxuICBcbiAgLy8g55uj6KaW6Kit5a6aXG4gIE1PTklUT1JJTkdfTkFNRVNQQUNFOiAnbW9uaXRvcmluZ05hbWVzcGFjZScsXG4gIE1PTklUT1JJTkdfUkVURU5USU9OX0RBWVM6ICdtb25pdG9yaW5nUmV0ZW50aW9uRGF5cycsXG4gIEFMRVJUX0pPQl9GQUlMVVJFX1RIUkVTSE9MRDogJ2FsZXJ0Sm9iRmFpbHVyZVRocmVzaG9sZCcsXG4gIEFMRVJUX0VYRUNVVElPTl9USU1FX1RIUkVTSE9MRDogJ2FsZXJ0RXhlY3V0aW9uVGltZVRocmVzaG9sZCcsXG4gIEFMRVJUX0VSUk9SX1JBVEVfVEhSRVNIT0xEOiAnYWxlcnRFcnJvclJhdGVUaHJlc2hvbGQnLFxuICBcbiAgLy8g44Kz44K544OI5YiG5p6Q6Kit5a6aXG4gIENPU1RfQU5BTFlTSVNfRU5BQkxFRDogJ2Nvc3RBbmFseXNpc0VuYWJsZWQnLFxuICBDT1NUX1JFUE9SVF9GUkVRVUVOQ1k6ICdjb3N0UmVwb3J0RnJlcXVlbmN5JyxcbiAgQ09TVF9CQVNFTElORV9QQVRURVJOOiAnY29zdEJhc2VsaW5lUGF0dGVybicsXG4gIFxuICAvLyDnp7vooYzoqK3lrppcbiAgTUlHUkFUSU9OX1BBUkFMTEVMX1JVTl9EQVlTOiAnbWlncmF0aW9uUGFyYWxsZWxSdW5EYXlzJyxcbiAgTUlHUkFUSU9OX0NBTkFSWV9FTkFCTEVEOiAnbWlncmF0aW9uQ2FuYXJ5RW5hYmxlZCcsXG4gIE1JR1JBVElPTl9UUkFGRklDX1NQTElUOiAnbWlncmF0aW9uVHJhZmZpY1NwbGl0JyxcbiAgXG4gIC8vIOaXouWtmOioreWumuOBqOOBruS6kuaPm+aAp1xuICBDSUZTREFUQVZPTF9OQU1FOiAnY2lmc2RhdGFWb2xOYW1lJyxcbiAgUkFHREJfVk9MX1BBVEg6ICdyYWdkYlZvbFBhdGgnLFxuICBFTUJFRERJTkdfTU9ERUw6ICdlbWJlZGRpbmdNb2RlbCdcbn0gYXMgY29uc3Q7XG5cbi8qKlxuICog55Kw5aKD5aSJ5pWw44OR44O844K144O844Kv44Op44K5XG4gKiBDREsgY29udGV4dOWkieaVsOOBi+OCieioreWumuOCkuiqreOBv+WPluOCiuOAgeaknOiovOOCkuihjOOBhlxuICovXG5leHBvcnQgY2xhc3MgRW1iZWRkaW5nQ29uZmlnUGFyc2VyIHtcbiAgcHJpdmF0ZSBhcHA6IEFwcDtcbiAgcHJpdmF0ZSBzdGFjazogU3RhY2s7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHN0YWNrOiBTdGFjaykge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuc3RhY2sgPSBzdGFjaztcbiAgfVxuXG4gIC8qKlxuICAgKiBDREsgY29udGV4dOWkieaVsOOBi+OCieaLoeW8tUVtYmVkZGluZ+ioreWumuOCkuino+aekFxuICAgKiBAcmV0dXJucyDop6PmnpDjgZXjgozjgZ/oqK3lrprjgqrjg5bjgrjjgqfjgq/jg4hcbiAgICovXG4gIHBhcnNlRW1iZWRkaW5nQ29uZmlnKCk6IEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnIHtcbiAgICBjb25zb2xlLmxvZygn8J+UpyBFbWJlZGRpbmfoqK3lrprjgpLop6PmnpDkuK0uLi4nKTtcblxuICAgIC8vIOWfuuacrOioreWumuOBruino+aekFxuICAgIGNvbnN0IHBhdHRlcm4gPSB0aGlzLmdldENvbnRleHRWYWx1ZTxFbWJlZGRpbmdBcmNoaXRlY3R1cmVQYXR0ZXJuPihcbiAgICAgIENES19DT05URVhUX0tFWVMuRU1CRURESU5HX1BBVFRFUk4sXG4gICAgICAnZWMyLW9uZGVtYW5kJ1xuICAgICk7XG5cbiAgICBjb25zdCBzY2hlZHVsZSA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPHN0cmluZz4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkVNQkVERElOR19TQ0hFRFVMRSxcbiAgICAgICcwIDIgKiAqIConXG4gICAgKTtcblxuICAgIGNvbnN0IGRvY2tlckltYWdlID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8c3RyaW5nPihcbiAgICAgIENES19DT05URVhUX0tFWVMuRU1CRURESU5HX0RPQ0tFUl9JTUFHRSxcbiAgICAgICdwdWJsaWMuZWNyLmF3cy9sYW1iZGEvcHl0aG9uOjMuMTEnXG4gICAgKTtcblxuICAgIC8vIEZTeCBPTlRBUOioreWumuOBruino+aekFxuICAgIGNvbnN0IGZzeE1vdW50Q29uZmlnID0gdGhpcy5wYXJzZUZzeE1vdW50Q29uZmlnKCk7XG5cbiAgICAvLyDlh6bnkIbliLbpmZDoqK3lrprjga7op6PmnpBcbiAgICBjb25zdCBwcm9jZXNzaW5nTGltaXRzID0gdGhpcy5wYXJzZVByb2Nlc3NpbmdMaW1pdHMoKTtcblxuICAgIC8vIFNRTGl0ZSBVUFNFUlToqK3lrprjga7op6PmnpBcbiAgICBjb25zdCBzcWxpdGVDb25maWcgPSB0aGlzLnBhcnNlU3FsaXRlVXBzZXJ0Q29uZmlnKCk7XG5cbiAgICAvLyDnm6PoppboqK3lrprjga7op6PmnpBcbiAgICBjb25zdCBtb25pdG9yaW5nQ29uZmlnID0gdGhpcy5wYXJzZU1vbml0b3JpbmdDb25maWcoKTtcblxuICAgIC8vIOOCs+OCueODiOWIhuaekOioreWumuOBruino+aekFxuICAgIGNvbnN0IGNvc3RBbmFseXNpc0NvbmZpZyA9IHRoaXMucGFyc2VDb3N0QW5hbHlzaXNDb25maWcoKTtcblxuICAgIC8vIOenu+ihjOioreWumuOBruino+aekFxuICAgIGNvbnN0IG1pZ3JhdGlvbkNvbmZpZyA9IHRoaXMucGFyc2VNaWdyYXRpb25Db25maWcoKTtcblxuICAgIC8vIOODkeOCv+ODvOODs+WbuuacieioreWumuOBruino+aekFxuICAgIGNvbnN0IHNwb3RDb25maWcgPSBwYXR0ZXJuID09PSAnZWMyLXNwb3QnID8gdGhpcy5wYXJzZVNwb3RDb25maWcoKSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBiYXRjaENvbmZpZyA9IHBhdHRlcm4gPT09ICdhd3MtYmF0Y2gnID8gdGhpcy5wYXJzZUJhdGNoQ29uZmlnKCkgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgZWNzQ29uZmlnID0gcGF0dGVybiA9PT0gJ2Vjcy1lYzInID8gdGhpcy5wYXJzZUVjc0NvbmZpZygpIDogdW5kZWZpbmVkO1xuXG4gICAgLy8g5pei5a2Y6Kit5a6a44Go44Gu5LqS5o+b5oCnXG4gICAgY29uc3QgY2lmc2RhdGFWb2xOYW1lID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8c3RyaW5nPihcbiAgICAgIENES19DT05URVhUX0tFWVMuQ0lGU0RBVEFWT0xfTkFNRSxcbiAgICAgICdjaWZzZGF0YSdcbiAgICApO1xuXG4gICAgY29uc3QgcmFnZGJWb2xQYXRoID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8c3RyaW5nPihcbiAgICAgIENES19DT05URVhUX0tFWVMuUkFHREJfVk9MX1BBVEgsXG4gICAgICAnL3JhZ2RiJ1xuICAgICk7XG5cbiAgICBjb25zdCBtb2RlbCA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPHN0cmluZz4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkVNQkVERElOR19NT0RFTCxcbiAgICAgICdhbWF6b24udGl0YW4tZW1iZWQtdGV4dC12MSdcbiAgICApO1xuXG4gICAgLy8g6Kit5a6a44Kq44OW44K444Kn44Kv44OI44Gu5qeL56+JXG4gICAgY29uc3QgY29uZmlnOiBFeHRlbmRlZEVtYmVkZGluZ0NvbmZpZyA9IHtcbiAgICAgIHBhdHRlcm4sXG4gICAgICBzY2hlZHVsZSxcbiAgICAgIGRvY2tlckltYWdlLFxuICAgICAgZnN4TW91bnRDb25maWcsXG4gICAgICBwcm9jZXNzaW5nTGltaXRzLFxuICAgICAgc3FsaXRlQ29uZmlnLFxuICAgICAgbW9uaXRvcmluZ0NvbmZpZyxcbiAgICAgIGNvc3RBbmFseXNpc0NvbmZpZyxcbiAgICAgIG1pZ3JhdGlvbkNvbmZpZyxcbiAgICAgIHNwb3RDb25maWcsXG4gICAgICBiYXRjaENvbmZpZyxcbiAgICAgIGVjc0NvbmZpZyxcbiAgICAgIGNpZnNkYXRhVm9sTmFtZSxcbiAgICAgIHJhZ2RiVm9sUGF0aCxcbiAgICAgIGJhdGNoU2l6ZTogcHJvY2Vzc2luZ0xpbWl0cy5iYXRjaFNpemUsXG4gICAgICBjb25jdXJyZW5jeTogcHJvY2Vzc2luZ0xpbWl0cy5tYXhQYXJhbGxlbEpvYnMsXG4gICAgICBtb2RlbFxuICAgIH07XG5cbiAgICAvLyDoqK3lrprjga7mpJzoqLxcbiAgICB0aGlzLnZhbGlkYXRlQ29uZmlnKGNvbmZpZyk7XG5cbiAgICBjb25zb2xlLmxvZyhg4pyFIEVtYmVkZGluZ+ioreWumuino+aekOWujOS6hjog44OR44K/44O844OzPSR7cGF0dGVybn1gKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG5cbiAgLyoqXG4gICAqIEZTeCBPTlRBUCDjg57jgqbjg7Pjg4joqK3lrprjga7op6PmnpBcbiAgICovXG4gIHByaXZhdGUgcGFyc2VGc3hNb3VudENvbmZpZygpOiBGU3hNb3VudENvbmZpZyB7XG4gICAgY29uc3QgZmlsZVN5c3RlbUlkID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8c3RyaW5nPihcbiAgICAgIENES19DT05URVhUX0tFWVMuRlNYX0ZJTEVfU1lTVEVNX0lELFxuICAgICAgJydcbiAgICApO1xuXG4gICAgY29uc3Qgc3ZtSWQgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxzdHJpbmc+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5GU1hfU1ZNX0lELFxuICAgICAgJydcbiAgICApO1xuXG4gICAgY29uc3QgZG9jdW1lbnRzUGF0aCA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPHN0cmluZz4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkZTWF9ET0NVTUVOVFNfUEFUSCxcbiAgICAgICcvZG9jdW1lbnRzJ1xuICAgICk7XG5cbiAgICBjb25zdCBlbWJlZGRpbmdzUGF0aCA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPHN0cmluZz4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkZTWF9FTUJFRERJTkdTX1BBVEgsXG4gICAgICAnL2VtYmVkZGluZ3MnXG4gICAgKTtcblxuICAgIGNvbnN0IGluZGV4UGF0aCA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPHN0cmluZz4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkZTWF9JTkRFWF9QQVRILFxuICAgICAgJy9pbmRleCdcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbGVTeXN0ZW1JZCxcbiAgICAgIHN2bUlkLFxuICAgICAgdm9sdW1lczoge1xuICAgICAgICBkb2N1bWVudHM6IHtcbiAgICAgICAgICBwYXRoOiBkb2N1bWVudHNQYXRoLFxuICAgICAgICAgIHByb3RvY29sOiAnU01CJyxcbiAgICAgICAgICBtb3VudFBvaW50OiAnL21udC9kb2N1bWVudHMnXG4gICAgICAgIH0sXG4gICAgICAgIGVtYmVkZGluZ3M6IHtcbiAgICAgICAgICBwYXRoOiBlbWJlZGRpbmdzUGF0aCxcbiAgICAgICAgICBwcm90b2NvbDogJ05GUycsXG4gICAgICAgICAgbW91bnRQb2ludDogJy9tbnQvZW1iZWRkaW5ncydcbiAgICAgICAgfSxcbiAgICAgICAgaW5kZXg6IHtcbiAgICAgICAgICBwYXRoOiBpbmRleFBhdGgsXG4gICAgICAgICAgcHJvdG9jb2w6ICdORlMnLFxuICAgICAgICAgIG1vdW50UG9pbnQ6ICcvbW50L2luZGV4J1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlh6bnkIbliLbpmZDoqK3lrprjga7op6PmnpBcbiAgICovXG4gIHByaXZhdGUgcGFyc2VQcm9jZXNzaW5nTGltaXRzKCk6IFByb2Nlc3NpbmdMaW1pdHMge1xuICAgIHJldHVybiB7XG4gICAgICBtYXhGaWxlczogdGhpcy5nZXRDb250ZXh0VmFsdWU8bnVtYmVyPihcbiAgICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5NQVhfRklMRVMsXG4gICAgICAgIERFRkFVTFRfRVhURU5ERURfRU1CRURESU5HX0NPTkZJRy5wcm9jZXNzaW5nTGltaXRzIS5tYXhGaWxlc1xuICAgICAgKSxcbiAgICAgIG1heEZvbGRlcnM6IHRoaXMuZ2V0Q29udGV4dFZhbHVlPG51bWJlcj4oXG4gICAgICAgIENES19DT05URVhUX0tFWVMuTUFYX0ZPTERFUlMsXG4gICAgICAgIERFRkFVTFRfRVhURU5ERURfRU1CRURESU5HX0NPTkZJRy5wcm9jZXNzaW5nTGltaXRzIS5tYXhGb2xkZXJzXG4gICAgICApLFxuICAgICAgbWF4RGF0YVNpemVHQjogdGhpcy5nZXRDb250ZXh0VmFsdWU8bnVtYmVyPihcbiAgICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5NQVhfREFUQV9TSVpFX0dCLFxuICAgICAgICBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUcucHJvY2Vzc2luZ0xpbWl0cyEubWF4RGF0YVNpemVHQlxuICAgICAgKSxcbiAgICAgIGJhdGNoU2l6ZTogdGhpcy5nZXRDb250ZXh0VmFsdWU8bnVtYmVyPihcbiAgICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5CQVRDSF9TSVpFLFxuICAgICAgICBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUcucHJvY2Vzc2luZ0xpbWl0cyEuYmF0Y2hTaXplXG4gICAgICApLFxuICAgICAgbWF4UGFyYWxsZWxKb2JzOiB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgICBDREtfQ09OVEVYVF9LRVlTLk1BWF9QQVJBTExFTF9KT0JTLFxuICAgICAgICBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUcucHJvY2Vzc2luZ0xpbWl0cyEubWF4UGFyYWxsZWxKb2JzXG4gICAgICApLFxuICAgICAgbWVtb3J5TGltaXRNQjogREVGQVVMVF9FWFRFTkRFRF9FTUJFRERJTkdfQ09ORklHLnByb2Nlc3NpbmdMaW1pdHMhLm1lbW9yeUxpbWl0TUIsXG4gICAgICBkaXNrTGltaXRHQjogREVGQVVMVF9FWFRFTkRFRF9FTUJFRERJTkdfQ09ORklHLnByb2Nlc3NpbmdMaW1pdHMhLmRpc2tMaW1pdEdCXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTUUxpdGUgVVBTRVJU6Kit5a6a44Gu6Kej5p6QXG4gICAqL1xuICBwcml2YXRlIHBhcnNlU3FsaXRlVXBzZXJ0Q29uZmlnKCk6IFNxbGl0ZVVwc2VydENvbmZpZyB7XG4gICAgcmV0dXJuIERFRkFVTFRfRVhURU5ERURfRU1CRURESU5HX0NPTkZJRy5zcWxpdGVDb25maWchO1xuICB9XG5cbiAgLyoqXG4gICAqIOebo+imluioreWumuOBruino+aekFxuICAgKi9cbiAgcHJpdmF0ZSBwYXJzZU1vbml0b3JpbmdDb25maWcoKTogTW9uaXRvcmluZ0NvbmZpZyB7XG4gICAgY29uc3QgbmFtZXNwYWNlID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8c3RyaW5nPihcbiAgICAgIENES19DT05URVhUX0tFWVMuTU9OSVRPUklOR19OQU1FU1BBQ0UsXG4gICAgICBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUcubW9uaXRvcmluZ0NvbmZpZyEuY2xvdWRXYXRjaC5uYW1lc3BhY2VcbiAgICApO1xuXG4gICAgY29uc3QgcmV0ZW50aW9uRGF5cyA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPG51bWJlcj4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLk1PTklUT1JJTkdfUkVURU5USU9OX0RBWVMsXG4gICAgICBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUcubW9uaXRvcmluZ0NvbmZpZyEuY2xvdWRXYXRjaC5yZXRlbnRpb25EYXlzIVxuICAgICk7XG5cbiAgICBjb25zdCBqb2JGYWlsdXJlVGhyZXNob2xkID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8bnVtYmVyPihcbiAgICAgIENES19DT05URVhUX0tFWVMuQUxFUlRfSk9CX0ZBSUxVUkVfVEhSRVNIT0xELFxuICAgICAgREVGQVVMVF9FWFRFTkRFRF9FTUJFRERJTkdfQ09ORklHLm1vbml0b3JpbmdDb25maWchLmFsZXJ0cy5qb2JGYWlsdXJlVGhyZXNob2xkXG4gICAgKTtcblxuICAgIGNvbnN0IGV4ZWN1dGlvblRpbWVUaHJlc2hvbGQgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5BTEVSVF9FWEVDVVRJT05fVElNRV9USFJFU0hPTEQsXG4gICAgICBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUcubW9uaXRvcmluZ0NvbmZpZyEuYWxlcnRzLmV4ZWN1dGlvblRpbWVUaHJlc2hvbGRNaW51dGVzXG4gICAgKTtcblxuICAgIGNvbnN0IGVycm9yUmF0ZVRocmVzaG9sZCA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPG51bWJlcj4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkFMRVJUX0VSUk9SX1JBVEVfVEhSRVNIT0xELFxuICAgICAgREVGQVVMVF9FWFRFTkRFRF9FTUJFRERJTkdfQ09ORklHLm1vbml0b3JpbmdDb25maWchLmFsZXJ0cy5lcnJvclJhdGVUaHJlc2hvbGRcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNsb3VkV2F0Y2g6IHtcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICBtZXRyaWNzOiBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUcubW9uaXRvcmluZ0NvbmZpZyEuY2xvdWRXYXRjaC5tZXRyaWNzLFxuICAgICAgICByZXRlbnRpb25EYXlzXG4gICAgICB9LFxuICAgICAgYWxlcnRzOiB7XG4gICAgICAgIGpvYkZhaWx1cmVUaHJlc2hvbGQsXG4gICAgICAgIGV4ZWN1dGlvblRpbWVUaHJlc2hvbGRNaW51dGVzOiBleGVjdXRpb25UaW1lVGhyZXNob2xkLFxuICAgICAgICBlcnJvclJhdGVUaHJlc2hvbGRcbiAgICAgIH0sXG4gICAgICBkYXNoYm9hcmQ6IERFRkFVTFRfRVhURU5ERURfRU1CRURESU5HX0NPTkZJRy5tb25pdG9yaW5nQ29uZmlnIS5kYXNoYm9hcmRcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOOCs+OCueODiOWIhuaekOioreWumuOBruino+aekFxuICAgKi9cbiAgcHJpdmF0ZSBwYXJzZUNvc3RBbmFseXNpc0NvbmZpZygpOiBDb3N0QW5hbHlzaXNDb25maWcgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGVuYWJsZWQgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxib29sZWFuPihcbiAgICAgIENES19DT05URVhUX0tFWVMuQ09TVF9BTkFMWVNJU19FTkFCTEVELFxuICAgICAgREVGQVVMVF9FWFRFTkRFRF9FTUJFRERJTkdfQ09ORklHLmNvc3RBbmFseXNpc0NvbmZpZyEuZW5hYmxlZFxuICAgICk7XG5cbiAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgcmVwb3J0RnJlcXVlbmN5ID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8J0RBSUxZJyB8ICdXRUVLTFknIHwgJ01PTlRITFknPihcbiAgICAgIENES19DT05URVhUX0tFWVMuQ09TVF9SRVBPUlRfRlJFUVVFTkNZLFxuICAgICAgREVGQVVMVF9FWFRFTkRFRF9FTUJFRERJTkdfQ09ORklHLmNvc3RBbmFseXNpc0NvbmZpZyEucmVwb3J0RnJlcXVlbmN5XG4gICAgKTtcblxuICAgIGNvbnN0IGJhc2VsaW5lUGF0dGVybiA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPEVtYmVkZGluZ0FyY2hpdGVjdHVyZVBhdHRlcm4+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5DT1NUX0JBU0VMSU5FX1BBVFRFUk4sXG4gICAgICBERUZBVUxUX0VYVEVOREVEX0VNQkVERElOR19DT05GSUcuY29zdEFuYWx5c2lzQ29uZmlnIS5iYXNlbGluZUNvc3RQYXR0ZXJuIVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZW5hYmxlZCxcbiAgICAgIHJlcG9ydEZyZXF1ZW5jeSxcbiAgICAgIGJhc2VsaW5lQ29zdFBhdHRlcm46IGJhc2VsaW5lUGF0dGVyblxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog56e76KGM6Kit5a6a44Gu6Kej5p6QXG4gICAqL1xuICBwcml2YXRlIHBhcnNlTWlncmF0aW9uQ29uZmlnKCk6IE1pZ3JhdGlvbkNvbmZpZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgcGFyYWxsZWxSdW5EYXlzID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8bnVtYmVyPihcbiAgICAgIENES19DT05URVhUX0tFWVMuTUlHUkFUSU9OX1BBUkFMTEVMX1JVTl9EQVlTLFxuICAgICAgN1xuICAgICk7XG5cbiAgICBjb25zdCBjYW5hcnlFbmFibGVkID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8Ym9vbGVhbj4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLk1JR1JBVElPTl9DQU5BUllfRU5BQkxFRCxcbiAgICAgIGZhbHNlXG4gICAgKTtcblxuICAgIGNvbnN0IHRyYWZmaWNTcGxpdFN0ciA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPHN0cmluZz4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLk1JR1JBVElPTl9UUkFGRklDX1NQTElULFxuICAgICAgJzUsMTUsNTAsMTAwJ1xuICAgICk7XG5cbiAgICBjb25zdCB0cmFmZmljU3BsaXRQZXJjZW50YWdlcyA9IHRyYWZmaWNTcGxpdFN0clxuICAgICAgLnNwbGl0KCcsJylcbiAgICAgIC5tYXAocyA9PiBwYXJzZUludChzLnRyaW0oKSwgMTApKVxuICAgICAgLmZpbHRlcihuID0+ICFpc05hTihuKSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcGFyYWxsZWxSdW5EYXlzLFxuICAgICAgY2FuYXJ5RGVwbG95bWVudDoge1xuICAgICAgICBlbmFibGVkOiBjYW5hcnlFbmFibGVkLFxuICAgICAgICB0cmFmZmljU3BsaXRQZXJjZW50YWdlcyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZE1pbnV0ZXM6IDMwLFxuICAgICAgICBhdXRvUm9sbGJhY2tFbmFibGVkOiB0cnVlXG4gICAgICB9LFxuICAgICAgdmFsaWRhdGlvbjoge1xuICAgICAgICBlbmFibGVSZXN1bHRDb21wYXJpc29uOiB0cnVlLFxuICAgICAgICBzYW1wbGVQZXJjZW50YWdlOiAxMCxcbiAgICAgICAgdG9sZXJhbmNlVGhyZXNob2xkOiAwLjA1XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTcG906Kit5a6a44Gu6Kej5p6QXG4gICAqL1xuICBwcml2YXRlIHBhcnNlU3BvdENvbmZpZygpOiBTcG90SW5zdGFuY2VDb25maWcge1xuICAgIGNvbnN0IG1heFByaWNlID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8c3RyaW5nPihcbiAgICAgIENES19DT05URVhUX0tFWVMuU1BPVF9NQVhfUFJJQ0UsXG4gICAgICAnMC4xMCdcbiAgICApO1xuXG4gICAgY29uc3QgaW5zdGFuY2VUeXBlc1N0ciA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPHN0cmluZz4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLlNQT1RfSU5TVEFOQ0VfVFlQRVMsXG4gICAgICAnbTUubGFyZ2UsbTUueGxhcmdlLG00LmxhcmdlLG00LnhsYXJnZSdcbiAgICApO1xuXG4gICAgY29uc3QgaW5zdGFuY2VUeXBlcyA9IGluc3RhbmNlVHlwZXNTdHJcbiAgICAgIC5zcGxpdCgnLCcpXG4gICAgICAubWFwKHMgPT4gcy50cmltKCkpXG4gICAgICAuZmlsdGVyKHMgPT4gcy5sZW5ndGggPiAwKTtcblxuICAgIGNvbnN0IGF2YWlsYWJpbGl0eVpvbmVzU3RyID0gdGhpcy5nZXRDb250ZXh0VmFsdWU8c3RyaW5nPihcbiAgICAgIENES19DT05URVhUX0tFWVMuU1BPVF9BVkFJTEFCSUxJVFlfWk9ORVMsXG4gICAgICAndXMtZWFzdC0xYSx1cy1lYXN0LTFiLHVzLWVhc3QtMWMnXG4gICAgKTtcblxuICAgIGNvbnN0IGF2YWlsYWJpbGl0eVpvbmVzID0gYXZhaWxhYmlsaXR5Wm9uZXNTdHJcbiAgICAgIC5zcGxpdCgnLCcpXG4gICAgICAubWFwKHMgPT4gcy50cmltKCkpXG4gICAgICAuZmlsdGVyKHMgPT4gcy5sZW5ndGggPiAwKTtcblxuICAgIGNvbnN0IG1heFJldHJpZXMgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5TUE9UX01BWF9SRVRSSUVTLFxuICAgICAgM1xuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWF4UHJpY2UsXG4gICAgICBpbnN0YW5jZVR5cGVzLFxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZXMsXG4gICAgICBtYXhSZXRyaWVzLFxuICAgICAgYXV0b1Rlcm1pbmF0ZTogdHJ1ZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQmF0Y2joqK3lrprjga7op6PmnpBcbiAgICovXG4gIHByaXZhdGUgcGFyc2VCYXRjaENvbmZpZygpOiBCYXRjaENvbmZpZyB7XG4gICAgY29uc3QgbWF4dkNwdXMgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5CQVRDSF9NQVhfVkNQVVMsXG4gICAgICAyNTZcbiAgICApO1xuXG4gICAgY29uc3QgbWludkNwdXMgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5CQVRDSF9NSU5fVkNQVVMsXG4gICAgICAwXG4gICAgKTtcblxuICAgIGNvbnN0IHJldHJ5QXR0ZW1wdHMgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5CQVRDSF9SRVRSWV9BVFRFTVBUUyxcbiAgICAgIDNcbiAgICApO1xuXG4gICAgY29uc3Qgam9iVGltZW91dFNlY29uZHMgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5CQVRDSF9KT0JfVElNRU9VVCxcbiAgICAgIDcyMDBcbiAgICApO1xuXG4gICAgY29uc3QgdXNlU3BvdEluc3RhbmNlcyA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPGJvb2xlYW4+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5CQVRDSF9VU0VfU1BPVCxcbiAgICAgIHRydWVcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1heHZDcHVzLFxuICAgICAgbWludkNwdXMsXG4gICAgICBkZXNpcmVkdkNwdXM6IDAsXG4gICAgICByZXRyeUF0dGVtcHRzLFxuICAgICAgam9iVGltZW91dFNlY29uZHMsXG4gICAgICBjb21wdXRlRW52aXJvbm1lbnRUeXBlOiAnTUFOQUdFRCcsXG4gICAgICBpbnN0YW5jZVR5cGVzOiBbJ29wdGltYWwnXSxcbiAgICAgIHVzZVNwb3RJbnN0YW5jZXNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEVDU+ioreWumuOBruino+aekFxuICAgKi9cbiAgcHJpdmF0ZSBwYXJzZUVjc0NvbmZpZygpOiBFY3NDb25maWcge1xuICAgIGNvbnN0IGRlc2lyZWRDb3VudCA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPG51bWJlcj4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkVDU19ERVNJUkVEX0NPVU5ULFxuICAgICAgMVxuICAgICk7XG5cbiAgICBjb25zdCBjcHUgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5FQ1NfQ1BVLFxuICAgICAgMjA0OFxuICAgICk7XG5cbiAgICBjb25zdCBtZW1vcnkgPSB0aGlzLmdldENvbnRleHRWYWx1ZTxudW1iZXI+KFxuICAgICAgQ0RLX0NPTlRFWFRfS0VZUy5FQ1NfTUVNT1JZLFxuICAgICAgNDA5NlxuICAgICk7XG5cbiAgICBjb25zdCBtYXhDYXBhY2l0eSA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPG51bWJlcj4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkVDU19NQVhfQ0FQQUNJVFksXG4gICAgICAxMFxuICAgICk7XG5cbiAgICBjb25zdCBtaW5DYXBhY2l0eSA9IHRoaXMuZ2V0Q29udGV4dFZhbHVlPG51bWJlcj4oXG4gICAgICBDREtfQ09OVEVYVF9LRVlTLkVDU19NSU5fQ0FQQUNJVFksXG4gICAgICAxXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBkZXNpcmVkQ291bnQsXG4gICAgICBjcHUsXG4gICAgICBtZW1vcnksXG4gICAgICBtYXhDYXBhY2l0eSxcbiAgICAgIG1pbkNhcGFjaXR5LFxuICAgICAgYXV0b1NjYWxpbmc6IHtcbiAgICAgICAgdGFyZ2V0Q3B1VXRpbGl6YXRpb246IDcwLFxuICAgICAgICB0YXJnZXRNZW1vcnlVdGlsaXphdGlvbjogODAsXG4gICAgICAgIHNjYWxlT3V0Q29vbGRvd246IDMwMCxcbiAgICAgICAgc2NhbGVJbkNvb2xkb3duOiAzMDBcbiAgICAgIH0sXG4gICAgICBwbGF0Zm9ybVZlcnNpb246ICdMQVRFU1QnXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDREsgY29udGV4dOWkieaVsOOBi+OCieWApOOCkuWPluW+l++8iOWei+WuieWFqO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBnZXRDb250ZXh0VmFsdWU8VD4oa2V5OiBzdHJpbmcsIGRlZmF1bHRWYWx1ZTogVCk6IFQge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5zdGFjay5ub2RlLnRyeUdldENvbnRleHQoa2V5KTtcbiAgICBcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgY29uc29sZS5sb2coYPCfk50gQ29udGV4dOWkieaVsCAnJHtrZXl9JyDjgYzmnKroqK3lrprjga7jgZ/jgoHjgIHjg4fjg5Xjgqnjg6vjg4jlgKTjgpLkvb/nlKg6ICR7ZGVmYXVsdFZhbHVlfWApO1xuICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG5cbiAgICAvLyDlnovlpInmj5vjga7oqabooYxcbiAgICB0cnkge1xuICAgICAgaWYgKHR5cGVvZiBkZWZhdWx0VmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGNvbnN0IG51bVZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHBhcnNlRmxvYXQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIGlmIChpc05hTihudW1WYWx1ZSkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oYOKaoO+4jyAgQ29udGV4dOWkieaVsCAnJHtrZXl9JyDjga7lgKQgJyR7dmFsdWV9JyDjgpLmlbDlgKTjgavlpInmj5vjgafjgY3jgb7jgZvjgpPjgILjg4fjg5Xjgqnjg6vjg4jlgKTjgpLkvb/nlKg6ICR7ZGVmYXVsdFZhbHVlfWApO1xuICAgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bVZhbHVlIGFzIFQ7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBjb25zdCBib29sVmFsdWUgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpID09PSAndHJ1ZScgfHwgdmFsdWUgPT09ICcxJztcbiAgICAgICAgICByZXR1cm4gYm9vbFZhbHVlIGFzIFQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEJvb2xlYW4odmFsdWUpIGFzIFQ7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKSBhcyBUO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsdWUgYXMgVDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIENvbnRleHTlpInmlbAgJyR7a2V5fScg44Gu5Z6L5aSJ5o+b44Gn44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOiAke2Vycm9yfS4g44OH44OV44Kp44Or44OI5YCk44KS5L2/55SoOiAke2RlZmF1bHRWYWx1ZX1gKTtcbiAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOioreWumuOBruaknOiovFxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUNvbmZpZyhjb25maWc6IEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coJ/CflI0gRW1iZWRkaW5n6Kit5a6a44KS5qSc6Ki85LitLi4uJyk7XG5cbiAgICBjb25zdCBlcnJvcnMgPSBFbWJlZGRpbmdDb25maWdWYWxpZGF0b3IudmFsaWRhdGVFeHRlbmRlZEVtYmVkZGluZ0NvbmZpZyhjb25maWcpO1xuXG4gICAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwgRW1iZWRkaW5n6Kit5a6a44Gu5qSc6Ki844Ko44Op44O8OicpO1xuICAgICAgZXJyb3JzLmZvckVhY2goKGVycm9yLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGAgICR7aW5kZXggKyAxfS4gJHtlcnJvcn1gKTtcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFbWJlZGRpbmfoqK3lrprjga7mpJzoqLzjgavlpLHmlZfjgZfjgb7jgZfjgZ86ICR7ZXJyb3JzLmxlbmd0aH3lgIvjga7jgqjjg6njg7zjgYzopovjgaTjgYvjgorjgb7jgZfjgZ9gKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIEVtYmVkZGluZ+ioreWumuOBruaknOiovOOBjOWujOS6huOBl+OBvuOBl+OBnycpO1xuICB9XG5cbiAgLyoqXG4gICAqIOioreWumuOBruips+e0sOaDheWgseOCkuWHuuWKm1xuICAgKi9cbiAgcHJpbnRDb25maWdTdW1tYXJ5KGNvbmZpZzogRXh0ZW5kZWRFbWJlZGRpbmdDb25maWcpOiB2b2lkIHtcbiAgICBjb25zb2xlLmxvZygnXFxuPT09IEVtYmVkZGluZyBTZXJ2ZXIgQXJjaGl0ZWN0dXJlIOioreWumuOCteODnuODquODvCA9PT0nKTtcbiAgICBjb25zb2xlLmxvZyhg8J+Pl++4jyAg44Ki44O844Kt44OG44Kv44OB44Oj44OR44K/44O844OzOiAke2NvbmZpZy5wYXR0ZXJufWApO1xuICAgIGNvbnNvbGUubG9nKGDij7Ag44K544Kx44K444Ol44O844OrOiAke2NvbmZpZy5zY2hlZHVsZX1gKTtcbiAgICBjb25zb2xlLmxvZyhg8J+QsyBEb2NrZXLjgqTjg6Hjg7zjgrg6ICR7Y29uZmlnLmRvY2tlckltYWdlfWApO1xuICAgIGNvbnNvbGUubG9nKGDwn5OBIEZTeCDjg5XjgqHjgqTjg6vjgrfjgrnjg4bjg6BJRDogJHtjb25maWcuZnN4TW91bnRDb25maWcuZmlsZVN5c3RlbUlkfWApO1xuICAgIGNvbnNvbGUubG9nKGDwn5OKIOacgOWkp+ODleOCoeOCpOODq+aVsDogJHtjb25maWcucHJvY2Vzc2luZ0xpbWl0cy5tYXhGaWxlcy50b0xvY2FsZVN0cmluZygpfWApO1xuICAgIGNvbnNvbGUubG9nKGDwn5SEIOODkOODg+ODgeOCteOCpOOCujogJHtjb25maWcucHJvY2Vzc2luZ0xpbWl0cy5iYXRjaFNpemUudG9Mb2NhbGVTdHJpbmcoKX1gKTtcbiAgICBjb25zb2xlLmxvZyhg4pqhIOS4puWIl+WHpueQhuaVsDogJHtjb25maWcucHJvY2Vzc2luZ0xpbWl0cy5tYXhQYXJhbGxlbEpvYnN9YCk7XG5cbiAgICBpZiAoY29uZmlnLnNwb3RDb25maWcpIHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5KwIFNwb3TmnIDlpKfkvqHmoLw6ICQke2NvbmZpZy5zcG90Q29uZmlnLm1heFByaWNlfS/mmYLplpNgKTtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5al77iPICBTcG9044Kk44Oz44K544K/44Oz44K544K/44Kk44OXOiAke2NvbmZpZy5zcG90Q29uZmlnLmluc3RhbmNlVHlwZXMuam9pbignLCAnKX1gKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLmJhdGNoQ29uZmlnKSB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+UoiBCYXRjaOacgOWkp3ZDUFU6ICR7Y29uZmlnLmJhdGNoQ29uZmlnLm1heHZDcHVzfWApO1xuICAgICAgY29uc29sZS5sb2coYPCflIEgQmF0Y2jjg6rjg4jjg6njgqTlm57mlbA6ICR7Y29uZmlnLmJhdGNoQ29uZmlnLnJldHJ5QXR0ZW1wdHN9YCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5lY3NDb25maWcpIHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OmIEVDU+W4jOacm+OCv+OCueOCr+aVsDogJHtjb25maWcuZWNzQ29uZmlnLmRlc2lyZWRDb3VudH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5K+IEVDUyBDUFUv44Oh44Oi44OqOiAke2NvbmZpZy5lY3NDb25maWcuY3B1fS8ke2NvbmZpZy5lY3NDb25maWcubWVtb3J5fWApO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGDwn5OIIOebo+imluODjeODvOODoOOCueODmuODvOOCuTogJHtjb25maWcubW9uaXRvcmluZ0NvbmZpZy5jbG91ZFdhdGNoLm5hbWVzcGFjZX1gKTtcbiAgICBcbiAgICBpZiAoY29uZmlnLmNvc3RBbmFseXNpc0NvbmZpZz8uZW5hYmxlZCkge1xuICAgICAgY29uc29sZS5sb2coYPCfkrkg44Kz44K544OI5YiG5p6QOiDmnInlirkgKCR7Y29uZmlnLmNvc3RBbmFseXNpc0NvbmZpZy5yZXBvcnRGcmVxdWVuY3l9KWApO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4nKTtcbiAgfVxufVxuXG4vKipcbiAqIOioreWumuODleOCoeOCr+ODiOODquODvOOCr+ODqeOCuVxuICog55Kw5aKD44Gr5b+c44GY44Gf6Kit5a6a44Gu55Sf5oiQ44KS6KGM44GGXG4gKi9cbmV4cG9ydCBjbGFzcyBFbWJlZGRpbmdDb25maWdGYWN0b3J5IHtcbiAgLyoqXG4gICAqIOmWi+eZuueSsOWig+eUqOOBruioreWumuOCkueUn+aIkFxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZURldmVsb3BtZW50Q29uZmlnKCk6IFBhcnRpYWw8RXh0ZW5kZWRFbWJlZGRpbmdDb25maWc+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGF0dGVybjogJ2VjMi1vbmRlbWFuZCcsXG4gICAgICBzY2hlZHVsZTogJzAgMyAqICogKicsIC8vIOavjuaXpeWNiOWJjTPmmYJcbiAgICAgIHByb2Nlc3NpbmdMaW1pdHM6IHtcbiAgICAgICAgbWF4RmlsZXM6IDEwMDAsXG4gICAgICAgIG1heEZvbGRlcnM6IDEwMCxcbiAgICAgICAgbWF4RGF0YVNpemVHQjogMTAsXG4gICAgICAgIGJhdGNoU2l6ZTogMTAwLFxuICAgICAgICBtYXhQYXJhbGxlbEpvYnM6IDIsXG4gICAgICAgIG1lbW9yeUxpbWl0TUI6IDIwNDgsXG4gICAgICAgIGRpc2tMaW1pdEdCOiAyMFxuICAgICAgfSxcbiAgICAgIG1vbml0b3JpbmdDb25maWc6IHtcbiAgICAgICAgY2xvdWRXYXRjaDoge1xuICAgICAgICAgIG5hbWVzcGFjZTogJ0ZTeE9OVEFQL0VtYmVkZGluZ1NlcnZlci9EZXYnLFxuICAgICAgICAgIG1ldHJpY3M6IFsnSm9iRHVyYXRpb24nLCAnRmlsZXNQcm9jZXNzZWQnLCAnRXJyb3JSYXRlJ10sXG4gICAgICAgICAgcmV0ZW50aW9uRGF5czogN1xuICAgICAgICB9LFxuICAgICAgICBhbGVydHM6IHtcbiAgICAgICAgICBqb2JGYWlsdXJlVGhyZXNob2xkOiA1LFxuICAgICAgICAgIGV4ZWN1dGlvblRpbWVUaHJlc2hvbGRNaW51dGVzOiA2MCxcbiAgICAgICAgICBlcnJvclJhdGVUaHJlc2hvbGQ6IDAuMVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDmnKznlarnkrDlooPnlKjjga7oqK3lrprjgpLnlJ/miJBcbiAgICovXG4gIHN0YXRpYyBjcmVhdGVQcm9kdWN0aW9uQ29uZmlnKCk6IFBhcnRpYWw8RXh0ZW5kZWRFbWJlZGRpbmdDb25maWc+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGF0dGVybjogJ2F3cy1iYXRjaCcsXG4gICAgICBzY2hlZHVsZTogJzAgMiAqICogKicsIC8vIOavjuaXpeWNiOWJjTLmmYJcbiAgICAgIHByb2Nlc3NpbmdMaW1pdHM6IHtcbiAgICAgICAgbWF4RmlsZXM6IDUwMDAwLFxuICAgICAgICBtYXhGb2xkZXJzOiA1MDAwLFxuICAgICAgICBtYXhEYXRhU2l6ZUdCOiA1MDAsXG4gICAgICAgIGJhdGNoU2l6ZTogMTAwMCxcbiAgICAgICAgbWF4UGFyYWxsZWxKb2JzOiAyMCxcbiAgICAgICAgbWVtb3J5TGltaXRNQjogMTYzODQsXG4gICAgICAgIGRpc2tMaW1pdEdCOiAyMDBcbiAgICAgIH0sXG4gICAgICBiYXRjaENvbmZpZzoge1xuICAgICAgICBtYXh2Q3B1czogMTAwMCxcbiAgICAgICAgbWludkNwdXM6IDAsXG4gICAgICAgIGRlc2lyZWR2Q3B1czogMCxcbiAgICAgICAgcmV0cnlBdHRlbXB0czogMyxcbiAgICAgICAgam9iVGltZW91dFNlY29uZHM6IDE0NDAwLCAvLyA05pmC6ZaTXG4gICAgICAgIGNvbXB1dGVFbnZpcm9ubWVudFR5cGU6ICdNQU5BR0VEJyxcbiAgICAgICAgaW5zdGFuY2VUeXBlczogWydvcHRpbWFsJ10sXG4gICAgICAgIHVzZVNwb3RJbnN0YW5jZXM6IHRydWVcbiAgICAgIH0sXG4gICAgICBtb25pdG9yaW5nQ29uZmlnOiB7XG4gICAgICAgIGNsb3VkV2F0Y2g6IHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdGU3hPTlRBUC9FbWJlZGRpbmdTZXJ2ZXIvUHJvZCcsXG4gICAgICAgICAgbWV0cmljczogWydKb2JEdXJhdGlvbicsICdGaWxlc1Byb2Nlc3NlZCcsICdFcnJvclJhdGUnLCAnQ29zdFBlckpvYicsICdUaHJvdWdocHV0TUJwcyddLFxuICAgICAgICAgIHJldGVudGlvbkRheXM6IDkwXG4gICAgICAgIH0sXG4gICAgICAgIGFsZXJ0czoge1xuICAgICAgICAgIGpvYkZhaWx1cmVUaHJlc2hvbGQ6IDIsXG4gICAgICAgICAgZXhlY3V0aW9uVGltZVRocmVzaG9sZE1pbnV0ZXM6IDI0MCxcbiAgICAgICAgICBlcnJvclJhdGVUaHJlc2hvbGQ6IDAuMDJcbiAgICAgICAgfSxcbiAgICAgICAgZGFzaGJvYXJkOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBuYW1lOiAnRW1iZWRkaW5nU2VydmVyUHJvZHVjdGlvbkRhc2hib2FyZCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNvc3RBbmFseXNpc0NvbmZpZzoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICByZXBvcnRGcmVxdWVuY3k6ICdXRUVLTFknLFxuICAgICAgICBiYXNlbGluZUNvc3RQYXR0ZXJuOiAnZWMyLW9uZGVtYW5kJyxcbiAgICAgICAgYnVkZ2V0QWxlcnRzOiB7XG4gICAgICAgICAgbW9udGhseUJ1ZGdldFVTRDogMTAwMCxcbiAgICAgICAgICBhbGVydFRocmVzaG9sZHM6IFs1MCwgODAsIDk1XVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jnkrDlooPnlKjjga7oqK3lrprjgpLnlJ/miJBcbiAgICovXG4gIHN0YXRpYyBjcmVhdGVUZXN0Q29uZmlnKCk6IFBhcnRpYWw8RXh0ZW5kZWRFbWJlZGRpbmdDb25maWc+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcGF0dGVybjogJ2VjMi1zcG90JyxcbiAgICAgIHNjaGVkdWxlOiAnMCA0ICogKiAqJywgLy8g5q+O5pel5Y2I5YmNNOaZglxuICAgICAgcHJvY2Vzc2luZ0xpbWl0czoge1xuICAgICAgICBtYXhGaWxlczogMTAwLFxuICAgICAgICBtYXhGb2xkZXJzOiAxMCxcbiAgICAgICAgbWF4RGF0YVNpemVHQjogMSxcbiAgICAgICAgYmF0Y2hTaXplOiAxMCxcbiAgICAgICAgbWF4UGFyYWxsZWxKb2JzOiAxLFxuICAgICAgICBtZW1vcnlMaW1pdE1COiAxMDI0LFxuICAgICAgICBkaXNrTGltaXRHQjogMTBcbiAgICAgIH0sXG4gICAgICBzcG90Q29uZmlnOiB7XG4gICAgICAgIG1heFByaWNlOiAnMC4wNScsXG4gICAgICAgIGluc3RhbmNlVHlwZXM6IFsndDMubWVkaXVtJywgJ3QzLmxhcmdlJ10sXG4gICAgICAgIGF2YWlsYWJpbGl0eVpvbmVzOiBbJ3VzLWVhc3QtMWEnLCAndXMtZWFzdC0xYiddLFxuICAgICAgICBtYXhSZXRyaWVzOiAyLFxuICAgICAgICBhdXRvVGVybWluYXRlOiB0cnVlXG4gICAgICB9LFxuICAgICAgbW9uaXRvcmluZ0NvbmZpZzoge1xuICAgICAgICBjbG91ZFdhdGNoOiB7XG4gICAgICAgICAgbmFtZXNwYWNlOiAnRlN4T05UQVAvRW1iZWRkaW5nU2VydmVyL1Rlc3QnLFxuICAgICAgICAgIG1ldHJpY3M6IFsnSm9iRHVyYXRpb24nLCAnRmlsZXNQcm9jZXNzZWQnXSxcbiAgICAgICAgICByZXRlbnRpb25EYXlzOiAzXG4gICAgICAgIH0sXG4gICAgICAgIGFsZXJ0czoge1xuICAgICAgICAgIGpvYkZhaWx1cmVUaHJlc2hvbGQ6IDEwLFxuICAgICAgICAgIGV4ZWN1dGlvblRpbWVUaHJlc2hvbGRNaW51dGVzOiAzMCxcbiAgICAgICAgICBlcnJvclJhdGVUaHJlc2hvbGQ6IDAuMlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIOioreWumuODpuODvOODhuOCo+ODquODhuOCo+mWouaVsOe+pFxuICovXG5leHBvcnQgY2xhc3MgRW1iZWRkaW5nQ29uZmlnVXRpbHMge1xuICAvKipcbiAgICog6Kit5a6a44KSSlNPTuW9ouW8j+OBp+WHuuWKm1xuICAgKi9cbiAgc3RhdGljIGV4cG9ydENvbmZpZ0FzSnNvbihjb25maWc6IEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnKTogc3RyaW5nIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDoqK3lrprjgpJZQU1M5b2i5byP44Gn5Ye65Yqb77yI57Ch5piT54mI77yJXG4gICAqL1xuICBzdGF0aWMgZXhwb3J0Q29uZmlnQXNZYW1sKGNvbmZpZzogRXh0ZW5kZWRFbWJlZGRpbmdDb25maWcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHlhbWxMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICB5YW1sTGluZXMucHVzaCgnIyBGU3ggT05UQVAgRW1iZWRkaW5nIFNlcnZlciBDb25maWd1cmF0aW9uJyk7XG4gICAgeWFtbExpbmVzLnB1c2goYHBhdHRlcm46ICR7Y29uZmlnLnBhdHRlcm59YCk7XG4gICAgeWFtbExpbmVzLnB1c2goYHNjaGVkdWxlOiBcIiR7Y29uZmlnLnNjaGVkdWxlfVwiYCk7XG4gICAgeWFtbExpbmVzLnB1c2goYGRvY2tlckltYWdlOiAke2NvbmZpZy5kb2NrZXJJbWFnZX1gKTtcbiAgICB5YW1sTGluZXMucHVzaCgnJyk7XG4gICAgXG4gICAgeWFtbExpbmVzLnB1c2goJ2ZzeE1vdW50Q29uZmlnOicpO1xuICAgIHlhbWxMaW5lcy5wdXNoKGAgIGZpbGVTeXN0ZW1JZDogJHtjb25maWcuZnN4TW91bnRDb25maWcuZmlsZVN5c3RlbUlkfWApO1xuICAgIHlhbWxMaW5lcy5wdXNoKGAgIHN2bUlkOiAke2NvbmZpZy5mc3hNb3VudENvbmZpZy5zdm1JZH1gKTtcbiAgICB5YW1sTGluZXMucHVzaCgnJyk7XG4gICAgXG4gICAgeWFtbExpbmVzLnB1c2goJ3Byb2Nlc3NpbmdMaW1pdHM6Jyk7XG4gICAgeWFtbExpbmVzLnB1c2goYCAgbWF4RmlsZXM6ICR7Y29uZmlnLnByb2Nlc3NpbmdMaW1pdHMubWF4RmlsZXN9YCk7XG4gICAgeWFtbExpbmVzLnB1c2goYCAgbWF4Rm9sZGVyczogJHtjb25maWcucHJvY2Vzc2luZ0xpbWl0cy5tYXhGb2xkZXJzfWApO1xuICAgIHlhbWxMaW5lcy5wdXNoKGAgIG1heERhdGFTaXplR0I6ICR7Y29uZmlnLnByb2Nlc3NpbmdMaW1pdHMubWF4RGF0YVNpemVHQn1gKTtcbiAgICB5YW1sTGluZXMucHVzaChgICBiYXRjaFNpemU6ICR7Y29uZmlnLnByb2Nlc3NpbmdMaW1pdHMuYmF0Y2hTaXplfWApO1xuICAgIHlhbWxMaW5lcy5wdXNoKGAgIG1heFBhcmFsbGVsSm9iczogJHtjb25maWcucHJvY2Vzc2luZ0xpbWl0cy5tYXhQYXJhbGxlbEpvYnN9YCk7XG4gICAgXG4gICAgcmV0dXJuIHlhbWxMaW5lcy5qb2luKCdcXG4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDoqK3lrprjga7lt67liIbjgpLmr5TovINcbiAgICovXG4gIHN0YXRpYyBjb21wYXJlQ29uZmlncyhcbiAgICBjb25maWcxOiBFeHRlbmRlZEVtYmVkZGluZ0NvbmZpZywgXG4gICAgY29uZmlnMjogRXh0ZW5kZWRFbWJlZGRpbmdDb25maWdcbiAgKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGRpZmZlcmVuY2VzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGlmIChjb25maWcxLnBhdHRlcm4gIT09IGNvbmZpZzIucGF0dGVybikge1xuICAgICAgZGlmZmVyZW5jZXMucHVzaChg44OR44K/44O844OzOiAke2NvbmZpZzEucGF0dGVybn0g4oaSICR7Y29uZmlnMi5wYXR0ZXJufWApO1xuICAgIH1cbiAgICBcbiAgICBpZiAoY29uZmlnMS5zY2hlZHVsZSAhPT0gY29uZmlnMi5zY2hlZHVsZSkge1xuICAgICAgZGlmZmVyZW5jZXMucHVzaChg44K544Kx44K444Ol44O844OrOiAke2NvbmZpZzEuc2NoZWR1bGV9IOKGkiAke2NvbmZpZzIuc2NoZWR1bGV9YCk7XG4gICAgfVxuICAgIFxuICAgIGlmIChjb25maWcxLnByb2Nlc3NpbmdMaW1pdHMubWF4RmlsZXMgIT09IGNvbmZpZzIucHJvY2Vzc2luZ0xpbWl0cy5tYXhGaWxlcykge1xuICAgICAgZGlmZmVyZW5jZXMucHVzaChg5pyA5aSn44OV44Kh44Kk44Or5pWwOiAke2NvbmZpZzEucHJvY2Vzc2luZ0xpbWl0cy5tYXhGaWxlc30g4oaSICR7Y29uZmlnMi5wcm9jZXNzaW5nTGltaXRzLm1heEZpbGVzfWApO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZGlmZmVyZW5jZXM7XG4gIH1cblxuICAvKipcbiAgICog6Kit5a6a44Gu44Kz44K544OI6KaL56mN44KC44KK77yI5qaC566X77yJXG4gICAqL1xuICBzdGF0aWMgZXN0aW1hdGVNb250aGx5Q29zdChjb25maWc6IEV4dGVuZGVkRW1iZWRkaW5nQ29uZmlnKTogbnVtYmVyIHtcbiAgICBsZXQgYmFzZUNvc3QgPSAwO1xuICAgIFxuICAgIHN3aXRjaCAoY29uZmlnLnBhdHRlcm4pIHtcbiAgICAgIGNhc2UgJ2VjMi1vbmRlbWFuZCc6XG4gICAgICAgIC8vIDI0LzfnqLzlg43jga5FQzLjgrPjgrnjg4jvvIjmpoLnrpfvvIlcbiAgICAgICAgYmFzZUNvc3QgPSAxMDA7IC8vICQxMDAv5pyIXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZWMyLXNwb3QnOlxuICAgICAgICAvLyBTcG905L6h5qC844Gn44Gu5a6f6KGM77yIOTAl5YmK5rib77yJXG4gICAgICAgIGJhc2VDb3N0ID0gMTA7IC8vICQxMC/mnIhcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhd3MtYmF0Y2gnOlxuICAgICAgICAvLyBCYXRjaOWun+ihjOOCs+OCueODiO+8iOS9v+eUqOaZguOBruOBv++8iVxuICAgICAgICBiYXNlQ29zdCA9IDE1OyAvLyAkMTUv5pyIXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZWNzLWVjMic6XG4gICAgICAgIC8vIEVDUyBvbiBFQzLjgrPjgrnjg4hcbiAgICAgICAgYmFzZUNvc3QgPSAyMDsgLy8gJDIwL+aciFxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgLy8g5Yem55CG6YeP44Gr5b+c44GY44Gf6L+95Yqg44Kz44K544OIXG4gICAgY29uc3QgcHJvY2Vzc2luZ0Nvc3QgPSBNYXRoLmNlaWwoY29uZmlnLnByb2Nlc3NpbmdMaW1pdHMubWF4RmlsZXMgLyAxMDAwMCkgKiA1O1xuICAgIFxuICAgIHJldHVybiBiYXNlQ29zdCArIHByb2Nlc3NpbmdDb3N0O1xuICB9XG59XG4iXX0=