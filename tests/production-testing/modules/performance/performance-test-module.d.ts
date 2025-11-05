/**
 * パフォーマンステストモジュール
 *
 * 実本番環境での応答時間とスループットの測定
 * 負荷テストと同時ユーザー対応能力の検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * パフォーマンステスト結果インターフェース
 */
export interface PerformanceTestResult extends TestResult {
    performanceMetrics?: {
        responseTime: number;
        throughput: number;
        concurrentUsers: number;
        successRate: number;
        errorRate: number;
        averageLatency: number;
        p95Latency: number;
        p99Latency: number;
    };
    loadTestResults?: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        requestsPerSecond: number;
        averageResponseTime: number;
        maxResponseTime: number;
        minResponseTime: number;
    };
    resourceUsage?: {
        cpuUtilization: number;
        memoryUtilization: number;
        networkIO: number;
        diskIO: number;
    };
    scalabilityMetrics?: {
        maxConcurrentUsers: number;
        degradationPoint: number;
        recoveryTime: number;
    };
}
/**
 * 負荷テスト設定
 */
export interface LoadTestConfig {
    concurrentUsers: number;
    testDuration: number;
    rampUpTime: number;
    requestInterval: number;
    maxRequests: number;
}
/**
 * パフォーマンステストシナリオ
 */
export interface PerformanceTestScenario {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: any;
    headers?: Record<string, string>;
    expectedResponseTime: number;
    weight: number;
}
/**
 * パフォーマンステストモジュールクラス
 */
export declare class PerformanceTestModule {
    private config;
    private cloudWatchClient;
    private cloudFrontClient;
    private lambdaClient;
    private testScenarios;
    constructor(config: ProductionConfig);
    /**
     * テストシナリオの読み込み
     */
    private loadTestScenarios;
    /**
     * 応答時間測定テスト
     */
    testResponseTime(): Promise<PerformanceTestResult>;
    /**
     * 同時ユーザー負荷テスト
     */
    testConcurrentUserLoad(): Promise<PerformanceTestResult>;
    /**
     * スケーラビリティテスト
     */
    testScalability(): Promise<PerformanceTestResult>;
}
