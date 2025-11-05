#!/usr/bin/env ts-node
"use strict";
/**
 * RAG統合テストスイート実行スクリプト
 *
 * ベクトル検索、検索統合、コンテキスト維持、権限フィルタリングの包括テスト
 * 実本番AWS環境でのRAG機能品質保証
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
const rag_integration_test_runner_1 = __importDefault(require("../modules/rag/rag-integration-test-runner"));
/**
 * 出力パスのサニタイゼーション（パストラバーサル攻撃防止）
 */
function sanitizeOutputPath(outputPath) {
    // 危険な文字列を除去
    const sanitized = outputPath
        .replace(/\.\./g, '') // パストラバーサル防止
        .replace(/[<>:"|?*]/g, '') // 無効な文字除去
        .trim();
    // 絶対パスの場合は相対パスに変換
    if (path.isAbsolute(sanitized)) {
        return path.join('./test-results', path.basename(sanitized));
    }
    return sanitized || './rag-test-results';
}
/**
 * 機密情報のマスキング
 */
function maskSensitiveInfo(obj) {
    const masked = JSON.parse(JSON.stringify(obj));
    // 機密情報をマスク
    if (masked.config) {
        if (masked.config.awsProfile)
            masked.config.awsProfile = '***';
        if (masked.config.region)
            masked.config.region = masked.config.region.substring(0, 3) + '***';
    }
    return masked;
}
/**
 * メイン実行関数
 */
async function main() {
    console.log('🔍 RAG統合テストスイート実行開始');
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
        // 2. 実行設定の読み込み（セキュリティ強化）
        const executionConfig = {
            includeVectorSearch: process.env.INCLUDE_VECTOR_SEARCH !== 'false',
            includeSearchIntegration: process.env.INCLUDE_SEARCH_INTEGRATION !== 'false',
            includeContextPersistence: process.env.INCLUDE_CONTEXT_PERSISTENCE !== 'false',
            includePermissionFiltering: process.env.INCLUDE_PERMISSION_FILTERING !== 'false',
            generateReport: process.env.GENERATE_REPORT !== 'false',
            outputDirectory: sanitizeOutputPath(process.env.OUTPUT_DIR || './rag-test-results'),
            verbose: process.env.VERBOSE === 'true',
            maxRetries: Math.max(1, Math.min(5, parseInt(process.env.MAX_RETRIES || '3', 10))),
            timeoutMs: Math.max(30000, Math.min(300000, parseInt(process.env.TIMEOUT_MS || '120000', 10)))
        };
        console.log('📋 RAG統合テスト実行設定:');
        console.log(`   ベクトル検索テスト: ${executionConfig.includeVectorSearch ? '有効' : '無効'}`);
        console.log(`   検索統合テスト: ${executionConfig.includeSearchIntegration ? '有効' : '無効'}`);
        console.log(`   コンテキスト維持テスト: ${executionConfig.includeContextPersistence ? '有効' : '無効'}`);
        console.log(`   権限フィルタリングテスト: ${executionConfig.includePermissionFiltering ? '有効' : '無効'}`);
        console.log(`   レポート生成: ${executionConfig.generateReport ? '有効' : '無効'}`);
        console.log(`   出力ディレクトリ: ${executionConfig.outputDirectory}`);
        // 3. 出力ディレクトリの準備
        if (executionConfig.generateReport) {
            if (!fs.existsSync(executionConfig.outputDirectory)) {
                fs.mkdirSync(executionConfig.outputDirectory, { recursive: true });
                console.log(`📁 出力ディレクトリを作成: ${executionConfig.outputDirectory}`);
            }
        }
        // 4. RAG統合テストランナーの初期化
        console.log('🔧 RAG統合テストランナーを初期化中...');
        const ragTestRunner = new rag_integration_test_runner_1.default(production_config_1.defaultProductionConfig);
        // 5. RAG統合テストの実行（タイムアウト・リトライ機能付き）
        console.log('🔍 RAG統合テストを実行中...');
        console.log('-'.repeat(60));
        const startTime = Date.now();
        let testResults;
        let retryCount = 0;
        const maxRetries = executionConfig.maxRetries || 3;
        while (retryCount <= maxRetries) {
            try {
                // タイムアウト付きでテスト実行
                testResults = await Promise.race([
                    ragTestRunner.runComprehensiveRAGTests(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('テスト実行タイムアウト')), executionConfig.timeoutMs || 120000))
                ]);
                break; // 成功時はループを抜ける
            }
            catch (error) {
                retryCount++;
                if (retryCount > maxRetries) {
                    throw error;
                }
                console.log(`⚠️  テスト実行失敗 (${retryCount}/${maxRetries}): ${error}`);
                console.log(`🔄 ${retryCount * 5}秒後にリトライします...`);
                await new Promise(resolve => setTimeout(resolve, retryCount * 5000));
            }
        }
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        console.log('-'.repeat(60));
        console.log('📊 RAG統合テスト実行完了');
        // 6. 結果の表示
        console.log('📈 実行結果サマリー:');
        console.log(`   総実行時間: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}秒)`);
        console.log(`   テスト成功: ${testResults.success ? 'YES' : 'NO'}`);
        if (testResults.ragTestSummary) {
            console.log(`   ベクトル検索: ${(testResults.ragTestSummary.vectorSearchScore * 100).toFixed(1)}%`);
            console.log(`   検索統合: ${(testResults.ragTestSummary.searchIntegrationScore * 100).toFixed(1)}%`);
            console.log(`   コンテキスト維持: ${(testResults.ragTestSummary.contextPersistenceScore * 100).toFixed(1)}%`);
            console.log(`   権限フィルタリング: ${(testResults.ragTestSummary.permissionFilteringScore * 100).toFixed(1)}%`);
            console.log(`   総合RAGスコア: ${(testResults.ragTestSummary.overallRAGScore * 100).toFixed(1)}%`);
        }
        // 7. 詳細結果の表示（verbose モード）
        if (executionConfig.verbose && testResults.detailedResults) {
            console.log('\n📋 詳細テスト結果:');
            // ベクトル検索テスト結果
            if (testResults.detailedResults.vectorSearchResults) {
                console.log('\n🔍 ベクトル検索テスト:');
                testResults.detailedResults.vectorSearchResults.forEach(result => {
                    const status = result.success ? '✅' : '❌';
                    console.log(`   ${status} ${result.testName} - ${result.duration}ms`);
                });
            }
            // 検索統合テスト結果
            if (testResults.detailedResults.searchIntegrationResults) {
                console.log('\n🔗 検索統合テスト:');
                testResults.detailedResults.searchIntegrationResults.forEach(result => {
                    const status = result.success ? '✅' : '❌';
                    console.log(`   ${status} ${result.testName} - ${result.duration}ms`);
                });
            }
            // コンテキスト維持テスト結果
            if (testResults.detailedResults.contextPersistenceResults) {
                console.log('\n💾 コンテキスト維持テスト:');
                testResults.detailedResults.contextPersistenceResults.forEach(result => {
                    const status = result.success ? '✅' : '❌';
                    console.log(`   ${status} ${result.testName} - ${result.duration}ms`);
                });
            }
            // 権限フィルタリングテスト結果
            if (testResults.detailedResults.permissionFilteringResults) {
                console.log('\n🔐 権限フィルタリングテスト:');
                testResults.detailedResults.permissionFilteringResults.forEach(result => {
                    const status = result.success ? '✅' : '❌';
                    console.log(`   ${status} ${result.testName} - ${result.duration}ms`);
                });
            }
        }
        // 8. レポート生成
        if (executionConfig.generateReport) {
            console.log('\n📄 詳細レポートを生成中...');
            const report = await ragTestRunner.generateDetailedRAGReport(testResults);
            const reportPath = path.join(executionConfig.outputDirectory, `rag-integration-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
            fs.writeFileSync(reportPath, report, 'utf8');
            console.log(`✅ 詳細レポートを生成: ${reportPath}`);
            // JSON形式の結果も保存（機密情報マスキング付き）
            const jsonResults = {
                timestamp: new Date().toISOString(),
                executionInfo: {
                    duration: totalDuration,
                    retryCount: retryCount || 0,
                    version: '1.0.0'
                },
                config: maskSensitiveInfo({
                    region: production_config_1.defaultProductionConfig.region,
                    environment: production_config_1.defaultProductionConfig.environment,
                    safetyMode: production_config_1.defaultProductionConfig.safetyMode,
                    readOnlyMode: production_config_1.defaultProductionConfig.readOnlyMode
                }),
                summary: testResults.ragTestSummary,
                results: testResults.detailedResults
            };
            const jsonPath = path.join(executionConfig.outputDirectory, `rag-integration-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(jsonResults, null, 2), 'utf8');
            console.log(`✅ JSON結果を保存: ${jsonPath}`);
        }
        // 9. クリーンアップ
        console.log('\n🧹 リソースをクリーンアップ中...');
        await ragTestRunner.cleanup();
        // 10. 終了処理
        const overallSuccess = testResults.success;
        console.log('\n' + '='.repeat(60));
        if (overallSuccess) {
            console.log('🎉 RAG統合テストスイート実行成功');
            console.log('✅ 全てのRAG機能が正常に動作しています');
        }
        else {
            console.log('⚠️  RAG統合テストスイート実行完了（一部失敗）');
            console.log('❌ 一部のRAG機能に問題があります');
        }
        if (testResults.ragTestSummary) {
            console.log(`📊 最終RAGスコア: ${(testResults.ragTestSummary.overallRAGScore * 100).toFixed(1)}%`);
        }
        console.log('='.repeat(60));
        // 終了コードの設定
        process.exit(overallSuccess ? 0 : 1);
    }
    catch (error) {
        console.error('\n❌ RAG統合テスト実行中にエラーが発生しました:');
        // エラーログの構造化
        const errorInfo = {
            timestamp: new Date().toISOString(),
            errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        };
        console.error(`エラータイプ: ${errorInfo.errorType}`);
        console.error(`エラー詳細: ${errorInfo.message}`);
        // デバッグモードでのみスタックトレースを表示
        if (process.env.DEBUG === 'true' && errorInfo.stack) {
            console.error(`スタックトレース:\n${errorInfo.stack}`);
        }
        // エラーログをファイルに保存
        try {
            const errorLogPath = path.join('./rag-test-results', `error-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
            fs.mkdirSync(path.dirname(errorLogPath), { recursive: true });
            fs.writeFileSync(errorLogPath, JSON.stringify(errorInfo, null, 2), 'utf8');
            console.error(`📝 エラーログを保存: ${errorLogPath}`);
        }
        catch (logError) {
            console.error('⚠️  エラーログの保存に失敗:', logError);
        }
        process.exit(1);
    }
}
/**
 * 緊急停止ハンドラー（改善版）
 */
let isShuttingDown = false;
async function gracefulShutdown(signal, exitCode) {
    if (isShuttingDown) {
        console.log('🔄 既にシャットダウン処理中です...');
        return;
    }
    isShuttingDown = true;
    console.log(`\n🛑 ${signal}シグナルを受信しました`);
    console.log('🧹 安全にクリーンアップ中...');
    try {
        // クリーンアップ処理のタイムアウト（10秒）
        await Promise.race([
            // 実際のクリーンアップ処理をここに追加
            new Promise(resolve => setTimeout(resolve, 1000)), // 模擬クリーンアップ
            new Promise((_, reject) => setTimeout(() => reject(new Error('クリーンアップタイムアウト')), 10000))
        ]);
        console.log('✅ クリーンアップ完了');
    }
    catch (error) {
        console.error('❌ クリーンアップエラー:', error);
    }
    finally {
        process.exit(exitCode);
    }
}
process.on('SIGINT', () => gracefulShutdown('SIGINT', 130));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 143));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXJhZy1pbnRlZ3JhdGlvbi10ZXN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJ1bi1yYWctaW50ZWdyYXRpb24tdGVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7Ozs7Ozs7R0FRRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDJDQUE2QjtBQUM3Qix1Q0FBeUI7QUFDekIsbUVBQWdHO0FBQ2hHLDZHQUFrRjtBQUVsRjs7R0FFRztBQUNILFNBQVMsa0JBQWtCLENBQUMsVUFBa0I7SUFDNUMsWUFBWTtJQUNaLE1BQU0sU0FBUyxHQUFHLFVBQVU7U0FDekIsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxhQUFhO1NBQ2xDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsVUFBVTtTQUNwQyxJQUFJLEVBQUUsQ0FBQztJQUVWLGtCQUFrQjtJQUNsQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUMvQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxPQUFPLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQztBQUMzQyxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGlCQUFpQixDQUFDLEdBQVE7SUFDakMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFL0MsV0FBVztJQUNYLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2xCLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVO1lBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQy9ELElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFN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TyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNuRCxPQUFPLENBQUMsS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDNUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDakMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQztBQUVILFdBQVc7QUFDWCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7SUFDNUIsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDckIsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiB0cy1ub2RlXG5cbi8qKlxuICogUkFH57Wx5ZCI44OG44K544OI44K544Kk44O844OI5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiBcbiAqIOODmeOCr+ODiOODq+aknOe0ouOAgeaknOe0oue1seWQiOOAgeOCs+ODs+ODhuOCreOCueODiOe2reaMgeOAgeaoqemZkOODleOCo+ODq+OCv+ODquODs+OCsOOBruWMheaLrOODhuOCueODiFxuICog5a6f5pys55WqQVdT55Kw5aKD44Gn44GuUkFH5qmf6IO95ZOB6LOq5L+d6Ki8XG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgZGVmYXVsdFByb2R1Y3Rpb25Db25maWcsIHZhbGlkYXRlUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5pbXBvcnQgUkFHSW50ZWdyYXRpb25UZXN0UnVubmVyIGZyb20gJy4uL21vZHVsZXMvcmFnL3JhZy1pbnRlZ3JhdGlvbi10ZXN0LXJ1bm5lcic7XG5cbi8qKlxuICog5Ye65Yqb44OR44K544Gu44K144OL44K/44Kk44K844O844K344On44Oz77yI44OR44K544OI44Op44OQ44O844K144Or5pS75pKD6Ziy5q2i77yJXG4gKi9cbmZ1bmN0aW9uIHNhbml0aXplT3V0cHV0UGF0aChvdXRwdXRQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyDljbHpmbrjgarmloflrZfliJfjgpLpmaTljrtcbiAgY29uc3Qgc2FuaXRpemVkID0gb3V0cHV0UGF0aFxuICAgIC5yZXBsYWNlKC9cXC5cXC4vZywgJycpIC8vIOODkeOCueODiOODqeODkOODvOOCteODq+mYsuatolxuICAgIC5yZXBsYWNlKC9bPD46XCJ8PypdL2csICcnKSAvLyDnhKHlirnjgarmloflrZfpmaTljrtcbiAgICAudHJpbSgpO1xuICBcbiAgLy8g57W25a++44OR44K544Gu5aC05ZCI44Gv55u45a++44OR44K544Gr5aSJ5o+bXG4gIGlmIChwYXRoLmlzQWJzb2x1dGUoc2FuaXRpemVkKSkge1xuICAgIHJldHVybiBwYXRoLmpvaW4oJy4vdGVzdC1yZXN1bHRzJywgcGF0aC5iYXNlbmFtZShzYW5pdGl6ZWQpKTtcbiAgfVxuICBcbiAgcmV0dXJuIHNhbml0aXplZCB8fCAnLi9yYWctdGVzdC1yZXN1bHRzJztcbn1cblxuLyoqXG4gKiDmqZ/lr4bmg4XloLHjga7jg57jgrnjgq3jg7PjgrBcbiAqL1xuZnVuY3Rpb24gbWFza1NlbnNpdGl2ZUluZm8ob2JqOiBhbnkpOiBhbnkge1xuICBjb25zdCBtYXNrZWQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpO1xuICBcbiAgLy8g5qmf5a+G5oOF5aCx44KS44Oe44K544KvXG4gIGlmIChtYXNrZWQuY29uZmlnKSB7XG4gICAgaWYgKG1hc2tlZC5jb25maWcuYXdzUHJvZmlsZSkgbWFza2VkLmNvbmZpZy5hd3NQcm9maWxlID0gJyoqKic7XG4gICAgaWYgKG1hc2tlZC5jb25maWcucmVnaW9uKSBtYXNrZWQuY29uZmlnLnJlZ2lvbiA9IG1hc2tlZC5jb25maWcucmVnaW9uLnN1YnN0cmluZygwLCAzKSArICcqKionO1xuICB9XG4gIFxuICByZXR1cm4gbWFza2VkO1xufVxuXG4vKipcbiAqIFJBR+e1seWQiOODhuOCueODiOWun+ihjOioreWumlxuICovXG5pbnRlcmZhY2UgUkFHVGVzdEV4ZWN1dGlvbkNvbmZpZyB7XG4gIGluY2x1ZGVWZWN0b3JTZWFyY2g6IGJvb2xlYW47XG4gIGluY2x1ZGVTZWFyY2hJbnRlZ3JhdGlvbjogYm9vbGVhbjtcbiAgaW5jbHVkZUNvbnRleHRQZXJzaXN0ZW5jZTogYm9vbGVhbjtcbiAgaW5jbHVkZVBlcm1pc3Npb25GaWx0ZXJpbmc6IGJvb2xlYW47XG4gIGdlbmVyYXRlUmVwb3J0OiBib29sZWFuO1xuICBvdXRwdXREaXJlY3Rvcnk6IHN0cmluZztcbiAgdmVyYm9zZTogYm9vbGVhbjtcbiAgbWF4UmV0cmllcz86IG51bWJlcjtcbiAgdGltZW91dE1zPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIOODhuOCueODiOWun+ihjOe1kOaenOOCteODnuODquODvFxuICovXG5pbnRlcmZhY2UgVGVzdEV4ZWN1dGlvblN1bW1hcnkge1xuICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gIHN1Y2Nlc3M6IGJvb2xlYW47XG4gIHRlc3RDb3VudHM6IHtcbiAgICB0b3RhbDogbnVtYmVyO1xuICAgIHBhc3NlZDogbnVtYmVyO1xuICAgIGZhaWxlZDogbnVtYmVyO1xuICB9O1xufVxuXG4vKipcbiAqIOODoeOCpOODs+Wun+ihjOmWouaVsFxuICovXG5hc3luYyBmdW5jdGlvbiBtYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZygn8J+UjSBSQUfntbHlkIjjg4bjgrnjg4jjgrnjgqTjg7zjg4jlrp/ooYzplovlp4snKTtcbiAgY29uc29sZS5sb2coJz0nIC5yZXBlYXQoNjApKTtcblxuICB0cnkge1xuICAgIC8vIDEuIOioreWumuOBruaknOiovFxuICAgIGNvbnNvbGUubG9nKCfwn5OLIOacrOeVqueSsOWig+ioreWumuOCkuaknOiovOS4rS4uLicpO1xuICAgIGNvbnN0IGNvbmZpZ1ZhbGlkYXRpb24gPSB2YWxpZGF0ZVByb2R1Y3Rpb25Db25maWcoZGVmYXVsdFByb2R1Y3Rpb25Db25maWcpO1xuICAgIFxuICAgIGlmICghY29uZmlnVmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg6Kit5a6a5qSc6Ki85aSx5pWXOicpO1xuICAgICAgY29uZmlnVmFsaWRhdGlvbi5lcnJvcnMuZm9yRWFjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGAgICAtICR7ZXJyb3J9YCkpO1xuICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cblxuICAgIGlmIChjb25maWdWYWxpZGF0aW9uLndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8gIOioreWumuitpuWRijonKTtcbiAgICAgIGNvbmZpZ1ZhbGlkYXRpb24ud2FybmluZ3MuZm9yRWFjaCh3YXJuaW5nID0+IGNvbnNvbGUubG9nKGAgICAtICR7d2FybmluZ31gKSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ+KchSDmnKznlarnkrDlooPoqK3lrprmpJzoqLzlrozkuoYnKTtcblxuICAgIC8vIDIuIOWun+ihjOioreWumuOBruiqreOBv+i+vOOBv++8iOOCu+OCreODpeODquODhuOCo+W8t+WMlu+8iVxuICAgIGNvbnN0IGV4ZWN1dGlvbkNvbmZpZzogUkFHVGVzdEV4ZWN1dGlvbkNvbmZpZyA9IHtcbiAgICAgIGluY2x1ZGVWZWN0b3JTZWFyY2g6IHByb2Nlc3MuZW52LklOQ0xVREVfVkVDVE9SX1NFQVJDSCAhPT0gJ2ZhbHNlJyxcbiAgICAgIGluY2x1ZGVTZWFyY2hJbnRlZ3JhdGlvbjogcHJvY2Vzcy5lbnYuSU5DTFVERV9TRUFSQ0hfSU5URUdSQVRJT04gIT09ICdmYWxzZScsXG4gICAgICBpbmNsdWRlQ29udGV4dFBlcnNpc3RlbmNlOiBwcm9jZXNzLmVudi5JTkNMVURFX0NPTlRFWFRfUEVSU0lTVEVOQ0UgIT09ICdmYWxzZScsXG4gICAgICBpbmNsdWRlUGVybWlzc2lvbkZpbHRlcmluZzogcHJvY2Vzcy5lbnYuSU5DTFVERV9QRVJNSVNTSU9OX0ZJTFRFUklORyAhPT0gJ2ZhbHNlJyxcbiAgICAgIGdlbmVyYXRlUmVwb3J0OiBwcm9jZXNzLmVudi5HRU5FUkFURV9SRVBPUlQgIT09ICdmYWxzZScsXG4gICAgICBvdXRwdXREaXJlY3Rvcnk6IHNhbml0aXplT3V0cHV0UGF0aChwcm9jZXNzLmVudi5PVVRQVVRfRElSIHx8ICcuL3JhZy10ZXN0LXJlc3VsdHMnKSxcbiAgICAgIHZlcmJvc2U6IHByb2Nlc3MuZW52LlZFUkJPU0UgPT09ICd0cnVlJyxcbiAgICAgIG1heFJldHJpZXM6IE1hdGgubWF4KDEsIE1hdGgubWluKDUsIHBhcnNlSW50KHByb2Nlc3MuZW52Lk1BWF9SRVRSSUVTIHx8ICczJywgMTApKSksXG4gICAgICB0aW1lb3V0TXM6IE1hdGgubWF4KDMwMDAwLCBNYXRoLm1pbigzMDAwMDAsIHBhcnNlSW50KHByb2Nlc3MuZW52LlRJTUVPVVRfTVMgfHwgJzEyMDAwMCcsIDEwKSkpXG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKCfwn5OLIFJBR+e1seWQiOODhuOCueODiOWun+ihjOioreWumjonKTtcbiAgICBjb25zb2xlLmxvZyhgICAg44OZ44Kv44OI44Or5qSc57Si44OG44K544OIOiAke2V4ZWN1dGlvbkNvbmZpZy5pbmNsdWRlVmVjdG9yU2VhcmNoID8gJ+acieWKuScgOiAn54Sh5Yq5J31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg5qSc57Si57Wx5ZCI44OG44K544OIOiAke2V4ZWN1dGlvbkNvbmZpZy5pbmNsdWRlU2VhcmNoSW50ZWdyYXRpb24gPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjg4bjgrnjg4g6ICR7ZXhlY3V0aW9uQ29uZmlnLmluY2x1ZGVDb250ZXh0UGVyc2lzdGVuY2UgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDmqKnpmZDjg5XjgqPjg6vjgr/jg6rjg7PjgrDjg4bjgrnjg4g6ICR7ZXhlY3V0aW9uQ29uZmlnLmluY2x1ZGVQZXJtaXNzaW9uRmlsdGVyaW5nID8gJ+acieWKuScgOiAn54Sh5Yq5J31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg44Os44Od44O844OI55Sf5oiQOiAke2V4ZWN1dGlvbkNvbmZpZy5nZW5lcmF0ZVJlcG9ydCA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODqjogJHtleGVjdXRpb25Db25maWcub3V0cHV0RGlyZWN0b3J5fWApO1xuXG4gICAgLy8gMy4g5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu5rqW5YKZXG4gICAgaWYgKGV4ZWN1dGlvbkNvbmZpZy5nZW5lcmF0ZVJlcG9ydCkge1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGV4ZWN1dGlvbkNvbmZpZy5vdXRwdXREaXJlY3RvcnkpKSB7XG4gICAgICAgIGZzLm1rZGlyU3luYyhleGVjdXRpb25Db25maWcub3V0cHV0RGlyZWN0b3J5LCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4Eg5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44KS5L2c5oiQOiAke2V4ZWN1dGlvbkNvbmZpZy5vdXRwdXREaXJlY3Rvcnl9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gNC4gUkFH57Wx5ZCI44OG44K544OI44Op44Oz44OK44O844Gu5Yid5pyf5YyWXG4gICAgY29uc29sZS5sb2coJ/CflKcgUkFH57Wx5ZCI44OG44K544OI44Op44Oz44OK44O844KS5Yid5pyf5YyW5LitLi4uJyk7XG4gICAgY29uc3QgcmFnVGVzdFJ1bm5lciA9IG5ldyBSQUdJbnRlZ3JhdGlvblRlc3RSdW5uZXIoZGVmYXVsdFByb2R1Y3Rpb25Db25maWcpO1xuXG4gICAgLy8gNS4gUkFH57Wx5ZCI44OG44K544OI44Gu5a6f6KGM77yI44K/44Kk44Og44Ki44Km44OI44O744Oq44OI44Op44Kk5qmf6IO95LuY44GN77yJXG4gICAgY29uc29sZS5sb2coJ/CflI0gUkFH57Wx5ZCI44OG44K544OI44KS5a6f6KGM5LitLi4uJyk7XG4gICAgY29uc29sZS5sb2coJy0nLnJlcGVhdCg2MCkpO1xuXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBsZXQgdGVzdFJlc3VsdHM7XG4gICAgbGV0IHJldHJ5Q291bnQgPSAwO1xuICAgIGNvbnN0IG1heFJldHJpZXMgPSBleGVjdXRpb25Db25maWcubWF4UmV0cmllcyB8fCAzO1xuXG4gICAgd2hpbGUgKHJldHJ5Q291bnQgPD0gbWF4UmV0cmllcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8g44K/44Kk44Og44Ki44Km44OI5LuY44GN44Gn44OG44K544OI5a6f6KGMXG4gICAgICAgIHRlc3RSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICByYWdUZXN0UnVubmVyLnJ1bkNvbXByZWhlbnNpdmVSQUdUZXN0cygpLFxuICAgICAgICAgIG5ldyBQcm9taXNlPG5ldmVyPigoXywgcmVqZWN0KSA9PiBcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcign44OG44K544OI5a6f6KGM44K/44Kk44Og44Ki44Km44OIJykpLCBleGVjdXRpb25Db25maWcudGltZW91dE1zIHx8IDEyMDAwMClcbiAgICAgICAgICApXG4gICAgICAgIF0pO1xuICAgICAgICBicmVhazsgLy8g5oiQ5Yqf5pmC44Gv44Or44O844OX44KS5oqc44GR44KLXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXRyeUNvdW50Kys7XG4gICAgICAgIGlmIChyZXRyeUNvdW50ID4gbWF4UmV0cmllcykge1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGDimqDvuI8gIOODhuOCueODiOWun+ihjOWkseaVlyAoJHtyZXRyeUNvdW50fS8ke21heFJldHJpZXN9KTogJHtlcnJvcn1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYPCflIQgJHtyZXRyeUNvdW50ICogNX3np5Llvozjgavjg6rjg4jjg6njgqTjgZfjgb7jgZkuLi5gKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHJldHJ5Q291bnQgKiA1MDAwKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZW5kVGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgdG90YWxEdXJhdGlvbiA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG5cbiAgICBjb25zb2xlLmxvZygnLScucmVwZWF0KDYwKSk7XG4gICAgY29uc29sZS5sb2coJ/Cfk4ogUkFH57Wx5ZCI44OG44K544OI5a6f6KGM5a6M5LqGJyk7XG5cbiAgICAvLyA2LiDntZDmnpzjga7ooajnpLpcbiAgICBjb25zb2xlLmxvZygn8J+TiCDlrp/ooYzntZDmnpzjgrXjg57jg6rjg7w6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIOe3j+Wun+ihjOaZgumWkzogJHt0b3RhbER1cmF0aW9ufW1zICgkeyh0b3RhbER1cmF0aW9uIC8gMTAwMCkudG9GaXhlZCgxKX3np5IpYCk7XG4gICAgY29uc29sZS5sb2coYCAgIOODhuOCueODiOaIkOWKnzogJHt0ZXN0UmVzdWx0cy5zdWNjZXNzID8gJ1lFUycgOiAnTk8nfWApO1xuICAgIFxuICAgIGlmICh0ZXN0UmVzdWx0cy5yYWdUZXN0U3VtbWFyeSkge1xuICAgICAgY29uc29sZS5sb2coYCAgIOODmeOCr+ODiOODq+aknOe0ojogJHsodGVzdFJlc3VsdHMucmFnVGVzdFN1bW1hcnkudmVjdG9yU2VhcmNoU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOaknOe0oue1seWQiDogJHsodGVzdFJlc3VsdHMucmFnVGVzdFN1bW1hcnkuc2VhcmNoSW50ZWdyYXRpb25TY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44Kz44Oz44OG44Kt44K544OI57at5oyBOiAkeyh0ZXN0UmVzdWx0cy5yYWdUZXN0U3VtbWFyeS5jb250ZXh0UGVyc2lzdGVuY2VTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg5qip6ZmQ44OV44Kj44Or44K/44Oq44Oz44KwOiAkeyh0ZXN0UmVzdWx0cy5yYWdUZXN0U3VtbWFyeS5wZXJtaXNzaW9uRmlsdGVyaW5nU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOe3j+WQiFJBR+OCueOCs+OCojogJHsodGVzdFJlc3VsdHMucmFnVGVzdFN1bW1hcnkub3ZlcmFsbFJBR1Njb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICB9XG5cbiAgICAvLyA3LiDoqbPntLDntZDmnpzjga7ooajnpLrvvIh2ZXJib3NlIOODouODvOODie+8iVxuICAgIGlmIChleGVjdXRpb25Db25maWcudmVyYm9zZSAmJiB0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7wn5OLIOips+e0sOODhuOCueODiOe1kOaenDonKTtcbiAgICAgIFxuICAgICAgLy8g44OZ44Kv44OI44Or5qSc57Si44OG44K544OI57WQ5p6cXG4gICAgICBpZiAodGVzdFJlc3VsdHMuZGV0YWlsZWRSZXN1bHRzLnZlY3RvclNlYXJjaFJlc3VsdHMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcbvCflI0g44OZ44Kv44OI44Or5qSc57Si44OG44K544OIOicpO1xuICAgICAgICB0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMudmVjdG9yU2VhcmNoUmVzdWx0cy5mb3JFYWNoKHJlc3VsdCA9PiB7XG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gcmVzdWx0LnN1Y2Nlc3MgPyAn4pyFJyA6ICfinYwnO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAke3N0YXR1c30gJHtyZXN1bHQudGVzdE5hbWV9IC0gJHtyZXN1bHQuZHVyYXRpb259bXNgKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIOaknOe0oue1seWQiOODhuOCueODiOe1kOaenFxuICAgICAgaWYgKHRlc3RSZXN1bHRzLmRldGFpbGVkUmVzdWx0cy5zZWFyY2hJbnRlZ3JhdGlvblJlc3VsdHMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcbvCflJcg5qSc57Si57Wx5ZCI44OG44K544OIOicpO1xuICAgICAgICB0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMuc2VhcmNoSW50ZWdyYXRpb25SZXN1bHRzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgICAgICBjb25zdCBzdGF0dXMgPSByZXN1bHQuc3VjY2VzcyA/ICfinIUnIDogJ+KdjCc7XG4gICAgICAgICAgY29uc29sZS5sb2coYCAgICR7c3RhdHVzfSAke3Jlc3VsdC50ZXN0TmFtZX0gLSAke3Jlc3VsdC5kdXJhdGlvbn1tc2ApO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8g44Kz44Oz44OG44Kt44K544OI57at5oyB44OG44K544OI57WQ5p6cXG4gICAgICBpZiAodGVzdFJlc3VsdHMuZGV0YWlsZWRSZXN1bHRzLmNvbnRleHRQZXJzaXN0ZW5jZVJlc3VsdHMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcbvCfkr4g44Kz44Oz44OG44Kt44K544OI57at5oyB44OG44K544OIOicpO1xuICAgICAgICB0ZXN0UmVzdWx0cy5kZXRhaWxlZFJlc3VsdHMuY29udGV4dFBlcnNpc3RlbmNlUmVzdWx0cy5mb3JFYWNoKHJlc3VsdCA9PiB7XG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gcmVzdWx0LnN1Y2Nlc3MgPyAn4pyFJyA6ICfinYwnO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAke3N0YXR1c30gJHtyZXN1bHQudGVzdE5hbWV9IC0gJHtyZXN1bHQuZHVyYXRpb259bXNgKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIOaoqemZkOODleOCo+ODq+OCv+ODquODs+OCsOODhuOCueODiOe1kOaenFxuICAgICAgaWYgKHRlc3RSZXN1bHRzLmRldGFpbGVkUmVzdWx0cy5wZXJtaXNzaW9uRmlsdGVyaW5nUmVzdWx0cykge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxu8J+UkCDmqKnpmZDjg5XjgqPjg6vjgr/jg6rjg7PjgrDjg4bjgrnjg4g6Jyk7XG4gICAgICAgIHRlc3RSZXN1bHRzLmRldGFpbGVkUmVzdWx0cy5wZXJtaXNzaW9uRmlsdGVyaW5nUmVzdWx0cy5mb3JFYWNoKHJlc3VsdCA9PiB7XG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gcmVzdWx0LnN1Y2Nlc3MgPyAn4pyFJyA6ICfinYwnO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAke3N0YXR1c30gJHtyZXN1bHQudGVzdE5hbWV9IC0gJHtyZXN1bHQuZHVyYXRpb259bXNgKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gOC4g44Os44Od44O844OI55Sf5oiQXG4gICAgaWYgKGV4ZWN1dGlvbkNvbmZpZy5nZW5lcmF0ZVJlcG9ydCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcbvCfk4Qg6Kmz57Sw44Os44Od44O844OI44KS55Sf5oiQ5LitLi4uJyk7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlcG9ydCA9IGF3YWl0IHJhZ1Rlc3RSdW5uZXIuZ2VuZXJhdGVEZXRhaWxlZFJBR1JlcG9ydCh0ZXN0UmVzdWx0cyk7XG4gICAgICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5qb2luKGV4ZWN1dGlvbkNvbmZpZy5vdXRwdXREaXJlY3RvcnksIGByYWctaW50ZWdyYXRpb24tdGVzdC1yZXBvcnQtJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpfS5tZGApO1xuICAgICAgXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHJlcG9ydFBhdGgsIHJlcG9ydCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnNvbGUubG9nKGDinIUg6Kmz57Sw44Os44Od44O844OI44KS55Sf5oiQOiAke3JlcG9ydFBhdGh9YCk7XG5cbiAgICAgIC8vIEpTT07lvaLlvI/jga7ntZDmnpzjgoLkv53lrZjvvIjmqZ/lr4bmg4XloLHjg57jgrnjgq3jg7PjgrDku5jjgY3vvIlcbiAgICAgIGNvbnN0IGpzb25SZXN1bHRzID0ge1xuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgZXhlY3V0aW9uSW5mbzoge1xuICAgICAgICAgIGR1cmF0aW9uOiB0b3RhbER1cmF0aW9uLFxuICAgICAgICAgIHJldHJ5Q291bnQ6IHJldHJ5Q291bnQgfHwgMCxcbiAgICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnXG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZzogbWFza1NlbnNpdGl2ZUluZm8oe1xuICAgICAgICAgIHJlZ2lvbjogZGVmYXVsdFByb2R1Y3Rpb25Db25maWcucmVnaW9uLFxuICAgICAgICAgIGVudmlyb25tZW50OiBkZWZhdWx0UHJvZHVjdGlvbkNvbmZpZy5lbnZpcm9ubWVudCxcbiAgICAgICAgICBzYWZldHlNb2RlOiBkZWZhdWx0UHJvZHVjdGlvbkNvbmZpZy5zYWZldHlNb2RlLFxuICAgICAgICAgIHJlYWRPbmx5TW9kZTogZGVmYXVsdFByb2R1Y3Rpb25Db25maWcucmVhZE9ubHlNb2RlXG4gICAgICAgIH0pLFxuICAgICAgICBzdW1tYXJ5OiB0ZXN0UmVzdWx0cy5yYWdUZXN0U3VtbWFyeSxcbiAgICAgICAgcmVzdWx0czogdGVzdFJlc3VsdHMuZGV0YWlsZWRSZXN1bHRzXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBqc29uUGF0aCA9IHBhdGguam9pbihleGVjdXRpb25Db25maWcub3V0cHV0RGlyZWN0b3J5LCBgcmFnLWludGVncmF0aW9uLXRlc3QtcmVzdWx0cy0ke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyl9Lmpzb25gKTtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoanNvblBhdGgsIEpTT04uc3RyaW5naWZ5KGpzb25SZXN1bHRzLCBudWxsLCAyKSwgJ3V0ZjgnKTtcbiAgICAgIGNvbnNvbGUubG9nKGDinIUgSlNPTue1kOaenOOCkuS/neWtmDogJHtqc29uUGF0aH1gKTtcbiAgICB9XG5cbiAgICAvLyA5LiDjgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICBjb25zb2xlLmxvZygnXFxu8J+nuSDjg6rjgr3jg7zjgrnjgpLjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK0uLi4nKTtcbiAgICBhd2FpdCByYWdUZXN0UnVubmVyLmNsZWFudXAoKTtcblxuICAgIC8vIDEwLiDntYLkuoblh6bnkIZcbiAgICBjb25zdCBvdmVyYWxsU3VjY2VzcyA9IHRlc3RSZXN1bHRzLnN1Y2Nlc3M7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcbicgKyAnPScucmVwZWF0KDYwKSk7XG4gICAgaWYgKG92ZXJhbGxTdWNjZXNzKSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+OiSBSQUfntbHlkIjjg4bjgrnjg4jjgrnjgqTjg7zjg4jlrp/ooYzmiJDlip8nKTtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg5YWo44Gm44GuUkFH5qmf6IO944GM5q2j5bi444Gr5YuV5L2c44GX44Gm44GE44G+44GZJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8gIFJBR+e1seWQiOODhuOCueODiOOCueOCpOODvOODiOWun+ihjOWujOS6hu+8iOS4gOmDqOWkseaVl++8iScpO1xuICAgICAgY29uc29sZS5sb2coJ+KdjCDkuIDpg6jjga5SQUfmqZ/og73jgavllY/poYzjgYzjgYLjgorjgb7jgZknKTtcbiAgICB9XG5cbiAgICBpZiAodGVzdFJlc3VsdHMucmFnVGVzdFN1bW1hcnkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OKIOacgOe1glJBR+OCueOCs+OCojogJHsodGVzdFJlc3VsdHMucmFnVGVzdFN1bW1hcnkub3ZlcmFsbFJBR1Njb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJz0nLnJlcGVhdCg2MCkpO1xuXG4gICAgLy8g57WC5LqG44Kz44O844OJ44Gu6Kit5a6aXG4gICAgcHJvY2Vzcy5leGl0KG92ZXJhbGxTdWNjZXNzID8gMCA6IDEpO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignXFxu4p2MIFJBR+e1seWQiOODhuOCueODiOWun+ihjOS4reOBq+OCqOODqeODvOOBjOeZuueUn+OBl+OBvuOBl+OBnzonKTtcbiAgICBcbiAgICAvLyDjgqjjg6njg7zjg63jgrDjga7mp4vpgKDljJZcbiAgICBjb25zdCBlcnJvckluZm8gPSB7XG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIGVycm9yVHlwZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLmNvbnN0cnVjdG9yLm5hbWUgOiAnVW5rbm93bkVycm9yJyxcbiAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgIHN0YWNrOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWRcbiAgICB9O1xuICAgIFxuICAgIGNvbnNvbGUuZXJyb3IoYOOCqOODqeODvOOCv+OCpOODlzogJHtlcnJvckluZm8uZXJyb3JUeXBlfWApO1xuICAgIGNvbnNvbGUuZXJyb3IoYOOCqOODqeODvOips+e0sDogJHtlcnJvckluZm8ubWVzc2FnZX1gKTtcbiAgICBcbiAgICAvLyDjg4fjg5Djg4PjgrDjg6Ljg7zjg4njgafjga7jgb/jgrnjgr/jg4Pjgq/jg4jjg6zjg7zjgrnjgpLooajnpLpcbiAgICBpZiAocHJvY2Vzcy5lbnYuREVCVUcgPT09ICd0cnVlJyAmJiBlcnJvckluZm8uc3RhY2spIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOOCueOCv+ODg+OCr+ODiOODrOODvOOCuTpcXG4ke2Vycm9ySW5mby5zdGFja31gKTtcbiAgICB9XG5cbiAgICAvLyDjgqjjg6njg7zjg63jgrDjgpLjg5XjgqHjgqTjg6vjgavkv53lrZhcbiAgICB0cnkge1xuICAgICAgY29uc3QgZXJyb3JMb2dQYXRoID0gcGF0aC5qb2luKCcuL3JhZy10ZXN0LXJlc3VsdHMnLCBgZXJyb3ItbG9nLSR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKX0uanNvbmApO1xuICAgICAgZnMubWtkaXJTeW5jKHBhdGguZGlybmFtZShlcnJvckxvZ1BhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoZXJyb3JMb2dQYXRoLCBKU09OLnN0cmluZ2lmeShlcnJvckluZm8sIG51bGwsIDIpLCAndXRmOCcpO1xuICAgICAgY29uc29sZS5lcnJvcihg8J+TnSDjgqjjg6njg7zjg63jgrDjgpLkv53lrZg6ICR7ZXJyb3JMb2dQYXRofWApO1xuICAgIH0gY2F0Y2ggKGxvZ0Vycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfimqDvuI8gIOOCqOODqeODvOODreOCsOOBruS/neWtmOOBq+WkseaVlzonLCBsb2dFcnJvcik7XG4gICAgfVxuXG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbi8qKlxuICog57eK5oCl5YGc5q2i44OP44Oz44OJ44Op44O877yI5pS55ZaE54mI77yJXG4gKi9cbmxldCBpc1NodXR0aW5nRG93biA9IGZhbHNlO1xuXG5hc3luYyBmdW5jdGlvbiBncmFjZWZ1bFNodXRkb3duKHNpZ25hbDogc3RyaW5nLCBleGl0Q29kZTogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChpc1NodXR0aW5nRG93bikge1xuICAgIGNvbnNvbGUubG9nKCfwn5SEIOaXouOBq+OCt+ODo+ODg+ODiOODgOOCpuODs+WHpueQhuS4reOBp+OBmS4uLicpO1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgaXNTaHV0dGluZ0Rvd24gPSB0cnVlO1xuICBjb25zb2xlLmxvZyhgXFxu8J+bkSAke3NpZ25hbH3jgrfjgrDjg4rjg6vjgpLlj5fkv6HjgZfjgb7jgZfjgZ9gKTtcbiAgY29uc29sZS5sb2coJ/Cfp7kg5a6J5YWo44Gr44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gIFxuICB0cnkge1xuICAgIC8vIOOCr+ODquODvOODs+OCouODg+ODl+WHpueQhuOBruOCv+OCpOODoOOCouOCpuODiO+8iDEw56eS77yJXG4gICAgYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgIC8vIOWun+mam+OBruOCr+ODquODvOODs+OCouODg+ODl+WHpueQhuOCkuOBk+OBk+OBq+i/veWKoFxuICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMDApKSwgLy8g5qih5pOs44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAgICBuZXcgUHJvbWlzZSgoXywgcmVqZWN0KSA9PiBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoJ+OCr+ODquODvOODs+OCouODg+ODl+OCv+OCpOODoOOCouOCpuODiCcpKSwgMTAwMDApKVxuICAgIF0pO1xuICAgIGNvbnNvbGUubG9nKCfinIUg44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIOOCr+ODquODvOODs+OCouODg+ODl+OCqOODqeODvDonLCBlcnJvcik7XG4gIH0gZmluYWxseSB7XG4gICAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcbiAgfVxufVxuXG5wcm9jZXNzLm9uKCdTSUdJTlQnLCAoKSA9PiBncmFjZWZ1bFNodXRkb3duKCdTSUdJTlQnLCAxMzApKTtcbnByb2Nlc3Mub24oJ1NJR1RFUk0nLCAoKSA9PiBncmFjZWZ1bFNodXRkb3duKCdTSUdURVJNJywgMTQzKSk7XG5cbi8vIOacquWHpueQhuOBruS+i+WkluOCkuOCreODo+ODg+ODgVxucHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCAoZXJyb3IpID0+IHtcbiAgY29uc29sZS5lcnJvcignXFxu8J+SpSDmnKrlh6bnkIbjga7kvovlpJbjgYznmbrnlJ/jgZfjgb7jgZfjgZ86Jyk7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59KTtcblxucHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKHJlYXNvbiwgcHJvbWlzZSkgPT4ge1xuICBjb25zb2xlLmVycm9yKCdcXG7wn5KlIOacquWHpueQhuOBrlByb21pc2Xmi5LlkKbjgYznmbrnlJ/jgZfjgb7jgZfjgZ86Jyk7XG4gIGNvbnNvbGUuZXJyb3IoJ1Byb21pc2U6JywgcHJvbWlzZSk7XG4gIGNvbnNvbGUuZXJyb3IoJ1JlYXNvbjonLCByZWFzb24pO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59KTtcblxuLy8g44Oh44Kk44Oz6Zai5pWw44Gu5a6f6KGMXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbigpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg6HjgqTjg7PplqLmlbDlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47Il19