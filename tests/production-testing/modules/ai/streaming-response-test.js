"use strict";
/**
 * ストリーミングレスポンステストモジュール
 *
 * リアルタイムストリーミング応答機能を検証
 * 実本番Amazon Bedrockでのストリーミング性能をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingResponseTestModule = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * ストリーミングレスポンステストモジュール
 */
class StreamingResponseTestModule {
    config;
    bedrockClient;
    testCases;
    constructor(config) {
        this.config = config;
        this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: config.region,
            credentials: { profile: config.awsProfile }
        });
        this.testCases = this.loadStreamingTestCases();
    }
    /**
     * ストリーミングテストケースの読み込み
     */
    loadStreamingTestCases() {
        return [
            {
                id: 'stream-short-001',
                name: '短文ストリーミングテスト',
                prompt: 'RAGシステムについて簡潔に説明してください。',
                expectedTokens: 100,
                maxLatency: 500,
                modelId: 'amazon.nova-lite-v1:0'
            },
            {
                id: 'stream-medium-001',
                name: '中文ストリーミングテスト',
                prompt: 'Amazon FSx for NetApp ONTAPとAmazon Bedrockを組み合わせたRAGシステムの技術的利点について詳しく説明してください。',
                expectedTokens: 300,
                maxLatency: 800,
                modelId: 'amazon.nova-pro-v1:0'
            },
            {
                id: 'stream-long-001',
                name: '長文ストリーミングテスト',
                prompt: 'エンタープライズ環境における権限認識型RAGシステムの設計原則、実装方法、運用上の考慮事項について、具体例を交えながら包括的に説明してください。',
                expectedTokens: 500,
                maxLatency: 1200,
                modelId: 'amazon.nova-pro-v1:0'
            },
            {
                id: 'stream-realtime-001',
                name: 'リアルタイム応答テスト',
                prompt: 'チャットボットでよくある質問に答えてください：「このシステムはどのように動作しますか？」',
                expectedTokens: 150,
                maxLatency: 300,
                modelId: 'amazon.nova-micro-v1:0'
            }
        ];
    }
    /**
     * 包括的ストリーミングテスト
     */
    async testComprehensiveStreaming() {
        const testId = 'streaming-comprehensive-001';
        const startTime = Date.now();
        console.log('📡 包括的ストリーミングテストを開始...');
        try {
            const results = [];
            // 各テストケースを実行
            for (const testCase of this.testCases) {
                console.log(`   ストリーミングテスト実行中: ${testCase.name}`);
                const caseResult = await this.executeStreamingTest(testCase);
                results.push(caseResult);
            }
            // 総合メトリクスを計算
            const aggregatedMetrics = this.aggregateStreamingMetrics(results);
            const qualityMetrics = this.evaluateStreamingQuality(results);
            const success = aggregatedMetrics.firstTokenLatency < 500 &&
                qualityMetrics.realTimeScore > 0.8;
            const result = {
                testId,
                testName: '包括的ストリーミングテスト',
                category: 'streaming',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                streamingMetrics: aggregatedMetrics,
                qualityMetrics,
                metadata: {
                    testCaseCount: this.testCases.length,
                    testResults: results
                }
            };
            if (success) {
                console.log('✅ 包括的ストリーミングテスト成功');
            }
            else {
                console.error('❌ 包括的ストリーミングテスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 包括的ストリーミングテスト実行エラー:', error);
            return {
                testId,
                testName: '包括的ストリーミングテスト',
                category: 'streaming',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 個別ストリーミングテストの実行
     */
    async executeStreamingTest(testCase) {
        try {
            // 読み取り専用モードでは模擬結果を返す
            if (this.config.readOnlyMode) {
                return this.generateMockStreamingResult(testCase);
            }
            // 実際のストリーミング推論
            const streamingResult = await this.performStreamingInference(testCase);
            const success = streamingResult.firstTokenLatency <= testCase.maxLatency;
            return {
                testCase,
                metrics: streamingResult,
                success
            };
        }
        catch (error) {
            console.error(`❌ ストリーミングテスト実行エラー (${testCase.id}):`, error);
            return {
                testCase,
                metrics: null,
                success: false
            };
        }
    }
    /**
     * ストリーミング推論実行
     */
    async performStreamingInference(testCase) {
        const startTime = Date.now();
        let firstTokenTime = null;
        const tokenTimes = [];
        const tokens = [];
        const requestBody = {
            inputText: testCase.prompt,
            textGenerationConfig: {
                maxTokenCount: testCase.expectedTokens * 2,
                temperature: 0.7,
                topP: 0.9
            }
        };
        const command = new client_bedrock_runtime_1.InvokeModelWithResponseStreamCommand({
            modelId: testCase.modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(requestBody)
        });
        const response = await this.bedrockClient.send(command);
        if (response.body) {
            for await (const chunk of response.body) {
                const currentTime = Date.now();
                if (chunk.chunk?.bytes) {
                    const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
                    if (chunkData.outputText) {
                        if (firstTokenTime === null) {
                            firstTokenTime = currentTime - startTime;
                        }
                        tokenTimes.push(currentTime - startTime);
                        tokens.push(chunkData.outputText);
                    }
                }
            }
        }
        const endTime = Date.now();
        const streamDuration = endTime - startTime;
        const averageTokenLatency = tokenTimes.length > 0 ?
            tokenTimes.reduce((sum, time) => sum + time, 0) / tokenTimes.length : 0;
        const throughput = tokens.length / (streamDuration / 1000); // tokens per second
        return {
            firstTokenLatency: firstTokenTime || streamDuration,
            averageTokenLatency,
            totalTokens: tokens.length,
            streamDuration,
            throughput,
            tokens
        };
    }
    /**
     * 模擬ストリーミング結果生成
     */
    generateMockStreamingResult(testCase) {
        const mockMetrics = {
            firstTokenLatency: Math.random() * testCase.maxLatency * 0.8, // 80%以内
            averageTokenLatency: Math.random() * 100 + 50,
            totalTokens: testCase.expectedTokens + Math.floor(Math.random() * 50),
            streamDuration: Math.random() * 2000 + 1000,
            throughput: Math.random() * 20 + 10,
            tokens: Array(testCase.expectedTokens).fill('模擬トークン')
        };
        return {
            testCase,
            metrics: mockMetrics,
            success: mockMetrics.firstTokenLatency <= testCase.maxLatency
        };
    }
    /**
     * ストリーミングメトリクス集約
     */
    aggregateStreamingMetrics(results) {
        const validResults = results.filter(r => r.success && r.metrics);
        if (validResults.length === 0) {
            return {
                firstTokenLatency: 0,
                averageTokenLatency: 0,
                totalTokens: 0,
                streamDuration: 0,
                throughput: 0
            };
        }
        const avgFirstTokenLatency = validResults.reduce((sum, r) => sum + r.metrics.firstTokenLatency, 0) / validResults.length;
        const avgTokenLatency = validResults.reduce((sum, r) => sum + r.metrics.averageTokenLatency, 0) / validResults.length;
        const totalTokens = validResults.reduce((sum, r) => sum + r.metrics.totalTokens, 0);
        const avgStreamDuration = validResults.reduce((sum, r) => sum + r.metrics.streamDuration, 0) / validResults.length;
        const avgThroughput = validResults.reduce((sum, r) => sum + r.metrics.throughput, 0) / validResults.length;
        return {
            firstTokenLatency: avgFirstTokenLatency,
            averageTokenLatency: avgTokenLatency,
            totalTokens,
            streamDuration: avgStreamDuration,
            throughput: avgThroughput
        };
    }
    /**
     * ストリーミング品質評価
     */
    evaluateStreamingQuality(results) {
        const validResults = results.filter(r => r.success && r.metrics);
        if (validResults.length === 0) {
            return {
                streamStability: 0,
                contentCoherence: 0,
                realTimeScore: 0
            };
        }
        // ストリーム安定性（レイテンシの一貫性）
        const latencies = validResults.map(r => r.metrics.firstTokenLatency);
        const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
        const latencyVariance = latencies.reduce((sum, l) => sum + Math.pow(l - avgLatency, 2), 0) / latencies.length;
        const streamStability = Math.max(0, 1 - (Math.sqrt(latencyVariance) / avgLatency));
        // コンテンツ一貫性（トークン生成の安定性）
        const throughputs = validResults.map(r => r.metrics.throughput);
        const avgThroughput = throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length;
        const contentCoherence = avgThroughput > 5 ? 0.9 : 0.7; // 5 tokens/sec以上で高評価
        // リアルタイムスコア（初回トークンレイテンシベース）
        const realTimeScore = avgLatency < 500 ? 1.0 : (avgLatency < 1000 ? 0.8 : 0.5);
        return {
            streamStability,
            contentCoherence,
            realTimeScore
        };
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 ストリーミングレスポンステストモジュールをクリーンアップ中...');
        console.log('✅ ストリーミングレスポンステストモジュールのクリーンアップ完了');
    }
}
exports.StreamingResponseTestModule = StreamingResponseTestModule;
exports.default = StreamingResponseTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyZWFtaW5nLXJlc3BvbnNlLXRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdHJlYW1pbmctcmVzcG9uc2UtdGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVILDRFQUd5QztBQUd6Qyw4RUFBb0Y7QUFnQ3BGOztHQUVHO0FBQ0gsTUFBYSwyQkFBMkI7SUFDOUIsTUFBTSxDQUFtQjtJQUN6QixhQUFhLENBQXVCO0lBQ3BDLFNBQVMsQ0FBc0I7SUFFdkMsWUFBWSxNQUF3QjtRQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUVyQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksNkNBQW9CLENBQUM7WUFDNUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLFdBQVcsRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFO1NBQzVDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7SUFDakQsQ0FBQztJQUVEOztPQUVHO0lBQ0ssc0JBQXNCO1FBQzVCLE9BQU87WUFDTDtnQkFDRSxFQUFFLEVBQUUsa0JBQWtCO2dCQUN0QixJQUFJLEVBQUUsY0FBYztnQkFDcEIsTUFBTSxFQUFFLHlCQUF5QjtnQkFDakMsY0FBYyxFQUFFLEdBQUc7Z0JBQ25CLFVBQVUsRUFBRSxHQUFHO2dCQUNmLE9BQU8sRUFBRSx1QkFBdUI7YUFDakM7WUFDRDtnQkFDRSxFQUFFLEVBQUUsbUJBQW1CO2dCQUN2QixJQUFJLEVBQUUsY0FBYztnQkFDcEIsTUFBTSxFQUFFLGdGQUFnRjtnQkFDeEYsY0FBYyxFQUFFLEdBQUc7Z0JBQ25CLFVBQVUsRUFBRSxHQUFHO2dCQUNmLE9BQU8sRUFBRSxzQkFBc0I7YUFDaEM7WUFDRDtnQkFDRSxFQUFFLEVBQUUsaUJBQWlCO2dCQUNyQixJQUFJLEVBQUUsY0FBYztnQkFDcEIsTUFB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QUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUvRSxPQUFPO1lBQ0wsZUFBZTtZQUNmLGdCQUFnQjtZQUNoQixhQUFhO1NBQ2QsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLENBQUMsQ0FBQztJQUNsRCxDQUFDO0NBQ0Y7QUFoVkQsa0VBZ1ZDO0FBRUQsa0JBQWUsMkJBQTJCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOOCueODiOODquODvOODn+ODs+OCsOODrOOCueODneODs+OCueODhuOCueODiOODouOCuOODpeODvOODq1xuICogXG4gKiDjg6rjgqLjg6vjgr/jgqTjg6Djgrnjg4jjg6rjg7zjg5/jg7PjgrDlv5znrZTmqZ/og73jgpLmpJzoqLxcbiAqIOWun+acrOeVqkFtYXpvbiBCZWRyb2Nr44Gn44Gu44K544OI44Oq44O844Of44Oz44Kw5oCn6IO944KS44OG44K544OIXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQge1xuICBCZWRyb2NrUnVudGltZUNsaWVudCxcbiAgSW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW1Db21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1iZWRyb2NrLXJ1bnRpbWUnO1xuXG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCB7IFRlc3RSZXN1bHQsIFRlc3RFeGVjdXRpb25TdGF0dXMgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuXG4vKipcbiAqIOOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiOe1kOaenFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0cmVhbWluZ1Rlc3RSZXN1bHQgZXh0ZW5kcyBUZXN0UmVzdWx0IHtcbiAgc3RyZWFtaW5nTWV0cmljcz86IHtcbiAgICBmaXJzdFRva2VuTGF0ZW5jeTogbnVtYmVyO1xuICAgIGF2ZXJhZ2VUb2tlbkxhdGVuY3k6IG51bWJlcjtcbiAgICB0b3RhbFRva2VuczogbnVtYmVyO1xuICAgIHN0cmVhbUR1cmF0aW9uOiBudW1iZXI7XG4gICAgdGhyb3VnaHB1dDogbnVtYmVyO1xuICB9O1xuICBxdWFsaXR5TWV0cmljcz86IHtcbiAgICBzdHJlYW1TdGFiaWxpdHk6IG51bWJlcjtcbiAgICBjb250ZW50Q29oZXJlbmNlOiBudW1iZXI7XG4gICAgcmVhbFRpbWVTY29yZTogbnVtYmVyO1xuICB9O1xufVxuXG4vKipcbiAqIOOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiOOCseODvOOCuVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0cmVhbWluZ1Rlc3RDYXNlIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBwcm9tcHQ6IHN0cmluZztcbiAgZXhwZWN0ZWRUb2tlbnM6IG51bWJlcjtcbiAgbWF4TGF0ZW5jeTogbnVtYmVyO1xuICBtb2RlbElkOiBzdHJpbmc7XG59XG5cbi8qKlxuICog44K544OI44Oq44O844Of44Oz44Kw44Os44K544Od44Oz44K544OG44K544OI44Oi44K444Ol44O844OrXG4gKi9cbmV4cG9ydCBjbGFzcyBTdHJlYW1pbmdSZXNwb25zZVRlc3RNb2R1bGUge1xuICBwcml2YXRlIGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZztcbiAgcHJpdmF0ZSBiZWRyb2NrQ2xpZW50OiBCZWRyb2NrUnVudGltZUNsaWVudDtcbiAgcHJpdmF0ZSB0ZXN0Q2FzZXM6IFN0cmVhbWluZ1Rlc3RDYXNlW107XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgXG4gICAgdGhpcy5iZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tSdW50aW1lQ2xpZW50KHtcbiAgICAgIHJlZ2lvbjogY29uZmlnLnJlZ2lvbixcbiAgICAgIGNyZWRlbnRpYWxzOiB7IHByb2ZpbGU6IGNvbmZpZy5hd3NQcm9maWxlIH1cbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLnRlc3RDYXNlcyA9IHRoaXMubG9hZFN0cmVhbWluZ1Rlc3RDYXNlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiOOCseODvOOCueOBruiqreOBv+i+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBsb2FkU3RyZWFtaW5nVGVzdENhc2VzKCk6IFN0cmVhbWluZ1Rlc3RDYXNlW10ge1xuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnc3RyZWFtLXNob3J0LTAwMScsXG4gICAgICAgIG5hbWU6ICfnn63mlofjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4gnLFxuICAgICAgICBwcm9tcHQ6ICdSQUfjgrfjgrnjg4bjg6DjgavjgaTjgYTjgabnsKHmvZTjgavoqqzmmI7jgZfjgabjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICBleHBlY3RlZFRva2VuczogMTAwLFxuICAgICAgICBtYXhMYXRlbmN5OiA1MDAsXG4gICAgICAgIG1vZGVsSWQ6ICdhbWF6b24ubm92YS1saXRlLXYxOjAnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ3N0cmVhbS1tZWRpdW0tMDAxJyxcbiAgICAgICAgbmFtZTogJ+S4reaWh+OCueODiOODquODvOODn+ODs+OCsOODhuOCueODiCcsXG4gICAgICAgIHByb21wdDogJ0FtYXpvbiBGU3ggZm9yIE5ldEFwcCBPTlRBUOOBqEFtYXpvbiBCZWRyb2Nr44KS57WE44G/5ZCI44KP44Gb44GfUkFH44K344K544OG44Og44Gu5oqA6KGT55qE5Yip54K544Gr44Gk44GE44Gm6Kmz44GX44GP6Kqs5piO44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgZXhwZWN0ZWRUb2tlbnM6IDMwMCxcbiAgICAgICAgbWF4TGF0ZW5jeTogODAwLFxuICAgICAgICBtb2RlbElkOiAnYW1hem9uLm5vdmEtcHJvLXYxOjAnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ3N0cmVhbS1sb25nLTAwMScsXG4gICAgICAgIG5hbWU6ICfplbfmlofjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4gnLFxuICAgICAgICBwcm9tcHQ6ICfjgqjjg7Pjgr/jg7zjg5fjg6njgqTjgrrnkrDlooPjgavjgYrjgZHjgovmqKnpmZDoqo3orZjlnotSQUfjgrfjgrnjg4bjg6Djga7oqK3oqIjljp/liYfjgIHlrp/oo4Xmlrnms5XjgIHpgYvnlKjkuIrjga7ogIPmha7kuovpoIXjgavjgaTjgYTjgabjgIHlhbfkvZPkvovjgpLkuqTjgYjjgarjgYzjgonljIXmi6znmoTjgavoqqzmmI7jgZfjgabjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICBleHBlY3RlZFRva2VuczogNTAwLFxuICAgICAgICBtYXhMYXRlbmN5OiAxMjAwLFxuICAgICAgICBtb2RlbElkOiAnYW1hem9uLm5vdmEtcHJvLXYxOjAnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ3N0cmVhbS1yZWFsdGltZS0wMDEnLFxuICAgICAgICBuYW1lOiAn44Oq44Ki44Or44K/44Kk44Og5b+c562U44OG44K544OIJyxcbiAgICAgICAgcHJvbXB0OiAn44OB44Oj44OD44OI44Oc44OD44OI44Gn44KI44GP44GC44KL6LOq5ZWP44Gr562U44GI44Gm44GP44Gg44GV44GE77ya44CM44GT44Gu44K344K544OG44Og44Gv44Gp44Gu44KI44GG44Gr5YuV5L2c44GX44G+44GZ44GL77yf44CNJyxcbiAgICAgICAgZXhwZWN0ZWRUb2tlbnM6IDE1MCxcbiAgICAgICAgbWF4TGF0ZW5jeTogMzAwLFxuICAgICAgICBtb2RlbElkOiAnYW1hem9uLm5vdmEtbWljcm8tdjE6MCdcbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIOWMheaLrOeahOOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiFxuICAgKi9cbiAgYXN5bmMgdGVzdENvbXByZWhlbnNpdmVTdHJlYW1pbmcoKTogUHJvbWlzZTxTdHJlYW1pbmdUZXN0UmVzdWx0PiB7XG4gICAgY29uc3QgdGVzdElkID0gJ3N0cmVhbWluZy1jb21wcmVoZW5zaXZlLTAwMSc7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygn8J+ToSDljIXmi6znmoTjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4jjgpLplovlp4suLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgICAvLyDlkITjg4bjgrnjg4jjgrHjg7zjgrnjgpLlrp/ooYxcbiAgICAgIGZvciAoY29uc3QgdGVzdENhc2Ugb2YgdGhpcy50ZXN0Q2FzZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiOWun+ihjOS4rTogJHt0ZXN0Q2FzZS5uYW1lfWApO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgY2FzZVJlc3VsdCA9IGF3YWl0IHRoaXMuZXhlY3V0ZVN0cmVhbWluZ1Rlc3QodGVzdENhc2UpO1xuICAgICAgICByZXN1bHRzLnB1c2goY2FzZVJlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIC8vIOe3j+WQiOODoeODiOODquOCr+OCueOCkuioiOeul1xuICAgICAgY29uc3QgYWdncmVnYXRlZE1ldHJpY3MgPSB0aGlzLmFnZ3JlZ2F0ZVN0cmVhbWluZ01ldHJpY3MocmVzdWx0cyk7XG4gICAgICBjb25zdCBxdWFsaXR5TWV0cmljcyA9IHRoaXMuZXZhbHVhdGVTdHJlYW1pbmdRdWFsaXR5KHJlc3VsdHMpO1xuXG4gICAgICBjb25zdCBzdWNjZXNzID0gYWdncmVnYXRlZE1ldHJpY3MuZmlyc3RUb2tlbkxhdGVuY3kgPCA1MDAgJiYgXG4gICAgICAgICAgICAgICAgICAgICBxdWFsaXR5TWV0cmljcy5yZWFsVGltZVNjb3JlID4gMC44O1xuXG4gICAgICBjb25zdCByZXN1bHQ6IFN0cmVhbWluZ1Rlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfljIXmi6znmoTjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3N0cmVhbWluZycsXG4gICAgICAgIHN0YXR1czogc3VjY2VzcyA/IFRlc3RFeGVjdXRpb25TdGF0dXMuQ09NUExFVEVEIDogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgIHN0cmVhbWluZ01ldHJpY3M6IGFnZ3JlZ2F0ZWRNZXRyaWNzLFxuICAgICAgICBxdWFsaXR5TWV0cmljcyxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICB0ZXN0Q2FzZUNvdW50OiB0aGlzLnRlc3RDYXNlcy5sZW5ndGgsXG4gICAgICAgICAgdGVzdFJlc3VsdHM6IHJlc3VsdHNcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+KchSDljIXmi6znmoTjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4jmiJDlip8nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDljIXmi6znmoTjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4jlpLHmlZcnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg5YyF5ous55qE44K544OI44Oq44O844Of44Oz44Kw44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ+WMheaLrOeahOOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnc3RyZWFtaW5nJyxcbiAgICAgICAgc3RhdHVzOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOWAi+WIpeOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlU3RyZWFtaW5nVGVzdCh0ZXN0Q2FzZTogU3RyZWFtaW5nVGVzdENhc2UpOiBQcm9taXNlPHtcbiAgICB0ZXN0Q2FzZTogU3RyZWFtaW5nVGVzdENhc2U7XG4gICAgbWV0cmljczogYW55O1xuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XG4gIH0+IHtcbiAgICB0cnkge1xuICAgICAgLy8g6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44Gn44Gv5qih5pOs57WQ5p6c44KS6L+U44GZXG4gICAgICBpZiAodGhpcy5jb25maWcucmVhZE9ubHlNb2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlTW9ja1N0cmVhbWluZ1Jlc3VsdCh0ZXN0Q2FzZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIOWun+mam+OBruOCueODiOODquODvOODn+ODs+OCsOaOqOirllxuICAgICAgY29uc3Qgc3RyZWFtaW5nUmVzdWx0ID0gYXdhaXQgdGhpcy5wZXJmb3JtU3RyZWFtaW5nSW5mZXJlbmNlKHRlc3RDYXNlKTtcbiAgICAgIFxuICAgICAgY29uc3Qgc3VjY2VzcyA9IHN0cmVhbWluZ1Jlc3VsdC5maXJzdFRva2VuTGF0ZW5jeSA8PSB0ZXN0Q2FzZS5tYXhMYXRlbmN5O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0Q2FzZSxcbiAgICAgICAgbWV0cmljczogc3RyZWFtaW5nUmVzdWx0LFxuICAgICAgICBzdWNjZXNzXG4gICAgICB9O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCDjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7wgKCR7dGVzdENhc2UuaWR9KTpgLCBlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0Q2FzZSxcbiAgICAgICAgbWV0cmljczogbnVsbCxcbiAgICAgICAgc3VjY2VzczogZmFsc2VcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOOCueODiOODquODvOODn+ODs+OCsOaOqOirluWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtU3RyZWFtaW5nSW5mZXJlbmNlKHRlc3RDYXNlOiBTdHJlYW1pbmdUZXN0Q2FzZSk6IFByb21pc2U8e1xuICAgIGZpcnN0VG9rZW5MYXRlbmN5OiBudW1iZXI7XG4gICAgYXZlcmFnZVRva2VuTGF0ZW5jeTogbnVtYmVyO1xuICAgIHRvdGFsVG9rZW5zOiBudW1iZXI7XG4gICAgc3RyZWFtRHVyYXRpb246IG51bWJlcjtcbiAgICB0aHJvdWdocHV0OiBudW1iZXI7XG4gICAgdG9rZW5zOiBzdHJpbmdbXTtcbiAgfT4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgbGV0IGZpcnN0VG9rZW5UaW1lOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBjb25zdCB0b2tlblRpbWVzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IHRva2Vuczogc3RyaW5nW10gPSBbXTtcblxuICAgIGNvbnN0IHJlcXVlc3RCb2R5ID0ge1xuICAgICAgaW5wdXRUZXh0OiB0ZXN0Q2FzZS5wcm9tcHQsXG4gICAgICB0ZXh0R2VuZXJhdGlvbkNvbmZpZzoge1xuICAgICAgICBtYXhUb2tlbkNvdW50OiB0ZXN0Q2FzZS5leHBlY3RlZFRva2VucyAqIDIsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgICAgIHRvcFA6IDAuOVxuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBjb21tYW5kID0gbmV3IEludm9rZU1vZGVsV2l0aFJlc3BvbnNlU3RyZWFtQ29tbWFuZCh7XG4gICAgICBtb2RlbElkOiB0ZXN0Q2FzZS5tb2RlbElkLFxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIGFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdEJvZHkpXG4gICAgfSk7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuYmVkcm9ja0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgIFxuICAgIGlmIChyZXNwb25zZS5ib2R5KSB7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlc3BvbnNlLmJvZHkpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNodW5rLmNodW5rPy5ieXRlcykge1xuICAgICAgICAgIGNvbnN0IGNodW5rRGF0YSA9IEpTT04ucGFyc2UobmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGNodW5rLmNodW5rLmJ5dGVzKSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGNodW5rRGF0YS5vdXRwdXRUZXh0KSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RUb2tlblRpbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgZmlyc3RUb2tlblRpbWUgPSBjdXJyZW50VGltZSAtIHN0YXJ0VGltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdG9rZW5UaW1lcy5wdXNoKGN1cnJlbnRUaW1lIC0gc3RhcnRUaW1lKTtcbiAgICAgICAgICAgIHRva2Vucy5wdXNoKGNodW5rRGF0YS5vdXRwdXRUZXh0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBlbmRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBzdHJlYW1EdXJhdGlvbiA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgY29uc3QgYXZlcmFnZVRva2VuTGF0ZW5jeSA9IHRva2VuVGltZXMubGVuZ3RoID4gMCA/IFxuICAgICAgdG9rZW5UaW1lcy5yZWR1Y2UoKHN1bSwgdGltZSkgPT4gc3VtICsgdGltZSwgMCkgLyB0b2tlblRpbWVzLmxlbmd0aCA6IDA7XG4gICAgY29uc3QgdGhyb3VnaHB1dCA9IHRva2Vucy5sZW5ndGggLyAoc3RyZWFtRHVyYXRpb24gLyAxMDAwKTsgLy8gdG9rZW5zIHBlciBzZWNvbmRcblxuICAgIHJldHVybiB7XG4gICAgICBmaXJzdFRva2VuTGF0ZW5jeTogZmlyc3RUb2tlblRpbWUgfHwgc3RyZWFtRHVyYXRpb24sXG4gICAgICBhdmVyYWdlVG9rZW5MYXRlbmN5LFxuICAgICAgdG90YWxUb2tlbnM6IHRva2Vucy5sZW5ndGgsXG4gICAgICBzdHJlYW1EdXJhdGlvbixcbiAgICAgIHRocm91Z2hwdXQsXG4gICAgICB0b2tlbnNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOaooeaTrOOCueODiOODquODvOODn+ODs+OCsOe1kOaenOeUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZU1vY2tTdHJlYW1pbmdSZXN1bHQodGVzdENhc2U6IFN0cmVhbWluZ1Rlc3RDYXNlKToge1xuICAgIHRlc3RDYXNlOiBTdHJlYW1pbmdUZXN0Q2FzZTtcbiAgICBtZXRyaWNzOiBhbnk7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgfSB7XG4gICAgY29uc3QgbW9ja01ldHJpY3MgPSB7XG4gICAgICBmaXJzdFRva2VuTGF0ZW5jeTogTWF0aC5yYW5kb20oKSAqIHRlc3RDYXNlLm1heExhdGVuY3kgKiAwLjgsIC8vIDgwJeS7peWGhVxuICAgICAgYXZlcmFnZVRva2VuTGF0ZW5jeTogTWF0aC5yYW5kb20oKSAqIDEwMCArIDUwLFxuICAgICAgdG90YWxUb2tlbnM6IHRlc3RDYXNlLmV4cGVjdGVkVG9rZW5zICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNTApLFxuICAgICAgc3RyZWFtRHVyYXRpb246IE1hdGgucmFuZG9tKCkgKiAyMDAwICsgMTAwMCxcbiAgICAgIHRocm91Z2hwdXQ6IE1hdGgucmFuZG9tKCkgKiAyMCArIDEwLFxuICAgICAgdG9rZW5zOiBBcnJheSh0ZXN0Q2FzZS5leHBlY3RlZFRva2VucykuZmlsbCgn5qih5pOs44OI44O844Kv44OzJylcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRlc3RDYXNlLFxuICAgICAgbWV0cmljczogbW9ja01ldHJpY3MsXG4gICAgICBzdWNjZXNzOiBtb2NrTWV0cmljcy5maXJzdFRva2VuTGF0ZW5jeSA8PSB0ZXN0Q2FzZS5tYXhMYXRlbmN5XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg6Hjg4jjg6rjgq/jgrnpm4bntIRcbiAgICovXG4gIHByaXZhdGUgYWdncmVnYXRlU3RyZWFtaW5nTWV0cmljcyhyZXN1bHRzOiBhbnlbXSk6IHtcbiAgICBmaXJzdFRva2VuTGF0ZW5jeTogbnVtYmVyO1xuICAgIGF2ZXJhZ2VUb2tlbkxhdGVuY3k6IG51bWJlcjtcbiAgICB0b3RhbFRva2VuczogbnVtYmVyO1xuICAgIHN0cmVhbUR1cmF0aW9uOiBudW1iZXI7XG4gICAgdGhyb3VnaHB1dDogbnVtYmVyO1xuICB9IHtcbiAgICBjb25zdCB2YWxpZFJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3VjY2VzcyAmJiByLm1ldHJpY3MpO1xuICAgIFxuICAgIGlmICh2YWxpZFJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBmaXJzdFRva2VuTGF0ZW5jeTogMCxcbiAgICAgICAgYXZlcmFnZVRva2VuTGF0ZW5jeTogMCxcbiAgICAgICAgdG90YWxUb2tlbnM6IDAsXG4gICAgICAgIHN0cmVhbUR1cmF0aW9uOiAwLFxuICAgICAgICB0aHJvdWdocHV0OiAwXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IGF2Z0ZpcnN0VG9rZW5MYXRlbmN5ID0gdmFsaWRSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLm1ldHJpY3MuZmlyc3RUb2tlbkxhdGVuY3ksIDApIC8gdmFsaWRSZXN1bHRzLmxlbmd0aDtcbiAgICBjb25zdCBhdmdUb2tlbkxhdGVuY3kgPSB2YWxpZFJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIubWV0cmljcy5hdmVyYWdlVG9rZW5MYXRlbmN5LCAwKSAvIHZhbGlkUmVzdWx0cy5sZW5ndGg7XG4gICAgY29uc3QgdG90YWxUb2tlbnMgPSB2YWxpZFJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIubWV0cmljcy50b3RhbFRva2VucywgMCk7XG4gICAgY29uc3QgYXZnU3RyZWFtRHVyYXRpb24gPSB2YWxpZFJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIubWV0cmljcy5zdHJlYW1EdXJhdGlvbiwgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuICAgIGNvbnN0IGF2Z1Rocm91Z2hwdXQgPSB2YWxpZFJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIubWV0cmljcy50aHJvdWdocHV0LCAwKSAvIHZhbGlkUmVzdWx0cy5sZW5ndGg7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmlyc3RUb2tlbkxhdGVuY3k6IGF2Z0ZpcnN0VG9rZW5MYXRlbmN5LFxuICAgICAgYXZlcmFnZVRva2VuTGF0ZW5jeTogYXZnVG9rZW5MYXRlbmN5LFxuICAgICAgdG90YWxUb2tlbnMsXG4gICAgICBzdHJlYW1EdXJhdGlvbjogYXZnU3RyZWFtRHVyYXRpb24sXG4gICAgICB0aHJvdWdocHV0OiBhdmdUaHJvdWdocHV0XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjg4jjg6rjg7zjg5/jg7PjgrDlk4Hos6roqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVTdHJlYW1pbmdRdWFsaXR5KHJlc3VsdHM6IGFueVtdKToge1xuICAgIHN0cmVhbVN0YWJpbGl0eTogbnVtYmVyO1xuICAgIGNvbnRlbnRDb2hlcmVuY2U6IG51bWJlcjtcbiAgICByZWFsVGltZVNjb3JlOiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IHZhbGlkUmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzICYmIHIubWV0cmljcyk7XG4gICAgXG4gICAgaWYgKHZhbGlkUmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0cmVhbVN0YWJpbGl0eTogMCxcbiAgICAgICAgY29udGVudENvaGVyZW5jZTogMCxcbiAgICAgICAgcmVhbFRpbWVTY29yZTogMFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDjgrnjg4jjg6rjg7zjg6DlronlrprmgKfvvIjjg6zjgqTjg4bjg7Pjgrfjga7kuIDosqvmgKfvvIlcbiAgICBjb25zdCBsYXRlbmNpZXMgPSB2YWxpZFJlc3VsdHMubWFwKHIgPT4gci5tZXRyaWNzLmZpcnN0VG9rZW5MYXRlbmN5KTtcbiAgICBjb25zdCBhdmdMYXRlbmN5ID0gbGF0ZW5jaWVzLnJlZHVjZSgoc3VtLCBsKSA9PiBzdW0gKyBsLCAwKSAvIGxhdGVuY2llcy5sZW5ndGg7XG4gICAgY29uc3QgbGF0ZW5jeVZhcmlhbmNlID0gbGF0ZW5jaWVzLnJlZHVjZSgoc3VtLCBsKSA9PiBzdW0gKyBNYXRoLnBvdyhsIC0gYXZnTGF0ZW5jeSwgMiksIDApIC8gbGF0ZW5jaWVzLmxlbmd0aDtcbiAgICBjb25zdCBzdHJlYW1TdGFiaWxpdHkgPSBNYXRoLm1heCgwLCAxIC0gKE1hdGguc3FydChsYXRlbmN5VmFyaWFuY2UpIC8gYXZnTGF0ZW5jeSkpO1xuXG4gICAgLy8g44Kz44Oz44OG44Oz44OE5LiA6LKr5oCn77yI44OI44O844Kv44Oz55Sf5oiQ44Gu5a6J5a6a5oCn77yJXG4gICAgY29uc3QgdGhyb3VnaHB1dHMgPSB2YWxpZFJlc3VsdHMubWFwKHIgPT4gci5tZXRyaWNzLnRocm91Z2hwdXQpO1xuICAgIGNvbnN0IGF2Z1Rocm91Z2hwdXQgPSB0aHJvdWdocHV0cy5yZWR1Y2UoKHN1bSwgdCkgPT4gc3VtICsgdCwgMCkgLyB0aHJvdWdocHV0cy5sZW5ndGg7XG4gICAgY29uc3QgY29udGVudENvaGVyZW5jZSA9IGF2Z1Rocm91Z2hwdXQgPiA1ID8gMC45IDogMC43OyAvLyA1IHRva2Vucy9zZWPku6XkuIrjgafpq5joqZXkvqFcblxuICAgIC8vIOODquOCouODq+OCv+OCpOODoOOCueOCs+OCou+8iOWIneWbnuODiOODvOOCr+ODs+ODrOOCpOODhuODs+OCt+ODmeODvOOCue+8iVxuICAgIGNvbnN0IHJlYWxUaW1lU2NvcmUgPSBhdmdMYXRlbmN5IDwgNTAwID8gMS4wIDogKGF2Z0xhdGVuY3kgPCAxMDAwID8gMC44IDogMC41KTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdHJlYW1TdGFiaWxpdHksXG4gICAgICBjb250ZW50Q29oZXJlbmNlLFxuICAgICAgcmVhbFRpbWVTY29yZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44Oq44K944O844K544Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAqL1xuICBhc3luYyBjbGVhbnVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn6e5IOOCueODiOODquODvOODn+ODs+OCsOODrOOCueODneODs+OCueODhuOCueODiOODouOCuOODpeODvOODq+OCkuOCr+ODquODvOODs+OCouODg+ODl+S4rS4uLicpO1xuICAgIGNvbnNvbGUubG9nKCfinIUg44K544OI44Oq44O844Of44Oz44Kw44Os44K544Od44Oz44K544OG44K544OI44Oi44K444Ol44O844Or44Gu44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU3RyZWFtaW5nUmVzcG9uc2VUZXN0TW9kdWxlOyJdfQ==