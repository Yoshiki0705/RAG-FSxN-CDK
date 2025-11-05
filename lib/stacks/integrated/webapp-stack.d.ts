/**
 * WebAppStack - 統合Webアプリケーションスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合APIコンストラクトによる一元管理
 * - Next.js・CloudFront・Cognito・API Gatewayの統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
 */
import * as cdk from 'aws-cdk-lib';
import { ApiConstruct } from '../../modules/api/constructs/api-construct';
import { SecurityStack } from './security-stack';
import { DataStack } from './data-stack';
import { ComputeStack } from './compute-stack';
export interface WebAppStackProps extends cdk.StackProps {
    readonly config: any;
    readonly securityStack?: SecurityStack;
    readonly dataStack?: DataStack;
    readonly computeStack?: ComputeStack;
    readonly namingGenerator?: any;
}
/**
 * 統合Webアプリケーションスタック（モジュラーアーキテクチャ対応）
 *
 * 統合APIコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
export declare class WebAppStack extends cdk.Stack {
    /** 統合APIコンストラクト */
    readonly api: ApiConstruct;
    /** CloudFrontディストリビューションURL（他スタックからの参照用） */
    readonly cloudFrontUrl?: string;
    /** API GatewayエンドポイントURL（他スタックからの参照用） */
    readonly apiGatewayUrl?: string;
    /** Cognito User Pool ID（他スタックからの参照用） */
    readonly cognitoUserPoolId?: string;
    /**
     * 他スタックからの参照用プロパティ設定
     */
    private setupCrossStackReferences;
    /** API Gateway */
    readonly apiGateway: apigateway.RestApi;
    /** Cognito User Pool */
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    readonly identityPool: cognito.CfnIdentityPool;
    /**
     * リソース構築（責任分離）
     */
    private buildResources;
    /**
     * Cognitoリソース構築
     */
    private buildCognitoResources;
    /**
     * API Gatewayリソース構築
     */
    private buildApiGatewayResources;
    /**
     * Lambda Web Adapterリソース構築
     */
    private buildLambdaWebAdapterResources;
    /**
     * リソース名生成ヘルパー
     */
    private generateResourceName;
}
