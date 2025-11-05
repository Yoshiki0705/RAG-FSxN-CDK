#!/usr/bin/env ts-node

/**
 * パフォーマンス統合テスト実行スクリプト
 * 全パフォーマンステストの実行とレポート生成
 */

import * as fs from 'fs';
import * as path from 'path';
import { PerformanceIntegrationTestRunner, PerformanceIntegrationTestConfig, PerformanceIntegrationTestResult } from '../modules/performance/performance-integration-test-runner';

// 環境変数からの設定読み込み
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_ENVIRONMENT = (process.env.TEST_ENVIRONMENT as 'development' | 'staging' | 'production') || 'development';
const MAX_RESPONSE_TIME = parseInt(process.env.MAX_RESPONSE_TIME || '2000');
const MIN_THROUGHPUT = parseInt(process.env.MIN_THROUGHPUT || '50');
const MIN_UPTIME = parseFloat(process.env.MIN_UPTIME || '99.9');
const MAX_CONCURRENT_USERS = parseInt(process.env.MAX_CONCURRENT_USERS || '100');

// 個別テスト有効化フラグ
const INCLUDE_RESPONSE_TIME = process.env.INCLUDE_RESPONSE_TIME !== 'false';
const INCLUDE_CONCURRENT_LOAD = process.env.INCLUDE_CONCURRENT_LOAD !== 'false';
const INCLUDE_UPTIME_MONITORING = process.env.INCLUDE_UPTIME_MONITORING !== 'false';
const INCLUDE_MULTI_REGION_SCALABILITY = process.env.INCLUDE_MULTI_REGION_SCALABILITY !== 'false';

// テスト期間設定
const RESPONSE_TIME_DURATION = parseInt(process.env.RESPONSE_TIME_DURATION || '300');
const LOAD_TEST_DURATION = parseInt(process.env.LOAD_TEST_DURATION || '600');
const UPTIME_MONITORING_DURATION = parseInt(process.env.UPTIME_MONITORING_DURATION || '1800');
const SCALABILITY_TEST_DURATION = parseInt(process.env.SCALABILITY_TEST_DURATION || '900');

interface TestExecutionOptions {
  baseUrl: string;
  testEnvironment: 'development' | 'staging' | 'production';
  enabledTests: {
    responseTime: boolean;
    concurrentLoad: boolean;
    uptimeMonitoring: boolean;
    multiRegionScalability: boolean;
  };
  performanceTargets: {
    maxResponseTime: number;
    minThroughput: number;
    minUptime: number;
    maxConcurrentUsers: number;
  };
  outputDir: string;
  reportFormats: ('json' | 'markdown' | 'html')[];
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  console.log('⚡ パフォーマンス統合テスト実行スクリプトを開始します...');
  console.log(`📅 実行日時: ${new Date().toLocaleString('ja-JP')}`);
  console.log(`🌐 テスト環境: ${TEST_ENVIRONMENT}`);
  console.log(`🔗 ベースURL: ${BASE_URL}`);

  const startTime = Date.now();

