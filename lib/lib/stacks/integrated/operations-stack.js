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
// タグ設定
const tagging_config_1 = require("../../config/tagging-config");
/**
 * 統合運用・エンタープライズスタック（モジュラーアーキテクチャ対応）
 *
 * 統合監視・エンタープライズコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
class OperationsStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        /** SNSトピックARN（他スタックからの参照用） */
        this.snsTopicArns = {};
        console.log('📊 OperationsStack初期化開始...');
        console.log('📝 スタック名:', id);
        console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');
        // コスト配布タグの適用
        const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(props.projectName, props.environment);
        tagging_config_1.TaggingStrategy.applyTagsToStack(this, taggingConfig);
        // 依存スタックとの依存関係設定（存在する場合）
        if (props.securityStack) {
            this.addDependency(props.securityStack);
            console.log('🔗 SecurityStackとの依存関係設定完了');
        }
        if (props.dataStack) {
            this.addDependency(props.dataStack);
            console.log('🔗 DataStackとの依存関係設定完了');
        }
        if (props.embeddingStack) {
            this.addDependency(props.embeddingStack);
            console.log('🔗 EmbeddingStackとの依存関係設定完了');
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
            lambdaFunctionArns: props.embeddingStack?.lambdaFunctions,
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
     * スタックタグ設定（統一されたタグ戦略使用）
     */
    addStackTags() {
        // 統一されたタグ戦略を使用
        const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(this.node.tryGetContext('projectName') || 'permission-aware-rag', this.node.tryGetContext('environment') || 'dev');
        // 環境固有のタグ設定を追加
        const environmentConfig = tagging_config_1.PermissionAwareRAGTags.getEnvironmentConfig(this.node.tryGetContext('environment') || 'dev');
        // タグ戦略を適用
        tagging_config_1.TaggingStrategy.applyTagsToStack(this, {
            ...taggingConfig,
            ...environmentConfig,
            customTags: {
                ...taggingConfig.customTags,
                ...environmentConfig.customTags,
                'Module': 'Monitoring+Enterprise',
                'StackType': 'Integrated',
                'Architecture': 'Modular',
                'MonitoringServices': 'CloudWatch+X-Ray+SNS',
                'EnterpriseFeatures': 'BI+Organization+AccessControl',
                'IndividualDeploySupport': 'Yes'
            }
        });
        console.log('🏷️ OperationsStackタグ設定完了（統一戦略使用）');
    }
}
exports.OperationsStack = OperationsStack;
