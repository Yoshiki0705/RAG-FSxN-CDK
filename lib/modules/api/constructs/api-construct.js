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
    props;
    outputs;
    // 認証関連
    userPool;
    userPoolClient;
    identityPool;
    // API関連
    restApi;
    graphqlApi;
    websocketApi;
    // CDN・セキュリティ関連
    distribution;
    webAcl;
    // 分析・監視関連
    kinesisStream;
    usagePlans = {};
    apiKeys = {};
    monitoringDashboard;
    // マルチテナント関連
    tenantManagerFunction;
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWNvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwaS1jb25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7OztHQWNHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDJDQUF1QztBQUN2Qyw2Q0FBNEQ7QUFDNUQsdUVBQXlEO0FBQ3pELDJFQUE2RDtBQUM3RCx3RkFBMEU7QUFDMUUsc0ZBQXdFO0FBQ3hFLGlFQUFtRDtBQUNuRCxpRUFBbUQ7QUFDbkQsdUVBQXlEO0FBQ3pELDRFQUE4RDtBQUM5RCwrREFBaUQ7QUFDakQseURBQTJDO0FBQzNDLDZEQUErQztBQUMvQyxpRUFBbUQ7QUFDbkQseUVBQTJEO0FBRTNELGlFQUFtRDtBQUNuRCx1RUFBeUQ7QUFDekQsMkRBQTZDO0FBQzdDLHlEQUEyQztBQUMzQywrREFBaUQ7QUFDakQsNkVBQStEO0FBcUIvRDs7R0FFRztBQUNILE1BQWEsWUFBYSxTQUFRLHNCQUFTO0lBMEJTO0lBekJsQyxPQUFPLENBQWE7SUFFcEMsT0FBTztJQUNTLFFBQVEsQ0FBbUI7SUFDM0IsY0FBYyxDQUF5QjtJQUN2QyxZQUFZLENBQTJCO0lBRXZELFFBQVE7SUFDUSxPQUFPLENBQXFCO0lBQzVCLFVBQVUsQ0FBc0I7SUFDaEMsWUFBWSxDQUE2QjtJQUV6RCxlQUFlO0lBQ0MsWUFBWSxDQUEyQjtJQUN2QyxNQUFNLENBQW1CO0lBRXpDLFVBQVU7SUFDTSxhQUFhLENBQWtCO0lBQy9CLFVBQVUsR0FBaUQsRUFBRSxDQUFDO0lBQzlELE9BQU8sR0FBNkMsRUFBRSxDQUFDO0lBQ3ZELG1CQUFtQixDQUF1QjtJQUUxRCxZQUFZO0lBQ0kscUJBQXFCLENBQW1CO0lBRXhELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQVUsS0FBd0I7UUFDeEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUQrQixVQUFLLEdBQUwsS0FBSyxDQUFtQjtRQUd4RSxv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RCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0ssYUFBYSxDQUFDLFVBQWtCO1FBQ3RDLFFBQVEsVUFBVSxFQUFFLENBQUM7WUFDbkIsS0FBSyxnQkFBZ0I7Z0JBQ25CLE9BQU8sVUFBVSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7WUFDL0MsS0FBSyxnQkFBZ0I7Z0JBQ25CLE9BQU8sVUFBVSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7WUFDL0MsS0FBSyxnQkFBZ0I7Z0JBQ25CLE9BQU8sVUFBVSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7WUFDL0M7Z0JBQ0UsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQztRQUNqRCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBL3pCRCxvQ0ErekJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBUEnjgrPjg7Pjgrnjg4jjg6njgq/jg4ggLSDlvLfljJbniYhcbiAqIFxuICogUkVTVCBBUEnjgIFHcmFwaFFMIEFQSeOAgVdlYlNvY2tldCBBUEnjgIFDb2duaXRv44CBQ2xvdWRGcm9udOOBrue1seWQiOeuoeeQhuOCkuaPkOS+m1xuICogXG4gKiDntbHlkIjmqZ/og706XG4gKiAtIFJFU1QgQVBJIEdhdGV3YXnvvIjlvpPmnaXmqZ/og73vvIlcbiAqIC0gR3JhcGhRTCBBUEnvvIhBcHBTeW5j57Wx5ZCI77yJXG4gKiAtIFdlYlNvY2tldCBBUEnvvIjjg6rjgqLjg6vjgr/jgqTjg6DpgJrkv6HvvIlcbiAqIC0g6auY5bqm44Gq6KqN6Ki844O76KqN5Y+v77yIQ29nbml0byArIElkZW50aXR5IFBvb2zvvIlcbiAqIC0g44Oe44Or44OB44OG44OK44Oz44OI5a++5b+cXG4gKiAtIEFQSeWIhuaekOODu+ebo+imllxuICogLSDkvb/nlKjph4/jg5fjg6njg7Pjg7tBUEkg44Kt44O8566h55CGXG4gKiAtIOOCq+OCueOCv+ODoOODieODoeOCpOODs+ODu1NTTOiovOaYjuabuFxuICovXG5cbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgRHVyYXRpb24sIFJlbW92YWxQb2xpY3ksIFRhZ3MgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXl2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyJztcbmltcG9ydCAqIGFzIGludGVncmF0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyLWludGVncmF0aW9ucyc7XG5pbXBvcnQgKiBhcyBhdXRob3JpemVycyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyLWF1dGhvcml6ZXJzJztcbmltcG9ydCAqIGFzIGFwcHN5bmMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwcHN5bmMnO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyB3YWZ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtd2FmdjInO1xuaW1wb3J0ICogYXMgcm91dGU1MyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzLXRhcmdldHMnO1xuaW1wb3J0ICogYXMgYWNtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0ICogYXMga2luZXNpcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta2luZXNpcyc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zc20nO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgZXZlbnRUYXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBBUElDb25maWcsIEFQSU91dHB1dHMsIEFQSVR5cGUgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2FwaS1jb25maWcnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFQSUNvbnN0cnVjdFByb3BzIHtcbiAgY29uZmlnOiBBUElDb25maWc7XG4gIHByb2plY3ROYW1lOiBzdHJpbmc7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBsYW1iZGFGdW5jdGlvbnM/OiB7IFtrZXk6IHN0cmluZ106IGxhbWJkYS5GdW5jdGlvbiB9O1xuICBkb21haW5OYW1lPzogc3RyaW5nO1xuICBjZXJ0aWZpY2F0ZT86IGFjbS5JQ2VydGlmaWNhdGU7XG4gIGhvc3RlZFpvbmU/OiByb3V0ZTUzLklIb3N0ZWRab25lO1xuICBleGlzdGluZ1Jlc291cmNlcz86IHtcbiAgICB2cGM/OiBhbnk7XG4gICAga21zS2V5PzogYW55O1xuICAgIGRhdGFiYXNlU3RhY2s/OiBhbnk7XG4gICAgc3RvcmFnZVN0YWNrPzogYW55O1xuICAgIGNvbXB1dGVTdGFjaz86IGFueTtcbiAgfTtcbn1cblxuLyoqXG4gKiBBUEnjg7vjg5Xjg63jg7Pjg4jjgqjjg7Pjg4nntbHlkIjjgrPjg7Pjgrnjg4jjg6njgq/jg4ggLSDlvLfljJbniYhcbiAqL1xuZXhwb3J0IGNsYXNzIEFQSUNvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBvdXRwdXRzOiBBUElPdXRwdXRzO1xuICBcbiAgLy8g6KqN6Ki86Zai6YCjXG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sQ2xpZW50OiBjb2duaXRvLlVzZXJQb29sQ2xpZW50O1xuICBwdWJsaWMgcmVhZG9ubHkgaWRlbnRpdHlQb29sPzogY29nbml0by5DZm5JZGVudGl0eVBvb2w7XG4gIFxuICAvLyBBUEnplqLpgKNcbiAgcHVibGljIHJlYWRvbmx5IHJlc3RBcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgcHVibGljIHJlYWRvbmx5IGdyYXBocWxBcGk/OiBhcHBzeW5jLkdyYXBocWxBcGk7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJzb2NrZXRBcGk/OiBhcGlnYXRld2F5djIuV2ViU29ja2V0QXBpO1xuICBcbiAgLy8gQ0RO44O744K744Kt44Ol44Oq44OG44Kj6Zai6YCjXG4gIHB1YmxpYyByZWFkb25seSBkaXN0cmlidXRpb24/OiBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IHdlYkFjbD86IHdhZnYyLkNmbldlYkFDTDtcbiAgXG4gIC8vIOWIhuaekOODu+ebo+imlumWoumAo1xuICBwdWJsaWMgcmVhZG9ubHkga2luZXNpc1N0cmVhbT86IGtpbmVzaXMuU3RyZWFtO1xuICBwdWJsaWMgcmVhZG9ubHkgdXNhZ2VQbGFuczogeyBbcGxhbk5hbWU6IHN0cmluZ106IGFwaWdhdGV3YXkuVXNhZ2VQbGFuIH0gPSB7fTtcbiAgcHVibGljIHJlYWRvbmx5IGFwaUtleXM6IHsgW2tleU5hbWU6IHN0cmluZ106IGFwaWdhdGV3YXkuQXBpS2V5IH0gPSB7fTtcbiAgcHVibGljIHJlYWRvbmx5IG1vbml0b3JpbmdEYXNoYm9hcmQ6IGNsb3Vkd2F0Y2guRGFzaGJvYXJkO1xuICBcbiAgLy8g44Oe44Or44OB44OG44OK44Oz44OI6Zai6YCjXG4gIHB1YmxpYyByZWFkb25seSB0ZW5hbnRNYW5hZ2VyRnVuY3Rpb24/OiBsYW1iZGEuRnVuY3Rpb247XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJpdmF0ZSBwcm9wczogQVBJQ29uc3RydWN0UHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gUGFyYW1ldGVyIFN0b3Jl6Kit5a6aXG4gICAgdGhpcy5jcmVhdGVQYXJhbWV0ZXJTdG9yZSgpO1xuXG4gICAgLy8gQ29nbml0b+iqjeiovOioreWumlxuICAgIHRoaXMudXNlclBvb2wgPSB0aGlzLmNyZWF0ZVVzZXJQb29sKCk7XG4gICAgdGhpcy51c2VyUG9vbENsaWVudCA9IHRoaXMuY3JlYXRlVXNlclBvb2xDbGllbnQoKTtcbiAgICBcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuY29nbml0by5lbmFibGVJZGVudGl0eVBvb2wpIHtcbiAgICAgIHRoaXMuaWRlbnRpdHlQb29sID0gdGhpcy5jcmVhdGVJZGVudGl0eVBvb2woKTtcbiAgICB9XG5cbiAgICAvLyBBUEnnqK7liKXjgavlv5zjgZjjgaZBUEnkvZzmiJBcbiAgICB0aGlzLnJlc3RBcGkgPSB0aGlzLmNyZWF0ZVJlc3RBcGkoKTtcbiAgICBcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuZ3JhcGhxbD8uZW5hYmxlZCkge1xuICAgICAgdGhpcy5ncmFwaHFsQXBpID0gdGhpcy5jcmVhdGVHcmFwaFFMQXBpKCk7XG4gICAgfVxuICAgIFxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy53ZWJzb2NrZXQ/LmVuYWJsZWQpIHtcbiAgICAgIHRoaXMud2Vic29ja2V0QXBpID0gdGhpcy5jcmVhdGVXZWJTb2NrZXRBcGkoKTtcbiAgICB9XG5cbiAgICAvLyBBUEnliIbmnpDoqK3lrppcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuYW5hbHl0aWNzPy5lbmFibGVkKSB7XG4gICAgICB0aGlzLnNldHVwQVBJQW5hbHl0aWNzKCk7XG4gICAgfVxuXG4gICAgLy8g5L2/55So6YeP44OX44Op44Oz44O7QVBJ44Kt44O86Kit5a6aXG4gICAgaWYgKHRoaXMucHJvcHMuY29uZmlnLmFuYWx5dGljcz8udXNhZ2VQbGFucy5lbmFibGVkKSB7XG4gICAgICB0aGlzLnNldHVwVXNhZ2VQbGFucygpO1xuICAgIH1cblxuICAgIC8vIOODnuODq+ODgeODhuODiuODs+ODiOioreWumlxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy5tdWx0aVRlbmFudD8uZW5hYmxlZCkge1xuICAgICAgdGhpcy50ZW5hbnRNYW5hZ2VyRnVuY3Rpb24gPSB0aGlzLmNyZWF0ZVRlbmFudE1hbmFnZXJGdW5jdGlvbigpO1xuICAgIH1cblxuICAgIC8vIFdBRuioreWumlxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy53YWYuZW5hYmxlZCkge1xuICAgICAgdGhpcy53ZWJBY2wgPSB0aGlzLmNyZWF0ZVdlYkFjbCgpO1xuICAgIH1cblxuICAgIC8vIENsb3VkRnJvbnToqK3lrppcbiAgICBpZiAodGhpcy5wcm9wcy5jb25maWcuY2xvdWRGcm9udC5lbmFibGVkKSB7XG4gICAgICB0aGlzLmRpc3RyaWJ1dGlvbiA9IHRoaXMuY3JlYXRlQ2xvdWRGcm9udERpc3RyaWJ1dGlvbigpO1xuICAgIH1cblxuICAgIC8vIOe1seWQiOebo+imluODgOODg+OCt+ODpeODnOODvOODieS9nOaIkFxuICAgIHRoaXMubW9uaXRvcmluZ0Rhc2hib2FyZCA9IHRoaXMuY3JlYXRlTW9uaXRvcmluZ0Rhc2hib2FyZCgpO1xuXG4gICAgLy8gRXZlbnRCcmlkZ2XntbHlkIhcbiAgICB0aGlzLmNyZWF0ZUV2ZW50QnJpZGdlSW50ZWdyYXRpb24oKTtcblxuICAgIC8vIOWHuuWKm+WApOOBruioreWumlxuICAgIHRoaXMub3V0cHV0cyA9IHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgLy8g44K/44Kw6Kit5a6aXG4gICAgdGhpcy5hcHBseVRhZ3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJhbWV0ZXIgU3RvcmXoqK3lrprkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlUGFyYW1ldGVyU3RvcmUoKTogdm9pZCB7XG4gICAgLy8gQVBJ6Kit5a6aXG4gICAgbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgJ0FQSUNvbmZpZ3VyYXRpb24nLCB7XG4gICAgICBwYXJhbWV0ZXJOYW1lOiBgLyR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0vJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS9hcGkvY29uZmlndXJhdGlvbmAsXG4gICAgICBzdHJpbmdWYWx1ZTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBhcGlUeXBlOiB0aGlzLnByb3BzLmNvbmZpZy5hcGlUeXBlLFxuICAgICAgICBhdXRoUHJvdmlkZXI6IHRoaXMucHJvcHMuY29uZmlnLmFwaUdhdGV3YXkuYXV0aFByb3ZpZGVyLFxuICAgICAgICBtdWx0aVRlbmFudEVuYWJsZWQ6IHRoaXMucHJvcHMuY29uZmlnLm11bHRpVGVuYW50Py5lbmFibGVkIHx8IGZhbHNlLFxuICAgICAgICBhbmFseXRpY3NFbmFibGVkOiB0aGlzLnByb3BzLmNvbmZpZy5hbmFseXRpY3M/LmVuYWJsZWQgfHwgZmFsc2VcbiAgICAgIH0pLFxuICAgICAgZGVzY3JpcHRpb246IGBBUEkgY29uZmlndXJhdGlvbiBmb3IgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfSAke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9YCxcbiAgICAgIHRpZXI6IHNzbS5QYXJhbWV0ZXJUaWVyLlNUQU5EQVJEXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29nbml0byDjg6bjg7zjgrbjg7zjg5fjg7zjg6vjga7kvZzmiJAgLSDlvLfljJbniYhcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlVXNlclBvb2woKTogY29nbml0by5Vc2VyUG9vbCB7XG4gICAgcmV0dXJuIG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS11c2VyLXBvb2xgLFxuICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRoaXMucHJvcHMuY29uZmlnLmNvZ25pdG8uc2VsZlNpZ25VcEVuYWJsZWQsXG4gICAgICBzaWduSW5BbGlhc2VzOiB7XG4gICAgICAgIGVtYWlsOiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLnNpZ25JbkFsaWFzZXMuaW5jbHVkZXMoJ2VtYWlsJyksXG4gICAgICAgIHVzZXJuYW1lOiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLnNpZ25JbkFsaWFzZXMuaW5jbHVkZXMoJ3VzZXJuYW1lJyksXG4gICAgICAgIHBob25lOiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLnNpZ25JbkFsaWFzZXMuaW5jbHVkZXMoJ3Bob25lJyksXG4gICAgICB9LFxuICAgICAgYXV0b1ZlcmlmeToge1xuICAgICAgICBlbWFpbDogdGhpcy5wcm9wcy5jb25maWcuY29nbml0by5hdXRvVmVyaWZ5LmluY2x1ZGVzKCdlbWFpbCcpLFxuICAgICAgICBwaG9uZTogdGhpcy5wcm9wcy5jb25maWcuY29nbml0by5hdXRvVmVyaWZ5LmluY2x1ZGVzKCdwaG9uZScpLFxuICAgICAgfSxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogdGhpcy5wcm9wcy5jb25maWcuY29nbml0by5wYXNzd29yZFBvbGljeS5taW5MZW5ndGgsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRoaXMucHJvcHMuY29uZmlnLmNvZ25pdG8ucGFzc3dvcmRQb2xpY3kucmVxdWlyZUxvd2VyY2FzZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdGhpcy5wcm9wcy5jb25maWcuY29nbml0by5wYXNzd29yZFBvbGljeS5yZXF1aXJlVXBwZXJjYXNlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLnBhc3N3b3JkUG9saWN5LnJlcXVpcmVEaWdpdHMsXG4gICAgICAgIHJlcXVpcmVTeW1ib2xzOiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLnBhc3N3b3JkUG9saWN5LnJlcXVpcmVTeW1ib2xzLFxuICAgICAgfSxcbiAgICAgIG1mYTogdGhpcy5wcm9wcy5jb25maWcuY29nbml0by5tZmEgPT09ICdyZXF1aXJlZCcgPyBjb2duaXRvLk1mYS5SRVFVSVJFRCA6XG4gICAgICAgICAgIHRoaXMucHJvcHMuY29uZmlnLmNvZ25pdG8ubWZhID09PSAnb3B0aW9uYWwnID8gY29nbml0by5NZmEuT1BUSU9OQUwgOlxuICAgICAgICAgICBjb2duaXRvLk1mYS5PRkYsXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX09OTFksXG4gICAgICByZW1vdmFsUG9saWN5OiB0aGlzLnByb3BzLmVudmlyb25tZW50ID09PSAncHJvZCcgPyBcbiAgICAgICAgUmVtb3ZhbFBvbGljeS5SRVRBSU4gOiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29nbml0byDjg6bjg7zjgrbjg7zjg5fjg7zjg6vjgq/jg6njgqTjgqLjg7Pjg4jjga7kvZzmiJAgLSDlvLfljJbniYhcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlVXNlclBvb2xDbGllbnQoKTogY29nbml0by5Vc2VyUG9vbENsaWVudCB7XG4gICAgcmV0dXJuIG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sOiB0aGlzLnVzZXJQb29sLFxuICAgICAgdXNlclBvb2xDbGllbnROYW1lOiBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LWNsaWVudGAsXG4gICAgICBnZW5lcmF0ZVNlY3JldDogZmFsc2UsIC8vIFNQQeOBruWgtOWQiOOBr2ZhbHNlXG4gICAgICBhdXRoRmxvd3M6IHtcbiAgICAgICAgdXNlclNycDogdHJ1ZSxcbiAgICAgICAgdXNlclBhc3N3b3JkOiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLmVuYWJsZVVzZXJQYXNzd29yZEF1dGgsXG4gICAgICAgIGFkbWluVXNlclBhc3N3b3JkOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBvQXV0aDogdGhpcy5wcm9wcy5jb25maWcuY29nbml0by5vYXV0aCA/IHtcbiAgICAgICAgZmxvd3M6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLm9hdXRoLmZsb3dzLmluY2x1ZGVzKCdhdXRob3JpemF0aW9uX2NvZGUnKSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogdGhpcy5wcm9wcy5jb25maWcuY29nbml0by5vYXV0aC5mbG93cy5pbmNsdWRlcygnaW1wbGljaXQnKSxcbiAgICAgICAgfSxcbiAgICAgICAgc2NvcGVzOiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLm9hdXRoLnNjb3Blcy5tYXAoc2NvcGUgPT4ge1xuICAgICAgICAgIHN3aXRjaCAoc2NvcGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ29wZW5pZCc6IHJldHVybiBjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklEO1xuICAgICAgICAgICAgY2FzZSAnZW1haWwnOiByZXR1cm4gY29nbml0by5PQXV0aFNjb3BlLkVNQUlMO1xuICAgICAgICAgICAgY2FzZSAncHJvZmlsZSc6IHJldHVybiBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRTtcbiAgICAgICAgICAgIGNhc2UgJ3Bob25lJzogcmV0dXJuIGNvZ25pdG8uT0F1dGhTY29wZS5QSE9ORTtcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBjb2duaXRvLk9BdXRoU2NvcGUuY3VzdG9tKHNjb3BlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBjYWxsYmFja1VybHM6IHRoaXMucHJvcHMuY29uZmlnLmNvZ25pdG8ub2F1dGguY2FsbGJhY2tVcmxzLFxuICAgICAgICBsb2dvdXRVcmxzOiB0aGlzLnByb3BzLmNvbmZpZy5jb2duaXRvLm9hdXRoLmxvZ291dFVybHMsXG4gICAgICB9IDogdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvZ25pdG8gSWRlbnRpdHkgUG9vbOS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVJZGVudGl0eVBvb2woKTogY29nbml0by5DZm5JZGVudGl0eVBvb2wge1xuICAgIGNvbnN0IGlkZW50aXR5UG9vbCA9IG5ldyBjb2duaXRvLkNmbklkZW50aXR5UG9vbCh0aGlzLCAnSWRlbnRpdHlQb29sJywge1xuICAgICAgaWRlbnRpdHlQb29sTmFtZTogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX1fJHt0aGlzLnByb3BzLmVudmlyb25tZW50fV9pZGVudGl0eV9wb29sYCxcbiAgICAgIGFsbG93VW5hdXRoZW50aWNhdGVkSWRlbnRpdGllczogdGhpcy5wcm9wcy5jb25maWcuY29nbml0by5hbGxvd1VuYXV0aGVudGljYXRlZEFjY2VzcyB8fCBmYWxzZSxcbiAgICAgIGNvZ25pdG9JZGVudGl0eVByb3ZpZGVyczogW3tcbiAgICAgICAgY2xpZW50SWQ6IHRoaXMudXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgICAgcHJvdmlkZXJOYW1lOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sUHJvdmlkZXJOYW1lLFxuICAgICAgICBzZXJ2ZXJTaWRlVG9rZW5DaGVjazogZmFsc2VcbiAgICAgIH1dXG4gICAgfSk7XG5cbiAgICAvLyBJZGVudGl0eSBQb29s55So44GuSUFN44Ot44O844Or5L2c5oiQXG4gICAgY29uc3QgYXV0aGVudGljYXRlZFJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0lkZW50aXR5UG9vbEF1dGhlbnRpY2F0ZWRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLkZlZGVyYXRlZFByaW5jaXBhbCgnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tJywge1xuICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmF1ZCc6IGlkZW50aXR5UG9vbC5yZWZcbiAgICAgICAgfSxcbiAgICAgICAgJ0ZvckFueVZhbHVlOlN0cmluZ0xpa2UnOiB7XG4gICAgICAgICAgJ2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTphbXInOiAnYXV0aGVudGljYXRlZCdcbiAgICAgICAgfVxuICAgICAgfSwgJ3N0czpBc3N1bWVSb2xlV2l0aFdlYklkZW50aXR5JyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25BUElHYXRld2F5SW52b2tlRnVsbEFjY2VzcycpXG4gICAgICBdXG4gICAgfSk7XG5cbiAgICBjb25zdCB1bmF1dGhlbnRpY2F0ZWRSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdJZGVudGl0eVBvb2xVbmF1dGhlbnRpY2F0ZWRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLkZlZGVyYXRlZFByaW5jaXBhbCgnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tJywge1xuICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmF1ZCc6IGlkZW50aXR5UG9vbC5yZWZcbiAgICAgICAgfSxcbiAgICAgICAgJ0ZvckFueVZhbHVlOlN0cmluZ0xpa2UnOiB7XG4gICAgICAgICAgJ2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTphbXInOiAndW5hdXRoZW50aWNhdGVkJ1xuICAgICAgICB9XG4gICAgICB9LCAnc3RzOkFzc3VtZVJvbGVXaXRoV2ViSWRlbnRpdHknKVxuICAgIH0pO1xuXG4gICAgLy8gSWRlbnRpdHkgUG9vbCBSb2xlIEF0dGFjaG1lbnRcbiAgICBuZXcgY29nbml0by5DZm5JZGVudGl0eVBvb2xSb2xlQXR0YWNobWVudCh0aGlzLCAnSWRlbnRpdHlQb29sUm9sZUF0dGFjaG1lbnQnLCB7XG4gICAgICBpZGVudGl0eVBvb2xJZDogaWRlbnRpdHlQb29sLnJlZixcbiAgICAgIHJvbGVzOiB7XG4gICAgICAgIGF1dGhlbnRpY2F0ZWQ6IGF1dGhlbnRpY2F0ZWRSb2xlLnJvbGVBcm4sXG4gICAgICAgIHVuYXV0aGVudGljYXRlZDogdW5hdXRoZW50aWNhdGVkUm9sZS5yb2xlQXJuXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaWRlbnRpdHlQb29sO1xuICB9XG5cbiAgLyoqXG4gICAqIFJFU1QgQVBJIEdhdGV3YXnkvZzmiJAgLSDlvLfljJbniYhcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlUmVzdEFwaSgpOiBhcGlnYXRld2F5LlJlc3RBcGkge1xuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1Jlc3RBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1hcGlgLFxuICAgICAgZGVzY3JpcHRpb246IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9IEFQSSBmb3IgJHt0aGlzLnByb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHN0YWdlTmFtZTogdGhpcy5wcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgICAgdGhyb3R0bGluZ1JhdGVMaW1pdDogdGhpcy5wcm9wcy5jb25maWcuYXBpR2F0ZXdheS50aHJvdHRsaW5nLnJhdGVMaW1pdCxcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IHRoaXMucHJvcHMuY29uZmlnLmFwaUdhdGV3YXkudGhyb3R0bGluZy5idXJzdExpbWl0LFxuICAgICAgICBsb2dnaW5nTGV2ZWw6IHRoaXMucHJvcHMuY29uZmlnLmFwaUdhdGV3YXkubG9nZ2luZz8ubGV2ZWwgPT09ICdpbmZvJyA/IFxuICAgICAgICAgIGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8gOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5FUlJPUixcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogdGhpcy5wcm9wcy5jb25maWcuYXBpR2F0ZXdheS5sb2dnaW5nPy5kYXRhVHJhY2UgfHwgZmFsc2UsXG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0aGlzLnByb3BzLmNvbmZpZy5hcGlHYXRld2F5LmxvZ2dpbmc/Lm1ldHJpY3MgfHwgdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHRoaXMucHJvcHMuY29uZmlnLmFwaUdhdGV3YXkuY29yc0NvbmZpZyA/IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiB0aGlzLnByb3BzLmNvbmZpZy5hcGlHYXRld2F5LmNvcnNDb25maWcuYWxsb3dPcmlnaW5zLFxuICAgICAgICBhbGxvd01ldGhvZHM6IHRoaXMucHJvcHMuY29uZmlnLmFwaUdhdGV3YXkuY29yc0NvbmZpZy5hbGxvd01ldGhvZHMsXG4gICAgICAgIGFsbG93SGVhZGVyczogdGhpcy5wcm9wcy5jb25maWcuYXBpR2F0ZXdheS5jb3JzQ29uZmlnLmFsbG93SGVhZGVycyxcbiAgICAgICAgYWxsb3dDcmVkZW50aWFsczogdGhpcy5wcm9wcy5jb25maWcuYXBpR2F0ZXdheS5jb3JzQ29uZmlnLmFsbG93Q3JlZGVudGlhbHMsXG4gICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgcG9saWN5OiB0aGlzLnByb3BzLmNvbmZpZy5hcGlHYXRld2F5LnJlc291cmNlUG9saWN5ID8gXG4gICAgICAgIGlhbS5Qb2xpY3lEb2N1bWVudC5mcm9tSnNvbih0aGlzLnByb3BzLmNvbmZpZy5hcGlHYXRld2F5LnJlc291cmNlUG9saWN5KSA6IHVuZGVmaW5lZCxcbiAgICB9KTtcblxuICAgIC8vIENvZ25pdG8gQXV0aG9yaXplcuS9nOaIkFxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcih0aGlzLCAnQ29nbml0b0F1dGhvcml6ZXInLCB7XG4gICAgICBjb2duaXRvVXNlclBvb2xzOiBbdGhpcy51c2VyUG9vbF0sXG4gICAgICBhdXRob3JpemVyTmFtZTogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1hdXRob3JpemVyYCxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYee1seWQiOOBruioreWumlxuICAgIGlmICh0aGlzLnByb3BzLmxhbWJkYUZ1bmN0aW9ucykge1xuICAgICAgT2JqZWN0LmVudHJpZXModGhpcy5wcm9wcy5sYW1iZGFGdW5jdGlvbnMpLmZvckVhY2goKFtwYXRoLCBsYW1iZGFGdW5jdGlvbl0pID0+IHtcbiAgICAgICAgY29uc3QgcmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZShwYXRoKTtcbiAgICAgICAgY29uc3QgaW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbik7XG4gICAgICAgIFxuICAgICAgICByZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIGludGVncmF0aW9uLCB7XG4gICAgICAgICAgYXV0aG9yaXplcjogdGhpcy5wcm9wcy5jb25maWcuYXBpR2F0ZXdheS5hdXRoUHJvdmlkZXIgPT09ICdDb2duaXRvJyA/IGF1dGhvcml6ZXIgOiB1bmRlZmluZWQsXG4gICAgICAgIH0pO1xuICAgICAgICByZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBpbnRlZ3JhdGlvbiwge1xuICAgICAgICAgIGF1dGhvcml6ZXI6IHRoaXMucHJvcHMuY29uZmlnLmFwaUdhdGV3YXkuYXV0aFByb3ZpZGVyID09PSAnQ29nbml0bycgPyBhdXRob3JpemVyIDogdW5kZWZpbmVkLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhcGk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRGcm9udCBEaXN0cmlidXRpb27kvZzmiJAgLSDlvLfljJbniYhcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQ2xvdWRGcm9udERpc3RyaWJ1dGlvbigpOiBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbiB7XG4gICAgY29uc3Qgb3JpZ2luUmVxdWVzdFBvbGljeSA9IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5DT1JTX1MzX09SSUdJTjtcbiAgICBjb25zdCBjYWNoZVBvbGljeSA9IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19PUFRJTUlaRUQ7XG4gICAgXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdEaXN0cmlidXRpb24nLCB7XG4gICAgICBjb21tZW50OiBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfSAke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9IERpc3RyaWJ1dGlvbmAsXG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5SZXN0QXBpT3JpZ2luKHRoaXMucmVzdEFwaSksXG4gICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19BTEwsXG4gICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRF9PUFRJT05TLFxuICAgICAgICBjYWNoZVBvbGljeSxcbiAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeSxcbiAgICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICB9LFxuICAgICAgcHJpY2VDbGFzczogdGhpcy5wcm9wcy5jb25maWcuY2xvdWRGcm9udC5wcmljZUNsYXNzID09PSAnUHJpY2VDbGFzc19BbGwnID8gXG4gICAgICAgIGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU19BTEwgOlxuICAgICAgICB0aGlzLnByb3BzLmNvbmZpZy5jbG91ZEZyb250LnByaWNlQ2xhc3MgPT09ICcyMDAnID9cbiAgICAgICAgY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzIwMCA6XG4gICAgICAgIGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDAsXG4gICAgICBlbmFibGVMb2dnaW5nOiB0aGlzLnByb3BzLmNvbmZpZy5jb21tb24uZW5hYmxlTG9nZ2luZyxcbiAgICAgIHdlYkFjbElkOiB0aGlzLndlYkFjbD8uYXR0ckFybixcbiAgICAgIGRvbWFpbk5hbWVzOiB0aGlzLnByb3BzLmRvbWFpbk5hbWUgPyBbdGhpcy5wcm9wcy5kb21haW5OYW1lXSA6IHVuZGVmaW5lZCxcbiAgICAgIGNlcnRpZmljYXRlOiB0aGlzLnByb3BzLmNlcnRpZmljYXRlLFxuICAgIH0pO1xuXG4gICAgLy8gUm91dGU1MyBBbGlhcyBSZWNvcmTkvZzmiJBcbiAgICBpZiAodGhpcy5wcm9wcy5ob3N0ZWRab25lICYmIHRoaXMucHJvcHMuZG9tYWluTmFtZSkge1xuICAgICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCAnQWxpYXNSZWNvcmQnLCB7XG4gICAgICAgIHpvbmU6IHRoaXMucHJvcHMuaG9zdGVkWm9uZSxcbiAgICAgICAgcmVjb3JkTmFtZTogdGhpcy5wcm9wcy5kb21haW5OYW1lLFxuICAgICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgdGFyZ2V0cy5DbG91ZEZyb250VGFyZ2V0KGRpc3RyaWJ1dGlvbikpLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpc3RyaWJ1dGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiDkvqHmoLzjgq/jg6njgrnjga7jg57jg4Pjg5Tjg7PjgrBcbiAgICovXG4gIHByaXZhdGUgbWFwUHJpY2VDbGFzcyhwcmljZUNsYXNzOiBzdHJpbmcpOiBjbG91ZGZyb250LlByaWNlQ2xhc3Mge1xuICAgIHN3aXRjaCAocHJpY2VDbGFzcykge1xuICAgICAgY2FzZSAnUHJpY2VDbGFzc19BbGwnOlxuICAgICAgICByZXR1cm4gY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTX0FMTDtcbiAgICAgIGNhc2UgJ1ByaWNlQ2xhc3NfMjAwJzpcbiAgICAgICAgcmV0dXJuIGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18yMDA7XG4gICAgICBjYXNlICdQcmljZUNsYXNzXzEwMCc6XG4gICAgICAgIHJldHVybiBjbG91ZGZyb250LlByaWNlQ2xhc3MuUFJJQ0VfQ0xBU1NfMTAwO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdyYXBoUUwgQVBJ5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUdyYXBoUUxBcGkoKTogYXBwc3luYy5HcmFwaHFsQXBpIHtcbiAgICBjb25zdCBncmFwaHFsQ29uZmlnID0gdGhpcy5wcm9wcy5jb25maWcuZ3JhcGhxbCE7XG4gICAgXG4gICAgY29uc3QgYXBpID0gbmV3IGFwcHN5bmMuR3JhcGhxbEFwaSh0aGlzLCAnR3JhcGhRTEFwaScsIHtcbiAgICAgIG5hbWU6IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tZ3JhcGhxbC1hcGlgLFxuICAgICAgc2NoZW1hOiBncmFwaHFsQ29uZmlnLnNjaGVtYVBhdGggPyBcbiAgICAgICAgYXBwc3luYy5TY2hlbWFGaWxlLmZyb21Bc3NldChncmFwaHFsQ29uZmlnLnNjaGVtYVBhdGgpIDpcbiAgICAgICAgYXBwc3luYy5TY2hlbWFGaWxlLmNvZGUoYFxuICAgICAgICAgIHR5cGUgUXVlcnkge1xuICAgICAgICAgICAgaGVsbG86IFN0cmluZ1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICB0eXBlIE11dGF0aW9uIHtcbiAgICAgICAgICAgIGNyZWF0ZUl0ZW0oaW5wdXQ6IFN0cmluZyEpOiBTdHJpbmdcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgdHlwZSBTdWJzY3JpcHRpb24ge1xuICAgICAgICAgICAgb25JdGVtQ3JlYXRlZDogU3RyaW5nXG4gICAgICAgICAgICBAYXdzX3N1YnNjcmliZShtdXRhdGlvbnM6IFtcImNyZWF0ZUl0ZW1cIl0pXG4gICAgICAgICAgfVxuICAgICAgICBgKSxcbiAgICAgIGF1dGhvcml6YXRpb25Db25maWc6IHtcbiAgICAgICAgZGVmYXVsdEF1dGhvcml6YXRpb246IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBwc3luYy5BdXRob3JpemF0aW9uVHlwZS5VU0VSX1BPT0wsXG4gICAgICAgICAgdXNlclBvb2xDb25maWc6IHtcbiAgICAgICAgICAgIHVzZXJQb29sOiB0aGlzLnVzZXJQb29sLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkZGl0aW9uYWxBdXRob3JpemF0aW9uTW9kZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBwc3luYy5BdXRob3JpemF0aW9uVHlwZS5BUElfS0VZLFxuICAgICAgICAgICAgYXBpS2V5Q29uZmlnOiB7XG4gICAgICAgICAgICAgIGV4cGlyZXM6IER1cmF0aW9uLmRheXMoMzY1KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBsb2dDb25maWc6IHtcbiAgICAgICAgZmllbGRMb2dMZXZlbDogZ3JhcGhxbENvbmZpZy5sb2dnaW5nLmZpZWxkTGV2ZWxMb2dzID8gXG4gICAgICAgICAgYXBwc3luYy5GaWVsZExvZ0xldmVsLkFMTCA6IGFwcHN5bmMuRmllbGRMb2dMZXZlbC5FUlJPUixcbiAgICAgICAgZXhjbHVkZVZlcmJvc2VDb250ZW50OiBncmFwaHFsQ29uZmlnLmxvZ2dpbmcuZXhjbHVkZVZlcmJvc2VDb250ZW50LFxuICAgICAgfSxcbiAgICAgIHhyYXlFbmFibGVkOiB0aGlzLnByb3BzLmNvbmZpZy5jb21tb24uZW5hYmxlVHJhY2luZyxcbiAgICB9KTtcblxuICAgIC8vIOODh+ODvOOCv+OCveODvOOCueOBqOODquOCvuODq+ODkOODvOOBruioreWumlxuICAgIE9iamVjdC5lbnRyaWVzKGdyYXBocWxDb25maWcucmVzb2x2ZXJzKS5mb3JFYWNoKChbdHlwZU5hbWUsIGZpZWxkc10pID0+IHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKGZpZWxkcykuZm9yRWFjaCgoW2ZpZWxkTmFtZSwgY29uZmlnXSkgPT4ge1xuICAgICAgICBsZXQgZGF0YVNvdXJjZTogYXBwc3luYy5CYXNlRGF0YVNvdXJjZTtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAoY29uZmlnLmRhdGFTb3VyY2UpIHtcbiAgICAgICAgICBjYXNlICdMYW1iZGEnOlxuICAgICAgICAgICAgaWYgKGNvbmZpZy5mdW5jdGlvbkFybiAmJiB0aGlzLnByb3BzLmxhbWJkYUZ1bmN0aW9ucykge1xuICAgICAgICAgICAgICBjb25zdCBsYW1iZGFGdW5jdGlvbiA9IE9iamVjdC52YWx1ZXModGhpcy5wcm9wcy5sYW1iZGFGdW5jdGlvbnMpWzBdOyAvLyDnsKHnlaXljJZcbiAgICAgICAgICAgICAgZGF0YVNvdXJjZSA9IGFwaS5hZGRMYW1iZGFEYXRhU291cmNlKGAke3R5cGVOYW1lfSR7ZmllbGROYW1lfURhdGFTb3VyY2VgLCBsYW1iZGFGdW5jdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdEeW5hbW9EQic6XG4gICAgICAgICAgICAvLyBEeW5hbW9EQuODh+ODvOOCv+OCveODvOOCueOBruWun+ijhVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnT3BlblNlYXJjaCc6XG4gICAgICAgICAgICAvLyBPcGVuU2VhcmNo44OH44O844K/44K944O844K544Gu5a6f6KOFXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYXBpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdlYlNvY2tldCBBUEnkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlV2ViU29ja2V0QXBpKCk6IGFwaWdhdGV3YXl2Mi5XZWJTb2NrZXRBcGkge1xuICAgIGNvbnN0IHdlYnNvY2tldENvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnLndlYnNvY2tldCE7XG4gICAgXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXl2Mi5XZWJTb2NrZXRBcGkodGhpcywgJ1dlYlNvY2tldEFwaScsIHtcbiAgICAgIGFwaU5hbWU6IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0td2Vic29ja2V0LWFwaWAsXG4gICAgICBkZXNjcmlwdGlvbjogYFdlYlNvY2tldCBBUEkgZm9yICR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX1gLFxuICAgICAgcm91dGVTZWxlY3Rpb25FeHByZXNzaW9uOiB3ZWJzb2NrZXRDb25maWcucm91dGVTZWxlY3Rpb25FeHByZXNzaW9uLFxuICAgIH0pO1xuXG4gICAgLy8g44K544OG44O844K45L2c5oiQXG4gICAgY29uc3Qgc3RhZ2UgPSBuZXcgYXBpZ2F0ZXdheXYyLldlYlNvY2tldFN0YWdlKHRoaXMsICdXZWJTb2NrZXRTdGFnZScsIHtcbiAgICAgIHdlYlNvY2tldEFwaTogYXBpLFxuICAgICAgc3RhZ2VOYW1lOiB0aGlzLnByb3BzLmVudmlyb25tZW50LFxuICAgICAgYXV0b0RlcGxveTogdHJ1ZSxcbiAgICAgIHRocm90dGxlOiB7XG4gICAgICAgIHJhdGVMaW1pdDogd2Vic29ja2V0Q29uZmlnLnRocm90dGxpbmcucmF0ZUxpbWl0LFxuICAgICAgICBidXJzdExpbWl0OiB3ZWJzb2NrZXRDb25maWcudGhyb3R0bGluZy5idXJzdExpbWl0LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIOODq+ODvOODiOOBruioreWumlxuICAgIE9iamVjdC5lbnRyaWVzKHdlYnNvY2tldENvbmZpZy5yb3V0ZXMpLmZvckVhY2goKFtyb3V0ZUtleSwgcm91dGVDb25maWddKSA9PiB7XG4gICAgICBpZiAocm91dGVDb25maWcuaW50ZWdyYXRpb24gPT09ICdMYW1iZGEnICYmIHJvdXRlQ29uZmlnLmZ1bmN0aW9uQXJuICYmIHRoaXMucHJvcHMubGFtYmRhRnVuY3Rpb25zKSB7XG4gICAgICAgIGNvbnN0IGxhbWJkYUZ1bmN0aW9uID0gT2JqZWN0LnZhbHVlcyh0aGlzLnByb3BzLmxhbWJkYUZ1bmN0aW9ucylbMF07IC8vIOewoeeVpeWMllxuICAgICAgICBjb25zdCBpbnRlZ3JhdGlvbiA9IG5ldyBpbnRlZ3JhdGlvbnMuV2ViU29ja2V0TGFtYmRhSW50ZWdyYXRpb24oYCR7cm91dGVLZXl9SW50ZWdyYXRpb25gLCBsYW1iZGFGdW5jdGlvbik7XG4gICAgICAgIFxuICAgICAgICBhcGkuYWRkUm91dGUocm91dGVLZXksIHtcbiAgICAgICAgICBpbnRlZ3JhdGlvbixcbiAgICAgICAgICBhdXRob3JpemVyOiByb3V0ZUNvbmZpZy5hdXRob3JpemF0aW9uVHlwZSA9PT0gJ0NVU1RPTScgPyBcbiAgICAgICAgICAgIG5ldyBhdXRob3JpemVycy5XZWJTb2NrZXRMYW1iZGFBdXRob3JpemVyKGAke3JvdXRlS2V5fUF1dGhvcml6ZXJgLCBsYW1iZGFGdW5jdGlvbikgOiB1bmRlZmluZWQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGFwaTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBUEnliIbmnpDoqK3lrppcbiAgICovXG4gIHByaXZhdGUgc2V0dXBBUElBbmFseXRpY3MoKTogdm9pZCB7XG4gICAgY29uc3QgYW5hbHl0aWNzQ29uZmlnID0gdGhpcy5wcm9wcy5jb25maWcuYW5hbHl0aWNzITtcbiAgICBcbiAgICBpZiAoYW5hbHl0aWNzQ29uZmlnLmtpbmVzaXMuZW5hYmxlZCkge1xuICAgICAgdGhpcy5raW5lc2lzU3RyZWFtID0gbmV3IGtpbmVzaXMuU3RyZWFtKHRoaXMsICdBUElBbmFseXRpY3NTdHJlYW0nLCB7XG4gICAgICAgIHN0cmVhbU5hbWU6IGFuYWx5dGljc0NvbmZpZy5raW5lc2lzLnN0cmVhbU5hbWUgfHwgXG4gICAgICAgICAgYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1hcGktYW5hbHl0aWNzYCxcbiAgICAgICAgcmV0ZW50aW9uUGVyaW9kOiBEdXJhdGlvbi5kYXlzKGFuYWx5dGljc0NvbmZpZy5raW5lc2lzLnJldGVudGlvblBlcmlvZCksXG4gICAgICAgIHNoYXJkQ291bnQ6IDEsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoYW5hbHl0aWNzQ29uZmlnLmN1c3RvbU1ldHJpY3MuZW5hYmxlZCkge1xuICAgICAgLy8g44Kr44K544K/44Og44Oh44OI44Oq44Kv44K544Gu6Kit5a6aXG4gICAgICBjb25zdCBuYW1lc3BhY2UgPSBhbmFseXRpY3NDb25maWcuY3VzdG9tTWV0cmljcy5uYW1lc3BhY2U7XG4gICAgICBcbiAgICAgIC8vIEFQSSBHYXRld2F555So44Kr44K544K/44Og44Oh44OI44Oq44Kv44K5XG4gICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIG1ldHJpY05hbWU6ICdBUElSZXF1ZXN0cycsXG4gICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICBBcGlOYW1lOiB0aGlzLnJlc3RBcGkucmVzdEFwaU5hbWUsXG4gICAgICAgICAgU3RhZ2U6IHRoaXMucHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5L2/55So6YeP44OX44Op44Oz44O7QVBJ44Kt44O86Kit5a6aXG4gICAqL1xuICBwcml2YXRlIHNldHVwVXNhZ2VQbGFucygpOiB2b2lkIHtcbiAgICBjb25zdCB1c2FnZVBsYW5zQ29uZmlnID0gdGhpcy5wcm9wcy5jb25maWcuYW5hbHl0aWNzIS51c2FnZVBsYW5zO1xuICAgIFxuICAgIE9iamVjdC5lbnRyaWVzKHVzYWdlUGxhbnNDb25maWcucGxhbnMpLmZvckVhY2goKFtwbGFuTmFtZSwgcGxhbkNvbmZpZ10pID0+IHtcbiAgICAgIGNvbnN0IHVzYWdlUGxhbiA9IG5ldyBhcGlnYXRld2F5LlVzYWdlUGxhbih0aGlzLCBgVXNhZ2VQbGFuJHtwbGFuTmFtZX1gLCB7XG4gICAgICAgIG5hbWU6IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tJHtwbGFuTmFtZX1gLFxuICAgICAgICB0aHJvdHRsZToge1xuICAgICAgICAgIHJhdGVMaW1pdDogcGxhbkNvbmZpZy50aHJvdHRsZS5yYXRlTGltaXQsXG4gICAgICAgICAgYnVyc3RMaW1pdDogcGxhbkNvbmZpZy50aHJvdHRsZS5idXJzdExpbWl0LFxuICAgICAgICB9LFxuICAgICAgICBxdW90YToge1xuICAgICAgICAgIGxpbWl0OiBwbGFuQ29uZmlnLnF1b3RhLmxpbWl0LFxuICAgICAgICAgIHBlcmlvZDogcGxhbkNvbmZpZy5xdW90YS5wZXJpb2QgPT09ICdEQVknID8gYXBpZ2F0ZXdheS5QZXJpb2QuREFZIDpcbiAgICAgICAgICAgICAgICAgIHBsYW5Db25maWcucXVvdGEucGVyaW9kID09PSAnV0VFSycgPyBhcGlnYXRld2F5LlBlcmlvZC5XRUVLIDpcbiAgICAgICAgICAgICAgICAgIGFwaWdhdGV3YXkuUGVyaW9kLk1PTlRILFxuICAgICAgICB9LFxuICAgICAgICBhcGlTdGFnZXM6IFt7XG4gICAgICAgICAgYXBpOiB0aGlzLnJlc3RBcGksXG4gICAgICAgICAgc3RhZ2U6IHRoaXMucmVzdEFwaS5kZXBsb3ltZW50U3RhZ2UsXG4gICAgICAgIH1dLFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudXNhZ2VQbGFuc1twbGFuTmFtZV0gPSB1c2FnZVBsYW47XG5cbiAgICAgIC8vIEFQSeOCreODvOOBruS9nOaIkOOBqOmWoumAo+S7mOOBkVxuICAgICAgcGxhbkNvbmZpZy5hcGlLZXlzLmZvckVhY2goKGtleU5hbWUsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGFwaUtleSA9IG5ldyBhcGlnYXRld2F5LkFwaUtleSh0aGlzLCBgQXBpS2V5JHtwbGFuTmFtZX0ke2luZGV4fWAsIHtcbiAgICAgICAgICBhcGlLZXlOYW1lOiBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LSR7a2V5TmFtZX1gLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBgQVBJIEtleSBmb3IgJHtwbGFuTmFtZX0gcGxhbmAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHVzYWdlUGxhbi5hZGRBcGlLZXkoYXBpS2V5KTtcbiAgICAgICAgdGhpcy5hcGlLZXlzW2tleU5hbWVdID0gYXBpS2V5O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog44Oe44Or44OB44OG44OK44Oz44OI566h55CG6Zai5pWw5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVRlbmFudE1hbmFnZXJGdW5jdGlvbigpOiBsYW1iZGEuRnVuY3Rpb24ge1xuICAgIHJldHVybiBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdUZW5hbnRNYW5hZ2VyRnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0tdGVuYW50LW1hbmFnZXJgLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1RlbmFudCBtYW5hZ2VtZW50IGV2ZW50OicsIEpTT04uc3RyaW5naWZ5KGV2ZW50LCBudWxsLCAyKSk7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgeyB0ZW5hbnRJZCwgYWN0aW9uIH0gPSBldmVudDtcbiAgICAgICAgICBcbiAgICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgICAgICAgLy8g44OG44OK44Oz44OI5L2c5oiQ44Ot44K444OD44KvXG4gICAgICAgICAgICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnVGVuYW50IGNyZWF0ZWQnLCB0ZW5hbnRJZCB9KSB9O1xuICAgICAgICAgICAgY2FzZSAndXBkYXRlJzpcbiAgICAgICAgICAgICAgLy8g44OG44OK44Oz44OI5pu05paw44Ot44K444OD44KvXG4gICAgICAgICAgICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnVGVuYW50IHVwZGF0ZWQnLCB0ZW5hbnRJZCB9KSB9O1xuICAgICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgICAgLy8g44OG44OK44Oz44OI5YmK6Zmk44Ot44K444OD44KvXG4gICAgICAgICAgICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnVGVuYW50IGRlbGV0ZWQnLCB0ZW5hbnRJZCB9KSB9O1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogNDAwLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW52YWxpZCBhY3Rpb24nIH0pIH07XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCksXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFBST0pFQ1RfTkFNRTogdGhpcy5wcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgICAgRU5WSVJPTk1FTlQ6IHRoaXMucHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICAgIFRFTkFOVF9TVFJBVEVHWTogdGhpcy5wcm9wcy5jb25maWcubXVsdGlUZW5hbnQhLnN0cmF0ZWd5LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXQUYgV2ViIEFDTOS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVXZWJBY2woKTogd2FmdjIuQ2ZuV2ViQUNMIHtcbiAgICBjb25zdCBydWxlczogd2FmdjIuQ2ZuV2ViQUNMLlJ1bGVQcm9wZXJ0eVtdID0gW107XG5cbiAgICAvLyBBV1MgTWFuYWdlZCBSdWxlc1xuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy53YWYubWFuYWdlZFJ1bGVzLmF3c0NvbW1vblJ1bGVTZXQpIHtcbiAgICAgIHJ1bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiAnQVdTTWFuYWdlZFJ1bGVzQ29tbW9uUnVsZVNldCcsXG4gICAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgICBvdmVycmlkZUFjdGlvbjogeyBub25lOiB7fSB9LFxuICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICBtYW5hZ2VkUnVsZUdyb3VwU3RhdGVtZW50OiB7XG4gICAgICAgICAgICB2ZW5kb3JOYW1lOiAnQVdTJyxcbiAgICAgICAgICAgIG5hbWU6ICdBV1NNYW5hZ2VkUnVsZXNDb21tb25SdWxlU2V0JyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgc2FtcGxlZFJlcXVlc3RzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ0NvbW1vblJ1bGVTZXRNZXRyaWMnLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuY29uZmlnLndhZi5tYW5hZ2VkUnVsZXMuYXdzS25vd25CYWRJbnB1dHNSdWxlU2V0KSB7XG4gICAgICBydWxlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogJ0FXU01hbmFnZWRSdWxlc0tub3duQmFkSW5wdXRzUnVsZVNldCcsXG4gICAgICAgIHByaW9yaXR5OiAyLFxuICAgICAgICBvdmVycmlkZUFjdGlvbjogeyBub25lOiB7fSB9LFxuICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICBtYW5hZ2VkUnVsZUdyb3VwU3RhdGVtZW50OiB7XG4gICAgICAgICAgICB2ZW5kb3JOYW1lOiAnQVdTJyxcbiAgICAgICAgICAgIG5hbWU6ICdBV1NNYW5hZ2VkUnVsZXNLbm93bkJhZElucHV0c1J1bGVTZXQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHZpc2liaWxpdHlDb25maWc6IHtcbiAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgIGNsb3VkV2F0Y2hNZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnS25vd25CYWRJbnB1dHNSdWxlU2V0TWV0cmljJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFJhdGUgTGltaXRpbmcgUnVsZVxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy53YWYucmF0ZUxpbWl0aW5nLmVuYWJsZWQpIHtcbiAgICAgIHJ1bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiAnUmF0ZUxpbWl0UnVsZScsXG4gICAgICAgIHByaW9yaXR5OiAxMCxcbiAgICAgICAgYWN0aW9uOiB7IGJsb2NrOiB7fSB9LFxuICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICByYXRlQmFzZWRTdGF0ZW1lbnQ6IHtcbiAgICAgICAgICAgIGxpbWl0OiB0aGlzLnByb3BzLmNvbmZpZy53YWYucmF0ZUxpbWl0aW5nLmxpbWl0LFxuICAgICAgICAgICAgYWdncmVnYXRlS2V5VHlwZTogJ0lQJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgc2FtcGxlZFJlcXVlc3RzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ1JhdGVMaW1pdFJ1bGVNZXRyaWMnLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyB3YWZ2Mi5DZm5XZWJBQ0wodGhpcywgJ1dlYkFjbCcsIHtcbiAgICAgIG5hbWU6IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LSR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0td2ViLWFjbGAsXG4gICAgICBzY29wZTogJ0NMT1VERlJPTlQnLFxuICAgICAgZGVmYXVsdEFjdGlvbjogeyBhbGxvdzoge30gfSxcbiAgICAgIHJ1bGVzLFxuICAgICAgdmlzaWJpbGl0eUNvbmZpZzoge1xuICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIG1ldHJpY05hbWU6IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9JHt0aGlzLnByb3BzLmVudmlyb25tZW50fVdlYkFjbGAsXG4gICAgICB9LFxuICAgIH0pO1xuICB9ICAvKlxuKlxuICAgKiDntbHlkIjnm6Poppbjg4Djg4Pjgrfjg6Xjg5zjg7zjg4nkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlTW9uaXRvcmluZ0Rhc2hib2FyZCgpOiBjbG91ZHdhdGNoLkRhc2hib2FyZCB7XG4gICAgY29uc3QgZGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdBUElNb25pdG9yaW5nRGFzaGJvYXJkJywge1xuICAgICAgZGFzaGJvYXJkTmFtZTogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1hcGktZGFzaGJvYXJkYCxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBHYXRld2F5IOODoeODiOODquOCr+OCuVxuICAgIGRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0FQSSBHYXRld2F5IFJlcXVlc3RzJyxcbiAgICAgICAgbGVmdDogW1xuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ291bnQnLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBBcGlOYW1lOiB0aGlzLnJlc3RBcGkucmVzdEFwaU5hbWUsXG4gICAgICAgICAgICAgIFN0YWdlOiB0aGlzLnByb3BzLmVudmlyb25tZW50LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICAgIHdpZHRoOiAxMixcbiAgICAgIH0pLFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0FQSSBHYXRld2F5IExhdGVuY3knLFxuICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdMYXRlbmN5JyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgQXBpTmFtZTogdGhpcy5yZXN0QXBpLnJlc3RBcGlOYW1lLFxuICAgICAgICAgICAgICBTdGFnZTogdGhpcy5wcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQ29nbml0byDjg6Hjg4jjg6rjgq/jgrlcbiAgICBpZiAodGhpcy51c2VyUG9vbCkge1xuICAgICAgZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICB0aXRsZTogJ0NvZ25pdG8gVXNlciBQb29sIE1ldHJpY3MnLFxuICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9Db2duaXRvJyxcbiAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ1NpZ25JblN1Y2Nlc3NlcycsXG4gICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICBVc2VyUG9vbDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgICAgICAgICAgIFVzZXJQb29sQ2xpZW50OiB0aGlzLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2xvdWRGcm9udCDjg6Hjg4jjg6rjgq/jgrlcbiAgICBpZiAodGhpcy5kaXN0cmlidXRpb24pIHtcbiAgICAgIGRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgdGl0bGU6ICdDbG91ZEZyb250IFJlcXVlc3RzJyxcbiAgICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICAgIG1ldHJpY05hbWU6ICdSZXF1ZXN0cycsXG4gICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICBEaXN0cmlidXRpb25JZDogdGhpcy5kaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhc2hib2FyZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudEJyaWRnZee1seWQiFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVFdmVudEJyaWRnZUludGVncmF0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IGV2ZW50QnVzID0gZXZlbnRzLkV2ZW50QnVzLmZyb21FdmVudEJ1c05hbWUodGhpcywgJ0RlZmF1bHRFdmVudEJ1cycsICdkZWZhdWx0Jyk7XG5cbiAgICAvLyBBUEkg44Kk44OZ44Oz44OI44Or44O844OrXG4gICAgY29uc3QgYXBpRXZlbnRSdWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdBUElFdmVudFJ1bGUnLCB7XG4gICAgICBldmVudEJ1cyxcbiAgICAgIHJ1bGVOYW1lOiBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LWFwaS1ldmVudHNgLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkgcmVsYXRlZCBldmVudHMnLFxuICAgICAgZXZlbnRQYXR0ZXJuOiB7XG4gICAgICAgIHNvdXJjZTogWydhd3MuYXBpZ2F0ZXdheSddLFxuICAgICAgICBkZXRhaWxUeXBlOiBbJ0FQSSBHYXRld2F5IEV4ZWN1dGlvbiBMb2dzJ10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2dzIOOCv+ODvOOCsuODg+ODiFxuICAgIGNvbnN0IGxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgJ0FQSUV2ZW50TG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2V2ZW50cy8ke3RoaXMucHJvcHMucHJvamVjdE5hbWV9LyR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH0vYXBpYCxcbiAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCxcbiAgICB9KTtcblxuICAgIGFwaUV2ZW50UnVsZS5hZGRUYXJnZXQobmV3IGV2ZW50VGFyZ2V0cy5DbG91ZFdhdGNoTG9nR3JvdXAobG9nR3JvdXApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlh7rlipvlgKTkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0cygpOiBBUElPdXRwdXRzIHtcbiAgICByZXR1cm4ge1xuICAgICAgLy8gQ29nbml0b+WHuuWKm1xuICAgICAgdXNlclBvb2xJZDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgdXNlclBvb2xBcm46IHRoaXMudXNlclBvb2wudXNlclBvb2xBcm4sXG4gICAgICB1c2VyUG9vbENsaWVudElkOiB0aGlzLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICBpZGVudGl0eVBvb2xJZDogdGhpcy5pZGVudGl0eVBvb2w/LnJlZixcbiAgICAgIGlkZW50aXR5UG9vbEFybjogdGhpcy5pZGVudGl0eVBvb2w/LmF0dHJBcm4sXG5cbiAgICAgIC8vIFJFU1QgQVBJIEdhdGV3YXnlh7rliptcbiAgICAgIHJlc3RBcGlJZDogdGhpcy5yZXN0QXBpLnJlc3RBcGlJZCxcbiAgICAgIHJlc3RBcGlBcm46IHRoaXMucmVzdEFwaS5yZXN0QXBpQXJuLFxuICAgICAgcmVzdEFwaVVybDogdGhpcy5yZXN0QXBpLnVybCxcbiAgICAgIHJlc3RBcGlTdGFnZTogdGhpcy5wcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIFxuICAgICAgLy8gR3JhcGhRTCBBUEnlh7rliptcbiAgICAgIGdyYXBocWxBcGlJZDogdGhpcy5ncmFwaHFsQXBpPy5hcGlJZCxcbiAgICAgIGdyYXBocWxBcGlBcm46IHRoaXMuZ3JhcGhxbEFwaT8uYXJuLFxuICAgICAgZ3JhcGhxbEFwaVVybDogdGhpcy5ncmFwaHFsQXBpPy5ncmFwaHFsVXJsLFxuICAgICAgZ3JhcGhxbEFwaUtleTogdGhpcy5ncmFwaHFsQXBpPy5hcGlLZXksXG4gICAgICBcbiAgICAgIC8vIFdlYlNvY2tldCBBUEnlh7rliptcbiAgICAgIHdlYnNvY2tldEFwaUlkOiB0aGlzLndlYnNvY2tldEFwaT8uYXBpSWQsXG4gICAgICB3ZWJzb2NrZXRBcGlBcm46IHRoaXMud2Vic29ja2V0QXBpPy5hcGlBcm4sXG4gICAgICB3ZWJzb2NrZXRBcGlVcmw6IHRoaXMud2Vic29ja2V0QXBpPy5hcGlFbmRwb2ludCxcbiAgICAgIHdlYnNvY2tldEFwaVN0YWdlOiB0aGlzLnByb3BzLmVudmlyb25tZW50LFxuXG4gICAgICAvLyBDbG91ZEZyb2505Ye65YqbXG4gICAgICBkaXN0cmlidXRpb25JZDogdGhpcy5kaXN0cmlidXRpb24/LmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZGlzdHJpYnV0aW9uRG9tYWluTmFtZTogdGhpcy5kaXN0cmlidXRpb24/LmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWUsXG4gICAgICBkaXN0cmlidXRpb25Vcmw6IHRoaXMuZGlzdHJpYnV0aW9uID8gYGh0dHBzOi8vJHt0aGlzLmRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lfWAgOiB1bmRlZmluZWQsXG5cbiAgICAgIC8vIFdBRuWHuuWKm1xuICAgICAgd2ViQWNsSWQ6IHRoaXMud2ViQWNsPy5hdHRySWQsXG4gICAgICB3ZWJBY2xBcm46IHRoaXMud2ViQWNsPy5hdHRyQXJuLFxuXG4gICAgICAvLyDjgqvjgrnjgr/jg6Djg4njg6HjgqTjg7Plh7rliptcbiAgICAgIGN1c3RvbURvbWFpbk5hbWU6IHRoaXMucHJvcHMuZG9tYWluTmFtZSxcbiAgICAgIGN1c3RvbURvbWFpblVybDogdGhpcy5wcm9wcy5kb21haW5OYW1lID8gYGh0dHBzOi8vJHt0aGlzLnByb3BzLmRvbWFpbk5hbWV9YCA6IHVuZGVmaW5lZCxcbiAgICAgIFxuICAgICAgLy8gQVBJ5YiG5p6Q5Ye65YqbXG4gICAgICBraW5lc2lzU3RyZWFtQXJuOiB0aGlzLmtpbmVzaXNTdHJlYW0/LnN0cmVhbUFybixcbiAgICAgIHVzYWdlUGxhbklkczogT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgICBPYmplY3QuZW50cmllcyh0aGlzLnVzYWdlUGxhbnMpLm1hcCgoW25hbWUsIHBsYW5dKSA9PiBbbmFtZSwgcGxhbi51c2FnZVBsYW5JZF0pXG4gICAgICApLFxuICAgICAgYXBpS2V5SWRzOiBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuYXBpS2V5cykubWFwKChbbmFtZSwga2V5XSkgPT4gW25hbWUsIGtleS5rZXlJZF0pXG4gICAgICApLFxuICAgICAgXG4gICAgICAvLyDjg57jg6vjg4Hjg4bjg4rjg7Pjg4jlh7rliptcbiAgICAgIHRlbmFudENvbmZpZ3M6IHRoaXMucHJvcHMuY29uZmlnLm11bHRpVGVuYW50Py5lbmFibGVkID8ge30gOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgr/jgrDpgannlKhcbiAgICovXG4gIHByaXZhdGUgYXBwbHlUYWdzKCk6IHZvaWQge1xuICAgIGNvbnN0IHRhZ3MgPSB0aGlzLnByb3BzLmNvbmZpZy50YWdzO1xuICAgIFRhZ3Mub2YodGhpcykuYWRkKCdBUElUeXBlJywgdGFncy5BUElUeXBlKTtcbiAgICBUYWdzLm9mKHRoaXMpLmFkZCgnQXV0aFByb3ZpZGVyJywgdGFncy5BdXRoUHJvdmlkZXIpO1xuICAgIFRhZ3Mub2YodGhpcykuYWRkKCdDRE5Qcm92aWRlcicsIHRhZ3MuQ0ROUHJvdmlkZXIpO1xuICAgIGlmICh0YWdzLlNlY3VyaXR5TGV2ZWwpIHtcbiAgICAgIFRhZ3Mub2YodGhpcykuYWRkKCdTZWN1cml0eUxldmVsJywgdGFncy5TZWN1cml0eUxldmVsKTtcbiAgICB9XG4gICAgaWYgKHRhZ3MuQ2FjaGVTdHJhdGVneSkge1xuICAgICAgVGFncy5vZih0aGlzKS5hZGQoJ0NhY2hlU3RyYXRlZ3knLCB0YWdzLkNhY2hlU3RyYXRlZ3kpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDkvqHmoLzjgq/jg6njgrnjga7jg57jg4Pjg5Tjg7PjgrBcbiAgICovXG4gIHByaXZhdGUgbWFwUHJpY2VDbGFzcyhwcmljZUNsYXNzOiBzdHJpbmcpOiBjbG91ZGZyb250LlByaWNlQ2xhc3Mge1xuICAgIHN3aXRjaCAocHJpY2VDbGFzcykge1xuICAgICAgY2FzZSAnUHJpY2VDbGFzc19BbGwnOlxuICAgICAgICByZXR1cm4gY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTX0FMTDtcbiAgICAgIGNhc2UgJ1ByaWNlQ2xhc3NfMjAwJzpcbiAgICAgICAgcmV0dXJuIGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18yMDA7XG4gICAgICBjYXNlICdQcmljZUNsYXNzXzEwMCc6XG4gICAgICAgIHJldHVybiBjbG91ZGZyb250LlByaWNlQ2xhc3MuUFJJQ0VfQ0xBU1NfMTAwO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDA7XG4gICAgfVxuICB9XG59Il19