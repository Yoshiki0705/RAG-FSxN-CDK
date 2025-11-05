#!/usr/bin/env ts-node

/**
 * パフォーマンステスト実行スクリプト
 * 
 * 実本番環境でのシステムパフォーマンステストを実行
 * コマンドライン引数で環境とテストタイプを指定可能
 * 
 * 使用例:
 * npm run test:performance:production
 * npm run test:performance:staging
 * ts-node run-performance-tests.ts --env production --type all
 * ts-node run-performance-tests.ts --env staging --type concurrent
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

import { Command } from 'commander';
import PerformanceTestRunner from './performance-test-runner';
import ProductionTestEngine from '../../core/production-test-engine';
import { ProductionConfig, getProductionConfig } from '../../config/production-config';
import { 
  getPerformanceConfig, 
  validatePerformanceConfig, 
  displayPerformanceConfig,
  PerformanceTestConfig 
} from './performance-config';
import EmergencyStopManager from '../../core/emergency-stop-manager';
import * as fs from 'fs';
import * as path from 'path';

/**
 * テストタイプの定義
 */
type TestType = 'all' | 'basic' | 'concurrent' | 'resource' | 'scalability';

/**
 * コマンドライン引数の解析
 */
function parseArguments() {
  const program = new Command();
  
  program
    .name('run-performance-tests')
    .description('実本番環境でのパフォーマンステスト実行')
    .version('1.0.0')
    .option('-e, --env <environment>', '実行環境 (production, staging, development)', 'production')
    .option('-t, --type <testType>', 'テストタイプ (all, basic, concurrent, resource, scalability)', 'all')
    .option('-r, --report <path>', 'レポート出力パス', './performance-test-report.md')
    .option('-v, --verbose', '詳細ログ出力', false)
    .option('--dry-run', 'ドライラン実行（実際のテストは行わない）', false)
    .option('--emergency-stop', '緊急停止機能を有効化', true)
    .parse();

  return program.opts();
}

/**
 * 環境設定の検証と表示
 */
