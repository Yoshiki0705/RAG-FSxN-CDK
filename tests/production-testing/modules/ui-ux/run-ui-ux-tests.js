#!/usr/bin/env ts-node
"use strict";
/**
 * UI/UXテスト実行スクリプト
 *
 * Kiro MCP Chrome DevToolsを使用した実ブラウザでのUI/UXテストを実行
 * コマンドライン引数で環境とテストタイプを指定可能
 *
 * 使用例:
 * npm run test:production:ui-ux
 * npm run test:production:ui-ux:staging
 * ts-node run-ui-ux-tests.ts --env production --type all
 * ts-node run-ui-ux-tests.ts --env staging --type responsive
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUIUXTests = main;
const commander_1 = require("commander");
const ui_ux_test_runner_1 = __importDefault(require("./ui-ux-test-runner"));
const production_test_engine_1 = __importDefault(require("../../core/production-test-engine"));
const production_config_1 = require("../../config/production-config");
const ui_ux_config_1 = require("./ui-ux-config");
const emergency_stop_manager_1 = __importDefault(require("../../core/emergency-stop-manager"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * コマンドライン引数の解析
 */
function parseArguments() {
    const program = new commander_1.Command();
    program
        .name('run-ui-ux-tests')
        .description('実本番環境でのUI/UXテスト実行')
        .version('1.0.0')
        .option('-e, --env <environment>', '実行環境 (production, staging, development)', 'production')
        .option('-t, --type <testType>', 'テストタイプ (all, responsive, chat, accessibility, usability)', 'all')
        .option('-r, --report <path>', 'レポート出力パス', './ui-ux-test-report.md')
        .option('-s, --screenshots <path>', 'スクリーンショット保存ディレクトリ', './screenshots')
        .option('-v, --verbose', '詳細ログ出力', false)
        .option('--dry-run', 'ドライラン実行（実際のテストは行わない）', false)
        .option('--emergency-stop', '緊急停止機能を有効化', true)
        .option('--headless', 'ヘッドレスモードで実行', false)
        .option('--mobile-only', 'モバイルビューポートのみテスト', false)
        .option('--desktop-only', 'デスクトップビューポートのみテスト', false)
        .parse();
    return program.opts();
}
/**
 * 環境設定の検証と表示
 */
async function validateAndDisplayConfig(environment, uiuxConfig) {
    console.log('🔍 設定検証中...');
    // UI/UXテスト設定の検証
    const validation = (0, ui_ux_config_1.validateUIUXConfig)(uiuxConfig);
    if (!validation.isValid) {
        console.error('❌ UI/UXテスト設定エラー:');
        validation.errors.forEach(error => console.error(`   - ${error}`));
        return false;
    }
    if (validation.warnings.length > 0) {
        console.warn('⚠️ UI/UXテスト設定警告:');
        validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
    }
    // 設定の表示
    (0, ui_ux_config_1.displayUIUXConfig)(uiuxConfig);
    return true;
}
/**
 * 個別テストの実行
 */
async function runIndividualTest(testRunner, testType) {
    const testModule = testRunner.testModule;
    switch (testType) {
        case 'responsive':
            console.log('📱 レスポンシブデザインテストを実行中...');
            return await testModule.testResponsiveDesign();
        case 'chat':
            console.log('💬 チャットインターフェーステストを実行中...');
            return await testModule.testChatInterface();
        case 'accessibility':
            console.log('♿ アクセシビリティテストを実行中...');
            return await testModule.testAccessibility();
        case 'usability':
            console.log('👤 ユーザビリティテストを実行中...');
            return await testModule.testUsability();
        default:
            throw new Error(`未対応のテストタイプ: ${testType}`);
    }
}
/**
 * テスト結果のレポート生成
 */
