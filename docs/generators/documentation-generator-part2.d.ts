/**
 * ドキュメント生成システム - Part 2
 * テストレポートと運用ガイドの生成機能
 */
import { DocumentationGenerator, DocumentationConfig } from './documentation-generator';
export declare class DocumentationGeneratorPart2 extends DocumentationGenerator {
    /**
     * Part2固有の設定オプション
     */
    private readonly extendedOptions;
    constructor(config: DocumentationConfig);
    /**
     * Part2固有の設定検証
     */
    private validateExtendedConfiguration;
    /**
     * メインREADMEの生成
     */
    generateMainReadme(): string;
    /**
     * 全ドキュメントの生成（拡張版）
     */
    generateAllDocumentation(): Promise<void>;
    /**
     * Part2固有の拡張ドキュメント生成（並列処理最適化）
     */
    private generateExtendedDocumentation;
    /**
     * メインREADMEの生成と書き込み
     */
    private generateAndWriteMainReadme;
    /**
     * ディレクトリの存在確認と作成（セキュリティ対策付き）
     */
    private ensureDirectoryExists;
    /**
     * 設定値の包括的検証
     */
    private validateConfiguration;
    /**
     * プロジェクト名の検証
     */
    private validateProjectName;
    /**
     * 出力ディレクトリの検証
     */
    private validateOutputDirectory;
    /**
     * フォーマット設定の検証
     */
    private validateFormats;
    /**
     * HTMLエスケープ処理（XSS対策）
     */
    private escapeHtml;
    /**
     * 詳細テストレポートの生成（エラーハンドリング強化版）
     */
    private generateDetailedTestReports;
    /**
     * 統合テストレポートの生成と書き込み
     */
    private generateAndWriteIntegratedReport;
    /**
     * テストスイート別レポートの生成と書き込み
     */
    private generateAndWriteSuiteReports;
    /**
     * テスト履歴レポートの生成と書き込み
     */
    private generateAndWriteHistoryReport;
    /**
     * テストレポートの収集（Part2実装）
     */
    private collectTestReportsExtended;
    /**
     * 統合テストレポートの生成
     */
    private generateIntegratedTestReport;
    /**
     * テストスイート別レポートの生成
     */
    private generateTestSuiteReport;
    /**
     * テスト履歴レポートの生成
     */
    private generateTestHistoryReport;
    /**
     * トレンド分析の生成
     */
    private generateTrendAnalysis;
    /**
     * 拡張運用ガイドの生成
     */
    private generateExtendedOperationalGuides;
    /**
     * トラブルシューティングガイドの生成（Part2実装）
     */
    private generateTroubleshootingGuideExtended;
    /**
     * 運用チェックリストの生成
     */
    private generateOperationalChecklist;
    /**
     * 監視・アラート設定ガイドの生成（Part2実装）
     */
    private generateMonitoringGuideExtended;
    /**
     * デプロイメントガイドの生成（Part2実装）
     */
    private generateDeploymentGuideExtended;
    /**
     * インデックスページの生成
     */
    generateIndexPage(): Promise<void>;
}
