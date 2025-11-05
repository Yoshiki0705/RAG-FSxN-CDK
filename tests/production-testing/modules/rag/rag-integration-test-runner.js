"use strict";
/**
 * RAG統合テストランナー
 *
 * ベクトル検索、検索統合、コンテキスト維持、権限フィルタリングテストを統合実行
 * 実本番環境でのRAG機能包括検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGIntegrationTestRunner = void 0;
const vector_search_test_1 = __importDefault(require("./vector-search-test"));
const search_integration_test_1 = __importDefault(require("./search-integration-test"));
const context_persistence_test_1 = __importDefault(require("./context-persistence-test"));
const permission_filtering_test_1 = __importDefault(require("./permission-filtering-test"));
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * RAG統合テストランナークラス
 */
class RAGIntegrationTestRunner {
    config;
    vectorSearchModule;
    searchIntegrationModule;
    contextPersistenceModule;
    permissionFilteringModule;
    constructor(config) {
        this.config = config;
        // 各テストモジュールの初期化
        this.vectorSearchModule = new vector_search_test_1.default(config);
        this.searchIntegrationModule = new search_integration_test_1.default(config);
        this.contextPersistenceModule = new context_persistence_test_1.default(config);
        this.permissionFilteringModule = new permission_filtering_test_1.default(config);
    }
    /**
     * 包括的RAG統合テストの実行
     */
    async runComprehensiveRAGTests() {
        const testId = 'rag-integration-comprehensive-001';
        const startTime = Date.now();
        console.log('🔍 包括的RAG統合テストを開始...');
        console.log('='.repeat(60));
        try {
            const allResults = {
                vectorSearchResults: [],
                searchIntegrationResults: [],
                contextPersistenceResults: [],
                permissionFilteringResults: []
            };
            // 1. ベクトル検索テスト
            console.log('📋 1/4: ベクトル検索テスト実行中...');
            try {
                const vectorSearchResult = await this.vectorSearchModule.testComprehensiveVectorSearch();
                allResults.vectorSearchResults = [vectorSearchResult];
                console.log(`✅ ベクトル検索テスト完了: ${vectorSearchResult.success ? '成功' : '失敗'}`);
            }
            catch (error) {
                console.error('❌ ベクトル検索テスト実行エラー:', error);
                allResults.vectorSearchResults = [];
            }
            // 2. 検索統合テスト
            console.log('📋 2/4: 検索統合テスト実行中...');
            try {
                const searchIntegrationResult = await this.searchIntegrationModule.testComprehensiveSearchIntegration();
                allResults.searchIntegrationResults = [searchIntegrationResult];
                console.log(`✅ 検索統合テスト完了: ${searchIntegrationResult.success ? '成功' : '失敗'}`);
            }
            catch (error) {
                console.error('❌ 検索統合テスト実行エラー:', error);
                allResults.searchIntegrationResults = [];
            }
            // 3. コンテキスト維持テスト
            console.log('📋 3/4: コンテキスト維持テスト実行中...');
            try {
                const contextPersistenceResult = await this.contextPersistenceModule.testComprehensiveContextPersistence();
                allResults.contextPersistenceResults = [contextPersistenceResult];
                console.log(`✅ コンテキスト維持テスト完了: ${contextPersistenceResult.success ? '成功' : '失敗'}`);
            }
            catch (error) {
                console.error('❌ コンテキスト維持テスト実行エラー:', error);
                allResults.contextPersistenceResults = [];
            }
            // 4. 権限フィルタリングテスト
            console.log('📋 4/4: 権限フィルタリングテスト実行中...');
            try {
                const permissionFilteringResult = await this.permissionFilteringModule.testComprehensivePermissionFiltering();
                allResults.permissionFilteringResults = [permissionFilteringResult];
                console.log(`✅ 権限フィルタリングテスト完了: ${permissionFilteringResult.success ? '成功' : '失敗'}`);
            }
            catch (error) {
                console.error('❌ 権限フィルタリングテスト実行エラー:', error);
                allResults.permissionFilteringResults = [];
            }
            // 総合評価の計算
            const ragTestSummary = this.calculateRAGTestSummary(allResults);
            const success = ragTestSummary.overallRAGScore >= 0.85; // 85%以上で成功
            const result = {
                testId,
                testName: '包括的RAG統合テスト',
                category: 'rag-integration',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                ragTestSummary,
                detailedResults: allResults,
                metadata: {
                    testModules: ['vector-search', 'search-integration', 'context-persistence', 'permission-filtering'],
                    targetScore: 0.85,
                    actualScore: ragTestSummary.overallRAGScore
                }
            };
            console.log('='.repeat(60));
            if (success) {
                console.log(`🎉 包括的RAG統合テスト成功 (総合スコア: ${(ragTestSummary.overallRAGScore * 100).toFixed(1)}%)`);
            }
            else {
                console.error(`❌ 包括的RAG統合テスト失敗 (総合スコア: ${(ragTestSummary.overallRAGScore * 100).toFixed(1)}%)`);
            }
            return result;
        }
        catch (error) {
            console.error('❌ 包括的RAG統合テスト実行エラー:', error);
            return {
                testId,
                testName: '包括的RAG統合テスト',
                category: 'rag-integration',
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
     * RAG テストサマリーの計算
     */
    calculateRAGTestSummary(results) {
        // ベクトル検索スコア
        const vectorSearchScore = results.vectorSearchResults.length > 0 && results.vectorSearchResults[0].searchMetrics ?
            results.vectorSearchResults[0].searchMetrics.relevanceScore : 0;
        // 検索統合スコア
        const searchIntegrationScore = results.searchIntegrationResults.length > 0 && results.searchIntegrationResults[0].ragQuality ?
            results.searchIntegrationResults[0].ragQuality.overallRAGScore : 0;
        // コンテキスト維持スコア
        const contextPersistenceScore = results.contextPersistenceResults.length > 0 && results.contextPersistenceResults[0].contextMetrics ?
            results.contextPersistenceResults[0].contextMetrics.sessionContinuity : 0;
        // 権限フィルタリングスコア
        const permissionFilteringScore = results.permissionFilteringResults.length > 0 && results.permissionFilteringResults[0].permissionMetrics ?
            results.permissionFilteringResults[0].permissionMetrics.accessControlAccuracy : 0;
        // 重み付き総合スコア
        const weights = {
            vectorSearch: 0.25, // ベクトル検索: 25%
            searchIntegration: 0.35, // 検索統合: 35%
            contextPersistence: 0.20, // コンテキスト維持: 20%
            permissionFiltering: 0.20 // 権限フィルタリング: 20%
        };
        const overallScore = (vectorSearchScore * weights.vectorSearch +
            searchIntegrationScore * weights.searchIntegration +
            contextPersistenceScore * weights.contextPersistence +
            permissionFilteringScore * weights.permissionFiltering);
        return {
            vectorSearchScore,
            searchIntegrationScore,
            contextPersistenceScore,
            permissionFilteringScore,
            overallRAGScore: overallScore
        };
    }
    /**
     * 詳細レポートの生成
     */
    async generateDetailedRAGReport(result) {
        const timestamp = new Date().toISOString();
        let report = `# RAG統合テスト詳細レポート\n\n`;
        report += `**実行日時**: ${timestamp}\n`;
        report += `**テスト環境**: AWS東京リージョン本番環境 (${this.config.region})\n`;
        report += `**総合スコア**: ${(result.ragTestSummary?.overallRAGScore || 0 * 100).toFixed(1)}%\n\n`;
        // ベクトル検索テスト結果
        if (result.detailedResults?.vectorSearchResults && result.detailedResults.vectorSearchResults.length > 0) {
            const vectorResult = result.detailedResults.vectorSearchResults[0];
            report += `## ベクトル検索テスト結果\n\n`;
            report += `- **ステータス**: ${vectorResult.success ? '✅ 成功' : '❌ 失敗'}\n`;
            report += `- **実行時間**: ${vectorResult.duration}ms\n`;
            if (vectorResult.searchMetrics) {
                report += `- **応答時間**: ${vectorResult.searchMetrics.responseTime.toFixed(0)}ms\n`;
                report += `- **関連性スコア**: ${(vectorResult.searchMetrics.relevanceScore * 100).toFixed(1)}%\n`;
                report += `- **精度@5**: ${(vectorResult.searchMetrics.precisionAt5 * 100).toFixed(1)}%\n`;
                report += `- **再現率**: ${(vectorResult.searchMetrics.recallScore * 100).toFixed(1)}%\n`;
            }
            if (vectorResult.qualityMetrics) {
                report += `- **意味的精度**: ${(vectorResult.qualityMetrics.semanticAccuracy * 100).toFixed(1)}%\n`;
                report += `- **文脈関連性**: ${(vectorResult.qualityMetrics.contextualRelevance * 100).toFixed(1)}%\n`;
            }
            report += `\n`;
        }
        // 検索統合テスト結果
        if (result.detailedResults?.searchIntegrationResults && result.detailedResults.searchIntegrationResults.length > 0) {
            const integrationResult = result.detailedResults.searchIntegrationResults[0];
            report += `## 検索統合テスト結果\n\n`;
            report += `- **ステータス**: ${integrationResult.success ? '✅ 成功' : '❌ 失敗'}\n`;
            report += `- **実行時間**: ${integrationResult.duration}ms\n`;
            if (integrationResult.integrationMetrics) {
                report += `- **検索精度**: ${(integrationResult.integrationMetrics.searchAccuracy * 100).toFixed(1)}%\n`;
                report += `- **応答関連性**: ${(integrationResult.integrationMetrics.responseRelevance * 100).toFixed(1)}%\n`;
                report += `- **ソース帰属**: ${(integrationResult.integrationMetrics.sourceAttribution * 100).toFixed(1)}%\n`;
                report += `- **一貫性スコア**: ${(integrationResult.integrationMetrics.coherenceScore * 100).toFixed(1)}%\n`;
            }
            if (integrationResult.ragQuality) {
                report += `- **検索品質**: ${(integrationResult.ragQuality.retrievalQuality * 100).toFixed(1)}%\n`;
                report += `- **生成品質**: ${(integrationResult.ragQuality.generationQuality * 100).toFixed(1)}%\n`;
                report += `- **拡張効果**: ${(integrationResult.ragQuality.augmentationEffectiveness * 100).toFixed(1)}%\n`;
            }
            report += `\n`;
        }
        // コンテキスト維持テスト結果
        if (result.detailedResults?.contextPersistenceResults && result.detailedResults.contextPersistenceResults.length > 0) {
            const contextResult = result.detailedResults.contextPersistenceResults[0];
            report += `## コンテキスト維持テスト結果\n\n`;
            report += `- **ステータス**: ${contextResult.success ? '✅ 成功' : '❌ 失敗'}\n`;
            report += `- **実行時間**: ${contextResult.duration}ms\n`;
            if (contextResult.contextMetrics) {
                report += `- **セッション継続性**: ${(contextResult.contextMetrics.sessionContinuity * 100).toFixed(1)}%\n`;
                report += `- **コンテキスト保持**: ${(contextResult.contextMetrics.contextRetention * 100).toFixed(1)}%\n`;
                report += `- **会話一貫性**: ${(contextResult.contextMetrics.conversationCoherence * 100).toFixed(1)}%\n`;
                report += `- **メモリ効率**: ${(contextResult.contextMetrics.memoryEfficiency * 100).toFixed(1)}%\n`;
            }
            if (contextResult.sessionAnalysis) {
                report += `- **平均セッション長**: ${contextResult.sessionAnalysis.averageSessionLength.toFixed(1)}メッセージ\n`;
                report += `- **コンテキスト切替精度**: ${(contextResult.sessionAnalysis.contextSwitchAccuracy * 100).toFixed(1)}%\n`;
            }
            report += `\n`;
        }
        // 権限フィルタリングテスト結果
        if (result.detailedResults?.permissionFilteringResults && result.detailedResults.permissionFilteringResults.length > 0) {
            const permissionResult = result.detailedResults.permissionFilteringResults[0];
            report += `## 権限フィルタリングテスト結果\n\n`;
            report += `- **ステータス**: ${permissionResult.success ? '✅ 成功' : '❌ 失敗'}\n`;
            report += `- **実行時間**: ${permissionResult.duration}ms\n`;
            if (permissionResult.permissionMetrics) {
                report += `- **アクセス制御精度**: ${(permissionResult.permissionMetrics.accessControlAccuracy * 100).toFixed(1)}%\n`;
                report += `- **不正アクセスブロック**: ${(permissionResult.permissionMetrics.unauthorizedBlocking * 100).toFixed(1)}%\n`;
                report += `- **正当アクセス許可**: ${(permissionResult.permissionMetrics.authorizedAccess * 100).toFixed(1)}%\n`;
                report += `- **ロールベースフィルタリング**: ${(permissionResult.permissionMetrics.roleBasedFiltering * 100).toFixed(1)}%\n`;
            }
            if (permissionResult.securityAnalysis) {
                report += `- **データ漏洩防止**: ${(permissionResult.securityAnalysis.dataLeakagePrevention * 100).toFixed(1)}%\n`;
                report += `- **権限昇格防止**: ${(permissionResult.securityAnalysis.privilegeEscalationPrevention * 100).toFixed(1)}%\n`;
                report += `- **監査証跡完全性**: ${(permissionResult.securityAnalysis.auditTrailCompleteness * 100).toFixed(1)}%\n`;
            }
            report += `\n`;
        }
        return report;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 RAG統合テストランナーをクリーンアップ中...');
        await Promise.all([
            this.vectorSearchModule.cleanup(),
            this.searchIntegrationModule.cleanup(),
            this.contextPersistenceModule.cleanup(),
            this.permissionFilteringModule.cleanup()
        ]);
        console.log('✅ RAG統合テストランナーのクリーンアップ完了');
    }
}
exports.RAGIntegrationTestRunner = RAGIntegrationTestRunner;
exports.default = RAGIntegrationTestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFnLWludGVncmF0aW9uLXRlc3QtcnVubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmFnLWludGVncmF0aW9uLXRlc3QtcnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7Ozs7O0FBRUgsOEVBQXNGO0FBQ3RGLHdGQUFxRztBQUNyRywwRkFBd0c7QUFDeEcsNEZBQTJHO0FBRzNHLDhFQUFvRjtBQXFCcEY7O0dBRUc7QUFDSCxNQUFhLHdCQUF3QjtJQUMzQixNQUFNLENBQW1CO0lBQ3pCLGtCQUFrQixDQUF5QjtJQUMzQyx1QkFBdUIsQ0FBOEI7SUFDckQsd0JBQXdCLENBQStCO0lBQ3ZELHlCQUF5QixDQUFnQztJQUVqRSxZQUFZLE1BQXdCO1FBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXJCLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSw0QkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxpQ0FBMkIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2RSxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxrQ0FBNEIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RSxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxtQ0FBNkIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsd0JBQXdCO1FBQzVCLE1BQU0sTUFBTSxHQUFHLG1DQUFtQyxDQUFDO1FBQ25ELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUU3QixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFN0IsSUFBSSxDQUFD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QUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FDRjtBQXpTRCw0REF5U0M7QUFFRCxrQkFBZSx3QkFBd0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUkFH57Wx5ZCI44OG44K544OI44Op44Oz44OK44O8XG4gKiBcbiAqIOODmeOCr+ODiOODq+aknOe0ouOAgeaknOe0oue1seWQiOOAgeOCs+ODs+ODhuOCreOCueODiOe2reaMgeOAgeaoqemZkOODleOCo+ODq+OCv+ODquODs+OCsOODhuOCueODiOOCkue1seWQiOWun+ihjFxuICog5a6f5pys55Wq55Kw5aKD44Gn44GuUkFH5qmf6IO95YyF5ous5qSc6Ki8XG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgVmVjdG9yU2VhcmNoVGVzdE1vZHVsZSwgeyBWZWN0b3JTZWFyY2hUZXN0UmVzdWx0IH0gZnJvbSAnLi92ZWN0b3Itc2VhcmNoLXRlc3QnO1xuaW1wb3J0IFNlYXJjaEludGVncmF0aW9uVGVzdE1vZHVsZSwgeyBTZWFyY2hJbnRlZ3JhdGlvblRlc3RSZXN1bHQgfSBmcm9tICcuL3NlYXJjaC1pbnRlZ3JhdGlvbi10ZXN0JztcbmltcG9ydCBDb250ZXh0UGVyc2lzdGVuY2VUZXN0TW9kdWxlLCB7IENvbnRleHRQZXJzaXN0ZW5jZVRlc3RSZXN1bHQgfSBmcm9tICcuL2NvbnRleHQtcGVyc2lzdGVuY2UtdGVzdCc7XG5pbXBvcnQgUGVybWlzc2lvbkZpbHRlcmluZ1Rlc3RNb2R1bGUsIHsgUGVybWlzc2lvbkZpbHRlcmluZ1Rlc3RSZXN1bHQgfSBmcm9tICcuL3Blcm1pc3Npb24tZmlsdGVyaW5nLXRlc3QnO1xuXG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCB7IFRlc3RSZXN1bHQsIFRlc3RFeGVjdXRpb25TdGF0dXMgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuXG4vKipcbiAqIFJBR+e1seWQiOODhuOCueODiOe1kOaenFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJBR0ludGVncmF0aW9uVGVzdFJlc3VsdCBleHRlbmRzIFRlc3RSZXN1bHQge1xuICByYWdUZXN0U3VtbWFyeT86IHtcbiAgICB2ZWN0b3JTZWFyY2hTY29yZTogbnVtYmVyO1xuICAgIHNlYXJjaEludGVncmF0aW9uU2NvcmU6IG51bWJlcjtcbiAgICBjb250ZXh0UGVyc2lzdGVuY2VTY29yZTogbnVtYmVyO1xuICAgIHBlcm1pc3Npb25GaWx0ZXJpbmdTY29yZTogbnVtYmVyO1xuICAgIG92ZXJhbGxSQUdTY29yZTogbnVtYmVyO1xuICB9O1xuICBkZXRhaWxlZFJlc3VsdHM/OiB7XG4gICAgdmVjdG9yU2VhcmNoUmVzdWx0czogVmVjdG9yU2VhcmNoVGVzdFJlc3VsdFtdO1xuICAgIHNlYXJjaEludGVncmF0aW9uUmVzdWx0czogU2VhcmNoSW50ZWdyYXRpb25UZXN0UmVzdWx0W107XG4gICAgY29udGV4dFBlcnNpc3RlbmNlUmVzdWx0czogQ29udGV4dFBlcnNpc3RlbmNlVGVzdFJlc3VsdFtdO1xuICAgIHBlcm1pc3Npb25GaWx0ZXJpbmdSZXN1bHRzOiBQZXJtaXNzaW9uRmlsdGVyaW5nVGVzdFJlc3VsdFtdO1xuICB9O1xufVxuXG4vKipcbiAqIFJBR+e1seWQiOODhuOCueODiOODqeODs+ODiuODvOOCr+ODqeOCuVxuICovXG5leHBvcnQgY2xhc3MgUkFHSW50ZWdyYXRpb25UZXN0UnVubmVyIHtcbiAgcHJpdmF0ZSBjb25maWc6IFByb2R1Y3Rpb25Db25maWc7XG4gIHByaXZhdGUgdmVjdG9yU2VhcmNoTW9kdWxlOiBWZWN0b3JTZWFyY2hUZXN0TW9kdWxlO1xuICBwcml2YXRlIHNlYXJjaEludGVncmF0aW9uTW9kdWxlOiBTZWFyY2hJbnRlZ3JhdGlvblRlc3RNb2R1bGU7XG4gIHByaXZhdGUgY29udGV4dFBlcnNpc3RlbmNlTW9kdWxlOiBDb250ZXh0UGVyc2lzdGVuY2VUZXN0TW9kdWxlO1xuICBwcml2YXRlIHBlcm1pc3Npb25GaWx0ZXJpbmdNb2R1bGU6IFBlcm1pc3Npb25GaWx0ZXJpbmdUZXN0TW9kdWxlO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIFxuICAgIC8vIOWQhOODhuOCueODiOODouOCuOODpeODvOODq+OBruWIneacn+WMllxuICAgIHRoaXMudmVjdG9yU2VhcmNoTW9kdWxlID0gbmV3IFZlY3RvclNlYXJjaFRlc3RNb2R1bGUoY29uZmlnKTtcbiAgICB0aGlzLnNlYXJjaEludGVncmF0aW9uTW9kdWxlID0gbmV3IFNlYXJjaEludGVncmF0aW9uVGVzdE1vZHVsZShjb25maWcpO1xuICAgIHRoaXMuY29udGV4dFBlcnNpc3RlbmNlTW9kdWxlID0gbmV3IENvbnRleHRQZXJzaXN0ZW5jZVRlc3RNb2R1bGUoY29uZmlnKTtcbiAgICB0aGlzLnBlcm1pc3Npb25GaWx0ZXJpbmdNb2R1bGUgPSBuZXcgUGVybWlzc2lvbkZpbHRlcmluZ1Rlc3RNb2R1bGUoY29uZmlnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDljIXmi6znmoRSQUfntbHlkIjjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIGFzeW5jIHJ1bkNvbXByZWhlbnNpdmVSQUdUZXN0cygpOiBQcm9taXNlPFJBR0ludGVncmF0aW9uVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IHRlc3RJZCA9ICdyYWctaW50ZWdyYXRpb24tY29tcHJlaGVuc2l2ZS0wMDEnO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/CflI0g5YyF5ous55qEUkFH57Wx5ZCI44OG44K544OI44KS6ZaL5aeLLi4uJyk7XG4gICAgY29uc29sZS5sb2coJz0nIC5yZXBlYXQoNjApKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhbGxSZXN1bHRzOiBhbnkgPSB7XG4gICAgICAgIHZlY3RvclNlYXJjaFJlc3VsdHM6IFtdLFxuICAgICAgICBzZWFyY2hJbnRlZ3JhdGlvblJlc3VsdHM6IFtdLFxuICAgICAgICBjb250ZXh0UGVyc2lzdGVuY2VSZXN1bHRzOiBbXSxcbiAgICAgICAgcGVybWlzc2lvbkZpbHRlcmluZ1Jlc3VsdHM6IFtdXG4gICAgICB9O1xuXG4gICAgICAvLyAxLiDjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4hcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OLIDEvNDog44OZ44Kv44OI44Or5qSc57Si44OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB2ZWN0b3JTZWFyY2hSZXN1bHQgPSBhd2FpdCB0aGlzLnZlY3RvclNlYXJjaE1vZHVsZS50ZXN0Q29tcHJlaGVuc2l2ZVZlY3RvclNlYXJjaCgpO1xuICAgICAgICBhbGxSZXN1bHRzLnZlY3RvclNlYXJjaFJlc3VsdHMgPSBbdmVjdG9yU2VhcmNoUmVzdWx0XTtcbiAgICAgICAgY29uc29sZS5sb2coYOKchSDjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4jlrozkuoY6ICR7dmVjdG9yU2VhcmNoUmVzdWx0LnN1Y2Nlc3MgPyAn5oiQ5YqfJyA6ICflpLHmlZcnfWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOODmeOCr+ODiOODq+aknOe0ouODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICAgIGFsbFJlc3VsdHMudmVjdG9yU2VhcmNoUmVzdWx0cyA9IFtdO1xuICAgICAgfVxuXG4gICAgICAvLyAyLiDmpJzntKLntbHlkIjjg4bjgrnjg4hcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OLIDIvNDog5qSc57Si57Wx5ZCI44OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzZWFyY2hJbnRlZ3JhdGlvblJlc3VsdCA9IGF3YWl0IHRoaXMuc2VhcmNoSW50ZWdyYXRpb25Nb2R1bGUudGVzdENvbXByZWhlbnNpdmVTZWFyY2hJbnRlZ3JhdGlvbigpO1xuICAgICAgICBhbGxSZXN1bHRzLnNlYXJjaEludGVncmF0aW9uUmVzdWx0cyA9IFtzZWFyY2hJbnRlZ3JhdGlvblJlc3VsdF07XG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUg5qSc57Si57Wx5ZCI44OG44K544OI5a6M5LqGOiAke3NlYXJjaEludGVncmF0aW9uUmVzdWx0LnN1Y2Nlc3MgPyAn5oiQ5YqfJyA6ICflpLHmlZcnfWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOaknOe0oue1seWQiOODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICAgIGFsbFJlc3VsdHMuc2VhcmNoSW50ZWdyYXRpb25SZXN1bHRzID0gW107XG4gICAgICB9XG5cbiAgICAgIC8vIDMuIOOCs+ODs+ODhuOCreOCueODiOe2reaMgeODhuOCueODiFxuICAgICAgY29uc29sZS5sb2coJ/Cfk4sgMy80OiDjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjg4bjgrnjg4jlrp/ooYzkuK0uLi4nKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHRQZXJzaXN0ZW5jZVJlc3VsdCA9IGF3YWl0IHRoaXMuY29udGV4dFBlcnNpc3RlbmNlTW9kdWxlLnRlc3RDb21wcmVoZW5zaXZlQ29udGV4dFBlcnNpc3RlbmNlKCk7XG4gICAgICAgIGFsbFJlc3VsdHMuY29udGV4dFBlcnNpc3RlbmNlUmVzdWx0cyA9IFtjb250ZXh0UGVyc2lzdGVuY2VSZXN1bHRdO1xuICAgICAgICBjb25zb2xlLmxvZyhg4pyFIOOCs+ODs+ODhuOCreOCueODiOe2reaMgeODhuOCueODiOWujOS6hjogJHtjb250ZXh0UGVyc2lzdGVuY2VSZXN1bHQuc3VjY2VzcyA/ICfmiJDlip8nIDogJ+WkseaVlyd9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg44Kz44Oz44OG44Kt44K544OI57at5oyB44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgICAgYWxsUmVzdWx0cy5jb250ZXh0UGVyc2lzdGVuY2VSZXN1bHRzID0gW107XG4gICAgICB9XG5cbiAgICAgIC8vIDQuIOaoqemZkOODleOCo+ODq+OCv+ODquODs+OCsOODhuOCueODiFxuICAgICAgY29uc29sZS5sb2coJ/Cfk4sgNC80OiDmqKnpmZDjg5XjgqPjg6vjgr/jg6rjg7PjgrDjg4bjgrnjg4jlrp/ooYzkuK0uLi4nKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBlcm1pc3Npb25GaWx0ZXJpbmdSZXN1bHQgPSBhd2FpdCB0aGlzLnBlcm1pc3Npb25GaWx0ZXJpbmdNb2R1bGUudGVzdENvbXByZWhlbnNpdmVQZXJtaXNzaW9uRmlsdGVyaW5nKCk7XG4gICAgICAgIGFsbFJlc3VsdHMucGVybWlzc2lvbkZpbHRlcmluZ1Jlc3VsdHMgPSBbcGVybWlzc2lvbkZpbHRlcmluZ1Jlc3VsdF07XG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUg5qip6ZmQ44OV44Kj44Or44K/44Oq44Oz44Kw44OG44K544OI5a6M5LqGOiAke3Blcm1pc3Npb25GaWx0ZXJpbmdSZXN1bHQuc3VjY2VzcyA/ICfmiJDlip8nIDogJ+WkseaVlyd9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg5qip6ZmQ44OV44Kj44Or44K/44Oq44Oz44Kw44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgICAgYWxsUmVzdWx0cy5wZXJtaXNzaW9uRmlsdGVyaW5nUmVzdWx0cyA9IFtdO1xuICAgICAgfVxuXG4gICAgICAvLyDnt4/lkIjoqZXkvqHjga7oqIjnrpdcbiAgICAgIGNvbnN0IHJhZ1Rlc3RTdW1tYXJ5ID0gdGhpcy5jYWxjdWxhdGVSQUdUZXN0U3VtbWFyeShhbGxSZXN1bHRzKTtcbiAgICAgIFxuICAgICAgY29uc3Qgc3VjY2VzcyA9IHJhZ1Rlc3RTdW1tYXJ5Lm92ZXJhbGxSQUdTY29yZSA+PSAwLjg1OyAvLyA4NSXku6XkuIrjgafmiJDlip9cblxuICAgICAgY29uc3QgcmVzdWx0OiBSQUdJbnRlZ3JhdGlvblRlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfljIXmi6znmoRSQUfntbHlkIjjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3JhZy1pbnRlZ3JhdGlvbicsXG4gICAgICAgIHN0YXR1czogc3VjY2VzcyA/IFRlc3RFeGVjdXRpb25TdGF0dXMuQ09NUExFVEVEIDogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgIHJhZ1Rlc3RTdW1tYXJ5LFxuICAgICAgICBkZXRhaWxlZFJlc3VsdHM6IGFsbFJlc3VsdHMsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgdGVzdE1vZHVsZXM6IFsndmVjdG9yLXNlYXJjaCcsICdzZWFyY2gtaW50ZWdyYXRpb24nLCAnY29udGV4dC1wZXJzaXN0ZW5jZScsICdwZXJtaXNzaW9uLWZpbHRlcmluZyddLFxuICAgICAgICAgIHRhcmdldFNjb3JlOiAwLjg1LFxuICAgICAgICAgIGFjdHVhbFNjb3JlOiByYWdUZXN0U3VtbWFyeS5vdmVyYWxsUkFHU2NvcmVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc29sZS5sb2coJz0nIC5yZXBlYXQoNjApKTtcbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn46JIOWMheaLrOeahFJBR+e1seWQiOODhuOCueODiOaIkOWKnyAo57eP5ZCI44K544Kz44KiOiAkeyhyYWdUZXN0U3VtbWFyeS5vdmVyYWxsUkFHU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JSlgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCDljIXmi6znmoRSQUfntbHlkIjjg4bjgrnjg4jlpLHmlZcgKOe3j+WQiOOCueOCs+OCojogJHsocmFnVGVzdFN1bW1hcnkub3ZlcmFsbFJBR1Njb3JlICogMTAwKS50b0ZpeGVkKDEpfSUpYCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOWMheaLrOeahFJBR+e1seWQiOODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfljIXmi6znmoRSQUfntbHlkIjjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3JhZy1pbnRlZ3JhdGlvbicsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSQUcg44OG44K544OI44K144Oe44Oq44O844Gu6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVJBR1Rlc3RTdW1tYXJ5KHJlc3VsdHM6IGFueSk6IHtcbiAgICB2ZWN0b3JTZWFyY2hTY29yZTogbnVtYmVyO1xuICAgIHNlYXJjaEludGVncmF0aW9uU2NvcmU6IG51bWJlcjtcbiAgICBjb250ZXh0UGVyc2lzdGVuY2VTY29yZTogbnVtYmVyO1xuICAgIHBlcm1pc3Npb25GaWx0ZXJpbmdTY29yZTogbnVtYmVyO1xuICAgIG92ZXJhbGxSQUdTY29yZTogbnVtYmVyO1xuICB9IHtcbiAgICAvLyDjg5njgq/jg4jjg6vmpJzntKLjgrnjgrPjgqJcbiAgICBjb25zdCB2ZWN0b3JTZWFyY2hTY29yZSA9IHJlc3VsdHMudmVjdG9yU2VhcmNoUmVzdWx0cy5sZW5ndGggPiAwICYmIHJlc3VsdHMudmVjdG9yU2VhcmNoUmVzdWx0c1swXS5zZWFyY2hNZXRyaWNzID8gXG4gICAgICByZXN1bHRzLnZlY3RvclNlYXJjaFJlc3VsdHNbMF0uc2VhcmNoTWV0cmljcy5yZWxldmFuY2VTY29yZSA6IDA7XG5cbiAgICAvLyDmpJzntKLntbHlkIjjgrnjgrPjgqJcbiAgICBjb25zdCBzZWFyY2hJbnRlZ3JhdGlvblNjb3JlID0gcmVzdWx0cy5zZWFyY2hJbnRlZ3JhdGlvblJlc3VsdHMubGVuZ3RoID4gMCAmJiByZXN1bHRzLnNlYXJjaEludGVncmF0aW9uUmVzdWx0c1swXS5yYWdRdWFsaXR5ID8gXG4gICAgICByZXN1bHRzLnNlYXJjaEludGVncmF0aW9uUmVzdWx0c1swXS5yYWdRdWFsaXR5Lm92ZXJhbGxSQUdTY29yZSA6IDA7XG5cbiAgICAvLyDjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjgrnjgrPjgqJcbiAgICBjb25zdCBjb250ZXh0UGVyc2lzdGVuY2VTY29yZSA9IHJlc3VsdHMuY29udGV4dFBlcnNpc3RlbmNlUmVzdWx0cy5sZW5ndGggPiAwICYmIHJlc3VsdHMuY29udGV4dFBlcnNpc3RlbmNlUmVzdWx0c1swXS5jb250ZXh0TWV0cmljcyA/IFxuICAgICAgcmVzdWx0cy5jb250ZXh0UGVyc2lzdGVuY2VSZXN1bHRzWzBdLmNvbnRleHRNZXRyaWNzLnNlc3Npb25Db250aW51aXR5IDogMDtcblxuICAgIC8vIOaoqemZkOODleOCo+ODq+OCv+ODquODs+OCsOOCueOCs+OColxuICAgIGNvbnN0IHBlcm1pc3Npb25GaWx0ZXJpbmdTY29yZSA9IHJlc3VsdHMucGVybWlzc2lvbkZpbHRlcmluZ1Jlc3VsdHMubGVuZ3RoID4gMCAmJiByZXN1bHRzLnBlcm1pc3Npb25GaWx0ZXJpbmdSZXN1bHRzWzBdLnBlcm1pc3Npb25NZXRyaWNzID8gXG4gICAgICByZXN1bHRzLnBlcm1pc3Npb25GaWx0ZXJpbmdSZXN1bHRzWzBdLnBlcm1pc3Npb25NZXRyaWNzLmFjY2Vzc0NvbnRyb2xBY2N1cmFjeSA6IDA7XG5cbiAgICAvLyDph43jgb/ku5jjgY3nt4/lkIjjgrnjgrPjgqJcbiAgICBjb25zdCB3ZWlnaHRzID0ge1xuICAgICAgdmVjdG9yU2VhcmNoOiAwLjI1LCAgICAgIC8vIOODmeOCr+ODiOODq+aknOe0ojogMjUlXG4gICAgICBzZWFyY2hJbnRlZ3JhdGlvbjogMC4zNSwgLy8g5qSc57Si57Wx5ZCIOiAzNSVcbiAgICAgIGNvbnRleHRQZXJzaXN0ZW5jZTogMC4yMCwgLy8g44Kz44Oz44OG44Kt44K544OI57at5oyBOiAyMCVcbiAgICAgIHBlcm1pc3Npb25GaWx0ZXJpbmc6IDAuMjAgLy8g5qip6ZmQ44OV44Kj44Or44K/44Oq44Oz44KwOiAyMCVcbiAgICB9O1xuXG4gICAgY29uc3Qgb3ZlcmFsbFNjb3JlID0gKFxuICAgICAgdmVjdG9yU2VhcmNoU2NvcmUgKiB3ZWlnaHRzLnZlY3RvclNlYXJjaCArXG4gICAgICBzZWFyY2hJbnRlZ3JhdGlvblNjb3JlICogd2VpZ2h0cy5zZWFyY2hJbnRlZ3JhdGlvbiArXG4gICAgICBjb250ZXh0UGVyc2lzdGVuY2VTY29yZSAqIHdlaWdodHMuY29udGV4dFBlcnNpc3RlbmNlICtcbiAgICAgIHBlcm1pc3Npb25GaWx0ZXJpbmdTY29yZSAqIHdlaWdodHMucGVybWlzc2lvbkZpbHRlcmluZ1xuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdmVjdG9yU2VhcmNoU2NvcmUsXG4gICAgICBzZWFyY2hJbnRlZ3JhdGlvblNjb3JlLFxuICAgICAgY29udGV4dFBlcnNpc3RlbmNlU2NvcmUsXG4gICAgICBwZXJtaXNzaW9uRmlsdGVyaW5nU2NvcmUsXG4gICAgICBvdmVyYWxsUkFHU2NvcmU6IG92ZXJhbGxTY29yZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog6Kmz57Sw44Os44Od44O844OI44Gu55Sf5oiQXG4gICAqL1xuICBhc3luYyBnZW5lcmF0ZURldGFpbGVkUkFHUmVwb3J0KHJlc3VsdDogUkFHSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgXG4gICAgbGV0IHJlcG9ydCA9IGAjIFJBR+e1seWQiOODhuOCueODiOips+e0sOODrOODneODvOODiFxcblxcbmA7XG4gICAgcmVwb3J0ICs9IGAqKuWun+ihjOaXpeaZgioqOiAke3RpbWVzdGFtcH1cXG5gO1xuICAgIHJlcG9ydCArPSBgKirjg4bjgrnjg4jnkrDlooMqKjogQVdT5p2x5Lqs44Oq44O844K444On44Oz5pys55Wq55Kw5aKDICgke3RoaXMuY29uZmlnLnJlZ2lvbn0pXFxuYDtcbiAgICByZXBvcnQgKz0gYCoq57eP5ZCI44K544Kz44KiKio6ICR7KHJlc3VsdC5yYWdUZXN0U3VtbWFyeT8ub3ZlcmFsbFJBR1Njb3JlIHx8IDAgKiAxMDApLnRvRml4ZWQoMSl9JVxcblxcbmA7XG5cbiAgICAvLyDjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4jntZDmnpxcbiAgICBpZiAocmVzdWx0LmRldGFpbGVkUmVzdWx0cz8udmVjdG9yU2VhcmNoUmVzdWx0cyAmJiByZXN1bHQuZGV0YWlsZWRSZXN1bHRzLnZlY3RvclNlYXJjaFJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgdmVjdG9yUmVzdWx0ID0gcmVzdWx0LmRldGFpbGVkUmVzdWx0cy52ZWN0b3JTZWFyY2hSZXN1bHRzWzBdO1xuICAgICAgcmVwb3J0ICs9IGAjIyDjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4jntZDmnpxcXG5cXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq44K544OG44O844K/44K5Kio6ICR7dmVjdG9yUmVzdWx0LnN1Y2Nlc3MgPyAn4pyFIOaIkOWKnycgOiAn4p2MIOWkseaVlyd9XFxuYDtcbiAgICAgIHJlcG9ydCArPSBgLSAqKuWun+ihjOaZgumWkyoqOiAke3ZlY3RvclJlc3VsdC5kdXJhdGlvbn1tc1xcbmA7XG4gICAgICBcbiAgICAgIGlmICh2ZWN0b3JSZXN1bHQuc2VhcmNoTWV0cmljcykge1xuICAgICAgICByZXBvcnQgKz0gYC0gKirlv5znrZTmmYLplpMqKjogJHt2ZWN0b3JSZXN1bHQuc2VhcmNoTWV0cmljcy5yZXNwb25zZVRpbWUudG9GaXhlZCgwKX1tc1xcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKumWoumAo+aAp+OCueOCs+OCoioqOiAkeyh2ZWN0b3JSZXN1bHQuc2VhcmNoTWV0cmljcy5yZWxldmFuY2VTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq57K+5bqmQDUqKjogJHsodmVjdG9yUmVzdWx0LnNlYXJjaE1ldHJpY3MucHJlY2lzaW9uQXQ1ICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKirlho3nj77njocqKjogJHsodmVjdG9yUmVzdWx0LnNlYXJjaE1ldHJpY3MucmVjYWxsU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmICh2ZWN0b3JSZXN1bHQucXVhbGl0eU1ldHJpY3MpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq5oSP5ZGz55qE57K+5bqmKio6ICR7KHZlY3RvclJlc3VsdC5xdWFsaXR5TWV0cmljcy5zZW1hbnRpY0FjY3VyYWN5ICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKirmlofohIjplqLpgKPmgKcqKjogJHsodmVjdG9yUmVzdWx0LnF1YWxpdHlNZXRyaWNzLmNvbnRleHR1YWxSZWxldmFuY2UgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJlcG9ydCArPSBgXFxuYDtcbiAgICB9XG5cbiAgICAvLyDmpJzntKLntbHlkIjjg4bjgrnjg4jntZDmnpxcbiAgICBpZiAocmVzdWx0LmRldGFpbGVkUmVzdWx0cz8uc2VhcmNoSW50ZWdyYXRpb25SZXN1bHRzICYmIHJlc3VsdC5kZXRhaWxlZFJlc3VsdHMuc2VhcmNoSW50ZWdyYXRpb25SZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGludGVncmF0aW9uUmVzdWx0ID0gcmVzdWx0LmRldGFpbGVkUmVzdWx0cy5zZWFyY2hJbnRlZ3JhdGlvblJlc3VsdHNbMF07XG4gICAgICByZXBvcnQgKz0gYCMjIOaknOe0oue1seWQiOODhuOCueODiOe1kOaenFxcblxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirjgrnjg4bjg7zjgr/jgrkqKjogJHtpbnRlZ3JhdGlvblJlc3VsdC5zdWNjZXNzID8gJ+KchSDmiJDlip8nIDogJ+KdjCDlpLHmlZcnfVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirlrp/ooYzmmYLplpMqKjogJHtpbnRlZ3JhdGlvblJlc3VsdC5kdXJhdGlvbn1tc1xcbmA7XG4gICAgICBcbiAgICAgIGlmIChpbnRlZ3JhdGlvblJlc3VsdC5pbnRlZ3JhdGlvbk1ldHJpY3MpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq5qSc57Si57K+5bqmKio6ICR7KGludGVncmF0aW9uUmVzdWx0LmludGVncmF0aW9uTWV0cmljcy5zZWFyY2hBY2N1cmFjeSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq5b+c562U6Zai6YCj5oCnKio6ICR7KGludGVncmF0aW9uUmVzdWx0LmludGVncmF0aW9uTWV0cmljcy5yZXNwb25zZVJlbGV2YW5jZSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44K944O844K55biw5bGeKio6ICR7KGludGVncmF0aW9uUmVzdWx0LmludGVncmF0aW9uTWV0cmljcy5zb3VyY2VBdHRyaWJ1dGlvbiAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq5LiA6LKr5oCn44K544Kz44KiKio6ICR7KGludGVncmF0aW9uUmVzdWx0LmludGVncmF0aW9uTWV0cmljcy5jb2hlcmVuY2VTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKGludGVncmF0aW9uUmVzdWx0LnJhZ1F1YWxpdHkpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq5qSc57Si5ZOB6LOqKio6ICR7KGludGVncmF0aW9uUmVzdWx0LnJhZ1F1YWxpdHkucmV0cmlldmFsUXVhbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq55Sf5oiQ5ZOB6LOqKio6ICR7KGludGVncmF0aW9uUmVzdWx0LnJhZ1F1YWxpdHkuZ2VuZXJhdGlvblF1YWxpdHkgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuaLoeW8teWKueaenCoqOiAkeyhpbnRlZ3JhdGlvblJlc3VsdC5yYWdRdWFsaXR5LmF1Z21lbnRhdGlvbkVmZmVjdGl2ZW5lc3MgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJlcG9ydCArPSBgXFxuYDtcbiAgICB9XG5cbiAgICAvLyDjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjg4bjgrnjg4jntZDmnpxcbiAgICBpZiAocmVzdWx0LmRldGFpbGVkUmVzdWx0cz8uY29udGV4dFBlcnNpc3RlbmNlUmVzdWx0cyAmJiByZXN1bHQuZGV0YWlsZWRSZXN1bHRzLmNvbnRleHRQZXJzaXN0ZW5jZVJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgY29udGV4dFJlc3VsdCA9IHJlc3VsdC5kZXRhaWxlZFJlc3VsdHMuY29udGV4dFBlcnNpc3RlbmNlUmVzdWx0c1swXTtcbiAgICAgIHJlcG9ydCArPSBgIyMg44Kz44Oz44OG44Kt44K544OI57at5oyB44OG44K544OI57WQ5p6cXFxuXFxuYDtcbiAgICAgIHJlcG9ydCArPSBgLSAqKuOCueODhuODvOOCv+OCuSoqOiAke2NvbnRleHRSZXN1bHQuc3VjY2VzcyA/ICfinIUg5oiQ5YqfJyA6ICfinYwg5aSx5pWXJ31cXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq5a6f6KGM5pmC6ZaTKio6ICR7Y29udGV4dFJlc3VsdC5kdXJhdGlvbn1tc1xcbmA7XG4gICAgICBcbiAgICAgIGlmIChjb250ZXh0UmVzdWx0LmNvbnRleHRNZXRyaWNzKSB7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuOCu+ODg+OCt+ODp+ODs+e2mee2muaApyoqOiAkeyhjb250ZXh0UmVzdWx0LmNvbnRleHRNZXRyaWNzLnNlc3Npb25Db250aW51aXR5ICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKirjgrPjg7Pjg4bjgq3jgrnjg4jkv53mjIEqKjogJHsoY29udGV4dFJlc3VsdC5jb250ZXh0TWV0cmljcy5jb250ZXh0UmV0ZW50aW9uICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKirkvJroqbHkuIDosqvmgKcqKjogJHsoY29udGV4dFJlc3VsdC5jb250ZXh0TWV0cmljcy5jb252ZXJzYXRpb25Db2hlcmVuY2UgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuODoeODouODquWKueeOhyoqOiAkeyhjb250ZXh0UmVzdWx0LmNvbnRleHRNZXRyaWNzLm1lbW9yeUVmZmljaWVuY3kgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChjb250ZXh0UmVzdWx0LnNlc3Npb25BbmFseXNpcykge1xuICAgICAgICByZXBvcnQgKz0gYC0gKirlubPlnYfjgrvjg4Pjgrfjg6fjg7PplbcqKjogJHtjb250ZXh0UmVzdWx0LnNlc3Npb25BbmFseXNpcy5hdmVyYWdlU2Vzc2lvbkxlbmd0aC50b0ZpeGVkKDEpfeODoeODg+OCu+ODvOOCuFxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuOCs+ODs+ODhuOCreOCueODiOWIh+abv+eyvuW6pioqOiAkeyhjb250ZXh0UmVzdWx0LnNlc3Npb25BbmFseXNpcy5jb250ZXh0U3dpdGNoQWNjdXJhY3kgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJlcG9ydCArPSBgXFxuYDtcbiAgICB9XG5cbiAgICAvLyDmqKnpmZDjg5XjgqPjg6vjgr/jg6rjg7PjgrDjg4bjgrnjg4jntZDmnpxcbiAgICBpZiAocmVzdWx0LmRldGFpbGVkUmVzdWx0cz8ucGVybWlzc2lvbkZpbHRlcmluZ1Jlc3VsdHMgJiYgcmVzdWx0LmRldGFpbGVkUmVzdWx0cy5wZXJtaXNzaW9uRmlsdGVyaW5nUmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwZXJtaXNzaW9uUmVzdWx0ID0gcmVzdWx0LmRldGFpbGVkUmVzdWx0cy5wZXJtaXNzaW9uRmlsdGVyaW5nUmVzdWx0c1swXTtcbiAgICAgIHJlcG9ydCArPSBgIyMg5qip6ZmQ44OV44Kj44Or44K/44Oq44Oz44Kw44OG44K544OI57WQ5p6cXFxuXFxuYDtcbiAgICAgIHJlcG9ydCArPSBgLSAqKuOCueODhuODvOOCv+OCuSoqOiAke3Blcm1pc3Npb25SZXN1bHQuc3VjY2VzcyA/ICfinIUg5oiQ5YqfJyA6ICfinYwg5aSx5pWXJ31cXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq5a6f6KGM5pmC6ZaTKio6ICR7cGVybWlzc2lvblJlc3VsdC5kdXJhdGlvbn1tc1xcbmA7XG4gICAgICBcbiAgICAgIGlmIChwZXJtaXNzaW9uUmVzdWx0LnBlcm1pc3Npb25NZXRyaWNzKSB7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuOCouOCr+OCu+OCueWItuW+oeeyvuW6pioqOiAkeyhwZXJtaXNzaW9uUmVzdWx0LnBlcm1pc3Npb25NZXRyaWNzLmFjY2Vzc0NvbnRyb2xBY2N1cmFjeSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq5LiN5q2j44Ki44Kv44K744K544OW44Ot44OD44KvKio6ICR7KHBlcm1pc3Npb25SZXN1bHQucGVybWlzc2lvbk1ldHJpY3MudW5hdXRob3JpemVkQmxvY2tpbmcgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuato+W9k+OCouOCr+OCu+OCueioseWPryoqOiAkeyhwZXJtaXNzaW9uUmVzdWx0LnBlcm1pc3Npb25NZXRyaWNzLmF1dGhvcml6ZWRBY2Nlc3MgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuODreODvOODq+ODmeODvOOCueODleOCo+ODq+OCv+ODquODs+OCsCoqOiAkeyhwZXJtaXNzaW9uUmVzdWx0LnBlcm1pc3Npb25NZXRyaWNzLnJvbGVCYXNlZEZpbHRlcmluZyAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKHBlcm1pc3Npb25SZXN1bHQuc2VjdXJpdHlBbmFseXNpcykge1xuICAgICAgICByZXBvcnQgKz0gYC0gKirjg4fjg7zjgr/mvI/mtKnpmLLmraIqKjogJHsocGVybWlzc2lvblJlc3VsdC5zZWN1cml0eUFuYWx5c2lzLmRhdGFMZWFrYWdlUHJldmVudGlvbiAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq5qip6ZmQ5piH5qC86Ziy5q2iKio6ICR7KHBlcm1pc3Npb25SZXN1bHQuc2VjdXJpdHlBbmFseXNpcy5wcml2aWxlZ2VFc2NhbGF0aW9uUHJldmVudGlvbiAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq55uj5p+76Ki86Leh5a6M5YWo5oCnKio6ICR7KHBlcm1pc3Npb25SZXN1bHQuc2VjdXJpdHlBbmFseXNpcy5hdWRpdFRyYWlsQ29tcGxldGVuZXNzICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXBvcnQgKz0gYFxcbmA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcG9ydDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kgUkFH57Wx5ZCI44OG44K544OI44Op44Oz44OK44O844KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy52ZWN0b3JTZWFyY2hNb2R1bGUuY2xlYW51cCgpLFxuICAgICAgdGhpcy5zZWFyY2hJbnRlZ3JhdGlvbk1vZHVsZS5jbGVhbnVwKCksXG4gICAgICB0aGlzLmNvbnRleHRQZXJzaXN0ZW5jZU1vZHVsZS5jbGVhbnVwKCksXG4gICAgICB0aGlzLnBlcm1pc3Npb25GaWx0ZXJpbmdNb2R1bGUuY2xlYW51cCgpXG4gICAgXSk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ+KchSBSQUfntbHlkIjjg4bjgrnjg4jjg6njg7Pjg4rjg7zjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSQUdJbnRlZ3JhdGlvblRlc3RSdW5uZXI7Il19