  try {
    // 出力ディレクトリの準備
    const outputDir = await prepareOutputDirectory();

    // テスト設定の構築
    const options: TestExecutionOptions = {
      baseUrl: BASE_URL,
      testEnvironment: TEST_ENVIRONMENT,
      enabledTests: {
        responseTime: INCLUDE_RESPONSE_TIME,
        concurrentLoad: INCLUDE_CONCURRENT_LOAD,
        uptimeMonitoring: INCLUDE_UPTIME_MONITORING,
        multiRegionScalability: INCLUDE_MULTI_REGION_SCALABILITY
      },
      performanceTargets: {
        maxResponseTime: MAX_RESPONSE_TIME,
        minThroughput: MIN_THROUGHPUT,
        minUptime: MIN_UPTIME,
        maxConcurrentUsers: MAX_CONCURRENT_USERS
      },
      outputDir,
      reportFormats: ['json', 'markdown']
    };

    // 有効なテストの確認
    const enabledTestCount = Object.values(options.enabledTests).filter(Boolean).length;
    if (enabledTestCount === 0) {
      console.log('⚠️  有効なテストがありません。少なくとも1つのテストを有効にしてください。');
      process.exit(1);
    }

    console.log(`\n📋 実行予定テスト (${enabledTestCount}個):`);
    if (options.enabledTests.responseTime) console.log('  ✅ 応答時間測定テスト');
    if (options.enabledTests.concurrentLoad) console.log('  ✅ 同時ユーザー負荷テスト');
    if (options.enabledTests.uptimeMonitoring) console.log('  ✅ 稼働率監視テスト');
    if (options.enabledTests.multiRegionScalability) console.log('  ✅ マルチリージョンスケーラビリティテスト');

    console.log('\n🎯 パフォーマンス目標:');
    console.log(`  最大応答時間: ${options.performanceTargets.maxResponseTime}ms`);
    console.log(`  最小スループット: ${options.performanceTargets.minThroughput} req/sec`);
    console.log(`  最小稼働率: ${options.performanceTargets.minUptime}%`);
    console.log(`  最大同時ユーザー数: ${options.performanceTargets.maxConcurrentUsers}人`);

    // テストの実行
    const result = await executePerformanceTests(options);

    // レポートの生成
    await generateReports(result, options);

    // 結果の評価と終了処理
    const executionTime = Date.now() - startTime;
    await handleTestCompletion(result, executionTime);

  } catch (error) {
    console.error('❌ パフォーマンス統合テストの実行中にエラーが発生しました:', error);
    
    // エラーレポートの生成
    await generateErrorReport(error, Date.now() - startTime);
    
    process.exit(1);
  }
}

/**
 * 出力ディレクトリの準備
 */
async function prepareOutputDirectory(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const outputDir = path.join(__dirname, '..', 'reports', 'performance-integration', `${TEST_ENVIRONMENT}-${timestamp}`);

  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
    console.log(`📁 出力ディレクトリを作成しました: ${outputDir}`);
    return outputDir;
  } catch (error) {
    console.error('❌ 出力ディレクトリの作成に失敗:', error);
    throw error;
  }
}

/**
 * パフォーマンス統合テストの実行
 */
async function executePerformanceTests(options: TestExecutionOptions): Promise<PerformanceIntegrationTestResult> {
  console.log('\n🚀 パフォーマンス統合テストを実行中...');

  const config: PerformanceIntegrationTestConfig = {
    baseUrl: options.baseUrl,
    enabledTests: options.enabledTests,
    testEnvironment: options.testEnvironment,
    performanceTargets: options.performanceTargets,
    testDuration: {
      responseTime: RESPONSE_TIME_DURATION,
      loadTest: LOAD_TEST_DURATION,
      uptimeMonitoring: UPTIME_MONITORING_DURATION,
      scalabilityTest: SCALABILITY_TEST_DURATION
    }
  };

  const runner = new PerformanceIntegrationTestRunner(config);
  return await runner.runTests();
}

/**
 * レポートの生成
 */
async function generateReports(result: PerformanceIntegrationTestResult, options: TestExecutionOptions): Promise<void> {
  console.log('\n📊 テストレポートを生成中...');

  for (const format of options.reportFormats) {
    try {
      switch (format) {
        case 'json':
          await generateJSONReport(result, options.outputDir);
          break;
        case 'markdown':
          await generateMarkdownReport(result, options.outputDir);
          break;
        case 'html':
          await generateHTMLReport(result, options.outputDir);
          break;
      }
    } catch (error) {
      console.error(`❌ ${format.toUpperCase()}レポートの生成に失敗:`, error);
    }
  }
}

/**
 * JSONレポートの生成
 */
