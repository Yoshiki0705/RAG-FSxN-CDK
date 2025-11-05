/**
 * パフォーマンステスト設定
 * 
 * 実本番環境でのパフォーマンステストに関する設定を管理
 * 負荷テスト、スケーラビリティテスト、リソース監視の設定を含む
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

/**
 * パフォーマンステスト設定インターフェース
 */
export interface PerformanceTestConfig {
  // 基本設定
  testEnvironment: 'production' | 'staging' | 'development';
  region: string;
  awsProfile: string;
  
  // パフォーマンス閾値
  thresholds: {
    maxResponseTime: number;        // 最大応答時間 (ms)
    minThroughput: number;          // 最小スループット (req/sec)
    maxErrorRate: number;           // 最大エラー率 (0-1)
    maxCpuUtilization: number;      // 最大CPU使用率 (0-1)
    maxMemoryUtilization: number;   // 最大メモリ使用率 (0-1)
    maxNetworkLatency: number;      // 最大ネットワーク遅延 (ms)
  };
  
  // 負荷テスト設定
  loadTest: {
    basicTest: {
      requestCount: number;
      requestInterval: number;      // ms
      timeout: number;              // ms
    };
    concurrentTest: {
      maxConcurrentUsers: number;
      testDuration: number;         // seconds
      rampUpTime: number;           // seconds
      requestInterval: number;      // ms
      maxRequestsPerUser: number;
    };
    scalabilityTest: {
      userLevels: number[];         // 同時ユーザー数のレベル
      testDurationPerLevel: number; // seconds
      levelInterval: number;        // seconds (レベル間の待機時間)
    };
  };
  
  // リソース監視設定
  monitoring: {
    sampleInterval: number;         // ms
    monitoringDuration: number;     // seconds
    metricsToCollect: string[];
    cloudWatchNamespace: string;
  };
  
  // テスト対象リソース
  resources: {
    bedrockModel: string;
    openSearchIndex: string;
    dynamoDBTables: {
      sessions: string;
      documents: string;
      users: string;
    };
    fsxFileSystem: string;
    lambdaFunctions: string[];
  };
  
  // コスト管理
  costLimits: {
    maxTestCost: number;            // USD
    bedrockTokenLimit: number;
    openSearchQueryLimit: number;
    dynamoDBReadLimit: number;
  };
  
  // 安全設定
  safety: {
    enableEmergencyStop: boolean;
    maxTestDuration: number;        // seconds
    resourceUsageThreshold: number; // 0-1
    autoStopOnHighCost: boolean;
  };
}

/**
 * 本番環境用パフォーマンステスト設定
 */
export const productionPerformanceConfig: PerformanceTestConfig = {
  testEnvironment: 'production',
  region: 'ap-northeast-1',
  awsProfile: 'user01',
  
  thresholds: {
    maxResponseTime: 5000,          // 5秒
    minThroughput: 10,              // 10 req/sec
    maxErrorRate: 0.05,             // 5%
    maxCpuUtilization: 0.8,         // 80%
    maxMemoryUtilization: 0.8,      // 80%
    maxNetworkLatency: 100          // 100ms
  },
  
  loadTest: {
    basicTest: {
      requestCount: 10,
      requestInterval: 1000,         // 1秒間隔
      timeout: 30000                 // 30秒タイムアウト
    },
    concurrentTest: {
      maxConcurrentUsers: 5,
      testDuration: 30,              // 30秒
      rampUpTime: 10,                // 10秒でランプアップ
      requestInterval: 2000,         // 2秒間隔
      maxRequestsPerUser: 50
    },
    scalabilityTest: {
      userLevels: [1, 2, 5, 10],     // 段階的にユーザー数を増加
      testDurationPerLevel: 20,      // 各レベル20秒
      levelInterval: 5               // レベル間5秒待機
    }
  },
  
  monitoring: {
    sampleInterval: 5000,            // 5秒間隔
    monitoringDuration: 60,          // 60秒間監視
    metricsToCollect: [
      'CPUUtilization',
      'MemoryUtilization',
      'NetworkLatency',
      'DiskIOPS',
      'NetworkThroughput'
    ],
    cloudWatchNamespace: 'RAG/Performance'
  },
  
  resources: {
    bedrockModel: 'anthropic.claude-3-haiku-20240307-v1:0',
    openSearchIndex: 'rag-documents',
    dynamoDBTables: {
      sessions: 'rag-sessions',
      documents: 'rag-documents',
      users: 'rag-users'
    },
    fsxFileSystem: 'fs-rag-storage',
    lambdaFunctions: [
      'rag-chat-handler',
      'rag-document-processor',
      'rag-search-handler'
    ]
  },
  
  costLimits: {
    maxTestCost: 5.0,               // $5 USD
    bedrockTokenLimit: 100000,      // 100K tokens
    openSearchQueryLimit: 1000,     // 1000 queries
    dynamoDBReadLimit: 10000        // 10K reads
  },
  
  safety: {
    enableEmergencyStop: true,
    maxTestDuration: 1800,          // 30分
    resourceUsageThreshold: 0.9,    // 90%
    autoStopOnHighCost: true
  }
};

