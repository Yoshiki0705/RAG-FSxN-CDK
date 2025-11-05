#!/usr/bin/env ts-node
"use strict";
/**
 * セキュリティテスト実行スクリプト
 *
 * 実本番環境でのセキュリティテストを実行
 * HTTPS暗号化、攻撃耐性、セキュリティ監視のテストを包括的に実行
 *
 * 使用例:
 * npm run test:production:security
 * ts-node run-security-tests.ts --env production
 * ts-node run-security-tests.ts --env staging --verbose
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
exports.runSecurityTests = main;
const commander_1 = require("commander");
const production_config_1 = require("../../config/production-config");
const production_test_engine_1 = __importDefault(require("../../core/production-test-engine"));
const security_test_runner_1 = __importDefault(require("./security-test-runner"));
const security_config_1 = require("./security-config");
const fs = __importStar(require("fs"));
/**
 * コマンドライン引数の解析
 */
function parseArguments() {
    const program = new commander_1.Command();
    program
        .name('run-security-tests')
        .description('実本番環境でのセキュリティテスト実行')
        .version('1.0.0')
        .option('-e, --env <environment>', '実行環境 (production, staging, development)', 'production')
        .option('-r, --report <path>', 'レポート出力パス', './security-test-report.md')
        .option('-j, --json <path>', 'JSON結果出力パス', './security-test-results.json')
        .option('-v, --verbose', '詳細ログ出力', false)
        .option('--dry-run', 'ドライラン実行（実際のテストは行わない）', false)
        .option('--https-only', 'HTTPS暗号化テストのみ実行', false)
        .option('--attack-only', '攻撃耐性テストのみ実行', false)
        .option('--monitoring-only', 'セキュリティ監視テストのみ実行', false)
        .option('--skip-dangerous', '危険な攻撃テストをスキップ', false)
        .option('--timeout <seconds>', 'テストタイムアウト (秒)', '')
        .option('--no-emergency-stop', '緊急停止機能を無効化', false)
        .parse();
    return program.opts();
}
/**
 * セキュリティテストレポートの生成
 */
async function generateSecurityReport(results, outputPath, config) {
    const timestamp = new Date().toISOString();
    const summary = results.summary;
    const reportContent = `# セキュリティテストレポート

## 実行情報
- **実行日時**: ${timestamp}
- **環境**: ${config.environment}
- **対象システム**: ${config.region} リージョン
- **テスト実行者**: 自動テストシステム

## 実行サマリー
- **総テスト数**: ${summary.totalTests}
- **成功**: ${summary.passedTests}
- **失敗**: ${summary.failedTests}
- **スキップ**: ${summary.skippedTests}
- **総合セキュリティスコア**: ${(summary.overallSecurityScore * 100).toFixed(1)}%
- **重要な問題**: ${summary.criticalIssues}件

## セキュリティ評価

### 総合評価
${summary.overallSecurityScore >= 0.8
        ? '✅ **優秀** - 高いセキュリティレベルが確保されています'
        : summary.overallSecurityScore >= 0.6
            ? '⚠️ **良好** - セキュリティレベルは良好ですが、改善の余地があります'
            : '❌ **要改善** - 重要なセキュリティ問題があります。緊急の対応が必要です'}

### 詳細結果

${Array.from(results.results.entries()).map(([testName, result]) => `
#### ${result.testName}
- **ステータス**: ${result.success ? '✅ 成功' : '❌ 失敗'}
- **実行時間**: ${result.duration}ms
- **セキュリティスコア**: ${(result.securityMetrics.securityScore * 100).toFixed(1)}%

**セキュリティメトリクス**:
- HTTPS準拠: ${result.securityMetrics.httpsCompliance ? '✓' : '✗'}
- 証明書有効: ${result.securityMetrics.certificateValid ? '✓' : '✗'}
- セキュリティヘッダー: ${result.securityMetrics.securityHeadersPresent ? '✓' : '✗'}
- WAF保護: ${result.securityMetrics.wafProtectionActive ? '✓' : '✗'}
- ブロック攻撃数: ${result.securityMetrics.attacksBlocked}
- 脆弱性発見数: ${result.securityMetrics.vulnerabilitiesFound}

${result.errors && result.errors.length > 0 ? `
**エラー**:
${result.errors.map((error) => `- ${error}`).join('\n')}
` : ''}
`).join('\n')}

## 推奨事項

${summary.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## セキュリティ強化ガイドライン

### 即座対応が必要な項目
${summary.criticalIssues > 0 ? `
- 🚨 ${summary.criticalIssues}件の重要なセキュリティ問題が発見されました
- 詳細な調査と修正を緊急で実施してください
- セキュリティチームへの報告を推奨します
` : '- 現在、緊急対応が必要な問題はありません'}

### 継続的改善項目
- 定期的なセキュリティ監査の実施
- セキュリティパッチの適用
- セキュリティ設定の見直し
- インシデント対応計画の更新

### 監視・運用
- セキュリティログの継続監視
- 異常検出アラートの設定確認
- セキュリティメトリクスの定期レビュー

---
*このレポートは自動生成されました。詳細な分析が必要な場合は、セキュリティチームにご相談ください。*
`;
    await fs.promises.writeFile(outputPath, reportContent);
    console.log(`📄 セキュリティテストレポート生成: ${outputPath}`);
}
/**
 * メイン実行関数
 */
