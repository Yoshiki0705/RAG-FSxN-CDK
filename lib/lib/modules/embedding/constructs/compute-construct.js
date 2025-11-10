"use strict";
/**
 * コンピュートコンストラクト
 *
 * Lambda、AWS Batch、ECSの統合管理を提供
 * 既存の監視・分析実装と自動スケーリング機能を統合
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputeConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const batch = __importStar(require("aws-cdk-lib/aws-batch"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
const applicationautoscaling = __importStar(require("aws-cdk-lib/aws-applicationautoscaling"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const constructs_1 = require("constructs");
const lambda_construct_factory_1 = require("./lambda-construct-factory");
const compute_config_builder_1 = require("./compute-config-builder");
const validation_chain_1 = require("./validation-chain");
/**
 * Lambda関数のデフォルト設定定数
 */
const LAMBDA_DEFAULTS = {
    RUNTIME: 'nodejs20.x',
    HANDLER: 'index.handler',
    ARCHITECTURE: lambda.Architecture.ARM_64,
    LOG_RETENTION_DAYS: logs.RetentionDays.TWO_WEEKS,
    WARMUP_INTERVAL_MINUTES: 5,
};
/**
 * ECRリポジトリ設定定数
 */
const ECR_DEFAULTS = {
    MAX_IMAGE_COUNT: 10,
    EMBEDDING_MAX_IMAGE_COUNT: 5,
    SCAN_ON_PUSH: true,
};
/**
 * 自動スケーリング設定定数
 */
const AUTO_SCALING_DEFAULTS = {
    MIN_CONCURRENCY: 10,
    MAX_CONCURRENCY: 1000,
    TARGET_UTILIZATION: 70,
    SCALE_OUT_COOLDOWN_SECONDS: 60,
    SCALE_IN_COOLDOWN_SECONDS: 300,
};
/**
 * Lambda関数設定ファクトリー
 */
