/**
 * UI/UXテスト実行ランナー
 *
 * Kiro MCP Chrome DevToolsを使用した実ブラウザでのUI/UXテストを安全に実行
 * テスト結果の収集と報告を行う
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { UIUXTestResult } from './ui-ux-test-module';
import ProductionTestEngine, { TestSuite } from '../../core/production-test-engine';
import { ProductionConfig } from '../../config/production-config';
/**
 * UI/UXテスト実行ランナークラス
 */
export declare class UIUXTestRunner {
    private config;
    private testModule;
    private testEngine;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * UI/UXテストスイートの作成
     */
    createUIUXTestSuite(): TestSuite;
    /**
     * UI/UXテストの実行
     */
    runUIUXTests(): Promise<{
        success: boolean;
        results: Map<string, UIUXTestResult>;
        summary: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
            skippedTests: number;
            successRate: number;
            totalDuration: number;
            overallUIUXScore: number;
            averagePageLoadTime: number;
            wcagComplianceRate: number;
            responsiveCompatibility: number;
            usabilityScore: number;
        };
    }>;
    /**
     * テスト結果サマリーの生成
     */
    private generateTestSummary;
    /**
     * 平均ページ読み込み時間の計算
     */
    private calculateAveragePageLoadTime;
    /**
     * WCAG準拠率の計算
     */
    private calculateWCAGComplianceRate;
    /**
     * レスポンシブ互換性の計算
     */
    private calculateResponsiveCompatibility;
    /**
     * ユーザビリティスコアの計算
     */
    private calculateUsabilityScore;
    /**
     * 総合UI/UXスコアの計算
     */
    private calculateOverallUIUXScore;
    /**
     * パフォーマンススコアの計算
     */
    private calculatePerformanceScore;
    /**
     * アクセシビリティスコアの計算
     */
    private calculateAccessibilityScore;
    /**
     * ユーザビリティテストスコアの計算
     */
    private calculateUsabilityTestScore;
    /**
     * 詳細レポートの生成
     */
    generateDetailedReport(results: Map<string, UIUXTestResult>): Promise<string>;
    /**
     * ビューポート結果のフォーマット
     */
    private formatViewportResult;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default UIUXTestRunner;
