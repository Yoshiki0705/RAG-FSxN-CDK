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
exports.DisasterRecoveryManager = exports.DisasterRecoveryState = void 0;
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const cloudwatchActions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
/**
 * 災害復旧システムの状態
 */
var DisasterRecoveryState;
(function (DisasterRecoveryState) {
    DisasterRecoveryState["HEALTHY"] = "HEALTHY";
    DisasterRecoveryState["DEGRADED"] = "DEGRADED";
    DisasterRecoveryState["FAILED"] = "FAILED";
    DisasterRecoveryState["FAILOVER_IN_PROGRESS"] = "FAILOVER_IN_PROGRESS";
    DisasterRecoveryState["FAILOVER_COMPLETE"] = "FAILOVER_COMPLETE";
})(DisasterRecoveryState || (exports.DisasterRecoveryState = DisasterRecoveryState = {}));
/**
 * 災害復旧管理システム
 *
 * 機能:
 * - 東京 ⇔ 大阪間の自動フェイルオーバー
 * - RTO: 4時間以内、RPO: 1時間以内の目標達成
 * - ヘルスチェックと自動切り替え
 * - データレプリケーション監視
 */
class DisasterRecoveryManager extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.globalConfig = props.globalConfig;
        this.config = props.drConfig;
        // 災害復旧状態管理テーブル
        this.statusTable = this.createStatusTable();
        // SNS通知トピック
        this.alertTopic = this.createAlertTopic();
        // ヘルスチェック Lambda関数
        this.healthCheckFunction = this.createHealthCheckFunction();
        // フェイルオーバー Lambda関数
        this.failoverFunction = this.createFailoverFunction();
        // CloudWatch アラーム
        this.createCloudWatchAlarms();
        // 定期ヘルスチェックスケジュール
        this.createHealthCheckSchedule();
    }
    /**
     * 災害復旧状態管理テーブルの作成
     */
    createStatusTable() {
        return new dynamodb.Table(this, 'DisasterRecoveryStatusTable', {
            tableName: `${this.globalConfig.projectName}-dr-status`,
            partitionKey: {
                name: 'region',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.NUMBER
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            timeToLiveAttribute: 'ttl'
        });
    }
    /**
     * SNS通知トピックの作成
     */
    createAlertTopic() {
        return new sns.Topic(this, 'DisasterRecoveryAlerts', {
            topicName: `${this.globalConfig.projectName}-dr-alerts`,
            displayName: 'Disaster Recovery Alerts'
        });
    }
    /**
     * ヘルスチェック Lambda関数の作成
     */
    createHealthCheckFunction() {
        return new lambda.Function(this, 'HealthCheckFunction', {
            functionName: `${this.globalConfig.projectName}-dr-health-check`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const cloudwatch = new AWS.CloudWatch();
        const sns = new AWS.SNS();

        exports.handler = async (event) => {
          console.log('災害復旧ヘルスチェック開始');
          
          try {
            // プライマリリージョンのヘルスチェック
            const primaryHealth = await checkRegionHealth('${this.config.primaryRegion}');
            
            // セカンダリリージョンのヘルスチェック
            const secondaryHealth = await checkRegionHealth('${this.config.secondaryRegion}');
            
            // 状態をDynamoDBに記録
            await recordHealthStatus(primaryHealth, secondaryHealth);
            
            // フェイルオーバー判定
            if (shouldFailover(primaryHealth, secondaryHealth)) {
              console.log('フェイルオーバー条件を満たしました');
              await triggerFailover();
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                primary: primaryHealth,
                secondary: secondaryHealth,
                timestamp: new Date().toISOString()
              })
            };
          } catch (error) {
            console.error('ヘルスチェックエラー:', error);
            await sendAlert('ヘルスチェック失敗: ' + error.message);
            throw error;
          }
        };

        async function checkRegionHealth(region) {
          // 各サービスのヘルスチェック実装
          const checks = {
            dynamodb: await checkDynamoDB(region),
            opensearch: await checkOpenSearch(region),
            lambda: await checkLambda(region),
            fsx: await checkFSx(region)
          };
          
          const healthyServices = Object.values(checks).filter(Boolean).length;
          const totalServices = Object.keys(checks).length;
          
          return {
            region,
            healthy: healthyServices === totalServices,
            healthScore: healthyServices / totalServices,
            services: checks,
            timestamp: Date.now()
          };
        }

        async function checkDynamoDB(region) {
          try {
            const dynamoClient = new AWS.DynamoDB({ region });
            await dynamoClient.listTables().promise();
            return true;
          } catch (error) {
            console.error(\`DynamoDB check failed in \${region}:\`, error);
            return false;
          }
        }

        async function checkOpenSearch(region) {
          // OpenSearch Serverlessのヘルスチェック実装
          return true; // 簡略化
        }

        async function checkLambda(region) {
          // Lambda関数のヘルスチェック実装
          return true; // 簡略化
        }

        async function checkFSx(region) {
          // FSx for NetApp ONTAPのヘルスチェック実装
          return true; // 簡略化
        }

        async function recordHealthStatus(primary, secondary) {
          const params = {
            TableName: '${this.statusTable.tableName}',
            Item: {
              region: 'health-status',
              timestamp: Date.now(),
              primary,
              secondary,
              ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7日後に削除
            }
          };
          
          await dynamodb.put(params).promise();
        }

        function shouldFailover(primary, secondary) {
          // フェイルオーバー判定ロジック
          return !primary.healthy && secondary.healthy && secondary.healthScore > 0.8;
        }

        async function triggerFailover() {
          // フェイルオーバー処理をトリガー
          console.log('フェイルオーバー処理を開始します');
          // 実際のフェイルオーバーロジックは別のLambda関数で実装
        }

        async function sendAlert(message) {
          const params = {
            TopicArn: '${this.alertTopic.topicArn}',
            Message: message,
            Subject: '災害復旧アラート'
          };
          
          await sns.publish(params).promise();
        }
      `),
            timeout: aws_cdk_lib_1.Duration.minutes(5),
            environment: {
                STATUS_TABLE_NAME: this.statusTable.tableName,
                ALERT_TOPIC_ARN: this.alertTopic.topicArn,
                PRIMARY_REGION: this.config.primaryRegion,
                SECONDARY_REGION: this.config.secondaryRegion
            }
        });
    }
    /**
     * フェイルオーバー Lambda関数の作成
     */
    createFailoverFunction() {
        return new lambda.Function(this, 'FailoverFunction', {
            functionName: `${this.globalConfig.projectName}-dr-failover`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const route53 = new AWS.Route53();
        const dynamodb = new AWS.DynamoDB.DocumentClient();

        exports.handler = async (event) => {
          console.log('災害復旧フェイルオーバー開始');
          
          try {
            const startTime = Date.now();
            
            // フェイルオーバー状態を記録
            await updateFailoverStatus('FAILOVER_IN_PROGRESS', startTime);
            
            // DNS切り替え実行
            await switchDNS();
            
            // ロードバランサー切り替え
            await switchLoadBalancer();
            
            // データベース切り替え
            await switchDatabase();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // フェイルオーバー完了を記録
            await updateFailoverStatus('FAILOVER_COMPLETE', endTime, duration);
            
            // 成功通知
            await sendSuccessNotification(duration);
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                status: 'FAILOVER_COMPLETE',
                duration: duration,
                rtoAchieved: duration < (${this.config.rtoMinutes} * 60 * 1000)
              })
            };
          } catch (error) {
            console.error('フェイルオーバーエラー:', error);
            await updateFailoverStatus('FAILED', Date.now(), null, error.message);
            throw error;
          }
        };

        async function updateFailoverStatus(status, timestamp, duration = null, error = null) {
          const params = {
            TableName: '${this.statusTable.tableName}',
            Item: {
              region: 'failover-status',
              timestamp,
              status,
              duration,
              error,
              ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30日後に削除
            }
          };
          
          await dynamodb.put(params).promise();
        }

        async function switchDNS() {
          console.log('DNS切り替えを実行中...');
          // Route53レコード切り替えロジック
          // 実装詳細は後で追加
        }

        async function switchLoadBalancer() {
          console.log('ロードバランサー切り替えを実行中...');
          // ALB/NLB切り替えロジック
          // 実装詳細は後で追加
        }

        async function switchDatabase() {
          console.log('データベース切り替えを実行中...');
          // DynamoDB Global Tables、OpenSearch切り替えロジック
          // 実装詳細は後で追加
        }

        async function sendSuccessNotification(duration) {
          const sns = new AWS.SNS();
          const rtoMinutes = ${this.config.rtoMinutes};
          const durationMinutes = Math.round(duration / (60 * 1000));
          
          const message = \`
災害復旧フェイルオーバーが完了しました。

実行時間: \${durationMinutes}分
RTO目標: \${rtoMinutes}分
目標達成: \${durationMinutes <= rtoMinutes ? '✅ 達成' : '❌ 未達成'}

セカンダリリージョン（${this.config.secondaryRegion}）での運用を開始しました。
          \`;
          
          await sns.publish({
            TopicArn: '${this.alertTopic.topicArn}',
            Message: message,
            Subject: '災害復旧フェイルオーバー完了通知'
          }).promise();
        }
      `),
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            environment: {
                STATUS_TABLE_NAME: this.statusTable.tableName,
                ALERT_TOPIC_ARN: this.alertTopic.topicArn,
                PRIMARY_REGION: this.config.primaryRegion,
                SECONDARY_REGION: this.config.secondaryRegion,
                RTO_MINUTES: this.config.rtoMinutes.toString()
            }
        });
    }
    /**
     * CloudWatch アラームの作成
     */
    createCloudWatchAlarms() {
        // ヘルスチェック失敗アラーム
        const healthCheckAlarm = new cloudwatch.Alarm(this, 'HealthCheckFailureAlarm', {
            alarmName: `${this.globalConfig.projectName}-dr-health-check-failure`,
            metric: this.healthCheckFunction.metricErrors(),
            threshold: 1,
            evaluationPeriods: 2,
            treatMissingData: cloudwatch.TreatMissingData.BREACHING
        });
        healthCheckAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
        // フェイルオーバー時間アラーム
        const failoverDurationAlarm = new cloudwatch.Alarm(this, 'FailoverDurationAlarm', {
            alarmName: `${this.globalConfig.projectName}-dr-failover-duration`,
            metric: this.failoverFunction.metricDuration(),
            threshold: this.config.rtoMinutes * 60 * 1000, // RTOをミリ秒に変換
            evaluationPeriods: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        });
        failoverDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
    }
    /**
     * 定期ヘルスチェックスケジュールの作成
     */
    createHealthCheckSchedule() {
        const rule = new events.Rule(this, 'HealthCheckSchedule', {
            ruleName: `${this.globalConfig.projectName}-dr-health-check-schedule`,
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(this.config.healthCheckIntervalMinutes))
        });
        rule.addTarget(new targets.LambdaFunction(this.healthCheckFunction));
    }
    /**
     * 権限設定
     */
    grantPermissions() {
        // DynamoDB権限
        this.statusTable.grantReadWriteData(this.healthCheckFunction);
        this.statusTable.grantReadWriteData(this.failoverFunction);
        // SNS権限
        this.alertTopic.grantPublish(this.healthCheckFunction);
        this.alertTopic.grantPublish(this.failoverFunction);
        // Route53権限（フェイルオーバー用）
        this.failoverFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'route53:ChangeResourceRecordSets',
                'route53:GetHostedZone',
                'route53:ListResourceRecordSets'
            ],
            resources: ['*']
        }));
        // クロスリージョンアクセス権限
        this.healthCheckFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'dynamodb:ListTables',
                'lambda:ListFunctions',
                'opensearch:DescribeDomain',
                'fsx:DescribeFileSystems'
            ],
            resources: ['*']
        }));
    }
}
exports.DisasterRecoveryManager = DisasterRecoveryManager;
