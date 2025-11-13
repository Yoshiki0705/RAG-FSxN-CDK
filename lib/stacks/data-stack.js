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
    documentsTable;
    embeddingsTable;
    searchDomain;
    documentsBucket;
    backupVault;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCw2Q0FBeUU7QUFFekUsbUVBQXFEO0FBQ3JELGlGQUFtRTtBQUNuRSx1REFBeUM7QUFDekMsK0RBQWlEO0FBQ2pELCtEQUFpRDtBQVVqRCxNQUFhLFNBQVUsU0FBUSxtQkFBSztJQUNsQixjQUFjLENBQWtCO0lBQ2hDLGVBQWUsQ0FBa0I7SUFDakMsWUFBWSxDQUFxQjtJQUNqQyxlQUFlLENBQWE7SUFDNUIsV0FBVyxDQUFzQjtJQUVqRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXFCO1FBQzdELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFekIsa0JBQWtCO1FBQ2xCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxvQkFBb0I7UUFDcEIsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsYUFBYTtRQUNiLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRUQsdUJBQXVCO1FBQ3ZCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFB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LElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNoRCxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO2dCQUNsRCxVQUFVO2dCQUNWLGFBQWEsRUFBRSxnQkFBZ0I7Z0JBQy9CLFNBQVMsRUFBRTtvQkFDVCxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzlGLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztpQkFDakc7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBek1ELDhCQXlNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRGF0YSBTdGFja1xuICog44OH44O844K/44O744K544OI44Os44O844K457Wx5ZCI44K544K/44OD44KvXG4gKiBcbiAqIOe1seWQiOapn+iDvTpcbiAqIC0gRHluYW1vRELjgIFPcGVuU2VhcmNo44CBUkRT44CBRlN444CBUzPjgIHjg5Djg4Pjgq/jgqLjg4Pjg5fjgIHjg6njgqTjg5XjgrXjgqTjgq/jg6tcbiAqL1xuXG5pbXBvcnQgeyBTdGFjaywgU3RhY2tQcm9wcywgUmVtb3ZhbFBvbGljeSwgRHVyYXRpb24gfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBvcGVuc2VhcmNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1vcGVuc2VhcmNoc2VydmVybGVzcyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgYmFja3VwIGZyb20gJ2F3cy1jZGstbGliL2F3cy1iYWNrdXAnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0IHsgR2xvYmFsUmFnQ29uZmlnIH0gZnJvbSAnLi4vLi4vdHlwZXMvZ2xvYmFsLWNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVN0YWNrUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcbiAgY29uZmlnOiBHbG9iYWxSYWdDb25maWc7XG4gIHZwYz86IGVjMi5JVnBjO1xufVxuXG5leHBvcnQgY2xhc3MgRGF0YVN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgZG9jdW1lbnRzVGFibGU/OiBkeW5hbW9kYi5UYWJsZTtcbiAgcHVibGljIHJlYWRvbmx5IGVtYmVkZGluZ3NUYWJsZT86IGR5bmFtb2RiLlRhYmxlO1xuICBwdWJsaWMgcmVhZG9ubHkgc2VhcmNoRG9tYWluPzogb3BlbnNlYXJjaC5Eb21haW47XG4gIHB1YmxpYyByZWFkb25seSBkb2N1bWVudHNCdWNrZXQ/OiBzMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBiYWNrdXBWYXVsdD86IGJhY2t1cC5CYWNrdXBWYXVsdDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRGF0YVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHsgY29uZmlnIH0gPSBwcm9wcztcblxuICAgIC8vIER5bmFtb0RCIFRhYmxlc1xuICAgIGlmIChjb25maWcuZmVhdHVyZXMuZGF0YWJhc2UuZHluYW1vZGIpIHtcbiAgICAgIHRoaXMuY3JlYXRlRHluYW1vRGJUYWJsZXMoY29uZmlnKTtcbiAgICB9XG5cbiAgICAvLyBPcGVuU2VhcmNoIERvbWFpblxuICAgIGlmIChjb25maWcuZmVhdHVyZXMuZGF0YWJhc2Uub3BlbnNlYXJjaCkge1xuICAgICAgdGhpcy5jcmVhdGVPcGVuU2VhcmNoRG9tYWluKGNvbmZpZywgcHJvcHMudnBjKTtcbiAgICB9XG5cbiAgICAvLyBTMyBCdWNrZXRzXG4gICAgaWYgKGNvbmZpZy5mZWF0dXJlcy5zdG9yYWdlLnMzKSB7XG4gICAgICB0aGlzLmNyZWF0ZVMzQnVja2V0cyhjb25maWcpO1xuICAgIH1cblxuICAgIC8vIEJhY2t1cCBDb25maWd1cmF0aW9uXG4gICAgaWYgKGNvbmZpZy5mZWF0dXJlcy5zdG9yYWdlLmJhY2t1cCkge1xuICAgICAgdGhpcy5jcmVhdGVCYWNrdXBDb25maWd1cmF0aW9uKGNvbmZpZyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVEeW5hbW9EYlRhYmxlcyhjb25maWc6IEdsb2JhbFJhZ0NvbmZpZyk6IHZvaWQge1xuICAgIC8vIERvY3VtZW50cyBtZXRhZGF0YSB0YWJsZVxuICAgIHRoaXMuZG9jdW1lbnRzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0RvY3VtZW50c1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiBgJHtjb25maWcucHJvamVjdE5hbWV9LWRvY3VtZW50cy0ke2NvbmZpZy5lbnZpcm9ubWVudH1gLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdkb2N1bWVudElkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkdcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICd2ZXJzaW9uJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkdcbiAgICAgIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkFXU19NQU5BR0VELFxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNvbmZpZy5lbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gUmVtb3ZhbFBvbGljeS5SRVRBSU4gOiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBzdHJlYW06IGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlLk5FV19BTkRfT0xEX0lNQUdFU1xuICAgIH0pO1xuXG4gICAgLy8gQWRkIEdTSSBmb3IgdXNlci1iYXNlZCBxdWVyaWVzXG4gICAgdGhpcy5kb2N1bWVudHNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdVc2VySW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICd1c2VySWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR1xuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ2NyZWF0ZWRBdCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBFbWJlZGRpbmdzIHRhYmxlIGZvciB2ZWN0b3Igc3RvcmFnZVxuICAgIHRoaXMuZW1iZWRkaW5nc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdFbWJlZGRpbmdzVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6IGAke2NvbmZpZy5wcm9qZWN0TmFtZX0tZW1iZWRkaW5ncy0ke2NvbmZpZy5lbnZpcm9ubWVudH1gLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdlbWJlZGRpbmdJZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5BV1NfTUFOQUdFRCxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgICByZW1vdmFsUG9saWN5OiBjb25maWcuZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IFJlbW92YWxQb2xpY3kuUkVUQUlOIDogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR1NJIGZvciBkb2N1bWVudC1iYXNlZCBxdWVyaWVzXG4gICAgdGhpcy5lbWJlZGRpbmdzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnRG9jdW1lbnRJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ2RvY3VtZW50SWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR1xuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ2NodW5rSW5kZXgnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUlxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVPcGVuU2VhcmNoRG9tYWluKGNvbmZpZzogR2xvYmFsUmFnQ29uZmlnLCB2cGM/OiBlYzIuSVZwYyk6IHZvaWQge1xuICAgIGNvbnN0IGRvbWFpbk5hbWUgPSBgJHtjb25maWcucHJvamVjdE5hbWV9LXNlYXJjaC0ke2NvbmZpZy5lbnZpcm9ubWVudH1gO1xuXG4gICAgLy8gT3BlblNlYXJjaCBjb25maWd1cmF0aW9uIGJhc2VkIG9uIGVudmlyb25tZW50XG4gICAgY29uc3QgaW5zdGFuY2VUeXBlID0gY29uZmlnLmVudmlyb25tZW50ID09PSAncHJvZCcgXG4gICAgICA/ICd0My5tZWRpdW0uc2VhcmNoJyBcbiAgICAgIDogJ3QzLnNtYWxsLnNlYXJjaCc7XG4gICAgXG4gICAgY29uc3QgaW5zdGFuY2VDb3VudCA9IGNvbmZpZy5lbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gMyA6IDE7XG5cbiAgICB0aGlzLnNlYXJjaERvbWFpbiA9IG5ldyBvcGVuc2VhcmNoLkNmbkNvbGxlY3Rpb24odGhpcywgJ1NlYXJjaERvbWFpbicsIHtcbiAgICAgIG5hbWU6IGRvbWFpbk5hbWUsXG4gICAgICB0eXBlOiAnVkVDVE9SU0VBUkNIJyxcbiAgICAgIGRlc2NyaXB0aW9uOiBgT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIGNvbGxlY3Rpb24gZm9yICR7Y29uZmlnLnByb2plY3ROYW1lfWBcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUzNCdWNrZXRzKGNvbmZpZzogR2xvYmFsUmFnQ29uZmlnKTogdm9pZCB7XG4gICAgLy8gRG9jdW1lbnRzIHN0b3JhZ2UgYnVja2V0XG4gICAgdGhpcy5kb2N1bWVudHNCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdEb2N1bWVudHNCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgJHtjb25maWcucHJvamVjdE5hbWV9LWRvY3VtZW50cy0ke2NvbmZpZy5lbnZpcm9ubWVudH0tJHtjb25maWcucmVnaW9ufWAsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY29uZmlnLmVudmlyb25tZW50ID09PSAncHJvZCcgPyBSZW1vdmFsUG9saWN5LlJFVEFJTiA6IFJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiBjb25maWcuZW52aXJvbm1lbnQgIT09ICdwcm9kJ1xuICAgIH0pO1xuXG4gICAgLy8gTGlmZWN5Y2xlIHJ1bGVzIGZvciBjb3N0IG9wdGltaXphdGlvblxuICAgIGlmIChjb25maWcuZmVhdHVyZXMuc3RvcmFnZS5saWZlY3ljbGUpIHtcbiAgICAgIHRoaXMuZG9jdW1lbnRzQnVja2V0LmFkZExpZmVjeWNsZVJ1bGUoe1xuICAgICAgICBpZDogJ1RyYW5zaXRpb25Ub0lBJyxcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5JTkZSRVFVRU5UX0FDQ0VTUyxcbiAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogRHVyYXRpb24uZGF5cygzMClcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLkdMQUNJRVIsXG4gICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IER1cmF0aW9uLmRheXMoOTApXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5ERUVQX0FSQ0hJVkUsXG4gICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IER1cmF0aW9uLmRheXMoMzY1KVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG5cbiAgICAgIC8vIERlbGV0ZSBvbGQgdmVyc2lvbnNcbiAgICAgIHRoaXMuZG9jdW1lbnRzQnVja2V0LmFkZExpZmVjeWNsZVJ1bGUoe1xuICAgICAgICBpZDogJ0RlbGV0ZU9sZFZlcnNpb25zJyxcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiBEdXJhdGlvbi5kYXlzKDM2NSlcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQmFja3VwQ29uZmlndXJhdGlvbihjb25maWc6IEdsb2JhbFJhZ0NvbmZpZyk6IHZvaWQge1xuICAgIC8vIENyZWF0ZSBiYWNrdXAgdmF1bHRcbiAgICB0aGlzLmJhY2t1cFZhdWx0ID0gbmV3IGJhY2t1cC5CYWNrdXBWYXVsdCh0aGlzLCAnQmFja3VwVmF1bHQnLCB7XG4gICAgICBiYWNrdXBWYXVsdE5hbWU6IGAke2NvbmZpZy5wcm9qZWN0TmFtZX0tYmFja3VwLXZhdWx0LSR7Y29uZmlnLmVudmlyb25tZW50fWAsXG4gICAgICBlbmNyeXB0aW9uS2V5OiB1bmRlZmluZWQsIC8vIFVzZSBkZWZhdWx0IEFXUyBtYW5hZ2VkIGtleVxuICAgICAgcmVtb3ZhbFBvbGljeTogY29uZmlnLmVudmlyb25tZW50ID09PSAncHJvZCcgPyBSZW1vdmFsUG9saWN5LlJFVEFJTiA6IFJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGJhY2t1cCBwbGFuXG4gICAgY29uc3QgYmFja3VwUGxhbiA9IG5ldyBiYWNrdXAuQmFja3VwUGxhbih0aGlzLCAnQmFja3VwUGxhbicsIHtcbiAgICAgIGJhY2t1cFBsYW5OYW1lOiBgJHtjb25maWcucHJvamVjdE5hbWV9LWJhY2t1cC1wbGFuLSR7Y29uZmlnLmVudmlyb25tZW50fWAsXG4gICAgICBiYWNrdXBWYXVsdDogdGhpcy5iYWNrdXBWYXVsdFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGJhY2t1cCBydWxlcyBiYXNlZCBvbiBlbnZpcm9ubWVudFxuICAgIGlmIChjb25maWcuZW52aXJvbm1lbnQgPT09ICdwcm9kJykge1xuICAgICAgLy8gUHJvZHVjdGlvbjogRGFpbHkgYmFja3VwcyB3aXRoIGxvbmcgcmV0ZW50aW9uXG4gICAgICBiYWNrdXBQbGFuLmFkZFJ1bGUobmV3IGJhY2t1cC5CYWNrdXBQbGFuUnVsZSh7XG4gICAgICAgIHJ1bGVOYW1lOiAnRGFpbHlCYWNrdXBzJyxcbiAgICAgICAgc2NoZWR1bGVFeHByZXNzaW9uOiBldmVudHMuU2NoZWR1bGUuY3Jvbih7XG4gICAgICAgICAgaG91cjogJzInLFxuICAgICAgICAgIG1pbnV0ZTogJzAnXG4gICAgICAgIH0pLFxuICAgICAgICBkZWxldGVBZnRlcjogRHVyYXRpb24uZGF5cygzNjUpLFxuICAgICAgICBtb3ZlVG9Db2xkU3RvcmFnZUFmdGVyOiBEdXJhdGlvbi5kYXlzKDMwKVxuICAgICAgfSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb24tcHJvZHVjdGlvbjogV2Vla2x5IGJhY2t1cHMgd2l0aCBzaG9ydGVyIHJldGVudGlvblxuICAgICAgYmFja3VwUGxhbi5hZGRSdWxlKG5ldyBiYWNrdXAuQmFja3VwUGxhblJ1bGUoe1xuICAgICAgICBydWxlTmFtZTogJ1dlZWtseUJhY2t1cHMnLFxuICAgICAgICBzY2hlZHVsZUV4cHJlc3Npb246IGV2ZW50cy5TY2hlZHVsZS5jcm9uKHtcbiAgICAgICAgICB3ZWVrRGF5OiAnMScsXG4gICAgICAgICAgaG91cjogJzInLFxuICAgICAgICAgIG1pbnV0ZTogJzAnXG4gICAgICAgIH0pLFxuICAgICAgICBkZWxldGVBZnRlcjogRHVyYXRpb24uZGF5cygzMClcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYmFja3VwIHNlbGVjdGlvbiBmb3IgRHluYW1vREIgdGFibGVzXG4gICAgaWYgKHRoaXMuZG9jdW1lbnRzVGFibGUgfHwgdGhpcy5lbWJlZGRpbmdzVGFibGUpIHtcbiAgICAgIG5ldyBiYWNrdXAuQmFja3VwU2VsZWN0aW9uKHRoaXMsICdCYWNrdXBTZWxlY3Rpb24nLCB7XG4gICAgICAgIGJhY2t1cFBsYW4sXG4gICAgICAgIHNlbGVjdGlvbk5hbWU6ICdEeW5hbW9EQkJhY2t1cCcsXG4gICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgIC4uLih0aGlzLmRvY3VtZW50c1RhYmxlID8gW2JhY2t1cC5CYWNrdXBSZXNvdXJjZS5mcm9tRHluYW1vRGJUYWJsZSh0aGlzLmRvY3VtZW50c1RhYmxlKV0gOiBbXSksXG4gICAgICAgICAgLi4uKHRoaXMuZW1iZWRkaW5nc1RhYmxlID8gW2JhY2t1cC5CYWNrdXBSZXNvdXJjZS5mcm9tRHluYW1vRGJUYWJsZSh0aGlzLmVtYmVkZGluZ3NUYWJsZSldIDogW10pXG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufSJdfQ==