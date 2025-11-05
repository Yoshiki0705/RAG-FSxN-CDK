#!/usr/bin/env ts-node
"use strict";
/**
 * パフォーマンス統合テスト実行スクリプト
 * 全パフォーマンステストの実行とレポート生成
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPerformanceIntegrationTests = main;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const performance_integration_test_runner_1 = require("../modules/performance/performance-integration-test-runner");
// 環境変数からの設定読み込み
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_ENVIRONMENT = process.env.TEST_ENVIRONMENT || 'development';
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
/**
 * メイン実行関数
 */
async function main() {
    console.log('⚡ パフォーマンス統合テスト実行スクリプトを開始します...');
    console.log(`📅 実行日時: ${new Date().toLocaleString('ja-JP')}`);
    console.log(`🌐 テスト環境: ${TEST_ENVIRONMENT}`);
    console.log(`🔗 ベースURL: ${BASE_URL}`);
    const startTime = Date.now();
    try {
        // 出力ディレクトリの準備
        const outputDir = await prepareOutputDirectory();
        // テスト設定の構築
        const options = {
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
        if (options.enabledTests.responseTime)
            console.log('  ✅ 応答時間測定テスト');
        if (options.enabledTests.concurrentLoad)
            console.log('  ✅ 同時ユーザー負荷テスト');
        if (options.enabledTests.uptimeMonitoring)
            console.log('  ✅ 稼働率監視テスト');
        if (options.enabledTests.multiRegionScalability)
            console.log('  ✅ マルチリージョンスケーラビリティテスト');
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
    }
    catch (error) {
        console.error('❌ パフォーマンス統合テストの実行中にエラーが発生しました:', error);
        // エラーレポートの生成
        await generateErrorReport(error, Date.now() - startTime);
        process.exit(1);
    }
}
/**
 * 出力ディレクトリの準備
 */
async function prepareOutputDirectory() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputDir = path.join(__dirname, '..', 'reports', 'performance-integration', `${TEST_ENVIRONMENT}-${timestamp}`);
    try {
        await fs.promises.mkdir(outputDir, { recursive: true });
        console.log(`📁 出力ディレクトリを作成しました: ${outputDir}`);
        return outputDir;
    }
    catch (error) {
        console.error('❌ 出力ディレクトリの作成に失敗:', error);
        throw error;
    }
}
/**
 * パフォーマンス統合テストの実行
 */
async function executePerformanceTests(options) {
    console.log('\n🚀 パフォーマンス統合テストを実行中...');
    const config = {
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
    const runner = new performance_integration_test_runner_1.PerformanceIntegrationTestRunner(config);
    return await runner.runTests();
}
/**
 * レポートの生成
 */
async function generateReports(result, options) {
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
        }
        catch (error) {
            console.error(`❌ ${format.toUpperCase()}レポートの生成に失敗:`, error);
        }
    }
}
/**
 * JSONレポートの生成
 */
