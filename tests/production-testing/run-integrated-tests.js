#!/usr/bin/env node
"use strict";
/**
 * 統合テスト実行スクリプト
 * セキュリティ、パフォーマンス、機能テストの統合実行
 * 本番環境での包括的なシステム検証を実行
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIntegratedTests = runIntegratedTests;
const integrated_test_runner_1 = __importDefault(require("./integrated-test-runner"));
const integrated_test_config_1 = require("./config/integrated-test-config");
async function runIntegratedTests() {
    console.log('🚀 統合テスト実行開始');
    console.log('=====================================');
    console.log('');
    let testRunner;
    try {
        // 環境設定の読み込み
        const environment = process.env.NODE_ENV || process.env.ENVIRONMENT || 'development';
        console.log(`📋 実行環境: ${environment}`);
        // 統合テスト設定の取得と検証
        const integratedConfig = (0, integrated_test_config_1.getIntegratedTestConfig)(environment);
        const validation = (0, integrated_test_config_1.validateIntegratedTestConfig)(integratedConfig);
        if (!validation.isValid) {
            console.error('❌ 統合テスト設定エラー:');
            validation.errors.forEach(error => console.error(`  - ${error}`));
            process.exit(1);
        }
        if (validation.warnings.length > 0) {
            console.warn('⚠️ 統合テスト設定警告:');
            validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
            console.log('');
        }
        // 本番設定の初期化
        const productionConfig = {
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
                maxTestDuration: integratedConfig.timeoutMs,
                maxConcurrentTests: integratedConfig.maxConcurrentTests,
                retryAttempts: integratedConfig.retryAttempts,
                timeoutMs: integratedConfig.timeoutMs,
                enableDetailedLogging: integratedConfig.reportingConfig.includeLogs,
                enableMetrics: integratedConfig.reportingConfig.includeMetrics,
                enableAlerts: true,
                costThreshold: integratedConfig.resourceLimits.maxCostThreshold,
                resourceThreshold: integratedConfig.resourceLimits.maxCpuUsage / 100
            }
        };
        // 統合テストランナーの初期化
        console.log('🔧 統合テストランナーを初期化中...');
        testRunner = new integrated_test_runner_1.default(integratedConfig, productionConfig);
        await testRunner.initialize();
        // 設定情報の表示
        displayTestConfiguration(integratedConfig);
        // 統合テストの実行
        console.log('🚀 統合テスト実行中...');
        console.log('');
        const startTime = Date.now();
        const testResults = await testRunner.runIntegratedTests();
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        console.log('');
        console.log('📊 統合テスト実行完了');
        console.log('=====================================');
        console.log(`⏱️ 総実行時間: ${(totalDuration / 1000).toFixed(1)}秒`);
        console.log(`✅ 総合成功: ${testResults.overallSuccess ? 'PASS' : 'FAIL'}`);
        console.log(`📊 総合スコア: ${testResults.summary.overallScore.toFixed(1)}/100`);
        console.log('');
        // 最終評価とアドバイス
        provideFinalAssessment(testResults);
        // 終了コードの設定
        const exitCode = determineExitCode(testResults, integratedConfig);
        if (exitCode === 0) {
            console.log('🎉 統合テストが正常に完了しました');
        }
        else {
            console.log('⚠️ 統合テストで問題が検出されました');
        }
        process.exit(exitCode);
    }
    catch (error) {
        console.error('');
        console.error('❌ 統合テスト実行エラー:');
        console.error(error);
        console.error('');
        // エラー詳細の表示
        if (error instanceof Error) {
            console.error('エラー詳細:');
            console.error(`  メッセージ: ${error.message}`);
            if (error.stack) {
                console.error(`  スタックトレース: ${error.stack}`);
            }
        }
        process.exit(1);
    }
    finally {
        // リソースのクリーンアップ
        if (testRunner) {
            console.log('🧹 リソースをクリーンアップ中...');
            try {
                await testRunner.cleanup();
                console.log('✅ クリーンアップ完了');
            }
            catch (cleanupError) {
                console.warn('⚠️ クリーンアップ中にエラーが発生:', cleanupError);
            }
        }
    }
}
/**
 * テスト設定情報の表示
 */
