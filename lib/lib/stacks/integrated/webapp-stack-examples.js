"use strict";
/**
 * WebAppスタック使用例とベストプラクティス
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprehensiveWebAppStackExample = exports.WebAppStackBestPractices = void 0;
exports.createDevelopmentWebAppStack = createDevelopmentWebAppStack;
exports.createEnvironmentSpecificWebAppStack = createEnvironmentSpecificWebAppStack;
exports.createStandardWebAppStack = createStandardWebAppStack;
exports.createSecureWebAppStack = createSecureWebAppStack;
exports.createHighAvailabilityWebAppStack = createHighAvailabilityWebAppStack;
// 改善版インポート
const webapp_stack_improved_1 = require("./webapp-stack-improved");
// 戦略パターンインポート
const webapp_stack_strategies_1 = require("./webapp-stack-strategies");
// テンプレートメソッドインポート
const webapp_stack_template_1 = require("./webapp-stack-template");
/**
 * 使用例1: Builder Patternを使用した開発環境スタック
 */
function createDevelopmentWebAppStack(scope, dependencies) {
    const config = new webapp_stack_improved_1.WebAppStackConfigBuilder()
        .setBasicConfig('permission-aware-rag', 'dev')
        .setCognitoConfig(webapp_stack_improved_1.CognitoConfigFactory.createDefaultConfig('permission-aware-rag', 'dev'))
        .setDefaultConfigs()
        .build();
    return new webapp_stack_improved_1.WebAppStack(scope, 'DevWebAppStack', {
        config,
        ...dependencies,
    });
}
/**
 * 使用例2: Strategy Patternを使用した環境別スタック
 */
function createEnvironmentSpecificWebAppStack(scope, environment, dependencies) {
    const configContext = new webapp_stack_strategies_1.WebAppConfigContext(environment);
    const baseConfig = configContext.createConfig('permission-aware-rag', environment);
    const config = new webapp_stack_improved_1.WebAppStackConfigBuilder()
        .setBasicConfig(baseConfig.projectName, baseConfig.environment)
        .setCognitoConfig(baseConfig.cognitoConfig)
        .setLambdaConfig(baseConfig.lambdaConfig)
        .setOutputConfig(baseConfig.outputConfig)
        .build();
    return new webapp_stack_improved_1.WebAppStack(scope, `${environment}WebAppStack`, {
        config,
        ...dependencies,
    });
}
/**
 * 使用例3: Template Method Patternを使用した標準スタック
 */
function createStandardWebAppStack(scope, environment, dependencies) {
    const strategy = webapp_stack_strategies_1.WebAppConfigStrategyFactory.createStrategy(environment);
    const config = strategy.createFullConfig('permission-aware-rag', environment);
    return new webapp_stack_template_1.StandardWebAppStack(scope, `StandardWebAppStack-${environment}`, {
        ...config,
        // ApiConfigは別途設定が必要
        apiConfig: {}, // 実際の実装では適切なApiConfigを設定
    }, dependencies);
}
/**
 * 使用例4: セキュリティ強化スタック
 */
function createSecureWebAppStack(scope, dependencies) {
    const strategy = webapp_stack_strategies_1.WebAppConfigStrategyFactory.createStrategy('production');
    const config = strategy.createFullConfig('permission-aware-rag', 'prod');
    return new webapp_stack_template_1.SecureWebAppStack(scope, 'SecureWebAppStack', {
        ...config,
        apiConfig: {}, // 実際の実装では適切なApiConfigを設定
    }, dependencies);
}
/**
 * 使用例5: 高可用性スタック
 */
function createHighAvailabilityWebAppStack(scope, dependencies) {
    const strategy = webapp_stack_strategies_1.WebAppConfigStrategyFactory.createStrategy('enterprise');
    const config = strategy.createFullConfig('permission-aware-rag', 'enterprise');
    return new webapp_stack_template_1.HighAvailabilityWebAppStack(scope, 'HAWebAppStack', {
        ...config,
        apiConfig: {}, // 実際の実装では適切なApiConfigを設定
    }, dependencies);
}
/**
 * ベストプラクティス例: 設定の検証と最適化
 */
