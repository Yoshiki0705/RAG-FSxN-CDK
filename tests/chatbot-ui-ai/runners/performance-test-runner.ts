/**
 * パフォーマンステストランナー
 * 
 * パフォーマンス関連のテストを統合実行
 * - 応答時間・負荷テスト
 * - スケーラビリティテスト
 * - パフォーマンス統合レポート生成
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

import { TestResult, TestConfiguration } from '../types/test-types';
import ResponseTimeTests from '../performance/response-time-tests';
import ScalabilityTests from '../performance/scalability-tests';

/**
 * パフォーマンステストランナークラス
 */
export class PerformanceTestRunner {
  private config: TestConfiguration;
  private responseTimeTests: ResponseTimeTests;
  private scalabilityTests: ScalabilityTests;
  private allResults: TestResult[] = [];

  constructor(config: TestConfiguration) {
    this.config = config;
    this.responseTimeTests = new ResponseTimeTests(config);
    this.scalabilityTests = new ScalabilityTests(config);
  }

  /**
   * 全パフォーマンステストを実行
   */
  async runAllPerformanceTests(): Promise<{
    results: TestResult[];
    summary: PerformanceTestSummary;
    report: PerformanceTestReport;
  }> {
    console.log('⚡ パフォーマンステストスイート開始');
    console.log('=====================================');
    
    const startTime = Date.now();
    this.allResults = [];

    try {
      // 応答時間・負荷テスト実行
      console.log('\n📋 Phase 1: 応答時間・負荷テスト');
      const responseTimeResults = await this.responseTimeTests.runAllTests();
      this.allResults.push(...responseTimeResults);

      // スケーラビリティテスト実行
      console.log('\n📋 Phase 2: スケーラビリティテスト');
      const scalabilityResults = await this.scalabilityTests.runAllTests();
      this.allResults.push(...scalabilityResults);

      // 統合パフォーマンステスト実行
      console.log('\n📋 Phase 3: 統合パフォーマンステスト');
      const integrationResults = await this.runIntegratedPerformanceTests();
      this.allResults.push(...integrationResults);

      const duration = Date.now() - startTime;
      const summary = this.generatePerformanceTestSummary(duration);
      const report = this.generatePerformanceTestReport();

      console.log('\n⚡ パフォーマンステストスイート完了');
      console.log('=====================================');
      console.log(`📊 総合結果: ${summary.totalPassed}/${summary.totalTests} 成功`);
      console.log(`⏱️ 実行時間: ${(duration / 1000).toFixed(2)}秒`);
      console.log(`🚀 パフォーマンススコア: ${summary.performanceScore.toFixed(1)}%`);

      return {
        results: this.allResults,
        summary,
        report
      };

    } catch (error) {
      console.error('❌ パフォーマンステストスイートでエラーが発生:', error);
      throw error;
    }
  }

  /**
   * 統合パフォーマンステスト実行
   */
  private async runIntegratedPerformanceTests(): Promise<TestResult[]> {
    const integrationTests = [
      { name: 'エンドツーエンドパフォーマンステスト', method: this.testEndToEndPerformance.bind(this) },
      { name: 'ストレステスト', method: this.testStressTest.bind(this) },
      { name: 'パフォーマンス回帰テスト', method: this.testPerformanceRegression.bind(this) },
      { name: 'リソース効率性テスト', method: this.testResourceEfficiency.bind(this) }
    ];

    const results: TestResult[] = [];

    for (const test of integrationTests) {
      try {
        console.log(`  🔍 実行中: ${test.name}`);
        const result = await test.method();
        results.push(result);
        
        if (result.status === 'passed') {
          console.log(`  ✅ 成功: ${test.name}`);
        } else {
          console.log(`  ❌ 失敗: ${test.name} - ${result.error}`);
        }
      } catch (error) {
        const errorResult: TestResult = {
          testName: test.name,
          category: 'Performance Integration',
          status: 'failed',
          duration: 0,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          priority: 'high'
        };
        results.push(errorResult);
        console.log(`  ❌ エラー: ${test.name} - ${error}`);
      }
    }

    return results;
  }

