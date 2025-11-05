"use strict";
/**
 * 統合Embeddingスタック
 *
 * モジュラーアーキテクチャに基づくEmbedding・AI統合管理
 * - Lambda 関数（Embedding処理）
 * - AI/ML サービス (Bedrock)
 * - バッチ処理（AWS Batch）
 * - コンテナサービス (ECS)
 * - 統一命名規則: Component="Embedding"
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
exports.EmbeddingStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const compute_construct_1 = require("../../modules/compute/constructs/compute-construct");
const ai_construct_1 = require("../../modules/ai/constructs/ai-construct");
const embedding_batch_integration_1 = require("../../modules/embedding/constructs/embedding-batch-integration");
const batch_integration_test_1 = require("../../modules/embedding/constructs/batch-integration-test");
const sqlite_load_test_1 = require("../../modules/embedding/constructs/sqlite-load-test");
const windows_sqlite_1 = require("../../modules/embedding/constructs/windows-sqlite");
const embedding_config_factory_1 = require("../../config/environments/embedding-config-factory");
class EmbeddingStack extends cdk.Stack {
    computeConstruct;
    aiConstruct;
    // 新しいEmbedding統合コンストラクト
    embeddingBatchIntegration;
    batchIntegrationTest;
    embeddingConfig;
    // SQLite負荷試験コンストラクト
    sqliteLoadTest;
    windowsSqlite;
    // Embeddingリソース
    lambdaFunctions;
    ecsCluster;
    batchJobQueue;
    // AI/MLリソース（Embedding特化）
    bedrockModels;
    embeddingFunction;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { computeConfig, aiConfig, projectName, environment, vpcId, privateSubnetIds, securityGroupIds, kmsKeyArn, s3BucketArns, dynamoDbTableArns, openSearchCollectionArn, enableBatchIntegration = true, enableBatchTesting = false, imagePath = 'embedding-server', imageTag = 'latest', 
        // SQLite負荷試験設定
        enableSqliteLoadTest = false, enableWindowsLoadTest = false, fsxFileSystemId, fsxSvmId, fsxVolumeId, fsxMountPath, fsxNfsEndpoint, fsxCifsEndpoint, fsxCifsShareName, keyPairName, bedrockRegion, bedrockModelId, scheduleExpression, maxvCpus, instanceTypes, windowsInstanceType } = props;
        // Embedding設定をCDKコンテキストから生成
        this.embeddingConfig = embedding_config_factory_1.EmbeddingConfigFactory.createFromContext(cdk.App.of(this), environment);
        // Embeddingコンストラクト作成
        this.computeConstruct = new compute_construct_1.ComputeConstruct(this, 'EmbeddingConstruct', {
            config: computeConfig,
            projectName,
            environment,
            vpc: commonResources.vpc.vpc,
            privateSubnetIds,
            securityGroupIds,
            kmsKeyArn,
            s3BucketArns,
            dynamoDbTableArns,
            openSearchCollectionArn,
        });
        // AI Embeddingコンストラクト作成
        this.aiConstruct = new ai_construct_1.AIConstruct(this, 'EmbeddingAiConstruct', {
            config: aiConfig,
            projectName,
            environment,
            kmsKeyArn,
        });
        // 共通リソース設定
        const commonResources = this.createCommonResources(props);
        // AWS Batch統合（有効化されている場合）
        if (enableBatchIntegration && this.embeddingConfig.awsBatch.enabled) {
            try {
                this.embeddingBatchIntegration = new embedding_batch_integration_1.EmbeddingBatchIntegration(this, 'EmbeddingBatchIntegration', {
                    config: this.embeddingConfig,
                    projectName,
                    environment,
                    commonResources,
                    imagePath,
                    imageTag,
                });
                // Batch統合テスト（有効化されている場合）
                if (enableBatchTesting) {
                    this.batchIntegrationTest = new batch_integration_test_1.BatchIntegrationTest(this, 'BatchIntegrationTest', {
                        batchIntegration: this.embeddingBatchIntegration,
                        config: this.embeddingConfig,
                        projectName,
                        environment,
                        notificationTopicArn: this.embeddingConfig.monitoring.alerts.snsTopicArn,
                    });
                }
            }
            catch (error) {
                console.error('Batch統合の初期化に失敗しました:', error);
                throw new Error(`Batch統合エラー: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // SQLite負荷試験統合（有効化されている場合）
        if (enableSqliteLoadTest && fsxFileSystemId && fsxSvmId && fsxVolumeId) {
            try {
                this.sqliteLoadTest = new sqlite_load_test_1.SqliteLoadTest(this, 'SqliteLoadTest', {
                    projectName,
                    environment,
                    vpc: commonResources.vpc.vpc,
                    privateSubnets: commonResources.vpc.privateSubnets,
                    securityGroup: commonResources.securityGroups.commonSecurityGroup,
                    fsxFileSystemId,
                    fsxSvmId,
                    fsxVolumeId,
                    fsxMountPath: fsxMountPath || '/sqlite-load-test',
                    fsxNfsEndpoint: fsxNfsEndpoint || `${fsxSvmId}.${fsxFileSystemId}.fsx.${this.region}.amazonaws.com`,
                    bedrockRegion: bedrockRegion || this.region,
                    bedrockModelId: bedrockModelId || 'amazon.titan-embed-text-v1',
                    scheduleExpression: scheduleExpression || 'cron(0 2 * * ? *)',
                    enableScheduledExecution: true,
                    maxvCpus: maxvCpus || 20,
                    instanceTypes: instanceTypes || ['m5.large', 'm5.xlarge'],
                });
                // Windows SQLite負荷試験（有効化されている場合）
                if (enableWindowsLoadTest && keyPairName && fsxCifsEndpoint && fsxCifsShareName) {
                    this.windowsSqlite = new windows_sqlite_1.WindowsSqlite(this, 'WindowsSqlite', {
                        projectName,
                        environment,
                        vpc: commonResources.vpc.vpc,
                        privateSubnet: commonResources.vpc.privateSubnets[0],
                        securityGroup: commonResources.securityGroups.commonSecurityGroup,
                        keyPairName,
                        fsxFileSystemId,
                        fsxSvmId,
                        fsxVolumeId,
                        fsxMountPath: fsxMountPath || '/sqlite-load-test',
                        fsxCifsEndpoint,
                        fsxCifsShareName,
                        instanceType: windowsInstanceType || 't3.medium',
                        enableDetailedMonitoring: environment === 'prod',
                    });
                }
            }
            catch (error) {
                console.error('SQLite負荷試験統合の初期化に失敗しました:', error);
                throw new Error(`SQLite負荷試験統合エラー: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // 主要リソースの参照を設定
        this.lambdaFunctions = this.computeConstruct.lambdaFunctions || {};
        this.ecsCluster = this.computeConstruct.ecsCluster;
        this.batchJobQueue = this.embeddingBatchIntegration?.batchConstruct.jobQueue;
        this.bedrockModels = this.aiConstruct.bedrockModels || {};
        this.embeddingFunction = this.aiConstruct.embeddingFunction;
        // CloudFormation出力
        this.createOutputs();
        // スタックレベルのタグ設定
        this.applyStackTags(projectName, environment);
    }
    /**
     * 共通リソース作成
     */
    createCommonResources(props) {
        // 既存のVPCを使用するか、新規作成
        let vpc;
        if (props.vpcId) {
            vpc = cdk.aws_ec2.Vpc.fromLookup(this, 'ExistingVpc', {
                vpcId: props.vpcId,
            });
        }
        else {
            vpc = new cdk.aws_ec2.Vpc(this, 'EmbeddingVpc', {
                maxAzs: 3,
                natGateways: 2,
                enableDnsHostnames: true,
                enableDnsSupport: true,
            });
        }
        // セキュリティグループ作成
        const commonSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, 'EmbeddingCommonSecurityGroup', {
            vpc,
            description: 'Common security group for Embedding resources',
            allowAllOutbound: true,
        });
        // HTTPSアクセス許可
        commonSecurityGroup.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.tcp(443), 'HTTPS access');
        // VPC内通信許可
        commonSecurityGroup.addIngressRule(cdk.aws_ec2.Peer.ipv4(vpc.vpcCidrBlock), cdk.aws_ec2.Port.allTraffic(), 'VPC internal communication');
        return {
            vpc: {
                vpc,
                privateSubnets: vpc.privateSubnets,
                publicSubnets: vpc.publicSubnets,
                availabilityZones: vpc.availabilityZones,
            },
            securityGroups: {
                commonSecurityGroup,
            },
            iam: {
                commonServiceRole: this.createCommonServiceRole(),
            },
            logging: {
                commonLogGroup: this.createCommonLogGroup(),
            },
            storage: {},
        };
    }
    /**
     * 共通サービスロール作成
     */
    createCommonServiceRole() {
        return new cdk.aws_iam.Role(this, 'EmbeddingCommonServiceRole', {
            assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });
    }
    /**
     * 共通ロググループ作成
     */
    createCommonLogGroup() {
        return new cdk.aws_logs.LogGroup(this, 'EmbeddingCommonLogGroup', {
            logGroupName: `/aws/embedding/${this.embeddingConfig.projectName}-${this.embeddingConfig.environment}`,
            retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
    /**
     * CloudFormation出力の作成（統一命名規則適用）
     */
    createOutputs() {
        // Embedding Lambda 関数情報
        Object.entries(this.lambdaFunctions).forEach(([name, func]) => {
            new cdk.CfnOutput(this, `EmbeddingLambdaFunction${name}Name`, {
                value: func.functionName,
                description: `Embedding Lambda Function ${name} Name`,
                exportName: `${this.stackName}-EmbeddingLambdaFunction${name}Name`,
            });
            new cdk.CfnOutput(this, `EmbeddingLambdaFunction${name}Arn`, {
                value: func.functionArn,
                description: `Embedding Lambda Function ${name} ARN`,
                exportName: `${this.stackName}-EmbeddingLambdaFunction${name}Arn`,
            });
        });
        // Embedding ECS クラスター情報
        if (this.ecsCluster) {
            new cdk.CfnOutput(this, 'EmbeddingEcsClusterName', {
                value: this.ecsCluster.clusterName,
                description: 'Embedding ECS Cluster Name',
                exportName: `${this.stackName}-EmbeddingEcsClusterName`,
            });
            new cdk.CfnOutput(this, 'EmbeddingEcsClusterArn', {
                value: this.ecsCluster.clusterArn,
                description: 'Embedding ECS Cluster ARN',
                exportName: `${this.stackName}-EmbeddingEcsClusterArn`,
            });
        }
        // Embedding Batch統合情報
        if (this.embeddingBatchIntegration) {
            const batchInfo = this.embeddingBatchIntegration.getIntegrationInfo();
            new cdk.CfnOutput(this, 'EmbeddingBatchComputeEnvironmentName', {
                value: batchInfo.batchConstruct.computeEnvironment,
                description: 'Embedding Batch Compute Environment Name',
                exportName: `${this.stackName}-EmbeddingBatchComputeEnvironmentName`,
            });
            new cdk.CfnOutput(this, 'EmbeddingBatchJobDefinitionName', {
                value: batchInfo.batchConstruct.jobDefinition,
                description: 'Embedding Batch Job Definition Name',
                exportName: `${this.stackName}-EmbeddingBatchJobDefinitionName`,
            });
            new cdk.CfnOutput(this, 'EmbeddingBatchJobQueueName', {
                value: batchInfo.batchConstruct.jobQueue,
                description: 'Embedding Batch Job Queue Name',
                exportName: `${this.stackName}-EmbeddingBatchJobQueueName`,
            });
            new cdk.CfnOutput(this, 'EmbeddingBatchJobManagerFunctionName', {
                value: batchInfo.jobManager.functionName,
                description: 'Embedding Batch Job Manager Function Name',
                exportName: `${this.stackName}-EmbeddingBatchJobManagerFunctionName`,
            });
            new cdk.CfnOutput(this, 'EmbeddingBatchIntegrationTopicArn', {
                value: batchInfo.monitoring.integrationTopic,
                description: 'Embedding Batch Integration Topic ARN',
                exportName: `${this.stackName}-EmbeddingBatchIntegrationTopicArn`,
            });
        }
        // Batch統合テスト情報
        if (this.batchIntegrationTest) {
            const testInfo = this.batchIntegrationTest.getTestInfo();
            new cdk.CfnOutput(this, 'EmbeddingBatchTestRunnerFunctionName', {
                value: testInfo.testRunner.functionName,
                description: 'Embedding Batch Test Runner Function Name',
                exportName: `${this.stackName}-EmbeddingBatchTestRunnerFunctionName`,
            });
            new cdk.CfnOutput(this, 'EmbeddingBatchTestNotificationTopicArn', {
                value: testInfo.monitoring.testNotificationTopic,
                description: 'Embedding Batch Test Notification Topic ARN',
                exportName: `${this.stackName}-EmbeddingBatchTestNotificationTopicArn`,
            });
            new cdk.CfnOutput(this, 'EmbeddingBatchTestLogGroupName', {
                value: testInfo.monitoring.testLogGroup,
                description: 'Embedding Batch Test Log Group Name',
                exportName: `${this.stackName}-EmbeddingBatchTestLogGroupName`,
            });
        }
        // SQLite負荷試験統合情報
        if (this.sqliteLoadTest) {
            new cdk.CfnOutput(this, 'SqliteEmbeddingEnvironmentName', {
                value: this.sqliteLoadTest.computeEnvironment.ref,
                description: 'SQLite Embedding Environment Name',
                exportName: `${this.stackName}-SqliteEmbeddingEnvironmentName`,
            });
            new cdk.CfnOutput(this, 'SqliteEmbeddingJobQueueName', {
                value: this.sqliteLoadTest.jobQueue.ref,
                description: 'SQLite Embedding Job Queue Name',
                exportName: `${this.stackName}-SqliteEmbeddingJobQueueName`,
            });
            new cdk.CfnOutput(this, 'SqliteEmbeddingJobDefinitionArn', {
                value: this.sqliteLoadTest.jobDefinition.ref,
                description: 'SQLite Embedding Job Definition ARN',
                exportName: `${this.stackName}-SqliteEmbeddingJobDefinitionArn`,
            });
            if (this.sqliteLoadTest.scheduledRule) {
                new cdk.CfnOutput(this, 'SqliteEmbeddingScheduledRuleArn', {
                    value: this.sqliteLoadTest.scheduledRule.ruleArn,
                    description: 'SQLite Embedding Scheduled Rule ARN',
                    exportName: `${this.stackName}-SqliteEmbeddingScheduledRuleArn`,
                });
            }
        }
        // Windows SQLite負荷試験情報
        if (this.windowsSqlite) {
            new cdk.CfnOutput(this, 'WindowsSqliteInstanceId', {
                value: this.windowsSqlite.instance.instanceId,
                description: 'Windows SQLite Instance ID',
                exportName: `${this.stackName}-WindowsSqliteInstanceId`,
            });
            new cdk.CfnOutput(this, 'WindowsSqliteInstancePrivateIp', {
                value: this.windowsSqlite.instance.instancePrivateIp,
                description: 'Windows SQLite Instance Private IP',
                exportName: `${this.stackName}-WindowsSqliteInstancePrivateIp`,
            });
            if (this.windowsSqlite.bastionHost) {
                new cdk.CfnOutput(this, 'SqliteBastionHostPublicIp', {
                    value: this.windowsSqlite.bastionHost.instancePublicIp,
                    description: 'SQLite Bastion Host Public IP',
                    exportName: `${this.stackName}-SqliteBastionHostPublicIp`,
                });
            }
        }
        // Embedding Bedrock モデル情報
        Object.entries(this.bedrockModels).forEach(([name, modelId]) => {
            new cdk.CfnOutput(this, `EmbeddingBedrockModel${name}Id`, {
                value: modelId,
                description: `Embedding Bedrock Model ${name} ID`,
                exportName: `${this.stackName}-EmbeddingBedrockModel${name}Id`,
            });
        });
        // Embedding関数情報
        if (this.embeddingFunction) {
            new cdk.CfnOutput(this, 'EmbeddingFunctionName', {
                value: this.embeddingFunction.functionName,
                description: 'Embedding Function Name',
                exportName: `${this.stackName}-EmbeddingFunctionName`,
            });
            new cdk.CfnOutput(this, 'EmbeddingFunctionArn', {
                value: this.embeddingFunction.functionArn,
                description: 'Embedding Function ARN',
                exportName: `${this.stackName}-EmbeddingFunctionArn`,
            });
        }
    }
    /**
     * スタックレベルのタグ設定（統一命名規則適用）
     */
    applyStackTags(projectName, environment) {
        cdk.Tags.of(this).add('Project', projectName);
        cdk.Tags.of(this).add('Environment', environment);
        cdk.Tags.of(this).add('Stack', 'EmbeddingStack');
        cdk.Tags.of(this).add('Component', 'Embedding');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('CostCenter', `${projectName}-${environment}-embedding`);
    }
    /**
     * 他のスタックで使用するためのEmbeddingリソース情報を取得
     */
    getEmbeddingInfo() {
        return {
            lambdaFunctions: this.lambdaFunctions,
            ecsCluster: this.ecsCluster,
            batchJobQueue: this.batchJobQueue,
            bedrockModels: this.bedrockModels,
            embeddingFunction: this.embeddingFunction,
        };
    }
    /**
     * 特定のLambda関数を取得
     */
    getLambdaFunction(name) {
        return this.lambdaFunctions[name];
    }
    /**
     * 特定のBedrockモデルIDを取得
     */
    getBedrockModelId(name) {
        return this.bedrockModels[name];
    }
    /**
     * Lambda関数用のIAMポリシーステートメントを生成
     */
    getLambdaExecutionPolicyStatements() {
        const statements = [];
        // Bedrock アクセス権限
        statements.push(new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
            ],
            resources: Object.values(this.bedrockModels).map(modelId => `arn:aws:bedrock:${this.region}::foundation-model/${modelId}`),
        }));
        // CloudWatch Logs アクセス権限
        statements.push(new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: [`arn:aws:logs:${this.region}:${this.account}:*`],
        }));
        // X-Ray トレーシング権限
        statements.push(new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
            ],
            resources: ['*'],
        }));
        return statements;
    }
    /**
     * ECS タスク用のIAMポリシーステートメントを生成
     */
    getEcsTaskPolicyStatements() {
        const statements = [];
        // ECS タスク実行権限
        statements.push(new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
            ],
            resources: ['*'],
        }));
        // CloudWatch Logs アクセス権限
        statements.push(new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/ecs/*`],
        }));
        return statements;
    }
    /**
     * Batch統合情報を取得
     */
    getBatchIntegrationInfo() {
        return this.embeddingBatchIntegration?.getIntegrationInfo();
    }
    /**
     * Batchジョブを実行
     */
    async submitBatchJob(jobName, parameters) {
        return this.embeddingBatchIntegration?.submitEmbeddingJob(jobName, parameters);
    }
    /**
     * Batchジョブ状況を取得
     */
    getBatchJobStatus() {
        return this.embeddingBatchIntegration?.getJobStatus();
    }
    /**
     * Batch統合テスト実行
     */
    async runBatchIntegrationTest(testType = 'basic') {
        if (!this.batchIntegrationTest) {
            return undefined;
        }
        switch (testType) {
            case 'basic':
                return this.batchIntegrationTest.runBasicTest();
            case 'fsx':
                return this.batchIntegrationTest.runFsxMountTest();
            case 'recovery':
                return this.batchIntegrationTest.runAutoRecoveryTest();
            default:
                return this.batchIntegrationTest.runBasicTest();
        }
    }
    /**
     * Embedding設定を取得
     */
    getEmbeddingConfig() {
        return this.embeddingConfig;
    }
    /**
     * SQLite負荷試験ジョブを実行
     */
    submitSqliteLoadTestJob(jobName) {
        if (!this.sqliteLoadTest) {
            return undefined;
        }
        return this.sqliteLoadTest.submitJob(jobName);
    }
    /**
     * SQLite負荷試験統合情報を取得
     */
    getSqliteLoadTestInfo() {
        if (!this.sqliteLoadTest) {
            return undefined;
        }
        return {
            computeEnvironment: this.sqliteLoadTest.computeEnvironment.ref,
            jobQueue: this.sqliteLoadTest.jobQueue.ref,
            jobDefinition: this.sqliteLoadTest.jobDefinition.ref,
            logGroup: this.sqliteLoadTest.logGroup.logGroupName,
            scheduledRule: this.sqliteLoadTest.scheduledRule?.ruleArn,
        };
    }
    /**
     * Windows SQLite負荷試験情報を取得
     */
    getWindowsSqliteInfo() {
        if (!this.windowsSqlite) {
            return undefined;
        }
        return {
            instanceId: this.windowsSqlite.instance.instanceId,
            privateIp: this.windowsSqlite.instance.instancePrivateIp,
            bastionHostPublicIp: this.windowsSqlite.bastionHost?.instancePublicIp,
        };
    }
    /**
     * CDKコンテキスト設定例を取得
     */
    static getContextExample(environment) {
        return {
            projectName: 'permission-aware-rag',
            environment,
            region: 'ap-northeast-1',
            // Embedding Batch設定
            'embedding:enableAwsBatch': true,
            'embedding:enableEcsOnEC2': false,
            'embedding:enableSpotFleet': false,
            'embedding:enableMonitoring': true,
            'embedding:enableAutoScaling': true,
            // Batch設定
            'embedding:batch:namePrefix': `${environment}-embedding-batch`,
            'embedding:batch:imageUri': `123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/embedding-server:${environment}`,
            'embedding:batch:vcpus': environment === 'prod' ? 4 : 2,
            'embedding:batch:memory': environment === 'prod' ? 8192 : 4096,
            'embedding:batch:useSpotInstances': environment !== 'prod',
            // Job Definition設定
            'embedding:jobDefinition:name': `${environment}-embedding-job-definition`,
            'embedding:jobDefinition:cpu': environment === 'prod' ? 4 : 2,
            'embedding:jobDefinition:memoryMiB': environment === 'prod' ? 8192 : 4096,
            'embedding:jobDefinition:timeoutHours': 1,
            'embedding:jobDefinition:retryAttempts': 3,
            // FSx統合設定
            'embedding:fsx:fileSystemId': 'fs-0123456789abcdef0',
            'embedding:fsx:cifsdataVolName': 'smb_share',
            'embedding:fsx:ragdbVolPath': '/smb_share/ragdb',
            // Active Directory設定
            'embedding:ad:domain': 'example.com',
            'embedding:ad:username': 'admin',
            'embedding:ad:passwordSecretArn': 'arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:ad-password-abc123',
            // Bedrock設定
            'embedding:bedrock:region': 'us-east-1',
            'embedding:bedrock:modelId': 'amazon.titan-embed-text-v1',
            // OpenSearch設定
            'embedding:openSearch:collectionName': `${environment}-embedding-collection`,
            'embedding:openSearch:indexName': 'documents',
            // 監視設定
            'embedding:monitoring:alerts:enabled': true,
            'embedding:monitoring:cloudWatch:createDashboard': true,
            'embedding:monitoring:xray:tracingEnabled': true,
        };
    }
}
exports.EmbeddingStack = EmbeddingStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWRkaW5nLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW1iZWRkaW5nLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBRW5DLDBGQUFzRjtBQUN0RiwyRUFBdUU7QUFHdkUsZ0hBQTJHO0FBQzNHLHNHQUFpRztBQUNqRywwRkFBcUY7QUFDckYsc0ZBQWtGO0FBRWxGLGlHQUE0RjtBQXlDNUYsTUFBYSxjQUFlLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDM0IsZ0JBQWdCLENBQW1CO0lBQ25DLFdBQVcsQ0FBYztJQUV6Qyx3QkFBd0I7SUFDUix5QkFBeUIsQ0FBNkI7SUFDdEQsb0JBQW9CLENBQXdCO0lBQzVDLGVBQWUsQ0FBa0I7SUFFakQsb0JBQW9CO0lBQ0osY0FBYyxDQUFrQjtJQUNoQyxhQUFhLENBQWlCO0lBRTlDLGdCQUFnQjtJQUNBLGVBQWUsQ0FBNkM7SUFDNUQsVUFBVSxDQUF1QjtJQUNqQyxhQUFhLENBQTBCO0lBRXZELHlCQUF5QjtJQUNULGFBQWEsQ0FBNEI7SUFDekMsaUJBQWlCLENBQTJCO0lBRTVELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMEI7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUNKLGFBQWEsRUFDYixRQUFRLEVBQ1IsV0FBVyxFQUNYLFdBQVcsRUFDWCxLQUFLLEVBQ0wsZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixTQUFTLEVBQ1QsWUFBWSxFQUNaLGlCQUFpQixFQUNqQix1QkFBdUIsRUFDdkIsc0JBQXNCLEdBQUcsSUFBSSxFQUM3QixrQkFBa0IsR0FBRyxLQUFLLEVBQzFCLFNBQVMsR0FBRyxrQkFBa0IsRUFDOUIsUUFBUSxHQUFHLFFBQVE7UUFDbkIsZUFBZTtRQUNmLG9CQUFvQixHQUFHLEtBQUss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cUNBQXFDLEVBQUUsR0FBRyxXQUFXLHVCQUF1QjtZQUM1RSxnQ0FBZ0MsRUFBRSxXQUFXO1lBRTdDLE9BQU87WUFDUCxxQ0FBcUMsRUFBRSxJQUFJO1lBQzNDLGlEQUFpRCxFQUFFLElBQUk7WUFDdkQsMENBQTBDLEVBQUUsSUFBSTtTQUNqRCxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBanJCRCx3Q0FpckJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDntbHlkIhFbWJlZGRpbmfjgrnjgr/jg4Pjgq9cbiAqIFxuICog44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj44Gr5Z+644Gl44GPRW1iZWRkaW5n44O7QUnntbHlkIjnrqHnkIZcbiAqIC0gTGFtYmRhIOmWouaVsO+8iEVtYmVkZGluZ+WHpueQhu+8iVxuICogLSBBSS9NTCDjgrXjg7zjg5PjgrkgKEJlZHJvY2spXG4gKiAtIOODkOODg+ODgeWHpueQhu+8iEFXUyBCYXRjaO+8iVxuICogLSDjgrPjg7Pjg4bjg4rjgrXjg7zjg5PjgrkgKEVDUylcbiAqIC0g57Wx5LiA5ZG95ZCN6KaP5YmHOiBDb21wb25lbnQ9XCJFbWJlZGRpbmdcIlxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IENvbXB1dGVDb25zdHJ1Y3QgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2NvbXB1dGUvY29uc3RydWN0cy9jb21wdXRlLWNvbnN0cnVjdCc7XG5pbXBvcnQgeyBBSUNvbnN0cnVjdCB9IGZyb20gJy4uLy4uL21vZHVsZXMvYWkvY29uc3RydWN0cy9haS1jb25zdHJ1Y3QnO1xuaW1wb3J0IHsgQ29tcHV0ZUNvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvY29tcHV0ZS9pbnRlcmZhY2VzL2NvbXB1dGUtY29uZmlnJztcbmltcG9ydCB7IEFpQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9haS9pbnRlcmZhY2VzL2FpLWNvbmZpZyc7XG5pbXBvcnQgeyBFbWJlZGRpbmdCYXRjaEludGVncmF0aW9uIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9lbWJlZGRpbmcvY29uc3RydWN0cy9lbWJlZGRpbmctYmF0Y2gtaW50ZWdyYXRpb24nO1xuaW1wb3J0IHsgQmF0Y2hJbnRlZ3JhdGlvblRlc3QgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2VtYmVkZGluZy9jb25zdHJ1Y3RzL2JhdGNoLWludGVncmF0aW9uLXRlc3QnO1xuaW1wb3J0IHsgU3FsaXRlTG9hZFRlc3QgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2VtYmVkZGluZy9jb25zdHJ1Y3RzL3NxbGl0ZS1sb2FkLXRlc3QnO1xuaW1wb3J0IHsgV2luZG93c1NxbGl0ZSB9IGZyb20gJy4uLy4uL21vZHVsZXMvZW1iZWRkaW5nL2NvbnN0cnVjdHMvd2luZG93cy1zcWxpdGUnO1xuaW1wb3J0IHsgRW1iZWRkaW5nQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9haS9pbnRlcmZhY2VzL2VtYmVkZGluZy1jb25maWcnO1xuaW1wb3J0IHsgRW1iZWRkaW5nQ29uZmlnRmFjdG9yeSB9IGZyb20gJy4uLy4uL2NvbmZpZy9lbnZpcm9ubWVudHMvZW1iZWRkaW5nLWNvbmZpZy1mYWN0b3J5JztcbmltcG9ydCB7IEVtYmVkZGluZ0NvbW1vblJlc291cmNlcyB9IGZyb20gJy4uLy4uL21vZHVsZXMvZW1iZWRkaW5nL2ludGVyZmFjZXMvbW9kdWxlLWludGVyZmFjZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVtYmVkZGluZ1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGNvbXB1dGVDb25maWc6IENvbXB1dGVDb25maWc7XG4gIGFpQ29uZmlnOiBBaUNvbmZpZztcbiAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgdnBjSWQ/OiBzdHJpbmc7XG4gIHByaXZhdGVTdWJuZXRJZHM/OiBzdHJpbmdbXTtcbiAgc2VjdXJpdHlHcm91cElkcz86IHN0cmluZ1tdO1xuICBrbXNLZXlBcm4/OiBzdHJpbmc7XG4gIHMzQnVja2V0QXJucz86IHN0cmluZ1tdO1xuICBkeW5hbW9EYlRhYmxlQXJucz86IHN0cmluZ1tdO1xuICBvcGVuU2VhcmNoQ29sbGVjdGlvbkFybj86IHN0cmluZztcbiAgXG4gIC8vIOaWsOOBl+OBhEVtYmVkZGluZ+ioreWumlxuICBlbmFibGVCYXRjaEludGVncmF0aW9uPzogYm9vbGVhbjtcbiAgZW5hYmxlQmF0Y2hUZXN0aW5nPzogYm9vbGVhbjtcbiAgaW1hZ2VQYXRoPzogc3RyaW5nO1xuICBpbWFnZVRhZz86IHN0cmluZztcbiAgXG4gIC8vIFNRTGl0ZeiyoOiNt+ippumok+ioreWumlxuICBlbmFibGVTcWxpdGVMb2FkVGVzdD86IGJvb2xlYW47XG4gIGVuYWJsZVdpbmRvd3NMb2FkVGVzdD86IGJvb2xlYW47XG4gIGZzeEZpbGVTeXN0ZW1JZD86IHN0cmluZztcbiAgZnN4U3ZtSWQ/OiBzdHJpbmc7XG4gIGZzeFZvbHVtZUlkPzogc3RyaW5nO1xuICBmc3hNb3VudFBhdGg/OiBzdHJpbmc7XG4gIGZzeE5mc0VuZHBvaW50Pzogc3RyaW5nO1xuICBmc3hDaWZzRW5kcG9pbnQ/OiBzdHJpbmc7XG4gIGZzeENpZnNTaGFyZU5hbWU/OiBzdHJpbmc7XG4gIGtleVBhaXJOYW1lPzogc3RyaW5nO1xuICBiZWRyb2NrUmVnaW9uPzogc3RyaW5nO1xuICBiZWRyb2NrTW9kZWxJZD86IHN0cmluZztcbiAgc2NoZWR1bGVFeHByZXNzaW9uPzogc3RyaW5nO1xuICBtYXh2Q3B1cz86IG51bWJlcjtcbiAgaW5zdGFuY2VUeXBlcz86IHN0cmluZ1tdO1xuICB3aW5kb3dzSW5zdGFuY2VUeXBlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgRW1iZWRkaW5nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcHV0ZUNvbnN0cnVjdDogQ29tcHV0ZUNvbnN0cnVjdDtcbiAgcHVibGljIHJlYWRvbmx5IGFpQ29uc3RydWN0OiBBaUNvbnN0cnVjdDtcbiAgXG4gIC8vIOaWsOOBl+OBhEVtYmVkZGluZ+e1seWQiOOCs+ODs+OCueODiOODqeOCr+ODiFxuICBwdWJsaWMgcmVhZG9ubHkgZW1iZWRkaW5nQmF0Y2hJbnRlZ3JhdGlvbj86IEVtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb247XG4gIHB1YmxpYyByZWFkb25seSBiYXRjaEludGVncmF0aW9uVGVzdD86IEJhdGNoSW50ZWdyYXRpb25UZXN0O1xuICBwdWJsaWMgcmVhZG9ubHkgZW1iZWRkaW5nQ29uZmlnOiBFbWJlZGRpbmdDb25maWc7XG4gIFxuICAvLyBTUUxpdGXosqDojbfoqabpqJPjgrPjg7Pjgrnjg4jjg6njgq/jg4hcbiAgcHVibGljIHJlYWRvbmx5IHNxbGl0ZUxvYWRUZXN0PzogU3FsaXRlTG9hZFRlc3Q7XG4gIHB1YmxpYyByZWFkb25seSB3aW5kb3dzU3FsaXRlPzogV2luZG93c1NxbGl0ZTtcbiAgXG4gIC8vIEVtYmVkZGluZ+ODquOCveODvOOCuVxuICBwdWJsaWMgcmVhZG9ubHkgbGFtYmRhRnVuY3Rpb25zOiB7IFtrZXk6IHN0cmluZ106IGNkay5hd3NfbGFtYmRhLkZ1bmN0aW9uIH07XG4gIHB1YmxpYyByZWFkb25seSBlY3NDbHVzdGVyPzogY2RrLmF3c19lY3MuQ2x1c3RlcjtcbiAgcHVibGljIHJlYWRvbmx5IGJhdGNoSm9iUXVldWU/OiBjZGsuYXdzX2JhdGNoLkpvYlF1ZXVlO1xuICBcbiAgLy8gQUkvTUzjg6rjgr3jg7zjgrnvvIhFbWJlZGRpbmfnibnljJbvvIlcbiAgcHVibGljIHJlYWRvbmx5IGJlZHJvY2tNb2RlbHM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG4gIHB1YmxpYyByZWFkb25seSBlbWJlZGRpbmdGdW5jdGlvbj86IGNkay5hd3NfbGFtYmRhLkZ1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBFbWJlZGRpbmdTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB7IFxuICAgICAgY29tcHV0ZUNvbmZpZywgXG4gICAgICBhaUNvbmZpZywgXG4gICAgICBwcm9qZWN0TmFtZSwgXG4gICAgICBlbnZpcm9ubWVudCxcbiAgICAgIHZwY0lkLFxuICAgICAgcHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICBrbXNLZXlBcm4sXG4gICAgICBzM0J1Y2tldEFybnMsXG4gICAgICBkeW5hbW9EYlRhYmxlQXJucyxcbiAgICAgIG9wZW5TZWFyY2hDb2xsZWN0aW9uQXJuLFxuICAgICAgZW5hYmxlQmF0Y2hJbnRlZ3JhdGlvbiA9IHRydWUsXG4gICAgICBlbmFibGVCYXRjaFRlc3RpbmcgPSBmYWxzZSxcbiAgICAgIGltYWdlUGF0aCA9ICdlbWJlZGRpbmctc2VydmVyJyxcbiAgICAgIGltYWdlVGFnID0gJ2xhdGVzdCcsXG4gICAgICAvLyBTUUxpdGXosqDojbfoqabpqJPoqK3lrppcbiAgICAgIGVuYWJsZVNxbGl0ZUxvYWRUZXN0ID0gZmFsc2UsXG4gICAgICBlbmFibGVXaW5kb3dzTG9hZFRlc3QgPSBmYWxzZSxcbiAgICAgIGZzeEZpbGVTeXN0ZW1JZCxcbiAgICAgIGZzeFN2bUlkLFxuICAgICAgZnN4Vm9sdW1lSWQsXG4gICAgICBmc3hNb3VudFBhdGgsXG4gICAgICBmc3hOZnNFbmRwb2ludCxcbiAgICAgIGZzeENpZnNFbmRwb2ludCxcbiAgICAgIGZzeENpZnNTaGFyZU5hbWUsXG4gICAgICBrZXlQYWlyTmFtZSxcbiAgICAgIGJlZHJvY2tSZWdpb24sXG4gICAgICBiZWRyb2NrTW9kZWxJZCxcbiAgICAgIHNjaGVkdWxlRXhwcmVzc2lvbixcbiAgICAgIG1heHZDcHVzLFxuICAgICAgaW5zdGFuY2VUeXBlcyxcbiAgICAgIHdpbmRvd3NJbnN0YW5jZVR5cGVcbiAgICB9ID0gcHJvcHM7XG5cbiAgICAvLyBFbWJlZGRpbmfoqK3lrprjgpJDREvjgrPjg7Pjg4bjgq3jgrnjg4jjgYvjgonnlJ/miJBcbiAgICB0aGlzLmVtYmVkZGluZ0NvbmZpZyA9IEVtYmVkZGluZ0NvbmZpZ0ZhY3RvcnkuY3JlYXRlRnJvbUNvbnRleHQoXG4gICAgICBjZGsuQXBwLm9mKHRoaXMpIGFzIGNkay5BcHAsIFxuICAgICAgZW52aXJvbm1lbnRcbiAgICApO1xuXG4gICAgLy8gRW1iZWRkaW5n44Kz44Oz44K544OI44Op44Kv44OI5L2c5oiQXG4gICAgdGhpcy5jb21wdXRlQ29uc3RydWN0ID0gbmV3IENvbXB1dGVDb25zdHJ1Y3QodGhpcywgJ0VtYmVkZGluZ0NvbnN0cnVjdCcsIHtcbiAgICAgIGNvbmZpZzogY29tcHV0ZUNvbmZpZyxcbiAgICAgIHByb2plY3ROYW1lLFxuICAgICAgZW52aXJvbm1lbnQsXG4gICAgICB2cGM6IGNvbW1vblJlc291cmNlcy52cGMudnBjLFxuICAgICAgcHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICBrbXNLZXlBcm4sXG4gICAgICBzM0J1Y2tldEFybnMsXG4gICAgICBkeW5hbW9EYlRhYmxlQXJucyxcbiAgICAgIG9wZW5TZWFyY2hDb2xsZWN0aW9uQXJuLFxuICAgIH0pO1xuXG4gICAgLy8gQUkgRW1iZWRkaW5n44Kz44Oz44K544OI44Op44Kv44OI5L2c5oiQXG4gICAgdGhpcy5haUNvbnN0cnVjdCA9IG5ldyBBSUNvbnN0cnVjdCh0aGlzLCAnRW1iZWRkaW5nQWlDb25zdHJ1Y3QnLCB7XG4gICAgICBjb25maWc6IGFpQ29uZmlnLFxuICAgICAgcHJvamVjdE5hbWUsXG4gICAgICBlbnZpcm9ubWVudCxcbiAgICAgIGttc0tleUFybixcbiAgICB9KTtcblxuICAgIC8vIOWFsemAmuODquOCveODvOOCueioreWumlxuICAgIGNvbnN0IGNvbW1vblJlc291cmNlczogRW1iZWRkaW5nQ29tbW9uUmVzb3VyY2VzID0gdGhpcy5jcmVhdGVDb21tb25SZXNvdXJjZXMocHJvcHMpO1xuXG4gICAgLy8gQVdTIEJhdGNo57Wx5ZCI77yI5pyJ5Yq55YyW44GV44KM44Gm44GE44KL5aC05ZCI77yJXG4gICAgaWYgKGVuYWJsZUJhdGNoSW50ZWdyYXRpb24gJiYgdGhpcy5lbWJlZGRpbmdDb25maWcuYXdzQmF0Y2guZW5hYmxlZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5lbWJlZGRpbmdCYXRjaEludGVncmF0aW9uID0gbmV3IEVtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb24odGhpcywgJ0VtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgY29uZmlnOiB0aGlzLmVtYmVkZGluZ0NvbmZpZyxcbiAgICAgICAgICBwcm9qZWN0TmFtZSxcbiAgICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgICBjb21tb25SZXNvdXJjZXMsXG4gICAgICAgICAgaW1hZ2VQYXRoLFxuICAgICAgICAgIGltYWdlVGFnLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBCYXRjaOe1seWQiOODhuOCueODiO+8iOacieWKueWMluOBleOCjOOBpuOBhOOCi+WgtOWQiO+8iVxuICAgICAgICBpZiAoZW5hYmxlQmF0Y2hUZXN0aW5nKSB7XG4gICAgICAgICAgdGhpcy5iYXRjaEludGVncmF0aW9uVGVzdCA9IG5ldyBCYXRjaEludGVncmF0aW9uVGVzdCh0aGlzLCAnQmF0Y2hJbnRlZ3JhdGlvblRlc3QnLCB7XG4gICAgICAgICAgICBiYXRjaEludGVncmF0aW9uOiB0aGlzLmVtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb24sXG4gICAgICAgICAgICBjb25maWc6IHRoaXMuZW1iZWRkaW5nQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdE5hbWUsXG4gICAgICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvblRvcGljQXJuOiB0aGlzLmVtYmVkZGluZ0NvbmZpZy5tb25pdG9yaW5nLmFsZXJ0cy5zbnNUb3BpY0FybixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQmF0Y2jntbHlkIjjga7liJ3mnJ/ljJbjgavlpLHmlZfjgZfjgb7jgZfjgZ86JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhdGNo57Wx5ZCI44Ko44Op44O8OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTUUxpdGXosqDojbfoqabpqJPntbHlkIjvvIjmnInlirnljJbjgZXjgozjgabjgYTjgovloLTlkIjvvIlcbiAgICBpZiAoZW5hYmxlU3FsaXRlTG9hZFRlc3QgJiYgZnN4RmlsZVN5c3RlbUlkICYmIGZzeFN2bUlkICYmIGZzeFZvbHVtZUlkKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnNxbGl0ZUxvYWRUZXN0ID0gbmV3IFNxbGl0ZUxvYWRUZXN0KHRoaXMsICdTcWxpdGVMb2FkVGVzdCcsIHtcbiAgICAgICAgICBwcm9qZWN0TmFtZSxcbiAgICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgICB2cGM6IGNvbW1vblJlc291cmNlcy52cGMudnBjLFxuICAgICAgICAgIHByaXZhdGVTdWJuZXRzOiBjb21tb25SZXNvdXJjZXMudnBjLnByaXZhdGVTdWJuZXRzLFxuICAgICAgICAgIHNlY3VyaXR5R3JvdXA6IGNvbW1vblJlc291cmNlcy5zZWN1cml0eUdyb3Vwcy5jb21tb25TZWN1cml0eUdyb3VwLFxuICAgICAgICAgIGZzeEZpbGVTeXN0ZW1JZCxcbiAgICAgICAgICBmc3hTdm1JZCxcbiAgICAgICAgICBmc3hWb2x1bWVJZCxcbiAgICAgICAgICBmc3hNb3VudFBhdGg6IGZzeE1vdW50UGF0aCB8fCAnL3NxbGl0ZS1sb2FkLXRlc3QnLFxuICAgICAgICAgIGZzeE5mc0VuZHBvaW50OiBmc3hOZnNFbmRwb2ludCB8fCBgJHtmc3hTdm1JZH0uJHtmc3hGaWxlU3lzdGVtSWR9LmZzeC4ke3RoaXMucmVnaW9ufS5hbWF6b25hd3MuY29tYCxcbiAgICAgICAgICBiZWRyb2NrUmVnaW9uOiBiZWRyb2NrUmVnaW9uIHx8IHRoaXMucmVnaW9uLFxuICAgICAgICAgIGJlZHJvY2tNb2RlbElkOiBiZWRyb2NrTW9kZWxJZCB8fCAnYW1hem9uLnRpdGFuLWVtYmVkLXRleHQtdjEnLFxuICAgICAgICAgIHNjaGVkdWxlRXhwcmVzc2lvbjogc2NoZWR1bGVFeHByZXNzaW9uIHx8ICdjcm9uKDAgMiAqICogPyAqKScsXG4gICAgICAgICAgZW5hYmxlU2NoZWR1bGVkRXhlY3V0aW9uOiB0cnVlLFxuICAgICAgICAgIG1heHZDcHVzOiBtYXh2Q3B1cyB8fCAyMCxcbiAgICAgICAgICBpbnN0YW5jZVR5cGVzOiBpbnN0YW5jZVR5cGVzIHx8IFsnbTUubGFyZ2UnLCAnbTUueGxhcmdlJ10sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdpbmRvd3MgU1FMaXRl6LKg6I236Kmm6aiT77yI5pyJ5Yq55YyW44GV44KM44Gm44GE44KL5aC05ZCI77yJXG4gICAgICAgIGlmIChlbmFibGVXaW5kb3dzTG9hZFRlc3QgJiYga2V5UGFpck5hbWUgJiYgZnN4Q2lmc0VuZHBvaW50ICYmIGZzeENpZnNTaGFyZU5hbWUpIHtcbiAgICAgICAgICB0aGlzLndpbmRvd3NTcWxpdGUgPSBuZXcgV2luZG93c1NxbGl0ZSh0aGlzLCAnV2luZG93c1NxbGl0ZScsIHtcbiAgICAgICAgICAgIHByb2plY3ROYW1lLFxuICAgICAgICAgICAgZW52aXJvbm1lbnQsXG4gICAgICAgICAgICB2cGM6IGNvbW1vblJlc291cmNlcy52cGMudnBjLFxuICAgICAgICAgICAgcHJpdmF0ZVN1Ym5ldDogY29tbW9uUmVzb3VyY2VzLnZwYy5wcml2YXRlU3VibmV0c1swXSxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXA6IGNvbW1vblJlc291cmNlcy5zZWN1cml0eUdyb3Vwcy5jb21tb25TZWN1cml0eUdyb3VwLFxuICAgICAgICAgICAga2V5UGFpck5hbWUsXG4gICAgICAgICAgICBmc3hGaWxlU3lzdGVtSWQsXG4gICAgICAgICAgICBmc3hTdm1JZCxcbiAgICAgICAgICAgIGZzeFZvbHVtZUlkLFxuICAgICAgICAgICAgZnN4TW91bnRQYXRoOiBmc3hNb3VudFBhdGggfHwgJy9zcWxpdGUtbG9hZC10ZXN0JyxcbiAgICAgICAgICAgIGZzeENpZnNFbmRwb2ludCxcbiAgICAgICAgICAgIGZzeENpZnNTaGFyZU5hbWUsXG4gICAgICAgICAgICBpbnN0YW5jZVR5cGU6IHdpbmRvd3NJbnN0YW5jZVR5cGUgfHwgJ3QzLm1lZGl1bScsXG4gICAgICAgICAgICBlbmFibGVEZXRhaWxlZE1vbml0b3Jpbmc6IGVudmlyb25tZW50ID09PSAncHJvZCcsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NRTGl0ZeiyoOiNt+ippumok+e1seWQiOOBruWIneacn+WMluOBq+WkseaVl+OBl+OBvuOBl+OBnzonLCBlcnJvcik7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgU1FMaXRl6LKg6I236Kmm6aiT57Wx5ZCI44Ko44Op44O8OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDkuLvopoHjg6rjgr3jg7zjgrnjga7lj4LnhafjgpLoqK3lrppcbiAgICB0aGlzLmxhbWJkYUZ1bmN0aW9ucyA9IHRoaXMuY29tcHV0ZUNvbnN0cnVjdC5sYW1iZGFGdW5jdGlvbnMgfHwge307XG4gICAgdGhpcy5lY3NDbHVzdGVyID0gdGhpcy5jb21wdXRlQ29uc3RydWN0LmVjc0NsdXN0ZXI7XG4gICAgdGhpcy5iYXRjaEpvYlF1ZXVlID0gdGhpcy5lbWJlZGRpbmdCYXRjaEludGVncmF0aW9uPy5iYXRjaENvbnN0cnVjdC5qb2JRdWV1ZTtcbiAgICB0aGlzLmJlZHJvY2tNb2RlbHMgPSB0aGlzLmFpQ29uc3RydWN0LmJlZHJvY2tNb2RlbHMgfHwge307XG4gICAgdGhpcy5lbWJlZGRpbmdGdW5jdGlvbiA9IHRoaXMuYWlDb25zdHJ1Y3QuZW1iZWRkaW5nRnVuY3Rpb247XG5cbiAgICAvLyBDbG91ZEZvcm1hdGlvbuWHuuWKm1xuICAgIHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgLy8g44K544K/44OD44Kv44Os44OZ44Or44Gu44K/44Kw6Kit5a6aXG4gICAgdGhpcy5hcHBseVN0YWNrVGFncyhwcm9qZWN0TmFtZSwgZW52aXJvbm1lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIOWFsemAmuODquOCveODvOOCueS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVDb21tb25SZXNvdXJjZXMocHJvcHM6IEVtYmVkZGluZ1N0YWNrUHJvcHMpOiBFbWJlZGRpbmdDb21tb25SZXNvdXJjZXMge1xuICAgIC8vIOaXouWtmOOBrlZQQ+OCkuS9v+eUqOOBmeOCi+OBi+OAgeaWsOimj+S9nOaIkFxuICAgIGxldCB2cGM6IGNkay5hd3NfZWMyLklWcGM7XG4gICAgXG4gICAgaWYgKHByb3BzLnZwY0lkKSB7XG4gICAgICB2cGMgPSBjZGsuYXdzX2VjMi5WcGMuZnJvbUxvb2t1cCh0aGlzLCAnRXhpc3RpbmdWcGMnLCB7XG4gICAgICAgIHZwY0lkOiBwcm9wcy52cGNJZCxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2cGMgPSBuZXcgY2RrLmF3c19lYzIuVnBjKHRoaXMsICdFbWJlZGRpbmdWcGMnLCB7XG4gICAgICAgIG1heEF6czogMyxcbiAgICAgICAgbmF0R2F0ZXdheXM6IDIsXG4gICAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODl+S9nOaIkFxuICAgIGNvbnN0IGNvbW1vblNlY3VyaXR5R3JvdXAgPSBuZXcgY2RrLmF3c19lYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnRW1iZWRkaW5nQ29tbW9uU2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29tbW9uIHNlY3VyaXR5IGdyb3VwIGZvciBFbWJlZGRpbmcgcmVzb3VyY2VzJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBIVFRQU+OCouOCr+OCu+OCueioseWPr1xuICAgIGNvbW1vblNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBjZGsuYXdzX2VjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGNkay5hd3NfZWMyLlBvcnQudGNwKDQ0MyksXG4gICAgICAnSFRUUFMgYWNjZXNzJ1xuICAgICk7XG5cbiAgICAvLyBWUEPlhoXpgJrkv6HoqLHlj69cbiAgICBjb21tb25TZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgY2RrLmF3c19lYzIuUGVlci5pcHY0KHZwYy52cGNDaWRyQmxvY2spLFxuICAgICAgY2RrLmF3c19lYzIuUG9ydC5hbGxUcmFmZmljKCksXG4gICAgICAnVlBDIGludGVybmFsIGNvbW11bmljYXRpb24nXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICB2cGM6IHtcbiAgICAgICAgdnBjLFxuICAgICAgICBwcml2YXRlU3VibmV0czogdnBjLnByaXZhdGVTdWJuZXRzLFxuICAgICAgICBwdWJsaWNTdWJuZXRzOiB2cGMucHVibGljU3VibmV0cyxcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZXM6IHZwYy5hdmFpbGFiaWxpdHlab25lcyxcbiAgICAgIH0sXG4gICAgICBzZWN1cml0eUdyb3Vwczoge1xuICAgICAgICBjb21tb25TZWN1cml0eUdyb3VwLFxuICAgICAgfSxcbiAgICAgIGlhbToge1xuICAgICAgICBjb21tb25TZXJ2aWNlUm9sZTogdGhpcy5jcmVhdGVDb21tb25TZXJ2aWNlUm9sZSgpLFxuICAgICAgfSxcbiAgICAgIGxvZ2dpbmc6IHtcbiAgICAgICAgY29tbW9uTG9nR3JvdXA6IHRoaXMuY3JlYXRlQ29tbW9uTG9nR3JvdXAoKSxcbiAgICAgIH0sXG4gICAgICBzdG9yYWdlOiB7fSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOWFsemAmuOCteODvOODk+OCueODreODvOODq+S9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVDb21tb25TZXJ2aWNlUm9sZSgpOiBjZGsuYXdzX2lhbS5Sb2xlIHtcbiAgICByZXR1cm4gbmV3IGNkay5hd3NfaWFtLlJvbGUodGhpcywgJ0VtYmVkZGluZ0NvbW1vblNlcnZpY2VSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgY2RrLmF3c19pYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBjZGsuYXdzX2lhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlhbHpgJrjg63jgrDjgrDjg6vjg7zjg5fkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQ29tbW9uTG9nR3JvdXAoKTogY2RrLmF3c19sb2dzLkxvZ0dyb3VwIHtcbiAgICByZXR1cm4gbmV3IGNkay5hd3NfbG9ncy5Mb2dHcm91cCh0aGlzLCAnRW1iZWRkaW5nQ29tbW9uTG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2VtYmVkZGluZy8ke3RoaXMuZW1iZWRkaW5nQ29uZmlnLnByb2plY3ROYW1lfS0ke3RoaXMuZW1iZWRkaW5nQ29uZmlnLmVudmlyb25tZW50fWAsXG4gICAgICByZXRlbnRpb246IGNkay5hd3NfbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRGb3JtYXRpb27lh7rlipvjga7kvZzmiJDvvIjntbHkuIDlkb3lkI3opo/liYfpgannlKjvvIlcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0cygpOiB2b2lkIHtcbiAgICAvLyBFbWJlZGRpbmcgTGFtYmRhIOmWouaVsOaDheWgsVxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMubGFtYmRhRnVuY3Rpb25zKS5mb3JFYWNoKChbbmFtZSwgZnVuY10pID0+IHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGBFbWJlZGRpbmdMYW1iZGFGdW5jdGlvbiR7bmFtZX1OYW1lYCwge1xuICAgICAgICB2YWx1ZTogZnVuYy5mdW5jdGlvbk5hbWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgRW1iZWRkaW5nIExhbWJkYSBGdW5jdGlvbiAke25hbWV9IE5hbWVgLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRW1iZWRkaW5nTGFtYmRhRnVuY3Rpb24ke25hbWV9TmFtZWAsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYEVtYmVkZGluZ0xhbWJkYUZ1bmN0aW9uJHtuYW1lfUFybmAsIHtcbiAgICAgICAgdmFsdWU6IGZ1bmMuZnVuY3Rpb25Bcm4sXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgRW1iZWRkaW5nIExhbWJkYSBGdW5jdGlvbiAke25hbWV9IEFSTmAsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdMYW1iZGFGdW5jdGlvbiR7bmFtZX1Bcm5gLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBFbWJlZGRpbmcgRUNTIOOCr+ODqeOCueOCv+ODvOaDheWgsVxuICAgIGlmICh0aGlzLmVjc0NsdXN0ZXIpIHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFbWJlZGRpbmdFY3NDbHVzdGVyTmFtZScsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuZWNzQ2x1c3Rlci5jbHVzdGVyTmFtZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbWJlZGRpbmcgRUNTIENsdXN0ZXIgTmFtZScsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdFY3NDbHVzdGVyTmFtZWAsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VtYmVkZGluZ0Vjc0NsdXN0ZXJBcm4nLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLmVjc0NsdXN0ZXIuY2x1c3RlckFybixcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbWJlZGRpbmcgRUNTIENsdXN0ZXIgQVJOJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0Vjc0NsdXN0ZXJBcm5gLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRW1iZWRkaW5nIEJhdGNo57Wx5ZCI5oOF5aCxXG4gICAgaWYgKHRoaXMuZW1iZWRkaW5nQmF0Y2hJbnRlZ3JhdGlvbikge1xuICAgICAgY29uc3QgYmF0Y2hJbmZvID0gdGhpcy5lbWJlZGRpbmdCYXRjaEludGVncmF0aW9uLmdldEludGVncmF0aW9uSW5mbygpO1xuICAgICAgXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRW1iZWRkaW5nQmF0Y2hDb21wdXRlRW52aXJvbm1lbnROYW1lJywge1xuICAgICAgICB2YWx1ZTogYmF0Y2hJbmZvLmJhdGNoQ29uc3RydWN0LmNvbXB1dGVFbnZpcm9ubWVudCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbWJlZGRpbmcgQmF0Y2ggQ29tcHV0ZSBFbnZpcm9ubWVudCBOYW1lJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0JhdGNoQ29tcHV0ZUVudmlyb25tZW50TmFtZWAsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VtYmVkZGluZ0JhdGNoSm9iRGVmaW5pdGlvbk5hbWUnLCB7XG4gICAgICAgIHZhbHVlOiBiYXRjaEluZm8uYmF0Y2hDb25zdHJ1Y3Quam9iRGVmaW5pdGlvbixcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbWJlZGRpbmcgQmF0Y2ggSm9iIERlZmluaXRpb24gTmFtZScsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdCYXRjaEpvYkRlZmluaXRpb25OYW1lYCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRW1iZWRkaW5nQmF0Y2hKb2JRdWV1ZU5hbWUnLCB7XG4gICAgICAgIHZhbHVlOiBiYXRjaEluZm8uYmF0Y2hDb25zdHJ1Y3Quam9iUXVldWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW1iZWRkaW5nIEJhdGNoIEpvYiBRdWV1ZSBOYW1lJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0JhdGNoSm9iUXVldWVOYW1lYCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRW1iZWRkaW5nQmF0Y2hKb2JNYW5hZ2VyRnVuY3Rpb25OYW1lJywge1xuICAgICAgICB2YWx1ZTogYmF0Y2hJbmZvLmpvYk1hbmFnZXIuZnVuY3Rpb25OYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0VtYmVkZGluZyBCYXRjaCBKb2IgTWFuYWdlciBGdW5jdGlvbiBOYW1lJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0JhdGNoSm9iTWFuYWdlckZ1bmN0aW9uTmFtZWAsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb25Ub3BpY0FybicsIHtcbiAgICAgICAgdmFsdWU6IGJhdGNoSW5mby5tb25pdG9yaW5nLmludGVncmF0aW9uVG9waWMsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW1iZWRkaW5nIEJhdGNoIEludGVncmF0aW9uIFRvcGljIEFSTicsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdCYXRjaEludGVncmF0aW9uVG9waWNBcm5gLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQmF0Y2jntbHlkIjjg4bjgrnjg4jmg4XloLFcbiAgICBpZiAodGhpcy5iYXRjaEludGVncmF0aW9uVGVzdCkge1xuICAgICAgY29uc3QgdGVzdEluZm8gPSB0aGlzLmJhdGNoSW50ZWdyYXRpb25UZXN0LmdldFRlc3RJbmZvKCk7XG4gICAgICBcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFbWJlZGRpbmdCYXRjaFRlc3RSdW5uZXJGdW5jdGlvbk5hbWUnLCB7XG4gICAgICAgIHZhbHVlOiB0ZXN0SW5mby50ZXN0UnVubmVyLmZ1bmN0aW9uTmFtZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbWJlZGRpbmcgQmF0Y2ggVGVzdCBSdW5uZXIgRnVuY3Rpb24gTmFtZScsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdCYXRjaFRlc3RSdW5uZXJGdW5jdGlvbk5hbWVgLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFbWJlZGRpbmdCYXRjaFRlc3ROb3RpZmljYXRpb25Ub3BpY0FybicsIHtcbiAgICAgICAgdmFsdWU6IHRlc3RJbmZvLm1vbml0b3JpbmcudGVzdE5vdGlmaWNhdGlvblRvcGljLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0VtYmVkZGluZyBCYXRjaCBUZXN0IE5vdGlmaWNhdGlvbiBUb3BpYyBBUk4nLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRW1iZWRkaW5nQmF0Y2hUZXN0Tm90aWZpY2F0aW9uVG9waWNBcm5gLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFbWJlZGRpbmdCYXRjaFRlc3RMb2dHcm91cE5hbWUnLCB7XG4gICAgICAgIHZhbHVlOiB0ZXN0SW5mby5tb25pdG9yaW5nLnRlc3RMb2dHcm91cCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbWJlZGRpbmcgQmF0Y2ggVGVzdCBMb2cgR3JvdXAgTmFtZScsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdCYXRjaFRlc3RMb2dHcm91cE5hbWVgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU1FMaXRl6LKg6I236Kmm6aiT57Wx5ZCI5oOF5aCxXG4gICAgaWYgKHRoaXMuc3FsaXRlTG9hZFRlc3QpIHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTcWxpdGVFbWJlZGRpbmdFbnZpcm9ubWVudE5hbWUnLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLnNxbGl0ZUxvYWRUZXN0LmNvbXB1dGVFbnZpcm9ubWVudC5yZWYsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU1FMaXRlIEVtYmVkZGluZyBFbnZpcm9ubWVudCBOYW1lJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVNxbGl0ZUVtYmVkZGluZ0Vudmlyb25tZW50TmFtZWAsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NxbGl0ZUVtYmVkZGluZ0pvYlF1ZXVlTmFtZScsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuc3FsaXRlTG9hZFRlc3Quam9iUXVldWUucmVmLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NRTGl0ZSBFbWJlZGRpbmcgSm9iIFF1ZXVlIE5hbWUnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tU3FsaXRlRW1iZWRkaW5nSm9iUXVldWVOYW1lYCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3FsaXRlRW1iZWRkaW5nSm9iRGVmaW5pdGlvbkFybicsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuc3FsaXRlTG9hZFRlc3Quam9iRGVmaW5pdGlvbi5yZWYsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU1FMaXRlIEVtYmVkZGluZyBKb2IgRGVmaW5pdGlvbiBBUk4nLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tU3FsaXRlRW1iZWRkaW5nSm9iRGVmaW5pdGlvbkFybmAsXG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuc3FsaXRlTG9hZFRlc3Quc2NoZWR1bGVkUnVsZSkge1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3FsaXRlRW1iZWRkaW5nU2NoZWR1bGVkUnVsZUFybicsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5zcWxpdGVMb2FkVGVzdC5zY2hlZHVsZWRSdWxlLnJ1bGVBcm4sXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdTUUxpdGUgRW1iZWRkaW5nIFNjaGVkdWxlZCBSdWxlIEFSTicsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVNxbGl0ZUVtYmVkZGluZ1NjaGVkdWxlZFJ1bGVBcm5gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBXaW5kb3dzIFNRTGl0ZeiyoOiNt+ippumok+aDheWgsVxuICAgIGlmICh0aGlzLndpbmRvd3NTcWxpdGUpIHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXaW5kb3dzU3FsaXRlSW5zdGFuY2VJZCcsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMud2luZG93c1NxbGl0ZS5pbnN0YW5jZS5pbnN0YW5jZUlkLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dpbmRvd3MgU1FMaXRlIEluc3RhbmNlIElEJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVdpbmRvd3NTcWxpdGVJbnN0YW5jZUlkYCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2luZG93c1NxbGl0ZUluc3RhbmNlUHJpdmF0ZUlwJywge1xuICAgICAgICB2YWx1ZTogdGhpcy53aW5kb3dzU3FsaXRlLmluc3RhbmNlLmluc3RhbmNlUHJpdmF0ZUlwLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dpbmRvd3MgU1FMaXRlIEluc3RhbmNlIFByaXZhdGUgSVAnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tV2luZG93c1NxbGl0ZUluc3RhbmNlUHJpdmF0ZUlwYCxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy53aW5kb3dzU3FsaXRlLmJhc3Rpb25Ib3N0KSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTcWxpdGVCYXN0aW9uSG9zdFB1YmxpY0lwJywge1xuICAgICAgICAgIHZhbHVlOiB0aGlzLndpbmRvd3NTcWxpdGUuYmFzdGlvbkhvc3QuaW5zdGFuY2VQdWJsaWNJcCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NRTGl0ZSBCYXN0aW9uIEhvc3QgUHVibGljIElQJyxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tU3FsaXRlQmFzdGlvbkhvc3RQdWJsaWNJcGAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVtYmVkZGluZyBCZWRyb2NrIOODouODh+ODq+aDheWgsVxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuYmVkcm9ja01vZGVscykuZm9yRWFjaCgoW25hbWUsIG1vZGVsSWRdKSA9PiB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgRW1iZWRkaW5nQmVkcm9ja01vZGVsJHtuYW1lfUlkYCwge1xuICAgICAgICB2YWx1ZTogbW9kZWxJZCxcbiAgICAgICAgZGVzY3JpcHRpb246IGBFbWJlZGRpbmcgQmVkcm9jayBNb2RlbCAke25hbWV9IElEYCxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0JlZHJvY2tNb2RlbCR7bmFtZX1JZGAsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEVtYmVkZGluZ+mWouaVsOaDheWgsVxuICAgIGlmICh0aGlzLmVtYmVkZGluZ0Z1bmN0aW9uKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRW1iZWRkaW5nRnVuY3Rpb25OYW1lJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5lbWJlZGRpbmdGdW5jdGlvbi5mdW5jdGlvbk5hbWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW1iZWRkaW5nIEZ1bmN0aW9uIE5hbWUnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRW1iZWRkaW5nRnVuY3Rpb25OYW1lYCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRW1iZWRkaW5nRnVuY3Rpb25Bcm4nLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLmVtYmVkZGluZ0Z1bmN0aW9uLmZ1bmN0aW9uQXJuLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0VtYmVkZGluZyBGdW5jdGlvbiBBUk4nLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRW1iZWRkaW5nRnVuY3Rpb25Bcm5gLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+ODrOODmeODq+OBruOCv+OCsOioreWumu+8iOe1seS4gOWRveWQjeimj+WJh+mBqeeUqO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhcHBseVN0YWNrVGFncyhwcm9qZWN0TmFtZTogc3RyaW5nLCBlbnZpcm9ubWVudDogc3RyaW5nKTogdm9pZCB7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdQcm9qZWN0JywgcHJvamVjdE5hbWUpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdTdGFjaycsICdFbWJlZGRpbmdTdGFjaycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ29tcG9uZW50JywgJ0VtYmVkZGluZycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ29zdENlbnRlcicsIGAke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS1lbWJlZGRpbmdgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDku5bjga7jgrnjgr/jg4Pjgq/jgafkvb/nlKjjgZnjgovjgZ/jgoHjga5FbWJlZGRpbmfjg6rjgr3jg7zjgrnmg4XloLHjgpLlj5blvpdcbiAgICovXG4gIHB1YmxpYyBnZXRFbWJlZGRpbmdJbmZvKCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYW1iZGFGdW5jdGlvbnM6IHRoaXMubGFtYmRhRnVuY3Rpb25zLFxuICAgICAgZWNzQ2x1c3RlcjogdGhpcy5lY3NDbHVzdGVyLFxuICAgICAgYmF0Y2hKb2JRdWV1ZTogdGhpcy5iYXRjaEpvYlF1ZXVlLFxuICAgICAgYmVkcm9ja01vZGVsczogdGhpcy5iZWRyb2NrTW9kZWxzLFxuICAgICAgZW1iZWRkaW5nRnVuY3Rpb246IHRoaXMuZW1iZWRkaW5nRnVuY3Rpb24sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDnibnlrprjga5MYW1iZGHplqLmlbDjgpLlj5blvpdcbiAgICovXG4gIHB1YmxpYyBnZXRMYW1iZGFGdW5jdGlvbihuYW1lOiBzdHJpbmcpOiBjZGsuYXdzX2xhbWJkYS5GdW5jdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubGFtYmRhRnVuY3Rpb25zW25hbWVdO1xuICB9XG5cbiAgLyoqXG4gICAqIOeJueWumuOBrkJlZHJvY2vjg6Ljg4fjg6tJROOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldEJlZHJvY2tNb2RlbElkKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuYmVkcm9ja01vZGVsc1tuYW1lXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMYW1iZGHplqLmlbDnlKjjga5JQU3jg53jg6rjgrfjg7zjgrnjg4bjg7zjg4jjg6Hjg7Pjg4jjgpLnlJ/miJBcbiAgICovXG4gIHB1YmxpYyBnZXRMYW1iZGFFeGVjdXRpb25Qb2xpY3lTdGF0ZW1lbnRzKCk6IGNkay5hd3NfaWFtLlBvbGljeVN0YXRlbWVudFtdIHtcbiAgICBjb25zdCBzdGF0ZW1lbnRzOiBjZGsuYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnRbXSA9IFtdO1xuXG4gICAgLy8gQmVkcm9jayDjgqLjgq/jgrvjgrnmqKnpmZBcbiAgICBzdGF0ZW1lbnRzLnB1c2gobmV3IGNkay5hd3NfaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGNkay5hd3NfaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWwnLFxuICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbFdpdGhSZXNwb25zZVN0cmVhbScsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBPYmplY3QudmFsdWVzKHRoaXMuYmVkcm9ja01vZGVscykubWFwKG1vZGVsSWQgPT4gXG4gICAgICAgIGBhcm46YXdzOmJlZHJvY2s6JHt0aGlzLnJlZ2lvbn06OmZvdW5kYXRpb24tbW9kZWwvJHttb2RlbElkfWBcbiAgICAgICksXG4gICAgfSkpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2dzIOOCouOCr+OCu+OCueaoqemZkFxuICAgIHN0YXRlbWVudHMucHVzaChuZXcgY2RrLmF3c19pYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogY2RrLmF3c19pYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbYGFybjphd3M6bG9nczoke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06KmBdLFxuICAgIH0pKTtcblxuICAgIC8vIFgtUmF5IOODiOODrOODvOOCt+ODs+OCsOaoqemZkFxuICAgIHN0YXRlbWVudHMucHVzaChuZXcgY2RrLmF3c19pYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogY2RrLmF3c19pYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAneHJheTpQdXRUcmFjZVNlZ21lbnRzJyxcbiAgICAgICAgJ3hyYXk6UHV0VGVsZW1ldHJ5UmVjb3JkcycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gc3RhdGVtZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBFQ1Mg44K/44K544Kv55So44GuSUFN44Od44Oq44K344O844K544OG44O844OI44Oh44Oz44OI44KS55Sf5oiQXG4gICAqL1xuICBwdWJsaWMgZ2V0RWNzVGFza1BvbGljeVN0YXRlbWVudHMoKTogY2RrLmF3c19pYW0uUG9saWN5U3RhdGVtZW50W10ge1xuICAgIGNvbnN0IHN0YXRlbWVudHM6IGNkay5hd3NfaWFtLlBvbGljeVN0YXRlbWVudFtdID0gW107XG5cbiAgICAvLyBFQ1Mg44K/44K544Kv5a6f6KGM5qip6ZmQXG4gICAgc3RhdGVtZW50cy5wdXNoKG5ldyBjZGsuYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBjZGsuYXdzX2lhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdlY3I6R2V0QXV0aG9yaXphdGlvblRva2VuJyxcbiAgICAgICAgJ2VjcjpCYXRjaENoZWNrTGF5ZXJBdmFpbGFiaWxpdHknLFxuICAgICAgICAnZWNyOkdldERvd25sb2FkVXJsRm9yTGF5ZXInLFxuICAgICAgICAnZWNyOkJhdGNoR2V0SW1hZ2UnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2dzIOOCouOCr+OCu+OCueaoqemZkFxuICAgIHN0YXRlbWVudHMucHVzaChuZXcgY2RrLmF3c19pYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogY2RrLmF3c19pYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOmxvZ3M6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OmxvZy1ncm91cDovZWNzLypgXSxcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gc3RhdGVtZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXRjaOe1seWQiOaDheWgseOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldEJhdGNoSW50ZWdyYXRpb25JbmZvKCk6IFJlY29yZDxzdHJpbmcsIGFueT4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmVtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb24/LmdldEludGVncmF0aW9uSW5mbygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhdGNo44K444On44OW44KS5a6f6KGMXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgc3VibWl0QmF0Y2hKb2Ioam9iTmFtZTogc3RyaW5nLCBwYXJhbWV0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gdGhpcy5lbWJlZGRpbmdCYXRjaEludGVncmF0aW9uPy5zdWJtaXRFbWJlZGRpbmdKb2Ioam9iTmFtZSwgcGFyYW1ldGVycyk7XG4gIH1cblxuICAvKipcbiAgICogQmF0Y2jjgrjjg6fjg5bnirbms4HjgpLlj5blvpdcbiAgICovXG4gIHB1YmxpYyBnZXRCYXRjaEpvYlN0YXR1cygpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5lbWJlZGRpbmdCYXRjaEludGVncmF0aW9uPy5nZXRKb2JTdGF0dXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXRjaOe1seWQiOODhuOCueODiOWun+ihjFxuICAgKi9cbiAgcHVibGljIGFzeW5jIHJ1bkJhdGNoSW50ZWdyYXRpb25UZXN0KHRlc3RUeXBlOiAnYmFzaWMnIHwgJ2ZzeCcgfCAncmVjb3ZlcnknID0gJ2Jhc2ljJyk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKCF0aGlzLmJhdGNoSW50ZWdyYXRpb25UZXN0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHN3aXRjaCAodGVzdFR5cGUpIHtcbiAgICAgIGNhc2UgJ2Jhc2ljJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuYmF0Y2hJbnRlZ3JhdGlvblRlc3QucnVuQmFzaWNUZXN0KCk7XG4gICAgICBjYXNlICdmc3gnOlxuICAgICAgICByZXR1cm4gdGhpcy5iYXRjaEludGVncmF0aW9uVGVzdC5ydW5Gc3hNb3VudFRlc3QoKTtcbiAgICAgIGNhc2UgJ3JlY292ZXJ5JzpcbiAgICAgICAgcmV0dXJuIHRoaXMuYmF0Y2hJbnRlZ3JhdGlvblRlc3QucnVuQXV0b1JlY292ZXJ5VGVzdCgpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMuYmF0Y2hJbnRlZ3JhdGlvblRlc3QucnVuQmFzaWNUZXN0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVtYmVkZGluZ+ioreWumuOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldEVtYmVkZGluZ0NvbmZpZygpOiBFbWJlZGRpbmdDb25maWcge1xuICAgIHJldHVybiB0aGlzLmVtYmVkZGluZ0NvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiBTUUxpdGXosqDojbfoqabpqJPjgrjjg6fjg5bjgpLlrp/ooYxcbiAgICovXG4gIHB1YmxpYyBzdWJtaXRTcWxpdGVMb2FkVGVzdEpvYihqb2JOYW1lPzogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuc3FsaXRlTG9hZFRlc3QpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNxbGl0ZUxvYWRUZXN0LnN1Ym1pdEpvYihqb2JOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTUUxpdGXosqDojbfoqabpqJPntbHlkIjmg4XloLHjgpLlj5blvpdcbiAgICovXG4gIHB1YmxpYyBnZXRTcWxpdGVMb2FkVGVzdEluZm8oKTogUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLnNxbGl0ZUxvYWRUZXN0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb21wdXRlRW52aXJvbm1lbnQ6IHRoaXMuc3FsaXRlTG9hZFRlc3QuY29tcHV0ZUVudmlyb25tZW50LnJlZixcbiAgICAgIGpvYlF1ZXVlOiB0aGlzLnNxbGl0ZUxvYWRUZXN0LmpvYlF1ZXVlLnJlZixcbiAgICAgIGpvYkRlZmluaXRpb246IHRoaXMuc3FsaXRlTG9hZFRlc3Quam9iRGVmaW5pdGlvbi5yZWYsXG4gICAgICBsb2dHcm91cDogdGhpcy5zcWxpdGVMb2FkVGVzdC5sb2dHcm91cC5sb2dHcm91cE5hbWUsXG4gICAgICBzY2hlZHVsZWRSdWxlOiB0aGlzLnNxbGl0ZUxvYWRUZXN0LnNjaGVkdWxlZFJ1bGU/LnJ1bGVBcm4sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaW5kb3dzIFNRTGl0ZeiyoOiNt+ippumok+aDheWgseOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldFdpbmRvd3NTcWxpdGVJbmZvKCk6IFJlY29yZDxzdHJpbmcsIGFueT4gfCB1bmRlZmluZWQge1xuICAgIGlmICghdGhpcy53aW5kb3dzU3FsaXRlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBpbnN0YW5jZUlkOiB0aGlzLndpbmRvd3NTcWxpdGUuaW5zdGFuY2UuaW5zdGFuY2VJZCxcbiAgICAgIHByaXZhdGVJcDogdGhpcy53aW5kb3dzU3FsaXRlLmluc3RhbmNlLmluc3RhbmNlUHJpdmF0ZUlwLFxuICAgICAgYmFzdGlvbkhvc3RQdWJsaWNJcDogdGhpcy53aW5kb3dzU3FsaXRlLmJhc3Rpb25Ib3N0Py5pbnN0YW5jZVB1YmxpY0lwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ0RL44Kz44Oz44OG44Kt44K544OI6Kit5a6a5L6L44KS5Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGdldENvbnRleHRFeGFtcGxlKGVudmlyb25tZW50OiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdE5hbWU6ICdwZXJtaXNzaW9uLWF3YXJlLXJhZycsXG4gICAgICBlbnZpcm9ubWVudCxcbiAgICAgIHJlZ2lvbjogJ2FwLW5vcnRoZWFzdC0xJyxcbiAgICAgIFxuICAgICAgLy8gRW1iZWRkaW5nIEJhdGNo6Kit5a6aXG4gICAgICAnZW1iZWRkaW5nOmVuYWJsZUF3c0JhdGNoJzogdHJ1ZSxcbiAgICAgICdlbWJlZGRpbmc6ZW5hYmxlRWNzT25FQzInOiBmYWxzZSxcbiAgICAgICdlbWJlZGRpbmc6ZW5hYmxlU3BvdEZsZWV0JzogZmFsc2UsXG4gICAgICAnZW1iZWRkaW5nOmVuYWJsZU1vbml0b3JpbmcnOiB0cnVlLFxuICAgICAgJ2VtYmVkZGluZzplbmFibGVBdXRvU2NhbGluZyc6IHRydWUsXG4gICAgICBcbiAgICAgIC8vIEJhdGNo6Kit5a6aXG4gICAgICAnZW1iZWRkaW5nOmJhdGNoOm5hbWVQcmVmaXgnOiBgJHtlbnZpcm9ubWVudH0tZW1iZWRkaW5nLWJhdGNoYCxcbiAgICAgICdlbWJlZGRpbmc6YmF0Y2g6aW1hZ2VVcmknOiBgMTIzNDU2Nzg5MDEyLmRrci5lY3IuYXAtbm9ydGhlYXN0LTEuYW1hem9uYXdzLmNvbS9lbWJlZGRpbmctc2VydmVyOiR7ZW52aXJvbm1lbnR9YCxcbiAgICAgICdlbWJlZGRpbmc6YmF0Y2g6dmNwdXMnOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gNCA6IDIsXG4gICAgICAnZW1iZWRkaW5nOmJhdGNoOm1lbW9yeSc6IGVudmlyb25tZW50ID09PSAncHJvZCcgPyA4MTkyIDogNDA5NixcbiAgICAgICdlbWJlZGRpbmc6YmF0Y2g6dXNlU3BvdEluc3RhbmNlcyc6IGVudmlyb25tZW50ICE9PSAncHJvZCcsXG4gICAgICBcbiAgICAgIC8vIEpvYiBEZWZpbml0aW9u6Kit5a6aXG4gICAgICAnZW1iZWRkaW5nOmpvYkRlZmluaXRpb246bmFtZSc6IGAke2Vudmlyb25tZW50fS1lbWJlZGRpbmctam9iLWRlZmluaXRpb25gLFxuICAgICAgJ2VtYmVkZGluZzpqb2JEZWZpbml0aW9uOmNwdSc6IGVudmlyb25tZW50ID09PSAncHJvZCcgPyA0IDogMixcbiAgICAgICdlbWJlZGRpbmc6am9iRGVmaW5pdGlvbjptZW1vcnlNaUInOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gODE5MiA6IDQwOTYsXG4gICAgICAnZW1iZWRkaW5nOmpvYkRlZmluaXRpb246dGltZW91dEhvdXJzJzogMSxcbiAgICAgICdlbWJlZGRpbmc6am9iRGVmaW5pdGlvbjpyZXRyeUF0dGVtcHRzJzogMyxcbiAgICAgIFxuICAgICAgLy8gRlN457Wx5ZCI6Kit5a6aXG4gICAgICAnZW1iZWRkaW5nOmZzeDpmaWxlU3lzdGVtSWQnOiAnZnMtMDEyMzQ1Njc4OWFiY2RlZjAnLFxuICAgICAgJ2VtYmVkZGluZzpmc3g6Y2lmc2RhdGFWb2xOYW1lJzogJ3NtYl9zaGFyZScsXG4gICAgICAnZW1iZWRkaW5nOmZzeDpyYWdkYlZvbFBhdGgnOiAnL3NtYl9zaGFyZS9yYWdkYicsXG4gICAgICBcbiAgICAgIC8vIEFjdGl2ZSBEaXJlY3RvcnnoqK3lrppcbiAgICAgICdlbWJlZGRpbmc6YWQ6ZG9tYWluJzogJ2V4YW1wbGUuY29tJyxcbiAgICAgICdlbWJlZGRpbmc6YWQ6dXNlcm5hbWUnOiAnYWRtaW4nLFxuICAgICAgJ2VtYmVkZGluZzphZDpwYXNzd29yZFNlY3JldEFybic6ICdhcm46YXdzOnNlY3JldHNtYW5hZ2VyOmFwLW5vcnRoZWFzdC0xOjEyMzQ1Njc4OTAxMjpzZWNyZXQ6YWQtcGFzc3dvcmQtYWJjMTIzJyxcbiAgICAgIFxuICAgICAgLy8gQmVkcm9ja+ioreWumlxuICAgICAgJ2VtYmVkZGluZzpiZWRyb2NrOnJlZ2lvbic6ICd1cy1lYXN0LTEnLFxuICAgICAgJ2VtYmVkZGluZzpiZWRyb2NrOm1vZGVsSWQnOiAnYW1hem9uLnRpdGFuLWVtYmVkLXRleHQtdjEnLFxuICAgICAgXG4gICAgICAvLyBPcGVuU2VhcmNo6Kit5a6aXG4gICAgICAnZW1iZWRkaW5nOm9wZW5TZWFyY2g6Y29sbGVjdGlvbk5hbWUnOiBgJHtlbnZpcm9ubWVudH0tZW1iZWRkaW5nLWNvbGxlY3Rpb25gLFxuICAgICAgJ2VtYmVkZGluZzpvcGVuU2VhcmNoOmluZGV4TmFtZSc6ICdkb2N1bWVudHMnLFxuICAgICAgXG4gICAgICAvLyDnm6PoppboqK3lrppcbiAgICAgICdlbWJlZGRpbmc6bW9uaXRvcmluZzphbGVydHM6ZW5hYmxlZCc6IHRydWUsXG4gICAgICAnZW1iZWRkaW5nOm1vbml0b3Jpbmc6Y2xvdWRXYXRjaDpjcmVhdGVEYXNoYm9hcmQnOiB0cnVlLFxuICAgICAgJ2VtYmVkZGluZzptb25pdG9yaW5nOnhyYXk6dHJhY2luZ0VuYWJsZWQnOiB0cnVlLFxuICAgIH07XG4gIH1cbn0iXX0=