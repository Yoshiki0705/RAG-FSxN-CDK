"use strict";
/**
 * OperationsStack - 統合運用・エンタープライズスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合監視・エンタープライズコンストラクトによる一元管理
 * - CloudWatch・X-Ray・SNS・BI・組織管理の統合
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
exports.OperationsStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
// 統合監視コンストラクト（モジュラーアーキテクチャ）
const monitoring_construct_1 = require("../../modules/monitoring/constructs/monitoring-construct");
// 統合エンタープライズコンストラクト（モジュラーアーキテクチャ）
const enterprise_construct_1 = require("../../modules/enterprise/constructs/enterprise-construct");
/**
 * 統合運用・エンタープライズスタック（モジュラーアーキテクチャ対応）
 *
 * 統合監視・エンタープライズコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
class OperationsStack extends cdk.Stack {
    /** 統合監視コンストラクト */
    monitoring;
    /** 統合エンタープライズコンストラクト */
    enterprise;
    /** CloudWatchダッシュボードURL（他スタックからの参照用） */
    dashboardUrl;
    /** SNSトピックARN（他スタックからの参照用） */
    snsTopicArns = {};
    constructor(scope, id, props) {
        super(scope, id, props);
        console.log('📊 OperationsStack初期化開始...');
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
        if (props.webAppStack) {
            this.addDependency(props.webAppStack);
            console.log('🔗 WebAppStackとの依存関係設定完了');
        }
        // 統合監視コンストラクト作成
        this.monitoring = new monitoring_construct_1.MonitoringConstruct(this, 'Monitoring', {
            config: props.config.monitoring,
            projectName: props.config.project.name,
            environment: props.config.environment,
            kmsKey: props.securityStack?.kmsKey,
            lambdaFunctionArns: props.computeStack?.lambdaFunctionArns,
            s3BucketNames: props.dataStack?.s3BucketNames,
            cloudFrontUrl: props.webAppStack?.cloudFrontUrl,
            namingGenerator: props.namingGenerator,
        });
        // 統合エンタープライズコンストラクト作成
        this.enterprise = new enterprise_construct_1.EnterpriseConstruct(this, 'Enterprise', {
            config: props.config.enterprise,
            projectName: props.config.project.name,
            environment: props.config.environment,
            kmsKey: props.securityStack?.kmsKey,
            cognitoUserPoolId: props.webAppStack?.cognitoUserPoolId,
            namingGenerator: props.namingGenerator,
        });
        // 他スタックからの参照用プロパティ設定
        this.setupCrossStackReferences();
        // スタック出力
        this.createOutputs();
        // タグ設定
        this.addStackTags();
        console.log('✅ OperationsStack初期化完了');
    }
    /**
     * 他スタックからの参照用プロパティ設定
     */
    setupCrossStackReferences() {
        // CloudWatchダッシュボードURLの設定（存在する場合）
        if (this.monitoring.outputs?.dashboardUrl) {
            this.dashboardUrl = this.monitoring.outputs.dashboardUrl;
        }
        // SNSトピックARNの設定（存在する場合）
        if (this.monitoring.outputs?.snsTopics) {
            Object.entries(this.monitoring.outputs.snsTopics).forEach(([name, topic]) => {
                if (topic && typeof topic === 'object' && 'topicArn' in topic) {
                    this.snsTopicArns[name] = topic.topicArn;
                }
            });
        }
        console.log('🔗 他スタック参照用プロパティ設定完了');
    }
    /**
     * スタック出力作成（個別デプロイ対応）
     */
    createOutputs() {
        // CloudWatchダッシュボードURL出力（存在する場合のみ）
        if (this.dashboardUrl) {
            new cdk.CfnOutput(this, 'DashboardUrl', {
                value: this.dashboardUrl,
                description: 'CloudWatch Dashboard URL',
                exportName: `${this.stackName}-DashboardUrl`,
            });
        }
        // SNSトピックARN出力（他スタックからの参照用）
        Object.entries(this.snsTopicArns).forEach(([name, topicArn]) => {
            new cdk.CfnOutput(this, `SnsTopic${name}Arn`, {
                value: topicArn,
                description: `SNS ${name} Topic ARN`,
                exportName: `${this.stackName}-SnsTopic${name}Arn`,
            });
        });
        // 監視統合出力（存在する場合のみ）
        if (this.monitoring.outputs) {
            // X-Ray Trace URL
            if (this.monitoring.outputs.xrayTraceUrl) {
                new cdk.CfnOutput(this, 'XRayTraceUrl', {
                    value: this.monitoring.outputs.xrayTraceUrl,
                    description: 'X-Ray Trace URL',
                    exportName: `${this.stackName}-XRayTraceUrl`,
                });
            }
            // Log Group Names
            if (this.monitoring.outputs.logGroupNames) {
                Object.entries(this.monitoring.outputs.logGroupNames).forEach(([name, logGroupName]) => {
                    new cdk.CfnOutput(this, `LogGroup${name}Name`, {
                        value: logGroupName,
                        description: `CloudWatch Log Group ${name} Name`,
                        exportName: `${this.stackName}-LogGroup${name}Name`,
                    });
                });
            }
        }
        // エンタープライズ統合出力（存在する場合のみ）
        if (this.enterprise.outputs) {
            // BI Dashboard URL
            if (this.enterprise.outputs.biDashboardUrl) {
                new cdk.CfnOutput(this, 'BiDashboardUrl', {
                    value: this.enterprise.outputs.biDashboardUrl,
                    description: 'BI Analytics Dashboard URL',
                    exportName: `${this.stackName}-BiDashboardUrl`,
                });
            }
            // Organization Management Console URL
            if (this.enterprise.outputs.organizationConsoleUrl) {
                new cdk.CfnOutput(this, 'OrganizationConsoleUrl', {
                    value: this.enterprise.outputs.organizationConsoleUrl,
                    description: 'Organization Management Console URL',
                    exportName: `${this.stackName}-OrganizationConsoleUrl`,
                });
            }
        }
        console.log('📤 OperationsStack出力値作成完了');
    }
    /**
     * スタックタグ設定（Agent Steering準拠）
     */
    addStackTags() {
        cdk.Tags.of(this).add('Module', 'Monitoring+Enterprise');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Architecture', 'Modular');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('MonitoringServices', 'CloudWatch+X-Ray+SNS');
        cdk.Tags.of(this).add('EnterpriseFeatures', 'BI+Organization+AccessControl');
        cdk.Tags.of(this).add('IndividualDeploySupport', 'Yes');
        console.log('🏷️ OperationsStackタグ設定完了');
    }
    /** コンプライアンスコンストラクト */
    compliance;
    constructor(scope, id, props) {
        super(scope, id, props);
        // スタック依存関係設定（全スタックに依存）
        this.addDependency(props.networkingStack);
        this.addDependency(props.securityStack);
        this.addDependency(props.dataStack);
        this.addDependency(props.embeddingStack);
        this.addDependency(props.webAppStack);
        // SNS通知作成（最初に作成、他の監視で使用）
        this.sns = new SnsConstruct(this, 'Sns', {
            projectName: props.projectName,
            environment: props.environment,
            kmsKey: props.securityStack.kms.mainKey,
            snsConfig: props.monitoringConfig.sns,
        });
        // CloudWatch監視作成
        this.cloudWatch = new CloudWatchConstruct(this, 'CloudWatch', {
            projectName: props.projectName,
            environment: props.environment,
            vpc: props.networkingStack.vpc.vpc,
            lambdaFunctions: [
                props.embeddingStack.lambda.chatbotFunction,
                props.embeddingStack.lambda.embeddingFunction,
                props.embeddingStack.lambda.documentProcessorFunction,
            ],
            dynamoDbTables: [
                props.dataStack.dynamoDb.sessionsTable,
                props.dataStack.dynamoDb.documentsTable,
            ],
            s3Buckets: [
                props.dataStack.s3.documentsBucket,
                props.dataStack.s3.staticAssetsBucket,
            ],
            apiGateway: props.webAppStack.apiGateway.restApi,
            cloudFrontDistribution: props.webAppStack.cloudFront.distribution,
            snsTopics: this.sns.alertTopics,
            cloudWatchConfig: props.monitoringConfig.cloudWatch,
        });
        // X-Rayトレーシング作成
        this.xray = new XRayConstruct(this, 'XRay', {
            projectName: props.projectName,
            environment: props.environment,
            lambdaFunctions: [
                props.embeddingStack.lambda.chatbotFunction,
                props.embeddingStack.lambda.embeddingFunction,
                props.embeddingStack.lambda.documentProcessorFunction,
            ],
            apiGateway: props.webAppStack.apiGateway.restApi,
            xrayConfig: props.monitoringConfig.xray,
        });
        // ログ管理作成
        this.logging = new LoggingConstruct(this, 'Logging', {
            projectName: props.projectName,
            environment: props.environment,
            kmsKey: props.securityStack.kms.mainKey,
            loggingConfig: props.monitoringConfig.logging,
        });
        // アクセス制御作成
        this.accessControl = new AccessControlConstruct(this, 'AccessControl', {
            projectName: props.projectName,
            environment: props.environment,
            userPool: props.webAppStack.cognito.userPool,
            identityPool: props.webAppStack.cognito.identityPool,
            kmsKey: props.securityStack.kms.mainKey,
            accessControlConfig: props.enterpriseConfig.accessControl,
        });
        // BI分析作成
        this.biAnalytics = new BiAnalyticsConstruct(this, 'BiAnalytics', {
            projectName: props.projectName,
            environment: props.environment,
            vpc: props.networkingStack.vpc.vpc,
            privateSubnets: props.networkingStack.subnets.privateSubnets,
            kmsKey: props.securityStack.kms.mainKey,
            dataLake: props.dataStack.s3.dataLakeBucket,
            dynamoDbTables: [
                props.dataStack.dynamoDb.sessionsTable,
                props.dataStack.dynamoDb.documentsTable,
            ],
            biAnalyticsConfig: props.enterpriseConfig.biAnalytics,
        });
        // 組織管理作成
        this.organization = new OrganizationConstruct(this, 'Organization', {
            projectName: props.projectName,
            environment: props.environment,
            userPool: props.webAppStack.cognito.userPool,
            kmsKey: props.securityStack.kms.mainKey,
            organizationConfig: props.enterpriseConfig.organization,
        });
        // コンプライアンス作成
        this.compliance = new ComplianceConstruct(this, 'Compliance', {
            projectName: props.projectName,
            environment: props.environment,
            vpc: props.networkingStack.vpc.vpc,
            kmsKey: props.securityStack.kms.mainKey,
            cloudWatchLogs: this.logging.logGroups,
            snsTopics: this.sns.alertTopics,
            complianceConfig: props.enterpriseConfig.compliance,
        });
        // スタック出力
        this.createOutputs();
        // タグ設定
        this.addStackTags(props);
    }
    /**
     * スタック出力作成
     */
    createOutputs() {
        // CloudWatch出力
        new cdk.CfnOutput(this, 'MainDashboardUrl', {
            value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.cloudWatch.mainDashboard.dashboardName}`,
            description: 'Main CloudWatch Dashboard URL',
            exportName: `${this.stackName}-MainDashboardUrl`,
        });
        // SNS出力
        new cdk.CfnOutput(this, 'AlertTopicArn', {
            value: this.sns.alertTopics.critical.topicArn,
            description: 'Critical Alert SNS Topic ARN',
            exportName: `${this.stackName}-AlertTopicArn`,
        });
        // X-Ray出力
        new cdk.CfnOutput(this, 'XRayServiceMapUrl', {
            value: `https://console.aws.amazon.com/xray/home?region=${this.region}#/service-map`,
            description: 'X-Ray Service Map URL',
            exportName: `${this.stackName}-XRayServiceMapUrl`,
        });
        // BI Analytics出力
        new cdk.CfnOutput(this, 'QuickSightDashboardUrl', {
            value: this.biAnalytics.dashboardUrl,
            description: 'QuickSight Dashboard URL',
            exportName: `${this.stackName}-QuickSightDashboardUrl`,
        });
        // コンプライアンス出力
        new cdk.CfnOutput(this, 'ComplianceReportBucket', {
            value: this.compliance.reportBucket.bucketName,
            description: 'Compliance Report S3 Bucket',
            exportName: `${this.stackName}-ComplianceReportBucket`,
        });
    }
    /**
     * スタックタグ設定
     */
    addStackTags(props) {
        cdk.Tags.of(this).add('Module', 'Operations');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Project', props.projectName);
        cdk.Tags.of(this).add('Environment', props.environment);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('MonitoringEnabled', 'true');
        cdk.Tags.of(this).add('EnterpriseFeatures', 'true');
    }
}
exports.OperationsStack = OperationsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9ucy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wZXJhdGlvbnMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUduQyw0QkFBNEI7QUFDNUIsbUdBQStGO0FBRS9GLGtDQUFrQztBQUNsQyxtR0FBK0Y7QUFvQi9GOzs7OztHQUtHO0FBQ0gsTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzVDLGtCQUFrQjtJQUNGLFVBQVUsQ0FBc0I7SUFFaEQsd0JBQXdCO0lBQ1IsVUFBVSxDQUFzQjtJQUVoRCx3Q0FBd0M7SUFDeEIsWUFBWSxDQUFVO0lBRXRDLDhCQUE4QjtJQUNkLFlBQVksR0FBOEIsRUFBRSxDQUFDO0lBRTdELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7UUFDbkUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUzRSx5QkFBeUI7UUFDekIsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsYUFBYSxDQUFD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QUM7Q0FDRjtBQTNWRCwwQ0EyVkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE9wZXJhdGlvbnNTdGFjayAtIOe1seWQiOmBi+eUqOODu+OCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCueOCv+ODg+OCr++8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo+WvvuW/nO+8iVxuICogXG4gKiDmqZ/og706XG4gKiAtIOe1seWQiOebo+imluODu+OCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCs+ODs+OCueODiOODqeOCr+ODiOOBq+OCiOOCi+S4gOWFg+euoeeQhlxuICogLSBDbG91ZFdhdGNo44O7WC1SYXnjg7tTTlPjg7tCSeODu+e1hOe5lOeuoeeQhuOBrue1seWQiFxuICogLSBBZ2VudCBTdGVlcmluZ+a6luaLoOWRveWQjeimj+WJh+WvvuW/nFxuICogLSDlgIvliKXjgrnjgr/jg4Pjgq/jg4fjg5fjg63jgqTlrozlhajlr77lv5xcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8vIOe1seWQiOebo+imluOCs+ODs+OCueODiOODqeOCr+ODiO+8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo++8iVxuaW1wb3J0IHsgTW9uaXRvcmluZ0NvbnN0cnVjdCB9IGZyb20gJy4uLy4uL21vZHVsZXMvbW9uaXRvcmluZy9jb25zdHJ1Y3RzL21vbml0b3JpbmctY29uc3RydWN0JztcblxuLy8g57Wx5ZCI44Ko44Oz44K/44O844OX44Op44Kk44K644Kz44Oz44K544OI44Op44Kv44OI77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj77yJXG5pbXBvcnQgeyBFbnRlcnByaXNlQ29uc3RydWN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9lbnRlcnByaXNlL2NvbnN0cnVjdHMvZW50ZXJwcmlzZS1jb25zdHJ1Y3QnO1xuXG4vLyDjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbmltcG9ydCB7IE1vbml0b3JpbmdDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL21vbml0b3JpbmcvaW50ZXJmYWNlcy9tb25pdG9yaW5nLWNvbmZpZyc7XG5cbi8vIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruS+neWtmOmWouS/glxuaW1wb3J0IHsgU2VjdXJpdHlTdGFjayB9IGZyb20gJy4vc2VjdXJpdHktc3RhY2snO1xuaW1wb3J0IHsgRGF0YVN0YWNrIH0gZnJvbSAnLi9kYXRhLXN0YWNrJztcbmltcG9ydCB7IENvbXB1dGVTdGFjayB9IGZyb20gJy4vY29tcHV0ZS1zdGFjayc7XG5pbXBvcnQgeyBXZWJBcHBTdGFjayB9IGZyb20gJy4vd2ViYXBwLXN0YWNrJztcblxuZXhwb3J0IGludGVyZmFjZSBPcGVyYXRpb25zU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcmVhZG9ubHkgY29uZmlnOiBhbnk7IC8vIOe1seWQiOioreWumuOCquODluOCuOOCp+OCr+ODiFxuICByZWFkb25seSBzZWN1cml0eVN0YWNrPzogU2VjdXJpdHlTdGFjazsgLy8g44K744Kt44Ol44Oq44OG44Kj44K544K/44OD44Kv77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IGRhdGFTdGFjaz86IERhdGFTdGFjazsgLy8g44OH44O844K/44K544K/44OD44Kv77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IGNvbXB1dGVTdGFjaz86IENvbXB1dGVTdGFjazsgLy8g44Kz44Oz44OU44Ol44O844OI44K544K/44OD44Kv77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IHdlYkFwcFN0YWNrPzogV2ViQXBwU3RhY2s7IC8vIFdlYkFwcOOCueOCv+ODg+OCr++8iOOCquODl+OCt+ODp+ODs++8iVxuICByZWFkb25seSBuYW1pbmdHZW5lcmF0b3I/OiBhbnk7IC8vIEFnZW50IFN0ZWVyaW5n5rqW5oug5ZG95ZCN44K444Kn44ON44Os44O844K/44O877yI44Kq44OX44K344On44Oz77yJXG59XG5cbi8qKlxuICog57Wx5ZCI6YGL55So44O744Ko44Oz44K/44O844OX44Op44Kk44K644K544K/44OD44Kv77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj5a++5b+c77yJXG4gKiBcbiAqIOe1seWQiOebo+imluODu+OCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCs+ODs+OCueODiOODqeOCr+ODiOOBq+OCiOOCi+S4gOWFg+euoeeQhlxuICog5YCL5Yil44K544K/44OD44Kv44OH44OX44Ot44Kk5a6M5YWo5a++5b+cXG4gKi9cbmV4cG9ydCBjbGFzcyBPcGVyYXRpb25zU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAvKiog57Wx5ZCI55uj6KaW44Kz44Oz44K544OI44Op44Kv44OIICovXG4gIHB1YmxpYyByZWFkb25seSBtb25pdG9yaW5nOiBNb25pdG9yaW5nQ29uc3RydWN0O1xuICBcbiAgLyoqIOe1seWQiOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCs+ODs+OCueODiOODqeOCr+ODiCAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZW50ZXJwcmlzZTogRW50ZXJwcmlzZUNvbnN0cnVjdDtcbiAgXG4gIC8qKiBDbG91ZFdhdGNo44OA44OD44K344Ol44Oc44O844OJVVJM77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJICovXG4gIHB1YmxpYyByZWFkb25seSBkYXNoYm9hcmRVcmw/OiBzdHJpbmc7XG4gIFxuICAvKiogU05T44OI44OU44OD44KvQVJO77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJICovXG4gIHB1YmxpYyByZWFkb25seSBzbnNUb3BpY0FybnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogT3BlcmF0aW9uc1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnNvbGUubG9nKCfwn5OKIE9wZXJhdGlvbnNTdGFja+WIneacn+WMlumWi+Wniy4uLicpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OdIOOCueOCv+ODg+OCr+WQjTonLCBpZCk7XG4gICAgY29uc29sZS5sb2coJ/Cfj7fvuI8gQWdlbnQgU3RlZXJpbmfmupbmi6A6JywgcHJvcHMubmFtaW5nR2VuZXJhdG9yID8gJ1llcycgOiAnTm8nKTtcblxuICAgIC8vIOS+neWtmOOCueOCv+ODg+OCr+OBqOOBruS+neWtmOmWouS/guioreWumu+8iOWtmOWcqOOBmeOCi+WgtOWQiO+8iVxuICAgIGlmIChwcm9wcy5zZWN1cml0eVN0YWNrKSB7XG4gICAgICB0aGlzLmFkZERlcGVuZGVuY3kocHJvcHMuc2VjdXJpdHlTdGFjayk7XG4gICAgICBjb25zb2xlLmxvZygn8J+UlyBTZWN1cml0eVN0YWNr44Go44Gu5L6d5a2Y6Zai5L+C6Kit5a6a5a6M5LqGJyk7XG4gICAgfVxuICAgIGlmIChwcm9wcy5kYXRhU3RhY2spIHtcbiAgICAgIHRoaXMuYWRkRGVwZW5kZW5jeShwcm9wcy5kYXRhU3RhY2spO1xuICAgICAgY29uc29sZS5sb2coJ/CflJcgRGF0YVN0YWNr44Go44Gu5L6d5a2Y6Zai5L+C6Kit5a6a5a6M5LqGJyk7XG4gICAgfVxuICAgIGlmIChwcm9wcy5jb21wdXRlU3RhY2spIHtcbiAgICAgIHRoaXMuYWRkRGVwZW5kZW5jeShwcm9wcy5jb21wdXRlU3RhY2spO1xuICAgICAgY29uc29sZS5sb2coJ/CflJcgQ29tcHV0ZVN0YWNr44Go44Gu5L6d5a2Y6Zai5L+C6Kit5a6a5a6M5LqGJyk7XG4gICAgfVxuICAgIGlmIChwcm9wcy53ZWJBcHBTdGFjaykge1xuICAgICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLndlYkFwcFN0YWNrKTtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SXIFdlYkFwcFN0YWNr44Go44Gu5L6d5a2Y6Zai5L+C6Kit5a6a5a6M5LqGJyk7XG4gICAgfVxuXG4gICAgLy8g57Wx5ZCI55uj6KaW44Kz44Oz44K544OI44Op44Kv44OI5L2c5oiQXG4gICAgdGhpcy5tb25pdG9yaW5nID0gbmV3IE1vbml0b3JpbmdDb25zdHJ1Y3QodGhpcywgJ01vbml0b3JpbmcnLCB7XG4gICAgICBjb25maWc6IHByb3BzLmNvbmZpZy5tb25pdG9yaW5nLFxuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLmNvbmZpZy5wcm9qZWN0Lm5hbWUsXG4gICAgICBlbnZpcm9ubWVudDogcHJvcHMuY29uZmlnLmVudmlyb25tZW50LFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrPy5rbXNLZXksXG4gICAgICBsYW1iZGFGdW5jdGlvbkFybnM6IHByb3BzLmNvbXB1dGVTdGFjaz8ubGFtYmRhRnVuY3Rpb25Bcm5zLFxuICAgICAgczNCdWNrZXROYW1lczogcHJvcHMuZGF0YVN0YWNrPy5zM0J1Y2tldE5hbWVzLFxuICAgICAgY2xvdWRGcm9udFVybDogcHJvcHMud2ViQXBwU3RhY2s/LmNsb3VkRnJvbnRVcmwsXG4gICAgICBuYW1pbmdHZW5lcmF0b3I6IHByb3BzLm5hbWluZ0dlbmVyYXRvcixcbiAgICB9KTtcblxuICAgIC8vIOe1seWQiOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCs+ODs+OCueODiOODqeOCr+ODiOS9nOaIkFxuICAgIHRoaXMuZW50ZXJwcmlzZSA9IG5ldyBFbnRlcnByaXNlQ29uc3RydWN0KHRoaXMsICdFbnRlcnByaXNlJywge1xuICAgICAgY29uZmlnOiBwcm9wcy5jb25maWcuZW50ZXJwcmlzZSxcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5jb25maWcucHJvamVjdC5uYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmNvbmZpZy5lbnZpcm9ubWVudCxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjaz8ua21zS2V5LFxuICAgICAgY29nbml0b1VzZXJQb29sSWQ6IHByb3BzLndlYkFwcFN0YWNrPy5jb2duaXRvVXNlclBvb2xJZCxcbiAgICAgIG5hbWluZ0dlbmVyYXRvcjogcHJvcHMubmFtaW5nR2VuZXJhdG9yLFxuICAgIH0pO1xuXG4gICAgLy8g5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6aXG4gICAgdGhpcy5zZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk7XG5cbiAgICAvLyDjgrnjgr/jg4Pjgq/lh7rliptcbiAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcblxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIHRoaXMuYWRkU3RhY2tUYWdzKCk7XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIE9wZXJhdGlvbnNTdGFja+WIneacn+WMluWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqOODl+ODreODkeODhuOCo+ioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk6IHZvaWQge1xuICAgIC8vIENsb3VkV2F0Y2jjg4Djg4Pjgrfjg6Xjg5zjg7zjg4lVUkzjga7oqK3lrprvvIjlrZjlnKjjgZnjgovloLTlkIjvvIlcbiAgICBpZiAodGhpcy5tb25pdG9yaW5nLm91dHB1dHM/LmRhc2hib2FyZFVybCkge1xuICAgICAgdGhpcy5kYXNoYm9hcmRVcmwgPSB0aGlzLm1vbml0b3Jpbmcub3V0cHV0cy5kYXNoYm9hcmRVcmw7XG4gICAgfVxuXG4gICAgLy8gU05T44OI44OU44OD44KvQVJO44Gu6Kit5a6a77yI5a2Y5Zyo44GZ44KL5aC05ZCI77yJXG4gICAgaWYgKHRoaXMubW9uaXRvcmluZy5vdXRwdXRzPy5zbnNUb3BpY3MpIHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMubW9uaXRvcmluZy5vdXRwdXRzLnNuc1RvcGljcykuZm9yRWFjaCgoW25hbWUsIHRvcGljXSkgPT4ge1xuICAgICAgICBpZiAodG9waWMgJiYgdHlwZW9mIHRvcGljID09PSAnb2JqZWN0JyAmJiAndG9waWNBcm4nIGluIHRvcGljKSB7XG4gICAgICAgICAgdGhpcy5zbnNUb3BpY0FybnNbbmFtZV0gPSB0b3BpYy50b3BpY0FybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ/CflJcg5LuW44K544K/44OD44Kv5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6a5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv5Ye65Yqb5L2c5oiQ77yI5YCL5Yil44OH44OX44Ot44Kk5a++5b+c77yJXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgLy8gQ2xvdWRXYXRjaOODgOODg+OCt+ODpeODnOODvOODiVVSTOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLmRhc2hib2FyZFVybCkge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rhc2hib2FyZFVybCcsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuZGFzaGJvYXJkVXJsLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkV2F0Y2ggRGFzaGJvYXJkIFVSTCcsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1EYXNoYm9hcmRVcmxgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU05T44OI44OU44OD44KvQVJO5Ye65Yqb77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJXG4gICAgT2JqZWN0LmVudHJpZXModGhpcy5zbnNUb3BpY0FybnMpLmZvckVhY2goKFtuYW1lLCB0b3BpY0Fybl0pID0+IHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGBTbnNUb3BpYyR7bmFtZX1Bcm5gLCB7XG4gICAgICAgIHZhbHVlOiB0b3BpY0FybixcbiAgICAgICAgZGVzY3JpcHRpb246IGBTTlMgJHtuYW1lfSBUb3BpYyBBUk5gLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tU25zVG9waWMke25hbWV9QXJuYCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8g55uj6KaW57Wx5ZCI5Ye65Yqb77yI5a2Y5Zyo44GZ44KL5aC05ZCI44Gu44G/77yJXG4gICAgaWYgKHRoaXMubW9uaXRvcmluZy5vdXRwdXRzKSB7XG4gICAgICAvLyBYLVJheSBUcmFjZSBVUkxcbiAgICAgIGlmICh0aGlzLm1vbml0b3Jpbmcub3V0cHV0cy54cmF5VHJhY2VVcmwpIHtcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1hSYXlUcmFjZVVybCcsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5tb25pdG9yaW5nLm91dHB1dHMueHJheVRyYWNlVXJsLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnWC1SYXkgVHJhY2UgVVJMJyxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tWFJheVRyYWNlVXJsYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIExvZyBHcm91cCBOYW1lc1xuICAgICAgaWYgKHRoaXMubW9uaXRvcmluZy5vdXRwdXRzLmxvZ0dyb3VwTmFtZXMpIHtcbiAgICAgICAgT2JqZWN0LmVudHJpZXModGhpcy5tb25pdG9yaW5nLm91dHB1dHMubG9nR3JvdXBOYW1lcykuZm9yRWFjaCgoW25hbWUsIGxvZ0dyb3VwTmFtZV0pID0+IHtcbiAgICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgTG9nR3JvdXAke25hbWV9TmFtZWAsIHtcbiAgICAgICAgICAgIHZhbHVlOiBsb2dHcm91cE5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYENsb3VkV2F0Y2ggTG9nIEdyb3VwICR7bmFtZX0gTmFtZWAsXG4gICAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tTG9nR3JvdXAke25hbWV9TmFtZWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuue1seWQiOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLmVudGVycHJpc2Uub3V0cHV0cykge1xuICAgICAgLy8gQkkgRGFzaGJvYXJkIFVSTFxuICAgICAgaWYgKHRoaXMuZW50ZXJwcmlzZS5vdXRwdXRzLmJpRGFzaGJvYXJkVXJsKSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCaURhc2hib2FyZFVybCcsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5lbnRlcnByaXNlLm91dHB1dHMuYmlEYXNoYm9hcmRVcmwsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdCSSBBbmFseXRpY3MgRGFzaGJvYXJkIFVSTCcsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUJpRGFzaGJvYXJkVXJsYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE9yZ2FuaXphdGlvbiBNYW5hZ2VtZW50IENvbnNvbGUgVVJMXG4gICAgICBpZiAodGhpcy5lbnRlcnByaXNlLm91dHB1dHMub3JnYW5pemF0aW9uQ29uc29sZVVybCkge1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnT3JnYW5pemF0aW9uQ29uc29sZVVybCcsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5lbnRlcnByaXNlLm91dHB1dHMub3JnYW5pemF0aW9uQ29uc29sZVVybCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ09yZ2FuaXphdGlvbiBNYW5hZ2VtZW50IENvbnNvbGUgVVJMJyxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tT3JnYW5pemF0aW9uQ29uc29sZVVybGAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfwn5OkIE9wZXJhdGlvbnNTdGFja+WHuuWKm+WApOS9nOaIkOWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+OCv+OCsOioreWumu+8iEFnZW50IFN0ZWVyaW5n5rqW5oug77yJXG4gICAqL1xuICBwcml2YXRlIGFkZFN0YWNrVGFncygpOiB2b2lkIHtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01vZHVsZScsICdNb25pdG9yaW5nK0VudGVycHJpc2UnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1N0YWNrVHlwZScsICdJbnRlZ3JhdGVkJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdBcmNoaXRlY3R1cmUnLCAnTW9kdWxhcicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTW9uaXRvcmluZ1NlcnZpY2VzJywgJ0Nsb3VkV2F0Y2grWC1SYXkrU05TJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnRlcnByaXNlRmVhdHVyZXMnLCAnQkkrT3JnYW5pemF0aW9uK0FjY2Vzc0NvbnRyb2wnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0luZGl2aWR1YWxEZXBsb3lTdXBwb3J0JywgJ1llcycpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn4+377iPIE9wZXJhdGlvbnNTdGFja+OCv+OCsOioreWumuWujOS6hicpO1xuICB9XG4gIFxuICAvKiog44Kz44Oz44OX44Op44Kk44Ki44Oz44K544Kz44Oz44K544OI44Op44Kv44OIICovXG4gIHB1YmxpYyByZWFkb25seSBjb21wbGlhbmNlOiBDb21wbGlhbmNlQ29uc3RydWN0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBPcGVyYXRpb25zU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8g44K544K/44OD44Kv5L6d5a2Y6Zai5L+C6Kit5a6a77yI5YWo44K544K/44OD44Kv44Gr5L6d5a2Y77yJXG4gICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLm5ldHdvcmtpbmdTdGFjayk7XG4gICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLnNlY3VyaXR5U3RhY2spO1xuICAgIHRoaXMuYWRkRGVwZW5kZW5jeShwcm9wcy5kYXRhU3RhY2spO1xuICAgIHRoaXMuYWRkRGVwZW5kZW5jeShwcm9wcy5lbWJlZGRpbmdTdGFjayk7XG4gICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLndlYkFwcFN0YWNrKTtcblxuICAgIC8vIFNOU+mAmuefpeS9nOaIkO+8iOacgOWIneOBq+S9nOaIkOOAgeS7luOBruebo+imluOBp+S9v+eUqO+8iVxuICAgIHRoaXMuc25zID0gbmV3IFNuc0NvbnN0cnVjdCh0aGlzLCAnU25zJywge1xuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrLmttcy5tYWluS2V5LFxuICAgICAgc25zQ29uZmlnOiBwcm9wcy5tb25pdG9yaW5nQ29uZmlnLnNucyxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkV2F0Y2jnm6PoppbkvZzmiJBcbiAgICB0aGlzLmNsb3VkV2F0Y2ggPSBuZXcgQ2xvdWRXYXRjaENvbnN0cnVjdCh0aGlzLCAnQ2xvdWRXYXRjaCcsIHtcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIHZwYzogcHJvcHMubmV0d29ya2luZ1N0YWNrLnZwYy52cGMsXG4gICAgICBsYW1iZGFGdW5jdGlvbnM6IFtcbiAgICAgICAgcHJvcHMuZW1iZWRkaW5nU3RhY2subGFtYmRhLmNoYXRib3RGdW5jdGlvbixcbiAgICAgICAgcHJvcHMuZW1iZWRkaW5nU3RhY2subGFtYmRhLmVtYmVkZGluZ0Z1bmN0aW9uLFxuICAgICAgICBwcm9wcy5lbWJlZGRpbmdTdGFjay5sYW1iZGEuZG9jdW1lbnRQcm9jZXNzb3JGdW5jdGlvbixcbiAgICAgIF0sXG4gICAgICBkeW5hbW9EYlRhYmxlczogW1xuICAgICAgICBwcm9wcy5kYXRhU3RhY2suZHluYW1vRGIuc2Vzc2lvbnNUYWJsZSxcbiAgICAgICAgcHJvcHMuZGF0YVN0YWNrLmR5bmFtb0RiLmRvY3VtZW50c1RhYmxlLFxuICAgICAgXSxcbiAgICAgIHMzQnVja2V0czogW1xuICAgICAgICBwcm9wcy5kYXRhU3RhY2suczMuZG9jdW1lbnRzQnVja2V0LFxuICAgICAgICBwcm9wcy5kYXRhU3RhY2suczMuc3RhdGljQXNzZXRzQnVja2V0LFxuICAgICAgXSxcbiAgICAgIGFwaUdhdGV3YXk6IHByb3BzLndlYkFwcFN0YWNrLmFwaUdhdGV3YXkucmVzdEFwaSxcbiAgICAgIGNsb3VkRnJvbnREaXN0cmlidXRpb246IHByb3BzLndlYkFwcFN0YWNrLmNsb3VkRnJvbnQuZGlzdHJpYnV0aW9uLFxuICAgICAgc25zVG9waWNzOiB0aGlzLnNucy5hbGVydFRvcGljcyxcbiAgICAgIGNsb3VkV2F0Y2hDb25maWc6IHByb3BzLm1vbml0b3JpbmdDb25maWcuY2xvdWRXYXRjaCxcbiAgICB9KTtcblxuICAgIC8vIFgtUmF544OI44Os44O844K344Oz44Kw5L2c5oiQXG4gICAgdGhpcy54cmF5ID0gbmV3IFhSYXlDb25zdHJ1Y3QodGhpcywgJ1hSYXknLCB7XG4gICAgICBwcm9qZWN0TmFtZTogcHJvcHMucHJvamVjdE5hbWUsXG4gICAgICBlbnZpcm9ubWVudDogcHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICBsYW1iZGFGdW5jdGlvbnM6IFtcbiAgICAgICAgcHJvcHMuZW1iZWRkaW5nU3RhY2subGFtYmRhLmNoYXRib3RGdW5jdGlvbixcbiAgICAgICAgcHJvcHMuZW1iZWRkaW5nU3RhY2subGFtYmRhLmVtYmVkZGluZ0Z1bmN0aW9uLFxuICAgICAgICBwcm9wcy5lbWJlZGRpbmdTdGFjay5sYW1iZGEuZG9jdW1lbnRQcm9jZXNzb3JGdW5jdGlvbixcbiAgICAgIF0sXG4gICAgICBhcGlHYXRld2F5OiBwcm9wcy53ZWJBcHBTdGFjay5hcGlHYXRld2F5LnJlc3RBcGksXG4gICAgICB4cmF5Q29uZmlnOiBwcm9wcy5tb25pdG9yaW5nQ29uZmlnLnhyYXksXG4gICAgfSk7XG5cbiAgICAvLyDjg63jgrDnrqHnkIbkvZzmiJBcbiAgICB0aGlzLmxvZ2dpbmcgPSBuZXcgTG9nZ2luZ0NvbnN0cnVjdCh0aGlzLCAnTG9nZ2luZycsIHtcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjay5rbXMubWFpbktleSxcbiAgICAgIGxvZ2dpbmdDb25maWc6IHByb3BzLm1vbml0b3JpbmdDb25maWcubG9nZ2luZyxcbiAgICB9KTtcblxuICAgIC8vIOOCouOCr+OCu+OCueWItuW+oeS9nOaIkFxuICAgIHRoaXMuYWNjZXNzQ29udHJvbCA9IG5ldyBBY2Nlc3NDb250cm9sQ29uc3RydWN0KHRoaXMsICdBY2Nlc3NDb250cm9sJywge1xuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAgdXNlclBvb2w6IHByb3BzLndlYkFwcFN0YWNrLmNvZ25pdG8udXNlclBvb2wsXG4gICAgICBpZGVudGl0eVBvb2w6IHByb3BzLndlYkFwcFN0YWNrLmNvZ25pdG8uaWRlbnRpdHlQb29sLFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrLmttcy5tYWluS2V5LFxuICAgICAgYWNjZXNzQ29udHJvbENvbmZpZzogcHJvcHMuZW50ZXJwcmlzZUNvbmZpZy5hY2Nlc3NDb250cm9sLFxuICAgIH0pO1xuXG4gICAgLy8gQknliIbmnpDkvZzmiJBcbiAgICB0aGlzLmJpQW5hbHl0aWNzID0gbmV3IEJpQW5hbHl0aWNzQ29uc3RydWN0KHRoaXMsICdCaUFuYWx5dGljcycsIHtcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5wcm9qZWN0TmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIHZwYzogcHJvcHMubmV0d29ya2luZ1N0YWNrLnZwYy52cGMsXG4gICAgICBwcml2YXRlU3VibmV0czogcHJvcHMubmV0d29ya2luZ1N0YWNrLnN1Ym5ldHMucHJpdmF0ZVN1Ym5ldHMsXG4gICAgICBrbXNLZXk6IHByb3BzLnNlY3VyaXR5U3RhY2sua21zLm1haW5LZXksXG4gICAgICBkYXRhTGFrZTogcHJvcHMuZGF0YVN0YWNrLnMzLmRhdGFMYWtlQnVja2V0LFxuICAgICAgZHluYW1vRGJUYWJsZXM6IFtcbiAgICAgICAgcHJvcHMuZGF0YVN0YWNrLmR5bmFtb0RiLnNlc3Npb25zVGFibGUsXG4gICAgICAgIHByb3BzLmRhdGFTdGFjay5keW5hbW9EYi5kb2N1bWVudHNUYWJsZSxcbiAgICAgIF0sXG4gICAgICBiaUFuYWx5dGljc0NvbmZpZzogcHJvcHMuZW50ZXJwcmlzZUNvbmZpZy5iaUFuYWx5dGljcyxcbiAgICB9KTtcblxuICAgIC8vIOe1hOe5lOeuoeeQhuS9nOaIkFxuICAgIHRoaXMub3JnYW5pemF0aW9uID0gbmV3IE9yZ2FuaXphdGlvbkNvbnN0cnVjdCh0aGlzLCAnT3JnYW5pemF0aW9uJywge1xuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAgdXNlclBvb2w6IHByb3BzLndlYkFwcFN0YWNrLmNvZ25pdG8udXNlclBvb2wsXG4gICAgICBrbXNLZXk6IHByb3BzLnNlY3VyaXR5U3RhY2sua21zLm1haW5LZXksXG4gICAgICBvcmdhbml6YXRpb25Db25maWc6IHByb3BzLmVudGVycHJpc2VDb25maWcub3JnYW5pemF0aW9uLFxuICAgIH0pO1xuXG4gICAgLy8g44Kz44Oz44OX44Op44Kk44Ki44Oz44K55L2c5oiQXG4gICAgdGhpcy5jb21wbGlhbmNlID0gbmV3IENvbXBsaWFuY2VDb25zdHJ1Y3QodGhpcywgJ0NvbXBsaWFuY2UnLCB7XG4gICAgICBwcm9qZWN0TmFtZTogcHJvcHMucHJvamVjdE5hbWUsXG4gICAgICBlbnZpcm9ubWVudDogcHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICB2cGM6IHByb3BzLm5ldHdvcmtpbmdTdGFjay52cGMudnBjLFxuICAgICAga21zS2V5OiBwcm9wcy5zZWN1cml0eVN0YWNrLmttcy5tYWluS2V5LFxuICAgICAgY2xvdWRXYXRjaExvZ3M6IHRoaXMubG9nZ2luZy5sb2dHcm91cHMsXG4gICAgICBzbnNUb3BpY3M6IHRoaXMuc25zLmFsZXJ0VG9waWNzLFxuICAgICAgY29tcGxpYW5jZUNvbmZpZzogcHJvcHMuZW50ZXJwcmlzZUNvbmZpZy5jb21wbGlhbmNlLFxuICAgIH0pO1xuXG4gICAgLy8g44K544K/44OD44Kv5Ye65YqbXG4gICAgdGhpcy5jcmVhdGVPdXRwdXRzKCk7XG5cbiAgICAvLyDjgr/jgrDoqK3lrppcbiAgICB0aGlzLmFkZFN0YWNrVGFncyhwcm9wcyk7XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv5Ye65Yqb5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgLy8gQ2xvdWRXYXRjaOWHuuWKm1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdNYWluRGFzaGJvYXJkVXJsJywge1xuICAgICAgdmFsdWU6IGBodHRwczovL2NvbnNvbGUuYXdzLmFtYXpvbi5jb20vY2xvdWR3YXRjaC9ob21lP3JlZ2lvbj0ke3RoaXMucmVnaW9ufSNkYXNoYm9hcmRzOm5hbWU9JHt0aGlzLmNsb3VkV2F0Y2gubWFpbkRhc2hib2FyZC5kYXNoYm9hcmROYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ01haW4gQ2xvdWRXYXRjaCBEYXNoYm9hcmQgVVJMJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1NYWluRGFzaGJvYXJkVXJsYCxcbiAgICB9KTtcblxuICAgIC8vIFNOU+WHuuWKm1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBbGVydFRvcGljQXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMuc25zLmFsZXJ0VG9waWNzLmNyaXRpY2FsLnRvcGljQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdDcml0aWNhbCBBbGVydCBTTlMgVG9waWMgQVJOJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1BbGVydFRvcGljQXJuYCxcbiAgICB9KTtcblxuICAgIC8vIFgtUmF55Ye65YqbXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1hSYXlTZXJ2aWNlTWFwVXJsJywge1xuICAgICAgdmFsdWU6IGBodHRwczovL2NvbnNvbGUuYXdzLmFtYXpvbi5jb20veHJheS9ob21lP3JlZ2lvbj0ke3RoaXMucmVnaW9ufSMvc2VydmljZS1tYXBgLFxuICAgICAgZGVzY3JpcHRpb246ICdYLVJheSBTZXJ2aWNlIE1hcCBVUkwnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVhSYXlTZXJ2aWNlTWFwVXJsYCxcbiAgICB9KTtcblxuICAgIC8vIEJJIEFuYWx5dGljc+WHuuWKm1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdRdWlja1NpZ2h0RGFzaGJvYXJkVXJsJywge1xuICAgICAgdmFsdWU6IHRoaXMuYmlBbmFseXRpY3MuZGFzaGJvYXJkVXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdRdWlja1NpZ2h0IERhc2hib2FyZCBVUkwnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVF1aWNrU2lnaHREYXNoYm9hcmRVcmxgLFxuICAgIH0pO1xuXG4gICAgLy8g44Kz44Oz44OX44Op44Kk44Ki44Oz44K55Ye65YqbXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NvbXBsaWFuY2VSZXBvcnRCdWNrZXQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5jb21wbGlhbmNlLnJlcG9ydEJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdDb21wbGlhbmNlIFJlcG9ydCBTMyBCdWNrZXQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUNvbXBsaWFuY2VSZXBvcnRCdWNrZXRgLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+OCv+OCsOioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBhZGRTdGFja1RhZ3MocHJvcHM6IE9wZXJhdGlvbnNTdGFja1Byb3BzKTogdm9pZCB7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNb2R1bGUnLCAnT3BlcmF0aW9ucycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RhY2tUeXBlJywgJ0ludGVncmF0ZWQnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1Byb2plY3QnLCBwcm9wcy5wcm9qZWN0TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIHByb3BzLmVudmlyb25tZW50KTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01vbml0b3JpbmdFbmFibGVkJywgJ3RydWUnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0VudGVycHJpc2VGZWF0dXJlcycsICd0cnVlJyk7XG4gIH1cbn0iXX0=