"use strict";
/**
 * UI統合テストランナー
 * 全UIテストの統合実行と結果集計
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIIntegrationTestRunner = void 0;
exports.runUIIntegrationTest = runUIIntegrationTest;
const responsive_design_test_1 = require("./responsive-design-test");
const realtime_chat_test_1 = require("./realtime-chat-test");
const document_source_display_test_1 = require("./document-source-display-test");
const accessibility_test_1 = require("./accessibility-test");
class UIIntegrationTestRunner {
    config;
    testStartTime = 0;
    constructor(config) {
        this.config = config;
    }
    /**
     * UI統合テストの実行
     */
    async runTests() {
        console.log('🎨 UI統合テストを開始します...');
        console.log(`🌐 テスト環境: ${this.config.testEnvironment}`);
        console.log(`🔗 ベースURL: ${this.config.baseUrl}`);
        this.testStartTime = Date.now();
        try {
            const results = {
                testName: 'UIIntegrationTest',
                success: false,
                duration: 0,
                details: {}
            };
            // レスポンシブデザインテスト
            if (this.config.enabledTests.responsiveDesign) {
                console.log('\n📱 レスポンシブデザインテストを実行中...');
                results.responsiveDesignResult = await this.runResponsiveDesignTest();
            }
            // リアルタイムチャットテスト
            if (this.config.enabledTests.realtimeChat) {
                console.log('\n💬 リアルタイムチャットテストを実行中...');
                results.realtimeChatResult = await this.runRealtimeChatTest();
            }
            // 文書ソース表示テスト
            if (this.config.enabledTests.documentSourceDisplay) {
                console.log('\n📚 文書ソース表示テストを実行中...');
                results.documentSourceDisplayResult = await this.runDocumentSourceDisplayTest();
            }
            // アクセシビリティテスト
            if (this.config.enabledTests.accessibility) {
                console.log('\n♿ アクセシビリティテストを実行中...');
                results.accessibilityResult = await this.runAccessibilityTest();
            }
            // 結果の統合と評価
            const finalResult = this.aggregateResults(results);
            // レポート生成
            await this.generateReports(finalResult);
            return finalResult;
        }
        catch (error) {
            console.error('❌ UI統合テストでエラーが発生:', error);
            return {
                testName: 'UIIntegrationTest',
                success: false,
                duration: Date.now() - this.testStartTime,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    testEnvironment: this.config.testEnvironment
                },
                overallUIScore: 0,
                userExperienceScore: 0,
                performanceScore: 0,
                accessibilityScore: 0,
                functionalityScore: 0,
                testSummary: {
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 1,
                    criticalIssues: 1,
                    majorIssues: 0,
                    minorIssues: 0,
                    testCoverage: 0,
                    executionTime: Date.now() - this.testStartTime
                },
                recommendations: [
                    'システムの接続と設定を確認してください',
                    'テスト環境の準備状況を確認してください'
                ]
            };
        }
    }
    /**
     * レスポンシブデザインテストの実行
     */
    async runResponsiveDesignTest() {
        const config = {
            baseUrl: this.config.baseUrl,
            testPages: [
                '/',
                '/chatbot',
                '/login',
                '/dashboard'
            ],
            devices: [
                {
                    name: 'iPhone 12',
                    width: 390,
                    height: 844,
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                    deviceType: 'mobile',
                    touchEnabled: true
                },
                {
                    name: 'iPad Air',
                    width: 820,
                    height: 1180,
                    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                    deviceType: 'tablet',
                    touchEnabled: true
                },
                {
                    name: 'Desktop 1920x1080',
                    width: 1920,
                    height: 1080,
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    deviceType: 'desktop',
                    touchEnabled: false
                }
            ],
            performanceThresholds: {
                loadTime: 2000,
                renderTime: 1000,
                interactionTime: 100
            },
            accessibilityThresholds: {
                minScore: 85,
                wcagLevel: 'AA'
            }
        };
        const test = new responsive_design_test_1.ResponsiveDesignTest(config);
        return await test.runTest();
    }
    /**
     * リアルタイムチャットテストの実行
     */
    async runRealtimeChatTest() {
        const config = {
            baseUrl: this.config.baseUrl,
            testUsers: [
                {
                    userId: 'testuser',
                    username: 'testuser',
                    role: 'user',
                    permissions: ['chat:read', 'chat:write']
                },
                {
                    userId: 'admin',
                    username: 'admin',
                    role: 'admin',
                    permissions: ['chat:read', 'chat:write', 'chat:moderate']
                }
            ],
            messageTypes: [
                { type: 'text' },
                { type: 'file', maxSize: 10485760, allowedFormats: ['pdf', 'doc', 'txt'] },
                { type: 'ai_response' }
            ],
            performanceThresholds: {
                messageDeliveryTime: 500,
                typingIndicatorDelay: 200,
                connectionEstablishmentTime: 2000,
                messageHistoryLoadTime: 1000
            },
            concurrencyLimits: {
                maxConcurrentUsers: 100,
                maxMessagesPerSecond: 50
            }
        };
        const test = new realtime_chat_test_1.RealtimeChatTest(config);
        return await test.runTest();
    }
    /**
     * 文書ソース表示テストの実行
     */
    async runDocumentSourceDisplayTest() {
        const config = {
            baseUrl: this.config.baseUrl,
            testQueries: [
                {
                    id: 'query_1',
                    query: 'AWS Lambda の設定方法について教えてください',
                    expectedSourceCount: 3,
                    expectedSourceTypes: ['document', 'api'],
                    category: 'technical',
                    complexity: 'medium'
                },
                {
                    id: 'query_2',
                    query: 'セキュリティベストプラクティスは何ですか',
                    expectedSourceCount: 4,
                    expectedSourceTypes: ['document'],
                    category: 'business',
                    complexity: 'complex'
                }
            ],
            expectedSources: [],
            displayRequirements: [
                {
                    element: '.source-citation',
                    required: true,
                    format: 'inline',
                    accessibility: true,
                    interactivity: true
                },
                {
                    element: '.source-link',
                    required: true,
                    format: 'hyperlink',
                    accessibility: true,
                    interactivity: true
                }
            ],
            accuracyThresholds: {
                sourceAttributionAccuracy: 85,
                citationFormatCompliance: 90,
                linkValidityRate: 95,
                contentRelevanceScore: 80
            }
        };
        const test = new document_source_display_test_1.DocumentSourceDisplayTest(config);
        return await test.runTest();
    }
    /**
     * アクセシビリティテストの実行
     */
    async runAccessibilityTest() {
        const config = {
            baseUrl: this.config.baseUrl,
            testPages: [
                '/',
                '/chatbot',
                '/login',
                '/dashboard'
            ],
            wcagLevel: 'AA',
            wcagVersion: '2.1',
            testCategories: [
                {
                    name: 'perceivable',
                    principles: [],
                    weight: 0.25,
                    required: true
                },
                {
                    name: 'operable',
                    principles: [],
                    weight: 0.25,
                    required: true
                },
                {
                    name: 'understandable',
                    principles: [],
                    weight: 0.25,
                    required: true
                },
                {
                    name: 'robust',
                    principles: [],
                    weight: 0.25,
                    required: true
                }
            ],
            complianceThresholds: {
                overallScore: 85,
                categoryMinimums: {
                    perceivable: 80,
                    operable: 85,
                    understandable: 80,
                    robust: 85
                },
                criticalIssueLimit: 0
            }
        };
        const test = new accessibility_test_1.AccessibilityTest(config);
        return await test.runTest();
    }
    /**
     * 結果の統合と評価
     */
    aggregateResults(results) {
        const duration = Date.now() - this.testStartTime;
        // 各テストのスコア収集
        const scores = {
            responsive: results.responsiveDesignResult?.overallResponsiveScore || 0,
            chat: results.realtimeChatResult?.overallChatScore || 0,
            sourceDisplay: results.documentSourceDisplayResult?.overallSourceScore || 0,
            accessibility: results.accessibilityResult?.overallAccessibilityScore || 0
        };
        // 重み付きスコア計算
        const weights = {
            responsive: 0.25,
            chat: 0.25,
            sourceDisplay: 0.25,
            accessibility: 0.25
        };
        const overallUIScore = Object.entries(scores).reduce((sum, [key, score]) => {
            return sum + (score * weights[key]);
        }, 0);
        // カテゴリ別スコア計算
        const userExperienceScore = (scores.responsive + scores.chat) / 2;
        const performanceScore = this.calculatePerformanceScore(results);
        const accessibilityScore = scores.accessibility;
        const functionalityScore = (scores.chat + scores.sourceDisplay) / 2;
        // テストサマリーの作成
        const testSummary = this.createTestSummary(results, duration);
        // 推奨事項の生成
        const recommendations = this.generateRecommendations(results, scores);
        // 成功判定
        const success = overallUIScore >= 85 &&
            testSummary.criticalIssues === 0 &&
            accessibilityScore >= 85;
        return {
            testName: 'UIIntegrationTest',
            success,
            duration,
            details: {
                testEnvironment: this.config.testEnvironment,
                enabledTests: this.config.enabledTests,
                overallScore: overallUIScore,
                individualScores: scores
            },
            ...results,
            overallUIScore,
            userExperienceScore,
            performanceScore,
            accessibilityScore,
            functionalityScore,
            testSummary,
            recommendations
        };
    }
    /**
     * パフォーマンススコアの計算
     */
    calculatePerformanceScore(results) {
        let totalScore = 0;
        let count = 0;
        if (results.responsiveDesignResult) {
            totalScore += results.responsiveDesignResult.performanceScore;
            count++;
        }
        if (results.realtimeChatResult) {
            totalScore += results.realtimeChatResult.performanceScore;
            count++;
        }
        return count > 0 ? totalScore / count : 0;
    }
    /**
     * テストサマリーの作成
     */
    createTestSummary(results, duration) {
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let criticalIssues = 0;
        let majorIssues = 0;
        let minorIssues = 0;
        // レスポンシブデザインテスト
        if (results.responsiveDesignResult) {
            totalTests++;
            if (results.responsiveDesignResult.success)
                passedTests++;
            else
                failedTests++;
            results.responsiveDesignResult.deviceResults.forEach(device => {
                device.pageResults.forEach(page => {
                    page.issues.forEach(issue => {
                        if (issue.severity === 'critical')
                            criticalIssues++;
                        else if (issue.severity === 'major')
                            majorIssues++;
                        else
                            minorIssues++;
                    });
                });
            });
        }
        // リアルタイムチャットテスト
        if (results.realtimeChatResult) {
            totalTests++;
            if (results.realtimeChatResult.success)
                passedTests++;
            else
                failedTests++;
        }
        // 文書ソース表示テスト
        if (results.documentSourceDisplayResult) {
            totalTests++;
            if (results.documentSourceDisplayResult.success)
                passedTests++;
            else
                failedTests++;
            results.documentSourceDisplayResult.queryResults.forEach(query => {
                query.issues.forEach(issue => {
                    if (issue.severity === 'critical')
                        criticalIssues++;
                    else if (issue.severity === 'major')
                        majorIssues++;
                    else
                        minorIssues++;
                });
            });
        }
        // アクセシビリティテスト
        if (results.accessibilityResult) {
            totalTests++;
            if (results.accessibilityResult.success)
                passedTests++;
            else
                failedTests++;
            criticalIssues += results.accessibilityResult.criticalIssueCount;
            // 他の問題レベルも集計
        }
        const testCoverage = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        return {
            totalTests,
            passedTests,
            failedTests,
            criticalIssues,
            majorIssues,
            minorIssues,
            testCoverage,
            executionTime: duration
        };
    }
    /**
     * 推奨事項の生成
     */
    generateRecommendations(results, scores) {
        const recommendations = [];
        // レスポンシブデザインの推奨事項
        if (scores.responsive < 85) {
            recommendations.push('レスポンシブデザインの改善が必要です。特にモバイル表示の最適化を行ってください。');
        }
        // チャット機能の推奨事項
        if (scores.chat < 85) {
            recommendations.push('リアルタイムチャット機能の安定性とパフォーマンスを改善してください。');
        }
        // ソース表示の推奨事項
        if (scores.sourceDisplay < 85) {
            recommendations.push('文書ソースの表示精度と引用フォーマットを改善してください。');
        }
        // アクセシビリティの推奨事項
        if (scores.accessibility < 85) {
            recommendations.push('WCAG 2.1 AA準拠のためのアクセシビリティ改善が必要です。');
        }
        // 重要な問題がある場合
        if (results.accessibilityResult?.criticalIssueCount && results.accessibilityResult.criticalIssueCount > 0) {
            recommendations.push(`重要なアクセシビリティ問題 ${results.accessibilityResult.criticalIssueCount}件 を優先的に修正してください。`);
        }
        // パフォーマンス関連
        const performanceScore = this.calculatePerformanceScore(results);
        if (performanceScore < 80) {
            recommendations.push('ページ読み込み時間とインタラクション応答時間の改善が必要です。');
        }
        // 一般的な推奨事項
        if (recommendations.length === 0) {
            recommendations.push('すべてのUIテストが良好な結果を示しています。現在の品質を維持してください。');
        }
        return recommendations;
    }
    /**
     * レポート生成
     */
    async generateReports(result) {
        if (!this.config.reportingConfig.detailedLogs)
            return;
        console.log('\n📊 UI統合テスト最終結果:');
        console.log('='.repeat(60));
        console.log(`✅ 総合UIスコア: ${result.overallUIScore.toFixed(1)}/100`);
        console.log(`👤 ユーザーエクスペリエンス: ${result.userExperienceScore.toFixed(1)}/100`);
        console.log(`⚡ パフォーマンス: ${result.performanceScore.toFixed(1)}/100`);
        console.log(`♿ アクセシビリティ: ${result.accessibilityScore.toFixed(1)}/100`);
        console.log(`🔧 機能性: ${result.functionalityScore.toFixed(1)}/100`);
        console.log('\n📈 テストサマリー:');
        console.log(`  総テスト数: ${result.testSummary.totalTests}`);
        console.log(`  合格: ${result.testSummary.passedTests}`);
        console.log(`  不合格: ${result.testSummary.failedTests}`);
        console.log(`  テストカバレッジ: ${result.testSummary.testCoverage.toFixed(1)}%`);
        console.log(`  実行時間: ${(result.testSummary.executionTime / 1000).toFixed(1)}秒`);
        if (result.testSummary.criticalIssues > 0 || result.testSummary.majorIssues > 0) {
            console.log('\n⚠️  検出された問題:');
            if (result.testSummary.criticalIssues > 0) {
                console.log(`  🔴 重要: ${result.testSummary.criticalIssues}件`);
            }
            if (result.testSummary.majorIssues > 0) {
                console.log(`  🟡 主要: ${result.testSummary.majorIssues}件`);
            }
            if (result.testSummary.minorIssues > 0) {
                console.log(`  🟢 軽微: ${result.testSummary.minorIssues}件`);
            }
        }
        console.log('\n💡 推奨事項:');
        result.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
        if (result.success) {
            console.log('\n🎉 UI統合テスト: 合格');
            console.log('   すべてのUIコンポーネントが品質基準を満たしています');
        }
        else {
            console.log('\n❌ UI統合テスト: 不合格');
            console.log('   UIの品質改善が必要です');
        }
        console.log('='.repeat(60));
    }
}
exports.UIIntegrationTestRunner = UIIntegrationTestRunner;
/**
 * デフォルト設定でのUI統合テスト実行
 */
