/**
 * パフォーマンス統合テストランナー
 * 全パフォーマンステストの統合実行と結果集計
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

// 定数定義
const PERFORMANCE_TEST_CONSTANTS = {
  VALIDATION_LIMITS: {
    MAX_RESPONSE_TIME_MS: 30000,
    MAX_THROUGHPUT_RPS: 10000,
    MAX_CONCURRENT_USERS: 100000,
    MAX_TEST_DURATION_SEC: 3600
  },
  DEFAULT_VALUES: {
    CONCURRENT_REQUESTS: 10,
    RAMP_UP_TIME_SEC: 60,
    CHECK_INTERVAL_SEC: 30,
    CONSECUTIVE_FAILURES: 3
  },
  SUCCESS_THRESHOLDS: {
    OVERALL_PERFORMANCE_SCORE: 80,
    ERROR_RATE: 0.05,
    UPTIME_PERCENTAGE: 99.0
  }
} as const;

import { TestResult } from '../../types/test-types';
import { ResponseTimeTest, ResponseTimeTestConfig, ResponseTimeTestResult } from './response-time-test';
import { ConcurrentLoadTest, ConcurrentLoadTestConfig, ConcurrentLoadTestResult } from './concurrent-load-test';
import { UptimeMonitoringTest, UptimeMonitoringTestConfig, UptimeMonitoringTestResult } from './uptime-monitoring-test';
import { MultiRegionScalabilityTest, MultiRegionScalabilityTestConfig, MultiRegionScalabilityTestResult } from './multi-region-scalability-test';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { result } from 'lodash';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { result } from 'lodash';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';
import { config } from 'process';

export interface PerformanceIntegrationTestConfig {
  baseUrl: string;
  enabledTests: {
    responseTime: boolean;
    concurrentLoad: boolean;
    uptimeMonitoring: boolean;
    multiRegionScalability: boolean;
  };
  testEnvironment: 'development' | 'staging' | 'production';
  performanceTargets: {
    maxResponseTime: number; // ms
    minThroughput: number; // requests per second
    minUptime: number; // percentage
    maxConcurrentUsers: number;
  };
  testDuration: {
    responseTime: number; // seconds
    loadTest: number; // seconds
    uptimeMonitoring: number; // seconds
    scalabilityTest: number; // seconds
  };
}

export interface PerformanceIntegrationTestResult extends TestResult {
  responseTimeResult?: ResponseTimeTestResult;
  concurrentLoadResult?: ConcurrentLoadTestResult;
  uptimeMonitoringResult?: UptimeMonitoringTestResult;
  multiRegionScalabilityResult?: MultiRegionScalabilityTestResult;
  overallPerformanceScore: number;
  responseTimeScore: number;
  scalabilityScore: number;
  reliabilityScore: number;
  globalPerformanceScore: number;
  performanceSummary: PerformanceSummary;
  recommendations: string[];
}

export interface PerformanceSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
  peakThroughput: number;
  systemUptime: number;
  maxSupportedUsers: number;
  criticalIssues: number;
  performanceBottlenecks: string[];
  scalabilityLimitations: string[];
}

export class PerformanceIntegrationTestRunner {
  private config: PerformanceIntegrationTestConfig;
  private testStartTime: number = 0;

  constructor(config: PerformanceIntegrationTestConfig) {
    // 設定の検証
    this.validateConfig(config);
    this.config = config;
  }

  /**
   * 設定の検証
   */
  private validateConfig(config: PerformanceIntegrationTestConfig): void {
    // baseURL の検証
    if (!config.baseUrl || typeof config.baseUrl !== 'string') {
      throw new Error('baseUrl は必須です');
    }

    try {
      new URL(config.baseUrl);
    } catch (error) {
      throw new Error('無効な baseUrl です');
    }

    // パフォーマンス目標値の検証
    if (config.performanceTargets.maxResponseTime <= 0 || 
        config.performanceTargets.maxResponseTime > PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_RESPONSE_TIME_MS) {
      throw new Error(`maxResponseTime は 1-${PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_RESPONSE_TIME_MS}ms の範囲で設定してください`);
    }

    if (config.performanceTargets.minThroughput <= 0 || 
        config.performanceTargets.minThroughput > PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_THROUGHPUT_RPS) {
      throw new Error(`minThroughput は 1-${PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_THROUGHPUT_RPS} req/s の範囲で設定してください`);
    }

    if (config.performanceTargets.minUptime < 0 || config.performanceTargets.minUptime > 100) {
      throw new Error('minUptime は 0-100% の範囲で設定してください');
    }

    if (config.performanceTargets.maxConcurrentUsers <= 0 || 
        config.performanceTargets.maxConcurrentUsers > PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_CONCURRENT_USERS) {
      throw new Error(`maxConcurrentUsers は 1-${PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_CONCURRENT_USERS} の範囲で設定してください`);
    }

    // テスト期間の検証
    Object.entries(config.testDuration).forEach(([key, value]) => {
      if (value <= 0 || value > PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_TEST_DURATION_SEC) {
        throw new Error(`testDuration.${key} は 1-${PERFORMANCE_TEST_CONSTANTS.VALIDATION_LIMITS.MAX_TEST_DURATION_SEC}秒 の範囲で設定してください`);
      }
    });
  }

  /**
   * パフォーマンス統合テストの実行
   */
  async runTests(): Promise<PerformanceIntegrationTestResult> {
    console.log('⚡ パフォーマンス統合テストを開始します...');
    console.log(`🌐 テスト環境: ${this.config.testEnvironment}`);
    console.log(`🔗 ベースURL: ${this.config.baseUrl}`);
    
    this.testStartTime = Date.now();

    try {
      const results: Partial<PerformanceIntegrationTestResult> = {
        testName: 'PerformanceIntegrationTest',
        success: false,
        duration: 0,
        details: {}
      };

      // 並列実行可能なテストを特定
      const parallelTests: Promise<any>[] = [];
      const sequentialTests: (() => Promise<void>)[] = [];

      // 応答時間測定テスト（並列実行可能）
      if (this.config.enabledTests.responseTime) {
        console.log('\n⏱️ 応答時間測定テストを実行中...');
        parallelTests.push(
          this.runResponseTimeTest().then(result => {
            results.responseTimeResult = result;
          })
        );
      }

      // 稼働率監視テスト（並列実行可能）
      if (this.config.enabledTests.uptimeMonitoring) {
        console.log('\n📊 稼働率監視テストを実行中...');
        parallelTests.push(
          this.runUptimeMonitoringTest().then(result => {
            results.uptimeMonitoringResult = result;
          })
        );
      }

      // 並列実行可能なテストを実行
      if (parallelTests.length > 0) {
        await Promise.allSettled(parallelTests);
      }

      // 同時ユーザー負荷テスト（システムに負荷をかけるため単独実行）
      if (this.config.enabledTests.concurrentLoad) {
        console.log('\n👥 同時ユーザー負荷テストを実行中...');
        results.concurrentLoadResult = await this.runConcurrentLoadTest();
      }

      // マルチリージョンスケーラビリティテスト（システムに負荷をかけるため単独実行）
      if (this.config.enabledTests.multiRegionScalability) {
        console.log('\n🌍 マルチリージョンスケーラビリティテストを実行中...');
        results.multiRegionScalabilityResult = await this.runMultiRegionScalabilityTest();
      }

      // 結果の統合と評価
      const finalResult = this.aggregateResults(results);

      return finalResult;

    } catch (error) {
      console.error('❌ パフォーマンス統合テストでエラーが発生:', error);
      
      return {
        testName: 'PerformanceIntegrationTest',
        success: false,
        duration: Date.now() - this.testStartTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          testEnvironment: this.config.testEnvironment
        },
        overallPerformanceScore: 0,
        responseTimeScore: 0,
        scalabilityScore: 0,
        reliabilityScore: 0,
        globalPerformanceScore: 0,
        performanceSummary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 1,
          averageResponseTime: 0,
          peakThroughput: 0,
          systemUptime: 0,
          maxSupportedUsers: 0,
          criticalIssues: 1,
          performanceBottlenecks: ['system_error'],
          scalabilityLimitations: ['テスト実行エラー']
        },
        recommendations: [
          'システムの接続と設定を確認してください',
          'テスト環境の準備状況を確認してください'
        ]
      };
    }
  }

  /**
   * 応答時間測定テストの実行
   */
  private async runResponseTimeTest(): Promise<ResponseTimeTestResult> {
    try {
      const config: ResponseTimeTestConfig = {
        baseUrl: this.config.baseUrl,
        testEndpoints: [
          { path: '/', method: 'GET', expectedResponseTime: this.config.performanceTargets.maxResponseTime },
          { path: '/chatbot', method: 'GET', expectedResponseTime: this.config.performanceTargets.maxResponseTime },
          { path: '/api/health', method: 'GET', expectedResponseTime: 500 }
        ],
        testDuration: this.config.testDuration.responseTime,
        concurrentRequests: PERFORMANCE_TEST_CONSTANTS.DEFAULT_VALUES.CONCURRENT_REQUESTS,
        performanceThresholds: {
          averageResponseTime: this.config.performanceTargets.maxResponseTime,
          p95ResponseTime: this.config.performanceTargets.maxResponseTime * 1.5,
          errorRate: 0.01
        }
      };

      const test = new ResponseTimeTest(config);
      return await test.runTest();
    } catch (error) {
      console.error('❌ 応答時間テスト実行エラー:', error);
      throw error;
    }
  }

  /**
   * 同時ユーザー負荷テストの実行
   */
  private async runConcurrentLoadTest(): Promise<ConcurrentLoadTestResult> {
    try {
      const config: ConcurrentLoadTestConfig = {
        baseUrl: this.config.baseUrl,
        maxConcurrentUsers: this.config.performanceTargets.maxConcurrentUsers,
        testDuration: this.config.testDuration.loadTest,
        rampUpTime: PERFORMANCE_TEST_CONSTANTS.DEFAULT_VALUES.RAMP_UP_TIME_SEC,
        testScenarios: [
          {
            name: 'ページ閲覧',
            weight: 0.6,
            actions: [
              { type: 'GET', path: '/', weight: 0.4 },
              { type: 'GET', path: '/chatbot', weight: 0.6 }
            ]
          },
          {
            name: 'チャット操作',
            weight: 0.4,
            actions: [
              { type: 'POST', path: '/api/chat', weight: 1.0 }
            ]
          }
        ],
        performanceTargets: {
          maxResponseTime: this.config.performanceTargets.maxResponseTime,
          minThroughput: this.config.performanceTargets.minThroughput,
          maxErrorRate: 0.05
        }
      };

      const test = new ConcurrentLoadTest(config);
      return await test.runTest();
    } catch (error) {
      console.error('❌ 同時ユーザー負荷テスト実行エラー:', error);
      throw error;
    }
  }

  /**
   * 稼働率監視テストの実行
   */
  private async runUptimeMonitoringTest(): Promise<UptimeMonitoringTestResult> {
    try {
      const config: UptimeMonitoringTestConfig = {
        baseUrl: this.config.baseUrl,
        monitoringDuration: this.config.testDuration.uptimeMonitoring,
        checkInterval: PERFORMANCE_TEST_CONSTANTS.DEFAULT_VALUES.CHECK_INTERVAL_SEC,
        endpoints: [
          { path: '/', name: 'ホームページ' },
          { path: '/chatbot', name: 'チャットボット' },
          { path: '/api/health', name: 'ヘルスチェック' }
        ],
        uptimeTarget: this.config.performanceTargets.minUptime,
        alertThresholds: {
          responseTime: this.config.performanceTargets.maxResponseTime,
          errorRate: 0.05,
          consecutiveFailures: PERFORMANCE_TEST_CONSTANTS.DEFAULT_VALUES.CONSECUTIVE_FAILURES
        }
      };

      const test = new UptimeMonitoringTest(config);
      return await test.runTest();
    } catch (error) {
      console.error('❌ 稼働率監視テスト実行エラー:', error);
      throw error;
    }
  }

  /**
   * マルチリージョンスケーラビリティテストの実行
   */
  private async runMultiRegionScalabilityTest(): Promise<MultiRegionScalabilityTestResult> {
    try {
      const config: MultiRegionScalabilityTestConfig = {
        regions: [
          { name: 'ap-northeast-1', baseUrl: this.config.baseUrl, weight: 0.6 },
          { name: 'us-east-1', baseUrl: this.config.baseUrl.replace('ap-northeast-1', 'us-east-1'), weight: 0.4 }
        ],
        testDuration: this.config.testDuration.scalabilityTest,
        scalabilityTargets: {
          maxLatencyIncrease: 0.5,
          minThroughputMaintenance: 0.8,
          maxErrorRateIncrease: 0.02
        },
        loadPatterns: [
          { type: 'gradual', duration: 300, targetUsers: 100 },
          { type: 'spike', duration: 60, targetUsers: 500 },
          { type: 'sustained', duration: 600, targetUsers: 200 }
        ]
      };

      const test = new MultiRegionScalabilityTest(config);
      return await test.runTest();
    } catch (error) {
      console.error('❌ マルチリージョンスケーラビリティテスト実行エラー:', error);
      throw error;
    }
  }

  /**
   * テスト結果の統合と評価
   */
  private aggregateResults(results: Partial<PerformanceIntegrationTestResult>): PerformanceIntegrationTestResult {
    const duration = Date.now() - this.testStartTime;
    
    // 各テストの成功/失敗をカウント
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // スコア計算
    let responseTimeScore = 0;
    let scalabilityScore = 0;
    let reliabilityScore = 0;
    let globalPerformanceScore = 0;

    // 応答時間テスト結果の評価
    if (results.responseTimeResult) {
      totalTests++;
      if (results.responseTimeResult.success) {
        passedTests++;
        responseTimeScore = results.responseTimeResult.performanceMetrics?.overallScore || 0;
      } else {
        failedTests++;
      }
    }

    // 負荷テスト結果の評価
    if (results.concurrentLoadResult) {
      totalTests++;
      if (results.concurrentLoadResult.success) {
        passedTests++;
        scalabilityScore = results.concurrentLoadResult.loadMetrics?.scalabilityScore || 0;
      } else {
        failedTests++;
      }
    }

    // 稼働率テスト結果の評価
    if (results.uptimeMonitoringResult) {
      totalTests++;
      if (results.uptimeMonitoringResult.success) {
        passedTests++;
        reliabilityScore = results.uptimeMonitoringResult.uptimeMetrics?.overallUptimeScore || 0;
      } else {
        failedTests++;
      }
    }

    // マルチリージョンテスト結果の評価
    if (results.multiRegionScalabilityResult) {
      totalTests++;
      if (results.multiRegionScalabilityResult.success) {
        passedTests++;
        globalPerformanceScore = results.multiRegionScalabilityResult.scalabilityMetrics?.globalPerformanceScore || 0;
      } else {
        failedTests++;
      }
    }

    // 総合スコア計算
    const overallPerformanceScore = totalTests > 0 ? 
      (responseTimeScore + scalabilityScore + reliabilityScore + globalPerformanceScore) / totalTests : 0;

    // パフォーマンスサマリーの作成
    const performanceSummary: PerformanceSummary = {
      totalTests,
      passedTests,
      failedTests,
      averageResponseTime: results.responseTimeResult?.performanceMetrics?.averageResponseTime || 0,
      peakThroughput: results.concurrentLoadResult?.loadMetrics?.peakThroughput || 0,
      systemUptime: results.uptimeMonitoringResult?.uptimeMetrics?.overallUptimeScore || 0,
      maxSupportedUsers: results.concurrentLoadResult?.loadMetrics?.maxSupportedUsers || 0,
      criticalIssues: failedTests,
      performanceBottlenecks: this.identifyPerformanceBottlenecks(results),
      scalabilityLimitations: this.identifyScalabilityLimitations(results)
    };

    // 推奨事項の生成
    const recommendations = this.generateRecommendations(results, performanceSummary);

    const success = passedTests === totalTests && overallPerformanceScore >= PERFORMANCE_TEST_CONSTANTS.SUCCESS_THRESHOLDS.OVERALL_PERFORMANCE_SCORE;

    return {
      testName: 'PerformanceIntegrationTest',
      success,
      duration,
      details: {
        testEnvironment: this.config.testEnvironment,
        enabledTests: this.config.enabledTests,
        performanceTargets: this.config.performanceTargets
      },
      ...results,
      overallPerformanceScore,
      responseTimeScore,
      scalabilityScore,
      reliabilityScore,
      globalPerformanceScore,
      performanceSummary,
      recommendations
    };
  }

  /**
   * パフォーマンスボトルネックの特定
   */
  private identifyPerformanceBottlenecks(results: Partial<PerformanceIntegrationTestResult>): string[] {
    const bottlenecks: string[] = [];

    if (results.responseTimeResult && !results.responseTimeResult.success) {
      bottlenecks.push('応答時間の遅延');
    }

    if (results.concurrentLoadResult && !results.concurrentLoadResult.success) {
      bottlenecks.push('同時ユーザー処理能力の不足');
    }

    if (results.uptimeMonitoringResult && !results.uptimeMonitoringResult.success) {
      bottlenecks.push('システム安定性の問題');
    }

    if (results.multiRegionScalabilityResult && !results.multiRegionScalabilityResult.success) {
      bottlenecks.push('マルチリージョン間の性能差');
    }

    return bottlenecks;
  }

  /**
   * スケーラビリティ制限の特定
   */
  private identifyScalabilityLimitations(results: Partial<PerformanceIntegrationTestResult>): string[] {
    const limitations: string[] = [];

    if (results.concurrentLoadResult?.loadMetrics?.maxSupportedUsers && 
        results.concurrentLoadResult.loadMetrics.maxSupportedUsers < this.config.performanceTargets.maxConcurrentUsers) {
      limitations.push(`同時ユーザー数の上限: ${results.concurrentLoadResult.loadMetrics.maxSupportedUsers}人`);
    }

    if (results.multiRegionScalabilityResult?.scalabilityMetrics?.regionPerformanceVariance && 
        results.multiRegionScalabilityResult.scalabilityMetrics.regionPerformanceVariance > 0.3) {
      limitations.push('リージョン間の性能差が大きい');
    }

    return limitations;
  }

  /**
   * 改善推奨事項の生成
   */
  private generateRecommendations(results: Partial<PerformanceIntegrationTestResult>, summary: PerformanceSummary): string[] {
    const recommendations: string[] = [];

    if (summary.averageResponseTime > this.config.performanceTargets.maxResponseTime) {
      recommendations.push('CDNキャッシュの最適化を検討してください');
      recommendations.push('Lambda関数のメモリ設定を見直してください');
    }

    if (summary.peakThroughput < this.config.performanceTargets.minThroughput) {
      recommendations.push('Auto Scalingの設定を調整してください');
      recommendations.push('データベース接続プールの最適化を検討してください');
    }

    if (summary.systemUptime < this.config.performanceTargets.minUptime) {
      recommendations.push('ヘルスチェックの頻度を増やしてください');
      recommendations.push('エラー監視とアラートの設定を強化してください');
    }

    if (summary.criticalIssues > 0) {
      recommendations.push('クリティカルな問題の根本原因分析を実施してください');
    }

    return recommendations;
  }

  /**
   * リソースのクリーンアップ
   */
  async cleanup(): Promise<void> {
    console.log('🧹 パフォーマンス統合テストランナーをクリーンアップ中...');
    console.log('✅ パフォーマンス統合テストランナーのクリーンアップ完了');
  }
}  /
**
   * 応答時間測定テストの実行
   */
  private async runResponseTimeTest(): Promise<ResponseTimeTestResult> {
    const config: ResponseTimeTestConfig = {
      baseUrl: this.config.baseUrl,
      testQueries: [
        {
          id: 'simple_1',
          query: 'こんにちは',
          type: 'simple',
          expectedResponseTime: 800,
          category: 'general',
          requiresRAG: false,
          requiresAI: true
        },
        {
          id: 'standard_1',
          query: 'AWS Lambda の基本的な使い方を教えてください',
          type: 'standard',
          expectedResponseTime: this.config.performanceTargets.maxResponseTime,
          category: 'technical',
          requiresRAG: true,
          requiresAI: true
        },
        {
          id: 'complex_1',
          query: 'マルチリージョンでのAWSアーキテクチャ設計について詳しく説明してください',
          type: 'complex',
          expectedResponseTime: this.config.performanceTargets.maxResponseTime * 2,
          category: 'technical',
          requiresRAG: true,
          requiresAI: true
        }
      ],
      performanceThresholds: {
        standardQueryTime: this.config.performanceTargets.maxResponseTime,
        complexQueryTime: this.config.performanceTargets.maxResponseTime * 2,
        simpleQueryTime: this.config.performanceTargets.maxResponseTime / 2,
        averageResponseTime: this.config.performanceTargets.maxResponseTime,
        percentile95Time: this.config.performanceTargets.maxResponseTime * 1.5,
        percentile99Time: this.config.performanceTargets.maxResponseTime * 2
      },
      testParameters: {
        warmupQueries: 3,
        measurementQueries: 10,
        concurrentRequests: 1,
        requestInterval: 1000
      },
      networkConditions: [
        {
          name: 'Fast 3G',
          bandwidth: 1.6,
          latency: 150,
          packetLoss: 0,
          enabled: true
        },
        {
          name: 'Slow 3G',
          bandwidth: 0.4,
          latency: 300,
          packetLoss: 0,
          enabled: this.config.testEnvironment !== 'production'
        }
      ]
    };

    const test = new ResponseTimeTest(config);
    return await test.runTest();
  }

  /**
   * 同時ユーザー負荷テストの実行
   */
  private async runConcurrentLoadTest(): Promise<ConcurrentLoadTestResult> {
    const config: ConcurrentLoadTestConfig = {
      baseUrl: this.config.baseUrl,
      loadScenarios: [
        {
          name: 'Light Load',
          concurrentUsers: Math.floor(this.config.performanceTargets.maxConcurrentUsers * 0.25),
          duration: this.config.testDuration.loadTest,
          userBehavior: {
            loginFrequency: 10,
            chatFrequency: 60,
            searchFrequency: 20,
            idleTime: 5,
            sessionLength: 10
          },
          enabled: true
        },
        {
          name: 'Medium Load',
          concurrentUsers: Math.floor(this.config.performanceTargets.maxConcurrentUsers * 0.5),
          duration: this.config.testDuration.loadTest,
          userBehavior: {
            loginFrequency: 15,
            chatFrequency: 50,
            searchFrequency: 25,
            idleTime: 3,
            sessionLength: 15
          },
          enabled: true
        },
        {
          name: 'Heavy Load',
          concurrentUsers: this.config.performanceTargets.maxConcurrentUsers,
          duration: this.config.testDuration.loadTest,
          userBehavior: {
            loginFrequency: 20,
            chatFrequency: 40,
            searchFrequency: 30,
            idleTime: 2,
            sessionLength: 20
          },
          enabled: true
        }
      ],
      userProfiles: [
        {
          type: 'light',
          weight: 40,
          actionsPerMinute: 2,
          sessionDuration: 300,
          queryComplexity: 'simple'
        },
        {
          type: 'moderate',
          weight: 40,
          actionsPerMinute: 4,
          sessionDuration: 600,
          queryComplexity: 'standard'
        },
        {
          type: 'heavy',
          weight: 20,
          actionsPerMinute: 8,
          sessionDuration: 900,
          queryComplexity: 'complex'
        }
      ],
      testDuration: this.config.testDuration.loadTest,
      rampUpTime: 60,
      rampDownTime: 30,
      thresholds: {
        maxResponseTime: this.config.performanceTargets.maxResponseTime,
        maxErrorRate: 5,
        minThroughput: this.config.performanceTargets.minThroughput,
        maxCpuUsage: 80,
        maxMemoryUsage: 75
      }
    };

    const test = new ConcurrentLoadTest(config);
    return await test.runTest();
  } 
 /**
   * 稼働率監視テストの実行
   */
  private async runUptimeMonitoringTest(): Promise<UptimeMonitoringTestResult> {
    const config: UptimeMonitoringTestConfig = {
      baseUrl: this.config.baseUrl,
      monitoringEndpoints: [
        {
          name: 'Main Application',
          url: `${this.config.baseUrl}/`,
          method: 'GET',
          expectedStatusCode: 200,
          expectedResponseTime: this.config.performanceTargets.maxResponseTime,
          criticality: 'critical',
          healthCheckType: 'basic'
        },
        {
          name: 'Chat API',
          url: `${this.config.baseUrl}/api/chat`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'health check', userId: 'test' }),
          expectedStatusCode: 200,
          expectedResponseTime: this.config.performanceTargets.maxResponseTime * 1.5,
          criticality: 'critical',
          healthCheckType: 'functional'
        },
        {
          name: 'Health Check',
          url: `${this.config.baseUrl}/api/health`,
          method: 'GET',
          expectedStatusCode: 200,
          expectedResponseTime: 1000,
          criticality: 'standard',
          healthCheckType: 'deep'
        },
        {
          name: 'Authentication API',
          url: `${this.config.baseUrl}/api/auth/status`,
          method: 'GET',
          expectedStatusCode: 200,
          expectedResponseTime: 1500,
          criticality: 'critical',
          healthCheckType: 'functional'
        }
      ],
      monitoringDuration: this.config.testDuration.uptimeMonitoring,
      checkInterval: 30,
      uptimeTargets: {
        overall: this.config.performanceTargets.minUptime,
        critical: this.config.performanceTargets.minUptime + 0.05,
        standard: this.config.performanceTargets.minUptime - 0.5
      },
      alertThresholds: {
        consecutiveFailures: 3,
        responseTimeThreshold: this.config.performanceTargets.maxResponseTime * 2,
        errorRateThreshold: 5
      }
    };

    const test = new UptimeMonitoringTest(config);
    return await test.runTest();
  }

  /**
   * マルチリージョンスケーラビリティテストの実行
   */
  private async runMultiRegionScalabilityTest(): Promise<MultiRegionScalabilityTestResult> {
    const config: MultiRegionScalabilityTestConfig = {
      regions: [
        {
          name: 'Tokyo',
          region: 'ap-northeast-1',
          baseUrl: this.config.baseUrl.replace('localhost', 'tokyo.example.com'),
          priority: 1,
          expectedLatency: 50,
          capacity: {
            maxConcurrentUsers: this.config.performanceTargets.maxConcurrentUsers,
            maxThroughput: this.config.performanceTargets.minThroughput * 2
          },
          enabled: true
        },
        {
          name: 'Osaka',
          region: 'ap-northeast-3',
          baseUrl: this.config.baseUrl.replace('localhost', 'osaka.example.com'),
          priority: 2,
          expectedLatency: 80,
          capacity: {
            maxConcurrentUsers: Math.floor(this.config.performanceTargets.maxConcurrentUsers * 0.8),
            maxThroughput: Math.floor(this.config.performanceTargets.minThroughput * 1.6)
          },
          enabled: this.config.testEnvironment === 'production'
        }
      ],
      testScenarios: [
        {
          name: 'Linear Scaling Test',
          description: '線形スケーリングテスト',
          userLoad: [50, 100, 200, 400],
          duration: this.config.testDuration.scalabilityTest,
          rampUpTime: 60,
          testType: 'linear',
          expectedBehavior: 'Linear performance scaling'
        },
        {
          name: 'Spike Test',
          description: '急激な負荷増加テスト',
          userLoad: [100, this.config.performanceTargets.maxConcurrentUsers],
          duration: Math.floor(this.config.testDuration.scalabilityTest * 0.6),
          rampUpTime: 10,
          testType: 'spike',
          expectedBehavior: 'Graceful handling of traffic spikes'
        }
      ],
      performanceThresholds: {
        maxLatency: this.config.performanceTargets.maxResponseTime,
        minThroughput: this.config.performanceTargets.minThroughput,
        maxErrorRate: 5,
        maxRegionVariance: 30
      },
      loadDistribution: {
        strategy: 'weighted',
        weights: {
          'ap-northeast-1': 0.6,
          'ap-northeast-3': 0.4
        }
      },
      failoverTesting: {
        enabled: this.config.testEnvironment === 'production',
        scenarios: [
          {
            name: 'Tokyo to Osaka Failover',
            primaryRegion: 'ap-northeast-1',
            failoverRegion: 'ap-northeast-3',
            triggerType: 'simulated_failure',
            expectedFailoverTime: 30,
            expectedDataConsistency: true
          }
        ]
      }
    };

    const test = new MultiRegionScalabilityTest(config);
    return await test.runTest();
  }  /
