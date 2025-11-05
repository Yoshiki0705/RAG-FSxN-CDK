/**
 * UI/UXテスト設定
 *
 * 実本番環境でのUI/UXテストに関する設定を管理
 * レスポンシブデザイン、アクセシビリティ、ユーザビリティテストの設定を含む
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * UI/UXテスト設定インターフェース
 */
export interface UIUXTestConfig {
    testEnvironment: 'production' | 'staging' | 'development';
    region: string;
    baseUrl: string;
    viewports: {
        mobile: ViewportConfig;
        tablet: ViewportConfig;
        desktop: ViewportConfig;
        ultrawide?: ViewportConfig;
    };
    performanceThresholds: {
        pageLoadTime: number;
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        cumulativeLayoutShift: number;
        firstInputDelay: number;
        interactionToNextPaint: number;
    };
    accessibility: {
        wcagLevel: 'A' | 'AA' | 'AAA';
        minimumContrastRatio: number;
        requireKeyboardNavigation: boolean;
        requireScreenReaderSupport: boolean;
        minimumAltTextCoverage: number;
        testColorBlindness: boolean;
    };
    usability: {
        minimumNavigationEfficiency: number;
        minimumFormUsability: number;
        minimumErrorHandling: number;
        minimumUserFlowCompletion: number;
        testUserJourneys: string[];
    };
    browser: {
        userAgent: string;
        enableJavaScript: boolean;
        enableImages: boolean;
        enableCSS: boolean;
        networkThrottling?: NetworkThrottling;
        cpuThrottling?: number;
    };
    execution: {
        screenshotOnFailure: boolean;
        screenshotFormat: 'png' | 'jpeg' | 'webp';
        screenshotQuality: number;
        maxTestDuration: number;
        retryOnFailure: boolean;
        maxRetries: number;
    };
    safety: {
        readOnlyMode: boolean;
        preventDataModification: boolean;
        emergencyStopEnabled: boolean;
        maxInteractionDepth: number;
    };
}
/**
 * ビューポート設定
 */
export interface ViewportConfig {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    isLandscape: boolean;
}
/**
 * ネットワーク制限設定
 */
export interface NetworkThrottling {
    offline: boolean;
    downloadThroughput: number;
    uploadThroughput: number;
    latency: number;
}
/**
 * 本番環境用UI/UXテスト設定
 */
export declare const productionUIUXConfig: UIUXTestConfig;
/**
 * ステージング環境用UI/UXテスト設定
 */
export declare const stagingUIUXConfig: UIUXTestConfig;
/**
 * 開発環境用UI/UXテスト設定
 */
export declare const developmentUIUXConfig: UIUXTestConfig;
/**
 * 環境に応じた設定の取得
 */
export declare function getUIUXConfig(environment: string): UIUXTestConfig;
/**
 * UI/UXテスト設定の検証
 */
export declare function validateUIUXConfig(config: UIUXTestConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * UI/UXテスト設定の表示
 */
export declare function displayUIUXConfig(config: UIUXTestConfig): void;
declare const _default: {
    productionUIUXConfig: UIUXTestConfig;
    stagingUIUXConfig: UIUXTestConfig;
    developmentUIUXConfig: UIUXTestConfig;
    getUIUXConfig: typeof getUIUXConfig;
    validateUIUXConfig: typeof validateUIUXConfig;
    displayUIUXConfig: typeof displayUIUXConfig;
};
export default _default;
