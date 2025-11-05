/**
 * データベースコンストラクト
 *
 * DynamoDB、OpenSearch、SQLite UPSERT Managerの統合管理を提供
 */
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { DatabaseConfig, DatabaseOutputs } from '../interfaces/database-config';
export interface DatabaseConstructProps {
    config: DatabaseConfig;
    projectName: string;
    environment: string;
    vpc?: ec2.IVpc;
    kmsKey?: kms.IKey;
    privateSubnetIds?: string[];
}
export declare class DatabaseConstruct extends Construct {
    private props;
    readonly outputs: DatabaseOutputs;
    sessionTable?: dynamodb.Table;
    openSearchCollection?: opensearch.CfnCollection;
    constructor(scope: Construct, id: string, props: DatabaseConstructProps);
    /**
     * DynamoDBリソース作成
     */
    private createDynamoDBResources;
    /**
     * DynamoDBテーブル作成ヘルパー
     */
    private createDynamoDBTable;
    /**
     * OpenSearchリソース作成
     */
    private createOpenSearchResources;
    /**
     * DynamoDB属性タイプ変換
     */
    private getDynamoDBAttributeType;
    /**
     * DynamoDBストリームビュータイプ変換
     */
    private getDynamoDBStreamViewType;
    /**
     * 出力値作成
     */
    private createOutputs;
    /**
     * タグ適用
     */
    private applyTags;
}
