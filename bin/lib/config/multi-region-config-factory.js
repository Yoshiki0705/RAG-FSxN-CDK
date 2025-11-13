"use strict";
/**
 * マルチリージョン設定ファクトリー
 *
 * 機能:
 * - リージョン別設定の一元管理
 * - 設定バリデーション
 * - 自動CIDR計算
 * - コンプライアンス要件チェック
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiRegionConfigFactory = void 0;
const multi_region_config_1 = require("./interfaces/multi-region-config");
const vpc_cidr_calculator_1 = require("./utilities/vpc-cidr-calculator");
// リージョン別設定インポート
const tokyo_config_1 = require("./environments/tokyo-config");
const osaka_config_1 = require("./environments/osaka-config");
const apac_config_1 = require("./environments/apac-config");
const eu_config_1 = require("./environments/eu-config");
const us_config_1 = require("./environments/us-config");
const sa_config_1 = require("./environments/sa-config");
/**
 * マルチリージョン設定ファクトリー
 */
class MultiRegionConfigFactory {
    /**
     * リージョン設定取得（文字列リージョンから）
     */
    static getRegionConfig(regionString) {
        const region = this.parseRegion(regionString);
        const config = this.getConfig(region);
        return {
            regionName: config.regionConfig.regionName,
            regionPrefix: config.regionConfig.regionPrefix,
        };
    }
    /**
     * 文字列からRegion enumに変換
     */
    static parseRegion(regionString) {
        const regionMap = {
            'ap-northeast-1': multi_region_config_1.Region.TOKYO,
            'ap-northeast-3': multi_region_config_1.Region.OSAKA,
            'ap-southeast-1': multi_region_config_1.Region.SINGAPORE,
            'ap-southeast-2': multi_region_config_1.Region.SYDNEY,
            'ap-south-1': multi_region_config_1.Region.MUMBAI,
            'ap-northeast-2': multi_region_config_1.Region.SEOUL,
            'eu-west-1': multi_region_config_1.Region.IRELAND,
            'eu-central-1': multi_region_config_1.Region.FRANKFURT,
            'eu-west-2': multi_region_config_1.Region.LONDON,
            'eu-west-3': multi_region_config_1.Region.PARIS,
            'us-east-1': multi_region_config_1.Region.VIRGINIA,
            'us-west-2': multi_region_config_1.Region.OREGON,
            'us-east-2': multi_region_config_1.Region.OHIO,
            'sa-east-1': multi_region_config_1.Region.SAO_PAULO,
        };
        const region = regionMap[regionString];
        if (!region) {
            throw new Error(`Unsupported region string: ${regionString}`);
        }
        return region;
    }
    /**
     * リージョン設定取得
     */
    static getConfig(region) {
        const config = this.REGION_CONFIGS[region];
        if (!config) {
            throw new Error(`Unsupported region: ${region}`);
        }
        // CIDR自動計算が有効な場合は計算実行
        if (config.regionConfig.vpcCidr.autoCalculate) {
            const calculatedCidr = vpc_cidr_calculator_1.VpcCidrCalculator.generateVpcCidr(region);
            return {
                ...config,
                networking: {
                    ...config.networking,
                    vpc: {
                        ...config.networking.vpc,
                        cidr: calculatedCidr,
                    },
                },
            };
        }
        return config;
    }
    /**
     * 利用可能リージョン一覧取得
     */
    static getAvailableRegions() {
        return Object.keys(this.REGION_CONFIGS);
    }
    /**
     * 地域別リージョン取得
     */
    static getRegionsByArea() {
        return {
            japan: [multi_region_config_1.Region.TOKYO, multi_region_config_1.Region.OSAKA],
            apac: [multi_region_config_1.Region.SINGAPORE, multi_region_config_1.Region.SYDNEY, multi_region_config_1.Region.MUMBAI, multi_region_config_1.Region.SEOUL],
            eu: [multi_region_config_1.Region.IRELAND, multi_region_config_1.Region.FRANKFURT, multi_region_config_1.Region.LONDON, multi_region_config_1.Region.PARIS],
            us: [multi_region_config_1.Region.VIRGINIA, multi_region_config_1.Region.OREGON, multi_region_config_1.Region.OHIO],
            southAmerica: [multi_region_config_1.Region.SAO_PAULO],
        };
    }
    /**
     * 設定バリデーション
     */
    static validateConfig(config) {
        const errors = [];
        const warnings = [];
        // 基本設定チェック
        if (!config.primaryRegion) {
            errors.push('Primary region is required');
        }
        if (!config.regionConfig) {
            errors.push('Region configuration is required');
        }
        // CIDR競合チェック
        const cidrs = [config.networking.vpc.cidr];
        if (config.secondaryRegion) {
            const secondaryConfig = this.getConfig(config.secondaryRegion);
            cidrs.push(secondaryConfig.networking.vpc.cidr);
        }
        if (vpc_cidr_calculator_1.VpcCidrCalculator.checkCidrConflicts(cidrs)) {
            errors.push('VPC CIDR conflicts detected');
        }
        // コンプライアンス要件チェック
        if (config.regionConfig.compliance.dataResidency && config.secondaryRegion) {
            const primaryArea = this.getRegionArea(config.primaryRegion);
            const secondaryArea = this.getRegionArea(config.secondaryRegion);
            if (primaryArea !== secondaryArea) {
                warnings.push('Cross-region data residency requirements may be violated');
            }
        }
        // 機能可用性チェック
        if (config.storage.fsx.enabled && !config.regionConfig.features.fsxOntap) {
            errors.push(`FSx ONTAP is not available in region: ${config.primaryRegion}`);
        }
        if (config.ai.bedrock.enabled && !config.regionConfig.features.bedrock) {
            errors.push(`Amazon Bedrock is not available in region: ${config.primaryRegion}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * リージョンの地域取得
     */
    static getRegionArea(region) {
        const regionsByArea = this.getRegionsByArea();
        for (const [area, regions] of Object.entries(regionsByArea)) {
            if (regions.includes(region)) {
                return area;
            }
        }
        return 'unknown';
    }
    /**
     * カスタム設定作成
     */
    static createCustomConfig(baseRegion, overrides) {
        const baseConfig = this.getConfig(baseRegion);
        return {
            ...baseConfig,
            ...overrides,
            regionConfig: {
                ...baseConfig.regionConfig,
                ...overrides.regionConfig,
            },
        };
    }
    /**
     * 災害復旧ペア設定取得
     */
    static getDisasterRecoveryPairs() {
        return {
            // 日本
            [multi_region_config_1.Region.TOKYO]: multi_region_config_1.Region.OSAKA,
            [multi_region_config_1.Region.OSAKA]: multi_region_config_1.Region.TOKYO,
            // APAC
            [multi_region_config_1.Region.SINGAPORE]: multi_region_config_1.Region.SYDNEY,
            [multi_region_config_1.Region.SYDNEY]: multi_region_config_1.Region.SINGAPORE,
            [multi_region_config_1.Region.MUMBAI]: undefined,
            [multi_region_config_1.Region.SEOUL]: undefined,
            // EU
            [multi_region_config_1.Region.IRELAND]: multi_region_config_1.Region.FRANKFURT,
            [multi_region_config_1.Region.FRANKFURT]: multi_region_config_1.Region.IRELAND,
            [multi_region_config_1.Region.LONDON]: undefined,
            [multi_region_config_1.Region.PARIS]: undefined,
            // US
            [multi_region_config_1.Region.VIRGINIA]: multi_region_config_1.Region.OREGON,
            [multi_region_config_1.Region.OREGON]: multi_region_config_1.Region.VIRGINIA,
            [multi_region_config_1.Region.OHIO]: undefined,
            // 南米
            [multi_region_config_1.Region.SAO_PAULO]: undefined,
        };
    }
    /**
     * コンプライアンス要件サマリー取得
     */
    static getComplianceSummary(region) {
        const config = this.getConfig(region);
        const laws = config.regionConfig.compliance.applicableLaws;
        return laws.map(law => {
            switch (law) {
                case 'PIPA_JP': return '個人情報保護法（日本）';
                case 'FISC': return 'FISC安全対策基準';
                case 'PDPA_SG': return 'PDPA（シンガポール）';
                case 'PRIVACY_ACT_AU': return 'Privacy Act（オーストラリア）';
                case 'DPDP_ACT_IN': return 'DPDP Act（インド）';
                case 'PIPA_KR': return 'PIPA（韓国）';
                case 'GDPR': return 'GDPR（EU一般データ保護規則）';
                case 'BDSG': return 'BDSG（ドイツ連邦データ保護法）';
                case 'UK_GDPR': return 'UK-GDPR（英国GDPR）';
                case 'SOX': return 'SOX法（サーベンス・オクスリー法）';
                case 'HIPAA': return 'HIPAA（医療保険の相互運用性と説明責任に関する法律）';
                case 'CCPA': return 'CCPA（カリフォルニア州消費者プライバシー法）';
                case 'LGPD': return 'LGPD（ブラジル一般データ保護法）';
                default: return law;
            }
        });
    }
}
exports.MultiRegionConfigFactory = MultiRegionConfigFactory;
MultiRegionConfigFactory.REGION_CONFIGS = {
    // 日本
    [multi_region_config_1.Region.TOKYO]: tokyo_config_1.TOKYO_MULTI_REGION_CONFIG,
    [multi_region_config_1.Region.OSAKA]: osaka_config_1.OSAKA_MULTI_REGION_CONFIG,
    // APAC
    [multi_region_config_1.Region.SINGAPORE]: apac_config_1.APAC_MULTI_REGION_CONFIG,
    [multi_region_config_1.Region.SYDNEY]: { ...apac_config_1.APAC_MULTI_REGION_CONFIG, primaryRegion: multi_region_config_1.Region.SYDNEY },
    [multi_region_config_1.Region.MUMBAI]: { ...apac_config_1.APAC_MULTI_REGION_CONFIG, primaryRegion: multi_region_config_1.Region.MUMBAI },
    [multi_region_config_1.Region.SEOUL]: { ...apac_config_1.APAC_MULTI_REGION_CONFIG, primaryRegion: multi_region_config_1.Region.SEOUL },
    // EU
    [multi_region_config_1.Region.IRELAND]: eu_config_1.EU_MULTI_REGION_CONFIG,
    [multi_region_config_1.Region.FRANKFURT]: { ...eu_config_1.EU_MULTI_REGION_CONFIG, primaryRegion: multi_region_config_1.Region.FRANKFURT },
    [multi_region_config_1.Region.LONDON]: { ...eu_config_1.EU_MULTI_REGION_CONFIG, primaryRegion: multi_region_config_1.Region.LONDON },
    [multi_region_config_1.Region.PARIS]: { ...eu_config_1.EU_MULTI_REGION_CONFIG, primaryRegion: multi_region_config_1.Region.PARIS },
    // US
    [multi_region_config_1.Region.VIRGINIA]: us_config_1.US_MULTI_REGION_CONFIG,
    [multi_region_config_1.Region.OREGON]: { ...us_config_1.US_MULTI_REGION_CONFIG, primaryRegion: multi_region_config_1.Region.OREGON },
    [multi_region_config_1.Region.OHIO]: { ...us_config_1.US_MULTI_REGION_CONFIG, primaryRegion: multi_region_config_1.Region.OHIO },
    // 南米
    [multi_region_config_1.Region.SAO_PAULO]: sa_config_1.SA_MULTI_REGION_CONFIG,
};
