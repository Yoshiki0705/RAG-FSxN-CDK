"use strict";
/**
 * 統合テスト設定
 * セキュリティ、パフォーマンス、機能テストの統合実行設定
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cicdIntegratedTestConfig = exports.developmentIntegratedTestConfig = exports.stagingIntegratedTestConfig = exports.productionIntegratedTestConfig = void 0;
exports.getIntegratedTestConfig = getIntegratedTestConfig;
exports.validateIntegratedTestConfig = validateIntegratedTestConfig;
exports.mergeTestSuiteConfigs = mergeTestSuiteConfigs;
/**
 * 本番環境統合テスト設定
 */
exports.productionIntegratedTestConfig = {
    environment: 'production',
    // テストスイート設定
    testSuites: [
        {
            name: 'security',
            enabled: true,
            priority: 100, // 最高優先度
            dependencies: [],
            configuration: {
                enableEncryptionTests: true,
                enableAuthenticationTests: true,
                enableVulnerabilityScanning: true,
                complianceStandards: ['GDPR', 'SOC2', 'ISO27001']
            },
            skipOnFailure: false, // セキュリティテストが失敗しても他のテストを継続
            criticalTest: true
        },
        {
            name: 'functional',
            enabled: true,
            priority: 90,
            dependencies: [], // セキュリティテストに依存しない
            configuration: {
                enableUITests: true,
                enableAPITests: true,
                enableIntegrationTests: true,
                testDataSets: ['minimal', 'standard', 'edge-cases']
            },
            skipOnFailure: false,
            criticalTest: true
        },
        {
            name: 'performance',
            enabled: true,
            priority: 80,
            dependencies: ['functional'], // 機能テストが成功してから実行
            configuration: {
                enableLoadTests: true,
                enableStressTests: false, // 本番環境では無効
                enableScalabilityTests: true,
                maxConcurrentUsers: 100, // 本番環境では制限
                testDuration: 300 // 5分間
            },
            skipOnFailure: false,
            criticalTest: false // パフォーマンステストは非クリティカル
        }
    ],
    // 実行設定
    executionOrder: ['security', 'functional', 'performance'],
    parallelExecution: false, // 本番環境では順次実行
    maxConcurrentTests: 1,
    timeoutMs: 3600000, // 1時間
    retryAttempts: 2,
    emergencyStopEnabled: true,
    // レポート設定
    reportingConfig: {
        generateDetailedReport: true,
        exportFormats: ['json', 'html', 'csv'],
        outputDirectory: './test-reports',
        includeMetrics: true,
        includeScreenshots: true,
        includeLogs: true
    },
    // リソース制限
    resourceLimits: {
        maxCpuUsage: 70, // CPU使用率70%まで
        maxMemoryUsage: 80, // メモリ使用率80%まで
        maxNetworkBandwidth: 100, // 100Mbpsまで
        maxStorageUsage: 10, // 10GBまで
        maxCostThreshold: 50.0 // $50まで
    }
};
/**
 * ステージング環境統合テスト設定
 */
exports.stagingIntegratedTestConfig = {
    ...exports.productionIntegratedTestConfig,
    environment: 'staging',
    // ステージング環境では並列実行可能
    parallelExecution: true,
    maxConcurrentTests: 2,
    // より積極的なテスト設定
    testSuites: [
        {
            ...exports.productionIntegratedTestConfig.testSuites[0], // security
            configuration: {
                ...exports.productionIntegratedTestConfig.testSuites[0].configuration,
                enablePenetrationTests: true // ステージング環境では侵入テストも実行
            }
        },
        {
            ...exports.productionIntegratedTestConfig.testSuites[1], // functional
            configuration: {
                ...exports.productionIntegratedTestConfig.testSuites[1].configuration,
                testDataSets: ['minimal', 'standard', 'edge-cases', 'stress-data']
            }
        },
        {
            ...exports.productionIntegratedTestConfig.testSuites[2], // performance
            configuration: {
                ...exports.productionIntegratedTestConfig.testSuites[2].configuration,
                enableStressTests: true, // ステージング環境ではストレステストも実行
                maxConcurrentUsers: 500,
                testDuration: 600 // 10分間
            }
        }
    ],
    // より緩いリソース制限
    resourceLimits: {
        maxCpuUsage: 85,
        maxMemoryUsage: 90,
        maxNetworkBandwidth: 200,
        maxStorageUsage: 20,
        maxCostThreshold: 100.0
    }
};
/**
 * 開発環境統合テスト設定
 */
exports.developmentIntegratedTestConfig = {
    ...exports.productionIntegratedTestConfig,
    environment: 'development',
    // 開発環境では高速実行を優先
    parallelExecution: true,
    maxConcurrentTests: 3,
    timeoutMs: 1800000, // 30分
    // 軽量なテスト設定
    testSuites: [
        {
            ...exports.productionIntegratedTestConfig.testSuites[0], // security
            configuration: {
                enableEncryptionTests: true,
                enableAuthenticationTests: true,
                enableVulnerabilityScanning: false, // 開発環境では無効
                complianceStandards: ['basic']
            }
        },
        {
            ...exports.productionIntegratedTestConfig.testSuites[1], // functional
            configuration: {
                enableUITests: true,
                enableAPITests: true,
                enableIntegrationTests: false, // 開発環境では無効
                testDataSets: ['minimal']
            }
        },
        {
            ...exports.productionIntegratedTestConfig.testSuites[2], // performance
            enabled: false // 開発環境ではパフォーマンステストを無効
        }
    ],
    // 簡易レポート設定
    reportingConfig: {
        generateDetailedReport: false,
        exportFormats: ['json'],
        outputDirectory: './dev-test-reports',
        includeMetrics: false,
        includeScreenshots: false,
        includeLogs: true
    },
    // 緩いリソース制限
    resourceLimits: {
        maxCpuUsage: 95,
        maxMemoryUsage: 95,
        maxNetworkBandwidth: 1000,
        maxStorageUsage: 50,
        maxCostThreshold: 200.0
    }
};
/**
 * CI/CD環境統合テスト設定
 */
