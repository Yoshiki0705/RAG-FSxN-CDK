/**
 * コンテキスト維持テストモジュール
 *
 * セッション間でのコンテキスト保持機能を検証
 * 実本番環境での会話継続性をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * コンテキスト維持テスト結果
 */
export interface ContextPersistenceTestResult extends TestResult {
    contextMetrics?: {
        sessionContinuity: number;
        contextRetention: number;
        conversationCoherence: number;
        memoryEfficiency: number;
    };
    sessionAnalysis?: {
        averageSessionLength: number;
        contextSwitchAccuracy: number;
        longTermMemoryScore: number;
        crossSessionRelevance: number;
    };
}
/**
 * 会話セッション
 */
export interface ConversationSession {
    sessionId: string;
    userId: string;
    messages: ConversationMessage[];
    context: SessionContext;
    createdAt: Date;
    lastUpdated: Date;
}
/**
 * 会話メッセージ
 */
export interface ConversationMessage {
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: {
        sources?: string[];
        confidence?: number;
        contextUsed?: string[];
    };
}
/**
 * セッションコンテキスト
 */
export interface SessionContext {
    topics: string[];
    entities: {
        [key: string]: string;
    };
    preferences: {
        [key: string]: any;
    };
    documentHistory: string[];
    conversationSummary: string;
}
/**
 * コンテキスト維持テストケース
 */
export interface ContextTestCase {
    id: string;
    scenario: string;
    conversationFlow: {
        userMessage: string;
        expectedContext: string[];
        contextDependency: boolean;
    }[];
    sessionType: 'short' | 'medium' | 'long';
    complexityLevel: 'simple' | 'moderate' | 'complex';
}
/**
 * コンテキスト維持テストモジュール
 */
export declare class ContextPersistenceTestModule {
    private config;
    private dynamoClient;
    private testCases;
    private sessionsTable;
    constructor(config: ProductionConfig);
    /**
     * コンテキストテストケースの読み込み
     */
    private loadContextTestCases;
    /**
     * 包括的コンテキスト維持テスト
     */
    testComprehensiveContextPersistence(): Promise<ContextPersistenceTestResult>;
    /**
     * 個別コンテキストテストの実行
     */
    private executeContextTest;
    /**
     * テストセッション作成
     */
    private createTestSession;
    /**
     * セッションにメッセージ追加
     */
    private addMessageToSession;
    /**
     * コンテキスト使用評価
     */
    private evaluateContextUsage;
    /**
     * コンテキスト認識応答生成
     */
    private generateContextAwareResponse;
    /**
     * 模擬コンテキスト応答生成
     */
    private generateMockContextResponse;
    /**
     * セッションコンテキスト更新
     */
    private updateSessionContext;
    /**
     * DynamoDBにセッション保存
     */
    private saveSessionToDynamoDB;
    /**
     * DynamoDBのセッション更新
     */
    private updateSessionInDynamoDB;
    /**
     * コンテキストメトリクス計算
     */
    private calculateContextMetrics;
    /**
     * セッション分析計算
     */
    private calculateSessionAnalysis;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default ContextPersistenceTestModule;
