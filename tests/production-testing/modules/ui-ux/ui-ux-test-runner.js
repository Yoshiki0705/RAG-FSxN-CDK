"use strict";
/**
 * UI/UXテスト実行ランナー
 *
 * Kiro MCP Chrome DevToolsを使用した実ブラウザでのUI/UXテストを安全に実行
 * テスト結果の収集と報告を行う
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIUXTestRunner = void 0;
const ui_ux_test_module_1 = __importDefault(require("./ui-ux-test-module"));
/**
 * UI/UXテスト実行ランナークラス
 */
class UIUXTestRunner {
    config;
    testModule;
    testEngine;
    constructor(config, testEngine) {
        this.config = config;
        this.testEngine = testEngine;
        this.testModule = new ui_ux_test_module_1.default(config);
    }
    /**
     * UI/UXテストスイートの作成
     */
    createUIUXTestSuite() {
        const testDefinitions = [
            {
                testId: 'ui-responsive-001',
                testName: 'レスポンシブデザインテスト',
                category: 'ui-ux',
                description: 'モバイル、タブレット、デスクトップでの表示とレイアウトの適応性テスト',
                timeout: 180000, // 3分
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testResponsiveDesign();
                }
            },
            {
                testId: 'ui-chat-001',
                testName: 'チャットインターフェーステスト',
                category: 'ui-ux',
                description: 'チャット機能のユーザビリティと操作性の評価',
                timeout: 240000, // 4分
                retryCount: 2,
                dependencies: ['ui-responsive-001'],
                execute: async (engine) => {
                    return await this.testModule.testChatInterface();
                }
            },
            {
                testId: 'ui-accessibility-001',
                testName: 'アクセシビリティテスト',
                category: 'ui-ux',
                description: 'WCAG 2.1 AA準拠とアクセシビリティ機能の包括的評価',
                timeout: 300000, // 5分
                retryCount: 1,
                dependencies: ['ui-responsive-001'],
                execute: async (engine) => {
                    return await this.testModule.testAccessibility();
                }
            },
            {
                testId: 'ui-usability-001',
                testName: 'ユーザビリティテスト',
                category: 'ui-ux',
                description: 'ユーザーエクスペリエンスと操作効率の総合評価',
                timeout: 360000, // 6分
                retryCount: 1,
                dependencies: ['ui-chat-001'],
                execute: async (engine) => {
                    return await this.testModule.testUsability();
                }
            }
        ];
        return {
            suiteId: 'ui-ux-test-suite',
            suiteName: 'UI/UXテストスイート',
            description: '実本番環境でのユーザーインターフェースとユーザーエクスペリエンスの包括評価',
            tests: testDefinitions,
            configuration: {
                parallel: false, // UI/UXテストは順次実行
                maxConcurrency: 1,
                failFast: false, // 一つのテストが失敗しても他のテストを継続
                continueOnError: true
            }
        };
    }
    /**
     * UI/UXテストの実行
     */
    async runUIUXTests() {
        console.log('🚀 UI/UXテストスイートを実行開始...');
        try {
            // テストスイートの作成
            const testSuite = this.createUIUXTestSuite();
            // テストエンジンでの実行
            const results = await this.testEngine.executeTestSuite(testSuite);
            // 結果の集計
            const summary = this.generateTestSummary(results);
            console.log('📊 UI/UXテスト実行結果:');
            console.log(`   総テスト数: ${summary.totalTests}`);
            console.log(`   成功: ${summary.passedTests}`);
            console.log(`   失敗: ${summary.failedTests}`);
            console.log(`   スキップ: ${summary.skippedTests}`);
            console.log(`   成功率: ${(summary.successRate * 100).toFixed(1)}%`);
            console.log(`   総合UI/UXスコア: ${(summary.overallUIUXScore * 100).toFixed(1)}%`);
            console.log(`   平均ページ読み込み時間: ${summary.averagePageLoadTime.toFixed(0)}ms`);
            console.log(`   WCAG準拠率: ${(summary.wcagComplianceRate * 100).toFixed(1)}%`);
            console.log(`   レスポンシブ互換性: ${(summary.responsiveCompatibility * 100).toFixed(1)}%`);
            console.log(`   ユーザビリティスコア: ${(summary.usabilityScore * 100).toFixed(1)}%`);
            console.log(`   総実行時間: ${summary.totalDuration}ms`);
            const success = summary.failedTests === 0;
            if (success) {
                console.log('✅ UI/UXテストスイート実行完了 - 全テスト成功');
            }
            else {
                console.log('⚠️ UI/UXテストスイート実行完了 - 一部テスト失敗');
            }
            return {
                success,
                results: results,
                summary
            };
        }
        catch (error) {
            console.error('❌ UI/UXテスト実行エラー:', error);
            throw error;
        }
    }
    /**
     * テスト結果サマリーの生成
     */
    generateTestSummary(results) {
        const resultsArray = Array.from(results.values());
        const totalTests = resultsArray.length;
        const passedTests = resultsArray.filter(r => r.success).length;
        const failedTests = resultsArray.filter(r => !r.success && r.status !== 'SKIPPED').length;
        const skippedTests = resultsArray.filter(r => r.status === 'SKIPPED').length;
        const successRate = totalTests > 0 ? passedTests / totalTests : 0;
        const totalDuration = resultsArray.reduce((sum, r) => sum + (r.duration || 0), 0);
        // UI/UX指標の計算
        const uiResults = resultsArray.filter(r => r.uiMetrics || r.responsiveMetrics || r.accessibilityMetrics || r.usabilityMetrics);
        const averagePageLoadTime = this.calculateAveragePageLoadTime(uiResults);
        const wcagComplianceRate = this.calculateWCAGComplianceRate(uiResults);
        const responsiveCompatibility = this.calculateResponsiveCompatibility(uiResults);
        const usabilityScore = this.calculateUsabilityScore(uiResults);
        // 総合UI/UXスコアの計算
        const overallUIUXScore = this.calculateOverallUIUXScore(resultsArray);
        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            successRate,
            totalDuration,
            overallUIUXScore,
            averagePageLoadTime,
            wcagComplianceRate,
            responsiveCompatibility,
            usabilityScore
        };
    }
    /**
     * 平均ページ読み込み時間の計算
     */
    calculateAveragePageLoadTime(results) {
        const loadTimes = results
            .filter(r => r.uiMetrics && r.uiMetrics.pageLoadTime)
            .map(r => r.uiMetrics.pageLoadTime);
        return loadTimes.length > 0
            ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
            : 0;
    }
    /**
     * WCAG準拠率の計算
     */
    calculateWCAGComplianceRate(results) {
        const wcagScores = results
            .filter(r => r.accessibilityMetrics && r.accessibilityMetrics.wcagAACompliance)
            .map(r => r.accessibilityMetrics.wcagAACompliance);
        return wcagScores.length > 0
            ? wcagScores.reduce((sum, score) => sum + score, 0) / wcagScores.length
            : 0;
    }
    /**
     * レスポンシブ互換性の計算
     */
    calculateResponsiveCompatibility(results) {
        const responsiveResults = results.filter(r => r.responsiveMetrics);
        if (responsiveResults.length === 0)
            return 0;
        let totalScore = 0;
        let scoreCount = 0;
        responsiveResults.forEach(result => {
            const metrics = result.responsiveMetrics;
            ['mobileViewport', 'tabletViewport', 'desktopViewport'].forEach(viewport => {
                if (metrics[viewport]) {
                    const viewportMetrics = metrics[viewport];
                    const score = [
                        viewportMetrics.layoutStability,
                        viewportMetrics.contentVisibility,
                        viewportMetrics.navigationUsability,
                        viewportMetrics.textReadability,
                        viewportMetrics.buttonAccessibility
                    ].filter(Boolean).length / 5;
                    totalScore += score;
                    scoreCount++;
                }
            });
        });
        return scoreCount > 0 ? totalScore / scoreCount : 0;
    }
    /**
     * ユーザビリティスコアの計算
     */
    calculateUsabilityScore(results) {
        const usabilityResults = results.filter(r => r.usabilityMetrics);
        if (usabilityResults.length === 0)
            return 0;
        let totalScore = 0;
        let scoreCount = 0;
        usabilityResults.forEach(result => {
            const metrics = result.usabilityMetrics;
            const score = (metrics.navigationEfficiency +
                metrics.formUsability +
                metrics.errorHandling +
                metrics.userFlowCompletion) / 4;
            totalScore += score;
            scoreCount++;
        });
        return scoreCount > 0 ? totalScore / scoreCount : 0;
    }
    /**
     * 総合UI/UXスコアの計算
     */
    calculateOverallUIUXScore(results) {
        const weights = {
            'ui-responsive-001': 0.25, // レスポンシブデザイン
            'ui-chat-001': 0.25, // チャットインターフェース
            'ui-accessibility-001': 0.25, // アクセシビリティ
            'ui-usability-001': 0.25 // ユーザビリティ
        };
        let totalScore = 0;
        let totalWeight = 0;
        results.forEach(result => {
            const weight = weights[result.testId] || 0.1;
            totalWeight += weight;
            if (result.success) {
                let testScore = 1.0;
                // パフォーマンススコア
                if (result.uiMetrics) {
                    const performanceScore = this.calculatePerformanceScore(result.uiMetrics);
                    testScore *= performanceScore;
                }
                // アクセシビリティスコア
                if (result.accessibilityMetrics) {
                    const accessibilityScore = this.calculateAccessibilityScore(result.accessibilityMetrics);
                    testScore *= accessibilityScore;
                }
                // ユーザビリティスコア
                if (result.usabilityMetrics) {
                    const usabilityScore = this.calculateUsabilityTestScore(result.usabilityMetrics);
                    testScore *= usabilityScore;
                }
                totalScore += testScore * weight;
            }
        });
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    /**
     * パフォーマンススコアの計算
     */
    calculatePerformanceScore(uiMetrics) {
        // Core Web Vitals に基づくスコア計算
        const lcpScore = Math.max(0, 1 - (uiMetrics.largestContentfulPaint - 2500) / 2500); // 2.5秒以内で満点
        const fidScore = Math.max(0, 1 - (uiMetrics.firstInputDelay - 100) / 100); // 100ms以内で満点
        const clsScore = Math.max(0, 1 - uiMetrics.cumulativeLayoutShift / 0.1); // 0.1以下で満点
        return (lcpScore + fidScore + clsScore) / 3;
    }
    /**
     * アクセシビリティスコアの計算
     */
    calculateAccessibilityScore(accessibilityMetrics) {
        const wcagScore = accessibilityMetrics.wcagAACompliance;
        const contrastScore = Math.min(1, (accessibilityMetrics.colorContrastRatio - 4.5) / 2.5); // 4.5:1以上で満点
        const keyboardScore = accessibilityMetrics.keyboardNavigation ? 1 : 0;
        const screenReaderScore = accessibilityMetrics.screenReaderCompatibility ? 1 : 0;
        const altTextScore = accessibilityMetrics.altTextCoverage;
        return (wcagScore + contrastScore + keyboardScore + screenReaderScore + altTextScore) / 5;
    }
    /**
     * ユーザビリティテストスコアの計算
     */
    calculateUsabilityTestScore(usabilityMetrics) {
        return (usabilityMetrics.navigationEfficiency +
            usabilityMetrics.formUsability +
            usabilityMetrics.errorHandling +
            usabilityMetrics.userFlowCompletion) / 4;
    }
    /**
     * 詳細レポートの生成
     */
    async generateDetailedReport(results) {
        const timestamp = new Date().toISOString();
        const summary = this.generateTestSummary(results);
        let report = `# UI/UXテスト詳細レポート\n\n`;
        report += `**実行日時**: ${timestamp}\n`;
        report += `**テスト環境**: AWS東京リージョン本番環境 (${this.config.region})\n`;
        report += `**システム**: Permission-aware RAG System with FSx for NetApp ONTAP\n`;
        report += `**テスト対象**: CloudFront UI, チャットインターフェース, レスポンシブデザイン\n\n`;
        report += `## UI/UXテスト実行サマリー\n\n`;
        report += `- **総テスト数**: ${summary.totalTests}\n`;
        report += `- **成功**: ${summary.passedTests}\n`;
        report += `- **失敗**: ${summary.failedTests}\n`;
        report += `- **スキップ**: ${summary.skippedTests}\n`;
        report += `- **成功率**: ${(summary.successRate * 100).toFixed(1)}%\n`;
        report += `- **総合UI/UXスコア**: ${(summary.overallUIUXScore * 100).toFixed(1)}%\n`;
        report += `- **平均ページ読み込み時間**: ${summary.averagePageLoadTime.toFixed(0)}ms\n`;
        report += `- **WCAG準拠率**: ${(summary.wcagComplianceRate * 100).toFixed(1)}%\n`;
        report += `- **レスポンシブ互換性**: ${(summary.responsiveCompatibility * 100).toFixed(1)}%\n`;
        report += `- **ユーザビリティスコア**: ${(summary.usabilityScore * 100).toFixed(1)}%\n`;
        report += `- **総実行時間**: ${summary.totalDuration}ms\n\n`;
        // UI/UX評価
        report += `## UI/UX評価\n\n`;
        if (summary.overallUIUXScore >= 0.9) {
            report += `🟢 **優秀**: UI/UXが非常に高品質です\n`;
        }
        else if (summary.overallUIUXScore >= 0.7) {
            report += `🟡 **良好**: UI/UXに軽微な改善点があります\n`;
        }
        else {
            report += `🔴 **要改善**: UI/UXの大幅な改善が必要です\n`;
        }
        if (summary.averagePageLoadTime <= 2000) {
            report += `🟢 **パフォーマンス**: 優秀 (2秒以内)\n`;
        }
        else if (summary.averagePageLoadTime <= 3000) {
            report += `🟡 **パフォーマンス**: 良好 (3秒以内)\n`;
        }
        else {
            report += `🔴 **パフォーマンス**: 要改善 (3秒超過)\n`;
        }
        if (summary.wcagComplianceRate >= 0.9) {
            report += `🟢 **アクセシビリティ**: 優秀 (WCAG AA 90%以上準拠)\n`;
        }
        else if (summary.wcagComplianceRate >= 0.7) {
            report += `🟡 **アクセシビリティ**: 良好 (WCAG AA 70%以上準拠)\n`;
        }
        else {
            report += `🔴 **アクセシビリティ**: 要改善 (WCAG AA準拠不足)\n`;
        }
        if (summary.responsiveCompatibility >= 0.9) {
            report += `🟢 **レスポンシブ**: 優秀 (全デバイス対応)\n`;
        }
        else if (summary.responsiveCompatibility >= 0.7) {
            report += `🟡 **レスポンシブ**: 良好 (主要デバイス対応)\n`;
        }
        else {
            report += `🔴 **レスポンシブ**: 要改善 (デバイス対応不足)\n`;
        }
        report += `\n`;
        report += `## テスト結果詳細\n\n`;
        for (const [testId, result] of results) {
            const status = result.success ? '✅ 成功' : '❌ 失敗';
            report += `### ${result.testName} (${testId})\n\n`;
            report += `- **ステータス**: ${status}\n`;
            report += `- **実行時間**: ${result.duration}ms\n`;
            if (result.uiMetrics) {
                report += `- **ページ読み込み時間**: ${result.uiMetrics.pageLoadTime.toFixed(0)}ms\n`;
                report += `- **First Contentful Paint**: ${result.uiMetrics.firstContentfulPaint.toFixed(0)}ms\n`;
                report += `- **Largest Contentful Paint**: ${result.uiMetrics.largestContentfulPaint.toFixed(0)}ms\n`;
                report += `- **Cumulative Layout Shift**: ${result.uiMetrics.cumulativeLayoutShift.toFixed(3)}\n`;
                report += `- **First Input Delay**: ${result.uiMetrics.firstInputDelay.toFixed(0)}ms\n`;
            }
            if (result.responsiveMetrics) {
                report += `- **モバイル対応**: ${this.formatViewportResult(result.responsiveMetrics.mobileViewport)}\n`;
                report += `- **タブレット対応**: ${this.formatViewportResult(result.responsiveMetrics.tabletViewport)}\n`;
                report += `- **デスクトップ対応**: ${this.formatViewportResult(result.responsiveMetrics.desktopViewport)}\n`;
            }
            if (result.accessibilityMetrics) {
                report += `- **WCAG AA準拠率**: ${(result.accessibilityMetrics.wcagAACompliance * 100).toFixed(1)}%\n`;
                report += `- **色彩コントラスト比**: ${result.accessibilityMetrics.colorContrastRatio.toFixed(1)}:1\n`;
                report += `- **キーボードナビゲーション**: ${result.accessibilityMetrics.keyboardNavigation ? '対応' : '未対応'}\n`;
                report += `- **スクリーンリーダー対応**: ${result.accessibilityMetrics.screenReaderCompatibility ? '対応' : '未対応'}\n`;
                report += `- **代替テキストカバレッジ**: ${(result.accessibilityMetrics.altTextCoverage * 100).toFixed(1)}%\n`;
            }
            if (result.usabilityMetrics) {
                report += `- **ナビゲーション効率**: ${(result.usabilityMetrics.navigationEfficiency * 100).toFixed(1)}%\n`;
                report += `- **フォーム使いやすさ**: ${(result.usabilityMetrics.formUsability * 100).toFixed(1)}%\n`;
                report += `- **エラーハンドリング**: ${(result.usabilityMetrics.errorHandling * 100).toFixed(1)}%\n`;
                report += `- **ユーザーフロー完了率**: ${(result.usabilityMetrics.userFlowCompletion * 100).toFixed(1)}%\n`;
            }
            if (result.error) {
                report += `- **エラー**: ${result.error}\n`;
            }
            report += `\n`;
        }
        // 推奨事項
        report += `## 推奨事項\n\n`;
        if (summary.averagePageLoadTime > 2000) {
            report += `- **パフォーマンス改善**: 平均ページ読み込み時間が${summary.averagePageLoadTime.toFixed(0)}msです。画像最適化、コード分割、CDN活用を検討してください。\n`;
        }
        if (summary.wcagComplianceRate < 0.9) {
            report += `- **アクセシビリティ向上**: WCAG AA準拠率が${(summary.wcagComplianceRate * 100).toFixed(1)}%です。ARIAラベル、キーボードナビゲーション、色彩コントラストの改善を検討してください。\n`;
        }
        if (summary.responsiveCompatibility < 0.9) {
            report += `- **レスポンシブ改善**: レスポンシブ互換性が${(summary.responsiveCompatibility * 100).toFixed(1)}%です。モバイルファーストデザインとブレークポイントの見直しを検討してください。\n`;
        }
        if (summary.usabilityScore < 0.8) {
            report += `- **ユーザビリティ向上**: ユーザビリティスコアが${(summary.usabilityScore * 100).toFixed(1)}%です。ユーザーフローの簡素化とエラーメッセージの改善を検討してください。\n`;
        }
        report += `\n## 次回テストに向けて\n\n`;
        report += `- 定期的なUI/UXテストの実行（月次推奨）\n`;
        report += `- ユーザーフィードバックの収集と分析\n`;
        report += `- 新機能追加時のUI/UX影響評価\n`;
        report += `- アクセシビリティガイドラインの継続的な遵守\n`;
        report += `- パフォーマンス最適化の継続的な実施\n`;
        return report;
    }
    /**
     * ビューポート結果のフォーマット
     */
    formatViewportResult(viewport) {
        if (!viewport)
            return '未テスト';
        const score = [
            viewport.layoutStability,
            viewport.contentVisibility,
            viewport.navigationUsability,
            viewport.textReadability,
            viewport.buttonAccessibility
        ].filter(Boolean).length;
        return `${score}/5項目対応`;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 UI/UXテストランナーをクリーンアップ中...');
        try {
            await this.testModule.cleanup();
            console.log('✅ UI/UXテストランナーのクリーンアップ完了');
        }
        catch (error) {
            console.warn('⚠️ クリーンアップ中にエラーが発生:', error);
        }
    }
}
exports.UIUXTestRunner = UIUXTestRunner;
exports.default = UIUXTestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktdXgtdGVzdC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1aS11eC10ZXN0LXJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7OztBQUVILDRFQUFxRTtBQUlyRTs7R0FFRztBQUNILE1BQWEsY0FBYztJQUNqQixNQUFNLENBQW1CO0lBQ3pCLFVBQVUsQ0FBaUI7SUFDM0IsVUFBVSxDQUF1QjtJQUV6QyxZQUFZLE1BQXdCLEVBQUUsVUFBZ0M7UUFDcEUsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLDJCQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVEOztPQUVHO0lBQ0gsbUJBQW1CO1FBQ2pCLE1BQU0sZUFBZSxHQUFxQjtZQUN4QztnQkFDRSxNQUFNLEVBQUUsbUJBQW1CO2dCQUMzQixRQUFRLEVBQUUsZUFBZTtnQkFDekIsUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLFdBQVcsRUFBRSxvQ0FBb0M7Z0JBQ2pELE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSztnQkFDdEIsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsWUFBWSxFQUFFLEVBQUU7Z0JBQ2hCLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3hCLE9BQU8sTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3RELENBQUM7YUFDRjtZQUNEO2dCQUNFLE1BQU0sRUFBRSxhQUFhO2dCQUNyQixRQUFRLEVBQUUsaUJBQWlCO2dCQUMzQixRQUFRLEVBQUUsT0FBTztnQkFDakIsV0FBVyxFQUFFLHVCQUF1QjtnQkFDcEMsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLO2dCQUN0QixVQUFVLEVBQUUsQ0FBQztnQkFDYixZQUFZLEVBQUUsQ0FBQyxt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5a6f6KGM44Op44Oz44OK44O8XG4gKiBcbiAqIEtpcm8gTUNQIENocm9tZSBEZXZUb29sc+OCkuS9v+eUqOOBl+OBn+Wun+ODluODqeOCpuOCtuOBp+OBrlVJL1VY44OG44K544OI44KS5a6J5YWo44Gr5a6f6KGMXG4gKiDjg4bjgrnjg4jntZDmnpzjga7lj47pm4bjgajloLHlkYrjgpLooYzjgYZcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCBVSVVYVGVzdE1vZHVsZSwgeyBVSVVYVGVzdFJlc3VsdCB9IGZyb20gJy4vdWktdXgtdGVzdC1tb2R1bGUnO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lLCB7IFRlc3REZWZpbml0aW9uLCBUZXN0U3VpdGUgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5cbi8qKlxuICogVUkvVVjjg4bjgrnjg4jlrp/ooYzjg6njg7Pjg4rjg7zjgq/jg6njgrlcbiAqL1xuZXhwb3J0IGNsYXNzIFVJVVhUZXN0UnVubmVyIHtcbiAgcHJpdmF0ZSBjb25maWc6IFByb2R1Y3Rpb25Db25maWc7XG4gIHByaXZhdGUgdGVzdE1vZHVsZTogVUlVWFRlc3RNb2R1bGU7XG4gIHByaXZhdGUgdGVzdEVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmU7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnLCB0ZXN0RW5naW5lOiBQcm9kdWN0aW9uVGVzdEVuZ2luZSkge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMudGVzdEVuZ2luZSA9IHRlc3RFbmdpbmU7XG4gICAgdGhpcy50ZXN0TW9kdWxlID0gbmV3IFVJVVhUZXN0TW9kdWxlKGNvbmZpZyk7XG4gIH1cblxuICAvKipcbiAgICogVUkvVVjjg4bjgrnjg4jjgrnjgqTjg7zjg4jjga7kvZzmiJBcbiAgICovXG4gIGNyZWF0ZVVJVVhUZXN0U3VpdGUoKTogVGVzdFN1aXRlIHtcbiAgICBjb25zdCB0ZXN0RGVmaW5pdGlvbnM6IFRlc3REZWZpbml0aW9uW10gPSBbXG4gICAgICB7XG4gICAgICAgIHRlc3RJZDogJ3VpLXJlc3BvbnNpdmUtMDAxJyxcbiAgICAgICAgdGVzdE5hbWU6ICfjg6zjgrnjg53jg7Pjgrfjg5bjg4fjgrbjgqTjg7Pjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3VpLXV4JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfjg6Ljg5DjgqTjg6vjgIHjgr/jg5bjg6zjg4Pjg4jjgIHjg4fjgrnjgq/jg4jjg4Pjg5fjgafjga7ooajnpLrjgajjg6zjgqTjgqLjgqbjg4jjga7pganlv5zmgKfjg4bjgrnjg4gnLFxuICAgICAgICB0aW1lb3V0OiAxODAwMDAsIC8vIDPliIZcbiAgICAgICAgcmV0cnlDb3VudDogMixcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdFJlc3BvbnNpdmVEZXNpZ24oKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAndWktY2hhdC0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+ODgeODo+ODg+ODiOOCpOODs+OCv+ODvOODleOCp+ODvOOCueODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAndWktdXgnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+ODgeODo+ODg+ODiOapn+iDveOBruODpuODvOOCtuODk+ODquODhuOCo+OBqOaTjeS9nOaAp+OBruipleS+oScsXG4gICAgICAgIHRpbWVvdXQ6IDI0MDAwMCwgLy8gNOWIhlxuICAgICAgICByZXRyeUNvdW50OiAyLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFsndWktcmVzcG9uc2l2ZS0wMDEnXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdENoYXRJbnRlcmZhY2UoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAndWktYWNjZXNzaWJpbGl0eS0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+OCouOCr+OCu+OCt+ODk+ODquODhuOCo+ODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAndWktdXgnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dDQUcgMi4xIEFB5rqW5oug44Go44Ki44Kv44K744K344OT44Oq44OG44Kj5qmf6IO944Gu5YyF5ous55qE6KmV5L6hJyxcbiAgICAgICAgdGltZW91dDogMzAwMDAwLCAvLyA15YiGXG4gICAgICAgIHJldHJ5Q291bnQ6IDEsXG4gICAgICAgIGRlcGVuZGVuY2llczogWyd1aS1yZXNwb25zaXZlLTAwMSddLFxuICAgICAgICBleGVjdXRlOiBhc3luYyAoZW5naW5lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudGVzdE1vZHVsZS50ZXN0QWNjZXNzaWJpbGl0eSgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0ZXN0SWQ6ICd1aS11c2FiaWxpdHktMDAxJyxcbiAgICAgICAgdGVzdE5hbWU6ICfjg6bjg7zjgrbjg5Pjg6rjg4bjgqPjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3VpLXV4JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfjg6bjg7zjgrbjg7zjgqjjgq/jgrnjg5rjg6rjgqjjg7Pjgrnjgajmk43kvZzlirnnjofjga7nt4/lkIjoqZXkvqEnLFxuICAgICAgICB0aW1lb3V0OiAzNjAwMDAsIC8vIDbliIZcbiAgICAgICAgcmV0cnlDb3VudDogMSxcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbJ3VpLWNoYXQtMDAxJ10sXG4gICAgICAgIGV4ZWN1dGU6IGFzeW5jIChlbmdpbmUpID0+IHtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy50ZXN0TW9kdWxlLnRlc3RVc2FiaWxpdHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VpdGVJZDogJ3VpLXV4LXRlc3Qtc3VpdGUnLFxuICAgICAgc3VpdGVOYW1lOiAnVUkvVVjjg4bjgrnjg4jjgrnjgqTjg7zjg4gnLFxuICAgICAgZGVzY3JpcHRpb246ICflrp/mnKznlarnkrDlooPjgafjga7jg6bjg7zjgrbjg7zjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrnjgajjg6bjg7zjgrbjg7zjgqjjgq/jgrnjg5rjg6rjgqjjg7Pjgrnjga7ljIXmi6zoqZXkvqEnLFxuICAgICAgdGVzdHM6IHRlc3REZWZpbml0aW9ucyxcbiAgICAgIGNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgcGFyYWxsZWw6IGZhbHNlLCAvLyBVSS9VWOODhuOCueODiOOBr+mghuasoeWun+ihjFxuICAgICAgICBtYXhDb25jdXJyZW5jeTogMSxcbiAgICAgICAgZmFpbEZhc3Q6IGZhbHNlLCAvLyDkuIDjgaTjga7jg4bjgrnjg4jjgYzlpLHmlZfjgZfjgabjgoLku5bjga7jg4bjgrnjg4jjgpLntpnntppcbiAgICAgICAgY29udGludWVPbkVycm9yOiB0cnVlXG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVSS9VWOODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgYXN5bmMgcnVuVUlVWFRlc3RzKCk6IFByb21pc2U8e1xuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XG4gICAgcmVzdWx0czogTWFwPHN0cmluZywgVUlVWFRlc3RSZXN1bHQ+O1xuICAgIHN1bW1hcnk6IHtcbiAgICAgIHRvdGFsVGVzdHM6IG51bWJlcjtcbiAgICAgIHBhc3NlZFRlc3RzOiBudW1iZXI7XG4gICAgICBmYWlsZWRUZXN0czogbnVtYmVyO1xuICAgICAgc2tpcHBlZFRlc3RzOiBudW1iZXI7XG4gICAgICBzdWNjZXNzUmF0ZTogbnVtYmVyO1xuICAgICAgdG90YWxEdXJhdGlvbjogbnVtYmVyO1xuICAgICAgb3ZlcmFsbFVJVVhTY29yZTogbnVtYmVyO1xuICAgICAgYXZlcmFnZVBhZ2VMb2FkVGltZTogbnVtYmVyO1xuICAgICAgd2NhZ0NvbXBsaWFuY2VSYXRlOiBudW1iZXI7XG4gICAgICByZXNwb25zaXZlQ29tcGF0aWJpbGl0eTogbnVtYmVyO1xuICAgICAgdXNhYmlsaXR5U2NvcmU6IG51bWJlcjtcbiAgICB9O1xuICB9PiB7XG4gICAgY29uc29sZS5sb2coJ/CfmoAgVUkvVVjjg4bjgrnjg4jjgrnjgqTjg7zjg4jjgpLlrp/ooYzplovlp4suLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyDjg4bjgrnjg4jjgrnjgqTjg7zjg4jjga7kvZzmiJBcbiAgICAgIGNvbnN0IHRlc3RTdWl0ZSA9IHRoaXMuY3JlYXRlVUlVWFRlc3RTdWl0ZSgpO1xuXG4gICAgICAvLyDjg4bjgrnjg4jjgqjjg7Pjgrjjg7Pjgafjga7lrp/ooYxcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnRlc3RFbmdpbmUuZXhlY3V0ZVRlc3RTdWl0ZSh0ZXN0U3VpdGUpO1xuXG4gICAgICAvLyDntZDmnpzjga7pm4boqIhcbiAgICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLmdlbmVyYXRlVGVzdFN1bW1hcnkocmVzdWx0cyk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfwn5OKIFVJL1VY44OG44K544OI5a6f6KGM57WQ5p6cOicpO1xuICAgICAgY29uc29sZS5sb2coYCAgIOe3j+ODhuOCueODiOaVsDogJHtzdW1tYXJ5LnRvdGFsVGVzdHN9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg5oiQ5YqfOiAke3N1bW1hcnkucGFzc2VkVGVzdHN9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg5aSx5pWXOiAke3N1bW1hcnkuZmFpbGVkVGVzdHN9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44K544Kt44OD44OXOiAke3N1bW1hcnkuc2tpcHBlZFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOaIkOWKn+eOhzogJHsoc3VtbWFyeS5zdWNjZXNzUmF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg57eP5ZCIVUkvVVjjgrnjgrPjgqI6ICR7KHN1bW1hcnkub3ZlcmFsbFVJVVhTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg5bmz5Z2H44Oa44O844K46Kqt44G/6L6844G/5pmC6ZaTOiAke3N1bW1hcnkuYXZlcmFnZVBhZ2VMb2FkVGltZS50b0ZpeGVkKDApfW1zYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgV0NBR+a6luaLoOeOhzogJHsoc3VtbWFyeS53Y2FnQ29tcGxpYW5jZVJhdGUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOODrOOCueODneODs+OCt+ODluS6kuaPm+aApzogJHsoc3VtbWFyeS5yZXNwb25zaXZlQ29tcGF0aWJpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44Om44O844K244OT44Oq44OG44Kj44K544Kz44KiOiAkeyhzdW1tYXJ5LnVzYWJpbGl0eVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDnt4/lrp/ooYzmmYLplpM6ICR7c3VtbWFyeS50b3RhbER1cmF0aW9ufW1zYCk7XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBzdW1tYXJ5LmZhaWxlZFRlc3RzID09PSAwO1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIFVJL1VY44OG44K544OI44K544Kk44O844OI5a6f6KGM5a6M5LqGIC0g5YWo44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygn4pqg77iPIFVJL1VY44OG44K544OI44K544Kk44O844OI5a6f6KGM5a6M5LqGIC0g5LiA6YOo44OG44K544OI5aSx5pWXJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgIHJlc3VsdHM6IHJlc3VsdHMgYXMgTWFwPHN0cmluZywgVUlVWFRlc3RSZXN1bHQ+LFxuICAgICAgICBzdW1tYXJ5XG4gICAgICB9O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBVSS9VWOODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44OG44K544OI57WQ5p6c44K144Oe44Oq44O844Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlVGVzdFN1bW1hcnkocmVzdWx0czogTWFwPHN0cmluZywgYW55Pik6IHtcbiAgICB0b3RhbFRlc3RzOiBudW1iZXI7XG4gICAgcGFzc2VkVGVzdHM6IG51bWJlcjtcbiAgICBmYWlsZWRUZXN0czogbnVtYmVyO1xuICAgIHNraXBwZWRUZXN0czogbnVtYmVyO1xuICAgIHN1Y2Nlc3NSYXRlOiBudW1iZXI7XG4gICAgdG90YWxEdXJhdGlvbjogbnVtYmVyO1xuICAgIG92ZXJhbGxVSVVYU2NvcmU6IG51bWJlcjtcbiAgICBhdmVyYWdlUGFnZUxvYWRUaW1lOiBudW1iZXI7XG4gICAgd2NhZ0NvbXBsaWFuY2VSYXRlOiBudW1iZXI7XG4gICAgcmVzcG9uc2l2ZUNvbXBhdGliaWxpdHk6IG51bWJlcjtcbiAgICB1c2FiaWxpdHlTY29yZTogbnVtYmVyO1xuICB9IHtcbiAgICBjb25zdCByZXN1bHRzQXJyYXkgPSBBcnJheS5mcm9tKHJlc3VsdHMudmFsdWVzKCkpO1xuICAgIFxuICAgIGNvbnN0IHRvdGFsVGVzdHMgPSByZXN1bHRzQXJyYXkubGVuZ3RoO1xuICAgIGNvbnN0IHBhc3NlZFRlc3RzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIGNvbnN0IGZhaWxlZFRlc3RzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+ICFyLnN1Y2Nlc3MgJiYgci5zdGF0dXMgIT09ICdTS0lQUEVEJykubGVuZ3RoO1xuICAgIGNvbnN0IHNraXBwZWRUZXN0cyA9IHJlc3VsdHNBcnJheS5maWx0ZXIociA9PiByLnN0YXR1cyA9PT0gJ1NLSVBQRUQnKS5sZW5ndGg7XG4gICAgY29uc3Qgc3VjY2Vzc1JhdGUgPSB0b3RhbFRlc3RzID4gMCA/IHBhc3NlZFRlc3RzIC8gdG90YWxUZXN0cyA6IDA7XG4gICAgY29uc3QgdG90YWxEdXJhdGlvbiA9IHJlc3VsdHNBcnJheS5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgKHIuZHVyYXRpb24gfHwgMCksIDApO1xuICAgIFxuICAgIC8vIFVJL1VY5oyH5qiZ44Gu6KiI566XXG4gICAgY29uc3QgdWlSZXN1bHRzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+IHIudWlNZXRyaWNzIHx8IHIucmVzcG9uc2l2ZU1ldHJpY3MgfHwgci5hY2Nlc3NpYmlsaXR5TWV0cmljcyB8fCByLnVzYWJpbGl0eU1ldHJpY3MpO1xuICAgIFxuICAgIGNvbnN0IGF2ZXJhZ2VQYWdlTG9hZFRpbWUgPSB0aGlzLmNhbGN1bGF0ZUF2ZXJhZ2VQYWdlTG9hZFRpbWUodWlSZXN1bHRzKTtcbiAgICBjb25zdCB3Y2FnQ29tcGxpYW5jZVJhdGUgPSB0aGlzLmNhbGN1bGF0ZVdDQUdDb21wbGlhbmNlUmF0ZSh1aVJlc3VsdHMpO1xuICAgIGNvbnN0IHJlc3BvbnNpdmVDb21wYXRpYmlsaXR5ID0gdGhpcy5jYWxjdWxhdGVSZXNwb25zaXZlQ29tcGF0aWJpbGl0eSh1aVJlc3VsdHMpO1xuICAgIGNvbnN0IHVzYWJpbGl0eVNjb3JlID0gdGhpcy5jYWxjdWxhdGVVc2FiaWxpdHlTY29yZSh1aVJlc3VsdHMpO1xuICAgIFxuICAgIC8vIOe3j+WQiFVJL1VY44K544Kz44Ki44Gu6KiI566XXG4gICAgY29uc3Qgb3ZlcmFsbFVJVVhTY29yZSA9IHRoaXMuY2FsY3VsYXRlT3ZlcmFsbFVJVVhTY29yZShyZXN1bHRzQXJyYXkpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvdGFsVGVzdHMsXG4gICAgICBwYXNzZWRUZXN0cyxcbiAgICAgIGZhaWxlZFRlc3RzLFxuICAgICAgc2tpcHBlZFRlc3RzLFxuICAgICAgc3VjY2Vzc1JhdGUsXG4gICAgICB0b3RhbER1cmF0aW9uLFxuICAgICAgb3ZlcmFsbFVJVVhTY29yZSxcbiAgICAgIGF2ZXJhZ2VQYWdlTG9hZFRpbWUsXG4gICAgICB3Y2FnQ29tcGxpYW5jZVJhdGUsXG4gICAgICByZXNwb25zaXZlQ29tcGF0aWJpbGl0eSxcbiAgICAgIHVzYWJpbGl0eVNjb3JlXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlubPlnYfjg5rjg7zjgrjoqq3jgb/ovrzjgb/mmYLplpPjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlQXZlcmFnZVBhZ2VMb2FkVGltZShyZXN1bHRzOiBhbnlbXSk6IG51bWJlciB7XG4gICAgY29uc3QgbG9hZFRpbWVzID0gcmVzdWx0c1xuICAgICAgLmZpbHRlcihyID0+IHIudWlNZXRyaWNzICYmIHIudWlNZXRyaWNzLnBhZ2VMb2FkVGltZSlcbiAgICAgIC5tYXAociA9PiByLnVpTWV0cmljcy5wYWdlTG9hZFRpbWUpO1xuICAgIFxuICAgIHJldHVybiBsb2FkVGltZXMubGVuZ3RoID4gMFxuICAgICAgPyBsb2FkVGltZXMucmVkdWNlKChzdW0sIHRpbWUpID0+IHN1bSArIHRpbWUsIDApIC8gbG9hZFRpbWVzLmxlbmd0aFxuICAgICAgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFdDQUfmupbmi6Dnjofjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlV0NBR0NvbXBsaWFuY2VSYXRlKHJlc3VsdHM6IGFueVtdKTogbnVtYmVyIHtcbiAgICBjb25zdCB3Y2FnU2NvcmVzID0gcmVzdWx0c1xuICAgICAgLmZpbHRlcihyID0+IHIuYWNjZXNzaWJpbGl0eU1ldHJpY3MgJiYgci5hY2Nlc3NpYmlsaXR5TWV0cmljcy53Y2FnQUFDb21wbGlhbmNlKVxuICAgICAgLm1hcChyID0+IHIuYWNjZXNzaWJpbGl0eU1ldHJpY3Mud2NhZ0FBQ29tcGxpYW5jZSk7XG4gICAgXG4gICAgcmV0dXJuIHdjYWdTY29yZXMubGVuZ3RoID4gMFxuICAgICAgPyB3Y2FnU2NvcmVzLnJlZHVjZSgoc3VtLCBzY29yZSkgPT4gc3VtICsgc2NvcmUsIDApIC8gd2NhZ1Njb3Jlcy5sZW5ndGhcbiAgICAgIDogMDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6zjgrnjg53jg7Pjgrfjg5bkupLmj5vmgKfjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlUmVzcG9uc2l2ZUNvbXBhdGliaWxpdHkocmVzdWx0czogYW55W10pOiBudW1iZXIge1xuICAgIGNvbnN0IHJlc3BvbnNpdmVSZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLnJlc3BvbnNpdmVNZXRyaWNzKTtcbiAgICBcbiAgICBpZiAocmVzcG9uc2l2ZVJlc3VsdHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICBcbiAgICBsZXQgdG90YWxTY29yZSA9IDA7XG4gICAgbGV0IHNjb3JlQ291bnQgPSAwO1xuICAgIFxuICAgIHJlc3BvbnNpdmVSZXN1bHRzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IG1ldHJpY3MgPSByZXN1bHQucmVzcG9uc2l2ZU1ldHJpY3M7XG4gICAgICBbJ21vYmlsZVZpZXdwb3J0JywgJ3RhYmxldFZpZXdwb3J0JywgJ2Rlc2t0b3BWaWV3cG9ydCddLmZvckVhY2godmlld3BvcnQgPT4ge1xuICAgICAgICBpZiAobWV0cmljc1t2aWV3cG9ydF0pIHtcbiAgICAgICAgICBjb25zdCB2aWV3cG9ydE1ldHJpY3MgPSBtZXRyaWNzW3ZpZXdwb3J0XTtcbiAgICAgICAgICBjb25zdCBzY29yZSA9IFtcbiAgICAgICAgICAgIHZpZXdwb3J0TWV0cmljcy5sYXlvdXRTdGFiaWxpdHksXG4gICAgICAgICAgICB2aWV3cG9ydE1ldHJpY3MuY29udGVudFZpc2liaWxpdHksXG4gICAgICAgICAgICB2aWV3cG9ydE1ldHJpY3MubmF2aWdhdGlvblVzYWJpbGl0eSxcbiAgICAgICAgICAgIHZpZXdwb3J0TWV0cmljcy50ZXh0UmVhZGFiaWxpdHksXG4gICAgICAgICAgICB2aWV3cG9ydE1ldHJpY3MuYnV0dG9uQWNjZXNzaWJpbGl0eVxuICAgICAgICAgIF0uZmlsdGVyKEJvb2xlYW4pLmxlbmd0aCAvIDU7XG4gICAgICAgICAgXG4gICAgICAgICAgdG90YWxTY29yZSArPSBzY29yZTtcbiAgICAgICAgICBzY29yZUNvdW50Kys7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBzY29yZUNvdW50ID4gMCA/IHRvdGFsU2NvcmUgLyBzY29yZUNvdW50IDogMDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6bjg7zjgrbjg5Pjg6rjg4bjgqPjgrnjgrPjgqLjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlVXNhYmlsaXR5U2NvcmUocmVzdWx0czogYW55W10pOiBudW1iZXIge1xuICAgIGNvbnN0IHVzYWJpbGl0eVJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIudXNhYmlsaXR5TWV0cmljcyk7XG4gICAgXG4gICAgaWYgKHVzYWJpbGl0eVJlc3VsdHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICBcbiAgICBsZXQgdG90YWxTY29yZSA9IDA7XG4gICAgbGV0IHNjb3JlQ291bnQgPSAwO1xuICAgIFxuICAgIHVzYWJpbGl0eVJlc3VsdHMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgY29uc3QgbWV0cmljcyA9IHJlc3VsdC51c2FiaWxpdHlNZXRyaWNzO1xuICAgICAgY29uc3Qgc2NvcmUgPSAoXG4gICAgICAgIG1ldHJpY3MubmF2aWdhdGlvbkVmZmljaWVuY3kgK1xuICAgICAgICBtZXRyaWNzLmZvcm1Vc2FiaWxpdHkgK1xuICAgICAgICBtZXRyaWNzLmVycm9ySGFuZGxpbmcgK1xuICAgICAgICBtZXRyaWNzLnVzZXJGbG93Q29tcGxldGlvblxuICAgICAgKSAvIDQ7XG4gICAgICBcbiAgICAgIHRvdGFsU2NvcmUgKz0gc2NvcmU7XG4gICAgICBzY29yZUNvdW50Kys7XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIHNjb3JlQ291bnQgPiAwID8gdG90YWxTY29yZSAvIHNjb3JlQ291bnQgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIOe3j+WQiFVJL1VY44K544Kz44Ki44Gu6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZU92ZXJhbGxVSVVYU2NvcmUocmVzdWx0czogYW55W10pOiBudW1iZXIge1xuICAgIGNvbnN0IHdlaWdodHMgPSB7XG4gICAgICAndWktcmVzcG9uc2l2ZS0wMDEnOiAwLjI1LCAgICAgIC8vIOODrOOCueODneODs+OCt+ODluODh+OCtuOCpOODs1xuICAgICAgJ3VpLWNoYXQtMDAxJzogMC4yNSwgICAgICAgICAgICAvLyDjg4Hjg6Pjg4Pjg4jjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbiAgICAgICd1aS1hY2Nlc3NpYmlsaXR5LTAwMSc6IDAuMjUsICAgLy8g44Ki44Kv44K744K344OT44Oq44OG44KjXG4gICAgICAndWktdXNhYmlsaXR5LTAwMSc6IDAuMjUgICAgICAgIC8vIOODpuODvOOCtuODk+ODquODhuOCo1xuICAgIH07XG5cbiAgICBsZXQgdG90YWxTY29yZSA9IDA7XG4gICAgbGV0IHRvdGFsV2VpZ2h0ID0gMDtcblxuICAgIHJlc3VsdHMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgY29uc3Qgd2VpZ2h0ID0gd2VpZ2h0c1tyZXN1bHQudGVzdElkIGFzIGtleW9mIHR5cGVvZiB3ZWlnaHRzXSB8fCAwLjE7XG4gICAgICB0b3RhbFdlaWdodCArPSB3ZWlnaHQ7XG4gICAgICBcbiAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICBsZXQgdGVzdFNjb3JlID0gMS4wO1xuICAgICAgICBcbiAgICAgICAgLy8g44OR44OV44Kp44O844Oe44Oz44K544K544Kz44KiXG4gICAgICAgIGlmIChyZXN1bHQudWlNZXRyaWNzKSB7XG4gICAgICAgICAgY29uc3QgcGVyZm9ybWFuY2VTY29yZSA9IHRoaXMuY2FsY3VsYXRlUGVyZm9ybWFuY2VTY29yZShyZXN1bHQudWlNZXRyaWNzKTtcbiAgICAgICAgICB0ZXN0U2NvcmUgKj0gcGVyZm9ybWFuY2VTY29yZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g44Ki44Kv44K744K344OT44Oq44OG44Kj44K544Kz44KiXG4gICAgICAgIGlmIChyZXN1bHQuYWNjZXNzaWJpbGl0eU1ldHJpY3MpIHtcbiAgICAgICAgICBjb25zdCBhY2Nlc3NpYmlsaXR5U2NvcmUgPSB0aGlzLmNhbGN1bGF0ZUFjY2Vzc2liaWxpdHlTY29yZShyZXN1bHQuYWNjZXNzaWJpbGl0eU1ldHJpY3MpO1xuICAgICAgICAgIHRlc3RTY29yZSAqPSBhY2Nlc3NpYmlsaXR5U2NvcmU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOODpuODvOOCtuODk+ODquODhuOCo+OCueOCs+OColxuICAgICAgICBpZiAocmVzdWx0LnVzYWJpbGl0eU1ldHJpY3MpIHtcbiAgICAgICAgICBjb25zdCB1c2FiaWxpdHlTY29yZSA9IHRoaXMuY2FsY3VsYXRlVXNhYmlsaXR5VGVzdFNjb3JlKHJlc3VsdC51c2FiaWxpdHlNZXRyaWNzKTtcbiAgICAgICAgICB0ZXN0U2NvcmUgKj0gdXNhYmlsaXR5U2NvcmU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRvdGFsU2NvcmUgKz0gdGVzdFNjb3JlICogd2VpZ2h0O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRvdGFsV2VpZ2h0ID4gMCA/IHRvdGFsU2NvcmUgLyB0b3RhbFdlaWdodCA6IDA7XG4gIH1cblxuICAvKipcbiAgICog44OR44OV44Kp44O844Oe44Oz44K544K544Kz44Ki44Gu6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVBlcmZvcm1hbmNlU2NvcmUodWlNZXRyaWNzOiBhbnkpOiBudW1iZXIge1xuICAgIC8vIENvcmUgV2ViIFZpdGFscyDjgavln7rjgaXjgY/jgrnjgrPjgqLoqIjnrpdcbiAgICBjb25zdCBsY3BTY29yZSA9IE1hdGgubWF4KDAsIDEgLSAodWlNZXRyaWNzLmxhcmdlc3RDb250ZW50ZnVsUGFpbnQgLSAyNTAwKSAvIDI1MDApOyAvLyAyLjXnp5Lku6XlhoXjgafmuoDngrlcbiAgICBjb25zdCBmaWRTY29yZSA9IE1hdGgubWF4KDAsIDEgLSAodWlNZXRyaWNzLmZpcnN0SW5wdXREZWxheSAtIDEwMCkgLyAxMDApOyAvLyAxMDBtc+S7peWGheOBp+a6gOeCuVxuICAgIGNvbnN0IGNsc1Njb3JlID0gTWF0aC5tYXgoMCwgMSAtIHVpTWV0cmljcy5jdW11bGF0aXZlTGF5b3V0U2hpZnQgLyAwLjEpOyAvLyAwLjHku6XkuIvjgafmuoDngrlcbiAgICBcbiAgICByZXR1cm4gKGxjcFNjb3JlICsgZmlkU2NvcmUgKyBjbHNTY29yZSkgLyAzO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCouOCr+OCu+OCt+ODk+ODquODhuOCo+OCueOCs+OCouOBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVBY2Nlc3NpYmlsaXR5U2NvcmUoYWNjZXNzaWJpbGl0eU1ldHJpY3M6IGFueSk6IG51bWJlciB7XG4gICAgY29uc3Qgd2NhZ1Njb3JlID0gYWNjZXNzaWJpbGl0eU1ldHJpY3Mud2NhZ0FBQ29tcGxpYW5jZTtcbiAgICBjb25zdCBjb250cmFzdFNjb3JlID0gTWF0aC5taW4oMSwgKGFjY2Vzc2liaWxpdHlNZXRyaWNzLmNvbG9yQ29udHJhc3RSYXRpbyAtIDQuNSkgLyAyLjUpOyAvLyA0LjU6MeS7peS4iuOBp+a6gOeCuVxuICAgIGNvbnN0IGtleWJvYXJkU2NvcmUgPSBhY2Nlc3NpYmlsaXR5TWV0cmljcy5rZXlib2FyZE5hdmlnYXRpb24gPyAxIDogMDtcbiAgICBjb25zdCBzY3JlZW5SZWFkZXJTY29yZSA9IGFjY2Vzc2liaWxpdHlNZXRyaWNzLnNjcmVlblJlYWRlckNvbXBhdGliaWxpdHkgPyAxIDogMDtcbiAgICBjb25zdCBhbHRUZXh0U2NvcmUgPSBhY2Nlc3NpYmlsaXR5TWV0cmljcy5hbHRUZXh0Q292ZXJhZ2U7XG4gICAgXG4gICAgcmV0dXJuICh3Y2FnU2NvcmUgKyBjb250cmFzdFNjb3JlICsga2V5Ym9hcmRTY29yZSArIHNjcmVlblJlYWRlclNjb3JlICsgYWx0VGV4dFNjb3JlKSAvIDU7XG4gIH1cblxuICAvKipcbiAgICog44Om44O844K244OT44Oq44OG44Kj44OG44K544OI44K544Kz44Ki44Gu6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVVzYWJpbGl0eVRlc3RTY29yZSh1c2FiaWxpdHlNZXRyaWNzOiBhbnkpOiBudW1iZXIge1xuICAgIHJldHVybiAoXG4gICAgICB1c2FiaWxpdHlNZXRyaWNzLm5hdmlnYXRpb25FZmZpY2llbmN5ICtcbiAgICAgIHVzYWJpbGl0eU1ldHJpY3MuZm9ybVVzYWJpbGl0eSArXG4gICAgICB1c2FiaWxpdHlNZXRyaWNzLmVycm9ySGFuZGxpbmcgK1xuICAgICAgdXNhYmlsaXR5TWV0cmljcy51c2VyRmxvd0NvbXBsZXRpb25cbiAgICApIC8gNDtcbiAgfVxuXG4gIC8qKlxuICAgKiDoqbPntLDjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlRGV0YWlsZWRSZXBvcnQocmVzdWx0czogTWFwPHN0cmluZywgVUlVWFRlc3RSZXN1bHQ+KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuZ2VuZXJhdGVUZXN0U3VtbWFyeShyZXN1bHRzKTtcblxuICAgIGxldCByZXBvcnQgPSBgIyBVSS9VWOODhuOCueODiOips+e0sOODrOODneODvOODiFxcblxcbmA7XG4gICAgcmVwb3J0ICs9IGAqKuWun+ihjOaXpeaZgioqOiAke3RpbWVzdGFtcH1cXG5gO1xuICAgIHJlcG9ydCArPSBgKirjg4bjgrnjg4jnkrDlooMqKjogQVdT5p2x5Lqs44Oq44O844K444On44Oz5pys55Wq55Kw5aKDICgke3RoaXMuY29uZmlnLnJlZ2lvbn0pXFxuYDtcbiAgICByZXBvcnQgKz0gYCoq44K344K544OG44OgKio6IFBlcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbSB3aXRoIEZTeCBmb3IgTmV0QXBwIE9OVEFQXFxuYDtcbiAgICByZXBvcnQgKz0gYCoq44OG44K544OI5a++6LGhKio6IENsb3VkRnJvbnQgVUksIOODgeODo+ODg+ODiOOCpOODs+OCv+ODvOODleOCp+ODvOOCuSwg44Os44K544Od44Oz44K344OW44OH44K244Kk44OzXFxuXFxuYDtcblxuICAgIHJlcG9ydCArPSBgIyMgVUkvVVjjg4bjgrnjg4jlrp/ooYzjgrXjg57jg6rjg7xcXG5cXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKue3j+ODhuOCueODiOaVsCoqOiAke3N1bW1hcnkudG90YWxUZXN0c31cXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKuaIkOWKnyoqOiAke3N1bW1hcnkucGFzc2VkVGVzdHN9XFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirlpLHmlZcqKjogJHtzdW1tYXJ5LmZhaWxlZFRlc3RzfVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq44K544Kt44OD44OXKio6ICR7c3VtbWFyeS5za2lwcGVkVGVzdHN9XFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirmiJDlip/njocqKjogJHsoc3VtbWFyeS5zdWNjZXNzUmF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirnt4/lkIhVSS9VWOOCueOCs+OCoioqOiAkeyhzdW1tYXJ5Lm92ZXJhbGxVSVVYU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq5bmz5Z2H44Oa44O844K46Kqt44G/6L6844G/5pmC6ZaTKio6ICR7c3VtbWFyeS5hdmVyYWdlUGFnZUxvYWRUaW1lLnRvRml4ZWQoMCl9bXNcXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKldDQUfmupbmi6DnjocqKjogJHsoc3VtbWFyeS53Y2FnQ29tcGxpYW5jZVJhdGUgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq44Os44K544Od44Oz44K344OW5LqS5o+b5oCnKio6ICR7KHN1bW1hcnkucmVzcG9uc2l2ZUNvbXBhdGliaWxpdHkgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq44Om44O844K244OT44Oq44OG44Kj44K544Kz44KiKio6ICR7KHN1bW1hcnkudXNhYmlsaXR5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq57eP5a6f6KGM5pmC6ZaTKio6ICR7c3VtbWFyeS50b3RhbER1cmF0aW9ufW1zXFxuXFxuYDtcblxuICAgIC8vIFVJL1VY6KmV5L6hXG4gICAgcmVwb3J0ICs9IGAjIyBVSS9VWOipleS+oVxcblxcbmA7XG4gICAgaWYgKHN1bW1hcnkub3ZlcmFsbFVJVVhTY29yZSA+PSAwLjkpIHtcbiAgICAgIHJlcG9ydCArPSBg8J+foiAqKuWEquengCoqOiBVSS9VWOOBjOmdnuW4uOOBq+mrmOWTgeizquOBp+OBmVxcbmA7XG4gICAgfSBlbHNlIGlmIChzdW1tYXJ5Lm92ZXJhbGxVSVVYU2NvcmUgPj0gMC43KSB7XG4gICAgICByZXBvcnQgKz0gYPCfn6EgKiroia/lpb0qKjogVUkvVVjjgavou73lvq7jgarmlLnlloTngrnjgYzjgYLjgorjgb7jgZlcXG5gO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXBvcnQgKz0gYPCflLQgKiropoHmlLnlloQqKjogVUkvVVjjga7lpKfluYXjgarmlLnlloTjgYzlv4XopoHjgafjgZlcXG5gO1xuICAgIH1cblxuICAgIGlmIChzdW1tYXJ5LmF2ZXJhZ2VQYWdlTG9hZFRpbWUgPD0gMjAwMCkge1xuICAgICAgcmVwb3J0ICs9IGDwn5+iICoq44OR44OV44Kp44O844Oe44Oz44K5Kio6IOWEquengCAoMuenkuS7peWGhSlcXG5gO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5hdmVyYWdlUGFnZUxvYWRUaW1lIDw9IDMwMDApIHtcbiAgICAgIHJlcG9ydCArPSBg8J+foSAqKuODkeODleOCqeODvOODnuODs+OCuSoqOiDoia/lpb0gKDPnp5Lku6XlhoUpXFxuYDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVwb3J0ICs9IGDwn5S0ICoq44OR44OV44Kp44O844Oe44Oz44K5Kio6IOimgeaUueWWhCAoM+enkui2hemBjilcXG5gO1xuICAgIH1cblxuICAgIGlmIChzdW1tYXJ5LndjYWdDb21wbGlhbmNlUmF0ZSA+PSAwLjkpIHtcbiAgICAgIHJlcG9ydCArPSBg8J+foiAqKuOCouOCr+OCu+OCt+ODk+ODquODhuOCoyoqOiDlhKrnp4AgKFdDQUcgQUEgOTAl5Lul5LiK5rqW5ougKVxcbmA7XG4gICAgfSBlbHNlIGlmIChzdW1tYXJ5LndjYWdDb21wbGlhbmNlUmF0ZSA+PSAwLjcpIHtcbiAgICAgIHJlcG9ydCArPSBg8J+foSAqKuOCouOCr+OCu+OCt+ODk+ODquODhuOCoyoqOiDoia/lpb0gKFdDQUcgQUEgNzAl5Lul5LiK5rqW5ougKVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcG9ydCArPSBg8J+UtCAqKuOCouOCr+OCu+OCt+ODk+ODquODhuOCoyoqOiDopoHmlLnlloQgKFdDQUcgQUHmupbmi6DkuI3otrMpXFxuYDtcbiAgICB9XG5cbiAgICBpZiAoc3VtbWFyeS5yZXNwb25zaXZlQ29tcGF0aWJpbGl0eSA+PSAwLjkpIHtcbiAgICAgIHJlcG9ydCArPSBg8J+foiAqKuODrOOCueODneODs+OCt+ODlioqOiDlhKrnp4AgKOWFqOODh+ODkOOCpOOCueWvvuW/nClcXG5gO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5yZXNwb25zaXZlQ29tcGF0aWJpbGl0eSA+PSAwLjcpIHtcbiAgICAgIHJlcG9ydCArPSBg8J+foSAqKuODrOOCueODneODs+OCt+ODlioqOiDoia/lpb0gKOS4u+imgeODh+ODkOOCpOOCueWvvuW/nClcXG5gO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXBvcnQgKz0gYPCflLQgKirjg6zjgrnjg53jg7Pjgrfjg5YqKjog6KaB5pS55ZaEICjjg4fjg5DjgqTjgrnlr77lv5zkuI3otrMpXFxuYDtcbiAgICB9XG4gICAgcmVwb3J0ICs9IGBcXG5gO1xuXG4gICAgcmVwb3J0ICs9IGAjIyDjg4bjgrnjg4jntZDmnpzoqbPntLBcXG5cXG5gO1xuXG4gICAgZm9yIChjb25zdCBbdGVzdElkLCByZXN1bHRdIG9mIHJlc3VsdHMpIHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3VsdC5zdWNjZXNzID8gJ+KchSDmiJDlip8nIDogJ+KdjCDlpLHmlZcnO1xuXG4gICAgICByZXBvcnQgKz0gYCMjIyAke3Jlc3VsdC50ZXN0TmFtZX0gKCR7dGVzdElkfSlcXG5cXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq44K544OG44O844K/44K5Kio6ICR7c3RhdHVzfVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirlrp/ooYzmmYLplpMqKjogJHtyZXN1bHQuZHVyYXRpb259bXNcXG5gO1xuICAgICAgXG4gICAgICBpZiAocmVzdWx0LnVpTWV0cmljcykge1xuICAgICAgICByZXBvcnQgKz0gYC0gKirjg5rjg7zjgrjoqq3jgb/ovrzjgb/mmYLplpMqKjogJHtyZXN1bHQudWlNZXRyaWNzLnBhZ2VMb2FkVGltZS50b0ZpeGVkKDApfW1zXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoqRmlyc3QgQ29udGVudGZ1bCBQYWludCoqOiAke3Jlc3VsdC51aU1ldHJpY3MuZmlyc3RDb250ZW50ZnVsUGFpbnQudG9GaXhlZCgwKX1tc1xcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKkxhcmdlc3QgQ29udGVudGZ1bCBQYWludCoqOiAke3Jlc3VsdC51aU1ldHJpY3MubGFyZ2VzdENvbnRlbnRmdWxQYWludC50b0ZpeGVkKDApfW1zXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoqQ3VtdWxhdGl2ZSBMYXlvdXQgU2hpZnQqKjogJHtyZXN1bHQudWlNZXRyaWNzLmN1bXVsYXRpdmVMYXlvdXRTaGlmdC50b0ZpeGVkKDMpfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKkZpcnN0IElucHV0IERlbGF5Kio6ICR7cmVzdWx0LnVpTWV0cmljcy5maXJzdElucHV0RGVsYXkudG9GaXhlZCgwKX1tc1xcbmA7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQucmVzcG9uc2l2ZU1ldHJpY3MpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44Oi44OQ44Kk44Or5a++5b+cKio6ICR7dGhpcy5mb3JtYXRWaWV3cG9ydFJlc3VsdChyZXN1bHQucmVzcG9uc2l2ZU1ldHJpY3MubW9iaWxlVmlld3BvcnQpfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuOCv+ODluODrOODg+ODiOWvvuW/nCoqOiAke3RoaXMuZm9ybWF0Vmlld3BvcnRSZXN1bHQocmVzdWx0LnJlc3BvbnNpdmVNZXRyaWNzLnRhYmxldFZpZXdwb3J0KX1cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKirjg4fjgrnjgq/jg4jjg4Pjg5flr77lv5wqKjogJHt0aGlzLmZvcm1hdFZpZXdwb3J0UmVzdWx0KHJlc3VsdC5yZXNwb25zaXZlTWV0cmljcy5kZXNrdG9wVmlld3BvcnQpfVxcbmA7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQuYWNjZXNzaWJpbGl0eU1ldHJpY3MpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoqV0NBRyBBQea6luaLoOeOhyoqOiAkeyhyZXN1bHQuYWNjZXNzaWJpbGl0eU1ldHJpY3Mud2NhZ0FBQ29tcGxpYW5jZSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq6Imy5b2p44Kz44Oz44OI44Op44K544OI5q+UKio6ICR7cmVzdWx0LmFjY2Vzc2liaWxpdHlNZXRyaWNzLmNvbG9yQ29udHJhc3RSYXRpby50b0ZpeGVkKDEpfToxXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44Kt44O844Oc44O844OJ44OK44OT44Ky44O844K344On44OzKio6ICR7cmVzdWx0LmFjY2Vzc2liaWxpdHlNZXRyaWNzLmtleWJvYXJkTmF2aWdhdGlvbiA/ICflr77lv5wnIDogJ+acquWvvuW/nCd9XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44K544Kv44Oq44O844Oz44Oq44O844OA44O85a++5b+cKio6ICR7cmVzdWx0LmFjY2Vzc2liaWxpdHlNZXRyaWNzLnNjcmVlblJlYWRlckNvbXBhdGliaWxpdHkgPyAn5a++5b+cJyA6ICfmnKrlr77lv5wnfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuS7o+abv+ODhuOCreOCueODiOOCq+ODkOODrOODg+OCuCoqOiAkeyhyZXN1bHQuYWNjZXNzaWJpbGl0eU1ldHJpY3MuYWx0VGV4dENvdmVyYWdlICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0LnVzYWJpbGl0eU1ldHJpY3MpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44OK44OT44Ky44O844K344On44Oz5Yq5546HKio6ICR7KHJlc3VsdC51c2FiaWxpdHlNZXRyaWNzLm5hdmlnYXRpb25FZmZpY2llbmN5ICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKirjg5Xjgqnjg7zjg6Dkvb/jgYTjgoTjgZnjgZUqKjogJHsocmVzdWx0LnVzYWJpbGl0eU1ldHJpY3MuZm9ybVVzYWJpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44Ko44Op44O844OP44Oz44OJ44Oq44Oz44KwKio6ICR7KHJlc3VsdC51c2FiaWxpdHlNZXRyaWNzLmVycm9ySGFuZGxpbmcgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuODpuODvOOCtuODvOODleODreODvOWujOS6hueOhyoqOiAkeyhyZXN1bHQudXNhYmlsaXR5TWV0cmljcy51c2VyRmxvd0NvbXBsZXRpb24gKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44Ko44Op44O8Kio6ICR7cmVzdWx0LmVycm9yfVxcbmA7XG4gICAgICB9XG5cbiAgICAgIHJlcG9ydCArPSBgXFxuYDtcbiAgICB9XG5cbiAgICAvLyDmjqjlpajkuovpoIVcbiAgICByZXBvcnQgKz0gYCMjIOaOqOWlqOS6i+mghVxcblxcbmA7XG4gICAgXG4gICAgaWYgKHN1bW1hcnkuYXZlcmFnZVBhZ2VMb2FkVGltZSA+IDIwMDApIHtcbiAgICAgIHJlcG9ydCArPSBgLSAqKuODkeODleOCqeODvOODnuODs+OCueaUueWWhCoqOiDlubPlnYfjg5rjg7zjgrjoqq3jgb/ovrzjgb/mmYLplpPjgYwke3N1bW1hcnkuYXZlcmFnZVBhZ2VMb2FkVGltZS50b0ZpeGVkKDApfW1z44Gn44GZ44CC55S75YOP5pyA6YGp5YyW44CB44Kz44O844OJ5YiG5Ymy44CBQ0RO5rS755So44KS5qSc6KiO44GX44Gm44GP44Gg44GV44GE44CCXFxuYDtcbiAgICB9XG4gICAgXG4gICAgaWYgKHN1bW1hcnkud2NhZ0NvbXBsaWFuY2VSYXRlIDwgMC45KSB7XG4gICAgICByZXBvcnQgKz0gYC0gKirjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPlkJHkuIoqKjogV0NBRyBBQea6luaLoOeOh+OBjCR7KHN1bW1hcnkud2NhZ0NvbXBsaWFuY2VSYXRlICogMTAwKS50b0ZpeGVkKDEpfSXjgafjgZnjgIJBUklB44Op44OZ44Or44CB44Kt44O844Oc44O844OJ44OK44OT44Ky44O844K344On44Oz44CB6Imy5b2p44Kz44Oz44OI44Op44K544OI44Gu5pS55ZaE44KS5qSc6KiO44GX44Gm44GP44Gg44GV44GE44CCXFxuYDtcbiAgICB9XG4gICAgXG4gICAgaWYgKHN1bW1hcnkucmVzcG9uc2l2ZUNvbXBhdGliaWxpdHkgPCAwLjkpIHtcbiAgICAgIHJlcG9ydCArPSBgLSAqKuODrOOCueODneODs+OCt+ODluaUueWWhCoqOiDjg6zjgrnjg53jg7Pjgrfjg5bkupLmj5vmgKfjgYwkeyhzdW1tYXJ5LnJlc3BvbnNpdmVDb21wYXRpYmlsaXR5ICogMTAwKS50b0ZpeGVkKDEpfSXjgafjgZnjgILjg6Ljg5DjgqTjg6vjg5XjgqHjg7zjgrnjg4jjg4fjgrbjgqTjg7Pjgajjg5bjg6zjg7zjgq/jg53jgqTjg7Pjg4jjga7opovnm7TjgZfjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYTjgIJcXG5gO1xuICAgIH1cbiAgICBcbiAgICBpZiAoc3VtbWFyeS51c2FiaWxpdHlTY29yZSA8IDAuOCkge1xuICAgICAgcmVwb3J0ICs9IGAtICoq44Om44O844K244OT44Oq44OG44Kj5ZCR5LiKKio6IOODpuODvOOCtuODk+ODquODhuOCo+OCueOCs+OCouOBjCR7KHN1bW1hcnkudXNhYmlsaXR5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JeOBp+OBmeOAguODpuODvOOCtuODvOODleODreODvOOBruewoee0oOWMluOBqOOCqOODqeODvOODoeODg+OCu+ODvOOCuOOBruaUueWWhOOCkuaknOiojuOBl+OBpuOBj+OBoOOBleOBhOOAglxcbmA7XG4gICAgfVxuXG4gICAgcmVwb3J0ICs9IGBcXG4jIyDmrKHlm57jg4bjgrnjg4jjgavlkJHjgZHjgaZcXG5cXG5gO1xuICAgIHJlcG9ydCArPSBgLSDlrprmnJ/nmoTjgapVSS9VWOODhuOCueODiOOBruWun+ihjO+8iOaciOasoeaOqOWlqO+8iVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtIOODpuODvOOCtuODvOODleOCo+ODvOODieODkOODg+OCr+OBruWPjumbhuOBqOWIhuaekFxcbmA7XG4gICAgcmVwb3J0ICs9IGAtIOaWsOapn+iDvei/veWKoOaZguOBrlVJL1VY5b2x6Z+/6KmV5L6hXFxuYDtcbiAgICByZXBvcnQgKz0gYC0g44Ki44Kv44K744K344OT44Oq44OG44Kj44Ks44Kk44OJ44Op44Kk44Oz44Gu57aZ57aa55qE44Gq6YG15a6IXFxuYDtcbiAgICByZXBvcnQgKz0gYC0g44OR44OV44Kp44O844Oe44Oz44K55pyA6YGp5YyW44Gu57aZ57aa55qE44Gq5a6f5pa9XFxuYDtcblxuICAgIHJldHVybiByZXBvcnQ7XG4gIH1cblxuICAvKipcbiAgICog44OT44Ol44O844Od44O844OI57WQ5p6c44Gu44OV44Kp44O844Oe44OD44OIXG4gICAqL1xuICBwcml2YXRlIGZvcm1hdFZpZXdwb3J0UmVzdWx0KHZpZXdwb3J0OiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICghdmlld3BvcnQpIHJldHVybiAn5pyq44OG44K544OIJztcbiAgICBcbiAgICBjb25zdCBzY29yZSA9IFtcbiAgICAgIHZpZXdwb3J0LmxheW91dFN0YWJpbGl0eSxcbiAgICAgIHZpZXdwb3J0LmNvbnRlbnRWaXNpYmlsaXR5LFxuICAgICAgdmlld3BvcnQubmF2aWdhdGlvblVzYWJpbGl0eSxcbiAgICAgIHZpZXdwb3J0LnRleHRSZWFkYWJpbGl0eSxcbiAgICAgIHZpZXdwb3J0LmJ1dHRvbkFjY2Vzc2liaWxpdHlcbiAgICBdLmZpbHRlcihCb29sZWFuKS5sZW5ndGg7XG4gICAgXG4gICAgcmV0dXJuIGAke3Njb3JlfS816aCF55uu5a++5b+cYDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kgVUkvVVjjg4bjgrnjg4jjg6njg7Pjg4rjg7zjgpLjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK0uLi4nKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy50ZXN0TW9kdWxlLmNsZWFudXAoKTtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgVUkvVVjjg4bjgrnjg4jjg6njg7Pjg4rjg7zjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKCfimqDvuI8g44Kv44Oq44O844Oz44Ki44OD44OX5Lit44Gr44Ko44Op44O844GM55m655SfOicsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVUlVWFRlc3RSdW5uZXI7Il19