async function validateAndDisplayConfig(
  environment: string,
  performanceConfig: PerformanceTestConfig
): Promise<boolean> {
  console.log('🔍 設定検証中...');
  
  // パフォーマンステスト設定の検証
  const validation = validatePerformanceConfig(performanceConfig);
  
  if (!validation.isValid) {
    console.error('❌ パフォーマンステスト設定エラー:');
    validation.errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ パフォーマンステスト設定警告:');
    validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  // 設定の表示
  displayPerformanceConfig(performanceConfig);
  
  return true;
}

/**
 * 個別テストの実行
 */
async function runIndividualTest(
  testRunner: PerformanceTestRunner,
  testType: TestType
): Promise<any> {
  const testModule = (testRunner as any).testModule;
  
  switch (testType) {
    case 'basic':
      console.log('⚡ 基本レスポンス時間テストを実行中...');
      return await testModule.testBasicResponseTime();
      
    case 'concurrent':
      console.log('🔄 同時接続負荷テストを実行中...');
      return await testModule.testConcurrentLoad();
      
    case 'resource':
      console.log('📊 リソース使用率テストを実行中...');
      return await testModule.testResourceUtilization();
      
    case 'scalability':
      console.log('📈 スケーラビリティテストを実行中...');
      return await testModule.testScalability();
      
    default:
      throw new Error(`未対応のテストタイプ: ${testType}`);
  }
}

/**
 * テスト結果のレポート生成
 */
async function generateTestReport(
  results: Map<string, any>,
  testRunner: PerformanceTestRunner,
  reportPath: string,
  environment: string
): Promise<void> {
  console.log('📝 テストレポートを生成中...');
  
  try {
    const report = await testRunner.generateDetailedReport(results);
    
    // レポートファイルの保存
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report, 'utf8');
    
    console.log(`✅ テストレポートを保存しました: ${reportPath}`);
    
    // 簡易サマリーの表示
    const summary = Array.from(results.values());
    const successCount = summary.filter(r => r.success).length;
    const totalCount = summary.length;
    
    console.log('');
    console.log('📊 テスト実行サマリー:');
    console.log(`   環境: ${environment}`);
    console.log(`   総テスト数: ${totalCount}`);
    console.log(`   成功: ${successCount}`);
    console.log(`   失敗: ${totalCount - successCount}`);
    console.log(`   成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ レポート生成エラー:', error);
    throw error;
  }
}

/**
 * ドライラン実行
 */
async function runDryRun(
  environment: string,
  testType: TestType,
  performanceConfig: PerformanceTestConfig
): Promise<void> {
  console.log('🔍 ドライラン実行中...');
  console.log('');
  
  console.log('📋 実行予定のテスト:');
  
  if (testType === 'all') {
    console.log('   ✓ 基本レスポンス時間テスト');
    console.log('   ✓ 同時接続負荷テスト');
    console.log('   ✓ リソース使用率テスト');
    console.log('   ✓ スケーラビリティテスト');
  } else {
    console.log(`   ✓ ${testType}テスト`);
  }
  
  console.log('');
  console.log('📊 予想実行時間:');
  
  let estimatedDuration = 0;
  if (testType === 'all') {
    estimatedDuration = 2 + 3 + 5 + 10; // 各テストの予想時間（分）
  } else {
    const durations = { basic: 2, concurrent: 3, resource: 5, scalability: 10 };
    estimatedDuration = durations[testType as keyof typeof durations] || 5;
  }
  
  console.log(`   予想実行時間: 約${estimatedDuration}分`);
  console.log(`   最大コスト: $${performanceConfig.costLimits.maxTestCost}`);
  console.log('');
  
  console.log('🛡️ 安全設定:');
  console.log(`   緊急停止: ${performanceConfig.safety.enableEmergencyStop ? '有効' : '無効'}`);
  console.log(`   最大実行時間: ${performanceConfig.safety.maxTestDuration}秒`);
  console.log(`   自動コスト停止: ${performanceConfig.safety.autoStopOnHighCost ? '有効' : '無効'}`);
  console.log('');
  
  console.log('✅ ドライラン完了 - 実際のテストは実行されませんでした');
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  const options = parseArguments();
  
  console.log('🚀 パフォーマンステスト実行開始');
  console.log(`   環境: ${options.env}`);
  console.log(`   テストタイプ: ${options.type}`);
  console.log(`   レポート出力: ${options.report}`);
  console.log(`   ドライラン: ${options.dryRun ? 'はい' : 'いいえ'}`);
  console.log('');
  
  try {
    // 設定の読み込み
    const productionConfig = getProductionConfig(options.env);
    const performanceConfig = getPerformanceConfig(options.env);
    
    // 設定の検証
    const isConfigValid = await validateAndDisplayConfig(options.env, performanceConfig);
    if (!isConfigValid) {
      process.exit(1);
    }
    
    // ドライラン実行
    if (options.dryRun) {
      await runDryRun(options.env, options.type as TestType, performanceConfig);
      return;
    }
    
    // 緊急停止マネージャーの初期化
    let emergencyStopManager: EmergencyStopManager | undefined;
    if (options.emergencyStop) {
      emergencyStopManager = new EmergencyStopManager({
        maxTestDuration: performanceConfig.safety.maxTestDuration * 1000,
        resourceThreshold: performanceConfig.safety.resourceUsageThreshold,
        costThreshold: performanceConfig.costLimits.maxTestCost,
        enableAutoStop: performanceConfig.safety.autoStopOnHighCost
      });
      
      await emergencyStopManager.initialize();
      console.log('🛡️ 緊急停止マネージャーを初期化しました');
    }
    
    // テストエンジンの初期化
    const testEngine = new ProductionTestEngine(productionConfig);
    await testEngine.initialize();
    
    // パフォーマンステストランナーの初期化
    const testRunner = new PerformanceTestRunner(productionConfig, testEngine);
    
    let results: Map<string, any>;
    
    try {
      if (options.type === 'all') {
        // 全テストの実行
        const testResults = await testRunner.runPerformanceTests();
        results = testResults.results;
        
        console.log('');
        console.log('📊 全パフォーマンステスト完了:');
        console.log(`   成功率: ${(testResults.summary.successRate * 100).toFixed(1)}%`);
        console.log(`   総合パフォーマンススコア: ${(testResults.summary.overallPerformanceScore * 100).toFixed(1)}%`);
        console.log(`   平均応答時間: ${testResults.summary.averageResponseTime.toFixed(0)}ms`);
        console.log(`   最大スループット: ${testResults.summary.maxThroughput.toFixed(2)} req/sec`);
        
      } else {
        // 個別テストの実行
        const result = await runIndividualTest(testRunner, options.type as TestType);
        results = new Map([[result.testId, result]]);
        
        console.log('');
        console.log(`📊 ${options.type}テスト完了:`);
        console.log(`   ステータス: ${result.success ? '成功' : '失敗'}`);
        console.log(`   実行時間: ${result.duration}ms`);
        
        if (result.performanceMetrics) {
          console.log(`   応答時間: ${result.performanceMetrics.responseTime.toFixed(0)}ms`);
          console.log(`   スループット: ${result.performanceMetrics.throughput.toFixed(2)} req/sec`);
          console.log(`   エラー率: ${(result.performanceMetrics.errorRate * 100).toFixed(1)}%`);
        }
      }
      
      // レポート生成
      await generateTestReport(results, testRunner, options.report, options.env);
      
    } finally {
      // クリーンアップ
      await testRunner.cleanup();
      await testEngine.cleanup();
      
      if (emergencyStopManager) {
        await emergencyStopManager.cleanup();
      }
    }
    
    console.log('');
    console.log('✅ パフォーマンステスト実行完了');
    
  } catch (error) {
    console.error('❌ パフォーマンステスト実行エラー:', error);
    
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
      if (options.verbose) {
        console.error('スタックトレース:', error.stack);
      }
    }
    
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を実行
if (require.main === module) {
  main().catch(error => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
}

export { main as runPerformanceTests };