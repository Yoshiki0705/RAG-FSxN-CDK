#!/usr/bin/env ts-node
"use strict";
/**
 * 認証・認可テストスイート実行スクリプト
 *
 * SIDベース認証、マルチリージョン認証、セッション管理の包括テスト
 * 実本番AWS環境での認証システム品質保証
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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const production_config_1 = require("../config/production-config");
const production_test_engine_1 = __importDefault(require("../core/production-test-engine"));
const authentication_test_runner_1 = __importDefault(require("../modules/authentication/authentication-test-runner"));
/**
 * メイン実行関数
 */
async function main() {
    console.log('🚀 認証・認可テストスイート実行開始');
    console.log('='.repeat(60));
    try {
        // 1. 設定の検証
        console.log('📋 本番環境設定を検証中...');
        const configValidation = (0, production_config_1.validateProductionConfig)(production_config_1.defaultProductionConfig);
        if (!configValidation.isValid) {
            console.error('❌ 設定検証失敗:');
            configValidation.errors.forEach(error => console.error(`   - ${error}`));
            process.exit(1);
        }
        if (configValidation.warnings.length > 0) {
            console.log('⚠️  設定警告:');
            configValidation.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
        console.log('✅ 本番環境設定検証完了');
        // 2. 実行設定の読み込み
        const executionConfig = {
            includeBasicAuth: process.env.INCLUDE_BASIC_AUTH !== 'false',
            includeSIDAuth: process.env.INCLUDE_SID_AUTH !== 'false',
            includeMultiRegion: process.env.INCLUDE_MULTI_REGION !== 'false',
            generateReport: process.env.GENERATE_REPORT !== 'false',
            outputDirectory: process.env.OUTPUT_DIR || './test-results',
            verbose: process.env.VERBOSE === 'true'
        };
        console.log('📋 実行設定:');
        console.log(`   基本認証テスト: ${executionConfig.includeBasicAuth ? '有効' : '無効'}`);
        console.log(`   SIDベース認証テスト: ${executionConfig.includeSIDAuth ? '有効' : '無効'}`);
        console.log(`   マルチリージョンテスト: ${executionConfig.includeMultiRegion ? '有効' : '無効'}`);
        console.log(`   レポート生成: ${executionConfig.generateReport ? '有効' : '無効'}`);
        console.log(`   出力ディレクトリ: ${executionConfig.outputDirectory}`);
        // 3. 出力ディレクトリの準備
        if (executionConfig.generateReport) {
            if (!fs.existsSync(executionConfig.outputDirectory)) {
                fs.mkdirSync(executionConfig.outputDirectory, { recursive: true });
                console.log(`📁 出力ディレクトリを作成: ${executionConfig.outputDirectory}`);
            }
        }
        // 4. テストエンジンの初期化
        console.log('🔧 テストエンジンを初期化中...');
        const testEngine = new production_test_engine_1.default(production_config_1.defaultProductionConfig);
        // 5. 認証テストランナーの初期化
        console.log('🔧 認証テストランナーを初期化中...');
        const authTestRunner = new authentication_test_runner_1.default(production_config_1.defaultProductionConfig, testEngine);
        // 6. 認証テストの実行
        console.log('🚀 認証テストを実行中...');
        console.log('-'.repeat(60));
        const startTime = Date.now();
        const testResults = await authTestRunner.runAuthenticationTests();
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        console.log('-'.repeat(60));
        console.log('📊 認証テスト実行完了');
        // 7. 結果の表示
        console.log('📈 実行結果サマリー:');
        console.log(`   総実行時間: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}秒)`);
        console.log(`   総テスト数: ${testResults.summary.totalTests}`);
        console.log(`   成功: ${testResults.summary.passedTests}`);
        console.log(`   失敗: ${testResults.summary.failedTests}`);
        console.log(`   スキップ: ${testResults.summary.skippedTests}`);
        console.log(`   成功率: ${(testResults.summary.successRate * 100).toFixed(1)}%`);
        // 8. 詳細結果の表示（verbose モード）
        if (executionConfig.verbose) {
            console.log('\n📋 詳細テスト結果:');
            for (const [testId, result] of testResults.results) {
                const status = result.success ? '✅' : '❌';
                const duration = result.duration || 0;
                console.log(`   ${status} ${result.testName} (${testId}) - ${duration}ms`);
                if (!result.success && result.error) {
                    console.log(`      エラー: ${result.error}`);
                }
            }
        }
        // 9. レポート生成
        if (executionConfig.generateReport) {
            console.log('\n📄 詳細レポートを生成中...');
            const report = await authTestRunner.generateDetailedReport(testResults.results);
            const reportPath = path.join(executionConfig.outputDirectory, `auth-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
            fs.writeFileSync(reportPath, report, 'utf8');
            console.log(`✅ 詳細レポートを生成: ${reportPath}`);
            // JSON形式の結果も保存
            const jsonResults = {
                timestamp: new Date().toISOString(),
                config: {
                    region: production_config_1.defaultProductionConfig.region,
                    environment: production_config_1.defaultProductionConfig.environment,
                    safetyMode: production_config_1.defaultProductionConfig.safetyMode,
                    readOnlyMode: production_config_1.defaultProductionConfig.readOnlyMode
                },
                summary: testResults.summary,
                results: Array.from(testResults.results.entries()).map(([testId, result]) => ({
                    testId,
                    ...result
                }))
            };
            const jsonPath = path.join(executionConfig.outputDirectory, `auth-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(jsonResults, null, 2), 'utf8');
            console.log(`✅ JSON結果を保存: ${jsonPath}`);
        }
        // 10. クリーンアップ
        console.log('\n🧹 リソースをクリーンアップ中...');
        await authTestRunner.cleanup();
        await testEngine.cleanup();
        // 11. 終了処理
        const overallSuccess = testResults.success;
        console.log('\n' + '='.repeat(60));
        if (overallSuccess) {
            console.log('🎉 認証・認可テストスイート実行成功');
            console.log('✅ 全ての認証機能が正常に動作しています');
        }
        else {
            console.log('⚠️  認証・認可テストスイート実行完了（一部失敗）');
            console.log('❌ 一部の認証機能に問題があります');
        }
        console.log(`📊 最終結果: ${testResults.summary.passedTests}/${testResults.summary.totalTests} テスト成功`);
        console.log('='.repeat(60));
        // 終了コードの設定
        process.exit(overallSuccess ? 0 : 1);
    }
    catch (error) {
        console.error('\n❌ 認証テスト実行中にエラーが発生しました:');
        console.error(error);
        if (error instanceof Error) {
            console.error(`エラー詳細: ${error.message}`);
            if (error.stack) {
                console.error(`スタックトレース:\n${error.stack}`);
            }
        }
        process.exit(1);
    }
}
/**
 * 緊急停止ハンドラー
 */
process.on('SIGINT', () => {
    console.log('\n🛑 緊急停止シグナルを受信しました');
    console.log('🧹 安全にクリーンアップ中...');
    process.exit(130);
});
process.on('SIGTERM', () => {
    console.log('\n🛑 終了シグナルを受信しました');
    console.log('🧹 安全にクリーンアップ中...');
    process.exit(143);
});
// 未処理の例外をキャッチ
process.on('uncaughtException', (error) => {
    console.error('\n💥 未処理の例外が発生しました:');
    console.error(error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n💥 未処理のPromise拒否が発生しました:');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    process.exit(1);
});
// メイン関数の実行
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ メイン関数実行エラー:', error);
        process.exit(1);
    });
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLWF1dGhlbnRpY2F0aW9uLXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLWF1dGhlbnRpY2F0aW9uLXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwyQ0FBNkI7QUFDN0IsdUNBQXlCO0FBQ3pCLG1FQUFnRztBQUNoRyw0RkFBa0U7QUFDbEUsc0hBQTRGO0FBYzVGOztHQUVHO0FBQ0gsS0FBSyxVQUFVLElBQUk7SUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTdCLElBQUksQ0FBQztRQUNILFdBQVc7UUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDaEMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLDRDQUF3QixFQUFDLDJDQUF1QixDQUFDLENBQUM7UUFFM0UsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDM0IsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRUQsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekIsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFB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LEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3JCLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgdHMtbm9kZVxuXG4vKipcbiAqIOiqjeiovOODu+iqjeWPr+ODhuOCueODiOOCueOCpOODvOODiOWun+ihjOOCueOCr+ODquODl+ODiFxuICogXG4gKiBTSUTjg5njg7zjgrnoqo3oqLzjgIHjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7Poqo3oqLzjgIHjgrvjg4Pjgrfjg6fjg7PnrqHnkIbjga7ljIXmi6zjg4bjgrnjg4hcbiAqIOWun+acrOeVqkFXU+eSsOWig+OBp+OBruiqjeiovOOCt+OCueODhuODoOWTgeizquS/neiovFxuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IGRlZmF1bHRQcm9kdWN0aW9uQ29uZmlnLCB2YWxpZGF0ZVByb2R1Y3Rpb25Db25maWcgfSBmcm9tICcuLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lIGZyb20gJy4uL2NvcmUvcHJvZHVjdGlvbi10ZXN0LWVuZ2luZSc7XG5pbXBvcnQgQXV0aGVudGljYXRpb25UZXN0UnVubmVyIGZyb20gJy4uL21vZHVsZXMvYXV0aGVudGljYXRpb24vYXV0aGVudGljYXRpb24tdGVzdC1ydW5uZXInO1xuXG4vKipcbiAqIOiqjeiovOODhuOCueODiOWun+ihjOOBruioreWumlxuICovXG5pbnRlcmZhY2UgQXV0aFRlc3RFeGVjdXRpb25Db25maWcge1xuICBpbmNsdWRlQmFzaWNBdXRoOiBib29sZWFuO1xuICBpbmNsdWRlU0lEQXV0aDogYm9vbGVhbjtcbiAgaW5jbHVkZU11bHRpUmVnaW9uOiBib29sZWFuO1xuICBnZW5lcmF0ZVJlcG9ydDogYm9vbGVhbjtcbiAgb3V0cHV0RGlyZWN0b3J5OiBzdHJpbmc7XG4gIHZlcmJvc2U6IGJvb2xlYW47XG59XG5cbi8qKlxuICog44Oh44Kk44Oz5a6f6KGM6Zai5pWwXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCfwn5qAIOiqjeiovOODu+iqjeWPr+ODhuOCueODiOOCueOCpOODvOODiOWun+ihjOmWi+WniycpO1xuICBjb25zb2xlLmxvZygnPScgLnJlcGVhdCg2MCkpO1xuXG4gIHRyeSB7XG4gICAgLy8gMS4g6Kit5a6a44Gu5qSc6Ki8XG4gICAgY29uc29sZS5sb2coJ/Cfk4sg5pys55Wq55Kw5aKD6Kit5a6a44KS5qSc6Ki85LitLi4uJyk7XG4gICAgY29uc3QgY29uZmlnVmFsaWRhdGlvbiA9IHZhbGlkYXRlUHJvZHVjdGlvbkNvbmZpZyhkZWZhdWx0UHJvZHVjdGlvbkNvbmZpZyk7XG4gICAgXG4gICAgaWYgKCFjb25maWdWYWxpZGF0aW9uLmlzVmFsaWQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDoqK3lrprmpJzoqLzlpLHmlZc6Jyk7XG4gICAgICBjb25maWdWYWxpZGF0aW9uLmVycm9ycy5mb3JFYWNoKGVycm9yID0+IGNvbnNvbGUuZXJyb3IoYCAgIC0gJHtlcnJvcn1gKSk7XG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZ1ZhbGlkYXRpb24ud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS5sb2coJ+KaoO+4jyAg6Kit5a6a6K2m5ZGKOicpO1xuICAgICAgY29uZmlnVmFsaWRhdGlvbi53YXJuaW5ncy5mb3JFYWNoKHdhcm5pbmcgPT4gY29uc29sZS5sb2coYCAgIC0gJHt3YXJuaW5nfWApKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIOacrOeVqueSsOWig+ioreWumuaknOiovOWujOS6hicpO1xuXG4gICAgLy8gMi4g5a6f6KGM6Kit5a6a44Gu6Kqt44G/6L6844G/XG4gICAgY29uc3QgZXhlY3V0aW9uQ29uZmlnOiBBdXRoVGVzdEV4ZWN1dGlvbkNvbmZpZyA9IHtcbiAgICAgIGluY2x1ZGVCYXNpY0F1dGg6IHByb2Nlc3MuZW52LklOQ0xVREVfQkFTSUNfQVVUSCAhPT0gJ2ZhbHNlJyxcbiAgICAgIGluY2x1ZGVTSURBdXRoOiBwcm9jZXNzLmVudi5JTkNMVURFX1NJRF9BVVRIICE9PSAnZmFsc2UnLFxuICAgICAgaW5jbHVkZU11bHRpUmVnaW9uOiBwcm9jZXNzLmVudi5JTkNMVURFX01VTFRJX1JFR0lPTiAhPT0gJ2ZhbHNlJyxcbiAgICAgIGdlbmVyYXRlUmVwb3J0OiBwcm9jZXNzLmVudi5HRU5FUkFURV9SRVBPUlQgIT09ICdmYWxzZScsXG4gICAgICBvdXRwdXREaXJlY3Rvcnk6IHByb2Nlc3MuZW52Lk9VVFBVVF9ESVIgfHwgJy4vdGVzdC1yZXN1bHRzJyxcbiAgICAgIHZlcmJvc2U6IHByb2Nlc3MuZW52LlZFUkJPU0UgPT09ICd0cnVlJ1xuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZygn8J+TiyDlrp/ooYzoqK3lrpo6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIOWfuuacrOiqjeiovOODhuOCueODiDogJHtleGVjdXRpb25Db25maWcuaW5jbHVkZUJhc2ljQXV0aCA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIFNJROODmeODvOOCueiqjeiovOODhuOCueODiDogJHtleGVjdXRpb25Db25maWcuaW5jbHVkZVNJREF1dGggPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7Pjg4bjgrnjg4g6ICR7ZXhlY3V0aW9uQ29uZmlnLmluY2x1ZGVNdWx0aVJlZ2lvbiA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOODrOODneODvOODiOeUn+aIkDogJHtleGVjdXRpb25Db25maWcuZ2VuZXJhdGVSZXBvcnQgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6o6ICR7ZXhlY3V0aW9uQ29uZmlnLm91dHB1dERpcmVjdG9yeX1gKTtcblxuICAgIC8vIDMuIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBrua6luWCmVxuICAgIGlmIChleGVjdXRpb25Db25maWcuZ2VuZXJhdGVSZXBvcnQpIHtcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhleGVjdXRpb25Db25maWcub3V0cHV0RGlyZWN0b3J5KSkge1xuICAgICAgICBmcy5ta2RpclN5bmMoZXhlY3V0aW9uQ29uZmlnLm91dHB1dERpcmVjdG9yeSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OBIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOCkuS9nOaIkDogJHtleGVjdXRpb25Db25maWcub3V0cHV0RGlyZWN0b3J5fWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDQuIOODhuOCueODiOOCqOODs+OCuOODs+OBruWIneacn+WMllxuICAgIGNvbnNvbGUubG9nKCfwn5SnIOODhuOCueODiOOCqOODs+OCuOODs+OCkuWIneacn+WMluS4rS4uLicpO1xuICAgIGNvbnN0IHRlc3RFbmdpbmUgPSBuZXcgUHJvZHVjdGlvblRlc3RFbmdpbmUoZGVmYXVsdFByb2R1Y3Rpb25Db25maWcpO1xuXG4gICAgLy8gNS4g6KqN6Ki844OG44K544OI44Op44Oz44OK44O844Gu5Yid5pyf5YyWXG4gICAgY29uc29sZS5sb2coJ/CflKcg6KqN6Ki844OG44K544OI44Op44Oz44OK44O844KS5Yid5pyf5YyW5LitLi4uJyk7XG4gICAgY29uc3QgYXV0aFRlc3RSdW5uZXIgPSBuZXcgQXV0aGVudGljYXRpb25UZXN0UnVubmVyKGRlZmF1bHRQcm9kdWN0aW9uQ29uZmlnLCB0ZXN0RW5naW5lKTtcblxuICAgIC8vIDYuIOiqjeiovOODhuOCueODiOOBruWun+ihjFxuICAgIGNvbnNvbGUubG9nKCfwn5qAIOiqjeiovOODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuICAgIGNvbnNvbGUubG9nKCctJy5yZXBlYXQoNjApKTtcblxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgdGVzdFJlc3VsdHMgPSBhd2FpdCBhdXRoVGVzdFJ1bm5lci5ydW5BdXRoZW50aWNhdGlvblRlc3RzKCk7XG4gICAgY29uc3QgZW5kVGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgdG90YWxEdXJhdGlvbiA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG5cbiAgICBjb25zb2xlLmxvZygnLScucmVwZWF0KDYwKSk7XG4gICAgY29uc29sZS5sb2coJ/Cfk4og6KqN6Ki844OG44K544OI5a6f6KGM5a6M5LqGJyk7XG5cbiAgICAvLyA3LiDntZDmnpzjga7ooajnpLpcbiAgICBjb25zb2xlLmxvZygn8J+TiCDlrp/ooYzntZDmnpzjgrXjg57jg6rjg7w6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIOe3j+Wun+ihjOaZgumWkzogJHt0b3RhbER1cmF0aW9ufW1zICgkeyh0b3RhbER1cmF0aW9uIC8gMTAwMCkudG9GaXhlZCgxKX3np5IpYCk7XG4gICAgY29uc29sZS5sb2coYCAgIOe3j+ODhuOCueODiOaVsDogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5LnRvdGFsVGVzdHN9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOaIkOWKnzogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5LnBhc3NlZFRlc3RzfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDlpLHmlZc6ICR7dGVzdFJlc3VsdHMuc3VtbWFyeS5mYWlsZWRUZXN0c31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg44K544Kt44OD44OXOiAke3Rlc3RSZXN1bHRzLnN1bW1hcnkuc2tpcHBlZFRlc3RzfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDmiJDlip/njoc6ICR7KHRlc3RSZXN1bHRzLnN1bW1hcnkuc3VjY2Vzc1JhdGUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuXG4gICAgLy8gOC4g6Kmz57Sw57WQ5p6c44Gu6KGo56S677yIdmVyYm9zZSDjg6Ljg7zjg4nvvIlcbiAgICBpZiAoZXhlY3V0aW9uQ29uZmlnLnZlcmJvc2UpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7wn5OLIOips+e0sOODhuOCueODiOe1kOaenDonKTtcbiAgICAgIGZvciAoY29uc3QgW3Rlc3RJZCwgcmVzdWx0XSBvZiB0ZXN0UmVzdWx0cy5yZXN1bHRzKSB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3VsdC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJztcbiAgICAgICAgY29uc3QgZHVyYXRpb24gPSByZXN1bHQuZHVyYXRpb24gfHwgMDtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICR7c3RhdHVzfSAke3Jlc3VsdC50ZXN0TmFtZX0gKCR7dGVzdElkfSkgLSAke2R1cmF0aW9ufW1zYCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzICYmIHJlc3VsdC5lcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDjgqjjg6njg7w6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gOS4g44Os44Od44O844OI55Sf5oiQXG4gICAgaWYgKGV4ZWN1dGlvbkNvbmZpZy5nZW5lcmF0ZVJlcG9ydCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcbvCfk4Qg6Kmz57Sw44Os44Od44O844OI44KS55Sf5oiQ5LitLi4uJyk7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlcG9ydCA9IGF3YWl0IGF1dGhUZXN0UnVubmVyLmdlbmVyYXRlRGV0YWlsZWRSZXBvcnQodGVzdFJlc3VsdHMucmVzdWx0cyk7XG4gICAgICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5qb2luKGV4ZWN1dGlvbkNvbmZpZy5vdXRwdXREaXJlY3RvcnksIGBhdXRoLXRlc3QtcmVwb3J0LSR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKX0ubWRgKTtcbiAgICAgIFxuICAgICAgZnMud3JpdGVGaWxlU3luYyhyZXBvcnRQYXRoLCByZXBvcnQsICd1dGY4Jyk7XG4gICAgICBjb25zb2xlLmxvZyhg4pyFIOips+e0sOODrOODneODvOODiOOCkueUn+aIkDogJHtyZXBvcnRQYXRofWApO1xuXG4gICAgICAvLyBKU09O5b2i5byP44Gu57WQ5p6c44KC5L+d5a2YXG4gICAgICBjb25zdCBqc29uUmVzdWx0cyA9IHtcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgIHJlZ2lvbjogZGVmYXVsdFByb2R1Y3Rpb25Db25maWcucmVnaW9uLFxuICAgICAgICAgIGVudmlyb25tZW50OiBkZWZhdWx0UHJvZHVjdGlvbkNvbmZpZy5lbnZpcm9ubWVudCxcbiAgICAgICAgICBzYWZldHlNb2RlOiBkZWZhdWx0UHJvZHVjdGlvbkNvbmZpZy5zYWZldHlNb2RlLFxuICAgICAgICAgIHJlYWRPbmx5TW9kZTogZGVmYXVsdFByb2R1Y3Rpb25Db25maWcucmVhZE9ubHlNb2RlXG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnk6IHRlc3RSZXN1bHRzLnN1bW1hcnksXG4gICAgICAgIHJlc3VsdHM6IEFycmF5LmZyb20odGVzdFJlc3VsdHMucmVzdWx0cy5lbnRyaWVzKCkpLm1hcCgoW3Rlc3RJZCwgcmVzdWx0XSkgPT4gKHtcbiAgICAgICAgICB0ZXN0SWQsXG4gICAgICAgICAgLi4ucmVzdWx0XG4gICAgICAgIH0pKVxuICAgICAgfTtcblxuICAgICAgY29uc3QganNvblBhdGggPSBwYXRoLmpvaW4oZXhlY3V0aW9uQ29uZmlnLm91dHB1dERpcmVjdG9yeSwgYGF1dGgtdGVzdC1yZXN1bHRzLSR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKX0uanNvbmApO1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhqc29uUGF0aCwgSlNPTi5zdHJpbmdpZnkoanNvblJlc3VsdHMsIG51bGwsIDIpLCAndXRmOCcpO1xuICAgICAgY29uc29sZS5sb2coYOKchSBKU09O57WQ5p6c44KS5L+d5a2YOiAke2pzb25QYXRofWApO1xuICAgIH1cblxuICAgIC8vIDEwLiDjgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICBjb25zb2xlLmxvZygnXFxu8J+nuSDjg6rjgr3jg7zjgrnjgpLjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK0uLi4nKTtcbiAgICBhd2FpdCBhdXRoVGVzdFJ1bm5lci5jbGVhbnVwKCk7XG4gICAgYXdhaXQgdGVzdEVuZ2luZS5jbGVhbnVwKCk7XG5cbiAgICAvLyAxMS4g57WC5LqG5Yem55CGXG4gICAgY29uc3Qgb3ZlcmFsbFN1Y2Nlc3MgPSB0ZXN0UmVzdWx0cy5zdWNjZXNzO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG4nICsgJz0nLnJlcGVhdCg2MCkpO1xuICAgIGlmIChvdmVyYWxsU3VjY2Vzcykge1xuICAgICAgY29uc29sZS5sb2coJ/Cfjokg6KqN6Ki844O76KqN5Y+v44OG44K544OI44K544Kk44O844OI5a6f6KGM5oiQ5YqfJyk7XG4gICAgICBjb25zb2xlLmxvZygn4pyFIOWFqOOBpuOBruiqjeiovOapn+iDveOBjOato+W4uOOBq+WLleS9nOOBl+OBpuOBhOOBvuOBmScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygn4pqg77iPICDoqo3oqLzjg7voqo3lj6/jg4bjgrnjg4jjgrnjgqTjg7zjg4jlrp/ooYzlrozkuobvvIjkuIDpg6jlpLHmlZfvvIknKTtcbiAgICAgIGNvbnNvbGUubG9nKCfinYwg5LiA6YOo44Gu6KqN6Ki85qmf6IO944Gr5ZWP6aGM44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYPCfk4og5pyA57WC57WQ5p6cOiAke3Rlc3RSZXN1bHRzLnN1bW1hcnkucGFzc2VkVGVzdHN9LyR7dGVzdFJlc3VsdHMuc3VtbWFyeS50b3RhbFRlc3RzfSDjg4bjgrnjg4jmiJDlip9gKTtcbiAgICBjb25zb2xlLmxvZygnPScucmVwZWF0KDYwKSk7XG5cbiAgICAvLyDntYLkuobjgrPjg7zjg4njga7oqK3lrppcbiAgICBwcm9jZXNzLmV4aXQob3ZlcmFsbFN1Y2Nlc3MgPyAwIDogMSk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdcXG7inYwg6KqN6Ki844OG44K544OI5a6f6KGM5Lit44Gr44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOicpO1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIFxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGDjgqjjg6njg7zoqbPntLA6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgIGlmIChlcnJvci5zdGFjaykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGDjgrnjgr/jg4Pjgq/jg4jjg6zjg7zjgrk6XFxuJHtlcnJvci5zdGFja31gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH1cbn1cblxuLyoqXG4gKiDnt4rmgKXlgZzmraLjg4/jg7Pjg4njg6njg7xcbiAqL1xucHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnXFxu8J+bkSDnt4rmgKXlgZzmraLjgrfjgrDjg4rjg6vjgpLlj5fkv6HjgZfjgb7jgZfjgZ8nKTtcbiAgY29uc29sZS5sb2coJ/Cfp7kg5a6J5YWo44Gr44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gIHByb2Nlc3MuZXhpdCgxMzApO1xufSk7XG5cbnByb2Nlc3Mub24oJ1NJR1RFUk0nLCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdcXG7wn5uRIOe1guS6huOCt+OCsOODiuODq+OCkuWPl+S/oeOBl+OBvuOBl+OBnycpO1xuICBjb25zb2xlLmxvZygn8J+nuSDlronlhajjgavjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK0uLi4nKTtcbiAgcHJvY2Vzcy5leGl0KDE0Myk7XG59KTtcblxuLy8g5pyq5Yem55CG44Gu5L6L5aSW44KS44Kt44Oj44OD44OBXG5wcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKCdcXG7wn5KlIOacquWHpueQhuOBruS+i+WkluOBjOeZuueUn+OBl+OBvuOBl+OBnzonKTtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn0pO1xuXG5wcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uLCBwcm9taXNlKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoJ1xcbvCfkqUg5pyq5Yem55CG44GuUHJvbWlzZeaLkuWQpuOBjOeZuueUn+OBl+OBvuOBl+OBnzonKTtcbiAgY29uc29sZS5lcnJvcignUHJvbWlzZTonLCBwcm9taXNlKTtcbiAgY29uc29sZS5lcnJvcignUmVhc29uOicsIHJlYXNvbik7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn0pO1xuXG4vLyDjg6HjgqTjg7PplqLmlbDjga7lrp/ooYxcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKCkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIOODoeOCpOODs+mWouaVsOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjsiXX0=