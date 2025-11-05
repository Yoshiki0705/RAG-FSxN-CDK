"use strict";
/**
 * パフォーマンス統合テストランナー
 * 全パフォーマンステストの統合実行と結果集計
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceIntegrationTestRunner = void 0;
exports.runPerformanceIntegrationTest = runPerformanceIntegrationTest;
// 定数定義
const PERFORMANCE_TEST_CONSTANTS = {
    VALIDATION_LIMITS: {
        MAX_RESPONSE_TIME_MS: 30000,
        MAX_THROUGHPUT_RPS: 10000,
        MAX_CONCURRENT_USERS: 100000,
        MAX_TEST_DURATION_SEC: 3600
    },
    DEFAULT_VALUES: {
        CONCURRENT_REQUESTS: 10,
        RAMP_UP_TIME_SEC: 60,
        CHECK_INTERVAL_SEC: 30,
        CONSECUTIVE_FAILURES: 3
    },
    SUCCESS_THRESHOLDS: {
        OVERALL_PERFORMANCE_SCORE: 80,
        ERROR_RATE: 0.05,
        UPTIME_PERCENTAGE: 99.0
    }
};
const response_time_test_1 = require("./response-time-test");
const concurrent_load_test_1 = require("./concurrent-load-test");
const uptime_monitoring_test_1 = require("./uptime-monitoring-test");
const multi_region_scalability_test_1 = require("./multi-region-scalability-test");
const lodash_1 = require("lodash");
const process_1 = require("process");
class PerformanceIntegrationTestRunner {
    config;
    testStartTime = 0;
    constructor(config) {
        // 設定の検証
        this.validateConfig(config);
        this.config = config;
    }
    /**
     * 設定の検証
     */
    validateConfig(config) {
        // baseURL の検証
        if (!config.baseUrl || typeof config.baseUrl !== 'string') {
            throw new Error('baseUrl は必須です');
        }
        try {
            new URL(config.baseUrl);
        }
        catch (error) {
            throw new Error('無効な baseUrl です');
        }
        // パフォーマンス目標値の検証
        if (config.performanceTargets.maxResponseTime <= 0 ||
            config.performanceTargets.maxResponseTime > PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_RESPONSE_TIME_MS) {
            throw new Error(`maxResponseTime は 1-${PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_RESPONSE_TIME_MS}ms の範囲で設定してください`);
        }
        if (config.performanceTargets.minThroughput <= 0 ||
            config.performanceTargets.minThroughput > PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_THROUGHPUT_RPS) {
            throw new Error(`minThroughput は 1-${PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_THROUGHPUT_RPS} req/s の範囲で設定してください`);
        }
        if (config.performanceTargets.minUptime < 0 || config.performanceTargets.minUptime > 100) {
            throw new Error('minUptime は 0-100% の範囲で設定してください');
        }
        if (config.performanceTargets.maxConcurrentUsers <= 0 ||
            config.performanceTargets.maxConcurrentUsers > PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_CONCURRENT_USERS) {
            throw new Error(`maxConcurrentUsers は 1-${PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_CONCURRENT_USERS} の範囲で設定してください`);
        }
        // テスト期間の検証
        Object.entries(config.testDuration).forEach(([key, value]) => {
            if (value <= 0 || value > PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_TEST_DURATION_SEC) {
                throw new Error(`testDuration.${key} は 1-${PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_TEST_DURATION_SEC}秒 の範囲で設定してください`);
            }
        });
    }
    /**
     * パフォーマンス統合テストの実行
     */
    async runTests() {
        console.log('⚡ パフォーマンス統合テストを開始します...');
        console.log(`🌐 テスト環境: ${this.config.testEnvironment}`);
        console.log(`🔗 ベースURL: ${this.config.baseUrl}`);
        this.testStartTime = Date.now();
        try {
            const results = {
                testName: 'PerformanceIntegrationTest',
                success: false,
                duration: 0,
                details: {}
            };
            // 並列実行可能なテストを特定
            const parallelTests = [];
            const sequentialTests = [];
            // 応答時間測定テスト（並列実行可能）
            if (this.config.enabledTests.responseTime) {
                console.log('\n⏱️ 応答時間測定テストを実行中...');
                parallelTests.push(this.runResponseTimeTest().then(result => {
                    results.responseTimeResult = result;
                }));
            }
            // 稼働率監視テスト（並列実行可能）
            if (this.config.enabledTests.uptimeMonitoring) {
                console.log('\n📊 稼働率監視テストを実行中...');
                parallelTests.push(this.runUptimeMonitoringTest().then(result => {
                    results.uptimeMonitoringResult = result;
                }));
            }
            // 並列実行可能なテストを実行
            if (parallelTests.length > 0) {
                await Promise.allSettled(parallelTests);
            }
            // 同時ユーザー負荷テスト（システムに負荷をかけるため単独実行）
            if (this.config.enabledTests.concurrentLoad) {
                console.log('\n👥 同時ユーザー負荷テストを実行中...');
                results.concurrentLoadResult = await this.runConcurrentLoadTest();
            }
            // マルチリージョンスケーラビリティテスト（システムに負荷をかけるため単独実行）
            if (this.config.enabledTests.multiRegionScalability) {
                console.log('\n🌍 マルチリージョンスケーラビリティテストを実行中...');
                results.multiRegionScalabilityResult = await this.runMultiRegionScalabilityTest();
            }
            // 結果の統合と評価
            const finalResult = this.aggregateResults(results);
            return finalResult;
        }
        catch (error) {
            console.error('❌ パフォーマンス統合テストでエラーが発生:', error);
            return {
                testName: 'PerformanceIntegrationTest',
                success: false,
                duration: Date.now() - this.testStartTime,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    testEnvironment: this.config.testEnvironment
                },
                overallPerformanceScore: 0,
                responseTimeScore: 0,
                scalabilityScore: 0,
                reliabilityScore: 0,
                globalPerformanceScore: 0,
                performanceSummary: {
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 1,
                    averageResponseTime: 0,
                    peakThroughput: 0,
                    systemUptime: 0,
                    maxSupportedUsers: 0,
                    criticalIssues: 1,
                    performanceBottlenecks: ['system_error'],
                    scalabilityLimitations: ['テスト実行エラー']
                },
                recommendations: [
                    'システムの接続と設定を確認してください',
                    'テスト環境の準備状況を確認してください'
                ]
            };
        }
    }
    /**
     * 応答時間測定テストの実行
     */
    async runResponseTimeTest() {
        try {
            const config = {
                baseUrl: this.config.baseUrl,
                testEndpoints: [
                    { path: '/', method: 'GET', expectedResponseTime: this.config.performanceTargets.maxResponseTime },
                    { path: '/chatbot', method: 'GET', expectedResponseTime: this.config.performanceTargets.maxResponseTime },
                    { path: '/api/health', method: 'GET', expectedResponseTime: 500 }
                ],
                testDuration: this.config.testDuration.responseTime,
                concurrentRequests: PERFORMANCE_TEST_CONSTANTS.DEFAULT_VALUES.CONCURRENT_REQUESTS,
                performanceThresholds: {
                    averageResponseTime: this.config.performanceTargets.maxResponseTime,
                    p95ResponseTime: this.config.performanceTargets.maxResponseTime * 1.5,
                    errorRate: 0.01
                }
            };
            const test = new response_time_test_1.ResponseTimeTest(config);
            return await test.runTest();
        }
        catch (error) {
            console.error('❌ 応答時間テスト実行エラー:', error);
            throw error;
        }
    }
    /**
     * 同時ユーザー負荷テストの実行
     */
    async runConcurrentLoadTest() {
        try {
            const config = {
                baseUrl: this.config.baseUrl,
                maxConcurrentUsers: this.config.performanceTargets.maxConcurrentUsers,
                testDuration: this.config.testDuration.loadTest,
                rampUpTime: PERFORMANCE_TEST_CONSTANTS.DEFAULT_VALUES.RAMP_UP_TIME_SEC,
                testScenarios: [
                    {
                        name: 'ページ閲覧',
                        weight: 0.6,
                        actions: [
                            { type: 'GET', path: '/', weight: 0.4 },
                            { type: 'GET', path: '/chatbot', weight: 0.6 }
                        ]
                    },
                    {
                        name: 'チャット操作',
                        weight: 0.4,
                        actions: [
                            { type: 'POST', path: '/api/chat', weight: 1.0 }
                        ]
                    }
                ],
                performanceTargets: {
                    maxResponseTime: this.config.performanceTargets.maxResponseTime,
                    minThroughput: this.config.performanceTargets.minThroughput,
                    maxErrorRate: 0.05
                }
            };
            const test = new concurrent_load_test_1.ConcurrentLoadTest(config);
            return await test.runTest();
        }
        catch (error) {
            console.error('❌ 同時ユーザー負荷テスト実行エラー:', error);
            throw error;
        }
    }
    /**
     * 稼働率監視テストの実行
     */
    async runUptimeMonitoringTest() {
        try {
            const config = {
                baseUrl: this.config.baseUrl,
                monitoringDuration: this.config.testDuration.uptimeMonitoring,
                checkInterval: PERFORMANCE_TEST_CONSTANTS.DEFAULT_VALUES.CHECK_INTERVAL_SEC,
                endpoints: [
                    { path: '/', name: 'ホームページ' },
                    { path: '/chatbot', name: 'チャットボット' },
                    { path: '/api/health', name: 'ヘルスチェック' }
                ],
                uptimeTarget: this.config.performanceTargets.minUptime,
                alertThresholds: {
                    responseTime: this.config.performanceTargets.maxResponseTime,
                    errorRate: 0.05,
                    consecutiveFailures: PERFORMANCE_TEST_CONSTANTS.DEFAULT_VALUES.CONSECUTIVE_FAILURES
                }
            };
            const test = new uptime_monitoring_test_1.UptimeMonitoringTest(config);
            return await test.runTest();
        }
        catch (error) {
            console.error('❌ 稼働率監視テスト実行エラー:', error);
            throw error;
        }
    }
    /**
     * マルチリージョンスケーラビリティテストの実行
     */
    async runMultiRegionScalabilityTest() {
        try {
            const config = {
                regions: [
                    { name: 'ap-northeast-1', baseUrl: this.config.baseUrl, weight: 0.6 },
                    { name: 'us-east-1', baseUrl: this.config.baseUrl.replace('ap-northeast-1', 'us-east-1'), weight: 0.4 }
                ],
                testDuration: this.config.testDuration.scalabilityTest,
                scalabilityTargets: {
                    maxLatencyIncrease: 0.5,
                    minThroughputMaintenance: 0.8,
                    maxErrorRateIncrease: 0.02
                },
                loadPatterns: [
                    { type: 'gradual', duration: 300, targetUsers: 100 },
                    { type: 'spike', duration: 60, targetUsers: 500 },
                    { type: 'sustained', duration: 600, targetUsers: 200 }
                ]
            };
            const test = new multi_region_scalability_test_1.MultiRegionScalabilityTest(config);
            return await test.runTest();
        }
        catch (error) {
            console.error('❌ マルチリージョンスケーラビリティテスト実行エラー:', error);
            throw error;
        }
    }
    /**
     * テスト結果の統合と評価
     */
    aggregateResults(results) {
        const duration = Date.now() - this.testStartTime;
        // 各テストの成功/失敗をカウント
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        // スコア計算
        let responseTimeScore = 0;
        let scalabilityScore = 0;
        let reliabilityScore = 0;
        let globalPerformanceScore = 0;
        // 応答時間テスト結果の評価
        if (results.responseTimeResult) {
            totalTests++;
            if (results.responseTimeResult.success) {
                passedTests++;
                responseTimeScore = results.responseTimeResult.performanceMetrics?.overallScore || 0;
            }
            else {
                failedTests++;
            }
        }
        // 負荷テスト結果の評価
        if (results.concurrentLoadResult) {
            totalTests++;
            if (results.concurrentLoadResult.success) {
                passedTests++;
                scalabilityScore = results.concurrentLoadResult.loadMetrics?.scalabilityScore || 0;
            }
            else {
                failedTests++;
            }
        }
        // 稼働率テスト結果の評価
        if (results.uptimeMonitoringResult) {
            totalTests++;
            if (results.uptimeMonitoringResult.success) {
                passedTests++;
                reliabilityScore = results.uptimeMonitoringResult.uptimeMetrics?.overallUptimeScore || 0;
            }
            else {
                failedTests++;
            }
        }
        // マルチリージョンテスト結果の評価
        if (results.multiRegionScalabilityResult) {
            totalTests++;
            if (results.multiRegionScalabilityResult.success) {
                passedTests++;
                globalPerformanceScore = results.multiRegionScalabilityResult.scalabilityMetrics?.globalPerformanceScore || 0;
            }
            else {
                failedTests++;
            }
        }
        // 総合スコア計算
        const overallPerformanceScore = totalTests > 0 ?
            (responseTimeScore + scalabilityScore + reliabilityScore + globalPerformanceScore) / totalTests : 0;
        // パフォーマンスサマリーの作成
        const performanceSummary = {
            totalTests,
            passedTests,
            failedTests,
            averageResponseTime: results.responseTimeResult?.performanceMetrics?.averageResponseTime || 0,
            peakThroughput: results.concurrentLoadResult?.loadMetrics?.peakThroughput || 0,
            systemUptime: results.uptimeMonitoringResult?.uptimeMetrics?.overallUptimeScore || 0,
            maxSupportedUsers: results.concurrentLoadResult?.loadMetrics?.maxSupportedUsers || 0,
            criticalIssues: failedTests,
            performanceBottlenecks: this.identifyPerformanceBottlenecks(results),
            scalabilityLimitations: this.identifyScalabilityLimitations(results)
        };
        // 推奨事項の生成
        const recommendations = this.generateRecommendations(results, performanceSummary);
        const success = passedTests === totalTests && overallPerformanceScore >= PERFORMANCE_TEST_CONSTANTS.SUCCESS_THRESHOLDS.OVERALL_PERFORMANCE_SCORE;
        return {
            testName: 'PerformanceIntegrationTest',
            success,
            duration,
            details: {
                testEnvironment: this.config.testEnvironment,
                enabledTests: this.config.enabledTests,
                performanceTargets: this.config.performanceTargets
            },
            ...results,
            overallPerformanceScore,
            responseTimeScore,
            scalabilityScore,
            reliabilityScore,
            globalPerformanceScore,
            performanceSummary,
            recommendations
        };
    }
    /**
     * パフォーマンスボトルネックの特定
     */
    identifyPerformanceBottlenecks(results) {
        const bottlenecks = [];
        if (results.responseTimeResult && !results.responseTimeResult.success) {
            bottlenecks.push('応答時間の遅延');
        }
        if (results.concurrentLoadResult && !results.concurrentLoadResult.success) {
            bottlenecks.push('同時ユーザー処理能力の不足');
        }
        if (results.uptimeMonitoringResult && !results.uptimeMonitoringResult.success) {
            bottlenecks.push('システム安定性の問題');
        }
        if (results.multiRegionScalabilityResult && !results.multiRegionScalabilityResult.success) {
            bottlenecks.push('マルチリージョン間の性能差');
        }
        return bottlenecks;
    }
    /**
     * スケーラビリティ制限の特定
     */
    identifyScalabilityLimitations(results) {
        const limitations = [];
        if (results.concurrentLoadResult?.loadMetrics?.maxSupportedUsers &&
            results.concurrentLoadResult.loadMetrics.maxSupportedUsers < this.config.performanceTargets.maxConcurrentUsers) {
            limitations.push(`同時ユーザー数の上限: ${results.concurrentLoadResult.loadMetrics.maxSupportedUsers}人`);
        }
        if (results.multiRegionScalabilityResult?.scalabilityMetrics?.regionPerformanceVariance &&
            results.multiRegionScalabilityResult.scalabilityMetrics.regionPerformanceVariance > 0.3) {
            limitations.push('リージョン間の性能差が大きい');
        }
        return limitations;
    }
    /**
     * 改善推奨事項の生成
     */
    generateRecommendations(results, summary) {
        const recommendations = [];
        if (summary.averageResponseTime > this.config.performanceTargets.maxResponseTime) {
            recommendations.push('CDNキャッシュの最適化を検討してください');
            recommendations.push('Lambda関数のメモリ設定を見直してください');
        }
        if (summary.peakThroughput < this.config.performanceTargets.minThroughput) {
            recommendations.push('Auto Scalingの設定を調整してください');
            recommendations.push('データベース接続プールの最適化を検討してください');
        }
        if (summary.systemUptime < this.config.performanceTargets.minUptime) {
            recommendations.push('ヘルスチェックの頻度を増やしてください');
            recommendations.push('エラー監視とアラートの設定を強化してください');
        }
        if (summary.criticalIssues > 0) {
            recommendations.push('クリティカルな問題の根本原因分析を実施してください');
        }
        return recommendations;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 パフォーマンス統合テストランナーをクリーンアップ中...');
        console.log('✅ パフォーマンス統合テストランナーのクリーンアップ完了');
    }
}
exports.PerformanceIntegrationTestRunner = PerformanceIntegrationTestRunner;
/
    **
    * 応答時間測定テストの実行
    * /;
