#!/usr/bin/env ts-node
"use strict";
/**
 * UI統合テスト実行スクリプト
 * 全UIテストの実行とレポート生成
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
exports.runUIIntegrationTests = main;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ui_integration_test_runner_1 = require("../modules/ui/ui-integration-test-runner");
/**
 * 環境変数から設定を安全に読み込み
 */
function loadEnvironmentConfig() {
    // URL検証
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    try {
        new URL(baseUrl);
    }
    catch (error) {
        throw new Error(`無効なベースURL: ${baseUrl}`);
    }
    // 環境検証
    const testEnvironment = process.env.TEST_ENVIRONMENT;
    if (!['development', 'staging', 'production'].includes(testEnvironment || 'development')) {
        throw new Error(`無効なテスト環境: ${testEnvironment}`);
    }
    return {
        baseUrl,
        testEnvironment: testEnvironment || 'development',
        browserSettings: {
            headless: process.env.HEADLESS_MODE === 'true',
            generateScreenshots: process.env.GENERATE_SCREENSHOTS !== 'false',
            generateVideo: process.env.GENERATE_VIDEO === 'true',
            detailedLogs: process.env.DETAILED_LOGS !== 'false'
        },
        enabledTests: {
            responsiveDesign: process.env.INCLUDE_RESPONSIVE_DESIGN !== 'false',
            realtimeChat: process.env.INCLUDE_REALTIME_CHAT !== 'false',
            documentSourceDisplay: process.env.INCLUDE_DOCUMENT_SOURCE_DISPLAY !== 'false',
            accessibility: process.env.INCLUDE_ACCESSIBILITY !== 'false'
        }
    };
}
/**
 * メイン実行関数（保守性向上）
 */
async function main() {
    const startTime = Date.now();
    let config;
    try {
        // 環境設定の読み込みと検証
        config = loadEnvironmentConfig();
        console.log('🎨 UI統合テスト実行スクリプトを開始します...');
        console.log(`📅 実行日時: ${new Date().toLocaleString('ja-JP')}`);
        console.log(`🌐 テスト環境: ${config.testEnvironment}`);
        console.log(`🔗 ベースURL: ${config.baseUrl}`);
        // 事前検証
        await validatePrerequisites(config);
        // 出力ディレクトリの準備
        const outputDir = await prepareOutputDirectory(config.testEnvironment);
        // テスト設定の構築
        const options = {
            baseUrl: config.baseUrl,
            testEnvironment: config.testEnvironment,
            enabledTests: config.enabledTests,
            outputDir,
            reportFormats: ['json', 'markdown']
        };
        // 有効なテストの確認
        validateTestConfiguration(options);
        // テストの実行
        const result = await executeUITests(options);
        // レポートの生成
        await generateReports(result, options);
        // 結果の評価と終了処理
        const executionTime = Date.now() - startTime;
        await handleTestCompletion(result, executionTime);
    }
    catch (error) {
        console.error('❌ UI統合テストの実行中にエラーが発生しました:', error);
        // エラーレポートの生成
        await generateErrorReport(error, Date.now() - startTime);
        process.exit(1);
    }
}
/**
 * 事前検証の実行
 */
async function validatePrerequisites(config) {
    // ベースURLの接続確認（本番環境以外）
    if (config.testEnvironment !== 'production') {
        try {
            const response = await fetch(config.baseUrl, {
                method: 'HEAD',
                timeout: 5000
            });
            if (!response.ok) {
                console.warn(`⚠️  ベースURL ${config.baseUrl} への接続に問題があります (${response.status})`);
            }
        }
        catch (error) {
            console.warn(`⚠️  ベースURL ${config.baseUrl} への接続確認に失敗:`, error);
        }
    }
}
/**
 * テスト設定の検証
 */
function validateTestConfiguration(options) {
    const enabledTestCount = Object.values(options.enabledTests).filter(Boolean).length;
    if (enabledTestCount === 0) {
        throw new Error('有効なテストがありません。少なくとも1つのテストを有効にしてください。');
    }
    console.log(`\n📋 実行予定テスト (${enabledTestCount}個):`);
    if (options.enabledTests.responsiveDesign)
        console.log('  ✅ レスポンシブデザインテスト');
    if (options.enabledTests.realtimeChat)
        console.log('  ✅ リアルタイムチャットテスト');
    if (options.enabledTests.documentSourceDisplay)
        console.log('  ✅ 文書ソース表示テスト');
    if (options.enabledTests.accessibility)
        console.log('  ✅ アクセシビリティテスト');
}
/**
 * 出力ディレクトリの準備（セキュリティ強化）
 */
async function prepareOutputDirectory(testEnvironment) {
    // パストラバーサル攻撃防止
    const sanitizedEnvironment = testEnvironment.replace(/[^a-zA-Z0-9-]/g, '');
    if (sanitizedEnvironment !== testEnvironment) {
        throw new Error(`無効な環境名: ${testEnvironment}`);
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputDir = path.resolve(__dirname, '..', 'reports', 'ui-integration', `${sanitizedEnvironment}-${timestamp}`);
    // ディレクトリトラバーサル防止
    const reportsDir = path.resolve(__dirname, '..', 'reports');
    if (!outputDir.startsWith(reportsDir)) {
        throw new Error('不正なディレクトリパス');
    }
    try {
        await fs.promises.mkdir(outputDir, { recursive: true, mode: 0o755 });
        console.log(`📁 出力ディレクトリを作成しました: ${outputDir}`);
        return outputDir;
    }
    catch (error) {
        console.error('❌ 出力ディレクトリの作成に失敗:', error);
        throw error;
    }
}
/**
 * UI統合テストの実行（型安全性向上）
 */
async function executeUITests(options) {
    console.log('\n🚀 UI統合テストを実行中...');
    // 環境設定の再取得（型安全）
    const envConfig = loadEnvironmentConfig();
    const config = {
        baseUrl: options.baseUrl,
        enabledTests: options.enabledTests,
        testEnvironment: options.testEnvironment,
        browserConfig: {
            headless: envConfig.browserSettings.headless,
            viewport: { width: 1920, height: 1080 },
            timeout: 30000
        },
        reportingConfig: {
            generateScreenshots: envConfig.browserSettings.generateScreenshots,
            generateVideoRecording: envConfig.browserSettings.generateVideo,
            detailedLogs: envConfig.browserSettings.detailedLogs
        }
    };
    // 設定の検証
    validateUITestConfig(config);
    const runner = new ui_integration_test_runner_1.UIIntegrationTestRunner(config);
    return await runner.runTests();
}
/**
 * UIテスト設定の検証
 */
function validateUITestConfig(config) {
    if (!config.baseUrl) {
        throw new Error('ベースURLが設定されていません');
    }
    if (!config.testEnvironment) {
        throw new Error('テスト環境が設定されていません');
    }
    if (!config.browserConfig.viewport.width || !config.browserConfig.viewport.height) {
        throw new Error('ブラウザビューポートが正しく設定されていません');
    }
    if (config.browserConfig.timeout <= 0) {
        throw new Error('タイムアウト値は正の数である必要があります');
    }
}
/**
 * レポートの生成（並列処理でパフォーマンス向上）
 */
async function generateReports(result, options) {
    console.log('\n📊 テストレポートを生成中...');
    const reportGenerators = options.reportFormats.map(async (format) => {
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
            console.log(`✅ ${format.toUpperCase()}レポート生成完了`);
        }
        catch (error) {
            console.error(`❌ ${format.toUpperCase()}レポートの生成に失敗:`, error);
            throw error;
        }
    });
    // 並列実行でパフォーマンス向上
    const results = await Promise.allSettled(reportGenerators);
    // 失敗したレポート生成の確認
    const failedReports = results.filter(result => result.status === 'rejected');
    if (failedReports.length > 0) {
        console.warn(`⚠️  ${failedReports.length}個のレポート生成が失敗しました`);
    }
}
/**
 * JSONレポートの生成
 */
