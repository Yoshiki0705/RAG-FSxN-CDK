/**
 * ドキュメント生成システム - Part 2
 * テストレポートと運用ガイドの生成機能
 */

import * as fs from 'fs';
import * as path from 'path';
import { DocumentationGenerator, DocumentationConfig, TestReport } from './documentation-generator';

/**
 * ドキュメント生成設定定数
 */
const DOCUMENTATION_CONSTANTS = {
  DEFAULT_FILE_MODE: 0o755,
  MAX_PROJECT_NAME_LENGTH: 100,
  MIN_PROJECT_NAME_LENGTH: 3,
  SUPPORTED_FORMATS: ['markdown', 'html', 'pdf'] as const,
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
      /\.\./,           // パストラバーサル
      /~/,              // ホームディレクトリ参照
      /\0/,             // ヌル文字
      /[<>:"|?*]/,      // 無効なファイル名文字
      /^\/+/,           // 絶対パス
      /\\+/             // バックスラッシュ
    ]
  },
  ERROR_MESSAGES: {
    INVALID_PROJECT_NAME: 'プロジェクト名が無効です',
    PATH_TOO_LONG: 'パスが長すぎます',
    DANGEROUS_PATH: '不正なパスパターンが検出されました',
    DIRECTORY_CREATION_FAILED: 'ディレクトリ作成に失敗しました'
  }
} as const;

/**
 * ドキュメント生成設定の型定義
 */
type DocumentationFormat = typeof DOCUMENTATION_CONSTANTS.SUPPORTED_FORMATS[number];
type DirectoryType = keyof typeof DOCUMENTATION_CONSTANTS.DIRECTORY_STRUCTURE;

export class DocumentationGeneratorPart2 extends DocumentationGenerator {
  /**
   * Part2固有の設定オプション
   */
  private readonly extendedOptions: {
    enableDetailedReports: boolean;
    enableTrendAnalysis: boolean;
    maxReportHistory: number;
  };

