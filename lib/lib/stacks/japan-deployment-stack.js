"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JapanDeploymentStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const regional_deployment_manager_1 = require("../deployment/regional-deployment-manager");
const regional_config_factory_1 = require("../deployment/regional-config-factory");
/**
 * 日本地域専用デプロイメントスタック
 *
 * 機能:
 * - 東京・大阪地域への最適化されたデプロイメント
 * - 日本の法規制要件への完全対応
 * - 災害復旧機能（東京⇔大阪）
 * - FISC・個人情報保護法対応
 */
class JapanDeploymentStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // 日本地域設定の取得
        const japanRegions = regional_config_factory_1.RegionalConfigFactory.createJapanRegionConfigs();
        const deploymentStrategies = regional_config_factory_1.RegionalConfigFactory.createDeploymentStrategies();
        const japanStrategy = deploymentStrategies.japanOnly;
        // 地域別デプロイメント管理システムの作成
        this.deploymentManager = new regional_deployment_manager_1.RegionalDeploymentManager(this, 'JapanDeploymentManager', {
            globalConfig: props.globalConfig,
            deploymentConfig: {
                ...japanStrategy,
                // 日本特有の設定を追加
                targetRegions: japanRegions.map(region => ({
                    ...region,
                    // 日本の法規制要件を強化
                    complianceRequirements: [
                        ...region.complianceRequirements,
                        'Banking-Act-Japan',
                        'Financial-Instruments-Exchange-Act',
                        'Act-on-Protection-of-Personal-Information'
                    ]
                }))
            }
        });
        // 日本地域固有のタグ付け
        aws_cdk_lib_1.Tags.of(this).add('Region', 'Japan');
        aws_cdk_lib_1.Tags.of(this).add('Compliance', 'FISC-PDPA-Japan');
        aws_cdk_lib_1.Tags.of(this).add('DataResidency', 'Japan-Only');
        aws_cdk_lib_1.Tags.of(this).add('DisasterRecovery', 'Tokyo-Osaka');
        aws_cdk_lib_1.Tags.of(this).add('Language', 'Japanese');
        // 日本の営業時間に合わせたメンテナンス設定
        aws_cdk_lib_1.Tags.of(this).add('MaintenanceWindow', 'JST-02:00-04:00');
        aws_cdk_lib_1.Tags.of(this).add('BusinessHours', 'JST-09:00-18:00');
        // コンプライアンス関連タグ
        aws_cdk_lib_1.Tags.of(this).add('DataClassification', 'Confidential');
        aws_cdk_lib_1.Tags.of(this).add('RetentionPeriod', '7-Years');
        aws_cdk_lib_1.Tags.of(this).add('EncryptionRequired', 'True');
        aws_cdk_lib_1.Tags.of(this).add('AuditRequired', 'True');
    }
    /**
     * 東京地域へのデプロイメント開始
     */
    deployToTokyo() {
        this.deploymentManager.startDeployment({
            deploymentId: `tokyo-deploy-${Date.now()}`,
            targetRegions: ['ap-northeast-1'],
            strategy: 'BLUE_GREEN'
        });
    }
    /**
     * 大阪地域へのデプロイメント開始
     */
    deployToOsaka() {
        this.deploymentManager.startDeployment({
            deploymentId: `osaka-deploy-${Date.now()}`,
            targetRegions: ['ap-northeast-3'],
            strategy: 'BLUE_GREEN'
        });
    }
    /**
     * 東京・大阪同時デプロイメント
     */
    deployToJapanRegions() {
        this.deploymentManager.startDeployment({
            deploymentId: `japan-deploy-${Date.now()}`,
            targetRegions: ['ap-northeast-1', 'ap-northeast-3'],
            strategy: 'BLUE_GREEN'
        });
    }
    /**
     * 災害復旧テスト実行
     */
    testDisasterRecovery() {
        // 東京→大阪フェイルオーバーテスト
        this.deploymentManager.startDeployment({
            deploymentId: `dr-test-${Date.now()}`,
            targetRegions: ['ap-northeast-3'], // 大阪のみ
            strategy: 'BLUE_GREEN'
        });
    }
}
exports.JapanDeploymentStack = JapanDeploymentStack;
