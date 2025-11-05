/**
 * DataStack - 統合データスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合ストレージ・データベースコンストラクトによる一元管理
 * - S3・FSx・DynamoDB・OpenSearchの統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
 */
import * as cdk from 'aws-cdk-lib';
import { StorageConstruct } from '../../modules/storage/constructs/storage-construct';
import { DatabaseConstruct } from '../../modules/database/constructs/database-construct';
import { SecurityStack } from './security-stack';
export interface DataStackProps extends cdk.StackProps {
    readonly config: any;
    readonly securityStack?: SecurityStack;
    readonly namingGenerator?: any;
}
/**
 * 統合データスタック（モジュラーアーキテクチャ対応）
 *
 * 統合ストレージ・データベースコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
export declare class DataStack extends cdk.Stack {
    /** 統合ストレージコンストラクト */
    readonly storage: StorageConstruct;
    /** 統合データベースコンストラクト */
    readonly database: DatabaseConstruct;
    /** S3バケット名（他スタックからの参照用） */
    readonly s3BucketNames: {
        [key: string]: string;
    };
    /** DynamoDBテーブル名（他スタックからの参照用） */
    readonly dynamoDbTableNames: {
        [key: string]: string;
    };
    /** OpenSearchドメインエンドポイント（他スタックからの参照用） */
    readonly openSearchEndpoint?: string;
    /**
     * 他スタックからの参照用プロパティ設定
     */
    private setupCrossStackReferences;
    /** FSx for NetApp ONTAPコンストラクト */
    readonly fsx: FsxConstruct;
    /** EFSコンストラクト */
    readonly efs: EfsConstruct;
    /** DynamoDBコンストラクト */
    readonly dynamoDb: DynamoDbConstruct;
    /** OpenSearchコンストラクト */
    readonly openSearch: OpenSearchConstruct;
    /** RDSコンストラクト */
    readonly rds: RdsConstruct;
}
