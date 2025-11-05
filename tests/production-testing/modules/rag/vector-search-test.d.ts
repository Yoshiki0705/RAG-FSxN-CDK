/**
 * ベクトル検索テストモジュール
 *
 * OpenSearch Serverless を使用したベクトル検索機能を検証
 * 実本番環境での検索精度と応答時間をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * ベクトル検索テスト結果
 */
export interface VectorSearchTestResult extends TestResult {
    searchMetrics?: {
        responseTime: number;
        relevanceScore: number;
        precisionAt5: number;
        recallScore: number;
        documentsFound: number;
    };
    qualityMetrics?: {
        semanticAccuracy: number;
        contextualRelevance: number;
        diversityScore: number;
    };
}
/**
 * 検索テストケース
 */
export interface SearchTestCase {
    id: string;
    query: string;
    queryType: 'factual' | 'conceptual' | 'technical' | 'conversational';
    expectedDocuments: string[];
    language: 'ja' | 'en' | 'mixed';
    difficulty: 'basic' | 'intermediate' | 'advanced';
}
/**
 * ベクトル検索テストモジュール
 */
export declare class VectorSearchTestModule {
    private config;
    private opensearchClient;
    private testCases;
    private collectionEndpoint;
    constructor(config: ProductionConfig);
    /**
     * 検索テストケースの読み込み
     */
    private loadSearchTestCases;
    /**
     * 包括的ベクトル検索テスト
     */
    testComprehensiveVectorSearch(): Promise<VectorSearchTestResult>;
    /**
     * OpenSearch Serverless 接続確認
     */
    private verifyOpenSearchConnection;
    /**
     * 個別検索テストの実行
     */
    private executeSearchTest;
    /**
     * ベクトル検索実行
     */
    private performVectorSearch;
    /**
     * クエリベクトル生成（模擬）
     */
    private generateQueryVector;
    /**
     * 検索リクエスト送信（模擬）
     */
    private sendSearchRequest;
    /**
     * 模擬検索結果生成
     */
    private generateMockSearchResult;
    /**
     * 検索結果評価
     */
    private evaluateSearchResults;
    /**
     * 関連性スコア計算
     */
    private calculateRelevanceScore;
    /**
     * 上位5件精度計算
     */
    private calculatePrecisionAt5;
    /**
     * 再現率計算
     */
    private calculateRecallScore;
    /**
     * 検索メトリクス計算
     */
    private calculateSearchMetrics;
    /**
     * 品質メトリクス計算
     */
    private calculateQualityMetrics;
    /**
     * 文脈的関連性評価
     */
    private evaluateContextualRelevance;
    /**
     * 多様性スコア評価
     */
    private evaluateDiversityScore;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default VectorSearchTestModule;
