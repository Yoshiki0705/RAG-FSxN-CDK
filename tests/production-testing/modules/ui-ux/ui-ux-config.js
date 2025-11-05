"use strict";
/**
 * UI/UXテスト設定
 *
 * 実本番環境でのUI/UXテストに関する設定を管理
 * レスポンシブデザイン、アクセシビリティ、ユーザビリティテストの設定を含む
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.developmentUIUXConfig = exports.stagingUIUXConfig = exports.productionUIUXConfig = void 0;
exports.getUIUXConfig = getUIUXConfig;
exports.validateUIUXConfig = validateUIUXConfig;
exports.displayUIUXConfig = displayUIUXConfig;
/**
 * 本番環境用UI/UXテスト設定
 */
exports.productionUIUXConfig = {
    testEnvironment: 'production',
    region: 'ap-northeast-1',
    baseUrl: 'https://d1234567890.cloudfront.net', // 実際のCloudFront URL
    viewports: {
        mobile: {
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            isLandscape: false
        },
        tablet: {
            width: 768,
            height: 1024,
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: true,
            isLandscape: false
        },
        desktop: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: true
        },
        ultrawide: {
            width: 3440,
            height: 1440,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: true
        }
    },
    performanceThresholds: {
        pageLoadTime: 3000, // 3秒
        firstContentfulPaint: 1800, // 1.8秒
        largestContentfulPaint: 2500, // 2.5秒
        cumulativeLayoutShift: 0.1, // 0.1以下
        firstInputDelay: 100, // 100ms
        interactionToNextPaint: 200 // 200ms
    },
    accessibility: {
        wcagLevel: 'AA',
        minimumContrastRatio: 4.5,
        requireKeyboardNavigation: true,
        requireScreenReaderSupport: true,
        minimumAltTextCoverage: 0.9, // 90%
        testColorBlindness: true
    },
    usability: {
        minimumNavigationEfficiency: 0.8, // 80%
        minimumFormUsability: 0.8, // 80%
        minimumErrorHandling: 0.7, // 70%
        minimumUserFlowCompletion: 0.85, // 85%
        testUserJourneys: [
            'login-to-chat',
            'document-upload-and-query',
            'chat-history-review',
            'logout'
        ]
    },
    browser: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        enableJavaScript: true,
        enableImages: true,
        enableCSS: true,
        networkThrottling: {
            offline: false,
            downloadThroughput: 1.5 * 1024 * 1024, // 1.5 Mbps
            uploadThroughput: 750 * 1024, // 750 Kbps
            latency: 40 // 40ms
        }
    },
    execution: {
        screenshotOnFailure: true,
        screenshotFormat: 'png',
        screenshotQuality: 90,
        maxTestDuration: 600, // 10分
        retryOnFailure: true,
        maxRetries: 2
    },
    safety: {
        readOnlyMode: true,
        preventDataModification: true,
        emergencyStopEnabled: true,
        maxInteractionDepth: 10
    }
};
/**
 * ステージング環境用UI/UXテスト設定
 */
exports.stagingUIUXConfig = {
    ...exports.productionUIUXConfig,
    testEnvironment: 'staging',
    baseUrl: 'https://staging.example.com',
    // より厳しいテスト設定
    performanceThresholds: {
        pageLoadTime: 2500, // 2.5秒
        firstContentfulPaint: 1500, // 1.5秒
        largestContentfulPaint: 2000, // 2秒
        cumulativeLayoutShift: 0.05, // 0.05以下
        firstInputDelay: 50, // 50ms
        interactionToNextPaint: 150 // 150ms
    },
    accessibility: {
        ...exports.productionUIUXConfig.accessibility,
        wcagLevel: 'AAA',
        minimumContrastRatio: 7.0,
        minimumAltTextCoverage: 0.95 // 95%
    },
    usability: {
        ...exports.productionUIUXConfig.usability,
        minimumNavigationEfficiency: 0.85, // 85%
        minimumFormUsability: 0.85, // 85%
        minimumErrorHandling: 0.8, // 80%
        minimumUserFlowCompletion: 0.9 // 90%
    },
    execution: {
        ...exports.productionUIUXConfig.execution,
        maxTestDuration: 900, // 15分
        maxRetries: 3
    },
    safety: {
        ...exports.productionUIUXConfig.safety,
        readOnlyMode: false, // ステージングでは書き込み可能
        preventDataModification: false,
        maxInteractionDepth: 15
    }
};
/**
 * 開発環境用UI/UXテスト設定
 */
exports.developmentUIUXConfig = {
    ...exports.productionUIUXConfig,
    testEnvironment: 'development',
    baseUrl: 'http://localhost:3000',
    // 緩い設定
    performanceThresholds: {
        pageLoadTime: 5000, // 5秒
        firstContentfulPaint: 3000, // 3秒
        largestContentfulPaint: 4000, // 4秒
        cumulativeLayoutShift: 0.2, // 0.2以下
        firstInputDelay: 200, // 200ms
        interactionToNextPaint: 300 // 300ms
    },
    accessibility: {
        ...exports.productionUIUXConfig.accessibility,
        wcagLevel: 'A',
        minimumContrastRatio: 3.0,
        minimumAltTextCoverage: 0.7 // 70%
    },
    usability: {
        ...exports.productionUIUXConfig.usability,
        minimumNavigationEfficiency: 0.6, // 60%
        minimumFormUsability: 0.6, // 60%
        minimumErrorHandling: 0.5, // 50%
        minimumUserFlowCompletion: 0.7 // 70%
    },
    browser: {
        ...exports.productionUIUXConfig.browser,
        networkThrottling: undefined // 制限なし
    },
    execution: {
        ...exports.productionUIUXConfig.execution,
        maxTestDuration: 300, // 5分
        maxRetries: 1
    },
    safety: {
        ...exports.productionUIUXConfig.safety,
        readOnlyMode: false,
        preventDataModification: false,
        maxInteractionDepth: 20
    }
};
/**
 * 環境に応じた設定の取得
 */
function getUIUXConfig(environment) {
    switch (environment.toLowerCase()) {
        case 'production':
        case 'prod':
            return exports.productionUIUXConfig;
        case 'staging':
        case 'stage':
            return exports.stagingUIUXConfig;
        case 'development':
        case 'dev':
            return exports.developmentUIUXConfig;
        default:
            console.warn(`未知の環境: ${environment}. 開発環境設定を使用します。`);
            return exports.developmentUIUXConfig;
    }
}
/**
 * UI/UXテスト設定の検証
 */
