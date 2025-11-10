"use strict";
/**
 * Data Stack
 * データ・ストレージ統合スタック
 *
 * 統合機能:
 * - DynamoDB、OpenSearch、RDS、FSx、S3、バックアップ、ライフサイクル
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
exports.DataStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const opensearch = __importStar(require("aws-cdk-lib/aws-opensearchserverless"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const backup = __importStar(require("aws-cdk-lib/aws-backup"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
class DataStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { config } = props;
        // DynamoDB Tables
        if (config.features.database.dynamodb) {
            this.createDynamoDbTables(config);
        }
        // OpenSearch Domain
        if (config.features.database.opensearch) {
            this.createOpenSearchDomain(config, props.vpc);
        }
        // S3 Buckets
        if (config.features.storage.s3) {
            this.createS3Buckets(config);
        }
        // Backup Configuration
        if (config.features.storage.backup) {
            this.createBackupConfiguration(config);
        }
    }
    createDynamoDbTables(config) {
        // Documents metadata table
        this.documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
            tableName: `${config.projectName}-documents-${config.environment}`,
            partitionKey: {
                name: 'documentId',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'version',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecovery: true,
            removalPolicy: config.environment === 'prod' ? aws_cdk_lib_1.RemovalPolicy.RETAIN : aws_cdk_lib_1.RemovalPolicy.DESTROY,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        });
        // Add GSI for user-based queries
        this.documentsTable.addGlobalSecondaryIndex({
            indexName: 'UserIndex',
            partitionKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'createdAt',
                type: dynamodb.AttributeType.STRING
            }
        });
        // Embeddings table for vector storage
        this.embeddingsTable = new dynamodb.Table(this, 'EmbeddingsTable', {
            tableName: `${config.projectName}-embeddings-${config.environment}`,
            partitionKey: {
                name: 'embeddingId',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecovery: true,
            removalPolicy: config.environment === 'prod' ? aws_cdk_lib_1.RemovalPolicy.RETAIN : aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        // Add GSI for document-based queries
        this.embeddingsTable.addGlobalSecondaryIndex({
            indexName: 'DocumentIndex',
            partitionKey: {
                name: 'documentId',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'chunkIndex',
                type: dynamodb.AttributeType.NUMBER
            }
        });
    }
    createOpenSearchDomain(config, vpc) {
        const domainName = `${config.projectName}-search-${config.environment}`;
        // OpenSearch configuration based on environment
        const instanceType = config.environment === 'prod'
            ? 't3.medium.search'
            : 't3.small.search';
        const instanceCount = config.environment === 'prod' ? 3 : 1;
        this.searchDomain = new opensearch.CfnCollection(this, 'SearchDomain', {
            name: domainName,
            type: 'VECTORSEARCH',
            description: `OpenSearch Serverless collection for ${config.projectName}`
        });
    }
    createS3Buckets(config) {
        // Documents storage bucket
        this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
            bucketName: `${config.projectName}-documents-${config.environment}-${config.region}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            removalPolicy: config.environment === 'prod' ? aws_cdk_lib_1.RemovalPolicy.RETAIN : aws_cdk_lib_1.RemovalPolicy.DESTROY,
            autoDeleteObjects: config.environment !== 'prod'
        });
        // Lifecycle rules for cost optimization
        if (config.features.storage.lifecycle) {
            this.documentsBucket.addLifecycleRule({
                id: 'TransitionToIA',
                enabled: true,
                transitions: [
                    {
                        storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                        transitionAfter: aws_cdk_lib_1.Duration.days(30)
                    },
                    {
                        storageClass: s3.StorageClass.GLACIER,
                        transitionAfter: aws_cdk_lib_1.Duration.days(90)
                    },
                    {
                        storageClass: s3.StorageClass.DEEP_ARCHIVE,
                        transitionAfter: aws_cdk_lib_1.Duration.days(365)
                    }
                ]
            });
            // Delete old versions
            this.documentsBucket.addLifecycleRule({
                id: 'DeleteOldVersions',
                enabled: true,
                noncurrentVersionExpiration: aws_cdk_lib_1.Duration.days(365)
            });
        }
    }
    createBackupConfiguration(config) {
        // Create backup vault
        this.backupVault = new backup.BackupVault(this, 'BackupVault', {
            backupVaultName: `${config.projectName}-backup-vault-${config.environment}`,
            encryptionKey: undefined, // Use default AWS managed key
            removalPolicy: config.environment === 'prod' ? aws_cdk_lib_1.RemovalPolicy.RETAIN : aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        // Create backup plan
        const backupPlan = new backup.BackupPlan(this, 'BackupPlan', {
            backupPlanName: `${config.projectName}-backup-plan-${config.environment}`,
            backupVault: this.backupVault
        });
        // Add backup rules based on environment
        if (config.environment === 'prod') {
            // Production: Daily backups with long retention
            backupPlan.addRule(new backup.BackupPlanRule({
                ruleName: 'DailyBackups',
                scheduleExpression: events.Schedule.cron({
                    hour: '2',
                    minute: '0'
                }),
                deleteAfter: aws_cdk_lib_1.Duration.days(365),
                moveToColdStorageAfter: aws_cdk_lib_1.Duration.days(30)
            }));
        }
        else {
            // Non-production: Weekly backups with shorter retention
            backupPlan.addRule(new backup.BackupPlanRule({
                ruleName: 'WeeklyBackups',
                scheduleExpression: events.Schedule.cron({
                    weekDay: '1',
                    hour: '2',
                    minute: '0'
                }),
                deleteAfter: aws_cdk_lib_1.Duration.days(30)
            }));
        }
        // Create backup selection for DynamoDB tables
        if (this.documentsTable || this.embeddingsTable) {
            new backup.BackupSelection(this, 'BackupSelection', {
                backupPlan,
                selectionName: 'DynamoDBBackup',
                resources: [
                    ...(this.documentsTable ? [backup.BackupResource.fromDynamoDbTable(this.documentsTable)] : []),
                    ...(this.embeddingsTable ? [backup.BackupResource.fromDynamoDbTable(this.embeddingsTable)] : [])
                ]
            });
        }
    }
}
exports.DataStack = DataStack;