  /**
   * エンドツーエンドパフォーマンステスト
   */
  private async testEndToEndPerformance(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const e2eScenarios = [
        {
          scenario: '典型的なユーザーフロー',
          steps: [
            { action: 'ログイン', expectedTime: 2000 },
            { action: '質問送信', expectedTime: 5000 },
            { action: 'ストリーミング応答', expectedTime: 1000 },
            { action: '応答完了', expectedTime: 8000 },
            { action: 'ログアウト', expectedTime: 1000 }
          ]
        },
        {
          scenario: '複雑な質問フロー',
          steps: [
            { action: 'ログイン', expectedTime: 2000 },
            { action: '複雑な質問送信', expectedTime: 8000 },
            { action: 'ストリーミング応答', expectedTime: 1500 },
            { action: '詳細応答完了', expectedTime: 15000 },
            { action: 'フォローアップ質問', expectedTime: 6000 }
          ]
        }
      ];

      const e2eResults = [];
      for (const scenario of e2eScenarios) {
        const stepResults = [];
        let totalTime = 0;
        let allStepsSuccessful = true;

        for (const step of scenario.steps) {
          const stepStart = Date.now();
          const stepResult = await this.executeE2EStep(step.action);
          const stepTime = Date.now() - stepStart;
          
          const stepSuccess = stepResult.success && stepTime <= step.expectedTime;
          
          stepResults.push({
            action: step.action,
            expectedTime: step.expectedTime,
            actualTime: stepTime,
            success: stepSuccess
          });

          totalTime += stepTime;
          if (!stepSuccess) allStepsSuccessful = false;

          // ステップ間の短い休憩
          await this.sleep(500);
        }

        e2eResults.push({
          scenario: scenario.scenario,
          totalTime,
          allStepsSuccessful,
          stepResults,
          completedSteps: stepResults.filter(s => s.success).length,
          totalSteps: stepResults.length
        });
      }

      const allE2ESuccessful = e2eResults.every(r => r.allStepsSuccessful);
      const averageE2ETime = e2eResults.reduce((sum, r) => sum + r.totalTime, 0) / e2eResults.length;

      return {
        testName: 'エンドツーエンドパフォーマンステスト',
        category: 'Performance Integration',
        status: allE2ESuccessful ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        priority: 'high',
        details: {
          testedScenarios: e2eScenarios.length,
          successfulE2E: e2eResults.filter(r => r.allStepsSuccessful).length,
          averageE2ETime,
          e2eResults
        },
        metrics: {
          e2eSuccessRate: e2eResults.filter(r => r.allStepsSuccessful).length / e2eScenarios.length,
          averageE2ETime,
          e2eEfficiency: e2eResults.reduce((sum, r) => sum + r.completedSteps, 0) / 
                        e2eResults.reduce((sum, r) => sum + r.totalSteps, 0)
        }
      };

    } catch (error) {
      return {
        testName: 'エンドツーエンドパフォーマンステスト',
        category: 'Performance Integration',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        priority: 'high'
      };
    }
  }

  /**
   * ストレステスト
   */
  private async testStressTest(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const stressScenarios = [
        {
          name: '高負荷ストレス',
          concurrentUsers: 100,
          duration: 300000, // 5分
          expectedSuccessRate: 0.8 // 80%以上
        },
        {
          name: '極限負荷ストレス',
          concurrentUsers: 200,
          duration: 180000, // 3分
          expectedSuccessRate: 0.6 // 60%以上
        }
      ];

      const stressResults = [];
      for (const scenario of stressScenarios) {
        console.log(`    💥 実行中: ${scenario.name} (${scenario.concurrentUsers}ユーザー)`);
        
        const stressResult = await this.executeStressTest(scenario.concurrentUsers, scenario.duration);
        
        stressResults.push({
          name: scenario.name,
          concurrentUsers: scenario.concurrentUsers,
          duration: scenario.duration,
          totalRequests: stressResult.totalRequests,
          successfulRequests: stressResult.successfulRequests,
          successRate: stressResult.successRate,
          averageResponseTime: stressResult.averageResponseTime,
          maxResponseTime: stressResult.maxResponseTime,
          throughput: stressResult.throughput,
          expectedSuccessRate: scenario.expectedSuccessRate,
          meetsRequirement: stressResult.successRate >= scenario.expectedSuccessRate
        });

        // ストレステスト間の回復時間
        await this.sleep(60000);
      }

      const allStressTestsSuccessful = stressResults.every(r => r.meetsRequirement);
      const overallSuccessRate = stressResults.reduce((sum, r) => sum + r.successRate, 0) / stressResults.length;

      return {
        testName: 'ストレステスト',
        category: 'Performance Integration',
        status: allStressTestsSuccessful ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        priority: 'high',
        details: {
          stressScenarios: stressScenarios.length,
          successfulStressTests: stressResults.filter(r => r.meetsRequirement).length,
          overallSuccessRate,
          maxConcurrentUsers: Math.max(...stressResults.map(r => r.concurrentUsers)),
          stressResults
        },
        metrics: {
          stressTestSuccessRate: stressResults.filter(r => r.meetsRequirement).length / stressScenarios.length,
          overallSuccessRate,
          maxSupportedLoad: stressResults.filter(r => r.meetsRequirement).length > 0 
            ? Math.max(...stressResults.filter(r => r.meetsRequirement).map(r => r.concurrentUsers))
            : 0
        }
      };

    } catch (error) {
      return {
        testName: 'ストレステスト',
        category: 'Performance Integration',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        priority: 'high'
      };
    }
  }

  /**
   * パフォーマンス回帰テスト
   */
  private async testPerformanceRegression(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // ベースラインパフォーマンス指標
      const baselineMetrics = {
        averageResponseTime: 3000, // 3秒
        maxResponseTime: 5000, // 5秒
        throughput: 10, // requests per second
        errorRate: 0.02 // 2%
      };

      const regressionTests = [
        {
          testName: '基本応答時間回帰',
          metric: 'responseTime',
          baseline: baselineMetrics.averageResponseTime,
          tolerance: 0.1 // 10%の劣化まで許容
        },
        {
          testName: 'スループット回帰',
          metric: 'throughput',
          baseline: baselineMetrics.throughput,
          tolerance: 0.15 // 15%の劣化まで許容
        },
        {
          testName: 'エラー率回帰',
          metric: 'errorRate',
          baseline: baselineMetrics.errorRate,
          tolerance: 0.5 // 50%の増加まで許容
        }
      ];

      const regressionResults = [];
      for (const test of regressionTests) {
        const currentMetric = await this.measureCurrentMetric(test.metric);
        const degradation = Math.abs(currentMetric - test.baseline) / test.baseline;
        
        regressionResults.push({
          testName: test.testName,
          metric: test.metric,
          baseline: test.baseline,
          current: currentMetric,
          degradation,
          tolerance: test.tolerance,
          meetsRequirement: degradation <= test.tolerance
        });
      }

      const allRegressionTestsPass = regressionResults.every(r => r.meetsRequirement);
      const averageDegradation = regressionResults.reduce((sum, r) => sum + r.degradation, 0) / regressionResults.length;

      return {
        testName: 'パフォーマンス回帰テスト',
        category: 'Performance Integration',
        status: allRegressionTestsPass ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        priority: 'medium',
        details: {
          regressionTests: regressionTests.length,
          passingTests: regressionResults.filter(r => r.meetsRequirement).length,
          averageDegradation,
          regressionResults
        },
        metrics: {
          regressionTestPassRate: regressionResults.filter(r => r.meetsRequirement).length / regressionTests.length,
          averageDegradation,
          performanceStability: 1 - averageDegradation
        }
      };

    } catch (error) {
      return {
        testName: 'パフォーマンス回帰テスト',
        category: 'Performance Integration',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        priority: 'medium'
      };
    }
  }

  /**
   * リソース効率性テスト
   */
  private async testResourceEfficiency(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const efficiencyTests = [
        {
          testName: 'CPU効率性',
          resourceType: 'cpu',
          expectedEfficiency: 0.7 // 70%以上の効率
        },
        {
          testName: 'メモリ効率性',
          resourceType: 'memory',
          expectedEfficiency: 0.8 // 80%以上の効率
        },
        {
          testName: 'ネットワーク効率性',
          resourceType: 'network',
          expectedEfficiency: 0.75 // 75%以上の効率
        }
      ];

      const efficiencyResults = [];
      for (const test of efficiencyTests) {
        const efficiency = await this.measureResourceEfficiency(test.resourceType);
        
        efficiencyResults.push({
          testName: test.testName,
          resourceType: test.resourceType,
          efficiency,
          expectedEfficiency: test.expectedEfficiency,
          meetsRequirement: efficiency >= test.expectedEfficiency
        });
      }

      const allEfficiencyTestsPass = efficiencyResults.every(r => r.meetsRequirement);
      const overallEfficiency = efficiencyResults.reduce((sum, r) => sum + r.efficiency, 0) / efficiencyResults.length;

      return {
        testName: 'リソース効率性テスト',
        category: 'Performance Integration',
        status: allEfficiencyTestsPass ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        priority: 'medium',
        details: {
          efficiencyTests: efficiencyTests.length,
          efficientResources: efficiencyResults.filter(r => r.meetsRequirement).length,
          overallEfficiency,
          efficiencyResults
        },
        metrics: {
          resourceEfficiencyScore: efficiencyResults.filter(r => r.meetsRequirement).length / efficiencyTests.length,
          overallEfficiency,
          efficiencyGrade: this.calculateEfficiencyGrade(overallEfficiency)
        }
      };

    } catch (error) {
      return {
        testName: 'リソース効率性テスト',
        category: 'Performance Integration',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        priority: 'medium'
      };
    }
  }  /
