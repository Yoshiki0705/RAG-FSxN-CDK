/**
 * パフォーマンステストモジュール
 * 
 * 実本番環境での応答時間とスループットの測定
 * 負荷テストと同時ユーザー対応能力の検証
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  PutMetricDataCommand,
  MetricDatum
} from '@aws-sdk/client-cloudwatch';

import {
  CloudFrontClient,
  GetDistributionCommand
} from '@aws-sdk/client-cloudfront';

import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand
} from '@aws-sdk/client-lambda';

import { ProductionConfig } from '../../config/production-config';
import { TestResult, TestExecutionStatus } from '../../core/production-test-engine';

/**
 * パフォーマンステスト結果インターフェース
 */
export interface PerformanceTestResult extends TestResult {
  performanceMetrics?: {
    responseTime: number;
    throughput: number;
    concurrentUsers: number;
    successRate: number;
    errorRate: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
  loadTestResults?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
  };
  resourceUsage?: {
    cpuUtilization: number;
    memoryUtilization: number;
    networkIO: number;
    diskIO: number;
  };
  scalabilityMetrics?: {
    maxConcurrentUsers: number;
    degradationPoint: number;
    recoveryTime: number;
  };
}

/**
 * 負荷テスト設定
 */
export interface LoadTestConfig {
  concurrentUsers: number;
  testDuration: number; // ミリ秒
  rampUpTime: number;   // ミリ秒
  requestInterval: number; // ミリ秒
  maxRequests: number;
}

/**
 * パフォーマンステストシナリオ
 */
export interface PerformanceTestScenario {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
  expectedResponseTime: number;
  weight: number; // テストでの実行頻度重み
}

/**
 * パフォーマンステストモジュールクラス
 */
export class PerformanceTestModule {
  private config: ProductionConfig;
  private cloudWatchClient: CloudWatchClient;
  private cloudFrontClient: CloudFrontClient;
  private lambdaClient: LambdaClient;
  private testScenarios: PerformanceTestScenario[];

  constructor(config: ProductionConfig) {
    this.config = config;
    
    const clientConfig = {
      region: config.region,
      credentials: { profile: config.awsProfile }
    };

    this.cloudWatchClient = new CloudWatchClient(clientConfig);
    this.cloudFrontClient = new CloudFrontClient(clientConfig);
    this.lambdaClient = new LambdaClient(clientConfig);
    
    // テストシナリオの初期化
    this.testScenarios = this.loadTestScenarios();
  }

  /**
   * テストシナリオの読み込み
   */
  private loadTestScenarios(): PerformanceTestScenario[] {
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
  async testResponseTime(): Promise<PerformanceTestResult> {
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
                     overallMetrics.successRate >= 0.95;      // 95%以上成功

      const result: PerformanceTestResult = {
        testId,
        testName: '応答時間測定テスト',
        category: 'performance',
        status: success ? TestExecutionStatus.COMPLETED : TestExecutionStatus.FAILED,
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
      } else {
        console.error('❌ 応答時間測定テスト失敗');
      }

      return result;

    } catch (error) {
      console.error('❌ 応答時間測定テスト実行エラー:', error);
      
      return {
        testId,
        testName: '応答時間測定テスト',
        category: 'performance',
        status: TestExecutionStatus.FAILED,
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
  async testConcurrentUserLoad(): Promise<PerformanceTestResult> {
    const testId = 'performance-concurrent-load-001';
    const startTime = Date.now();
    
    console.log('👥 同時ユーザー負荷テストを開始...');

    try {
      const loadTestConfig: LoadTestConfig = {
        concurrentUsers: 25,
        testDuration: 60000, // 60秒
        rampUpTime: 10000,   // 10秒でランプアップ
        requestInterval: 2000, // 2秒間隔
        maxRequests: 1000
      };

      const loadTestResults = await this.executeConcurrentLoadTest(loadTestConfig);

      // CloudWatchメトリクスの取得
      const cloudWatchMetrics = await this.getCloudWatchMetrics();

      const success = loadTestResults.successRate >= 0.9 && // 90%以上成功
                     loadTestResults.averageResponseTime <= 10000; // 10秒以内

      const result: PerformanceTestResult = {
        testId,
        testName: '同時ユーザー負荷テスト',
        category: 'performance',
        status: success ? TestExecutionStatus.COMPLETED : TestExecutionStatus.FAILED,
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
          p99Latency: loadTestResults.maxResponseTime * 0.99  // 簡略化
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
      } else {
        console.error('❌ 同時ユーザー負荷テスト失敗');
      }

      return result;

    } catch (error) {
      console.error('❌ 同時ユーザー負荷テスト実行エラー:', error);
      
      return {
        testId,
        testName: '同時ユーザー負荷テスト',
        category: 'performance',
        status: TestExecutionStatus.FAILED,
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
  async testScalability(): Promise<PerformanceTestResult> {
    const testId = 'performance-scalability-001';
    const startTime = Date.now();
    
    console.log('📈 スケーラビリティテストを開始...');

    try {
      const userLevels = [5, 10, 15, 20, 25]; // 段階的にユーザー数を増加
      const scalabilityResults = [];

      for (const userCount of userLevels) {
        console.log(`📊 ${userCount}ユーザーでの負荷テスト実行中...`);
        
        const loadConfig: LoadTestConfig = {
          concurrentUsers: userCount,
          testDuration: 30000, // 30秒
          rampUpTime: 5000,    // 5秒
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
                     scalabilityAnalysis.degradationPoint >= 15;     // 15ユーザーまで性能維持

      const result: PerformanceTestResult = {
        testId,
        testName: 'スケーラビリティテスト',
        category: 'performance',
        status: success ? TestExecutionStatus.COMPLETED : TestExecutionStatus.FAILED,
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
      } else {
        console.error('❌ スケーラビリティテスト失敗');
      }

      return result;

    } catch (error) {
      console.error('❌ スケーラビリティテスト実行エラー:', error);
      
      return {
        testId,
        testName: 'スケーラビリティテスト',
        category: 'performance',
        status: TestExecutionStatus.FAILED,
        startTime: new Date(startTime),
        endTime: new Date(),
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}