async;
runResponseTimeTest();
Promise < response_time_test_1.ResponseTimeTestResult > {
    const: process_1.config, ResponseTimeTestConfig: response_time_test_1.ResponseTimeTestConfig = {
        baseUrl: this.config.baseUrl,
        testQueries: [
            {
                id: 'simple_1',
                query: 'こんにちは',
                type: 'simple',
                expectedResponseTime: 800,
                category: 'general',
                requiresRAG: false,
                requiresAI: true
            },
            {
                id: 'standard_1',
                query: 'AWS Lambda の基本的な使い方を教えてください',
                type: 'standard',
                expectedResponseTime: this.config.performanceTargets.maxResponseTime,
                category: 'technical',
                requiresRAG: true,
                requiresAI: true
            },
            {
                id: 'complex_1',
                query: 'マルチリージョンでのAWSアーキテクチャ設計について詳しく説明してください',
                type: 'complex',
                expectedResponseTime: this.config.performanceTargets.maxResponseTime * 2,
                category: 'technical',
                requiresRAG: true,
                requiresAI: true
            }
        ],
        performanceThresholds: {
            standardQueryTime: this.config.performanceTargets.maxResponseTime,
            complexQueryTime: this.config.performanceTargets.maxResponseTime * 2,
            simpleQueryTime: this.config.performanceTargets.maxResponseTime / 2,
            averageResponseTime: this.config.performanceTargets.maxResponseTime,
            percentile95Time: this.config.performanceTargets.maxResponseTime * 1.5,
            percentile99Time: this.config.performanceTargets.maxResponseTime * 2
        },
        testParameters: {
            warmupQueries: 3,
            measurementQueries: 10,
            concurrentRequests: 1,
            requestInterval: 1000
        },
        networkConditions: [
            {
                name: 'Fast 3G',
                bandwidth: 1.6,
                latency: 150,
                packetLoss: 0,
                enabled: true
            },
            {
                name: 'Slow 3G',
                bandwidth: 0.4,
                latency: 300,
                packetLoss: 0,
                enabled: this.config.testEnvironment !== 'production'
            }
        ]
    },
    const: test = new response_time_test_1.ResponseTimeTest(process_1.config),
    return: await test.runTest()
};
async;
runConcurrentLoadTest();
Promise < concurrent_load_test_1.ConcurrentLoadTestResult > {
    const: process_1.config, ConcurrentLoadTestConfig: concurrent_load_test_1.ConcurrentLoadTestConfig = {
        baseUrl: this.config.baseUrl,
        loadScenarios: [
            {
                name: 'Light Load',
                concurrentUsers: Math.floor(this.config.performanceTargets.maxConcurrentUsers * 0.25),
                duration: this.config.testDuration.loadTest,
                userBehavior: {
                    loginFrequency: 10,
                    chatFrequency: 60,
                    searchFrequency: 20,
                    idleTime: 5,
                    sessionLength: 10
                },
                enabled: true
            },
            {
                name: 'Medium Load',
                concurrentUsers: Math.floor(this.config.performanceTargets.maxConcurrentUsers * 0.5),
                duration: this.config.testDuration.loadTest,
                userBehavior: {
                    loginFrequency: 15,
                    chatFrequency: 50,
                    searchFrequency: 25,
                    idleTime: 3,
                    sessionLength: 15
                },
                enabled: true
            },
            {
                name: 'Heavy Load',
                concurrentUsers: this.config.performanceTargets.maxConcurrentUsers,
                duration: this.config.testDuration.loadTest,
                userBehavior: {
                    loginFrequency: 20,
                    chatFrequency: 40,
                    searchFrequency: 30,
                    idleTime: 2,
                    sessionLength: 20
                },
                enabled: true
            }
        ],
        userProfiles: [
            {
                type: 'light',
                weight: 40,
                actionsPerMinute: 2,
                sessionDuration: 300,
                queryComplexity: 'simple'
            },
            {
                type: 'moderate',
                weight: 40,
                actionsPerMinute: 4,
                sessionDuration: 600,
                queryComplexity: 'standard'
            },
            {
                type: 'heavy',
                weight: 20,
                actionsPerMinute: 8,
                sessionDuration: 900,
                queryComplexity: 'complex'
            }
        ],
        testDuration: this.config.testDuration.loadTest,
        rampUpTime: 60,
        rampDownTime: 30,
        thresholds: {
            maxResponseTime: this.config.performanceTargets.maxResponseTime,
            maxErrorRate: 5,
            minThroughput: this.config.performanceTargets.minThroughput,
            maxCpuUsage: 80,
            maxMemoryUsage: 75
        }
    },
    const: test = new concurrent_load_test_1.ConcurrentLoadTest(process_1.config),
    return: await test.runTest()
};
async;
runUptimeMonitoringTest();
Promise < uptime_monitoring_test_1.UptimeMonitoringTestResult > {
    const: process_1.config, UptimeMonitoringTestConfig: uptime_monitoring_test_1.UptimeMonitoringTestConfig = {
        baseUrl: this.config.baseUrl,
        monitoringEndpoints: [
            {
                name: 'Main Application',
                url: `${this.config.baseUrl}/`,
                method: 'GET',
                expectedStatusCode: 200,
                expectedResponseTime: this.config.performanceTargets.maxResponseTime,
                criticality: 'critical',
                healthCheckType: 'basic'
            },
            {
                name: 'Chat API',
                url: `${this.config.baseUrl}/api/chat`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'health check', userId: 'test' }),
                expectedStatusCode: 200,
                expectedResponseTime: this.config.performanceTargets.maxResponseTime * 1.5,
                criticality: 'critical',
                healthCheckType: 'functional'
            },
            {
                name: 'Health Check',
                url: `${this.config.baseUrl}/api/health`,
                method: 'GET',
                expectedStatusCode: 200,
                expectedResponseTime: 1000,
                criticality: 'standard',
                healthCheckType: 'deep'
            },
            {
                name: 'Authentication API',
                url: `${this.config.baseUrl}/api/auth/status`,
                method: 'GET',
                expectedStatusCode: 200,
                expectedResponseTime: 1500,
                criticality: 'critical',
                healthCheckType: 'functional'
            }
        ],
        monitoringDuration: this.config.testDuration.uptimeMonitoring,
        checkInterval: 30,
        uptimeTargets: {
            overall: this.config.performanceTargets.minUptime,
            critical: this.config.performanceTargets.minUptime + 0.05,
            standard: this.config.performanceTargets.minUptime - 0.5
        },
        alertThresholds: {
            consecutiveFailures: 3,
            responseTimeThreshold: this.config.performanceTargets.maxResponseTime * 2,
            errorRateThreshold: 5
        }
    },
    const: test = new uptime_monitoring_test_1.UptimeMonitoringTest(process_1.config),
    return: await test.runTest()
};
async;
runMultiRegionScalabilityTest();
Promise < multi_region_scalability_test_1.MultiRegionScalabilityTestResult > {
    const: process_1.config, MultiRegionScalabilityTestConfig: multi_region_scalability_test_1.MultiRegionScalabilityTestConfig = {
        regions: [
            {
                name: 'Tokyo',
                region: 'ap-northeast-1',
                baseUrl: this.config.baseUrl.replace('localhost', 'tokyo.example.com'),
                priority: 1,
                expectedLatency: 50,
                capacity: {
                    maxConcurrentUsers: this.config.performanceTargets.maxConcurrentUsers,
                    maxThroughput: this.config.performanceTargets.minThroughput * 2
                },
                enabled: true
            },
            {
                name: 'Osaka',
                region: 'ap-northeast-3',
                baseUrl: this.config.baseUrl.replace('localhost', 'osaka.example.com'),
                priority: 2,
                expectedLatency: 80,
                capacity: {
                    maxConcurrentUsers: Math.floor(this.config.performanceTargets.maxConcurrentUsers * 0.8),
                    maxThroughput: Math.floor(this.config.performanceTargets.minThroughput * 1.6)
                },
                enabled: this.config.testEnvironment === 'production'
            }
        ],
        testScenarios: [
            {
                name: 'Linear Scaling Test',
                description: '線形スケーリングテスト',
                userLoad: [50, 100, 200, 400],
                duration: this.config.testDuration.scalabilityTest,
                rampUpTime: 60,
                testType: 'linear',
                expectedBehavior: 'Linear performance scaling'
            },
            {
                name: 'Spike Test',
                description: '急激な負荷増加テスト',
                userLoad: [100, this.config.performanceTargets.maxConcurrentUsers],
                duration: Math.floor(this.config.testDuration.scalabilityTest * 0.6),
                rampUpTime: 10,
                testType: 'spike',
                expectedBehavior: 'Graceful handling of traffic spikes'
            }
        ],
        performanceThresholds: {
            maxLatency: this.config.performanceTargets.maxResponseTime,
            minThroughput: this.config.performanceTargets.minThroughput,
            maxErrorRate: 5,
            maxRegionVariance: 30
        },
        loadDistribution: {
            strategy: 'weighted',
            weights: {
                'ap-northeast-1': 0.6,
                'ap-northeast-3': 0.4
            }
        },
        failoverTesting: {
            enabled: this.config.testEnvironment === 'production',
            scenarios: [
                {
                    name: 'Tokyo to Osaka Failover',
                    primaryRegion: 'ap-northeast-1',
                    failoverRegion: 'ap-northeast-3',
                    triggerType: 'simulated_failure',
                    expectedFailoverTime: 30,
                    expectedDataConsistency: true
                }
            ]
        }
    },
    const: test = new multi_region_scalability_test_1.MultiRegionScalabilityTest(process_1.config),
    return: await test.runTest()
} /
        **
    * 結果の統合と評価
    * /;
aggregateResults(results, (Partial));
PerformanceIntegrationTestResult;
{
    const duration = Date.now() - this.testStartTime;
    // 各テストのスコア収集
    const scores = {
        responseTime: results.responseTimeResult?.overallResponseScore || 0,
        concurrentLoad: results.concurrentLoadResult?.overallLoadScore || 0,
        uptimeMonitoring: results.uptimeMonitoringResult?.overallUptimeScore || 0,
        multiRegionScalability: results.multiRegionScalabilityResult?.overallScalabilityScore || 0
    };
    // 重み付きスコア計算
    const weights = {
        responseTime: 0.3,
        concurrentLoad: 0.3,
        uptimeMonitoring: 0.25,
        multiRegionScalability: 0.15
    };
    const overallPerformanceScore = Object.entries(scores).reduce((sum, [key, score]) => {
        return sum + (score * weights[key]);
    }, 0);
    // カテゴリ別スコア計算
    const responseTimeScore = scores.responseTime;
    const scalabilityScore = (scores.concurrentLoad + scores.multiRegionScalability) / 2;
    const reliabilityScore = scores.uptimeMonitoring;
    const globalPerformanceScore = this.calculateGlobalPerformanceScore(results);
    // パフォーマンスサマリーの作成
    const performanceSummary = this.createPerformanceSummary(results, duration);
    // 推奨事項の生成
    const recommendations = this.generateRecommendations(results, scores);
    // 成功判定
    const success = overallPerformanceScore >= 85 &&
        performanceSummary.criticalIssues === 0 &&
        performanceSummary.systemUptime >= this.config.performanceTargets.minUptime;
    return {
        testName: 'PerformanceIntegrationTest',
        success,
        duration,
        details: {
            testEnvironment: this.config.testEnvironment,
            enabledTests: this.config.enabledTests,
            overallScore: overallPerformanceScore,
            individualScores: scores,
            performanceTargets: this.config.performanceTargets
        },
        ...results,
        overallPerformanceScore,
        responseTimeScore,
        scalabilityScore,
        reliabilityScore,
        globalPerformanceScore,
        performanceSummary,
        recommendations
    };
}
calculateGlobalPerformanceScore(results, (Partial));
number;
{
    let totalScore = 0;
    let count = 0;
    if (results.responseTimeResult) {
        totalScore += results.responseTimeResult.overallResponseScore;
        count++;
    }
    if (results.concurrentLoadResult) {
        totalScore += results.concurrentLoadResult.overallLoadScore;
        count++;
    }
    if (results.multiRegionScalabilityResult) {
        totalScore += results.multiRegionScalabilityResult.globalPerformanceScore;
        count++;
    }
    return count > 0 ? totalScore / count : 0;
}
createPerformanceSummary(results, (Partial), duration, number);
PerformanceSummary;
{
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let averageResponseTime = 0;
    let peakThroughput = 0;
    let systemUptime = 0;
    let maxSupportedUsers = 0;
    let criticalIssues = 0;
    const performanceBottlenecks = [];
    const scalabilityLimitations = [];
    // 応答時間測定テスト
    if (results.responseTimeResult) {
        totalTests++;
        if (results.responseTimeResult.success)
            passedTests++;
        else
            failedTests++;
        averageResponseTime = results.responseTimeResult.performanceMetrics.overallAverageTime;
    }
    // 同時ユーザー負荷テスト
    if (results.concurrentLoadResult) {
        totalTests++;
        if (results.concurrentLoadResult.success)
            passedTests++;
        else
            failedTests++;
        peakThroughput = results.concurrentLoadResult.systemMetrics.peakThroughput;
        maxSupportedUsers = results.concurrentLoadResult.systemMetrics.peakConcurrentUsers;
        // ボトルネックの検出
        if (results.concurrentLoadResult.systemMetrics.peakCpuUsage > 80) {
            performanceBottlenecks.push('CPU使用率が高い');
        }
        if (results.concurrentLoadResult.systemMetrics.peakMemoryUsage > 80) {
            performanceBottlenecks.push('メモリ使用率が高い');
        }
    }
    // 稼働率監視テスト
    if (results.uptimeMonitoringResult) {
        totalTests++;
        if (results.uptimeMonitoringResult.success)
            passedTests++;
        else
            failedTests++;
        systemUptime = results.uptimeMonitoringResult.overallMetrics.totalUptime;
        criticalIssues += results.uptimeMonitoringResult.incidentReports.filter(i => i.severity === 'critical').length;
    }
    // マルチリージョンスケーラビリティテスト
    if (results.multiRegionScalabilityResult) {
        totalTests++;
        if (results.multiRegionScalabilityResult.success)
            passedTests++;
        else
            failedTests++;
        // スケーラビリティ制限の検出
        results.multiRegionScalabilityResult.regionResults.forEach(region => {
            if (region.scalabilityLimits.resourceBottlenecks.length > 0) {
                scalabilityLimitation;
                scalabilityLimitations.push(`${region.regionName}: ${region.scalabilityLimits.resourceBottlenecks.join(', ')}`);
            }
        });
    }
    return {
        totalTests,
        passedTests,
        failedTests,
        averageResponseTime,
        peakThroughput,
        systemUptime,
        maxSupportedUsers,
        criticalIssues,
        performanceBottlenecks,
        scalabilityLimitations
    };
}
generateRecommendations(results, (Partial), scores, (Record));
string[];
{
    const recommendations = [];
    // 応答時間の推奨事項
    if (scores.responseTime < 85) {
        recommendations.push('応答時間の最適化が必要です。データベースクエリやAI処理の効率化を検討してください。');
    }
    // 負荷テストの推奨事項
    if (scores.concurrentLoad < 85) {
        recommendations.push('同時ユーザー負荷への対応力を向上させてください。水平スケーリングの導入を検討してください。');
    }
    // 稼働率の推奨事項
    if (scores.uptimeMonitoring < 99) {
        recommendations.push(`システムの稼働率が目標値 ${this.config.performanceTargets.minUptime}% を下回っています。冗長化とフェイルオーバー機能の強化が必要です。`);
    }
    // マルチリージョンの推奨事項
    if (scores.multiRegionScalability < 85) {
        recommendations.push('マルチリージョン対応の改善が必要です。リージョン間の負荷分散とデータ同期の最適化を行ってください。');
    }
    // パフォーマンスボトルネックの推奨事項
    if (results.concurrentLoadResult?.systemMetrics.peakCpuUsage && results.concurrentLoadResult.systemMetrics.peakCpuUsage > 80) {
        recommendations.push('CPU使用率が高いため、処理の最適化またはインスタンスのスケールアップが必要です。');
    }
    if (results.concurrentLoadResult?.systemMetrics.peakMemoryUsage && results.concurrentLoadResult.systemMetrics.peakMemoryUsage > 80) {
        recommendations.push('メモリ使用率が高いため、メモリリークの調査またはメモリ容量の増強が必要です。');
    }
    // 応答時間の推奨事項
    if (results.responseTimeResult?.performanceMetrics.overallAverageTime &&
        results.responseTimeResult.performanceMetrics.overallAverageTime > this.config.performanceTargets.maxResponseTime) {
        recommendations.push(`平均応答時間が目標値 ${this.config.performanceTargets.maxResponseTime}ms を超えています。キャッシュ戦略の見直しが必要です。`);
    }
    // スループットの推奨事項
    if (results.concurrentLoadResult?.systemMetrics.peakThroughput &&
        results.concurrentLoadResult.systemMetrics.peakThroughput < this.config.performanceTargets.minThroughput) {
        recommendations.push(`スループットが目標値 ${this.config.performanceTargets.minThroughput} req/sec を下回っています。アーキテクチャの見直しが必要です。`);
    }
    // 一般的な推奨事項
    if (recommendations.length === 0) {
        recommendations.push('すべてのパフォーマンステストが良好な結果を示しています。現在のパフォーマンスレベルを維持してください。');
    }
    return recommendations;
}
logTestResults(lodash_1.result, PerformanceIntegrationTestResult);
void {
    console, : .log('\n📊 パフォーマンス統合テスト最終結果:'),
    console, : .log('='.repeat(60)),
    console, : .log(`✅ 総合パフォーマンススコア: ${lodash_1.result.overallPerformanceScore.toFixed(1)}/100`),
    console, : .log(`⏱️ 応答時間スコア: ${lodash_1.result.responseTimeScore.toFixed(1)}/100`),
    console, : .log(`🚀 スケーラビリティスコア: ${lodash_1.result.scalabilityScore.toFixed(1)}/100`),
    console, : .log(`🔒 信頼性スコア: ${lodash_1.result.reliabilityScore.toFixed(1)}/100`),
    console, : .log(`🌍 グローバルパフォーマンス: ${lodash_1.result.globalPerformanceScore.toFixed(1)}/100`),
    console, : .log('\n📈 パフォーマンスサマリー:'),
    console, : .log(`  総テスト数: ${lodash_1.result.performanceSummary.totalTests}`),
    console, : .log(`  合格: ${lodash_1.result.performanceSummary.passedTests}`),
    console, : .log(`  不合格: ${lodash_1.result.performanceSummary.failedTests}`),
    console, : .log(`  平均応答時間: ${lodash_1.result.performanceSummary.averageResponseTime.toFixed(0)}ms`),
    console, : .log(`  最大スループット: ${lodash_1.result.performanceSummary.peakThroughput.toFixed(1)} req/sec`),
    console, : .log(`  システム稼働率: ${lodash_1.result.performanceSummary.systemUptime.toFixed(3)}%`),
    console, : .log(`  最大サポートユーザー数: ${lodash_1.result.performanceSummary.maxSupportedUsers}人`),
    if(result) { }, : .performanceSummary.criticalIssues > 0
};
{
    console.log(`  🔴 重要な問題: ${lodash_1.result.performanceSummary.criticalIssues}件`);
}
if (lodash_1.result.performanceSummary.performanceBottlenecks.length > 0) {
    console.log('\n⚠️  パフォーマンスボトルネック:');
    lodash_1.result.performanceSummary.performanceBottlenecks.forEach((bottleneck, index) => {
        console.log(`  ${index + 1}. ${bottleneck}`);
    });
}
if (lodash_1.result.performanceSummary.scalabilityLimitations.length > 0) {
    console.log('\n📊 スケーラビリティ制限:');
    lodash_1.result.performanceSummary.scalabilityLimitations.forEach((limitation, index) => {
        console.log(`  ${index + 1}. ${limitation}`);
    });
}
console.log('\n💡 推奨事項:');
lodash_1.result.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
});
if (lodash_1.result.success) {
    console.log('\n🎉 パフォーマンス統合テスト: 合格');
    console.log('   すべてのパフォーマンス要件を満たしています');
}
else {
    console.log('\n❌ パフォーマンス統合テスト: 不合格');
    console.log('   パフォーマンスの改善が必要です');
}
console.log('='.repeat(60));
/**
 * デフォルト設定でのパフォーマンス統合テスト実行
 */
