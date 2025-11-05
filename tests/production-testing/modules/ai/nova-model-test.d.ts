/**
 * Amazon Nova モデルファミリーテストモジュール
 *
 * Nova Lite, Micro, Pro モデルの統合テストを実行
 * 実本番Amazon Bedrockでの各モデルの特性検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * Nova モデルテスト結果
 */
export interface NovaModelTestResult extends TestResult {
    modelDetails?: {
        modelId: string;
        modelName: string;
        version: string;
        capabilities: string[];
    };
    performanceMetrics?: {
        responseTime: number;
        tokensGenerated: number;
        tokensPerSecond: number;
        accuracy: number;
    };
    responseQuality?: {
        coherence: number;
        relevance: number;
        japaneseAccuracy: number;
        creativityScore: number;
    };
}
/**
 * Nova モデル設定
 */
export interface NovaModelConfig {
    modelId: string;
    modelName: string;
    description: string;
    capabilities: string[];
    maxTokens: number;
    temperature: number;
    topP: number;
}
/**
 * テストプロンプト定義
 */
export interface TestPrompt {
    id: string;
    category: string;
    prompt: string;
    expectedType: string;
    language: 'ja' | 'en' | 'mixed';
    difficulty: 'basic' | 'intermediate' | 'advanced';
}
/**
 * Amazon Nova モデルテストモジュール
 */
export declare class NovaModelTestModule {
    private config;
    private bedrockClient;
    private novaModels;
    private testPrompts;
    constructor(config: ProductionConfig);
    /**
     * Nova モデル設定の読み込み
     */
    private loadNovaModelConfigs;
    /**
     * テストプロンプトの読み込み
     */
    private loadTestPrompts;
    /**
     * Nova Lite モデルテスト
     */
    testNovaLiteModel(): Promise<NovaModelTestResult>;
    /**
     * Nova Micro モデルテスト
     */
    testNovaMicroModel(): Promise<NovaModelTestResult>;
    /**
     * Nova Pro モデルテスト
     */
    testNovaProModel(): Promise<NovaModelTestResult>;
    /**
     * 推論実行
     */
    private executeInference;
    /**
     * 模擬応答生成
     */
    private generateMockResponse;
    /**
     * パフォーマンス評価
     */
    private evaluatePerformance;
    /**
     * 応答品質評価
     */
    private evaluateResponseQuality;
    /**
     * 一貫性評価
     */
    private evaluateCoherence;
    /**
     * 関連性評価
     */
    private evaluateRelevance;
    /**
     * 日本語精度評価
     */
    private evaluateJapaneseAccuracy;
    /**
     * 創造性評価
     */
    private evaluateCreativity;
    /**
     * 全Nova モデルテストの実行
     */
    runAllNovaModelTests(): Promise<NovaModelTestResult[]>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default NovaModelTestModule;
