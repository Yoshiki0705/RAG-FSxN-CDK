/**
 * 検索結果統合テストモジュール
 *
 * ベクトル検索結果とAI応答の統合処理を検証
 * 実本番環境でのRAG統合品質をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * 検索統合テスト結果
 */
export interface SearchIntegrationTestResult extends TestResult {
    integrationMetrics?: {
        searchAccuracy: number;
        responseRelevance: number;
        sourceAttribution: number;
        coherenceScore: number;
        factualAccuracy: number;
    };
    ragQuality?: {
        retrievalQuality: number;
        generationQuality: number;
        augmentationEffectiveness: number;
        overallRAGScore: number;
    };
}
/**
 * RAG統合テストケース
 */
export interface RAGIntegrationTestCase {
    id: string;
    query: string;
    context: string;
    expectedSources: string[];
    expectedFactoids: string[];
    complexityLevel: 'simple' | 'moderate' | 'complex';
    domainArea: 'technical' | 'business' | 'general';
}
/**
 * 検索結果統合テストモジュール
 */
export declare class SearchIntegrationTestModule {
    private config;
    private bedrockClient;
    private testCases;
    constructor(config: ProductionConfig);
    /**
     * RAG統合テストケースの読み込み
     */
    private loadRAGIntegrationTestCases;
    /**
     * 包括的検索統合テスト
     */
    testComprehensiveSearchIntegration(): Promise<SearchIntegrationTestResult>;
    /**
     * 個別RAG統合テストの実行
     */
    private executeRAGIntegrationTest;
    /**
     * 模擬ベクトル検索実行
     */
    private performMockVectorSearch;
    /**
     * 模擬コンテンツ生成
     */
    private generateMockContent;
    /**
     * RAG応答生成
     */
    private generateRAGResponse;
    /**
     * RAGプロンプト構築
     */
    private buildRAGPrompt;
    /**
     * 模擬RAG応答生成
     */
    private generateMockRAGResponse;
    /**
     * RAG統合評価
     */
    private evaluateRAGIntegration;
    /**
     * ソース参照評価
     */
    private evaluateSourceAttribution;
    /**
     * 事実正確性評価
     */
    private evaluateFactualAccuracy;
    /**
     * 応答一貫性評価
     */
    private evaluateResponseCoherence;
    /**
     * 応答関連性評価
     */
    private evaluateResponseRelevance;
    /**
     * 統合メトリクス計算
     */
    private calculateIntegrationMetrics;
    /**
     * RAG品質計算
     */
    private calculateRAGQuality;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default SearchIntegrationTestModule;
