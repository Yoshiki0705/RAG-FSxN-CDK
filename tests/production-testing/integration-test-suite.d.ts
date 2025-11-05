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
interface IntegrationTestSuiteConfig {
    executionMode: 'sequential' | 'parallel' | 'hybrid';
    enabledModules: {
        authentication: boolean;
        accessControl: boolean;
        chatbot: boolean;
        performance: boolean;
        uiUx: boolean;
        security: boolean;
        integration: boolean;
    };
    execution: {
        maxParallelTests: number;
        timeoutPerModule: number;
        retryAttempts: number;
        stopOnFirstFailure: boolean;
        emergencyStopEnabled: boolean;
    };
    reporting: {
        generateDetailedReport: boolean;
        generateExecutiveSummary: boolean;
        includePerformanceMetrics: boolean;
        includeScreenshots: boolean;
        outputFormat: 'json' | 'html' | 'both';
    };
    qualityThresholds: {
        minimumPassRate: number;
        maxAcceptableResponseTime: number;
        minSecurityScore: number;
        minAccessibilityScore: number;
    };
}
interface IntegrationTestResult {
    overall: {
        success: boolean;
        totalTests: number;
        passedTests: number;
        failedTests: number;
        skippedTests: number;
        executionTime: number;
        qualityScore: number;
    };
    modules: {
        authentication?: any;
        accessControl?: any;
        chatbot?: any;
        performance?: any;
        uiUx?: any;
        security?: any;
        integration?: any;
    };
    analysis: {
        criticalIssues: string[];
        recommendations: string[];
        performanceBottlenecks: string[];
        securityConcerns: string[];
    };
    metadata: {
        startTime: string;
        endTime: string;
        environment: string;
        testSuiteVersion: string;
        browserInfo?: any;
    };
}
/**
 * 統合テストスイートクラス
 */
export declare class IntegrationTestSuite {
    private config;
    private testEngine;
    private emergencyStop;
    private connectionManager;
    private authModule;
    private accessModule;
    private chatbotModule;
    private performanceModule;
    private uiUxModule;
    private securityModule;
    private integrationModule;
    constructor(config: IntegrationTestSuiteConfig);
    /**
     * コンポーネントの初期化
     */
    private initializeComponents;
    /**
     * 統合テストスイートの実行
     */
    execute(): Promise<IntegrationTestResult>;
    /**
     * テストの実行
     */
    private executeTests;
    /**
     * 順次実行
     */
    private executeSequential;
    /**
     * 並列実行
     */
    private executeParallel;
    /**
     * ハイブリッド実行（依存関係を考慮した最適化実行）
     */
    private executeHybrid;
    /**
     * 個別モジュールの実行
     */
    private executeModule;
    /**
     * 実行順序の取得
     */
    private getExecutionOrder;
    /**
     * 配列のチャンク分割
     */
    private chunkArray;
    /**
     * 結果分析
     */
    private analyzeResults;
    /**
     * モジュール別結果分析
     */
    private analyzeModuleResult;
    /**
     * 統合結果の構築
     */
    private buildIntegrationResult;
    /**
     * クリーンアップ
     */
    private cleanup;
}
export declare const DefaultIntegrationTestSuiteConfig: IntegrationTestSuiteConfig;
export {};
