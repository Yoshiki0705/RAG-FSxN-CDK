"use strict";
/**
 * AWS Batch Construct
 *
 * Agent Steeringルール準拠:
 * - モジュラーアーキテクチャ強制（lib/modules/compute/constructs/）
 * - 単一障害点排除とメンテナンス負荷軽減を最重要視
 * - Multi-AZ 構成でのマネージド EC2 環境
 *
 * Requirements: 1.1, 1.2, 1.3, 5.1
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
exports.BatchConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const batch = __importStar(require("aws-cdk-lib/aws-batch"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const constructs_1 = require("constructs");
/**
 * AWS Batch Construct
 *
 * 機能:
 * - Multi-AZ構成でのマネージドEC2環境
 * - 自動スケーリング設定（minvCpus: 0, maxvCpus: 1000）
 * - インスタンスタイプ設定（m5.large, m5.xlarge）
 * - FSx for NetApp ONTAP統合
 */
class BatchConstruct extends constructs_1.Construct {
    /** モジュール名 */
    moduleName = 'AWS_BATCH';
    /** モジュール有効化状態 */
    enabled;
    /** 共通リソース参照 */
    commonResources;
    /** Batchコンピュート環境 */
    computeEnvironment;
    /** Batchジョブ定義 */
    jobDefinition;
    /** Batchジョブキュー */
    jobQueue;
    /** 起動テンプレート */
    launchTemplate;
    /** サービスロール */
    serviceRole;
    /** インスタンスロール */
    instanceRole;
    /** ジョブロール */
    jobRole;
    /** ロググループ */
    logGroup;
    constructor(scope, id, props) {
        super(scope, id);
        this.enabled = props.config.enabled;
        this.commonResources = props.commonResources;
        if (!this.enabled) {
            return;
        }
        // ロググループ作成
        this.logGroup = this.createLogGroup(props);
        // IAMロール作成
        this.serviceRole = this.createServiceRole(props);
        this.instanceRole = this.createInstanceRole(props);
        this.jobRole = this.createJobRole(props);
        // 起動テンプレート作成
        this.launchTemplate = this.createLaunchTemplate(props);
        // コンピュート環境作成
        this.computeEnvironment = this.createComputeEnvironment(props);
        // ジョブ定義作成
        this.jobDefinition = this.createJobDefinition(props);
        // ジョブキュー作成
        this.jobQueue = this.createJobQueue(props);
        // タグ設定
        this.applyTags(props);
    }
    /**
     * ロググループ作成
     */
    createLogGroup(props) {
        const logGroupName = `/aws/batch/${props.config.computeEnvironment.namePrefix}`;
        return new logs.LogGroup(this, 'BatchLogGroup', {
            logGroupName,
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
    /**
     * Batchサービスロール作成
     */
    createServiceRole(props) {
        const role = new iam.Role(this, 'BatchServiceRole', {
            roleName: `${props.config.computeEnvironment.namePrefix}-service-role`,
            assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole'),
            ],
        });
        // 追加権限: ECS管理
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ecs:CreateCluster',
                'ecs:DeregisterContainerInstance',
                'ecs:DescribeClusters',
                'ecs:DescribeContainerInstances',
                'ecs:DescribeTaskDefinition',
                'ecs:DescribeTasks',
                'ecs:ListClusters',
                'ecs:ListContainerInstances',
                'ecs:ListTaskDefinitionFamilies',
                'ecs:ListTaskDefinitions',
                'ecs:ListTasks',
                'ecs:RegisterTaskDefinition',
                'ecs:RunTask',
                'ecs:StartTask',
                'ecs:StopTask',
                'ecs:SubmitContainerStateChange',
                'ecs:SubmitTaskStateChange',
            ],
            resources: ['*'],
        }));
        return role;
    }
    /**
     * Batchインスタンスロール作成
     */
    createInstanceRole(props) {
        const role = new iam.Role(this, 'BatchInstanceRole', {
            roleName: `${props.config.computeEnvironment.namePrefix}-instance-role`,
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
            ],
        });
        // FSx for NetApp ONTAPアクセス権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'fsx:DescribeFileSystems',
                'fsx:DescribeVolumes',
                'fsx:DescribeSnapshots',
            ],
            resources: [
                `arn:aws:fsx:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:file-system/${props.config.jobDefinition.fsxMount.fileSystemId}`,
            ],
        }));
        // CloudWatch Logs権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
            ],
            resources: [this.logGroup.logGroupArn],
        }));
        return role;
    }
    /**
     * Batchジョブロール作成
     */
    createJobRole(props) {
        const role = new iam.Role(this, 'BatchJobRole', {
            roleName: `${props.config.jobDefinition.namePrefix}-job-role`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
        // OpenSearch Serverlessアクセス権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'aoss:APIAccessAll',
            ],
            resources: ['*'], // OpenSearch Serverlessコレクション
        }));
        // FSxアクセス権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'fsx:DescribeFileSystems',
                'fsx:DescribeVolumes',
            ],
            resources: [
                `arn:aws:fsx:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:file-system/${props.config.jobDefinition.fsxMount.fileSystemId}`,
            ],
        }));
        // CloudWatch Logs権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: [this.logGroup.logGroupArn],
        }));
        // Bedrock権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:GetFoundationModel',
                'bedrock:InvokeModel',
            ],
            resources: [
                `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/*`,
                'arn:aws:bedrock:us-east-1::foundation-model/*',
            ],
        }));
        // ECR権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ecr:BatchGetImage',
                'ecr:GetDownloadUrlForLayer',
                'ecr:GetAuthorizationToken',
            ],
            resources: ['*'],
        }));
        // Secrets Manager権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'secretsmanager:GetSecretValue',
            ],
            resources: ['*'], // Active Directory パスワードシークレット
        }));
        return role;
    }
    /**
     * 起動テンプレート作成
     */
    createLaunchTemplate(props) {
        // FSxマウント用のUserDataスクリプト
        const userData = ec2.UserData.forLinux();
        userData.addCommands('#!/bin/bash', 'yum update -y', 'yum install -y amazon-efs-utils cifs-utils', '', '# FSx for NetApp ONTAPマウント設定', `FSX_FILE_SYSTEM_ID="${props.config.jobDefinition.fsxMount.fileSystemId}"`, `MOUNT_POINT="${props.config.jobDefinition.fsxMount.mountPoint}"`, 'FSX_DNS_NAME="${FSX_FILE_SYSTEM_ID}.fsx.${AWS_DEFAULT_REGION}.amazonaws.com"', '', 'mkdir -p ${MOUNT_POINT}', '', '# SMB/CIFSマウント（読み取り専用）', 'if [ "${props.config.jobDefinition.fsxMount.readOnly}" = "true" ]; then', '  mount -t cifs //${FSX_DNS_NAME}/share ${MOUNT_POINT} -o ro,guest,uid=1000,gid=1000,iocharset=utf8', 'else', '  mount -t cifs //${FSX_DNS_NAME}/share ${MOUNT_POINT} -o guest,uid=1000,gid=1000,iocharset=utf8', 'fi', '', '# マウント確認', 'if mountpoint -q ${MOUNT_POINT}; then', '  echo "FSx mount successful: ${MOUNT_POINT}"', 'else', '  echo "FSx mount failed: ${MOUNT_POINT}"', '  exit 1', 'fi', '', '# ECS Agentの設定', 'echo ECS_CLUSTER=${props.config.computeEnvironment.namePrefix}-cluster >> /etc/ecs/ecs.config', 'echo ECS_ENABLE_LOGGING=true >> /etc/ecs/ecs.config', `echo ECS_LOG_LEVEL=info >> /etc/ecs/ecs.config`, '', '# CloudWatch Agentインストール・設定', 'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm', 'rpm -U ./amazon-cloudwatch-agent.rpm', '', '# ECS Agentの起動', 'start ecs');
        return new ec2.LaunchTemplate(this, 'BatchLaunchTemplate', {
            launchTemplateName: `${props.config.computeEnvironment.namePrefix}-lt`,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
            machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
            userData,
            role: this.instanceRole,
            securityGroup: this.commonResources.securityGroups.commonSecurityGroup,
            blockDevices: [
                {
                    deviceName: '/dev/xvda',
                    volume: ec2.BlockDeviceVolume.ebs(30, {
                        volumeType: ec2.EbsDeviceVolumeType.GP3,
                        encrypted: true,
                    }),
                },
            ],
        });
    }
    /**
     * Batchコンピュート環境作成
     */
    createComputeEnvironment(props) {
        const computeEnvironment = new batch.CfnComputeEnvironment(this, 'BatchComputeEnvironment', {
            computeEnvironmentName: `${props.config.computeEnvironment.namePrefix}-env`,
            type: props.config.computeEnvironment.type,
            state: 'ENABLED',
            serviceRole: this.serviceRole.roleArn,
            computeResources: {
                type: props.config.computeEnvironment.useSpotInstances ? 'EC2' : 'EC2',
                minvCpus: props.config.computeEnvironment.minvCpus,
                maxvCpus: props.config.computeEnvironment.maxvCpus,
                desiredvCpus: props.config.computeEnvironment.desiredvCpus || 0,
                instanceTypes: props.config.computeEnvironment.instanceTypes,
                // Multi-AZ配置のためのサブネット設定
                subnets: this.commonResources.vpc.privateSubnets.map(subnet => subnet.subnetId),
                // セキュリティグループ設定
                securityGroupIds: [this.commonResources.securityGroups.commonSecurityGroup.securityGroupId],
                // インスタンスロール設定
                instanceRole: `arn:aws:iam::${cdk.Stack.of(this).account}:instance-profile/${this.instanceRole.roleName}`,
                // 起動テンプレート設定
                launchTemplate: {
                    launchTemplateId: this.launchTemplate.launchTemplateId,
                    version: '$Latest',
                },
                // スポットインスタンス設定
                ...(props.config.computeEnvironment.useSpotInstances && {
                    spotIamFleetRequestRole: `arn:aws:iam::${cdk.Stack.of(this).account}:role/aws-ec2-spot-fleet-tagging-role`,
                    bidPercentage: props.config.computeEnvironment.spotBidPercentage,
                }),
                // タグ設定
                tags: {
                    Name: `${props.config.computeEnvironment.namePrefix}-instance`,
                    Project: props.projectName,
                    Environment: props.environment,
                    Component: 'Embedding',
                    Module: 'AWS_BATCH',
                    ManagedBy: 'CDK',
                },
            },
        });
        // インスタンスプロファイル作成
        new iam.CfnInstanceProfile(this, 'BatchInstanceProfile', {
            instanceProfileName: this.instanceRole.roleName,
            roles: [this.instanceRole.roleName],
        });
        return computeEnvironment;
    }
    /**
     * Batchジョブ定義作成
     */
    createJobDefinition(props) {
        // 環境変数設定
        const environment = this.createJobEnvironmentVariables(props);
        return new batch.CfnJobDefinition(this, 'BatchJobDefinition', {
            jobDefinitionName: props.jobDefinitionConfig.jobDefinitionName,
            type: 'container',
            platformCapabilities: props.jobDefinitionConfig.platformCapabilities,
            containerProperties: {
                image: `${cdk.Stack.of(this).account}.dkr.ecr.${cdk.Stack.of(this).region}.amazonaws.com/${props.imagePath}/embed:${props.imageTag}`,
                vcpus: props.jobDefinitionConfig.cpu,
                memory: props.jobDefinitionConfig.memoryMiB,
                jobRoleArn: this.jobRole.roleArn,
                // 環境変数設定
                environment: Object.entries(environment).map(([name, value]) => ({
                    name,
                    value,
                })),
                // FSxマウントポイント設定
                mountPoints: [
                    {
                        sourceVolume: 'fsx-data-volume',
                        containerPath: '/opt/netapp/ai/data',
                        readOnly: false,
                    },
                    {
                        sourceVolume: 'fsx-db-volume',
                        containerPath: '/opt/netapp/ai/db',
                        readOnly: false,
                    },
                ],
                // ボリューム設定
                volumes: [
                    {
                        name: 'fsx-data-volume',
                        host: {
                            sourcePath: '/mnt/fsx/data',
                        },
                    },
                    {
                        name: 'fsx-db-volume',
                        host: {
                            sourcePath: '/mnt/fsx/db',
                        },
                    },
                ],
                // ログ設定
                logConfiguration: {
                    logDriver: 'awslogs',
                    options: {
                        'awslogs-group': this.logGroup.logGroupName,
                        'awslogs-region': cdk.Stack.of(this).region,
                        'awslogs-stream-prefix': 'embedding-job',
                    },
                },
                // リソース要件
                resourceRequirements: [
                    {
                        type: 'VCPU',
                        value: props.jobDefinitionConfig.cpu.toString(),
                    },
                    {
                        type: 'MEMORY',
                        value: props.jobDefinitionConfig.memoryMiB.toString(),
                    },
                ],
                // セキュリティ設定
                readonlyRootFilesystem: false, // FSxマウントのため読み書き可能
                privileged: false,
                user: 'root', // FSxマウントのため
            },
            // タイムアウト設定
            timeout: {
                attemptDurationSeconds: props.jobDefinitionConfig.timeoutHours * 3600,
            },
            // 再試行戦略
            retryStrategy: {
                attempts: props.jobDefinitionConfig.retryAttempts,
            },
        });
    }
    /**
     * Job環境変数作成
     */
    createJobEnvironmentVariables(props) {
        const baseEnvironment = {
            ENV_REGION: cdk.Stack.of(this).region,
            AWS_DEFAULT_REGION: cdk.Stack.of(this).region,
            // FSx設定
            FSX_ID: props.fsxIntegrationConfig.fileSystemId || "fs-default",
            SVM_REF: props.fsxIntegrationConfig.svmRef || "svm-default",
            SVM_ID: props.fsxIntegrationConfig.svmId || "svm-default-id",
            CIFSDATA_VOL_NAME: props.fsxIntegrationConfig.cifsdataVolName || "smb_share",
            RAGDB_VOL_PATH: props.fsxIntegrationConfig.ragdbVolPath || "/smb_share/ragdb",
            // Active Directory設定
            AD_DOMAIN: props.activeDirectoryConfig.domain,
            AD_USERNAME: props.activeDirectoryConfig.username,
            // Bedrock設定
            BEDROCK_REGION: props.bedrockConfig.region || cdk.Stack.of(this).region,
            BEDROCK_MODEL_ID: props.bedrockConfig.modelId,
        };
        // OpenSearch Serverless設定
        if (props.openSearchConfig.collectionName) {
            baseEnvironment.ENV_OPEN_SEARCH_SERVERLESS_COLLECTION_NAME =
                props.openSearchConfig.collectionName;
        }
        // RDS設定（OpenSearchの代替）
        if (props.rdsConfig?.secretName) {
            baseEnvironment.ENV_RDS_SECRETS_NAME = props.rdsConfig.secretName;
            baseEnvironment.ENV_SECRETS_ARN = props.rdsConfig.secretArn;
            baseEnvironment.ENV_RDS_ARN = props.rdsConfig.clusterArn;
        }
        return baseEnvironment;
    }
    /**
     * Batchジョブキュー作成
     */
    createJobQueue(props) {
        const jobQueue = new batch.CfnJobQueue(this, 'BatchJobQueue', {
            jobQueueName: `${props.config.jobQueue.namePrefix}-queue`,
            state: props.config.jobQueue.state,
            priority: props.config.jobQueue.priority,
            computeEnvironmentOrder: [
                {
                    order: 1,
                    computeEnvironment: this.computeEnvironment.ref,
                },
            ],
            tags: {
                Name: `${props.config.jobQueue.namePrefix}-queue`,
                Project: props.projectName,
                Environment: props.environment,
                Component: 'Embedding',
                Module: 'AWS_BATCH',
                ManagedBy: 'CDK',
                AutoScaling: props.config.autoScaling.enabled.toString(),
            },
        });
        // 自動スケーリング設定
        if (props.config.autoScaling.enabled) {
            this.configureJobQueueAutoScaling(props, jobQueue);
        }
        // 自動復旧機能設定
        this.configureJobQueueAutoRecovery(props, jobQueue);
        return jobQueue;
    }
    /**
     * Job Queue自動スケーリング設定
     */
    configureJobQueueAutoScaling(props, jobQueue) {
        // CloudWatchメトリクス作成
        const queueSizeMetric = new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/Batch',
            metricName: 'SubmittedJobs',
            dimensionsMap: {
                JobQueue: jobQueue.jobQueueName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
        });
        const runningJobsMetric = new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/Batch',
            metricName: 'RunnableJobs',
            dimensionsMap: {
                JobQueue: jobQueue.jobQueueName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
        });
        // スケールアウトアラーム
        const scaleOutAlarm = new cdk.aws_cloudwatch.Alarm(this, 'BatchScaleOutAlarm', {
            alarmName: `${props.config.jobQueue.namePrefix}-scale-out`,
            alarmDescription: 'Batch Job Queue scale out alarm',
            metric: queueSizeMetric,
            threshold: 5, // キューに5つ以上のジョブがある場合
            evaluationPeriods: 2,
            datapointsToAlarm: 2,
            comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        // スケールインアラーム
        const scaleInAlarm = new cdk.aws_cloudwatch.Alarm(this, 'BatchScaleInAlarm', {
            alarmName: `${props.config.jobQueue.namePrefix}-scale-in`,
            alarmDescription: 'Batch Job Queue scale in alarm',
            metric: runningJobsMetric,
            threshold: 1, // 実行中のジョブが1つ以下の場合
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
            comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            treatMissingData: cdk.aws_cloudwatch.TreatMissingData.BREACHING,
        });
        // Lambda関数でスケーリング処理
        const scalingFunction = new cdk.aws_lambda.Function(this, 'BatchScalingFunction', {
            functionName: `${props.config.jobQueue.namePrefix}-scaling`,
            runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
            handler: 'index.handler',
            code: cdk.aws_lambda.Code.fromInline(`
import boto3
import json
import os

def handler(event, context):
    batch_client = boto3.client('batch')
    compute_env_name = os.environ['COMPUTE_ENVIRONMENT_NAME']
    
    # CloudWatchアラームからの通知を処理
    message = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = message['AlarmName']
    new_state = message['NewStateValue']
    
    if 'scale-out' in alarm_name and new_state == 'ALARM':
        # スケールアウト処理
        response = batch_client.update_compute_environment(
            computeEnvironment=compute_env_name,
            computeResources={
                'desiredvCpus': min(
                    int(os.environ.get('MAX_VCPUS', '1000')),
                    int(os.environ.get('CURRENT_VCPUS', '0')) + 100
                )
            }
        )
        print(f"Scaled out: {response}")
        
    elif 'scale-in' in alarm_name and new_state == 'ALARM':
        # スケールイン処理
        response = batch_client.update_compute_environment(
            computeEnvironment=compute_env_name,
            computeResources={
                'desiredvCpus': max(
                    int(os.environ.get('MIN_VCPUS', '0')),
                    int(os.environ.get('CURRENT_VCPUS', '0')) - 50
                )
            }
        )
        print(f"Scaled in: {response}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Scaling completed')
    }
      `),
            environment: {
                COMPUTE_ENVIRONMENT_NAME: this.computeEnvironment.computeEnvironmentName,
                MAX_VCPUS: props.config.computeEnvironment.maxvCpus.toString(),
                MIN_VCPUS: props.config.computeEnvironment.minvCpus.toString(),
            },
            timeout: cdk.Duration.minutes(5),
        });
        // Lambda実行権限
        scalingFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'batch:UpdateComputeEnvironment',
                'batch:DescribeComputeEnvironments',
            ],
            resources: [this.computeEnvironment.attrComputeEnvironmentArn],
        }));
        // SNSトピック作成
        const scalingTopic = new cdk.aws_sns.Topic(this, 'BatchScalingTopic', {
            topicName: `${props.config.jobQueue.namePrefix}-scaling-topic`,
            displayName: 'Batch Auto Scaling Notifications',
        });
        // Lambda関数をSNSトピックにサブスクライブ
        scalingTopic.addSubscription(new cdk.aws_sns_subscriptions.LambdaSubscription(scalingFunction));
        // アラームをSNSトピックに接続
        scaleOutAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(scalingTopic));
        scaleInAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(scalingTopic));
    }
    /**
     * Job Queue自動復旧機能設定
     */
    configureJobQueueAutoRecovery(props, jobQueue) {
        // 失敗ジョブ監視メトリクス
        const failedJobsMetric = new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/Batch',
            metricName: 'FailedJobs',
            dimensionsMap: {
                JobQueue: jobQueue.jobQueueName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
        });
        // 失敗ジョブアラーム
        const failedJobsAlarm = new cdk.aws_cloudwatch.Alarm(this, 'BatchFailedJobsAlarm', {
            alarmName: `${props.config.jobQueue.namePrefix}-failed-jobs`,
            alarmDescription: 'Batch Job failures alarm',
            metric: failedJobsMetric,
            threshold: 3, // 5分間に3つ以上のジョブが失敗した場合
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        // 自動復旧Lambda関数
        const recoveryFunction = new cdk.aws_lambda.Function(this, 'BatchRecoveryFunction', {
            functionName: `${props.config.jobQueue.namePrefix}-recovery`,
            runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
            handler: 'index.handler',
            code: cdk.aws_lambda.Code.fromInline(`
import boto3
import json
import os
from datetime import datetime, timedelta

def handler(event, context):
    batch_client = boto3.client('batch')
    logs_client = boto3.client('logs')
    
    job_queue_name = os.environ['JOB_QUEUE_NAME']
    compute_env_name = os.environ['COMPUTE_ENVIRONMENT_NAME']
    
    try:
        # 失敗したジョブを取得
        failed_jobs = batch_client.list_jobs(
            jobQueue=job_queue_name,
            jobStatus='FAILED',
            maxResults=10
        )
        
        recovery_actions = []
        
        for job in failed_jobs['jobList']:
            job_id = job['jobId']
            job_name = job['jobName']
            
            # ジョブの詳細情報を取得
            job_detail = batch_client.describe_jobs(jobs=[job_id])
            job_info = job_detail['jobs'][0]
            
            # 失敗理由を分析
            status_reason = job_info.get('statusReason', '')
            
            if 'Host EC2' in status_reason or 'Spot' in status_reason:
                # インスタンス関連の問題 - コンピュート環境をリフレッシュ
                recovery_actions.append({
                    'action': 'refresh_compute_environment',
                    'reason': 'Instance failure detected',
                    'job_id': job_id
                })
                
            elif 'OutOfMemory' in status_reason or 'OOMKilled' in status_reason:
                # メモリ不足 - より大きなインスタンスタイプを推奨
                recovery_actions.append({
                    'action': 'recommend_larger_instance',
                    'reason': 'Memory exhaustion detected',
                    'job_id': job_id
                })
                
            elif 'Task failed' in status_reason:
                # タスク失敗 - ジョブを再実行
                recovery_actions.append({
                    'action': 'retry_job',
                    'reason': 'Task failure detected',
                    'job_id': job_id,
                    'job_name': job_name
                })
        
        # 復旧アクションを実行
        for action in recovery_actions:
            if action['action'] == 'refresh_compute_environment':
                # コンピュート環境の更新（強制リフレッシュ）
                batch_client.update_compute_environment(
                    computeEnvironment=compute_env_name,
                    state='DISABLED'
                )
                # 少し待ってから再有効化
                import time
                time.sleep(30)
                batch_client.update_compute_environment(
                    computeEnvironment=compute_env_name,
                    state='ENABLED'
                )
                print(f"Refreshed compute environment for job {action['job_id']}")
                
            elif action['action'] == 'retry_job':
                # 失敗したジョブを再実行（新しいジョブとして）
                original_job = batch_client.describe_jobs(jobs=[action['job_id']])['jobs'][0]
                
                retry_job = batch_client.submit_job(
                    jobName=f"{action['job_name']}-retry-{int(datetime.now().timestamp())}",
                    jobQueue=job_queue_name,
                    jobDefinition=original_job['jobDefinitionArn'],
                    parameters=original_job.get('parameters', {}),
                    timeout=original_job.get('timeout', {}),
                    retryStrategy={'attempts': 1}  # 再試行は1回のみ
                )
                print(f"Retried job {action['job_id']} as {retry_job['jobId']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Recovery actions completed',
                'actions_taken': len(recovery_actions),
                'details': recovery_actions
            })
        }
        
    except Exception as e:
        print(f"Recovery failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
      `),
            environment: {
                JOB_QUEUE_NAME: jobQueue.jobQueueName,
                COMPUTE_ENVIRONMENT_NAME: this.computeEnvironment.computeEnvironmentName,
            },
            timeout: cdk.Duration.minutes(10),
        });
        // Lambda実行権限
        recoveryFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'batch:ListJobs',
                'batch:DescribeJobs',
                'batch:SubmitJob',
                'batch:UpdateComputeEnvironment',
                'batch:DescribeComputeEnvironments',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
            ],
            resources: ['*'],
        }));
        // SNSトピック作成
        const recoveryTopic = new cdk.aws_sns.Topic(this, 'BatchRecoveryTopic', {
            topicName: `${props.config.jobQueue.namePrefix}-recovery-topic`,
            displayName: 'Batch Auto Recovery Notifications',
        });
        // Lambda関数をSNSトピックにサブスクライブ
        recoveryTopic.addSubscription(new cdk.aws_sns_subscriptions.LambdaSubscription(recoveryFunction));
        // 失敗アラームを復旧トピックに接続
        failedJobsAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(recoveryTopic));
        // 復旧状況ダッシュボード作成
        this.createRecoveryDashboard(props, jobQueue, failedJobsAlarm);
    }
    /**
     * 復旧状況ダッシュボード作成
     */
    createRecoveryDashboard(props, jobQueue, failedJobsAlarm) {
        const dashboard = new cdk.aws_cloudwatch.Dashboard(this, 'BatchRecoveryDashboard', {
            dashboardName: `${props.config.jobQueue.namePrefix}-recovery-dashboard`,
        });
        // ジョブ状況ウィジェット
        dashboard.addWidgets(new cdk.aws_cloudwatch.GraphWidget({
            title: 'Batch Job Status',
            left: [
                new cdk.aws_cloudwatch.Metric({
                    namespace: 'AWS/Batch',
                    metricName: 'SubmittedJobs',
                    dimensionsMap: { JobQueue: jobQueue.jobQueueName },
                    statistic: 'Sum',
                }),
                new cdk.aws_cloudwatch.Metric({
                    namespace: 'AWS/Batch',
                    metricName: 'RunnableJobs',
                    dimensionsMap: { JobQueue: jobQueue.jobQueueName },
                    statistic: 'Sum',
                }),
                new cdk.aws_cloudwatch.Metric({
                    namespace: 'AWS/Batch',
                    metricName: 'RunningJobs',
                    dimensionsMap: { JobQueue: jobQueue.jobQueueName },
                    statistic: 'Sum',
                }),
                new cdk.aws_cloudwatch.Metric({
                    namespace: 'AWS/Batch',
                    metricName: 'FailedJobs',
                    dimensionsMap: { JobQueue: jobQueue.jobQueueName },
                    statistic: 'Sum',
                }),
            ],
            width: 12,
            height: 6,
        }));
        // コンピュート環境リソース使用状況
        dashboard.addWidgets(new cdk.aws_cloudwatch.GraphWidget({
            title: 'Compute Environment Resources',
            left: [
                new cdk.aws_cloudwatch.Metric({
                    namespace: 'AWS/Batch',
                    metricName: 'RunningOnDemandCapacity',
                    dimensionsMap: { ComputeEnvironment: this.computeEnvironment.computeEnvironmentName },
                    statistic: 'Average',
                }),
                new cdk.aws_cloudwatch.Metric({
                    namespace: 'AWS/Batch',
                    metricName: 'RunningSpotCapacity',
                    dimensionsMap: { ComputeEnvironment: this.computeEnvironment.computeEnvironmentName },
                    statistic: 'Average',
                }),
            ],
            width: 12,
            height: 6,
        }));
        // アラーム状況ウィジェット
        dashboard.addWidgets(new cdk.aws_cloudwatch.AlarmWidget({
            title: 'Recovery Alarms',
            alarm: failedJobsAlarm,
            width: 12,
            height: 4,
        }));
    }
    /**
     * タグ設定
     */
    applyTags(props) {
        const tags = {
            Project: props.projectName,
            Environment: props.environment,
            Component: 'Embedding',
            Module: 'AWS_BATCH',
            ManagedBy: 'CDK',
            MultiAZ: props.config.computeEnvironment.multiAz.toString(),
            AutoScaling: props.config.autoScaling.enabled.toString(),
        };
        Object.entries(tags).forEach(([key, value]) => {
            cdk.Tags.of(this).add(key, value);
        });
    }
    /**
     * モジュール固有リソース取得
     */
    get moduleResources() {
        return {
            batch: {
                computeEnvironment: this.computeEnvironment,
                jobDefinition: this.jobDefinition,
                jobQueue: this.jobQueue,
                launchTemplate: this.launchTemplate,
            },
        };
    }
    /**
     * モジュール依存関係取得
     */
    get dependencies() {
        return {
            requiredModules: ['VPC', 'SECURITY_GROUP', 'IAM'],
            optionalModules: ['MONITORING', 'LOGGING'],
            requiredResources: {
                requiresVpc: true,
                requiresSecurityGroup: true,
                requiresIamRole: true,
                requiresStorage: true,
                requiresLogging: true,
            },
            providedResources: {
                providesCompute: true,
                providesStorage: false,
                providesNetwork: false,
                providesMonitoring: false,
            },
        };
    }
    /**
     * ジョブ実行メソッド
     */
    submitJob(jobName, parameters) {
        // 実際の実装では、AWS SDKを使用してジョブを投入
        // ここではジョブIDのプレースホルダーを返す
        return `${jobName}-${Date.now()}`;
    }
    /**
     * Job Queue状態管理
     */
    enableJobQueue() {
        // Job Queueを有効化
        // 実際の実装では、AWS SDKを使用してJob Queueの状態を変更
        console.log(`Enabling job queue: ${this.jobQueue.jobQueueName}`);
    }
    disableJobQueue() {
        // Job Queueを無効化
        // 実際の実装では、AWS SDKを使用してJob Queueの状態を変更
        console.log(`Disabling job queue: ${this.jobQueue.jobQueueName}`);
    }
    /**
     * Job Queue優先度変更
     */
    updateJobQueuePriority(newPriority) {
        // Job Queueの優先度を変更
        // 実際の実装では、AWS SDKを使用してJob Queueの優先度を変更
        console.log(`Updating job queue priority to: ${newPriority}`);
    }
    /**
     * Job Queue監視メトリクス取得
     */
    getJobQueueMetrics() {
        return {
            queueName: this.jobQueue.jobQueueName,
            computeEnvironment: this.computeEnvironment.computeEnvironmentName,
            autoScalingEnabled: true,
            autoRecoveryEnabled: true,
            dashboardUrl: `https://console.aws.amazon.com/cloudwatch/home#dashboards:name=${this.jobQueue.jobQueueName}-recovery-dashboard`,
        };
    }
    /**
     * Auto Scaling設定
     */
    configureAutoScaling(props) {
        if (!props.config.autoScaling.enabled) {
            return;
        }
        // CloudWatchメトリクスベースの自動スケーリング設定
        // 実際の実装では、Application Auto Scalingを使用
        console.log('Auto Scaling configuration:', {
            scaleOutThreshold: props.config.autoScaling.scaleOutThreshold,
            scaleInThreshold: props.config.autoScaling.scaleInThreshold,
            cooldownPeriod: props.config.autoScaling.cooldownPeriod,
        });
    }
}
exports.BatchConstruct = BatchConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmF0Y2gtY29uc3RydWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmF0Y2gtY29uc3RydWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLDZEQUErQztBQUMvQyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQywyREFBNkM7QUFNN0MsMkNBQXVDO0FBNkN2Qzs7Ozs7Ozs7R0FRRztBQUNILE1BQWEsY0FBZSxTQUFRLHNCQUFTO0lBQzNDLGFBQWE7SUFDRyxVQUFVLEdBQUcsV0FBVyxDQUFDO0lBRXpDLGlCQUFpQjtJQUNELE9BQU8sQ0FBVTtJQUVqQyxlQUFlO0lBQ0MsZUFBZSxDQUEyQjtJQUUxRCxvQkFBb0I7SUFDSixrQkFBa0IsQ0FBOEI7SUFFaEUsaUJBQWlCO0lBQ0QsYUFBYSxDQUF5QjtJQUV0RCxrQkFBa0I7SUFDRixRQUFRLENBQW9CO0lBRTVDLGVBQWU7SUFDQyxjQUFjLENBQXFCO0lBRW5ELGNBQWM7SUFDRSxXQUFXLENBQVc7SUFFdEMsZ0JBQWdCO0lBQ0EsWUFBWSxDQUFXO0lBRXZDLGFBQWE7SUFDRyxPQUFPLENBQVc7SUFFbEMsYUFBYTtJQUNHLFFBQVEsQ0FBZ0I7SUFFeEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUEwQjtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDcEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO1FBRTdDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEIsT0FBTztRQUNULENBQUM7UUFFRCxXQUFXO1FBQ1gsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsY0FBYyxD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LENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUI7WUFDN0QsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCO1lBQzNELGNBQWMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjO1NBQ3hELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZnQ0Qsd0NBdWdDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQVdTIEJhdGNoIENvbnN0cnVjdFxuICogXG4gKiBBZ2VudCBTdGVlcmluZ+ODq+ODvOODq+a6luaLoDpcbiAqIC0g44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj5by35Yi277yIbGliL21vZHVsZXMvY29tcHV0ZS9jb25zdHJ1Y3RzL++8iVxuICogLSDljZjkuIDpmpzlrrPngrnmjpLpmaTjgajjg6Hjg7Pjg4bjg4rjg7PjgrnosqDojbfou73muJvjgpLmnIDph43opoHoppZcbiAqIC0gTXVsdGktQVog5qeL5oiQ44Gn44Gu44Oe44ON44O844K444OJIEVDMiDnkrDlooNcbiAqIFxuICogUmVxdWlyZW1lbnRzOiAxLjEsIDEuMiwgMS4zLCA1LjFcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYmF0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWJhdGNoJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGVjcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0ICogYXMgc25zU3Vic2NyaXB0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoQWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgRW1iZWRkaW5nQmF0Y2hDb25maWcsIEVtYmVkZGluZ0pvYkRlZmluaXRpb25Db25maWcsIEVtYmVkZGluZ0ZzeEludGVncmF0aW9uQ29uZmlnLCBFbWJlZGRpbmdBY3RpdmVEaXJlY3RvcnlDb25maWcsIEVtYmVkZGluZ0JlZHJvY2tDb25maWcsIEVtYmVkZGluZ09wZW5TZWFyY2hJbnRlZ3JhdGlvbkNvbmZpZywgRW1iZWRkaW5nUmRzQ29uZmlnIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9lbWJlZGRpbmctY29uZmlnJztcbmltcG9ydCB7IEVtYmVkZGluZ01vZHVsZUludGVyZmFjZSwgRW1iZWRkaW5nQ29tbW9uUmVzb3VyY2VzIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9tb2R1bGUtaW50ZXJmYWNlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmF0Y2hDb25zdHJ1Y3RQcm9wcyB7XG4gIC8qKiBCYXRjaOioreWumiAqL1xuICByZWFkb25seSBjb25maWc6IEVtYmVkZGluZ0JhdGNoQ29uZmlnO1xuICBcbiAgLyoqIEpvYiBEZWZpbml0aW9u6Kit5a6aICovXG4gIHJlYWRvbmx5IGpvYkRlZmluaXRpb25Db25maWc6IEVtYmVkZGluZ0pvYkRlZmluaXRpb25Db25maWc7XG4gIFxuICAvKiogRlN457Wx5ZCI6Kit5a6aICovXG4gIHJlYWRvbmx5IGZzeEludGVncmF0aW9uQ29uZmlnOiBFbWJlZGRpbmdGc3hJbnRlZ3JhdGlvbkNvbmZpZztcbiAgXG4gIC8qKiBBY3RpdmUgRGlyZWN0b3J56Kit5a6aICovXG4gIHJlYWRvbmx5IGFjdGl2ZURpcmVjdG9yeUNvbmZpZzogRW1iZWRkaW5nQWN0aXZlRGlyZWN0b3J5Q29uZmlnO1xuICBcbiAgLyoqIEJlZHJvY2voqK3lrpogKi9cbiAgcmVhZG9ubHkgYmVkcm9ja0NvbmZpZzogRW1iZWRkaW5nQmVkcm9ja0NvbmZpZztcbiAgXG4gIC8qKiBPcGVuU2VhcmNo6Kit5a6aICovXG4gIHJlYWRvbmx5IG9wZW5TZWFyY2hDb25maWc6IEVtYmVkZGluZ09wZW5TZWFyY2hJbnRlZ3JhdGlvbkNvbmZpZztcbiAgXG4gIC8qKiBSRFPoqK3lrprvvIjjgqrjg5fjgrfjg6fjg7PvvIkgKi9cbiAgcmVhZG9ubHkgcmRzQ29uZmlnPzogRW1iZWRkaW5nUmRzQ29uZmlnO1xuICBcbiAgLyoqIEVDUuOCpOODoeODvOOCuOODkeOCuSAqL1xuICByZWFkb25seSBpbWFnZVBhdGg6IHN0cmluZztcbiAgXG4gIC8qKiDjgqTjg6Hjg7zjgrjjgr/jgrAgKi9cbiAgcmVhZG9ubHkgaW1hZ2VUYWc6IHN0cmluZztcbiAgXG4gIC8qKiDjg5fjg63jgrjjgqfjgq/jg4jlkI0gKi9cbiAgcmVhZG9ubHkgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgXG4gIC8qKiDnkrDlooPlkI0gKi9cbiAgcmVhZG9ubHkgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgXG4gIC8qKiDlhbHpgJrjg6rjgr3jg7zjgrkgKi9cbiAgcmVhZG9ubHkgY29tbW9uUmVzb3VyY2VzOiBFbWJlZGRpbmdDb21tb25SZXNvdXJjZXM7XG4gIFxuICAvKiog57Wx5LiA5ZG95ZCN6KaP5YmH44K444Kn44ON44Os44O844K/44O8ICovXG4gIHJlYWRvbmx5IG5hbWluZ0dlbmVyYXRvcj86IGFueTtcbn1cblxuLyoqXG4gKiBBV1MgQmF0Y2ggQ29uc3RydWN0XG4gKiBcbiAqIOapn+iDvTpcbiAqIC0gTXVsdGktQVrmp4vmiJDjgafjga7jg57jg43jg7zjgrjjg4lFQzLnkrDlooNcbiAqIC0g6Ieq5YuV44K544Kx44O844Oq44Oz44Kw6Kit5a6a77yIbWludkNwdXM6IDAsIG1heHZDcHVzOiAxMDAw77yJXG4gKiAtIOOCpOODs+OCueOCv+ODs+OCueOCv+OCpOODl+ioreWumu+8iG01LmxhcmdlLCBtNS54bGFyZ2XvvIlcbiAqIC0gRlN4IGZvciBOZXRBcHAgT05UQVDntbHlkIhcbiAqL1xuZXhwb3J0IGNsYXNzIEJhdGNoQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IGltcGxlbWVudHMgRW1iZWRkaW5nTW9kdWxlSW50ZXJmYWNlIHtcbiAgLyoqIOODouOCuOODpeODvOODq+WQjSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbW9kdWxlTmFtZSA9ICdBV1NfQkFUQ0gnO1xuICBcbiAgLyoqIOODouOCuOODpeODvOODq+acieWKueWMlueKtuaFiyAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZW5hYmxlZDogYm9vbGVhbjtcbiAgXG4gIC8qKiDlhbHpgJrjg6rjgr3jg7zjgrnlj4LnhacgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNvbW1vblJlc291cmNlczogRW1iZWRkaW5nQ29tbW9uUmVzb3VyY2VzO1xuICBcbiAgLyoqIEJhdGNo44Kz44Oz44OU44Ol44O844OI55Kw5aKDICovXG4gIHB1YmxpYyByZWFkb25seSBjb21wdXRlRW52aXJvbm1lbnQ6IGJhdGNoLkNmbkNvbXB1dGVFbnZpcm9ubWVudDtcbiAgXG4gIC8qKiBCYXRjaOOCuOODp+ODluWumue+qSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgam9iRGVmaW5pdGlvbjogYmF0Y2guQ2ZuSm9iRGVmaW5pdGlvbjtcbiAgXG4gIC8qKiBCYXRjaOOCuOODp+ODluOCreODpeODvCAqL1xuICBwdWJsaWMgcmVhZG9ubHkgam9iUXVldWU6IGJhdGNoLkNmbkpvYlF1ZXVlO1xuICBcbiAgLyoqIOi1t+WLleODhuODs+ODl+ODrOODvOODiCAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbGF1bmNoVGVtcGxhdGU6IGVjMi5MYXVuY2hUZW1wbGF0ZTtcbiAgXG4gIC8qKiDjgrXjg7zjg5Pjgrnjg63jg7zjg6sgKi9cbiAgcHVibGljIHJlYWRvbmx5IHNlcnZpY2VSb2xlOiBpYW0uUm9sZTtcbiAgXG4gIC8qKiDjgqTjg7Pjgrnjgr/jg7Pjgrnjg63jg7zjg6sgKi9cbiAgcHVibGljIHJlYWRvbmx5IGluc3RhbmNlUm9sZTogaWFtLlJvbGU7XG4gIFxuICAvKiog44K444On44OW44Ot44O844OrICovXG4gIHB1YmxpYyByZWFkb25seSBqb2JSb2xlOiBpYW0uUm9sZTtcbiAgXG4gIC8qKiDjg63jgrDjgrDjg6vjg7zjg5cgKi9cbiAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwOiBsb2dzLkxvZ0dyb3VwO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBCYXRjaENvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIHRoaXMuZW5hYmxlZCA9IHByb3BzLmNvbmZpZy5lbmFibGVkO1xuICAgIHRoaXMuY29tbW9uUmVzb3VyY2VzID0gcHJvcHMuY29tbW9uUmVzb3VyY2VzO1xuXG4gICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyDjg63jgrDjgrDjg6vjg7zjg5fkvZzmiJBcbiAgICB0aGlzLmxvZ0dyb3VwID0gdGhpcy5jcmVhdGVMb2dHcm91cChwcm9wcyk7XG5cbiAgICAvLyBJQU3jg63jg7zjg6vkvZzmiJBcbiAgICB0aGlzLnNlcnZpY2VSb2xlID0gdGhpcy5jcmVhdGVTZXJ2aWNlUm9sZShwcm9wcyk7XG4gICAgdGhpcy5pbnN0YW5jZVJvbGUgPSB0aGlzLmNyZWF0ZUluc3RhbmNlUm9sZShwcm9wcyk7XG4gICAgdGhpcy5qb2JSb2xlID0gdGhpcy5jcmVhdGVKb2JSb2xlKHByb3BzKTtcblxuICAgIC8vIOi1t+WLleODhuODs+ODl+ODrOODvOODiOS9nOaIkFxuICAgIHRoaXMubGF1bmNoVGVtcGxhdGUgPSB0aGlzLmNyZWF0ZUxhdW5jaFRlbXBsYXRlKHByb3BzKTtcblxuICAgIC8vIOOCs+ODs+ODlOODpeODvOODiOeSsOWig+S9nOaIkFxuICAgIHRoaXMuY29tcHV0ZUVudmlyb25tZW50ID0gdGhpcy5jcmVhdGVDb21wdXRlRW52aXJvbm1lbnQocHJvcHMpO1xuXG4gICAgLy8g44K444On44OW5a6a576p5L2c5oiQXG4gICAgdGhpcy5qb2JEZWZpbml0aW9uID0gdGhpcy5jcmVhdGVKb2JEZWZpbml0aW9uKHByb3BzKTtcblxuICAgIC8vIOOCuOODp+ODluOCreODpeODvOS9nOaIkFxuICAgIHRoaXMuam9iUXVldWUgPSB0aGlzLmNyZWF0ZUpvYlF1ZXVlKHByb3BzKTtcblxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIHRoaXMuYXBwbHlUYWdzKHByb3BzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg63jgrDjgrDjg6vjg7zjg5fkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlTG9nR3JvdXAocHJvcHM6IEJhdGNoQ29uc3RydWN0UHJvcHMpOiBsb2dzLkxvZ0dyb3VwIHtcbiAgICBjb25zdCBsb2dHcm91cE5hbWUgPSBgL2F3cy9iYXRjaC8ke3Byb3BzLmNvbmZpZy5jb21wdXRlRW52aXJvbm1lbnQubmFtZVByZWZpeH1gO1xuICAgIFxuICAgIHJldHVybiBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnQmF0Y2hMb2dHcm91cCcsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZSxcbiAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQmF0Y2jjgrXjg7zjg5Pjgrnjg63jg7zjg6vkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlU2VydmljZVJvbGUocHJvcHM6IEJhdGNoQ29uc3RydWN0UHJvcHMpOiBpYW0uUm9sZSB7XG4gICAgY29uc3Qgcm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQmF0Y2hTZXJ2aWNlUm9sZScsIHtcbiAgICAgIHJvbGVOYW1lOiBgJHtwcm9wcy5jb25maWcuY29tcHV0ZUVudmlyb25tZW50Lm5hbWVQcmVmaXh9LXNlcnZpY2Utcm9sZWAsXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnYmF0Y2guYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0JhdGNoU2VydmljZVJvbGUnKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyDov73liqDmqKnpmZA6IEVDU+euoeeQhlxuICAgIHJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnZWNzOkNyZWF0ZUNsdXN0ZXInLFxuICAgICAgICAnZWNzOkRlcmVnaXN0ZXJDb250YWluZXJJbnN0YW5jZScsXG4gICAgICAgICdlY3M6RGVzY3JpYmVDbHVzdGVycycsXG4gICAgICAgICdlY3M6RGVzY3JpYmVDb250YWluZXJJbnN0YW5jZXMnLFxuICAgICAgICAnZWNzOkRlc2NyaWJlVGFza0RlZmluaXRpb24nLFxuICAgICAgICAnZWNzOkRlc2NyaWJlVGFza3MnLFxuICAgICAgICAnZWNzOkxpc3RDbHVzdGVycycsXG4gICAgICAgICdlY3M6TGlzdENvbnRhaW5lckluc3RhbmNlcycsXG4gICAgICAgICdlY3M6TGlzdFRhc2tEZWZpbml0aW9uRmFtaWxpZXMnLFxuICAgICAgICAnZWNzOkxpc3RUYXNrRGVmaW5pdGlvbnMnLFxuICAgICAgICAnZWNzOkxpc3RUYXNrcycsXG4gICAgICAgICdlY3M6UmVnaXN0ZXJUYXNrRGVmaW5pdGlvbicsXG4gICAgICAgICdlY3M6UnVuVGFzaycsXG4gICAgICAgICdlY3M6U3RhcnRUYXNrJyxcbiAgICAgICAgJ2VjczpTdG9wVGFzaycsXG4gICAgICAgICdlY3M6U3VibWl0Q29udGFpbmVyU3RhdGVDaGFuZ2UnLFxuICAgICAgICAnZWNzOlN1Ym1pdFRhc2tTdGF0ZUNoYW5nZScsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcm9sZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXRjaOOCpOODs+OCueOCv+ODs+OCueODreODvOODq+S9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVJbnN0YW5jZVJvbGUocHJvcHM6IEJhdGNoQ29uc3RydWN0UHJvcHMpOiBpYW0uUm9sZSB7XG4gICAgY29uc3Qgcm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQmF0Y2hJbnN0YW5jZVJvbGUnLCB7XG4gICAgICByb2xlTmFtZTogYCR7cHJvcHMuY29uZmlnLmNvbXB1dGVFbnZpcm9ubWVudC5uYW1lUHJlZml4fS1pbnN0YW5jZS1yb2xlYCxcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlYzIuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FtYXpvbkVDMkNvbnRhaW5lclNlcnZpY2Vmb3JFQzJSb2xlJyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gRlN4IGZvciBOZXRBcHAgT05UQVDjgqLjgq/jgrvjgrnmqKnpmZBcbiAgICByb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2ZzeDpEZXNjcmliZUZpbGVTeXN0ZW1zJyxcbiAgICAgICAgJ2ZzeDpEZXNjcmliZVZvbHVtZXMnLFxuICAgICAgICAnZnN4OkRlc2NyaWJlU25hcHNob3RzJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgYGFybjphd3M6ZnN4OiR7Y2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbn06JHtjZGsuU3RhY2sub2YodGhpcykuYWNjb3VudH06ZmlsZS1zeXN0ZW0vJHtwcm9wcy5jb25maWcuam9iRGVmaW5pdGlvbi5mc3hNb3VudC5maWxlU3lzdGVtSWR9YCxcbiAgICAgIF0sXG4gICAgfSkpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2dz5qip6ZmQXG4gICAgcm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFt0aGlzLmxvZ0dyb3VwLmxvZ0dyb3VwQXJuXSxcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcm9sZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXRjaOOCuOODp+ODluODreODvOODq+S9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVKb2JSb2xlKHByb3BzOiBCYXRjaENvbnN0cnVjdFByb3BzKTogaWFtLlJvbGUge1xuICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0JhdGNoSm9iUm9sZScsIHtcbiAgICAgIHJvbGVOYW1lOiBgJHtwcm9wcy5jb25maWcuam9iRGVmaW5pdGlvbi5uYW1lUHJlZml4fS1qb2Itcm9sZWAsXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWNzLXRhc2tzLmFtYXpvbmF3cy5jb20nKSxcbiAgICB9KTtcblxuICAgIC8vIE9wZW5TZWFyY2ggU2VydmVybGVzc+OCouOCr+OCu+OCueaoqemZkFxuICAgIHJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYW9zczpBUElBY2Nlc3NBbGwnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sIC8vIE9wZW5TZWFyY2ggU2VydmVybGVzc+OCs+ODrOOCr+OCt+ODp+ODs1xuICAgIH0pKTtcblxuICAgIC8vIEZTeOOCouOCr+OCu+OCueaoqemZkFxuICAgIHJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnZnN4OkRlc2NyaWJlRmlsZVN5c3RlbXMnLFxuICAgICAgICAnZnN4OkRlc2NyaWJlVm9sdW1lcycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgIGBhcm46YXdzOmZzeDoke2Nkay5TdGFjay5vZih0aGlzKS5yZWdpb259OiR7Y2RrLlN0YWNrLm9mKHRoaXMpLmFjY291bnR9OmZpbGUtc3lzdGVtLyR7cHJvcHMuY29uZmlnLmpvYkRlZmluaXRpb24uZnN4TW91bnQuZmlsZVN5c3RlbUlkfWAsXG4gICAgICBdLFxuICAgIH0pKTtcblxuICAgIC8vIENsb3VkV2F0Y2ggTG9nc+aoqemZkFxuICAgIHJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW3RoaXMubG9nR3JvdXAubG9nR3JvdXBBcm5dLFxuICAgIH0pKTtcblxuICAgIC8vIEJlZHJvY2vmqKnpmZBcbiAgICByb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2JlZHJvY2s6R2V0Rm91bmRhdGlvbk1vZGVsJyxcbiAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWwnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW1xuICAgICAgICBgYXJuOmF3czpiZWRyb2NrOiR7Y2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbn06OmZvdW5kYXRpb24tbW9kZWwvKmAsXG4gICAgICAgICdhcm46YXdzOmJlZHJvY2s6dXMtZWFzdC0xOjpmb3VuZGF0aW9uLW1vZGVsLyonLFxuICAgICAgXSxcbiAgICB9KSk7XG5cbiAgICAvLyBFQ1LmqKnpmZBcbiAgICByb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2VjcjpCYXRjaEdldEltYWdlJyxcbiAgICAgICAgJ2VjcjpHZXREb3dubG9hZFVybEZvckxheWVyJyxcbiAgICAgICAgJ2VjcjpHZXRBdXRob3JpemF0aW9uVG9rZW4nLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gU2VjcmV0cyBNYW5hZ2Vy5qip6ZmQXG4gICAgcm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdzZWNyZXRzbWFuYWdlcjpHZXRTZWNyZXRWYWx1ZScsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSwgLy8gQWN0aXZlIERpcmVjdG9yeSDjg5Hjgrnjg6/jg7zjg4njgrfjg7zjgq/jg6zjg4Pjg4hcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcm9sZTtcbiAgfVxuXG4gIC8qKlxuICAgKiDotbfli5Xjg4bjg7Pjg5fjg6zjg7zjg4jkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlTGF1bmNoVGVtcGxhdGUocHJvcHM6IEJhdGNoQ29uc3RydWN0UHJvcHMpOiBlYzIuTGF1bmNoVGVtcGxhdGUge1xuICAgIC8vIEZTeOODnuOCpuODs+ODiOeUqOOBrlVzZXJEYXRh44K544Kv44Oq44OX44OIXG4gICAgY29uc3QgdXNlckRhdGEgPSBlYzIuVXNlckRhdGEuZm9yTGludXgoKTtcbiAgICB1c2VyRGF0YS5hZGRDb21tYW5kcyhcbiAgICAgICcjIS9iaW4vYmFzaCcsXG4gICAgICAneXVtIHVwZGF0ZSAteScsXG4gICAgICAneXVtIGluc3RhbGwgLXkgYW1hem9uLWVmcy11dGlscyBjaWZzLXV0aWxzJyxcbiAgICAgICcnLFxuICAgICAgJyMgRlN4IGZvciBOZXRBcHAgT05UQVDjg57jgqbjg7Pjg4joqK3lrponLFxuICAgICAgYEZTWF9GSUxFX1NZU1RFTV9JRD1cIiR7cHJvcHMuY29uZmlnLmpvYkRlZmluaXRpb24uZnN4TW91bnQuZmlsZVN5c3RlbUlkfVwiYCxcbiAgICAgIGBNT1VOVF9QT0lOVD1cIiR7cHJvcHMuY29uZmlnLmpvYkRlZmluaXRpb24uZnN4TW91bnQubW91bnRQb2ludH1cImAsXG4gICAgICAnRlNYX0ROU19OQU1FPVwiJHtGU1hfRklMRV9TWVNURU1fSUR9LmZzeC4ke0FXU19ERUZBVUxUX1JFR0lPTn0uYW1hem9uYXdzLmNvbVwiJyxcbiAgICAgICcnLFxuICAgICAgJ21rZGlyIC1wICR7TU9VTlRfUE9JTlR9JyxcbiAgICAgICcnLFxuICAgICAgJyMgU01CL0NJRlPjg57jgqbjg7Pjg4jvvIjoqq3jgb/lj5bjgorlsILnlKjvvIknLFxuICAgICAgJ2lmIFsgXCIke3Byb3BzLmNvbmZpZy5qb2JEZWZpbml0aW9uLmZzeE1vdW50LnJlYWRPbmx5fVwiID0gXCJ0cnVlXCIgXTsgdGhlbicsXG4gICAgICAnICBtb3VudCAtdCBjaWZzIC8vJHtGU1hfRE5TX05BTUV9L3NoYXJlICR7TU9VTlRfUE9JTlR9IC1vIHJvLGd1ZXN0LHVpZD0xMDAwLGdpZD0xMDAwLGlvY2hhcnNldD11dGY4JyxcbiAgICAgICdlbHNlJyxcbiAgICAgICcgIG1vdW50IC10IGNpZnMgLy8ke0ZTWF9ETlNfTkFNRX0vc2hhcmUgJHtNT1VOVF9QT0lOVH0gLW8gZ3Vlc3QsdWlkPTEwMDAsZ2lkPTEwMDAsaW9jaGFyc2V0PXV0ZjgnLFxuICAgICAgJ2ZpJyxcbiAgICAgICcnLFxuICAgICAgJyMg44Oe44Km44Oz44OI56K66KqNJyxcbiAgICAgICdpZiBtb3VudHBvaW50IC1xICR7TU9VTlRfUE9JTlR9OyB0aGVuJyxcbiAgICAgICcgIGVjaG8gXCJGU3ggbW91bnQgc3VjY2Vzc2Z1bDogJHtNT1VOVF9QT0lOVH1cIicsXG4gICAgICAnZWxzZScsXG4gICAgICAnICBlY2hvIFwiRlN4IG1vdW50IGZhaWxlZDogJHtNT1VOVF9QT0lOVH1cIicsXG4gICAgICAnICBleGl0IDEnLFxuICAgICAgJ2ZpJyxcbiAgICAgICcnLFxuICAgICAgJyMgRUNTIEFnZW5044Gu6Kit5a6aJyxcbiAgICAgICdlY2hvIEVDU19DTFVTVEVSPSR7cHJvcHMuY29uZmlnLmNvbXB1dGVFbnZpcm9ubWVudC5uYW1lUHJlZml4fS1jbHVzdGVyID4+IC9ldGMvZWNzL2Vjcy5jb25maWcnLFxuICAgICAgJ2VjaG8gRUNTX0VOQUJMRV9MT0dHSU5HPXRydWUgPj4gL2V0Yy9lY3MvZWNzLmNvbmZpZycsXG4gICAgICBgZWNobyBFQ1NfTE9HX0xFVkVMPWluZm8gPj4gL2V0Yy9lY3MvZWNzLmNvbmZpZ2AsXG4gICAgICAnJyxcbiAgICAgICcjIENsb3VkV2F0Y2ggQWdlbnTjgqTjg7Pjgrnjg4jjg7zjg6vjg7voqK3lrponLFxuICAgICAgJ3dnZXQgaHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2FtYXpvbmNsb3Vkd2F0Y2gtYWdlbnQvYW1hem9uX2xpbnV4L2FtZDY0L2xhdGVzdC9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5ycG0nLFxuICAgICAgJ3JwbSAtVSAuL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50LnJwbScsXG4gICAgICAnJyxcbiAgICAgICcjIEVDUyBBZ2VudOOBrui1t+WLlScsXG4gICAgICAnc3RhcnQgZWNzJyxcbiAgICApO1xuXG4gICAgcmV0dXJuIG5ldyBlYzIuTGF1bmNoVGVtcGxhdGUodGhpcywgJ0JhdGNoTGF1bmNoVGVtcGxhdGUnLCB7XG4gICAgICBsYXVuY2hUZW1wbGF0ZU5hbWU6IGAke3Byb3BzLmNvbmZpZy5jb21wdXRlRW52aXJvbm1lbnQubmFtZVByZWZpeH0tbHRgLFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLk01LCBlYzIuSW5zdGFuY2VTaXplLkxBUkdFKSxcbiAgICAgIG1hY2hpbmVJbWFnZTogZWNzLkVjc09wdGltaXplZEltYWdlLmFtYXpvbkxpbnV4MigpLFxuICAgICAgdXNlckRhdGEsXG4gICAgICByb2xlOiB0aGlzLmluc3RhbmNlUm9sZSxcbiAgICAgIHNlY3VyaXR5R3JvdXA6IHRoaXMuY29tbW9uUmVzb3VyY2VzLnNlY3VyaXR5R3JvdXBzLmNvbW1vblNlY3VyaXR5R3JvdXAsXG4gICAgICBibG9ja0RldmljZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGRldmljZU5hbWU6ICcvZGV2L3h2ZGEnLFxuICAgICAgICAgIHZvbHVtZTogZWMyLkJsb2NrRGV2aWNlVm9sdW1lLmVicygzMCwge1xuICAgICAgICAgICAgdm9sdW1lVHlwZTogZWMyLkVic0RldmljZVZvbHVtZVR5cGUuR1AzLFxuICAgICAgICAgICAgZW5jcnlwdGVkOiB0cnVlLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXRjaOOCs+ODs+ODlOODpeODvOODiOeSsOWig+S9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVDb21wdXRlRW52aXJvbm1lbnQocHJvcHM6IEJhdGNoQ29uc3RydWN0UHJvcHMpOiBiYXRjaC5DZm5Db21wdXRlRW52aXJvbm1lbnQge1xuICAgIGNvbnN0IGNvbXB1dGVFbnZpcm9ubWVudCA9IG5ldyBiYXRjaC5DZm5Db21wdXRlRW52aXJvbm1lbnQodGhpcywgJ0JhdGNoQ29tcHV0ZUVudmlyb25tZW50Jywge1xuICAgICAgY29tcHV0ZUVudmlyb25tZW50TmFtZTogYCR7cHJvcHMuY29uZmlnLmNvbXB1dGVFbnZpcm9ubWVudC5uYW1lUHJlZml4fS1lbnZgLFxuICAgICAgdHlwZTogcHJvcHMuY29uZmlnLmNvbXB1dGVFbnZpcm9ubWVudC50eXBlLFxuICAgICAgc3RhdGU6ICdFTkFCTEVEJyxcbiAgICAgIHNlcnZpY2VSb2xlOiB0aGlzLnNlcnZpY2VSb2xlLnJvbGVBcm4sXG4gICAgICBjb21wdXRlUmVzb3VyY2VzOiB7XG4gICAgICAgIHR5cGU6IHByb3BzLmNvbmZpZy5jb21wdXRlRW52aXJvbm1lbnQudXNlU3BvdEluc3RhbmNlcyA/ICdFQzInIDogJ0VDMicsXG4gICAgICAgIG1pbnZDcHVzOiBwcm9wcy5jb25maWcuY29tcHV0ZUVudmlyb25tZW50Lm1pbnZDcHVzLFxuICAgICAgICBtYXh2Q3B1czogcHJvcHMuY29uZmlnLmNvbXB1dGVFbnZpcm9ubWVudC5tYXh2Q3B1cyxcbiAgICAgICAgZGVzaXJlZHZDcHVzOiBwcm9wcy5jb25maWcuY29tcHV0ZUVudmlyb25tZW50LmRlc2lyZWR2Q3B1cyB8fCAwLFxuICAgICAgICBpbnN0YW5jZVR5cGVzOiBwcm9wcy5jb25maWcuY29tcHV0ZUVudmlyb25tZW50Lmluc3RhbmNlVHlwZXMsXG4gICAgICAgIFxuICAgICAgICAvLyBNdWx0aS1BWumFjee9ruOBruOBn+OCgeOBruOCteODluODjeODg+ODiOioreWumlxuICAgICAgICBzdWJuZXRzOiB0aGlzLmNvbW1vblJlc291cmNlcy52cGMucHJpdmF0ZVN1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuc3VibmV0SWQpLFxuICAgICAgICBcbiAgICAgICAgLy8g44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OX6Kit5a6aXG4gICAgICAgIHNlY3VyaXR5R3JvdXBJZHM6IFt0aGlzLmNvbW1vblJlc291cmNlcy5zZWN1cml0eUdyb3Vwcy5jb21tb25TZWN1cml0eUdyb3VwLnNlY3VyaXR5R3JvdXBJZF0sXG4gICAgICAgIFxuICAgICAgICAvLyDjgqTjg7Pjgrnjgr/jg7Pjgrnjg63jg7zjg6voqK3lrppcbiAgICAgICAgaW5zdGFuY2VSb2xlOiBgYXJuOmF3czppYW06OiR7Y2RrLlN0YWNrLm9mKHRoaXMpLmFjY291bnR9Omluc3RhbmNlLXByb2ZpbGUvJHt0aGlzLmluc3RhbmNlUm9sZS5yb2xlTmFtZX1gLFxuICAgICAgICBcbiAgICAgICAgLy8g6LW35YuV44OG44Oz44OX44Os44O844OI6Kit5a6aXG4gICAgICAgIGxhdW5jaFRlbXBsYXRlOiB7XG4gICAgICAgICAgbGF1bmNoVGVtcGxhdGVJZDogdGhpcy5sYXVuY2hUZW1wbGF0ZS5sYXVuY2hUZW1wbGF0ZUlkLFxuICAgICAgICAgIHZlcnNpb246ICckTGF0ZXN0JyxcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIC8vIOOCueODneODg+ODiOOCpOODs+OCueOCv+ODs+OCueioreWumlxuICAgICAgICAuLi4ocHJvcHMuY29uZmlnLmNvbXB1dGVFbnZpcm9ubWVudC51c2VTcG90SW5zdGFuY2VzICYmIHtcbiAgICAgICAgICBzcG90SWFtRmxlZXRSZXF1ZXN0Um9sZTogYGFybjphd3M6aWFtOjoke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50fTpyb2xlL2F3cy1lYzItc3BvdC1mbGVldC10YWdnaW5nLXJvbGVgLFxuICAgICAgICAgIGJpZFBlcmNlbnRhZ2U6IHByb3BzLmNvbmZpZy5jb21wdXRlRW52aXJvbm1lbnQuc3BvdEJpZFBlcmNlbnRhZ2UsXG4gICAgICAgIH0pLFxuICAgICAgICBcbiAgICAgICAgLy8g44K/44Kw6Kit5a6aXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgJHtwcm9wcy5jb25maWcuY29tcHV0ZUVudmlyb25tZW50Lm5hbWVQcmVmaXh9LWluc3RhbmNlYCxcbiAgICAgICAgICBQcm9qZWN0OiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgICAgICBFbnZpcm9ubWVudDogcHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICAgICAgQ29tcG9uZW50OiAnRW1iZWRkaW5nJyxcbiAgICAgICAgICBNb2R1bGU6ICdBV1NfQkFUQ0gnLFxuICAgICAgICAgIE1hbmFnZWRCeTogJ0NESycsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8g44Kk44Oz44K544K/44Oz44K544OX44Ot44OV44Kh44Kk44Or5L2c5oiQXG4gICAgbmV3IGlhbS5DZm5JbnN0YW5jZVByb2ZpbGUodGhpcywgJ0JhdGNoSW5zdGFuY2VQcm9maWxlJywge1xuICAgICAgaW5zdGFuY2VQcm9maWxlTmFtZTogdGhpcy5pbnN0YW5jZVJvbGUucm9sZU5hbWUsXG4gICAgICByb2xlczogW3RoaXMuaW5zdGFuY2VSb2xlLnJvbGVOYW1lXSxcbiAgICB9KTtcblxuICAgIHJldHVybiBjb21wdXRlRW52aXJvbm1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQmF0Y2jjgrjjg6fjg5blrprnvqnkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlSm9iRGVmaW5pdGlvbihwcm9wczogQmF0Y2hDb25zdHJ1Y3RQcm9wcyk6IGJhdGNoLkNmbkpvYkRlZmluaXRpb24ge1xuICAgIC8vIOeSsOWig+WkieaVsOioreWumlxuICAgIGNvbnN0IGVudmlyb25tZW50ID0gdGhpcy5jcmVhdGVKb2JFbnZpcm9ubWVudFZhcmlhYmxlcyhwcm9wcyk7XG5cbiAgICByZXR1cm4gbmV3IGJhdGNoLkNmbkpvYkRlZmluaXRpb24odGhpcywgJ0JhdGNoSm9iRGVmaW5pdGlvbicsIHtcbiAgICAgIGpvYkRlZmluaXRpb25OYW1lOiBwcm9wcy5qb2JEZWZpbml0aW9uQ29uZmlnLmpvYkRlZmluaXRpb25OYW1lLFxuICAgICAgdHlwZTogJ2NvbnRhaW5lcicsXG4gICAgICBwbGF0Zm9ybUNhcGFiaWxpdGllczogcHJvcHMuam9iRGVmaW5pdGlvbkNvbmZpZy5wbGF0Zm9ybUNhcGFiaWxpdGllcyxcbiAgICAgIGNvbnRhaW5lclByb3BlcnRpZXM6IHtcbiAgICAgICAgaW1hZ2U6IGAke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50fS5ka3IuZWNyLiR7Y2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbn0uYW1hem9uYXdzLmNvbS8ke3Byb3BzLmltYWdlUGF0aH0vZW1iZWQ6JHtwcm9wcy5pbWFnZVRhZ31gLFxuICAgICAgICB2Y3B1czogcHJvcHMuam9iRGVmaW5pdGlvbkNvbmZpZy5jcHUsXG4gICAgICAgIG1lbW9yeTogcHJvcHMuam9iRGVmaW5pdGlvbkNvbmZpZy5tZW1vcnlNaUIsXG4gICAgICAgIGpvYlJvbGVBcm46IHRoaXMuam9iUm9sZS5yb2xlQXJuLFxuICAgICAgICBcbiAgICAgICAgLy8g55Kw5aKD5aSJ5pWw6Kit5a6aXG4gICAgICAgIGVudmlyb25tZW50OiBPYmplY3QuZW50cmllcyhlbnZpcm9ubWVudCkubWFwKChbbmFtZSwgdmFsdWVdKSA9PiAoe1xuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgIH0pKSxcbiAgICAgICAgXG4gICAgICAgIC8vIEZTeOODnuOCpuODs+ODiOODneOCpOODs+ODiOioreWumlxuICAgICAgICBtb3VudFBvaW50czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNvdXJjZVZvbHVtZTogJ2ZzeC1kYXRhLXZvbHVtZScsXG4gICAgICAgICAgICBjb250YWluZXJQYXRoOiAnL29wdC9uZXRhcHAvYWkvZGF0YScsXG4gICAgICAgICAgICByZWFkT25seTogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzb3VyY2VWb2x1bWU6ICdmc3gtZGItdm9sdW1lJyxcbiAgICAgICAgICAgIGNvbnRhaW5lclBhdGg6ICcvb3B0L25ldGFwcC9haS9kYicsXG4gICAgICAgICAgICByZWFkT25seTogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgXG4gICAgICAgIC8vIOODnOODquODpeODvOODoOioreWumlxuICAgICAgICB2b2x1bWVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2ZzeC1kYXRhLXZvbHVtZScsXG4gICAgICAgICAgICBob3N0OiB7XG4gICAgICAgICAgICAgIHNvdXJjZVBhdGg6ICcvbW50L2ZzeC9kYXRhJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnZnN4LWRiLXZvbHVtZScsXG4gICAgICAgICAgICBob3N0OiB7XG4gICAgICAgICAgICAgIHNvdXJjZVBhdGg6ICcvbW50L2ZzeC9kYicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIFxuICAgICAgICAvLyDjg63jgrDoqK3lrppcbiAgICAgICAgbG9nQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIGxvZ0RyaXZlcjogJ2F3c2xvZ3MnLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICdhd3Nsb2dzLWdyb3VwJzogdGhpcy5sb2dHcm91cC5sb2dHcm91cE5hbWUsXG4gICAgICAgICAgICAnYXdzbG9ncy1yZWdpb24nOiBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uLFxuICAgICAgICAgICAgJ2F3c2xvZ3Mtc3RyZWFtLXByZWZpeCc6ICdlbWJlZGRpbmctam9iJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgLy8g44Oq44K944O844K56KaB5Lu2XG4gICAgICAgIHJlc291cmNlUmVxdWlyZW1lbnRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ1ZDUFUnLFxuICAgICAgICAgICAgdmFsdWU6IHByb3BzLmpvYkRlZmluaXRpb25Db25maWcuY3B1LnRvU3RyaW5nKCksXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnTUVNT1JZJyxcbiAgICAgICAgICAgIHZhbHVlOiBwcm9wcy5qb2JEZWZpbml0aW9uQ29uZmlnLm1lbW9yeU1pQi50b1N0cmluZygpLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIFxuICAgICAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrppcbiAgICAgICAgcmVhZG9ubHlSb290RmlsZXN5c3RlbTogZmFsc2UsIC8vIEZTeOODnuOCpuODs+ODiOOBruOBn+OCgeiqreOBv+abuOOBjeWPr+iDvVxuICAgICAgICBwcml2aWxlZ2VkOiBmYWxzZSxcbiAgICAgICAgdXNlcjogJ3Jvb3QnLCAvLyBGU3jjg57jgqbjg7Pjg4jjga7jgZ/jgoFcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIOOCv+OCpOODoOOCouOCpuODiOioreWumlxuICAgICAgdGltZW91dDoge1xuICAgICAgICBhdHRlbXB0RHVyYXRpb25TZWNvbmRzOiBwcm9wcy5qb2JEZWZpbml0aW9uQ29uZmlnLnRpbWVvdXRIb3VycyAqIDM2MDAsXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyDlho3oqabooYzmiKbnlaVcbiAgICAgIHJldHJ5U3RyYXRlZ3k6IHtcbiAgICAgICAgYXR0ZW1wdHM6IHByb3BzLmpvYkRlZmluaXRpb25Db25maWcucmV0cnlBdHRlbXB0cyxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSm9i55Kw5aKD5aSJ5pWw5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUpvYkVudmlyb25tZW50VmFyaWFibGVzKHByb3BzOiBCYXRjaENvbnN0cnVjdFByb3BzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gICAgY29uc3QgYmFzZUVudmlyb25tZW50OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgRU5WX1JFR0lPTjogY2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbixcbiAgICAgIEFXU19ERUZBVUxUX1JFR0lPTjogY2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbixcbiAgICAgIC8vIEZTeOioreWumlxuICAgICAgRlNYX0lEOiBwcm9wcy5mc3hJbnRlZ3JhdGlvbkNvbmZpZy5maWxlU3lzdGVtSWQgfHwgXCJmcy1kZWZhdWx0XCIsXG4gICAgICBTVk1fUkVGOiBwcm9wcy5mc3hJbnRlZ3JhdGlvbkNvbmZpZy5zdm1SZWYgfHwgXCJzdm0tZGVmYXVsdFwiLFxuICAgICAgU1ZNX0lEOiBwcm9wcy5mc3hJbnRlZ3JhdGlvbkNvbmZpZy5zdm1JZCB8fCBcInN2bS1kZWZhdWx0LWlkXCIsXG4gICAgICBDSUZTREFUQV9WT0xfTkFNRTogcHJvcHMuZnN4SW50ZWdyYXRpb25Db25maWcuY2lmc2RhdGFWb2xOYW1lIHx8IFwic21iX3NoYXJlXCIsXG4gICAgICBSQUdEQl9WT0xfUEFUSDogcHJvcHMuZnN4SW50ZWdyYXRpb25Db25maWcucmFnZGJWb2xQYXRoIHx8IFwiL3NtYl9zaGFyZS9yYWdkYlwiLFxuICAgICAgLy8gQWN0aXZlIERpcmVjdG9yeeioreWumlxuICAgICAgQURfRE9NQUlOOiBwcm9wcy5hY3RpdmVEaXJlY3RvcnlDb25maWcuZG9tYWluLFxuICAgICAgQURfVVNFUk5BTUU6IHByb3BzLmFjdGl2ZURpcmVjdG9yeUNvbmZpZy51c2VybmFtZSxcbiAgICAgIC8vIEJlZHJvY2voqK3lrppcbiAgICAgIEJFRFJPQ0tfUkVHSU9OOiBwcm9wcy5iZWRyb2NrQ29uZmlnLnJlZ2lvbiB8fCBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uLFxuICAgICAgQkVEUk9DS19NT0RFTF9JRDogcHJvcHMuYmVkcm9ja0NvbmZpZy5tb2RlbElkLFxuICAgIH07XG5cbiAgICAvLyBPcGVuU2VhcmNoIFNlcnZlcmxlc3PoqK3lrppcbiAgICBpZiAocHJvcHMub3BlblNlYXJjaENvbmZpZy5jb2xsZWN0aW9uTmFtZSkge1xuICAgICAgYmFzZUVudmlyb25tZW50LkVOVl9PUEVOX1NFQVJDSF9TRVJWRVJMRVNTX0NPTExFQ1RJT05fTkFNRSA9IFxuICAgICAgICBwcm9wcy5vcGVuU2VhcmNoQ29uZmlnLmNvbGxlY3Rpb25OYW1lO1xuICAgIH1cblxuICAgIC8vIFJEU+ioreWumu+8iE9wZW5TZWFyY2jjga7ku6Pmm7/vvIlcbiAgICBpZiAocHJvcHMucmRzQ29uZmlnPy5zZWNyZXROYW1lKSB7XG4gICAgICBiYXNlRW52aXJvbm1lbnQuRU5WX1JEU19TRUNSRVRTX05BTUUgPSBwcm9wcy5yZHNDb25maWcuc2VjcmV0TmFtZTtcbiAgICAgIGJhc2VFbnZpcm9ubWVudC5FTlZfU0VDUkVUU19BUk4gPSBwcm9wcy5yZHNDb25maWcuc2VjcmV0QXJuO1xuICAgICAgYmFzZUVudmlyb25tZW50LkVOVl9SRFNfQVJOID0gcHJvcHMucmRzQ29uZmlnLmNsdXN0ZXJBcm47XG4gICAgfVxuXG4gICAgcmV0dXJuIGJhc2VFbnZpcm9ubWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXRjaOOCuOODp+ODluOCreODpeODvOS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVKb2JRdWV1ZShwcm9wczogQmF0Y2hDb25zdHJ1Y3RQcm9wcyk6IGJhdGNoLkNmbkpvYlF1ZXVlIHtcbiAgICBjb25zdCBqb2JRdWV1ZSA9IG5ldyBiYXRjaC5DZm5Kb2JRdWV1ZSh0aGlzLCAnQmF0Y2hKb2JRdWV1ZScsIHtcbiAgICAgIGpvYlF1ZXVlTmFtZTogYCR7cHJvcHMuY29uZmlnLmpvYlF1ZXVlLm5hbWVQcmVmaXh9LXF1ZXVlYCxcbiAgICAgIHN0YXRlOiBwcm9wcy5jb25maWcuam9iUXVldWUuc3RhdGUsXG4gICAgICBwcmlvcml0eTogcHJvcHMuY29uZmlnLmpvYlF1ZXVlLnByaW9yaXR5LFxuICAgICAgY29tcHV0ZUVudmlyb25tZW50T3JkZXI6IFtcbiAgICAgICAge1xuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbXB1dGVFbnZpcm9ubWVudDogdGhpcy5jb21wdXRlRW52aXJvbm1lbnQucmVmLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgTmFtZTogYCR7cHJvcHMuY29uZmlnLmpvYlF1ZXVlLm5hbWVQcmVmaXh9LXF1ZXVlYCxcbiAgICAgICAgUHJvamVjdDogcHJvcHMucHJvamVjdE5hbWUsXG4gICAgICAgIEVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgICAgQ29tcG9uZW50OiAnRW1iZWRkaW5nJyxcbiAgICAgICAgTW9kdWxlOiAnQVdTX0JBVENIJyxcbiAgICAgICAgTWFuYWdlZEJ5OiAnQ0RLJyxcbiAgICAgICAgQXV0b1NjYWxpbmc6IHByb3BzLmNvbmZpZy5hdXRvU2NhbGluZy5lbmFibGVkLnRvU3RyaW5nKCksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8g6Ieq5YuV44K544Kx44O844Oq44Oz44Kw6Kit5a6aXG4gICAgaWYgKHByb3BzLmNvbmZpZy5hdXRvU2NhbGluZy5lbmFibGVkKSB7XG4gICAgICB0aGlzLmNvbmZpZ3VyZUpvYlF1ZXVlQXV0b1NjYWxpbmcocHJvcHMsIGpvYlF1ZXVlKTtcbiAgICB9XG5cbiAgICAvLyDoh6rli5Xlvqnml6fmqZ/og73oqK3lrppcbiAgICB0aGlzLmNvbmZpZ3VyZUpvYlF1ZXVlQXV0b1JlY292ZXJ5KHByb3BzLCBqb2JRdWV1ZSk7XG5cbiAgICByZXR1cm4gam9iUXVldWU7XG4gIH1cblxuICAvKipcbiAgICogSm9iIFF1ZXVl6Ieq5YuV44K544Kx44O844Oq44Oz44Kw6Kit5a6aXG4gICAqL1xuICBwcml2YXRlIGNvbmZpZ3VyZUpvYlF1ZXVlQXV0b1NjYWxpbmcocHJvcHM6IEJhdGNoQ29uc3RydWN0UHJvcHMsIGpvYlF1ZXVlOiBiYXRjaC5DZm5Kb2JRdWV1ZSk6IHZvaWQge1xuICAgIC8vIENsb3VkV2F0Y2jjg6Hjg4jjg6rjgq/jgrnkvZzmiJBcbiAgICBjb25zdCBxdWV1ZVNpemVNZXRyaWMgPSBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICBuYW1lc3BhY2U6ICdBV1MvQmF0Y2gnLFxuICAgICAgbWV0cmljTmFtZTogJ1N1Ym1pdHRlZEpvYnMnLFxuICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICBKb2JRdWV1ZTogam9iUXVldWUuam9iUXVldWVOYW1lISxcbiAgICAgIH0sXG4gICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJ1bm5pbmdKb2JzTWV0cmljID0gbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgbmFtZXNwYWNlOiAnQVdTL0JhdGNoJyxcbiAgICAgIG1ldHJpY05hbWU6ICdSdW5uYWJsZUpvYnMnLFxuICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICBKb2JRdWV1ZTogam9iUXVldWUuam9iUXVldWVOYW1lISxcbiAgICAgIH0sXG4gICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICB9KTtcblxuICAgIC8vIOOCueOCseODvOODq+OCouOCpuODiOOCouODqeODvOODoFxuICAgIGNvbnN0IHNjYWxlT3V0QWxhcm0gPSBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdCYXRjaFNjYWxlT3V0QWxhcm0nLCB7XG4gICAgICBhbGFybU5hbWU6IGAke3Byb3BzLmNvbmZpZy5qb2JRdWV1ZS5uYW1lUHJlZml4fS1zY2FsZS1vdXRgLFxuICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0JhdGNoIEpvYiBRdWV1ZSBzY2FsZSBvdXQgYWxhcm0nLFxuICAgICAgbWV0cmljOiBxdWV1ZVNpemVNZXRyaWMsXG4gICAgICB0aHJlc2hvbGQ6IDUsIC8vIOOCreODpeODvOOBqzXjgaTku6XkuIrjga7jgrjjg6fjg5bjgYzjgYLjgovloLTlkIhcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgZGF0YXBvaW50c1RvQWxhcm06IDIsXG4gICAgICBjb21wYXJpc29uT3BlcmF0b3I6IGNkay5hd3NfY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX1RIUkVTSE9MRCxcbiAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNkay5hd3NfY2xvdWR3YXRjaC5UcmVhdE1pc3NpbmdEYXRhLk5PVF9CUkVBQ0hJTkcsXG4gICAgfSk7XG5cbiAgICAvLyDjgrnjgrHjg7zjg6vjgqTjg7PjgqLjg6njg7zjg6BcbiAgICBjb25zdCBzY2FsZUluQWxhcm0gPSBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdCYXRjaFNjYWxlSW5BbGFybScsIHtcbiAgICAgIGFsYXJtTmFtZTogYCR7cHJvcHMuY29uZmlnLmpvYlF1ZXVlLm5hbWVQcmVmaXh9LXNjYWxlLWluYCxcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdCYXRjaCBKb2IgUXVldWUgc2NhbGUgaW4gYWxhcm0nLFxuICAgICAgbWV0cmljOiBydW5uaW5nSm9ic01ldHJpYyxcbiAgICAgIHRocmVzaG9sZDogMSwgLy8g5a6f6KGM5Lit44Gu44K444On44OW44GMMeOBpOS7peS4i+OBruWgtOWQiFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDMsXG4gICAgICBkYXRhcG9pbnRzVG9BbGFybTogMyxcbiAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogY2RrLmF3c19jbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5MRVNTX1RIQU5fVEhSRVNIT0xELFxuICAgICAgdHJlYXRNaXNzaW5nRGF0YTogY2RrLmF3c19jbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuQlJFQUNISU5HLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRh6Zai5pWw44Gn44K544Kx44O844Oq44Oz44Kw5Yem55CGXG4gICAgY29uc3Qgc2NhbGluZ0Z1bmN0aW9uID0gbmV3IGNkay5hd3NfbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdCYXRjaFNjYWxpbmdGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJvcHMuY29uZmlnLmpvYlF1ZXVlLm5hbWVQcmVmaXh9LXNjYWxpbmdgLFxuICAgICAgcnVudGltZTogY2RrLmF3c19sYW1iZGEuUnVudGltZS5QWVRIT05fM18xMSxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGNkay5hd3NfbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXG5pbXBvcnQgYm90bzNcbmltcG9ydCBqc29uXG5pbXBvcnQgb3NcblxuZGVmIGhhbmRsZXIoZXZlbnQsIGNvbnRleHQpOlxuICAgIGJhdGNoX2NsaWVudCA9IGJvdG8zLmNsaWVudCgnYmF0Y2gnKVxuICAgIGNvbXB1dGVfZW52X25hbWUgPSBvcy5lbnZpcm9uWydDT01QVVRFX0VOVklST05NRU5UX05BTUUnXVxuICAgIFxuICAgICMgQ2xvdWRXYXRjaOOCouODqeODvOODoOOBi+OCieOBrumAmuefpeOCkuWHpueQhlxuICAgIG1lc3NhZ2UgPSBqc29uLmxvYWRzKGV2ZW50WydSZWNvcmRzJ11bMF1bJ1NucyddWydNZXNzYWdlJ10pXG4gICAgYWxhcm1fbmFtZSA9IG1lc3NhZ2VbJ0FsYXJtTmFtZSddXG4gICAgbmV3X3N0YXRlID0gbWVzc2FnZVsnTmV3U3RhdGVWYWx1ZSddXG4gICAgXG4gICAgaWYgJ3NjYWxlLW91dCcgaW4gYWxhcm1fbmFtZSBhbmQgbmV3X3N0YXRlID09ICdBTEFSTSc6XG4gICAgICAgICMg44K544Kx44O844Or44Ki44Km44OI5Yem55CGXG4gICAgICAgIHJlc3BvbnNlID0gYmF0Y2hfY2xpZW50LnVwZGF0ZV9jb21wdXRlX2Vudmlyb25tZW50KFxuICAgICAgICAgICAgY29tcHV0ZUVudmlyb25tZW50PWNvbXB1dGVfZW52X25hbWUsXG4gICAgICAgICAgICBjb21wdXRlUmVzb3VyY2VzPXtcbiAgICAgICAgICAgICAgICAnZGVzaXJlZHZDcHVzJzogbWluKFxuICAgICAgICAgICAgICAgICAgICBpbnQob3MuZW52aXJvbi5nZXQoJ01BWF9WQ1BVUycsICcxMDAwJykpLFxuICAgICAgICAgICAgICAgICAgICBpbnQob3MuZW52aXJvbi5nZXQoJ0NVUlJFTlRfVkNQVVMnLCAnMCcpKSArIDEwMFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgICBwcmludChmXCJTY2FsZWQgb3V0OiB7cmVzcG9uc2V9XCIpXG4gICAgICAgIFxuICAgIGVsaWYgJ3NjYWxlLWluJyBpbiBhbGFybV9uYW1lIGFuZCBuZXdfc3RhdGUgPT0gJ0FMQVJNJzpcbiAgICAgICAgIyDjgrnjgrHjg7zjg6vjgqTjg7Plh6bnkIZcbiAgICAgICAgcmVzcG9uc2UgPSBiYXRjaF9jbGllbnQudXBkYXRlX2NvbXB1dGVfZW52aXJvbm1lbnQoXG4gICAgICAgICAgICBjb21wdXRlRW52aXJvbm1lbnQ9Y29tcHV0ZV9lbnZfbmFtZSxcbiAgICAgICAgICAgIGNvbXB1dGVSZXNvdXJjZXM9e1xuICAgICAgICAgICAgICAgICdkZXNpcmVkdkNwdXMnOiBtYXgoXG4gICAgICAgICAgICAgICAgICAgIGludChvcy5lbnZpcm9uLmdldCgnTUlOX1ZDUFVTJywgJzAnKSksXG4gICAgICAgICAgICAgICAgICAgIGludChvcy5lbnZpcm9uLmdldCgnQ1VSUkVOVF9WQ1BVUycsICcwJykpIC0gNTBcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgcHJpbnQoZlwiU2NhbGVkIGluOiB7cmVzcG9uc2V9XCIpXG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgJ3N0YXR1c0NvZGUnOiAyMDAsXG4gICAgICAgICdib2R5JzoganNvbi5kdW1wcygnU2NhbGluZyBjb21wbGV0ZWQnKVxuICAgIH1cbiAgICAgIGApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQ09NUFVURV9FTlZJUk9OTUVOVF9OQU1FOiB0aGlzLmNvbXB1dGVFbnZpcm9ubWVudC5jb21wdXRlRW52aXJvbm1lbnROYW1lISxcbiAgICAgICAgTUFYX1ZDUFVTOiBwcm9wcy5jb25maWcuY29tcHV0ZUVudmlyb25tZW50Lm1heHZDcHVzLnRvU3RyaW5nKCksXG4gICAgICAgIE1JTl9WQ1BVUzogcHJvcHMuY29uZmlnLmNvbXB1dGVFbnZpcm9ubWVudC5taW52Q3B1cy50b1N0cmluZygpLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRh5a6f6KGM5qip6ZmQXG4gICAgc2NhbGluZ0Z1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdiYXRjaDpVcGRhdGVDb21wdXRlRW52aXJvbm1lbnQnLFxuICAgICAgICAnYmF0Y2g6RGVzY3JpYmVDb21wdXRlRW52aXJvbm1lbnRzJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFt0aGlzLmNvbXB1dGVFbnZpcm9ubWVudC5hdHRyQ29tcHV0ZUVudmlyb25tZW50QXJuXSxcbiAgICB9KSk7XG5cbiAgICAvLyBTTlPjg4jjg5Tjg4Pjgq/kvZzmiJBcbiAgICBjb25zdCBzY2FsaW5nVG9waWMgPSBuZXcgY2RrLmF3c19zbnMuVG9waWModGhpcywgJ0JhdGNoU2NhbGluZ1RvcGljJywge1xuICAgICAgdG9waWNOYW1lOiBgJHtwcm9wcy5jb25maWcuam9iUXVldWUubmFtZVByZWZpeH0tc2NhbGluZy10b3BpY2AsXG4gICAgICBkaXNwbGF5TmFtZTogJ0JhdGNoIEF1dG8gU2NhbGluZyBOb3RpZmljYXRpb25zJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYemWouaVsOOCklNOU+ODiOODlOODg+OCr+OBq+OCteODluOCueOCr+ODqeOCpOODllxuICAgIHNjYWxpbmdUb3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IGNkay5hd3Nfc25zX3N1YnNjcmlwdGlvbnMuTGFtYmRhU3Vic2NyaXB0aW9uKHNjYWxpbmdGdW5jdGlvbikpO1xuXG4gICAgLy8g44Ki44Op44O844Og44KSU05T44OI44OU44OD44Kv44Gr5o6l57aaXG4gICAgc2NhbGVPdXRBbGFybS5hZGRBbGFybUFjdGlvbihuZXcgY2RrLmF3c19jbG91ZHdhdGNoX2FjdGlvbnMuU25zQWN0aW9uKHNjYWxpbmdUb3BpYykpO1xuICAgIHNjYWxlSW5BbGFybS5hZGRBbGFybUFjdGlvbihuZXcgY2RrLmF3c19jbG91ZHdhdGNoX2FjdGlvbnMuU25zQWN0aW9uKHNjYWxpbmdUb3BpYykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEpvYiBRdWV1ZeiHquWLleW+qeaXp+apn+iDveioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBjb25maWd1cmVKb2JRdWV1ZUF1dG9SZWNvdmVyeShwcm9wczogQmF0Y2hDb25zdHJ1Y3RQcm9wcywgam9iUXVldWU6IGJhdGNoLkNmbkpvYlF1ZXVlKTogdm9pZCB7XG4gICAgLy8g5aSx5pWX44K444On44OW55uj6KaW44Oh44OI44Oq44Kv44K5XG4gICAgY29uc3QgZmFpbGVkSm9ic01ldHJpYyA9IG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgIG5hbWVzcGFjZTogJ0FXUy9CYXRjaCcsXG4gICAgICBtZXRyaWNOYW1lOiAnRmFpbGVkSm9icycsXG4gICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgIEpvYlF1ZXVlOiBqb2JRdWV1ZS5qb2JRdWV1ZU5hbWUhLFxuICAgICAgfSxcbiAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgIH0pO1xuXG4gICAgLy8g5aSx5pWX44K444On44OW44Ki44Op44O844OgXG4gICAgY29uc3QgZmFpbGVkSm9ic0FsYXJtID0gbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnQmF0Y2hGYWlsZWRKb2JzQWxhcm0nLCB7XG4gICAgICBhbGFybU5hbWU6IGAke3Byb3BzLmNvbmZpZy5qb2JRdWV1ZS5uYW1lUHJlZml4fS1mYWlsZWQtam9ic2AsXG4gICAgICBhbGFybURlc2NyaXB0aW9uOiAnQmF0Y2ggSm9iIGZhaWx1cmVzIGFsYXJtJyxcbiAgICAgIG1ldHJpYzogZmFpbGVkSm9ic01ldHJpYyxcbiAgICAgIHRocmVzaG9sZDogMywgLy8gNeWIhumWk+OBqzPjgaTku6XkuIrjga7jgrjjg6fjg5bjgYzlpLHmlZfjgZfjgZ/loLTlkIhcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgZGF0YXBvaW50c1RvQWxhcm06IDEsXG4gICAgICBjb21wYXJpc29uT3BlcmF0b3I6IGNkay5hd3NfY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX09SX0VRVUFMX1RPX1RIUkVTSE9MRCxcbiAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNkay5hd3NfY2xvdWR3YXRjaC5UcmVhdE1pc3NpbmdEYXRhLk5PVF9CUkVBQ0hJTkcsXG4gICAgfSk7XG5cbiAgICAvLyDoh6rli5Xlvqnml6dMYW1iZGHplqLmlbBcbiAgICBjb25zdCByZWNvdmVyeUZ1bmN0aW9uID0gbmV3IGNkay5hd3NfbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdCYXRjaFJlY292ZXJ5RnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGAke3Byb3BzLmNvbmZpZy5qb2JRdWV1ZS5uYW1lUHJlZml4fS1yZWNvdmVyeWAsXG4gICAgICBydW50aW1lOiBjZGsuYXdzX2xhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzExLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogY2RrLmF3c19sYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbmltcG9ydCBib3RvM1xuaW1wb3J0IGpzb25cbmltcG9ydCBvc1xuZnJvbSBkYXRldGltZSBpbXBvcnQgZGF0ZXRpbWUsIHRpbWVkZWx0YVxuXG5kZWYgaGFuZGxlcihldmVudCwgY29udGV4dCk6XG4gICAgYmF0Y2hfY2xpZW50ID0gYm90bzMuY2xpZW50KCdiYXRjaCcpXG4gICAgbG9nc19jbGllbnQgPSBib3RvMy5jbGllbnQoJ2xvZ3MnKVxuICAgIFxuICAgIGpvYl9xdWV1ZV9uYW1lID0gb3MuZW52aXJvblsnSk9CX1FVRVVFX05BTUUnXVxuICAgIGNvbXB1dGVfZW52X25hbWUgPSBvcy5lbnZpcm9uWydDT01QVVRFX0VOVklST05NRU5UX05BTUUnXVxuICAgIFxuICAgIHRyeTpcbiAgICAgICAgIyDlpLHmlZfjgZfjgZ/jgrjjg6fjg5bjgpLlj5blvpdcbiAgICAgICAgZmFpbGVkX2pvYnMgPSBiYXRjaF9jbGllbnQubGlzdF9qb2JzKFxuICAgICAgICAgICAgam9iUXVldWU9am9iX3F1ZXVlX25hbWUsXG4gICAgICAgICAgICBqb2JTdGF0dXM9J0ZBSUxFRCcsXG4gICAgICAgICAgICBtYXhSZXN1bHRzPTEwXG4gICAgICAgIClcbiAgICAgICAgXG4gICAgICAgIHJlY292ZXJ5X2FjdGlvbnMgPSBbXVxuICAgICAgICBcbiAgICAgICAgZm9yIGpvYiBpbiBmYWlsZWRfam9ic1snam9iTGlzdCddOlxuICAgICAgICAgICAgam9iX2lkID0gam9iWydqb2JJZCddXG4gICAgICAgICAgICBqb2JfbmFtZSA9IGpvYlsnam9iTmFtZSddXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICMg44K444On44OW44Gu6Kmz57Sw5oOF5aCx44KS5Y+W5b6XXG4gICAgICAgICAgICBqb2JfZGV0YWlsID0gYmF0Y2hfY2xpZW50LmRlc2NyaWJlX2pvYnMoam9icz1bam9iX2lkXSlcbiAgICAgICAgICAgIGpvYl9pbmZvID0gam9iX2RldGFpbFsnam9icyddWzBdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICMg5aSx5pWX55CG55Sx44KS5YiG5p6QXG4gICAgICAgICAgICBzdGF0dXNfcmVhc29uID0gam9iX2luZm8uZ2V0KCdzdGF0dXNSZWFzb24nLCAnJylcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgJ0hvc3QgRUMyJyBpbiBzdGF0dXNfcmVhc29uIG9yICdTcG90JyBpbiBzdGF0dXNfcmVhc29uOlxuICAgICAgICAgICAgICAgICMg44Kk44Oz44K544K/44Oz44K56Zai6YCj44Gu5ZWP6aGMIC0g44Kz44Oz44OU44Ol44O844OI55Kw5aKD44KS44Oq44OV44Os44OD44K344OlXG4gICAgICAgICAgICAgICAgcmVjb3ZlcnlfYWN0aW9ucy5hcHBlbmQoe1xuICAgICAgICAgICAgICAgICAgICAnYWN0aW9uJzogJ3JlZnJlc2hfY29tcHV0ZV9lbnZpcm9ubWVudCcsXG4gICAgICAgICAgICAgICAgICAgICdyZWFzb24nOiAnSW5zdGFuY2UgZmFpbHVyZSBkZXRlY3RlZCcsXG4gICAgICAgICAgICAgICAgICAgICdqb2JfaWQnOiBqb2JfaWRcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxpZiAnT3V0T2ZNZW1vcnknIGluIHN0YXR1c19yZWFzb24gb3IgJ09PTUtpbGxlZCcgaW4gc3RhdHVzX3JlYXNvbjpcbiAgICAgICAgICAgICAgICAjIOODoeODouODquS4jei2syAtIOOCiOOCiuWkp+OBjeOBquOCpOODs+OCueOCv+ODs+OCueOCv+OCpOODl+OCkuaOqOWlqFxuICAgICAgICAgICAgICAgIHJlY292ZXJ5X2FjdGlvbnMuYXBwZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgJ2FjdGlvbic6ICdyZWNvbW1lbmRfbGFyZ2VyX2luc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgJ3JlYXNvbic6ICdNZW1vcnkgZXhoYXVzdGlvbiBkZXRlY3RlZCcsXG4gICAgICAgICAgICAgICAgICAgICdqb2JfaWQnOiBqb2JfaWRcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxpZiAnVGFzayBmYWlsZWQnIGluIHN0YXR1c19yZWFzb246XG4gICAgICAgICAgICAgICAgIyDjgr/jgrnjgq/lpLHmlZcgLSDjgrjjg6fjg5bjgpLlho3lrp/ooYxcbiAgICAgICAgICAgICAgICByZWNvdmVyeV9hY3Rpb25zLmFwcGVuZCh7XG4gICAgICAgICAgICAgICAgICAgICdhY3Rpb24nOiAncmV0cnlfam9iJyxcbiAgICAgICAgICAgICAgICAgICAgJ3JlYXNvbic6ICdUYXNrIGZhaWx1cmUgZGV0ZWN0ZWQnLFxuICAgICAgICAgICAgICAgICAgICAnam9iX2lkJzogam9iX2lkLFxuICAgICAgICAgICAgICAgICAgICAnam9iX25hbWUnOiBqb2JfbmFtZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAjIOW+qeaXp+OCouOCr+OCt+ODp+ODs+OCkuWun+ihjFxuICAgICAgICBmb3IgYWN0aW9uIGluIHJlY292ZXJ5X2FjdGlvbnM6XG4gICAgICAgICAgICBpZiBhY3Rpb25bJ2FjdGlvbiddID09ICdyZWZyZXNoX2NvbXB1dGVfZW52aXJvbm1lbnQnOlxuICAgICAgICAgICAgICAgICMg44Kz44Oz44OU44Ol44O844OI55Kw5aKD44Gu5pu05paw77yI5by35Yi244Oq44OV44Os44OD44K344Ol77yJXG4gICAgICAgICAgICAgICAgYmF0Y2hfY2xpZW50LnVwZGF0ZV9jb21wdXRlX2Vudmlyb25tZW50KFxuICAgICAgICAgICAgICAgICAgICBjb21wdXRlRW52aXJvbm1lbnQ9Y29tcHV0ZV9lbnZfbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU9J0RJU0FCTEVEJ1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAjIOWwkeOBl+W+heOBo+OBpuOBi+OCieWGjeacieWKueWMllxuICAgICAgICAgICAgICAgIGltcG9ydCB0aW1lXG4gICAgICAgICAgICAgICAgdGltZS5zbGVlcCgzMClcbiAgICAgICAgICAgICAgICBiYXRjaF9jbGllbnQudXBkYXRlX2NvbXB1dGVfZW52aXJvbm1lbnQoXG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVFbnZpcm9ubWVudD1jb21wdXRlX2Vudl9uYW1lLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZT0nRU5BQkxFRCdcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgcHJpbnQoZlwiUmVmcmVzaGVkIGNvbXB1dGUgZW52aXJvbm1lbnQgZm9yIGpvYiB7YWN0aW9uWydqb2JfaWQnXX1cIilcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsaWYgYWN0aW9uWydhY3Rpb24nXSA9PSAncmV0cnlfam9iJzpcbiAgICAgICAgICAgICAgICAjIOWkseaVl+OBl+OBn+OCuOODp+ODluOCkuWGjeWun+ihjO+8iOaWsOOBl+OBhOOCuOODp+ODluOBqOOBl+OBpu+8iVxuICAgICAgICAgICAgICAgIG9yaWdpbmFsX2pvYiA9IGJhdGNoX2NsaWVudC5kZXNjcmliZV9qb2JzKGpvYnM9W2FjdGlvblsnam9iX2lkJ11dKVsnam9icyddWzBdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0cnlfam9iID0gYmF0Y2hfY2xpZW50LnN1Ym1pdF9qb2IoXG4gICAgICAgICAgICAgICAgICAgIGpvYk5hbWU9Zlwie2FjdGlvblsnam9iX25hbWUnXX0tcmV0cnkte2ludChkYXRldGltZS5ub3coKS50aW1lc3RhbXAoKSl9XCIsXG4gICAgICAgICAgICAgICAgICAgIGpvYlF1ZXVlPWpvYl9xdWV1ZV9uYW1lLFxuICAgICAgICAgICAgICAgICAgICBqb2JEZWZpbml0aW9uPW9yaWdpbmFsX2pvYlsnam9iRGVmaW5pdGlvbkFybiddLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzPW9yaWdpbmFsX2pvYi5nZXQoJ3BhcmFtZXRlcnMnLCB7fSksXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ9b3JpZ2luYWxfam9iLmdldCgndGltZW91dCcsIHt9KSxcbiAgICAgICAgICAgICAgICAgICAgcmV0cnlTdHJhdGVneT17J2F0dGVtcHRzJzogMX0gICMg5YaN6Kmm6KGM44GvMeWbnuOBruOBv1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICBwcmludChmXCJSZXRyaWVkIGpvYiB7YWN0aW9uWydqb2JfaWQnXX0gYXMge3JldHJ5X2pvYlsnam9iSWQnXX1cIilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnc3RhdHVzQ29kZSc6IDIwMCxcbiAgICAgICAgICAgICdib2R5JzoganNvbi5kdW1wcyh7XG4gICAgICAgICAgICAgICAgJ21lc3NhZ2UnOiAnUmVjb3ZlcnkgYWN0aW9ucyBjb21wbGV0ZWQnLFxuICAgICAgICAgICAgICAgICdhY3Rpb25zX3Rha2VuJzogbGVuKHJlY292ZXJ5X2FjdGlvbnMpLFxuICAgICAgICAgICAgICAgICdkZXRhaWxzJzogcmVjb3ZlcnlfYWN0aW9uc1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6XG4gICAgICAgIHByaW50KGZcIlJlY292ZXJ5IGZhaWxlZDoge3N0cihlKX1cIilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdzdGF0dXNDb2RlJzogNTAwLFxuICAgICAgICAgICAgJ2JvZHknOiBqc29uLmR1bXBzKHsnZXJyb3InOiBzdHIoZSl9KVxuICAgICAgICB9XG4gICAgICBgKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEpPQl9RVUVVRV9OQU1FOiBqb2JRdWV1ZS5qb2JRdWV1ZU5hbWUhLFxuICAgICAgICBDT01QVVRFX0VOVklST05NRU5UX05BTUU6IHRoaXMuY29tcHV0ZUVudmlyb25tZW50LmNvbXB1dGVFbnZpcm9ubWVudE5hbWUhLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEwKSxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYeWun+ihjOaoqemZkFxuICAgIHJlY292ZXJ5RnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2JhdGNoOkxpc3RKb2JzJyxcbiAgICAgICAgJ2JhdGNoOkRlc2NyaWJlSm9icycsXG4gICAgICAgICdiYXRjaDpTdWJtaXRKb2InLFxuICAgICAgICAnYmF0Y2g6VXBkYXRlQ29tcHV0ZUVudmlyb25tZW50JyxcbiAgICAgICAgJ2JhdGNoOkRlc2NyaWJlQ29tcHV0ZUVudmlyb25tZW50cycsXG4gICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dHcm91cHMnLFxuICAgICAgICAnbG9nczpEZXNjcmliZUxvZ1N0cmVhbXMnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gU05T44OI44OU44OD44Kv5L2c5oiQXG4gICAgY29uc3QgcmVjb3ZlcnlUb3BpYyA9IG5ldyBjZGsuYXdzX3Nucy5Ub3BpYyh0aGlzLCAnQmF0Y2hSZWNvdmVyeVRvcGljJywge1xuICAgICAgdG9waWNOYW1lOiBgJHtwcm9wcy5jb25maWcuam9iUXVldWUubmFtZVByZWZpeH0tcmVjb3ZlcnktdG9waWNgLFxuICAgICAgZGlzcGxheU5hbWU6ICdCYXRjaCBBdXRvIFJlY292ZXJ5IE5vdGlmaWNhdGlvbnMnLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRh6Zai5pWw44KSU05T44OI44OU44OD44Kv44Gr44K144OW44K544Kv44Op44Kk44OWXG4gICAgcmVjb3ZlcnlUb3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IGNkay5hd3Nfc25zX3N1YnNjcmlwdGlvbnMuTGFtYmRhU3Vic2NyaXB0aW9uKHJlY292ZXJ5RnVuY3Rpb24pKTtcblxuICAgIC8vIOWkseaVl+OCouODqeODvOODoOOCkuW+qeaXp+ODiOODlOODg+OCr+OBq+aOpee2mlxuICAgIGZhaWxlZEpvYnNBbGFybS5hZGRBbGFybUFjdGlvbihuZXcgY2RrLmF3c19jbG91ZHdhdGNoX2FjdGlvbnMuU25zQWN0aW9uKHJlY292ZXJ5VG9waWMpKTtcblxuICAgIC8vIOW+qeaXp+eKtuazgeODgOODg+OCt+ODpeODnOODvOODieS9nOaIkFxuICAgIHRoaXMuY3JlYXRlUmVjb3ZlcnlEYXNoYm9hcmQocHJvcHMsIGpvYlF1ZXVlLCBmYWlsZWRKb2JzQWxhcm0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOW+qeaXp+eKtuazgeODgOODg+OCt+ODpeODnOODvOODieS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVSZWNvdmVyeURhc2hib2FyZChwcm9wczogQmF0Y2hDb25zdHJ1Y3RQcm9wcywgam9iUXVldWU6IGJhdGNoLkNmbkpvYlF1ZXVlLCBmYWlsZWRKb2JzQWxhcm06IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybSk6IHZvaWQge1xuICAgIGNvbnN0IGRhc2hib2FyZCA9IG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdCYXRjaFJlY292ZXJ5RGFzaGJvYXJkJywge1xuICAgICAgZGFzaGJvYXJkTmFtZTogYCR7cHJvcHMuY29uZmlnLmpvYlF1ZXVlLm5hbWVQcmVmaXh9LXJlY292ZXJ5LWRhc2hib2FyZGAsXG4gICAgfSk7XG5cbiAgICAvLyDjgrjjg6fjg5bnirbms4HjgqbjgqPjgrjjgqfjg4Pjg4hcbiAgICBkYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgIG5ldyBjZGsuYXdzX2Nsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0JhdGNoIEpvYiBTdGF0dXMnLFxuICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0JhdGNoJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdTdWJtaXR0ZWRKb2JzJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgSm9iUXVldWU6IGpvYlF1ZXVlLmpvYlF1ZXVlTmFtZSEgfSxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0JhdGNoJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSdW5uYWJsZUpvYnMnLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDogeyBKb2JRdWV1ZTogam9iUXVldWUuam9iUXVldWVOYW1lISB9LFxuICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQmF0Y2gnLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJ1J1bm5pbmdKb2JzJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgSm9iUXVldWU6IGpvYlF1ZXVlLmpvYlF1ZXVlTmFtZSEgfSxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0JhdGNoJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdGYWlsZWRKb2JzJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgSm9iUXVldWU6IGpvYlF1ZXVlLmpvYlF1ZXVlTmFtZSEgfSxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgaGVpZ2h0OiA2LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8g44Kz44Oz44OU44Ol44O844OI55Kw5aKD44Oq44K944O844K55L2/55So54q25rOBXG4gICAgZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdDb21wdXRlIEVudmlyb25tZW50IFJlc291cmNlcycsXG4gICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQmF0Y2gnLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJ1J1bm5pbmdPbkRlbWFuZENhcGFjaXR5JyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQ29tcHV0ZUVudmlyb25tZW50OiB0aGlzLmNvbXB1dGVFbnZpcm9ubWVudC5jb21wdXRlRW52aXJvbm1lbnROYW1lISB9LFxuICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgbmV3IGNkay5hd3NfY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0JhdGNoJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSdW5uaW5nU3BvdENhcGFjaXR5JyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgQ29tcHV0ZUVudmlyb25tZW50OiB0aGlzLmNvbXB1dGVFbnZpcm9ubWVudC5jb21wdXRlRW52aXJvbm1lbnROYW1lISB9LFxuICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgaGVpZ2h0OiA2LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8g44Ki44Op44O844Og54q25rOB44Km44Kj44K444Kn44OD44OIXG4gICAgZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICBuZXcgY2RrLmF3c19jbG91ZHdhdGNoLkFsYXJtV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdSZWNvdmVyeSBBbGFybXMnLFxuICAgICAgICBhbGFybTogZmFpbGVkSm9ic0FsYXJtLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNCxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgr/jgrDoqK3lrppcbiAgICovXG4gIHByaXZhdGUgYXBwbHlUYWdzKHByb3BzOiBCYXRjaENvbnN0cnVjdFByb3BzKTogdm9pZCB7XG4gICAgY29uc3QgdGFncyA9IHtcbiAgICAgIFByb2plY3Q6IHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgRW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAgQ29tcG9uZW50OiAnRW1iZWRkaW5nJyxcbiAgICAgIE1vZHVsZTogJ0FXU19CQVRDSCcsXG4gICAgICBNYW5hZ2VkQnk6ICdDREsnLFxuICAgICAgTXVsdGlBWjogcHJvcHMuY29uZmlnLmNvbXB1dGVFbnZpcm9ubWVudC5tdWx0aUF6LnRvU3RyaW5nKCksXG4gICAgICBBdXRvU2NhbGluZzogcHJvcHMuY29uZmlnLmF1dG9TY2FsaW5nLmVuYWJsZWQudG9TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgT2JqZWN0LmVudHJpZXModGFncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog44Oi44K444Ol44O844Or5Zu65pyJ44Oq44K944O844K55Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgZ2V0IG1vZHVsZVJlc291cmNlcygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmF0Y2g6IHtcbiAgICAgICAgY29tcHV0ZUVudmlyb25tZW50OiB0aGlzLmNvbXB1dGVFbnZpcm9ubWVudCxcbiAgICAgICAgam9iRGVmaW5pdGlvbjogdGhpcy5qb2JEZWZpbml0aW9uLFxuICAgICAgICBqb2JRdWV1ZTogdGhpcy5qb2JRdWV1ZSxcbiAgICAgICAgbGF1bmNoVGVtcGxhdGU6IHRoaXMubGF1bmNoVGVtcGxhdGUsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44Oi44K444Ol44O844Or5L6d5a2Y6Zai5L+C5Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgZ2V0IGRlcGVuZGVuY2llcygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVxdWlyZWRNb2R1bGVzOiBbJ1ZQQycsICdTRUNVUklUWV9HUk9VUCcsICdJQU0nXSxcbiAgICAgIG9wdGlvbmFsTW9kdWxlczogWydNT05JVE9SSU5HJywgJ0xPR0dJTkcnXSxcbiAgICAgIHJlcXVpcmVkUmVzb3VyY2VzOiB7XG4gICAgICAgIHJlcXVpcmVzVnBjOiB0cnVlLFxuICAgICAgICByZXF1aXJlc1NlY3VyaXR5R3JvdXA6IHRydWUsXG4gICAgICAgIHJlcXVpcmVzSWFtUm9sZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZXNTdG9yYWdlOiB0cnVlLFxuICAgICAgICByZXF1aXJlc0xvZ2dpbmc6IHRydWUsXG4gICAgICB9LFxuICAgICAgcHJvdmlkZWRSZXNvdXJjZXM6IHtcbiAgICAgICAgcHJvdmlkZXNDb21wdXRlOiB0cnVlLFxuICAgICAgICBwcm92aWRlc1N0b3JhZ2U6IGZhbHNlLFxuICAgICAgICBwcm92aWRlc05ldHdvcms6IGZhbHNlLFxuICAgICAgICBwcm92aWRlc01vbml0b3Jpbmc6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOOCuOODp+ODluWun+ihjOODoeOCveODg+ODiVxuICAgKi9cbiAgcHVibGljIHN1Ym1pdEpvYihqb2JOYW1lOiBzdHJpbmcsIHBhcmFtZXRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgICAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/jgIFBV1MgU0RL44KS5L2/55So44GX44Gm44K444On44OW44KS5oqV5YWlXG4gICAgLy8g44GT44GT44Gn44Gv44K444On44OWSUTjga7jg5fjg6zjg7zjgrnjg5vjg6vjg4Djg7zjgpLov5TjgZlcbiAgICByZXR1cm4gYCR7am9iTmFtZX0tJHtEYXRlLm5vdygpfWA7XG4gIH1cblxuICAvKipcbiAgICogSm9iIFF1ZXVl54q25oWL566h55CGXG4gICAqL1xuICBwdWJsaWMgZW5hYmxlSm9iUXVldWUoKTogdm9pZCB7XG4gICAgLy8gSm9iIFF1ZXVl44KS5pyJ5Yq55YyWXG4gICAgLy8g5a6f6Zqb44Gu5a6f6KOF44Gn44Gv44CBQVdTIFNES+OCkuS9v+eUqOOBl+OBpkpvYiBRdWV1ZeOBrueKtuaFi+OCkuWkieabtFxuICAgIGNvbnNvbGUubG9nKGBFbmFibGluZyBqb2IgcXVldWU6ICR7dGhpcy5qb2JRdWV1ZS5qb2JRdWV1ZU5hbWV9YCk7XG4gIH1cblxuICBwdWJsaWMgZGlzYWJsZUpvYlF1ZXVlKCk6IHZvaWQge1xuICAgIC8vIEpvYiBRdWV1ZeOCkueEoeWKueWMllxuICAgIC8vIOWun+mam+OBruWun+ijheOBp+OBr+OAgUFXUyBTREvjgpLkvb/nlKjjgZfjgaZKb2IgUXVldWXjga7nirbmhYvjgpLlpInmm7RcbiAgICBjb25zb2xlLmxvZyhgRGlzYWJsaW5nIGpvYiBxdWV1ZTogJHt0aGlzLmpvYlF1ZXVlLmpvYlF1ZXVlTmFtZX1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBKb2IgUXVldWXlhKrlhYjluqblpInmm7RcbiAgICovXG4gIHB1YmxpYyB1cGRhdGVKb2JRdWV1ZVByaW9yaXR5KG5ld1ByaW9yaXR5OiBudW1iZXIpOiB2b2lkIHtcbiAgICAvLyBKb2IgUXVldWXjga7lhKrlhYjluqbjgpLlpInmm7RcbiAgICAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/jgIFBV1MgU0RL44KS5L2/55So44GX44GmSm9iIFF1ZXVl44Gu5YSq5YWI5bqm44KS5aSJ5pu0XG4gICAgY29uc29sZS5sb2coYFVwZGF0aW5nIGpvYiBxdWV1ZSBwcmlvcml0eSB0bzogJHtuZXdQcmlvcml0eX1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBKb2IgUXVldWXnm6Poppbjg6Hjg4jjg6rjgq/jgrnlj5blvpdcbiAgICovXG4gIHB1YmxpYyBnZXRKb2JRdWV1ZU1ldHJpY3MoKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHF1ZXVlTmFtZTogdGhpcy5qb2JRdWV1ZS5qb2JRdWV1ZU5hbWUsXG4gICAgICBjb21wdXRlRW52aXJvbm1lbnQ6IHRoaXMuY29tcHV0ZUVudmlyb25tZW50LmNvbXB1dGVFbnZpcm9ubWVudE5hbWUsXG4gICAgICBhdXRvU2NhbGluZ0VuYWJsZWQ6IHRydWUsXG4gICAgICBhdXRvUmVjb3ZlcnlFbmFibGVkOiB0cnVlLFxuICAgICAgZGFzaGJvYXJkVXJsOiBgaHR0cHM6Ly9jb25zb2xlLmF3cy5hbWF6b24uY29tL2Nsb3Vkd2F0Y2gvaG9tZSNkYXNoYm9hcmRzOm5hbWU9JHt0aGlzLmpvYlF1ZXVlLmpvYlF1ZXVlTmFtZX0tcmVjb3ZlcnktZGFzaGJvYXJkYCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEF1dG8gU2NhbGluZ+ioreWumlxuICAgKi9cbiAgcHVibGljIGNvbmZpZ3VyZUF1dG9TY2FsaW5nKHByb3BzOiBCYXRjaENvbnN0cnVjdFByb3BzKTogdm9pZCB7XG4gICAgaWYgKCFwcm9wcy5jb25maWcuYXV0b1NjYWxpbmcuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENsb3VkV2F0Y2jjg6Hjg4jjg6rjgq/jgrnjg5njg7zjgrnjga7oh6rli5XjgrnjgrHjg7zjg6rjg7PjgrDoqK3lrppcbiAgICAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/jgIFBcHBsaWNhdGlvbiBBdXRvIFNjYWxpbmfjgpLkvb/nlKhcbiAgICBjb25zb2xlLmxvZygnQXV0byBTY2FsaW5nIGNvbmZpZ3VyYXRpb246Jywge1xuICAgICAgc2NhbGVPdXRUaHJlc2hvbGQ6IHByb3BzLmNvbmZpZy5hdXRvU2NhbGluZy5zY2FsZU91dFRocmVzaG9sZCxcbiAgICAgIHNjYWxlSW5UaHJlc2hvbGQ6IHByb3BzLmNvbmZpZy5hdXRvU2NhbGluZy5zY2FsZUluVGhyZXNob2xkLFxuICAgICAgY29vbGRvd25QZXJpb2Q6IHByb3BzLmNvbmZpZy5hdXRvU2NhbGluZy5jb29sZG93blBlcmlvZCxcbiAgICB9KTtcbiAgfVxufSJdfQ==