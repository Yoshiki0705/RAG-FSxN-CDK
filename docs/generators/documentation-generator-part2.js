"use strict";
/**
 * ドキュメント生成システム - Part 2
 * テストレポートと運用ガイドの生成機能
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
exports.DocumentationGeneratorPart2 = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const documentation_generator_1 = require("./documentation-generator");
/**
 * ドキュメント生成設定定数
 */
const DOCUMENTATION_CONSTANTS = {
    DEFAULT_FILE_MODE: 0o755,
    MAX_PROJECT_NAME_LENGTH: 100,
    MIN_PROJECT_NAME_LENGTH: 3,
    SUPPORTED_FORMATS: ['markdown', 'html', 'pdf'],
    DIRECTORY_STRUCTURE: {
        API: 'api',
        ARCHITECTURE: 'architecture',
        TESTS: 'tests',
        OPERATIONS: 'operations',
        ASSETS: 'assets'
    },
    VALIDATION: {
        MAX_PATH_LENGTH: 260,
        ALLOWED_FILE_EXTENSIONS: ['.md', '.html', '.json', '.pdf'],
        DANGEROUS_PATH_PATTERNS: [
            /\.\./, // パストラバーサル
            /~/, // ホームディレクトリ参照
            /\0/, // ヌル文字
            /[<>:"|?*]/, // 無効なファイル名文字
            /^\/+/, // 絶対パス
            /\\+/ // バックスラッシュ
        ]
    },
    ERROR_MESSAGES: {
        INVALID_PROJECT_NAME: 'プロジェクト名が無効です',
        PATH_TOO_LONG: 'パスが長すぎます',
        DANGEROUS_PATH: '不正なパスパターンが検出されました',
        DIRECTORY_CREATION_FAILED: 'ディレクトリ作成に失敗しました'
    }
};
class DocumentationGeneratorPart2 extends documentation_generator_1.DocumentationGenerator {
    /**
     * Part2固有の設定オプション
     */
    extendedOptions;
    constructor(config) {
        super(config);
        // Part2固有の設定初期化
        this.extendedOptions = {
            enableDetailedReports: true,
            enableTrendAnalysis: true,
            maxReportHistory: 30 // 30日分の履歴を保持
        };
        this.validateExtendedConfiguration();
    }
    /**
     * Part2固有の設定検証
     */
    validateExtendedConfiguration() {
        // 拡張機能の設定検証
        if (this.extendedOptions.maxReportHistory < 1) {
            throw new Error('レポート履歴の保持期間は1日以上である必要があります');
        }
    }
    /**
     * メインREADMEの生成
     */
    generateMainReadme() {
        return `# ${this.config.projectName}

## 📋 概要

Permission-aware RAG System は、Amazon FSx for NetApp ONTAP と Amazon Bedrock を組み合わせた、エンタープライズグレードの RAG（Retrieval-Augmented Generation）システムです。

### 主な特徴

- **権限ベースアクセス制御**: ユーザー固有の文書アクセス権限管理
- **サーバーレスアーキテクチャ**: AWS Lambda + CloudFront 配信
- **レスポンシブUI**: Next.js + React + Tailwind CSS
- **高精度検索**: OpenSearch Serverless ベクトル検索
- **高性能ストレージ**: FSx for NetApp ONTAP
- **マルチリージョン対応**: 環境変数による柔軟な設定

## 🚀 クイックスタート

### 前提条件

- Node.js 20.x 以上
- AWS CLI 設定済み
- AWS CDK v2 インストール済み

### インストール

\`\`\`bash
# リポジトリのクローン
git clone <repository-url>
cd Permission-aware-RAG-FSxN-CDK

# 依存関係のインストール
npm install

# CDK のブートストラップ
npx cdk bootstrap
\`\`\`

### デプロイ

\`\`\`bash
# 開発環境へのデプロイ
npm run deploy:dev

# 本番環境へのデプロイ
npm run deploy:prod
\`\`\`

## 📖 ドキュメント

- [API ドキュメント](./api/README.md)
- [アーキテクチャ](./architecture/README.md)
- [テストレポート](./tests/README.md)
- [運用ガイド](./operations/README.md)

## 🧪 テスト

\`\`\`bash
# 全テストの実行
npm test

# 統合テストの実行
npm run test:integration

# E2Eテストの実行
npm run test:e2e
\`\`\`

## 📊 監視

システムの監視とアラートについては、[監視ガイド](./operations/monitoring.md) を参照してください。

## 🔧 トラブルシューティング

問題が発生した場合は、[トラブルシューティングガイド](./operations/troubleshooting.md) を参照してください。

## 📝 ライセンス

このプロジェクトは ISC ライセンスの下で提供されています。

## 🤝 貢献

プロジェクトへの貢献を歓迎します。詳細は CONTRIBUTING.md を参照してください。
`;
    }
    /**
     * 全ドキュメントの生成（拡張版）
     */
    async generateAllDocumentation() {
        console.log('📚 拡張ドキュメント生成を開始...');
        try {
            // 基底クラスの生成処理を実行
            await super.generateAllDocumentation();
            // Part2固有の追加処理
            await this.generateExtendedDocumentation();
            console.log('🎉 拡張ドキュメント生成完了');
        }
        catch (error) {
            console.error('❌ ドキュメント生成エラー:', error);
            throw error;
        }
    }
    /**
     * Part2固有の拡張ドキュメント生成（並列処理最適化）
     */
    async generateExtendedDocumentation() {
        const tasks = [];
        // 並列実行可能なタスクを配列に追加
        if (this.config.generateTestReports) {
            tasks.push({
                name: '詳細テストレポート',
                task: this.generateDetailedTestReports()
            });
        }
        if (this.config.generateOperationalGuides) {
            tasks.push({
                name: '拡張運用ガイド',
                task: this.generateExtendedOperationalGuides()
            });
        }
        // メインREADMEの生成（他のタスクと並列実行可能）
        tasks.push({
            name: 'メインREADME',
            task: this.generateAndWriteMainReadme()
        });
        // 全てのタスクを並列実行（エラーハンドリング付き）
        if (tasks.length > 0) {
            const results = await Promise.allSettled(tasks.map(({ task }) => task));
            // 結果の確認とログ出力
            results.forEach((result, index) => {
                const taskName = tasks[index].name;
                if (result.status === 'fulfilled') {
                    console.log(`   ✅ ${taskName}生成完了`);
                }
                else {
                    console.error(`   ❌ ${taskName}生成失敗:`, result.reason);
                    throw new Error(`${taskName}の生成に失敗しました: ${result.reason}`);
                }
            });
        }
    }
    /**
     * メインREADMEの生成と書き込み
     */
    async generateAndWriteMainReadme() {
        const mainReadme = this.generateMainReadme();
        await this.writeFile('README.md', mainReadme);
    }
    /**
     * ディレクトリの存在確認と作成（セキュリティ対策付き）
     */
    async ensureDirectoryExists(dirPath) {
        try {
            // パストラバーサル攻撃を防ぐためのパス検証
            const resolvedPath = path.resolve(dirPath);
            const projectRoot = process.cwd();
            if (!resolvedPath.startsWith(projectRoot)) {
                throw new Error(`不正なパスが検出されました: ${dirPath}`);
            }
            if (!fs.existsSync(resolvedPath)) {
                fs.mkdirSync(resolvedPath, { recursive: true, mode: 0o755 });
                console.log(`   📁 ディレクトリ作成: ${resolvedPath}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ ディレクトリ作成エラー: ${errorMessage}`);
            throw new Error(`ディレクトリ作成に失敗しました: ${dirPath}`);
        }
    }
    /**
     * 設定値の包括的検証
     */
    validateConfiguration() {
        this.validateProjectName();
        this.validateOutputDirectory();
        this.validateFormats();
    }
    /**
     * プロジェクト名の検証
     */
    validateProjectName() {
        const { projectName } = this.config;
        if (!projectName || typeof projectName !== 'string') {
            throw new Error(DOCUMENTATION_CONSTANTS.ERROR_MESSAGES.INVALID_PROJECT_NAME + ': 未設定');
        }
        const trimmedName = projectName.trim();
        if (trimmedName.length === 0) {
            throw new Error(DOCUMENTATION_CONSTANTS.ERROR_MESSAGES.INVALID_PROJECT_NAME + ': 空文字');
        }
        if (trimmedName.length < DOCUMENTATION_CONSTANTS.MIN_PROJECT_NAME_LENGTH) {
            throw new Error(`プロジェクト名が短すぎます（最小${DOCUMENTATION_CONSTANTS.MIN_PROJECT_NAME_LENGTH}文字）`);
        }
        if (trimmedName.length > DOCUMENTATION_CONSTANTS.MAX_PROJECT_NAME_LENGTH) {
            throw new Error(`プロジェクト名が長すぎます（最大${DOCUMENTATION_CONSTANTS.MAX_PROJECT_NAME_LENGTH}文字）`);
        }
        // 安全な文字のみ許可（日本語も含む）
        if (!/^[a-zA-Z0-9\s\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(trimmedName)) {
            throw new Error(DOCUMENTATION_CONSTANTS.ERROR_MESSAGES.INVALID_PROJECT_NAME + ': 不正な文字が含まれています');
        }
    }
    /**
     * 出力ディレクトリの検証
     */
    validateOutputDirectory() {
        const { outputDirectory } = this.config;
        if (!outputDirectory || typeof outputDirectory !== 'string') {
            throw new Error('出力ディレクトリが設定されていません');
        }
        // 危険なパスパターンの検証
        for (const pattern of DOCUMENTATION_CONSTANTS.VALIDATION.DANGEROUS_PATH_PATTERNS) {
            if (pattern.test(outputDirectory)) {
                throw new Error(`${DOCUMENTATION_CONSTANTS.ERROR_MESSAGES.DANGEROUS_PATH}: ${outputDirectory}`);
            }
        }
    }
    /**
     * フォーマット設定の検証
     */
    validateFormats() {
        const { formats } = this.config;
        if (!Array.isArray(formats) || formats.length === 0) {
            throw new Error('出力フォーマットが設定されていません');
        }
        const invalidFormats = formats.filter(format => !DOCUMENTATION_CONSTANTS.SUPPORTED_FORMATS.includes(format));
        if (invalidFormats.length > 0) {
            throw new Error(`サポートされていないフォーマット: ${invalidFormats.join(', ')}`);
        }
    }
    /**
     * HTMLエスケープ処理（XSS対策）
     */
    escapeHtml(text) {
        const htmlEscapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'/]/g, (match) => htmlEscapeMap[match] || match);
    }
    /**
     * 詳細テストレポートの生成（エラーハンドリング強化版）
     */
    async generateDetailedTestReports() {
        try {
            console.log('   📊 テスト結果を収集中...');
            const testReports = await this.collectTestReportsExtended();
            if (testReports.length === 0) {
                console.warn('   ⚠️ テストレポートが見つかりませんでした');
                return;
            }
            console.log(`   📝 ${testReports.length}件のテストレポートを処理中...`);
            // 並列処理でレポート生成を高速化
            const reportTasks = [];
            // 統合テストレポートの生成
            reportTasks.push(this.generateAndWriteIntegratedReport(testReports));
            // テストスイート別レポートの生成
            reportTasks.push(this.generateAndWriteSuiteReports(testReports));
            // テスト履歴の生成
            reportTasks.push(this.generateAndWriteHistoryReport(testReports));
            // 全てのレポート生成タスクを並列実行
            await Promise.all(reportTasks);
            console.log(`   ✅ テストレポート生成完了 (${testReports.length}件)`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`   ❌ テストレポート生成エラー: ${errorMessage}`);
            throw new Error(`テストレポートの生成に失敗しました: ${errorMessage}`);
        }
    }
    /**
     * 統合テストレポートの生成と書き込み
     */
    async generateAndWriteIntegratedReport(testReports) {
        const integratedReport = this.generateIntegratedTestReport(testReports);
        await this.writeFile('tests/integrated-test-report.md', integratedReport);
    }
    /**
     * テストスイート別レポートの生成と書き込み
     */
    async generateAndWriteSuiteReports(testReports) {
        const suiteReportTasks = testReports.map(async (report) => {
            const suiteReport = this.generateTestSuiteReport(report);
            await this.writeFile(`tests/${report.environment}-${report.testRunId}.md`, suiteReport);
        });
        await Promise.all(suiteReportTasks);
    }
    /**
     * テスト履歴レポートの生成と書き込み
     */
    async generateAndWriteHistoryReport(testReports) {
        const historyReport = this.generateTestHistoryReport(testReports);
        await this.writeFile('tests/test-history.md', historyReport);
    }
    /**
     * テストレポートの収集（Part2実装）
     */
    async collectTestReportsExtended() {
        // 実際の実装では、テスト結果ファイルやデータベースから収集
        return [
            {
                testRunId: 'integrated-test-1703123456789',
                timestamp: new Date('2024-12-21T10:30:00Z'),
                environment: 'production',
                summary: {
                    totalTests: 148,
                    passedTests: 142,
                    failedTests: 6,
                    skippedTests: 0,
                    overallScore: 88.5
                },
                suiteResults: [
                    {
                        suiteName: 'security',
                        success: true,
                        score: 92.3,
                        duration: 1245000,
                        testCount: 45,
                        details: {
                            encryptionTests: 15,
                            authenticationTests: 20,
                            vulnerabilityTests: 10
                        }
                    },
                    {
                        suiteName: 'performance',
                        success: true,
                        score: 85.7,
                        duration: 2100000,
                        testCount: 23,
                        details: {
                            loadTests: 10,
                            scalabilityTests: 8,
                            uptimeTests: 5
                        }
                    },
                    {
                        suiteName: 'functional',
                        success: false,
                        score: 87.5,
                        duration: 1800000,
                        testCount: 80,
                        details: {
                            uiTests: 25,
                            apiTests: 40,
                            integrationTests: 15
                        }
                    }
                ],
                recommendations: [
                    'ファイルアップロード機能の修正が必要です',
                    'データベースクエリの最適化を推奨します',
                    'セキュリティヘッダーの設定を確認してください'
                ]
            },
            {
                testRunId: 'integrated-test-1703037056789',
                timestamp: new Date('2024-12-20T10:30:00Z'),
                environment: 'staging',
                summary: {
                    totalTests: 156,
                    passedTests: 148,
                    failedTests: 8,
                    skippedTests: 0,
                    overallScore: 91.2
                },
                suiteResults: [
                    {
                        suiteName: 'security',
                        success: true,
                        score: 94.1,
                        duration: 1180000,
                        testCount: 48,
                        details: {
                            encryptionTests: 16,
                            authenticationTests: 22,
                            vulnerabilityTests: 10
                        }
                    },
                    {
                        suiteName: 'performance',
                        success: true,
                        score: 89.3,
                        duration: 2400000,
                        testCount: 28,
                        details: {
                            loadTests: 12,
                            scalabilityTests: 10,
                            uptimeTests: 6
                        }
                    },
                    {
                        suiteName: 'functional',
                        success: true,
                        score: 90.0,
                        duration: 1650000,
                        testCount: 80,
                        details: {
                            uiTests: 25,
                            apiTests: 40,
                            integrationTests: 15
                        }
                    }
                ],
                recommendations: [
                    'パフォーマンス最適化の継続実施',
                    'セキュリティ監視の強化',
                    'テストカバレッジの向上'
                ]
            }
        ];
    }
    /**
     * 統合テストレポートの生成
     */
    generateIntegratedTestReport(reports) {
        const latestReport = reports[0];
        let markdown = `# 統合テストレポート\n\n`;
        markdown += `**プロジェクト:** ${this.config.projectName}\n`;
        markdown += `**最終実行:** ${latestReport.timestamp.toLocaleString('ja-JP')}\n`;
        markdown += `**環境:** ${latestReport.environment}\n`;
        markdown += `**テスト実行ID:** ${latestReport.testRunId}\n\n`;
        // サマリー
        markdown += '## 📊 テスト結果サマリー\n\n';
        markdown += `- **総合スコア:** ${latestReport.summary.overallScore.toFixed(1)}/100\n`;
        markdown += `- **総テスト数:** ${latestReport.summary.totalTests}\n`;
        markdown += `- **成功:** ${latestReport.summary.passedTests} (${((latestReport.summary.passedTests / latestReport.summary.totalTests) * 100).toFixed(1)}%)\n`;
        markdown += `- **失敗:** ${latestReport.summary.failedTests} (${((latestReport.summary.failedTests / latestReport.summary.totalTests) * 100).toFixed(1)}%)\n`;
        markdown += `- **スキップ:** ${latestReport.summary.skippedTests}\n\n`;
        // スコア評価
        const scoreEmoji = latestReport.summary.overallScore >= 90 ? '🟢' :
            latestReport.summary.overallScore >= 80 ? '🟡' :
                latestReport.summary.overallScore >= 70 ? '🟠' : '🔴';
        markdown += `**評価:** ${scoreEmoji} `;
        if (latestReport.summary.overallScore >= 90) {
            markdown += '優秀 - システムは高い品質を維持しています\n\n';
        }
        else if (latestReport.summary.overallScore >= 80) {
            markdown += '良好 - 軽微な改善により品質向上が期待できます\n\n';
        }
        else if (latestReport.summary.overallScore >= 70) {
            markdown += '注意 - 改善が必要な領域があります\n\n';
        }
        else {
            markdown += '警告 - 重要な問題があります\n\n';
        }
        // テストスイート別結果
        markdown += '## 🔍 テストスイート別結果\n\n';
        markdown += '| スイート | 結果 | スコア | 実行時間 | テスト数 |\n';
        markdown += '|----------|------|--------|----------|----------|\n';
        latestReport.suiteResults.forEach(suite => {
            const status = suite.success ? '✅' : '❌';
            const duration = (suite.duration / 1000).toFixed(1);
            markdown += `| ${suite.suiteName} | ${status} | ${suite.score.toFixed(1)}/100 | ${duration}s | ${suite.testCount} |\n`;
        });
        markdown += '\n';
        // 推奨事項
        if (latestReport.recommendations.length > 0) {
            markdown += '## 💡 推奨事項\n\n';
            latestReport.recommendations.forEach((rec, index) => {
                markdown += `${index + 1}. ${rec}\n`;
            });
            markdown += '\n';
        }
        // トレンド分析
        if (reports.length > 1) {
            markdown += '## 📈 トレンド分析\n\n';
            markdown += this.generateTrendAnalysis(reports);
        }
        return markdown;
    }
    /**
     * テストスイート別レポートの生成
     */
    generateTestSuiteReport(report) {
        let markdown = `# テストレポート - ${report.environment}\n\n`;
        markdown += `**実行日時:** ${report.timestamp.toLocaleString('ja-JP')}\n`;
        markdown += `**テスト実行ID:** ${report.testRunId}\n\n`;
        report.suiteResults.forEach(suite => {
            markdown += `## ${suite.suiteName} テストスイート\n\n`;
            markdown += `- **結果:** ${suite.success ? '✅ 成功' : '❌ 失敗'}\n`;
            markdown += `- **スコア:** ${suite.score.toFixed(1)}/100\n`;
            markdown += `- **実行時間:** ${(suite.duration / 1000).toFixed(1)}秒\n`;
            markdown += `- **テスト数:** ${suite.testCount}\n\n`;
            if (suite.details) {
                markdown += '### 詳細結果\n\n';
                Object.entries(suite.details).forEach(([key, value]) => {
                    markdown += `- **${key}:** ${value}\n`;
                });
                markdown += '\n';
            }
        });
        return markdown;
    }
    /**
     * テスト履歴レポートの生成
     */
    generateTestHistoryReport(reports) {
        let markdown = `# テスト実行履歴\n\n`;
        markdown += `**期間:** ${reports[reports.length - 1].timestamp.toLocaleDateString('ja-JP')} - ${reports[0].timestamp.toLocaleDateString('ja-JP')}\n`;
        markdown += `**総実行回数:** ${reports.length}\n\n`;
        // 履歴テーブル
        markdown += '## 📅 実行履歴\n\n';
        markdown += '| 日時 | 環境 | 総合スコア | 成功率 | 実行時間 |\n';
        markdown += '|------|------|------------|--------|----------|\n';
        reports.forEach(report => {
            const successRate = ((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1);
            const totalDuration = report.suiteResults.reduce((sum, suite) => sum + suite.duration, 0);
            const durationMinutes = (totalDuration / 1000 / 60).toFixed(1);
            markdown += `| ${report.timestamp.toLocaleString('ja-JP')} | ${report.environment} | ${report.summary.overallScore.toFixed(1)} | ${successRate}% | ${durationMinutes}分 |\n`;
        });
        markdown += '\n';
        return markdown;
    }
    /**
     * トレンド分析の生成
     */
    generateTrendAnalysis(reports) {
        let analysis = '';
        if (reports.length >= 2) {
            const latest = reports[0];
            const previous = reports[1];
            const scoreDiff = latest.summary.overallScore - previous.summary.overallScore;
            const successRateDiff = (latest.summary.passedTests / latest.summary.totalTests) -
                (previous.summary.passedTests / previous.summary.totalTests);
            analysis += `前回実行との比較:\n`;
            analysis += `- **スコア変化:** ${scoreDiff >= 0 ? '+' : ''}${scoreDiff.toFixed(1)}ポイント ${scoreDiff >= 0 ? '📈' : '📉'}\n`;
            analysis += `- **成功率変化:** ${successRateDiff >= 0 ? '+' : ''}${(successRateDiff * 100).toFixed(1)}% ${successRateDiff >= 0 ? '📈' : '📉'}\n\n`;
            if (scoreDiff > 5) {
                analysis += '🎉 品質が大幅に向上しています！\n\n';
            }
            else if (scoreDiff > 0) {
                analysis += '✅ 品質が向上しています。\n\n';
            }
            else if (scoreDiff < -5) {
                analysis += '⚠️ 品質が大幅に低下しています。要調査。\n\n';
            }
            else if (scoreDiff < 0) {
                analysis += '📉 品質がやや低下しています。\n\n';
            }
            else {
                analysis += '➡️ 品質は安定しています。\n\n';
            }
        }
        return analysis;
    }
    /**
     * 拡張運用ガイドの生成
     */
    async generateExtendedOperationalGuides() {
        // デプロイメントガイド
        const deploymentGuide = this.generateDeploymentGuideExtended();
        await this.writeFile('operations/deployment-guide.md', deploymentGuide);
        // トラブルシューティングガイド
        const troubleshootingGuide = this.generateTroubleshootingGuideExtended();
        await this.writeFile('operations/troubleshooting.md', troubleshootingGuide);
        // 運用チェックリスト
        const operationalChecklist = this.generateOperationalChecklist();
        await this.writeFile('operations/checklist.md', operationalChecklist);
        // 監視・アラート設定ガイド
        const monitoringGuide = this.generateMonitoringGuideExtended();
        await this.writeFile('operations/monitoring.md', monitoringGuide);
        console.log('   ✅ 運用ガイド生成完了');
    }
    /**
     * トラブルシューティングガイドの生成（Part2実装）
     */
    generateTroubleshootingGuideExtended() {
        return `# トラブルシューティングガイド

## 🚨 よくある問題と解決方法

### デプロイメント関連

#### CDKデプロイエラー
**症状**: \`cdk deploy\` 実行時にエラーが発生
**原因**: 権限不足、リソース制限、設定ミス
**解決方法**:
\`\`\`bash
# 1. 権限確認
aws sts get-caller-identity

# 2. CDKブートストラップ確認
npx cdk bootstrap --show-template

# 3. 差分確認
npx cdk diff
\`\`\`

#### Lambda関数エラー
**症状**: Lambda関数が正常に動作しない
**原因**: 依存関係、環境変数、タイムアウト設定
**解決方法**:
\`\`\`bash
# ログ確認
aws logs tail /aws/lambda/function-name --follow

# 環境変数確認
aws lambda get-function-configuration --function-name function-name
\`\`\`

### 認証関連

#### ログイン失敗
**症状**: ユーザーがログインできない
**原因**: Cognito設定、認証情報の不整合
**解決方法**:
\`\`\`bash
# Cognitoユーザープール確認
aws cognito-idp list-users --user-pool-id your-pool-id

# ユーザー状態確認
aws cognito-idp admin-get-user --user-pool-id your-pool-id --username testuser
\`\`\`

### パフォーマンス関連

#### 応答速度低下
**症状**: APIレスポンスが遅い
**原因**: Lambda冷却、DynamoDB制限、OpenSearch負荷
**解決方法**:
\`\`\`bash
# CloudWatchメトリクス確認
aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Duration

# DynamoDBメトリクス確認
aws cloudwatch get-metric-statistics --namespace AWS/DynamoDB --metric-name ConsumedReadCapacityUnits
\`\`\`

## 🔧 診断コマンド

### システム全体の健全性チェック
\`\`\`bash
#!/bin/bash
echo "=== システム診断開始 ==="

# Lambda関数状態
echo "Lambda関数状態:"
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, \`rag-\`)].{Name:FunctionName,State:State,Runtime:Runtime}'

# DynamoDBテーブル状態
echo "DynamoDBテーブル状態:"
aws dynamodb list-tables --query 'TableNames[?starts_with(@, \`rag-\`)]'

# CloudFront配信状態
echo "CloudFront配信状態:"
aws cloudfront list-distributions --query 'DistributionList.Items[].{Id:Id,Status:Status,DomainName:DomainName}'

echo "=== 診断完了 ==="
\`\`\`

## 📞 エスカレーション手順

### レベル1: 自動復旧
1. ヘルスチェック実行
2. 自動再起動
3. ログ収集

### レベル2: 手動対応
1. 技術チーム通知
2. 詳細調査開始
3. 一時的な回避策実施

### レベル3: 緊急対応
1. オンコール担当者招集
2. 緊急ロールバック実行
3. 顧客通知

## 📋 連絡先

- **技術サポート**: tech-support@example.com
- **緊急連絡**: emergency@example.com
- **オンコール**: +81-XX-XXXX-XXXX
`;
    }
    /**
     * 運用チェックリストの生成
     */
    generateOperationalChecklist() {
        return `# 運用チェックリスト

## 📋 日次チェック項目

### システム監視
- [ ] CloudWatchアラーム状態確認
- [ ] Lambda関数エラー率確認
- [ ] DynamoDB使用量確認
- [ ] OpenSearchクラスター状態確認
- [ ] CloudFront配信状態確認

### セキュリティ
- [ ] WAFブロック状況確認
- [ ] 不正アクセス試行確認
- [ ] SSL証明書有効期限確認
- [ ] IAMポリシー変更確認

### パフォーマンス
- [ ] API応答時間確認
- [ ] エラー率確認
- [ ] スループット確認
- [ ] リソース使用率確認

## 📅 週次チェック項目

### バックアップ
- [ ] データバックアップ状態確認
- [ ] バックアップ復旧テスト実施
- [ ] ログローテーション確認

### 容量管理
- [ ] ストレージ使用量確認
- [ ] データベース容量確認
- [ ] ログ容量確認

### セキュリティ
- [ ] セキュリティパッチ適用状況確認
- [ ] 脆弱性スキャン実施
- [ ] アクセスログ分析

## 📆 月次チェック項目

### コスト管理
- [ ] AWS利用料金確認
- [ ] コスト最適化機会確認
- [ ] 予算アラート設定確認

### 災害復旧
- [ ] 災害復旧手順確認
- [ ] 復旧テスト実施
- [ ] 手順書更新

### コンプライアンス
- [ ] 監査ログ確認
- [ ] コンプライアンス要件確認
- [ ] ドキュメント更新

## ⚠️ 緊急時対応

### インシデント発生時
1. [ ] インシデント記録開始
2. [ ] 影響範囲特定
3. [ ] 関係者通知
4. [ ] 応急処置実施
5. [ ] 根本原因調査
6. [ ] 恒久対策実施
7. [ ] 事後レビュー実施

### 連絡体制
- **レベル1**: 運用チーム
- **レベル2**: 技術リーダー
- **レベル3**: 管理職・顧客
`;
    }
    /**
     * 監視・アラート設定ガイドの生成（Part2実装）
     */
    generateMonitoringGuideExtended() {
        return `# 監視・アラート設定ガイド

## 📊 監視対象メトリクス

### Lambda関数
- **Duration**: 実行時間
- **Errors**: エラー数
- **Throttles**: スロットリング数
- **Invocations**: 実行回数

### DynamoDB
- **ConsumedReadCapacityUnits**: 読み込み容量使用量
- **ConsumedWriteCapacityUnits**: 書き込み容量使用量
- **ThrottledRequests**: スロットリングされたリクエスト数

### OpenSearch
- **ClusterStatus**: クラスター状態
- **SearchLatency**: 検索レイテンシ
- **IndexingLatency**: インデックス作成レイテンシ

### CloudFront
- **Requests**: リクエスト数
- **BytesDownloaded**: ダウンロードバイト数
- **4xxErrorRate**: 4xxエラー率
- **5xxErrorRate**: 5xxエラー率

## 🚨 アラート設定

### 重要度: Critical
- Lambda関数エラー率 > 5%
- DynamoDBスロットリング発生
- OpenSearchクラスターダウン
- CloudFront 5xxエラー率 > 1%

### 重要度: Warning
- Lambda関数実行時間 > 10秒
- DynamoDB容量使用率 > 80%
- OpenSearch検索レイテンシ > 1秒
- CloudFront 4xxエラー率 > 5%

### 重要度: Info
- 新規ユーザー登録
- 大量データアップロード
- 異常なトラフィック増加

## 📈 ダッシュボード設定

### メインダッシュボード
- システム全体の健全性
- 主要メトリクスの時系列グラフ
- アラート状況一覧

### 詳細ダッシュボード
- サービス別詳細メトリクス
- エラーログ分析
- パフォーマンス分析

## 🔔 通知設定

### 通知チャネル
- **Email**: 重要なアラート
- **Slack**: 日常的な通知
- **SMS**: 緊急時のみ

### 通知ルール
- **平日 9-18時**: 全アラート通知
- **夜間・休日**: Criticalのみ通知
- **メンテナンス時**: 通知停止

## 📋 監視手順

### 日次監視
1. ダッシュボード確認
2. アラート状況確認
3. 異常値の調査
4. 必要に応じて対応

### 週次レビュー
1. トレンド分析
2. 容量計画見直し
3. アラート閾値調整
4. 監視項目追加検討

### 月次レポート
1. 可用性レポート作成
2. パフォーマンス分析
3. 改善提案作成
4. 監視体制見直し
`;
    }
    /**
     * デプロイメントガイドの生成（Part2実装）
     */
    generateDeploymentGuideExtended() {
        return `# デプロイメントガイド

## 🚀 概要

Permission-aware RAG System の段階的デプロイメント手順を説明します。

## 📋 前提条件

### 必要なツール
- AWS CLI v2.x
- Node.js 20.x
- AWS CDK v2.x
- Docker

### 必要な権限
- AdministratorAccess または以下の権限:
  - CloudFormation
  - Lambda
  - DynamoDB
  - OpenSearch
  - FSx
  - Cognito
  - CloudFront
  - WAF

## 🔧 環境設定

### 1. AWS認証情報の設定

\`\`\`bash
# AWS CLIの設定
aws configure

# または環境変数での設定
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
\`\`\`

### 2. 環境変数の設定

\`\`\`bash
# 必須環境変数
export PROJECT_NAME=rag-system
export ENVIRONMENT=production
export DOMAIN_NAME=your-domain.com
export CERTIFICATE_ARN=arn:aws:acm:...
export HOSTED_ZONE_ID=Z1234567890ABC
\`\`\`

## 📦 段階的デプロイメント

### Phase 1: インフラストラクチャ

\`\`\`bash
# 1. 依存関係のインストール
npm install

# 2. CDKブートストラップ（初回のみ）
npx cdk bootstrap

# 3. ネットワーキングスタックのデプロイ
npx cdk deploy NetworkingStack

# 4. セキュリティスタックのデプロイ
npx cdk deploy SecurityStack

# 5. データスタックのデプロイ
npx cdk deploy DataStack
\`\`\`

### Phase 2: アプリケーション

\`\`\`bash
# 1. コンピュートスタックのデプロイ
npx cdk deploy ComputeStack

# 2. WebAppスタックのデプロイ
npx cdk deploy WebAppStack

# 3. オペレーションスタックのデプロイ
npx cdk deploy OperationsStack
\`\`\`

### Phase 3: 検証

\`\`\`bash
# 1. 統合テストの実行
npm run test:integrated

# 2. ヘルスチェック
curl https://your-domain.com/api/health

# 3. 機能テスト
npm run test:functional
\`\`\`

## 🔄 ロールバック手順

### 緊急ロールバック

\`\`\`bash
# 1. 前のバージョンのタグを確認
git tag -l

# 2. 前のバージョンにチェックアウト
git checkout v1.0.0

# 3. 緊急デプロイ
npx cdk deploy --all --require-approval never
\`\`\`

### 段階的ロールバック

\`\`\`bash
# 1. WebAppスタックのロールバック
npx cdk deploy WebAppStack --previous-parameters

# 2. 動作確認
curl https://your-domain.com/api/health

# 3. 問題が解決しない場合は他のスタックもロールバック
npx cdk deploy ComputeStack --previous-parameters
\`\`\`

## 📊 デプロイメント後の確認

### 1. サービス状態確認

\`\`\`bash
# Lambda関数の状態確認
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, \`rag-\`)].{Name:FunctionName,State:State}'

# DynamoDBテーブルの状態確認
aws dynamodb list-tables --query 'TableNames[?starts_with(@, \`rag-\`)]'

# OpenSearchドメインの状態確認
aws opensearch list-domain-names --query 'DomainNames[?starts_with(DomainName, \`rag-\`)].DomainName'
\`\`\`

### 2. エンドポイント確認

\`\`\`bash
# ヘルスチェック
curl -f https://your-domain.com/api/health

# 認証エンドポイント
curl -X POST https://your-domain.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"testuser","password":"testpass"}'

# チャットエンドポイント（認証後）
curl -X POST https://your-domain.com/api/chat \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Hello"}'
\`\`\`

## ⚠️ 注意事項

### セキュリティ
- 本番環境では必ずHTTPS通信を使用
- WAFルールが適切に設定されていることを確認
- 認証が正常に動作することを確認

### パフォーマンス
- Lambda関数のコールドスタート時間を監視
- DynamoDBの読み書きキャパシティを監視
- OpenSearchのクエリパフォーマンスを監視

### コスト
- 不要なリソースが作成されていないか確認
- 予想コストと実際のコストを比較
- コストアラートが設定されていることを確認

## 🆘 緊急時の連絡先

- **技術サポート**: tech-support@example.com
- **運用チーム**: operations@example.com
- **オンコール**: +81-XX-XXXX-XXXX
`;
    }
    /**
     * インデックスページの生成
     */
    async generateIndexPage() {
        const indexContent = `# ${this.config.projectName} ドキュメント

バージョン: ${this.config.version}  
生成日時: ${new Date().toLocaleString('ja-JP')}

## 📚 ドキュメント一覧

### API ドキュメント
- [API リファレンス](./api/README.md)
- [OpenAPI 仕様](./api/openapi.json)
${this.config.formats.includes('html') ? '- [API ドキュメント (HTML)](./api/index.html)' : ''}

### アーキテクチャ
- [システムアーキテクチャ](./architecture/README.md)
- [アーキテクチャ図](./architecture/system-architecture.md)

### テストレポート
- [統合テストレポート](./tests/integrated-test-report.md)
- [テスト履歴](./tests/test-history.md)

### 運用ガイド
- [デプロイメントガイド](./operations/deployment-guide.md)
- [トラブルシューティング](./operations/troubleshooting.md)
- [運用チェックリスト](./operations/checklist.md)
- [監視・アラート設定](./operations/monitoring.md)

## 🔗 関連リンク

- [プロジェクトリポジトリ](https://github.com/your-org/permission-aware-rag)
- [本番環境](https://your-domain.com)
- [ステージング環境](https://staging.your-domain.com)

---

このドキュメントは自動生成されています。  
最終更新: ${new Date().toLocaleString('ja-JP')}
`;
        await this.writeFile('README.md', indexContent);
    }
}
exports.DocumentationGeneratorPart2 = DocumentationGeneratorPart2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRhdGlvbi1nZW5lcmF0b3ItcGFydDIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2N1bWVudGF0aW9uLWdlbmVyYXRvci1wYXJ0Mi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsdUVBQW9HO0FBRXBHOztHQUVHO0FBQ0gsTUFBTSx1QkFBdUIsR0FBRztJQUM5QixpQkFBaUIsRUFBRSxLQUFLO0lBQ3hCLHVCQUF1QixFQUFFLEdBQUc7SUFDNUIsdUJBQXVCLEVBQUUsQ0FBQztJQUMxQixpQkFBaUIsRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFVO0lBQ3ZELG1CQUFtQixFQUFFO1FBQ25CLEdBQUcsRUFBRSxLQUFLO1FBQ1YsWUFBWSxFQUFFLGNBQWM7UUFDNUIsS0FBSyxFQUFFLE9BQU87UUFDZCxVQUFVLEVBQUUsWUFBWTtRQUN4QixNQUFNLEVBQUUsUUFBUTtLQUNqQjtJQUNELFVBQVUsRUFBRTtRQUNWLGVBQWUsRUFBRSxHQUFHO1FBQ3BCLHVCQUF1QixFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQzFELHVCQUF1QixFQUFFO1lBQ3ZCLE1BQU0sRUFBWSxXQUFXO1lBQzdCLEdBQUcsRUFBZSxjQUFjO1lBQ2hDLElBQUksRUFBYyxPQUFPO1lBQ3pCLFdBQVcsRUFBTyxhQUFhO1lBQy9CLE1BQU0sRUFBWSxPQUFPO1lBQ3pCLEtBQUssQ0FBYSxXQUFXO1NBQzlCO0tBQ0Y7SUFDRCxjQUFjLEVBQUU7UUFDZCxvQkFBb0IsRUFBRSxjQUFjO1FBQ3BDLGFBQWEsRUFBRSxVQUFVO1FBQ3pCLGNBQWMsRUFBRSxtQkFBbUI7UUFDbkMseUJBQXlCLEVBQUUsaUJBQWlCO0tBQzdDO0NBQ08sQ0FBQztBQVFYLE1BQWEsMkJBQTRCLFNBQVEsZ0RB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O0lBQ0ssK0JBQStCO1FBQ3JDLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3RlYsQ0FBQztJQUNBLENBQUM7SUFFRDs7T0FFRztJQUNLLCtCQUErQjtRQUNyQyxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvTFYsQ0FBQztJQUNBLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxpQkFBaUI7UUFDckIsTUFBTSxZQUFZLEdBQUcsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVc7O1NBRTVDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztRQUNwQixJQUFJLElBQUksRUFBRSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUM7Ozs7Ozs7RUFPeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDLENBQUMsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQXlCL0UsSUFBSSxJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO0NBQ3pDLENBQUM7UUFFRSxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FDRjtBQTdxQ0Qsa0VBNnFDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ44K344K544OG44OgIC0gUGFydCAyXG4gKiDjg4bjgrnjg4jjg6zjg53jg7zjg4jjgajpgYvnlKjjgqzjgqTjg4njga7nlJ/miJDmqZ/og71cbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgRG9jdW1lbnRhdGlvbkdlbmVyYXRvciwgRG9jdW1lbnRhdGlvbkNvbmZpZywgVGVzdFJlcG9ydCB9IGZyb20gJy4vZG9jdW1lbnRhdGlvbi1nZW5lcmF0b3InO1xuXG4vKipcbiAqIOODieOCreODpeODoeODs+ODiOeUn+aIkOioreWumuWumuaVsFxuICovXG5jb25zdCBET0NVTUVOVEFUSU9OX0NPTlNUQU5UUyA9IHtcbiAgREVGQVVMVF9GSUxFX01PREU6IDBvNzU1LFxuICBNQVhfUFJPSkVDVF9OQU1FX0xFTkdUSDogMTAwLFxuICBNSU5fUFJPSkVDVF9OQU1FX0xFTkdUSDogMyxcbiAgU1VQUE9SVEVEX0ZPUk1BVFM6IFsnbWFya2Rvd24nLCAnaHRtbCcsICdwZGYnXSBhcyBjb25zdCxcbiAgRElSRUNUT1JZX1NUUlVDVFVSRToge1xuICAgIEFQSTogJ2FwaScsXG4gICAgQVJDSElURUNUVVJFOiAnYXJjaGl0ZWN0dXJlJywgXG4gICAgVEVTVFM6ICd0ZXN0cycsXG4gICAgT1BFUkFUSU9OUzogJ29wZXJhdGlvbnMnLFxuICAgIEFTU0VUUzogJ2Fzc2V0cydcbiAgfSxcbiAgVkFMSURBVElPTjoge1xuICAgIE1BWF9QQVRIX0xFTkdUSDogMjYwLFxuICAgIEFMTE9XRURfRklMRV9FWFRFTlNJT05TOiBbJy5tZCcsICcuaHRtbCcsICcuanNvbicsICcucGRmJ10sXG4gICAgREFOR0VST1VTX1BBVEhfUEFUVEVSTlM6IFtcbiAgICAgIC9cXC5cXC4vLCAgICAgICAgICAgLy8g44OR44K544OI44Op44OQ44O844K144OrXG4gICAgICAvfi8sICAgICAgICAgICAgICAvLyDjg5vjg7zjg6Djg4fjgqPjg6zjgq/jg4jjg6rlj4LnhadcbiAgICAgIC9cXDAvLCAgICAgICAgICAgICAvLyDjg4zjg6vmloflrZdcbiAgICAgIC9bPD46XCJ8PypdLywgICAgICAvLyDnhKHlirnjgarjg5XjgqHjgqTjg6vlkI3mloflrZdcbiAgICAgIC9eXFwvKy8sICAgICAgICAgICAvLyDntbblr77jg5HjgrlcbiAgICAgIC9cXFxcKy8gICAgICAgICAgICAgLy8g44OQ44OD44Kv44K544Op44OD44K344OlXG4gICAgXVxuICB9LFxuICBFUlJPUl9NRVNTQUdFUzoge1xuICAgIElOVkFMSURfUFJPSkVDVF9OQU1FOiAn44OX44Ot44K444Kn44Kv44OI5ZCN44GM54Sh5Yq544Gn44GZJyxcbiAgICBQQVRIX1RPT19MT05HOiAn44OR44K544GM6ZW344GZ44GO44G+44GZJyxcbiAgICBEQU5HRVJPVVNfUEFUSDogJ+S4jeato+OBquODkeOCueODkeOCv+ODvOODs+OBjOaknOWHuuOBleOCjOOBvuOBl+OBnycsXG4gICAgRElSRUNUT1JZX0NSRUFUSU9OX0ZBSUxFRDogJ+ODh+OCo+ODrOOCr+ODiOODquS9nOaIkOOBq+WkseaVl+OBl+OBvuOBl+OBnydcbiAgfVxufSBhcyBjb25zdDtcblxuLyoqXG4gKiDjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDoqK3lrprjga7lnovlrprnvqlcbiAqL1xudHlwZSBEb2N1bWVudGF0aW9uRm9ybWF0ID0gdHlwZW9mIERPQ1VNRU5UQVRJT05fQ09OU1RBTlRTLlNVUFBPUlRFRF9GT1JNQVRTW251bWJlcl07XG50eXBlIERpcmVjdG9yeVR5cGUgPSBrZXlvZiB0eXBlb2YgRE9DVU1FTlRBVElPTl9DT05TVEFOVFMuRElSRUNUT1JZX1NUUlVDVFVSRTtcblxuZXhwb3J0IGNsYXNzIERvY3VtZW50YXRpb25HZW5lcmF0b3JQYXJ0MiBleHRlbmRzIERvY3VtZW50YXRpb25HZW5lcmF0b3Ige1xuICAvKipcbiAgICogUGFydDLlm7rmnInjga7oqK3lrprjgqrjg5fjgrfjg6fjg7NcbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgZXh0ZW5kZWRPcHRpb25zOiB7XG4gICAgZW5hYmxlRGV0YWlsZWRSZXBvcnRzOiBib29sZWFuO1xuICAgIGVuYWJsZVRyZW5kQW5hbHlzaXM6IGJvb2xlYW47XG4gICAgbWF4UmVwb3J0SGlzdG9yeTogbnVtYmVyO1xuICB9O1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogRG9jdW1lbnRhdGlvbkNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gUGFydDLlm7rmnInjga7oqK3lrprliJ3mnJ/ljJZcbiAgICB0aGlzLmV4dGVuZGVkT3B0aW9ucyA9IHtcbiAgICAgIGVuYWJsZURldGFpbGVkUmVwb3J0czogdHJ1ZSxcbiAgICAgIGVuYWJsZVRyZW5kQW5hbHlzaXM6IHRydWUsXG4gICAgICBtYXhSZXBvcnRIaXN0b3J5OiAzMCAvLyAzMOaXpeWIhuOBruWxpeattOOCkuS/neaMgVxuICAgIH07XG4gICAgXG4gICAgdGhpcy52YWxpZGF0ZUV4dGVuZGVkQ29uZmlndXJhdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnQy5Zu65pyJ44Gu6Kit5a6a5qSc6Ki8XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlRXh0ZW5kZWRDb25maWd1cmF0aW9uKCk6IHZvaWQge1xuICAgIC8vIOaLoeW8teapn+iDveOBruioreWumuaknOiovFxuICAgIGlmICh0aGlzLmV4dGVuZGVkT3B0aW9ucy5tYXhSZXBvcnRIaXN0b3J5IDwgMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfjg6zjg53jg7zjg4jlsaXmrbTjga7kv53mjIHmnJ/plpPjga8x5pel5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOODoeOCpOODs1JFQURNReOBrueUn+aIkFxuICAgKi9cbiAgcHVibGljIGdlbmVyYXRlTWFpblJlYWRtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgIyAke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfVxuXG4jIyDwn5OLIOamguimgVxuXG5QZXJtaXNzaW9uLWF3YXJlIFJBRyBTeXN0ZW0g44Gv44CBQW1hem9uIEZTeCBmb3IgTmV0QXBwIE9OVEFQIOOBqCBBbWF6b24gQmVkcm9jayDjgpLntYTjgb/lkIjjgo/jgZvjgZ/jgIHjgqjjg7Pjgr/jg7zjg5fjg6njgqTjgrrjgrDjg6zjg7zjg4njga4gUkFH77yIUmV0cmlldmFsLUF1Z21lbnRlZCBHZW5lcmF0aW9u77yJ44K344K544OG44Og44Gn44GZ44CCXG5cbiMjIyDkuLvjgarnibnlvrRcblxuLSAqKuaoqemZkOODmeODvOOCueOCouOCr+OCu+OCueWItuW+oSoqOiDjg6bjg7zjgrbjg7zlm7rmnInjga7mlofmm7jjgqLjgq/jgrvjgrnmqKnpmZDnrqHnkIZcbi0gKirjgrXjg7zjg5Djg7zjg6zjgrnjgqLjg7zjgq3jg4bjgq/jg4Hjg6MqKjogQVdTIExhbWJkYSArIENsb3VkRnJvbnQg6YWN5L+hXG4tICoq44Os44K544Od44Oz44K344OWVUkqKjogTmV4dC5qcyArIFJlYWN0ICsgVGFpbHdpbmQgQ1NTXG4tICoq6auY57K+5bqm5qSc57SiKio6IE9wZW5TZWFyY2ggU2VydmVybGVzcyDjg5njgq/jg4jjg6vmpJzntKJcbi0gKirpq5jmgKfog73jgrnjg4jjg6zjg7zjgrgqKjogRlN4IGZvciBOZXRBcHAgT05UQVBcbi0gKirjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7Plr77lv5wqKjog55Kw5aKD5aSJ5pWw44Gr44KI44KL5p+U6Luf44Gq6Kit5a6aXG5cbiMjIPCfmoAg44Kv44Kk44OD44Kv44K544K/44O844OIXG5cbiMjIyDliY3mj5DmnaHku7ZcblxuLSBOb2RlLmpzIDIwLngg5Lul5LiKXG4tIEFXUyBDTEkg6Kit5a6a5riI44G/XG4tIEFXUyBDREsgdjIg44Kk44Oz44K544OI44O844Or5riI44G/XG5cbiMjIyDjgqTjg7Pjgrnjg4jjg7zjg6tcblxuXFxgXFxgXFxgYmFzaFxuIyDjg6rjg53jgrjjg4jjg6rjga7jgq/jg63jg7zjg7NcbmdpdCBjbG9uZSA8cmVwb3NpdG9yeS11cmw+XG5jZCBQZXJtaXNzaW9uLWF3YXJlLVJBRy1GU3hOLUNES1xuXG4jIOS+neWtmOmWouS/guOBruOCpOODs+OCueODiOODvOODq1xubnBtIGluc3RhbGxcblxuIyBDREsg44Gu44OW44O844OI44K544OI44Op44OD44OXXG5ucHggY2RrIGJvb3RzdHJhcFxuXFxgXFxgXFxgXG5cbiMjIyDjg4fjg5fjg63jgqRcblxuXFxgXFxgXFxgYmFzaFxuIyDplovnmbrnkrDlooPjgbjjga7jg4fjg5fjg63jgqRcbm5wbSBydW4gZGVwbG95OmRldlxuXG4jIOacrOeVqueSsOWig+OBuOOBruODh+ODl+ODreOCpFxubnBtIHJ1biBkZXBsb3k6cHJvZFxuXFxgXFxgXFxgXG5cbiMjIPCfk5Yg44OJ44Kt44Ol44Oh44Oz44OIXG5cbi0gW0FQSSDjg4njgq3jg6Xjg6Hjg7Pjg4hdKC4vYXBpL1JFQURNRS5tZClcbi0gW+OCouODvOOCreODhuOCr+ODgeODo10oLi9hcmNoaXRlY3R1cmUvUkVBRE1FLm1kKVxuLSBb44OG44K544OI44Os44Od44O844OIXSguL3Rlc3RzL1JFQURNRS5tZClcbi0gW+mBi+eUqOOCrOOCpOODiV0oLi9vcGVyYXRpb25zL1JFQURNRS5tZClcblxuIyMg8J+nqiDjg4bjgrnjg4hcblxuXFxgXFxgXFxgYmFzaFxuIyDlhajjg4bjgrnjg4jjga7lrp/ooYxcbm5wbSB0ZXN0XG5cbiMg57Wx5ZCI44OG44K544OI44Gu5a6f6KGMXG5ucG0gcnVuIHRlc3Q6aW50ZWdyYXRpb25cblxuIyBFMkXjg4bjgrnjg4jjga7lrp/ooYxcbm5wbSBydW4gdGVzdDplMmVcblxcYFxcYFxcYFxuXG4jIyDwn5OKIOebo+imllxuXG7jgrfjgrnjg4bjg6Djga7nm6PoppbjgajjgqLjg6njg7zjg4jjgavjgaTjgYTjgabjga/jgIFb55uj6KaW44Ks44Kk44OJXSguL29wZXJhdGlvbnMvbW9uaXRvcmluZy5tZCkg44KS5Y+C54Wn44GX44Gm44GP44Gg44GV44GE44CCXG5cbiMjIPCflKcg44OI44Op44OW44Or44K344Ol44O844OG44Kj44Oz44KwXG5cbuWVj+mhjOOBjOeZuueUn+OBl+OBn+WgtOWQiOOBr+OAgVvjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4ldKC4vb3BlcmF0aW9ucy90cm91Ymxlc2hvb3RpbmcubWQpIOOCkuWPgueFp+OBl+OBpuOBj+OBoOOBleOBhOOAglxuXG4jIyDwn5OdIOODqeOCpOOCu+ODs+OCuVxuXG7jgZPjga7jg5fjg63jgrjjgqfjgq/jg4jjga8gSVNDIOODqeOCpOOCu+ODs+OCueOBruS4i+OBp+aPkOS+m+OBleOCjOOBpuOBhOOBvuOBmeOAglxuXG4jIyDwn6SdIOiyoueMrlxuXG7jg5fjg63jgrjjgqfjgq/jg4jjgbjjga7osqLnjK7jgpLmrZPov47jgZfjgb7jgZnjgILoqbPntLDjga8gQ09OVFJJQlVUSU5HLm1kIOOCkuWPgueFp+OBl+OBpuOBj+OBoOOBleOBhOOAglxuYDtcbiAgfVxuXG4gIC8qKlxuICAgKiDlhajjg4njgq3jg6Xjg6Hjg7Pjg4jjga7nlJ/miJDvvIjmi6HlvLXniYjvvIlcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlQWxsRG9jdW1lbnRhdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+TmiDmi6HlvLXjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDjgpLplovlp4suLi4nKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8g5Z+65bqV44Kv44Op44K544Gu55Sf5oiQ5Yem55CG44KS5a6f6KGMXG4gICAgICBhd2FpdCBzdXBlci5nZW5lcmF0ZUFsbERvY3VtZW50YXRpb24oKTtcbiAgICAgIFxuICAgICAgLy8gUGFydDLlm7rmnInjga7ov73liqDlh6bnkIZcbiAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVFeHRlbmRlZERvY3VtZW50YXRpb24oKTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ/Cfjokg5ouh5by144OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ5a6M5LqGJyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnQy5Zu65pyJ44Gu5ouh5by144OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ77yI5Lim5YiX5Yem55CG5pyA6YGp5YyW77yJXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlRXh0ZW5kZWREb2N1bWVudGF0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhc2tzOiBBcnJheTx7IG5hbWU6IHN0cmluZzsgdGFzazogUHJvbWlzZTx2b2lkPiB9PiA9IFtdO1xuXG4gICAgLy8g5Lim5YiX5a6f6KGM5Y+v6IO944Gq44K/44K544Kv44KS6YWN5YiX44Gr6L+95YqgXG4gICAgaWYgKHRoaXMuY29uZmlnLmdlbmVyYXRlVGVzdFJlcG9ydHMpIHtcbiAgICAgIHRhc2tzLnB1c2goe1xuICAgICAgICBuYW1lOiAn6Kmz57Sw44OG44K544OI44Os44Od44O844OIJyxcbiAgICAgICAgdGFzazogdGhpcy5nZW5lcmF0ZURldGFpbGVkVGVzdFJlcG9ydHMoKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY29uZmlnLmdlbmVyYXRlT3BlcmF0aW9uYWxHdWlkZXMpIHtcbiAgICAgIHRhc2tzLnB1c2goe1xuICAgICAgICBuYW1lOiAn5ouh5by16YGL55So44Ks44Kk44OJJyxcbiAgICAgICAgdGFzazogdGhpcy5nZW5lcmF0ZUV4dGVuZGVkT3BlcmF0aW9uYWxHdWlkZXMoKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g44Oh44Kk44OzUkVBRE1F44Gu55Sf5oiQ77yI5LuW44Gu44K/44K544Kv44Go5Lim5YiX5a6f6KGM5Y+v6IO977yJXG4gICAgdGFza3MucHVzaCh7XG4gICAgICBuYW1lOiAn44Oh44Kk44OzUkVBRE1FJyxcbiAgICAgIHRhc2s6IHRoaXMuZ2VuZXJhdGVBbmRXcml0ZU1haW5SZWFkbWUoKVxuICAgIH0pO1xuXG4gICAgLy8g5YWo44Gm44Gu44K/44K544Kv44KS5Lim5YiX5a6f6KGM77yI44Ko44Op44O844OP44Oz44OJ44Oq44Oz44Kw5LuY44GN77yJXG4gICAgaWYgKHRhc2tzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoXG4gICAgICAgIHRhc2tzLm1hcCgoeyB0YXNrIH0pID0+IHRhc2spXG4gICAgICApO1xuXG4gICAgICAvLyDntZDmnpzjga7norroqo3jgajjg63jgrDlh7rliptcbiAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCB0YXNrTmFtZSA9IHRhc2tzW2luZGV4XS5uYW1lO1xuICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICAg4pyFICR7dGFza05hbWV955Sf5oiQ5a6M5LqGYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgICAg4p2MICR7dGFza05hbWV955Sf5oiQ5aSx5pWXOmAsIHJlc3VsdC5yZWFzb24pO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0YXNrTmFtZX3jga7nlJ/miJDjgavlpLHmlZfjgZfjgb7jgZfjgZ86ICR7cmVzdWx0LnJlYXNvbn1gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOODoeOCpOODs1JFQURNReOBrueUn+aIkOOBqOabuOOBjei+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFuZFdyaXRlTWFpblJlYWRtZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYWluUmVhZG1lID0gdGhpcy5nZW5lcmF0ZU1haW5SZWFkbWUoKTtcbiAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnUkVBRE1FLm1kJywgbWFpblJlYWRtZSk7XG4gIH1cblxuXG5cbiAgLyoqXG4gICAqIOODh+OCo+ODrOOCr+ODiOODquOBruWtmOWcqOeiuuiqjeOBqOS9nOaIkO+8iOOCu+OCreODpeODquODhuOCo+WvvuetluS7mOOBje+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVEaXJlY3RvcnlFeGlzdHMoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIOODkeOCueODiOODqeODkOODvOOCteODq+aUu+aSg+OCkumYsuOBkOOBn+OCgeOBruODkeOCueaknOiovFxuICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcGF0aC5yZXNvbHZlKGRpclBhdGgpO1xuICAgICAgY29uc3QgcHJvamVjdFJvb3QgPSBwcm9jZXNzLmN3ZCgpO1xuICAgICAgXG4gICAgICBpZiAoIXJlc29sdmVkUGF0aC5zdGFydHNXaXRoKHByb2plY3RSb290KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOS4jeato+OBquODkeOCueOBjOaknOWHuuOBleOCjOOBvuOBl+OBnzogJHtkaXJQYXRofWApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocmVzb2x2ZWRQYXRoKSkge1xuICAgICAgICBmcy5ta2RpclN5bmMocmVzb2x2ZWRQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgbW9kZTogMG83NTUgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDwn5OBIOODh+OCo+ODrOOCr+ODiOODquS9nOaIkDogJHtyZXNvbHZlZFBhdGh9YCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCDjg4fjgqPjg6zjgq/jg4jjg6rkvZzmiJDjgqjjg6njg7w6ICR7ZXJyb3JNZXNzYWdlfWApO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGDjg4fjgqPjg6zjgq/jg4jjg6rkvZzmiJDjgavlpLHmlZfjgZfjgb7jgZfjgZ86ICR7ZGlyUGF0aH1gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog6Kit5a6a5YCk44Gu5YyF5ous55qE5qSc6Ki8XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlQ29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLnZhbGlkYXRlUHJvamVjdE5hbWUoKTtcbiAgICB0aGlzLnZhbGlkYXRlT3V0cHV0RGlyZWN0b3J5KCk7XG4gICAgdGhpcy52YWxpZGF0ZUZvcm1hdHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg5fjg63jgrjjgqfjgq/jg4jlkI3jga7mpJzoqLxcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVQcm9qZWN0TmFtZSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IHByb2plY3ROYW1lIH0gPSB0aGlzLmNvbmZpZztcbiAgICBcbiAgICBpZiAoIXByb2plY3ROYW1lIHx8IHR5cGVvZiBwcm9qZWN0TmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihET0NVTUVOVEFUSU9OX0NPTlNUQU5UUy5FUlJPUl9NRVNTQUdFUy5JTlZBTElEX1BST0pFQ1RfTkFNRSArICc6IOacquioreWumicpO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaW1tZWROYW1lID0gcHJvamVjdE5hbWUudHJpbSgpO1xuICAgIGlmICh0cmltbWVkTmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihET0NVTUVOVEFUSU9OX0NPTlNUQU5UUy5FUlJPUl9NRVNTQUdFUy5JTlZBTElEX1BST0pFQ1RfTkFNRSArICc6IOepuuaWh+WtlycpO1xuICAgIH1cbiAgICBcbiAgICBpZiAodHJpbW1lZE5hbWUubGVuZ3RoIDwgRE9DVU1FTlRBVElPTl9DT05TVEFOVFMuTUlOX1BST0pFQ1RfTkFNRV9MRU5HVEgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg44OX44Ot44K444Kn44Kv44OI5ZCN44GM55+t44GZ44GO44G+44GZ77yI5pyA5bCPJHtET0NVTUVOVEFUSU9OX0NPTlNUQU5UUy5NSU5fUFJPSkVDVF9OQU1FX0xFTkdUSH3mloflrZfvvIlgKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRyaW1tZWROYW1lLmxlbmd0aCA+IERPQ1VNRU5UQVRJT05fQ09OU1RBTlRTLk1BWF9QUk9KRUNUX05BTUVfTEVOR1RIKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOODl+ODreOCuOOCp+OCr+ODiOWQjeOBjOmVt+OBmeOBjuOBvuOBme+8iOacgOWkpyR7RE9DVU1FTlRBVElPTl9DT05TVEFOVFMuTUFYX1BST0pFQ1RfTkFNRV9MRU5HVEh95paH5a2X77yJYCk7XG4gICAgfVxuICAgIFxuICAgIC8vIOWuieWFqOOBquaWh+Wtl+OBruOBv+ioseWPr++8iOaXpeacrOiqnuOCguWQq+OCgO+8iVxuICAgIGlmICghL15bYS16QS1aMC05XFxzXFwtX1xcdTMwNDAtXFx1MzA5RlxcdTMwQTAtXFx1MzBGRlxcdTRFMDAtXFx1OUZBRl0rJC8udGVzdCh0cmltbWVkTmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihET0NVTUVOVEFUSU9OX0NPTlNUQU5UUy5FUlJPUl9NRVNTQUdFUy5JTlZBTElEX1BST0pFQ1RfTkFNRSArICc6IOS4jeato+OBquaWh+Wtl+OBjOWQq+OBvuOCjOOBpuOBhOOBvuOBmScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjga7mpJzoqLxcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVPdXRwdXREaXJlY3RvcnkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBvdXRwdXREaXJlY3RvcnkgfSA9IHRoaXMuY29uZmlnO1xuICAgIFxuICAgIGlmICghb3V0cHV0RGlyZWN0b3J5IHx8IHR5cGVvZiBvdXRwdXREaXJlY3RvcnkgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgIH1cblxuICAgIC8vIOWNsemZuuOBquODkeOCueODkeOCv+ODvOODs+OBruaknOiovFxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBET0NVTUVOVEFUSU9OX0NPTlNUQU5UUy5WQUxJREFUSU9OLkRBTkdFUk9VU19QQVRIX1BBVFRFUk5TKSB7XG4gICAgICBpZiAocGF0dGVybi50ZXN0KG91dHB1dERpcmVjdG9yeSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke0RPQ1VNRU5UQVRJT05fQ09OU1RBTlRTLkVSUk9SX01FU1NBR0VTLkRBTkdFUk9VU19QQVRIfTogJHtvdXRwdXREaXJlY3Rvcnl9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOODleOCqeODvOODnuODg+ODiOioreWumuOBruaknOiovFxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUZvcm1hdHMoKTogdm9pZCB7XG4gICAgY29uc3QgeyBmb3JtYXRzIH0gPSB0aGlzLmNvbmZpZztcbiAgICBcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoZm9ybWF0cykgfHwgZm9ybWF0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign5Ye65Yqb44OV44Kp44O844Oe44OD44OI44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gICAgfVxuXG4gICAgY29uc3QgaW52YWxpZEZvcm1hdHMgPSBmb3JtYXRzLmZpbHRlcihcbiAgICAgIGZvcm1hdCA9PiAhRE9DVU1FTlRBVElPTl9DT05TVEFOVFMuU1VQUE9SVEVEX0ZPUk1BVFMuaW5jbHVkZXMoZm9ybWF0IGFzIGFueSlcbiAgICApO1xuXG4gICAgaWYgKGludmFsaWRGb3JtYXRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg44K144Od44O844OI44GV44KM44Gm44GE44Gq44GE44OV44Kp44O844Oe44OD44OIOiAke2ludmFsaWRGb3JtYXRzLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhUTUzjgqjjgrnjgrHjg7zjg5flh6bnkIbvvIhYU1Plr77nrZbvvIlcbiAgICovXG4gIHByaXZhdGUgZXNjYXBlSHRtbCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGh0bWxFc2NhcGVNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICBcIidcIjogJyYjeDI3OycsXG4gICAgICAnLyc6ICcmI3gyRjsnXG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9bJjw+XCInL10vZywgKG1hdGNoKSA9PiBodG1sRXNjYXBlTWFwW21hdGNoXSB8fCBtYXRjaCk7XG4gIH1cblxuICAvKipcbiAgICog6Kmz57Sw44OG44K544OI44Os44Od44O844OI44Gu55Sf5oiQ77yI44Ko44Op44O844OP44Oz44OJ44Oq44Oz44Kw5by35YyW54mI77yJXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlRGV0YWlsZWRUZXN0UmVwb3J0cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5sb2coJyAgIPCfk4og44OG44K544OI57WQ5p6c44KS5Y+O6ZuG5LitLi4uJyk7XG4gICAgICBjb25zdCB0ZXN0UmVwb3J0cyA9IGF3YWl0IHRoaXMuY29sbGVjdFRlc3RSZXBvcnRzRXh0ZW5kZWQoKTtcbiAgICAgIFxuICAgICAgaWYgKHRlc3RSZXBvcnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJyAgIOKaoO+4jyDjg4bjgrnjg4jjg6zjg53jg7zjg4jjgYzopovjgaTjgYvjgorjgb7jgZvjgpPjgafjgZfjgZ8nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhgICAg8J+TnSAke3Rlc3RSZXBvcnRzLmxlbmd0aH3ku7bjga7jg4bjgrnjg4jjg6zjg53jg7zjg4jjgpLlh6bnkIbkuK0uLi5gKTtcblxuICAgICAgLy8g5Lim5YiX5Yem55CG44Gn44Os44Od44O844OI55Sf5oiQ44KS6auY6YCf5YyWXG4gICAgICBjb25zdCByZXBvcnRUYXNrczogUHJvbWlzZTx2b2lkPltdID0gW107XG5cbiAgICAgIC8vIOe1seWQiOODhuOCueODiOODrOODneODvOODiOOBrueUn+aIkFxuICAgICAgcmVwb3J0VGFza3MucHVzaChcbiAgICAgICAgdGhpcy5nZW5lcmF0ZUFuZFdyaXRlSW50ZWdyYXRlZFJlcG9ydCh0ZXN0UmVwb3J0cylcbiAgICAgICk7XG5cbiAgICAgIC8vIOODhuOCueODiOOCueOCpOODvOODiOWIpeODrOODneODvOODiOOBrueUn+aIkFxuICAgICAgcmVwb3J0VGFza3MucHVzaChcbiAgICAgICAgdGhpcy5nZW5lcmF0ZUFuZFdyaXRlU3VpdGVSZXBvcnRzKHRlc3RSZXBvcnRzKVxuICAgICAgKTtcblxuICAgICAgLy8g44OG44K544OI5bGl5q2044Gu55Sf5oiQXG4gICAgICByZXBvcnRUYXNrcy5wdXNoKFxuICAgICAgICB0aGlzLmdlbmVyYXRlQW5kV3JpdGVIaXN0b3J5UmVwb3J0KHRlc3RSZXBvcnRzKVxuICAgICAgKTtcblxuICAgICAgLy8g5YWo44Gm44Gu44Os44Od44O844OI55Sf5oiQ44K/44K544Kv44KS5Lim5YiX5a6f6KGMXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChyZXBvcnRUYXNrcyk7XG5cbiAgICAgIGNvbnNvbGUubG9nKGAgICDinIUg44OG44K544OI44Os44Od44O844OI55Sf5oiQ5a6M5LqGICgke3Rlc3RSZXBvcnRzLmxlbmd0aH3ku7YpYCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgY29uc29sZS5lcnJvcihgICAg4p2MIOODhuOCueODiOODrOODneODvOODiOeUn+aIkOOCqOODqeODvDogJHtlcnJvck1lc3NhZ2V9YCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOODhuOCueODiOODrOODneODvOODiOOBrueUn+aIkOOBq+WkseaVl+OBl+OBvuOBl+OBnzogJHtlcnJvck1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOe1seWQiOODhuOCueODiOODrOODneODvOODiOOBrueUn+aIkOOBqOabuOOBjei+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFuZFdyaXRlSW50ZWdyYXRlZFJlcG9ydCh0ZXN0UmVwb3J0czogVGVzdFJlcG9ydFtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaW50ZWdyYXRlZFJlcG9ydCA9IHRoaXMuZ2VuZXJhdGVJbnRlZ3JhdGVkVGVzdFJlcG9ydCh0ZXN0UmVwb3J0cyk7XG4gICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ3Rlc3RzL2ludGVncmF0ZWQtdGVzdC1yZXBvcnQubWQnLCBpbnRlZ3JhdGVkUmVwb3J0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jjgrnjgqTjg7zjg4jliKXjg6zjg53jg7zjg4jjga7nlJ/miJDjgajmm7jjgY3ovrzjgb9cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVBbmRXcml0ZVN1aXRlUmVwb3J0cyh0ZXN0UmVwb3J0czogVGVzdFJlcG9ydFtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc3VpdGVSZXBvcnRUYXNrcyA9IHRlc3RSZXBvcnRzLm1hcChhc3luYyAocmVwb3J0KSA9PiB7XG4gICAgICBjb25zdCBzdWl0ZVJlcG9ydCA9IHRoaXMuZ2VuZXJhdGVUZXN0U3VpdGVSZXBvcnQocmVwb3J0KTtcbiAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKGB0ZXN0cy8ke3JlcG9ydC5lbnZpcm9ubWVudH0tJHtyZXBvcnQudGVzdFJ1bklkfS5tZGAsIHN1aXRlUmVwb3J0KTtcbiAgICB9KTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKHN1aXRlUmVwb3J0VGFza3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIOODhuOCueODiOWxpeattOODrOODneODvOODiOOBrueUn+aIkOOBqOabuOOBjei+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFuZFdyaXRlSGlzdG9yeVJlcG9ydCh0ZXN0UmVwb3J0czogVGVzdFJlcG9ydFtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaGlzdG9yeVJlcG9ydCA9IHRoaXMuZ2VuZXJhdGVUZXN0SGlzdG9yeVJlcG9ydCh0ZXN0UmVwb3J0cyk7XG4gICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ3Rlc3RzL3Rlc3QtaGlzdG9yeS5tZCcsIGhpc3RvcnlSZXBvcnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIOODhuOCueODiOODrOODneODvOODiOOBruWPjumbhu+8iFBhcnQy5a6f6KOF77yJXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RUZXN0UmVwb3J0c0V4dGVuZGVkKCk6IFByb21pc2U8VGVzdFJlcG9ydFtdPiB7XG4gICAgLy8g5a6f6Zqb44Gu5a6f6KOF44Gn44Gv44CB44OG44K544OI57WQ5p6c44OV44Kh44Kk44Or44KE44OH44O844K/44OZ44O844K544GL44KJ5Y+O6ZuGXG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgdGVzdFJ1bklkOiAnaW50ZWdyYXRlZC10ZXN0LTE3MDMxMjM0NTY3ODknLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTEyLTIxVDEwOjMwOjAwWicpLFxuICAgICAgICBlbnZpcm9ubWVudDogJ3Byb2R1Y3Rpb24nLFxuICAgICAgICBzdW1tYXJ5OiB7XG4gICAgICAgICAgdG90YWxUZXN0czogMTQ4LFxuICAgICAgICAgIHBhc3NlZFRlc3RzOiAxNDIsXG4gICAgICAgICAgZmFpbGVkVGVzdHM6IDYsXG4gICAgICAgICAgc2tpcHBlZFRlc3RzOiAwLFxuICAgICAgICAgIG92ZXJhbGxTY29yZTogODguNVxuICAgICAgICB9LFxuICAgICAgICBzdWl0ZVJlc3VsdHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdWl0ZU5hbWU6ICdzZWN1cml0eScsXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgc2NvcmU6IDkyLjMsXG4gICAgICAgICAgICBkdXJhdGlvbjogMTI0NTAwMCxcbiAgICAgICAgICAgIHRlc3RDb3VudDogNDUsXG4gICAgICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICAgIGVuY3J5cHRpb25UZXN0czogMTUsXG4gICAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uVGVzdHM6IDIwLFxuICAgICAgICAgICAgICB2dWxuZXJhYmlsaXR5VGVzdHM6IDEwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdWl0ZU5hbWU6ICdwZXJmb3JtYW5jZScsXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgc2NvcmU6IDg1LjcsXG4gICAgICAgICAgICBkdXJhdGlvbjogMjEwMDAwMCxcbiAgICAgICAgICAgIHRlc3RDb3VudDogMjMsXG4gICAgICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICAgIGxvYWRUZXN0czogMTAsXG4gICAgICAgICAgICAgIHNjYWxhYmlsaXR5VGVzdHM6IDgsXG4gICAgICAgICAgICAgIHVwdGltZVRlc3RzOiA1XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdWl0ZU5hbWU6ICdmdW5jdGlvbmFsJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgc2NvcmU6IDg3LjUsXG4gICAgICAgICAgICBkdXJhdGlvbjogMTgwMDAwMCxcbiAgICAgICAgICAgIHRlc3RDb3VudDogODAsXG4gICAgICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICAgIHVpVGVzdHM6IDI1LFxuICAgICAgICAgICAgICBhcGlUZXN0czogNDAsXG4gICAgICAgICAgICAgIGludGVncmF0aW9uVGVzdHM6IDE1XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFtcbiAgICAgICAgICAn44OV44Kh44Kk44Or44Ki44OD44OX44Ot44O844OJ5qmf6IO944Gu5L+u5q2j44GM5b+F6KaB44Gn44GZJyxcbiAgICAgICAgICAn44OH44O844K/44OZ44O844K544Kv44Ko44Oq44Gu5pyA6YGp5YyW44KS5o6o5aWo44GX44G+44GZJyxcbiAgICAgICAgICAn44K744Kt44Ol44Oq44OG44Kj44OY44OD44OA44O844Gu6Kit5a6a44KS56K66KqN44GX44Gm44GP44Gg44GV44GEJ1xuICAgICAgICBdXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0ZXN0UnVuSWQ6ICdpbnRlZ3JhdGVkLXRlc3QtMTcwMzAzNzA1Njc4OScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjQtMTItMjBUMTA6MzA6MDBaJyksXG4gICAgICAgIGVudmlyb25tZW50OiAnc3RhZ2luZycsXG4gICAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgICB0b3RhbFRlc3RzOiAxNTYsXG4gICAgICAgICAgcGFzc2VkVGVzdHM6IDE0OCxcbiAgICAgICAgICBmYWlsZWRUZXN0czogOCxcbiAgICAgICAgICBza2lwcGVkVGVzdHM6IDAsXG4gICAgICAgICAgb3ZlcmFsbFNjb3JlOiA5MS4yXG4gICAgICAgIH0sXG4gICAgICAgIHN1aXRlUmVzdWx0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN1aXRlTmFtZTogJ3NlY3VyaXR5JyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBzY29yZTogOTQuMSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiAxMTgwMDAwLFxuICAgICAgICAgICAgdGVzdENvdW50OiA0OCxcbiAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgZW5jcnlwdGlvblRlc3RzOiAxNixcbiAgICAgICAgICAgICAgYXV0aGVudGljYXRpb25UZXN0czogMjIsXG4gICAgICAgICAgICAgIHZ1bG5lcmFiaWxpdHlUZXN0czogMTBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN1aXRlTmFtZTogJ3BlcmZvcm1hbmNlJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBzY29yZTogODkuMyxcbiAgICAgICAgICAgIGR1cmF0aW9uOiAyNDAwMDAwLFxuICAgICAgICAgICAgdGVzdENvdW50OiAyOCxcbiAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgbG9hZFRlc3RzOiAxMixcbiAgICAgICAgICAgICAgc2NhbGFiaWxpdHlUZXN0czogMTAsXG4gICAgICAgICAgICAgIHVwdGltZVRlc3RzOiA2XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdWl0ZU5hbWU6ICdmdW5jdGlvbmFsJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBzY29yZTogOTAuMCxcbiAgICAgICAgICAgIGR1cmF0aW9uOiAxNjUwMDAwLFxuICAgICAgICAgICAgdGVzdENvdW50OiA4MCxcbiAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgdWlUZXN0czogMjUsXG4gICAgICAgICAgICAgIGFwaVRlc3RzOiA0MCxcbiAgICAgICAgICAgICAgaW50ZWdyYXRpb25UZXN0czogMTVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHJlY29tbWVuZGF0aW9uczogW1xuICAgICAgICAgICfjg5Hjg5Xjgqnjg7zjg57jg7PjgrnmnIDpganljJbjga7ntpnntprlrp/mlr0nLFxuICAgICAgICAgICfjgrvjgq3jg6Xjg6rjg4bjgqPnm6Poppbjga7lvLfljJYnLFxuICAgICAgICAgICfjg4bjgrnjg4jjgqvjg5Djg6zjg4Pjgrjjga7lkJHkuIonXG4gICAgICAgIF1cbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIOe1seWQiOODhuOCueODiOODrOODneODvOODiOOBrueUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZUludGVncmF0ZWRUZXN0UmVwb3J0KHJlcG9ydHM6IFRlc3RSZXBvcnRbXSk6IHN0cmluZyB7XG4gICAgY29uc3QgbGF0ZXN0UmVwb3J0ID0gcmVwb3J0c1swXTtcbiAgICBcbiAgICBsZXQgbWFya2Rvd24gPSBgIyDntbHlkIjjg4bjgrnjg4jjg6zjg53jg7zjg4hcXG5cXG5gO1xuICAgIG1hcmtkb3duICs9IGAqKuODl+ODreOCuOOCp+OCr+ODiDoqKiAke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfVxcbmA7XG4gICAgbWFya2Rvd24gKz0gYCoq5pyA57WC5a6f6KGMOioqICR7bGF0ZXN0UmVwb3J0LnRpbWVzdGFtcC50b0xvY2FsZVN0cmluZygnamEtSlAnKX1cXG5gO1xuICAgIG1hcmtkb3duICs9IGAqKueSsOWigzoqKiAke2xhdGVzdFJlcG9ydC5lbnZpcm9ubWVudH1cXG5gO1xuICAgIG1hcmtkb3duICs9IGAqKuODhuOCueODiOWun+ihjElEOioqICR7bGF0ZXN0UmVwb3J0LnRlc3RSdW5JZH1cXG5cXG5gO1xuXG4gICAgLy8g44K144Oe44Oq44O8XG4gICAgbWFya2Rvd24gKz0gJyMjIPCfk4og44OG44K544OI57WQ5p6c44K144Oe44Oq44O8XFxuXFxuJztcbiAgICBtYXJrZG93biArPSBgLSAqKue3j+WQiOOCueOCs+OCojoqKiAke2xhdGVzdFJlcG9ydC5zdW1tYXJ5Lm92ZXJhbGxTY29yZS50b0ZpeGVkKDEpfS8xMDBcXG5gO1xuICAgIG1hcmtkb3duICs9IGAtICoq57eP44OG44K544OI5pWwOioqICR7bGF0ZXN0UmVwb3J0LnN1bW1hcnkudG90YWxUZXN0c31cXG5gO1xuICAgIG1hcmtkb3duICs9IGAtICoq5oiQ5YqfOioqICR7bGF0ZXN0UmVwb3J0LnN1bW1hcnkucGFzc2VkVGVzdHN9ICgkeygobGF0ZXN0UmVwb3J0LnN1bW1hcnkucGFzc2VkVGVzdHMgLyBsYXRlc3RSZXBvcnQuc3VtbWFyeS50b3RhbFRlc3RzKSAqIDEwMCkudG9GaXhlZCgxKX0lKVxcbmA7XG4gICAgbWFya2Rvd24gKz0gYC0gKirlpLHmlZc6KiogJHtsYXRlc3RSZXBvcnQuc3VtbWFyeS5mYWlsZWRUZXN0c30gKCR7KChsYXRlc3RSZXBvcnQuc3VtbWFyeS5mYWlsZWRUZXN0cyAvIGxhdGVzdFJlcG9ydC5zdW1tYXJ5LnRvdGFsVGVzdHMpICogMTAwKS50b0ZpeGVkKDEpfSUpXFxuYDtcbiAgICBtYXJrZG93biArPSBgLSAqKuOCueOCreODg+ODlzoqKiAke2xhdGVzdFJlcG9ydC5zdW1tYXJ5LnNraXBwZWRUZXN0c31cXG5cXG5gO1xuXG4gICAgLy8g44K544Kz44Ki6KmV5L6hXG4gICAgY29uc3Qgc2NvcmVFbW9qaSA9IGxhdGVzdFJlcG9ydC5zdW1tYXJ5Lm92ZXJhbGxTY29yZSA+PSA5MCA/ICfwn5+iJyA6IFxuICAgICAgICAgICAgICAgICAgICAgIGxhdGVzdFJlcG9ydC5zdW1tYXJ5Lm92ZXJhbGxTY29yZSA+PSA4MCA/ICfwn5+hJyA6IFxuICAgICAgICAgICAgICAgICAgICAgIGxhdGVzdFJlcG9ydC5zdW1tYXJ5Lm92ZXJhbGxTY29yZSA+PSA3MCA/ICfwn5+gJyA6ICfwn5S0JztcbiAgICBtYXJrZG93biArPSBgKiroqZXkvqE6KiogJHtzY29yZUVtb2ppfSBgO1xuICAgIFxuICAgIGlmIChsYXRlc3RSZXBvcnQuc3VtbWFyeS5vdmVyYWxsU2NvcmUgPj0gOTApIHtcbiAgICAgIG1hcmtkb3duICs9ICflhKrnp4AgLSDjgrfjgrnjg4bjg6Djga/pq5jjgYTlk4Hos6rjgpLntq3mjIHjgZfjgabjgYTjgb7jgZlcXG5cXG4nO1xuICAgIH0gZWxzZSBpZiAobGF0ZXN0UmVwb3J0LnN1bW1hcnkub3ZlcmFsbFNjb3JlID49IDgwKSB7XG4gICAgICBtYXJrZG93biArPSAn6Imv5aW9IC0g6Lu95b6u44Gq5pS55ZaE44Gr44KI44KK5ZOB6LOq5ZCR5LiK44GM5pyf5b6F44Gn44GN44G+44GZXFxuXFxuJztcbiAgICB9IGVsc2UgaWYgKGxhdGVzdFJlcG9ydC5zdW1tYXJ5Lm92ZXJhbGxTY29yZSA+PSA3MCkge1xuICAgICAgbWFya2Rvd24gKz0gJ+azqOaEjyAtIOaUueWWhOOBjOW/heimgeOBqumgmOWfn+OBjOOBguOCiuOBvuOBmVxcblxcbic7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hcmtkb3duICs9ICforablkYogLSDph43opoHjgarllY/poYzjgYzjgYLjgorjgb7jgZlcXG5cXG4nO1xuICAgIH1cblxuICAgIC8vIOODhuOCueODiOOCueOCpOODvOODiOWIpee1kOaenFxuICAgIG1hcmtkb3duICs9ICcjIyDwn5SNIOODhuOCueODiOOCueOCpOODvOODiOWIpee1kOaenFxcblxcbic7XG4gICAgbWFya2Rvd24gKz0gJ3wg44K544Kk44O844OIIHwg57WQ5p6cIHwg44K544Kz44KiIHwg5a6f6KGM5pmC6ZaTIHwg44OG44K544OI5pWwIHxcXG4nO1xuICAgIG1hcmtkb3duICs9ICd8LS0tLS0tLS0tLXwtLS0tLS18LS0tLS0tLS18LS0tLS0tLS0tLXwtLS0tLS0tLS0tfFxcbic7XG4gICAgXG4gICAgbGF0ZXN0UmVwb3J0LnN1aXRlUmVzdWx0cy5mb3JFYWNoKHN1aXRlID0+IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHN1aXRlLnN1Y2Nlc3MgPyAn4pyFJyA6ICfinYwnO1xuICAgICAgY29uc3QgZHVyYXRpb24gPSAoc3VpdGUuZHVyYXRpb24gLyAxMDAwKS50b0ZpeGVkKDEpO1xuICAgICAgbWFya2Rvd24gKz0gYHwgJHtzdWl0ZS5zdWl0ZU5hbWV9IHwgJHtzdGF0dXN9IHwgJHtzdWl0ZS5zY29yZS50b0ZpeGVkKDEpfS8xMDAgfCAke2R1cmF0aW9ufXMgfCAke3N1aXRlLnRlc3RDb3VudH0gfFxcbmA7XG4gICAgfSk7XG4gICAgbWFya2Rvd24gKz0gJ1xcbic7XG5cbiAgICAvLyDmjqjlpajkuovpoIVcbiAgICBpZiAobGF0ZXN0UmVwb3J0LnJlY29tbWVuZGF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBtYXJrZG93biArPSAnIyMg8J+SoSDmjqjlpajkuovpoIVcXG5cXG4nO1xuICAgICAgbGF0ZXN0UmVwb3J0LnJlY29tbWVuZGF0aW9ucy5mb3JFYWNoKChyZWMsIGluZGV4KSA9PiB7XG4gICAgICAgIG1hcmtkb3duICs9IGAke2luZGV4ICsgMX0uICR7cmVjfVxcbmA7XG4gICAgICB9KTtcbiAgICAgIG1hcmtkb3duICs9ICdcXG4nO1xuICAgIH1cblxuICAgIC8vIOODiOODrOODs+ODieWIhuaekFxuICAgIGlmIChyZXBvcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIG1hcmtkb3duICs9ICcjIyDwn5OIIOODiOODrOODs+ODieWIhuaekFxcblxcbic7XG4gICAgICBtYXJrZG93biArPSB0aGlzLmdlbmVyYXRlVHJlbmRBbmFseXNpcyhyZXBvcnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWFya2Rvd247XG4gIH1cblxuICAvKipcbiAgICog44OG44K544OI44K544Kk44O844OI5Yil44Os44Od44O844OI44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlVGVzdFN1aXRlUmVwb3J0KHJlcG9ydDogVGVzdFJlcG9ydCk6IHN0cmluZyB7XG4gICAgbGV0IG1hcmtkb3duID0gYCMg44OG44K544OI44Os44Od44O844OIIC0gJHtyZXBvcnQuZW52aXJvbm1lbnR9XFxuXFxuYDtcbiAgICBtYXJrZG93biArPSBgKirlrp/ooYzml6XmmYI6KiogJHtyZXBvcnQudGltZXN0YW1wLnRvTG9jYWxlU3RyaW5nKCdqYS1KUCcpfVxcbmA7XG4gICAgbWFya2Rvd24gKz0gYCoq44OG44K544OI5a6f6KGMSUQ6KiogJHtyZXBvcnQudGVzdFJ1bklkfVxcblxcbmA7XG5cbiAgICByZXBvcnQuc3VpdGVSZXN1bHRzLmZvckVhY2goc3VpdGUgPT4ge1xuICAgICAgbWFya2Rvd24gKz0gYCMjICR7c3VpdGUuc3VpdGVOYW1lfSDjg4bjgrnjg4jjgrnjgqTjg7zjg4hcXG5cXG5gO1xuICAgICAgbWFya2Rvd24gKz0gYC0gKirntZDmnpw6KiogJHtzdWl0ZS5zdWNjZXNzID8gJ+KchSDmiJDlip8nIDogJ+KdjCDlpLHmlZcnfVxcbmA7XG4gICAgICBtYXJrZG93biArPSBgLSAqKuOCueOCs+OCojoqKiAke3N1aXRlLnNjb3JlLnRvRml4ZWQoMSl9LzEwMFxcbmA7XG4gICAgICBtYXJrZG93biArPSBgLSAqKuWun+ihjOaZgumWkzoqKiAkeyhzdWl0ZS5kdXJhdGlvbiAvIDEwMDApLnRvRml4ZWQoMSl956eSXFxuYDtcbiAgICAgIG1hcmtkb3duICs9IGAtICoq44OG44K544OI5pWwOioqICR7c3VpdGUudGVzdENvdW50fVxcblxcbmA7XG5cbiAgICAgIGlmIChzdWl0ZS5kZXRhaWxzKSB7XG4gICAgICAgIG1hcmtkb3duICs9ICcjIyMg6Kmz57Sw57WQ5p6cXFxuXFxuJztcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoc3VpdGUuZGV0YWlscykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgbWFya2Rvd24gKz0gYC0gKioke2tleX06KiogJHt2YWx1ZX1cXG5gO1xuICAgICAgICB9KTtcbiAgICAgICAgbWFya2Rvd24gKz0gJ1xcbic7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWFya2Rvd247XG4gIH1cblxuICAvKipcbiAgICog44OG44K544OI5bGl5q2044Os44Od44O844OI44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlVGVzdEhpc3RvcnlSZXBvcnQocmVwb3J0czogVGVzdFJlcG9ydFtdKTogc3RyaW5nIHtcbiAgICBsZXQgbWFya2Rvd24gPSBgIyDjg4bjgrnjg4jlrp/ooYzlsaXmrbRcXG5cXG5gO1xuICAgIG1hcmtkb3duICs9IGAqKuacn+mWkzoqKiAke3JlcG9ydHNbcmVwb3J0cy5sZW5ndGggLSAxXS50aW1lc3RhbXAudG9Mb2NhbGVEYXRlU3RyaW5nKCdqYS1KUCcpfSAtICR7cmVwb3J0c1swXS50aW1lc3RhbXAudG9Mb2NhbGVEYXRlU3RyaW5nKCdqYS1KUCcpfVxcbmA7XG4gICAgbWFya2Rvd24gKz0gYCoq57eP5a6f6KGM5Zue5pWwOioqICR7cmVwb3J0cy5sZW5ndGh9XFxuXFxuYDtcblxuICAgIC8vIOWxpeattOODhuODvOODluODq1xuICAgIG1hcmtkb3duICs9ICcjIyDwn5OFIOWun+ihjOWxpeattFxcblxcbic7XG4gICAgbWFya2Rvd24gKz0gJ3wg5pel5pmCIHwg55Kw5aKDIHwg57eP5ZCI44K544Kz44KiIHwg5oiQ5Yqf546HIHwg5a6f6KGM5pmC6ZaTIHxcXG4nO1xuICAgIG1hcmtkb3duICs9ICd8LS0tLS0tfC0tLS0tLXwtLS0tLS0tLS0tLS18LS0tLS0tLS18LS0tLS0tLS0tLXxcXG4nO1xuICAgIFxuICAgIHJlcG9ydHMuZm9yRWFjaChyZXBvcnQgPT4ge1xuICAgICAgY29uc3Qgc3VjY2Vzc1JhdGUgPSAoKHJlcG9ydC5zdW1tYXJ5LnBhc3NlZFRlc3RzIC8gcmVwb3J0LnN1bW1hcnkudG90YWxUZXN0cykgKiAxMDApLnRvRml4ZWQoMSk7XG4gICAgICBjb25zdCB0b3RhbER1cmF0aW9uID0gcmVwb3J0LnN1aXRlUmVzdWx0cy5yZWR1Y2UoKHN1bSwgc3VpdGUpID0+IHN1bSArIHN1aXRlLmR1cmF0aW9uLCAwKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uTWludXRlcyA9ICh0b3RhbER1cmF0aW9uIC8gMTAwMCAvIDYwKS50b0ZpeGVkKDEpO1xuICAgICAgXG4gICAgICBtYXJrZG93biArPSBgfCAke3JlcG9ydC50aW1lc3RhbXAudG9Mb2NhbGVTdHJpbmcoJ2phLUpQJyl9IHwgJHtyZXBvcnQuZW52aXJvbm1lbnR9IHwgJHtyZXBvcnQuc3VtbWFyeS5vdmVyYWxsU2NvcmUudG9GaXhlZCgxKX0gfCAke3N1Y2Nlc3NSYXRlfSUgfCAke2R1cmF0aW9uTWludXRlc33liIYgfFxcbmA7XG4gICAgfSk7XG4gICAgbWFya2Rvd24gKz0gJ1xcbic7XG5cbiAgICByZXR1cm4gbWFya2Rvd247XG4gIH1cblxuICAvKipcbiAgICog44OI44Os44Oz44OJ5YiG5p6Q44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlVHJlbmRBbmFseXNpcyhyZXBvcnRzOiBUZXN0UmVwb3J0W10pOiBzdHJpbmcge1xuICAgIGxldCBhbmFseXNpcyA9ICcnO1xuICAgIFxuICAgIGlmIChyZXBvcnRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjb25zdCBsYXRlc3QgPSByZXBvcnRzWzBdO1xuICAgICAgY29uc3QgcHJldmlvdXMgPSByZXBvcnRzWzFdO1xuICAgICAgXG4gICAgICBjb25zdCBzY29yZURpZmYgPSBsYXRlc3Quc3VtbWFyeS5vdmVyYWxsU2NvcmUgLSBwcmV2aW91cy5zdW1tYXJ5Lm92ZXJhbGxTY29yZTtcbiAgICAgIGNvbnN0IHN1Y2Nlc3NSYXRlRGlmZiA9IChsYXRlc3Quc3VtbWFyeS5wYXNzZWRUZXN0cyAvIGxhdGVzdC5zdW1tYXJ5LnRvdGFsVGVzdHMpIC0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwcmV2aW91cy5zdW1tYXJ5LnBhc3NlZFRlc3RzIC8gcHJldmlvdXMuc3VtbWFyeS50b3RhbFRlc3RzKTtcbiAgICAgIFxuICAgICAgYW5hbHlzaXMgKz0gYOWJjeWbnuWun+ihjOOBqOOBruavlOi8gzpcXG5gO1xuICAgICAgYW5hbHlzaXMgKz0gYC0gKirjgrnjgrPjgqLlpInljJY6KiogJHtzY29yZURpZmYgPj0gMCA/ICcrJyA6ICcnfSR7c2NvcmVEaWZmLnRvRml4ZWQoMSl944Od44Kk44Oz44OIICR7c2NvcmVEaWZmID49IDAgPyAn8J+TiCcgOiAn8J+TiSd9XFxuYDtcbiAgICAgIGFuYWx5c2lzICs9IGAtICoq5oiQ5Yqf546H5aSJ5YyWOioqICR7c3VjY2Vzc1JhdGVEaWZmID49IDAgPyAnKycgOiAnJ30keyhzdWNjZXNzUmF0ZURpZmYgKiAxMDApLnRvRml4ZWQoMSl9JSAke3N1Y2Nlc3NSYXRlRGlmZiA+PSAwID8gJ/Cfk4gnIDogJ/Cfk4knfVxcblxcbmA7XG4gICAgICBcbiAgICAgIGlmIChzY29yZURpZmYgPiA1KSB7XG4gICAgICAgIGFuYWx5c2lzICs9ICfwn46JIOWTgeizquOBjOWkp+W5heOBq+WQkeS4iuOBl+OBpuOBhOOBvuOBme+8gVxcblxcbic7XG4gICAgICB9IGVsc2UgaWYgKHNjb3JlRGlmZiA+IDApIHtcbiAgICAgICAgYW5hbHlzaXMgKz0gJ+KchSDlk4Hos6rjgYzlkJHkuIrjgZfjgabjgYTjgb7jgZnjgIJcXG5cXG4nO1xuICAgICAgfSBlbHNlIGlmIChzY29yZURpZmYgPCAtNSkge1xuICAgICAgICBhbmFseXNpcyArPSAn4pqg77iPIOWTgeizquOBjOWkp+W5heOBq+S9juS4i+OBl+OBpuOBhOOBvuOBmeOAguimgeiqv+afu+OAglxcblxcbic7XG4gICAgICB9IGVsc2UgaWYgKHNjb3JlRGlmZiA8IDApIHtcbiAgICAgICAgYW5hbHlzaXMgKz0gJ/Cfk4kg5ZOB6LOq44GM44KE44KE5L2O5LiL44GX44Gm44GE44G+44GZ44CCXFxuXFxuJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFuYWx5c2lzICs9ICfinqHvuI8g5ZOB6LOq44Gv5a6J5a6a44GX44Gm44GE44G+44GZ44CCXFxuXFxuJztcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFuYWx5c2lzO1xuICB9XG5cbiAgLyoqXG4gICAqIOaLoeW8temBi+eUqOOCrOOCpOODieOBrueUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUV4dGVuZGVkT3BlcmF0aW9uYWxHdWlkZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8g44OH44OX44Ot44Kk44Oh44Oz44OI44Ks44Kk44OJXG4gICAgY29uc3QgZGVwbG95bWVudEd1aWRlID0gdGhpcy5nZW5lcmF0ZURlcGxveW1lbnRHdWlkZUV4dGVuZGVkKCk7XG4gICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ29wZXJhdGlvbnMvZGVwbG95bWVudC1ndWlkZS5tZCcsIGRlcGxveW1lbnRHdWlkZSk7XG5cbiAgICAvLyDjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4lcbiAgICBjb25zdCB0cm91Ymxlc2hvb3RpbmdHdWlkZSA9IHRoaXMuZ2VuZXJhdGVUcm91Ymxlc2hvb3RpbmdHdWlkZUV4dGVuZGVkKCk7XG4gICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ29wZXJhdGlvbnMvdHJvdWJsZXNob290aW5nLm1kJywgdHJvdWJsZXNob290aW5nR3VpZGUpO1xuXG4gICAgLy8g6YGL55So44OB44Kn44OD44Kv44Oq44K544OIXG4gICAgY29uc3Qgb3BlcmF0aW9uYWxDaGVja2xpc3QgPSB0aGlzLmdlbmVyYXRlT3BlcmF0aW9uYWxDaGVja2xpc3QoKTtcbiAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnb3BlcmF0aW9ucy9jaGVja2xpc3QubWQnLCBvcGVyYXRpb25hbENoZWNrbGlzdCk7XG5cbiAgICAvLyDnm6Poppbjg7vjgqLjg6njg7zjg4joqK3lrprjgqzjgqTjg4lcbiAgICBjb25zdCBtb25pdG9yaW5nR3VpZGUgPSB0aGlzLmdlbmVyYXRlTW9uaXRvcmluZ0d1aWRlRXh0ZW5kZWQoKTtcbiAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnb3BlcmF0aW9ucy9tb25pdG9yaW5nLm1kJywgbW9uaXRvcmluZ0d1aWRlKTtcblxuICAgIGNvbnNvbGUubG9nKCcgICDinIUg6YGL55So44Ks44Kk44OJ55Sf5oiQ5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICog44OI44Op44OW44Or44K344Ol44O844OG44Kj44Oz44Kw44Ks44Kk44OJ44Gu55Sf5oiQ77yIUGFydDLlrp/oo4XvvIlcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVUcm91Ymxlc2hvb3RpbmdHdWlkZUV4dGVuZGVkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAjIOODiOODqeODluODq+OCt+ODpeODvOODhuOCo+ODs+OCsOOCrOOCpOODiVxuXG4jIyDwn5qoIOOCiOOBj+OBguOCi+WVj+mhjOOBqOino+axuuaWueazlVxuXG4jIyMg44OH44OX44Ot44Kk44Oh44Oz44OI6Zai6YCjXG5cbiMjIyMgQ0RL44OH44OX44Ot44Kk44Ko44Op44O8XG4qKueXh+eKtioqOiBcXGBjZGsgZGVwbG95XFxgIOWun+ihjOaZguOBq+OCqOODqeODvOOBjOeZuueUn1xuKirljp/lm6AqKjog5qip6ZmQ5LiN6Laz44CB44Oq44K944O844K55Yi26ZmQ44CB6Kit5a6a44Of44K5XG4qKuino+axuuaWueazlSoqOlxuXFxgXFxgXFxgYmFzaFxuIyAxLiDmqKnpmZDnorroqo1cbmF3cyBzdHMgZ2V0LWNhbGxlci1pZGVudGl0eVxuXG4jIDIuIENES+ODluODvOODiOOCueODiOODqeODg+ODl+eiuuiqjVxubnB4IGNkayBib290c3RyYXAgLS1zaG93LXRlbXBsYXRlXG5cbiMgMy4g5beu5YiG56K66KqNXG5ucHggY2RrIGRpZmZcblxcYFxcYFxcYFxuXG4jIyMjIExhbWJkYemWouaVsOOCqOODqeODvFxuKirnl4fnirYqKjogTGFtYmRh6Zai5pWw44GM5q2j5bi444Gr5YuV5L2c44GX44Gq44GEXG4qKuWOn+WboCoqOiDkvp3lrZjplqLkv4LjgIHnkrDlooPlpInmlbDjgIHjgr/jgqTjg6DjgqLjgqbjg4joqK3lrppcbioq6Kej5rG65pa55rOVKio6XG5cXGBcXGBcXGBiYXNoXG4jIOODreOCsOeiuuiqjVxuYXdzIGxvZ3MgdGFpbCAvYXdzL2xhbWJkYS9mdW5jdGlvbi1uYW1lIC0tZm9sbG93XG5cbiMg55Kw5aKD5aSJ5pWw56K66KqNXG5hd3MgbGFtYmRhIGdldC1mdW5jdGlvbi1jb25maWd1cmF0aW9uIC0tZnVuY3Rpb24tbmFtZSBmdW5jdGlvbi1uYW1lXG5cXGBcXGBcXGBcblxuIyMjIOiqjeiovOmWoumAo1xuXG4jIyMjIOODreOCsOOCpOODs+WkseaVl1xuKirnl4fnirYqKjog44Om44O844K244O844GM44Ot44Kw44Kk44Oz44Gn44GN44Gq44GEXG4qKuWOn+WboCoqOiBDb2duaXRv6Kit5a6a44CB6KqN6Ki85oOF5aCx44Gu5LiN5pW05ZCIXG4qKuino+axuuaWueazlSoqOlxuXFxgXFxgXFxgYmFzaFxuIyBDb2duaXRv44Om44O844K244O844OX44O844Or56K66KqNXG5hd3MgY29nbml0by1pZHAgbGlzdC11c2VycyAtLXVzZXItcG9vbC1pZCB5b3VyLXBvb2wtaWRcblxuIyDjg6bjg7zjgrbjg7znirbmhYvnorroqo1cbmF3cyBjb2duaXRvLWlkcCBhZG1pbi1nZXQtdXNlciAtLXVzZXItcG9vbC1pZCB5b3VyLXBvb2wtaWQgLS11c2VybmFtZSB0ZXN0dXNlclxuXFxgXFxgXFxgXG5cbiMjIyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnplqLpgKNcblxuIyMjIyDlv5znrZTpgJ/luqbkvY7kuItcbioq55eH54q2Kio6IEFQSeODrOOCueODneODs+OCueOBjOmBheOBhFxuKirljp/lm6AqKjogTGFtYmRh5Ya35Y2044CBRHluYW1vRELliLbpmZDjgIFPcGVuU2VhcmNo6LKg6I23XG4qKuino+axuuaWueazlSoqOlxuXFxgXFxgXFxgYmFzaFxuIyBDbG91ZFdhdGNo44Oh44OI44Oq44Kv44K556K66KqNXG5hd3MgY2xvdWR3YXRjaCBnZXQtbWV0cmljLXN0YXRpc3RpY3MgLS1uYW1lc3BhY2UgQVdTL0xhbWJkYSAtLW1ldHJpYy1uYW1lIER1cmF0aW9uXG5cbiMgRHluYW1vRELjg6Hjg4jjg6rjgq/jgrnnorroqo1cbmF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyAtLW5hbWVzcGFjZSBBV1MvRHluYW1vREIgLS1tZXRyaWMtbmFtZSBDb25zdW1lZFJlYWRDYXBhY2l0eVVuaXRzXG5cXGBcXGBcXGBcblxuIyMg8J+UpyDoqLrmlq3jgrPjg57jg7Pjg4lcblxuIyMjIOOCt+OCueODhuODoOWFqOS9k+OBruWBpeWFqOaAp+ODgeOCp+ODg+OCr1xuXFxgXFxgXFxgYmFzaFxuIyEvYmluL2Jhc2hcbmVjaG8gXCI9PT0g44K344K544OG44Og6Ki65pat6ZaL5aeLID09PVwiXG5cbiMgTGFtYmRh6Zai5pWw54q25oWLXG5lY2hvIFwiTGFtYmRh6Zai5pWw54q25oWLOlwiXG5hd3MgbGFtYmRhIGxpc3QtZnVuY3Rpb25zIC0tcXVlcnkgJ0Z1bmN0aW9uc1s/c3RhcnRzX3dpdGgoRnVuY3Rpb25OYW1lLCBcXGByYWctXFxgKV0ue05hbWU6RnVuY3Rpb25OYW1lLFN0YXRlOlN0YXRlLFJ1bnRpbWU6UnVudGltZX0nXG5cbiMgRHluYW1vRELjg4bjg7zjg5bjg6vnirbmhYtcbmVjaG8gXCJEeW5hbW9EQuODhuODvOODluODq+eKtuaFizpcIlxuYXdzIGR5bmFtb2RiIGxpc3QtdGFibGVzIC0tcXVlcnkgJ1RhYmxlTmFtZXNbP3N0YXJ0c193aXRoKEAsIFxcYHJhZy1cXGApXSdcblxuIyBDbG91ZEZyb2506YWN5L+h54q25oWLXG5lY2hvIFwiQ2xvdWRGcm9udOmFjeS/oeeKtuaFizpcIlxuYXdzIGNsb3VkZnJvbnQgbGlzdC1kaXN0cmlidXRpb25zIC0tcXVlcnkgJ0Rpc3RyaWJ1dGlvbkxpc3QuSXRlbXNbXS57SWQ6SWQsU3RhdHVzOlN0YXR1cyxEb21haW5OYW1lOkRvbWFpbk5hbWV9J1xuXG5lY2hvIFwiPT09IOiouuaWreWujOS6hiA9PT1cIlxuXFxgXFxgXFxgXG5cbiMjIPCfk54g44Ko44K544Kr44Os44O844K344On44Oz5omL6aCGXG5cbiMjIyDjg6zjg5njg6sxOiDoh6rli5Xlvqnml6dcbjEuIOODmOODq+OCueODgeOCp+ODg+OCr+Wun+ihjFxuMi4g6Ieq5YuV5YaN6LW35YuVXG4zLiDjg63jgrDlj47pm4ZcblxuIyMjIOODrOODmeODqzI6IOaJi+WLleWvvuW/nFxuMS4g5oqA6KGT44OB44O844Og6YCa55+lXG4yLiDoqbPntLDoqr/mn7vplovlp4tcbjMuIOS4gOaZgueahOOBquWbnumBv+etluWun+aWvVxuXG4jIyMg44Os44OZ44OrMzog57eK5oCl5a++5b+cXG4xLiDjgqrjg7PjgrPjg7zjg6vmi4XlvZPogIXmi5vpm4ZcbjIuIOe3iuaApeODreODvOODq+ODkOODg+OCr+Wun+ihjFxuMy4g6aGn5a6i6YCa55+lXG5cbiMjIPCfk4sg6YCj57Wh5YWIXG5cbi0gKirmioDooZPjgrXjg53jg7zjg4gqKjogdGVjaC1zdXBwb3J0QGV4YW1wbGUuY29tXG4tICoq57eK5oCl6YCj57WhKio6IGVtZXJnZW5jeUBleGFtcGxlLmNvbVxuLSAqKuOCquODs+OCs+ODvOODqyoqOiArODEtWFgtWFhYWC1YWFhYXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIOmBi+eUqOODgeOCp+ODg+OCr+ODquOCueODiOOBrueUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZU9wZXJhdGlvbmFsQ2hlY2tsaXN0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAjIOmBi+eUqOODgeOCp+ODg+OCr+ODquOCueODiFxuXG4jIyDwn5OLIOaXpeasoeODgeOCp+ODg+OCr+mgheebrlxuXG4jIyMg44K344K544OG44Og55uj6KaWXG4tIFsgXSBDbG91ZFdhdGNo44Ki44Op44O844Og54q25oWL56K66KqNXG4tIFsgXSBMYW1iZGHplqLmlbDjgqjjg6njg7znjofnorroqo1cbi0gWyBdIER5bmFtb0RC5L2/55So6YeP56K66KqNXG4tIFsgXSBPcGVuU2VhcmNo44Kv44Op44K544K/44O854q25oWL56K66KqNXG4tIFsgXSBDbG91ZEZyb2506YWN5L+h54q25oWL56K66KqNXG5cbiMjIyDjgrvjgq3jg6Xjg6rjg4bjgqNcbi0gWyBdIFdBRuODluODreODg+OCr+eKtuazgeeiuuiqjVxuLSBbIF0g5LiN5q2j44Ki44Kv44K744K56Kmm6KGM56K66KqNXG4tIFsgXSBTU0zoqLzmmI7mm7jmnInlirnmnJ/pmZDnorroqo1cbi0gWyBdIElBTeODneODquOCt+ODvOWkieabtOeiuuiqjVxuXG4jIyMg44OR44OV44Kp44O844Oe44Oz44K5XG4tIFsgXSBBUEnlv5znrZTmmYLplpPnorroqo1cbi0gWyBdIOOCqOODqeODvOeOh+eiuuiqjVxuLSBbIF0g44K544Or44O844OX44OD44OI56K66KqNXG4tIFsgXSDjg6rjgr3jg7zjgrnkvb/nlKjnjofnorroqo1cblxuIyMg8J+ThSDpgLHmrKHjg4Hjgqfjg4Pjgq/poIXnm65cblxuIyMjIOODkOODg+OCr+OCouODg+ODl1xuLSBbIF0g44OH44O844K/44OQ44OD44Kv44Ki44OD44OX54q25oWL56K66KqNXG4tIFsgXSDjg5Djg4Pjgq/jgqLjg4Pjg5flvqnml6fjg4bjgrnjg4jlrp/mlr1cbi0gWyBdIOODreOCsOODreODvOODhuODvOOCt+ODp+ODs+eiuuiqjVxuXG4jIyMg5a656YeP566h55CGXG4tIFsgXSDjgrnjg4jjg6zjg7zjgrjkvb/nlKjph4/norroqo1cbi0gWyBdIOODh+ODvOOCv+ODmeODvOOCueWuuemHj+eiuuiqjVxuLSBbIF0g44Ot44Kw5a656YeP56K66KqNXG5cbiMjIyDjgrvjgq3jg6Xjg6rjg4bjgqNcbi0gWyBdIOOCu+OCreODpeODquODhuOCo+ODkeODg+ODgemBqeeUqOeKtuazgeeiuuiqjVxuLSBbIF0g6ISG5byx5oCn44K544Kt44Oj44Oz5a6f5pa9XG4tIFsgXSDjgqLjgq/jgrvjgrnjg63jgrDliIbmnpBcblxuIyMg8J+ThiDmnIjmrKHjg4Hjgqfjg4Pjgq/poIXnm65cblxuIyMjIOOCs+OCueODiOeuoeeQhlxuLSBbIF0gQVdT5Yip55So5paZ6YeR56K66KqNXG4tIFsgXSDjgrPjgrnjg4jmnIDpganljJbmqZ/kvJrnorroqo1cbi0gWyBdIOS6iOeul+OCouODqeODvOODiOioreWumueiuuiqjVxuXG4jIyMg54G95a6z5b6p5penXG4tIFsgXSDngb3lrrPlvqnml6fmiYvpoIbnorroqo1cbi0gWyBdIOW+qeaXp+ODhuOCueODiOWun+aWvVxuLSBbIF0g5omL6aCG5pu45pu05pawXG5cbiMjIyDjgrPjg7Pjg5fjg6njgqTjgqLjg7Pjgrlcbi0gWyBdIOebo+afu+ODreOCsOeiuuiqjVxuLSBbIF0g44Kz44Oz44OX44Op44Kk44Ki44Oz44K56KaB5Lu256K66KqNXG4tIFsgXSDjg4njgq3jg6Xjg6Hjg7Pjg4jmm7TmlrBcblxuIyMg4pqg77iPIOe3iuaApeaZguWvvuW/nFxuXG4jIyMg44Kk44Oz44K344OH44Oz44OI55m655Sf5pmCXG4xLiBbIF0g44Kk44Oz44K344OH44Oz44OI6KiY6Yyy6ZaL5aeLXG4yLiBbIF0g5b2x6Z+/56+E5Zuy54m55a6aXG4zLiBbIF0g6Zai5L+C6ICF6YCa55+lXG40LiBbIF0g5b+c5oCl5Yem572u5a6f5pa9XG41LiBbIF0g5qC55pys5Y6f5Zug6Kq/5p+7XG42LiBbIF0g5oGS5LmF5a++562W5a6f5pa9XG43LiBbIF0g5LqL5b6M44Os44OT44Ol44O85a6f5pa9XG5cbiMjIyDpgKPntaHkvZPliLZcbi0gKirjg6zjg5njg6sxKio6IOmBi+eUqOODgeODvOODoFxuLSAqKuODrOODmeODqzIqKjog5oqA6KGT44Oq44O844OA44O8XG4tICoq44Os44OZ44OrMyoqOiDnrqHnkIbogbfjg7vpoaflrqJcbmA7XG4gIH1cblxuICAvKipcbiAgICog55uj6KaW44O744Ki44Op44O844OI6Kit5a6a44Ks44Kk44OJ44Gu55Sf5oiQ77yIUGFydDLlrp/oo4XvvIlcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVNb25pdG9yaW5nR3VpZGVFeHRlbmRlZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgIyDnm6Poppbjg7vjgqLjg6njg7zjg4joqK3lrprjgqzjgqTjg4lcblxuIyMg8J+TiiDnm6Poppblr77osaHjg6Hjg4jjg6rjgq/jgrlcblxuIyMjIExhbWJkYemWouaVsFxuLSAqKkR1cmF0aW9uKio6IOWun+ihjOaZgumWk1xuLSAqKkVycm9ycyoqOiDjgqjjg6njg7zmlbBcbi0gKipUaHJvdHRsZXMqKjog44K544Ot44OD44OI44Oq44Oz44Kw5pWwXG4tICoqSW52b2NhdGlvbnMqKjog5a6f6KGM5Zue5pWwXG5cbiMjIyBEeW5hbW9EQlxuLSAqKkNvbnN1bWVkUmVhZENhcGFjaXR5VW5pdHMqKjog6Kqt44G/6L6844G/5a656YeP5L2/55So6YePXG4tICoqQ29uc3VtZWRXcml0ZUNhcGFjaXR5VW5pdHMqKjog5pu444GN6L6844G/5a656YeP5L2/55So6YePXG4tICoqVGhyb3R0bGVkUmVxdWVzdHMqKjog44K544Ot44OD44OI44Oq44Oz44Kw44GV44KM44Gf44Oq44Kv44Ko44K544OI5pWwXG5cbiMjIyBPcGVuU2VhcmNoXG4tICoqQ2x1c3RlclN0YXR1cyoqOiDjgq/jg6njgrnjgr/jg7znirbmhYtcbi0gKipTZWFyY2hMYXRlbmN5Kio6IOaknOe0ouODrOOCpOODhuODs+OCt1xuLSAqKkluZGV4aW5nTGF0ZW5jeSoqOiDjgqTjg7Pjg4fjg4Pjgq/jgrnkvZzmiJDjg6zjgqTjg4bjg7PjgrdcblxuIyMjIENsb3VkRnJvbnRcbi0gKipSZXF1ZXN0cyoqOiDjg6rjgq/jgqjjgrnjg4jmlbBcbi0gKipCeXRlc0Rvd25sb2FkZWQqKjog44OA44Km44Oz44Ot44O844OJ44OQ44Kk44OI5pWwXG4tICoqNHh4RXJyb3JSYXRlKio6IDR4eOOCqOODqeODvOeOh1xuLSAqKjV4eEVycm9yUmF0ZSoqOiA1eHjjgqjjg6njg7znjodcblxuIyMg8J+aqCDjgqLjg6njg7zjg4joqK3lrppcblxuIyMjIOmHjeimgeW6pjogQ3JpdGljYWxcbi0gTGFtYmRh6Zai5pWw44Ko44Op44O8546HID4gNSVcbi0gRHluYW1vRELjgrnjg63jg4Pjg4jjg6rjg7PjgrDnmbrnlJ9cbi0gT3BlblNlYXJjaOOCr+ODqeOCueOCv+ODvOODgOOCpuODs1xuLSBDbG91ZEZyb250IDV4eOOCqOODqeODvOeOhyA+IDElXG5cbiMjIyDph43opoHluqY6IFdhcm5pbmdcbi0gTGFtYmRh6Zai5pWw5a6f6KGM5pmC6ZaTID4gMTDnp5Jcbi0gRHluYW1vRELlrrnph4/kvb/nlKjnjocgPiA4MCVcbi0gT3BlblNlYXJjaOaknOe0ouODrOOCpOODhuODs+OCtyA+IDHnp5Jcbi0gQ2xvdWRGcm9udCA0eHjjgqjjg6njg7znjocgPiA1JVxuXG4jIyMg6YeN6KaB5bqmOiBJbmZvXG4tIOaWsOimj+ODpuODvOOCtuODvOeZu+mMslxuLSDlpKfph4/jg4fjg7zjgr/jgqLjg4Pjg5fjg63jg7zjg4lcbi0g55Ww5bi444Gq44OI44Op44OV44Kj44OD44Kv5aKX5YqgXG5cbiMjIPCfk4gg44OA44OD44K344Ol44Oc44O844OJ6Kit5a6aXG5cbiMjIyDjg6HjgqTjg7Pjg4Djg4Pjgrfjg6Xjg5zjg7zjg4lcbi0g44K344K544OG44Og5YWo5L2T44Gu5YGl5YWo5oCnXG4tIOS4u+imgeODoeODiOODquOCr+OCueOBruaZguezu+WIl+OCsOODqeODlVxuLSDjgqLjg6njg7zjg4jnirbms4HkuIDopqdcblxuIyMjIOips+e0sOODgOODg+OCt+ODpeODnOODvOODiVxuLSDjgrXjg7zjg5PjgrnliKXoqbPntLDjg6Hjg4jjg6rjgq/jgrlcbi0g44Ko44Op44O844Ot44Kw5YiG5p6QXG4tIOODkeODleOCqeODvOODnuODs+OCueWIhuaekFxuXG4jIyDwn5SUIOmAmuefpeioreWumlxuXG4jIyMg6YCa55+l44OB44Oj44ON44OrXG4tICoqRW1haWwqKjog6YeN6KaB44Gq44Ki44Op44O844OIXG4tICoqU2xhY2sqKjog5pel5bi455qE44Gq6YCa55+lXG4tICoqU01TKio6IOe3iuaApeaZguOBruOBv1xuXG4jIyMg6YCa55+l44Or44O844OrXG4tICoq5bmz5pelIDktMTjmmYIqKjog5YWo44Ki44Op44O844OI6YCa55+lXG4tICoq5aSc6ZaT44O75LyR5pelKio6IENyaXRpY2Fs44Gu44G/6YCa55+lXG4tICoq44Oh44Oz44OG44OK44Oz44K55pmCKio6IOmAmuefpeWBnOatolxuXG4jIyDwn5OLIOebo+imluaJi+mghlxuXG4jIyMg5pel5qyh55uj6KaWXG4xLiDjg4Djg4Pjgrfjg6Xjg5zjg7zjg4nnorroqo1cbjIuIOOCouODqeODvOODiOeKtuazgeeiuuiqjVxuMy4g55Ww5bi45YCk44Gu6Kq/5p+7XG40LiDlv4XopoHjgavlv5zjgZjjgablr77lv5xcblxuIyMjIOmAseasoeODrOODk+ODpeODvFxuMS4g44OI44Os44Oz44OJ5YiG5p6QXG4yLiDlrrnph4/oqIjnlLvopovnm7TjgZdcbjMuIOOCouODqeODvOODiOmWvuWApOiqv+aVtFxuNC4g55uj6KaW6aCF55uu6L+95Yqg5qSc6KiOXG5cbiMjIyDmnIjmrKHjg6zjg53jg7zjg4hcbjEuIOWPr+eUqOaAp+ODrOODneODvOODiOS9nOaIkFxuMi4g44OR44OV44Kp44O844Oe44Oz44K55YiG5p6QXG4zLiDmlLnlloTmj5DmoYjkvZzmiJBcbjQuIOebo+imluS9k+WItuimi+ebtOOBl1xuYDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4fjg5fjg63jgqTjg6Hjg7Pjg4jjgqzjgqTjg4njga7nlJ/miJDvvIhQYXJ0MuWun+ijhe+8iVxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZURlcGxveW1lbnRHdWlkZUV4dGVuZGVkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAjIOODh+ODl+ODreOCpOODoeODs+ODiOOCrOOCpOODiVxuXG4jIyDwn5qAIOamguimgVxuXG5QZXJtaXNzaW9uLWF3YXJlIFJBRyBTeXN0ZW0g44Gu5q616ZqO55qE44OH44OX44Ot44Kk44Oh44Oz44OI5omL6aCG44KS6Kqs5piO44GX44G+44GZ44CCXG5cbiMjIPCfk4sg5YmN5o+Q5p2h5Lu2XG5cbiMjIyDlv4XopoHjgarjg4Tjg7zjg6tcbi0gQVdTIENMSSB2Mi54XG4tIE5vZGUuanMgMjAueFxuLSBBV1MgQ0RLIHYyLnhcbi0gRG9ja2VyXG5cbiMjIyDlv4XopoHjgarmqKnpmZBcbi0gQWRtaW5pc3RyYXRvckFjY2VzcyDjgb7jgZ/jga/ku6XkuIvjga7mqKnpmZA6XG4gIC0gQ2xvdWRGb3JtYXRpb25cbiAgLSBMYW1iZGFcbiAgLSBEeW5hbW9EQlxuICAtIE9wZW5TZWFyY2hcbiAgLSBGU3hcbiAgLSBDb2duaXRvXG4gIC0gQ2xvdWRGcm9udFxuICAtIFdBRlxuXG4jIyDwn5SnIOeSsOWig+ioreWumlxuXG4jIyMgMS4gQVdT6KqN6Ki85oOF5aCx44Gu6Kit5a6aXG5cblxcYFxcYFxcYGJhc2hcbiMgQVdTIENMSeOBruioreWumlxuYXdzIGNvbmZpZ3VyZVxuXG4jIOOBvuOBn+OBr+eSsOWig+WkieaVsOOBp+OBruioreWumlxuZXhwb3J0IEFXU19BQ0NFU1NfS0VZX0lEPXlvdXItYWNjZXNzLWtleVxuZXhwb3J0IEFXU19TRUNSRVRfQUNDRVNTX0tFWT15b3VyLXNlY3JldC1rZXlcbmV4cG9ydCBBV1NfREVGQVVMVF9SRUdJT049dXMtZWFzdC0xXG5cXGBcXGBcXGBcblxuIyMjIDIuIOeSsOWig+WkieaVsOOBruioreWumlxuXG5cXGBcXGBcXGBiYXNoXG4jIOW/hemgiOeSsOWig+WkieaVsFxuZXhwb3J0IFBST0pFQ1RfTkFNRT1yYWctc3lzdGVtXG5leHBvcnQgRU5WSVJPTk1FTlQ9cHJvZHVjdGlvblxuZXhwb3J0IERPTUFJTl9OQU1FPXlvdXItZG9tYWluLmNvbVxuZXhwb3J0IENFUlRJRklDQVRFX0FSTj1hcm46YXdzOmFjbTouLi5cbmV4cG9ydCBIT1NURURfWk9ORV9JRD1aMTIzNDU2Nzg5MEFCQ1xuXFxgXFxgXFxgXG5cbiMjIPCfk6Yg5q616ZqO55qE44OH44OX44Ot44Kk44Oh44Oz44OIXG5cbiMjIyBQaGFzZSAxOiDjgqTjg7Pjg5Xjg6njgrnjg4jjg6njgq/jg4Hjg6NcblxuXFxgXFxgXFxgYmFzaFxuIyAxLiDkvp3lrZjplqLkv4Ljga7jgqTjg7Pjgrnjg4jjg7zjg6tcbm5wbSBpbnN0YWxsXG5cbiMgMi4gQ0RL44OW44O844OI44K544OI44Op44OD44OX77yI5Yid5Zue44Gu44G/77yJXG5ucHggY2RrIGJvb3RzdHJhcFxuXG4jIDMuIOODjeODg+ODiOODr+ODvOOCreODs+OCsOOCueOCv+ODg+OCr+OBruODh+ODl+ODreOCpFxubnB4IGNkayBkZXBsb3kgTmV0d29ya2luZ1N0YWNrXG5cbiMgNC4g44K744Kt44Ol44Oq44OG44Kj44K544K/44OD44Kv44Gu44OH44OX44Ot44KkXG5ucHggY2RrIGRlcGxveSBTZWN1cml0eVN0YWNrXG5cbiMgNS4g44OH44O844K/44K544K/44OD44Kv44Gu44OH44OX44Ot44KkXG5ucHggY2RrIGRlcGxveSBEYXRhU3RhY2tcblxcYFxcYFxcYFxuXG4jIyMgUGhhc2UgMjog44Ki44OX44Oq44Kx44O844K344On44OzXG5cblxcYFxcYFxcYGJhc2hcbiMgMS4g44Kz44Oz44OU44Ol44O844OI44K544K/44OD44Kv44Gu44OH44OX44Ot44KkXG5ucHggY2RrIGRlcGxveSBDb21wdXRlU3RhY2tcblxuIyAyLiBXZWJBcHDjgrnjgr/jg4Pjgq/jga7jg4fjg5fjg63jgqRcbm5weCBjZGsgZGVwbG95IFdlYkFwcFN0YWNrXG5cbiMgMy4g44Kq44Oa44Os44O844K344On44Oz44K544K/44OD44Kv44Gu44OH44OX44Ot44KkXG5ucHggY2RrIGRlcGxveSBPcGVyYXRpb25zU3RhY2tcblxcYFxcYFxcYFxuXG4jIyMgUGhhc2UgMzog5qSc6Ki8XG5cblxcYFxcYFxcYGJhc2hcbiMgMS4g57Wx5ZCI44OG44K544OI44Gu5a6f6KGMXG5ucG0gcnVuIHRlc3Q6aW50ZWdyYXRlZFxuXG4jIDIuIOODmOODq+OCueODgeOCp+ODg+OCr1xuY3VybCBodHRwczovL3lvdXItZG9tYWluLmNvbS9hcGkvaGVhbHRoXG5cbiMgMy4g5qmf6IO944OG44K544OIXG5ucG0gcnVuIHRlc3Q6ZnVuY3Rpb25hbFxuXFxgXFxgXFxgXG5cbiMjIPCflIQg44Ot44O844Or44OQ44OD44Kv5omL6aCGXG5cbiMjIyDnt4rmgKXjg63jg7zjg6vjg5Djg4Pjgq9cblxuXFxgXFxgXFxgYmFzaFxuIyAxLiDliY3jga7jg5Djg7zjgrjjg6fjg7Pjga7jgr/jgrDjgpLnorroqo1cbmdpdCB0YWcgLWxcblxuIyAyLiDliY3jga7jg5Djg7zjgrjjg6fjg7Pjgavjg4Hjgqfjg4Pjgq/jgqLjgqbjg4hcbmdpdCBjaGVja291dCB2MS4wLjBcblxuIyAzLiDnt4rmgKXjg4fjg5fjg63jgqRcbm5weCBjZGsgZGVwbG95IC0tYWxsIC0tcmVxdWlyZS1hcHByb3ZhbCBuZXZlclxuXFxgXFxgXFxgXG5cbiMjIyDmrrXpmo7nmoTjg63jg7zjg6vjg5Djg4Pjgq9cblxuXFxgXFxgXFxgYmFzaFxuIyAxLiBXZWJBcHDjgrnjgr/jg4Pjgq/jga7jg63jg7zjg6vjg5Djg4Pjgq9cbm5weCBjZGsgZGVwbG95IFdlYkFwcFN0YWNrIC0tcHJldmlvdXMtcGFyYW1ldGVyc1xuXG4jIDIuIOWLleS9nOeiuuiqjVxuY3VybCBodHRwczovL3lvdXItZG9tYWluLmNvbS9hcGkvaGVhbHRoXG5cbiMgMy4g5ZWP6aGM44GM6Kej5rG644GX44Gq44GE5aC05ZCI44Gv5LuW44Gu44K544K/44OD44Kv44KC44Ot44O844Or44OQ44OD44KvXG5ucHggY2RrIGRlcGxveSBDb21wdXRlU3RhY2sgLS1wcmV2aW91cy1wYXJhbWV0ZXJzXG5cXGBcXGBcXGBcblxuIyMg8J+TiiDjg4fjg5fjg63jgqTjg6Hjg7Pjg4jlvozjga7norroqo1cblxuIyMjIDEuIOOCteODvOODk+OCueeKtuaFi+eiuuiqjVxuXG5cXGBcXGBcXGBiYXNoXG4jIExhbWJkYemWouaVsOOBrueKtuaFi+eiuuiqjVxuYXdzIGxhbWJkYSBsaXN0LWZ1bmN0aW9ucyAtLXF1ZXJ5ICdGdW5jdGlvbnNbP3N0YXJ0c193aXRoKEZ1bmN0aW9uTmFtZSwgXFxgcmFnLVxcYCldLntOYW1lOkZ1bmN0aW9uTmFtZSxTdGF0ZTpTdGF0ZX0nXG5cbiMgRHluYW1vRELjg4bjg7zjg5bjg6vjga7nirbmhYvnorroqo1cbmF3cyBkeW5hbW9kYiBsaXN0LXRhYmxlcyAtLXF1ZXJ5ICdUYWJsZU5hbWVzWz9zdGFydHNfd2l0aChALCBcXGByYWctXFxgKV0nXG5cbiMgT3BlblNlYXJjaOODieODoeOCpOODs+OBrueKtuaFi+eiuuiqjVxuYXdzIG9wZW5zZWFyY2ggbGlzdC1kb21haW4tbmFtZXMgLS1xdWVyeSAnRG9tYWluTmFtZXNbP3N0YXJ0c193aXRoKERvbWFpbk5hbWUsIFxcYHJhZy1cXGApXS5Eb21haW5OYW1lJ1xuXFxgXFxgXFxgXG5cbiMjIyAyLiDjgqjjg7Pjg4njg53jgqTjg7Pjg4jnorroqo1cblxuXFxgXFxgXFxgYmFzaFxuIyDjg5jjg6vjgrnjg4Hjgqfjg4Pjgq9cbmN1cmwgLWYgaHR0cHM6Ly95b3VyLWRvbWFpbi5jb20vYXBpL2hlYWx0aFxuXG4jIOiqjeiovOOCqOODs+ODieODneOCpOODs+ODiFxuY3VybCAtWCBQT1NUIGh0dHBzOi8veW91ci1kb21haW4uY29tL2FwaS9hdXRoL2xvZ2luIFxcXFxcbiAgLUggXCJDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25cIiBcXFxcXG4gIC1kICd7XCJ1c2VybmFtZVwiOlwidGVzdHVzZXJcIixcInBhc3N3b3JkXCI6XCJ0ZXN0cGFzc1wifSdcblxuIyDjg4Hjg6Pjg4Pjg4jjgqjjg7Pjg4njg53jgqTjg7Pjg4jvvIjoqo3oqLzlvozvvIlcbmN1cmwgLVggUE9TVCBodHRwczovL3lvdXItZG9tYWluLmNvbS9hcGkvY2hhdCBcXFxcXG4gIC1IIFwiQXV0aG9yaXphdGlvbjogQmVhcmVyIDx0b2tlbj5cIiBcXFxcXG4gIC1IIFwiQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXCIgXFxcXFxuICAtZCAne1wibWVzc2FnZVwiOlwiSGVsbG9cIn0nXG5cXGBcXGBcXGBcblxuIyMg4pqg77iPIOazqOaEj+S6i+mghVxuXG4jIyMg44K744Kt44Ol44Oq44OG44KjXG4tIOacrOeVqueSsOWig+OBp+OBr+W/heOBmkhUVFBT6YCa5L+h44KS5L2/55SoXG4tIFdBRuODq+ODvOODq+OBjOmBqeWIh+OBq+ioreWumuOBleOCjOOBpuOBhOOCi+OBk+OBqOOCkueiuuiqjVxuLSDoqo3oqLzjgYzmraPluLjjgavli5XkvZzjgZnjgovjgZPjgajjgpLnorroqo1cblxuIyMjIOODkeODleOCqeODvOODnuODs+OCuVxuLSBMYW1iZGHplqLmlbDjga7jgrPjg7zjg6vjg4njgrnjgr/jg7zjg4jmmYLplpPjgpLnm6PoppZcbi0gRHluYW1vRELjga7oqq3jgb/mm7jjgY3jgq3jg6Pjg5Hjgrfjg4bjgqPjgpLnm6PoppZcbi0gT3BlblNlYXJjaOOBruOCr+OCqOODquODkeODleOCqeODvOODnuODs+OCueOCkuebo+imllxuXG4jIyMg44Kz44K544OIXG4tIOS4jeimgeOBquODquOCveODvOOCueOBjOS9nOaIkOOBleOCjOOBpuOBhOOBquOBhOOBi+eiuuiqjVxuLSDkuojmg7PjgrPjgrnjg4jjgajlrp/pmpvjga7jgrPjgrnjg4jjgpLmr5TovINcbi0g44Kz44K544OI44Ki44Op44O844OI44GM6Kit5a6a44GV44KM44Gm44GE44KL44GT44Go44KS56K66KqNXG5cbiMjIPCfhpgg57eK5oCl5pmC44Gu6YCj57Wh5YWIXG5cbi0gKirmioDooZPjgrXjg53jg7zjg4gqKjogdGVjaC1zdXBwb3J0QGV4YW1wbGUuY29tXG4tICoq6YGL55So44OB44O844OgKio6IG9wZXJhdGlvbnNAZXhhbXBsZS5jb21cbi0gKirjgqrjg7PjgrPjg7zjg6sqKjogKzgxLVhYLVhYWFgtWFhYWFxuYDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgqTjg7Pjg4fjg4Pjgq/jgrnjg5rjg7zjgrjjga7nlJ/miJBcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlSW5kZXhQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGluZGV4Q29udGVudCA9IGAjICR7dGhpcy5jb25maWcucHJvamVjdE5hbWV9IOODieOCreODpeODoeODs+ODiFxuXG7jg5Djg7zjgrjjg6fjg7M6ICR7dGhpcy5jb25maWcudmVyc2lvbn0gIFxu55Sf5oiQ5pel5pmCOiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoJ2phLUpQJyl9XG5cbiMjIPCfk5og44OJ44Kt44Ol44Oh44Oz44OI5LiA6KanXG5cbiMjIyBBUEkg44OJ44Kt44Ol44Oh44Oz44OIXG4tIFtBUEkg44Oq44OV44Kh44Os44Oz44K5XSguL2FwaS9SRUFETUUubWQpXG4tIFtPcGVuQVBJIOS7leanmF0oLi9hcGkvb3BlbmFwaS5qc29uKVxuJHt0aGlzLmNvbmZpZy5mb3JtYXRzLmluY2x1ZGVzKCdodG1sJykgPyAnLSBbQVBJIOODieOCreODpeODoeODs+ODiCAoSFRNTCldKC4vYXBpL2luZGV4Lmh0bWwpJyA6ICcnfVxuXG4jIyMg44Ki44O844Kt44OG44Kv44OB44OjXG4tIFvjgrfjgrnjg4bjg6DjgqLjg7zjgq3jg4bjgq/jg4Hjg6NdKC4vYXJjaGl0ZWN0dXJlL1JFQURNRS5tZClcbi0gW+OCouODvOOCreODhuOCr+ODgeODo+Wbs10oLi9hcmNoaXRlY3R1cmUvc3lzdGVtLWFyY2hpdGVjdHVyZS5tZClcblxuIyMjIOODhuOCueODiOODrOODneODvOODiFxuLSBb57Wx5ZCI44OG44K544OI44Os44Od44O844OIXSguL3Rlc3RzL2ludGVncmF0ZWQtdGVzdC1yZXBvcnQubWQpXG4tIFvjg4bjgrnjg4jlsaXmrbRdKC4vdGVzdHMvdGVzdC1oaXN0b3J5Lm1kKVxuXG4jIyMg6YGL55So44Ks44Kk44OJXG4tIFvjg4fjg5fjg63jgqTjg6Hjg7Pjg4jjgqzjgqTjg4ldKC4vb3BlcmF0aW9ucy9kZXBsb3ltZW50LWd1aWRlLm1kKVxuLSBb44OI44Op44OW44Or44K344Ol44O844OG44Kj44Oz44KwXSguL29wZXJhdGlvbnMvdHJvdWJsZXNob290aW5nLm1kKVxuLSBb6YGL55So44OB44Kn44OD44Kv44Oq44K544OIXSguL29wZXJhdGlvbnMvY2hlY2tsaXN0Lm1kKVxuLSBb55uj6KaW44O744Ki44Op44O844OI6Kit5a6aXSguL29wZXJhdGlvbnMvbW9uaXRvcmluZy5tZClcblxuIyMg8J+UlyDplqLpgKPjg6rjg7Pjgq9cblxuLSBb44OX44Ot44K444Kn44Kv44OI44Oq44Od44K444OI44OqXShodHRwczovL2dpdGh1Yi5jb20veW91ci1vcmcvcGVybWlzc2lvbi1hd2FyZS1yYWcpXG4tIFvmnKznlarnkrDlooNdKGh0dHBzOi8veW91ci1kb21haW4uY29tKVxuLSBb44K544OG44O844K444Oz44Kw55Kw5aKDXShodHRwczovL3N0YWdpbmcueW91ci1kb21haW4uY29tKVxuXG4tLS1cblxu44GT44Gu44OJ44Kt44Ol44Oh44Oz44OI44Gv6Ieq5YuV55Sf5oiQ44GV44KM44Gm44GE44G+44GZ44CCICBcbuacgOe1guabtOaWsDogJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCdqYS1KUCcpfVxuYDtcblxuICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKCdSRUFETUUubWQnLCBpbmRleENvbnRlbnQpO1xuICB9XG59Il19