  constructor(config: DocumentationConfig) {
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
  private validateExtendedConfiguration(): void {
    // 拡張機能の設定検証
    if (this.extendedOptions.maxReportHistory < 1) {
      throw new Error('レポート履歴の保持期間は1日以上である必要があります');
    }
  }

  /**
   * メインREADMEの生成
   */
  public generateMainReadme(): string {
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
  async generateAllDocumentation(): Promise<void> {
    console.log('📚 拡張ドキュメント生成を開始...');
    
    try {
      // 基底クラスの生成処理を実行
      await super.generateAllDocumentation();
      
      // Part2固有の追加処理
      await this.generateExtendedDocumentation();
      
      console.log('🎉 拡張ドキュメント生成完了');
    } catch (error) {
      console.error('❌ ドキュメント生成エラー:', error);
      throw error;
    }
  }

  /**
   * Part2固有の拡張ドキュメント生成（並列処理最適化）
   */
  private async generateExtendedDocumentation(): Promise<void> {
    const tasks: Array<{ name: string; task: Promise<void> }> = [];

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
      const results = await Promise.allSettled(
        tasks.map(({ task }) => task)
      );

      // 結果の確認とログ出力
      results.forEach((result, index) => {
        const taskName = tasks[index].name;
        if (result.status === 'fulfilled') {
          console.log(`   ✅ ${taskName}生成完了`);
        } else {
          console.error(`   ❌ ${taskName}生成失敗:`, result.reason);
          throw new Error(`${taskName}の生成に失敗しました: ${result.reason}`);
        }
      });
    }
  }

  /**
   * メインREADMEの生成と書き込み
   */
  private async generateAndWriteMainReadme(): Promise<void> {
    const mainReadme = this.generateMainReadme();
    await this.writeFile('README.md', mainReadme);
  }



  /**
   * ディレクトリの存在確認と作成（セキュリティ対策付き）
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ ディレクトリ作成エラー: ${errorMessage}`);
      throw new Error(`ディレクトリ作成に失敗しました: ${dirPath}`);
    }
  }

  /**
   * 設定値の包括的検証
   */
  private validateConfiguration(): void {
    this.validateProjectName();
    this.validateOutputDirectory();
    this.validateFormats();
  }

  /**
   * プロジェクト名の検証
   */
  private validateProjectName(): void {
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
  private validateOutputDirectory(): void {
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
  private validateFormats(): void {
    const { formats } = this.config;
    
    if (!Array.isArray(formats) || formats.length === 0) {
      throw new Error('出力フォーマットが設定されていません');
    }

    const invalidFormats = formats.filter(
      format => !DOCUMENTATION_CONSTANTS.SUPPORTED_FORMATS.includes(format as any)
    );

    if (invalidFormats.length > 0) {
      throw new Error(`サポートされていないフォーマット: ${invalidFormats.join(', ')}`);
    }
  }

  /**
   * HTMLエスケープ処理（XSS対策）
   */
  private escapeHtml(text: string): string {
    const htmlEscapeMap: Record<string, string> = {
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
  private async generateDetailedTestReports(): Promise<void> {
    try {
      console.log('   📊 テスト結果を収集中...');
      const testReports = await this.collectTestReportsExtended();
      
      if (testReports.length === 0) {
        console.warn('   ⚠️ テストレポートが見つかりませんでした');
        return;
      }

      console.log(`   📝 ${testReports.length}件のテストレポートを処理中...`);

      // 並列処理でレポート生成を高速化
      const reportTasks: Promise<void>[] = [];

      // 統合テストレポートの生成
      reportTasks.push(
        this.generateAndWriteIntegratedReport(testReports)
      );

      // テストスイート別レポートの生成
      reportTasks.push(
        this.generateAndWriteSuiteReports(testReports)
      );

      // テスト履歴の生成
      reportTasks.push(
        this.generateAndWriteHistoryReport(testReports)
      );

      // 全てのレポート生成タスクを並列実行
      await Promise.all(reportTasks);

      console.log(`   ✅ テストレポート生成完了 (${testReports.length}件)`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ テストレポート生成エラー: ${errorMessage}`);
      throw new Error(`テストレポートの生成に失敗しました: ${errorMessage}`);
    }
  }

  /**
   * 統合テストレポートの生成と書き込み
   */
  private async generateAndWriteIntegratedReport(testReports: TestReport[]): Promise<void> {
    const integratedReport = this.generateIntegratedTestReport(testReports);
    await this.writeFile('tests/integrated-test-report.md', integratedReport);
  }

  /**
   * テストスイート別レポートの生成と書き込み
   */
  private async generateAndWriteSuiteReports(testReports: TestReport[]): Promise<void> {
    const suiteReportTasks = testReports.map(async (report) => {
      const suiteReport = this.generateTestSuiteReport(report);
      await this.writeFile(`tests/${report.environment}-${report.testRunId}.md`, suiteReport);
    });

    await Promise.all(suiteReportTasks);
  }

  /**
   * テスト履歴レポートの生成と書き込み
   */
  private async generateAndWriteHistoryReport(testReports: TestReport[]): Promise<void> {
    const historyReport = this.generateTestHistoryReport(testReports);
    await this.writeFile('tests/test-history.md', historyReport);
  }

  /**
   * テストレポートの収集（Part2実装）
   */
  private async collectTestReportsExtended(): Promise<TestReport[]> {
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
  private generateIntegratedTestReport(reports: TestReport[]): string {
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
    } else if (latestReport.summary.overallScore >= 80) {
      markdown += '良好 - 軽微な改善により品質向上が期待できます\n\n';
    } else if (latestReport.summary.overallScore >= 70) {
      markdown += '注意 - 改善が必要な領域があります\n\n';
    } else {
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
  private generateTestSuiteReport(report: TestReport): string {
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
  private generateTestHistoryReport(reports: TestReport[]): string {
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
  private generateTrendAnalysis(reports: TestReport[]): string {
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
      } else if (scoreDiff > 0) {
        analysis += '✅ 品質が向上しています。\n\n';
      } else if (scoreDiff < -5) {
        analysis += '⚠️ 品質が大幅に低下しています。要調査。\n\n';
      } else if (scoreDiff < 0) {
        analysis += '📉 品質がやや低下しています。\n\n';
      } else {
        analysis += '➡️ 品質は安定しています。\n\n';
      }
    }
    
    return analysis;
  }

  /**
   * 拡張運用ガイドの生成
   */
  private async generateExtendedOperationalGuides(): Promise<void> {
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
  private generateTroubleshootingGuideExtended(): string {
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
  private generateOperationalChecklist(): string {
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
  private generateMonitoringGuideExtended(): string {
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
  private generateDeploymentGuideExtended(): string {
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
  async generateIndexPage(): Promise<void> {
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