import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { EnterpriseConfig } from '../interfaces/enterprise-config';

/**
 * エンタープライズ機能統合コンストラクト
 */
export class EnterpriseConstruct extends Construct {
  /** アクセス制御テーブル */
  public readonly accessControlTable?: dynamodb.Table;
  /** 組織管理テーブル */
  public readonly organizationTable?: dynamodb.Table;
  /** 監査ログテーブル */
  public readonly auditLogTable?: dynamodb.Table;
  /** BI用データバケット */
  public readonly biDataBucket?: s3.Bucket;
  /** IAMロール */
  public readonly roles: { [key: string]: iam.Role } = {};

  constructor(scope: Construct, id: string, config: EnterpriseConfig) {
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
  private createAccessControlTable(): dynamodb.Table {
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
      removalPolicy: RemovalPolicy.DESTROY,
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
  private createOrganizationTable(): dynamodb.Table {
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
      removalPolicy: RemovalPolicy.DESTROY,
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
  private createAuditLogTable(): dynamodb.Table {
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
      removalPolicy: RemovalPolicy.DESTROY,
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
  private createBIDataBucket(): s3.Bucket {
    return new s3.Bucket(this, 'BIDataBucket', {
      bucketName: 'rag-bi-data-bucket',
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(30),
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
          ],
        },
      ],
    });
  }

  /**
   * アクセス制御用IAMロールの作成
   */
  private createAccessControlRoles(config: EnterpriseConfig): void {
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