/**
 * 同時ユーザー負荷テスト
 * 100 人以上の同時アクセステスト実装
 * 負荷分散とスケーラビリティ検証コード作成
 */
import { TestResult } from '../../core/production-test-engine';
import { ProductionConfig } from '../../config/production-config';
export interface ConcurrentLoadTestConfig {
    baseUrl: string;
    loadScenarios: LoadScenario[];
    userProfiles: UserProfile[];
    testDuration: number;
    rampUpTime: number;
    rampDownTime: number;
    thresholds: {
        maxResponseTime: number;
        maxErrorRate: number;
        minThroughput: number;
        maxCpuUsage: number;
        maxMemoryUsage: number;
    };
}
export interface LoadScenario {
    name: string;
    concurrentUsers: number;
    duration: number;
    userBehavior: UserBehavior;
    enabled: boolean;
}
export interface UserProfile {
    type: 'light' | 'moderate' | 'heavy';
    weight: number;
    actionsPerMinute: number;
    sessionDuration: number;
    queryComplexity: 'simple' | 'standard' | 'complex';
}
export interface UserBehavior {
    loginFrequency: number;
    chatFrequency: number;
    searchFrequency: number;
    idleTime: number;
    sessionLength: number;
}
export interface ConcurrentLoadTestResult extends TestResult {
    scenarioResults: ScenarioResult[];
    systemMetrics: SystemMetrics;
    performanceBreakdown: PerformanceBreakdown;
    scalabilityAnalysis: ScalabilityAnalysis;
    overallLoadScore: number;
    throughputScore: number;
    stabilityScore: number;
    resourceEfficiencyScore: number;
}
export interface ScenarioResult {
    scenarioName: string;
    concurrentUsers: number;
    duration: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    medianResponseTime: number;
    percentile95ResponseTime: number;
    percentile99ResponseTime: number;
    throughput: number;
    errorRate: number;
    userMetrics: UserMetrics[];
    timeSeriesData: TimeSeriesData[];
    bottlenecks: Bottleneck[];
    success: boolean;
}
export interface UserMetrics {
    userId: string;
    userType: string;
    totalActions: number;
    successfulActions: number;
    averageResponseTime: number;
    sessionDuration: number;
    errors: string[];
}
export interface TimeSeriesData {
    timestamp: number;
    activeUsers: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
}
export interface SystemMetrics {
    peakConcurrentUsers: number;
    peakThroughput: number;
    averageCpuUsage: number;
    peakCpuUsage: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    networkUtilization: number;
    databaseConnections: number;
    cacheHitRate: number;
}
export interface PerformanceBreakdown {
    authenticationTime: number;
    databaseQueryTime: number;
    aiProcessingTime: number;
    networkLatency: number;
    renderingTime: number;
    cachePerformance: CachePerformance;
}
export interface CachePerformance {
    hitRate: number;
    missRate: number;
    averageHitTime: number;
    averageMissTime: number;
}
export interface ScalabilityAnalysis {
    linearScalability: number;
    breakingPoint: number;
    resourceBottlenecks: string[];
    scalabilityRecommendations: string[];
}
export interface Bottleneck {
    type: 'cpu' | 'memory' | 'database' | 'network' | 'application';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    impact: string;
    recommendation: string;
    detectedAt: number;
}
export declare class ConcurrentLoadTest {
    private config;
    private productionConfig;
    private testStartTime;
    private activeUsers;
    private metricsCollector;
    private isRunning;
    constructor(config: ConcurrentLoadTestConfig, productionConfig: ProductionConfig);
    /**
     * 同時ユーザー負荷テストの実行
     */
    runTest(): Promise<ConcurrentLoadTestResult>;
    /**
     * 負荷シナリオの実行
     */
    private executeLoadScenarios;
    /**
     * 単一シナリオの実行
     */
    private executeScenario;
    /**
     * ユーザーセッションの作成
     */
    private createUserSessions;
    /**
     * ユーザープロファイルの選択
     */
    private selectUserProfile;
    /**
     * ユーザーのランプアップ
     */
    private rampUpUsers;
    /**
     * ユーザーセッションの実行
     */
    private executeUserSession;
    /**
     * ユーザーのランプダウン
     */
    private rampDownUsers;
    /**
     * 現在のメトリクス収集
     */
    private collectCurrentMetrics;
    /**
     * ボトルネックの検出
     */
    private detectBottlenecks;
    /**
     * システムメトリクスの収集
     */
    private collectSystemMetrics;
    /**
     * パフォーマンス分析
     */
    private analyzePerformanceBreakdown;
    /**
     * スケーラビリティ分析
     */
    private analyzeScalability;
    /**
     * スコアの計算
     */
    private calculateScores;
    /**
     * パーセンタイルの計算
     */
    private calculatePercentile;
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
 * デフォルト設定での同時ユーザー負荷テスト実行
 */
export declare function runConcurrentLoadTest(baseUrl?: string, productionConfig?: ProductionConfig): Promise<ConcurrentLoadTestResult>;
export default ConcurrentLoadTest;
