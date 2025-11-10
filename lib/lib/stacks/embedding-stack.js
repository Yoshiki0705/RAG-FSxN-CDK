"use strict";
/**
 * Embedding Stack
 * Embedding統合スタック - 統一命名規則適用
 *
 * 統合機能:
 * - AWS Batch、ECS、Lambda、Bedrock、埋め込み、RAG、文書処理
 * - Component="Embedding"による統一命名規則
 * - 設定・変更容易性を担保するモジュール化アーキテクチャ
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
const aws_cdk_lib_1 = require("aws-cdk-lib");
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
class EmbeddingStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { config } = props;
        // 統一命名規則のためのregionPrefix設定
        const regionPrefix = config.regionPrefix || this.getRegionPrefix(config.region);
        const enhancedConfig = { ...config, regionPrefix };
        // Create temporary processing bucket for Markitdown
        this.tempProcessingBucket = this.createTempProcessingBucket(enhancedConfig);
        // Create ECS Cluster if needed
        if (enhancedConfig.embedding.ecs.enabled && props.vpc) {
            this.createEcsCluster(enhancedConfig, props.vpc);
        }
        // Create Bedrock IAM Role
        if (enhancedConfig.features.ai.bedrock) {
            this.createBedrockRole(enhancedConfig, this.tempProcessingBucket);
        }
        // Create Lambda functions
        if (enhancedConfig.embedding.lambda) {
            this.createLambdaFunctions(enhancedConfig, props, this.tempProcessingBucket);
        }
    }
    createEcsCluster(config, vpc) {
        this.ecsCluster = new ecs.Cluster(this, 'EmbeddingEcsCluster', {
            clusterName: `${config.regionPrefix}-${config.projectName}-${config.environment}-Embedding-EcsCluster`,
            vpc,
            containerInsights: true
        });
        // Add EC2 capacity provider with ECS configuration
        this.ecsCluster.addCapacity('EmbeddingEC2Capacity', {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, config.embedding.ecs.instanceType.includes('large') ? ec2.InstanceSize.LARGE : ec2.InstanceSize.XLARGE),
            minCapacity: config.embedding.ecs.minCapacity,
            maxCapacity: config.embedding.ecs.maxCapacity,
            desiredCapacity: config.embedding.ecs.desiredCapacity
        });
    }
    createTempProcessingBucket(config) {
        const tempBucket = new s3.Bucket(this, 'EmbeddingTempProcessingBucket', {
            bucketName: `${config.regionPrefix}-${config.projectName}-${config.environment}-embedding-temp-processing`,
            removalPolicy: config.environment === 'prod' ?
                aws_cdk_lib_1.RemovalPolicy.RETAIN : aws_cdk_lib_1.RemovalPolicy.DESTROY,
            autoDeleteObjects: config.environment !== 'prod',
            versioned: false,
            lifecycleRules: [
                {
                    id: 'DeleteTempFiles',
                    enabled: true,
                    expiration: aws_cdk_lib_1.Duration.days(1), // 1日後に自動削除
                    abortIncompleteMultipartUploadAfter: aws_cdk_lib_1.Duration.hours(1)
                }
            ],
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true
        });
        return tempBucket;
    }
    createBedrockRole(config, tempBucket) {
        this.bedrockRole = new iam.Role(this, 'EmbeddingBedrockRole', {
            roleName: `${config.regionPrefix}-${config.projectName}-${config.environment}-Embedding-BedrockRole`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
            ]
        });
        // Add Bedrock permissions
        this.bedrockRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock:ListFoundationModels',
                'bedrock:GetFoundationModel'
            ],
            resources: ['*']
        }));
        // Add CloudWatch Logs permissions for Markitdown processing
        this.bedrockRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams'
            ],
            resources: [
                `arn:aws:logs:${config.region}:${this.account}:log-group:/aws/lambda/${config.regionPrefix}-${config.projectName}-*`,
                `arn:aws:logs:${config.region}:${this.account}:log-group:/aws/lambda/${config.regionPrefix}-${config.projectName}-*:*`
            ]
        }));
        // Add X-Ray tracing permissions
        this.bedrockRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords'
            ],
            resources: ['*']
        }));
        // Add Systems Manager Parameter Store permissions for configuration
        this.bedrockRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath'
            ],
            resources: [
                `arn:aws:ssm:${config.region}:${this.account}:parameter/${config.regionPrefix}-${config.projectName}/*`
            ]
        }));
        // Add temporary file storage permissions (for Markitdown processing)
        tempBucket.grantReadWrite(this.bedrockRole);
        // Add additional S3 permissions for processing
        this.bedrockRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                's3:ListBucket',
                's3:GetBucketLocation',
                's3:GetBucketVersioning'
            ],
            resources: [tempBucket.bucketArn]
        }));
    }
    createLambdaFunctions(config, props, tempBucket) {
        // Create Markitdown dependencies layer
        const markitdownLayer = new lambda.LayerVersion(this, 'EmbeddingMarkitdownLayer', {
            layerVersionName: `${config.regionPrefix}-${config.projectName}-${config.environment}-Embedding-MarkitdownLayer`,
            description: 'Markitdown library and dependencies for document processing',
            code: lambda.Code.fromAsset('lambda/layers/markitdown'),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
            compatibleArchitectures: [lambda.Architecture.X86_64]
        });
        // Common Lambda configuration
        const commonLambdaProps = {
            runtime: lambda.Runtime.PYTHON_3_11,
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            memorySize: 1024,
            environment: {
                REGION: config.region,
                PROJECT_NAME: config.projectName,
                ENVIRONMENT: config.environment,
                DOCUMENTS_TABLE: props.documentsTable?.tableName || '',
                EMBEDDINGS_TABLE: props.embeddingsTable?.tableName || '',
                DOCUMENTS_BUCKET: props.documentsBucket?.bucketName || '',
                TEMP_PROCESSING_BUCKET: tempBucket.bucketName
            },
            logRetention: logs.RetentionDays.ONE_MONTH,
            tracing: lambda.Tracing.ACTIVE // X-Ray tracing enabled
        };
        // Document Processor Function with Markitdown Integration
        this.documentProcessorFunction = new lambda.Function(this, 'EmbeddingDocumentProcessorFunction', {
            ...commonLambdaProps,
            functionName: `${config.regionPrefix}-${config.projectName}-${config.environment}-Embedding-DocumentProcessor`,
            description: 'Process uploaded documents with Markitdown integration and extract text',
            handler: 'document_processor.lambda_handler',
            code: lambda.Code.fromAsset('lambda/documentprocessor'),
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            memorySize: 2048, // Markitdown処理のためメモリを増加
            environment: {
                ...commonLambdaProps.environment,
                MARKITDOWN_ENVIRONMENT: config.environment,
                MARKITDOWN_CONFIG_PATH: '/opt/config/markitdown-config.json',
                ENABLE_MARKITDOWN: 'true',
                ENABLE_LANGCHAIN_FALLBACK: 'true',
                MAX_FILE_SIZE_MB: '50',
                PROCESSING_TIMEOUT_SECONDS: '300',
                LOG_LEVEL: config.environment === 'prod' ? 'INFO' : 'DEBUG'
            },
            layers: [markitdownLayer],
            role: this.bedrockRole
        });
        // Embedding Function
        if (config.features.ai.embedding) {
            this.embeddingFunction = new lambda.Function(this, 'EmbeddingFunction', {
                ...commonLambdaProps,
                functionName: `${config.regionPrefix}-${config.projectName}-${config.environment}-Embedding-Function`,
                description: 'Generate embeddings using Amazon Bedrock',
                handler: 'index.lambda_handler',
                code: lambda.Code.fromInline(`
import json
import boto3
import os
from typing import Dict, Any, List

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Embedding generation function
    Uses Amazon Bedrock to generate embeddings for text chunks
    """
    print(f"Generating embeddings for event: {json.dumps(event)}")
    
    bedrock = boto3.client('bedrock-runtime', region_name=os.environ['REGION'])
    
    # TODO: Implement embedding generation logic
    # 1. Use Bedrock Titan Embeddings model
    # 2. Generate embeddings for text chunks
    # 3. Store embeddings in DynamoDB
    # 4. Update OpenSearch index
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Embeddings generated successfully',
            'embeddingCount': event.get('chunkCount', 0)
        })
    }
        `),
                role: this.bedrockRole
            });
        }
        // RAG Query Function
        if (config.features.ai.rag) {
            this.ragQueryFunction = new lambda.Function(this, 'EmbeddingRagQueryFunction', {
                ...commonLambdaProps,
                functionName: `${config.regionPrefix}-${config.projectName}-${config.environment}-Embedding-RagQuery`,
                description: 'Handle RAG queries using retrieval and generation',
                handler: 'index.lambda_handler',
                code: lambda.Code.fromInline(`
import json
import boto3
import os
from typing import Dict, Any, List

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    RAG query function
    Retrieves relevant documents and generates responses using Bedrock
    """
    print(f"Processing RAG query: {json.dumps(event)}")
    
    bedrock = boto3.client('bedrock-runtime', region_name=os.environ['REGION'])
    
    query = event.get('query', '')
    user_id = event.get('userId', '')
    
    # TODO: Implement RAG logic
    # 1. Generate query embedding
    # 2. Search similar documents in OpenSearch
    # 3. Retrieve relevant document chunks
    # 4. Apply permission filtering based on user
    # 5. Generate response using Bedrock Claude/Titan
    # 6. Log query for audit purposes
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'query': query,
            'response': 'This is a placeholder response. Implement RAG logic here.',
            'sources': [],
            'userId': user_id
        })
    }
        `),
                role: this.bedrockRole
            });
        }
        // Grant permissions to Lambda functions
        if (props.documentsTable) {
            props.documentsTable.grantReadWriteData(this.documentProcessorFunction);
            if (this.embeddingFunction) {
                props.documentsTable.grantReadData(this.embeddingFunction);
            }
            if (this.ragQueryFunction) {
                props.documentsTable.grantReadData(this.ragQueryFunction);
            }
        }
        if (props.embeddingsTable) {
            if (this.embeddingFunction) {
                props.embeddingsTable.grantReadWriteData(this.embeddingFunction);
            }
            if (this.ragQueryFunction) {
                props.embeddingsTable.grantReadData(this.ragQueryFunction);
            }
        }
        if (props.documentsBucket) {
            props.documentsBucket.grantRead(this.documentProcessorFunction);
            if (this.embeddingFunction) {
                props.documentsBucket.grantRead(this.embeddingFunction);
            }
        }
        // Grant temporary bucket access to document processor
        tempBucket.grantReadWrite(this.documentProcessorFunction);
        // Grant CloudWatch metrics permissions
        this.documentProcessorFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'cloudwatch:PutMetricData'
            ],
            resources: ['*'],
            conditions: {
                StringEquals: {
                    'cloudwatch:namespace': `${config.regionPrefix}-${config.projectName}/Embedding`
                }
            }
        }));
    }
    /**
     * リージョンからregionPrefixを取得
     */
    getRegionPrefix(region) {
        const regionMapping = {
            'ap-northeast-1': 'TokyoRegion',
            'ap-northeast-3': 'OsakaRegion',
            'us-east-1': 'USEast1Region',
            'us-west-2': 'USWest2Region',
            'eu-west-1': 'EuropeRegion',
            'eu-central-1': 'FrankfurtRegion'
        };
        return regionMapping[region] || `${region.replace(/-/g, '')}Region`;
    }
}
exports.EmbeddingStack = EmbeddingStack;
