#!/usr/bin/env node
"use strict";
/**
 * 認証システムテスト実行スクリプト
 *
 * 実本番Amazon Cognitoユーザープールでの認証テストを実行
 *
 * 使用方法:
 *   npm run test:auth
 *   または
 *   npx ts-node scripts/test-authentication.ts
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
const fs = __importStar(require("fs/promises"));
const production_config_1 = require("../config/production-config");
const production_test_engine_1 = __importDefault(require("../core/production-test-engine"));
const authentication_test_runner_1 = __importDefault(require("../modules/authentication/authentication-test-runner"));
/**
 * メイン実行関数
 */
async function main() {
    console.log('🚀 認証システムテスト実行開始');
    console.log('=====================================');
    let testEngine = null;
    let testRunner = null;
    try {
        // 1. 設定の読み込みと検証
        console.log('⚙️ 設定を読み込み中...');
        const config = (0, production_config_1.createProductionConfig)();
        const validation = (0, production_config_1.validateProductionConfig)(config);
        if (!validation.isValid) {
            console.error('❌ 設定検証エラー:');
            validation.errors.forEach(error => console.error(`   - ${error}`));
            process.exit(1);
        }
        if (validation.warnings.length > 0) {
            console.warn('⚠️ 設定警告:');
            validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
        }
        console.log('✅ 設定検証完了');
        console.log(`   リージョン: ${config.region}`);
        console.log(`   環境: ${config.environment}`);
        console.log(`   安全モード: ${config.safetyMode ? '有効' : '無効'}`);
        console.log(`   読み取り専用モード: ${config.readOnlyMode ? '有効' : '無効'}`);
        // 2. テストエンジンの初期化
        console.log('\n🔧 テストエンジンを初期化中...');
        testEngine = new production_test_engine_1.default(config);
        await testEngine.initialize();
        console.log('✅ テストエンジン初期化完了');
        // 3. 認証テストランナーの作成
        console.log('\n🔐 認証テストランナーを作成中...');
        testRunner = new authentication_test_runner_1.default(config, testEngine);
        console.log('✅ 認証テストランナー作成完了');
        // 4. 認証テストの実行
        console.log('\n🧪 認証テストを実行中...');
        console.log('=====================================');
        const testResults = await testRunner.runAuthenticationTests();
        // 5. 結果の表示
        console.log('\n📊 テスト結果サマリー');
        console.log('=====================================');
        console.log(`総テスト数: ${testResults.summary.totalTests}`);
        console.log(`成功: ${testResults.summary.passedTests}`);
        console.log(`失敗: ${testResults.summary.failedTests}`);
        console.log(`スキップ: ${testResults.summary.skippedTests}`);
        console.log(`成功率: ${(testResults.summary.successRate * 100).toFixed(1)}%`);
        console.log(`総実行時間: ${testResults.summary.totalDuration}ms`);
        // 6. 詳細レポートの生成
        console.log('\n📄 詳細レポートを生成中...');
        const detailedReport = await testRunner.generateDetailedReport(testResults.results);
        // レポートファイルの保存
        const reportsDir = path.join(process.cwd(), 'test-results');
        await fs.mkdir(reportsDir, { recursive: true });
        const reportFileName = `authentication-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
        const reportFilePath = path.join(reportsDir, reportFileName);
        await fs.writeFile(reportFilePath, detailedReport, 'utf-8');
        console.log(`✅ 詳細レポート保存完了: ${reportFilePath}`);
        // 7. 結果に基づく終了処理
        if (testResults.success) {
            console.log('\n🎉 認証システムテスト完了 - 全テスト成功');
            process.exit(0);
        }
        else {
            console.log('\n⚠️ 認証システムテスト完了 - 一部テスト失敗');
            console.log('詳細は上記のレポートファイルを確認してください。');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('\n❌ 認証テスト実行中にエラーが発生しました:');
        console.error(error);
        // エラー情報の保存
        try {
            const errorReportsDir = path.join(process.cwd(), 'test-results', 'errors');
            await fs.mkdir(errorReportsDir, { recursive: true });
            const errorFileName = `authentication-test-error-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const errorFilePath = path.join(errorReportsDir, errorFileName);
            const errorReport = {
                timestamp: new Date().toISOString(),
                testType: 'authentication',
                error: {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                },
                environment: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    cwd: process.cwd()
                }
            };
            await fs.writeFile(errorFilePath, JSON.stringify(errorReport, null, 2), 'utf-8');
            console.log(`📄 エラーレポート保存: ${errorFilePath}`);
        }
        catch (reportError) {
            console.error('エラーレポート保存に失敗:', reportError);
        }
        process.exit(1);
    }
    finally {
        // クリーンアップ処理
        console.log('\n🧹 クリーンアップ中...');
        try {
            if (testRunner) {
                await testRunner.cleanup();
            }
            if (testEngine) {
                await testEngine.cleanup();
            }
            console.log('✅ クリーンアップ完了');
        }
        catch (cleanupError) {
            console.error('⚠️ クリーンアップ中にエラーが発生しました:', cleanupError);
        }
    }
}
/**
 * 未処理例外のハンドリング
 */
