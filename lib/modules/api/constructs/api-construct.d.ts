/**
 * APIコンストラクト - 強化版
 *
 * REST API、GraphQL API、WebSocket API、Cognito、CloudFrontの統合管理を提供
 *
 * 統合機能:
 * - REST API Gateway（従来機能）
 * - GraphQL API（AppSync統合）
 * - WebSocket API（リアルタイム通信）
 * - 高度な認証・認可（Cognito + Identity Pool）
 * - マルチテナント対応
 * - API分析・監視
 * - 使用量プラン・API キー管理
 * - カスタムドメイン・SSL証明書
 */
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { APIConfig, APIOutputs } from '../interfaces/api-config';
export interface APIConstructProps {
    config: APIConfig;
    projectName: string;
    environment: string;
    region: string;
    lambdaFunctions?: {
        [key: string]: lambda.Function;
    };
    domainName?: string;
    certificate?: acm.ICertificate;
    hostedZone?: route53.IHostedZone;
    existingResources?: {
        vpc?: any;
        kmsKey?: any;
        databaseStack?: any;
        storageStack?: any;
        computeStack?: any;
    };
}
/**
 * API・フロントエンド統合コンストラクト - 強化版
 */
export declare class APIConstruct extends Construct {
    private props;
    readonly outputs: APIOutputs;
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    readonly identityPool?: cognito.CfnIdentityPool;
    readonly restApi: apigateway.RestApi;
    readonly graphqlApi?: appsync.GraphqlApi;
    readonly websocketApi?: apigatewayv2.WebSocketApi;
    readonly distribution?: cloudfront.Distribution;
    readonly webAcl?: wafv2.CfnWebACL;
    readonly kinesisStream?: kinesis.Stream;
    readonly usagePlans: {
        [planName: string]: apigateway.UsagePlan;
    };
    readonly apiKeys: {
        [keyName: string]: apigateway.ApiKey;
    };
    readonly monitoringDashboard: cloudwatch.Dashboard;
    readonly tenantManagerFunction?: lambda.Function;
    constructor(scope: Construct, id: string, props: APIConstructProps);
    /**
     * Parameter Store設定作成
     */
    private createParameterStore;
    /**
     * Cognito ユーザープールの作成 - 強化版
     */
    private createUserPool;
    /**
     * Cognito ユーザープールクライアントの作成 - 強化版
     */
    private createUserPoolClient;
    /**
     * Cognito Identity Pool作成
     */
    private createIdentityPool;
    /**
     * REST API Gateway作成 - 強化版
     */
    private createRestApi;
    /**
     * CloudFront Distribution作成 - 強化版
     */
    private createCloudFrontDistribution;
    /**
     * GraphQL API作成
     */
    private createGraphQLApi;
    /**
     * WebSocket API作成
     */
    private createWebSocketApi;
    /**
     * API分析設定
     */
    private setupAPIAnalytics;
    /**
     * 使用量プラン・APIキー設定
     */
    private setupUsagePlans;
    /**
     * マルチテナント管理関数作成
     */
    private createTenantManagerFunction;
    /**
     * WAF Web ACL作成
     */
    private createWebAcl;
    private createMonitoringDashboard;
    /**
     * EventBridge統合
     */
    private createEventBridgeIntegration;
    /**
     * 出力値作成
     */
    private createOutputs;
    /**
     * タグ適用
     */
    private applyTags;
}
