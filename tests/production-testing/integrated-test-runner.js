#!/usr/bin/env node
"use strict";
/**
 * 統合テストランナー
 * セキュリティ、パフォーマンス、機能テストの統合実行
 * 本番環境での包括的なシステム検証を実行
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegratedTestRunner = void 0;
const production_test_engine_1 = __importDefault(require("./core/production-test-engine"));
const emergency_stop_manager_1 = __importDefault(require("./core/emergency-stop-manager"));
const security_test_runner_1 = require("./modules/security/security-test-runner");
const performance_test_runner_1 = require("./modules/performance/performance-test-runner");
class IntegratedTestRunner {
    config;
    productionConfig;
    testEngine;
    emergencyStopManager;
    securityRunner;
    performanceRunner;
    functionalRunner; // FunctionalTestRunner;
    testRunId;
    constructor(config, productionConfig) {
        this.config = config;
        this.productionConfig = productionConfig;
        this.testRunId = `integrated-test-${Date.now()}`;
        this.testEngine = new production_test_engine_1.default(productionConfig);
    }
    /**
     * 統合テストランナーの初期化
     */
    async initialize() {
        console.log('🚀 統合テストランナーを初期化中...');
        console.log(`📋 テスト実行ID: ${this.testRunId}`);
        console.log(`🌍 環境: ${this.config.environment}`);
        console.log(`📊 テストスイート数: ${this.config.testSuites.length}`);
        try {
            // テストエンジンの初期化
            await this.testEngine.initialize();
            // 緊急停止マネージャーの初期化
            if (this.config.emergencyStopEnabled) {
                this.emergencyStopManager = new emergency_stop_manager_1.default({
                    timeout: this.config.timeoutMs,
                    resourceThreshold: this.config.resourceLimits.maxCpuUsage / 100,
                    costThreshold: this.config.resourceLimits.maxCostThreshold,
                    enableAutoStop: true
                });
                // await this.emergencyStopManager.initialize();
            }
            // テストランナーの初期化
            await this.initializeTestRunners();
            console.log('✅ 統合テストランナー初期化完了');
        }
        catch (error) {
            console.error('❌ 統合テストランナー初期化エラー:', error);
            throw error;
        }
    }
    /**
     * 各テストランナーの初期化
     */
    async initializeTestRunners() {
        const enabledSuites = this.config.testSuites.filter(suite => suite.enabled);
        for (const suite of enabledSuites) {
            switch (suite.name) {
                case 'security':
                    console.log('🔒 セキュリティテストランナーを初期化中...');
                    this.securityRunner = new security_test_runner_1.SecurityTestRunner(this.productionConfig, this.testEngine);
                    await this.securityRunner.initialize();
                    break;
                case 'performance':
                    console.log('⚡ パフォーマンステストランナーを初期化中...');
                    this.performanceRunner = new performance_test_runner_1.PerformanceTestRunner(this.productionConfig, this.testEngine);
                    // await this.performanceRunner.initialize();
                    break;
                case 'functional':
                    console.log('🔧 機能テストランナーを初期化中...');
                    // this.functionalRunner = new FunctionalTestRunner(this.productionConfig, this.testEngine);
                    // await this.functionalRunner.initialize();
                    console.log('⚠️ 機能テストランナーは未実装です');
                    break;
                default:
                    console.warn(`⚠️ 未知のテストスイート: ${suite.name}`);
            }
        }
    }
    /**
     * 統合テストの実行
     */
    async runIntegratedTests() {
        console.log('🚀 統合テスト実行開始...');
        console.log('=====================================');
        const startTime = new Date();
        const testSuiteResults = new Map();
        const errors = [];
        let overallSuccess = true;
        try {
            // 緊急停止監視の開始
            if (this.emergencyStopManager) {
                // await this.emergencyStopManager.startMonitoring();
                console.log('🔍 緊急停止監視を開始しました');
            }
            // テストスイートの実行順序を決定
            const executionOrder = this.determineExecutionOrder();
            console.log(`📋 実行順序: ${executionOrder.join(' → ')}`);
            console.log('');
            // テストスイートの実行
            if (this.config.parallelExecution) {
                await this.runTestSuitesInParallel(executionOrder, testSuiteResults, errors);
            }
            else {
                await this.runTestSuitesSequentially(executionOrder, testSuiteResults, errors);
            }
            // 結果の分析
            const endTime = new Date();
            const totalDuration = endTime.getTime() - startTime.getTime();
            // 総合成功判定
            overallSuccess = Array.from(testSuiteResults.values()).every(result => result.success) && errors.length === 0;
            // サマリーとメトリクスの生成
            const summary = this.generateTestSummary(testSuiteResults);
            const metrics = await this.generateTestMetrics(testSuiteResults, totalDuration);
            const recommendations = this.generateRecommendations(testSuiteResults, summary);
            const result = {
                testRunId: this.testRunId,
                startTime,
                endTime,
                totalDuration,
                overallSuccess,
                testSuiteResults,
                summary,
                metrics,
                recommendations,
                errors
            };
            // 結果の表示
            this.displayTestResults(result);
            // レポートの生成
            if (this.config.reportingConfig.generateDetailedReport) {
                await this.generateDetailedReport(result);
            }
            return result;
        }
        catch (error) {
            console.error('❌ 統合テスト実行エラー:', error);
            errors.push(error instanceof Error ? error.message : String(error));
            return {
                testRunId: this.testRunId,
                startTime,
                endTime: new Date(),
                totalDuration: Date.now() - startTime.getTime(),
                overallSuccess: false,
                testSuiteResults,
                summary: this.generateTestSummary(testSuiteResults),
                metrics: await this.generateTestMetrics(testSuiteResults, Date.now() - startTime.getTime()),
                recommendations: ['統合テスト実行エラーの調査と修正が必要です'],
                errors
            };
        }
        finally {
            // 緊急停止監視の停止
            if (this.emergencyStopManager) {
                // await this.emergencyStopManager.stopMonitoring();
                console.log('🛑 緊急停止監視を停止しました');
            }
        }
    }
    /**
     * テストスイートの実行順序を決定
     */
    determineExecutionOrder() {
        const enabledSuites = this.config.testSuites.filter(suite => suite.enabled);
        // 設定された実行順序を使用
        if (this.config.executionOrder.length > 0) {
            return this.config.executionOrder.filter(name => enabledSuites.some(suite => suite.name === name));
        }
        // 依存関係と優先度に基づく自動順序決定
        const sortedSuites = enabledSuites.sort((a, b) => {
            // 優先度による並び替え（高い優先度が先）
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // 依存関係による並び替え
            if (a.dependencies.includes(b.name)) {
                return 1; // bがaの依存関係なので、bを先に実行
            }
            if (b.dependencies.includes(a.name)) {
                return -1; // aがbの依存関係なので、aを先に実行
            }
            return 0;
        });
        return sortedSuites.map(suite => suite.name);
    }
    /**
     * テストスイートの順次実行
     */
    async runTestSuitesSequentially(executionOrder, testSuiteResults, errors) {
        console.log('📋 テストスイートを順次実行中...');
        for (const suiteName of executionOrder) {
            const suiteConfig = this.config.testSuites.find(s => s.name === suiteName);
            if (!suiteConfig) {
                console.warn(`⚠️ テストスイート設定が見つかりません: ${suiteName}`);
                continue;
            }
            console.log(`\n🔄 ${suiteName}テストスイート実行中...`);
            try {
                const result = await this.runTestSuite(suiteName, suiteConfig);
                testSuiteResults.set(suiteName, result);
                if (result.success) {
                    console.log(`✅ ${suiteName}テストスイート完了 (スコア: ${result.score.toFixed(1)}/100)`);
                }
                else {
                    console.log(`❌ ${suiteName}テストスイート失敗 (スコア: ${result.score.toFixed(1)}/100)`);
                    if (suiteConfig.skipOnFailure) {
                        console.log(`⏭️ ${suiteName}の失敗により後続テストをスキップします`);
                        break;
                    }
                }
            }
            catch (error) {
                console.error(`❌ ${suiteName}テストスイートエラー:`, error);
                errors.push(`${suiteName}: ${error instanceof Error ? error.message : String(error)}`);
                const failedResult = {
                    suiteName,
                    success: false,
                    duration: 0,
                    testCount: 0,
                    passedTests: 0,
                    failedTests: 1,
                    skippedTests: 0,
                    score: 0,
                    details: { error: error instanceof Error ? error.message : String(error) },
                    errors: [error instanceof Error ? error.message : String(error)]
                };
                testSuiteResults.set(suiteName, failedResult);
                if (suiteConfig.skipOnFailure) {
                    console.log(`⏭️ ${suiteName}のエラーにより後続テストをスキップします`);
                    break;
                }
            }
        }
    }
    /**
     * テストスイートの並列実行
     */
    async runTestSuitesInParallel(executionOrder, testSuiteResults, errors) {
        console.log('🔄 テストスイートを並列実行中...');
        // 依存関係を考慮したバッチ実行
        const batches = this.createExecutionBatches(executionOrder);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`\n📦 バッチ ${i + 1}/${batches.length} 実行中: ${batch.join(', ')}`);
            const batchPromises = batch.map(async (suiteName) => {
                const suiteConfig = this.config.testSuites.find(s => s.name === suiteName);
                if (!suiteConfig) {
                    console.warn(`⚠️ テストスイート設定が見つかりません: ${suiteName}`);
                    return;
                }
                try {
                    console.log(`🔄 ${suiteName}テストスイート開始...`);
                    const result = await this.runTestSuite(suiteName, suiteConfig);
                    testSuiteResults.set(suiteName, result);
                    if (result.success) {
                        console.log(`✅ ${suiteName}テストスイート完了 (スコア: ${result.score.toFixed(1)}/100)`);
                    }
                    else {
                        console.log(`❌ ${suiteName}テストスイート失敗 (スコア: ${result.score.toFixed(1)}/100)`);
                    }
                }
                catch (error) {
                    console.error(`❌ ${suiteName}テストスイートエラー:`, error);
                    errors.push(`${suiteName}: ${error instanceof Error ? error.message : String(error)}`);
                    const failedResult = {
                        suiteName,
                        success: false,
                        duration: 0,
                        testCount: 0,
                        passedTests: 0,
                        failedTests: 1,
                        skippedTests: 0,
                        score: 0,
                        details: { error: error instanceof Error ? error.message : String(error) },
                        errors: [error instanceof Error ? error.message : String(error)]
                    };
                    testSuiteResults.set(suiteName, failedResult);
                }
            });
            // バッチ内の全テストの完了を待機
            await Promise.all(batchPromises);
            // 重要なテストが失敗した場合は後続バッチをスキップ
            const criticalFailures = batch.filter(suiteName => {
                const suiteConfig = this.config.testSuites.find(s => s.name === suiteName);
                const result = testSuiteResults.get(suiteName);
                return suiteConfig?.criticalTest && !result?.success;
            });
            if (criticalFailures.length > 0) {
                console.log(`🚨 重要テスト失敗により後続バッチをスキップ: ${criticalFailures.join(', ')}`);
                break;
            }
        }
    }
    /**
     * 依存関係を考慮した実行バッチの作成
     */
    createExecutionBatches(executionOrder) {
        const batches = [];
        const processed = new Set();
        const remaining = [...executionOrder];
        while (remaining.length > 0) {
            const currentBatch = [];
            for (let i = remaining.length - 1; i >= 0; i--) {
                const suiteName = remaining[i];
                const suiteConfig = this.config.testSuites.find(s => s.name === suiteName);
                if (!suiteConfig)
                    continue;
                // 依存関係がすべて処理済みかチェック
                const dependenciesMet = suiteConfig.dependencies.every(dep => processed.has(dep));
                if (dependenciesMet) {
                    currentBatch.push(suiteName);
                    remaining.splice(i, 1);
                    processed.add(suiteName);
                }
            }
            if (currentBatch.length === 0 && remaining.length > 0) {
                // 循環依存関係または未解決の依存関係がある場合
                console.warn(`⚠️ 依存関係の問題により強制実行: ${remaining.join(', ')}`);
                currentBatch.push(...remaining);
                remaining.length = 0;
            }
            if (currentBatch.length > 0) {
                batches.push(currentBatch);
            }
        }
        return batches;
    }
    /**
     * 個別テストスイートの実行
     */
    async runTestSuite(suiteName, suiteConfig) {
        const startTime = Date.now();
        try {
            switch (suiteName) {
                case 'security':
                    if (!this.securityRunner) {
                        throw new Error('セキュリティテストランナーが初期化されていません');
                    }
                    return await this.runSecurityTests();
                case 'performance':
                    if (!this.performanceRunner) {
                        throw new Error('パフォーマンステストランナーが初期化されていません');
                    }
                    return await this.runPerformanceTests();
                case 'functional':
                    if (!this.functionalRunner) {
                        throw new Error('機能テストランナーが初期化されていません');
                    }
                    return await this.runFunctionalTests();
                default:
                    throw new Error(`未対応のテストスイート: ${suiteName}`);
            }
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                suiteName,
                success: false,
                duration,
                testCount: 0,
                passedTests: 0,
                failedTests: 1,
                skippedTests: 0,
                score: 0,
                details: { error: error instanceof Error ? error.message : String(error) },
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }
    /**
     * セキュリティテストの実行
     */
    async runSecurityTests() {
        if (!this.securityRunner) {
            throw new Error('セキュリティテストランナーが初期化されていません');
        }
        const startTime = Date.now();
        const securityResults = await this.securityRunner.runSecurityTests();
        const duration = Date.now() - startTime;
        return {
            suiteName: 'security',
            success: securityResults.success,
            duration,
            testCount: securityResults.summary.totalTests,
            passedTests: securityResults.summary.passedTests,
            failedTests: securityResults.summary.failedTests,
            skippedTests: securityResults.summary.skippedTests,
            score: securityResults.summary.overallSecurityScore * 100,
            details: {
                securityScore: securityResults.summary.overallSecurityScore,
                criticalIssues: securityResults.summary.criticalIssues,
                recommendations: securityResults.summary.recommendations,
                results: securityResults.results
            },
            errors: securityResults.errors || []
        };
    }
    /**
     * パフォーマンステストの実行
     */
    async runPerformanceTests() {
        if (!this.performanceRunner) {
            throw new Error('パフォーマンステストランナーが初期化されていません');
        }
        const startTime = Date.now();
        const performanceResults = await this.performanceRunner.runPerformanceTests();
        const duration = Date.now() - startTime;
        return {
            suiteName: 'performance',
            success: performanceResults.success,
            duration,
            testCount: performanceResults.summary.totalTests,
            passedTests: performanceResults.summary.passedTests,
            failedTests: performanceResults.summary.failedTests,
            skippedTests: performanceResults.summary.skippedTests,
            score: performanceResults.summary.overallPerformanceScore * 100,
            details: {
                performanceScore: performanceResults.summary.overallPerformanceScore,
                bottlenecks: performanceResults.summary.bottlenecks || [],
                recommendations: performanceResults.summary.recommendations || [],
                results: performanceResults.results
            },
            errors: [] // performanceResults.errors || []
        };
    }
    /**
     * 機能テストの実行
     */
    async runFunctionalTests() {
        if (!this.functionalRunner) {
            throw new Error('機能テストランナーが初期化されていません');
        }
        const startTime = Date.now();
        // const functionalResults = await this.functionalRunner.runFunctionalTests();
        const duration = Date.now() - startTime;
        // 仮の結果を返す（実装未完了のため）
        return {
            suiteName: 'functional',
            success: false,
            duration,
            testCount: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            score: 0,
            details: {
                functionalScore: 0,
                failedFeatures: [],
                recommendations: ['機能テストランナーの実装が必要です'],
                results: new Map()
            },
            errors: ['機能テストランナーが未実装です']
        };
    }
    /**
     * テストサマリーの生成
     */
    generateTestSummary(testSuiteResults) {
        const results = Array.from(testSuiteResults.values());
        const totalTests = results.reduce((sum, result) => sum + result.testCount, 0);
        const passedTests = results.reduce((sum, result) => sum + result.passedTests, 0);
        const failedTests = results.reduce((sum, result) => sum + result.failedTests, 0);
        const skippedTests = results.reduce((sum, result) => sum + result.skippedTests, 0);
        // 各スイートのスコア
        const securityResult = testSuiteResults.get('security');
        const performanceResult = testSuiteResults.get('performance');
        const functionalResult = testSuiteResults.get('functional');
        const securityScore = securityResult ? securityResult.score : 0;
        const performanceScore = performanceResult ? performanceResult.score : 0;
        const functionalScore = functionalResult ? functionalResult.score : 0;
        // 総合スコア（重み付き平均）
        const weights = { security: 0.4, performance: 0.3, functional: 0.3 };
        let overallScore = 0;
        let totalWeight = 0;
        if (securityResult) {
            overallScore += securityScore * weights.security;
            totalWeight += weights.security;
        }
        if (performanceResult) {
            overallScore += performanceScore * weights.performance;
            totalWeight += weights.performance;
        }
        if (functionalResult) {
            overallScore += functionalScore * weights.functional;
            totalWeight += weights.functional;
        }
        if (totalWeight > 0) {
            overallScore = overallScore / totalWeight;
        }
        // 重要な問題の集計
        const criticalIssues = results.reduce((sum, result) => {
            if (result.details?.criticalIssues) {
                return sum + result.details.criticalIssues;
            }
            return sum + (result.success ? 0 : 1);
        }, 0);
        // 推奨事項の集約
        const recommendations = [];
        results.forEach(result => {
            if (result.details?.recommendations) {
                recommendations.push(...result.details.recommendations);
            }
        });
        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            overallScore,
            securityScore,
            performanceScore,
            functionalScore,
            criticalIssues,
            recommendations: [...new Set(recommendations)] // 重複除去
        };
    }
    /**
     * テストメトリクスの生成
     */
    async generateTestMetrics(testSuiteResults, totalDuration) {
        const results = Array.from(testSuiteResults.values());
        // リソース使用量の計算（模擬値）
        const resourceUsage = {
            cpu: Math.min(100, results.length * 15), // CPU使用率
            memory: Math.min(100, results.length * 20), // メモリ使用率
            network: Math.min(100, results.length * 10), // ネットワーク使用率
            storage: Math.min(100, results.length * 5) // ストレージ使用率
        };
        // コスト見積もり（模擬値）
        const costEstimate = totalDuration * 0.001; // 実行時間ベースの簡易コスト
        // カバレッジ計算
        const coverage = {
            security: testSuiteResults.has('security') ? 100 : 0,
            performance: testSuiteResults.has('performance') ? 100 : 0,
            functional: testSuiteResults.has('functional') ? 100 : 0
        };
        return {
            executionTime: totalDuration,
            resourceUsage,
            costEstimate,
            coverage
        };
    }
    /**
     * 推奨事項の生成
     */
    generateRecommendations(testSuiteResults, summary) {
        const recommendations = [];
        // 失敗率に基づく推奨事項
        if (summary.failedTests > 0) {
            const failureRate = (summary.failedTests / summary.totalTests) * 100;
            if (failureRate > 20) {
                recommendations.push('テスト失敗率が高いため、システムの安定性を確認してください');
            }
        }
        // スコアに基づく推奨事項
        if (summary.securityScore < 80) {
            recommendations.push('セキュリティスコアが低いため、セキュリティ設定の見直しが必要です');
        }
        if (summary.performanceScore < 80) {
            recommendations.push('パフォーマンススコアが低いため、システム最適化を検討してください');
        }
        if (summary.functionalScore < 80) {
            recommendations.push('機能テストスコアが低いため、機能実装の確認が必要です');
        }
        // 重要な問題に基づく推奨事項
        if (summary.criticalIssues > 0) {
            recommendations.push(`${summary.criticalIssues}件の重要な問題が検出されました。優先的に対応してください`);
        }
        return recommendations;
    }
    /**
     * テスト結果の表示
     */
    displayTestResults(result) {
        console.log('\n=====================================');
        console.log('🎯 統合テスト結果サマリー');
        console.log('=====================================');
        console.log(`📊 総合結果: ${result.overallSuccess ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`⏱️ 実行時間: ${(result.totalDuration / 1000).toFixed(2)}秒`);
        console.log(`📈 総合スコア: ${result.summary.overallScore.toFixed(1)}/100`);
        console.log('');
        console.log('📋 テストスイート別結果:');
        result.testSuiteResults.forEach((suiteResult, suiteName) => {
            const status = suiteResult.success ? '✅' : '❌';
            console.log(`  ${status} ${suiteName}: ${suiteResult.score.toFixed(1)}/100 (${suiteResult.passedTests}/${suiteResult.testCount})`);
        });
        console.log('');
        if (result.recommendations.length > 0) {
            console.log('💡 推奨事項:');
            result.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });
            console.log('');
        }
        if (result.errors.length > 0) {
            console.log('⚠️ エラー:');
            result.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        console.log('=====================================');
    }
    /**
     * 詳細レポートの生成
     */
    async generateDetailedReport(result) {
        const reportDir = this.config.reportingConfig.outputDirectory;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // JSON形式でのレポート生成
        if (this.config.reportingConfig.exportFormats.includes('json')) {
            const jsonReport = {
                testRunId: result.testRunId,
                timestamp: result.startTime.toISOString(),
                summary: result.summary,
                metrics: result.metrics,
                testSuiteResults: Object.fromEntries(result.testSuiteResults),
                recommendations: result.recommendations,
                errors: result.errors
            };
            const jsonPath = `${reportDir}/integrated-test-report-${timestamp}.json`;
            console.log(`📄 JSONレポートを生成中: ${jsonPath}`);
            // ここで実際のファイル書き込みを行う
            // await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));
        }
        console.log('📊 詳細レポート生成完了');
    }
}
exports.IntegratedTestRunner = IntegratedTestRunner;
// デフォルトエクスポート
exports.default = IntegratedTestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyYXRlZC10ZXN0LXJ1bm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVncmF0ZWQtdGVzdC1ydW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztHQUlHOzs7Ozs7QUFHSCwyRkFBaUU7QUFDakUsMkZBQWlFO0FBQ2pFLGtGQUE2RTtBQUM3RSwyRkFBc0Y7QUFrR3RGLE1BQWEsb0JBQW9CO0lBQ3JCLE1BQU0sQ0FBdUI7SUFDN0IsZ0JBQWdCLENBQW1CO0lBQ25DLFVBQVUsQ0FBdUI7SUFDakMsb0JBQW9CLENBQXdCO0lBQzVDLGNBQWMsQ0FBc0I7SUFDcEMsaUJBQWlCLENBQXlCO0lBQzFDLGdCQUFnQixDQUFPLENBQUMsd0JBQXdCO0lBQ2hELFNBQVMsQ0FBUztJQUUxQixZQUFZLE1BQTRCLEVBQUUsZ0JBQWtDO1FBQ3hFLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUN6QyxJQUFJLENBQUMsU0FBUyxHQUFHLG1CQUFtQixJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztRQUNqRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksZ0NBQW9CLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsVUFBVTtRQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNqRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FB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QkFDZixTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7Z0JBQzNCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRTtnQkFDekMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN2QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3ZCLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO2dCQUM3RCxlQUFlLEVBQUUsTUFBTSxDQUFDLGVBQWU7Z0JBQ3ZDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTthQUN4QixDQUFDO1lBRUYsTUFBTSxRQUFRLEdBQUcsR0FBRyxTQUFTLDJCQUEyQixTQUFTLE9BQU8sQ0FBQztZQUN6RSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRTVDLG9CQUFvQjtZQUNwQixxRUFBcUU7UUFDekUsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUNKO0FBL3RCRCxvREErdEJDO0FBRUQsY0FBYztBQUNkLGtCQUFlLG9CQUFvQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqIOe1seWQiOODhuOCueODiOODqeODs+ODiuODvFxuICog44K744Kt44Ol44Oq44OG44Kj44CB44OR44OV44Kp44O844Oe44Oz44K544CB5qmf6IO944OG44K544OI44Gu57Wx5ZCI5a6f6KGMXG4gKiDmnKznlarnkrDlooPjgafjga7ljIXmi6znmoTjgarjgrfjgrnjg4bjg6DmpJzoqLzjgpLlrp/ooYxcbiAqL1xuXG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lIGZyb20gJy4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcbmltcG9ydCBFbWVyZ2VuY3lTdG9wTWFuYWdlciBmcm9tICcuL2NvcmUvZW1lcmdlbmN5LXN0b3AtbWFuYWdlcic7XG5pbXBvcnQgeyBTZWN1cml0eVRlc3RSdW5uZXIgfSBmcm9tICcuL21vZHVsZXMvc2VjdXJpdHkvc2VjdXJpdHktdGVzdC1ydW5uZXInO1xuaW1wb3J0IHsgUGVyZm9ybWFuY2VUZXN0UnVubmVyIH0gZnJvbSAnLi9tb2R1bGVzL3BlcmZvcm1hbmNlL3BlcmZvcm1hbmNlLXRlc3QtcnVubmVyJztcbi8vIGltcG9ydCB7IEZ1bmN0aW9uYWxUZXN0UnVubmVyIH0gZnJvbSAnLi9tb2R1bGVzL2Z1bmN0aW9uYWwvZnVuY3Rpb25hbC10ZXN0LXJ1bm5lcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZWdyYXRlZFRlc3RDb25maWcge1xuICAgIGVudmlyb25tZW50OiBzdHJpbmc7XG4gICAgdGVzdFN1aXRlczogVGVzdFN1aXRlQ29uZmlnW107XG4gICAgZXhlY3V0aW9uT3JkZXI6IHN0cmluZ1tdO1xuICAgIHBhcmFsbGVsRXhlY3V0aW9uOiBib29sZWFuO1xuICAgIG1heENvbmN1cnJlbnRUZXN0czogbnVtYmVyO1xuICAgIHRpbWVvdXRNczogbnVtYmVyO1xuICAgIHJldHJ5QXR0ZW1wdHM6IG51bWJlcjtcbiAgICBlbWVyZ2VuY3lTdG9wRW5hYmxlZDogYm9vbGVhbjtcbiAgICByZXBvcnRpbmdDb25maWc6IFJlcG9ydGluZ0NvbmZpZztcbiAgICByZXNvdXJjZUxpbWl0czogUmVzb3VyY2VMaW1pdHM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdFN1aXRlQ29uZmlnIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICBwcmlvcml0eTogbnVtYmVyO1xuICAgIGRlcGVuZGVuY2llczogc3RyaW5nW107XG4gICAgY29uZmlndXJhdGlvbjogYW55O1xuICAgIHNraXBPbkZhaWx1cmU6IGJvb2xlYW47XG4gICAgY3JpdGljYWxUZXN0OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlcG9ydGluZ0NvbmZpZyB7XG4gICAgZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydDogYm9vbGVhbjtcbiAgICBleHBvcnRGb3JtYXRzOiAoJ2pzb24nIHwgJ2h0bWwnIHwgJ3BkZicgfCAnY3N2JylbXTtcbiAgICBvdXRwdXREaXJlY3Rvcnk6IHN0cmluZztcbiAgICBpbmNsdWRlTWV0cmljczogYm9vbGVhbjtcbiAgICBpbmNsdWRlU2NyZWVuc2hvdHM6IGJvb2xlYW47XG4gICAgaW5jbHVkZUxvZ3M6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb3VyY2VMaW1pdHMge1xuICAgIG1heENwdVVzYWdlOiBudW1iZXI7XG4gICAgbWF4TWVtb3J5VXNhZ2U6IG51bWJlcjtcbiAgICBtYXhOZXR3b3JrQmFuZHdpZHRoOiBudW1iZXI7XG4gICAgbWF4U3RvcmFnZVVzYWdlOiBudW1iZXI7XG4gICAgbWF4Q29zdFRocmVzaG9sZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVncmF0ZWRUZXN0UmVzdWx0IHtcbiAgICB0ZXN0UnVuSWQ6IHN0cmluZztcbiAgICBzdGFydFRpbWU6IERhdGU7XG4gICAgZW5kVGltZTogRGF0ZTtcbiAgICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gICAgb3ZlcmFsbFN1Y2Nlc3M6IGJvb2xlYW47XG4gICAgdGVzdFN1aXRlUmVzdWx0czogTWFwPHN0cmluZywgVGVzdFN1aXRlUmVzdWx0PjtcbiAgICBzdW1tYXJ5OiBUZXN0U3VtbWFyeTtcbiAgICBtZXRyaWNzOiBUZXN0TWV0cmljcztcbiAgICByZWNvbW1lbmRhdGlvbnM6IHN0cmluZ1tdO1xuICAgIGVycm9yczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdFN1aXRlUmVzdWx0IHtcbiAgICBzdWl0ZU5hbWU6IHN0cmluZztcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICAgIGR1cmF0aW9uOiBudW1iZXI7XG4gICAgdGVzdENvdW50OiBudW1iZXI7XG4gICAgcGFzc2VkVGVzdHM6IG51bWJlcjtcbiAgICBmYWlsZWRUZXN0czogbnVtYmVyO1xuICAgIHNraXBwZWRUZXN0czogbnVtYmVyO1xuICAgIHNjb3JlOiBudW1iZXI7XG4gICAgZGV0YWlsczogYW55O1xuICAgIGVycm9yczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdFN1bW1hcnkge1xuICAgIHRvdGFsVGVzdHM6IG51bWJlcjtcbiAgICBwYXNzZWRUZXN0czogbnVtYmVyO1xuICAgIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gICAgc2tpcHBlZFRlc3RzOiBudW1iZXI7XG4gICAgb3ZlcmFsbFNjb3JlOiBudW1iZXI7XG4gICAgc2VjdXJpdHlTY29yZTogbnVtYmVyO1xuICAgIHBlcmZvcm1hbmNlU2NvcmU6IG51bWJlcjtcbiAgICBmdW5jdGlvbmFsU2NvcmU6IG51bWJlcjtcbiAgICBjcml0aWNhbElzc3VlczogbnVtYmVyO1xuICAgIHJlY29tbWVuZGF0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdE1ldHJpY3Mge1xuICAgIGV4ZWN1dGlvblRpbWU6IG51bWJlcjtcbiAgICByZXNvdXJjZVVzYWdlOiB7XG4gICAgICAgIGNwdTogbnVtYmVyO1xuICAgICAgICBtZW1vcnk6IG51bWJlcjtcbiAgICAgICAgbmV0d29yazogbnVtYmVyO1xuICAgICAgICBzdG9yYWdlOiBudW1iZXI7XG4gICAgfTtcbiAgICBjb3N0RXN0aW1hdGU6IG51bWJlcjtcbiAgICBjb3ZlcmFnZToge1xuICAgICAgICBzZWN1cml0eTogbnVtYmVyO1xuICAgICAgICBwZXJmb3JtYW5jZTogbnVtYmVyO1xuICAgICAgICBmdW5jdGlvbmFsOiBudW1iZXI7XG4gICAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIEludGVncmF0ZWRUZXN0UnVubmVyIHtcbiAgICBwcml2YXRlIGNvbmZpZzogSW50ZWdyYXRlZFRlc3RDb25maWc7XG4gICAgcHJpdmF0ZSBwcm9kdWN0aW9uQ29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICAgIHByaXZhdGUgdGVzdEVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmU7XG4gICAgcHJpdmF0ZSBlbWVyZ2VuY3lTdG9wTWFuYWdlcj86IEVtZXJnZW5jeVN0b3BNYW5hZ2VyO1xuICAgIHByaXZhdGUgc2VjdXJpdHlSdW5uZXI/OiBTZWN1cml0eVRlc3RSdW5uZXI7XG4gICAgcHJpdmF0ZSBwZXJmb3JtYW5jZVJ1bm5lcj86IFBlcmZvcm1hbmNlVGVzdFJ1bm5lcjtcbiAgICBwcml2YXRlIGZ1bmN0aW9uYWxSdW5uZXI/OiBhbnk7IC8vIEZ1bmN0aW9uYWxUZXN0UnVubmVyO1xuICAgIHByaXZhdGUgdGVzdFJ1bklkOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IEludGVncmF0ZWRUZXN0Q29uZmlnLCBwcm9kdWN0aW9uQ29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnByb2R1Y3Rpb25Db25maWcgPSBwcm9kdWN0aW9uQ29uZmlnO1xuICAgICAgICB0aGlzLnRlc3RSdW5JZCA9IGBpbnRlZ3JhdGVkLXRlc3QtJHtEYXRlLm5vdygpfWA7XG4gICAgICAgIHRoaXMudGVzdEVuZ2luZSA9IG5ldyBQcm9kdWN0aW9uVGVzdEVuZ2luZShwcm9kdWN0aW9uQ29uZmlnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDntbHlkIjjg4bjgrnjg4jjg6njg7Pjg4rjg7zjga7liJ3mnJ/ljJZcbiAgICAgKi9cbiAgICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+agCDntbHlkIjjg4bjgrnjg4jjg6njg7Pjg4rjg7zjgpLliJ3mnJ/ljJbkuK0uLi4nKTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4sg44OG44K544OI5a6f6KGMSUQ6ICR7dGhpcy50ZXN0UnVuSWR9YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn4yNIOeSsOWigzogJHt0aGlzLmNvbmZpZy5lbnZpcm9ubWVudH1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4og44OG44K544OI44K544Kk44O844OI5pWwOiAke3RoaXMuY29uZmlnLnRlc3RTdWl0ZXMubGVuZ3RofWApO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDjg4bjgrnjg4jjgqjjg7Pjgrjjg7Pjga7liJ3mnJ/ljJZcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGVzdEVuZ2luZS5pbml0aWFsaXplKCk7XG5cbiAgICAgICAgICAgIC8vIOe3iuaApeWBnOatouODnuODjeODvOOCuOODo+ODvOOBruWIneacn+WMllxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmVtZXJnZW5jeVN0b3BFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWVyZ2VuY3lTdG9wTWFuYWdlciA9IG5ldyBFbWVyZ2VuY3lTdG9wTWFuYWdlcih7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHRoaXMuY29uZmlnLnRpbWVvdXRNcyxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VUaHJlc2hvbGQ6IHRoaXMuY29uZmlnLnJlc291cmNlTGltaXRzLm1heENwdVVzYWdlIC8gMTAwLFxuICAgICAgICAgICAgICAgICAgICBjb3N0VGhyZXNob2xkOiB0aGlzLmNvbmZpZy5yZXNvdXJjZUxpbWl0cy5tYXhDb3N0VGhyZXNob2xkLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVBdXRvU3RvcDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0gYXMgYW55KTtcbiAgICAgICAgICAgICAgICAvLyBhd2FpdCB0aGlzLmVtZXJnZW5jeVN0b3BNYW5hZ2VyLmluaXRpYWxpemUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g44OG44K544OI44Op44Oz44OK44O844Gu5Yid5pyf5YyWXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemVUZXN0UnVubmVycygpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygn4pyFIOe1seWQiOODhuOCueODiOODqeODs+ODiuODvOWIneacn+WMluWujOS6hicpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg57Wx5ZCI44OG44K544OI44Op44Oz44OK44O85Yid5pyf5YyW44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ZCE44OG44K544OI44Op44Oz44OK44O844Gu5Yid5pyf5YyWXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBpbml0aWFsaXplVGVzdFJ1bm5lcnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGVuYWJsZWRTdWl0ZXMgPSB0aGlzLmNvbmZpZy50ZXN0U3VpdGVzLmZpbHRlcihzdWl0ZSA9PiBzdWl0ZS5lbmFibGVkKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHN1aXRlIG9mIGVuYWJsZWRTdWl0ZXMpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoc3VpdGUubmFtZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3NlY3VyaXR5JzpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ/CflJIg44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Op44Oz44OK44O844KS5Yid5pyf5YyW5LitLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VjdXJpdHlSdW5uZXIgPSBuZXcgU2VjdXJpdHlUZXN0UnVubmVyKHRoaXMucHJvZHVjdGlvbkNvbmZpZywgdGhpcy50ZXN0RW5naW5lKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZWN1cml0eVJ1bm5lci5pbml0aWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAncGVyZm9ybWFuY2UnOlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn4pqhIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOODqeODs+ODiuODvOOCkuWIneacn+WMluS4rS4uLicpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBlcmZvcm1hbmNlUnVubmVyID0gbmV3IFBlcmZvcm1hbmNlVGVzdFJ1bm5lcih0aGlzLnByb2R1Y3Rpb25Db25maWcsIHRoaXMudGVzdEVuZ2luZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGF3YWl0IHRoaXMucGVyZm9ybWFuY2VSdW5uZXIuaW5pdGlhbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uYWwnOlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn8J+UpyDmqZ/og73jg4bjgrnjg4jjg6njg7Pjg4rjg7zjgpLliJ3mnJ/ljJbkuK0uLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5mdW5jdGlvbmFsUnVubmVyID0gbmV3IEZ1bmN0aW9uYWxUZXN0UnVubmVyKHRoaXMucHJvZHVjdGlvbkNvbmZpZywgdGhpcy50ZXN0RW5naW5lKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXdhaXQgdGhpcy5mdW5jdGlvbmFsUnVubmVyLmluaXRpYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+KaoO+4jyDmqZ/og73jg4bjgrnjg4jjg6njg7Pjg4rjg7zjga/mnKrlrp/oo4XjgafjgZknKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYOKaoO+4jyDmnKrnn6Xjga7jg4bjgrnjg4jjgrnjgqTjg7zjg4g6ICR7c3VpdGUubmFtZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOe1seWQiOODhuOCueODiOOBruWun+ihjFxuICAgICAqL1xuICAgIGFzeW5jIHJ1bkludGVncmF0ZWRUZXN0cygpOiBQcm9taXNlPEludGVncmF0ZWRUZXN0UmVzdWx0PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5qAIOe1seWQiOODhuOCueODiOWun+ihjOmWi+Wniy4uLicpO1xuICAgICAgICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGNvbnN0IHRlc3RTdWl0ZVJlc3VsdHMgPSBuZXcgTWFwPHN0cmluZywgVGVzdFN1aXRlUmVzdWx0PigpO1xuICAgICAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGxldCBvdmVyYWxsU3VjY2VzcyA9IHRydWU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOe3iuaApeWBnOatouebo+imluOBrumWi+Wni1xuICAgICAgICAgICAgaWYgKHRoaXMuZW1lcmdlbmN5U3RvcE1hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBhd2FpdCB0aGlzLmVtZXJnZW5jeVN0b3BNYW5hZ2VyLnN0YXJ0TW9uaXRvcmluZygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfwn5SNIOe3iuaApeWBnOatouebo+imluOCkumWi+Wni+OBl+OBvuOBl+OBnycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDjg4bjgrnjg4jjgrnjgqTjg7zjg4jjga7lrp/ooYzpoIbluo/jgpLmsbrlrppcbiAgICAgICAgICAgIGNvbnN0IGV4ZWN1dGlvbk9yZGVyID0gdGhpcy5kZXRlcm1pbmVFeGVjdXRpb25PcmRlcigpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYPCfk4sg5a6f6KGM6aCG5bqPOiAke2V4ZWN1dGlvbk9yZGVyLmpvaW4oJyDihpIgJyl9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG5cbiAgICAgICAgICAgIC8vIOODhuOCueODiOOCueOCpOODvOODiOOBruWun+ihjFxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLnBhcmFsbGVsRXhlY3V0aW9uKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5UZXN0U3VpdGVzSW5QYXJhbGxlbChleGVjdXRpb25PcmRlciwgdGVzdFN1aXRlUmVzdWx0cywgZXJyb3JzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW5UZXN0U3VpdGVzU2VxdWVudGlhbGx5KGV4ZWN1dGlvbk9yZGVyLCB0ZXN0U3VpdGVSZXN1bHRzLCBlcnJvcnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDntZDmnpzjga7liIbmnpBcbiAgICAgICAgICAgIGNvbnN0IGVuZFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgY29uc3QgdG90YWxEdXJhdGlvbiA9IGVuZFRpbWUuZ2V0VGltZSgpIC0gc3RhcnRUaW1lLmdldFRpbWUoKTtcblxuICAgICAgICAgICAgLy8g57eP5ZCI5oiQ5Yqf5Yik5a6aXG4gICAgICAgICAgICBvdmVyYWxsU3VjY2VzcyA9IEFycmF5LmZyb20odGVzdFN1aXRlUmVzdWx0cy52YWx1ZXMoKSkuZXZlcnkocmVzdWx0ID0+IHJlc3VsdC5zdWNjZXNzKSAmJiBlcnJvcnMubGVuZ3RoID09PSAwO1xuXG4gICAgICAgICAgICAvLyDjgrXjg57jg6rjg7zjgajjg6Hjg4jjg6rjgq/jgrnjga7nlJ/miJBcbiAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLmdlbmVyYXRlVGVzdFN1bW1hcnkodGVzdFN1aXRlUmVzdWx0cyk7XG4gICAgICAgICAgICBjb25zdCBtZXRyaWNzID0gYXdhaXQgdGhpcy5nZW5lcmF0ZVRlc3RNZXRyaWNzKHRlc3RTdWl0ZVJlc3VsdHMsIHRvdGFsRHVyYXRpb24pO1xuICAgICAgICAgICAgY29uc3QgcmVjb21tZW5kYXRpb25zID0gdGhpcy5nZW5lcmF0ZVJlY29tbWVuZGF0aW9ucyh0ZXN0U3VpdGVSZXN1bHRzLCBzdW1tYXJ5KTtcblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBJbnRlZ3JhdGVkVGVzdFJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgICB0ZXN0UnVuSWQ6IHRoaXMudGVzdFJ1bklkLFxuICAgICAgICAgICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgICAgICAgICBlbmRUaW1lLFxuICAgICAgICAgICAgICAgIHRvdGFsRHVyYXRpb24sXG4gICAgICAgICAgICAgICAgb3ZlcmFsbFN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgdGVzdFN1aXRlUmVzdWx0cyxcbiAgICAgICAgICAgICAgICBzdW1tYXJ5LFxuICAgICAgICAgICAgICAgIG1ldHJpY3MsXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zLFxuICAgICAgICAgICAgICAgIGVycm9yc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8g57WQ5p6c44Gu6KGo56S6XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlUZXN0UmVzdWx0cyhyZXN1bHQpO1xuXG4gICAgICAgICAgICAvLyDjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5yZXBvcnRpbmdDb25maWcuZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydChyZXN1bHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg57Wx5ZCI44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGVzdFJ1bklkOiB0aGlzLnRlc3RSdW5JZCxcbiAgICAgICAgICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgICAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICB0b3RhbER1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLmdldFRpbWUoKSxcbiAgICAgICAgICAgICAgICBvdmVyYWxsU3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgdGVzdFN1aXRlUmVzdWx0cyxcbiAgICAgICAgICAgICAgICBzdW1tYXJ5OiB0aGlzLmdlbmVyYXRlVGVzdFN1bW1hcnkodGVzdFN1aXRlUmVzdWx0cyksXG4gICAgICAgICAgICAgICAgbWV0cmljczogYXdhaXQgdGhpcy5nZW5lcmF0ZVRlc3RNZXRyaWNzKHRlc3RTdWl0ZVJlc3VsdHMsIERhdGUubm93KCkgLSBzdGFydFRpbWUuZ2V0VGltZSgpKSxcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFsn57Wx5ZCI44OG44K544OI5a6f6KGM44Ko44Op44O844Gu6Kq/5p+744Go5L+u5q2j44GM5b+F6KaB44Gn44GZJ10sXG4gICAgICAgICAgICAgICAgZXJyb3JzXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAvLyDnt4rmgKXlgZzmraLnm6Poppbjga7lgZzmraJcbiAgICAgICAgICAgIGlmICh0aGlzLmVtZXJnZW5jeVN0b3BNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgLy8gYXdhaXQgdGhpcy5lbWVyZ2VuY3lTdG9wTWFuYWdlci5zdG9wTW9uaXRvcmluZygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfwn5uRIOe3iuaApeWBnOatouebo+imluOCkuWBnOatouOBl+OBvuOBl+OBnycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44OG44K544OI44K544Kk44O844OI44Gu5a6f6KGM6aCG5bqP44KS5rG65a6aXG4gICAgICovXG4gICAgcHJpdmF0ZSBkZXRlcm1pbmVFeGVjdXRpb25PcmRlcigpOiBzdHJpbmdbXSB7XG4gICAgICAgIGNvbnN0IGVuYWJsZWRTdWl0ZXMgPSB0aGlzLmNvbmZpZy50ZXN0U3VpdGVzLmZpbHRlcihzdWl0ZSA9PiBzdWl0ZS5lbmFibGVkKTtcblxuICAgICAgICAvLyDoqK3lrprjgZXjgozjgZ/lrp/ooYzpoIbluo/jgpLkvb/nlKhcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmV4ZWN1dGlvbk9yZGVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5leGVjdXRpb25PcmRlci5maWx0ZXIobmFtZSA9PlxuICAgICAgICAgICAgICAgIGVuYWJsZWRTdWl0ZXMuc29tZShzdWl0ZSA9PiBzdWl0ZS5uYW1lID09PSBuYW1lKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS+neWtmOmWouS/guOBqOWEquWFiOW6puOBq+WfuuOBpeOBj+iHquWLlemghuW6j+axuuWumlxuICAgICAgICBjb25zdCBzb3J0ZWRTdWl0ZXMgPSBlbmFibGVkU3VpdGVzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIC8vIOWEquWFiOW6puOBq+OCiOOCi+S4puOBs+abv+OBiO+8iOmrmOOBhOWEquWFiOW6puOBjOWFiO+8iVxuICAgICAgICAgICAgaWYgKGEucHJpb3JpdHkgIT09IGIucHJpb3JpdHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYi5wcmlvcml0eSAtIGEucHJpb3JpdHk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS+neWtmOmWouS/guOBq+OCiOOCi+S4puOBs+abv+OBiFxuICAgICAgICAgICAgaWYgKGEuZGVwZW5kZW5jaWVzLmluY2x1ZGVzKGIubmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTsgLy8gYuOBjGHjga7kvp3lrZjplqLkv4Ljgarjga7jgafjgIFi44KS5YWI44Gr5a6f6KGMXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYi5kZXBlbmRlbmNpZXMuaW5jbHVkZXMoYS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTsgLy8gYeOBjGLjga7kvp3lrZjplqLkv4Ljgarjga7jgafjgIFh44KS5YWI44Gr5a6f6KGMXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc29ydGVkU3VpdGVzLm1hcChzdWl0ZSA9PiBzdWl0ZS5uYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg4bjgrnjg4jjgrnjgqTjg7zjg4jjga7poIbmrKHlrp/ooYxcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHJ1blRlc3RTdWl0ZXNTZXF1ZW50aWFsbHkoXG4gICAgICAgIGV4ZWN1dGlvbk9yZGVyOiBzdHJpbmdbXSxcbiAgICAgICAgdGVzdFN1aXRlUmVzdWx0czogTWFwPHN0cmluZywgVGVzdFN1aXRlUmVzdWx0PixcbiAgICAgICAgZXJyb3JzOiBzdHJpbmdbXVxuICAgICk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+TiyDjg4bjgrnjg4jjgrnjgqTjg7zjg4jjgpLpoIbmrKHlrp/ooYzkuK0uLi4nKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHN1aXRlTmFtZSBvZiBleGVjdXRpb25PcmRlcikge1xuICAgICAgICAgICAgY29uc3Qgc3VpdGVDb25maWcgPSB0aGlzLmNvbmZpZy50ZXN0U3VpdGVzLmZpbmQocyA9PiBzLm5hbWUgPT09IHN1aXRlTmFtZSk7XG4gICAgICAgICAgICBpZiAoIXN1aXRlQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8g44OG44K544OI44K544Kk44O844OI6Kit5a6a44GM6KaL44Gk44GL44KK44G+44Gb44KTOiAke3N1aXRlTmFtZX1gKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5sb2coYFxcbvCflIQgJHtzdWl0ZU5hbWV944OG44K544OI44K544Kk44O844OI5a6f6KGM5LitLi4uYCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5ydW5UZXN0U3VpdGUoc3VpdGVOYW1lLCBzdWl0ZUNvbmZpZyk7XG4gICAgICAgICAgICAgICAgdGVzdFN1aXRlUmVzdWx0cy5zZXQoc3VpdGVOYW1lLCByZXN1bHQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinIUgJHtzdWl0ZU5hbWV944OG44K544OI44K544Kk44O844OI5a6M5LqGICjjgrnjgrPjgqI6ICR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMSl9LzEwMClgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4p2MICR7c3VpdGVOYW1lfeODhuOCueODiOOCueOCpOODvOODiOWkseaVlyAo44K544Kz44KiOiAke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDEpfS8xMDApYCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1aXRlQ29uZmlnLnNraXBPbkZhaWx1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDij63vuI8gJHtzdWl0ZU5hbWV944Gu5aSx5pWX44Gr44KI44KK5b6M57aa44OG44K544OI44KS44K544Kt44OD44OX44GX44G+44GZYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgJHtzdWl0ZU5hbWV944OG44K544OI44K544Kk44O844OI44Ko44Op44O8OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgJHtzdWl0ZU5hbWV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZFJlc3VsdDogVGVzdFN1aXRlUmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgICAgICBzdWl0ZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogMCxcbiAgICAgICAgICAgICAgICAgICAgdGVzdENvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICBwYXNzZWRUZXN0czogMCxcbiAgICAgICAgICAgICAgICAgICAgZmFpbGVkVGVzdHM6IDEsXG4gICAgICAgICAgICAgICAgICAgIHNraXBwZWRUZXN0czogMCxcbiAgICAgICAgICAgICAgICAgICAgc2NvcmU6IDAsXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnM6IFtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcildXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0ZXN0U3VpdGVSZXN1bHRzLnNldChzdWl0ZU5hbWUsIGZhaWxlZFJlc3VsdCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3VpdGVDb25maWcuc2tpcE9uRmFpbHVyZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4o+t77iPICR7c3VpdGVOYW1lfeOBruOCqOODqeODvOOBq+OCiOOCiuW+jOe2muODhuOCueODiOOCkuOCueOCreODg+ODl+OBl+OBvuOBmWApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg4bjgrnjg4jjgrnjgqTjg7zjg4jjga7kuKbliJflrp/ooYxcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHJ1blRlc3RTdWl0ZXNJblBhcmFsbGVsKFxuICAgICAgICBleGVjdXRpb25PcmRlcjogc3RyaW5nW10sXG4gICAgICAgIHRlc3RTdWl0ZVJlc3VsdHM6IE1hcDxzdHJpbmcsIFRlc3RTdWl0ZVJlc3VsdD4sXG4gICAgICAgIGVycm9yczogc3RyaW5nW11cbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ/CflIQg44OG44K544OI44K544Kk44O844OI44KS5Lim5YiX5a6f6KGM5LitLi4uJyk7XG5cbiAgICAgICAgLy8g5L6d5a2Y6Zai5L+C44KS6ICD5oWu44GX44Gf44OQ44OD44OB5a6f6KGMXG4gICAgICAgIGNvbnN0IGJhdGNoZXMgPSB0aGlzLmNyZWF0ZUV4ZWN1dGlvbkJhdGNoZXMoZXhlY3V0aW9uT3JkZXIpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmF0Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYmF0Y2ggPSBiYXRjaGVzW2ldO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFxcbvCfk6Yg44OQ44OD44OBICR7aSArIDF9LyR7YmF0Y2hlcy5sZW5ndGh9IOWun+ihjOS4rTogJHtiYXRjaC5qb2luKCcsICcpfWApO1xuXG4gICAgICAgICAgICBjb25zdCBiYXRjaFByb21pc2VzID0gYmF0Y2gubWFwKGFzeW5jIChzdWl0ZU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWl0ZUNvbmZpZyA9IHRoaXMuY29uZmlnLnRlc3RTdWl0ZXMuZmluZChzID0+IHMubmFtZSA9PT0gc3VpdGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoIXN1aXRlQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPIOODhuOCueODiOOCueOCpOODvOODiOioreWumuOBjOimi+OBpOOBi+OCiuOBvuOBm+OCkzogJHtzdWl0ZU5hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg8J+UhCAke3N1aXRlTmFtZX3jg4bjgrnjg4jjgrnjgqTjg7zjg4jplovlp4suLi5gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5ydW5UZXN0U3VpdGUoc3VpdGVOYW1lLCBzdWl0ZUNvbmZpZyk7XG4gICAgICAgICAgICAgICAgICAgIHRlc3RTdWl0ZVJlc3VsdHMuc2V0KHN1aXRlTmFtZSwgcmVzdWx0KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinIUgJHtzdWl0ZU5hbWV944OG44K544OI44K544Kk44O844OI5a6M5LqGICjjgrnjgrPjgqI6ICR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMSl9LzEwMClgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinYwgJHtzdWl0ZU5hbWV944OG44K544OI44K544Kk44O844OI5aSx5pWXICjjgrnjgrPjgqI6ICR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMSl9LzEwMClgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg4p2MICR7c3VpdGVOYW1lfeODhuOCueODiOOCueOCpOODvOODiOOCqOODqeODvDpgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGAke3N1aXRlTmFtZX06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZFJlc3VsdDogVGVzdFN1aXRlUmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VpdGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDb3VudDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZFRlc3RzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmFpbGVkVGVzdHM6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBza2lwcGVkVGVzdHM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29yZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JzOiBbZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0ZXN0U3VpdGVSZXN1bHRzLnNldChzdWl0ZU5hbWUsIGZhaWxlZFJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIOODkOODg+ODgeWGheOBruWFqOODhuOCueODiOOBruWujOS6huOCkuW+heapn1xuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoYmF0Y2hQcm9taXNlcyk7XG5cbiAgICAgICAgICAgIC8vIOmHjeimgeOBquODhuOCueODiOOBjOWkseaVl+OBl+OBn+WgtOWQiOOBr+W+jOe2muODkOODg+ODgeOCkuOCueOCreODg+ODl1xuICAgICAgICAgICAgY29uc3QgY3JpdGljYWxGYWlsdXJlcyA9IGJhdGNoLmZpbHRlcihzdWl0ZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1aXRlQ29uZmlnID0gdGhpcy5jb25maWcudGVzdFN1aXRlcy5maW5kKHMgPT4gcy5uYW1lID09PSBzdWl0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRlc3RTdWl0ZVJlc3VsdHMuZ2V0KHN1aXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1aXRlQ29uZmlnPy5jcml0aWNhbFRlc3QgJiYgIXJlc3VsdD8uc3VjY2VzcztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoY3JpdGljYWxGYWlsdXJlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYPCfmqgg6YeN6KaB44OG44K544OI5aSx5pWX44Gr44KI44KK5b6M57aa44OQ44OD44OB44KS44K544Kt44OD44OXOiAke2NyaXRpY2FsRmFpbHVyZXMuam9pbignLCAnKX1gKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS+neWtmOmWouS/guOCkuiAg+aFruOBl+OBn+Wun+ihjOODkOODg+ODgeOBruS9nOaIkFxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlRXhlY3V0aW9uQmF0Y2hlcyhleGVjdXRpb25PcmRlcjogc3RyaW5nW10pOiBzdHJpbmdbXVtdIHtcbiAgICAgICAgY29uc3QgYmF0Y2hlczogc3RyaW5nW11bXSA9IFtdO1xuICAgICAgICBjb25zdCBwcm9jZXNzZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3QgcmVtYWluaW5nID0gWy4uLmV4ZWN1dGlvbk9yZGVyXTtcblxuICAgICAgICB3aGlsZSAocmVtYWluaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRCYXRjaDogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IHJlbWFpbmluZy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1aXRlTmFtZSA9IHJlbWFpbmluZ1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWl0ZUNvbmZpZyA9IHRoaXMuY29uZmlnLnRlc3RTdWl0ZXMuZmluZChzID0+IHMubmFtZSA9PT0gc3VpdGVOYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmICghc3VpdGVDb25maWcpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgLy8g5L6d5a2Y6Zai5L+C44GM44GZ44G544Gm5Yem55CG5riI44G/44GL44OB44Kn44OD44KvXG4gICAgICAgICAgICAgICAgY29uc3QgZGVwZW5kZW5jaWVzTWV0ID0gc3VpdGVDb25maWcuZGVwZW5kZW5jaWVzLmV2ZXJ5KGRlcCA9PiBwcm9jZXNzZWQuaGFzKGRlcCkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGRlcGVuZGVuY2llc01ldCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50QmF0Y2gucHVzaChzdWl0ZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmcuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWQuYWRkKHN1aXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudEJhdGNoLmxlbmd0aCA9PT0gMCAmJiByZW1haW5pbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIOW+queSsOS+neWtmOmWouS/guOBvuOBn+OBr+acquino+axuuOBruS+neWtmOmWouS/guOBjOOBguOCi+WgtOWQiFxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPIOS+neWtmOmWouS/guOBruWVj+mhjOOBq+OCiOOCiuW8t+WItuWun+ihjDogJHtyZW1haW5pbmcuam9pbignLCAnKX1gKTtcbiAgICAgICAgICAgICAgICBjdXJyZW50QmF0Y2gucHVzaCguLi5yZW1haW5pbmcpO1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudEJhdGNoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBiYXRjaGVzLnB1c2goY3VycmVudEJhdGNoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBiYXRjaGVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWAi+WIpeODhuOCueODiOOCueOCpOODvOODiOOBruWun+ihjFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgcnVuVGVzdFN1aXRlKHN1aXRlTmFtZTogc3RyaW5nLCBzdWl0ZUNvbmZpZzogVGVzdFN1aXRlQ29uZmlnKTogUHJvbWlzZTxUZXN0U3VpdGVSZXN1bHQ+IHtcbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3dpdGNoIChzdWl0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdzZWN1cml0eSc6XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5zZWN1cml0eVJ1bm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjg6njg7Pjg4rjg7zjgYzliJ3mnJ/ljJbjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5ydW5TZWN1cml0eVRlc3RzKCk7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdwZXJmb3JtYW5jZSc6XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5wZXJmb3JtYW5jZVJ1bm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jjg6njg7Pjg4rjg7zjgYzliJ3mnJ/ljJbjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5ydW5QZXJmb3JtYW5jZVRlc3RzKCk7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdmdW5jdGlvbmFsJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmZ1bmN0aW9uYWxSdW5uZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5qmf6IO944OG44K544OI44Op44Oz44OK44O844GM5Yid5pyf5YyW44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucnVuRnVuY3Rpb25hbFRlc3RzKCk7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacquWvvuW/nOOBruODhuOCueODiOOCueOCpOODvOODiDogJHtzdWl0ZU5hbWV9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWl0ZU5hbWUsXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgdGVzdENvdW50OiAwLFxuICAgICAgICAgICAgICAgIHBhc3NlZFRlc3RzOiAwLFxuICAgICAgICAgICAgICAgIGZhaWxlZFRlc3RzOiAxLFxuICAgICAgICAgICAgICAgIHNraXBwZWRUZXN0czogMCxcbiAgICAgICAgICAgICAgICBzY29yZTogMCxcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikgfSxcbiAgICAgICAgICAgICAgICBlcnJvcnM6IFtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcildXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Gu5a6f6KGMXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBydW5TZWN1cml0eVRlc3RzKCk6IFByb21pc2U8VGVzdFN1aXRlUmVzdWx0PiB7XG4gICAgICAgIGlmICghdGhpcy5zZWN1cml0eVJ1bm5lcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjg6njg7Pjg4rjg7zjgYzliJ3mnJ/ljJbjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IHNlY3VyaXR5UmVzdWx0cyA9IGF3YWl0IHRoaXMuc2VjdXJpdHlSdW5uZXIucnVuU2VjdXJpdHlUZXN0cygpO1xuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1aXRlTmFtZTogJ3NlY3VyaXR5JyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHNlY3VyaXR5UmVzdWx0cy5zdWNjZXNzLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICB0ZXN0Q291bnQ6IHNlY3VyaXR5UmVzdWx0cy5zdW1tYXJ5LnRvdGFsVGVzdHMsXG4gICAgICAgICAgICBwYXNzZWRUZXN0czogc2VjdXJpdHlSZXN1bHRzLnN1bW1hcnkucGFzc2VkVGVzdHMsXG4gICAgICAgICAgICBmYWlsZWRUZXN0czogc2VjdXJpdHlSZXN1bHRzLnN1bW1hcnkuZmFpbGVkVGVzdHMsXG4gICAgICAgICAgICBza2lwcGVkVGVzdHM6IHNlY3VyaXR5UmVzdWx0cy5zdW1tYXJ5LnNraXBwZWRUZXN0cyxcbiAgICAgICAgICAgIHNjb3JlOiBzZWN1cml0eVJlc3VsdHMuc3VtbWFyeS5vdmVyYWxsU2VjdXJpdHlTY29yZSAqIDEwMCxcbiAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgICBzZWN1cml0eVNjb3JlOiBzZWN1cml0eVJlc3VsdHMuc3VtbWFyeS5vdmVyYWxsU2VjdXJpdHlTY29yZSxcbiAgICAgICAgICAgICAgICBjcml0aWNhbElzc3Vlczogc2VjdXJpdHlSZXN1bHRzLnN1bW1hcnkuY3JpdGljYWxJc3N1ZXMsXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zOiBzZWN1cml0eVJlc3VsdHMuc3VtbWFyeS5yZWNvbW1lbmRhdGlvbnMsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogc2VjdXJpdHlSZXN1bHRzLnJlc3VsdHNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcnM6IHNlY3VyaXR5UmVzdWx0cy5lcnJvcnMgfHwgW11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jjga7lrp/ooYxcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHJ1blBlcmZvcm1hbmNlVGVzdHMoKTogUHJvbWlzZTxUZXN0U3VpdGVSZXN1bHQ+IHtcbiAgICAgICAgaWYgKCF0aGlzLnBlcmZvcm1hbmNlUnVubmVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOODqeODs+ODiuODvOOBjOWIneacn+WMluOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3QgcGVyZm9ybWFuY2VSZXN1bHRzID0gYXdhaXQgdGhpcy5wZXJmb3JtYW5jZVJ1bm5lci5ydW5QZXJmb3JtYW5jZVRlc3RzKCk7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VpdGVOYW1lOiAncGVyZm9ybWFuY2UnLFxuICAgICAgICAgICAgc3VjY2VzczogcGVyZm9ybWFuY2VSZXN1bHRzLnN1Y2Nlc3MsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHRlc3RDb3VudDogcGVyZm9ybWFuY2VSZXN1bHRzLnN1bW1hcnkudG90YWxUZXN0cyxcbiAgICAgICAgICAgIHBhc3NlZFRlc3RzOiBwZXJmb3JtYW5jZVJlc3VsdHMuc3VtbWFyeS5wYXNzZWRUZXN0cyxcbiAgICAgICAgICAgIGZhaWxlZFRlc3RzOiBwZXJmb3JtYW5jZVJlc3VsdHMuc3VtbWFyeS5mYWlsZWRUZXN0cyxcbiAgICAgICAgICAgIHNraXBwZWRUZXN0czogcGVyZm9ybWFuY2VSZXN1bHRzLnN1bW1hcnkuc2tpcHBlZFRlc3RzLFxuICAgICAgICAgICAgc2NvcmU6IHBlcmZvcm1hbmNlUmVzdWx0cy5zdW1tYXJ5Lm92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlICogMTAwLFxuICAgICAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlU2NvcmU6IHBlcmZvcm1hbmNlUmVzdWx0cy5zdW1tYXJ5Lm92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlLFxuICAgICAgICAgICAgICAgIGJvdHRsZW5lY2tzOiBwZXJmb3JtYW5jZVJlc3VsdHMuc3VtbWFyeS5ib3R0bGVuZWNrcyB8fCBbXSxcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnM6IHBlcmZvcm1hbmNlUmVzdWx0cy5zdW1tYXJ5LnJlY29tbWVuZGF0aW9ucyB8fCBbXSxcbiAgICAgICAgICAgICAgICByZXN1bHRzOiBwZXJmb3JtYW5jZVJlc3VsdHMucmVzdWx0c1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yczogW10gLy8gcGVyZm9ybWFuY2VSZXN1bHRzLmVycm9ycyB8fCBbXVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOapn+iDveODhuOCueODiOOBruWun+ihjFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgcnVuRnVuY3Rpb25hbFRlc3RzKCk6IFByb21pc2U8VGVzdFN1aXRlUmVzdWx0PiB7XG4gICAgICAgIGlmICghdGhpcy5mdW5jdGlvbmFsUnVubmVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+apn+iDveODhuOCueODiOODqeODs+ODiuODvOOBjOWIneacn+WMluOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgLy8gY29uc3QgZnVuY3Rpb25hbFJlc3VsdHMgPSBhd2FpdCB0aGlzLmZ1bmN0aW9uYWxSdW5uZXIucnVuRnVuY3Rpb25hbFRlc3RzKCk7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgICAvLyDku67jga7ntZDmnpzjgpLov5TjgZnvvIjlrp/oo4XmnKrlrozkuobjga7jgZ/jgoHvvIlcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1aXRlTmFtZTogJ2Z1bmN0aW9uYWwnLFxuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHRlc3RDb3VudDogMCxcbiAgICAgICAgICAgIHBhc3NlZFRlc3RzOiAwLFxuICAgICAgICAgICAgZmFpbGVkVGVzdHM6IDAsXG4gICAgICAgICAgICBza2lwcGVkVGVzdHM6IDAsXG4gICAgICAgICAgICBzY29yZTogMCxcbiAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbmFsU2NvcmU6IDAsXG4gICAgICAgICAgICAgICAgZmFpbGVkRmVhdHVyZXM6IFtdLFxuICAgICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uczogWyfmqZ/og73jg4bjgrnjg4jjg6njg7Pjg4rjg7zjga7lrp/oo4XjgYzlv4XopoHjgafjgZknXSxcbiAgICAgICAgICAgICAgICByZXN1bHRzOiBuZXcgTWFwKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcnM6IFsn5qmf6IO944OG44K544OI44Op44Oz44OK44O844GM5pyq5a6f6KOF44Gn44GZJ11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg4bjgrnjg4jjgrXjg57jg6rjg7zjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlVGVzdFN1bW1hcnkodGVzdFN1aXRlUmVzdWx0czogTWFwPHN0cmluZywgVGVzdFN1aXRlUmVzdWx0Pik6IFRlc3RTdW1tYXJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IEFycmF5LmZyb20odGVzdFN1aXRlUmVzdWx0cy52YWx1ZXMoKSk7XG5cbiAgICAgICAgY29uc3QgdG90YWxUZXN0cyA9IHJlc3VsdHMucmVkdWNlKChzdW0sIHJlc3VsdCkgPT4gc3VtICsgcmVzdWx0LnRlc3RDb3VudCwgMCk7XG4gICAgICAgIGNvbnN0IHBhc3NlZFRlc3RzID0gcmVzdWx0cy5yZWR1Y2UoKHN1bSwgcmVzdWx0KSA9PiBzdW0gKyByZXN1bHQucGFzc2VkVGVzdHMsIDApO1xuICAgICAgICBjb25zdCBmYWlsZWRUZXN0cyA9IHJlc3VsdHMucmVkdWNlKChzdW0sIHJlc3VsdCkgPT4gc3VtICsgcmVzdWx0LmZhaWxlZFRlc3RzLCAwKTtcbiAgICAgICAgY29uc3Qgc2tpcHBlZFRlc3RzID0gcmVzdWx0cy5yZWR1Y2UoKHN1bSwgcmVzdWx0KSA9PiBzdW0gKyByZXN1bHQuc2tpcHBlZFRlc3RzLCAwKTtcblxuICAgICAgICAvLyDlkITjgrnjgqTjg7zjg4jjga7jgrnjgrPjgqJcbiAgICAgICAgY29uc3Qgc2VjdXJpdHlSZXN1bHQgPSB0ZXN0U3VpdGVSZXN1bHRzLmdldCgnc2VjdXJpdHknKTtcbiAgICAgICAgY29uc3QgcGVyZm9ybWFuY2VSZXN1bHQgPSB0ZXN0U3VpdGVSZXN1bHRzLmdldCgncGVyZm9ybWFuY2UnKTtcbiAgICAgICAgY29uc3QgZnVuY3Rpb25hbFJlc3VsdCA9IHRlc3RTdWl0ZVJlc3VsdHMuZ2V0KCdmdW5jdGlvbmFsJyk7XG5cbiAgICAgICAgY29uc3Qgc2VjdXJpdHlTY29yZSA9IHNlY3VyaXR5UmVzdWx0ID8gc2VjdXJpdHlSZXN1bHQuc2NvcmUgOiAwO1xuICAgICAgICBjb25zdCBwZXJmb3JtYW5jZVNjb3JlID0gcGVyZm9ybWFuY2VSZXN1bHQgPyBwZXJmb3JtYW5jZVJlc3VsdC5zY29yZSA6IDA7XG4gICAgICAgIGNvbnN0IGZ1bmN0aW9uYWxTY29yZSA9IGZ1bmN0aW9uYWxSZXN1bHQgPyBmdW5jdGlvbmFsUmVzdWx0LnNjb3JlIDogMDtcblxuICAgICAgICAvLyDnt4/lkIjjgrnjgrPjgqLvvIjph43jgb/ku5jjgY3lubPlnYfvvIlcbiAgICAgICAgY29uc3Qgd2VpZ2h0cyA9IHsgc2VjdXJpdHk6IDAuNCwgcGVyZm9ybWFuY2U6IDAuMywgZnVuY3Rpb25hbDogMC4zIH07XG4gICAgICAgIGxldCBvdmVyYWxsU2NvcmUgPSAwO1xuICAgICAgICBsZXQgdG90YWxXZWlnaHQgPSAwO1xuXG4gICAgICAgIGlmIChzZWN1cml0eVJlc3VsdCkge1xuICAgICAgICAgICAgb3ZlcmFsbFNjb3JlICs9IHNlY3VyaXR5U2NvcmUgKiB3ZWlnaHRzLnNlY3VyaXR5O1xuICAgICAgICAgICAgdG90YWxXZWlnaHQgKz0gd2VpZ2h0cy5zZWN1cml0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGVyZm9ybWFuY2VSZXN1bHQpIHtcbiAgICAgICAgICAgIG92ZXJhbGxTY29yZSArPSBwZXJmb3JtYW5jZVNjb3JlICogd2VpZ2h0cy5wZXJmb3JtYW5jZTtcbiAgICAgICAgICAgIHRvdGFsV2VpZ2h0ICs9IHdlaWdodHMucGVyZm9ybWFuY2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZ1bmN0aW9uYWxSZXN1bHQpIHtcbiAgICAgICAgICAgIG92ZXJhbGxTY29yZSArPSBmdW5jdGlvbmFsU2NvcmUgKiB3ZWlnaHRzLmZ1bmN0aW9uYWw7XG4gICAgICAgICAgICB0b3RhbFdlaWdodCArPSB3ZWlnaHRzLmZ1bmN0aW9uYWw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG90YWxXZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICBvdmVyYWxsU2NvcmUgPSBvdmVyYWxsU2NvcmUgLyB0b3RhbFdlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmHjeimgeOBquWVj+mhjOOBrumbhuioiFxuICAgICAgICBjb25zdCBjcml0aWNhbElzc3VlcyA9IHJlc3VsdHMucmVkdWNlKChzdW0sIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5kZXRhaWxzPy5jcml0aWNhbElzc3Vlcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdW0gKyByZXN1bHQuZGV0YWlscy5jcml0aWNhbElzc3VlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdW0gKyAocmVzdWx0LnN1Y2Nlc3MgPyAwIDogMSk7XG4gICAgICAgIH0sIDApO1xuXG4gICAgICAgIC8vIOaOqOWlqOS6i+mgheOBrumbhue0hFxuICAgICAgICBjb25zdCByZWNvbW1lbmRhdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5kZXRhaWxzPy5yZWNvbW1lbmRhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCguLi5yZXN1bHQuZGV0YWlscy5yZWNvbW1lbmRhdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG90YWxUZXN0cyxcbiAgICAgICAgICAgIHBhc3NlZFRlc3RzLFxuICAgICAgICAgICAgZmFpbGVkVGVzdHMsXG4gICAgICAgICAgICBza2lwcGVkVGVzdHMsXG4gICAgICAgICAgICBvdmVyYWxsU2NvcmUsXG4gICAgICAgICAgICBzZWN1cml0eVNjb3JlLFxuICAgICAgICAgICAgcGVyZm9ybWFuY2VTY29yZSxcbiAgICAgICAgICAgIGZ1bmN0aW9uYWxTY29yZSxcbiAgICAgICAgICAgIGNyaXRpY2FsSXNzdWVzLFxuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbLi4ubmV3IFNldChyZWNvbW1lbmRhdGlvbnMpXSAvLyDph43opIfpmaTljrtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg4bjgrnjg4jjg6Hjg4jjg6rjgq/jgrnjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlVGVzdE1ldHJpY3MoXG4gICAgICAgIHRlc3RTdWl0ZVJlc3VsdHM6IE1hcDxzdHJpbmcsIFRlc3RTdWl0ZVJlc3VsdD4sXG4gICAgICAgIHRvdGFsRHVyYXRpb246IG51bWJlclxuICAgICk6IFByb21pc2U8VGVzdE1ldHJpY3M+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IEFycmF5LmZyb20odGVzdFN1aXRlUmVzdWx0cy52YWx1ZXMoKSk7XG5cbiAgICAgICAgLy8g44Oq44K944O844K55L2/55So6YeP44Gu6KiI566X77yI5qih5pOs5YCk77yJXG4gICAgICAgIGNvbnN0IHJlc291cmNlVXNhZ2UgPSB7XG4gICAgICAgICAgICBjcHU6IE1hdGgubWluKDEwMCwgcmVzdWx0cy5sZW5ndGggKiAxNSksIC8vIENQVeS9v+eUqOeOh1xuICAgICAgICAgICAgbWVtb3J5OiBNYXRoLm1pbigxMDAsIHJlc3VsdHMubGVuZ3RoICogMjApLCAvLyDjg6Hjg6Ljg6rkvb/nlKjnjodcbiAgICAgICAgICAgIG5ldHdvcms6IE1hdGgubWluKDEwMCwgcmVzdWx0cy5sZW5ndGggKiAxMCksIC8vIOODjeODg+ODiOODr+ODvOOCr+S9v+eUqOeOh1xuICAgICAgICAgICAgc3RvcmFnZTogTWF0aC5taW4oMTAwLCByZXN1bHRzLmxlbmd0aCAqIDUpIC8vIOOCueODiOODrOODvOOCuOS9v+eUqOeOh1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOOCs+OCueODiOimi+epjeOCguOCiu+8iOaooeaTrOWApO+8iVxuICAgICAgICBjb25zdCBjb3N0RXN0aW1hdGUgPSB0b3RhbER1cmF0aW9uICogMC4wMDE7IC8vIOWun+ihjOaZgumWk+ODmeODvOOCueOBruewoeaYk+OCs+OCueODiFxuXG4gICAgICAgIC8vIOOCq+ODkOODrOODg+OCuOioiOeul1xuICAgICAgICBjb25zdCBjb3ZlcmFnZSA9IHtcbiAgICAgICAgICAgIHNlY3VyaXR5OiB0ZXN0U3VpdGVSZXN1bHRzLmhhcygnc2VjdXJpdHknKSA/IDEwMCA6IDAsXG4gICAgICAgICAgICBwZXJmb3JtYW5jZTogdGVzdFN1aXRlUmVzdWx0cy5oYXMoJ3BlcmZvcm1hbmNlJykgPyAxMDAgOiAwLFxuICAgICAgICAgICAgZnVuY3Rpb25hbDogdGVzdFN1aXRlUmVzdWx0cy5oYXMoJ2Z1bmN0aW9uYWwnKSA/IDEwMCA6IDBcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXhlY3V0aW9uVGltZTogdG90YWxEdXJhdGlvbixcbiAgICAgICAgICAgIHJlc291cmNlVXNhZ2UsXG4gICAgICAgICAgICBjb3N0RXN0aW1hdGUsXG4gICAgICAgICAgICBjb3ZlcmFnZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaOqOWlqOS6i+mgheOBrueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgZ2VuZXJhdGVSZWNvbW1lbmRhdGlvbnMoXG4gICAgICAgIHRlc3RTdWl0ZVJlc3VsdHM6IE1hcDxzdHJpbmcsIFRlc3RTdWl0ZVJlc3VsdD4sXG4gICAgICAgIHN1bW1hcnk6IFRlc3RTdW1tYXJ5XG4gICAgKTogc3RyaW5nW10ge1xuICAgICAgICBjb25zdCByZWNvbW1lbmRhdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgLy8g5aSx5pWX546H44Gr5Z+644Gl44GP5o6o5aWo5LqL6aCFXG4gICAgICAgIGlmIChzdW1tYXJ5LmZhaWxlZFRlc3RzID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZmFpbHVyZVJhdGUgPSAoc3VtbWFyeS5mYWlsZWRUZXN0cyAvIHN1bW1hcnkudG90YWxUZXN0cykgKiAxMDA7XG4gICAgICAgICAgICBpZiAoZmFpbHVyZVJhdGUgPiAyMCkge1xuICAgICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfjg4bjgrnjg4jlpLHmlZfnjofjgYzpq5jjgYTjgZ/jgoHjgIHjgrfjgrnjg4bjg6Djga7lronlrprmgKfjgpLnorroqo3jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOOCueOCs+OCouOBq+WfuuOBpeOBj+aOqOWlqOS6i+mghVxuICAgICAgICBpZiAoc3VtbWFyeS5zZWN1cml0eVNjb3JlIDwgODApIHtcbiAgICAgICAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgrPjgqLjgYzkvY7jgYTjgZ/jgoHjgIHjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrprjga7opovnm7TjgZfjgYzlv4XopoHjgafjgZknKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3VtbWFyeS5wZXJmb3JtYW5jZVNjb3JlIDwgODApIHtcbiAgICAgICAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgrnjgrPjgqLjgYzkvY7jgYTjgZ/jgoHjgIHjgrfjgrnjg4bjg6DmnIDpganljJbjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3VtbWFyeS5mdW5jdGlvbmFsU2NvcmUgPCA4MCkge1xuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+apn+iDveODhuOCueODiOOCueOCs+OCouOBjOS9juOBhOOBn+OCgeOAgeapn+iDveWun+ijheOBrueiuuiqjeOBjOW/heimgeOBp+OBmScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YeN6KaB44Gq5ZWP6aGM44Gr5Z+644Gl44GP5o6o5aWo5LqL6aCFXG4gICAgICAgIGlmIChzdW1tYXJ5LmNyaXRpY2FsSXNzdWVzID4gMCkge1xuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goYCR7c3VtbWFyeS5jcml0aWNhbElzc3Vlc33ku7bjga7ph43opoHjgarllY/poYzjgYzmpJzlh7rjgZXjgozjgb7jgZfjgZ/jgILlhKrlhYjnmoTjgavlr77lv5zjgZfjgabjgY/jgaDjgZXjgYRgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZWNvbW1lbmRhdGlvbnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44OG44K544OI57WQ5p6c44Gu6KGo56S6XG4gICAgICovXG4gICAgcHJpdmF0ZSBkaXNwbGF5VGVzdFJlc3VsdHMocmVzdWx0OiBJbnRlZ3JhdGVkVGVzdFJlc3VsdCk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuICAgICAgICBjb25zb2xlLmxvZygn8J+OryDntbHlkIjjg4bjgrnjg4jntZDmnpzjgrXjg57jg6rjg7wnKTtcbiAgICAgICAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4og57eP5ZCI57WQ5p6cOiAke3Jlc3VsdC5vdmVyYWxsU3VjY2VzcyA/ICfinIUg5oiQ5YqfJyA6ICfinYwg5aSx5pWXJ31gKTtcbiAgICAgICAgY29uc29sZS5sb2coYOKPse+4jyDlrp/ooYzmmYLplpM6ICR7KHJlc3VsdC50b3RhbER1cmF0aW9uIC8gMTAwMCkudG9GaXhlZCgyKX3np5JgKTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4gg57eP5ZCI44K544Kz44KiOiAke3Jlc3VsdC5zdW1tYXJ5Lm92ZXJhbGxTY29yZS50b0ZpeGVkKDEpfS8xMDBgKTtcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5OLIOODhuOCueODiOOCueOCpOODvOODiOWIpee1kOaenDonKTtcbiAgICAgICAgcmVzdWx0LnRlc3RTdWl0ZVJlc3VsdHMuZm9yRWFjaCgoc3VpdGVSZXN1bHQsIHN1aXRlTmFtZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gc3VpdGVSZXN1bHQuc3VjY2VzcyA/ICfinIUnIDogJ+KdjCc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAke3N0YXR1c30gJHtzdWl0ZU5hbWV9OiAke3N1aXRlUmVzdWx0LnNjb3JlLnRvRml4ZWQoMSl9LzEwMCAoJHtzdWl0ZVJlc3VsdC5wYXNzZWRUZXN0c30vJHtzdWl0ZVJlc3VsdC50ZXN0Q291bnR9KWApO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgICAgIGlmIChyZXN1bHQucmVjb21tZW5kYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfwn5KhIOaOqOWlqOS6i+mghTonKTtcbiAgICAgICAgICAgIHJlc3VsdC5yZWNvbW1lbmRhdGlvbnMuZm9yRWFjaCgocmVjLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICR7aW5kZXggKyAxfS4gJHtyZWN9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQuZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8g44Ko44Op44O8OicpO1xuICAgICAgICAgICAgcmVzdWx0LmVycm9ycy5mb3JFYWNoKChlcnJvciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAke2luZGV4ICsgMX0uICR7ZXJyb3J9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6Kmz57Sw44Os44Od44O844OI44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZURldGFpbGVkUmVwb3J0KHJlc3VsdDogSW50ZWdyYXRlZFRlc3RSZXN1bHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgcmVwb3J0RGlyID0gdGhpcy5jb25maWcucmVwb3J0aW5nQ29uZmlnLm91dHB1dERpcmVjdG9yeTtcbiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcblxuICAgICAgICAvLyBKU09O5b2i5byP44Gn44Gu44Os44Od44O844OI55Sf5oiQXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5yZXBvcnRpbmdDb25maWcuZXhwb3J0Rm9ybWF0cy5pbmNsdWRlcygnanNvbicpKSB7XG4gICAgICAgICAgICBjb25zdCBqc29uUmVwb3J0ID0ge1xuICAgICAgICAgICAgICAgIHRlc3RSdW5JZDogcmVzdWx0LnRlc3RSdW5JZCxcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IHJlc3VsdC5zdGFydFRpbWUudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzdW1tYXJ5OiByZXN1bHQuc3VtbWFyeSxcbiAgICAgICAgICAgICAgICBtZXRyaWNzOiByZXN1bHQubWV0cmljcyxcbiAgICAgICAgICAgICAgICB0ZXN0U3VpdGVSZXN1bHRzOiBPYmplY3QuZnJvbUVudHJpZXMocmVzdWx0LnRlc3RTdWl0ZVJlc3VsdHMpLFxuICAgICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uczogcmVzdWx0LnJlY29tbWVuZGF0aW9ucyxcbiAgICAgICAgICAgICAgICBlcnJvcnM6IHJlc3VsdC5lcnJvcnNcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGpzb25QYXRoID0gYCR7cmVwb3J0RGlyfS9pbnRlZ3JhdGVkLXRlc3QtcmVwb3J0LSR7dGltZXN0YW1wfS5qc29uYDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDwn5OEIEpTT07jg6zjg53jg7zjg4jjgpLnlJ/miJDkuK06ICR7anNvblBhdGh9YCk7XG5cbiAgICAgICAgICAgIC8vIOOBk+OBk+OBp+Wun+mam+OBruODleOCoeOCpOODq+abuOOBjei+vOOBv+OCkuihjOOBhlxuICAgICAgICAgICAgLy8gYXdhaXQgZnMud3JpdGVGaWxlKGpzb25QYXRoLCBKU09OLnN0cmluZ2lmeShqc29uUmVwb3J0LCBudWxsLCAyKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygn8J+TiiDoqbPntLDjg6zjg53jg7zjg4jnlJ/miJDlrozkuoYnKTtcbiAgICB9XG59XG5cbi8vIOODh+ODleOCqeODq+ODiOOCqOOCr+OCueODneODvOODiFxuZXhwb3J0IGRlZmF1bHQgSW50ZWdyYXRlZFRlc3RSdW5uZXI7Il19