async function runPerformanceIntegrationTest(baseUrl = 'http://localhost:3000', testEnvironment = 'development') {
    const config = {
        baseUrl,
        enabledTests: {
            responseTime: true,
            concurrentLoad: true,
            uptimeMonitoring: true,
            multiRegionScalability: testEnvironment === 'production'
        },
        testEnvironment,
        performanceTargets: {
            maxResponseTime: 2000,
            minThroughput: 50,
            minUptime: 99.9,
            maxConcurrentUsers: 100
        },
        testDuration: {
            responseTime: 300,
            loadTest: 600,
            uptimeMonitoring: 1800,
            scalabilityTest: 900
        }
    };
    const runner = new PerformanceIntegrationTestRunner(config);
    const result = await runner.runTests();
    // 結果のログ出力
    runner['logTestResults'](result);
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybWFuY2UtaW50ZWdyYXRpb24tdGVzdC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwZXJmb3JtYW5jZS1pbnRlZ3JhdGlvbi10ZXN0LXJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUE2cENILHNFQWtDQztBQTdyQ0QsT0FBTztBQUNQLE1BQU0sMEJBQTBCLEdBQUc7SUFDakMsaUJBQWlCLEVBQUU7UUFDakIsb0JBQW9CLEVBQUUsS0FBSztRQUMzQixrQkFBa0IsRUFBRSxLQUFLO1FBQ3pCLG9CQUFvQixFQUFFLE1BQU07UUFDNUIscUJBQXFCLEVBQUUsSUFBSTtLQUM1QjtJQUNELGNBQWMsRUFBRTtRQUNkLG1CQUFtQixFQUFFLEVBQUU7UUFDdkIsZ0JBQWdCLEVBQUUsRUFBRTtRQUNwQixrQkFBa0IsRUFBRSxFQUFFO1FBQ3RCLG9CQUFvQixFQUFFLENBQUM7S0FDeEI7SUFDRCxrQkFBa0IsRUFBRTtRQUNsQix5QkFBeUIsRUFBRSxFQUFFO1FBQzdCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLGlCQUFpQixFQUFFLElBQUk7S0FDeEI7Q0FDTyxDQUFDO0FBR1gsNkRBQXdHO0FBQ3hHLGlFQUFnSDtBQUNoSCxxRUFBd0g7QUFDeEgsbUZBQWlKO0FBQ2pKLG1DQUFnQztBQW9CaEMscUNBQWlDO0FBMEVqQyxNQUFhLGdDQUFnQztJQUNuQyxNQUFNLENBQW1DO0lBQ3pDLGFBQWEsR0FBVyxDQUFDLENBQUM7SUFFbEMsWUFBWSxNQUF3QztRQUNsRCxRQUFRO1FBQ1IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQ7O09BRUc7SUFDSyxjQUFjLENBQUMsTUFBd0M7UUFDN0QsY0FBYztRQUNkLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLE9BQU8sTUFBTSxDQUFDLE9BQU8s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s+ODiuODvFxuICog5YWo44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI44Gu57Wx5ZCI5a6f6KGM44Go57WQ5p6c6ZuG6KiIXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG4vLyDlrprmlbDlrprnvqlcbmNvbnN0IFBFUkZPUk1BTkNFX1RFU1RfQ09OU1RBTlRTID0ge1xuICBWQUxJREFUSU9OX0xJTUlUUzoge1xuICAgIE1BWF9SRVNQT05TRV9USU1FX01TOiAzMDAwMCxcbiAgICBNQVhfVEhST1VHSFBVVF9SUFM6IDEwMDAwLFxuICAgIE1BWF9DT05DVVJSRU5UX1VTRVJTOiAxMDAwMDAsXG4gICAgTUFYX1RFU1RfRFVSQVRJT05fU0VDOiAzNjAwXG4gIH0sXG4gIERFRkFVTFRfVkFMVUVTOiB7XG4gICAgQ09OQ1VSUkVOVF9SRVFVRVNUUzogMTAsXG4gICAgUkFNUF9VUF9USU1FX1NFQzogNjAsXG4gICAgQ0hFQ0tfSU5URVJWQUxfU0VDOiAzMCxcbiAgICBDT05TRUNVVElWRV9GQUlMVVJFUzogM1xuICB9LFxuICBTVUNDRVNTX1RIUkVTSE9MRFM6IHtcbiAgICBPVkVSQUxMX1BFUkZPUk1BTkNFX1NDT1JFOiA4MCxcbiAgICBFUlJPUl9SQVRFOiAwLjA1LFxuICAgIFVQVElNRV9QRVJDRU5UQUdFOiA5OS4wXG4gIH1cbn0gYXMgY29uc3Q7XG5cbmltcG9ydCB7IFRlc3RSZXN1bHQgfSBmcm9tICcuLi8uLi90eXBlcy90ZXN0LXR5cGVzJztcbmltcG9ydCB7IFJlc3BvbnNlVGltZVRlc3QsIFJlc3BvbnNlVGltZVRlc3RDb25maWcsIFJlc3BvbnNlVGltZVRlc3RSZXN1bHQgfSBmcm9tICcuL3Jlc3BvbnNlLXRpbWUtdGVzdCc7XG5pbXBvcnQgeyBDb25jdXJyZW50TG9hZFRlc3QsIENvbmN1cnJlbnRMb2FkVGVzdENvbmZpZywgQ29uY3VycmVudExvYWRUZXN0UmVzdWx0IH0gZnJvbSAnLi9jb25jdXJyZW50LWxvYWQtdGVzdCc7XG5pbXBvcnQgeyBVcHRpbWVNb25pdG9yaW5nVGVzdCwgVXB0aW1lTW9uaXRvcmluZ1Rlc3RDb25maWcsIFVwdGltZU1vbml0b3JpbmdUZXN0UmVzdWx0IH0gZnJvbSAnLi91cHRpbWUtbW9uaXRvcmluZy10ZXN0JztcbmltcG9ydCB7IE11bHRpUmVnaW9uU2NhbGFiaWxpdHlUZXN0LCBNdWx0aVJlZ2lvblNjYWxhYmlsaXR5VGVzdENvbmZpZywgTXVsdGlSZWdpb25TY2FsYWJpbGl0eVRlc3RSZXN1bHQgfSBmcm9tICcuL211bHRpLXJlZ2lvbi1zY2FsYWJpbGl0eS10ZXN0JztcbmltcG9ydCB7IHJlc3VsdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZXN1bHQgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgcmVzdWx0IH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHJlc3VsdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZXN1bHQgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgcmVzdWx0IH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHJlc3VsdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZXN1bHQgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgcmVzdWx0IH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHJlc3VsdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZXN1bHQgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgcmVzdWx0IH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHJlc3VsdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZXN1bHQgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgcmVzdWx0IH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHJlc3VsdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZXN1bHQgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgcmVzdWx0IH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHJlc3VsdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZXN1bHQgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAncHJvY2Vzcyc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJ3Byb2Nlc3MnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAncHJvY2Vzcyc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJ3Byb2Nlc3MnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAncHJvY2Vzcyc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJ3Byb2Nlc3MnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAncHJvY2Vzcyc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJ3Byb2Nlc3MnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAncHJvY2Vzcyc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IHJlc3VsdCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJ3Byb2Nlc3MnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAncHJvY2Vzcyc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJ3Byb2Nlc3MnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAncHJvY2Vzcyc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJ3Byb2Nlc3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0Q29uZmlnIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBlbmFibGVkVGVzdHM6IHtcbiAgICByZXNwb25zZVRpbWU6IGJvb2xlYW47XG4gICAgY29uY3VycmVudExvYWQ6IGJvb2xlYW47XG4gICAgdXB0aW1lTW9uaXRvcmluZzogYm9vbGVhbjtcbiAgICBtdWx0aVJlZ2lvblNjYWxhYmlsaXR5OiBib29sZWFuO1xuICB9O1xuICB0ZXN0RW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcgfCAnc3RhZ2luZycgfCAncHJvZHVjdGlvbic7XG4gIHBlcmZvcm1hbmNlVGFyZ2V0czoge1xuICAgIG1heFJlc3BvbnNlVGltZTogbnVtYmVyOyAvLyBtc1xuICAgIG1pblRocm91Z2hwdXQ6IG51bWJlcjsgLy8gcmVxdWVzdHMgcGVyIHNlY29uZFxuICAgIG1pblVwdGltZTogbnVtYmVyOyAvLyBwZXJjZW50YWdlXG4gICAgbWF4Q29uY3VycmVudFVzZXJzOiBudW1iZXI7XG4gIH07XG4gIHRlc3REdXJhdGlvbjoge1xuICAgIHJlc3BvbnNlVGltZTogbnVtYmVyOyAvLyBzZWNvbmRzXG4gICAgbG9hZFRlc3Q6IG51bWJlcjsgLy8gc2Vjb25kc1xuICAgIHVwdGltZU1vbml0b3Jpbmc6IG51bWJlcjsgLy8gc2Vjb25kc1xuICAgIHNjYWxhYmlsaXR5VGVzdDogbnVtYmVyOyAvLyBzZWNvbmRzXG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQgZXh0ZW5kcyBUZXN0UmVzdWx0IHtcbiAgcmVzcG9uc2VUaW1lUmVzdWx0PzogUmVzcG9uc2VUaW1lVGVzdFJlc3VsdDtcbiAgY29uY3VycmVudExvYWRSZXN1bHQ/OiBDb25jdXJyZW50TG9hZFRlc3RSZXN1bHQ7XG4gIHVwdGltZU1vbml0b3JpbmdSZXN1bHQ/OiBVcHRpbWVNb25pdG9yaW5nVGVzdFJlc3VsdDtcbiAgbXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdD86IE11bHRpUmVnaW9uU2NhbGFiaWxpdHlUZXN0UmVzdWx0O1xuICBvdmVyYWxsUGVyZm9ybWFuY2VTY29yZTogbnVtYmVyO1xuICByZXNwb25zZVRpbWVTY29yZTogbnVtYmVyO1xuICBzY2FsYWJpbGl0eVNjb3JlOiBudW1iZXI7XG4gIHJlbGlhYmlsaXR5U2NvcmU6IG51bWJlcjtcbiAgZ2xvYmFsUGVyZm9ybWFuY2VTY29yZTogbnVtYmVyO1xuICBwZXJmb3JtYW5jZVN1bW1hcnk6IFBlcmZvcm1hbmNlU3VtbWFyeTtcbiAgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQZXJmb3JtYW5jZVN1bW1hcnkge1xuICB0b3RhbFRlc3RzOiBudW1iZXI7XG4gIHBhc3NlZFRlc3RzOiBudW1iZXI7XG4gIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gIGF2ZXJhZ2VSZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgcGVha1Rocm91Z2hwdXQ6IG51bWJlcjtcbiAgc3lzdGVtVXB0aW1lOiBudW1iZXI7XG4gIG1heFN1cHBvcnRlZFVzZXJzOiBudW1iZXI7XG4gIGNyaXRpY2FsSXNzdWVzOiBudW1iZXI7XG4gIHBlcmZvcm1hbmNlQm90dGxlbmVja3M6IHN0cmluZ1tdO1xuICBzY2FsYWJpbGl0eUxpbWl0YXRpb25zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UnVubmVyIHtcbiAgcHJpdmF0ZSBjb25maWc6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0Q29uZmlnO1xuICBwcml2YXRlIHRlc3RTdGFydFRpbWU6IG51bWJlciA9IDA7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdENvbmZpZykge1xuICAgIC8vIOioreWumuOBruaknOiovFxuICAgIHRoaXMudmFsaWRhdGVDb25maWcoY29uZmlnKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiDoqK3lrprjga7mpJzoqLxcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVDb25maWcoY29uZmlnOiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdENvbmZpZyk6IHZvaWQge1xuICAgIC8vIGJhc2VVUkwg44Gu5qSc6Ki8XG4gICAgaWYgKCFjb25maWcuYmFzZVVybCB8fCB0eXBlb2YgY29uZmlnLmJhc2VVcmwgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Jhc2VVcmwg44Gv5b+F6aCI44Gn44GZJyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIG5ldyBVUkwoY29uZmlnLmJhc2VVcmwpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+eEoeWKueOBqiBiYXNlVXJsIOOBp+OBmScpO1xuICAgIH1cblxuICAgIC8vIOODkeODleOCqeODvOODnuODs+OCueebruaomeWApOOBruaknOiovFxuICAgIGlmIChjb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSA8PSAwIHx8IFxuICAgICAgICBjb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSA+IFBFUkZPUk1BTkNFX1RFU1RfQ09OU1RBTlRTLlZBTElEQVRJT05fTElNSVRTLk1BWF9SRVNQT05TRV9USU1FX01TKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYG1heFJlc3BvbnNlVGltZSDjga8gMS0ke1BFUkZPUk1BTkNFX1RFU1RfQ09OU1RBTlRTLlZBTElEQVRJT05fTElNSVRTLk1BWF9SRVNQT05TRV9USU1FX01TfW1zIOOBruevhOWbsuOBp+ioreWumuOBl+OBpuOBj+OBoOOBleOBhGApO1xuICAgIH1cblxuICAgIGlmIChjb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblRocm91Z2hwdXQgPD0gMCB8fCBcbiAgICAgICAgY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5taW5UaHJvdWdocHV0ID4gUEVSRk9STUFOQ0VfVEVTVF9DT05TVEFOVFMuVkFMSURBVElPTl9MSU1JVFMuTUFYX1RIUk9VR0hQVVRfUlBTKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYG1pblRocm91Z2hwdXQg44GvIDEtJHtQRVJGT1JNQU5DRV9URVNUX0NPTlNUQU5UUy5WQUxJREFUSU9OX0xJTUlUUy5NQVhfVEhST1VHSFBVVF9SUFN9IHJlcS9zIOOBruevhOWbsuOBp+ioreWumuOBl+OBpuOBj+OBoOOBleOBhGApO1xuICAgIH1cblxuICAgIGlmIChjb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblVwdGltZSA8IDAgfHwgY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5taW5VcHRpbWUgPiAxMDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWluVXB0aW1lIOOBryAwLTEwMCUg44Gu56+E5Zuy44Gn6Kit5a6a44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4Q29uY3VycmVudFVzZXJzIDw9IDAgfHwgXG4gICAgICAgIGNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4Q29uY3VycmVudFVzZXJzID4gUEVSRk9STUFOQ0VfVEVTVF9DT05TVEFOVFMuVkFMSURBVElPTl9MSU1JVFMuTUFYX0NPTkNVUlJFTlRfVVNFUlMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgbWF4Q29uY3VycmVudFVzZXJzIOOBryAxLSR7UEVSRk9STUFOQ0VfVEVTVF9DT05TVEFOVFMuVkFMSURBVElPTl9MSU1JVFMuTUFYX0NPTkNVUlJFTlRfVVNFUlN9IOOBruevhOWbsuOBp+ioreWumuOBl+OBpuOBj+OBoOOBleOBhGApO1xuICAgIH1cblxuICAgIC8vIOODhuOCueODiOacn+mWk+OBruaknOiovFxuICAgIE9iamVjdC5lbnRyaWVzKGNvbmZpZy50ZXN0RHVyYXRpb24pLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgaWYgKHZhbHVlIDw9IDAgfHwgdmFsdWUgPiBQRVJGT1JNQU5DRV9URVNUX0NPTlNUQU5UUy5WQUxJREFUSU9OX0xJTUlUUy5NQVhfVEVTVF9EVVJBVElPTl9TRUMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB0ZXN0RHVyYXRpb24uJHtrZXl9IOOBryAxLSR7UEVSRk9STUFOQ0VfVEVTVF9DT05TVEFOVFMuVkFMSURBVElPTl9MSU1JVFMuTUFYX1RFU1RfRFVSQVRJT05fU0VDfeenkiDjga7nr4Tlm7LjgafoqK3lrprjgZfjgabjgY/jgaDjgZXjgYRgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnntbHlkIjjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIGFzeW5jIHJ1blRlc3RzKCk6IFByb21pc2U8UGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+IHtcbiAgICBjb25zb2xlLmxvZygn4pqhIOODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiOOCkumWi+Wni+OBl+OBvuOBmS4uLicpO1xuICAgIGNvbnNvbGUubG9nKGDwn4yQIOODhuOCueODiOeSsOWigzogJHt0aGlzLmNvbmZpZy50ZXN0RW52aXJvbm1lbnR9YCk7XG4gICAgY29uc29sZS5sb2coYPCflJcg44OZ44O844K5VVJMOiAke3RoaXMuY29uZmlnLmJhc2VVcmx9YCk7XG4gICAgXG4gICAgdGhpcy50ZXN0U3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHRzOiBQYXJ0aWFsPFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0PiA9IHtcbiAgICAgICAgdGVzdE5hbWU6ICdQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdCcsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBkdXJhdGlvbjogMCxcbiAgICAgICAgZGV0YWlsczoge31cbiAgICAgIH07XG5cbiAgICAgIC8vIOS4puWIl+Wun+ihjOWPr+iDveOBquODhuOCueODiOOCkueJueWumlxuICAgICAgY29uc3QgcGFyYWxsZWxUZXN0czogUHJvbWlzZTxhbnk+W10gPSBbXTtcbiAgICAgIGNvbnN0IHNlcXVlbnRpYWxUZXN0czogKCgpID0+IFByb21pc2U8dm9pZD4pW10gPSBbXTtcblxuICAgICAgLy8g5b+c562U5pmC6ZaT5ris5a6a44OG44K544OI77yI5Lim5YiX5a6f6KGM5Y+v6IO977yJXG4gICAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZFRlc3RzLnJlc3BvbnNlVGltZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxu4o+x77iPIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuICAgICAgICBwYXJhbGxlbFRlc3RzLnB1c2goXG4gICAgICAgICAgdGhpcy5ydW5SZXNwb25zZVRpbWVUZXN0KCkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgcmVzdWx0cy5yZXNwb25zZVRpbWVSZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8g56i85YON546H55uj6KaW44OG44K544OI77yI5Lim5YiX5a6f6KGM5Y+v6IO977yJXG4gICAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZFRlc3RzLnVwdGltZU1vbml0b3JpbmcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcbvCfk4og56i85YON546H55uj6KaW44OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgICAgIHBhcmFsbGVsVGVzdHMucHVzaChcbiAgICAgICAgICB0aGlzLnJ1blVwdGltZU1vbml0b3JpbmdUZXN0KCkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgcmVzdWx0cy51cHRpbWVNb25pdG9yaW5nUmVzdWx0ID0gcmVzdWx0O1xuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIOS4puWIl+Wun+ihjOWPr+iDveOBquODhuOCueODiOOCkuWun+ihjFxuICAgICAgaWYgKHBhcmFsbGVsVGVzdHMubGVuZ3RoID4gMCkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQocGFyYWxsZWxUZXN0cyk7XG4gICAgICB9XG5cbiAgICAgIC8vIOWQjOaZguODpuODvOOCtuODvOiyoOiNt+ODhuOCueODiO+8iOOCt+OCueODhuODoOOBq+iyoOiNt+OCkuOBi+OBkeOCi+OBn+OCgeWNmOeLrOWun+ihjO+8iVxuICAgICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWRUZXN0cy5jb25jdXJyZW50TG9hZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxu8J+RpSDlkIzmmYLjg6bjg7zjgrbjg7zosqDojbfjg4bjgrnjg4jjgpLlrp/ooYzkuK0uLi4nKTtcbiAgICAgICAgcmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdCA9IGF3YWl0IHRoaXMucnVuQ29uY3VycmVudExvYWRUZXN0KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIOODnuODq+ODgeODquODvOOCuOODp+ODs+OCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiO+8iOOCt+OCueODhuODoOOBq+iyoOiNt+OCkuOBi+OBkeOCi+OBn+OCgeWNmOeLrOWun+ihjO+8iVxuICAgICAgaWYgKHRoaXMuY29uZmlnLmVuYWJsZWRUZXN0cy5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXG7wn4yNIOODnuODq+ODgeODquODvOOCuOODp+ODs+OCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuICAgICAgICByZXN1bHRzLm11bHRpUmVnaW9uU2NhbGFiaWxpdHlSZXN1bHQgPSBhd2FpdCB0aGlzLnJ1bk11bHRpUmVnaW9uU2NhbGFiaWxpdHlUZXN0KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIOe1kOaenOOBrue1seWQiOOBqOipleS+oVxuICAgICAgY29uc3QgZmluYWxSZXN1bHQgPSB0aGlzLmFnZ3JlZ2F0ZVJlc3VsdHMocmVzdWx0cyk7XG5cbiAgICAgIHJldHVybiBmaW5hbFJlc3VsdDtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44OR44OV44Kp44O844Oe44Oz44K557Wx5ZCI44OG44K544OI44Gn44Ko44Op44O844GM55m655SfOicsIGVycm9yKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdE5hbWU6ICdQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdCcsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHRoaXMudGVzdFN0YXJ0VGltZSxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgICB0ZXN0RW52aXJvbm1lbnQ6IHRoaXMuY29uZmlnLnRlc3RFbnZpcm9ubWVudFxuICAgICAgICB9LFxuICAgICAgICBvdmVyYWxsUGVyZm9ybWFuY2VTY29yZTogMCxcbiAgICAgICAgcmVzcG9uc2VUaW1lU2NvcmU6IDAsXG4gICAgICAgIHNjYWxhYmlsaXR5U2NvcmU6IDAsXG4gICAgICAgIHJlbGlhYmlsaXR5U2NvcmU6IDAsXG4gICAgICAgIGdsb2JhbFBlcmZvcm1hbmNlU2NvcmU6IDAsXG4gICAgICAgIHBlcmZvcm1hbmNlU3VtbWFyeToge1xuICAgICAgICAgIHRvdGFsVGVzdHM6IDAsXG4gICAgICAgICAgcGFzc2VkVGVzdHM6IDAsXG4gICAgICAgICAgZmFpbGVkVGVzdHM6IDEsXG4gICAgICAgICAgYXZlcmFnZVJlc3BvbnNlVGltZTogMCxcbiAgICAgICAgICBwZWFrVGhyb3VnaHB1dDogMCxcbiAgICAgICAgICBzeXN0ZW1VcHRpbWU6IDAsXG4gICAgICAgICAgbWF4U3VwcG9ydGVkVXNlcnM6IDAsXG4gICAgICAgICAgY3JpdGljYWxJc3N1ZXM6IDEsXG4gICAgICAgICAgcGVyZm9ybWFuY2VCb3R0bGVuZWNrczogWydzeXN0ZW1fZXJyb3InXSxcbiAgICAgICAgICBzY2FsYWJpbGl0eUxpbWl0YXRpb25zOiBbJ+ODhuOCueODiOWun+ihjOOCqOODqeODvCddXG4gICAgICAgIH0sXG4gICAgICAgIHJlY29tbWVuZGF0aW9uczogW1xuICAgICAgICAgICfjgrfjgrnjg4bjg6Djga7mjqXntprjgajoqK3lrprjgpLnorroqo3jgZfjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICAgICfjg4bjgrnjg4jnkrDlooPjga7mupblgpnnirbms4HjgpLnorroqo3jgZfjgabjgY/jgaDjgZXjgYQnXG4gICAgICAgIF1cbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBydW5SZXNwb25zZVRpbWVUZXN0KCk6IFByb21pc2U8UmVzcG9uc2VUaW1lVGVzdFJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb25maWc6IFJlc3BvbnNlVGltZVRlc3RDb25maWcgPSB7XG4gICAgICAgIGJhc2VVcmw6IHRoaXMuY29uZmlnLmJhc2VVcmwsXG4gICAgICAgIHRlc3RFbmRwb2ludHM6IFtcbiAgICAgICAgICB7IHBhdGg6ICcvJywgbWV0aG9kOiAnR0VUJywgZXhwZWN0ZWRSZXNwb25zZVRpbWU6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUgfSxcbiAgICAgICAgICB7IHBhdGg6ICcvY2hhdGJvdCcsIG1ldGhvZDogJ0dFVCcsIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4UmVzcG9uc2VUaW1lIH0sXG4gICAgICAgICAgeyBwYXRoOiAnL2FwaS9oZWFsdGgnLCBtZXRob2Q6ICdHRVQnLCBleHBlY3RlZFJlc3BvbnNlVGltZTogNTAwIH1cbiAgICAgICAgXSxcbiAgICAgICAgdGVzdER1cmF0aW9uOiB0aGlzLmNvbmZpZy50ZXN0RHVyYXRpb24ucmVzcG9uc2VUaW1lLFxuICAgICAgICBjb25jdXJyZW50UmVxdWVzdHM6IFBFUkZPUk1BTkNFX1RFU1RfQ09OU1RBTlRTLkRFRkFVTFRfVkFMVUVTLkNPTkNVUlJFTlRfUkVRVUVTVFMsXG4gICAgICAgIHBlcmZvcm1hbmNlVGhyZXNob2xkczoge1xuICAgICAgICAgIGF2ZXJhZ2VSZXNwb25zZVRpbWU6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUsXG4gICAgICAgICAgcDk1UmVzcG9uc2VUaW1lOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4UmVzcG9uc2VUaW1lICogMS41LFxuICAgICAgICAgIGVycm9yUmF0ZTogMC4wMVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCB0ZXN0ID0gbmV3IFJlc3BvbnNlVGltZVRlc3QoY29uZmlnKTtcbiAgICAgIHJldHVybiBhd2FpdCB0ZXN0LnJ1blRlc3QoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOW/nOetlOaZgumWk+ODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5ZCM5pmC44Om44O844K244O86LKg6I2344OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHJ1bkNvbmN1cnJlbnRMb2FkVGVzdCgpOiBQcm9taXNlPENvbmN1cnJlbnRMb2FkVGVzdFJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb25maWc6IENvbmN1cnJlbnRMb2FkVGVzdENvbmZpZyA9IHtcbiAgICAgICAgYmFzZVVybDogdGhpcy5jb25maWcuYmFzZVVybCxcbiAgICAgICAgbWF4Q29uY3VycmVudFVzZXJzOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4Q29uY3VycmVudFVzZXJzLFxuICAgICAgICB0ZXN0RHVyYXRpb246IHRoaXMuY29uZmlnLnRlc3REdXJhdGlvbi5sb2FkVGVzdCxcbiAgICAgICAgcmFtcFVwVGltZTogUEVSRk9STUFOQ0VfVEVTVF9DT05TVEFOVFMuREVGQVVMVF9WQUxVRVMuUkFNUF9VUF9USU1FX1NFQyxcbiAgICAgICAgdGVzdFNjZW5hcmlvczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICfjg5rjg7zjgrjplrLopqcnLFxuICAgICAgICAgICAgd2VpZ2h0OiAwLjYsXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgIHsgdHlwZTogJ0dFVCcsIHBhdGg6ICcvJywgd2VpZ2h0OiAwLjQgfSxcbiAgICAgICAgICAgICAgeyB0eXBlOiAnR0VUJywgcGF0aDogJy9jaGF0Ym90Jywgd2VpZ2h0OiAwLjYgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ+ODgeODo+ODg+ODiOaTjeS9nCcsXG4gICAgICAgICAgICB3ZWlnaHQ6IDAuNCxcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgeyB0eXBlOiAnUE9TVCcsIHBhdGg6ICcvYXBpL2NoYXQnLCB3ZWlnaHQ6IDEuMCB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBwZXJmb3JtYW5jZVRhcmdldHM6IHtcbiAgICAgICAgICBtYXhSZXNwb25zZVRpbWU6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUsXG4gICAgICAgICAgbWluVGhyb3VnaHB1dDogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblRocm91Z2hwdXQsXG4gICAgICAgICAgbWF4RXJyb3JSYXRlOiAwLjA1XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHRlc3QgPSBuZXcgQ29uY3VycmVudExvYWRUZXN0KGNvbmZpZyk7XG4gICAgICByZXR1cm4gYXdhaXQgdGVzdC5ydW5UZXN0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlkIzmmYLjg6bjg7zjgrbjg7zosqDojbfjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOeovOWDjeeOh+ebo+imluODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBydW5VcHRpbWVNb25pdG9yaW5nVGVzdCgpOiBQcm9taXNlPFVwdGltZU1vbml0b3JpbmdUZXN0UmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbmZpZzogVXB0aW1lTW9uaXRvcmluZ1Rlc3RDb25maWcgPSB7XG4gICAgICAgIGJhc2VVcmw6IHRoaXMuY29uZmlnLmJhc2VVcmwsXG4gICAgICAgIG1vbml0b3JpbmdEdXJhdGlvbjogdGhpcy5jb25maWcudGVzdER1cmF0aW9uLnVwdGltZU1vbml0b3JpbmcsXG4gICAgICAgIGNoZWNrSW50ZXJ2YWw6IFBFUkZPUk1BTkNFX1RFU1RfQ09OU1RBTlRTLkRFRkFVTFRfVkFMVUVTLkNIRUNLX0lOVEVSVkFMX1NFQyxcbiAgICAgICAgZW5kcG9pbnRzOiBbXG4gICAgICAgICAgeyBwYXRoOiAnLycsIG5hbWU6ICfjg5vjg7zjg6Djg5rjg7zjgrgnIH0sXG4gICAgICAgICAgeyBwYXRoOiAnL2NoYXRib3QnLCBuYW1lOiAn44OB44Oj44OD44OI44Oc44OD44OIJyB9LFxuICAgICAgICAgIHsgcGF0aDogJy9hcGkvaGVhbHRoJywgbmFtZTogJ+ODmOODq+OCueODgeOCp+ODg+OCrycgfVxuICAgICAgICBdLFxuICAgICAgICB1cHRpbWVUYXJnZXQ6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5taW5VcHRpbWUsXG4gICAgICAgIGFsZXJ0VGhyZXNob2xkczoge1xuICAgICAgICAgIHJlc3BvbnNlVGltZTogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSxcbiAgICAgICAgICBlcnJvclJhdGU6IDAuMDUsXG4gICAgICAgICAgY29uc2VjdXRpdmVGYWlsdXJlczogUEVSRk9STUFOQ0VfVEVTVF9DT05TVEFOVFMuREVGQVVMVF9WQUxVRVMuQ09OU0VDVVRJVkVfRkFJTFVSRVNcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgdGVzdCA9IG5ldyBVcHRpbWVNb25pdG9yaW5nVGVzdChjb25maWcpO1xuICAgICAgcmV0dXJuIGF3YWl0IHRlc3QucnVuVGVzdCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg56i85YON546H55uj6KaW44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7PjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcnVuTXVsdGlSZWdpb25TY2FsYWJpbGl0eVRlc3QoKTogUHJvbWlzZTxNdWx0aVJlZ2lvblNjYWxhYmlsaXR5VGVzdFJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb25maWc6IE11bHRpUmVnaW9uU2NhbGFiaWxpdHlUZXN0Q29uZmlnID0ge1xuICAgICAgICByZWdpb25zOiBbXG4gICAgICAgICAgeyBuYW1lOiAnYXAtbm9ydGhlYXN0LTEnLCBiYXNlVXJsOiB0aGlzLmNvbmZpZy5iYXNlVXJsLCB3ZWlnaHQ6IDAuNiB9LFxuICAgICAgICAgIHsgbmFtZTogJ3VzLWVhc3QtMScsIGJhc2VVcmw6IHRoaXMuY29uZmlnLmJhc2VVcmwucmVwbGFjZSgnYXAtbm9ydGhlYXN0LTEnLCAndXMtZWFzdC0xJyksIHdlaWdodDogMC40IH1cbiAgICAgICAgXSxcbiAgICAgICAgdGVzdER1cmF0aW9uOiB0aGlzLmNvbmZpZy50ZXN0RHVyYXRpb24uc2NhbGFiaWxpdHlUZXN0LFxuICAgICAgICBzY2FsYWJpbGl0eVRhcmdldHM6IHtcbiAgICAgICAgICBtYXhMYXRlbmN5SW5jcmVhc2U6IDAuNSxcbiAgICAgICAgICBtaW5UaHJvdWdocHV0TWFpbnRlbmFuY2U6IDAuOCxcbiAgICAgICAgICBtYXhFcnJvclJhdGVJbmNyZWFzZTogMC4wMlxuICAgICAgICB9LFxuICAgICAgICBsb2FkUGF0dGVybnM6IFtcbiAgICAgICAgICB7IHR5cGU6ICdncmFkdWFsJywgZHVyYXRpb246IDMwMCwgdGFyZ2V0VXNlcnM6IDEwMCB9LFxuICAgICAgICAgIHsgdHlwZTogJ3NwaWtlJywgZHVyYXRpb246IDYwLCB0YXJnZXRVc2VyczogNTAwIH0sXG4gICAgICAgICAgeyB0eXBlOiAnc3VzdGFpbmVkJywgZHVyYXRpb246IDYwMCwgdGFyZ2V0VXNlcnM6IDIwMCB9XG4gICAgICAgIF1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHRlc3QgPSBuZXcgTXVsdGlSZWdpb25TY2FsYWJpbGl0eVRlc3QoY29uZmlnKTtcbiAgICAgIHJldHVybiBhd2FpdCB0ZXN0LnJ1blRlc3QoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOODnuODq+ODgeODquODvOOCuOODp+ODs+OCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44OG44K544OI57WQ5p6c44Gu57Wx5ZCI44Go6KmV5L6hXG4gICAqL1xuICBwcml2YXRlIGFnZ3JlZ2F0ZVJlc3VsdHMocmVzdWx0czogUGFydGlhbDxQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdD4pOiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdCB7XG4gICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gdGhpcy50ZXN0U3RhcnRUaW1lO1xuICAgIFxuICAgIC8vIOWQhOODhuOCueODiOOBruaIkOWKny/lpLHmlZfjgpLjgqvjgqbjg7Pjg4hcbiAgICBsZXQgdG90YWxUZXN0cyA9IDA7XG4gICAgbGV0IHBhc3NlZFRlc3RzID0gMDtcbiAgICBsZXQgZmFpbGVkVGVzdHMgPSAwO1xuXG4gICAgLy8g44K544Kz44Ki6KiI566XXG4gICAgbGV0IHJlc3BvbnNlVGltZVNjb3JlID0gMDtcbiAgICBsZXQgc2NhbGFiaWxpdHlTY29yZSA9IDA7XG4gICAgbGV0IHJlbGlhYmlsaXR5U2NvcmUgPSAwO1xuICAgIGxldCBnbG9iYWxQZXJmb3JtYW5jZVNjb3JlID0gMDtcblxuICAgIC8vIOW/nOetlOaZgumWk+ODhuOCueODiOe1kOaenOOBruipleS+oVxuICAgIGlmIChyZXN1bHRzLnJlc3BvbnNlVGltZVJlc3VsdCkge1xuICAgICAgdG90YWxUZXN0cysrO1xuICAgICAgaWYgKHJlc3VsdHMucmVzcG9uc2VUaW1lUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgcGFzc2VkVGVzdHMrKztcbiAgICAgICAgcmVzcG9uc2VUaW1lU2NvcmUgPSByZXN1bHRzLnJlc3BvbnNlVGltZVJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3M/Lm92ZXJhbGxTY29yZSB8fCAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkVGVzdHMrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDosqDojbfjg4bjgrnjg4jntZDmnpzjga7oqZXkvqFcbiAgICBpZiAocmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdCkge1xuICAgICAgdG90YWxUZXN0cysrO1xuICAgICAgaWYgKHJlc3VsdHMuY29uY3VycmVudExvYWRSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICBwYXNzZWRUZXN0cysrO1xuICAgICAgICBzY2FsYWJpbGl0eVNjb3JlID0gcmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdC5sb2FkTWV0cmljcz8uc2NhbGFiaWxpdHlTY29yZSB8fCAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkVGVzdHMrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDnqLzlg43njofjg4bjgrnjg4jntZDmnpzjga7oqZXkvqFcbiAgICBpZiAocmVzdWx0cy51cHRpbWVNb25pdG9yaW5nUmVzdWx0KSB7XG4gICAgICB0b3RhbFRlc3RzKys7XG4gICAgICBpZiAocmVzdWx0cy51cHRpbWVNb25pdG9yaW5nUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgcGFzc2VkVGVzdHMrKztcbiAgICAgICAgcmVsaWFiaWxpdHlTY29yZSA9IHJlc3VsdHMudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdC51cHRpbWVNZXRyaWNzPy5vdmVyYWxsVXB0aW1lU2NvcmUgfHwgMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZhaWxlZFRlc3RzKys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g44Oe44Or44OB44Oq44O844K444On44Oz44OG44K544OI57WQ5p6c44Gu6KmV5L6hXG4gICAgaWYgKHJlc3VsdHMubXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdCkge1xuICAgICAgdG90YWxUZXN0cysrO1xuICAgICAgaWYgKHJlc3VsdHMubXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHBhc3NlZFRlc3RzKys7XG4gICAgICAgIGdsb2JhbFBlcmZvcm1hbmNlU2NvcmUgPSByZXN1bHRzLm11bHRpUmVnaW9uU2NhbGFiaWxpdHlSZXN1bHQuc2NhbGFiaWxpdHlNZXRyaWNzPy5nbG9iYWxQZXJmb3JtYW5jZVNjb3JlIHx8IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmYWlsZWRUZXN0cysrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIOe3j+WQiOOCueOCs+OCouioiOeul1xuICAgIGNvbnN0IG92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlID0gdG90YWxUZXN0cyA+IDAgPyBcbiAgICAgIChyZXNwb25zZVRpbWVTY29yZSArIHNjYWxhYmlsaXR5U2NvcmUgKyByZWxpYWJpbGl0eVNjb3JlICsgZ2xvYmFsUGVyZm9ybWFuY2VTY29yZSkgLyB0b3RhbFRlc3RzIDogMDtcblxuICAgIC8vIOODkeODleOCqeODvOODnuODs+OCueOCteODnuODquODvOOBruS9nOaIkFxuICAgIGNvbnN0IHBlcmZvcm1hbmNlU3VtbWFyeTogUGVyZm9ybWFuY2VTdW1tYXJ5ID0ge1xuICAgICAgdG90YWxUZXN0cyxcbiAgICAgIHBhc3NlZFRlc3RzLFxuICAgICAgZmFpbGVkVGVzdHMsXG4gICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lOiByZXN1bHRzLnJlc3BvbnNlVGltZVJlc3VsdD8ucGVyZm9ybWFuY2VNZXRyaWNzPy5hdmVyYWdlUmVzcG9uc2VUaW1lIHx8IDAsXG4gICAgICBwZWFrVGhyb3VnaHB1dDogcmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdD8ubG9hZE1ldHJpY3M/LnBlYWtUaHJvdWdocHV0IHx8IDAsXG4gICAgICBzeXN0ZW1VcHRpbWU6IHJlc3VsdHMudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdD8udXB0aW1lTWV0cmljcz8ub3ZlcmFsbFVwdGltZVNjb3JlIHx8IDAsXG4gICAgICBtYXhTdXBwb3J0ZWRVc2VyczogcmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdD8ubG9hZE1ldHJpY3M/Lm1heFN1cHBvcnRlZFVzZXJzIHx8IDAsXG4gICAgICBjcml0aWNhbElzc3VlczogZmFpbGVkVGVzdHMsXG4gICAgICBwZXJmb3JtYW5jZUJvdHRsZW5lY2tzOiB0aGlzLmlkZW50aWZ5UGVyZm9ybWFuY2VCb3R0bGVuZWNrcyhyZXN1bHRzKSxcbiAgICAgIHNjYWxhYmlsaXR5TGltaXRhdGlvbnM6IHRoaXMuaWRlbnRpZnlTY2FsYWJpbGl0eUxpbWl0YXRpb25zKHJlc3VsdHMpXG4gICAgfTtcblxuICAgIC8vIOaOqOWlqOS6i+mgheOBrueUn+aIkFxuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9ucyA9IHRoaXMuZ2VuZXJhdGVSZWNvbW1lbmRhdGlvbnMocmVzdWx0cywgcGVyZm9ybWFuY2VTdW1tYXJ5KTtcblxuICAgIGNvbnN0IHN1Y2Nlc3MgPSBwYXNzZWRUZXN0cyA9PT0gdG90YWxUZXN0cyAmJiBvdmVyYWxsUGVyZm9ybWFuY2VTY29yZSA+PSBQRVJGT1JNQU5DRV9URVNUX0NPTlNUQU5UUy5TVUNDRVNTX1RIUkVTSE9MRFMuT1ZFUkFMTF9QRVJGT1JNQU5DRV9TQ09SRTtcblxuICAgIHJldHVybiB7XG4gICAgICB0ZXN0TmFtZTogJ1BlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0JyxcbiAgICAgIHN1Y2Nlc3MsXG4gICAgICBkdXJhdGlvbixcbiAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgdGVzdEVudmlyb25tZW50OiB0aGlzLmNvbmZpZy50ZXN0RW52aXJvbm1lbnQsXG4gICAgICAgIGVuYWJsZWRUZXN0czogdGhpcy5jb25maWcuZW5hYmxlZFRlc3RzLFxuICAgICAgICBwZXJmb3JtYW5jZVRhcmdldHM6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0c1xuICAgICAgfSxcbiAgICAgIC4uLnJlc3VsdHMsXG4gICAgICBvdmVyYWxsUGVyZm9ybWFuY2VTY29yZSxcbiAgICAgIHJlc3BvbnNlVGltZVNjb3JlLFxuICAgICAgc2NhbGFiaWxpdHlTY29yZSxcbiAgICAgIHJlbGlhYmlsaXR5U2NvcmUsXG4gICAgICBnbG9iYWxQZXJmb3JtYW5jZVNjb3JlLFxuICAgICAgcGVyZm9ybWFuY2VTdW1tYXJ5LFxuICAgICAgcmVjb21tZW5kYXRpb25zXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg5zjg4jjg6vjg43jg4Pjgq/jga7nibnlrppcbiAgICovXG4gIHByaXZhdGUgaWRlbnRpZnlQZXJmb3JtYW5jZUJvdHRsZW5lY2tzKHJlc3VsdHM6IFBhcnRpYWw8UGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGJvdHRsZW5lY2tzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKHJlc3VsdHMucmVzcG9uc2VUaW1lUmVzdWx0ICYmICFyZXN1bHRzLnJlc3BvbnNlVGltZVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICBib3R0bGVuZWNrcy5wdXNoKCflv5znrZTmmYLplpPjga7pgYXlu7YnKTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdCAmJiAhcmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICBib3R0bGVuZWNrcy5wdXNoKCflkIzmmYLjg6bjg7zjgrbjg7zlh6bnkIbog73lipvjga7kuI3otrMnKTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0cy51cHRpbWVNb25pdG9yaW5nUmVzdWx0ICYmICFyZXN1bHRzLnVwdGltZU1vbml0b3JpbmdSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgYm90dGxlbmVja3MucHVzaCgn44K344K544OG44Og5a6J5a6a5oCn44Gu5ZWP6aGMJyk7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdHMubXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdCAmJiAhcmVzdWx0cy5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5UmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgIGJvdHRsZW5lY2tzLnB1c2goJ+ODnuODq+ODgeODquODvOOCuOODp+ODs+mWk+OBruaAp+iDveW3ricpO1xuICAgIH1cblxuICAgIHJldHVybiBib3R0bGVuZWNrcztcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPliLbpmZDjga7nibnlrppcbiAgICovXG4gIHByaXZhdGUgaWRlbnRpZnlTY2FsYWJpbGl0eUxpbWl0YXRpb25zKHJlc3VsdHM6IFBhcnRpYWw8UGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGxpbWl0YXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKHJlc3VsdHMuY29uY3VycmVudExvYWRSZXN1bHQ/LmxvYWRNZXRyaWNzPy5tYXhTdXBwb3J0ZWRVc2VycyAmJiBcbiAgICAgICAgcmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdC5sb2FkTWV0cmljcy5tYXhTdXBwb3J0ZWRVc2VycyA8IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhDb25jdXJyZW50VXNlcnMpIHtcbiAgICAgIGxpbWl0YXRpb25zLnB1c2goYOWQjOaZguODpuODvOOCtuODvOaVsOOBruS4iumZkDogJHtyZXN1bHRzLmNvbmN1cnJlbnRMb2FkUmVzdWx0LmxvYWRNZXRyaWNzLm1heFN1cHBvcnRlZFVzZXJzfeS6umApO1xuICAgIH1cblxuICAgIGlmIChyZXN1bHRzLm11bHRpUmVnaW9uU2NhbGFiaWxpdHlSZXN1bHQ/LnNjYWxhYmlsaXR5TWV0cmljcz8ucmVnaW9uUGVyZm9ybWFuY2VWYXJpYW5jZSAmJiBcbiAgICAgICAgcmVzdWx0cy5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5UmVzdWx0LnNjYWxhYmlsaXR5TWV0cmljcy5yZWdpb25QZXJmb3JtYW5jZVZhcmlhbmNlID4gMC4zKSB7XG4gICAgICBsaW1pdGF0aW9ucy5wdXNoKCfjg6rjg7zjgrjjg6fjg7PplpPjga7mgKfog73lt67jgYzlpKfjgY3jgYQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGltaXRhdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICog5pS55ZaE5o6o5aWo5LqL6aCF44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlUmVjb21tZW5kYXRpb25zKHJlc3VsdHM6IFBhcnRpYWw8UGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+LCBzdW1tYXJ5OiBQZXJmb3JtYW5jZVN1bW1hcnkpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKHN1bW1hcnkuYXZlcmFnZVJlc3BvbnNlVGltZSA+IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUpIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCdDRE7jgq3jg6Pjg4Pjgrfjg6Xjga7mnIDpganljJbjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCdMYW1iZGHplqLmlbDjga7jg6Hjg6Ljg6roqK3lrprjgpLopovnm7TjgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICB9XG5cbiAgICBpZiAoc3VtbWFyeS5wZWFrVGhyb3VnaHB1dCA8IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5taW5UaHJvdWdocHV0KSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgnQXV0byBTY2FsaW5n44Gu6Kit5a6a44KS6Kq/5pW044GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44OH44O844K/44OZ44O844K55o6l57aa44OX44O844Or44Gu5pyA6YGp5YyW44KS5qSc6KiO44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgfVxuXG4gICAgaWYgKHN1bW1hcnkuc3lzdGVtVXB0aW1lIDwgdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblVwdGltZSkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+ODmOODq+OCueODgeOCp+ODg+OCr+OBrumgu+W6puOCkuWil+OChOOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+OCqOODqeODvOebo+imluOBqOOCouODqeODvOODiOOBruioreWumuOCkuW8t+WMluOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgIH1cblxuICAgIGlmIChzdW1tYXJ5LmNyaXRpY2FsSXNzdWVzID4gMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+OCr+ODquODhuOCo+OCq+ODq+OBquWVj+mhjOOBruagueacrOWOn+WboOWIhuaekOOCkuWun+aWveOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgIH1cblxuICAgIHJldHVybiByZWNvbW1lbmRhdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICog44Oq44K944O844K544Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAqL1xuICBhc3luYyBjbGVhbnVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn6e5IOODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiOODqeODs+ODiuODvOOCkuOCr+ODquODvOODs+OCouODg+ODl+S4rS4uLicpO1xuICAgIGNvbnNvbGUubG9nKCfinIUg44OR44OV44Kp44O844Oe44Oz44K557Wx5ZCI44OG44K544OI44Op44Oz44OK44O844Gu44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gIH1cbn0gIC9cbioqXG4gICAqIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBydW5SZXNwb25zZVRpbWVUZXN0KCk6IFByb21pc2U8UmVzcG9uc2VUaW1lVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IGNvbmZpZzogUmVzcG9uc2VUaW1lVGVzdENvbmZpZyA9IHtcbiAgICAgIGJhc2VVcmw6IHRoaXMuY29uZmlnLmJhc2VVcmwsXG4gICAgICB0ZXN0UXVlcmllczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdzaW1wbGVfMScsXG4gICAgICAgICAgcXVlcnk6ICfjgZPjgpPjgavjgaHjga8nLFxuICAgICAgICAgIHR5cGU6ICdzaW1wbGUnLFxuICAgICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiA4MDAsXG4gICAgICAgICAgY2F0ZWdvcnk6ICdnZW5lcmFsJyxcbiAgICAgICAgICByZXF1aXJlc1JBRzogZmFsc2UsXG4gICAgICAgICAgcmVxdWlyZXNBSTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdzdGFuZGFyZF8xJyxcbiAgICAgICAgICBxdWVyeTogJ0FXUyBMYW1iZGEg44Gu5Z+65pys55qE44Gq5L2/44GE5pa544KS5pWZ44GI44Gm44GP44Gg44GV44GEJyxcbiAgICAgICAgICB0eXBlOiAnc3RhbmRhcmQnLFxuICAgICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4UmVzcG9uc2VUaW1lLFxuICAgICAgICAgIGNhdGVnb3J5OiAndGVjaG5pY2FsJyxcbiAgICAgICAgICByZXF1aXJlc1JBRzogdHJ1ZSxcbiAgICAgICAgICByZXF1aXJlc0FJOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2NvbXBsZXhfMScsXG4gICAgICAgICAgcXVlcnk6ICfjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7Pjgafjga5BV1PjgqLjg7zjgq3jg4bjgq/jg4Hjg6PoqK3oqIjjgavjgaTjgYTjgaboqbPjgZfjgY/oqqzmmI7jgZfjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICAgIHR5cGU6ICdjb21wbGV4JyxcbiAgICAgICAgICBleHBlY3RlZFJlc3BvbnNlVGltZTogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSAqIDIsXG4gICAgICAgICAgY2F0ZWdvcnk6ICd0ZWNobmljYWwnLFxuICAgICAgICAgIHJlcXVpcmVzUkFHOiB0cnVlLFxuICAgICAgICAgIHJlcXVpcmVzQUk6IHRydWVcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIHBlcmZvcm1hbmNlVGhyZXNob2xkczoge1xuICAgICAgICBzdGFuZGFyZFF1ZXJ5VGltZTogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSxcbiAgICAgICAgY29tcGxleFF1ZXJ5VGltZTogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSAqIDIsXG4gICAgICAgIHNpbXBsZVF1ZXJ5VGltZTogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSAvIDIsXG4gICAgICAgIGF2ZXJhZ2VSZXNwb25zZVRpbWU6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUsXG4gICAgICAgIHBlcmNlbnRpbGU5NVRpbWU6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUgKiAxLjUsXG4gICAgICAgIHBlcmNlbnRpbGU5OVRpbWU6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUgKiAyXG4gICAgICB9LFxuICAgICAgdGVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgd2FybXVwUXVlcmllczogMyxcbiAgICAgICAgbWVhc3VyZW1lbnRRdWVyaWVzOiAxMCxcbiAgICAgICAgY29uY3VycmVudFJlcXVlc3RzOiAxLFxuICAgICAgICByZXF1ZXN0SW50ZXJ2YWw6IDEwMDBcbiAgICAgIH0sXG4gICAgICBuZXR3b3JrQ29uZGl0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0Zhc3QgM0cnLFxuICAgICAgICAgIGJhbmR3aWR0aDogMS42LFxuICAgICAgICAgIGxhdGVuY3k6IDE1MCxcbiAgICAgICAgICBwYWNrZXRMb3NzOiAwLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdTbG93IDNHJyxcbiAgICAgICAgICBiYW5kd2lkdGg6IDAuNCxcbiAgICAgICAgICBsYXRlbmN5OiAzMDAsXG4gICAgICAgICAgcGFja2V0TG9zczogMCxcbiAgICAgICAgICBlbmFibGVkOiB0aGlzLmNvbmZpZy50ZXN0RW52aXJvbm1lbnQgIT09ICdwcm9kdWN0aW9uJ1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfTtcblxuICAgIGNvbnN0IHRlc3QgPSBuZXcgUmVzcG9uc2VUaW1lVGVzdChjb25maWcpO1xuICAgIHJldHVybiBhd2FpdCB0ZXN0LnJ1blRlc3QoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlkIzmmYLjg6bjg7zjgrbjg7zosqDojbfjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcnVuQ29uY3VycmVudExvYWRUZXN0KCk6IFByb21pc2U8Q29uY3VycmVudExvYWRUZXN0UmVzdWx0PiB7XG4gICAgY29uc3QgY29uZmlnOiBDb25jdXJyZW50TG9hZFRlc3RDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiB0aGlzLmNvbmZpZy5iYXNlVXJsLFxuICAgICAgbG9hZFNjZW5hcmlvczogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0xpZ2h0IExvYWQnLFxuICAgICAgICAgIGNvbmN1cnJlbnRVc2VyczogTWF0aC5mbG9vcih0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4Q29uY3VycmVudFVzZXJzICogMC4yNSksXG4gICAgICAgICAgZHVyYXRpb246IHRoaXMuY29uZmlnLnRlc3REdXJhdGlvbi5sb2FkVGVzdCxcbiAgICAgICAgICB1c2VyQmVoYXZpb3I6IHtcbiAgICAgICAgICAgIGxvZ2luRnJlcXVlbmN5OiAxMCxcbiAgICAgICAgICAgIGNoYXRGcmVxdWVuY3k6IDYwLFxuICAgICAgICAgICAgc2VhcmNoRnJlcXVlbmN5OiAyMCxcbiAgICAgICAgICAgIGlkbGVUaW1lOiA1LFxuICAgICAgICAgICAgc2Vzc2lvbkxlbmd0aDogMTBcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdNZWRpdW0gTG9hZCcsXG4gICAgICAgICAgY29uY3VycmVudFVzZXJzOiBNYXRoLmZsb29yKHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhDb25jdXJyZW50VXNlcnMgKiAwLjUpLFxuICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLmNvbmZpZy50ZXN0RHVyYXRpb24ubG9hZFRlc3QsXG4gICAgICAgICAgdXNlckJlaGF2aW9yOiB7XG4gICAgICAgICAgICBsb2dpbkZyZXF1ZW5jeTogMTUsXG4gICAgICAgICAgICBjaGF0RnJlcXVlbmN5OiA1MCxcbiAgICAgICAgICAgIHNlYXJjaEZyZXF1ZW5jeTogMjUsXG4gICAgICAgICAgICBpZGxlVGltZTogMyxcbiAgICAgICAgICAgIHNlc3Npb25MZW5ndGg6IDE1XG4gICAgICAgICAgfSxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnSGVhdnkgTG9hZCcsXG4gICAgICAgICAgY29uY3VycmVudFVzZXJzOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4Q29uY3VycmVudFVzZXJzLFxuICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLmNvbmZpZy50ZXN0RHVyYXRpb24ubG9hZFRlc3QsXG4gICAgICAgICAgdXNlckJlaGF2aW9yOiB7XG4gICAgICAgICAgICBsb2dpbkZyZXF1ZW5jeTogMjAsXG4gICAgICAgICAgICBjaGF0RnJlcXVlbmN5OiA0MCxcbiAgICAgICAgICAgIHNlYXJjaEZyZXF1ZW5jeTogMzAsXG4gICAgICAgICAgICBpZGxlVGltZTogMixcbiAgICAgICAgICAgIHNlc3Npb25MZW5ndGg6IDIwXG4gICAgICAgICAgfSxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICB1c2VyUHJvZmlsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdsaWdodCcsXG4gICAgICAgICAgd2VpZ2h0OiA0MCxcbiAgICAgICAgICBhY3Rpb25zUGVyTWludXRlOiAyLFxuICAgICAgICAgIHNlc3Npb25EdXJhdGlvbjogMzAwLFxuICAgICAgICAgIHF1ZXJ5Q29tcGxleGl0eTogJ3NpbXBsZSdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgd2VpZ2h0OiA0MCxcbiAgICAgICAgICBhY3Rpb25zUGVyTWludXRlOiA0LFxuICAgICAgICAgIHNlc3Npb25EdXJhdGlvbjogNjAwLFxuICAgICAgICAgIHF1ZXJ5Q29tcGxleGl0eTogJ3N0YW5kYXJkJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ2hlYXZ5JyxcbiAgICAgICAgICB3ZWlnaHQ6IDIwLFxuICAgICAgICAgIGFjdGlvbnNQZXJNaW51dGU6IDgsXG4gICAgICAgICAgc2Vzc2lvbkR1cmF0aW9uOiA5MDAsXG4gICAgICAgICAgcXVlcnlDb21wbGV4aXR5OiAnY29tcGxleCdcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIHRlc3REdXJhdGlvbjogdGhpcy5jb25maWcudGVzdER1cmF0aW9uLmxvYWRUZXN0LFxuICAgICAgcmFtcFVwVGltZTogNjAsXG4gICAgICByYW1wRG93blRpbWU6IDMwLFxuICAgICAgdGhyZXNob2xkczoge1xuICAgICAgICBtYXhSZXNwb25zZVRpbWU6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUsXG4gICAgICAgIG1heEVycm9yUmF0ZTogNSxcbiAgICAgICAgbWluVGhyb3VnaHB1dDogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblRocm91Z2hwdXQsXG4gICAgICAgIG1heENwdVVzYWdlOiA4MCxcbiAgICAgICAgbWF4TWVtb3J5VXNhZ2U6IDc1XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHRlc3QgPSBuZXcgQ29uY3VycmVudExvYWRUZXN0KGNvbmZpZyk7XG4gICAgcmV0dXJuIGF3YWl0IHRlc3QucnVuVGVzdCgpO1xuICB9IFxuIC8qKlxuICAgKiDnqLzlg43njofnm6Poppbjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcnVuVXB0aW1lTW9uaXRvcmluZ1Rlc3QoKTogUHJvbWlzZTxVcHRpbWVNb25pdG9yaW5nVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IGNvbmZpZzogVXB0aW1lTW9uaXRvcmluZ1Rlc3RDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiB0aGlzLmNvbmZpZy5iYXNlVXJsLFxuICAgICAgbW9uaXRvcmluZ0VuZHBvaW50czogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ01haW4gQXBwbGljYXRpb24nLFxuICAgICAgICAgIHVybDogYCR7dGhpcy5jb25maWcuYmFzZVVybH0vYCxcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIGV4cGVjdGVkU3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4UmVzcG9uc2VUaW1lLFxuICAgICAgICAgIGNyaXRpY2FsaXR5OiAnY3JpdGljYWwnLFxuICAgICAgICAgIGhlYWx0aENoZWNrVHlwZTogJ2Jhc2ljJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0NoYXQgQVBJJyxcbiAgICAgICAgICB1cmw6IGAke3RoaXMuY29uZmlnLmJhc2VVcmx9L2FwaS9jaGF0YCxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6ICdoZWFsdGggY2hlY2snLCB1c2VySWQ6ICd0ZXN0JyB9KSxcbiAgICAgICAgICBleHBlY3RlZFN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICBleHBlY3RlZFJlc3BvbnNlVGltZTogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSAqIDEuNSxcbiAgICAgICAgICBjcml0aWNhbGl0eTogJ2NyaXRpY2FsJyxcbiAgICAgICAgICBoZWFsdGhDaGVja1R5cGU6ICdmdW5jdGlvbmFsJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0hlYWx0aCBDaGVjaycsXG4gICAgICAgICAgdXJsOiBgJHt0aGlzLmNvbmZpZy5iYXNlVXJsfS9hcGkvaGVhbHRoYCxcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIGV4cGVjdGVkU3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiAxMDAwLFxuICAgICAgICAgIGNyaXRpY2FsaXR5OiAnc3RhbmRhcmQnLFxuICAgICAgICAgIGhlYWx0aENoZWNrVHlwZTogJ2RlZXAnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQXV0aGVudGljYXRpb24gQVBJJyxcbiAgICAgICAgICB1cmw6IGAke3RoaXMuY29uZmlnLmJhc2VVcmx9L2FwaS9hdXRoL3N0YXR1c2AsXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBleHBlY3RlZFN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICBleHBlY3RlZFJlc3BvbnNlVGltZTogMTUwMCxcbiAgICAgICAgICBjcml0aWNhbGl0eTogJ2NyaXRpY2FsJyxcbiAgICAgICAgICBoZWFsdGhDaGVja1R5cGU6ICdmdW5jdGlvbmFsJ1xuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgbW9uaXRvcmluZ0R1cmF0aW9uOiB0aGlzLmNvbmZpZy50ZXN0RHVyYXRpb24udXB0aW1lTW9uaXRvcmluZyxcbiAgICAgIGNoZWNrSW50ZXJ2YWw6IDMwLFxuICAgICAgdXB0aW1lVGFyZ2V0czoge1xuICAgICAgICBvdmVyYWxsOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWluVXB0aW1lLFxuICAgICAgICBjcml0aWNhbDogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblVwdGltZSArIDAuMDUsXG4gICAgICAgIHN0YW5kYXJkOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWluVXB0aW1lIC0gMC41XG4gICAgICB9LFxuICAgICAgYWxlcnRUaHJlc2hvbGRzOiB7XG4gICAgICAgIGNvbnNlY3V0aXZlRmFpbHVyZXM6IDMsXG4gICAgICAgIHJlc3BvbnNlVGltZVRocmVzaG9sZDogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSAqIDIsXG4gICAgICAgIGVycm9yUmF0ZVRocmVzaG9sZDogNVxuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCB0ZXN0ID0gbmV3IFVwdGltZU1vbml0b3JpbmdUZXN0KGNvbmZpZyk7XG4gICAgcmV0dXJuIGF3YWl0IHRlc3QucnVuVGVzdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIOODnuODq+ODgeODquODvOOCuOODp+ODs+OCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBydW5NdWx0aVJlZ2lvblNjYWxhYmlsaXR5VGVzdCgpOiBQcm9taXNlPE11bHRpUmVnaW9uU2NhbGFiaWxpdHlUZXN0UmVzdWx0PiB7XG4gICAgY29uc3QgY29uZmlnOiBNdWx0aVJlZ2lvblNjYWxhYmlsaXR5VGVzdENvbmZpZyA9IHtcbiAgICAgIHJlZ2lvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdUb2t5bycsXG4gICAgICAgICAgcmVnaW9uOiAnYXAtbm9ydGhlYXN0LTEnLFxuICAgICAgICAgIGJhc2VVcmw6IHRoaXMuY29uZmlnLmJhc2VVcmwucmVwbGFjZSgnbG9jYWxob3N0JywgJ3Rva3lvLmV4YW1wbGUuY29tJyksXG4gICAgICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICAgICAgZXhwZWN0ZWRMYXRlbmN5OiA1MCxcbiAgICAgICAgICBjYXBhY2l0eToge1xuICAgICAgICAgICAgbWF4Q29uY3VycmVudFVzZXJzOiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4Q29uY3VycmVudFVzZXJzLFxuICAgICAgICAgICAgbWF4VGhyb3VnaHB1dDogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblRocm91Z2hwdXQgKiAyXG4gICAgICAgICAgfSxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnT3Nha2EnLFxuICAgICAgICAgIHJlZ2lvbjogJ2FwLW5vcnRoZWFzdC0zJyxcbiAgICAgICAgICBiYXNlVXJsOiB0aGlzLmNvbmZpZy5iYXNlVXJsLnJlcGxhY2UoJ2xvY2FsaG9zdCcsICdvc2FrYS5leGFtcGxlLmNvbScpLFxuICAgICAgICAgIHByaW9yaXR5OiAyLFxuICAgICAgICAgIGV4cGVjdGVkTGF0ZW5jeTogODAsXG4gICAgICAgICAgY2FwYWNpdHk6IHtcbiAgICAgICAgICAgIG1heENvbmN1cnJlbnRVc2VyczogTWF0aC5mbG9vcih0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRhcmdldHMubWF4Q29uY3VycmVudFVzZXJzICogMC44KSxcbiAgICAgICAgICAgIG1heFRocm91Z2hwdXQ6IE1hdGguZmxvb3IodGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblRocm91Z2hwdXQgKiAxLjYpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBlbmFibGVkOiB0aGlzLmNvbmZpZy50ZXN0RW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJ1xuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgdGVzdFNjZW5hcmlvczogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0xpbmVhciBTY2FsaW5nIFRlc3QnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAn57ea5b2i44K544Kx44O844Oq44Oz44Kw44OG44K544OIJyxcbiAgICAgICAgICB1c2VyTG9hZDogWzUwLCAxMDAsIDIwMCwgNDAwXSxcbiAgICAgICAgICBkdXJhdGlvbjogdGhpcy5jb25maWcudGVzdER1cmF0aW9uLnNjYWxhYmlsaXR5VGVzdCxcbiAgICAgICAgICByYW1wVXBUaW1lOiA2MCxcbiAgICAgICAgICB0ZXN0VHlwZTogJ2xpbmVhcicsXG4gICAgICAgICAgZXhwZWN0ZWRCZWhhdmlvcjogJ0xpbmVhciBwZXJmb3JtYW5jZSBzY2FsaW5nJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1NwaWtlIFRlc3QnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5oCl5r+A44Gq6LKg6I235aKX5Yqg44OG44K544OIJyxcbiAgICAgICAgICB1c2VyTG9hZDogWzEwMCwgdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heENvbmN1cnJlbnRVc2Vyc10sXG4gICAgICAgICAgZHVyYXRpb246IE1hdGguZmxvb3IodGhpcy5jb25maWcudGVzdER1cmF0aW9uLnNjYWxhYmlsaXR5VGVzdCAqIDAuNiksXG4gICAgICAgICAgcmFtcFVwVGltZTogMTAsXG4gICAgICAgICAgdGVzdFR5cGU6ICdzcGlrZScsXG4gICAgICAgICAgZXhwZWN0ZWRCZWhhdmlvcjogJ0dyYWNlZnVsIGhhbmRsaW5nIG9mIHRyYWZmaWMgc3Bpa2VzJ1xuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgICAgIG1heExhdGVuY3k6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWUsXG4gICAgICAgIG1pblRocm91Z2hwdXQ6IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5taW5UaHJvdWdocHV0LFxuICAgICAgICBtYXhFcnJvclJhdGU6IDUsXG4gICAgICAgIG1heFJlZ2lvblZhcmlhbmNlOiAzMFxuICAgICAgfSxcbiAgICAgIGxvYWREaXN0cmlidXRpb246IHtcbiAgICAgICAgc3RyYXRlZ3k6ICd3ZWlnaHRlZCcsXG4gICAgICAgIHdlaWdodHM6IHtcbiAgICAgICAgICAnYXAtbm9ydGhlYXN0LTEnOiAwLjYsXG4gICAgICAgICAgJ2FwLW5vcnRoZWFzdC0zJzogMC40XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmYWlsb3ZlclRlc3Rpbmc6IHtcbiAgICAgICAgZW5hYmxlZDogdGhpcy5jb25maWcudGVzdEVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicsXG4gICAgICAgIHNjZW5hcmlvczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdUb2t5byB0byBPc2FrYSBGYWlsb3ZlcicsXG4gICAgICAgICAgICBwcmltYXJ5UmVnaW9uOiAnYXAtbm9ydGhlYXN0LTEnLFxuICAgICAgICAgICAgZmFpbG92ZXJSZWdpb246ICdhcC1ub3J0aGVhc3QtMycsXG4gICAgICAgICAgICB0cmlnZ2VyVHlwZTogJ3NpbXVsYXRlZF9mYWlsdXJlJyxcbiAgICAgICAgICAgIGV4cGVjdGVkRmFpbG92ZXJUaW1lOiAzMCxcbiAgICAgICAgICAgIGV4cGVjdGVkRGF0YUNvbnNpc3RlbmN5OiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHRlc3QgPSBuZXcgTXVsdGlSZWdpb25TY2FsYWJpbGl0eVRlc3QoY29uZmlnKTtcbiAgICByZXR1cm4gYXdhaXQgdGVzdC5ydW5UZXN0KCk7XG4gIH0gIC9cbioqXG4gICAqIOe1kOaenOOBrue1seWQiOOBqOipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBhZ2dyZWdhdGVSZXN1bHRzKHJlc3VsdHM6IFBhcnRpYWw8UGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+KTogUGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQge1xuICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHRoaXMudGVzdFN0YXJ0VGltZTtcbiAgICBcbiAgICAvLyDlkITjg4bjgrnjg4jjga7jgrnjgrPjgqLlj47pm4ZcbiAgICBjb25zdCBzY29yZXMgPSB7XG4gICAgICByZXNwb25zZVRpbWU6IHJlc3VsdHMucmVzcG9uc2VUaW1lUmVzdWx0Py5vdmVyYWxsUmVzcG9uc2VTY29yZSB8fCAwLFxuICAgICAgY29uY3VycmVudExvYWQ6IHJlc3VsdHMuY29uY3VycmVudExvYWRSZXN1bHQ/Lm92ZXJhbGxMb2FkU2NvcmUgfHwgMCxcbiAgICAgIHVwdGltZU1vbml0b3Jpbmc6IHJlc3VsdHMudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdD8ub3ZlcmFsbFVwdGltZVNjb3JlIHx8IDAsXG4gICAgICBtdWx0aVJlZ2lvblNjYWxhYmlsaXR5OiByZXN1bHRzLm11bHRpUmVnaW9uU2NhbGFiaWxpdHlSZXN1bHQ/Lm92ZXJhbGxTY2FsYWJpbGl0eVNjb3JlIHx8IDBcbiAgICB9O1xuXG4gICAgLy8g6YeN44G/5LuY44GN44K544Kz44Ki6KiI566XXG4gICAgY29uc3Qgd2VpZ2h0cyA9IHtcbiAgICAgIHJlc3BvbnNlVGltZTogMC4zLFxuICAgICAgY29uY3VycmVudExvYWQ6IDAuMyxcbiAgICAgIHVwdGltZU1vbml0b3Jpbmc6IDAuMjUsXG4gICAgICBtdWx0aVJlZ2lvblNjYWxhYmlsaXR5OiAwLjE1XG4gICAgfTtcblxuICAgIGNvbnN0IG92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlID0gT2JqZWN0LmVudHJpZXMoc2NvcmVzKS5yZWR1Y2UoKHN1bSwgW2tleSwgc2NvcmVdKSA9PiB7XG4gICAgICByZXR1cm4gc3VtICsgKHNjb3JlICogd2VpZ2h0c1trZXkgYXMga2V5b2YgdHlwZW9mIHdlaWdodHNdKTtcbiAgICB9LCAwKTtcblxuICAgIC8vIOOCq+ODhuOCtOODquWIpeOCueOCs+OCouioiOeul1xuICAgIGNvbnN0IHJlc3BvbnNlVGltZVNjb3JlID0gc2NvcmVzLnJlc3BvbnNlVGltZTtcbiAgICBjb25zdCBzY2FsYWJpbGl0eVNjb3JlID0gKHNjb3Jlcy5jb25jdXJyZW50TG9hZCArIHNjb3Jlcy5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5KSAvIDI7XG4gICAgY29uc3QgcmVsaWFiaWxpdHlTY29yZSA9IHNjb3Jlcy51cHRpbWVNb25pdG9yaW5nO1xuICAgIGNvbnN0IGdsb2JhbFBlcmZvcm1hbmNlU2NvcmUgPSB0aGlzLmNhbGN1bGF0ZUdsb2JhbFBlcmZvcm1hbmNlU2NvcmUocmVzdWx0cyk7XG5cbiAgICAvLyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgrXjg57jg6rjg7zjga7kvZzmiJBcbiAgICBjb25zdCBwZXJmb3JtYW5jZVN1bW1hcnkgPSB0aGlzLmNyZWF0ZVBlcmZvcm1hbmNlU3VtbWFyeShyZXN1bHRzLCBkdXJhdGlvbik7XG5cbiAgICAvLyDmjqjlpajkuovpoIXjga7nlJ/miJBcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSB0aGlzLmdlbmVyYXRlUmVjb21tZW5kYXRpb25zKHJlc3VsdHMsIHNjb3Jlcyk7XG5cbiAgICAvLyDmiJDlip/liKTlrppcbiAgICBjb25zdCBzdWNjZXNzID0gb3ZlcmFsbFBlcmZvcm1hbmNlU2NvcmUgPj0gODUgJiYgXG4gICAgICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VTdW1tYXJ5LmNyaXRpY2FsSXNzdWVzID09PSAwICYmIFxuICAgICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlU3VtbWFyeS5zeXN0ZW1VcHRpbWUgPj0gdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblVwdGltZTtcblxuICAgIHJldHVybiB7XG4gICAgICB0ZXN0TmFtZTogJ1BlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0JyxcbiAgICAgIHN1Y2Nlc3MsXG4gICAgICBkdXJhdGlvbixcbiAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgdGVzdEVudmlyb25tZW50OiB0aGlzLmNvbmZpZy50ZXN0RW52aXJvbm1lbnQsXG4gICAgICAgIGVuYWJsZWRUZXN0czogdGhpcy5jb25maWcuZW5hYmxlZFRlc3RzLFxuICAgICAgICBvdmVyYWxsU2NvcmU6IG92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlLFxuICAgICAgICBpbmRpdmlkdWFsU2NvcmVzOiBzY29yZXMsXG4gICAgICAgIHBlcmZvcm1hbmNlVGFyZ2V0czogdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzXG4gICAgICB9LFxuICAgICAgLi4ucmVzdWx0cyxcbiAgICAgIG92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlLFxuICAgICAgcmVzcG9uc2VUaW1lU2NvcmUsXG4gICAgICBzY2FsYWJpbGl0eVNjb3JlLFxuICAgICAgcmVsaWFiaWxpdHlTY29yZSxcbiAgICAgIGdsb2JhbFBlcmZvcm1hbmNlU2NvcmUsXG4gICAgICBwZXJmb3JtYW5jZVN1bW1hcnksXG4gICAgICByZWNvbW1lbmRhdGlvbnNcbiAgICB9IGFzIFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIOOCsOODreODvOODkOODq+ODkeODleOCqeODvOODnuODs+OCueOCueOCs+OCouOBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVHbG9iYWxQZXJmb3JtYW5jZVNjb3JlKHJlc3VsdHM6IFBhcnRpYWw8UGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+KTogbnVtYmVyIHtcbiAgICBsZXQgdG90YWxTY29yZSA9IDA7XG4gICAgbGV0IGNvdW50ID0gMDtcblxuICAgIGlmIChyZXN1bHRzLnJlc3BvbnNlVGltZVJlc3VsdCkge1xuICAgICAgdG90YWxTY29yZSArPSByZXN1bHRzLnJlc3BvbnNlVGltZVJlc3VsdC5vdmVyYWxsUmVzcG9uc2VTY29yZTtcbiAgICAgIGNvdW50Kys7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdHMuY29uY3VycmVudExvYWRSZXN1bHQpIHtcbiAgICAgIHRvdGFsU2NvcmUgKz0gcmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdC5vdmVyYWxsTG9hZFNjb3JlO1xuICAgICAgY291bnQrKztcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0cy5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5UmVzdWx0KSB7XG4gICAgICB0b3RhbFNjb3JlICs9IHJlc3VsdHMubXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdC5nbG9iYWxQZXJmb3JtYW5jZVNjb3JlO1xuICAgICAgY291bnQrKztcbiAgICB9XG5cbiAgICByZXR1cm4gY291bnQgPiAwID8gdG90YWxTY29yZSAvIGNvdW50IDogMDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgrXjg57jg6rjg7zjga7kvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlUGVyZm9ybWFuY2VTdW1tYXJ5KHJlc3VsdHM6IFBhcnRpYWw8UGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+LCBkdXJhdGlvbjogbnVtYmVyKTogUGVyZm9ybWFuY2VTdW1tYXJ5IHtcbiAgICBsZXQgdG90YWxUZXN0cyA9IDA7XG4gICAgbGV0IHBhc3NlZFRlc3RzID0gMDtcbiAgICBsZXQgZmFpbGVkVGVzdHMgPSAwO1xuICAgIGxldCBhdmVyYWdlUmVzcG9uc2VUaW1lID0gMDtcbiAgICBsZXQgcGVha1Rocm91Z2hwdXQgPSAwO1xuICAgIGxldCBzeXN0ZW1VcHRpbWUgPSAwO1xuICAgIGxldCBtYXhTdXBwb3J0ZWRVc2VycyA9IDA7XG4gICAgbGV0IGNyaXRpY2FsSXNzdWVzID0gMDtcbiAgICBjb25zdCBwZXJmb3JtYW5jZUJvdHRsZW5lY2tzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHNjYWxhYmlsaXR5TGltaXRhdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDlv5znrZTmmYLplpPmuKzlrprjg4bjgrnjg4hcbiAgICBpZiAocmVzdWx0cy5yZXNwb25zZVRpbWVSZXN1bHQpIHtcbiAgICAgIHRvdGFsVGVzdHMrKztcbiAgICAgIGlmIChyZXN1bHRzLnJlc3BvbnNlVGltZVJlc3VsdC5zdWNjZXNzKSBwYXNzZWRUZXN0cysrO1xuICAgICAgZWxzZSBmYWlsZWRUZXN0cysrO1xuXG4gICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lID0gcmVzdWx0cy5yZXNwb25zZVRpbWVSZXN1bHQucGVyZm9ybWFuY2VNZXRyaWNzLm92ZXJhbGxBdmVyYWdlVGltZTtcbiAgICB9XG5cbiAgICAvLyDlkIzmmYLjg6bjg7zjgrbjg7zosqDojbfjg4bjgrnjg4hcbiAgICBpZiAocmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdCkge1xuICAgICAgdG90YWxUZXN0cysrO1xuICAgICAgaWYgKHJlc3VsdHMuY29uY3VycmVudExvYWRSZXN1bHQuc3VjY2VzcykgcGFzc2VkVGVzdHMrKztcbiAgICAgIGVsc2UgZmFpbGVkVGVzdHMrKztcblxuICAgICAgcGVha1Rocm91Z2hwdXQgPSByZXN1bHRzLmNvbmN1cnJlbnRMb2FkUmVzdWx0LnN5c3RlbU1ldHJpY3MucGVha1Rocm91Z2hwdXQ7XG4gICAgICBtYXhTdXBwb3J0ZWRVc2VycyA9IHJlc3VsdHMuY29uY3VycmVudExvYWRSZXN1bHQuc3lzdGVtTWV0cmljcy5wZWFrQ29uY3VycmVudFVzZXJzO1xuXG4gICAgICAvLyDjg5zjg4jjg6vjg43jg4Pjgq/jga7mpJzlh7pcbiAgICAgIGlmIChyZXN1bHRzLmNvbmN1cnJlbnRMb2FkUmVzdWx0LnN5c3RlbU1ldHJpY3MucGVha0NwdVVzYWdlID4gODApIHtcbiAgICAgICAgcGVyZm9ybWFuY2VCb3R0bGVuZWNrcy5wdXNoKCdDUFXkvb/nlKjnjofjgYzpq5jjgYQnKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXN1bHRzLmNvbmN1cnJlbnRMb2FkUmVzdWx0LnN5c3RlbU1ldHJpY3MucGVha01lbW9yeVVzYWdlID4gODApIHtcbiAgICAgICAgcGVyZm9ybWFuY2VCb3R0bGVuZWNrcy5wdXNoKCfjg6Hjg6Ljg6rkvb/nlKjnjofjgYzpq5jjgYQnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDnqLzlg43njofnm6Poppbjg4bjgrnjg4hcbiAgICBpZiAocmVzdWx0cy51cHRpbWVNb25pdG9yaW5nUmVzdWx0KSB7XG4gICAgICB0b3RhbFRlc3RzKys7XG4gICAgICBpZiAocmVzdWx0cy51cHRpbWVNb25pdG9yaW5nUmVzdWx0LnN1Y2Nlc3MpIHBhc3NlZFRlc3RzKys7XG4gICAgICBlbHNlIGZhaWxlZFRlc3RzKys7XG5cbiAgICAgIHN5c3RlbVVwdGltZSA9IHJlc3VsdHMudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdC5vdmVyYWxsTWV0cmljcy50b3RhbFVwdGltZTtcbiAgICAgIGNyaXRpY2FsSXNzdWVzICs9IHJlc3VsdHMudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdC5pbmNpZGVudFJlcG9ydHMuZmlsdGVyKGkgPT4gaS5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJykubGVuZ3RoO1xuICAgIH1cblxuICAgIC8vIOODnuODq+ODgeODquODvOOCuOODp+ODs+OCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiFxuICAgIGlmIChyZXN1bHRzLm11bHRpUmVnaW9uU2NhbGFiaWxpdHlSZXN1bHQpIHtcbiAgICAgIHRvdGFsVGVzdHMrKztcbiAgICAgIGlmIChyZXN1bHRzLm11bHRpUmVnaW9uU2NhbGFiaWxpdHlSZXN1bHQuc3VjY2VzcykgcGFzc2VkVGVzdHMrKztcbiAgICAgIGVsc2UgZmFpbGVkVGVzdHMrKztcblxuICAgICAgLy8g44K544Kx44O844Op44OT44Oq44OG44Kj5Yi26ZmQ44Gu5qSc5Ye6XG4gICAgICByZXN1bHRzLm11bHRpUmVnaW9uU2NhbGFiaWxpdHlSZXN1bHQucmVnaW9uUmVzdWx0cy5mb3JFYWNoKHJlZ2lvbiA9PiB7XG4gICAgICAgIGlmIChyZWdpb24uc2NhbGFiaWxpdHlMaW1pdHMucmVzb3VyY2VCb3R0bGVuZWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc2NhbGFiaWxpdHlMaW1pdGF0aW9uICAgIFxuICAgICAgc2NhbGFiaWxpdHlMaW1pdGF0aW9ucy5wdXNoKGAke3JlZ2lvbi5yZWdpb25OYW1lfTogJHtyZWdpb24uc2NhbGFiaWxpdHlMaW1pdHMucmVzb3VyY2VCb3R0bGVuZWNrcy5qb2luKCcsICcpfWApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG90YWxUZXN0cyxcbiAgICAgIHBhc3NlZFRlc3RzLFxuICAgICAgZmFpbGVkVGVzdHMsXG4gICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lLFxuICAgICAgcGVha1Rocm91Z2hwdXQsXG4gICAgICBzeXN0ZW1VcHRpbWUsXG4gICAgICBtYXhTdXBwb3J0ZWRVc2VycyxcbiAgICAgIGNyaXRpY2FsSXNzdWVzLFxuICAgICAgcGVyZm9ybWFuY2VCb3R0bGVuZWNrcyxcbiAgICAgIHNjYWxhYmlsaXR5TGltaXRhdGlvbnNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOaOqOWlqOS6i+mgheOBrueUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZVJlY29tbWVuZGF0aW9ucyhcbiAgICByZXN1bHRzOiBQYXJ0aWFsPFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0PiwgXG4gICAgc2NvcmVzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+XG4gICk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDlv5znrZTmmYLplpPjga7mjqjlpajkuovpoIVcbiAgICBpZiAoc2NvcmVzLnJlc3BvbnNlVGltZSA8IDg1KSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn5b+c562U5pmC6ZaT44Gu5pyA6YGp5YyW44GM5b+F6KaB44Gn44GZ44CC44OH44O844K/44OZ44O844K544Kv44Ko44Oq44KEQUnlh6bnkIbjga7lirnnjofljJbjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYTjgIInKTtcbiAgICB9XG5cbiAgICAvLyDosqDojbfjg4bjgrnjg4jjga7mjqjlpajkuovpoIVcbiAgICBpZiAoc2NvcmVzLmNvbmN1cnJlbnRMb2FkIDwgODUpIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCflkIzmmYLjg6bjg7zjgrbjg7zosqDojbfjgbjjga7lr77lv5zlipvjgpLlkJHkuIrjgZXjgZvjgabjgY/jgaDjgZXjgYTjgILmsLTlubPjgrnjgrHjg7zjg6rjg7PjgrDjga7lsI7lhaXjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYTjgIInKTtcbiAgICB9XG5cbiAgICAvLyDnqLzlg43njofjga7mjqjlpajkuovpoIVcbiAgICBpZiAoc2NvcmVzLnVwdGltZU1vbml0b3JpbmcgPCA5OSkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goYOOCt+OCueODhuODoOOBrueovOWDjeeOh+OBjOebruaomeWApCAke3RoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5taW5VcHRpbWV9JSDjgpLkuIvlm57jgaPjgabjgYTjgb7jgZnjgILlhpfplbfljJbjgajjg5XjgqfjgqTjg6vjgqrjg7zjg5Djg7zmqZ/og73jga7lvLfljJbjgYzlv4XopoHjgafjgZnjgIJgKTtcbiAgICB9XG5cbiAgICAvLyDjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7Pjga7mjqjlpajkuovpoIVcbiAgICBpZiAoc2NvcmVzLm11bHRpUmVnaW9uU2NhbGFiaWxpdHkgPCA4NSkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+ODnuODq+ODgeODquODvOOCuOODp+ODs+WvvuW/nOOBruaUueWWhOOBjOW/heimgeOBp+OBmeOAguODquODvOOCuOODp+ODs+mWk+OBruiyoOiNt+WIhuaVo+OBqOODh+ODvOOCv+WQjOacn+OBruacgOmBqeWMluOCkuihjOOBo+OBpuOBj+OBoOOBleOBhOOAgicpO1xuICAgIH1cblxuICAgIC8vIOODkeODleOCqeODvOODnuODs+OCueODnOODiOODq+ODjeODg+OCr+OBruaOqOWlqOS6i+mghVxuICAgIGlmIChyZXN1bHRzLmNvbmN1cnJlbnRMb2FkUmVzdWx0Py5zeXN0ZW1NZXRyaWNzLnBlYWtDcHVVc2FnZSAmJiByZXN1bHRzLmNvbmN1cnJlbnRMb2FkUmVzdWx0LnN5c3RlbU1ldHJpY3MucGVha0NwdVVzYWdlID4gODApIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCdDUFXkvb/nlKjnjofjgYzpq5jjgYTjgZ/jgoHjgIHlh6bnkIbjga7mnIDpganljJbjgb7jgZ/jga/jgqTjg7Pjgrnjgr/jg7Pjgrnjga7jgrnjgrHjg7zjg6vjgqLjg4Pjg5fjgYzlv4XopoHjgafjgZnjgIInKTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdD8uc3lzdGVtTWV0cmljcy5wZWFrTWVtb3J5VXNhZ2UgJiYgcmVzdWx0cy5jb25jdXJyZW50TG9hZFJlc3VsdC5zeXN0ZW1NZXRyaWNzLnBlYWtNZW1vcnlVc2FnZSA+IDgwKSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44Oh44Oi44Oq5L2/55So546H44GM6auY44GE44Gf44KB44CB44Oh44Oi44Oq44Oq44O844Kv44Gu6Kq/5p+744G+44Gf44Gv44Oh44Oi44Oq5a656YeP44Gu5aKX5by344GM5b+F6KaB44Gn44GZ44CCJyk7XG4gICAgfVxuXG4gICAgLy8g5b+c562U5pmC6ZaT44Gu5o6o5aWo5LqL6aCFXG4gICAgaWYgKHJlc3VsdHMucmVzcG9uc2VUaW1lUmVzdWx0Py5wZXJmb3JtYW5jZU1ldHJpY3Mub3ZlcmFsbEF2ZXJhZ2VUaW1lICYmIFxuICAgICAgICByZXN1bHRzLnJlc3BvbnNlVGltZVJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3Mub3ZlcmFsbEF2ZXJhZ2VUaW1lID4gdGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZSkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goYOW5s+Wdh+W/nOetlOaZgumWk+OBjOebruaomeWApCAke3RoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5tYXhSZXNwb25zZVRpbWV9bXMg44KS6LaF44GI44Gm44GE44G+44GZ44CC44Kt44Oj44OD44K344Ol5oim55Wl44Gu6KaL55u044GX44GM5b+F6KaB44Gn44GZ44CCYCk7XG4gICAgfVxuXG4gICAgLy8g44K544Or44O844OX44OD44OI44Gu5o6o5aWo5LqL6aCFXG4gICAgaWYgKHJlc3VsdHMuY29uY3VycmVudExvYWRSZXN1bHQ/LnN5c3RlbU1ldHJpY3MucGVha1Rocm91Z2hwdXQgJiYgXG4gICAgICAgIHJlc3VsdHMuY29uY3VycmVudExvYWRSZXN1bHQuc3lzdGVtTWV0cmljcy5wZWFrVGhyb3VnaHB1dCA8IHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGFyZ2V0cy5taW5UaHJvdWdocHV0KSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaChg44K544Or44O844OX44OD44OI44GM55uu5qiZ5YCkICR7dGhpcy5jb25maWcucGVyZm9ybWFuY2VUYXJnZXRzLm1pblRocm91Z2hwdXR9IHJlcS9zZWMg44KS5LiL5Zue44Gj44Gm44GE44G+44GZ44CC44Ki44O844Kt44OG44Kv44OB44Oj44Gu6KaL55u044GX44GM5b+F6KaB44Gn44GZ44CCYCk7XG4gICAgfVxuXG4gICAgLy8g5LiA6Iis55qE44Gq5o6o5aWo5LqL6aCFXG4gICAgaWYgKHJlY29tbWVuZGF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfjgZnjgbnjgabjga7jg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jjgYzoia/lpb3jgarntZDmnpzjgpLnpLrjgZfjgabjgYTjgb7jgZnjgILnj77lnKjjga7jg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg6zjg5njg6vjgpLntq3mjIHjgZfjgabjgY/jgaDjgZXjgYTjgIInKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVjb21tZW5kYXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIOODhuOCueODiOe1kOaenOOBruODreOCsOWHuuWKm1xuICAgKi9cbiAgcHJpdmF0ZSBsb2dUZXN0UmVzdWx0cyhyZXN1bHQ6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coJ1xcbvCfk4og44OR44OV44Kp44O844Oe44Oz44K557Wx5ZCI44OG44K544OI5pyA57WC57WQ5p6cOicpO1xuICAgIGNvbnNvbGUubG9nKCc9JyAucmVwZWF0KDYwKSk7XG4gICAgY29uc29sZS5sb2coYOKchSDnt4/lkIjjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgrnjgrPjgqI6ICR7cmVzdWx0Lm92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlLnRvRml4ZWQoMSl9LzEwMGApO1xuICAgIGNvbnNvbGUubG9nKGDij7HvuI8g5b+c562U5pmC6ZaT44K544Kz44KiOiAke3Jlc3VsdC5yZXNwb25zZVRpbWVTY29yZS50b0ZpeGVkKDEpfS8xMDBgKTtcbiAgICBjb25zb2xlLmxvZyhg8J+agCDjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPjgrnjgrPjgqI6ICR7cmVzdWx0LnNjYWxhYmlsaXR5U2NvcmUudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgY29uc29sZS5sb2coYPCflJIg5L+h6aC85oCn44K544Kz44KiOiAke3Jlc3VsdC5yZWxpYWJpbGl0eVNjb3JlLnRvRml4ZWQoMSl9LzEwMGApO1xuICAgIGNvbnNvbGUubG9nKGDwn4yNIOOCsOODreODvOODkOODq+ODkeODleOCqeODvOODnuODs+OCuTogJHtyZXN1bHQuZ2xvYmFsUGVyZm9ybWFuY2VTY29yZS50b0ZpeGVkKDEpfS8xMDBgKTtcblxuICAgIGNvbnNvbGUubG9nKCdcXG7wn5OIIOODkeODleOCqeODvOODnuODs+OCueOCteODnuODquODvDonKTtcbiAgICBjb25zb2xlLmxvZyhgICDnt4/jg4bjgrnjg4jmlbA6ICR7cmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS50b3RhbFRlc3RzfWApO1xuICAgIGNvbnNvbGUubG9nKGAgIOWQiOagvDogJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBhc3NlZFRlc3RzfWApO1xuICAgIGNvbnNvbGUubG9nKGAgIOS4jeWQiOagvDogJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LmZhaWxlZFRlc3RzfWApO1xuICAgIGNvbnNvbGUubG9nKGAgIOW5s+Wdh+W/nOetlOaZgumWkzogJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LmF2ZXJhZ2VSZXNwb25zZVRpbWUudG9GaXhlZCgwKX1tc2ApO1xuICAgIGNvbnNvbGUubG9nKGAgIOacgOWkp+OCueODq+ODvOODl+ODg+ODiDogJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBlYWtUaHJvdWdocHV0LnRvRml4ZWQoMSl9IHJlcS9zZWNgKTtcbiAgICBjb25zb2xlLmxvZyhgICDjgrfjgrnjg4bjg6DnqLzlg43njoc6ICR7cmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5zeXN0ZW1VcHRpbWUudG9GaXhlZCgzKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAg5pyA5aSn44K144Od44O844OI44Om44O844K244O85pWwOiAke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkubWF4U3VwcG9ydGVkVXNlcnN95Lq6YCk7XG5cbiAgICBpZiAocmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5jcml0aWNhbElzc3VlcyA+IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKGAgIPCflLQg6YeN6KaB44Gq5ZWP6aGMOiAke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkuY3JpdGljYWxJc3N1ZXN95Lu2YCk7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkucGVyZm9ybWFuY2VCb3R0bGVuZWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu4pqg77iPICDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg5zjg4jjg6vjg43jg4Pjgq86Jyk7XG4gICAgICByZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBlcmZvcm1hbmNlQm90dGxlbmVja3MuZm9yRWFjaCgoYm90dGxlbmVjaywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgJHtpbmRleCArIDF9LiAke2JvdHRsZW5lY2t9YCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5zY2FsYWJpbGl0eUxpbWl0YXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7wn5OKIOOCueOCseODvOODqeODk+ODquODhuOCo+WItumZkDonKTtcbiAgICAgIHJlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkuc2NhbGFiaWxpdHlMaW1pdGF0aW9ucy5mb3JFYWNoKChsaW1pdGF0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAke2luZGV4ICsgMX0uICR7bGltaXRhdGlvbn1gKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdcXG7wn5KhIOaOqOWlqOS6i+mghTonKTtcbiAgICByZXN1bHQucmVjb21tZW5kYXRpb25zLmZvckVhY2goKHJlYywgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICR7aW5kZXggKyAxfS4gJHtyZWN9YCk7XG4gICAgfSk7XG5cbiAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7wn46JIOODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiDog5ZCI5qC8Jyk7XG4gICAgICBjb25zb2xlLmxvZygnICAg44GZ44G544Gm44Gu44OR44OV44Kp44O844Oe44Oz44K56KaB5Lu244KS5rqA44Gf44GX44Gm44GE44G+44GZJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7inYwg44OR44OV44Kp44O844Oe44Oz44K557Wx5ZCI44OG44K544OIOiDkuI3lkIjmoLwnKTtcbiAgICAgIGNvbnNvbGUubG9nKCcgICDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjga7mlLnlloTjgYzlv4XopoHjgafjgZknKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnPScgLnJlcGVhdCg2MCkpO1xuICB9XG59XG5cbi8qKlxuICog44OH44OV44Kp44Or44OI6Kit5a6a44Gn44Gu44OR44OV44Kp44O844Oe44Oz44K557Wx5ZCI44OG44K544OI5a6f6KGMXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5QZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdChcbiAgYmFzZVVybDogc3RyaW5nID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXG4gIHRlc3RFbnZpcm9ubWVudDogJ2RldmVsb3BtZW50JyB8ICdzdGFnaW5nJyB8ICdwcm9kdWN0aW9uJyA9ICdkZXZlbG9wbWVudCdcbik6IFByb21pc2U8UGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+IHtcbiAgY29uc3QgY29uZmlnOiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdENvbmZpZyA9IHtcbiAgICBiYXNlVXJsLFxuICAgIGVuYWJsZWRUZXN0czoge1xuICAgICAgcmVzcG9uc2VUaW1lOiB0cnVlLFxuICAgICAgY29uY3VycmVudExvYWQ6IHRydWUsXG4gICAgICB1cHRpbWVNb25pdG9yaW5nOiB0cnVlLFxuICAgICAgbXVsdGlSZWdpb25TY2FsYWJpbGl0eTogdGVzdEVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbidcbiAgICB9LFxuICAgIHRlc3RFbnZpcm9ubWVudCxcbiAgICBwZXJmb3JtYW5jZVRhcmdldHM6IHtcbiAgICAgIG1heFJlc3BvbnNlVGltZTogMjAwMCxcbiAgICAgIG1pblRocm91Z2hwdXQ6IDUwLFxuICAgICAgbWluVXB0aW1lOiA5OS45LFxuICAgICAgbWF4Q29uY3VycmVudFVzZXJzOiAxMDBcbiAgICB9LFxuICAgIHRlc3REdXJhdGlvbjoge1xuICAgICAgcmVzcG9uc2VUaW1lOiAzMDAsXG4gICAgICBsb2FkVGVzdDogNjAwLFxuICAgICAgdXB0aW1lTW9uaXRvcmluZzogMTgwMCxcbiAgICAgIHNjYWxhYmlsaXR5VGVzdDogOTAwXG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHJ1bm5lciA9IG5ldyBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJ1bm5lcihjb25maWcpO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBydW5uZXIucnVuVGVzdHMoKTtcbiAgXG4gIC8vIOe1kOaenOOBruODreOCsOWHuuWKm1xuICBydW5uZXJbJ2xvZ1Rlc3RSZXN1bHRzJ10ocmVzdWx0KTtcbiAgXG4gIHJldHVybiByZXN1bHQ7XG59Il19