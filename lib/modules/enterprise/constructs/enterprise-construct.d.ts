import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { EnterpriseConfig } from '../interfaces/enterprise-config';
/**
 * エンタープライズ機能統合コンストラクト
 */
export declare class EnterpriseConstruct extends Construct {
    /** アクセス制御テーブル */
    readonly accessControlTable?: dynamodb.Table;
    /** 組織管理テーブル */
    readonly organizationTable?: dynamodb.Table;
    /** 監査ログテーブル */
    readonly auditLogTable?: dynamodb.Table;
    /** BI用データバケット */
    readonly biDataBucket?: s3.Bucket;
    /** IAMロール */
    readonly roles: {
        [key: string]: iam.Role;
    };
    constructor(scope: Construct, id: string, config: EnterpriseConfig);
    /**
     * アクセス制御テーブルの作成
     */
    private createAccessControlTable;
    /**
     * 組織管理テーブルの作成
     */
    private createOrganizationTable;
    /**
     * 監査ログテーブルの作成
     */
    private createAuditLogTable;
    /**
     * BI用データバケットの作成
     */
    private createBIDataBucket;
    /**
     * アクセス制御用IAMロールの作成
     */
    private createAccessControlRoles;
}
