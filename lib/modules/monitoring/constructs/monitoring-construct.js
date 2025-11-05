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
    /** CloudWatch ダッシュボード */
    dashboard;
    /** SNS アラートトピック */
    alertTopic;
    /** CloudWatch アラーム */
    alarms = [];
    constructor(scope, id, config, props) {
        super(scope, id);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb25pdG9yaW5nLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUF1QztBQUN2Qyw2Q0FBc0Q7QUFDdEQsdUVBQXlEO0FBRXpELHlEQUEyQztBQUMzQyxpRkFBbUU7QUFNbkU7O0dBRUc7QUFDSCxNQUFhLG1CQUFvQixTQUFRLHNCQUFTO0lBQ2hELHlCQUF5QjtJQUNULFNBQVMsQ0FBd0I7SUFDakQsbUJBQW1CO0lBQ0gsVUFBVSxDQUFhO0lBQ3ZDLHNCQUFzQjtJQUNOLE1BQU0sR0FBdUIsRUFBRSxDQUFDO0lBRWhELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsTUFBd0IsRUFBRSxLQUluRTtRQUNDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsZUFBZTtRQUNmLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQscUJBQXFCO1FBQ3JCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELFVBQVU7UUFDVixJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwRCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuQyxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0ssZ0JBQWdCLENBQUMsTUFBd0I7UUFDL0MsTUFB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QUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLENBQUM7Z0JBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBcE5ELGtEQW9OQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgRHVyYXRpb24sIFJlbW92YWxQb2xpY3kgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0ICogYXMgc3Vic2NyaXB0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0IHsgTW9uaXRvcmluZ0NvbmZpZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvbW9uaXRvcmluZy1jb25maWcnO1xuXG4vKipcbiAqIOebo+imluODu+mBi+eUqOe1seWQiOOCs+ODs+OCueODiOODqeOCr+ODiFxuICovXG5leHBvcnQgY2xhc3MgTW9uaXRvcmluZ0NvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIC8qKiBDbG91ZFdhdGNoIOODgOODg+OCt+ODpeODnOODvOODiSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZGFzaGJvYXJkPzogY2xvdWR3YXRjaC5EYXNoYm9hcmQ7XG4gIC8qKiBTTlMg44Ki44Op44O844OI44OI44OU44OD44KvICovXG4gIHB1YmxpYyByZWFkb25seSBhbGVydFRvcGljPzogc25zLlRvcGljO1xuICAvKiogQ2xvdWRXYXRjaCDjgqLjg6njg7zjg6AgKi9cbiAgcHVibGljIHJlYWRvbmx5IGFsYXJtczogY2xvdWR3YXRjaC5BbGFybVtdID0gW107XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgY29uZmlnOiBNb25pdG9yaW5nQ29uZmlnLCBwcm9wcz86IHtcbiAgICBsYW1iZGFGdW5jdGlvbnM/OiBsYW1iZGEuRnVuY3Rpb25bXTtcbiAgICBhcGlHYXRld2F5PzogYXBpZ2F0ZXdheS5SZXN0QXBpO1xuICAgIGR5bmFtb2RiVGFibGVzPzogZHluYW1vZGIuVGFibGVbXTtcbiAgfSkge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBTTlMg44Ki44Op44O844OI44OI44OU44OD44KvXG4gICAgaWYgKGNvbmZpZy5mZWF0dXJlcy5lbmFibGVBbGVydHMpIHtcbiAgICAgIHRoaXMuYWxlcnRUb3BpYyA9IHRoaXMuY3JlYXRlQWxlcnRUb3BpYyhjb25maWcpO1xuICAgIH1cblxuICAgIC8vIENsb3VkV2F0Y2gg44OA44OD44K344Ol44Oc44O844OJXG4gICAgaWYgKGNvbmZpZy5mZWF0dXJlcy5lbmFibGVDbG91ZFdhdGNoKSB7XG4gICAgICB0aGlzLmRhc2hib2FyZCA9IHRoaXMuY3JlYXRlRGFzaGJvYXJkKGNvbmZpZywgcHJvcHMpO1xuICAgIH1cblxuICAgIC8vIOOCouODqeODvOODoOOBruioreWumlxuICAgIGlmIChjb25maWcuZmVhdHVyZXMuZW5hYmxlQWxlcnRzICYmIHRoaXMuYWxlcnRUb3BpYykge1xuICAgICAgdGhpcy5jcmVhdGVBbGFybXMoY29uZmlnLCBwcm9wcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNOUyDjgqLjg6njg7zjg4jjg4jjg5Tjg4Pjgq/jga7kvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQWxlcnRUb3BpYyhjb25maWc6IE1vbml0b3JpbmdDb25maWcpOiBzbnMuVG9waWMge1xuICAgIGNvbnN0IHRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQWxlcnRUb3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogY29uZmlnLmFsZXJ0cy5zbnNUb3BpY05hbWUsXG4gICAgICBkaXNwbGF5TmFtZTogJ1JBRyBTeXN0ZW0gQWxlcnRzJyxcbiAgICB9KTtcblxuICAgIC8vIOODoeODvOODq+mAmuefpeOBruioreWumlxuICAgIGNvbmZpZy5hbGVydHMubm90aWZpY2F0aW9uRW1haWxzLmZvckVhY2goKGVtYWlsLCBpbmRleCkgPT4ge1xuICAgICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKFxuICAgICAgICBuZXcgc3Vic2NyaXB0aW9ucy5FbWFpbFN1YnNjcmlwdGlvbihlbWFpbClcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdG9waWM7XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRXYXRjaCDjg4Djg4Pjgrfjg6Xjg5zjg7zjg4njga7kvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRGFzaGJvYXJkKGNvbmZpZzogTW9uaXRvcmluZ0NvbmZpZywgcHJvcHM/OiB7XG4gICAgbGFtYmRhRnVuY3Rpb25zPzogbGFtYmRhLkZ1bmN0aW9uW107XG4gICAgYXBpR2F0ZXdheT86IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgICBkeW5hbW9kYlRhYmxlcz86IGR5bmFtb2RiLlRhYmxlW107XG4gIH0pOiBjbG91ZHdhdGNoLkRhc2hib2FyZCB7XG4gICAgY29uc3QgZGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdEYXNoYm9hcmQnLCB7XG4gICAgICBkYXNoYm9hcmROYW1lOiBjb25maWcuY2xvdWRXYXRjaC5kYXNoYm9hcmROYW1lLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgd2lkZ2V0czogY2xvdWR3YXRjaC5JV2lkZ2V0W10gPSBbXTtcblxuICAgIC8vIExhbWJkYSDjg6Hjg4jjg6rjgq/jgrlcbiAgICBpZiAocHJvcHM/LmxhbWJkYUZ1bmN0aW9ucyAmJiBwcm9wcy5sYW1iZGFGdW5jdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgd2lkZ2V0cy5wdXNoKHRoaXMuY3JlYXRlTGFtYmRhV2lkZ2V0KHByb3BzLmxhbWJkYUZ1bmN0aW9ucykpO1xuICAgIH1cblxuICAgIC8vIEFQSSBHYXRld2F5IOODoeODiOODquOCr+OCuVxuICAgIGlmIChwcm9wcz8uYXBpR2F0ZXdheSkge1xuICAgICAgd2lkZ2V0cy5wdXNoKHRoaXMuY3JlYXRlQXBpR2F0ZXdheVdpZGdldChwcm9wcy5hcGlHYXRld2F5KSk7XG4gICAgfVxuXG4gICAgLy8gRHluYW1vREIg44Oh44OI44Oq44Kv44K5XG4gICAgaWYgKHByb3BzPy5keW5hbW9kYlRhYmxlcyAmJiBwcm9wcy5keW5hbW9kYlRhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB3aWRnZXRzLnB1c2godGhpcy5jcmVhdGVEeW5hbW9EQldpZGdldChwcm9wcy5keW5hbW9kYlRhYmxlcykpO1xuICAgIH1cblxuICAgIC8vIOOCpuOCo+OCuOOCp+ODg+ODiOOCkuODgOODg+OCt+ODpeODnOODvOODieOBq+i/veWKoFxuICAgIHdpZGdldHMuZm9yRWFjaCh3aWRnZXQgPT4ge1xuICAgICAgZGFzaGJvYXJkLmFkZFdpZGdldHMod2lkZ2V0KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXNoYm9hcmQ7XG4gIH1cblxuICAvKipcbiAgICogTGFtYmRhIOOCpuOCo+OCuOOCp+ODg+ODiOOBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVMYW1iZGFXaWRnZXQoZnVuY3Rpb25zOiBsYW1iZGEuRnVuY3Rpb25bXSk6IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQge1xuICAgIGNvbnN0IG1ldHJpY3M6IGNsb3Vkd2F0Y2guSU1ldHJpY1tdID0gW107XG5cbiAgICBmdW5jdGlvbnMuZm9yRWFjaChmdW5jID0+IHtcbiAgICAgIG1ldHJpY3MucHVzaChmdW5jLm1ldHJpY0ludm9jYXRpb25zKCkpO1xuICAgICAgbWV0cmljcy5wdXNoKGZ1bmMubWV0cmljRXJyb3JzKCkpO1xuICAgICAgbWV0cmljcy5wdXNoKGZ1bmMubWV0cmljRHVyYXRpb24oKSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgdGl0bGU6ICdMYW1iZGEgRnVuY3Rpb25zJyxcbiAgICAgIGxlZnQ6IG1ldHJpY3MsXG4gICAgICB3aWR0aDogMTIsXG4gICAgICBoZWlnaHQ6IDYsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQVBJIEdhdGV3YXkg44Km44Kj44K444Kn44OD44OI44Gu5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUFwaUdhdGV3YXlXaWRnZXQoYXBpOiBhcGlnYXRld2F5LlJlc3RBcGkpOiBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0IHtcbiAgICByZXR1cm4gbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgdGl0bGU6ICdBUEkgR2F0ZXdheScsXG4gICAgICBsZWZ0OiBbXG4gICAgICAgIGFwaS5tZXRyaWNDb3VudCgpLFxuICAgICAgICBhcGkubWV0cmljTGF0ZW5jeSgpLFxuICAgICAgICBhcGkubWV0cmljQ2xpZW50RXJyb3IoKSxcbiAgICAgICAgYXBpLm1ldHJpY1NlcnZlckVycm9yKCksXG4gICAgICBdLFxuICAgICAgd2lkdGg6IDEyLFxuICAgICAgaGVpZ2h0OiA2LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIER5bmFtb0RCIOOCpuOCo+OCuOOCp+ODg+ODiOOBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVEeW5hbW9EQldpZGdldCh0YWJsZXM6IGR5bmFtb2RiLlRhYmxlW10pOiBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0IHtcbiAgICBjb25zdCBtZXRyaWNzOiBjbG91ZHdhdGNoLklNZXRyaWNbXSA9IFtdO1xuXG4gICAgdGFibGVzLmZvckVhY2godGFibGUgPT4ge1xuICAgICAgbWV0cmljcy5wdXNoKHRhYmxlLm1ldHJpY0NvbnN1bWVkUmVhZENhcGFjaXR5VW5pdHMoKSk7XG4gICAgICBtZXRyaWNzLnB1c2godGFibGUubWV0cmljQ29uc3VtZWRXcml0ZUNhcGFjaXR5VW5pdHMoKSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgdGl0bGU6ICdEeW5hbW9EQiBUYWJsZXMnLFxuICAgICAgbGVmdDogbWV0cmljcyxcbiAgICAgIHdpZHRoOiAxMixcbiAgICAgIGhlaWdodDogNixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgqLjg6njg7zjg6Djga7kvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQWxhcm1zKGNvbmZpZzogTW9uaXRvcmluZ0NvbmZpZywgcHJvcHM/OiB7XG4gICAgbGFtYmRhRnVuY3Rpb25zPzogbGFtYmRhLkZ1bmN0aW9uW107XG4gICAgYXBpR2F0ZXdheT86IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgICBkeW5hbW9kYlRhYmxlcz86IGR5bmFtb2RiLlRhYmxlW107XG4gIH0pOiB2b2lkIHtcbiAgICAvLyBMYW1iZGEg44Ko44Op44O8546H44Ki44Op44O844OgXG4gICAgaWYgKGNvbmZpZy5hbGVydHMuYWxhcm1zLmxhbWJkYUVycm9yUmF0ZS5lbmFibGVkICYmIHByb3BzPy5sYW1iZGFGdW5jdGlvbnMpIHtcbiAgICAgIHByb3BzLmxhbWJkYUZ1bmN0aW9ucy5mb3JFYWNoKChmdW5jLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBhbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsIGBMYW1iZGFFcnJvckFsYXJtJHtpbmRleH1gLCB7XG4gICAgICAgICAgYWxhcm1OYW1lOiBgJHtmdW5jLmZ1bmN0aW9uTmFtZX0tZXJyb3ItcmF0ZWAsXG4gICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogYEhpZ2ggZXJyb3IgcmF0ZSBmb3IgJHtmdW5jLmZ1bmN0aW9uTmFtZX1gLFxuICAgICAgICAgIG1ldHJpYzogZnVuYy5tZXRyaWNFcnJvcnMoe1xuICAgICAgICAgICAgcGVyaW9kOiBEdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRocmVzaG9sZDogY29uZmlnLmFsZXJ0cy5hbGFybXMubGFtYmRhRXJyb3JSYXRlLnRocmVzaG9sZCxcbiAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogY29uZmlnLmFsZXJ0cy5hbGFybXMubGFtYmRhRXJyb3JSYXRlLmV2YWx1YXRpb25QZXJpb2RzLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5hbGVydFRvcGljKSB7XG4gICAgICAgICAgYWxhcm0uYWRkQWxhcm1BY3Rpb24obmV3IGNsb3Vkd2F0Y2guU25zQWN0aW9uKHRoaXMuYWxlcnRUb3BpYykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbGFybXMucHVzaChhbGFybSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBBUEkgR2F0ZXdheSDjg6zjgrnjg53jg7PjgrnmmYLplpPjgqLjg6njg7zjg6BcbiAgICBpZiAoY29uZmlnLmFsZXJ0cy5hbGFybXMuYXBpUmVzcG9uc2VUaW1lLmVuYWJsZWQgJiYgcHJvcHM/LmFwaUdhdGV3YXkpIHtcbiAgICAgIGNvbnN0IGFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0FwaVJlc3BvbnNlVGltZUFsYXJtJywge1xuICAgICAgICBhbGFybU5hbWU6IGAke3Byb3BzLmFwaUdhdGV3YXkucmVzdEFwaU5hbWV9LXJlc3BvbnNlLXRpbWVgLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiBgSGlnaCByZXNwb25zZSB0aW1lIGZvciAke3Byb3BzLmFwaUdhdGV3YXkucmVzdEFwaU5hbWV9YCxcbiAgICAgICAgbWV0cmljOiBwcm9wcy5hcGlHYXRld2F5Lm1ldHJpY0xhdGVuY3koe1xuICAgICAgICAgIHBlcmlvZDogRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSksXG4gICAgICAgIHRocmVzaG9sZDogY29uZmlnLmFsZXJ0cy5hbGFybXMuYXBpUmVzcG9uc2VUaW1lLnRocmVzaG9sZC50b01pbGxpc2Vjb25kcygpLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogY29uZmlnLmFsZXJ0cy5hbGFybXMuYXBpUmVzcG9uc2VUaW1lLmV2YWx1YXRpb25QZXJpb2RzLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLmFsZXJ0VG9waWMpIHtcbiAgICAgICAgYWxhcm0uYWRkQWxhcm1BY3Rpb24obmV3IGNsb3Vkd2F0Y2guU25zQWN0aW9uKHRoaXMuYWxlcnRUb3BpYykpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmFsYXJtcy5wdXNoKGFsYXJtKTtcbiAgICB9XG5cbiAgICAvLyBEeW5hbW9EQiDjgrnjg63jg4Pjg4jjg6rjg7PjgrDjgqLjg6njg7zjg6BcbiAgICBpZiAoY29uZmlnLmFsZXJ0cy5hbGFybXMuZHluYW1vZGJUaHJvdHRsaW5nLmVuYWJsZWQgJiYgcHJvcHM/LmR5bmFtb2RiVGFibGVzKSB7XG4gICAgICBwcm9wcy5keW5hbW9kYlRhYmxlcy5mb3JFYWNoKCh0YWJsZSwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgYWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBgRHluYW1vREJUaHJvdHRsZUFsYXJtJHtpbmRleH1gLCB7XG4gICAgICAgICAgYWxhcm1OYW1lOiBgJHt0YWJsZS50YWJsZU5hbWV9LXRocm90dGxpbmdgLFxuICAgICAgICAgIGFsYXJtRGVzY3JpcHRpb246IGBUaHJvdHRsaW5nIGRldGVjdGVkIGZvciAke3RhYmxlLnRhYmxlTmFtZX1gLFxuICAgICAgICAgIG1ldHJpYzogdGFibGUubWV0cmljVGhyb3R0bGVkUmVxdWVzdHMoe1xuICAgICAgICAgICAgcGVyaW9kOiBEdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRocmVzaG9sZDogY29uZmlnLmFsZXJ0cy5hbGFybXMuZHluYW1vZGJUaHJvdHRsaW5nLnRocmVzaG9sZCxcbiAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogY29uZmlnLmFsZXJ0cy5hbGFybXMuZHluYW1vZGJUaHJvdHRsaW5nLmV2YWx1YXRpb25QZXJpb2RzLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5hbGVydFRvcGljKSB7XG4gICAgICAgICAgYWxhcm0uYWRkQWxhcm1BY3Rpb24obmV3IGNsb3Vkd2F0Y2guU25zQWN0aW9uKHRoaXMuYWxlcnRUb3BpYykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbGFybXMucHVzaChhbGFybSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn0iXX0=