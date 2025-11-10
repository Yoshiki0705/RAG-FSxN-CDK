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
exports.MonitoringConstruct = void 0;
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const subscriptions = __importStar(require("aws-cdk-lib/aws-sns-subscriptions"));
/**
 * 監視・運用統合コンストラクト
 */
class MonitoringConstruct extends constructs_1.Construct {
    constructor(scope, id, config, props) {
        super(scope, id);
        /** CloudWatch アラーム */
        this.alarms = [];
        // SNS アラートトピック
        if (config.features.enableAlerts) {
            this.alertTopic = this.createAlertTopic(config);
        }
        // CloudWatch ダッシュボード
        if (config.features.enableCloudWatch) {
            this.dashboard = this.createDashboard(config, props);
        }
        // アラームの設定
        if (config.features.enableAlerts && this.alertTopic) {
            this.createAlarms(config, props);
        }
    }
    /**
     * SNS アラートトピックの作成
     */
    createAlertTopic(config) {
        const topic = new sns.Topic(this, 'AlertTopic', {
            topicName: config.alerts.snsTopicName,
            displayName: 'RAG System Alerts',
        });
        // メール通知の設定
        config.alerts.notificationEmails.forEach((email, index) => {
            topic.addSubscription(new subscriptions.EmailSubscription(email));
        });
        return topic;
    }
    /**
     * CloudWatch ダッシュボードの作成
     */
    createDashboard(config, props) {
        const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
            dashboardName: config.cloudWatch.dashboardName,
        });
        const widgets = [];
        // Lambda メトリクス
        if (props?.lambdaFunctions && props.lambdaFunctions.length > 0) {
            widgets.push(this.createLambdaWidget(props.lambdaFunctions));
        }
        // API Gateway メトリクス
        if (props?.apiGateway) {
            widgets.push(this.createApiGatewayWidget(props.apiGateway));
        }
        // DynamoDB メトリクス
        if (props?.dynamodbTables && props.dynamodbTables.length > 0) {
            widgets.push(this.createDynamoDBWidget(props.dynamodbTables));
        }
        // ウィジェットをダッシュボードに追加
        widgets.forEach(widget => {
            dashboard.addWidgets(widget);
        });
        return dashboard;
    }
    /**
     * Lambda ウィジェットの作成
     */
    createLambdaWidget(functions) {
        const metrics = [];
        functions.forEach(func => {
            metrics.push(func.metricInvocations());
            metrics.push(func.metricErrors());
            metrics.push(func.metricDuration());
        });
        return new cloudwatch.GraphWidget({
            title: 'Lambda Functions',
            left: metrics,
            width: 12,
            height: 6,
        });
    }
    /**
     * API Gateway ウィジェットの作成
     */
    createApiGatewayWidget(api) {
        return new cloudwatch.GraphWidget({
            title: 'API Gateway',
            left: [
                api.metricCount(),
                api.metricLatency(),
                api.metricClientError(),
                api.metricServerError(),
            ],
            width: 12,
            height: 6,
        });
    }
    /**
     * DynamoDB ウィジェットの作成
     */
    createDynamoDBWidget(tables) {
        const metrics = [];
        tables.forEach(table => {
            metrics.push(table.metricConsumedReadCapacityUnits());
            metrics.push(table.metricConsumedWriteCapacityUnits());
        });
        return new cloudwatch.GraphWidget({
            title: 'DynamoDB Tables',
            left: metrics,
            width: 12,
            height: 6,
        });
    }
    /**
     * アラームの作成
     */
    createAlarms(config, props) {
        // Lambda エラー率アラーム
        if (config.alerts.alarms.lambdaErrorRate.enabled && props?.lambdaFunctions) {
            props.lambdaFunctions.forEach((func, index) => {
                const alarm = new cloudwatch.Alarm(this, `LambdaErrorAlarm${index}`, {
                    alarmName: `${func.functionName}-error-rate`,
                    alarmDescription: `High error rate for ${func.functionName}`,
                    metric: func.metricErrors({
                        period: aws_cdk_lib_1.Duration.minutes(5),
                    }),
                    threshold: config.alerts.alarms.lambdaErrorRate.threshold,
                    evaluationPeriods: config.alerts.alarms.lambdaErrorRate.evaluationPeriods,
                });
                if (this.alertTopic) {
                    alarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
                }
                this.alarms.push(alarm);
            });
        }
        // API Gateway レスポンス時間アラーム
        if (config.alerts.alarms.apiResponseTime.enabled && props?.apiGateway) {
            const alarm = new cloudwatch.Alarm(this, 'ApiResponseTimeAlarm', {
                alarmName: `${props.apiGateway.restApiName}-response-time`,
                alarmDescription: `High response time for ${props.apiGateway.restApiName}`,
                metric: props.apiGateway.metricLatency({
                    period: aws_cdk_lib_1.Duration.minutes(5),
                }),
                threshold: config.alerts.alarms.apiResponseTime.threshold.toMilliseconds(),
                evaluationPeriods: config.alerts.alarms.apiResponseTime.evaluationPeriods,
            });
            if (this.alertTopic) {
                alarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
            }
            this.alarms.push(alarm);
        }
        // DynamoDB スロットリングアラーム
        if (config.alerts.alarms.dynamodbThrottling.enabled && props?.dynamodbTables) {
            props.dynamodbTables.forEach((table, index) => {
                const alarm = new cloudwatch.Alarm(this, `DynamoDBThrottleAlarm${index}`, {
                    alarmName: `${table.tableName}-throttling`,
                    alarmDescription: `Throttling detected for ${table.tableName}`,
                    metric: table.metricThrottledRequests({
                        period: aws_cdk_lib_1.Duration.minutes(5),
                    }),
                    threshold: config.alerts.alarms.dynamodbThrottling.threshold,
                    evaluationPeriods: config.alerts.alarms.dynamodbThrottling.evaluationPeriods,
                });
                if (this.alertTopic) {
                    alarm.addAlarmAction(new cloudwatch.SnsAction(this.alertTopic));
                }
                this.alarms.push(alarm);
            });
        }
    }
}
exports.MonitoringConstruct = MonitoringConstruct;
