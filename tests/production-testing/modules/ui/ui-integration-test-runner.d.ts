/**
 * UI統合テストランナー
 * 全UIテストの統合実行と結果集計
 */
import { TestResult } from '../../types/test-types';
import { ResponsiveTestResult } from './responsive-design-test';
import { RealtimeChatTestResult } from './realtime-chat-test';
import { DocumentSourceTestResult } from './document-source-display-test';
import { AccessibilityTestResult } from './accessibility-test';
export interface UIIntegrationTestConfig {
    baseUrl: string;
    enabledTests: {
        responsiveDesign: boolean;
        realtimeChat: boolean;
        documentSourceDisplay: boolean;
        accessibility: boolean;
    };
    testEnvironment: 'development' | 'staging' | 'production';
    browserConfig: {
        headless: boolean;
        viewport: {
            width: number;
            height: number;
        };
        timeout: number;
    };
    reportingConfig: {
        generateScreenshots: boolean;
        generateVideoRecording: boolean;
        detailedLogs: boolean;
    };
}
export interface UIIntegrationTestResult extends TestResult {
    responsiveDesignResult?: ResponsiveTestResult;
    realtimeChatResult?: RealtimeChatTestResult;
    documentSourceDisplayResult?: DocumentSourceTestResult;
    accessibilityResult?: AccessibilityTestResult;
    overallUIScore: number;
    userExperienceScore: number;
    performanceScore: number;
    accessibilityScore: number;
    functionalityScore: number;
    testSummary: TestSummary;
    recommendations: string[];
}
export interface TestSummary {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalIssues: number;
    majorIssues: number;
    minorIssues: number;
    testCoverage: number;
    executionTime: number;
}
export declare class UIIntegrationTestRunner {
    private config;
    private testStartTime;
    constructor(config: UIIntegrationTestConfig);
    /**
     * UI統合テストの実行
     */
    runTests(): Promise<UIIntegrationTestResult>;
    /**
     * レスポンシブデザインテストの実行
     */
    private runResponsiveDesignTest;
    /**
     * リアルタイムチャットテストの実行
     */
    private runRealtimeChatTest;
    /**
     * 文書ソース表示テストの実行
     */
    private runDocumentSourceDisplayTest;
    /**
     * アクセシビリティテストの実行
     */
    private runAccessibilityTest;
    /**
     * 結果の統合と評価
     */
    private aggregateResults;
    /**
     * パフォーマンススコアの計算
     */
    private calculatePerformanceScore;
    /**
     * テストサマリーの作成
     */
    private createTestSummary;
    /**
     * 推奨事項の生成
     */
    private generateRecommendations;
    /**
     * レポート生成
     */
    private generateReports;
}
/**
 * デフォルト設定でのUI統合テスト実行
 */
export declare function runUIIntegrationTest(baseUrl?: string, testEnvironment?: 'development' | 'staging' | 'production'): Promise<UIIntegrationTestResult>;