async function main() {
    const options = parseArguments();
    console.log('🔒 セキュリティテスト実行開始');
    console.log(`   環境: ${options.env}`);
    console.log(`   詳細ログ: ${options.verbose ? 'はい' : 'いいえ'}`);
    console.log(`   ドライラン: ${options.dryRun ? 'はい' : 'いいえ'}`);
    console.log('');
    try {
        // 設定の読み込み
        const config = (0, production_config_1.getProductionConfig)(options.env);
        const securityConfig = (0, security_config_1.getSecurityConfig)(options.env);
        // セキュリティ設定の検証
        const validation = (0, security_config_1.validateSecurityConfig)(securityConfig);
        if (!validation.isValid) {
            console.error('❌ セキュリティ設定エラー:', validation.errors.join(', '));
            process.exit(1);
        }
        if (validation.warnings.length > 0) {
            console.warn('⚠️ セキュリティ設定警告:', validation.warnings.join(', '));
        }
        // ドライラン実行
        if (options.dryRun) {
            console.log('🔍 ドライラン実行 - 設定確認のみ');
            console.log('✅ セキュリティ設定は有効です');
            console.log(`📋 実行予定テスト: ${securityConfig.general.executionOrder.join(', ')}`);
            return;
        }
        // テストエンジンの初期化
        const testEngine = new production_test_engine_1.default(config);
        await testEngine.initialize();
        // セキュリティテストランナーの初期化
        const securityRunner = new security_test_runner_1.default(config, testEngine);
        await securityRunner.initialize();
        // 設定表示（詳細モード）
        if (options.verbose) {
            securityRunner.displaySecurityConfig();
        }
        // セキュリティテストの実行
        console.log('🚀 セキュリティテスト実行中...');
        const results = await securityRunner.runSecurityTests();
        // 結果の表示
        if (options.verbose) {
            securityRunner.displaySecuritySummary(results.results);
        }
        // 結果のエクスポート
        if (options.json) {
            await securityRunner.exportSecurityResults(results.results, options.json);
        }
        // レポートの生成
        if (options.report) {
            await generateSecurityReport(results, options.report, config);
        }
        // クリーンアップ
        await securityRunner.cleanup();
        await testEngine.cleanup();
        // 終了ステータスの決定
        if (results.success) {
            console.log('✅ セキュリティテスト実行成功');
            process.exit(0);
        }
        else {
            console.log('❌ セキュリティテスト実行失敗');
            if (results.errors) {
                console.error('エラー詳細:', results.errors.join(', '));
            }
            process.exit(1);
        }
    }
    catch (error) {
        console.error('❌ セキュリティテスト実行エラー:', error);
        if (options.verbose && error instanceof Error) {
            console.error('スタックトレース:', error.stack);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXNlY3VyaXR5LXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLXNlY3VyaXR5LXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7Ozs7Ozs7Ozs7R0FhRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNPYyxnQ0FBZ0I7QUFwT2pDLHlDQUFvQztBQUNwQyxzRUFBdUY7QUFDdkYsK0ZBQXFFO0FBQ3JFLGtGQUF3RDtBQUN4RCx1REFBOEU7QUFDOUUsdUNBQXlCO0FBR3pCOztHQUVHO0FBQ0gsU0FBUyxjQUFjO0lBQ3JCLE1BQU0sT0FBTyxHQUFHLElBQUksbUJBQU8sRUFBRSxDQUFDO0lBRTlCLE9BQU87U0FDSixJQUFJLENBQUMsb0JBQW9CLENBQUM7U0FDMUIsV0FBVyxDQUFDLG9CQUFvQixDQUFDO1NBQ2pDLE9BQU8sQ0FBQyxPQUFPLENBQUM7U0FDaEIsTUFBTSxDQUFDLHlCQUF5QixFQUFFLHlDQUF5QyxFQUFFLFlBQVksQ0FBQztTQUMxRixNQUFNLENBQUMscUJBQXFCLEVBQUUsVUFBVSxFQUFFLDJCQUEyQixDQUFDO1NBQ3RFLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsOEJBQThCLENBQUM7U0FDekUsTUFBTSxDQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDO1NBQ3hDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsc0JBQXNCLEVBQUUsS0FBSyxDQUFDO1NBQ2xELE1BQU0sQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxDQUFDO1NBQ2hELE1BQU0sQ0FBQyxlQUFlLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQztTQUM3QyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxDQUFDO1NBQ3JELE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsS0FBSyxDQUFDO1NBQ2xELE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUUsRUFBRSxDQUFDO1NBQ2xELE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDO1NBQ2xELEtBQUssRUFBRSxDQUFDO0lBRVgsT0FBTyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDeEIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsS0FBSyxVQUFVLHNCQUFzQixDQUNuQyxPQUFZLEVBQ1osVUFBa0IsRUFDbEIsTUFBd0I7SUFFeEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMzQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBRWhDLE1BQU0sYUFBYSxHQUFHOzs7Y0FHVixTQUFTO1lBQ1gsTUFBTSxDQUFDLFdBQVc7Z0JBQ2QsTUFBTSxDQUFDLE1BQU07Ozs7ZUFJZCxPQUFPLENBQUMsVUFBVTtZQUNyQixPQUFPLENBQUMsV0FBVztZQUNuQixPQUFPLENBQUMsV0FBVztjQUNqQixPQUFPLENBQUMsWUFBWTtxQkFDYixDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2VBQ3JELE9BQU8sQ0FBQyxjQUFjOzs7OztFQUtuQyxPQUFPLENBQUMsb0JBQW9CLElBQUksR0FBRztRQUNuQyxDQUFDLENBQUMsaUNBQWlDO1FBQ25DLENBQUMsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLElBQUksR0FBRztZQUNyQyxDQUFDLENBQUMsd0NBQXdDO1lBQzFDLENBQUMsQ0FBQyx5Q0FDSjs7OztFQUlFLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBZ0IsRUFBRSxFQUFFLENBQUM7T0FDNUUsTUFBTSxDQUFDLFFBQVE7ZUFDUCxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU07Y0FDakMsTUFBTSxDQUFDLFFBQVE7bUJBQ1YsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDOzs7YUFHN0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRztXQUNwRCxNQUFNLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7Z0JBQzlDLE1BQU0sQ0FBQyxlQUFlLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRztXQUM5RCxNQUFNLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7YUFDcEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxjQUFjO1lBQ3RDLE1BQU0sQ0FBQyxlQUFlLENBQUMsb0JBQW9COztFQUVyRCxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O0VBRTVDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztDQUM5RCxDQUFDLENBQUMsQ0FBQyxFQUFFO0NBQ0wsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Ozs7RUFJWCxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQVcsRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Ozs7O0VBSzlGLE9BQU8sQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUN4QixPQUFPLENBQUMsY0FBYzs7O0NBRzVCLENBQUMsQ0FBQyxDQUFDLHVCQUF1Qjs7Ozs7Ozs7Ozs7Ozs7O0NBZTFCLENBQUM7SUFFQSxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFFRDs7R0FFRztBQUNILEtBQUssVUFBVSxJQUFJO0lBQ2pCLE1BQU0sT0FBTyxHQUFHLGNBQWMsRUFBRSxDQUFDO0lBRWpDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUMxRCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFaEIsSUFBSSxDQUFDO1FBQ0gsVUFBVTtRQUNWLE1BQU0sTUFBTSxHQUFHLElBQUEsdUNBQW1CLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sY0FBYyxHQUFHLElBQUEsbUNBQWlCLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXRELGNBQWM7UUFDZCxNQUFNLFVBQVUsR0FBRyxJQUFBLHdDQUFzQixFQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzlELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDbkMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxVQUFVO1FBQ1YsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsY0FBYyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMvRSxPQUFPO1FBQ1QsQ0FBQztRQUVELGNBQWM7UUFDZCxNQUFNLFVBQVUsR0FBRyxJQUFJLGdDQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELE1BQU0sVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRTlCLG9CQUFvQjtRQUNwQixNQUFNLGNBQWMsR0FBRyxJQUFJLDhCQUFrQixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNsRSxNQUFNLGNBQWMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUVsQyxjQUFjO1FBQ2QsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsY0FBYyxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDekMsQ0FBQztRQUVELGVBQWU7UUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbEMsTUFBTSxPQUFPLEdBQUcsTUFBTSxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUV4RCxRQUFRO1FBQ1IsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsY0FBYyxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRUQsWUFBWTtRQUNaLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2pCLE1BQU0sY0FBYyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCxVQUFVO1FBQ1YsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbkIsTUFBTSxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsVUFBVTtRQUNWLE1BQU0sY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQy9CLE1BQU0sVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRTNCLGFBQWE7UUFDYixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQixDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMvQixJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQixDQUFDO0lBRUgsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTFDLElBQUksT0FBTyxDQUFDLE9BQU8sSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFLENBQUM7WUFDOUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7QUFDSCxDQUFDO0FBRUQsNkJBQTZCO0FBQzdCLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUM1QixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiB0cy1ub2RlXG5cbi8qKlxuICog44K744Kt44Ol44Oq44OG44Kj44OG44K544OI5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiBcbiAqIOWun+acrOeVqueSsOWig+OBp+OBruOCu+OCreODpeODquODhuOCo+ODhuOCueODiOOCkuWun+ihjFxuICogSFRUUFPmmpflj7fljJbjgIHmlLvmkoPogJDmgKfjgIHjgrvjgq3jg6Xjg6rjg4bjgqPnm6Poppbjga7jg4bjgrnjg4jjgpLljIXmi6znmoTjgavlrp/ooYxcbiAqIFxuICog5L2/55So5L6LOlxuICogbnBtIHJ1biB0ZXN0OnByb2R1Y3Rpb246c2VjdXJpdHlcbiAqIHRzLW5vZGUgcnVuLXNlY3VyaXR5LXRlc3RzLnRzIC0tZW52IHByb2R1Y3Rpb25cbiAqIHRzLW5vZGUgcnVuLXNlY3VyaXR5LXRlc3RzLnRzIC0tZW52IHN0YWdpbmcgLS12ZXJib3NlXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgeyBDb21tYW5kIH0gZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCB7IFByb2R1Y3Rpb25Db25maWcsIGdldFByb2R1Y3Rpb25Db25maWcgfSBmcm9tICcuLi8uLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lIGZyb20gJy4uLy4uL2NvcmUvcHJvZHVjdGlvbi10ZXN0LWVuZ2luZSc7XG5pbXBvcnQgU2VjdXJpdHlUZXN0UnVubmVyIGZyb20gJy4vc2VjdXJpdHktdGVzdC1ydW5uZXInO1xuaW1wb3J0IHsgZ2V0U2VjdXJpdHlDb25maWcsIHZhbGlkYXRlU2VjdXJpdHlDb25maWcgfSBmcm9tICcuL3NlY3VyaXR5LWNvbmZpZyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vKipcbiAqIOOCs+ODnuODs+ODieODqeOCpOODs+W8leaVsOOBruino+aekFxuICovXG5mdW5jdGlvbiBwYXJzZUFyZ3VtZW50cygpIHtcbiAgY29uc3QgcHJvZ3JhbSA9IG5ldyBDb21tYW5kKCk7XG4gIFxuICBwcm9ncmFtXG4gICAgLm5hbWUoJ3J1bi1zZWN1cml0eS10ZXN0cycpXG4gICAgLmRlc2NyaXB0aW9uKCflrp/mnKznlarnkrDlooPjgafjga7jgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jlrp/ooYwnKVxuICAgIC52ZXJzaW9uKCcxLjAuMCcpXG4gICAgLm9wdGlvbignLWUsIC0tZW52IDxlbnZpcm9ubWVudD4nLCAn5a6f6KGM55Kw5aKDIChwcm9kdWN0aW9uLCBzdGFnaW5nLCBkZXZlbG9wbWVudCknLCAncHJvZHVjdGlvbicpXG4gICAgLm9wdGlvbignLXIsIC0tcmVwb3J0IDxwYXRoPicsICfjg6zjg53jg7zjg4jlh7rlipvjg5HjgrknLCAnLi9zZWN1cml0eS10ZXN0LXJlcG9ydC5tZCcpXG4gICAgLm9wdGlvbignLWosIC0tanNvbiA8cGF0aD4nLCAnSlNPTue1kOaenOWHuuWKm+ODkeOCuScsICcuL3NlY3VyaXR5LXRlc3QtcmVzdWx0cy5qc29uJylcbiAgICAub3B0aW9uKCctdiwgLS12ZXJib3NlJywgJ+ips+e0sOODreOCsOWHuuWKmycsIGZhbHNlKVxuICAgIC5vcHRpb24oJy0tZHJ5LXJ1bicsICfjg4njg6njgqTjg6njg7Plrp/ooYzvvIjlrp/pmpvjga7jg4bjgrnjg4jjga/ooYzjgo/jgarjgYTvvIknLCBmYWxzZSlcbiAgICAub3B0aW9uKCctLWh0dHBzLW9ubHknLCAnSFRUUFPmmpflj7fljJbjg4bjgrnjg4jjga7jgb/lrp/ooYwnLCBmYWxzZSlcbiAgICAub3B0aW9uKCctLWF0dGFjay1vbmx5JywgJ+aUu+aSg+iAkOaAp+ODhuOCueODiOOBruOBv+Wun+ihjCcsIGZhbHNlKVxuICAgIC5vcHRpb24oJy0tbW9uaXRvcmluZy1vbmx5JywgJ+OCu+OCreODpeODquODhuOCo+ebo+imluODhuOCueODiOOBruOBv+Wun+ihjCcsIGZhbHNlKVxuICAgIC5vcHRpb24oJy0tc2tpcC1kYW5nZXJvdXMnLCAn5Y2x6Zm644Gq5pS75pKD44OG44K544OI44KS44K544Kt44OD44OXJywgZmFsc2UpXG4gICAgLm9wdGlvbignLS10aW1lb3V0IDxzZWNvbmRzPicsICfjg4bjgrnjg4jjgr/jgqTjg6DjgqLjgqbjg4ggKOenkiknLCAnJylcbiAgICAub3B0aW9uKCctLW5vLWVtZXJnZW5jeS1zdG9wJywgJ+e3iuaApeWBnOatouapn+iDveOCkueEoeWKueWMlicsIGZhbHNlKVxuICAgIC5wYXJzZSgpO1xuXG4gIHJldHVybiBwcm9ncmFtLm9wdHMoKTtcbn1cblxuLyoqXG4gKiDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVTZWN1cml0eVJlcG9ydChcbiAgcmVzdWx0czogYW55LFxuICBvdXRwdXRQYXRoOiBzdHJpbmcsXG4gIGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZ1xuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgY29uc3Qgc3VtbWFyeSA9IHJlc3VsdHMuc3VtbWFyeTtcbiAgXG4gIGNvbnN0IHJlcG9ydENvbnRlbnQgPSBgIyDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjg6zjg53jg7zjg4hcblxuIyMg5a6f6KGM5oOF5aCxXG4tICoq5a6f6KGM5pel5pmCKio6ICR7dGltZXN0YW1wfVxuLSAqKueSsOWigyoqOiAke2NvbmZpZy5lbnZpcm9ubWVudH1cbi0gKirlr77osaHjgrfjgrnjg4bjg6AqKjogJHtjb25maWcucmVnaW9ufSDjg6rjg7zjgrjjg6fjg7Ncbi0gKirjg4bjgrnjg4jlrp/ooYzogIUqKjog6Ieq5YuV44OG44K544OI44K344K544OG44OgXG5cbiMjIOWun+ihjOOCteODnuODquODvFxuLSAqKue3j+ODhuOCueODiOaVsCoqOiAke3N1bW1hcnkudG90YWxUZXN0c31cbi0gKirmiJDlip8qKjogJHtzdW1tYXJ5LnBhc3NlZFRlc3RzfVxuLSAqKuWkseaVlyoqOiAke3N1bW1hcnkuZmFpbGVkVGVzdHN9XG4tICoq44K544Kt44OD44OXKio6ICR7c3VtbWFyeS5za2lwcGVkVGVzdHN9XG4tICoq57eP5ZCI44K744Kt44Ol44Oq44OG44Kj44K544Kz44KiKio6ICR7KHN1bW1hcnkub3ZlcmFsbFNlY3VyaXR5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JVxuLSAqKumHjeimgeOBquWVj+mhjCoqOiAke3N1bW1hcnkuY3JpdGljYWxJc3N1ZXN95Lu2XG5cbiMjIOOCu+OCreODpeODquODhuOCo+ipleS+oVxuXG4jIyMg57eP5ZCI6KmV5L6hXG4ke3N1bW1hcnkub3ZlcmFsbFNlY3VyaXR5U2NvcmUgPj0gMC44IFxuICA/ICfinIUgKirlhKrnp4AqKiAtIOmrmOOBhOOCu+OCreODpeODquODhuOCo+ODrOODmeODq+OBjOeiuuS/neOBleOCjOOBpuOBhOOBvuOBmSdcbiAgOiBzdW1tYXJ5Lm92ZXJhbGxTZWN1cml0eVNjb3JlID49IDAuNlxuICA/ICfimqDvuI8gKiroia/lpb0qKiAtIOOCu+OCreODpeODquODhuOCo+ODrOODmeODq+OBr+iJr+WlveOBp+OBmeOBjOOAgeaUueWWhOOBruS9meWcsOOBjOOBguOCiuOBvuOBmSdcbiAgOiAn4p2MICoq6KaB5pS55ZaEKiogLSDph43opoHjgarjgrvjgq3jg6Xjg6rjg4bjgqPllY/poYzjgYzjgYLjgorjgb7jgZnjgILnt4rmgKXjga7lr77lv5zjgYzlv4XopoHjgafjgZknXG59XG5cbiMjIyDoqbPntLDntZDmnpxcblxuJHtBcnJheS5mcm9tKHJlc3VsdHMucmVzdWx0cy5lbnRyaWVzKCkpLm1hcCgoW3Rlc3ROYW1lLCByZXN1bHRdOiBbc3RyaW5nLCBhbnldKSA9PiBgXG4jIyMjICR7cmVzdWx0LnRlc3ROYW1lfVxuLSAqKuOCueODhuODvOOCv+OCuSoqOiAke3Jlc3VsdC5zdWNjZXNzID8gJ+KchSDmiJDlip8nIDogJ+KdjCDlpLHmlZcnfVxuLSAqKuWun+ihjOaZgumWkyoqOiAke3Jlc3VsdC5kdXJhdGlvbn1tc1xuLSAqKuOCu+OCreODpeODquODhuOCo+OCueOCs+OCoioqOiAkeyhyZXN1bHQuc2VjdXJpdHlNZXRyaWNzLnNlY3VyaXR5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JVxuXG4qKuOCu+OCreODpeODquODhuOCo+ODoeODiOODquOCr+OCuSoqOlxuLSBIVFRQU+a6luaLoDogJHtyZXN1bHQuc2VjdXJpdHlNZXRyaWNzLmh0dHBzQ29tcGxpYW5jZSA/ICfinJMnIDogJ+Kclyd9XG4tIOiovOaYjuabuOacieWKuTogJHtyZXN1bHQuc2VjdXJpdHlNZXRyaWNzLmNlcnRpZmljYXRlVmFsaWQgPyAn4pyTJyA6ICfinJcnfVxuLSDjgrvjgq3jg6Xjg6rjg4bjgqPjg5jjg4Pjg4Djg7w6ICR7cmVzdWx0LnNlY3VyaXR5TWV0cmljcy5zZWN1cml0eUhlYWRlcnNQcmVzZW50ID8gJ+KckycgOiAn4pyXJ31cbi0gV0FG5L+d6K23OiAke3Jlc3VsdC5zZWN1cml0eU1ldHJpY3Mud2FmUHJvdGVjdGlvbkFjdGl2ZSA/ICfinJMnIDogJ+Kclyd9XG4tIOODluODreODg+OCr+aUu+aSg+aVsDogJHtyZXN1bHQuc2VjdXJpdHlNZXRyaWNzLmF0dGFja3NCbG9ja2VkfVxuLSDohIblvLHmgKfnmbropovmlbA6ICR7cmVzdWx0LnNlY3VyaXR5TWV0cmljcy52dWxuZXJhYmlsaXRpZXNGb3VuZH1cblxuJHtyZXN1bHQuZXJyb3JzICYmIHJlc3VsdC5lcnJvcnMubGVuZ3RoID4gMCA/IGBcbioq44Ko44Op44O8Kio6XG4ke3Jlc3VsdC5lcnJvcnMubWFwKChlcnJvcjogc3RyaW5nKSA9PiBgLSAke2Vycm9yfWApLmpvaW4oJ1xcbicpfVxuYCA6ICcnfVxuYCkuam9pbignXFxuJyl9XG5cbiMjIOaOqOWlqOS6i+mghVxuXG4ke3N1bW1hcnkucmVjb21tZW5kYXRpb25zLm1hcCgocmVjOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IGAke2luZGV4ICsgMX0uICR7cmVjfWApLmpvaW4oJ1xcbicpfVxuXG4jIyDjgrvjgq3jg6Xjg6rjg4bjgqPlvLfljJbjgqzjgqTjg4njg6njgqTjg7NcblxuIyMjIOWNs+W6p+WvvuW/nOOBjOW/heimgeOBqumgheebrlxuJHtzdW1tYXJ5LmNyaXRpY2FsSXNzdWVzID4gMCA/IGBcbi0g8J+aqCAke3N1bW1hcnkuY3JpdGljYWxJc3N1ZXN95Lu244Gu6YeN6KaB44Gq44K744Kt44Ol44Oq44OG44Kj5ZWP6aGM44GM55m66KaL44GV44KM44G+44GX44GfXG4tIOips+e0sOOBquiqv+afu+OBqOS/ruato+OCkue3iuaApeOBp+Wun+aWveOBl+OBpuOBj+OBoOOBleOBhFxuLSDjgrvjgq3jg6Xjg6rjg4bjgqPjg4Hjg7zjg6Djgbjjga7loLHlkYrjgpLmjqjlpajjgZfjgb7jgZlcbmAgOiAnLSDnj77lnKjjgIHnt4rmgKXlr77lv5zjgYzlv4XopoHjgarllY/poYzjga/jgYLjgorjgb7jgZvjgpMnfVxuXG4jIyMg57aZ57aa55qE5pS55ZaE6aCF55uuXG4tIOWumuacn+eahOOBquOCu+OCreODpeODquODhuOCo+ebo+afu+OBruWun+aWvVxuLSDjgrvjgq3jg6Xjg6rjg4bjgqPjg5Hjg4Pjg4Hjga7pgannlKhcbi0g44K744Kt44Ol44Oq44OG44Kj6Kit5a6a44Gu6KaL55u044GXXG4tIOOCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOioiOeUu+OBruabtOaWsFxuXG4jIyMg55uj6KaW44O76YGL55SoXG4tIOOCu+OCreODpeODquODhuOCo+ODreOCsOOBrue2mee2muebo+imllxuLSDnlbDluLjmpJzlh7rjgqLjg6njg7zjg4jjga7oqK3lrprnorroqo1cbi0g44K744Kt44Ol44Oq44OG44Kj44Oh44OI44Oq44Kv44K544Gu5a6a5pyf44Os44OT44Ol44O8XG5cbi0tLVxuKuOBk+OBruODrOODneODvOODiOOBr+iHquWLleeUn+aIkOOBleOCjOOBvuOBl+OBn+OAguips+e0sOOBquWIhuaekOOBjOW/heimgeOBquWgtOWQiOOBr+OAgeOCu+OCreODpeODquODhuOCo+ODgeODvOODoOOBq+OBlOebuOirh+OBj+OBoOOBleOBhOOAgipcbmA7XG5cbiAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKG91dHB1dFBhdGgsIHJlcG9ydENvbnRlbnQpO1xuICBjb25zb2xlLmxvZyhg8J+ThCDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjg6zjg53jg7zjg4jnlJ/miJA6ICR7b3V0cHV0UGF0aH1gKTtcbn1cblxuLyoqXG4gKiDjg6HjgqTjg7Plrp/ooYzplqLmlbBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IHBhcnNlQXJndW1lbnRzKCk7XG4gIFxuICBjb25zb2xlLmxvZygn8J+UkiDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jlrp/ooYzplovlp4snKTtcbiAgY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtvcHRpb25zLmVudn1gKTtcbiAgY29uc29sZS5sb2coYCAgIOips+e0sOODreOCsDogJHtvcHRpb25zLnZlcmJvc2UgPyAn44Gv44GEJyA6ICfjgYTjgYTjgYgnfWApO1xuICBjb25zb2xlLmxvZyhgICAg44OJ44Op44Kk44Op44OzOiAke29wdGlvbnMuZHJ5UnVuID8gJ+OBr+OBhCcgOiAn44GE44GE44GIJ31gKTtcbiAgY29uc29sZS5sb2coJycpO1xuXG4gIHRyeSB7XG4gICAgLy8g6Kit5a6a44Gu6Kqt44G/6L6844G/XG4gICAgY29uc3QgY29uZmlnID0gZ2V0UHJvZHVjdGlvbkNvbmZpZyhvcHRpb25zLmVudik7XG4gICAgY29uc3Qgc2VjdXJpdHlDb25maWcgPSBnZXRTZWN1cml0eUNvbmZpZyhvcHRpb25zLmVudik7XG4gICAgXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj6Kit5a6a44Gu5qSc6Ki8XG4gICAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlU2VjdXJpdHlDb25maWcoc2VjdXJpdHlDb25maWcpO1xuICAgIGlmICghdmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44K744Kt44Ol44Oq44OG44Kj6Kit5a6a44Ko44Op44O8OicsIHZhbGlkYXRpb24uZXJyb3JzLmpvaW4oJywgJykpO1xuICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbiAgICBcbiAgICBpZiAodmFsaWRhdGlvbi53YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyDjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrprorablkYo6JywgdmFsaWRhdGlvbi53YXJuaW5ncy5qb2luKCcsICcpKTtcbiAgICB9XG5cbiAgICAvLyDjg4njg6njgqTjg6njg7Plrp/ooYxcbiAgICBpZiAob3B0aW9ucy5kcnlSdW4pIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SNIOODieODqeOCpOODqeODs+Wun+ihjCAtIOioreWumueiuuiqjeOBruOBvycpO1xuICAgICAgY29uc29sZS5sb2coJ+KchSDjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrprjga/mnInlirnjgafjgZknKTtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OLIOWun+ihjOS6iOWumuODhuOCueODiDogJHtzZWN1cml0eUNvbmZpZy5nZW5lcmFsLmV4ZWN1dGlvbk9yZGVyLmpvaW4oJywgJyl9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8g44OG44K544OI44Ko44Oz44K444Oz44Gu5Yid5pyf5YyWXG4gICAgY29uc3QgdGVzdEVuZ2luZSA9IG5ldyBQcm9kdWN0aW9uVGVzdEVuZ2luZShjb25maWcpO1xuICAgIGF3YWl0IHRlc3RFbmdpbmUuaW5pdGlhbGl6ZSgpO1xuXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Op44Oz44OK44O844Gu5Yid5pyf5YyWXG4gICAgY29uc3Qgc2VjdXJpdHlSdW5uZXIgPSBuZXcgU2VjdXJpdHlUZXN0UnVubmVyKGNvbmZpZywgdGVzdEVuZ2luZSk7XG4gICAgYXdhaXQgc2VjdXJpdHlSdW5uZXIuaW5pdGlhbGl6ZSgpO1xuXG4gICAgLy8g6Kit5a6a6KGo56S677yI6Kmz57Sw44Oi44O844OJ77yJXG4gICAgaWYgKG9wdGlvbnMudmVyYm9zZSkge1xuICAgICAgc2VjdXJpdHlSdW5uZXIuZGlzcGxheVNlY3VyaXR5Q29uZmlnKCk7XG4gICAgfVxuXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Gu5a6f6KGMXG4gICAgY29uc29sZS5sb2coJ/CfmoAg44K744Kt44Ol44Oq44OG44Kj44OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHNlY3VyaXR5UnVubmVyLnJ1blNlY3VyaXR5VGVzdHMoKTtcblxuICAgIC8vIOe1kOaenOOBruihqOekulxuICAgIGlmIChvcHRpb25zLnZlcmJvc2UpIHtcbiAgICAgIHNlY3VyaXR5UnVubmVyLmRpc3BsYXlTZWN1cml0eVN1bW1hcnkocmVzdWx0cy5yZXN1bHRzKTtcbiAgICB9XG5cbiAgICAvLyDntZDmnpzjga7jgqjjgq/jgrnjg53jg7zjg4hcbiAgICBpZiAob3B0aW9ucy5qc29uKSB7XG4gICAgICBhd2FpdCBzZWN1cml0eVJ1bm5lci5leHBvcnRTZWN1cml0eVJlc3VsdHMocmVzdWx0cy5yZXN1bHRzLCBvcHRpb25zLmpzb24pO1xuICAgIH1cblxuICAgIC8vIOODrOODneODvOODiOOBrueUn+aIkFxuICAgIGlmIChvcHRpb25zLnJlcG9ydCkge1xuICAgICAgYXdhaXQgZ2VuZXJhdGVTZWN1cml0eVJlcG9ydChyZXN1bHRzLCBvcHRpb25zLnJlcG9ydCwgY29uZmlnKTtcbiAgICB9XG5cbiAgICAvLyDjgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICBhd2FpdCBzZWN1cml0eVJ1bm5lci5jbGVhbnVwKCk7XG4gICAgYXdhaXQgdGVzdEVuZ2luZS5jbGVhbnVwKCk7XG5cbiAgICAvLyDntYLkuobjgrnjg4bjg7zjgr/jgrnjga7msbrlrppcbiAgICBpZiAocmVzdWx0cy5zdWNjZXNzKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pyFIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOWun+ihjOaIkOWKnycpO1xuICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygn4p2MIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOWun+ihjOWkseaVlycpO1xuICAgICAgaWYgKHJlc3VsdHMuZXJyb3JzKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+OCqOODqeODvOips+e0sDonLCByZXN1bHRzLmVycm9ycy5qb2luKCcsICcpKTtcbiAgICAgIH1cbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg44K744Kt44Ol44Oq44OG44Kj44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICBcbiAgICBpZiAob3B0aW9ucy52ZXJib3NlICYmIGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+OCueOCv+ODg+OCr+ODiOODrOODvOOCuTonLCBlcnJvci5zdGFjayk7XG4gICAgfVxuICAgIFxuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxufVxuXG4vLyDjgrnjgq/jg6rjg5fjg4jjgYznm7TmjqXlrp/ooYzjgZXjgozjgZ/loLTlkIjjga7jgb9tYWlu6Zai5pWw44KS5a6f6KGMXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbigpLmNhdGNoKGVycm9yID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCfkuojmnJ/jgZfjgarjgYTjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSk7XG59XG5cbmV4cG9ydCB7IG1haW4gYXMgcnVuU2VjdXJpdHlUZXN0cyB9OyJdfQ==