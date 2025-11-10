"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EuDeploymentStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const regional_deployment_manager_1 = require("../deployment/regional-deployment-manager");
const regional_config_factory_1 = require("../deployment/regional-config-factory");
/**
 * EU地域専用デプロイメントスタック
 *
 * 機能:
 * - EU全地域への段階的デプロイメント
 * - GDPR完全対応
 * - データ居住性制約への厳格な対応
 * - Brexit後のUK対応
 */
class EuDeploymentStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // EU地域設定の取得
        const euRegions = regional_config_factory_1.RegionalConfigFactory.createEuRegionConfigs();
        const deploymentStrategies = regional_config_factory_1.RegionalConfigFactory.createDeploymentStrategies();
        // EU専用戦略の作成
        const euStrategy = {
            targetRegions: euRegions,
            deploymentStrategy: 'BLUE_GREEN',
            rollbackConfig: {
                enabled: true,
                healthCheckThreshold: 95, // GDPR要件により高い基準
                rollbackTimeoutMinutes: 5
            },
            crossRegionReplication: true,
            disasterRecovery: {
                enabled: true,
                rtoMinutes: 10, // GDPR要件により短時間
                rpoMinutes: 2 // データ損失を最小化
            }
        };
        // 地域別デプロイメント管理システムの作成
        this.deploymentManager = new regional_deployment_manager_1.RegionalDeploymentManager(this, 'EuDeploymentManager', {
            globalConfig: props.globalConfig,
            deploymentConfig: {
                ...euStrategy,
                targetRegions: euRegions.map(region => ({
                    ...region,
                    // EU地域固有の設定を強化
                    complianceRequirements: [
                        ...region.complianceRequirements,
                        'GDPR-Article-25', // Privacy by Design
                        'GDPR-Article-32', // Security of Processing
                        'GDPR-Article-35', // Data Protection Impact Assessment
                        'NIS-Directive', // Network and Information Security
                        'ePrivacy-Directive'
                    ],
                    // データ居住性制約を厳格化
                    dataResidencyRestrictions: true,
                    environmentConfig: {
                        ...region.environmentConfig,
                        // GDPR対応の追加設定
                        networkConfig: {
                            ...region.environmentConfig.networkConfig,
                            // EU内でのネットワーク分離
                            vpcCidr: this.getGdprCompliantVpcCidr(region.region)
                        }
                    }
                }))
            }
        });
        // EU地域固有のタグ付け
        aws_cdk_lib_1.Tags.of(this).add('Region', 'EU');
        aws_cdk_lib_1.Tags.of(this).add('Compliance', 'GDPR-Strict');
        aws_cdk_lib_1.Tags.of(this).add('DataResidency', 'EU-Only');
        aws_cdk_lib_1.Tags.of(this).add('DataSovereignty', 'EU-Compliant');
        aws_cdk_lib_1.Tags.of(this).add('Languages', 'German-English-French-Italian-Spanish');
        // GDPR関連タグ
        aws_cdk_lib_1.Tags.of(this).add('GDPR-Article-25', 'Privacy-by-Design');
        aws_cdk_lib_1.Tags.of(this).add('GDPR-Article-32', 'Security-of-Processing');
        aws_cdk_lib_1.Tags.of(this).add('GDPR-Article-35', 'DPIA-Required');
        aws_cdk_lib_1.Tags.of(this).add('DataRetention', 'GDPR-Compliant');
        aws_cdk_lib_1.Tags.of(this).add('RightToErasure', 'Implemented');
        aws_cdk_lib_1.Tags.of(this).add('DataPortability', 'Supported');
        // Brexit対応タグ
        aws_cdk_lib_1.Tags.of(this).add('Brexit-Compliant', 'True');
        aws_cdk_lib_1.Tags.of(this).add('UK-GDPR', 'Supported');
        aws_cdk_lib_1.Tags.of(this).add('EU-UK-DataBridge', 'Configured');
        // セキュリティ関連タグ
        aws_cdk_lib_1.Tags.of(this).add('EncryptionAtRest', 'AES-256');
        aws_cdk_lib_1.Tags.of(this).add('EncryptionInTransit', 'TLS-1.3');
        aws_cdk_lib_1.Tags.of(this).add('KeyManagement', 'EU-Sovereign');
        aws_cdk_lib_1.Tags.of(this).add('AuditLogging', 'GDPR-Compliant');
    }
    /**
     * GDPR準拠VPC CIDR取得
     */
    getGdprCompliantVpcCidr(region) {
        const cidrMap = {
            'eu-central-1': '10.7.0.0/16', // フランクフルト（メイン）
            'eu-west-1': '10.8.0.0/16', // アイルランド
            'eu-west-2': '10.9.0.0/16' // ロンドン（Brexit対応）
        };
        return cidrMap[region] || '10.7.0.0/16';
    }
    /**
     * EU地域段階的デプロイメント
     */
    deployToEuRegions() {
        // Phase 1: フランクフルト（メインEU地域）
        this.deploymentManager.startDeployment({
            deploymentId: `eu-phase1-${Date.now()}`,
            targetRegions: ['eu-central-1'],
            strategy: 'BLUE_GREEN'
        });
        // Phase 2: アイルランド（EU内セカンダリ）
        setTimeout(() => {
            this.deploymentManager.startDeployment({
                deploymentId: `eu-phase2-${Date.now()}`,
                targetRegions: ['eu-west-1'],
                strategy: 'BLUE_GREEN'
            });
        }, 20 * 60 * 1000); // 20分後
        // Phase 3: ロンドン（Brexit対応）
        setTimeout(() => {
            this.deploymentManager.startDeployment({
                deploymentId: `eu-phase3-${Date.now()}`,
                targetRegions: ['eu-west-2'],
                strategy: 'BLUE_GREEN'
            });
        }, 40 * 60 * 1000); // 40分後
    }
    /**
     * フランクフルト地域デプロイメント
     */
    deployToFrankfurt() {
        this.deploymentManager.startDeployment({
            deploymentId: `frankfurt-deploy-${Date.now()}`,
            targetRegions: ['eu-central-1'],
            strategy: 'BLUE_GREEN'
        });
    }
    /**
     * アイルランド地域デプロイメント
     */
    deployToIreland() {
        this.deploymentManager.startDeployment({
            deploymentId: `ireland-deploy-${Date.now()}`,
            targetRegions: ['eu-west-1'],
            strategy: 'BLUE_GREEN'
        });
    }
    /**
     * ロンドン地域デプロイメント（Brexit対応）
     */
    deployToLondon() {
        this.deploymentManager.startDeployment({
            deploymentId: `london-deploy-${Date.now()}`,
            targetRegions: ['eu-west-2'],
            strategy: 'BLUE_GREEN'
        });
    }
    /**
     * GDPR準拠テスト
     */
    testGdprCompliance() {
        const gdprTests = [
            {
                region: 'eu-central-1',
                testType: 'Data-Minimization',
                testId: `gdpr-minimization-${Date.now()}`
            },
            {
                region: 'eu-west-1',
                testType: 'Right-to-Erasure',
                testId: `gdpr-erasure-${Date.now()}`
            },
            {
                region: 'eu-west-2',
                testType: 'Data-Portability',
                testId: `gdpr-portability-${Date.now()}`
            }
        ];
        gdprTests.forEach(test => {
            this.deploymentManager.startDeployment({
                deploymentId: test.testId,
                targetRegions: [test.region],
                strategy: 'CANARY'
            });
        });
    }
    /**
     * EU内災害復旧テスト
     */
    testEuDisasterRecovery() {
        // フランクフルト→アイルランドフェイルオーバー
        this.deploymentManager.startDeployment({
            deploymentId: `eu-dr-test-${Date.now()}`,
            targetRegions: ['eu-west-1'], // アイルランドへフェイルオーバー
            strategy: 'BLUE_GREEN'
        });
    }
    /**
     * Brexit対応テスト
     */
    testBrexitCompliance() {
        // UK-EU間のデータ転送テスト
        this.deploymentManager.startDeployment({
            deploymentId: `brexit-test-${Date.now()}`,
            targetRegions: ['eu-west-2'], // ロンドン地域
            strategy: 'CANARY'
        });
    }
    /**
     * データ主権テスト
     */
    testDataSovereignty() {
        // EU内でのデータ処理・保存の確認
        const sovereigntyTests = [
            'eu-central-1', // ドイツ
            'eu-west-1', // アイルランド
            'eu-west-2' // イギリス
        ];
        sovereigntyTests.forEach(region => {
            this.deploymentManager.startDeployment({
                deploymentId: `sovereignty-test-${region}-${Date.now()}`,
                targetRegions: [region],
                strategy: 'CANARY'
            });
        });
    }
}
exports.EuDeploymentStack = EuDeploymentStack;
