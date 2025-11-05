/**
 * UI/UXテストモジュール
 *
 * Kiro MCP Chrome DevToolsを使用した実ブラウザでのUI/UXテスト
 * レスポンシブデザイン、アクセシビリティ、ユーザビリティの包括的評価
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * UI/UXテスト結果インターフェース
 */
export interface UIUXTestResult extends TestResult {
    uiMetrics?: {
        pageLoadTime: number;
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        cumulativeLayoutShift: number;
        firstInputDelay: number;
        interactionToNextPaint: number;
    };
    responsiveMetrics?: {
        mobileViewport: ViewportTestResult;
        tabletViewport: ViewportTestResult;
        desktopViewport: ViewportTestResult;
    };
    accessibilityMetrics?: {
        wcagAACompliance: number;
        colorContrastRatio: number;
        keyboardNavigation: boolean;
        screenReaderCompatibility: boolean;
        altTextCoverage: number;
    };
    usabilityMetrics?: {
        navigationEfficiency: number;
        formUsability: number;
        errorHandling: number;
        userFlowCompletion: number;
    };
    screenshots?: {
        mobile: string;
        tablet: string;
        desktop: string;
    };
}
/**
 * ビューポートテスト結果
 */
export interface ViewportTestResult {
    width: number;
    height: number;
    layoutStability: boolean;
    contentVisibility: boolean;
    navigationUsability: boolean;
    textReadability: boolean;
    buttonAccessibility: boolean;
}
/**
 * UI/UXテストモジュールクラス
 */
export declare class UIUXTestModule {
    private config;
    private baseUrl;
    constructor(config: ProductionConfig);
    /**
     * レスポンシブデザインテスト
     */
    testResponsiveDesign(): Promise<UIUXTestResult>;
    /**
     * チャットインターフェーステスト
     */
    testChatInterface(): Promise<UIUXTestResult>;
    /**
     * アクセシビリティテスト
     */
    testAccessibility(): Promise<UIUXTestResult>;
    /**
     * ユーザビリティテスト
     */
    testUsability(): Promise<UIUXTestResult>;
    /**
     * 特定ビューポートでのテスト
     */
    private testViewport;
    /**
     * スクリーンショット撮影
     */
    private captureScreenshot;
    /**
     * レイアウト安定性チェック
     */
    private checkLayoutStability;
    /**
     * コンテンツ可視性チェック
     */
    private checkContentVisibility;
    /**
     * ナビゲーション使いやすさチェック
     */
    private checkNavigationUsability;
    /**
     * テキスト読みやすさチェック
     */
    private checkTextReadability;
    /**
     * ボタンアクセシビリティチェック
     */
    private checkButtonAccessibility;
    /**
     * レスポンシブデザインの評価
     */
    private evaluateResponsiveDesign;
    /**
     * チャット入力テスト
     */
    private testChatInput;
    /**
     * チャット履歴テスト
     */
    private testChatHistory;
    /**
     * ファイルアップロードテスト
     */
    private testFileUpload;
    /**
     * チャットスクロールテスト
     */
    private testChatScrolling;
    /**
     * チャットレスポンシブテスト
     */
    private testChatResponsiveness;
    /**
     * チャットユーザビリティメトリクスの集計
     */
    private aggregateChatUsabilityMetrics;
    /**
     * UIメトリクスの収集
     */
    private collectUIMetrics;
    /**
     * WCAG準拠テスト
     */
    private testWCAGCompliance;
    /**
     * 色彩コントラストテスト
     */
    private testColorContrast;
    /**
     * キーボードナビゲーションテスト
     */
    private testKeyboardNavigation;
    /**
     * スクリーンリーダー互換性テスト
     */
    private testScreenReaderCompatibility;
    /**
     * 代替テキストカバレッジテスト
     */
    private testAltTextCoverage;
    /**
     * アクセシビリティメトリクスの集計
     */
    private aggregateAccessibilityMetrics;
    /**
     * ナビゲーション効率テスト
     */
    private testNavigationEfficiency;
    /**
     * フォーム使いやすさテスト
     */
    private testFormUsability;
    /**
     * エラーハンドリングテスト
     */
    private testErrorHandling;
    /**
     * ユーザーフロー完了テスト
     */
    private testUserFlowCompletion;
    /**
     * ユーザビリティメトリクスの集計
     */
    private aggregateUsabilityMetrics;
    /**
     * 全UI/UXテストの実行
     */
    runAllUIUXTests(): Promise<UIUXTestResult[]>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default UIUXTestModule;
