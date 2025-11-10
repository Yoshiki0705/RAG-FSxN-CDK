"use strict";
/**
 * メイン統合デプロイメントスタック
 *
 * 6つの統合スタックを依存関係に基づいて段階的にデプロイ
 * 設定の一元管理と環境別デプロイメント対応
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
exports.MainDeploymentStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const index_1 = require("./index");
// 高度権限制御スタック
const advanced_permission_stack_1 = require("./advanced-permission-stack");
// タグ設定のインポート
const tagging_config_1 = require("../../config/tagging-config");
class MainDeploymentStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { config, securityConfig, networkingConfig, storageConfig, databaseConfig, computeConfig, aiConfig, apiConfig, monitoringConfig, enterpriseConfig, } = props;
        // コスト配布タグの設定
        const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(config.projectName, config.environment);
        // 環境固有のタグ設定をマージ
        const environmentConfig = tagging_config_1.PermissionAwareRAGTags.getEnvironmentConfig(config.environment);
        const mergedTaggingConfig = {
            ...taggingConfig,
            customTags: {
                ...taggingConfig.customTags,
                ...environmentConfig.customTags,
            },
        };
        // スタック全体にタグを適用
        tagging_config_1.TaggingStrategy.applyTagsToStack(this, mergedTaggingConfig);
        const deployedStacks = [];
        const skippedStacks = [];
        // 1. SecurityStack のデプロイ
        if (config.enableSecurity) {
            this.securityStack = new index_1.SecurityStack(this, 'SecurityStack', {
                config: securityConfig,
                projectName: config.projectName,
                environment: config.environment,
            });
            deployedStacks.push('SecurityStack');
        }
        else {
            skippedStacks.push('SecurityStack');
        }
        // 2. NetworkingStack のデプロイ
        if (config.enableNetworking) {
            this.networkingStack = new index_1.NetworkingStack(this, 'NetworkingStack', {
                config: networkingConfig,
                projectName: config.projectName,
                environment: config.environment,
            });
            // SecurityStack への依存関係設定
            if (this.securityStack) {
                this.networkingStack.addDependency(this.securityStack);
            }
            deployedStacks.push('NetworkingStack');
        }
        else {
            skippedStacks.push('NetworkingStack');
        }
        // 3. DataStack のデプロイ
        if (config.enableData) {
            this.dataStack = new index_1.DataStack(this, 'DataStack', {
                config: {
                    storage: storageConfig,
                    database: databaseConfig,
                },
                securityStack: this.securityStack,
                projectName: config.projectName,
                environment: config.environment,
            });
            // 依存関係設定
            if (this.securityStack) {
                this.dataStack.addDependency(this.securityStack);
            }
            if (this.networkingStack) {
                this.dataStack.addDependency(this.networkingStack);
            }
            deployedStacks.push('DataStack');
        }
        else {
            skippedStacks.push('DataStack');
        }
        // 4. EmbeddingStack のデプロイ
        if (config.enableEmbedding) {
            this.embeddingStack = new index_1.EmbeddingStack(this, 'EmbeddingStack', {
                computeConfig,
                aiConfig,
                projectName: config.projectName,
                environment: config.environment,
                vpcId: this.networkingStack?.vpc.vpcId,
                privateSubnetIds: this.networkingStack?.privateSubnets.map(subnet => subnet.subnetId),
                securityGroupIds: this.networkingStack ? Object.values(this.networkingStack.securityGroups).map(sg => sg.securityGroupId) : undefined,
                kmsKeyArn: this.securityStack?.kmsKey.keyArn,
                s3BucketArns: this.dataStack ? Object.values(this.dataStack.s3Buckets).map(bucket => bucket.bucketArn) : undefined,
                dynamoDbTableArns: this.dataStack ? Object.values(this.dataStack.dynamoDbTables).map(table => table.tableArn) : undefined,
                openSearchCollectionArn: this.dataStack?.openSearchCollection?.attrArn,
            });
            // 依存関係設定
            if (this.securityStack) {
                this.embeddingStack.addDependency(this.securityStack);
            }
            if (this.networkingStack) {
                this.embeddingStack.addDependency(this.networkingStack);
            }
            if (this.dataStack) {
                this.embeddingStack.addDependency(this.dataStack);
            }
            deployedStacks.push('EmbeddingStack');
        }
        else {
            skippedStacks.push('EmbeddingStack');
        }
        // 5. WebAppStack のデプロイ
        if (config.enableWebApp) {
            this.webAppStack = new index_1.WebAppStack(this, 'WebAppStack', {
                apiConfig,
                projectName: config.projectName,
                environment: config.environment,
                lambdaFunctionArns: this.embeddingStack ? Object.fromEntries(Object.entries(this.embeddingStack.lambdaFunctions).map(([name, func]) => [name, func.functionArn])) : undefined,
                wafWebAclArn: this.securityStack?.wafWebAcl?.attrArn,
            });
            // 依存関係設定
            if (this.securityStack) {
                this.webAppStack.addDependency(this.securityStack);
            }
            if (this.networkingStack) {
                this.webAppStack.addDependency(this.networkingStack);
            }
            if (this.embeddingStack) {
                this.webAppStack.addDependency(this.embeddingStack);
            }
            deployedStacks.push('WebAppStack');
        }
        else {
            skippedStacks.push('WebAppStack');
        }
        // 6. AdvancedPermissionStack のデプロイ
        if (props.enableAdvancedPermissionControl && props.opensearchEndpoint) {
            this.advancedPermissionStack = new advanced_permission_stack_1.AdvancedPermissionStack(this, 'AdvancedPermissionStack', {
                config: config,
                environment: config.environment,
                opensearchEndpoint: props.opensearchEndpoint,
                kmsKeyArn: this.securityStack?.kmsKey.keyArn,
                vpcId: this.networkingStack?.vpc.vpcId,
            });
            // 依存関係設定
            if (this.securityStack) {
                this.advancedPermissionStack.addDependency(this.securityStack);
            }
            if (this.networkingStack) {
                this.advancedPermissionStack.addDependency(this.networkingStack);
            }
            if (this.dataStack) {
                this.advancedPermissionStack.addDependency(this.dataStack);
            }
            deployedStacks.push('AdvancedPermissionStack');
        }
        else {
            skippedStacks.push('AdvancedPermissionStack');
        }
        // 7. OperationsStack のデプロイ
        if (config.enableOperations) {
            this.operationsStack = new index_1.OperationsStack(this, 'OperationsStack', {
                config: {
                    monitoring: monitoringConfig,
                    enterprise: enterpriseConfig,
                },
                securityStack: this.securityStack,
                dataStack: this.dataStack,
                embeddingStack: this.embeddingStack,
                webAppStack: this.webAppStack,
                projectName: config.projectName,
                environment: config.environment,
            });
            // 依存関係設定（全スタックに依存）
            if (this.securityStack) {
                this.operationsStack.addDependency(this.securityStack);
            }
            if (this.networkingStack) {
                this.operationsStack.addDependency(this.networkingStack);
            }
            if (this.dataStack) {
                this.operationsStack.addDependency(this.dataStack);
            }
            if (this.embeddingStack) {
                this.operationsStack.addDependency(this.embeddingStack);
            }
            if (this.webAppStack) {
                this.operationsStack.addDependency(this.webAppStack);
            }
            if (this.advancedPermissionStack) {
                this.operationsStack.addDependency(this.advancedPermissionStack);
            }
            deployedStacks.push('OperationsStack');
        }
        else {
            skippedStacks.push('OperationsStack');
        }
        // デプロイメント情報の設定
        this.deploymentInfo = {
            deployedStacks,
            skippedStacks,
            totalDeploymentTime: this.calculateDeploymentTime(deployedStacks),
            estimatedMonthlyCost: this.calculateMonthlyCost(deployedStacks),
        };
        // CloudFormation出力
        this.createDeploymentOutputs();
        // スタックレベルのタグ設定
        this.applyStackTags(config.projectName, config.environment);
    }
    /**
     * デプロイメント時間の計算
     */
    calculateDeploymentTime(deployedStacks) {
        const timeMap = {
            SecurityStack: 7.5,
            NetworkingStack: 12.5,
            DataStack: 22.5,
            EmbeddingStack: 15,
            WebAppStack: 20,
            AdvancedPermissionStack: 8,
            OperationsStack: 10,
        };
        const totalMinutes = deployedStacks.reduce((total, stack) => total + (timeMap[stack] || 0), 0);
        return `${Math.round(totalMinutes)} minutes`;
    }
    /**
     * 月額コストの計算
     */
    calculateMonthlyCost(deployedStacks) {
        const costMap = {
            SecurityStack: 20,
            NetworkingStack: 50,
            DataStack: 300,
            EmbeddingStack: 150,
            WebAppStack: 100,
            AdvancedPermissionStack: 75,
            OperationsStack: 30,
        };
        const totalCost = deployedStacks.reduce((total, stack) => total + (costMap[stack] || 0), 0);
        return `$${totalCost}-${Math.round(totalCost * 1.5)} USD/month`;
    }
    /**
     * デプロイメント情報のCloudFormation出力
     */
    createDeploymentOutputs() {
        new cdk.CfnOutput(this, 'DeployedStacks', {
            value: this.deploymentInfo.deployedStacks.join(', '),
            description: 'Successfully deployed stacks',
            exportName: `${this.stackName}-DeployedStacks`,
        });
        new cdk.CfnOutput(this, 'SkippedStacks', {
            value: this.deploymentInfo.skippedStacks.join(', ') || 'None',
            description: 'Skipped stacks',
            exportName: `${this.stackName}-SkippedStacks`,
        });
        new cdk.CfnOutput(this, 'TotalDeploymentTime', {
            value: this.deploymentInfo.totalDeploymentTime,
            description: 'Total deployment time',
            exportName: `${this.stackName}-TotalDeploymentTime`,
        });
        new cdk.CfnOutput(this, 'EstimatedMonthlyCost', {
            value: this.deploymentInfo.estimatedMonthlyCost,
            description: 'Estimated monthly cost',
            exportName: `${this.stackName}-EstimatedMonthlyCost`,
        });
        // 主要エンドポイント情報
        if (this.webAppStack) {
            new cdk.CfnOutput(this, 'WebsiteUrl', {
                value: `https://${this.webAppStack.cloudFrontDistribution.distributionDomainName}`,
                description: 'Website URL',
                exportName: `${this.stackName}-WebsiteUrl`,
            });
            new cdk.CfnOutput(this, 'ApiUrl', {
                value: this.webAppStack.apiGateway.url,
                description: 'API Gateway URL',
                exportName: `${this.stackName}-ApiUrl`,
            });
        }
        if (this.operationsStack) {
            new cdk.CfnOutput(this, 'MonitoringDashboardUrl', {
                value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.operationsStack.cloudWatchDashboard.dashboardName}`,
                description: 'CloudWatch Dashboard URL',
                exportName: `${this.stackName}-MonitoringDashboardUrl`,
            });
        }
    }
    /**
     * スタックレベルのタグ設定
     */
    applyStackTags(projectName, environment) {
        cdk.Tags.of(this).add('Project', projectName);
        cdk.Tags.of(this).add('Environment', environment);
        cdk.Tags.of(this).add('Stack', 'MainDeploymentStack');
        cdk.Tags.of(this).add('Component', 'Integration');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('DeploymentType', 'Integrated');
        cdk.Tags.of(this).add('CostCenter', `${projectName}-${environment}-integrated`);
    }
    /**
     * デプロイメント情報の取得
     */
    getDeploymentInfo() {
        return this.deploymentInfo;
    }
    /**
     * 特定のスタックが有効かどうかを確認
     */
    isStackEnabled(stackName) {
        return this.deploymentInfo.deployedStacks.includes(stackName);
    }
    /**
     * 全体的なシステム情報を取得
     */
    getSystemInfo() {
        return {
            projectName: this.stackName,
            region: this.region,
            account: this.account,
            deploymentInfo: this.deploymentInfo,
            endpoints: {
                website: this.webAppStack ? `https://${this.webAppStack.cloudFrontDistribution.distributionDomainName}` : null,
                api: this.webAppStack?.apiGateway.url || null,
                monitoring: this.operationsStack ? `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.operationsStack.cloudWatchDashboard.dashboardName}` : null,
            },
            resources: {
                security: this.securityStack ? 'Enabled' : 'Disabled',
                networking: this.networkingStack ? 'Enabled' : 'Disabled',
                data: this.dataStack ? 'Enabled' : 'Disabled',
                embedding: this.embeddingStack ? 'Enabled' : 'Disabled',
                webapp: this.webAppStack ? 'Enabled' : 'Disabled',
                operations: this.operationsStack ? 'Enabled' : 'Disabled',
            },
        };
    }
}
exports.MainDeploymentStack = MainDeploymentStack;