**
   * 結果の統合と評価
   */
  private aggregateResults(results: Partial<PerformanceIntegrationTestResult>): PerformanceIntegrationTestResult {
    const duration = Date.now() - this.testStartTime;
    
    // 各テストのスコア収集
    const scores = {
      responseTime: results.responseTimeResult?.overallResponseScore || 0,
      concurrentLoad: results.concurrentLoadResult?.overallLoadScore || 0,
      uptimeMonitoring: results.uptimeMonitoringResult?.overallUptimeScore || 0,
      multiRegionScalability: results.multiRegionScalabilityResult?.overallScalabilityScore || 0
    };

    // 重み付きスコア計算
    const weights = {
      responseTime: 0.3,
      concurrentLoad: 0.3,
      uptimeMonitoring: 0.25,
      multiRegionScalability: 0.15
    };

    const overallPerformanceScore = Object.entries(scores).reduce((sum, [key, score]) => {
      return sum + (score * weights[key as keyof typeof weights]);
    }, 0);

    // カテゴリ別スコア計算
    const responseTimeScore = scores.responseTime;
    const scalabilityScore = (scores.concurrentLoad + scores.multiRegionScalability) / 2;
    const reliabilityScore = scores.uptimeMonitoring;
    const globalPerformanceScore = this.calculateGlobalPerformanceScore(results);

    // パフォーマンスサマリーの作成
    const performanceSummary = this.createPerformanceSummary(results, duration);

    // 推奨事項の生成
    const recommendations = this.generateRecommendations(results, scores);

    // 成功判定
    const success = overallPerformanceScore >= 85 && 
                   performanceSummary.criticalIssues === 0 && 
                   performanceSummary.systemUptime >= this.config.performanceTargets.minUptime;

    return {
      testName: 'PerformanceIntegrationTest',
      success,
      duration,
      details: {
        testEnvironment: this.config.testEnvironment,
        enabledTests: this.config.enabledTests,
        overallScore: overallPerformanceScore,
        individualScores: scores,
        performanceTargets: this.config.performanceTargets
      },
      ...results,
      overallPerformanceScore,
      responseTimeScore,
      scalabilityScore,
      reliabilityScore,
      globalPerformanceScore,
      performanceSummary,
      recommendations
    } as PerformanceIntegrationTestResult;
  }

  /**
   * グローバルパフォーマンススコアの計算
   */
  private calculateGlobalPerformanceScore(results: Partial<PerformanceIntegrationTestResult>): number {
    let totalScore = 0;
    let count = 0;

    if (results.responseTimeResult) {
      totalScore += results.responseTimeResult.overallResponseScore;
      count++;
    }

    if (results.concurrentLoadResult) {
      totalScore += results.concurrentLoadResult.overallLoadScore;
      count++;
    }

    if (results.multiRegionScalabilityResult) {
      totalScore += results.multiRegionScalabilityResult.globalPerformanceScore;
      count++;
    }

    return count > 0 ? totalScore / count : 0;
  }

  /**
   * パフォーマンスサマリーの作成
   */
  private createPerformanceSummary(results: Partial<PerformanceIntegrationTestResult>, duration: number): PerformanceSummary {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let averageResponseTime = 0;
    let peakThroughput = 0;
    let systemUptime = 0;
    let maxSupportedUsers = 0;
    let criticalIssues = 0;
    const performanceBottlenecks: string[] = [];
    const scalabilityLimitations: string[] = [];

    // 応答時間測定テスト
    if (results.responseTimeResult) {
      totalTests++;
      if (results.responseTimeResult.success) passedTests++;
      else failedTests++;

      averageResponseTime = results.responseTimeResult.performanceMetrics.overallAverageTime;
    }

    // 同時ユーザー負荷テスト
    if (results.concurrentLoadResult) {
      totalTests++;
      if (results.concurrentLoadResult.success) passedTests++;
      else failedTests++;

      peakThroughput = results.concurrentLoadResult.systemMetrics.peakThroughput;
      maxSupportedUsers = results.concurrentLoadResult.systemMetrics.peakConcurrentUsers;

      // ボトルネックの検出
      if (results.concurrentLoadResult.systemMetrics.peakCpuUsage > 80) {
        performanceBottlenecks.push('CPU使用率が高い');
      }
      if (results.concurrentLoadResult.systemMetrics.peakMemoryUsage > 80) {
        performanceBottlenecks.push('メモリ使用率が高い');
      }
    }

    // 稼働率監視テスト
    if (results.uptimeMonitoringResult) {
      totalTests++;
      if (results.uptimeMonitoringResult.success) passedTests++;
      else failedTests++;

      systemUptime = results.uptimeMonitoringResult.overallMetrics.totalUptime;
      criticalIssues += results.uptimeMonitoringResult.incidentReports.filter(i => i.severity === 'critical').length;
    }

    // マルチリージョンスケーラビリティテスト
    if (results.multiRegionScalabilityResult) {
      totalTests++;
      if (results.multiRegionScalabilityResult.success) passedTests++;
      else failedTests++;

      // スケーラビリティ制限の検出
      results.multiRegionScalabilityResult.regionResults.forEach(region => {
        if (region.scalabilityLimits.resourceBottlenecks.length > 0) {
          scalabilityLimitation    
      scalabilityLimitations.push(`${region.regionName}: ${region.scalabilityLimits.resourceBottlenecks.join(', ')}`);
        }
      });
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      averageResponseTime,
      peakThroughput,
      systemUptime,
      maxSupportedUsers,
      criticalIssues,
      performanceBottlenecks,
      scalabilityLimitations
    };
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(
    results: Partial<PerformanceIntegrationTestResult>, 
    scores: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // 応答時間の推奨事項
    if (scores.responseTime < 85) {
      recommendations.push('応答時間の最適化が必要です。データベースクエリやAI処理の効率化を検討してください。');
    }

    // 負荷テストの推奨事項
    if (scores.concurrentLoad < 85) {
      recommendations.push('同時ユーザー負荷への対応力を向上させてください。水平スケーリングの導入を検討してください。');
    }

    // 稼働率の推奨事項
    if (scores.uptimeMonitoring < 99) {
      recommendations.push(`システムの稼働率が目標値 ${this.config.performanceTargets.minUptime}% を下回っています。冗長化とフェイルオーバー機能の強化が必要です。`);
    }

    // マルチリージョンの推奨事項
    if (scores.multiRegionScalability < 85) {
      recommendations.push('マルチリージョン対応の改善が必要です。リージョン間の負荷分散とデータ同期の最適化を行ってください。');
    }

    // パフォーマンスボトルネックの推奨事項
    if (results.concurrentLoadResult?.systemMetrics.peakCpuUsage && results.concurrentLoadResult.systemMetrics.peakCpuUsage > 80) {
      recommendations.push('CPU使用率が高いため、処理の最適化またはインスタンスのスケールアップが必要です。');
    }

    if (results.concurrentLoadResult?.systemMetrics.peakMemoryUsage && results.concurrentLoadResult.systemMetrics.peakMemoryUsage > 80) {
      recommendations.push('メモリ使用率が高いため、メモリリークの調査またはメモリ容量の増強が必要です。');
    }

    // 応答時間の推奨事項
    if (results.responseTimeResult?.performanceMetrics.overallAverageTime && 
        results.responseTimeResult.performanceMetrics.overallAverageTime > this.config.performanceTargets.maxResponseTime) {
      recommendations.push(`平均応答時間が目標値 ${this.config.performanceTargets.maxResponseTime}ms を超えています。キャッシュ戦略の見直しが必要です。`);
    }

    // スループットの推奨事項
    if (results.concurrentLoadResult?.systemMetrics.peakThroughput && 
        results.concurrentLoadResult.systemMetrics.peakThroughput < this.config.performanceTargets.minThroughput) {
      recommendations.push(`スループットが目標値 ${this.config.performanceTargets.minThroughput} req/sec を下回っています。アーキテクチャの見直しが必要です。`);
    }

    // 一般的な推奨事項
    if (recommendations.length === 0) {
      recommendations.push('すべてのパフォーマンステストが良好な結果を示しています。現在のパフォーマンスレベルを維持してください。');
    }

    return recommendations;
  }

  /**
   * テスト結果のログ出力
   */
  private logTestResults(result: PerformanceIntegrationTestResult): void {
    console.log('\n📊 パフォーマンス統合テスト最終結果:');
    console.log('=' .repeat(60));
    console.log(`✅ 総合パフォーマンススコア: ${result.overallPerformanceScore.toFixed(1)}/100`);
    console.log(`⏱️ 応答時間スコア: ${result.responseTimeScore.toFixed(1)}/100`);
    console.log(`🚀 スケーラビリティスコア: ${result.scalabilityScore.toFixed(1)}/100`);
    console.log(`🔒 信頼性スコア: ${result.reliabilityScore.toFixed(1)}/100`);
    console.log(`🌍 グローバルパフォーマンス: ${result.globalPerformanceScore.toFixed(1)}/100`);

    console.log('\n📈 パフォーマンスサマリー:');
    console.log(`  総テスト数: ${result.performanceSummary.totalTests}`);
    console.log(`  合格: ${result.performanceSummary.passedTests}`);
    console.log(`  不合格: ${result.performanceSummary.failedTests}`);
    console.log(`  平均応答時間: ${result.performanceSummary.averageResponseTime.toFixed(0)}ms`);
    console.log(`  最大スループット: ${result.performanceSummary.peakThroughput.toFixed(1)} req/sec`);
    console.log(`  システム稼働率: ${result.performanceSummary.systemUptime.toFixed(3)}%`);
    console.log(`  最大サポートユーザー数: ${result.performanceSummary.maxSupportedUsers}人`);

    if (result.performanceSummary.criticalIssues > 0) {
      console.log(`  🔴 重要な問題: ${result.performanceSummary.criticalIssues}件`);
    }

    if (result.performanceSummary.performanceBottlenecks.length > 0) {
      console.log('\n⚠️  パフォーマンスボトルネック:');
      result.performanceSummary.performanceBottlenecks.forEach((bottleneck, index) => {
        console.log(`  ${index + 1}. ${bottleneck}`);
      });
    }

    if (result.performanceSummary.scalabilityLimitations.length > 0) {
      console.log('\n📊 スケーラビリティ制限:');
      result.performanceSummary.scalabilityLimitations.forEach((limitation, index) => {
        console.log(`  ${index + 1}. ${limitation}`);
      });
    }

    console.log('\n💡 推奨事項:');
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    if (result.success) {
      console.log('\n🎉 パフォーマンス統合テスト: 合格');
      console.log('   すべてのパフォーマンス要件を満たしています');
    } else {
      console.log('\n❌ パフォーマンス統合テスト: 不合格');
      console.log('   パフォーマンスの改善が必要です');
    }

    console.log('=' .repeat(60));
  }
}

/**
 * デフォルト設定でのパフォーマンス統合テスト実行
 */
export async function runPerformanceIntegrationTest(
  baseUrl: string = 'http://localhost:3000',
  testEnvironment: 'development' | 'staging' | 'production' = 'development'
): Promise<PerformanceIntegrationTestResult> {
  const config: PerformanceIntegrationTestConfig = {
    baseUrl,
    enabledTests: {
      responseTime: true,
      concurrentLoad: true,
      uptimeMonitoring: true,
      multiRegionScalability: testEnvironment === 'production'
    },
    testEnvironment,
    performanceTargets: {
      maxResponseTime: 2000,
      minThroughput: 50,
      minUptime: 99.9,
      maxConcurrentUsers: 100
    },
    testDuration: {
      responseTime: 300,
      loadTest: 600,
      uptimeMonitoring: 1800,
      scalabilityTest: 900
    }
  };

  const runner = new PerformanceIntegrationTestRunner(config);
  const result = await runner.runTests();
  
  // 結果のログ出力
  runner['logTestResults'](result);
  
  return result;
}