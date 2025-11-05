#!/usr/bin/env node
"use strict";
/**
 * ドキュメント生成システムの最終テスト
 * 各コンポーネントの動作確認と品質検証を実施
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
Object.defineProperty(exports, "__esModule", { value: true });
const operational_guides_generator_1 = require("./generators/operational-guides-generator");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * デフォルトテスト設定
 */
const DEFAULT_TEST_CONFIG = {
    enablePerformanceTest: true,
    enableContentValidation: true,
    minContentLength: 100, // 最小コンテンツ長
    maxExecutionTime: 5000 // 最大実行時間（ミリ秒）
};
/**
 * 設定ファイルからテスト設定を読み込み
 */
function loadTestConfig() {
    try {
        const configPath = path.join(__dirname, 'test-config.json');
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf-8');
            const customConfig = JSON.parse(configData);
            return {
                ...DEFAULT_TEST_CONFIG,
                ...customConfig
            };
        }
    }
    catch (error) {
        console.warn('⚠️ 設定ファイルの読み込みに失敗しました。デフォルト設定を使用します。');
    }
    return DEFAULT_TEST_CONFIG;
}
/**
 * テスト結果をファイルに保存
 */
function saveTestResults(results) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultPath = path.join(__dirname, `test-results-${timestamp}.json`);
        const testReport = {
            timestamp: new Date().toISOString(),
            totalTests: results.length,
            successfulTests: results.filter(r => r.success).length,
            results: results.map(r => ({
                name: r.name,
                success: r.success,
                contentLength: r.contentLength,
                duration: r.duration,
                error: r.error?.message
            }))
        };
        fs.writeFileSync(resultPath, JSON.stringify(testReport, null, 2));
        console.log(`📄 テスト結果を保存しました: ${resultPath}`);
    }
    catch (error) {
        console.warn('⚠️ テスト結果の保存に失敗しました:', error);
    }
}
/**
 * 運用ガイド生成器のテスト実行
 */
async function testOperationalGuides(config) {
    const results = [];
    const operationalGenerator = new operational_guides_generator_1.OperationalGuidesGenerator();
    // テスト対象メソッドの定義
    const testCases = [
        {
            name: 'トラブルシューティングガイド',
            method: () => operationalGenerator.generateTroubleshootingGuide()
        },
        {
            name: '運用チェックリスト',
            method: () => operationalGenerator.generateOperationalChecklist()
        },
        {
            name: '監視ガイド',
            method: () => operationalGenerator.generateMonitoringGuide()
        }
    ];
    // 並列実行でパフォーマンス向上
    const testPromises = testCases.map(async (testCase) => {
        const startTime = Date.now();
        try {
            // メモリ効率を考慮した実行
            const content = await Promise.resolve(testCase.method());
            const duration = Date.now() - startTime;
            // コンテンツ検証（非同期で実行）
            const isValidContent = config.enableContentValidation ?
                await Promise.resolve(validateContent(content, config.minContentLength)) : true;
            // パフォーマンス検証
            const isValidPerformance = config.enablePerformanceTest ?
                duration <= config.maxExecutionTime : true;
            const success = isValidContent && isValidPerformance;
            const result = {
                name: testCase.name,
                success,
                contentLength: content.length,
                duration,
                error: success ? undefined : new Error('検証失敗')
            };
            console.log(`   📖 ${testCase.name}: ${content.length} 文字 (${duration}ms)`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const result = {
                name: testCase.name,
                success: false,
                contentLength: 0,
                duration,
                error: error instanceof Error ? error : new Error(String(error))
            };
            console.error(`   ❌ ${testCase.name}: エラー発生`);
            return result;
        }
    });
    // 全ての並列テストの完了を待機
    const testResults = await Promise.allSettled(testPromises);
    // 結果の集約（エラーハンドリング付き）
    testResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            results.push(result.value);
        }
        else {
            results.push({
                name: testCases[index].name,
                success: false,
                contentLength: 0,
                duration: 0,
                error: new Error(`並列実行エラー: ${result.reason}`)
            });
        }
    });
    return results;
}
/**
 * コンテンツの品質検証
 */