async function runUIIntegrationTest(baseUrl = 'http://localhost:3000', testEnvironment = 'development') {
    const config = {
        baseUrl,
        enabledTests: {
            responsiveDesign: true,
            realtimeChat: true,
            documentSourceDisplay: true,
            accessibility: true
        },
        testEnvironment,
        browserConfig: {
            headless: false,
            viewport: { width: 1920, height: 1080 },
            timeout: 30000
        },
        reportingConfig: {
            generateScreenshots: true,
            generateVideoRecording: false,
            detailedLogs: true
        }
    };
    const runner = new UIIntegrationTestRunner(config);
    return await runner.runTests();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktaW50ZWdyYXRpb24tdGVzdC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1aS1pbnRlZ3JhdGlvbi10ZXN0LXJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFpbUJILG9EQTJCQztBQXpuQkQscUVBQTRHO0FBQzVHLDZEQUF3RztBQUN4RyxpRkFBK0g7QUFDL0gsNkRBQTJHO0FBZ0QzRyxNQUFhLHVCQUF1QjtJQUMxQixNQUFNLENBQTBCO0lBQ2hDLGFBQWEsR0FBVyxDQUFDLENBQUM7SUFFbEMsWUFBWSxNQUErQjtRQUN6QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFFakQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFaEMsSUFBSSxDQUFDO1lBQ0gsTUFBTSxPQUFPLEdBQXFDO2dCQUNoRCxRQUFRLEVBQUUsbUJBQW1CO2dCQUM3QixPQUFPLEVBQUUsS0FBSztnQkFDZCxRQUFRLEVBQUUsQ0FBQztnQkFDWCxPQUFPLEVBQUUsRUFBRTthQUNaLENBQUM7WUFFRixnQkFBZ0I7WUFDaEIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7Z0JBQ3pDLE9BQU8sQ0FBQyxzQkFBc0IsR0FBRyxNQUFNLElBQUksQ0FB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QUcsSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuRCxPQUFPLE1BQU0sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFVJ57Wx5ZCI44OG44K544OI44Op44Oz44OK44O8XG4gKiDlhahVSeODhuOCueODiOOBrue1seWQiOWun+ihjOOBqOe1kOaenOmbhuioiFxuICovXG5cbmltcG9ydCB7IFRlc3RSZXN1bHQgfSBmcm9tICcuLi8uLi90eXBlcy90ZXN0LXR5cGVzJztcbmltcG9ydCB7IFJlc3BvbnNpdmVEZXNpZ25UZXN0LCBSZXNwb25zaXZlVGVzdENvbmZpZywgUmVzcG9uc2l2ZVRlc3RSZXN1bHQgfSBmcm9tICcuL3Jlc3BvbnNpdmUtZGVzaWduLXRlc3QnO1xuaW1wb3J0IHsgUmVhbHRpbWVDaGF0VGVzdCwgUmVhbHRpbWVDaGF0VGVzdENvbmZpZywgUmVhbHRpbWVDaGF0VGVzdFJlc3VsdCB9IGZyb20gJy4vcmVhbHRpbWUtY2hhdC10ZXN0JztcbmltcG9ydCB7IERvY3VtZW50U291cmNlRGlzcGxheVRlc3QsIERvY3VtZW50U291cmNlVGVzdENvbmZpZywgRG9jdW1lbnRTb3VyY2VUZXN0UmVzdWx0IH0gZnJvbSAnLi9kb2N1bWVudC1zb3VyY2UtZGlzcGxheS10ZXN0JztcbmltcG9ydCB7IEFjY2Vzc2liaWxpdHlUZXN0LCBBY2Nlc3NpYmlsaXR5VGVzdENvbmZpZywgQWNjZXNzaWJpbGl0eVRlc3RSZXN1bHQgfSBmcm9tICcuL2FjY2Vzc2liaWxpdHktdGVzdCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVUlJbnRlZ3JhdGlvblRlc3RDb25maWcge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGVuYWJsZWRUZXN0czoge1xuICAgIHJlc3BvbnNpdmVEZXNpZ246IGJvb2xlYW47XG4gICAgcmVhbHRpbWVDaGF0OiBib29sZWFuO1xuICAgIGRvY3VtZW50U291cmNlRGlzcGxheTogYm9vbGVhbjtcbiAgICBhY2Nlc3NpYmlsaXR5OiBib29sZWFuO1xuICB9O1xuICB0ZXN0RW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcgfCAnc3RhZ2luZycgfCAncHJvZHVjdGlvbic7XG4gIGJyb3dzZXJDb25maWc6IHtcbiAgICBoZWFkbGVzczogYm9vbGVhbjtcbiAgICB2aWV3cG9ydDogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xuICAgIHRpbWVvdXQ6IG51bWJlcjtcbiAgfTtcbiAgcmVwb3J0aW5nQ29uZmlnOiB7XG4gICAgZ2VuZXJhdGVTY3JlZW5zaG90czogYm9vbGVhbjtcbiAgICBnZW5lcmF0ZVZpZGVvUmVjb3JkaW5nOiBib29sZWFuO1xuICAgIGRldGFpbGVkTG9nczogYm9vbGVhbjtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVSUludGVncmF0aW9uVGVzdFJlc3VsdCBleHRlbmRzIFRlc3RSZXN1bHQge1xuICByZXNwb25zaXZlRGVzaWduUmVzdWx0PzogUmVzcG9uc2l2ZVRlc3RSZXN1bHQ7XG4gIHJlYWx0aW1lQ2hhdFJlc3VsdD86IFJlYWx0aW1lQ2hhdFRlc3RSZXN1bHQ7XG4gIGRvY3VtZW50U291cmNlRGlzcGxheVJlc3VsdD86IERvY3VtZW50U291cmNlVGVzdFJlc3VsdDtcbiAgYWNjZXNzaWJpbGl0eVJlc3VsdD86IEFjY2Vzc2liaWxpdHlUZXN0UmVzdWx0O1xuICBvdmVyYWxsVUlTY29yZTogbnVtYmVyO1xuICB1c2VyRXhwZXJpZW5jZVNjb3JlOiBudW1iZXI7XG4gIHBlcmZvcm1hbmNlU2NvcmU6IG51bWJlcjtcbiAgYWNjZXNzaWJpbGl0eVNjb3JlOiBudW1iZXI7XG4gIGZ1bmN0aW9uYWxpdHlTY29yZTogbnVtYmVyO1xuICB0ZXN0U3VtbWFyeTogVGVzdFN1bW1hcnk7XG4gIHJlY29tbWVuZGF0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdFN1bW1hcnkge1xuICB0b3RhbFRlc3RzOiBudW1iZXI7XG4gIHBhc3NlZFRlc3RzOiBudW1iZXI7XG4gIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gIGNyaXRpY2FsSXNzdWVzOiBudW1iZXI7XG4gIG1ham9ySXNzdWVzOiBudW1iZXI7XG4gIG1pbm9ySXNzdWVzOiBudW1iZXI7XG4gIHRlc3RDb3ZlcmFnZTogbnVtYmVyO1xuICBleGVjdXRpb25UaW1lOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBVSUludGVncmF0aW9uVGVzdFJ1bm5lciB7XG4gIHByaXZhdGUgY29uZmlnOiBVSUludGVncmF0aW9uVGVzdENvbmZpZztcbiAgcHJpdmF0ZSB0ZXN0U3RhcnRUaW1lOiBudW1iZXIgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogVUlJbnRlZ3JhdGlvblRlc3RDb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiBVSee1seWQiOODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgYXN5bmMgcnVuVGVzdHMoKTogUHJvbWlzZTxVSUludGVncmF0aW9uVGVzdFJlc3VsdD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn46oIFVJ57Wx5ZCI44OG44K544OI44KS6ZaL5aeL44GX44G+44GZLi4uJyk7XG4gICAgY29uc29sZS5sb2coYPCfjJAg44OG44K544OI55Kw5aKDOiAke3RoaXMuY29uZmlnLnRlc3RFbnZpcm9ubWVudH1gKTtcbiAgICBjb25zb2xlLmxvZyhg8J+UlyDjg5njg7zjgrlVUkw6ICR7dGhpcy5jb25maWcuYmFzZVVybH1gKTtcbiAgICBcbiAgICB0aGlzLnRlc3RTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdHM6IFBhcnRpYWw8VUlJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+ID0ge1xuICAgICAgICB0ZXN0TmFtZTogJ1VJSW50ZWdyYXRpb25UZXN0JyxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGR1cmF0aW9uOiAwLFxuICAgICAgICBkZXRhaWxzOiB7fVxuICAgICAgfTtcblxuICAgICAgLy8g44Os44K544Od44Oz44K344OW44OH44K244Kk44Oz44OG44K544OIXG4gICAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZFRlc3RzLnJlc3BvbnNpdmVEZXNpZ24pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcbvCfk7Eg44Os44K544Od44Oz44K344OW44OH44K244Kk44Oz44OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgICAgIHJlc3VsdHMucmVzcG9uc2l2ZURlc2lnblJlc3VsdCA9IGF3YWl0IHRoaXMucnVuUmVzcG9uc2l2ZURlc2lnblRlc3QoKTtcbiAgICAgIH1cblxuICAgICAgLy8g44Oq44Ki44Or44K/44Kk44Og44OB44Oj44OD44OI44OG44K544OIXG4gICAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZFRlc3RzLnJlYWx0aW1lQ2hhdCkge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxu8J+SrCDjg6rjgqLjg6vjgr/jgqTjg6Djg4Hjg6Pjg4Pjg4jjg4bjgrnjg4jjgpLlrp/ooYzkuK0uLi4nKTtcbiAgICAgICAgcmVzdWx0cy5yZWFsdGltZUNoYXRSZXN1bHQgPSBhd2FpdCB0aGlzLnJ1blJlYWx0aW1lQ2hhdFRlc3QoKTtcbiAgICAgIH1cblxuICAgICAgLy8g5paH5pu444K944O844K56KGo56S644OG44K544OIXG4gICAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZFRlc3RzLmRvY3VtZW50U291cmNlRGlzcGxheSkge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxu8J+TmiDmlofmm7jjgr3jg7zjgrnooajnpLrjg4bjgrnjg4jjgpLlrp/ooYzkuK0uLi4nKTtcbiAgICAgICAgcmVzdWx0cy5kb2N1bWVudFNvdXJjZURpc3BsYXlSZXN1bHQgPSBhd2FpdCB0aGlzLnJ1bkRvY3VtZW50U291cmNlRGlzcGxheVRlc3QoKTtcbiAgICAgIH1cblxuICAgICAgLy8g44Ki44Kv44K744K344OT44Oq44OG44Kj44OG44K544OIXG4gICAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlZFRlc3RzLmFjY2Vzc2liaWxpdHkpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcbuKZvyDjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPjg4bjgrnjg4jjgpLlrp/ooYzkuK0uLi4nKTtcbiAgICAgICAgcmVzdWx0cy5hY2Nlc3NpYmlsaXR5UmVzdWx0ID0gYXdhaXQgdGhpcy5ydW5BY2Nlc3NpYmlsaXR5VGVzdCgpO1xuICAgICAgfVxuXG4gICAgICAvLyDntZDmnpzjga7ntbHlkIjjgajoqZXkvqFcbiAgICAgIGNvbnN0IGZpbmFsUmVzdWx0ID0gdGhpcy5hZ2dyZWdhdGVSZXN1bHRzKHJlc3VsdHMpO1xuICAgICAgXG4gICAgICAvLyDjg6zjg53jg7zjg4jnlJ/miJBcbiAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVSZXBvcnRzKGZpbmFsUmVzdWx0KTtcblxuICAgICAgcmV0dXJuIGZpbmFsUmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBVSee1seWQiOODhuOCueODiOOBp+OCqOODqeODvOOBjOeZuueUnzonLCBlcnJvcik7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRlc3ROYW1lOiAnVUlJbnRlZ3JhdGlvblRlc3QnLFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSB0aGlzLnRlc3RTdGFydFRpbWUsXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgICAgdGVzdEVudmlyb25tZW50OiB0aGlzLmNvbmZpZy50ZXN0RW52aXJvbm1lbnRcbiAgICAgICAgfSxcbiAgICAgICAgb3ZlcmFsbFVJU2NvcmU6IDAsXG4gICAgICAgIHVzZXJFeHBlcmllbmNlU2NvcmU6IDAsXG4gICAgICAgIHBlcmZvcm1hbmNlU2NvcmU6IDAsXG4gICAgICAgIGFjY2Vzc2liaWxpdHlTY29yZTogMCxcbiAgICAgICAgZnVuY3Rpb25hbGl0eVNjb3JlOiAwLFxuICAgICAgICB0ZXN0U3VtbWFyeToge1xuICAgICAgICAgIHRvdGFsVGVzdHM6IDAsXG4gICAgICAgICAgcGFzc2VkVGVzdHM6IDAsXG4gICAgICAgICAgZmFpbGVkVGVzdHM6IDEsXG4gICAgICAgICAgY3JpdGljYWxJc3N1ZXM6IDEsXG4gICAgICAgICAgbWFqb3JJc3N1ZXM6IDAsXG4gICAgICAgICAgbWlub3JJc3N1ZXM6IDAsXG4gICAgICAgICAgdGVzdENvdmVyYWdlOiAwLFxuICAgICAgICAgIGV4ZWN1dGlvblRpbWU6IERhdGUubm93KCkgLSB0aGlzLnRlc3RTdGFydFRpbWVcbiAgICAgICAgfSxcbiAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbXG4gICAgICAgICAgJ+OCt+OCueODhuODoOOBruaOpee2muOBqOioreWumuOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhCcsXG4gICAgICAgICAgJ+ODhuOCueODiOeSsOWig+OBrua6luWCmeeKtuazgeOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhCdcbiAgICAgICAgXVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44Os44K544Od44Oz44K344OW44OH44K244Kk44Oz44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHJ1blJlc3BvbnNpdmVEZXNpZ25UZXN0KCk6IFByb21pc2U8UmVzcG9uc2l2ZVRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCBjb25maWc6IFJlc3BvbnNpdmVUZXN0Q29uZmlnID0ge1xuICAgICAgYmFzZVVybDogdGhpcy5jb25maWcuYmFzZVVybCxcbiAgICAgIHRlc3RQYWdlczogW1xuICAgICAgICAnLycsXG4gICAgICAgICcvY2hhdGJvdCcsXG4gICAgICAgICcvbG9naW4nLFxuICAgICAgICAnL2Rhc2hib2FyZCdcbiAgICAgIF0sXG4gICAgICBkZXZpY2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnaVBob25lIDEyJyxcbiAgICAgICAgICB3aWR0aDogMzkwLFxuICAgICAgICAgIGhlaWdodDogODQ0LFxuICAgICAgICAgIHVzZXJBZ2VudDogJ01vemlsbGEvNS4wIChpUGhvbmU7IENQVSBpUGhvbmUgT1MgMTRfMCBsaWtlIE1hYyBPUyBYKSBBcHBsZVdlYktpdC82MDUuMS4xNScsXG4gICAgICAgICAgZGV2aWNlVHlwZTogJ21vYmlsZScsXG4gICAgICAgICAgdG91Y2hFbmFibGVkOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnaVBhZCBBaXInLFxuICAgICAgICAgIHdpZHRoOiA4MjAsXG4gICAgICAgICAgaGVpZ2h0OiAxMTgwLFxuICAgICAgICAgIHVzZXJBZ2VudDogJ01vemlsbGEvNS4wIChpUGFkOyBDUFUgT1MgMTRfMCBsaWtlIE1hYyBPUyBYKSBBcHBsZVdlYktpdC82MDUuMS4xNScsXG4gICAgICAgICAgZGV2aWNlVHlwZTogJ3RhYmxldCcsXG4gICAgICAgICAgdG91Y2hFbmFibGVkOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnRGVza3RvcCAxOTIweDEwODAnLFxuICAgICAgICAgIHdpZHRoOiAxOTIwLFxuICAgICAgICAgIGhlaWdodDogMTA4MCxcbiAgICAgICAgICB1c2VyQWdlbnQ6ICdNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYnLFxuICAgICAgICAgIGRldmljZVR5cGU6ICdkZXNrdG9wJyxcbiAgICAgICAgICB0b3VjaEVuYWJsZWQ6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICAgICAgbG9hZFRpbWU6IDIwMDAsXG4gICAgICAgIHJlbmRlclRpbWU6IDEwMDAsXG4gICAgICAgIGludGVyYWN0aW9uVGltZTogMTAwXG4gICAgICB9LFxuICAgICAgYWNjZXNzaWJpbGl0eVRocmVzaG9sZHM6IHtcbiAgICAgICAgbWluU2NvcmU6IDg1LFxuICAgICAgICB3Y2FnTGV2ZWw6ICdBQSdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgdGVzdCA9IG5ldyBSZXNwb25zaXZlRGVzaWduVGVzdChjb25maWcpO1xuICAgIHJldHVybiBhd2FpdCB0ZXN0LnJ1blRlc3QoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgqLjg6vjgr/jgqTjg6Djg4Hjg6Pjg4Pjg4jjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcnVuUmVhbHRpbWVDaGF0VGVzdCgpOiBQcm9taXNlPFJlYWx0aW1lQ2hhdFRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCBjb25maWc6IFJlYWx0aW1lQ2hhdFRlc3RDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiB0aGlzLmNvbmZpZy5iYXNlVXJsLFxuICAgICAgdGVzdFVzZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB1c2VySWQ6ICd0ZXN0dXNlcicsXG4gICAgICAgICAgdXNlcm5hbWU6ICd0ZXN0dXNlcicsXG4gICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbJ2NoYXQ6cmVhZCcsICdjaGF0OndyaXRlJ11cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHVzZXJJZDogJ2FkbWluJyxcbiAgICAgICAgICB1c2VybmFtZTogJ2FkbWluJyxcbiAgICAgICAgICByb2xlOiAnYWRtaW4nLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbJ2NoYXQ6cmVhZCcsICdjaGF0OndyaXRlJywgJ2NoYXQ6bW9kZXJhdGUnXVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgbWVzc2FnZVR5cGVzOiBbXG4gICAgICAgIHsgdHlwZTogJ3RleHQnIH0sXG4gICAgICAgIHsgdHlwZTogJ2ZpbGUnLCBtYXhTaXplOiAxMDQ4NTc2MCwgYWxsb3dlZEZvcm1hdHM6IFsncGRmJywgJ2RvYycsICd0eHQnXSB9LFxuICAgICAgICB7IHR5cGU6ICdhaV9yZXNwb25zZScgfVxuICAgICAgXSxcbiAgICAgIHBlcmZvcm1hbmNlVGhyZXNob2xkczoge1xuICAgICAgICBtZXNzYWdlRGVsaXZlcnlUaW1lOiA1MDAsXG4gICAgICAgIHR5cGluZ0luZGljYXRvckRlbGF5OiAyMDAsXG4gICAgICAgIGNvbm5lY3Rpb25Fc3RhYmxpc2htZW50VGltZTogMjAwMCxcbiAgICAgICAgbWVzc2FnZUhpc3RvcnlMb2FkVGltZTogMTAwMFxuICAgICAgfSxcbiAgICAgIGNvbmN1cnJlbmN5TGltaXRzOiB7XG4gICAgICAgIG1heENvbmN1cnJlbnRVc2VyczogMTAwLFxuICAgICAgICBtYXhNZXNzYWdlc1BlclNlY29uZDogNTBcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgdGVzdCA9IG5ldyBSZWFsdGltZUNoYXRUZXN0KGNvbmZpZyk7XG4gICAgcmV0dXJuIGF3YWl0IHRlc3QucnVuVGVzdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIOaWh+abuOOCveODvOOCueihqOekuuODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBydW5Eb2N1bWVudFNvdXJjZURpc3BsYXlUZXN0KCk6IFByb21pc2U8RG9jdW1lbnRTb3VyY2VUZXN0UmVzdWx0PiB7XG4gICAgY29uc3QgY29uZmlnOiBEb2N1bWVudFNvdXJjZVRlc3RDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiB0aGlzLmNvbmZpZy5iYXNlVXJsLFxuICAgICAgdGVzdFF1ZXJpZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAncXVlcnlfMScsXG4gICAgICAgICAgcXVlcnk6ICdBV1MgTGFtYmRhIOOBruioreWumuaWueazleOBq+OBpOOBhOOBpuaVmeOBiOOBpuOBj+OBoOOBleOBhCcsXG4gICAgICAgICAgZXhwZWN0ZWRTb3VyY2VDb3VudDogMyxcbiAgICAgICAgICBleHBlY3RlZFNvdXJjZVR5cGVzOiBbJ2RvY3VtZW50JywgJ2FwaSddLFxuICAgICAgICAgIGNhdGVnb3J5OiAndGVjaG5pY2FsJyxcbiAgICAgICAgICBjb21wbGV4aXR5OiAnbWVkaXVtJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdxdWVyeV8yJyxcbiAgICAgICAgICBxdWVyeTogJ+OCu+OCreODpeODquODhuOCo+ODmeOCueODiOODl+ODqeOCr+ODhuOCo+OCueOBr+S9leOBp+OBmeOBiycsXG4gICAgICAgICAgZXhwZWN0ZWRTb3VyY2VDb3VudDogNCxcbiAgICAgICAgICBleHBlY3RlZFNvdXJjZVR5cGVzOiBbJ2RvY3VtZW50J10sXG4gICAgICAgICAgY2F0ZWdvcnk6ICdidXNpbmVzcycsXG4gICAgICAgICAgY29tcGxleGl0eTogJ2NvbXBsZXgnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBleHBlY3RlZFNvdXJjZXM6IFtdLFxuICAgICAgZGlzcGxheVJlcXVpcmVtZW50czogW1xuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJy5zb3VyY2UtY2l0YXRpb24nLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIGZvcm1hdDogJ2lubGluZScsXG4gICAgICAgICAgYWNjZXNzaWJpbGl0eTogdHJ1ZSxcbiAgICAgICAgICBpbnRlcmFjdGl2aXR5OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBlbGVtZW50OiAnLnNvdXJjZS1saW5rJyxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBmb3JtYXQ6ICdoeXBlcmxpbmsnLFxuICAgICAgICAgIGFjY2Vzc2liaWxpdHk6IHRydWUsXG4gICAgICAgICAgaW50ZXJhY3Rpdml0eTogdHJ1ZVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgYWNjdXJhY3lUaHJlc2hvbGRzOiB7XG4gICAgICAgIHNvdXJjZUF0dHJpYnV0aW9uQWNjdXJhY3k6IDg1LFxuICAgICAgICBjaXRhdGlvbkZvcm1hdENvbXBsaWFuY2U6IDkwLFxuICAgICAgICBsaW5rVmFsaWRpdHlSYXRlOiA5NSxcbiAgICAgICAgY29udGVudFJlbGV2YW5jZVNjb3JlOiA4MFxuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCB0ZXN0ID0gbmV3IERvY3VtZW50U291cmNlRGlzcGxheVRlc3QoY29uZmlnKTtcbiAgICByZXR1cm4gYXdhaXQgdGVzdC5ydW5UZXN0KCk7XG4gIH1cblxuICAvKipcbiAgICog44Ki44Kv44K744K344OT44Oq44OG44Kj44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHJ1bkFjY2Vzc2liaWxpdHlUZXN0KCk6IFByb21pc2U8QWNjZXNzaWJpbGl0eVRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCBjb25maWc6IEFjY2Vzc2liaWxpdHlUZXN0Q29uZmlnID0ge1xuICAgICAgYmFzZVVybDogdGhpcy5jb25maWcuYmFzZVVybCxcbiAgICAgIHRlc3RQYWdlczogW1xuICAgICAgICAnLycsXG4gICAgICAgICcvY2hhdGJvdCcsXG4gICAgICAgICcvbG9naW4nLFxuICAgICAgICAnL2Rhc2hib2FyZCdcbiAgICAgIF0sXG4gICAgICB3Y2FnTGV2ZWw6ICdBQScsXG4gICAgICB3Y2FnVmVyc2lvbjogJzIuMScsXG4gICAgICB0ZXN0Q2F0ZWdvcmllczogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ3BlcmNlaXZhYmxlJyxcbiAgICAgICAgICBwcmluY2lwbGVzOiBbXSxcbiAgICAgICAgICB3ZWlnaHQ6IDAuMjUsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdvcGVyYWJsZScsXG4gICAgICAgICAgcHJpbmNpcGxlczogW10sXG4gICAgICAgICAgd2VpZ2h0OiAwLjI1LFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAndW5kZXJzdGFuZGFibGUnLFxuICAgICAgICAgIHByaW5jaXBsZXM6IFtdLFxuICAgICAgICAgIHdlaWdodDogMC4yNSxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ3JvYnVzdCcsXG4gICAgICAgICAgcHJpbmNpcGxlczogW10sXG4gICAgICAgICAgd2VpZ2h0OiAwLjI1LFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBjb21wbGlhbmNlVGhyZXNob2xkczoge1xuICAgICAgICBvdmVyYWxsU2NvcmU6IDg1LFxuICAgICAgICBjYXRlZ29yeU1pbmltdW1zOiB7XG4gICAgICAgICAgcGVyY2VpdmFibGU6IDgwLFxuICAgICAgICAgIG9wZXJhYmxlOiA4NSxcbiAgICAgICAgICB1bmRlcnN0YW5kYWJsZTogODAsXG4gICAgICAgICAgcm9idXN0OiA4NVxuICAgICAgICB9LFxuICAgICAgICBjcml0aWNhbElzc3VlTGltaXQ6IDBcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgdGVzdCA9IG5ldyBBY2Nlc3NpYmlsaXR5VGVzdChjb25maWcpO1xuICAgIHJldHVybiBhd2FpdCB0ZXN0LnJ1blRlc3QoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDntZDmnpzjga7ntbHlkIjjgajoqZXkvqFcbiAgICovXG4gIHByaXZhdGUgYWdncmVnYXRlUmVzdWx0cyhyZXN1bHRzOiBQYXJ0aWFsPFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0Pik6IFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0IHtcbiAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSB0aGlzLnRlc3RTdGFydFRpbWU7XG4gICAgXG4gICAgLy8g5ZCE44OG44K544OI44Gu44K544Kz44Ki5Y+O6ZuGXG4gICAgY29uc3Qgc2NvcmVzID0ge1xuICAgICAgcmVzcG9uc2l2ZTogcmVzdWx0cy5yZXNwb25zaXZlRGVzaWduUmVzdWx0Py5vdmVyYWxsUmVzcG9uc2l2ZVNjb3JlIHx8IDAsXG4gICAgICBjaGF0OiByZXN1bHRzLnJlYWx0aW1lQ2hhdFJlc3VsdD8ub3ZlcmFsbENoYXRTY29yZSB8fCAwLFxuICAgICAgc291cmNlRGlzcGxheTogcmVzdWx0cy5kb2N1bWVudFNvdXJjZURpc3BsYXlSZXN1bHQ/Lm92ZXJhbGxTb3VyY2VTY29yZSB8fCAwLFxuICAgICAgYWNjZXNzaWJpbGl0eTogcmVzdWx0cy5hY2Nlc3NpYmlsaXR5UmVzdWx0Py5vdmVyYWxsQWNjZXNzaWJpbGl0eVNjb3JlIHx8IDBcbiAgICB9O1xuXG4gICAgLy8g6YeN44G/5LuY44GN44K544Kz44Ki6KiI566XXG4gICAgY29uc3Qgd2VpZ2h0cyA9IHtcbiAgICAgIHJlc3BvbnNpdmU6IDAuMjUsXG4gICAgICBjaGF0OiAwLjI1LFxuICAgICAgc291cmNlRGlzcGxheTogMC4yNSxcbiAgICAgIGFjY2Vzc2liaWxpdHk6IDAuMjVcbiAgICB9O1xuXG4gICAgY29uc3Qgb3ZlcmFsbFVJU2NvcmUgPSBPYmplY3QuZW50cmllcyhzY29yZXMpLnJlZHVjZSgoc3VtLCBba2V5LCBzY29yZV0pID0+IHtcbiAgICAgIHJldHVybiBzdW0gKyAoc2NvcmUgKiB3ZWlnaHRzW2tleSBhcyBrZXlvZiB0eXBlb2Ygd2VpZ2h0c10pO1xuICAgIH0sIDApO1xuXG4gICAgLy8g44Kr44OG44K044Oq5Yil44K544Kz44Ki6KiI566XXG4gICAgY29uc3QgdXNlckV4cGVyaWVuY2VTY29yZSA9IChzY29yZXMucmVzcG9uc2l2ZSArIHNjb3Jlcy5jaGF0KSAvIDI7XG4gICAgY29uc3QgcGVyZm9ybWFuY2VTY29yZSA9IHRoaXMuY2FsY3VsYXRlUGVyZm9ybWFuY2VTY29yZShyZXN1bHRzKTtcbiAgICBjb25zdCBhY2Nlc3NpYmlsaXR5U2NvcmUgPSBzY29yZXMuYWNjZXNzaWJpbGl0eTtcbiAgICBjb25zdCBmdW5jdGlvbmFsaXR5U2NvcmUgPSAoc2NvcmVzLmNoYXQgKyBzY29yZXMuc291cmNlRGlzcGxheSkgLyAyO1xuXG4gICAgLy8g44OG44K544OI44K144Oe44Oq44O844Gu5L2c5oiQXG4gICAgY29uc3QgdGVzdFN1bW1hcnkgPSB0aGlzLmNyZWF0ZVRlc3RTdW1tYXJ5KHJlc3VsdHMsIGR1cmF0aW9uKTtcblxuICAgIC8vIOaOqOWlqOS6i+mgheOBrueUn+aIkFxuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9ucyA9IHRoaXMuZ2VuZXJhdGVSZWNvbW1lbmRhdGlvbnMocmVzdWx0cywgc2NvcmVzKTtcblxuICAgIC8vIOaIkOWKn+WIpOWumlxuICAgIGNvbnN0IHN1Y2Nlc3MgPSBvdmVyYWxsVUlTY29yZSA+PSA4NSAmJiBcbiAgICAgICAgICAgICAgICAgICB0ZXN0U3VtbWFyeS5jcml0aWNhbElzc3VlcyA9PT0gMCAmJiBcbiAgICAgICAgICAgICAgICAgICBhY2Nlc3NpYmlsaXR5U2NvcmUgPj0gODU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGVzdE5hbWU6ICdVSUludGVncmF0aW9uVGVzdCcsXG4gICAgICBzdWNjZXNzLFxuICAgICAgZHVyYXRpb24sXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIHRlc3RFbnZpcm9ubWVudDogdGhpcy5jb25maWcudGVzdEVudmlyb25tZW50LFxuICAgICAgICBlbmFibGVkVGVzdHM6IHRoaXMuY29uZmlnLmVuYWJsZWRUZXN0cyxcbiAgICAgICAgb3ZlcmFsbFNjb3JlOiBvdmVyYWxsVUlTY29yZSxcbiAgICAgICAgaW5kaXZpZHVhbFNjb3Jlczogc2NvcmVzXG4gICAgICB9LFxuICAgICAgLi4ucmVzdWx0cyxcbiAgICAgIG92ZXJhbGxVSVNjb3JlLFxuICAgICAgdXNlckV4cGVyaWVuY2VTY29yZSxcbiAgICAgIHBlcmZvcm1hbmNlU2NvcmUsXG4gICAgICBhY2Nlc3NpYmlsaXR5U2NvcmUsXG4gICAgICBmdW5jdGlvbmFsaXR5U2NvcmUsXG4gICAgICB0ZXN0U3VtbWFyeSxcbiAgICAgIHJlY29tbWVuZGF0aW9uc1xuICAgIH0gYXMgVUlJbnRlZ3JhdGlvblRlc3RSZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICog44OR44OV44Kp44O844Oe44Oz44K544K544Kz44Ki44Gu6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVBlcmZvcm1hbmNlU2NvcmUocmVzdWx0czogUGFydGlhbDxVSUludGVncmF0aW9uVGVzdFJlc3VsdD4pOiBudW1iZXIge1xuICAgIGxldCB0b3RhbFNjb3JlID0gMDtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgaWYgKHJlc3VsdHMucmVzcG9uc2l2ZURlc2lnblJlc3VsdCkge1xuICAgICAgdG90YWxTY29yZSArPSByZXN1bHRzLnJlc3BvbnNpdmVEZXNpZ25SZXN1bHQucGVyZm9ybWFuY2VTY29yZTtcbiAgICAgIGNvdW50Kys7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdHMucmVhbHRpbWVDaGF0UmVzdWx0KSB7XG4gICAgICB0b3RhbFNjb3JlICs9IHJlc3VsdHMucmVhbHRpbWVDaGF0UmVzdWx0LnBlcmZvcm1hbmNlU2NvcmU7XG4gICAgICBjb3VudCsrO1xuICAgIH1cblxuICAgIHJldHVybiBjb3VudCA+IDAgPyB0b3RhbFNjb3JlIC8gY291bnQgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIOODhuOCueODiOOCteODnuODquODvOOBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVUZXN0U3VtbWFyeShyZXN1bHRzOiBQYXJ0aWFsPFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0PiwgZHVyYXRpb246IG51bWJlcik6IFRlc3RTdW1tYXJ5IHtcbiAgICBsZXQgdG90YWxUZXN0cyA9IDA7XG4gICAgbGV0IHBhc3NlZFRlc3RzID0gMDtcbiAgICBsZXQgZmFpbGVkVGVzdHMgPSAwO1xuICAgIGxldCBjcml0aWNhbElzc3VlcyA9IDA7XG4gICAgbGV0IG1ham9ySXNzdWVzID0gMDtcbiAgICBsZXQgbWlub3JJc3N1ZXMgPSAwO1xuXG4gICAgLy8g44Os44K544Od44Oz44K344OW44OH44K244Kk44Oz44OG44K544OIXG4gICAgaWYgKHJlc3VsdHMucmVzcG9uc2l2ZURlc2lnblJlc3VsdCkge1xuICAgICAgdG90YWxUZXN0cysrO1xuICAgICAgaWYgKHJlc3VsdHMucmVzcG9uc2l2ZURlc2lnblJlc3VsdC5zdWNjZXNzKSBwYXNzZWRUZXN0cysrO1xuICAgICAgZWxzZSBmYWlsZWRUZXN0cysrO1xuXG4gICAgICByZXN1bHRzLnJlc3BvbnNpdmVEZXNpZ25SZXN1bHQuZGV2aWNlUmVzdWx0cy5mb3JFYWNoKGRldmljZSA9PiB7XG4gICAgICAgIGRldmljZS5wYWdlUmVzdWx0cy5mb3JFYWNoKHBhZ2UgPT4ge1xuICAgICAgICAgIHBhZ2UuaXNzdWVzLmZvckVhY2goaXNzdWUgPT4ge1xuICAgICAgICAgICAgaWYgKGlzc3VlLnNldmVyaXR5ID09PSAnY3JpdGljYWwnKSBjcml0aWNhbElzc3VlcysrO1xuICAgICAgICAgICAgZWxzZSBpZiAoaXNzdWUuc2V2ZXJpdHkgPT09ICdtYWpvcicpIG1ham9ySXNzdWVzKys7XG4gICAgICAgICAgICBlbHNlIG1pbm9ySXNzdWVzKys7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g44Oq44Ki44Or44K/44Kk44Og44OB44Oj44OD44OI44OG44K544OIXG4gICAgaWYgKHJlc3VsdHMucmVhbHRpbWVDaGF0UmVzdWx0KSB7XG4gICAgICB0b3RhbFRlc3RzKys7XG4gICAgICBpZiAocmVzdWx0cy5yZWFsdGltZUNoYXRSZXN1bHQuc3VjY2VzcykgcGFzc2VkVGVzdHMrKztcbiAgICAgIGVsc2UgZmFpbGVkVGVzdHMrKztcbiAgICB9XG5cbiAgICAvLyDmlofmm7jjgr3jg7zjgrnooajnpLrjg4bjgrnjg4hcbiAgICBpZiAocmVzdWx0cy5kb2N1bWVudFNvdXJjZURpc3BsYXlSZXN1bHQpIHtcbiAgICAgIHRvdGFsVGVzdHMrKztcbiAgICAgIGlmIChyZXN1bHRzLmRvY3VtZW50U291cmNlRGlzcGxheVJlc3VsdC5zdWNjZXNzKSBwYXNzZWRUZXN0cysrO1xuICAgICAgZWxzZSBmYWlsZWRUZXN0cysrO1xuXG4gICAgICByZXN1bHRzLmRvY3VtZW50U291cmNlRGlzcGxheVJlc3VsdC5xdWVyeVJlc3VsdHMuZm9yRWFjaChxdWVyeSA9PiB7XG4gICAgICAgIHF1ZXJ5Lmlzc3Vlcy5mb3JFYWNoKGlzc3VlID0+IHtcbiAgICAgICAgICBpZiAoaXNzdWUuc2V2ZXJpdHkgPT09ICdjcml0aWNhbCcpIGNyaXRpY2FsSXNzdWVzKys7XG4gICAgICAgICAgZWxzZSBpZiAoaXNzdWUuc2V2ZXJpdHkgPT09ICdtYWpvcicpIG1ham9ySXNzdWVzKys7XG4gICAgICAgICAgZWxzZSBtaW5vcklzc3VlcysrO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOOCouOCr+OCu+OCt+ODk+ODquODhuOCo+ODhuOCueODiFxuICAgIGlmIChyZXN1bHRzLmFjY2Vzc2liaWxpdHlSZXN1bHQpIHtcbiAgICAgIHRvdGFsVGVzdHMrKztcbiAgICAgIGlmIChyZXN1bHRzLmFjY2Vzc2liaWxpdHlSZXN1bHQuc3VjY2VzcykgcGFzc2VkVGVzdHMrKztcbiAgICAgIGVsc2UgZmFpbGVkVGVzdHMrKztcblxuICAgICAgY3JpdGljYWxJc3N1ZXMgKz0gcmVzdWx0cy5hY2Nlc3NpYmlsaXR5UmVzdWx0LmNyaXRpY2FsSXNzdWVDb3VudDtcbiAgICAgIC8vIOS7luOBruWVj+mhjOODrOODmeODq+OCgumbhuioiFxuICAgIH1cblxuICAgIGNvbnN0IHRlc3RDb3ZlcmFnZSA9IHRvdGFsVGVzdHMgPiAwID8gKHBhc3NlZFRlc3RzIC8gdG90YWxUZXN0cykgKiAxMDAgOiAwO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvdGFsVGVzdHMsXG4gICAgICBwYXNzZWRUZXN0cyxcbiAgICAgIGZhaWxlZFRlc3RzLFxuICAgICAgY3JpdGljYWxJc3N1ZXMsXG4gICAgICBtYWpvcklzc3VlcyxcbiAgICAgIG1pbm9ySXNzdWVzLFxuICAgICAgdGVzdENvdmVyYWdlLFxuICAgICAgZXhlY3V0aW9uVGltZTogZHVyYXRpb25cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOaOqOWlqOS6i+mgheOBrueUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZVJlY29tbWVuZGF0aW9ucyhcbiAgICByZXN1bHRzOiBQYXJ0aWFsPFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0PiwgXG4gICAgc2NvcmVzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+XG4gICk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDjg6zjgrnjg53jg7Pjgrfjg5bjg4fjgrbjgqTjg7Pjga7mjqjlpajkuovpoIVcbiAgICBpZiAoc2NvcmVzLnJlc3BvbnNpdmUgPCA4NSkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+ODrOOCueODneODs+OCt+ODluODh+OCtuOCpOODs+OBruaUueWWhOOBjOW/heimgeOBp+OBmeOAgueJueOBq+ODouODkOOCpOODq+ihqOekuuOBruacgOmBqeWMluOCkuihjOOBo+OBpuOBj+OBoOOBleOBhOOAgicpO1xuICAgIH1cblxuICAgIC8vIOODgeODo+ODg+ODiOapn+iDveOBruaOqOWlqOS6i+mghVxuICAgIGlmIChzY29yZXMuY2hhdCA8IDg1KSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44Oq44Ki44Or44K/44Kk44Og44OB44Oj44OD44OI5qmf6IO944Gu5a6J5a6a5oCn44Go44OR44OV44Kp44O844Oe44Oz44K544KS5pS55ZaE44GX44Gm44GP44Gg44GV44GE44CCJyk7XG4gICAgfVxuXG4gICAgLy8g44K944O844K56KGo56S644Gu5o6o5aWo5LqL6aCFXG4gICAgaWYgKHNjb3Jlcy5zb3VyY2VEaXNwbGF5IDwgODUpIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfmlofmm7jjgr3jg7zjgrnjga7ooajnpLrnsr7luqbjgajlvJXnlKjjg5Xjgqnjg7zjg57jg4Pjg4jjgpLmlLnlloTjgZfjgabjgY/jgaDjgZXjgYTjgIInKTtcbiAgICB9XG5cbiAgICAvLyDjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPjga7mjqjlpajkuovpoIVcbiAgICBpZiAoc2NvcmVzLmFjY2Vzc2liaWxpdHkgPCA4NSkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ1dDQUcgMi4xIEFB5rqW5oug44Gu44Gf44KB44Gu44Ki44Kv44K744K344OT44Oq44OG44Kj5pS55ZaE44GM5b+F6KaB44Gn44GZ44CCJyk7XG4gICAgfVxuXG4gICAgLy8g6YeN6KaB44Gq5ZWP6aGM44GM44GC44KL5aC05ZCIXG4gICAgaWYgKHJlc3VsdHMuYWNjZXNzaWJpbGl0eVJlc3VsdD8uY3JpdGljYWxJc3N1ZUNvdW50ICYmIHJlc3VsdHMuYWNjZXNzaWJpbGl0eVJlc3VsdC5jcml0aWNhbElzc3VlQ291bnQgPiAwKSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaChg6YeN6KaB44Gq44Ki44Kv44K744K344OT44Oq44OG44Kj5ZWP6aGMICR7cmVzdWx0cy5hY2Nlc3NpYmlsaXR5UmVzdWx0LmNyaXRpY2FsSXNzdWVDb3VudH3ku7Yg44KS5YSq5YWI55qE44Gr5L+u5q2j44GX44Gm44GP44Gg44GV44GE44CCYCk7XG4gICAgfVxuXG4gICAgLy8g44OR44OV44Kp44O844Oe44Oz44K56Zai6YCjXG4gICAgY29uc3QgcGVyZm9ybWFuY2VTY29yZSA9IHRoaXMuY2FsY3VsYXRlUGVyZm9ybWFuY2VTY29yZShyZXN1bHRzKTtcbiAgICBpZiAocGVyZm9ybWFuY2VTY29yZSA8IDgwKSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44Oa44O844K46Kqt44G/6L6844G/5pmC6ZaT44Go44Kk44Oz44K/44Op44Kv44K344On44Oz5b+c562U5pmC6ZaT44Gu5pS55ZaE44GM5b+F6KaB44Gn44GZ44CCJyk7XG4gICAgfVxuXG4gICAgLy8g5LiA6Iis55qE44Gq5o6o5aWo5LqL6aCFXG4gICAgaWYgKHJlY29tbWVuZGF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfjgZnjgbnjgabjga5VSeODhuOCueODiOOBjOiJr+WlveOBque1kOaenOOCkuekuuOBl+OBpuOBhOOBvuOBmeOAguePvuWcqOOBruWTgeizquOCkue2reaMgeOBl+OBpuOBj+OBoOOBleOBhOOAgicpO1xuICAgIH1cblxuICAgIHJldHVybiByZWNvbW1lbmRhdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICog44Os44Od44O844OI55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlUmVwb3J0cyhyZXN1bHQ6IFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmNvbmZpZy5yZXBvcnRpbmdDb25maWcuZGV0YWlsZWRMb2dzKSByZXR1cm47XG5cbiAgICBjb25zb2xlLmxvZygnXFxu8J+TiiBVSee1seWQiOODhuOCueODiOacgOe1gue1kOaenDonKTtcbiAgICBjb25zb2xlLmxvZygnPScgLnJlcGVhdCg2MCkpO1xuICAgIGNvbnNvbGUubG9nKGDinIUg57eP5ZCIVUnjgrnjgrPjgqI6ICR7cmVzdWx0Lm92ZXJhbGxVSVNjb3JlLnRvRml4ZWQoMSl9LzEwMGApO1xuICAgIGNvbnNvbGUubG9nKGDwn5GkIOODpuODvOOCtuODvOOCqOOCr+OCueODmuODquOCqOODs+OCuTogJHtyZXN1bHQudXNlckV4cGVyaWVuY2VTY29yZS50b0ZpeGVkKDEpfS8xMDBgKTtcbiAgICBjb25zb2xlLmxvZyhg4pqhIOODkeODleOCqeODvOODnuODs+OCuTogJHtyZXN1bHQucGVyZm9ybWFuY2VTY29yZS50b0ZpeGVkKDEpfS8xMDBgKTtcbiAgICBjb25zb2xlLmxvZyhg4pm/IOOCouOCr+OCu+OCt+ODk+ODquODhuOCozogJHtyZXN1bHQuYWNjZXNzaWJpbGl0eVNjb3JlLnRvRml4ZWQoMSl9LzEwMGApO1xuICAgIGNvbnNvbGUubG9nKGDwn5SnIOapn+iDveaApzogJHtyZXN1bHQuZnVuY3Rpb25hbGl0eVNjb3JlLnRvRml4ZWQoMSl9LzEwMGApO1xuXG4gICAgY29uc29sZS5sb2coJ1xcbvCfk4gg44OG44K544OI44K144Oe44Oq44O8OicpO1xuICAgIGNvbnNvbGUubG9nKGAgIOe3j+ODhuOCueODiOaVsDogJHtyZXN1bHQudGVzdFN1bW1hcnkudG90YWxUZXN0c31gKTtcbiAgICBjb25zb2xlLmxvZyhgICDlkIjmoLw6ICR7cmVzdWx0LnRlc3RTdW1tYXJ5LnBhc3NlZFRlc3RzfWApO1xuICAgIGNvbnNvbGUubG9nKGAgIOS4jeWQiOagvDogJHtyZXN1bHQudGVzdFN1bW1hcnkuZmFpbGVkVGVzdHN9YCk7XG4gICAgY29uc29sZS5sb2coYCAg44OG44K544OI44Kr44OQ44Os44OD44K4OiAke3Jlc3VsdC50ZXN0U3VtbWFyeS50ZXN0Q292ZXJhZ2UudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAg5a6f6KGM5pmC6ZaTOiAkeyhyZXN1bHQudGVzdFN1bW1hcnkuZXhlY3V0aW9uVGltZSAvIDEwMDApLnRvRml4ZWQoMSl956eSYCk7XG5cbiAgICBpZiAocmVzdWx0LnRlc3RTdW1tYXJ5LmNyaXRpY2FsSXNzdWVzID4gMCB8fCByZXN1bHQudGVzdFN1bW1hcnkubWFqb3JJc3N1ZXMgPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu4pqg77iPICDmpJzlh7rjgZXjgozjgZ/llY/poYw6Jyk7XG4gICAgICBpZiAocmVzdWx0LnRlc3RTdW1tYXJ5LmNyaXRpY2FsSXNzdWVzID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICDwn5S0IOmHjeimgTogJHtyZXN1bHQudGVzdFN1bW1hcnkuY3JpdGljYWxJc3N1ZXN95Lu2YCk7XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0LnRlc3RTdW1tYXJ5Lm1ham9ySXNzdWVzID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICDwn5+hIOS4u+imgTogJHtyZXN1bHQudGVzdFN1bW1hcnkubWFqb3JJc3N1ZXN95Lu2YCk7XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0LnRlc3RTdW1tYXJ5Lm1pbm9ySXNzdWVzID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICDwn5+iIOi7veW+rjogJHtyZXN1bHQudGVzdFN1bW1hcnkubWlub3JJc3N1ZXN95Lu2YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ1xcbvCfkqEg5o6o5aWo5LqL6aCFOicpO1xuICAgIHJlc3VsdC5yZWNvbW1lbmRhdGlvbnMuZm9yRWFjaCgocmVjLCBpbmRleCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCAgJHtpbmRleCArIDF9LiAke3JlY31gKTtcbiAgICB9KTtcblxuICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgY29uc29sZS5sb2coJ1xcbvCfjokgVUnntbHlkIjjg4bjgrnjg4g6IOWQiOagvCcpO1xuICAgICAgY29uc29sZS5sb2coJyAgIOOBmeOBueOBpuOBrlVJ44Kz44Oz44Od44O844ON44Oz44OI44GM5ZOB6LOq5Z+65rqW44KS5rqA44Gf44GX44Gm44GE44G+44GZJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7inYwgVUnntbHlkIjjg4bjgrnjg4g6IOS4jeWQiOagvCcpO1xuICAgICAgY29uc29sZS5sb2coJyAgIFVJ44Gu5ZOB6LOq5pS55ZaE44GM5b+F6KaB44Gn44GZJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJz0nIC5yZXBlYXQoNjApKTtcbiAgfVxufVxuXG4vKipcbiAqIOODh+ODleOCqeODq+ODiOioreWumuOBp+OBrlVJ57Wx5ZCI44OG44K544OI5a6f6KGMXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5VSUludGVncmF0aW9uVGVzdChcbiAgYmFzZVVybDogc3RyaW5nID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXG4gIHRlc3RFbnZpcm9ubWVudDogJ2RldmVsb3BtZW50JyB8ICdzdGFnaW5nJyB8ICdwcm9kdWN0aW9uJyA9ICdkZXZlbG9wbWVudCdcbik6IFByb21pc2U8VUlJbnRlZ3JhdGlvblRlc3RSZXN1bHQ+IHtcbiAgY29uc3QgY29uZmlnOiBVSUludGVncmF0aW9uVGVzdENvbmZpZyA9IHtcbiAgICBiYXNlVXJsLFxuICAgIGVuYWJsZWRUZXN0czoge1xuICAgICAgcmVzcG9uc2l2ZURlc2lnbjogdHJ1ZSxcbiAgICAgIHJlYWx0aW1lQ2hhdDogdHJ1ZSxcbiAgICAgIGRvY3VtZW50U291cmNlRGlzcGxheTogdHJ1ZSxcbiAgICAgIGFjY2Vzc2liaWxpdHk6IHRydWVcbiAgICB9LFxuICAgIHRlc3RFbnZpcm9ubWVudCxcbiAgICBicm93c2VyQ29uZmlnOiB7XG4gICAgICBoZWFkbGVzczogZmFsc2UsXG4gICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTkyMCwgaGVpZ2h0OiAxMDgwIH0sXG4gICAgICB0aW1lb3V0OiAzMDAwMFxuICAgIH0sXG4gICAgcmVwb3J0aW5nQ29uZmlnOiB7XG4gICAgICBnZW5lcmF0ZVNjcmVlbnNob3RzOiB0cnVlLFxuICAgICAgZ2VuZXJhdGVWaWRlb1JlY29yZGluZzogZmFsc2UsXG4gICAgICBkZXRhaWxlZExvZ3M6IHRydWVcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgcnVubmVyID0gbmV3IFVJSW50ZWdyYXRpb25UZXN0UnVubmVyKGNvbmZpZyk7XG4gIHJldHVybiBhd2FpdCBydW5uZXIucnVuVGVzdHMoKTtcbn0iXX0=