function validateUIUXConfig(config) {
    const errors = [];
    const warnings = [];
    // 必須フィールドの検証
    if (!config.baseUrl) {
        errors.push('ベースURLが設定されていません');
    }
    if (!config.region) {
        errors.push('リージョンが設定されていません');
    }
    // ビューポート設定の検証
    const requiredViewports = ['mobile', 'tablet', 'desktop'];
    for (const viewport of requiredViewports) {
        const viewportConfig = config.viewports[viewport];
        if (!viewportConfig) {
            errors.push(`${viewport}ビューポート設定が不足しています`);
        }
        else {
            if (viewportConfig.width <= 0 || viewportConfig.height <= 0) {
                errors.push(`${viewport}ビューポートのサイズが無効です`);
            }
        }
    }
    // パフォーマンス閾値の検証
    if (config.performanceThresholds.pageLoadTime <= 0) {
        errors.push('ページ読み込み時間の閾値は正の値である必要があります');
    }
    if (config.performanceThresholds.cumulativeLayoutShift < 0 || config.performanceThresholds.cumulativeLayoutShift > 1) {
        errors.push('CLS閾値は0-1の範囲である必要があります');
    }
    // アクセシビリティ設定の検証
    if (config.accessibility.minimumContrastRatio < 1) {
        errors.push('最小コントラスト比は1以上である必要があります');
    }
    if (config.accessibility.minimumAltTextCoverage < 0 || config.accessibility.minimumAltTextCoverage > 1) {
        errors.push('代替テキストカバレッジは0-1の範囲である必要があります');
    }
    // ユーザビリティ設定の検証
    const usabilityMetrics = [
        'minimumNavigationEfficiency',
        'minimumFormUsability',
        'minimumErrorHandling',
        'minimumUserFlowCompletion'
    ];
    for (const metric of usabilityMetrics) {
        const value = config.usability[metric];
        if (typeof value === 'number' && (value < 0 || value > 1)) {
            errors.push(`${metric}は0-1の範囲である必要があります`);
        }
    }
    // 実行設定の検証
    if (config.execution.maxTestDuration <= 0) {
        errors.push('最大テスト時間は正の値である必要があります');
    }
    if (config.execution.maxRetries < 0) {
        errors.push('最大リトライ回数は0以上である必要があります');
    }
    // 警告の生成
    if (config.testEnvironment === 'production') {
        if (config.performanceThresholds.pageLoadTime > 3000) {
            warnings.push('本番環境でのページ読み込み時間閾値が3秒を超えています');
        }
        if (!config.safety.readOnlyMode) {
            warnings.push('本番環境で読み取り専用モードが無効になっています');
        }
        if (config.execution.maxTestDuration > 600) {
            warnings.push('本番環境でのテスト最大実行時間が10分を超えています');
        }
    }
    if (config.accessibility.wcagLevel === 'A') {
        warnings.push('WCAG準拠レベルがAに設定されています。AAまたはAAAを推奨します');
    }
    if (config.accessibility.minimumContrastRatio < 4.5) {
        warnings.push('最小コントラスト比が4.5:1を下回っています。WCAG AA準拠のため4.5:1以上を推奨します');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * UI/UXテスト設定の表示
 */
function displayUIUXConfig(config) {
    console.log('🎨 UI/UXテスト設定:');
    console.log(`   環境: ${config.testEnvironment}`);
    console.log(`   リージョン: ${config.region}`);
    console.log(`   ベースURL: ${config.baseUrl}`);
    console.log('');
    console.log('📱 ビューポート設定:');
    Object.entries(config.viewports).forEach(([name, viewport]) => {
        console.log(`   ${name}: ${viewport.width}x${viewport.height} (${viewport.isMobile ? 'モバイル' : 'デスクトップ'})`);
    });
    console.log('');
    console.log('⚡ パフォーマンス閾値:');
    console.log(`   ページ読み込み時間: ${config.performanceThresholds.pageLoadTime}ms`);
    console.log(`   First Contentful Paint: ${config.performanceThresholds.firstContentfulPaint}ms`);
    console.log(`   Largest Contentful Paint: ${config.performanceThresholds.largestContentfulPaint}ms`);
    console.log(`   Cumulative Layout Shift: ${config.performanceThresholds.cumulativeLayoutShift}`);
    console.log('');
    console.log('♿ アクセシビリティ設定:');
    console.log(`   WCAG準拠レベル: ${config.accessibility.wcagLevel}`);
    console.log(`   最小コントラスト比: ${config.accessibility.minimumContrastRatio}:1`);
    console.log(`   キーボードナビゲーション: ${config.accessibility.requireKeyboardNavigation ? '必須' : 'オプション'}`);
    console.log(`   スクリーンリーダー対応: ${config.accessibility.requireScreenReaderSupport ? '必須' : 'オプション'}`);
    console.log(`   代替テキストカバレッジ: ${(config.accessibility.minimumAltTextCoverage * 100).toFixed(0)}%`);
    console.log('');
    console.log('👤 ユーザビリティ設定:');
    console.log(`   ナビゲーション効率: ${(config.usability.minimumNavigationEfficiency * 100).toFixed(0)}%以上`);
    console.log(`   フォーム使いやすさ: ${(config.usability.minimumFormUsability * 100).toFixed(0)}%以上`);
    console.log(`   エラーハンドリング: ${(config.usability.minimumErrorHandling * 100).toFixed(0)}%以上`);
    console.log(`   ユーザーフロー完了率: ${(config.usability.minimumUserFlowCompletion * 100).toFixed(0)}%以上`);
    console.log('');
    console.log('🛡️ 安全設定:');
    console.log(`   読み取り専用モード: ${config.safety.readOnlyMode ? '有効' : '無効'}`);
    console.log(`   データ変更防止: ${config.safety.preventDataModification ? '有効' : '無効'}`);
    console.log(`   緊急停止機能: ${config.safety.emergencyStopEnabled ? '有効' : '無効'}`);
    console.log(`   最大操作深度: ${config.safety.maxInteractionDepth}`);
}
exports.default = {
    productionUIUXConfig: exports.productionUIUXConfig,
    stagingUIUXConfig: exports.stagingUIUXConfig,
    developmentUIUXConfig: exports.developmentUIUXConfig,
    getUIUXConfig,
    validateUIUXConfig,
    displayUIUXConfig
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWktdXgtY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidWktdXgtY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBaVRILHNDQWVDO0FBS0QsZ0RBb0dDO0FBS0QsOENBd0NDO0FBblhEOztHQUVHO0FBQ1UsUUFBQSxvQkFBb0IsR0FBbUI7SUFDbEQsZUFBZSxFQUFFLFlBQVk7SUFDN0IsTUFBTSxFQUFFLGdCQUFnQjtJQUN4QixPQUFPLEVBQUUsb0NBQW9DLEVBQUUsb0JBQW9CO0lBRW5FLFNBQVMsRUFBRTtRQUNULE1BQU0sRUFBRTtZQUNOLEtBQUssRUFBRSxHQUFHO1lBQ1YsTUFBTSxFQUFFLEdBQUc7WUFDWCxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsUUFBUSxFQUFFLElBQUk7WUFDZCxXQUFXLEVBQUUsS0FBSztTQUNuQjtRQUNELE1BQU0sRUFBRTtZQUNOLEtBQUssRUFBRSxHQUFHO1lBQ1YsTUFBTSxFQUFFLElBQUk7WUFDWixpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsUUFBUSxFQUFFLElBQUk7WUFDZCxXQUFXLEVBQUUsS0FBSztTQUNuQjtRQUNELE9BQU8sRUFBRTtZQUNQLEtBQUssRUFBRSxJQUFJO1lBQ1gsTUFBTSxFQUFFLElBQUk7WUFDWixpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsUUFBUSxFQUFFLEtBQUs7WUFDZixXQUFXLEVBQUUsSUFBSTtTQUNsQjtRQUNELFNBQVMsRUFBRTtZQUNULEtBQUssRUFBRSxJQUFJO1lBQ1gsTUFBTSxFQUFFLElBQUk7WUFDWixpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsUUFBUSxFQUFFLEtBQUs7WUFDZixXQUFXLEVBQUUsSUFBSTtTQUNsQjtLQUNGO0lBRUQscUJBQXFCLEVBQUU7UUFDckIsWUFB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QUFDO0lBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLE1BQU0sQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNsRixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzlFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxNQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBRUQsa0JBQWU7SUFDYixvQkFBb0IsRUFBcEIsNEJBQW9CO0lBQ3BCLGlCQUFpQixFQUFqQix5QkFBaUI7SUFDakIscUJBQXFCLEVBQXJCLDZCQUFxQjtJQUNyQixhQUFhO0lBQ2Isa0JBQWtCO0lBQ2xCLGlCQUFpQjtDQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVSS9VWOODhuOCueODiOioreWumlxuICogXG4gKiDlrp/mnKznlarnkrDlooPjgafjga5VSS9VWOODhuOCueODiOOBq+mWouOBmeOCi+ioreWumuOCkueuoeeQhlxuICog44Os44K544Od44Oz44K344OW44OH44K244Kk44Oz44CB44Ki44Kv44K744K344OT44Oq44OG44Kj44CB44Om44O844K244OT44Oq44OG44Kj44OG44K544OI44Gu6Kit5a6a44KS5ZCr44KAXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG4vKipcbiAqIFVJL1VY44OG44K544OI6Kit5a6a44Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVUlVWFRlc3RDb25maWcge1xuICAvLyDln7rmnKzoqK3lrppcbiAgdGVzdEVudmlyb25tZW50OiAncHJvZHVjdGlvbicgfCAnc3RhZ2luZycgfCAnZGV2ZWxvcG1lbnQnO1xuICByZWdpb246IHN0cmluZztcbiAgYmFzZVVybDogc3RyaW5nO1xuICBcbiAgLy8g44OT44Ol44O844Od44O844OI6Kit5a6aXG4gIHZpZXdwb3J0czoge1xuICAgIG1vYmlsZTogVmlld3BvcnRDb25maWc7XG4gICAgdGFibGV0OiBWaWV3cG9ydENvbmZpZztcbiAgICBkZXNrdG9wOiBWaWV3cG9ydENvbmZpZztcbiAgICB1bHRyYXdpZGU/OiBWaWV3cG9ydENvbmZpZztcbiAgfTtcbiAgXG4gIC8vIOODkeODleOCqeODvOODnuODs+OCuemWvuWApFxuICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICBwYWdlTG9hZFRpbWU6IG51bWJlcjsgICAgICAgICAgIC8vIG1zXG4gICAgZmlyc3RDb250ZW50ZnVsUGFpbnQ6IG51bWJlcjsgICAvLyBtc1xuICAgIGxhcmdlc3RDb250ZW50ZnVsUGFpbnQ6IG51bWJlcjsgLy8gbXNcbiAgICBjdW11bGF0aXZlTGF5b3V0U2hpZnQ6IG51bWJlcjsgIC8vIDAtMVxuICAgIGZpcnN0SW5wdXREZWxheTogbnVtYmVyOyAgICAgICAgLy8gbXNcbiAgICBpbnRlcmFjdGlvblRvTmV4dFBhaW50OiBudW1iZXI7IC8vIG1zXG4gIH07XG4gIFxuICAvLyDjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPoqK3lrppcbiAgYWNjZXNzaWJpbGl0eToge1xuICAgIHdjYWdMZXZlbDogJ0EnIHwgJ0FBJyB8ICdBQUEnO1xuICAgIG1pbmltdW1Db250cmFzdFJhdGlvOiBudW1iZXI7XG4gICAgcmVxdWlyZUtleWJvYXJkTmF2aWdhdGlvbjogYm9vbGVhbjtcbiAgICByZXF1aXJlU2NyZWVuUmVhZGVyU3VwcG9ydDogYm9vbGVhbjtcbiAgICBtaW5pbXVtQWx0VGV4dENvdmVyYWdlOiBudW1iZXI7IC8vIDAtMVxuICAgIHRlc3RDb2xvckJsaW5kbmVzczogYm9vbGVhbjtcbiAgfTtcbiAgXG4gIC8vIOODpuODvOOCtuODk+ODquODhuOCo+ioreWumlxuICB1c2FiaWxpdHk6IHtcbiAgICBtaW5pbXVtTmF2aWdhdGlvbkVmZmljaWVuY3k6IG51bWJlcjsgIC8vIDAtMVxuICAgIG1pbmltdW1Gb3JtVXNhYmlsaXR5OiBudW1iZXI7ICAgICAgICAgLy8gMC0xXG4gICAgbWluaW11bUVycm9ySGFuZGxpbmc6IG51bWJlcjsgICAgICAgICAvLyAwLTFcbiAgICBtaW5pbXVtVXNlckZsb3dDb21wbGV0aW9uOiBudW1iZXI7ICAgIC8vIDAtMVxuICAgIHRlc3RVc2VySm91cm5leXM6IHN0cmluZ1tdO1xuICB9O1xuICBcbiAgLy8g44OW44Op44Km44K26Kit5a6aXG4gIGJyb3dzZXI6IHtcbiAgICB1c2VyQWdlbnQ6IHN0cmluZztcbiAgICBlbmFibGVKYXZhU2NyaXB0OiBib29sZWFuO1xuICAgIGVuYWJsZUltYWdlczogYm9vbGVhbjtcbiAgICBlbmFibGVDU1M6IGJvb2xlYW47XG4gICAgbmV0d29ya1Rocm90dGxpbmc/OiBOZXR3b3JrVGhyb3R0bGluZztcbiAgICBjcHVUaHJvdHRsaW5nPzogbnVtYmVyOyAvLyAxLTIweFxuICB9O1xuICBcbiAgLy8g44OG44K544OI5a6f6KGM6Kit5a6aXG4gIGV4ZWN1dGlvbjoge1xuICAgIHNjcmVlbnNob3RPbkZhaWx1cmU6IGJvb2xlYW47XG4gICAgc2NyZWVuc2hvdEZvcm1hdDogJ3BuZycgfCAnanBlZycgfCAnd2VicCc7XG4gICAgc2NyZWVuc2hvdFF1YWxpdHk6IG51bWJlcjsgLy8gMC0xMDBcbiAgICBtYXhUZXN0RHVyYXRpb246IG51bWJlcjsgICAvLyBzZWNvbmRzXG4gICAgcmV0cnlPbkZhaWx1cmU6IGJvb2xlYW47XG4gICAgbWF4UmV0cmllczogbnVtYmVyO1xuICB9O1xuICBcbiAgLy8g5a6J5YWo6Kit5a6aXG4gIHNhZmV0eToge1xuICAgIHJlYWRPbmx5TW9kZTogYm9vbGVhbjtcbiAgICBwcmV2ZW50RGF0YU1vZGlmaWNhdGlvbjogYm9vbGVhbjtcbiAgICBlbWVyZ2VuY3lTdG9wRW5hYmxlZDogYm9vbGVhbjtcbiAgICBtYXhJbnRlcmFjdGlvbkRlcHRoOiBudW1iZXI7XG4gIH07XG59XG5cbi8qKlxuICog44OT44Ol44O844Od44O844OI6Kit5a6aXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVmlld3BvcnRDb25maWcge1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgZGV2aWNlU2NhbGVGYWN0b3I6IG51bWJlcjtcbiAgaXNNb2JpbGU6IGJvb2xlYW47XG4gIGhhc1RvdWNoOiBib29sZWFuO1xuICBpc0xhbmRzY2FwZTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiDjg43jg4Pjg4jjg6/jg7zjgq/liLbpmZDoqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZXR3b3JrVGhyb3R0bGluZyB7XG4gIG9mZmxpbmU6IGJvb2xlYW47XG4gIGRvd25sb2FkVGhyb3VnaHB1dDogbnVtYmVyOyAvLyBieXRlcy9zXG4gIHVwbG9hZFRocm91Z2hwdXQ6IG51bWJlcjsgICAvLyBieXRlcy9zXG4gIGxhdGVuY3k6IG51bWJlcjsgICAgICAgICAgICAvLyBtc1xufVxuXG4vKipcbiAqIOacrOeVqueSsOWig+eUqFVJL1VY44OG44K544OI6Kit5a6aXG4gKi9cbmV4cG9ydCBjb25zdCBwcm9kdWN0aW9uVUlVWENvbmZpZzogVUlVWFRlc3RDb25maWcgPSB7XG4gIHRlc3RFbnZpcm9ubWVudDogJ3Byb2R1Y3Rpb24nLFxuICByZWdpb246ICdhcC1ub3J0aGVhc3QtMScsXG4gIGJhc2VVcmw6ICdodHRwczovL2QxMjM0NTY3ODkwLmNsb3VkZnJvbnQubmV0JywgLy8g5a6f6Zqb44GuQ2xvdWRGcm9udCBVUkxcbiAgXG4gIHZpZXdwb3J0czoge1xuICAgIG1vYmlsZToge1xuICAgICAgd2lkdGg6IDM3NSxcbiAgICAgIGhlaWdodDogNjY3LFxuICAgICAgZGV2aWNlU2NhbGVGYWN0b3I6IDIsXG4gICAgICBpc01vYmlsZTogdHJ1ZSxcbiAgICAgIGhhc1RvdWNoOiB0cnVlLFxuICAgICAgaXNMYW5kc2NhcGU6IGZhbHNlXG4gICAgfSxcbiAgICB0YWJsZXQ6IHtcbiAgICAgIHdpZHRoOiA3NjgsXG4gICAgICBoZWlnaHQ6IDEwMjQsXG4gICAgICBkZXZpY2VTY2FsZUZhY3RvcjogMixcbiAgICAgIGlzTW9iaWxlOiBmYWxzZSxcbiAgICAgIGhhc1RvdWNoOiB0cnVlLFxuICAgICAgaXNMYW5kc2NhcGU6IGZhbHNlXG4gICAgfSxcbiAgICBkZXNrdG9wOiB7XG4gICAgICB3aWR0aDogMTkyMCxcbiAgICAgIGhlaWdodDogMTA4MCxcbiAgICAgIGRldmljZVNjYWxlRmFjdG9yOiAxLFxuICAgICAgaXNNb2JpbGU6IGZhbHNlLFxuICAgICAgaGFzVG91Y2g6IGZhbHNlLFxuICAgICAgaXNMYW5kc2NhcGU6IHRydWVcbiAgICB9LFxuICAgIHVsdHJhd2lkZToge1xuICAgICAgd2lkdGg6IDM0NDAsXG4gICAgICBoZWlnaHQ6IDE0NDAsXG4gICAgICBkZXZpY2VTY2FsZUZhY3RvcjogMSxcbiAgICAgIGlzTW9iaWxlOiBmYWxzZSxcbiAgICAgIGhhc1RvdWNoOiBmYWxzZSxcbiAgICAgIGlzTGFuZHNjYXBlOiB0cnVlXG4gICAgfVxuICB9LFxuICBcbiAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgcGFnZUxvYWRUaW1lOiAzMDAwLCAgICAgICAgICAgLy8gM+enklxuICAgIGZpcnN0Q29udGVudGZ1bFBhaW50OiAxODAwLCAgIC8vIDEuOOenklxuICAgIGxhcmdlc3RDb250ZW50ZnVsUGFpbnQ6IDI1MDAsIC8vIDIuNeenklxuICAgIGN1bXVsYXRpdmVMYXlvdXRTaGlmdDogMC4xLCAgIC8vIDAuMeS7peS4i1xuICAgIGZpcnN0SW5wdXREZWxheTogMTAwLCAgICAgICAgIC8vIDEwMG1zXG4gICAgaW50ZXJhY3Rpb25Ub05leHRQYWludDogMjAwICAgLy8gMjAwbXNcbiAgfSxcbiAgXG4gIGFjY2Vzc2liaWxpdHk6IHtcbiAgICB3Y2FnTGV2ZWw6ICdBQScsXG4gICAgbWluaW11bUNvbnRyYXN0UmF0aW86IDQuNSxcbiAgICByZXF1aXJlS2V5Ym9hcmROYXZpZ2F0aW9uOiB0cnVlLFxuICAgIHJlcXVpcmVTY3JlZW5SZWFkZXJTdXBwb3J0OiB0cnVlLFxuICAgIG1pbmltdW1BbHRUZXh0Q292ZXJhZ2U6IDAuOSwgIC8vIDkwJVxuICAgIHRlc3RDb2xvckJsaW5kbmVzczogdHJ1ZVxuICB9LFxuICBcbiAgdXNhYmlsaXR5OiB7XG4gICAgbWluaW11bU5hdmlnYXRpb25FZmZpY2llbmN5OiAwLjgsICAgLy8gODAlXG4gICAgbWluaW11bUZvcm1Vc2FiaWxpdHk6IDAuOCwgICAgICAgICAgLy8gODAlXG4gICAgbWluaW11bUVycm9ySGFuZGxpbmc6IDAuNywgICAgICAgICAgLy8gNzAlXG4gICAgbWluaW11bVVzZXJGbG93Q29tcGxldGlvbjogMC44NSwgICAgLy8gODUlXG4gICAgdGVzdFVzZXJKb3VybmV5czogW1xuICAgICAgJ2xvZ2luLXRvLWNoYXQnLFxuICAgICAgJ2RvY3VtZW50LXVwbG9hZC1hbmQtcXVlcnknLFxuICAgICAgJ2NoYXQtaGlzdG9yeS1yZXZpZXcnLFxuICAgICAgJ2xvZ291dCdcbiAgICBdXG4gIH0sXG4gIFxuICBicm93c2VyOiB7XG4gICAgdXNlckFnZW50OiAnTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMC4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcbiAgICBlbmFibGVKYXZhU2NyaXB0OiB0cnVlLFxuICAgIGVuYWJsZUltYWdlczogdHJ1ZSxcbiAgICBlbmFibGVDU1M6IHRydWUsXG4gICAgbmV0d29ya1Rocm90dGxpbmc6IHtcbiAgICAgIG9mZmxpbmU6IGZhbHNlLFxuICAgICAgZG93bmxvYWRUaHJvdWdocHV0OiAxLjUgKiAxMDI0ICogMTAyNCwgLy8gMS41IE1icHNcbiAgICAgIHVwbG9hZFRocm91Z2hwdXQ6IDc1MCAqIDEwMjQsICAgICAgICAgICAvLyA3NTAgS2Jwc1xuICAgICAgbGF0ZW5jeTogNDAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDQwbXNcbiAgICB9XG4gIH0sXG4gIFxuICBleGVjdXRpb246IHtcbiAgICBzY3JlZW5zaG90T25GYWlsdXJlOiB0cnVlLFxuICAgIHNjcmVlbnNob3RGb3JtYXQ6ICdwbmcnLFxuICAgIHNjcmVlbnNob3RRdWFsaXR5OiA5MCxcbiAgICBtYXhUZXN0RHVyYXRpb246IDYwMCwgICAgIC8vIDEw5YiGXG4gICAgcmV0cnlPbkZhaWx1cmU6IHRydWUsXG4gICAgbWF4UmV0cmllczogMlxuICB9LFxuICBcbiAgc2FmZXR5OiB7XG4gICAgcmVhZE9ubHlNb2RlOiB0cnVlLFxuICAgIHByZXZlbnREYXRhTW9kaWZpY2F0aW9uOiB0cnVlLFxuICAgIGVtZXJnZW5jeVN0b3BFbmFibGVkOiB0cnVlLFxuICAgIG1heEludGVyYWN0aW9uRGVwdGg6IDEwXG4gIH1cbn07XG5cbi8qKlxuICog44K544OG44O844K444Oz44Kw55Kw5aKD55SoVUkvVVjjg4bjgrnjg4joqK3lrppcbiAqL1xuZXhwb3J0IGNvbnN0IHN0YWdpbmdVSVVYQ29uZmlnOiBVSVVYVGVzdENvbmZpZyA9IHtcbiAgLi4ucHJvZHVjdGlvblVJVVhDb25maWcsXG4gIHRlc3RFbnZpcm9ubWVudDogJ3N0YWdpbmcnLFxuICBiYXNlVXJsOiAnaHR0cHM6Ly9zdGFnaW5nLmV4YW1wbGUuY29tJyxcbiAgXG4gIC8vIOOCiOOCiuWOs+OBl+OBhOODhuOCueODiOioreWumlxuICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICBwYWdlTG9hZFRpbWU6IDI1MDAsICAgICAgICAgICAvLyAyLjXnp5JcbiAgICBmaXJzdENvbnRlbnRmdWxQYWludDogMTUwMCwgICAvLyAxLjXnp5JcbiAgICBsYXJnZXN0Q29udGVudGZ1bFBhaW50OiAyMDAwLCAvLyAy56eSXG4gICAgY3VtdWxhdGl2ZUxheW91dFNoaWZ0OiAwLjA1LCAgLy8gMC4wNeS7peS4i1xuICAgIGZpcnN0SW5wdXREZWxheTogNTAsICAgICAgICAgIC8vIDUwbXNcbiAgICBpbnRlcmFjdGlvblRvTmV4dFBhaW50OiAxNTAgICAvLyAxNTBtc1xuICB9LFxuICBcbiAgYWNjZXNzaWJpbGl0eToge1xuICAgIC4uLnByb2R1Y3Rpb25VSVVYQ29uZmlnLmFjY2Vzc2liaWxpdHksXG4gICAgd2NhZ0xldmVsOiAnQUFBJyxcbiAgICBtaW5pbXVtQ29udHJhc3RSYXRpbzogNy4wLFxuICAgIG1pbmltdW1BbHRUZXh0Q292ZXJhZ2U6IDAuOTUgIC8vIDk1JVxuICB9LFxuICBcbiAgdXNhYmlsaXR5OiB7XG4gICAgLi4ucHJvZHVjdGlvblVJVVhDb25maWcudXNhYmlsaXR5LFxuICAgIG1pbmltdW1OYXZpZ2F0aW9uRWZmaWNpZW5jeTogMC44NSwgIC8vIDg1JVxuICAgIG1pbmltdW1Gb3JtVXNhYmlsaXR5OiAwLjg1LCAgICAgICAgIC8vIDg1JVxuICAgIG1pbmltdW1FcnJvckhhbmRsaW5nOiAwLjgsICAgICAgICAgIC8vIDgwJVxuICAgIG1pbmltdW1Vc2VyRmxvd0NvbXBsZXRpb246IDAuOSAgICAgIC8vIDkwJVxuICB9LFxuICBcbiAgZXhlY3V0aW9uOiB7XG4gICAgLi4ucHJvZHVjdGlvblVJVVhDb25maWcuZXhlY3V0aW9uLFxuICAgIG1heFRlc3REdXJhdGlvbjogOTAwLCAgICAgICAgIC8vIDE15YiGXG4gICAgbWF4UmV0cmllczogM1xuICB9LFxuICBcbiAgc2FmZXR5OiB7XG4gICAgLi4ucHJvZHVjdGlvblVJVVhDb25maWcuc2FmZXR5LFxuICAgIHJlYWRPbmx5TW9kZTogZmFsc2UsICAgICAgICAgIC8vIOOCueODhuODvOOCuOODs+OCsOOBp+OBr+abuOOBjei+vOOBv+WPr+iDvVxuICAgIHByZXZlbnREYXRhTW9kaWZpY2F0aW9uOiBmYWxzZSxcbiAgICBtYXhJbnRlcmFjdGlvbkRlcHRoOiAxNVxuICB9XG59O1xuXG4vKipcbiAqIOmWi+eZuueSsOWig+eUqFVJL1VY44OG44K544OI6Kit5a6aXG4gKi9cbmV4cG9ydCBjb25zdCBkZXZlbG9wbWVudFVJVVhDb25maWc6IFVJVVhUZXN0Q29uZmlnID0ge1xuICAuLi5wcm9kdWN0aW9uVUlVWENvbmZpZyxcbiAgdGVzdEVudmlyb25tZW50OiAnZGV2ZWxvcG1lbnQnLFxuICBiYXNlVXJsOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcbiAgXG4gIC8vIOe3qeOBhOioreWumlxuICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICBwYWdlTG9hZFRpbWU6IDUwMDAsICAgICAgICAgICAvLyA156eSXG4gICAgZmlyc3RDb250ZW50ZnVsUGFpbnQ6IDMwMDAsICAgLy8gM+enklxuICAgIGxhcmdlc3RDb250ZW50ZnVsUGFpbnQ6IDQwMDAsIC8vIDTnp5JcbiAgICBjdW11bGF0aXZlTGF5b3V0U2hpZnQ6IDAuMiwgICAvLyAwLjLku6XkuItcbiAgICBmaXJzdElucHV0RGVsYXk6IDIwMCwgICAgICAgICAvLyAyMDBtc1xuICAgIGludGVyYWN0aW9uVG9OZXh0UGFpbnQ6IDMwMCAgIC8vIDMwMG1zXG4gIH0sXG4gIFxuICBhY2Nlc3NpYmlsaXR5OiB7XG4gICAgLi4ucHJvZHVjdGlvblVJVVhDb25maWcuYWNjZXNzaWJpbGl0eSxcbiAgICB3Y2FnTGV2ZWw6ICdBJyxcbiAgICBtaW5pbXVtQ29udHJhc3RSYXRpbzogMy4wLFxuICAgIG1pbmltdW1BbHRUZXh0Q292ZXJhZ2U6IDAuNyAgIC8vIDcwJVxuICB9LFxuICBcbiAgdXNhYmlsaXR5OiB7XG4gICAgLi4ucHJvZHVjdGlvblVJVVhDb25maWcudXNhYmlsaXR5LFxuICAgIG1pbmltdW1OYXZpZ2F0aW9uRWZmaWNpZW5jeTogMC42LCAgIC8vIDYwJVxuICAgIG1pbmltdW1Gb3JtVXNhYmlsaXR5OiAwLjYsICAgICAgICAgIC8vIDYwJVxuICAgIG1pbmltdW1FcnJvckhhbmRsaW5nOiAwLjUsICAgICAgICAgIC8vIDUwJVxuICAgIG1pbmltdW1Vc2VyRmxvd0NvbXBsZXRpb246IDAuNyAgICAgIC8vIDcwJVxuICB9LFxuICBcbiAgYnJvd3Nlcjoge1xuICAgIC4uLnByb2R1Y3Rpb25VSVVYQ29uZmlnLmJyb3dzZXIsXG4gICAgbmV0d29ya1Rocm90dGxpbmc6IHVuZGVmaW5lZCAgLy8g5Yi26ZmQ44Gq44GXXG4gIH0sXG4gIFxuICBleGVjdXRpb246IHtcbiAgICAuLi5wcm9kdWN0aW9uVUlVWENvbmZpZy5leGVjdXRpb24sXG4gICAgbWF4VGVzdER1cmF0aW9uOiAzMDAsICAgICAgICAgLy8gNeWIhlxuICAgIG1heFJldHJpZXM6IDFcbiAgfSxcbiAgXG4gIHNhZmV0eToge1xuICAgIC4uLnByb2R1Y3Rpb25VSVVYQ29uZmlnLnNhZmV0eSxcbiAgICByZWFkT25seU1vZGU6IGZhbHNlLFxuICAgIHByZXZlbnREYXRhTW9kaWZpY2F0aW9uOiBmYWxzZSxcbiAgICBtYXhJbnRlcmFjdGlvbkRlcHRoOiAyMFxuICB9XG59O1xuXG4vKipcbiAqIOeSsOWig+OBq+W/nOOBmOOBn+ioreWumuOBruWPluW+l1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VUlVWENvbmZpZyhlbnZpcm9ubWVudDogc3RyaW5nKTogVUlVWFRlc3RDb25maWcge1xuICBzd2l0Y2ggKGVudmlyb25tZW50LnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdwcm9kdWN0aW9uJzpcbiAgICBjYXNlICdwcm9kJzpcbiAgICAgIHJldHVybiBwcm9kdWN0aW9uVUlVWENvbmZpZztcbiAgICBjYXNlICdzdGFnaW5nJzpcbiAgICBjYXNlICdzdGFnZSc6XG4gICAgICByZXR1cm4gc3RhZ2luZ1VJVVhDb25maWc7XG4gICAgY2FzZSAnZGV2ZWxvcG1lbnQnOlxuICAgIGNhc2UgJ2Rldic6XG4gICAgICByZXR1cm4gZGV2ZWxvcG1lbnRVSVVYQ29uZmlnO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zb2xlLndhcm4oYOacquefpeOBrueSsOWigzogJHtlbnZpcm9ubWVudH0uIOmWi+eZuueSsOWig+ioreWumuOCkuS9v+eUqOOBl+OBvuOBmeOAgmApO1xuICAgICAgcmV0dXJuIGRldmVsb3BtZW50VUlVWENvbmZpZztcbiAgfVxufVxuXG4vKipcbiAqIFVJL1VY44OG44K544OI6Kit5a6a44Gu5qSc6Ki8XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVVJVVhDb25maWcoY29uZmlnOiBVSVVYVGVzdENvbmZpZyk6IHtcbiAgaXNWYWxpZDogYm9vbGVhbjtcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgLy8g5b+F6aCI44OV44Kj44O844Or44OJ44Gu5qSc6Ki8XG4gIGlmICghY29uZmlnLmJhc2VVcmwpIHtcbiAgICBlcnJvcnMucHVzaCgn44OZ44O844K5VVJM44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gIH1cblxuICBpZiAoIWNvbmZpZy5yZWdpb24pIHtcbiAgICBlcnJvcnMucHVzaCgn44Oq44O844K444On44Oz44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gIH1cblxuICAvLyDjg5Pjg6Xjg7zjg53jg7zjg4joqK3lrprjga7mpJzoqLxcbiAgY29uc3QgcmVxdWlyZWRWaWV3cG9ydHMgPSBbJ21vYmlsZScsICd0YWJsZXQnLCAnZGVza3RvcCddO1xuICBmb3IgKGNvbnN0IHZpZXdwb3J0IG9mIHJlcXVpcmVkVmlld3BvcnRzKSB7XG4gICAgY29uc3Qgdmlld3BvcnRDb25maWcgPSBjb25maWcudmlld3BvcnRzW3ZpZXdwb3J0IGFzIGtleW9mIHR5cGVvZiBjb25maWcudmlld3BvcnRzXTtcbiAgICBpZiAoIXZpZXdwb3J0Q29uZmlnKSB7XG4gICAgICBlcnJvcnMucHVzaChgJHt2aWV3cG9ydH3jg5Pjg6Xjg7zjg53jg7zjg4joqK3lrprjgYzkuI3otrPjgZfjgabjgYTjgb7jgZlgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHZpZXdwb3J0Q29uZmlnLndpZHRoIDw9IDAgfHwgdmlld3BvcnRDb25maWcuaGVpZ2h0IDw9IDApIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYCR7dmlld3BvcnR944OT44Ol44O844Od44O844OI44Gu44K144Kk44K644GM54Sh5Yq544Gn44GZYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8g44OR44OV44Kp44O844Oe44Oz44K56Za+5YCk44Gu5qSc6Ki8XG4gIGlmIChjb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLnBhZ2VMb2FkVGltZSA8PSAwKSB7XG4gICAgZXJyb3JzLnB1c2goJ+ODmuODvOOCuOiqreOBv+i+vOOBv+aZgumWk+OBrumWvuWApOOBr+ato+OBruWApOOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmScpO1xuICB9XG5cbiAgaWYgKGNvbmZpZy5wZXJmb3JtYW5jZVRocmVzaG9sZHMuY3VtdWxhdGl2ZUxheW91dFNoaWZ0IDwgMCB8fCBjb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLmN1bXVsYXRpdmVMYXlvdXRTaGlmdCA+IDEpIHtcbiAgICBlcnJvcnMucHVzaCgnQ0xT6Za+5YCk44GvMC0x44Gu56+E5Zuy44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gIH1cblxuICAvLyDjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPoqK3lrprjga7mpJzoqLxcbiAgaWYgKGNvbmZpZy5hY2Nlc3NpYmlsaXR5Lm1pbmltdW1Db250cmFzdFJhdGlvIDwgMSkge1xuICAgIGVycm9ycy5wdXNoKCfmnIDlsI/jgrPjg7Pjg4jjg6njgrnjg4jmr5Tjga8x5Lul5LiK44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gIH1cblxuICBpZiAoY29uZmlnLmFjY2Vzc2liaWxpdHkubWluaW11bUFsdFRleHRDb3ZlcmFnZSA8IDAgfHwgY29uZmlnLmFjY2Vzc2liaWxpdHkubWluaW11bUFsdFRleHRDb3ZlcmFnZSA+IDEpIHtcbiAgICBlcnJvcnMucHVzaCgn5Luj5pu/44OG44Kt44K544OI44Kr44OQ44Os44OD44K444GvMC0x44Gu56+E5Zuy44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gIH1cblxuICAvLyDjg6bjg7zjgrbjg5Pjg6rjg4bjgqPoqK3lrprjga7mpJzoqLxcbiAgY29uc3QgdXNhYmlsaXR5TWV0cmljcyA9IFtcbiAgICAnbWluaW11bU5hdmlnYXRpb25FZmZpY2llbmN5JyxcbiAgICAnbWluaW11bUZvcm1Vc2FiaWxpdHknLFxuICAgICdtaW5pbXVtRXJyb3JIYW5kbGluZycsXG4gICAgJ21pbmltdW1Vc2VyRmxvd0NvbXBsZXRpb24nXG4gIF07XG5cbiAgZm9yIChjb25zdCBtZXRyaWMgb2YgdXNhYmlsaXR5TWV0cmljcykge1xuICAgIGNvbnN0IHZhbHVlID0gY29uZmlnLnVzYWJpbGl0eVttZXRyaWMgYXMga2V5b2YgdHlwZW9mIGNvbmZpZy51c2FiaWxpdHldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmICh2YWx1ZSA8IDAgfHwgdmFsdWUgPiAxKSkge1xuICAgICAgZXJyb3JzLnB1c2goYCR7bWV0cmljfeOBrzAtMeOBruevhOWbsuOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIOWun+ihjOioreWumuOBruaknOiovFxuICBpZiAoY29uZmlnLmV4ZWN1dGlvbi5tYXhUZXN0RHVyYXRpb24gPD0gMCkge1xuICAgIGVycm9ycy5wdXNoKCfmnIDlpKfjg4bjgrnjg4jmmYLplpPjga/mraPjga7lgKTjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIGlmIChjb25maWcuZXhlY3V0aW9uLm1heFJldHJpZXMgPCAwKSB7XG4gICAgZXJyb3JzLnB1c2goJ+acgOWkp+ODquODiOODqeOCpOWbnuaVsOOBrzDku6XkuIrjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIC8vIOitpuWRiuOBrueUn+aIkFxuICBpZiAoY29uZmlnLnRlc3RFbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaWYgKGNvbmZpZy5wZXJmb3JtYW5jZVRocmVzaG9sZHMucGFnZUxvYWRUaW1lID4gMzAwMCkge1xuICAgICAgd2FybmluZ3MucHVzaCgn5pys55Wq55Kw5aKD44Gn44Gu44Oa44O844K46Kqt44G/6L6844G/5pmC6ZaT6Za+5YCk44GMM+enkuOCkui2heOBiOOBpuOBhOOBvuOBmScpO1xuICAgIH1cblxuICAgIGlmICghY29uZmlnLnNhZmV0eS5yZWFkT25seU1vZGUpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goJ+acrOeVqueSsOWig+OBp+iqreOBv+WPluOCiuWwgueUqOODouODvOODieOBjOeEoeWKueOBq+OBquOBo+OBpuOBhOOBvuOBmScpO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuZXhlY3V0aW9uLm1heFRlc3REdXJhdGlvbiA+IDYwMCkge1xuICAgICAgd2FybmluZ3MucHVzaCgn5pys55Wq55Kw5aKD44Gn44Gu44OG44K544OI5pyA5aSn5a6f6KGM5pmC6ZaT44GMMTDliIbjgpLotoXjgYjjgabjgYTjgb7jgZknKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29uZmlnLmFjY2Vzc2liaWxpdHkud2NhZ0xldmVsID09PSAnQScpIHtcbiAgICB3YXJuaW5ncy5wdXNoKCdXQ0FH5rqW5oug44Os44OZ44Or44GMQeOBq+ioreWumuOBleOCjOOBpuOBhOOBvuOBmeOAgkFB44G+44Gf44GvQUFB44KS5o6o5aWo44GX44G+44GZJyk7XG4gIH1cblxuICBpZiAoY29uZmlnLmFjY2Vzc2liaWxpdHkubWluaW11bUNvbnRyYXN0UmF0aW8gPCA0LjUpIHtcbiAgICB3YXJuaW5ncy5wdXNoKCfmnIDlsI/jgrPjg7Pjg4jjg6njgrnjg4jmr5TjgYw0LjU6MeOCkuS4i+WbnuOBo+OBpuOBhOOBvuOBmeOAgldDQUcgQUHmupbmi6Djga7jgZ/jgoE0LjU6MeS7peS4iuOCkuaOqOWlqOOBl+OBvuOBmScpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpc1ZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIGVycm9ycyxcbiAgICB3YXJuaW5nc1xuICB9O1xufVxuXG4vKipcbiAqIFVJL1VY44OG44K544OI6Kit5a6a44Gu6KGo56S6XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNwbGF5VUlVWENvbmZpZyhjb25maWc6IFVJVVhUZXN0Q29uZmlnKTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCfwn46oIFVJL1VY44OG44K544OI6Kit5a6aOicpO1xuICBjb25zb2xlLmxvZyhgICAg55Kw5aKDOiAke2NvbmZpZy50ZXN0RW52aXJvbm1lbnR9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDjg6rjg7zjgrjjg6fjg7M6ICR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgY29uc29sZS5sb2coYCAgIOODmeODvOOCuVVSTDogJHtjb25maWcuYmFzZVVybH1gKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ/Cfk7Eg44OT44Ol44O844Od44O844OI6Kit5a6aOicpO1xuICBPYmplY3QuZW50cmllcyhjb25maWcudmlld3BvcnRzKS5mb3JFYWNoKChbbmFtZSwgdmlld3BvcnRdKSA9PiB7XG4gICAgY29uc29sZS5sb2coYCAgICR7bmFtZX06ICR7dmlld3BvcnQud2lkdGh9eCR7dmlld3BvcnQuaGVpZ2h0fSAoJHt2aWV3cG9ydC5pc01vYmlsZSA/ICfjg6Ljg5DjgqTjg6snIDogJ+ODh+OCueOCr+ODiOODg+ODlyd9KWApO1xuICB9KTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ+KaoSDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnplr7lgKQ6Jyk7XG4gIGNvbnNvbGUubG9nKGAgICDjg5rjg7zjgrjoqq3jgb/ovrzjgb/mmYLplpM6ICR7Y29uZmlnLnBlcmZvcm1hbmNlVGhyZXNob2xkcy5wYWdlTG9hZFRpbWV9bXNgKTtcbiAgY29uc29sZS5sb2coYCAgIEZpcnN0IENvbnRlbnRmdWwgUGFpbnQ6ICR7Y29uZmlnLnBlcmZvcm1hbmNlVGhyZXNob2xkcy5maXJzdENvbnRlbnRmdWxQYWludH1tc2ApO1xuICBjb25zb2xlLmxvZyhgICAgTGFyZ2VzdCBDb250ZW50ZnVsIFBhaW50OiAke2NvbmZpZy5wZXJmb3JtYW5jZVRocmVzaG9sZHMubGFyZ2VzdENvbnRlbnRmdWxQYWludH1tc2ApO1xuICBjb25zb2xlLmxvZyhgICAgQ3VtdWxhdGl2ZSBMYXlvdXQgU2hpZnQ6ICR7Y29uZmlnLnBlcmZvcm1hbmNlVGhyZXNob2xkcy5jdW11bGF0aXZlTGF5b3V0U2hpZnR9YCk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgXG4gIGNvbnNvbGUubG9nKCfimb8g44Ki44Kv44K744K344OT44Oq44OG44Kj6Kit5a6aOicpO1xuICBjb25zb2xlLmxvZyhgICAgV0NBR+a6luaLoOODrOODmeODqzogJHtjb25maWcuYWNjZXNzaWJpbGl0eS53Y2FnTGV2ZWx9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDmnIDlsI/jgrPjg7Pjg4jjg6njgrnjg4jmr5Q6ICR7Y29uZmlnLmFjY2Vzc2liaWxpdHkubWluaW11bUNvbnRyYXN0UmF0aW99OjFgKTtcbiAgY29uc29sZS5sb2coYCAgIOOCreODvOODnOODvOODieODiuODk+OCsuODvOOCt+ODp+ODszogJHtjb25maWcuYWNjZXNzaWJpbGl0eS5yZXF1aXJlS2V5Ym9hcmROYXZpZ2F0aW9uID8gJ+W/hemgiCcgOiAn44Kq44OX44K344On44OzJ31gKTtcbiAgY29uc29sZS5sb2coYCAgIOOCueOCr+ODquODvOODs+ODquODvOODgOODvOWvvuW/nDogJHtjb25maWcuYWNjZXNzaWJpbGl0eS5yZXF1aXJlU2NyZWVuUmVhZGVyU3VwcG9ydCA/ICflv4XpoIgnIDogJ+OCquODl+OCt+ODp+ODsyd9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDku6Pmm7/jg4bjgq3jgrnjg4jjgqvjg5Djg6zjg4Pjgrg6ICR7KGNvbmZpZy5hY2Nlc3NpYmlsaXR5Lm1pbmltdW1BbHRUZXh0Q292ZXJhZ2UgKiAxMDApLnRvRml4ZWQoMCl9JWApO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIFxuICBjb25zb2xlLmxvZygn8J+RpCDjg6bjg7zjgrbjg5Pjg6rjg4bjgqPoqK3lrpo6Jyk7XG4gIGNvbnNvbGUubG9nKGAgICDjg4rjg5PjgrLjg7zjgrfjg6fjg7Plirnnjoc6ICR7KGNvbmZpZy51c2FiaWxpdHkubWluaW11bU5hdmlnYXRpb25FZmZpY2llbmN5ICogMTAwKS50b0ZpeGVkKDApfSXku6XkuIpgKTtcbiAgY29uc29sZS5sb2coYCAgIOODleOCqeODvOODoOS9v+OBhOOChOOBmeOBlTogJHsoY29uZmlnLnVzYWJpbGl0eS5taW5pbXVtRm9ybVVzYWJpbGl0eSAqIDEwMCkudG9GaXhlZCgwKX0l5Lul5LiKYCk7XG4gIGNvbnNvbGUubG9nKGAgICDjgqjjg6njg7zjg4/jg7Pjg4njg6rjg7PjgrA6ICR7KGNvbmZpZy51c2FiaWxpdHkubWluaW11bUVycm9ySGFuZGxpbmcgKiAxMDApLnRvRml4ZWQoMCl9JeS7peS4imApO1xuICBjb25zb2xlLmxvZyhgICAg44Om44O844K244O844OV44Ot44O85a6M5LqG546HOiAkeyhjb25maWcudXNhYmlsaXR5Lm1pbmltdW1Vc2VyRmxvd0NvbXBsZXRpb24gKiAxMDApLnRvRml4ZWQoMCl9JeS7peS4imApO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIFxuICBjb25zb2xlLmxvZygn8J+boe+4jyDlronlhajoqK3lrpo6Jyk7XG4gIGNvbnNvbGUubG9nKGAgICDoqq3jgb/lj5bjgorlsILnlKjjg6Ljg7zjg4k6ICR7Y29uZmlnLnNhZmV0eS5yZWFkT25seU1vZGUgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICBjb25zb2xlLmxvZyhgICAg44OH44O844K/5aSJ5pu06Ziy5q2iOiAke2NvbmZpZy5zYWZldHkucHJldmVudERhdGFNb2RpZmljYXRpb24gPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICBjb25zb2xlLmxvZyhgICAg57eK5oCl5YGc5q2i5qmf6IO9OiAke2NvbmZpZy5zYWZldHkuZW1lcmdlbmN5U3RvcEVuYWJsZWQgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xuICBjb25zb2xlLmxvZyhgICAg5pyA5aSn5pON5L2c5rex5bqmOiAke2NvbmZpZy5zYWZldHkubWF4SW50ZXJhY3Rpb25EZXB0aH1gKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBwcm9kdWN0aW9uVUlVWENvbmZpZyxcbiAgc3RhZ2luZ1VJVVhDb25maWcsXG4gIGRldmVsb3BtZW50VUlVWENvbmZpZyxcbiAgZ2V0VUlVWENvbmZpZyxcbiAgdmFsaWRhdGVVSVVYQ29uZmlnLFxuICBkaXNwbGF5VUlVWENvbmZpZ1xufTsiXX0=