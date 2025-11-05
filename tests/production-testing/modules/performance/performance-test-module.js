"use strict";
/**
 * パフォーマンステストモジュール
 *
 * 実本番環境での応答時間とスループットの測定
 * 負荷テストと同時ユーザー対応能力の検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTestModule = void 0;
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * パフォーマンステストモジュールクラス
 */
class PerformanceTestModule {
    config;
    cloudWatchClient;
    cloudFrontClient;
    lambdaClient;
    testScenarios;
    constructor(config) {
        this.config = config;
        const clientConfig = {
            region: config.region,
            credentials: { profile: config.awsProfile }
        };
        this.cloudWatchClient = new client_cloudwatch_1.CloudWatchClient(clientConfig);
        this.cloudFrontClient = new client_cloudfront_1.CloudFrontClient(clientConfig);
        this.lambdaClient = new client_lambda_1.LambdaClient(clientConfig);
        // テストシナリオの初期化
        this.testScenarios = this.loadTestScenarios();
    }
    /**
     * テストシナリオの読み込み
     */
    loadTestScenarios() {
        const baseUrl = this.config.resources.cloudFrontDomain || 'https://example.cloudfront.net';
        return [
            {
                id: 'homepage-load',
                name: 'ホームページ読み込み',
                description: '初期画面の表示時間測定',
                endpoint: `${baseUrl}/`,
                method: 'GET',
                expectedResponseTime: 2000,
                weight: 0.3
            },
            {
                id: 'chat-interface',
                name: 'チャットインターフェース',
                description: 'チャット画面の表示時間測定',
                endpoint: `${baseUrl}/chat`,
                method: 'GET',
                expectedResponseTime: 3000,
                weight: 0.4
            },
            {
                id: 'api-chat-message',
                name: 'チャットメッセージ送信',
                description: 'チャットメッセージのAPI応答時間',
                endpoint: `${baseUrl}/api/chat`,
                method: 'POST',
                payload: {
                    message: 'こんにちは。システムについて教えてください。',
                    sessionId: 'test-session-001'
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                expectedResponseTime: 8000,
                weight: 0.2
            },
            {
                id: 'document-search',
                name: '文書検索API',
                description: '文書検索の応答時間測定',
                endpoint: `${baseUrl}/api/search`,
                method: 'POST',
                payload: {
                    query: 'NetApp ストレージ',
                    limit: 10
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                expectedResponseTime: 5000,
                weight: 0.1
            }
        ];
    }
    /**
     * 応答時間測定テスト
     */
    async testResponseTime() {
        const testId = 'performance-response-time-001';
        const startTime = Date.now();
        console.log('⏱️ 応答時間測定テストを開始...');
        try {
            const responseTimeResults = [];
            for (const scenario of this.testScenarios) {
                console.log(`📊 シナリオ実行中: ${scenario.name}`);
                const scenarioResults = await this.measureScenarioResponseTime(scenario, 5); // 5回測定
                responseTimeResults.push({
                    scenario: scenario.name,
                    ...scenarioResults
                });
            }
            // 全体的なパフォーマンス指標の計算
            const overallMetrics = this.calculateOverallMetrics(responseTimeResults);
            const success = overallMetrics.averageLatency <= 5000 && // 5秒以内
                overallMetrics.successRate >= 0.95; // 95%以上成功
            const result = {
                testId,
                testName: '応答時間測定テスト',
                category: 'performance',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                performanceMetrics: {
                    responseTime: overallMetrics.averageLatency,
                    throughput: overallMetrics.throughput,
                    concurrentUsers: 1,
                    successRate: overallMetrics.successRate,
                    errorRate: 1 - overallMetrics.successRate,
                    averageLatency: overallMetrics.averageLatency,
                    p95Latency: overallMetrics.p95Latency,
                    p99Latency: overallMetrics.p99Latency
                },
                metadata: {
                    scenarioResults: responseTimeResults,
                    testScenarios: this.testScenarios.map(s => ({
                        id: s.id,
                        name: s.name,
                        expectedResponseTime: s.expectedResponseTime
                    }))
                }
            };
            if (success) {
                console.log('✅ 応答時間測定テスト成功');
                console.log(`   平均応答時間: ${overallMetrics.averageLatency.toFixed(0)}ms`);
                console.log(`   成功率: ${(overallMetrics.successRate * 100).toFixed(1)}%`);
            }
            else {
                console.error('❌ 応答時間測定テスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 応答時間測定テスト実行エラー:', error);
            return {
                testId,
                testName: '応答時間測定テスト',
                category: 'performance',
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
     * 同時ユーザー負荷テスト
     */
    async testConcurrentUserLoad() {
        const testId = 'performance-concurrent-load-001';
        const startTime = Date.now();
        console.log('👥 同時ユーザー負荷テストを開始...');
        try {
            const loadTestConfig = {
                concurrentUsers: 25,
                testDuration: 60000, // 60秒
                rampUpTime: 10000, // 10秒でランプアップ
                requestInterval: 2000, // 2秒間隔
                maxRequests: 1000
            };
            const loadTestResults = await this.executeConcurrentLoadTest(loadTestConfig);
            // CloudWatchメトリクスの取得
            const cloudWatchMetrics = await this.getCloudWatchMetrics();
            const success = loadTestResults.successRate >= 0.9 && // 90%以上成功
                loadTestResults.averageResponseTime <= 10000; // 10秒以内
            const result = {
                testId,
                testName: '同時ユーザー負荷テスト',
                category: 'performance',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                performanceMetrics: {
                    responseTime: loadTestResults.averageResponseTime,
                    throughput: loadTestResults.requestsPerSecond,
                    concurrentUsers: loadTestConfig.concurrentUsers,
                    successRate: loadTestResults.successRate,
                    errorRate: 1 - loadTestResults.successRate,
                    averageLatency: loadTestResults.averageResponseTime,
                    p95Latency: loadTestResults.maxResponseTime * 0.95, // 簡略化
                    p99Latency: loadTestResults.maxResponseTime * 0.99 // 簡略化
                },
                loadTestResults: loadTestResults,
                resourceUsage: cloudWatchMetrics,
                metadata: {
                    loadTestConfig: loadTestConfig,
                    testDuration: loadTestConfig.testDuration,
                    rampUpTime: loadTestConfig.rampUpTime
                }
            };
            if (success) {
                console.log('✅ 同時ユーザー負荷テスト成功');
                console.log(`   同時ユーザー数: ${loadTestConfig.concurrentUsers}`);
                console.log(`   成功率: ${(loadTestResults.successRate * 100).toFixed(1)}%`);
                console.log(`   平均応答時間: ${loadTestResults.averageResponseTime.toFixed(0)}ms`);
                console.log(`   スループット: ${loadTestResults.requestsPerSecond.toFixed(1)} req/sec`);
            }
            else {
                console.error('❌ 同時ユーザー負荷テスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 同時ユーザー負荷テスト実行エラー:', error);
            return {
                testId,
                testName: '同時ユーザー負荷テスト',
                category: 'performance',
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
     * スケーラビリティテスト
     */
    async testScalability() {
        const testId = 'performance-scalability-001';
        const startTime = Date.now();
        console.log('📈 スケーラビリティテストを開始...');
        try {
            const userLevels = [5, 10, 15, 20, 25]; // 段階的にユーザー数を増加
            const scalabilityResults = [];
            for (const userCount of userLevels) {
                console.log(`📊 ${userCount}ユーザーでの負荷テスト実行中...`);
                const loadConfig = {
                    concurrentUsers: userCount,
                    testDuration: 30000, // 30秒
                    rampUpTime: 5000, // 5秒
                    requestInterval: 3000, // 3秒間隔
                    maxRequests: 200
                };
                const levelResult = await this.executeConcurrentLoadTest(loadConfig);
                scalabilityResults.push({
                    userCount,
                    ...levelResult
                });
                // 次のレベルまで少し待機
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            // スケーラビリティ分析
            const scalabilityAnalysis = this.analyzeScalability(scalabilityResults);
            const success = scalabilityAnalysis.maxConcurrentUsers >= 20 && // 20ユーザー以上対応
                scalabilityAnalysis.degradationPoint >= 15; // 15ユーザーまで性能維持
            const result = {
                testId,
                testName: 'スケーラビリティテスト',
                category: 'performance',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                scalabilityMetrics: {
                    maxConcurrentUsers: scalabilityAnalysis.maxConcurrentUsers,
                    degradationPoint: scalabilityAnalysis.degradationPoint,
                    recoveryTime: scalabilityAnalysis.recoveryTime
                },
                metadata: {
                    userLevels: userLevels,
                    scalabilityResults: scalabilityResults,
                    scalabilityAnalysis: scalabilityAnalysis
                }
            };
            if (success) {
                console.log('✅ スケーラビリティテスト成功');
                console.log(`   最大同時ユーザー数: ${scalabilityAnalysis.maxConcurrentUsers}`);
                console.log(`   性能劣化開始点: ${scalabilityAnalysis.degradationPoint}ユーザー`);
            }
            else {
                console.error('❌ スケーラビリティテスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ スケーラビリティテスト実行エラー:', error);
            return {
                testId,
                testName: 'スケーラビリティテスト',
                category: 'performance',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
exports.PerformanceTestModule = PerformanceTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybWFuY2UtdGVzdC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwZXJmb3JtYW5jZS10ZXN0LW1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVILGtFQUtvQztBQUVwQyxrRUFHb0M7QUFFcEMsMERBSWdDO0FBR2hDLDhFQUFvRjtBQWdFcEY7O0dBRUc7QUFDSCxNQUFhLHFCQUFxQjtJQUN4QixNQUFNLENBQW1CO0lBQ3pCLGdCQUFnQixDQUFtQjtJQUNuQyxnQkFBZ0IsQ0FBbUI7SUFDbkMsWUFBWSxDQUFlO0lBQzNCLGFBQWEsQ0FBNEI7SUFFakQsWUFBWSxNQUF3QjtRQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUVyQixNQUFNLFlBQVksR0FBRztZQUNuQixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsV0FBVyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUU7U0FDNUMsQ0FBQztRQUVGLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLG9DQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLG9DQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRW5ELGNBQWM7UUFDZCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0lBQ2hELENBQUM7SUFFRDs7T0FFRztJQUNLLGlCQUFpQjtRQUN2QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsSUFBSSxnQ0FBZ0MsQ0FBQztRQUUzRixPQUFPO1lBQ0w7Z0JBQ0UsRUFBRSxFQUFFLGVBQWU7Z0JBQ25CLElBQUksRUFBRSxZQUFZO2dCQUNsQixX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QUMsQ0FBQztnQkFDdkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLG1CQUFtQixDQUFDLGdCQUFnQixNQUFNLENBQUMsQ0FBQztZQUN6RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUVoQixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFNUMsT0FBTztnQkFDTCxNQUFNO2dCQUNOLFFBQVEsRUFBRSxhQUFhO2dCQUN2QixRQUFRLEVBQUUsYUFBYTtnQkFDdkIsTUFBTSxFQUFFLDRDQUFtQixDQUFDLE1BQU07Z0JBQ2xDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQzlCLE9BQU8sRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDbkIsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTO2dCQUNoQyxPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQzthQUM5RCxDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7Q0FDRjtBQWpWRCxzREFpVkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOODouOCuOODpeODvOODq1xuICogXG4gKiDlrp/mnKznlarnkrDlooPjgafjga7lv5znrZTmmYLplpPjgajjgrnjg6vjg7zjg5fjg4Pjg4jjga7muKzlrppcbiAqIOiyoOiNt+ODhuOCueODiOOBqOWQjOaZguODpuODvOOCtuODvOWvvuW/nOiDveWKm+OBruaknOiovFxuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0IHtcbiAgQ2xvdWRXYXRjaENsaWVudCxcbiAgR2V0TWV0cmljU3RhdGlzdGljc0NvbW1hbmQsXG4gIFB1dE1ldHJpY0RhdGFDb21tYW5kLFxuICBNZXRyaWNEYXR1bVxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtY2xvdWR3YXRjaCc7XG5cbmltcG9ydCB7XG4gIENsb3VkRnJvbnRDbGllbnQsXG4gIEdldERpc3RyaWJ1dGlvbkNvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWNsb3VkZnJvbnQnO1xuXG5pbXBvcnQge1xuICBMYW1iZGFDbGllbnQsXG4gIEdldEZ1bmN0aW9uQ29tbWFuZCxcbiAgSW52b2tlQ29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtbGFtYmRhJztcblxuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5pbXBvcnQgeyBUZXN0UmVzdWx0LCBUZXN0RXhlY3V0aW9uU3RhdHVzIH0gZnJvbSAnLi4vLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcblxuLyoqXG4gKiDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jntZDmnpzjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQZXJmb3JtYW5jZVRlc3RSZXN1bHQgZXh0ZW5kcyBUZXN0UmVzdWx0IHtcbiAgcGVyZm9ybWFuY2VNZXRyaWNzPzoge1xuICAgIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIHRocm91Z2hwdXQ6IG51bWJlcjtcbiAgICBjb25jdXJyZW50VXNlcnM6IG51bWJlcjtcbiAgICBzdWNjZXNzUmF0ZTogbnVtYmVyO1xuICAgIGVycm9yUmF0ZTogbnVtYmVyO1xuICAgIGF2ZXJhZ2VMYXRlbmN5OiBudW1iZXI7XG4gICAgcDk1TGF0ZW5jeTogbnVtYmVyO1xuICAgIHA5OUxhdGVuY3k6IG51bWJlcjtcbiAgfTtcbiAgbG9hZFRlc3RSZXN1bHRzPzoge1xuICAgIHRvdGFsUmVxdWVzdHM6IG51bWJlcjtcbiAgICBzdWNjZXNzZnVsUmVxdWVzdHM6IG51bWJlcjtcbiAgICBmYWlsZWRSZXF1ZXN0czogbnVtYmVyO1xuICAgIHJlcXVlc3RzUGVyU2Vjb25kOiBudW1iZXI7XG4gICAgYXZlcmFnZVJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIG1heFJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIG1pblJlc3BvbnNlVGltZTogbnVtYmVyO1xuICB9O1xuICByZXNvdXJjZVVzYWdlPzoge1xuICAgIGNwdVV0aWxpemF0aW9uOiBudW1iZXI7XG4gICAgbWVtb3J5VXRpbGl6YXRpb246IG51bWJlcjtcbiAgICBuZXR3b3JrSU86IG51bWJlcjtcbiAgICBkaXNrSU86IG51bWJlcjtcbiAgfTtcbiAgc2NhbGFiaWxpdHlNZXRyaWNzPzoge1xuICAgIG1heENvbmN1cnJlbnRVc2VyczogbnVtYmVyO1xuICAgIGRlZ3JhZGF0aW9uUG9pbnQ6IG51bWJlcjtcbiAgICByZWNvdmVyeVRpbWU6IG51bWJlcjtcbiAgfTtcbn1cblxuLyoqXG4gKiDosqDojbfjg4bjgrnjg4joqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMb2FkVGVzdENvbmZpZyB7XG4gIGNvbmN1cnJlbnRVc2VyczogbnVtYmVyO1xuICB0ZXN0RHVyYXRpb246IG51bWJlcjsgLy8g44Of44Oq56eSXG4gIHJhbXBVcFRpbWU6IG51bWJlcjsgICAvLyDjg5/jg6rnp5JcbiAgcmVxdWVzdEludGVydmFsOiBudW1iZXI7IC8vIOODn+ODquenklxuICBtYXhSZXF1ZXN0czogbnVtYmVyO1xufVxuXG4vKipcbiAqIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOOCt+ODiuODquOCqlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBlcmZvcm1hbmNlVGVzdFNjZW5hcmlvIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBlbmRwb2ludDogc3RyaW5nO1xuICBtZXRob2Q6ICdHRVQnIHwgJ1BPU1QnIHwgJ1BVVCcgfCAnREVMRVRFJztcbiAgcGF5bG9hZD86IGFueTtcbiAgaGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gIHdlaWdodDogbnVtYmVyOyAvLyDjg4bjgrnjg4jjgafjga7lrp/ooYzpoLvluqbph43jgb9cbn1cblxuLyoqXG4gKiDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjgq/jg6njgrlcbiAqL1xuZXhwb3J0IGNsYXNzIFBlcmZvcm1hbmNlVGVzdE1vZHVsZSB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIGNsb3VkV2F0Y2hDbGllbnQ6IENsb3VkV2F0Y2hDbGllbnQ7XG4gIHByaXZhdGUgY2xvdWRGcm9udENsaWVudDogQ2xvdWRGcm9udENsaWVudDtcbiAgcHJpdmF0ZSBsYW1iZGFDbGllbnQ6IExhbWJkYUNsaWVudDtcbiAgcHJpdmF0ZSB0ZXN0U2NlbmFyaW9zOiBQZXJmb3JtYW5jZVRlc3RTY2VuYXJpb1tdO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIFxuICAgIGNvbnN0IGNsaWVudENvbmZpZyA9IHtcbiAgICAgIHJlZ2lvbjogY29uZmlnLnJlZ2lvbixcbiAgICAgIGNyZWRlbnRpYWxzOiB7IHByb2ZpbGU6IGNvbmZpZy5hd3NQcm9maWxlIH1cbiAgICB9O1xuXG4gICAgdGhpcy5jbG91ZFdhdGNoQ2xpZW50ID0gbmV3IENsb3VkV2F0Y2hDbGllbnQoY2xpZW50Q29uZmlnKTtcbiAgICB0aGlzLmNsb3VkRnJvbnRDbGllbnQgPSBuZXcgQ2xvdWRGcm9udENsaWVudChjbGllbnRDb25maWcpO1xuICAgIHRoaXMubGFtYmRhQ2xpZW50ID0gbmV3IExhbWJkYUNsaWVudChjbGllbnRDb25maWcpO1xuICAgIFxuICAgIC8vIOODhuOCueODiOOCt+ODiuODquOCquOBruWIneacn+WMllxuICAgIHRoaXMudGVzdFNjZW5hcmlvcyA9IHRoaXMubG9hZFRlc3RTY2VuYXJpb3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jjgrfjg4rjg6rjgqrjga7oqq3jgb/ovrzjgb9cbiAgICovXG4gIHByaXZhdGUgbG9hZFRlc3RTY2VuYXJpb3MoKTogUGVyZm9ybWFuY2VUZXN0U2NlbmFyaW9bXSB7XG4gICAgY29uc3QgYmFzZVVybCA9IHRoaXMuY29uZmlnLnJlc291cmNlcy5jbG91ZEZyb250RG9tYWluIHx8ICdodHRwczovL2V4YW1wbGUuY2xvdWRmcm9udC5uZXQnO1xuICAgIFxuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnaG9tZXBhZ2UtbG9hZCcsXG4gICAgICAgIG5hbWU6ICfjg5vjg7zjg6Djg5rjg7zjgrjoqq3jgb/ovrzjgb8nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+WIneacn+eUu+mdouOBruihqOekuuaZgumWk+a4rOWumicsXG4gICAgICAgIGVuZHBvaW50OiBgJHtiYXNlVXJsfS9gLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBleHBlY3RlZFJlc3BvbnNlVGltZTogMjAwMCxcbiAgICAgICAgd2VpZ2h0OiAwLjNcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnY2hhdC1pbnRlcmZhY2UnLFxuICAgICAgICBuYW1lOiAn44OB44Oj44OD44OI44Kk44Oz44K/44O844OV44Kn44O844K5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfjg4Hjg6Pjg4Pjg4jnlLvpnaLjga7ooajnpLrmmYLplpPmuKzlrponLFxuICAgICAgICBlbmRwb2ludDogYCR7YmFzZVVybH0vY2hhdGAsXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiAzMDAwLFxuICAgICAgICB3ZWlnaHQ6IDAuNFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdhcGktY2hhdC1tZXNzYWdlJyxcbiAgICAgICAgbmFtZTogJ+ODgeODo+ODg+ODiOODoeODg+OCu+ODvOOCuOmAgeS/oScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn44OB44Oj44OD44OI44Oh44OD44K744O844K444GuQVBJ5b+c562U5pmC6ZaTJyxcbiAgICAgICAgZW5kcG9pbnQ6IGAke2Jhc2VVcmx9L2FwaS9jaGF0YCxcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICBtZXNzYWdlOiAn44GT44KT44Gr44Gh44Gv44CC44K344K544OG44Og44Gr44Gk44GE44Gm5pWZ44GI44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgICBzZXNzaW9uSWQ6ICd0ZXN0LXNlc3Npb24tMDAxJ1xuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICB9LFxuICAgICAgICBleHBlY3RlZFJlc3BvbnNlVGltZTogODAwMCxcbiAgICAgICAgd2VpZ2h0OiAwLjJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnZG9jdW1lbnQtc2VhcmNoJyxcbiAgICAgICAgbmFtZTogJ+aWh+abuOaknOe0okFQSScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn5paH5pu45qSc57Si44Gu5b+c562U5pmC6ZaT5ris5a6aJyxcbiAgICAgICAgZW5kcG9pbnQ6IGAke2Jhc2VVcmx9L2FwaS9zZWFyY2hgLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgIHF1ZXJ5OiAnTmV0QXBwIOOCueODiOODrOODvOOCuCcsXG4gICAgICAgICAgbGltaXQ6IDEwXG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH0sXG4gICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiA1MDAwLFxuICAgICAgICB3ZWlnaHQ6IDAuMVxuICAgICAgfVxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICog5b+c562U5pmC6ZaT5ris5a6a44OG44K544OIXG4gICAqL1xuICBhc3luYyB0ZXN0UmVzcG9uc2VUaW1lKCk6IFByb21pc2U8UGVyZm9ybWFuY2VUZXN0UmVzdWx0PiB7XG4gICAgY29uc3QgdGVzdElkID0gJ3BlcmZvcm1hbmNlLXJlc3BvbnNlLXRpbWUtMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfij7HvuI8g5b+c562U5pmC6ZaT5ris5a6a44OG44K544OI44KS6ZaL5aeLLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2VUaW1lUmVzdWx0cyA9IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IHNjZW5hcmlvIG9mIHRoaXMudGVzdFNjZW5hcmlvcykge1xuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiiDjgrfjg4rjg6rjgqrlrp/ooYzkuK06ICR7c2NlbmFyaW8ubmFtZX1gKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHNjZW5hcmlvUmVzdWx0cyA9IGF3YWl0IHRoaXMubWVhc3VyZVNjZW5hcmlvUmVzcG9uc2VUaW1lKHNjZW5hcmlvLCA1KTsgLy8gNeWbnua4rOWumlxuICAgICAgICByZXNwb25zZVRpbWVSZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHNjZW5hcmlvOiBzY2VuYXJpby5uYW1lLFxuICAgICAgICAgIC4uLnNjZW5hcmlvUmVzdWx0c1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8g5YWo5L2T55qE44Gq44OR44OV44Kp44O844Oe44Oz44K55oyH5qiZ44Gu6KiI566XXG4gICAgICBjb25zdCBvdmVyYWxsTWV0cmljcyA9IHRoaXMuY2FsY3VsYXRlT3ZlcmFsbE1ldHJpY3MocmVzcG9uc2VUaW1lUmVzdWx0cyk7XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBvdmVyYWxsTWV0cmljcy5hdmVyYWdlTGF0ZW5jeSA8PSA1MDAwICYmIC8vIDXnp5Lku6XlhoVcbiAgICAgICAgICAgICAgICAgICAgIG92ZXJhbGxNZXRyaWNzLnN1Y2Nlc3NSYXRlID49IDAuOTU7ICAgICAgLy8gOTUl5Lul5LiK5oiQ5YqfXG5cbiAgICAgIGNvbnN0IHJlc3VsdDogUGVyZm9ybWFuY2VUZXN0UmVzdWx0ID0ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn5b+c562U5pmC6ZaT5ris5a6a44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdwZXJmb3JtYW5jZScsXG4gICAgICAgIHN0YXR1czogc3VjY2VzcyA/IFRlc3RFeGVjdXRpb25TdGF0dXMuQ09NUExFVEVEIDogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgIHBlcmZvcm1hbmNlTWV0cmljczoge1xuICAgICAgICAgIHJlc3BvbnNlVGltZTogb3ZlcmFsbE1ldHJpY3MuYXZlcmFnZUxhdGVuY3ksXG4gICAgICAgICAgdGhyb3VnaHB1dDogb3ZlcmFsbE1ldHJpY3MudGhyb3VnaHB1dCxcbiAgICAgICAgICBjb25jdXJyZW50VXNlcnM6IDEsXG4gICAgICAgICAgc3VjY2Vzc1JhdGU6IG92ZXJhbGxNZXRyaWNzLnN1Y2Nlc3NSYXRlLFxuICAgICAgICAgIGVycm9yUmF0ZTogMSAtIG92ZXJhbGxNZXRyaWNzLnN1Y2Nlc3NSYXRlLFxuICAgICAgICAgIGF2ZXJhZ2VMYXRlbmN5OiBvdmVyYWxsTWV0cmljcy5hdmVyYWdlTGF0ZW5jeSxcbiAgICAgICAgICBwOTVMYXRlbmN5OiBvdmVyYWxsTWV0cmljcy5wOTVMYXRlbmN5LFxuICAgICAgICAgIHA5OUxhdGVuY3k6IG92ZXJhbGxNZXRyaWNzLnA5OUxhdGVuY3lcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBzY2VuYXJpb1Jlc3VsdHM6IHJlc3BvbnNlVGltZVJlc3VsdHMsXG4gICAgICAgICAgdGVzdFNjZW5hcmlvczogdGhpcy50ZXN0U2NlbmFyaW9zLm1hcChzID0+ICh7XG4gICAgICAgICAgICBpZDogcy5pZCxcbiAgICAgICAgICAgIG5hbWU6IHMubmFtZSxcbiAgICAgICAgICAgIGV4cGVjdGVkUmVzcG9uc2VUaW1lOiBzLmV4cGVjdGVkUmVzcG9uc2VUaW1lXG4gICAgICAgICAgfSkpXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg5b+c562U5pmC6ZaT5ris5a6a44OG44K544OI5oiQ5YqfJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDlubPlnYflv5znrZTmmYLplpM6ICR7b3ZlcmFsbE1ldHJpY3MuYXZlcmFnZUxhdGVuY3kudG9GaXhlZCgwKX1tc2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5oiQ5Yqf546HOiAkeyhvdmVyYWxsTWV0cmljcy5zdWNjZXNzUmF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg5b+c562U5pmC6ZaT5ris5a6a44OG44K544OI5aSx5pWXJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOW/nOetlOaZgumWk+a4rOWumuODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICflv5znrZTmmYLplpPmuKzlrprjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3BlcmZvcm1hbmNlJyxcbiAgICAgICAgc3RhdHVzOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOWQjOaZguODpuODvOOCtuODvOiyoOiNt+ODhuOCueODiFxuICAgKi9cbiAgYXN5bmMgdGVzdENvbmN1cnJlbnRVc2VyTG9hZCgpOiBQcm9taXNlPFBlcmZvcm1hbmNlVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IHRlc3RJZCA9ICdwZXJmb3JtYW5jZS1jb25jdXJyZW50LWxvYWQtMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn5GlIOWQjOaZguODpuODvOOCtuODvOiyoOiNt+ODhuOCueODiOOCkumWi+Wniy4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGxvYWRUZXN0Q29uZmlnOiBMb2FkVGVzdENvbmZpZyA9IHtcbiAgICAgICAgY29uY3VycmVudFVzZXJzOiAyNSxcbiAgICAgICAgdGVzdER1cmF0aW9uOiA2MDAwMCwgLy8gNjDnp5JcbiAgICAgICAgcmFtcFVwVGltZTogMTAwMDAsICAgLy8gMTDnp5Ljgafjg6njg7Pjg5fjgqLjg4Pjg5dcbiAgICAgICAgcmVxdWVzdEludGVydmFsOiAyMDAwLCAvLyAy56eS6ZaT6ZqUXG4gICAgICAgIG1heFJlcXVlc3RzOiAxMDAwXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBsb2FkVGVzdFJlc3VsdHMgPSBhd2FpdCB0aGlzLmV4ZWN1dGVDb25jdXJyZW50TG9hZFRlc3QobG9hZFRlc3RDb25maWcpO1xuXG4gICAgICAvLyBDbG91ZFdhdGNo44Oh44OI44Oq44Kv44K544Gu5Y+W5b6XXG4gICAgICBjb25zdCBjbG91ZFdhdGNoTWV0cmljcyA9IGF3YWl0IHRoaXMuZ2V0Q2xvdWRXYXRjaE1ldHJpY3MoKTtcblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IGxvYWRUZXN0UmVzdWx0cy5zdWNjZXNzUmF0ZSA+PSAwLjkgJiYgLy8gOTAl5Lul5LiK5oiQ5YqfXG4gICAgICAgICAgICAgICAgICAgICBsb2FkVGVzdFJlc3VsdHMuYXZlcmFnZVJlc3BvbnNlVGltZSA8PSAxMDAwMDsgLy8gMTDnp5Lku6XlhoVcblxuICAgICAgY29uc3QgcmVzdWx0OiBQZXJmb3JtYW5jZVRlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICflkIzmmYLjg6bjg7zjgrbjg7zosqDojbfjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3BlcmZvcm1hbmNlJyxcbiAgICAgICAgc3RhdHVzOiBzdWNjZXNzID8gVGVzdEV4ZWN1dGlvblN0YXR1cy5DT01QTEVURUQgOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWNzOiB7XG4gICAgICAgICAgcmVzcG9uc2VUaW1lOiBsb2FkVGVzdFJlc3VsdHMuYXZlcmFnZVJlc3BvbnNlVGltZSxcbiAgICAgICAgICB0aHJvdWdocHV0OiBsb2FkVGVzdFJlc3VsdHMucmVxdWVzdHNQZXJTZWNvbmQsXG4gICAgICAgICAgY29uY3VycmVudFVzZXJzOiBsb2FkVGVzdENvbmZpZy5jb25jdXJyZW50VXNlcnMsXG4gICAgICAgICAgc3VjY2Vzc1JhdGU6IGxvYWRUZXN0UmVzdWx0cy5zdWNjZXNzUmF0ZSxcbiAgICAgICAgICBlcnJvclJhdGU6IDEgLSBsb2FkVGVzdFJlc3VsdHMuc3VjY2Vzc1JhdGUsXG4gICAgICAgICAgYXZlcmFnZUxhdGVuY3k6IGxvYWRUZXN0UmVzdWx0cy5hdmVyYWdlUmVzcG9uc2VUaW1lLFxuICAgICAgICAgIHA5NUxhdGVuY3k6IGxvYWRUZXN0UmVzdWx0cy5tYXhSZXNwb25zZVRpbWUgKiAwLjk1LCAvLyDnsKHnlaXljJZcbiAgICAgICAgICBwOTlMYXRlbmN5OiBsb2FkVGVzdFJlc3VsdHMubWF4UmVzcG9uc2VUaW1lICogMC45OSAgLy8g57Ch55Wl5YyWXG4gICAgICAgIH0sXG4gICAgICAgIGxvYWRUZXN0UmVzdWx0czogbG9hZFRlc3RSZXN1bHRzLFxuICAgICAgICByZXNvdXJjZVVzYWdlOiBjbG91ZFdhdGNoTWV0cmljcyxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBsb2FkVGVzdENvbmZpZzogbG9hZFRlc3RDb25maWcsXG4gICAgICAgICAgdGVzdER1cmF0aW9uOiBsb2FkVGVzdENvbmZpZy50ZXN0RHVyYXRpb24sXG4gICAgICAgICAgcmFtcFVwVGltZTogbG9hZFRlc3RDb25maWcucmFtcFVwVGltZVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIOWQjOaZguODpuODvOOCtuODvOiyoOiNt+ODhuOCueODiOaIkOWKnycpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5ZCM5pmC44Om44O844K244O85pWwOiAke2xvYWRUZXN0Q29uZmlnLmNvbmN1cnJlbnRVc2Vyc31gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaIkOWKn+eOhzogJHsobG9hZFRlc3RSZXN1bHRzLnN1Y2Nlc3NSYXRlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOW5s+Wdh+W/nOetlOaZgumWkzogJHtsb2FkVGVzdFJlc3VsdHMuYXZlcmFnZVJlc3BvbnNlVGltZS50b0ZpeGVkKDApfW1zYCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDjgrnjg6vjg7zjg5fjg4Pjg4g6ICR7bG9hZFRlc3RSZXN1bHRzLnJlcXVlc3RzUGVyU2Vjb25kLnRvRml4ZWQoMSl9IHJlcS9zZWNgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlkIzmmYLjg6bjg7zjgrbjg7zosqDojbfjg4bjgrnjg4jlpLHmlZcnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg5ZCM5pmC44Om44O844K244O86LKg6I2344OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ+WQjOaZguODpuODvOOCtuODvOiyoOiNt+ODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAncGVyZm9ybWFuY2UnLFxuICAgICAgICBzdGF0dXM6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44K544Kx44O844Op44OT44Oq44OG44Kj44OG44K544OIXG4gICAqL1xuICBhc3luYyB0ZXN0U2NhbGFiaWxpdHkoKTogUHJvbWlzZTxQZXJmb3JtYW5jZVRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCB0ZXN0SWQgPSAncGVyZm9ybWFuY2Utc2NhbGFiaWxpdHktMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn5OIIOOCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiOOCkumWi+Wniy4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVzZXJMZXZlbHMgPSBbNSwgMTAsIDE1LCAyMCwgMjVdOyAvLyDmrrXpmo7nmoTjgavjg6bjg7zjgrbjg7zmlbDjgpLlopfliqBcbiAgICAgIGNvbnN0IHNjYWxhYmlsaXR5UmVzdWx0cyA9IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IHVzZXJDb3VudCBvZiB1c2VyTGV2ZWxzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OKICR7dXNlckNvdW50feODpuODvOOCtuODvOOBp+OBruiyoOiNt+ODhuOCueODiOWun+ihjOS4rS4uLmApO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbG9hZENvbmZpZzogTG9hZFRlc3RDb25maWcgPSB7XG4gICAgICAgICAgY29uY3VycmVudFVzZXJzOiB1c2VyQ291bnQsXG4gICAgICAgICAgdGVzdER1cmF0aW9uOiAzMDAwMCwgLy8gMzDnp5JcbiAgICAgICAgICByYW1wVXBUaW1lOiA1MDAwLCAgICAvLyA156eSXG4gICAgICAgICAgcmVxdWVzdEludGVydmFsOiAzMDAwLCAvLyAz56eS6ZaT6ZqUXG4gICAgICAgICAgbWF4UmVxdWVzdHM6IDIwMFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGxldmVsUmVzdWx0ID0gYXdhaXQgdGhpcy5leGVjdXRlQ29uY3VycmVudExvYWRUZXN0KGxvYWRDb25maWcpO1xuICAgICAgICBzY2FsYWJpbGl0eVJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgdXNlckNvdW50LFxuICAgICAgICAgIC4uLmxldmVsUmVzdWx0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOasoeOBruODrOODmeODq+OBvuOBp+WwkeOBl+W+heapn1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMDApKTtcbiAgICAgIH1cblxuICAgICAgLy8g44K544Kx44O844Op44OT44Oq44OG44Kj5YiG5p6QXG4gICAgICBjb25zdCBzY2FsYWJpbGl0eUFuYWx5c2lzID0gdGhpcy5hbmFseXplU2NhbGFiaWxpdHkoc2NhbGFiaWxpdHlSZXN1bHRzKTtcblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IHNjYWxhYmlsaXR5QW5hbHlzaXMubWF4Q29uY3VycmVudFVzZXJzID49IDIwICYmIC8vIDIw44Om44O844K244O85Lul5LiK5a++5b+cXG4gICAgICAgICAgICAgICAgICAgICBzY2FsYWJpbGl0eUFuYWx5c2lzLmRlZ3JhZGF0aW9uUG9pbnQgPj0gMTU7ICAgICAvLyAxNeODpuODvOOCtuODvOOBvuOBp+aAp+iDvee2reaMgVxuXG4gICAgICBjb25zdCByZXN1bHQ6IFBlcmZvcm1hbmNlVGVzdFJlc3VsdCA9IHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ+OCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAncGVyZm9ybWFuY2UnLFxuICAgICAgICBzdGF0dXM6IHN1Y2Nlc3MgPyBUZXN0RXhlY3V0aW9uU3RhdHVzLkNPTVBMRVRFRCA6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzLFxuICAgICAgICBzY2FsYWJpbGl0eU1ldHJpY3M6IHtcbiAgICAgICAgICBtYXhDb25jdXJyZW50VXNlcnM6IHNjYWxhYmlsaXR5QW5hbHlzaXMubWF4Q29uY3VycmVudFVzZXJzLFxuICAgICAgICAgIGRlZ3JhZGF0aW9uUG9pbnQ6IHNjYWxhYmlsaXR5QW5hbHlzaXMuZGVncmFkYXRpb25Qb2ludCxcbiAgICAgICAgICByZWNvdmVyeVRpbWU6IHNjYWxhYmlsaXR5QW5hbHlzaXMucmVjb3ZlcnlUaW1lXG4gICAgICAgIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgdXNlckxldmVsczogdXNlckxldmVscyxcbiAgICAgICAgICBzY2FsYWJpbGl0eVJlc3VsdHM6IHNjYWxhYmlsaXR5UmVzdWx0cyxcbiAgICAgICAgICBzY2FsYWJpbGl0eUFuYWx5c2lzOiBzY2FsYWJpbGl0eUFuYWx5c2lzXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg44K544Kx44O844Op44OT44Oq44OG44Kj44OG44K544OI5oiQ5YqfJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmnIDlpKflkIzmmYLjg6bjg7zjgrbjg7zmlbA6ICR7c2NhbGFiaWxpdHlBbmFseXNpcy5tYXhDb25jdXJyZW50VXNlcnN9YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmgKfog73liqPljJbplovlp4vngrk6ICR7c2NhbGFiaWxpdHlBbmFseXNpcy5kZWdyYWRhdGlvblBvaW50feODpuODvOOCtuODvGApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOOCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn44K544Kx44O844Op44OT44Oq44OG44Kj44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdwZXJmb3JtYW5jZScsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxufSJdfQ==