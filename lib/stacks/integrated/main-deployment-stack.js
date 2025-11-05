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
class MainDeploymentStack extends cdk.Stack {
    // 統合スタックのインスタンス
    securityStack;
    networkingStack;
    dataStack;
    embeddingStack;
    webAppStack;
    operationsStack;
    advancedPermissionStack;
    // デプロイメント情報
    deploymentInfo;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { config, securityConfig, networkingConfig, storageConfig, databaseConfig, computeConfig, aiConfig, apiConfig, monitoringConfig, enterpriseConfig, } = props;
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
                storageConfig,
                databaseConfig,
                projectName: config.projectName,
                environment: config.environment,
                vpcId: this.networkingStack?.vpc.vpcId,
                privateSubnetIds: this.networkingStack?.privateSubnets.map(subnet => subnet.subnetId),
                securityGroupIds: this.networkingStack ? Object.values(this.networkingStack.securityGroups).map(sg => sg.securityGroupId) : undefined,
                kmsKeyArn: this.securityStack?.kmsKey.keyArn,
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
                monitoringConfig,
                enterpriseConfig,
                projectName: config.projectName,
                environment: config.environment,
                lambdaFunctionArns: this.embeddingStack ? Object.values(this.embeddingStack.lambdaFunctions).map(func => func.functionArn) : undefined,
                apiGatewayId: this.webAppStack?.apiGateway.restApiId,
                cloudFrontDistributionId: this.webAppStack?.cloudFrontDistribution.distributionId,
                dynamoDbTableArns: this.dataStack ? Object.values(this.dataStack.dynamoDbTables).map(table => table.tableArn) : undefined,
                s3BucketArns: this.dataStack ? Object.values(this.dataStack.s3Buckets).map(bucket => bucket.bucketArn) : undefined,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1kZXBsb3ltZW50LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1kZXBsb3ltZW50LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7R0FLRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxpREFBbUM7QUFFbkMsbUNBVWlCO0FBRWpCLGFBQWE7QUFDYiwyRUFBc0U7QUFnQ3RFLE1BQWEsbUJBQW9CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDaEQsZ0JBQWdCO0lBQ0EsYUFBYSxDQUFpQjtJQUM5QixlQUFlLENBQW1CO0lBQ2xDLFNBQVMsQ0FBYTtJQUN0QixjQUFjLENBQWtCO0lBQ2hDLFdBQVcsQ0FBZTtJQUMxQixlQUFlLENBQW1CO0lBQ2xDLHVCQUF1QixDQUEyQjtJQUVsRSxZQUFZO0lBQ0ksY0FBYyxDQUs1QjtJQUVGLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBK0I7UUFDdkUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUNKLE1BQU0sRUFDTixjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLGFBQWEsRUFDYixjQUFjLEVBQ2QsYUFBYSxFQUNiLFFBQVEsRUFDUixTQUFTLEVBQ1QsZ0JBQWdCLEVBQ2hCLGdCQUFnQixHQUNqQixHQUFHLEtBQUssQ0FBQztRQUVWLE1BQU0sY0FBYyxHQUFhLEVBQUUsQ0FBQztRQUNwQyxNQUFNLGFBQWEsR0FBYSxFQUFFLENBQUM7UUFFbkMseUJBQXlCO1FBQ3pCLElBQUksTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxxQkFBYSxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7Z0JBQzVELE1BQU0sRUFBRSxjQUFjO2dCQUN0QixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7Z0JBQy9CLFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVzthQUNo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QUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVTthQUMxRDtTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFwWEQsa0RBb1hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjg6HjgqTjg7PntbHlkIjjg4fjg5fjg63jgqTjg6Hjg7Pjg4jjgrnjgr/jg4Pjgq9cbiAqIFxuICogNuOBpOOBrue1seWQiOOCueOCv+ODg+OCr+OCkuS+neWtmOmWouS/guOBq+WfuuOBpeOBhOOBpuautemajueahOOBq+ODh+ODl+ODreOCpFxuICog6Kit5a6a44Gu5LiA5YWD566h55CG44Go55Kw5aKD5Yil44OH44OX44Ot44Kk44Oh44Oz44OI5a++5b+cXG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHtcbiAgU2VjdXJpdHlTdGFjayxcbiAgTmV0d29ya2luZ1N0YWNrLFxuICBEYXRhU3RhY2ssXG4gIEVtYmVkZGluZ1N0YWNrLFxuICBXZWJBcHBTdGFjayxcbiAgT3BlcmF0aW9uc1N0YWNrLFxuICBJbnRlZ3JhdGVkU3RhY2tzQ29uZmlnLFxuICBERVBMT1lNRU5UX09SREVSLFxuICBTVEFDS19ERVBFTkRFTkNJRVMsXG59IGZyb20gJy4vaW5kZXgnO1xuXG4vLyDpq5jluqbmqKnpmZDliLblvqHjgrnjgr/jg4Pjgq9cbmltcG9ydCB7IEFkdmFuY2VkUGVybWlzc2lvblN0YWNrIH0gZnJvbSAnLi9hZHZhbmNlZC1wZXJtaXNzaW9uLXN0YWNrJztcblxuLy8g6Kit5a6a44Kk44Oz44K/44O844OV44Kn44O844K544Gu44Kk44Oz44Od44O844OIXG5pbXBvcnQgeyBTZWN1cml0eUNvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvc2VjdXJpdHkvaW50ZXJmYWNlcy9zZWN1cml0eS1jb25maWcnO1xuaW1wb3J0IHsgTmV0d29ya2luZ0NvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvbmV0d29ya2luZy9pbnRlcmZhY2VzL25ldHdvcmtpbmctY29uZmlnJztcbmltcG9ydCB7IFN0b3JhZ2VDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL3N0b3JhZ2UvaW50ZXJmYWNlcy9zdG9yYWdlLWNvbmZpZyc7XG5pbXBvcnQgeyBEYXRhYmFzZUNvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvZGF0YWJhc2UvaW50ZXJmYWNlcy9kYXRhYmFzZS1jb25maWcnO1xuaW1wb3J0IHsgQ29tcHV0ZUNvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvY29tcHV0ZS9pbnRlcmZhY2VzL2NvbXB1dGUtY29uZmlnJztcbmltcG9ydCB7IEFpQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9haS9pbnRlcmZhY2VzL2FpLWNvbmZpZyc7XG5pbXBvcnQgeyBBcGlDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2FwaS9pbnRlcmZhY2VzL2FwaS1jb25maWcnO1xuaW1wb3J0IHsgTW9uaXRvcmluZ0NvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvbW9uaXRvcmluZy9pbnRlcmZhY2VzL21vbml0b3JpbmctY29uZmlnJztcbmltcG9ydCB7IEVudGVycHJpc2VDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2VudGVycHJpc2UvaW50ZXJmYWNlcy9lbnRlcnByaXNlLWNvbmZpZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWFpbkRlcGxveW1lbnRTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBjb25maWc6IEludGVncmF0ZWRTdGFja3NDb25maWc7XG4gIFxuICAvLyDlkITjg6Ljgrjjg6Xjg7zjg6vjga7oqbPntLDoqK3lrppcbiAgc2VjdXJpdHlDb25maWc6IFNlY3VyaXR5Q29uZmlnO1xuICBuZXR3b3JraW5nQ29uZmlnOiBOZXR3b3JraW5nQ29uZmlnO1xuICBzdG9yYWdlQ29uZmlnOiBTdG9yYWdlQ29uZmlnO1xuICBkYXRhYmFzZUNvbmZpZzogRGF0YWJhc2VDb25maWc7XG4gIGNvbXB1dGVDb25maWc6IENvbXB1dGVDb25maWc7XG4gIGFpQ29uZmlnOiBBaUNvbmZpZztcbiAgYXBpQ29uZmlnOiBBcGlDb25maWc7XG4gIG1vbml0b3JpbmdDb25maWc6IE1vbml0b3JpbmdDb25maWc7XG4gIGVudGVycHJpc2VDb25maWc6IEVudGVycHJpc2VDb25maWc7XG4gIFxuICAvLyDpq5jluqbmqKnpmZDliLblvqHoqK3lrppcbiAgZW5hYmxlQWR2YW5jZWRQZXJtaXNzaW9uQ29udHJvbD86IGJvb2xlYW47XG4gIG9wZW5zZWFyY2hFbmRwb2ludD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIE1haW5EZXBsb3ltZW50U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAvLyDntbHlkIjjgrnjgr/jg4Pjgq/jga7jgqTjg7Pjgrnjgr/jg7PjgrlcbiAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5U3RhY2s/OiBTZWN1cml0eVN0YWNrO1xuICBwdWJsaWMgcmVhZG9ubHkgbmV0d29ya2luZ1N0YWNrPzogTmV0d29ya2luZ1N0YWNrO1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YVN0YWNrPzogRGF0YVN0YWNrO1xuICBwdWJsaWMgcmVhZG9ubHkgZW1iZWRkaW5nU3RhY2s/OiBFbWJlZGRpbmdTdGFjaztcbiAgcHVibGljIHJlYWRvbmx5IHdlYkFwcFN0YWNrPzogV2ViQXBwU3RhY2s7XG4gIHB1YmxpYyByZWFkb25seSBvcGVyYXRpb25zU3RhY2s/OiBPcGVyYXRpb25zU3RhY2s7XG4gIHB1YmxpYyByZWFkb25seSBhZHZhbmNlZFBlcm1pc3Npb25TdGFjaz86IEFkdmFuY2VkUGVybWlzc2lvblN0YWNrO1xuXG4gIC8vIOODh+ODl+ODreOCpOODoeODs+ODiOaDheWgsVxuICBwdWJsaWMgcmVhZG9ubHkgZGVwbG95bWVudEluZm86IHtcbiAgICBkZXBsb3llZFN0YWNrczogc3RyaW5nW107XG4gICAgc2tpcHBlZFN0YWNrczogc3RyaW5nW107XG4gICAgdG90YWxEZXBsb3ltZW50VGltZTogc3RyaW5nO1xuICAgIGVzdGltYXRlZE1vbnRobHlDb3N0OiBzdHJpbmc7XG4gIH07XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IE1haW5EZXBsb3ltZW50U3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgeyBcbiAgICAgIGNvbmZpZyxcbiAgICAgIHNlY3VyaXR5Q29uZmlnLFxuICAgICAgbmV0d29ya2luZ0NvbmZpZyxcbiAgICAgIHN0b3JhZ2VDb25maWcsXG4gICAgICBkYXRhYmFzZUNvbmZpZyxcbiAgICAgIGNvbXB1dGVDb25maWcsXG4gICAgICBhaUNvbmZpZyxcbiAgICAgIGFwaUNvbmZpZyxcbiAgICAgIG1vbml0b3JpbmdDb25maWcsXG4gICAgICBlbnRlcnByaXNlQ29uZmlnLFxuICAgIH0gPSBwcm9wcztcblxuICAgIGNvbnN0IGRlcGxveWVkU3RhY2tzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHNraXBwZWRTdGFja3M6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyAxLiBTZWN1cml0eVN0YWNrIOOBruODh+ODl+ODreOCpFxuICAgIGlmIChjb25maWcuZW5hYmxlU2VjdXJpdHkpIHtcbiAgICAgIHRoaXMuc2VjdXJpdHlTdGFjayA9IG5ldyBTZWN1cml0eVN0YWNrKHRoaXMsICdTZWN1cml0eVN0YWNrJywge1xuICAgICAgICBjb25maWc6IHNlY3VyaXR5Q29uZmlnLFxuICAgICAgICBwcm9qZWN0TmFtZTogY29uZmlnLnByb2plY3ROYW1lLFxuICAgICAgICBlbnZpcm9ubWVudDogY29uZmlnLmVudmlyb25tZW50LFxuICAgICAgfSk7XG4gICAgICBkZXBsb3llZFN0YWNrcy5wdXNoKCdTZWN1cml0eVN0YWNrJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNraXBwZWRTdGFja3MucHVzaCgnU2VjdXJpdHlTdGFjaycpO1xuICAgIH1cblxuICAgIC8vIDIuIE5ldHdvcmtpbmdTdGFjayDjga7jg4fjg5fjg63jgqRcbiAgICBpZiAoY29uZmlnLmVuYWJsZU5ldHdvcmtpbmcpIHtcbiAgICAgIHRoaXMubmV0d29ya2luZ1N0YWNrID0gbmV3IE5ldHdvcmtpbmdTdGFjayh0aGlzLCAnTmV0d29ya2luZ1N0YWNrJywge1xuICAgICAgICBjb25maWc6IG5ldHdvcmtpbmdDb25maWcsXG4gICAgICAgIHByb2plY3ROYW1lOiBjb25maWcucHJvamVjdE5hbWUsXG4gICAgICAgIGVudmlyb25tZW50OiBjb25maWcuZW52aXJvbm1lbnQsXG4gICAgICB9KTtcblxuICAgICAgLy8gU2VjdXJpdHlTdGFjayDjgbjjga7kvp3lrZjplqLkv4LoqK3lrppcbiAgICAgIGlmICh0aGlzLnNlY3VyaXR5U3RhY2spIHtcbiAgICAgICAgdGhpcy5uZXR3b3JraW5nU3RhY2suYWRkRGVwZW5kZW5jeSh0aGlzLnNlY3VyaXR5U3RhY2spO1xuICAgICAgfVxuXG4gICAgICBkZXBsb3llZFN0YWNrcy5wdXNoKCdOZXR3b3JraW5nU3RhY2snKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2tpcHBlZFN0YWNrcy5wdXNoKCdOZXR3b3JraW5nU3RhY2snKTtcbiAgICB9XG5cbiAgICAvLyAzLiBEYXRhU3RhY2sg44Gu44OH44OX44Ot44KkXG4gICAgaWYgKGNvbmZpZy5lbmFibGVEYXRhKSB7XG4gICAgICB0aGlzLmRhdGFTdGFjayA9IG5ldyBEYXRhU3RhY2sodGhpcywgJ0RhdGFTdGFjaycsIHtcbiAgICAgICAgc3RvcmFnZUNvbmZpZyxcbiAgICAgICAgZGF0YWJhc2VDb25maWcsXG4gICAgICAgIHByb2plY3ROYW1lOiBjb25maWcucHJvamVjdE5hbWUsXG4gICAgICAgIGVudmlyb25tZW50OiBjb25maWcuZW52aXJvbm1lbnQsXG4gICAgICAgIHZwY0lkOiB0aGlzLm5ldHdvcmtpbmdTdGFjaz8udnBjLnZwY0lkLFxuICAgICAgICBwcml2YXRlU3VibmV0SWRzOiB0aGlzLm5ldHdvcmtpbmdTdGFjaz8ucHJpdmF0ZVN1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuc3VibmV0SWQpLFxuICAgICAgICBzZWN1cml0eUdyb3VwSWRzOiB0aGlzLm5ldHdvcmtpbmdTdGFjayA/IE9iamVjdC52YWx1ZXModGhpcy5uZXR3b3JraW5nU3RhY2suc2VjdXJpdHlHcm91cHMpLm1hcChzZyA9PiBzZy5zZWN1cml0eUdyb3VwSWQpIDogdW5kZWZpbmVkLFxuICAgICAgICBrbXNLZXlBcm46IHRoaXMuc2VjdXJpdHlTdGFjaz8ua21zS2V5LmtleUFybixcbiAgICAgIH0pO1xuXG4gICAgICAvLyDkvp3lrZjplqLkv4LoqK3lrppcbiAgICAgIGlmICh0aGlzLnNlY3VyaXR5U3RhY2spIHtcbiAgICAgICAgdGhpcy5kYXRhU3RhY2suYWRkRGVwZW5kZW5jeSh0aGlzLnNlY3VyaXR5U3RhY2spO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubmV0d29ya2luZ1N0YWNrKSB7XG4gICAgICAgIHRoaXMuZGF0YVN0YWNrLmFkZERlcGVuZGVuY3kodGhpcy5uZXR3b3JraW5nU3RhY2spO1xuICAgICAgfVxuXG4gICAgICBkZXBsb3llZFN0YWNrcy5wdXNoKCdEYXRhU3RhY2snKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2tpcHBlZFN0YWNrcy5wdXNoKCdEYXRhU3RhY2snKTtcbiAgICB9XG5cbiAgICAvLyA0LiBFbWJlZGRpbmdTdGFjayDjga7jg4fjg5fjg63jgqRcbiAgICBpZiAoY29uZmlnLmVuYWJsZUVtYmVkZGluZykge1xuICAgICAgdGhpcy5lbWJlZGRpbmdTdGFjayA9IG5ldyBFbWJlZGRpbmdTdGFjayh0aGlzLCAnRW1iZWRkaW5nU3RhY2snLCB7XG4gICAgICAgIGNvbXB1dGVDb25maWcsXG4gICAgICAgIGFpQ29uZmlnLFxuICAgICAgICBwcm9qZWN0TmFtZTogY29uZmlnLnByb2plY3ROYW1lLFxuICAgICAgICBlbnZpcm9ubWVudDogY29uZmlnLmVudmlyb25tZW50LFxuICAgICAgICB2cGNJZDogdGhpcy5uZXR3b3JraW5nU3RhY2s/LnZwYy52cGNJZCxcbiAgICAgICAgcHJpdmF0ZVN1Ym5ldElkczogdGhpcy5uZXR3b3JraW5nU3RhY2s/LnByaXZhdGVTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LnN1Ym5ldElkKSxcbiAgICAgICAgc2VjdXJpdHlHcm91cElkczogdGhpcy5uZXR3b3JraW5nU3RhY2sgPyBPYmplY3QudmFsdWVzKHRoaXMubmV0d29ya2luZ1N0YWNrLnNlY3VyaXR5R3JvdXBzKS5tYXAoc2cgPT4gc2cuc2VjdXJpdHlHcm91cElkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAga21zS2V5QXJuOiB0aGlzLnNlY3VyaXR5U3RhY2s/Lmttc0tleS5rZXlBcm4sXG4gICAgICAgIHMzQnVja2V0QXJuczogdGhpcy5kYXRhU3RhY2sgPyBPYmplY3QudmFsdWVzKHRoaXMuZGF0YVN0YWNrLnMzQnVja2V0cykubWFwKGJ1Y2tldCA9PiBidWNrZXQuYnVja2V0QXJuKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZHluYW1vRGJUYWJsZUFybnM6IHRoaXMuZGF0YVN0YWNrID8gT2JqZWN0LnZhbHVlcyh0aGlzLmRhdGFTdGFjay5keW5hbW9EYlRhYmxlcykubWFwKHRhYmxlID0+IHRhYmxlLnRhYmxlQXJuKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgb3BlblNlYXJjaENvbGxlY3Rpb25Bcm46IHRoaXMuZGF0YVN0YWNrPy5vcGVuU2VhcmNoQ29sbGVjdGlvbj8uYXR0ckFybixcbiAgICAgIH0pO1xuXG4gICAgICAvLyDkvp3lrZjplqLkv4LoqK3lrppcbiAgICAgIGlmICh0aGlzLnNlY3VyaXR5U3RhY2spIHtcbiAgICAgICAgdGhpcy5lbWJlZGRpbmdTdGFjay5hZGREZXBlbmRlbmN5KHRoaXMuc2VjdXJpdHlTdGFjayk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5uZXR3b3JraW5nU3RhY2spIHtcbiAgICAgICAgdGhpcy5lbWJlZGRpbmdTdGFjay5hZGREZXBlbmRlbmN5KHRoaXMubmV0d29ya2luZ1N0YWNrKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmRhdGFTdGFjaykge1xuICAgICAgICB0aGlzLmVtYmVkZGluZ1N0YWNrLmFkZERlcGVuZGVuY3kodGhpcy5kYXRhU3RhY2spO1xuICAgICAgfVxuXG4gICAgICBkZXBsb3llZFN0YWNrcy5wdXNoKCdFbWJlZGRpbmdTdGFjaycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBza2lwcGVkU3RhY2tzLnB1c2goJ0VtYmVkZGluZ1N0YWNrJyk7XG4gICAgfVxuXG4gICAgLy8gNS4gV2ViQXBwU3RhY2sg44Gu44OH44OX44Ot44KkXG4gICAgaWYgKGNvbmZpZy5lbmFibGVXZWJBcHApIHtcbiAgICAgIHRoaXMud2ViQXBwU3RhY2sgPSBuZXcgV2ViQXBwU3RhY2sodGhpcywgJ1dlYkFwcFN0YWNrJywge1xuICAgICAgICBhcGlDb25maWcsXG4gICAgICAgIHByb2plY3ROYW1lOiBjb25maWcucHJvamVjdE5hbWUsXG4gICAgICAgIGVudmlyb25tZW50OiBjb25maWcuZW52aXJvbm1lbnQsXG4gICAgICAgIGxhbWJkYUZ1bmN0aW9uQXJuczogdGhpcy5lbWJlZGRpbmdTdGFjayA/IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgICBPYmplY3QuZW50cmllcyh0aGlzLmVtYmVkZGluZ1N0YWNrLmxhbWJkYUZ1bmN0aW9ucykubWFwKChbbmFtZSwgZnVuY10pID0+IFtuYW1lLCBmdW5jLmZ1bmN0aW9uQXJuXSlcbiAgICAgICAgKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgd2FmV2ViQWNsQXJuOiB0aGlzLnNlY3VyaXR5U3RhY2s/LndhZldlYkFjbD8uYXR0ckFybixcbiAgICAgIH0pO1xuXG4gICAgICAvLyDkvp3lrZjplqLkv4LoqK3lrppcbiAgICAgIGlmICh0aGlzLnNlY3VyaXR5U3RhY2spIHtcbiAgICAgICAgdGhpcy53ZWJBcHBTdGFjay5hZGREZXBlbmRlbmN5KHRoaXMuc2VjdXJpdHlTdGFjayk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5uZXR3b3JraW5nU3RhY2spIHtcbiAgICAgICAgdGhpcy53ZWJBcHBTdGFjay5hZGREZXBlbmRlbmN5KHRoaXMubmV0d29ya2luZ1N0YWNrKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmVtYmVkZGluZ1N0YWNrKSB7XG4gICAgICAgIHRoaXMud2ViQXBwU3RhY2suYWRkRGVwZW5kZW5jeSh0aGlzLmVtYmVkZGluZ1N0YWNrKTtcbiAgICAgIH1cblxuICAgICAgZGVwbG95ZWRTdGFja3MucHVzaCgnV2ViQXBwU3RhY2snKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2tpcHBlZFN0YWNrcy5wdXNoKCdXZWJBcHBTdGFjaycpO1xuICAgIH1cblxuICAgIC8vIDYuIEFkdmFuY2VkUGVybWlzc2lvblN0YWNrIOOBruODh+ODl+ODreOCpFxuICAgIGlmIChwcm9wcy5lbmFibGVBZHZhbmNlZFBlcm1pc3Npb25Db250cm9sICYmIHByb3BzLm9wZW5zZWFyY2hFbmRwb2ludCkge1xuICAgICAgdGhpcy5hZHZhbmNlZFBlcm1pc3Npb25TdGFjayA9IG5ldyBBZHZhbmNlZFBlcm1pc3Npb25TdGFjayh0aGlzLCAnQWR2YW5jZWRQZXJtaXNzaW9uU3RhY2snLCB7XG4gICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICBlbnZpcm9ubWVudDogY29uZmlnLmVudmlyb25tZW50LFxuICAgICAgICBvcGVuc2VhcmNoRW5kcG9pbnQ6IHByb3BzLm9wZW5zZWFyY2hFbmRwb2ludCxcbiAgICAgICAga21zS2V5QXJuOiB0aGlzLnNlY3VyaXR5U3RhY2s/Lmttc0tleS5rZXlBcm4sXG4gICAgICAgIHZwY0lkOiB0aGlzLm5ldHdvcmtpbmdTdGFjaz8udnBjLnZwY0lkLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIOS+neWtmOmWouS/guioreWumlxuICAgICAgaWYgKHRoaXMuc2VjdXJpdHlTdGFjaykge1xuICAgICAgICB0aGlzLmFkdmFuY2VkUGVybWlzc2lvblN0YWNrLmFkZERlcGVuZGVuY3kodGhpcy5zZWN1cml0eVN0YWNrKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm5ldHdvcmtpbmdTdGFjaykge1xuICAgICAgICB0aGlzLmFkdmFuY2VkUGVybWlzc2lvblN0YWNrLmFkZERlcGVuZGVuY3kodGhpcy5uZXR3b3JraW5nU3RhY2spO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZGF0YVN0YWNrKSB7XG4gICAgICAgIHRoaXMuYWR2YW5jZWRQZXJtaXNzaW9uU3RhY2suYWRkRGVwZW5kZW5jeSh0aGlzLmRhdGFTdGFjayk7XG4gICAgICB9XG5cbiAgICAgIGRlcGxveWVkU3RhY2tzLnB1c2goJ0FkdmFuY2VkUGVybWlzc2lvblN0YWNrJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNraXBwZWRTdGFja3MucHVzaCgnQWR2YW5jZWRQZXJtaXNzaW9uU3RhY2snKTtcbiAgICB9XG5cbiAgICAvLyA3LiBPcGVyYXRpb25zU3RhY2sg44Gu44OH44OX44Ot44KkXG4gICAgaWYgKGNvbmZpZy5lbmFibGVPcGVyYXRpb25zKSB7XG4gICAgICB0aGlzLm9wZXJhdGlvbnNTdGFjayA9IG5ldyBPcGVyYXRpb25zU3RhY2sodGhpcywgJ09wZXJhdGlvbnNTdGFjaycsIHtcbiAgICAgICAgbW9uaXRvcmluZ0NvbmZpZyxcbiAgICAgICAgZW50ZXJwcmlzZUNvbmZpZyxcbiAgICAgICAgcHJvamVjdE5hbWU6IGNvbmZpZy5wcm9qZWN0TmFtZSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IGNvbmZpZy5lbnZpcm9ubWVudCxcbiAgICAgICAgbGFtYmRhRnVuY3Rpb25Bcm5zOiB0aGlzLmVtYmVkZGluZ1N0YWNrID8gT2JqZWN0LnZhbHVlcyh0aGlzLmVtYmVkZGluZ1N0YWNrLmxhbWJkYUZ1bmN0aW9ucykubWFwKGZ1bmMgPT4gZnVuYy5mdW5jdGlvbkFybikgOiB1bmRlZmluZWQsXG4gICAgICAgIGFwaUdhdGV3YXlJZDogdGhpcy53ZWJBcHBTdGFjaz8uYXBpR2F0ZXdheS5yZXN0QXBpSWQsXG4gICAgICAgIGNsb3VkRnJvbnREaXN0cmlidXRpb25JZDogdGhpcy53ZWJBcHBTdGFjaz8uY2xvdWRGcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZCxcbiAgICAgICAgZHluYW1vRGJUYWJsZUFybnM6IHRoaXMuZGF0YVN0YWNrID8gT2JqZWN0LnZhbHVlcyh0aGlzLmRhdGFTdGFjay5keW5hbW9EYlRhYmxlcykubWFwKHRhYmxlID0+IHRhYmxlLnRhYmxlQXJuKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgczNCdWNrZXRBcm5zOiB0aGlzLmRhdGFTdGFjayA/IE9iamVjdC52YWx1ZXModGhpcy5kYXRhU3RhY2suczNCdWNrZXRzKS5tYXAoYnVja2V0ID0+IGJ1Y2tldC5idWNrZXRBcm4pIDogdW5kZWZpbmVkLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIOS+neWtmOmWouS/guioreWumu+8iOWFqOOCueOCv+ODg+OCr+OBq+S+neWtmO+8iVxuICAgICAgaWYgKHRoaXMuc2VjdXJpdHlTdGFjaykge1xuICAgICAgICB0aGlzLm9wZXJhdGlvbnNTdGFjay5hZGREZXBlbmRlbmN5KHRoaXMuc2VjdXJpdHlTdGFjayk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5uZXR3b3JraW5nU3RhY2spIHtcbiAgICAgICAgdGhpcy5vcGVyYXRpb25zU3RhY2suYWRkRGVwZW5kZW5jeSh0aGlzLm5ldHdvcmtpbmdTdGFjayk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5kYXRhU3RhY2spIHtcbiAgICAgICAgdGhpcy5vcGVyYXRpb25zU3RhY2suYWRkRGVwZW5kZW5jeSh0aGlzLmRhdGFTdGFjayk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5lbWJlZGRpbmdTdGFjaykge1xuICAgICAgICB0aGlzLm9wZXJhdGlvbnNTdGFjay5hZGREZXBlbmRlbmN5KHRoaXMuZW1iZWRkaW5nU3RhY2spO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMud2ViQXBwU3RhY2spIHtcbiAgICAgICAgdGhpcy5vcGVyYXRpb25zU3RhY2suYWRkRGVwZW5kZW5jeSh0aGlzLndlYkFwcFN0YWNrKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmFkdmFuY2VkUGVybWlzc2lvblN0YWNrKSB7XG4gICAgICAgIHRoaXMub3BlcmF0aW9uc1N0YWNrLmFkZERlcGVuZGVuY3kodGhpcy5hZHZhbmNlZFBlcm1pc3Npb25TdGFjayk7XG4gICAgICB9XG5cbiAgICAgIGRlcGxveWVkU3RhY2tzLnB1c2goJ09wZXJhdGlvbnNTdGFjaycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBza2lwcGVkU3RhY2tzLnB1c2goJ09wZXJhdGlvbnNTdGFjaycpO1xuICAgIH1cblxuICAgIC8vIOODh+ODl+ODreOCpOODoeODs+ODiOaDheWgseOBruioreWumlxuICAgIHRoaXMuZGVwbG95bWVudEluZm8gPSB7XG4gICAgICBkZXBsb3llZFN0YWNrcyxcbiAgICAgIHNraXBwZWRTdGFja3MsXG4gICAgICB0b3RhbERlcGxveW1lbnRUaW1lOiB0aGlzLmNhbGN1bGF0ZURlcGxveW1lbnRUaW1lKGRlcGxveWVkU3RhY2tzKSxcbiAgICAgIGVzdGltYXRlZE1vbnRobHlDb3N0OiB0aGlzLmNhbGN1bGF0ZU1vbnRobHlDb3N0KGRlcGxveWVkU3RhY2tzKSxcbiAgICB9O1xuXG4gICAgLy8gQ2xvdWRGb3JtYXRpb27lh7rliptcbiAgICB0aGlzLmNyZWF0ZURlcGxveW1lbnRPdXRwdXRzKCk7XG5cbiAgICAvLyDjgrnjgr/jg4Pjgq/jg6zjg5njg6vjga7jgr/jgrDoqK3lrppcbiAgICB0aGlzLmFwcGx5U3RhY2tUYWdzKGNvbmZpZy5wcm9qZWN0TmFtZSwgY29uZmlnLmVudmlyb25tZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4fjg5fjg63jgqTjg6Hjg7Pjg4jmmYLplpPjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlRGVwbG95bWVudFRpbWUoZGVwbG95ZWRTdGFja3M6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICBjb25zdCB0aW1lTWFwOiB7IFtrZXk6IHN0cmluZ106IG51bWJlciB9ID0ge1xuICAgICAgU2VjdXJpdHlTdGFjazogNy41LFxuICAgICAgTmV0d29ya2luZ1N0YWNrOiAxMi41LFxuICAgICAgRGF0YVN0YWNrOiAyMi41LFxuICAgICAgRW1iZWRkaW5nU3RhY2s6IDE1LFxuICAgICAgV2ViQXBwU3RhY2s6IDIwLFxuICAgICAgQWR2YW5jZWRQZXJtaXNzaW9uU3RhY2s6IDgsXG4gICAgICBPcGVyYXRpb25zU3RhY2s6IDEwLFxuICAgIH07XG5cbiAgICBjb25zdCB0b3RhbE1pbnV0ZXMgPSBkZXBsb3llZFN0YWNrcy5yZWR1Y2UoKHRvdGFsLCBzdGFjaykgPT4gdG90YWwgKyAodGltZU1hcFtzdGFja10gfHwgMCksIDApO1xuICAgIHJldHVybiBgJHtNYXRoLnJvdW5kKHRvdGFsTWludXRlcyl9IG1pbnV0ZXNgO1xuICB9XG5cbiAgLyoqXG4gICAqIOaciOmhjeOCs+OCueODiOOBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVNb250aGx5Q29zdChkZXBsb3llZFN0YWNrczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvc3RNYXA6IHsgW2tleTogc3RyaW5nXTogbnVtYmVyIH0gPSB7XG4gICAgICBTZWN1cml0eVN0YWNrOiAyMCxcbiAgICAgIE5ldHdvcmtpbmdTdGFjazogNTAsXG4gICAgICBEYXRhU3RhY2s6IDMwMCxcbiAgICAgIEVtYmVkZGluZ1N0YWNrOiAxNTAsXG4gICAgICBXZWJBcHBTdGFjazogMTAwLFxuICAgICAgQWR2YW5jZWRQZXJtaXNzaW9uU3RhY2s6IDc1LFxuICAgICAgT3BlcmF0aW9uc1N0YWNrOiAzMCxcbiAgICB9O1xuXG4gICAgY29uc3QgdG90YWxDb3N0ID0gZGVwbG95ZWRTdGFja3MucmVkdWNlKCh0b3RhbCwgc3RhY2spID0+IHRvdGFsICsgKGNvc3RNYXBbc3RhY2tdIHx8IDApLCAwKTtcbiAgICByZXR1cm4gYCQke3RvdGFsQ29zdH0tJHtNYXRoLnJvdW5kKHRvdGFsQ29zdCAqIDEuNSl9IFVTRC9tb250aGA7XG4gIH1cblxuICAvKipcbiAgICog44OH44OX44Ot44Kk44Oh44Oz44OI5oOF5aCx44GuQ2xvdWRGb3JtYXRpb27lh7rliptcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRGVwbG95bWVudE91dHB1dHMoKTogdm9pZCB7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RlcGxveWVkU3RhY2tzJywge1xuICAgICAgdmFsdWU6IHRoaXMuZGVwbG95bWVudEluZm8uZGVwbG95ZWRTdGFja3Muam9pbignLCAnKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3VjY2Vzc2Z1bGx5IGRlcGxveWVkIHN0YWNrcycsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRGVwbG95ZWRTdGFja3NgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NraXBwZWRTdGFja3MnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5kZXBsb3ltZW50SW5mby5za2lwcGVkU3RhY2tzLmpvaW4oJywgJykgfHwgJ05vbmUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTa2lwcGVkIHN0YWNrcycsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tU2tpcHBlZFN0YWNrc2AsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVG90YWxEZXBsb3ltZW50VGltZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRlcGxveW1lbnRJbmZvLnRvdGFsRGVwbG95bWVudFRpbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RvdGFsIGRlcGxveW1lbnQgdGltZScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tVG90YWxEZXBsb3ltZW50VGltZWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRXN0aW1hdGVkTW9udGhseUNvc3QnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5kZXBsb3ltZW50SW5mby5lc3RpbWF0ZWRNb250aGx5Q29zdCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRXN0aW1hdGVkIG1vbnRobHkgY29zdCcsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tRXN0aW1hdGVkTW9udGhseUNvc3RgLFxuICAgIH0pO1xuXG4gICAgLy8g5Li76KaB44Ko44Oz44OJ44Od44Kk44Oz44OI5oOF5aCxXG4gICAgaWYgKHRoaXMud2ViQXBwU3RhY2spIHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXZWJzaXRlVXJsJywge1xuICAgICAgICB2YWx1ZTogYGh0dHBzOi8vJHt0aGlzLndlYkFwcFN0YWNrLmNsb3VkRnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dlYnNpdGUgVVJMJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVdlYnNpdGVVcmxgLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlVcmwnLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLndlYkFwcFN0YWNrLmFwaUdhdGV3YXkudXJsLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFVSTCcsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1BcGlVcmxgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3BlcmF0aW9uc1N0YWNrKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTW9uaXRvcmluZ0Rhc2hib2FyZFVybCcsIHtcbiAgICAgICAgdmFsdWU6IGBodHRwczovLyR7dGhpcy5yZWdpb259LmNvbnNvbGUuYXdzLmFtYXpvbi5jb20vY2xvdWR3YXRjaC9ob21lP3JlZ2lvbj0ke3RoaXMucmVnaW9ufSNkYXNoYm9hcmRzOm5hbWU9JHt0aGlzLm9wZXJhdGlvbnNTdGFjay5jbG91ZFdhdGNoRGFzaGJvYXJkLmRhc2hib2FyZE5hbWV9YCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDbG91ZFdhdGNoIERhc2hib2FyZCBVUkwnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tTW9uaXRvcmluZ0Rhc2hib2FyZFVybGAsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv44Os44OZ44Or44Gu44K/44Kw6Kit5a6aXG4gICAqL1xuICBwcml2YXRlIGFwcGx5U3RhY2tUYWdzKHByb2plY3ROYW1lOiBzdHJpbmcsIGVudmlyb25tZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1Byb2plY3QnLCBwcm9qZWN0TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50KTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1N0YWNrJywgJ01haW5EZXBsb3ltZW50U3RhY2snKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0NvbXBvbmVudCcsICdJbnRlZ3JhdGlvbicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRGVwbG95bWVudFR5cGUnLCAnSW50ZWdyYXRlZCcpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ29zdENlbnRlcicsIGAke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS1pbnRlZ3JhdGVkYCk7XG4gIH1cblxuICAvKipcbiAgICog44OH44OX44Ot44Kk44Oh44Oz44OI5oOF5aCx44Gu5Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgZ2V0RGVwbG95bWVudEluZm8oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVwbG95bWVudEluZm87XG4gIH1cblxuICAvKipcbiAgICog54m55a6a44Gu44K544K/44OD44Kv44GM5pyJ5Yq544GL44Gp44GG44GL44KS56K66KqNXG4gICAqL1xuICBwdWJsaWMgaXNTdGFja0VuYWJsZWQoc3RhY2tOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5kZXBsb3ltZW50SW5mby5kZXBsb3llZFN0YWNrcy5pbmNsdWRlcyhzdGFja05hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIOWFqOS9k+eahOOBquOCt+OCueODhuODoOaDheWgseOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldFN5c3RlbUluZm8oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb2plY3ROYW1lOiB0aGlzLnN0YWNrTmFtZSxcbiAgICAgIHJlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgICBhY2NvdW50OiB0aGlzLmFjY291bnQsXG4gICAgICBkZXBsb3ltZW50SW5mbzogdGhpcy5kZXBsb3ltZW50SW5mbyxcbiAgICAgIGVuZHBvaW50czoge1xuICAgICAgICB3ZWJzaXRlOiB0aGlzLndlYkFwcFN0YWNrID8gYGh0dHBzOi8vJHt0aGlzLndlYkFwcFN0YWNrLmNsb3VkRnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gIDogbnVsbCxcbiAgICAgICAgYXBpOiB0aGlzLndlYkFwcFN0YWNrPy5hcGlHYXRld2F5LnVybCB8fCBudWxsLFxuICAgICAgICBtb25pdG9yaW5nOiB0aGlzLm9wZXJhdGlvbnNTdGFjayA/IGBodHRwczovLyR7dGhpcy5yZWdpb259LmNvbnNvbGUuYXdzLmFtYXpvbi5jb20vY2xvdWR3YXRjaC9ob21lP3JlZ2lvbj0ke3RoaXMucmVnaW9ufSNkYXNoYm9hcmRzOm5hbWU9JHt0aGlzLm9wZXJhdGlvbnNTdGFjay5jbG91ZFdhdGNoRGFzaGJvYXJkLmRhc2hib2FyZE5hbWV9YCA6IG51bGwsXG4gICAgICB9LFxuICAgICAgcmVzb3VyY2VzOiB7XG4gICAgICAgIHNlY3VyaXR5OiB0aGlzLnNlY3VyaXR5U3RhY2sgPyAnRW5hYmxlZCcgOiAnRGlzYWJsZWQnLFxuICAgICAgICBuZXR3b3JraW5nOiB0aGlzLm5ldHdvcmtpbmdTdGFjayA/ICdFbmFibGVkJyA6ICdEaXNhYmxlZCcsXG4gICAgICAgIGRhdGE6IHRoaXMuZGF0YVN0YWNrID8gJ0VuYWJsZWQnIDogJ0Rpc2FibGVkJyxcbiAgICAgICAgZW1iZWRkaW5nOiB0aGlzLmVtYmVkZGluZ1N0YWNrID8gJ0VuYWJsZWQnIDogJ0Rpc2FibGVkJyxcbiAgICAgICAgd2ViYXBwOiB0aGlzLndlYkFwcFN0YWNrID8gJ0VuYWJsZWQnIDogJ0Rpc2FibGVkJyxcbiAgICAgICAgb3BlcmF0aW9uczogdGhpcy5vcGVyYXRpb25zU3RhY2sgPyAnRW5hYmxlZCcgOiAnRGlzYWJsZWQnLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG59Il19