process.on('uncaughtException', (error) => {
    console.error('🚨 未処理例外:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 未処理のPromise拒否:', reason);
    process.exit(1);
});
/**
 * 終了シグナルのハンドリング
 */
process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT受信 - 認証テストを中断します...');
    process.exit(130);
});
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM受信 - 認証テストを中断します...');
    process.exit(143);
});
// メイン関数の実行
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ メイン関数実行エラー:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1hdXRoZW50aWNhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QtYXV0aGVudGljYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQTs7Ozs7Ozs7Ozs7O0dBWUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwyQ0FBNkI7QUFDN0IsZ0RBQWtDO0FBQ2xDLG1FQUErRjtBQUMvRiw0RkFBa0U7QUFDbEUsc0hBQTRGO0FBRTVGOztHQUVHO0FBQ0gsS0FBSyxVQUFVLElBQUk7SUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUVyRCxJQUFJLFVBQVUsR0FBZ0MsSUFBSSxDQUFDO0lBQ25ELElBQUksVUFBVSxHQUFvQyxJQUFJLENBQUM7SUFFdkQsSUFBSSxDQUFDO1FBQ0gsZ0JBQWdCO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM5QixNQUFNLE1BQU0sR0FBRyxJQUFBLDBDQUFzQixHQUFFLENBQUM7UUFFeEMsTUFBTSxVQUFVLEdBQUcsSUFBQSw0Q0FBd0IsRUFBQyxNQUFNLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDNUIsVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25FLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbkMsT0FBTyxDQUFDLElBQUks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QUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO0lBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsQ0FBQztJQUMvQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDO0FBRUgsV0FBVztBQUNYLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUM1QixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNyQixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbi8qKlxuICog6KqN6Ki844K344K544OG44Og44OG44K544OI5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiBcbiAqIOWun+acrOeVqkFtYXpvbiBDb2duaXRv44Om44O844K244O844OX44O844Or44Gn44Gu6KqN6Ki844OG44K544OI44KS5a6f6KGMXG4gKiBcbiAqIOS9v+eUqOaWueazlTpcbiAqICAgbnBtIHJ1biB0ZXN0OmF1dGhcbiAqICAg44G+44Gf44GvXG4gKiAgIG5weCB0cy1ub2RlIHNjcmlwdHMvdGVzdC1hdXRoZW50aWNhdGlvbi50c1xuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzL3Byb21pc2VzJztcbmltcG9ydCB7IGNyZWF0ZVByb2R1Y3Rpb25Db25maWcsIHZhbGlkYXRlUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5pbXBvcnQgUHJvZHVjdGlvblRlc3RFbmdpbmUgZnJvbSAnLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcbmltcG9ydCBBdXRoZW50aWNhdGlvblRlc3RSdW5uZXIgZnJvbSAnLi4vbW9kdWxlcy9hdXRoZW50aWNhdGlvbi9hdXRoZW50aWNhdGlvbi10ZXN0LXJ1bm5lcic7XG5cbi8qKlxuICog44Oh44Kk44Oz5a6f6KGM6Zai5pWwXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCfwn5qAIOiqjeiovOOCt+OCueODhuODoOODhuOCueODiOWun+ihjOmWi+WniycpO1xuICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuXG4gIGxldCB0ZXN0RW5naW5lOiBQcm9kdWN0aW9uVGVzdEVuZ2luZSB8IG51bGwgPSBudWxsO1xuICBsZXQgdGVzdFJ1bm5lcjogQXV0aGVudGljYXRpb25UZXN0UnVubmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgdHJ5IHtcbiAgICAvLyAxLiDoqK3lrprjga7oqq3jgb/ovrzjgb/jgajmpJzoqLxcbiAgICBjb25zb2xlLmxvZygn4pqZ77iPIOioreWumuOCkuiqreOBv+i+vOOBv+S4rS4uLicpO1xuICAgIGNvbnN0IGNvbmZpZyA9IGNyZWF0ZVByb2R1Y3Rpb25Db25maWcoKTtcbiAgICBcbiAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVQcm9kdWN0aW9uQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKCF2YWxpZGF0aW9uLmlzVmFsaWQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDoqK3lrprmpJzoqLzjgqjjg6njg7w6Jyk7XG4gICAgICB2YWxpZGF0aW9uLmVycm9ycy5mb3JFYWNoKGVycm9yID0+IGNvbnNvbGUuZXJyb3IoYCAgIC0gJHtlcnJvcn1gKSk7XG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRpb24ud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS53YXJuKCfimqDvuI8g6Kit5a6a6K2m5ZGKOicpO1xuICAgICAgdmFsaWRhdGlvbi53YXJuaW5ncy5mb3JFYWNoKHdhcm5pbmcgPT4gY29uc29sZS53YXJuKGAgICAtICR7d2FybmluZ31gKSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ+KchSDoqK3lrprmpJzoqLzlrozkuoYnKTtcbiAgICBjb25zb2xlLmxvZyhgICAg44Oq44O844K444On44OzOiAke2NvbmZpZy5yZWdpb259YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtjb25maWcuZW52aXJvbm1lbnR9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOWuieWFqOODouODvOODiTogJHtjb25maWcuc2FmZXR5TW9kZSA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOiqreOBv+WPluOCiuWwgueUqOODouODvOODiTogJHtjb25maWcucmVhZE9ubHlNb2RlID8gJ+acieWKuScgOiAn54Sh5Yq5J31gKTtcblxuICAgIC8vIDIuIOODhuOCueODiOOCqOODs+OCuOODs+OBruWIneacn+WMllxuICAgIGNvbnNvbGUubG9nKCdcXG7wn5SnIOODhuOCueODiOOCqOODs+OCuOODs+OCkuWIneacn+WMluS4rS4uLicpO1xuICAgIHRlc3RFbmdpbmUgPSBuZXcgUHJvZHVjdGlvblRlc3RFbmdpbmUoY29uZmlnKTtcbiAgICBhd2FpdCB0ZXN0RW5naW5lLmluaXRpYWxpemUoKTtcbiAgICBjb25zb2xlLmxvZygn4pyFIOODhuOCueODiOOCqOODs+OCuOODs+WIneacn+WMluWujOS6hicpO1xuXG4gICAgLy8gMy4g6KqN6Ki844OG44K544OI44Op44Oz44OK44O844Gu5L2c5oiQXG4gICAgY29uc29sZS5sb2coJ1xcbvCflJAg6KqN6Ki844OG44K544OI44Op44Oz44OK44O844KS5L2c5oiQ5LitLi4uJyk7XG4gICAgdGVzdFJ1bm5lciA9IG5ldyBBdXRoZW50aWNhdGlvblRlc3RSdW5uZXIoY29uZmlnLCB0ZXN0RW5naW5lKTtcbiAgICBjb25zb2xlLmxvZygn4pyFIOiqjeiovOODhuOCueODiOODqeODs+ODiuODvOS9nOaIkOWujOS6hicpO1xuXG4gICAgLy8gNC4g6KqN6Ki844OG44K544OI44Gu5a6f6KGMXG4gICAgY29uc29sZS5sb2coJ1xcbvCfp6og6KqN6Ki844OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgICBcbiAgICBjb25zdCB0ZXN0UmVzdWx0cyA9IGF3YWl0IHRlc3RSdW5uZXIucnVuQXV0aGVudGljYXRpb25UZXN0cygpO1xuXG4gICAgLy8gNS4g57WQ5p6c44Gu6KGo56S6XG4gICAgY29uc29sZS5sb2coJ1xcbvCfk4og44OG44K544OI57WQ5p6c44K144Oe44Oq44O8Jyk7XG4gICAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgICBjb25zb2xlLmxvZyhg57eP44OG44K544OI5pWwOiAke3Rlc3RSZXN1bHRzLnN1bW1hcnkudG90YWxUZXN0c31gKTtcbiAgICBjb25zb2xlLmxvZyhg5oiQ5YqfOiAke3Rlc3RSZXN1bHRzLnN1bW1hcnkucGFzc2VkVGVzdHN9YCk7XG4gICAgY29uc29sZS5sb2coYOWkseaVlzogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5LmZhaWxlZFRlc3RzfWApO1xuICAgIGNvbnNvbGUubG9nKGDjgrnjgq3jg4Pjg5c6ICR7dGVzdFJlc3VsdHMuc3VtbWFyeS5za2lwcGVkVGVzdHN9YCk7XG4gICAgY29uc29sZS5sb2coYOaIkOWKn+eOhzogJHsodGVzdFJlc3VsdHMuc3VtbWFyeS5zdWNjZXNzUmF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYOe3j+Wun+ihjOaZgumWkzogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5LnRvdGFsRHVyYXRpb259bXNgKTtcblxuICAgIC8vIDYuIOips+e0sOODrOODneODvOODiOOBrueUn+aIkFxuICAgIGNvbnNvbGUubG9nKCdcXG7wn5OEIOips+e0sOODrOODneODvOODiOOCkueUn+aIkOS4rS4uLicpO1xuICAgIGNvbnN0IGRldGFpbGVkUmVwb3J0ID0gYXdhaXQgdGVzdFJ1bm5lci5nZW5lcmF0ZURldGFpbGVkUmVwb3J0KHRlc3RSZXN1bHRzLnJlc3VsdHMpO1xuICAgIFxuICAgIC8vIOODrOODneODvOODiOODleOCoeOCpOODq+OBruS/neWtmFxuICAgIGNvbnN0IHJlcG9ydHNEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3Rlc3QtcmVzdWx0cycpO1xuICAgIGF3YWl0IGZzLm1rZGlyKHJlcG9ydHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIFxuICAgIGNvbnN0IHJlcG9ydEZpbGVOYW1lID0gYGF1dGhlbnRpY2F0aW9uLXRlc3QtcmVwb3J0LSR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKX0ubWRgO1xuICAgIGNvbnN0IHJlcG9ydEZpbGVQYXRoID0gcGF0aC5qb2luKHJlcG9ydHNEaXIsIHJlcG9ydEZpbGVOYW1lKTtcbiAgICBcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUocmVwb3J0RmlsZVBhdGgsIGRldGFpbGVkUmVwb3J0LCAndXRmLTgnKTtcbiAgICBjb25zb2xlLmxvZyhg4pyFIOips+e0sOODrOODneODvOODiOS/neWtmOWujOS6hjogJHtyZXBvcnRGaWxlUGF0aH1gKTtcblxuICAgIC8vIDcuIOe1kOaenOOBq+WfuuOBpeOBj+e1guS6huWHpueQhlxuICAgIGlmICh0ZXN0UmVzdWx0cy5zdWNjZXNzKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu8J+OiSDoqo3oqLzjgrfjgrnjg4bjg6Djg4bjgrnjg4jlrozkuoYgLSDlhajjg4bjgrnjg4jmiJDlip8nKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJ1xcbuKaoO+4jyDoqo3oqLzjgrfjgrnjg4bjg6Djg4bjgrnjg4jlrozkuoYgLSDkuIDpg6jjg4bjgrnjg4jlpLHmlZcnKTtcbiAgICAgIGNvbnNvbGUubG9nKCfoqbPntLDjga/kuIroqJjjga7jg6zjg53jg7zjg4jjg5XjgqHjgqTjg6vjgpLnorroqo3jgZfjgabjgY/jgaDjgZXjgYTjgIInKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdcXG7inYwg6KqN6Ki844OG44K544OI5a6f6KGM5Lit44Gr44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOicpO1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgLy8g44Ko44Op44O85oOF5aCx44Gu5L+d5a2YXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVycm9yUmVwb3J0c0RpciA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAndGVzdC1yZXN1bHRzJywgJ2Vycm9ycycpO1xuICAgICAgYXdhaXQgZnMubWtkaXIoZXJyb3JSZXBvcnRzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgZXJyb3JGaWxlTmFtZSA9IGBhdXRoZW50aWNhdGlvbi10ZXN0LWVycm9yLSR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKX0uanNvbmA7XG4gICAgICBjb25zdCBlcnJvckZpbGVQYXRoID0gcGF0aC5qb2luKGVycm9yUmVwb3J0c0RpciwgZXJyb3JGaWxlTmFtZSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGVycm9yUmVwb3J0ID0ge1xuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgdGVzdFR5cGU6ICdhdXRoZW50aWNhdGlvbicsXG4gICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgIHN0YWNrOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWRcbiAgICAgICAgfSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBub2RlVmVyc2lvbjogcHJvY2Vzcy52ZXJzaW9uLFxuICAgICAgICAgIHBsYXRmb3JtOiBwcm9jZXNzLnBsYXRmb3JtLFxuICAgICAgICAgIGN3ZDogcHJvY2Vzcy5jd2QoKVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGUoZXJyb3JGaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoZXJyb3JSZXBvcnQsIG51bGwsIDIpLCAndXRmLTgnKTtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OEIOOCqOODqeODvOODrOODneODvOODiOS/neWtmDogJHtlcnJvckZpbGVQYXRofWApO1xuICAgICAgXG4gICAgfSBjYXRjaCAocmVwb3J0RXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+OCqOODqeODvOODrOODneODvOODiOS/neWtmOOBq+WkseaVlzonLCByZXBvcnRFcnJvcik7XG4gICAgfVxuXG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgLy8g44Kv44Oq44O844Oz44Ki44OD44OX5Yem55CGXG4gICAgY29uc29sZS5sb2coJ1xcbvCfp7kg44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGlmICh0ZXN0UnVubmVyKSB7XG4gICAgICAgIGF3YWl0IHRlc3RSdW5uZXIuY2xlYW51cCgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAodGVzdEVuZ2luZSkge1xuICAgICAgICBhd2FpdCB0ZXN0RW5naW5lLmNsZWFudXAoKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ+KchSDjgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcbiAgICAgIFxuICAgIH0gY2F0Y2ggKGNsZWFudXBFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4pqg77iPIOOCr+ODquODvOODs+OCouODg+ODl+S4reOBq+OCqOODqeODvOOBjOeZuueUn+OBl+OBvuOBl+OBnzonLCBjbGVhbnVwRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIOacquWHpueQhuS+i+WkluOBruODj+ODs+ODieODquODs+OCsFxuICovXG5wcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKCfwn5qoIOacquWHpueQhuS+i+WkljonLCBlcnJvcik7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn0pO1xuXG5wcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uLCBwcm9taXNlKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoJ/Cfmqgg5pyq5Yem55CG44GuUHJvbWlzZeaLkuWQpjonLCByZWFzb24pO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59KTtcblxuLyoqXG4gKiDntYLkuobjgrfjgrDjg4rjg6vjga7jg4/jg7Pjg4njg6rjg7PjgrBcbiAqL1xucHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnXFxu8J+bkSBTSUdJTlTlj5fkv6EgLSDoqo3oqLzjg4bjgrnjg4jjgpLkuK3mlq3jgZfjgb7jgZkuLi4nKTtcbiAgcHJvY2Vzcy5leGl0KDEzMCk7XG59KTtcblxucHJvY2Vzcy5vbignU0lHVEVSTScsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ1xcbvCfm5EgU0lHVEVSTeWPl+S/oSAtIOiqjeiovOODhuOCueODiOOCkuS4reaWreOBl+OBvuOBmS4uLicpO1xuICBwcm9jZXNzLmV4aXQoMTQzKTtcbn0pO1xuXG4vLyDjg6HjgqTjg7PplqLmlbDjga7lrp/ooYxcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKCkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIOODoeOCpOODs+mWouaVsOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9KTtcbn0iXX0=