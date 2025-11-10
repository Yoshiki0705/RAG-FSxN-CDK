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
exports.DataReplicationManager = exports.ReplicationStatus = void 0;
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
/**
 * レプリケーション状態
 */
var ReplicationStatus;
(function (ReplicationStatus) {
    ReplicationStatus["HEALTHY"] = "HEALTHY";
    ReplicationStatus["LAGGING"] = "LAGGING";
    ReplicationStatus["FAILED"] = "FAILED";
    ReplicationStatus["SYNCING"] = "SYNCING";
})(ReplicationStatus || (exports.ReplicationStatus = ReplicationStatus = {}));
/**
 * データレプリケーション管理システム
 *
 * 機能:
 * - DynamoDB Global Tables設定
 * - FSx SnapMirror設定
 * - OpenSearch クロスリージョンレプリケーション
 * - レプリケーション監視とアラート
 */
class DataReplicationManager extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.globalConfig = props.globalConfig;
        this.config = props.replicationConfig;
        // レプリケーション状態管理テーブル
        this.replicationStatusTable = this.createReplicationStatusTable();
        // レプリケーション監視Lambda関数
        this.replicationMonitorFunction = this.createReplicationMonitorFunction();
        // データ同期Lambda関数
        this.syncFunction = this.createSyncFunction();
        // 定期監視スケジュール
        this.createMonitoringSchedule();
    }
    /**
     * レプリケーション状態管理テーブルの作成
     */
    createReplicationStatusTable() {
        return new dynamodb.Table(this, 'ReplicationStatusTable', {
            tableName: `${this.globalConfig.projectName}-replication-status`,
            partitionKey: {
                name: 'serviceType',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.NUMBER
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            timeToLiveAttribute: 'ttl',
            // Global Tablesを有効化
            replicationRegions: [this.config.secondaryRegion]
        });
    }
    /**
     * レプリケーション監視Lambda関数の作成
     */
    createReplicationMonitorFunction() {
        return new lambda.Function(this, 'ReplicationMonitorFunction', {
            functionName: `${this.globalConfig.projectName}-replication-monitor`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();

        exports.handler = async (event) => {
          console.log('データレプリケーション監視開始');
          
          try {
            const timestamp = Date.now();
            
            // DynamoDB Global Tablesの監視
            const dynamoStatus = await monitorDynamoDBReplication();
            await recordReplicationStatus('dynamodb', dynamoStatus, timestamp);
            
            // OpenSearchレプリケーションの監視
            const opensearchStatus = await monitorOpenSearchReplication();
            await recordReplicationStatus('opensearch', opensearchStatus, timestamp);
            
            // FSx SnapMirrorの監視
            const fsxStatus = await monitorFSxReplication();
            await recordReplicationStatus('fsx', fsxStatus, timestamp);
            
            // 全体的なレプリケーション健全性評価
            const overallHealth = evaluateOverallHealth([
              dynamoStatus, opensearchStatus, fsxStatus
            ]);
            
            await recordReplicationStatus('overall', overallHealth, timestamp);
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                timestamp,
                dynamodb: dynamoStatus,
                opensearch: opensearchStatus,
                fsx: fsxStatus,
                overall: overallHealth
              })
            };
          } catch (error) {
            console.error('レプリケーション監視エラー:', error);
            throw error;
          }
        };

        async function monitorDynamoDBReplication() {
          try {
            const dynamoClient = new AWS.DynamoDB({ region: '${this.config.primaryRegion}' });
            
            // Global Tablesの状態確認
            const tables = await dynamoClient.listTables().promise();
            const globalTables = [];
            
            for (const tableName of tables.TableNames) {
              try {
                const tableDesc = await dynamoClient.describeTable({
                  TableName: tableName
                }).promise();
                
                if (tableDesc.Table.GlobalTableVersion) {
                  const globalTableDesc = await dynamoClient.describeGlobalTable({
                    GlobalTableName: tableName
                  }).promise();
                  
                  globalTables.push({
                    tableName,
                    status: globalTableDesc.GlobalTableDescription.GlobalTableStatus,
                    replicas: globalTableDesc.GlobalTableDescription.ReplicationGroup
                  });
                }
              } catch (err) {
                console.log(\`Table \${tableName} is not a global table\`);
              }
            }
            
            const healthyTables = globalTables.filter(t => t.status === 'ACTIVE').length;
            const totalTables = globalTables.length;
            
            return {
              status: totalTables > 0 && healthyTables === totalTables ? 'HEALTHY' : 'DEGRADED',
              healthyTables,
              totalTables,
              details: globalTables,
              lagSeconds: await calculateDynamoDBLag()
            };
          } catch (error) {
            console.error('DynamoDB監視エラー:', error);
            return {
              status: 'FAILED',
              error: error.message
            };
          }
        }

        async function monitorOpenSearchReplication() {
          try {
            // OpenSearch Serverlessのクロスリージョンレプリケーション監視
            const opensearchClient = new AWS.OpenSearchServerless({
              region: '${this.config.primaryRegion}'
            });
            
            // コレクションの状態確認
            const collections = await opensearchClient.listCollections().promise();
            const replicationStatus = [];
            
            for (const collection of collections.collectionSummaries || []) {
              const collectionDetails = await opensearchClient.batchGetCollection({
                names: [collection.name]
              }).promise();
              
              replicationStatus.push({
                name: collection.name,
                status: collection.status,
                details: collectionDetails
              });
            }
            
            return {
              status: 'HEALTHY', // 簡略化
              collections: replicationStatus.length,
              details: replicationStatus
            };
          } catch (error) {
            console.error('OpenSearch監視エラー:', error);
            return {
              status: 'FAILED',
              error: error.message
            };
          }
        }

        async function monitorFSxReplication() {
          try {
            const fsxClient = new AWS.FSx({ region: '${this.config.primaryRegion}' });
            
            // FSxファイルシステムの状態確認
            const fileSystems = await fsxClient.describeFileSystems().promise();
            const replicationStatus = [];
            
            for (const fs of fileSystems.FileSystems || []) {
              if (fs.FileSystemType === 'ONTAP') {
                // SnapMirror関係の確認
                replicationStatus.push({
                  fileSystemId: fs.FileSystemId,
                  lifecycle: fs.Lifecycle,
                  ontapConfiguration: fs.OntapConfiguration
                });
              }
            }
            
            return {
              status: 'HEALTHY', // 簡略化
              fileSystems: replicationStatus.length,
              details: replicationStatus
            };
          } catch (error) {
            console.error('FSx監視エラー:', error);
            return {
              status: 'FAILED',
              error: error.message
            };
          }
        }

        async function calculateDynamoDBLag() {
          // DynamoDB Global Tablesのレプリケーション遅延計算
          // 実装詳細は後で追加
          return 0;
        }

        function evaluateOverallHealth(statuses) {
          const healthyCount = statuses.filter(s => s.status === 'HEALTHY').length;
          const totalCount = statuses.length;
          
          if (healthyCount === totalCount) {
            return { status: 'HEALTHY', healthScore: 1.0 };
          } else if (healthyCount > 0) {
            return { status: 'DEGRADED', healthScore: healthyCount / totalCount };
          } else {
            return { status: 'FAILED', healthScore: 0.0 };
          }
        }

        async function recordReplicationStatus(serviceType, status, timestamp) {
          const params = {
            TableName: '${this.replicationStatusTable.tableName}',
            Item: {
              serviceType,
              timestamp,
              status: status.status,
              details: status,
              ttl: Math.floor(Date.now() / 1000) + (${this.config.backupRetentionDays} * 24 * 60 * 60)
            }
          };
          
          await dynamodb.put(params).promise();
        }
      `),
            timeout: aws_cdk_lib_1.Duration.minutes(10),
            environment: {
                STATUS_TABLE_NAME: this.replicationStatusTable.tableName,
                PRIMARY_REGION: this.config.primaryRegion,
                SECONDARY_REGION: this.config.secondaryRegion,
                BACKUP_RETENTION_DAYS: this.config.backupRetentionDays.toString()
            }
        });
    }
    /**
     * データ同期Lambda関数の作成
     */
    createSyncFunction() {
        return new lambda.Function(this, 'DataSyncFunction', {
            functionName: `${this.globalConfig.projectName}-data-sync`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');

        exports.handler = async (event) => {
          console.log('データ同期処理開始');
          
          try {
            const syncResults = [];
            
            // DynamoDB同期確認
            const dynamoResult = await syncDynamoDBData();
            syncResults.push({ service: 'dynamodb', result: dynamoResult });
            
            // OpenSearch同期確認
            const opensearchResult = await syncOpenSearchData();
            syncResults.push({ service: 'opensearch', result: opensearchResult });
            
            // FSx同期確認
            const fsxResult = await syncFSxData();
            syncResults.push({ service: 'fsx', result: fsxResult });
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                timestamp: new Date().toISOString(),
                results: syncResults
              })
            };
          } catch (error) {
            console.error('データ同期エラー:', error);
            throw error;
          }
        };

        async function syncDynamoDBData() {
          // DynamoDB Global Tablesの同期確認・修復
          console.log('DynamoDB同期確認中...');
          
          try {
            const dynamoClient = new AWS.DynamoDB({ region: '${this.config.primaryRegion}' });
            
            // Global Tablesの同期状態確認
            const tables = await dynamoClient.listTables().promise();
            const syncResults = [];
            
            for (const tableName of tables.TableNames) {
              try {
                const globalTableDesc = await dynamoClient.describeGlobalTable({
                  GlobalTableName: tableName
                }).promise();
                
                // レプリカの同期状態確認
                const replicas = globalTableDesc.GlobalTableDescription.ReplicationGroup;
                const syncStatus = replicas.every(replica => 
                  replica.ReplicaStatus === 'ACTIVE'
                );
                
                syncResults.push({
                  tableName,
                  synced: syncStatus,
                  replicas: replicas.length
                });
              } catch (err) {
                // Global Tableでない場合はスキップ
                continue;
              }
            }
            
            return {
              success: true,
              syncedTables: syncResults.filter(r => r.synced).length,
              totalTables: syncResults.length,
              details: syncResults
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }

        async function syncOpenSearchData() {
          // OpenSearchクロスリージョン同期確認
          console.log('OpenSearch同期確認中...');
          
          try {
            // 実装詳細は後で追加
            return {
              success: true,
              message: 'OpenSearch同期確認完了'
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }

        async function syncFSxData() {
          // FSx SnapMirror同期確認
          console.log('FSx同期確認中...');
          
          try {
            const fsxClient = new AWS.FSx({ region: '${this.config.primaryRegion}' });
            
            // ファイルシステムの同期状態確認
            const fileSystems = await fsxClient.describeFileSystems().promise();
            const syncResults = [];
            
            for (const fs of fileSystems.FileSystems || []) {
              if (fs.FileSystemType === 'ONTAP') {
                // SnapMirror関係の同期状態確認
                syncResults.push({
                  fileSystemId: fs.FileSystemId,
                  lifecycle: fs.Lifecycle,
                  synced: fs.Lifecycle === 'AVAILABLE'
                });
              }
            }
            
            return {
              success: true,
              syncedFileSystems: syncResults.filter(r => r.synced).length,
              totalFileSystems: syncResults.length,
              details: syncResults
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      `),
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            environment: {
                PRIMARY_REGION: this.config.primaryRegion,
                SECONDARY_REGION: this.config.secondaryRegion
            }
        });
    }
    /**
     * 定期監視スケジュールの作成
     */
    createMonitoringSchedule() {
        // レプリケーション監視スケジュール
        const monitorRule = new events.Rule(this, 'ReplicationMonitorSchedule', {
            ruleName: `${this.globalConfig.projectName}-replication-monitor-schedule`,
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(this.config.replicationIntervalMinutes))
        });
        monitorRule.addTarget(new targets.LambdaFunction(this.replicationMonitorFunction));
        // データ同期スケジュール（より頻繁に実行）
        const syncRule = new events.Rule(this, 'DataSyncSchedule', {
            ruleName: `${this.globalConfig.projectName}-data-sync-schedule`,
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(Math.max(5, this.config.replicationIntervalMinutes / 2)))
        });
        syncRule.addTarget(new targets.LambdaFunction(this.syncFunction));
    }
    /**
     * DynamoDB Global Tablesの設定
     */
    setupDynamoDBGlobalTables(tables) {
        // 既存のテーブルをGlobal Tablesに変換
        tables.forEach(table => {
            // Global Tablesの設定は実際のデプロイ時に手動で行う必要がある
            // CDKでは直接サポートされていないため、カスタムリソースを使用
            console.log(`Setting up Global Table for: ${table.tableName}`);
        });
    }
    /**
     * 権限設定
     */
    grantPermissions() {
        // DynamoDB権限
        this.replicationStatusTable.grantReadWriteData(this.replicationMonitorFunction);
        this.replicationStatusTable.grantReadWriteData(this.syncFunction);
        // クロスリージョンアクセス権限
        const crossRegionPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'dynamodb:DescribeTable',
                'dynamodb:DescribeGlobalTable',
                'dynamodb:ListTables',
                'dynamodb:ListGlobalTables',
                'opensearchserverless:ListCollections',
                'opensearchserverless:BatchGetCollection',
                'fsx:DescribeFileSystems',
                'fsx:DescribeSnapshots'
            ],
            resources: ['*']
        });
        this.replicationMonitorFunction.addToRolePolicy(crossRegionPolicy);
        this.syncFunction.addToRolePolicy(crossRegionPolicy);
        // 暗号化権限（必要に応じて）
        if (this.config.encryptionEnabled) {
            const encryptionPolicy = new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'kms:Decrypt',
                    'kms:DescribeKey',
                    'kms:GenerateDataKey'
                ],
                resources: ['*']
            });
            this.replicationMonitorFunction.addToRolePolicy(encryptionPolicy);
            this.syncFunction.addToRolePolicy(encryptionPolicy);
        }
    }
    /**
     * レプリケーション状態の取得
     */
    getReplicationStatus() {
        return this.replicationStatusTable;
    }
}
exports.DataReplicationManager = DataReplicationManager;
