"use strict";
/**
 * OpenSearch Multimodal Embeddingクラスター構築
 *
 * Titan Multimodal Embedding用に最適化されたOpenSearchクラスター
 * - ベクトル検索最適化
 * - 高性能インスタンス設定
 * - セキュリティ強化
 * - 監視・ログ設定
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
exports.OpenSearchMultimodalConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const opensearch = __importStar(require("aws-cdk-lib/aws-opensearchserverless"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const constructs_1 = require("constructs");
class OpenSearchMultimodalConstruct extends constructs_1.Construct {
    config;
    collection;
    outputs;
    securityGroup;
    accessRole;
    constructor(scope, id, config) {
        super(scope, id);
        this.config = config;
        // 入力値検証
        this.validateConfig();
        // セキュリティグループ作成（VPC使用時）
        if (this.config.networkConfig.vpcEnabled && this.config.networkConfig.vpc) {
            this.securityGroup = this.createSecurityGroup();
        }
        // IAMロール作成
        this.accessRole = this.createAccessRole();
        // CloudWatchログ設定
        this.createCloudWatchLogs();
        // OpenSearchサーバーレスコレクション作成
        this.collection = this.createOpenSearchCollection();
        // 出力値設定
        this.outputs = this.createOutputs();
        // タグ適用
        this.applyTags();
    }
    /**
     * 設定値検証
     */
    validateConfig() {
        // ドメイン名長さチェック（28文字以内）
        if (this.config.domainName.length > 28) {
            throw new Error(`OpenSearchドメイン名は28文字以内である必要があります: ${this.config.domainName} (${this.config.domainName.length}文字)`);
        }
        // ドメイン名形式チェック
        const domainNameRegex = /^[a-z][a-z0-9\-]*$/;
        if (!domainNameRegex.test(this.config.domainName)) {
            throw new Error(`OpenSearchドメイン名は小文字、数字、ハイフンのみ使用可能です: ${this.config.domainName}`);
        }
        // コレクションタイプ検証
        if (this.config.collectionConfig?.type && !['SEARCH', 'TIMESERIES', 'VECTORSEARCH'].includes(this.config.collectionConfig.type)) {
            throw new Error(`無効なコレクションタイプ: ${this.config.collectionConfig.type}`);
        }
        // VPC設定チェック
        if (this.config.networkConfig.vpcEnabled && !this.config.networkConfig.vpc) {
            throw new Error('VPCが有効な場合、VPCを指定してください');
        }
    }
    /**
     * セキュリティグループ作成
     */
    createSecurityGroup() {
        const sg = new ec2.SecurityGroup(this, 'OpenSearchSecurityGroup', {
            vpc: this.config.networkConfig.vpc,
            description: `Security group for OpenSearch domain ${this.config.domainName}`,
            allowAllOutbound: true,
        });
        // HTTPS (443) アクセス許可（VPC内のみ）
        sg.addIngressRule(ec2.Peer.ipv4(this.config.networkConfig.vpc.vpcCidrBlock), ec2.Port.tcp(443), 'HTTPS access to OpenSearch from VPC');
        // OpenSearch API (9200) アクセス許可（VPC内のみ）
        sg.addIngressRule(ec2.Peer.ipv4(this.config.networkConfig.vpc.vpcCidrBlock), ec2.Port.tcp(9200), 'OpenSearch API access from VPC');
        return sg;
    }
    /**
     * IAMアクセスロール作成
     */
    createAccessRole() {
        const role = new iam.Role(this, 'OpenSearchAccessRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: `Access role for OpenSearch domain ${this.config.domainName}`,
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });
        // OpenSearchアクセス権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'aoss:APIAccessAll',
                'aoss:DashboardsAccessAll',
            ],
            resources: [`arn:aws:aoss:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:collection/${this.config.domainName}`],
        }));
        return role;
    }
    /**
     * OpenSearchサーバーレスコレクション作成
     */
    createOpenSearchCollection() {
        // セキュリティポリシー作成
        const securityPolicy = this.createSecurityPolicy();
        // ネットワークポリシー作成（VPC使用時）
        const networkPolicy = this.config.networkConfig.vpcEnabled
            ? this.createNetworkPolicy()
            : undefined;
        // データアクセスポリシー作成
        const dataAccessPolicy = this.createDataAccessPolicy();
        // コレクション作成
        const collection = new opensearch.CfnCollection(this, 'OpenSearchCollection', {
            name: this.config.domainName,
            type: this.config.collectionConfig?.type || 'VECTORSEARCH', // ベクトル検索用
            description: this.config.collectionConfig?.description || `Multimodal embedding collection for ${this.config.environment}`,
            tags: this.createCollectionTags(),
        });
        // 依存関係設定
        collection.addDependency(securityPolicy);
        collection.addDependency(dataAccessPolicy);
        if (networkPolicy) {
            collection.addDependency(networkPolicy);
        }
        return collection;
    }
    /**
     * セキュリティポリシー作成
     */
    createSecurityPolicy() {
        const encryptionPolicy = {
            Rules: [
                {
                    ResourceType: 'collection',
                    Resource: [`collection/${this.config.domainName}`]
                }
            ],
            AWSOwnedKey: !this.config.securityConfig.kmsKey
        };
        return new opensearch.CfnSecurityPolicy(this, 'SecurityPolicy', {
            name: `${this.config.domainName}-security-policy`,
            type: 'encryption',
            policy: JSON.stringify(encryptionPolicy),
        });
    }
    /**
     * ネットワークポリシー作成
     */
    createNetworkPolicy() {
        const networkPolicy = {
            Rules: [
                {
                    ResourceType: 'collection',
                    Resource: [`collection/${this.config.domainName}`],
                    AllowFromPublic: false
                },
                {
                    ResourceType: 'dashboard',
                    Resource: [`collection/${this.config.domainName}`],
                    AllowFromPublic: false
                }
            ]
        };
        return new opensearch.CfnSecurityPolicy(this, 'NetworkPolicy', {
            name: `${this.config.domainName}-network-policy`,
            type: 'network',
            policy: JSON.stringify(networkPolicy),
        });
    }
    /**
     * データアクセスポリシー作成
     */
    createDataAccessPolicy() {
        const accessPolicy = {
            Rules: [
                {
                    ResourceType: 'collection',
                    Resource: [`collection/${this.config.domainName}`],
                    Permission: [
                        'aoss:CreateCollectionItems',
                        'aoss:DeleteCollectionItems',
                        'aoss:UpdateCollectionItems',
                        'aoss:DescribeCollectionItems'
                    ]
                },
                {
                    ResourceType: 'index',
                    Resource: [`index/${this.config.domainName}/*`],
                    Permission: [
                        'aoss:CreateIndex',
                        'aoss:DeleteIndex',
                        'aoss:UpdateIndex',
                        'aoss:DescribeIndex',
                        'aoss:ReadDocument',
                        'aoss:WriteDocument'
                    ]
                }
            ],
            Principal: [this.accessRole.roleArn]
        };
        return new opensearch.CfnAccessPolicy(this, 'DataAccessPolicy', {
            name: `${this.config.domainName}-data-access-policy`,
            type: 'data',
            policy: JSON.stringify(accessPolicy),
        });
    }
    /**
     * コレクション用タグ作成
     */
    createCollectionTags() {
        const defaultTags = {
            Component: 'OpenSearch',
            Purpose: 'MultimodalEmbedding',
            Environment: this.config.environment,
            EmbeddingModel: 'TitanMultimodal',
        };
        const allTags = { ...defaultTags, ...this.config.tags };
        return Object.entries(allTags).map(([key, value]) => ({
            key,
            value,
        }));
    }
    /**
     * CloudWatchログ設定作成（OpenSearch Serverless用）
     */
    createCloudWatchLogs() {
        if (this.config.monitoringConfig.logsEnabled) {
            // OpenSearch Serverlessでは自動的にCloudWatchログが有効化される
            // 必要に応じて追加のログ設定をここに実装
            new logs.LogGroup(this, 'OpenSearchServerlessLogGroup', {
                logGroupName: `/aws/opensearchserverless/collections/${this.config.domainName}`,
                retention: this.config.environment === 'prod'
                    ? logs.RetentionDays.SIX_MONTHS
                    : logs.RetentionDays.ONE_MONTH,
                removalPolicy: this.config.environment === 'prod'
                    ? cdk.RemovalPolicy.RETAIN
                    : cdk.RemovalPolicy.DESTROY,
            });
        }
    }
    /**
     * 出力値作成
     */
    createOutputs() {
        return {
            domainArn: this.collection.attrArn,
            domainEndpoint: this.collection.attrCollectionEndpoint,
            kibanaEndpoint: this.collection.attrDashboardEndpoint,
            domainName: this.collection.name,
            securityGroupId: this.securityGroup?.securityGroupId,
            accessPolicyArn: this.accessRole?.roleArn,
        };
    }
    /**
     * タグ適用
     */
    applyTags() {
        const defaultTags = {
            Component: 'OpenSearch',
            Purpose: 'MultimodalEmbedding',
            Environment: this.config.environment,
            EmbeddingModel: 'TitanMultimodal',
        };
        const allTags = { ...defaultTags, ...this.config.tags };
        Object.entries(allTags).forEach(([key, value]) => {
            cdk.Tags.of(this).add(key, value);
        });
    }
    /**
     * Titan Multimodal Embedding用インデックス作成
     */
    createMultimodalIndex() {
        const indexTemplate = {
            settings: {
                index: {
                    number_of_shards: 2, // OpenSearch Serverlessでは自動管理
                    number_of_replicas: this.config.environment === 'prod' ? 1 : 0,
                    'knn': true,
                    'knn.algo_param.ef_search': 100,
                    'knn.algo_param.ef_construction': 200,
                    'knn.space_type': 'cosinesimil',
                },
            },
            mappings: {
                properties: {
                    document_id: { type: 'keyword' },
                    content_type: { type: 'keyword' },
                    text_content: {
                        type: 'text',
                        analyzer: 'standard',
                        fields: {
                            keyword: { type: 'keyword' }
                        }
                    },
                    image_metadata: {
                        type: 'object',
                        properties: {
                            format: { type: 'keyword' },
                            size: { type: 'long' },
                            dimensions: {
                                type: 'object',
                                properties: {
                                    width: { type: 'integer' },
                                    height: { type: 'integer' }
                                }
                            }
                        }
                    },
                    text_embedding_vector: {
                        type: 'knn_vector',
                        dimension: 1024,
                        method: {
                            name: 'hnsw',
                            space_type: 'cosinesimil',
                            engine: 'nmslib',
                            parameters: {
                                ef_construction: 200,
                                m: 16
                            }
                        }
                    },
                    multimodal_embedding_vector: {
                        type: 'knn_vector',
                        dimension: 1024,
                        method: {
                            name: 'hnsw',
                            space_type: 'cosinesimil',
                            engine: 'nmslib',
                            parameters: {
                                ef_construction: 200,
                                m: 16
                            }
                        }
                    },
                    user_permissions: { type: 'keyword' },
                    file_path: { type: 'keyword' },
                    created_at: { type: 'date' },
                    updated_at: { type: 'date' },
                    model_version: { type: 'keyword' },
                    embedding_model: { type: 'keyword' },
                }
            }
        };
        return JSON.stringify(indexTemplate, null, 2);
    }
    /**
     * パフォーマンス最適化設定取得
     */
    getPerformanceOptimizationSettings() {
        return {
            // インデックス設定
            'index.refresh_interval': '30s',
            'index.number_of_replicas': this.config.environment === 'prod' ? 1 : 0,
            'index.translog.flush_threshold_size': '1gb',
            'index.translog.sync_interval': '30s',
            // 検索設定
            'search.max_buckets': 65536,
            'search.allow_expensive_queries': true,
            // KNN設定
            'knn.memory.circuit_breaker.enabled': true,
            'knn.memory.circuit_breaker.limit': '75%',
            'knn.cache.item.expiry.enabled': true,
            'knn.cache.item.expiry.minutes': 60,
            // クラスター設定
            'cluster.routing.allocation.disk.threshold_enabled': true,
            'cluster.routing.allocation.disk.watermark.low': '85%',
            'cluster.routing.allocation.disk.watermark.high': '90%',
            'cluster.routing.allocation.disk.watermark.flood_stage': '95%',
        };
    }
}
exports.OpenSearchMultimodalConstruct = OpenSearchMultimodalConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbnNlYXJjaC1tdWx0aW1vZGFsLWNvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wZW5zZWFyY2gtbXVsdGltb2RhbC1jb25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUNuQyxpRkFBbUU7QUFDbkUseURBQTJDO0FBQzNDLHlEQUEyQztBQUUzQywyREFBNkM7QUFDN0MsMkNBQXVDO0FBcUZ2QyxNQUFhLDZCQUE4QixTQUFRLHNCQUFTO0lBTVI7SUFMbEMsVUFBVSxDQUEyQjtJQUNyQyxPQUFPLENBQThCO0lBQ3BDLGFBQWEsQ0FBcUI7SUFDbEMsVUFBVSxDQUFZO0lBRXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQVUsTUFBa0M7UUFDbEYsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUQrQixXQUFNLEdBQU4sTUFBTSxDQUE0QjtRQUdsRixRQUFRO1FBQ1IsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXRCLHVCQUF1QjtRQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMxRSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ2xELENBQUM7UUFFRCxXQUFXO1FBQ1gsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUUxQyxpQkFBaUI7UUFDakIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFNUIsMkJBQTJCO1FBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7UUFFcEQsUUFBUTtRQUNSLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFB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MEJBQTBCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEUscUNBQXFDLEVBQUUsS0FBSztZQUM1Qyw4QkFBOEIsRUFBRSxLQUFLO1lBRXJDLE9BQU87WUFDUCxvQkFBb0IsRUFBRSxLQUFLO1lBQzNCLGdDQUFnQyxFQUFFLElBQUk7WUFFdEMsUUFBUTtZQUNSLG9DQUFvQyxFQUFFLElBQUk7WUFDMUMsa0NBQWtDLEVBQUUsS0FBSztZQUN6QywrQkFBK0IsRUFBRSxJQUFJO1lBQ3JDLCtCQUErQixFQUFFLEVBQUU7WUFFbkMsVUFBVTtZQUNWLG1EQUFtRCxFQUFFLElBQUk7WUFDekQsK0NBQStDLEVBQUUsS0FBSztZQUN0RCxnREFBZ0QsRUFBRSxLQUFLO1lBQ3ZELHVEQUF1RCxFQUFFLEtBQUs7U0FDL0QsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXpaRCxzRUF5WkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE9wZW5TZWFyY2ggTXVsdGltb2RhbCBFbWJlZGRpbmfjgq/jg6njgrnjgr/jg7zmp4vnr4lcbiAqIFxuICogVGl0YW4gTXVsdGltb2RhbCBFbWJlZGRpbmfnlKjjgavmnIDpganljJbjgZXjgozjgZ9PcGVuU2VhcmNo44Kv44Op44K544K/44O8XG4gKiAtIOODmeOCr+ODiOODq+aknOe0ouacgOmBqeWMllxuICogLSDpq5jmgKfog73jgqTjg7Pjgrnjgr/jg7PjgrnoqK3lrppcbiAqIC0g44K744Kt44Ol44Oq44OG44Kj5by35YyWXG4gKiAtIOebo+imluODu+ODreOCsOioreWumlxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBvcGVuc2VhcmNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1vcGVuc2VhcmNoc2VydmVybGVzcyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBrbXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWttcyc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wZW5TZWFyY2hNdWx0aW1vZGFsQ29uZmlnIHtcbiAgLyoqIOOCs+ODrOOCr+OCt+ODp+ODs+WQje+8iDI45paH5a2X5Lul5YaF77yJICovXG4gIHJlYWRvbmx5IGRvbWFpbk5hbWU6IHN0cmluZztcbiAgXG4gIC8qKiDnkrDlooPvvIhkZXYvc3RhZ2luZy9wcm9k77yJICovXG4gIHJlYWRvbmx5IGVudmlyb25tZW50OiBzdHJpbmc7XG4gIFxuICAvKiog44Kz44Os44Kv44K344On44Oz6Kit5a6aICovXG4gIHJlYWRvbmx5IGNvbGxlY3Rpb25Db25maWc6IHtcbiAgICAvKiog44Kz44Os44Kv44K344On44Oz44K/44Kk44OXICovXG4gICAgcmVhZG9ubHkgdHlwZTogJ1NFQVJDSCcgfCAnVElNRVNFUklFUycgfCAnVkVDVE9SU0VBUkNIJztcbiAgICAvKiog6Kqs5piOICovXG4gICAgcmVhZG9ubHkgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIH07XG4gIFxuICAvKiog44ON44OD44OI44Ov44O844Kv6Kit5a6aICovXG4gIHJlYWRvbmx5IG5ldHdvcmtDb25maWc6IHtcbiAgICAvKiogVlBD6YWN572uICovXG4gICAgcmVhZG9ubHkgdnBjRW5hYmxlZDogYm9vbGVhbjtcbiAgICAvKiogVlBDICovXG4gICAgcmVhZG9ubHkgdnBjPzogZWMyLklWcGM7XG4gICAgLyoqIOOCteODluODjeODg+ODiCAqL1xuICAgIHJlYWRvbmx5IHN1Ym5ldHM/OiBlYzIuSVN1Ym5ldFtdO1xuICAgIC8qKiDjgrvjgq3jg6Xjg6rjg4bjgqPjgrDjg6vjg7zjg5cgKi9cbiAgICByZWFkb25seSBzZWN1cml0eUdyb3Vwcz86IGVjMi5JU2VjdXJpdHlHcm91cFtdO1xuICB9O1xuICBcbiAgLyoqIOOCu+OCreODpeODquODhuOCo+ioreWumiAqL1xuICByZWFkb25seSBzZWN1cml0eUNvbmZpZzoge1xuICAgIC8qKiDmmpflj7fljJbmnInlirnljJYgKi9cbiAgICByZWFkb25seSBlbmNyeXB0aW9uQXRSZXN0OiBib29sZWFuO1xuICAgIC8qKiDjg47jg7zjg4nplpPmmpflj7fljJYgKi9cbiAgICByZWFkb25seSBub2RlVG9Ob2RlRW5jcnlwdGlvbjogYm9vbGVhbjtcbiAgICAvKiogSFRUUFPlvLfliLYgKi9cbiAgICByZWFkb25seSBlbmZvcmNlSHR0cHM6IGJvb2xlYW47XG4gICAgLyoqIEtNU+OCreODvCAqL1xuICAgIHJlYWRvbmx5IGttc0tleT86IGttcy5JS2V5O1xuICAgIC8qKiDjg5XjgqHjgqTjg7PjgqLjgq/jgrvjgrnliLblvqEgKi9cbiAgICByZWFkb25seSBmaW5lR3JhaW5lZEFjY2Vzc0NvbnRyb2w6IGJvb2xlYW47XG4gIH07XG4gIFxuICAvKiog55uj6KaW6Kit5a6aICovXG4gIHJlYWRvbmx5IG1vbml0b3JpbmdDb25maWc6IHtcbiAgICAvKiogQ2xvdWRXYXRjaOODreOCsOacieWKueWMliAqL1xuICAgIHJlYWRvbmx5IGxvZ3NFbmFibGVkOiBib29sZWFuO1xuICAgIC8qKiDjgrnjg63jg7zjg63jgrDmnInlirnljJYgKi9cbiAgICByZWFkb25seSBzbG93TG9nc0VuYWJsZWQ6IGJvb2xlYW47XG4gICAgLyoqIOOCouODl+ODquOCseODvOOCt+ODp+ODs+ODreOCsOacieWKueWMliAqL1xuICAgIHJlYWRvbmx5IGFwcExvZ3NFbmFibGVkOiBib29sZWFuO1xuICAgIC8qKiDjgqTjg7Pjg4fjg4Pjgq/jgrnjgrnjg63jg7zjg63jgrDmnInlirnljJYgKi9cbiAgICByZWFkb25seSBpbmRleFNsb3dMb2dzRW5hYmxlZDogYm9vbGVhbjtcbiAgfTtcbiAgXG4gIC8qKiDjg5Djg4Pjgq/jgqLjg4Pjg5foqK3lrpogKi9cbiAgcmVhZG9ubHkgYmFja3VwQ29uZmlnPzoge1xuICAgIC8qKiDoh6rli5Xjgrnjg4rjg4Pjg5fjgrfjg6fjg4Pjg4jmmYLplpMgKi9cbiAgICByZWFkb25seSBhdXRvbWF0ZWRTbmFwc2hvdFN0YXJ0SG91cjogbnVtYmVyO1xuICB9O1xuICBcbiAgLyoqIOOCv+OCsCAqL1xuICByZWFkb25seSB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPcGVuU2VhcmNoTXVsdGltb2RhbE91dHB1dHMge1xuICAvKiog44OJ44Oh44Kk44OzQVJOICovXG4gIHJlYWRvbmx5IGRvbWFpbkFybjogc3RyaW5nO1xuICBcbiAgLyoqIOODieODoeOCpOODs+OCqOODs+ODieODneOCpOODs+ODiCAqL1xuICByZWFkb25seSBkb21haW5FbmRwb2ludDogc3RyaW5nO1xuICBcbiAgLyoqIEtpYmFuYeOCqOODs+ODieODneOCpOODs+ODiCAqL1xuICByZWFkb25seSBraWJhbmFFbmRwb2ludDogc3RyaW5nO1xuICBcbiAgLyoqIOODieODoeOCpOODs+WQjSAqL1xuICByZWFkb25seSBkb21haW5OYW1lOiBzdHJpbmc7XG4gIFxuICAvKiog44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OXSUQgKi9cbiAgcmVhZG9ubHkgc2VjdXJpdHlHcm91cElkPzogc3RyaW5nO1xuICBcbiAgLyoqIOOCouOCr+OCu+OCueODneODquOCt+ODvEFSTiAqL1xuICByZWFkb25seSBhY2Nlc3NQb2xpY3lBcm4/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBPcGVuU2VhcmNoTXVsdGltb2RhbENvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBjb2xsZWN0aW9uOiBvcGVuc2VhcmNoLkNmbkNvbGxlY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBvdXRwdXRzOiBPcGVuU2VhcmNoTXVsdGltb2RhbE91dHB1dHM7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VjdXJpdHlHcm91cD86IGVjMi5TZWN1cml0eUdyb3VwO1xuICBwcml2YXRlIHJlYWRvbmx5IGFjY2Vzc1JvbGU/OiBpYW0uUm9sZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcml2YXRlIGNvbmZpZzogT3BlblNlYXJjaE11bHRpbW9kYWxDb25maWcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8g5YWl5Yqb5YCk5qSc6Ki8XG4gICAgdGhpcy52YWxpZGF0ZUNvbmZpZygpO1xuXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OX5L2c5oiQ77yIVlBD5L2/55So5pmC77yJXG4gICAgaWYgKHRoaXMuY29uZmlnLm5ldHdvcmtDb25maWcudnBjRW5hYmxlZCAmJiB0aGlzLmNvbmZpZy5uZXR3b3JrQ29uZmlnLnZwYykge1xuICAgICAgdGhpcy5zZWN1cml0eUdyb3VwID0gdGhpcy5jcmVhdGVTZWN1cml0eUdyb3VwKCk7XG4gICAgfVxuXG4gICAgLy8gSUFN44Ot44O844Or5L2c5oiQXG4gICAgdGhpcy5hY2Nlc3NSb2xlID0gdGhpcy5jcmVhdGVBY2Nlc3NSb2xlKCk7XG5cbiAgICAvLyBDbG91ZFdhdGNo44Ot44Kw6Kit5a6aXG4gICAgdGhpcy5jcmVhdGVDbG91ZFdhdGNoTG9ncygpO1xuXG4gICAgLy8gT3BlblNlYXJjaOOCteODvOODkOODvOODrOOCueOCs+ODrOOCr+OCt+ODp+ODs+S9nOaIkFxuICAgIHRoaXMuY29sbGVjdGlvbiA9IHRoaXMuY3JlYXRlT3BlblNlYXJjaENvbGxlY3Rpb24oKTtcblxuICAgIC8vIOWHuuWKm+WApOioreWumlxuICAgIHRoaXMub3V0cHV0cyA9IHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgLy8g44K/44Kw6YGp55SoXG4gICAgdGhpcy5hcHBseVRhZ3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDoqK3lrprlgKTmpJzoqLxcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVDb25maWcoKTogdm9pZCB7XG4gICAgLy8g44OJ44Oh44Kk44Oz5ZCN6ZW344GV44OB44Kn44OD44Kv77yIMjjmloflrZfku6XlhoXvvIlcbiAgICBpZiAodGhpcy5jb25maWcuZG9tYWluTmFtZS5sZW5ndGggPiAyOCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBPcGVuU2VhcmNo44OJ44Oh44Kk44Oz5ZCN44GvMjjmloflrZfku6XlhoXjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZk6ICR7dGhpcy5jb25maWcuZG9tYWluTmFtZX0gKCR7dGhpcy5jb25maWcuZG9tYWluTmFtZS5sZW5ndGh95paH5a2XKWApO1xuICAgIH1cblxuICAgIC8vIOODieODoeOCpOODs+WQjeW9ouW8j+ODgeOCp+ODg+OCr1xuICAgIGNvbnN0IGRvbWFpbk5hbWVSZWdleCA9IC9eW2Etel1bYS16MC05XFwtXSokLztcbiAgICBpZiAoIWRvbWFpbk5hbWVSZWdleC50ZXN0KHRoaXMuY29uZmlnLmRvbWFpbk5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW5TZWFyY2jjg4njg6HjgqTjg7PlkI3jga/lsI/mloflrZfjgIHmlbDlrZfjgIHjg4/jgqTjg5Xjg7Pjga7jgb/kvb/nlKjlj6/og73jgafjgZk6ICR7dGhpcy5jb25maWcuZG9tYWluTmFtZX1gKTtcbiAgICB9XG5cbiAgICAvLyDjgrPjg6zjgq/jgrfjg6fjg7Pjgr/jgqTjg5fmpJzoqLxcbiAgICBpZiAodGhpcy5jb25maWcuY29sbGVjdGlvbkNvbmZpZz8udHlwZSAmJiAhWydTRUFSQ0gnLCAnVElNRVNFUklFUycsICdWRUNUT1JTRUFSQ0gnXS5pbmNsdWRlcyh0aGlzLmNvbmZpZy5jb2xsZWN0aW9uQ29uZmlnLnR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOeEoeWKueOBquOCs+ODrOOCr+OCt+ODp+ODs+OCv+OCpOODlzogJHt0aGlzLmNvbmZpZy5jb2xsZWN0aW9uQ29uZmlnLnR5cGV9YCk7XG4gICAgfVxuXG4gICAgLy8gVlBD6Kit5a6a44OB44Kn44OD44KvXG4gICAgaWYgKHRoaXMuY29uZmlnLm5ldHdvcmtDb25maWcudnBjRW5hYmxlZCAmJiAhdGhpcy5jb25maWcubmV0d29ya0NvbmZpZy52cGMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVlBD44GM5pyJ5Yq544Gq5aC05ZCI44CBVlBD44KS5oyH5a6a44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODl+S9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVTZWN1cml0eUdyb3VwKCk6IGVjMi5TZWN1cml0eUdyb3VwIHtcbiAgICBjb25zdCBzZyA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnT3BlblNlYXJjaFNlY3VyaXR5R3JvdXAnLCB7XG4gICAgICB2cGM6IHRoaXMuY29uZmlnLm5ldHdvcmtDb25maWcudnBjISxcbiAgICAgIGRlc2NyaXB0aW9uOiBgU2VjdXJpdHkgZ3JvdXAgZm9yIE9wZW5TZWFyY2ggZG9tYWluICR7dGhpcy5jb25maWcuZG9tYWluTmFtZX1gLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIEhUVFBTICg0NDMpIOOCouOCr+OCu+OCueioseWPr++8iFZQQ+WGheOBruOBv++8iVxuICAgIHNnLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuaXB2NCh0aGlzLmNvbmZpZy5uZXR3b3JrQ29uZmlnLnZwYyEudnBjQ2lkckJsb2NrKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg0NDMpLFxuICAgICAgJ0hUVFBTIGFjY2VzcyB0byBPcGVuU2VhcmNoIGZyb20gVlBDJ1xuICAgICk7XG5cbiAgICAvLyBPcGVuU2VhcmNoIEFQSSAoOTIwMCkg44Ki44Kv44K744K56Kix5Y+v77yIVlBD5YaF44Gu44G/77yJXG4gICAgc2cuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5pcHY0KHRoaXMuY29uZmlnLm5ldHdvcmtDb25maWcudnBjIS52cGNDaWRyQmxvY2spLFxuICAgICAgZWMyLlBvcnQudGNwKDkyMDApLFxuICAgICAgJ09wZW5TZWFyY2ggQVBJIGFjY2VzcyBmcm9tIFZQQydcbiAgICApO1xuXG4gICAgcmV0dXJuIHNnO1xuICB9XG5cbiAgLyoqXG4gICAqIElBTeOCouOCr+OCu+OCueODreODvOODq+S9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBY2Nlc3NSb2xlKCk6IGlhbS5Sb2xlIHtcbiAgICBjb25zdCByb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdPcGVuU2VhcmNoQWNjZXNzUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgZGVzY3JpcHRpb246IGBBY2Nlc3Mgcm9sZSBmb3IgT3BlblNlYXJjaCBkb21haW4gJHt0aGlzLmNvbmZpZy5kb21haW5OYW1lfWAsXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gT3BlblNlYXJjaOOCouOCr+OCu+OCueaoqemZkFxuICAgIHJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYW9zczpBUElBY2Nlc3NBbGwnLFxuICAgICAgICAnYW9zczpEYXNoYm9hcmRzQWNjZXNzQWxsJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFtgYXJuOmF3czphb3NzOiR7Y2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbn06JHtjZGsuU3RhY2sub2YodGhpcykuYWNjb3VudH06Y29sbGVjdGlvbi8ke3RoaXMuY29uZmlnLmRvbWFpbk5hbWV9YF0sXG4gICAgfSkpO1xuXG4gICAgcmV0dXJuIHJvbGU7XG4gIH1cblxuICAvKipcbiAgICogT3BlblNlYXJjaOOCteODvOODkOODvOODrOOCueOCs+ODrOOCr+OCt+ODp+ODs+S9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVPcGVuU2VhcmNoQ29sbGVjdGlvbigpOiBvcGVuc2VhcmNoLkNmbkNvbGxlY3Rpb24ge1xuICAgIC8vIOOCu+OCreODpeODquODhuOCo+ODneODquOCt+ODvOS9nOaIkFxuICAgIGNvbnN0IHNlY3VyaXR5UG9saWN5ID0gdGhpcy5jcmVhdGVTZWN1cml0eVBvbGljeSgpO1xuICAgIFxuICAgIC8vIOODjeODg+ODiOODr+ODvOOCr+ODneODquOCt+ODvOS9nOaIkO+8iFZQQ+S9v+eUqOaZgu+8iVxuICAgIGNvbnN0IG5ldHdvcmtQb2xpY3kgPSB0aGlzLmNvbmZpZy5uZXR3b3JrQ29uZmlnLnZwY0VuYWJsZWQgXG4gICAgICA/IHRoaXMuY3JlYXRlTmV0d29ya1BvbGljeSgpIFxuICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAvLyDjg4fjg7zjgr/jgqLjgq/jgrvjgrnjg53jg6rjgrfjg7zkvZzmiJBcbiAgICBjb25zdCBkYXRhQWNjZXNzUG9saWN5ID0gdGhpcy5jcmVhdGVEYXRhQWNjZXNzUG9saWN5KCk7XG5cbiAgICAvLyDjgrPjg6zjgq/jgrfjg6fjg7PkvZzmiJBcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gbmV3IG9wZW5zZWFyY2guQ2ZuQ29sbGVjdGlvbih0aGlzLCAnT3BlblNlYXJjaENvbGxlY3Rpb24nLCB7XG4gICAgICBuYW1lOiB0aGlzLmNvbmZpZy5kb21haW5OYW1lLFxuICAgICAgdHlwZTogdGhpcy5jb25maWcuY29sbGVjdGlvbkNvbmZpZz8udHlwZSB8fCAnVkVDVE9SU0VBUkNIJywgLy8g44OZ44Kv44OI44Or5qSc57Si55SoXG4gICAgICBkZXNjcmlwdGlvbjogdGhpcy5jb25maWcuY29sbGVjdGlvbkNvbmZpZz8uZGVzY3JpcHRpb24gfHwgYE11bHRpbW9kYWwgZW1iZWRkaW5nIGNvbGxlY3Rpb24gZm9yICR7dGhpcy5jb25maWcuZW52aXJvbm1lbnR9YCxcbiAgICAgIHRhZ3M6IHRoaXMuY3JlYXRlQ29sbGVjdGlvblRhZ3MoKSxcbiAgICB9KTtcblxuICAgIC8vIOS+neWtmOmWouS/guioreWumlxuICAgIGNvbGxlY3Rpb24uYWRkRGVwZW5kZW5jeShzZWN1cml0eVBvbGljeSk7XG4gICAgY29sbGVjdGlvbi5hZGREZXBlbmRlbmN5KGRhdGFBY2Nlc3NQb2xpY3kpO1xuICAgIGlmIChuZXR3b3JrUG9saWN5KSB7XG4gICAgICBjb2xsZWN0aW9uLmFkZERlcGVuZGVuY3kobmV0d29ya1BvbGljeSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICog44K744Kt44Ol44Oq44OG44Kj44Od44Oq44K344O85L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVNlY3VyaXR5UG9saWN5KCk6IG9wZW5zZWFyY2guQ2ZuU2VjdXJpdHlQb2xpY3kge1xuICAgIGNvbnN0IGVuY3J5cHRpb25Qb2xpY3kgPSB7XG4gICAgICBSdWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgUmVzb3VyY2VUeXBlOiAnY29sbGVjdGlvbicsXG4gICAgICAgICAgUmVzb3VyY2U6IFtgY29sbGVjdGlvbi8ke3RoaXMuY29uZmlnLmRvbWFpbk5hbWV9YF1cbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIEFXU093bmVkS2V5OiAhdGhpcy5jb25maWcuc2VjdXJpdHlDb25maWcua21zS2V5XG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgb3BlbnNlYXJjaC5DZm5TZWN1cml0eVBvbGljeSh0aGlzLCAnU2VjdXJpdHlQb2xpY3knLCB7XG4gICAgICBuYW1lOiBgJHt0aGlzLmNvbmZpZy5kb21haW5OYW1lfS1zZWN1cml0eS1wb2xpY3lgLFxuICAgICAgdHlwZTogJ2VuY3J5cHRpb24nLFxuICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeShlbmNyeXB0aW9uUG9saWN5KSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg43jg4Pjg4jjg6/jg7zjgq/jg53jg6rjgrfjg7zkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlTmV0d29ya1BvbGljeSgpOiBvcGVuc2VhcmNoLkNmblNlY3VyaXR5UG9saWN5IHtcbiAgICBjb25zdCBuZXR3b3JrUG9saWN5ID0ge1xuICAgICAgUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIFJlc291cmNlVHlwZTogJ2NvbGxlY3Rpb24nLFxuICAgICAgICAgIFJlc291cmNlOiBbYGNvbGxlY3Rpb24vJHt0aGlzLmNvbmZpZy5kb21haW5OYW1lfWBdLFxuICAgICAgICAgIEFsbG93RnJvbVB1YmxpYzogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFJlc291cmNlVHlwZTogJ2Rhc2hib2FyZCcsXG4gICAgICAgICAgUmVzb3VyY2U6IFtgY29sbGVjdGlvbi8ke3RoaXMuY29uZmlnLmRvbWFpbk5hbWV9YF0sXG4gICAgICAgICAgQWxsb3dGcm9tUHVibGljOiBmYWxzZVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgb3BlbnNlYXJjaC5DZm5TZWN1cml0eVBvbGljeSh0aGlzLCAnTmV0d29ya1BvbGljeScsIHtcbiAgICAgIG5hbWU6IGAke3RoaXMuY29uZmlnLmRvbWFpbk5hbWV9LW5ldHdvcmstcG9saWN5YCxcbiAgICAgIHR5cGU6ICduZXR3b3JrJyxcbiAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkobmV0d29ya1BvbGljeSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog44OH44O844K/44Ki44Kv44K744K544Od44Oq44K344O85L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZURhdGFBY2Nlc3NQb2xpY3koKTogb3BlbnNlYXJjaC5DZm5BY2Nlc3NQb2xpY3kge1xuICAgIGNvbnN0IGFjY2Vzc1BvbGljeSA9IHtcbiAgICAgIFJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBSZXNvdXJjZVR5cGU6ICdjb2xsZWN0aW9uJyxcbiAgICAgICAgICBSZXNvdXJjZTogW2Bjb2xsZWN0aW9uLyR7dGhpcy5jb25maWcuZG9tYWluTmFtZX1gXSxcbiAgICAgICAgICBQZXJtaXNzaW9uOiBbXG4gICAgICAgICAgICAnYW9zczpDcmVhdGVDb2xsZWN0aW9uSXRlbXMnLFxuICAgICAgICAgICAgJ2Fvc3M6RGVsZXRlQ29sbGVjdGlvbkl0ZW1zJyxcbiAgICAgICAgICAgICdhb3NzOlVwZGF0ZUNvbGxlY3Rpb25JdGVtcycsXG4gICAgICAgICAgICAnYW9zczpEZXNjcmliZUNvbGxlY3Rpb25JdGVtcydcbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBSZXNvdXJjZVR5cGU6ICdpbmRleCcsXG4gICAgICAgICAgUmVzb3VyY2U6IFtgaW5kZXgvJHt0aGlzLmNvbmZpZy5kb21haW5OYW1lfS8qYF0sXG4gICAgICAgICAgUGVybWlzc2lvbjogW1xuICAgICAgICAgICAgJ2Fvc3M6Q3JlYXRlSW5kZXgnLFxuICAgICAgICAgICAgJ2Fvc3M6RGVsZXRlSW5kZXgnLFxuICAgICAgICAgICAgJ2Fvc3M6VXBkYXRlSW5kZXgnLFxuICAgICAgICAgICAgJ2Fvc3M6RGVzY3JpYmVJbmRleCcsXG4gICAgICAgICAgICAnYW9zczpSZWFkRG9jdW1lbnQnLFxuICAgICAgICAgICAgJ2Fvc3M6V3JpdGVEb2N1bWVudCdcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBQcmluY2lwYWw6IFt0aGlzLmFjY2Vzc1JvbGUhLnJvbGVBcm5dXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgb3BlbnNlYXJjaC5DZm5BY2Nlc3NQb2xpY3kodGhpcywgJ0RhdGFBY2Nlc3NQb2xpY3knLCB7XG4gICAgICBuYW1lOiBgJHt0aGlzLmNvbmZpZy5kb21haW5OYW1lfS1kYXRhLWFjY2Vzcy1wb2xpY3lgLFxuICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeShhY2Nlc3NQb2xpY3kpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCs+ODrOOCr+OCt+ODp+ODs+eUqOOCv+OCsOS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVDb2xsZWN0aW9uVGFncygpOiBjZGsuQ2ZuVGFnW10ge1xuICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgQ29tcG9uZW50OiAnT3BlblNlYXJjaCcsXG4gICAgICBQdXJwb3NlOiAnTXVsdGltb2RhbEVtYmVkZGluZycsXG4gICAgICBFbnZpcm9ubWVudDogdGhpcy5jb25maWcuZW52aXJvbm1lbnQsXG4gICAgICBFbWJlZGRpbmdNb2RlbDogJ1RpdGFuTXVsdGltb2RhbCcsXG4gICAgfTtcblxuICAgIGNvbnN0IGFsbFRhZ3MgPSB7IC4uLmRlZmF1bHRUYWdzLCAuLi50aGlzLmNvbmZpZy50YWdzIH07XG5cbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMoYWxsVGFncykubWFwKChba2V5LCB2YWx1ZV0pID0+ICh7XG4gICAgICBrZXksXG4gICAgICB2YWx1ZSxcbiAgICB9KSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRXYXRjaOODreOCsOioreWumuS9nOaIkO+8iE9wZW5TZWFyY2ggU2VydmVybGVzc+eUqO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVDbG91ZFdhdGNoTG9ncygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb25maWcubW9uaXRvcmluZ0NvbmZpZy5sb2dzRW5hYmxlZCkge1xuICAgICAgLy8gT3BlblNlYXJjaCBTZXJ2ZXJsZXNz44Gn44Gv6Ieq5YuV55qE44GrQ2xvdWRXYXRjaOODreOCsOOBjOacieWKueWMluOBleOCjOOCi1xuICAgICAgLy8g5b+F6KaB44Gr5b+c44GY44Gm6L+95Yqg44Gu44Ot44Kw6Kit5a6a44KS44GT44GT44Gr5a6f6KOFXG4gICAgICBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnT3BlblNlYXJjaFNlcnZlcmxlc3NMb2dHcm91cCcsIHtcbiAgICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9vcGVuc2VhcmNoc2VydmVybGVzcy9jb2xsZWN0aW9ucy8ke3RoaXMuY29uZmlnLmRvbWFpbk5hbWV9YCxcbiAgICAgICAgcmV0ZW50aW9uOiB0aGlzLmNvbmZpZy5lbnZpcm9ubWVudCA9PT0gJ3Byb2QnIFxuICAgICAgICAgID8gbG9ncy5SZXRlbnRpb25EYXlzLlNJWF9NT05USFMgXG4gICAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX01PTlRILFxuICAgICAgICByZW1vdmFsUG9saWN5OiB0aGlzLmNvbmZpZy5lbnZpcm9ubWVudCA9PT0gJ3Byb2QnIFxuICAgICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOIFxuICAgICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cblxuICAvKipcbiAgICog5Ye65Yqb5YCk5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogT3BlblNlYXJjaE11bHRpbW9kYWxPdXRwdXRzIHtcbiAgICByZXR1cm4ge1xuICAgICAgZG9tYWluQXJuOiB0aGlzLmNvbGxlY3Rpb24uYXR0ckFybixcbiAgICAgIGRvbWFpbkVuZHBvaW50OiB0aGlzLmNvbGxlY3Rpb24uYXR0ckNvbGxlY3Rpb25FbmRwb2ludCxcbiAgICAgIGtpYmFuYUVuZHBvaW50OiB0aGlzLmNvbGxlY3Rpb24uYXR0ckRhc2hib2FyZEVuZHBvaW50LFxuICAgICAgZG9tYWluTmFtZTogdGhpcy5jb2xsZWN0aW9uLm5hbWUhLFxuICAgICAgc2VjdXJpdHlHcm91cElkOiB0aGlzLnNlY3VyaXR5R3JvdXA/LnNlY3VyaXR5R3JvdXBJZCxcbiAgICAgIGFjY2Vzc1BvbGljeUFybjogdGhpcy5hY2Nlc3NSb2xlPy5yb2xlQXJuLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44K/44Kw6YGp55SoXG4gICAqL1xuICBwcml2YXRlIGFwcGx5VGFncygpOiB2b2lkIHtcbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIENvbXBvbmVudDogJ09wZW5TZWFyY2gnLFxuICAgICAgUHVycG9zZTogJ011bHRpbW9kYWxFbWJlZGRpbmcnLFxuICAgICAgRW52aXJvbm1lbnQ6IHRoaXMuY29uZmlnLmVudmlyb25tZW50LFxuICAgICAgRW1iZWRkaW5nTW9kZWw6ICdUaXRhbk11bHRpbW9kYWwnLFxuICAgIH07XG5cbiAgICBjb25zdCBhbGxUYWdzID0geyAuLi5kZWZhdWx0VGFncywgLi4udGhpcy5jb25maWcudGFncyB9O1xuXG4gICAgT2JqZWN0LmVudHJpZXMoYWxsVGFncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVGl0YW4gTXVsdGltb2RhbCBFbWJlZGRpbmfnlKjjgqTjg7Pjg4fjg4Pjgq/jgrnkvZzmiJBcbiAgICovXG4gIHB1YmxpYyBjcmVhdGVNdWx0aW1vZGFsSW5kZXgoKTogc3RyaW5nIHtcbiAgICBjb25zdCBpbmRleFRlbXBsYXRlID0ge1xuICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgaW5kZXg6IHtcbiAgICAgICAgICBudW1iZXJfb2Zfc2hhcmRzOiAyLCAvLyBPcGVuU2VhcmNoIFNlcnZlcmxlc3Pjgafjga/oh6rli5XnrqHnkIZcbiAgICAgICAgICBudW1iZXJfb2ZfcmVwbGljYXM6IHRoaXMuY29uZmlnLmVudmlyb25tZW50ID09PSAncHJvZCcgPyAxIDogMCxcbiAgICAgICAgICAna25uJzogdHJ1ZSxcbiAgICAgICAgICAna25uLmFsZ29fcGFyYW0uZWZfc2VhcmNoJzogMTAwLFxuICAgICAgICAgICdrbm4uYWxnb19wYXJhbS5lZl9jb25zdHJ1Y3Rpb24nOiAyMDAsXG4gICAgICAgICAgJ2tubi5zcGFjZV90eXBlJzogJ2Nvc2luZXNpbWlsJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBtYXBwaW5nczoge1xuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZG9jdW1lbnRfaWQ6IHsgdHlwZTogJ2tleXdvcmQnIH0sXG4gICAgICAgICAgY29udGVudF90eXBlOiB7IHR5cGU6ICdrZXl3b3JkJyB9LFxuICAgICAgICAgIHRleHRfY29udGVudDogeyBcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgIGFuYWx5emVyOiAnc3RhbmRhcmQnLFxuICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgIGtleXdvcmQ6IHsgdHlwZTogJ2tleXdvcmQnIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGltYWdlX21ldGFkYXRhOiB7XG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgZm9ybWF0OiB7IHR5cGU6ICdrZXl3b3JkJyB9LFxuICAgICAgICAgICAgICBzaXplOiB7IHR5cGU6ICdsb25nJyB9LFxuICAgICAgICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgd2lkdGg6IHsgdHlwZTogJ2ludGVnZXInIH0sXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6IHsgdHlwZTogJ2ludGVnZXInIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHRleHRfZW1iZWRkaW5nX3ZlY3Rvcjoge1xuICAgICAgICAgICAgdHlwZTogJ2tubl92ZWN0b3InLFxuICAgICAgICAgICAgZGltZW5zaW9uOiAxMDI0LFxuICAgICAgICAgICAgbWV0aG9kOiB7XG4gICAgICAgICAgICAgIG5hbWU6ICdobnN3JyxcbiAgICAgICAgICAgICAgc3BhY2VfdHlwZTogJ2Nvc2luZXNpbWlsJyxcbiAgICAgICAgICAgICAgZW5naW5lOiAnbm1zbGliJyxcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgIGVmX2NvbnN0cnVjdGlvbjogMjAwLFxuICAgICAgICAgICAgICAgIG06IDE2XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIG11bHRpbW9kYWxfZW1iZWRkaW5nX3ZlY3Rvcjoge1xuICAgICAgICAgICAgdHlwZTogJ2tubl92ZWN0b3InLFxuICAgICAgICAgICAgZGltZW5zaW9uOiAxMDI0LFxuICAgICAgICAgICAgbWV0aG9kOiB7XG4gICAgICAgICAgICAgIG5hbWU6ICdobnN3JyxcbiAgICAgICAgICAgICAgc3BhY2VfdHlwZTogJ2Nvc2luZXNpbWlsJyxcbiAgICAgICAgICAgICAgZW5naW5lOiAnbm1zbGliJyxcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgIGVmX2NvbnN0cnVjdGlvbjogMjAwLFxuICAgICAgICAgICAgICAgIG06IDE2XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHVzZXJfcGVybWlzc2lvbnM6IHsgdHlwZTogJ2tleXdvcmQnIH0sXG4gICAgICAgICAgZmlsZV9wYXRoOiB7IHR5cGU6ICdrZXl3b3JkJyB9LFxuICAgICAgICAgIGNyZWF0ZWRfYXQ6IHsgdHlwZTogJ2RhdGUnIH0sXG4gICAgICAgICAgdXBkYXRlZF9hdDogeyB0eXBlOiAnZGF0ZScgfSxcbiAgICAgICAgICBtb2RlbF92ZXJzaW9uOiB7IHR5cGU6ICdrZXl3b3JkJyB9LFxuICAgICAgICAgIGVtYmVkZGluZ19tb2RlbDogeyB0eXBlOiAna2V5d29yZCcgfSxcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoaW5kZXhUZW1wbGF0ZSwgbnVsbCwgMik7XG4gIH1cblxuICAvKipcbiAgICog44OR44OV44Kp44O844Oe44Oz44K55pyA6YGp5YyW6Kit5a6a5Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgZ2V0UGVyZm9ybWFuY2VPcHRpbWl6YXRpb25TZXR0aW5ncygpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHtcbiAgICByZXR1cm4ge1xuICAgICAgLy8g44Kk44Oz44OH44OD44Kv44K56Kit5a6aXG4gICAgICAnaW5kZXgucmVmcmVzaF9pbnRlcnZhbCc6ICczMHMnLFxuICAgICAgJ2luZGV4Lm51bWJlcl9vZl9yZXBsaWNhcyc6IHRoaXMuY29uZmlnLmVudmlyb25tZW50ID09PSAncHJvZCcgPyAxIDogMCxcbiAgICAgICdpbmRleC50cmFuc2xvZy5mbHVzaF90aHJlc2hvbGRfc2l6ZSc6ICcxZ2InLFxuICAgICAgJ2luZGV4LnRyYW5zbG9nLnN5bmNfaW50ZXJ2YWwnOiAnMzBzJyxcbiAgICAgIFxuICAgICAgLy8g5qSc57Si6Kit5a6aXG4gICAgICAnc2VhcmNoLm1heF9idWNrZXRzJzogNjU1MzYsXG4gICAgICAnc2VhcmNoLmFsbG93X2V4cGVuc2l2ZV9xdWVyaWVzJzogdHJ1ZSxcbiAgICAgIFxuICAgICAgLy8gS05O6Kit5a6aXG4gICAgICAna25uLm1lbW9yeS5jaXJjdWl0X2JyZWFrZXIuZW5hYmxlZCc6IHRydWUsXG4gICAgICAna25uLm1lbW9yeS5jaXJjdWl0X2JyZWFrZXIubGltaXQnOiAnNzUlJyxcbiAgICAgICdrbm4uY2FjaGUuaXRlbS5leHBpcnkuZW5hYmxlZCc6IHRydWUsXG4gICAgICAna25uLmNhY2hlLml0ZW0uZXhwaXJ5Lm1pbnV0ZXMnOiA2MCxcbiAgICAgIFxuICAgICAgLy8g44Kv44Op44K544K/44O86Kit5a6aXG4gICAgICAnY2x1c3Rlci5yb3V0aW5nLmFsbG9jYXRpb24uZGlzay50aHJlc2hvbGRfZW5hYmxlZCc6IHRydWUsXG4gICAgICAnY2x1c3Rlci5yb3V0aW5nLmFsbG9jYXRpb24uZGlzay53YXRlcm1hcmsubG93JzogJzg1JScsXG4gICAgICAnY2x1c3Rlci5yb3V0aW5nLmFsbG9jYXRpb24uZGlzay53YXRlcm1hcmsuaGlnaCc6ICc5MCUnLFxuICAgICAgJ2NsdXN0ZXIucm91dGluZy5hbGxvY2F0aW9uLmRpc2sud2F0ZXJtYXJrLmZsb29kX3N0YWdlJzogJzk1JScsXG4gICAgfTtcbiAgfVxufSJdfQ==