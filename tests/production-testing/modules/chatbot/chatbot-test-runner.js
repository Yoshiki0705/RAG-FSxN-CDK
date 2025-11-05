"use strict";
/**
 * チャットボット機能テスト実行ランナー
 *
 * 実本番Amazon Bedrockでのチャットボット機能テストを安全に実行
 * テスト結果の収集と報告を行う
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotTestRunner = void 0;
const chatbot_test_module_1 = __importDefault(require("./chatbot-test-module"));
/**
 * チャットボット機能テスト実行ランナークラス
 */
class ChatbotTestRunner {
    config;
    testModule;
    testEngine;
    constructor(config, testEngine) {
        this.config = config;
        this.testEngine = testEngine;
        this.testModule = new chatbot_test_module_1.default(config);
    }
    /**
     * チャットボット機能テストスイートの作成
     */
    createChatbotTestSuite() {
        const testDefinitions = [
            {
                testId: 'chatbot-japanese-001',
                testName: '日本語応答品質テスト',
                category: 'chatbot',
                description: '実本番Bedrockでの日本語応答の品質と自然さを評価',
                timeout: 30000, // 30秒
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testJapaneseResponseQuality();
                }
            },
            {
                testId: 'chatbot-document-001',
                testName: '文書関連応答テスト',
                category: 'chatbot',
                description: '実本番FSx/OpenSearchとの連携による文書ベース応答テスト',
                timeout: 45000, // 45秒
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testDocumentBasedResponse();
                }
            },
            {
                testId: 'chatbot-streaming-001',
                testName: 'ストリーミング応答テスト',
                category: 'chatbot',
                description: '実本番Bedrockでのストリーミング応答機能テスト',
                timeout: 60000, // 60秒
                retryCount: 1,
                dependencies: ['chatbot-japanese-001'],
                execute: async (engine) => {
                    return await this.testModule.testStreamingResponse();
                }
            },
            {
                testId: 'chatbot-error-001',
                testName: 'エラーハンドリングテスト',
                category: 'chatbot',
                description: '不適切な質問や曖昧な質問への適切な対応テスト',
                timeout: 45000,
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testErrorHandling();
                }
            },
            {
                testId: 'chatbot-complex-001',
                testName: '複雑な質問への応答テスト',
                category: 'chatbot',
                description: '高度で複雑な質問に対する詳細で正確な応答テスト',
                timeout: 90000, // 90秒
                retryCount: 1,
                dependencies: ['chatbot-document-001'],
                execute: async (engine) => {
                    return await this.testModule.testComplexQuestionHandling();
                }
            }
        ];
        return {
            suiteId: 'chatbot-test-suite',
            suiteName: 'チャットボット機能テストスイート',
            description: '実本番Amazon Bedrockでのチャットボット機能包括テスト',
            tests: testDefinitions,
            configuration: {
                parallel: false, // チャットボットテストは順次実行
                maxConcurrency: 1,
                failFast: false, // 一つのテストが失敗しても他のテストを継続
                continueOnError: true
            }
        };
    }
    /**
     * チャットボット機能テストの実行
     */
    async runChatbotTests() {
        console.log('🚀 チャットボット機能テストスイートを実行開始...');
        try {
            // テストスイートの作成
            const testSuite = this.createChatbotTestSuite();
            // テストエンジンでの実行
            const results = await this.testEngine.executeTestSuite(testSuite);
            // 結果の集計
            const summary = this.generateTestSummary(results);
            console.log('📊 チャットボット機能テスト実行結果:');
            console.log(`   総テスト数: ${summary.totalTests}`);
            console.log(`   成功: ${summary.passedTests}`);
            console.log(`   失敗: ${summary.failedTests}`);
            console.log(`   スキップ: ${summary.skippedTests}`);
            console.log(`   成功率: ${(summary.successRate * 100).toFixed(1)}%`);
            console.log(`   平均応答時間: ${summary.averageResponseTime.toFixed(0)}ms`);
            console.log(`   日本語品質スコア: ${(summary.japaneseQualityScore * 100).toFixed(1)}%`);
            console.log(`   RAG有効性: ${(summary.ragEffectiveness * 100).toFixed(1)}%`);
            console.log(`   総実行時間: ${summary.totalDuration}ms`);
            const success = summary.failedTests === 0;
            if (success) {
                console.log('✅ チャットボット機能テストスイート実行完了 - 全テスト成功');
            }
            else {
                console.log('⚠️ チャットボット機能テストスイート実行完了 - 一部テスト失敗');
            }
            return {
                success,
                results: results,
                summary
            };
        }
        catch (error) {
            console.error('❌ チャットボット機能テスト実行エラー:', error);
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
        // 平均応答時間の計算
        const responseTimeResults = resultsArray.filter(r => r.responseDetails?.responseTime);
        const averageResponseTime = responseTimeResults.length > 0
            ? responseTimeResults.reduce((sum, r) => sum + r.responseDetails.responseTime, 0) / responseTimeResults.length
            : 0;
        // 日本語品質スコアの計算
        const japaneseQualityResults = resultsArray.filter(r => r.responseDetails?.japaneseQuality);
        const japaneseQualityScore = japaneseQualityResults.length > 0
            ? japaneseQualityResults.reduce((sum, r) => sum + r.responseDetails.japaneseQuality, 0) / japaneseQualityResults.length
            : 0;
        // RAG有効性の計算
        const ragResults = resultsArray.filter(r => r.ragDetails);
        const ragEffectiveness = ragResults.length > 0
            ? ragResults.reduce((sum, r) => sum + (r.ragDetails.sourceAccuracy || 0), 0) / ragResults.length
            : 0;
        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            successRate,
            totalDuration,
            averageResponseTime,
            japaneseQualityScore,
            ragEffectiveness
        };
    }
    /**
     * 詳細レポートの生成
     */
    async generateDetailedReport(results) {
        const timestamp = new Date().toISOString();
        const summary = this.generateTestSummary(results);
        let report = `# チャットボット機能テスト詳細レポート\n\n`;
        report += `**実行日時**: ${timestamp}\n`;
        report += `**テスト環境**: AWS東京リージョン本番環境 (${this.config.region})\n`;
        report += `**Bedrockモデル**: Claude 3 Haiku, Claude 3 Sonnet\n`;
        report += `**OpenSearchドメイン**: ${this.config.resources.openSearchDomain}\n`;
        report += `**FSxファイルシステム**: ${this.config.resources.fsxFileSystemId}\n\n`;
        report += `## 実行サマリー\n\n`;
        report += `- **総テスト数**: ${summary.totalTests}\n`;
        report += `- **成功**: ${summary.passedTests}\n`;
        report += `- **失敗**: ${summary.failedTests}\n`;
        report += `- **スキップ**: ${summary.skippedTests}\n`;
        report += `- **成功率**: ${(summary.successRate * 100).toFixed(1)}%\n`;
        report += `- **平均応答時間**: ${summary.averageResponseTime.toFixed(0)}ms\n`;
        report += `- **日本語品質スコア**: ${(summary.japaneseQualityScore * 100).toFixed(1)}%\n`;
        report += `- **RAG有効性**: ${(summary.ragEffectiveness * 100).toFixed(1)}%\n`;
        report += `- **総実行時間**: ${summary.totalDuration}ms\n\n`;
        // AI品質評価
        report += `## AI応答品質評価\n\n`;
        if (summary.japaneseQualityScore >= 0.8) {
            report += `🟢 **優秀**: 日本語応答品質が高水準です\n`;
        }
        else if (summary.japaneseQualityScore >= 0.6) {
            report += `🟡 **良好**: 日本語応答品質に軽微な改善点があります\n`;
        }
        else {
            report += `🔴 **要改善**: 日本語応答品質の向上が必要です\n`;
        }
        if (summary.ragEffectiveness >= 0.7) {
            report += `🟢 **RAG機能**: 文書検索と応答生成が適切に連携しています\n`;
        }
        else if (summary.ragEffectiveness >= 0.5) {
            report += `🟡 **RAG機能**: 文書検索の精度向上が推奨されます\n`;
        }
        else {
            report += `🔴 **RAG機能**: 文書検索と応答生成の連携に問題があります\n`;
        }
        report += `\n`;
        report += `## テスト結果詳細\n\n`;
        for (const [testId, result] of results) {
            const status = result.success ? '✅ 成功' : '❌ 失敗';
            const duration = result.duration || 0;
            report += `### ${result.testName} (${testId})\n\n`;
            report += `- **ステータス**: ${status}\n`;
            report += `- **実行時間**: ${duration}ms\n`;
            report += `- **開始時刻**: ${result.startTime?.toISOString()}\n`;
            report += `- **終了時刻**: ${result.endTime?.toISOString()}\n`;
            if (result.error) {
                report += `- **エラー**: ${result.error}\n`;
            }
            if (result.responseDetails) {
                report += `- **応答詳細**:\n`;
                report += `  - 応答時間: ${result.responseDetails.responseTime}ms\n`;
                report += `  - トークン数: ${result.responseDetails.tokenCount}\n`;
                report += `  - 使用モデル: ${result.responseDetails.modelUsed}\n`;
                report += `  - ストリーミング: ${result.responseDetails.isStreaming ? 'あり' : 'なし'}\n`;
                report += `  - 日本語品質: ${(result.responseDetails.japaneseQuality * 100).toFixed(1)}%\n`;
                // 応答テキストの一部を表示（長すぎる場合は切り詰め）
                const responsePreview = result.responseDetails.responseText.length > 200
                    ? result.responseDetails.responseText.substring(0, 200) + '...'
                    : result.responseDetails.responseText;
                report += `  - 応答内容: "${responsePreview}"\n`;
            }
            if (result.ragDetails) {
                report += `- **RAG詳細**:\n`;
                report += `  - 検索文書数: ${result.ragDetails.documentsFound}件\n`;
                report += `  - 関連文書数: ${result.ragDetails.relevantDocuments}件\n`;
                report += `  - 引用含有: ${result.ragDetails.citationsIncluded ? 'あり' : 'なし'}\n`;
                report += `  - 情報源精度: ${(result.ragDetails.sourceAccuracy * 100).toFixed(1)}%\n`;
            }
            if (result.performanceMetrics) {
                report += `- **パフォーマンス**:\n`;
                report += `  - レイテンシ: ${result.performanceMetrics.latency}ms\n`;
                report += `  - スループット: ${result.performanceMetrics.throughput.toFixed(2)} tokens/sec\n`;
                report += `  - エラー率: ${(result.performanceMetrics.errorRate * 100).toFixed(1)}%\n`;
                report += `  - リソース使用率: ${(result.performanceMetrics.resourceUsage * 100).toFixed(1)}%\n`;
            }
            report += `\n`;
        }
        // 推奨事項
        report += `## 推奨事項\n\n`;
        report += this.generateRecommendations(results, summary);
        return report;
    }
    /**
     * 推奨事項の生成
     */
    generateRecommendations(results, summary) {
        let recommendations = '';
        const failedTests = Array.from(results.values()).filter(r => !r.success);
        if (failedTests.length === 0) {
            recommendations += `✅ 全てのチャットボット機能テストが成功しました。現在の設定を維持してください。\n\n`;
        }
        else {
            recommendations += `以下の改善を推奨します:\n\n`;
            failedTests.forEach(test => {
                switch (test.testId) {
                    case 'chatbot-japanese-001':
                        recommendations += `- **日本語応答品質**: プロンプトエンジニアリングを改善し、より自然な日本語応答を生成してください\n`;
                        break;
                    case 'chatbot-document-001':
                        recommendations += `- **文書関連応答**: OpenSearchの検索精度を向上させ、より関連性の高い文書を取得してください\n`;
                        break;
                    case 'chatbot-streaming-001':
                        recommendations += `- **ストリーミング応答**: ストリーミング処理の安定性を向上させ、エラー処理を強化してください\n`;
                        break;
                    case 'chatbot-error-001':
                        recommendations += `- **エラーハンドリング**: 不適切な質問への対応ロジックを改善してください\n`;
                        break;
                    case 'chatbot-complex-001':
                        recommendations += `- **複雑な質問対応**: より高性能なモデルの使用や、プロンプトの詳細化を検討してください\n`;
                        break;
                }
            });
        }
        // パフォーマンス関連の推奨事項
        if (summary.averageResponseTime > 8000) {
            recommendations += `- **応答時間**: 平均応答時間が${summary.averageResponseTime.toFixed(0)}msと長いため、モデル選択やプロンプト最適化を検討してください\n`;
        }
        if (summary.japaneseQualityScore < 0.7) {
            recommendations += `- **日本語品質**: 日本語品質スコアが${(summary.japaneseQualityScore * 100).toFixed(1)}%のため、日本語特化のプロンプト調整が必要です\n`;
        }
        if (summary.ragEffectiveness < 0.6) {
            recommendations += `- **RAG機能**: RAG有効性が${(summary.ragEffectiveness * 100).toFixed(1)}%のため、文書インデックスの改善や検索アルゴリズムの調整が必要です\n`;
        }
        recommendations += `\n### AI応答品質向上のベストプラクティス\n\n`;
        recommendations += `- 日本語特化プロンプトの使用\n`;
        recommendations += `- 文書コンテキストの適切な構造化\n`;
        recommendations += `- ストリーミング応答の安定性確保\n`;
        recommendations += `- エラーケースの包括的な対応\n`;
        recommendations += `- 継続的な応答品質監視\n`;
        return recommendations;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 チャットボット機能テストランナーをクリーンアップ中...');
        await this.testModule.cleanup();
        console.log('✅ チャットボット機能テストランナーのクリーンアップ完了');
    }
}
exports.ChatbotTestRunner = ChatbotTestRunner;
exports.default = ChatbotTestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdGJvdC10ZXN0LXJ1bm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoYXRib3QtdGVzdC1ydW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7QUFFSCxnRkFBNkU7QUFJN0U7O0dBRUc7QUFDSCxNQUFhLGlCQUFpQjtJQUNwQixNQUFNLENBQW1CO0lBQ3pCLFVBQVUsQ0FBb0I7SUFDOUIsVUFBVSxDQUF1QjtJQUV6QyxZQUFZLE1BQXdCLEVBQUUsVUFBZ0M7UUFDcEUsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLDZCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRDs7T0FFRztJQUNILHNCQUFzQjtRQUNwQixNQUFNLGVBQWUsR0FBcUI7WUFDeEM7Z0JBQ0UsTUFBTSxFQUFFLHNCQUFzQjtnQkFDOUIsUUFBUSxFQUFFLFlBQVk7Z0JBQ3RCLFFBQVEsRUFBRSxTQUFTO2dCQUNuQixXQUFXLEVBQUUsNkJBQTZCO2dCQUMxQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU07Z0JBQ3RCLFVBQVUsRUFBRSxDQUFDO2dCQUNiLFlBQVksRUFBRSxFQUFFO2dCQUNoQixPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUN4QixPQUFPLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQywyQkFBMkIsRUFBRSxDQUFDO2dCQUM3RCxDQUFDO2FBQ0Y7WUFDRDtnQkFDRSxNQUFNLEVBQUUsc0JBQXNCO2dCQUM5QixRQUFRLEVBQUUsV0FBVztnQkFDckIsUUFBUSxFQUFFLFNBQVM7Z0JBQ25CLFdBQVcsRUFBRSxvQ0FBb0M7Z0JBQ2pELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTTtnQkFDdEIsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsWUFBWSxFQUFFLEVBQUU7Z0JBQ2hCLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3hCLE9BQU8sTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLHlCQUF5QixFQUFFLENBQUM7Z0JBQzNELENBQUM7YUFDRjtZQUNEO2dCQUNFLE1BQU0sRUFBRSx1QkFBdUI7Z0JBQy9CLFFBQVEsRUFBRSxjQUFjO2dCQUN4QixRQUFRLEVBQUUsU0FBUztnQkFDbkIsV0FBVyxFQUFFLDRCQUE0QjtnQkFDekMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNO2dCQUN0QixVQUFVLEVBQUUsQ0FBQztnQkFDYixZQUFZLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQztnQkFDdEMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDeEIsT0FBTyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDdkQsQ0FBQzthQUNGO1lBQ0Q7Z0JBQ0UsTUFBTSxFQUFFLG1CQUFtQjtnQkFDM0IsUUFBUSxFQUFFLGNBQWM7Z0JBQ3hCLFFBQVEsRUFBRSxTQUFTO2dCQUNuQixXQUFXLEVBQUUsd0JBQXdCO2dCQUNyQyxPQUFPLEVBQUUsS0FBSztnQkFDZCxVQUFVLEVBQUUsQ0FBQztnQkFDYixZQUFZLEVBQUUsRUFBRTtnQkFDaEIsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDeEIsT0FBTyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQzthQUNGO1lBQ0Q7Z0JBQ0UsTUFBTSxFQUFFLHFCQUFxQjtnQkFDN0IsUUFBUSxFQUFFLGNBQWM7Z0JBQ3hCLFFBQVEsRUFBRSxTQUFTO2dCQUNuQixXQUFXLEVBQUUseUJBQXlCO2dCQUN0QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU07Z0JBQ3RCLFVBQVUsRUFBRSxDQUFDO2dCQUNiLFlBQVksRUFBRSxDQUFDLHNCQUFzQixDQUFDO2dCQUN0QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUN4QixPQUFPLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQywyQkFBMkIsRUFBRSxDQUFDO2dCQUM3RCxDQUFDO2FBQ0Y7U0FDRixDQUFDO1FBRUYsT0FBTztZQUNMLE9BQU8sRUFBRSxvQkFBb0I7WUFDN0IsU0FBUyxFQUFFLGtCQUFrQjtZQUM3QixXQUFXLEVBQUUsbUNBQW1DO1lBQ2hELEtBQUssRUFBRSxlQUFlO1lBQ3RCLGFBQWEsRUFBRTtnQkFDYixRQUFRLEVBQUUsS0FBSyxFQUFFLGtCQUFrQjtnQkFDbkMsY0FBYyxFQUFFLENBQUM7Z0JBQ2pCLFFBQVEsRUFBRSxLQUFLLEVBQUUsdUJBQXVCO2dCQUN4QyxlQUFlLEVBQUUsSUFBSTthQUN0QjtTQUNGLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsZUFBZTtRQWVuQixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFFM0MsSUFBSSxDQUFDO1lBQ0gsYUFBYTtZQUNiLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBRWhELGNBQWM7WUFDZCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFbEUsUUFBUTtZQUNSLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVsRCxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoRixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxRSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsT0FBTyxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUM7WUFFcEQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsS0FBSyxDQUFDLENBQUM7WUFFMUMsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDWixPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFDakQsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBRUQsT0FBTztnQkFDTCxPQUFPO2dCQUNQLE9BQU8sRUFBRSxPQUF5QztnQkFDbEQsT0FBTzthQUNSLENBQUM7UUFFSixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0MsTUFBTSxLQUFLLENBQUM7UUFDZCxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0ssbUJBQW1CLENBQUMsT0FBeUI7UUFXbkQsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUVsRCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO1FBQ3ZDLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQy9ELE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDMUYsTUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzdFLE1BQU0sV0FBVyxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRSxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVsRixZQUFZO1FBQ1osTUFBTSxtQkFBbUIsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN0RixNQUFNLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQ3hELENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEdBQUcsbUJBQW1CLENBQUMsTUFBTTtZQUM5RyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRU4sY0FBYztRQUNkLE1BQU0sc0JBQXNCLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDNUYsTUFBTSxvQkFBb0IsR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUM1RCxDQUFDLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxHQUFHLHNCQUFzQixDQUFDLE1BQU07WUFDdkgsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVOLFlBQVk7UUFDWixNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFELE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQzVDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxjQUFjLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU07WUFDaEcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVOLE9BQU87WUFDTCxVQUFVO1lBQ1YsV0FBVztZQUNYLFdBQVc7WUFDWCxZQUFZO1lBQ1osV0FBVztZQUNYLGFBQWE7WUFDYixtQkFBbUI7WUFDbkIsb0JBQW9CO1lBQ3BCLGdCQUFnQjtTQUNqQixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLHNCQUFzQixDQUFDLE9BQXVDO1FBQ2xFLE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDM0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWxELElBQUksTUFBTSxHQUFHLDBCQUEwQixDQUFDO1FBQ3hDLE1BQU0sSUFBSSxhQUFhLFNBQVMsSUFBSSxDQUFDO1FBQ3JDLE1BQU0sSUFBSSw4QkFBOEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQztRQUNoRSxNQUFNLElBQUksbURBQW1ELENBQUM7UUFDOUQsTUFBTSxJQUFJLHVCQUF1QixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDO1FBQzVFLE1BQU0sSUFBSSxvQkFBb0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsZUFBZSxNQUFNLENBQUM7UUFFMUUsTUFBTSxJQUFJLGVBQWUsQ0FBQztRQUMxQixNQUFNLElBQUksZ0JBQWdCLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQztRQUNqRCxNQUFNLElBQUksYUFBYSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUM7UUFDL0MsTUFBTSxJQUFJLGFBQWEsT0FBTyxDQUFDLFdBQVcsSUFBSSxDQUFDO1FBQy9DLE1BQU0sSUFBSSxlQUFlLE9BQU8sQ0FBQyxZQUFZLElBQUksQ0FBQztRQUNsRCxNQUFNLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDcEUsTUFBTSxJQUFJLGlCQUFpQixPQUFPLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDeEUsTUFBTSxJQUFJLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUNsRixNQUFNLElBQUksaUJBQWlCLENBQUMsT0FBTyxDQUFDLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQzVFLE1BQU0sSUFBSSxnQkFBZ0IsT0FBTyxDQUFDLGFBQWEsUUFBUSxDQUFDO1FBRXhELFNBQVM7UUFDVCxNQUFNLElBQUksaUJBQWlCLENBQUM7UUFDNUIsSUFBSSxPQUFPLENBQUMsb0JBQW9CLElBQUksR0FBRyxFQUFFLENBQUM7WUFDeEMsTUFBTSxJQUFJLDRCQUE0QixDQUFDO1FBQ3pDLENBQUM7YUFBTSxJQUFJLE9BQU8sQ0FBQyxvQkFBb0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMvQyxNQUFNLElBQUksa0NBQWtDLENBQUM7UUFDL0MsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLElBQUksK0JBQStCLENBQUM7UUFDNUMsQ0FBQztRQUVELElBQUksT0FBTyxDQUFDLGdCQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sSUFBSSxzQ0FBc0MsQ0FBQztRQUNuRCxDQUFDO2FBQU0sSUFBSSxPQUFPLENBQUMsZ0JBQWdCLElBQUksR0FBRyxFQUFFLENBQUM7WUFDM0MsTUFBTSxJQUFJLGtDQUFrQyxDQUFDO1FBQy9DLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxJQUFJLHNDQUFzQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxNQUFNLElBQUksSUFBSSxDQUFDO1FBRWYsTUFBTSxJQUFJLGdCQUFnQixDQUFDO1FBRTNCLEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUN2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUNoRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQztZQUV0QyxNQUFNLElBQUksT0FBTyxNQUFNLENBQUMsUUFBUSxLQUFLLE1BQU0sT0FBTyxDQUFDO1lBQ25ELE1BQU0sSUFBSSxnQkFBZ0IsTUFBTSxJQUFJLENBQUM7WUFDckMsTUFBTSxJQUFJLGVBQWUsUUFBUSxNQUFNLENBQUM7WUFDeEMsTUFBTSxJQUFJLGVBQWUsTUFBTSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDO1lBQzdELE1BQU0sSUFBSSxlQUFlLE1BQU0sQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQztZQUUzRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxJQUFJLGNBQWMsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDO1lBQzNDLENBQUM7WUFFRCxJQUFJLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxJQUFJLGVBQWUsQ0FBQztnQkFDMUIsTUFBTSxJQUFJLGFBQWEsTUFBTSxDQUFDLGVBQWUsQ0FBQyxZQUFZLE1BQU0sQ0FBQztnQkFDakUsTUFBTSxJQUFJLGNBQWMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLElBQUksQ0FBQztnQkFDOUQsTUFBTSxJQUFJLGNBQWMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLElBQUksQ0FBQztnQkFDN0QsTUFBTSxJQUFJLGdCQUFnQixNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztnQkFDL0UsTUFBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFFdkYsNEJBQTRCO2dCQUM1QixNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsR0FBRztvQkFDdEUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsS0FBSztvQkFDL0QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDO2dCQUN4QyxNQUFNLElBQUksY0FBYyxlQUFlLEtBQUssQ0FBQztZQUMvQyxDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQztnQkFDM0IsTUFBTSxJQUFJLGNBQWMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEtBQUssQ0FBQztnQkFDOUQsTUFBTSxJQUFJLGNBQWMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsS0FBSyxDQUFDO2dCQUNqRSxNQUFNLElBQUksYUFBYSxNQUFNLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO2dCQUM3RSxNQUFNLElBQUksY0FBYyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ25GLENBQUM7WUFFRCxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM5QixNQUFNLElBQUksa0JBQWtCLENBQUM7Z0JBQzdCLE1BQU0sSUFBSSxjQUFjLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLE1BQU0sQ0FBQztnQkFDaEUsTUFBTSxJQUFJLGVBQWUsTUFBTSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztnQkFDeEYsTUFBTSxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUNuRixNQUFNLElBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUM1RixDQUFDO1lBRUQsTUFBTSxJQUFJLElBQUksQ0FBQztRQUNqQixDQUFDO1FBRUQsT0FBTztRQUNQLE1BQU0sSUFBSSxhQUFhLENBQUM7UUFDeEIsTUFBTSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFekQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssdUJBQXVCLENBQzdCLE9BQXVDLEVBQ3ZDLE9BQVk7UUFFWixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDekIsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV6RSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDN0IsZUFBZSxJQUFJLDhDQUE4QyxDQUFDO1FBQ3BFLENBQUM7YUFBTSxDQUFDO1lBQ04sZUFBZSxJQUFJLGtCQUFrQixDQUFDO1lBRXRDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3pCLFFBQVEsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNwQixLQUFLLHNCQUFzQjt3QkFDekIsZUFBZSxJQUFJLHdEQUF3RCxDQUFDO3dCQUM1RSxNQUFNO29CQUNSLEtBQUssc0JBQXNCO3dCQUN6QixlQUFlLElBQUksMERBQTBELENBQUM7d0JBQzlFLE1BQU07b0JBQ1IsS0FBSyx1QkFBdUI7d0JBQzFCLGVBQWUsSUFBSSxzREFBc0QsQ0FBQzt3QkFDMUUsTUFBTTtvQkFDUixLQUFLLG1CQUFtQjt3QkFDdEIsZUFBZSxJQUFJLDRDQUE0QyxDQUFDO3dCQUNoRSxNQUFNO29CQUNSLEtBQUsscUJBQXFCO3dCQUN4QixlQUFlLElBQUksbURBQW1ELENBQUM7d0JBQ3ZFLE1BQU07Z0JBQ1YsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELGlCQUFpQjtRQUNqQixJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEVBQUUsQ0FBQztZQUN2QyxlQUFlLElBQUksc0JBQXNCLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLG1DQUFtQyxDQUFDO1FBQ3JILENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxvQkFBb0IsR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUN2QyxlQUFlLElBQUkseUJBQXlCLENBQUMsT0FBTyxDQUFDLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsMkJBQTJCLENBQUM7UUFDekgsQ0FBQztRQUVELElBQUksT0FBTyxDQUFDLGdCQUFnQixHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ25DLGVBQWUsSUFBSSx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxxQ0FBcUMsQ0FBQztRQUM3SCxDQUFDO1FBRUQsZUFBZSxJQUFJLDhCQUE4QixDQUFDO1FBQ2xELGVBQWUsSUFBSSxtQkFBbUIsQ0FBQztRQUN2QyxlQUFlLElBQUkscUJBQXFCLENBQUM7UUFDekMsZUFBZSxJQUFJLHFCQUFxQixDQUFDO1FBQ3pDLGVBQWUsSUFBSSxtQkFBbUIsQ0FBQztRQUN2QyxlQUFlLElBQUksZ0JBQWdCLENBQUM7UUFFcEMsT0FBTyxlQUFlLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDL0MsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUF2WEQsOENBdVhDO0FBRUQsa0JBQWUsaUJBQWlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOWun+ihjOODqeODs+ODiuODvFxuICogXG4gKiDlrp/mnKznlapBbWF6b24gQmVkcm9ja+OBp+OBruODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOOCkuWuieWFqOOBq+Wun+ihjFxuICog44OG44K544OI57WQ5p6c44Gu5Y+O6ZuG44Go5aCx5ZGK44KS6KGM44GGXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgQ2hhdGJvdFRlc3RNb2R1bGUsIHsgQ2hhdGJvdFRlc3RSZXN1bHQgfSBmcm9tICcuL2NoYXRib3QtdGVzdC1tb2R1bGUnO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lLCB7IFRlc3REZWZpbml0aW9uLCBUZXN0U3VpdGUgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5cbi8qKlxuICog44OB44Oj44OD44OI44Oc44OD44OI5qmf6IO944OG44K544OI5a6f6KGM44Op44Oz44OK44O844Kv44Op44K5XG4gKi9cbmV4cG9ydCBjbGFzcyBDaGF0Ym90VGVzdFJ1bm5lciB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIHRlc3RNb2R1bGU6IENoYXRib3RUZXN0TW9kdWxlO1xuICBwcml2YXRlIHRlc3RFbmdpbmU6IFByb2R1Y3Rpb25UZXN0RW5naW5lO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZywgdGVzdEVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmUpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnRlc3RFbmdpbmUgPSB0ZXN0RW5naW5lO1xuICAgIHRoaXMudGVzdE1vZHVsZSA9IG5ldyBDaGF0Ym90VGVzdE1vZHVsZShjb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOOCueOCpOODvOODiOOBruS9nOaIkFxuICAgKi9cbiAgY3JlYXRlQ2hhdGJvdFRlc3RTdWl0ZSgpOiBUZXN0U3VpdGUge1xuICAgIGNvbnN0IHRlc3REZWZpbml0aW9uczogVGVzdERlZmluaXRpb25bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAnY2hhdGJvdC1qYXBhbmVzZS0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+aXpeacrOiqnuW/nOetlOWTgeizquODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnY2hhdGJvdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn5a6f5pys55WqQmVkcm9ja+OBp+OBruaXpeacrOiqnuW/nOetlOOBruWTgeizquOBqOiHqueEtuOBleOCkuipleS+oScsXG4gICAgICAgIHRpbWVvdXQ6IDMwMDAwLCAvLyAzMOenklxuICAgICAgICByZXRyeUNvdW50OiAyLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgICBleGVjdXRlOiBhc3luYyAoZW5naW5lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudGVzdE1vZHVsZS50ZXN0SmFwYW5lc2VSZXNwb25zZVF1YWxpdHkoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAnY2hhdGJvdC1kb2N1bWVudC0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+aWh+abuOmWoumAo+W/nOetlOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnY2hhdGJvdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn5a6f5pys55WqRlN4L09wZW5TZWFyY2jjgajjga7pgKPmkLrjgavjgojjgovmlofmm7jjg5njg7zjgrnlv5znrZTjg4bjgrnjg4gnLFxuICAgICAgICB0aW1lb3V0OiA0NTAwMCwgLy8gNDXnp5JcbiAgICAgICAgcmV0cnlDb3VudDogMixcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdERvY3VtZW50QmFzZWRSZXNwb25zZSgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0ZXN0SWQ6ICdjaGF0Ym90LXN0cmVhbWluZy0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+OCueODiOODquODvOODn+ODs+OCsOW/nOetlOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnY2hhdGJvdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn5a6f5pys55WqQmVkcm9ja+OBp+OBruOCueODiOODquODvOODn+ODs+OCsOW/nOetlOapn+iDveODhuOCueODiCcsXG4gICAgICAgIHRpbWVvdXQ6IDYwMDAwLCAvLyA2MOenklxuICAgICAgICByZXRyeUNvdW50OiAxLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFsnY2hhdGJvdC1qYXBhbmVzZS0wMDEnXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdFN0cmVhbWluZ1Jlc3BvbnNlKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRlc3RJZDogJ2NoYXRib3QtZXJyb3ItMDAxJyxcbiAgICAgICAgdGVzdE5hbWU6ICfjgqjjg6njg7zjg4/jg7Pjg4njg6rjg7PjgrDjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2NoYXRib3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+S4jemBqeWIh+OBquizquWVj+OChOabluaYp+OBquizquWVj+OBuOOBrumBqeWIh+OBquWvvuW/nOODhuOCueODiCcsXG4gICAgICAgIHRpbWVvdXQ6IDQ1MDAwLFxuICAgICAgICByZXRyeUNvdW50OiAyLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgICBleGVjdXRlOiBhc3luYyAoZW5naW5lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudGVzdE1vZHVsZS50ZXN0RXJyb3JIYW5kbGluZygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0ZXN0SWQ6ICdjaGF0Ym90LWNvbXBsZXgtMDAxJyxcbiAgICAgICAgdGVzdE5hbWU6ICfopIfpm5Hjgaros6rllY/jgbjjga7lv5znrZTjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2NoYXRib3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+mrmOW6puOBp+ikh+mbkeOBquizquWVj+OBq+WvvuOBmeOCi+ips+e0sOOBp+ato+eiuuOBquW/nOetlOODhuOCueODiCcsXG4gICAgICAgIHRpbWVvdXQ6IDkwMDAwLCAvLyA5MOenklxuICAgICAgICByZXRyeUNvdW50OiAxLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFsnY2hhdGJvdC1kb2N1bWVudC0wMDEnXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdENvbXBsZXhRdWVzdGlvbkhhbmRsaW5nKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1aXRlSWQ6ICdjaGF0Ym90LXRlc3Qtc3VpdGUnLFxuICAgICAgc3VpdGVOYW1lOiAn44OB44Oj44OD44OI44Oc44OD44OI5qmf6IO944OG44K544OI44K544Kk44O844OIJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn5a6f5pys55WqQW1hem9uIEJlZHJvY2vjgafjga7jg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73ljIXmi6zjg4bjgrnjg4gnLFxuICAgICAgdGVzdHM6IHRlc3REZWZpbml0aW9ucyxcbiAgICAgIGNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgcGFyYWxsZWw6IGZhbHNlLCAvLyDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jjg4bjgrnjg4jjga/poIbmrKHlrp/ooYxcbiAgICAgICAgbWF4Q29uY3VycmVuY3k6IDEsXG4gICAgICAgIGZhaWxGYXN0OiBmYWxzZSwgLy8g5LiA44Gk44Gu44OG44K544OI44GM5aSx5pWX44GX44Gm44KC5LuW44Gu44OG44K544OI44KS57aZ57aaXG4gICAgICAgIGNvbnRpbnVlT25FcnJvcjogdHJ1ZVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44OB44Oj44OD44OI44Oc44OD44OI5qmf6IO944OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBhc3luYyBydW5DaGF0Ym90VGVzdHMoKTogUHJvbWlzZTx7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgICByZXN1bHRzOiBNYXA8c3RyaW5nLCBDaGF0Ym90VGVzdFJlc3VsdD47XG4gICAgc3VtbWFyeToge1xuICAgICAgdG90YWxUZXN0czogbnVtYmVyO1xuICAgICAgcGFzc2VkVGVzdHM6IG51bWJlcjtcbiAgICAgIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gICAgICBza2lwcGVkVGVzdHM6IG51bWJlcjtcbiAgICAgIHN1Y2Nlc3NSYXRlOiBudW1iZXI7XG4gICAgICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gICAgICBqYXBhbmVzZVF1YWxpdHlTY29yZTogbnVtYmVyO1xuICAgICAgcmFnRWZmZWN0aXZlbmVzczogbnVtYmVyO1xuICAgIH07XG4gIH0+IHtcbiAgICBjb25zb2xlLmxvZygn8J+agCDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73jg4bjgrnjg4jjgrnjgqTjg7zjg4jjgpLlrp/ooYzplovlp4suLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyDjg4bjgrnjg4jjgrnjgqTjg7zjg4jjga7kvZzmiJBcbiAgICAgIGNvbnN0IHRlc3RTdWl0ZSA9IHRoaXMuY3JlYXRlQ2hhdGJvdFRlc3RTdWl0ZSgpO1xuXG4gICAgICAvLyDjg4bjgrnjg4jjgqjjg7Pjgrjjg7Pjgafjga7lrp/ooYxcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnRlc3RFbmdpbmUuZXhlY3V0ZVRlc3RTdWl0ZSh0ZXN0U3VpdGUpO1xuXG4gICAgICAvLyDntZDmnpzjga7pm4boqIhcbiAgICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLmdlbmVyYXRlVGVzdFN1bW1hcnkocmVzdWx0cyk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfwn5OKIOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOWun+ihjOe1kOaenDonKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDnt4/jg4bjgrnjg4jmlbA6ICR7c3VtbWFyeS50b3RhbFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOaIkOWKnzogJHtzdW1tYXJ5LnBhc3NlZFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOWkseaVlzogJHtzdW1tYXJ5LmZhaWxlZFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOOCueOCreODg+ODlzogJHtzdW1tYXJ5LnNraXBwZWRUZXN0c31gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDmiJDlip/njoc6ICR7KHN1bW1hcnkuc3VjY2Vzc1JhdGUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOW5s+Wdh+W/nOetlOaZgumWkzogJHtzdW1tYXJ5LmF2ZXJhZ2VSZXNwb25zZVRpbWUudG9GaXhlZCgwKX1tc2ApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOaXpeacrOiqnuWTgeizquOCueOCs+OCojogJHsoc3VtbWFyeS5qYXBhbmVzZVF1YWxpdHlTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgUkFH5pyJ5Yq55oCnOiAkeyhzdW1tYXJ5LnJhZ0VmZmVjdGl2ZW5lc3MgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOe3j+Wun+ihjOaZgumWkzogJHtzdW1tYXJ5LnRvdGFsRHVyYXRpb259bXNgKTtcblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IHN1bW1hcnkuZmFpbGVkVGVzdHMgPT09IDA7XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg44OB44Oj44OD44OI44Oc44OD44OI5qmf6IO944OG44K544OI44K544Kk44O844OI5a6f6KGM5a6M5LqGIC0g5YWo44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygn4pqg77iPIOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOOCueOCpOODvOODiOWun+ihjOWujOS6hiAtIOS4gOmDqOODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzLFxuICAgICAgICByZXN1bHRzOiByZXN1bHRzIGFzIE1hcDxzdHJpbmcsIENoYXRib3RUZXN0UmVzdWx0PixcbiAgICAgICAgc3VtbWFyeVxuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44OB44Oj44OD44OI44Oc44OD44OI5qmf6IO944OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jntZDmnpzjgrXjg57jg6rjg7zjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVUZXN0U3VtbWFyeShyZXN1bHRzOiBNYXA8c3RyaW5nLCBhbnk+KToge1xuICAgIHRvdGFsVGVzdHM6IG51bWJlcjtcbiAgICBwYXNzZWRUZXN0czogbnVtYmVyO1xuICAgIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gICAgc2tpcHBlZFRlc3RzOiBudW1iZXI7XG4gICAgc3VjY2Vzc1JhdGU6IG51bWJlcjtcbiAgICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gICAgYXZlcmFnZVJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIGphcGFuZXNlUXVhbGl0eVNjb3JlOiBudW1iZXI7XG4gICAgcmFnRWZmZWN0aXZlbmVzczogbnVtYmVyO1xuICB9IHtcbiAgICBjb25zdCByZXN1bHRzQXJyYXkgPSBBcnJheS5mcm9tKHJlc3VsdHMudmFsdWVzKCkpO1xuICAgIFxuICAgIGNvbnN0IHRvdGFsVGVzdHMgPSByZXN1bHRzQXJyYXkubGVuZ3RoO1xuICAgIGNvbnN0IHBhc3NlZFRlc3RzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIGNvbnN0IGZhaWxlZFRlc3RzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+ICFyLnN1Y2Nlc3MgJiYgci5zdGF0dXMgIT09ICdTS0lQUEVEJykubGVuZ3RoO1xuICAgIGNvbnN0IHNraXBwZWRUZXN0cyA9IHJlc3VsdHNBcnJheS5maWx0ZXIociA9PiByLnN0YXR1cyA9PT0gJ1NLSVBQRUQnKS5sZW5ndGg7XG4gICAgY29uc3Qgc3VjY2Vzc1JhdGUgPSB0b3RhbFRlc3RzID4gMCA/IHBhc3NlZFRlc3RzIC8gdG90YWxUZXN0cyA6IDA7XG4gICAgY29uc3QgdG90YWxEdXJhdGlvbiA9IHJlc3VsdHNBcnJheS5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgKHIuZHVyYXRpb24gfHwgMCksIDApO1xuICAgIFxuICAgIC8vIOW5s+Wdh+W/nOetlOaZgumWk+OBruioiOeul1xuICAgIGNvbnN0IHJlc3BvbnNlVGltZVJlc3VsdHMgPSByZXN1bHRzQXJyYXkuZmlsdGVyKHIgPT4gci5yZXNwb25zZURldGFpbHM/LnJlc3BvbnNlVGltZSk7XG4gICAgY29uc3QgYXZlcmFnZVJlc3BvbnNlVGltZSA9IHJlc3BvbnNlVGltZVJlc3VsdHMubGVuZ3RoID4gMFxuICAgICAgPyByZXNwb25zZVRpbWVSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLnJlc3BvbnNlRGV0YWlscy5yZXNwb25zZVRpbWUsIDApIC8gcmVzcG9uc2VUaW1lUmVzdWx0cy5sZW5ndGhcbiAgICAgIDogMDtcbiAgICBcbiAgICAvLyDml6XmnKzoqp7lk4Hos6rjgrnjgrPjgqLjga7oqIjnrpdcbiAgICBjb25zdCBqYXBhbmVzZVF1YWxpdHlSZXN1bHRzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+IHIucmVzcG9uc2VEZXRhaWxzPy5qYXBhbmVzZVF1YWxpdHkpO1xuICAgIGNvbnN0IGphcGFuZXNlUXVhbGl0eVNjb3JlID0gamFwYW5lc2VRdWFsaXR5UmVzdWx0cy5sZW5ndGggPiAwXG4gICAgICA/IGphcGFuZXNlUXVhbGl0eVJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIucmVzcG9uc2VEZXRhaWxzLmphcGFuZXNlUXVhbGl0eSwgMCkgLyBqYXBhbmVzZVF1YWxpdHlSZXN1bHRzLmxlbmd0aFxuICAgICAgOiAwO1xuICAgIFxuICAgIC8vIFJBR+acieWKueaAp+OBruioiOeul1xuICAgIGNvbnN0IHJhZ1Jlc3VsdHMgPSByZXN1bHRzQXJyYXkuZmlsdGVyKHIgPT4gci5yYWdEZXRhaWxzKTtcbiAgICBjb25zdCByYWdFZmZlY3RpdmVuZXNzID0gcmFnUmVzdWx0cy5sZW5ndGggPiAwXG4gICAgICA/IHJhZ1Jlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIChyLnJhZ0RldGFpbHMuc291cmNlQWNjdXJhY3kgfHwgMCksIDApIC8gcmFnUmVzdWx0cy5sZW5ndGhcbiAgICAgIDogMDtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3RhbFRlc3RzLFxuICAgICAgcGFzc2VkVGVzdHMsXG4gICAgICBmYWlsZWRUZXN0cyxcbiAgICAgIHNraXBwZWRUZXN0cyxcbiAgICAgIHN1Y2Nlc3NSYXRlLFxuICAgICAgdG90YWxEdXJhdGlvbixcbiAgICAgIGF2ZXJhZ2VSZXNwb25zZVRpbWUsXG4gICAgICBqYXBhbmVzZVF1YWxpdHlTY29yZSxcbiAgICAgIHJhZ0VmZmVjdGl2ZW5lc3NcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOips+e0sOODrOODneODvOODiOOBrueUn+aIkFxuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydChyZXN1bHRzOiBNYXA8c3RyaW5nLCBDaGF0Ym90VGVzdFJlc3VsdD4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5nZW5lcmF0ZVRlc3RTdW1tYXJ5KHJlc3VsdHMpO1xuXG4gICAgbGV0IHJlcG9ydCA9IGAjIOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOips+e0sOODrOODneODvOODiFxcblxcbmA7XG4gICAgcmVwb3J0ICs9IGAqKuWun+ihjOaXpeaZgioqOiAke3RpbWVzdGFtcH1cXG5gO1xuICAgIHJlcG9ydCArPSBgKirjg4bjgrnjg4jnkrDlooMqKjogQVdT5p2x5Lqs44Oq44O844K444On44Oz5pys55Wq55Kw5aKDICgke3RoaXMuY29uZmlnLnJlZ2lvbn0pXFxuYDtcbiAgICByZXBvcnQgKz0gYCoqQmVkcm9ja+ODouODh+ODqyoqOiBDbGF1ZGUgMyBIYWlrdSwgQ2xhdWRlIDMgU29ubmV0XFxuYDtcbiAgICByZXBvcnQgKz0gYCoqT3BlblNlYXJjaOODieODoeOCpOODsyoqOiAke3RoaXMuY29uZmlnLnJlc291cmNlcy5vcGVuU2VhcmNoRG9tYWlufVxcbmA7XG4gICAgcmVwb3J0ICs9IGAqKkZTeOODleOCoeOCpOODq+OCt+OCueODhuODoCoqOiAke3RoaXMuY29uZmlnLnJlc291cmNlcy5mc3hGaWxlU3lzdGVtSWR9XFxuXFxuYDtcblxuICAgIHJlcG9ydCArPSBgIyMg5a6f6KGM44K144Oe44Oq44O8XFxuXFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirnt4/jg4bjgrnjg4jmlbAqKjogJHtzdW1tYXJ5LnRvdGFsVGVzdHN9XFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirmiJDlip8qKjogJHtzdW1tYXJ5LnBhc3NlZFRlc3RzfVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq5aSx5pWXKio6ICR7c3VtbWFyeS5mYWlsZWRUZXN0c31cXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKuOCueOCreODg+ODlyoqOiAke3N1bW1hcnkuc2tpcHBlZFRlc3RzfVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq5oiQ5Yqf546HKio6ICR7KHN1bW1hcnkuc3VjY2Vzc1JhdGUgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq5bmz5Z2H5b+c562U5pmC6ZaTKio6ICR7c3VtbWFyeS5hdmVyYWdlUmVzcG9uc2VUaW1lLnRvRml4ZWQoMCl9bXNcXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKuaXpeacrOiqnuWTgeizquOCueOCs+OCoioqOiAkeyhzdW1tYXJ5LmphcGFuZXNlUXVhbGl0eVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKlJBR+acieWKueaApyoqOiAkeyhzdW1tYXJ5LnJhZ0VmZmVjdGl2ZW5lc3MgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq57eP5a6f6KGM5pmC6ZaTKio6ICR7c3VtbWFyeS50b3RhbER1cmF0aW9ufW1zXFxuXFxuYDtcblxuICAgIC8vIEFJ5ZOB6LOq6KmV5L6hXG4gICAgcmVwb3J0ICs9IGAjIyBBSeW/nOetlOWTgeizquipleS+oVxcblxcbmA7XG4gICAgaWYgKHN1bW1hcnkuamFwYW5lc2VRdWFsaXR5U2NvcmUgPj0gMC44KSB7XG4gICAgICByZXBvcnQgKz0gYPCfn6IgKirlhKrnp4AqKjog5pel5pys6Kqe5b+c562U5ZOB6LOq44GM6auY5rC05rqW44Gn44GZXFxuYDtcbiAgICB9IGVsc2UgaWYgKHN1bW1hcnkuamFwYW5lc2VRdWFsaXR5U2NvcmUgPj0gMC42KSB7XG4gICAgICByZXBvcnQgKz0gYPCfn6EgKiroia/lpb0qKjog5pel5pys6Kqe5b+c562U5ZOB6LOq44Gr6Lu95b6u44Gq5pS55ZaE54K544GM44GC44KK44G+44GZXFxuYDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVwb3J0ICs9IGDwn5S0ICoq6KaB5pS55ZaEKio6IOaXpeacrOiqnuW/nOetlOWTgeizquOBruWQkeS4iuOBjOW/heimgeOBp+OBmVxcbmA7XG4gICAgfVxuXG4gICAgaWYgKHN1bW1hcnkucmFnRWZmZWN0aXZlbmVzcyA+PSAwLjcpIHtcbiAgICAgIHJlcG9ydCArPSBg8J+foiAqKlJBR+apn+iDvSoqOiDmlofmm7jmpJzntKLjgajlv5znrZTnlJ/miJDjgYzpganliIfjgavpgKPmkLrjgZfjgabjgYTjgb7jgZlcXG5gO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5yYWdFZmZlY3RpdmVuZXNzID49IDAuNSkge1xuICAgICAgcmVwb3J0ICs9IGDwn5+hICoqUkFH5qmf6IO9Kio6IOaWh+abuOaknOe0ouOBrueyvuW6puWQkeS4iuOBjOaOqOWlqOOBleOCjOOBvuOBmVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcG9ydCArPSBg8J+UtCAqKlJBR+apn+iDvSoqOiDmlofmm7jmpJzntKLjgajlv5znrZTnlJ/miJDjga7pgKPmkLrjgavllY/poYzjgYzjgYLjgorjgb7jgZlcXG5gO1xuICAgIH1cbiAgICByZXBvcnQgKz0gYFxcbmA7XG5cbiAgICByZXBvcnQgKz0gYCMjIOODhuOCueODiOe1kOaenOips+e0sFxcblxcbmA7XG5cbiAgICBmb3IgKGNvbnN0IFt0ZXN0SWQsIHJlc3VsdF0gb2YgcmVzdWx0cykge1xuICAgICAgY29uc3Qgc3RhdHVzID0gcmVzdWx0LnN1Y2Nlc3MgPyAn4pyFIOaIkOWKnycgOiAn4p2MIOWkseaVlyc7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IHJlc3VsdC5kdXJhdGlvbiB8fCAwO1xuXG4gICAgICByZXBvcnQgKz0gYCMjIyAke3Jlc3VsdC50ZXN0TmFtZX0gKCR7dGVzdElkfSlcXG5cXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq44K544OG44O844K/44K5Kio6ICR7c3RhdHVzfVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirlrp/ooYzmmYLplpMqKjogJHtkdXJhdGlvbn1tc1xcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirplovlp4vmmYLliLsqKjogJHtyZXN1bHQuc3RhcnRUaW1lPy50b0lTT1N0cmluZygpfVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirntYLkuobmmYLliLsqKjogJHtyZXN1bHQuZW5kVGltZT8udG9JU09TdHJpbmcoKX1cXG5gO1xuXG4gICAgICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuOCqOODqeODvCoqOiAke3Jlc3VsdC5lcnJvcn1cXG5gO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0LnJlc3BvbnNlRGV0YWlscykge1xuICAgICAgICByZXBvcnQgKz0gYC0gKirlv5znrZToqbPntLAqKjpcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDlv5znrZTmmYLplpM6ICR7cmVzdWx0LnJlc3BvbnNlRGV0YWlscy5yZXNwb25zZVRpbWV9bXNcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjg4jjg7zjgq/jg7PmlbA6ICR7cmVzdWx0LnJlc3BvbnNlRGV0YWlscy50b2tlbkNvdW50fVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgICAtIOS9v+eUqOODouODh+ODqzogJHtyZXN1bHQucmVzcG9uc2VEZXRhaWxzLm1vZGVsVXNlZH1cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjgrnjg4jjg6rjg7zjg5/jg7PjgrA6ICR7cmVzdWx0LnJlc3BvbnNlRGV0YWlscy5pc1N0cmVhbWluZyA/ICfjgYLjgoonIDogJ+OBquOBlyd9XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAgIC0g5pel5pys6Kqe5ZOB6LOqOiAkeyhyZXN1bHQucmVzcG9uc2VEZXRhaWxzLmphcGFuZXNlUXVhbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgXG4gICAgICAgIC8vIOW/nOetlOODhuOCreOCueODiOOBruS4gOmDqOOCkuihqOekuu+8iOmVt+OBmeOBjuOCi+WgtOWQiOOBr+WIh+OCiuipsOOCge+8iVxuICAgICAgICBjb25zdCByZXNwb25zZVByZXZpZXcgPSByZXN1bHQucmVzcG9uc2VEZXRhaWxzLnJlc3BvbnNlVGV4dC5sZW5ndGggPiAyMDBcbiAgICAgICAgICA/IHJlc3VsdC5yZXNwb25zZURldGFpbHMucmVzcG9uc2VUZXh0LnN1YnN0cmluZygwLCAyMDApICsgJy4uLidcbiAgICAgICAgICA6IHJlc3VsdC5yZXNwb25zZURldGFpbHMucmVzcG9uc2VUZXh0O1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDlv5znrZTlhoXlrrk6IFwiJHtyZXNwb25zZVByZXZpZXd9XCJcXG5gO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0LnJhZ0RldGFpbHMpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoqUkFH6Kmz57SwKio6XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAgIC0g5qSc57Si5paH5pu45pWwOiAke3Jlc3VsdC5yYWdEZXRhaWxzLmRvY3VtZW50c0ZvdW5kfeS7tlxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgICAtIOmWoumAo+aWh+abuOaVsDogJHtyZXN1bHQucmFnRGV0YWlscy5yZWxldmFudERvY3VtZW50c33ku7ZcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDlvJXnlKjlkKvmnIk6ICR7cmVzdWx0LnJhZ0RldGFpbHMuY2l0YXRpb25zSW5jbHVkZWQgPyAn44GC44KKJyA6ICfjgarjgZcnfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgICAtIOaDheWgsea6kOeyvuW6pjogJHsocmVzdWx0LnJhZ0RldGFpbHMuc291cmNlQWNjdXJhY3kgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQucGVyZm9ybWFuY2VNZXRyaWNzKSB7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuODkeODleOCqeODvOODnuODs+OCuSoqOlxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgICAtIOODrOOCpOODhuODs+OCtzogJHtyZXN1bHQucGVyZm9ybWFuY2VNZXRyaWNzLmxhdGVuY3l9bXNcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjgrnjg6vjg7zjg5fjg4Pjg4g6ICR7cmVzdWx0LnBlcmZvcm1hbmNlTWV0cmljcy50aHJvdWdocHV0LnRvRml4ZWQoMil9IHRva2Vucy9zZWNcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjgqjjg6njg7znjoc6ICR7KHJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3MuZXJyb3JSYXRlICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjg6rjgr3jg7zjgrnkvb/nlKjnjoc6ICR7KHJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3MucmVzb3VyY2VVc2FnZSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgIH1cblxuICAgICAgcmVwb3J0ICs9IGBcXG5gO1xuICAgIH1cblxuICAgIC8vIOaOqOWlqOS6i+mghVxuICAgIHJlcG9ydCArPSBgIyMg5o6o5aWo5LqL6aCFXFxuXFxuYDtcbiAgICByZXBvcnQgKz0gdGhpcy5nZW5lcmF0ZVJlY29tbWVuZGF0aW9ucyhyZXN1bHRzLCBzdW1tYXJ5KTtcblxuICAgIHJldHVybiByZXBvcnQ7XG4gIH1cblxuICAvKipcbiAgICog5o6o5aWo5LqL6aCF44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlUmVjb21tZW5kYXRpb25zKFxuICAgIHJlc3VsdHM6IE1hcDxzdHJpbmcsIENoYXRib3RUZXN0UmVzdWx0PixcbiAgICBzdW1tYXJ5OiBhbnlcbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgcmVjb21tZW5kYXRpb25zID0gJyc7XG4gICAgY29uc3QgZmFpbGVkVGVzdHMgPSBBcnJheS5mcm9tKHJlc3VsdHMudmFsdWVzKCkpLmZpbHRlcihyID0+ICFyLnN1Y2Nlc3MpO1xuXG4gICAgaWYgKGZhaWxlZFRlc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zICs9IGDinIUg5YWo44Gm44Gu44OB44Oj44OD44OI44Oc44OD44OI5qmf6IO944OG44K544OI44GM5oiQ5Yqf44GX44G+44GX44Gf44CC54++5Zyo44Gu6Kit5a6a44KS57at5oyB44GX44Gm44GP44Gg44GV44GE44CCXFxuXFxuYDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVjb21tZW5kYXRpb25zICs9IGDku6XkuIvjga7mlLnlloTjgpLmjqjlpajjgZfjgb7jgZk6XFxuXFxuYDtcbiAgICAgIFxuICAgICAgZmFpbGVkVGVzdHMuZm9yRWFjaCh0ZXN0ID0+IHtcbiAgICAgICAgc3dpdGNoICh0ZXN0LnRlc3RJZCkge1xuICAgICAgICAgIGNhc2UgJ2NoYXRib3QtamFwYW5lc2UtMDAxJzpcbiAgICAgICAgICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSAqKuaXpeacrOiqnuW/nOetlOWTgeizqioqOiDjg5fjg63jg7Pjg5fjg4jjgqjjg7Pjgrjjg4vjgqLjg6rjg7PjgrDjgpLmlLnlloTjgZfjgIHjgojjgoroh6rnhLbjgarml6XmnKzoqp7lv5znrZTjgpLnlJ/miJDjgZfjgabjgY/jgaDjgZXjgYRcXG5gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnY2hhdGJvdC1kb2N1bWVudC0wMDEnOlxuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zICs9IGAtICoq5paH5pu46Zai6YCj5b+c562UKio6IE9wZW5TZWFyY2jjga7mpJzntKLnsr7luqbjgpLlkJHkuIrjgZXjgZvjgIHjgojjgorplqLpgKPmgKfjga7pq5jjgYTmlofmm7jjgpLlj5blvpfjgZfjgabjgY/jgaDjgZXjgYRcXG5gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnY2hhdGJvdC1zdHJlYW1pbmctMDAxJzpcbiAgICAgICAgICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSAqKuOCueODiOODquODvOODn+ODs+OCsOW/nOetlCoqOiDjgrnjg4jjg6rjg7zjg5/jg7PjgrDlh6bnkIbjga7lronlrprmgKfjgpLlkJHkuIrjgZXjgZvjgIHjgqjjg6njg7zlh6bnkIbjgpLlvLfljJbjgZfjgabjgY/jgaDjgZXjgYRcXG5gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnY2hhdGJvdC1lcnJvci0wMDEnOlxuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zICs9IGAtICoq44Ko44Op44O844OP44Oz44OJ44Oq44Oz44KwKio6IOS4jemBqeWIh+OBquizquWVj+OBuOOBruWvvuW/nOODreOCuOODg+OCr+OCkuaUueWWhOOBl+OBpuOBj+OBoOOBleOBhFxcbmA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdjaGF0Ym90LWNvbXBsZXgtMDAxJzpcbiAgICAgICAgICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSAqKuikh+mbkeOBquizquWVj+WvvuW/nCoqOiDjgojjgorpq5jmgKfog73jgarjg6Ljg4fjg6vjga7kvb/nlKjjgoTjgIHjg5fjg63jg7Pjg5fjg4jjga7oqbPntLDljJbjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYRcXG5gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOODkeODleOCqeODvOODnuODs+OCuemWoumAo+OBruaOqOWlqOS6i+mghVxuICAgIGlmIChzdW1tYXJ5LmF2ZXJhZ2VSZXNwb25zZVRpbWUgPiA4MDAwKSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMgKz0gYC0gKirlv5znrZTmmYLplpMqKjog5bmz5Z2H5b+c562U5pmC6ZaT44GMJHtzdW1tYXJ5LmF2ZXJhZ2VSZXNwb25zZVRpbWUudG9GaXhlZCgwKX1tc+OBqOmVt+OBhOOBn+OCgeOAgeODouODh+ODq+mBuOaKnuOChOODl+ODreODs+ODl+ODiOacgOmBqeWMluOCkuaknOiojuOBl+OBpuOBj+OBoOOBleOBhFxcbmA7XG4gICAgfVxuXG4gICAgaWYgKHN1bW1hcnkuamFwYW5lc2VRdWFsaXR5U2NvcmUgPCAwLjcpIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSAqKuaXpeacrOiqnuWTgeizqioqOiDml6XmnKzoqp7lk4Hos6rjgrnjgrPjgqLjgYwkeyhzdW1tYXJ5LmphcGFuZXNlUXVhbGl0eVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSXjga7jgZ/jgoHjgIHml6XmnKzoqp7nibnljJbjga7jg5fjg63jg7Pjg5fjg4joqr/mlbTjgYzlv4XopoHjgafjgZlcXG5gO1xuICAgIH1cblxuICAgIGlmIChzdW1tYXJ5LnJhZ0VmZmVjdGl2ZW5lc3MgPCAwLjYpIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSAqKlJBR+apn+iDvSoqOiBSQUfmnInlirnmgKfjgYwkeyhzdW1tYXJ5LnJhZ0VmZmVjdGl2ZW5lc3MgKiAxMDApLnRvRml4ZWQoMSl9JeOBruOBn+OCgeOAgeaWh+abuOOCpOODs+ODh+ODg+OCr+OCueOBruaUueWWhOOChOaknOe0ouOCouODq+OCtOODquOCuuODoOOBruiqv+aVtOOBjOW/heimgeOBp+OBmVxcbmA7XG4gICAgfVxuXG4gICAgcmVjb21tZW5kYXRpb25zICs9IGBcXG4jIyMgQUnlv5znrZTlk4Hos6rlkJHkuIrjga7jg5njgrnjg4jjg5fjg6njgq/jg4bjgqPjgrlcXG5cXG5gO1xuICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSDml6XmnKzoqp7nibnljJbjg5fjg63jg7Pjg5fjg4jjga7kvb/nlKhcXG5gO1xuICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSDmlofmm7jjgrPjg7Pjg4bjgq3jgrnjg4jjga7pganliIfjgarmp4vpgKDljJZcXG5gO1xuICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSDjgrnjg4jjg6rjg7zjg5/jg7PjgrDlv5znrZTjga7lronlrprmgKfnorrkv51cXG5gO1xuICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSDjgqjjg6njg7zjgrHjg7zjgrnjga7ljIXmi6znmoTjgarlr77lv5xcXG5gO1xuICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSDntpnntprnmoTjgarlv5znrZTlk4Hos6rnm6PoppZcXG5gO1xuXG4gICAgcmV0dXJuIHJlY29tbWVuZGF0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kg44OB44Oj44OD44OI44Oc44OD44OI5qmf6IO944OG44K544OI44Op44Oz44OK44O844KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgYXdhaXQgdGhpcy50ZXN0TW9kdWxlLmNsZWFudXAoKTtcbiAgICBjb25zb2xlLmxvZygn4pyFIOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOODqeODs+ODiuODvOOBruOCr+ODquODvOODs+OCouODg+ODl+WujOS6hicpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENoYXRib3RUZXN0UnVubmVyOyJdfQ==