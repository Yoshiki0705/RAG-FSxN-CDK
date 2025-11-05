/**
 * 応答時間測定テスト
 * 標準クエリの 2 秒以内応答検証テスト実装
 * 応答時間ベンチマーク測定コード作成
 */
import { TestResult } from '../../types/test-types';
export interface ResponseTimeTestConfig {
    baseUrl: string;
    testQueries: TestQuery[];
    performanceThresholds: {
        standardQueryTime: number;
        complexQueryTime: number;
        simpleQueryTime: number;
        averageResponseTime: number;
        percentile95Time: number;
        percentile99Time: number;
    };
    testParameters: {
        warmupQueries: number;
        measurementQueries: number;
        concurrentRequests: number;
        requestInterval: number;
    };
    networkConditions: NetworkCondition[];
}
export interface TestQuery {
    id: string;
    query: string;
    type: 'simple' | 'standard' | 'complex';
    expectedResponseTime: number;
    category: 'technical' | 'business' | 'general';
    requiresRAG: boolean;
    requiresAI: boolean;
}
export interface NetworkCondition {
    name: string;
    bandwidth: number;
    latency: number;
    packetLoss: number;
    enabled: boolean;
}
export interface ResponseTimeTestResult extends TestResult {
    queryResults: QueryResponseResult[];
    performanceMetrics: PerformanceMetrics;
    benchmarkResults: BenchmarkResult[];
    networkResults: NetworkPerformanceResult[];
    overallResponseScore: number;
    reliabilityScore: number;
    consistencyScore: number;
    scalabilityScore: number;
}
export interface QueryResponseResult {
    queryId: string;
    query: string;
    queryType: string;
    measurements: ResponseMeasurement[];
    statistics: ResponseStatistics;
    success: boolean;
    issues: PerformanceIssue[];
}
export interface ResponseMeasurement {
    attempt: number;
    timestamp: number;
    responseTime: number;
    ttfb: number;
    domContentLoaded: number;
    loadComplete: number;
    networkTime: number;
    processingTime: number;
    renderTime: number;
    success: boolean;
    errorMessage?: string;
}
export interface ResponseStatistics {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    percentile95: number;
    percentile99: number;
    successRate: number;
    errorRate: number;
}
export interface PerformanceMetrics {
    overallAverageTime: number;
    overallMedianTime: number;
    overallPercentile95: number;
    overallPercentile99: number;
    successRate: number;
    errorRate: number;
    throughput: number;
    reliability: number;
    consistency: number;
}
export interface BenchmarkResult {
    benchmarkName: string;
    baselineTime: number;
    currentTime: number;
    improvement: number;
    regression: number;
    status: 'improved' | 'maintained' | 'degraded';
}
export interface NetworkPerformanceResult {
    networkCondition: string;
    averageResponseTime: number;
    successRate: number;
    degradationFactor: number;
    adaptability: number;
}
export interface PerformanceIssue {
    type: 'timeout' | 'slow_response' | 'high_variance' | 'error_rate';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    impact: string;
    recommendation: string;
    affectedQueries: string[];
}
export declare class ResponseTimeTest {
    private config;
    private testStartTime;
    private baselineMetrics;
    constructor(config: ResponseTimeTestConfig);
    /**
     * 応答時間測定テストの実行
     */
    runTest(): Promise<ResponseTimeTestResult>;
    /**
     * ベースライン値の初期化
     */
    private initializeBaselines;
    /**
     * ウォームアップの実行
     */
    private performWarmup;
    /**
     * クエリ別応答時間テストの実行
     */
    private testQueryResponseTimes;
    /**
     * 単一クエリの応答時間測定
     */
    private measureQueryResponseTime;
    /**
     * 単一測定の実行
     */
    private executeSingleMeasurement;
    /**
     * クエリの実行
     */
    private executeQuery;
    /**
     * レンダリング時間の測定
     */
    private measureRenderTime;
    /**
     * 統計の計算
     */
    private calculateStatistics;
    /**
     * パーセンタイルの計算
     */
    private calculatePercentile;
    /**
     * ネットワーク条件別テストの実行
     */
    private testNetworkConditions;
    /**
     * 特定ネットワーク条件下でのテスト
     */
    private testUnderNetworkCondition;
    /**
     * ネットワーク条件のシミュレーション
     */
    private simulateNetworkCondition;
    /**
     * ベンチマーク比較の実行
     */
    private performBenchmarkComparison;
    /**
     * パフォーマンスメトリクスの計算
     */
    private calculatePerformanceMetrics;
    /**
     * スコアの計算
     */
    private calculateScores;
    /**
     * テスト結果のログ出力
     */
    private logTestResults;
    /**
     * 遅延処理
     */
    private delay;
}
/**
 * デフォルト設定での応答時間測定テスト実行
 */
export declare function runResponseTimeTest(baseUrl?: string): Promise<ResponseTimeTestResult>;
