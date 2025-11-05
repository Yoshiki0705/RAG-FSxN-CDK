/**
 * チャットボット機能テスト実行ランナー
 *
 * 実本番Amazon Bedrockでのチャットボット機能テストを安全に実行
 * テスト結果の収集と報告を行う
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ChatbotTestResult } from './chatbot-test-module';
import ProductionTestEngine, { TestSuite } from '../../core/production-test-engine';
import { ProductionConfig } from '../../config/production-config';
/**
 * チャットボット機能テスト実行ランナークラス
 */
export declare class ChatbotTestRunner {
    private config;
    private testModule;
    private testEngine;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * チャットボット機能テストスイートの作成
     */
    createChatbotTestSuite(): TestSuite;
    /**
     * チャットボット機能テストの実行
     */
    runChatbotTests(): Promise<{
        success: boolean;
        results: Map<string, ChatbotTestResult>;
        summary: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
            skippedTests: number;
            successRate: number;
            totalDuration: number;
            averageResponseTime: number;
            japaneseQualityScore: number;
            ragEffectiveness: number;
        };
    }>;
    /**
     * テスト結果サマリーの生成
     */
    private generateTestSummary;
    /**
     * 詳細レポートの生成
     */
    generateDetailedReport(results: Map<string, ChatbotTestResult>): Promise<string>;
    /**
     * 推奨事項の生成
     */
    private generateRecommendations;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default ChatbotTestRunner;
