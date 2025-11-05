#!/usr/bin/env node
"use strict";
/**
 * アクセス権限テスト実行スクリプト
 *
 * 実本番IAM/OpenSearchでのアクセス権限テストを実行
 * コマンドライン引数でテスト設定をカスタマイズ可能
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
const commander_1 = require("commander");
const access_control_test_runner_1 = __importDefault(require("./access-control-test-runner"));
const production_test_engine_1 = __importDefault(require("../../core/production-test-engine"));
const production_config_1 = require("../../config/production-config");
const access_control_config_1 = require("./access-control-config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * アクセス権限テスト実行クラス
 */
class AccessControlTestExecutor {
    options;
    config;
    testEngine;
    testRunner;
    constructor(options) {
        this.options = options;
    }
    /**
     * 初期化
     */
    async initialize() {
        console.log('🚀 アクセス権限テスト実行環境を初期化中...');
        try {
            // 設定の読み込み
            this.config = await this.loadConfiguration();
            // テストエンジンの初期化
            this.testEngine = new production_test_engine_1.default(this.config);
            await this.testEngine.initialize();
            // テストランナーの初期化
            this.testRunner = new access_control_test_runner_1.default(this.config, this.testEngine);
            console.log('✅ 初期化完了');
            if (this.options.verbose) {
                console.log('📋 設定情報:');
                console.log(`   環境: ${this.config.environment}`);
                console.log(`   リージョン: ${this.config.region}`);
                console.log(`   OpenSearchドメイン: ${this.config.resources.openSearchDomain}`);
                console.log(`   読み取り専用モード: ${this.config.readOnlyMode ? 'ON' : 'OFF'}`);
            }
        }
        catch (error) {
            console.error('❌ 初期化エラー:', error);
            throw error;
        }
    }
    /**
     * 設定の読み込み
     */
    async loadConfiguration() {
        let config;
        if (this.options.config) {
            // カスタム設定ファイルの読み込み
            const configPath = path.resolve(this.options.config);
            console.log(`📄 カスタム設定ファイルを読み込み中: ${configPath}`);
            config = await (0, production_config_1.loadProductionConfig)(configPath);
        }
        else {
            // デフォルト設定の読み込み
            console.log('📄 デフォルト設定を読み込み中...');
            config = await (0, production_config_1.loadProductionConfig)();
        }
        // 環境設定の上書き
        if (this.options.environment) {
            config.environment = this.options.environment;
        }
        // アクセス権限テスト固有設定の適用
        const accessControlConfig = (0, access_control_config_1.getAccessControlTestConfig)(config.environment);
        // タイムアウトとリトライ設定の上書き
        if (this.options.timeout) {
            accessControlConfig.execution.timeout = this.options.timeout;
        }
        if (this.options.retries !== undefined) {
            accessControlConfig.execution.retryCount = this.options.retries;
        }
        // 設定をマージ
        config.testConfig = {
            ...config.testConfig,
            accessControl: accessControlConfig
        };
        return config;
    }
    /**
     * アクセス権限テストの実行
     */
    async executeTests() {
        console.log('🔐 アクセス権限テストを実行開始...');
        try {
            if (this.options.dryRun) {
                console.log('🔍 ドライランモード: 実際のテストは実行されません');
                await this.performDryRun();
                return;
            }
            // テストの実行
            const startTime = Date.now();
            const results = await this.testRunner.runAccessControlTests();
            const executionTime = Date.now() - startTime;
            // 結果の表示
            console.log('\\n📊 アクセス権限テスト実行結果:');
            console.log('='.repeat(50));
            console.log(`総実行時間: ${executionTime}ms`);
            console.log(`総テスト数: ${results.summary.totalTests}`);
            console.log(`成功: ${results.summary.passedTests}`);
            console.log(`失敗: ${results.summary.failedTests}`);
            console.log(`スキップ: ${results.summary.skippedTests}`);
            console.log(`成功率: ${(results.summary.successRate * 100).toFixed(1)}%`);
            console.log(`セキュリティスコア: ${(results.summary.securityScore * 100).toFixed(1)}%`);
            // 詳細レポートの生成と保存
            if (this.options.output || results.summary.failedTests > 0) {
                await this.generateAndSaveReport(results.results);
            }
            // 終了コードの設定
            if (!results.success) {
                console.log('\\n❌ 一部のテストが失敗しました');
                process.exit(1);
            }
            else {
                console.log('\\n✅ 全てのアクセス権限テストが成功しました');
            }
        }
        catch (error) {
            console.error('❌ テスト実行エラー:', error);
            process.exit(1);
        }
    }
    /**
     * ドライランの実行
     */
    async performDryRun() {
        console.log('🔍 実行予定のテスト一覧:');
        console.log('-'.repeat(40));
        const testSuite = this.testRunner.createAccessControlTestSuite();
        testSuite.tests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.testName}`);
            console.log(`   ID: ${test.testId}`);
            console.log(`   カテゴリ: ${test.category}`);
            console.log(`   タイムアウト: ${test.timeout}ms`);
            console.log(`   リトライ回数: ${test.retryCount}`);
            console.log(`   説明: ${test.description}`);
            if (test.dependencies && test.dependencies.length > 0) {
                console.log(`   依存関係: ${test.dependencies.join(', ')}`);
            }
            console.log('');
        });
        console.log(`総テスト数: ${testSuite.tests.length}`);
        console.log('並列実行: 無効（順次実行）');
        console.log(`最大同時実行数: ${testSuite.configuration.maxConcurrency}`);
        console.log(`失敗時継続: ${testSuite.configuration.continueOnError ? '有効' : '無効'}`);
    }
    /**
     * レポートの生成と保存
     */
    async generateAndSaveReport(results) {
        console.log('📝 詳細レポートを生成中...');
        try {
            const report = await this.testRunner.generateDetailedReport(results);
            const outputPath = this.options.output ||
                `access-control-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
            await fs.writeFile(outputPath, report, 'utf-8');
            console.log(`✅ 詳細レポートを保存しました: ${outputPath}`);
        }
        catch (error) {
            console.error('❌ レポート生成エラー:', error);
        }
    }
    /**
     * クリーンアップ
     */
    async cleanup() {
        if (this.testRunner) {
            await this.testRunner.cleanup();
        }
    }
}
/**
 * メイン実行関数
 */
