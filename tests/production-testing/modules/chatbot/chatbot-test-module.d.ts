/**
 * チャットボット機能テストモジュール
 *
 * 実本番Amazon Bedrockでの応答生成品質テスト
 * 日本語応答の精度、ストリーミング機能、RAG連携を検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * チャットボットテスト結果インターフェース
 */
export interface ChatbotTestResult extends TestResult {
    responseDetails?: {
        responseText: string;
        responseTime: number;
        tokenCount: number;
        modelUsed: string;
        isStreaming: boolean;
        japaneseQuality: number;
    };
    ragDetails?: {
        documentsFound: number;
        relevantDocuments: number;
        citationsIncluded: boolean;
        sourceAccuracy: number;
    };
    performanceMetrics?: {
        latency: number;
        throughput: number;
        errorRate: number;
        resourceUsage: number;
    };
}
/**
 * テスト質問データ
 */
export interface TestQuestion {
    id: string;
    question: string;
    category: 'general' | 'document-based' | 'technical' | 'conversational';
    expectedKeywords: string[];
    expectedDocuments?: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    language: 'japanese' | 'english';
}
/**
 * 日本語品質評価基準
 */
export interface JapaneseQualityMetrics {
    grammar: number;
    naturalness: number;
    politeness: number;
    clarity: number;
    completeness: number;
}
/**
 * チャットボット機能テストモジュールクラス
 */
export declare class ChatbotTestModule {
    private config;
    private bedrockClient;
    private openSearchClient;
    private dynamoClient;
    private testQuestions;
    constructor(config: ProductionConfig);
    /**
     * 実本番Bedrockでの応答生成
     */
    private generateResponse;
    /**
     * 関連文書の検索
     */
    private searchRelevantDocuments;
    /**
     * RAG機能を使用した応答生成
     */
    private generateRAGResponse;
    /**
     * ストリーミング応答の生成
     */
    private generateStreamingResponse;
    "} : any;
    ToolResult: SUCCESS;
}
export default ChatbotTestModule;
