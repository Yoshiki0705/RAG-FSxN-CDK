/**
 * AI統合テストランナー
 *
 * Nova モデル、日本語精度、ストリーミング、マルチモーダルテストを統合実行
 * 実本番Amazon Bedrockでの包括的AI機能検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { NovaModelTestResult } from './nova-model-test';
import { JapaneseAccuracyTestResult } from './japanese-accuracy-test';
import { StreamingTestResult } from './streaming-response-test';
import { MultimodalTestResult } from './multimodal-input-test';
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * AI統合テスト結果
 */
export interface AIIntegrationTestResult extends TestResult {
    aiTestSummary?: {
        novaModelTests: number;
        japaneseAccuracyScore: number;
        streamingPerformance: number;
        multimodalCapability: number;
        overallAIScore: number;
    };
    detailedResults?: {
        novaResults: NovaModelTestResult[];
        japaneseResults: JapaneseAccuracyTestResult[];
        streamingResults: StreamingTestResult[];
        multimodalResults: MultimodalTestResult[];
    };
}
/**
 * AI統合テストランナークラス
 */
export declare class AIIntegrationTestRunner {
    private config;
    private novaTestModule;
    private japaneseTestModule;
    private streamingTestModule;
    private multimodalTestModule;
    constructor(config: ProductionConfig);
    /**
     * 包括的AI統合テストの実行
     */
    runComprehensiveAITests(): Promise<AIIntegrationTestResult>;
    /**
     * AI テストサマリーの計算
     */
    private calculateAITestSummary;
    /**
     * 詳細レポートの生成
     */
    generateDetailedAIReport(result: AIIntegrationTestResult): Promise<string>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default AIIntegrationTestRunner;
