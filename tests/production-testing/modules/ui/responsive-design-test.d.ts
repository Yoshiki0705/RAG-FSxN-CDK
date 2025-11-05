/**
 * レスポンシブデザインテスト
 * 複数デバイス対応のテストコード実装（デスクトップ、タブレット、モバイル）
 * Kiro MCP サーバーの実ブラウザ機能を使用した検証
 */
import { TestResult } from '../../core/production-test-engine';
import { ProductionConfig } from '../../config/production-config';
export interface ResponsiveTestConfig {
    baseUrl: string;
    testPages: string[];
    devices: DeviceConfig[];
    performanceThresholds: {
        loadTime: number;
        renderTime: number;
        interactionTime: number;
    };
    accessibilityThresholds: {
        minScore: number;
        wcagLevel: 'A' | 'AA' | 'AAA';
    };
}
export interface DeviceConfig {
    name: string;
    width: number;
    height: number;
    userAgent: string;
    deviceType: 'desktop' | 'tablet' | 'mobile';
    touchEnabled: boolean;
}
export interface ResponsiveTestResult extends TestResult {
    deviceResults: DeviceTestResult[];
    overallResponsiveScore: number;
    layoutConsistencyScore: number;
    performanceScore: number;
    accessibilityScore: number;
    crossDeviceCompatibility: number;
    uiMetrics?: {
        responsiveScore: number;
        accessibilityCompliance: number;
        performanceIndex: number;
        crossDeviceConsistency: number;
    };
}
export interface DeviceTestResult {
    device: DeviceConfig;
    pageResults: PageTestResult[];
    deviceScore: number;
    layoutBreakpoints: LayoutBreakpoint[];
    performanceMetrics: DevicePerformanceMetrics;
    accessibilityMetrics: AccessibilityMetrics;
}
export interface PageTestResult {
    url: string;
    loadTime: number;
    renderTime: number;
    layoutScore: number;
    interactionScore: number;
    contentVisibility: number;
    navigationUsability: number;
    formUsability: number;
    issues: ResponsiveIssue[];
}
export interface LayoutBreakpoint {
    width: number;
    height: number;
    layoutChanges: string[];
    criticalIssues: string[];
    minorIssues: string[];
}
export interface DevicePerformanceMetrics {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    timeToInteractive: number;
}
export interface AccessibilityMetrics {
    wcagScore: number;
    colorContrastRatio: number;
    keyboardNavigation: number;
    screenReaderCompatibility: number;
    touchTargetSize: number;
    focusManagement: number;
}
export interface ResponsiveIssue {
    type: 'layout' | 'performance' | 'accessibility' | 'interaction';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    element: string;
    recommendation: string;
}
export declare class ResponsiveDesignTest {
    private config;
    private productionConfig;
    private testStartTime;
    constructor(config: ResponsiveTestConfig, productionConfig: ProductionConfig);
    /**
     * レスポンシブデザインテストの実行
     */
    runTest(): Promise<ResponsiveTestResult>;
    /**
     * 全デバイスでのテスト実行
     */
    private testAllDevices;
    /**
     * 特定デバイスでのテスト実行
     */
    private testDevice;
    /**
     * デバイス用ブラウザ設定
     */
    private setupBrowserForDevice;
    /**
     * ページテストの実行
     */
    private testPage;
    /**
     * 読み込み時間の測定
     */
    private measureLoadTime;
    /**
     * レンダリング時間の測定
     */
    private measureRenderTime;
    /**
     * レイアウトの評価
     */
    private evaluateLayout;
    /**
     * インタラクションの評価
     */
    private evaluateInteraction;
    /**
     * コンテンツ可視性の評価
     */
    private evaluateContentVisibility;
    /**
     * ナビゲーション使いやすさの評価
     */
    private evaluateNavigation;
    /**
     * フォーム使いやすさの評価
     */
    private evaluateFormUsability;
    /**
     * レスポンシブ問題の検出
     */
    private detectResponsiveIssues;
    /**
     * レイアウトブレークポイントのテスト
     */
    private testLayoutBreakpoints;
    /**
     * パフォーマンスメトリクスの収集
     */
    private collectPerformanceMetrics;
    /**
     * アクセシビリティメトリクスの収集
     */
    private collectAccessibilityMetrics;
    /**
     * デバイススコアの計算
     */
    private calculateDeviceScore;
    /**
     * パフォーマンススコアの計算
     */
    private calculatePerformanceScore;
    /**
     * UIメトリクスの計算
     */
    private calculateUIMetrics;
    /**
     * 全体メトリクスの計算
     */
    private calculateOverallMetrics;
    /**
     * テスト結果のログ出力
     */
    private logTestResults;
    /**
     * 遅延処理
     */
    private delay;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
/**
 * デフォルト設定でのレスポンシブデザインテスト実行
 */
export declare function runResponsiveDesignTest(baseUrl?: string, productionConfig?: ProductionConfig): Promise<ResponsiveTestResult>;
export default ResponsiveDesignTest;