async function generateJSONReport(result: PerformanceIntegrationTestResult, outputDir: string): Promise<void> {
  const reportPath = path.join(outputDir, 'performance-integration-test-result.json');
  
  const reportData = {
    metadata: {
      testType: 'Performance Integration Test',
      executionDate: new Date().toISOString(),
      environment: TEST_ENVIRONMENT,
      baseUrl: BASE_URL,
      version: '1.0.0'
    },
    summary: {
      success: result.success,
      overallScore: result.overallPerformanceScore,
      duration: result.duration,
      performanceSummary: result.performanceSummary
    },
    scores: {
      responseTime: result.responseTimeScore,
      scalability: result.scalabilityScore,
      reliability: result.reliabilityScore,
      globalPerformance: result.globalPerformanceScore
    },
    testResults: {
      responseTime: result.responseTimeResult,
      concurrentLoad: result.concurrentLoadResult,
      uptimeMonitoring: result.uptimeMonitoringResult,
      multiRegionScalability: result.multiRegionScalabilityResult
    },
    recommendations: result.recommendations
  };

  await fs.promises.writeFile(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`✅ JSONレポートを生成しました: ${reportPath}`);
}

/**
 * レポートデータの共通構造
 */
interface ReportData {
  executionTime: string;
  environment: string;
  baseUrl: string;
  duration: string;
  success: boolean;
  result: PerformanceIntegrationTestResult;
}

/**
 * 共通レポートデータの生成
 */
function createReportData(result: PerformanceIntegrationTestResult): ReportData {
  return {
    executionTime: new Date().toLocaleString('ja-JP'),
    environment: TEST_ENVIRONMENT,
    baseUrl: BASE_URL,
    duration: (result.duration / 1000).toFixed(1),
    success: result.success,
    result
  };
}

/**
 * セキュアな文字列エスケープ
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * スコア状態の判定
 */
function getScoreStatus(score: number, threshold: number): { icon: string; class: string } {
  if (score >= threshold) {
    return { icon: '✅', class: 'success' };
  } else if (score >= threshold * 0.8) {
    return { icon: '⚠️', class: 'warning' };
  } else {
    return { icon: '❌', class: 'danger' };
  }
}

/**
 * Markdownレポートの生成
 */
async function generateMarkdownReport(result: PerformanceIntegrationTestResult, outputDir: string): Promise<void> {
  const reportPath = path.join(outputDir, 'performance-integration-test-report.md');
  const reportData = createReportData(result);
  
  const sections = [
    generateMarkdownHeader(reportData),
    generateMarkdownScoreOverview(result),
    generateMarkdownPerformanceSummary(result),
    generateMarkdownIssuesSection(result),
    generateIndividualTestResults(result),
    generateMarkdownRecommendations(result),
    generateMarkdownTargetComparison(result),
    generateMarkdownFooter()
  ];

  const markdown = sections.join('\n\n');
  
  await fs.promises.writeFile(reportPath, markdown, 'utf-8');
  console.log(`✅ Markdownレポートを生成しました: ${reportPath}`);
}

/**
 * Markdownヘッダーセクション生成
 */
function generateMarkdownHeader(reportData: ReportData): string {
  return `# パフォーマンス統合テストレポート

## 📋 テスト概要

- **実行日時**: ${reportData.executionTime}
- **テスト環境**: ${reportData.environment}
- **ベースURL**: ${reportData.baseUrl}
- **実行時間**: ${reportData.duration}秒
- **総合結果**: ${reportData.success ? '✅ 合格' : '❌ 不合格'}`;
}

/**
 * Markdownスコア概要セクション生成
 */
function generateMarkdownScoreOverview(result: PerformanceIntegrationTestResult): string {
  const scores = [
    { name: '**総合パフォーマンス**', score: result.overallPerformanceScore, threshold: 85 },
    { name: '応答時間', score: result.responseTimeScore, threshold: 80 },
    { name: 'スケーラビリティ', score: result.scalabilityScore, threshold: 80 },
    { name: '信頼性', score: result.reliabilityScore, threshold: 85 },
    { name: 'グローバルパフォーマンス', score: result.globalPerformanceScore, threshold: 80 }
  ];

  const tableRows = scores.map(({ name, score, threshold }) => {
    const status = getScoreStatus(score, threshold);
    return `| ${name} | ${score.toFixed(1)}/100 | ${status.icon} |`;
  }).join('\n');

  return `## 📊 スコア概要

| カテゴリ | スコア | 状態 |
|---------|--------|------|
${tableRows}`;
}

/**
 * Markdownパフォーマンスサマリーセクション生成
 */
