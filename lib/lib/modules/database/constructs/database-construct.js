"use strict";
/**
 * データベースコンストラクト
 *
 * DynamoDB、OpenSearch、SQLite UPSERT Managerの統合管理を提供
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
exports.DatabaseConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const opensearch = __importStar(require("aws-cdk-lib/aws-opensearchserverless"));
const constructs_1 = require("constructs");
class DatabaseConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
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
    createDynamoDBResources() {
        // セッションテーブル
        if (this.props.config.dynamodb.tables.session.enabled) {
            this.sessionTable = this.createDynamoDBTable('SessionTable', this.props.config.dynamodb.tables.session);
        }
    }
    /**
     * DynamoDBテーブル作成ヘルパー
     */
    createDynamoDBTable(id, config) {
        const tableProps = {
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
    createOpenSearchResources() {
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
    getDynamoDBAttributeType(type) {
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
    getDynamoDBStreamViewType(type) {
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
    createOutputs() {
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
    applyTags() {
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
exports.DatabaseConstruct = DatabaseConstruct;
