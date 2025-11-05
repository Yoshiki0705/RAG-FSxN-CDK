/**
 * マルチモーダル入力テストモジュール
 *
 * テキスト・画像入力の統合処理を検証
 * 実本番Amazon Bedrockでのマルチモーダル機能をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * マルチモーダルテスト結果
 */
export interface MultimodalTestResult extends TestResult {
    modalityMetrics?: {
        textProcessingAccuracy: number;
        imageProcessingAccuracy: number;
        integrationQuality: number;
        responseRelevance: number;
    };
    inputAnalysis?: {
        textLength: number;
        imageCount: number;
        modalityCombination: string;
        complexityScore: number;
    };
}
/**
 * マルチモーダルテストケース
 */
export interface MultimodalTestCase {
    id: string;
    name: string;
    textInput: string;
    imageInput?: {
        description: string;
        format: string;
        size: string;
        mockData: boolean;
    };
    expectedOutput: string;
    modalities: ('text' | 'image')[];
    difficulty: 'basic' | 'intermediate' | 'advanced';
}
/**
 * マルチモーダル入力テストモジュール
 */
export declare class MultimodalInputTestModule {
    private config;
    private bedrockClient;
    private testCases;
    constructor(config: ProductionConfig);
    /**
     * マルチモーダルテストケースの読み込み
     */
    private loadMultimodalTestCases;
    /**
     * 包括的マルチモーダルテスト
     */
    testComprehensiveMultimodal(): Promise<MultimodalTestResult>;
    /**
     * 個別マルチモーダルテストの実行
     */
    private executeMultimodalTest;
    /**
     * マルチモーダル推論実行
     */
    private performMultimodalInference;
    /**
     * マルチモーダルリクエスト構築
     */
    private buildMultimodalRequest;
    /**
     * 模擬マルチモーダル結果生成
     */
    private generateMockMultimodalResult;
    /**
     * マルチモーダル応答評価
     */
    private evaluateMultimodalResponse;
    /**
     * テキスト品質評価
     */
    private evaluateTextQuality;
    /**
     * 画像理解評価
     */
    private evaluateImageUnderstanding;
    /**
     * モダリティ統合評価
     */
    private evaluateModalityIntegration;
    /**
     * モダリティメトリクス計算
     */
    private calculateModalityMetrics;
    /**
     * 入力複雑性分析
     */
    private analyzeInputComplexity;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default MultimodalInputTestModule;
