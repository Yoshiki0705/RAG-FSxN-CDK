#!/usr/bin/env node

/**
 * ドキュメント生成システムの最終テスト
 * 各コンポーネントの動作確認と品質検証を実施
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

import { OperationalGuidesGenerator } from './generators/operational-guides-generator';
import * as fs from 'fs';
import * as path from 'path';

/**
 * テスト結果の型定義
 */
interface TestResult {
  name: string;
  success: boolean;
  contentLength: number;
  duration: number;
  error?: Error;
}

/**
 * テスト設定の型定義
 */
interface TestConfig {
  enablePerformanceTest: boolean;
  enableContentValidation: boolean;
  minContentLength: number;
  maxExecutionTime: number;
}

/**
 * デフォルトテスト設定
 */
const DEFAULT_TEST_CONFIG: TestConfig = {
  enablePerformanceTest: true,
  enableContentValidation: true,
  minContentLength: 100, // 最小コンテンツ長
  maxExecutionTime: 5000 // 最大実行時間（ミリ秒）
};

/**
 * 設定ファイルからテスト設定を読み込み
 */
function loadTestConfig(): TestConfig {
  try {
    const configPath = path.join(__dirname, 'test-config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf-8');
      const customConfig = JSON.parse(configData) as Partial<TestConfig>;
      
      return {
        ...DEFAULT_TEST_CONFIG,
        ...customConfig
      };
    }
  } catch (error) {
    console.warn('⚠️ 設定ファイルの読み込みに失敗しました。デフォルト設定を使用します。');
  }
  
  return DEFAULT_TEST_CONFIG;
}

/**
 * テスト結果をファイルに保存
 */
function saveTestResults(results: TestResult[]): void {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultPath = path.join(__dirname, `test-results-${timestamp}.json`);
    
    const testReport = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      results: results.map(r => ({
        name: r.name,
        success: r.success,
        contentLength: r.contentLength,
        duration: r.duration,
        error: r.error?.message
      }))
    };
    
    fs.writeFileSync(resultPath, JSON.stringify(testReport, null, 2));
    console.log(`📄 テスト結果を保存しました: ${resultPath}`);
    
  } catch (error) {
    console.warn('⚠️ テスト結果の保存に失敗しました:', error);
  }
}

/**
 * 運用ガイド生成器のテスト実行
 */
async function testOperationalGuides(config: TestConfig): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const operationalGenerator = new OperationalGuidesGenerator();

  // テスト対象メソッドの定義
  const testCases = [
    {
      name: 'トラブルシューティングガイド',
      method: () => operationalGenerator.generateTroubleshootingGuide()
    },
    {
      name: '運用チェックリスト',
      method: () => operationalGenerator.generateOperationalChecklist()
    },
    {
      name: '監視ガイド',
      method: () => operationalGenerator.generateMonitoringGuide()
    }
  ];

  // 並列実行でパフォーマンス向上
  const testPromises = testCases.map(async (testCase) => {
    const startTime = Date.now();
    
    try {
      // メモリ効率を考慮した実行
      const content = await Promise.resolve(testCase.method());
      const duration = Date.now() - startTime;
      
      // コンテンツ検証（非同期で実行）
      const isValidContent = config.enableContentValidation ? 
        await Promise.resolve(validateContent(content, config.minContentLength)) : true;
      
      // パフォーマンス検証
      const isValidPerformance = config.enablePerformanceTest ? 
        duration <= config.maxExecutionTime : true;
      
      const success = isValidContent && isValidPerformance;
      
      const result: TestResult = {
        name: testCase.name,
        success,
        contentLength: content.length,
        duration,
        error: success ? undefined : new Error('検証失敗')
      };
      
      console.log(`   📖 ${testCase.name}: ${content.length} 文字 (${duration}ms)`);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        name: testCase.name,
        success: false,
        contentLength: 0,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
      
      console.error(`   ❌ ${testCase.name}: エラー発生`);
      return result;
    }
  });

  // 全ての並列テストの完了を待機
  const testResults = await Promise.allSettled(testPromises);
  
  // 結果の集約（エラーハンドリング付き）
  testResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      results.push({
        name: testCases[index].name,
        success: false,
        contentLength: 0,
        duration: 0,
        error: new Error(`並列実行エラー: ${result.reason}`)
      });
    }
  });

  return results;
}

