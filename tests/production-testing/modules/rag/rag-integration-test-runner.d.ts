/**
 * RAG統合テストランナー
 *
 * ベクトル検索、検索統合、コンテキスト維持、権限フィルタリングテストを統合実行
 * 実本番環境でのRAG機能包括検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { VectorSearchTestResult } from './vector-search-test';
import { SearchIntegrationTestResult } from './search-integration-test';
import { ContextPersistenceTestResult } from './context-persistence-test';
import { PermissionFilteringTestResult } from './permission-filtering-test';
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * RAG統合テスト結果
 */
export interface RAGIntegrationTestResult extends TestResult {
    ragTestSummary?: {
        vectorSearchScore: number;
        searchIntegrationScore: number;
        contextPersistenceScore: number;
        permissionFilteringScore: number;
        overallRAGScore: number;
    };
    detailedResults?: {
        vectorSearchResults: VectorSearchTestResult[];
        searchIntegrationResults: SearchIntegrationTestResult[];
        contextPersistenceResults: ContextPersistenceTestResult[];
        permissionFilteringResults: PermissionFilteringTestResult[];
    };
}
/**
 * RAG統合テストランナークラス
 */
export declare class RAGIntegrationTestRunner {
    private config;
    private vectorSearchModule;
    private searchIntegrationModule;
    private contextPersistenceModule;
    private permissionFilteringModule;
    constructor(config: ProductionConfig);
    /**
     * 包括的RAG統合テストの実行
     */
    runComprehensiveRAGTests(): Promise<RAGIntegrationTestResult>;
    /**
     * RAG テストサマリーの計算
     */
    private calculateRAGTestSummary;
    /**
     * 詳細レポートの生成
     */
    generateDetailedRAGReport(result: RAGIntegrationTestResult): Promise<string>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default RAGIntegrationTestRunner;
