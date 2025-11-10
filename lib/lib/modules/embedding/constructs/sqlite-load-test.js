"use strict";
/**
 * SQLite負荷試験統合コンストラクト
 *
 * FSx for ONTAP上でのSQLite負荷試験とEmbedding処理の統合
 * - AWS Batch統合
 * - EventBridge定期実行
 * - CloudWatch監視
 * - IAM権限管理
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
exports.SqliteLoadTest = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const batch = __importStar(require("aws-cdk-lib/aws-batch"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const constructs_1 = require("constructs");
class SqliteLoadTest extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // IAMロール作成
        this.serviceRole = this.createBatchServiceRole(props);
        this.jobRole = this.createJobExecutionRole(props);
        this.eventRole = this.createEventBridgeRole(props);
        // CloudWatch Logs
        this.logGroup = this.createLogGroup(props);
        // Batch Compute Environment
        this.computeEnvironment = this.createComputeEnvironment(props);
        // Batch Job Queue
        this.jobQueue = this.createJobQueue(props);
        // Batch Job Definition
        this.jobDefinition = this.createJobDefinition(props);
        // EventBridge定期実行（有効化されている場合）
        if (props.enableScheduledExecution) {
            this.scheduledRule = this.createScheduledRule(props);
        }
        // タグ設定
        this.applyTags(props);
    }
    /**
     * Batch Service Role作成
     */
    createBatchServiceRole(props) {
        return new iam.Role(this, 'BatchServiceRole', {
            roleName: `${props.projectName}-${props.environment}-sqlite-batch-service-role`,
            assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole'),
            ],
        });
    }
    /**
     * Job Execution Role作成
     */
    createJobExecutionRole(props) {
        const role = new iam.Role(this, 'JobExecutionRole', {
            roleName: `${props.projectName}-${props.environment}-sqlite-job-execution-role`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
            ],
        });
        // Bedrock権限追加
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:ListFoundationModels',
            ],
            resources: [
                `arn:aws:bedrock:${props.bedrockRegion}:*:foundation-model/${props.bedrockModelId}`,
                `arn:aws:bedrock:${props.bedrockRegion}:*:foundation-model/amazon.titan-embed-*`,
            ],
        }));
        // FSx権限追加
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'fsx:DescribeFileSystems',
                'fsx:DescribeStorageVirtualMachines',
                'fsx:DescribeVolumes',
            ],
            resources: [
                `arn:aws:fsx:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:file-system/${props.fsxFileSystemId}`,
                `arn:aws:fsx:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:storage-virtual-machine/${props.fsxSvmId}`,
                `arn:aws:fsx:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:volume/${props.fsxVolumeId}`,
            ],
        }));
        return role;
    }
    /**
     * EventBridge Role作成
     */
    createEventBridgeRole(props) {
        const role = new iam.Role(this, 'EventBridgeRole', {
            roleName: `${props.projectName}-${props.environment}-sqlite-eventbridge-role`,
            assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
        });
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['batch:SubmitJob'],
            resources: [
                `arn:aws:batch:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:job-queue/*`,
                `arn:aws:batch:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:job-definition/*`,
            ],
        }));
        return role;
    }
    /**
     * CloudWatch Log Group作成
     */
    createLogGroup(props) {
        return new logs.LogGroup(this, 'LogGroup', {
            logGroupName: `/aws/batch/${props.projectName}-${props.environment}-sqlite-embedding`,
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
    /**
     * Batch Compute Environment作成
     */
    createComputeEnvironment(props) {
        return new batch.CfnComputeEnvironment(this, 'ComputeEnvironment', {
            computeEnvironmentName: `${props.projectName}-${props.environment}-sqlite-compute-env`,
            type: 'MANAGED',
            state: 'ENABLED',
            serviceRole: this.serviceRole.roleArn,
            computeResources: {
                type: 'EC2',
                minvCpus: 0,
                maxvCpus: props.maxvCpus || 20,
                desiredvCpus: 0,
                instanceTypes: props.instanceTypes || ['m5.large', 'm5.xlarge'],
                subnets: props.privateSubnets.map(subnet => subnet.subnetId),
                securityGroupIds: [props.securityGroup.securityGroupId],
                instanceRole: `arn:aws:iam::${cdk.Stack.of(this).account}:instance-profile/ecsInstanceRole`,
                tags: {
                    Project: props.projectName,
                    Environment: props.environment,
                    Component: 'SQLiteEmbedding',
                },
            },
        });
    }
    /**
     * Batch Job Queue作成
     */
    createJobQueue(props) {
        return new batch.CfnJobQueue(this, 'JobQueue', {
            jobQueueName: `${props.projectName}-${props.environment}-sqlite-job-queue`,
            state: 'ENABLED',
            priority: 1,
            computeEnvironmentOrder: [
                {
                    order: 1,
                    computeEnvironment: this.computeEnvironment.ref,
                },
            ],
        });
    }
    /**
     * Batch Job Definition作成
     */
    createJobDefinition(props) {
        const command = this.generateJobCommand(props);
        return new batch.CfnJobDefinition(this, 'JobDefinition', {
            jobDefinitionName: `${props.projectName}-${props.environment}-sqlite-embedding-job-def`,
            type: 'container',
            containerProperties: {
                image: 'public.ecr.aws/amazonlinux/amazonlinux:2023',
                vcpus: 2,
                memory: 4096,
                command,
                environment: [
                    { name: 'FSX_FILE_SYSTEM_ID', value: props.fsxFileSystemId },
                    { name: 'FSX_SVM_ID', value: props.fsxSvmId },
                    { name: 'FSX_VOLUME_ID', value: props.fsxVolumeId },
                    { name: 'FSX_MOUNT_PATH', value: props.fsxMountPath },
                    { name: 'FSX_NFS_ENDPOINT', value: props.fsxNfsEndpoint },
                    { name: 'BEDROCK_REGION', value: props.bedrockRegion },
                    { name: 'BEDROCK_MODEL_ID', value: props.bedrockModelId },
                    { name: 'AWS_DEFAULT_REGION', value: cdk.Stack.of(this).region },
                    { name: 'PROJECT_NAME', value: props.projectName },
                    { name: 'ENVIRONMENT', value: props.environment },
                ],
                jobRoleArn: this.jobRole.roleArn,
                privileged: false,
            },
            retryStrategy: {
                attempts: 3,
            },
            timeout: {
                attemptDurationSeconds: 3600,
            },
        });
    }
    /**
     * EventBridge定期実行ルール作成
     */
    createScheduledRule(props) {
        const rule = new events.Rule(this, 'ScheduledRule', {
            ruleName: `${props.projectName}-${props.environment}-sqlite-embedding-schedule`,
            description: 'SQLite負荷試験用のEmbedding処理を定期実行',
            schedule: events.Schedule.expression(props.scheduleExpression),
            enabled: true,
        });
        rule.addTarget(new targets.BatchJob(this.jobQueue.ref, this.jobQueue, this.jobDefinition.ref, this.jobDefinition, {
            jobName: `${props.projectName}-${props.environment}-sqlite-embedding-scheduled`,
            event: events.RuleTargetInput.fromObject({
                inputPath: props.fsxMountPath,
                scheduledExecution: true,
            }),
        }));
        return rule;
    }
    /**
     * ジョブコマンド生成
     */
    generateJobCommand(props) {
        return [
            'sh',
            '-c',
            `
echo 'Starting SQLite Embedding Batch Job...' &&
yum update -y &&
yum install -y nfs-utils python3 python3-pip &&
echo 'Installing Python dependencies...' &&
pip3 install boto3 numpy &&
echo 'Creating mount point...' &&
mkdir -p /mnt/fsx-sqlite &&
echo 'Mounting FSx for ONTAP sqlite-load-test volume...' &&
mount -t nfs -o nfsvers=3 \${FSX_NFS_ENDPOINT}:\${FSX_MOUNT_PATH} /mnt/fsx-sqlite &&
echo 'Mount successful!' &&
df -h /mnt/fsx-sqlite &&
ls -la /mnt/fsx-sqlite &&
echo 'Creating embedding processing script...' &&
cat > /tmp/embedding_processor.py << 'EOF'
import os
import json
import boto3
import time
from datetime import datetime

def process_sqlite_files():
    """SQLiteファイルからEmbedding処理を実行"""
    bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('BEDROCK_REGION', 'ap-northeast-1'))
    
    # SQLiteファイルを検索
    sqlite_dir = '/mnt/fsx-sqlite'
    sqlite_files = []
    
    for root, dirs, files in os.walk(sqlite_dir):
        for file in files:
            if file.endswith('.db'):
                sqlite_files.append(os.path.join(root, file))
    
    print(f'Found {len(sqlite_files)} SQLite files for processing')
    
    # 各SQLiteファイルに対してEmbedding処理をシミュレート
    for sqlite_file in sqlite_files:
        print(f'Processing: {sqlite_file}')
        
        # ファイル情報を取得
        file_stat = os.stat(sqlite_file)
        file_size = file_stat.st_size
        
        # Embedding処理のシミュレート（実際のBedrockは使用せず、メタデータのみ作成）
        embedding_metadata = {
            'file_path': sqlite_file,
            'file_size': file_size,
            'processed_at': datetime.now().isoformat(),
            'embedding_model': os.environ.get('BEDROCK_MODEL_ID', 'amazon.titan-embed-text-v1'),
            'status': 'processed',
            'chunk_count': max(1, file_size // 1024)  # 1KBあたり1チャンク
        }
        
        # メタデータファイルを作成
        metadata_file = sqlite_file + '.embedding_metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(embedding_metadata, f, indent=2)
        
        print(f'Created embedding metadata: {metadata_file}')
        
        # 処理時間をシミュレート
        time.sleep(1)
    
    return len(sqlite_files)

if __name__ == '__main__':
    try:
        processed_count = process_sqlite_files()
        print(f'Successfully processed {processed_count} SQLite files')
    except Exception as e:
        print(f'Error processing SQLite files: {e}')
        exit(1)
EOF
echo 'Running embedding processing...' &&
python3 /tmp/embedding_processor.py &&
echo 'Listing processed files...' &&
find /mnt/fsx-sqlite -name '*.embedding_metadata.json' -exec ls -la {} \\; &&
echo 'SQLite Embedding Batch Job completed successfully!'
      `.trim(),
        ];
    }
    /**
     * タグ適用
     */
    applyTags(props) {
        const tags = {
            Project: props.projectName,
            Environment: props.environment,
            Component: 'SQLiteEmbedding',
            ManagedBy: 'CDK',
        };
        Object.entries(tags).forEach(([key, value]) => {
            cdk.Tags.of(this).add(key, value);
        });
    }
    /**
     * ジョブ投入
     */
    submitJob(jobName) {
        const name = jobName || `sqlite-embedding-${Date.now()}`;
        // 実際のジョブ投入はAWS SDKを使用して実装
        // ここではジョブ名を返すのみ
        return name;
    }
    /**
     * 統合情報取得
     */
    getIntegrationInfo() {
        return {
            computeEnvironment: this.computeEnvironment.ref,
            jobQueue: this.jobQueue.ref,
            jobDefinition: this.jobDefinition.ref,
            logGroup: this.logGroup.logGroupName,
            scheduledRule: this.scheduledRule?.ruleArn,
        };
    }
}
exports.SqliteLoadTest = SqliteLoadTest;
