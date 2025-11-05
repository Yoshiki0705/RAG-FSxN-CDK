#!/usr/bin/env node
"use strict";
/**
 * 包括的セキュリティテスト実行スクリプト
 * エンドツーエンド暗号化テストと認証・認可テストを含む
 * 本番環境での包括的なセキュリティ検証を実行
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runComprehensiveSecurityTests = runComprehensiveSecurityTests;
const security_test_runner_1 = require("./security-test-runner");
const production_test_engine_1 = __importDefault(require("../../core/production-test-engine"));
/**
 * セキュリティテスト設定を作成
 */
async function createSecurityTestConfig(environment) {
    return {
        environment,
        region: process.env.AWS_REGION || 'us-east-1',
        projectName: process.env.PROJECT_NAME || 'rag-system',
        accountId: process.env.AWS_ACCOUNT_ID || '',
        domainName: process.env.DOMAIN_NAME || 'rag-system.example.com',
        certificateArn: process.env.CERTIFICATE_ARN || '',
        hostedZoneId: process.env.HOSTED_ZONE_ID || '',
        enableWaf: true,
        enableCloudTrail: true,
        enableGuardDuty: true,
        enableSecurityHub: true,
        testConfiguration: {
            maxTestDuration: parseInt(process.env.MAX_TEST_DURATION || '1800000'), // 30分
            maxConcurrentTests: parseInt(process.env.MAX_CONCURRENT_TESTS || '5'),
            retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
            timeoutMs: parseInt(process.env.TIMEOUT_MS || '300000'), // 5分
            enableDetailedLogging: process.env.ENABLE_DETAILED_LOGGING !== 'false',
            enableMetrics: process.env.ENABLE_METRICS !== 'false',
            enableAlerts: process.env.ENABLE_ALERTS !== 'false',
            costThreshold: parseFloat(process.env.COST_THRESHOLD || '50.0'),
            resourceThreshold: parseFloat(process.env.RESOURCE_THRESHOLD || '0.8')
        }
    };
}
/**
 * 必須環境変数の検証
 */
function validateRequiredEnvironmentVariables(config) {
    const requiredFields = [
        { field: 'accountId', value: config.accountId, name: 'AWS_ACCOUNT_ID' },
        { field: 'domainName', value: config.domainName, name: 'DOMAIN_NAME' },
        { field: 'certificateArn', value: config.certificateArn, name: 'CERTIFICATE_ARN' },
        { field: 'hostedZoneId', value: config.hostedZoneId, name: 'HOSTED_ZONE_ID' }
    ];
    const missingFields = requiredFields.filter(field => !field.value || field.value === '');
    if (missingFields.length > 0) {
        const missingNames = missingFields.map(field => field.name).join(', ');
        throw new Error(`必須環境変数が設定されていません: ${missingNames}`);
    }
}
/**
 * テスト結果の評価
 */
function evaluateTestResults(testResults) {
    const score = testResults.summary.overallSecurityScore;
    if (score >= 0.9) {
        return { message: '🏆 優秀: セキュリティレベルが非常に高いです', exitCode: 0 };
    }
    else if (score >= 0.8) {
        return { message: '✅ 良好: セキュリティレベルは良好です', exitCode: 0 };
    }
    else if (score >= 0.6) {
        return { message: '⚠️ 注意: セキュリティ改善が推奨されます', exitCode: 1 };
    }
    else {
        return { message: '❌ 危険: 緊急のセキュリティ対策が必要です', exitCode: 1 };
    }
}
/**
 * 結果ファイルのパス生成
 */
function generateResultFilePath() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `./development/logs/security/security-test-results-${timestamp}.json`;
}
/**
 * テストサマリーの表示
 */
function displayTestSummary(testResults) {
    console.log('🎯 最終評価:');
    console.log(`   総合セキュリティスコア: ${(testResults.summary.overallSecurityScore * 100).toFixed(1)}%`);
    console.log(`   重要な問題: ${testResults.summary.criticalIssues}件`);
    console.log(`   推奨事項: ${testResults.summary.recommendations.length}件`);
    console.log('');
}
/**
 * 推奨事項の表示
 */
function displayRecommendations(recommendations) {
    if (recommendations.length > 0) {
        console.log('💡 セキュリティ改善推奨事項:');
        recommendations.forEach((recommendation, index) => {
            console.log(`   ${index + 1}. ${recommendation}`);
        });
        console.log('');
    }
}
/**
 * エラーの表示
 */