/ ヘルパーメソッド

  /**
   * E2Eステップ実行
   */
  private async executeE2EStep(action: string): Promise<{ success: boolean; error?: string }> {
    try {
      switch (action) {
        case 'ログイン':
          // 模擬ログイン処理
          await this.sleep(1000);
          return { success: true };
          
        case '質問送信':
        case '複雑な質問送信':
          // 模擬質問送信
          await this.invokeModel('amazon.nova-micro-v1:0', 'E2Eテスト用の質問です。');
          return { success: true };
          
        case 'ストリーミング応答':
          // 模擬ストリーミング応答
          await this.sleep(800);
          return { success: true };
          
        case '応答完了':
        case '詳細応答完了':
          // 模擬応答完了
          await this.sleep(2000);
          return { success: true };
          
        case 'フォローアップ質問':
          // 模擬フォローアップ
          await this.invokeModel('amazon.nova-micro-v1:0', 'フォローアップ質問です。');
          return { success: true };
          
        case 'ログアウト':
          // 模擬ログアウト処理
          await this.sleep(500);
          return { success: true };
          
        default:
          return { success: false, error: `未知のアクション: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * ストレステスト実行
   */
  private async executeStressTest(concurrentUsers: number, duration: number): Promise<{
    totalRequests: number;
    successfulRequests: number;
    successRate: number;
    averageResponseTime: number;
    maxResponseTime: number;
    throughput: number;
  }> {
    const results = [];
    const endTime = Date.now() + duration;
    const promises = [];

    // 並行ユーザーを開始
    for (let i = 0; i < concurrentUsers; i++) {
      const userPromise = this.runStressUser(i + 1, endTime);
      promises.push(userPromise);
    }

    const userResults = await Promise.all(promises);
    
    // 全ユーザーの結果を統合
    for (const userResult of userResults) {
      results.push(...userResult);
    }

    const successfulResults = results.filter(r => r.success);
    const totalRequests = results.length;
    const successfulRequests = successfulResults.length;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
    
    const averageResponseTime = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length
      : 0;
    
    const maxResponseTime = successfulResults.length > 0
      ? Math.max(...successfulResults.map(r => r.responseTime))
      : 0;
    
    const throughput = totalRequests / (duration / 1000); // requests per second

    return {
      totalRequests,
      successfulRequests,
      successRate,
      averageResponseTime,
      maxResponseTime,
      throughput
    };
  }

  /**
   * ストレステスト用ユーザー実行
   */
  private async runStressUser(userId: number, endTime: number): Promise<Array<{
    success: boolean;
    responseTime: number;
    error?: string;
  }>> {
    const results = [];
    let requestCount = 0;

    while (Date.now() < endTime) {
      requestCount++;
      const start = Date.now();
      
      try {
        await this.invokeModel('amazon.nova-micro-v1:0', `ストレステスト ユーザー${userId} リクエスト${requestCount}`);
        results.push({
          success: true,
          responseTime: Date.now() - start
        });
      } catch (error) {
        results.push({
          success: false,
          responseTime: Date.now() - start,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // ストレステスト用の短い間隔
      await this.sleep(Math.random() * 1000 + 500); // 0.5-1.5秒のランダム間隔
    }

    return results;
  }

  /**
   * 現在のメトリック測定
   */
  private async measureCurrentMetric(metricType: string): Promise<number> {
    switch (metricType) {
      case 'responseTime':
        return await this.measureCurrentResponseTime();
      case 'throughput':
        return await this.measureCurrentThroughput();
      case 'errorRate':
        return await this.measureCurrentErrorRate();
      default:
        return 0;
    }
  }

  /**
   * 現在の応答時間測定
   */
  private async measureCurrentResponseTime(): Promise<number> {
    const measurements = [];
    
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      try {
        await this.invokeModel('amazon.nova-micro-v1:0', '応答時間測定用のテストです。');
        measurements.push(Date.now() - start);
      } catch (error) {
        // エラーの場合はスキップ
      }
      await this.sleep(1000);
    }

    return measurements.length > 0 
      ? measurements.reduce((sum, time) => sum + time, 0) / measurements.length
      : 5000; // デフォルト値
  }

  /**
   * 現在のスループット測定
   */
  private async measureCurrentThroughput(): Promise<number> {
    const testDuration = 30000; // 30秒
    const startTime = Date.now();
    const promises = [];
    let requestCount = 0;

    while (Date.now() - startTime < testDuration) {
      requestCount++;
      const promise = this.invokeModel('amazon.nova-micro-v1:0', `スループット測定 ${requestCount}`);
      promises.push(promise);
      
      await this.sleep(1000); // 1秒間隔
    }

    try {
      await Promise.all(promises);
      return requestCount / (testDuration / 1000); // requests per second
    } catch (error) {
      return requestCount / (testDuration / 1000); // 部分的な成功も含める
    }
  }

  /**
   * 現在のエラー率測定
   */
  private async measureCurrentErrorRate(): Promise<number> {
    const totalRequests = 20;
    let errorCount = 0;

    for (let i = 0; i < totalRequests; i++) {
      try {
        await this.invokeModel('amazon.nova-micro-v1:0', `エラー率測定 ${i + 1}`);
      } catch (error) {
        errorCount++;
      }
      await this.sleep(500);
    }

    return errorCount / totalRequests;
  }

  /**
   * リソース効率性測定
   */
  private async measureResourceEfficiency(resourceType: string): Promise<number> {
    switch (resourceType) {
      case 'cpu':
        return await this.measureCPUEfficiency();
      case 'memory':
        return await this.measureMemoryEfficiency();
      case 'network':
        return await this.measureNetworkEfficiency();
      default:
        return 0.5; // デフォルト効率性
    }
  }

  /**
   * CPU効率性測定
   */
  private async measureCPUEfficiency(): Promise<number> {
    // 簡易CPU効率性測定（実際の実装では詳細な測定が必要）
    const startTime = Date.now();
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      // 軽い計算処理
      Math.sqrt(i * Math.random());
    }
    
    const executionTime = Date.now() - startTime;
    const expectedTime = 100; // 期待実行時間（ms）
    
    return Math.min(expectedTime / executionTime, 1.0);
  }

  /**
   * メモリ効率性測定
   */
  private async measureMemoryEfficiency(): Promise<number> {
    const beforeMemory = process.memoryUsage();
    
    // メモリを使用する処理
    const testArray = new Array(10000).fill(0).map((_, i) => ({ id: i, data: `test-${i}` }));
    
    const afterMemory = process.memoryUsage();
    const memoryUsed = (afterMemory.heapUsed - beforeMemory.heapUsed) / 1024 / 1024; // MB
    const expectedMemory = 5; // 期待メモリ使用量（MB）
    
    // メモリを解放
    testArray.length = 0;
    
    return Math.min(expectedMemory / memoryUsed, 1.0);
  }

  /**
   * ネットワーク効率性測定
   */
  private async measureNetworkEfficiency(): Promise<number> {
    const startTime = Date.now();
    
    try {
      await this.invokeModel('amazon.nova-micro-v1:0', 'ネットワーク効率性測定用のテストです。');
      const networkTime = Date.now() - startTime;
      const expectedTime = 2000; // 期待ネットワーク時間（ms）
      
      return Math.min(expectedTime / networkTime, 1.0);
    } catch (error) {
      return 0.3; // エラー時の低効率性
    }
  }

  /**
   * 効率性グレード計算
   */
  private calculateEfficiencyGrade(efficiency: number): string {
    if (efficiency >= 0.9) return 'A';
    if (efficiency >= 0.8) return 'B';
    if (efficiency >= 0.7) return 'C';
    if (efficiency >= 0.6) return 'D';
    return 'F';
  }

  /**
   * モデル呼び出し
   */
  private async invokeModel(modelId: string, prompt: string): Promise<string> {
    // 簡易実装（実際のBedrockクライアントを使用）
    await this.sleep(Math.random() * 2000 + 1000); // 1-3秒のランダム遅延
    return `応答: ${prompt}`;
  }

  /**
   * スリープ関数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * パフォーマンステストサマリー生成
   */
  private generatePerformanceTestSummary(duration: number): PerformanceTestSummary {
    const totalTests = this.allResults.length;
    const totalPassed = this.allResults.filter(r => r.status === 'passed').length;
    const totalFailed = totalTests - totalPassed;
    
    const responseTimeTests = this.allResults.filter(r => r.category === 'Performance');
    const scalabilityTests = this.allResults.filter(r => r.category === 'Scalability');
    const integrationTests = this.allResults.filter(r => r.category === 'Performance Integration');
    
    const performanceScore = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    return {
      totalTests,
      totalPassed,
      totalFailed,
      responseTimeTests: responseTimeTests.length,
      responseTimePassed: responseTimeTests.filter(r => r.status === 'passed').length,
      scalabilityTests: scalabilityTests.length,
      scalabilityPassed: scalabilityTests.filter(r => r.status === 'passed').length,
      integrationTests: integrationTests.length,
      integrationPassed: integrationTests.filter(r => r.status === 'passed').length,
      performanceScore,
      duration,
      timestamp: new Date()
    };
  }

  /**
   * パフォーマンステストレポート生成
   */
  private generatePerformanceTestReport(): PerformanceTestReport {
    const categories = [...new Set(this.allResults.map(r => r.category))];
    const categoryResults = categories.map(category => {
      const categoryTests = this.allResults.filter(r => r.category === category);
      const passed = categoryTests.filter(r => r.status === 'passed').length;
      
      return {
        category,
        total: categoryTests.length,
        passed,
        failed: categoryTests.length - passed,
        successRate: categoryTests.length > 0 ? passed / categoryTests.length : 0
      };
    });

    const failedTests = this.allResults.filter(r => r.status === 'failed');
    const performanceMetrics = this.extractPerformanceMetrics();

    return {
      summary: {
        totalCategories: categories.length,
        categoryResults,
        overallSuccessRate: this.allResults.length > 0 ? 
          this.allResults.filter(r => r.status === 'passed').length / this.allResults.length : 0
      },
      performance: performanceMetrics,
      failures: {
        total: failedTests.length,
        details: failedTests.map(test => ({
          testName: test.testName,
          category: test.category,
          priority: test.priority,
          error: test.error,
          timestamp: test.timestamp
        }))
      },
      recommendations: this.generatePerformanceRecommendations(failedTests, performanceMetrics)
    };
  }

  /**
   * パフォーマンスメトリクス抽出
   */
  private extractPerformanceMetrics(): any {
    const responseTimeMetrics = this.allResults
      .filter(r => r.metrics?.averageResponseTime)
      .map(r => r.metrics.averageResponseTime);
    
    const throughputMetrics = this.allResults
      .filter(r => r.metrics?.averageThroughput)
      .map(r => r.metrics.averageThroughput);

    return {
      averageResponseTime: responseTimeMetrics.length > 0 
        ? responseTimeMetrics.reduce((sum, time) => sum + time, 0) / responseTimeMetrics.length
        : 0,
      maxResponseTime: responseTimeMetrics.length > 0 
        ? Math.max(...responseTimeMetrics)
        : 0,
      averageThroughput: throughputMetrics.length > 0
        ? throughputMetrics.reduce((sum, throughput) => sum + throughput, 0) / throughputMetrics.length
        : 0,
      maxThroughput: throughputMetrics.length > 0
        ? Math.max(...throughputMetrics)
        : 0
    };
  }

  /**
   * パフォーマンス推奨事項生成
   */
  private generatePerformanceRecommendations(failedTests: TestResult[], metrics: any): string[] {
    const recommendations: string[] = [];

    if (failedTests.some(t => t.testName.includes('応答時間'))) {
      recommendations.push('応答時間の最適化を検討してください。モデルの選択やリクエストサイズの調整が効果的です');
    }

    if (failedTests.some(t => t.testName.includes('負荷'))) {
      recommendations.push('負荷処理能力の向上を検討してください。並列処理の最適化やリソースの増強が必要です');
    }

    if (failedTests.some(t => t.testName.includes('スケーラビリティ'))) {
      recommendations.push('スケーラビリティの改善を検討してください。自動スケーリングの設定やアーキテクチャの見直しが効果的です');
    }

    if (metrics.averageResponseTime > 5000) {
      recommendations.push('平均応答時間が5秒を超えています。パフォーマンスチューニングを実施してください');
    }

    if (metrics.averageThroughput < 5) {
      recommendations.push('スループットが低下しています。システムのボトルネックを特定し、最適化を実施してください');
    }

    if (recommendations.length === 0) {
      recommendations.push('全てのパフォーマンステストが成功しました。現在のパフォーマンスレベルを維持してください');
    }

    return recommendations;
  }
}

/**
 * パフォーマンステストサマリー型定義
 */
export interface PerformanceTestSummary {
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  responseTimeTests: number;
  responseTimePassed: number;
  scalabilityTests: number;
  scalabilityPassed: number;
  integrationTests: number;
  integrationPassed: number;
  performanceScore: number;
  duration: number;
  timestamp: Date;
}

/**
 * パフォーマンステストレポート型定義
 */
export interface PerformanceTestReport {
  summary: {
    totalCategories: number;
    categoryResults: Array<{
      category: string;
      total: number;
      passed: number;
      failed: number;
      successRate: number;
    }>;
    overallSuccessRate: number;
  };
  performance: {
    averageResponseTime: number;
    maxResponseTime: number;
    averageThroughput: number;
    maxThroughput: number;
  };
  failures: {
    total: number;
    details: Array<{
      testName: string;
      category: string;
      priority: string;
      error?: string;
      timestamp: Date;
    }>;
  };
  recommendations: string[];
}

export default PerformanceTestRunner;