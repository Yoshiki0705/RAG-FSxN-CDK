/**
 * ストリーミングレスポンステストモジュール
 *
 * リアルタイムストリーミング応答機能を検証
 * 実本番Amazon Bedrockでのストリーミング性能をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * ストリーミングテスト結果
 */
export interface StreamingTestResult extends TestResult {
    streamingMetrics?: {
        firstTokenLatency: number;
        averageTokenLatency: number;
        totalTokens: number;
        streamDuration: number;
        throughput: number;
    };
    qualityMetrics?: {
        streamStability: number;
        contentCoherence: number;
        realTimeScore: number;
    };
}
/**
 * ストリーミングテストケース
 */
export interface StreamingTestCase {
    id: string;
    name: string;
    prompt: string;
    expectedTokens: number;
    maxLatency: number;
    modelId: string;
}
/**
 * ストリーミングレスポンステストモジュール
 */
export declare class StreamingResponseTestModule {
    private config;
    private bedrockClient;
    private testCases;
    constructor(config: ProductionConfig);
    /**
     * ストリーミングテストケースの読み込み
     */
    private loadStreamingTestCases;
    /**
     * 包括的ストリーミングテスト
     */
    testComprehensiveStreaming(): Promise<StreamingTestResult>;
    /**
     * 個別ストリーミングテストの実行
     */
    private executeStreamingTest;
    /**
     * ストリーミング推論実行
     */
    private performStreamingInference;
    /**
     * 模擬ストリーミング結果生成
     */
    private generateMockStreamingResult;
    /**
     * ストリーミングメトリクス集約
     */
    private aggregateStreamingMetrics;
    /**
     * ストリーミング品質評価
     */
    private evaluateStreamingQuality;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default StreamingResponseTestModule;