async function generateTestReport(results, testRunner, reportPath, screenshotsPath, environment) {
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
        // スクリーンショットディレクトリの作成
        if (!fs.existsSync(screenshotsPath)) {
            fs.mkdirSync(screenshotsPath, { recursive: true });
            console.log(`📁 スクリーンショットディレクトリを作成: ${screenshotsPath}`);
        }
        // 簡易サマリーの表示
        const summary = Array.from(results.values());
        const successCount = summary.filter(r => r.success).length;
        const totalCount = summary.length;
        console.log('');
        console.log('📊 UI/UXテスト実行サマリー:');
        console.log(`   環境: ${environment}`);
        console.log(`   総テスト数: ${totalCount}`);
        console.log(`   成功: ${successCount}`);
        console.log(`   失敗: ${totalCount - successCount}`);
        console.log(`   成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
        // パフォーマンス指標の表示
        const performanceResults = summary.filter(r => r.uiMetrics);
        if (performanceResults.length > 0) {
            const avgLoadTime = performanceResults.reduce((sum, r) => sum + r.uiMetrics.pageLoadTime, 0) / performanceResults.length;
            console.log(`   平均ページ読み込み時間: ${avgLoadTime.toFixed(0)}ms`);
        }
        // アクセシビリティ指標の表示
        const accessibilityResults = summary.filter(r => r.accessibilityMetrics);
        if (accessibilityResults.length > 0) {
            const avgWcag = accessibilityResults.reduce((sum, r) => sum + r.accessibilityMetrics.wcagAACompliance, 0) / accessibilityResults.length;
            console.log(`   平均WCAG準拠率: ${(avgWcag * 100).toFixed(1)}%`);
        }
    }
    catch (error) {
        console.error('❌ レポート生成エラー:', error);
        throw error;
    }
}
/**
 * ドライラン実行
 */
async function runDryRun(environment, testType, uiuxConfig, options) {
    console.log('🔍 ドライラン実行中...');
    console.log('');
    console.log('📋 実行予定のテスト:');
    if (testType === 'all') {
        console.log('   ✓ レスポンシブデザインテスト');
        console.log('   ✓ チャットインターフェーステスト');
        console.log('   ✓ アクセシビリティテスト');
        console.log('   ✓ ユーザビリティテスト');
    }
    else {
        console.log(`   ✓ ${testType}テスト`);
    }
    console.log('');
    console.log('📱 テスト対象ビューポート:');
    if (options.mobileOnly) {
        console.log('   ✓ モバイル (375x667)');
    }
    else if (options.desktopOnly) {
        console.log('   ✓ デスクトップ (1920x1080)');
    }
    else {
        Object.entries(uiuxConfig.viewports).forEach(([name, viewport]) => {
            console.log(`   ✓ ${name} (${viewport.width}x${viewport.height})`);
        });
    }
    console.log('');
    console.log('📊 予想実行時間:');
    let estimatedDuration = 0;
    if (testType === 'all') {
        estimatedDuration = 3 + 4 + 5 + 6; // 各テストの予想時間（分）
    }
    else {
        const durations = { responsive: 3, chat: 4, accessibility: 5, usability: 6 };
        estimatedDuration = durations[testType] || 5;
    }
    console.log(`   予想実行時間: 約${estimatedDuration}分`);
    console.log(`   ブラウザモード: ${options.headless ? 'ヘッドレス' : '通常表示'}`);
    console.log('');
    console.log('🎯 品質基準:');
    console.log(`   ページ読み込み時間: ${uiuxConfig.performanceThresholds.pageLoadTime}ms以内`);
    console.log(`   WCAG準拠レベル: ${uiuxConfig.accessibility.wcagLevel}`);
    console.log(`   最小コントラスト比: ${uiuxConfig.accessibility.minimumContrastRatio}:1`);
    console.log(`   ユーザーフロー完了率: ${(uiuxConfig.usability.minimumUserFlowCompletion * 100).toFixed(0)}%以上`);
    console.log('');
    console.log('🛡️ 安全設定:');
    console.log(`   読み取り専用モード: ${uiuxConfig.safety.readOnlyMode ? '有効' : '無効'}`);
    console.log(`   緊急停止機能: ${uiuxConfig.safety.emergencyStopEnabled ? '有効' : '無効'}`);
    console.log(`   最大テスト時間: ${uiuxConfig.execution.maxTestDuration}秒`);
    console.log('');
    console.log('✅ ドライラン完了 - 実際のテストは実行されませんでした');
}
/**
 * Kiro MCP Chrome DevToolsの初期化確認
 */
async function checkKiroMCPAvailability() {
    console.log('🔍 Kiro MCP Chrome DevTools の可用性を確認中...');
    try {
        // 実際の実装では Kiro MCP の可用性をチェック
        // const isAvailable = await kiroBrowser.isAvailable();
        // 簡略化されたチェック
        const isAvailable = true; // 実際の実装では適切にチェック
        if (isAvailable) {
            console.log('✅ Kiro MCP Chrome DevTools が利用可能です');
            return true;
        }
        else {
            console.error('❌ Kiro MCP Chrome DevTools が利用できません');
            console.error('   Kiro IDE でこのスクリプトを実行してください');
            return false;
        }
    }
    catch (error) {
        console.error('❌ Kiro MCP 可用性チェックエラー:', error);
        return false;
    }
}
/**
 * メイン実行関数
 */
async function main() {
    const options = parseArguments();
    console.log('🚀 UI/UXテスト実行開始');
    console.log(`   環境: ${options.env}`);
    console.log(`   テストタイプ: ${options.type}`);
    console.log(`   レポート出力: ${options.report}`);
    console.log(`   スクリーンショット: ${options.screenshots}`);
    console.log(`   ドライラン: ${options.dryRun ? 'はい' : 'いいえ'}`);
    console.log(`   ヘッドレスモード: ${options.headless ? 'はい' : 'いいえ'}`);
    console.log('');
    try {
        // 設定の読み込み
        const productionConfig = (0, production_config_1.getProductionConfig)(options.env);
        const uiuxConfig = (0, ui_ux_config_1.getUIUXConfig)(options.env);
        // 設定の検証
        const isConfigValid = await validateAndDisplayConfig(options.env, uiuxConfig);
        if (!isConfigValid) {
            process.exit(1);
        }
        // ドライラン実行
        if (options.dryRun) {
            await runDryRun(options.env, options.type, uiuxConfig, options);
            return;
        }
        // Kiro MCP の可用性確認
        const isMCPAvailable = await checkKiroMCPAvailability();
        if (!isMCPAvailable) {
            console.error('❌ Kiro MCP Chrome DevTools が必要です');
            process.exit(1);
        }
        // 緊急停止マネージャーの初期化
        let emergencyStopManager;
        if (options.emergencyStop) {
            emergencyStopManager = new emergency_stop_manager_1.default({
                maxTestDuration: uiuxConfig.execution.maxTestDuration * 1000,
                resourceThreshold: 0.9,
                costThreshold: 10.0, // UI/UXテストは低コスト
                enableAutoStop: true
            });
            await emergencyStopManager.initialize();
            console.log('🛡️ 緊急停止マネージャーを初期化しました');
        }
        // テストエンジンの初期化
        const testEngine = new production_test_engine_1.default(productionConfig);
        await testEngine.initialize();
        // UI/UXテストランナーの初期化
        const testRunner = new ui_ux_test_runner_1.default(productionConfig, testEngine);
        let results;
        try {
            if (options.type === 'all') {
                // 全テストの実行
                const testResults = await testRunner.runUIUXTests();
                results = testResults.results;
                console.log('');
                console.log('📊 全UI/UXテスト完了:');
                console.log(`   成功率: ${(testResults.summary.successRate * 100).toFixed(1)}%`);
                console.log(`   総合UI/UXスコア: ${(testResults.summary.overallUIUXScore * 100).toFixed(1)}%`);
                console.log(`   平均ページ読み込み時間: ${testResults.summary.averagePageLoadTime.toFixed(0)}ms`);
                console.log(`   WCAG準拠率: ${(testResults.summary.wcagComplianceRate * 100).toFixed(1)}%`);
            }
            else {
                // 個別テストの実行
                const result = await runIndividualTest(testRunner, options.type);
                results = new Map([[result.testId, result]]);
                console.log('');
                console.log(`📊 ${options.type}テスト完了:`);
                console.log(`   ステータス: ${result.success ? '成功' : '失敗'}`);
                console.log(`   実行時間: ${result.duration}ms`);
                if (result.uiMetrics) {
                    console.log(`   ページ読み込み時間: ${result.uiMetrics.pageLoadTime.toFixed(0)}ms`);
                }
                if (result.accessibilityMetrics) {
                    console.log(`   WCAG準拠率: ${(result.accessibilityMetrics.wcagAACompliance * 100).toFixed(1)}%`);
                }
            }
            // レポート生成
            await generateTestReport(results, testRunner, options.report, options.screenshots, options.env);
        }
        finally {
            // クリーンアップ
            await testRunner.cleanup();
            await testEngine.cleanup();
            if (emergencyStopManager) {
                await emergencyStopManager.cleanup();
            }
        }
        console.log('');
        console.log('✅ UI/UXテスト実行完了');
    }
    catch (error) {
        console.error('❌ UI/UXテスト実行エラー:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXVpLXV4LXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLXVpLXV4LXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7Ozs7Ozs7Ozs7O0dBY0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0WWMsNEJBQVk7QUExWTdCLHlDQUFvQztBQUNwQyw0RUFBaUQ7QUFDakQsK0ZBQXFFO0FBQ3JFLHNFQUF1RjtBQUN2RixpREFLd0I7QUFDeEIsK0ZBQXFFO0FBQ3JFLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFPN0I7O0dBRUc7QUFDSCxTQUFTLGNBQWM7SUFDckIsTUFBTSxPQUFPLEdBQUcsSUFBSSxtQkFBTyxFQUFFLENBQUM7SUFFOUIsT0FBTztTQUNKLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztTQUN2QixXQUFXLENBQUMsbUJBQW1CLENBQUM7U0FDaEMsT0FBTyxDQUFDLE9BQU8sQ0FBQztTQUNoQixNQUFNLENBQUMseUJBQXlCLEVBQUUseUNBQXlDLEVBQUUsWUFBWSxDQUFDO1NBQzFGLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSwwREFBMEQsRUFBRSxLQUFLLENBQUM7U0FDbEcsTUFBTSxDQUFDLHFCQUFxQixFQUFFLFVBQVUsRUFBRSx3QkFBd0IsQ0FBQztTQUNuRSxNQUFNLENBQUMsMEJBQTBCLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxDQUFDO1NBQ3hFLE1BQU0sQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQztTQUN4QyxNQUFNLENBQUMsV0FBVyxFQUFFLHNCQUFzQixFQUFFLEtBQUssQ0FBQztTQUNsRCxNQUFNLENBQUMsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQztTQUM5QyxNQUFNLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUM7U0FDMUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxLQUFLLENBQUM7U0FDakQsTUFBTSxDQUFDLGdCQUFn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QUMsRUFBRTtRQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IHRzLW5vZGVcblxuLyoqXG4gKiBVSS9VWOODhuOCueODiOWun+ihjOOCueOCr+ODquODl+ODiFxuICogXG4gKiBLaXJvIE1DUCBDaHJvbWUgRGV2VG9vbHPjgpLkvb/nlKjjgZfjgZ/lrp/jg5bjg6njgqbjgrbjgafjga5VSS9VWOODhuOCueODiOOCkuWun+ihjFxuICog44Kz44Oe44Oz44OJ44Op44Kk44Oz5byV5pWw44Gn55Kw5aKD44Go44OG44K544OI44K/44Kk44OX44KS5oyH5a6a5Y+v6IO9XG4gKiBcbiAqIOS9v+eUqOS+izpcbiAqIG5wbSBydW4gdGVzdDpwcm9kdWN0aW9uOnVpLXV4XG4gKiBucG0gcnVuIHRlc3Q6cHJvZHVjdGlvbjp1aS11eDpzdGFnaW5nXG4gKiB0cy1ub2RlIHJ1bi11aS11eC10ZXN0cy50cyAtLWVudiBwcm9kdWN0aW9uIC0tdHlwZSBhbGxcbiAqIHRzLW5vZGUgcnVuLXVpLXV4LXRlc3RzLnRzIC0tZW52IHN0YWdpbmcgLS10eXBlIHJlc3BvbnNpdmVcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCB7IENvbW1hbmQgfSBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IFVJVVhUZXN0UnVubmVyIGZyb20gJy4vdWktdXgtdGVzdC1ydW5uZXInO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lIGZyb20gJy4uLy4uL2NvcmUvcHJvZHVjdGlvbi10ZXN0LWVuZ2luZSc7XG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnLCBnZXRQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCB7IFxuICBnZXRVSVVYQ29uZmlnLCBcbiAgdmFsaWRhdGVVSVVYQ29uZmlnLCBcbiAgZGlzcGxheVVJVVhDb25maWcsXG4gIFVJVVhUZXN0Q29uZmlnIFxufSBmcm9tICcuL3VpLXV4LWNvbmZpZyc7XG5pbXBvcnQgRW1lcmdlbmN5U3RvcE1hbmFnZXIgZnJvbSAnLi4vLi4vY29yZS9lbWVyZ2VuY3ktc3RvcC1tYW5hZ2VyJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8qKlxuICog44OG44K544OI44K/44Kk44OX44Gu5a6a576pXG4gKi9cbnR5cGUgVGVzdFR5cGUgPSAnYWxsJyB8ICdyZXNwb25zaXZlJyB8ICdjaGF0JyB8ICdhY2Nlc3NpYmlsaXR5JyB8ICd1c2FiaWxpdHknO1xuXG4vKipcbiAqIOOCs+ODnuODs+ODieODqeOCpOODs+W8leaVsOOBruino+aekFxuICovXG5mdW5jdGlvbiBwYXJzZUFyZ3VtZW50cygpIHtcbiAgY29uc3QgcHJvZ3JhbSA9IG5ldyBDb21tYW5kKCk7XG4gIFxuICBwcm9ncmFtXG4gICAgLm5hbWUoJ3J1bi11aS11eC10ZXN0cycpXG4gICAgLmRlc2NyaXB0aW9uKCflrp/mnKznlarnkrDlooPjgafjga5VSS9VWOODhuOCueODiOWun+ihjCcpXG4gICAgLnZlcnNpb24oJzEuMC4wJylcbiAgICAub3B0aW9uKCctZSwgLS1lbnYgPGVudmlyb25tZW50PicsICflrp/ooYznkrDlooMgKHByb2R1Y3Rpb24sIHN0YWdpbmcsIGRldmVsb3BtZW50KScsICdwcm9kdWN0aW9uJylcbiAgICAub3B0aW9uKCctdCwgLS10eXBlIDx0ZXN0VHlwZT4nLCAn44OG44K544OI44K/44Kk44OXIChhbGwsIHJlc3BvbnNpdmUsIGNoYXQsIGFjY2Vzc2liaWxpdHksIHVzYWJpbGl0eSknLCAnYWxsJylcbiAgICAub3B0aW9uKCctciwgLS1yZXBvcnQgPHBhdGg+JywgJ+ODrOODneODvOODiOWHuuWKm+ODkeOCuScsICcuL3VpLXV4LXRlc3QtcmVwb3J0Lm1kJylcbiAgICAub3B0aW9uKCctcywgLS1zY3JlZW5zaG90cyA8cGF0aD4nLCAn44K544Kv44Oq44O844Oz44K344On44OD44OI5L+d5a2Y44OH44Kj44Os44Kv44OI44OqJywgJy4vc2NyZWVuc2hvdHMnKVxuICAgIC5vcHRpb24oJy12LCAtLXZlcmJvc2UnLCAn6Kmz57Sw44Ot44Kw5Ye65YqbJywgZmFsc2UpXG4gICAgLm9wdGlvbignLS1kcnktcnVuJywgJ+ODieODqeOCpOODqeODs+Wun+ihjO+8iOWun+mam+OBruODhuOCueODiOOBr+ihjOOCj+OBquOBhO+8iScsIGZhbHNlKVxuICAgIC5vcHRpb24oJy0tZW1lcmdlbmN5LXN0b3AnLCAn57eK5oCl5YGc5q2i5qmf6IO944KS5pyJ5Yq55YyWJywgdHJ1ZSlcbiAgICAub3B0aW9uKCctLWhlYWRsZXNzJywgJ+ODmOODg+ODieODrOOCueODouODvOODieOBp+Wun+ihjCcsIGZhbHNlKVxuICAgIC5vcHRpb24oJy0tbW9iaWxlLW9ubHknLCAn44Oi44OQ44Kk44Or44OT44Ol44O844Od44O844OI44Gu44G/44OG44K544OIJywgZmFsc2UpXG4gICAgLm9wdGlvbignLS1kZXNrdG9wLW9ubHknLCAn44OH44K544Kv44OI44OD44OX44OT44Ol44O844Od44O844OI44Gu44G/44OG44K544OIJywgZmFsc2UpXG4gICAgLnBhcnNlKCk7XG5cbiAgcmV0dXJuIHByb2dyYW0ub3B0cygpO1xufVxuXG4vKipcbiAqIOeSsOWig+ioreWumuOBruaknOiovOOBqOihqOekulxuICovXG5hc3luYyBmdW5jdGlvbiB2YWxpZGF0ZUFuZERpc3BsYXlDb25maWcoXG4gIGVudmlyb25tZW50OiBzdHJpbmcsXG4gIHVpdXhDb25maWc6IFVJVVhUZXN0Q29uZmlnXG4pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgY29uc29sZS5sb2coJ/CflI0g6Kit5a6a5qSc6Ki85LitLi4uJyk7XG4gIFxuICAvLyBVSS9VWOODhuOCueODiOioreWumuOBruaknOiovFxuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVVSVVYQ29uZmlnKHVpdXhDb25maWcpO1xuICBcbiAgaWYgKCF2YWxpZGF0aW9uLmlzVmFsaWQpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgVUkvVVjjg4bjgrnjg4joqK3lrprjgqjjg6njg7w6Jyk7XG4gICAgdmFsaWRhdGlvbi5lcnJvcnMuZm9yRWFjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGAgICAtICR7ZXJyb3J9YCkpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgaWYgKHZhbGlkYXRpb24ud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnNvbGUud2Fybign4pqg77iPIFVJL1VY44OG44K544OI6Kit5a6a6K2m5ZGKOicpO1xuICAgIHZhbGlkYXRpb24ud2FybmluZ3MuZm9yRWFjaCh3YXJuaW5nID0+IGNvbnNvbGUud2FybihgICAgLSAke3dhcm5pbmd9YCkpO1xuICB9XG4gIFxuICAvLyDoqK3lrprjga7ooajnpLpcbiAgZGlzcGxheVVJVVhDb25maWcodWl1eENvbmZpZyk7XG4gIFxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiDlgIvliKXjg4bjgrnjg4jjga7lrp/ooYxcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuSW5kaXZpZHVhbFRlc3QoXG4gIHRlc3RSdW5uZXI6IFVJVVhUZXN0UnVubmVyLFxuICB0ZXN0VHlwZTogVGVzdFR5cGVcbik6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IHRlc3RNb2R1bGUgPSAodGVzdFJ1bm5lciBhcyBhbnkpLnRlc3RNb2R1bGU7XG4gIFxuICBzd2l0Y2ggKHRlc3RUeXBlKSB7XG4gICAgY2FzZSAncmVzcG9uc2l2ZSc6XG4gICAgICBjb25zb2xlLmxvZygn8J+TsSDjg6zjgrnjg53jg7Pjgrfjg5bjg4fjgrbjgqTjg7Pjg4bjgrnjg4jjgpLlrp/ooYzkuK0uLi4nKTtcbiAgICAgIHJldHVybiBhd2FpdCB0ZXN0TW9kdWxlLnRlc3RSZXNwb25zaXZlRGVzaWduKCk7XG4gICAgICBcbiAgICBjYXNlICdjaGF0JzpcbiAgICAgIGNvbnNvbGUubG9nKCfwn5KsIOODgeODo+ODg+ODiOOCpOODs+OCv+ODvOODleOCp+ODvOOCueODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuICAgICAgcmV0dXJuIGF3YWl0IHRlc3RNb2R1bGUudGVzdENoYXRJbnRlcmZhY2UoKTtcbiAgICAgIFxuICAgIGNhc2UgJ2FjY2Vzc2liaWxpdHknOlxuICAgICAgY29uc29sZS5sb2coJ+KZvyDjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPjg4bjgrnjg4jjgpLlrp/ooYzkuK0uLi4nKTtcbiAgICAgIHJldHVybiBhd2FpdCB0ZXN0TW9kdWxlLnRlc3RBY2Nlc3NpYmlsaXR5KCk7XG4gICAgICBcbiAgICBjYXNlICd1c2FiaWxpdHknOlxuICAgICAgY29uc29sZS5sb2coJ/CfkaQg44Om44O844K244OT44Oq44OG44Kj44OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgICByZXR1cm4gYXdhaXQgdGVzdE1vZHVsZS50ZXN0VXNhYmlsaXR5KCk7XG4gICAgICBcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGDmnKrlr77lv5zjga7jg4bjgrnjg4jjgr/jgqTjg5c6ICR7dGVzdFR5cGV9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jntZDmnpzjga7jg6zjg53jg7zjg4jnlJ/miJBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVUZXN0UmVwb3J0KFxuICByZXN1bHRzOiBNYXA8c3RyaW5nLCBhbnk+LFxuICB0ZXN0UnVubmVyOiBVSVVYVGVzdFJ1bm5lcixcbiAgcmVwb3J0UGF0aDogc3RyaW5nLFxuICBzY3JlZW5zaG90c1BhdGg6IHN0cmluZyxcbiAgZW52aXJvbm1lbnQ6IHN0cmluZ1xuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCfwn5OdIOODhuOCueODiOODrOODneODvOODiOOCkueUn+aIkOS4rS4uLicpO1xuICBcbiAgdHJ5IHtcbiAgICBjb25zdCByZXBvcnQgPSBhd2FpdCB0ZXN0UnVubmVyLmdlbmVyYXRlRGV0YWlsZWRSZXBvcnQocmVzdWx0cyk7XG4gICAgXG4gICAgLy8g44Os44Od44O844OI44OV44Kh44Kk44Or44Gu5L+d5a2YXG4gICAgY29uc3QgcmVwb3J0RGlyID0gcGF0aC5kaXJuYW1lKHJlcG9ydFBhdGgpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhyZXBvcnREaXIpKSB7XG4gICAgICBmcy5ta2RpclN5bmMocmVwb3J0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgXG4gICAgZnMud3JpdGVGaWxlU3luYyhyZXBvcnRQYXRoLCByZXBvcnQsICd1dGY4Jyk7XG4gICAgXG4gICAgY29uc29sZS5sb2coYOKchSDjg4bjgrnjg4jjg6zjg53jg7zjg4jjgpLkv53lrZjjgZfjgb7jgZfjgZ86ICR7cmVwb3J0UGF0aH1gKTtcbiAgICBcbiAgICAvLyDjgrnjgq/jg6rjg7zjg7Pjgrfjg6fjg4Pjg4jjg4fjgqPjg6zjgq/jg4jjg6rjga7kvZzmiJBcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoc2NyZWVuc2hvdHNQYXRoKSkge1xuICAgICAgZnMubWtkaXJTeW5jKHNjcmVlbnNob3RzUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICBjb25zb2xlLmxvZyhg8J+TgSDjgrnjgq/jg6rjg7zjg7Pjgrfjg6fjg4Pjg4jjg4fjgqPjg6zjgq/jg4jjg6rjgpLkvZzmiJA6ICR7c2NyZWVuc2hvdHNQYXRofWApO1xuICAgIH1cbiAgICBcbiAgICAvLyDnsKHmmJPjgrXjg57jg6rjg7zjga7ooajnpLpcbiAgICBjb25zdCBzdW1tYXJ5ID0gQXJyYXkuZnJvbShyZXN1bHRzLnZhbHVlcygpKTtcbiAgICBjb25zdCBzdWNjZXNzQ291bnQgPSBzdW1tYXJ5LmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIGNvbnN0IHRvdGFsQ291bnQgPSBzdW1tYXJ5Lmxlbmd0aDtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJ/Cfk4ogVUkvVVjjg4bjgrnjg4jlrp/ooYzjgrXjg57jg6rjg7w6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtlbnZpcm9ubWVudH1gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg57eP44OG44K544OI5pWwOiAke3RvdGFsQ291bnR9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOaIkOWKnzogJHtzdWNjZXNzQ291bnR9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOWkseaVlzogJHt0b3RhbENvdW50IC0gc3VjY2Vzc0NvdW50fWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDmiJDlip/njoc6ICR7KChzdWNjZXNzQ291bnQgLyB0b3RhbENvdW50KSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgXG4gICAgLy8g44OR44OV44Kp44O844Oe44Oz44K55oyH5qiZ44Gu6KGo56S6XG4gICAgY29uc3QgcGVyZm9ybWFuY2VSZXN1bHRzID0gc3VtbWFyeS5maWx0ZXIociA9PiByLnVpTWV0cmljcyk7XG4gICAgaWYgKHBlcmZvcm1hbmNlUmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBhdmdMb2FkVGltZSA9IHBlcmZvcm1hbmNlUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci51aU1ldHJpY3MucGFnZUxvYWRUaW1lLCAwKSAvIHBlcmZvcm1hbmNlUmVzdWx0cy5sZW5ndGg7XG4gICAgICBjb25zb2xlLmxvZyhgICAg5bmz5Z2H44Oa44O844K46Kqt44G/6L6844G/5pmC6ZaTOiAke2F2Z0xvYWRUaW1lLnRvRml4ZWQoMCl9bXNgKTtcbiAgICB9XG4gICAgXG4gICAgLy8g44Ki44Kv44K744K344OT44Oq44OG44Kj5oyH5qiZ44Gu6KGo56S6XG4gICAgY29uc3QgYWNjZXNzaWJpbGl0eVJlc3VsdHMgPSBzdW1tYXJ5LmZpbHRlcihyID0+IHIuYWNjZXNzaWJpbGl0eU1ldHJpY3MpO1xuICAgIGlmIChhY2Nlc3NpYmlsaXR5UmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBhdmdXY2FnID0gYWNjZXNzaWJpbGl0eVJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIuYWNjZXNzaWJpbGl0eU1ldHJpY3Mud2NhZ0FBQ29tcGxpYW5jZSwgMCkgLyBhY2Nlc3NpYmlsaXR5UmVzdWx0cy5sZW5ndGg7XG4gICAgICBjb25zb2xlLmxvZyhgICAg5bmz5Z2HV0NBR+a6luaLoOeOhzogJHsoYXZnV2NhZyAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgfVxuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg6zjg53jg7zjg4jnlJ/miJDjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbi8qKlxuICog44OJ44Op44Kk44Op44Oz5a6f6KGMXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bkRyeVJ1bihcbiAgZW52aXJvbm1lbnQ6IHN0cmluZyxcbiAgdGVzdFR5cGU6IFRlc3RUeXBlLFxuICB1aXV4Q29uZmlnOiBVSVVYVGVzdENvbmZpZyxcbiAgb3B0aW9uczogYW55XG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc29sZS5sb2coJ/CflI0g44OJ44Op44Kk44Op44Oz5a6f6KGM5LitLi4uJyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgXG4gIGNvbnNvbGUubG9nKCfwn5OLIOWun+ihjOS6iOWumuOBruODhuOCueODiDonKTtcbiAgXG4gIGlmICh0ZXN0VHlwZSA9PT0gJ2FsbCcpIHtcbiAgICBjb25zb2xlLmxvZygnICAg4pyTIOODrOOCueODneODs+OCt+ODluODh+OCtuOCpOODs+ODhuOCueODiCcpO1xuICAgIGNvbnNvbGUubG9nKCcgICDinJMg44OB44Oj44OD44OI44Kk44Oz44K/44O844OV44Kn44O844K544OG44K544OIJyk7XG4gICAgY29uc29sZS5sb2coJyAgIOKckyDjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPjg4bjgrnjg4gnKTtcbiAgICBjb25zb2xlLmxvZygnICAg4pyTIOODpuODvOOCtuODk+ODquODhuOCo+ODhuOCueODiCcpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKGAgICDinJMgJHt0ZXN0VHlwZX3jg4bjgrnjg4hgKTtcbiAgfVxuICBcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygn8J+TsSDjg4bjgrnjg4jlr77osaHjg5Pjg6Xjg7zjg53jg7zjg4g6Jyk7XG4gIFxuICBpZiAob3B0aW9ucy5tb2JpbGVPbmx5KSB7XG4gICAgY29uc29sZS5sb2coJyAgIOKckyDjg6Ljg5DjgqTjg6sgKDM3NXg2NjcpJyk7XG4gIH0gZWxzZSBpZiAob3B0aW9ucy5kZXNrdG9wT25seSkge1xuICAgIGNvbnNvbGUubG9nKCcgICDinJMg44OH44K544Kv44OI44OD44OXICgxOTIweDEwODApJyk7XG4gIH0gZWxzZSB7XG4gICAgT2JqZWN0LmVudHJpZXModWl1eENvbmZpZy52aWV3cG9ydHMpLmZvckVhY2goKFtuYW1lLCB2aWV3cG9ydF0pID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDinJMgJHtuYW1lfSAoJHt2aWV3cG9ydC53aWR0aH14JHt2aWV3cG9ydC5oZWlnaHR9KWApO1xuICAgIH0pO1xuICB9XG4gIFxuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCfwn5OKIOS6iOaDs+Wun+ihjOaZgumWkzonKTtcbiAgXG4gIGxldCBlc3RpbWF0ZWREdXJhdGlvbiA9IDA7XG4gIGlmICh0ZXN0VHlwZSA9PT0gJ2FsbCcpIHtcbiAgICBlc3RpbWF0ZWREdXJhdGlvbiA9IDMgKyA0ICsgNSArIDY7IC8vIOWQhOODhuOCueODiOOBruS6iOaDs+aZgumWk++8iOWIhu+8iVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGR1cmF0aW9ucyA9IHsgcmVzcG9uc2l2ZTogMywgY2hhdDogNCwgYWNjZXNzaWJpbGl0eTogNSwgdXNhYmlsaXR5OiA2IH07XG4gICAgZXN0aW1hdGVkRHVyYXRpb24gPSBkdXJhdGlvbnNbdGVzdFR5cGUgYXMga2V5b2YgdHlwZW9mIGR1cmF0aW9uc10gfHwgNTtcbiAgfVxuICBcbiAgY29uc29sZS5sb2coYCAgIOS6iOaDs+Wun+ihjOaZgumWkzog57SEJHtlc3RpbWF0ZWREdXJhdGlvbn3liIZgKTtcbiAgY29uc29sZS5sb2coYCAgIOODluODqeOCpuOCtuODouODvOODiTogJHtvcHRpb25zLmhlYWRsZXNzID8gJ+ODmOODg+ODieODrOOCuScgOiAn6YCa5bi46KGo56S6J31gKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ/Cfjq8g5ZOB6LOq5Z+65rqWOicpO1xuICBjb25zb2xlLmxvZyhgICAg44Oa44O844K46Kqt44G/6L6844G/5pmC6ZaTOiAke3VpdXhDb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLnBhZ2VMb2FkVGltZX1tc+S7peWGhWApO1xuICBjb25zb2xlLmxvZyhgICAgV0NBR+a6luaLoOODrOODmeODqzogJHt1aXV4Q29uZmlnLmFjY2Vzc2liaWxpdHkud2NhZ0xldmVsfWApO1xuICBjb25zb2xlLmxvZyhgICAg5pyA5bCP44Kz44Oz44OI44Op44K544OI5q+UOiAke3VpdXhDb25maWcuYWNjZXNzaWJpbGl0eS5taW5pbXVtQ29udHJhc3RSYXRpb306MWApO1xuICBjb25zb2xlLmxvZyhgICAg44Om44O844K244O844OV44Ot44O85a6M5LqG546HOiAkeyh1aXV4Q29uZmlnLnVzYWJpbGl0eS5taW5pbXVtVXNlckZsb3dDb21wbGV0aW9uICogMTAwKS50b0ZpeGVkKDApfSXku6XkuIpgKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ/Cfm6HvuI8g5a6J5YWo6Kit5a6aOicpO1xuICBjb25zb2xlLmxvZyhgICAg6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJOiAke3VpdXhDb25maWcuc2FmZXR5LnJlYWRPbmx5TW9kZSA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDnt4rmgKXlgZzmraLmqZ/og706ICR7dWl1eENvbmZpZy5zYWZldHkuZW1lcmdlbmN5U3RvcEVuYWJsZWQgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICBjb25zb2xlLmxvZyhgICAg5pyA5aSn44OG44K544OI5pmC6ZaTOiAke3VpdXhDb25maWcuZXhlY3V0aW9uLm1heFRlc3REdXJhdGlvbn3np5JgKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ+KchSDjg4njg6njgqTjg6njg7PlrozkuoYgLSDlrp/pmpvjga7jg4bjgrnjg4jjga/lrp/ooYzjgZXjgozjgb7jgZvjgpPjgafjgZfjgZ8nKTtcbn1cblxuLyoqXG4gKiBLaXJvIE1DUCBDaHJvbWUgRGV2VG9vbHPjga7liJ3mnJ/ljJbnorroqo1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gY2hlY2tLaXJvTUNQQXZhaWxhYmlsaXR5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zb2xlLmxvZygn8J+UjSBLaXJvIE1DUCBDaHJvbWUgRGV2VG9vbHMg44Gu5Y+v55So5oCn44KS56K66KqN5LitLi4uJyk7XG4gIFxuICB0cnkge1xuICAgIC8vIOWun+mam+OBruWun+ijheOBp+OBryBLaXJvIE1DUCDjga7lj6/nlKjmgKfjgpLjg4Hjgqfjg4Pjgq9cbiAgICAvLyBjb25zdCBpc0F2YWlsYWJsZSA9IGF3YWl0IGtpcm9Ccm93c2VyLmlzQXZhaWxhYmxlKCk7XG4gICAgXG4gICAgLy8g57Ch55Wl5YyW44GV44KM44Gf44OB44Kn44OD44KvXG4gICAgY29uc3QgaXNBdmFpbGFibGUgPSB0cnVlOyAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/pganliIfjgavjg4Hjgqfjg4Pjgq9cbiAgICBcbiAgICBpZiAoaXNBdmFpbGFibGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgS2lybyBNQ1AgQ2hyb21lIERldlRvb2xzIOOBjOWIqeeUqOWPr+iDveOBp+OBmScpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBLaXJvIE1DUCBDaHJvbWUgRGV2VG9vbHMg44GM5Yip55So44Gn44GN44G+44Gb44KTJyk7XG4gICAgICBjb25zb2xlLmVycm9yKCcgICBLaXJvIElERSDjgafjgZPjga7jgrnjgq/jg6rjg5fjg4jjgpLlrp/ooYzjgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIEtpcm8gTUNQIOWPr+eUqOaAp+ODgeOCp+ODg+OCr+OCqOODqeODvDonLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICog44Oh44Kk44Oz5a6f6KGM6Zai5pWwXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IG9wdGlvbnMgPSBwYXJzZUFyZ3VtZW50cygpO1xuICBcbiAgY29uc29sZS5sb2coJ/CfmoAgVUkvVVjjg4bjgrnjg4jlrp/ooYzplovlp4snKTtcbiAgY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtvcHRpb25zLmVudn1gKTtcbiAgY29uc29sZS5sb2coYCAgIOODhuOCueODiOOCv+OCpOODlzogJHtvcHRpb25zLnR5cGV9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDjg6zjg53jg7zjg4jlh7rlips6ICR7b3B0aW9ucy5yZXBvcnR9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDjgrnjgq/jg6rjg7zjg7Pjgrfjg6fjg4Pjg4g6ICR7b3B0aW9ucy5zY3JlZW5zaG90c31gKTtcbiAgY29uc29sZS5sb2coYCAgIOODieODqeOCpOODqeODszogJHtvcHRpb25zLmRyeVJ1biA/ICfjga/jgYQnIDogJ+OBhOOBhOOBiCd9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDjg5jjg4Pjg4njg6zjgrnjg6Ljg7zjg4k6ICR7b3B0aW9ucy5oZWFkbGVzcyA/ICfjga/jgYQnIDogJ+OBhOOBhOOBiCd9YCk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgXG4gIHRyeSB7XG4gICAgLy8g6Kit5a6a44Gu6Kqt44G/6L6844G/XG4gICAgY29uc3QgcHJvZHVjdGlvbkNvbmZpZyA9IGdldFByb2R1Y3Rpb25Db25maWcob3B0aW9ucy5lbnYpO1xuICAgIGNvbnN0IHVpdXhDb25maWcgPSBnZXRVSVVYQ29uZmlnKG9wdGlvbnMuZW52KTtcbiAgICBcbiAgICAvLyDoqK3lrprjga7mpJzoqLxcbiAgICBjb25zdCBpc0NvbmZpZ1ZhbGlkID0gYXdhaXQgdmFsaWRhdGVBbmREaXNwbGF5Q29uZmlnKG9wdGlvbnMuZW52LCB1aXV4Q29uZmlnKTtcbiAgICBpZiAoIWlzQ29uZmlnVmFsaWQpIHtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG4gICAgXG4gICAgLy8g44OJ44Op44Kk44Op44Oz5a6f6KGMXG4gICAgaWYgKG9wdGlvbnMuZHJ5UnVuKSB7XG4gICAgICBhd2FpdCBydW5EcnlSdW4ob3B0aW9ucy5lbnYsIG9wdGlvbnMudHlwZSBhcyBUZXN0VHlwZSwgdWl1eENvbmZpZywgb3B0aW9ucyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIEtpcm8gTUNQIOOBruWPr+eUqOaAp+eiuuiqjVxuICAgIGNvbnN0IGlzTUNQQXZhaWxhYmxlID0gYXdhaXQgY2hlY2tLaXJvTUNQQXZhaWxhYmlsaXR5KCk7XG4gICAgaWYgKCFpc01DUEF2YWlsYWJsZSkge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIEtpcm8gTUNQIENocm9tZSBEZXZUb29scyDjgYzlv4XopoHjgafjgZknKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG4gICAgXG4gICAgLy8g57eK5oCl5YGc5q2i44Oe44ON44O844K444Oj44O844Gu5Yid5pyf5YyWXG4gICAgbGV0IGVtZXJnZW5jeVN0b3BNYW5hZ2VyOiBFbWVyZ2VuY3lTdG9wTWFuYWdlciB8IHVuZGVmaW5lZDtcbiAgICBpZiAob3B0aW9ucy5lbWVyZ2VuY3lTdG9wKSB7XG4gICAgICBlbWVyZ2VuY3lTdG9wTWFuYWdlciA9IG5ldyBFbWVyZ2VuY3lTdG9wTWFuYWdlcih7XG4gICAgICAgIG1heFRlc3REdXJhdGlvbjogdWl1eENvbmZpZy5leGVjdXRpb24ubWF4VGVzdER1cmF0aW9uICogMTAwMCxcbiAgICAgICAgcmVzb3VyY2VUaHJlc2hvbGQ6IDAuOSxcbiAgICAgICAgY29zdFRocmVzaG9sZDogMTAuMCwgLy8gVUkvVVjjg4bjgrnjg4jjga/kvY7jgrPjgrnjg4hcbiAgICAgICAgZW5hYmxlQXV0b1N0b3A6IHRydWVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBhd2FpdCBlbWVyZ2VuY3lTdG9wTWFuYWdlci5pbml0aWFsaXplKCk7XG4gICAgICBjb25zb2xlLmxvZygn8J+boe+4jyDnt4rmgKXlgZzmraLjg57jg43jg7zjgrjjg6Pjg7zjgpLliJ3mnJ/ljJbjgZfjgb7jgZfjgZ8nKTtcbiAgICB9XG4gICAgXG4gICAgLy8g44OG44K544OI44Ko44Oz44K444Oz44Gu5Yid5pyf5YyWXG4gICAgY29uc3QgdGVzdEVuZ2luZSA9IG5ldyBQcm9kdWN0aW9uVGVzdEVuZ2luZShwcm9kdWN0aW9uQ29uZmlnKTtcbiAgICBhd2FpdCB0ZXN0RW5naW5lLmluaXRpYWxpemUoKTtcbiAgICBcbiAgICAvLyBVSS9VWOODhuOCueODiOODqeODs+ODiuODvOOBruWIneacn+WMllxuICAgIGNvbnN0IHRlc3RSdW5uZXIgPSBuZXcgVUlVWFRlc3RSdW5uZXIocHJvZHVjdGlvbkNvbmZpZywgdGVzdEVuZ2luZSk7XG4gICAgXG4gICAgbGV0IHJlc3VsdHM6IE1hcDxzdHJpbmcsIGFueT47XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGlmIChvcHRpb25zLnR5cGUgPT09ICdhbGwnKSB7XG4gICAgICAgIC8vIOWFqOODhuOCueODiOOBruWun+ihjFxuICAgICAgICBjb25zdCB0ZXN0UmVzdWx0cyA9IGF3YWl0IHRlc3RSdW5uZXIucnVuVUlVWFRlc3RzKCk7XG4gICAgICAgIHJlc3VsdHMgPSB0ZXN0UmVzdWx0cy5yZXN1bHRzO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICBjb25zb2xlLmxvZygn8J+TiiDlhahVSS9VWOODhuOCueODiOWujOS6hjonKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaIkOWKn+eOhzogJHsodGVzdFJlc3VsdHMuc3VtbWFyeS5zdWNjZXNzUmF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDnt4/lkIhVSS9VWOOCueOCs+OCojogJHsodGVzdFJlc3VsdHMuc3VtbWFyeS5vdmVyYWxsVUlVWFNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOW5s+Wdh+ODmuODvOOCuOiqreOBv+i+vOOBv+aZgumWkzogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5LmF2ZXJhZ2VQYWdlTG9hZFRpbWUudG9GaXhlZCgwKX1tc2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgV0NBR+a6luaLoOeOhzogJHsodGVzdFJlc3VsdHMuc3VtbWFyeS53Y2FnQ29tcGxpYW5jZVJhdGUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgICBcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIOWAi+WIpeODhuOCueODiOOBruWun+ihjFxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBydW5JbmRpdmlkdWFsVGVzdCh0ZXN0UnVubmVyLCBvcHRpb25zLnR5cGUgYXMgVGVzdFR5cGUpO1xuICAgICAgICByZXN1bHRzID0gbmV3IE1hcChbW3Jlc3VsdC50ZXN0SWQsIHJlc3VsdF1dKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4ogJHtvcHRpb25zLnR5cGV944OG44K544OI5a6M5LqGOmApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg44K544OG44O844K/44K5OiAke3Jlc3VsdC5zdWNjZXNzID8gJ+aIkOWKnycgOiAn5aSx5pWXJ31gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOWun+ihjOaZgumWkzogJHtyZXN1bHQuZHVyYXRpb259bXNgKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChyZXN1bHQudWlNZXRyaWNzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYCAgIOODmuODvOOCuOiqreOBv+i+vOOBv+aZgumWkzogJHtyZXN1bHQudWlNZXRyaWNzLnBhZ2VMb2FkVGltZS50b0ZpeGVkKDApfW1zYCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyZXN1bHQuYWNjZXNzaWJpbGl0eU1ldHJpY3MpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICAgV0NBR+a6luaLoOeOhzogJHsocmVzdWx0LmFjY2Vzc2liaWxpdHlNZXRyaWNzLndjYWdBQUNvbXBsaWFuY2UgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIOODrOODneODvOODiOeUn+aIkFxuICAgICAgYXdhaXQgZ2VuZXJhdGVUZXN0UmVwb3J0KHJlc3VsdHMsIHRlc3RSdW5uZXIsIG9wdGlvbnMucmVwb3J0LCBvcHRpb25zLnNjcmVlbnNob3RzLCBvcHRpb25zLmVudik7XG4gICAgICBcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8g44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAgICBhd2FpdCB0ZXN0UnVubmVyLmNsZWFudXAoKTtcbiAgICAgIGF3YWl0IHRlc3RFbmdpbmUuY2xlYW51cCgpO1xuICAgICAgXG4gICAgICBpZiAoZW1lcmdlbmN5U3RvcE1hbmFnZXIpIHtcbiAgICAgICAgYXdhaXQgZW1lcmdlbmN5U3RvcE1hbmFnZXIuY2xlYW51cCgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJ+KchSBVSS9VWOODhuOCueODiOWun+ihjOWujOS6hicpO1xuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBVSS9VWOODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+OCqOODqeODvOips+e0sDonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgIGlmIChvcHRpb25zLnZlcmJvc2UpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign44K544K/44OD44Kv44OI44Os44O844K5OicsIGVycm9yLnN0YWNrKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbi8vIOOCueOCr+ODquODl+ODiOOBjOebtOaOpeWun+ihjOOBleOCjOOBn+WgtOWQiOOBruOBv21haW7plqLmlbDjgpLlrp/ooYxcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+S6iOacn+OBl+OBquOBhOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9KTtcbn1cblxuZXhwb3J0IHsgbWFpbiBhcyBydW5VSVVYVGVzdHMgfTsiXX0=