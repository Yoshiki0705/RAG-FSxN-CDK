/**
 * 統合レポート生成システム
 *
 * 全テストモジュールの結果を統合し、包括的なレポートを生成
 * - エグゼクティブサマリー
 * - 詳細分析レポート
 * - パフォーマンス分析
 * - セキュリティ評価
 * - 品質スコア算出
 */
interface ReportConfig {
    outputDirectory: string;
    formats: ('json' | 'html' | 'pdf' | 'csv')[];
    includeScreenshots: boolean;
    includeDetailedLogs: boolean;
    includePerformanceCharts: boolean;
    includeSecurityAnalysis: boolean;
    generateExecutiveSummary: boolean;
    customBranding?: BrandingConfig;
}
interface BrandingConfig {
    companyName: string;
    logoPath?: string;
    primaryColor: string;
    secondaryColor: string;
    reportTitle: string;
}
/**
 * 統合レポート生成クラス
 */
export declare class IntegrationReportGenerator {
    private config;
    constructor(config: ReportConfig);
    /**
     * 統合レポートの生成
     */
    generateReport(testResults: any): Promise<string[]>;
    /**
     * レポートデータの構築
     */
    private buildReportData;
    /**
     * エグゼクティブサマリーの構築
     */
    private buildExecutiveSummary;
    /**
     * 重要な問題の抽出
     */
    private extractCriticalIssues;
    /**
     * 主要推奨事項の生成
     */
    private generateKeyRecommendations;
    /**
     * 主要メトリクスの計算
     */
    private calculateKeyMetrics;
    /**
     * モジュール別結果の構築
     */
    private buildModuleResults;
    /**
     * モジュールステータスの判定
     */
    private determineModuleStatus;
    /**
     * モジュール問題の抽出
     */
    private extractModuleIssues;
    /**
     * 統合分析の実行
     */
    private performIntegratedAnalysis;
    /**
     * パフォーマンス分析
     */
    private analyzePerformance;
    /**
     * パフォーマンススコアの計算
     */
    private calculatePerformanceScore;
    /**
     * パフォーマンス推奨事項の生成
     */
    private generatePerformanceRecommendations;
    /**
     * セキュリティ分析
     */
    private analyzeSecurity;
    /**
     * 品質分析
     */
    private analyzeQuality;
    /**
     * 機能品質スコアの計算
     */
    private calculateFunctionalQualityScore;
    /**
     * 機能問題の抽出
     */
    private extractFunctionalIssues;
    /**
     * ユーザビリティスコアの計算
     */
    private calculateUsabilityScore;
    /**
     * 信頼性スコアの計算
     */
    private calculateReliabilityScore;
    /**
     * エラー率の計算
     */
    private calculateErrorRate;
    /**
     * 保守性スコアの計算
     */
    private calculateMaintainabilityScore;
    /**
     * 平均カバレッジの計算
     */
    private calculateAverageCoverage;
    /**
     * コード品質問題の抽出
     */
    private extractCodeQualityIssues;
    /**
     * クロスモジュール分析
     */
    private analyzeCrossModule;
    /**
     * 統合問題の発見
     */
    private findIntegrationIssues;
    /**
     * データフローボトルネックの発見
     */
    private findDataFlowBottlenecks;
    /**
     * データ不整合の発見
     */
    private findDataInconsistencies;
    /**
     * クロスモジュールレイテンシの計算
     */
    private calculateCrossModuleLatency;
    /**
     * リソース競合の発見
     */
    private findResourceContention;
    /**
     * 推奨事項の生成
     */
    private generateRecommendations;
    /**
     * 即座対応推奨事項の生成
     */
    private generateImmediateRecommendations;
    /**
     * 短期推奨事項の生成
     */
    private generateShortTermRecommendations;
    /**
     * 長期推奨事項の生成
     */
    private generateLongTermRecommendations;
    /**
     * 添付ファイルの準備
     */
    private prepareAttachments;
    /**
     * スクリーンショットの収集
     */
    private collectScreenshots;
    /**
     * ログファイルの収集
     */
    private collectLogFiles;
    /**
     * チャートの生成
     */
    private generateCharts;
    /**
     * 生データの保存
     */
    private saveRawData;
    /**
     * 形式別レポートの生成
     */
    private generateFormatSpecificReport;
    /**
     * JSONレポートの生成
     */
    private generateJsonReport;
    /**
     * HTMLレポートの生成
     */
    private generateHtmlReport;
    /**
     * HTMLコンテンツの構築
     */
    private buildHtmlContent;
    /**
     * PDFレポートの生成
     */
    private generatePdfReport;
    /**
     * CSVレポートの生成
     */
    private generateCsvReport;
    /**
     * CSVコンテンツの構築
     */
    private buildCsvContent;
    /**
     * レポートIDの生成
     */
    private generateReportId;
    /**
     * 出力ディレクトリの確保
     */
    private ensureOutputDirectory;
}
export declare const DefaultReportConfig: ReportConfig;
export {};
