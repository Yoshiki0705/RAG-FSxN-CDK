/**
 * パフォーマンス統合テストランナー
 * 全パフォーマンステストの統合実行と結果集計
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { TestResult } from '../../types/test-types';
import { ResponseTimeTestResult } from './response-time-test';
import { ConcurrentLoadTestResult } from './concurrent-load-test';
import { UptimeMonitoringTestResult } from './uptime-monitoring-test';
import { MultiRegionScalabilityTestResult } from './multi-region-scalability-test';
export interface PerformanceIntegrationTestConfig {
    baseUrl: string;
    enabledTests: {
        responseTime: boolean;
        concurrentLoad: boolean;
        uptimeMonitoring: boolean;
        multiRegionScalability: boolean;
    };
    testEnvironment: 'development' | 'staging' | 'production';
    performanceTargets: {
        maxResponseTime: number;
        minThroughput: number;
        minUptime: number;
        maxConcurrentUsers: number;
    };
    testDuration: {
        responseTime: number;
        loadTest: number;
        uptimeMonitoring: number;
        scalabilityTest: number;
    };
}
export interface PerformanceIntegrationTestResult extends TestResult {
    responseTimeResult?: ResponseTimeTestResult;
    concurrentLoadResult?: ConcurrentLoadTestResult;
    uptimeMonitoringResult?: UptimeMonitoringTestResult;
    multiRegionScalabilityResult?: MultiRegionScalabilityTestResult;
    overallPerformanceScore: number;
    responseTimeScore: number;
    scalabilityScore: number;
    reliabilityScore: number;
    globalPerformanceScore: number;
    performanceSummary: PerformanceSummary;
    recommendations: string[];
}
export interface PerformanceSummary {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageResponseTime: number;
    peakThroughput: number;
    systemUptime: number;
    maxSupportedUsers: number;
    criticalIssues: number;
    performanceBottlenecks: string[];
    scalabilityLimitations: string[];
}
export declare class PerformanceIntegrationTestRunner {
    private config;
    private testStartTime;
    constructor(config: PerformanceIntegrationTestConfig);
    /**
     * 設定の検証
     */
    private validateConfig;
    /**
     * パフォーマンス統合テストの実行
     */
    runTests(): Promise<PerformanceIntegrationTestResult>;
    /**
     * 応答時間測定テストの実行
     */
    private runResponseTimeTest;
    /**
     * 同時ユーザー負荷テストの実行
     */
    private runConcurrentLoadTest;
    /**
     * 稼働率監視テストの実行
     */
    private runUptimeMonitoringTest;
    /**
     * マルチリージョンスケーラビリティテストの実行
     */
    private runMultiRegionScalabilityTest;
    /**
     * テスト結果の統合と評価
     */
    private aggregateResults;
    /**
     * パフォーマンスボトルネックの特定
     */
    private identifyPerformanceBottlenecks;
    /**
     * スケーラビリティ制限の特定
     */
    private identifyScalabilityLimitations;
    /**
     * 改善推奨事項の生成
     */
    private generateRecommendations;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
/**
 * デフォルト設定でのパフォーマンス統合テスト実行
 */
export declare function runPerformanceIntegrationTest(baseUrl?: string, testEnvironment?: 'development' | 'staging' | 'production'): Promise<PerformanceIntegrationTestResult>;
