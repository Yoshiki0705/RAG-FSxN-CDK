"use strict";
/**
 * AI統合テストランナー
 *
 * Nova モデル、日本語精度、ストリーミング、マルチモーダルテストを統合実行
 * 実本番Amazon Bedrockでの包括的AI機能検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIIntegrationTestRunner = void 0;
const nova_model_test_1 = __importDefault(require("./nova-model-test"));
const japanese_accuracy_test_1 = __importDefault(require("./japanese-accuracy-test"));
const streaming_response_test_1 = __importDefault(require("./streaming-response-test"));
const multimodal_input_test_1 = __importDefault(require("./multimodal-input-test"));
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * AI統合テストランナークラス
 */
class AIIntegrationTestRunner {
    config;
    novaTestModule;
    japaneseTestModule;
    streamingTestModule;
    multimodalTestModule;
    constructor(config) {
        this.config = config;
        // 各テストモジュールの初期化
        this.novaTestModule = new nova_model_test_1.default(config);
        this.japaneseTestModule = new japanese_accuracy_test_1.default(config);
        this.streamingTestModule = new streaming_response_test_1.default(config);
        this.multimodalTestModule = new multimodal_input_test_1.default(config);
    }
    /**
     * 包括的AI統合テストの実行
     */
    async runComprehensiveAITests() {
        const testId = 'ai-integration-comprehensive-001';
        const startTime = Date.now();
        console.log('🤖 包括的AI統合テストを開始...');
        console.log('='.repeat(60));
        try {
            const allResults = {
                novaResults: [],
                japaneseResults: [],
                streamingResults: [],
                multimodalResults: []
            };
            // 1. Nova モデルファミリーテスト
            console.log('📋 1/4: Nova モデルファミリーテスト実行中...');
            try {
                const novaResults = await this.novaTestModule.runAllNovaModelTests();
                allResults.novaResults = novaResults;
                console.log(`✅ Nova モデルテスト完了: ${novaResults.filter(r => r.success).length}/${novaResults.length} 成功`);
            }
            catch (error) {
                console.error('❌ Nova モデルテスト実行エラー:', error);
                allResults.novaResults = [];
            }
            // 2. 日本語精度テスト
            console.log('📋 2/4: 日本語精度テスト実行中...');
            try {
                const japaneseResult = await this.japaneseTestModule.testComprehensiveJapaneseAccuracy();
                allResults.japaneseResults = [japaneseResult];
                console.log(`✅ 日本語精度テスト完了: ${japaneseResult.success ? '成功' : '失敗'}`);
            }
            catch (error) {
                console.error('❌ 日本語精度テスト実行エラー:', error);
                allResults.japaneseResults = [];
            }
            // 3. ストリーミングレスポンステスト
            console.log('📋 3/4: ストリーミングレスポンステスト実行中...');
            try {
                const streamingResult = await this.streamingTestModule.testComprehensiveStreaming();
                allResults.streamingResults = [streamingResult];
                console.log(`✅ ストリーミングテスト完了: ${streamingResult.success ? '成功' : '失敗'}`);
            }
            catch (error) {
                console.error('❌ ストリーミングテスト実行エラー:', error);
                allResults.streamingResults = [];
            }
            // 4. マルチモーダル入力テスト
            console.log('📋 4/4: マルチモーダル入力テスト実行中...');
            try {
                const multimodalResult = await this.multimodalTestModule.testComprehensiveMultimodal();
                allResults.multimodalResults = [multimodalResult];
                console.log(`✅ マルチモーダルテスト完了: ${multimodalResult.success ? '成功' : '失敗'}`);
            }
            catch (error) {
                console.error('❌ マルチモーダルテスト実行エラー:', error);
                allResults.multimodalResults = [];
            }
            // 総合評価の計算
            const aiTestSummary = this.calculateAITestSummary(allResults);
            const success = aiTestSummary.overallAIScore >= 0.85; // 85%以上で成功
            const result = {
                testId,
                testName: '包括的AI統合テスト',
                category: 'ai-integration',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                aiTestSummary,
                detailedResults: allResults,
                metadata: {
                    testModules: ['nova-models', 'japanese-accuracy', 'streaming', 'multimodal'],
                    targetScore: 0.85,
                    actualScore: aiTestSummary.overallAIScore
                }
            };
            console.log('='.repeat(60));
            if (success) {
                console.log(`🎉 包括的AI統合テスト成功 (総合スコア: ${(aiTestSummary.overallAIScore * 100).toFixed(1)}%)`);
            }
            else {
                console.error(`❌ 包括的AI統合テスト失敗 (総合スコア: ${(aiTestSummary.overallAIScore * 100).toFixed(1)}%)`);
            }
            return result;
        }
        catch (error) {
            console.error('❌ 包括的AI統合テスト実行エラー:', error);
            return {
                testId,
                testName: '包括的AI統合テスト',
                category: 'ai-integration',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * AI テストサマリーの計算
     */
    calculateAITestSummary(results) {
        // Nova モデルテストスコア
        const novaSuccessRate = results.novaResults.length > 0 ?
            results.novaResults.filter((r) => r.success).length / results.novaResults.length : 0;
        // 日本語精度スコア
        const japaneseScore = results.japaneseResults.length > 0 && results.japaneseResults[0].accuracyMetrics ?
            results.japaneseResults[0].accuracyMetrics.overallAccuracy : 0;
        // ストリーミングパフォーマンススコア
        const streamingScore = results.streamingResults.length > 0 && results.streamingResults[0].qualityMetrics ?
            results.streamingResults[0].qualityMetrics.realTimeScore : 0;
        // マルチモーダル能力スコア
        const multimodalScore = results.multimodalResults.length > 0 && results.multimodalResults[0].modalityMetrics ?
            results.multimodalResults[0].modalityMetrics.integrationQuality : 0;
        // 重み付き総合スコア
        const weights = {
            nova: 0.3, // Nova モデル: 30%
            japanese: 0.3, // 日本語精度: 30%
            streaming: 0.2, // ストリーミング: 20%
            multimodal: 0.2 // マルチモーダル: 20%
        };
        const overallScore = (novaSuccessRate * weights.nova +
            japaneseScore * weights.japanese +
            streamingScore * weights.streaming +
            multimodalScore * weights.multimodal);
        return {
            novaModelTests: novaSuccessRate,
            japaneseAccuracyScore: japaneseScore,
            streamingPerformance: streamingScore,
            multimodalCapability: multimodalScore,
            overallAIScore: overallScore
        };
    }
    /**
     * 詳細レポートの生成
     */
    async generateDetailedAIReport(result) {
        const timestamp = new Date().toISOString();
        let report = `# AI統合テスト詳細レポート\n\n`;
        report += `**実行日時**: ${timestamp}\n`;
        report += `**テスト環境**: AWS東京リージョン本番環境 (${this.config.region})\n`;
        report += `**総合スコア**: ${(result.aiTestSummary?.overallAIScore || 0 * 100).toFixed(1)}%\n\n`;
        // Nova モデルテスト結果
        if (result.detailedResults?.novaResults) {
            report += `## Nova モデルファミリーテスト結果\n\n`;
            for (const novaResult of result.detailedResults.novaResults) {
                const status = novaResult.success ? '✅ 成功' : '❌ 失敗';
                report += `### ${novaResult.testName}\n`;
                report += `- **ステータス**: ${status}\n`;
                report += `- **実行時間**: ${novaResult.duration}ms\n`;
                if (novaResult.modelDetails) {
                    report += `- **モデル**: ${novaResult.modelDetails.modelName} (${novaResult.modelDetails.modelId})\n`;
                }
                if (novaResult.performanceMetrics) {
                    report += `- **応答時間**: ${novaResult.performanceMetrics.responseTime}ms\n`;
                    report += `- **スループット**: ${novaResult.performanceMetrics.tokensPerSecond.toFixed(1)} tokens/sec\n`;
                }
                report += `\n`;
            }
        }
        // 日本語精度テスト結果
        if (result.detailedResults?.japaneseResults && result.detailedResults.japaneseResults.length > 0) {
            const japaneseResult = result.detailedResults.japaneseResults[0];
            report += `## 日本語精度テスト結果\n\n`;
            report += `- **総合精度**: ${(japaneseResult.accuracyMetrics?.overallAccuracy || 0 * 100).toFixed(1)}%\n`;
            report += `- **文法精度**: ${(japaneseResult.accuracyMetrics?.grammarAccuracy || 0 * 100).toFixed(1)}%\n`;
            report += `- **語彙精度**: ${(japaneseResult.accuracyMetrics?.vocabularyAccuracy || 0 * 100).toFixed(1)}%\n`;
            report += `- **敬語精度**: ${(japaneseResult.accuracyMetrics?.formalityAccuracy || 0 * 100).toFixed(1)}%\n\n`;
        }
        // ストリーミングテスト結果
        if (result.detailedResults?.streamingResults && result.detailedResults.streamingResults.length > 0) {
            const streamingResult = result.detailedResults.streamingResults[0];
            report += `## ストリーミングレスポンステスト結果\n\n`;
            report += `- **初回トークンレイテンシ**: ${streamingResult.streamingMetrics?.firstTokenLatency || 0}ms\n`;
            report += `- **平均レイテンシ**: ${streamingResult.streamingMetrics?.averageTokenLatency || 0}ms\n`;
            report += `- **スループット**: ${streamingResult.streamingMetrics?.throughput || 0} tokens/sec\n`;
            report += `- **リアルタイムスコア**: ${(streamingResult.qualityMetrics?.realTimeScore || 0 * 100).toFixed(1)}%\n\n`;
        }
        // マルチモーダルテスト結果
        if (result.detailedResults?.multimodalResults && result.detailedResults.multimodalResults.length > 0) {
            const multimodalResult = result.detailedResults.multimodalResults[0];
            report += `## マルチモーダル入力テスト結果\n\n`;
            report += `- **テキスト処理精度**: ${(multimodalResult.modalityMetrics?.textProcessingAccuracy || 0 * 100).toFixed(1)}%\n`;
            report += `- **画像処理精度**: ${(multimodalResult.modalityMetrics?.imageProcessingAccuracy || 0 * 100).toFixed(1)}%\n`;
            report += `- **統合品質**: ${(multimodalResult.modalityMetrics?.integrationQuality || 0 * 100).toFixed(1)}%\n`;
            report += `- **応答関連性**: ${(multimodalResult.modalityMetrics?.responseRelevance || 0 * 100).toFixed(1)}%\n\n`;
        }
        return report;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 AI統合テストランナーをクリーンアップ中...');
        await Promise.all([
            this.novaTestModule.cleanup(),
            this.japaneseTestModule.cleanup(),
            this.streamingTestModule.cleanup(),
            this.multimodalTestModule.cleanup()
        ]);
        console.log('✅ AI統合テストランナーのクリーンアップ完了');
    }
}
exports.AIIntegrationTestRunner = AIIntegrationTestRunner;
exports.default = AIIntegrationTestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWktaW50ZWdyYXRpb24tdGVzdC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhaS1pbnRlZ3JhdGlvbi10ZXN0LXJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7OztBQUVILHdFQUE2RTtBQUM3RSxzRkFBa0c7QUFDbEcsd0ZBQTZGO0FBQzdGLG9GQUEwRjtBQUcxRiw4RUFBb0Y7QUFxQnBGOztHQUVHO0FBQ0gsTUFBYSx1QkFBdUI7SUFDMUIsTUFBTSxDQUFtQjtJQUN6QixjQUFjLENBQXNCO0lBQ3BDLGtCQUFrQixDQUE2QjtJQUMvQyxtQkFBbUIsQ0FBOEI7SUFDakQsb0JBQW9CLENBQTRCO0lBRXhELFlBQVksTUFBd0I7UUFDbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFckIsZ0JBQWdCO1FBQ2hCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSx5QkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxnQ0FBMEIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxpQ0FBMkIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSwrQkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsdUJBQXVCO1FBQzNCLE1BQU0sTUFBTSxHQUFHLGtDQUFrQyxDQUFDO1FBQ2xELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUU3QixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFN0IsSUFBSSxDQUFDO1lBQ0gs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QUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNuSCxNQUFNLElBQUksaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLHVCQUF1QixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNsSCxNQUFNLElBQUksZUFBZSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxrQkFBa0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDM0csTUFBTSxJQUFJLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxpQkFBaUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDL0csQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBRTFDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNoQixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRTtZQUM3QixJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFO1lBQ2pDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUU7WUFDbEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRTtTQUNwQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDekMsQ0FBQztDQUNGO0FBblFELDBEQW1RQztBQUVELGtCQUFlLHVCQUF1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBSee1seWQiOODhuOCueODiOODqeODs+ODiuODvFxuICogXG4gKiBOb3ZhIOODouODh+ODq+OAgeaXpeacrOiqnueyvuW6puOAgeOCueODiOODquODvOODn+ODs+OCsOOAgeODnuODq+ODgeODouODvOODgOODq+ODhuOCueODiOOCkue1seWQiOWun+ihjFxuICog5a6f5pys55WqQW1hem9uIEJlZHJvY2vjgafjga7ljIXmi6znmoRBSeapn+iDveaknOiovFxuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0IE5vdmFNb2RlbFRlc3RNb2R1bGUsIHsgTm92YU1vZGVsVGVzdFJlc3VsdCB9IGZyb20gJy4vbm92YS1tb2RlbC10ZXN0JztcbmltcG9ydCBKYXBhbmVzZUFjY3VyYWN5VGVzdE1vZHVsZSwgeyBKYXBhbmVzZUFjY3VyYWN5VGVzdFJlc3VsdCB9IGZyb20gJy4vamFwYW5lc2UtYWNjdXJhY3ktdGVzdCc7XG5pbXBvcnQgU3RyZWFtaW5nUmVzcG9uc2VUZXN0TW9kdWxlLCB7IFN0cmVhbWluZ1Rlc3RSZXN1bHQgfSBmcm9tICcuL3N0cmVhbWluZy1yZXNwb25zZS10ZXN0JztcbmltcG9ydCBNdWx0aW1vZGFsSW5wdXRUZXN0TW9kdWxlLCB7IE11bHRpbW9kYWxUZXN0UmVzdWx0IH0gZnJvbSAnLi9tdWx0aW1vZGFsLWlucHV0LXRlc3QnO1xuXG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCB7IFRlc3RSZXN1bHQsIFRlc3RFeGVjdXRpb25TdGF0dXMgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuXG4vKipcbiAqIEFJ57Wx5ZCI44OG44K544OI57WQ5p6cXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQUlJbnRlZ3JhdGlvblRlc3RSZXN1bHQgZXh0ZW5kcyBUZXN0UmVzdWx0IHtcbiAgYWlUZXN0U3VtbWFyeT86IHtcbiAgICBub3ZhTW9kZWxUZXN0czogbnVtYmVyO1xuICAgIGphcGFuZXNlQWNjdXJhY3lTY29yZTogbnVtYmVyO1xuICAgIHN0cmVhbWluZ1BlcmZvcm1hbmNlOiBudW1iZXI7XG4gICAgbXVsdGltb2RhbENhcGFiaWxpdHk6IG51bWJlcjtcbiAgICBvdmVyYWxsQUlTY29yZTogbnVtYmVyO1xuICB9O1xuICBkZXRhaWxlZFJlc3VsdHM/OiB7XG4gICAgbm92YVJlc3VsdHM6IE5vdmFNb2RlbFRlc3RSZXN1bHRbXTtcbiAgICBqYXBhbmVzZVJlc3VsdHM6IEphcGFuZXNlQWNjdXJhY3lUZXN0UmVzdWx0W107XG4gICAgc3RyZWFtaW5nUmVzdWx0czogU3RyZWFtaW5nVGVzdFJlc3VsdFtdO1xuICAgIG11bHRpbW9kYWxSZXN1bHRzOiBNdWx0aW1vZGFsVGVzdFJlc3VsdFtdO1xuICB9O1xufVxuXG4vKipcbiAqIEFJ57Wx5ZCI44OG44K544OI44Op44Oz44OK44O844Kv44Op44K5XG4gKi9cbmV4cG9ydCBjbGFzcyBBSUludGVncmF0aW9uVGVzdFJ1bm5lciB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIG5vdmFUZXN0TW9kdWxlOiBOb3ZhTW9kZWxUZXN0TW9kdWxlO1xuICBwcml2YXRlIGphcGFuZXNlVGVzdE1vZHVsZTogSmFwYW5lc2VBY2N1cmFjeVRlc3RNb2R1bGU7XG4gIHByaXZhdGUgc3RyZWFtaW5nVGVzdE1vZHVsZTogU3RyZWFtaW5nUmVzcG9uc2VUZXN0TW9kdWxlO1xuICBwcml2YXRlIG11bHRpbW9kYWxUZXN0TW9kdWxlOiBNdWx0aW1vZGFsSW5wdXRUZXN0TW9kdWxlO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIFxuICAgIC8vIOWQhOODhuOCueODiOODouOCuOODpeODvOODq+OBruWIneacn+WMllxuICAgIHRoaXMubm92YVRlc3RNb2R1bGUgPSBuZXcgTm92YU1vZGVsVGVzdE1vZHVsZShjb25maWcpO1xuICAgIHRoaXMuamFwYW5lc2VUZXN0TW9kdWxlID0gbmV3IEphcGFuZXNlQWNjdXJhY3lUZXN0TW9kdWxlKGNvbmZpZyk7XG4gICAgdGhpcy5zdHJlYW1pbmdUZXN0TW9kdWxlID0gbmV3IFN0cmVhbWluZ1Jlc3BvbnNlVGVzdE1vZHVsZShjb25maWcpO1xuICAgIHRoaXMubXVsdGltb2RhbFRlc3RNb2R1bGUgPSBuZXcgTXVsdGltb2RhbElucHV0VGVzdE1vZHVsZShjb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIOWMheaLrOeahEFJ57Wx5ZCI44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBhc3luYyBydW5Db21wcmVoZW5zaXZlQUlUZXN0cygpOiBQcm9taXNlPEFJSW50ZWdyYXRpb25UZXN0UmVzdWx0PiB7XG4gICAgY29uc3QgdGVzdElkID0gJ2FpLWludGVncmF0aW9uLWNvbXByZWhlbnNpdmUtMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn6SWIOWMheaLrOeahEFJ57Wx5ZCI44OG44K544OI44KS6ZaL5aeLLi4uJyk7XG4gICAgY29uc29sZS5sb2coJz0nIC5yZXBlYXQoNjApKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhbGxSZXN1bHRzOiBhbnkgPSB7XG4gICAgICAgIG5vdmFSZXN1bHRzOiBbXSxcbiAgICAgICAgamFwYW5lc2VSZXN1bHRzOiBbXSxcbiAgICAgICAgc3RyZWFtaW5nUmVzdWx0czogW10sXG4gICAgICAgIG11bHRpbW9kYWxSZXN1bHRzOiBbXVxuICAgICAgfTtcblxuICAgICAgLy8gMS4gTm92YSDjg6Ljg4fjg6vjg5XjgqHjg5/jg6rjg7zjg4bjgrnjg4hcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OLIDEvNDogTm92YSDjg6Ljg4fjg6vjg5XjgqHjg5/jg6rjg7zjg4bjgrnjg4jlrp/ooYzkuK0uLi4nKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG5vdmFSZXN1bHRzID0gYXdhaXQgdGhpcy5ub3ZhVGVzdE1vZHVsZS5ydW5BbGxOb3ZhTW9kZWxUZXN0cygpO1xuICAgICAgICBhbGxSZXN1bHRzLm5vdmFSZXN1bHRzID0gbm92YVJlc3VsdHM7XG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUgTm92YSDjg6Ljg4fjg6vjg4bjgrnjg4jlrozkuoY6ICR7bm92YVJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGh9LyR7bm92YVJlc3VsdHMubGVuZ3RofSDmiJDlip9gKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBOb3ZhIOODouODh+ODq+ODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICAgIGFsbFJlc3VsdHMubm92YVJlc3VsdHMgPSBbXTtcbiAgICAgIH1cblxuICAgICAgLy8gMi4g5pel5pys6Kqe57K+5bqm44OG44K544OIXG4gICAgICBjb25zb2xlLmxvZygn8J+TiyAyLzQ6IOaXpeacrOiqnueyvuW6puODhuOCueODiOWun+ihjOS4rS4uLicpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgamFwYW5lc2VSZXN1bHQgPSBhd2FpdCB0aGlzLmphcGFuZXNlVGVzdE1vZHVsZS50ZXN0Q29tcHJlaGVuc2l2ZUphcGFuZXNlQWNjdXJhY3koKTtcbiAgICAgICAgYWxsUmVzdWx0cy5qYXBhbmVzZVJlc3VsdHMgPSBbamFwYW5lc2VSZXN1bHRdO1xuICAgICAgICBjb25zb2xlLmxvZyhg4pyFIOaXpeacrOiqnueyvuW6puODhuOCueODiOWujOS6hjogJHtqYXBhbmVzZVJlc3VsdC5zdWNjZXNzID8gJ+aIkOWKnycgOiAn5aSx5pWXJ31gKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDml6XmnKzoqp7nsr7luqbjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgICBhbGxSZXN1bHRzLmphcGFuZXNlUmVzdWx0cyA9IFtdO1xuICAgICAgfVxuXG4gICAgICAvLyAzLiDjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg6zjgrnjg53jg7Pjgrnjg4bjgrnjg4hcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OLIDMvNDog44K544OI44Oq44O844Of44Oz44Kw44Os44K544Od44Oz44K544OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdHJlYW1pbmdSZXN1bHQgPSBhd2FpdCB0aGlzLnN0cmVhbWluZ1Rlc3RNb2R1bGUudGVzdENvbXByZWhlbnNpdmVTdHJlYW1pbmcoKTtcbiAgICAgICAgYWxsUmVzdWx0cy5zdHJlYW1pbmdSZXN1bHRzID0gW3N0cmVhbWluZ1Jlc3VsdF07XG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUg44K544OI44Oq44O844Of44Oz44Kw44OG44K544OI5a6M5LqGOiAke3N0cmVhbWluZ1Jlc3VsdC5zdWNjZXNzID8gJ+aIkOWKnycgOiAn5aSx5pWXJ31gKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgICBhbGxSZXN1bHRzLnN0cmVhbWluZ1Jlc3VsdHMgPSBbXTtcbiAgICAgIH1cblxuICAgICAgLy8gNC4g44Oe44Or44OB44Oi44O844OA44Or5YWl5Yqb44OG44K544OIXG4gICAgICBjb25zb2xlLmxvZygn8J+TiyA0LzQ6IOODnuODq+ODgeODouODvOODgOODq+WFpeWKm+ODhuOCueODiOWun+ihjOS4rS4uLicpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbXVsdGltb2RhbFJlc3VsdCA9IGF3YWl0IHRoaXMubXVsdGltb2RhbFRlc3RNb2R1bGUudGVzdENvbXByZWhlbnNpdmVNdWx0aW1vZGFsKCk7XG4gICAgICAgIGFsbFJlc3VsdHMubXVsdGltb2RhbFJlc3VsdHMgPSBbbXVsdGltb2RhbFJlc3VsdF07XG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUg44Oe44Or44OB44Oi44O844OA44Or44OG44K544OI5a6M5LqGOiAke211bHRpbW9kYWxSZXN1bHQuc3VjY2VzcyA/ICfmiJDlip8nIDogJ+WkseaVlyd9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg44Oe44Or44OB44Oi44O844OA44Or44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgICAgYWxsUmVzdWx0cy5tdWx0aW1vZGFsUmVzdWx0cyA9IFtdO1xuICAgICAgfVxuXG4gICAgICAvLyDnt4/lkIjoqZXkvqHjga7oqIjnrpdcbiAgICAgIGNvbnN0IGFpVGVzdFN1bW1hcnkgPSB0aGlzLmNhbGN1bGF0ZUFJVGVzdFN1bW1hcnkoYWxsUmVzdWx0cyk7XG4gICAgICBcbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhaVRlc3RTdW1tYXJ5Lm92ZXJhbGxBSVNjb3JlID49IDAuODU7IC8vIDg1JeS7peS4iuOBp+aIkOWKn1xuXG4gICAgICBjb25zdCByZXN1bHQ6IEFJSW50ZWdyYXRpb25UZXN0UmVzdWx0ID0ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn5YyF5ous55qEQUnntbHlkIjjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FpLWludGVncmF0aW9uJyxcbiAgICAgICAgc3RhdHVzOiBzdWNjZXNzID8gVGVzdEV4ZWN1dGlvblN0YXR1cy5DT01QTEVURUQgOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgYWlUZXN0U3VtbWFyeSxcbiAgICAgICAgZGV0YWlsZWRSZXN1bHRzOiBhbGxSZXN1bHRzLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHRlc3RNb2R1bGVzOiBbJ25vdmEtbW9kZWxzJywgJ2phcGFuZXNlLWFjY3VyYWN5JywgJ3N0cmVhbWluZycsICdtdWx0aW1vZGFsJ10sXG4gICAgICAgICAgdGFyZ2V0U2NvcmU6IDAuODUsXG4gICAgICAgICAgYWN0dWFsU2NvcmU6IGFpVGVzdFN1bW1hcnkub3ZlcmFsbEFJU2NvcmVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc29sZS5sb2coJz0nIC5yZXBlYXQoNjApKTtcbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn46JIOWMheaLrOeahEFJ57Wx5ZCI44OG44K544OI5oiQ5YqfICjnt4/lkIjjgrnjgrPjgqI6ICR7KGFpVGVzdFN1bW1hcnkub3ZlcmFsbEFJU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JSlgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCDljIXmi6znmoRBSee1seWQiOODhuOCueODiOWkseaVlyAo57eP5ZCI44K544Kz44KiOiAkeyhhaVRlc3RTdW1tYXJ5Lm92ZXJhbGxBSVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSUpYCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOWMheaLrOeahEFJ57Wx5ZCI44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ+WMheaLrOeahEFJ57Wx5ZCI44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhaS1pbnRlZ3JhdGlvbicsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBSSDjg4bjgrnjg4jjgrXjg57jg6rjg7zjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlQUlUZXN0U3VtbWFyeShyZXN1bHRzOiBhbnkpOiB7XG4gICAgbm92YU1vZGVsVGVzdHM6IG51bWJlcjtcbiAgICBqYXBhbmVzZUFjY3VyYWN5U2NvcmU6IG51bWJlcjtcbiAgICBzdHJlYW1pbmdQZXJmb3JtYW5jZTogbnVtYmVyO1xuICAgIG11bHRpbW9kYWxDYXBhYmlsaXR5OiBudW1iZXI7XG4gICAgb3ZlcmFsbEFJU2NvcmU6IG51bWJlcjtcbiAgfSB7XG4gICAgLy8gTm92YSDjg6Ljg4fjg6vjg4bjgrnjg4jjgrnjgrPjgqJcbiAgICBjb25zdCBub3ZhU3VjY2Vzc1JhdGUgPSByZXN1bHRzLm5vdmFSZXN1bHRzLmxlbmd0aCA+IDAgPyBcbiAgICAgIHJlc3VsdHMubm92YVJlc3VsdHMuZmlsdGVyKChyOiBhbnkpID0+IHIuc3VjY2VzcykubGVuZ3RoIC8gcmVzdWx0cy5ub3ZhUmVzdWx0cy5sZW5ndGggOiAwO1xuXG4gICAgLy8g5pel5pys6Kqe57K+5bqm44K544Kz44KiXG4gICAgY29uc3QgamFwYW5lc2VTY29yZSA9IHJlc3VsdHMuamFwYW5lc2VSZXN1bHRzLmxlbmd0aCA+IDAgJiYgcmVzdWx0cy5qYXBhbmVzZVJlc3VsdHNbMF0uYWNjdXJhY3lNZXRyaWNzID8gXG4gICAgICByZXN1bHRzLmphcGFuZXNlUmVzdWx0c1swXS5hY2N1cmFjeU1ldHJpY3Mub3ZlcmFsbEFjY3VyYWN5IDogMDtcblxuICAgIC8vIOOCueODiOODquODvOODn+ODs+OCsOODkeODleOCqeODvOODnuODs+OCueOCueOCs+OColxuICAgIGNvbnN0IHN0cmVhbWluZ1Njb3JlID0gcmVzdWx0cy5zdHJlYW1pbmdSZXN1bHRzLmxlbmd0aCA+IDAgJiYgcmVzdWx0cy5zdHJlYW1pbmdSZXN1bHRzWzBdLnF1YWxpdHlNZXRyaWNzID8gXG4gICAgICByZXN1bHRzLnN0cmVhbWluZ1Jlc3VsdHNbMF0ucXVhbGl0eU1ldHJpY3MucmVhbFRpbWVTY29yZSA6IDA7XG5cbiAgICAvLyDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vog73lipvjgrnjgrPjgqJcbiAgICBjb25zdCBtdWx0aW1vZGFsU2NvcmUgPSByZXN1bHRzLm11bHRpbW9kYWxSZXN1bHRzLmxlbmd0aCA+IDAgJiYgcmVzdWx0cy5tdWx0aW1vZGFsUmVzdWx0c1swXS5tb2RhbGl0eU1ldHJpY3MgPyBcbiAgICAgIHJlc3VsdHMubXVsdGltb2RhbFJlc3VsdHNbMF0ubW9kYWxpdHlNZXRyaWNzLmludGVncmF0aW9uUXVhbGl0eSA6IDA7XG5cbiAgICAvLyDph43jgb/ku5jjgY3nt4/lkIjjgrnjgrPjgqJcbiAgICBjb25zdCB3ZWlnaHRzID0ge1xuICAgICAgbm92YTogMC4zLCAgICAgIC8vIE5vdmEg44Oi44OH44OrOiAzMCVcbiAgICAgIGphcGFuZXNlOiAwLjMsICAvLyDml6XmnKzoqp7nsr7luqY6IDMwJVxuICAgICAgc3RyZWFtaW5nOiAwLjIsIC8vIOOCueODiOODquODvOODn+ODs+OCsDogMjAlXG4gICAgICBtdWx0aW1vZGFsOiAwLjIgLy8g44Oe44Or44OB44Oi44O844OA44OrOiAyMCVcbiAgICB9O1xuXG4gICAgY29uc3Qgb3ZlcmFsbFNjb3JlID0gKFxuICAgICAgbm92YVN1Y2Nlc3NSYXRlICogd2VpZ2h0cy5ub3ZhICtcbiAgICAgIGphcGFuZXNlU2NvcmUgKiB3ZWlnaHRzLmphcGFuZXNlICtcbiAgICAgIHN0cmVhbWluZ1Njb3JlICogd2VpZ2h0cy5zdHJlYW1pbmcgK1xuICAgICAgbXVsdGltb2RhbFNjb3JlICogd2VpZ2h0cy5tdWx0aW1vZGFsXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBub3ZhTW9kZWxUZXN0czogbm92YVN1Y2Nlc3NSYXRlLFxuICAgICAgamFwYW5lc2VBY2N1cmFjeVNjb3JlOiBqYXBhbmVzZVNjb3JlLFxuICAgICAgc3RyZWFtaW5nUGVyZm9ybWFuY2U6IHN0cmVhbWluZ1Njb3JlLFxuICAgICAgbXVsdGltb2RhbENhcGFiaWxpdHk6IG11bHRpbW9kYWxTY29yZSxcbiAgICAgIG92ZXJhbGxBSVNjb3JlOiBvdmVyYWxsU2NvcmVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOips+e0sOODrOODneODvOODiOOBrueUn+aIkFxuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVEZXRhaWxlZEFJUmVwb3J0KHJlc3VsdDogQUlJbnRlZ3JhdGlvblRlc3RSZXN1bHQpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBcbiAgICBsZXQgcmVwb3J0ID0gYCMgQUnntbHlkIjjg4bjgrnjg4joqbPntLDjg6zjg53jg7zjg4hcXG5cXG5gO1xuICAgIHJlcG9ydCArPSBgKirlrp/ooYzml6XmmYIqKjogJHt0aW1lc3RhbXB9XFxuYDtcbiAgICByZXBvcnQgKz0gYCoq44OG44K544OI55Kw5aKDKio6IEFXU+adseS6rOODquODvOOCuOODp+ODs+acrOeVqueSsOWigyAoJHt0aGlzLmNvbmZpZy5yZWdpb259KVxcbmA7XG4gICAgcmVwb3J0ICs9IGAqKue3j+WQiOOCueOCs+OCoioqOiAkeyhyZXN1bHQuYWlUZXN0U3VtbWFyeT8ub3ZlcmFsbEFJU2NvcmUgfHwgMCAqIDEwMCkudG9GaXhlZCgxKX0lXFxuXFxuYDtcblxuICAgIC8vIE5vdmEg44Oi44OH44Or44OG44K544OI57WQ5p6cXG4gICAgaWYgKHJlc3VsdC5kZXRhaWxlZFJlc3VsdHM/Lm5vdmFSZXN1bHRzKSB7XG4gICAgICByZXBvcnQgKz0gYCMjIE5vdmEg44Oi44OH44Or44OV44Kh44Of44Oq44O844OG44K544OI57WQ5p6cXFxuXFxuYDtcbiAgICAgIGZvciAoY29uc3Qgbm92YVJlc3VsdCBvZiByZXN1bHQuZGV0YWlsZWRSZXN1bHRzLm5vdmFSZXN1bHRzKSB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IG5vdmFSZXN1bHQuc3VjY2VzcyA/ICfinIUg5oiQ5YqfJyA6ICfinYwg5aSx5pWXJztcbiAgICAgICAgcmVwb3J0ICs9IGAjIyMgJHtub3ZhUmVzdWx0LnRlc3ROYW1lfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuOCueODhuODvOOCv+OCuSoqOiAke3N0YXR1c31cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKirlrp/ooYzmmYLplpMqKjogJHtub3ZhUmVzdWx0LmR1cmF0aW9ufW1zXFxuYDtcbiAgICAgICAgXG4gICAgICAgIGlmIChub3ZhUmVzdWx0Lm1vZGVsRGV0YWlscykge1xuICAgICAgICAgIHJlcG9ydCArPSBgLSAqKuODouODh+ODqyoqOiAke25vdmFSZXN1bHQubW9kZWxEZXRhaWxzLm1vZGVsTmFtZX0gKCR7bm92YVJlc3VsdC5tb2RlbERldGFpbHMubW9kZWxJZH0pXFxuYDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG5vdmFSZXN1bHQucGVyZm9ybWFuY2VNZXRyaWNzKSB7XG4gICAgICAgICAgcmVwb3J0ICs9IGAtICoq5b+c562U5pmC6ZaTKio6ICR7bm92YVJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3MucmVzcG9uc2VUaW1lfW1zXFxuYDtcbiAgICAgICAgICByZXBvcnQgKz0gYC0gKirjgrnjg6vjg7zjg5fjg4Pjg4gqKjogJHtub3ZhUmVzdWx0LnBlcmZvcm1hbmNlTWV0cmljcy50b2tlbnNQZXJTZWNvbmQudG9GaXhlZCgxKX0gdG9rZW5zL3NlY1xcbmA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJlcG9ydCArPSBgXFxuYDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDml6XmnKzoqp7nsr7luqbjg4bjgrnjg4jntZDmnpxcbiAgICBpZiAocmVzdWx0LmRldGFpbGVkUmVzdWx0cz8uamFwYW5lc2VSZXN1bHRzICYmIHJlc3VsdC5kZXRhaWxlZFJlc3VsdHMuamFwYW5lc2VSZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGphcGFuZXNlUmVzdWx0ID0gcmVzdWx0LmRldGFpbGVkUmVzdWx0cy5qYXBhbmVzZVJlc3VsdHNbMF07XG4gICAgICByZXBvcnQgKz0gYCMjIOaXpeacrOiqnueyvuW6puODhuOCueODiOe1kOaenFxcblxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirnt4/lkIjnsr7luqYqKjogJHsoamFwYW5lc2VSZXN1bHQuYWNjdXJhY3lNZXRyaWNzPy5vdmVyYWxsQWNjdXJhY3kgfHwgMCAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgIHJlcG9ydCArPSBgLSAqKuaWh+azleeyvuW6pioqOiAkeyhqYXBhbmVzZVJlc3VsdC5hY2N1cmFjeU1ldHJpY3M/LmdyYW1tYXJBY2N1cmFjeSB8fCAwICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq6Kqe5b2Z57K+5bqmKio6ICR7KGphcGFuZXNlUmVzdWx0LmFjY3VyYWN5TWV0cmljcz8udm9jYWJ1bGFyeUFjY3VyYWN5IHx8IDAgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirmlazoqp7nsr7luqYqKjogJHsoamFwYW5lc2VSZXN1bHQuYWNjdXJhY3lNZXRyaWNzPy5mb3JtYWxpdHlBY2N1cmFjeSB8fCAwICogMTAwKS50b0ZpeGVkKDEpfSVcXG5cXG5gO1xuICAgIH1cblxuICAgIC8vIOOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiOe1kOaenFxuICAgIGlmIChyZXN1bHQuZGV0YWlsZWRSZXN1bHRzPy5zdHJlYW1pbmdSZXN1bHRzICYmIHJlc3VsdC5kZXRhaWxlZFJlc3VsdHMuc3RyZWFtaW5nUmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBzdHJlYW1pbmdSZXN1bHQgPSByZXN1bHQuZGV0YWlsZWRSZXN1bHRzLnN0cmVhbWluZ1Jlc3VsdHNbMF07XG4gICAgICByZXBvcnQgKz0gYCMjIOOCueODiOODquODvOODn+ODs+OCsOODrOOCueODneODs+OCueODhuOCueODiOe1kOaenFxcblxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirliJ3lm57jg4jjg7zjgq/jg7Pjg6zjgqTjg4bjg7PjgrcqKjogJHtzdHJlYW1pbmdSZXN1bHQuc3RyZWFtaW5nTWV0cmljcz8uZmlyc3RUb2tlbkxhdGVuY3kgfHwgMH1tc1xcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirlubPlnYfjg6zjgqTjg4bjg7PjgrcqKjogJHtzdHJlYW1pbmdSZXN1bHQuc3RyZWFtaW5nTWV0cmljcz8uYXZlcmFnZVRva2VuTGF0ZW5jeSB8fCAwfW1zXFxuYDtcbiAgICAgIHJlcG9ydCArPSBgLSAqKuOCueODq+ODvOODl+ODg+ODiCoqOiAke3N0cmVhbWluZ1Jlc3VsdC5zdHJlYW1pbmdNZXRyaWNzPy50aHJvdWdocHV0IHx8IDB9IHRva2Vucy9zZWNcXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq44Oq44Ki44Or44K/44Kk44Og44K544Kz44KiKio6ICR7KHN0cmVhbWluZ1Jlc3VsdC5xdWFsaXR5TWV0cmljcz8ucmVhbFRpbWVTY29yZSB8fCAwICogMTAwKS50b0ZpeGVkKDEpfSVcXG5cXG5gO1xuICAgIH1cblxuICAgIC8vIOODnuODq+ODgeODouODvOODgOODq+ODhuOCueODiOe1kOaenFxuICAgIGlmIChyZXN1bHQuZGV0YWlsZWRSZXN1bHRzPy5tdWx0aW1vZGFsUmVzdWx0cyAmJiByZXN1bHQuZGV0YWlsZWRSZXN1bHRzLm11bHRpbW9kYWxSZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IG11bHRpbW9kYWxSZXN1bHQgPSByZXN1bHQuZGV0YWlsZWRSZXN1bHRzLm11bHRpbW9kYWxSZXN1bHRzWzBdO1xuICAgICAgcmVwb3J0ICs9IGAjIyDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vlhaXlipvjg4bjgrnjg4jntZDmnpxcXG5cXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq44OG44Kt44K544OI5Yem55CG57K+5bqmKio6ICR7KG11bHRpbW9kYWxSZXN1bHQubW9kYWxpdHlNZXRyaWNzPy50ZXh0UHJvY2Vzc2luZ0FjY3VyYWN5IHx8IDAgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirnlLvlg4/lh6bnkIbnsr7luqYqKjogJHsobXVsdGltb2RhbFJlc3VsdC5tb2RhbGl0eU1ldHJpY3M/LmltYWdlUHJvY2Vzc2luZ0FjY3VyYWN5IHx8IDAgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirntbHlkIjlk4Hos6oqKjogJHsobXVsdGltb2RhbFJlc3VsdC5tb2RhbGl0eU1ldHJpY3M/LmludGVncmF0aW9uUXVhbGl0eSB8fCAwICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq5b+c562U6Zai6YCj5oCnKio6ICR7KG11bHRpbW9kYWxSZXN1bHQubW9kYWxpdHlNZXRyaWNzPy5yZXNwb25zZVJlbGV2YW5jZSB8fCAwICogMTAwKS50b0ZpeGVkKDEpfSVcXG5cXG5gO1xuICAgIH1cblxuICAgIHJldHVybiByZXBvcnQ7XG4gIH1cblxuICAvKipcbiAgICog44Oq44K944O844K544Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAqL1xuICBhc3luYyBjbGVhbnVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn6e5IEFJ57Wx5ZCI44OG44K544OI44Op44Oz44OK44O844KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5ub3ZhVGVzdE1vZHVsZS5jbGVhbnVwKCksXG4gICAgICB0aGlzLmphcGFuZXNlVGVzdE1vZHVsZS5jbGVhbnVwKCksXG4gICAgICB0aGlzLnN0cmVhbWluZ1Rlc3RNb2R1bGUuY2xlYW51cCgpLFxuICAgICAgdGhpcy5tdWx0aW1vZGFsVGVzdE1vZHVsZS5jbGVhbnVwKClcbiAgICBdKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygn4pyFIEFJ57Wx5ZCI44OG44K544OI44Op44Oz44OK44O844Gu44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQUlJbnRlZ3JhdGlvblRlc3RSdW5uZXI7Il19