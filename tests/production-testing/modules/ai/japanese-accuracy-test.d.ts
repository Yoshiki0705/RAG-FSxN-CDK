/**
 * 日本語サポート精度テストモジュール
 *
 * 95%以上の日本語精度検証を実行
 * 実本番Amazon Bedrockでの日本語処理能力を包括的にテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * 日本語精度テスト結果
 */
export interface JapaneseAccuracyTestResult extends TestResult {
    accuracyMetrics?: {
        overallAccuracy: number;
        grammarAccuracy: number;
        vocabularyAccuracy: number;
        contextAccuracy: number;
        formalityAccuracy: number;
    };
    testCategories?: {
        [category: string]: {
            score: number;
            details: string;
        };
    };
}
/**
 * 日本語テストケース
 */
export interface JapaneseTestCase {
    id: string;
    category: string;
    prompt: string;
    expectedElements: string[];
    grammarPoints: string[];
    formalityLevel: 'casual' | 'polite' | 'formal';
    difficulty: 'basic' | 'intermediate' | 'advanced';
}
/**
 * 日本語サポート精度テストモジュール
 */
export declare class JapaneseAccuracyTestModule {
    private config;
    private bedrockClient;
    private testCases;
    constructor(config: ProductionConfig);
    /**
     * 日本語テストケースの読み込み
     */
    private loadJapaneseTestCases;
    /**
     * 包括的日本語精度テスト
     */
    testComprehensiveJapaneseAccuracy(): Promise<JapaneseAccuracyTestResult>;
    /**
     * 個別日本語テストの実行
     */
    private executeJapaneseTest;
    /**
     * 模擬日本語テスト結果生成
     */
    private generateMockJapaneseTestResult;
    /**
     * 日本語精度評価
     */
    private evaluateJapaneseAccuracy;
    /**
     * 文法ポイント評価
     */
    private evaluateGrammarPoints;
    /**
     * 期待要素評価
     */
    private evaluateExpectedElements;
    /**
     * 敬語レベル評価
     */
    private evaluateFormalityLevel;
    /**
     * 日本語文字使用率評価
     */
    private evaluateJapaneseCharacterUsage;
    /**
     * 詳細精度メトリクス計算
     */
    private calculateDetailedAccuracy;
    /**
     * 評価詳細生成
     */
    private generateEvaluationDetails;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default JapaneseAccuracyTestModule;