function validateContent(content, minLength) {
    if (!content || typeof content !== 'string') {
        return false;
    }
    if (content.length < minLength) {
        return false;
    }
    // 基本的なマークダウン構造の確認
    const hasHeaders = /^#\s+/.test(content);
    const hasContent = content.trim().length > 0;
    return hasHeaders && hasContent;
}
/**
 * テスト結果の表示
 */
function displayTestResults(results) {
    console.log('');
    console.log('📊 テスト結果サマリー:');
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = (successCount / totalCount * 100).toFixed(1);
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const performance = result.duration < 1000 ? '⚡' : result.duration < 3000 ? '🐌' : '🚨';
        console.log(`   ${status} ${result.name}: ${result.success ? '成功' : '失敗'} ${performance}`);
        if (result.error) {
            console.log(`      エラー: ${result.error.message}`);
        }
    });
    console.log('');
    console.log(`📈 成功率: ${successRate}% (${successCount}/${totalCount})`);
    if (successCount === totalCount) {
        console.log('🎉 全てのテストが正常に完了しました！');
    }
    else {
        console.log('⚠️ 一部のテストで問題が発生しました。');
    }
}
/**
 * メインテスト関数
 */
async function finalTest() {
    console.log('🎯 ドキュメント生成システムの最終テストを開始します...');
    console.log('=================================================');
    console.log('');
    const startTime = Date.now();
    try {
        // 設定の読み込み
        const testConfig = loadTestConfig();
        console.log(`🔧 テスト設定: パフォーマンステスト=${testConfig.enablePerformanceTest}, コンテンツ検証=${testConfig.enableContentValidation}`);
        // 1. 運用ガイド生成器のテスト
        console.log('1️⃣ 運用ガイド生成器のテスト...');
        const operationalResults = await testOperationalGuides(testConfig);
        console.log('   ✅ 運用ガイド生成テスト完了');
        // テスト結果の表示と保存
        displayTestResults(operationalResults);
        saveTestResults(operationalResults);
        const totalDuration = Date.now() - startTime;
        const allSuccess = operationalResults.every(r => r.success);
        console.log('');
        console.log('=================================================');
        console.log(`⏱️ 総実行時間: ${totalDuration}ms`);
        if (allSuccess) {
            console.log('');
            console.log('💡 次のステップ:');
            console.log('   1. npm run docs:generate でフルドキュメント生成を実行');
            console.log('   2. 生成されたドキュメントを確認');
            console.log('   3. 必要に応じてカスタマイズ');
            console.log('');
            console.log('📚 ドキュメント生成システムが正常に動作しています！');
        }
        else {
            console.log('');
            console.log('🔧 推奨対応:');
            console.log('   1. エラーログを確認');
            console.log('   2. 失敗したコンポーネントを修正');
            console.log('   3. テストを再実行');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('');
        console.error('❌ テスト実行エラー:');
        if (error instanceof Error) {
            console.error(`エラーメッセージ: ${error.message}`);
            if (error.stack) {
                console.error(`スタックトレース: ${error.stack}`);
            }
        }
        else {
            console.error(error);
        }
        console.error('');
        process.exit(1);
    }
}
/**
 * プロセス終了時のクリーンアップ
 */
function cleanup() {
    // 必要に応じてリソースのクリーンアップを実行
    console.log('🧹 クリーンアップ処理完了');
}
/**
 * 予期しないエラーのハンドリング
 */
process.on('uncaughtException', (error) => {
    console.error('❌ 予期しないエラーが発生しました:', error.message);
    cleanup();
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('❌ 未処理のPromise拒否:', reason);
    cleanup();
    process.exit(1);
});
/**
 * 正常終了時のクリーンアップ
 */
process.on('exit', (code) => {
    if (code === 0) {
        cleanup();
    }
});
/**
 * メイン実行部
 */
if (require.main === module) {
    finalTest().catch((error) => {
        console.error('❌ 最終テスト実行エラー:', error);
        cleanup();
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluYWwtdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZpbmFsLXRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCw0RkFBdUY7QUFDdkYsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQXVCN0I7O0dBRUc7QUFDSCxNQUFNLG1CQUFtQixHQUFlO0lBQ3RDLHFCQUFxQixFQUFFLElBQUk7SUFDM0IsdUJBQXVCLEVBQUUsSUFBSTtJQUM3QixnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsV0FBVztJQUNsQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsY0FBYztDQUN0QyxDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFTLGNBQWM7SUFDckIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUM1RCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUM5QixNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN4RCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBd0IsQ0FBQztZQUVuRSxPQUFPO2dCQUNMLEdBQUcsbUJBQW1CO2dCQUN0QixHQUFHLFlBQVk7YUFDaEIsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsT0FBTyxtQkFBbUIsQ0FBQztBQUM3QixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGVBQWUsQ0FBQyxPQUFxQjtJQUM1QyxJQUFJLENBQUM7UUFDSCxNQUFNLFNBQVMsR0FBRyxJQUFJLElBQUksRUFBRSxD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RUFBRSxFQUFFO0lBQ2xDLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ2YsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFFSDs7R0FFRztBQUNILElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUM1QixTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0QyxPQUFPLEVBQUUsQ0FBQztRQUNWLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqIOODieOCreODpeODoeODs+ODiOeUn+aIkOOCt+OCueODhuODoOOBruacgOe1guODhuOCueODiFxuICog5ZCE44Kz44Oz44Od44O844ON44Oz44OI44Gu5YuV5L2c56K66KqN44Go5ZOB6LOq5qSc6Ki844KS5a6f5pa9XG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgeyBPcGVyYXRpb25hbEd1aWRlc0dlbmVyYXRvciB9IGZyb20gJy4vZ2VuZXJhdG9ycy9vcGVyYXRpb25hbC1ndWlkZXMtZ2VuZXJhdG9yJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8qKlxuICog44OG44K544OI57WQ5p6c44Gu5Z6L5a6a576pXG4gKi9cbmludGVyZmFjZSBUZXN0UmVzdWx0IHtcbiAgbmFtZTogc3RyaW5nO1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBjb250ZW50TGVuZ3RoOiBudW1iZXI7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIGVycm9yPzogRXJyb3I7XG59XG5cbi8qKlxuICog44OG44K544OI6Kit5a6a44Gu5Z6L5a6a576pXG4gKi9cbmludGVyZmFjZSBUZXN0Q29uZmlnIHtcbiAgZW5hYmxlUGVyZm9ybWFuY2VUZXN0OiBib29sZWFuO1xuICBlbmFibGVDb250ZW50VmFsaWRhdGlvbjogYm9vbGVhbjtcbiAgbWluQ29udGVudExlbmd0aDogbnVtYmVyO1xuICBtYXhFeGVjdXRpb25UaW1lOiBudW1iZXI7XG59XG5cbi8qKlxuICog44OH44OV44Kp44Or44OI44OG44K544OI6Kit5a6aXG4gKi9cbmNvbnN0IERFRkFVTFRfVEVTVF9DT05GSUc6IFRlc3RDb25maWcgPSB7XG4gIGVuYWJsZVBlcmZvcm1hbmNlVGVzdDogdHJ1ZSxcbiAgZW5hYmxlQ29udGVudFZhbGlkYXRpb246IHRydWUsXG4gIG1pbkNvbnRlbnRMZW5ndGg6IDEwMCwgLy8g5pyA5bCP44Kz44Oz44OG44Oz44OE6ZW3XG4gIG1heEV4ZWN1dGlvblRpbWU6IDUwMDAgLy8g5pyA5aSn5a6f6KGM5pmC6ZaT77yI44Of44Oq56eS77yJXG59O1xuXG4vKipcbiAqIOioreWumuODleOCoeOCpOODq+OBi+OCieODhuOCueODiOioreWumuOCkuiqreOBv+i+vOOBv1xuICovXG5mdW5jdGlvbiBsb2FkVGVzdENvbmZpZygpOiBUZXN0Q29uZmlnIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWdQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ3Rlc3QtY29uZmlnLmpzb24nKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgY29uc3QgY29uZmlnRGF0YSA9IGZzLnJlYWRGaWxlU3luYyhjb25maWdQYXRoLCAndXRmLTgnKTtcbiAgICAgIGNvbnN0IGN1c3RvbUNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnRGF0YSkgYXMgUGFydGlhbDxUZXN0Q29uZmlnPjtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uREVGQVVMVF9URVNUX0NPTkZJRyxcbiAgICAgICAgLi4uY3VzdG9tQ29uZmlnXG4gICAgICB9O1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyDoqK3lrprjg5XjgqHjgqTjg6vjga7oqq3jgb/ovrzjgb/jgavlpLHmlZfjgZfjgb7jgZfjgZ/jgILjg4fjg5Xjgqnjg6vjg4joqK3lrprjgpLkvb/nlKjjgZfjgb7jgZnjgIInKTtcbiAgfVxuICBcbiAgcmV0dXJuIERFRkFVTFRfVEVTVF9DT05GSUc7XG59XG5cbi8qKlxuICog44OG44K544OI57WQ5p6c44KS44OV44Kh44Kk44Or44Gr5L+d5a2YXG4gKi9cbmZ1bmN0aW9uIHNhdmVUZXN0UmVzdWx0cyhyZXN1bHRzOiBUZXN0UmVzdWx0W10pOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpO1xuICAgIGNvbnN0IHJlc3VsdFBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCBgdGVzdC1yZXN1bHRzLSR7dGltZXN0YW1wfS5qc29uYCk7XG4gICAgXG4gICAgY29uc3QgdGVzdFJlcG9ydCA9IHtcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgdG90YWxUZXN0czogcmVzdWx0cy5sZW5ndGgsXG4gICAgICBzdWNjZXNzZnVsVGVzdHM6IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGgsXG4gICAgICByZXN1bHRzOiByZXN1bHRzLm1hcChyID0+ICh7XG4gICAgICAgIG5hbWU6IHIubmFtZSxcbiAgICAgICAgc3VjY2Vzczogci5zdWNjZXNzLFxuICAgICAgICBjb250ZW50TGVuZ3RoOiByLmNvbnRlbnRMZW5ndGgsXG4gICAgICAgIGR1cmF0aW9uOiByLmR1cmF0aW9uLFxuICAgICAgICBlcnJvcjogci5lcnJvcj8ubWVzc2FnZVxuICAgICAgfSkpXG4gICAgfTtcbiAgICBcbiAgICBmcy53cml0ZUZpbGVTeW5jKHJlc3VsdFBhdGgsIEpTT04uc3RyaW5naWZ5KHRlc3RSZXBvcnQsIG51bGwsIDIpKTtcbiAgICBjb25zb2xlLmxvZyhg8J+ThCDjg4bjgrnjg4jntZDmnpzjgpLkv53lrZjjgZfjgb7jgZfjgZ86ICR7cmVzdWx0UGF0aH1gKTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyDjg4bjgrnjg4jntZDmnpzjga7kv53lrZjjgavlpLHmlZfjgZfjgb7jgZfjgZ86JywgZXJyb3IpO1xuICB9XG59XG5cbi8qKlxuICog6YGL55So44Ks44Kk44OJ55Sf5oiQ5Zmo44Gu44OG44K544OI5a6f6KGMXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHRlc3RPcGVyYXRpb25hbEd1aWRlcyhjb25maWc6IFRlc3RDb25maWcpOiBQcm9taXNlPFRlc3RSZXN1bHRbXT4ge1xuICBjb25zdCByZXN1bHRzOiBUZXN0UmVzdWx0W10gPSBbXTtcbiAgY29uc3Qgb3BlcmF0aW9uYWxHZW5lcmF0b3IgPSBuZXcgT3BlcmF0aW9uYWxHdWlkZXNHZW5lcmF0b3IoKTtcblxuICAvLyDjg4bjgrnjg4jlr77osaHjg6Hjgr3jg4Pjg4njga7lrprnvqlcbiAgY29uc3QgdGVzdENhc2VzID0gW1xuICAgIHtcbiAgICAgIG5hbWU6ICfjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4knLFxuICAgICAgbWV0aG9kOiAoKSA9PiBvcGVyYXRpb25hbEdlbmVyYXRvci5nZW5lcmF0ZVRyb3VibGVzaG9vdGluZ0d1aWRlKClcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICfpgYvnlKjjg4Hjgqfjg4Pjgq/jg6rjgrnjg4gnLFxuICAgICAgbWV0aG9kOiAoKSA9PiBvcGVyYXRpb25hbEdlbmVyYXRvci5nZW5lcmF0ZU9wZXJhdGlvbmFsQ2hlY2tsaXN0KClcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICfnm6PoppbjgqzjgqTjg4knLFxuICAgICAgbWV0aG9kOiAoKSA9PiBvcGVyYXRpb25hbEdlbmVyYXRvci5nZW5lcmF0ZU1vbml0b3JpbmdHdWlkZSgpXG4gICAgfVxuICBdO1xuXG4gIC8vIOS4puWIl+Wun+ihjOOBp+ODkeODleOCqeODvOODnuODs+OCueWQkeS4ilxuICBjb25zdCB0ZXN0UHJvbWlzZXMgPSB0ZXN0Q2FzZXMubWFwKGFzeW5jICh0ZXN0Q2FzZSkgPT4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIOODoeODouODquWKueeOh+OCkuiAg+aFruOBl+OBn+Wun+ihjFxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IFByb21pc2UucmVzb2x2ZSh0ZXN0Q2FzZS5tZXRob2QoKSk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBcbiAgICAgIC8vIOOCs+ODs+ODhuODs+ODhOaknOiovO+8iOmdnuWQjOacn+OBp+Wun+ihjO+8iVxuICAgICAgY29uc3QgaXNWYWxpZENvbnRlbnQgPSBjb25maWcuZW5hYmxlQ29udGVudFZhbGlkYXRpb24gPyBcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKHZhbGlkYXRlQ29udGVudChjb250ZW50LCBjb25maWcubWluQ29udGVudExlbmd0aCkpIDogdHJ1ZTtcbiAgICAgIFxuICAgICAgLy8g44OR44OV44Kp44O844Oe44Oz44K55qSc6Ki8XG4gICAgICBjb25zdCBpc1ZhbGlkUGVyZm9ybWFuY2UgPSBjb25maWcuZW5hYmxlUGVyZm9ybWFuY2VUZXN0ID8gXG4gICAgICAgIGR1cmF0aW9uIDw9IGNvbmZpZy5tYXhFeGVjdXRpb25UaW1lIDogdHJ1ZTtcbiAgICAgIFxuICAgICAgY29uc3Qgc3VjY2VzcyA9IGlzVmFsaWRDb250ZW50ICYmIGlzVmFsaWRQZXJmb3JtYW5jZTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0OiBUZXN0UmVzdWx0ID0ge1xuICAgICAgICBuYW1lOiB0ZXN0Q2FzZS5uYW1lLFxuICAgICAgICBzdWNjZXNzLFxuICAgICAgICBjb250ZW50TGVuZ3RoOiBjb250ZW50Lmxlbmd0aCxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIGVycm9yOiBzdWNjZXNzID8gdW5kZWZpbmVkIDogbmV3IEVycm9yKCfmpJzoqLzlpLHmlZcnKVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYCAgIPCfk5YgJHt0ZXN0Q2FzZS5uYW1lfTogJHtjb250ZW50Lmxlbmd0aH0g5paH5a2XICgke2R1cmF0aW9ufW1zKWApO1xuICAgICAgXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIGNvbnN0IHJlc3VsdDogVGVzdFJlc3VsdCA9IHtcbiAgICAgICAgbmFtZTogdGVzdENhc2UubmFtZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGNvbnRlbnRMZW5ndGg6IDAsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zb2xlLmVycm9yKGAgICDinYwgJHt0ZXN0Q2FzZS5uYW1lfTog44Ko44Op44O855m655SfYCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfSk7XG5cbiAgLy8g5YWo44Gm44Gu5Lim5YiX44OG44K544OI44Gu5a6M5LqG44KS5b6F5qmfXG4gIGNvbnN0IHRlc3RSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKHRlc3RQcm9taXNlcyk7XG4gIFxuICAvLyDntZDmnpzjga7pm4bntITvvIjjgqjjg6njg7zjg4/jg7Pjg4njg6rjg7PjgrDku5jjgY3vvIlcbiAgdGVzdFJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpbmRleCkgPT4ge1xuICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJykge1xuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdC52YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIG5hbWU6IHRlc3RDYXNlc1tpbmRleF0ubmFtZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGNvbnRlbnRMZW5ndGg6IDAsXG4gICAgICAgIGR1cmF0aW9uOiAwLFxuICAgICAgICBlcnJvcjogbmV3IEVycm9yKGDkuKbliJflrp/ooYzjgqjjg6njg7w6ICR7cmVzdWx0LnJlYXNvbn1gKVxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiDjgrPjg7Pjg4bjg7Pjg4Tjga7lk4Hos6rmpJzoqLxcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDb250ZW50KGNvbnRlbnQ6IHN0cmluZywgbWluTGVuZ3RoOiBudW1iZXIpOiBib29sZWFuIHtcbiAgaWYgKCFjb250ZW50IHx8IHR5cGVvZiBjb250ZW50ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgaWYgKGNvbnRlbnQubGVuZ3RoIDwgbWluTGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvLyDln7rmnKznmoTjgarjg57jg7zjgq/jg4Djgqbjg7Pmp4vpgKDjga7norroqo1cbiAgY29uc3QgaGFzSGVhZGVycyA9IC9eI1xccysvLnRlc3QoY29udGVudCk7XG4gIGNvbnN0IGhhc0NvbnRlbnQgPSBjb250ZW50LnRyaW0oKS5sZW5ndGggPiAwO1xuICBcbiAgcmV0dXJuIGhhc0hlYWRlcnMgJiYgaGFzQ29udGVudDtcbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jntZDmnpzjga7ooajnpLpcbiAqL1xuZnVuY3Rpb24gZGlzcGxheVRlc3RSZXN1bHRzKHJlc3VsdHM6IFRlc3RSZXN1bHRbXSk6IHZvaWQge1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCfwn5OKIOODhuOCueODiOe1kOaenOOCteODnuODquODvDonKTtcbiAgXG4gIGNvbnN0IHN1Y2Nlc3NDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XG4gIGNvbnN0IHRvdGFsQ291bnQgPSByZXN1bHRzLmxlbmd0aDtcbiAgY29uc3Qgc3VjY2Vzc1JhdGUgPSAoc3VjY2Vzc0NvdW50IC8gdG90YWxDb3VudCAqIDEwMCkudG9GaXhlZCgxKTtcbiAgXG4gIHJlc3VsdHMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgIGNvbnN0IHN0YXR1cyA9IHJlc3VsdC5zdWNjZXNzID8gJ+KchScgOiAn4p2MJztcbiAgICBjb25zdCBwZXJmb3JtYW5jZSA9IHJlc3VsdC5kdXJhdGlvbiA8IDEwMDAgPyAn4pqhJyA6IHJlc3VsdC5kdXJhdGlvbiA8IDMwMDAgPyAn8J+QjCcgOiAn8J+aqCc7XG4gICAgXG4gICAgY29uc29sZS5sb2coYCAgICR7c3RhdHVzfSAke3Jlc3VsdC5uYW1lfTogJHtyZXN1bHQuc3VjY2VzcyA/ICfmiJDlip8nIDogJ+WkseaVlyd9ICR7cGVyZm9ybWFuY2V9YCk7XG4gICAgXG4gICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgY29uc29sZS5sb2coYCAgICAgIOOCqOODqeODvDogJHtyZXN1bHQuZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9XG4gIH0pO1xuICBcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZyhg8J+TiCDmiJDlip/njoc6ICR7c3VjY2Vzc1JhdGV9JSAoJHtzdWNjZXNzQ291bnR9LyR7dG90YWxDb3VudH0pYCk7XG4gIFxuICBpZiAoc3VjY2Vzc0NvdW50ID09PSB0b3RhbENvdW50KSB7XG4gICAgY29uc29sZS5sb2coJ/Cfjokg5YWo44Gm44Gu44OG44K544OI44GM5q2j5bi444Gr5a6M5LqG44GX44G+44GX44Gf77yBJyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ+KaoO+4jyDkuIDpg6jjga7jg4bjgrnjg4jjgafllY/poYzjgYznmbrnlJ/jgZfjgb7jgZfjgZ/jgIInKTtcbiAgfVxufVxuXG4vKipcbiAqIOODoeOCpOODs+ODhuOCueODiOmWouaVsFxuICovXG5hc3luYyBmdW5jdGlvbiBmaW5hbFRlc3QoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCfwn46vIOODieOCreODpeODoeODs+ODiOeUn+aIkOOCt+OCueODhuODoOOBruacgOe1guODhuOCueODiOOCkumWi+Wni+OBl+OBvuOBmS4uLicpO1xuICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuICBjb25zb2xlLmxvZygnJyk7XG5cbiAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICB0cnkge1xuICAgIC8vIOioreWumuOBruiqreOBv+i+vOOBv1xuICAgIGNvbnN0IHRlc3RDb25maWcgPSBsb2FkVGVzdENvbmZpZygpO1xuICAgIGNvbnNvbGUubG9nKGDwn5SnIOODhuOCueODiOioreWumjog44OR44OV44Kp44O844Oe44Oz44K544OG44K544OIPSR7dGVzdENvbmZpZy5lbmFibGVQZXJmb3JtYW5jZVRlc3R9LCDjgrPjg7Pjg4bjg7Pjg4TmpJzoqLw9JHt0ZXN0Q29uZmlnLmVuYWJsZUNvbnRlbnRWYWxpZGF0aW9ufWApO1xuICAgIFxuICAgIC8vIDEuIOmBi+eUqOOCrOOCpOODieeUn+aIkOWZqOOBruODhuOCueODiFxuICAgIGNvbnNvbGUubG9nKCcx77iP4oOjIOmBi+eUqOOCrOOCpOODieeUn+aIkOWZqOOBruODhuOCueODiC4uLicpO1xuICAgIGNvbnN0IG9wZXJhdGlvbmFsUmVzdWx0cyA9IGF3YWl0IHRlc3RPcGVyYXRpb25hbEd1aWRlcyh0ZXN0Q29uZmlnKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnICAg4pyFIOmBi+eUqOOCrOOCpOODieeUn+aIkOODhuOCueODiOWujOS6hicpO1xuXG4gICAgLy8g44OG44K544OI57WQ5p6c44Gu6KGo56S644Go5L+d5a2YXG4gICAgZGlzcGxheVRlc3RSZXN1bHRzKG9wZXJhdGlvbmFsUmVzdWx0cyk7XG4gICAgc2F2ZVRlc3RSZXN1bHRzKG9wZXJhdGlvbmFsUmVzdWx0cyk7XG4gICAgXG4gICAgY29uc3QgdG90YWxEdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgY29uc3QgYWxsU3VjY2VzcyA9IG9wZXJhdGlvbmFsUmVzdWx0cy5ldmVyeShyID0+IHIuc3VjY2Vzcyk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gICAgY29uc29sZS5sb2coYOKPse+4jyDnt4/lrp/ooYzmmYLplpM6ICR7dG90YWxEdXJhdGlvbn1tc2ApO1xuICAgIFxuICAgIGlmIChhbGxTdWNjZXNzKSB7XG4gICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICBjb25zb2xlLmxvZygn8J+SoSDmrKHjga7jgrnjg4bjg4Pjg5c6Jyk7XG4gICAgICBjb25zb2xlLmxvZygnICAgMS4gbnBtIHJ1biBkb2NzOmdlbmVyYXRlIOOBp+ODleODq+ODieOCreODpeODoeODs+ODiOeUn+aIkOOCkuWun+ihjCcpO1xuICAgICAgY29uc29sZS5sb2coJyAgIDIuIOeUn+aIkOOBleOCjOOBn+ODieOCreODpeODoeODs+ODiOOCkueiuuiqjScpO1xuICAgICAgY29uc29sZS5sb2coJyAgIDMuIOW/heimgeOBq+W/nOOBmOOBpuOCq+OCueOCv+ODnuOCpOOCuicpO1xuICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgY29uc29sZS5sb2coJ/Cfk5og44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ44K344K544OG44Og44GM5q2j5bi444Gr5YuV5L2c44GX44Gm44GE44G+44GZ77yBJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SnIOaOqOWlqOWvvuW/nDonKTtcbiAgICAgIGNvbnNvbGUubG9nKCcgICAxLiDjgqjjg6njg7zjg63jgrDjgpLnorroqo0nKTtcbiAgICAgIGNvbnNvbGUubG9nKCcgICAyLiDlpLHmlZfjgZfjgZ/jgrPjg7Pjg53jg7zjg43jg7Pjg4jjgpLkv67mraMnKTtcbiAgICAgIGNvbnNvbGUubG9nKCcgICAzLiDjg4bjgrnjg4jjgpLlho3lrp/ooYwnKTtcbiAgICAgIFxuICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJycpO1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6Jyk7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOOCqOODqeODvOODoeODg+OCu+ODvOOCuDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgaWYgKGVycm9yLnN0YWNrKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYOOCueOCv+ODg+OCr+ODiOODrOODvOOCuTogJHtlcnJvci5zdGFja31gKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuICAgIGNvbnNvbGUuZXJyb3IoJycpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxufVxuXG4vKipcbiAqIOODl+ODreOCu+OCuee1guS6huaZguOBruOCr+ODquODvOODs+OCouODg+ODl1xuICovXG5mdW5jdGlvbiBjbGVhbnVwKCk6IHZvaWQge1xuICAvLyDlv4XopoHjgavlv5zjgZjjgabjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5fjgpLlrp/ooYxcbiAgY29uc29sZS5sb2coJ/Cfp7kg44Kv44Oq44O844Oz44Ki44OD44OX5Yem55CG5a6M5LqGJyk7XG59XG5cbi8qKlxuICog5LqI5pyf44GX44Gq44GE44Ko44Op44O844Gu44OP44Oz44OJ44Oq44Oz44KwXG4gKi9cbnByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgKGVycm9yOiBFcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKCfinYwg5LqI5pyf44GX44Gq44GE44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOicsIGVycm9yLm1lc3NhZ2UpO1xuICBjbGVhbnVwKCk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn0pO1xuXG5wcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uOiB1bmtub3duKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoJ+KdjCDmnKrlh6bnkIbjga5Qcm9taXNl5ouS5ZCmOicsIHJlYXNvbik7XG4gIGNsZWFudXAoKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufSk7XG5cbi8qKlxuICog5q2j5bi457WC5LqG5pmC44Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gKi9cbnByb2Nlc3Mub24oJ2V4aXQnLCAoY29kZTogbnVtYmVyKSA9PiB7XG4gIGlmIChjb2RlID09PSAwKSB7XG4gICAgY2xlYW51cCgpO1xuICB9XG59KTtcblxuLyoqXG4gKiDjg6HjgqTjg7Plrp/ooYzpg6hcbiAqL1xuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGZpbmFsVGVzdCgpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDmnIDntYLjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIGNsZWFudXAoKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH0pO1xufSJdfQ==