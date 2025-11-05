#!/usr/bin/env node
"use strict";
/**
 * チャットボット機能テスト実行スクリプト
 *
 * 実本番Amazon Bedrockでのチャットボット機能テストを実行
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
const chatbot_test_runner_1 = __importDefault(require("./chatbot-test-runner"));
const production_test_engine_1 = __importDefault(require("../../core/production-test-engine"));
const production_config_1 = require("../../config/production-config");
const chatbot_config_1 = require("./chatbot-config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * チャットボットテスト実行クラス
 */
class ChatbotTestExecutor {
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
        console.log('🚀 チャットボット機能テスト実行環境を初期化中...');
        try {
            // 設定の読み込み
            this.config = await this.loadConfiguration();
            // テストエンジンの初期化
            this.testEngine = new production_test_engine_1.default(this.config);
            await this.testEngine.initialize();
            // テストランナーの初期化
            this.testRunner = new chatbot_test_runner_1.default(this.config, this.testEngine);
            console.log('✅ 初期化完了');
            if (this.options.verbose) {
                console.log('📋 設定情報:');
                console.log(`   環境: ${this.config.environment}`);
                console.log(`   リージョン: ${this.config.region}`);
                console.log(`   Bedrockエンドポイント: ${this.config.resources.bedrockEndpoint || 'デフォルト'}`);
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
        // チャットボットテスト固有設定の適用
        const chatbotConfig = (0, chatbot_config_1.getChatbotTestConfig)(config.environment);
        // タイムアウトとリトライ設定の上書き
        if (this.options.timeout) {
            chatbotConfig.execution.timeout = this.options.timeout;
        }
        if (this.options.retries !== undefined) {
            chatbotConfig.execution.retryCount = this.options.retries;
        }
        // モデル設定の上書き
        if (this.options.model) {
            chatbotConfig.models.primaryModel = this.options.model;
            chatbotConfig.models.streamingModel = this.options.model;
        }
        // ストリーミングテストのスキップ設定
        if (this.options.skipStreaming) {
            chatbotConfig.streaming.enableStreamingTests = false;
        }
        // 複雑な質問テストのスキップ設定
        if (this.options.skipComplex) {
            chatbotConfig.testQuestions.includeComplexQuestions = false;
        }
        // 設定をマージ
        config.testConfig = {
            ...config.testConfig,
            chatbot: chatbotConfig
        };
        return config;
    }
    /**
     * チャットボット機能テストの実行
     */
    async executeTests() {
        console.log('🤖 チャットボット機能テストを実行開始...');
        try {
            if (this.options.dryRun) {
                console.log('🔍 ドライランモード: 実際のテストは実行されません');
                await this.performDryRun();
                return;
            }
            // テストの実行
            const startTime = Date.now();
            const results = await this.testRunner.runChatbotTests();
            const executionTime = Date.now() - startTime;
            // 結果の表示
            console.log('\\n📊 チャットボット機能テスト実行結果:');
            console.log('='.repeat(60));
            console.log(`総実行時間: ${executionTime}ms`);
            console.log(`総テスト数: ${results.summary.totalTests}`);
            console.log(`成功: ${results.summary.passedTests}`);
            console.log(`失敗: ${results.summary.failedTests}`);
            console.log(`スキップ: ${results.summary.skippedTests}`);
            console.log(`成功率: ${(results.summary.successRate * 100).toFixed(1)}%`);
            console.log(`平均応答時間: ${results.summary.averageResponseTime.toFixed(0)}ms`);
            console.log(`日本語品質スコア: ${(results.summary.japaneseQualityScore * 100).toFixed(1)}%`);
            console.log(`RAG有効性: ${(results.summary.ragEffectiveness * 100).toFixed(1)}%`);
            // 品質評価の表示
            this.displayQualityAssessment(results.summary);
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
                console.log('\\n✅ 全てのチャットボット機能テストが成功しました');
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
        console.log('-'.repeat(50));
        const testSuite = this.testRunner.createChatbotTestSuite();
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
        // 使用予定のBedrockモデル表示
        const chatbotConfig = this.config.testConfig?.chatbot;
        if (chatbotConfig) {
            console.log('\\n🤖 使用予定Bedrockモデル:');
            console.log(`   プライマリ: ${chatbotConfig.models.primaryModel}`);
            console.log(`   ストリーミング: ${chatbotConfig.models.streamingModel}`);
            console.log(`   複雑な質問: ${chatbotConfig.models.complexQuestionModel}`);
        }
    }
    /**
     * 品質評価の表示
     */
    displayQualityAssessment(summary) {
        console.log('\\n🎯 AI品質評価:');
        console.log('-'.repeat(30));
        // 日本語品質評価
        if (summary.japaneseQualityScore >= 0.9) {
            console.log('🟢 日本語品質: 優秀 (90%以上)');
        }
        else if (summary.japaneseQualityScore >= 0.75) {
            console.log('🟡 日本語品質: 良好 (75%以上)');
        }
        else if (summary.japaneseQualityScore >= 0.6) {
            console.log('🟠 日本語品質: 改善推奨 (60%以上)');
        }
        else {
            console.log('🔴 日本語品質: 要改善 (60%未満)');
        }
        // RAG有効性評価
        if (summary.ragEffectiveness >= 0.8) {
            console.log('🟢 RAG機能: 優秀 (80%以上)');
        }
        else if (summary.ragEffectiveness >= 0.6) {
            console.log('🟡 RAG機能: 良好 (60%以上)');
        }
        else if (summary.ragEffectiveness >= 0.4) {
            console.log('🟠 RAG機能: 改善推奨 (40%以上)');
        }
        else {
            console.log('🔴 RAG機能: 要改善 (40%未満)');
        }
        // 応答時間評価
        if (summary.averageResponseTime <= 3000) {
            console.log('🟢 応答時間: 優秀 (3秒以内)');
        }
        else if (summary.averageResponseTime <= 5000) {
            console.log('🟡 応答時間: 良好 (5秒以内)');
        }
        else if (summary.averageResponseTime <= 8000) {
            console.log('🟠 応答時間: 改善推奨 (8秒以内)');
        }
        else {
            console.log('🔴 応答時間: 要改善 (8秒超過)');
        }
    }
    /**
     * レポートの生成と保存
     */
    async generateAndSaveReport(results) {
        console.log('📝 詳細レポートを生成中...');
        try {
            const report = await this.testRunner.generateDetailedReport(results);
            const outputPath = this.options.output ||
                `chatbot-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
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
        .name('execute-chatbot-tests')
        .description('実本番Amazon Bedrockでのチャットボット機能テスト実行')
        .version('1.0.0')
        .option('-c, --config <path>', '設定ファイルのパス')
        .option('-e, --environment <env>', '実行環境 (dev, staging, prod)', 'prod')
        .option('-o, --output <path>', 'レポート出力ファイルパス')
        .option('-v, --verbose', '詳細ログの表示', false)
        .option('-d, --dry-run', 'ドライラン（実際のテストは実行しない）', false)
        .option('-t, --test-ids <ids>', '実行するテストIDのカンマ区切りリスト')
        .option('--timeout <ms>', 'テストタイムアウト（ミリ秒）', parseInt)
        .option('--retries <count>', 'リトライ回数', parseInt)
        .option('--model <model>', '使用するBedrockモデルID')
        .option('--skip-streaming', 'ストリーミングテストをスキップ', false)
        .option('--skip-complex', '複雑な質問テストをスキップ', false);
    program.parse();
    const options = program.opts();
    const executor = new ChatbotTestExecutor(options);
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
exports.default = ChatbotTestExecutor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZS1jaGF0Ym90LXRlc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhlY3V0ZS1jaGF0Ym90LXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx5Q0FBb0M7QUFDcEMsZ0ZBQXNEO0FBQ3RELCtGQUFxRTtBQUNyRSxzRUFBd0Y7QUFDeEYscURBQXdEO0FBQ3hELGdEQUFrQztBQUNsQywyQ0FBNkI7QUFtQjdCOztHQUVHO0FBQ0gsTUFBTSxtQkFBbUI7SUFDZixPQUFPLENBQWlCO0lBQ3hCLE1BQU0sQ0FBbUI7SUFDekIsVUFBVSxDQUF1QjtJQUNqQyxVQUFVLENBQW9CO0lBRXRDLFlBQVksT0FBdUI7UUFDakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFFM0MsSUFBSSxDQUFDO1lBQ0gsVUFBVTtZQUNWLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUU3QyxjQUFjO1lBQ2QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLGdDQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4RCxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7WUFFbkMsY0FBYztZQUNkLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSw2QkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV0RSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXZCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxD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QUUsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXBELE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUVoQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFrQixDQUFDO0lBQy9DLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbEQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDNUIsTUFBTSxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7WUFBUyxDQUFDO1FBQ1QsTUFBTSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDM0IsQ0FBQztBQUNILENBQUM7QUFFRCw2QkFBNkI7QUFDN0IsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzVCLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLG1CQUFtQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqIOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOWun+ihjOOCueOCr+ODquODl+ODiFxuICogXG4gKiDlrp/mnKznlapBbWF6b24gQmVkcm9ja+OBp+OBruODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOOCkuWun+ihjFxuICog44Kz44Oe44Oz44OJ44Op44Kk44Oz5byV5pWw44Gn44OG44K544OI6Kit5a6a44KS44Kr44K544K/44Oe44Kk44K65Y+v6IO9XG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgeyBDb21tYW5kIH0gZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCBDaGF0Ym90VGVzdFJ1bm5lciBmcm9tICcuL2NoYXRib3QtdGVzdC1ydW5uZXInO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lIGZyb20gJy4uLy4uL2NvcmUvcHJvZHVjdGlvbi10ZXN0LWVuZ2luZSc7XG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnLCBsb2FkUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5pbXBvcnQgeyBnZXRDaGF0Ym90VGVzdENvbmZpZyB9IGZyb20gJy4vY2hhdGJvdC1jb25maWcnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLyoqXG4gKiDjgrPjg57jg7Pjg4njg6njgqTjg7PlvJXmlbDjga7lrprnvqlcbiAqL1xuaW50ZXJmYWNlIENvbW1hbmRPcHRpb25zIHtcbiAgY29uZmlnPzogc3RyaW5nO1xuICBlbnZpcm9ubWVudD86IHN0cmluZztcbiAgb3V0cHV0Pzogc3RyaW5nO1xuICB2ZXJib3NlPzogYm9vbGVhbjtcbiAgZHJ5UnVuPzogYm9vbGVhbjtcbiAgdGVzdElkcz86IHN0cmluZztcbiAgdGltZW91dD86IG51bWJlcjtcbiAgcmV0cmllcz86IG51bWJlcjtcbiAgbW9kZWw/OiBzdHJpbmc7XG4gIHNraXBTdHJlYW1pbmc/OiBib29sZWFuO1xuICBza2lwQ29tcGxleD86IGJvb2xlYW47XG59XG5cbi8qKlxuICog44OB44Oj44OD44OI44Oc44OD44OI44OG44K544OI5a6f6KGM44Kv44Op44K5XG4gKi9cbmNsYXNzIENoYXRib3RUZXN0RXhlY3V0b3Ige1xuICBwcml2YXRlIG9wdGlvbnM6IENvbW1hbmRPcHRpb25zO1xuICBwcml2YXRlIGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZztcbiAgcHJpdmF0ZSB0ZXN0RW5naW5lOiBQcm9kdWN0aW9uVGVzdEVuZ2luZTtcbiAgcHJpdmF0ZSB0ZXN0UnVubmVyOiBDaGF0Ym90VGVzdFJ1bm5lcjtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBDb21tYW5kT3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICog5Yid5pyf5YyWXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5qAIOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOWun+ihjOeSsOWig+OCkuWIneacn+WMluS4rS4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIOioreWumuOBruiqreOBv+i+vOOBv1xuICAgICAgdGhpcy5jb25maWcgPSBhd2FpdCB0aGlzLmxvYWRDb25maWd1cmF0aW9uKCk7XG4gICAgICBcbiAgICAgIC8vIOODhuOCueODiOOCqOODs+OCuOODs+OBruWIneacn+WMllxuICAgICAgdGhpcy50ZXN0RW5naW5lID0gbmV3IFByb2R1Y3Rpb25UZXN0RW5naW5lKHRoaXMuY29uZmlnKTtcbiAgICAgIGF3YWl0IHRoaXMudGVzdEVuZ2luZS5pbml0aWFsaXplKCk7XG5cbiAgICAgIC8vIOODhuOCueODiOODqeODs+ODiuODvOOBruWIneacn+WMllxuICAgICAgdGhpcy50ZXN0UnVubmVyID0gbmV3IENoYXRib3RUZXN0UnVubmVyKHRoaXMuY29uZmlnLCB0aGlzLnRlc3RFbmdpbmUpO1xuXG4gICAgICBjb25zb2xlLmxvZygn4pyFIOWIneacn+WMluWujOS6hicpO1xuICAgICAgXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnZlcmJvc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ/Cfk4sg6Kit5a6a5oOF5aCxOicpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg55Kw5aKDOiAke3RoaXMuY29uZmlnLmVudmlyb25tZW50fWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg44Oq44O844K444On44OzOiAke3RoaXMuY29uZmlnLnJlZ2lvbn1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIEJlZHJvY2vjgqjjg7Pjg4njg53jgqTjg7Pjg4g6ICR7dGhpcy5jb25maWcucmVzb3VyY2VzLmJlZHJvY2tFbmRwb2ludCB8fCAn44OH44OV44Kp44Or44OIJ31gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIE9wZW5TZWFyY2jjg4njg6HjgqTjg7M6ICR7dGhpcy5jb25maWcucmVzb3VyY2VzLm9wZW5TZWFyY2hEb21haW59YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDoqq3jgb/lj5bjgorlsILnlKjjg6Ljg7zjg4k6ICR7dGhpcy5jb25maWcucmVhZE9ubHlNb2RlID8gJ09OJyA6ICdPRkYnfWApO1xuICAgICAgfVxuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDliJ3mnJ/ljJbjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOioreWumuOBruiqreOBv+i+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBsb2FkQ29uZmlndXJhdGlvbigpOiBQcm9taXNlPFByb2R1Y3Rpb25Db25maWc+IHtcbiAgICBsZXQgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb25maWcpIHtcbiAgICAgIC8vIOOCq+OCueOCv+ODoOioreWumuODleOCoeOCpOODq+OBruiqreOBv+i+vOOBv1xuICAgICAgY29uc3QgY29uZmlnUGF0aCA9IHBhdGgucmVzb2x2ZSh0aGlzLm9wdGlvbnMuY29uZmlnKTtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OEIOOCq+OCueOCv+ODoOioreWumuODleOCoeOCpOODq+OCkuiqreOBv+i+vOOBv+S4rTogJHtjb25maWdQYXRofWApO1xuICAgICAgY29uZmlnID0gYXdhaXQgbG9hZFByb2R1Y3Rpb25Db25maWcoY29uZmlnUGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIOODh+ODleOCqeODq+ODiOioreWumuOBruiqreOBv+i+vOOBv1xuICAgICAgY29uc29sZS5sb2coJ/Cfk4Qg44OH44OV44Kp44Or44OI6Kit5a6a44KS6Kqt44G/6L6844G/5LitLi4uJyk7XG4gICAgICBjb25maWcgPSBhd2FpdCBsb2FkUHJvZHVjdGlvbkNvbmZpZygpO1xuICAgIH1cblxuICAgIC8vIOeSsOWig+ioreWumuOBruS4iuabuOOBjVxuICAgIGlmICh0aGlzLm9wdGlvbnMuZW52aXJvbm1lbnQpIHtcbiAgICAgIGNvbmZpZy5lbnZpcm9ubWVudCA9IHRoaXMub3B0aW9ucy5lbnZpcm9ubWVudDtcbiAgICB9XG5cbiAgICAvLyDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jjg4bjgrnjg4jlm7rmnInoqK3lrprjga7pgannlKhcbiAgICBjb25zdCBjaGF0Ym90Q29uZmlnID0gZ2V0Q2hhdGJvdFRlc3RDb25maWcoY29uZmlnLmVudmlyb25tZW50KTtcbiAgICBcbiAgICAvLyDjgr/jgqTjg6DjgqLjgqbjg4jjgajjg6rjg4jjg6njgqToqK3lrprjga7kuIrmm7jjgY1cbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVvdXQpIHtcbiAgICAgIGNoYXRib3RDb25maWcuZXhlY3V0aW9uLnRpbWVvdXQgPSB0aGlzLm9wdGlvbnMudGltZW91dDtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXRyaWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNoYXRib3RDb25maWcuZXhlY3V0aW9uLnJldHJ5Q291bnQgPSB0aGlzLm9wdGlvbnMucmV0cmllcztcbiAgICB9XG5cbiAgICAvLyDjg6Ljg4fjg6voqK3lrprjga7kuIrmm7jjgY1cbiAgICBpZiAodGhpcy5vcHRpb25zLm1vZGVsKSB7XG4gICAgICBjaGF0Ym90Q29uZmlnLm1vZGVscy5wcmltYXJ5TW9kZWwgPSB0aGlzLm9wdGlvbnMubW9kZWw7XG4gICAgICBjaGF0Ym90Q29uZmlnLm1vZGVscy5zdHJlYW1pbmdNb2RlbCA9IHRoaXMub3B0aW9ucy5tb2RlbDtcbiAgICB9XG5cbiAgICAvLyDjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4bjgrnjg4jjga7jgrnjgq3jg4Pjg5foqK3lrppcbiAgICBpZiAodGhpcy5vcHRpb25zLnNraXBTdHJlYW1pbmcpIHtcbiAgICAgIGNoYXRib3RDb25maWcuc3RyZWFtaW5nLmVuYWJsZVN0cmVhbWluZ1Rlc3RzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8g6KSH6ZuR44Gq6LOq5ZWP44OG44K544OI44Gu44K544Kt44OD44OX6Kit5a6aXG4gICAgaWYgKHRoaXMub3B0aW9ucy5za2lwQ29tcGxleCkge1xuICAgICAgY2hhdGJvdENvbmZpZy50ZXN0UXVlc3Rpb25zLmluY2x1ZGVDb21wbGV4UXVlc3Rpb25zID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8g6Kit5a6a44KS44Oe44O844K4XG4gICAgY29uZmlnLnRlc3RDb25maWcgPSB7XG4gICAgICAuLi5jb25maWcudGVzdENvbmZpZyxcbiAgICAgIGNoYXRib3Q6IGNoYXRib3RDb25maWdcbiAgICB9O1xuXG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73jg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIGFzeW5jIGV4ZWN1dGVUZXN0cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+kliDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73jg4bjgrnjg4jjgpLlrp/ooYzplovlp4suLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRyeVJ1bikge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+UjSDjg4njg6njgqTjg6njg7Pjg6Ljg7zjg4k6IOWun+mam+OBruODhuOCueODiOOBr+Wun+ihjOOBleOCjOOBvuOBm+OCkycpO1xuICAgICAgICBhd2FpdCB0aGlzLnBlcmZvcm1EcnlSdW4oKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyDjg4bjgrnjg4jjga7lrp/ooYxcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy50ZXN0UnVubmVyLnJ1bkNoYXRib3RUZXN0cygpO1xuICAgICAgY29uc3QgZXhlY3V0aW9uVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIC8vIOe1kOaenOOBruihqOekulxuICAgICAgY29uc29sZS5sb2coJ1xcXFxu8J+TiiDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73jg4bjgrnjg4jlrp/ooYzntZDmnpw6Jyk7XG4gICAgICBjb25zb2xlLmxvZygnPScucmVwZWF0KDYwKSk7XG4gICAgICBjb25zb2xlLmxvZyhg57eP5a6f6KGM5pmC6ZaTOiAke2V4ZWN1dGlvblRpbWV9bXNgKTtcbiAgICAgIGNvbnNvbGUubG9nKGDnt4/jg4bjgrnjg4jmlbA6ICR7cmVzdWx0cy5zdW1tYXJ5LnRvdGFsVGVzdHN9YCk7XG4gICAgICBjb25zb2xlLmxvZyhg5oiQ5YqfOiAke3Jlc3VsdHMuc3VtbWFyeS5wYXNzZWRUZXN0c31gKTtcbiAgICAgIGNvbnNvbGUubG9nKGDlpLHmlZc6ICR7cmVzdWx0cy5zdW1tYXJ5LmZhaWxlZFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYOOCueOCreODg+ODlzogJHtyZXN1bHRzLnN1bW1hcnkuc2tpcHBlZFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYOaIkOWKn+eOhzogJHsocmVzdWx0cy5zdW1tYXJ5LnN1Y2Nlc3NSYXRlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgIGNvbnNvbGUubG9nKGDlubPlnYflv5znrZTmmYLplpM6ICR7cmVzdWx0cy5zdW1tYXJ5LmF2ZXJhZ2VSZXNwb25zZVRpbWUudG9GaXhlZCgwKX1tc2ApO1xuICAgICAgY29uc29sZS5sb2coYOaXpeacrOiqnuWTgeizquOCueOCs+OCojogJHsocmVzdWx0cy5zdW1tYXJ5LmphcGFuZXNlUXVhbGl0eVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgIGNvbnNvbGUubG9nKGBSQUfmnInlirnmgKc6ICR7KHJlc3VsdHMuc3VtbWFyeS5yYWdFZmZlY3RpdmVuZXNzICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcblxuICAgICAgLy8g5ZOB6LOq6KmV5L6h44Gu6KGo56S6XG4gICAgICB0aGlzLmRpc3BsYXlRdWFsaXR5QXNzZXNzbWVudChyZXN1bHRzLnN1bW1hcnkpO1xuXG4gICAgICAvLyDoqbPntLDjg6zjg53jg7zjg4jjga7nlJ/miJDjgajkv53lrZhcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3V0cHV0IHx8IHJlc3VsdHMuc3VtbWFyeS5mYWlsZWRUZXN0cyA+IDApIHtcbiAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUFuZFNhdmVSZXBvcnQocmVzdWx0cy5yZXN1bHRzKTtcbiAgICAgIH1cblxuICAgICAgLy8g57WC5LqG44Kz44O844OJ44Gu6Kit5a6aXG4gICAgICBpZiAoIXJlc3VsdHMuc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxcXG7inYwg5LiA6YOo44Gu44OG44K544OI44GM5aSx5pWX44GX44G+44GX44GfJyk7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXFxcbuKchSDlhajjgabjga7jg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73jg4bjgrnjg4jjgYzmiJDlip/jgZfjgb7jgZfjgZ8nKTtcbiAgICAgIH1cblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44OJ44Op44Kk44Op44Oz44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1EcnlSdW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/CflI0g5a6f6KGM5LqI5a6a44Gu44OG44K544OI5LiA6KanOicpO1xuICAgIGNvbnNvbGUubG9nKCctJy5yZXBlYXQoNTApKTtcblxuICAgIGNvbnN0IHRlc3RTdWl0ZSA9IHRoaXMudGVzdFJ1bm5lci5jcmVhdGVDaGF0Ym90VGVzdFN1aXRlKCk7XG4gICAgXG4gICAgdGVzdFN1aXRlLnRlc3RzLmZvckVhY2goKHRlc3QsIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtpbmRleCArIDF9LiAke3Rlc3QudGVzdE5hbWV9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgSUQ6ICR7dGVzdC50ZXN0SWR9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44Kr44OG44K044OqOiAke3Rlc3QuY2F0ZWdvcnl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44K/44Kk44Og44Ki44Km44OIOiAke3Rlc3QudGltZW91dH1tc2ApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOODquODiOODqeOCpOWbnuaVsDogJHt0ZXN0LnJldHJ5Q291bnR9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg6Kqs5piOOiAke3Rlc3QuZGVzY3JpcHRpb259YCk7XG4gICAgICBcbiAgICAgIGlmICh0ZXN0LmRlcGVuZGVuY2llcyAmJiB0ZXN0LmRlcGVuZGVuY2llcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDkvp3lrZjplqLkv4I6ICR7dGVzdC5kZXBlbmRlbmNpZXMuam9pbignLCAnKX1gKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJycpO1xuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coYOe3j+ODhuOCueODiOaVsDogJHt0ZXN0U3VpdGUudGVzdHMubGVuZ3RofWApO1xuICAgIGNvbnNvbGUubG9nKCfkuKbliJflrp/ooYw6IOeEoeWKue+8iOmghuasoeWun+ihjO+8iScpO1xuICAgIGNvbnNvbGUubG9nKGDmnIDlpKflkIzmmYLlrp/ooYzmlbA6ICR7dGVzdFN1aXRlLmNvbmZpZ3VyYXRpb24ubWF4Q29uY3VycmVuY3l9YCk7XG4gICAgY29uc29sZS5sb2coYOWkseaVl+aZgue2mee2mjogJHt0ZXN0U3VpdGUuY29uZmlndXJhdGlvbi5jb250aW51ZU9uRXJyb3IgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuXG4gICAgLy8g5L2/55So5LqI5a6a44GuQmVkcm9ja+ODouODh+ODq+ihqOekulxuICAgIGNvbnN0IGNoYXRib3RDb25maWcgPSB0aGlzLmNvbmZpZy50ZXN0Q29uZmlnPy5jaGF0Ym90O1xuICAgIGlmIChjaGF0Ym90Q29uZmlnKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxcXG7wn6SWIOS9v+eUqOS6iOWumkJlZHJvY2vjg6Ljg4fjg6s6Jyk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44OX44Op44Kk44Oe44OqOiAke2NoYXRib3RDb25maWcubW9kZWxzLnByaW1hcnlNb2RlbH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDjgrnjg4jjg6rjg7zjg5/jg7PjgrA6ICR7Y2hhdGJvdENvbmZpZy5tb2RlbHMuc3RyZWFtaW5nTW9kZWx9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg6KSH6ZuR44Gq6LOq5ZWPOiAke2NoYXRib3RDb25maWcubW9kZWxzLmNvbXBsZXhRdWVzdGlvbk1vZGVsfWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlk4Hos6roqZXkvqHjga7ooajnpLpcbiAgICovXG4gIHByaXZhdGUgZGlzcGxheVF1YWxpdHlBc3Nlc3NtZW50KHN1bW1hcnk6IGFueSk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKCdcXFxcbvCfjq8gQUnlk4Hos6roqZXkvqE6Jyk7XG4gICAgY29uc29sZS5sb2coJy0nLnJlcGVhdCgzMCkpO1xuXG4gICAgLy8g5pel5pys6Kqe5ZOB6LOq6KmV5L6hXG4gICAgaWYgKHN1bW1hcnkuamFwYW5lc2VRdWFsaXR5U2NvcmUgPj0gMC45KSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+foiDml6XmnKzoqp7lk4Hos6o6IOWEquengCAoOTAl5Lul5LiKKScpO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5qYXBhbmVzZVF1YWxpdHlTY29yZSA+PSAwLjc1KSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+foSDml6XmnKzoqp7lk4Hos6o6IOiJr+WlvSAoNzUl5Lul5LiKKScpO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5qYXBhbmVzZVF1YWxpdHlTY29yZSA+PSAwLjYpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5+gIOaXpeacrOiqnuWTgeizqjog5pS55ZaE5o6o5aWoICg2MCXku6XkuIopJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5S0IOaXpeacrOiqnuWTgeizqjog6KaB5pS55ZaEICg2MCXmnKrmuoApJyk7XG4gICAgfVxuXG4gICAgLy8gUkFH5pyJ5Yq55oCn6KmV5L6hXG4gICAgaWYgKHN1bW1hcnkucmFnRWZmZWN0aXZlbmVzcyA+PSAwLjgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5+iIFJBR+apn+iDvTog5YSq56eAICg4MCXku6XkuIopJyk7XG4gICAgfSBlbHNlIGlmIChzdW1tYXJ5LnJhZ0VmZmVjdGl2ZW5lc3MgPj0gMC42KSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+foSBSQUfmqZ/og706IOiJr+WlvSAoNjAl5Lul5LiKKScpO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5yYWdFZmZlY3RpdmVuZXNzID49IDAuNCkge1xuICAgICAgY29uc29sZS5sb2coJ/Cfn6AgUkFH5qmf6IO9OiDmlLnlloTmjqjlpaggKDQwJeS7peS4iiknKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJ/CflLQgUkFH5qmf6IO9OiDopoHmlLnlloQgKDQwJeacqua6gCknKTtcbiAgICB9XG5cbiAgICAvLyDlv5znrZTmmYLplpPoqZXkvqFcbiAgICBpZiAoc3VtbWFyeS5hdmVyYWdlUmVzcG9uc2VUaW1lIDw9IDMwMDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5+iIOW/nOetlOaZgumWkzog5YSq56eAICgz56eS5Lul5YaFKScpO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5hdmVyYWdlUmVzcG9uc2VUaW1lIDw9IDUwMDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5+hIOW/nOetlOaZgumWkzog6Imv5aW9ICg156eS5Lul5YaFKScpO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5hdmVyYWdlUmVzcG9uc2VUaW1lIDw9IDgwMDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5+gIOW/nOetlOaZgumWkzog5pS55ZaE5o6o5aWoICg456eS5Lul5YaFKScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+UtCDlv5znrZTmmYLplpM6IOimgeaUueWWhCAoOOenkui2hemBjiknKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44Os44Od44O844OI44Gu55Sf5oiQ44Go5L+d5a2YXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQW5kU2F2ZVJlcG9ydChyZXN1bHRzOiBNYXA8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfk50g6Kmz57Sw44Os44Od44O844OI44KS55Sf5oiQ5LitLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVwb3J0ID0gYXdhaXQgdGhpcy50ZXN0UnVubmVyLmdlbmVyYXRlRGV0YWlsZWRSZXBvcnQocmVzdWx0cyk7XG4gICAgICBcbiAgICAgIGNvbnN0IG91dHB1dFBhdGggPSB0aGlzLm9wdGlvbnMub3V0cHV0IHx8IFxuICAgICAgICBgY2hhdGJvdC10ZXN0LXJlcG9ydC0ke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyl9Lm1kYDtcbiAgICAgIFxuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKG91dHB1dFBhdGgsIHJlcG9ydCwgJ3V0Zi04Jyk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGDinIUg6Kmz57Sw44Os44Od44O844OI44KS5L+d5a2Y44GX44G+44GX44GfOiAke291dHB1dFBhdGh9YCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOODrOODneODvOODiOeUn+aIkOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOOCr+ODquODvOODs+OCouODg+ODl1xuICAgKi9cbiAgYXN5bmMgY2xlYW51cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy50ZXN0UnVubmVyKSB7XG4gICAgICBhd2FpdCB0aGlzLnRlc3RSdW5uZXIuY2xlYW51cCgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIOODoeOCpOODs+Wun+ihjOmWouaVsFxuICovXG5hc3luYyBmdW5jdGlvbiBtYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBwcm9ncmFtID0gbmV3IENvbW1hbmQoKTtcblxuICBwcm9ncmFtXG4gICAgLm5hbWUoJ2V4ZWN1dGUtY2hhdGJvdC10ZXN0cycpXG4gICAgLmRlc2NyaXB0aW9uKCflrp/mnKznlapBbWF6b24gQmVkcm9ja+OBp+OBruODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOWun+ihjCcpXG4gICAgLnZlcnNpb24oJzEuMC4wJylcbiAgICAub3B0aW9uKCctYywgLS1jb25maWcgPHBhdGg+JywgJ+ioreWumuODleOCoeOCpOODq+OBruODkeOCuScpXG4gICAgLm9wdGlvbignLWUsIC0tZW52aXJvbm1lbnQgPGVudj4nLCAn5a6f6KGM55Kw5aKDIChkZXYsIHN0YWdpbmcsIHByb2QpJywgJ3Byb2QnKVxuICAgIC5vcHRpb24oJy1vLCAtLW91dHB1dCA8cGF0aD4nLCAn44Os44Od44O844OI5Ye65Yqb44OV44Kh44Kk44Or44OR44K5JylcbiAgICAub3B0aW9uKCctdiwgLS12ZXJib3NlJywgJ+ips+e0sOODreOCsOOBruihqOekuicsIGZhbHNlKVxuICAgIC5vcHRpb24oJy1kLCAtLWRyeS1ydW4nLCAn44OJ44Op44Kk44Op44Oz77yI5a6f6Zqb44Gu44OG44K544OI44Gv5a6f6KGM44GX44Gq44GE77yJJywgZmFsc2UpXG4gICAgLm9wdGlvbignLXQsIC0tdGVzdC1pZHMgPGlkcz4nLCAn5a6f6KGM44GZ44KL44OG44K544OISUTjga7jgqvjg7Pjg57ljLrliIfjgorjg6rjgrnjg4gnKVxuICAgIC5vcHRpb24oJy0tdGltZW91dCA8bXM+JywgJ+ODhuOCueODiOOCv+OCpOODoOOCouOCpuODiO+8iOODn+ODquenku+8iScsIHBhcnNlSW50KVxuICAgIC5vcHRpb24oJy0tcmV0cmllcyA8Y291bnQ+JywgJ+ODquODiOODqeOCpOWbnuaVsCcsIHBhcnNlSW50KVxuICAgIC5vcHRpb24oJy0tbW9kZWwgPG1vZGVsPicsICfkvb/nlKjjgZnjgotCZWRyb2Nr44Oi44OH44OrSUQnKVxuICAgIC5vcHRpb24oJy0tc2tpcC1zdHJlYW1pbmcnLCAn44K544OI44Oq44O844Of44Oz44Kw44OG44K544OI44KS44K544Kt44OD44OXJywgZmFsc2UpXG4gICAgLm9wdGlvbignLS1za2lwLWNvbXBsZXgnLCAn6KSH6ZuR44Gq6LOq5ZWP44OG44K544OI44KS44K544Kt44OD44OXJywgZmFsc2UpO1xuXG4gIHByb2dyYW0ucGFyc2UoKTtcblxuICBjb25zdCBvcHRpb25zID0gcHJvZ3JhbS5vcHRzPENvbW1hbmRPcHRpb25zPigpO1xuICBjb25zdCBleGVjdXRvciA9IG5ldyBDaGF0Ym90VGVzdEV4ZWN1dG9yKG9wdGlvbnMpO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgZXhlY3V0b3IuaW5pdGlhbGl6ZSgpO1xuICAgIGF3YWl0IGV4ZWN1dG9yLmV4ZWN1dGVUZXN0cygpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBhd2FpdCBleGVjdXRvci5jbGVhbnVwKCk7XG4gIH1cbn1cblxuLy8g44K544Kv44Oq44OX44OI44GM55u05o6l5a6f6KGM44GV44KM44Gf5aC05ZCI44Gu44G/bWFpbumWouaVsOOCkuWun+ihjFxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIG1haW4oKS5jYXRjaChlcnJvciA9PiB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIOS6iOacn+OBl+OBquOBhOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQ2hhdGJvdFRlc3RFeGVjdXRvcjsiXX0=