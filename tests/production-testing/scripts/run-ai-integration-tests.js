#!/usr/bin/env ts-node
"use strict";
/**
 * AI統合テストスイート実行スクリプト
 *
 * Nova モデル、日本語精度、ストリーミング、マルチモーダルの包括テスト
 * 実本番AWS環境でのAI機能品質保証
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
const ai_integration_test_runner_1 = __importDefault(require("../modules/ai/ai-integration-test-runner"));
/**
 * メイン実行関数
 */
async function main() {
    console.log('🤖 AI統合テストスイート実行開始');
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
            includeNovaModels: process.env.INCLUDE_NOVA_MODELS !== 'false',
            includeJapaneseAccuracy: process.env.INCLUDE_JAPANESE_ACCURACY !== 'false',
            includeStreaming: process.env.INCLUDE_STREAMING !== 'false',
            includeMultimodal: process.env.INCLUDE_MULTIMODAL !== 'false',
            generateReport: process.env.GENERATE_REPORT !== 'false',
            outputDirectory: process.env.OUTPUT_DIR || './ai-test-results',
            verbose: process.env.VERBOSE === 'true'
        };
        console.log('📋 AI統合テスト実行設定:');
        console.log(`   Nova モデルテスト: ${executionConfig.includeNovaModels ? '有効' : '無効'}`);
        console.log(`   日本語精度テスト: ${executionConfig.includeJapaneseAccuracy ? '有効' : '無効'}`);
        console.log(`   ストリーミングテスト: ${executionConfig.includeStreaming ? '有効' : '無効'}`);
        console.log(`   マルチモーダルテスト: ${executionConfig.includeMultimodal ? '有効' : '無効'}`);
        console.log(`   レポート生成: ${executionConfig.generateReport ? '有効' : '無効'}`);
        console.log(`   出力ディレクトリ: ${executionConfig.outputDirectory}`);
        // 3. 出力ディレクトリの準備
        if (executionConfig.generateReport) {
            if (!fs.existsSync(executionConfig.outputDirectory)) {
                fs.mkdirSync(executionConfig.outputDirectory, { recursive: true });
                console.log(`📁 出力ディレクトリを作成: ${executionConfig.outputDirectory}`);
            }
        }
        // 4. AI統合テストランナーの初期化
        console.log('🔧 AI統合テストランナーを初期化中...');
        const aiTestRunner = new ai_integration_test_runner_1.default(production_config_1.defaultProductionConfig);
        // 5. AI統合テストの実行
        console.log('🤖 AI統合テストを実行中...');
        console.log('-'.repeat(60));
        const startTime = Date.now();
        const testResults = await aiTestRunner.runComprehensiveAITests();
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        console.log('-'.repeat(60));
        console.log('📊 AI統合テスト実行完了');
        // 6. 結果の表示
        console.log('📈 実行結果サマリー:');
        console.log(`   総実行時間: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}秒)`);
        console.log(`   テスト成功: ${testResults.success ? 'YES' : 'NO'}`);
        if (testResults.aiTestSummary) {
            console.log(`   Nova モデルテスト: ${(testResults.aiTestSummary.novaModelTests * 100).toFixed(1)}%`);
            console.log(`   日本語精度: ${(testResults.aiTestSummary.japaneseAccuracyScore * 100).toFixed(1)}%`);
            console.log(`   ストリーミング性能: ${(testResults.aiTestSummary.streamingPerformance * 100).toFixed(1)}%`);
            console.log(`   マルチモーダル能力: ${(testResults.aiTestSummary.multimodalCapability * 100).toFixed(1)}%`);
            console.log(`   総合AIスコア: ${(testResults.aiTestSummary.overallAIScore * 100).toFixed(1)}%`);
        }
        // 7. 詳細結果の表示（verbose モード）
        if (executionConfig.verbose && testResults.detailedResults) {
            console.log('\n📋 詳細テスト結果:');
            // Nova モデルテスト結果
            if (testResults.detailedResults.novaResults) {
                console.log('\n🤖 Nova モデルテスト:');
                testResults.detailedResults.novaResults.forEach(result => {
                    const status = result.success ? '✅' : '❌';
                    console.log(`   ${status} ${result.testName} - ${result.duration}ms`);
                });
            }
            // 日本語精度テスト結果
            if (testResults.detailedResults.japaneseResults && testResults.detailedResults.japaneseResults.length > 0) {
                const japaneseResult = testResults.detailedResults.japaneseResults[0];
                const status = japaneseResult.success ? '✅' : '❌';
                console.log(`\n🇯🇵 日本語精度テスト:`);
                console.log(`   ${status} ${japaneseResult.testName} - ${japaneseResult.duration}ms`);
            }
            // ストリーミングテスト結果
            if (testResults.detailedResults.streamingResults && testResults.detailedResults.streamingResults.length > 0) {
                const streamingResult = testResults.detailedResults.streamingResults[0];
                const status = streamingResult.success ? '✅' : '❌';
                console.log(`\n📡 ストリーミングテスト:`);
                console.log(`   ${status} ${streamingResult.testName} - ${streamingResult.duration}ms`);
            }
            // マルチモーダルテスト結果
            if (testResults.detailedResults.multimodalResults && testResults.detailedResults.multimodalResults.length > 0) {
                const multimodalResult = testResults.detailedResults.multimodalResults[0];
                const status = multimodalResult.success ? '✅' : '❌';
                console.log(`\n🖼️ マルチモーダルテスト:`);
                console.log(`   ${status} ${multimodalResult.testName} - ${multimodalResult.duration}ms`);
            }
        }
        // 8. レポート生成
        if (executionConfig.generateReport) {
            console.log('\n📄 詳細レポートを生成中...');
            const report = await aiTestRunner.generateDetailedAIReport(testResults);
            const reportPath = path.join(executionConfig.outputDirectory, `ai-integration-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
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
                summary: testResults.aiTestSummary,
                results: testResults.detailedResults
            };
            const jsonPath = path.join(executionConfig.outputDirectory, `ai-integration-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(jsonResults, null, 2), 'utf8');
            console.log(`✅ JSON結果を保存: ${jsonPath}`);
        }
        // 9. クリーンアップ
        console.log('\n🧹 リソースをクリーンアップ中...');
        await aiTestRunner.cleanup();
        // 10. 終了処理
        const overallSuccess = testResults.success;
        console.log('\n' + '='.repeat(60));
        if (overallSuccess) {
            console.log('🎉 AI統合テストスイート実行成功');
            console.log('✅ 全てのAI機能が正常に動作しています');
        }
        else {
            console.log('⚠️  AI統合テストスイート実行完了（一部失敗）');
            console.log('❌ 一部のAI機能に問題があります');
        }
        if (testResults.aiTestSummary) {
            console.log(`📊 最終AIスコア: ${(testResults.aiTestSummary.overallAIScore * 100).toFixed(1)}%`);
        }
        console.log('='.repeat(60));
        // 終了コードの設定
        process.exit(overallSuccess ? 0 : 1);
    }
    catch (error) {
        console.error('\n❌ AI統合テスト実行中にエラーが発生しました:');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLWFpLWludGVncmF0aW9uLXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLWFpLWludGVncmF0aW9uLXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwyQ0FBNkI7QUFDN0IsdUNBQXlCO0FBQ3pCLG1FQUFnRztBQUNoRywwR0FBK0U7QUFlL0U7O0dBRUc7QUFDSCxLQUFLLFVBQVUsSUFBSTtJQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFN0IsSUFBSSxDQUFDO1FBQ0gsV0FBVztRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNoQyxNQUFNLGdCQUFnQixHQUFHLElBQUEsNENBQXdCLEVBQUMsMkNBQXVCLENBQUMsQ0FBQztRQUUzRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzQixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxJQUFJLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN6QixnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxD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LENBQUMsS0FBSyxFQUFFLEVBQUU7SUFDeEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDbkQsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ25DLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFFSCxXQUFXO0FBQ1gsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzVCLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3JCLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgdHMtbm9kZVxuXG4vKipcbiAqIEFJ57Wx5ZCI44OG44K544OI44K544Kk44O844OI5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiBcbiAqIE5vdmEg44Oi44OH44Or44CB5pel5pys6Kqe57K+5bqm44CB44K544OI44Oq44O844Of44Oz44Kw44CB44Oe44Or44OB44Oi44O844OA44Or44Gu5YyF5ous44OG44K544OIXG4gKiDlrp/mnKznlapBV1PnkrDlooPjgafjga5BSeapn+iDveWTgeizquS/neiovFxuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IGRlZmF1bHRQcm9kdWN0aW9uQ29uZmlnLCB2YWxpZGF0ZVByb2R1Y3Rpb25Db25maWcgfSBmcm9tICcuLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuaW1wb3J0IEFJSW50ZWdyYXRpb25UZXN0UnVubmVyIGZyb20gJy4uL21vZHVsZXMvYWkvYWktaW50ZWdyYXRpb24tdGVzdC1ydW5uZXInO1xuXG4vKipcbiAqIEFJ57Wx5ZCI44OG44K544OI5a6f6KGM6Kit5a6aXG4gKi9cbmludGVyZmFjZSBBSVRlc3RFeGVjdXRpb25Db25maWcge1xuICBpbmNsdWRlTm92YU1vZGVsczogYm9vbGVhbjtcbiAgaW5jbHVkZUphcGFuZXNlQWNjdXJhY3k6IGJvb2xlYW47XG4gIGluY2x1ZGVTdHJlYW1pbmc6IGJvb2xlYW47XG4gIGluY2x1ZGVNdWx0aW1vZGFsOiBib29sZWFuO1xuICBnZW5lcmF0ZVJlcG9ydDogYm9vbGVhbjtcbiAgb3V0cHV0RGlyZWN0b3J5OiBzdHJpbmc7XG4gIHZlcmJvc2U6IGJvb2xlYW47XG59XG5cbi8qKlxuICog44Oh44Kk44Oz5a6f6KGM6Zai5pWwXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCfwn6SWIEFJ57Wx5ZCI44OG44K544OI44K544Kk44O844OI5a6f6KGM6ZaL5aeLJyk7XG4gIGNvbnNvbGUubG9nKCc9JyAucmVwZWF0KDYwKSk7XG5cbiAgdHJ5IHtcbiAgICAvLyAxLiDoqK3lrprjga7mpJzoqLxcbiAgICBjb25zb2xlLmxvZygn8J+TiyDmnKznlarnkrDlooPoqK3lrprjgpLmpJzoqLzkuK0uLi4nKTtcbiAgICBjb25zdCBjb25maWdWYWxpZGF0aW9uID0gdmFsaWRhdGVQcm9kdWN0aW9uQ29uZmlnKGRlZmF1bHRQcm9kdWN0aW9uQ29uZmlnKTtcbiAgICBcbiAgICBpZiAoIWNvbmZpZ1ZhbGlkYXRpb24uaXNWYWxpZCkge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOioreWumuaknOiovOWkseaVlzonKTtcbiAgICAgIGNvbmZpZ1ZhbGlkYXRpb24uZXJyb3JzLmZvckVhY2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihgICAgLSAke2Vycm9yfWApKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnVmFsaWRhdGlvbi53YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pqg77iPICDoqK3lrprorablkYo6Jyk7XG4gICAgICBjb25maWdWYWxpZGF0aW9uLndhcm5pbmdzLmZvckVhY2god2FybmluZyA9PiBjb25zb2xlLmxvZyhgICAgLSAke3dhcm5pbmd9YCkpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfinIUg5pys55Wq55Kw5aKD6Kit5a6a5qSc6Ki85a6M5LqGJyk7XG5cbiAgICAvLyAyLiDlrp/ooYzoqK3lrprjga7oqq3jgb/ovrzjgb9cbiAgICBjb25zdCBleGVjdXRpb25Db25maWc6IEFJVGVzdEV4ZWN1dGlvbkNvbmZpZyA9IHtcbiAgICAgIGluY2x1ZGVOb3ZhTW9kZWxzOiBwcm9jZXNzLmVudi5JTkNMVURFX05PVkFfTU9ERUxTICE9PSAnZmFsc2UnLFxuICAgICAgaW5jbHVkZUphcGFuZXNlQWNjdXJhY3k6IHByb2Nlc3MuZW52LklOQ0xVREVfSkFQQU5FU0VfQUNDVVJBQ1kgIT09ICdmYWxzZScsXG4gICAgICBpbmNsdWRlU3RyZWFtaW5nOiBwcm9jZXNzLmVudi5JTkNMVURFX1NUUkVBTUlORyAhPT0gJ2ZhbHNlJyxcbiAgICAgIGluY2x1ZGVNdWx0aW1vZGFsOiBwcm9jZXNzLmVudi5JTkNMVURFX01VTFRJTU9EQUwgIT09ICdmYWxzZScsXG4gICAgICBnZW5lcmF0ZVJlcG9ydDogcHJvY2Vzcy5lbnYuR0VORVJBVEVfUkVQT1JUICE9PSAnZmFsc2UnLFxuICAgICAgb3V0cHV0RGlyZWN0b3J5OiBwcm9jZXNzLmVudi5PVVRQVVRfRElSIHx8ICcuL2FpLXRlc3QtcmVzdWx0cycsXG4gICAgICB2ZXJib3NlOiBwcm9jZXNzLmVudi5WRVJCT1NFID09PSAndHJ1ZSdcbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ/Cfk4sgQUnntbHlkIjjg4bjgrnjg4jlrp/ooYzoqK3lrpo6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIE5vdmEg44Oi44OH44Or44OG44K544OIOiAke2V4ZWN1dGlvbkNvbmZpZy5pbmNsdWRlTm92YU1vZGVscyA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOaXpeacrOiqnueyvuW6puODhuOCueODiDogJHtleGVjdXRpb25Db25maWcuaW5jbHVkZUphcGFuZXNlQWNjdXJhY3kgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4g6ICR7ZXhlY3V0aW9uQ29uZmlnLmluY2x1ZGVTdHJlYW1pbmcgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vjg4bjgrnjg4g6ICR7ZXhlY3V0aW9uQ29uZmlnLmluY2x1ZGVNdWx0aW1vZGFsID8gJ+acieWKuScgOiAn54Sh5Yq5J31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg44Os44Od44O844OI55Sf5oiQOiAke2V4ZWN1dGlvbkNvbmZpZy5nZW5lcmF0ZVJlcG9ydCA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODqjogJHtleGVjdXRpb25Db25maWcub3V0cHV0RGlyZWN0b3J5fWApO1xuXG4gICAgLy8gMy4g5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu5rqW5YKZXG4gICAgaWYgKGV4ZWN1dGlvbkNvbmZpZy5nZW5lcmF0ZVJlcG9ydCkge1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGV4ZWN1dGlvbkNvbmZpZy5vdXRwdXREaXJlY3RvcnkpKSB7XG4gICAgICAgIGZzLm1rZGlyU3luYyhleGVjdXRpb25Db25maWcub3V0cHV0RGlyZWN0b3J5LCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4Eg5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44KS5L2c5oiQOiAke2V4ZWN1dGlvbkNvbmZpZy5vdXRwdXREaXJlY3Rvcnl9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gNC4gQUnntbHlkIjjg4bjgrnjg4jjg6njg7Pjg4rjg7zjga7liJ3mnJ/ljJZcbiAgICBjb25zb2xlLmxvZygn8J+UpyBBSee1seWQiOODhuOCueODiOODqeODs+ODiuODvOOCkuWIneacn+WMluS4rS4uLicpO1xuICAgIGNvbnN0IGFpVGVzdFJ1bm5lciA9IG5ldyBBSUludGVncmF0aW9uVGVzdFJ1bm5lcihkZWZhdWx0UHJvZHVjdGlvbkNvbmZpZyk7XG5cbiAgICAvLyA1LiBBSee1seWQiOODhuOCueODiOOBruWun+ihjFxuICAgIGNvbnNvbGUubG9nKCfwn6SWIEFJ57Wx5ZCI44OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgY29uc29sZS5sb2coJy0nLnJlcGVhdCg2MCkpO1xuXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB0ZXN0UmVzdWx0cyA9IGF3YWl0IGFpVGVzdFJ1bm5lci5ydW5Db21wcmVoZW5zaXZlQUlUZXN0cygpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHRvdGFsRHVyYXRpb24gPSBlbmRUaW1lIC0gc3RhcnRUaW1lO1xuXG4gICAgY29uc29sZS5sb2coJy0nLnJlcGVhdCg2MCkpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OKIEFJ57Wx5ZCI44OG44K544OI5a6f6KGM5a6M5LqGJyk7XG5cbiAgICAvLyA2LiDntZDmnpzjga7ooajnpLpcbiAgICBjb25zb2xlLmxvZygn8J+TiCDlrp/ooYzntZDmnpzjgrXjg57jg6rjg7w6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIOe3j+Wun+ihjOaZgumWkzogJHt0b3RhbER1cmF0aW9ufW1zICgkeyh0b3RhbER1cmF0aW9uIC8gMTAwMCkudG9GaXhlZCgxKX3np5IpYCk7XG4gICAgY29uc29sZS5sb2coYCAgIOODhuOCueODiOaIkOWKnzogJHt0ZXN0UmVzdWx0cy5zdWNjZXNzID8gJ1lFUycgOiAnTk8nfWApO1xuICAgIFxuICAgIGlmICh0ZXN0UmVzdWx0cy5haVRlc3RTdW1tYXJ5KSB7XG4gICAgICBjb25zb2xlLmxvZyhgICAgTm92YSDjg6Ljg4fjg6vjg4bjgrnjg4g6ICR7KHRlc3RSZXN1bHRzLmFpVGVzdFN1bW1hcnkubm92YU1vZGVsVGVzdHMgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOaXpeacrOiqnueyvuW6pjogJHsodGVzdFJlc3VsdHMuYWlUZXN0U3VtbWFyeS5qYXBhbmVzZUFjY3VyYWN5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOOCueODiOODquODvOODn+ODs+OCsOaAp+iDvTogJHsodGVzdFJlc3VsdHMuYWlUZXN0U3VtbWFyeS5zdHJlYW1pbmdQZXJmb3JtYW5jZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44Oe44Or44OB44Oi44O844OA44Or6IO95YqbOiAkeyh0ZXN0UmVzdWx0cy5haVRlc3RTdW1tYXJ5Lm11bHRpbW9kYWxDYXBhYmlsaXR5ICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDnt4/lkIhBSeOCueOCs+OCojogJHsodGVzdFJlc3VsdHMuYWlUZXN0U3VtbWFyeS5vdmVyYWxsQUlTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgfVxuXG4gICAgLy8gNy4g6Kmz57Sw57WQ5p6c44Gu6KGo56S677yIdmVyYm9zZSDjg6Ljg7zjg4nvvIlcbiAgICBpZiAoZXhlY3V0aW9uQ29uZmlnLnZlcmJvc2UgJiYgdGVzdFJlc3VsdHMuZGV0YWlsZWRSZXN1bHRzKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu8J+TiyDoqbPntLDjg4bjgrnjg4jntZDmnpw6Jyk7XG4gICAgICBcbiAgICAgIC8vIE5vdmEg44Oi44OH44Or44OG44K544OI57WQ5p6cXG4gICAgICBpZiAodGVzdFJlc3VsdHMuZGV0YWlsZWRSZXN1bHRzLm5vdmFSZXN1bHRzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXG7wn6SWIE5vdmEg44Oi44OH44Or44OG44K544OIOicpO1xuICAgICAgICB0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMubm92YVJlc3VsdHMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3VsdC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJztcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICAgJHtzdGF0dXN9ICR7cmVzdWx0LnRlc3ROYW1lfSAtICR7cmVzdWx0LmR1cmF0aW9ufW1zYCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyDml6XmnKzoqp7nsr7luqbjg4bjgrnjg4jntZDmnpxcbiAgICAgIGlmICh0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMuamFwYW5lc2VSZXN1bHRzICYmIHRlc3RSZXN1bHRzLmRldGFpbGVkUmVzdWx0cy5qYXBhbmVzZVJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBqYXBhbmVzZVJlc3VsdCA9IHRlc3RSZXN1bHRzLmRldGFpbGVkUmVzdWx0cy5qYXBhbmVzZVJlc3VsdHNbMF07XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IGphcGFuZXNlUmVzdWx0LnN1Y2Nlc3MgPyAn4pyFJyA6ICfinYwnO1xuICAgICAgICBjb25zb2xlLmxvZyhgXFxu8J+Hr/Cfh7Ug5pel5pys6Kqe57K+5bqm44OG44K544OIOmApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgJHtzdGF0dXN9ICR7amFwYW5lc2VSZXN1bHQudGVzdE5hbWV9IC0gJHtqYXBhbmVzZVJlc3VsdC5kdXJhdGlvbn1tc2ApO1xuICAgICAgfVxuXG4gICAgICAvLyDjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4jntZDmnpxcbiAgICAgIGlmICh0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMuc3RyZWFtaW5nUmVzdWx0cyAmJiB0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMuc3RyZWFtaW5nUmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IHN0cmVhbWluZ1Jlc3VsdCA9IHRlc3RSZXN1bHRzLmRldGFpbGVkUmVzdWx0cy5zdHJlYW1pbmdSZXN1bHRzWzBdO1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBzdHJlYW1pbmdSZXN1bHQuc3VjY2VzcyA/ICfinIUnIDogJ+KdjCc7XG4gICAgICAgIGNvbnNvbGUubG9nKGBcXG7wn5OhIOOCueODiOODquODvOODn+ODs+OCsOODhuOCueODiDpgKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICR7c3RhdHVzfSAke3N0cmVhbWluZ1Jlc3VsdC50ZXN0TmFtZX0gLSAke3N0cmVhbWluZ1Jlc3VsdC5kdXJhdGlvbn1tc2ApO1xuICAgICAgfVxuXG4gICAgICAvLyDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vjg4bjgrnjg4jntZDmnpxcbiAgICAgIGlmICh0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMubXVsdGltb2RhbFJlc3VsdHMgJiYgdGVzdFJlc3VsdHMuZGV0YWlsZWRSZXN1bHRzLm11bHRpbW9kYWxSZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbXVsdGltb2RhbFJlc3VsdCA9IHRlc3RSZXN1bHRzLmRldGFpbGVkUmVzdWx0cy5tdWx0aW1vZGFsUmVzdWx0c1swXTtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gbXVsdGltb2RhbFJlc3VsdC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJztcbiAgICAgICAgY29uc29sZS5sb2coYFxcbvCflrzvuI8g44Oe44Or44OB44Oi44O844OA44Or44OG44K544OIOmApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgJHtzdGF0dXN9ICR7bXVsdGltb2RhbFJlc3VsdC50ZXN0TmFtZX0gLSAke211bHRpbW9kYWxSZXN1bHQuZHVyYXRpb259bXNgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyA4LiDjg6zjg53jg7zjg4jnlJ/miJBcbiAgICBpZiAoZXhlY3V0aW9uQ29uZmlnLmdlbmVyYXRlUmVwb3J0KSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu8J+ThCDoqbPntLDjg6zjg53jg7zjg4jjgpLnlJ/miJDkuK0uLi4nKTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVwb3J0ID0gYXdhaXQgYWlUZXN0UnVubmVyLmdlbmVyYXRlRGV0YWlsZWRBSVJlcG9ydCh0ZXN0UmVzdWx0cyk7XG4gICAgICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5qb2luKGV4ZWN1dGlvbkNvbmZpZy5vdXRwdXREaXJlY3RvcnksIGBhaS1pbnRlZ3JhdGlvbi10ZXN0LXJlcG9ydC0ke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyl9Lm1kYCk7XG4gICAgICBcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocmVwb3J0UGF0aCwgcmVwb3J0LCAndXRmOCcpO1xuICAgICAgY29uc29sZS5sb2coYOKchSDoqbPntLDjg6zjg53jg7zjg4jjgpLnlJ/miJA6ICR7cmVwb3J0UGF0aH1gKTtcblxuICAgICAgLy8gSlNPTuW9ouW8j+OBrue1kOaenOOCguS/neWtmFxuICAgICAgY29uc3QganNvblJlc3VsdHMgPSB7XG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICByZWdpb246IGRlZmF1bHRQcm9kdWN0aW9uQ29uZmlnLnJlZ2lvbixcbiAgICAgICAgICBlbnZpcm9ubWVudDogZGVmYXVsdFByb2R1Y3Rpb25Db25maWcuZW52aXJvbm1lbnQsXG4gICAgICAgICAgc2FmZXR5TW9kZTogZGVmYXVsdFByb2R1Y3Rpb25Db25maWcuc2FmZXR5TW9kZSxcbiAgICAgICAgICByZWFkT25seU1vZGU6IGRlZmF1bHRQcm9kdWN0aW9uQ29uZmlnLnJlYWRPbmx5TW9kZVxuICAgICAgICB9LFxuICAgICAgICBzdW1tYXJ5OiB0ZXN0UmVzdWx0cy5haVRlc3RTdW1tYXJ5LFxuICAgICAgICByZXN1bHRzOiB0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHNcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGpzb25QYXRoID0gcGF0aC5qb2luKGV4ZWN1dGlvbkNvbmZpZy5vdXRwdXREaXJlY3RvcnksIGBhaS1pbnRlZ3JhdGlvbi10ZXN0LXJlc3VsdHMtJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpfS5qc29uYCk7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKGpzb25QYXRoLCBKU09OLnN0cmluZ2lmeShqc29uUmVzdWx0cywgbnVsbCwgMiksICd1dGY4Jyk7XG4gICAgICBjb25zb2xlLmxvZyhg4pyFIEpTT07ntZDmnpzjgpLkv53lrZg6ICR7anNvblBhdGh9YCk7XG4gICAgfVxuXG4gICAgLy8gOS4g44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAgY29uc29sZS5sb2coJ1xcbvCfp7kg44Oq44K944O844K544KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgYXdhaXQgYWlUZXN0UnVubmVyLmNsZWFudXAoKTtcblxuICAgIC8vIDEwLiDntYLkuoblh6bnkIZcbiAgICBjb25zdCBvdmVyYWxsU3VjY2VzcyA9IHRlc3RSZXN1bHRzLnN1Y2Nlc3M7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcbicgKyAnPScucmVwZWF0KDYwKSk7XG4gICAgaWYgKG92ZXJhbGxTdWNjZXNzKSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+OiSBBSee1seWQiOODhuOCueODiOOCueOCpOODvOODiOWun+ihjOaIkOWKnycpO1xuICAgICAgY29uc29sZS5sb2coJ+KchSDlhajjgabjga5BSeapn+iDveOBjOato+W4uOOBq+WLleS9nOOBl+OBpuOBhOOBvuOBmScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygn4pqg77iPICBBSee1seWQiOODhuOCueODiOOCueOCpOODvOODiOWun+ihjOWujOS6hu+8iOS4gOmDqOWkseaVl++8iScpO1xuICAgICAgY29uc29sZS5sb2coJ+KdjCDkuIDpg6jjga5BSeapn+iDveOBq+WVj+mhjOOBjOOBguOCiuOBvuOBmScpO1xuICAgIH1cblxuICAgIGlmICh0ZXN0UmVzdWx0cy5haVRlc3RTdW1tYXJ5KSB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+TiiDmnIDntYJBSeOCueOCs+OCojogJHsodGVzdFJlc3VsdHMuYWlUZXN0U3VtbWFyeS5vdmVyYWxsQUlTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCc9Jy5yZXBlYXQoNjApKTtcblxuICAgIC8vIOe1guS6huOCs+ODvOODieOBruioreWumlxuICAgIHByb2Nlc3MuZXhpdChvdmVyYWxsU3VjY2VzcyA/IDAgOiAxKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1xcbuKdjCBBSee1seWQiOODhuOCueODiOWun+ihjOS4reOBq+OCqOODqeODvOOBjOeZuueUn+OBl+OBvuOBl+OBnzonKTtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICBcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihg44Ko44Op44O86Kmz57SwOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICBpZiAoZXJyb3Iuc3RhY2spIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihg44K544K/44OD44Kv44OI44Os44O844K5OlxcbiR7ZXJyb3Iuc3RhY2t9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbi8qKlxuICog57eK5oCl5YGc5q2i44OP44Oz44OJ44Op44O8XG4gKi9cbnByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ1xcbvCfm5Eg57eK5oCl5YGc5q2i44K344Kw44OK44Or44KS5Y+X5L+h44GX44G+44GX44GfJyk7XG4gIGNvbnNvbGUubG9nKCfwn6e5IOWuieWFqOOBq+OCr+ODquODvOODs+OCouODg+ODl+S4rS4uLicpO1xuICBwcm9jZXNzLmV4aXQoMTMwKTtcbn0pO1xuXG5wcm9jZXNzLm9uKCdTSUdURVJNJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnXFxu8J+bkSDntYLkuobjgrfjgrDjg4rjg6vjgpLlj5fkv6HjgZfjgb7jgZfjgZ8nKTtcbiAgY29uc29sZS5sb2coJ/Cfp7kg5a6J5YWo44Gr44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gIHByb2Nlc3MuZXhpdCgxNDMpO1xufSk7XG5cbi8vIOacquWHpueQhuOBruS+i+WkluOCkuOCreODo+ODg+ODgVxucHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCAoZXJyb3IpID0+IHtcbiAgY29uc29sZS5lcnJvcignXFxu8J+SpSDmnKrlh6bnkIbjga7kvovlpJbjgYznmbrnlJ/jgZfjgb7jgZfjgZ86Jyk7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59KTtcblxucHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKHJlYXNvbiwgcHJvbWlzZSkgPT4ge1xuICBjb25zb2xlLmVycm9yKCdcXG7wn5KlIOacquWHpueQhuOBrlByb21pc2Xmi5LlkKbjgYznmbrnlJ/jgZfjgb7jgZfjgZ86Jyk7XG4gIGNvbnNvbGUuZXJyb3IoJ1Byb21pc2U6JywgcHJvbWlzZSk7XG4gIGNvbnNvbGUuZXJyb3IoJ1JlYXNvbjonLCByZWFzb24pO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59KTtcblxuLy8g44Oh44Kk44Oz6Zai5pWw44Gu5a6f6KGMXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbigpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg6HjgqTjg7PplqLmlbDlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47Il19