async function generateJSONReport(result, outputDir) {
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
 * 共通レポートデータの生成
 */
function createReportData(result) {
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
function escapeHtml(unsafe) {
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
function getScoreStatus(score, threshold) {
    if (score >= threshold) {
        return { icon: '✅', class: 'success' };
    }
    else if (score >= threshold * 0.8) {
        return { icon: '⚠️', class: 'warning' };
    }
    else {
        return { icon: '❌', class: 'danger' };
    }
}
/**
 * Markdownレポートの生成
 */
async function generateMarkdownReport(result, outputDir) {
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
function generateMarkdownHeader(reportData) {
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
function generateMarkdownScoreOverview(result) {
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
function generateMarkdownPerformanceSummary(result) {
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
function generateMarkdownIssuesSection(result) {
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
function generateMarkdownRecommendations(result) {
    return `## 💡 推奨事項

${result.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}`;
}
/**
 * Markdown目標比較セクション生成
 */
function generateMarkdownTargetComparison(result) {
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
    const tableRows = comparisons.map(({ metric, target, actual, achieved }) => `| ${metric} | ${target} | ${actual} | ${achieved ? '✅ 達成' : '❌ 未達成'} |`).join('\n');
    return `## 🎯 パフォーマンス目標との比較

| 指標 | 目標値 | 実績値 | 達成状況 |
|------|--------|--------|----------|
${tableRows}`;
}
/**
 * Markdownフッター生成
 */
function generateMarkdownFooter() {
    return `---
*このレポートは自動生成されました - ${new Date().toISOString()}*`;
}
/**
 * 個別テスト結果の生成
 */
function generateIndividualTestResults(result) {
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
async function generateHTMLReport(result, outputDir) {
    const reportPath = path.join(outputDir, 'performance-integration-test-report.html');
    const reportData = createReportData(result);
    const html = generateHTMLTemplate(reportData);
    await fs.promises.writeFile(reportPath, html, 'utf-8');
    console.log(`✅ HTMLレポートを生成しました: ${reportPath}`);
}
/**
 * HTMLテンプレートの生成
 */
function generateHTMLTemplate(reportData) {
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
function getHTMLStyles() {
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
function generateHTMLHeader(reportData) {
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
function generateHTMLScoreGrid(result) {
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
function generateHTMLPerformanceSection(result) {
    const performanceData = [
        ['総テスト数', result.performanceSummary.totalTests],
        ['合格テスト', result.performanceSummary.passedTests],
        ['不合格テスト', result.performanceSummary.failedTests],
        ['平均応答時間', `${result.performanceSummary.averageResponseTime.toFixed(0)}ms`],
        ['最大スループット', `${result.performanceSummary.peakThroughput.toFixed(1)} req/sec`],
        ['システム稼働率', `${result.performanceSummary.systemUptime.toFixed(3)}%`],
        ['最大サポートユーザー数', `${result.performanceSummary.maxSupportedUsers}人`]
    ];
    const tableRows = performanceData.map(([metric, value]) => `<tr><td>${escapeHtml(String(metric))}</td><td>${escapeHtml(String(value))}</td></tr>`).join('');
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
function generateHTMLRecommendations(result) {
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
function generateHTMLFooter() {
    return `
    <footer>
        <p>このレポートは自動生成されました - ${escapeHtml(new Date().toISOString())}</p>
    </footer>`;
} /**

 * エラーレポートの生成
 */
async function generateErrorReport(error, executionTime) {
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
    }
    catch (reportError) {
        console.error('❌ エラーレポートの生成に失敗:', reportError);
    }
}
/**
 * テスト完了処理
 */
async function handleTestCompletion(result, executionTime) {
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
    }
    else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXBlcmZvcm1hbmNlLWludGVncmF0aW9uLXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLXBlcmZvcm1hbmNlLWludGVncmF0aW9uLXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNHVCYyw4Q0FBOEI7QUExdUIvQyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLG9IQUFrTDtBQUVsTCxnQkFBZ0I7QUFDaEIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksdUJBQXVCLENBQUM7QUFDakUsTUFBTSxnQkFBZ0IsR0FBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUE2RCxJQUFJLGFBQWEsQ0FBQztBQUNySCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixJQUFJLE1BQU0sQ0FBQyxDQUFDO0FBQzVFLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsQ0FBQztBQUNwRSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLENBQUM7QUFDaEUsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsSUFBSSxLQUFLLENBQUMsQ0FBQztBQUVqRixjQUFjO0FBQ2QsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixLQUFLLE9BQU8sQ0FBQztBQUM1RSxNQUFNLHVCQUF1QixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEtBQUssT0FBTyxDQUFDO0FBQ2hGLE1BQU0seUJBQXlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsS0FBSyxPQUFPLENBQUM7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QUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7QUFDSCxDQUFDO0FBRUQsK0JBQStCO0FBQy9CLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUM1QixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IHRzLW5vZGVcblxuLyoqXG4gKiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnntbHlkIjjg4bjgrnjg4jlrp/ooYzjgrnjgq/jg6rjg5fjg4hcbiAqIOWFqOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOOBruWun+ihjOOBqOODrOODneODvOODiOeUn+aIkFxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJ1bm5lciwgUGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RDb25maWcsIFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0IH0gZnJvbSAnLi4vbW9kdWxlcy9wZXJmb3JtYW5jZS9wZXJmb3JtYW5jZS1pbnRlZ3JhdGlvbi10ZXN0LXJ1bm5lcic7XG5cbi8vIOeSsOWig+WkieaVsOOBi+OCieOBruioreWumuiqreOBv+i+vOOBv1xuY29uc3QgQkFTRV9VUkwgPSBwcm9jZXNzLmVudi5CQVNFX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAwJztcbmNvbnN0IFRFU1RfRU5WSVJPTk1FTlQgPSAocHJvY2Vzcy5lbnYuVEVTVF9FTlZJUk9OTUVOVCBhcyAnZGV2ZWxvcG1lbnQnIHwgJ3N0YWdpbmcnIHwgJ3Byb2R1Y3Rpb24nKSB8fCAnZGV2ZWxvcG1lbnQnO1xuY29uc3QgTUFYX1JFU1BPTlNFX1RJTUUgPSBwYXJzZUludChwcm9jZXNzLmVudi5NQVhfUkVTUE9OU0VfVElNRSB8fCAnMjAwMCcpO1xuY29uc3QgTUlOX1RIUk9VR0hQVVQgPSBwYXJzZUludChwcm9jZXNzLmVudi5NSU5fVEhST1VHSFBVVCB8fCAnNTAnKTtcbmNvbnN0IE1JTl9VUFRJTUUgPSBwYXJzZUZsb2F0KHByb2Nlc3MuZW52Lk1JTl9VUFRJTUUgfHwgJzk5LjknKTtcbmNvbnN0IE1BWF9DT05DVVJSRU5UX1VTRVJTID0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuTUFYX0NPTkNVUlJFTlRfVVNFUlMgfHwgJzEwMCcpO1xuXG4vLyDlgIvliKXjg4bjgrnjg4jmnInlirnljJbjg5Xjg6njgrBcbmNvbnN0IElOQ0xVREVfUkVTUE9OU0VfVElNRSA9IHByb2Nlc3MuZW52LklOQ0xVREVfUkVTUE9OU0VfVElNRSAhPT0gJ2ZhbHNlJztcbmNvbnN0IElOQ0xVREVfQ09OQ1VSUkVOVF9MT0FEID0gcHJvY2Vzcy5lbnYuSU5DTFVERV9DT05DVVJSRU5UX0xPQUQgIT09ICdmYWxzZSc7XG5jb25zdCBJTkNMVURFX1VQVElNRV9NT05JVE9SSU5HID0gcHJvY2Vzcy5lbnYuSU5DTFVERV9VUFRJTUVfTU9OSVRPUklORyAhPT0gJ2ZhbHNlJztcbmNvbnN0IElOQ0xVREVfTVVMVElfUkVHSU9OX1NDQUxBQklMSVRZID0gcHJvY2Vzcy5lbnYuSU5DTFVERV9NVUxUSV9SRUdJT05fU0NBTEFCSUxJVFkgIT09ICdmYWxzZSc7XG5cbi8vIOODhuOCueODiOacn+mWk+ioreWumlxuY29uc3QgUkVTUE9OU0VfVElNRV9EVVJBVElPTiA9IHBhcnNlSW50KHByb2Nlc3MuZW52LlJFU1BPTlNFX1RJTUVfRFVSQVRJT04gfHwgJzMwMCcpO1xuY29uc3QgTE9BRF9URVNUX0RVUkFUSU9OID0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuTE9BRF9URVNUX0RVUkFUSU9OIHx8ICc2MDAnKTtcbmNvbnN0IFVQVElNRV9NT05JVE9SSU5HX0RVUkFUSU9OID0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuVVBUSU1FX01PTklUT1JJTkdfRFVSQVRJT04gfHwgJzE4MDAnKTtcbmNvbnN0IFNDQUxBQklMSVRZX1RFU1RfRFVSQVRJT04gPSBwYXJzZUludChwcm9jZXNzLmVudi5TQ0FMQUJJTElUWV9URVNUX0RVUkFUSU9OIHx8ICc5MDAnKTtcblxuaW50ZXJmYWNlIFRlc3RFeGVjdXRpb25PcHRpb25zIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICB0ZXN0RW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcgfCAnc3RhZ2luZycgfCAncHJvZHVjdGlvbic7XG4gIGVuYWJsZWRUZXN0czoge1xuICAgIHJlc3BvbnNlVGltZTogYm9vbGVhbjtcbiAgICBjb25jdXJyZW50TG9hZDogYm9vbGVhbjtcbiAgICB1cHRpbWVNb25pdG9yaW5nOiBib29sZWFuO1xuICAgIG11bHRpUmVnaW9uU2NhbGFiaWxpdHk6IGJvb2xlYW47XG4gIH07XG4gIHBlcmZvcm1hbmNlVGFyZ2V0czoge1xuICAgIG1heFJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIG1pblRocm91Z2hwdXQ6IG51bWJlcjtcbiAgICBtaW5VcHRpbWU6IG51bWJlcjtcbiAgICBtYXhDb25jdXJyZW50VXNlcnM6IG51bWJlcjtcbiAgfTtcbiAgb3V0cHV0RGlyOiBzdHJpbmc7XG4gIHJlcG9ydEZvcm1hdHM6ICgnanNvbicgfCAnbWFya2Rvd24nIHwgJ2h0bWwnKVtdO1xufVxuXG4vKipcbiAqIOODoeOCpOODs+Wun+ihjOmWouaVsFxuICovXG5hc3luYyBmdW5jdGlvbiBtYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZygn4pqhIOODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiOWun+ihjOOCueOCr+ODquODl+ODiOOCkumWi+Wni+OBl+OBvuOBmS4uLicpO1xuICBjb25zb2xlLmxvZyhg8J+ThSDlrp/ooYzml6XmmYI6ICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygnamEtSlAnKX1gKTtcbiAgY29uc29sZS5sb2coYPCfjJAg44OG44K544OI55Kw5aKDOiAke1RFU1RfRU5WSVJPTk1FTlR9YCk7XG4gIGNvbnNvbGUubG9nKGDwn5SXIOODmeODvOOCuVVSTDogJHtCQVNFX1VSTH1gKTtcblxuICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gIHRyeSB7XG4gICAgLy8g5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu5rqW5YKZXG4gICAgY29uc3Qgb3V0cHV0RGlyID0gYXdhaXQgcHJlcGFyZU91dHB1dERpcmVjdG9yeSgpO1xuXG4gICAgLy8g44OG44K544OI6Kit5a6a44Gu5qeL56+JXG4gICAgY29uc3Qgb3B0aW9uczogVGVzdEV4ZWN1dGlvbk9wdGlvbnMgPSB7XG4gICAgICBiYXNlVXJsOiBCQVNFX1VSTCxcbiAgICAgIHRlc3RFbnZpcm9ubWVudDogVEVTVF9FTlZJUk9OTUVOVCxcbiAgICAgIGVuYWJsZWRUZXN0czoge1xuICAgICAgICByZXNwb25zZVRpbWU6IElOQ0xVREVfUkVTUE9OU0VfVElNRSxcbiAgICAgICAgY29uY3VycmVudExvYWQ6IElOQ0xVREVfQ09OQ1VSUkVOVF9MT0FELFxuICAgICAgICB1cHRpbWVNb25pdG9yaW5nOiBJTkNMVURFX1VQVElNRV9NT05JVE9SSU5HLFxuICAgICAgICBtdWx0aVJlZ2lvblNjYWxhYmlsaXR5OiBJTkNMVURFX01VTFRJX1JFR0lPTl9TQ0FMQUJJTElUWVxuICAgICAgfSxcbiAgICAgIHBlcmZvcm1hbmNlVGFyZ2V0czoge1xuICAgICAgICBtYXhSZXNwb25zZVRpbWU6IE1BWF9SRVNQT05TRV9USU1FLFxuICAgICAgICBtaW5UaHJvdWdocHV0OiBNSU5fVEhST1VHSFBVVCxcbiAgICAgICAgbWluVXB0aW1lOiBNSU5fVVBUSU1FLFxuICAgICAgICBtYXhDb25jdXJyZW50VXNlcnM6IE1BWF9DT05DVVJSRU5UX1VTRVJTXG4gICAgICB9LFxuICAgICAgb3V0cHV0RGlyLFxuICAgICAgcmVwb3J0Rm9ybWF0czogWydqc29uJywgJ21hcmtkb3duJ11cbiAgICB9O1xuXG4gICAgLy8g5pyJ5Yq544Gq44OG44K544OI44Gu56K66KqNXG4gICAgY29uc3QgZW5hYmxlZFRlc3RDb3VudCA9IE9iamVjdC52YWx1ZXMob3B0aW9ucy5lbmFibGVkVGVzdHMpLmZpbHRlcihCb29sZWFuKS5sZW5ndGg7XG4gICAgaWYgKGVuYWJsZWRUZXN0Q291bnQgPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8gIOacieWKueOBquODhuOCueODiOOBjOOBguOCiuOBvuOBm+OCk+OAguWwkeOBquOBj+OBqOOCgjHjgaTjga7jg4bjgrnjg4jjgpLmnInlirnjgavjgZfjgabjgY/jgaDjgZXjgYTjgIInKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgXFxu8J+TiyDlrp/ooYzkuojlrprjg4bjgrnjg4ggKCR7ZW5hYmxlZFRlc3RDb3VudH3lgIspOmApO1xuICAgIGlmIChvcHRpb25zLmVuYWJsZWRUZXN0cy5yZXNwb25zZVRpbWUpIGNvbnNvbGUubG9nKCcgIOKchSDlv5znrZTmmYLplpPmuKzlrprjg4bjgrnjg4gnKTtcbiAgICBpZiAob3B0aW9ucy5lbmFibGVkVGVzdHMuY29uY3VycmVudExvYWQpIGNvbnNvbGUubG9nKCcgIOKchSDlkIzmmYLjg6bjg7zjgrbjg7zosqDojbfjg4bjgrnjg4gnKTtcbiAgICBpZiAob3B0aW9ucy5lbmFibGVkVGVzdHMudXB0aW1lTW9uaXRvcmluZykgY29uc29sZS5sb2coJyAg4pyFIOeovOWDjeeOh+ebo+imluODhuOCueODiCcpO1xuICAgIGlmIChvcHRpb25zLmVuYWJsZWRUZXN0cy5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5KSBjb25zb2xlLmxvZygnICDinIUg44Oe44Or44OB44Oq44O844K444On44Oz44K544Kx44O844Op44OT44Oq44OG44Kj44OG44K544OIJyk7XG5cbiAgICBjb25zb2xlLmxvZygnXFxu8J+OryDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnnm67mqJk6Jyk7XG4gICAgY29uc29sZS5sb2coYCAg5pyA5aSn5b+c562U5pmC6ZaTOiAke29wdGlvbnMucGVyZm9ybWFuY2VUYXJnZXRzLm1heFJlc3BvbnNlVGltZX1tc2ApO1xuICAgIGNvbnNvbGUubG9nKGAgIOacgOWwj+OCueODq+ODvOODl+ODg+ODiDogJHtvcHRpb25zLnBlcmZvcm1hbmNlVGFyZ2V0cy5taW5UaHJvdWdocHV0fSByZXEvc2VjYCk7XG4gICAgY29uc29sZS5sb2coYCAg5pyA5bCP56i85YON546HOiAke29wdGlvbnMucGVyZm9ybWFuY2VUYXJnZXRzLm1pblVwdGltZX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAg5pyA5aSn5ZCM5pmC44Om44O844K244O85pWwOiAke29wdGlvbnMucGVyZm9ybWFuY2VUYXJnZXRzLm1heENvbmN1cnJlbnRVc2Vyc33kurpgKTtcblxuICAgIC8vIOODhuOCueODiOOBruWun+ihjFxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4ZWN1dGVQZXJmb3JtYW5jZVRlc3RzKG9wdGlvbnMpO1xuXG4gICAgLy8g44Os44Od44O844OI44Gu55Sf5oiQXG4gICAgYXdhaXQgZ2VuZXJhdGVSZXBvcnRzKHJlc3VsdCwgb3B0aW9ucyk7XG5cbiAgICAvLyDntZDmnpzjga7oqZXkvqHjgajntYLkuoblh6bnkIZcbiAgICBjb25zdCBleGVjdXRpb25UaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICBhd2FpdCBoYW5kbGVUZXN0Q29tcGxldGlvbihyZXN1bHQsIGV4ZWN1dGlvblRpbWUpO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIOODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiOOBruWun+ihjOS4reOBq+OCqOODqeODvOOBjOeZuueUn+OBl+OBvuOBl+OBnzonLCBlcnJvcik7XG4gICAgXG4gICAgLy8g44Ko44Op44O844Os44Od44O844OI44Gu55Sf5oiQXG4gICAgYXdhaXQgZ2VuZXJhdGVFcnJvclJlcG9ydChlcnJvciwgRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSk7XG4gICAgXG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbi8qKlxuICog5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu5rqW5YKZXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVPdXRwdXREaXJlY3RvcnkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKS5zcGxpdCgnVCcpWzBdO1xuICBjb25zdCBvdXRwdXREaXIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAncmVwb3J0cycsICdwZXJmb3JtYW5jZS1pbnRlZ3JhdGlvbicsIGAke1RFU1RfRU5WSVJPTk1FTlR9LSR7dGltZXN0YW1wfWApO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIob3V0cHV0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zb2xlLmxvZyhg8J+TgSDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjgpLkvZzmiJDjgZfjgb7jgZfjgZ86ICR7b3V0cHV0RGlyfWApO1xuICAgIHJldHVybiBvdXRwdXREaXI7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBruS9nOaIkOOBq+WkseaVlzonLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuLyoqXG4gKiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnntbHlkIjjg4bjgrnjg4jjga7lrp/ooYxcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZVBlcmZvcm1hbmNlVGVzdHMob3B0aW9uczogVGVzdEV4ZWN1dGlvbk9wdGlvbnMpOiBQcm9taXNlPFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0PiB7XG4gIGNvbnNvbGUubG9nKCdcXG7wn5qAIOODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuXG4gIGNvbnN0IGNvbmZpZzogUGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RDb25maWcgPSB7XG4gICAgYmFzZVVybDogb3B0aW9ucy5iYXNlVXJsLFxuICAgIGVuYWJsZWRUZXN0czogb3B0aW9ucy5lbmFibGVkVGVzdHMsXG4gICAgdGVzdEVudmlyb25tZW50OiBvcHRpb25zLnRlc3RFbnZpcm9ubWVudCxcbiAgICBwZXJmb3JtYW5jZVRhcmdldHM6IG9wdGlvbnMucGVyZm9ybWFuY2VUYXJnZXRzLFxuICAgIHRlc3REdXJhdGlvbjoge1xuICAgICAgcmVzcG9uc2VUaW1lOiBSRVNQT05TRV9USU1FX0RVUkFUSU9OLFxuICAgICAgbG9hZFRlc3Q6IExPQURfVEVTVF9EVVJBVElPTixcbiAgICAgIHVwdGltZU1vbml0b3Jpbmc6IFVQVElNRV9NT05JVE9SSU5HX0RVUkFUSU9OLFxuICAgICAgc2NhbGFiaWxpdHlUZXN0OiBTQ0FMQUJJTElUWV9URVNUX0RVUkFUSU9OXG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHJ1bm5lciA9IG5ldyBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJ1bm5lcihjb25maWcpO1xuICByZXR1cm4gYXdhaXQgcnVubmVyLnJ1blRlc3RzKCk7XG59XG5cbi8qKlxuICog44Os44Od44O844OI44Gu55Sf5oiQXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUmVwb3J0cyhyZXN1bHQ6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0LCBvcHRpb25zOiBUZXN0RXhlY3V0aW9uT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZygnXFxu8J+TiiDjg4bjgrnjg4jjg6zjg53jg7zjg4jjgpLnlJ/miJDkuK0uLi4nKTtcblxuICBmb3IgKGNvbnN0IGZvcm1hdCBvZiBvcHRpb25zLnJlcG9ydEZvcm1hdHMpIHtcbiAgICB0cnkge1xuICAgICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgICAgYXdhaXQgZ2VuZXJhdGVKU09OUmVwb3J0KHJlc3VsdCwgb3B0aW9ucy5vdXRwdXREaXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtYXJrZG93bic6XG4gICAgICAgICAgYXdhaXQgZ2VuZXJhdGVNYXJrZG93blJlcG9ydChyZXN1bHQsIG9wdGlvbnMub3V0cHV0RGlyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnaHRtbCc6XG4gICAgICAgICAgYXdhaXQgZ2VuZXJhdGVIVE1MUmVwb3J0KHJlc3VsdCwgb3B0aW9ucy5vdXRwdXREaXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGDinYwgJHtmb3JtYXQudG9VcHBlckNhc2UoKX3jg6zjg53jg7zjg4jjga7nlJ/miJDjgavlpLHmlZc6YCwgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEpTT07jg6zjg53jg7zjg4jjga7nlJ/miJBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVKU09OUmVwb3J0KHJlc3VsdDogUGVyZm9ybWFuY2VJbnRlZ3JhdGlvblRlc3RSZXN1bHQsIG91dHB1dERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHJlcG9ydFBhdGggPSBwYXRoLmpvaW4ob3V0cHV0RGlyLCAncGVyZm9ybWFuY2UtaW50ZWdyYXRpb24tdGVzdC1yZXN1bHQuanNvbicpO1xuICBcbiAgY29uc3QgcmVwb3J0RGF0YSA9IHtcbiAgICBtZXRhZGF0YToge1xuICAgICAgdGVzdFR5cGU6ICdQZXJmb3JtYW5jZSBJbnRlZ3JhdGlvbiBUZXN0JyxcbiAgICAgIGV4ZWN1dGlvbkRhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIGVudmlyb25tZW50OiBURVNUX0VOVklST05NRU5ULFxuICAgICAgYmFzZVVybDogQkFTRV9VUkwsXG4gICAgICB2ZXJzaW9uOiAnMS4wLjAnXG4gICAgfSxcbiAgICBzdW1tYXJ5OiB7XG4gICAgICBzdWNjZXNzOiByZXN1bHQuc3VjY2VzcyxcbiAgICAgIG92ZXJhbGxTY29yZTogcmVzdWx0Lm92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlLFxuICAgICAgZHVyYXRpb246IHJlc3VsdC5kdXJhdGlvbixcbiAgICAgIHBlcmZvcm1hbmNlU3VtbWFyeTogcmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeVxuICAgIH0sXG4gICAgc2NvcmVzOiB7XG4gICAgICByZXNwb25zZVRpbWU6IHJlc3VsdC5yZXNwb25zZVRpbWVTY29yZSxcbiAgICAgIHNjYWxhYmlsaXR5OiByZXN1bHQuc2NhbGFiaWxpdHlTY29yZSxcbiAgICAgIHJlbGlhYmlsaXR5OiByZXN1bHQucmVsaWFiaWxpdHlTY29yZSxcbiAgICAgIGdsb2JhbFBlcmZvcm1hbmNlOiByZXN1bHQuZ2xvYmFsUGVyZm9ybWFuY2VTY29yZVxuICAgIH0sXG4gICAgdGVzdFJlc3VsdHM6IHtcbiAgICAgIHJlc3BvbnNlVGltZTogcmVzdWx0LnJlc3BvbnNlVGltZVJlc3VsdCxcbiAgICAgIGNvbmN1cnJlbnRMb2FkOiByZXN1bHQuY29uY3VycmVudExvYWRSZXN1bHQsXG4gICAgICB1cHRpbWVNb25pdG9yaW5nOiByZXN1bHQudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdCxcbiAgICAgIG11bHRpUmVnaW9uU2NhbGFiaWxpdHk6IHJlc3VsdC5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5UmVzdWx0XG4gICAgfSxcbiAgICByZWNvbW1lbmRhdGlvbnM6IHJlc3VsdC5yZWNvbW1lbmRhdGlvbnNcbiAgfTtcblxuICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUocmVwb3J0UGF0aCwgSlNPTi5zdHJpbmdpZnkocmVwb3J0RGF0YSwgbnVsbCwgMiksICd1dGYtOCcpO1xuICBjb25zb2xlLmxvZyhg4pyFIEpTT07jg6zjg53jg7zjg4jjgpLnlJ/miJDjgZfjgb7jgZfjgZ86ICR7cmVwb3J0UGF0aH1gKTtcbn1cblxuLyoqXG4gKiDjg6zjg53jg7zjg4jjg4fjg7zjgr/jga7lhbHpgJrmp4vpgKBcbiAqL1xuaW50ZXJmYWNlIFJlcG9ydERhdGEge1xuICBleGVjdXRpb25UaW1lOiBzdHJpbmc7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgZHVyYXRpb246IHN0cmluZztcbiAgc3VjY2VzczogYm9vbGVhbjtcbiAgcmVzdWx0OiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdDtcbn1cblxuLyoqXG4gKiDlhbHpgJrjg6zjg53jg7zjg4jjg4fjg7zjgr/jga7nlJ/miJBcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVwb3J0RGF0YShyZXN1bHQ6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogUmVwb3J0RGF0YSB7XG4gIHJldHVybiB7XG4gICAgZXhlY3V0aW9uVGltZTogbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygnamEtSlAnKSxcbiAgICBlbnZpcm9ubWVudDogVEVTVF9FTlZJUk9OTUVOVCxcbiAgICBiYXNlVXJsOiBCQVNFX1VSTCxcbiAgICBkdXJhdGlvbjogKHJlc3VsdC5kdXJhdGlvbiAvIDEwMDApLnRvRml4ZWQoMSksXG4gICAgc3VjY2VzczogcmVzdWx0LnN1Y2Nlc3MsXG4gICAgcmVzdWx0XG4gIH07XG59XG5cbi8qKlxuICog44K744Kt44Ol44Ki44Gq5paH5a2X5YiX44Ko44K544Kx44O844OXXG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUh0bWwodW5zYWZlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdW5zYWZlXG4gICAgLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxuICAgIC5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKVxuICAgIC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKVxuICAgIC5yZXBsYWNlKC8nL2csIFwiJiMwMzk7XCIpO1xufVxuXG4vKipcbiAqIOOCueOCs+OCoueKtuaFi+OBruWIpOWumlxuICovXG5mdW5jdGlvbiBnZXRTY29yZVN0YXR1cyhzY29yZTogbnVtYmVyLCB0aHJlc2hvbGQ6IG51bWJlcik6IHsgaWNvbjogc3RyaW5nOyBjbGFzczogc3RyaW5nIH0ge1xuICBpZiAoc2NvcmUgPj0gdGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIHsgaWNvbjogJ+KchScsIGNsYXNzOiAnc3VjY2VzcycgfTtcbiAgfSBlbHNlIGlmIChzY29yZSA+PSB0aHJlc2hvbGQgKiAwLjgpIHtcbiAgICByZXR1cm4geyBpY29uOiAn4pqg77iPJywgY2xhc3M6ICd3YXJuaW5nJyB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7IGljb246ICfinYwnLCBjbGFzczogJ2RhbmdlcicgfTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcmtkb3du44Os44Od44O844OI44Gu55Sf5oiQXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlTWFya2Rvd25SZXBvcnQocmVzdWx0OiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdCwgb3V0cHV0RGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcmVwb3J0UGF0aCA9IHBhdGguam9pbihvdXRwdXREaXIsICdwZXJmb3JtYW5jZS1pbnRlZ3JhdGlvbi10ZXN0LXJlcG9ydC5tZCcpO1xuICBjb25zdCByZXBvcnREYXRhID0gY3JlYXRlUmVwb3J0RGF0YShyZXN1bHQpO1xuICBcbiAgY29uc3Qgc2VjdGlvbnMgPSBbXG4gICAgZ2VuZXJhdGVNYXJrZG93bkhlYWRlcihyZXBvcnREYXRhKSxcbiAgICBnZW5lcmF0ZU1hcmtkb3duU2NvcmVPdmVydmlldyhyZXN1bHQpLFxuICAgIGdlbmVyYXRlTWFya2Rvd25QZXJmb3JtYW5jZVN1bW1hcnkocmVzdWx0KSxcbiAgICBnZW5lcmF0ZU1hcmtkb3duSXNzdWVzU2VjdGlvbihyZXN1bHQpLFxuICAgIGdlbmVyYXRlSW5kaXZpZHVhbFRlc3RSZXN1bHRzKHJlc3VsdCksXG4gICAgZ2VuZXJhdGVNYXJrZG93blJlY29tbWVuZGF0aW9ucyhyZXN1bHQpLFxuICAgIGdlbmVyYXRlTWFya2Rvd25UYXJnZXRDb21wYXJpc29uKHJlc3VsdCksXG4gICAgZ2VuZXJhdGVNYXJrZG93bkZvb3RlcigpXG4gIF07XG5cbiAgY29uc3QgbWFya2Rvd24gPSBzZWN0aW9ucy5qb2luKCdcXG5cXG4nKTtcbiAgXG4gIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShyZXBvcnRQYXRoLCBtYXJrZG93biwgJ3V0Zi04Jyk7XG4gIGNvbnNvbGUubG9nKGDinIUgTWFya2Rvd27jg6zjg53jg7zjg4jjgpLnlJ/miJDjgZfjgb7jgZfjgZ86ICR7cmVwb3J0UGF0aH1gKTtcbn1cblxuLyoqXG4gKiBNYXJrZG93buODmOODg+ODgOODvOOCu+OCr+OCt+ODp+ODs+eUn+aIkFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZU1hcmtkb3duSGVhZGVyKHJlcG9ydERhdGE6IFJlcG9ydERhdGEpOiBzdHJpbmcge1xuICByZXR1cm4gYCMg44OR44OV44Kp44O844Oe44Oz44K557Wx5ZCI44OG44K544OI44Os44Od44O844OIXG5cbiMjIPCfk4sg44OG44K544OI5qaC6KaBXG5cbi0gKirlrp/ooYzml6XmmYIqKjogJHtyZXBvcnREYXRhLmV4ZWN1dGlvblRpbWV9XG4tICoq44OG44K544OI55Kw5aKDKio6ICR7cmVwb3J0RGF0YS5lbnZpcm9ubWVudH1cbi0gKirjg5njg7zjgrlVUkwqKjogJHtyZXBvcnREYXRhLmJhc2VVcmx9XG4tICoq5a6f6KGM5pmC6ZaTKio6ICR7cmVwb3J0RGF0YS5kdXJhdGlvbn3np5Jcbi0gKirnt4/lkIjntZDmnpwqKjogJHtyZXBvcnREYXRhLnN1Y2Nlc3MgPyAn4pyFIOWQiOagvCcgOiAn4p2MIOS4jeWQiOagvCd9YDtcbn1cblxuLyoqXG4gKiBNYXJrZG93buOCueOCs+OCouamguimgeOCu+OCr+OCt+ODp+ODs+eUn+aIkFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZU1hcmtkb3duU2NvcmVPdmVydmlldyhyZXN1bHQ6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogc3RyaW5nIHtcbiAgY29uc3Qgc2NvcmVzID0gW1xuICAgIHsgbmFtZTogJyoq57eP5ZCI44OR44OV44Kp44O844Oe44Oz44K5KionLCBzY29yZTogcmVzdWx0Lm92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlLCB0aHJlc2hvbGQ6IDg1IH0sXG4gICAgeyBuYW1lOiAn5b+c562U5pmC6ZaTJywgc2NvcmU6IHJlc3VsdC5yZXNwb25zZVRpbWVTY29yZSwgdGhyZXNob2xkOiA4MCB9LFxuICAgIHsgbmFtZTogJ+OCueOCseODvOODqeODk+ODquODhuOCoycsIHNjb3JlOiByZXN1bHQuc2NhbGFiaWxpdHlTY29yZSwgdGhyZXNob2xkOiA4MCB9LFxuICAgIHsgbmFtZTogJ+S/oemgvOaApycsIHNjb3JlOiByZXN1bHQucmVsaWFiaWxpdHlTY29yZSwgdGhyZXNob2xkOiA4NSB9LFxuICAgIHsgbmFtZTogJ+OCsOODreODvOODkOODq+ODkeODleOCqeODvOODnuODs+OCuScsIHNjb3JlOiByZXN1bHQuZ2xvYmFsUGVyZm9ybWFuY2VTY29yZSwgdGhyZXNob2xkOiA4MCB9XG4gIF07XG5cbiAgY29uc3QgdGFibGVSb3dzID0gc2NvcmVzLm1hcCgoeyBuYW1lLCBzY29yZSwgdGhyZXNob2xkIH0pID0+IHtcbiAgICBjb25zdCBzdGF0dXMgPSBnZXRTY29yZVN0YXR1cyhzY29yZSwgdGhyZXNob2xkKTtcbiAgICByZXR1cm4gYHwgJHtuYW1lfSB8ICR7c2NvcmUudG9GaXhlZCgxKX0vMTAwIHwgJHtzdGF0dXMuaWNvbn0gfGA7XG4gIH0pLmpvaW4oJ1xcbicpO1xuXG4gIHJldHVybiBgIyMg8J+TiiDjgrnjgrPjgqLmpoLopoFcblxufCDjgqvjg4bjgrTjg6ogfCDjgrnjgrPjgqIgfCDnirbmhYsgfFxufC0tLS0tLS0tLXwtLS0tLS0tLXwtLS0tLS18XG4ke3RhYmxlUm93c31gO1xufVxuXG4vKipcbiAqIE1hcmtkb3du44OR44OV44Kp44O844Oe44Oz44K544K144Oe44Oq44O844K744Kv44K344On44Oz55Sf5oiQXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlTWFya2Rvd25QZXJmb3JtYW5jZVN1bW1hcnkocmVzdWx0OiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdCk6IHN0cmluZyB7XG4gIHJldHVybiBgIyMg8J+TiCDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgrXjg57jg6rjg7xcblxuLSAqKue3j+ODhuOCueODiOaVsCoqOiAke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkudG90YWxUZXN0c31cbi0gKirlkIjmoLzjg4bjgrnjg4gqKjogJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBhc3NlZFRlc3RzfVxuLSAqKuS4jeWQiOagvOODhuOCueODiCoqOiAke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkuZmFpbGVkVGVzdHN9XG4tICoq5bmz5Z2H5b+c562U5pmC6ZaTKio6ICR7cmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5hdmVyYWdlUmVzcG9uc2VUaW1lLnRvRml4ZWQoMCl9bXNcbi0gKirmnIDlpKfjgrnjg6vjg7zjg5fjg4Pjg4gqKjogJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBlYWtUaHJvdWdocHV0LnRvRml4ZWQoMSl9IHJlcS9zZWNcbi0gKirjgrfjgrnjg4bjg6DnqLzlg43njocqKjogJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnN5c3RlbVVwdGltZS50b0ZpeGVkKDMpfSVcbi0gKirmnIDlpKfjgrXjg53jg7zjg4jjg6bjg7zjgrbjg7zmlbAqKjogJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5Lm1heFN1cHBvcnRlZFVzZXJzfeS6umA7XG59XG5cbi8qKlxuICogTWFya2Rvd27llY/poYzjgrvjgq/jgrfjg6fjg7PnlJ/miJBcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVNYXJrZG93bklzc3Vlc1NlY3Rpb24ocmVzdWx0OiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdCk6IHN0cmluZyB7XG4gIGxldCBjb250ZW50ID0gYCMjIyDllY/poYzjga7lhoXoqLNcblxuLSDwn5S0ICoq6YeN6KaB44Gq5ZWP6aGMKio6ICR7cmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5jcml0aWNhbElzc3Vlc33ku7ZgO1xuXG4gIGlmIChyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBlcmZvcm1hbmNlQm90dGxlbmVja3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnRlbnQgKz0gYFxcblxcbiMjIyDimqDvuI8g44OR44OV44Kp44O844Oe44Oz44K544Oc44OI44Or44ON44OD44KvXFxuXFxuJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBlcmZvcm1hbmNlQm90dGxlbmVja3MubWFwKChib3R0bGVuZWNrLCBpbmRleCkgPT4gYCR7aW5kZXggKyAxfS4gJHtib3R0bGVuZWNrfWApLmpvaW4oJ1xcbicpfWA7XG4gIH1cblxuICBpZiAocmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5zY2FsYWJpbGl0eUxpbWl0YXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICBjb250ZW50ICs9IGBcXG5cXG4jIyMg8J+TiiDjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPliLbpmZBcXG5cXG4ke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkuc2NhbGFiaWxpdHlMaW1pdGF0aW9ucy5tYXAoKGxpbWl0YXRpb24sIGluZGV4KSA9PiBgJHtpbmRleCArIDF9LiAke2xpbWl0YXRpb259YCkuam9pbignXFxuJyl9YDtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIE1hcmtkb3du5o6o5aWo5LqL6aCF44K744Kv44K344On44Oz55Sf5oiQXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlTWFya2Rvd25SZWNvbW1lbmRhdGlvbnMocmVzdWx0OiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdCk6IHN0cmluZyB7XG4gIHJldHVybiBgIyMg8J+SoSDmjqjlpajkuovpoIVcblxuJHtyZXN1bHQucmVjb21tZW5kYXRpb25zLm1hcCgocmVjLCBpbmRleCkgPT4gYCR7aW5kZXggKyAxfS4gJHtyZWN9YCkuam9pbignXFxuJyl9YDtcbn1cblxuLyoqXG4gKiBNYXJrZG93buebruaomeavlOi8g+OCu+OCr+OCt+ODp+ODs+eUn+aIkFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZU1hcmtkb3duVGFyZ2V0Q29tcGFyaXNvbihyZXN1bHQ6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogc3RyaW5nIHtcbiAgY29uc3QgY29tcGFyaXNvbnMgPSBbXG4gICAge1xuICAgICAgbWV0cmljOiAn5pyA5aSn5b+c562U5pmC6ZaTJyxcbiAgICAgIHRhcmdldDogYCR7TUFYX1JFU1BPTlNFX1RJTUV9bXNgLFxuICAgICAgYWN0dWFsOiBgJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LmF2ZXJhZ2VSZXNwb25zZVRpbWUudG9GaXhlZCgwKX1tc2AsXG4gICAgICBhY2hpZXZlZDogcmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5hdmVyYWdlUmVzcG9uc2VUaW1lIDw9IE1BWF9SRVNQT05TRV9USU1FXG4gICAgfSxcbiAgICB7XG4gICAgICBtZXRyaWM6ICfmnIDlsI/jgrnjg6vjg7zjg5fjg4Pjg4gnLFxuICAgICAgdGFyZ2V0OiBgJHtNSU5fVEhST1VHSFBVVH0gcmVxL3NlY2AsXG4gICAgICBhY3R1YWw6IGAke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkucGVha1Rocm91Z2hwdXQudG9GaXhlZCgxKX0gcmVxL3NlY2AsXG4gICAgICBhY2hpZXZlZDogcmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5wZWFrVGhyb3VnaHB1dCA+PSBNSU5fVEhST1VHSFBVVFxuICAgIH0sXG4gICAge1xuICAgICAgbWV0cmljOiAn5pyA5bCP56i85YON546HJyxcbiAgICAgIHRhcmdldDogYCR7TUlOX1VQVElNRX0lYCxcbiAgICAgIGFjdHVhbDogYCR7cmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5zeXN0ZW1VcHRpbWUudG9GaXhlZCgzKX0lYCxcbiAgICAgIGFjaGlldmVkOiByZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnN5c3RlbVVwdGltZSA+PSBNSU5fVVBUSU1FXG4gICAgfSxcbiAgICB7XG4gICAgICBtZXRyaWM6ICfmnIDlpKflkIzmmYLjg6bjg7zjgrbjg7zmlbAnLFxuICAgICAgdGFyZ2V0OiBgJHtNQVhfQ09OQ1VSUkVOVF9VU0VSU33kurpgLFxuICAgICAgYWN0dWFsOiBgJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5Lm1heFN1cHBvcnRlZFVzZXJzfeS6umAsXG4gICAgICBhY2hpZXZlZDogcmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5tYXhTdXBwb3J0ZWRVc2VycyA+PSBNQVhfQ09OQ1VSUkVOVF9VU0VSU1xuICAgIH1cbiAgXTtcblxuICBjb25zdCB0YWJsZVJvd3MgPSBjb21wYXJpc29ucy5tYXAoKHsgbWV0cmljLCB0YXJnZXQsIGFjdHVhbCwgYWNoaWV2ZWQgfSkgPT4gXG4gICAgYHwgJHttZXRyaWN9IHwgJHt0YXJnZXR9IHwgJHthY3R1YWx9IHwgJHthY2hpZXZlZCA/ICfinIUg6YGU5oiQJyA6ICfinYwg5pyq6YGU5oiQJ30gfGBcbiAgKS5qb2luKCdcXG4nKTtcblxuICByZXR1cm4gYCMjIPCfjq8g44OR44OV44Kp44O844Oe44Oz44K555uu5qiZ44Go44Gu5q+U6LyDXG5cbnwg5oyH5qiZIHwg55uu5qiZ5YCkIHwg5a6f57i+5YCkIHwg6YGU5oiQ54q25rOBIHxcbnwtLS0tLS18LS0tLS0tLS18LS0tLS0tLS18LS0tLS0tLS0tLXxcbiR7dGFibGVSb3dzfWA7XG59XG5cbi8qKlxuICogTWFya2Rvd27jg5Xjg4Pjgr/jg7znlJ/miJBcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVNYXJrZG93bkZvb3RlcigpOiBzdHJpbmcge1xuICByZXR1cm4gYC0tLVxuKuOBk+OBruODrOODneODvOODiOOBr+iHquWLleeUn+aIkOOBleOCjOOBvuOBl+OBnyAtICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfSpgO1xufVxuXG4vKipcbiAqIOWAi+WIpeODhuOCueODiOe1kOaenOOBrueUn+aIkFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluZGl2aWR1YWxUZXN0UmVzdWx0cyhyZXN1bHQ6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogc3RyaW5nIHtcbiAgbGV0IGNvbnRlbnQgPSAnJztcblxuICBpZiAocmVzdWx0LnJlc3BvbnNlVGltZVJlc3VsdCkge1xuICAgIGNvbnRlbnQgKz0gYCMjIyDij7HvuI8g5b+c562U5pmC6ZaT5ris5a6a44OG44K544OIXG5cbi0gKirjgrnjgrPjgqIqKjogJHtyZXN1bHQucmVzcG9uc2VUaW1lUmVzdWx0Lm92ZXJhbGxSZXNwb25zZVNjb3JlLnRvRml4ZWQoMSl9LzEwMFxuLSAqKue1kOaenCoqOiAke3Jlc3VsdC5yZXNwb25zZVRpbWVSZXN1bHQuc3VjY2VzcyA/ICfinIUg5ZCI5qC8JyA6ICfinYwg5LiN5ZCI5qC8J31cbi0gKirlubPlnYflv5znrZTmmYLplpMqKjogJHtyZXN1bHQucmVzcG9uc2VUaW1lUmVzdWx0LnBlcmZvcm1hbmNlTWV0cmljcy5vdmVyYWxsQXZlcmFnZVRpbWUudG9GaXhlZCgwKX1tc1xuLSAqKjk144OR44O844K744Oz44K/44Kk44OrKio6ICR7cmVzdWx0LnJlc3BvbnNlVGltZVJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3Mub3ZlcmFsbFBlcmNlbnRpbGU5NS50b0ZpeGVkKDApfW1zXG4tICoq44K544Or44O844OX44OD44OIKio6ICR7cmVzdWx0LnJlc3BvbnNlVGltZVJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3MudGhyb3VnaHB1dC50b0ZpeGVkKDEpfSByZXEvc2VjXG4tICoq5oiQ5Yqf546HKio6ICR7cmVzdWx0LnJlc3BvbnNlVGltZVJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3Muc3VjY2Vzc1JhdGUudG9GaXhlZCgxKX0lXG5cbmA7XG4gIH1cblxuICBpZiAocmVzdWx0LmNvbmN1cnJlbnRMb2FkUmVzdWx0KSB7XG4gICAgY29udGVudCArPSBgIyMjIPCfkaUg5ZCM5pmC44Om44O844K244O86LKg6I2344OG44K544OIXG5cbi0gKirjgrnjgrPjgqIqKjogJHtyZXN1bHQuY29uY3VycmVudExvYWRSZXN1bHQub3ZlcmFsbExvYWRTY29yZS50b0ZpeGVkKDEpfS8xMDBcbi0gKirntZDmnpwqKjogJHtyZXN1bHQuY29uY3VycmVudExvYWRSZXN1bHQuc3VjY2VzcyA/ICfinIUg5ZCI5qC8JyA6ICfinYwg5LiN5ZCI5qC8J31cbi0gKirmnIDlpKflkIzmmYLjg6bjg7zjgrbjg7zmlbAqKjogJHtyZXN1bHQuY29uY3VycmVudExvYWRSZXN1bHQuc3lzdGVtTWV0cmljcy5wZWFrQ29uY3VycmVudFVzZXJzfeS6ulxuLSAqKuacgOWkp+OCueODq+ODvOODl+ODg+ODiCoqOiAke3Jlc3VsdC5jb25jdXJyZW50TG9hZFJlc3VsdC5zeXN0ZW1NZXRyaWNzLnBlYWtUaHJvdWdocHV0LnRvRml4ZWQoMSl9IHJlcS9zZWNcbi0gKirmnIDlpKdDUFXkvb/nlKjnjocqKjogJHtyZXN1bHQuY29uY3VycmVudExvYWRSZXN1bHQuc3lzdGVtTWV0cmljcy5wZWFrQ3B1VXNhZ2UudG9GaXhlZCgxKX0lXG4tICoq5pyA5aSn44Oh44Oi44Oq5L2/55So546HKio6ICR7cmVzdWx0LmNvbmN1cnJlbnRMb2FkUmVzdWx0LnN5c3RlbU1ldHJpY3MucGVha01lbW9yeVVzYWdlLnRvRml4ZWQoMSl9JVxuXG5gO1xuICB9XG5cbiAgaWYgKHJlc3VsdC51cHRpbWVNb25pdG9yaW5nUmVzdWx0KSB7XG4gICAgY29udGVudCArPSBgIyMjIPCfk4og56i85YON546H55uj6KaW44OG44K544OIXG5cbi0gKirjgrnjgrPjgqIqKjogJHtyZXN1bHQudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdC5vdmVyYWxsVXB0aW1lU2NvcmUudG9GaXhlZCgxKX0vMTAwXG4tICoq57WQ5p6cKio6ICR7cmVzdWx0LnVwdGltZU1vbml0b3JpbmdSZXN1bHQuc3VjY2VzcyA/ICfinIUg5ZCI5qC8JyA6ICfinYwg5LiN5ZCI5qC8J31cbi0gKirnt4/lkIjnqLzlg43njocqKjogJHtyZXN1bHQudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdC5vdmVyYWxsTWV0cmljcy50b3RhbFVwdGltZS50b0ZpeGVkKDMpfSVcbi0gKirph43opoHjgqjjg7Pjg4njg53jgqTjg7Pjg4jnqLzlg43njocqKjogJHtyZXN1bHQudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdC5vdmVyYWxsTWV0cmljcy5jcml0aWNhbEVuZHBvaW50c1VwdGltZS50b0ZpeGVkKDMpfSVcbi0gKirnt4/jg4Djgqbjg7Pjgr/jgqTjg6AqKjogJHtyZXN1bHQudXB0aW1lTW9uaXRvcmluZ1Jlc3VsdC5vdmVyYWxsTWV0cmljcy50b3RhbERvd250aW1lTWludXRlcy50b0ZpeGVkKDEpfeWIhlxuLSAqKuW5s+Wdh+WbnuW+qeaZgumWkyoqOiAke3Jlc3VsdC51cHRpbWVNb25pdG9yaW5nUmVzdWx0Lm92ZXJhbGxNZXRyaWNzLm1lYW5UaW1lVG9SZWNvdmVyeS50b0ZpeGVkKDApfeenklxuXG5gO1xuICB9XG5cbiAgaWYgKHJlc3VsdC5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5UmVzdWx0KSB7XG4gICAgY29udGVudCArPSBgIyMjIPCfjI0g44Oe44Or44OB44Oq44O844K444On44Oz44K544Kx44O844Op44OT44Oq44OG44Kj44OG44K544OIXG5cbi0gKirjgrnjgrPjgqIqKjogJHtyZXN1bHQubXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdC5vdmVyYWxsU2NhbGFiaWxpdHlTY29yZS50b0ZpeGVkKDEpfS8xMDBcbi0gKirntZDmnpwqKjogJHtyZXN1bHQubXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdC5zdWNjZXNzID8gJ+KchSDlkIjmoLwnIDogJ+KdjCDkuI3lkIjmoLwnfVxuLSAqKuODquODvOOCuOODp+ODiuODq+S4gOiyq+aApyoqOiAke3Jlc3VsdC5tdWx0aVJlZ2lvblNjYWxhYmlsaXR5UmVzdWx0LnJlZ2lvbmFsQ29uc2lzdGVuY3lTY29yZS50b0ZpeGVkKDEpfS8xMDBcbi0gKirjg5XjgqfjgqTjg6vjgqrjg7zjg5Djg7zkv6HpoLzmgKcqKjogJHtyZXN1bHQubXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdC5mYWlsb3ZlclJlbGlhYmlsaXR5U2NvcmUudG9GaXhlZCgxKX0vMTAwXG4tICoq44Kw44Ot44O844OQ44Or44OR44OV44Kp44O844Oe44Oz44K5Kio6ICR7cmVzdWx0Lm11bHRpUmVnaW9uU2NhbGFiaWxpdHlSZXN1bHQuZ2xvYmFsUGVyZm9ybWFuY2VTY29yZS50b0ZpeGVkKDEpfS8xMDBcbi0gKirjg4fjg7zjgr/kuIDosqvmgKcqKjogJHtyZXN1bHQubXVsdGlSZWdpb25TY2FsYWJpbGl0eVJlc3VsdC5jcm9zc1JlZ2lvbk1ldHJpY3MuZGF0YUNvbnNpc3RlbmN5LnRvRml4ZWQoMSl9JVxuXG5gO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogSFRNTOODrOODneODvOODiOOBrueUn+aIkFxuICovXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUhUTUxSZXBvcnQocmVzdWx0OiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdCwgb3V0cHV0RGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcmVwb3J0UGF0aCA9IHBhdGguam9pbihvdXRwdXREaXIsICdwZXJmb3JtYW5jZS1pbnRlZ3JhdGlvbi10ZXN0LXJlcG9ydC5odG1sJyk7XG4gIGNvbnN0IHJlcG9ydERhdGEgPSBjcmVhdGVSZXBvcnREYXRhKHJlc3VsdCk7XG4gIFxuICBjb25zdCBodG1sID0gZ2VuZXJhdGVIVE1MVGVtcGxhdGUocmVwb3J0RGF0YSk7XG4gIFxuICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUocmVwb3J0UGF0aCwgaHRtbCwgJ3V0Zi04Jyk7XG4gIGNvbnNvbGUubG9nKGDinIUgSFRNTOODrOODneODvOODiOOCkueUn+aIkOOBl+OBvuOBl+OBnzogJHtyZXBvcnRQYXRofWApO1xufVxuXG4vKipcbiAqIEhUTUzjg4bjg7Pjg5fjg6zjg7zjg4jjga7nlJ/miJBcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVIVE1MVGVtcGxhdGUocmVwb3J0RGF0YTogUmVwb3J0RGF0YSk6IHN0cmluZyB7XG4gIHJldHVybiBgPCFET0NUWVBFIGh0bWw+XG48aHRtbCBsYW5nPVwiamFcIj5cbjxoZWFkPlxuICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXCI+XG4gICAgPHRpdGxlPuODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiOODrOODneODvOODiDwvdGl0bGU+XG4gICAgPHN0eWxlPiR7Z2V0SFRNTFN0eWxlcygpfTwvc3R5bGU+XG48L2hlYWQ+XG48Ym9keT5cbiAgICAke2dlbmVyYXRlSFRNTEhlYWRlcihyZXBvcnREYXRhKX1cbiAgICAke2dlbmVyYXRlSFRNTFNjb3JlR3JpZChyZXBvcnREYXRhLnJlc3VsdCl9XG4gICAgJHtnZW5lcmF0ZUhUTUxQZXJmb3JtYW5jZVNlY3Rpb24ocmVwb3J0RGF0YS5yZXN1bHQpfVxuICAgICR7Z2VuZXJhdGVIVE1MUmVjb21tZW5kYXRpb25zKHJlcG9ydERhdGEucmVzdWx0KX1cbiAgICAke2dlbmVyYXRlSFRNTEZvb3RlcigpfVxuPC9ib2R5PlxuPC9odG1sPmA7XG59XG5cbi8qKlxuICogSFRNTOOCueOCv+OCpOODq+OBruWumue+qVxuICovXG5mdW5jdGlvbiBnZXRIVE1MU3R5bGVzKCk6IHN0cmluZyB7XG4gIHJldHVybiBgXG4gICAgICAgIGJvZHkgeyBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2Vnb2UgVUknLCBSb2JvdG8sIHNhbnMtc2VyaWY7IG1hcmdpbjogNDBweDsgbGluZS1oZWlnaHQ6IDEuNjsgfVxuICAgICAgICAuaGVhZGVyIHsgYmFja2dyb3VuZDogI2Y4ZjlmYTsgcGFkZGluZzogMjBweDsgYm9yZGVyLXJhZGl1czogOHB4OyBtYXJnaW4tYm90dG9tOiAzMHB4OyBib3gtc2hhZG93OiAwIDJweCA0cHggcmdiYSgwLDAsMCwwLjEpOyB9XG4gICAgICAgIC5zY29yZS1ncmlkIHsgZGlzcGxheTogZ3JpZDsgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoYXV0by1maXQsIG1pbm1heCgyMDBweCwgMWZyKSk7IGdhcDogMjBweDsgbWFyZ2luOiAyMHB4IDA7IH1cbiAgICAgICAgLnNjb3JlLWNhcmQgeyBiYWNrZ3JvdW5kOiB3aGl0ZTsgYm9yZGVyOiAxcHggc29saWQgI2U5ZWNlZjsgYm9yZGVyLXJhZGl1czogOHB4OyBwYWRkaW5nOiAyMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGJveC1zaGFkb3c6IDAgMnB4IDRweCByZ2JhKDAsMCwwLDAuMDUpOyB9XG4gICAgICAgIC5zY29yZS12YWx1ZSB7IGZvbnQtc2l6ZTogMmVtOyBmb250LXdlaWdodDogYm9sZDsgbWFyZ2luOiAxMHB4IDA7IH1cbiAgICAgICAgLnN1Y2Nlc3MgeyBjb2xvcjogIzI4YTc0NTsgfVxuICAgICAgICAud2FybmluZyB7IGNvbG9yOiAjZmZjMTA3OyB9XG4gICAgICAgIC5kYW5nZXIgeyBjb2xvcjogI2RjMzU0NTsgfVxuICAgICAgICAudGVzdC1zZWN0aW9uIHsgbWFyZ2luOiAzMHB4IDA7IHBhZGRpbmc6IDIwcHg7IGJvcmRlci1sZWZ0OiA0cHggc29saWQgIzAwN2JmZjsgYmFja2dyb3VuZDogI2Y4ZjlmYTsgYm9yZGVyLXJhZGl1czogMCA4cHggOHB4IDA7IH1cbiAgICAgICAgLnJlY29tbWVuZGF0aW9ucyB7IGJhY2tncm91bmQ6ICNmZmYzY2Q7IGJvcmRlcjogMXB4IHNvbGlkICNmZmVhYTc7IGJvcmRlci1yYWRpdXM6IDhweDsgcGFkZGluZzogMjBweDsgbWFyZ2luOiAyMHB4IDA7IH1cbiAgICAgICAgLnBlcmZvcm1hbmNlLXRhYmxlIHsgd2lkdGg6IDEwMCU7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IG1hcmdpbjogMjBweCAwOyB9XG4gICAgICAgIC5wZXJmb3JtYW5jZS10YWJsZSB0aCwgLnBlcmZvcm1hbmNlLXRhYmxlIHRkIHsgYm9yZGVyOiAxcHggc29saWQgI2RlZTJlNjsgcGFkZGluZzogMTJweDsgdGV4dC1hbGlnbjogbGVmdDsgfVxuICAgICAgICAucGVyZm9ybWFuY2UtdGFibGUgdGggeyBiYWNrZ3JvdW5kLWNvbG9yOiAjZTllY2VmOyBmb250LXdlaWdodDogNjAwOyB9XG4gICAgICAgIC5wZXJmb3JtYW5jZS10YWJsZSB0cjpudGgtY2hpbGQoZXZlbikgeyBiYWNrZ3JvdW5kLWNvbG9yOiAjZjhmOWZhOyB9XG4gICAgICAgIGZvb3RlciB7IG1hcmdpbi10b3A6IDUwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgY29sb3I6ICM2Yzc1N2Q7IGZvbnQtc2l6ZTogMC45ZW07IH1cbiAgYDtcbn1cblxuLyoqXG4gKiBIVE1M44OY44OD44OA44O844K744Kv44K344On44Oz55Sf5oiQXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSFRNTEhlYWRlcihyZXBvcnREYXRhOiBSZXBvcnREYXRhKTogc3RyaW5nIHtcbiAgY29uc3Qgc3RhdHVzQ2xhc3MgPSByZXBvcnREYXRhLnN1Y2Nlc3MgPyAnc3VjY2VzcycgOiAnZGFuZ2VyJztcbiAgY29uc3Qgc3RhdHVzVGV4dCA9IHJlcG9ydERhdGEuc3VjY2VzcyA/ICfinIUg5ZCI5qC8JyA6ICfinYwg5LiN5ZCI5qC8JztcbiAgXG4gIHJldHVybiBgXG4gICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICA8aDE+4pqhIOODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiOODrOODneODvOODiDwvaDE+XG4gICAgICAgIDxwPjxzdHJvbmc+5a6f6KGM5pel5pmCOjwvc3Ryb25nPiAke2VzY2FwZUh0bWwocmVwb3J0RGF0YS5leGVjdXRpb25UaW1lKX08L3A+XG4gICAgICAgIDxwPjxzdHJvbmc+44OG44K544OI55Kw5aKDOjwvc3Ryb25nPiAke2VzY2FwZUh0bWwocmVwb3J0RGF0YS5lbnZpcm9ubWVudCl9PC9wPlxuICAgICAgICA8cD48c3Ryb25nPuODmeODvOOCuVVSTDo8L3N0cm9uZz4gJHtlc2NhcGVIdG1sKHJlcG9ydERhdGEuYmFzZVVybCl9PC9wPlxuICAgICAgICA8cD48c3Ryb25nPue3j+WQiOe1kOaenDo8L3N0cm9uZz4gPHNwYW4gY2xhc3M9XCIke3N0YXR1c0NsYXNzfVwiPiR7c3RhdHVzVGV4dH08L3NwYW4+PC9wPlxuICAgIDwvZGl2PmA7XG59XG5cbi8qKlxuICogSFRNTOOCueOCs+OCouOCsOODquODg+ODieeUn+aIkFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUhUTUxTY29yZUdyaWQocmVzdWx0OiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdCk6IHN0cmluZyB7XG4gIGNvbnN0IHNjb3JlcyA9IFtcbiAgICB7IG5hbWU6ICfnt4/lkIjjg5Hjg5Xjgqnjg7zjg57jg7PjgrknLCBzY29yZTogcmVzdWx0Lm92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlLCB0aHJlc2hvbGQ6IDg1IH0sXG4gICAgeyBuYW1lOiAn5b+c562U5pmC6ZaTJywgc2NvcmU6IHJlc3VsdC5yZXNwb25zZVRpbWVTY29yZSwgdGhyZXNob2xkOiA4MCB9LFxuICAgIHsgbmFtZTogJ+OCueOCseODvOODqeODk+ODquODhuOCoycsIHNjb3JlOiByZXN1bHQuc2NhbGFiaWxpdHlTY29yZSwgdGhyZXNob2xkOiA4MCB9LFxuICAgIHsgbmFtZTogJ+S/oemgvOaApycsIHNjb3JlOiByZXN1bHQucmVsaWFiaWxpdHlTY29yZSwgdGhyZXNob2xkOiA4NSB9XG4gIF07XG5cbiAgY29uc3Qgc2NvcmVDYXJkcyA9IHNjb3Jlcy5tYXAoKHsgbmFtZSwgc2NvcmUsIHRocmVzaG9sZCB9KSA9PiB7XG4gICAgY29uc3Qgc3RhdHVzID0gZ2V0U2NvcmVTdGF0dXMoc2NvcmUsIHRocmVzaG9sZCk7XG4gICAgcmV0dXJuIGBcbiAgICAgICAgPGRpdiBjbGFzcz1cInNjb3JlLWNhcmRcIj5cbiAgICAgICAgICAgIDxoMz4ke2VzY2FwZUh0bWwobmFtZSl9PC9oMz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY29yZS12YWx1ZSAke3N0YXR1cy5jbGFzc31cIj4ke3Njb3JlLnRvRml4ZWQoMSl9PC9kaXY+XG4gICAgICAgICAgICA8cD4vMTAwPC9wPlxuICAgICAgICA8L2Rpdj5gO1xuICB9KS5qb2luKCcnKTtcblxuICByZXR1cm4gYDxkaXYgY2xhc3M9XCJzY29yZS1ncmlkXCI+JHtzY29yZUNhcmRzfTwvZGl2PmA7XG59XG5cbi8qKlxuICogSFRNTOODkeODleOCqeODvOODnuODs+OCueOCu+OCr+OCt+ODp+ODs+eUn+aIkFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUhUTUxQZXJmb3JtYW5jZVNlY3Rpb24ocmVzdWx0OiBQZXJmb3JtYW5jZUludGVncmF0aW9uVGVzdFJlc3VsdCk6IHN0cmluZyB7XG4gIGNvbnN0IHBlcmZvcm1hbmNlRGF0YSA9IFtcbiAgICBbJ+e3j+ODhuOCueODiOaVsCcsIHJlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkudG90YWxUZXN0c10sXG4gICAgWyflkIjmoLzjg4bjgrnjg4gnLCByZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBhc3NlZFRlc3RzXSxcbiAgICBbJ+S4jeWQiOagvOODhuOCueODiCcsIHJlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkuZmFpbGVkVGVzdHNdLFxuICAgIFsn5bmz5Z2H5b+c562U5pmC6ZaTJywgYCR7cmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5hdmVyYWdlUmVzcG9uc2VUaW1lLnRvRml4ZWQoMCl9bXNgXSxcbiAgICBbJ+acgOWkp+OCueODq+ODvOODl+ODg+ODiCcsIGAke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkucGVha1Rocm91Z2hwdXQudG9GaXhlZCgxKX0gcmVxL3NlY2BdLFxuICAgIFsn44K344K544OG44Og56i85YON546HJywgYCR7cmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5zeXN0ZW1VcHRpbWUudG9GaXhlZCgzKX0lYF0sXG4gICAgWyfmnIDlpKfjgrXjg53jg7zjg4jjg6bjg7zjgrbjg7zmlbAnLCBgJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5Lm1heFN1cHBvcnRlZFVzZXJzfeS6umBdXG4gIF07XG5cbiAgY29uc3QgdGFibGVSb3dzID0gcGVyZm9ybWFuY2VEYXRhLm1hcCgoW21ldHJpYywgdmFsdWVdKSA9PiBcbiAgICBgPHRyPjx0ZD4ke2VzY2FwZUh0bWwoU3RyaW5nKG1ldHJpYykpfTwvdGQ+PHRkPiR7ZXNjYXBlSHRtbChTdHJpbmcodmFsdWUpKX08L3RkPjwvdHI+YFxuICApLmpvaW4oJycpO1xuXG4gIHJldHVybiBgXG4gICAgPGRpdiBjbGFzcz1cInRlc3Qtc2VjdGlvblwiPlxuICAgICAgICA8aDI+8J+TiCDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgrXjg57jg6rjg7w8L2gyPlxuICAgICAgICA8dGFibGUgY2xhc3M9XCJwZXJmb3JtYW5jZS10YWJsZVwiPlxuICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgIDx0cj48dGg+5oyH5qiZPC90aD48dGg+5YCkPC90aD48L3RyPlxuICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAke3RhYmxlUm93c31cbiAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgIDwvdGFibGU+XG4gICAgPC9kaXY+YDtcbn1cblxuLyoqXG4gKiBIVE1M5o6o5aWo5LqL6aCF44K744Kv44K344On44Oz55Sf5oiQXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSFRNTFJlY29tbWVuZGF0aW9ucyhyZXN1bHQ6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogc3RyaW5nIHtcbiAgY29uc3QgcmVjb21tZW5kYXRpb25JdGVtcyA9IHJlc3VsdC5yZWNvbW1lbmRhdGlvbnNcbiAgICAubWFwKHJlYyA9PiBgPGxpPiR7ZXNjYXBlSHRtbChyZWMpfTwvbGk+YClcbiAgICAuam9pbignJyk7XG5cbiAgcmV0dXJuIGBcbiAgICA8ZGl2IGNsYXNzPVwicmVjb21tZW5kYXRpb25zXCI+XG4gICAgICAgIDxoMj7wn5KhIOaOqOWlqOS6i+mghTwvaDI+XG4gICAgICAgIDxvbD4ke3JlY29tbWVuZGF0aW9uSXRlbXN9PC9vbD5cbiAgICA8L2Rpdj5gO1xufVxuXG4vKipcbiAqIEhUTUzjg5Xjg4Pjgr/jg7znlJ/miJBcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVIVE1MRm9vdGVyKCk6IHN0cmluZyB7XG4gIHJldHVybiBgXG4gICAgPGZvb3Rlcj5cbiAgICAgICAgPHA+44GT44Gu44Os44Od44O844OI44Gv6Ieq5YuV55Sf5oiQ44GV44KM44G+44GX44GfIC0gJHtlc2NhcGVIdG1sKG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSl9PC9wPlxuICAgIDwvZm9vdGVyPmA7XG59LyoqXG5cbiAqIOOCqOODqeODvOODrOODneODvOODiOOBrueUn+aIkFxuICovXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUVycm9yUmVwb3J0KGVycm9yOiB1bmtub3duLCBleGVjdXRpb25UaW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcbiAgY29uc3QgZXJyb3JSZXBvcnRQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ3JlcG9ydHMnLCAnZXJyb3JzJywgYHBlcmZvcm1hbmNlLWludGVncmF0aW9uLWVycm9yLSR7dGltZXN0YW1wfS5qc29uYCk7XG5cbiAgY29uc3QgZXJyb3JSZXBvcnQgPSB7XG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgdGVzdFR5cGU6ICdQZXJmb3JtYW5jZSBJbnRlZ3JhdGlvbiBUZXN0JyxcbiAgICBlbnZpcm9ubWVudDogVEVTVF9FTlZJUk9OTUVOVCxcbiAgICBiYXNlVXJsOiBCQVNFX1VSTCxcbiAgICBleGVjdXRpb25UaW1lLFxuICAgIGVycm9yOiB7XG4gICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgIHN0YWNrOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQsXG4gICAgICB0eXBlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IuY29uc3RydWN0b3IubmFtZSA6IHR5cGVvZiBlcnJvclxuICAgIH0sXG4gICAgc3lzdGVtSW5mbzoge1xuICAgICAgbm9kZVZlcnNpb246IHByb2Nlc3MudmVyc2lvbixcbiAgICAgIHBsYXRmb3JtOiBwcm9jZXNzLnBsYXRmb3JtLFxuICAgICAgYXJjaDogcHJvY2Vzcy5hcmNoXG4gICAgfSxcbiAgICBjb25maWd1cmF0aW9uOiB7XG4gICAgICBtYXhSZXNwb25zZVRpbWU6IE1BWF9SRVNQT05TRV9USU1FLFxuICAgICAgbWluVGhyb3VnaHB1dDogTUlOX1RIUk9VR0hQVVQsXG4gICAgICBtaW5VcHRpbWU6IE1JTl9VUFRJTUUsXG4gICAgICBtYXhDb25jdXJyZW50VXNlcnM6IE1BWF9DT05DVVJSRU5UX1VTRVJTXG4gICAgfVxuICB9O1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIocGF0aC5kaXJuYW1lKGVycm9yUmVwb3J0UGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShlcnJvclJlcG9ydFBhdGgsIEpTT04uc3RyaW5naWZ5KGVycm9yUmVwb3J0LCBudWxsLCAyKSwgJ3V0Zi04Jyk7XG4gICAgY29uc29sZS5sb2coYPCfk4Qg44Ko44Op44O844Os44Od44O844OI44KS55Sf5oiQ44GX44G+44GX44GfOiAke2Vycm9yUmVwb3J0UGF0aH1gKTtcbiAgfSBjYXRjaCAocmVwb3J0RXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg44Ko44Op44O844Os44Od44O844OI44Gu55Sf5oiQ44Gr5aSx5pWXOicsIHJlcG9ydEVycm9yKTtcbiAgfVxufVxuXG4vKipcbiAqIOODhuOCueODiOWujOS6huWHpueQhlxuICovXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVUZXN0Q29tcGxldGlvbihyZXN1bHQ6IFBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0UmVzdWx0LCBleGVjdXRpb25UaW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc29sZS5sb2coJ1xcbicgKyAnPScucmVwZWF0KDgwKSk7XG4gIGNvbnNvbGUubG9nKCfwn4+BIOODkeODleOCqeODvOODnuODs+OCuee1seWQiOODhuOCueODiOWujOS6hicpO1xuICBjb25zb2xlLmxvZygnPScucmVwZWF0KDgwKSk7XG4gIFxuICBjb25zb2xlLmxvZyhg4o+x77iPICDnt4/lrp/ooYzmmYLplpM6ICR7KGV4ZWN1dGlvblRpbWUgLyAxMDAwKS50b0ZpeGVkKDEpfeenkmApO1xuICBjb25zb2xlLmxvZyhg8J+TiiDnt4/lkIjjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgrnjgrPjgqI6ICR7cmVzdWx0Lm92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlLnRvRml4ZWQoMSl9LzEwMGApO1xuICBjb25zb2xlLmxvZyhg8J+OryDjg4bjgrnjg4jmiJDlip/njoc6ICR7KChyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBhc3NlZFRlc3RzIC8gcmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS50b3RhbFRlc3RzKSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG5cbiAgLy8g44OR44OV44Kp44O844Oe44Oz44K555uu5qiZ44Go44Gu5q+U6LyDXG4gIGNvbnNvbGUubG9nKCdcXG7wn46vIOODkeODleOCqeODvOODnuODs+OCueebruaomemBlOaIkOeKtuazgTonKTtcbiAgXG4gIGNvbnN0IHJlc3BvbnNlVGltZUFjaGlldmVkID0gcmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5hdmVyYWdlUmVzcG9uc2VUaW1lIDw9IE1BWF9SRVNQT05TRV9USU1FO1xuICBjb25zb2xlLmxvZyhgICDlv5znrZTmmYLplpM6ICR7cmVzcG9uc2VUaW1lQWNoaWV2ZWQgPyAn4pyFJyA6ICfinYwnfSAke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkuYXZlcmFnZVJlc3BvbnNlVGltZS50b0ZpeGVkKDApfW1zICjnm67mqJk6ICR7TUFYX1JFU1BPTlNFX1RJTUV9bXMpYCk7XG4gIFxuICBjb25zdCB0aHJvdWdocHV0QWNoaWV2ZWQgPSByZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBlYWtUaHJvdWdocHV0ID49IE1JTl9USFJPVUdIUFVUO1xuICBjb25zb2xlLmxvZyhgICDjgrnjg6vjg7zjg5fjg4Pjg4g6ICR7dGhyb3VnaHB1dEFjaGlldmVkID8gJ+KchScgOiAn4p2MJ30gJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBlYWtUaHJvdWdocHV0LnRvRml4ZWQoMSl9IHJlcS9zZWMgKOebruaomTogJHtNSU5fVEhST1VHSFBVVH0gcmVxL3NlYylgKTtcbiAgXG4gIGNvbnN0IHVwdGltZUFjaGlldmVkID0gcmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5zeXN0ZW1VcHRpbWUgPj0gTUlOX1VQVElNRTtcbiAgY29uc29sZS5sb2coYCAg56i85YON546HOiAke3VwdGltZUFjaGlldmVkID8gJ+KchScgOiAn4p2MJ30gJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnN5c3RlbVVwdGltZS50b0ZpeGVkKDMpfSUgKOebruaomTogJHtNSU5fVVBUSU1FfSUpYCk7XG4gIFxuICBjb25zdCB1c2Vyc0FjaGlldmVkID0gcmVzdWx0LnBlcmZvcm1hbmNlU3VtbWFyeS5tYXhTdXBwb3J0ZWRVc2VycyA+PSBNQVhfQ09OQ1VSUkVOVF9VU0VSUztcbiAgY29uc29sZS5sb2coYCAg5ZCM5pmC44Om44O844K244O85pWwOiAke3VzZXJzQWNoaWV2ZWQgPyAn4pyFJyA6ICfinYwnfSAke3Jlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkubWF4U3VwcG9ydGVkVXNlcnN95Lq6ICjnm67mqJk6ICR7TUFYX0NPTkNVUlJFTlRfVVNFUlN95Lq6KWApO1xuXG4gIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgIGNvbnNvbGUubG9nKCdcXG7wn46JIOOBmeOBueOBpuOBruODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOOBjOato+W4uOOBq+WujOS6huOBl+OBvuOBl+OBn++8gScpO1xuICAgIGNvbnNvbGUubG9nKCcgICDjgrfjgrnjg4bjg6Djga/mnJ/lvoXjgZXjgozjgovjg5Hjg5Xjgqnjg7zjg57jg7PjgrnopoHku7bjgpLmuoDjgZ/jgZfjgabjgYTjgb7jgZnjgIInKTtcbiAgICBwcm9jZXNzLmV4aXQoMCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ1xcbuKaoO+4jyAg5LiA6YOo44Gu44OG44K544OI44GM5aSx5pWX44GX44G+44GX44Gf44CC6Kmz57Sw44Gv44Os44Od44O844OI44KS56K66KqN44GX44Gm44GP44Gg44GV44GE44CCJyk7XG4gICAgXG4gICAgaWYgKHJlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkuY3JpdGljYWxJc3N1ZXMgPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+UtCDph43opoHjgarllY/poYzjgYwgJHtyZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LmNyaXRpY2FsSXNzdWVzfeS7tiDmpJzlh7rjgZXjgozjgb7jgZfjgZ/jgIJgKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJlc3VsdC5wZXJmb3JtYW5jZVN1bW1hcnkucGVyZm9ybWFuY2VCb3R0bGVuZWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pqg77iPICDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg5zjg4jjg6vjg43jg4Pjgq/jgYzmpJzlh7rjgZXjgozjgb7jgZfjgZ86Jyk7XG4gICAgICByZXN1bHQucGVyZm9ybWFuY2VTdW1tYXJ5LnBlcmZvcm1hbmNlQm90dGxlbmVja3MuZm9yRWFjaCgoYm90dGxlbmVjaywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICR7aW5kZXggKyAxfS4gJHtib3R0bGVuZWNrfWApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG7wn5KhIOS4u+imgeOBquaOqOWlqOS6i+mghTonKTtcbiAgICByZXN1bHQucmVjb21tZW5kYXRpb25zLnNsaWNlKDAsIDMpLmZvckVhY2goKHJlYywgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAke2luZGV4ICsgMX0uICR7cmVjfWApO1xuICAgIH0pO1xuICAgIFxuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxufVxuXG4vLyDjgrnjgq/jg6rjg5fjg4jjgYznm7TmjqXlrp/ooYzjgZXjgozjgZ/loLTlkIjjga7jgb9tYWlu6Zai5pWw44KS5ZG844Gz5Ye644GXXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbigpLmNhdGNoKGVycm9yID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg5LqI5pyf44GX44Gq44GE44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOicsIGVycm9yKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH0pO1xufVxuXG5leHBvcnQgeyBtYWluIGFzIHJ1blBlcmZvcm1hbmNlSW50ZWdyYXRpb25UZXN0cyB9OyJdfQ==