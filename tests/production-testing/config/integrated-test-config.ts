/**
 * 統合テスト設定
 * セキュリティ、パフォーマンス、機能テストの統合実行設定
 */

import { IntegratedTestConfig, TestSuiteConfig } from '../integrated-test-runner';

/**
 * 本番環境統合テスト設定
 */
export const productionIntegratedTestConfig: IntegratedTestConfig = {
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
    maxCpuUsage: 70,        // CPU使用率70%まで
    maxMemoryUsage: 80,     // メモリ使用率80%まで
    maxNetworkBandwidth: 100, // 100Mbpsまで
    maxStorageUsage: 10,    // 10GBまで
    maxCostThreshold: 50.0  // $50まで
  }
};

/**
 * ステージング環境統合テスト設定
 */
export const stagingIntegratedTestConfig: IntegratedTestConfig = {
  ...productionIntegratedTestConfig,
  environment: 'staging',
  
  // ステージング環境では並列実行可能
  parallelExecution: true,
  maxConcurrentTests: 2,
  
  // より積極的なテスト設定
  testSuites: [
    {
      ...productionIntegratedTestConfig.testSuites[0], // security
      configuration: {
        ...productionIntegratedTestConfig.testSuites[0].configuration,
        enablePenetrationTests: true // ステージング環境では侵入テストも実行
      }
    },
    {
      ...productionIntegratedTestConfig.testSuites[1], // functional
      configuration: {
        ...productionIntegratedTestConfig.testSuites[1].configuration,
        testDataSets: ['minimal', 'standard', 'edge-cases', 'stress-data']
      }
    },
    {
      ...productionIntegratedTestConfig.testSuites[2], // performance
      configuration: {
        ...productionIntegratedTestConfig.testSuites[2].configuration,
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
export const developmentIntegratedTestConfig: IntegratedTestConfig = {
  ...productionIntegratedTestConfig,
  environment: 'development',
  
  // 開発環境では高速実行を優先
  parallelExecution: true,
  maxConcurrentTests: 3,
  timeoutMs: 1800000, // 30分
  
  // 軽量なテスト設定
  testSuites: [
    {
      ...productionIntegratedTestConfig.testSuites[0], // security
      configuration: {
        enableEncryptionTests: true,
        enableAuthenticationTests: true,
        enableVulnerabilityScanning: false, // 開発環境では無効
        complianceStandards: ['basic']
      }
    },
    {
      ...productionIntegratedTestConfig.testSuites[1], // functional
      configuration: {
        enableUITests: true,
        enableAPITests: true,
        enableIntegrationTests: false, // 開発環境では無効
        testDataSets: ['minimal']
      }
    },
    {
      ...productionIntegratedTestConfig.testSuites[2], // performance
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
export const cicdIntegratedTestConfig: IntegratedTestConfig = {
  ...productionIntegratedTestConfig,
  environment: 'cicd',
  
  // CI/CD環境では高速実行と確実性を重視
  parallelExecution: true,
  maxConcurrentTests: 2,
  timeoutMs: 2400000, // 40分
  retryAttempts: 1, // リトライ回数を減らして高速化
  
  // CI/CD向けテスト設定
  testSuites: [
    {
      ...productionIntegratedTestConfig.testSuites[0], // security
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
      ...productionIntegratedTestConfig.testSuites[1], // functional
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
      ...productionIntegratedTestConfig.testSuites[2], // performance
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
export function getIntegratedTestConfig(environment: string): IntegratedTestConfig {
  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
      return productionIntegratedTestConfig;
    
    case 'staging':
    case 'stage':
      return stagingIntegratedTestConfig;
    
    case 'development':
    case 'dev':
      return developmentIntegratedTestConfig;
    
    case 'cicd':
    case 'ci':
    case 'cd':
      return cicdIntegratedTestConfig;
    
    default:
      console.warn(`未知の環境: ${environment}. 開発環境設定を使用します。`);
      return developmentIntegratedTestConfig;
  }
}

/**
 * 統合テスト設定の検証
 */
export function validateIntegratedTestConfig(config: IntegratedTestConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

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
export function mergeTestSuiteConfigs(
  baseConfig: TestSuiteConfig,
  overrideConfig: Partial<TestSuiteConfig>
): TestSuiteConfig {
  return {
    ...baseConfig,
    ...overrideConfig,
    configuration: {
      ...baseConfig.configuration,
      ...overrideConfig.configuration
    }
  };
}

export default {
  productionIntegratedTestConfig,
  stagingIntegratedTestConfig,
  developmentIntegratedTestConfig,
  cicdIntegratedTestConfig,
  getIntegratedTestConfig,
  validateIntegratedTestConfig,
  mergeTestSuiteConfigs
};