exports.cicdIntegratedTestConfig = {
    ...exports.productionIntegratedTestConfig,
    environment: 'cicd',
    // CI/CD環境では高速実行と確実性を重視
    parallelExecution: true,
    maxConcurrentTests: 2,
    timeoutMs: 2400000, // 40分
    retryAttempts: 1, // リトライ回数を減らして高速化
    // CI/CD向けテスト設定
    testSuites: [
        {
            ...exports.productionIntegratedTestConfig.testSuites[0], // security
            configuration: {
                enableEncryptionTests: true,
                enableAuthenticationTests: true,
                enableVulnerabilityScanning: true,
                complianceStandards: ['GDPR', 'SOC2'] // 必要最小限
            },
            criticalTest: true,
            skipOnFailure: true // CI/CDでは失敗時に後続をスキップ
        },
        {
            ...exports.productionIntegratedTestConfig.testSuites[1], // functional
            configuration: {
                enableUITests: false, // CI/CDではUIテストを無効
                enableAPITests: true,
                enableIntegrationTests: true,
                testDataSets: ['minimal', 'standard']
            },
            criticalTest: true,
            skipOnFailure: true
        },
        {
            ...exports.productionIntegratedTestConfig.testSuites[2], // performance
            configuration: {
                enableLoadTests: true,
                enableStressTests: false,
                enableScalabilityTests: false, // CI/CDでは無効
                maxConcurrentUsers: 50,
                testDuration: 180 // 3分間
            },
            criticalTest: false
        }
    ],
    // CI/CD向けレポート設定
    reportingConfig: {
        generateDetailedReport: true,
        exportFormats: ['json', 'html'], // PDFは除外
        outputDirectory: './cicd-test-reports',
        includeMetrics: true,
        includeScreenshots: false, // CI/CDでは無効
        includeLogs: true
    }
};
/**
 * 環境に応じた設定の取得
 */
function getIntegratedTestConfig(environment) {
    switch (environment.toLowerCase()) {
        case 'production':
        case 'prod':
            return exports.productionIntegratedTestConfig;
        case 'staging':
        case 'stage':
            return exports.stagingIntegratedTestConfig;
        case 'development':
        case 'dev':
            return exports.developmentIntegratedTestConfig;
        case 'cicd':
        case 'ci':
        case 'cd':
            return exports.cicdIntegratedTestConfig;
        default:
            console.warn(`未知の環境: ${environment}. 開発環境設定を使用します。`);
            return exports.developmentIntegratedTestConfig;
    }
}
/**
 * 統合テスト設定の検証
 */