function generateMarkdownPerformanceSummary(result: PerformanceIntegrationTestResult): string {
  return `## 📈 パフォーマンスサマリー

- **総テスト数**: ${result.performanceSummary.totalTests}
- **合格テスト**: ${result.performanceSummary.passedTests}
- **不合格テスト**: ${result.performanceSummary.failedTests}
- **平均応答時間**: ${result.performanceSummary.averageResponseTime.toFixed(0)}ms
- **最大スループット**: ${result.performanceSummary.peakThroughput.toFixed(1)} req/sec
- **システム稼働率**: ${result.performanceSummary.systemUptime.toFixed(3)}%
- **最大サポートユーザー数**: ${result.performanceSummary.maxSupportedUsers}人`;
}

/**
 * Markdown問題セクション生成
 */
function generateMarkdownIssuesSection(result: PerformanceIntegrationTestResult): string {
  let content = `### 問題の内訳

- 🔴 **重要な問題**: ${result.performanceSummary.criticalIssues}件`;

  if (result.performanceSummary.performanceBottlenecks.length > 0) {
    content += `\n\n### ⚠️ パフォーマンスボトルネック\n\n${result.performanceSummary.performanceBottlenecks.map((bottleneck, index) => `${index + 1}. ${bottleneck}`).join('\n')}`;
  }

  if (result.performanceSummary.scalabilityLimitations.length > 0) {
    content += `\n\n### 📊 スケーラビリティ制限\n\n${result.performanceSummary.scalabilityLimitations.map((limitation, index) => `${index + 1}. ${limitation}`).join('\n')}`;
  }

  return content;
}

/**
 * Markdown推奨事項セクション生成
 */
function generateMarkdownRecommendations(result: PerformanceIntegrationTestResult): string {
  return `## 💡 推奨事項

${result.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}`;
}

/**
 * Markdown目標比較セクション生成
 */
function generateMarkdownTargetComparison(result: PerformanceIntegrationTestResult): string {
  const comparisons = [
    {
      metric: '最大応答時間',
      target: `${MAX_RESPONSE_TIME}ms`,
      actual: `${result.performanceSummary.averageResponseTime.toFixed(0)}ms`,
      achieved: result.performanceSummary.averageResponseTime <= MAX_RESPONSE_TIME
    },
    {
      metric: '最小スループット',
      target: `${MIN_THROUGHPUT} req/sec`,
      actual: `${result.performanceSummary.peakThroughput.toFixed(1)} req/sec`,
      achieved: result.performanceSummary.peakThroughput >= MIN_THROUGHPUT
    },
    {
      metric: '最小稼働率',
      target: `${MIN_UPTIME}%`,
      actual: `${result.performanceSummary.systemUptime.toFixed(3)}%`,
      achieved: result.performanceSummary.systemUptime >= MIN_UPTIME
    },
    {
      metric: '最大同時ユーザー数',
      target: `${MAX_CONCURRENT_USERS}人`,
      actual: `${result.performanceSummary.maxSupportedUsers}人`,
      achieved: result.performanceSummary.maxSupportedUsers >= MAX_CONCURRENT_USERS
    }
  ];

  const tableRows = comparisons.map(({ metric, target, actual, achieved }) => 
    `| ${metric} | ${target} | ${actual} | ${achieved ? '✅ 達成' : '❌ 未達成'} |`
  ).join('\n');

  return `## 🎯 パフォーマンス目標との比較

| 指標 | 目標値 | 実績値 | 達成状況 |
|------|--------|--------|----------|
${tableRows}`;
}

/**
 * Markdownフッター生成
 */
function generateMarkdownFooter(): string {
  return `---
*このレポートは自動生成されました - ${new Date().toISOString()}*`;
}

/**
 * 個別テスト結果の生成
 */
