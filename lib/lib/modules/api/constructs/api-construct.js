"use strict";
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
exports.APIConstruct = void 0;
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const apigatewayv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const integrations = __importStar(require("aws-cdk-lib/aws-apigatewayv2-integrations"));
const authorizers = __importStar(require("aws-cdk-lib/aws-apigatewayv2-authorizers"));
const appsync = __importStar(require("aws-cdk-lib/aws-appsync"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const wafv2 = __importStar(require("aws-cdk-lib/aws-wafv2"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
const targets = __importStar(require("aws-cdk-lib/aws-route53-targets"));
const kinesis = __importStar(require("aws-cdk-lib/aws-kinesis"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const ssm = __importStar(require("aws-cdk-lib/aws-ssm"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const eventTargets = __importStar(require("aws-cdk-lib/aws-events-targets"));
/**
 * API・フロントエンド統合コンストラクト - 強化版
 */
class APIConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
        this.usagePlans = {};
        this.apiKeys = {};
        // Parameter Store設定
        this.createParameterStore();
        // Cognito認証設定
        this.userPool = this.createUserPool();
        this.userPoolClient = this.createUserPoolClient();
        if (this.props.config.cognito.enableIdentityPool) {
            this.identityPool = this.createIdentityPool();
        }
        // API種別に応じてAPI作成
        this.restApi = this.createRestApi();
        if (this.props.config.graphql?.enabled) {
            this.graphqlApi = this.createGraphQLApi();
        }
        if (this.props.config.websocket?.enabled) {
            this.websocketApi = this.createWebSocketApi();
        }
        // API分析設定
        if (this.props.config.analytics?.enabled) {
            this.setupAPIAnalytics();
        }
        // 使用量プラン・APIキー設定
        if (this.props.config.analytics?.usagePlans.enabled) {
            this.setupUsagePlans();
        }
        // マルチテナント設定
        if (this.props.config.multiTenant?.enabled) {
            this.tenantManagerFunction = this.createTenantManagerFunction();
        }
        // WAF設定
        if (this.props.config.waf.enabled) {
            this.webAcl = this.createWebAcl();
        }
        // CloudFront設定
        if (this.props.config.cloudFront.enabled) {
            this.distribution = this.createCloudFrontDistribution();
        }
        // 統合監視ダッシュボード作成
        this.monitoringDashboard = this.createMonitoringDashboard();
        // EventBridge統合
        this.createEventBridgeIntegration();
        // 出力値の設定
        this.outputs = this.createOutputs();
        // タグ設定
        this.applyTags();
    }
    /**
     * Parameter Store設定作成
     */
    createParameterStore() {
        // API設定
        new ssm.StringParameter(this, 'APIConfiguration', {
            parameterName: `/${this.props.projectName}/${this.props.environment}/api/configuration`,
            stringValue: JSON.stringify({
                apiType: this.props.config.apiType,
                authProvider: this.props.config.apiGateway.authProvider,
                multiTenantEnabled: this.props.config.multiTenant?.enabled || false,
                analyticsEnabled: this.props.config.analytics?.enabled || false
            }),
            description: `API configuration for ${this.props.projectName} ${this.props.environment}`,
            tier: ssm.ParameterTier.STANDARD
        });
    }
    /**
     * Cognito ユーザープールの作成 - 強化版
     */
    createUserPool() {
        return new cognito.UserPool(this, 'UserPool', {
            userPoolName: `${this.props.projectName}-${this.props.environment}-user-pool`,
            selfSignUpEnabled: this.props.config.cognito.selfSignUpEnabled,
            signInAliases: {
                email: this.props.config.cognito.signInAliases.includes('email'),
                username: this.props.config.cognito.signInAliases.includes('username'),
                phone: this.props.config.cognito.signInAliases.includes('phone'),
            },
            autoVerify: {
                email: this.props.config.cognito.autoVerify.includes('email'),
                phone: this.props.config.cognito.autoVerify.includes('phone'),
            },
            passwordPolicy: {
                minLength: this.props.config.cognito.passwordPolicy.minLength,
                requireLowercase: this.props.config.cognito.passwordPolicy.requireLowercase,
                requireUppercase: this.props.config.cognito.passwordPolicy.requireUppercase,
                requireDigits: this.props.config.cognito.passwordPolicy.requireDigits,
                requireSymbols: this.props.config.cognito.passwordPolicy.requireSymbols,
            },
            mfa: this.props.config.cognito.mfa === 'required' ? cognito.Mfa.REQUIRED :
                this.props.config.cognito.mfa === 'optional' ? cognito.Mfa.OPTIONAL :
                    cognito.Mfa.OFF,
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: this.props.environment === 'prod' ?
                aws_cdk_lib_1.RemovalPolicy.RETAIN : aws_cdk_lib_1.RemovalPolicy.DESTROY,
        });
    }
    /**
     * Cognito ユーザープールクライアントの作成 - 強化版
     */
    createUserPoolClient() {
        return new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool: this.userPool,
            userPoolClientName: `${this.props.projectName}-${this.props.environment}-client`,
            generateSecret: false, // SPAの場合はfalse
            authFlows: {
                userSrp: true,
                userPassword: this.props.config.cognito.enableUserPasswordAuth,
                adminUserPassword: false,
            },
            oAuth: this.props.config.cognito.oauth ? {
                flows: {
                    authorizationCodeGrant: this.props.config.cognito.oauth.flows.includes('authorization_code'),
                    implicitCodeGrant: this.props.config.cognito.oauth.flows.includes('implicit'),
                },
                scopes: this.props.config.cognito.oauth.scopes.map(scope => {
                    switch (scope) {
                        case 'openid': return cognito.OAuthScope.OPENID;
                        case 'email': return cognito.OAuthScope.EMAIL;
                        case 'profile': return cognito.OAuthScope.PROFILE;
                        case 'phone': return cognito.OAuthScope.PHONE;
                        default: return cognito.OAuthScope.custom(scope);
                    }
                }),
                callbackUrls: this.props.config.cognito.oauth.callbackUrls,
                logoutUrls: this.props.config.cognito.oauth.logoutUrls,
            } : undefined,
        });
    }
    /**
     * Cognito Identity Pool作成
     */
    createIdentityPool() {
        const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: `${this.props.projectName}_${this.props.environment}_identity_pool`,
            allowUnauthenticatedIdentities: this.props.config.cognito.allowUnauthenticatedAccess || false,
            cognitoIdentityProviders: [{
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName,
                    serverSideTokenCheck: false
                }]
        });
        // Identity Pool用のIAMロール作成
        const authenticatedRole = new iam.Role(this, 'IdentityPoolAuthenticatedRole', {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': identityPool.ref
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated'
                }
            }, 'sts:AssumeRoleWithWebIdentity'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess')
            ]
        });
        const unauthenticatedRole = new iam.Role(this, 'IdentityPoolUnauthenticatedRole', {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': identityPool.ref
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'unauthenticated'
                }
            }, 'sts:AssumeRoleWithWebIdentity')
        });
        // Identity Pool Role Attachment
        new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
            identityPoolId: identityPool.ref,
            roles: {
                authenticated: authenticatedRole.roleArn,
                unauthenticated: unauthenticatedRole.roleArn
            }
        });
        return identityPool;
    }
    /**
     * REST API Gateway作成 - 強化版
     */
    createRestApi() {
        const api = new apigateway.RestApi(this, 'RestApi', {
            restApiName: `${this.props.projectName}-${this.props.environment}-api`,
            description: `${this.props.projectName} API for ${this.props.environment}`,
            deployOptions: {
                stageName: this.props.environment,
                throttlingRateLimit: this.props.config.apiGateway.throttling.rateLimit,
                throttlingBurstLimit: this.props.config.apiGateway.throttling.burstLimit,
                loggingLevel: this.props.config.apiGateway.logging?.level === 'info' ?
                    apigateway.MethodLoggingLevel.INFO : apigateway.MethodLoggingLevel.ERROR,
                dataTraceEnabled: this.props.config.apiGateway.logging?.dataTrace || false,
                metricsEnabled: this.props.config.apiGateway.logging?.metrics || true,
            },
            defaultCorsPreflightOptions: this.props.config.apiGateway.corsConfig ? {
                allowOrigins: this.props.config.apiGateway.corsConfig.allowOrigins,
                allowMethods: this.props.config.apiGateway.corsConfig.allowMethods,
                allowHeaders: this.props.config.apiGateway.corsConfig.allowHeaders,
                allowCredentials: this.props.config.apiGateway.corsConfig.allowCredentials,
            } : undefined,
            policy: this.props.config.apiGateway.resourcePolicy ?
                iam.PolicyDocument.fromJson(this.props.config.apiGateway.resourcePolicy) : undefined,
        });
        // Cognito Authorizer作成
        const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            cognitoUserPools: [this.userPool],
            authorizerName: `${this.props.projectName}-${this.props.environment}-authorizer`,
        });
        // Lambda統合の設定
        if (this.props.lambdaFunctions) {
            Object.entries(this.props.lambdaFunctions).forEach(([path, lambdaFunction]) => {
                const resource = api.root.addResource(path);
                const integration = new apigateway.LambdaIntegration(lambdaFunction);
                resource.addMethod('GET', integration, {
                    authorizer: this.props.config.apiGateway.authProvider === 'Cognito' ? authorizer : undefined,
                });
                resource.addMethod('POST', integration, {
                    authorizer: this.props.config.apiGateway.authProvider === 'Cognito' ? authorizer : undefined,
                });
            });
        }
        return api;
    }
    /**
     * CloudFront Distribution作成 - 強化版
     */
    createCloudFrontDistribution() {
        const originRequestPolicy = cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN;
        const cachePolicy = cloudfront.CachePolicy.CACHING_OPTIMIZED;
        const distribution = new cloudfront.Distribution(this, 'Distribution', {
            comment: `${this.props.projectName} ${this.props.environment} Distribution`,
            defaultBehavior: {
                origin: new origins.RestApiOrigin(this.restApi),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cachePolicy,
                originRequestPolicy,
                compress: true,
            },
            priceClass: this.props.config.cloudFront.priceClass === 'PriceClass_All' ?
                cloudfront.PriceClass.PRICE_CLASS_ALL :
                this.props.config.cloudFront.priceClass === '200' ?
                    cloudfront.PriceClass.PRICE_CLASS_200 :
                    cloudfront.PriceClass.PRICE_CLASS_100,
            enableLogging: this.props.config.common.enableLogging,
            webAclId: this.webAcl?.attrArn,
            domainNames: this.props.domainName ? [this.props.domainName] : undefined,
            certificate: this.props.certificate,
        });
        // Route53 Alias Record作成
        if (this.props.hostedZone && this.props.domainName) {
            new route53.ARecord(this, 'AliasRecord', {
                zone: this.props.hostedZone,
                recordName: this.props.domainName,
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
            });
        }
        return distribution;
    }
    /**
     * 価格クラスのマッピング
     */
    mapPriceClass(priceClass) {
        switch (priceClass) {
            case 'PriceClass_All':
                return cloudfront.PriceClass.PRICE_CLASS_ALL;
            case 'PriceClass_200':
                return cloudfront.PriceClass.PRICE_CLASS_200;
            case 'PriceClass_100':
                return cloudfront.PriceClass.PRICE_CLASS_100;
            default:
                return cloudfront.PriceClass.PRICE_CLASS_100;
        }
    }
    /**
     * GraphQL API作成
     */
    createGraphQLApi() {
        const graphqlConfig = this.props.config.graphql;
        const api = new appsync.GraphqlApi(this, 'GraphQLApi', {
            name: `${this.props.projectName}-${this.props.environment}-graphql-api`,
            schema: graphqlConfig.schemaPath ?
                appsync.SchemaFile.fromAsset(graphqlConfig.schemaPath) :
                appsync.SchemaFile.code(`
          type Query {
            hello: String
          }
          
          type Mutation {
            createItem(input: String!): String
          }
          
          type Subscription {
            onItemCreated: String
            @aws_subscribe(mutations: ["createItem"])
          }
        `),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: this.userPool,
                    },
                },
                additionalAuthorizationModes: [
                    {
                        authorizationType: appsync.AuthorizationType.API_KEY,
                        apiKeyConfig: {
                            expires: aws_cdk_lib_1.Duration.days(365),
                        },
                    },
                ],
            },
            logConfig: {
                fieldLogLevel: graphqlConfig.logging.fieldLevelLogs ?
                    appsync.FieldLogLevel.ALL : appsync.FieldLogLevel.ERROR,
                excludeVerboseContent: graphqlConfig.logging.excludeVerboseContent,
            },
            xrayEnabled: this.props.config.common.enableTracing,
        });
        // データソースとリゾルバーの設定
        Object.entries(graphqlConfig.resolvers).forEach(([typeName, fields]) => {
            Object.entries(fields).forEach(([fieldName, config]) => {
                let dataSource;
                switch (config.dataSource) {
                    case 'Lambda':
                        if (config.functionArn && this.props.lambdaFunctions) {
                            const lambdaFunction = Object.values(this.props.lambdaFunctions)[0]; // 簡略化
                            dataSource = api.addLambdaDataSource(`${typeName}${fieldName}DataSource`, lambdaFunction);
                        }
                        break;
                    case 'DynamoDB':
                        // DynamoDBデータソースの実装
                        break;
                    case 'OpenSearch':
                        // OpenSearchデータソースの実装
                        break;
                }
            });
        });
        return api;
    }
    /**
     * WebSocket API作成
     */
    createWebSocketApi() {
        const websocketConfig = this.props.config.websocket;
        const api = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
            apiName: `${this.props.projectName}-${this.props.environment}-websocket-api`,
            description: `WebSocket API for ${this.props.projectName}`,
            routeSelectionExpression: websocketConfig.routeSelectionExpression,
        });
        // ステージ作成
        const stage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
            webSocketApi: api,
            stageName: this.props.environment,
            autoDeploy: true,
            throttle: {
                rateLimit: websocketConfig.throttling.rateLimit,
                burstLimit: websocketConfig.throttling.burstLimit,
            },
        });
        // ルートの設定
        Object.entries(websocketConfig.routes).forEach(([routeKey, routeConfig]) => {
            if (routeConfig.integration === 'Lambda' && routeConfig.functionArn && this.props.lambdaFunctions) {
                const lambdaFunction = Object.values(this.props.lambdaFunctions)[0]; // 簡略化
                const integration = new integrations.WebSocketLambdaIntegration(`${routeKey}Integration`, lambdaFunction);
                api.addRoute(routeKey, {
                    integration,
                    authorizer: routeConfig.authorizationType === 'CUSTOM' ?
                        new authorizers.WebSocketLambdaAuthorizer(`${routeKey}Authorizer`, lambdaFunction) : undefined,
                });
            }
        });
        return api;
    }
    /**
     * API分析設定
     */
    setupAPIAnalytics() {
        const analyticsConfig = this.props.config.analytics;
        if (analyticsConfig.kinesis.enabled) {
            this.kinesisStream = new kinesis.Stream(this, 'APIAnalyticsStream', {
                streamName: analyticsConfig.kinesis.streamName ||
                    `${this.props.projectName}-${this.props.environment}-api-analytics`,
                retentionPeriod: aws_cdk_lib_1.Duration.days(analyticsConfig.kinesis.retentionPeriod),
                shardCount: 1,
            });
        }
        if (analyticsConfig.customMetrics.enabled) {
            // カスタムメトリクスの設定
            const namespace = analyticsConfig.customMetrics.namespace;
            // API Gateway用カスタムメトリクス
            new cloudwatch.Metric({
                namespace,
                metricName: 'APIRequests',
                dimensionsMap: {
                    ApiName: this.restApi.restApiName,
                    Stage: this.props.environment,
                },
            });
        }
    }
    /**
     * 使用量プラン・APIキー設定
     */
    setupUsagePlans() {
        const usagePlansConfig = this.props.config.analytics.usagePlans;
        Object.entries(usagePlansConfig.plans).forEach(([planName, planConfig]) => {
            const usagePlan = new apigateway.UsagePlan(this, `UsagePlan${planName}`, {
                name: `${this.props.projectName}-${this.props.environment}-${planName}`,
                throttle: {
                    rateLimit: planConfig.throttle.rateLimit,
                    burstLimit: planConfig.throttle.burstLimit,
                },
                quota: {
                    limit: planConfig.quota.limit,
                    period: planConfig.quota.period === 'DAY' ? apigateway.Period.DAY :
                        planConfig.quota.period === 'WEEK' ? apigateway.Period.WEEK :
                            apigateway.Period.MONTH,
                },
                apiStages: [{
                        api: this.restApi,
                        stage: this.restApi.deploymentStage,
                    }],
            });
            this.usagePlans[planName] = usagePlan;
            // APIキーの作成と関連付け
            planConfig.apiKeys.forEach((keyName, index) => {
                const apiKey = new apigateway.ApiKey(this, `ApiKey${planName}${index}`, {
                    apiKeyName: `${this.props.projectName}-${this.props.environment}-${keyName}`,
                    description: `API Key for ${planName} plan`,
                });
                usagePlan.addApiKey(apiKey);
                this.apiKeys[keyName] = apiKey;
            });
        });
    }
    /**
     * マルチテナント管理関数作成
     */
    createTenantManagerFunction() {
        return new lambda.Function(this, 'TenantManagerFunction', {
            functionName: `${this.props.projectName}-${this.props.environment}-tenant-manager`,
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Tenant management event:', JSON.stringify(event, null, 2));
          
          const { tenantId, action } = event;
          
          switch (action) {
            case 'create':
              // テナント作成ロジック
              return { statusCode: 200, body: JSON.stringify({ message: 'Tenant created', tenantId }) };
            case 'update':
              // テナント更新ロジック
              return { statusCode: 200, body: JSON.stringify({ message: 'Tenant updated', tenantId }) };
            case 'delete':
              // テナント削除ロジック
              return { statusCode: 200, body: JSON.stringify({ message: 'Tenant deleted', tenantId }) };
            default:
              return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
          }
        };
      `),
            timeout: aws_cdk_lib_1.Duration.seconds(30),
            memorySize: 256,
            environment: {
                PROJECT_NAME: this.props.projectName,
                ENVIRONMENT: this.props.environment,
                TENANT_STRATEGY: this.props.config.multiTenant.strategy,
            },
        });
    }
    /**
     * WAF Web ACL作成
     */
    createWebAcl() {
        const rules = [];
        // AWS Managed Rules
        if (this.props.config.waf.managedRules.awsCommonRuleSet) {
            rules.push({
                name: 'AWSManagedRulesCommonRuleSet',
                priority: 1,
                overrideAction: { none: {} },
                statement: {
                    managedRuleGroupStatement: {
                        vendorName: 'AWS',
                        name: 'AWSManagedRulesCommonRuleSet',
                    },
                },
                visibilityConfig: {
                    sampledRequestsEnabled: true,
                    cloudWatchMetricsEnabled: true,
                    metricName: 'CommonRuleSetMetric',
                },
            });
        }
        if (this.props.config.waf.managedRules.awsKnownBadInputsRuleSet) {
            rules.push({
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
                priority: 2,
                overrideAction: { none: {} },
                statement: {
                    managedRuleGroupStatement: {
                        vendorName: 'AWS',
                        name: 'AWSManagedRulesKnownBadInputsRuleSet',
                    },
                },
                visibilityConfig: {
                    sampledRequestsEnabled: true,
                    cloudWatchMetricsEnabled: true,
                    metricName: 'KnownBadInputsRuleSetMetric',
                },
            });
        }
        // Rate Limiting Rule
        if (this.props.config.waf.rateLimiting.enabled) {
            rules.push({
                name: 'RateLimitRule',
                priority: 10,
                action: { block: {} },
                statement: {
                    rateBasedStatement: {
                        limit: this.props.config.waf.rateLimiting.limit,
                        aggregateKeyType: 'IP',
                    },
                },
                visibilityConfig: {
                    sampledRequestsEnabled: true,
                    cloudWatchMetricsEnabled: true,
                    metricName: 'RateLimitRuleMetric',
                },
            });
        }
        return new wafv2.CfnWebACL(this, 'WebAcl', {
            name: `${this.props.projectName}-${this.props.environment}-web-acl`,
            scope: 'CLOUDFRONT',
            defaultAction: { allow: {} },
            rules,
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: `${this.props.projectName}${this.props.environment}WebAcl`,
            },
        });
    } /*
  *
     * 統合監視ダッシュボード作成
     */
    createMonitoringDashboard() {
        const dashboard = new cloudwatch.Dashboard(this, 'APIMonitoringDashboard', {
            dashboardName: `${this.props.projectName}-${this.props.environment}-api-dashboard`,
        });
        // API Gateway メトリクス
        dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: 'API Gateway Requests',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: 'Count',
                    dimensionsMap: {
                        ApiName: this.restApi.restApiName,
                        Stage: this.props.environment,
                    },
                    statistic: 'Sum',
                }),
            ],
            width: 12,
        }), new cloudwatch.GraphWidget({
            title: 'API Gateway Latency',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: 'Latency',
                    dimensionsMap: {
                        ApiName: this.restApi.restApiName,
                        Stage: this.props.environment,
                    },
                    statistic: 'Average',
                }),
            ],
            width: 12,
        }));
        // Cognito メトリクス
        if (this.userPool) {
            dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'Cognito User Pool Metrics',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Cognito',
                        metricName: 'SignInSuccesses',
                        dimensionsMap: {
                            UserPool: this.userPool.userPoolId,
                            UserPoolClient: this.userPoolClient.userPoolClientId,
                        },
                        statistic: 'Sum',
                    }),
                ],
                width: 12,
            }));
        }
        // CloudFront メトリクス
        if (this.distribution) {
            dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'CloudFront Requests',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: 'Requests',
                        dimensionsMap: {
                            DistributionId: this.distribution.distributionId,
                        },
                        statistic: 'Sum',
                    }),
                ],
                width: 12,
            }));
        }
        return dashboard;
    }
    /**
     * EventBridge統合
     */
    createEventBridgeIntegration() {
        const eventBus = events.EventBus.fromEventBusName(this, 'DefaultEventBus', 'default');
        // API イベントルール
        const apiEventRule = new events.Rule(this, 'APIEventRule', {
            eventBus,
            ruleName: `${this.props.projectName}-${this.props.environment}-api-events`,
            description: 'API related events',
            eventPattern: {
                source: ['aws.apigateway'],
                detailType: ['API Gateway Execution Logs'],
            },
        });
        // CloudWatch Logs ターゲット
        const logGroup = new logs.LogGroup(this, 'APIEventLogGroup', {
            logGroupName: `/aws/events/${this.props.projectName}/${this.props.environment}/api`,
            retention: logs.RetentionDays.ONE_MONTH,
        });
        apiEventRule.addTarget(new eventTargets.CloudWatchLogGroup(logGroup));
    }
    /**
     * 出力値作成
     */
    createOutputs() {
        return {
            // Cognito出力
            userPoolId: this.userPool.userPoolId,
            userPoolArn: this.userPool.userPoolArn,
            userPoolClientId: this.userPoolClient.userPoolClientId,
            identityPoolId: this.identityPool?.ref,
            identityPoolArn: this.identityPool?.attrArn,
            // REST API Gateway出力
            restApiId: this.restApi.restApiId,
            restApiArn: this.restApi.restApiArn,
            restApiUrl: this.restApi.url,
            restApiStage: this.props.environment,
            // GraphQL API出力
            graphqlApiId: this.graphqlApi?.apiId,
            graphqlApiArn: this.graphqlApi?.arn,
            graphqlApiUrl: this.graphqlApi?.graphqlUrl,
            graphqlApiKey: this.graphqlApi?.apiKey,
            // WebSocket API出力
            websocketApiId: this.websocketApi?.apiId,
            websocketApiArn: this.websocketApi?.apiArn,
            websocketApiUrl: this.websocketApi?.apiEndpoint,
            websocketApiStage: this.props.environment,
            // CloudFront出力
            distributionId: this.distribution?.distributionId,
            distributionDomainName: this.distribution?.distributionDomainName,
            distributionUrl: this.distribution ? `https://${this.distribution.distributionDomainName}` : undefined,
            // WAF出力
            webAclId: this.webAcl?.attrId,
            webAclArn: this.webAcl?.attrArn,
            // カスタムドメイン出力
            customDomainName: this.props.domainName,
            customDomainUrl: this.props.domainName ? `https://${this.props.domainName}` : undefined,
            // API分析出力
            kinesisStreamArn: this.kinesisStream?.streamArn,
            usagePlanIds: Object.fromEntries(Object.entries(this.usagePlans).map(([name, plan]) => [name, plan.usagePlanId])),
            apiKeyIds: Object.fromEntries(Object.entries(this.apiKeys).map(([name, key]) => [name, key.keyId])),
            // マルチテナント出力
            tenantConfigs: this.props.config.multiTenant?.enabled ? {} : undefined,
        };
    }
    /**
     * タグ適用
     */
    applyTags() {
        const tags = this.props.config.tags;
        aws_cdk_lib_1.Tags.of(this).add('APIType', tags.APIType);
        aws_cdk_lib_1.Tags.of(this).add('AuthProvider', tags.AuthProvider);
        aws_cdk_lib_1.Tags.of(this).add('CDNProvider', tags.CDNProvider);
        if (tags.SecurityLevel) {
            aws_cdk_lib_1.Tags.of(this).add('SecurityLevel', tags.SecurityLevel);
        }
        if (tags.CacheStrategy) {
            aws_cdk_lib_1.Tags.of(this).add('CacheStrategy', tags.CacheStrategy);
        }
    }
    /**
     * 価格クラスのマッピング
     */
    mapPriceClass(priceClass) {
        switch (priceClass) {
            case 'PriceClass_All':
                return cloudfront.PriceClass.PRICE_CLASS_ALL;
            case 'PriceClass_200':
                return cloudfront.PriceClass.PRICE_CLASS_200;
            case 'PriceClass_100':
                return cloudfront.PriceClass.PRICE_CLASS_100;
            default:
                return cloudfront.PriceClass.PRICE_CLASS_100;
        }
    }
}
exports.APIConstruct = APIConstruct;
