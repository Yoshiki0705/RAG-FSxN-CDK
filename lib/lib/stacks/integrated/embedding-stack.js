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
// AWS CDK コアライブラリ
const cdk = __importStar(require("aws-cdk-lib"));
// モジュール構成要素
const compute_construct_1 = require("../../modules/embedding/constructs/compute-construct");
const ai_construct_1 = require("../../modules/ai/constructs/ai-construct");
const embedding_batch_integration_1 = require("../../modules/embedding/constructs/embedding-batch-integration");
const batch_integration_test_1 = require("../../modules/embedding/constructs/batch-integration-test");
const sqlite_load_test_1 = require("../../modules/embedding/constructs/sqlite-load-test");
const windows_sqlite_1 = require("../../modules/embedding/constructs/windows-sqlite");
// 設定ファクトリー・戦略
const embedding_config_factory_1 = require("../../config/environments/embedding-config-factory");
const tagging_config_1 = require("../../config/tagging-config");
class EmbeddingStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // コスト配布タグの適用（AWS Batch専用タグを含む）
        const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(props.projectName, props.environment);
        tagging_config_1.TaggingStrategy.applyTagsToStack(this, taggingConfig);
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
