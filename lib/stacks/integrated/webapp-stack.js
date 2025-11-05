"use strict";
/**
 * WebAppStack - 統合Webアプリケーションスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合APIコンストラクトによる一元管理
 * - Next.js・CloudFront・Cognito・API Gatewayの統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
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
exports.WebAppStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
// 統合APIコンストラクト（モジュラーアーキテクチャ）
const api_construct_1 = require("../../modules/api/constructs/api-construct");
const lambda_web_adapter_1 = require("../../modules/api/constructs/lambda-web-adapter");
/**
 * 統合Webアプリケーションスタック（モジュラーアーキテクチャ対応）
 *
 * 統合APIコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
class WebAppStack extends cdk.Stack {
    /** 統合APIコンストラクト */
    api;
    /** CloudFrontディストリビューションURL（他スタックからの参照用） */
    cloudFrontUrl;
    /** API GatewayエンドポイントURL（他スタックからの参照用） */
    apiGatewayUrl;
    /** Cognito User Pool ID（他スタックからの参照用） */
    cognitoUserPoolId;
    constructor(scope, id, props) {
        super(scope, id, props);
        console.log('🌍 WebAppStack初期化開始...');
        console.log('📝 スタック名:', id);
        console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');
        // 依存スタックとの依存関係設定（存在する場合）
        if (props.securityStack) {
            this.addDependency(props.securityStack);
            console.log('🔗 SecurityStackとの依存関係設定完了');
        }
        if (props.dataStack) {
            this.addDependency(props.dataStack);
            console.log('🔗 DataStackとの依存関係設定完了');
        }
        if (props.computeStack) {
            this.addDependency(props.computeStack);
            console.log('🔗 ComputeStackとの依存関係設定完了');
        }
        // 統合APIコンストラクト作成
        this.api = new api_construct_1.ApiConstruct(this, 'API', {
            config: props.config.api,
            projectName: props.config.project.name,
            environment: props.config.environment,
            kmsKey: props.securityStack?.kmsKey,
            wafWebAclArn: props.securityStack?.wafWebAclArn,
            s3BucketNames: props.dataStack?.s3BucketNames,
            dynamoDbTableNames: props.dataStack?.dynamoDbTableNames,
            lambdaFunctionArns: props.computeStack?.lambdaFunctionArns,
            namingGenerator: props.namingGenerator,
        });
        // 他スタックからの参照用プロパティ設定
        this.setupCrossStackReferences();
        // スタック出力
        this.createOutputs();
        // タグ設定
        this.addStackTags();
        console.log('✅ WebAppStack初期化完了');
    }
    /**
     * 他スタックからの参照用プロパティ設定
     */
    setupCrossStackReferences() {
        // CloudFrontディストリビューションURLの設定（存在する場合）
        if (this.api.outputs?.cloudFrontUrl) {
            this.cloudFrontUrl = this.api.outputs.cloudFrontUrl;
        }
        // API GatewayエンドポイントURLの設定（存在する場合）
        if (this.api.outputs?.apiGatewayUrl) {
            this.apiGatewayUrl = this.api.outputs.apiGatewayUrl;
        }
        // Cognito User Pool IDの設定（存在する場合）
        if (this.api.outputs?.cognitoUserPoolId) {
            this.cognitoUserPoolId = this.api.outputs.cognitoUserPoolId;
        }
        console.log('🔗 他スタック参照用プロパティ設定完了');
    }
    /**
     * スタック出力作成（個別デプロイ対応）
     */
    createOutputs() {
        // CloudFrontディストリビューションURL出力（存在する場合のみ）
        if (this.cloudFrontUrl) {
            new cdk.CfnOutput(this, 'CloudFrontUrl', {
                value: this.cloudFrontUrl,
                description: 'CloudFront Distribution URL',
                exportName: `${this.stackName}-CloudFrontUrl`,
            });
        }
        // API GatewayエンドポイントURL出力（存在する場合のみ）
        if (this.apiGatewayUrl) {
            new cdk.CfnOutput(this, 'ApiGatewayUrl', {
                value: this.apiGatewayUrl,
                description: 'API Gateway Endpoint URL',
                exportName: `${this.stackName}-ApiGatewayUrl`,
            });
        }
        // Cognito User Pool ID出力（存在する場合のみ）
        if (this.cognitoUserPoolId) {
            new cdk.CfnOutput(this, 'CognitoUserPoolId', {
                value: this.cognitoUserPoolId,
                description: 'Cognito User Pool ID',
                exportName: `${this.stackName}-CognitoUserPoolId`,
            });
        }
        // API統合出力（存在する場合のみ）
        if (this.api.outputs) {
            // Lambda Web Adapter Function ARN
            if (this.api.outputs.lambdaWebAdapterArn) {
                new cdk.CfnOutput(this, 'LambdaWebAdapterArn', {
                    value: this.api.outputs.lambdaWebAdapterArn,
                    description: 'Lambda Web Adapter Function ARN',
                    exportName: `${this.stackName}-LambdaWebAdapterArn`,
                });
            }
            // Cognito User Pool Client ID
            if (this.api.outputs.cognitoUserPoolClientId) {
                new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
                    value: this.api.outputs.cognitoUserPoolClientId,
                    description: 'Cognito User Pool Client ID',
                    exportName: `${this.stackName}-CognitoUserPoolClientId`,
                });
            }
        }
        console.log('📤 WebAppStack出力値作成完了');
    }
    /**
     * スタックタグ設定（Agent Steering準拠）
     */
    addStackTags() {
        cdk.Tags.of(this).add('Module', 'API+Frontend');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Architecture', 'Modular');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('WebFramework', 'Next.js');
        cdk.Tags.of(this).add('DeploymentMethod', 'Lambda Web Adapter');
        cdk.Tags.of(this).add('CDN', 'CloudFront');
        cdk.Tags.of(this).add('Authentication', 'Cognito');
        cdk.Tags.of(this).add('IndividualDeploySupport', 'Yes');
        console.log('🏷️ WebAppStackタグ設定完了');
    }
    /** API Gateway */
    apiGateway;
    /** Cognito User Pool */
    userPool;
    userPoolClient;
    identityPool;
    constructor(scope, id, props) {
        super(scope, id, props);
        // リソース構築
        this.buildResources(props);
        // スタック出力
        this.createOutputs();
        // タグ設定
        this.addStackTags(props);
    }
    /**
     * リソース構築（責任分離）
     */
    buildResources(props) {
        // Cognitoリソース構築
        this.buildCognitoResources(props);
        // API Gatewayリソース構築
        this.buildApiGatewayResources(props);
        // Lambda Web Adapterリソース構築
        this.buildLambdaWebAdapterResources(props);
    }
    /**
     * Cognitoリソース構築
     */
    buildCognitoResources(props) {
        // Cognito User Pool作成
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: this.generateResourceName(props, 'users'),
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
                username: true,
            },
            autoVerify: {
                email: true,
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // Cognito User Pool Client作成
        this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool: this.userPool,
            userPoolClientName: this.generateResourceName(props, 'client'),
            generateSecret: false,
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
        });
        // Cognito Identity Pool作成
        this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: this.generateResourceName(props, 'identity'),
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [{
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName,
                }],
        });
    }
    /**
     * API Gatewayリソース構築
     */
    buildApiGatewayResources(props) {
        this.apiGateway = new apigateway.RestApi(this, 'ApiGateway', {
            restApiName: this.generateResourceName(props, 'api'),
            description: 'Permission-aware RAG System API',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
            },
        });
    }
    /**
     * Lambda Web Adapterリソース構築
     */
    buildLambdaWebAdapterResources(props) {
        this.webAdapter = new lambda_web_adapter_1.LambdaWebAdapter(this, 'NextjsWebApp', {
            wafAttrArn: props.securityStack.waf.webAcl.attrArn,
            db: props.dataStack.dynamoDb.sessionTable,
            cognito: {
                userPoolId: this.userPool.userPoolId,
                userPoolClientId: this.userPoolClient.userPoolClientId,
                identityPoolId: this.identityPool.ref,
            },
            vpcConfig: null, // VPCなしでテスト
            imagePath: './docker',
            tag: 'latest',
        });
    }
    /**
     * リソース名生成ヘルパー
     */
    generateResourceName(props, suffix) {
        return `${props.projectName}-${props.environment}-${suffix}`;
    }
    /**
     * スタック出力作成
     */
    createOutputs() {
        // Cognito出力
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: `${this.stackName}-UserPoolId`,
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID',
            exportName: `${this.stackName}-UserPoolClientId`,
        });
        new cdk.CfnOutput(this, 'IdentityPoolId', {
            value: this.identityPool.ref,
            description: 'Cognito Identity Pool ID',
            exportName: `${this.stackName}-IdentityPoolId`,
        });
        // API Gateway出力
        new cdk.CfnOutput(this, 'ApiGatewayUrl', {
            value: this.apiGateway.url,
            description: 'API Gateway URL',
            exportName: `${this.stackName}-ApiGatewayUrl`,
        });
        new cdk.CfnOutput(this, 'ApiGatewayId', {
            value: this.apiGateway.restApiId,
            description: 'API Gateway ID',
            exportName: `${this.stackName}-ApiGatewayId`,
        });
        // Lambda Web Adapter出力
        new cdk.CfnOutput(this, 'WebAppUrl', {
            value: this.webAdapter.functionUrl,
            description: 'Next.js WebApp URL (Lambda Web Adapter)',
            exportName: `${this.stackName}-WebAppUrl`,
        });
        new cdk.CfnOutput(this, 'WebAppFunctionName', {
            value: this.webAdapter.lambda.functionName,
            description: 'Next.js WebApp Lambda Function Name',
            exportName: `${this.stackName}-WebAppFunctionName`,
        });
        // Next.js環境変数出力
        new cdk.CfnOutput(this, 'NextJsEnvVars', {
            value: JSON.stringify({
                NEXT_PUBLIC_API_URL: this.apiGateway.url,
                NEXT_PUBLIC_USER_POOL_ID: this.userPool.userPoolId,
                NEXT_PUBLIC_USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
                NEXT_PUBLIC_IDENTITY_POOL_ID: this.identityPool.ref,
                NEXT_PUBLIC_WEBAPP_URL: this.webAdapter.functionUrl,
            }),
            description: 'Next.js Environment Variables',
            exportName: `${this.stackName}-NextJsEnvVars`,
        });
    }
    /**
     * スタックタグ設定
     */
    addStackTags(props) {
        cdk.Tags.of(this).add('Module', 'WebApp');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Project', props.projectName);
        cdk.Tags.of(this).add('Environment', props.environment);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('Frontend', 'Next.js');
    }
}
exports.WebAppStack = WebAppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViYXBwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2ViYXBwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxpREFBbUM7QUFHbkMsNkJBQTZCO0FBQzdCLDhFQUEwRTtBQVMxRSx3RkFBbUY7QUFVbkY7Ozs7O0dBS0c7QUFDSCxNQUFhLFdBQVksU0FBUSxHQUFHLENBQUMsS0FBSztJQUN4QyxtQkFBbUI7SUFDSCxHQUFHLENBQWU7SUFFbEMsNENBQTRDO0lBQzVCLGFBQWEsQ0FBVTtJQUV2Qyx5Q0FBeUM7SUFDekIsYUFBYSxDQUFVO0lBRXZDLHdDQUF3QztJQUN4QixpQkFBaUIsQ0FBVTtJQUUzQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFM0UseUJBQXlCO1FBQ3pCLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEMs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SSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN4RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUNGO0FBN1ZELGtDQTZWQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogV2ViQXBwU3RhY2sgLSDntbHlkIhXZWLjgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7Pjgrnjgr/jg4Pjgq/vvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plr77lv5zvvIlcbiAqIFxuICog5qmf6IO9OlxuICogLSDntbHlkIhBUEnjgrPjg7Pjgrnjg4jjg6njgq/jg4jjgavjgojjgovkuIDlhYPnrqHnkIZcbiAqIC0gTmV4dC5qc+ODu0Nsb3VkRnJvbnTjg7tDb2duaXRv44O7QVBJIEdhdGV3YXnjga7ntbHlkIhcbiAqIC0gQWdlbnQgU3RlZXJpbmfmupbmi6Dlkb3lkI3opo/liYflr77lv5xcbiAqIC0g5YCL5Yil44K544K/44OD44Kv44OH44OX44Ot44Kk5a6M5YWo5a++5b+cXG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vLyDntbHlkIhBUEnjgrPjg7Pjgrnjg4jjg6njgq/jg4jvvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6PvvIlcbmltcG9ydCB7IEFwaUNvbnN0cnVjdCB9IGZyb20gJy4uLy4uL21vZHVsZXMvYXBpL2NvbnN0cnVjdHMvYXBpLWNvbnN0cnVjdCc7XG5cbi8vIOOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuaW1wb3J0IHsgQXBpQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9hcGkvaW50ZXJmYWNlcy9hcGktY29uZmlnJztcblxuLy8g5LuW44K544K/44OD44Kv44GL44KJ44Gu5L6d5a2Y6Zai5L+CXG5pbXBvcnQgeyBTZWN1cml0eVN0YWNrIH0gZnJvbSAnLi9zZWN1cml0eS1zdGFjayc7XG5pbXBvcnQgeyBEYXRhU3RhY2sgfSBmcm9tICcuL2RhdGEtc3RhY2snO1xuaW1wb3J0IHsgQ29tcHV0ZVN0YWNrIH0gZnJvbSAnLi9jb21wdXRlLXN0YWNrJztcbmltcG9ydCB7IExhbWJkYVdlYkFkYXB0ZXIgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2FwaS9jb25zdHJ1Y3RzL2xhbWJkYS13ZWItYWRhcHRlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2ViQXBwU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcmVhZG9ubHkgY29uZmlnOiBhbnk7IC8vIOe1seWQiOioreWumuOCquODluOCuOOCp+OCr+ODiFxuICByZWFkb25seSBzZWN1cml0eVN0YWNrPzogU2VjdXJpdHlTdGFjazsgLy8g44K744Kt44Ol44Oq44OG44Kj44K544K/44OD44Kv77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IGRhdGFTdGFjaz86IERhdGFTdGFjazsgLy8g44OH44O844K/44K544K/44OD44Kv77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IGNvbXB1dGVTdGFjaz86IENvbXB1dGVTdGFjazsgLy8g44Kz44Oz44OU44Ol44O844OI44K544K/44OD44Kv77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IG5hbWluZ0dlbmVyYXRvcj86IGFueTsgLy8gQWdlbnQgU3RlZXJpbmfmupbmi6Dlkb3lkI3jgrjjgqfjg43jg6zjg7zjgr/jg7zvvIjjgqrjg5fjgrfjg6fjg7PvvIlcbn1cblxuLyoqXG4gKiDntbHlkIhXZWLjgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7Pjgrnjgr/jg4Pjgq/vvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plr77lv5zvvIlcbiAqIFxuICog57Wx5ZCIQVBJ44Kz44Oz44K544OI44Op44Kv44OI44Gr44KI44KL5LiA5YWD566h55CGXG4gKiDlgIvliKXjgrnjgr/jg4Pjgq/jg4fjg5fjg63jgqTlrozlhajlr77lv5xcbiAqL1xuZXhwb3J0IGNsYXNzIFdlYkFwcFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgLyoqIOe1seWQiEFQSeOCs+ODs+OCueODiOODqeOCr+ODiCAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBBcGlDb25zdHJ1Y3Q7XG4gIFxuICAvKiogQ2xvdWRGcm9udOODh+OCo+OCueODiOODquODk+ODpeODvOOCt+ODp+ODs1VSTO+8iOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqO+8iSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRGcm9udFVybD86IHN0cmluZztcbiAgXG4gIC8qKiBBUEkgR2F0ZXdheeOCqOODs+ODieODneOCpOODs+ODiFVSTO+8iOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqO+8iSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpR2F0ZXdheVVybD86IHN0cmluZztcbiAgXG4gIC8qKiBDb2duaXRvIFVzZXIgUG9vbCBJRO+8iOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqO+8iSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29nbml0b1VzZXJQb29sSWQ/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFdlYkFwcFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnNvbGUubG9nKCfwn4yNIFdlYkFwcFN0YWNr5Yid5pyf5YyW6ZaL5aeLLi4uJyk7XG4gICAgY29uc29sZS5sb2coJ/Cfk50g44K544K/44OD44Kv5ZCNOicsIGlkKTtcbiAgICBjb25zb2xlLmxvZygn8J+Pt++4jyBBZ2VudCBTdGVlcmluZ+a6luaLoDonLCBwcm9wcy5uYW1pbmdHZW5lcmF0b3IgPyAnWWVzJyA6ICdObycpO1xuXG4gICAgLy8g5L6d5a2Y44K544K/44OD44Kv44Go44Gu5L6d5a2Y6Zai5L+C6Kit5a6a77yI5a2Y5Zyo44GZ44KL5aC05ZCI77yJXG4gICAgaWYgKHByb3BzLnNlY3VyaXR5U3RhY2spIHtcbiAgICAgIHRoaXMuYWRkRGVwZW5kZW5jeShwcm9wcy5zZWN1cml0eVN0YWNrKTtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SXIFNlY3VyaXR5U3RhY2vjgajjga7kvp3lrZjplqLkv4LoqK3lrprlrozkuoYnKTtcbiAgICB9XG4gICAgaWYgKHByb3BzLmRhdGFTdGFjaykge1xuICAgICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLmRhdGFTdGFjayk7XG4gICAgICBjb25zb2xlLmxvZygn8J+UlyBEYXRhU3RhY2vjgajjga7kvp3lrZjplqLkv4LoqK3lrprlrozkuoYnKTtcbiAgICB9XG4gICAgaWYgKHByb3BzLmNvbXB1dGVTdGFjaykge1xuICAgICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLmNvbXB1dGVTdGFjayk7XG4gICAgICBjb25zb2xlLmxvZygn8J+UlyBDb21wdXRlU3RhY2vjgajjga7kvp3lrZjplqLkv4LoqK3lrprlrozkuoYnKTtcbiAgICB9XG5cbiAgICAvLyDntbHlkIhBUEnjgrPjg7Pjgrnjg4jjg6njgq/jg4jkvZzmiJBcbiAgICB0aGlzLmFwaSA9IG5ldyBBcGlDb25zdHJ1Y3QodGhpcywgJ0FQSScsIHtcbiAgICAgIGNvbmZpZzogcHJvcHMuY29uZmlnLmFwaSxcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5jb25maWcucHJvamVjdC5uYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmNvbmZpZy5lbnZpcm9ubWVudCxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjaz8ua21zS2V5LFxuICAgICAgd2FmV2ViQWNsQXJuOiBwcm9wcy5zZWN1cml0eVN0YWNrPy53YWZXZWJBY2xBcm4sXG4gICAgICBzM0J1Y2tldE5hbWVzOiBwcm9wcy5kYXRhU3RhY2s/LnMzQnVja2V0TmFtZXMsXG4gICAgICBkeW5hbW9EYlRhYmxlTmFtZXM6IHByb3BzLmRhdGFTdGFjaz8uZHluYW1vRGJUYWJsZU5hbWVzLFxuICAgICAgbGFtYmRhRnVuY3Rpb25Bcm5zOiBwcm9wcy5jb21wdXRlU3RhY2s/LmxhbWJkYUZ1bmN0aW9uQXJucyxcbiAgICAgIG5hbWluZ0dlbmVyYXRvcjogcHJvcHMubmFtaW5nR2VuZXJhdG9yLFxuICAgIH0pO1xuXG4gICAgLy8g5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6aXG4gICAgdGhpcy5zZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk7XG5cbiAgICAvLyDjgrnjgr/jg4Pjgq/lh7rliptcbiAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcblxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIHRoaXMuYWRkU3RhY2tUYWdzKCk7XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIFdlYkFwcFN0YWNr5Yid5pyf5YyW5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICog5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6aXG4gICAqL1xuICBwcml2YXRlIHNldHVwQ3Jvc3NTdGFja1JlZmVyZW5jZXMoKTogdm9pZCB7XG4gICAgLy8gQ2xvdWRGcm9udOODh+OCo+OCueODiOODquODk+ODpeODvOOCt+ODp+ODs1VSTOOBruioreWumu+8iOWtmOWcqOOBmeOCi+WgtOWQiO+8iVxuICAgIGlmICh0aGlzLmFwaS5vdXRwdXRzPy5jbG91ZEZyb250VXJsKSB7XG4gICAgICB0aGlzLmNsb3VkRnJvbnRVcmwgPSB0aGlzLmFwaS5vdXRwdXRzLmNsb3VkRnJvbnRVcmw7XG4gICAgfVxuXG4gICAgLy8gQVBJIEdhdGV3YXnjgqjjg7Pjg4njg53jgqTjg7Pjg4hVUkzjga7oqK3lrprvvIjlrZjlnKjjgZnjgovloLTlkIjvvIlcbiAgICBpZiAodGhpcy5hcGkub3V0cHV0cz8uYXBpR2F0ZXdheVVybCkge1xuICAgICAgdGhpcy5hcGlHYXRld2F5VXJsID0gdGhpcy5hcGkub3V0cHV0cy5hcGlHYXRld2F5VXJsO1xuICAgIH1cblxuICAgIC8vIENvZ25pdG8gVXNlciBQb29sIElE44Gu6Kit5a6a77yI5a2Y5Zyo44GZ44KL5aC05ZCI77yJXG4gICAgaWYgKHRoaXMuYXBpLm91dHB1dHM/LmNvZ25pdG9Vc2VyUG9vbElkKSB7XG4gICAgICB0aGlzLmNvZ25pdG9Vc2VyUG9vbElkID0gdGhpcy5hcGkub3V0cHV0cy5jb2duaXRvVXNlclBvb2xJZDtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn8J+UlyDku5bjgrnjgr/jg4Pjgq/lj4LnhafnlKjjg5fjg63jg5Hjg4bjgqPoqK3lrprlrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgr/jg4Pjgq/lh7rlipvkvZzmiJDvvIjlgIvliKXjg4fjg5fjg63jgqTlr77lv5zvvIlcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0cygpOiB2b2lkIHtcbiAgICAvLyBDbG91ZEZyb25044OH44Kj44K544OI44Oq44OT44Ol44O844K344On44OzVVJM5Ye65Yqb77yI5a2Y5Zyo44GZ44KL5aC05ZCI44Gu44G/77yJXG4gICAgaWYgKHRoaXMuY2xvdWRGcm9udFVybCkge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Nsb3VkRnJvbnRVcmwnLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLmNsb3VkRnJvbnRVcmwsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gVVJMJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUNsb3VkRnJvbnRVcmxgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQVBJIEdhdGV3YXnjgqjjg7Pjg4njg53jgqTjg7Pjg4hVUkzlh7rlipvvvIjlrZjlnKjjgZnjgovloLTlkIjjga7jgb/vvIlcbiAgICBpZiAodGhpcy5hcGlHYXRld2F5VXJsKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpR2F0ZXdheVVybCcsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuYXBpR2F0ZXdheVVybCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSBFbmRwb2ludCBVUkwnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tQXBpR2F0ZXdheVVybGAsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDb2duaXRvIFVzZXIgUG9vbCBJROWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLmNvZ25pdG9Vc2VyUG9vbElkKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ29nbml0b1VzZXJQb29sSWQnLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLmNvZ25pdG9Vc2VyUG9vbElkLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIElEJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUNvZ25pdG9Vc2VyUG9vbElkYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEFQSee1seWQiOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLmFwaS5vdXRwdXRzKSB7XG4gICAgICAvLyBMYW1iZGEgV2ViIEFkYXB0ZXIgRnVuY3Rpb24gQVJOXG4gICAgICBpZiAodGhpcy5hcGkub3V0cHV0cy5sYW1iZGFXZWJBZGFwdGVyQXJuKSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMYW1iZGFXZWJBZGFwdGVyQXJuJywge1xuICAgICAgICAgIHZhbHVlOiB0aGlzLmFwaS5vdXRwdXRzLmxhbWJkYVdlYkFkYXB0ZXJBcm4sXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdMYW1iZGEgV2ViIEFkYXB0ZXIgRnVuY3Rpb24gQVJOJyxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tTGFtYmRhV2ViQWRhcHRlckFybmAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSURcbiAgICAgIGlmICh0aGlzLmFwaS5vdXRwdXRzLmNvZ25pdG9Vc2VyUG9vbENsaWVudElkKSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDb2duaXRvVXNlclBvb2xDbGllbnRJZCcsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5hcGkub3V0cHV0cy5jb2duaXRvVXNlclBvb2xDbGllbnRJZCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIENsaWVudCBJRCcsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUNvZ25pdG9Vc2VyUG9vbENsaWVudElkYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ/Cfk6QgV2ViQXBwU3RhY2vlh7rlipvlgKTkvZzmiJDlrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgr/jg4Pjgq/jgr/jgrDoqK3lrprvvIhBZ2VudCBTdGVlcmluZ+a6luaLoO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhZGRTdGFja1RhZ3MoKTogdm9pZCB7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNb2R1bGUnLCAnQVBJK0Zyb250ZW5kJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdTdGFja1R5cGUnLCAnSW50ZWdyYXRlZCcpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQXJjaGl0ZWN0dXJlJywgJ01vZHVsYXInKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1dlYkZyYW1ld29yaycsICdOZXh0LmpzJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdEZXBsb3ltZW50TWV0aG9kJywgJ0xhbWJkYSBXZWIgQWRhcHRlcicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ0ROJywgJ0Nsb3VkRnJvbnQnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0F1dGhlbnRpY2F0aW9uJywgJ0NvZ25pdG8nKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0luZGl2aWR1YWxEZXBsb3lTdXBwb3J0JywgJ1llcycpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn4+377iPIFdlYkFwcFN0YWNr44K/44Kw6Kit5a6a5a6M5LqGJyk7XG4gIH1cbiAgXG4gIC8qKiBBUEkgR2F0ZXdheSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpR2F0ZXdheTogYXBpZ2F0ZXdheS5SZXN0QXBpO1xuICBcbiAgLyoqIENvZ25pdG8gVXNlciBQb29sICovXG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sQ2xpZW50OiBjb2duaXRvLlVzZXJQb29sQ2xpZW50O1xuICBwdWJsaWMgcmVhZG9ubHkgaWRlbnRpdHlQb29sOiBjb2duaXRvLkNmbklkZW50aXR5UG9vbDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogV2ViQXBwU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8g44Oq44K944O844K55qeL56+JXG4gICAgdGhpcy5idWlsZFJlc291cmNlcyhwcm9wcyk7XG5cbiAgICAvLyDjgrnjgr/jg4Pjgq/lh7rliptcbiAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcblxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIHRoaXMuYWRkU3RhY2tUYWdzKHByb3BzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnmp4vnr4nvvIjosqzku7vliIbpm6LvvIlcbiAgICovXG4gIHByaXZhdGUgYnVpbGRSZXNvdXJjZXMocHJvcHM6IFdlYkFwcFN0YWNrUHJvcHMpOiB2b2lkIHtcbiAgICAvLyBDb2duaXRv44Oq44K944O844K55qeL56+JXG4gICAgdGhpcy5idWlsZENvZ25pdG9SZXNvdXJjZXMocHJvcHMpO1xuXG4gICAgLy8gQVBJIEdhdGV3YXnjg6rjgr3jg7zjgrnmp4vnr4lcbiAgICB0aGlzLmJ1aWxkQXBpR2F0ZXdheVJlc291cmNlcyhwcm9wcyk7XG5cbiAgICAvLyBMYW1iZGEgV2ViIEFkYXB0ZXLjg6rjgr3jg7zjgrnmp4vnr4lcbiAgICB0aGlzLmJ1aWxkTGFtYmRhV2ViQWRhcHRlclJlc291cmNlcyhwcm9wcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29nbml0b+ODquOCveODvOOCueani+eviVxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZENvZ25pdG9SZXNvdXJjZXMocHJvcHM6IFdlYkFwcFN0YWNrUHJvcHMpOiB2b2lkIHtcbiAgICAvLyBDb2duaXRvIFVzZXIgUG9vbOS9nOaIkFxuICAgIHRoaXMudXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnVXNlclBvb2wnLCB7XG4gICAgICB1c2VyUG9vbE5hbWU6IHRoaXMuZ2VuZXJhdGVSZXNvdXJjZU5hbWUocHJvcHMsICd1c2VycycpLFxuICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRydWUsXG4gICAgICBzaWduSW5BbGlhc2VzOiB7XG4gICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgICB1c2VybmFtZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBhdXRvVmVyaWZ5OiB7XG4gICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogOCxcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBDb2duaXRvIFVzZXIgUG9vbCBDbGllbnTkvZzmiJBcbiAgICB0aGlzLnVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ1VzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2w6IHRoaXMudXNlclBvb2wsXG4gICAgICB1c2VyUG9vbENsaWVudE5hbWU6IHRoaXMuZ2VuZXJhdGVSZXNvdXJjZU5hbWUocHJvcHMsICdjbGllbnQnKSxcbiAgICAgIGdlbmVyYXRlU2VjcmV0OiBmYWxzZSxcbiAgICAgIGF1dGhGbG93czoge1xuICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgIHVzZXJTcnA6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ29nbml0byBJZGVudGl0eSBQb29s5L2c5oiQXG4gICAgdGhpcy5pZGVudGl0eVBvb2wgPSBuZXcgY29nbml0by5DZm5JZGVudGl0eVBvb2wodGhpcywgJ0lkZW50aXR5UG9vbCcsIHtcbiAgICAgIGlkZW50aXR5UG9vbE5hbWU6IHRoaXMuZ2VuZXJhdGVSZXNvdXJjZU5hbWUocHJvcHMsICdpZGVudGl0eScpLFxuICAgICAgYWxsb3dVbmF1dGhlbnRpY2F0ZWRJZGVudGl0aWVzOiBmYWxzZSxcbiAgICAgIGNvZ25pdG9JZGVudGl0eVByb3ZpZGVyczogW3tcbiAgICAgICAgY2xpZW50SWQ6IHRoaXMudXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgICAgcHJvdmlkZXJOYW1lOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sUHJvdmlkZXJOYW1lLFxuICAgICAgfV0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQVBJIEdhdGV3YXnjg6rjgr3jg7zjgrnmp4vnr4lcbiAgICovXG4gIHByaXZhdGUgYnVpbGRBcGlHYXRld2F5UmVzb3VyY2VzKHByb3BzOiBXZWJBcHBTdGFja1Byb3BzKTogdm9pZCB7XG4gICAgdGhpcy5hcGlHYXRld2F5ID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnQXBpR2F0ZXdheScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiB0aGlzLmdlbmVyYXRlUmVzb3VyY2VOYW1lKHByb3BzLCAnYXBpJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ1Blcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbSBBUEknLFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdYLUFtei1EYXRlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1BcGktS2V5J10sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExhbWJkYSBXZWIgQWRhcHRlcuODquOCveODvOOCueani+eviVxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZExhbWJkYVdlYkFkYXB0ZXJSZXNvdXJjZXMocHJvcHM6IFdlYkFwcFN0YWNrUHJvcHMpOiB2b2lkIHtcbiAgICB0aGlzLndlYkFkYXB0ZXIgPSBuZXcgTGFtYmRhV2ViQWRhcHRlcih0aGlzLCAnTmV4dGpzV2ViQXBwJywge1xuICAgICAgd2FmQXR0ckFybjogcHJvcHMuc2VjdXJpdHlTdGFjay53YWYud2ViQWNsLmF0dHJBcm4sXG4gICAgICBkYjogcHJvcHMuZGF0YVN0YWNrLmR5bmFtb0RiLnNlc3Npb25UYWJsZSxcbiAgICAgIGNvZ25pdG86IHtcbiAgICAgICAgdXNlclBvb2xJZDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgICB1c2VyUG9vbENsaWVudElkOiB0aGlzLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAgIGlkZW50aXR5UG9vbElkOiB0aGlzLmlkZW50aXR5UG9vbC5yZWYsXG4gICAgICB9LFxuICAgICAgdnBjQ29uZmlnOiBudWxsLCAvLyBWUEPjgarjgZfjgafjg4bjgrnjg4hcbiAgICAgIGltYWdlUGF0aDogJy4vZG9ja2VyJyxcbiAgICAgIHRhZzogJ2xhdGVzdCcsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog44Oq44K944O844K55ZCN55Sf5oiQ44OY44Or44OR44O8XG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlUmVzb3VyY2VOYW1lKHByb3BzOiBXZWJBcHBTdGFja1Byb3BzLCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS0ke3N1ZmZpeH1gO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+WHuuWKm+S9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRzKCk6IHZvaWQge1xuICAgIC8vIENvZ25pdG/lh7rliptcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1Vc2VyUG9vbElkYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbENsaWVudElkJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgQ2xpZW50IElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1Vc2VyUG9vbENsaWVudElkYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdJZGVudGl0eVBvb2xJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmlkZW50aXR5UG9vbC5yZWYsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gSWRlbnRpdHkgUG9vbCBJRCcsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tSWRlbnRpdHlQb29sSWRgLFxuICAgIH0pO1xuXG4gICAgLy8gQVBJIEdhdGV3YXnlh7rliptcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpR2F0ZXdheVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaUdhdGV3YXkudXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSBVUkwnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUFwaUdhdGV3YXlVcmxgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUdhdGV3YXlJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaUdhdGV3YXkucmVzdEFwaUlkLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSBJRCcsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tQXBpR2F0ZXdheUlkYCxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBXZWIgQWRhcHRlcuWHuuWKm1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXZWJBcHBVcmwnLCB7XG4gICAgICB2YWx1ZTogdGhpcy53ZWJBZGFwdGVyLmZ1bmN0aW9uVXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdOZXh0LmpzIFdlYkFwcCBVUkwgKExhbWJkYSBXZWIgQWRhcHRlciknLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVdlYkFwcFVybGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2ViQXBwRnVuY3Rpb25OYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMud2ViQWRhcHRlci5sYW1iZGEuZnVuY3Rpb25OYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdOZXh0LmpzIFdlYkFwcCBMYW1iZGEgRnVuY3Rpb24gTmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tV2ViQXBwRnVuY3Rpb25OYW1lYCxcbiAgICB9KTtcblxuICAgIC8vIE5leHQuanPnkrDlooPlpInmlbDlh7rliptcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTmV4dEpzRW52VmFycycsIHtcbiAgICAgIHZhbHVlOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIE5FWFRfUFVCTElDX0FQSV9VUkw6IHRoaXMuYXBpR2F0ZXdheS51cmwsXG4gICAgICAgIE5FWFRfUFVCTElDX1VTRVJfUE9PTF9JRDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgICBORVhUX1BVQkxJQ19VU0VSX1BPT0xfQ0xJRU5UX0lEOiB0aGlzLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAgIE5FWFRfUFVCTElDX0lERU5USVRZX1BPT0xfSUQ6IHRoaXMuaWRlbnRpdHlQb29sLnJlZixcbiAgICAgICAgTkVYVF9QVUJMSUNfV0VCQVBQX1VSTDogdGhpcy53ZWJBZGFwdGVyLmZ1bmN0aW9uVXJsLFxuICAgICAgfSksXG4gICAgICBkZXNjcmlwdGlvbjogJ05leHQuanMgRW52aXJvbm1lbnQgVmFyaWFibGVzJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1OZXh0SnNFbnZWYXJzYCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgr/jg4Pjgq/jgr/jgrDoqK3lrppcbiAgICovXG4gIHByaXZhdGUgYWRkU3RhY2tUYWdzKHByb3BzOiBXZWJBcHBTdGFja1Byb3BzKTogdm9pZCB7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNb2R1bGUnLCAnV2ViQXBwJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdTdGFja1R5cGUnLCAnSW50ZWdyYXRlZCcpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnUHJvamVjdCcsIHByb3BzLnByb2plY3ROYW1lKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0Vudmlyb25tZW50JywgcHJvcHMuZW52aXJvbm1lbnQpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRnJvbnRlbmQnLCAnTmV4dC5qcycpO1xuICB9XG59Il19