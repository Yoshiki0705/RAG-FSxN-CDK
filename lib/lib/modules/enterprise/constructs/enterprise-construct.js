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
    constructor(scope, id, config) {
        super(scope, id);
        /** IAMロール */
        this.roles = {};
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
