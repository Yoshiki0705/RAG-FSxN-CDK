#!/usr/bin/env node
"use strict";
/**
 * 統合テストスイート実行スクリプト
 *
 * 全テストモジュールを統合して実行し、包括的なレポートを生成
 *
 * 使用方法:
 *   npm run test:integration
 *   node run-integration-test-suite.ts
 *   node run-integration-test-suite.ts --mode=parallel
 *   node run-integration-test-suite.ts --modules=auth,chatbot --format=html
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const integration_test_suite_1 = require("./integration-test-suite");
const integration_report_generator_1 = require("./reporting/integration-report-generator");
/**
 * メイン実行関数
 */
async function main() {
    console.log('🚀 統合テストスイート実行開始');
    console.log('=====================================');
    try {
        // コマンドライン引数の解析
        const options = parseCommandLineArgs();
        // ヘルプ表示
        if (options.help) {
            showHelp();
            return;
        }
        // 設定の構築
        const config = buildTestConfig(options);
        const reportConfig = buildReportConfig(options);
        // 実行前の情報表示
        displayExecutionInfo(config, options);
        // 統合テストスイートの初期化と実行
        const testSuite = new integration_test_suite_1.IntegrationTestSuite(config);
        const testResults = await testSuite.execute();
        // 結果の表示
        displayResults(testResults);
        // レポート生成
        const reportGenerator = new integration_report_generator_1.IntegrationReportGenerator(reportConfig);
        const reportFiles = await reportGenerator.generateReport(testResults);
        // 生成されたレポートファイルの表示
        displayGeneratedReports(reportFiles);
        // 終了コードの決定
        const exitCode = testResults.overall.success ? 0 : 1;
        console.log('=====================================');
        console.log(`✅ 統合テストスイート実行完了 (終了コード: ${exitCode})`);
        process.exit(exitCode);
    }
    catch (error) {
        console.error('❌ 統合テストスイート実行エラー:', error);
        console.error('=====================================');
        process.exit(1);
    }
}
/**
 * コマンドライン引数の解析
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const options = {
        mode: 'hybrid',
        modules: [],
        format: ['json', 'html'],
        output: './test-reports',
        timeout: 300000, // 5分
        retries: 2,
        stopOnFailure: false,
        verbose: false,
        help: false
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--mode':
            case '-m':
                options.mode = args[++i];
                break;
            case '--modules':
                options.modules = args[++i].split(',').map(m => m.trim());
                break;
            case '--format':
            case '-f':
                options.format = args[++i].split(',').map(f => f.trim());
                break;
            case '--output':
            case '-o':
                options.output = args[++i];
                break;
            case '--timeout':
            case '-t':
                options.timeout = parseInt(args[++i], 10);
                break;
            case '--retries':
            case '-r':
                options.retries = parseInt(args[++i], 10);
                break;
            case '--stop-on-failure':
                options.stopOnFailure = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    console.warn(`⚠️  未知のオプション: ${arg}`);
                }
        }
    }
    return options;
}
/**
 * テスト設定の構築
 */
function buildTestConfig(options) {
    const config = { ...integration_test_suite_1.DefaultIntegrationTestSuiteConfig };
    // 実行モードの設定
    config.executionMode = options.mode;
    // モジュール選択の設定
    if (options.modules.length > 0) {
        // 全モジュールを無効化
        Object.keys(config.enabledModules).forEach(key => {
            config.enabledModules[key] = false;
        });
        // 指定されたモジュールのみ有効化
        for (const moduleName of options.modules) {
            const normalizedName = normalizeModuleName(moduleName);
            if (normalizedName in config.enabledModules) {
                config.enabledModules[normalizedName] = true;
            }
            else {
                console.warn(`⚠️  未知のモジュール: ${moduleName}`);
            }
        }
    }
    // 実行制御の設定
    config.execution.timeoutPerModule = options.timeout;
    config.execution.retryAttempts = options.retries;
    config.execution.stopOnFirstFailure = options.stopOnFailure;
    // 詳細ログの設定
    if (options.verbose) {
        console.log('🔧 詳細ログモードが有効です');
    }
    return config;
}
/**
 * レポート設定の構築
 */
function buildReportConfig(options) {
    const config = { ...integration_report_generator_1.DefaultReportConfig };
    // 出力ディレクトリの設定
    config.outputDirectory = options.output;
    // 出力形式の設定
    config.formats = options.format;
    // 詳細ログの設定
    config.includeDetailedLogs = options.verbose;
    return config;
}
/**
 * モジュール名の正規化
 */
function normalizeModuleName(moduleName) {
    const moduleMap = {
        'auth': 'authentication',
        'access': 'accessControl',
        'chat': 'chatbot',
        'perf': 'performance',
        'ui': 'uiUx',
        'ux': 'uiUx',
        'sec': 'security',
        'integration': 'integration'
    };
    return moduleMap[moduleName.toLowerCase()] || moduleName;
}
/**
 * 実行情報の表示
 */
function displayExecutionInfo(config, options) {
    console.log('📋 実行設定:');
    console.log(`   実行モード: ${config.executionMode}`);
    console.log(`   有効モジュール: ${Object.entries(config.enabledModules)
        .filter(([_, enabled]) => enabled)
        .map(([name, _]) => name)
        .join(', ')}`);
    console.log(`   タイムアウト: ${config.execution.timeoutPerModule}ms`);
    console.log(`   リトライ回数: ${config.execution.retryAttempts}`);
    console.log(`   失敗時停止: ${config.execution.stopOnFirstFailure ? 'はい' : 'いいえ'}`);
    console.log(`   出力形式: ${options.format.join(', ')}`);
    console.log(`   出力先: ${options.output}`);
    console.log('');
}
/**
 * 結果の表示
 */
