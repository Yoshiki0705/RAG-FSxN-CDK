#!/usr/bin/env ts-node
"use strict";
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
exports.runPerformanceTests = main;
const commander_1 = require("commander");
const performance_test_runner_1 = __importDefault(require("./performance-test-runner"));
const production_test_engine_1 = __importDefault(require("../../core/production-test-engine"));
const production_config_1 = require("../../config/production-config");
const performance_config_1 = require("./performance-config");
const emergency_stop_manager_1 = __importDefault(require("../../core/emergency-stop-manager"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * コマンドライン引数の解析
 */
function parseArguments() {
    const program = new commander_1.Command();
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
async function validateAndDisplayConfig(environment, performanceConfig) {
    console.log('🔍 設定検証中...');
    // パフォーマンステスト設定の検証
    const validation = (0, performance_config_1.validatePerformanceConfig)(performanceConfig);
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
    (0, performance_config_1.displayPerformanceConfig)(performanceConfig);
    return true;
}
/**
 * 個別テストの実行
 */
async function runIndividualTest(testRunner, testType) {
    const testModule = testRunner.testModule;
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
async function generateTestReport(results, testRunner, reportPath, environment) {
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
    }
    catch (error) {
        console.error('❌ レポート生成エラー:', error);
        throw error;
    }
}
/**
 * ドライラン実行
 */
async function runDryRun(environment, testType, performanceConfig) {
    console.log('🔍 ドライラン実行中...');
    console.log('');
    console.log('📋 実行予定のテスト:');
    if (testType === 'all') {
        console.log('   ✓ 基本レスポンス時間テスト');
        console.log('   ✓ 同時接続負荷テスト');
        console.log('   ✓ リソース使用率テスト');
        console.log('   ✓ スケーラビリティテスト');
    }
    else {
        console.log(`   ✓ ${testType}テスト`);
    }
    console.log('');
    console.log('📊 予想実行時間:');
    let estimatedDuration = 0;
    if (testType === 'all') {
        estimatedDuration = 2 + 3 + 5 + 10; // 各テストの予想時間（分）
    }
    else {
        const durations = { basic: 2, concurrent: 3, resource: 5, scalability: 10 };
        estimatedDuration = durations[testType] || 5;
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
async function main() {
    const options = parseArguments();
    console.log('🚀 パフォーマンステスト実行開始');
    console.log(`   環境: ${options.env}`);
    console.log(`   テストタイプ: ${options.type}`);
    console.log(`   レポート出力: ${options.report}`);
    console.log(`   ドライラン: ${options.dryRun ? 'はい' : 'いいえ'}`);
    console.log('');
    try {
        // 設定の読み込み
        const productionConfig = (0, production_config_1.getProductionConfig)(options.env);
        const performanceConfig = (0, performance_config_1.getPerformanceConfig)(options.env);
        // 設定の検証
        const isConfigValid = await validateAndDisplayConfig(options.env, performanceConfig);
        if (!isConfigValid) {
            process.exit(1);
        }
        // ドライラン実行
        if (options.dryRun) {
            await runDryRun(options.env, options.type, performanceConfig);
            return;
        }
        // 緊急停止マネージャーの初期化
        let emergencyStopManager;
        if (options.emergencyStop) {
            emergencyStopManager = new emergency_stop_manager_1.default({
                maxTestDuration: performanceConfig.safety.maxTestDuration * 1000,
                resourceThreshold: performanceConfig.safety.resourceUsageThreshold,
                costThreshold: performanceConfig.costLimits.maxTestCost,
                enableAutoStop: performanceConfig.safety.autoStopOnHighCost
            });
            await emergencyStopManager.initialize();
            console.log('🛡️ 緊急停止マネージャーを初期化しました');
        }
        // テストエンジンの初期化
        const testEngine = new production_test_engine_1.default(productionConfig);
        await testEngine.initialize();
        // パフォーマンステストランナーの初期化
        const testRunner = new performance_test_runner_1.default(productionConfig, testEngine);
        let results;
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
            }
            else {
                // 個別テストの実行
                const result = await runIndividualTest(testRunner, options.type);
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
        console.log('✅ パフォーマンステスト実行完了');
    }
    catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXBlcmZvcm1hbmNlLXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLXBlcmZvcm1hbmNlLXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7Ozs7Ozs7Ozs7O0dBY0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3VGMsbUNBQW1CO0FBdFRwQyx5Q0FBb0M7QUFDcEMsd0ZBQThEO0FBQzlELCtGQUFxRTtBQUNyRSxzRUFBdUY7QUFDdkYsNkRBSzhCO0FBQzlCLCtGQUFxRTtBQUNyRSx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBTzdCOztHQUVHO0FBQ0gsU0FBUyxjQUFjO0lBQ3JCLE1BQU0sT0FBTyxHQUFHLElBQUksbUJBQU8sRUFBRSxDQUFDO0lBRTlCLE9BQU87U0FDSixJQUFJLENBQUMsdUJBQXVCLENBQUM7U0FDN0IsV0FBVyxDQUFDLHFCQUFxQixDQUFDO1NBQ2xDLE9BQU8sQ0FBQyxPQUFPLENBQUM7U0FDaEIsTUFBTSxDQUFDLHlCQUF5QixFQUFFLHlDQUF5QyxFQUFFLFlBQVksQ0FBQztTQUMxRixNQUFNLENBQUMsdUJBQXVCLEVBQUUsd0RBQXdELEVBQUUsS0FBSyxDQUFDO1NBQ2hHLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxVQUFVLEVBQUUsOEJBQThCLENBQUM7U0FDekUsTUFBTSxDQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDO1NBQ3hDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsc0JBQXNCLEVBQUUsS0FBSyxDQUFDO1NBQ2xELE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDO1NBQzlDLEtBQUssRUFBRSxDQUFDO0lBRVgsT0FBTyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDeEIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsS0FBSyxVQUFVLHdCQUF3QixDQUNyQyxXQUFtQixFQUNuQixpQkFBd0M7SUFFeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxh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QUFPLEVBQUUsQ0FBQztZQUUzQixJQUFJLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkMsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUVsQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFM0MsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFLENBQUM7WUFDM0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7QUFDSCxDQUFDO0FBRUQsNkJBQTZCO0FBQzdCLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUM1QixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiB0cy1ub2RlXG5cbi8qKlxuICog44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiBcbiAqIOWun+acrOeVqueSsOWig+OBp+OBruOCt+OCueODhuODoOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOOCkuWun+ihjFxuICog44Kz44Oe44Oz44OJ44Op44Kk44Oz5byV5pWw44Gn55Kw5aKD44Go44OG44K544OI44K/44Kk44OX44KS5oyH5a6a5Y+v6IO9XG4gKiBcbiAqIOS9v+eUqOS+izpcbiAqIG5wbSBydW4gdGVzdDpwZXJmb3JtYW5jZTpwcm9kdWN0aW9uXG4gKiBucG0gcnVuIHRlc3Q6cGVyZm9ybWFuY2U6c3RhZ2luZ1xuICogdHMtbm9kZSBydW4tcGVyZm9ybWFuY2UtdGVzdHMudHMgLS1lbnYgcHJvZHVjdGlvbiAtLXR5cGUgYWxsXG4gKiB0cy1ub2RlIHJ1bi1wZXJmb3JtYW5jZS10ZXN0cy50cyAtLWVudiBzdGFnaW5nIC0tdHlwZSBjb25jdXJyZW50XG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgeyBDb21tYW5kIH0gZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCBQZXJmb3JtYW5jZVRlc3RSdW5uZXIgZnJvbSAnLi9wZXJmb3JtYW5jZS10ZXN0LXJ1bm5lcic7XG5pbXBvcnQgUHJvZHVjdGlvblRlc3RFbmdpbmUgZnJvbSAnLi4vLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcbmltcG9ydCB7IFByb2R1Y3Rpb25Db25maWcsIGdldFByb2R1Y3Rpb25Db25maWcgfSBmcm9tICcuLi8uLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuaW1wb3J0IHsgXG4gIGdldFBlcmZvcm1hbmNlQ29uZmlnLCBcbiAgdmFsaWRhdGVQZXJmb3JtYW5jZUNvbmZpZywgXG4gIGRpc3BsYXlQZXJmb3JtYW5jZUNvbmZpZyxcbiAgUGVyZm9ybWFuY2VUZXN0Q29uZmlnIFxufSBmcm9tICcuL3BlcmZvcm1hbmNlLWNvbmZpZyc7XG5pbXBvcnQgRW1lcmdlbmN5U3RvcE1hbmFnZXIgZnJvbSAnLi4vLi4vY29yZS9lbWVyZ2VuY3ktc3RvcC1tYW5hZ2VyJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8qKlxuICog44OG44K544OI44K/44Kk44OX44Gu5a6a576pXG4gKi9cbnR5cGUgVGVzdFR5cGUgPSAnYWxsJyB8ICdiYXNpYycgfCAnY29uY3VycmVudCcgfCAncmVzb3VyY2UnIHwgJ3NjYWxhYmlsaXR5JztcblxuLyoqXG4gKiDjgrPjg57jg7Pjg4njg6njgqTjg7PlvJXmlbDjga7op6PmnpBcbiAqL1xuZnVuY3Rpb24gcGFyc2VBcmd1bWVudHMoKSB7XG4gIGNvbnN0IHByb2dyYW0gPSBuZXcgQ29tbWFuZCgpO1xuICBcbiAgcHJvZ3JhbVxuICAgIC5uYW1lKCdydW4tcGVyZm9ybWFuY2UtdGVzdHMnKVxuICAgIC5kZXNjcmlwdGlvbign5a6f5pys55Wq55Kw5aKD44Gn44Gu44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI5a6f6KGMJylcbiAgICAudmVyc2lvbignMS4wLjAnKVxuICAgIC5vcHRpb24oJy1lLCAtLWVudiA8ZW52aXJvbm1lbnQ+JywgJ+Wun+ihjOeSsOWigyAocHJvZHVjdGlvbiwgc3RhZ2luZywgZGV2ZWxvcG1lbnQpJywgJ3Byb2R1Y3Rpb24nKVxuICAgIC5vcHRpb24oJy10LCAtLXR5cGUgPHRlc3RUeXBlPicsICfjg4bjgrnjg4jjgr/jgqTjg5cgKGFsbCwgYmFzaWMsIGNvbmN1cnJlbnQsIHJlc291cmNlLCBzY2FsYWJpbGl0eSknLCAnYWxsJylcbiAgICAub3B0aW9uKCctciwgLS1yZXBvcnQgPHBhdGg+JywgJ+ODrOODneODvOODiOWHuuWKm+ODkeOCuScsICcuL3BlcmZvcm1hbmNlLXRlc3QtcmVwb3J0Lm1kJylcbiAgICAub3B0aW9uKCctdiwgLS12ZXJib3NlJywgJ+ips+e0sOODreOCsOWHuuWKmycsIGZhbHNlKVxuICAgIC5vcHRpb24oJy0tZHJ5LXJ1bicsICfjg4njg6njgqTjg6njg7Plrp/ooYzvvIjlrp/pmpvjga7jg4bjgrnjg4jjga/ooYzjgo/jgarjgYTvvIknLCBmYWxzZSlcbiAgICAub3B0aW9uKCctLWVtZXJnZW5jeS1zdG9wJywgJ+e3iuaApeWBnOatouapn+iDveOCkuacieWKueWMlicsIHRydWUpXG4gICAgLnBhcnNlKCk7XG5cbiAgcmV0dXJuIHByb2dyYW0ub3B0cygpO1xufVxuXG4vKipcbiAqIOeSsOWig+ioreWumuOBruaknOiovOOBqOihqOekulxuICovXG5hc3luYyBmdW5jdGlvbiB2YWxpZGF0ZUFuZERpc3BsYXlDb25maWcoXG4gIGVudmlyb25tZW50OiBzdHJpbmcsXG4gIHBlcmZvcm1hbmNlQ29uZmlnOiBQZXJmb3JtYW5jZVRlc3RDb25maWdcbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zb2xlLmxvZygn8J+UjSDoqK3lrprmpJzoqLzkuK0uLi4nKTtcbiAgXG4gIC8vIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOioreWumuOBruaknOiovFxuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVQZXJmb3JtYW5jZUNvbmZpZyhwZXJmb3JtYW5jZUNvbmZpZyk7XG4gIFxuICBpZiAoIXZhbGlkYXRpb24uaXNWYWxpZCkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4joqK3lrprjgqjjg6njg7w6Jyk7XG4gICAgdmFsaWRhdGlvbi5lcnJvcnMuZm9yRWFjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGAgICAtICR7ZXJyb3J9YCkpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgaWYgKHZhbGlkYXRpb24ud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnNvbGUud2Fybign4pqg77iPIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOioreWumuitpuWRijonKTtcbiAgICB2YWxpZGF0aW9uLndhcm5pbmdzLmZvckVhY2god2FybmluZyA9PiBjb25zb2xlLndhcm4oYCAgIC0gJHt3YXJuaW5nfWApKTtcbiAgfVxuICBcbiAgLy8g6Kit5a6a44Gu6KGo56S6XG4gIGRpc3BsYXlQZXJmb3JtYW5jZUNvbmZpZyhwZXJmb3JtYW5jZUNvbmZpZyk7XG4gIFxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiDlgIvliKXjg4bjgrnjg4jjga7lrp/ooYxcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuSW5kaXZpZHVhbFRlc3QoXG4gIHRlc3RSdW5uZXI6IFBlcmZvcm1hbmNlVGVzdFJ1bm5lcixcbiAgdGVzdFR5cGU6IFRlc3RUeXBlXG4pOiBQcm9taXNlPGFueT4ge1xuICBjb25zdCB0ZXN0TW9kdWxlID0gKHRlc3RSdW5uZXIgYXMgYW55KS50ZXN0TW9kdWxlO1xuICBcbiAgc3dpdGNoICh0ZXN0VHlwZSkge1xuICAgIGNhc2UgJ2Jhc2ljJzpcbiAgICAgIGNvbnNvbGUubG9nKCfimqEg5Z+65pys44Os44K544Od44Oz44K55pmC6ZaT44OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgICByZXR1cm4gYXdhaXQgdGVzdE1vZHVsZS50ZXN0QmFzaWNSZXNwb25zZVRpbWUoKTtcbiAgICAgIFxuICAgIGNhc2UgJ2NvbmN1cnJlbnQnOlxuICAgICAgY29uc29sZS5sb2coJ/CflIQg5ZCM5pmC5o6l57aa6LKg6I2344OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgICByZXR1cm4gYXdhaXQgdGVzdE1vZHVsZS50ZXN0Q29uY3VycmVudExvYWQoKTtcbiAgICAgIFxuICAgIGNhc2UgJ3Jlc291cmNlJzpcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OKIOODquOCveODvOOCueS9v+eUqOeOh+ODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuICAgICAgcmV0dXJuIGF3YWl0IHRlc3RNb2R1bGUudGVzdFJlc291cmNlVXRpbGl6YXRpb24oKTtcbiAgICAgIFxuICAgIGNhc2UgJ3NjYWxhYmlsaXR5JzpcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OIIOOCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuICAgICAgcmV0dXJuIGF3YWl0IHRlc3RNb2R1bGUudGVzdFNjYWxhYmlsaXR5KCk7XG4gICAgICBcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGDmnKrlr77lv5zjga7jg4bjgrnjg4jjgr/jgqTjg5c6ICR7dGVzdFR5cGV9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jntZDmnpzjga7jg6zjg53jg7zjg4jnlJ/miJBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVUZXN0UmVwb3J0KFxuICByZXN1bHRzOiBNYXA8c3RyaW5nLCBhbnk+LFxuICB0ZXN0UnVubmVyOiBQZXJmb3JtYW5jZVRlc3RSdW5uZXIsXG4gIHJlcG9ydFBhdGg6IHN0cmluZyxcbiAgZW52aXJvbm1lbnQ6IHN0cmluZ1xuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCfwn5OdIOODhuOCueODiOODrOODneODvOODiOOCkueUn+aIkOS4rS4uLicpO1xuICBcbiAgdHJ5IHtcbiAgICBjb25zdCByZXBvcnQgPSBhd2FpdCB0ZXN0UnVubmVyLmdlbmVyYXRlRGV0YWlsZWRSZXBvcnQocmVzdWx0cyk7XG4gICAgXG4gICAgLy8g44Os44Od44O844OI44OV44Kh44Kk44Or44Gu5L+d5a2YXG4gICAgY29uc3QgcmVwb3J0RGlyID0gcGF0aC5kaXJuYW1lKHJlcG9ydFBhdGgpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhyZXBvcnREaXIpKSB7XG4gICAgICBmcy5ta2RpclN5bmMocmVwb3J0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgXG4gICAgZnMud3JpdGVGaWxlU3luYyhyZXBvcnRQYXRoLCByZXBvcnQsICd1dGY4Jyk7XG4gICAgXG4gICAgY29uc29sZS5sb2coYOKchSDjg4bjgrnjg4jjg6zjg53jg7zjg4jjgpLkv53lrZjjgZfjgb7jgZfjgZ86ICR7cmVwb3J0UGF0aH1gKTtcbiAgICBcbiAgICAvLyDnsKHmmJPjgrXjg57jg6rjg7zjga7ooajnpLpcbiAgICBjb25zdCBzdW1tYXJ5ID0gQXJyYXkuZnJvbShyZXN1bHRzLnZhbHVlcygpKTtcbiAgICBjb25zdCBzdWNjZXNzQ291bnQgPSBzdW1tYXJ5LmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIGNvbnN0IHRvdGFsQ291bnQgPSBzdW1tYXJ5Lmxlbmd0aDtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJ/Cfk4og44OG44K544OI5a6f6KGM44K144Oe44Oq44O8OicpO1xuICAgIGNvbnNvbGUubG9nKGAgICDnkrDlooM6ICR7ZW52aXJvbm1lbnR9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOe3j+ODhuOCueODiOaVsDogJHt0b3RhbENvdW50fWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDmiJDlip86ICR7c3VjY2Vzc0NvdW50fWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDlpLHmlZc6ICR7dG90YWxDb3VudCAtIHN1Y2Nlc3NDb3VudH1gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg5oiQ5Yqf546HOiAkeygoc3VjY2Vzc0NvdW50IC8gdG90YWxDb3VudCkgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg6zjg53jg7zjg4jnlJ/miJDjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbi8qKlxuICog44OJ44Op44Kk44Op44Oz5a6f6KGMXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bkRyeVJ1bihcbiAgZW52aXJvbm1lbnQ6IHN0cmluZyxcbiAgdGVzdFR5cGU6IFRlc3RUeXBlLFxuICBwZXJmb3JtYW5jZUNvbmZpZzogUGVyZm9ybWFuY2VUZXN0Q29uZmlnXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc29sZS5sb2coJ/CflI0g44OJ44Op44Kk44Op44Oz5a6f6KGM5LitLi4uJyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgXG4gIGNvbnNvbGUubG9nKCfwn5OLIOWun+ihjOS6iOWumuOBruODhuOCueODiDonKTtcbiAgXG4gIGlmICh0ZXN0VHlwZSA9PT0gJ2FsbCcpIHtcbiAgICBjb25zb2xlLmxvZygnICAg4pyTIOWfuuacrOODrOOCueODneODs+OCueaZgumWk+ODhuOCueODiCcpO1xuICAgIGNvbnNvbGUubG9nKCcgICDinJMg5ZCM5pmC5o6l57aa6LKg6I2344OG44K544OIJyk7XG4gICAgY29uc29sZS5sb2coJyAgIOKckyDjg6rjgr3jg7zjgrnkvb/nlKjnjofjg4bjgrnjg4gnKTtcbiAgICBjb25zb2xlLmxvZygnICAg4pyTIOOCueOCseODvOODqeODk+ODquODhuOCo+ODhuOCueODiCcpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKGAgICDinJMgJHt0ZXN0VHlwZX3jg4bjgrnjg4hgKTtcbiAgfVxuICBcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygn8J+TiiDkuojmg7Plrp/ooYzmmYLplpM6Jyk7XG4gIFxuICBsZXQgZXN0aW1hdGVkRHVyYXRpb24gPSAwO1xuICBpZiAodGVzdFR5cGUgPT09ICdhbGwnKSB7XG4gICAgZXN0aW1hdGVkRHVyYXRpb24gPSAyICsgMyArIDUgKyAxMDsgLy8g5ZCE44OG44K544OI44Gu5LqI5oOz5pmC6ZaT77yI5YiG77yJXG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZHVyYXRpb25zID0geyBiYXNpYzogMiwgY29uY3VycmVudDogMywgcmVzb3VyY2U6IDUsIHNjYWxhYmlsaXR5OiAxMCB9O1xuICAgIGVzdGltYXRlZER1cmF0aW9uID0gZHVyYXRpb25zW3Rlc3RUeXBlIGFzIGtleW9mIHR5cGVvZiBkdXJhdGlvbnNdIHx8IDU7XG4gIH1cbiAgXG4gIGNvbnNvbGUubG9nKGAgICDkuojmg7Plrp/ooYzmmYLplpM6IOe0hCR7ZXN0aW1hdGVkRHVyYXRpb2595YiGYCk7XG4gIGNvbnNvbGUubG9nKGAgICDmnIDlpKfjgrPjgrnjg4g6ICQke3BlcmZvcm1hbmNlQ29uZmlnLmNvc3RMaW1pdHMubWF4VGVzdENvc3R9YCk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgXG4gIGNvbnNvbGUubG9nKCfwn5uh77iPIOWuieWFqOioreWumjonKTtcbiAgY29uc29sZS5sb2coYCAgIOe3iuaApeWBnOatojogJHtwZXJmb3JtYW5jZUNvbmZpZy5zYWZldHkuZW5hYmxlRW1lcmdlbmN5U3RvcCA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDmnIDlpKflrp/ooYzmmYLplpM6ICR7cGVyZm9ybWFuY2VDb25maWcuc2FmZXR5Lm1heFRlc3REdXJhdGlvbn3np5JgKTtcbiAgY29uc29sZS5sb2coYCAgIOiHquWLleOCs+OCueODiOWBnOatojogJHtwZXJmb3JtYW5jZUNvbmZpZy5zYWZldHkuYXV0b1N0b3BPbkhpZ2hDb3N0ID8gJ+acieWKuScgOiAn54Sh5Yq5J31gKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ+KchSDjg4njg6njgqTjg6njg7PlrozkuoYgLSDlrp/pmpvjga7jg4bjgrnjg4jjga/lrp/ooYzjgZXjgozjgb7jgZvjgpPjgafjgZfjgZ8nKTtcbn1cblxuLyoqXG4gKiDjg6HjgqTjg7Plrp/ooYzplqLmlbBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbWFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgb3B0aW9ucyA9IHBhcnNlQXJndW1lbnRzKCk7XG4gIFxuICBjb25zb2xlLmxvZygn8J+agCDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jlrp/ooYzplovlp4snKTtcbiAgY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtvcHRpb25zLmVudn1gKTtcbiAgY29uc29sZS5sb2coYCAgIOODhuOCueODiOOCv+OCpOODlzogJHtvcHRpb25zLnR5cGV9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDjg6zjg53jg7zjg4jlh7rlips6ICR7b3B0aW9ucy5yZXBvcnR9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDjg4njg6njgqTjg6njg7M6ICR7b3B0aW9ucy5kcnlSdW4gPyAn44Gv44GEJyA6ICfjgYTjgYTjgYgnfWApO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIFxuICB0cnkge1xuICAgIC8vIOioreWumuOBruiqreOBv+i+vOOBv1xuICAgIGNvbnN0IHByb2R1Y3Rpb25Db25maWcgPSBnZXRQcm9kdWN0aW9uQ29uZmlnKG9wdGlvbnMuZW52KTtcbiAgICBjb25zdCBwZXJmb3JtYW5jZUNvbmZpZyA9IGdldFBlcmZvcm1hbmNlQ29uZmlnKG9wdGlvbnMuZW52KTtcbiAgICBcbiAgICAvLyDoqK3lrprjga7mpJzoqLxcbiAgICBjb25zdCBpc0NvbmZpZ1ZhbGlkID0gYXdhaXQgdmFsaWRhdGVBbmREaXNwbGF5Q29uZmlnKG9wdGlvbnMuZW52LCBwZXJmb3JtYW5jZUNvbmZpZyk7XG4gICAgaWYgKCFpc0NvbmZpZ1ZhbGlkKSB7XG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuICAgIFxuICAgIC8vIOODieODqeOCpOODqeODs+Wun+ihjFxuICAgIGlmIChvcHRpb25zLmRyeVJ1bikge1xuICAgICAgYXdhaXQgcnVuRHJ5UnVuKG9wdGlvbnMuZW52LCBvcHRpb25zLnR5cGUgYXMgVGVzdFR5cGUsIHBlcmZvcm1hbmNlQ29uZmlnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgLy8g57eK5oCl5YGc5q2i44Oe44ON44O844K444Oj44O844Gu5Yid5pyf5YyWXG4gICAgbGV0IGVtZXJnZW5jeVN0b3BNYW5hZ2VyOiBFbWVyZ2VuY3lTdG9wTWFuYWdlciB8IHVuZGVmaW5lZDtcbiAgICBpZiAob3B0aW9ucy5lbWVyZ2VuY3lTdG9wKSB7XG4gICAgICBlbWVyZ2VuY3lTdG9wTWFuYWdlciA9IG5ldyBFbWVyZ2VuY3lTdG9wTWFuYWdlcih7XG4gICAgICAgIG1heFRlc3REdXJhdGlvbjogcGVyZm9ybWFuY2VDb25maWcuc2FmZXR5Lm1heFRlc3REdXJhdGlvbiAqIDEwMDAsXG4gICAgICAgIHJlc291cmNlVGhyZXNob2xkOiBwZXJmb3JtYW5jZUNvbmZpZy5zYWZldHkucmVzb3VyY2VVc2FnZVRocmVzaG9sZCxcbiAgICAgICAgY29zdFRocmVzaG9sZDogcGVyZm9ybWFuY2VDb25maWcuY29zdExpbWl0cy5tYXhUZXN0Q29zdCxcbiAgICAgICAgZW5hYmxlQXV0b1N0b3A6IHBlcmZvcm1hbmNlQ29uZmlnLnNhZmV0eS5hdXRvU3RvcE9uSGlnaENvc3RcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBhd2FpdCBlbWVyZ2VuY3lTdG9wTWFuYWdlci5pbml0aWFsaXplKCk7XG4gICAgICBjb25zb2xlLmxvZygn8J+boe+4jyDnt4rmgKXlgZzmraLjg57jg43jg7zjgrjjg6Pjg7zjgpLliJ3mnJ/ljJbjgZfjgb7jgZfjgZ8nKTtcbiAgICB9XG4gICAgXG4gICAgLy8g44OG44K544OI44Ko44Oz44K444Oz44Gu5Yid5pyf5YyWXG4gICAgY29uc3QgdGVzdEVuZ2luZSA9IG5ldyBQcm9kdWN0aW9uVGVzdEVuZ2luZShwcm9kdWN0aW9uQ29uZmlnKTtcbiAgICBhd2FpdCB0ZXN0RW5naW5lLmluaXRpYWxpemUoKTtcbiAgICBcbiAgICAvLyDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jjg6njg7Pjg4rjg7zjga7liJ3mnJ/ljJZcbiAgICBjb25zdCB0ZXN0UnVubmVyID0gbmV3IFBlcmZvcm1hbmNlVGVzdFJ1bm5lcihwcm9kdWN0aW9uQ29uZmlnLCB0ZXN0RW5naW5lKTtcbiAgICBcbiAgICBsZXQgcmVzdWx0czogTWFwPHN0cmluZywgYW55PjtcbiAgICBcbiAgICB0cnkge1xuICAgICAgaWYgKG9wdGlvbnMudHlwZSA9PT0gJ2FsbCcpIHtcbiAgICAgICAgLy8g5YWo44OG44K544OI44Gu5a6f6KGMXG4gICAgICAgIGNvbnN0IHRlc3RSZXN1bHRzID0gYXdhaXQgdGVzdFJ1bm5lci5ydW5QZXJmb3JtYW5jZVRlc3RzKCk7XG4gICAgICAgIHJlc3VsdHMgPSB0ZXN0UmVzdWx0cy5yZXN1bHRzO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICBjb25zb2xlLmxvZygn8J+TiiDlhajjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jlrozkuoY6Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmiJDlip/njoc6ICR7KHRlc3RSZXN1bHRzLnN1bW1hcnkuc3VjY2Vzc1JhdGUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg57eP5ZCI44OR44OV44Kp44O844Oe44Oz44K544K544Kz44KiOiAkeyh0ZXN0UmVzdWx0cy5zdW1tYXJ5Lm92ZXJhbGxQZXJmb3JtYW5jZVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOW5s+Wdh+W/nOetlOaZgumWkzogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5LmF2ZXJhZ2VSZXNwb25zZVRpbWUudG9GaXhlZCgwKX1tc2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5pyA5aSn44K544Or44O844OX44OD44OIOiAke3Rlc3RSZXN1bHRzLnN1bW1hcnkubWF4VGhyb3VnaHB1dC50b0ZpeGVkKDIpfSByZXEvc2VjYCk7XG4gICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8g5YCL5Yil44OG44K544OI44Gu5a6f6KGMXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJ1bkluZGl2aWR1YWxUZXN0KHRlc3RSdW5uZXIsIG9wdGlvbnMudHlwZSBhcyBUZXN0VHlwZSk7XG4gICAgICAgIHJlc3VsdHMgPSBuZXcgTWFwKFtbcmVzdWx0LnRlc3RJZCwgcmVzdWx0XV0pO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiiAke29wdGlvbnMudHlwZX3jg4bjgrnjg4jlrozkuoY6YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDjgrnjg4bjg7zjgr/jgrk6ICR7cmVzdWx0LnN1Y2Nlc3MgPyAn5oiQ5YqfJyA6ICflpLHmlZcnfWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5a6f6KGM5pmC6ZaTOiAke3Jlc3VsdC5kdXJhdGlvbn1tc2ApO1xuICAgICAgICBcbiAgICAgICAgaWYgKHJlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3MpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICAg5b+c562U5pmC6ZaTOiAke3Jlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3MucmVzcG9uc2VUaW1lLnRvRml4ZWQoMCl9bXNgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICAg44K544Or44O844OX44OD44OIOiAke3Jlc3VsdC5wZXJmb3JtYW5jZU1ldHJpY3MudGhyb3VnaHB1dC50b0ZpeGVkKDIpfSByZXEvc2VjYCk7XG4gICAgICAgICAgY29uc29sZS5sb2coYCAgIOOCqOODqeODvOeOhzogJHsocmVzdWx0LnBlcmZvcm1hbmNlTWV0cmljcy5lcnJvclJhdGUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIOODrOODneODvOODiOeUn+aIkFxuICAgICAgYXdhaXQgZ2VuZXJhdGVUZXN0UmVwb3J0KHJlc3VsdHMsIHRlc3RSdW5uZXIsIG9wdGlvbnMucmVwb3J0LCBvcHRpb25zLmVudik7XG4gICAgICBcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8g44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAgICBhd2FpdCB0ZXN0UnVubmVyLmNsZWFudXAoKTtcbiAgICAgIGF3YWl0IHRlc3RFbmdpbmUuY2xlYW51cCgpO1xuICAgICAgXG4gICAgICBpZiAoZW1lcmdlbmN5U3RvcE1hbmFnZXIpIHtcbiAgICAgICAgYXdhaXQgZW1lcmdlbmN5U3RvcE1hbmFnZXIuY2xlYW51cCgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJ+KchSDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jlrp/ooYzlrozkuoYnKTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICBcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign44Ko44Op44O86Kmz57SwOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgaWYgKG9wdGlvbnMudmVyYm9zZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfjgrnjgr/jg4Pjgq/jg4jjg6zjg7zjgrk6JywgZXJyb3Iuc3RhY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH1cbn1cblxuLy8g44K544Kv44Oq44OX44OI44GM55u05o6l5a6f6KGM44GV44KM44Gf5aC05ZCI44Gu44G/bWFpbumWouaVsOOCkuWun+ihjFxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4oKS5jYXRjaChlcnJvciA9PiB7XG4gICAgY29uc29sZS5lcnJvcign5LqI5pyf44GX44Gq44GE44Ko44Op44O8OicsIGVycm9yKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH0pO1xufVxuXG5leHBvcnQgeyBtYWluIGFzIHJ1blBlcmZvcm1hbmNlVGVzdHMgfTsiXX0=