/**
 * ステージング環境用パフォーマンステスト設定
 */
export const stagingPerformanceConfig: PerformanceTestConfig = {
  ...productionPerformanceConfig,
  testEnvironment: 'staging',
  
  // より積極的なテスト設定
  loadTest: {
    basicTest: {
      requestCount: 20,
      requestInterval: 500,          // 0.5秒間隔
      timeout: 60000                 // 60秒タイムアウト
    },
    concurrentTest: {
      maxConcurrentUsers: 10,
      testDuration: 60,              // 60秒
      rampUpTime: 15,                // 15秒でランプアップ
      requestInterval: 1000,         // 1秒間隔
      maxRequestsPerUser: 100
    },
    scalabilityTest: {
      userLevels: [1, 3, 5, 10, 15, 20], // より多くのレベル
      testDurationPerLevel: 30,      // 各レベル30秒
      levelInterval: 10              // レベル間10秒待機
    }
  },
  
  costLimits: {
    maxTestCost: 10.0,              // $10 USD
    bedrockTokenLimit: 200000,      // 200K tokens
    openSearchQueryLimit: 2000,     // 2000 queries
    dynamoDBReadLimit: 20000        // 20K reads
  }
};

/**
 * 開発環境用パフォーマンステスト設定
 */
export const developmentPerformanceConfig: PerformanceTestConfig = {
  ...productionPerformanceConfig,
  testEnvironment: 'development',
  
  // 軽量なテスト設定
  thresholds: {
    maxResponseTime: 10000,         // 10秒（開発環境は緩い設定）
    minThroughput: 5,               // 5 req/sec
    maxErrorRate: 0.1,              // 10%
    maxCpuUtilization: 0.9,         // 90%
    maxMemoryUtilization: 0.9,      // 90%
    maxNetworkLatency: 200          // 200ms
  },
  
  loadTest: {
    basicTest: {
      requestCount: 5,
      requestInterval: 2000,         // 2秒間隔
      timeout: 15000                 // 15秒タイムアウト
    },
    concurrentTest: {
      maxConcurrentUsers: 3,
      testDuration: 15,              // 15秒
      rampUpTime: 5,                 // 5秒でランプアップ
      requestInterval: 3000,         // 3秒間隔
      maxRequestsPerUser: 10
    },
    scalabilityTest: {
      userLevels: [1, 2, 3],         // 最小限のレベル
      testDurationPerLevel: 10,      // 各レベル10秒
      levelInterval: 3               // レベル間3秒待機
    }
  },
  
  costLimits: {
    maxTestCost: 1.0,               // $1 USD
    bedrockTokenLimit: 10000,       // 10K tokens
    openSearchQueryLimit: 100,      // 100 queries
    dynamoDBReadLimit: 1000         // 1K reads
  },
  
  safety: {
    enableEmergencyStop: true,
    maxTestDuration: 300,           // 5分
    resourceUsageThreshold: 0.8,    // 80%
    autoStopOnHighCost: true
  }
};

/**
 * 環境に応じた設定の取得
 */
export function getPerformanceConfig(environment: string): PerformanceTestConfig {
  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
      return productionPerformanceConfig;
    case 'staging':
    case 'stage':
      return stagingPerformanceConfig;
    case 'development':
    case 'dev':
      return developmentPerformanceConfig;
    default:
      console.warn(`未知の環境: ${environment}. 開発環境設定を使用します。`);
      return developmentPerformanceConfig;
  }
}

/**
 * パフォーマンステスト設定の検証
 */
