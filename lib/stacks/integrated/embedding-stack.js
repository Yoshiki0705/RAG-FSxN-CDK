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
const bedrock_agent_construct_1 = require("../../modules/ai/constructs/bedrock-agent-construct");
const sqlite_load_test_1 = require("../../modules/embedding/constructs/sqlite-load-test");
const windows_sqlite_1 = require("../../modules/embedding/constructs/windows-sqlite");
const agent_instruction_1 = require("../../modules/ai/prompts/agent-instruction");
// 設定ファクトリー・戦略（一時的にコメントアウト）
// import { EmbeddingConfigFactory } from '../../config/environments/embedding-config-factory';
const tagging_config_1 = require("../../config/tagging-config");
class EmbeddingStack extends cdk.Stack {
    // AI/ML統合（既存実装を保持）
    aiConstruct;
    // Embedding Batch統合（既存実装を保持）
    embeddingBatchIntegration;
    batchIntegrationTest;
    embeddingConfig;
    // SQLite負荷試験コンストラクト（既存実装を保持）
    sqliteLoadTest;
    windowsSqlite;
    // Embeddingリソース（既存実装を保持）
    lambdaFunctions;
    ecsCluster;
    batchJobQueue;
    // AI/MLリソース（既存実装を保持）
    bedrockModels;
    embeddingFunction;
    // Bedrock Agent（Phase 4統合 - 新機能）
    bedrockAgent;
    agentArn;
    agentAliasArn;
    // Bedrock Guardrails（Phase 5 - SecurityStackから取得）
    guardrailArn;
    constructor(scope, id, props) {
        super(scope, id, props);
        // コスト配布タグの適用（AWS Batch専用タグを含む）
        const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(props.projectName, props.environment);
        tagging_config_1.TaggingStrategy.applyTagsToStack(this, taggingConfig);
        const { aiConfig, embeddingConfig, projectName, environment, vpcId, privateSubnetIds, securityGroupIds, kmsKeyArn, s3BucketArns, dynamoDbTableArns, openSearchCollectionArn, enableBatchIntegration = true, enableBatchTesting = false, imagePath = 'embedding-server', imageTag = 'latest', 
        // SQLite負荷試験設定
        enableSqliteLoadTest = false, enableWindowsLoadTest = false, fsxFileSystemId, fsxSvmId, fsxVolumeId, fsxMountPath, fsxNfsEndpoint, fsxCifsEndpoint, fsxCifsShareName, keyPairName, bedrockRegion, bedrockModelId, scheduleExpression, maxvCpus, instanceTypes, windowsInstanceType } = props;
        // Embedding設定の初期化（既存実装を保持）
        // EmbeddingConfigFactoryは依存関係の問題があるため、propsから直接取得
        this.embeddingConfig = embeddingConfig;
        // 共通リソース設定（既存実装を保持）
        const commonResources = this.createCommonResources(props);
        // AI Embeddingコンストラクト作成（既存実装を保持 - オプション）
        // AIConstructは依存関係の問題があるため、一時的にスキップ
        // if (aiConfig) {
        //   try {
        //     this.aiConstruct = new AIConstruct(this, 'EmbeddingAiConstruct', {
        //       config: aiConfig,
        //       projectName,
        //       environment,
        //       kmsKey: kmsKeyArn,
        //     });
        //   } catch (error) {
        //     console.warn('AIConstruct初期化をスキップ:', error);
        //   }
        // }
        // AWS Batch統合（既存実装を保持 - オプション）
        // EmbeddingConfigの型の問題があるため、一時的にスキップ
        // if (enableBatchIntegration && this.embeddingConfig?.awsBatch?.enabled) {
        //   try {
        //     this.embeddingBatchIntegration = new EmbeddingBatchIntegration(this, 'EmbeddingBatchIntegration', {
        //       config: this.embeddingConfig,
        //       projectName,
        //       environment,
        //       commonResources,
        //       imagePath,
        //       imageTag,
        //     });
        //     if (enableBatchTesting) {
        //       this.batchIntegrationTest = new BatchIntegrationTest(this, 'BatchIntegrationTest', {
        //         batchIntegration: this.embeddingBatchIntegration,
        //         config: this.embeddingConfig,
        //         projectName,
        //         environment,
        //         notificationTopicArn: this.embeddingConfig.monitoring?.alerts?.snsTopicArn,
        //       });
        //     }
        //   } catch (error) {
        //     console.warn('Batch統合の初期化をスキップ:', error);
        //   }
        // }
        // SQLite負荷試験統合（既存実装を保持 - オプション）
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
                // Windows SQLite負荷試験（既存実装を保持 - オプション）
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
                console.warn('SQLite負荷試験統合の初期化をスキップ:', error);
                // SQLite負荷試験の初期化に失敗してもスタック全体は継続
            }
        }
        // Bedrock Agent統合（Phase 4 - 有効化されている場合）
        const useBedrockAgent = this.node.tryGetContext('useBedrockAgent') ?? props.useBedrockAgent ?? false;
        if (useBedrockAgent) {
            this.bedrockAgent = this.createBedrockAgent(props);
            this.agentArn = this.bedrockAgent.agentArn;
            this.agentAliasArn = this.bedrockAgent.agentAliasArn;
        }
        // 主要リソースの参照を設定（既存実装を保持）
        this.lambdaFunctions = {};
        this.ecsCluster = undefined;
        this.batchJobQueue = undefined;
        this.bedrockModels = {};
        this.embeddingFunction = undefined;
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
     * 共通ロググループ作成（既存実装を保持）
     */
    createCommonLogGroup() {
        const logGroupName = this.embeddingConfig
            ? `/aws/embedding/${this.embeddingConfig.projectName}-${this.embeddingConfig.environment}`
            : `/aws/embedding/default`;
        return new cdk.aws_logs.LogGroup(this, 'EmbeddingCommonLogGroup', {
            logGroupName,
            retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
    /**
     * CloudFormation出力の作成（統一命名規則適用）
     * 既存実装を保持 + Phase 4のBedrock Agent統合
     */
    createOutputs() {
        // Embedding Lambda 関数情報（既存実装を保持）
        if (this.lambdaFunctions && Object.keys(this.lambdaFunctions).length > 0) {
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
        }
        // Embedding ECS クラスター情報（既存実装を保持）
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
        // Embedding Batch統合情報（既存実装を保持）
        if (this.embeddingBatchIntegration) {
            const batchInfo = this.embeddingBatchIntegration.getIntegrationInfo();
            new cdk.CfnOutput(this, 'EmbeddingBatchComputeEnvironmentName', {
                value: batchInfo.batchConstruct.computeEnvironment,
                description: 'Embedding Batch Compute Environment Name',
                exportName: `${this.stackName}-EmbeddingBatchComputeEnvironmentName`,
            });
            new cdk.CfnOutput(this, 'EmbeddingBatchJobQueueName', {
                value: batchInfo.batchConstruct.jobQueue,
                description: 'Embedding Batch Job Queue Name',
                exportName: `${this.stackName}-EmbeddingBatchJobQueueName`,
            });
        }
        // Embedding Bedrock モデル情報（既存実装を保持）
        if (this.bedrockModels && Object.keys(this.bedrockModels).length > 0) {
            Object.entries(this.bedrockModels).forEach(([name, modelId]) => {
                new cdk.CfnOutput(this, `EmbeddingBedrockModel${name}Id`, {
                    value: modelId,
                    description: `Embedding Bedrock Model ${name} ID`,
                    exportName: `${this.stackName}-EmbeddingBedrockModel${name}Id`,
                });
            });
        }
        // Embedding関数情報（既存実装を保持）
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
        // Bedrock Agent情報（Phase 4統合）
        if (this.bedrockAgent) {
            new cdk.CfnOutput(this, 'RAGMode', {
                value: 'agent',
                description: 'RAG Mode (agent or knowledge-base)',
                exportName: `${this.stackName}-RAGMode`,
            });
            new cdk.CfnOutput(this, 'BedrockAgentArn', {
                value: this.agentArn || 'N/A',
                description: 'Bedrock Agent ARN',
                exportName: `${this.stackName}-BedrockAgentArn`,
            });
            new cdk.CfnOutput(this, 'BedrockAgentAliasArn', {
                value: this.agentAliasArn || 'N/A',
                description: 'Bedrock Agent Alias ARN',
                exportName: `${this.stackName}-BedrockAgentAliasArn`,
            });
        }
        else {
            new cdk.CfnOutput(this, 'RAGMode', {
                value: 'knowledge-base',
                description: 'RAG Mode (agent or knowledge-base)',
                exportName: `${this.stackName}-RAGMode`,
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
     * Batch統合情報を取得（既存実装を保持）
     */
    getBatchIntegrationInfo() {
        return this.embeddingBatchIntegration?.getIntegrationInfo();
    }
    /**
     * Batchジョブを実行（既存実装を保持）
     */
    async submitBatchJob(jobName, parameters) {
        return this.embeddingBatchIntegration?.submitEmbeddingJob(jobName, parameters);
    }
    /**
     * Batchジョブ状況を取得（既存実装を保持）
     */
    getBatchJobStatus() {
        return this.embeddingBatchIntegration?.getJobStatus();
    }
    /**
     * Batch統合テスト実行（既存実装を保持）
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
     * Embedding設定を取得（既存実装を保持）
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
     * Bedrock Agent作成（Phase 4統合）
     */
    createBedrockAgent(props) {
        // Agent Instruction取得
        const instruction = (0, agent_instruction_1.getAgentInstruction)(props.agentInstructionPreset || 'standard');
        // Action Groups設定
        const actionGroups = props.documentSearchLambdaArn
            ? [
                {
                    actionGroupName: 'document_search',
                    description: '権限認識型文書検索',
                    actionGroupExecutor: props.documentSearchLambdaArn,
                    apiSchema: {
                        payload: JSON.stringify(require('../../../lambda/bedrock-agent-actions/document-search-schema.json')),
                    },
                },
            ]
            : undefined;
        return new bedrock_agent_construct_1.BedrockAgentConstruct(this, 'BedrockAgent', {
            enabled: true,
            projectName: props.projectName,
            environment: props.environment,
            agentName: `${props.projectName}-${props.environment}-rag-agent`,
            agentDescription: '権限認識型RAGシステムのAIアシスタント',
            foundationModel: props.foundationModel || 'anthropic.claude-v2',
            instruction: instruction,
            knowledgeBaseArn: props.knowledgeBaseArn,
            actionGroups: actionGroups,
            idleSessionTTLInSeconds: 600,
            // Guardrails適用（Phase 5 - SecurityStackから取得）
            guardrailArn: props.guardrailArn,
            guardrailVersion: props.guardrailArn ? 'DRAFT' : undefined,
        });
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
            // Bedrock Agent設定（Phase 4）
            'useBedrockAgent': false, // デフォルト: Knowledge Baseモード
            'agentInstructionPreset': 'standard', // standard, financial, healthcare
            'foundationModel': 'anthropic.claude-v2',
        };
    }
}
exports.EmbeddingStack = EmbeddingStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWRkaW5nLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW1iZWRkaW5nLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsa0JBQWtCO0FBQ2xCLGlEQUFtQztBQUtuQyxpR0FBNEY7QUFHNUYsMEZBQXFGO0FBQ3JGLHNGQUFrRjtBQUNsRixrRkFBaUY7QUFPakYsMkJBQTJCO0FBQzNCLCtGQUErRjtBQUMvRixnRUFBc0Y7QUFrRHRGLE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzNDLG1CQUFtQjtJQUNILFdBQVcsQ0FBZTtJQUUxQyw2QkFBNkI7SUFDYix5QkFBeUIsQ0FBNkI7SUFDdEQsb0JBQW9CLENBQXdCO0lBQzVDLGVBQWUsQ0FBbUI7SUFFbEQsNkJBQTZCO0lBQ2IsY0FBYyxDQUFrQjtJQUNoQyxhQUFhLENBQWlCO0lBRTlDLHlCQUF5QjtJQUNULGVBQWUsQ0FBNkM7SUFDNUQsVUFBVSxDQUF1QjtJQUNqQyxhQUFhLENBQTBCO0lBRXZELHFCQUFxQjtJQUNMLGFBQWEsQ0FBNEI7SUFDekMsaUJBQWlCLENBQTJCO0lBRTVELGlDQUFpQztJQUNqQixZQUFZLENBQXlCO0lBQ3JDLFFBQVEsQ0FBVTtJQUNsQixhQUFhLENBQVU7SUFFdkMsa0RBQWtEO0lBQ2xDLFlBQVksQ0FBVTtJQUV0QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTBCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLCtCQUErQjtRQUMvQixNQUFNLGFBQWEsR0FBRyx1Q0FBc0IsQ0FBQyxpQkFBaUIsQ0FDNUQsS0FBSyxDQUFDLFdBQVcsRUFDakIsS0FBSyxDQUFDLFdBQVcsQ0FDbEIsQ0FBQztRQUNGLGdDQUFlLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFD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KiBcbiAqIOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo+OBq+WfuuOBpeOBj0VtYmVkZGluZ+ODu0FJ57Wx5ZCI566h55CGXG4gKiAtIExhbWJkYSDplqLmlbDvvIhFbWJlZGRpbmflh6bnkIbvvIlcbiAqIC0gQUkvTUwg44K144O844OT44K5IChCZWRyb2NrKVxuICogLSDjg5Djg4Pjg4Hlh6bnkIbvvIhBV1MgQmF0Y2jvvIlcbiAqIC0g44Kz44Oz44OG44OK44K144O844OT44K5IChFQ1MpXG4gKiAtIOe1seS4gOWRveWQjeimj+WJhzogQ29tcG9uZW50PVwiRW1iZWRkaW5nXCJcbiAqL1xuXG4vLyBBV1MgQ0RLIOOCs+OCouODqeOCpOODluODqeODqlxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vLyDjg6Ljgrjjg6Xjg7zjg6vmp4vmiJDopoHntKBcbmltcG9ydCB7IEFJQ29uc3RydWN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9haS9jb25zdHJ1Y3RzL2FpLWNvbnN0cnVjdCc7XG5pbXBvcnQgeyBCZWRyb2NrQWdlbnRDb25zdHJ1Y3QgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2FpL2NvbnN0cnVjdHMvYmVkcm9jay1hZ2VudC1jb25zdHJ1Y3QnO1xuaW1wb3J0IHsgRW1iZWRkaW5nQmF0Y2hJbnRlZ3JhdGlvbiB9IGZyb20gJy4uLy4uL21vZHVsZXMvZW1iZWRkaW5nL2NvbnN0cnVjdHMvZW1iZWRkaW5nLWJhdGNoLWludGVncmF0aW9uJztcbmltcG9ydCB7IEJhdGNoSW50ZWdyYXRpb25UZXN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9lbWJlZGRpbmcvY29uc3RydWN0cy9iYXRjaC1pbnRlZ3JhdGlvbi10ZXN0JztcbmltcG9ydCB7IFNxbGl0ZUxvYWRUZXN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9lbWJlZGRpbmcvY29uc3RydWN0cy9zcWxpdGUtbG9hZC10ZXN0JztcbmltcG9ydCB7IFdpbmRvd3NTcWxpdGUgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2VtYmVkZGluZy9jb25zdHJ1Y3RzL3dpbmRvd3Mtc3FsaXRlJztcbmltcG9ydCB7IGdldEFnZW50SW5zdHJ1Y3Rpb24gfSBmcm9tICcuLi8uLi9tb2R1bGVzL2FpL3Byb21wdHMvYWdlbnQtaW5zdHJ1Y3Rpb24nO1xuXG4vLyDjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrnjg7voqK3lrppcbmltcG9ydCB7IEFpQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9haS9pbnRlcmZhY2VzL2FpLWNvbmZpZyc7XG5pbXBvcnQgeyBFbWJlZGRpbmdDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2FpL2ludGVyZmFjZXMvZW1iZWRkaW5nLWNvbmZpZyc7XG5pbXBvcnQgeyBFbWJlZGRpbmdDb21tb25SZXNvdXJjZXMgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2VtYmVkZGluZy9pbnRlcmZhY2VzL21vZHVsZS1pbnRlcmZhY2VzJztcblxuLy8g6Kit5a6a44OV44Kh44Kv44OI44Oq44O844O75oim55Wl77yI5LiA5pmC55qE44Gr44Kz44Oh44Oz44OI44Ki44Km44OI77yJXG4vLyBpbXBvcnQgeyBFbWJlZGRpbmdDb25maWdGYWN0b3J5IH0gZnJvbSAnLi4vLi4vY29uZmlnL2Vudmlyb25tZW50cy9lbWJlZGRpbmctY29uZmlnLWZhY3RvcnknO1xuaW1wb3J0IHsgVGFnZ2luZ1N0cmF0ZWd5LCBQZXJtaXNzaW9uQXdhcmVSQUdUYWdzIH0gZnJvbSAnLi4vLi4vY29uZmlnL3RhZ2dpbmctY29uZmlnJztcblxuZXhwb3J0IGludGVyZmFjZSBFbWJlZGRpbmdTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBhaUNvbmZpZzogQWlDb25maWc7XG4gIGVtYmVkZGluZ0NvbmZpZz86IEVtYmVkZGluZ0NvbmZpZztcbiAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgdnBjSWQ/OiBzdHJpbmc7XG4gIHByaXZhdGVTdWJuZXRJZHM/OiBzdHJpbmdbXTtcbiAgc2VjdXJpdHlHcm91cElkcz86IHN0cmluZ1tdO1xuICBrbXNLZXlBcm4/OiBzdHJpbmc7XG4gIHMzQnVja2V0QXJucz86IHN0cmluZ1tdO1xuICBkeW5hbW9EYlRhYmxlQXJucz86IHN0cmluZ1tdO1xuICBvcGVuU2VhcmNoQ29sbGVjdGlvbkFybj86IHN0cmluZztcbiAgXG4gIC8vIOaWsOOBl+OBhEVtYmVkZGluZ+ioreWumlxuICBlbmFibGVCYXRjaEludGVncmF0aW9uPzogYm9vbGVhbjtcbiAgZW5hYmxlQmF0Y2hUZXN0aW5nPzogYm9vbGVhbjtcbiAgaW1hZ2VQYXRoPzogc3RyaW5nO1xuICBpbWFnZVRhZz86IHN0cmluZztcbiAgXG4gIC8vIFNRTGl0ZeiyoOiNt+ippumok+ioreWumlxuICBlbmFibGVTcWxpdGVMb2FkVGVzdD86IGJvb2xlYW47XG4gIGVuYWJsZVdpbmRvd3NMb2FkVGVzdD86IGJvb2xlYW47XG4gIGZzeEZpbGVTeXN0ZW1JZD86IHN0cmluZztcbiAgZnN4U3ZtSWQ/OiBzdHJpbmc7XG4gIGZzeFZvbHVtZUlkPzogc3RyaW5nO1xuICBmc3hNb3VudFBhdGg/OiBzdHJpbmc7XG4gIGZzeE5mc0VuZHBvaW50Pzogc3RyaW5nO1xuICBmc3hDaWZzRW5kcG9pbnQ/OiBzdHJpbmc7XG4gIGZzeENpZnNTaGFyZU5hbWU/OiBzdHJpbmc7XG4gIGtleVBhaXJOYW1lPzogc3RyaW5nO1xuICBiZWRyb2NrUmVnaW9uPzogc3RyaW5nO1xuICBiZWRyb2NrTW9kZWxJZD86IHN0cmluZztcbiAgc2NoZWR1bGVFeHByZXNzaW9uPzogc3RyaW5nO1xuICBtYXh2Q3B1cz86IG51bWJlcjtcbiAgaW5zdGFuY2VUeXBlcz86IHN0cmluZ1tdO1xuICB3aW5kb3dzSW5zdGFuY2VUeXBlPzogc3RyaW5nO1xuICBcbiAgLy8gQmVkcm9jayBBZ2VudOioreWumu+8iFBoYXNlIDTntbHlkIjvvIlcbiAgdXNlQmVkcm9ja0FnZW50PzogYm9vbGVhbjtcbiAga25vd2xlZGdlQmFzZUFybj86IHN0cmluZztcbiAgZG9jdW1lbnRTZWFyY2hMYW1iZGFBcm4/OiBzdHJpbmc7XG4gIGFnZW50SW5zdHJ1Y3Rpb25QcmVzZXQ/OiAnc3RhbmRhcmQnIHwgJ2ZpbmFuY2lhbCcgfCAnaGVhbHRoY2FyZSc7XG4gIGZvdW5kYXRpb25Nb2RlbD86IHN0cmluZztcbiAgXG4gIC8vIEJlZHJvY2sgR3VhcmRyYWlsc+ioreWumu+8iFBoYXNlIDUgLSBTZWN1cml0eVN0YWNr44GL44KJ5Y+W5b6X77yJXG4gIGd1YXJkcmFpbEFybj86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEVtYmVkZGluZ1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgLy8gQUkvTUzntbHlkIjvvIjml6LlrZjlrp/oo4XjgpLkv53mjIHvvIlcbiAgcHVibGljIHJlYWRvbmx5IGFpQ29uc3RydWN0PzogQUlDb25zdHJ1Y3Q7XG4gIFxuICAvLyBFbWJlZGRpbmcgQmF0Y2jntbHlkIjvvIjml6LlrZjlrp/oo4XjgpLkv53mjIHvvIlcbiAgcHVibGljIHJlYWRvbmx5IGVtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb24/OiBFbWJlZGRpbmdCYXRjaEludGVncmF0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgYmF0Y2hJbnRlZ3JhdGlvblRlc3Q/OiBCYXRjaEludGVncmF0aW9uVGVzdDtcbiAgcHVibGljIHJlYWRvbmx5IGVtYmVkZGluZ0NvbmZpZz86IEVtYmVkZGluZ0NvbmZpZztcbiAgXG4gIC8vIFNRTGl0ZeiyoOiNt+ippumok+OCs+ODs+OCueODiOODqeOCr+ODiO+8iOaXouWtmOWun+ijheOCkuS/neaMge+8iVxuICBwdWJsaWMgcmVhZG9ubHkgc3FsaXRlTG9hZFRlc3Q/OiBTcWxpdGVMb2FkVGVzdDtcbiAgcHVibGljIHJlYWRvbmx5IHdpbmRvd3NTcWxpdGU/OiBXaW5kb3dzU3FsaXRlO1xuICBcbiAgLy8gRW1iZWRkaW5n44Oq44K944O844K577yI5pei5a2Y5a6f6KOF44KS5L+d5oyB77yJXG4gIHB1YmxpYyByZWFkb25seSBsYW1iZGFGdW5jdGlvbnM6IHsgW2tleTogc3RyaW5nXTogY2RrLmF3c19sYW1iZGEuRnVuY3Rpb24gfTtcbiAgcHVibGljIHJlYWRvbmx5IGVjc0NsdXN0ZXI/OiBjZGsuYXdzX2Vjcy5DbHVzdGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgYmF0Y2hKb2JRdWV1ZT86IGNkay5hd3NfYmF0Y2guSm9iUXVldWU7XG4gIFxuICAvLyBBSS9NTOODquOCveODvOOCue+8iOaXouWtmOWun+ijheOCkuS/neaMge+8iVxuICBwdWJsaWMgcmVhZG9ubHkgYmVkcm9ja01vZGVsczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbiAgcHVibGljIHJlYWRvbmx5IGVtYmVkZGluZ0Z1bmN0aW9uPzogY2RrLmF3c19sYW1iZGEuRnVuY3Rpb247XG4gIFxuICAvLyBCZWRyb2NrIEFnZW5077yIUGhhc2UgNOe1seWQiCAtIOaWsOapn+iDve+8iVxuICBwdWJsaWMgcmVhZG9ubHkgYmVkcm9ja0FnZW50PzogQmVkcm9ja0FnZW50Q29uc3RydWN0O1xuICBwdWJsaWMgcmVhZG9ubHkgYWdlbnRBcm4/OiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBhZ2VudEFsaWFzQXJuPzogc3RyaW5nO1xuICBcbiAgLy8gQmVkcm9jayBHdWFyZHJhaWxz77yIUGhhc2UgNSAtIFNlY3VyaXR5U3RhY2vjgYvjgonlj5blvpfvvIlcbiAgcHVibGljIHJlYWRvbmx5IGd1YXJkcmFpbEFybj86IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRW1iZWRkaW5nU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8g44Kz44K544OI6YWN5biD44K/44Kw44Gu6YGp55So77yIQVdTIEJhdGNo5bCC55So44K/44Kw44KS5ZCr44KA77yJXG4gICAgY29uc3QgdGFnZ2luZ0NvbmZpZyA9IFBlcm1pc3Npb25Bd2FyZVJBR1RhZ3MuZ2V0U3RhbmRhcmRDb25maWcoXG4gICAgICBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIHByb3BzLmVudmlyb25tZW50XG4gICAgKTtcbiAgICBUYWdnaW5nU3RyYXRlZ3kuYXBwbHlUYWdzVG9TdGFjayh0aGlzLCB0YWdnaW5nQ29uZmlnKTtcblxuICAgIGNvbnN0IHsgXG4gICAgICBhaUNvbmZpZywgXG4gICAgICBlbWJlZGRpbmdDb25maWcsXG4gICAgICBwcm9qZWN0TmFtZSwgXG4gICAgICBlbnZpcm9ubWVudCxcbiAgICAgIHZwY0lkLFxuICAgICAgcHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICBrbXNLZXlBcm4sXG4gICAgICBzM0J1Y2tldEFybnMsXG4gICAgICBkeW5hbW9EYlRhYmxlQXJucyxcbiAgICAgIG9wZW5TZWFyY2hDb2xsZWN0aW9uQXJuLFxuICAgICAgZW5hYmxlQmF0Y2hJbnRlZ3JhdGlvbiA9IHRydWUsXG4gICAgICBlbmFibGVCYXRjaFRlc3RpbmcgPSBmYWxzZSxcbiAgICAgIGltYWdlUGF0aCA9ICdlbWJlZGRpbmctc2VydmVyJyxcbiAgICAgIGltYWdlVGFnID0gJ2xhdGVzdCcsXG4gICAgICAvLyBTUUxpdGXosqDojbfoqabpqJPoqK3lrppcbiAgICAgIGVuYWJsZVNxbGl0ZUxvYWRUZXN0ID0gZmFsc2UsXG4gICAgICBlbmFibGVXaW5kb3dzTG9hZFRlc3QgPSBmYWxzZSxcbiAgICAgIGZzeEZpbGVTeXN0ZW1JZCxcbiAgICAgIGZzeFN2bUlkLFxuICAgICAgZnN4Vm9sdW1lSWQsXG4gICAgICBmc3hNb3VudFBhdGgsXG4gICAgICBmc3hOZnNFbmRwb2ludCxcbiAgICAgIGZzeENpZnNFbmRwb2ludCxcbiAgICAgIGZzeENpZnNTaGFyZU5hbWUsXG4gICAgICBrZXlQYWlyTmFtZSxcbiAgICAgIGJlZHJvY2tSZWdpb24sXG4gICAgICBiZWRyb2NrTW9kZWxJZCxcbiAgICAgIHNjaGVkdWxlRXhwcmVzc2lvbixcbiAgICAgIG1heHZDcHVzLFxuICAgICAgaW5zdGFuY2VUeXBlcyxcbiAgICAgIHdpbmRvd3NJbnN0YW5jZVR5cGVcbiAgICB9ID0gcHJvcHM7XG5cbiAgICAvLyBFbWJlZGRpbmfoqK3lrprjga7liJ3mnJ/ljJbvvIjml6LlrZjlrp/oo4XjgpLkv53mjIHvvIlcbiAgICAvLyBFbWJlZGRpbmdDb25maWdGYWN0b3J544Gv5L6d5a2Y6Zai5L+C44Gu5ZWP6aGM44GM44GC44KL44Gf44KB44CBcHJvcHPjgYvjgonnm7TmjqXlj5blvpdcbiAgICB0aGlzLmVtYmVkZGluZ0NvbmZpZyA9IGVtYmVkZGluZ0NvbmZpZztcbiAgICBcbiAgICAvLyDlhbHpgJrjg6rjgr3jg7zjgrnoqK3lrprvvIjml6LlrZjlrp/oo4XjgpLkv53mjIHvvIlcbiAgICBjb25zdCBjb21tb25SZXNvdXJjZXM6IEVtYmVkZGluZ0NvbW1vblJlc291cmNlcyA9IHRoaXMuY3JlYXRlQ29tbW9uUmVzb3VyY2VzKHByb3BzKTtcbiAgICBcbiAgICAvLyBBSSBFbWJlZGRpbmfjgrPjg7Pjgrnjg4jjg6njgq/jg4jkvZzmiJDvvIjml6LlrZjlrp/oo4XjgpLkv53mjIEgLSDjgqrjg5fjgrfjg6fjg7PvvIlcbiAgICAvLyBBSUNvbnN0cnVjdOOBr+S+neWtmOmWouS/guOBruWVj+mhjOOBjOOBguOCi+OBn+OCgeOAgeS4gOaZgueahOOBq+OCueOCreODg+ODl1xuICAgIC8vIGlmIChhaUNvbmZpZykge1xuICAgIC8vICAgdHJ5IHtcbiAgICAvLyAgICAgdGhpcy5haUNvbnN0cnVjdCA9IG5ldyBBSUNvbnN0cnVjdCh0aGlzLCAnRW1iZWRkaW5nQWlDb25zdHJ1Y3QnLCB7XG4gICAgLy8gICAgICAgY29uZmlnOiBhaUNvbmZpZyxcbiAgICAvLyAgICAgICBwcm9qZWN0TmFtZSxcbiAgICAvLyAgICAgICBlbnZpcm9ubWVudCxcbiAgICAvLyAgICAgICBrbXNLZXk6IGttc0tleUFybixcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vICAgICBjb25zb2xlLndhcm4oJ0FJQ29uc3RydWN05Yid5pyf5YyW44KS44K544Kt44OD44OXOicsIGVycm9yKTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBBV1MgQmF0Y2jntbHlkIjvvIjml6LlrZjlrp/oo4XjgpLkv53mjIEgLSDjgqrjg5fjgrfjg6fjg7PvvIlcbiAgICAvLyBFbWJlZGRpbmdDb25maWfjga7lnovjga7llY/poYzjgYzjgYLjgovjgZ/jgoHjgIHkuIDmmYLnmoTjgavjgrnjgq3jg4Pjg5dcbiAgICAvLyBpZiAoZW5hYmxlQmF0Y2hJbnRlZ3JhdGlvbiAmJiB0aGlzLmVtYmVkZGluZ0NvbmZpZz8uYXdzQmF0Y2g/LmVuYWJsZWQpIHtcbiAgICAvLyAgIHRyeSB7XG4gICAgLy8gICAgIHRoaXMuZW1iZWRkaW5nQmF0Y2hJbnRlZ3JhdGlvbiA9IG5ldyBFbWJlZGRpbmdCYXRjaEludGVncmF0aW9uKHRoaXMsICdFbWJlZGRpbmdCYXRjaEludGVncmF0aW9uJywge1xuICAgIC8vICAgICAgIGNvbmZpZzogdGhpcy5lbWJlZGRpbmdDb25maWcsXG4gICAgLy8gICAgICAgcHJvamVjdE5hbWUsXG4gICAgLy8gICAgICAgZW52aXJvbm1lbnQsXG4gICAgLy8gICAgICAgY29tbW9uUmVzb3VyY2VzLFxuICAgIC8vICAgICAgIGltYWdlUGF0aCxcbiAgICAvLyAgICAgICBpbWFnZVRhZyxcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICAgIGlmIChlbmFibGVCYXRjaFRlc3RpbmcpIHtcbiAgICAvLyAgICAgICB0aGlzLmJhdGNoSW50ZWdyYXRpb25UZXN0ID0gbmV3IEJhdGNoSW50ZWdyYXRpb25UZXN0KHRoaXMsICdCYXRjaEludGVncmF0aW9uVGVzdCcsIHtcbiAgICAvLyAgICAgICAgIGJhdGNoSW50ZWdyYXRpb246IHRoaXMuZW1iZWRkaW5nQmF0Y2hJbnRlZ3JhdGlvbixcbiAgICAvLyAgICAgICAgIGNvbmZpZzogdGhpcy5lbWJlZGRpbmdDb25maWcsXG4gICAgLy8gICAgICAgICBwcm9qZWN0TmFtZSxcbiAgICAvLyAgICAgICAgIGVudmlyb25tZW50LFxuICAgIC8vICAgICAgICAgbm90aWZpY2F0aW9uVG9waWNBcm46IHRoaXMuZW1iZWRkaW5nQ29uZmlnLm1vbml0b3Jpbmc/LmFsZXJ0cz8uc25zVG9waWNBcm4sXG4gICAgLy8gICAgICAgfSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gICAgIGNvbnNvbGUud2FybignQmF0Y2jntbHlkIjjga7liJ3mnJ/ljJbjgpLjgrnjgq3jg4Pjg5c6JywgZXJyb3IpO1xuICAgIC8vICAgfVxuICAgIC8vIH1cblxuICAgIC8vIFNRTGl0ZeiyoOiNt+ippumok+e1seWQiO+8iOaXouWtmOWun+ijheOCkuS/neaMgSAtIOOCquODl+OCt+ODp+ODs++8iVxuICAgIGlmIChlbmFibGVTcWxpdGVMb2FkVGVzdCAmJiBmc3hGaWxlU3lzdGVtSWQgJiYgZnN4U3ZtSWQgJiYgZnN4Vm9sdW1lSWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuc3FsaXRlTG9hZFRlc3QgPSBuZXcgU3FsaXRlTG9hZFRlc3QodGhpcywgJ1NxbGl0ZUxvYWRUZXN0Jywge1xuICAgICAgICAgIHByb2plY3ROYW1lLFxuICAgICAgICAgIGVudmlyb25tZW50LFxuICAgICAgICAgIHZwYzogY29tbW9uUmVzb3VyY2VzLnZwYy52cGMsXG4gICAgICAgICAgcHJpdmF0ZVN1Ym5ldHM6IGNvbW1vblJlc291cmNlcy52cGMucHJpdmF0ZVN1Ym5ldHMsXG4gICAgICAgICAgc2VjdXJpdHlHcm91cDogY29tbW9uUmVzb3VyY2VzLnNlY3VyaXR5R3JvdXBzLmNvbW1vblNlY3VyaXR5R3JvdXAsXG4gICAgICAgICAgZnN4RmlsZVN5c3RlbUlkLFxuICAgICAgICAgIGZzeFN2bUlkLFxuICAgICAgICAgIGZzeFZvbHVtZUlkLFxuICAgICAgICAgIGZzeE1vdW50UGF0aDogZnN4TW91bnRQYXRoIHx8ICcvc3FsaXRlLWxvYWQtdGVzdCcsXG4gICAgICAgICAgZnN4TmZzRW5kcG9pbnQ6IGZzeE5mc0VuZHBvaW50IHx8IGAke2ZzeFN2bUlkfS4ke2ZzeEZpbGVTeXN0ZW1JZH0uZnN4LiR7dGhpcy5yZWdpb259LmFtYXpvbmF3cy5jb21gLFxuICAgICAgICAgIGJlZHJvY2tSZWdpb246IGJlZHJvY2tSZWdpb24gfHwgdGhpcy5yZWdpb24sXG4gICAgICAgICAgYmVkcm9ja01vZGVsSWQ6IGJlZHJvY2tNb2RlbElkIHx8ICdhbWF6b24udGl0YW4tZW1iZWQtdGV4dC12MScsXG4gICAgICAgICAgc2NoZWR1bGVFeHByZXNzaW9uOiBzY2hlZHVsZUV4cHJlc3Npb24gfHwgJ2Nyb24oMCAyICogKiA/ICopJyxcbiAgICAgICAgICBlbmFibGVTY2hlZHVsZWRFeGVjdXRpb246IHRydWUsXG4gICAgICAgICAgbWF4dkNwdXM6IG1heHZDcHVzIHx8IDIwLFxuICAgICAgICAgIGluc3RhbmNlVHlwZXM6IGluc3RhbmNlVHlwZXMgfHwgWydtNS5sYXJnZScsICdtNS54bGFyZ2UnXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV2luZG93cyBTUUxpdGXosqDojbfoqabpqJPvvIjml6LlrZjlrp/oo4XjgpLkv53mjIEgLSDjgqrjg5fjgrfjg6fjg7PvvIlcbiAgICAgICAgaWYgKGVuYWJsZVdpbmRvd3NMb2FkVGVzdCAmJiBrZXlQYWlyTmFtZSAmJiBmc3hDaWZzRW5kcG9pbnQgJiYgZnN4Q2lmc1NoYXJlTmFtZSkge1xuICAgICAgICAgIHRoaXMud2luZG93c1NxbGl0ZSA9IG5ldyBXaW5kb3dzU3FsaXRlKHRoaXMsICdXaW5kb3dzU3FsaXRlJywge1xuICAgICAgICAgICAgcHJvamVjdE5hbWUsXG4gICAgICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgICAgIHZwYzogY29tbW9uUmVzb3VyY2VzLnZwYy52cGMsXG4gICAgICAgICAgICBwcml2YXRlU3VibmV0OiBjb21tb25SZXNvdXJjZXMudnBjLnByaXZhdGVTdWJuZXRzWzBdLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cDogY29tbW9uUmVzb3VyY2VzLnNlY3VyaXR5R3JvdXBzLmNvbW1vblNlY3VyaXR5R3JvdXAsXG4gICAgICAgICAgICBrZXlQYWlyTmFtZSxcbiAgICAgICAgICAgIGZzeEZpbGVTeXN0ZW1JZCxcbiAgICAgICAgICAgIGZzeFN2bUlkLFxuICAgICAgICAgICAgZnN4Vm9sdW1lSWQsXG4gICAgICAgICAgICBmc3hNb3VudFBhdGg6IGZzeE1vdW50UGF0aCB8fCAnL3NxbGl0ZS1sb2FkLXRlc3QnLFxuICAgICAgICAgICAgZnN4Q2lmc0VuZHBvaW50LFxuICAgICAgICAgICAgZnN4Q2lmc1NoYXJlTmFtZSxcbiAgICAgICAgICAgIGluc3RhbmNlVHlwZTogd2luZG93c0luc3RhbmNlVHlwZSB8fCAndDMubWVkaXVtJyxcbiAgICAgICAgICAgIGVuYWJsZURldGFpbGVkTW9uaXRvcmluZzogZW52aXJvbm1lbnQgPT09ICdwcm9kJyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdTUUxpdGXosqDojbfoqabpqJPntbHlkIjjga7liJ3mnJ/ljJbjgpLjgrnjgq3jg4Pjg5c6JywgZXJyb3IpO1xuICAgICAgICAvLyBTUUxpdGXosqDojbfoqabpqJPjga7liJ3mnJ/ljJbjgavlpLHmlZfjgZfjgabjgoLjgrnjgr/jg4Pjgq/lhajkvZPjga/ntpnntppcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBCZWRyb2NrIEFnZW5057Wx5ZCI77yIUGhhc2UgNCAtIOacieWKueWMluOBleOCjOOBpuOBhOOCi+WgtOWQiO+8iVxuICAgIGNvbnN0IHVzZUJlZHJvY2tBZ2VudCA9IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCd1c2VCZWRyb2NrQWdlbnQnKSA/PyBwcm9wcy51c2VCZWRyb2NrQWdlbnQgPz8gZmFsc2U7XG4gICAgaWYgKHVzZUJlZHJvY2tBZ2VudCkge1xuICAgICAgdGhpcy5iZWRyb2NrQWdlbnQgPSB0aGlzLmNyZWF0ZUJlZHJvY2tBZ2VudChwcm9wcyk7XG4gICAgICB0aGlzLmFnZW50QXJuID0gdGhpcy5iZWRyb2NrQWdlbnQuYWdlbnRBcm47XG4gICAgICB0aGlzLmFnZW50QWxpYXNBcm4gPSB0aGlzLmJlZHJvY2tBZ2VudC5hZ2VudEFsaWFzQXJuO1xuICAgIH1cblxuICAgIC8vIOS4u+imgeODquOCveODvOOCueOBruWPgueFp+OCkuioreWumu+8iOaXouWtmOWun+ijheOCkuS/neaMge+8iVxuICAgIHRoaXMubGFtYmRhRnVuY3Rpb25zID0ge307XG4gICAgdGhpcy5lY3NDbHVzdGVyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYmF0Y2hKb2JRdWV1ZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmJlZHJvY2tNb2RlbHMgPSB7fTtcbiAgICB0aGlzLmVtYmVkZGluZ0Z1bmN0aW9uID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gQ2xvdWRGb3JtYXRpb27lh7rliptcbiAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcblxuICAgIC8vIOOCueOCv+ODg+OCr+ODrOODmeODq+OBruOCv+OCsOioreWumlxuICAgIHRoaXMuYXBwbHlTdGFja1RhZ3MocHJvamVjdE5hbWUsIGVudmlyb25tZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlhbHpgJrjg6rjgr3jg7zjgrnkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQ29tbW9uUmVzb3VyY2VzKHByb3BzOiBFbWJlZGRpbmdTdGFja1Byb3BzKTogRW1iZWRkaW5nQ29tbW9uUmVzb3VyY2VzIHtcbiAgICAvLyDml6LlrZjjga5WUEPjgpLkvb/nlKjjgZnjgovjgYvjgIHmlrDopo/kvZzmiJBcbiAgICBsZXQgdnBjOiBjZGsuYXdzX2VjMi5JVnBjO1xuICAgIFxuICAgIGlmIChwcm9wcy52cGNJZCkge1xuICAgICAgdnBjID0gY2RrLmF3c19lYzIuVnBjLmZyb21Mb29rdXAodGhpcywgJ0V4aXN0aW5nVnBjJywge1xuICAgICAgICB2cGNJZDogcHJvcHMudnBjSWQsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdnBjID0gbmV3IGNkay5hd3NfZWMyLlZwYyh0aGlzLCAnRW1iZWRkaW5nVnBjJywge1xuICAgICAgICBtYXhBenM6IDMsXG4gICAgICAgIG5hdEdhdGV3YXlzOiAyLFxuICAgICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXG4gICAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgrDjg6vjg7zjg5fkvZzmiJBcbiAgICBjb25zdCBjb21tb25TZWN1cml0eUdyb3VwID0gbmV3IGNkay5hd3NfZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0VtYmVkZGluZ0NvbW1vblNlY3VyaXR5R3JvdXAnLCB7XG4gICAgICB2cGMsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbW1vbiBzZWN1cml0eSBncm91cCBmb3IgRW1iZWRkaW5nIHJlc291cmNlcycsXG4gICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gSFRUUFPjgqLjgq/jgrvjgrnoqLHlj69cbiAgICBjb21tb25TZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgY2RrLmF3c19lYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBjZGsuYXdzX2VjMi5Qb3J0LnRjcCg0NDMpLFxuICAgICAgJ0hUVFBTIGFjY2VzcydcbiAgICApO1xuXG4gICAgLy8gVlBD5YaF6YCa5L+h6Kix5Y+vXG4gICAgY29tbW9uU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGNkay5hd3NfZWMyLlBlZXIuaXB2NCh2cGMudnBjQ2lkckJsb2NrKSxcbiAgICAgIGNkay5hd3NfZWMyLlBvcnQuYWxsVHJhZmZpYygpLFxuICAgICAgJ1ZQQyBpbnRlcm5hbCBjb21tdW5pY2F0aW9uJ1xuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdnBjOiB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgcHJpdmF0ZVN1Ym5ldHM6IHZwYy5wcml2YXRlU3VibmV0cyxcbiAgICAgICAgcHVibGljU3VibmV0czogdnBjLnB1YmxpY1N1Ym5ldHMsXG4gICAgICAgIGF2YWlsYWJpbGl0eVpvbmVzOiB2cGMuYXZhaWxhYmlsaXR5Wm9uZXMsXG4gICAgICB9LFxuICAgICAgc2VjdXJpdHlHcm91cHM6IHtcbiAgICAgICAgY29tbW9uU2VjdXJpdHlHcm91cCxcbiAgICAgIH0sXG4gICAgICBpYW06IHtcbiAgICAgICAgY29tbW9uU2VydmljZVJvbGU6IHRoaXMuY3JlYXRlQ29tbW9uU2VydmljZVJvbGUoKSxcbiAgICAgIH0sXG4gICAgICBsb2dnaW5nOiB7XG4gICAgICAgIGNvbW1vbkxvZ0dyb3VwOiB0aGlzLmNyZWF0ZUNvbW1vbkxvZ0dyb3VwKCksXG4gICAgICB9LFxuICAgICAgc3RvcmFnZToge30sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlhbHpgJrjgrXjg7zjg5Pjgrnjg63jg7zjg6vkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQ29tbW9uU2VydmljZVJvbGUoKTogY2RrLmF3c19pYW0uUm9sZSB7XG4gICAgcmV0dXJuIG5ldyBjZGsuYXdzX2lhbS5Sb2xlKHRoaXMsICdFbWJlZGRpbmdDb21tb25TZXJ2aWNlUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGNkay5hd3NfaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgY2RrLmF3c19pYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog5YWx6YCa44Ot44Kw44Kw44Or44O844OX5L2c5oiQ77yI5pei5a2Y5a6f6KOF44KS5L+d5oyB77yJXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUNvbW1vbkxvZ0dyb3VwKCk6IGNkay5hd3NfbG9ncy5Mb2dHcm91cCB7XG4gICAgY29uc3QgbG9nR3JvdXBOYW1lID0gdGhpcy5lbWJlZGRpbmdDb25maWdcbiAgICAgID8gYC9hd3MvZW1iZWRkaW5nLyR7dGhpcy5lbWJlZGRpbmdDb25maWcucHJvamVjdE5hbWV9LSR7dGhpcy5lbWJlZGRpbmdDb25maWcuZW52aXJvbm1lbnR9YFxuICAgICAgOiBgL2F3cy9lbWJlZGRpbmcvZGVmYXVsdGA7XG4gICAgICBcbiAgICByZXR1cm4gbmV3IGNkay5hd3NfbG9ncy5Mb2dHcm91cCh0aGlzLCAnRW1iZWRkaW5nQ29tbW9uTG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWUsXG4gICAgICByZXRlbnRpb246IGNkay5hd3NfbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRGb3JtYXRpb27lh7rlipvjga7kvZzmiJDvvIjntbHkuIDlkb3lkI3opo/liYfpgannlKjvvIlcbiAgICog5pei5a2Y5a6f6KOF44KS5L+d5oyBICsgUGhhc2UgNOOBrkJlZHJvY2sgQWdlbnTntbHlkIhcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0cygpOiB2b2lkIHtcbiAgICAvLyBFbWJlZGRpbmcgTGFtYmRhIOmWouaVsOaDheWgse+8iOaXouWtmOWun+ijheOCkuS/neaMge+8iVxuICAgIGlmICh0aGlzLmxhbWJkYUZ1bmN0aW9ucyAmJiBPYmplY3Qua2V5cyh0aGlzLmxhbWJkYUZ1bmN0aW9ucykubGVuZ3RoID4gMCkge1xuICAgICAgT2JqZWN0LmVudHJpZXModGhpcy5sYW1iZGFGdW5jdGlvbnMpLmZvckVhY2goKFtuYW1lLCBmdW5jXSkgPT4ge1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgRW1iZWRkaW5nTGFtYmRhRnVuY3Rpb24ke25hbWV9TmFtZWAsIHtcbiAgICAgICAgICB2YWx1ZTogZnVuYy5mdW5jdGlvbk5hbWUsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGBFbWJlZGRpbmcgTGFtYmRhIEZ1bmN0aW9uICR7bmFtZX0gTmFtZWAsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0xhbWJkYUZ1bmN0aW9uJHtuYW1lfU5hbWVgLFxuICAgICAgICB9KTtcblxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgRW1iZWRkaW5nTGFtYmRhRnVuY3Rpb24ke25hbWV9QXJuYCwge1xuICAgICAgICAgIHZhbHVlOiBmdW5jLmZ1bmN0aW9uQXJuLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRW1iZWRkaW5nIExhbWJkYSBGdW5jdGlvbiAke25hbWV9IEFSTmAsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0xhbWJkYUZ1bmN0aW9uJHtuYW1lfUFybmAsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRW1iZWRkaW5nIEVDUyDjgq/jg6njgrnjgr/jg7zmg4XloLHvvIjml6LlrZjlrp/oo4XjgpLkv53mjIHvvIlcbiAgICBpZiAodGhpcy5lY3NDbHVzdGVyKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRW1iZWRkaW5nRWNzQ2x1c3Rlck5hbWUnLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLmVjc0NsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW1iZWRkaW5nIEVDUyBDbHVzdGVyIE5hbWUnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRW1iZWRkaW5nRWNzQ2x1c3Rlck5hbWVgLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFbWJlZGRpbmdFY3NDbHVzdGVyQXJuJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5lY3NDbHVzdGVyLmNsdXN0ZXJBcm4sXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW1iZWRkaW5nIEVDUyBDbHVzdGVyIEFSTicsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdFY3NDbHVzdGVyQXJuYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEVtYmVkZGluZyBCYXRjaOe1seWQiOaDheWgse+8iOaXouWtmOWun+ijheOCkuS/neaMge+8iVxuICAgIGlmICh0aGlzLmVtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb24pIHtcbiAgICAgIGNvbnN0IGJhdGNoSW5mbyA9IHRoaXMuZW1iZWRkaW5nQmF0Y2hJbnRlZ3JhdGlvbi5nZXRJbnRlZ3JhdGlvbkluZm8oKTtcbiAgICAgIFxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VtYmVkZGluZ0JhdGNoQ29tcHV0ZUVudmlyb25tZW50TmFtZScsIHtcbiAgICAgICAgdmFsdWU6IGJhdGNoSW5mby5iYXRjaENvbnN0cnVjdC5jb21wdXRlRW52aXJvbm1lbnQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW1iZWRkaW5nIEJhdGNoIENvbXB1dGUgRW52aXJvbm1lbnQgTmFtZScsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdCYXRjaENvbXB1dGVFbnZpcm9ubWVudE5hbWVgLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFbWJlZGRpbmdCYXRjaEpvYlF1ZXVlTmFtZScsIHtcbiAgICAgICAgdmFsdWU6IGJhdGNoSW5mby5iYXRjaENvbnN0cnVjdC5qb2JRdWV1ZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbWJlZGRpbmcgQmF0Y2ggSm9iIFF1ZXVlIE5hbWUnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRW1iZWRkaW5nQmF0Y2hKb2JRdWV1ZU5hbWVgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRW1iZWRkaW5nIEJlZHJvY2sg44Oi44OH44Or5oOF5aCx77yI5pei5a2Y5a6f6KOF44KS5L+d5oyB77yJXG4gICAgaWYgKHRoaXMuYmVkcm9ja01vZGVscyAmJiBPYmplY3Qua2V5cyh0aGlzLmJlZHJvY2tNb2RlbHMpLmxlbmd0aCA+IDApIHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuYmVkcm9ja01vZGVscykuZm9yRWFjaCgoW25hbWUsIG1vZGVsSWRdKSA9PiB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGBFbWJlZGRpbmdCZWRyb2NrTW9kZWwke25hbWV9SWRgLCB7XG4gICAgICAgICAgdmFsdWU6IG1vZGVsSWQsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGBFbWJlZGRpbmcgQmVkcm9jayBNb2RlbCAke25hbWV9IElEYCxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRW1iZWRkaW5nQmVkcm9ja01vZGVsJHtuYW1lfUlkYCxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBFbWJlZGRpbmfplqLmlbDmg4XloLHvvIjml6LlrZjlrp/oo4XjgpLkv53mjIHvvIlcbiAgICBpZiAodGhpcy5lbWJlZGRpbmdGdW5jdGlvbikge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VtYmVkZGluZ0Z1bmN0aW9uTmFtZScsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuZW1iZWRkaW5nRnVuY3Rpb24uZnVuY3Rpb25OYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0VtYmVkZGluZyBGdW5jdGlvbiBOYW1lJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0Z1bmN0aW9uTmFtZWAsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VtYmVkZGluZ0Z1bmN0aW9uQXJuJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5lbWJlZGRpbmdGdW5jdGlvbi5mdW5jdGlvbkFybixcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbWJlZGRpbmcgRnVuY3Rpb24gQVJOJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVtYmVkZGluZ0Z1bmN0aW9uQXJuYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEJlZHJvY2sgQWdlbnTmg4XloLHvvIhQaGFzZSA057Wx5ZCI77yJXG4gICAgaWYgKHRoaXMuYmVkcm9ja0FnZW50KSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUkFHTW9kZScsIHtcbiAgICAgICAgdmFsdWU6ICdhZ2VudCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUkFHIE1vZGUgKGFnZW50IG9yIGtub3dsZWRnZS1iYXNlKScsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1SQUdNb2RlYCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQmVkcm9ja0FnZW50QXJuJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5hZ2VudEFybiB8fCAnTi9BJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdCZWRyb2NrIEFnZW50IEFSTicsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1CZWRyb2NrQWdlbnRBcm5gLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCZWRyb2NrQWdlbnRBbGlhc0FybicsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuYWdlbnRBbGlhc0FybiB8fCAnTi9BJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdCZWRyb2NrIEFnZW50IEFsaWFzIEFSTicsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1CZWRyb2NrQWdlbnRBbGlhc0FybmAsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1JBR01vZGUnLCB7XG4gICAgICAgIHZhbHVlOiAna25vd2xlZGdlLWJhc2UnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1JBRyBNb2RlIChhZ2VudCBvciBrbm93bGVkZ2UtYmFzZSknLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tUkFHTW9kZWAsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv44Os44OZ44Or44Gu44K/44Kw6Kit5a6a77yI57Wx5LiA5ZG95ZCN6KaP5YmH6YGp55So77yJXG4gICAqL1xuICBwcml2YXRlIGFwcGx5U3RhY2tUYWdzKHByb2plY3ROYW1lOiBzdHJpbmcsIGVudmlyb25tZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1Byb2plY3QnLCBwcm9qZWN0TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50KTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1N0YWNrJywgJ0VtYmVkZGluZ1N0YWNrJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb21wb25lbnQnLCAnRW1iZWRkaW5nJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb3N0Q2VudGVyJywgYCR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LWVtYmVkZGluZ2ApO1xuICB9XG5cbiAgLyoqXG4gICAqIOS7luOBruOCueOCv+ODg+OCr+OBp+S9v+eUqOOBmeOCi+OBn+OCgeOBrkVtYmVkZGluZ+ODquOCveODvOOCueaDheWgseOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldEVtYmVkZGluZ0luZm8oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhbWJkYUZ1bmN0aW9uczogdGhpcy5sYW1iZGFGdW5jdGlvbnMsXG4gICAgICBlY3NDbHVzdGVyOiB0aGlzLmVjc0NsdXN0ZXIsXG4gICAgICBiYXRjaEpvYlF1ZXVlOiB0aGlzLmJhdGNoSm9iUXVldWUsXG4gICAgICBiZWRyb2NrTW9kZWxzOiB0aGlzLmJlZHJvY2tNb2RlbHMsXG4gICAgICBlbWJlZGRpbmdGdW5jdGlvbjogdGhpcy5lbWJlZGRpbmdGdW5jdGlvbixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOeJueWumuOBrkxhbWJkYemWouaVsOOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldExhbWJkYUZ1bmN0aW9uKG5hbWU6IHN0cmluZyk6IGNkay5hd3NfbGFtYmRhLkZ1bmN0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5sYW1iZGFGdW5jdGlvbnNbbmFtZV07XG4gIH1cblxuICAvKipcbiAgICog54m55a6a44GuQmVkcm9ja+ODouODh+ODq0lE44KS5Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgZ2V0QmVkcm9ja01vZGVsSWQobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5iZWRyb2NrTW9kZWxzW25hbWVdO1xuICB9XG5cbiAgLyoqXG4gICAqIExhbWJkYemWouaVsOeUqOOBrklBTeODneODquOCt+ODvOOCueODhuODvOODiOODoeODs+ODiOOCkueUn+aIkFxuICAgKi9cbiAgcHVibGljIGdldExhbWJkYUV4ZWN1dGlvblBvbGljeVN0YXRlbWVudHMoKTogY2RrLmF3c19pYW0uUG9saWN5U3RhdGVtZW50W10ge1xuICAgIGNvbnN0IHN0YXRlbWVudHM6IGNkay5hd3NfaWFtLlBvbGljeVN0YXRlbWVudFtdID0gW107XG5cbiAgICAvLyBCZWRyb2NrIOOCouOCr+OCu+OCueaoqemZkFxuICAgIHN0YXRlbWVudHMucHVzaChuZXcgY2RrLmF3c19pYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogY2RrLmF3c19pYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbCcsXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsV2l0aFJlc3BvbnNlU3RyZWFtJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IE9iamVjdC52YWx1ZXModGhpcy5iZWRyb2NrTW9kZWxzKS5tYXAobW9kZWxJZCA9PiBcbiAgICAgICAgYGFybjphd3M6YmVkcm9jazoke3RoaXMucmVnaW9ufTo6Zm91bmRhdGlvbi1tb2RlbC8ke21vZGVsSWR9YFxuICAgICAgKSxcbiAgICB9KSk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIExvZ3Mg44Ki44Kv44K744K55qip6ZmQXG4gICAgc3RhdGVtZW50cy5wdXNoKG5ldyBjZGsuYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBjZGsuYXdzX2lhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFtgYXJuOmF3czpsb2dzOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fToqYF0sXG4gICAgfSkpO1xuXG4gICAgLy8gWC1SYXkg44OI44Os44O844K344Oz44Kw5qip6ZmQXG4gICAgc3RhdGVtZW50cy5wdXNoKG5ldyBjZGsuYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBjZGsuYXdzX2lhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICd4cmF5OlB1dFRyYWNlU2VnbWVudHMnLFxuICAgICAgICAneHJheTpQdXRUZWxlbWV0cnlSZWNvcmRzJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIHJldHVybiBzdGF0ZW1lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEVDUyDjgr/jgrnjgq/nlKjjga5JQU3jg53jg6rjgrfjg7zjgrnjg4bjg7zjg4jjg6Hjg7Pjg4jjgpLnlJ/miJBcbiAgICovXG4gIHB1YmxpYyBnZXRFY3NUYXNrUG9saWN5U3RhdGVtZW50cygpOiBjZGsuYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnRbXSB7XG4gICAgY29uc3Qgc3RhdGVtZW50czogY2RrLmF3c19pYW0uUG9saWN5U3RhdGVtZW50W10gPSBbXTtcblxuICAgIC8vIEVDUyDjgr/jgrnjgq/lrp/ooYzmqKnpmZBcbiAgICBzdGF0ZW1lbnRzLnB1c2gobmV3IGNkay5hd3NfaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGNkay5hd3NfaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2VjcjpHZXRBdXRob3JpemF0aW9uVG9rZW4nLFxuICAgICAgICAnZWNyOkJhdGNoQ2hlY2tMYXllckF2YWlsYWJpbGl0eScsXG4gICAgICAgICdlY3I6R2V0RG93bmxvYWRVcmxGb3JMYXllcicsXG4gICAgICAgICdlY3I6QmF0Y2hHZXRJbWFnZScsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIExvZ3Mg44Ki44Kv44K744K55qip6ZmQXG4gICAgc3RhdGVtZW50cy5wdXNoKG5ldyBjZGsuYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBjZGsuYXdzX2lhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbYGFybjphd3M6bG9nczoke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06bG9nLWdyb3VwOi9lY3MvKmBdLFxuICAgIH0pKTtcblxuICAgIHJldHVybiBzdGF0ZW1lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhdGNo57Wx5ZCI5oOF5aCx44KS5Y+W5b6X77yI5pei5a2Y5a6f6KOF44KS5L+d5oyB77yJXG4gICAqL1xuICBwdWJsaWMgZ2V0QmF0Y2hJbnRlZ3JhdGlvbkluZm8oKTogUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZW1iZWRkaW5nQmF0Y2hJbnRlZ3JhdGlvbj8uZ2V0SW50ZWdyYXRpb25JbmZvKCk7XG4gIH1cblxuICAvKipcbiAgICogQmF0Y2jjgrjjg6fjg5bjgpLlrp/ooYzvvIjml6LlrZjlrp/oo4XjgpLkv53mjIHvvIlcbiAgICovXG4gIHB1YmxpYyBhc3luYyBzdWJtaXRCYXRjaEpvYihqb2JOYW1lOiBzdHJpbmcsIHBhcmFtZXRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiB0aGlzLmVtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb24/LnN1Ym1pdEVtYmVkZGluZ0pvYihqb2JOYW1lLCBwYXJhbWV0ZXJzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXRjaOOCuOODp+ODlueKtuazgeOCkuWPluW+l++8iOaXouWtmOWun+ijheOCkuS/neaMge+8iVxuICAgKi9cbiAgcHVibGljIGdldEJhdGNoSm9iU3RhdHVzKCk6IFJlY29yZDxzdHJpbmcsIGFueT4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmVtYmVkZGluZ0JhdGNoSW50ZWdyYXRpb24/LmdldEpvYlN0YXR1cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhdGNo57Wx5ZCI44OG44K544OI5a6f6KGM77yI5pei5a2Y5a6f6KOF44KS5L+d5oyB77yJXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgcnVuQmF0Y2hJbnRlZ3JhdGlvblRlc3QodGVzdFR5cGU6ICdiYXNpYycgfCAnZnN4JyB8ICdyZWNvdmVyeScgPSAnYmFzaWMnKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAoIXRoaXMuYmF0Y2hJbnRlZ3JhdGlvblRlc3QpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0ZXN0VHlwZSkge1xuICAgICAgY2FzZSAnYmFzaWMnOlxuICAgICAgICByZXR1cm4gdGhpcy5iYXRjaEludGVncmF0aW9uVGVzdC5ydW5CYXNpY1Rlc3QoKTtcbiAgICAgIGNhc2UgJ2ZzeCc6XG4gICAgICAgIHJldHVybiB0aGlzLmJhdGNoSW50ZWdyYXRpb25UZXN0LnJ1bkZzeE1vdW50VGVzdCgpO1xuICAgICAgY2FzZSAncmVjb3ZlcnknOlxuICAgICAgICByZXR1cm4gdGhpcy5iYXRjaEludGVncmF0aW9uVGVzdC5ydW5BdXRvUmVjb3ZlcnlUZXN0KCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5iYXRjaEludGVncmF0aW9uVGVzdC5ydW5CYXNpY1Rlc3QoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW1iZWRkaW5n6Kit5a6a44KS5Y+W5b6X77yI5pei5a2Y5a6f6KOF44KS5L+d5oyB77yJXG4gICAqL1xuICBwdWJsaWMgZ2V0RW1iZWRkaW5nQ29uZmlnKCk6IEVtYmVkZGluZ0NvbmZpZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZW1iZWRkaW5nQ29uZmlnO1xuICB9XG5cbiAgLyoqXG4gICAqIFNRTGl0ZeiyoOiNt+ippumok+OCuOODp+ODluOCkuWun+ihjFxuICAgKi9cbiAgcHVibGljIHN1Ym1pdFNxbGl0ZUxvYWRUZXN0Sm9iKGpvYk5hbWU/OiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGlmICghdGhpcy5zcWxpdGVMb2FkVGVzdCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc3FsaXRlTG9hZFRlc3Quc3VibWl0Sm9iKGpvYk5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNRTGl0ZeiyoOiNt+ippumok+e1seWQiOaDheWgseOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldFNxbGl0ZUxvYWRUZXN0SW5mbygpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuc3FsaXRlTG9hZFRlc3QpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXB1dGVFbnZpcm9ubWVudDogdGhpcy5zcWxpdGVMb2FkVGVzdC5jb21wdXRlRW52aXJvbm1lbnQucmVmLFxuICAgICAgam9iUXVldWU6IHRoaXMuc3FsaXRlTG9hZFRlc3Quam9iUXVldWUucmVmLFxuICAgICAgam9iRGVmaW5pdGlvbjogdGhpcy5zcWxpdGVMb2FkVGVzdC5qb2JEZWZpbml0aW9uLnJlZixcbiAgICAgIGxvZ0dyb3VwOiB0aGlzLnNxbGl0ZUxvYWRUZXN0LmxvZ0dyb3VwLmxvZ0dyb3VwTmFtZSxcbiAgICAgIHNjaGVkdWxlZFJ1bGU6IHRoaXMuc3FsaXRlTG9hZFRlc3Quc2NoZWR1bGVkUnVsZT8ucnVsZUFybixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFdpbmRvd3MgU1FMaXRl6LKg6I236Kmm6aiT5oOF5aCx44KS5Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgZ2V0V2luZG93c1NxbGl0ZUluZm8oKTogUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLndpbmRvd3NTcWxpdGUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGluc3RhbmNlSWQ6IHRoaXMud2luZG93c1NxbGl0ZS5pbnN0YW5jZS5pbnN0YW5jZUlkLFxuICAgICAgcHJpdmF0ZUlwOiB0aGlzLndpbmRvd3NTcWxpdGUuaW5zdGFuY2UuaW5zdGFuY2VQcml2YXRlSXAsXG4gICAgICBiYXN0aW9uSG9zdFB1YmxpY0lwOiB0aGlzLndpbmRvd3NTcWxpdGUuYmFzdGlvbkhvc3Q/Lmluc3RhbmNlUHVibGljSXAsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCZWRyb2NrIEFnZW505L2c5oiQ77yIUGhhc2UgNOe1seWQiO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVCZWRyb2NrQWdlbnQocHJvcHM6IEVtYmVkZGluZ1N0YWNrUHJvcHMpOiBCZWRyb2NrQWdlbnRDb25zdHJ1Y3Qge1xuICAgIC8vIEFnZW50IEluc3RydWN0aW9u5Y+W5b6XXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSBnZXRBZ2VudEluc3RydWN0aW9uKHByb3BzLmFnZW50SW5zdHJ1Y3Rpb25QcmVzZXQgfHwgJ3N0YW5kYXJkJyk7XG5cbiAgICAvLyBBY3Rpb24gR3JvdXBz6Kit5a6aXG4gICAgY29uc3QgYWN0aW9uR3JvdXBzID0gcHJvcHMuZG9jdW1lbnRTZWFyY2hMYW1iZGFBcm5cbiAgICAgID8gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFjdGlvbkdyb3VwTmFtZTogJ2RvY3VtZW50X3NlYXJjaCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+aoqemZkOiqjeitmOWei+aWh+abuOaknOe0oicsXG4gICAgICAgICAgICBhY3Rpb25Hcm91cEV4ZWN1dG9yOiBwcm9wcy5kb2N1bWVudFNlYXJjaExhbWJkYUFybixcbiAgICAgICAgICAgIGFwaVNjaGVtYToge1xuICAgICAgICAgICAgICBwYXlsb2FkOiBKU09OLnN0cmluZ2lmeShyZXF1aXJlKCcuLi8uLi8uLi9sYW1iZGEvYmVkcm9jay1hZ2VudC1hY3Rpb25zL2RvY3VtZW50LXNlYXJjaC1zY2hlbWEuanNvbicpKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXVxuICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICByZXR1cm4gbmV3IEJlZHJvY2tBZ2VudENvbnN0cnVjdCh0aGlzLCAnQmVkcm9ja0FnZW50Jywge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIGFnZW50TmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LXJhZy1hZ2VudGAsXG4gICAgICBhZ2VudERlc2NyaXB0aW9uOiAn5qip6ZmQ6KqN6K2Y5Z6LUkFH44K344K544OG44Og44GuQUnjgqLjgrfjgrnjgr/jg7Pjg4gnLFxuICAgICAgZm91bmRhdGlvbk1vZGVsOiBwcm9wcy5mb3VuZGF0aW9uTW9kZWwgfHwgJ2FudGhyb3BpYy5jbGF1ZGUtdjInLFxuICAgICAgaW5zdHJ1Y3Rpb246IGluc3RydWN0aW9uLFxuICAgICAga25vd2xlZGdlQmFzZUFybjogcHJvcHMua25vd2xlZGdlQmFzZUFybixcbiAgICAgIGFjdGlvbkdyb3VwczogYWN0aW9uR3JvdXBzLFxuICAgICAgaWRsZVNlc3Npb25UVExJblNlY29uZHM6IDYwMCxcbiAgICAgIC8vIEd1YXJkcmFpbHPpgannlKjvvIhQaGFzZSA1IC0gU2VjdXJpdHlTdGFja+OBi+OCieWPluW+l++8iVxuICAgICAgZ3VhcmRyYWlsQXJuOiBwcm9wcy5ndWFyZHJhaWxBcm4sXG4gICAgICBndWFyZHJhaWxWZXJzaW9uOiBwcm9wcy5ndWFyZHJhaWxBcm4gPyAnRFJBRlQnIDogdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENES+OCs+ODs+ODhuOCreOCueODiOioreWumuS+i+OCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyBnZXRDb250ZXh0RXhhbXBsZShlbnZpcm9ubWVudDogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb2plY3ROYW1lOiAncGVybWlzc2lvbi1hd2FyZS1yYWcnLFxuICAgICAgZW52aXJvbm1lbnQsXG4gICAgICByZWdpb246ICdhcC1ub3J0aGVhc3QtMScsXG4gICAgICBcbiAgICAgIC8vIEVtYmVkZGluZyBCYXRjaOioreWumlxuICAgICAgJ2VtYmVkZGluZzplbmFibGVBd3NCYXRjaCc6IHRydWUsXG4gICAgICAnZW1iZWRkaW5nOmVuYWJsZUVjc09uRUMyJzogZmFsc2UsXG4gICAgICAnZW1iZWRkaW5nOmVuYWJsZVNwb3RGbGVldCc6IGZhbHNlLFxuICAgICAgJ2VtYmVkZGluZzplbmFibGVNb25pdG9yaW5nJzogdHJ1ZSxcbiAgICAgICdlbWJlZGRpbmc6ZW5hYmxlQXV0b1NjYWxpbmcnOiB0cnVlLFxuICAgICAgXG4gICAgICAvLyBCYXRjaOioreWumlxuICAgICAgJ2VtYmVkZGluZzpiYXRjaDpuYW1lUHJlZml4JzogYCR7ZW52aXJvbm1lbnR9LWVtYmVkZGluZy1iYXRjaGAsXG4gICAgICAnZW1iZWRkaW5nOmJhdGNoOmltYWdlVXJpJzogYDEyMzQ1Njc4OTAxMi5ka3IuZWNyLmFwLW5vcnRoZWFzdC0xLmFtYXpvbmF3cy5jb20vZW1iZWRkaW5nLXNlcnZlcjoke2Vudmlyb25tZW50fWAsXG4gICAgICAnZW1iZWRkaW5nOmJhdGNoOnZjcHVzJzogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDQgOiAyLFxuICAgICAgJ2VtYmVkZGluZzpiYXRjaDptZW1vcnknOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gODE5MiA6IDQwOTYsXG4gICAgICAnZW1iZWRkaW5nOmJhdGNoOnVzZVNwb3RJbnN0YW5jZXMnOiBlbnZpcm9ubWVudCAhPT0gJ3Byb2QnLFxuICAgICAgXG4gICAgICAvLyBKb2IgRGVmaW5pdGlvbuioreWumlxuICAgICAgJ2VtYmVkZGluZzpqb2JEZWZpbml0aW9uOm5hbWUnOiBgJHtlbnZpcm9ubWVudH0tZW1iZWRkaW5nLWpvYi1kZWZpbml0aW9uYCxcbiAgICAgICdlbWJlZGRpbmc6am9iRGVmaW5pdGlvbjpjcHUnOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gNCA6IDIsXG4gICAgICAnZW1iZWRkaW5nOmpvYkRlZmluaXRpb246bWVtb3J5TWlCJzogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDgxOTIgOiA0MDk2LFxuICAgICAgJ2VtYmVkZGluZzpqb2JEZWZpbml0aW9uOnRpbWVvdXRIb3Vycyc6IDEsXG4gICAgICAnZW1iZWRkaW5nOmpvYkRlZmluaXRpb246cmV0cnlBdHRlbXB0cyc6IDMsXG4gICAgICBcbiAgICAgIC8vIEZTeOe1seWQiOioreWumlxuICAgICAgJ2VtYmVkZGluZzpmc3g6ZmlsZVN5c3RlbUlkJzogJ2ZzLTAxMjM0NTY3ODlhYmNkZWYwJyxcbiAgICAgICdlbWJlZGRpbmc6ZnN4OmNpZnNkYXRhVm9sTmFtZSc6ICdzbWJfc2hhcmUnLFxuICAgICAgJ2VtYmVkZGluZzpmc3g6cmFnZGJWb2xQYXRoJzogJy9zbWJfc2hhcmUvcmFnZGInLFxuICAgICAgXG4gICAgICAvLyBBY3RpdmUgRGlyZWN0b3J56Kit5a6aXG4gICAgICAnZW1iZWRkaW5nOmFkOmRvbWFpbic6ICdleGFtcGxlLmNvbScsXG4gICAgICAnZW1iZWRkaW5nOmFkOnVzZXJuYW1lJzogJ2FkbWluJyxcbiAgICAgICdlbWJlZGRpbmc6YWQ6cGFzc3dvcmRTZWNyZXRBcm4nOiAnYXJuOmF3czpzZWNyZXRzbWFuYWdlcjphcC1ub3J0aGVhc3QtMToxMjM0NTY3ODkwMTI6c2VjcmV0OmFkLXBhc3N3b3JkLWFiYzEyMycsXG4gICAgICBcbiAgICAgIC8vIEJlZHJvY2voqK3lrppcbiAgICAgICdlbWJlZGRpbmc6YmVkcm9jazpyZWdpb24nOiAndXMtZWFzdC0xJyxcbiAgICAgICdlbWJlZGRpbmc6YmVkcm9jazptb2RlbElkJzogJ2FtYXpvbi50aXRhbi1lbWJlZC10ZXh0LXYxJyxcbiAgICAgIFxuICAgICAgLy8gT3BlblNlYXJjaOioreWumlxuICAgICAgJ2VtYmVkZGluZzpvcGVuU2VhcmNoOmNvbGxlY3Rpb25OYW1lJzogYCR7ZW52aXJvbm1lbnR9LWVtYmVkZGluZy1jb2xsZWN0aW9uYCxcbiAgICAgICdlbWJlZGRpbmc6b3BlblNlYXJjaDppbmRleE5hbWUnOiAnZG9jdW1lbnRzJyxcbiAgICAgIFxuICAgICAgLy8g55uj6KaW6Kit5a6aXG4gICAgICAnZW1iZWRkaW5nOm1vbml0b3Jpbmc6YWxlcnRzOmVuYWJsZWQnOiB0cnVlLFxuICAgICAgJ2VtYmVkZGluZzptb25pdG9yaW5nOmNsb3VkV2F0Y2g6Y3JlYXRlRGFzaGJvYXJkJzogdHJ1ZSxcbiAgICAgICdlbWJlZGRpbmc6bW9uaXRvcmluZzp4cmF5OnRyYWNpbmdFbmFibGVkJzogdHJ1ZSxcbiAgICAgIFxuICAgICAgLy8gQmVkcm9jayBBZ2VudOioreWumu+8iFBoYXNlIDTvvIlcbiAgICAgICd1c2VCZWRyb2NrQWdlbnQnOiBmYWxzZSwgIC8vIOODh+ODleOCqeODq+ODiDogS25vd2xlZGdlIEJhc2Xjg6Ljg7zjg4lcbiAgICAgICdhZ2VudEluc3RydWN0aW9uUHJlc2V0JzogJ3N0YW5kYXJkJywgIC8vIHN0YW5kYXJkLCBmaW5hbmNpYWwsIGhlYWx0aGNhcmVcbiAgICAgICdmb3VuZGF0aW9uTW9kZWwnOiAnYW50aHJvcGljLmNsYXVkZS12MicsXG4gICAgfTtcbiAgfVxufSJdfQ==