function displayTestConfiguration(config) {
    console.log('🔧 統合テスト設定:');
    console.log(`   環境: ${config.environment}`);
    console.log(`   並列実行: ${config.parallelExecution ? 'はい' : 'いいえ'}`);
    console.log(`   最大同時実行数: ${config.maxConcurrentTests}`);
    console.log(`   タイムアウト: ${(config.timeoutMs / 1000 / 60).toFixed(1)}分`);
    console.log(`   リトライ回数: ${config.retryAttempts}`);
    console.log(`   緊急停止: ${config.emergencyStopEnabled ? '有効' : '無効'}`);
    console.log('');
    console.log('📋 有効なテストスイート:');
    const enabledSuites = config.testSuites.filter((suite) => suite.enabled);
    enabledSuites.forEach((suite) => {
        const criticalMark = suite.criticalTest ? '🚨' : '📝';
        const priorityMark = suite.priority >= 90 ? '🔥' : suite.priority >= 80 ? '⚡' : '📋';
        console.log(`   ${criticalMark} ${priorityMark} ${suite.name} (優先度: ${suite.priority})`);
        if (suite.dependencies.length > 0) {
            console.log(`      依存関係: ${suite.dependencies.join(', ')}`);
        }
    });
    console.log('');
    console.log('📊 リソース制限:');
    console.log(`   CPU使用率: ${config.resourceLimits.maxCpuUsage}%`);
    console.log(`   メモリ使用率: ${config.resourceLimits.maxMemoryUsage}%`);
    console.log(`   ネットワーク帯域: ${config.resourceLimits.maxNetworkBandwidth}Mbps`);
    console.log(`   ストレージ使用量: ${config.resourceLimits.maxStorageUsage}GB`);
    console.log(`   コスト上限: $${config.resourceLimits.maxCostThreshold}`);
    console.log('');
    console.log('📄 レポート設定:');
    console.log(`   詳細レポート: ${config.reportingConfig.generateDetailedReport ? '有効' : '無効'}`);
    console.log(`   出力形式: ${config.reportingConfig.exportFormats.join(', ')}`);
    console.log(`   出力ディレクトリ: ${config.reportingConfig.outputDirectory}`);
    console.log('');
}
/**
 * 最終評価とアドバイスの提供
 */
function provideFinalAssessment(testResults) {
    console.log('🎯 最終評価:');
    const overallScore = testResults.summary.overallScore;
    const criticalIssues = testResults.summary.criticalIssues;
    // 総合評価
    if (overallScore >= 95) {
        console.log('🏆 優秀: システムは最高レベルの品質を維持しています');
        console.log('   継続的な監視と定期的なテストの実施を推奨します');
    }
    else if (overallScore >= 85) {
        console.log('✅ 良好: システムは高い品質を維持しています');
        console.log('   軽微な改善により、さらなる品質向上が期待できます');
    }
    else if (overallScore >= 75) {
        console.log('⚠️ 注意: システムに改善が必要な領域があります');
        console.log('   推奨事項に従って改善を実施してください');
    }
    else if (overallScore >= 60) {
        console.log('🚨 警告: システムに重要な問題があります');
        console.log('   緊急の改善が必要です。優先的に対応してください');
    }
    else {
        console.log('💥 危険: システムに深刻な問題があります');
        console.log('   即座の対応が必要です。本番運用を停止することを検討してください');
    }
    // 分野別評価
    console.log('');
    console.log('📊 分野別評価:');
    const securityScore = testResults.summary.securityScore;
    const performanceScore = testResults.summary.performanceScore;
    const functionalScore = testResults.summary.functionalScore;
    console.log(`   🔒 セキュリティ: ${securityScore.toFixed(1)}/100 ${getScoreEmoji(securityScore)}`);
    if (securityScore < 80) {
        console.log('      → セキュリティ対策の強化が必要です');
    }
    console.log(`   ⚡ パフォーマンス: ${performanceScore.toFixed(1)}/100 ${getScoreEmoji(performanceScore)}`);
    if (performanceScore < 75) {
        console.log('      → システムの最適化を検討してください');
    }
    console.log(`   🔧 機能: ${functionalScore.toFixed(1)}/100 ${getScoreEmoji(functionalScore)}`);
    if (functionalScore < 90) {
        console.log('      → 機能の修正が必要です');
    }
    // 重要な問題
    if (criticalIssues > 0) {
        console.log('');
        console.log(`🚨 重要な問題: ${criticalIssues}件`);
        console.log('   これらの問題は優先的に対応してください');
    }
    // 推奨事項
    if (testResults.recommendations.length > 0) {
        console.log('');
        console.log('💡 主要な推奨事項:');
        testResults.recommendations.slice(0, 3).forEach((recommendation, index) => {
            console.log(`   ${index + 1}. ${recommendation}`);
        });
        if (testResults.recommendations.length > 3) {
            console.log(`   ... 他 ${testResults.recommendations.length - 3} 件の推奨事項があります`);
        }
    }
    console.log('');
}
/**
 * スコアに応じた絵文字の取得
 */
function getScoreEmoji(score) {
    if (score >= 90)
        return '🟢';
    if (score >= 80)
        return '🟡';
    if (score >= 70)
        return '🟠';
    return '🔴';
}
/**
 * 終了コードの決定
 */