class WebAppStackBestPractices {
    /**
     * 環境別設定の検証
     */
    static validateEnvironmentConfig(environment) {
        const supportedEnvironments = webapp_stack_strategies_1.WebAppConfigStrategyFactory.getSupportedEnvironments();
        return supportedEnvironments.includes(environment.toLowerCase());
    }
    /**
     * セキュリティ設定の推奨事項チェック
     */
    static checkSecurityRecommendations(environment) {
        const recommendations = [];
        const strategy = webapp_stack_strategies_1.WebAppConfigStrategyFactory.createStrategy(environment);
        const config = strategy.createFullConfig('test', environment);
        // パスワードポリシーチェック
        const passwordPolicy = config.cognitoConfig.userPool.passwordPolicy;
        if (passwordPolicy.minLength < 8) {
            recommendations.push('パスワード最小長を8文字以上に設定することを推奨します');
        }
        if (!passwordPolicy.requireSymbols && environment === 'prod') {
            recommendations.push('本番環境では記号を必須にすることを推奨します');
        }
        // セルフサインアップチェック
        if (config.cognitoConfig.userPool.selfSignUpEnabled && environment === 'prod') {
            recommendations.push('本番環境ではセルフサインアップを無効にすることを推奨します');
        }
        // 未認証アクセスチェック
        if (config.cognitoConfig.identityPool.allowUnauthenticatedIdentities) {
            recommendations.push('未認証アクセスを無効にすることを推奨します');
        }
        return recommendations;
    }
    /**
     * パフォーマンス最適化の推奨事項
     */
    static getPerformanceRecommendations(environment) {
        const recommendations = [];
        if (environment === 'prod') {
            recommendations.push('本番環境ではVPC設定を有効にすることを推奨します');
            recommendations.push('CloudFrontキャッシュ設定を最適化することを推奨します');
            recommendations.push('Lambda関数のメモリサイズを調整することを推奨します');
        }
        return recommendations;
    }
    /**
     * コスト最適化の推奨事項
     */
    static getCostOptimizationRecommendations(environment) {
        const recommendations = [];
        if (environment === 'dev') {
            recommendations.push('開発環境では不要な出力を無効にしてコストを削減できます');
            recommendations.push('開発環境ではリソースの自動削除を有効にできます');
        }
        return recommendations;
    }
}
exports.WebAppStackBestPractices = WebAppStackBestPractices;
/**
 * 統合使用例: 全ての改善パターンを組み合わせた例
 */
class ComprehensiveWebAppStackExample {
    static create(scope, projectName, environment, dependencies) {
        // 1. 環境検証
        if (!WebAppStackBestPractices.validateEnvironmentConfig(environment)) {
            throw new Error(`サポートされていない環境: ${environment}`);
        }
        // 2. セキュリティ推奨事項の確認
        const securityRecommendations = WebAppStackBestPractices.checkSecurityRecommendations(environment);
        if (securityRecommendations.length > 0) {
            console.warn('セキュリティ推奨事項:', securityRecommendations);
        }
        // 3. Strategy Patternで環境別設定を取得
        const configContext = new webapp_stack_strategies_1.WebAppConfigContext(environment);
        const baseConfig = configContext.createConfig(projectName, environment);
        // 4. Builder Patternで設定を構築
        const config = new webapp_stack_improved_1.WebAppStackConfigBuilder()
            .setBasicConfig(baseConfig.projectName, baseConfig.environment)
            .setCognitoConfig(baseConfig.cognitoConfig)
            .setLambdaConfig(baseConfig.lambdaConfig)
            .setOutputConfig(baseConfig.outputConfig)
            .build();
        // 5. 改善されたWebAppStackを作成
        return new webapp_stack_improved_1.WebAppStack(scope, `${projectName}-${environment}-webapp`, {
            config,
            ...dependencies,
        });
    }
}
exports.ComprehensiveWebAppStackExample = ComprehensiveWebAppStackExample;
