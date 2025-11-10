"use strict";
/**
 * 統一統合スタック
 *
 * 単一スタック内でコンストラクトを直接使用する統合アプローチ
 * スタック間参照の問題を回避し、シンプルな構造を実現
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
exports.UnifiedIntegratedStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const security_construct_1 = require("../../modules/security/constructs/security-construct");
const networking_construct_1 = require("../../modules/networking/constructs/networking-construct");
const storage_construct_1 = require("../../modules/storage/constructs/storage-construct");
const database_construct_1 = require("../../modules/database/constructs/database-construct");
class UnifiedIntegratedStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // 入力値の検証（セキュリティ強化）
        this.validateInputs(props);
        const { projectName, environment, enableSecurity = true, enableNetworking = true, enableStorage = false, enableDatabase = false, securityConfig = {}, networkingConfig = {}, storageConfig = {}, databaseConfig = {} } = props;
        // 1. セキュリティコンストラクト（遅延初期化でパフォーマンス向上）
        if (enableSecurity) {
            const mergedSecurityConfig = this.mergeConfig(this.getDefaultSecurityConfig(projectName, environment), securityConfig);
            this.securityConstruct = new security_construct_1.SecurityConstruct(this, 'Security', {
                config: mergedSecurityConfig,
                projectName,
                environment,
            });
            this.kmsKey = this.securityConstruct.kmsKey;
            this.wafWebAcl = this.securityConstruct.wafWebAcl;
        }
        // 2. ネットワーキングコンストラクト
        if (enableNetworking) {
            const mergedNetworkingConfig = this.mergeConfig(this.getDefaultNetworkingConfig(), networkingConfig);
            this.networkingConstruct = new networking_construct_1.NetworkingConstruct(this, 'Networking', {
                config: mergedNetworkingConfig,
                projectName,
                environment,
            });
            this.vpc = this.networkingConstruct.vpc;
        }
        // 3. ストレージコンストラクト（オプション）
        if (enableStorage && this.vpc && this.kmsKey) {
            const defaultStorageConfig = {
                s3: {
                    enabled: true,
                    documentsBucket: {
                        versioned: true,
                        encryption: {
                            type: 'KMS',
                            kmsKeyId: this.kmsKey?.keyId,
                        },
                        lifecycle: {
                            transitionToIADays: 30,
                            transitionToGlacierDays: 90,
                            expirationDays: 365,
                        },
                    },
                    backupBucket: {
                        versioned: true,
                        encryption: {
                            type: 'KMS',
                            kmsKeyId: this.kmsKey?.keyId,
                        },
                    },
                },
                fsx: {
                    enabled: true,
                    fileSystem: {
                        storageCapacity: 1024,
                        deploymentType: 'MULTI_AZ_1',
                        throughputCapacity: 128,
                        automaticBackup: {
                            enabled: true,
                            retentionDays: 7,
                        },
                    },
                    svm: {
                        name: `${projectName}-svm`,
                        netBiosName: `${projectName.toUpperCase()}SVM`,
                    },
                    volumes: {
                        dataVolume: {
                            name: 'data',
                            sizeInGb: 100,
                            junctionPath: '/data',
                            securityStyle: 'NTFS',
                        },
                        databaseVolume: {
                            name: 'database',
                            sizeInGb: 50,
                            junctionPath: '/database',
                            securityStyle: 'UNIX',
                        },
                    },
                },
                ecr: {
                    enabled: true,
                    repositories: {
                        nextjs: {
                            repositoryName: `${projectName}-nextjs`,
                            imageScanOnPush: true,
                            lifecycle: {
                                maxImageCount: 10,
                            },
                        },
                        embedding: {
                            repositoryName: `${projectName}-embedding`,
                            imageScanOnPush: true,
                            lifecycle: {
                                maxImageCount: 5,
                            },
                        },
                    },
                },
                tags: {
                    StorageType: 'Hybrid',
                    DataClassification: 'Confidential',
                    BackupRequired: true,
                    EncryptionRequired: true,
                    ComplianceFramework: 'SOC2',
                },
            };
            const mergedStorageConfig = this.mergeConfig(defaultStorageConfig, storageConfig);
            this.storageConstruct = new storage_construct_1.StorageConstruct(this, 'Storage', {
                config: mergedStorageConfig,
                projectName,
                environment,
                vpc: this.vpc,
                kmsKey: this.kmsKey,
            });
        }
        // 4. データベースコンストラクト（オプション）
        if (enableDatabase && this.kmsKey) {
            const defaultDatabaseConfig = {
                dynamodb: {
                    enabled: true,
                    tables: {
                        sessionTable: {
                            tableName: `${projectName}-${environment}-sessions`,
                            partitionKey: { name: 'sessionId', type: cdk.aws_dynamodb.AttributeType.STRING },
                            billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
                            pointInTimeRecovery: true,
                            deletionProtection: false,
                            timeToLive: {
                                attribute: 'ttl',
                            },
                        },
                        userTable: {
                            tableName: `${projectName}-${environment}-users`,
                            partitionKey: { name: 'userId', type: cdk.aws_dynamodb.AttributeType.STRING },
                            billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
                            pointInTimeRecovery: true,
                            deletionProtection: false,
                        },
                        documentMetadataTable: {
                            tableName: `${projectName}-${environment}-document-metadata`,
                            partitionKey: { name: 'documentId', type: cdk.aws_dynamodb.AttributeType.STRING },
                            billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
                            pointInTimeRecovery: true,
                            deletionProtection: false,
                        },
                        chatHistoryTable: {
                            tableName: `${projectName}-${environment}-chat-history`,
                            partitionKey: { name: 'chatId', type: cdk.aws_dynamodb.AttributeType.STRING },
                            sortKey: { name: 'timestamp', type: cdk.aws_dynamodb.AttributeType.NUMBER },
                            billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
                            pointInTimeRecovery: true,
                            deletionProtection: false,
                        },
                    },
                },
                opensearch: {
                    enabled: true,
                    collections: {
                        vectorCollection: {
                            name: `${projectName}-${environment}-vectors`,
                            type: 'VECTORSEARCH',
                            description: 'Document vector search collection',
                        },
                        logsCollection: {
                            name: `${projectName}-${environment}-logs`,
                            type: 'SEARCH',
                            description: 'Application logs collection',
                        },
                    },
                    securityPolicy: {
                        encryptionPolicyName: `${projectName}-${environment}-encryption-policy`,
                        networkPolicyName: `${projectName}-${environment}-network-policy`,
                        dataAccessPolicyName: `${projectName}-${environment}-data-access-policy`,
                    },
                    indices: {
                        vectorIndex: {
                            name: 'document-vectors',
                            vectorDimensions: 1536,
                            distanceMetric: 'cosine',
                        },
                    },
                },
                sqlite: {
                    enabled: false,
                    upsertManager: {
                        batchSize: 100,
                        maxRetries: 3,
                        timeoutSeconds: 30,
                        concurrency: 5,
                    },
                    database: {
                        filePath: '/tmp/app.db',
                        connectionPool: {
                            maxConnections: 10,
                            idleTimeoutSeconds: 300,
                        },
                    },
                },
                tags: {
                    DatabaseType: 'NoSQL',
                    DataClassification: 'Confidential',
                    BackupRequired: true,
                    EncryptionRequired: true,
                    PerformanceTier: 'High',
                    ComplianceFramework: 'SOC2',
                },
            };
            const mergedDatabaseConfig = this.mergeConfig(defaultDatabaseConfig, databaseConfig);
            this.databaseConstruct = new database_construct_1.DatabaseConstruct(this, 'Database', {
                config: mergedDatabaseConfig,
                projectName,
                environment,
                kmsKey: this.kmsKey,
            });
        }
        // CloudFormation出力
        this.createOutputs();
        // スタックレベルのタグ設定
        this.applyStackTags(projectName, environment);
    }
    /**
     * 設定のマージ（深いマージ）
     */
    mergeConfig(defaultConfig, overrideConfig) {
        return this.deepMerge(defaultConfig, overrideConfig);
    }
    /**
     * 深いマージ実装（型安全性とパフォーマンス向上）
     */
    deepMerge(target, source) {
        // null/undefinedチェックを最初に実行
        if (!target || !source) {
            return target;
        }
        const result = { ...target };
        // Object.keysを使用してより安全な反復処理
        Object.keys(source).forEach(key => {
            const typedKey = key;
            const sourceValue = source[typedKey];
            const targetValue = result[typedKey];
            if (sourceValue !== undefined) {
                // より厳密な型チェック
                if (this.isPlainObject(sourceValue) && this.isPlainObject(targetValue)) {
                    result[typedKey] = this.deepMerge(targetValue, sourceValue);
                }
                else {
                    result[typedKey] = sourceValue;
                }
            }
        });
        return result;
    }
    /**
     * プレーンオブジェクトかどうかを判定
     */
    isPlainObject(obj) {
        return typeof obj === 'object' &&
            obj !== null &&
            !Array.isArray(obj) &&
            obj.constructor === Object;
    }
    /**
     * 入力値の検証（セキュリティ対策）
     */
    validateInputs(props) {
        const { projectName, environment } = props;
        // プロジェクト名の検証
        if (!projectName || typeof projectName !== 'string') {
            throw new Error('プロジェクト名が設定されていません');
        }
        if (projectName.trim().length === 0) {
            throw new Error('プロジェクト名が空文字です');
        }
        if (projectName.length > 50) {
            throw new Error('プロジェクト名は50文字以内で設定してください');
        }
        // セキュリティ: 安全な文字のみ許可
        if (!/^[a-zA-Z0-9\-_]+$/.test(projectName)) {
            throw new Error('プロジェクト名に不正な文字が含まれています（英数字、ハイフン、アンダースコアのみ許可）');
        }
        // 環境名の検証
        const validEnvironments = ['dev', 'staging', 'prod', 'test'];
        if (!validEnvironments.includes(environment)) {
            throw new Error(`環境名は次のいずれかを指定してください: ${validEnvironments.join(', ')}`);
        }
        // リソース名の長さ制限チェック（AWS制限対応）
        const resourceNamePrefix = `${projectName}-${environment}`;
        if (resourceNamePrefix.length > 40) {
            throw new Error('プロジェクト名と環境名の組み合わせが長すぎます（40文字以内）');
        }
    }
    /**
     * デフォルトセキュリティ設定の取得（メモリ効率化）
     */
    getDefaultSecurityConfig(projectName, environment) {
        return {
            kms: {
                enableKeyRotation: true,
                keySpec: 'SYMMETRIC_DEFAULT',
                keyUsage: 'ENCRYPT_DECRYPT',
            },
            waf: {
                enabled: true,
                scope: 'REGIONAL',
                rules: {
                    enableAWSManagedRules: true,
                    enableRateLimiting: true,
                    rateLimit: 2000,
                    enableGeoBlocking: false,
                    blockedCountries: [],
                },
            },
            cloudTrail: {
                enabled: true,
                s3BucketName: `${projectName}-${environment}-cloudtrail`,
                includeGlobalServiceEvents: true,
                isMultiRegionTrail: true,
                enableLogFileValidation: true,
            },
            tags: {
                SecurityLevel: 'High',
                EncryptionRequired: true,
                ComplianceFramework: 'SOC2',
                DataClassification: 'Confidential',
            },
        };
    }
    /**
     * デフォルトネットワーキング設定の取得（メモリ効率化）
     */
    getDefaultNetworkingConfig() {
        return {
            vpcCidr: '10.0.0.0/16',
            maxAzs: 3,
            enablePublicSubnets: true,
            enablePrivateSubnets: true,
            enableIsolatedSubnets: true,
            enableNatGateway: true,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            enableFlowLogs: true,
            vpcEndpoints: {
                s3: true,
                dynamodb: true,
                lambda: true,
                opensearch: true,
            },
            securityGroups: {
                web: true,
                api: true,
                database: true,
                lambda: true,
            },
        };
    }
    /**
     * CloudFormation出力の作成
     */
    createOutputs() {
        // セキュリティ出力
        if (this.kmsKey) {
            new cdk.CfnOutput(this, 'KmsKeyId', {
                value: this.kmsKey.keyId,
                description: 'KMS Key ID',
                exportName: `${this.stackName}-KmsKeyId`,
            });
            new cdk.CfnOutput(this, 'KmsKeyArn', {
                value: this.kmsKey.keyArn,
                description: 'KMS Key ARN',
                exportName: `${this.stackName}-KmsKeyArn`,
            });
        }
        if (this.wafWebAcl) {
            new cdk.CfnOutput(this, 'WafWebAclArn', {
                value: this.wafWebAcl.attrArn,
                description: 'WAF WebACL ARN',
                exportName: `${this.stackName}-WafWebAclArn`,
            });
        }
        // ネットワーキング出力
        if (this.vpc) {
            new cdk.CfnOutput(this, 'VpcId', {
                value: this.vpc.vpcId,
                description: 'VPC ID',
                exportName: `${this.stackName}-VpcId`,
            });
            new cdk.CfnOutput(this, 'VpcCidr', {
                value: this.vpc.vpcCidrBlock,
                description: 'VPC CIDR Block',
                exportName: `${this.stackName}-VpcCidr`,
            });
            // アベイラビリティゾーン
            new cdk.CfnOutput(this, 'AvailabilityZones', {
                value: this.vpc.availabilityZones.join(','),
                description: 'Availability Zones',
                exportName: `${this.stackName}-AvailabilityZones`,
            });
        }
        // ストレージ出力
        if (this.storageConstruct) {
            if (this.storageConstruct.documentsBucket) {
                new cdk.CfnOutput(this, 'DocumentsBucketName', {
                    value: this.storageConstruct.documentsBucket.bucketName,
                    description: 'Documents S3 Bucket Name',
                    exportName: `${this.stackName}-DocumentsBucketName`,
                });
            }
            if (this.storageConstruct.fsxFileSystem) {
                new cdk.CfnOutput(this, 'FSxFileSystemId', {
                    value: this.storageConstruct.fsxFileSystem.ref,
                    description: 'FSx File System ID',
                    exportName: `${this.stackName}-FSxFileSystemId`,
                });
            }
        }
        // データベース出力
        if (this.databaseConstruct) {
            // DynamoDB テーブル
            Object.entries(this.databaseConstruct.dynamoTables).forEach(([name, table]) => {
                new cdk.CfnOutput(this, `DynamoTable${name}Name`, {
                    value: table.tableName,
                    description: `DynamoDB Table ${name} Name`,
                    exportName: `${this.stackName}-DynamoTable${name}Name`,
                });
            });
            // OpenSearch コレクション
            Object.entries(this.databaseConstruct.opensearchCollections).forEach(([name, collection]) => {
                new cdk.CfnOutput(this, `OpenSearchCollection${name}Endpoint`, {
                    value: collection.attrCollectionEndpoint,
                    description: `OpenSearch Collection ${name} Endpoint`,
                    exportName: `${this.stackName}-OpenSearchCollection${name}Endpoint`,
                });
            });
        }
    }
    /**
     * スタックレベルのタグ設定（保守性向上）
     */
    applyStackTags(projectName, environment) {
        // タグ値のサニタイズ（セキュリティ対策）
        const sanitizedProjectName = this.sanitizeTagValue(projectName);
        const sanitizedEnvironment = this.sanitizeTagValue(environment);
        const tags = {
            Project: sanitizedProjectName,
            Environment: sanitizedEnvironment,
            Stack: 'UnifiedIntegratedStack',
            Component: 'Integration',
            ManagedBy: 'CDK',
            Architecture: 'Unified',
            CostCenter: `${sanitizedProjectName}-${sanitizedEnvironment}-unified`,
            CreatedAt: new Date().toISOString().split('T')[0],
            Version: '1.0.0'
        };
        // 一括でタグを適用
        Object.entries(tags).forEach(([key, value]) => {
            cdk.Tags.of(this).add(key, value);
        });
    }
    /**
     * タグ値のサニタイズ（セキュリティ対策）
     */
    sanitizeTagValue(value) {
        return value
            .replace(/[<>\"'&]/g, '') // XSS対策
            .substring(0, 256) // AWS タグ値の最大長制限
            .trim();
    }
    /**
     * システム情報の取得
     */
    getSystemInfo() {
        return {
            stackName: this.stackName,
            region: this.region,
            account: this.account,
            enabledComponents: {
                security: !!this.securityConstruct,
                networking: !!this.networkingConstruct,
                storage: !!this.storageConstruct,
                database: !!this.databaseConstruct,
            },
            resources: {
                kmsKey: this.kmsKey?.keyArn || null,
                vpc: this.vpc?.vpcId || null,
                wafWebAcl: this.wafWebAcl?.attrArn || null,
            },
        };
    }
    /**
     * セキュリティリソースの取得
     */
    getSecurityResources() {
        return {
            kmsKey: this.kmsKey,
            wafWebAcl: this.wafWebAcl,
            securityConstruct: this.securityConstruct,
        };
    }
    /**
     * ネットワークリソースの取得
     */
    getNetworkResources() {
        if (!this.networkingConstruct) {
            return null;
        }
        return {
            vpc: this.vpc,
            publicSubnets: this.networkingConstruct.publicSubnets,
            privateSubnets: this.networkingConstruct.privateSubnets,
            isolatedSubnets: this.networkingConstruct.isolatedSubnets,
            securityGroups: this.networkingConstruct.securityGroups,
            networkingConstruct: this.networkingConstruct,
        };
    }
    /**
     * ストレージリソースの取得
     */
    getStorageResources() {
        return {
            storageConstruct: this.storageConstruct,
            documentsBucket: this.storageConstruct?.documentsBucket || null,
            backupBucket: this.storageConstruct?.backupBucket || null,
            fsxFileSystem: this.storageConstruct?.fsxFileSystem || null,
        };
    }
    /**
     * データベースリソースの取得
     */
    getDatabaseResources() {
        return {
            databaseConstruct: this.databaseConstruct,
            dynamoTables: this.databaseConstruct?.dynamoTables || {},
            opensearchCollections: this.databaseConstruct?.opensearchCollections || {},
        };
    }
}
exports.UnifiedIntegratedStack = UnifiedIntegratedStack;
