"use strict";
/**
 * WebAppスタック テンプレートメソッドパターン実装
 *
 * スタック構築の共通フローを定義し、具体的な実装を子クラスに委譲
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
exports.HighAvailabilityWebAppStack = exports.SecureWebAppStack = exports.StandardWebAppStack = exports.AbstractWebAppStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda_web_adapter_1 = require("../../modules/api/constructs/lambda-web-adapter");
/**
 * 抽象WebAppスタック（Template Method Pattern）
 */
class AbstractWebAppStack extends cdk.Stack {
    constructor(scope, id, config, dependencies, props) {
        super(scope, id, props);
        this.config = config;
        this.dependencies = dependencies;
        // テンプレートメソッド実行
        this.buildStack();
    }
    /**
     * テンプレートメソッド - スタック構築の共通フロー
     */
    buildStack() {
        // 1. 前処理
        this.preProcess();
        // 2. 依存関係設定
        this.setupDependencies();
        // 3. リソース構築
        this.resources = this.buildResources();
        // 4. 後処理
        this.postProcess();
        // 5. 出力作成
        this.createOutputs();
        // 6. タグ設定
        this.addTags();
        // 7. 最終処理
        this.finalize();
    }
    /**
     * 前処理（オーバーライド可能）
     */
    preProcess() {
        // デフォルト実装は空
        this.validateConfig();
    }
    /**
     * 依存関係設定（オーバーライド可能）
     */
    setupDependencies() {
        // デフォルトでは依存関係を設定しない（Lambda Web Adapterでは不要）
    }
    /**
     * 後処理（オーバーライド可能）
     */
    postProcess() {
        // デフォルト実装は空
    }
    /**
     * タグ設定（オーバーライド可能）
     */
    addTags() {
        cdk.Tags.of(this).add('Module', 'WebApp');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Project', this.config.projectName);
        cdk.Tags.of(this).add('Environment', this.config.environment);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('Frontend', 'Next.js');
    }
    /**
     * 最終処理（オーバーライド可能）
     */
    finalize() {
        // デフォルト実装は空
    }
    /**
     * 設定検証（共通処理）
     */
    validateConfig() {
        if (!this.config.projectName) {
            throw new Error('プロジェクト名は必須です');
        }
        if (!this.config.environment) {
            throw new Error('環境名は必須です');
        }
        if (!this.config.cognitoConfig) {
            throw new Error('Cognito設定は必須です');
        }
        if (!this.config.lambdaConfig) {
            throw new Error('Lambda設定は必須です');
        }
    }
    /**
     * リソース名生成ヘルパー
     */
    generateResourceName(suffix) {
        return `${this.config.projectName}-${this.config.environment}-${suffix}`;
    }
    /**
     * 公開プロパティ
     */
    getResources() {
        if (!this.resources) {
            throw new Error('リソースが構築されていません');
        }
        return this.resources;
    }
    getConfig() {
        return this.config;
    }
}
exports.AbstractWebAppStack = AbstractWebAppStack;
/**
 * 標準WebAppスタック実装
 */