function displayResults(testResults) {
    console.log('');
    console.log('📊 テスト実行結果:');
    console.log('=====================================');
    // 全体結果
    const overall = testResults.overall;
    const statusIcon = overall.success ? '✅' : '❌';
    const statusText = overall.success ? 'SUCCESS' : 'FAILURE';
    console.log(`${statusIcon} 全体ステータス: ${statusText}`);
    console.log(`📈 品質スコア: ${overall.qualityScore.toFixed(1)}%`);
    console.log(`🧪 総テスト数: ${overall.totalTests}`);
    console.log(`✅ 成功: ${overall.passedTests}`);
    console.log(`❌ 失敗: ${overall.failedTests}`);
    console.log(`⏭️  スキップ: ${overall.skippedTests}`);
    console.log(`⏱️  実行時間: ${(overall.executionTime / 1000).toFixed(2)}秒`);
    // モジュール別結果
    console.log('');
    console.log('📋 モジュール別結果:');
    console.log('-------------------------------------');
    for (const [moduleName, moduleResult] of Object.entries(testResults.modules)) {
        const result = moduleResult;
        const moduleIcon = result.success ? '✅' : '❌';
        const duration = ((result.duration || 0) / 1000).toFixed(2);
        console.log(`${moduleIcon} ${moduleName}: ${result.success ? 'SUCCESS' : 'FAILURE'} (${duration}s)`);
        if (result.error) {
            console.log(`   エラー: ${result.error}`);
        }
        if (result.metrics) {
            displayModuleMetrics(moduleName, result.metrics);
        }
    }
    // 分析結果
    if (testResults.analysis) {
        displayAnalysisResults(testResults.analysis);
    }
}
/**
 * モジュールメトリクスの表示
 */
function displayModuleMetrics(moduleName, metrics) {
    switch (moduleName) {
        case 'performance':
            if (metrics.responseTime) {
                console.log(`   平均応答時間: ${metrics.responseTime}ms`);
            }
            if (metrics.throughput) {
                console.log(`   スループット: ${metrics.throughput} req/s`);
            }
            break;
        case 'security':
            if (metrics.securityScore) {
                console.log(`   セキュリティスコア: ${metrics.securityScore}%`);
            }
            if (metrics.vulnerabilities) {
                console.log(`   脆弱性: ${metrics.vulnerabilities}件`);
            }
            break;
        case 'uiUx':
            if (metrics.accessibilityScore) {
                console.log(`   アクセシビリティスコア: ${metrics.accessibilityScore}%`);
            }
            if (metrics.usabilityScore) {
                console.log(`   ユーザビリティスコア: ${metrics.usabilityScore}%`);
            }
            break;
    }
}
/**
 * 分析結果の表示
 */
function displayAnalysisResults(analysis) {
    console.log('');
    console.log('🔍 分析結果:');
    console.log('-------------------------------------');
    // 重要な問題
    if (analysis.criticalIssues && analysis.criticalIssues.length > 0) {
        console.log('🚨 重要な問題:');
        for (const issue of analysis.criticalIssues) {
            console.log(`   • ${issue}`);
        }
    }
    // 推奨事項
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        console.log('💡 推奨事項:');
        for (const recommendation of analysis.recommendations.slice(0, 3)) {
            console.log(`   • ${recommendation}`);
        }
    }
    // パフォーマンスボトルネック
    if (analysis.performanceBottlenecks && analysis.performanceBottlenecks.length > 0) {
        console.log('⚡ パフォーマンスボトルネック:');
        for (const bottleneck of analysis.performanceBottlenecks) {
            console.log(`   • ${bottleneck}`);
        }
    }
    // セキュリティ懸念
    if (analysis.securityConcerns && analysis.securityConcerns.length > 0) {
        console.log('🔒 セキュリティ懸念:');
        for (const concern of analysis.securityConcerns) {
            console.log(`   • ${concern}`);
        }
    }
}
/**
 * 生成されたレポートファイルの表示
 */
function displayGeneratedReports(reportFiles) {
    console.log('');
    console.log('📄 生成されたレポート:');
    console.log('-------------------------------------');
    for (const filePath of reportFiles) {
        console.log(`📋 ${filePath}`);
    }
    if (reportFiles.length === 0) {
        console.log('⚠️  レポートファイルが生成されませんでした');
    }
}
/**
 * ヘルプの表示
 */
