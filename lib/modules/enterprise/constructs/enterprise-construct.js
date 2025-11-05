"use strict";
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
exports.EnterpriseConstruct = void 0;
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
/**
 * エンタープライズ機能統合コンストラクト
 */
class EnterpriseConstruct extends constructs_1.Construct {
    /** アクセス制御テーブル */
    accessControlTable;
    /** 組織管理テーブル */
    organizationTable;
    /** 監査ログテーブル */
    auditLogTable;
    /** BI用データバケット */
    biDataBucket;
    /** IAMロール */
    roles = {};
    constructor(scope, id, config) {
        super(scope, id);
        // アクセス制御機能
        if (config.features.enableAccessControl) {
            this.accessControlTable = this.createAccessControlTable();
            this.createAccessControlRoles(config);
        }
        // 組織管理機能
        if (config.features.enableOrganizationManagement) {
            this.organizationTable = this.createOrganizationTable();
        }
        // 監査ログ機能
        if (config.features.enableAuditLogging) {
            this.auditLogTable = this.createAuditLogTable();
        }
        // BI機能
        if (config.features.enableBusinessIntelligence) {
            this.biDataBucket = this.createBIDataBucket();
        }
    }
    /**
     * アクセス制御テーブルの作成
     */
    createAccessControlTable() {
        const table = new dynamodb.Table(this, 'AccessControlTable', {
            tableName: 'rag-access-control',
            partitionKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'resourceId',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        });
        // GSIを個別に追加
        table.addGlobalSecondaryIndex({
            indexName: 'ResourceIndex',
            partitionKey: {
                name: 'resourceId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING,
            },
        });
        table.addGlobalSecondaryIndex({
            indexName: 'RoleIndex',
            partitionKey: {
                name: 'role',
                type: dynamodb.AttributeType.STRING,
            },
        });
        return table;
    }
    /**
     * 組織管理テーブルの作成
     */
    createOrganizationTable() {
        const table = new dynamodb.Table(this, 'OrganizationTable', {
            tableName: 'rag-organization',
            partitionKey: {
                name: 'tenantId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'organizationId',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        });
        // GSIを個別に追加
        table.addGlobalSecondaryIndex({
            indexName: 'HierarchyIndex',
            partitionKey: {
                name: 'parentOrganizationId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'organizationId',
                type: dynamodb.AttributeType.STRING,
            },
        });
        return table;
    }
    /**
     * 監査ログテーブルの作成
     */
    createAuditLogTable() {
        const table = new dynamodb.Table(this, 'AuditLogTable', {
            tableName: 'rag-audit-log',
            partitionKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'eventId',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            timeToLiveAttribute: 'ttl',
        });
        // GSIを個別に追加
        table.addGlobalSecondaryIndex({
            indexName: 'UserIndex',
            partitionKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.STRING,
            },
        });
        table.addGlobalSecondaryIndex({
            indexName: 'ActionIndex',
            partitionKey: {
                name: 'action',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.STRING,
            },
        });
        return table;
    }
    /**
     * BI用データバケットの作成
     */
    createBIDataBucket() {
        return new s3.Bucket(this, 'BIDataBucket', {
            bucketName: 'rag-bi-data-bucket',
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            lifecycleRules: [
                {
                    id: 'DeleteOldVersions',
                    enabled: true,
                    noncurrentVersionExpiration: aws_cdk_lib_1.Duration.days(30),
                },
                {
                    id: 'TransitionToIA',
                    enabled: true,
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: aws_cdk_lib_1.Duration.days(30),
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: aws_cdk_lib_1.Duration.days(90),
                        },
                    ],
                },
            ],
        });
    }
    /**
     * アクセス制御用IAMロールの作成
     */
    createAccessControlRoles(config) {
        // 管理者ロール
        this.roles.admin = new iam.Role(this, 'AdminRole', {
            roleName: 'rag-admin-role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
            inlinePolicies: {
                AdminPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'dynamodb:*',
                                's3:*',
                                'cognito-idp:*',
                            ],
                            resources: ['*'],
                        }),
                    ],
                }),
            },
        });
        // 一般ユーザーロール
        this.roles.user = new iam.Role(this, 'UserRole', {
            roleName: 'rag-user-role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
            inlinePolicies: {
                UserPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'dynamodb:GetItem',
                                'dynamodb:PutItem',
                                'dynamodb:UpdateItem',
                                'dynamodb:Query',
                            ],
                            resources: [
                                this.accessControlTable?.tableArn || '*',
                            ],
                        }),
                    ],
                }),
            },
        });
        // 読み取り専用ロール
        this.roles.readonly = new iam.Role(this, 'ReadOnlyRole', {
            roleName: 'rag-readonly-role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
            inlinePolicies: {
                ReadOnlyPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'dynamodb:GetItem',
                                'dynamodb:Query',
                                's3:GetObject',
                            ],
                            resources: ['*'],
                        }),
                    ],
                }),
            },
        });
    }
}
exports.EnterpriseConstruct = EnterpriseConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50ZXJwcmlzZS1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbnRlcnByaXNlLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUF1QztBQUN2Qyw2Q0FBc0Q7QUFDdEQseURBQTJDO0FBQzNDLG1FQUFxRDtBQUlyRCx1REFBeUM7QUFHekM7O0dBRUc7QUFDSCxNQUFhLG1CQUFvQixTQUFRLHNCQUFTO0lBQ2hELGlCQUFpQjtJQUNELGtCQUFrQixDQUFrQjtJQUNwRCxlQUFlO0lBQ0MsaUJBQWlCLENBQWtCO0lBQ25ELGVBQWU7SUFDQyxhQUFhLENBQWtCO0lBQy9DLGlCQUFpQjtJQUNELFlBQVksQ0FBYTtJQUN6QyxhQUFhO0lBQ0csS0FBSyxHQUFnQyxFQUFFLENBQUM7SUFFeEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxNQUF3QjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLFdBQVc7UUFDWCxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDMUQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFRCxTQUFTO1FBQ1QsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDakQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQzFELENBQUM7UUFFRCxTQUFTO1FBQ1QsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUNsRCxDQUFDO1FBRUQs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c0IsQ0FBQztZQUMzRCxlQUFlLEVBQUU7Z0JBQ2YsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQywwQ0FBMEMsQ0FBQzthQUN2RjtZQUNELGNBQWMsRUFBRTtnQkFDZCxjQUFjLEVBQUUsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDO29CQUNyQyxVQUFVLEVBQUU7d0JBQ1YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDOzRCQUN0QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLOzRCQUN4QixPQUFPLEVBQUU7Z0NBQ1Asa0JBQWtCO2dDQUNsQixnQkFBZ0I7Z0NBQ2hCLGNBQWM7NkJBQ2Y7NEJBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO3lCQUNqQixDQUFDO3FCQUNIO2lCQUNGLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXBSRCxrREFvUkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IER1cmF0aW9uLCBSZW1vdmFsUG9saWN5IH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzJztcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgeyBFbnRlcnByaXNlQ29uZmlnIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9lbnRlcnByaXNlLWNvbmZpZyc7XG5cbi8qKlxuICog44Ko44Oz44K/44O844OX44Op44Kk44K65qmf6IO957Wx5ZCI44Kz44Oz44K544OI44Op44Kv44OIXG4gKi9cbmV4cG9ydCBjbGFzcyBFbnRlcnByaXNlQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgLyoqIOOCouOCr+OCu+OCueWItuW+oeODhuODvOODluODqyAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYWNjZXNzQ29udHJvbFRhYmxlPzogZHluYW1vZGIuVGFibGU7XG4gIC8qKiDntYTnuZTnrqHnkIbjg4bjg7zjg5bjg6sgKi9cbiAgcHVibGljIHJlYWRvbmx5IG9yZ2FuaXphdGlvblRhYmxlPzogZHluYW1vZGIuVGFibGU7XG4gIC8qKiDnm6Pmn7vjg63jgrDjg4bjg7zjg5bjg6sgKi9cbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0TG9nVGFibGU/OiBkeW5hbW9kYi5UYWJsZTtcbiAgLyoqIEJJ55So44OH44O844K/44OQ44Kx44OD44OIICovXG4gIHB1YmxpYyByZWFkb25seSBiaURhdGFCdWNrZXQ/OiBzMy5CdWNrZXQ7XG4gIC8qKiBJQU3jg63jg7zjg6sgKi9cbiAgcHVibGljIHJlYWRvbmx5IHJvbGVzOiB7IFtrZXk6IHN0cmluZ106IGlhbS5Sb2xlIH0gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBjb25maWc6IEVudGVycHJpc2VDb25maWcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8g44Ki44Kv44K744K55Yi25b6h5qmf6IO9XG4gICAgaWYgKGNvbmZpZy5mZWF0dXJlcy5lbmFibGVBY2Nlc3NDb250cm9sKSB7XG4gICAgICB0aGlzLmFjY2Vzc0NvbnRyb2xUYWJsZSA9IHRoaXMuY3JlYXRlQWNjZXNzQ29udHJvbFRhYmxlKCk7XG4gICAgICB0aGlzLmNyZWF0ZUFjY2Vzc0NvbnRyb2xSb2xlcyhjb25maWcpO1xuICAgIH1cblxuICAgIC8vIOe1hOe5lOeuoeeQhuapn+iDvVxuICAgIGlmIChjb25maWcuZmVhdHVyZXMuZW5hYmxlT3JnYW5pemF0aW9uTWFuYWdlbWVudCkge1xuICAgICAgdGhpcy5vcmdhbml6YXRpb25UYWJsZSA9IHRoaXMuY3JlYXRlT3JnYW5pemF0aW9uVGFibGUoKTtcbiAgICB9XG5cbiAgICAvLyDnm6Pmn7vjg63jgrDmqZ/og71cbiAgICBpZiAoY29uZmlnLmZlYXR1cmVzLmVuYWJsZUF1ZGl0TG9nZ2luZykge1xuICAgICAgdGhpcy5hdWRpdExvZ1RhYmxlID0gdGhpcy5jcmVhdGVBdWRpdExvZ1RhYmxlKCk7XG4gICAgfVxuXG4gICAgLy8gQknmqZ/og71cbiAgICBpZiAoY29uZmlnLmZlYXR1cmVzLmVuYWJsZUJ1c2luZXNzSW50ZWxsaWdlbmNlKSB7XG4gICAgICB0aGlzLmJpRGF0YUJ1Y2tldCA9IHRoaXMuY3JlYXRlQklEYXRhQnVja2V0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOOCouOCr+OCu+OCueWItuW+oeODhuODvOODluODq+OBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBY2Nlc3NDb250cm9sVGFibGUoKTogZHluYW1vZGIuVGFibGUge1xuICAgIGNvbnN0IHRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdBY2Nlc3NDb250cm9sVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6ICdyYWctYWNjZXNzLWNvbnRyb2wnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICd1c2VySWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdyZXNvdXJjZUlkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBHU0njgpLlgIvliKXjgavov73liqBcbiAgICB0YWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdSZXNvdXJjZUluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAncmVzb3VyY2VJZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ3VzZXJJZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ1JvbGVJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ3JvbGUnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGFibGU7XG4gIH1cblxuICAvKipcbiAgICog57WE57mU566h55CG44OG44O844OW44Or44Gu5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU9yZ2FuaXphdGlvblRhYmxlKCk6IGR5bmFtb2RiLlRhYmxlIHtcbiAgICBjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnT3JnYW5pemF0aW9uVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6ICdyYWctb3JnYW5pemF0aW9uJyxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAndGVuYW50SWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdvcmdhbml6YXRpb25JZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gR1NJ44KS5YCL5Yil44Gr6L+95YqgXG4gICAgdGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnSGllcmFyY2h5SW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdwYXJlbnRPcmdhbml6YXRpb25JZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ29yZ2FuaXphdGlvbklkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIOebo+afu+ODreOCsOODhuODvOODluODq+OBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBdWRpdExvZ1RhYmxlKCk6IGR5bmFtb2RiLlRhYmxlIHtcbiAgICBjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQXVkaXRMb2dUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogJ3JhZy1hdWRpdC1sb2cnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICd0aW1lc3RhbXAnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdldmVudElkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJyxcbiAgICB9KTtcblxuICAgIC8vIEdTSeOCkuWAi+WIpeOBq+i/veWKoFxuICAgIHRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ1VzZXJJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ3VzZXJJZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ3RpbWVzdGFtcCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ0FjdGlvbkluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnYWN0aW9uJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAndGltZXN0YW1wJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEJJ55So44OH44O844K/44OQ44Kx44OD44OI44Gu5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUJJRGF0YUJ1Y2tldCgpOiBzMy5CdWNrZXQge1xuICAgIHJldHVybiBuZXcgczMuQnVja2V0KHRoaXMsICdCSURhdGFCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiAncmFnLWJpLWRhdGEtYnVja2V0JyxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdEZWxldGVPbGRWZXJzaW9ucycsXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb246IER1cmF0aW9uLmRheXMoMzApLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdUcmFuc2l0aW9uVG9JQScsXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5JTkZSRVFVRU5UX0FDQ0VTUyxcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBEdXJhdGlvbi5kYXlzKDMwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLkdMQUNJRVIsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogRHVyYXRpb24uZGF5cyg5MCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCouOCr+OCu+OCueWItuW+oeeUqElBTeODreODvOODq+OBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBY2Nlc3NDb250cm9sUm9sZXMoY29uZmlnOiBFbnRlcnByaXNlQ29uZmlnKTogdm9pZCB7XG4gICAgLy8g566h55CG6ICF44Ot44O844OrXG4gICAgdGhpcy5yb2xlcy5hZG1pbiA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQWRtaW5Sb2xlJywge1xuICAgICAgcm9sZU5hbWU6ICdyYWctYWRtaW4tcm9sZScsXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICAgIF0sXG4gICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICBBZG1pblBvbGljeTogbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XG4gICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6KicsXG4gICAgICAgICAgICAgICAgJ3MzOionLFxuICAgICAgICAgICAgICAgICdjb2duaXRvLWlkcDoqJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIOS4gOiIrOODpuODvOOCtuODvOODreODvOODq1xuICAgIHRoaXMucm9sZXMudXNlciA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnVXNlclJvbGUnLCB7XG4gICAgICByb2xlTmFtZTogJ3JhZy11c2VyLXJvbGUnLFxuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyksXG4gICAgICBdLFxuICAgICAgaW5saW5lUG9saWNpZXM6IHtcbiAgICAgICAgVXNlclBvbGljeTogbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XG4gICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6R2V0SXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlB1dEl0ZW0nLFxuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpVcGRhdGVJdGVtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6UXVlcnknLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICB0aGlzLmFjY2Vzc0NvbnRyb2xUYWJsZT8udGFibGVBcm4gfHwgJyonLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8g6Kqt44G/5Y+W44KK5bCC55So44Ot44O844OrXG4gICAgdGhpcy5yb2xlcy5yZWFkb25seSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnUmVhZE9ubHlSb2xlJywge1xuICAgICAgcm9sZU5hbWU6ICdyYWctcmVhZG9ubHktcm9sZScsXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICAgIF0sXG4gICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICBSZWFkT25seVBvbGljeTogbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XG4gICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6R2V0SXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlF1ZXJ5JyxcbiAgICAgICAgICAgICAgICAnczM6R2V0T2JqZWN0JyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufSJdfQ==