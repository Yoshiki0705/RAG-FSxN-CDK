#!/usr/bin/env node
/**
 * 統合テストランナー
 * セキュリティ、パフォーマンス、機能テストの統合実行
 * 本番環境での包括的なシステム検証を実行
 */
import { ProductionConfig } from './config/production-config';
export interface IntegratedTestConfig {
    environment: string;
    testSuites: TestSuiteConfig[];
    executionOrder: string[];
    parallelExecution: boolean;
    maxConcurrentTests: number;
    timeoutMs: number;
    retryAttempts: number;
    emergencyStopEnabled: boolean;
    reportingConfig: ReportingConfig;
    resourceLimits: ResourceLimits;
}
export interface TestSuiteConfig {
    name: string;
    enabled: boolean;
    priority: number;
    dependencies: string[];
    configuration: any;
    skipOnFailure: boolean;
    criticalTest: boolean;
}
export interface ReportingConfig {
    generateDetailedReport: boolean;
    exportFormats: ('json' | 'html' | 'pdf' | 'csv')[];
    outputDirectory: string;
    includeMetrics: boolean;
    includeScreenshots: boolean;
    includeLogs: boolean;
}
export interface ResourceLimits {
    maxCpuUsage: number;
    maxMemoryUsage: number;
    maxNetworkBandwidth: number;
    maxStorageUsage: number;
    maxCostThreshold: number;
}
export interface IntegratedTestResult {
    testRunId: string;
    startTime: Date;
    endTime: Date;
    totalDuration: number;
    overallSuccess: boolean;
    testSuiteResults: Map<string, TestSuiteResult>;
    summary: TestSummary;
    metrics: TestMetrics;
    recommendations: string[];
    errors: string[];
}
export interface TestSuiteResult {
    suiteName: string;
    success: boolean;
    duration: number;
    testCount: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    score: number;
    details: any;
    errors: string[];
}
export interface TestSummary {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    overallScore: number;
    securityScore: number;
    performanceScore: number;
    functionalScore: number;
    criticalIssues: number;
    recommendations: string[];
}
export interface TestMetrics {
    executionTime: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        network: number;
        storage: number;
    };
    costEstimate: number;
    coverage: {
        security: number;
        performance: number;
        functional: number;
    };
}
export declare class IntegratedTestRunner {
    private config;
    private productionConfig;
    private testEngine;
    private emergencyStopManager?;
    private securityRunner?;
    private performanceRunner?;
    private functionalRunner?;
    private testRunId;
    constructor(config: IntegratedTestConfig, productionConfig: ProductionConfig);
    /**
     * 統合テストランナーの初期化
     */
    initialize(): Promise<void>;
    /**
     * 各テストランナーの初期化
     */
    private initializeTestRunners;
    /**
     * 統合テストの実行
     */
    runIntegratedTests(): Promise<IntegratedTestResult>;
    /**
     * テストスイートの実行順序を決定
     */
    private determineExecutionOrder;
    /**
     * テストスイートの順次実行
     */
    private runTestSuitesSequentially;
    /**
     * テストスイートの並列実行
     */
    private runTestSuitesInParallel;
    /**
     * 依存関係を考慮した実行バッチの作成
     */
    private createExecutionBatches;
    /**
     * 個別テストスイートの実行
     */
    private runTestSuite;
    /**
     * セキュリティテストの実行
     */
    private runSecurityTests;
    /**
     * パフォーマンステストの実行
     */
    private runPerformanceTests;
    /**
     * 機能テストの実行
     */
    private runFunctionalTests;
    /**
     * テストサマリーの生成
     */
    private generateTestSummary;
    /**
     * テストメトリクスの生成
     */
    private generateTestMetrics;
    /**
     * 推奨事項の生成
     */
    private generateRecommendations;
    /**
     * テスト結果の表示
     */
    private displayTestResults;
    /**
     * 詳細レポートの生成
     */
    private generateDetailedReport;
}
export default IntegratedTestRunner;