function showHelp() {
    console.log(`
統合テストスイート実行スクリプト

使用方法:
  node run-integration-test-suite.ts [オプション]

オプション:
  -m, --mode <mode>           実行モード (sequential|parallel|hybrid) [default: hybrid]
  --modules <modules>         実行するモジュール (カンマ区切り)
  -f, --format <formats>      レポート形式 (json|html|pdf|csv) [default: json,html]
  -o, --output <directory>    出力ディレクトリ [default: ./test-reports]
  -t, --timeout <ms>          モジュール別タイムアウト [default: 300000]
  -r, --retries <count>       リトライ回数 [default: 2]
  --stop-on-failure          最初の失敗で停止
  -v, --verbose              詳細ログ出力
  -h, --help                 このヘルプを表示

モジュール名:
  authentication (auth)       認証テスト
  accessControl (access)      アクセス制御テスト
  chatbot (chat)             チャットボットテスト
  performance (perf)         パフォーマンステスト
  uiUx (ui, ux)             UI/UXテスト
  security (sec)             セキュリティテスト
  integration                統合テスト

使用例:
  # 全モジュールをハイブリッドモードで実行
  node run-integration-test-suite.ts

  # 認証とチャットボットのみを並列実行
  node run-integration-test-suite.ts --mode=parallel --modules=auth,chatbot

  # HTMLレポートのみ生成
  node run-integration-test-suite.ts --format=html

  # 詳細ログ付きで実行
  node run-integration-test-suite.ts --verbose

  # 失敗時に即座停止
  node run-integration-test-suite.ts --stop-on-failure
`);
}
/**
 * 未処理例外のハンドリング
 */
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未処理のPromise拒否:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('❌ 未処理の例外:', error);
    process.exit(1);
});
// Ctrl+Cでの中断処理
process.on('SIGINT', () => {
    console.log('\n🛑 テスト実行が中断されました');
    process.exit(130);
});
// メイン関数の実行
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ 予期しないエラー:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLWludGVncmF0aW9uLXRlc3Qtc3VpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJydW4taW50ZWdyYXRpb24tdGVzdC1zdWl0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBOzs7Ozs7Ozs7O0dBVUc7O0FBdWNNLG9CQUFJO0FBcmNiLHFFQUFtRztBQUNuRywyRkFBMkc7QUFnQjNHOztHQUVHO0FBQ0gsS0FBSyxVQUFVLElBQUk7SUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUVyRCxJQUFJLENBQUM7UUFDSCxlQUFlO1FBQ2YsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztRQUV2QyxRQUFRO1FBQ1IsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakIsUUFBUSxFQUFFLENBQUM7WUFDWCxPQUFPO1FBQ1QsQ0FBQztRQUVELFFBQVE7UUFDUixNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEQsV0FBVztRQUNYLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUV0QyxtQkFBbUI7UUFDbkIsTUFBTSxTQUFTLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRCxNQUFNLFdBQVcsR0FBRyxNQUFNLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU5QyxRQUFRO1FBQ1IsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTVCLFNBQVM7UUFDVCxNQUFNLGVBQWUsR0FBRyxJQUFJLHlEQUEwQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sV0FBVyxHQUFHLE1BQU0sZUFBZSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FB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LE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDbkQsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMxQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO0lBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFFSCxlQUFlO0FBQ2YsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO0lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUNsQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDO0FBRUgsV0FBVztBQUNYLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUM1QixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNyQixPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuLyoqXG4gKiDntbHlkIjjg4bjgrnjg4jjgrnjgqTjg7zjg4jlrp/ooYzjgrnjgq/jg6rjg5fjg4hcbiAqIFxuICog5YWo44OG44K544OI44Oi44K444Ol44O844Or44KS57Wx5ZCI44GX44Gm5a6f6KGM44GX44CB5YyF5ous55qE44Gq44Os44Od44O844OI44KS55Sf5oiQXG4gKiBcbiAqIOS9v+eUqOaWueazlTpcbiAqICAgbnBtIHJ1biB0ZXN0OmludGVncmF0aW9uXG4gKiAgIG5vZGUgcnVuLWludGVncmF0aW9uLXRlc3Qtc3VpdGUudHNcbiAqICAgbm9kZSBydW4taW50ZWdyYXRpb24tdGVzdC1zdWl0ZS50cyAtLW1vZGU9cGFyYWxsZWxcbiAqICAgbm9kZSBydW4taW50ZWdyYXRpb24tdGVzdC1zdWl0ZS50cyAtLW1vZHVsZXM9YXV0aCxjaGF0Ym90IC0tZm9ybWF0PWh0bWxcbiAqL1xuXG5pbXBvcnQgeyBJbnRlZ3JhdGlvblRlc3RTdWl0ZSwgRGVmYXVsdEludGVncmF0aW9uVGVzdFN1aXRlQ29uZmlnIH0gZnJvbSAnLi9pbnRlZ3JhdGlvbi10ZXN0LXN1aXRlJztcbmltcG9ydCB7IEludGVncmF0aW9uUmVwb3J0R2VuZXJhdG9yLCBEZWZhdWx0UmVwb3J0Q29uZmlnIH0gZnJvbSAnLi9yZXBvcnRpbmcvaW50ZWdyYXRpb24tcmVwb3J0LWdlbmVyYXRvcic7XG5pbXBvcnQgeyBUZXN0T3JjaGVzdHJhdG9yIH0gZnJvbSAnLi9vcmNoZXN0cmF0aW9uL3Rlc3Qtb3JjaGVzdHJhdG9yJztcblxuLy8g44Kz44Oe44Oz44OJ44Op44Kk44Oz5byV5pWw44Gu6Kej5p6QXG5pbnRlcmZhY2UgQ2xpT3B0aW9ucyB7XG4gIG1vZGU6ICdzZXF1ZW50aWFsJyB8ICdwYXJhbGxlbCcgfCAnaHlicmlkJztcbiAgbW9kdWxlczogc3RyaW5nW107XG4gIGZvcm1hdDogKCdqc29uJyB8ICdodG1sJyB8ICdwZGYnIHwgJ2NzdicpW107XG4gIG91dHB1dDogc3RyaW5nO1xuICB0aW1lb3V0OiBudW1iZXI7XG4gIHJldHJpZXM6IG51bWJlcjtcbiAgc3RvcE9uRmFpbHVyZTogYm9vbGVhbjtcbiAgdmVyYm9zZTogYm9vbGVhbjtcbiAgaGVscDogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiDjg6HjgqTjg7Plrp/ooYzplqLmlbBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbWFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc29sZS5sb2coJ/CfmoAg57Wx5ZCI44OG44K544OI44K544Kk44O844OI5a6f6KGM6ZaL5aeLJyk7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gIFxuICB0cnkge1xuICAgIC8vIOOCs+ODnuODs+ODieODqeOCpOODs+W8leaVsOOBruino+aekFxuICAgIGNvbnN0IG9wdGlvbnMgPSBwYXJzZUNvbW1hbmRMaW5lQXJncygpO1xuICAgIFxuICAgIC8vIOODmOODq+ODl+ihqOekulxuICAgIGlmIChvcHRpb25zLmhlbHApIHtcbiAgICAgIHNob3dIZWxwKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIOioreWumuOBruani+eviVxuICAgIGNvbnN0IGNvbmZpZyA9IGJ1aWxkVGVzdENvbmZpZyhvcHRpb25zKTtcbiAgICBjb25zdCByZXBvcnRDb25maWcgPSBidWlsZFJlcG9ydENvbmZpZyhvcHRpb25zKTtcbiAgICBcbiAgICAvLyDlrp/ooYzliY3jga7mg4XloLHooajnpLpcbiAgICBkaXNwbGF5RXhlY3V0aW9uSW5mbyhjb25maWcsIG9wdGlvbnMpO1xuICAgIFxuICAgIC8vIOe1seWQiOODhuOCueODiOOCueOCpOODvOODiOOBruWIneacn+WMluOBqOWun+ihjFxuICAgIGNvbnN0IHRlc3RTdWl0ZSA9IG5ldyBJbnRlZ3JhdGlvblRlc3RTdWl0ZShjb25maWcpO1xuICAgIGNvbnN0IHRlc3RSZXN1bHRzID0gYXdhaXQgdGVzdFN1aXRlLmV4ZWN1dGUoKTtcbiAgICBcbiAgICAvLyDntZDmnpzjga7ooajnpLpcbiAgICBkaXNwbGF5UmVzdWx0cyh0ZXN0UmVzdWx0cyk7XG4gICAgXG4gICAgLy8g44Os44Od44O844OI55Sf5oiQXG4gICAgY29uc3QgcmVwb3J0R2VuZXJhdG9yID0gbmV3IEludGVncmF0aW9uUmVwb3J0R2VuZXJhdG9yKHJlcG9ydENvbmZpZyk7XG4gICAgY29uc3QgcmVwb3J0RmlsZXMgPSBhd2FpdCByZXBvcnRHZW5lcmF0b3IuZ2VuZXJhdGVSZXBvcnQodGVzdFJlc3VsdHMpO1xuICAgIFxuICAgIC8vIOeUn+aIkOOBleOCjOOBn+ODrOODneODvOODiOODleOCoeOCpOODq+OBruihqOekulxuICAgIGRpc3BsYXlHZW5lcmF0ZWRSZXBvcnRzKHJlcG9ydEZpbGVzKTtcbiAgICBcbiAgICAvLyDntYLkuobjgrPjg7zjg4njga7msbrlrppcbiAgICBjb25zdCBleGl0Q29kZSA9IHRlc3RSZXN1bHRzLm92ZXJhbGwuc3VjY2VzcyA/IDAgOiAxO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gICAgY29uc29sZS5sb2coYOKchSDntbHlkIjjg4bjgrnjg4jjgrnjgqTjg7zjg4jlrp/ooYzlrozkuoYgKOe1guS6huOCs+ODvOODiTogJHtleGl0Q29kZX0pYCk7XG4gICAgXG4gICAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg57Wx5ZCI44OG44K544OI44K544Kk44O844OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICBjb25zb2xlLmVycm9yKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbi8qKlxuICog44Kz44Oe44Oz44OJ44Op44Kk44Oz5byV5pWw44Gu6Kej5p6QXG4gKi9cbmZ1bmN0aW9uIHBhcnNlQ29tbWFuZExpbmVBcmdzKCk6IENsaU9wdGlvbnMge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuICBjb25zdCBvcHRpb25zOiBDbGlPcHRpb25zID0ge1xuICAgIG1vZGU6ICdoeWJyaWQnLFxuICAgIG1vZHVsZXM6IFtdLFxuICAgIGZvcm1hdDogWydqc29uJywgJ2h0bWwnXSxcbiAgICBvdXRwdXQ6ICcuL3Rlc3QtcmVwb3J0cycsXG4gICAgdGltZW91dDogMzAwMDAwLCAvLyA15YiGXG4gICAgcmV0cmllczogMixcbiAgICBzdG9wT25GYWlsdXJlOiBmYWxzZSxcbiAgICB2ZXJib3NlOiBmYWxzZSxcbiAgICBoZWxwOiBmYWxzZVxuICB9O1xuICBcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXTtcbiAgICBcbiAgICBzd2l0Y2ggKGFyZykge1xuICAgICAgY2FzZSAnLS1tb2RlJzpcbiAgICAgIGNhc2UgJy1tJzpcbiAgICAgICAgb3B0aW9ucy5tb2RlID0gYXJnc1srK2ldIGFzIGFueTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAnLS1tb2R1bGVzJzpcbiAgICAgICAgb3B0aW9ucy5tb2R1bGVzID0gYXJnc1srK2ldLnNwbGl0KCcsJykubWFwKG0gPT4gbS50cmltKCkpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICctLWZvcm1hdCc6XG4gICAgICBjYXNlICctZic6XG4gICAgICAgIG9wdGlvbnMuZm9ybWF0ID0gYXJnc1srK2ldLnNwbGl0KCcsJykubWFwKGYgPT4gZi50cmltKCkpIGFzIGFueTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAnLS1vdXRwdXQnOlxuICAgICAgY2FzZSAnLW8nOlxuICAgICAgICBvcHRpb25zLm91dHB1dCA9IGFyZ3NbKytpXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAnLS10aW1lb3V0JzpcbiAgICAgIGNhc2UgJy10JzpcbiAgICAgICAgb3B0aW9ucy50aW1lb3V0ID0gcGFyc2VJbnQoYXJnc1srK2ldLCAxMCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJy0tcmV0cmllcyc6XG4gICAgICBjYXNlICctcic6XG4gICAgICAgIG9wdGlvbnMucmV0cmllcyA9IHBhcnNlSW50KGFyZ3NbKytpXSwgMTApO1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICctLXN0b3Atb24tZmFpbHVyZSc6XG4gICAgICAgIG9wdGlvbnMuc3RvcE9uRmFpbHVyZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJy0tdmVyYm9zZSc6XG4gICAgICBjYXNlICctdic6XG4gICAgICAgIG9wdGlvbnMudmVyYm9zZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJy0taGVscCc6XG4gICAgICBjYXNlICctaCc6XG4gICAgICAgIG9wdGlvbnMuaGVscCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChhcmcuc3RhcnRzV2l0aCgnLS0nKSkge1xuICAgICAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPICDmnKrnn6Xjga7jgqrjg5fjgrfjg6fjg7M6ICR7YXJnfWApO1xuICAgICAgICB9XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gb3B0aW9ucztcbn1cblxuLyoqXG4gKiDjg4bjgrnjg4joqK3lrprjga7mp4vnr4lcbiAqL1xuZnVuY3Rpb24gYnVpbGRUZXN0Q29uZmlnKG9wdGlvbnM6IENsaU9wdGlvbnMpOiBhbnkge1xuICBjb25zdCBjb25maWcgPSB7IC4uLkRlZmF1bHRJbnRlZ3JhdGlvblRlc3RTdWl0ZUNvbmZpZyB9O1xuICBcbiAgLy8g5a6f6KGM44Oi44O844OJ44Gu6Kit5a6aXG4gIGNvbmZpZy5leGVjdXRpb25Nb2RlID0gb3B0aW9ucy5tb2RlO1xuICBcbiAgLy8g44Oi44K444Ol44O844Or6YG45oqe44Gu6Kit5a6aXG4gIGlmIChvcHRpb25zLm1vZHVsZXMubGVuZ3RoID4gMCkge1xuICAgIC8vIOWFqOODouOCuOODpeODvOODq+OCkueEoeWKueWMllxuICAgIE9iamVjdC5rZXlzKGNvbmZpZy5lbmFibGVkTW9kdWxlcykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgY29uZmlnLmVuYWJsZWRNb2R1bGVzW2tleSBhcyBrZXlvZiB0eXBlb2YgY29uZmlnLmVuYWJsZWRNb2R1bGVzXSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIOaMh+WumuOBleOCjOOBn+ODouOCuOODpeODvOODq+OBruOBv+acieWKueWMllxuICAgIGZvciAoY29uc3QgbW9kdWxlTmFtZSBvZiBvcHRpb25zLm1vZHVsZXMpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWROYW1lID0gbm9ybWFsaXplTW9kdWxlTmFtZShtb2R1bGVOYW1lKTtcbiAgICAgIGlmIChub3JtYWxpemVkTmFtZSBpbiBjb25maWcuZW5hYmxlZE1vZHVsZXMpIHtcbiAgICAgICAgY29uZmlnLmVuYWJsZWRNb2R1bGVzW25vcm1hbGl6ZWROYW1lIGFzIGtleW9mIHR5cGVvZiBjb25maWcuZW5hYmxlZE1vZHVsZXNdID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPICDmnKrnn6Xjga7jg6Ljgrjjg6Xjg7zjg6s6ICR7bW9kdWxlTmFtZX1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIC8vIOWun+ihjOWItuW+oeOBruioreWumlxuICBjb25maWcuZXhlY3V0aW9uLnRpbWVvdXRQZXJNb2R1bGUgPSBvcHRpb25zLnRpbWVvdXQ7XG4gIGNvbmZpZy5leGVjdXRpb24ucmV0cnlBdHRlbXB0cyA9IG9wdGlvbnMucmV0cmllcztcbiAgY29uZmlnLmV4ZWN1dGlvbi5zdG9wT25GaXJzdEZhaWx1cmUgPSBvcHRpb25zLnN0b3BPbkZhaWx1cmU7XG4gIFxuICAvLyDoqbPntLDjg63jgrDjga7oqK3lrppcbiAgaWYgKG9wdGlvbnMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUubG9nKCfwn5SnIOips+e0sOODreOCsOODouODvOODieOBjOacieWKueOBp+OBmScpO1xuICB9XG4gIFxuICByZXR1cm4gY29uZmlnO1xufVxuXG4vKipcbiAqIOODrOODneODvOODiOioreWumuOBruani+eviVxuICovXG5mdW5jdGlvbiBidWlsZFJlcG9ydENvbmZpZyhvcHRpb25zOiBDbGlPcHRpb25zKTogYW55IHtcbiAgY29uc3QgY29uZmlnID0geyAuLi5EZWZhdWx0UmVwb3J0Q29uZmlnIH07XG4gIFxuICAvLyDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjga7oqK3lrppcbiAgY29uZmlnLm91dHB1dERpcmVjdG9yeSA9IG9wdGlvbnMub3V0cHV0O1xuICBcbiAgLy8g5Ye65Yqb5b2i5byP44Gu6Kit5a6aXG4gIGNvbmZpZy5mb3JtYXRzID0gb3B0aW9ucy5mb3JtYXQ7XG4gIFxuICAvLyDoqbPntLDjg63jgrDjga7oqK3lrppcbiAgY29uZmlnLmluY2x1ZGVEZXRhaWxlZExvZ3MgPSBvcHRpb25zLnZlcmJvc2U7XG4gIFxuICByZXR1cm4gY29uZmlnO1xufVxuXG4vKipcbiAqIOODouOCuOODpeODvOODq+WQjeOBruato+imj+WMllxuICovXG5mdW5jdGlvbiBub3JtYWxpemVNb2R1bGVOYW1lKG1vZHVsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG1vZHVsZU1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcbiAgICAnYXV0aCc6ICdhdXRoZW50aWNhdGlvbicsXG4gICAgJ2FjY2Vzcyc6ICdhY2Nlc3NDb250cm9sJyxcbiAgICAnY2hhdCc6ICdjaGF0Ym90JyxcbiAgICAncGVyZic6ICdwZXJmb3JtYW5jZScsXG4gICAgJ3VpJzogJ3VpVXgnLFxuICAgICd1eCc6ICd1aVV4JyxcbiAgICAnc2VjJzogJ3NlY3VyaXR5JyxcbiAgICAnaW50ZWdyYXRpb24nOiAnaW50ZWdyYXRpb24nXG4gIH07XG4gIFxuICByZXR1cm4gbW9kdWxlTWFwW21vZHVsZU5hbWUudG9Mb3dlckNhc2UoKV0gfHwgbW9kdWxlTmFtZTtcbn1cblxuLyoqXG4gKiDlrp/ooYzmg4XloLHjga7ooajnpLpcbiAqL1xuZnVuY3Rpb24gZGlzcGxheUV4ZWN1dGlvbkluZm8oY29uZmlnOiBhbnksIG9wdGlvbnM6IENsaU9wdGlvbnMpOiB2b2lkIHtcbiAgY29uc29sZS5sb2coJ/Cfk4sg5a6f6KGM6Kit5a6aOicpO1xuICBjb25zb2xlLmxvZyhgICAg5a6f6KGM44Oi44O844OJOiAke2NvbmZpZy5leGVjdXRpb25Nb2RlfWApO1xuICBjb25zb2xlLmxvZyhgICAg5pyJ5Yq544Oi44K444Ol44O844OrOiAke09iamVjdC5lbnRyaWVzKGNvbmZpZy5lbmFibGVkTW9kdWxlcylcbiAgICAuZmlsdGVyKChbXywgZW5hYmxlZF0pID0+IGVuYWJsZWQpXG4gICAgLm1hcCgoW25hbWUsIF9dKSA9PiBuYW1lKVxuICAgIC5qb2luKCcsICcpfWApO1xuICBjb25zb2xlLmxvZyhgICAg44K/44Kk44Og44Ki44Km44OIOiAke2NvbmZpZy5leGVjdXRpb24udGltZW91dFBlck1vZHVsZX1tc2ApO1xuICBjb25zb2xlLmxvZyhgICAg44Oq44OI44Op44Kk5Zue5pWwOiAke2NvbmZpZy5leGVjdXRpb24ucmV0cnlBdHRlbXB0c31gKTtcbiAgY29uc29sZS5sb2coYCAgIOWkseaVl+aZguWBnOatojogJHtjb25maWcuZXhlY3V0aW9uLnN0b3BPbkZpcnN0RmFpbHVyZSA/ICfjga/jgYQnIDogJ+OBhOOBhOOBiCd9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDlh7rlipvlvaLlvI86ICR7b3B0aW9ucy5mb3JtYXQuam9pbignLCAnKX1gKTtcbiAgY29uc29sZS5sb2coYCAgIOWHuuWKm+WFiDogJHtvcHRpb25zLm91dHB1dH1gKTtcbiAgY29uc29sZS5sb2coJycpO1xufVxuXG4vKipcbiAqIOe1kOaenOOBruihqOekulxuICovXG5mdW5jdGlvbiBkaXNwbGF5UmVzdWx0cyh0ZXN0UmVzdWx0czogYW55KTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJ/Cfk4og44OG44K544OI5a6f6KGM57WQ5p6cOicpO1xuICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuICBcbiAgLy8g5YWo5L2T57WQ5p6cXG4gIGNvbnN0IG92ZXJhbGwgPSB0ZXN0UmVzdWx0cy5vdmVyYWxsO1xuICBjb25zdCBzdGF0dXNJY29uID0gb3ZlcmFsbC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJztcbiAgY29uc3Qgc3RhdHVzVGV4dCA9IG92ZXJhbGwuc3VjY2VzcyA/ICdTVUNDRVNTJyA6ICdGQUlMVVJFJztcbiAgXG4gIGNvbnNvbGUubG9nKGAke3N0YXR1c0ljb259IOWFqOS9k+OCueODhuODvOOCv+OCuTogJHtzdGF0dXNUZXh0fWApO1xuICBjb25zb2xlLmxvZyhg8J+TiCDlk4Hos6rjgrnjgrPjgqI6ICR7b3ZlcmFsbC5xdWFsaXR5U2NvcmUudG9GaXhlZCgxKX0lYCk7XG4gIGNvbnNvbGUubG9nKGDwn6eqIOe3j+ODhuOCueODiOaVsDogJHtvdmVyYWxsLnRvdGFsVGVzdHN9YCk7XG4gIGNvbnNvbGUubG9nKGDinIUg5oiQ5YqfOiAke292ZXJhbGwucGFzc2VkVGVzdHN9YCk7XG4gIGNvbnNvbGUubG9nKGDinYwg5aSx5pWXOiAke292ZXJhbGwuZmFpbGVkVGVzdHN9YCk7XG4gIGNvbnNvbGUubG9nKGDij63vuI8gIOOCueOCreODg+ODlzogJHtvdmVyYWxsLnNraXBwZWRUZXN0c31gKTtcbiAgY29uc29sZS5sb2coYOKPse+4jyAg5a6f6KGM5pmC6ZaTOiAkeyhvdmVyYWxsLmV4ZWN1dGlvblRpbWUgLyAxMDAwKS50b0ZpeGVkKDIpfeenkmApO1xuICBcbiAgLy8g44Oi44K444Ol44O844Or5Yil57WQ5p6cXG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJ/Cfk4sg44Oi44K444Ol44O844Or5Yil57WQ5p6cOicpO1xuICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICBcbiAgZm9yIChjb25zdCBbbW9kdWxlTmFtZSwgbW9kdWxlUmVzdWx0XSBvZiBPYmplY3QuZW50cmllcyh0ZXN0UmVzdWx0cy5tb2R1bGVzKSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IG1vZHVsZVJlc3VsdCBhcyBhbnk7XG4gICAgY29uc3QgbW9kdWxlSWNvbiA9IHJlc3VsdC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJztcbiAgICBjb25zdCBkdXJhdGlvbiA9ICgocmVzdWx0LmR1cmF0aW9uIHx8IDApIC8gMTAwMCkudG9GaXhlZCgyKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgJHttb2R1bGVJY29ufSAke21vZHVsZU5hbWV9OiAke3Jlc3VsdC5zdWNjZXNzID8gJ1NVQ0NFU1MnIDogJ0ZBSUxVUkUnfSAoJHtkdXJhdGlvbn1zKWApO1xuICAgIFxuICAgIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDjgqjjg6njg7w6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgIH1cbiAgICBcbiAgICBpZiAocmVzdWx0Lm1ldHJpY3MpIHtcbiAgICAgIGRpc3BsYXlNb2R1bGVNZXRyaWNzKG1vZHVsZU5hbWUsIHJlc3VsdC5tZXRyaWNzKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIOWIhuaekOe1kOaenFxuICBpZiAodGVzdFJlc3VsdHMuYW5hbHlzaXMpIHtcbiAgICBkaXNwbGF5QW5hbHlzaXNSZXN1bHRzKHRlc3RSZXN1bHRzLmFuYWx5c2lzKTtcbiAgfVxufVxuXG4vKipcbiAqIOODouOCuOODpeODvOODq+ODoeODiOODquOCr+OCueOBruihqOekulxuICovXG5mdW5jdGlvbiBkaXNwbGF5TW9kdWxlTWV0cmljcyhtb2R1bGVOYW1lOiBzdHJpbmcsIG1ldHJpY3M6IGFueSk6IHZvaWQge1xuICBzd2l0Y2ggKG1vZHVsZU5hbWUpIHtcbiAgICBjYXNlICdwZXJmb3JtYW5jZSc6XG4gICAgICBpZiAobWV0cmljcy5yZXNwb25zZVRpbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOW5s+Wdh+W/nOetlOaZgumWkzogJHttZXRyaWNzLnJlc3BvbnNlVGltZX1tc2ApO1xuICAgICAgfVxuICAgICAgaWYgKG1ldHJpY3MudGhyb3VnaHB1dCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg44K544Or44O844OX44OD44OIOiAke21ldHJpY3MudGhyb3VnaHB1dH0gcmVxL3NgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgXG4gICAgY2FzZSAnc2VjdXJpdHknOlxuICAgICAgaWYgKG1ldHJpY3Muc2VjdXJpdHlTY29yZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg44K744Kt44Ol44Oq44OG44Kj44K544Kz44KiOiAke21ldHJpY3Muc2VjdXJpdHlTY29yZX0lYCk7XG4gICAgICB9XG4gICAgICBpZiAobWV0cmljcy52dWxuZXJhYmlsaXRpZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOiEhuW8seaApzogJHttZXRyaWNzLnZ1bG5lcmFiaWxpdGllc33ku7ZgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgICAgXG4gICAgY2FzZSAndWlVeCc6XG4gICAgICBpZiAobWV0cmljcy5hY2Nlc3NpYmlsaXR5U2NvcmUpIHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOOCouOCr+OCu+OCt+ODk+ODquODhuOCo+OCueOCs+OCojogJHttZXRyaWNzLmFjY2Vzc2liaWxpdHlTY29yZX0lYCk7XG4gICAgICB9XG4gICAgICBpZiAobWV0cmljcy51c2FiaWxpdHlTY29yZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg44Om44O844K244OT44Oq44OG44Kj44K544Kz44KiOiAke21ldHJpY3MudXNhYmlsaXR5U2NvcmV9JWApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuLyoqXG4gKiDliIbmnpDntZDmnpzjga7ooajnpLpcbiAqL1xuZnVuY3Rpb24gZGlzcGxheUFuYWx5c2lzUmVzdWx0cyhhbmFseXNpczogYW55KTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJ/CflI0g5YiG5p6Q57WQ5p6cOicpO1xuICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICBcbiAgLy8g6YeN6KaB44Gq5ZWP6aGMXG4gIGlmIChhbmFseXNpcy5jcml0aWNhbElzc3VlcyAmJiBhbmFseXNpcy5jcml0aWNhbElzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc29sZS5sb2coJ/Cfmqgg6YeN6KaB44Gq5ZWP6aGMOicpO1xuICAgIGZvciAoY29uc3QgaXNzdWUgb2YgYW5hbHlzaXMuY3JpdGljYWxJc3N1ZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDigKIgJHtpc3N1ZX1gKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIOaOqOWlqOS6i+mghVxuICBpZiAoYW5hbHlzaXMucmVjb21tZW5kYXRpb25zICYmIGFuYWx5c2lzLnJlY29tbWVuZGF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgY29uc29sZS5sb2coJ/CfkqEg5o6o5aWo5LqL6aCFOicpO1xuICAgIGZvciAoY29uc3QgcmVjb21tZW5kYXRpb24gb2YgYW5hbHlzaXMucmVjb21tZW5kYXRpb25zLnNsaWNlKDAsIDMpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgICAg4oCiICR7cmVjb21tZW5kYXRpb259YCk7XG4gICAgfVxuICB9XG4gIFxuICAvLyDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg5zjg4jjg6vjg43jg4Pjgq9cbiAgaWYgKGFuYWx5c2lzLnBlcmZvcm1hbmNlQm90dGxlbmVja3MgJiYgYW5hbHlzaXMucGVyZm9ybWFuY2VCb3R0bGVuZWNrcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc29sZS5sb2coJ+KaoSDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg5zjg4jjg6vjg43jg4Pjgq86Jyk7XG4gICAgZm9yIChjb25zdCBib3R0bGVuZWNrIG9mIGFuYWx5c2lzLnBlcmZvcm1hbmNlQm90dGxlbmVja3MpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDigKIgJHtib3R0bGVuZWNrfWApO1xuICAgIH1cbiAgfVxuICBcbiAgLy8g44K744Kt44Ol44Oq44OG44Kj5oe45b+1XG4gIGlmIChhbmFseXNpcy5zZWN1cml0eUNvbmNlcm5zICYmIGFuYWx5c2lzLnNlY3VyaXR5Q29uY2VybnMubGVuZ3RoID4gMCkge1xuICAgIGNvbnNvbGUubG9nKCfwn5SSIOOCu+OCreODpeODquODhuOCo+aHuOW/tTonKTtcbiAgICBmb3IgKGNvbnN0IGNvbmNlcm4gb2YgYW5hbHlzaXMuc2VjdXJpdHlDb25jZXJucykge1xuICAgICAgY29uc29sZS5sb2coYCAgIOKAoiAke2NvbmNlcm59YCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICog55Sf5oiQ44GV44KM44Gf44Os44Od44O844OI44OV44Kh44Kk44Or44Gu6KGo56S6XG4gKi9cbmZ1bmN0aW9uIGRpc3BsYXlHZW5lcmF0ZWRSZXBvcnRzKHJlcG9ydEZpbGVzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCfwn5OEIOeUn+aIkOOBleOCjOOBn+ODrOODneODvOODiDonKTtcbiAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgXG4gIGZvciAoY29uc3QgZmlsZVBhdGggb2YgcmVwb3J0RmlsZXMpIHtcbiAgICBjb25zb2xlLmxvZyhg8J+TiyAke2ZpbGVQYXRofWApO1xuICB9XG4gIFxuICBpZiAocmVwb3J0RmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc29sZS5sb2coJ+KaoO+4jyAg44Os44Od44O844OI44OV44Kh44Kk44Or44GM55Sf5oiQ44GV44KM44G+44Gb44KT44Gn44GX44GfJyk7XG4gIH1cbn1cblxuLyoqXG4gKiDjg5jjg6vjg5fjga7ooajnpLpcbiAqL1xuZnVuY3Rpb24gc2hvd0hlbHAoKTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKGBcbue1seWQiOODhuOCueODiOOCueOCpOODvOODiOWun+ihjOOCueOCr+ODquODl+ODiFxuXG7kvb/nlKjmlrnms5U6XG4gIG5vZGUgcnVuLWludGVncmF0aW9uLXRlc3Qtc3VpdGUudHMgW+OCquODl+OCt+ODp+ODs11cblxu44Kq44OX44K344On44OzOlxuICAtbSwgLS1tb2RlIDxtb2RlPiAgICAgICAgICAg5a6f6KGM44Oi44O844OJIChzZXF1ZW50aWFsfHBhcmFsbGVsfGh5YnJpZCkgW2RlZmF1bHQ6IGh5YnJpZF1cbiAgLS1tb2R1bGVzIDxtb2R1bGVzPiAgICAgICAgIOWun+ihjOOBmeOCi+ODouOCuOODpeODvOODqyAo44Kr44Oz44Oe5Yy65YiH44KKKVxuICAtZiwgLS1mb3JtYXQgPGZvcm1hdHM+ICAgICAg44Os44Od44O844OI5b2i5byPIChqc29ufGh0bWx8cGRmfGNzdikgW2RlZmF1bHQ6IGpzb24saHRtbF1cbiAgLW8sIC0tb3V0cHV0IDxkaXJlY3Rvcnk+ICAgIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODqiBbZGVmYXVsdDogLi90ZXN0LXJlcG9ydHNdXG4gIC10LCAtLXRpbWVvdXQgPG1zPiAgICAgICAgICDjg6Ljgrjjg6Xjg7zjg6vliKXjgr/jgqTjg6DjgqLjgqbjg4ggW2RlZmF1bHQ6IDMwMDAwMF1cbiAgLXIsIC0tcmV0cmllcyA8Y291bnQ+ICAgICAgIOODquODiOODqeOCpOWbnuaVsCBbZGVmYXVsdDogMl1cbiAgLS1zdG9wLW9uLWZhaWx1cmUgICAgICAgICAg5pyA5Yid44Gu5aSx5pWX44Gn5YGc5q2iXG4gIC12LCAtLXZlcmJvc2UgICAgICAgICAgICAgIOips+e0sOODreOCsOWHuuWKm1xuICAtaCwgLS1oZWxwICAgICAgICAgICAgICAgICDjgZPjga7jg5jjg6vjg5fjgpLooajnpLpcblxu44Oi44K444Ol44O844Or5ZCNOlxuICBhdXRoZW50aWNhdGlvbiAoYXV0aCkgICAgICAg6KqN6Ki844OG44K544OIXG4gIGFjY2Vzc0NvbnRyb2wgKGFjY2VzcykgICAgICDjgqLjgq/jgrvjgrnliLblvqHjg4bjgrnjg4hcbiAgY2hhdGJvdCAoY2hhdCkgICAgICAgICAgICAg44OB44Oj44OD44OI44Oc44OD44OI44OG44K544OIXG4gIHBlcmZvcm1hbmNlIChwZXJmKSAgICAgICAgIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiFxuICB1aVV4ICh1aSwgdXgpICAgICAgICAgICAgIFVJL1VY44OG44K544OIXG4gIHNlY3VyaXR5IChzZWMpICAgICAgICAgICAgIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiFxuICBpbnRlZ3JhdGlvbiAgICAgICAgICAgICAgICDntbHlkIjjg4bjgrnjg4hcblxu5L2/55So5L6LOlxuICAjIOWFqOODouOCuOODpeODvOODq+OCkuODj+OCpOODluODquODg+ODieODouODvOODieOBp+Wun+ihjFxuICBub2RlIHJ1bi1pbnRlZ3JhdGlvbi10ZXN0LXN1aXRlLnRzXG5cbiAgIyDoqo3oqLzjgajjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jjga7jgb/jgpLkuKbliJflrp/ooYxcbiAgbm9kZSBydW4taW50ZWdyYXRpb24tdGVzdC1zdWl0ZS50cyAtLW1vZGU9cGFyYWxsZWwgLS1tb2R1bGVzPWF1dGgsY2hhdGJvdFxuXG4gICMgSFRNTOODrOODneODvOODiOOBruOBv+eUn+aIkFxuICBub2RlIHJ1bi1pbnRlZ3JhdGlvbi10ZXN0LXN1aXRlLnRzIC0tZm9ybWF0PWh0bWxcblxuICAjIOips+e0sOODreOCsOS7mOOBjeOBp+Wun+ihjFxuICBub2RlIHJ1bi1pbnRlZ3JhdGlvbi10ZXN0LXN1aXRlLnRzIC0tdmVyYm9zZVxuXG4gICMg5aSx5pWX5pmC44Gr5Y2z5bqn5YGc5q2iXG4gIG5vZGUgcnVuLWludGVncmF0aW9uLXRlc3Qtc3VpdGUudHMgLS1zdG9wLW9uLWZhaWx1cmVcbmApO1xufVxuXG4vKipcbiAqIOacquWHpueQhuS+i+WkluOBruODj+ODs+ODieODquODs+OCsFxuICovXG5wcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uLCBwcm9taXNlKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoJ+KdjCDmnKrlh6bnkIbjga5Qcm9taXNl5ouS5ZCmOicsIHJlYXNvbik7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn0pO1xuXG5wcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKCfinYwg5pyq5Yem55CG44Gu5L6L5aSWOicsIGVycm9yKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufSk7XG5cbi8vIEN0cmwrQ+OBp+OBruS4reaWreWHpueQhlxucHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnXFxu8J+bkSDjg4bjgrnjg4jlrp/ooYzjgYzkuK3mlq3jgZXjgozjgb7jgZfjgZ8nKTtcbiAgcHJvY2Vzcy5leGl0KDEzMCk7XG59KTtcblxuLy8g44Oh44Kk44Oz6Zai5pWw44Gu5a6f6KGMXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbigpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDkuojmnJ/jgZfjgarjgYTjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSk7XG59XG5cbmV4cG9ydCB7IG1haW4gfTsiXX0=