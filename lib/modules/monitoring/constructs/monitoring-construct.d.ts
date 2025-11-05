import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { MonitoringConfig } from '../interfaces/monitoring-config';
/**
 * 監視・運用統合コンストラクト
 */
export declare class MonitoringConstruct extends Construct {
    /** CloudWatch ダッシュボード */
    readonly dashboard?: cloudwatch.Dashboard;
    /** SNS アラートトピック */
    readonly alertTopic?: sns.Topic;
    /** CloudWatch アラーム */
    readonly alarms: cloudwatch.Alarm[];
    constructor(scope: Construct, id: string, config: MonitoringConfig, props?: {
        lambdaFunctions?: lambda.Function[];
        apiGateway?: apigateway.RestApi;
        dynamodbTables?: dynamodb.Table[];
    });
    /**
     * SNS アラートトピックの作成
     */
    private createAlertTopic;
    /**
     * CloudWatch ダッシュボードの作成
     */
    private createDashboard;
    /**
     * Lambda ウィジェットの作成
     */
    private createLambdaWidget;
    /**
     * API Gateway ウィジェットの作成
     */
    private createApiGatewayWidget;
    /**
     * DynamoDB ウィジェットの作成
     */
    private createDynamoDBWidget;
    /**
     * アラームの作成
     */
    private createAlarms;
}
