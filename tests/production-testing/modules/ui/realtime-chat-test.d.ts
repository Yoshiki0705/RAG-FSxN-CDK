/**
 * リアルタイムチャットテスト
 * チャットメッセージ送受信のテスト実装
 * リアルタイムインタラクションの検証コード作成
 */
import { TestResult } from '../../types/test-types';
export interface RealtimeChatTestConfig {
    baseUrl: string;
    testUsers: TestUser[];
    messageTypes: MessageType[];
    performanceThresholds: {
        messageDeliveryTime: number;
        typingIndicatorDelay: number;
        connectionEstablishmentTime: number;
        messageHistoryLoadTime: number;
    };
    concurrencyLimits: {
        maxConcurrentUsers: number;
        maxMessagesPerSecond: number;
    };
}
export interface TestUser {
    userId: string;
    username: string;
    role: 'user' | 'admin' | 'testuser';
    permissions: string[];
}
export interface MessageType {
    type: 'text' | 'file' | 'image' | 'system' | 'ai_response';
    maxSize?: number;
    allowedFormats?: string[];
}
export interface RealtimeChatTestResult extends TestResult {
    messageDeliveryResults: MessageDeliveryResult[];
    typingIndicatorResults: TypingIndicatorResult[];
    connectionResults: ConnectionResult[];
    concurrencyResults: ConcurrencyResult[];
    messageHistoryResults: MessageHistoryResult[];
    overallChatScore: number;
    reliabilityScore: number;
    performanceScore: number;
    userExperienceScore: number;
}
export interface MessageDeliveryResult {
    messageId: string;
    sender: string;
    recipient: string;
    messageType: string;
    deliveryTime: number;
    success: boolean;
    errorMessage?: string;
    messageSize: number;
    timestamp: number;
}
export interface TypingIndicatorResult {
    userId: string;
    indicatorDelay: number;
    indicatorAccuracy: boolean;
    displayDuration: number;
    success: boolean;
}
export interface ConnectionResult {
    userId: string;
    connectionTime: number;
    connectionStability: number;
    reconnectionAttempts: number;
    success: boolean;
    errorDetails?: string;
}
export interface ConcurrencyResult {
    concurrentUsers: number;
    messagesPerSecond: number;
    systemStability: number;
    averageResponseTime: number;
    errorRate: number;
    success: boolean;
}
export interface MessageHistoryResult {
    userId: string;
    historyLoadTime: number;
    messageCount: number;
    dataIntegrity: boolean;
    chronologicalOrder: boolean;
    success: boolean;
}
export interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    type: string;
    timestamp: number;
    metadata?: Record<string, any>;
}
export declare class RealtimeChatTest {
    private config;
    private testStartTime;
    private activeConnections;
    constructor(config: RealtimeChatTestConfig);
    /**
     * リアルタイムチャットテストの実行
     */
    runTest(): Promise<RealtimeChatTestResult>;
    /**
     * 接続テストの実行
     */
    private testConnections;
    /**
     * WebSocket接続の確立
     */
    private establishConnection;
    /**
     * 接続安定性のテスト
     */
    private testConnectionStability;
    /**
     * メッセージ配信テストの実行
     */
    private testMessageDelivery;
    /**
     * 単一メッセージ配信テスト
     */
    private testSingleMessageDelivery;
    /**
     * メッセージ配信の待機
     */
    private waitForMessageDelivery;
    /**
     * テストコンテンツの生成
     */
    private generateTestContent;
    /**
     * タイピングインジケーターテストの実行
     */
    private testTypingIndicators;
    /**
     * ユーザーのタイピングインジケーターテスト
     */
    private testUserTypingIndicator;
    /**
     * タイピングインジケーター遅延の測定
     */
    private measureTypingIndicatorDelay;
    /**
     * 同時接続テストの実行
     */
    private testConcurrency;
    /**
     * 特定同時接続レベルのテスト
     */
    private testConcurrencyLevel;
    /**
     * テスト接続の確立
     */
    private establishTestConnection;
    /**
     * テストメッセージの送信
     */
    private sendTestMessages;
    /**
     * メッセージ履歴テストの実行
     */
    private testMessageHistory;
    /**
     * ユーザーのメッセージ履歴テスト
     */
    private testUserMessageHistory;
    /**
     * 履歴レスポンスの待機
     */
    private waitForHistoryResponse;
    /**
     * 履歴データの整合性検証
     */
    private validateHistoryData;
    /**
     * 時系列順序の検証
     */
    private validateChronologicalOrder;
    /**
     * スコアの計算
     */
    private calculateScores;
    /**
     * クリーンアップ処理
     */
    private cleanup;
    /**
     * テスト結果のログ出力
     */
    private logTestResults;
    /**
     * 遅延処理
     */
    private delay;
}
/**
 * デフォルト設定でのリアルタイムチャットテスト実行
 */
export declare function runRealtimeChatTest(baseUrl?: string): Promise<RealtimeChatTestResult>;