function validateIntegratedTestConfig(config) {
    const errors = [];
    const warnings = [];
    // 基本設定の検証
    if (!config.environment) {
        errors.push('環境が指定されていません');
    }
    if (config.testSuites.length === 0) {
        errors.push('テストスイートが設定されていません');
    }
    // テストスイートの検証
    const enabledSuites = config.testSuites.filter(suite => suite.enabled);
    if (enabledSuites.length === 0) {
        warnings.push('有効なテストスイートがありません');
    }
    // 依存関係の検証
    const suiteNames = config.testSuites.map(suite => suite.name);
    config.testSuites.forEach(suite => {
        suite.dependencies.forEach(dep => {
            if (!suiteNames.includes(dep)) {
                errors.push(`テストスイート '${suite.name}' の依存関係 '${dep}' が見つかりません`);
            }
        });
    });
    // 実行順序の検証
    if (config.executionOrder.length > 0) {
        config.executionOrder.forEach(name => {
            if (!suiteNames.includes(name)) {
                warnings.push(`実行順序に指定された '${name}' がテストスイートに存在しません`);
            }
        });
    }
    // リソース制限の検証
    if (config.resourceLimits.maxCpuUsage > 100) {
        warnings.push('CPU使用率の上限が100%を超えています');
    }
    if (config.resourceLimits.maxMemoryUsage > 100) {
        warnings.push('メモリ使用率の上限が100%を超えています');
    }
    // タイムアウトの検証
    if (config.timeoutMs < 60000) { // 1分未満
        warnings.push('タイムアウトが短すぎる可能性があります');
    }
    if (config.timeoutMs > 7200000) { // 2時間超
        warnings.push('タイムアウトが長すぎる可能性があります');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * テストスイート設定のマージ
 */
function mergeTestSuiteConfigs(baseConfig, overrideConfig) {
    return {
        ...baseConfig,
        ...overrideConfig,
        configuration: {
            ...baseConfig.configuration,
            ...overrideConfig.configuration
        }
    };
}
exports.default = {
    productionIntegratedTestConfig: exports.productionIntegratedTestConfig,
    stagingIntegratedTestConfig: exports.stagingIntegratedTestConfig,
    developmentIntegratedTestConfig: exports.developmentIntegratedTestConfig,
    cicdIntegratedTestConfig: exports.cicdIntegratedTestConfig,
    getIntegratedTestConfig,
    validateIntegratedTestConfig,
    mergeTestSuiteConfigs
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyYXRlZC10ZXN0LWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVncmF0ZWQtdGVzdC1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBK1BILDBEQXVCQztBQUtELG9FQWlFQztBQUtELHNEQVlDO0FBeldEOztHQUVHO0FBQ1UsUUFBQSw4QkFBOEIsR0FBeUI7SUFDbEUsV0FBVyxFQUFFLFlBQVk7SUFFekIsWUFBWTtJQUNaLFVBQVUsRUFBRTtRQUNWO1lBQ0UsSUFBSSxFQUFFLFVBQVU7WUFDaEIsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVE7WUFDdkIsWUFBWSxFQUFFLEVBQUU7WUFDaEIsYUFBYSxFQUFFO2dCQUNiLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLHlCQUF5QixFQUFFLElBQUk7Z0JBQy9CLDJCQUEyQixFQUFFLElBQUk7Z0JBQ2pDLG1CQUFtQixFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUM7YUFDbEQ7WUFDRCxhQUFhLEVBQUUsS0FBSyxFQUFFLDBCQUEwQjtZQUNoRCxZQUFZLEVBQUUsSUFBSTtTQUNuQjtRQUNEO1lBQ0UsSUFBSSxFQUFFLFlBQVk7WUFDbEIsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsRUFBRTtZQUNaLFlBQVksRUFBRSxFQUFFLEVBQUUsa0JBQWtCO1lBQ3BDLGFBQWEsRUFBRTtnQkFDYixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLHNCQUFzQixFQUFFLElBQUk7Z0JBQzVCLFlBQVksRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsWUFBWSxDQUFDO2FBQ3BEO1lBQ0QsYUFBYSxFQUFFLEtBQUs7WUFDcEIsWUFBWSxFQUFFLElBQUk7U0FDbkI7UUFDRDtZQUNFLElBQUksRUFBRSxhQUFhO1lBQ25CLE9BQU8sRUFBRSxJQUFJO1lBQ2Is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S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlO0lBQ2IsOEJBQThCLEVBQTlCLHNDQUE4QjtJQUM5QiwyQkFBMkIsRUFBM0IsbUNBQTJCO0lBQzNCLCtCQUErQixFQUEvQix1Q0FBK0I7SUFDL0Isd0JBQXdCLEVBQXhCLGdDQUF3QjtJQUN4Qix1QkFBdUI7SUFDdkIsNEJBQTRCO0lBQzVCLHFCQUFxQjtDQUN0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDntbHlkIjjg4bjgrnjg4joqK3lrppcbiAqIOOCu+OCreODpeODquODhuOCo+OAgeODkeODleOCqeODvOODnuODs+OCueOAgeapn+iDveODhuOCueODiOOBrue1seWQiOWun+ihjOioreWumlxuICovXG5cbmltcG9ydCB7IEludGVncmF0ZWRUZXN0Q29uZmlnLCBUZXN0U3VpdGVDb25maWcgfSBmcm9tICcuLi9pbnRlZ3JhdGVkLXRlc3QtcnVubmVyJztcblxuLyoqXG4gKiDmnKznlarnkrDlooPntbHlkIjjg4bjgrnjg4joqK3lrppcbiAqL1xuZXhwb3J0IGNvbnN0IHByb2R1Y3Rpb25JbnRlZ3JhdGVkVGVzdENvbmZpZzogSW50ZWdyYXRlZFRlc3RDb25maWcgPSB7XG4gIGVudmlyb25tZW50OiAncHJvZHVjdGlvbicsXG4gIFxuICAvLyDjg4bjgrnjg4jjgrnjgqTjg7zjg4joqK3lrppcbiAgdGVzdFN1aXRlczogW1xuICAgIHtcbiAgICAgIG5hbWU6ICdzZWN1cml0eScsXG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgcHJpb3JpdHk6IDEwMCwgLy8g5pyA6auY5YSq5YWI5bqmXG4gICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgY29uZmlndXJhdGlvbjoge1xuICAgICAgICBlbmFibGVFbmNyeXB0aW9uVGVzdHM6IHRydWUsXG4gICAgICAgIGVuYWJsZUF1dGhlbnRpY2F0aW9uVGVzdHM6IHRydWUsXG4gICAgICAgIGVuYWJsZVZ1bG5lcmFiaWxpdHlTY2FubmluZzogdHJ1ZSxcbiAgICAgICAgY29tcGxpYW5jZVN0YW5kYXJkczogWydHRFBSJywgJ1NPQzInLCAnSVNPMjcwMDEnXVxuICAgICAgfSxcbiAgICAgIHNraXBPbkZhaWx1cmU6IGZhbHNlLCAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjgYzlpLHmlZfjgZfjgabjgoLku5bjga7jg4bjgrnjg4jjgpLntpnntppcbiAgICAgIGNyaXRpY2FsVGVzdDogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ2Z1bmN0aW9uYWwnLFxuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHByaW9yaXR5OiA5MCxcbiAgICAgIGRlcGVuZGVuY2llczogW10sIC8vIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOOBq+S+neWtmOOBl+OBquOBhFxuICAgICAgY29uZmlndXJhdGlvbjoge1xuICAgICAgICBlbmFibGVVSVRlc3RzOiB0cnVlLFxuICAgICAgICBlbmFibGVBUElUZXN0czogdHJ1ZSxcbiAgICAgICAgZW5hYmxlSW50ZWdyYXRpb25UZXN0czogdHJ1ZSxcbiAgICAgICAgdGVzdERhdGFTZXRzOiBbJ21pbmltYWwnLCAnc3RhbmRhcmQnLCAnZWRnZS1jYXNlcyddXG4gICAgICB9LFxuICAgICAgc2tpcE9uRmFpbHVyZTogZmFsc2UsXG4gICAgICBjcml0aWNhbFRlc3Q6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdwZXJmb3JtYW5jZScsXG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgcHJpb3JpdHk6IDgwLFxuICAgICAgZGVwZW5kZW5jaWVzOiBbJ2Z1bmN0aW9uYWwnXSwgLy8g5qmf6IO944OG44K544OI44GM5oiQ5Yqf44GX44Gm44GL44KJ5a6f6KGMXG4gICAgICBjb25maWd1cmF0aW9uOiB7XG4gICAgICAgIGVuYWJsZUxvYWRUZXN0czogdHJ1ZSxcbiAgICAgICAgZW5hYmxlU3RyZXNzVGVzdHM6IGZhbHNlLCAvLyDmnKznlarnkrDlooPjgafjga/nhKHlirlcbiAgICAgICAgZW5hYmxlU2NhbGFiaWxpdHlUZXN0czogdHJ1ZSxcbiAgICAgICAgbWF4Q29uY3VycmVudFVzZXJzOiAxMDAsIC8vIOacrOeVqueSsOWig+OBp+OBr+WItumZkFxuICAgICAgICB0ZXN0RHVyYXRpb246IDMwMCAvLyA15YiG6ZaTXG4gICAgICB9LFxuICAgICAgc2tpcE9uRmFpbHVyZTogZmFsc2UsXG4gICAgICBjcml0aWNhbFRlc3Q6IGZhbHNlIC8vIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOOBr+mdnuOCr+ODquODhuOCo+OCq+ODq1xuICAgIH1cbiAgXSxcblxuICAvLyDlrp/ooYzoqK3lrppcbiAgZXhlY3V0aW9uT3JkZXI6IFsnc2VjdXJpdHknLCAnZnVuY3Rpb25hbCcsICdwZXJmb3JtYW5jZSddLFxuICBwYXJhbGxlbEV4ZWN1dGlvbjogZmFsc2UsIC8vIOacrOeVqueSsOWig+OBp+OBr+mghuasoeWun+ihjFxuICBtYXhDb25jdXJyZW50VGVzdHM6IDEsXG4gIHRpbWVvdXRNczogMzYwMDAwMCwgLy8gMeaZgumWk1xuICByZXRyeUF0dGVtcHRzOiAyLFxuICBlbWVyZ2VuY3lTdG9wRW5hYmxlZDogdHJ1ZSxcblxuICAvLyDjg6zjg53jg7zjg4joqK3lrppcbiAgcmVwb3J0aW5nQ29uZmlnOiB7XG4gICAgZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydDogdHJ1ZSxcbiAgICBleHBvcnRGb3JtYXRzOiBbJ2pzb24nLCAnaHRtbCcsICdjc3YnXSxcbiAgICBvdXRwdXREaXJlY3Rvcnk6ICcuL3Rlc3QtcmVwb3J0cycsXG4gICAgaW5jbHVkZU1ldHJpY3M6IHRydWUsXG4gICAgaW5jbHVkZVNjcmVlbnNob3RzOiB0cnVlLFxuICAgIGluY2x1ZGVMb2dzOiB0cnVlXG4gIH0sXG5cbiAgLy8g44Oq44K944O844K55Yi26ZmQXG4gIHJlc291cmNlTGltaXRzOiB7XG4gICAgbWF4Q3B1VXNhZ2U6IDcwLCAgICAgICAgLy8gQ1BV5L2/55So546HNzAl44G+44GnXG4gICAgbWF4TWVtb3J5VXNhZ2U6IDgwLCAgICAgLy8g44Oh44Oi44Oq5L2/55So546HODAl44G+44GnXG4gICAgbWF4TmV0d29ya0JhbmR3aWR0aDogMTAwLCAvLyAxMDBNYnBz44G+44GnXG4gICAgbWF4U3RvcmFnZVVzYWdlOiAxMCwgICAgLy8gMTBHQuOBvuOBp1xuICAgIG1heENvc3RUaHJlc2hvbGQ6IDUwLjAgIC8vICQ1MOOBvuOBp1xuICB9XG59O1xuXG4vKipcbiAqIOOCueODhuODvOOCuOODs+OCsOeSsOWig+e1seWQiOODhuOCueODiOioreWumlxuICovXG5leHBvcnQgY29uc3Qgc3RhZ2luZ0ludGVncmF0ZWRUZXN0Q29uZmlnOiBJbnRlZ3JhdGVkVGVzdENvbmZpZyA9IHtcbiAgLi4ucHJvZHVjdGlvbkludGVncmF0ZWRUZXN0Q29uZmlnLFxuICBlbnZpcm9ubWVudDogJ3N0YWdpbmcnLFxuICBcbiAgLy8g44K544OG44O844K444Oz44Kw55Kw5aKD44Gn44Gv5Lim5YiX5a6f6KGM5Y+v6IO9XG4gIHBhcmFsbGVsRXhlY3V0aW9uOiB0cnVlLFxuICBtYXhDb25jdXJyZW50VGVzdHM6IDIsXG4gIFxuICAvLyDjgojjgornqY3mpbXnmoTjgarjg4bjgrnjg4joqK3lrppcbiAgdGVzdFN1aXRlczogW1xuICAgIHtcbiAgICAgIC4uLnByb2R1Y3Rpb25JbnRlZ3JhdGVkVGVzdENvbmZpZy50ZXN0U3VpdGVzWzBdLCAvLyBzZWN1cml0eVxuICAgICAgY29uZmlndXJhdGlvbjoge1xuICAgICAgICAuLi5wcm9kdWN0aW9uSW50ZWdyYXRlZFRlc3RDb25maWcudGVzdFN1aXRlc1swXS5jb25maWd1cmF0aW9uLFxuICAgICAgICBlbmFibGVQZW5ldHJhdGlvblRlc3RzOiB0cnVlIC8vIOOCueODhuODvOOCuOODs+OCsOeSsOWig+OBp+OBr+S+teWFpeODhuOCueODiOOCguWun+ihjFxuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgLi4ucHJvZHVjdGlvbkludGVncmF0ZWRUZXN0Q29uZmlnLnRlc3RTdWl0ZXNbMV0sIC8vIGZ1bmN0aW9uYWxcbiAgICAgIGNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgLi4ucHJvZHVjdGlvbkludGVncmF0ZWRUZXN0Q29uZmlnLnRlc3RTdWl0ZXNbMV0uY29uZmlndXJhdGlvbixcbiAgICAgICAgdGVzdERhdGFTZXRzOiBbJ21pbmltYWwnLCAnc3RhbmRhcmQnLCAnZWRnZS1jYXNlcycsICdzdHJlc3MtZGF0YSddXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAuLi5wcm9kdWN0aW9uSW50ZWdyYXRlZFRlc3RDb25maWcudGVzdFN1aXRlc1syXSwgLy8gcGVyZm9ybWFuY2VcbiAgICAgIGNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgLi4ucHJvZHVjdGlvbkludGVncmF0ZWRUZXN0Q29uZmlnLnRlc3RTdWl0ZXNbMl0uY29uZmlndXJhdGlvbixcbiAgICAgICAgZW5hYmxlU3RyZXNzVGVzdHM6IHRydWUsIC8vIOOCueODhuODvOOCuOODs+OCsOeSsOWig+OBp+OBr+OCueODiOODrOOCueODhuOCueODiOOCguWun+ihjFxuICAgICAgICBtYXhDb25jdXJyZW50VXNlcnM6IDUwMCxcbiAgICAgICAgdGVzdER1cmF0aW9uOiA2MDAgLy8gMTDliIbplpNcbiAgICAgIH1cbiAgICB9XG4gIF0sXG5cbiAgLy8g44KI44KK57ep44GE44Oq44K944O844K55Yi26ZmQXG4gIHJlc291cmNlTGltaXRzOiB7XG4gICAgbWF4Q3B1VXNhZ2U6IDg1LFxuICAgIG1heE1lbW9yeVVzYWdlOiA5MCxcbiAgICBtYXhOZXR3b3JrQmFuZHdpZHRoOiAyMDAsXG4gICAgbWF4U3RvcmFnZVVzYWdlOiAyMCxcbiAgICBtYXhDb3N0VGhyZXNob2xkOiAxMDAuMFxuICB9XG59O1xuXG4vKipcbiAqIOmWi+eZuueSsOWig+e1seWQiOODhuOCueODiOioreWumlxuICovXG5leHBvcnQgY29uc3QgZGV2ZWxvcG1lbnRJbnRlZ3JhdGVkVGVzdENvbmZpZzogSW50ZWdyYXRlZFRlc3RDb25maWcgPSB7XG4gIC4uLnByb2R1Y3Rpb25JbnRlZ3JhdGVkVGVzdENvbmZpZyxcbiAgZW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcsXG4gIFxuICAvLyDplovnmbrnkrDlooPjgafjga/pq5jpgJ/lrp/ooYzjgpLlhKrlhYhcbiAgcGFyYWxsZWxFeGVjdXRpb246IHRydWUsXG4gIG1heENvbmN1cnJlbnRUZXN0czogMyxcbiAgdGltZW91dE1zOiAxODAwMDAwLCAvLyAzMOWIhlxuICBcbiAgLy8g6Lu96YeP44Gq44OG44K544OI6Kit5a6aXG4gIHRlc3RTdWl0ZXM6IFtcbiAgICB7XG4gICAgICAuLi5wcm9kdWN0aW9uSW50ZWdyYXRlZFRlc3RDb25maWcudGVzdFN1aXRlc1swXSwgLy8gc2VjdXJpdHlcbiAgICAgIGNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgZW5hYmxlRW5jcnlwdGlvblRlc3RzOiB0cnVlLFxuICAgICAgICBlbmFibGVBdXRoZW50aWNhdGlvblRlc3RzOiB0cnVlLFxuICAgICAgICBlbmFibGVWdWxuZXJhYmlsaXR5U2Nhbm5pbmc6IGZhbHNlLCAvLyDplovnmbrnkrDlooPjgafjga/nhKHlirlcbiAgICAgICAgY29tcGxpYW5jZVN0YW5kYXJkczogWydiYXNpYyddXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAuLi5wcm9kdWN0aW9uSW50ZWdyYXRlZFRlc3RDb25maWcudGVzdFN1aXRlc1sxXSwgLy8gZnVuY3Rpb25hbFxuICAgICAgY29uZmlndXJhdGlvbjoge1xuICAgICAgICBlbmFibGVVSVRlc3RzOiB0cnVlLFxuICAgICAgICBlbmFibGVBUElUZXN0czogdHJ1ZSxcbiAgICAgICAgZW5hYmxlSW50ZWdyYXRpb25UZXN0czogZmFsc2UsIC8vIOmWi+eZuueSsOWig+OBp+OBr+eEoeWKuVxuICAgICAgICB0ZXN0RGF0YVNldHM6IFsnbWluaW1hbCddXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAuLi5wcm9kdWN0aW9uSW50ZWdyYXRlZFRlc3RDb25maWcudGVzdFN1aXRlc1syXSwgLy8gcGVyZm9ybWFuY2VcbiAgICAgIGVuYWJsZWQ6IGZhbHNlIC8vIOmWi+eZuueSsOWig+OBp+OBr+ODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOOCkueEoeWKuVxuICAgIH1cbiAgXSxcblxuICAvLyDnsKHmmJPjg6zjg53jg7zjg4joqK3lrppcbiAgcmVwb3J0aW5nQ29uZmlnOiB7XG4gICAgZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydDogZmFsc2UsXG4gICAgZXhwb3J0Rm9ybWF0czogWydqc29uJ10sXG4gICAgb3V0cHV0RGlyZWN0b3J5OiAnLi9kZXYtdGVzdC1yZXBvcnRzJyxcbiAgICBpbmNsdWRlTWV0cmljczogZmFsc2UsXG4gICAgaW5jbHVkZVNjcmVlbnNob3RzOiBmYWxzZSxcbiAgICBpbmNsdWRlTG9nczogdHJ1ZVxuICB9LFxuXG4gIC8vIOe3qeOBhOODquOCveODvOOCueWItumZkFxuICByZXNvdXJjZUxpbWl0czoge1xuICAgIG1heENwdVVzYWdlOiA5NSxcbiAgICBtYXhNZW1vcnlVc2FnZTogOTUsXG4gICAgbWF4TmV0d29ya0JhbmR3aWR0aDogMTAwMCxcbiAgICBtYXhTdG9yYWdlVXNhZ2U6IDUwLFxuICAgIG1heENvc3RUaHJlc2hvbGQ6IDIwMC4wXG4gIH1cbn07XG5cbi8qKlxuICogQ0kvQ0TnkrDlooPntbHlkIjjg4bjgrnjg4joqK3lrppcbiAqL1xuZXhwb3J0IGNvbnN0IGNpY2RJbnRlZ3JhdGVkVGVzdENvbmZpZzogSW50ZWdyYXRlZFRlc3RDb25maWcgPSB7XG4gIC4uLnByb2R1Y3Rpb25JbnRlZ3JhdGVkVGVzdENvbmZpZyxcbiAgZW52aXJvbm1lbnQ6ICdjaWNkJyxcbiAgXG4gIC8vIENJL0NE55Kw5aKD44Gn44Gv6auY6YCf5a6f6KGM44Go56K65a6f5oCn44KS6YeN6KaWXG4gIHBhcmFsbGVsRXhlY3V0aW9uOiB0cnVlLFxuICBtYXhDb25jdXJyZW50VGVzdHM6IDIsXG4gIHRpbWVvdXRNczogMjQwMDAwMCwgLy8gNDDliIZcbiAgcmV0cnlBdHRlbXB0czogMSwgLy8g44Oq44OI44Op44Kk5Zue5pWw44KS5rib44KJ44GX44Gm6auY6YCf5YyWXG4gIFxuICAvLyBDSS9DROWQkeOBkeODhuOCueODiOioreWumlxuICB0ZXN0U3VpdGVzOiBbXG4gICAge1xuICAgICAgLi4ucHJvZHVjdGlvbkludGVncmF0ZWRUZXN0Q29uZmlnLnRlc3RTdWl0ZXNbMF0sIC8vIHNlY3VyaXR5XG4gICAgICBjb25maWd1cmF0aW9uOiB7XG4gICAgICAgIGVuYWJsZUVuY3J5cHRpb25UZXN0czogdHJ1ZSxcbiAgICAgICAgZW5hYmxlQXV0aGVudGljYXRpb25UZXN0czogdHJ1ZSxcbiAgICAgICAgZW5hYmxlVnVsbmVyYWJpbGl0eVNjYW5uaW5nOiB0cnVlLFxuICAgICAgICBjb21wbGlhbmNlU3RhbmRhcmRzOiBbJ0dEUFInLCAnU09DMiddIC8vIOW/heimgeacgOWwj+mZkFxuICAgICAgfSxcbiAgICAgIGNyaXRpY2FsVGVzdDogdHJ1ZSxcbiAgICAgIHNraXBPbkZhaWx1cmU6IHRydWUgLy8gQ0kvQ0Tjgafjga/lpLHmlZfmmYLjgavlvozntprjgpLjgrnjgq3jg4Pjg5dcbiAgICB9LFxuICAgIHtcbiAgICAgIC4uLnByb2R1Y3Rpb25JbnRlZ3JhdGVkVGVzdENvbmZpZy50ZXN0U3VpdGVzWzFdLCAvLyBmdW5jdGlvbmFsXG4gICAgICBjb25maWd1cmF0aW9uOiB7XG4gICAgICAgIGVuYWJsZVVJVGVzdHM6IGZhbHNlLCAvLyBDSS9DROOBp+OBr1VJ44OG44K544OI44KS54Sh5Yq5XG4gICAgICAgIGVuYWJsZUFQSVRlc3RzOiB0cnVlLFxuICAgICAgICBlbmFibGVJbnRlZ3JhdGlvblRlc3RzOiB0cnVlLFxuICAgICAgICB0ZXN0RGF0YVNldHM6IFsnbWluaW1hbCcsICdzdGFuZGFyZCddXG4gICAgICB9LFxuICAgICAgY3JpdGljYWxUZXN0OiB0cnVlLFxuICAgICAgc2tpcE9uRmFpbHVyZTogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgLi4ucHJvZHVjdGlvbkludGVncmF0ZWRUZXN0Q29uZmlnLnRlc3RTdWl0ZXNbMl0sIC8vIHBlcmZvcm1hbmNlXG4gICAgICBjb25maWd1cmF0aW9uOiB7XG4gICAgICAgIGVuYWJsZUxvYWRUZXN0czogdHJ1ZSxcbiAgICAgICAgZW5hYmxlU3RyZXNzVGVzdHM6IGZhbHNlLFxuICAgICAgICBlbmFibGVTY2FsYWJpbGl0eVRlc3RzOiBmYWxzZSwgLy8gQ0kvQ0Tjgafjga/nhKHlirlcbiAgICAgICAgbWF4Q29uY3VycmVudFVzZXJzOiA1MCxcbiAgICAgICAgdGVzdER1cmF0aW9uOiAxODAgLy8gM+WIhumWk1xuICAgICAgfSxcbiAgICAgIGNyaXRpY2FsVGVzdDogZmFsc2VcbiAgICB9XG4gIF0sXG5cbiAgLy8gQ0kvQ0TlkJHjgZHjg6zjg53jg7zjg4joqK3lrppcbiAgcmVwb3J0aW5nQ29uZmlnOiB7XG4gICAgZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydDogdHJ1ZSxcbiAgICBleHBvcnRGb3JtYXRzOiBbJ2pzb24nLCAnaHRtbCddLCAvLyBQREbjga/pmaTlpJZcbiAgICBvdXRwdXREaXJlY3Rvcnk6ICcuL2NpY2QtdGVzdC1yZXBvcnRzJyxcbiAgICBpbmNsdWRlTWV0cmljczogdHJ1ZSxcbiAgICBpbmNsdWRlU2NyZWVuc2hvdHM6IGZhbHNlLCAvLyBDSS9DROOBp+OBr+eEoeWKuVxuICAgIGluY2x1ZGVMb2dzOiB0cnVlXG4gIH1cbn07XG5cbi8qKlxuICog55Kw5aKD44Gr5b+c44GY44Gf6Kit5a6a44Gu5Y+W5b6XXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnRlZ3JhdGVkVGVzdENvbmZpZyhlbnZpcm9ubWVudDogc3RyaW5nKTogSW50ZWdyYXRlZFRlc3RDb25maWcge1xuICBzd2l0Y2ggKGVudmlyb25tZW50LnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdwcm9kdWN0aW9uJzpcbiAgICBjYXNlICdwcm9kJzpcbiAgICAgIHJldHVybiBwcm9kdWN0aW9uSW50ZWdyYXRlZFRlc3RDb25maWc7XG4gICAgXG4gICAgY2FzZSAnc3RhZ2luZyc6XG4gICAgY2FzZSAnc3RhZ2UnOlxuICAgICAgcmV0dXJuIHN0YWdpbmdJbnRlZ3JhdGVkVGVzdENvbmZpZztcbiAgICBcbiAgICBjYXNlICdkZXZlbG9wbWVudCc6XG4gICAgY2FzZSAnZGV2JzpcbiAgICAgIHJldHVybiBkZXZlbG9wbWVudEludGVncmF0ZWRUZXN0Q29uZmlnO1xuICAgIFxuICAgIGNhc2UgJ2NpY2QnOlxuICAgIGNhc2UgJ2NpJzpcbiAgICBjYXNlICdjZCc6XG4gICAgICByZXR1cm4gY2ljZEludGVncmF0ZWRUZXN0Q29uZmlnO1xuICAgIFxuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zb2xlLndhcm4oYOacquefpeOBrueSsOWigzogJHtlbnZpcm9ubWVudH0uIOmWi+eZuueSsOWig+ioreWumuOCkuS9v+eUqOOBl+OBvuOBmeOAgmApO1xuICAgICAgcmV0dXJuIGRldmVsb3BtZW50SW50ZWdyYXRlZFRlc3RDb25maWc7XG4gIH1cbn1cblxuLyoqXG4gKiDntbHlkIjjg4bjgrnjg4joqK3lrprjga7mpJzoqLxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSW50ZWdyYXRlZFRlc3RDb25maWcoY29uZmlnOiBJbnRlZ3JhdGVkVGVzdENvbmZpZyk6IHtcbiAgaXNWYWxpZDogYm9vbGVhbjtcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgLy8g5Z+65pys6Kit5a6a44Gu5qSc6Ki8XG4gIGlmICghY29uZmlnLmVudmlyb25tZW50KSB7XG4gICAgZXJyb3JzLnB1c2goJ+eSsOWig+OBjOaMh+WumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICB9XG5cbiAgaWYgKGNvbmZpZy50ZXN0U3VpdGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIGVycm9ycy5wdXNoKCfjg4bjgrnjg4jjgrnjgqTjg7zjg4jjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIC8vIOODhuOCueODiOOCueOCpOODvOODiOOBruaknOiovFxuICBjb25zdCBlbmFibGVkU3VpdGVzID0gY29uZmlnLnRlc3RTdWl0ZXMuZmlsdGVyKHN1aXRlID0+IHN1aXRlLmVuYWJsZWQpO1xuICBpZiAoZW5hYmxlZFN1aXRlcy5sZW5ndGggPT09IDApIHtcbiAgICB3YXJuaW5ncy5wdXNoKCfmnInlirnjgarjg4bjgrnjg4jjgrnjgqTjg7zjg4jjgYzjgYLjgorjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIC8vIOS+neWtmOmWouS/guOBruaknOiovFxuICBjb25zdCBzdWl0ZU5hbWVzID0gY29uZmlnLnRlc3RTdWl0ZXMubWFwKHN1aXRlID0+IHN1aXRlLm5hbWUpO1xuICBjb25maWcudGVzdFN1aXRlcy5mb3JFYWNoKHN1aXRlID0+IHtcbiAgICBzdWl0ZS5kZXBlbmRlbmNpZXMuZm9yRWFjaChkZXAgPT4ge1xuICAgICAgaWYgKCFzdWl0ZU5hbWVzLmluY2x1ZGVzKGRlcCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYOODhuOCueODiOOCueOCpOODvOODiCAnJHtzdWl0ZS5uYW1lfScg44Gu5L6d5a2Y6Zai5L+CICcke2RlcH0nIOOBjOimi+OBpOOBi+OCiuOBvuOBm+OCk2ApO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICAvLyDlrp/ooYzpoIbluo/jga7mpJzoqLxcbiAgaWYgKGNvbmZpZy5leGVjdXRpb25PcmRlci5sZW5ndGggPiAwKSB7XG4gICAgY29uZmlnLmV4ZWN1dGlvbk9yZGVyLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICBpZiAoIXN1aXRlTmFtZXMuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgICAgd2FybmluZ3MucHVzaChg5a6f6KGM6aCG5bqP44Gr5oyH5a6a44GV44KM44GfICcke25hbWV9JyDjgYzjg4bjgrnjg4jjgrnjgqTjg7zjg4jjgavlrZjlnKjjgZfjgb7jgZvjgpNgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIOODquOCveODvOOCueWItumZkOOBruaknOiovFxuICBpZiAoY29uZmlnLnJlc291cmNlTGltaXRzLm1heENwdVVzYWdlID4gMTAwKSB7XG4gICAgd2FybmluZ3MucHVzaCgnQ1BV5L2/55So546H44Gu5LiK6ZmQ44GMMTAwJeOCkui2heOBiOOBpuOBhOOBvuOBmScpO1xuICB9XG5cbiAgaWYgKGNvbmZpZy5yZXNvdXJjZUxpbWl0cy5tYXhNZW1vcnlVc2FnZSA+IDEwMCkge1xuICAgIHdhcm5pbmdzLnB1c2goJ+ODoeODouODquS9v+eUqOeOh+OBruS4iumZkOOBjDEwMCXjgpLotoXjgYjjgabjgYTjgb7jgZknKTtcbiAgfVxuXG4gIC8vIOOCv+OCpOODoOOCouOCpuODiOOBruaknOiovFxuICBpZiAoY29uZmlnLnRpbWVvdXRNcyA8IDYwMDAwKSB7IC8vIDHliIbmnKrmuoBcbiAgICB3YXJuaW5ncy5wdXNoKCfjgr/jgqTjg6DjgqLjgqbjg4jjgYznn63jgZnjgY7jgovlj6/og73mgKfjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIGlmIChjb25maWcudGltZW91dE1zID4gNzIwMDAwMCkgeyAvLyAy5pmC6ZaT6LaFXG4gICAgd2FybmluZ3MucHVzaCgn44K/44Kk44Og44Ki44Km44OI44GM6ZW344GZ44GO44KL5Y+v6IO95oCn44GM44GC44KK44G+44GZJyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGlzVmFsaWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgZXJyb3JzLFxuICAgIHdhcm5pbmdzXG4gIH07XG59XG5cbi8qKlxuICog44OG44K544OI44K544Kk44O844OI6Kit5a6a44Gu44Oe44O844K4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVRlc3RTdWl0ZUNvbmZpZ3MoXG4gIGJhc2VDb25maWc6IFRlc3RTdWl0ZUNvbmZpZyxcbiAgb3ZlcnJpZGVDb25maWc6IFBhcnRpYWw8VGVzdFN1aXRlQ29uZmlnPlxuKTogVGVzdFN1aXRlQ29uZmlnIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5iYXNlQ29uZmlnLFxuICAgIC4uLm92ZXJyaWRlQ29uZmlnLFxuICAgIGNvbmZpZ3VyYXRpb246IHtcbiAgICAgIC4uLmJhc2VDb25maWcuY29uZmlndXJhdGlvbixcbiAgICAgIC4uLm92ZXJyaWRlQ29uZmlnLmNvbmZpZ3VyYXRpb25cbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgcHJvZHVjdGlvbkludGVncmF0ZWRUZXN0Q29uZmlnLFxuICBzdGFnaW5nSW50ZWdyYXRlZFRlc3RDb25maWcsXG4gIGRldmVsb3BtZW50SW50ZWdyYXRlZFRlc3RDb25maWcsXG4gIGNpY2RJbnRlZ3JhdGVkVGVzdENvbmZpZyxcbiAgZ2V0SW50ZWdyYXRlZFRlc3RDb25maWcsXG4gIHZhbGlkYXRlSW50ZWdyYXRlZFRlc3RDb25maWcsXG4gIG1lcmdlVGVzdFN1aXRlQ29uZmlnc1xufTsiXX0=