async function main() {
    const program = new commander_1.Command();
    program
        .name('execute-access-control-tests')
        .description('実本番IAM/OpenSearchでのアクセス権限テスト実行')
        .version('1.0.0')
        .option('-c, --config <path>', '設定ファイルのパス')
        .option('-e, --environment <env>', '実行環境 (dev, staging, prod)', 'prod')
        .option('-o, --output <path>', 'レポート出力ファイルパス')
        .option('-v, --verbose', '詳細ログの表示', false)
        .option('-d, --dry-run', 'ドライラン（実際のテストは実行しない）', false)
        .option('-t, --test-ids <ids>', '実行するテストIDのカンマ区切りリスト')
        .option('--timeout <ms>', 'テストタイムアウト（ミリ秒）', parseInt)
        .option('--retries <count>', 'リトライ回数', parseInt);
    program.parse();
    const options = program.opts();
    const executor = new AccessControlTestExecutor(options);
    try {
        await executor.initialize();
        await executor.executeTests();
    }
    catch (error) {
        console.error('❌ 実行エラー:', error);
        process.exit(1);
    }
    finally {
        await executor.cleanup();
    }
}
// スクリプトが直接実行された場合のみmain関数を実行
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 予期しないエラー:', error);
        process.exit(1);
    });
}
exports.default = AccessControlTestExecutor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZS1hY2Nlc3MtY29udHJvbC10ZXN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4ZWN1dGUtYWNjZXNzLWNvbnRyb2wtdGVzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7Ozs7Ozs7R0FRRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHlDQUFvQztBQUNwQyw4RkFBbUU7QUFDbkUsK0ZBQXFFO0FBQ3JFLHNFQUF3RjtBQUN4RixtRUFBcUU7QUFDckUsZ0RBQWtDO0FBQ2xDLDJDQUE2QjtBQWdCN0I7O0dBRUc7QUFDSCxNQUFNLHlCQUF5QjtJQUNyQixPQUFPLENBQWlCO0lBQ3hCLE1BQU0sQ0FBbUI7SUFDekIsVUFBVSxDQUF1QjtJQUNqQyxVQUFVLENBQTBCO0lBRTVDLFlBQVksT0FBdUI7UUFDakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDO1lBQ0gsVUFBVTtZQUNWLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUU3QyxjQUFjO1lBQ2QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLGdDQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4RCxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7WUFFbkMsY0FBYztZQUNkLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxvQ0FBdUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU1RSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXZCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO2dCQUM1RSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLENBQUM7UUFFSCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxpQkFBaUI7UUFDN0IsSUFBSSxNQUF3QixDQUFDO1FBRTdCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN4QixrQkFBa0I7WUFDbEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDbEQsTUFBTSxHQUFHLE1BQU0sSUFBQSx3Q0FBb0IsRUFBQyxVQUFVLENBQUMsQ0FBQztRQUNsRCxDQUFDO2FBQU0sQ0FBQztZQUNOLGVBQWU7WUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDbkMsTUFBTSxHQUFHLE1BQU0sSUFBQSx3Q0FBb0IsR0FBRSxDQUFDO1FBQ3hDLENBQUM7UUFFRCxXQUFXO1FBQ1gsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFDaEQsQ0FBQztRQUVELG1CQUFtQjtRQUNuQixNQUFNLG1CQUFtQixHQUFHLElBQUEsa0RBQTBCLEVBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTNFLG9CQUFvQjtRQUNwQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDekIsbUJBQW1CLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUMvRCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN2QyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxTQUFTO1FBQ1QsTUFBTSxDQUFDLFVBQVUsR0FBRztZQUNsQixHQUFHLE1BQU0sQ0FBQyxVQUFVO1lBQ3BCLGFBQWEsRUFBRSxtQkFBbUI7U0FDbkMsQ0FBQztRQUVGLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxZQUFZO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUVwQyxJQUFJLENBQUM7WUFDSCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztnQkFDM0MsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzNCLE9BQU87WUFDVCxDQUFDO1lBRUQsU0FBUztZQUNULE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUM3QixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUM5RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDO1lBRTdDLFFBQVE7WUFDUixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLGFBQWEsSUFBSSxDQUFDLENBQUM7WUFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFL0UsZUFBZTtZQUNmLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzNELE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBRUQsV0FBVztZQUNYLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDbEMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzFDLENBQUM7UUFFSCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxhQUFhO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUU1QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLDRCQUE0QixFQUFFLENBQUM7UUFFakUsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7WUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUUxQyxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUQsQ0FBQztZQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksU0FBUyxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxTQUFTLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUF5QjtRQUMzRCxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFaEMsSUFBSSxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXJFLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtnQkFDcEMsOEJBQThCLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDO1lBRXBGLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWhELE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFFaEQsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7Q0FDRjtBQUVEOztHQUVHO0FBQ0gsS0FBSyxVQUFVLElBQUk7SUFDakIsTUFBTSxPQUFPLEdBQUcsSUFBSSxtQkFBTyxFQUFFLENBQUM7SUFFOUIsT0FBTztTQUNKLElBQUksQ0FBQyw4QkFBOEIsQ0FBQztTQUNwQyxXQUFXLENBQUMsZ0NBQWdDLENBQUM7U0FDN0MsT0FBTyxDQUFDLE9BQU8sQ0FBQztTQUNoQixNQUFNLENBQUMscUJBQXFCLEVBQUUsV0FBVyxDQUFDO1NBQzFDLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBRSxNQUFNLENBQUM7U0FDdEUsTUFBTSxDQUFDLHFCQUFxQixFQUFFLGNBQWMsQ0FBQztTQUM3QyxNQUFNLENBQUMsZUFBZSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUM7U0FDekMsTUFBTSxDQUFDLGVBQWUsRUFBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUM7U0FDckQsTUFBTSxDQUFDLHNCQUFzQixFQUFFLHFCQUFxQixDQUFDO1NBQ3JELE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLENBQUM7U0FDcEQsTUFBTSxDQUFDLG1CQUFtQixFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVuRCxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7SUFFaEIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBa0IsQ0FBQztJQUMvQyxNQUFNLFFBQVEsR0FBRyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXhELElBQUksQ0FBQztRQUNILE1BQU0sUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzVCLE1BQU0sUUFBUSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDO1lBQVMsQ0FBQztRQUNULE1BQU0sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNCLENBQUM7QUFDSCxDQUFDO0FBRUQsNkJBQTZCO0FBQzdCLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUM1QixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxrQkFBZSx5QkFBeUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuLyoqXG4gKiDjgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4jlrp/ooYzjgrnjgq/jg6rjg5fjg4hcbiAqIFxuICog5a6f5pys55WqSUFNL09wZW5TZWFyY2jjgafjga7jgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4jjgpLlrp/ooYxcbiAqIOOCs+ODnuODs+ODieODqeOCpOODs+W8leaVsOOBp+ODhuOCueODiOioreWumuOCkuOCq+OCueOCv+ODnuOCpOOCuuWPr+iDvVxuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0IHsgQ29tbWFuZCB9IGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgQWNjZXNzQ29udHJvbFRlc3RSdW5uZXIgZnJvbSAnLi9hY2Nlc3MtY29udHJvbC10ZXN0LXJ1bm5lcic7XG5pbXBvcnQgUHJvZHVjdGlvblRlc3RFbmdpbmUgZnJvbSAnLi4vLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcbmltcG9ydCB7IFByb2R1Y3Rpb25Db25maWcsIGxvYWRQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCB7IGdldEFjY2Vzc0NvbnRyb2xUZXN0Q29uZmlnIH0gZnJvbSAnLi9hY2Nlc3MtY29udHJvbC1jb25maWcnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLyoqXG4gKiDjgrPjg57jg7Pjg4njg6njgqTjg7PlvJXmlbDjga7lrprnvqlcbiAqL1xuaW50ZXJmYWNlIENvbW1hbmRPcHRpb25zIHtcbiAgY29uZmlnPzogc3RyaW5nO1xuICBlbnZpcm9ubWVudD86IHN0cmluZztcbiAgb3V0cHV0Pzogc3RyaW5nO1xuICB2ZXJib3NlPzogYm9vbGVhbjtcbiAgZHJ5UnVuPzogYm9vbGVhbjtcbiAgdGVzdElkcz86IHN0cmluZztcbiAgdGltZW91dD86IG51bWJlcjtcbiAgcmV0cmllcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiDjgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4jlrp/ooYzjgq/jg6njgrlcbiAqL1xuY2xhc3MgQWNjZXNzQ29udHJvbFRlc3RFeGVjdXRvciB7XG4gIHByaXZhdGUgb3B0aW9uczogQ29tbWFuZE9wdGlvbnM7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIHRlc3RFbmdpbmU6IFByb2R1Y3Rpb25UZXN0RW5naW5lO1xuICBwcml2YXRlIHRlc3RSdW5uZXI6IEFjY2Vzc0NvbnRyb2xUZXN0UnVubmVyO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IENvbW1hbmRPcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiDliJ3mnJ/ljJZcbiAgICovXG4gIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/CfmoAg44Ki44Kv44K744K55qip6ZmQ44OG44K544OI5a6f6KGM55Kw5aKD44KS5Yid5pyf5YyW5LitLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgLy8g6Kit5a6a44Gu6Kqt44G/6L6844G/XG4gICAgICB0aGlzLmNvbmZpZyA9IGF3YWl0IHRoaXMubG9hZENvbmZpZ3VyYXRpb24oKTtcbiAgICAgIFxuICAgICAgLy8g44OG44K544OI44Ko44Oz44K444Oz44Gu5Yid5pyf5YyWXG4gICAgICB0aGlzLnRlc3RFbmdpbmUgPSBuZXcgUHJvZHVjdGlvblRlc3RFbmdpbmUodGhpcy5jb25maWcpO1xuICAgICAgYXdhaXQgdGhpcy50ZXN0RW5naW5lLmluaXRpYWxpemUoKTtcblxuICAgICAgLy8g44OG44K544OI44Op44Oz44OK44O844Gu5Yid5pyf5YyWXG4gICAgICB0aGlzLnRlc3RSdW5uZXIgPSBuZXcgQWNjZXNzQ29udHJvbFRlc3RSdW5uZXIodGhpcy5jb25maWcsIHRoaXMudGVzdEVuZ2luZSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfinIUg5Yid5pyf5YyW5a6M5LqGJyk7XG4gICAgICBcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudmVyYm9zZSkge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+TiyDoqK3lrprmg4XloLE6Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDnkrDlooM6ICR7dGhpcy5jb25maWcuZW52aXJvbm1lbnR9YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDjg6rjg7zjgrjjg6fjg7M6ICR7dGhpcy5jb25maWcucmVnaW9ufWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgT3BlblNlYXJjaOODieODoeOCpOODszogJHt0aGlzLmNvbmZpZy5yZXNvdXJjZXMub3BlblNlYXJjaERvbWFpbn1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOiqreOBv+WPluOCiuWwgueUqOODouODvOODiTogJHt0aGlzLmNvbmZpZy5yZWFkT25seU1vZGUgPyAnT04nIDogJ09GRid9YCk7XG4gICAgICB9XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOWIneacn+WMluOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog6Kit5a6a44Gu6Kqt44G/6L6844G/XG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGxvYWRDb25maWd1cmF0aW9uKCk6IFByb21pc2U8UHJvZHVjdGlvbkNvbmZpZz4ge1xuICAgIGxldCBjb25maWc6IFByb2R1Y3Rpb25Db25maWc7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbmZpZykge1xuICAgICAgLy8g44Kr44K544K/44Og6Kit5a6a44OV44Kh44Kk44Or44Gu6Kqt44G/6L6844G/XG4gICAgICBjb25zdCBjb25maWdQYXRoID0gcGF0aC5yZXNvbHZlKHRoaXMub3B0aW9ucy5jb25maWcpO1xuICAgICAgY29uc29sZS5sb2coYPCfk4Qg44Kr44K544K/44Og6Kit5a6a44OV44Kh44Kk44Or44KS6Kqt44G/6L6844G/5LitOiAke2NvbmZpZ1BhdGh9YCk7XG4gICAgICBjb25maWcgPSBhd2FpdCBsb2FkUHJvZHVjdGlvbkNvbmZpZyhjb25maWdQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8g44OH44OV44Kp44Or44OI6Kit5a6a44Gu6Kqt44G/6L6844G/XG4gICAgICBjb25zb2xlLmxvZygn8J+ThCDjg4fjg5Xjgqnjg6vjg4joqK3lrprjgpLoqq3jgb/ovrzjgb/kuK0uLi4nKTtcbiAgICAgIGNvbmZpZyA9IGF3YWl0IGxvYWRQcm9kdWN0aW9uQ29uZmlnKCk7XG4gICAgfVxuXG4gICAgLy8g55Kw5aKD6Kit5a6a44Gu5LiK5pu444GNXG4gICAgaWYgKHRoaXMub3B0aW9ucy5lbnZpcm9ubWVudCkge1xuICAgICAgY29uZmlnLmVudmlyb25tZW50ID0gdGhpcy5vcHRpb25zLmVudmlyb25tZW50O1xuICAgIH1cblxuICAgIC8vIOOCouOCr+OCu+OCueaoqemZkOODhuOCueODiOWbuuacieioreWumuOBrumBqeeUqFxuICAgIGNvbnN0IGFjY2Vzc0NvbnRyb2xDb25maWcgPSBnZXRBY2Nlc3NDb250cm9sVGVzdENvbmZpZyhjb25maWcuZW52aXJvbm1lbnQpO1xuICAgIFxuICAgIC8vIOOCv+OCpOODoOOCouOCpuODiOOBqOODquODiOODqeOCpOioreWumuOBruS4iuabuOOBjVxuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZW91dCkge1xuICAgICAgYWNjZXNzQ29udHJvbENvbmZpZy5leGVjdXRpb24udGltZW91dCA9IHRoaXMub3B0aW9ucy50aW1lb3V0O1xuICAgIH1cbiAgICBcbiAgICBpZiAodGhpcy5vcHRpb25zLnJldHJpZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYWNjZXNzQ29udHJvbENvbmZpZy5leGVjdXRpb24ucmV0cnlDb3VudCA9IHRoaXMub3B0aW9ucy5yZXRyaWVzO1xuICAgIH1cblxuICAgIC8vIOioreWumuOCkuODnuODvOOCuFxuICAgIGNvbmZpZy50ZXN0Q29uZmlnID0ge1xuICAgICAgLi4uY29uZmlnLnRlc3RDb25maWcsXG4gICAgICBhY2Nlc3NDb250cm9sOiBhY2Nlc3NDb250cm9sQ29uZmlnXG4gICAgfTtcblxuICAgIHJldHVybiBjb25maWc7XG4gIH1cblxuICAvKipcbiAgICog44Ki44Kv44K744K55qip6ZmQ44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBhc3luYyBleGVjdXRlVGVzdHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/CflJAg44Ki44Kv44K744K55qip6ZmQ44OG44K544OI44KS5a6f6KGM6ZaL5aeLLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcnlSdW4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ/CflI0g44OJ44Op44Kk44Op44Oz44Oi44O844OJOiDlrp/pmpvjga7jg4bjgrnjg4jjga/lrp/ooYzjgZXjgozjgb7jgZvjgpMnKTtcbiAgICAgICAgYXdhaXQgdGhpcy5wZXJmb3JtRHJ5UnVuKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8g44OG44K544OI44Gu5a6f6KGMXG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMudGVzdFJ1bm5lci5ydW5BY2Nlc3NDb250cm9sVGVzdHMoKTtcbiAgICAgIGNvbnN0IGV4ZWN1dGlvblRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICAvLyDntZDmnpzjga7ooajnpLpcbiAgICAgIGNvbnNvbGUubG9nKCdcXFxcbvCfk4og44Ki44Kv44K744K55qip6ZmQ44OG44K544OI5a6f6KGM57WQ5p6cOicpO1xuICAgICAgY29uc29sZS5sb2coJz0nLnJlcGVhdCg1MCkpO1xuICAgICAgY29uc29sZS5sb2coYOe3j+Wun+ihjOaZgumWkzogJHtleGVjdXRpb25UaW1lfW1zYCk7XG4gICAgICBjb25zb2xlLmxvZyhg57eP44OG44K544OI5pWwOiAke3Jlc3VsdHMuc3VtbWFyeS50b3RhbFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYOaIkOWKnzogJHtyZXN1bHRzLnN1bW1hcnkucGFzc2VkVGVzdHN9YCk7XG4gICAgICBjb25zb2xlLmxvZyhg5aSx5pWXOiAke3Jlc3VsdHMuc3VtbWFyeS5mYWlsZWRUZXN0c31gKTtcbiAgICAgIGNvbnNvbGUubG9nKGDjgrnjgq3jg4Pjg5c6ICR7cmVzdWx0cy5zdW1tYXJ5LnNraXBwZWRUZXN0c31gKTtcbiAgICAgIGNvbnNvbGUubG9nKGDmiJDlip/njoc6ICR7KHJlc3VsdHMuc3VtbWFyeS5zdWNjZXNzUmF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhg44K744Kt44Ol44Oq44OG44Kj44K544Kz44KiOiAkeyhyZXN1bHRzLnN1bW1hcnkuc2VjdXJpdHlTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG5cbiAgICAgIC8vIOips+e0sOODrOODneODvOODiOOBrueUn+aIkOOBqOS/neWtmFxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdXRwdXQgfHwgcmVzdWx0cy5zdW1tYXJ5LmZhaWxlZFRlc3RzID4gMCkge1xuICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQW5kU2F2ZVJlcG9ydChyZXN1bHRzLnJlc3VsdHMpO1xuICAgICAgfVxuXG4gICAgICAvLyDntYLkuobjgrPjg7zjg4njga7oqK3lrppcbiAgICAgIGlmICghcmVzdWx0cy5zdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXFxcbuKdjCDkuIDpg6jjga7jg4bjgrnjg4jjgYzlpLHmlZfjgZfjgb7jgZfjgZ8nKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcXFxu4pyFIOWFqOOBpuOBruOCouOCr+OCu+OCueaoqemZkOODhuOCueODiOOBjOaIkOWKn+OBl+OBvuOBl+OBnycpO1xuICAgICAgfVxuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjg4njg6njgqTjg6njg7Pjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGVyZm9ybURyeVJ1bigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+UjSDlrp/ooYzkuojlrprjga7jg4bjgrnjg4jkuIDopqc6Jyk7XG4gICAgY29uc29sZS5sb2coJy0nLnJlcGVhdCg0MCkpO1xuXG4gICAgY29uc3QgdGVzdFN1aXRlID0gdGhpcy50ZXN0UnVubmVyLmNyZWF0ZUFjY2Vzc0NvbnRyb2xUZXN0U3VpdGUoKTtcbiAgICBcbiAgICB0ZXN0U3VpdGUudGVzdHMuZm9yRWFjaCgodGVzdCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2luZGV4ICsgMX0uICR7dGVzdC50ZXN0TmFtZX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBJRDogJHt0ZXN0LnRlc3RJZH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDjgqvjg4bjgrTjg6o6ICR7dGVzdC5jYXRlZ29yeX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDjgr/jgqTjg6DjgqLjgqbjg4g6ICR7dGVzdC50aW1lb3V0fW1zYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44Oq44OI44Op44Kk5Zue5pWwOiAke3Rlc3QucmV0cnlDb3VudH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDoqqzmmI46ICR7dGVzdC5kZXNjcmlwdGlvbn1gKTtcbiAgICAgIFxuICAgICAgaWYgKHRlc3QuZGVwZW5kZW5jaWVzICYmIHRlc3QuZGVwZW5kZW5jaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOS+neWtmOmWouS/gjogJHt0ZXN0LmRlcGVuZGVuY2llcy5qb2luKCcsICcpfWApO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZyhg57eP44OG44K544OI5pWwOiAke3Rlc3RTdWl0ZS50ZXN0cy5sZW5ndGh9YCk7XG4gICAgY29uc29sZS5sb2coJ+S4puWIl+Wun+ihjDog54Sh5Yq577yI6aCG5qyh5a6f6KGM77yJJyk7XG4gICAgY29uc29sZS5sb2coYOacgOWkp+WQjOaZguWun+ihjOaVsDogJHt0ZXN0U3VpdGUuY29uZmlndXJhdGlvbi5tYXhDb25jdXJyZW5jeX1gKTtcbiAgICBjb25zb2xlLmxvZyhg5aSx5pWX5pmC57aZ57aaOiAke3Rlc3RTdWl0ZS5jb25maWd1cmF0aW9uLmNvbnRpbnVlT25FcnJvciA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gIH1cblxuICAvKipcbiAgICog44Os44Od44O844OI44Gu55Sf5oiQ44Go5L+d5a2YXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQW5kU2F2ZVJlcG9ydChyZXN1bHRzOiBNYXA8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfk50g6Kmz57Sw44Os44Od44O844OI44KS55Sf5oiQ5LitLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVwb3J0ID0gYXdhaXQgdGhpcy50ZXN0UnVubmVyLmdlbmVyYXRlRGV0YWlsZWRSZXBvcnQocmVzdWx0cyk7XG4gICAgICBcbiAgICAgIGNvbnN0IG91dHB1dFBhdGggPSB0aGlzLm9wdGlvbnMub3V0cHV0IHx8IFxuICAgICAgICBgYWNjZXNzLWNvbnRyb2wtdGVzdC1yZXBvcnQtJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpfS5tZGA7XG4gICAgICBcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShvdXRwdXRQYXRoLCByZXBvcnQsICd1dGYtOCcpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhg4pyFIOips+e0sOODrOODneODvOODiOOCkuS/neWtmOOBl+OBvuOBl+OBnzogJHtvdXRwdXRQYXRofWApO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg6zjg53jg7zjg4jnlJ/miJDjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMudGVzdFJ1bm5lcikge1xuICAgICAgYXdhaXQgdGhpcy50ZXN0UnVubmVyLmNsZWFudXAoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiDjg6HjgqTjg7Plrp/ooYzplqLmlbBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbWFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcHJvZ3JhbSA9IG5ldyBDb21tYW5kKCk7XG5cbiAgcHJvZ3JhbVxuICAgIC5uYW1lKCdleGVjdXRlLWFjY2Vzcy1jb250cm9sLXRlc3RzJylcbiAgICAuZGVzY3JpcHRpb24oJ+Wun+acrOeVqklBTS9PcGVuU2VhcmNo44Gn44Gu44Ki44Kv44K744K55qip6ZmQ44OG44K544OI5a6f6KGMJylcbiAgICAudmVyc2lvbignMS4wLjAnKVxuICAgIC5vcHRpb24oJy1jLCAtLWNvbmZpZyA8cGF0aD4nLCAn6Kit5a6a44OV44Kh44Kk44Or44Gu44OR44K5JylcbiAgICAub3B0aW9uKCctZSwgLS1lbnZpcm9ubWVudCA8ZW52PicsICflrp/ooYznkrDlooMgKGRldiwgc3RhZ2luZywgcHJvZCknLCAncHJvZCcpXG4gICAgLm9wdGlvbignLW8sIC0tb3V0cHV0IDxwYXRoPicsICfjg6zjg53jg7zjg4jlh7rlipvjg5XjgqHjgqTjg6vjg5HjgrknKVxuICAgIC5vcHRpb24oJy12LCAtLXZlcmJvc2UnLCAn6Kmz57Sw44Ot44Kw44Gu6KGo56S6JywgZmFsc2UpXG4gICAgLm9wdGlvbignLWQsIC0tZHJ5LXJ1bicsICfjg4njg6njgqTjg6njg7PvvIjlrp/pmpvjga7jg4bjgrnjg4jjga/lrp/ooYzjgZfjgarjgYTvvIknLCBmYWxzZSlcbiAgICAub3B0aW9uKCctdCwgLS10ZXN0LWlkcyA8aWRzPicsICflrp/ooYzjgZnjgovjg4bjgrnjg4hJROOBruOCq+ODs+ODnuWMuuWIh+OCiuODquOCueODiCcpXG4gICAgLm9wdGlvbignLS10aW1lb3V0IDxtcz4nLCAn44OG44K544OI44K/44Kk44Og44Ki44Km44OI77yI44Of44Oq56eS77yJJywgcGFyc2VJbnQpXG4gICAgLm9wdGlvbignLS1yZXRyaWVzIDxjb3VudD4nLCAn44Oq44OI44Op44Kk5Zue5pWwJywgcGFyc2VJbnQpO1xuXG4gIHByb2dyYW0ucGFyc2UoKTtcblxuICBjb25zdCBvcHRpb25zID0gcHJvZ3JhbS5vcHRzPENvbW1hbmRPcHRpb25zPigpO1xuICBjb25zdCBleGVjdXRvciA9IG5ldyBBY2Nlc3NDb250cm9sVGVzdEV4ZWN1dG9yKG9wdGlvbnMpO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgZXhlY3V0b3IuaW5pdGlhbGl6ZSgpO1xuICAgIGF3YWl0IGV4ZWN1dG9yLmV4ZWN1dGVUZXN0cygpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBhd2FpdCBleGVjdXRvci5jbGVhbnVwKCk7XG4gIH1cbn1cblxuLy8g44K544Kv44Oq44OX44OI44GM55u05o6l5a6f6KGM44GV44KM44Gf5aC05ZCI44Gu44G/bWFpbumWouaVsOOCkuWun+ihjFxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4oKS5jYXRjaChlcnJvciA9PiB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIOS6iOacn+OBl+OBquOBhOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQWNjZXNzQ29udHJvbFRlc3RFeGVjdXRvcjsiXX0=