function generateIndividualTestResults(result: PerformanceIntegrationTestResult): string {
  let content = '';

  if (result.responseTimeResult) {
    content += `### ⏱️ 応答時間測定テスト

- **スコア**: ${result.responseTimeResult.overallResponseScore.toFixed(1)}/100
- **結果**: ${result.responseTimeResult.success ? '✅ 合格' : '❌ 不合格'}
- **平均応答時間**: ${result.responseTimeResult.performanceMetrics.overallAverageTime.toFixed(0)}ms
- **95パーセンタイル**: ${result.responseTimeResult.performanceMetrics.overallPercentile95.toFixed(0)}ms
- **スループット**: ${result.responseTimeResult.performanceMetrics.throughput.toFixed(1)} req/sec
- **成功率**: ${result.responseTimeResult.performanceMetrics.successRate.toFixed(1)}%

`;
  }

  if (result.concurrentLoadResult) {
    content += `### 👥 同時ユーザー負荷テスト

- **スコア**: ${result.concurrentLoadResult.overallLoadScore.toFixed(1)}/100
- **結果**: ${result.concurrentLoadResult.success ? '✅ 合格' : '❌ 不合格'}
- **最大同時ユーザー数**: ${result.concurrentLoadResult.systemMetrics.peakConcurrentUsers}人
- **最大スループット**: ${result.concurrentLoadResult.systemMetrics.peakThroughput.toFixed(1)} req/sec
- **最大CPU使用率**: ${result.concurrentLoadResult.systemMetrics.peakCpuUsage.toFixed(1)}%
- **最大メモリ使用率**: ${result.concurrentLoadResult.systemMetrics.peakMemoryUsage.toFixed(1)}%

`;
  }

  if (result.uptimeMonitoringResult) {
    content += `### 📊 稼働率監視テスト

- **スコア**: ${result.uptimeMonitoringResult.overallUptimeScore.toFixed(1)}/100
- **結果**: ${result.uptimeMonitoringResult.success ? '✅ 合格' : '❌ 不合格'}
- **総合稼働率**: ${result.uptimeMonitoringResult.overallMetrics.totalUptime.toFixed(3)}%
- **重要エンドポイント稼働率**: ${result.uptimeMonitoringResult.overallMetrics.criticalEndpointsUptime.toFixed(3)}%
- **総ダウンタイム**: ${result.uptimeMonitoringResult.overallMetrics.totalDowntimeMinutes.toFixed(1)}分
- **平均回復時間**: ${result.uptimeMonitoringResult.overallMetrics.meanTimeToRecovery.toFixed(0)}秒

`;
  }

  if (result.multiRegionScalabilityResult) {
    content += `### 🌍 マルチリージョンスケーラビリティテスト

- **スコア**: ${result.multiRegionScalabilityResult.overallScalabilityScore.toFixed(1)}/100
- **結果**: ${result.multiRegionScalabilityResult.success ? '✅ 合格' : '❌ 不合格'}
- **リージョナル一貫性**: ${result.multiRegionScalabilityResult.regionalConsistencyScore.toFixed(1)}/100
- **フェイルオーバー信頼性**: ${result.multiRegionScalabilityResult.failoverReliabilityScore.toFixed(1)}/100
- **グローバルパフォーマンス**: ${result.multiRegionScalabilityResult.globalPerformanceScore.toFixed(1)}/100
- **データ一貫性**: ${result.multiRegionScalabilityResult.crossRegionMetrics.dataConsistency.toFixed(1)}%

`;
  }

  return content;
}

/**
 * HTMLレポートの生成
 */
async function generateHTMLReport(result: PerformanceIntegrationTestResult, outputDir: string): Promise<void> {
  const reportPath = path.join(outputDir, 'performance-integration-test-report.html');
  const reportData = createReportData(result);
  
  const html = generateHTMLTemplate(reportData);
  
  await fs.promises.writeFile(reportPath, html, 'utf-8');
  console.log(`✅ HTMLレポートを生成しました: ${reportPath}`);
}

/**
 * HTMLテンプレートの生成
 */
function generateHTMLTemplate(reportData: ReportData): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>パフォーマンス統合テストレポート</title>
    <style>${getHTMLStyles()}</style>
</head>
<body>
    ${generateHTMLHeader(reportData)}
    ${generateHTMLScoreGrid(reportData.result)}
    ${generateHTMLPerformanceSection(reportData.result)}
    ${generateHTMLRecommendations(reportData.result)}
    ${generateHTMLFooter()}
