"use strict";
/**
 * WebAppStack - Lambda Web Adapter + Next.js + CloudFront統合スタック
 *
 * 機能:
 * - Lambda Function (Container) with Web Adapter
 * - Lambda Function URL
 * - CloudFront Distribution
 * - ECR Repository
 * - IAM Roles and Permissions
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
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
/**
 * WebAppStack - フル実装版
 */
class WebAppStack extends cdk.Stack {
    /** Lambda Function */
    webAppFunction;
    /** Lambda Function URL */
    functionUrl;
    /** CloudFront Distribution */
    distribution;
    /** ECR Repository */
    ecrRepository;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { config } = props;
        const projectName = config.project?.name || config.naming?.projectName || 'permission-aware-rag';
        const environment = config.environment || config.naming?.environment || 'prod';
        const regionPrefix = config.naming?.regionPrefix || 'TokyoRegion';
        console.log('🚀 WebAppStack (Full) 初期化開始...');
        console.log(`   プロジェクト名: ${projectName}`);
        console.log(`   環境: ${environment}`);
        console.log(`   リージョンプレフィックス: ${regionPrefix}`);
        // ECR Repository
        this.ecrRepository = new ecr.Repository(this, 'WebAppRepository', {
            repositoryName: `${regionPrefix.toLowerCase()}-${projectName}-${environment}-webapp-repo`,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            lifecycleRules: [
                {
                    description: 'Keep last 10 images',
                    maxImageCount: 10,
                },
            ],
        });
        // Lambda Execution Role
        const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
            roleName: `${regionPrefix}-${projectName}-${environment}-WebApp-Lambda-Role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });
        // Bedrock access
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock:ListFoundationModels',
                'bedrock:GetFoundationModel',
            ],
            resources: ['*'],
        }));
        // Bedrock Agent access
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeAgent',
            ],
            resources: ['*'],
        }));
        // DynamoDB access (if needed)
        if (config.database?.dynamodb) {
            lambdaRole.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                ],
                resources: ['*'], // TODO: Scope to specific tables
            }));
        }
        // Lambda Function
        this.webAppFunction = new lambda.Function(this, 'WebAppFunction', {
            functionName: `${regionPrefix}-${projectName}-${environment}-WebApp-Function`,
            runtime: lambda.Runtime.FROM_IMAGE,
            code: lambda.Code.fromEcrImage(this.ecrRepository, {
                tagOrDigest: 'latest',
            }),
            handler: lambda.Handler.FROM_IMAGE,
            role: lambdaRole,
            timeout: cdk.Duration.seconds(config.compute?.lambda?.timeout || 30),
            memorySize: config.compute?.lambda?.memorySize || 512,
            environment: {
                NODE_ENV: 'production',
                BEDROCK_REGION: config.ai?.bedrock?.region || 'us-east-1',
                AWS_LWA_INVOKE_MODE: 'response_stream',
                AWS_LWA_PORT: '3000',
                RUST_LOG: 'info',
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Lambda Function URL
        this.functionUrl = this.webAppFunction.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedMethods: [lambda.HttpMethod.ALL],
                allowedHeaders: ['*'],
            },
            invokeMode: lambda.InvokeMode.BUFFERED,
        });
        // CloudFront Distribution
        this.distribution = new cloudfront.Distribution(this, 'WebAppDistribution', {
            comment: `${regionPrefix}-${projectName}-${environment}-WebApp-Distribution`,
            defaultBehavior: {
                origin: new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split('/', this.functionUrl.url))),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                compress: true,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
            },
            priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
            enableLogging: false,
        });
        // Outputs
        new cdk.CfnOutput(this, 'FunctionUrl', {
            value: this.functionUrl.url,
            description: 'Lambda Function URL',
            exportName: `${this.stackName}-FunctionUrl`,
        });
        new cdk.CfnOutput(this, 'CloudFrontUrl', {
            value: `https://${this.distribution.distributionDomainName}`,
            description: 'CloudFront Distribution URL',
            exportName: `${this.stackName}-CloudFrontUrl`,
        });
        new cdk.CfnOutput(this, 'ECRRepositoryUri', {
            value: this.ecrRepository.repositoryUri,
            description: 'ECR Repository URI',
            exportName: `${this.stackName}-ECRRepositoryUri`,
        });
        // Tags
        cdk.Tags.of(this).add('Module', 'WebApp');
        cdk.Tags.of(this).add('Framework', 'Next.js');
        cdk.Tags.of(this).add('Adapter', 'Lambda Web Adapter');
        cdk.Tags.of(this).add('CDN', 'CloudFront');
        console.log('✅ WebAppStack (Full) 初期化完了');
    }
}
exports.WebAppStack = WebAppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViYXBwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2ViYXBwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBRW5DLCtEQUFpRDtBQUNqRCx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLHVFQUF5RDtBQUN6RCw0RUFBOEQ7QUFDOUQsMkRBQTZDO0FBTTdDOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDeEMsc0JBQXNCO0lBQ04sY0FBYyxDQUFrQjtJQUVoRCwwQkFBMEI7SUFDVixXQUFXLENBQXFCO0lBRWhELDhCQUE4QjtJQUNkLFlBQVksQ0FBMEI7SUFFdEQscUJBQXFCO0lBQ0wsYUFBYSxDQUFpQjtJQUU5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFDekIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLElBQUksc0JBQXNCLENBQUM7UUFDakcsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLFdBQVcsSUFBSSxNQUFNLENBQUM7UUFDL0UsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxZQUFZLElBQUksYUFBYSxDQUFDO1FBRWxFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsV0FBVyxF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QUFPO1FBQ1AsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUN2RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRTNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztJQUM1QyxDQUFDO0NBQ0Y7QUEvSkQsa0NBK0pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBXZWJBcHBTdGFjayAtIExhbWJkYSBXZWIgQWRhcHRlciArIE5leHQuanMgKyBDbG91ZEZyb25057Wx5ZCI44K544K/44OD44KvXG4gKiBcbiAqIOapn+iDvTpcbiAqIC0gTGFtYmRhIEZ1bmN0aW9uIChDb250YWluZXIpIHdpdGggV2ViIEFkYXB0ZXJcbiAqIC0gTGFtYmRhIEZ1bmN0aW9uIFVSTFxuICogLSBDbG91ZEZyb250IERpc3RyaWJ1dGlvblxuICogLSBFQ1IgUmVwb3NpdG9yeVxuICogLSBJQU0gUm9sZXMgYW5kIFBlcm1pc3Npb25zXG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgZWNyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3InO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2ViQXBwU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcmVhZG9ubHkgY29uZmlnOiBhbnk7IC8vIOe1seWQiOioreWumuOCquODluOCuOOCp+OCr+ODiFxufVxuXG4vKipcbiAqIFdlYkFwcFN0YWNrIC0g44OV44Or5a6f6KOF54mIXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJBcHBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIC8qKiBMYW1iZGEgRnVuY3Rpb24gKi9cbiAgcHVibGljIHJlYWRvbmx5IHdlYkFwcEZ1bmN0aW9uOiBsYW1iZGEuRnVuY3Rpb247XG4gIFxuICAvKiogTGFtYmRhIEZ1bmN0aW9uIFVSTCAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZnVuY3Rpb25Vcmw6IGxhbWJkYS5GdW5jdGlvblVybDtcbiAgXG4gIC8qKiBDbG91ZEZyb250IERpc3RyaWJ1dGlvbiAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZGlzdHJpYnV0aW9uOiBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbjtcbiAgXG4gIC8qKiBFQ1IgUmVwb3NpdG9yeSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZWNyUmVwb3NpdG9yeTogZWNyLlJlcG9zaXRvcnk7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFdlYkFwcFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHsgY29uZmlnIH0gPSBwcm9wcztcbiAgICBjb25zdCBwcm9qZWN0TmFtZSA9IGNvbmZpZy5wcm9qZWN0Py5uYW1lIHx8IGNvbmZpZy5uYW1pbmc/LnByb2plY3ROYW1lIHx8ICdwZXJtaXNzaW9uLWF3YXJlLXJhZyc7XG4gICAgY29uc3QgZW52aXJvbm1lbnQgPSBjb25maWcuZW52aXJvbm1lbnQgfHwgY29uZmlnLm5hbWluZz8uZW52aXJvbm1lbnQgfHwgJ3Byb2QnO1xuICAgIGNvbnN0IHJlZ2lvblByZWZpeCA9IGNvbmZpZy5uYW1pbmc/LnJlZ2lvblByZWZpeCB8fCAnVG9reW9SZWdpb24nO1xuXG4gICAgY29uc29sZS5sb2coJ/CfmoAgV2ViQXBwU3RhY2sgKEZ1bGwpIOWIneacn+WMlumWi+Wniy4uLicpO1xuICAgIGNvbnNvbGUubG9nKGAgICDjg5fjg63jgrjjgqfjgq/jg4jlkI06ICR7cHJvamVjdE5hbWV9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtlbnZpcm9ubWVudH1gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg44Oq44O844K444On44Oz44OX44Os44OV44Kj44OD44Kv44K5OiAke3JlZ2lvblByZWZpeH1gKTtcblxuICAgIC8vIEVDUiBSZXBvc2l0b3J5XG4gICAgdGhpcy5lY3JSZXBvc2l0b3J5ID0gbmV3IGVjci5SZXBvc2l0b3J5KHRoaXMsICdXZWJBcHBSZXBvc2l0b3J5Jywge1xuICAgICAgcmVwb3NpdG9yeU5hbWU6IGAke3JlZ2lvblByZWZpeC50b0xvd2VyQ2FzZSgpfS0ke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS13ZWJhcHAtcmVwb2AsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdLZWVwIGxhc3QgMTAgaW1hZ2VzJyxcbiAgICAgICAgICBtYXhJbWFnZUNvdW50OiAxMCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgRXhlY3V0aW9uIFJvbGVcbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdMYW1iZGFFeGVjdXRpb25Sb2xlJywge1xuICAgICAgcm9sZU5hbWU6IGAke3JlZ2lvblByZWZpeH0tJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tV2ViQXBwLUxhbWJkYS1Sb2xlYCxcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEJlZHJvY2sgYWNjZXNzXG4gICAgbGFtYmRhUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW0nLFxuICAgICAgICAnYmVkcm9jazpMaXN0Rm91bmRhdGlvbk1vZGVscycsXG4gICAgICAgICdiZWRyb2NrOkdldEZvdW5kYXRpb25Nb2RlbCcsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBCZWRyb2NrIEFnZW50IGFjY2Vzc1xuICAgIGxhbWJkYVJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYmVkcm9jazpJbnZva2VBZ2VudCcsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBEeW5hbW9EQiBhY2Nlc3MgKGlmIG5lZWRlZClcbiAgICBpZiAoY29uZmlnLmRhdGFiYXNlPy5keW5hbW9kYikge1xuICAgICAgbGFtYmRhUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICdkeW5hbW9kYjpHZXRJdGVtJyxcbiAgICAgICAgICAnZHluYW1vZGI6UHV0SXRlbScsXG4gICAgICAgICAgJ2R5bmFtb2RiOlVwZGF0ZUl0ZW0nLFxuICAgICAgICAgICdkeW5hbW9kYjpEZWxldGVJdGVtJyxcbiAgICAgICAgICAnZHluYW1vZGI6UXVlcnknLFxuICAgICAgICAgICdkeW5hbW9kYjpTY2FuJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXSwgLy8gVE9ETzogU2NvcGUgdG8gc3BlY2lmaWMgdGFibGVzXG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uXG4gICAgdGhpcy53ZWJBcHBGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1dlYkFwcEZ1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgJHtyZWdpb25QcmVmaXh9LSR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LVdlYkFwcC1GdW5jdGlvbmAsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5GUk9NX0lNQUdFLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUVjckltYWdlKHRoaXMuZWNyUmVwb3NpdG9yeSwge1xuICAgICAgICB0YWdPckRpZ2VzdDogJ2xhdGVzdCcsXG4gICAgICB9KSxcbiAgICAgIGhhbmRsZXI6IGxhbWJkYS5IYW5kbGVyLkZST01fSU1BR0UsXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoY29uZmlnLmNvbXB1dGU/LmxhbWJkYT8udGltZW91dCB8fCAzMCksXG4gICAgICBtZW1vcnlTaXplOiBjb25maWcuY29tcHV0ZT8ubGFtYmRhPy5tZW1vcnlTaXplIHx8IDUxMixcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIE5PREVfRU5WOiAncHJvZHVjdGlvbicsXG4gICAgICAgIEJFRFJPQ0tfUkVHSU9OOiBjb25maWcuYWk/LmJlZHJvY2s/LnJlZ2lvbiB8fCAndXMtZWFzdC0xJyxcbiAgICAgICAgQVdTX0xXQV9JTlZPS0VfTU9ERTogJ3Jlc3BvbnNlX3N0cmVhbScsXG4gICAgICAgIEFXU19MV0FfUE9SVDogJzMwMDAnLFxuICAgICAgICBSVVNUX0xPRzogJ2luZm8nLFxuICAgICAgfSxcbiAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uIFVSTFxuICAgIHRoaXMuZnVuY3Rpb25VcmwgPSB0aGlzLndlYkFwcEZ1bmN0aW9uLmFkZEZ1bmN0aW9uVXJsKHtcbiAgICAgIGF1dGhUeXBlOiBsYW1iZGEuRnVuY3Rpb25VcmxBdXRoVHlwZS5OT05FLFxuICAgICAgY29yczoge1xuICAgICAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBbbGFtYmRhLkh0dHBNZXRob2QuQUxMXSxcbiAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddLFxuICAgICAgfSxcbiAgICAgIGludm9rZU1vZGU6IGxhbWJkYS5JbnZva2VNb2RlLkJVRkZFUkVELFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRGcm9udCBEaXN0cmlidXRpb25cbiAgICB0aGlzLmRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnV2ViQXBwRGlzdHJpYnV0aW9uJywge1xuICAgICAgY29tbWVudDogYCR7cmVnaW9uUHJlZml4fS0ke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS1XZWJBcHAtRGlzdHJpYnV0aW9uYCxcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLkh0dHBPcmlnaW4oY2RrLkZuLnNlbGVjdCgyLCBjZGsuRm4uc3BsaXQoJy8nLCB0aGlzLmZ1bmN0aW9uVXJsLnVybCkpKSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0FMTCxcbiAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFELFxuICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19PUFRJTUlaRUQsXG4gICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSLFxuICAgICAgfSxcbiAgICAgIHByaWNlQ2xhc3M6IGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18yMDAsXG4gICAgICBlbmFibGVMb2dnaW5nOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRnVuY3Rpb25VcmwnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5mdW5jdGlvblVybC51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0xhbWJkYSBGdW5jdGlvbiBVUkwnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUZ1bmN0aW9uVXJsYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250VXJsJywge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7dGhpcy5kaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBVUkwnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUNsb3VkRnJvbnRVcmxgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VDUlJlcG9zaXRvcnlVcmknLCB7XG4gICAgICB2YWx1ZTogdGhpcy5lY3JSZXBvc2l0b3J5LnJlcG9zaXRvcnlVcmksXG4gICAgICBkZXNjcmlwdGlvbjogJ0VDUiBSZXBvc2l0b3J5IFVSSScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRUNSUmVwb3NpdG9yeVVyaWAsXG4gICAgfSk7XG5cbiAgICAvLyBUYWdzXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNb2R1bGUnLCAnV2ViQXBwJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdGcmFtZXdvcmsnLCAnTmV4dC5qcycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQWRhcHRlcicsICdMYW1iZGEgV2ViIEFkYXB0ZXInKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0NETicsICdDbG91ZEZyb250Jyk7XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIFdlYkFwcFN0YWNrIChGdWxsKSDliJ3mnJ/ljJblrozkuoYnKTtcbiAgfVxufVxuIl19