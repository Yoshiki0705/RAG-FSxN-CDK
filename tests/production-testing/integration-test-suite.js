"use strict";
/**
 * 統合テストスイート - メインエントリーポイント
 *
 * 全テストモジュールを統合し、包括的なテストを実行
 * - 認証テスト
 * - アクセス制御テスト
 * - チャットボットテスト
 * - パフォーマンステスト
 * - UI/UXテスト
 * - セキュリティテスト
 * - 統合テスト
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultIntegrationTestSuiteConfig = exports.IntegrationTestSuite = void 0;
const production_test_engine_1 = require("./core/production-test-engine");
const emergency_stop_manager_1 = require("./core/emergency-stop-manager");
const production_connection_manager_1 = require("./core/production-connection-manager");
// テストモジュールのインポート
const authentication_test_module_1 = require("./modules/authentication/authentication-test-module");
const access_control_test_module_1 = require("./modules/access-control/access-control-test-module");
const chatbot_test_module_1 = require("./modules/chatbot/chatbot-test-module");
const performance_test_module_1 = require("./modules/performance/performance-test-module");
const ui_ux_test_module_1 = require("./modules/ui-ux/ui-ux-test-module");
const security_test_module_1 = require("./modules/security/security-test-module");
const integration_test_module_1 = require("./modules/integration/integration-test-module");
/**
 * 統合テストスイートクラス
 */