function displayErrors(errors) {
    if (errors && errors.length > 0) {
        console.log('❌ 発生したエラー:');
        errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
        });
        console.log('');
    }
}
/**
 * テストエラーのハンドリング
 */
function handleTestError(error) {
    console.error('');
    console.error('❌ 包括的セキュリティテスト実行エラー:');
    if (error instanceof Error) {
        console.error(`エラーメッセージ: ${error.message}`);
        // 環境変数関連のエラーの場合
        if (error.message.includes('必須環境変数')) {
            console.error('');
            console.error('💡 解決方法:');
            console.error('   1. .env ファイルに必要な環境変数を設定してください');
            console.error('   2. AWS認証情報が正しく設定されているか確認してください');
            console.error('   3. 必要な権限がIAMロールに付与されているか確認してください');
        }
        // デバッグ情報（開発環境のみ）
        if (process.env.NODE_ENV === 'development' && error.stack) {
            console.error('');
            console.error('デバッグ情報:');
            console.error(error.stack);
        }
    }
    else {
        console.error('予期しないエラーが発生しました:', error);
    }
    console.error('');
}
/**
 * リソースのクリーンアップ
 */
async function performCleanup(testRunner, testEngine) {
    console.log('🧹 リソースをクリーンアップ中...');
    const cleanupPromises = [];
    if (testRunner) {
        cleanupPromises.push(testRunner.cleanup().catch(error => {
            console.warn('⚠️ セキュリティテストランナーのクリーンアップでエラー:', error);
        }));
    }
    if (testEngine) {
        cleanupPromises.push(testEngine.cleanup().catch(error => {
            console.warn('⚠️ テストエンジンのクリーンアップでエラー:', error);
        }));
    }
    try {
        await Promise.allSettled(cleanupPromises);
        console.log('✅ クリーンアップ完了');
    }
    catch (error) {
        console.warn('⚠️ クリーンアップ処理で予期しないエラー:', error);
    }
}
async function runComprehensiveSecurityTests() {
    console.log('🚀 包括的セキュリティテスト実行開始');
    console.log('=====================================');
    console.log('');
    let testRunner;
    let testEngine;
    try {
        // 環境設定の読み込み
        const environment = process.env.NODE_ENV || 'production';
        console.log(`📋 環境: ${environment}`);
        // 設定の検証と初期化
        const config = await createSecurityTestConfig(environment);
        validateRequiredEnvironmentVariables(config);
        // テストエンジンの初期化
        console.log('🔧 テストエンジンを初期化中...');
        testEngine = new production_test_engine_1.default(config);
        await testEngine.initialize();
        // セキュリティテストランナーの初期化
        console.log('🔒 セキュリティテストランナーを初期化中...');
        testRunner = new security_test_runner_1.SecurityTestRunner(config, testEngine);
        await testRunner.initialize();
        // セキュリティ設定の表示
        testRunner.displaySecurityConfig();
        // 包括的セキュリティテストの実行
        console.log('🔐 包括的セキュリティテスト実行中...');
        console.log('');
        const startTime = Date.now();
        const testResults = await testRunner.runSecurityTests();
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        console.log('');
        console.log('📊 包括的セキュリティテスト完了');
        console.log('=====================================');
        console.log(`⏱️ 総実行時間: ${(totalDuration / 1000).toFixed(1)}秒`);
        console.log(`✅ 総合成功: ${testResults.success ? 'PASS' : 'FAIL'}`);
        console.log('');
        // 詳細結果の表示
        if (testRunner.displaySecuritySummary) {
            testRunner.displaySecuritySummary(testResults.results);
        }
        // 結果のエクスポート
        const outputPath = generateResultFilePath();
        if (testRunner.exportSecurityResults) {
            await testRunner.exportSecurityResults(testResults.results, outputPath);
        }
        // 最終結果の評価と表示
        displayTestSummary(testResults);
        displayRecommendations(testResults.summary.recommendations);
        displayErrors(testResults.errors);
        console.log('');
        console.log('📄 詳細結果は以下のファイルに保存されました:');
        console.log(`   ${outputPath}`);
        console.log('');
        // 終了コードの決定
        const evaluation = evaluateTestResults(testResults);
        console.log(evaluation.message);
        if (evaluation.exitCode === 0) {
            console.log('🎉 包括的セキュリティテストが正常に完了しました');
        }
        else {
            console.log('⚠️ セキュリティテストで問題が検出されました');
        }
        process.exit(evaluation.exitCode);
    }
    catch (error) {
        handleTestError(error);
        process.exit(1);
    }
    finally {
        await performCleanup(testRunner, testEngine);
    }
}
// スクリプトの実行
if (require.main === module) {
    runComprehensiveSecurityTests().catch(error => {
        console.error('予期しないエラー:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLWNvbXByZWhlbnNpdmUtc2VjdXJpdHktdGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJydW4tY29tcHJlaGVuc2l2ZS1zZWN1cml0eS10ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0dBSUc7Ozs7O0FBdVRNLHNFQUE2QjtBQXJUdEMsaUVBQTREO0FBRTVELCtGQUFxRTtBQWlDckU7O0dBRUc7QUFDSCxLQUFLLFVBQVUsd0JBQXdCLENBQUMsV0FBbUI7SUFDekQsT0FBTztRQUNMLFdBQVc7UUFDWCxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksV0FBVztRQUM3QyxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksWUFBWTtRQUNyRCxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksRUFBRTtRQUMzQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksd0JBQXdCO1FBQy9ELGNBQWMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxFQUFFO1FBQ2pELFlBQVksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxFQUFFO1FBQzlDLFNBQVMsRUFBRSxJQUFJO1FBQ2YsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixlQUFlLEVBQUUsSUFBSTtRQUNyQixpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLGlCQUFpQixFQUFFO1lBQ2pCLGVBQWUsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsSUFBSSxTQUFTLENBQUMsRUFBRSxNQUFNO1lBQzdFLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLEdBQUcsQ0FBQztZQUNyRSxhQUFhLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLEdBQUcsQ0FBQztZ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LENBQUMsQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICog5YyF5ous55qE44K744Kt44Ol44Oq44OG44Kj44OG44K544OI5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiDjgqjjg7Pjg4njg4Tjg7zjgqjjg7Pjg4nmmpflj7fljJbjg4bjgrnjg4jjgajoqo3oqLzjg7voqo3lj6/jg4bjgrnjg4jjgpLlkKvjgoBcbiAqIOacrOeVqueSsOWig+OBp+OBruWMheaLrOeahOOBquOCu+OCreODpeODquODhuOCo+aknOiovOOCkuWun+ihjFxuICovXG5cbmltcG9ydCB7IFNlY3VyaXR5VGVzdFJ1bm5lciB9IGZyb20gJy4vc2VjdXJpdHktdGVzdC1ydW5uZXInO1xuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5pbXBvcnQgUHJvZHVjdGlvblRlc3RFbmdpbmUgZnJvbSAnLi4vLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcblxuLyoqXG4gKiDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4joqK3lrprjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbiAqL1xuaW50ZXJmYWNlIFNlY3VyaXR5VGVzdENvbmZpZyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBwcm9qZWN0TmFtZTogc3RyaW5nO1xuICBhY2NvdW50SWQ6IHN0cmluZztcbiAgZG9tYWluTmFtZTogc3RyaW5nO1xuICBjZXJ0aWZpY2F0ZUFybjogc3RyaW5nO1xuICBob3N0ZWRab25lSWQ6IHN0cmluZztcbiAgbWF4VGVzdER1cmF0aW9uOiBudW1iZXI7XG4gIG1heENvbmN1cnJlbnRUZXN0czogbnVtYmVyO1xuICByZXRyeUF0dGVtcHRzOiBudW1iZXI7XG4gIHRpbWVvdXRNczogbnVtYmVyO1xuICBjb3N0VGhyZXNob2xkOiBudW1iZXI7XG4gIHJlc291cmNlVGhyZXNob2xkOiBudW1iZXI7XG59XG5cbi8qKlxuICog44OG44K544OI57WQ5p6c44K144Oe44Oq44O844Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmludGVyZmFjZSBUZXN0UmVzdWx0U3VtbWFyeSB7XG4gIHN1Y2Nlc3M6IGJvb2xlYW47XG4gIG92ZXJhbGxTZWN1cml0eVNjb3JlOiBudW1iZXI7XG4gIGNyaXRpY2FsSXNzdWVzOiBudW1iZXI7XG4gIHJlY29tbWVuZGF0aW9uczogc3RyaW5nW107XG4gIGVycm9ycz86IHN0cmluZ1tdO1xuICBkdXJhdGlvbjogbnVtYmVyO1xufVxuXG4vKipcbiAqIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOioreWumuOCkuS9nOaIkFxuICovXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVTZWN1cml0eVRlc3RDb25maWcoZW52aXJvbm1lbnQ6IHN0cmluZyk6IFByb21pc2U8UHJvZHVjdGlvbkNvbmZpZz4ge1xuICByZXR1cm4ge1xuICAgIGVudmlyb25tZW50LFxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTiB8fCAndXMtZWFzdC0xJyxcbiAgICBwcm9qZWN0TmFtZTogcHJvY2Vzcy5lbnYuUFJPSkVDVF9OQU1FIHx8ICdyYWctc3lzdGVtJyxcbiAgICBhY2NvdW50SWQ6IHByb2Nlc3MuZW52LkFXU19BQ0NPVU5UX0lEIHx8ICcnLFxuICAgIGRvbWFpbk5hbWU6IHByb2Nlc3MuZW52LkRPTUFJTl9OQU1FIHx8ICdyYWctc3lzdGVtLmV4YW1wbGUuY29tJyxcbiAgICBjZXJ0aWZpY2F0ZUFybjogcHJvY2Vzcy5lbnYuQ0VSVElGSUNBVEVfQVJOIHx8ICcnLFxuICAgIGhvc3RlZFpvbmVJZDogcHJvY2Vzcy5lbnYuSE9TVEVEX1pPTkVfSUQgfHwgJycsXG4gICAgZW5hYmxlV2FmOiB0cnVlLFxuICAgIGVuYWJsZUNsb3VkVHJhaWw6IHRydWUsXG4gICAgZW5hYmxlR3VhcmREdXR5OiB0cnVlLFxuICAgIGVuYWJsZVNlY3VyaXR5SHViOiB0cnVlLFxuICAgIHRlc3RDb25maWd1cmF0aW9uOiB7XG4gICAgICBtYXhUZXN0RHVyYXRpb246IHBhcnNlSW50KHByb2Nlc3MuZW52Lk1BWF9URVNUX0RVUkFUSU9OIHx8ICcxODAwMDAwJyksIC8vIDMw5YiGXG4gICAgICBtYXhDb25jdXJyZW50VGVzdHM6IHBhcnNlSW50KHByb2Nlc3MuZW52Lk1BWF9DT05DVVJSRU5UX1RFU1RTIHx8ICc1JyksXG4gICAgICByZXRyeUF0dGVtcHRzOiBwYXJzZUludChwcm9jZXNzLmVudi5SRVRSWV9BVFRFTVBUUyB8fCAnMycpLFxuICAgICAgdGltZW91dE1zOiBwYXJzZUludChwcm9jZXNzLmVudi5USU1FT1VUX01TIHx8ICczMDAwMDAnKSwgLy8gNeWIhlxuICAgICAgZW5hYmxlRGV0YWlsZWRMb2dnaW5nOiBwcm9jZXNzLmVudi5FTkFCTEVfREVUQUlMRURfTE9HR0lORyAhPT0gJ2ZhbHNlJyxcbiAgICAgIGVuYWJsZU1ldHJpY3M6IHByb2Nlc3MuZW52LkVOQUJMRV9NRVRSSUNTICE9PSAnZmFsc2UnLFxuICAgICAgZW5hYmxlQWxlcnRzOiBwcm9jZXNzLmVudi5FTkFCTEVfQUxFUlRTICE9PSAnZmFsc2UnLFxuICAgICAgY29zdFRocmVzaG9sZDogcGFyc2VGbG9hdChwcm9jZXNzLmVudi5DT1NUX1RIUkVTSE9MRCB8fCAnNTAuMCcpLFxuICAgICAgcmVzb3VyY2VUaHJlc2hvbGQ6IHBhcnNlRmxvYXQocHJvY2Vzcy5lbnYuUkVTT1VSQ0VfVEhSRVNIT0xEIHx8ICcwLjgnKVxuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiDlv4XpoIjnkrDlooPlpInmlbDjga7mpJzoqLxcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVSZXF1aXJlZEVudmlyb25tZW50VmFyaWFibGVzKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZyk6IHZvaWQge1xuICBjb25zdCByZXF1aXJlZEZpZWxkcyA9IFtcbiAgICB7IGZpZWxkOiAnYWNjb3VudElkJywgdmFsdWU6IGNvbmZpZy5hY2NvdW50SWQsIG5hbWU6ICdBV1NfQUNDT1VOVF9JRCcgfSxcbiAgICB7IGZpZWxkOiAnZG9tYWluTmFtZScsIHZhbHVlOiBjb25maWcuZG9tYWluTmFtZSwgbmFtZTogJ0RPTUFJTl9OQU1FJyB9LFxuICAgIHsgZmllbGQ6ICdjZXJ0aWZpY2F0ZUFybicsIHZhbHVlOiBjb25maWcuY2VydGlmaWNhdGVBcm4sIG5hbWU6ICdDRVJUSUZJQ0FURV9BUk4nIH0sXG4gICAgeyBmaWVsZDogJ2hvc3RlZFpvbmVJZCcsIHZhbHVlOiBjb25maWcuaG9zdGVkWm9uZUlkLCBuYW1lOiAnSE9TVEVEX1pPTkVfSUQnIH1cbiAgXTtcblxuICBjb25zdCBtaXNzaW5nRmllbGRzID0gcmVxdWlyZWRGaWVsZHMuZmlsdGVyKGZpZWxkID0+ICFmaWVsZC52YWx1ZSB8fCBmaWVsZC52YWx1ZSA9PT0gJycpO1xuICBcbiAgaWYgKG1pc3NpbmdGaWVsZHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IG1pc3NpbmdOYW1lcyA9IG1pc3NpbmdGaWVsZHMubWFwKGZpZWxkID0+IGZpZWxkLm5hbWUpLmpvaW4oJywgJyk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGDlv4XpoIjnkrDlooPlpInmlbDjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpM6ICR7bWlzc2luZ05hbWVzfWApO1xuICB9XG59XG5cbi8qKlxuICog44OG44K544OI57WQ5p6c44Gu6KmV5L6hXG4gKi9cbmZ1bmN0aW9uIGV2YWx1YXRlVGVzdFJlc3VsdHModGVzdFJlc3VsdHM6IGFueSk6IHsgbWVzc2FnZTogc3RyaW5nOyBleGl0Q29kZTogbnVtYmVyIH0ge1xuICBjb25zdCBzY29yZSA9IHRlc3RSZXN1bHRzLnN1bW1hcnkub3ZlcmFsbFNlY3VyaXR5U2NvcmU7XG4gIFxuICBpZiAoc2NvcmUgPj0gMC45KSB7XG4gICAgcmV0dXJuIHsgbWVzc2FnZTogJ/Cfj4Yg5YSq56eAOiDjgrvjgq3jg6Xjg6rjg4bjgqPjg6zjg5njg6vjgYzpnZ7luLjjgavpq5jjgYTjgafjgZknLCBleGl0Q29kZTogMCB9O1xuICB9IGVsc2UgaWYgKHNjb3JlID49IDAuOCkge1xuICAgIHJldHVybiB7IG1lc3NhZ2U6ICfinIUg6Imv5aW9OiDjgrvjgq3jg6Xjg6rjg4bjgqPjg6zjg5njg6vjga/oia/lpb3jgafjgZknLCBleGl0Q29kZTogMCB9O1xuICB9IGVsc2UgaWYgKHNjb3JlID49IDAuNikge1xuICAgIHJldHVybiB7IG1lc3NhZ2U6ICfimqDvuI8g5rOo5oSPOiDjgrvjgq3jg6Xjg6rjg4bjgqPmlLnlloTjgYzmjqjlpajjgZXjgozjgb7jgZknLCBleGl0Q29kZTogMSB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7IG1lc3NhZ2U6ICfinYwg5Y2x6Zm6OiDnt4rmgKXjga7jgrvjgq3jg6Xjg6rjg4bjgqPlr77nrZbjgYzlv4XopoHjgafjgZknLCBleGl0Q29kZTogMSB9O1xuICB9XG59XG5cbi8qKlxuICog57WQ5p6c44OV44Kh44Kk44Or44Gu44OR44K555Sf5oiQXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlUmVzdWx0RmlsZVBhdGgoKTogc3RyaW5nIHtcbiAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcbiAgcmV0dXJuIGAuL2RldmVsb3BtZW50L2xvZ3Mvc2VjdXJpdHkvc2VjdXJpdHktdGVzdC1yZXN1bHRzLSR7dGltZXN0YW1wfS5qc29uYDtcbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jjgrXjg57jg6rjg7zjga7ooajnpLpcbiAqL1xuZnVuY3Rpb24gZGlzcGxheVRlc3RTdW1tYXJ5KHRlc3RSZXN1bHRzOiBhbnkpOiB2b2lkIHtcbiAgY29uc29sZS5sb2coJ/Cfjq8g5pyA57WC6KmV5L6hOicpO1xuICBjb25zb2xlLmxvZyhgICAg57eP5ZCI44K744Kt44Ol44Oq44OG44Kj44K544Kz44KiOiAkeyh0ZXN0UmVzdWx0cy5zdW1tYXJ5Lm92ZXJhbGxTZWN1cml0eVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgY29uc29sZS5sb2coYCAgIOmHjeimgeOBquWVj+mhjDogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5LmNyaXRpY2FsSXNzdWVzfeS7tmApO1xuICBjb25zb2xlLmxvZyhgICAg5o6o5aWo5LqL6aCFOiAke3Rlc3RSZXN1bHRzLnN1bW1hcnkucmVjb21tZW5kYXRpb25zLmxlbmd0aH3ku7ZgKTtcbiAgY29uc29sZS5sb2coJycpO1xufVxuXG4vKipcbiAqIOaOqOWlqOS6i+mgheOBruihqOekulxuICovXG5mdW5jdGlvbiBkaXNwbGF5UmVjb21tZW5kYXRpb25zKHJlY29tbWVuZGF0aW9uczogc3RyaW5nW10pOiB2b2lkIHtcbiAgaWYgKHJlY29tbWVuZGF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgY29uc29sZS5sb2coJ/CfkqEg44K744Kt44Ol44Oq44OG44Kj5pS55ZaE5o6o5aWo5LqL6aCFOicpO1xuICAgIHJlY29tbWVuZGF0aW9ucy5mb3JFYWNoKChyZWNvbW1lbmRhdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAke2luZGV4ICsgMX0uICR7cmVjb21tZW5kYXRpb259YCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICB9XG59XG5cbi8qKlxuICog44Ko44Op44O844Gu6KGo56S6XG4gKi9cbmZ1bmN0aW9uIGRpc3BsYXlFcnJvcnMoZXJyb3JzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgaWYgKGVycm9ycyAmJiBlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgIGNvbnNvbGUubG9nKCfinYwg55m655Sf44GX44Gf44Ko44Op44O8OicpO1xuICAgIGVycm9ycy5mb3JFYWNoKChlcnJvciwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAke2luZGV4ICsgMX0uICR7ZXJyb3J9YCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICB9XG59XG5cbi8qKlxuICog44OG44K544OI44Ko44Op44O844Gu44OP44Oz44OJ44Oq44Oz44KwXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZVRlc3RFcnJvcihlcnJvcjogdW5rbm93bik6IHZvaWQge1xuICBjb25zb2xlLmVycm9yKCcnKTtcbiAgY29uc29sZS5lcnJvcign4p2MIOWMheaLrOeahOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOWun+ihjOOCqOODqeODvDonKTtcbiAgXG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihg44Ko44Op44O844Oh44OD44K744O844K4OiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgXG4gICAgLy8g55Kw5aKD5aSJ5pWw6Zai6YCj44Gu44Ko44Op44O844Gu5aC05ZCIXG4gICAgaWYgKGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJ+W/hemgiOeSsOWig+WkieaVsCcpKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCcnKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ/CfkqEg6Kej5rG65pa55rOVOicpO1xuICAgICAgY29uc29sZS5lcnJvcignICAgMS4gLmVudiDjg5XjgqHjgqTjg6vjgavlv4XopoHjgarnkrDlooPlpInmlbDjgpLoqK3lrprjgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyAgIDIuIEFXU+iqjeiovOaDheWgseOBjOato+OBl+OBj+ioreWumuOBleOCjOOBpuOBhOOCi+OBi+eiuuiqjeOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgICAgY29uc29sZS5lcnJvcignICAgMy4g5b+F6KaB44Gq5qip6ZmQ44GMSUFN44Ot44O844Or44Gr5LuY5LiO44GV44KM44Gm44GE44KL44GL56K66KqN44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIOODh+ODkOODg+OCsOaDheWgse+8iOmWi+eZuueSsOWig+OBruOBv++8iVxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyAmJiBlcnJvci5zdGFjaykge1xuICAgICAgY29uc29sZS5lcnJvcignJyk7XG4gICAgICBjb25zb2xlLmVycm9yKCfjg4fjg5Djg4PjgrDmg4XloLE6Jyk7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yLnN0YWNrKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcign5LqI5pyf44GX44Gq44GE44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOicsIGVycm9yKTtcbiAgfVxuICBcbiAgY29uc29sZS5lcnJvcignJyk7XG59XG5cbi8qKlxuICog44Oq44K944O844K544Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHBlcmZvcm1DbGVhbnVwKFxuICB0ZXN0UnVubmVyPzogU2VjdXJpdHlUZXN0UnVubmVyLFxuICB0ZXN0RW5naW5lPzogUHJvZHVjdGlvblRlc3RFbmdpbmVcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZygn8J+nuSDjg6rjgr3jg7zjgrnjgpLjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK0uLi4nKTtcbiAgXG4gIGNvbnN0IGNsZWFudXBQcm9taXNlczogUHJvbWlzZTx2b2lkPltdID0gW107XG4gIFxuICBpZiAodGVzdFJ1bm5lcikge1xuICAgIGNsZWFudXBQcm9taXNlcy5wdXNoKFxuICAgICAgdGVzdFJ1bm5lci5jbGVhbnVwKCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjg6njg7Pjg4rjg7zjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5fjgafjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG4gIFxuICBpZiAodGVzdEVuZ2luZSkge1xuICAgIGNsZWFudXBQcm9taXNlcy5wdXNoKFxuICAgICAgdGVzdEVuZ2luZS5jbGVhbnVwKCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyDjg4bjgrnjg4jjgqjjg7Pjgrjjg7Pjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5fjgafjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG4gIFxuICB0cnkge1xuICAgIGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChjbGVhbnVwUHJvbWlzZXMpO1xuICAgIGNvbnNvbGUubG9nKCfinIUg44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKCfimqDvuI8g44Kv44Oq44O844Oz44Ki44OD44OX5Yem55CG44Gn5LqI5pyf44GX44Gq44GE44Ko44Op44O8OicsIGVycm9yKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Db21wcmVoZW5zaXZlU2VjdXJpdHlUZXN0cygpIHtcbiAgY29uc29sZS5sb2coJ/CfmoAg5YyF5ous55qE44K744Kt44Ol44Oq44OG44Kj44OG44K544OI5a6f6KGM6ZaL5aeLJyk7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcblxuICBsZXQgdGVzdFJ1bm5lcjogU2VjdXJpdHlUZXN0UnVubmVyIHwgdW5kZWZpbmVkO1xuICBsZXQgdGVzdEVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmUgfCB1bmRlZmluZWQ7XG5cbiAgdHJ5IHtcbiAgICAvLyDnkrDlooPoqK3lrprjga7oqq3jgb/ovrzjgb9cbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdwcm9kdWN0aW9uJztcbiAgICBjb25zb2xlLmxvZyhg8J+TiyDnkrDlooM6ICR7ZW52aXJvbm1lbnR9YCk7XG5cbiAgICAvLyDoqK3lrprjga7mpJzoqLzjgajliJ3mnJ/ljJZcbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCBjcmVhdGVTZWN1cml0eVRlc3RDb25maWcoZW52aXJvbm1lbnQpO1xuICAgIHZhbGlkYXRlUmVxdWlyZWRFbnZpcm9ubWVudFZhcmlhYmxlcyhjb25maWcpO1xuXG4gICAgLy8g44OG44K544OI44Ko44Oz44K444Oz44Gu5Yid5pyf5YyWXG4gICAgY29uc29sZS5sb2coJ/CflKcg44OG44K544OI44Ko44Oz44K444Oz44KS5Yid5pyf5YyW5LitLi4uJyk7XG4gICAgdGVzdEVuZ2luZSA9IG5ldyBQcm9kdWN0aW9uVGVzdEVuZ2luZShjb25maWcpO1xuICAgIGF3YWl0IHRlc3RFbmdpbmUuaW5pdGlhbGl6ZSgpO1xuXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Op44Oz44OK44O844Gu5Yid5pyf5YyWXG4gICAgY29uc29sZS5sb2coJ/CflJIg44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Op44Oz44OK44O844KS5Yid5pyf5YyW5LitLi4uJyk7XG4gICAgdGVzdFJ1bm5lciA9IG5ldyBTZWN1cml0eVRlc3RSdW5uZXIoY29uZmlnLCB0ZXN0RW5naW5lKTtcbiAgICBhd2FpdCB0ZXN0UnVubmVyLmluaXRpYWxpemUoKTtcblxuICAgIC8vIOOCu+OCreODpeODquODhuOCo+ioreWumuOBruihqOekulxuICAgIHRlc3RSdW5uZXIuZGlzcGxheVNlY3VyaXR5Q29uZmlnKCk7XG5cbiAgICAvLyDljIXmi6znmoTjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjga7lrp/ooYxcbiAgICBjb25zb2xlLmxvZygn8J+UkCDljIXmi6znmoTjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jlrp/ooYzkuK0uLi4nKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB0ZXN0UmVzdWx0cyA9IGF3YWl0IHRlc3RSdW5uZXIucnVuU2VjdXJpdHlUZXN0cygpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHRvdGFsRHVyYXRpb24gPSBlbmRUaW1lIC0gc3RhcnRUaW1lO1xuXG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OKIOWMheaLrOeahOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOWujOS6hicpO1xuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gICAgY29uc29sZS5sb2coYOKPse+4jyDnt4/lrp/ooYzmmYLplpM6ICR7KHRvdGFsRHVyYXRpb24gLyAxMDAwKS50b0ZpeGVkKDEpfeenkmApO1xuICAgIGNvbnNvbGUubG9nKGDinIUg57eP5ZCI5oiQ5YqfOiAke3Rlc3RSZXN1bHRzLnN1Y2Nlc3MgPyAnUEFTUycgOiAnRkFJTCd9YCk7XG4gICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgLy8g6Kmz57Sw57WQ5p6c44Gu6KGo56S6XG4gICAgaWYgKHRlc3RSdW5uZXIuZGlzcGxheVNlY3VyaXR5U3VtbWFyeSkge1xuICAgICAgdGVzdFJ1bm5lci5kaXNwbGF5U2VjdXJpdHlTdW1tYXJ5KHRlc3RSZXN1bHRzLnJlc3VsdHMpO1xuICAgIH1cblxuICAgIC8vIOe1kOaenOOBruOCqOOCr+OCueODneODvOODiFxuICAgIGNvbnN0IG91dHB1dFBhdGggPSBnZW5lcmF0ZVJlc3VsdEZpbGVQYXRoKCk7XG4gICAgaWYgKHRlc3RSdW5uZXIuZXhwb3J0U2VjdXJpdHlSZXN1bHRzKSB7XG4gICAgICBhd2FpdCB0ZXN0UnVubmVyLmV4cG9ydFNlY3VyaXR5UmVzdWx0cyh0ZXN0UmVzdWx0cy5yZXN1bHRzLCBvdXRwdXRQYXRoKTtcbiAgICB9XG5cbiAgICAvLyDmnIDntYLntZDmnpzjga7oqZXkvqHjgajooajnpLpcbiAgICBkaXNwbGF5VGVzdFN1bW1hcnkodGVzdFJlc3VsdHMpO1xuICAgIGRpc3BsYXlSZWNvbW1lbmRhdGlvbnModGVzdFJlc3VsdHMuc3VtbWFyeS5yZWNvbW1lbmRhdGlvbnMpO1xuICAgIGRpc3BsYXlFcnJvcnModGVzdFJlc3VsdHMuZXJyb3JzKTtcblxuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygn8J+ThCDoqbPntLDntZDmnpzjga/ku6XkuIvjga7jg5XjgqHjgqTjg6vjgavkv53lrZjjgZXjgozjgb7jgZfjgZ86Jyk7XG4gICAgY29uc29sZS5sb2coYCAgICR7b3V0cHV0UGF0aH1gKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG5cbiAgICAvLyDntYLkuobjgrPjg7zjg4njga7msbrlrppcbiAgICBjb25zdCBldmFsdWF0aW9uID0gZXZhbHVhdGVUZXN0UmVzdWx0cyh0ZXN0UmVzdWx0cyk7XG4gICAgY29uc29sZS5sb2coZXZhbHVhdGlvbi5tZXNzYWdlKTtcbiAgICBcbiAgICBpZiAoZXZhbHVhdGlvbi5leGl0Q29kZSA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coJ/Cfjokg5YyF5ous55qE44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44GM5q2j5bi444Gr5a6M5LqG44GX44G+44GX44GfJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8g44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Gn5ZWP6aGM44GM5qSc5Ye644GV44KM44G+44GX44GfJyk7XG4gICAgfVxuXG4gICAgcHJvY2Vzcy5leGl0KGV2YWx1YXRpb24uZXhpdENvZGUpO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlVGVzdEVycm9yKGVycm9yKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG5cbiAgfSBmaW5hbGx5IHtcbiAgICBhd2FpdCBwZXJmb3JtQ2xlYW51cCh0ZXN0UnVubmVyLCB0ZXN0RW5naW5lKTtcbiAgfVxufVxuXG4vLyDjgrnjgq/jg6rjg5fjg4jjga7lrp/ooYxcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBydW5Db21wcmVoZW5zaXZlU2VjdXJpdHlUZXN0cygpLmNhdGNoKGVycm9yID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCfkuojmnJ/jgZfjgarjgYTjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSk7XG59XG5cbmV4cG9ydCB7IHJ1bkNvbXByZWhlbnNpdmVTZWN1cml0eVRlc3RzIH07Il19