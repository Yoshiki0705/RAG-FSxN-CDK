"use strict";
/**
 * AWS リソースタグ設定
 * コスト配布とリソース管理のための統一タグ戦略
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
exports.PermissionAwareRAGTags = exports.TaggingStrategy = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
/**
 * 統一されたタグ設定を生成
 */
class TaggingStrategy {
    /**
     * タグ設定の妥当性を検証
     */
    static validateConfig(config) {
        const errors = [];
        // プロジェクト名の検証（AWS タグ制限に準拠）
        if (!config.projectName || config.projectName.length > 128) {
            errors.push('プロジェクト名は1-128文字である必要があります');
        }
        // 環境名の検証
        const validEnvironments = ['dev', 'staging', 'prod'];
        if (!validEnvironments.includes(config.environment)) {
            errors.push(`環境名は ${validEnvironments.join(', ')} のいずれかである必要があります`);
        }
        // カスタムタグの検証
        if (config.customTags) {
            Object.entries(config.customTags).forEach(([key, value]) => {
                if (key.length > 128 || value.length > 256) {
                    errors.push(`タグ "${key}" のキーまたは値が長すぎます（キー: 最大128文字、値: 最大256文字）`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * コスト配布タグを生成
     */
    static generateCostAllocationTags(config) {
        // 設定の妥当性を検証
        const validation = this.validateConfig(config);
        if (!validation.isValid) {
            throw new Error(`タグ設定が無効です: ${validation.errors.join(', ')}`);
        }
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
        return {
            // コスト配布の主要タグ
            cost: config.projectName,
            // 基本タグ
            Environment: config.environment,
            Project: config.projectName,
            Department: config.department || 'Engineering',
            Owner: config.owner || 'CDK-Deployment',
            CreatedDate: config.createdDate || currentDate,
            // 管理情報タグ
            'CDK-Application': 'Permission-aware-RAG-FSxN',
            'Management-Method': 'AWS-CDK',
        };
    }
    /**
     * CDKスタックにタグを適用
     */
    static applyTagsToStack(stack, config) {
        try {
            const tags = this.generateCostAllocationTags(config);
            let appliedTagsCount = 0;
            // 全てのタグをスタックに適用
            Object.entries(tags).forEach(([key, value]) => {
                if (value) {
                    cdk.Tags.of(stack).add(key, value);
                    appliedTagsCount++;
                }
            });
            // カスタムタグの適用
            if (config.customTags) {
                Object.entries(config.customTags).forEach(([key, value]) => {
                    cdk.Tags.of(stack).add(key, value);
                    appliedTagsCount++;
                });
            }
            // デバッグ情報をコンソールに出力（開発環境のみ）
            if (config.environment === 'dev') {
                console.log(`✅ スタック "${stack.stackName}" に ${appliedTagsCount} 個のタグを適用しました`);
            }
        }
        catch (error) {
            console.error(`❌ スタック "${stack.stackName}" へのタグ適用に失敗:`, error);
            throw error;
        }
    }
    /**
     * 特定のリソースにタグを適用
     */
    static applyTagsToResource(resource, config) {
        const tags = this.generateCostAllocationTags(config);
        Object.entries(tags).forEach(([key, value]) => {
            if (value) {
                cdk.Tags.of(resource).add(key, value);
            }
        });
    }
    /**
     * FSx for ONTAP専用タグを生成
     */
    static generateFSxTags(config) {
        const baseTags = this.generateCostAllocationTags(config);
        return {
            ...baseTags,
            'Service-Type': 'FSx-for-NetApp-ONTAP',
            'Use-Case': 'RAG-Document-Storage',
            'Performance-Tier': config.environment === 'prod' ? 'High' : 'Standard',
            'Backup-Required': 'true',
            'Encryption-Required': 'true',
        };
    }
    /**
     * AWS Batch専用タグを生成
     */
    static generateBatchTags(config) {
        const baseTags = this.generateCostAllocationTags(config);
        return {
            ...baseTags,
            'Service-Type': 'AWS-Batch',
            'Use-Case': 'Embedding-Processing',
            'Compute-Type': 'Batch-Jobs',
            'Auto-Scaling': 'true',
        };
    }
    /**
     * OpenSearch専用タグを生成
     */
    static generateOpenSearchTags(config) {
        const baseTags = this.generateCostAllocationTags(config);
        return {
            ...baseTags,
            'Service-Type': 'OpenSearch-Serverless',
            'Use-Case': 'Vector-Search',
            'Data-Type': 'Embeddings',
            'Search-Type': 'Semantic-Search',
        };
    }
    /**
     * Lambda専用タグを生成
     */
    static generateLambdaTags(config, functionPurpose) {
        const baseTags = this.generateCostAllocationTags(config);
        return {
            ...baseTags,
            'Service-Type': 'AWS-Lambda',
            'Function-Purpose': functionPurpose,
            'Runtime': 'nodejs20.x',
            'Architecture': 'x86_64',
        };
    }
    /**
     * コスト最適化用タグを生成
     */
    static generateCostOptimizationTags(config, resourceType) {
        const baseTags = this.generateCostAllocationTags(config);
        // リソースタイプ別のコスト最適化設定
        const optimizationSettings = {
            'FSx-for-NetApp-ONTAP': {
                'Cost-Optimization': 'Storage-Tiering',
                'Billing-Mode': 'Provisioned',
                'Review-Schedule': 'Monthly',
            },
            'AWS-Batch': {
                'Cost-Optimization': 'Spot-Instances',
                'Billing-Mode': 'On-Demand',
                'Review-Schedule': 'Weekly',
            },
            'OpenSearch-Serverless': {
                'Cost-Optimization': 'Auto-Scaling',
                'Billing-Mode': 'Serverless',
                'Review-Schedule': 'Daily',
            },
            'AWS-Lambda': {
                'Cost-Optimization': 'Memory-Optimization',
                'Billing-Mode': 'Pay-Per-Use',
                'Review-Schedule': 'Weekly',
            },
        };
        return {
            ...baseTags,
            'Service-Type': resourceType,
            ...optimizationSettings[resourceType] || {},
            'Cost-Review-Required': config.environment === 'prod' ? 'true' : 'false',
        };
    }
}
exports.TaggingStrategy = TaggingStrategy;
/**
 * プロジェクト固有のタグ設定
 */
class PermissionAwareRAGTags {
    /**
     * プロジェクト標準のタグ設定を取得
     */
    static getStandardConfig(projectName, environment) {
        return {
            projectName,
            environment: environment,
            department: 'AI-Engineering',
            owner: 'RAG-Team',
            customTags: {
                'Application-Type': 'RAG-System',
                'Technology-Stack': 'CDK-TypeScript',
                'Data-Classification': 'Internal',
                'Compliance-Required': 'true',
            },
        };
    }
    /**
     * 環境別のタグ設定を取得
     */
    static getEnvironmentConfig(environment) {
        const configs = {
            dev: {
                customTags: {
                    'Cost-Center': 'Development',
                    'Auto-Shutdown': 'true',
                    'Monitoring-Level': 'Basic',
                },
            },
            staging: {
                customTags: {
                    'Cost-Center': 'Testing',
                    'Auto-Shutdown': 'false',
                    'Monitoring-Level': 'Enhanced',
                },
            },
            prod: {
                customTags: {
                    'Cost-Center': 'Production',
                    'Auto-Shutdown': 'false',
                    'Monitoring-Level': 'Full',
                    'Backup-Required': 'true',
                    'DR-Required': 'true',
                },
            },
        };
        return configs[environment] || configs.dev;
    }
    /**
     * セキュリティ要件に基づくタグ設定を取得
     */
    static getSecurityConfig(environment) {
        const securityConfigs = {
            dev: {
                customTags: {
                    'Security-Level': 'Basic',
                    'Data-Classification': 'Internal',
                    'Encryption-Required': 'false',
                    'Access-Review': 'Quarterly',
                },
            },
            staging: {
                customTags: {
                    'Security-Level': 'Enhanced',
                    'Data-Classification': 'Confidential',
                    'Encryption-Required': 'true',
                    'Access-Review': 'Monthly',
                },
            },
            prod: {
                customTags: {
                    'Security-Level': 'Maximum',
                    'Data-Classification': 'Restricted',
                    'Encryption-Required': 'true',
                    'Access-Review': 'Weekly',
                    'Compliance-Required': 'true',
                    'Audit-Required': 'true',
                },
            },
        };
        return securityConfigs[environment] || securityConfigs.dev;
    }
}
exports.PermissionAwareRAGTags = PermissionAwareRAGTags;