class IntegrationTestSuite {
    config;
    testEngine;
    emergencyStop;
    connectionManager;
    // テストモジュール
    authModule;
    accessModule;
    chatbotModule;
    performanceModule;
    uiUxModule;
    securityModule;
    integrationModule;
    constructor(config) {
        this.config = config;
        this.initializeComponents();
    }
    /**
     * コンポーネントの初期化
     */
    initializeComponents() {
        console.log('🔧 統合テストスイートを初期化中...');
        // コアコンポーネントの初期化
        this.testEngine = new production_test_engine_1.ProductionTestEngine(production_config_1.ProductionConfig);
        this.emergencyStop = new emergency_stop_manager_1.EmergencyStopManager();
        this.connectionManager = new production_connection_manager_1.ProductionConnectionManager(production_config_1.ProductionConfig);
        // テストモジュールの初期化
        if (this.config.enabledModules.authentication) {
            this.authModule = new authentication_test_module_1.AuthenticationTestModule();
        }
        if (this.config.enabledModules.accessControl) {
            this.accessModule = new access_control_test_module_1.AccessControlTestModule();
        }
        if (this.config.enabledModules.chatbot) {
            this.chatbotModule = new chatbot_test_module_1.ChatbotTestModule();
        }
        if (this.config.enabledModules.performance) {
            this.performanceModule = new performance_test_module_1.PerformanceTestModule();
        }
        if (this.config.enabledModules.uiUx) {
            this.uiUxModule = new ui_ux_test_module_1.UiUxTestModule();
        }
        if (this.config.enabledModules.security) {
            this.securityModule = new security_test_module_1.SecurityTestModule();
        }
        if (this.config.enabledModules.integration) {
            this.integrationModule = new integration_test_module_1.IntegrationTestModule();
        }
        console.log('✅ 統合テストスイート初期化完了');
    }
    /**
     * 統合テストスイートの実行
     */
    async execute() {
        const startTime = new Date().toISOString();
        console.log('🚀 統合テストスイート実行開始');
        console.log(`📊 実行モード: ${this.config.executionMode}`);
        try {
            // 緊急停止機能の有効化
            if (this.config.execution.emergencyStopEnabled) {
                this.emergencyStop.enable();
            }
            // 本番環境への接続確立
            await this.connectionManager.connect();
            // テスト実行
            const results = await this.executeTests();
            // 結果分析
            const analysis = await this.analyzeResults(results);
            // 統合結果の構築
            const integrationResult = await this.buildIntegrationResult(results, analysis, startTime);
            console.log('✅ 統合テストスイート実行完了');
            return integrationResult;
        }
        catch (error) {
            console.error('❌ 統合テストスイート実行エラー:', error);
            throw error;
        }
        finally {
            // クリーンアップ
            await this.cleanup();
        }
    }
    /**
     * テストの実行
     */
    async executeTests() {
        console.log('🔄 テストモジュール実行中...');
        const results = {};
        switch (this.config.executionMode) {
            case 'sequential':
                return await this.executeSequential();
            case 'parallel':
                return await this.executeParallel();
            case 'hybrid':
                return await this.executeHybrid();
            default:
                throw new Error(`未対応の実行モード: ${this.config.executionMode}`);
        }
    }
    /**
     * 順次実行
     */
    async executeSequential() {
        console.log('📋 順次実行モードでテスト実行中...');
        const results = {};
        const executionOrder = this.getExecutionOrder();
        for (const moduleName of executionOrder) {
            if (this.emergencyStop.isStopRequested()) {
                console.log('🛑 緊急停止が要求されました');
                break;
            }
            console.log(`🔄 ${moduleName}テスト実行中...`);
            try {
                const moduleResult = await this.executeModule(moduleName);
                results[moduleName] = moduleResult;
                // 失敗時の停止判定
                if (this.config.execution.stopOnFirstFailure && !moduleResult.success) {
                    console.log(`❌ ${moduleName}テスト失敗により実行停止`);
                    break;
                }
            }
            catch (error) {
                console.error(`❌ ${moduleName}テスト実行エラー:`, error);
                results[moduleName] = { success: false, error: error.message };
                if (this.config.execution.stopOnFirstFailure) {
                    break;
                }
            }
        }
        return results;
    }
    /**
     * 並列実行
     */
    async executeParallel() {
        console.log('⚡ 並列実行モードでテスト実行中...');
        const enabledModules = Object.entries(this.config.enabledModules)
            .filter(([_, enabled]) => enabled)
            .map(([name, _]) => name);
        // 並列実行数の制限
        const chunks = this.chunkArray(enabledModules, this.config.execution.maxParallelTests);
        const results = {};
        for (const chunk of chunks) {
            const promises = chunk.map(async (moduleName) => {
                try {
                    const result = await this.executeModule(moduleName);
                    return { moduleName, result };
                }
                catch (error) {
                    return { moduleName, result: { success: false, error: error.message } };
                }
            });
            const chunkResults = await Promise.all(promises);
            for (const { moduleName, result } of chunkResults) {
                results[moduleName] = result;
            }
        }
        return results;
    }
    /**
     * ハイブリッド実行（依存関係を考慮した最適化実行）
     */
    async executeHybrid() {
        console.log('🔄 ハイブリッド実行モードでテスト実行中...');
        const results = {};
        // Phase 1: 基盤テスト（順次実行）
        const foundationTests = ['authentication', 'accessControl'];
        for (const moduleName of foundationTests) {
            if (this.config.enabledModules[moduleName]) {
                results[moduleName] = await this.executeModule(moduleName);
            }
        }
        // Phase 2: 機能テスト（並列実行）
        const functionalTests = ['chatbot', 'uiUx'];
        const functionalPromises = functionalTests
            .filter(name => this.config.enabledModules[name])
            .map(async (moduleName) => {
            const result = await this.executeModule(moduleName);
            return { moduleName, result };
        });
        const functionalResults = await Promise.all(functionalPromises);
        for (const { moduleName, result } of functionalResults) {
            results[moduleName] = result;
        }
        // Phase 3: 品質テスト（順次実行）
        const qualityTests = ['performance', 'security', 'integration'];
        for (const moduleName of qualityTests) {
            if (this.config.enabledModules[moduleName]) {
                results[moduleName] = await this.executeModule(moduleName);
            }
        }
        return results;
    }
    /**
     * 個別モジュールの実行
     */
    async executeModule(moduleName) {
        const timeout = this.config.execution.timeoutPerModule;
        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`${moduleName}テストがタイムアウトしました (${timeout}ms)`));
            }, timeout);
            try {
                let result;
                switch (moduleName) {
                    case 'authentication':
                        result = await this.authModule.execute();
                        break;
                    case 'accessControl':
                        result = await this.accessModule.execute();
                        break;
                    case 'chatbot':
                        result = await this.chatbotModule.execute();
                        break;
                    case 'performance':
                        result = await this.performanceModule.execute();
                        break;
                    case 'uiUx':
                        result = await this.uiUxModule.execute();
                        break;
                    case 'security':
                        result = await this.securityModule.execute();
                        break;
                    case 'integration':
                        result = await this.integrationModule.execute();
                        break;
                    default:
                        throw new Error(`未知のモジュール: ${moduleName}`);
                }
                clearTimeout(timer);
                resolve(result);
            }
            catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }
    /**
     * 実行順序の取得
     */
    getExecutionOrder() {
        const order = [];
        // 依存関係を考慮した実行順序
        if (this.config.enabledModules.authentication)
            order.push('authentication');
        if (this.config.enabledModules.accessControl)
            order.push('accessControl');
        if (this.config.enabledModules.chatbot)
            order.push('chatbot');
        if (this.config.enabledModules.uiUx)
            order.push('uiUx');
        if (this.config.enabledModules.performance)
            order.push('performance');
        if (this.config.enabledModules.security)
            order.push('security');
        if (this.config.enabledModules.integration)
            order.push('integration');
        return order;
    }
    /**
     * 配列のチャンク分割
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    /**
     * 結果分析
     */
    async analyzeResults(results) {
        console.log('📊 テスト結果を分析中...');
        const analysis = {
            criticalIssues: [],
            recommendations: [],
            performanceBottlenecks: [],
            securityConcerns: []
        };
        // 各モジュール結果の分析
        for (const [moduleName, result] of Object.entries(results)) {
            if (!result || !result.success) {
                analysis.criticalIssues.push(`${moduleName}テストが失敗しました`);
            }
            // モジュール固有の分析
            await this.analyzeModuleResult(moduleName, result, analysis);
        }
        return analysis;
    }
    /**
     * モジュール別結果分析
     */
    async analyzeModuleResult(moduleName, result, analysis) {
        if (!result)
            return;
        switch (moduleName) {
            case 'performance':
                if (result.metrics?.responseTime > this.config.qualityThresholds.maxAcceptableResponseTime) {
                    analysis.performanceBottlenecks.push(`応答時間が基準値を超過: ${result.metrics.responseTime}ms`);
                }
                break;
            case 'security':
                if (result.securityScore < this.config.qualityThresholds.minSecurityScore) {
                    analysis.securityConcerns.push(`セキュリティスコアが基準値を下回る: ${result.securityScore}`);
                }
                break;
            case 'uiUx':
                if (result.accessibilityScore < this.config.qualityThresholds.minAccessibilityScore) {
                    analysis.recommendations.push(`アクセシビリティの改善が必要: ${result.accessibilityScore}`);
                }
                break;
        }
    }
    /**
     * 統合結果の構築
     */
    async buildIntegrationResult(results, analysis, startTime) {
        const endTime = new Date().toISOString();
        // 全体統計の計算
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let skippedTests = 0;
        for (const result of Object.values(results)) {
            if (result && typeof result === 'object') {
                const r = result;
                totalTests += r.totalTests || 0;
                passedTests += r.passedTests || 0;
                failedTests += r.failedTests || 0;
                skippedTests += r.skippedTests || 0;
            }
        }
        // 品質スコアの計算
        const qualityScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        // 実行時間の計算
        const executionTime = new Date(endTime).getTime() - new Date(startTime).getTime();
        return {
            overall: {
                success: failedTests === 0 && analysis.criticalIssues.length === 0,
                totalTests,
                passedTests,
                failedTests,
                skippedTests,
                executionTime,
                qualityScore
            },
            modules: results,
            analysis,
            metadata: {
                startTime,
                endTime,
                environment: 'production',
                testSuiteVersion: '1.0.0'
            }
        };
    }
    /**
     * クリーンアップ
     */
    async cleanup() {
        console.log('🧹 クリーンアップ実行中...');
        try {
            // 緊急停止機能の無効化
            this.emergencyStop.disable();
            // 接続の切断
            await this.connectionManager.disconnect();
            console.log('✅ クリーンアップ完了');
        }
        catch (error) {
            console.error('⚠️ クリーンアップエラー:', error);
        }
    }
}
exports.IntegrationTestSuite = IntegrationTestSuite;
// デフォルト設定
exports.DefaultIntegrationTestSuiteConfig = {
    executionMode: 'hybrid',
    enabledModules: {
        authentication: true,
        accessControl: true,
        chatbot: true,
        performance: true,
        uiUx: true,
        security: true,
        integration: true
    },
    execution: {
        maxParallelTests: 3,
        timeoutPerModule: 300000, // 5分
        retryAttempts: 2,
        stopOnFirstFailure: false,
        emergencyStopEnabled: true
    },
    reporting: {
        generateDetailedReport: true,
        generateExecutiveSummary: true,
        includePerformanceMetrics: true,
        includeScreenshots: true,
        outputFormat: 'both'
    },
    qualityThresholds: {
        minimumPassRate: 95,
        maxAcceptableResponseTime: 3000,
        minSecurityScore: 85,
        minAccessibilityScore: 90
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyYXRpb24tdGVzdC1zdWl0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVncmF0aW9uLXRlc3Qtc3VpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7OztHQVdHOzs7QUFFSCwwRUFBcUU7QUFDckUsMEVBQXFFO0FBQ3JFLHdGQUFtRjtBQUduRixpQkFBaUI7QUFDakIsb0dBQStGO0FBQy9GLG9HQUE4RjtBQUM5RiwrRUFBMEU7QUFDMUUsMkZBQXNGO0FBQ3RGLHlFQUFtRTtBQUNuRSxrRkFBNkU7QUFDN0UsMkZBQXNGO0FBdUZ0Rjs7R0FFRztBQUNILE1BQWEsb0JBQW9CO0lBQ3ZCLE1BQU0sQ0FBNkI7SUFDbkMsVUFBVSxDQUF1QjtJQUNqQyxhQUFhLENBQXVCO0lBQ3BDLGlCQUFpQixDQUE4QjtJQUV2RCxXQUFXO0lBQ0gsVUFBVSxDQUEyQjtJQUNyQyxZQUFZLENBQTBCO0lBQ3RDLGFBQWEsQ0FBb0I7SUFDakMsaUJBQWlCLENBQXdCO0lBQ3pDLFVBQVUsQ0FBaUI7SUFDM0IsY0FBYyxDQUFxQjtJQUNuQyxpQkFBaUIsQ0FBd0I7SUFFakQsWUFBWSxNQUFrQztRQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRUQ7O09BRUc7SUFDSyxvQkFBb0I7UUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBRXBDLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksNkNBQW9CLENBQUMsb0NBQWdCLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksNkNBQW9CLEVBQUUsQ0FBQztRQUNoRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSwyREFBMkIsQ0FBQyxvQ0FBZ0IsQ0FBQyxDQUFDO1FBRTNFLGVBQWU7UUFDZixJQUFJLElBQUksQ0FB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STtRQUM1Qix3QkFBd0IsRUFBRSxJQUFJO1FBQzlCLHlCQUF5QixFQUFFLElBQUk7UUFDL0Isa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixZQUFZLEVBQUUsTUFBTTtLQUNyQjtJQUNELGlCQUFpQixFQUFFO1FBQ2pCLGVBQWUsRUFBRSxFQUFFO1FBQ25CLHlCQUF5QixFQUFFLElBQUk7UUFDL0IsZ0JBQWdCLEVBQUUsRUFBRTtRQUNwQixxQkFBcUIsRUFBRSxFQUFFO0tBQzFCO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog57Wx5ZCI44OG44K544OI44K544Kk44O844OIIC0g44Oh44Kk44Oz44Ko44Oz44OI44Oq44O844Od44Kk44Oz44OIXG4gKiBcbiAqIOWFqOODhuOCueODiOODouOCuOODpeODvOODq+OCkue1seWQiOOBl+OAgeWMheaLrOeahOOBquODhuOCueODiOOCkuWun+ihjFxuICogLSDoqo3oqLzjg4bjgrnjg4hcbiAqIC0g44Ki44Kv44K744K55Yi25b6h44OG44K544OIICBcbiAqIC0g44OB44Oj44OD44OI44Oc44OD44OI44OG44K544OIXG4gKiAtIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiFxuICogLSBVSS9VWOODhuOCueODiFxuICogLSDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4hcbiAqIC0g57Wx5ZCI44OG44K544OIXG4gKi9cblxuaW1wb3J0IHsgUHJvZHVjdGlvblRlc3RFbmdpbmUgfSBmcm9tICcuL2NvcmUvcHJvZHVjdGlvbi10ZXN0LWVuZ2luZSc7XG5pbXBvcnQgeyBFbWVyZ2VuY3lTdG9wTWFuYWdlciB9IGZyb20gJy4vY29yZS9lbWVyZ2VuY3ktc3RvcC1tYW5hZ2VyJztcbmltcG9ydCB7IFByb2R1Y3Rpb25Db25uZWN0aW9uTWFuYWdlciB9IGZyb20gJy4vY29yZS9wcm9kdWN0aW9uLWNvbm5lY3Rpb24tbWFuYWdlcic7XG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuXG4vLyDjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjga7jgqTjg7Pjg53jg7zjg4hcbmltcG9ydCB7IEF1dGhlbnRpY2F0aW9uVGVzdE1vZHVsZSB9IGZyb20gJy4vbW9kdWxlcy9hdXRoZW50aWNhdGlvbi9hdXRoZW50aWNhdGlvbi10ZXN0LW1vZHVsZSc7XG5pbXBvcnQgeyBBY2Nlc3NDb250cm9sVGVzdE1vZHVsZSB9IGZyb20gJy4vbW9kdWxlcy9hY2Nlc3MtY29udHJvbC9hY2Nlc3MtY29udHJvbC10ZXN0LW1vZHVsZSc7XG5pbXBvcnQgeyBDaGF0Ym90VGVzdE1vZHVsZSB9IGZyb20gJy4vbW9kdWxlcy9jaGF0Ym90L2NoYXRib3QtdGVzdC1tb2R1bGUnO1xuaW1wb3J0IHsgUGVyZm9ybWFuY2VUZXN0TW9kdWxlIH0gZnJvbSAnLi9tb2R1bGVzL3BlcmZvcm1hbmNlL3BlcmZvcm1hbmNlLXRlc3QtbW9kdWxlJztcbmltcG9ydCB7IFVpVXhUZXN0TW9kdWxlIH0gZnJvbSAnLi9tb2R1bGVzL3VpLXV4L3VpLXV4LXRlc3QtbW9kdWxlJztcbmltcG9ydCB7IFNlY3VyaXR5VGVzdE1vZHVsZSB9IGZyb20gJy4vbW9kdWxlcy9zZWN1cml0eS9zZWN1cml0eS10ZXN0LW1vZHVsZSc7XG5pbXBvcnQgeyBJbnRlZ3JhdGlvblRlc3RNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvaW50ZWdyYXRpb24vaW50ZWdyYXRpb24tdGVzdC1tb2R1bGUnO1xuXG4vLyDntbHlkIjjg4bjgrnjg4jlrp/ooYzoqK3lrppcbmludGVyZmFjZSBJbnRlZ3JhdGlvblRlc3RTdWl0ZUNvbmZpZyB7XG4gIC8vIOWun+ihjOODouODvOODieioreWumlxuICBleGVjdXRpb25Nb2RlOiAnc2VxdWVudGlhbCcgfCAncGFyYWxsZWwnIHwgJ2h5YnJpZCc7XG4gIFxuICAvLyDjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vpgbjmip5cbiAgZW5hYmxlZE1vZHVsZXM6IHtcbiAgICBhdXRoZW50aWNhdGlvbjogYm9vbGVhbjtcbiAgICBhY2Nlc3NDb250cm9sOiBib29sZWFuO1xuICAgIGNoYXRib3Q6IGJvb2xlYW47XG4gICAgcGVyZm9ybWFuY2U6IGJvb2xlYW47XG4gICAgdWlVeDogYm9vbGVhbjtcbiAgICBzZWN1cml0eTogYm9vbGVhbjtcbiAgICBpbnRlZ3JhdGlvbjogYm9vbGVhbjtcbiAgfTtcbiAgXG4gIC8vIOWun+ihjOWItuW+oeioreWumlxuICBleGVjdXRpb246IHtcbiAgICBtYXhQYXJhbGxlbFRlc3RzOiBudW1iZXI7XG4gICAgdGltZW91dFBlck1vZHVsZTogbnVtYmVyO1xuICAgIHJldHJ5QXR0ZW1wdHM6IG51bWJlcjtcbiAgICBzdG9wT25GaXJzdEZhaWx1cmU6IGJvb2xlYW47XG4gICAgZW1lcmdlbmN5U3RvcEVuYWJsZWQ6IGJvb2xlYW47XG4gIH07XG4gIFxuICAvLyDjg6zjg53jg7zjg4joqK3lrppcbiAgcmVwb3J0aW5nOiB7XG4gICAgZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydDogYm9vbGVhbjtcbiAgICBnZW5lcmF0ZUV4ZWN1dGl2ZVN1bW1hcnk6IGJvb2xlYW47XG4gICAgaW5jbHVkZVBlcmZvcm1hbmNlTWV0cmljczogYm9vbGVhbjtcbiAgICBpbmNsdWRlU2NyZWVuc2hvdHM6IGJvb2xlYW47XG4gICAgb3V0cHV0Rm9ybWF0OiAnanNvbicgfCAnaHRtbCcgfCAnYm90aCc7XG4gIH07XG4gIFxuICAvLyDlk4Hos6rln7rmupboqK3lrppcbiAgcXVhbGl0eVRocmVzaG9sZHM6IHtcbiAgICBtaW5pbXVtUGFzc1JhdGU6IG51bWJlcjtcbiAgICBtYXhBY2NlcHRhYmxlUmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gICAgbWluU2VjdXJpdHlTY29yZTogbnVtYmVyO1xuICAgIG1pbkFjY2Vzc2liaWxpdHlTY29yZTogbnVtYmVyO1xuICB9O1xufVxuXG4vLyDjg4bjgrnjg4jlrp/ooYzntZDmnpxcbmludGVyZmFjZSBJbnRlZ3JhdGlvblRlc3RSZXN1bHQge1xuICAvLyDlhajkvZPntZDmnpxcbiAgb3ZlcmFsbDoge1xuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XG4gICAgdG90YWxUZXN0czogbnVtYmVyO1xuICAgIHBhc3NlZFRlc3RzOiBudW1iZXI7XG4gICAgZmFpbGVkVGVzdHM6IG51bWJlcjtcbiAgICBza2lwcGVkVGVzdHM6IG51bWJlcjtcbiAgICBleGVjdXRpb25UaW1lOiBudW1iZXI7XG4gICAgcXVhbGl0eVNjb3JlOiBudW1iZXI7XG4gIH07XG4gIFxuICAvLyDjg6Ljgrjjg6Xjg7zjg6vliKXntZDmnpxcbiAgbW9kdWxlczoge1xuICAgIGF1dGhlbnRpY2F0aW9uPzogYW55O1xuICAgIGFjY2Vzc0NvbnRyb2w/OiBhbnk7XG4gICAgY2hhdGJvdD86IGFueTtcbiAgICBwZXJmb3JtYW5jZT86IGFueTtcbiAgICB1aVV4PzogYW55O1xuICAgIHNlY3VyaXR5PzogYW55O1xuICAgIGludGVncmF0aW9uPzogYW55O1xuICB9O1xuICBcbiAgLy8g57Wx5ZCI5YiG5p6Q57WQ5p6cXG4gIGFuYWx5c2lzOiB7XG4gICAgY3JpdGljYWxJc3N1ZXM6IHN0cmluZ1tdO1xuICAgIHJlY29tbWVuZGF0aW9uczogc3RyaW5nW107XG4gICAgcGVyZm9ybWFuY2VCb3R0bGVuZWNrczogc3RyaW5nW107XG4gICAgc2VjdXJpdHlDb25jZXJuczogc3RyaW5nW107XG4gIH07XG4gIFxuICAvLyDlrp/ooYzjg6Hjgr/jg4fjg7zjgr9cbiAgbWV0YWRhdGE6IHtcbiAgICBzdGFydFRpbWU6IHN0cmluZztcbiAgICBlbmRUaW1lOiBzdHJpbmc7XG4gICAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgICB0ZXN0U3VpdGVWZXJzaW9uOiBzdHJpbmc7XG4gICAgYnJvd3NlckluZm8/OiBhbnk7XG4gIH07XG59XG5cbi8qKlxuICog57Wx5ZCI44OG44K544OI44K544Kk44O844OI44Kv44Op44K5XG4gKi9cbmV4cG9ydCBjbGFzcyBJbnRlZ3JhdGlvblRlc3RTdWl0ZSB7XG4gIHByaXZhdGUgY29uZmlnOiBJbnRlZ3JhdGlvblRlc3RTdWl0ZUNvbmZpZztcbiAgcHJpdmF0ZSB0ZXN0RW5naW5lOiBQcm9kdWN0aW9uVGVzdEVuZ2luZTtcbiAgcHJpdmF0ZSBlbWVyZ2VuY3lTdG9wOiBFbWVyZ2VuY3lTdG9wTWFuYWdlcjtcbiAgcHJpdmF0ZSBjb25uZWN0aW9uTWFuYWdlcjogUHJvZHVjdGlvbkNvbm5lY3Rpb25NYW5hZ2VyO1xuICBcbiAgLy8g44OG44K544OI44Oi44K444Ol44O844OrXG4gIHByaXZhdGUgYXV0aE1vZHVsZTogQXV0aGVudGljYXRpb25UZXN0TW9kdWxlO1xuICBwcml2YXRlIGFjY2Vzc01vZHVsZTogQWNjZXNzQ29udHJvbFRlc3RNb2R1bGU7XG4gIHByaXZhdGUgY2hhdGJvdE1vZHVsZTogQ2hhdGJvdFRlc3RNb2R1bGU7XG4gIHByaXZhdGUgcGVyZm9ybWFuY2VNb2R1bGU6IFBlcmZvcm1hbmNlVGVzdE1vZHVsZTtcbiAgcHJpdmF0ZSB1aVV4TW9kdWxlOiBVaVV4VGVzdE1vZHVsZTtcbiAgcHJpdmF0ZSBzZWN1cml0eU1vZHVsZTogU2VjdXJpdHlUZXN0TW9kdWxlO1xuICBwcml2YXRlIGludGVncmF0aW9uTW9kdWxlOiBJbnRlZ3JhdGlvblRlc3RNb2R1bGU7XG4gIFxuICBjb25zdHJ1Y3Rvcihjb25maWc6IEludGVncmF0aW9uVGVzdFN1aXRlQ29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5pbml0aWFsaXplQ29tcG9uZW50cygpO1xuICB9XG4gIFxuICAvKipcbiAgICog44Kz44Oz44Od44O844ON44Oz44OI44Gu5Yid5pyf5YyWXG4gICAqL1xuICBwcml2YXRlIGluaXRpYWxpemVDb21wb25lbnRzKCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKCfwn5SnIOe1seWQiOODhuOCueODiOOCueOCpOODvOODiOOCkuWIneacn+WMluS4rS4uLicpO1xuICAgIFxuICAgIC8vIOOCs+OCouOCs+ODs+ODneODvOODjeODs+ODiOOBruWIneacn+WMllxuICAgIHRoaXMudGVzdEVuZ2luZSA9IG5ldyBQcm9kdWN0aW9uVGVzdEVuZ2luZShQcm9kdWN0aW9uQ29uZmlnKTtcbiAgICB0aGlzLmVtZXJnZW5jeVN0b3AgPSBuZXcgRW1lcmdlbmN5U3RvcE1hbmFnZXIoKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gbmV3IFByb2R1Y3Rpb25Db25uZWN0aW9uTWFuYWdlcihQcm9kdWN0aW9uQ29uZmlnKTtcbiAgICBcbiAgICAvLyDjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjga7liJ3mnJ/ljJZcbiAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZE1vZHVsZXMuYXV0aGVudGljYXRpb24pIHtcbiAgICAgIHRoaXMuYXV0aE1vZHVsZSA9IG5ldyBBdXRoZW50aWNhdGlvblRlc3RNb2R1bGUoKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzLmFjY2Vzc0NvbnRyb2wpIHtcbiAgICAgIHRoaXMuYWNjZXNzTW9kdWxlID0gbmV3IEFjY2Vzc0NvbnRyb2xUZXN0TW9kdWxlKCk7XG4gICAgfVxuICAgIFxuICAgIGlmICh0aGlzLmNvbmZpZy5lbmFibGVkTW9kdWxlcy5jaGF0Ym90KSB7XG4gICAgICB0aGlzLmNoYXRib3RNb2R1bGUgPSBuZXcgQ2hhdGJvdFRlc3RNb2R1bGUoKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzLnBlcmZvcm1hbmNlKSB7XG4gICAgICB0aGlzLnBlcmZvcm1hbmNlTW9kdWxlID0gbmV3IFBlcmZvcm1hbmNlVGVzdE1vZHVsZSgpO1xuICAgIH1cbiAgICBcbiAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZE1vZHVsZXMudWlVeCkge1xuICAgICAgdGhpcy51aVV4TW9kdWxlID0gbmV3IFVpVXhUZXN0TW9kdWxlKCk7XG4gICAgfVxuICAgIFxuICAgIGlmICh0aGlzLmNvbmZpZy5lbmFibGVkTW9kdWxlcy5zZWN1cml0eSkge1xuICAgICAgdGhpcy5zZWN1cml0eU1vZHVsZSA9IG5ldyBTZWN1cml0eVRlc3RNb2R1bGUoKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzLmludGVncmF0aW9uKSB7XG4gICAgICB0aGlzLmludGVncmF0aW9uTW9kdWxlID0gbmV3IEludGVncmF0aW9uVGVzdE1vZHVsZSgpO1xuICAgIH1cbiAgICBcbiAgICBjb25zb2xlLmxvZygn4pyFIOe1seWQiOODhuOCueODiOOCueOCpOODvOODiOWIneacn+WMluWujOS6hicpO1xuICB9XG4gIFxuICAvKipcbiAgICog57Wx5ZCI44OG44K544OI44K544Kk44O844OI44Gu5a6f6KGMXG4gICAqL1xuICBhc3luYyBleGVjdXRlKCk6IFByb21pc2U8SW50ZWdyYXRpb25UZXN0UmVzdWx0PiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIGNvbnNvbGUubG9nKCfwn5qAIOe1seWQiOODhuOCueODiOOCueOCpOODvOODiOWun+ihjOmWi+WniycpO1xuICAgIGNvbnNvbGUubG9nKGDwn5OKIOWun+ihjOODouODvOODiTogJHt0aGlzLmNvbmZpZy5leGVjdXRpb25Nb2RlfWApO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAvLyDnt4rmgKXlgZzmraLmqZ/og73jga7mnInlirnljJZcbiAgICAgIGlmICh0aGlzLmNvbmZpZy5leGVjdXRpb24uZW1lcmdlbmN5U3RvcEVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5lbWVyZ2VuY3lTdG9wLmVuYWJsZSgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyDmnKznlarnkrDlooPjgbjjga7mjqXntprnorrnq4tcbiAgICAgIGF3YWl0IHRoaXMuY29ubmVjdGlvbk1hbmFnZXIuY29ubmVjdCgpO1xuICAgICAgXG4gICAgICAvLyDjg4bjgrnjg4jlrp/ooYxcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLmV4ZWN1dGVUZXN0cygpO1xuICAgICAgXG4gICAgICAvLyDntZDmnpzliIbmnpBcbiAgICAgIGNvbnN0IGFuYWx5c2lzID0gYXdhaXQgdGhpcy5hbmFseXplUmVzdWx0cyhyZXN1bHRzKTtcbiAgICAgIFxuICAgICAgLy8g57Wx5ZCI57WQ5p6c44Gu5qeL56+JXG4gICAgICBjb25zdCBpbnRlZ3JhdGlvblJlc3VsdCA9IGF3YWl0IHRoaXMuYnVpbGRJbnRlZ3JhdGlvblJlc3VsdChcbiAgICAgICAgcmVzdWx0cyxcbiAgICAgICAgYW5hbHlzaXMsXG4gICAgICAgIHN0YXJ0VGltZVxuICAgICAgKTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ+KchSDntbHlkIjjg4bjgrnjg4jjgrnjgqTjg7zjg4jlrp/ooYzlrozkuoYnKTtcbiAgICAgIHJldHVybiBpbnRlZ3JhdGlvblJlc3VsdDtcbiAgICAgIFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg57Wx5ZCI44OG44K544OI44K544Kk44O844OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyDjgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICAgIGF3YWl0IHRoaXMuY2xlYW51cCgpO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIOODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlVGVzdHMoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zb2xlLmxvZygn8J+UhCDjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vlrp/ooYzkuK0uLi4nKTtcbiAgICBcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSB7fTtcbiAgICBcbiAgICBzd2l0Y2ggKHRoaXMuY29uZmlnLmV4ZWN1dGlvbk1vZGUpIHtcbiAgICAgIGNhc2UgJ3NlcXVlbnRpYWwnOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjdXRlU2VxdWVudGlhbCgpO1xuICAgICAgY2FzZSAncGFyYWxsZWwnOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjdXRlUGFyYWxsZWwoKTtcbiAgICAgIGNhc2UgJ2h5YnJpZCc6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWN1dGVIeWJyaWQoKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihg5pyq5a++5b+c44Gu5a6f6KGM44Oi44O844OJOiAke3RoaXMuY29uZmlnLmV4ZWN1dGlvbk1vZGV9YCk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICog6aCG5qyh5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVTZXF1ZW50aWFsKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc29sZS5sb2coJ/Cfk4sg6aCG5qyh5a6f6KGM44Oi44O844OJ44Gn44OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0ge307XG4gICAgY29uc3QgZXhlY3V0aW9uT3JkZXIgPSB0aGlzLmdldEV4ZWN1dGlvbk9yZGVyKCk7XG4gICAgXG4gICAgZm9yIChjb25zdCBtb2R1bGVOYW1lIG9mIGV4ZWN1dGlvbk9yZGVyKSB7XG4gICAgICBpZiAodGhpcy5lbWVyZ2VuY3lTdG9wLmlzU3RvcFJlcXVlc3RlZCgpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5uRIOe3iuaApeWBnOatouOBjOimgeaxguOBleOCjOOBvuOBl+OBnycpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYPCflIQgJHttb2R1bGVOYW1lfeODhuOCueODiOWun+ihjOS4rS4uLmApO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtb2R1bGVSZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVNb2R1bGUobW9kdWxlTmFtZSk7XG4gICAgICAgIHJlc3VsdHNbbW9kdWxlTmFtZV0gPSBtb2R1bGVSZXN1bHQ7XG4gICAgICAgIFxuICAgICAgICAvLyDlpLHmlZfmmYLjga7lgZzmraLliKTlrppcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmV4ZWN1dGlvbi5zdG9wT25GaXJzdEZhaWx1cmUgJiYgIW1vZHVsZVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYOKdjCAke21vZHVsZU5hbWV944OG44K544OI5aSx5pWX44Gr44KI44KK5a6f6KGM5YGc5q2iYCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgJHttb2R1bGVOYW1lfeODhuOCueODiOWun+ihjOOCqOODqeODvDpgLCBlcnJvcik7XG4gICAgICAgIHJlc3VsdHNbbW9kdWxlTmFtZV0gPSB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmV4ZWN1dGlvbi5zdG9wT25GaXJzdEZhaWx1cmUpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOS4puWIl+Wun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlUGFyYWxsZWwoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zb2xlLmxvZygn4pqhIOS4puWIl+Wun+ihjOODouODvOODieOBp+ODhuOCueODiOWun+ihjOS4rS4uLicpO1xuICAgIFxuICAgIGNvbnN0IGVuYWJsZWRNb2R1bGVzID0gT2JqZWN0LmVudHJpZXModGhpcy5jb25maWcuZW5hYmxlZE1vZHVsZXMpXG4gICAgICAuZmlsdGVyKChbXywgZW5hYmxlZF0pID0+IGVuYWJsZWQpXG4gICAgICAubWFwKChbbmFtZSwgX10pID0+IG5hbWUpO1xuICAgIFxuICAgIC8vIOS4puWIl+Wun+ihjOaVsOOBruWItumZkFxuICAgIGNvbnN0IGNodW5rcyA9IHRoaXMuY2h1bmtBcnJheShlbmFibGVkTW9kdWxlcywgdGhpcy5jb25maWcuZXhlY3V0aW9uLm1heFBhcmFsbGVsVGVzdHMpO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueSA9IHt9O1xuICAgIFxuICAgIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgICBjb25zdCBwcm9taXNlcyA9IGNodW5rLm1hcChhc3luYyAobW9kdWxlTmFtZSkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZXhlY3V0ZU1vZHVsZShtb2R1bGVOYW1lKTtcbiAgICAgICAgICByZXR1cm4geyBtb2R1bGVOYW1lLCByZXN1bHQgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4geyBtb2R1bGVOYW1lLCByZXN1bHQ6IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0gfTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGNodW5rUmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCB7IG1vZHVsZU5hbWUsIHJlc3VsdCB9IG9mIGNodW5rUmVzdWx0cykge1xuICAgICAgICByZXN1bHRzW21vZHVsZU5hbWVdID0gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODj+OCpOODluODquODg+ODieWun+ihjO+8iOS+neWtmOmWouS/guOCkuiAg+aFruOBl+OBn+acgOmBqeWMluWun+ihjO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlSHlicmlkKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc29sZS5sb2coJ/CflIQg44OP44Kk44OW44Oq44OD44OJ5a6f6KGM44Oi44O844OJ44Gn44OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0ge307XG4gICAgXG4gICAgLy8gUGhhc2UgMTog5Z+655uk44OG44K544OI77yI6aCG5qyh5a6f6KGM77yJXG4gICAgY29uc3QgZm91bmRhdGlvblRlc3RzID0gWydhdXRoZW50aWNhdGlvbicsICdhY2Nlc3NDb250cm9sJ107XG4gICAgZm9yIChjb25zdCBtb2R1bGVOYW1lIG9mIGZvdW5kYXRpb25UZXN0cykge1xuICAgICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzW21vZHVsZU5hbWUgYXMga2V5b2YgdHlwZW9mIHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzXSkge1xuICAgICAgICByZXN1bHRzW21vZHVsZU5hbWVdID0gYXdhaXQgdGhpcy5leGVjdXRlTW9kdWxlKG1vZHVsZU5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBQaGFzZSAyOiDmqZ/og73jg4bjgrnjg4jvvIjkuKbliJflrp/ooYzvvIlcbiAgICBjb25zdCBmdW5jdGlvbmFsVGVzdHMgPSBbJ2NoYXRib3QnLCAndWlVeCddO1xuICAgIGNvbnN0IGZ1bmN0aW9uYWxQcm9taXNlcyA9IGZ1bmN0aW9uYWxUZXN0c1xuICAgICAgLmZpbHRlcihuYW1lID0+IHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzW25hbWUgYXMga2V5b2YgdHlwZW9mIHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzXSlcbiAgICAgIC5tYXAoYXN5bmMgKG1vZHVsZU5hbWUpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5leGVjdXRlTW9kdWxlKG1vZHVsZU5hbWUpO1xuICAgICAgICByZXR1cm4geyBtb2R1bGVOYW1lLCByZXN1bHQgfTtcbiAgICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IGZ1bmN0aW9uYWxSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoZnVuY3Rpb25hbFByb21pc2VzKTtcbiAgICBmb3IgKGNvbnN0IHsgbW9kdWxlTmFtZSwgcmVzdWx0IH0gb2YgZnVuY3Rpb25hbFJlc3VsdHMpIHtcbiAgICAgIHJlc3VsdHNbbW9kdWxlTmFtZV0gPSByZXN1bHQ7XG4gICAgfVxuICAgIFxuICAgIC8vIFBoYXNlIDM6IOWTgeizquODhuOCueODiO+8iOmghuasoeWun+ihjO+8iVxuICAgIGNvbnN0IHF1YWxpdHlUZXN0cyA9IFsncGVyZm9ybWFuY2UnLCAnc2VjdXJpdHknLCAnaW50ZWdyYXRpb24nXTtcbiAgICBmb3IgKGNvbnN0IG1vZHVsZU5hbWUgb2YgcXVhbGl0eVRlc3RzKSB7XG4gICAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZE1vZHVsZXNbbW9kdWxlTmFtZSBhcyBrZXlvZiB0eXBlb2YgdGhpcy5jb25maWcuZW5hYmxlZE1vZHVsZXNdKSB7XG4gICAgICAgIHJlc3VsdHNbbW9kdWxlTmFtZV0gPSBhd2FpdCB0aGlzLmV4ZWN1dGVNb2R1bGUobW9kdWxlTmFtZSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG4gIFxuICAvKipcbiAgICog5YCL5Yil44Oi44K444Ol44O844Or44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVNb2R1bGUobW9kdWxlTmFtZTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCB0aW1lb3V0ID0gdGhpcy5jb25maWcuZXhlY3V0aW9uLnRpbWVvdXRQZXJNb2R1bGU7XG4gICAgXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYCR7bW9kdWxlTmFtZX3jg4bjgrnjg4jjgYzjgr/jgqTjg6DjgqLjgqbjg4jjgZfjgb7jgZfjgZ8gKCR7dGltZW91dH1tcylgKSk7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAobW9kdWxlTmFtZSkge1xuICAgICAgICAgIGNhc2UgJ2F1dGhlbnRpY2F0aW9uJzpcbiAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuYXV0aE1vZHVsZS5leGVjdXRlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdhY2Nlc3NDb250cm9sJzpcbiAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuYWNjZXNzTW9kdWxlLmV4ZWN1dGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2NoYXRib3QnOlxuICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5jaGF0Ym90TW9kdWxlLmV4ZWN1dGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3BlcmZvcm1hbmNlJzpcbiAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMucGVyZm9ybWFuY2VNb2R1bGUuZXhlY3V0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAndWlVeCc6XG4gICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLnVpVXhNb2R1bGUuZXhlY3V0ZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc2VjdXJpdHknOlxuICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5zZWN1cml0eU1vZHVsZS5leGVjdXRlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdpbnRlZ3JhdGlvbic6XG4gICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLmludGVncmF0aW9uTW9kdWxlLmV4ZWN1dGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacquefpeOBruODouOCuOODpeODvOODqzogJHttb2R1bGVOYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIFxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOWun+ihjOmghuW6j+OBruWPluW+l1xuICAgKi9cbiAgcHJpdmF0ZSBnZXRFeGVjdXRpb25PcmRlcigpOiBzdHJpbmdbXSB7XG4gICAgY29uc3Qgb3JkZXIgPSBbXTtcbiAgICBcbiAgICAvLyDkvp3lrZjplqLkv4LjgpLogIPmha7jgZfjgZ/lrp/ooYzpoIbluo9cbiAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZE1vZHVsZXMuYXV0aGVudGljYXRpb24pIG9yZGVyLnB1c2goJ2F1dGhlbnRpY2F0aW9uJyk7XG4gICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzLmFjY2Vzc0NvbnRyb2wpIG9yZGVyLnB1c2goJ2FjY2Vzc0NvbnRyb2wnKTtcbiAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZE1vZHVsZXMuY2hhdGJvdCkgb3JkZXIucHVzaCgnY2hhdGJvdCcpO1xuICAgIGlmICh0aGlzLmNvbmZpZy5lbmFibGVkTW9kdWxlcy51aVV4KSBvcmRlci5wdXNoKCd1aVV4Jyk7XG4gICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWRNb2R1bGVzLnBlcmZvcm1hbmNlKSBvcmRlci5wdXNoKCdwZXJmb3JtYW5jZScpO1xuICAgIGlmICh0aGlzLmNvbmZpZy5lbmFibGVkTW9kdWxlcy5zZWN1cml0eSkgb3JkZXIucHVzaCgnc2VjdXJpdHknKTtcbiAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZE1vZHVsZXMuaW50ZWdyYXRpb24pIG9yZGVyLnB1c2goJ2ludGVncmF0aW9uJyk7XG4gICAgXG4gICAgcmV0dXJuIG9yZGVyO1xuICB9XG4gIFxuICAvKipcbiAgICog6YWN5YiX44Gu44OB44Oj44Oz44Kv5YiG5YmyXG4gICAqL1xuICBwcml2YXRlIGNodW5rQXJyYXk8VD4oYXJyYXk6IFRbXSwgY2h1bmtTaXplOiBudW1iZXIpOiBUW11bXSB7XG4gICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkgKz0gY2h1bmtTaXplKSB7XG4gICAgICBjaHVua3MucHVzaChhcnJheS5zbGljZShpLCBpICsgY2h1bmtTaXplKSk7XG4gICAgfVxuICAgIHJldHVybiBjaHVua3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDntZDmnpzliIbmnpBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgYW5hbHl6ZVJlc3VsdHMocmVzdWx0czogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zb2xlLmxvZygn8J+TiiDjg4bjgrnjg4jntZDmnpzjgpLliIbmnpDkuK0uLi4nKTtcbiAgICBcbiAgICBjb25zdCBhbmFseXNpcyA9IHtcbiAgICAgIGNyaXRpY2FsSXNzdWVzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgIHJlY29tbWVuZGF0aW9uczogW10gYXMgc3RyaW5nW10sXG4gICAgICBwZXJmb3JtYW5jZUJvdHRsZW5lY2tzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgIHNlY3VyaXR5Q29uY2VybnM6IFtdIGFzIHN0cmluZ1tdXG4gICAgfTtcbiAgICBcbiAgICAvLyDlkITjg6Ljgrjjg6Xjg7zjg6vntZDmnpzjga7liIbmnpBcbiAgICBmb3IgKGNvbnN0IFttb2R1bGVOYW1lLCByZXN1bHRdIG9mIE9iamVjdC5lbnRyaWVzKHJlc3VsdHMpKSB7XG4gICAgICBpZiAoIXJlc3VsdCB8fCAhKHJlc3VsdCBhcyBhbnkpLnN1Y2Nlc3MpIHtcbiAgICAgICAgYW5hbHlzaXMuY3JpdGljYWxJc3N1ZXMucHVzaChgJHttb2R1bGVOYW1lfeODhuOCueODiOOBjOWkseaVl+OBl+OBvuOBl+OBn2ApO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyDjg6Ljgrjjg6Xjg7zjg6vlm7rmnInjga7liIbmnpBcbiAgICAgIGF3YWl0IHRoaXMuYW5hbHl6ZU1vZHVsZVJlc3VsdChtb2R1bGVOYW1lLCByZXN1bHQgYXMgYW55LCBhbmFseXNpcyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBhbmFseXNpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODouOCuOODpeODvOODq+WIpee1kOaenOWIhuaekFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBhbmFseXplTW9kdWxlUmVzdWx0KG1vZHVsZU5hbWU6IHN0cmluZywgcmVzdWx0OiBhbnksIGFuYWx5c2lzOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXJlc3VsdCkgcmV0dXJuO1xuICAgIFxuICAgIHN3aXRjaCAobW9kdWxlTmFtZSkge1xuICAgICAgY2FzZSAncGVyZm9ybWFuY2UnOlxuICAgICAgICBpZiAocmVzdWx0Lm1ldHJpY3M/LnJlc3BvbnNlVGltZSA+IHRoaXMuY29uZmlnLnF1YWxpdHlUaHJlc2hvbGRzLm1heEFjY2VwdGFibGVSZXNwb25zZVRpbWUpIHtcbiAgICAgICAgICBhbmFseXNpcy5wZXJmb3JtYW5jZUJvdHRsZW5lY2tzLnB1c2goXG4gICAgICAgICAgICBg5b+c562U5pmC6ZaT44GM5Z+65rqW5YCk44KS6LaF6YGOOiAke3Jlc3VsdC5tZXRyaWNzLnJlc3BvbnNlVGltZX1tc2BcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJ3NlY3VyaXR5JzpcbiAgICAgICAgaWYgKHJlc3VsdC5zZWN1cml0eVNjb3JlIDwgdGhpcy5jb25maWcucXVhbGl0eVRocmVzaG9sZHMubWluU2VjdXJpdHlTY29yZSkge1xuICAgICAgICAgIGFuYWx5c2lzLnNlY3VyaXR5Q29uY2VybnMucHVzaChcbiAgICAgICAgICAgIGDjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgrPjgqLjgYzln7rmupblgKTjgpLkuIvlm57jgos6ICR7cmVzdWx0LnNlY3VyaXR5U2NvcmV9YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAndWlVeCc6XG4gICAgICAgIGlmIChyZXN1bHQuYWNjZXNzaWJpbGl0eVNjb3JlIDwgdGhpcy5jb25maWcucXVhbGl0eVRocmVzaG9sZHMubWluQWNjZXNzaWJpbGl0eVNjb3JlKSB7XG4gICAgICAgICAgYW5hbHlzaXMucmVjb21tZW5kYXRpb25zLnB1c2goXG4gICAgICAgICAgICBg44Ki44Kv44K744K344OT44Oq44OG44Kj44Gu5pS55ZaE44GM5b+F6KaBOiAke3Jlc3VsdC5hY2Nlc3NpYmlsaXR5U2NvcmV9YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICog57Wx5ZCI57WQ5p6c44Gu5qeL56+JXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGJ1aWxkSW50ZWdyYXRpb25SZXN1bHQoXG4gICAgcmVzdWx0czogYW55LFxuICAgIGFuYWx5c2lzOiBhbnksXG4gICAgc3RhcnRUaW1lOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCBlbmRUaW1lID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIFxuICAgIC8vIOWFqOS9k+e1seioiOOBruioiOeul1xuICAgIGxldCB0b3RhbFRlc3RzID0gMDtcbiAgICBsZXQgcGFzc2VkVGVzdHMgPSAwO1xuICAgIGxldCBmYWlsZWRUZXN0cyA9IDA7XG4gICAgbGV0IHNraXBwZWRUZXN0cyA9IDA7XG4gICAgXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgT2JqZWN0LnZhbHVlcyhyZXN1bHRzKSkge1xuICAgICAgaWYgKHJlc3VsdCAmJiB0eXBlb2YgcmVzdWx0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCByID0gcmVzdWx0IGFzIGFueTtcbiAgICAgICAgdG90YWxUZXN0cyArPSByLnRvdGFsVGVzdHMgfHwgMDtcbiAgICAgICAgcGFzc2VkVGVzdHMgKz0gci5wYXNzZWRUZXN0cyB8fCAwO1xuICAgICAgICBmYWlsZWRUZXN0cyArPSByLmZhaWxlZFRlc3RzIHx8IDA7XG4gICAgICAgIHNraXBwZWRUZXN0cyArPSByLnNraXBwZWRUZXN0cyB8fCAwO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyDlk4Hos6rjgrnjgrPjgqLjga7oqIjnrpdcbiAgICBjb25zdCBxdWFsaXR5U2NvcmUgPSB0b3RhbFRlc3RzID4gMCA/IChwYXNzZWRUZXN0cyAvIHRvdGFsVGVzdHMpICogMTAwIDogMDtcbiAgICBcbiAgICAvLyDlrp/ooYzmmYLplpPjga7oqIjnrpdcbiAgICBjb25zdCBleGVjdXRpb25UaW1lID0gbmV3IERhdGUoZW5kVGltZSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoc3RhcnRUaW1lKS5nZXRUaW1lKCk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIG92ZXJhbGw6IHtcbiAgICAgICAgc3VjY2VzczogZmFpbGVkVGVzdHMgPT09IDAgJiYgYW5hbHlzaXMuY3JpdGljYWxJc3N1ZXMubGVuZ3RoID09PSAwLFxuICAgICAgICB0b3RhbFRlc3RzLFxuICAgICAgICBwYXNzZWRUZXN0cyxcbiAgICAgICAgZmFpbGVkVGVzdHMsXG4gICAgICAgIHNraXBwZWRUZXN0cyxcbiAgICAgICAgZXhlY3V0aW9uVGltZSxcbiAgICAgICAgcXVhbGl0eVNjb3JlXG4gICAgICB9LFxuICAgICAgbW9kdWxlczogcmVzdWx0cyxcbiAgICAgIGFuYWx5c2lzLFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgc3RhcnRUaW1lLFxuICAgICAgICBlbmRUaW1lLFxuICAgICAgICBlbnZpcm9ubWVudDogJ3Byb2R1Y3Rpb24nLFxuICAgICAgICB0ZXN0U3VpdGVWZXJzaW9uOiAnMS4wLjAnXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOOCr+ODquODvOODs+OCouODg+ODl1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjbGVhbnVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn6e5IOOCr+ODquODvOODs+OCouODg+ODl+Wun+ihjOS4rS4uLicpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAvLyDnt4rmgKXlgZzmraLmqZ/og73jga7nhKHlirnljJZcbiAgICAgIHRoaXMuZW1lcmdlbmN5U3RvcC5kaXNhYmxlKCk7XG4gICAgICBcbiAgICAgIC8vIOaOpee2muOBruWIh+aWrVxuICAgICAgYXdhaXQgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5kaXNjb25uZWN0KCk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KaoO+4jyDjgq/jg6rjg7zjg7PjgqLjg4Pjg5fjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vLyDjg4fjg5Xjgqnjg6vjg4joqK3lrppcbmV4cG9ydCBjb25zdCBEZWZhdWx0SW50ZWdyYXRpb25UZXN0U3VpdGVDb25maWc6IEludGVncmF0aW9uVGVzdFN1aXRlQ29uZmlnID0ge1xuICBleGVjdXRpb25Nb2RlOiAnaHlicmlkJyxcbiAgZW5hYmxlZE1vZHVsZXM6IHtcbiAgICBhdXRoZW50aWNhdGlvbjogdHJ1ZSxcbiAgICBhY2Nlc3NDb250cm9sOiB0cnVlLFxuICAgIGNoYXRib3Q6IHRydWUsXG4gICAgcGVyZm9ybWFuY2U6IHRydWUsXG4gICAgdWlVeDogdHJ1ZSxcbiAgICBzZWN1cml0eTogdHJ1ZSxcbiAgICBpbnRlZ3JhdGlvbjogdHJ1ZVxuICB9LFxuICBleGVjdXRpb246IHtcbiAgICBtYXhQYXJhbGxlbFRlc3RzOiAzLFxuICAgIHRpbWVvdXRQZXJNb2R1bGU6IDMwMDAwMCwgLy8gNeWIhlxuICAgIHJldHJ5QXR0ZW1wdHM6IDIsXG4gICAgc3RvcE9uRmlyc3RGYWlsdXJlOiBmYWxzZSxcbiAgICBlbWVyZ2VuY3lTdG9wRW5hYmxlZDogdHJ1ZVxuICB9LFxuICByZXBvcnRpbmc6IHtcbiAgICBnZW5lcmF0ZURldGFpbGVkUmVwb3J0OiB0cnVlLFxuICAgIGdlbmVyYXRlRXhlY3V0aXZlU3VtbWFyeTogdHJ1ZSxcbiAgICBpbmNsdWRlUGVyZm9ybWFuY2VNZXRyaWNzOiB0cnVlLFxuICAgIGluY2x1ZGVTY3JlZW5zaG90czogdHJ1ZSxcbiAgICBvdXRwdXRGb3JtYXQ6ICdib3RoJ1xuICB9LFxuICBxdWFsaXR5VGhyZXNob2xkczoge1xuICAgIG1pbmltdW1QYXNzUmF0ZTogOTUsXG4gICAgbWF4QWNjZXB0YWJsZVJlc3BvbnNlVGltZTogMzAwMCxcbiAgICBtaW5TZWN1cml0eVNjb3JlOiA4NSxcbiAgICBtaW5BY2Nlc3NpYmlsaXR5U2NvcmU6IDkwXG4gIH1cbn07Il19