function determineExitCode(testResults, config) {
    // 総合成功判定
    if (!testResults.overallSuccess) {
        return 1;
    }
    // 重要なテストスイートの失敗チェック
    const criticalSuites = config.testSuites.filter((suite) => suite.criticalTest && suite.enabled);
    for (const suite of criticalSuites) {
        const result = testResults.testSuiteResults.get(suite.name);
        if (result && !result.success) {
            return 1;
        }
    }
    // スコア基準での判定
    const overallScore = testResults.summary.overallScore;
    const securityScore = testResults.summary.securityScore;
    // セキュリティスコアが低い場合は失敗
    if (securityScore < 70) {
        return 1;
    }
    // 総合スコアが低い場合は失敗
    if (overallScore < 70) {
        return 1;
    }
    // 重要な問題がある場合は失敗
    if (testResults.summary.criticalIssues > 0) {
        return 1;
    }
    return 0;
}
// スクリプトの実行
if (require.main === module) {
    runIntegratedTests().catch(error => {
        console.error('予期しないエラー:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLWludGVncmF0ZWQtdGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJydW4taW50ZWdyYXRlZC10ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0dBSUc7Ozs7O0FBZ1RNLGdEQUFrQjtBQTlTM0Isc0ZBQTREO0FBRTVELDRFQUF3RztBQUV4RyxLQUFLLFVBQVUsa0JBQWtCO0lBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFaEIsSUFBSSxVQUE0QyxDQUFDO0lBRWpELElBQUksQ0FBQztRQUNILFlBQVk7UUFDWixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxhQUFhLENBQUM7UUFDckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFFdkMsZ0JBQWdCO1FBQ2hCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxnREFBdUIsRUFBQyxXQUFXLENBQUMsQ0FBQztRQUM5RCxNQUFNLFVBQVUsR0FBRyxJQUFBLHFEQUE0QixFQUFDLGdCQUFnQixDQUFDLENBQUM7UUFFbEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN4QixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9CLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxJQUFJLFVBQVUsQ0FB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QUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICog57Wx5ZCI44OG44K544OI5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiDjgrvjgq3jg6Xjg6rjg4bjgqPjgIHjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgIHmqZ/og73jg4bjgrnjg4jjga7ntbHlkIjlrp/ooYxcbiAqIOacrOeVqueSsOWig+OBp+OBruWMheaLrOeahOOBquOCt+OCueODhuODoOaknOiovOOCkuWun+ihjFxuICovXG5cbmltcG9ydCBJbnRlZ3JhdGVkVGVzdFJ1bm5lciBmcm9tICcuL2ludGVncmF0ZWQtdGVzdC1ydW5uZXInO1xuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCB7IGdldEludGVncmF0ZWRUZXN0Q29uZmlnLCB2YWxpZGF0ZUludGVncmF0ZWRUZXN0Q29uZmlnIH0gZnJvbSAnLi9jb25maWcvaW50ZWdyYXRlZC10ZXN0LWNvbmZpZyc7XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bkludGVncmF0ZWRUZXN0cygpIHtcbiAgY29uc29sZS5sb2coJ/CfmoAg57Wx5ZCI44OG44K544OI5a6f6KGM6ZaL5aeLJyk7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcblxuICBsZXQgdGVzdFJ1bm5lcjogSW50ZWdyYXRlZFRlc3RSdW5uZXIgfCB1bmRlZmluZWQ7XG5cbiAgdHJ5IHtcbiAgICAvLyDnkrDlooPoqK3lrprjga7oqq3jgb/ovrzjgb9cbiAgICBjb25zdCBlbnZpcm9ubWVudCA9IHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8IHByb2Nlc3MuZW52LkVOVklST05NRU5UIHx8ICdkZXZlbG9wbWVudCc7XG4gICAgY29uc29sZS5sb2coYPCfk4sg5a6f6KGM55Kw5aKDOiAke2Vudmlyb25tZW50fWApO1xuXG4gICAgLy8g57Wx5ZCI44OG44K544OI6Kit5a6a44Gu5Y+W5b6X44Go5qSc6Ki8XG4gICAgY29uc3QgaW50ZWdyYXRlZENvbmZpZyA9IGdldEludGVncmF0ZWRUZXN0Q29uZmlnKGVudmlyb25tZW50KTtcbiAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVJbnRlZ3JhdGVkVGVzdENvbmZpZyhpbnRlZ3JhdGVkQ29uZmlnKTtcblxuICAgIGlmICghdmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg57Wx5ZCI44OG44K544OI6Kit5a6a44Ko44Op44O8OicpO1xuICAgICAgdmFsaWRhdGlvbi5lcnJvcnMuZm9yRWFjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGAgIC0gJHtlcnJvcn1gKSk7XG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRpb24ud2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS53YXJuKCfimqDvuI8g57Wx5ZCI44OG44K544OI6Kit5a6a6K2m5ZGKOicpO1xuICAgICAgdmFsaWRhdGlvbi53YXJuaW5ncy5mb3JFYWNoKHdhcm5pbmcgPT4gY29uc29sZS53YXJuKGAgIC0gJHt3YXJuaW5nfWApKTtcbiAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICAvLyDmnKznlaroqK3lrprjga7liJ3mnJ/ljJZcbiAgICBjb25zdCBwcm9kdWN0aW9uQ29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnID0ge1xuICAgICAgZW52aXJvbm1lbnQsXG4gICAgICByZWdpb246IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ3VzLWVhc3QtMScsXG4gICAgICBwcm9qZWN0TmFtZTogcHJvY2Vzcy5lbnYuUFJPSkVDVF9OQU1FIHx8ICdyYWctc3lzdGVtJyxcbiAgICAgIGFjY291bnRJZDogcHJvY2Vzcy5lbnYuQVdTX0FDQ09VTlRfSUQgfHwgJycsXG4gICAgICBkb21haW5OYW1lOiBwcm9jZXNzLmVudi5ET01BSU5fTkFNRSB8fCAncmFnLXN5c3RlbS5leGFtcGxlLmNvbScsXG4gICAgICBjZXJ0aWZpY2F0ZUFybjogcHJvY2Vzcy5lbnYuQ0VSVElGSUNBVEVfQVJOIHx8ICcnLFxuICAgICAgaG9zdGVkWm9uZUlkOiBwcm9jZXNzLmVudi5IT1NURURfWk9ORV9JRCB8fCAnJyxcbiAgICAgIGVuYWJsZVdhZjogdHJ1ZSxcbiAgICAgIGVuYWJsZUNsb3VkVHJhaWw6IHRydWUsXG4gICAgICBlbmFibGVHdWFyZER1dHk6IHRydWUsXG4gICAgICBlbmFibGVTZWN1cml0eUh1YjogdHJ1ZSxcbiAgICAgIHRlc3RDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIG1heFRlc3REdXJhdGlvbjogaW50ZWdyYXRlZENvbmZpZy50aW1lb3V0TXMsXG4gICAgICAgIG1heENvbmN1cnJlbnRUZXN0czogaW50ZWdyYXRlZENvbmZpZy5tYXhDb25jdXJyZW50VGVzdHMsXG4gICAgICAgIHJldHJ5QXR0ZW1wdHM6IGludGVncmF0ZWRDb25maWcucmV0cnlBdHRlbXB0cyxcbiAgICAgICAgdGltZW91dE1zOiBpbnRlZ3JhdGVkQ29uZmlnLnRpbWVvdXRNcyxcbiAgICAgICAgZW5hYmxlRGV0YWlsZWRMb2dnaW5nOiBpbnRlZ3JhdGVkQ29uZmlnLnJlcG9ydGluZ0NvbmZpZy5pbmNsdWRlTG9ncyxcbiAgICAgICAgZW5hYmxlTWV0cmljczogaW50ZWdyYXRlZENvbmZpZy5yZXBvcnRpbmdDb25maWcuaW5jbHVkZU1ldHJpY3MsXG4gICAgICAgIGVuYWJsZUFsZXJ0czogdHJ1ZSxcbiAgICAgICAgY29zdFRocmVzaG9sZDogaW50ZWdyYXRlZENvbmZpZy5yZXNvdXJjZUxpbWl0cy5tYXhDb3N0VGhyZXNob2xkLFxuICAgICAgICByZXNvdXJjZVRocmVzaG9sZDogaW50ZWdyYXRlZENvbmZpZy5yZXNvdXJjZUxpbWl0cy5tYXhDcHVVc2FnZSAvIDEwMFxuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyDntbHlkIjjg4bjgrnjg4jjg6njg7Pjg4rjg7zjga7liJ3mnJ/ljJZcbiAgICBjb25zb2xlLmxvZygn8J+UpyDntbHlkIjjg4bjgrnjg4jjg6njg7Pjg4rjg7zjgpLliJ3mnJ/ljJbkuK0uLi4nKTtcbiAgICB0ZXN0UnVubmVyID0gbmV3IEludGVncmF0ZWRUZXN0UnVubmVyKGludGVncmF0ZWRDb25maWcsIHByb2R1Y3Rpb25Db25maWcpO1xuICAgIGF3YWl0IHRlc3RSdW5uZXIuaW5pdGlhbGl6ZSgpO1xuXG4gICAgLy8g6Kit5a6a5oOF5aCx44Gu6KGo56S6XG4gICAgZGlzcGxheVRlc3RDb25maWd1cmF0aW9uKGludGVncmF0ZWRDb25maWcpO1xuXG4gICAgLy8g57Wx5ZCI44OG44K544OI44Gu5a6f6KGMXG4gICAgY29uc29sZS5sb2coJ/CfmoAg57Wx5ZCI44OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIFxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgdGVzdFJlc3VsdHMgPSBhd2FpdCB0ZXN0UnVubmVyLnJ1bkludGVncmF0ZWRUZXN0cygpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHRvdGFsRHVyYXRpb24gPSBlbmRUaW1lIC0gc3RhcnRUaW1lO1xuXG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OKIOe1seWQiOODhuOCueODiOWun+ihjOWujOS6hicpO1xuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gICAgY29uc29sZS5sb2coYOKPse+4jyDnt4/lrp/ooYzmmYLplpM6ICR7KHRvdGFsRHVyYXRpb24gLyAxMDAwKS50b0ZpeGVkKDEpfeenkmApO1xuICAgIGNvbnNvbGUubG9nKGDinIUg57eP5ZCI5oiQ5YqfOiAke3Rlc3RSZXN1bHRzLm92ZXJhbGxTdWNjZXNzID8gJ1BBU1MnIDogJ0ZBSUwnfWApO1xuICAgIGNvbnNvbGUubG9nKGDwn5OKIOe3j+WQiOOCueOCs+OCojogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5Lm92ZXJhbGxTY29yZS50b0ZpeGVkKDEpfS8xMDBgKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG5cbiAgICAvLyDmnIDntYLoqZXkvqHjgajjgqLjg4njg5DjgqTjgrlcbiAgICBwcm92aWRlRmluYWxBc3Nlc3NtZW50KHRlc3RSZXN1bHRzKTtcblxuICAgIC8vIOe1guS6huOCs+ODvOODieOBruioreWumlxuICAgIGNvbnN0IGV4aXRDb2RlID0gZGV0ZXJtaW5lRXhpdENvZGUodGVzdFJlc3VsdHMsIGludGVncmF0ZWRDb25maWcpO1xuICAgIFxuICAgIGlmIChleGl0Q29kZSA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coJ/Cfjokg57Wx5ZCI44OG44K544OI44GM5q2j5bi444Gr5a6M5LqG44GX44G+44GX44GfJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8g57Wx5ZCI44OG44K544OI44Gn5ZWP6aGM44GM5qSc5Ye644GV44KM44G+44GX44GfJyk7XG4gICAgfVxuXG4gICAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJycpO1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDntbHlkIjjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6Jyk7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgY29uc29sZS5lcnJvcignJyk7XG5cbiAgICAvLyDjgqjjg6njg7zoqbPntLDjga7ooajnpLpcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign44Ko44Op44O86Kmz57SwOicpO1xuICAgICAgY29uc29sZS5lcnJvcihgICDjg6Hjg4Pjgrvjg7zjgrg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgIGlmIChlcnJvci5zdGFjaykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGAgIOOCueOCv+ODg+OCr+ODiOODrOODvOOCuTogJHtlcnJvci5zdGFja31gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9jZXNzLmV4aXQoMSk7XG5cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICBpZiAodGVzdFJ1bm5lcikge1xuICAgICAgY29uc29sZS5sb2coJ/Cfp7kg44Oq44K944O844K544KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRlc3RSdW5uZXIuY2xlYW51cCgpO1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIOOCr+ODquODvOODs+OCouODg+ODl+WujOS6hicpO1xuICAgICAgICBcbiAgICAgIH0gY2F0Y2ggKGNsZWFudXBFcnJvcikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyDjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK3jgavjgqjjg6njg7zjgYznmbrnlJ86JywgY2xlYW51cEVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiDjg4bjgrnjg4joqK3lrprmg4XloLHjga7ooajnpLpcbiAqL1xuZnVuY3Rpb24gZGlzcGxheVRlc3RDb25maWd1cmF0aW9uKGNvbmZpZzogYW55KTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCfwn5SnIOe1seWQiOODhuOCueODiOioreWumjonKTtcbiAgY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtjb25maWcuZW52aXJvbm1lbnR9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDkuKbliJflrp/ooYw6ICR7Y29uZmlnLnBhcmFsbGVsRXhlY3V0aW9uID8gJ+OBr+OBhCcgOiAn44GE44GE44GIJ31gKTtcbiAgY29uc29sZS5sb2coYCAgIOacgOWkp+WQjOaZguWun+ihjOaVsDogJHtjb25maWcubWF4Q29uY3VycmVudFRlc3RzfWApO1xuICBjb25zb2xlLmxvZyhgICAg44K/44Kk44Og44Ki44Km44OIOiAkeyhjb25maWcudGltZW91dE1zIC8gMTAwMCAvIDYwKS50b0ZpeGVkKDEpfeWIhmApO1xuICBjb25zb2xlLmxvZyhgICAg44Oq44OI44Op44Kk5Zue5pWwOiAke2NvbmZpZy5yZXRyeUF0dGVtcHRzfWApO1xuICBjb25zb2xlLmxvZyhgICAg57eK5oCl5YGc5q2iOiAke2NvbmZpZy5lbWVyZ2VuY3lTdG9wRW5hYmxlZCA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gIGNvbnNvbGUubG9nKCcnKTtcblxuICBjb25zb2xlLmxvZygn8J+TiyDmnInlirnjgarjg4bjgrnjg4jjgrnjgqTjg7zjg4g6Jyk7XG4gIGNvbnN0IGVuYWJsZWRTdWl0ZXMgPSBjb25maWcudGVzdFN1aXRlcy5maWx0ZXIoKHN1aXRlOiBhbnkpID0+IHN1aXRlLmVuYWJsZWQpO1xuICBlbmFibGVkU3VpdGVzLmZvckVhY2goKHN1aXRlOiBhbnkpID0+IHtcbiAgICBjb25zdCBjcml0aWNhbE1hcmsgPSBzdWl0ZS5jcml0aWNhbFRlc3QgPyAn8J+aqCcgOiAn8J+TnSc7XG4gICAgY29uc3QgcHJpb3JpdHlNYXJrID0gc3VpdGUucHJpb3JpdHkgPj0gOTAgPyAn8J+UpScgOiBzdWl0ZS5wcmlvcml0eSA+PSA4MCA/ICfimqEnIDogJ/Cfk4snO1xuICAgIGNvbnNvbGUubG9nKGAgICAke2NyaXRpY2FsTWFya30gJHtwcmlvcml0eU1hcmt9ICR7c3VpdGUubmFtZX0gKOWEquWFiOW6pjogJHtzdWl0ZS5wcmlvcml0eX0pYCk7XG4gICAgXG4gICAgaWYgKHN1aXRlLmRlcGVuZGVuY2llcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICAg5L6d5a2Y6Zai5L+COiAke3N1aXRlLmRlcGVuZGVuY2llcy5qb2luKCcsICcpfWApO1xuICAgIH1cbiAgfSk7XG4gIGNvbnNvbGUubG9nKCcnKTtcblxuICBjb25zb2xlLmxvZygn8J+TiiDjg6rjgr3jg7zjgrnliLbpmZA6Jyk7XG4gIGNvbnNvbGUubG9nKGAgICBDUFXkvb/nlKjnjoc6ICR7Y29uZmlnLnJlc291cmNlTGltaXRzLm1heENwdVVzYWdlfSVgKTtcbiAgY29uc29sZS5sb2coYCAgIOODoeODouODquS9v+eUqOeOhzogJHtjb25maWcucmVzb3VyY2VMaW1pdHMubWF4TWVtb3J5VXNhZ2V9JWApO1xuICBjb25zb2xlLmxvZyhgICAg44ON44OD44OI44Ov44O844Kv5biv5Z+fOiAke2NvbmZpZy5yZXNvdXJjZUxpbWl0cy5tYXhOZXR3b3JrQmFuZHdpZHRofU1icHNgKTtcbiAgY29uc29sZS5sb2coYCAgIOOCueODiOODrOODvOOCuOS9v+eUqOmHjzogJHtjb25maWcucmVzb3VyY2VMaW1pdHMubWF4U3RvcmFnZVVzYWdlfUdCYCk7XG4gIGNvbnNvbGUubG9nKGAgICDjgrPjgrnjg4jkuIrpmZA6ICQke2NvbmZpZy5yZXNvdXJjZUxpbWl0cy5tYXhDb3N0VGhyZXNob2xkfWApO1xuICBjb25zb2xlLmxvZygnJyk7XG5cbiAgY29uc29sZS5sb2coJ/Cfk4Qg44Os44Od44O844OI6Kit5a6aOicpO1xuICBjb25zb2xlLmxvZyhgICAg6Kmz57Sw44Os44Od44O844OIOiAke2NvbmZpZy5yZXBvcnRpbmdDb25maWcuZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydCA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDlh7rlipvlvaLlvI86ICR7Y29uZmlnLnJlcG9ydGluZ0NvbmZpZy5leHBvcnRGb3JtYXRzLmpvaW4oJywgJyl9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6o6ICR7Y29uZmlnLnJlcG9ydGluZ0NvbmZpZy5vdXRwdXREaXJlY3Rvcnl9YCk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbn1cblxuLyoqXG4gKiDmnIDntYLoqZXkvqHjgajjgqLjg4njg5DjgqTjgrnjga7mj5DkvptcbiAqL1xuZnVuY3Rpb24gcHJvdmlkZUZpbmFsQXNzZXNzbWVudCh0ZXN0UmVzdWx0czogYW55KTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCfwn46vIOacgOe1guipleS+oTonKTtcbiAgXG4gIGNvbnN0IG92ZXJhbGxTY29yZSA9IHRlc3RSZXN1bHRzLnN1bW1hcnkub3ZlcmFsbFNjb3JlO1xuICBjb25zdCBjcml0aWNhbElzc3VlcyA9IHRlc3RSZXN1bHRzLnN1bW1hcnkuY3JpdGljYWxJc3N1ZXM7XG4gIFxuICAvLyDnt4/lkIjoqZXkvqFcbiAgaWYgKG92ZXJhbGxTY29yZSA+PSA5NSkge1xuICAgIGNvbnNvbGUubG9nKCfwn4+GIOWEquengDog44K344K544OG44Og44Gv5pyA6auY44Os44OZ44Or44Gu5ZOB6LOq44KS57at5oyB44GX44Gm44GE44G+44GZJyk7XG4gICAgY29uc29sZS5sb2coJyAgIOe2mee2mueahOOBquebo+imluOBqOWumuacn+eahOOBquODhuOCueODiOOBruWun+aWveOCkuaOqOWlqOOBl+OBvuOBmScpO1xuICB9IGVsc2UgaWYgKG92ZXJhbGxTY29yZSA+PSA4NSkge1xuICAgIGNvbnNvbGUubG9nKCfinIUg6Imv5aW9OiDjgrfjgrnjg4bjg6Djga/pq5jjgYTlk4Hos6rjgpLntq3mjIHjgZfjgabjgYTjgb7jgZknKTtcbiAgICBjb25zb2xlLmxvZygnICAg6Lu95b6u44Gq5pS55ZaE44Gr44KI44KK44CB44GV44KJ44Gq44KL5ZOB6LOq5ZCR5LiK44GM5pyf5b6F44Gn44GN44G+44GZJyk7XG4gIH0gZWxzZSBpZiAob3ZlcmFsbFNjb3JlID49IDc1KSB7XG4gICAgY29uc29sZS5sb2coJ+KaoO+4jyDms6jmhI86IOOCt+OCueODhuODoOOBq+aUueWWhOOBjOW/heimgeOBqumgmOWfn+OBjOOBguOCiuOBvuOBmScpO1xuICAgIGNvbnNvbGUubG9nKCcgICDmjqjlpajkuovpoIXjgavlvpPjgaPjgabmlLnlloTjgpLlrp/mlr3jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgfSBlbHNlIGlmIChvdmVyYWxsU2NvcmUgPj0gNjApIHtcbiAgICBjb25zb2xlLmxvZygn8J+aqCDorablkYo6IOOCt+OCueODhuODoOOBq+mHjeimgeOBquWVj+mhjOOBjOOBguOCiuOBvuOBmScpO1xuICAgIGNvbnNvbGUubG9nKCcgICDnt4rmgKXjga7mlLnlloTjgYzlv4XopoHjgafjgZnjgILlhKrlhYjnmoTjgavlr77lv5zjgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygn8J+SpSDljbHpmbo6IOOCt+OCueODhuODoOOBq+a3seWIu+OBquWVj+mhjOOBjOOBguOCiuOBvuOBmScpO1xuICAgIGNvbnNvbGUubG9nKCcgICDljbPluqfjga7lr77lv5zjgYzlv4XopoHjgafjgZnjgILmnKznlarpgYvnlKjjgpLlgZzmraLjgZnjgovjgZPjgajjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgfVxuXG4gIC8vIOWIhumHjuWIpeipleS+oVxuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCfwn5OKIOWIhumHjuWIpeipleS+oTonKTtcbiAgXG4gIGNvbnN0IHNlY3VyaXR5U2NvcmUgPSB0ZXN0UmVzdWx0cy5zdW1tYXJ5LnNlY3VyaXR5U2NvcmU7XG4gIGNvbnN0IHBlcmZvcm1hbmNlU2NvcmUgPSB0ZXN0UmVzdWx0cy5zdW1tYXJ5LnBlcmZvcm1hbmNlU2NvcmU7XG4gIGNvbnN0IGZ1bmN0aW9uYWxTY29yZSA9IHRlc3RSZXN1bHRzLnN1bW1hcnkuZnVuY3Rpb25hbFNjb3JlO1xuXG4gIGNvbnNvbGUubG9nKGAgICDwn5SSIOOCu+OCreODpeODquODhuOCozogJHtzZWN1cml0eVNjb3JlLnRvRml4ZWQoMSl9LzEwMCAke2dldFNjb3JlRW1vamkoc2VjdXJpdHlTY29yZSl9YCk7XG4gIGlmIChzZWN1cml0eVNjb3JlIDwgODApIHtcbiAgICBjb25zb2xlLmxvZygnICAgICAg4oaSIOOCu+OCreODpeODquODhuOCo+WvvuetluOBruW8t+WMluOBjOW/heimgeOBp+OBmScpO1xuICB9XG5cbiAgY29uc29sZS5sb2coYCAgIOKaoSDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrk6ICR7cGVyZm9ybWFuY2VTY29yZS50b0ZpeGVkKDEpfS8xMDAgJHtnZXRTY29yZUVtb2ppKHBlcmZvcm1hbmNlU2NvcmUpfWApO1xuICBpZiAocGVyZm9ybWFuY2VTY29yZSA8IDc1KSB7XG4gICAgY29uc29sZS5sb2coJyAgICAgIOKGkiDjgrfjgrnjg4bjg6Djga7mnIDpganljJbjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGAgICDwn5SnIOapn+iDvTogJHtmdW5jdGlvbmFsU2NvcmUudG9GaXhlZCgxKX0vMTAwICR7Z2V0U2NvcmVFbW9qaShmdW5jdGlvbmFsU2NvcmUpfWApO1xuICBpZiAoZnVuY3Rpb25hbFNjb3JlIDwgOTApIHtcbiAgICBjb25zb2xlLmxvZygnICAgICAg4oaSIOapn+iDveOBruS/ruato+OBjOW/heimgeOBp+OBmScpO1xuICB9XG5cbiAgLy8g6YeN6KaB44Gq5ZWP6aGMXG4gIGlmIChjcml0aWNhbElzc3VlcyA+IDApIHtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coYPCfmqgg6YeN6KaB44Gq5ZWP6aGMOiAke2NyaXRpY2FsSXNzdWVzfeS7tmApO1xuICAgIGNvbnNvbGUubG9nKCcgICDjgZPjgozjgonjga7llY/poYzjga/lhKrlhYjnmoTjgavlr77lv5zjgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgfVxuXG4gIC8vIOaOqOWlqOS6i+mghVxuICBpZiAodGVzdFJlc3VsdHMucmVjb21tZW5kYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJ/CfkqEg5Li76KaB44Gq5o6o5aWo5LqL6aCFOicpO1xuICAgIHRlc3RSZXN1bHRzLnJlY29tbWVuZGF0aW9ucy5zbGljZSgwLCAzKS5mb3JFYWNoKChyZWNvbW1lbmRhdGlvbjogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAgJHtpbmRleCArIDF9LiAke3JlY29tbWVuZGF0aW9ufWApO1xuICAgIH0pO1xuICAgIFxuICAgIGlmICh0ZXN0UmVzdWx0cy5yZWNvbW1lbmRhdGlvbnMubGVuZ3RoID4gMykge1xuICAgICAgY29uc29sZS5sb2coYCAgIC4uLiDku5YgJHt0ZXN0UmVzdWx0cy5yZWNvbW1lbmRhdGlvbnMubGVuZ3RoIC0gM30g5Lu244Gu5o6o5aWo5LqL6aCF44GM44GC44KK44G+44GZYCk7XG4gICAgfVxuICB9XG5cbiAgY29uc29sZS5sb2coJycpO1xufVxuXG4vKipcbiAqIOOCueOCs+OCouOBq+W/nOOBmOOBn+e1teaWh+Wtl+OBruWPluW+l1xuICovXG5mdW5jdGlvbiBnZXRTY29yZUVtb2ppKHNjb3JlOiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoc2NvcmUgPj0gOTApIHJldHVybiAn8J+foic7XG4gIGlmIChzY29yZSA+PSA4MCkgcmV0dXJuICfwn5+hJztcbiAgaWYgKHNjb3JlID49IDcwKSByZXR1cm4gJ/Cfn6AnO1xuICByZXR1cm4gJ/CflLQnO1xufVxuXG4vKipcbiAqIOe1guS6huOCs+ODvOODieOBruaxuuWumlxuICovXG5mdW5jdGlvbiBkZXRlcm1pbmVFeGl0Q29kZSh0ZXN0UmVzdWx0czogYW55LCBjb25maWc6IGFueSk6IG51bWJlciB7XG4gIC8vIOe3j+WQiOaIkOWKn+WIpOWumlxuICBpZiAoIXRlc3RSZXN1bHRzLm92ZXJhbGxTdWNjZXNzKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvLyDph43opoHjgarjg4bjgrnjg4jjgrnjgqTjg7zjg4jjga7lpLHmlZfjg4Hjgqfjg4Pjgq9cbiAgY29uc3QgY3JpdGljYWxTdWl0ZXMgPSBjb25maWcudGVzdFN1aXRlcy5maWx0ZXIoKHN1aXRlOiBhbnkpID0+IHN1aXRlLmNyaXRpY2FsVGVzdCAmJiBzdWl0ZS5lbmFibGVkKTtcbiAgZm9yIChjb25zdCBzdWl0ZSBvZiBjcml0aWNhbFN1aXRlcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRlc3RSZXN1bHRzLnRlc3RTdWl0ZVJlc3VsdHMuZ2V0KHN1aXRlLm5hbWUpO1xuICAgIGlmIChyZXN1bHQgJiYgIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gIH1cblxuICAvLyDjgrnjgrPjgqLln7rmupbjgafjga7liKTlrppcbiAgY29uc3Qgb3ZlcmFsbFNjb3JlID0gdGVzdFJlc3VsdHMuc3VtbWFyeS5vdmVyYWxsU2NvcmU7XG4gIGNvbnN0IHNlY3VyaXR5U2NvcmUgPSB0ZXN0UmVzdWx0cy5zdW1tYXJ5LnNlY3VyaXR5U2NvcmU7XG4gIFxuICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgrPjgqLjgYzkvY7jgYTloLTlkIjjga/lpLHmlZdcbiAgaWYgKHNlY3VyaXR5U2NvcmUgPCA3MCkge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLy8g57eP5ZCI44K544Kz44Ki44GM5L2O44GE5aC05ZCI44Gv5aSx5pWXXG4gIGlmIChvdmVyYWxsU2NvcmUgPCA3MCkge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLy8g6YeN6KaB44Gq5ZWP6aGM44GM44GC44KL5aC05ZCI44Gv5aSx5pWXXG4gIGlmICh0ZXN0UmVzdWx0cy5zdW1tYXJ5LmNyaXRpY2FsSXNzdWVzID4gMCkge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgcmV0dXJuIDA7XG59XG5cbi8vIOOCueOCr+ODquODl+ODiOOBruWun+ihjFxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIHJ1bkludGVncmF0ZWRUZXN0cygpLmNhdGNoKGVycm9yID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCfkuojmnJ/jgZfjgarjgYTjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSk7XG59XG5cbmV4cG9ydCB7IHJ1bkludGVncmF0ZWRUZXN0cyB9OyJdfQ==