class LambdaConfigFactory {
    constructor(projectName, environment, sessionTableName) {
        this.projectName = projectName;
        this.environment = environment;
        this.sessionTableName = sessionTableName;
    }
    /**
     * 基本設定を生成
     */
    createBaseConfig(functionType) {
        return {
            functionName: `${this.projectName}-${this.environment}-${functionType}`,
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            environment: {
                PROJECT_NAME: this.projectName,
                ENVIRONMENT: this.environment,
            },
        };
    }
    /**
     * メトリクス収集Lambda設定
     */
    createMetricsCollectorConfig() {
        return {
            ...this.createBaseConfig('metrics-collector'),
            timeout: 300,
            memorySize: 512,
        };
    }
    /**
     * アラート処理Lambda設定
     */
    createAlertProcessorConfig() {
        return {
            ...this.createBaseConfig('alert-processor'),
            timeout: 180,
            memorySize: 256,
        };
    }
    /**
     * ML処理Lambda設定
     */
    createMLProcessorConfig() {
        return {
            ...this.createBaseConfig('ml-processor'),
            timeout: 900,
            memorySize: 1024,
        };
    }
    /**
     * テナント管理Lambda設定
     */
    createTenantManagerConfig() {
        const config = {
            ...this.createBaseConfig('tenant-manager'),
            timeout: 300,
            memorySize: 512,
        };
        if (this.sessionTableName) {
            config.environment.SESSION_TABLE = this.sessionTableName;
        }
        return config;
    }
}
class ComputeConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
        this.lambdaFunctions = {};
        this.autoScalingTargets = {};
        this.ecrRepositories = {};
        try {
            // 設定検証（Chain of Responsibility パターン）
            this.validateConfigurationWithChain();
            // Lambda実行ロール作成
            this.lambdaRole = this.createLambdaExecutionRole();
            // ECRリポジトリ作成
            this.createECRRepositories();
            // Lambda関数作成（Factory パターン）
            this.createLambdaFunctionsWithFactory();
            // AWS Batch設定
            if (this.props.config.batch?.enabled) {
                this.createBatchResources();
            }
            // ECS設定
            if (this.props.config.ecs?.enabled) {
                this.createECSResources();
            }
            // 自動スケーリング設定
            this.setupAutoScaling();
            // 出力値の設定
            this.outputs = this.createOutputs();
            // タグ設定
            this.applyTags();
            console.log(`✅ ComputeConstruct初期化完了: ${id}`);
        }
        catch (error) {
            console.error(`❌ ComputeConstruct初期化エラー: ${error}`);
            throw error;
        }
    }
    /**
     * 設定検証（Chain of Responsibility パターン）
     */
    validateConfigurationWithChain() {
        const validationResult = validation_chain_1.ConfigurationValidator.validate(this.props);
        // 検証結果をログ出力
        validation_chain_1.ConfigurationValidator.logValidationResult(validationResult);
        // エラーがある場合は例外をスロー
        if (!validationResult.isValid) {
            throw new Error(`設定検証に失敗しました: ${validationResult.errors.join(', ')}`);
        }
    }
    /**
     * 設定検証（従来版 - 後方互換性のため保持）
     * @deprecated validateConfigurationWithChain() を使用してください
     */
    validateConfiguration() {
        if (!this.props.projectName) {
            throw new Error('プロジェクト名が設定されていません');
        }
        if (!this.props.environment) {
            throw new Error('環境名が設定されていません');
        }
        if (!this.props.config) {
            throw new Error('コンピュート設定が設定されていません');
        }
    }
    /**
     * Lambda実行ロール作成
     */
    createLambdaExecutionRole() {
        const role = new iam.Role(this, 'LambdaExecutionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: `Lambda execution role for ${this.props.projectName}`,
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });
        // VPC設定が有効な場合
        if (this.props.config.lambda.common.vpcConfig?.enabled) {
            role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'));
        }
        // X-Ray設定が有効な場合
        if (this.props.config.lambda.common.enableXRayTracing) {
            role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'));
        }
        // S3アクセス権限
        if (this.props.documentsBucket) {
            this.props.documentsBucket.grantReadWrite(role);
        }
        if (this.props.embeddingsBucket) {
            this.props.embeddingsBucket.grantReadWrite(role);
        }
        // DynamoDBアクセス権限
        if (this.props.sessionTable) {
            this.props.sessionTable.grantReadWriteData(role);
        }
        // KMSアクセス権限
        if (this.props.kmsKey) {
            this.props.kmsKey.grantEncryptDecrypt(role);
        }
        // OpenSearchアクセス権限（将来実装）
        // if (this.props.openSearchCollection) {
        //   // OpenSearch Serverlessのアクセス権限を追加
        // }
        return role;
    }
    /**
     * ECRリポジトリ作成
     */
    createECRRepositories() {
        // Next.js用ECRリポジトリ
        this.ecrRepositories.nextjs = new ecr.Repository(this, 'NextjsRepository', {
            repositoryName: `${this.props.projectName}-${this.props.environment}-nextjs`,
            imageScanOnPush: ECR_DEFAULTS.SCAN_ON_PUSH,
            lifecycleRules: [{
                    maxImageCount: ECR_DEFAULTS.MAX_IMAGE_COUNT,
                    description: `Keep only ${ECR_DEFAULTS.MAX_IMAGE_COUNT} images`,
                }],
        });
        // Embedding用ECRリポジトリ
        this.ecrRepositories.embedding = new ecr.Repository(this, 'EmbeddingRepository', {
            repositoryName: `${this.props.projectName}-${this.props.environment}-embedding`,
            imageScanOnPush: ECR_DEFAULTS.SCAN_ON_PUSH,
            lifecycleRules: [{
                    maxImageCount: ECR_DEFAULTS.EMBEDDING_MAX_IMAGE_COUNT,
                    description: `Keep only ${ECR_DEFAULTS.EMBEDDING_MAX_IMAGE_COUNT} images`,
                }],
        });
    }
    /**
     * Lambda関数作成（Factory パターン）
     */
    createLambdaFunctionsWithFactory() {
        const functions = this.props.config.lambda.functions;
        // Lambda関数ファクトリーを初期化
        const strategy = new lambda_construct_factory_1.BasicLambdaStrategy(this.props.config.lambda.common.logRetention, this.props.config.lambda.common.architecture === 'arm64'
            ? lambda.Architecture.ARM_64
            : lambda.Architecture.X86_64);
        const factory = new lambda_construct_factory_1.LambdaFunctionFactory(strategy);
        // 基本RAG関数
        this.createBasicRAGFunctionsWithFactory(functions, factory);
        // 監視・分析統合関数
        this.createMonitoringAnalyticsFunctionsWithFactory(functions, factory);
    }
    /**
     * Lambda関数作成（従来版 - 後方互換性のため保持）
     * @deprecated createLambdaFunctionsWithFactory() を使用してください
     */
    createLambdaFunctions() {
        const functions = this.props.config.lambda.functions;
        // 基本RAG関数
        this.createBasicRAGFunctions(functions);
        // 監視・分析統合関数
        this.createMonitoringAnalyticsFunctions(functions);
    }
    /**
     * 基本RAG関数作成
     */
    createBasicRAGFunctions(functions) {
        // ドキュメント処理Lambda
        if (functions.documentProcessor.enabled) {
            this.lambdaFunctions.documentProcessor = this.createLambdaFunction('DocumentProcessor', {
                functionName: functions.documentProcessor.functionName ||
                    `${this.props.projectName}-${this.props.environment}-document-processor`,
                runtime: functions.documentProcessor.runtime,
                handler: functions.documentProcessor.handler,
                timeout: functions.documentProcessor.timeout,
                memorySize: functions.documentProcessor.memorySize,
                reservedConcurrency: functions.documentProcessor.reservedConcurrency,
                provisionedConcurrency: functions.documentProcessor.provisionedConcurrency,
                environment: {
                    ...functions.documentProcessor.environment,
                    DOCUMENTS_BUCKET: this.props.documentsBucket?.bucketName || '',
                    EMBEDDINGS_BUCKET: this.props.embeddingsBucket?.bucketName || '',
                    SESSION_TABLE: this.props.sessionTable?.tableName || '',
                },
                layers: functions.documentProcessor.layers,
                deadLetterQueue: functions.documentProcessor.deadLetterQueue,
            }, 'documentprocessor');
        }
        // 埋め込み生成Lambda
        if (functions.embeddingGenerator.enabled) {
            this.lambdaFunctions.embeddingGenerator = this.createLambdaFunction('EmbeddingGenerator', {
                functionName: functions.embeddingGenerator.functionName ||
                    `${this.props.projectName}-${this.props.environment}-embedding-generator`,
                runtime: functions.embeddingGenerator.runtime,
                handler: functions.embeddingGenerator.handler,
                timeout: functions.embeddingGenerator.timeout,
                memorySize: functions.embeddingGenerator.memorySize,
                reservedConcurrency: functions.embeddingGenerator.reservedConcurrency,
                provisionedConcurrency: functions.embeddingGenerator.provisionedConcurrency,
                environment: {
                    ...functions.embeddingGenerator.environment,
                    EMBEDDINGS_BUCKET: this.props.embeddingsBucket?.bucketName || '',
                },
                layers: functions.embeddingGenerator.layers,
            }, 'embeddinggenerator');
        }
        // クエリ処理Lambda
        if (functions.queryProcessor.enabled) {
            this.lambdaFunctions.queryProcessor = this.createLambdaFunction('QueryProcessor', {
                functionName: functions.queryProcessor.functionName ||
                    `${this.props.projectName}-${this.props.environment}-query-processor`,
                runtime: functions.queryProcessor.runtime,
                handler: functions.queryProcessor.handler,
                timeout: functions.queryProcessor.timeout,
                memorySize: functions.queryProcessor.memorySize,
                reservedConcurrency: functions.queryProcessor.reservedConcurrency,
                environment: {
                    ...functions.queryProcessor.environment,
                    SESSION_TABLE: this.props.sessionTable?.tableName || '',
                },
            }, 'queryprocessor');
        }
        // チャットハンドラーLambda
        if (functions.chatHandler.enabled) {
            this.lambdaFunctions.chatHandler = this.createLambdaFunction('ChatHandler', {
                functionName: functions.chatHandler.functionName ||
                    `${this.props.projectName}-${this.props.environment}-chat-handler`,
                runtime: functions.chatHandler.runtime,
                handler: functions.chatHandler.handler,
                timeout: functions.chatHandler.timeout,
                memorySize: functions.chatHandler.memorySize,
                environment: {
                    ...functions.chatHandler.environment,
                    SESSION_TABLE: this.props.sessionTable?.tableName || '',
                    DOCUMENTS_BUCKET: this.props.documentsBucket?.bucketName || '',
                },
            }, 'chathandler');
        }
        // 認証ハンドラーLambda
        if (functions.authHandler.enabled) {
            this.lambdaFunctions.authHandler = this.createLambdaFunction('AuthHandler', {
                functionName: functions.authHandler.functionName ||
                    `${this.props.projectName}-${this.props.environment}-auth-handler`,
                runtime: functions.authHandler.runtime,
                handler: functions.authHandler.handler,
                timeout: functions.authHandler.timeout,
                memorySize: functions.authHandler.memorySize,
                environment: {
                    ...functions.authHandler.environment,
                    SESSION_TABLE: this.props.sessionTable?.tableName || '',
                },
            }, 'authhandler');
        }
    }
    /**
     * 基本RAG関数作成（Factory パターン）
     */
    createBasicRAGFunctionsWithFactory(functions, factory) {
        // ドキュメント処理Lambda
        if (functions.documentProcessor?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .heavyProcessing(`${this.props.projectName}-${this.props.environment}-document-processor`)
                .withRuntime(functions.documentProcessor.runtime)
                .withTimeout(functions.documentProcessor.timeout)
                .withMemorySize(functions.documentProcessor.memorySize)
                .addEnvironmentVariable('DOCUMENTS_BUCKET', this.props.documentsBucket?.bucketName || '')
                .addEnvironmentVariable('EMBEDDINGS_BUCKET', this.props.embeddingsBucket?.bucketName || '')
                .build();
            this.lambdaFunctions.documentProcessor = factory.createFunction(this, 'DocumentProcessor', config, this.lambdaRole);
        }
        // 埋め込み生成Lambda
        if (functions.embeddingGenerator?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .heavyProcessing(`${this.props.projectName}-${this.props.environment}-embedding-generator`)
                .withRuntime(functions.embeddingGenerator.runtime)
                .withTimeout(functions.embeddingGenerator.timeout)
                .withMemorySize(functions.embeddingGenerator.memorySize)
                .addEnvironmentVariable('EMBEDDINGS_BUCKET', this.props.embeddingsBucket?.bucketName || '')
                .build();
            this.lambdaFunctions.embeddingGenerator = factory.createFunction(this, 'EmbeddingGenerator', config, this.lambdaRole);
        }
        // クエリ処理Lambda
        if (functions.queryProcessor?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .realtime(`${this.props.projectName}-${this.props.environment}-query-processor`)
                .withRuntime(functions.queryProcessor.runtime)
                .withTimeout(functions.queryProcessor.timeout)
                .withMemorySize(functions.queryProcessor.memorySize)
                .addEnvironmentVariable('SESSION_TABLE', this.props.sessionTable?.tableName || '')
                .build();
            this.lambdaFunctions.queryProcessor = factory.createFunction(this, 'QueryProcessor', config, this.lambdaRole);
        }
        // チャットハンドラーLambda
        if (functions.chatHandler?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .lightweightApi(`${this.props.projectName}-${this.props.environment}-chat-handler`)
                .withRuntime(functions.chatHandler.runtime)
                .withTimeout(functions.chatHandler.timeout)
                .withMemorySize(functions.chatHandler.memorySize)
                .addEnvironmentVariable('SESSION_TABLE', this.props.sessionTable?.tableName || '')
                .build();
            this.lambdaFunctions.chatHandler = factory.createFunction(this, 'ChatHandler', config, this.lambdaRole);
        }
        // 認証ハンドラーLambda
        if (functions.authHandler?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .lightweightApi(`${this.props.projectName}-${this.props.environment}-auth-handler`)
                .withRuntime(functions.authHandler.runtime)
                .withTimeout(functions.authHandler.timeout)
                .withMemorySize(functions.authHandler.memorySize)
                .addEnvironmentVariable('SESSION_TABLE', this.props.sessionTable?.tableName || '')
                .build();
            this.lambdaFunctions.authHandler = factory.createFunction(this, 'AuthHandler', config, this.lambdaRole);
        }
    }
    /**
     * 監視・分析統合関数作成（Factory パターン）
     */
    createMonitoringAnalyticsFunctionsWithFactory(functions, factory) {
        if (!functions.monitoringAnalytics?.enabled)
            return;
        // メトリクス収集Lambda
        if (functions.monitoringAnalytics.metricsCollector?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .lightweightApi(`${this.props.projectName}-${this.props.environment}-metrics-collector`)
                .withTimeout(300)
                .withMemorySize(512)
                .build();
            this.lambdaFunctions.metricsCollector = factory.createFunction(this, 'MetricsCollector', config, this.lambdaRole);
        }
        // アラート処理Lambda
        if (functions.monitoringAnalytics.alertProcessor?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .lightweightApi(`${this.props.projectName}-${this.props.environment}-alert-processor`)
                .withTimeout(180)
                .withMemorySize(256)
                .build();
            this.lambdaFunctions.alertProcessor = factory.createFunction(this, 'AlertProcessor', config, this.lambdaRole);
        }
        // ML処理Lambda
        if (functions.monitoringAnalytics.mlProcessor?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .heavyProcessing(`${this.props.projectName}-${this.props.environment}-ml-processor`)
                .withTimeout(900)
                .withMemorySize(1024)
                .build();
            this.lambdaFunctions.mlProcessor = factory.createFunction(this, 'MLProcessor', config, this.lambdaRole);
        }
        // テナント管理Lambda
        if (functions.monitoringAnalytics.tenantManager?.enabled) {
            const config = compute_config_builder_1.LambdaConfigTemplates
                .lightweightApi(`${this.props.projectName}-${this.props.environment}-tenant-manager`)
                .withTimeout(300)
                .withMemorySize(512)
                .addEnvironmentVariable('SESSION_TABLE', this.props.sessionTable?.tableName || '')
                .build();
            this.lambdaFunctions.tenantManager = factory.createFunction(this, 'TenantManager', config, this.lambdaRole);
        }
    }
    /**
     * 監視・分析統合関数作成（従来版 - 後方互換性のため保持）
     * @deprecated createMonitoringAnalyticsFunctionsWithFactory() を使用してください
     */
    createMonitoringAnalyticsFunctions(functions) {
        if (!functions.monitoringAnalytics?.enabled)
            return;
        this.createMetricsCollectorFunction();
        this.createAlertProcessorFunction();
        this.createMLProcessorFunction();
        this.createTenantManagerFunction();
    }
    /**
     * メトリクス収集Lambda関数作成
     */
    createMetricsCollectorFunction() {
        const configFactory = new LambdaConfigFactory(this.props.projectName, this.props.environment, this.props.sessionTable?.tableName);
        const config = configFactory.createMetricsCollectorConfig();
        this.lambdaFunctions.metricsCollector = this.createLambdaFunction('MetricsCollector', config, 'metrics-collector');
    }
    /**
     * アラート処理Lambda関数作成
     */
    createAlertProcessorFunction() {
        const configFactory = new LambdaConfigFactory(this.props.projectName, this.props.environment, this.props.sessionTable?.tableName);
        const config = configFactory.createAlertProcessorConfig();
        this.lambdaFunctions.alertProcessor = this.createLambdaFunction('AlertProcessor', config, 'alert-processor');
    }
    /**
     * ML処理Lambda関数作成
     */
    createMLProcessorFunction() {
        const configFactory = new LambdaConfigFactory(this.props.projectName, this.props.environment, this.props.sessionTable?.tableName);
        const config = configFactory.createMLProcessorConfig();
        this.lambdaFunctions.mlProcessor = this.createLambdaFunction('MLProcessor', config, 'ml-processor');
    }
    /**
     * テナント管理Lambda関数作成
     */
    createTenantManagerFunction() {
        const configFactory = new LambdaConfigFactory(this.props.projectName, this.props.environment, this.props.sessionTable?.tableName);
        const config = configFactory.createTenantManagerConfig();
        this.lambdaFunctions.tenantManager = this.createLambdaFunction('TenantManager', config, 'tenant-manager');
    }
    /**
     * Lambda関数作成ヘルパー
     */
    createLambdaFunction(id, config, codeDir) {
        // ロググループ作成
        const logGroup = new logs.LogGroup(this, `${id}LogGroup`, {
            logGroupName: `/aws/lambda/${config.functionName}`,
            retention: this.props.config.lambda.common.logRetention,
            removalPolicy: this.props.environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        // コードディレクトリの決定
        const codePath = codeDir ? `lambda/${codeDir}` : `lambda/${id.toLowerCase()}`;
        // Lambda関数作成
        const lambdaFunction = new lambda.Function(this, id, {
            functionName: config.functionName,
            runtime: this.getLambdaRuntime(config.runtime),
            handler: config.handler,
            code: lambda.Code.fromAsset(codePath),
            timeout: cdk.Duration.seconds(config.timeout),
            memorySize: config.memorySize,
            role: this.lambdaRole,
            environment: config.environment,
            logGroup,
            architecture: this.props.config.lambda.common.architecture === 'arm64'
                ? lambda.Architecture.ARM_64
                : lambda.Architecture.X86_64,
            tracing: this.props.config.lambda.common.enableXRayTracing
                ? lambda.Tracing.ACTIVE
                : lambda.Tracing.DISABLED,
            insightsVersion: this.props.config.lambda.common.enableInsights
                ? lambda.LambdaInsightsVersion.VERSION_1_0_229_0
                : undefined,
            reservedConcurrentExecutions: config.reservedConcurrency,
            vpc: this.props.config.lambda.common.vpcConfig?.enabled ? this.props.vpc : undefined,
            vpcSubnets: this.props.config.lambda.common.vpcConfig?.enabled && this.props.privateSubnetIds ? {
                subnets: this.props.privateSubnetIds.map(id => ec2.Subnet.fromSubnetId(this, `Subnet${id}`, id))
            } : undefined,
        });
        // VPC設定
        if (this.props.config.lambda.common.vpcConfig?.enabled && this.props.vpc) {
            // VPC設定は関数作成時に設定する必要があるため、ここでは省略
            // 実際の実装では、Lambda関数作成時にvpcConfigを設定
        }
        // プロビジョニング済み同時実行数設定
        if (config.provisionedConcurrency) {
            const version = lambdaFunction.currentVersion;
            const alias = new lambda.Alias(this, `${id}Alias`, {
                aliasName: 'live',
                version,
            });
            // プロビジョニング済み同時実行数を別途設定（将来実装）
            // 現在のCDKバージョンでは直接サポートされていないため、コメントアウト
            // new cdk.CfnResource(this, `${id}ProvisionedConcurrency`, {
            //   type: 'AWS::Lambda::ProvisionedConcurrencyConfig',
            //   properties: {
            //     FunctionName: lambdaFunction.functionName,
            //     Qualifier: alias.aliasName,
            //     ProvisionedConcurrencyConfig: config.provisionedConcurrency,
            //   },
            // });
        }
        // デッドレターキュー設定
        if (config.deadLetterQueue) {
            // SQSデッドレターキューの実装（将来実装）
        }
        return lambdaFunction;
    }
    /**
     * AWS Batchリソース作成
     */
    createBatchResources() {
        if (!this.props.config.batch.enabled)
            return;
        const batchConfig = this.props.config.batch;
        // Batch用IAMロール
        const batchServiceRole = new iam.Role(this, 'BatchServiceRole', {
            assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole'),
            ],
        });
        const batchInstanceRole = new iam.Role(this, 'BatchInstanceRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
            ],
        });
        const batchInstanceProfile = new iam.CfnInstanceProfile(this, 'BatchInstanceProfile', {
            roles: [batchInstanceRole.roleName],
        });
        // コンピュート環境作成
        if (batchConfig.computeEnvironment) {
            const batchComputeEnvironment = new batch.CfnComputeEnvironment(this, 'BatchComputeEnvironment', {
                computeEnvironmentName: batchConfig.computeEnvironment.name ||
                    `${this.props.projectName}-${this.props.environment}-compute-env`,
                serviceRole: batchServiceRole.roleArn,
                type: batchConfig.computeEnvironment.type,
                state: batchConfig.computeEnvironment.state,
            });
            // ジョブキュー作成
            if (batchConfig.jobQueue) {
                const batchJobQueue = new batch.CfnJobQueue(this, 'BatchJobQueue', {
                    jobQueueName: batchConfig.jobQueue.name ||
                        `${this.props.projectName}-${this.props.environment}-job-queue`,
                    priority: batchConfig.jobQueue.priority,
                    computeEnvironmentOrder: [{
                            computeEnvironment: batchComputeEnvironment.ref,
                            order: 1,
                        }],
                });
            }
        }
    }
    /**
     * ECSリソース作成
     */
    createECSResources() {
        if (!this.props.config.ecs.enabled)
            return;
        const ecsConfig = this.props.config.ecs;
        // ECSクラスター作成
        if (ecsConfig.cluster) {
            const ecsCluster = new ecs.Cluster(this, 'ECSCluster', {
                clusterName: ecsConfig.cluster.name ||
                    `${this.props.projectName}-${this.props.environment}-cluster`,
                vpc: this.props.vpc,
                containerInsights: ecsConfig.cluster.enableContainerInsights,
            });
            // キャパシティプロバイダー設定
            if (ecsConfig.cluster.capacityProviders.includes('FARGATE')) {
                ecsCluster.addCapacity('FargateCapacity', {
                    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
                    minCapacity: 0,
                    maxCapacity: 10,
                });
            }
        }
    }
    /**
     * 自動スケーリング設定
     */
    setupAutoScaling() {
        if (!this.props.config.lambda.common.enableAutoScaling)
            return;
        Object.entries(this.lambdaFunctions).forEach(([name, lambdaFunction]) => {
            const autoScalingConfig = this.props.config.lambda.autoScaling || {
                minConcurrency: 10,
                maxConcurrency: 1000,
                targetUtilization: 70,
                scaleOutCooldown: 60,
                scaleInCooldown: 300,
            };
            // プロビジョニング済み同時実行数の設定
            const alias = lambdaFunction.addAlias('live');
            // Application Auto Scalingターゲット設定
            const scalingTarget = new applicationautoscaling.ScalableTarget(this, `${name}ScalingTarget`, {
                serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
                scalableDimension: 'lambda:function:ProvisionedConcurrency',
                resourceId: `function:${lambdaFunction.functionName}:live`,
                minCapacity: autoScalingConfig.minConcurrency,
                maxCapacity: autoScalingConfig.maxConcurrency,
            });
            this.autoScalingTargets[name] = scalingTarget;
            // CloudWatchメトリクス設定
            const utilizationMetric = new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'ProvisionedConcurrencyUtilization',
                dimensionsMap: {
                    FunctionName: lambdaFunction.functionName,
                    Resource: `${lambdaFunction.functionName}:live`,
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(1),
            });
            // ターゲット追跡スケーリングポリシー
            scalingTarget.scaleToTrackMetric(`${name}ScalingPolicy`, {
                targetValue: autoScalingConfig.targetUtilization,
                predefinedMetric: applicationautoscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
                scaleOutCooldown: cdk.Duration.seconds(autoScalingConfig.scaleOutCooldown),
                scaleInCooldown: cdk.Duration.seconds(autoScalingConfig.scaleInCooldown),
            });
            // ウォームアップ設定（コールドスタート削減）
            if (this.props.config.lambda.common.enableWarmup) {
                const warmupRule = new events.Rule(this, `${name}WarmupRule`, {
                    schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
                    description: `Lambda関数のウォームアップ - ${lambdaFunction.functionName}`,
                });
                warmupRule.addTarget(new targets.LambdaFunction(alias, {
                    event: events.RuleTargetInput.fromObject({
                        source: 'warmup',
                        action: 'ping',
                        timestamp: events.RuleTargetInput.fromText('$.time'),
                    }),
                }));
            }
        });
    }
    /**
     * Lambda Runtime変換
     */
    getLambdaRuntime(runtime) {
        switch (runtime) {
            case 'nodejs18.x':
                return lambda.Runtime.NODEJS_18_X;
            case 'nodejs20.x':
                return lambda.Runtime.NODEJS_20_X;
            case 'python3.9':
                return lambda.Runtime.PYTHON_3_9;
            case 'python3.10':
                return lambda.Runtime.PYTHON_3_10;
            case 'python3.11':
                return lambda.Runtime.PYTHON_3_11;
            case 'python3.12':
                return lambda.Runtime.PYTHON_3_12;
            default:
                return lambda.Runtime.NODEJS_20_X;
        }
    }
    /**
     * 出力値作成
     */
    createOutputs() {
        return {
            // Lambda出力
            documentProcessorArn: this.lambdaFunctions.documentProcessor?.functionArn,
            embeddingGeneratorArn: this.lambdaFunctions.embeddingGenerator?.functionArn,
            queryProcessorArn: this.lambdaFunctions.queryProcessor?.functionArn,
            chatHandlerArn: this.lambdaFunctions.chatHandler?.functionArn,
            authHandlerArn: this.lambdaFunctions.authHandler?.functionArn,
            // 監視・分析 Lambda出力
            metricsCollectorArn: this.lambdaFunctions.metricsCollector?.functionArn,
            alertProcessorArn: this.lambdaFunctions.alertProcessor?.functionArn,
            mlProcessorArn: this.lambdaFunctions.mlProcessor?.functionArn,
            tenantManagerArn: this.lambdaFunctions.tenantManager?.functionArn,
            // AWS Batch出力
            batchComputeEnvironmentArn: this.batchComputeEnvironment?.attrComputeEnvironmentArn,
            batchJobQueueArn: this.batchJobQueue?.ref,
            // ECS出力
            ecsClusterArn: this.ecsCluster?.clusterArn,
            ecsServiceArns: [], // 将来実装
            // ECR出力
            nextjsRepositoryUri: this.ecrRepositories.nextjs?.repositoryUri,
            embeddingRepositoryUri: this.ecrRepositories.embedding?.repositoryUri,
        };
    }
    /**
     * タグ適用（IAM制限対応）
     */
    applyTags() {
        const tags = this.props.config.tags;
        // 最重要タグのみ（IAM制限対応）
        cdk.Tags.of(this).add('ComputeType', tags.ComputeType);
    }
}
exports.ComputeConstruct = ComputeConstruct;