export function validatePerformanceConfig(config: PerformanceTestConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須フィールドの検証
  if (!config.region) {
    errors.push('リージョンが設定されていません');
  }

  if (!config.awsProfile) {
    errors.push('AWSプロファイルが設定されていません');
  }

  // 閾値の妥当性検証
  if (config.thresholds.maxResponseTime <= 0) {
    errors.push('最大応答時間は正の値である必要があります');
  }

  if (config.thresholds.minThroughput <= 0) {
    errors.push('最小スループットは正の値である必要があります');
  }

  if (config.thresholds.maxErrorRate < 0 || config.thresholds.maxErrorRate > 1) {
    errors.push('最大エラー率は0-1の範囲である必要があります');
  }

  // 負荷テスト設定の検証
  if (config.loadTest.concurrentTest.maxConcurrentUsers <= 0) {
    errors.push('最大同時ユーザー数は正の値である必要があります');
  }

  if (config.loadTest.concurrentTest.testDuration <= 0) {
    errors.push('テスト時間は正の値である必要があります');
  }

  // コスト制限の検証
  if (config.costLimits.maxTestCost <= 0) {
    errors.push('最大テストコストは正の値である必要があります');
  }

  // 警告の生成
  if (config.testEnvironment === 'production') {
    if (config.loadTest.concurrentTest.maxConcurrentUsers > 10) {
      warnings.push('本番環境での同時ユーザー数が多すぎる可能性があります');
    }

    if (config.costLimits.maxTestCost > 10) {
      warnings.push('本番環境でのテストコスト上限が高すぎる可能性があります');
    }
  }

  if (config.safety.maxTestDuration > 3600) {
    warnings.push('テスト最大実行時間が1時間を超えています');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * パフォーマンステスト設定の表示
 */
export function displayPerformanceConfig(config: PerformanceTestConfig): void {
  console.log('📊 パフォーマンステスト設定:');
  console.log(`   環境: ${config.testEnvironment}`);
  console.log(`   リージョン: ${config.region}`);
  console.log(`   AWSプロファイル: ${config.awsProfile}`);
  console.log('');
  
  console.log('🎯 パフォーマンス閾値:');
  console.log(`   最大応答時間: ${config.thresholds.maxResponseTime}ms`);
  console.log(`   最小スループット: ${config.thresholds.minThroughput} req/sec`);
  console.log(`   最大エラー率: ${(config.thresholds.maxErrorRate * 100).toFixed(1)}%`);
  console.log(`   最大CPU使用率: ${(config.thresholds.maxCpuUtilization * 100).toFixed(1)}%`);
  console.log(`   最大メモリ使用率: ${(config.thresholds.maxMemoryUtilization * 100).toFixed(1)}%`);
  console.log('');
  
  console.log('🔄 負荷テスト設定:');
  console.log(`   基本テスト - リクエスト数: ${config.loadTest.basicTest.requestCount}`);
  console.log(`   同時接続テスト - 最大ユーザー数: ${config.loadTest.concurrentTest.maxConcurrentUsers}`);
  console.log(`   同時接続テスト - テスト時間: ${config.loadTest.concurrentTest.testDuration}秒`);
  console.log(`   スケーラビリティテスト - ユーザーレベル: [${config.loadTest.scalabilityTest.userLevels.join(', ')}]`);
  console.log('');
  
  console.log('💰 コスト制限:');
  console.log(`   最大テストコスト: $${config.costLimits.maxTestCost}`);
  console.log(`   Bedrockトークン制限: ${config.costLimits.bedrockTokenLimit.toLocaleString()}`);
  console.log(`   OpenSearchクエリ制限: ${config.costLimits.openSearchQueryLimit.toLocaleString()}`);
  console.log('');
  
  console.log('🛡️ 安全設定:');
  console.log(`   緊急停止: ${config.safety.enableEmergencyStop ? '有効' : '無効'}`);
  console.log(`   最大テスト時間: ${config.safety.maxTestDuration}秒`);
  console.log(`   リソース使用率閾値: ${(config.safety.resourceUsageThreshold * 100).toFixed(1)}%`);
  console.log(`   高コスト時自動停止: ${config.safety.autoStopOnHighCost ? '有効' : '無効'}`);
}

export default {
  productionPerformanceConfig,
  stagingPerformanceConfig,
  developmentPerformanceConfig,
  getPerformanceConfig,
  validatePerformanceConfig,
  displayPerformanceConfig
};