class StandardWebAppStack extends AbstractWebAppStack {
    buildResources() {
        // Cognitoリソース構築
        const userPool = this.buildUserPool();
        const userPoolClient = this.buildUserPoolClient(userPool);
        const identityPool = this.buildIdentityPool(userPool, userPoolClient);
        // API Gatewayリソース構築
        const apiGateway = this.buildApiGateway();
        // Lambda Web Adapterリソース構築
        const webAdapter = this.buildLambdaWebAdapter(userPool, userPoolClient, identityPool);
        return {
            userPool,
            userPoolClient,
            identityPool,
            apiGateway,
            webAdapter,
        };
    }
    buildUserPool() {
        const userPoolConfig = this.config.cognitoConfig.userPool;
        return new cognito.UserPool(this, 'UserPool', {
            userPoolName: this.generateResourceName('users'),
            selfSignUpEnabled: userPoolConfig.selfSignUpEnabled,
            signInAliases: userPoolConfig.signInAliases,
            autoVerify: userPoolConfig.autoVerify,
            passwordPolicy: {
                minLength: userPoolConfig.passwordPolicy.minLength,
                requireLowercase: userPoolConfig.passwordPolicy.requireLowercase,
                requireUppercase: userPoolConfig.passwordPolicy.requireUppercase,
                requireDigits: userPoolConfig.passwordPolicy.requireDigits,
                requireSymbols: userPoolConfig.passwordPolicy.requireSymbols,
            },
            removalPolicy: userPoolConfig.removalPolicy,
        });
    }
    buildUserPoolClient(userPool) {
        const clientConfig = this.config.cognitoConfig.userPoolClient;
        return new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool,
            userPoolClientName: this.generateResourceName('client'),
            generateSecret: clientConfig.generateSecret,
            authFlows: clientConfig.authFlows,
        });
    }
    buildIdentityPool(userPool, userPoolClient) {
        const identityConfig = this.config.cognitoConfig.identityPool;
        return new cognito.CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: this.generateResourceName('identity'),
            allowUnauthenticatedIdentities: identityConfig.allowUnauthenticatedIdentities,
            cognitoIdentityProviders: [{
                    clientId: userPoolClient.userPoolClientId,
                    providerName: userPool.userPoolProviderName,
                }],
        });
    }
    buildApiGateway() {
        return new apigateway.RestApi(this, 'ApiGateway', {
            restApiName: this.generateResourceName('api'),
            description: 'Permission-aware RAG System API',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
            },
        });
    }
    buildLambdaWebAdapter(userPool, userPoolClient, identityPool) {
        return new lambda_web_adapter_1.LambdaWebAdapter(this, 'NextjsWebApp', {
            wafAttrArn: this.dependencies.securityStack.waf.webAcl.attrArn,
            db: this.dependencies.dataStack.dynamoDb.sessionTable,
            cognito: {
                userPoolId: userPool.userPoolId,
                userPoolClientId: userPoolClient.userPoolClientId,
                identityPoolId: identityPool.ref,
            },
            vpcConfig: this.config.lambdaConfig.vpcConfig,
            imagePath: this.config.lambdaConfig.imagePath,
            tag: this.config.lambdaConfig.tag,
        });
    }
    createOutputs() {
        if (!this.resources)
            return;
        const outputConfig = this.config.outputConfig;
        if (outputConfig.enableCognitoOutputs) {
            this.createCognitoOutputs();
        }
        if (outputConfig.enableApiGatewayOutputs) {
            this.createApiGatewayOutputs();
        }
        if (outputConfig.enableLambdaOutputs) {
            this.createLambdaOutputs();
        }
        if (outputConfig.enableEnvironmentVariables) {
            this.createEnvironmentVariableOutputs();
        }
    }
    createCognitoOutputs() {
        if (!this.resources)
            return;
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.resources.userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: `${this.stackName}-UserPoolId`,
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.resources.userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID',
            exportName: `${this.stackName}-UserPoolClientId`,
        });
        new cdk.CfnOutput(this, 'IdentityPoolId', {
            value: this.resources.identityPool.ref,
            description: 'Cognito Identity Pool ID',
            exportName: `${this.stackName}-IdentityPoolId`,
        });
    }
    createApiGatewayOutputs() {
        if (!this.resources)
            return;
        new cdk.CfnOutput(this, 'ApiGatewayUrl', {
            value: this.resources.apiGateway.url,
            description: 'API Gateway URL',
            exportName: `${this.stackName}-ApiGatewayUrl`,
        });
        new cdk.CfnOutput(this, 'ApiGatewayId', {
            value: this.resources.apiGateway.restApiId,
            description: 'API Gateway ID',
            exportName: `${this.stackName}-ApiGatewayId`,
        });
    }
    createLambdaOutputs() {
        if (!this.resources)
            return;
        new cdk.CfnOutput(this, 'WebAppUrl', {
            value: this.resources.webAdapter.functionUrl,
            description: 'Next.js WebApp URL (Lambda Web Adapter)',
            exportName: `${this.stackName}-WebAppUrl`,
        });
        new cdk.CfnOutput(this, 'WebAppFunctionName', {
            value: this.resources.webAdapter.lambda.functionName,
            description: 'Next.js WebApp Lambda Function Name',
            exportName: `${this.stackName}-WebAppFunctionName`,
        });
    }
    createEnvironmentVariableOutputs() {
        if (!this.resources)
            return;
        new cdk.CfnOutput(this, 'NextJsEnvVars', {
            value: JSON.stringify({
                NEXT_PUBLIC_API_URL: this.resources.apiGateway.url,
                NEXT_PUBLIC_USER_POOL_ID: this.resources.userPool.userPoolId,
                NEXT_PUBLIC_USER_POOL_CLIENT_ID: this.resources.userPoolClient.userPoolClientId,
                NEXT_PUBLIC_IDENTITY_POOL_ID: this.resources.identityPool.ref,
                NEXT_PUBLIC_WEBAPP_URL: this.resources.webAdapter.functionUrl,
            }),
            description: 'Next.js Environment Variables',
            exportName: `${this.stackName}-NextJsEnvVars`,
        });
    }
}
exports.StandardWebAppStack = StandardWebAppStack;
/**
 * セキュリティ強化WebAppスタック実装
 */
