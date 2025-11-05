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
    props;
    outputs;
    sessionTable;
    openSearchCollection;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UtY29uc3RydWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGF0YWJhc2UtY29uc3RydWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztHQUlHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUNuQyxtRUFBcUQ7QUFDckQsaUZBQW1FO0FBR25FLDJDQUF1QztBQVl2QyxNQUFhLGlCQUFrQixTQUFRLHNCQUFTO0lBS0k7SUFKbEMsT0FBTyxDQUFrQjtJQUNsQyxZQUFZLENBQWtCO0lBQzlCLG9CQUFvQixDQUE0QjtJQUV2RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFVLEtBQTZCO1FBQzdFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFEK0IsVUFBSyxHQUFMLEtBQUssQ0FBd0I7UUFHN0UsaUJBQWlCO1FBQ2pCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBRS9CLG1CQUFtQjtRQUNuQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN6QyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRUQsU0FBUztRQUNULElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXBDLE9BQU87UUFDUCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssdUJBQXVCO1FBQzdCLFlBQVk7UUFDWixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3RELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUMxQyxjQUFjLEVBQ2QsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQzFDLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0ssbUJBQW1CLENBQ3pCLEVBQVUsRUFDVixNQUFXO1FBRVgsTUFBTSxVQUFVLEdBQVE7WUFDdEIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO1lBQzNCLFlBQVksRUFBRTtnQkFDWixJQUFJLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJO2dCQUM5QixJQUFJLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO2FBQzlEO1lBQ0QsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEtBQUssYUFBYTtnQkFDL0MsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVztnQkFDbEMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUN4QyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsbUJBQW1CO1lBQy9DLE1BQU0sRUFBRSxNQUFNLENBQUMsYUFBYTtnQkFDMUIsQ0FBQyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsY0FBYyxJQUFJLG9CQUFvQixDQUFDO2dCQUMvRSxDQUFDLENBQUMsU0FBUztZQUNiLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU87Z0JBQ3ZELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtvQkFDaEIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCO29CQUMzQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUM7Z0JBQzNDLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU87WUFDcEMsYUFBYSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUztZQUM1RixhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEtBQUssTUFBTTtnQkFDOUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtnQkFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUM5QixDQUFDO1FBRUYsV0FBVztRQUNYLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25CLFVBQVUsQ0FBQyxPQUFPLEdBQUc7Z0JBQ25CLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUk7Z0JBQ3pCLElBQUksRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7YUFDekQsQ0FBQztRQUNKLENBQUM7UUFFRCxhQUFhO1FBQ2IsSUFBSSxNQUFNLENBQUMsV0FBVyxLQUFLLGFBQWEsRUFBRSxDQUFDO1lBQ3pDLFVBQVUsQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksSUFBSSxDQUFDLENBQUM7WUFDbkQsVUFBVSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQ7O09BRUc7SUFDSyx5QkFBeUI7UUFDL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBRTVDLHFDQUFxQztRQUNyQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUNyRixJQUFJLEVBQUUsTUFBTSxDQUFDLGNBQWMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxTQUFTO1lBQzNGLElBQUksRUFBRSxNQUFNLENBQUMsY0FBYztZQUMzQixXQUFXLEVBQUUsNkJBQTZCLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQ2xFLElBQUksRUFBRSxDQUFDO29CQUNMLEdBQUcsRUFBRSxNQUFNO29CQUNYLEtBQUssRUFBRSxNQUFNLENBQUMsY0FBYyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLFNBQVM7aUJBQzdGLENBQUM7U0FDSCxDQUFDLENBQUM7UUFFSCxlQUFlO1FBQ2YsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ2pFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxrQkFBa0I7WUFDM0UsSUFBSSxFQUFFLFlBQVk7WUFDbEIsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLEtBQUssRUFBRSxDQUFDO3dCQUNOLFlBQVksRUFBRSxZQUFZO3dCQUMxQixRQUFRLEVBQUUsQ0FBQyxjQUFjLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztxQkFDM0QsQ0FBQztnQkFDRixXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07Z0JBQ3RDLE1BQU0sRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQzdGLENBQUM7U0FDSCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSyx3QkFBd0IsQ0FBQyxJQUFZO1FBQzNDLFFBQVEsSUFBSSxFQUFFLENBQUM7WUFDYixLQUFLLFFBQVE7Z0JBQ1gsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUN2QyxLQUFLLFFBQVE7Z0JBQ1gsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUN2QyxLQUFLLFFBQVE7Z0JBQ1gsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUN2QztnQkFDRSxPQUFPLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO1FBQ3pDLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSyx5QkFBeUIsQ0FBQyxJQUFZO1FBQzVDLFFBQVEsSUFBSSxFQUFFLENBQUM7WUFDYixLQUFLLFdBQVc7Z0JBQ2QsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztZQUMzQyxLQUFLLFdBQVc7Z0JBQ2QsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztZQUMzQyxLQUFLLFdBQVc7Z0JBQ2QsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztZQUMzQyxLQUFLLG9CQUFvQjtnQkFDdkIsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDO1lBQ3BEO2dCQUNFLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQztRQUN0RCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0ssYUFBYTtRQUNuQixPQUFPO1lBQ0wsYUFBYTtZQUNiLGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsU0FBUztZQUM5QyxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxRQUFRO1lBRTVDLGVBQWU7WUFDZixzQkFBc0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsTUFBTTtZQUN6RCx1QkFBdUIsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsT0FBTztZQUMzRCxrQkFBa0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsc0JBQXNCO1lBRXJFLGdDQUFnQztZQUNoQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZO1lBQ3RFLG9CQUFvQixFQUFFLFNBQVM7U0FDaEMsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLFNBQVM7UUFDZixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFFcEMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDdEUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRTlFLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDNUIsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN6QixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN6QixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFqTUQsOENBaU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjg4fjg7zjgr/jg5njg7zjgrnjgrPjg7Pjgrnjg4jjg6njgq/jg4hcbiAqIFxuICogRHluYW1vRELjgIFPcGVuU2VhcmNo44CBU1FMaXRlIFVQU0VSVCBNYW5hZ2Vy44Gu57Wx5ZCI566h55CG44KS5o+Q5L6bXG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBvcGVuc2VhcmNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1vcGVuc2VhcmNoc2VydmVybGVzcyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBrbXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWttcyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IERhdGFiYXNlQ29uZmlnLCBEYXRhYmFzZU91dHB1dHMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RhdGFiYXNlLWNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YWJhc2VDb25zdHJ1Y3RQcm9wcyB7XG4gIGNvbmZpZzogRGF0YWJhc2VDb25maWc7XG4gIHByb2plY3ROYW1lOiBzdHJpbmc7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHZwYz86IGVjMi5JVnBjO1xuICBrbXNLZXk/OiBrbXMuSUtleTtcbiAgcHJpdmF0ZVN1Ym5ldElkcz86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY2xhc3MgRGF0YWJhc2VDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgb3V0cHV0czogRGF0YWJhc2VPdXRwdXRzO1xuICBwdWJsaWMgc2Vzc2lvblRhYmxlPzogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyBvcGVuU2VhcmNoQ29sbGVjdGlvbj86IG9wZW5zZWFyY2guQ2ZuQ29sbGVjdGlvbjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcml2YXRlIHByb3BzOiBEYXRhYmFzZUNvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIER5bmFtb0RC44OG44O844OW44Or5L2c5oiQXG4gICAgdGhpcy5jcmVhdGVEeW5hbW9EQlJlc291cmNlcygpO1xuXG4gICAgLy8gT3BlblNlYXJjaOODquOCveODvOOCueS9nOaIkFxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy5vcGVuU2VhcmNoLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlT3BlblNlYXJjaFJlc291cmNlcygpO1xuICAgIH1cblxuICAgIC8vIOWHuuWKm+WApOOBruioreWumlxuICAgIHRoaXMub3V0cHV0cyA9IHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgLy8g44K/44Kw6Kit5a6aXG4gICAgdGhpcy5hcHBseVRhZ3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEeW5hbW9EQuODquOCveODvOOCueS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVEeW5hbW9EQlJlc291cmNlcygpOiB2b2lkIHtcbiAgICAvLyDjgrvjg4Pjgrfjg6fjg7Pjg4bjg7zjg5bjg6tcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuZHluYW1vZGIudGFibGVzLnNlc3Npb24uZW5hYmxlZCkge1xuICAgICAgdGhpcy5zZXNzaW9uVGFibGUgPSB0aGlzLmNyZWF0ZUR5bmFtb0RCVGFibGUoXG4gICAgICAgICdTZXNzaW9uVGFibGUnLFxuICAgICAgICB0aGlzLnByb3BzLmNvbmZpZy5keW5hbW9kYi50YWJsZXMuc2Vzc2lvblxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHluYW1vRELjg4bjg7zjg5bjg6vkvZzmiJDjg5jjg6vjg5Hjg7xcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRHluYW1vREJUYWJsZShcbiAgICBpZDogc3RyaW5nLFxuICAgIGNvbmZpZzogYW55XG4gICk6IGR5bmFtb2RiLlRhYmxlIHtcbiAgICBjb25zdCB0YWJsZVByb3BzOiBhbnkgPSB7XG4gICAgICB0YWJsZU5hbWU6IGNvbmZpZy50YWJsZU5hbWUsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogY29uZmlnLnBhcnRpdGlvbktleS5uYW1lLFxuICAgICAgICB0eXBlOiB0aGlzLmdldER5bmFtb0RCQXR0cmlidXRlVHlwZShjb25maWcucGFydGl0aW9uS2V5LnR5cGUpLFxuICAgICAgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBjb25maWcuYmlsbGluZ01vZGUgPT09ICdQUk9WSVNJT05FRCdcbiAgICAgICAgPyBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QUk9WSVNJT05FRFxuICAgICAgICA6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IGNvbmZpZy5wb2ludEluVGltZVJlY292ZXJ5LFxuICAgICAgc3RyZWFtOiBjb25maWcuZW5hYmxlU3RyZWFtc1xuICAgICAgICA/IHRoaXMuZ2V0RHluYW1vREJTdHJlYW1WaWV3VHlwZShjb25maWcuc3RyZWFtVmlld1R5cGUgfHwgJ05FV19BTkRfT0xEX0lNQUdFUycpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgZW5jcnlwdGlvbjogdGhpcy5wcm9wcy5jb25maWcuZHluYW1vZGIuZW5jcnlwdGlvbi5lbmFibGVkXG4gICAgICAgID8gKHRoaXMucHJvcHMua21zS2V5XG4gICAgICAgICAgICA/IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VEXG4gICAgICAgICAgICA6IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5BV1NfTUFOQUdFRClcbiAgICAgICAgOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uREVGQVVMVCxcbiAgICAgIGVuY3J5cHRpb25LZXk6IHRoaXMucHJvcHMuY29uZmlnLmR5bmFtb2RiLmVuY3J5cHRpb24uZW5hYmxlZCA/IHRoaXMucHJvcHMua21zS2V5IDogdW5kZWZpbmVkLFxuICAgICAgcmVtb3ZhbFBvbGljeTogdGhpcy5wcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2QnXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9O1xuXG4gICAgLy8g44K944O844OI44Kt44O844Gu6Kit5a6aXG4gICAgaWYgKGNvbmZpZy5zb3J0S2V5KSB7XG4gICAgICB0YWJsZVByb3BzLnNvcnRLZXkgPSB7XG4gICAgICAgIG5hbWU6IGNvbmZpZy5zb3J0S2V5Lm5hbWUsXG4gICAgICAgIHR5cGU6IHRoaXMuZ2V0RHluYW1vREJBdHRyaWJ1dGVUeXBlKGNvbmZpZy5zb3J0S2V5LnR5cGUpLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDjg5fjg63jg5Pjgrjjg6fjg4vjg7PjgrDoqK3lrppcbiAgICBpZiAoY29uZmlnLmJpbGxpbmdNb2RlID09PSAnUFJPVklTSU9ORUQnKSB7XG4gICAgICB0YWJsZVByb3BzLnJlYWRDYXBhY2l0eSA9IGNvbmZpZy5yZWFkQ2FwYWNpdHkgfHwgNTtcbiAgICAgIHRhYmxlUHJvcHMud3JpdGVDYXBhY2l0eSA9IGNvbmZpZy53cml0ZUNhcGFjaXR5IHx8IDU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgaWQsIHRhYmxlUHJvcHMpO1xuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuU2VhcmNo44Oq44K944O844K55L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU9wZW5TZWFyY2hSZXNvdXJjZXMoKTogdm9pZCB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWcub3BlblNlYXJjaDtcblxuICAgIC8vIE9wZW5TZWFyY2ggU2VydmVybGVzcyBDb2xsZWN0aW9u5L2c5oiQXG4gICAgdGhpcy5vcGVuU2VhcmNoQ29sbGVjdGlvbiA9IG5ldyBvcGVuc2VhcmNoLkNmbkNvbGxlY3Rpb24odGhpcywgJ09wZW5TZWFyY2hDb2xsZWN0aW9uJywge1xuICAgICAgbmFtZTogY29uZmlnLmNvbGxlY3Rpb25OYW1lIHx8IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tc2VhcmNoYCxcbiAgICAgIHR5cGU6IGNvbmZpZy5jb2xsZWN0aW9uVHlwZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBgT3BlblNlYXJjaCBjb2xsZWN0aW9uIGZvciAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9YCxcbiAgICAgIHRhZ3M6IFt7XG4gICAgICAgIGtleTogJ05hbWUnLFxuICAgICAgICB2YWx1ZTogY29uZmlnLmNvbGxlY3Rpb25OYW1lIHx8IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tc2VhcmNoYCxcbiAgICAgIH1dLFxuICAgIH0pO1xuXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj44Od44Oq44K344O85L2c5oiQXG4gICAgbmV3IG9wZW5zZWFyY2guQ2ZuU2VjdXJpdHlQb2xpY3kodGhpcywgJ09wZW5TZWFyY2hTZWN1cml0eVBvbGljeScsIHtcbiAgICAgIG5hbWU6IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tc2VjdXJpdHktcG9saWN5YCxcbiAgICAgIHR5cGU6ICdlbmNyeXB0aW9uJyxcbiAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBSdWxlczogW3tcbiAgICAgICAgICBSZXNvdXJjZVR5cGU6ICdjb2xsZWN0aW9uJyxcbiAgICAgICAgICBSZXNvdXJjZTogW2Bjb2xsZWN0aW9uLyR7dGhpcy5vcGVuU2VhcmNoQ29sbGVjdGlvbi5uYW1lfWBdLFxuICAgICAgICB9XSxcbiAgICAgICAgQVdTT3duZWRLZXk6ICFjb25maWcuZW5jcnlwdGlvbi5hdFJlc3QsXG4gICAgICAgIEttc0FSTjogY29uZmlnLmVuY3J5cHRpb24uYXRSZXN0ICYmIHRoaXMucHJvcHMua21zS2V5ID8gdGhpcy5wcm9wcy5rbXNLZXkua2V5QXJuIDogdW5kZWZpbmVkLFxuICAgICAgfSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRHluYW1vRELlsZ7mgKfjgr/jgqTjg5flpInmj5tcbiAgICovXG4gIHByaXZhdGUgZ2V0RHluYW1vREJBdHRyaWJ1dGVUeXBlKHR5cGU6IHN0cmluZyk6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnU1RSSU5HJzpcbiAgICAgICAgcmV0dXJuIGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HO1xuICAgICAgY2FzZSAnTlVNQkVSJzpcbiAgICAgICAgcmV0dXJuIGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSO1xuICAgICAgY2FzZSAnQklOQVJZJzpcbiAgICAgICAgcmV0dXJuIGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuQklOQVJZO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEeW5hbW9EQuOCueODiOODquODvOODoOODk+ODpeODvOOCv+OCpOODl+WkieaPm1xuICAgKi9cbiAgcHJpdmF0ZSBnZXREeW5hbW9EQlN0cmVhbVZpZXdUeXBlKHR5cGU6IHN0cmluZyk6IGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ0tFWVNfT05MWSc6XG4gICAgICAgIHJldHVybiBkeW5hbW9kYi5TdHJlYW1WaWV3VHlwZS5LRVlTX09OTFk7XG4gICAgICBjYXNlICdORVdfSU1BR0UnOlxuICAgICAgICByZXR1cm4gZHluYW1vZGIuU3RyZWFtVmlld1R5cGUuTkVXX0lNQUdFO1xuICAgICAgY2FzZSAnT0xEX0lNQUdFJzpcbiAgICAgICAgcmV0dXJuIGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlLk9MRF9JTUFHRTtcbiAgICAgIGNhc2UgJ05FV19BTkRfT0xEX0lNQUdFUyc6XG4gICAgICAgIHJldHVybiBkeW5hbW9kYi5TdHJlYW1WaWV3VHlwZS5ORVdfQU5EX09MRF9JTUFHRVM7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZHluYW1vZGIuU3RyZWFtVmlld1R5cGUuTkVXX0FORF9PTERfSU1BR0VTO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlh7rlipvlgKTkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0cygpOiBEYXRhYmFzZU91dHB1dHMge1xuICAgIHJldHVybiB7XG4gICAgICAvLyBEeW5hbW9EQuWHuuWKm1xuICAgICAgc2Vzc2lvblRhYmxlTmFtZTogdGhpcy5zZXNzaW9uVGFibGU/LnRhYmxlTmFtZSxcbiAgICAgIHNlc3Npb25UYWJsZUFybjogdGhpcy5zZXNzaW9uVGFibGU/LnRhYmxlQXJuLFxuXG4gICAgICAvLyBPcGVuU2VhcmNo5Ye65YqbXG4gICAgICBvcGVuU2VhcmNoQ29sbGVjdGlvbklkOiB0aGlzLm9wZW5TZWFyY2hDb2xsZWN0aW9uPy5hdHRySWQsXG4gICAgICBvcGVuU2VhcmNoQ29sbGVjdGlvbkFybjogdGhpcy5vcGVuU2VhcmNoQ29sbGVjdGlvbj8uYXR0ckFybixcbiAgICAgIG9wZW5TZWFyY2hFbmRwb2ludDogdGhpcy5vcGVuU2VhcmNoQ29sbGVjdGlvbj8uYXR0ckNvbGxlY3Rpb25FbmRwb2ludCxcblxuICAgICAgLy8gU1FMaXRlIFVQU0VSVCBNYW5hZ2Vy5Ye65Yqb77yI5bCG5p2l5a6f6KOF77yJXG4gICAgICBzcWxpdGVEYXRhYmFzZVBhdGg6IHRoaXMucHJvcHMuY29uZmlnLnNxbGl0ZVVwc2VydE1hbmFnZXIuZGF0YWJhc2VQYXRoLFxuICAgICAgc3FsaXRlQmFja3VwTG9jYXRpb246IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOOCv+OCsOmBqeeUqFxuICAgKi9cbiAgcHJpdmF0ZSBhcHBseVRhZ3MoKTogdm9pZCB7XG4gICAgY29uc3QgdGFncyA9IHRoaXMucHJvcHMuY29uZmlnLnRhZ3M7XG5cbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0RhdGFiYXNlVHlwZScsIHRhZ3MuRGF0YWJhc2VUeXBlKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0JhY2t1cEVuYWJsZWQnLCB0YWdzLkJhY2t1cEVuYWJsZWQudG9TdHJpbmcoKSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbmNyeXB0aW9uRW5hYmxlZCcsIHRhZ3MuRW5jcnlwdGlvbkVuYWJsZWQudG9TdHJpbmcoKSk7XG5cbiAgICBpZiAodGFncy5EYXRhQ2xhc3NpZmljYXRpb24pIHtcbiAgICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRGF0YUNsYXNzaWZpY2F0aW9uJywgdGFncy5EYXRhQ2xhc3NpZmljYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0YWdzLlJldGVudGlvblBlcmlvZCkge1xuICAgICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdSZXRlbnRpb25QZXJpb2QnLCB0YWdzLlJldGVudGlvblBlcmlvZCk7XG4gICAgfVxuXG4gICAgaWYgKHRhZ3MuUGVyZm9ybWFuY2VUaWVyKSB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1BlcmZvcm1hbmNlVGllcicsIHRhZ3MuUGVyZm9ybWFuY2VUaWVyKTtcbiAgICB9XG4gIH1cbn0iXX0=