/**
 * コンテンツの品質検証
 */
function validateContent(content: string, minLength: number): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  if (content.length < minLength) {
    return false;
  }
  
  // 基本的なマークダウン構造の確認
  const hasHeaders = /^#\s+/.test(content);
  const hasContent = content.trim().length > 0;
  
  return hasHeaders && hasContent;
}

/**
 * テスト結果の表示
 */
function displayTestResults(results: TestResult[]): void {
  console.log('');
  console.log('📊 テスト結果サマリー:');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = (successCount / totalCount * 100).toFixed(1);
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const performance = result.duration < 1000 ? '⚡' : result.duration < 3000 ? '🐌' : '🚨';
    
    console.log(`   ${status} ${result.name}: ${result.success ? '成功' : '失敗'} ${performance}`);
    
    if (result.error) {
      console.log(`      エラー: ${result.error.message}`);
    }
  });
  
  console.log('');
  console.log(`📈 成功率: ${successRate}% (${successCount}/${totalCount})`);
  
  if (successCount === totalCount) {
    console.log('🎉 全てのテストが正常に完了しました！');
  } else {
    console.log('⚠️ 一部のテストで問題が発生しました。');
  }
}

/**
 * メインテスト関数
 */
async function finalTest(): Promise<void> {
  console.log('🎯 ドキュメント生成システムの最終テストを開始します...');
  console.log('=================================================');
  console.log('');

  const startTime = Date.now();

  try {
    // 設定の読み込み
    const testConfig = loadTestConfig();
    console.log(`🔧 テスト設定: パフォーマンステスト=${testConfig.enablePerformanceTest}, コンテンツ検証=${testConfig.enableContentValidation}`);
    
    // 1. 運用ガイド生成器のテスト
    console.log('1️⃣ 運用ガイド生成器のテスト...');
    const operationalResults = await testOperationalGuides(testConfig);
    
    console.log('   ✅ 運用ガイド生成テスト完了');

    // テスト結果の表示と保存
    displayTestResults(operationalResults);
    saveTestResults(operationalResults);
    
    const totalDuration = Date.now() - startTime;
    const allSuccess = operationalResults.every(r => r.success);
    
    console.log('');
    console.log('=================================================');
    console.log(`⏱️ 総実行時間: ${totalDuration}ms`);
    
    if (allSuccess) {
      console.log('');
      console.log('💡 次のステップ:');
      console.log('   1. npm run docs:generate でフルドキュメント生成を実行');
      console.log('   2. 生成されたドキュメントを確認');
      console.log('   3. 必要に応じてカスタマイズ');
      console.log('');
      console.log('📚 ドキュメント生成システムが正常に動作しています！');
    } else {
      console.log('');
      console.log('🔧 推奨対応:');
      console.log('   1. エラーログを確認');
      console.log('   2. 失敗したコンポーネントを修正');
      console.log('   3. テストを再実行');
      
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ テスト実行エラー:');
    if (error instanceof Error) {
      console.error(`エラーメッセージ: ${error.message}`);
      if (error.stack) {
        console.error(`スタックトレース: ${error.stack}`);
      }
    } else {
      console.error(error);
    }
    console.error('');
    process.exit(1);
  }
}

/**
 * プロセス終了時のクリーンアップ
 */
function cleanup(): void {
  // 必要に応じてリソースのクリーンアップを実行
  console.log('🧹 クリーンアップ処理完了');
}

/**
 * 予期しないエラーのハンドリング
 */
process.on('uncaughtException', (error: Error) => {
  console.error('❌ 予期しないエラーが発生しました:', error.message);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ 未処理のPromise拒否:', reason);
  cleanup();
  process.exit(1);
});

/**
 * 正常終了時のクリーンアップ
 */
process.on('exit', (code: number) => {
  if (code === 0) {
    cleanup();
  }
});

/**
 * メイン実行部
 */
if (require.main === module) {
  finalTest().catch((error) => {
    console.error('❌ 最終テスト実行エラー:', error);
    cleanup();
    process.exit(1);
  });
}