</body>
</html>`;
}

/**
 * HTMLスタイルの定義
 */
function getHTMLStyles(): string {
  return `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .score-card { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .score-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .test-section { margin: 30px 0; padding: 20px; border-left: 4px solid #007bff; background: #f8f9fa; border-radius: 0 8px 8px 0; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .performance-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .performance-table th, .performance-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
        .performance-table th { background-color: #e9ecef; font-weight: 600; }
        .performance-table tr:nth-child(even) { background-color: #f8f9fa; }
        footer { margin-top: 50px; text-align: center; color: #6c757d; font-size: 0.9em; }
  `;
}

/**
 * HTMLヘッダーセクション生成
 */
function generateHTMLHeader(reportData: ReportData): string {
  const statusClass = reportData.success ? 'success' : 'danger';
  const statusText = reportData.success ? '✅ 合格' : '❌ 不合格';
  
  return `
    <div class="header">
        <h1>⚡ パフォーマンス統合テストレポート</h1>
        <p><strong>実行日時:</strong> ${escapeHtml(reportData.executionTime)}</p>
        <p><strong>テスト環境:</strong> ${escapeHtml(reportData.environment)}</p>
        <p><strong>ベースURL:</strong> ${escapeHtml(reportData.baseUrl)}</p>
        <p><strong>総合結果:</strong> <span class="${statusClass}">${statusText}</span></p>
    </div>`;
}

/**
 * HTMLスコアグリッド生成
 */
function generateHTMLScoreGrid(result: PerformanceIntegrationTestResult): string {
  const scores = [
    { name: '総合パフォーマンス', score: result.overallPerformanceScore, threshold: 85 },
    { name: '応答時間', score: result.responseTimeScore, threshold: 80 },
    { name: 'スケーラビリティ', score: result.scalabilityScore, threshold: 80 },
    { name: '信頼性', score: result.reliabilityScore, threshold: 85 }
  ];

  const scoreCards = scores.map(({ name, score, threshold }) => {
    const status = getScoreStatus(score, threshold);
    return `
        <div class="score-card">
            <h3>${escapeHtml(name)}</h3>
            <div class="score-value ${status.class}">${score.toFixed(1)}</div>
            <p>/100</p>
        </div>`;
  }).join('');

  return `<div class="score-grid">${scoreCards}</div>`;
}

/**
 * HTMLパフォーマンスセクション生成
 */
function generateHTMLPerformanceSection(result: PerformanceIntegrationTestResult): string {
  const performanceData = [
    ['総テスト数', result.performanceSummary.totalTests],
    ['合格テスト', result.performanceSummary.passedTests],
    ['不合格テスト', result.performanceSummary.failedTests],
    ['平均応答時間', `${result.performanceSummary.averageResponseTime.toFixed(0)}ms`],
    ['最大スループット', `${result.performanceSummary.peakThroughput.toFixed(1)} req/sec`],
    ['システム稼働率', `${result.performanceSummary.systemUptime.toFixed(3)}%`],
    ['最大サポートユーザー数', `${result.performanceSummary.maxSupportedUsers}人`]
  ];

  const tableRows = performanceData.map(([metric, value]) => 
    `<tr><td>${escapeHtml(String(metric))}</td><td>${escapeHtml(String(value))}</td></tr>`
  ).join('');

  return `
    <div class="test-section">
        <h2>📈 パフォーマンスサマリー</h2>
        <table class="performance-table">
            <thead>
                <tr><th>指標</th><th>値</th></tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </div>`;
}

/**
 * HTML推奨事項セクション生成
 */
function generateHTMLRecommendations(result: PerformanceIntegrationTestResult): string {
  const recommendationItems = result.recommendations
    .map(rec => `<li>${escapeHtml(rec)}</li>`)
    .join('');

  return `
    <div class="recommendations">
        <h2>💡 推奨事項</h2>
        <ol>${recommendationItems}</ol>
    </div>`;
}

/**
 * HTMLフッター生成
 */
function generateHTMLFooter(): string {
  return `
    <footer>
        <p>このレポートは自動生成されました - ${escapeHtml(new Date().toISOString())}</p>
    </footer>`;
}/**

 * エラーレポートの生成
 */
async function generateErrorReport(error: unknown, executionTime: number): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const errorReportPath = path.join(__dirname, '..', 'reports', 'errors', `performance-integration-error-${timestamp}.json`);

  const errorReport = {
    timestamp: new Date().toISOString(),
    testType: 'Performance Integration Test',
    environment: TEST_ENVIRONMENT,
    baseUrl: BASE_URL,
    executionTime,
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    },
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    configuration: {
      maxResponseTime: MAX_RESPONSE_TIME,
      minThroughput: MIN_THROUGHPUT,
      minUptime: MIN_UPTIME,
      maxConcurrentUsers: MAX_CONCURRENT_USERS
    }
  };

  try {
    await fs.promises.mkdir(path.dirname(errorReportPath), { recursive: true });
    await fs.promises.writeFile(errorReportPath, JSON.stringify(errorReport, null, 2), 'utf-8');
    console.log(`📄 エラーレポートを生成しました: ${errorReportPath}`);
  } catch (reportError) {
    console.error('❌ エラーレポートの生成に失敗:', reportError);
  }
}

/**
 * テスト完了処理
 */
async function handleTestCompletion(result: PerformanceIntegrationTestResult, executionTime: number): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('🏁 パフォーマンス統合テスト完了');
  console.log('='.repeat(80));
  
  console.log(`⏱️  総実行時間: ${(executionTime / 1000).toFixed(1)}秒`);
  console.log(`📊 総合パフォーマンススコア: ${result.overallPerformanceScore.toFixed(1)}/100`);
  console.log(`🎯 テスト成功率: ${((result.performanceSummary.passedTests / result.performanceSummary.totalTests) * 100).toFixed(1)}%`);

  // パフォーマンス目標との比較
  console.log('\n🎯 パフォーマンス目標達成状況:');
  
  const responseTimeAchieved = result.performanceSummary.averageResponseTime <= MAX_RESPONSE_TIME;
  console.log(`  応答時間: ${responseTimeAchieved ? '✅' : '❌'} ${result.performanceSummary.averageResponseTime.toFixed(0)}ms (目標: ${MAX_RESPONSE_TIME}ms)`);
  
  const throughputAchieved = result.performanceSummary.peakThroughput >= MIN_THROUGHPUT;
  console.log(`  スループット: ${throughputAchieved ? '✅' : '❌'} ${result.performanceSummary.peakThroughput.toFixed(1)} req/sec (目標: ${MIN_THROUGHPUT} req/sec)`);
  
  const uptimeAchieved = result.performanceSummary.systemUptime >= MIN_UPTIME;
  console.log(`  稼働率: ${uptimeAchieved ? '✅' : '❌'} ${result.performanceSummary.systemUptime.toFixed(3)}% (目標: ${MIN_UPTIME}%)`);
  
  const usersAchieved = result.performanceSummary.maxSupportedUsers >= MAX_CONCURRENT_USERS;
  console.log(`  同時ユーザー数: ${usersAchieved ? '✅' : '❌'} ${result.performanceSummary.maxSupportedUsers}人 (目標: ${MAX_CONCURRENT_USERS}人)`);

  if (result.success) {
    console.log('\n🎉 すべてのパフォーマンステストが正常に完了しました！');
    console.log('   システムは期待されるパフォーマンス要件を満たしています。');
    process.exit(0);
  } else {
    console.log('\n⚠️  一部のテストが失敗しました。詳細はレポートを確認してください。');
    
    if (result.performanceSummary.criticalIssues > 0) {
      console.log(`🔴 重要な問題が ${result.performanceSummary.criticalIssues}件 検出されました。`);
    }
    
    if (result.performanceSummary.performanceBottlenecks.length > 0) {
      console.log('⚠️  パフォーマンスボトルネックが検出されました:');
      result.performanceSummary.performanceBottlenecks.forEach((bottleneck, index) => {
        console.log(`   ${index + 1}. ${bottleneck}`);
      });
    }
    
    console.log('\n💡 主要な推奨事項:');
    result.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を呼び出し
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 予期しないエラーが発生しました:', error);
    process.exit(1);
  });
}

export { main as runPerformanceIntegrationTests };