class SecureWebAppStack extends StandardWebAppStack {
    setupDependencies() {
        // セキュリティ強化版では依存関係を明示的に設定
        this.addDependency(this.dependencies.networkingStack);
        this.addDependency(this.dependencies.securityStack);
        this.addDependency(this.dependencies.dataStack);
        this.addDependency(this.dependencies.embeddingStack);
    }
    addTags() {
        super.addTags();
        cdk.Tags.of(this).add('SecurityLevel', 'Enhanced');
        cdk.Tags.of(this).add('Compliance', 'SOC2');
    }
    finalize() {
        // セキュリティ強化版では最終検証を実行
        this.validateSecuritySettings();
    }
    validateSecuritySettings() {
        if (!this.resources)
            return;
        // パスワードポリシーの検証
        const passwordPolicy = this.config.cognitoConfig.userPool.passwordPolicy;
        if (passwordPolicy.minLength < 8) {
            console.warn('セキュリティ警告: パスワード最小長が8文字未満です');
        }
        // 未認証アクセスの検証
        if (this.config.cognitoConfig.identityPool.allowUnauthenticatedIdentities) {
            console.warn('セキュリティ警告: 未認証アクセスが許可されています');
        }
    }
}
exports.SecureWebAppStack = SecureWebAppStack;
/**
 * 高可用性WebAppスタック実装
 */
class HighAvailabilityWebAppStack extends StandardWebAppStack {
    buildLambdaWebAdapter(userPool, userPoolClient, identityPool) {
        // 高可用性版では異なる設定を使用
        return new lambda_web_adapter_1.LambdaWebAdapter(this, 'NextjsWebApp', {
            wafAttrArn: this.dependencies.securityStack.waf.webAcl.attrArn,
            db: this.dependencies.dataStack.dynamoDb.sessionTable,
            cognito: {
                userPoolId: userPool.userPoolId,
                userPoolClientId: userPoolClient.userPoolClientId,
                identityPoolId: identityPool.ref,
            },
            vpcConfig: this.config.lambdaConfig.vpcConfig,
            imagePath: this.config.lambdaConfig.imagePath,
            tag: this.config.lambdaConfig.tag,
        });
    }
    addTags() {
        super.addTags();
        cdk.Tags.of(this).add('AvailabilityLevel', 'High');
        cdk.Tags.of(this).add('MultiAZ', 'true');
    }
}
exports.HighAvailabilityWebAppStack = HighAvailabilityWebAppStack;
