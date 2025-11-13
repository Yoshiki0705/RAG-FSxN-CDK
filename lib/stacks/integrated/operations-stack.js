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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9ucy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wZXJhdGlvbnMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUduQyw0QkFBNEI7QUFDNUIsbUdBQStGO0FBRS9GLGtDQUFrQztBQUNsQyxtR0FBK0Y7QUFXL0YsT0FBTztBQUNQLGdFQUFzRjtBQWF0Rjs7Ozs7R0FLRztBQUNILE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxrQkFBa0I7SUFDRixVQUFVLENBQXNCO0lBRWhELHdCQUF3QjtJQUNSLFVBQVUsQ0FBc0I7SUFFaEQsd0NBQXdDO0lBQ3hCLFlBQVksQ0FBVTtJQUV0Qyw4QkFBOEI7SUFDZCxZQUFZLEdBQThCLEVBQUUsQ0FBQztJQUU3RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFM0UsYUFBYTtRQUNiLE1BQU0sYUFBYSxHQUFHLHVDQUFzQixDQUFDLGlCQUFpQixDQUM1RCxLQUFLLENBQUMsV0FBVyxFQUNqQixLQUFLLENBQUMsV0FBVyxDQUNsQixDQUFDO1FBQ0YsZ0NBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFdEQseUJBQXlCO1FBQ3pCLElBQUksS0FBSyxDQUFDLGFB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O2dCQUMvQixRQUFRLEVBQUUsdUJBQXVCO2dCQUNqQyxXQUFXLEVBQUUsWUFBWTtnQkFDekIsY0FBYyxFQUFFLFNBQVM7Z0JBQ3pCLG9CQUFvQixFQUFFLHNCQUFzQjtnQkFDNUMsb0JBQW9CLEVBQUUsK0JBQStCO2dCQUNyRCx5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBQ25ELENBQUM7Q0FDRjtBQTFNRCwwQ0EwTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE9wZXJhdGlvbnNTdGFjayAtIOe1seWQiOmBi+eUqOODu+OCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCueOCv+ODg+OCr++8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo+WvvuW/nO+8iVxuICogXG4gKiDmqZ/og706XG4gKiAtIOe1seWQiOebo+imluODu+OCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCs+ODs+OCueODiOODqeOCr+ODiOOBq+OCiOOCi+S4gOWFg+euoeeQhlxuICogLSBDbG91ZFdhdGNo44O7WC1SYXnjg7tTTlPjg7tCSeODu+e1hOe5lOeuoeeQhuOBrue1seWQiFxuICogLSBBZ2VudCBTdGVlcmluZ+a6luaLoOWRveWQjeimj+WJh+WvvuW/nFxuICogLSDlgIvliKXjgrnjgr/jg4Pjgq/jg4fjg5fjg63jgqTlrozlhajlr77lv5xcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8vIOe1seWQiOebo+imluOCs+ODs+OCueODiOODqeOCr+ODiO+8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo++8iVxuaW1wb3J0IHsgTW9uaXRvcmluZ0NvbnN0cnVjdCB9IGZyb20gJy4uLy4uL21vZHVsZXMvbW9uaXRvcmluZy9jb25zdHJ1Y3RzL21vbml0b3JpbmctY29uc3RydWN0JztcblxuLy8g57Wx5ZCI44Ko44Oz44K/44O844OX44Op44Kk44K644Kz44Oz44K544OI44Op44Kv44OI77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj77yJXG5pbXBvcnQgeyBFbnRlcnByaXNlQ29uc3RydWN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9lbnRlcnByaXNlL2NvbnN0cnVjdHMvZW50ZXJwcmlzZS1jb25zdHJ1Y3QnO1xuXG4vLyDjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbmltcG9ydCB7IE1vbml0b3JpbmdDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL21vbml0b3JpbmcvaW50ZXJmYWNlcy9tb25pdG9yaW5nLWNvbmZpZyc7XG5cbi8vIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruS+neWtmOmWouS/glxuaW1wb3J0IHsgU2VjdXJpdHlTdGFjayB9IGZyb20gJy4vc2VjdXJpdHktc3RhY2snO1xuaW1wb3J0IHsgRGF0YVN0YWNrIH0gZnJvbSAnLi9kYXRhLXN0YWNrJztcbmltcG9ydCB7IEVtYmVkZGluZ1N0YWNrIH0gZnJvbSAnLi9lbWJlZGRpbmctc3RhY2snO1xuaW1wb3J0IHsgV2ViQXBwU3RhY2sgfSBmcm9tICcuL3dlYmFwcC1zdGFjayc7XG5cbi8vIOOCv+OCsOioreWumlxuaW1wb3J0IHsgVGFnZ2luZ1N0cmF0ZWd5LCBQZXJtaXNzaW9uQXdhcmVSQUdUYWdzIH0gZnJvbSAnLi4vLi4vY29uZmlnL3RhZ2dpbmctY29uZmlnJztcblxuZXhwb3J0IGludGVyZmFjZSBPcGVyYXRpb25zU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcmVhZG9ubHkgY29uZmlnOiBhbnk7IC8vIOe1seWQiOioreWumuOCquODluOCuOOCp+OCr+ODiFxuICByZWFkb25seSBzZWN1cml0eVN0YWNrPzogU2VjdXJpdHlTdGFjazsgLy8g44K744Kt44Ol44Oq44OG44Kj44K544K/44OD44Kv77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IGRhdGFTdGFjaz86IERhdGFTdGFjazsgLy8g44OH44O844K/44K544K/44OD44Kv77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IGVtYmVkZGluZ1N0YWNrPzogRW1iZWRkaW5nU3RhY2s7IC8vIEVtYmVkZGluZ+OCueOCv+ODg+OCr++8iOOCquODl+OCt+ODp+ODs++8iVxuICByZWFkb25seSB3ZWJBcHBTdGFjaz86IFdlYkFwcFN0YWNrOyAvLyBXZWJBcHDjgrnjgr/jg4Pjgq/vvIjjgqrjg5fjgrfjg6fjg7PvvIlcbiAgcmVhZG9ubHkgbmFtaW5nR2VuZXJhdG9yPzogYW55OyAvLyBBZ2VudCBTdGVlcmluZ+a6luaLoOWRveWQjeOCuOOCp+ODjeODrOODvOOCv+ODvO+8iOOCquODl+OCt+ODp+ODs++8iVxuICByZWFkb25seSBwcm9qZWN0TmFtZTogc3RyaW5nOyAvLyDjg5fjg63jgrjjgqfjgq/jg4jlkI3vvIjjgrPjgrnjg4jphY3luIPnlKjvvIlcbiAgcmVhZG9ubHkgZW52aXJvbm1lbnQ6IHN0cmluZzsgLy8g55Kw5aKD5ZCN77yI44Kz44K544OI6YWN5biD55So77yJXG59XG5cbi8qKlxuICog57Wx5ZCI6YGL55So44O744Ko44Oz44K/44O844OX44Op44Kk44K644K544K/44OD44Kv77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj5a++5b+c77yJXG4gKiBcbiAqIOe1seWQiOebo+imluODu+OCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCs+ODs+OCueODiOODqeOCr+ODiOOBq+OCiOOCi+S4gOWFg+euoeeQhlxuICog5YCL5Yil44K544K/44OD44Kv44OH44OX44Ot44Kk5a6M5YWo5a++5b+cXG4gKi9cbmV4cG9ydCBjbGFzcyBPcGVyYXRpb25zU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAvKiog57Wx5ZCI55uj6KaW44Kz44Oz44K544OI44Op44Kv44OIICovXG4gIHB1YmxpYyByZWFkb25seSBtb25pdG9yaW5nOiBNb25pdG9yaW5nQ29uc3RydWN0O1xuICBcbiAgLyoqIOe1seWQiOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCs+ODs+OCueODiOODqeOCr+ODiCAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZW50ZXJwcmlzZTogRW50ZXJwcmlzZUNvbnN0cnVjdDtcbiAgXG4gIC8qKiBDbG91ZFdhdGNo44OA44OD44K344Ol44Oc44O844OJVVJM77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJICovXG4gIHB1YmxpYyByZWFkb25seSBkYXNoYm9hcmRVcmw/OiBzdHJpbmc7XG4gIFxuICAvKiogU05T44OI44OU44OD44KvQVJO77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJICovXG4gIHB1YmxpYyByZWFkb25seSBzbnNUb3BpY0FybnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogT3BlcmF0aW9uc1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnNvbGUubG9nKCfwn5OKIE9wZXJhdGlvbnNTdGFja+WIneacn+WMlumWi+Wniy4uLicpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OdIOOCueOCv+ODg+OCr+WQjTonLCBpZCk7XG4gICAgY29uc29sZS5sb2coJ/Cfj7fvuI8gQWdlbnQgU3RlZXJpbmfmupbmi6A6JywgcHJvcHMubmFtaW5nR2VuZXJhdG9yID8gJ1llcycgOiAnTm8nKTtcblxuICAgIC8vIOOCs+OCueODiOmFjeW4g+OCv+OCsOOBrumBqeeUqFxuICAgIGNvbnN0IHRhZ2dpbmdDb25maWcgPSBQZXJtaXNzaW9uQXdhcmVSQUdUYWdzLmdldFN0YW5kYXJkQ29uZmlnKFxuICAgICAgcHJvcHMucHJvamVjdE5hbWUsXG4gICAgICBwcm9wcy5lbnZpcm9ubWVudFxuICAgICk7XG4gICAgVGFnZ2luZ1N0cmF0ZWd5LmFwcGx5VGFnc1RvU3RhY2sodGhpcywgdGFnZ2luZ0NvbmZpZyk7XG5cbiAgICAvLyDkvp3lrZjjgrnjgr/jg4Pjgq/jgajjga7kvp3lrZjplqLkv4LoqK3lrprvvIjlrZjlnKjjgZnjgovloLTlkIjvvIlcbiAgICBpZiAocHJvcHMuc2VjdXJpdHlTdGFjaykge1xuICAgICAgdGhpcy5hZGREZXBlbmRlbmN5KHByb3BzLnNlY3VyaXR5U3RhY2spO1xuICAgICAgY29uc29sZS5sb2coJ/CflJcgU2VjdXJpdHlTdGFja+OBqOOBruS+neWtmOmWouS/guioreWumuWujOS6hicpO1xuICAgIH1cbiAgICBpZiAocHJvcHMuZGF0YVN0YWNrKSB7XG4gICAgICB0aGlzLmFkZERlcGVuZGVuY3kocHJvcHMuZGF0YVN0YWNrKTtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SXIERhdGFTdGFja+OBqOOBruS+neWtmOmWouS/guioreWumuWujOS6hicpO1xuICAgIH1cbiAgICBpZiAocHJvcHMuZW1iZWRkaW5nU3RhY2spIHtcbiAgICAgIHRoaXMuYWRkRGVwZW5kZW5jeShwcm9wcy5lbWJlZGRpbmdTdGFjayk7XG4gICAgICBjb25zb2xlLmxvZygn8J+UlyBFbWJlZGRpbmdTdGFja+OBqOOBruS+neWtmOmWouS/guioreWumuWujOS6hicpO1xuICAgIH1cbiAgICBpZiAocHJvcHMud2ViQXBwU3RhY2spIHtcbiAgICAgIHRoaXMuYWRkRGVwZW5kZW5jeShwcm9wcy53ZWJBcHBTdGFjayk7XG4gICAgICBjb25zb2xlLmxvZygn8J+UlyBXZWJBcHBTdGFja+OBqOOBruS+neWtmOmWouS/guioreWumuWujOS6hicpO1xuICAgIH1cblxuICAgIC8vIOe1seWQiOebo+imluOCs+ODs+OCueODiOODqeOCr+ODiOS9nOaIkFxuICAgIHRoaXMubW9uaXRvcmluZyA9IG5ldyBNb25pdG9yaW5nQ29uc3RydWN0KHRoaXMsICdNb25pdG9yaW5nJywge1xuICAgICAgY29uZmlnOiBwcm9wcy5jb25maWcubW9uaXRvcmluZyxcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5jb25maWcucHJvamVjdC5uYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmNvbmZpZy5lbnZpcm9ubWVudCxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjaz8ua21zS2V5LFxuICAgICAgbGFtYmRhRnVuY3Rpb25Bcm5zOiBwcm9wcy5lbWJlZGRpbmdTdGFjaz8ubGFtYmRhRnVuY3Rpb25zLFxuICAgICAgczNCdWNrZXROYW1lczogcHJvcHMuZGF0YVN0YWNrPy5zM0J1Y2tldE5hbWVzLFxuICAgICAgY2xvdWRGcm9udFVybDogcHJvcHMud2ViQXBwU3RhY2s/LmNsb3VkRnJvbnRVcmwsXG4gICAgICBuYW1pbmdHZW5lcmF0b3I6IHByb3BzLm5hbWluZ0dlbmVyYXRvcixcbiAgICB9KTtcblxuICAgIC8vIOe1seWQiOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCs+ODs+OCueODiOODqeOCr+ODiOS9nOaIkFxuICAgIHRoaXMuZW50ZXJwcmlzZSA9IG5ldyBFbnRlcnByaXNlQ29uc3RydWN0KHRoaXMsICdFbnRlcnByaXNlJywge1xuICAgICAgY29uZmlnOiBwcm9wcy5jb25maWcuZW50ZXJwcmlzZSxcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5jb25maWcucHJvamVjdC5uYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmNvbmZpZy5lbnZpcm9ubWVudCxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjaz8ua21zS2V5LFxuICAgICAgY29nbml0b1VzZXJQb29sSWQ6IHByb3BzLndlYkFwcFN0YWNrPy5jb2duaXRvVXNlclBvb2xJZCxcbiAgICAgIG5hbWluZ0dlbmVyYXRvcjogcHJvcHMubmFtaW5nR2VuZXJhdG9yLFxuICAgIH0pO1xuXG4gICAgLy8g5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6aXG4gICAgdGhpcy5zZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk7XG5cbiAgICAvLyDjgrnjgr/jg4Pjgq/lh7rliptcbiAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcblxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIHRoaXMuYWRkU3RhY2tUYWdzKCk7XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIE9wZXJhdGlvbnNTdGFja+WIneacn+WMluWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqOODl+ODreODkeODhuOCo+ioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk6IHZvaWQge1xuICAgIC8vIENsb3VkV2F0Y2jjg4Djg4Pjgrfjg6Xjg5zjg7zjg4lVUkzjga7oqK3lrprvvIjlrZjlnKjjgZnjgovloLTlkIjvvIlcbiAgICBpZiAodGhpcy5tb25pdG9yaW5nLm91dHB1dHM/LmRhc2hib2FyZFVybCkge1xuICAgICAgdGhpcy5kYXNoYm9hcmRVcmwgPSB0aGlzLm1vbml0b3Jpbmcub3V0cHV0cy5kYXNoYm9hcmRVcmw7XG4gICAgfVxuXG4gICAgLy8gU05T44OI44OU44OD44KvQVJO44Gu6Kit5a6a77yI5a2Y5Zyo44GZ44KL5aC05ZCI77yJXG4gICAgaWYgKHRoaXMubW9uaXRvcmluZy5vdXRwdXRzPy5zbnNUb3BpY3MpIHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMubW9uaXRvcmluZy5vdXRwdXRzLnNuc1RvcGljcykuZm9yRWFjaCgoW25hbWUsIHRvcGljXSkgPT4ge1xuICAgICAgICBpZiAodG9waWMgJiYgdHlwZW9mIHRvcGljID09PSAnb2JqZWN0JyAmJiAndG9waWNBcm4nIGluIHRvcGljKSB7XG4gICAgICAgICAgdGhpcy5zbnNUb3BpY0FybnNbbmFtZV0gPSB0b3BpYy50b3BpY0FybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ/CflJcg5LuW44K544K/44OD44Kv5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6a5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv5Ye65Yqb5L2c5oiQ77yI5YCL5Yil44OH44OX44Ot44Kk5a++5b+c77yJXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgLy8gQ2xvdWRXYXRjaOODgOODg+OCt+ODpeODnOODvOODiVVSTOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLmRhc2hib2FyZFVybCkge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rhc2hib2FyZFVybCcsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuZGFzaGJvYXJkVXJsLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkV2F0Y2ggRGFzaGJvYXJkIFVSTCcsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1EYXNoYm9hcmRVcmxgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU05T44OI44OU44OD44KvQVJO5Ye65Yqb77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJXG4gICAgT2JqZWN0LmVudHJpZXModGhpcy5zbnNUb3BpY0FybnMpLmZvckVhY2goKFtuYW1lLCB0b3BpY0Fybl0pID0+IHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGBTbnNUb3BpYyR7bmFtZX1Bcm5gLCB7XG4gICAgICAgIHZhbHVlOiB0b3BpY0FybixcbiAgICAgICAgZGVzY3JpcHRpb246IGBTTlMgJHtuYW1lfSBUb3BpYyBBUk5gLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tU25zVG9waWMke25hbWV9QXJuYCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8g55uj6KaW57Wx5ZCI5Ye65Yqb77yI5a2Y5Zyo44GZ44KL5aC05ZCI44Gu44G/77yJXG4gICAgaWYgKHRoaXMubW9uaXRvcmluZy5vdXRwdXRzKSB7XG4gICAgICAvLyBYLVJheSBUcmFjZSBVUkxcbiAgICAgIGlmICh0aGlzLm1vbml0b3Jpbmcub3V0cHV0cy54cmF5VHJhY2VVcmwpIHtcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1hSYXlUcmFjZVVybCcsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5tb25pdG9yaW5nLm91dHB1dHMueHJheVRyYWNlVXJsLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnWC1SYXkgVHJhY2UgVVJMJyxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tWFJheVRyYWNlVXJsYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIExvZyBHcm91cCBOYW1lc1xuICAgICAgaWYgKHRoaXMubW9uaXRvcmluZy5vdXRwdXRzLmxvZ0dyb3VwTmFtZXMpIHtcbiAgICAgICAgT2JqZWN0LmVudHJpZXModGhpcy5tb25pdG9yaW5nLm91dHB1dHMubG9nR3JvdXBOYW1lcykuZm9yRWFjaCgoW25hbWUsIGxvZ0dyb3VwTmFtZV0pID0+IHtcbiAgICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgTG9nR3JvdXAke25hbWV9TmFtZWAsIHtcbiAgICAgICAgICAgIHZhbHVlOiBsb2dHcm91cE5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYENsb3VkV2F0Y2ggTG9nIEdyb3VwICR7bmFtZX0gTmFtZWAsXG4gICAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tTG9nR3JvdXAke25hbWV9TmFtZWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuue1seWQiOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLmVudGVycHJpc2Uub3V0cHV0cykge1xuICAgICAgLy8gQkkgRGFzaGJvYXJkIFVSTFxuICAgICAgaWYgKHRoaXMuZW50ZXJwcmlzZS5vdXRwdXRzLmJpRGFzaGJvYXJkVXJsKSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCaURhc2hib2FyZFVybCcsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5lbnRlcnByaXNlLm91dHB1dHMuYmlEYXNoYm9hcmRVcmwsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdCSSBBbmFseXRpY3MgRGFzaGJvYXJkIFVSTCcsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUJpRGFzaGJvYXJkVXJsYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE9yZ2FuaXphdGlvbiBNYW5hZ2VtZW50IENvbnNvbGUgVVJMXG4gICAgICBpZiAodGhpcy5lbnRlcnByaXNlLm91dHB1dHMub3JnYW5pemF0aW9uQ29uc29sZVVybCkge1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnT3JnYW5pemF0aW9uQ29uc29sZVVybCcsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5lbnRlcnByaXNlLm91dHB1dHMub3JnYW5pemF0aW9uQ29uc29sZVVybCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ09yZ2FuaXphdGlvbiBNYW5hZ2VtZW50IENvbnNvbGUgVVJMJyxcbiAgICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tT3JnYW5pemF0aW9uQ29uc29sZVVybGAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfwn5OkIE9wZXJhdGlvbnNTdGFja+WHuuWKm+WApOS9nOaIkOWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+OCv+OCsOioreWumu+8iOe1seS4gOOBleOCjOOBn+OCv+OCsOaIpueVpeS9v+eUqO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhZGRTdGFja1RhZ3MoKTogdm9pZCB7XG4gICAgLy8g57Wx5LiA44GV44KM44Gf44K/44Kw5oim55Wl44KS5L2/55SoXG4gICAgY29uc3QgdGFnZ2luZ0NvbmZpZyA9IFBlcm1pc3Npb25Bd2FyZVJBR1RhZ3MuZ2V0U3RhbmRhcmRDb25maWcoXG4gICAgICB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgncHJvamVjdE5hbWUnKSB8fCAncGVybWlzc2lvbi1hd2FyZS1yYWcnLFxuICAgICAgdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ2Vudmlyb25tZW50JykgfHwgJ2RldidcbiAgICApO1xuICAgIFxuICAgIC8vIOeSsOWig+WbuuacieOBruOCv+OCsOioreWumuOCkui/veWKoFxuICAgIGNvbnN0IGVudmlyb25tZW50Q29uZmlnID0gUGVybWlzc2lvbkF3YXJlUkFHVGFncy5nZXRFbnZpcm9ubWVudENvbmZpZyhcbiAgICAgIHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdlbnZpcm9ubWVudCcpIHx8ICdkZXYnXG4gICAgKTtcbiAgICBcbiAgICAvLyDjgr/jgrDmiKbnlaXjgpLpgannlKhcbiAgICBUYWdnaW5nU3RyYXRlZ3kuYXBwbHlUYWdzVG9TdGFjayh0aGlzLCB7XG4gICAgICAuLi50YWdnaW5nQ29uZmlnLFxuICAgICAgLi4uZW52aXJvbm1lbnRDb25maWcsXG4gICAgICBjdXN0b21UYWdzOiB7XG4gICAgICAgIC4uLnRhZ2dpbmdDb25maWcuY3VzdG9tVGFncyxcbiAgICAgICAgLi4uZW52aXJvbm1lbnRDb25maWcuY3VzdG9tVGFncyxcbiAgICAgICAgJ01vZHVsZSc6ICdNb25pdG9yaW5nK0VudGVycHJpc2UnLFxuICAgICAgICAnU3RhY2tUeXBlJzogJ0ludGVncmF0ZWQnLFxuICAgICAgICAnQXJjaGl0ZWN0dXJlJzogJ01vZHVsYXInLFxuICAgICAgICAnTW9uaXRvcmluZ1NlcnZpY2VzJzogJ0Nsb3VkV2F0Y2grWC1SYXkrU05TJyxcbiAgICAgICAgJ0VudGVycHJpc2VGZWF0dXJlcyc6ICdCSStPcmdhbml6YXRpb24rQWNjZXNzQ29udHJvbCcsXG4gICAgICAgICdJbmRpdmlkdWFsRGVwbG95U3VwcG9ydCc6ICdZZXMnXG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/Cfj7fvuI8gT3BlcmF0aW9uc1N0YWNr44K/44Kw6Kit5a6a5a6M5LqG77yI57Wx5LiA5oim55Wl5L2/55So77yJJyk7XG4gIH1cbn0iXX0=