async function generateJSONReport(result, outputDir) {
    const reportPath = path.join(outputDir, 'ui-integration-test-result.json');
    const reportData = {
        metadata: {
            testType: 'UI Integration Test',
            executionDate: new Date().toISOString(),
            environment: TEST_ENVIRONMENT,
            baseUrl: BASE_URL,
            version: '1.0.0'
        },
        summary: {
            success: result.success,
            overallScore: result.overallUIScore,
            duration: result.duration,
            testSummary: result.testSummary
        },
        scores: {
            userExperience: result.userExperienceScore,
            performance: result.performanceScore,
            accessibility: result.accessibilityScore,
            functionality: result.functionalityScore
        },
        testResults: {
            responsiveDesign: result.responsiveDesignResult,
            realtimeChat: result.realtimeChatResult,
            documentSourceDisplay: result.documentSourceDisplayResult,
            accessibility: result.accessibilityResult
        },
        recommendations: result.recommendations
    };
    await fs.promises.writeFile(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    console.log(`✅ JSONレポートを生成しました: ${reportPath}`);
}
/**
 * Markdownレポートの生成
 */
async function generateMarkdownReport(result, outputDir) {
    const reportPath = path.join(outputDir, 'ui-integration-test-report.md');
    const markdown = `# UI統合テストレポート

## 📋 テスト概要

- **実行日時**: ${new Date().toLocaleString('ja-JP')}
- **テスト環境**: ${TEST_ENVIRONMENT}
- **ベースURL**: ${BASE_URL}
- **実行時間**: ${(result.duration / 1000).toFixed(1)}秒
- **総合結果**: ${result.success ? '✅ 合格' : '❌ 不合格'}

## 📊 スコア概要

| カテゴリ | スコア | 状態 |
|---------|--------|------|
| **総合UIスコア** | ${result.overallUIScore.toFixed(1)}/100 | ${result.overallUIScore >= 85 ? '✅' : '❌'} |
| ユーザーエクスペリエンス | ${result.userExperienceScore.toFixed(1)}/100 | ${result.userExperienceScore >= 80 ? '✅' : '⚠️'} |
| パフォーマンス | ${result.performanceScore.toFixed(1)}/100 | ${result.performanceScore >= 80 ? '✅' : '⚠️'} |
| アクセシビリティ | ${result.accessibilityScore.toFixed(1)}/100 | ${result.accessibilityScore >= 85 ? '✅' : '❌'} |
| 機能性 | ${result.functionalityScore.toFixed(1)}/100 | ${result.functionalityScore >= 80 ? '✅' : '⚠️'} |

## 📈 テストサマリー

- **総テスト数**: ${result.testSummary.totalTests}
- **合格テスト**: ${result.testSummary.passedTests}
- **不合格テスト**: ${result.testSummary.failedTests}
- **テストカバレッジ**: ${result.testSummary.testCoverage.toFixed(1)}%

### 問題の内訳

- 🔴 **重要な問題**: ${result.testSummary.criticalIssues}件
- 🟡 **主要な問題**: ${result.testSummary.majorIssues}件
- 🟢 **軽微な問題**: ${result.testSummary.minorIssues}件

## 🔍 個別テスト結果

${generateIndividualTestResults(result)}

## 💡 推奨事項

${result.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## 📝 詳細情報

- **レスポンシブデザイン**: ${result.responsiveDesignResult ? `${result.responsiveDesignResult.success ? '✅ 合格' : '❌ 不合格'} (${result.responsiveDesignResult.overallResponsiveScore.toFixed(1)}/100)` : '⏭️ スキップ'}
- **リアルタイムチャット**: ${result.realtimeChatResult ? `${result.realtimeChatResult.success ? '✅ 合格' : '❌ 不合格'} (${result.realtimeChatResult.overallChatScore.toFixed(1)}/100)` : '⏭️ スキップ'}
- **文書ソース表示**: ${result.documentSourceDisplayResult ? `${result.documentSourceDisplayResult.success ? '✅ 合格' : '❌ 不合格'} (${result.documentSourceDisplayResult.overallSourceScore.toFixed(1)}/100)` : '⏭️ スキップ'}
- **アクセシビリティ**: ${result.accessibilityResult ? `${result.accessibilityResult.success ? '✅ 合格' : '❌ 不合格'} (${result.accessibilityResult.overallAccessibilityScore.toFixed(1)}/100)` : '⏭️ スキップ'}

---
*このレポートは自動生成されました - ${new Date().toISOString()}*
`;
    await fs.promises.writeFile(reportPath, markdown, 'utf-8');
    console.log(`✅ Markdownレポートを生成しました: ${reportPath}`);
}
/**
 * 個別テスト結果の生成
 */
function generateIndividualTestResults(result) {
    let content = '';
    if (result.responsiveDesignResult) {
        content += `### 📱 レスポンシブデザインテスト

- **スコア**: ${result.responsiveDesignResult.overallResponsiveScore.toFixed(1)}/100
- **結果**: ${result.responsiveDesignResult.success ? '✅ 合格' : '❌ 不合格'}
- **テスト対象デバイス**: ${result.responsiveDesignResult.deviceResults.length}台
- **レイアウト一貫性**: ${result.responsiveDesignResult.layoutConsistencyScore.toFixed(1)}/100
- **クロスデバイス互換性**: ${result.responsiveDesignResult.crossDeviceCompatibility.toFixed(1)}/100

`;
    }
    if (result.realtimeChatResult) {
        content += `### 💬 リアルタイムチャットテスト

- **スコア**: ${result.realtimeChatResult.overallChatScore.toFixed(1)}/100
- **結果**: ${result.realtimeChatResult.success ? '✅ 合格' : '❌ 不合格'}
- **信頼性**: ${result.realtimeChatResult.reliabilityScore.toFixed(1)}/100
- **パフォーマンス**: ${result.realtimeChatResult.performanceScore.toFixed(1)}/100
- **ユーザーエクスペリエンス**: ${result.realtimeChatResult.userExperienceScore.toFixed(1)}/100

`;
    }
    if (result.documentSourceDisplayResult) {
        content += `### 📚 文書ソース表示テスト

- **スコア**: ${result.documentSourceDisplayResult.overallSourceScore.toFixed(1)}/100
- **結果**: ${result.documentSourceDisplayResult.success ? '✅ 合格' : '❌ 不合格'}
- **帰属精度**: ${result.documentSourceDisplayResult.attributionAccuracy.toFixed(1)}/100
- **表示品質**: ${result.documentSourceDisplayResult.displayQuality.toFixed(1)}/100
- **コンプライアンス**: ${result.documentSourceDisplayResult.complianceScore.toFixed(1)}/100

`;
    }
    if (result.accessibilityResult) {
        content += `### ♿ アクセシビリティテスト

- **スコア**: ${result.accessibilityResult.overallAccessibilityScore.toFixed(1)}/100
- **結果**: ${result.accessibilityResult.success ? '✅ 合格' : '❌ 不合格'}
- **WCAG準拠レベル**: ${result.accessibilityResult.wcagComplianceLevel}
- **重要な問題**: ${result.accessibilityResult.criticalIssueCount}件
- **自動テストカバレッジ**: ${result.accessibilityResult.automatedTestCoverage.toFixed(1)}%

`;
    }
    return content;
}
/**
 * HTMLレポートの生成
 */
async function generateHTMLReport(result, outputDir) {
    const reportPath = path.join(outputDir, 'ui-integration-test-report.html');
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI統合テストレポート</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .score-card { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; }
        .score-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .test-section { margin: 30px 0; padding: 20px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 UI統合テストレポート</h1>
        <p><strong>実行日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
        <p><strong>テスト環境:</strong> ${TEST_ENVIRONMENT}</p>
        <p><strong>ベースURL:</strong> ${BASE_URL}</p>
        <p><strong>総合結果:</strong> ${result.success ? '<span class="success">✅ 合格</span>' : '<span class="danger">❌ 不合格</span>'}</p>
    </div>

    <div class="score-grid">
        <div class="score-card">
            <h3>総合UIスコア</h3>
            <div class="score-value ${result.overallUIScore >= 85 ? 'success' : 'danger'}">${result.overallUIScore.toFixed(1)}</div>
            <p>/100</p>
        </div>
        <div class="score-card">
            <h3>ユーザーエクスペリエンス</h3>
            <div class="score-value ${result.userExperienceScore >= 80 ? 'success' : 'warning'}">${result.userExperienceScore.toFixed(1)}</div>
            <p>/100</p>
        </div>
        <div class="score-card">
            <h3>パフォーマンス</h3>
            <div class="score-value ${result.performanceScore >= 80 ? 'success' : 'warning'}">${result.performanceScore.toFixed(1)}</div>
            <p>/100</p>
        </div>
        <div class="score-card">
            <h3>アクセシビリティ</h3>
            <div class="score-value ${result.accessibilityScore >= 85 ? 'success' : 'danger'}">${result.accessibilityScore.toFixed(1)}</div>
            <p>/100</p>
        </div>
    </div>

    <div class="test-section">
        <h2>📈 テストサマリー</h2>
        <ul>
            <li><strong>総テスト数:</strong> ${result.testSummary.totalTests}</li>
            <li><strong>合格テスト:</strong> ${result.testSummary.passedTests}</li>
            <li><strong>不合格テスト:</strong> ${result.testSummary.failedTests}</li>
            <li><strong>テストカバレッジ:</strong> ${result.testSummary.testCoverage.toFixed(1)}%</li>
            <li><strong>実行時間:</strong> ${(result.testSummary.executionTime / 1000).toFixed(1)}秒</li>
        </ul>
    </div>

    <div class="recommendations">
        <h2>💡 推奨事項</h2>
        <ol>
            ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ol>
    </div>

    <footer style="margin-top: 50px; text-align: center; color: #6c757d;">
        <p>このレポートは自動生成されました - ${new Date().toISOString()}</p>
    </footer>
</body>
</html>`;
    await fs.promises.writeFile(reportPath, html, 'utf-8');
    console.log(`✅ HTMLレポートを生成しました: ${reportPath}`);
}
/**
 * エラーレポートの生成（強化版）
 */
async function generateErrorReport(error, executionTime) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const errorReportDir = path.resolve(__dirname, '..', 'reports', 'errors');
    const errorReportPath = path.join(errorReportDir, `ui-integration-error-${timestamp}.json`);
    // エラー情報の詳細分析
    const errorAnalysis = analyzeError(error);
    const errorReport = {
        metadata: {
            timestamp: new Date().toISOString(),
            testType: 'UI Integration Test',
            reportVersion: '1.0.0'
        },
        execution: {
            executionTime,
            environment: process.env.TEST_ENVIRONMENT || 'unknown',
            baseUrl: process.env.BASE_URL || 'unknown'
        },
        error: errorAnalysis,
        systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        },
        recommendations: generateErrorRecommendations(errorAnalysis)
    };
    try {
        await fs.promises.mkdir(errorReportDir, { recursive: true, mode: 0o755 });
        await fs.promises.writeFile(errorReportPath, JSON.stringify(errorReport, null, 2), 'utf-8');
        console.log(`📄 エラーレポートを生成しました: ${errorReportPath}`);
    }
    catch (reportError) {
        console.error('❌ エラーレポートの生成に失敗:', reportError);
        // フォールバック: コンソールにエラー情報を出力
        console.error('エラー詳細:', JSON.stringify(errorReport, null, 2));
    }
}
/**
 * エラーの詳細分析
 */
function analyzeError(error) {
    if (error instanceof Error) {
        let category = 'unknown';
        let severity = 'medium';
        // エラーカテゴリの判定
        if (error.message.includes('ENOENT') || error.message.includes('ファイル')) {
            category = 'file-system';
            severity = 'high';
        }
        else if (error.message.includes('ECONNREFUSED') || error.message.includes('接続')) {
            category = 'network';
            severity = 'high';
        }
        else if (error.message.includes('permission') || error.message.includes('権限')) {
            category = 'permission';
            severity = 'critical';
        }
        else if (error.message.includes('timeout') || error.message.includes('タイムアウト')) {
            category = 'timeout';
            severity = 'medium';
        }
        return {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name,
            category,
            severity
        };
    }
    return {
        message: String(error),
        type: typeof error,
        category: 'unknown',
        severity: 'low'
    };
}
/**
 * エラーに基づく推奨事項の生成
 */
function generateErrorRecommendations(errorAnalysis) {
    const recommendations = [];
    switch (errorAnalysis.category) {
        case 'file-system':
            recommendations.push('ファイルパスとディレクトリの存在を確認してください');
            recommendations.push('ファイルの読み書き権限を確認してください');
            break;
        case 'network':
            recommendations.push('ネットワーク接続を確認してください');
            recommendations.push('ベースURLが正しく設定されているか確認してください');
            break;
        case 'permission':
            recommendations.push('実行権限を確認してください');
            recommendations.push('ファイルシステムの権限設定を見直してください');
            break;
        case 'timeout':
            recommendations.push('タイムアウト値を増やすことを検討してください');
            recommendations.push('システムリソースの使用状況を確認してください');
            break;
        default:
            recommendations.push('ログファイルで詳細なエラー情報を確認してください');
            recommendations.push('システム環境と依存関係を確認してください');
    }
    return recommendations;
}
/**
 * テスト完了処理
 */
async function handleTestCompletion(result, executionTime) {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 UI統合テスト完了');
    console.log('='.repeat(80));
    console.log(`⏱️  総実行時間: ${(executionTime / 1000).toFixed(1)}秒`);
    console.log(`📊 総合スコア: ${result.overallUIScore.toFixed(1)}/100`);
    console.log(`🎯 テスト成功率: ${result.testSummary.testCoverage.toFixed(1)}%`);
    if (result.success) {
        console.log('🎉 すべてのUIテストが正常に完了しました！');
        process.exit(0);
    }
    else {
        console.log('⚠️  一部のテストが失敗しました。詳細はレポートを確認してください。');
        if (result.testSummary.criticalIssues > 0) {
            console.log(`🔴 重要な問題が ${result.testSummary.criticalIssues}件 検出されました。`);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXVpLWludGVncmF0aW9uLXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLXVpLWludGVncmF0aW9uLXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeXFCYyxxQ0FBcUI7QUF2cUJ0Qyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLHlGQUFxSTtBQXNCckk7O0dBRUc7QUFDSCxTQUFTLHFCQUFxQjtJQUM1QixRQUFRO0lBQ1IsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksdUJBQXVCLENBQUM7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixNQUFNLElBQUksS0FBSyxDQUFDLGNBQWMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsT0FBTztJQUNQLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQTRELENBQUM7SUFDakcsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxJQUFJLGFBQWEsQ0FBQyxFQUFFLENBQUM7UUFDekYsTUFBTSxJQUFJLEtBQUssQ0FBQyxhQUFhLGVBQWUsRUFBRSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELE9BQU87UUFDTCxPQUFPO1FBQ1AsZUFBZSxFQUFFLGVBQWUsSUFBSSxhQUFhO1FBQ2pELGVBQWUsRUFBRTtZQUNmLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsS0FBSyxNQUFNO1lBQzlDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEtBQUssT0FBTztZQUNqRSxhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FB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SUFDbEIsQ0FBQztBQUNILENBQUM7QUFFRCwrQkFBK0I7QUFDL0IsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzVCLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgdHMtbm9kZVxuXG4vKipcbiAqIFVJ57Wx5ZCI44OG44K544OI5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiDlhahVSeODhuOCueODiOOBruWun+ihjOOBqOODrOODneODvOODiOeUn+aIkFxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBVSUludGVncmF0aW9uVGVzdFJ1bm5lciwgVUlJbnRlZ3JhdGlvblRlc3RDb25maWcsIFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0IH0gZnJvbSAnLi4vbW9kdWxlcy91aS91aS1pbnRlZ3JhdGlvbi10ZXN0LXJ1bm5lcic7XG5cbi8qKlxuICog55Kw5aKD6Kit5a6a44Gu6Kqt44G/6L6844G/44Go5qSc6Ki8XG4gKi9cbmludGVyZmFjZSBFbnZpcm9ubWVudENvbmZpZyB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgdGVzdEVudmlyb25tZW50OiAnZGV2ZWxvcG1lbnQnIHwgJ3N0YWdpbmcnIHwgJ3Byb2R1Y3Rpb24nO1xuICBicm93c2VyU2V0dGluZ3M6IHtcbiAgICBoZWFkbGVzczogYm9vbGVhbjtcbiAgICBnZW5lcmF0ZVNjcmVlbnNob3RzOiBib29sZWFuO1xuICAgIGdlbmVyYXRlVmlkZW86IGJvb2xlYW47XG4gICAgZGV0YWlsZWRMb2dzOiBib29sZWFuO1xuICB9O1xuICBlbmFibGVkVGVzdHM6IHtcbiAgICByZXNwb25zaXZlRGVzaWduOiBib29sZWFuO1xuICAgIHJlYWx0aW1lQ2hhdDogYm9vbGVhbjtcbiAgICBkb2N1bWVudFNvdXJjZURpc3BsYXk6IGJvb2xlYW47XG4gICAgYWNjZXNzaWJpbGl0eTogYm9vbGVhbjtcbiAgfTtcbn1cblxuLyoqXG4gKiDnkrDlooPlpInmlbDjgYvjgonoqK3lrprjgpLlronlhajjgavoqq3jgb/ovrzjgb9cbiAqL1xuZnVuY3Rpb24gbG9hZEVudmlyb25tZW50Q29uZmlnKCk6IEVudmlyb25tZW50Q29uZmlnIHtcbiAgLy8gVVJM5qSc6Ki8XG4gIGNvbnN0IGJhc2VVcmwgPSBwcm9jZXNzLmVudi5CQVNFX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAwJztcbiAgdHJ5IHtcbiAgICBuZXcgVVJMKGJhc2VVcmwpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihg54Sh5Yq544Gq44OZ44O844K5VVJMOiAke2Jhc2VVcmx9YCk7XG4gIH1cblxuICAvLyDnkrDlooPmpJzoqLxcbiAgY29uc3QgdGVzdEVudmlyb25tZW50ID0gcHJvY2Vzcy5lbnYuVEVTVF9FTlZJUk9OTUVOVCBhcyAnZGV2ZWxvcG1lbnQnIHwgJ3N0YWdpbmcnIHwgJ3Byb2R1Y3Rpb24nO1xuICBpZiAoIVsnZGV2ZWxvcG1lbnQnLCAnc3RhZ2luZycsICdwcm9kdWN0aW9uJ10uaW5jbHVkZXModGVzdEVudmlyb25tZW50IHx8ICdkZXZlbG9wbWVudCcpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGDnhKHlirnjgarjg4bjgrnjg4jnkrDlooM6ICR7dGVzdEVudmlyb25tZW50fWApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBiYXNlVXJsLFxuICAgIHRlc3RFbnZpcm9ubWVudDogdGVzdEVudmlyb25tZW50IHx8ICdkZXZlbG9wbWVudCcsXG4gICAgYnJvd3NlclNldHRpbmdzOiB7XG4gICAgICBoZWFkbGVzczogcHJvY2Vzcy5lbnYuSEVBRExFU1NfTU9ERSA9PT0gJ3RydWUnLFxuICAgICAgZ2VuZXJhdGVTY3JlZW5zaG90czogcHJvY2Vzcy5lbnYuR0VORVJBVEVfU0NSRUVOU0hPVFMgIT09ICdmYWxzZScsXG4gICAgICBnZW5lcmF0ZVZpZGVvOiBwcm9jZXNzLmVudi5HRU5FUkFURV9WSURFTyA9PT0gJ3RydWUnLFxuICAgICAgZGV0YWlsZWRMb2dzOiBwcm9jZXNzLmVudi5ERVRBSUxFRF9MT0dTICE9PSAnZmFsc2UnXG4gICAgfSxcbiAgICBlbmFibGVkVGVzdHM6IHtcbiAgICAgIHJlc3BvbnNpdmVEZXNpZ246IHByb2Nlc3MuZW52LklOQ0xVREVfUkVTUE9OU0lWRV9ERVNJR04gIT09ICdmYWxzZScsXG4gICAgICByZWFsdGltZUNoYXQ6IHByb2Nlc3MuZW52LklOQ0xVREVfUkVBTFRJTUVfQ0hBVCAhPT0gJ2ZhbHNlJyxcbiAgICAgIGRvY3VtZW50U291cmNlRGlzcGxheTogcHJvY2Vzcy5lbnYuSU5DTFVERV9ET0NVTUVOVF9TT1VSQ0VfRElTUExBWSAhPT0gJ2ZhbHNlJyxcbiAgICAgIGFjY2Vzc2liaWxpdHk6IHByb2Nlc3MuZW52LklOQ0xVREVfQUNDRVNTSUJJTElUWSAhPT0gJ2ZhbHNlJ1xuICAgIH1cbiAgfTtcbn1cblxuaW50ZXJmYWNlIFRlc3RFeGVjdXRpb25PcHRpb25zIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICB0ZXN0RW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcgfCAnc3RhZ2luZycgfCAncHJvZHVjdGlvbic7XG4gIGVuYWJsZWRUZXN0czoge1xuICAgIHJlc3BvbnNpdmVEZXNpZ246IGJvb2xlYW47XG4gICAgcmVhbHRpbWVDaGF0OiBib29sZWFuO1xuICAgIGRvY3VtZW50U291cmNlRGlzcGxheTogYm9vbGVhbjtcbiAgICBhY2Nlc3NpYmlsaXR5OiBib29sZWFuO1xuICB9O1xuICBvdXRwdXREaXI6IHN0cmluZztcbiAgcmVwb3J0Rm9ybWF0czogKCdqc29uJyB8ICdtYXJrZG93bicgfCAnaHRtbCcpW107XG59XG5cbi8qKlxuICog44Oh44Kk44Oz5a6f6KGM6Zai5pWw77yI5L+d5a6I5oCn5ZCR5LiK77yJXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gIGxldCBjb25maWc6IEVudmlyb25tZW50Q29uZmlnO1xuXG4gIHRyeSB7XG4gICAgLy8g55Kw5aKD6Kit5a6a44Gu6Kqt44G/6L6844G/44Go5qSc6Ki8XG4gICAgY29uZmlnID0gbG9hZEVudmlyb25tZW50Q29uZmlnKCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/CfjqggVUnntbHlkIjjg4bjgrnjg4jlrp/ooYzjgrnjgq/jg6rjg5fjg4jjgpLplovlp4vjgZfjgb7jgZkuLi4nKTtcbiAgICBjb25zb2xlLmxvZyhg8J+ThSDlrp/ooYzml6XmmYI6ICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygnamEtSlAnKX1gKTtcbiAgICBjb25zb2xlLmxvZyhg8J+MkCDjg4bjgrnjg4jnkrDlooM6ICR7Y29uZmlnLnRlc3RFbnZpcm9ubWVudH1gKTtcbiAgICBjb25zb2xlLmxvZyhg8J+UlyDjg5njg7zjgrlVUkw6ICR7Y29uZmlnLmJhc2VVcmx9YCk7XG5cbiAgICAvLyDkuovliY3mpJzoqLxcbiAgICBhd2FpdCB2YWxpZGF0ZVByZXJlcXVpc2l0ZXMoY29uZmlnKTtcblxuICAgIC8vIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBrua6luWCmVxuICAgIGNvbnN0IG91dHB1dERpciA9IGF3YWl0IHByZXBhcmVPdXRwdXREaXJlY3RvcnkoY29uZmlnLnRlc3RFbnZpcm9ubWVudCk7XG5cbiAgICAvLyDjg4bjgrnjg4joqK3lrprjga7mp4vnr4lcbiAgICBjb25zdCBvcHRpb25zOiBUZXN0RXhlY3V0aW9uT3B0aW9ucyA9IHtcbiAgICAgIGJhc2VVcmw6IGNvbmZpZy5iYXNlVXJsLFxuICAgICAgdGVzdEVudmlyb25tZW50OiBjb25maWcudGVzdEVudmlyb25tZW50LFxuICAgICAgZW5hYmxlZFRlc3RzOiBjb25maWcuZW5hYmxlZFRlc3RzLFxuICAgICAgb3V0cHV0RGlyLFxuICAgICAgcmVwb3J0Rm9ybWF0czogWydqc29uJywgJ21hcmtkb3duJ11cbiAgICB9O1xuXG4gICAgLy8g5pyJ5Yq544Gq44OG44K544OI44Gu56K66KqNXG4gICAgdmFsaWRhdGVUZXN0Q29uZmlndXJhdGlvbihvcHRpb25zKTtcblxuICAgIC8vIOODhuOCueODiOOBruWun+ihjFxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4ZWN1dGVVSVRlc3RzKG9wdGlvbnMpO1xuXG4gICAgLy8g44Os44Od44O844OI44Gu55Sf5oiQXG4gICAgYXdhaXQgZ2VuZXJhdGVSZXBvcnRzKHJlc3VsdCwgb3B0aW9ucyk7XG5cbiAgICAvLyDntZDmnpzjga7oqZXkvqHjgajntYLkuoblh6bnkIZcbiAgICBjb25zdCBleGVjdXRpb25UaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICBhd2FpdCBoYW5kbGVUZXN0Q29tcGxldGlvbihyZXN1bHQsIGV4ZWN1dGlvblRpbWUpO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIFVJ57Wx5ZCI44OG44K544OI44Gu5a6f6KGM5Lit44Gr44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOicsIGVycm9yKTtcbiAgICBcbiAgICAvLyDjgqjjg6njg7zjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICBhd2FpdCBnZW5lcmF0ZUVycm9yUmVwb3J0KGVycm9yLCBEYXRlLm5vdygpIC0gc3RhcnRUaW1lKTtcbiAgICBcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH1cbn1cblxuLyoqXG4gKiDkuovliY3mpJzoqLzjga7lrp/ooYxcbiAqL1xuYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGVQcmVyZXF1aXNpdGVzKGNvbmZpZzogRW52aXJvbm1lbnRDb25maWcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgLy8g44OZ44O844K5VVJM44Gu5o6l57aa56K66KqN77yI5pys55Wq55Kw5aKD5Lul5aSW77yJXG4gIGlmIChjb25maWcudGVzdEVudmlyb25tZW50ICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChjb25maWcuYmFzZVVybCwgeyBcbiAgICAgICAgbWV0aG9kOiAnSEVBRCcsXG4gICAgICAgIHRpbWVvdXQ6IDUwMDAgXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIOODmeODvOOCuVVSTCAke2NvbmZpZy5iYXNlVXJsfSDjgbjjga7mjqXntprjgavllY/poYzjgYzjgYLjgorjgb7jgZkgKCR7cmVzcG9uc2Uuc3RhdHVzfSlgKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIOODmeODvOOCuVVSTCAke2NvbmZpZy5iYXNlVXJsfSDjgbjjga7mjqXntprnorroqo3jgavlpLHmlZc6YCwgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIOODhuOCueODiOioreWumuOBruaknOiovFxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVRlc3RDb25maWd1cmF0aW9uKG9wdGlvbnM6IFRlc3RFeGVjdXRpb25PcHRpb25zKTogdm9pZCB7XG4gIGNvbnN0IGVuYWJsZWRUZXN0Q291bnQgPSBPYmplY3QudmFsdWVzKG9wdGlvbnMuZW5hYmxlZFRlc3RzKS5maWx0ZXIoQm9vbGVhbikubGVuZ3RoO1xuICBpZiAoZW5hYmxlZFRlc3RDb3VudCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcign5pyJ5Yq544Gq44OG44K544OI44GM44GC44KK44G+44Gb44KT44CC5bCR44Gq44GP44Go44KCMeOBpOOBruODhuOCueODiOOCkuacieWKueOBq+OBl+OBpuOBj+OBoOOBleOBhOOAgicpO1xuICB9XG5cbiAgY29uc29sZS5sb2coYFxcbvCfk4sg5a6f6KGM5LqI5a6a44OG44K544OIICgke2VuYWJsZWRUZXN0Q291bnR95YCLKTpgKTtcbiAgaWYgKG9wdGlvbnMuZW5hYmxlZFRlc3RzLnJlc3BvbnNpdmVEZXNpZ24pIGNvbnNvbGUubG9nKCcgIOKchSDjg6zjgrnjg53jg7Pjgrfjg5bjg4fjgrbjgqTjg7Pjg4bjgrnjg4gnKTtcbiAgaWYgKG9wdGlvbnMuZW5hYmxlZFRlc3RzLnJlYWx0aW1lQ2hhdCkgY29uc29sZS5sb2coJyAg4pyFIOODquOCouODq+OCv+OCpOODoOODgeODo+ODg+ODiOODhuOCueODiCcpO1xuICBpZiAob3B0aW9ucy5lbmFibGVkVGVzdHMuZG9jdW1lbnRTb3VyY2VEaXNwbGF5KSBjb25zb2xlLmxvZygnICDinIUg5paH5pu444K944O844K56KGo56S644OG44K544OIJyk7XG4gIGlmIChvcHRpb25zLmVuYWJsZWRUZXN0cy5hY2Nlc3NpYmlsaXR5KSBjb25zb2xlLmxvZygnICDinIUg44Ki44Kv44K744K344OT44Oq44OG44Kj44OG44K544OIJyk7XG59XG5cbi8qKlxuICog5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu5rqW5YKZ77yI44K744Kt44Ol44Oq44OG44Kj5by35YyW77yJXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVPdXRwdXREaXJlY3RvcnkodGVzdEVudmlyb25tZW50OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyDjg5Hjgrnjg4jjg6njg5Djg7zjgrXjg6vmlLvmkoPpmLLmraJcbiAgY29uc3Qgc2FuaXRpemVkRW52aXJvbm1lbnQgPSB0ZXN0RW52aXJvbm1lbnQucmVwbGFjZSgvW15hLXpBLVowLTktXS9nLCAnJyk7XG4gIGlmIChzYW5pdGl6ZWRFbnZpcm9ubWVudCAhPT0gdGVzdEVudmlyb25tZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGDnhKHlirnjgarnkrDlooPlkI06ICR7dGVzdEVudmlyb25tZW50fWApO1xuICB9XG5cbiAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKS5zcGxpdCgnVCcpWzBdO1xuICBjb25zdCBvdXRwdXREaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAncmVwb3J0cycsICd1aS1pbnRlZ3JhdGlvbicsIGAke3Nhbml0aXplZEVudmlyb25tZW50fS0ke3RpbWVzdGFtcH1gKTtcbiAgXG4gIC8vIOODh+OCo+ODrOOCr+ODiOODquODiOODqeODkOODvOOCteODq+mYsuatolxuICBjb25zdCByZXBvcnRzRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJ3JlcG9ydHMnKTtcbiAgaWYgKCFvdXRwdXREaXIuc3RhcnRzV2l0aChyZXBvcnRzRGlyKSkge1xuICAgIHRocm93IG5ldyBFcnJvcign5LiN5q2j44Gq44OH44Kj44Os44Kv44OI44Oq44OR44K5Jyk7XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IGZzLnByb21pc2VzLm1rZGlyKG91dHB1dERpciwgeyByZWN1cnNpdmU6IHRydWUsIG1vZGU6IDBvNzU1IH0pO1xuICAgIGNvbnNvbGUubG9nKGDwn5OBIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOCkuS9nOaIkOOBl+OBvuOBl+OBnzogJHtvdXRwdXREaXJ9YCk7XG4gICAgcmV0dXJuIG91dHB1dERpcjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu5L2c5oiQ44Gr5aSx5pWXOicsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG4vKipcbiAqIFVJ57Wx5ZCI44OG44K544OI44Gu5a6f6KGM77yI5Z6L5a6J5YWo5oCn5ZCR5LiK77yJXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVVSVRlc3RzKG9wdGlvbnM6IFRlc3RFeGVjdXRpb25PcHRpb25zKTogUHJvbWlzZTxVSUludGVncmF0aW9uVGVzdFJlc3VsdD4ge1xuICBjb25zb2xlLmxvZygnXFxu8J+agCBVSee1seWQiOODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuXG4gIC8vIOeSsOWig+ioreWumuOBruWGjeWPluW+l++8iOWei+WuieWFqO+8iVxuICBjb25zdCBlbnZDb25maWcgPSBsb2FkRW52aXJvbm1lbnRDb25maWcoKTtcblxuICBjb25zdCBjb25maWc6IFVJSW50ZWdyYXRpb25UZXN0Q29uZmlnID0ge1xuICAgIGJhc2VVcmw6IG9wdGlvbnMuYmFzZVVybCxcbiAgICBlbmFibGVkVGVzdHM6IG9wdGlvbnMuZW5hYmxlZFRlc3RzLFxuICAgIHRlc3RFbnZpcm9ubWVudDogb3B0aW9ucy50ZXN0RW52aXJvbm1lbnQsXG4gICAgYnJvd3NlckNvbmZpZzoge1xuICAgICAgaGVhZGxlc3M6IGVudkNvbmZpZy5icm93c2VyU2V0dGluZ3MuaGVhZGxlc3MsXG4gICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTkyMCwgaGVpZ2h0OiAxMDgwIH0sXG4gICAgICB0aW1lb3V0OiAzMDAwMFxuICAgIH0sXG4gICAgcmVwb3J0aW5nQ29uZmlnOiB7XG4gICAgICBnZW5lcmF0ZVNjcmVlbnNob3RzOiBlbnZDb25maWcuYnJvd3NlclNldHRpbmdzLmdlbmVyYXRlU2NyZWVuc2hvdHMsXG4gICAgICBnZW5lcmF0ZVZpZGVvUmVjb3JkaW5nOiBlbnZDb25maWcuYnJvd3NlclNldHRpbmdzLmdlbmVyYXRlVmlkZW8sXG4gICAgICBkZXRhaWxlZExvZ3M6IGVudkNvbmZpZy5icm93c2VyU2V0dGluZ3MuZGV0YWlsZWRMb2dzXG4gICAgfVxuICB9O1xuXG4gIC8vIOioreWumuOBruaknOiovFxuICB2YWxpZGF0ZVVJVGVzdENvbmZpZyhjb25maWcpO1xuXG4gIGNvbnN0IHJ1bm5lciA9IG5ldyBVSUludGVncmF0aW9uVGVzdFJ1bm5lcihjb25maWcpO1xuICByZXR1cm4gYXdhaXQgcnVubmVyLnJ1blRlc3RzKCk7XG59XG5cbi8qKlxuICogVUnjg4bjgrnjg4joqK3lrprjga7mpJzoqLxcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVVSVRlc3RDb25maWcoY29uZmlnOiBVSUludGVncmF0aW9uVGVzdENvbmZpZyk6IHZvaWQge1xuICBpZiAoIWNvbmZpZy5iYXNlVXJsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCfjg5njg7zjgrlVUkzjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIGlmICghY29uZmlnLnRlc3RFbnZpcm9ubWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcign44OG44K544OI55Kw5aKD44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gIH1cblxuICBpZiAoIWNvbmZpZy5icm93c2VyQ29uZmlnLnZpZXdwb3J0LndpZHRoIHx8ICFjb25maWcuYnJvd3NlckNvbmZpZy52aWV3cG9ydC5oZWlnaHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODluODqeOCpuOCtuODk+ODpeODvOODneODvOODiOOBjOato+OBl+OBj+ioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICB9XG5cbiAgaWYgKGNvbmZpZy5icm93c2VyQ29uZmlnLnRpbWVvdXQgPD0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcign44K/44Kk44Og44Ki44Km44OI5YCk44Gv5q2j44Gu5pWw44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gIH1cbn1cblxuLyoqXG4gKiDjg6zjg53jg7zjg4jjga7nlJ/miJDvvIjkuKbliJflh6bnkIbjgafjg5Hjg5Xjgqnjg7zjg57jg7PjgrnlkJHkuIrvvIlcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVSZXBvcnRzKHJlc3VsdDogVUlJbnRlZ3JhdGlvblRlc3RSZXN1bHQsIG9wdGlvbnM6IFRlc3RFeGVjdXRpb25PcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCdcXG7wn5OKIOODhuOCueODiOODrOODneODvOODiOOCkueUn+aIkOS4rS4uLicpO1xuXG4gIGNvbnN0IHJlcG9ydEdlbmVyYXRvcnMgPSBvcHRpb25zLnJlcG9ydEZvcm1hdHMubWFwKGFzeW5jIChmb3JtYXQpID0+IHtcbiAgICB0cnkge1xuICAgICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgICAgYXdhaXQgZ2VuZXJhdGVKU09OUmVwb3J0KHJlc3VsdCwgb3B0aW9ucy5vdXRwdXREaXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtYXJrZG93bic6XG4gICAgICAgICAgYXdhaXQgZ2VuZXJhdGVNYXJrZG93blJlcG9ydChyZXN1bHQsIG9wdGlvbnMub3V0cHV0RGlyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnaHRtbCc6XG4gICAgICAgICAgYXdhaXQgZ2VuZXJhdGVIVE1MUmVwb3J0KHJlc3VsdCwgb3B0aW9ucy5vdXRwdXREaXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYOKchSAke2Zvcm1hdC50b1VwcGVyQ2FzZSgpfeODrOODneODvOODiOeUn+aIkOWujOS6hmApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGDinYwgJHtmb3JtYXQudG9VcHBlckNhc2UoKX3jg6zjg53jg7zjg4jjga7nlJ/miJDjgavlpLHmlZc6YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9KTtcblxuICAvLyDkuKbliJflrp/ooYzjgafjg5Hjg5Xjgqnjg7zjg57jg7PjgrnlkJHkuIpcbiAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChyZXBvcnRHZW5lcmF0b3JzKTtcbiAgXG4gIC8vIOWkseaVl+OBl+OBn+ODrOODneODvOODiOeUn+aIkOOBrueiuuiqjVxuICBjb25zdCBmYWlsZWRSZXBvcnRzID0gcmVzdWx0cy5maWx0ZXIocmVzdWx0ID0+IHJlc3VsdC5zdGF0dXMgPT09ICdyZWplY3RlZCcpO1xuICBpZiAoZmFpbGVkUmVwb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgY29uc29sZS53YXJuKGDimqDvuI8gICR7ZmFpbGVkUmVwb3J0cy5sZW5ndGh95YCL44Gu44Os44Od44O844OI55Sf5oiQ44GM5aSx5pWX44GX44G+44GX44GfYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBKU09O44Os44Od44O844OI44Gu55Sf5oiQXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlSlNPTlJlcG9ydChyZXN1bHQ6IFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0LCBvdXRwdXREaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5qb2luKG91dHB1dERpciwgJ3VpLWludGVncmF0aW9uLXRlc3QtcmVzdWx0Lmpzb24nKTtcbiAgXG4gIGNvbnN0IHJlcG9ydERhdGEgPSB7XG4gICAgbWV0YWRhdGE6IHtcbiAgICAgIHRlc3RUeXBlOiAnVUkgSW50ZWdyYXRpb24gVGVzdCcsXG4gICAgICBleGVjdXRpb25EYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBlbnZpcm9ubWVudDogVEVTVF9FTlZJUk9OTUVOVCxcbiAgICAgIGJhc2VVcmw6IEJBU0VfVVJMLFxuICAgICAgdmVyc2lvbjogJzEuMC4wJ1xuICAgIH0sXG4gICAgc3VtbWFyeToge1xuICAgICAgc3VjY2VzczogcmVzdWx0LnN1Y2Nlc3MsXG4gICAgICBvdmVyYWxsU2NvcmU6IHJlc3VsdC5vdmVyYWxsVUlTY29yZSxcbiAgICAgIGR1cmF0aW9uOiByZXN1bHQuZHVyYXRpb24sXG4gICAgICB0ZXN0U3VtbWFyeTogcmVzdWx0LnRlc3RTdW1tYXJ5XG4gICAgfSxcbiAgICBzY29yZXM6IHtcbiAgICAgIHVzZXJFeHBlcmllbmNlOiByZXN1bHQudXNlckV4cGVyaWVuY2VTY29yZSxcbiAgICAgIHBlcmZvcm1hbmNlOiByZXN1bHQucGVyZm9ybWFuY2VTY29yZSxcbiAgICAgIGFjY2Vzc2liaWxpdHk6IHJlc3VsdC5hY2Nlc3NpYmlsaXR5U2NvcmUsXG4gICAgICBmdW5jdGlvbmFsaXR5OiByZXN1bHQuZnVuY3Rpb25hbGl0eVNjb3JlXG4gICAgfSxcbiAgICB0ZXN0UmVzdWx0czoge1xuICAgICAgcmVzcG9uc2l2ZURlc2lnbjogcmVzdWx0LnJlc3BvbnNpdmVEZXNpZ25SZXN1bHQsXG4gICAgICByZWFsdGltZUNoYXQ6IHJlc3VsdC5yZWFsdGltZUNoYXRSZXN1bHQsXG4gICAgICBkb2N1bWVudFNvdXJjZURpc3BsYXk6IHJlc3VsdC5kb2N1bWVudFNvdXJjZURpc3BsYXlSZXN1bHQsXG4gICAgICBhY2Nlc3NpYmlsaXR5OiByZXN1bHQuYWNjZXNzaWJpbGl0eVJlc3VsdFxuICAgIH0sXG4gICAgcmVjb21tZW5kYXRpb25zOiByZXN1bHQucmVjb21tZW5kYXRpb25zXG4gIH07XG5cbiAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKHJlcG9ydFBhdGgsIEpTT04uc3RyaW5naWZ5KHJlcG9ydERhdGEsIG51bGwsIDIpLCAndXRmLTgnKTtcbiAgY29uc29sZS5sb2coYOKchSBKU09O44Os44Od44O844OI44KS55Sf5oiQ44GX44G+44GX44GfOiAke3JlcG9ydFBhdGh9YCk7XG59XG5cbi8qKlxuICogTWFya2Rvd27jg6zjg53jg7zjg4jjga7nlJ/miJBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVNYXJrZG93blJlcG9ydChyZXN1bHQ6IFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0LCBvdXRwdXREaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5qb2luKG91dHB1dERpciwgJ3VpLWludGVncmF0aW9uLXRlc3QtcmVwb3J0Lm1kJyk7XG4gIFxuICBjb25zdCBtYXJrZG93biA9IGAjIFVJ57Wx5ZCI44OG44K544OI44Os44Od44O844OIXG5cbiMjIPCfk4sg44OG44K544OI5qaC6KaBXG5cbi0gKirlrp/ooYzml6XmmYIqKjogJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCdqYS1KUCcpfVxuLSAqKuODhuOCueODiOeSsOWigyoqOiAke1RFU1RfRU5WSVJPTk1FTlR9XG4tICoq44OZ44O844K5VVJMKio6ICR7QkFTRV9VUkx9XG4tICoq5a6f6KGM5pmC6ZaTKio6ICR7KHJlc3VsdC5kdXJhdGlvbiAvIDEwMDApLnRvRml4ZWQoMSl956eSXG4tICoq57eP5ZCI57WQ5p6cKio6ICR7cmVzdWx0LnN1Y2Nlc3MgPyAn4pyFIOWQiOagvCcgOiAn4p2MIOS4jeWQiOagvCd9XG5cbiMjIPCfk4og44K544Kz44Ki5qaC6KaBXG5cbnwg44Kr44OG44K044OqIHwg44K544Kz44KiIHwg54q25oWLIHxcbnwtLS0tLS0tLS18LS0tLS0tLS18LS0tLS0tfFxufCAqKue3j+WQiFVJ44K544Kz44KiKiogfCAke3Jlc3VsdC5vdmVyYWxsVUlTY29yZS50b0ZpeGVkKDEpfS8xMDAgfCAke3Jlc3VsdC5vdmVyYWxsVUlTY29yZSA+PSA4NSA/ICfinIUnIDogJ+KdjCd9IHxcbnwg44Om44O844K244O844Ko44Kv44K544Oa44Oq44Ko44Oz44K5IHwgJHtyZXN1bHQudXNlckV4cGVyaWVuY2VTY29yZS50b0ZpeGVkKDEpfS8xMDAgfCAke3Jlc3VsdC51c2VyRXhwZXJpZW5jZVNjb3JlID49IDgwID8gJ+KchScgOiAn4pqg77iPJ30gfFxufCDjg5Hjg5Xjgqnjg7zjg57jg7PjgrkgfCAke3Jlc3VsdC5wZXJmb3JtYW5jZVNjb3JlLnRvRml4ZWQoMSl9LzEwMCB8ICR7cmVzdWx0LnBlcmZvcm1hbmNlU2NvcmUgPj0gODAgPyAn4pyFJyA6ICfimqDvuI8nfSB8XG58IOOCouOCr+OCu+OCt+ODk+ODquODhuOCoyB8ICR7cmVzdWx0LmFjY2Vzc2liaWxpdHlTY29yZS50b0ZpeGVkKDEpfS8xMDAgfCAke3Jlc3VsdC5hY2Nlc3NpYmlsaXR5U2NvcmUgPj0gODUgPyAn4pyFJyA6ICfinYwnfSB8XG58IOapn+iDveaApyB8ICR7cmVzdWx0LmZ1bmN0aW9uYWxpdHlTY29yZS50b0ZpeGVkKDEpfS8xMDAgfCAke3Jlc3VsdC5mdW5jdGlvbmFsaXR5U2NvcmUgPj0gODAgPyAn4pyFJyA6ICfimqDvuI8nfSB8XG5cbiMjIPCfk4gg44OG44K544OI44K144Oe44Oq44O8XG5cbi0gKirnt4/jg4bjgrnjg4jmlbAqKjogJHtyZXN1bHQudGVzdFN1bW1hcnkudG90YWxUZXN0c31cbi0gKirlkIjmoLzjg4bjgrnjg4gqKjogJHtyZXN1bHQudGVzdFN1bW1hcnkucGFzc2VkVGVzdHN9XG4tICoq5LiN5ZCI5qC844OG44K544OIKio6ICR7cmVzdWx0LnRlc3RTdW1tYXJ5LmZhaWxlZFRlc3RzfVxuLSAqKuODhuOCueODiOOCq+ODkOODrOODg+OCuCoqOiAke3Jlc3VsdC50ZXN0U3VtbWFyeS50ZXN0Q292ZXJhZ2UudG9GaXhlZCgxKX0lXG5cbiMjIyDllY/poYzjga7lhoXoqLNcblxuLSDwn5S0ICoq6YeN6KaB44Gq5ZWP6aGMKio6ICR7cmVzdWx0LnRlc3RTdW1tYXJ5LmNyaXRpY2FsSXNzdWVzfeS7tlxuLSDwn5+hICoq5Li76KaB44Gq5ZWP6aGMKio6ICR7cmVzdWx0LnRlc3RTdW1tYXJ5Lm1ham9ySXNzdWVzfeS7tlxuLSDwn5+iICoq6Lu95b6u44Gq5ZWP6aGMKio6ICR7cmVzdWx0LnRlc3RTdW1tYXJ5Lm1pbm9ySXNzdWVzfeS7tlxuXG4jIyDwn5SNIOWAi+WIpeODhuOCueODiOe1kOaenFxuXG4ke2dlbmVyYXRlSW5kaXZpZHVhbFRlc3RSZXN1bHRzKHJlc3VsdCl9XG5cbiMjIPCfkqEg5o6o5aWo5LqL6aCFXG5cbiR7cmVzdWx0LnJlY29tbWVuZGF0aW9ucy5tYXAoKHJlYywgaW5kZXgpID0+IGAke2luZGV4ICsgMX0uICR7cmVjfWApLmpvaW4oJ1xcbicpfVxuXG4jIyDwn5OdIOips+e0sOaDheWgsVxuXG4tICoq44Os44K544Od44Oz44K344OW44OH44K244Kk44OzKio6ICR7cmVzdWx0LnJlc3BvbnNpdmVEZXNpZ25SZXN1bHQgPyBgJHtyZXN1bHQucmVzcG9uc2l2ZURlc2lnblJlc3VsdC5zdWNjZXNzID8gJ+KchSDlkIjmoLwnIDogJ+KdjCDkuI3lkIjmoLwnfSAoJHtyZXN1bHQucmVzcG9uc2l2ZURlc2lnblJlc3VsdC5vdmVyYWxsUmVzcG9uc2l2ZVNjb3JlLnRvRml4ZWQoMSl9LzEwMClgIDogJ+KPre+4jyDjgrnjgq3jg4Pjg5cnfVxuLSAqKuODquOCouODq+OCv+OCpOODoOODgeODo+ODg+ODiCoqOiAke3Jlc3VsdC5yZWFsdGltZUNoYXRSZXN1bHQgPyBgJHtyZXN1bHQucmVhbHRpbWVDaGF0UmVzdWx0LnN1Y2Nlc3MgPyAn4pyFIOWQiOagvCcgOiAn4p2MIOS4jeWQiOagvCd9ICgke3Jlc3VsdC5yZWFsdGltZUNoYXRSZXN1bHQub3ZlcmFsbENoYXRTY29yZS50b0ZpeGVkKDEpfS8xMDApYCA6ICfij63vuI8g44K544Kt44OD44OXJ31cbi0gKirmlofmm7jjgr3jg7zjgrnooajnpLoqKjogJHtyZXN1bHQuZG9jdW1lbnRTb3VyY2VEaXNwbGF5UmVzdWx0ID8gYCR7cmVzdWx0LmRvY3VtZW50U291cmNlRGlzcGxheVJlc3VsdC5zdWNjZXNzID8gJ+KchSDlkIjmoLwnIDogJ+KdjCDkuI3lkIjmoLwnfSAoJHtyZXN1bHQuZG9jdW1lbnRTb3VyY2VEaXNwbGF5UmVzdWx0Lm92ZXJhbGxTb3VyY2VTY29yZS50b0ZpeGVkKDEpfS8xMDApYCA6ICfij63vuI8g44K544Kt44OD44OXJ31cbi0gKirjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqMqKjogJHtyZXN1bHQuYWNjZXNzaWJpbGl0eVJlc3VsdCA/IGAke3Jlc3VsdC5hY2Nlc3NpYmlsaXR5UmVzdWx0LnN1Y2Nlc3MgPyAn4pyFIOWQiOagvCcgOiAn4p2MIOS4jeWQiOagvCd9ICgke3Jlc3VsdC5hY2Nlc3NpYmlsaXR5UmVzdWx0Lm92ZXJhbGxBY2Nlc3NpYmlsaXR5U2NvcmUudG9GaXhlZCgxKX0vMTAwKWAgOiAn4o+t77iPIOOCueOCreODg+ODlyd9XG5cbi0tLVxuKuOBk+OBruODrOODneODvOODiOOBr+iHquWLleeUn+aIkOOBleOCjOOBvuOBl+OBnyAtICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfSpcbmA7XG5cbiAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKHJlcG9ydFBhdGgsIG1hcmtkb3duLCAndXRmLTgnKTtcbiAgY29uc29sZS5sb2coYOKchSBNYXJrZG93buODrOODneODvOODiOOCkueUn+aIkOOBl+OBvuOBl+OBnzogJHtyZXBvcnRQYXRofWApO1xufVxuXG4vKipcbiAqIOWAi+WIpeODhuOCueODiOe1kOaenOOBrueUn+aIkFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluZGl2aWR1YWxUZXN0UmVzdWx0cyhyZXN1bHQ6IFVJSW50ZWdyYXRpb25UZXN0UmVzdWx0KTogc3RyaW5nIHtcbiAgbGV0IGNvbnRlbnQgPSAnJztcblxuICBpZiAocmVzdWx0LnJlc3BvbnNpdmVEZXNpZ25SZXN1bHQpIHtcbiAgICBjb250ZW50ICs9IGAjIyMg8J+TsSDjg6zjgrnjg53jg7Pjgrfjg5bjg4fjgrbjgqTjg7Pjg4bjgrnjg4hcblxuLSAqKuOCueOCs+OCoioqOiAke3Jlc3VsdC5yZXNwb25zaXZlRGVzaWduUmVzdWx0Lm92ZXJhbGxSZXNwb25zaXZlU2NvcmUudG9GaXhlZCgxKX0vMTAwXG4tICoq57WQ5p6cKio6ICR7cmVzdWx0LnJlc3BvbnNpdmVEZXNpZ25SZXN1bHQuc3VjY2VzcyA/ICfinIUg5ZCI5qC8JyA6ICfinYwg5LiN5ZCI5qC8J31cbi0gKirjg4bjgrnjg4jlr77osaHjg4fjg5DjgqTjgrkqKjogJHtyZXN1bHQucmVzcG9uc2l2ZURlc2lnblJlc3VsdC5kZXZpY2VSZXN1bHRzLmxlbmd0aH3lj7Bcbi0gKirjg6zjgqTjgqLjgqbjg4jkuIDosqvmgKcqKjogJHtyZXN1bHQucmVzcG9uc2l2ZURlc2lnblJlc3VsdC5sYXlvdXRDb25zaXN0ZW5jeVNjb3JlLnRvRml4ZWQoMSl9LzEwMFxuLSAqKuOCr+ODreOCueODh+ODkOOCpOOCueS6kuaPm+aApyoqOiAke3Jlc3VsdC5yZXNwb25zaXZlRGVzaWduUmVzdWx0LmNyb3NzRGV2aWNlQ29tcGF0aWJpbGl0eS50b0ZpeGVkKDEpfS8xMDBcblxuYDtcbiAgfVxuXG4gIGlmIChyZXN1bHQucmVhbHRpbWVDaGF0UmVzdWx0KSB7XG4gICAgY29udGVudCArPSBgIyMjIPCfkqwg44Oq44Ki44Or44K/44Kk44Og44OB44Oj44OD44OI44OG44K544OIXG5cbi0gKirjgrnjgrPjgqIqKjogJHtyZXN1bHQucmVhbHRpbWVDaGF0UmVzdWx0Lm92ZXJhbGxDaGF0U2NvcmUudG9GaXhlZCgxKX0vMTAwXG4tICoq57WQ5p6cKio6ICR7cmVzdWx0LnJlYWx0aW1lQ2hhdFJlc3VsdC5zdWNjZXNzID8gJ+KchSDlkIjmoLwnIDogJ+KdjCDkuI3lkIjmoLwnfVxuLSAqKuS/oemgvOaApyoqOiAke3Jlc3VsdC5yZWFsdGltZUNoYXRSZXN1bHQucmVsaWFiaWxpdHlTY29yZS50b0ZpeGVkKDEpfS8xMDBcbi0gKirjg5Hjg5Xjgqnjg7zjg57jg7PjgrkqKjogJHtyZXN1bHQucmVhbHRpbWVDaGF0UmVzdWx0LnBlcmZvcm1hbmNlU2NvcmUudG9GaXhlZCgxKX0vMTAwXG4tICoq44Om44O844K244O844Ko44Kv44K544Oa44Oq44Ko44Oz44K5Kio6ICR7cmVzdWx0LnJlYWx0aW1lQ2hhdFJlc3VsdC51c2VyRXhwZXJpZW5jZVNjb3JlLnRvRml4ZWQoMSl9LzEwMFxuXG5gO1xuICB9XG5cbiAgaWYgKHJlc3VsdC5kb2N1bWVudFNvdXJjZURpc3BsYXlSZXN1bHQpIHtcbiAgICBjb250ZW50ICs9IGAjIyMg8J+TmiDmlofmm7jjgr3jg7zjgrnooajnpLrjg4bjgrnjg4hcblxuLSAqKuOCueOCs+OCoioqOiAke3Jlc3VsdC5kb2N1bWVudFNvdXJjZURpc3BsYXlSZXN1bHQub3ZlcmFsbFNvdXJjZVNjb3JlLnRvRml4ZWQoMSl9LzEwMFxuLSAqKue1kOaenCoqOiAke3Jlc3VsdC5kb2N1bWVudFNvdXJjZURpc3BsYXlSZXN1bHQuc3VjY2VzcyA/ICfinIUg5ZCI5qC8JyA6ICfinYwg5LiN5ZCI5qC8J31cbi0gKirluLDlsZ7nsr7luqYqKjogJHtyZXN1bHQuZG9jdW1lbnRTb3VyY2VEaXNwbGF5UmVzdWx0LmF0dHJpYnV0aW9uQWNjdXJhY3kudG9GaXhlZCgxKX0vMTAwXG4tICoq6KGo56S65ZOB6LOqKio6ICR7cmVzdWx0LmRvY3VtZW50U291cmNlRGlzcGxheVJlc3VsdC5kaXNwbGF5UXVhbGl0eS50b0ZpeGVkKDEpfS8xMDBcbi0gKirjgrPjg7Pjg5fjg6njgqTjgqLjg7PjgrkqKjogJHtyZXN1bHQuZG9jdW1lbnRTb3VyY2VEaXNwbGF5UmVzdWx0LmNvbXBsaWFuY2VTY29yZS50b0ZpeGVkKDEpfS8xMDBcblxuYDtcbiAgfVxuXG4gIGlmIChyZXN1bHQuYWNjZXNzaWJpbGl0eVJlc3VsdCkge1xuICAgIGNvbnRlbnQgKz0gYCMjIyDimb8g44Ki44Kv44K744K344OT44Oq44OG44Kj44OG44K544OIXG5cbi0gKirjgrnjgrPjgqIqKjogJHtyZXN1bHQuYWNjZXNzaWJpbGl0eVJlc3VsdC5vdmVyYWxsQWNjZXNzaWJpbGl0eVNjb3JlLnRvRml4ZWQoMSl9LzEwMFxuLSAqKue1kOaenCoqOiAke3Jlc3VsdC5hY2Nlc3NpYmlsaXR5UmVzdWx0LnN1Y2Nlc3MgPyAn4pyFIOWQiOagvCcgOiAn4p2MIOS4jeWQiOagvCd9XG4tICoqV0NBR+a6luaLoOODrOODmeODqyoqOiAke3Jlc3VsdC5hY2Nlc3NpYmlsaXR5UmVzdWx0LndjYWdDb21wbGlhbmNlTGV2ZWx9XG4tICoq6YeN6KaB44Gq5ZWP6aGMKio6ICR7cmVzdWx0LmFjY2Vzc2liaWxpdHlSZXN1bHQuY3JpdGljYWxJc3N1ZUNvdW50feS7tlxuLSAqKuiHquWLleODhuOCueODiOOCq+ODkOODrOODg+OCuCoqOiAke3Jlc3VsdC5hY2Nlc3NpYmlsaXR5UmVzdWx0LmF1dG9tYXRlZFRlc3RDb3ZlcmFnZS50b0ZpeGVkKDEpfSVcblxuYDtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIEhUTUzjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVIVE1MUmVwb3J0KHJlc3VsdDogVUlJbnRlZ3JhdGlvblRlc3RSZXN1bHQsIG91dHB1dERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHJlcG9ydFBhdGggPSBwYXRoLmpvaW4ob3V0cHV0RGlyLCAndWktaW50ZWdyYXRpb24tdGVzdC1yZXBvcnQuaHRtbCcpO1xuICBcbiAgY29uc3QgaHRtbCA9IGA8IURPQ1RZUEUgaHRtbD5cbjxodG1sIGxhbmc9XCJqYVwiPlxuPGhlYWQ+XG4gICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIj5cbiAgICA8dGl0bGU+VUnntbHlkIjjg4bjgrnjg4jjg6zjg53jg7zjg4g8L3RpdGxlPlxuICAgIDxzdHlsZT5cbiAgICAgICAgYm9keSB7IGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdTZWdvZSBVSScsIFJvYm90bywgc2Fucy1zZXJpZjsgbWFyZ2luOiA0MHB4OyB9XG4gICAgICAgIC5oZWFkZXIgeyBiYWNrZ3JvdW5kOiAjZjhmOWZhOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiA4cHg7IG1hcmdpbi1ib3R0b206IDMwcHg7IH1cbiAgICAgICAgLnNjb3JlLWdyaWQgeyBkaXNwbGF5OiBncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpdCwgbWlubWF4KDIwMHB4LCAxZnIpKTsgZ2FwOiAyMHB4OyBtYXJnaW46IDIwcHggMDsgfVxuICAgICAgICAuc2NvcmUtY2FyZCB7IGJhY2tncm91bmQ6IHdoaXRlOyBib3JkZXI6IDFweCBzb2xpZCAjZTllY2VmOyBib3JkZXItcmFkaXVzOiA4cHg7IHBhZGRpbmc6IDIwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxuICAgICAgICAuc2NvcmUtdmFsdWUgeyBmb250LXNpemU6IDJlbTsgZm9udC13ZWlnaHQ6IGJvbGQ7IG1hcmdpbjogMTBweCAwOyB9XG4gICAgICAgIC5zdWNjZXNzIHsgY29sb3I6ICMyOGE3NDU7IH1cbiAgICAgICAgLndhcm5pbmcgeyBjb2xvcjogI2ZmYzEwNzsgfVxuICAgICAgICAuZGFuZ2VyIHsgY29sb3I6ICNkYzM1NDU7IH1cbiAgICAgICAgLnRlc3Qtc2VjdGlvbiB7IG1hcmdpbjogMzBweCAwOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItbGVmdDogNHB4IHNvbGlkICMwMDdiZmY7IGJhY2tncm91bmQ6ICNmOGY5ZmE7IH1cbiAgICAgICAgLnJlY29tbWVuZGF0aW9ucyB7IGJhY2tncm91bmQ6ICNmZmYzY2Q7IGJvcmRlcjogMXB4IHNvbGlkICNmZmVhYTc7IGJvcmRlci1yYWRpdXM6IDhweDsgcGFkZGluZzogMjBweDsgbWFyZ2luOiAyMHB4IDA7IH1cbiAgICA8L3N0eWxlPlxuPC9oZWFkPlxuPGJvZHk+XG4gICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICA8aDE+8J+OqCBVSee1seWQiOODhuOCueODiOODrOODneODvOODiDwvaDE+XG4gICAgICAgIDxwPjxzdHJvbmc+5a6f6KGM5pel5pmCOjwvc3Ryb25nPiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoJ2phLUpQJyl9PC9wPlxuICAgICAgICA8cD48c3Ryb25nPuODhuOCueODiOeSsOWigzo8L3N0cm9uZz4gJHtURVNUX0VOVklST05NRU5UfTwvcD5cbiAgICAgICAgPHA+PHN0cm9uZz7jg5njg7zjgrlVUkw6PC9zdHJvbmc+ICR7QkFTRV9VUkx9PC9wPlxuICAgICAgICA8cD48c3Ryb25nPue3j+WQiOe1kOaenDo8L3N0cm9uZz4gJHtyZXN1bHQuc3VjY2VzcyA/ICc8c3BhbiBjbGFzcz1cInN1Y2Nlc3NcIj7inIUg5ZCI5qC8PC9zcGFuPicgOiAnPHNwYW4gY2xhc3M9XCJkYW5nZXJcIj7inYwg5LiN5ZCI5qC8PC9zcGFuPid9PC9wPlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cInNjb3JlLWdyaWRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNjb3JlLWNhcmRcIj5cbiAgICAgICAgICAgIDxoMz7nt4/lkIhVSeOCueOCs+OCojwvaDM+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2NvcmUtdmFsdWUgJHtyZXN1bHQub3ZlcmFsbFVJU2NvcmUgPj0gODUgPyAnc3VjY2VzcycgOiAnZGFuZ2VyJ31cIj4ke3Jlc3VsdC5vdmVyYWxsVUlTY29yZS50b0ZpeGVkKDEpfTwvZGl2PlxuICAgICAgICAgICAgPHA+LzEwMDwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzY29yZS1jYXJkXCI+XG4gICAgICAgICAgICA8aDM+44Om44O844K244O844Ko44Kv44K544Oa44Oq44Ko44Oz44K5PC9oMz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY29yZS12YWx1ZSAke3Jlc3VsdC51c2VyRXhwZXJpZW5jZVNjb3JlID49IDgwID8gJ3N1Y2Nlc3MnIDogJ3dhcm5pbmcnfVwiPiR7cmVzdWx0LnVzZXJFeHBlcmllbmNlU2NvcmUudG9GaXhlZCgxKX08L2Rpdj5cbiAgICAgICAgICAgIDxwPi8xMDA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwic2NvcmUtY2FyZFwiPlxuICAgICAgICAgICAgPGgzPuODkeODleOCqeODvOODnuODs+OCuTwvaDM+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2NvcmUtdmFsdWUgJHtyZXN1bHQucGVyZm9ybWFuY2VTY29yZSA+PSA4MCA/ICdzdWNjZXNzJyA6ICd3YXJuaW5nJ31cIj4ke3Jlc3VsdC5wZXJmb3JtYW5jZVNjb3JlLnRvRml4ZWQoMSl9PC9kaXY+XG4gICAgICAgICAgICA8cD4vMTAwPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNjb3JlLWNhcmRcIj5cbiAgICAgICAgICAgIDxoMz7jgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqM8L2gzPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNjb3JlLXZhbHVlICR7cmVzdWx0LmFjY2Vzc2liaWxpdHlTY29yZSA+PSA4NSA/ICdzdWNjZXNzJyA6ICdkYW5nZXInfVwiPiR7cmVzdWx0LmFjY2Vzc2liaWxpdHlTY29yZS50b0ZpeGVkKDEpfTwvZGl2PlxuICAgICAgICAgICAgPHA+LzEwMDwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwidGVzdC1zZWN0aW9uXCI+XG4gICAgICAgIDxoMj7wn5OIIOODhuOCueODiOOCteODnuODquODvDwvaDI+XG4gICAgICAgIDx1bD5cbiAgICAgICAgICAgIDxsaT48c3Ryb25nPue3j+ODhuOCueODiOaVsDo8L3N0cm9uZz4gJHtyZXN1bHQudGVzdFN1bW1hcnkudG90YWxUZXN0c308L2xpPlxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+5ZCI5qC844OG44K544OIOjwvc3Ryb25nPiAke3Jlc3VsdC50ZXN0U3VtbWFyeS5wYXNzZWRUZXN0c308L2xpPlxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+5LiN5ZCI5qC844OG44K544OIOjwvc3Ryb25nPiAke3Jlc3VsdC50ZXN0U3VtbWFyeS5mYWlsZWRUZXN0c308L2xpPlxuICAgICAgICAgICAgPGxpPjxzdHJvbmc+44OG44K544OI44Kr44OQ44Os44OD44K4Ojwvc3Ryb25nPiAke3Jlc3VsdC50ZXN0U3VtbWFyeS50ZXN0Q292ZXJhZ2UudG9GaXhlZCgxKX0lPC9saT5cbiAgICAgICAgICAgIDxsaT48c3Ryb25nPuWun+ihjOaZgumWkzo8L3N0cm9uZz4gJHsocmVzdWx0LnRlc3RTdW1tYXJ5LmV4ZWN1dGlvblRpbWUgLyAxMDAwKS50b0ZpeGVkKDEpfeenkjwvbGk+XG4gICAgICAgIDwvdWw+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwicmVjb21tZW5kYXRpb25zXCI+XG4gICAgICAgIDxoMj7wn5KhIOaOqOWlqOS6i+mghTwvaDI+XG4gICAgICAgIDxvbD5cbiAgICAgICAgICAgICR7cmVzdWx0LnJlY29tbWVuZGF0aW9ucy5tYXAocmVjID0+IGA8bGk+JHtyZWN9PC9saT5gKS5qb2luKCcnKX1cbiAgICAgICAgPC9vbD5cbiAgICA8L2Rpdj5cblxuICAgIDxmb290ZXIgc3R5bGU9XCJtYXJnaW4tdG9wOiA1MHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjNmM3NTdkO1wiPlxuICAgICAgICA8cD7jgZPjga7jg6zjg53jg7zjg4jjga/oh6rli5XnlJ/miJDjgZXjgozjgb7jgZfjgZ8gLSAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX08L3A+XG4gICAgPC9mb290ZXI+XG48L2JvZHk+XG48L2h0bWw+YDtcblxuICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUocmVwb3J0UGF0aCwgaHRtbCwgJ3V0Zi04Jyk7XG4gIGNvbnNvbGUubG9nKGDinIUgSFRNTOODrOODneODvOODiOOCkueUn+aIkOOBl+OBvuOBl+OBnzogJHtyZXBvcnRQYXRofWApO1xufVxuXG4vKipcbiAqIOOCqOODqeODvOODrOODneODvOODiOOBrueUn+aIkO+8iOW8t+WMlueJiO+8iVxuICovXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUVycm9yUmVwb3J0KGVycm9yOiB1bmtub3duLCBleGVjdXRpb25UaW1lOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcbiAgY29uc3QgZXJyb3JSZXBvcnREaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAncmVwb3J0cycsICdlcnJvcnMnKTtcbiAgY29uc3QgZXJyb3JSZXBvcnRQYXRoID0gcGF0aC5qb2luKGVycm9yUmVwb3J0RGlyLCBgdWktaW50ZWdyYXRpb24tZXJyb3ItJHt0aW1lc3RhbXB9Lmpzb25gKTtcblxuICAvLyDjgqjjg6njg7zmg4XloLHjga7oqbPntLDliIbmnpBcbiAgY29uc3QgZXJyb3JBbmFseXNpcyA9IGFuYWx5emVFcnJvcihlcnJvcik7XG5cbiAgY29uc3QgZXJyb3JSZXBvcnQgPSB7XG4gICAgbWV0YWRhdGE6IHtcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgdGVzdFR5cGU6ICdVSSBJbnRlZ3JhdGlvbiBUZXN0JyxcbiAgICAgIHJlcG9ydFZlcnNpb246ICcxLjAuMCdcbiAgICB9LFxuICAgIGV4ZWN1dGlvbjoge1xuICAgICAgZXhlY3V0aW9uVGltZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9jZXNzLmVudi5URVNUX0VOVklST05NRU5UIHx8ICd1bmtub3duJyxcbiAgICAgIGJhc2VVcmw6IHByb2Nlc3MuZW52LkJBU0VfVVJMIHx8ICd1bmtub3duJ1xuICAgIH0sXG4gICAgZXJyb3I6IGVycm9yQW5hbHlzaXMsXG4gICAgc3lzdGVtSW5mbzoge1xuICAgICAgbm9kZVZlcnNpb246IHByb2Nlc3MudmVyc2lvbixcbiAgICAgIHBsYXRmb3JtOiBwcm9jZXNzLnBsYXRmb3JtLFxuICAgICAgYXJjaDogcHJvY2Vzcy5hcmNoLFxuICAgICAgbWVtb3J5OiBwcm9jZXNzLm1lbW9yeVVzYWdlKCksXG4gICAgICB1cHRpbWU6IHByb2Nlc3MudXB0aW1lKClcbiAgICB9LFxuICAgIHJlY29tbWVuZGF0aW9uczogZ2VuZXJhdGVFcnJvclJlY29tbWVuZGF0aW9ucyhlcnJvckFuYWx5c2lzKVxuICB9O1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIoZXJyb3JSZXBvcnREaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBtb2RlOiAwbzc1NSB9KTtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUoZXJyb3JSZXBvcnRQYXRoLCBKU09OLnN0cmluZ2lmeShlcnJvclJlcG9ydCwgbnVsbCwgMiksICd1dGYtOCcpO1xuICAgIGNvbnNvbGUubG9nKGDwn5OEIOOCqOODqeODvOODrOODneODvOODiOOCkueUn+aIkOOBl+OBvuOBl+OBnzogJHtlcnJvclJlcG9ydFBhdGh9YCk7XG4gIH0gY2F0Y2ggKHJlcG9ydEVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIOOCqOODqeODvOODrOODneODvOODiOOBrueUn+aIkOOBq+WkseaVlzonLCByZXBvcnRFcnJvcik7XG4gICAgLy8g44OV44Kp44O844Or44OQ44OD44KvOiDjgrPjg7Pjgr3jg7zjg6vjgavjgqjjg6njg7zmg4XloLHjgpLlh7rliptcbiAgICBjb25zb2xlLmVycm9yKCfjgqjjg6njg7zoqbPntLA6JywgSlNPTi5zdHJpbmdpZnkoZXJyb3JSZXBvcnQsIG51bGwsIDIpKTtcbiAgfVxufVxuXG4vKipcbiAqIOOCqOODqeODvOOBruips+e0sOWIhuaekFxuICovXG5mdW5jdGlvbiBhbmFseXplRXJyb3IoZXJyb3I6IHVua25vd24pOiB7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgc3RhY2s/OiBzdHJpbmc7XG4gIHR5cGU6IHN0cmluZztcbiAgY2F0ZWdvcnk6IHN0cmluZztcbiAgc2V2ZXJpdHk6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnO1xufSB7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgbGV0IGNhdGVnb3J5ID0gJ3Vua25vd24nO1xuICAgIGxldCBzZXZlcml0eTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8ICdjcml0aWNhbCcgPSAnbWVkaXVtJztcblxuICAgIC8vIOOCqOODqeODvOOCq+ODhuOCtOODquOBruWIpOWumlxuICAgIGlmIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCdFTk9FTlQnKSB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCfjg5XjgqHjgqTjg6snKSkge1xuICAgICAgY2F0ZWdvcnkgPSAnZmlsZS1zeXN0ZW0nO1xuICAgICAgc2V2ZXJpdHkgPSAnaGlnaCc7XG4gICAgfSBlbHNlIGlmIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCdFQ09OTlJFRlVTRUQnKSB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCfmjqXntponKSkge1xuICAgICAgY2F0ZWdvcnkgPSAnbmV0d29yayc7XG4gICAgICBzZXZlcml0eSA9ICdoaWdoJztcbiAgICB9IGVsc2UgaWYgKGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJ3Blcm1pc3Npb24nKSB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCfmqKnpmZAnKSkge1xuICAgICAgY2F0ZWdvcnkgPSAncGVybWlzc2lvbic7XG4gICAgICBzZXZlcml0eSA9ICdjcml0aWNhbCc7XG4gICAgfSBlbHNlIGlmIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCd0aW1lb3V0JykgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygn44K/44Kk44Og44Ki44Km44OIJykpIHtcbiAgICAgIGNhdGVnb3J5ID0gJ3RpbWVvdXQnO1xuICAgICAgc2V2ZXJpdHkgPSAnbWVkaXVtJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIHN0YWNrOiBlcnJvci5zdGFjayxcbiAgICAgIHR5cGU6IGVycm9yLmNvbnN0cnVjdG9yLm5hbWUsXG4gICAgICBjYXRlZ29yeSxcbiAgICAgIHNldmVyaXR5XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbWVzc2FnZTogU3RyaW5nKGVycm9yKSxcbiAgICB0eXBlOiB0eXBlb2YgZXJyb3IsXG4gICAgY2F0ZWdvcnk6ICd1bmtub3duJyxcbiAgICBzZXZlcml0eTogJ2xvdydcbiAgfTtcbn1cblxuLyoqXG4gKiDjgqjjg6njg7zjgavln7rjgaXjgY/mjqjlpajkuovpoIXjga7nlJ/miJBcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVFcnJvclJlY29tbWVuZGF0aW9ucyhlcnJvckFuYWx5c2lzOiBhbnkpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHJlY29tbWVuZGF0aW9uczogc3RyaW5nW10gPSBbXTtcblxuICBzd2l0Y2ggKGVycm9yQW5hbHlzaXMuY2F0ZWdvcnkpIHtcbiAgICBjYXNlICdmaWxlLXN5c3RlbSc6XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44OV44Kh44Kk44Or44OR44K544Go44OH44Kj44Os44Kv44OI44Oq44Gu5a2Y5Zyo44KS56K66KqN44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44OV44Kh44Kk44Or44Gu6Kqt44G/5pu444GN5qip6ZmQ44KS56K66KqN44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICduZXR3b3JrJzpcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfjg43jg4Pjg4jjg6/jg7zjgq/mjqXntprjgpLnorroqo3jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfjg5njg7zjgrlVUkzjgYzmraPjgZfjgY/oqK3lrprjgZXjgozjgabjgYTjgovjgYvnorroqo3jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3Blcm1pc3Npb24nOlxuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+Wun+ihjOaoqemZkOOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+ODleOCoeOCpOODq+OCt+OCueODhuODoOOBruaoqemZkOioreWumuOCkuimi+ebtOOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndGltZW91dCc6XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44K/44Kk44Og44Ki44Km44OI5YCk44KS5aKX44KE44GZ44GT44Go44KS5qSc6KiO44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44K344K544OG44Og44Oq44K944O844K544Gu5L2/55So54q25rOB44KS56K66KqN44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+ODreOCsOODleOCoeOCpOODq+OBp+ips+e0sOOBquOCqOODqeODvOaDheWgseOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ+OCt+OCueODhuODoOeSsOWig+OBqOS+neWtmOmWouS/guOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICB9XG5cbiAgcmV0dXJuIHJlY29tbWVuZGF0aW9ucztcbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jlrozkuoblh6bnkIZcbiAqL1xuYXN5bmMgZnVuY3Rpb24gaGFuZGxlVGVzdENvbXBsZXRpb24ocmVzdWx0OiBVSUludGVncmF0aW9uVGVzdFJlc3VsdCwgZXhlY3V0aW9uVGltZTogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCdcXG4nICsgJz0nLnJlcGVhdCg4MCkpO1xuICBjb25zb2xlLmxvZygn8J+PgSBVSee1seWQiOODhuOCueODiOWujOS6hicpO1xuICBjb25zb2xlLmxvZygnPScucmVwZWF0KDgwKSk7XG4gIFxuICBjb25zb2xlLmxvZyhg4o+x77iPICDnt4/lrp/ooYzmmYLplpM6ICR7KGV4ZWN1dGlvblRpbWUgLyAxMDAwKS50b0ZpeGVkKDEpfeenkmApO1xuICBjb25zb2xlLmxvZyhg8J+TiiDnt4/lkIjjgrnjgrPjgqI6ICR7cmVzdWx0Lm92ZXJhbGxVSVNjb3JlLnRvRml4ZWQoMSl9LzEwMGApO1xuICBjb25zb2xlLmxvZyhg8J+OryDjg4bjgrnjg4jmiJDlip/njoc6ICR7cmVzdWx0LnRlc3RTdW1tYXJ5LnRlc3RDb3ZlcmFnZS50b0ZpeGVkKDEpfSVgKTtcblxuICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICBjb25zb2xlLmxvZygn8J+OiSDjgZnjgbnjgabjga5VSeODhuOCueODiOOBjOato+W4uOOBq+WujOS6huOBl+OBvuOBl+OBn++8gScpO1xuICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygn4pqg77iPICDkuIDpg6jjga7jg4bjgrnjg4jjgYzlpLHmlZfjgZfjgb7jgZfjgZ/jgILoqbPntLDjga/jg6zjg53jg7zjg4jjgpLnorroqo3jgZfjgabjgY/jgaDjgZXjgYTjgIInKTtcbiAgICBcbiAgICBpZiAocmVzdWx0LnRlc3RTdW1tYXJ5LmNyaXRpY2FsSXNzdWVzID4gMCkge1xuICAgICAgY29uc29sZS5sb2coYPCflLQg6YeN6KaB44Gq5ZWP6aGM44GMICR7cmVzdWx0LnRlc3RTdW1tYXJ5LmNyaXRpY2FsSXNzdWVzfeS7tiDmpJzlh7rjgZXjgozjgb7jgZfjgZ/jgIJgKTtcbiAgICB9XG4gICAgXG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbi8vIOOCueOCr+ODquODl+ODiOOBjOebtOaOpeWun+ihjOOBleOCjOOBn+WgtOWQiOOBruOBv21haW7plqLmlbDjgpLlkbzjgbPlh7rjgZdcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDkuojmnJ/jgZfjgarjgYTjgqjjg6njg7zjgYznmbrnlJ/jgZfjgb7jgZfjgZ86JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSk7XG59XG5cbmV4cG9ydCB7IG1haW4gYXMgcnVuVUlJbnRlZ3JhdGlvblRlc3RzIH07Il19