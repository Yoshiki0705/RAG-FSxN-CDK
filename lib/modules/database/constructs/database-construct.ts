/**
 * データベースコンストラクト
 * 
 * DynamoDB、OpenSearch、SQLite UPSERT Managerの統合管理を提供
 */

import * as cdk from 'aws-cdk-lib';
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

export class DatabaseConstruct extends Construct {
  public readonly outputs: DatabaseOutputs;
  public sessionTable?: dynamodb.Table;
  public openSearchCollection?: opensearch.CfnCollection;

  constructor(scope: Construct, id: string, private props: DatabaseConstructProps) {
    super(scope, id);

    // DynamoDBテーブル作成
    this.createDynamoDBResources();

    // OpenSearchリソース作成
    if (this.props.config.openSearch.enabled) {
      this.createOpenSearchResources();
    }

    // 出力値の設定
    this.outputs = this.createOutputs();

    // タグ設定
    this.applyTags();
  }

  /**
   * DynamoDBリソース作成
   */
  private createDynamoDBResources(): void {
    // セッションテーブル
    if (this.props.config.dynamodb.tables.session.enabled) {
      this.sessionTable = this.createDynamoDBTable(
        'SessionTable',
        this.props.config.dynamodb.tables.session
      );
    }
  }

  /**
   * DynamoDBテーブル作成ヘルパー
   */
  private createDynamoDBTable(
    id: string,
    config: any
  ): dynamodb.Table {
    const tableProps: any = {
      tableName: config.tableName,
      partitionKey: {
        name: config.partitionKey.name,
        type: this.getDynamoDBAttributeType(config.partitionKey.type),
      },
      billingMode: config.billingMode === 'PROVISIONED'
        ? dynamodb.BillingMode.PROVISIONED
        : dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: config.pointInTimeRecovery,
      stream: config.enableStreams
        ? this.getDynamoDBStreamViewType(config.streamViewType || 'NEW_AND_OLD_IMAGES')
        : undefined,
      encryption: this.props.config.dynamodb.encryption.enabled
        ? (this.props.kmsKey
            ? dynamodb.TableEncryption.CUSTOMER_MANAGED
            : dynamodb.TableEncryption.AWS_MANAGED)
        : dynamodb.TableEncryption.DEFAULT,
      encryptionKey: this.props.config.dynamodb.encryption.enabled ? this.props.kmsKey : undefined,
      removalPolicy: this.props.environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    };

    // ソートキーの設定
    if (config.sortKey) {
      tableProps.sortKey = {
        name: config.sortKey.name,
        type: this.getDynamoDBAttributeType(config.sortKey.type),
      };
    }

    // プロビジョニング設定
    if (config.billingMode === 'PROVISIONED') {
      tableProps.readCapacity = config.readCapacity || 5;
      tableProps.writeCapacity = config.writeCapacity || 5;
    }

    const table = new dynamodb.Table(this, id, tableProps);
    return table;
  }

  /**
   * OpenSearchリソース作成
   */
  private createOpenSearchResources(): void {
    const config = this.props.config.openSearch;

    // OpenSearch Serverless Collection作成
    this.openSearchCollection = new opensearch.CfnCollection(this, 'OpenSearchCollection', {
      name: config.collectionName || `${this.props.projectName}-${this.props.environment}-search`,
      type: config.collectionType,
      description: `OpenSearch collection for ${this.props.projectName}`,
      tags: [{
        key: 'Name',
        value: config.collectionName || `${this.props.projectName}-${this.props.environment}-search`,
      }],
    });

    // セキュリティポリシー作成
    new opensearch.CfnSecurityPolicy(this, 'OpenSearchSecurityPolicy', {
      name: `${this.props.projectName}-${this.props.environment}-security-policy`,
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [{
          ResourceType: 'collection',
          Resource: [`collection/${this.openSearchCollection.name}`],
        }],
        AWSOwnedKey: !config.encryption.atRest,
        KmsARN: config.encryption.atRest && this.props.kmsKey ? this.props.kmsKey.keyArn : undefined,
      }),
    });
  }

  /**
   * DynamoDB属性タイプ変換
   */
  private getDynamoDBAttributeType(type: string): dynamodb.AttributeType {
    switch (type) {
      case 'STRING':
        return dynamodb.AttributeType.STRING;
      case 'NUMBER':
        return dynamodb.AttributeType.NUMBER;
      case 'BINARY':
        return dynamodb.AttributeType.BINARY;
      default:
        return dynamodb.AttributeType.STRING;
    }
  }

  /**
   * DynamoDBストリームビュータイプ変換
   */
  private getDynamoDBStreamViewType(type: string): dynamodb.StreamViewType {
    switch (type) {
      case 'KEYS_ONLY':
        return dynamodb.StreamViewType.KEYS_ONLY;
      case 'NEW_IMAGE':
        return dynamodb.StreamViewType.NEW_IMAGE;
      case 'OLD_IMAGE':
        return dynamodb.StreamViewType.OLD_IMAGE;
      case 'NEW_AND_OLD_IMAGES':
        return dynamodb.StreamViewType.NEW_AND_OLD_IMAGES;
      default:
        return dynamodb.StreamViewType.NEW_AND_OLD_IMAGES;
    }
  }

  /**
   * 出力値作成
   */
  private createOutputs(): DatabaseOutputs {
    return {
      // DynamoDB出力
      sessionTableName: this.sessionTable?.tableName,
      sessionTableArn: this.sessionTable?.tableArn,

      // OpenSearch出力
      openSearchCollectionId: this.openSearchCollection?.attrId,
      openSearchCollectionArn: this.openSearchCollection?.attrArn,
      openSearchEndpoint: this.openSearchCollection?.attrCollectionEndpoint,

      // SQLite UPSERT Manager出力（将来実装）
      sqliteDatabasePath: this.props.config.sqliteUpsertManager.databasePath,
      sqliteBackupLocation: undefined,
    };
  }

  /**
   * タグ適用
   */
  private applyTags(): void {
    const tags = this.props.config.tags;

    cdk.Tags.of(this).add('DatabaseType', tags.DatabaseType);
    cdk.Tags.of(this).add('BackupEnabled', tags.BackupEnabled.toString());
    cdk.Tags.of(this).add('EncryptionEnabled', tags.EncryptionEnabled.toString());

    if (tags.DataClassification) {
      cdk.Tags.of(this).add('DataClassification', tags.DataClassification);
    }

    if (tags.RetentionPeriod) {
      cdk.Tags.of(this).add('RetentionPeriod', tags.RetentionPeriod);
    }

    if (tags.PerformanceTier) {
      cdk.Tags.of(this).add('PerformanceTier', tags.PerformanceTier);
    }
  }
}