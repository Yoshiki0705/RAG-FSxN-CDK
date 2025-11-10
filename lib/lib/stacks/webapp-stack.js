"use strict";
/**
 * WebApp Stack
 * API・フロントエンド統合スタック
 *
 * 統合機能:
 * - REST API、GraphQL、WebSocket、Next.js フロントエンド
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
const aws_cdk_lib_1 = require("aws-cdk-lib");
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
class WebAppStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { config } = props;
        // Create REST API
        if (config.features.api.restApi) {
            this.createRestApi(config, props);
        }
        // Create Frontend hosting
        if (config.features.api.frontend) {
            this.createFrontendHosting(config);
        }
        // Add outputs
        if (this.apiUrl) {
            new aws_cdk_lib_1.CfnOutput(this, 'ApiUrl', {
                value: this.apiUrl,
                description: 'API Gateway URL'
            });
        }
        if (this.webAppUrl) {
            new aws_cdk_lib_1.CfnOutput(this, 'WebAppUrl', {
                value: this.webAppUrl,
                description: 'Web Application URL'
            });
        }
    }
    createRestApi(config, props) {
        // Create API Gateway
        this.restApi = new apigateway.RestApi(this, 'RagApi', {
            restApiName: `${config.projectName}-api-${config.environment}`,
            description: 'RAG System API',
            defaultCorsPreflightOptions: {
                allowOrigins: config.environment === 'prod'
                    ? [`https://${config.features.networking.customDomain}`]
                    : apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token']
            },
            deployOptions: {
                stageName: config.environment
            }
        });
        // Create Cognito Authorizer if user pool is provided
        let authorizer;
        if (props.userPool) {
            authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
                cognitoUserPools: [props.userPool],
                authorizerName: 'CognitoAuthorizer'
            });
        }
        // Documents API endpoints
        const documentsResource = this.restApi.root.addResource('documents');
        // POST /documents - Upload document
        if (props.documentProcessorFunction) {
            documentsResource.addMethod('POST', new apigateway.LambdaIntegration(props.documentProcessorFunction), {
                authorizer,
                authorizationType: authorizer ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE
            });
        }
        // GET /documents - List documents
        documentsResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [{
                    statusCode: '200',
                    responseTemplates: {
                        'application/json': JSON.stringify({
                            message: 'Documents list endpoint - implement with Lambda function',
                            documents: []
                        })
                    }
                }],
            requestTemplates: {
                'application/json': '{ "statusCode": 200 }'
            }
        }), {
            methodResponses: [{ statusCode: '200' }],
            authorizer,
            authorizationType: authorizer ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE
        });
        // Query API endpoints
        const queryResource = this.restApi.root.addResource('query');
        // POST /query - RAG query
        if (props.ragQueryFunction) {
            queryResource.addMethod('POST', new apigateway.LambdaIntegration(props.ragQueryFunction), {
                authorizer,
                authorizationType: authorizer ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE
            });
        }
        // Health check endpoint
        const healthResource = this.restApi.root.addResource('health');
        healthResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [{
                    statusCode: '200',
                    responseTemplates: {
                        'application/json': JSON.stringify({
                            status: 'healthy',
                            timestamp: new Date().toISOString(),
                            version: '1.0.0'
                        })
                    }
                }],
            requestTemplates: {
                'application/json': '{ "statusCode": 200 }'
            }
        }), {
            methodResponses: [{ statusCode: '200' }]
        });
        this.apiUrl = this.restApi.url;
    }
    createFrontendHosting(config) {
        // Create S3 bucket for web app hosting
        this.webAppBucket = new s3.Bucket(this, 'WebAppBucket', {
            bucketName: `${config.projectName}-webapp-${config.environment}-${config.region}`,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: false, // Will be accessed through CloudFront
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });
        // Create Origin Access Identity for CloudFront
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
            comment: `OAI for ${config.projectName} web app`
        });
        // Grant CloudFront access to S3 bucket
        this.webAppBucket.grantRead(originAccessIdentity);
        // Create CloudFront distribution
        this.distribution = new cloudfront.Distribution(this, 'WebAppDistribution', {
            comment: `${config.projectName} Web App Distribution`,
            defaultBehavior: {
                origin: new origins.S3Origin(this.webAppBucket, {
                    originAccessIdentity
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                compress: true
            },
            additionalBehaviors: this.restApi ? {
                '/api/*': {
                    origin: new origins.RestApiOrigin(this.restApi),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN
                }
            } : {},
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html'
                }
            ],
            priceClass: config.environment === 'prod'
                ? cloudfront.PriceClass.PRICE_CLASS_ALL
                : cloudfront.PriceClass.PRICE_CLASS_100
        });
        this.webAppUrl = `https://${this.distribution.distributionDomainName}`;
        // Deploy sample web app
        new s3deploy.BucketDeployment(this, 'WebAppDeployment', {
            sources: [s3deploy.Source.data('index.html', this.generateSampleWebApp(config))],
            destinationBucket: this.webAppBucket,
            distribution: this.distribution,
            distributionPaths: ['/*']
        });
    }
    generateSampleWebApp(config) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.projectName} - RAG System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .query-section {
            margin-bottom: 30px;
        }
        .query-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .query-button {
            background: #007bff;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }
        .query-button:hover {
            background: #0056b3;
        }
        .response-section {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            display: none;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 ${config.projectName}</h1>
            <p>Permission-aware RAG System with FSx for NetApp ONTAP</p>
            <p><strong>Environment:</strong> ${config.environment} | <strong>Region:</strong> ${config.region}</p>
        </div>
        
        <div class="status success">
            ✅ System is running successfully!
        </div>
        
        <div class="query-section">
            <h2>Ask a Question</h2>
            <input type="text" id="queryInput" class="query-input" placeholder="Enter your question here..." />
            <button onclick="submitQuery()" class="query-button">Submit Query</button>
        </div>
        
        <div id="responseSection" class="response-section">
            <h3>Response:</h3>
            <div id="responseContent"></div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3>System Information</h3>
            <ul>
                <li><strong>API Endpoint:</strong> <span id="apiEndpoint">${this.apiUrl || 'Not configured'}</span></li>
                <li><strong>Features Enabled:</strong></li>
                <ul>
                    <li>Networking: ${config.features.networking.vpc ? '✅' : '❌'}</li>
                    <li>Security: ${config.features.security.waf ? '✅' : '❌'}</li>
                    <li>AI/RAG: ${config.features.ai.rag ? '✅' : '❌'}</li>
                    <li>Database: ${config.features.database.dynamodb ? '✅' : '❌'}</li>
                </ul>
                <li><strong>Compliance:</strong> ${config.compliance.regulations.join(', ')}</li>
            </ul>
        </div>
    </div>
    
    <script>
        async function submitQuery() {
            const query = document.getElementById('queryInput').value;
            const responseSection = document.getElementById('responseSection');
            const responseContent = document.getElementById('responseContent');
            
            if (!query.trim()) {
                alert('Please enter a question');
                return;
            }
            
            responseSection.style.display = 'block';
            responseContent.innerHTML = 'Processing your query...';
            
            try {
                // TODO: Implement actual API call when backend is ready
                // const response = await fetch('/api/query', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ query })
                // });
                
                // Simulate response for now
                setTimeout(() => {
                    responseContent.innerHTML = \`
                        <p><strong>Query:</strong> \${query}</p>
                        <p><strong>Response:</strong> This is a sample response. The RAG system will be implemented to provide actual answers based on your documents.</p>
                        <p><strong>Status:</strong> System is ready for implementation</p>
                    \`;
                }, 1000);
                
            } catch (error) {
                responseContent.innerHTML = \`<p style="color: red;">Error: \${error.message}</p>\`;
            }
        }
        
        // Allow Enter key to submit
        document.getElementById('queryInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitQuery();
            }
        });
    </script>
</body>
</html>
    `;
    }
}
exports.WebAppStack = WebAppStack;
