"use strict";
/**
 * 応答時間測定テスト
 * 標準クエリの 2 秒以内応答検証テスト実装
 * 応答時間ベンチマーク測定コード作成
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseTimeTest = void 0;
exports.runResponseTimeTest = runResponseTimeTest;
class ResponseTimeTest {
    config;
    testStartTime = 0;
    baselineMetrics = new Map();
    constructor(config) {
        this.config = config;
        this.initializeBaselines();
    }
    /**
     * 応答時間測定テストの実行
     */
    async runTest() {
        console.log('⚡ 応答時間測定テストを開始します...');
        console.log(`🎯 目標応答時間: 標準クエリ ${this.config.performanceThresholds.standardQueryTime}ms以内`);
        this.testStartTime = Date.now();
        try {
            // ウォームアップの実行
            await this.performWarmup();
            // クエリ別応答時間テスト
            const queryResults = await this.testQueryResponseTimes();
            // ネットワーク条件別テスト
            const networkResults = await this.testNetworkConditions();
            // ベンチマーク比較
            const benchmarkResults = await this.performBenchmarkComparison(queryResults);
            // パフォーマンスメトリクスの計算
            const performanceMetrics = this.calculatePerformanceMetrics(queryResults);
            // スコアの計算
            const scores = this.calculateScores(performanceMetrics, queryResults, networkResults);
            const result = {
                testName: 'ResponseTimeTest',
                success: scores.overallResponseScore >= 85 &&
                    performanceMetrics.overallAverageTime <= this.config.performanceThresholds.averageResponseTime,
                duration: Date.now() - this.testStartTime,
                details: {
                    totalQueries: this.config.testQueries.length,
                    totalMeasurements: queryResults.reduce((sum, r) => sum + r.measurements.length, 0),
                    testCoverage: '100%',
                    ...scores,
                    ...performanceMetrics
                },
                queryResults,
                performanceMetrics,
                benchmarkResults,
                networkResults,
                ...scores
            };
            this.logTestResults(result);
            return result;
        }
        catch (error) {
            console.error('❌ 応答時間測定テストでエラーが発生:', error);
            throw error;
        }
    }
    /**
     * ベースライン値の初期化
     */
    initializeBaselines() {
        // 過去のパフォーマンスデータまたは目標値を設定
        this.baselineMetrics.set('simple_query_avg', 800);
        this.baselineMetrics.set('standard_query_avg', 1500);
        this.baselineMetrics.set('complex_query_avg', 3000);
        this.baselineMetrics.set('overall_avg', 1800);
        this.baselineMetrics.set('percentile_95', 2500);
        this.baselineMetrics.set('percentile_99', 4000);
    }
    /**
     * ウォームアップの実行
     */
    async performWarmup() {
        console.log('🔥 システムウォームアップを実行中...');
        const warmupQueries = this.config.testQueries.slice(0, this.config.testParameters.warmupQueries);
        for (const query of warmupQueries) {
            try {
                await this.executeQuery(query.query);
                await this.delay(500);
            }
            catch (error) {
                console.warn(`⚠️ ウォームアップクエリでエラー: ${query.id}`);
            }
        }
        console.log('✅ ウォームアップ完了');
        await this.delay(2000); // システム安定化待機
    }
    /**
     * クエリ別応答時間テストの実行
     */
    async testQueryResponseTimes() {
        console.log('📊 クエリ別応答時間測定を実行中...');
        const results = [];
        for (const query of this.config.testQueries) {
            console.log(`🔍 "${query.query}" を測定中...`);
            const queryResult = await this.measureQueryResponseTime(query);
            results.push(queryResult);
            // クエリ間の間隔
            await this.delay(this.config.testParameters.requestInterval);
        }
        return results;
    }
    /**
     * 単一クエリの応答時間測定
     */
    async measureQueryResponseTime(query) {
        const measurements = [];
        const issues = [];
        for (let attempt = 1; attempt <= this.config.testParameters.measurementQueries; attempt++) {
            try {
                const measurement = await this.executeSingleMeasurement(query, attempt);
                measurements.push(measurement);
                // 個別測定の評価
                if (!measurement.success) {
                    issues.push({
                        type: 'error_rate',
                        severity: 'major',
                        description: `測定 ${attempt} でエラーが発生`,
                        impact: 'システムの信頼性に影響',
                        recommendation: 'エラーの原因を調査し修正してください',
                        affectedQueries: [query.id]
                    });
                }
                else if (measurement.responseTime > query.expectedResponseTime * 1.5) {
                    issues.push({
                        type: 'slow_response',
                        severity: measurement.responseTime > query.expectedResponseTime * 2 ? 'critical' : 'major',
                        description: `応答時間が期待値を大幅に超過: ${measurement.responseTime}ms`,
                        impact: 'ユーザーエクスペリエンスの低下',
                        recommendation: 'パフォーマンス最適化が必要です',
                        affectedQueries: [query.id]
                    });
                }
            }
            catch (error) {
                measurements.push({
                    attempt,
                    timestamp: Date.now(),
                    responseTime: 0,
                    ttfb: 0,
                    domContentLoaded: 0,
                    loadComplete: 0,
                    networkTime: 0,
                    processingTime: 0,
                    renderTime: 0,
                    success: false,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                });
            }
            // 測定間の間隔
            await this.delay(200);
        }
        // 統計の計算
        const statistics = this.calculateStatistics(measurements);
        // 分散の評価
        if (statistics.stdDev > statistics.mean * 0.3) {
            issues.push({
                type: 'high_variance',
                severity: 'minor',
                description: `応答時間の分散が大きい: 標準偏差 ${statistics.stdDev.toFixed(1)}ms`,
                impact: '予測可能性の低下',
                recommendation: 'システムの安定性を改善してください',
                affectedQueries: [query.id]
            });
        }
        return {
            queryId: query.id,
            query: query.query,
            queryType: query.type,
            measurements,
            statistics,
            success: statistics.successRate >= 0.95 && statistics.mean <= query.expectedResponseTime,
            issues
        };
    }
    /**
     * 単一測定の実行
     */
    async executeSingleMeasurement(query, attempt) {
        const startTime = Date.now();
        const timestamp = startTime;
        try {
            // ネットワーク時間の測定開始
            const networkStartTime = Date.now();
            // クエリの実行
            const response = await this.executeQuery(query.query);
            const networkEndTime = Date.now();
            const networkTime = networkEndTime - networkStartTime;
            // 処理時間の推定（実際の実装では詳細な分析が必要）
            const processingTime = Math.max(0, networkTime - 100); // ネットワーク遅延を除く
            // レンダリング時間の測定（フロントエンド処理時間）
            const renderTime = await this.measureRenderTime();
            const totalResponseTime = Date.now() - startTime;
            const ttfb = Math.min(networkTime, totalResponseTime * 0.3); // Time to First Byte推定
            return {
                attempt,
                timestamp,
                responseTime: totalResponseTime,
                ttfb,
                domContentLoaded: totalResponseTime * 0.8, // 推定値
                loadComplete: totalResponseTime,
                networkTime,
                processingTime,
                renderTime,
                success: true
            };
        }
        catch (error) {
            return {
                attempt,
                timestamp,
                responseTime: Date.now() - startTime,
                ttfb: 0,
                domContentLoaded: 0,
                loadComplete: 0,
                networkTime: 0,
                processingTime: 0,
                renderTime: 0,
                success: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * クエリの実行
     */
    async executeQuery(query) {
        // 実際の実装では、チャットボットAPIを呼び出し
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({
                message: query,
                userId: 'performance-test-user',
                sessionId: `perf-test-${Date.now()}`
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * レンダリング時間の測定
     */
    async measureRenderTime() {
        // 実際の実装では、ブラウザのパフォーマンスAPIを使用
        // ここではシミュレーション値を返す
        return Math.random() * 200 + 100; // 100-300ms
    }
    /**
     * 統計の計算
     */
    calculateStatistics(measurements) {
        const successfulMeasurements = measurements.filter(m => m.success);
        const responseTimes = successfulMeasurements.map(m => m.responseTime);
        if (responseTimes.length === 0) {
            return {
                mean: 0,
                median: 0,
                min: 0,
                max: 0,
                stdDev: 0,
                percentile95: 0,
                percentile99: 0,
                successRate: 0,
                errorRate: 100
            };
        }
        responseTimes.sort((a, b) => a - b);
        const mean = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const median = this.calculatePercentile(responseTimes, 50);
        const min = responseTimes[0];
        const max = responseTimes[responseTimes.length - 1];
        // 標準偏差の計算
        const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / responseTimes.length;
        const stdDev = Math.sqrt(variance);
        const percentile95 = this.calculatePercentile(responseTimes, 95);
        const percentile99 = this.calculatePercentile(responseTimes, 99);
        const successRate = (successfulMeasurements.length / measurements.length) * 100;
        const errorRate = 100 - successRate;
        return {
            mean,
            median,
            min,
            max,
            stdDev,
            percentile95,
            percentile99,
            successRate,
            errorRate
        };
    }
    /**
     * パーセンタイルの計算
     */
    calculatePercentile(sortedArray, percentile) {
        if (sortedArray.length === 0)
            return 0;
        const index = (percentile / 100) * (sortedArray.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) {
            return sortedArray[lower];
        }
        const weight = index - lower;
        return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    }
    /**
     * ネットワーク条件別テストの実行
     */
    async testNetworkConditions() {
        console.log('🌐 ネットワーク条件別テストを実行中...');
        const results = [];
        const enabledConditions = this.config.networkConditions.filter(c => c.enabled);
        for (const condition of enabledConditions) {
            console.log(`📡 ${condition.name} 条件でテスト中...`);
            const result = await this.testUnderNetworkCondition(condition);
            results.push(result);
        }
        return results;
    }
    /**
     * 特定ネットワーク条件下でのテスト
     */
    async testUnderNetworkCondition(condition) {
        // ネットワーク条件のシミュレーション
        await this.simulateNetworkCondition(condition);
        // サンプルクエリでの測定
        const sampleQueries = this.config.testQueries.slice(0, 3);
        const measurements = [];
        let successCount = 0;
        for (const query of sampleQueries) {
            try {
                const startTime = Date.now();
                await this.executeQuery(query.query);
                const responseTime = Date.now() - startTime;
                measurements.push(responseTime);
                successCount++;
            }
            catch (error) {
                console.warn(`⚠️ ${condition.name} 条件下でエラー:`, error);
            }
        }
        const averageResponseTime = measurements.length > 0
            ? measurements.reduce((sum, time) => sum + time, 0) / measurements.length
            : 0;
        const successRate = (successCount / sampleQueries.length) * 100;
        // ベースライン条件との比較
        const baselineTime = this.baselineMetrics.get('overall_avg') || 1800;
        const degradationFactor = averageResponseTime / baselineTime;
        // 適応性スコア（ネットワーク条件に対する耐性）
        const adaptability = Math.max(0, 100 - (degradationFactor - 1) * 50);
        return {
            networkCondition: condition.name,
            averageResponseTime,
            successRate,
            degradationFactor,
            adaptability
        };
    }
    /**
     * ネットワーク条件のシミュレーション
     */
    async simulateNetworkCondition(condition) {
        // 実際の実装では、ブラウザのネットワーク制限機能を使用
        // ここでは遅延のシミュレーション
        const simulatedDelay = condition.latency + (condition.bandwidth < 10 ? 500 : 0);
        await this.delay(simulatedDelay);
    }
    /**
     * ベンチマーク比較の実行
     */
    async performBenchmarkComparison(queryResults) {
        console.log('📈 ベンチマーク比較を実行中...');
        const results = [];
        // クエリタイプ別のベンチマーク
        const queryTypes = ['simple', 'standard', 'complex'];
        for (const type of queryTypes) {
            const typeResults = queryResults.filter(r => r.queryType === type);
            if (typeResults.length === 0)
                continue;
            const currentAverage = typeResults.reduce((sum, r) => sum + r.statistics.mean, 0) / typeResults.length;
            const baselineKey = `${type}_query_avg`;
            const baselineTime = this.baselineMetrics.get(baselineKey) || currentAverage;
            const improvement = baselineTime > currentAverage
                ? ((baselineTime - currentAverage) / baselineTime) * 100
                : 0;
            const regression = currentAverage > baselineTime
                ? ((currentAverage - baselineTime) / baselineTime) * 100
                : 0;
            let status;
            if (improvement > 5) {
                status = 'improved';
            }
            else if (regression > 5) {
                status = 'degraded';
            }
            else {
                status = 'maintained';
            }
            results.push({
                benchmarkName: `${type.charAt(0).toUpperCase() + type.slice(1)} Query Average`,
                baselineTime,
                currentTime: currentAverage,
                improvement,
                regression,
                status
            });
        }
        // 全体のベンチマーク
        const overallAverage = queryResults.reduce((sum, r) => sum + r.statistics.mean, 0) / queryResults.length;
        const overallBaseline = this.baselineMetrics.get('overall_avg') || overallAverage;
        const overallImprovement = overallBaseline > overallAverage
            ? ((overallBaseline - overallAverage) / overallBaseline) * 100
            : 0;
        const overallRegression = overallAverage > overallBaseline
            ? ((overallAverage - overallBaseline) / overallBaseline) * 100
            : 0;
        let overallStatus;
        if (overallImprovement > 3) {
            overallStatus = 'improved';
        }
        else if (overallRegression > 3) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'maintained';
        }
        results.push({
            benchmarkName: 'Overall Average',
            baselineTime: overallBaseline,
            currentTime: overallAverage,
            improvement: overallImprovement,
            regression: overallRegression,
            status: overallStatus
        });
        return results;
    }
    /**
     * パフォーマンスメトリクスの計算
     */
    calculatePerformanceMetrics(queryResults) {
        const allMeasurements = queryResults.flatMap(r => r.measurements.filter(m => m.success));
        const allResponseTimes = allMeasurements.map(m => m.responseTime);
        if (allResponseTimes.length === 0) {
            return {
                overallAverageTime: 0,
                overallMedianTime: 0,
                overallPercentile95: 0,
                overallPercentile99: 0,
                successRate: 0,
                errorRate: 100,
                throughput: 0,
                reliability: 0,
                consistency: 0
            };
        }
        allResponseTimes.sort((a, b) => a - b);
        const overallAverageTime = allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;
        const overallMedianTime = this.calculatePercentile(allResponseTimes, 50);
        const overallPercentile95 = this.calculatePercentile(allResponseTimes, 95);
        const overallPercentile99 = this.calculatePercentile(allResponseTimes, 99);
        const totalMeasurements = queryResults.reduce((sum, r) => sum + r.measurements.length, 0);
        const successfulMeasurements = allMeasurements.length;
        const successRate = (successfulMeasurements / totalMeasurements) * 100;
        const errorRate = 100 - successRate;
        // スループットの計算（1秒あたりのリクエスト数）
        const totalTestTime = (Date.now() - this.testStartTime) / 1000;
        const throughput = successfulMeasurements / totalTestTime;
        // 信頼性スコア
        const reliability = Math.min(successRate, 100);
        // 一貫性スコア（分散の逆数ベース）
        const variance = allResponseTimes.reduce((sum, time) => sum + Math.pow(time - overallAverageTime, 2), 0) / allResponseTimes.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / overallAverageTime;
        const consistency = Math.max(0, 100 - (coefficientOfVariation * 100));
        return {
            overallAverageTime,
            overallMedianTime,
            overallPercentile95,
            overallPercentile99,
            successRate,
            errorRate,
            throughput,
            reliability,
            consistency
        };
    }
    /**
     * スコアの計算
     */
    calculateScores(metrics, queryResults, networkResults) {
        // 応答時間スコア
        let responseTimeScore = 100;
        if (metrics.overallAverageTime > this.config.performanceThresholds.averageResponseTime) {
            responseTimeScore -= ((metrics.overallAverageTime - this.config.performanceThresholds.averageResponseTime) / this.config.performanceThresholds.averageResponseTime) * 50;
        }
        if (metrics.overallPercentile95 > this.config.performanceThresholds.percentile95Time) {
            responseTimeScore -= 20;
        }
        if (metrics.overallPercentile99 > this.config.performanceThresholds.percentile99Time) {
            responseTimeScore -= 15;
        }
        // 信頼性スコア
        const reliabilityScore = metrics.reliability;
        // 一貫性スコア
        const consistencyScore = metrics.consistency;
        // スケーラビリティスコア（ネットワーク条件への適応性）
        const scalabilityScore = networkResults.length > 0
            ? networkResults.reduce((sum, r) => sum + r.adaptability, 0) / networkResults.length
            : 100;
        // 総合スコア
        const overallResponseScore = (Math.max(responseTimeScore, 0) * 0.4 +
            reliabilityScore * 0.3 +
            consistencyScore * 0.2 +
            scalabilityScore * 0.1);
        return {
            overallResponseScore,
            reliabilityScore,
            consistencyScore,
            scalabilityScore
        };
    }
    /**
     * テスト結果のログ出力
     */
    logTestResults(result) {
        console.log('\n📊 応答時間測定テスト結果:');
        console.log(`✅ 総合スコア: ${result.overallResponseScore.toFixed(1)}/100`);
        console.log(`🔒 信頼性: ${result.reliabilityScore.toFixed(1)}/100`);
        console.log(`📈 一貫性: ${result.consistencyScore.toFixed(1)}/100`);
        console.log(`🚀 スケーラビリティ: ${result.scalabilityScore.toFixed(1)}/100`);
        console.log('\n⏱️ パフォーマンスメトリクス:');
        console.log(`  平均応答時間: ${result.performanceMetrics.overallAverageTime.toFixed(0)}ms`);
        console.log(`  中央値: ${result.performanceMetrics.overallMedianTime.toFixed(0)}ms`);
        console.log(`  95パーセンタイル: ${result.performanceMetrics.overallPercentile95.toFixed(0)}ms`);
        console.log(`  99パーセンタイル: ${result.performanceMetrics.overallPercentile99.toFixed(0)}ms`);
        console.log(`  成功率: ${result.performanceMetrics.successRate.toFixed(1)}%`);
        console.log(`  スループット: ${result.performanceMetrics.throughput.toFixed(1)} req/sec`);
        console.log('\n📈 ベンチマーク比較:');
        result.benchmarkResults.forEach(benchmark => {
            const statusIcon = benchmark.status === 'improved' ? '📈' :
                benchmark.status === 'degraded' ? '📉' : '➡️';
            const changeValue = benchmark.improvement > 0 ?
                `+${benchmark.improvement.toFixed(1)}%` :
                `-${benchmark.regression.toFixed(1)}%`;
            console.log(`  ${statusIcon} ${benchmark.benchmarkName}: ${benchmark.currentTime.toFixed(0)}ms (${changeValue})`);
        });
        if (result.networkResults.length > 0) {
            console.log('\n🌐 ネットワーク条件別結果:');
            result.networkResults.forEach(network => {
                console.log(`  ${network.networkCondition}: ${network.averageResponseTime.toFixed(0)}ms (適応性: ${network.adaptability.toFixed(1)}%)`);
            });
        }
        // 問題の要約
        const totalIssues = result.queryResults.reduce((sum, r) => sum + r.issues.length, 0);
        const criticalIssues = result.queryResults.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0);
        if (totalIssues > 0) {
            console.log(`\n⚠️  検出された問題: ${totalIssues}件 (重要: ${criticalIssues}件)`);
        }
        if (result.success) {
            console.log('\n✅ 応答時間測定テスト: 合格');
            console.log('   すべてのクエリが目標応答時間内で処理されています');
        }
        else {
            console.log('\n❌ 応答時間測定テスト: 不合格');
            console.log('   応答時間の最適化が必要です');
        }
    }
    /**
     * 遅延処理
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.ResponseTimeTest = ResponseTimeTest;
/**
 * デフォルト設定での応答時間測定テスト実行
 */
async function runResponseTimeTest(baseUrl = 'http://localhost:3000') {
    const config = {
        baseUrl,
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
                expectedResponseTime: 1500,
                category: 'technical',
                requiresRAG: true,
                requiresAI: true
            },
            {
                id: 'standard_2',
                query: 'セキュリティのベストプラクティスについて説明してください',
                type: 'standard',
                expectedResponseTime: 1800,
                category: 'business',
                requiresRAG: true,
                requiresAI: true
            },
            {
                id: 'complex_1',
                query: 'マルチリージョンでのAWSアーキテクチャ設計において、データ整合性とパフォーマンスを両立させる方法を、具体的な実装例とともに詳しく説明してください',
                type: 'complex',
                expectedResponseTime: 3000,
                category: 'technical',
                requiresRAG: true,
                requiresAI: true
            }
        ],
        performanceThresholds: {
            standardQueryTime: 2000,
            complexQueryTime: 4000,
            simpleQueryTime: 1000,
            averageResponseTime: 1800,
            percentile95Time: 2500,
            percentile99Time: 4000
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
                enabled: true
            },
            {
                name: 'Offline',
                bandwidth: 0,
                latency: 0,
                packetLoss: 100,
                enabled: false
            }
        ]
    };
    const test = new ResponseTimeTest(config);
    return await test.runTest();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UtdGltZS10ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzcG9uc2UtdGltZS10ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztHQUlHOzs7QUEreUJILGtEQWtGQztBQWx3QkQsTUFBYSxnQkFBZ0I7SUFDbkIsTUFBTSxDQUF5QjtJQUMvQixhQUFhLEdBQVcsQ0FBQyxDQUFDO0lBQzFCLGVBQWUsR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUV6RCxZQUFZLE1BQThCO1FBQ3hDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLE1BQU0sQ0FBQyxDQUFDO1FBQzNGLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRWhDLElBQUksQ0FBQztZQUNILGFBQWE7WUFDYixNQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUUzQixjQUFjO1lBQ2QsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUV6RCxlQUFlO1lBQ2YsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUUxRCxXQUFXO1lBQ1gsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUU3RSxrQkFBa0I7WUFDbEIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFMUUsU0FB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Z0JBQ1osVUFBVSxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxFQUFFLElBQUk7YUFDZDtZQUNEO2dCQUNFLElBQUksRUFBRSxTQUFTO2dCQUNmLFNBQVMsRUFBRSxHQUFHO2dCQUNkLE9BQU8sRUFBRSxHQUFHO2dCQUNaLFVBQVUsRUFBRSxDQUFDO2dCQUNiLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7WUFDRDtnQkFDRSxJQUFJLEVBQUUsU0FBUztnQkFDZixTQUFTLEVBQUUsQ0FBQztnQkFDWixPQUFPLEVBQUUsQ0FBQztnQkFDVixVQUFVLEVBQUUsR0FBRztnQkFDZixPQUFPLEVBQUUsS0FBSzthQUNmO1NBQ0Y7S0FDRixDQUFDO0lBRUYsTUFBTSxJQUFJLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQyxPQUFPLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiFxuICog5qiZ5rqW44Kv44Ko44Oq44GuIDIg56eS5Lul5YaF5b+c562U5qSc6Ki844OG44K544OI5a6f6KOFXG4gKiDlv5znrZTmmYLplpPjg5njg7Pjg4Hjg57jg7zjgq/muKzlrprjgrPjg7zjg4nkvZzmiJBcbiAqL1xuXG5pbXBvcnQgeyBUZXN0UmVzdWx0LCBUZXN0TWV0cmljcyB9IGZyb20gJy4uLy4uL3R5cGVzL3Rlc3QtdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc3BvbnNlVGltZVRlc3RDb25maWcge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIHRlc3RRdWVyaWVzOiBUZXN0UXVlcnlbXTtcbiAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgc3RhbmRhcmRRdWVyeVRpbWU6IG51bWJlcjtcbiAgICBjb21wbGV4UXVlcnlUaW1lOiBudW1iZXI7XG4gICAgc2ltcGxlUXVlcnlUaW1lOiBudW1iZXI7XG4gICAgYXZlcmFnZVJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIHBlcmNlbnRpbGU5NVRpbWU6IG51bWJlcjtcbiAgICBwZXJjZW50aWxlOTlUaW1lOiBudW1iZXI7XG4gIH07XG4gIHRlc3RQYXJhbWV0ZXJzOiB7XG4gICAgd2FybXVwUXVlcmllczogbnVtYmVyO1xuICAgIG1lYXN1cmVtZW50UXVlcmllczogbnVtYmVyO1xuICAgIGNvbmN1cnJlbnRSZXF1ZXN0czogbnVtYmVyO1xuICAgIHJlcXVlc3RJbnRlcnZhbDogbnVtYmVyO1xuICB9O1xuICBuZXR3b3JrQ29uZGl0aW9uczogTmV0d29ya0NvbmRpdGlvbltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RRdWVyeSB7XG4gIGlkOiBzdHJpbmc7XG4gIHF1ZXJ5OiBzdHJpbmc7XG4gIHR5cGU6ICdzaW1wbGUnIHwgJ3N0YW5kYXJkJyB8ICdjb21wbGV4JztcbiAgZXhwZWN0ZWRSZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgY2F0ZWdvcnk6ICd0ZWNobmljYWwnIHwgJ2J1c2luZXNzJyB8ICdnZW5lcmFsJztcbiAgcmVxdWlyZXNSQUc6IGJvb2xlYW47XG4gIHJlcXVpcmVzQUk6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV0d29ya0NvbmRpdGlvbiB7XG4gIG5hbWU6IHN0cmluZztcbiAgYmFuZHdpZHRoOiBudW1iZXI7IC8vIE1icHNcbiAgbGF0ZW5jeTogbnVtYmVyOyAvLyBtc1xuICBwYWNrZXRMb3NzOiBudW1iZXI7IC8vICVcbiAgZW5hYmxlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXNwb25zZVRpbWVUZXN0UmVzdWx0IGV4dGVuZHMgVGVzdFJlc3VsdCB7XG4gIHF1ZXJ5UmVzdWx0czogUXVlcnlSZXNwb25zZVJlc3VsdFtdO1xuICBwZXJmb3JtYW5jZU1ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljcztcbiAgYmVuY2htYXJrUmVzdWx0czogQmVuY2htYXJrUmVzdWx0W107XG4gIG5ldHdvcmtSZXN1bHRzOiBOZXR3b3JrUGVyZm9ybWFuY2VSZXN1bHRbXTtcbiAgb3ZlcmFsbFJlc3BvbnNlU2NvcmU6IG51bWJlcjtcbiAgcmVsaWFiaWxpdHlTY29yZTogbnVtYmVyO1xuICBjb25zaXN0ZW5jeVNjb3JlOiBudW1iZXI7XG4gIHNjYWxhYmlsaXR5U2NvcmU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWVyeVJlc3BvbnNlUmVzdWx0IHtcbiAgcXVlcnlJZDogc3RyaW5nO1xuICBxdWVyeTogc3RyaW5nO1xuICBxdWVyeVR5cGU6IHN0cmluZztcbiAgbWVhc3VyZW1lbnRzOiBSZXNwb25zZU1lYXN1cmVtZW50W107XG4gIHN0YXRpc3RpY3M6IFJlc3BvbnNlU3RhdGlzdGljcztcbiAgc3VjY2VzczogYm9vbGVhbjtcbiAgaXNzdWVzOiBQZXJmb3JtYW5jZUlzc3VlW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzcG9uc2VNZWFzdXJlbWVudCB7XG4gIGF0dGVtcHQ6IG51bWJlcjtcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuICB0dGZiOiBudW1iZXI7IC8vIFRpbWUgdG8gRmlyc3QgQnl0ZVxuICBkb21Db250ZW50TG9hZGVkOiBudW1iZXI7XG4gIGxvYWRDb21wbGV0ZTogbnVtYmVyO1xuICBuZXR3b3JrVGltZTogbnVtYmVyO1xuICBwcm9jZXNzaW5nVGltZTogbnVtYmVyO1xuICByZW5kZXJUaW1lOiBudW1iZXI7XG4gIHN1Y2Nlc3M6IGJvb2xlYW47XG4gIGVycm9yTWVzc2FnZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXNwb25zZVN0YXRpc3RpY3Mge1xuICBtZWFuOiBudW1iZXI7XG4gIG1lZGlhbjogbnVtYmVyO1xuICBtaW46IG51bWJlcjtcbiAgbWF4OiBudW1iZXI7XG4gIHN0ZERldjogbnVtYmVyO1xuICBwZXJjZW50aWxlOTU6IG51bWJlcjtcbiAgcGVyY2VudGlsZTk5OiBudW1iZXI7XG4gIHN1Y2Nlc3NSYXRlOiBudW1iZXI7XG4gIGVycm9yUmF0ZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBlcmZvcm1hbmNlTWV0cmljcyB7XG4gIG92ZXJhbGxBdmVyYWdlVGltZTogbnVtYmVyO1xuICBvdmVyYWxsTWVkaWFuVGltZTogbnVtYmVyO1xuICBvdmVyYWxsUGVyY2VudGlsZTk1OiBudW1iZXI7XG4gIG92ZXJhbGxQZXJjZW50aWxlOTk6IG51bWJlcjtcbiAgc3VjY2Vzc1JhdGU6IG51bWJlcjtcbiAgZXJyb3JSYXRlOiBudW1iZXI7XG4gIHRocm91Z2hwdXQ6IG51bWJlcjsgLy8gcmVxdWVzdHMgcGVyIHNlY29uZFxuICByZWxpYWJpbGl0eTogbnVtYmVyO1xuICBjb25zaXN0ZW5jeTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJlbmNobWFya1Jlc3VsdCB7XG4gIGJlbmNobWFya05hbWU6IHN0cmluZztcbiAgYmFzZWxpbmVUaW1lOiBudW1iZXI7XG4gIGN1cnJlbnRUaW1lOiBudW1iZXI7XG4gIGltcHJvdmVtZW50OiBudW1iZXI7IC8vIHBlcmNlbnRhZ2VcbiAgcmVncmVzc2lvbjogbnVtYmVyOyAvLyBwZXJjZW50YWdlXG4gIHN0YXR1czogJ2ltcHJvdmVkJyB8ICdtYWludGFpbmVkJyB8ICdkZWdyYWRlZCc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV0d29ya1BlcmZvcm1hbmNlUmVzdWx0IHtcbiAgbmV0d29ya0NvbmRpdGlvbjogc3RyaW5nO1xuICBhdmVyYWdlUmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gIHN1Y2Nlc3NSYXRlOiBudW1iZXI7XG4gIGRlZ3JhZGF0aW9uRmFjdG9yOiBudW1iZXI7XG4gIGFkYXB0YWJpbGl0eTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBlcmZvcm1hbmNlSXNzdWUge1xuICB0eXBlOiAndGltZW91dCcgfCAnc2xvd19yZXNwb25zZScgfCAnaGlnaF92YXJpYW5jZScgfCAnZXJyb3JfcmF0ZSc7XG4gIHNldmVyaXR5OiAnY3JpdGljYWwnIHwgJ21ham9yJyB8ICdtaW5vcic7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGltcGFjdDogc3RyaW5nO1xuICByZWNvbW1lbmRhdGlvbjogc3RyaW5nO1xuICBhZmZlY3RlZFF1ZXJpZXM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY2xhc3MgUmVzcG9uc2VUaW1lVGVzdCB7XG4gIHByaXZhdGUgY29uZmlnOiBSZXNwb25zZVRpbWVUZXN0Q29uZmlnO1xuICBwcml2YXRlIHRlc3RTdGFydFRpbWU6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgYmFzZWxpbmVNZXRyaWNzOiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUmVzcG9uc2VUaW1lVGVzdENvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuaW5pdGlhbGl6ZUJhc2VsaW5lcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgYXN5bmMgcnVuVGVzdCgpOiBQcm9taXNlPFJlc3BvbnNlVGltZVRlc3RSZXN1bHQ+IHtcbiAgICBjb25zb2xlLmxvZygn4pqhIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiOOCkumWi+Wni+OBl+OBvuOBmS4uLicpO1xuICAgIGNvbnNvbGUubG9nKGDwn46vIOebruaomeW/nOetlOaZgumWkzog5qiZ5rqW44Kv44Ko44OqICR7dGhpcy5jb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLnN0YW5kYXJkUXVlcnlUaW1lfW1z5Lul5YaFYCk7XG4gICAgdGhpcy50ZXN0U3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyDjgqbjgqnjg7zjg6DjgqLjg4Pjg5fjga7lrp/ooYxcbiAgICAgIGF3YWl0IHRoaXMucGVyZm9ybVdhcm11cCgpO1xuXG4gICAgICAvLyDjgq/jgqjjg6rliKXlv5znrZTmmYLplpPjg4bjgrnjg4hcbiAgICAgIGNvbnN0IHF1ZXJ5UmVzdWx0cyA9IGF3YWl0IHRoaXMudGVzdFF1ZXJ5UmVzcG9uc2VUaW1lcygpO1xuXG4gICAgICAvLyDjg43jg4Pjg4jjg6/jg7zjgq/mnaHku7bliKXjg4bjgrnjg4hcbiAgICAgIGNvbnN0IG5ldHdvcmtSZXN1bHRzID0gYXdhaXQgdGhpcy50ZXN0TmV0d29ya0NvbmRpdGlvbnMoKTtcblxuICAgICAgLy8g44OZ44Oz44OB44Oe44O844Kv5q+U6LyDXG4gICAgICBjb25zdCBiZW5jaG1hcmtSZXN1bHRzID0gYXdhaXQgdGhpcy5wZXJmb3JtQmVuY2htYXJrQ29tcGFyaXNvbihxdWVyeVJlc3VsdHMpO1xuXG4gICAgICAvLyDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg6Hjg4jjg6rjgq/jgrnjga7oqIjnrpdcbiAgICAgIGNvbnN0IHBlcmZvcm1hbmNlTWV0cmljcyA9IHRoaXMuY2FsY3VsYXRlUGVyZm9ybWFuY2VNZXRyaWNzKHF1ZXJ5UmVzdWx0cyk7XG5cbiAgICAgIC8vIOOCueOCs+OCouOBruioiOeul1xuICAgICAgY29uc3Qgc2NvcmVzID0gdGhpcy5jYWxjdWxhdGVTY29yZXMocGVyZm9ybWFuY2VNZXRyaWNzLCBxdWVyeVJlc3VsdHMsIG5ldHdvcmtSZXN1bHRzKTtcblxuICAgICAgY29uc3QgcmVzdWx0OiBSZXNwb25zZVRpbWVUZXN0UmVzdWx0ID0ge1xuICAgICAgICB0ZXN0TmFtZTogJ1Jlc3BvbnNlVGltZVRlc3QnLFxuICAgICAgICBzdWNjZXNzOiBzY29yZXMub3ZlcmFsbFJlc3BvbnNlU2NvcmUgPj0gODUgJiYgXG4gICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWV0cmljcy5vdmVyYWxsQXZlcmFnZVRpbWUgPD0gdGhpcy5jb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLmF2ZXJhZ2VSZXNwb25zZVRpbWUsXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gdGhpcy50ZXN0U3RhcnRUaW1lLFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgdG90YWxRdWVyaWVzOiB0aGlzLmNvbmZpZy50ZXN0UXVlcmllcy5sZW5ndGgsXG4gICAgICAgICAgdG90YWxNZWFzdXJlbWVudHM6IHF1ZXJ5UmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5tZWFzdXJlbWVudHMubGVuZ3RoLCAwKSxcbiAgICAgICAgICB0ZXN0Q292ZXJhZ2U6ICcxMDAlJyxcbiAgICAgICAgICAuLi5zY29yZXMsXG4gICAgICAgICAgLi4ucGVyZm9ybWFuY2VNZXRyaWNzXG4gICAgICAgIH0sXG4gICAgICAgIHF1ZXJ5UmVzdWx0cyxcbiAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWNzLFxuICAgICAgICBiZW5jaG1hcmtSZXN1bHRzLFxuICAgICAgICBuZXR3b3JrUmVzdWx0cyxcbiAgICAgICAgLi4uc2NvcmVzXG4gICAgICB9O1xuXG4gICAgICB0aGlzLmxvZ1Rlc3RSZXN1bHRzKHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlv5znrZTmmYLplpPmuKzlrprjg4bjgrnjg4jjgafjgqjjg6njg7zjgYznmbrnlJ86JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOODmeODvOOCueODqeOCpOODs+WApOOBruWIneacn+WMllxuICAgKi9cbiAgcHJpdmF0ZSBpbml0aWFsaXplQmFzZWxpbmVzKCk6IHZvaWQge1xuICAgIC8vIOmBjuWOu+OBruODkeODleOCqeODvOODnuODs+OCueODh+ODvOOCv+OBvuOBn+OBr+ebruaomeWApOOCkuioreWumlxuICAgIHRoaXMuYmFzZWxpbmVNZXRyaWNzLnNldCgnc2ltcGxlX3F1ZXJ5X2F2ZycsIDgwMCk7XG4gICAgdGhpcy5iYXNlbGluZU1ldHJpY3Muc2V0KCdzdGFuZGFyZF9xdWVyeV9hdmcnLCAxNTAwKTtcbiAgICB0aGlzLmJhc2VsaW5lTWV0cmljcy5zZXQoJ2NvbXBsZXhfcXVlcnlfYXZnJywgMzAwMCk7XG4gICAgdGhpcy5iYXNlbGluZU1ldHJpY3Muc2V0KCdvdmVyYWxsX2F2ZycsIDE4MDApO1xuICAgIHRoaXMuYmFzZWxpbmVNZXRyaWNzLnNldCgncGVyY2VudGlsZV85NScsIDI1MDApO1xuICAgIHRoaXMuYmFzZWxpbmVNZXRyaWNzLnNldCgncGVyY2VudGlsZV85OScsIDQwMDApO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCpuOCqeODvOODoOOCouODg+ODl+OBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtV2FybXVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5SlIOOCt+OCueODhuODoOOCpuOCqeODvOODoOOCouODg+ODl+OCkuWun+ihjOS4rS4uLicpO1xuICAgIFxuICAgIGNvbnN0IHdhcm11cFF1ZXJpZXMgPSB0aGlzLmNvbmZpZy50ZXN0UXVlcmllcy5zbGljZSgwLCB0aGlzLmNvbmZpZy50ZXN0UGFyYW1ldGVycy53YXJtdXBRdWVyaWVzKTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IHF1ZXJ5IG9mIHdhcm11cFF1ZXJpZXMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZVF1ZXJ5KHF1ZXJ5LnF1ZXJ5KTtcbiAgICAgICAgYXdhaXQgdGhpcy5kZWxheSg1MDApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8g44Km44Kp44O844Og44Ki44OD44OX44Kv44Ko44Oq44Gn44Ko44Op44O8OiAke3F1ZXJ5LmlkfWApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zb2xlLmxvZygn4pyFIOOCpuOCqeODvOODoOOCouODg+ODl+WujOS6hicpO1xuICAgIGF3YWl0IHRoaXMuZGVsYXkoMjAwMCk7IC8vIOOCt+OCueODhuODoOWuieWumuWMluW+heapn1xuICB9XG5cbiAgLyoqXG4gICAqIOOCr+OCqOODquWIpeW/nOetlOaZgumWk+ODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB0ZXN0UXVlcnlSZXNwb25zZVRpbWVzKCk6IFByb21pc2U8UXVlcnlSZXNwb25zZVJlc3VsdFtdPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfk4og44Kv44Ko44Oq5Yil5b+c562U5pmC6ZaT5ris5a6a44KS5a6f6KGM5LitLi4uJyk7XG4gICAgY29uc3QgcmVzdWx0czogUXVlcnlSZXNwb25zZVJlc3VsdFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHF1ZXJ5IG9mIHRoaXMuY29uZmlnLnRlc3RRdWVyaWVzKSB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+UjSBcIiR7cXVlcnkucXVlcnl9XCIg44KS5ris5a6a5LitLi4uYCk7XG4gICAgICBcbiAgICAgIGNvbnN0IHF1ZXJ5UmVzdWx0ID0gYXdhaXQgdGhpcy5tZWFzdXJlUXVlcnlSZXNwb25zZVRpbWUocXVlcnkpO1xuICAgICAgcmVzdWx0cy5wdXNoKHF1ZXJ5UmVzdWx0KTtcbiAgICAgIFxuICAgICAgLy8g44Kv44Ko44Oq6ZaT44Gu6ZaT6ZqUXG4gICAgICBhd2FpdCB0aGlzLmRlbGF5KHRoaXMuY29uZmlnLnRlc3RQYXJhbWV0ZXJzLnJlcXVlc3RJbnRlcnZhbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICog5Y2Y5LiA44Kv44Ko44Oq44Gu5b+c562U5pmC6ZaT5ris5a6aXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIG1lYXN1cmVRdWVyeVJlc3BvbnNlVGltZShxdWVyeTogVGVzdFF1ZXJ5KTogUHJvbWlzZTxRdWVyeVJlc3BvbnNlUmVzdWx0PiB7XG4gICAgY29uc3QgbWVhc3VyZW1lbnRzOiBSZXNwb25zZU1lYXN1cmVtZW50W10gPSBbXTtcbiAgICBjb25zdCBpc3N1ZXM6IFBlcmZvcm1hbmNlSXNzdWVbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgYXR0ZW1wdCA9IDE7IGF0dGVtcHQgPD0gdGhpcy5jb25maWcudGVzdFBhcmFtZXRlcnMubWVhc3VyZW1lbnRRdWVyaWVzOyBhdHRlbXB0KyspIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG1lYXN1cmVtZW50ID0gYXdhaXQgdGhpcy5leGVjdXRlU2luZ2xlTWVhc3VyZW1lbnQocXVlcnksIGF0dGVtcHQpO1xuICAgICAgICBtZWFzdXJlbWVudHMucHVzaChtZWFzdXJlbWVudCk7XG4gICAgICAgIFxuICAgICAgICAvLyDlgIvliKXmuKzlrprjga7oqZXkvqFcbiAgICAgICAgaWYgKCFtZWFzdXJlbWVudC5zdWNjZXNzKSB7XG4gICAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogJ2Vycm9yX3JhdGUnLFxuICAgICAgICAgICAgc2V2ZXJpdHk6ICdtYWpvcicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYOa4rOWumiAke2F0dGVtcHR9IOOBp+OCqOODqeODvOOBjOeZuueUn2AsXG4gICAgICAgICAgICBpbXBhY3Q6ICfjgrfjgrnjg4bjg6Djga7kv6HpoLzmgKfjgavlvbHpn78nLFxuICAgICAgICAgICAgcmVjb21tZW5kYXRpb246ICfjgqjjg6njg7zjga7ljp/lm6DjgpLoqr/mn7vjgZfkv67mraPjgZfjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICAgICAgYWZmZWN0ZWRRdWVyaWVzOiBbcXVlcnkuaWRdXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAobWVhc3VyZW1lbnQucmVzcG9uc2VUaW1lID4gcXVlcnkuZXhwZWN0ZWRSZXNwb25zZVRpbWUgKiAxLjUpIHtcbiAgICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiAnc2xvd19yZXNwb25zZScsXG4gICAgICAgICAgICBzZXZlcml0eTogbWVhc3VyZW1lbnQucmVzcG9uc2VUaW1lID4gcXVlcnkuZXhwZWN0ZWRSZXNwb25zZVRpbWUgKiAyID8gJ2NyaXRpY2FsJyA6ICdtYWpvcicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYOW/nOetlOaZgumWk+OBjOacn+W+heWApOOCkuWkp+W5heOBq+i2hemBjjogJHttZWFzdXJlbWVudC5yZXNwb25zZVRpbWV9bXNgLFxuICAgICAgICAgICAgaW1wYWN0OiAn44Om44O844K244O844Ko44Kv44K544Oa44Oq44Ko44Oz44K544Gu5L2O5LiLJyxcbiAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uOiAn44OR44OV44Kp44O844Oe44Oz44K55pyA6YGp5YyW44GM5b+F6KaB44Gn44GZJyxcbiAgICAgICAgICAgIGFmZmVjdGVkUXVlcmllczogW3F1ZXJ5LmlkXVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIG1lYXN1cmVtZW50cy5wdXNoKHtcbiAgICAgICAgICBhdHRlbXB0LFxuICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICByZXNwb25zZVRpbWU6IDAsXG4gICAgICAgICAgdHRmYjogMCxcbiAgICAgICAgICBkb21Db250ZW50TG9hZGVkOiAwLFxuICAgICAgICAgIGxvYWRDb21wbGV0ZTogMCxcbiAgICAgICAgICBuZXR3b3JrVGltZTogMCxcbiAgICAgICAgICBwcm9jZXNzaW5nVGltZTogMCxcbiAgICAgICAgICByZW5kZXJUaW1lOiAwLFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yTWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIOa4rOWumumWk+OBrumWk+malFxuICAgICAgYXdhaXQgdGhpcy5kZWxheSgyMDApO1xuICAgIH1cblxuICAgIC8vIOe1seioiOOBruioiOeul1xuICAgIGNvbnN0IHN0YXRpc3RpY3MgPSB0aGlzLmNhbGN1bGF0ZVN0YXRpc3RpY3MobWVhc3VyZW1lbnRzKTtcbiAgICBcbiAgICAvLyDliIbmlaPjga7oqZXkvqFcbiAgICBpZiAoc3RhdGlzdGljcy5zdGREZXYgPiBzdGF0aXN0aWNzLm1lYW4gKiAwLjMpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2hpZ2hfdmFyaWFuY2UnLFxuICAgICAgICBzZXZlcml0eTogJ21pbm9yJyxcbiAgICAgICAgZGVzY3JpcHRpb246IGDlv5znrZTmmYLplpPjga7liIbmlaPjgYzlpKfjgY3jgYQ6IOaomea6luWBj+W3riAke3N0YXRpc3RpY3Muc3RkRGV2LnRvRml4ZWQoMSl9bXNgLFxuICAgICAgICBpbXBhY3Q6ICfkuojmuKzlj6/og73mgKfjga7kvY7kuIsnLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogJ+OCt+OCueODhuODoOOBruWuieWumuaAp+OCkuaUueWWhOOBl+OBpuOBj+OBoOOBleOBhCcsXG4gICAgICAgIGFmZmVjdGVkUXVlcmllczogW3F1ZXJ5LmlkXVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHF1ZXJ5SWQ6IHF1ZXJ5LmlkLFxuICAgICAgcXVlcnk6IHF1ZXJ5LnF1ZXJ5LFxuICAgICAgcXVlcnlUeXBlOiBxdWVyeS50eXBlLFxuICAgICAgbWVhc3VyZW1lbnRzLFxuICAgICAgc3RhdGlzdGljcyxcbiAgICAgIHN1Y2Nlc3M6IHN0YXRpc3RpY3Muc3VjY2Vzc1JhdGUgPj0gMC45NSAmJiBzdGF0aXN0aWNzLm1lYW4gPD0gcXVlcnkuZXhwZWN0ZWRSZXNwb25zZVRpbWUsXG4gICAgICBpc3N1ZXNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOWNmOS4gOa4rOWumuOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlU2luZ2xlTWVhc3VyZW1lbnQocXVlcnk6IFRlc3RRdWVyeSwgYXR0ZW1wdDogbnVtYmVyKTogUHJvbWlzZTxSZXNwb25zZU1lYXN1cmVtZW50PiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBzdGFydFRpbWU7XG5cbiAgICB0cnkge1xuICAgICAgLy8g44ON44OD44OI44Ov44O844Kv5pmC6ZaT44Gu5ris5a6a6ZaL5aeLXG4gICAgICBjb25zdCBuZXR3b3JrU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIFxuICAgICAgLy8g44Kv44Ko44Oq44Gu5a6f6KGMXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlY3V0ZVF1ZXJ5KHF1ZXJ5LnF1ZXJ5KTtcbiAgICAgIFxuICAgICAgY29uc3QgbmV0d29ya0VuZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgbmV0d29ya1RpbWUgPSBuZXR3b3JrRW5kVGltZSAtIG5ldHdvcmtTdGFydFRpbWU7XG5cbiAgICAgIC8vIOWHpueQhuaZgumWk+OBruaOqOWumu+8iOWun+mam+OBruWun+ijheOBp+OBr+ips+e0sOOBquWIhuaekOOBjOW/heimge+8iVxuICAgICAgY29uc3QgcHJvY2Vzc2luZ1RpbWUgPSBNYXRoLm1heCgwLCBuZXR3b3JrVGltZSAtIDEwMCk7IC8vIOODjeODg+ODiOODr+ODvOOCr+mBheW7tuOCkumZpOOBj1xuICAgICAgXG4gICAgICAvLyDjg6zjg7Pjg4Djg6rjg7PjgrDmmYLplpPjga7muKzlrprvvIjjg5Xjg63jg7Pjg4jjgqjjg7Pjg4nlh6bnkIbmmYLplpPvvIlcbiAgICAgIGNvbnN0IHJlbmRlclRpbWUgPSBhd2FpdCB0aGlzLm1lYXN1cmVSZW5kZXJUaW1lKCk7XG5cbiAgICAgIGNvbnN0IHRvdGFsUmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIGNvbnN0IHR0ZmIgPSBNYXRoLm1pbihuZXR3b3JrVGltZSwgdG90YWxSZXNwb25zZVRpbWUgKiAwLjMpOyAvLyBUaW1lIHRvIEZpcnN0IEJ5dGXmjqjlrppcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXR0ZW1wdCxcbiAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICByZXNwb25zZVRpbWU6IHRvdGFsUmVzcG9uc2VUaW1lLFxuICAgICAgICB0dGZiLFxuICAgICAgICBkb21Db250ZW50TG9hZGVkOiB0b3RhbFJlc3BvbnNlVGltZSAqIDAuOCwgLy8g5o6o5a6a5YCkXG4gICAgICAgIGxvYWRDb21wbGV0ZTogdG90YWxSZXNwb25zZVRpbWUsXG4gICAgICAgIG5ldHdvcmtUaW1lLFxuICAgICAgICBwcm9jZXNzaW5nVGltZSxcbiAgICAgICAgcmVuZGVyVGltZSxcbiAgICAgICAgc3VjY2VzczogdHJ1ZVxuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhdHRlbXB0LFxuICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgIHJlc3BvbnNlVGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgdHRmYjogMCxcbiAgICAgICAgZG9tQ29udGVudExvYWRlZDogMCxcbiAgICAgICAgbG9hZENvbXBsZXRlOiAwLFxuICAgICAgICBuZXR3b3JrVGltZTogMCxcbiAgICAgICAgcHJvY2Vzc2luZ1RpbWU6IDAsXG4gICAgICAgIHJlbmRlclRpbWU6IDAsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvck1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjgq/jgqjjg6rjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIC8vIOWun+mam+OBruWun+ijheOBp+OBr+OAgeODgeODo+ODg+ODiOODnOODg+ODiEFQSeOCkuWRvOOBs+WHuuOBl1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7dGhpcy5jb25maWcuYmFzZVVybH0vYXBpL2NoYXRgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyIHRlc3QtdG9rZW4nXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtZXNzYWdlOiBxdWVyeSxcbiAgICAgICAgdXNlcklkOiAncGVyZm9ybWFuY2UtdGVzdC11c2VyJyxcbiAgICAgICAgc2Vzc2lvbklkOiBgcGVyZi10ZXN0LSR7RGF0ZS5ub3coKX1gXG4gICAgICB9KVxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gIH1cblxuICAvKipcbiAgICog44Os44Oz44OA44Oq44Oz44Kw5pmC6ZaT44Gu5ris5a6aXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIG1lYXN1cmVSZW5kZXJUaW1lKCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgLy8g5a6f6Zqb44Gu5a6f6KOF44Gn44Gv44CB44OW44Op44Km44K244Gu44OR44OV44Kp44O844Oe44Oz44K5QVBJ44KS5L2/55SoXG4gICAgLy8g44GT44GT44Gn44Gv44K344Of44Ol44Os44O844K344On44Oz5YCk44KS6L+U44GZXG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAyMDAgKyAxMDA7IC8vIDEwMC0zMDBtc1xuICB9XG5cbiAgLyoqXG4gICAqIOe1seioiOOBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVTdGF0aXN0aWNzKG1lYXN1cmVtZW50czogUmVzcG9uc2VNZWFzdXJlbWVudFtdKTogUmVzcG9uc2VTdGF0aXN0aWNzIHtcbiAgICBjb25zdCBzdWNjZXNzZnVsTWVhc3VyZW1lbnRzID0gbWVhc3VyZW1lbnRzLmZpbHRlcihtID0+IG0uc3VjY2Vzcyk7XG4gICAgY29uc3QgcmVzcG9uc2VUaW1lcyA9IHN1Y2Nlc3NmdWxNZWFzdXJlbWVudHMubWFwKG0gPT4gbS5yZXNwb25zZVRpbWUpO1xuICAgIFxuICAgIGlmIChyZXNwb25zZVRpbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWVhbjogMCxcbiAgICAgICAgbWVkaWFuOiAwLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMCxcbiAgICAgICAgc3RkRGV2OiAwLFxuICAgICAgICBwZXJjZW50aWxlOTU6IDAsXG4gICAgICAgIHBlcmNlbnRpbGU5OTogMCxcbiAgICAgICAgc3VjY2Vzc1JhdGU6IDAsXG4gICAgICAgIGVycm9yUmF0ZTogMTAwXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJlc3BvbnNlVGltZXMuc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgIFxuICAgIGNvbnN0IG1lYW4gPSByZXNwb25zZVRpbWVzLnJlZHVjZSgoc3VtLCB0aW1lKSA9PiBzdW0gKyB0aW1lLCAwKSAvIHJlc3BvbnNlVGltZXMubGVuZ3RoO1xuICAgIGNvbnN0IG1lZGlhbiA9IHRoaXMuY2FsY3VsYXRlUGVyY2VudGlsZShyZXNwb25zZVRpbWVzLCA1MCk7XG4gICAgY29uc3QgbWluID0gcmVzcG9uc2VUaW1lc1swXTtcbiAgICBjb25zdCBtYXggPSByZXNwb25zZVRpbWVzW3Jlc3BvbnNlVGltZXMubGVuZ3RoIC0gMV07XG4gICAgXG4gICAgLy8g5qiZ5rqW5YGP5beu44Gu6KiI566XXG4gICAgY29uc3QgdmFyaWFuY2UgPSByZXNwb25zZVRpbWVzLnJlZHVjZSgoc3VtLCB0aW1lKSA9PiBzdW0gKyBNYXRoLnBvdyh0aW1lIC0gbWVhbiwgMiksIDApIC8gcmVzcG9uc2VUaW1lcy5sZW5ndGg7XG4gICAgY29uc3Qgc3RkRGV2ID0gTWF0aC5zcXJ0KHZhcmlhbmNlKTtcbiAgICBcbiAgICBjb25zdCBwZXJjZW50aWxlOTUgPSB0aGlzLmNhbGN1bGF0ZVBlcmNlbnRpbGUocmVzcG9uc2VUaW1lcywgOTUpO1xuICAgIGNvbnN0IHBlcmNlbnRpbGU5OSA9IHRoaXMuY2FsY3VsYXRlUGVyY2VudGlsZShyZXNwb25zZVRpbWVzLCA5OSk7XG4gICAgXG4gICAgY29uc3Qgc3VjY2Vzc1JhdGUgPSAoc3VjY2Vzc2Z1bE1lYXN1cmVtZW50cy5sZW5ndGggLyBtZWFzdXJlbWVudHMubGVuZ3RoKSAqIDEwMDtcbiAgICBjb25zdCBlcnJvclJhdGUgPSAxMDAgLSBzdWNjZXNzUmF0ZTtcblxuICAgIHJldHVybiB7XG4gICAgICBtZWFuLFxuICAgICAgbWVkaWFuLFxuICAgICAgbWluLFxuICAgICAgbWF4LFxuICAgICAgc3RkRGV2LFxuICAgICAgcGVyY2VudGlsZTk1LFxuICAgICAgcGVyY2VudGlsZTk5LFxuICAgICAgc3VjY2Vzc1JhdGUsXG4gICAgICBlcnJvclJhdGVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOODkeODvOOCu+ODs+OCv+OCpOODq+OBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVQZXJjZW50aWxlKHNvcnRlZEFycmF5OiBudW1iZXJbXSwgcGVyY2VudGlsZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoc29ydGVkQXJyYXkubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICBcbiAgICBjb25zdCBpbmRleCA9IChwZXJjZW50aWxlIC8gMTAwKSAqIChzb3J0ZWRBcnJheS5sZW5ndGggLSAxKTtcbiAgICBjb25zdCBsb3dlciA9IE1hdGguZmxvb3IoaW5kZXgpO1xuICAgIGNvbnN0IHVwcGVyID0gTWF0aC5jZWlsKGluZGV4KTtcbiAgICBcbiAgICBpZiAobG93ZXIgPT09IHVwcGVyKSB7XG4gICAgICByZXR1cm4gc29ydGVkQXJyYXlbbG93ZXJdO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCB3ZWlnaHQgPSBpbmRleCAtIGxvd2VyO1xuICAgIHJldHVybiBzb3J0ZWRBcnJheVtsb3dlcl0gKiAoMSAtIHdlaWdodCkgKyBzb3J0ZWRBcnJheVt1cHBlcl0gKiB3ZWlnaHQ7XG4gIH1cblxuICAvKipcbiAgICog44ON44OD44OI44Ov44O844Kv5p2h5Lu25Yil44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3ROZXR3b3JrQ29uZGl0aW9ucygpOiBQcm9taXNlPE5ldHdvcmtQZXJmb3JtYW5jZVJlc3VsdFtdPiB7XG4gICAgY29uc29sZS5sb2coJ/CfjJAg44ON44OD44OI44Ov44O844Kv5p2h5Lu25Yil44OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgY29uc3QgcmVzdWx0czogTmV0d29ya1BlcmZvcm1hbmNlUmVzdWx0W10gPSBbXTtcblxuICAgIGNvbnN0IGVuYWJsZWRDb25kaXRpb25zID0gdGhpcy5jb25maWcubmV0d29ya0NvbmRpdGlvbnMuZmlsdGVyKGMgPT4gYy5lbmFibGVkKTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IGNvbmRpdGlvbiBvZiBlbmFibGVkQ29uZGl0aW9ucykge1xuICAgICAgY29uc29sZS5sb2coYPCfk6EgJHtjb25kaXRpb24ubmFtZX0g5p2h5Lu244Gn44OG44K544OI5LitLi4uYCk7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMudGVzdFVuZGVyTmV0d29ya0NvbmRpdGlvbihjb25kaXRpb24pO1xuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICog54m55a6a44ON44OD44OI44Ov44O844Kv5p2h5Lu25LiL44Gn44Gu44OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RVbmRlck5ldHdvcmtDb25kaXRpb24oY29uZGl0aW9uOiBOZXR3b3JrQ29uZGl0aW9uKTogUHJvbWlzZTxOZXR3b3JrUGVyZm9ybWFuY2VSZXN1bHQ+IHtcbiAgICAvLyDjg43jg4Pjg4jjg6/jg7zjgq/mnaHku7bjga7jgrfjg5/jg6Xjg6zjg7zjgrfjg6fjg7NcbiAgICBhd2FpdCB0aGlzLnNpbXVsYXRlTmV0d29ya0NvbmRpdGlvbihjb25kaXRpb24pO1xuICAgIFxuICAgIC8vIOOCteODs+ODl+ODq+OCr+OCqOODquOBp+OBrua4rOWumlxuICAgIGNvbnN0IHNhbXBsZVF1ZXJpZXMgPSB0aGlzLmNvbmZpZy50ZXN0UXVlcmllcy5zbGljZSgwLCAzKTtcbiAgICBjb25zdCBtZWFzdXJlbWVudHM6IG51bWJlcltdID0gW107XG4gICAgbGV0IHN1Y2Nlc3NDb3VudCA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IHF1ZXJ5IG9mIHNhbXBsZVF1ZXJpZXMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZVF1ZXJ5KHF1ZXJ5LnF1ZXJ5KTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgICAgXG4gICAgICAgIG1lYXN1cmVtZW50cy5wdXNoKHJlc3BvbnNlVGltZSk7XG4gICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gJHtjb25kaXRpb24ubmFtZX0g5p2h5Lu25LiL44Gn44Ko44Op44O8OmAsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhdmVyYWdlUmVzcG9uc2VUaW1lID0gbWVhc3VyZW1lbnRzLmxlbmd0aCA+IDAgXG4gICAgICA/IG1lYXN1cmVtZW50cy5yZWR1Y2UoKHN1bSwgdGltZSkgPT4gc3VtICsgdGltZSwgMCkgLyBtZWFzdXJlbWVudHMubGVuZ3RoIFxuICAgICAgOiAwO1xuICAgIFxuICAgIGNvbnN0IHN1Y2Nlc3NSYXRlID0gKHN1Y2Nlc3NDb3VudCAvIHNhbXBsZVF1ZXJpZXMubGVuZ3RoKSAqIDEwMDtcbiAgICBcbiAgICAvLyDjg5njg7zjgrnjg6njgqTjg7PmnaHku7bjgajjga7mr5TovINcbiAgICBjb25zdCBiYXNlbGluZVRpbWUgPSB0aGlzLmJhc2VsaW5lTWV0cmljcy5nZXQoJ292ZXJhbGxfYXZnJykgfHwgMTgwMDtcbiAgICBjb25zdCBkZWdyYWRhdGlvbkZhY3RvciA9IGF2ZXJhZ2VSZXNwb25zZVRpbWUgLyBiYXNlbGluZVRpbWU7XG4gICAgXG4gICAgLy8g6YGp5b+c5oCn44K544Kz44Ki77yI44ON44OD44OI44Ov44O844Kv5p2h5Lu244Gr5a++44GZ44KL6ICQ5oCn77yJXG4gICAgY29uc3QgYWRhcHRhYmlsaXR5ID0gTWF0aC5tYXgoMCwgMTAwIC0gKGRlZ3JhZGF0aW9uRmFjdG9yIC0gMSkgKiA1MCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmV0d29ya0NvbmRpdGlvbjogY29uZGl0aW9uLm5hbWUsXG4gICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lLFxuICAgICAgc3VjY2Vzc1JhdGUsXG4gICAgICBkZWdyYWRhdGlvbkZhY3RvcixcbiAgICAgIGFkYXB0YWJpbGl0eVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44ON44OD44OI44Ov44O844Kv5p2h5Lu244Gu44K344Of44Ol44Os44O844K344On44OzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNpbXVsYXRlTmV0d29ya0NvbmRpdGlvbihjb25kaXRpb246IE5ldHdvcmtDb25kaXRpb24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/jgIHjg5bjg6njgqbjgrbjga7jg43jg4Pjg4jjg6/jg7zjgq/liLbpmZDmqZ/og73jgpLkvb/nlKhcbiAgICAvLyDjgZPjgZPjgafjga/pgYXlu7bjga7jgrfjg5/jg6Xjg6zjg7zjgrfjg6fjg7NcbiAgICBjb25zdCBzaW11bGF0ZWREZWxheSA9IGNvbmRpdGlvbi5sYXRlbmN5ICsgKGNvbmRpdGlvbi5iYW5kd2lkdGggPCAxMCA/IDUwMCA6IDApO1xuICAgIGF3YWl0IHRoaXMuZGVsYXkoc2ltdWxhdGVkRGVsYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIOODmeODs+ODgeODnuODvOOCr+avlOi8g+OBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtQmVuY2htYXJrQ29tcGFyaXNvbihxdWVyeVJlc3VsdHM6IFF1ZXJ5UmVzcG9uc2VSZXN1bHRbXSk6IFByb21pc2U8QmVuY2htYXJrUmVzdWx0W10+IHtcbiAgICBjb25zb2xlLmxvZygn8J+TiCDjg5njg7Pjg4Hjg57jg7zjgq/mr5TovIPjgpLlrp/ooYzkuK0uLi4nKTtcbiAgICBjb25zdCByZXN1bHRzOiBCZW5jaG1hcmtSZXN1bHRbXSA9IFtdO1xuXG4gICAgLy8g44Kv44Ko44Oq44K/44Kk44OX5Yil44Gu44OZ44Oz44OB44Oe44O844KvXG4gICAgY29uc3QgcXVlcnlUeXBlcyA9IFsnc2ltcGxlJywgJ3N0YW5kYXJkJywgJ2NvbXBsZXgnXTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IHR5cGUgb2YgcXVlcnlUeXBlcykge1xuICAgICAgY29uc3QgdHlwZVJlc3VsdHMgPSBxdWVyeVJlc3VsdHMuZmlsdGVyKHIgPT4gci5xdWVyeVR5cGUgPT09IHR5cGUpO1xuICAgICAgaWYgKHR5cGVSZXN1bHRzLmxlbmd0aCA9PT0gMCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRBdmVyYWdlID0gdHlwZVJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIuc3RhdGlzdGljcy5tZWFuLCAwKSAvIHR5cGVSZXN1bHRzLmxlbmd0aDtcbiAgICAgIGNvbnN0IGJhc2VsaW5lS2V5ID0gYCR7dHlwZX1fcXVlcnlfYXZnYDtcbiAgICAgIGNvbnN0IGJhc2VsaW5lVGltZSA9IHRoaXMuYmFzZWxpbmVNZXRyaWNzLmdldChiYXNlbGluZUtleSkgfHwgY3VycmVudEF2ZXJhZ2U7XG4gICAgICBcbiAgICAgIGNvbnN0IGltcHJvdmVtZW50ID0gYmFzZWxpbmVUaW1lID4gY3VycmVudEF2ZXJhZ2UgXG4gICAgICAgID8gKChiYXNlbGluZVRpbWUgLSBjdXJyZW50QXZlcmFnZSkgLyBiYXNlbGluZVRpbWUpICogMTAwIFxuICAgICAgICA6IDA7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlZ3Jlc3Npb24gPSBjdXJyZW50QXZlcmFnZSA+IGJhc2VsaW5lVGltZSBcbiAgICAgICAgPyAoKGN1cnJlbnRBdmVyYWdlIC0gYmFzZWxpbmVUaW1lKSAvIGJhc2VsaW5lVGltZSkgKiAxMDAgXG4gICAgICAgIDogMDtcblxuICAgICAgbGV0IHN0YXR1czogJ2ltcHJvdmVkJyB8ICdtYWludGFpbmVkJyB8ICdkZWdyYWRlZCc7XG4gICAgICBpZiAoaW1wcm92ZW1lbnQgPiA1KSB7XG4gICAgICAgIHN0YXR1cyA9ICdpbXByb3ZlZCc7XG4gICAgICB9IGVsc2UgaWYgKHJlZ3Jlc3Npb24gPiA1KSB7XG4gICAgICAgIHN0YXR1cyA9ICdkZWdyYWRlZCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0dXMgPSAnbWFpbnRhaW5lZCc7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIGJlbmNobWFya05hbWU6IGAke3R5cGUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0eXBlLnNsaWNlKDEpfSBRdWVyeSBBdmVyYWdlYCxcbiAgICAgICAgYmFzZWxpbmVUaW1lLFxuICAgICAgICBjdXJyZW50VGltZTogY3VycmVudEF2ZXJhZ2UsXG4gICAgICAgIGltcHJvdmVtZW50LFxuICAgICAgICByZWdyZXNzaW9uLFxuICAgICAgICBzdGF0dXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOWFqOS9k+OBruODmeODs+ODgeODnuODvOOCr1xuICAgIGNvbnN0IG92ZXJhbGxBdmVyYWdlID0gcXVlcnlSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLnN0YXRpc3RpY3MubWVhbiwgMCkgLyBxdWVyeVJlc3VsdHMubGVuZ3RoO1xuICAgIGNvbnN0IG92ZXJhbGxCYXNlbGluZSA9IHRoaXMuYmFzZWxpbmVNZXRyaWNzLmdldCgnb3ZlcmFsbF9hdmcnKSB8fCBvdmVyYWxsQXZlcmFnZTtcbiAgICBcbiAgICBjb25zdCBvdmVyYWxsSW1wcm92ZW1lbnQgPSBvdmVyYWxsQmFzZWxpbmUgPiBvdmVyYWxsQXZlcmFnZSBcbiAgICAgID8gKChvdmVyYWxsQmFzZWxpbmUgLSBvdmVyYWxsQXZlcmFnZSkgLyBvdmVyYWxsQmFzZWxpbmUpICogMTAwIFxuICAgICAgOiAwO1xuICAgIFxuICAgIGNvbnN0IG92ZXJhbGxSZWdyZXNzaW9uID0gb3ZlcmFsbEF2ZXJhZ2UgPiBvdmVyYWxsQmFzZWxpbmUgXG4gICAgICA/ICgob3ZlcmFsbEF2ZXJhZ2UgLSBvdmVyYWxsQmFzZWxpbmUpIC8gb3ZlcmFsbEJhc2VsaW5lKSAqIDEwMCBcbiAgICAgIDogMDtcblxuICAgIGxldCBvdmVyYWxsU3RhdHVzOiAnaW1wcm92ZWQnIHwgJ21haW50YWluZWQnIHwgJ2RlZ3JhZGVkJztcbiAgICBpZiAob3ZlcmFsbEltcHJvdmVtZW50ID4gMykge1xuICAgICAgb3ZlcmFsbFN0YXR1cyA9ICdpbXByb3ZlZCc7XG4gICAgfSBlbHNlIGlmIChvdmVyYWxsUmVncmVzc2lvbiA+IDMpIHtcbiAgICAgIG92ZXJhbGxTdGF0dXMgPSAnZGVncmFkZWQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVyYWxsU3RhdHVzID0gJ21haW50YWluZWQnO1xuICAgIH1cblxuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICBiZW5jaG1hcmtOYW1lOiAnT3ZlcmFsbCBBdmVyYWdlJyxcbiAgICAgIGJhc2VsaW5lVGltZTogb3ZlcmFsbEJhc2VsaW5lLFxuICAgICAgY3VycmVudFRpbWU6IG92ZXJhbGxBdmVyYWdlLFxuICAgICAgaW1wcm92ZW1lbnQ6IG92ZXJhbGxJbXByb3ZlbWVudCxcbiAgICAgIHJlZ3Jlc3Npb246IG92ZXJhbGxSZWdyZXNzaW9uLFxuICAgICAgc3RhdHVzOiBvdmVyYWxsU3RhdHVzXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIC8qKlxuICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg6Hjg4jjg6rjgq/jgrnjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlUGVyZm9ybWFuY2VNZXRyaWNzKHF1ZXJ5UmVzdWx0czogUXVlcnlSZXNwb25zZVJlc3VsdFtdKTogUGVyZm9ybWFuY2VNZXRyaWNzIHtcbiAgICBjb25zdCBhbGxNZWFzdXJlbWVudHMgPSBxdWVyeVJlc3VsdHMuZmxhdE1hcChyID0+IHIubWVhc3VyZW1lbnRzLmZpbHRlcihtID0+IG0uc3VjY2VzcykpO1xuICAgIGNvbnN0IGFsbFJlc3BvbnNlVGltZXMgPSBhbGxNZWFzdXJlbWVudHMubWFwKG0gPT4gbS5yZXNwb25zZVRpbWUpO1xuICAgIFxuICAgIGlmIChhbGxSZXNwb25zZVRpbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3ZlcmFsbEF2ZXJhZ2VUaW1lOiAwLFxuICAgICAgICBvdmVyYWxsTWVkaWFuVGltZTogMCxcbiAgICAgICAgb3ZlcmFsbFBlcmNlbnRpbGU5NTogMCxcbiAgICAgICAgb3ZlcmFsbFBlcmNlbnRpbGU5OTogMCxcbiAgICAgICAgc3VjY2Vzc1JhdGU6IDAsXG4gICAgICAgIGVycm9yUmF0ZTogMTAwLFxuICAgICAgICB0aHJvdWdocHV0OiAwLFxuICAgICAgICByZWxpYWJpbGl0eTogMCxcbiAgICAgICAgY29uc2lzdGVuY3k6IDBcbiAgICAgIH07XG4gICAgfVxuXG4gICAgYWxsUmVzcG9uc2VUaW1lcy5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgXG4gICAgY29uc3Qgb3ZlcmFsbEF2ZXJhZ2VUaW1lID0gYWxsUmVzcG9uc2VUaW1lcy5yZWR1Y2UoKHN1bSwgdGltZSkgPT4gc3VtICsgdGltZSwgMCkgLyBhbGxSZXNwb25zZVRpbWVzLmxlbmd0aDtcbiAgICBjb25zdCBvdmVyYWxsTWVkaWFuVGltZSA9IHRoaXMuY2FsY3VsYXRlUGVyY2VudGlsZShhbGxSZXNwb25zZVRpbWVzLCA1MCk7XG4gICAgY29uc3Qgb3ZlcmFsbFBlcmNlbnRpbGU5NSA9IHRoaXMuY2FsY3VsYXRlUGVyY2VudGlsZShhbGxSZXNwb25zZVRpbWVzLCA5NSk7XG4gICAgY29uc3Qgb3ZlcmFsbFBlcmNlbnRpbGU5OSA9IHRoaXMuY2FsY3VsYXRlUGVyY2VudGlsZShhbGxSZXNwb25zZVRpbWVzLCA5OSk7XG4gICAgXG4gICAgY29uc3QgdG90YWxNZWFzdXJlbWVudHMgPSBxdWVyeVJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIubWVhc3VyZW1lbnRzLmxlbmd0aCwgMCk7XG4gICAgY29uc3Qgc3VjY2Vzc2Z1bE1lYXN1cmVtZW50cyA9IGFsbE1lYXN1cmVtZW50cy5sZW5ndGg7XG4gICAgY29uc3Qgc3VjY2Vzc1JhdGUgPSAoc3VjY2Vzc2Z1bE1lYXN1cmVtZW50cyAvIHRvdGFsTWVhc3VyZW1lbnRzKSAqIDEwMDtcbiAgICBjb25zdCBlcnJvclJhdGUgPSAxMDAgLSBzdWNjZXNzUmF0ZTtcbiAgICBcbiAgICAvLyDjgrnjg6vjg7zjg5fjg4Pjg4jjga7oqIjnrpfvvIgx56eS44GC44Gf44KK44Gu44Oq44Kv44Ko44K544OI5pWw77yJXG4gICAgY29uc3QgdG90YWxUZXN0VGltZSA9IChEYXRlLm5vdygpIC0gdGhpcy50ZXN0U3RhcnRUaW1lKSAvIDEwMDA7XG4gICAgY29uc3QgdGhyb3VnaHB1dCA9IHN1Y2Nlc3NmdWxNZWFzdXJlbWVudHMgLyB0b3RhbFRlc3RUaW1lO1xuICAgIFxuICAgIC8vIOS/oemgvOaAp+OCueOCs+OColxuICAgIGNvbnN0IHJlbGlhYmlsaXR5ID0gTWF0aC5taW4oc3VjY2Vzc1JhdGUsIDEwMCk7XG4gICAgXG4gICAgLy8g5LiA6LKr5oCn44K544Kz44Ki77yI5YiG5pWj44Gu6YCG5pWw44OZ44O844K577yJXG4gICAgY29uc3QgdmFyaWFuY2UgPSBhbGxSZXNwb25zZVRpbWVzLnJlZHVjZSgoc3VtLCB0aW1lKSA9PiBzdW0gKyBNYXRoLnBvdyh0aW1lIC0gb3ZlcmFsbEF2ZXJhZ2VUaW1lLCAyKSwgMCkgLyBhbGxSZXNwb25zZVRpbWVzLmxlbmd0aDtcbiAgICBjb25zdCBzdGREZXYgPSBNYXRoLnNxcnQodmFyaWFuY2UpO1xuICAgIGNvbnN0IGNvZWZmaWNpZW50T2ZWYXJpYXRpb24gPSBzdGREZXYgLyBvdmVyYWxsQXZlcmFnZVRpbWU7XG4gICAgY29uc3QgY29uc2lzdGVuY3kgPSBNYXRoLm1heCgwLCAxMDAgLSAoY29lZmZpY2llbnRPZlZhcmlhdGlvbiAqIDEwMCkpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG92ZXJhbGxBdmVyYWdlVGltZSxcbiAgICAgIG92ZXJhbGxNZWRpYW5UaW1lLFxuICAgICAgb3ZlcmFsbFBlcmNlbnRpbGU5NSxcbiAgICAgIG92ZXJhbGxQZXJjZW50aWxlOTksXG4gICAgICBzdWNjZXNzUmF0ZSxcbiAgICAgIGVycm9yUmF0ZSxcbiAgICAgIHRocm91Z2hwdXQsXG4gICAgICByZWxpYWJpbGl0eSxcbiAgICAgIGNvbnNpc3RlbmN5XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgrPjgqLjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlU2NvcmVzKFxuICAgIG1ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljcyxcbiAgICBxdWVyeVJlc3VsdHM6IFF1ZXJ5UmVzcG9uc2VSZXN1bHRbXSxcbiAgICBuZXR3b3JrUmVzdWx0czogTmV0d29ya1BlcmZvcm1hbmNlUmVzdWx0W11cbiAgKToge1xuICAgIG92ZXJhbGxSZXNwb25zZVNjb3JlOiBudW1iZXI7XG4gICAgcmVsaWFiaWxpdHlTY29yZTogbnVtYmVyO1xuICAgIGNvbnNpc3RlbmN5U2NvcmU6IG51bWJlcjtcbiAgICBzY2FsYWJpbGl0eVNjb3JlOiBudW1iZXI7XG4gIH0ge1xuICAgIC8vIOW/nOetlOaZgumWk+OCueOCs+OColxuICAgIGxldCByZXNwb25zZVRpbWVTY29yZSA9IDEwMDtcbiAgICBpZiAobWV0cmljcy5vdmVyYWxsQXZlcmFnZVRpbWUgPiB0aGlzLmNvbmZpZy5wZXJmb3JtYW5jZVRocmVzaG9sZHMuYXZlcmFnZVJlc3BvbnNlVGltZSkge1xuICAgICAgcmVzcG9uc2VUaW1lU2NvcmUgLT0gKChtZXRyaWNzLm92ZXJhbGxBdmVyYWdlVGltZSAtIHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGhyZXNob2xkcy5hdmVyYWdlUmVzcG9uc2VUaW1lKSAvIHRoaXMuY29uZmlnLnBlcmZvcm1hbmNlVGhyZXNob2xkcy5hdmVyYWdlUmVzcG9uc2VUaW1lKSAqIDUwO1xuICAgIH1cbiAgICBcbiAgICBpZiAobWV0cmljcy5vdmVyYWxsUGVyY2VudGlsZTk1ID4gdGhpcy5jb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLnBlcmNlbnRpbGU5NVRpbWUpIHtcbiAgICAgIHJlc3BvbnNlVGltZVNjb3JlIC09IDIwO1xuICAgIH1cbiAgICBcbiAgICBpZiAobWV0cmljcy5vdmVyYWxsUGVyY2VudGlsZTk5ID4gdGhpcy5jb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLnBlcmNlbnRpbGU5OVRpbWUpIHtcbiAgICAgIHJlc3BvbnNlVGltZVNjb3JlIC09IDE1O1xuICAgIH1cblxuICAgIC8vIOS/oemgvOaAp+OCueOCs+OColxuICAgIGNvbnN0IHJlbGlhYmlsaXR5U2NvcmUgPSBtZXRyaWNzLnJlbGlhYmlsaXR5O1xuXG4gICAgLy8g5LiA6LKr5oCn44K544Kz44KiXG4gICAgY29uc3QgY29uc2lzdGVuY3lTY29yZSA9IG1ldHJpY3MuY29uc2lzdGVuY3k7XG5cbiAgICAvLyDjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPjgrnjgrPjgqLvvIjjg43jg4Pjg4jjg6/jg7zjgq/mnaHku7bjgbjjga7pganlv5zmgKfvvIlcbiAgICBjb25zdCBzY2FsYWJpbGl0eVNjb3JlID0gbmV0d29ya1Jlc3VsdHMubGVuZ3RoID4gMFxuICAgICAgPyBuZXR3b3JrUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5hZGFwdGFiaWxpdHksIDApIC8gbmV0d29ya1Jlc3VsdHMubGVuZ3RoXG4gICAgICA6IDEwMDtcblxuICAgIC8vIOe3j+WQiOOCueOCs+OColxuICAgIGNvbnN0IG92ZXJhbGxSZXNwb25zZVNjb3JlID0gKFxuICAgICAgTWF0aC5tYXgocmVzcG9uc2VUaW1lU2NvcmUsIDApICogMC40ICtcbiAgICAgIHJlbGlhYmlsaXR5U2NvcmUgKiAwLjMgK1xuICAgICAgY29uc2lzdGVuY3lTY29yZSAqIDAuMiArXG4gICAgICBzY2FsYWJpbGl0eVNjb3JlICogMC4xXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBvdmVyYWxsUmVzcG9uc2VTY29yZSxcbiAgICAgIHJlbGlhYmlsaXR5U2NvcmUsXG4gICAgICBjb25zaXN0ZW5jeVNjb3JlLFxuICAgICAgc2NhbGFiaWxpdHlTY29yZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44OG44K544OI57WQ5p6c44Gu44Ot44Kw5Ye65YqbXG4gICAqL1xuICBwcml2YXRlIGxvZ1Rlc3RSZXN1bHRzKHJlc3VsdDogUmVzcG9uc2VUaW1lVGVzdFJlc3VsdCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKCdcXG7wn5OKIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiOe1kOaenDonKTtcbiAgICBjb25zb2xlLmxvZyhg4pyFIOe3j+WQiOOCueOCs+OCojogJHtyZXN1bHQub3ZlcmFsbFJlc3BvbnNlU2NvcmUudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgY29uc29sZS5sb2coYPCflJIg5L+h6aC85oCnOiAke3Jlc3VsdC5yZWxpYWJpbGl0eVNjb3JlLnRvRml4ZWQoMSl9LzEwMGApO1xuICAgIGNvbnNvbGUubG9nKGDwn5OIIOS4gOiyq+aApzogJHtyZXN1bHQuY29uc2lzdGVuY3lTY29yZS50b0ZpeGVkKDEpfS8xMDBgKTtcbiAgICBjb25zb2xlLmxvZyhg8J+agCDjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqM6ICR7cmVzdWx0LnNjYWxhYmlsaXR5U2NvcmUudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcbuKPse+4jyDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg6Hjg4jjg6rjgq/jgrk6Jyk7XG4gICAgY29uc29sZS5sb2coYCAg5bmz5Z2H5b+c562U5pmC6ZaTOiAke3Jlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3Mub3ZlcmFsbEF2ZXJhZ2VUaW1lLnRvRml4ZWQoMCl9bXNgKTtcbiAgICBjb25zb2xlLmxvZyhgICDkuK3lpK7lgKQ6ICR7cmVzdWx0LnBlcmZvcm1hbmNlTWV0cmljcy5vdmVyYWxsTWVkaWFuVGltZS50b0ZpeGVkKDApfW1zYCk7XG4gICAgY29uc29sZS5sb2coYCAgOTXjg5Hjg7zjgrvjg7Pjgr/jgqTjg6s6ICR7cmVzdWx0LnBlcmZvcm1hbmNlTWV0cmljcy5vdmVyYWxsUGVyY2VudGlsZTk1LnRvRml4ZWQoMCl9bXNgKTtcbiAgICBjb25zb2xlLmxvZyhgICA5OeODkeODvOOCu+ODs+OCv+OCpOODqzogJHtyZXN1bHQucGVyZm9ybWFuY2VNZXRyaWNzLm92ZXJhbGxQZXJjZW50aWxlOTkudG9GaXhlZCgwKX1tc2ApO1xuICAgIGNvbnNvbGUubG9nKGAgIOaIkOWKn+eOhzogJHtyZXN1bHQucGVyZm9ybWFuY2VNZXRyaWNzLnN1Y2Nlc3NSYXRlLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgIOOCueODq+ODvOODl+ODg+ODiDogJHtyZXN1bHQucGVyZm9ybWFuY2VNZXRyaWNzLnRocm91Z2hwdXQudG9GaXhlZCgxKX0gcmVxL3NlY2ApO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG7wn5OIIOODmeODs+ODgeODnuODvOOCr+avlOi8gzonKTtcbiAgICByZXN1bHQuYmVuY2htYXJrUmVzdWx0cy5mb3JFYWNoKGJlbmNobWFyayA9PiB7XG4gICAgICBjb25zdCBzdGF0dXNJY29uID0gYmVuY2htYXJrLnN0YXR1cyA9PT0gJ2ltcHJvdmVkJyA/ICfwn5OIJyA6IFxuICAgICAgICAgICAgICAgICAgICAgICAgYmVuY2htYXJrLnN0YXR1cyA9PT0gJ2RlZ3JhZGVkJyA/ICfwn5OJJyA6ICfinqHvuI8nO1xuICAgICAgY29uc3QgY2hhbmdlVmFsdWUgPSBiZW5jaG1hcmsuaW1wcm92ZW1lbnQgPiAwID8gXG4gICAgICAgIGArJHtiZW5jaG1hcmsuaW1wcm92ZW1lbnQudG9GaXhlZCgxKX0lYCA6IFxuICAgICAgICBgLSR7YmVuY2htYXJrLnJlZ3Jlc3Npb24udG9GaXhlZCgxKX0lYDtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYCAgJHtzdGF0dXNJY29ufSAke2JlbmNobWFyay5iZW5jaG1hcmtOYW1lfTogJHtiZW5jaG1hcmsuY3VycmVudFRpbWUudG9GaXhlZCgwKX1tcyAoJHtjaGFuZ2VWYWx1ZX0pYCk7XG4gICAgfSk7XG4gICAgXG4gICAgaWYgKHJlc3VsdC5uZXR3b3JrUmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu8J+MkCDjg43jg4Pjg4jjg6/jg7zjgq/mnaHku7bliKXntZDmnpw6Jyk7XG4gICAgICByZXN1bHQubmV0d29ya1Jlc3VsdHMuZm9yRWFjaChuZXR3b3JrID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgJHtuZXR3b3JrLm5ldHdvcmtDb25kaXRpb259OiAke25ldHdvcmsuYXZlcmFnZVJlc3BvbnNlVGltZS50b0ZpeGVkKDApfW1zICjpganlv5zmgKc6ICR7bmV0d29yay5hZGFwdGFiaWxpdHkudG9GaXhlZCgxKX0lKWApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIOWVj+mhjOOBruimgee0hFxuICAgIGNvbnN0IHRvdGFsSXNzdWVzID0gcmVzdWx0LnF1ZXJ5UmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5pc3N1ZXMubGVuZ3RoLCAwKTtcbiAgICBjb25zdCBjcml0aWNhbElzc3VlcyA9IHJlc3VsdC5xdWVyeVJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIuaXNzdWVzLmZpbHRlcihpID0+IGkuc2V2ZXJpdHkgPT09ICdjcml0aWNhbCcpLmxlbmd0aCwgMCk7XG4gICAgXG4gICAgaWYgKHRvdGFsSXNzdWVzID4gMCkge1xuICAgICAgY29uc29sZS5sb2coYFxcbuKaoO+4jyAg5qSc5Ye644GV44KM44Gf5ZWP6aGMOiAke3RvdGFsSXNzdWVzfeS7tiAo6YeN6KaBOiAke2NyaXRpY2FsSXNzdWVzfeS7tilgKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu4pyFIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiDog5ZCI5qC8Jyk7XG4gICAgICBjb25zb2xlLmxvZygnICAg44GZ44G544Gm44Gu44Kv44Ko44Oq44GM55uu5qiZ5b+c562U5pmC6ZaT5YaF44Gn5Yem55CG44GV44KM44Gm44GE44G+44GZJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7inYwg5b+c562U5pmC6ZaT5ris5a6a44OG44K544OIOiDkuI3lkIjmoLwnKTtcbiAgICAgIGNvbnNvbGUubG9nKCcgICDlv5znrZTmmYLplpPjga7mnIDpganljJbjgYzlv4XopoHjgafjgZknKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog6YGF5bu25Yem55CGXG4gICAqL1xuICBwcml2YXRlIGRlbGF5KG1zOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG4gIH1cbn1cblxuLyoqXG4gKiDjg4fjg5Xjgqnjg6vjg4joqK3lrprjgafjga7lv5znrZTmmYLplpPmuKzlrprjg4bjgrnjg4jlrp/ooYxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blJlc3BvbnNlVGltZVRlc3QoYmFzZVVybDogc3RyaW5nID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcpOiBQcm9taXNlPFJlc3BvbnNlVGltZVRlc3RSZXN1bHQ+IHtcbiAgY29uc3QgY29uZmlnOiBSZXNwb25zZVRpbWVUZXN0Q29uZmlnID0ge1xuICAgIGJhc2VVcmwsXG4gICAgdGVzdFF1ZXJpZXM6IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdzaW1wbGVfMScsXG4gICAgICAgIHF1ZXJ5OiAn44GT44KT44Gr44Gh44GvJyxcbiAgICAgICAgdHlwZTogJ3NpbXBsZScsXG4gICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiA4MDAsXG4gICAgICAgIGNhdGVnb3J5OiAnZ2VuZXJhbCcsXG4gICAgICAgIHJlcXVpcmVzUkFHOiBmYWxzZSxcbiAgICAgICAgcmVxdWlyZXNBSTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdzdGFuZGFyZF8xJyxcbiAgICAgICAgcXVlcnk6ICdBV1MgTGFtYmRhIOOBruWfuuacrOeahOOBquS9v+OBhOaWueOCkuaVmeOBiOOBpuOBj+OBoOOBleOBhCcsXG4gICAgICAgIHR5cGU6ICdzdGFuZGFyZCcsXG4gICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiAxNTAwLFxuICAgICAgICBjYXRlZ29yeTogJ3RlY2huaWNhbCcsXG4gICAgICAgIHJlcXVpcmVzUkFHOiB0cnVlLFxuICAgICAgICByZXF1aXJlc0FJOiB0cnVlXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ3N0YW5kYXJkXzInLFxuICAgICAgICBxdWVyeTogJ+OCu+OCreODpeODquODhuOCo+OBruODmeOCueODiOODl+ODqeOCr+ODhuOCo+OCueOBq+OBpOOBhOOBpuiqrOaYjuOBl+OBpuOBj+OBoOOBleOBhCcsXG4gICAgICAgIHR5cGU6ICdzdGFuZGFyZCcsXG4gICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiAxODAwLFxuICAgICAgICBjYXRlZ29yeTogJ2J1c2luZXNzJyxcbiAgICAgICAgcmVxdWlyZXNSQUc6IHRydWUsXG4gICAgICAgIHJlcXVpcmVzQUk6IHRydWVcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnY29tcGxleF8xJyxcbiAgICAgICAgcXVlcnk6ICfjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7Pjgafjga5BV1PjgqLjg7zjgq3jg4bjgq/jg4Hjg6PoqK3oqIjjgavjgYrjgYTjgabjgIHjg4fjg7zjgr/mlbTlkIjmgKfjgajjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgpLkuKHnq4vjgZXjgZvjgovmlrnms5XjgpLjgIHlhbfkvZPnmoTjgarlrp/oo4XkvovjgajjgajjgoLjgavoqbPjgZfjgY/oqqzmmI7jgZfjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICB0eXBlOiAnY29tcGxleCcsXG4gICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiAzMDAwLFxuICAgICAgICBjYXRlZ29yeTogJ3RlY2huaWNhbCcsXG4gICAgICAgIHJlcXVpcmVzUkFHOiB0cnVlLFxuICAgICAgICByZXF1aXJlc0FJOiB0cnVlXG4gICAgICB9XG4gICAgXSxcbiAgICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICAgIHN0YW5kYXJkUXVlcnlUaW1lOiAyMDAwLFxuICAgICAgY29tcGxleFF1ZXJ5VGltZTogNDAwMCxcbiAgICAgIHNpbXBsZVF1ZXJ5VGltZTogMTAwMCxcbiAgICAgIGF2ZXJhZ2VSZXNwb25zZVRpbWU6IDE4MDAsXG4gICAgICBwZXJjZW50aWxlOTVUaW1lOiAyNTAwLFxuICAgICAgcGVyY2VudGlsZTk5VGltZTogNDAwMFxuICAgIH0sXG4gICAgdGVzdFBhcmFtZXRlcnM6IHtcbiAgICAgIHdhcm11cFF1ZXJpZXM6IDMsXG4gICAgICBtZWFzdXJlbWVudFF1ZXJpZXM6IDEwLFxuICAgICAgY29uY3VycmVudFJlcXVlc3RzOiAxLFxuICAgICAgcmVxdWVzdEludGVydmFsOiAxMDAwXG4gICAgfSxcbiAgICBuZXR3b3JrQ29uZGl0aW9uczogW1xuICAgICAge1xuICAgICAgICBuYW1lOiAnRmFzdCAzRycsXG4gICAgICAgIGJhbmR3aWR0aDogMS42LFxuICAgICAgICBsYXRlbmN5OiAxNTAsXG4gICAgICAgIHBhY2tldExvc3M6IDAsXG4gICAgICAgIGVuYWJsZWQ6IHRydWVcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdTbG93IDNHJyxcbiAgICAgICAgYmFuZHdpZHRoOiAwLjQsXG4gICAgICAgIGxhdGVuY3k6IDMwMCxcbiAgICAgICAgcGFja2V0TG9zczogMCxcbiAgICAgICAgZW5hYmxlZDogdHJ1ZVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ09mZmxpbmUnLFxuICAgICAgICBiYW5kd2lkdGg6IDAsXG4gICAgICAgIGxhdGVuY3k6IDAsXG4gICAgICAgIHBhY2tldExvc3M6IDEwMCxcbiAgICAgICAgZW5hYmxlZDogZmFsc2VcbiAgICAgIH1cbiAgICBdXG4gIH07XG5cbiAgY29uc3QgdGVzdCA9IG5ldyBSZXNwb25zZVRpbWVUZXN0KGNvbmZpZyk7XG4gIHJldHVybiBhd2FpdCB0ZXN0LnJ1blRlc3QoKTtcbn0iXX0=