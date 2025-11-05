#!/usr/bin/env node

/**
 * 統合テスト実行スクリプト
 * セキュリティ、パフォーマンス、機能テストの統合実行
 * 本番環境での包括的なシステム検証を実行
 */

import IntegratedTestRunner from './integrated-test-runner';
import { ProductionConfig } from './config/production-config';
import { getIntegratedTestConfig, validateIntegratedTestConfig } from './config/integrated-test-config';

async function runIntegratedTests() {
  console.log('🚀 統合テスト実行開始');
  console.log('=====================================');
  console.log('');

  let testRunner: IntegratedTestRunner | undefined;

  try {
    // 環境設定の読み込み
    const environment = process.env.NODE_ENV || process.env.ENVIRONMENT || 'development';
    console.log(`📋 実行環境: ${environment}`);

    // 統合テスト設定の取得と検証
    const integratedConfig = getIntegratedTestConfig(environment);
    const validation = validateIntegratedTestConfig(integratedConfig);

    if (!validation.isValid) {
      console.error('❌ 統合テスト設定エラー:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ 統合テスト設定警告:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      console.log('');
    }

    // 本番設定の初期化
    const productionConfig: ProductionConfig = {
      environment,
      region: process.env.AWS_REGION || 'us-east-1',
      projectName: process.env.PROJECT_NAME || 'rag-system',
      accountId: process.env.AWS_ACCOUNT_ID || '',
      domainName: process.env.DOMAIN_NAME || 'rag-system.example.com',
      certificateArn: process.env.CERTIFICATE_ARN || '',
      hostedZoneId: process.env.HOSTED_ZONE_ID || '',
      enableWaf: true,
      enableCloudTrail: true,
      enableGuardDuty: true,
      enableSecurityHub: true,
      testConfiguration: {
        maxTestDuration: integratedConfig.timeoutMs,
        maxConcurrentTests: integratedConfig.maxConcurrentTests,
        retryAttempts: integratedConfig.retryAttempts,
        timeoutMs: integratedConfig.timeoutMs,
        enableDetailedLogging: integratedConfig.reportingConfig.includeLogs,
        enableMetrics: integratedConfig.reportingConfig.includeMetrics,
        enableAlerts: true,
        costThreshold: integratedConfig.resourceLimits.maxCostThreshold,
        resourceThreshold: integratedConfig.resourceLimits.maxCpuUsage / 100
      }
    };

    // 統合テストランナーの初期化
    console.log('🔧 統合テストランナーを初期化中...');
    testRunner = new IntegratedTestRunner(integratedConfig, productionConfig);
    await testRunner.initialize();

    // 設定情報の表示
    displayTestConfiguration(integratedConfig);

    // 統合テストの実行
    console.log('🚀 統合テスト実行中...');
    console.log('');
    
    const startTime = Date.now();
    const testResults = await testRunner.runIntegratedTests();
    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    console.log('');
    console.log('📊 統合テスト実行完了');
    console.log('=====================================');
    console.log(`⏱️ 総実行時間: ${(totalDuration / 1000).toFixed(1)}秒`);
    console.log(`✅ 総合成功: ${testResults.overallSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`📊 総合スコア: ${testResults.summary.overallScore.toFixed(1)}/100`);
    console.log('');

    // 最終評価とアドバイス
    provideFinalAssessment(testResults);

    // 終了コードの設定
    const exitCode = determineExitCode(testResults, integratedConfig);
    
    if (exitCode === 0) {
      console.log('🎉 統合テストが正常に完了しました');
    } else {
      console.log('⚠️ 統合テストで問題が検出されました');
    }

    process.exit(exitCode);

  } catch (error) {
    console.error('');
    console.error('❌ 統合テスト実行エラー:');
    console.error(error);
    console.error('');

    // エラー詳細の表示
    if (error instanceof Error) {
      console.error('エラー詳細:');
      console.error(`  メッセージ: ${error.message}`);
      if (error.stack) {
        console.error(`  スタックトレース: ${error.stack}`);
      }
    }

    process.exit(1);

  } finally {
    // リソースのクリーンアップ
    if (testRunner) {
      console.log('🧹 リソースをクリーンアップ中...');
      
      try {
        await testRunner.cleanup();
        console.log('✅ クリーンアップ完了');
        
      } catch (cleanupError) {
        console.warn('⚠️ クリーンアップ中にエラーが発生:', cleanupError);
      }
    }
  }
}

/**
 * テスト設定情報の表示
 */
function displayTestConfiguration(config: any): void {
  console.log('🔧 統合テスト設定:');
  console.log(`   環境: ${config.environment}`);
  console.log(`   並列実行: ${config.parallelExecution ? 'はい' : 'いいえ'}`);
  console.log(`   最大同時実行数: ${config.maxConcurrentTests}`);
  console.log(`   タイムアウト: ${(config.timeoutMs / 1000 / 60).toFixed(1)}分`);
  console.log(`   リトライ回数: ${config.retryAttempts}`);
  console.log(`   緊急停止: ${config.emergencyStopEnabled ? '有効' : '無効'}`);
  console.log('');

  console.log('📋 有効なテストスイート:');
  const enabledSuites = config.testSuites.filter((suite: any) => suite.enabled);
  enabledSuites.forEach((suite: any) => {
    const criticalMark = suite.criticalTest ? '🚨' : '📝';
    const priorityMark = suite.priority >= 90 ? '🔥' : suite.priority >= 80 ? '⚡' : '📋';
    console.log(`   ${criticalMark} ${priorityMark} ${suite.name} (優先度: ${suite.priority})`);
    
    if (suite.dependencies.length > 0) {
      console.log(`      依存関係: ${suite.dependencies.join(', ')}`);
    }
  });
  console.log('');

  console.log('📊 リソース制限:');
  console.log(`   CPU使用率: ${config.resourceLimits.maxCpuUsage}%`);
  console.log(`   メモリ使用率: ${config.resourceLimits.maxMemoryUsage}%`);
  console.log(`   ネットワーク帯域: ${config.resourceLimits.maxNetworkBandwidth}Mbps`);
  console.log(`   ストレージ使用量: ${config.resourceLimits.maxStorageUsage}GB`);
  console.log(`   コスト上限: $${config.resourceLimits.maxCostThreshold}`);
  console.log('');

  console.log('📄 レポート設定:');
  console.log(`   詳細レポート: ${config.reportingConfig.generateDetailedReport ? '有効' : '無効'}`);
  console.log(`   出力形式: ${config.reportingConfig.exportFormats.join(', ')}`);
  console.log(`   出力ディレクトリ: ${config.reportingConfig.outputDirectory}`);
  console.log('');
}

/**
 * 最終評価とアドバイスの提供
 */
function provideFinalAssessment(testResults: any): void {
  console.log('🎯 最終評価:');
  
  const overallScore = testResults.summary.overallScore;
  const criticalIssues = testResults.summary.criticalIssues;
  
  // 総合評価
  if (overallScore >= 95) {
    console.log('🏆 優秀: システムは最高レベルの品質を維持しています');
    console.log('   継続的な監視と定期的なテストの実施を推奨します');
  } else if (overallScore >= 85) {
    console.log('✅ 良好: システムは高い品質を維持しています');
    console.log('   軽微な改善により、さらなる品質向上が期待できます');
  } else if (overallScore >= 75) {
    console.log('⚠️ 注意: システムに改善が必要な領域があります');
    console.log('   推奨事項に従って改善を実施してください');
  } else if (overallScore >= 60) {
    console.log('🚨 警告: システムに重要な問題があります');
    console.log('   緊急の改善が必要です。優先的に対応してください');
  } else {
    console.log('💥 危険: システムに深刻な問題があります');
    console.log('   即座の対応が必要です。本番運用を停止することを検討してください');
  }

  // 分野別評価
  console.log('');
  console.log('📊 分野別評価:');
  
  const securityScore = testResults.summary.securityScore;
  const performanceScore = testResults.summary.performanceScore;
  const functionalScore = testResults.summary.functionalScore;

  console.log(`   🔒 セキュリティ: ${securityScore.toFixed(1)}/100 ${getScoreEmoji(securityScore)}`);
  if (securityScore < 80) {
    console.log('      → セキュリティ対策の強化が必要です');
  }

  console.log(`   ⚡ パフォーマンス: ${performanceScore.toFixed(1)}/100 ${getScoreEmoji(performanceScore)}`);
  if (performanceScore < 75) {
    console.log('      → システムの最適化を検討してください');
  }

  console.log(`   🔧 機能: ${functionalScore.toFixed(1)}/100 ${getScoreEmoji(functionalScore)}`);
  if (functionalScore < 90) {
    console.log('      → 機能の修正が必要です');
  }

  // 重要な問題
  if (criticalIssues > 0) {
    console.log('');
    console.log(`🚨 重要な問題: ${criticalIssues}件`);
    console.log('   これらの問題は優先的に対応してください');
  }

  // 推奨事項
  if (testResults.recommendations.length > 0) {
    console.log('');
    console.log('💡 主要な推奨事項:');
    testResults.recommendations.slice(0, 3).forEach((recommendation: string, index: number) => {
      console.log(`   ${index + 1}. ${recommendation}`);
    });
    
    if (testResults.recommendations.length > 3) {
      console.log(`   ... 他 ${testResults.recommendations.length - 3} 件の推奨事項があります`);
    }
  }

  console.log('');
}

/**
 * スコアに応じた絵文字の取得
 */
function getScoreEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 80) return '🟡';
  if (score >= 70) return '🟠';
  return '🔴';
}

/**
 * 終了コードの決定
 */
function determineExitCode(testResults: any, config: any): number {
  // 総合成功判定
  if (!testResults.overallSuccess) {
    return 1;
  }

  // 重要なテストスイートの失敗チェック
  const criticalSuites = config.testSuites.filter((suite: any) => suite.criticalTest && suite.enabled);
  for (const suite of criticalSuites) {
    const result = testResults.testSuiteResults.get(suite.name);
    if (result && !result.success) {
      return 1;
    }
  }

  // スコア基準での判定
  const overallScore = testResults.summary.overallScore;
  const securityScore = testResults.summary.securityScore;
  
  // セキュリティスコアが低い場合は失敗
  if (securityScore < 70) {
    return 1;
  }

  // 総合スコアが低い場合は失敗
  if (overallScore < 70) {
    return 1;
  }

  // 重要な問題がある場合は失敗
  if (testResults.summary.criticalIssues > 0) {
    return 1;
  }

  return 0;
}

// スクリプトの実行
if (require.main === module) {
  runIntegratedTests().catch(error => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
}

export { runIntegratedTests };