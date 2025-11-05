/**
 * アクセシビリティテスト
 * WCAG 2.1 AA 準拠のテストコード実装
 * アクセシビリティスコア測定ロジック作成
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { TestResult } from '../../types/test-types';
export interface AccessibilityTestConfig {
    baseUrl: string;
    testPages: string[];
    wcagLevel: 'A' | 'AA' | 'AAA';
    wcagVersion: '2.0' | '2.1' | '2.2';
    testCategories: AccessibilityCategory[];
    complianceThresholds: {
        overallScore: number;
        categoryMinimums: Record<string, number>;
        criticalIssueLimit: number;
    };
}
export interface AccessibilityCategory {
    name: string;
    principles: WCAGPrinciple[];
    weight: number;
    required: boolean;
}
export interface WCAGPrinciple {
    id: string;
    name: 'perceivable' | 'operable' | 'understandable' | 'robust';
    guidelines: WCAGGuideline[];
}
export interface WCAGGuideline {
    id: string;
    title: string;
    level: 'A' | 'AA' | 'AAA';
    successCriteria: SuccessCriterion[];
}
export interface SuccessCriterion {
    id: string;
    title: string;
    level: 'A' | 'AA' | 'AAA';
    testable: boolean;
    automated: boolean;
}
export interface AccessibilityTestResult extends TestResult {
    pageResults: PageAccessibilityResult[];
    categoryResults: CategoryResult[];
    principleResults: PrincipleResult[];
    overallAccessibilityScore: number;
    wcagComplianceLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
    criticalIssueCount: number;
    totalIssueCount: number;
    automatedTestCoverage: number;
}
export interface PageAccessibilityResult {
    url: string;
    pageTitle: string;
    overallScore: number;
    principleScores: Record<string, number>;
    issues: AccessibilityIssue[];
    testResults: TestCaseResult[];
    performanceMetrics: AccessibilityPerformanceMetrics;
    userTestingResults?: UserTestingResult;
}
export interface CategoryResult {
    category: string;
    score: number;
    passedTests: number;
    totalTests: number;
    criticalIssues: number;
    issues: AccessibilityIssue[];
}
export interface PrincipleResult {
    principle: string;
    score: number;
    guidelines: GuidelineResult[];
    overallCompliance: boolean;
}
export interface GuidelineResult {
    guideline: string;
    score: number;
    successCriteria: SuccessCriterionResult[];
    compliance: boolean;
}
export interface SuccessCriterionResult {
    criterion: string;
    level: 'A' | 'AA' | 'AAA';
    passed: boolean;
    score: number;
    testMethod: 'automated' | 'manual' | 'hybrid';
    evidence: string[];
    issues: AccessibilityIssue[];
}
export interface TestCaseResult {
    testId: string;
    testName: string;
    category: string;
    passed: boolean;
    score: number;
    executionTime: number;
    details: string;
    recommendations: string[];
}
export interface AccessibilityIssue {
    id: string;
    type: 'perceivable' | 'operable' | 'understandable' | 'robust';
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
    wcagReference: string;
    element: string;
    description: string;
    impact: string;
    solution: string;
    codeExample?: string;
    affectedUsers: string[];
    testMethod: 'automated' | 'manual';
}
export interface AccessibilityPerformanceMetrics {
    pageLoadTime: number;
    timeToInteractive: number;
    screenReaderCompatibility: number;
    keyboardNavigationTime: number;
    focusManagementScore: number;
}
export interface UserTestingResult {
    screenReaderUsers: UserGroupResult;
    keyboardOnlyUsers: UserGroupResult;
    lowVisionUsers: UserGroupResult;
    cognitiveDisabilityUsers: UserGroupResult;
}
export interface UserGroupResult {
    taskCompletionRate: number;
    averageTaskTime: number;
    errorRate: number;
    satisfactionScore: number;
    specificIssues: string[];
}
export declare class AccessibilityTest {
    private config;
    private testStartTime;
    constructor(config: AccessibilityTestConfig);
    /**
     * アクセシビリティテストの実行
     */
    runTest(): Promise<AccessibilityTestResult>;
    /**
     * 全ページのテスト実行（並列処理でパフォーマンス向上）
     */
    private testAllPages;
    /**
     * 単一ページのテスト実行
     */
    private testSinglePage;
    /**
     * ページの読み込み（入力検証強化）
     */
    private loadPage;
    /**
     * ページタイトルの取得
     */
    private getPageTitle;
    /**
     * 知覚可能性（Perceivable）のテスト
     */
    private testPerceivable;
    /**
     * 操作可能性（Operable）のテスト
     */
    private testOperable;
    /**
     * 理解可能性（Understandable）のテスト
     */
    private testUnderstandable;
    /**
     * 堅牢性（Robust）のテスト
     */
    private testRobust;
    /**
     * テキスト代替のテスト（1.1）
     */
    private testTextAlternatives;
    /**
     * 時間ベースメディアのテスト（1.2）
     */
    private testTimeBasedMedia;
    /**
     * 適応可能性のテスト（1.3）
     */
    private testAdaptable;
    /**
     * 判別可能性のテスト（1.4）
     */
    private testDistinguishable;
    /**
     * キーボードアクセシビリティのテスト（2.1）
     */
    private testKeyboardAccessible;
    /**
     * 十分な時間のテスト（2.2）
     */
    private testEnoughTime;
    /**
     * 発作と身体反応のテスト（2.3）
     */
    private testSeizuresAndPhysicalReactions;
    /**
     * ナビゲーション可能性のテスト（2.4）
     */
    private testNavigable;
    /**
     * 入力モダリティのテスト（2.5）
     */
    private testInputModalities;
    /**
     * 読みやすさのテスト（3.1）
     */
    private testReadable;
    /**
     * 予測可能性のテスト（3.2）
     */
    private testPredictable;
    /**
     * 入力アシスタンスのテスト（3.3）
     */
    private testInputAssistance;
    /**
     * 互換性のテスト（4.1）
     */
    private testCompatible;
    private findImagesWithoutAlt;
    private findDecorativeImages;
    private findInaccessibleIcons;
    private findVideosWithoutCaptions;
    private findAudioWithoutTranscripts;
    private checkHeadingStructure;
    private checkLandmarks;
    private checkFormLabels;
    private checkColorContrast;
    private checkTextResize;
    private checkAudioControl;
    private testKeyboardNavigation;
    private testFocusTrap;
    private testTabOrder;
    private checkTimeoutWarning;
    private checkAutoRefresh;
    private checkFlashingContent;
    private checkAnimationControl;
    private checkSkipLinks;
    private checkPageTitle;
    private checkLinkPurpose;
    private checkPointerGestures;
    private checkPointerCancellation;
    private checkLanguageIdentification;
    private checkReadability;
    private checkOnFocusChange;
    private checkOnInputChange;
    private checkConsistentNavigation;
    private checkErrorIdentification;
    private checkLabelsOrInstructions;
    private checkErrorSuggestion;
    private checkHTMLParsing;
    private checkNameRoleValue;
    private checkStatusMessages;
    /**
     * 原則スコアの計算（重み付き平均）
     */
    private calculatePrincipleScore;
    /**
     * 問題の集計
     */
    private aggregateIssues;
    /**
     * 影響を受けるユーザーの取得
     */
    private getAffectedUsers;
    /**
     * パフォーマンスメトリクスの収集
     */
    private collectPerformanceMetrics;
    /**
     * ユーザーテスト結果の収集
     */
    private collectUserTestingResults;
    /**
     * カテゴリ別結果の集計
     */
    private aggregateCategoryResults;
    /**
     * 原則別結果の集計
     */
    private aggregatePrincipleResults;
    /**
     * 総合メトリクスの計算
     */
    private calculateOverallMetrics;
    /**
     * テスト結果のログ出力
     */
    private logTestResults;
    /**
     * エラー時のページ結果作成
     */
    private createErrorPageResult;
    /**
     * 遅延処理（入力検証付き）
     */
    private delay;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
/**
 * デフォルト設定でのアクセシビリティテスト実行
 */
export declare function runAccessibilityTest(baseUrl?: string): Promise<AccessibilityTestResult>;
