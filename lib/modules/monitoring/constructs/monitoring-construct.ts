import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { MonitoringConfig } from '../interfaces/monitoring-config';

/**
 * 監視・運用統合コンストラクト
 */
export class MonitoringConstruct extends Construct {
  /** CloudWatch ダッシュボード */
  public readonly dashboard?: cloudwatch.Dashboard;
  /** SNS アラートトピック */
  public readonly alertTopic?: sns.Topic;
  /** CloudWatch アラーム */
  public readonly alarms: cloudwatch.Alarm[] = [];

  constructor(scope: Construct, id: string, config: MonitoringConfig, props?: {
    lambdaFunctions?: lambda.Function[];
    apiGateway?: apigateway.RestApi;
    dynamodbTables?: dynamodb.Table[];
  }) {
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
  private createAlertTopic(config: MonitoringConfig): sns.Topic {
    const topic = new sns.Topic(this, 'AlertTopic', {
      topicName: config.alerts.snsTopicName,
      displayName: 'RAG System Alerts',
    });

    // メール通知の設定
    config.alerts.notificationEmails.forEach((email, index) => {
      topic.addSubscription(
        new subscriptions.EmailSubscription(email)
      );
    });

    return topic;
  }

  /**
   * CloudWatch ダッシュボードの作成
   */
  private createDashboard(config: MonitoringConfig, props?: {
    lambdaFunctions?: lambda.Function[];
    apiGateway?: apigateway.RestApi;
    dynamodbTables?: dynamodb.Table[];
  }): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: config.cloudWatch.dashboardName,
    });

    const widgets: cloudwatch.IWidget[] = [];

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
  private createLambdaWidget(functions: lambda.Function[]): cloudwatch.GraphWidget {
    const metrics: cloudwatch.IMetric[] = [];

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
  private createApiGatewayWidget(api: apigateway.RestApi): cloudwatch.GraphWidget {
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
  private createDynamoDBWidget(tables: dynamodb.Table[]): cloudwatch.GraphWidget {
    const metrics: cloudwatch.IMetric[] = [];

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
  private createAlarms(config: MonitoringConfig, props?: {
    lambdaFunctions?: lambda.Function[];
    apiGateway?: apigateway.RestApi;
    dynamodbTables?: dynamodb.Table[];
  }): void {
    // Lambda エラー率アラーム
    if (config.alerts.alarms.lambdaErrorRate.enabled && props?.lambdaFunctions) {
      props.lambdaFunctions.forEach((func, index) => {
        const alarm = new cloudwatch.Alarm(this, `LambdaErrorAlarm${index}`, {
          alarmName: `${func.functionName}-error-rate`,
          alarmDescription: `High error rate for ${func.functionName}`,
          metric: func.metricErrors({
            period: Duration.minutes(5),
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
          period: Duration.minutes(5),
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
            period: Duration.minutes(5),
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