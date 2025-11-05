"use strict";
/**
 * Configuration Loader
 * 環境別設定の動的読み込み機能
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
exports.loadMarkitdownConfig = loadMarkitdownConfig;
exports.loadEnvironmentConfig = loadEnvironmentConfig;
exports.validateMarkitdownConfig = validateMarkitdownConfig;
exports.updateProcessingStrategy = updateProcessingStrategy;
exports.updateMultipleProcessingStrategies = updateMultipleProcessingStrategies;
exports.generateProcessingMethodReport = generateProcessingMethodReport;
exports.generateMarkitdownConfigTemplate = generateMarkitdownConfigTemplate;
exports.getRegionalDefaults = getRegionalDefaults;
const tokyo_1 = require("./environments/tokyo");
const frankfurt_1 = require("./environments/frankfurt");
const virginia_1 = require("./environments/virginia");
const markitdown_config_1 = require("../types/markitdown-config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Markitdown設定を読み込む
 */
function loadMarkitdownConfig(environment) {
    try {
        // メイン設定ファイルを読み込み
        const configPath = path.join(__dirname, 'markitdown-config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        let markitdownConfig = config.markitdown || markitdown_config_1.DEFAULT_MARKITDOWN_CONFIG;
        // 環境別設定オーバーライドを適用
        if (environment) {
            const environmentOverrides = loadEnvironmentMarkitdownOverrides();
            const envConfig = environmentOverrides[environment];
            if (envConfig) {
                markitdownConfig = mergeMarkitdownConfig(markitdownConfig, envConfig);
            }
        }
        console.log(`✅ Markitdown設定を読み込みました (環境: ${environment || 'default'})`);
        return markitdownConfig;
    }
    catch (error) {
        console.warn(`⚠️ Markitdown設定の読み込みに失敗しました: ${error}`);
        console.log('デフォルト設定を使用します');
        return markitdown_config_1.DEFAULT_MARKITDOWN_CONFIG;
    }
}
/**
 * 環境別Markitdown設定オーバーライドを読み込む
 */
function loadEnvironmentMarkitdownOverrides() {
    try {
        const overridePath = path.join(__dirname, 'environments', 'markitdown-overrides.json');
        if (fs.existsSync(overridePath)) {
            const overrideData = fs.readFileSync(overridePath, 'utf8');
            return JSON.parse(overrideData);
        }
    }
    catch (error) {
        console.warn(`⚠️ 環境別Markitdown設定オーバーライドの読み込みに失敗: ${error}`);
    }
    return {};
}
/**
 * Markitdown設定をマージする
 */
function mergeMarkitdownConfig(baseConfig, override) {
    return {
        ...baseConfig,
        ...override,
        supportedFormats: {
            ...baseConfig.supportedFormats,
            ...(override.supportedFormats || {})
        },
        performance: {
            ...baseConfig.performance,
            ...(override.performance || {})
        },
        fallback: {
            ...baseConfig.fallback,
            ...(override.fallback || {})
        },
        security: {
            ...baseConfig.security,
            ...(override.security || {})
        },
        logging: {
            ...baseConfig.logging,
            ...(override.logging || {})
        },
        quality: {
            ...baseConfig.quality,
            ...(override.quality || {})
        }
    };
}
/**
 * 環境別設定を読み込む
 */
function loadEnvironmentConfig(environment, region, projectName) {
    console.log(`📋 Loading configuration for ${environment} environment in ${region}`);
    // 地域別のベース設定を取得
    let baseConfig;
    switch (region) {
        case 'ap-northeast-1': // 東京
        case 'ap-northeast-3': // 大阪
            baseConfig = tokyo_1.tokyoConfig;
            break;
        case 'eu-central-1': // フランクフルト
        case 'eu-west-1': // アイルランド
        case 'eu-west-2': // ロンドン
        case 'eu-west-3': // パリ
            baseConfig = frankfurt_1.frankfurtConfig;
            break;
        case 'us-east-1': // バージニア
        case 'us-east-2': // オハイオ
        case 'us-west-2': // オレゴン
            baseConfig = virginia_1.virginiaConfig;
            break;
        default:
            console.warn(`⚠️ Unknown region ${region}, using Tokyo config as default`);
            baseConfig = tokyo_1.tokyoConfig;
    }
    // Markitdown設定を読み込み
    const markitdownConfig = loadMarkitdownConfig(environment);
    // 環境固有の調整
    const config = {
        ...baseConfig,
        projectName,
        environment: environment,
        region,
        // 環境別の機能調整
        features: adjustFeaturesForEnvironment(baseConfig.features, environment, markitdownConfig),
        // コンプライアンス設定の自動マッピング
        compliance: {
            regulations: getComplianceForRegion(region),
            dataProtection: {
                encryptionAtRest: true,
                encryptionInTransit: true,
                dataClassification: true,
                accessLogging: true,
                dataRetention: {
                    defaultRetentionDays: 365,
                    personalDataRetentionDays: 365,
                    logRetentionDays: 365,
                    backupRetentionDays: 365
                }
            },
            auditLogging: true
        }
    };
    // 環境別の追加調整
    if (environment === 'dev') {
        // 開発環境では一部機能を無効化してコストを削減
        config.features.monitoring.xray = false;
        config.features.storage.backup = false;
        config.features.enterprise.multiTenant = false;
        config.features.enterprise.billing = false;
    }
    else if (environment === 'prod') {
        // 本番環境では全機能を有効化
        config.features.monitoring.xray = true;
        config.features.storage.backup = true;
        config.features.enterprise.multiTenant = true;
        config.features.enterprise.billing = true;
    }
    console.log(`✅ Configuration loaded successfully`);
    console.log(`   Project: ${config.projectName}`);
    console.log(`   Environment: ${config.environment}`);
    console.log(`   Region: ${config.region}`);
    console.log(`   Compliance: ${config.compliance.regulations.join(', ')}`);
    return config;
}
/**
 * 環境に応じた機能設定の調整
 */
function adjustFeaturesForEnvironment(baseFeatures, environment, markitdownConfig) {
    const features = { ...baseFeatures };
    // Markitdown設定を統合
    if (markitdownConfig) {
        features.ai = {
            ...features.ai,
            markitdown: markitdownConfig.enabled,
            config: markitdownConfig
        };
    }
    switch (environment) {
        case 'dev':
            // 開発環境: 基本機能のみ
            features.networking.loadBalancer = false;
            features.networking.cdn = false;
            features.security.waf = false;
            features.storage.backup = false;
            features.storage.lifecycle = false;
            features.database.rds = false;
            features.compute.ecs = false;
            features.compute.scaling = false;
            features.api.graphql = false;
            features.api.websocket = false;
            features.monitoring.xray = false;
            features.monitoring.alarms = false;
            features.enterprise.multiTenant = false;
            features.enterprise.billing = false;
            features.enterprise.compliance = false;
            features.enterprise.governance = false;
            break;
        case 'staging':
            // ステージング環境: 本番同等（エンタープライズ機能除く）
            features.networking.loadBalancer = true;
            features.networking.cdn = true;
            features.security.waf = true;
            features.storage.backup = true;
            features.storage.lifecycle = true;
            features.database.rds = false; // オプション
            features.compute.ecs = false; // オプション
            features.compute.scaling = true;
            features.api.graphql = false; // オプション
            features.api.websocket = false; // オプション
            features.monitoring.xray = true;
            features.monitoring.alarms = true;
            features.enterprise.multiTenant = false;
            features.enterprise.billing = false;
            features.enterprise.compliance = true;
            features.enterprise.governance = true;
            break;
        case 'prod':
            // 本番環境: 全機能有効
            features.networking.loadBalancer = true;
            features.networking.cdn = true;
            features.security.waf = true;
            features.storage.backup = true;
            features.storage.lifecycle = true;
            features.database.rds = true;
            features.compute.ecs = true;
            features.compute.scaling = true;
            features.api.graphql = true;
            features.api.websocket = true;
            features.monitoring.xray = true;
            features.monitoring.alarms = true;
            features.enterprise.multiTenant = true;
            features.enterprise.billing = true;
            features.enterprise.compliance = true;
            features.enterprise.governance = true;
            break;
        default:
            console.warn(`⚠️ Unknown environment ${environment}, using default settings`);
    }
    return features;
}
/**
 * Markitdown設定を検証する
 */
function validateMarkitdownConfig(config) {
    try {
        // 基本設定の検証
        if (typeof config.enabled !== 'boolean') {
            console.error('❌ Markitdown設定エラー: enabled は boolean である必要があります');
            return false;
        }
        // サポートされるファイル形式の検証
        if (!config.supportedFormats || typeof config.supportedFormats !== 'object') {
            console.error('❌ Markitdown設定エラー: supportedFormats が正しく設定されていません');
            return false;
        }
        // パフォーマンス設定の検証
        if (config.performance.maxFileSizeBytes <= 0) {
            console.error('❌ Markitdown設定エラー: maxFileSizeBytes は正の数である必要があります');
            return false;
        }
        if (config.performance.memoryLimitMB <= 0) {
            console.error('❌ Markitdown設定エラー: memoryLimitMB は正の数である必要があります');
            return false;
        }
        // タイムアウト設定の検証
        for (const [format, formatConfig] of Object.entries(config.supportedFormats)) {
            if (formatConfig.timeout <= 0) {
                console.error(`❌ Markitdown設定エラー: ${format} のタイムアウト値が無効です`);
                return false;
            }
        }
        console.log('✅ Markitdown設定の検証が完了しました');
        return true;
    }
    catch (error) {
        console.error(`❌ Markitdown設定の検証中にエラーが発生しました: ${error}`);
        return false;
    }
}
/**
 * 地域別のコンプライアンス規制を取得する（一時的な実装）
 */
function getComplianceForRegion(region) {
    switch (region) {
        case 'ap-northeast-1': // 東京
        case 'ap-northeast-3': // 大阪
            return ['FISC'];
        case 'eu-central-1': // フランクフルト
        case 'eu-west-1': // アイルランド
        case 'eu-west-2': // ロンドン
        case 'eu-west-3': // パリ
            return ['GDPR'];
        case 'us-east-1': // バージニア
        case 'us-east-2': // オハイオ
        case 'us-west-2': // オレゴン
            return ['SOX', 'HIPAA'];
        default:
            return ['GDPR']; // デフォルトはGDPR
    }
}
/**
 * ファイル形式の処理方法を動的に変更する
 */
function updateProcessingStrategy(config, format, strategy) {
    const updatedConfig = { ...config };
    if (updatedConfig.supportedFormats[format]) {
        updatedConfig.supportedFormats[format] = {
            ...updatedConfig.supportedFormats[format],
            processingStrategy: strategy,
            useMarkitdown: shouldEnableMarkitdown(strategy),
            useLangChain: shouldEnableLangChain(strategy),
            enableQualityComparison: strategy === 'both-compare'
        };
        console.log(`✅ ${format}の処理戦略を${strategy}に変更しました`);
    }
    else {
        console.warn(`⚠️ サポートされていないファイル形式: ${format}`);
    }
    return updatedConfig;
}
/**
 * 処理戦略に基づいてMarkitdownを有効にするかを決定
 */
function shouldEnableMarkitdown(strategy) {
    return ['markitdown-only', 'markitdown-first', 'both-compare', 'auto-select'].includes(strategy);
}
/**
 * 処理戦略に基づいてLangChainを有効にするかを決定
 */
function shouldEnableLangChain(strategy) {
    return ['langchain-only', 'langchain-first', 'both-compare', 'auto-select'].includes(strategy);
}
/**
 * 複数のファイル形式の処理方法を一括変更
 */
function updateMultipleProcessingStrategies(config, updates) {
    let updatedConfig = { ...config };
    for (const [format, strategy] of Object.entries(updates)) {
        updatedConfig = updateProcessingStrategy(updatedConfig, format, strategy);
    }
    console.log(`✅ ${Object.keys(updates).length}個のファイル形式の処理戦略を更新しました`);
    return updatedConfig;
}
/**
 * 処理方法の使用状況レポートを生成
 */
function generateProcessingMethodReport(config) {
    const details = Object.entries(config.supportedFormats).map(([format, formatConfig]) => ({
        format: format,
        strategy: formatConfig.processingStrategy,
        useMarkitdown: formatConfig.useMarkitdown,
        useLangChain: formatConfig.useLangChain,
        qualityComparison: formatConfig.enableQualityComparison || false
    }));
    const summary = {
        totalFormats: details.length,
        markitdownOnlyFormats: details.filter(d => d.useMarkitdown && !d.useLangChain).length,
        langchainOnlyFormats: details.filter(d => !d.useMarkitdown && d.useLangChain).length,
        hybridFormats: details.filter(d => d.useMarkitdown && d.useLangChain).length,
        qualityComparisonFormats: details.filter(d => d.qualityComparison).length
    };
    return { summary, details };
}
/**
 * Markitdown設定テンプレートを生成する
 */
function generateMarkitdownConfigTemplate() {
    console.log('📝 Markitdown設定テンプレートを生成しています...');
    const template = {
        ...markitdown_config_1.DEFAULT_MARKITDOWN_CONFIG,
        // テンプレート用のコメント付き設定
        supportedFormats: {
            docx: {
                enabled: true,
                timeout: 30,
                description: 'Microsoft Word文書 - 一般的なビジネス文書',
                processingStrategy: 'markitdown-first',
                useMarkitdown: true,
                useLangChain: true,
                enableQualityComparison: false
            },
            xlsx: {
                enabled: true,
                timeout: 45,
                description: 'Microsoft Excel文書 - スプレッドシートとデータ',
                processingStrategy: 'markitdown-first',
                useMarkitdown: true,
                useLangChain: true,
                enableQualityComparison: false
            },
            pptx: {
                enabled: true,
                timeout: 60,
                description: 'Microsoft PowerPoint文書 - プレゼンテーション',
                processingStrategy: 'markitdown-first',
                useMarkitdown: true,
                useLangChain: true,
                enableQualityComparison: false
            },
            pdf: {
                enabled: true,
                timeout: 120,
                ocr: true,
                description: 'PDF文書 - OCR機能でスキャン文書にも対応',
                processingStrategy: 'both-compare',
                useMarkitdown: true,
                useLangChain: true,
                enableQualityComparison: true
            },
            png: {
                enabled: false,
                timeout: 90,
                ocr: true,
                description: 'PNG画像 - 高品質画像、OCR必要時のみ有効化',
                processingStrategy: 'markitdown-only',
                useMarkitdown: true,
                useLangChain: false,
                enableQualityComparison: false
            },
            jpg: {
                enabled: false,
                timeout: 90,
                ocr: true,
                description: 'JPEG画像 - 一般的な画像形式、OCR必要時のみ有効化',
                processingStrategy: 'markitdown-only',
                useMarkitdown: true,
                useLangChain: false,
                enableQualityComparison: false
            },
            jpeg: {
                enabled: false,
                timeout: 90,
                ocr: true,
                description: 'JPEG画像 - 一般的な画像形式、OCR必要時のみ有効化',
                processingStrategy: 'markitdown-only',
                useMarkitdown: true,
                useLangChain: false,
                enableQualityComparison: false
            },
            gif: {
                enabled: false,
                timeout: 90,
                ocr: true,
                description: 'GIF画像 - アニメーション画像、OCR必要時のみ有効化',
                processingStrategy: 'markitdown-only',
                useMarkitdown: true,
                useLangChain: false,
                enableQualityComparison: false
            },
            html: {
                enabled: true,
                timeout: 30,
                description: 'HTML文書 - ウェブページとマークアップ',
                processingStrategy: 'langchain-first',
                useMarkitdown: true,
                useLangChain: true,
                enableQualityComparison: false
            },
            xml: {
                enabled: true,
                timeout: 30,
                description: 'XML文書 - 構造化データ',
                processingStrategy: 'langchain-first',
                useMarkitdown: true,
                useLangChain: true,
                enableQualityComparison: false
            },
            csv: {
                enabled: true,
                timeout: 15,
                description: 'CSV文書 - カンマ区切りデータ',
                processingStrategy: 'langchain-only',
                useMarkitdown: false,
                useLangChain: true,
                enableQualityComparison: false
            },
            tsv: {
                enabled: true,
                timeout: 15,
                description: 'TSV文書 - タブ区切りデータ',
                processingStrategy: 'langchain-only',
                useMarkitdown: false,
                useLangChain: true,
                enableQualityComparison: false
            }
        }
    };
    console.log('✅ Markitdown設定テンプレートが生成されました');
    return template;
}
/**
 * 地域別のデフォルト設定を取得
 */
function getRegionalDefaults(region) {
    return {
        region,
        compliance: {
            regulations: getComplianceForRegion(region),
            dataProtection: {
                encryptionAtRest: true,
                encryptionInTransit: true,
                dataClassification: true,
                accessLogging: true,
                dataRetention: {
                    defaultRetentionDays: 365,
                    personalDataRetentionDays: 365,
                    logRetentionDays: 365,
                    backupRetentionDays: 365
                }
            },
            auditLogging: true
        },
        // 地域別のデフォルト設定
        features: {
            networking: {
                vpc: true,
                loadBalancer: true,
                cdn: true,
                customDomain: undefined
            },
            security: {
                waf: true,
                cognito: true,
                encryption: true,
                compliance: true
            },
            storage: {
                fsx: true,
                s3: true,
                backup: true,
                lifecycle: true
            },
            database: {
                dynamodb: true,
                opensearch: true,
                rds: false, // オプション
                migration: true
            },
            compute: {
                lambda: true,
                ecs: false, // オプション
                scaling: true
            },
            api: {
                restApi: true,
                graphql: false, // オプション
                websocket: false, // オプション
                frontend: true
            },
            ai: {
                bedrock: true,
                embedding: true,
                rag: true,
                modelManagement: true
            },
            monitoring: {
                cloudwatch: true,
                xray: true,
                alarms: true,
                dashboards: true
            },
            enterprise: {
                multiTenant: false, // オプション
                billing: false, // オプション
                compliance: true,
                governance: true
            }
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLWxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbmZpZy1sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCSCxvREF5QkM7QUEwREQsc0RBbUZDO0FBNEZELDREQXVDQztBQTJCRCw0REFzQkM7QUFtQkQsZ0ZBWUM7QUFLRCx3RUFpQ0M7QUFLRCw0RUE2SEM7QUFLRCxrREE0RUM7QUFwb0JELGdEQUFtRDtBQUNuRCx3REFBMkQ7QUFDM0Qsc0RBQXlEO0FBR3pELGtFQU1vQztBQUNwQyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCOztHQUVHO0FBQ0gsU0FBZ0Isb0JBQW9CLENBQUMsV0FBb0I7SUFDdkQsSUFBSSxDQUFDO1FBQ0gsaUJBQWlCO1FBQ2pCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFDbEUsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUV0QyxJQUFJLGdCQUFnQixHQUFxQixNQUFNLENBQUMsVUFBVSxJQUFJLDZDQUF5QixDQUFDO1FBRXhGLGtCQUFrQjtRQUNsQixJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sb0JBQW9CLEdBQUcsa0NBQWtDLEVBQUUsQ0FBQztZQUNsRSxNQUFNLFNBQVMsR0FBRyxvQkFBb0IsQ0FBQyxXQUFnRCxDQUFDLENBQUM7WUFDekYsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZCxnQkFBZ0IsR0FBRyxxQkFBcUIsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4RSxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JB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TyxFQUFFLElBQUk7Z0JBQ2IsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsR0FBRyxFQUFFLElBQUk7Z0JBQ1QsZUFBZSxFQUFFLElBQUk7YUFDdEI7WUFDRCxVQUFVLEVBQUU7Z0JBQ1YsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLElBQUksRUFBRSxJQUFJO2dCQUNWLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFVBQVUsRUFBRSxJQUFJO2FBQ2pCO1lBQ0QsVUFBVSxFQUFFO2dCQUNWLFdBQVcsRUFBRSxLQUFLLEVBQUUsUUFBUTtnQkFDNUIsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRO2dCQUN4QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsVUFBVSxFQUFFLElBQUk7YUFDakI7U0FDRjtLQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb25maWd1cmF0aW9uIExvYWRlclxuICog55Kw5aKD5Yil6Kit5a6a44Gu5YuV55qE6Kqt44G/6L6844G/5qmf6IO9XG4gKi9cblxuaW1wb3J0IHsgR2xvYmFsUmFnQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMvZ2xvYmFsLWNvbmZpZyc7XG5pbXBvcnQgeyB0b2t5b0NvbmZpZyB9IGZyb20gJy4vZW52aXJvbm1lbnRzL3Rva3lvJztcbmltcG9ydCB7IGZyYW5rZnVydENvbmZpZyB9IGZyb20gJy4vZW52aXJvbm1lbnRzL2ZyYW5rZnVydCc7XG5pbXBvcnQgeyB2aXJnaW5pYUNvbmZpZyB9IGZyb20gJy4vZW52aXJvbm1lbnRzL3ZpcmdpbmlhJztcbi8vIENvbXBsaWFuY2VNYXBwZXLjga/lvozjgaflrp/oo4Xkuojlrprjga7jgZ/jgoHjgIHkuIDmmYLnmoTjgavnm7TmjqXoqK3lrppcbmltcG9ydCB7IENvbXBsaWFuY2VSZWd1bGF0aW9uIH0gZnJvbSAnLi4vdHlwZXMvZ2xvYmFsLWNvbmZpZyc7XG5pbXBvcnQgeyBcbiAgTWFya2l0ZG93bkNvbmZpZywgXG4gIERFRkFVTFRfTUFSS0lURE9XTl9DT05GSUcsIFxuICBFbnZpcm9ubWVudE1hcmtpdGRvd25Db25maWcsXG4gIFN1cHBvcnRlZEZpbGVGb3JtYXQsXG4gIFByb2Nlc3NpbmdTdHJhdGVneVxufSBmcm9tICcuLi90eXBlcy9tYXJraXRkb3duLWNvbmZpZyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vKipcbiAqIE1hcmtpdGRvd27oqK3lrprjgpLoqq3jgb/ovrzjgoBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRNYXJraXRkb3duQ29uZmlnKGVudmlyb25tZW50Pzogc3RyaW5nKTogTWFya2l0ZG93bkNvbmZpZyB7XG4gIHRyeSB7XG4gICAgLy8g44Oh44Kk44Oz6Kit5a6a44OV44Kh44Kk44Or44KS6Kqt44G/6L6844G/XG4gICAgY29uc3QgY29uZmlnUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdtYXJraXRkb3duLWNvbmZpZy5qc29uJyk7XG4gICAgY29uc3QgY29uZmlnRGF0YSA9IGZzLnJlYWRGaWxlU3luYyhjb25maWdQYXRoLCAndXRmOCcpO1xuICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnRGF0YSk7XG4gICAgXG4gICAgbGV0IG1hcmtpdGRvd25Db25maWc6IE1hcmtpdGRvd25Db25maWcgPSBjb25maWcubWFya2l0ZG93biB8fCBERUZBVUxUX01BUktJVERPV05fQ09ORklHO1xuICAgIFxuICAgIC8vIOeSsOWig+WIpeioreWumuOCquODvOODkOODvOODqeOCpOODieOCkumBqeeUqFxuICAgIGlmIChlbnZpcm9ubWVudCkge1xuICAgICAgY29uc3QgZW52aXJvbm1lbnRPdmVycmlkZXMgPSBsb2FkRW52aXJvbm1lbnRNYXJraXRkb3duT3ZlcnJpZGVzKCk7XG4gICAgICBjb25zdCBlbnZDb25maWcgPSBlbnZpcm9ubWVudE92ZXJyaWRlc1tlbnZpcm9ubWVudCBhcyBrZXlvZiBFbnZpcm9ubWVudE1hcmtpdGRvd25Db25maWddO1xuICAgICAgaWYgKGVudkNvbmZpZykge1xuICAgICAgICBtYXJraXRkb3duQ29uZmlnID0gbWVyZ2VNYXJraXRkb3duQ29uZmlnKG1hcmtpdGRvd25Db25maWcsIGVudkNvbmZpZyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKGDinIUgTWFya2l0ZG93buioreWumuOCkuiqreOBv+i+vOOBv+OBvuOBl+OBnyAo55Kw5aKDOiAke2Vudmlyb25tZW50IHx8ICdkZWZhdWx0J30pYCk7XG4gICAgcmV0dXJuIG1hcmtpdGRvd25Db25maWc7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKGDimqDvuI8gTWFya2l0ZG93buioreWumuOBruiqreOBv+i+vOOBv+OBq+WkseaVl+OBl+OBvuOBl+OBnzogJHtlcnJvcn1gKTtcbiAgICBjb25zb2xlLmxvZygn44OH44OV44Kp44Or44OI6Kit5a6a44KS5L2/55So44GX44G+44GZJyk7XG4gICAgcmV0dXJuIERFRkFVTFRfTUFSS0lURE9XTl9DT05GSUc7XG4gIH1cbn1cblxuLyoqXG4gKiDnkrDlooPliKVNYXJraXRkb3du6Kit5a6a44Kq44O844OQ44O844Op44Kk44OJ44KS6Kqt44G/6L6844KAXG4gKi9cbmZ1bmN0aW9uIGxvYWRFbnZpcm9ubWVudE1hcmtpdGRvd25PdmVycmlkZXMoKTogRW52aXJvbm1lbnRNYXJraXRkb3duQ29uZmlnIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBvdmVycmlkZVBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZW52aXJvbm1lbnRzJywgJ21hcmtpdGRvd24tb3ZlcnJpZGVzLmpzb24nKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhvdmVycmlkZVBhdGgpKSB7XG4gICAgICBjb25zdCBvdmVycmlkZURhdGEgPSBmcy5yZWFkRmlsZVN5bmMob3ZlcnJpZGVQYXRoLCAndXRmOCcpO1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2Uob3ZlcnJpZGVEYXRhKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKGDimqDvuI8g55Kw5aKD5YilTWFya2l0ZG93buioreWumuOCquODvOODkOODvOODqeOCpOODieOBruiqreOBv+i+vOOBv+OBq+WkseaVlzogJHtlcnJvcn1gKTtcbiAgfVxuICByZXR1cm4ge307XG59XG5cbi8qKlxuICogTWFya2l0ZG93buioreWumuOCkuODnuODvOOCuOOBmeOCi1xuICovXG5mdW5jdGlvbiBtZXJnZU1hcmtpdGRvd25Db25maWcoXG4gIGJhc2VDb25maWc6IE1hcmtpdGRvd25Db25maWcsIFxuICBvdmVycmlkZTogUGFydGlhbDxNYXJraXRkb3duQ29uZmlnPlxuKTogTWFya2l0ZG93bkNvbmZpZyB7XG4gIHJldHVybiB7XG4gICAgLi4uYmFzZUNvbmZpZyxcbiAgICAuLi5vdmVycmlkZSxcbiAgICBzdXBwb3J0ZWRGb3JtYXRzOiB7XG4gICAgICAuLi5iYXNlQ29uZmlnLnN1cHBvcnRlZEZvcm1hdHMsXG4gICAgICAuLi4ob3ZlcnJpZGUuc3VwcG9ydGVkRm9ybWF0cyB8fCB7fSlcbiAgICB9LFxuICAgIHBlcmZvcm1hbmNlOiB7XG4gICAgICAuLi5iYXNlQ29uZmlnLnBlcmZvcm1hbmNlLFxuICAgICAgLi4uKG92ZXJyaWRlLnBlcmZvcm1hbmNlIHx8IHt9KVxuICAgIH0sXG4gICAgZmFsbGJhY2s6IHtcbiAgICAgIC4uLmJhc2VDb25maWcuZmFsbGJhY2ssXG4gICAgICAuLi4ob3ZlcnJpZGUuZmFsbGJhY2sgfHwge30pXG4gICAgfSxcbiAgICBzZWN1cml0eToge1xuICAgICAgLi4uYmFzZUNvbmZpZy5zZWN1cml0eSxcbiAgICAgIC4uLihvdmVycmlkZS5zZWN1cml0eSB8fCB7fSlcbiAgICB9LFxuICAgIGxvZ2dpbmc6IHtcbiAgICAgIC4uLmJhc2VDb25maWcubG9nZ2luZyxcbiAgICAgIC4uLihvdmVycmlkZS5sb2dnaW5nIHx8IHt9KVxuICAgIH0sXG4gICAgcXVhbGl0eToge1xuICAgICAgLi4uYmFzZUNvbmZpZy5xdWFsaXR5LFxuICAgICAgLi4uKG92ZXJyaWRlLnF1YWxpdHkgfHwge30pXG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIOeSsOWig+WIpeioreWumuOCkuiqreOBv+i+vOOCgFxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEVudmlyb25tZW50Q29uZmlnKFxuICBlbnZpcm9ubWVudDogc3RyaW5nLFxuICByZWdpb246IHN0cmluZyxcbiAgcHJvamVjdE5hbWU6IHN0cmluZ1xuKTogR2xvYmFsUmFnQ29uZmlnIHtcbiAgY29uc29sZS5sb2coYPCfk4sgTG9hZGluZyBjb25maWd1cmF0aW9uIGZvciAke2Vudmlyb25tZW50fSBlbnZpcm9ubWVudCBpbiAke3JlZ2lvbn1gKTtcblxuICAvLyDlnLDln5/liKXjga7jg5njg7zjgrnoqK3lrprjgpLlj5blvpdcbiAgbGV0IGJhc2VDb25maWc6IEdsb2JhbFJhZ0NvbmZpZztcblxuICBzd2l0Y2ggKHJlZ2lvbikge1xuICAgIGNhc2UgJ2FwLW5vcnRoZWFzdC0xJzogLy8g5p2x5LqsXG4gICAgY2FzZSAnYXAtbm9ydGhlYXN0LTMnOiAvLyDlpKfpmKpcbiAgICAgIGJhc2VDb25maWcgPSB0b2t5b0NvbmZpZztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2V1LWNlbnRyYWwtMSc6IC8vIOODleODqeODs+OCr+ODleODq+ODiFxuICAgIGNhc2UgJ2V1LXdlc3QtMSc6IC8vIOOCouOCpOODq+ODqeODs+ODiVxuICAgIGNhc2UgJ2V1LXdlc3QtMic6IC8vIOODreODs+ODieODs1xuICAgIGNhc2UgJ2V1LXdlc3QtMyc6IC8vIOODkeODqlxuICAgICAgYmFzZUNvbmZpZyA9IGZyYW5rZnVydENvbmZpZztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3VzLWVhc3QtMSc6IC8vIOODkOODvOOCuOODi+OColxuICAgIGNhc2UgJ3VzLWVhc3QtMic6IC8vIOOCquODj+OCpOOCqlxuICAgIGNhc2UgJ3VzLXdlc3QtMic6IC8vIOOCquODrOOCtOODs1xuICAgICAgYmFzZUNvbmZpZyA9IHZpcmdpbmlhQ29uZmlnO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPIFVua25vd24gcmVnaW9uICR7cmVnaW9ufSwgdXNpbmcgVG9reW8gY29uZmlnIGFzIGRlZmF1bHRgKTtcbiAgICAgIGJhc2VDb25maWcgPSB0b2t5b0NvbmZpZztcbiAgfVxuXG4gIC8vIE1hcmtpdGRvd27oqK3lrprjgpLoqq3jgb/ovrzjgb9cbiAgY29uc3QgbWFya2l0ZG93bkNvbmZpZyA9IGxvYWRNYXJraXRkb3duQ29uZmlnKGVudmlyb25tZW50KTtcbiAgXG4gIC8vIOeSsOWig+WbuuacieOBruiqv+aVtFxuICBjb25zdCBjb25maWc6IEdsb2JhbFJhZ0NvbmZpZyA9IHtcbiAgICAuLi5iYXNlQ29uZmlnLFxuICAgIHByb2plY3ROYW1lLFxuICAgIGVudmlyb25tZW50OiBlbnZpcm9ubWVudCBhcyAnZGV2JyB8ICdzdGFnaW5nJyB8ICdwcm9kJyxcbiAgICByZWdpb24sXG4gICAgLy8g55Kw5aKD5Yil44Gu5qmf6IO96Kq/5pW0XG4gICAgZmVhdHVyZXM6IGFkanVzdEZlYXR1cmVzRm9yRW52aXJvbm1lbnQoYmFzZUNvbmZpZy5mZWF0dXJlcywgZW52aXJvbm1lbnQsIG1hcmtpdGRvd25Db25maWcpLFxuICAgIC8vIOOCs+ODs+ODl+ODqeOCpOOCouODs+OCueioreWumuOBruiHquWLleODnuODg+ODlOODs+OCsFxuICAgIGNvbXBsaWFuY2U6IHtcbiAgICAgIHJlZ3VsYXRpb25zOiBnZXRDb21wbGlhbmNlRm9yUmVnaW9uKHJlZ2lvbiksXG4gICAgICBkYXRhUHJvdGVjdGlvbjoge1xuICAgICAgICBlbmNyeXB0aW9uQXRSZXN0OiB0cnVlLFxuICAgICAgICBlbmNyeXB0aW9uSW5UcmFuc2l0OiB0cnVlLFxuICAgICAgICBkYXRhQ2xhc3NpZmljYXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc0xvZ2dpbmc6IHRydWUsXG4gICAgICAgIGRhdGFSZXRlbnRpb246IHtcbiAgICAgICAgICBkZWZhdWx0UmV0ZW50aW9uRGF5czogMzY1LFxuICAgICAgICAgIHBlcnNvbmFsRGF0YVJldGVudGlvbkRheXM6IDM2NSxcbiAgICAgICAgICBsb2dSZXRlbnRpb25EYXlzOiAzNjUsXG4gICAgICAgICAgYmFja3VwUmV0ZW50aW9uRGF5czogMzY1XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBhdWRpdExvZ2dpbmc6IHRydWVcbiAgICB9XG4gIH07XG5cbiAgLy8g55Kw5aKD5Yil44Gu6L+95Yqg6Kq/5pW0XG4gIGlmIChlbnZpcm9ubWVudCA9PT0gJ2RldicpIHtcbiAgICAvLyDplovnmbrnkrDlooPjgafjga/kuIDpg6jmqZ/og73jgpLnhKHlirnljJbjgZfjgabjgrPjgrnjg4jjgpLliYrmuJtcbiAgICBjb25maWcuZmVhdHVyZXMubW9uaXRvcmluZy54cmF5ID0gZmFsc2U7XG4gICAgY29uZmlnLmZlYXR1cmVzLnN0b3JhZ2UuYmFja3VwID0gZmFsc2U7XG4gICAgY29uZmlnLmZlYXR1cmVzLmVudGVycHJpc2UubXVsdGlUZW5hbnQgPSBmYWxzZTtcbiAgICBjb25maWcuZmVhdHVyZXMuZW50ZXJwcmlzZS5iaWxsaW5nID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoZW52aXJvbm1lbnQgPT09ICdwcm9kJykge1xuICAgIC8vIOacrOeVqueSsOWig+OBp+OBr+WFqOapn+iDveOCkuacieWKueWMllxuICAgIGNvbmZpZy5mZWF0dXJlcy5tb25pdG9yaW5nLnhyYXkgPSB0cnVlO1xuICAgIGNvbmZpZy5mZWF0dXJlcy5zdG9yYWdlLmJhY2t1cCA9IHRydWU7XG4gICAgY29uZmlnLmZlYXR1cmVzLmVudGVycHJpc2UubXVsdGlUZW5hbnQgPSB0cnVlO1xuICAgIGNvbmZpZy5mZWF0dXJlcy5lbnRlcnByaXNlLmJpbGxpbmcgPSB0cnVlO1xuICB9XG5cbiAgY29uc29sZS5sb2coYOKchSBDb25maWd1cmF0aW9uIGxvYWRlZCBzdWNjZXNzZnVsbHlgKTtcbiAgY29uc29sZS5sb2coYCAgIFByb2plY3Q6ICR7Y29uZmlnLnByb2plY3ROYW1lfWApO1xuICBjb25zb2xlLmxvZyhgICAgRW52aXJvbm1lbnQ6ICR7Y29uZmlnLmVudmlyb25tZW50fWApO1xuICBjb25zb2xlLmxvZyhgICAgUmVnaW9uOiAke2NvbmZpZy5yZWdpb259YCk7XG4gIGNvbnNvbGUubG9nKGAgICBDb21wbGlhbmNlOiAke2NvbmZpZy5jb21wbGlhbmNlLnJlZ3VsYXRpb25zLmpvaW4oJywgJyl9YCk7XG5cbiAgcmV0dXJuIGNvbmZpZztcbn1cblxuLyoqXG4gKiDnkrDlooPjgavlv5zjgZjjgZ/mqZ/og73oqK3lrprjga7oqr/mlbRcbiAqL1xuZnVuY3Rpb24gYWRqdXN0RmVhdHVyZXNGb3JFbnZpcm9ubWVudChcbiAgYmFzZUZlYXR1cmVzOiBHbG9iYWxSYWdDb25maWdbJ2ZlYXR1cmVzJ10sXG4gIGVudmlyb25tZW50OiBzdHJpbmcsXG4gIG1hcmtpdGRvd25Db25maWc/OiBNYXJraXRkb3duQ29uZmlnXG4pOiBHbG9iYWxSYWdDb25maWdbJ2ZlYXR1cmVzJ10ge1xuICBjb25zdCBmZWF0dXJlcyA9IHsgLi4uYmFzZUZlYXR1cmVzIH07XG5cbiAgLy8gTWFya2l0ZG93buioreWumuOCkue1seWQiFxuICBpZiAobWFya2l0ZG93bkNvbmZpZykge1xuICAgIGZlYXR1cmVzLmFpID0ge1xuICAgICAgLi4uZmVhdHVyZXMuYWksXG4gICAgICBtYXJraXRkb3duOiBtYXJraXRkb3duQ29uZmlnLmVuYWJsZWQsXG4gICAgICBjb25maWc6IG1hcmtpdGRvd25Db25maWdcbiAgICB9O1xuICB9XG5cbiAgc3dpdGNoIChlbnZpcm9ubWVudCkge1xuICAgIGNhc2UgJ2Rldic6XG4gICAgICAvLyDplovnmbrnkrDlooM6IOWfuuacrOapn+iDveOBruOBv1xuICAgICAgZmVhdHVyZXMubmV0d29ya2luZy5sb2FkQmFsYW5jZXIgPSBmYWxzZTtcbiAgICAgIGZlYXR1cmVzLm5ldHdvcmtpbmcuY2RuID0gZmFsc2U7XG4gICAgICBmZWF0dXJlcy5zZWN1cml0eS53YWYgPSBmYWxzZTtcbiAgICAgIGZlYXR1cmVzLnN0b3JhZ2UuYmFja3VwID0gZmFsc2U7XG4gICAgICBmZWF0dXJlcy5zdG9yYWdlLmxpZmVjeWNsZSA9IGZhbHNlO1xuICAgICAgZmVhdHVyZXMuZGF0YWJhc2UucmRzID0gZmFsc2U7XG4gICAgICBmZWF0dXJlcy5jb21wdXRlLmVjcyA9IGZhbHNlO1xuICAgICAgZmVhdHVyZXMuY29tcHV0ZS5zY2FsaW5nID0gZmFsc2U7XG4gICAgICBmZWF0dXJlcy5hcGkuZ3JhcGhxbCA9IGZhbHNlO1xuICAgICAgZmVhdHVyZXMuYXBpLndlYnNvY2tldCA9IGZhbHNlO1xuICAgICAgZmVhdHVyZXMubW9uaXRvcmluZy54cmF5ID0gZmFsc2U7XG4gICAgICBmZWF0dXJlcy5tb25pdG9yaW5nLmFsYXJtcyA9IGZhbHNlO1xuICAgICAgZmVhdHVyZXMuZW50ZXJwcmlzZS5tdWx0aVRlbmFudCA9IGZhbHNlO1xuICAgICAgZmVhdHVyZXMuZW50ZXJwcmlzZS5iaWxsaW5nID0gZmFsc2U7XG4gICAgICBmZWF0dXJlcy5lbnRlcnByaXNlLmNvbXBsaWFuY2UgPSBmYWxzZTtcbiAgICAgIGZlYXR1cmVzLmVudGVycHJpc2UuZ292ZXJuYW5jZSA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdzdGFnaW5nJzpcbiAgICAgIC8vIOOCueODhuODvOOCuOODs+OCsOeSsOWigzog5pys55Wq5ZCM562J77yI44Ko44Oz44K/44O844OX44Op44Kk44K65qmf6IO96Zmk44GP77yJXG4gICAgICBmZWF0dXJlcy5uZXR3b3JraW5nLmxvYWRCYWxhbmNlciA9IHRydWU7XG4gICAgICBmZWF0dXJlcy5uZXR3b3JraW5nLmNkbiA9IHRydWU7XG4gICAgICBmZWF0dXJlcy5zZWN1cml0eS53YWYgPSB0cnVlO1xuICAgICAgZmVhdHVyZXMuc3RvcmFnZS5iYWNrdXAgPSB0cnVlO1xuICAgICAgZmVhdHVyZXMuc3RvcmFnZS5saWZlY3ljbGUgPSB0cnVlO1xuICAgICAgZmVhdHVyZXMuZGF0YWJhc2UucmRzID0gZmFsc2U7IC8vIOOCquODl+OCt+ODp+ODs1xuICAgICAgZmVhdHVyZXMuY29tcHV0ZS5lY3MgPSBmYWxzZTsgLy8g44Kq44OX44K344On44OzXG4gICAgICBmZWF0dXJlcy5jb21wdXRlLnNjYWxpbmcgPSB0cnVlO1xuICAgICAgZmVhdHVyZXMuYXBpLmdyYXBocWwgPSBmYWxzZTsgLy8g44Kq44OX44K344On44OzXG4gICAgICBmZWF0dXJlcy5hcGkud2Vic29ja2V0ID0gZmFsc2U7IC8vIOOCquODl+OCt+ODp+ODs1xuICAgICAgZmVhdHVyZXMubW9uaXRvcmluZy54cmF5ID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLm1vbml0b3JpbmcuYWxhcm1zID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLmVudGVycHJpc2UubXVsdGlUZW5hbnQgPSBmYWxzZTtcbiAgICAgIGZlYXR1cmVzLmVudGVycHJpc2UuYmlsbGluZyA9IGZhbHNlO1xuICAgICAgZmVhdHVyZXMuZW50ZXJwcmlzZS5jb21wbGlhbmNlID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLmVudGVycHJpc2UuZ292ZXJuYW5jZSA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3Byb2QnOlxuICAgICAgLy8g5pys55Wq55Kw5aKDOiDlhajmqZ/og73mnInlirlcbiAgICAgIGZlYXR1cmVzLm5ldHdvcmtpbmcubG9hZEJhbGFuY2VyID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLm5ldHdvcmtpbmcuY2RuID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLnNlY3VyaXR5LndhZiA9IHRydWU7XG4gICAgICBmZWF0dXJlcy5zdG9yYWdlLmJhY2t1cCA9IHRydWU7XG4gICAgICBmZWF0dXJlcy5zdG9yYWdlLmxpZmVjeWNsZSA9IHRydWU7XG4gICAgICBmZWF0dXJlcy5kYXRhYmFzZS5yZHMgPSB0cnVlO1xuICAgICAgZmVhdHVyZXMuY29tcHV0ZS5lY3MgPSB0cnVlO1xuICAgICAgZmVhdHVyZXMuY29tcHV0ZS5zY2FsaW5nID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLmFwaS5ncmFwaHFsID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLmFwaS53ZWJzb2NrZXQgPSB0cnVlO1xuICAgICAgZmVhdHVyZXMubW9uaXRvcmluZy54cmF5ID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLm1vbml0b3JpbmcuYWxhcm1zID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLmVudGVycHJpc2UubXVsdGlUZW5hbnQgPSB0cnVlO1xuICAgICAgZmVhdHVyZXMuZW50ZXJwcmlzZS5iaWxsaW5nID0gdHJ1ZTtcbiAgICAgIGZlYXR1cmVzLmVudGVycHJpc2UuY29tcGxpYW5jZSA9IHRydWU7XG4gICAgICBmZWF0dXJlcy5lbnRlcnByaXNlLmdvdmVybmFuY2UgPSB0cnVlO1xuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gVW5rbm93biBlbnZpcm9ubWVudCAke2Vudmlyb25tZW50fSwgdXNpbmcgZGVmYXVsdCBzZXR0aW5nc2ApO1xuICB9XG5cbiAgcmV0dXJuIGZlYXR1cmVzO1xufVxuXG4vKipcbiAqIE1hcmtpdGRvd27oqK3lrprjgpLmpJzoqLzjgZnjgotcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTWFya2l0ZG93bkNvbmZpZyhjb25maWc6IE1hcmtpdGRvd25Db25maWcpOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICAvLyDln7rmnKzoqK3lrprjga7mpJzoqLxcbiAgICBpZiAodHlwZW9mIGNvbmZpZy5lbmFibGVkICE9PSAnYm9vbGVhbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBNYXJraXRkb3du6Kit5a6a44Ko44Op44O8OiBlbmFibGVkIOOBryBib29sZWFuIOOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmScpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIOOCteODneODvOODiOOBleOCjOOCi+ODleOCoeOCpOODq+W9ouW8j+OBruaknOiovFxuICAgIGlmICghY29uZmlnLnN1cHBvcnRlZEZvcm1hdHMgfHwgdHlwZW9mIGNvbmZpZy5zdXBwb3J0ZWRGb3JtYXRzICE9PSAnb2JqZWN0Jykge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIE1hcmtpdGRvd27oqK3lrprjgqjjg6njg7w6IHN1cHBvcnRlZEZvcm1hdHMg44GM5q2j44GX44GP6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8g44OR44OV44Kp44O844Oe44Oz44K56Kit5a6a44Gu5qSc6Ki8XG4gICAgaWYgKGNvbmZpZy5wZXJmb3JtYW5jZS5tYXhGaWxlU2l6ZUJ5dGVzIDw9IDApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBNYXJraXRkb3du6Kit5a6a44Ko44Op44O8OiBtYXhGaWxlU2l6ZUJ5dGVzIOOBr+ato+OBruaVsOOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmScpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChjb25maWcucGVyZm9ybWFuY2UubWVtb3J5TGltaXRNQiA8PSAwKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwgTWFya2l0ZG93buioreWumuOCqOODqeODvDogbWVtb3J5TGltaXRNQiDjga/mraPjga7mlbDjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyDjgr/jgqTjg6DjgqLjgqbjg4joqK3lrprjga7mpJzoqLxcbiAgICBmb3IgKGNvbnN0IFtmb3JtYXQsIGZvcm1hdENvbmZpZ10gb2YgT2JqZWN0LmVudHJpZXMoY29uZmlnLnN1cHBvcnRlZEZvcm1hdHMpKSB7XG4gICAgICBpZiAoZm9ybWF0Q29uZmlnLnRpbWVvdXQgPD0gMCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgTWFya2l0ZG93buioreWumuOCqOODqeODvDogJHtmb3JtYXR9IOOBruOCv+OCpOODoOOCouOCpuODiOWApOOBjOeEoeWKueOBp+OBmWApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ+KchSBNYXJraXRkb3du6Kit5a6a44Gu5qSc6Ki844GM5a6M5LqG44GX44G+44GX44GfJyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihg4p2MIE1hcmtpdGRvd27oqK3lrprjga7mpJzoqLzkuK3jgavjgqjjg6njg7zjgYznmbrnlJ/jgZfjgb7jgZfjgZ86ICR7ZXJyb3J9YCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICog5Zyw5Z+f5Yil44Gu44Kz44Oz44OX44Op44Kk44Ki44Oz44K56KaP5Yi244KS5Y+W5b6X44GZ44KL77yI5LiA5pmC55qE44Gq5a6f6KOF77yJXG4gKi9cbmZ1bmN0aW9uIGdldENvbXBsaWFuY2VGb3JSZWdpb24ocmVnaW9uOiBzdHJpbmcpOiBDb21wbGlhbmNlUmVndWxhdGlvbltdIHtcbiAgc3dpdGNoIChyZWdpb24pIHtcbiAgICBjYXNlICdhcC1ub3J0aGVhc3QtMSc6IC8vIOadseS6rFxuICAgIGNhc2UgJ2FwLW5vcnRoZWFzdC0zJzogLy8g5aSn6ZiqXG4gICAgICByZXR1cm4gWydGSVNDJ107XG4gICAgY2FzZSAnZXUtY2VudHJhbC0xJzogLy8g44OV44Op44Oz44Kv44OV44Or44OIXG4gICAgY2FzZSAnZXUtd2VzdC0xJzogLy8g44Ki44Kk44Or44Op44Oz44OJXG4gICAgY2FzZSAnZXUtd2VzdC0yJzogLy8g44Ot44Oz44OJ44OzXG4gICAgY2FzZSAnZXUtd2VzdC0zJzogLy8g44OR44OqXG4gICAgICByZXR1cm4gWydHRFBSJ107XG4gICAgY2FzZSAndXMtZWFzdC0xJzogLy8g44OQ44O844K444OL44KiXG4gICAgY2FzZSAndXMtZWFzdC0yJzogLy8g44Kq44OP44Kk44KqXG4gICAgY2FzZSAndXMtd2VzdC0yJzogLy8g44Kq44Os44K044OzXG4gICAgICByZXR1cm4gWydTT1gnLCAnSElQQUEnXTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFsnR0RQUiddOyAvLyDjg4fjg5Xjgqnjg6vjg4jjga9HRFBSXG4gIH1cbn1cblxuLyoqXG4gKiDjg5XjgqHjgqTjg6vlvaLlvI/jga7lh6bnkIbmlrnms5XjgpLli5XnmoTjgavlpInmm7TjgZnjgotcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVByb2Nlc3NpbmdTdHJhdGVneShcbiAgY29uZmlnOiBNYXJraXRkb3duQ29uZmlnLFxuICBmb3JtYXQ6IFN1cHBvcnRlZEZpbGVGb3JtYXQsXG4gIHN0cmF0ZWd5OiBQcm9jZXNzaW5nU3RyYXRlZ3lcbik6IE1hcmtpdGRvd25Db25maWcge1xuICBjb25zdCB1cGRhdGVkQ29uZmlnID0geyAuLi5jb25maWcgfTtcbiAgXG4gIGlmICh1cGRhdGVkQ29uZmlnLnN1cHBvcnRlZEZvcm1hdHNbZm9ybWF0XSkge1xuICAgIHVwZGF0ZWRDb25maWcuc3VwcG9ydGVkRm9ybWF0c1tmb3JtYXRdID0ge1xuICAgICAgLi4udXBkYXRlZENvbmZpZy5zdXBwb3J0ZWRGb3JtYXRzW2Zvcm1hdF0sXG4gICAgICBwcm9jZXNzaW5nU3RyYXRlZ3k6IHN0cmF0ZWd5LFxuICAgICAgdXNlTWFya2l0ZG93bjogc2hvdWxkRW5hYmxlTWFya2l0ZG93bihzdHJhdGVneSksXG4gICAgICB1c2VMYW5nQ2hhaW46IHNob3VsZEVuYWJsZUxhbmdDaGFpbihzdHJhdGVneSksXG4gICAgICBlbmFibGVRdWFsaXR5Q29tcGFyaXNvbjogc3RyYXRlZ3kgPT09ICdib3RoLWNvbXBhcmUnXG4gICAgfTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhg4pyFICR7Zm9ybWF0feOBruWHpueQhuaIpueVpeOCkiR7c3RyYXRlZ3l944Gr5aSJ5pu044GX44G+44GX44GfYCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS53YXJuKGDimqDvuI8g44K144Od44O844OI44GV44KM44Gm44GE44Gq44GE44OV44Kh44Kk44Or5b2i5byPOiAke2Zvcm1hdH1gKTtcbiAgfVxuICBcbiAgcmV0dXJuIHVwZGF0ZWRDb25maWc7XG59XG5cbi8qKlxuICog5Yem55CG5oim55Wl44Gr5Z+644Gl44GE44GmTWFya2l0ZG93buOCkuacieWKueOBq+OBmeOCi+OBi+OCkuaxuuWumlxuICovXG5mdW5jdGlvbiBzaG91bGRFbmFibGVNYXJraXRkb3duKHN0cmF0ZWd5OiBQcm9jZXNzaW5nU3RyYXRlZ3kpOiBib29sZWFuIHtcbiAgcmV0dXJuIFsnbWFya2l0ZG93bi1vbmx5JywgJ21hcmtpdGRvd24tZmlyc3QnLCAnYm90aC1jb21wYXJlJywgJ2F1dG8tc2VsZWN0J10uaW5jbHVkZXMoc3RyYXRlZ3kpO1xufVxuXG4vKipcbiAqIOWHpueQhuaIpueVpeOBq+WfuuOBpeOBhOOBpkxhbmdDaGFpbuOCkuacieWKueOBq+OBmeOCi+OBi+OCkuaxuuWumlxuICovXG5mdW5jdGlvbiBzaG91bGRFbmFibGVMYW5nQ2hhaW4oc3RyYXRlZ3k6IFByb2Nlc3NpbmdTdHJhdGVneSk6IGJvb2xlYW4ge1xuICByZXR1cm4gWydsYW5nY2hhaW4tb25seScsICdsYW5nY2hhaW4tZmlyc3QnLCAnYm90aC1jb21wYXJlJywgJ2F1dG8tc2VsZWN0J10uaW5jbHVkZXMoc3RyYXRlZ3kpO1xufVxuXG4vKipcbiAqIOikh+aVsOOBruODleOCoeOCpOODq+W9ouW8j+OBruWHpueQhuaWueazleOCkuS4gOaLrOWkieabtFxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlTXVsdGlwbGVQcm9jZXNzaW5nU3RyYXRlZ2llcyhcbiAgY29uZmlnOiBNYXJraXRkb3duQ29uZmlnLFxuICB1cGRhdGVzOiBSZWNvcmQ8U3VwcG9ydGVkRmlsZUZvcm1hdCwgUHJvY2Vzc2luZ1N0cmF0ZWd5PlxuKTogTWFya2l0ZG93bkNvbmZpZyB7XG4gIGxldCB1cGRhdGVkQ29uZmlnID0geyAuLi5jb25maWcgfTtcbiAgXG4gIGZvciAoY29uc3QgW2Zvcm1hdCwgc3RyYXRlZ3ldIG9mIE9iamVjdC5lbnRyaWVzKHVwZGF0ZXMpIGFzIFtTdXBwb3J0ZWRGaWxlRm9ybWF0LCBQcm9jZXNzaW5nU3RyYXRlZ3ldW10pIHtcbiAgICB1cGRhdGVkQ29uZmlnID0gdXBkYXRlUHJvY2Vzc2luZ1N0cmF0ZWd5KHVwZGF0ZWRDb25maWcsIGZvcm1hdCwgc3RyYXRlZ3kpO1xuICB9XG4gIFxuICBjb25zb2xlLmxvZyhg4pyFICR7T2JqZWN0LmtleXModXBkYXRlcykubGVuZ3RofeWAi+OBruODleOCoeOCpOODq+W9ouW8j+OBruWHpueQhuaIpueVpeOCkuabtOaWsOOBl+OBvuOBl+OBn2ApO1xuICByZXR1cm4gdXBkYXRlZENvbmZpZztcbn1cblxuLyoqXG4gKiDlh6bnkIbmlrnms5Xjga7kvb/nlKjnirbms4Hjg6zjg53jg7zjg4jjgpLnlJ/miJBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlUHJvY2Vzc2luZ01ldGhvZFJlcG9ydChjb25maWc6IE1hcmtpdGRvd25Db25maWcpOiB7XG4gIHN1bW1hcnk6IHtcbiAgICB0b3RhbEZvcm1hdHM6IG51bWJlcjtcbiAgICBtYXJraXRkb3duT25seUZvcm1hdHM6IG51bWJlcjtcbiAgICBsYW5nY2hhaW5Pbmx5Rm9ybWF0czogbnVtYmVyO1xuICAgIGh5YnJpZEZvcm1hdHM6IG51bWJlcjtcbiAgICBxdWFsaXR5Q29tcGFyaXNvbkZvcm1hdHM6IG51bWJlcjtcbiAgfTtcbiAgZGV0YWlsczogQXJyYXk8e1xuICAgIGZvcm1hdDogU3VwcG9ydGVkRmlsZUZvcm1hdDtcbiAgICBzdHJhdGVneTogUHJvY2Vzc2luZ1N0cmF0ZWd5O1xuICAgIHVzZU1hcmtpdGRvd246IGJvb2xlYW47XG4gICAgdXNlTGFuZ0NoYWluOiBib29sZWFuO1xuICAgIHF1YWxpdHlDb21wYXJpc29uOiBib29sZWFuO1xuICB9Pjtcbn0ge1xuICBjb25zdCBkZXRhaWxzID0gT2JqZWN0LmVudHJpZXMoY29uZmlnLnN1cHBvcnRlZEZvcm1hdHMpLm1hcCgoW2Zvcm1hdCwgZm9ybWF0Q29uZmlnXSkgPT4gKHtcbiAgICBmb3JtYXQ6IGZvcm1hdCBhcyBTdXBwb3J0ZWRGaWxlRm9ybWF0LFxuICAgIHN0cmF0ZWd5OiBmb3JtYXRDb25maWcucHJvY2Vzc2luZ1N0cmF0ZWd5LFxuICAgIHVzZU1hcmtpdGRvd246IGZvcm1hdENvbmZpZy51c2VNYXJraXRkb3duLFxuICAgIHVzZUxhbmdDaGFpbjogZm9ybWF0Q29uZmlnLnVzZUxhbmdDaGFpbixcbiAgICBxdWFsaXR5Q29tcGFyaXNvbjogZm9ybWF0Q29uZmlnLmVuYWJsZVF1YWxpdHlDb21wYXJpc29uIHx8IGZhbHNlXG4gIH0pKTtcblxuICBjb25zdCBzdW1tYXJ5ID0ge1xuICAgIHRvdGFsRm9ybWF0czogZGV0YWlscy5sZW5ndGgsXG4gICAgbWFya2l0ZG93bk9ubHlGb3JtYXRzOiBkZXRhaWxzLmZpbHRlcihkID0+IGQudXNlTWFya2l0ZG93biAmJiAhZC51c2VMYW5nQ2hhaW4pLmxlbmd0aCxcbiAgICBsYW5nY2hhaW5Pbmx5Rm9ybWF0czogZGV0YWlscy5maWx0ZXIoZCA9PiAhZC51c2VNYXJraXRkb3duICYmIGQudXNlTGFuZ0NoYWluKS5sZW5ndGgsXG4gICAgaHlicmlkRm9ybWF0czogZGV0YWlscy5maWx0ZXIoZCA9PiBkLnVzZU1hcmtpdGRvd24gJiYgZC51c2VMYW5nQ2hhaW4pLmxlbmd0aCxcbiAgICBxdWFsaXR5Q29tcGFyaXNvbkZvcm1hdHM6IGRldGFpbHMuZmlsdGVyKGQgPT4gZC5xdWFsaXR5Q29tcGFyaXNvbikubGVuZ3RoXG4gIH07XG5cbiAgcmV0dXJuIHsgc3VtbWFyeSwgZGV0YWlscyB9O1xufVxuXG4vKipcbiAqIE1hcmtpdGRvd27oqK3lrprjg4bjg7Pjg5fjg6zjg7zjg4jjgpLnlJ/miJDjgZnjgotcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlTWFya2l0ZG93bkNvbmZpZ1RlbXBsYXRlKCk6IE1hcmtpdGRvd25Db25maWcge1xuICBjb25zb2xlLmxvZygn8J+TnSBNYXJraXRkb3du6Kit5a6a44OG44Oz44OX44Os44O844OI44KS55Sf5oiQ44GX44Gm44GE44G+44GZLi4uJyk7XG4gIFxuICBjb25zdCB0ZW1wbGF0ZTogTWFya2l0ZG93bkNvbmZpZyA9IHtcbiAgICAuLi5ERUZBVUxUX01BUktJVERPV05fQ09ORklHLFxuICAgIC8vIOODhuODs+ODl+ODrOODvOODiOeUqOOBruOCs+ODoeODs+ODiOS7mOOBjeioreWumlxuICAgIHN1cHBvcnRlZEZvcm1hdHM6IHtcbiAgICAgIGRvY3g6IHsgXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsIFxuICAgICAgICB0aW1lb3V0OiAzMCwgXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWljcm9zb2Z0IFdvcmTmlofmm7ggLSDkuIDoiKznmoTjgarjg5Pjgrjjg43jgrnmlofmm7gnLFxuICAgICAgICBwcm9jZXNzaW5nU3RyYXRlZ3k6ICdtYXJraXRkb3duLWZpcnN0JyxcbiAgICAgICAgdXNlTWFya2l0ZG93bjogdHJ1ZSxcbiAgICAgICAgdXNlTGFuZ0NoYWluOiB0cnVlLFxuICAgICAgICBlbmFibGVRdWFsaXR5Q29tcGFyaXNvbjogZmFsc2VcbiAgICAgIH0sXG4gICAgICB4bHN4OiB7IFxuICAgICAgICBlbmFibGVkOiB0cnVlLCBcbiAgICAgICAgdGltZW91dDogNDUsIFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01pY3Jvc29mdCBFeGNlbOaWh+abuCAtIOOCueODl+ODrOODg+ODieOCt+ODvOODiOOBqOODh+ODvOOCvycsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ21hcmtpdGRvd24tZmlyc3QnLFxuICAgICAgICB1c2VNYXJraXRkb3duOiB0cnVlLFxuICAgICAgICB1c2VMYW5nQ2hhaW46IHRydWUsXG4gICAgICAgIGVuYWJsZVF1YWxpdHlDb21wYXJpc29uOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHBwdHg6IHsgXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsIFxuICAgICAgICB0aW1lb3V0OiA2MCwgXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWljcm9zb2Z0IFBvd2VyUG9pbnTmlofmm7ggLSDjg5fjg6zjgrzjg7Pjg4bjg7zjgrfjg6fjg7MnLFxuICAgICAgICBwcm9jZXNzaW5nU3RyYXRlZ3k6ICdtYXJraXRkb3duLWZpcnN0JyxcbiAgICAgICAgdXNlTWFya2l0ZG93bjogdHJ1ZSxcbiAgICAgICAgdXNlTGFuZ0NoYWluOiB0cnVlLFxuICAgICAgICBlbmFibGVRdWFsaXR5Q29tcGFyaXNvbjogZmFsc2VcbiAgICAgIH0sXG4gICAgICBwZGY6IHsgXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsIFxuICAgICAgICB0aW1lb3V0OiAxMjAsIFxuICAgICAgICBvY3I6IHRydWUsIFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1BERuaWh+abuCAtIE9DUuapn+iDveOBp+OCueOCreODo+ODs+aWh+abuOOBq+OCguWvvuW/nCcsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ2JvdGgtY29tcGFyZScsXG4gICAgICAgIHVzZU1hcmtpdGRvd246IHRydWUsXG4gICAgICAgIHVzZUxhbmdDaGFpbjogdHJ1ZSxcbiAgICAgICAgZW5hYmxlUXVhbGl0eUNvbXBhcmlzb246IHRydWVcbiAgICAgIH0sXG4gICAgICBwbmc6IHsgXG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLCBcbiAgICAgICAgdGltZW91dDogOTAsIFxuICAgICAgICBvY3I6IHRydWUsIFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1BOR+eUu+WDjyAtIOmrmOWTgeizqueUu+WDj+OAgU9DUuW/heimgeaZguOBruOBv+acieWKueWMlicsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ21hcmtpdGRvd24tb25seScsXG4gICAgICAgIHVzZU1hcmtpdGRvd246IHRydWUsXG4gICAgICAgIHVzZUxhbmdDaGFpbjogZmFsc2UsXG4gICAgICAgIGVuYWJsZVF1YWxpdHlDb21wYXJpc29uOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGpwZzogeyBcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsIFxuICAgICAgICB0aW1lb3V0OiA5MCwgXG4gICAgICAgIG9jcjogdHJ1ZSwgXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSlBFR+eUu+WDjyAtIOS4gOiIrOeahOOBqueUu+WDj+W9ouW8j+OAgU9DUuW/heimgeaZguOBruOBv+acieWKueWMlicsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ21hcmtpdGRvd24tb25seScsXG4gICAgICAgIHVzZU1hcmtpdGRvd246IHRydWUsXG4gICAgICAgIHVzZUxhbmdDaGFpbjogZmFsc2UsXG4gICAgICAgIGVuYWJsZVF1YWxpdHlDb21wYXJpc29uOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGpwZWc6IHsgXG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLCBcbiAgICAgICAgdGltZW91dDogOTAsIFxuICAgICAgICBvY3I6IHRydWUsIFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0pQRUfnlLvlg48gLSDkuIDoiKznmoTjgarnlLvlg4/lvaLlvI/jgIFPQ1Llv4XopoHmmYLjga7jgb/mnInlirnljJYnLFxuICAgICAgICBwcm9jZXNzaW5nU3RyYXRlZ3k6ICdtYXJraXRkb3duLW9ubHknLFxuICAgICAgICB1c2VNYXJraXRkb3duOiB0cnVlLFxuICAgICAgICB1c2VMYW5nQ2hhaW46IGZhbHNlLFxuICAgICAgICBlbmFibGVRdWFsaXR5Q29tcGFyaXNvbjogZmFsc2VcbiAgICAgIH0sXG4gICAgICBnaWY6IHsgXG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLCBcbiAgICAgICAgdGltZW91dDogOTAsIFxuICAgICAgICBvY3I6IHRydWUsIFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0dJRueUu+WDjyAtIOOCouODi+ODoeODvOOCt+ODp+ODs+eUu+WDj+OAgU9DUuW/heimgeaZguOBruOBv+acieWKueWMlicsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ21hcmtpdGRvd24tb25seScsXG4gICAgICAgIHVzZU1hcmtpdGRvd246IHRydWUsXG4gICAgICAgIHVzZUxhbmdDaGFpbjogZmFsc2UsXG4gICAgICAgIGVuYWJsZVF1YWxpdHlDb21wYXJpc29uOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGh0bWw6IHsgXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsIFxuICAgICAgICB0aW1lb3V0OiAzMCwgXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSFRNTOaWh+abuCAtIOOCpuOCp+ODluODmuODvOOCuOOBqOODnuODvOOCr+OCouODg+ODlycsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ2xhbmdjaGFpbi1maXJzdCcsXG4gICAgICAgIHVzZU1hcmtpdGRvd246IHRydWUsXG4gICAgICAgIHVzZUxhbmdDaGFpbjogdHJ1ZSxcbiAgICAgICAgZW5hYmxlUXVhbGl0eUNvbXBhcmlzb246IGZhbHNlXG4gICAgICB9LFxuICAgICAgeG1sOiB7IFxuICAgICAgICBlbmFibGVkOiB0cnVlLCBcbiAgICAgICAgdGltZW91dDogMzAsIFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1hNTOaWh+abuCAtIOani+mAoOWMluODh+ODvOOCvycsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ2xhbmdjaGFpbi1maXJzdCcsXG4gICAgICAgIHVzZU1hcmtpdGRvd246IHRydWUsXG4gICAgICAgIHVzZUxhbmdDaGFpbjogdHJ1ZSxcbiAgICAgICAgZW5hYmxlUXVhbGl0eUNvbXBhcmlzb246IGZhbHNlXG4gICAgICB9LFxuICAgICAgY3N2OiB7IFxuICAgICAgICBlbmFibGVkOiB0cnVlLCBcbiAgICAgICAgdGltZW91dDogMTUsIFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NTVuaWh+abuCAtIOOCq+ODs+ODnuWMuuWIh+OCiuODh+ODvOOCvycsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ2xhbmdjaGFpbi1vbmx5JyxcbiAgICAgICAgdXNlTWFya2l0ZG93bjogZmFsc2UsXG4gICAgICAgIHVzZUxhbmdDaGFpbjogdHJ1ZSxcbiAgICAgICAgZW5hYmxlUXVhbGl0eUNvbXBhcmlzb246IGZhbHNlXG4gICAgICB9LFxuICAgICAgdHN2OiB7IFxuICAgICAgICBlbmFibGVkOiB0cnVlLCBcbiAgICAgICAgdGltZW91dDogMTUsIFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RTVuaWh+abuCAtIOOCv+ODluWMuuWIh+OCiuODh+ODvOOCvycsXG4gICAgICAgIHByb2Nlc3NpbmdTdHJhdGVneTogJ2xhbmdjaGFpbi1vbmx5JyxcbiAgICAgICAgdXNlTWFya2l0ZG93bjogZmFsc2UsXG4gICAgICAgIHVzZUxhbmdDaGFpbjogdHJ1ZSxcbiAgICAgICAgZW5hYmxlUXVhbGl0eUNvbXBhcmlzb246IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGNvbnNvbGUubG9nKCfinIUgTWFya2l0ZG93buioreWumuODhuODs+ODl+ODrOODvOODiOOBjOeUn+aIkOOBleOCjOOBvuOBl+OBnycpO1xuICByZXR1cm4gdGVtcGxhdGU7XG59XG5cbi8qKlxuICog5Zyw5Z+f5Yil44Gu44OH44OV44Kp44Or44OI6Kit5a6a44KS5Y+W5b6XXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWdpb25hbERlZmF1bHRzKHJlZ2lvbjogc3RyaW5nKTogUGFydGlhbDxHbG9iYWxSYWdDb25maWc+IHtcbiAgcmV0dXJuIHtcbiAgICByZWdpb24sXG4gICAgY29tcGxpYW5jZToge1xuICAgICAgcmVndWxhdGlvbnM6IGdldENvbXBsaWFuY2VGb3JSZWdpb24ocmVnaW9uKSxcbiAgICAgIGRhdGFQcm90ZWN0aW9uOiB7XG4gICAgICAgIGVuY3J5cHRpb25BdFJlc3Q6IHRydWUsXG4gICAgICAgIGVuY3J5cHRpb25JblRyYW5zaXQ6IHRydWUsXG4gICAgICAgIGRhdGFDbGFzc2lmaWNhdGlvbjogdHJ1ZSxcbiAgICAgICAgYWNjZXNzTG9nZ2luZzogdHJ1ZSxcbiAgICAgICAgZGF0YVJldGVudGlvbjoge1xuICAgICAgICAgIGRlZmF1bHRSZXRlbnRpb25EYXlzOiAzNjUsXG4gICAgICAgICAgcGVyc29uYWxEYXRhUmV0ZW50aW9uRGF5czogMzY1LFxuICAgICAgICAgIGxvZ1JldGVudGlvbkRheXM6IDM2NSxcbiAgICAgICAgICBiYWNrdXBSZXRlbnRpb25EYXlzOiAzNjVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGF1ZGl0TG9nZ2luZzogdHJ1ZVxuICAgIH0sXG4gICAgLy8g5Zyw5Z+f5Yil44Gu44OH44OV44Kp44Or44OI6Kit5a6aXG4gICAgZmVhdHVyZXM6IHtcbiAgICAgIG5ldHdvcmtpbmc6IHtcbiAgICAgICAgdnBjOiB0cnVlLFxuICAgICAgICBsb2FkQmFsYW5jZXI6IHRydWUsXG4gICAgICAgIGNkbjogdHJ1ZSxcbiAgICAgICAgY3VzdG9tRG9tYWluOiB1bmRlZmluZWRcbiAgICAgIH0sXG4gICAgICBzZWN1cml0eToge1xuICAgICAgICB3YWY6IHRydWUsXG4gICAgICAgIGNvZ25pdG86IHRydWUsXG4gICAgICAgIGVuY3J5cHRpb246IHRydWUsXG4gICAgICAgIGNvbXBsaWFuY2U6IHRydWVcbiAgICAgIH0sXG4gICAgICBzdG9yYWdlOiB7XG4gICAgICAgIGZzeDogdHJ1ZSxcbiAgICAgICAgczM6IHRydWUsXG4gICAgICAgIGJhY2t1cDogdHJ1ZSxcbiAgICAgICAgbGlmZWN5Y2xlOiB0cnVlXG4gICAgICB9LFxuICAgICAgZGF0YWJhc2U6IHtcbiAgICAgICAgZHluYW1vZGI6IHRydWUsXG4gICAgICAgIG9wZW5zZWFyY2g6IHRydWUsXG4gICAgICAgIHJkczogZmFsc2UsIC8vIOOCquODl+OCt+ODp+ODs1xuICAgICAgICBtaWdyYXRpb246IHRydWVcbiAgICAgIH0sXG4gICAgICBjb21wdXRlOiB7XG4gICAgICAgIGxhbWJkYTogdHJ1ZSxcbiAgICAgICAgZWNzOiBmYWxzZSwgLy8g44Kq44OX44K344On44OzXG4gICAgICAgIHNjYWxpbmc6IHRydWVcbiAgICAgIH0sXG4gICAgICBhcGk6IHtcbiAgICAgICAgcmVzdEFwaTogdHJ1ZSxcbiAgICAgICAgZ3JhcGhxbDogZmFsc2UsIC8vIOOCquODl+OCt+ODp+ODs1xuICAgICAgICB3ZWJzb2NrZXQ6IGZhbHNlLCAvLyDjgqrjg5fjgrfjg6fjg7NcbiAgICAgICAgZnJvbnRlbmQ6IHRydWVcbiAgICAgIH0sXG4gICAgICBhaToge1xuICAgICAgICBiZWRyb2NrOiB0cnVlLFxuICAgICAgICBlbWJlZGRpbmc6IHRydWUsXG4gICAgICAgIHJhZzogdHJ1ZSxcbiAgICAgICAgbW9kZWxNYW5hZ2VtZW50OiB0cnVlXG4gICAgICB9LFxuICAgICAgbW9uaXRvcmluZzoge1xuICAgICAgICBjbG91ZHdhdGNoOiB0cnVlLFxuICAgICAgICB4cmF5OiB0cnVlLFxuICAgICAgICBhbGFybXM6IHRydWUsXG4gICAgICAgIGRhc2hib2FyZHM6IHRydWVcbiAgICAgIH0sXG4gICAgICBlbnRlcnByaXNlOiB7XG4gICAgICAgIG11bHRpVGVuYW50OiBmYWxzZSwgLy8g44Kq44OX44K344On44OzXG4gICAgICAgIGJpbGxpbmc6IGZhbHNlLCAvLyDjgqrjg5fjgrfjg6fjg7NcbiAgICAgICAgY29tcGxpYW5jZTogdHJ1ZSxcbiAgICAgICAgZ292ZXJuYW5jZTogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfTtcbn0iXX0=