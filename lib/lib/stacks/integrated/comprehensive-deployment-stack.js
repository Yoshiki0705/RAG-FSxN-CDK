"use strict";
/**
 * 包括的デプロイメントスタック
 *
 * 全てのCDKスタックを統合的にデプロイするためのマスタースタック
 * 依存関係を管理し、段階的なデプロイメントを実現
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
exports.ComprehensiveDeploymentStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
// 既存スタックのインポート
const security_stack_1 = require("../security-stack");
const networking_stack_1 = require("../networking-stack");
const data_stack_1 = require("../data-stack");
const embedding_stack_1 = require("../embedding-stack");
const webapp_stack_1 = require("../webapp-stack");
const operations_stack_1 = require("../operations-stack");
// リージョン別スタック
const japan_deployment_stack_1 = require("../japan-deployment-stack");
const us_deployment_stack_1 = require("../us-deployment-stack");
const eu_deployment_stack_1 = require("../eu-deployment-stack");
const apac_deployment_stack_1 = require("../apac-deployment-stack");
const south_america_deployment_stack_1 = require("../south-america-deployment-stack");
// 特殊スタック
const disaster_recovery_stack_1 = require("../disaster-recovery-stack");
const global_deployment_stack_1 = require("../global-deployment-stack");
// ルートレベルスタック
const fsxn_stack_1 = require("../../fsxn-stack");
const network_stack_1 = require("../../network-stack");
const minimal_production_stack_1 = require("../../minimal-production-stack");
class ComprehensiveDeploymentStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // 入力値の検証（セキュリティ対策）
        this.validateInputs(props);
        const { projectName, environment, deploymentConfig, regions } = props;
        const deployedStacks = [];
        const skippedStacks = [];
        const deploymentOrder = [];
        // Phase 1: セキュリティ基盤
        if (deploymentConfig.enableSecurity) {
            try {
                this.securityStack = new security_stack_1.SecurityStack(this, 'Security', {
                    config: props.securityConfig || this.getDefaultSecurityConfig(projectName, environment),
                    projectName,
                    environment,
                    env: { region: regions.primary },
                });
                deployedStacks.push('SecurityStack');
                deploymentOrder.push('Phase1-Security');
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`SecurityStack の作成に失敗しました: ${errorMessage}`);
            }
        }
        else {
            skippedStacks.push('SecurityStack');
        }
        // Phase 2: ネットワーク基盤
        if (deploymentConfig.enableNetworking) {
            this.networkingStack = new networking_stack_1.NetworkingStack(this, 'Networking', {
                env: { region: regions.primary },
            });
            // セキュリティスタックへの依存関係
            if (this.securityStack) {
                this.networkingStack.addDependency(this.securityStack);
            }
            deployedStacks.push('NetworkingStack');
            deploymentOrder.push('Phase2-Networking');
        }
        else {
            skippedStacks.push('NetworkingStack');
        }
        // 従来のネットワークスタック（互換性のため）
        if (deploymentConfig.enableNetworking) {
            this.networkStack = new network_stack_1.NetworkStack(this, 'Network', {
                env: { region: regions.primary },
            });
            if (this.networkingStack) {
                this.networkStack.addDependency(this.networkingStack);
            }
            deployedStacks.push('NetworkStack');
        }
        // Phase 3: データ・ストレージ
        if (deploymentConfig.enableData) {
            this.dataStack = new data_stack_1.DataStack(this, 'Data', {
                env: { region: regions.primary },
            });
            // 依存関係設定
            if (this.securityStack) {
                this.dataStack.addDependency(this.securityStack);
            }
            if (this.networkingStack) {
                this.dataStack.addDependency(this.networkingStack);
            }
            deployedStacks.push('DataStack');
            deploymentOrder.push('Phase3-Data');
        }
        else {
            skippedStacks.push('DataStack');
        }
        // FSxN スタック
        if (deploymentConfig.enableFSxN) {
            this.fsxnStack = new fsxn_stack_1.FSxNStack(this, 'FSxN', {
                env: { region: regions.primary },
            });
            if (this.networkStack) {
                this.fsxnStack.addDependency(this.networkStack);
            }
            deployedStacks.push('FSxNStack');
        }
        // Phase 4: Embedding・AI
        if (deploymentConfig.enableEmbedding) {
            this.embeddingStack = new embedding_stack_1.EmbeddingStack(this, 'Embedding', {
                env: { region: regions.primary },
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
            deploymentOrder.push('Phase4-Embedding');
        }
        else {
            skippedStacks.push('EmbeddingStack');
        }
        // Phase 5: WebApp・API
        if (deploymentConfig.enableWebApp) {
            this.webAppStack = new webapp_stack_1.WebAppStack(this, 'WebApp', {
                env: { region: regions.primary },
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
            deploymentOrder.push('Phase5-WebApp');
        }
        else {
            skippedStacks.push('WebAppStack');
        }
        // Phase 6: 運用・監視
        if (deploymentConfig.enableOperations) {
            this.operationsStack = new operations_stack_1.OperationsStack(this, 'Operations', {
                env: { region: regions.primary },
            });
            // 全スタックへの依存関係
            [this.securityStack, this.networkingStack, this.dataStack, this.embeddingStack, this.webAppStack]
                .filter(stack => stack)
                .forEach(stack => {
                if (stack && this.operationsStack) {
                    this.operationsStack.addDependency(stack);
                }
            });
            deployedStacks.push('OperationsStack');
            deploymentOrder.push('Phase6-Operations');
        }
        else {
            skippedStacks.push('OperationsStack');
        }
        // Phase 7: リージョン別デプロイメント
        if (deploymentConfig.enableJapan) {
            this.japanStack = new japan_deployment_stack_1.JapanDeploymentStack(this, 'Japan', {
                env: { region: 'ap-northeast-1' },
            });
            deployedStacks.push('JapanDeploymentStack');
            deploymentOrder.push('Phase7-Japan');
        }
        if (deploymentConfig.enableUS) {
            this.usStack = new us_deployment_stack_1.USDeploymentStack(this, 'US', {
                env: { region: 'us-east-1' },
            });
            deployedStacks.push('USDeploymentStack');
            deploymentOrder.push('Phase7-US');
        }
        if (deploymentConfig.enableEU) {
            this.euStack = new eu_deployment_stack_1.EUDeploymentStack(this, 'EU', {
                env: { region: 'eu-west-1' },
            });
            deployedStacks.push('EUDeploymentStack');
            deploymentOrder.push('Phase7-EU');
        }
        if (deploymentConfig.enableAPAC) {
            this.apacStack = new apac_deployment_stack_1.APACDeploymentStack(this, 'APAC', {
                env: { region: 'ap-southeast-1' },
            });
            deployedStacks.push('APACDeploymentStack');
            deploymentOrder.push('Phase7-APAC');
        }
        if (deploymentConfig.enableSouthAmerica) {
            this.southAmericaStack = new south_america_deployment_stack_1.SouthAmericaDeploymentStack(this, 'SouthAmerica', {
                env: { region: 'sa-east-1' },
            });
            deployedStacks.push('SouthAmericaDeploymentStack');
            deploymentOrder.push('Phase7-SouthAmerica');
        }
        // Phase 8: 特殊機能
        if (deploymentConfig.enableDisasterRecovery && regions.disaster) {
            this.disasterRecoveryStack = new disaster_recovery_stack_1.DisasterRecoveryStack(this, 'DisasterRecovery', {
                env: { region: regions.disaster },
            });
            deployedStacks.push('DisasterRecoveryStack');
            deploymentOrder.push('Phase8-DisasterRecovery');
        }
        if (deploymentConfig.enableGlobalDeployment) {
            this.globalStack = new global_deployment_stack_1.GlobalDeploymentStack(this, 'Global', {
                env: { region: regions.primary },
            });
            deployedStacks.push('GlobalDeploymentStack');
            deploymentOrder.push('Phase8-Global');
        }
        if (deploymentConfig.enableMinimalProduction) {
            this.minimalProductionStack = new minimal_production_stack_1.MinimalProductionStack(this, 'MinimalProduction', {
                env: { region: regions.primary },
            });
            deployedStacks.push('MinimalProductionStack');
            deploymentOrder.push('Phase8-MinimalProduction');
        }
        // デプロイメント情報の設定
        this.deploymentInfo = {
            deployedStacks,
            skippedStacks,
            totalStacks: deployedStacks.length + skippedStacks.length,
            deploymentOrder,
        };
        // CloudFormation出力
        this.createOutputs();
        // スタックレベルのタグ設定
        this.applyStackTags(projectName, environment);
    }
    /**
     * 入力値の検証（セキュリティ対策）
     */
    validateInputs(props) {
        const { projectName, environment, regions } = props;
        // プロジェクト名の検証
        if (!projectName || typeof projectName !== 'string') {
            throw new Error('プロジェクト名が設定されていません');
        }
        if (projectName.trim().length === 0) {
            throw new Error('プロジェクト名が空文字です');
        }
        if (projectName.length > 50) {
            throw new Error('プロジェクト名は50文字以内で設定してください');
        }
        // セキュリティ: 安全な文字のみ許可
        if (!/^[a-zA-Z0-9\-_]+$/.test(projectName)) {
            throw new Error('プロジェクト名に不正な文字が含まれています（英数字、ハイフン、アンダースコアのみ許可）');
        }
        // 環境名の検証
        const validEnvironments = ['dev', 'staging', 'prod', 'test'];
        if (!validEnvironments.includes(environment)) {
            throw new Error(`環境名は次のいずれかを指定してください: ${validEnvironments.join(', ')}`);
        }
        // リージョン設定の検証
        if (!regions.primary || typeof regions.primary !== 'string') {
            throw new Error('プライマリリージョンが設定されていません');
        }
        // AWSリージョン形式の検証
        const regionPattern = /^[a-z]{2}-[a-z]+-\d+$/;
        if (!regionPattern.test(regions.primary)) {
            throw new Error(`無効なリージョン形式です: ${regions.primary}`);
        }
        if (regions.secondary && !regionPattern.test(regions.secondary)) {
            throw new Error(`無効なセカンダリリージョン形式です: ${regions.secondary}`);
        }
        if (regions.disaster && !regionPattern.test(regions.disaster)) {
            throw new Error(`無効な災害復旧リージョン形式です: ${regions.disaster}`);
        }
    }
    /**
     * CloudFormation出力の作成
     */
    createOutputs() {
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
        new cdk.CfnOutput(this, 'TotalStacks', {
            value: this.deploymentInfo.totalStacks.toString(),
            description: 'Total number of stacks',
            exportName: `${this.stackName}-TotalStacks`,
        });
        new cdk.CfnOutput(this, 'DeploymentOrder', {
            value: this.deploymentInfo.deploymentOrder.join(' -> '),
            description: 'Deployment order phases',
            exportName: `${this.stackName}-DeploymentOrder`,
        });
    }
    /**
     * スタックレベルのタグ設定（セキュリティ対策付き）
     */
    applyStackTags(projectName, environment) {
        // タグ値のサニタイズ（セキュリティ対策）
        const sanitizedProjectName = this.sanitizeTagValue(projectName);
        const sanitizedEnvironment = this.sanitizeTagValue(environment);
        const tags = {
            Project: sanitizedProjectName,
            Environment: sanitizedEnvironment,
            Stack: 'ComprehensiveDeploymentStack',
            Component: 'MasterDeployment',
            ManagedBy: 'CDK',
            Architecture: 'Comprehensive',
            CostCenter: `${sanitizedProjectName}-${sanitizedEnvironment}-comprehensive`,
            CreatedAt: new Date().toISOString().split('T')[0],
            Version: '1.0.0'
        };
        // 一括でタグを適用
        Object.entries(tags).forEach(([key, value]) => {
            cdk.Tags.of(this).add(key, value);
        });
    }
    /**
     * タグ値のサニタイズ（セキュリティ対策）
     */
    sanitizeTagValue(value) {
        return value
            .replace(/[<>\"'&]/g, '') // XSS対策
            .substring(0, 256) // AWS タグ値の最大長制限
            .trim();
    }
    /**
     * デフォルトセキュリティ設定の取得
     */
    getDefaultSecurityConfig(projectName, environment) {
        return {
            kms: {
                enableKeyRotation: true,
                keySpec: 'SYMMETRIC_DEFAULT',
                keyUsage: 'ENCRYPT_DECRYPT',
            },
            waf: {
                enabled: true,
                scope: 'REGIONAL',
                rules: {
                    enableAWSManagedRules: true,
                    enableRateLimiting: true,
                    rateLimit: 2000,
                    enableGeoBlocking: false,
                    blockedCountries: [],
                },
            },
            cloudTrail: {
                enabled: true,
                s3BucketName: `${projectName}-${environment}-cloudtrail`,
                includeGlobalServiceEvents: true,
                isMultiRegionTrail: true,
                enableLogFileValidation: true,
            },
            tags: {
                SecurityLevel: 'High',
                EncryptionRequired: true,
                ComplianceFramework: 'SOC2',
                DataClassification: 'Confidential',
            },
        };
    }
    /**
     * デフォルトネットワーキング設定の取得
     */
    getDefaultNetworkingConfig() {
        return {
            vpcCidr: '10.0.0.0/16',
            maxAzs: 3,
            enablePublicSubnets: true,
            enablePrivateSubnets: true,
            enableIsolatedSubnets: true,
            enableNatGateway: true,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            enableFlowLogs: true,
            vpcEndpoints: {
                s3: true,
                dynamodb: true,
                lambda: true,
                opensearch: true,
            },
            securityGroups: {
                web: true,
                api: true,
                database: true,
                lambda: true,
            },
        };
    }
    /**
     * デプロイメント統計の取得
     */
    getDeploymentStats() {
        return {
            ...this.deploymentInfo,
            deploymentPhases: {
                'Phase1-Security': this.securityStack ? 'Deployed' : 'Skipped',
                'Phase2-Networking': this.networkingStack ? 'Deployed' : 'Skipped',
                'Phase3-Data': this.dataStack ? 'Deployed' : 'Skipped',
                'Phase4-Embedding': this.embeddingStack ? 'Deployed' : 'Skipped',
                'Phase5-WebApp': this.webAppStack ? 'Deployed' : 'Skipped',
                'Phase6-Operations': this.operationsStack ? 'Deployed' : 'Skipped',
                'Phase7-Regional': [
                    this.japanStack && 'Japan',
                    this.usStack && 'US',
                    this.euStack && 'EU',
                    this.apacStack && 'APAC',
                    this.southAmericaStack && 'SouthAmerica'
                ].filter(Boolean).join(', ') || 'None',
                'Phase8-Special': [
                    this.disasterRecoveryStack && 'DisasterRecovery',
                    this.globalStack && 'Global',
                    this.minimalProductionStack && 'MinimalProduction'
                ].filter(Boolean).join(', ') || 'None',
            },
        };
    }
    /**
     * システム情報の取得
     */
    getSystemInfo() {
        return {
            stackName: this.stackName,
            region: this.region,
            account: this.account,
            deploymentInfo: this.deploymentInfo,
            enabledComponents: {
                security: !!this.securityStack,
                networking: !!this.networkingStack,
                data: !!this.dataStack,
                embedding: !!this.embeddingStack,
                webapp: !!this.webAppStack,
                operations: !!this.operationsStack,
            },
            regionalDeployments: {
                japan: !!this.japanStack,
                us: !!this.usStack,
                eu: !!this.euStack,
                apac: !!this.apacStack,
                southAmerica: !!this.southAmericaStack,
            },
            specialFeatures: {
                disasterRecovery: !!this.disasterRecoveryStack,
                global: !!this.globalStack,
                fsxn: !!this.fsxnStack,
                minimalProduction: !!this.minimalProductionStack,
            },
        };
    }
    /**
     * セキュリティリソースの取得
     */
    getSecurityResources() {
        return {
            securityStack: this.securityStack,
            kmsKey: this.securityStack?.kmsKey || null,
            wafWebAcl: this.securityStack?.wafWebAcl || null,
        };
    }
    /**
     * ネットワークリソースの取得
     */
    getNetworkResources() {
        return {
            networkingStack: this.networkingStack,
            networkStack: this.networkStack,
            vpc: this.networkingStack?.vpc || null,
            publicSubnets: this.networkingStack?.publicSubnets || [],
            privateSubnets: this.networkingStack?.privateSubnets || [],
            isolatedSubnets: this.networkingStack?.isolatedSubnets || [],
            securityGroups: this.networkingStack?.securityGroups || {},
        };
    }
    /**
     * データリソースの取得
     */
    getDataResources() {
        return {
            dataStack: this.dataStack,
            fsxnStack: this.fsxnStack,
            s3Buckets: this.dataStack?.s3Buckets || {},
            dynamoDbTables: this.dataStack?.dynamoDbTables || {},
            openSearchCollection: this.dataStack?.openSearchCollection || null,
            fsxFileSystem: this.fsxnStack?.fsxFileSystem || null,
        };
    }
}
exports.ComprehensiveDeploymentStack = ComprehensiveDeploymentStack;
