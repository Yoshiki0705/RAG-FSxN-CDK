/**
 * 文書ソース表示テスト
 * AI 応答における文書ソースと参照の表示テスト実装
 * 参照情報の正確性検証ロジック作成
 */
import { TestResult } from '../../core/production-test-engine';
export interface DocumentSourceTestConfig {
    baseUrl: string;
    testQueries: TestQuery[];
    expectedSources: ExpectedSource[];
    displayRequirements: DisplayRequirement[];
    accuracyThresholds: {
        sourceAttributionAccuracy: number;
        citationFormatCompliance: number;
        linkValidityRate: number;
        contentRelevanceScore: number;
    };
}
export interface TestQuery {
    id: string;
    query: string;
    expectedSourceCount: number;
    expectedSourceTypes: string[];
    category: 'technical' | 'business' | 'general' | 'specific';
    complexity: 'simple' | 'medium' | 'complex';
}
export interface ExpectedSource {
    sourceId: string;
    title: string;
    type: 'document' | 'webpage' | 'database' | 'api';
    url?: string;
    author?: string;
    lastModified?: string;
    relevanceScore: number;
}
export interface DisplayRequirement {
    element: string;
    required: boolean;
    format: string;
    accessibility: boolean;
    interactivity: boolean;
}
export interface DocumentSourceTestResult extends TestResult {
    queryResults: QuerySourceResult[];
    displayResults: DisplayValidationResult[];
    accuracyResults: AccuracyValidationResult[];
    accessibilityResults: AccessibilityValidationResult[];
    overallSourceScore: number;
    attributionAccuracy: number;
    displayQuality: number;
    userExperienceScore: number;
    complianceScore: number;
}
export interface QuerySourceResult {
    queryId: string;
    query: string;
    aiResponse: string;
    detectedSources: DetectedSource[];
    sourceCount: number;
    attributionAccuracy: number;
    citationFormat: CitationFormat[];
    relevanceScore: number;
    completenessScore: number;
    success: boolean;
    issues: SourceIssue[];
}
export interface DetectedSource {
    sourceId: string;
    title: string;
    type: string;
    url?: string;
    author?: string;
    excerpt: string;
    relevanceScore: number;
    citationPosition: number[];
    displayFormat: string;
    isClickable: boolean;
    isValid: boolean;
}
export interface CitationFormat {
    position: number;
    format: 'inline' | 'footnote' | 'endnote' | 'bibliography';
    style: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'custom';
    isCompliant: boolean;
    displayText: string;
}
export interface DisplayValidationResult {
    element: string;
    isPresent: boolean;
    isVisible: boolean;
    isAccessible: boolean;
    isInteractive: boolean;
    formatCompliance: boolean;
    responsiveDesign: boolean;
    loadTime: number;
    success: boolean;
    issues: string[];
}
export interface AccuracyValidationResult {
    sourceId: string;
    contentMatch: number;
    contextRelevance: number;
    factualAccuracy: number;
    timelinessScore: number;
    authorityScore: number;
    overallAccuracy: number;
    verificationStatus: 'verified' | 'partial' | 'failed';
}
export interface AccessibilityValidationResult {
    element: string;
    wcagCompliance: boolean;
    keyboardNavigation: boolean;
    screenReaderCompatibility: boolean;
    colorContrast: number;
    altTextPresence: boolean;
    ariaLabels: boolean;
    focusManagement: boolean;
    score: number;
}
export interface SourceIssue {
    type: 'missing_source' | 'invalid_link' | 'poor_formatting' | 'accessibility' | 'accuracy';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    element?: string;
    recommendation: string;
}
export declare class DocumentSourceDisplayTest {
    private config;
    private testStartTime;
    private isRunning;
    constructor(config: DocumentSourceTestConfig);
    /**
     * 文書ソース表示テストの実行
     */
    runTest(): Promise<DocumentSourceTestResult>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
    /**
     * クエリ別ソーステストの実行
     */
    private testQuerySources;
    /**
     * 単一クエリのテスト
     */
    private testSingleQuery;
    /**
     * AI応答の取得
     */
    private getAIResponse;
    /**
     * ソースの検出と解析
     */
    private detectSources;
    /**
     * ソースタイプの判定
     */
    private determineSourceType;
    /**
     * 抜粋の抽出
     */
    private extractExcerpt;
    /**
     * 引用位置の検索
     */
    private findCitationPositions;
    /**
     * 著者名の生成
     */
    private generateAuthorName;
    /**
     * 引用フォーマットの解析
     */
    private analyzeCitationFormat;
    /**
     * 帰属精度の計算
     */
    private calculateAttributionAccuracy;
    /**
     * 関連性スコアの計算
     */
    private calculateRelevanceScore;
    /**
     * 完全性スコアの計算
     */
    private calculateCompletenessScore;
    /**
     * ソース問題の検出
     */
    private detectSourceIssues;
    /**
     * 表示検証テストの実行
     */
    private testDisplayValidation;
    /**
     * 表示要素の検証
     */
    private validateDisplayElement;
    /**
     * 要素の存在確認
     */
    private checkElementPresence;
    /**
     * 要素の可視性確認
     */
    private checkElementVisibility;
    /**
     * 要素のアクセシビリティ確認
     */
    private checkElementAccessibility;
    /**
     * 要素のインタラクティビティ確認
     */
    private checkElementInteractivity;
    /**
     * フォーマット準拠の確認
     */
    private checkFormatCompliance;
    /**
     * レスポンシブデザインの確認
     */
    private checkResponsiveDesign;
    /**
     * 精度検証テストの実行
     */
    private testAccuracyValidation;
    /**
     * ソース精度の検証
     */
    private validateSourceAccuracy;
    /**
     * コンテンツマッチの確認
     */
    private checkContentMatch;
    /**
     * コンテキスト関連性の確認
     */
    private checkContextRelevance;
    /**
     * 事実正確性の確認
     */
    private checkFactualAccuracy;
    /**
     * 時宜性の確認
     */
    private checkTimeliness;
    /**
     * 権威性の確認
     */
    private checkAuthority;
    /**
     * アクセシビリティ検証テストの実行
     */
    private testAccessibilityValidation;
    /**
     * 要素のアクセシビリティ検証
     */
    private validateElementAccessibility;
    /**
     * WCAG準拠の確認
     */
    private checkWCAGCompliance;
    /**
     * キーボードナビゲーションの確認
     */
    private checkKeyboardNavigation;
    /**
     * スクリーンリーダー互換性の確認
     */
    private checkScreenReaderCompatibility;
    /**
     * 色コントラストの確認
     */
    private checkColorContrast;
    /**
     * alt属性の存在確認
     */
    private checkAltTextPresence;
    /**
     * ARIA属性の確認
     */
    private checkAriaLabels;
    /**
     * フォーカス管理の確認
     */
    private checkFocusManagement;
    /**
     * スコアの計算
     */
    private calculateScores;
    /**
     * テスト結果のログ出力
     */
    private logTestResults;
    /**
     * エラー時のクエリ結果作成
     */
    private createErrorQueryResult;
    /**
     * 遅延処理（タイムアウト付き）
     */
    private delay;
}
/**
 * デフォルト設定での文書ソース表示テスト実行
 */
export declare function runDocumentSourceDisplayTest(baseUrl?: string): Promise<DocumentSourceTestResult>;
