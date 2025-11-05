"use strict";
/**
 * パフォーマンステスト設定
 *
 * 実本番環境でのパフォーマンステストに関する設定を管理
 * 負荷テスト、スケーラビリティテスト、リソース監視の設定を含む
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.developmentPerformanceConfig = exports.stagingPerformanceConfig = exports.productionPerformanceConfig = void 0;
exports.getPerformanceConfig = getPerformanceConfig;
exports.validatePerformanceConfig = validatePerformanceConfig;
exports.displayPerformanceConfig = displayPerformanceConfig;
/**
 * 本番環境用パフォーマンステスト設定
 */
exports.productionPerformanceConfig = {
    testEnvironment: 'production',
    region: 'ap-northeast-1',
    awsProfile: 'user01',
    thresholds: {
        maxResponseTime: 5000, // 5秒
        minThroughput: 10, // 10 req/sec
        maxErrorRate: 0.05, // 5%
        maxCpuUtilization: 0.8, // 80%
        maxMemoryUtilization: 0.8, // 80%
        maxNetworkLatency: 100 // 100ms
    },
    loadTest: {
        basicTest: {
            requestCount: 10,
            requestInterval: 1000, // 1秒間隔
            timeout: 30000 // 30秒タイムアウト
        },
        concurrentTest: {
            maxConcurrentUsers: 5,
            testDuration: 30, // 30秒
            rampUpTime: 10, // 10秒でランプアップ
            requestInterval: 2000, // 2秒間隔
            maxRequestsPerUser: 50
        },
        scalabilityTest: {
            userLevels: [1, 2, 5, 10], // 段階的にユーザー数を増加
            testDurationPerLevel: 20, // 各レベル20秒
            levelInterval: 5 // レベル間5秒待機
        }
    },
    monitoring: {
        sampleInterval: 5000, // 5秒間隔
        monitoringDuration: 60, // 60秒間監視
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
        maxTestCost: 5.0, // $5 USD
        bedrockTokenLimit: 100000, // 100K tokens
        openSearchQueryLimit: 1000, // 1000 queries
        dynamoDBReadLimit: 10000 // 10K reads
    },
    safety: {
        enableEmergencyStop: true,
        maxTestDuration: 1800, // 30分
        resourceUsageThreshold: 0.9, // 90%
        autoStopOnHighCost: true
    }
};
/**
 * ステージング環境用パフォーマンステスト設定
 */
exports.stagingPerformanceConfig = {
    ...exports.productionPerformanceConfig,
    testEnvironment: 'staging',
    // より積極的なテスト設定
    loadTest: {
        basicTest: {
            requestCount: 20,
            requestInterval: 500, // 0.5秒間隔
            timeout: 60000 // 60秒タイムアウト
        },
        concurrentTest: {
            maxConcurrentUsers: 10,
            testDuration: 60, // 60秒
            rampUpTime: 15, // 15秒でランプアップ
            requestInterval: 1000, // 1秒間隔
            maxRequestsPerUser: 100
        },
        scalabilityTest: {
            userLevels: [1, 3, 5, 10, 15, 20], // より多くのレベル
            testDurationPerLevel: 30, // 各レベル30秒
            levelInterval: 10 // レベル間10秒待機
        }
    },
    costLimits: {
        maxTestCost: 10.0, // $10 USD
        bedrockTokenLimit: 200000, // 200K tokens
        openSearchQueryLimit: 2000, // 2000 queries
        dynamoDBReadLimit: 20000 // 20K reads
    }
};
/**
 * 開発環境用パフォーマンステスト設定
 */
exports.developmentPerformanceConfig = {
    ...exports.productionPerformanceConfig,
    testEnvironment: 'development',
    // 軽量なテスト設定
    thresholds: {
        maxResponseTime: 10000, // 10秒（開発環境は緩い設定）
        minThroughput: 5, // 5 req/sec
        maxErrorRate: 0.1, // 10%
        maxCpuUtilization: 0.9, // 90%
        maxMemoryUtilization: 0.9, // 90%
        maxNetworkLatency: 200 // 200ms
    },
    loadTest: {
        basicTest: {
            requestCount: 5,
            requestInterval: 2000, // 2秒間隔
            timeout: 15000 // 15秒タイムアウト
        },
        concurrentTest: {
            maxConcurrentUsers: 3,
            testDuration: 15, // 15秒
            rampUpTime: 5, // 5秒でランプアップ
            requestInterval: 3000, // 3秒間隔
            maxRequestsPerUser: 10
        },
        scalabilityTest: {
            userLevels: [1, 2, 3], // 最小限のレベル
            testDurationPerLevel: 10, // 各レベル10秒
            levelInterval: 3 // レベル間3秒待機
        }
    },
    costLimits: {
        maxTestCost: 1.0, // $1 USD
        bedrockTokenLimit: 10000, // 10K tokens
        openSearchQueryLimit: 100, // 100 queries
        dynamoDBReadLimit: 1000 // 1K reads
    },
    safety: {
        enableEmergencyStop: true,
        maxTestDuration: 300, // 5分
        resourceUsageThreshold: 0.8, // 80%
        autoStopOnHighCost: true
    }
};
/**
 * 環境に応じた設定の取得
 */
function getPerformanceConfig(environment) {
    switch (environment.toLowerCase()) {
        case 'production':
        case 'prod':
            return exports.productionPerformanceConfig;
        case 'staging':
        case 'stage':
            return exports.stagingPerformanceConfig;
        case 'development':
        case 'dev':
            return exports.developmentPerformanceConfig;
        default:
            console.warn(`未知の環境: ${environment}. 開発環境設定を使用します。`);
            return exports.developmentPerformanceConfig;
    }
}
/**
 * パフォーマンステスト設定の検証
 */
function validatePerformanceConfig(config) {
    const errors = [];
    const warnings = [];
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
function displayPerformanceConfig(config) {
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
exports.default = {
    productionPerformanceConfig: exports.productionPerformanceConfig,
    stagingPerformanceConfig: exports.stagingPerformanceConfig,
    developmentPerformanceConfig: exports.developmentPerformanceConfig,
    getPerformanceConfig,
    validatePerformanceConfig,
    displayPerformanceConfig
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybWFuY2UtY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGVyZm9ybWFuY2UtY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBNFBILG9EQWVDO0FBS0QsOERBZ0VDO0FBS0QsNERBaUNDO0FBdFNEOztHQUVHO0FBQ1UsUUFBQSwyQkFBMkIsR0FBMEI7SUFDaEUsZUFBZSxFQUFFLFlBQVk7SUFDN0IsTUFBTSxFQUFFLGdCQUFnQjtJQUN4QixVQUFVLEVBQUUsUUFBUTtJQUVwQixVQUFVLEVBQUU7UUFDVixlQUFlLEVBQUUsSUFBSSxFQUFXLEtBQUs7UUFDckMsYUFBYSxFQUFFLEVBQUUsRUFBZSxhQUFhO1FBQzdDLFlBQVksRUFBRSxJQUFJLEVBQWMsS0FBSztRQUNyQyxpQkFBaUIsRUFBRSxHQUFHLEVBQVUsTUFBTTtRQUN0QyxvQkFBb0IsRUFBRSxHQUFHLEVBQU8sTUFBTTtRQUN0QyxpQkFBaUIsRUFBRSxHQUFHLENBQVUsUUFBUTtLQUN6QztJQUVELFFBQVEsRUFBRTtRQUNSLFNBQVMsRUFBRTtZQUNULFlBQVksRUFBRSxFQUFFO1lBQ2hCLGVBQWUsRUFBRSxJQUFJLEVBQVUsT0FBTztZQUN0QyxPQUFPLEVBQUUsS0FBSyxDQUFpQixZQUFZO1NBQzVDO1FBQ0QsY0FBYyxFQUFFO1lBQ2Qsa0JBQWtCLEVBQUUsQ0FBQztZQUNyQixZQUFZLEVBQUUsRUFBRSxFQUFlLE1BQU07WUFDckMsVUFBVSxFQUFFLEVBQUUsRUFBaUIsYUFBYTtZQUM1QyxlQUFlLEVBQUUsSUFBSSxFQUFVLE9BQU87WUFDdEMsa0JBQWtCLEVBQUUsRUFBRTtTQUN2QjtRQUNELGVBQWUsRUFBRTtZQUNmLFVBQVUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFNLGVBQWU7WUFDOUMsb0JBQW9CLEVBQUUsRUFBRSxFQUFPLFVBQVU7WUFDekMsYUFBYSxFQUFF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QUFDLE1BQU0sQ0FBQyxzQkFBc0IsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pGLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUNqRixDQUFDO0FBRUQsa0JBQWU7SUFDYiwyQkFBMkIsRUFBM0IsbUNBQTJCO0lBQzNCLHdCQUF3QixFQUF4QixnQ0FBd0I7SUFDeEIsNEJBQTRCLEVBQTVCLG9DQUE0QjtJQUM1QixvQkFBb0I7SUFDcEIseUJBQXlCO0lBQ3pCLHdCQUF3QjtDQUN6QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4joqK3lrppcbiAqIFxuICog5a6f5pys55Wq55Kw5aKD44Gn44Gu44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI44Gr6Zai44GZ44KL6Kit5a6a44KS566h55CGXG4gKiDosqDojbfjg4bjgrnjg4jjgIHjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPjg4bjgrnjg4jjgIHjg6rjgr3jg7zjgrnnm6Poppbjga7oqK3lrprjgpLlkKvjgoBcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbi8qKlxuICog44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI6Kit5a6a44Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGVyZm9ybWFuY2VUZXN0Q29uZmlnIHtcbiAgLy8g5Z+65pys6Kit5a6aXG4gIHRlc3RFbnZpcm9ubWVudDogJ3Byb2R1Y3Rpb24nIHwgJ3N0YWdpbmcnIHwgJ2RldmVsb3BtZW50JztcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGF3c1Byb2ZpbGU6IHN0cmluZztcbiAgXG4gIC8vIOODkeODleOCqeODvOODnuODs+OCuemWvuWApFxuICB0aHJlc2hvbGRzOiB7XG4gICAgbWF4UmVzcG9uc2VUaW1lOiBudW1iZXI7ICAgICAgICAvLyDmnIDlpKflv5znrZTmmYLplpMgKG1zKVxuICAgIG1pblRocm91Z2hwdXQ6IG51bWJlcjsgICAgICAgICAgLy8g5pyA5bCP44K544Or44O844OX44OD44OIIChyZXEvc2VjKVxuICAgIG1heEVycm9yUmF0ZTogbnVtYmVyOyAgICAgICAgICAgLy8g5pyA5aSn44Ko44Op44O8546HICgwLTEpXG4gICAgbWF4Q3B1VXRpbGl6YXRpb246IG51bWJlcjsgICAgICAvLyDmnIDlpKdDUFXkvb/nlKjnjocgKDAtMSlcbiAgICBtYXhNZW1vcnlVdGlsaXphdGlvbjogbnVtYmVyOyAgIC8vIOacgOWkp+ODoeODouODquS9v+eUqOeOhyAoMC0xKVxuICAgIG1heE5ldHdvcmtMYXRlbmN5OiBudW1iZXI7ICAgICAgLy8g5pyA5aSn44ON44OD44OI44Ov44O844Kv6YGF5bu2IChtcylcbiAgfTtcbiAgXG4gIC8vIOiyoOiNt+ODhuOCueODiOioreWumlxuICBsb2FkVGVzdDoge1xuICAgIGJhc2ljVGVzdDoge1xuICAgICAgcmVxdWVzdENvdW50OiBudW1iZXI7XG4gICAgICByZXF1ZXN0SW50ZXJ2YWw6IG51bWJlcjsgICAgICAvLyBtc1xuICAgICAgdGltZW91dDogbnVtYmVyOyAgICAgICAgICAgICAgLy8gbXNcbiAgICB9O1xuICAgIGNvbmN1cnJlbnRUZXN0OiB7XG4gICAgICBtYXhDb25jdXJyZW50VXNlcnM6IG51bWJlcjtcbiAgICAgIHRlc3REdXJhdGlvbjogbnVtYmVyOyAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgIHJhbXBVcFRpbWU6IG51bWJlcjsgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgIHJlcXVlc3RJbnRlcnZhbDogbnVtYmVyOyAgICAgIC8vIG1zXG4gICAgICBtYXhSZXF1ZXN0c1BlclVzZXI6IG51bWJlcjtcbiAgICB9O1xuICAgIHNjYWxhYmlsaXR5VGVzdDoge1xuICAgICAgdXNlckxldmVsczogbnVtYmVyW107ICAgICAgICAgLy8g5ZCM5pmC44Om44O844K244O85pWw44Gu44Os44OZ44OrXG4gICAgICB0ZXN0RHVyYXRpb25QZXJMZXZlbDogbnVtYmVyOyAvLyBzZWNvbmRzXG4gICAgICBsZXZlbEludGVydmFsOiBudW1iZXI7ICAgICAgICAvLyBzZWNvbmRzICjjg6zjg5njg6vplpPjga7lvoXmqZ/mmYLplpMpXG4gICAgfTtcbiAgfTtcbiAgXG4gIC8vIOODquOCveODvOOCueebo+imluioreWumlxuICBtb25pdG9yaW5nOiB7XG4gICAgc2FtcGxlSW50ZXJ2YWw6IG51bWJlcjsgICAgICAgICAvLyBtc1xuICAgIG1vbml0b3JpbmdEdXJhdGlvbjogbnVtYmVyOyAgICAgLy8gc2Vjb25kc1xuICAgIG1ldHJpY3NUb0NvbGxlY3Q6IHN0cmluZ1tdO1xuICAgIGNsb3VkV2F0Y2hOYW1lc3BhY2U6IHN0cmluZztcbiAgfTtcbiAgXG4gIC8vIOODhuOCueODiOWvvuixoeODquOCveODvOOCuVxuICByZXNvdXJjZXM6IHtcbiAgICBiZWRyb2NrTW9kZWw6IHN0cmluZztcbiAgICBvcGVuU2VhcmNoSW5kZXg6IHN0cmluZztcbiAgICBkeW5hbW9EQlRhYmxlczoge1xuICAgICAgc2Vzc2lvbnM6IHN0cmluZztcbiAgICAgIGRvY3VtZW50czogc3RyaW5nO1xuICAgICAgdXNlcnM6IHN0cmluZztcbiAgICB9O1xuICAgIGZzeEZpbGVTeXN0ZW06IHN0cmluZztcbiAgICBsYW1iZGFGdW5jdGlvbnM6IHN0cmluZ1tdO1xuICB9O1xuICBcbiAgLy8g44Kz44K544OI566h55CGXG4gIGNvc3RMaW1pdHM6IHtcbiAgICBtYXhUZXN0Q29zdDogbnVtYmVyOyAgICAgICAgICAgIC8vIFVTRFxuICAgIGJlZHJvY2tUb2tlbkxpbWl0OiBudW1iZXI7XG4gICAgb3BlblNlYXJjaFF1ZXJ5TGltaXQ6IG51bWJlcjtcbiAgICBkeW5hbW9EQlJlYWRMaW1pdDogbnVtYmVyO1xuICB9O1xuICBcbiAgLy8g5a6J5YWo6Kit5a6aXG4gIHNhZmV0eToge1xuICAgIGVuYWJsZUVtZXJnZW5jeVN0b3A6IGJvb2xlYW47XG4gICAgbWF4VGVzdER1cmF0aW9uOiBudW1iZXI7ICAgICAgICAvLyBzZWNvbmRzXG4gICAgcmVzb3VyY2VVc2FnZVRocmVzaG9sZDogbnVtYmVyOyAvLyAwLTFcbiAgICBhdXRvU3RvcE9uSGlnaENvc3Q6IGJvb2xlYW47XG4gIH07XG59XG5cbi8qKlxuICog5pys55Wq55Kw5aKD55So44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI6Kit5a6aXG4gKi9cbmV4cG9ydCBjb25zdCBwcm9kdWN0aW9uUGVyZm9ybWFuY2VDb25maWc6IFBlcmZvcm1hbmNlVGVzdENvbmZpZyA9IHtcbiAgdGVzdEVudmlyb25tZW50OiAncHJvZHVjdGlvbicsXG4gIHJlZ2lvbjogJ2FwLW5vcnRoZWFzdC0xJyxcbiAgYXdzUHJvZmlsZTogJ3VzZXIwMScsXG4gIFxuICB0aHJlc2hvbGRzOiB7XG4gICAgbWF4UmVzcG9uc2VUaW1lOiA1MDAwLCAgICAgICAgICAvLyA156eSXG4gICAgbWluVGhyb3VnaHB1dDogMTAsICAgICAgICAgICAgICAvLyAxMCByZXEvc2VjXG4gICAgbWF4RXJyb3JSYXRlOiAwLjA1LCAgICAgICAgICAgICAvLyA1JVxuICAgIG1heENwdVV0aWxpemF0aW9uOiAwLjgsICAgICAgICAgLy8gODAlXG4gICAgbWF4TWVtb3J5VXRpbGl6YXRpb246IDAuOCwgICAgICAvLyA4MCVcbiAgICBtYXhOZXR3b3JrTGF0ZW5jeTogMTAwICAgICAgICAgIC8vIDEwMG1zXG4gIH0sXG4gIFxuICBsb2FkVGVzdDoge1xuICAgIGJhc2ljVGVzdDoge1xuICAgICAgcmVxdWVzdENvdW50OiAxMCxcbiAgICAgIHJlcXVlc3RJbnRlcnZhbDogMTAwMCwgICAgICAgICAvLyAx56eS6ZaT6ZqUXG4gICAgICB0aW1lb3V0OiAzMDAwMCAgICAgICAgICAgICAgICAgLy8gMzDnp5Ljgr/jgqTjg6DjgqLjgqbjg4hcbiAgICB9LFxuICAgIGNvbmN1cnJlbnRUZXN0OiB7XG4gICAgICBtYXhDb25jdXJyZW50VXNlcnM6IDUsXG4gICAgICB0ZXN0RHVyYXRpb246IDMwLCAgICAgICAgICAgICAgLy8gMzDnp5JcbiAgICAgIHJhbXBVcFRpbWU6IDEwLCAgICAgICAgICAgICAgICAvLyAxMOenkuOBp+ODqeODs+ODl+OCouODg+ODl1xuICAgICAgcmVxdWVzdEludGVydmFsOiAyMDAwLCAgICAgICAgIC8vIDLnp5LplpPpmpRcbiAgICAgIG1heFJlcXVlc3RzUGVyVXNlcjogNTBcbiAgICB9LFxuICAgIHNjYWxhYmlsaXR5VGVzdDoge1xuICAgICAgdXNlckxldmVsczogWzEsIDIsIDUsIDEwXSwgICAgIC8vIOautemajueahOOBq+ODpuODvOOCtuODvOaVsOOCkuWil+WKoFxuICAgICAgdGVzdER1cmF0aW9uUGVyTGV2ZWw6IDIwLCAgICAgIC8vIOWQhOODrOODmeODqzIw56eSXG4gICAgICBsZXZlbEludGVydmFsOiA1ICAgICAgICAgICAgICAgLy8g44Os44OZ44Or6ZaTNeenkuW+heapn1xuICAgIH1cbiAgfSxcbiAgXG4gIG1vbml0b3Jpbmc6IHtcbiAgICBzYW1wbGVJbnRlcnZhbDogNTAwMCwgICAgICAgICAgICAvLyA156eS6ZaT6ZqUXG4gICAgbW9uaXRvcmluZ0R1cmF0aW9uOiA2MCwgICAgICAgICAgLy8gNjDnp5LplpPnm6PoppZcbiAgICBtZXRyaWNzVG9Db2xsZWN0OiBbXG4gICAgICAnQ1BVVXRpbGl6YXRpb24nLFxuICAgICAgJ01lbW9yeVV0aWxpemF0aW9uJyxcbiAgICAgICdOZXR3b3JrTGF0ZW5jeScsXG4gICAgICAnRGlza0lPUFMnLFxuICAgICAgJ05ldHdvcmtUaHJvdWdocHV0J1xuICAgIF0sXG4gICAgY2xvdWRXYXRjaE5hbWVzcGFjZTogJ1JBRy9QZXJmb3JtYW5jZSdcbiAgfSxcbiAgXG4gIHJlc291cmNlczoge1xuICAgIGJlZHJvY2tNb2RlbDogJ2FudGhyb3BpYy5jbGF1ZGUtMy1oYWlrdS0yMDI0MDMwNy12MTowJyxcbiAgICBvcGVuU2VhcmNoSW5kZXg6ICdyYWctZG9jdW1lbnRzJyxcbiAgICBkeW5hbW9EQlRhYmxlczoge1xuICAgICAgc2Vzc2lvbnM6ICdyYWctc2Vzc2lvbnMnLFxuICAgICAgZG9jdW1lbnRzOiAncmFnLWRvY3VtZW50cycsXG4gICAgICB1c2VyczogJ3JhZy11c2VycydcbiAgICB9LFxuICAgIGZzeEZpbGVTeXN0ZW06ICdmcy1yYWctc3RvcmFnZScsXG4gICAgbGFtYmRhRnVuY3Rpb25zOiBbXG4gICAgICAncmFnLWNoYXQtaGFuZGxlcicsXG4gICAgICAncmFnLWRvY3VtZW50LXByb2Nlc3NvcicsXG4gICAgICAncmFnLXNlYXJjaC1oYW5kbGVyJ1xuICAgIF1cbiAgfSxcbiAgXG4gIGNvc3RMaW1pdHM6IHtcbiAgICBtYXhUZXN0Q29zdDogNS4wLCAgICAgICAgICAgICAgIC8vICQ1IFVTRFxuICAgIGJlZHJvY2tUb2tlbkxpbWl0OiAxMDAwMDAsICAgICAgLy8gMTAwSyB0b2tlbnNcbiAgICBvcGVuU2VhcmNoUXVlcnlMaW1pdDogMTAwMCwgICAgIC8vIDEwMDAgcXVlcmllc1xuICAgIGR5bmFtb0RCUmVhZExpbWl0OiAxMDAwMCAgICAgICAgLy8gMTBLIHJlYWRzXG4gIH0sXG4gIFxuICBzYWZldHk6IHtcbiAgICBlbmFibGVFbWVyZ2VuY3lTdG9wOiB0cnVlLFxuICAgIG1heFRlc3REdXJhdGlvbjogMTgwMCwgICAgICAgICAgLy8gMzDliIZcbiAgICByZXNvdXJjZVVzYWdlVGhyZXNob2xkOiAwLjksICAgIC8vIDkwJVxuICAgIGF1dG9TdG9wT25IaWdoQ29zdDogdHJ1ZVxuICB9XG59O1xuXG4vKipcbiAqIOOCueODhuODvOOCuOODs+OCsOeSsOWig+eUqOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOioreWumlxuICovXG5leHBvcnQgY29uc3Qgc3RhZ2luZ1BlcmZvcm1hbmNlQ29uZmlnOiBQZXJmb3JtYW5jZVRlc3RDb25maWcgPSB7XG4gIC4uLnByb2R1Y3Rpb25QZXJmb3JtYW5jZUNvbmZpZyxcbiAgdGVzdEVudmlyb25tZW50OiAnc3RhZ2luZycsXG4gIFxuICAvLyDjgojjgornqY3mpbXnmoTjgarjg4bjgrnjg4joqK3lrppcbiAgbG9hZFRlc3Q6IHtcbiAgICBiYXNpY1Rlc3Q6IHtcbiAgICAgIHJlcXVlc3RDb3VudDogMjAsXG4gICAgICByZXF1ZXN0SW50ZXJ2YWw6IDUwMCwgICAgICAgICAgLy8gMC4156eS6ZaT6ZqUXG4gICAgICB0aW1lb3V0OiA2MDAwMCAgICAgICAgICAgICAgICAgLy8gNjDnp5Ljgr/jgqTjg6DjgqLjgqbjg4hcbiAgICB9LFxuICAgIGNvbmN1cnJlbnRUZXN0OiB7XG4gICAgICBtYXhDb25jdXJyZW50VXNlcnM6IDEwLFxuICAgICAgdGVzdER1cmF0aW9uOiA2MCwgICAgICAgICAgICAgIC8vIDYw56eSXG4gICAgICByYW1wVXBUaW1lOiAxNSwgICAgICAgICAgICAgICAgLy8gMTXnp5Ljgafjg6njg7Pjg5fjgqLjg4Pjg5dcbiAgICAgIHJlcXVlc3RJbnRlcnZhbDogMTAwMCwgICAgICAgICAvLyAx56eS6ZaT6ZqUXG4gICAgICBtYXhSZXF1ZXN0c1BlclVzZXI6IDEwMFxuICAgIH0sXG4gICAgc2NhbGFiaWxpdHlUZXN0OiB7XG4gICAgICB1c2VyTGV2ZWxzOiBbMSwgMywgNSwgMTAsIDE1LCAyMF0sIC8vIOOCiOOCiuWkmuOBj+OBruODrOODmeODq1xuICAgICAgdGVzdER1cmF0aW9uUGVyTGV2ZWw6IDMwLCAgICAgIC8vIOWQhOODrOODmeODqzMw56eSXG4gICAgICBsZXZlbEludGVydmFsOiAxMCAgICAgICAgICAgICAgLy8g44Os44OZ44Or6ZaTMTDnp5LlvoXmqZ9cbiAgICB9XG4gIH0sXG4gIFxuICBjb3N0TGltaXRzOiB7XG4gICAgbWF4VGVzdENvc3Q6IDEwLjAsICAgICAgICAgICAgICAvLyAkMTAgVVNEXG4gICAgYmVkcm9ja1Rva2VuTGltaXQ6IDIwMDAwMCwgICAgICAvLyAyMDBLIHRva2Vuc1xuICAgIG9wZW5TZWFyY2hRdWVyeUxpbWl0OiAyMDAwLCAgICAgLy8gMjAwMCBxdWVyaWVzXG4gICAgZHluYW1vREJSZWFkTGltaXQ6IDIwMDAwICAgICAgICAvLyAyMEsgcmVhZHNcbiAgfVxufTtcblxuLyoqXG4gKiDplovnmbrnkrDlooPnlKjjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4joqK3lrppcbiAqL1xuZXhwb3J0IGNvbnN0IGRldmVsb3BtZW50UGVyZm9ybWFuY2VDb25maWc6IFBlcmZvcm1hbmNlVGVzdENvbmZpZyA9IHtcbiAgLi4ucHJvZHVjdGlvblBlcmZvcm1hbmNlQ29uZmlnLFxuICB0ZXN0RW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcsXG4gIFxuICAvLyDou73ph4/jgarjg4bjgrnjg4joqK3lrppcbiAgdGhyZXNob2xkczoge1xuICAgIG1heFJlc3BvbnNlVGltZTogMTAwMDAsICAgICAgICAgLy8gMTDnp5LvvIjplovnmbrnkrDlooPjga/nt6njgYToqK3lrprvvIlcbiAgICBtaW5UaHJvdWdocHV0OiA1LCAgICAgICAgICAgICAgIC8vIDUgcmVxL3NlY1xuICAgIG1heEVycm9yUmF0ZTogMC4xLCAgICAgICAgICAgICAgLy8gMTAlXG4gICAgbWF4Q3B1VXRpbGl6YXRpb246IDAuOSwgICAgICAgICAvLyA5MCVcbiAgICBtYXhNZW1vcnlVdGlsaXphdGlvbjogMC45LCAgICAgIC8vIDkwJVxuICAgIG1heE5ldHdvcmtMYXRlbmN5OiAyMDAgICAgICAgICAgLy8gMjAwbXNcbiAgfSxcbiAgXG4gIGxvYWRUZXN0OiB7XG4gICAgYmFzaWNUZXN0OiB7XG4gICAgICByZXF1ZXN0Q291bnQ6IDUsXG4gICAgICByZXF1ZXN0SW50ZXJ2YWw6IDIwMDAsICAgICAgICAgLy8gMuenkumWk+malFxuICAgICAgdGltZW91dDogMTUwMDAgICAgICAgICAgICAgICAgIC8vIDE156eS44K/44Kk44Og44Ki44Km44OIXG4gICAgfSxcbiAgICBjb25jdXJyZW50VGVzdDoge1xuICAgICAgbWF4Q29uY3VycmVudFVzZXJzOiAzLFxuICAgICAgdGVzdER1cmF0aW9uOiAxNSwgICAgICAgICAgICAgIC8vIDE156eSXG4gICAgICByYW1wVXBUaW1lOiA1LCAgICAgICAgICAgICAgICAgLy8gNeenkuOBp+ODqeODs+ODl+OCouODg+ODl1xuICAgICAgcmVxdWVzdEludGVydmFsOiAzMDAwLCAgICAgICAgIC8vIDPnp5LplpPpmpRcbiAgICAgIG1heFJlcXVlc3RzUGVyVXNlcjogMTBcbiAgICB9LFxuICAgIHNjYWxhYmlsaXR5VGVzdDoge1xuICAgICAgdXNlckxldmVsczogWzEsIDIsIDNdLCAgICAgICAgIC8vIOacgOWwj+mZkOOBruODrOODmeODq1xuICAgICAgdGVzdER1cmF0aW9uUGVyTGV2ZWw6IDEwLCAgICAgIC8vIOWQhOODrOODmeODqzEw56eSXG4gICAgICBsZXZlbEludGVydmFsOiAzICAgICAgICAgICAgICAgLy8g44Os44OZ44Or6ZaTM+enkuW+heapn1xuICAgIH1cbiAgfSxcbiAgXG4gIGNvc3RMaW1pdHM6IHtcbiAgICBtYXhUZXN0Q29zdDogMS4wLCAgICAgICAgICAgICAgIC8vICQxIFVTRFxuICAgIGJlZHJvY2tUb2tlbkxpbWl0OiAxMDAwMCwgICAgICAgLy8gMTBLIHRva2Vuc1xuICAgIG9wZW5TZWFyY2hRdWVyeUxpbWl0OiAxMDAsICAgICAgLy8gMTAwIHF1ZXJpZXNcbiAgICBkeW5hbW9EQlJlYWRMaW1pdDogMTAwMCAgICAgICAgIC8vIDFLIHJlYWRzXG4gIH0sXG4gIFxuICBzYWZldHk6IHtcbiAgICBlbmFibGVFbWVyZ2VuY3lTdG9wOiB0cnVlLFxuICAgIG1heFRlc3REdXJhdGlvbjogMzAwLCAgICAgICAgICAgLy8gNeWIhlxuICAgIHJlc291cmNlVXNhZ2VUaHJlc2hvbGQ6IDAuOCwgICAgLy8gODAlXG4gICAgYXV0b1N0b3BPbkhpZ2hDb3N0OiB0cnVlXG4gIH1cbn07XG5cbi8qKlxuICog55Kw5aKD44Gr5b+c44GY44Gf6Kit5a6a44Gu5Y+W5b6XXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQZXJmb3JtYW5jZUNvbmZpZyhlbnZpcm9ubWVudDogc3RyaW5nKTogUGVyZm9ybWFuY2VUZXN0Q29uZmlnIHtcbiAgc3dpdGNoIChlbnZpcm9ubWVudC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAncHJvZHVjdGlvbic6XG4gICAgY2FzZSAncHJvZCc6XG4gICAgICByZXR1cm4gcHJvZHVjdGlvblBlcmZvcm1hbmNlQ29uZmlnO1xuICAgIGNhc2UgJ3N0YWdpbmcnOlxuICAgIGNhc2UgJ3N0YWdlJzpcbiAgICAgIHJldHVybiBzdGFnaW5nUGVyZm9ybWFuY2VDb25maWc7XG4gICAgY2FzZSAnZGV2ZWxvcG1lbnQnOlxuICAgIGNhc2UgJ2Rldic6XG4gICAgICByZXR1cm4gZGV2ZWxvcG1lbnRQZXJmb3JtYW5jZUNvbmZpZztcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc29sZS53YXJuKGDmnKrnn6Xjga7nkrDlooM6ICR7ZW52aXJvbm1lbnR9LiDplovnmbrnkrDlooPoqK3lrprjgpLkvb/nlKjjgZfjgb7jgZnjgIJgKTtcbiAgICAgIHJldHVybiBkZXZlbG9wbWVudFBlcmZvcm1hbmNlQ29uZmlnO1xuICB9XG59XG5cbi8qKlxuICog44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI6Kit5a6a44Gu5qSc6Ki8XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVBlcmZvcm1hbmNlQ29uZmlnKGNvbmZpZzogUGVyZm9ybWFuY2VUZXN0Q29uZmlnKToge1xuICBpc1ZhbGlkOiBib29sZWFuO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xuICB3YXJuaW5nczogc3RyaW5nW107XG59IHtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcblxuICAvLyDlv4XpoIjjg5XjgqPjg7zjg6vjg4njga7mpJzoqLxcbiAgaWYgKCFjb25maWcucmVnaW9uKSB7XG4gICAgZXJyb3JzLnB1c2goJ+ODquODvOOCuOODp+ODs+OBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICB9XG5cbiAgaWYgKCFjb25maWcuYXdzUHJvZmlsZSkge1xuICAgIGVycm9ycy5wdXNoKCdBV1Pjg5fjg63jg5XjgqHjgqTjg6vjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIC8vIOmWvuWApOOBruWmpeW9k+aAp+aknOiovFxuICBpZiAoY29uZmlnLnRocmVzaG9sZHMubWF4UmVzcG9uc2VUaW1lIDw9IDApIHtcbiAgICBlcnJvcnMucHVzaCgn5pyA5aSn5b+c562U5pmC6ZaT44Gv5q2j44Gu5YCk44Gn44GC44KL5b+F6KaB44GM44GC44KK44G+44GZJyk7XG4gIH1cblxuICBpZiAoY29uZmlnLnRocmVzaG9sZHMubWluVGhyb3VnaHB1dCA8PSAwKSB7XG4gICAgZXJyb3JzLnB1c2goJ+acgOWwj+OCueODq+ODvOODl+ODg+ODiOOBr+ato+OBruWApOOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmScpO1xuICB9XG5cbiAgaWYgKGNvbmZpZy50aHJlc2hvbGRzLm1heEVycm9yUmF0ZSA8IDAgfHwgY29uZmlnLnRocmVzaG9sZHMubWF4RXJyb3JSYXRlID4gMSkge1xuICAgIGVycm9ycy5wdXNoKCfmnIDlpKfjgqjjg6njg7znjofjga8wLTHjga7nr4Tlm7LjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIC8vIOiyoOiNt+ODhuOCueODiOioreWumuOBruaknOiovFxuICBpZiAoY29uZmlnLmxvYWRUZXN0LmNvbmN1cnJlbnRUZXN0Lm1heENvbmN1cnJlbnRVc2VycyA8PSAwKSB7XG4gICAgZXJyb3JzLnB1c2goJ+acgOWkp+WQjOaZguODpuODvOOCtuODvOaVsOOBr+ato+OBruWApOOBp+OBguOCi+W/heimgeOBjOOBguOCiuOBvuOBmScpO1xuICB9XG5cbiAgaWYgKGNvbmZpZy5sb2FkVGVzdC5jb25jdXJyZW50VGVzdC50ZXN0RHVyYXRpb24gPD0gMCkge1xuICAgIGVycm9ycy5wdXNoKCfjg4bjgrnjg4jmmYLplpPjga/mraPjga7lgKTjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIC8vIOOCs+OCueODiOWItumZkOOBruaknOiovFxuICBpZiAoY29uZmlnLmNvc3RMaW1pdHMubWF4VGVzdENvc3QgPD0gMCkge1xuICAgIGVycm9ycy5wdXNoKCfmnIDlpKfjg4bjgrnjg4jjgrPjgrnjg4jjga/mraPjga7lgKTjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIC8vIOitpuWRiuOBrueUn+aIkFxuICBpZiAoY29uZmlnLnRlc3RFbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaWYgKGNvbmZpZy5sb2FkVGVzdC5jb25jdXJyZW50VGVzdC5tYXhDb25jdXJyZW50VXNlcnMgPiAxMCkge1xuICAgICAgd2FybmluZ3MucHVzaCgn5pys55Wq55Kw5aKD44Gn44Gu5ZCM5pmC44Om44O844K244O85pWw44GM5aSa44GZ44GO44KL5Y+v6IO95oCn44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5jb3N0TGltaXRzLm1heFRlc3RDb3N0ID4gMTApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goJ+acrOeVqueSsOWig+OBp+OBruODhuOCueODiOOCs+OCueODiOS4iumZkOOBjOmrmOOBmeOBjuOCi+WPr+iDveaAp+OBjOOBguOCiuOBvuOBmScpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb25maWcuc2FmZXR5Lm1heFRlc3REdXJhdGlvbiA+IDM2MDApIHtcbiAgICB3YXJuaW5ncy5wdXNoKCfjg4bjgrnjg4jmnIDlpKflrp/ooYzmmYLplpPjgYwx5pmC6ZaT44KS6LaF44GI44Gm44GE44G+44GZJyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGlzVmFsaWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgZXJyb3JzLFxuICAgIHdhcm5pbmdzXG4gIH07XG59XG5cbi8qKlxuICog44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI6Kit5a6a44Gu6KGo56S6XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNwbGF5UGVyZm9ybWFuY2VDb25maWcoY29uZmlnOiBQZXJmb3JtYW5jZVRlc3RDb25maWcpOiB2b2lkIHtcbiAgY29uc29sZS5sb2coJ/Cfk4og44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI6Kit5a6aOicpO1xuICBjb25zb2xlLmxvZyhgICAg55Kw5aKDOiAke2NvbmZpZy50ZXN0RW52aXJvbm1lbnR9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDjg6rjg7zjgrjjg6fjg7M6ICR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgY29uc29sZS5sb2coYCAgIEFXU+ODl+ODreODleOCoeOCpOODqzogJHtjb25maWcuYXdzUHJvZmlsZX1gKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ/Cfjq8g44OR44OV44Kp44O844Oe44Oz44K56Za+5YCkOicpO1xuICBjb25zb2xlLmxvZyhgICAg5pyA5aSn5b+c562U5pmC6ZaTOiAke2NvbmZpZy50aHJlc2hvbGRzLm1heFJlc3BvbnNlVGltZX1tc2ApO1xuICBjb25zb2xlLmxvZyhgICAg5pyA5bCP44K544Or44O844OX44OD44OIOiAke2NvbmZpZy50aHJlc2hvbGRzLm1pblRocm91Z2hwdXR9IHJlcS9zZWNgKTtcbiAgY29uc29sZS5sb2coYCAgIOacgOWkp+OCqOODqeODvOeOhzogJHsoY29uZmlnLnRocmVzaG9sZHMubWF4RXJyb3JSYXRlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgY29uc29sZS5sb2coYCAgIOacgOWkp0NQVeS9v+eUqOeOhzogJHsoY29uZmlnLnRocmVzaG9sZHMubWF4Q3B1VXRpbGl6YXRpb24gKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICBjb25zb2xlLmxvZyhgICAg5pyA5aSn44Oh44Oi44Oq5L2/55So546HOiAkeyhjb25maWcudGhyZXNob2xkcy5tYXhNZW1vcnlVdGlsaXphdGlvbiAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgXG4gIGNvbnNvbGUubG9nKCfwn5SEIOiyoOiNt+ODhuOCueODiOioreWumjonKTtcbiAgY29uc29sZS5sb2coYCAgIOWfuuacrOODhuOCueODiCAtIOODquOCr+OCqOOCueODiOaVsDogJHtjb25maWcubG9hZFRlc3QuYmFzaWNUZXN0LnJlcXVlc3RDb3VudH1gKTtcbiAgY29uc29sZS5sb2coYCAgIOWQjOaZguaOpee2muODhuOCueODiCAtIOacgOWkp+ODpuODvOOCtuODvOaVsDogJHtjb25maWcubG9hZFRlc3QuY29uY3VycmVudFRlc3QubWF4Q29uY3VycmVudFVzZXJzfWApO1xuICBjb25zb2xlLmxvZyhgICAg5ZCM5pmC5o6l57aa44OG44K544OIIC0g44OG44K544OI5pmC6ZaTOiAke2NvbmZpZy5sb2FkVGVzdC5jb25jdXJyZW50VGVzdC50ZXN0RHVyYXRpb25956eSYCk7XG4gIGNvbnNvbGUubG9nKGAgICDjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPjg4bjgrnjg4ggLSDjg6bjg7zjgrbjg7zjg6zjg5njg6s6IFske2NvbmZpZy5sb2FkVGVzdC5zY2FsYWJpbGl0eVRlc3QudXNlckxldmVscy5qb2luKCcsICcpfV1gKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ/CfkrAg44Kz44K544OI5Yi26ZmQOicpO1xuICBjb25zb2xlLmxvZyhgICAg5pyA5aSn44OG44K544OI44Kz44K544OIOiAkJHtjb25maWcuY29zdExpbWl0cy5tYXhUZXN0Q29zdH1gKTtcbiAgY29uc29sZS5sb2coYCAgIEJlZHJvY2vjg4jjg7zjgq/jg7PliLbpmZA6ICR7Y29uZmlnLmNvc3RMaW1pdHMuYmVkcm9ja1Rva2VuTGltaXQudG9Mb2NhbGVTdHJpbmcoKX1gKTtcbiAgY29uc29sZS5sb2coYCAgIE9wZW5TZWFyY2jjgq/jgqjjg6rliLbpmZA6ICR7Y29uZmlnLmNvc3RMaW1pdHMub3BlblNlYXJjaFF1ZXJ5TGltaXQudG9Mb2NhbGVTdHJpbmcoKX1gKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBcbiAgY29uc29sZS5sb2coJ/Cfm6HvuI8g5a6J5YWo6Kit5a6aOicpO1xuICBjb25zb2xlLmxvZyhgICAg57eK5oCl5YGc5q2iOiAke2NvbmZpZy5zYWZldHkuZW5hYmxlRW1lcmdlbmN5U3RvcCA/ICfmnInlirknIDogJ+eEoeWKuSd9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDmnIDlpKfjg4bjgrnjg4jmmYLplpM6ICR7Y29uZmlnLnNhZmV0eS5tYXhUZXN0RHVyYXRpb25956eSYCk7XG4gIGNvbnNvbGUubG9nKGAgICDjg6rjgr3jg7zjgrnkvb/nlKjnjofplr7lgKQ6ICR7KGNvbmZpZy5zYWZldHkucmVzb3VyY2VVc2FnZVRocmVzaG9sZCAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gIGNvbnNvbGUubG9nKGAgICDpq5jjgrPjgrnjg4jmmYLoh6rli5XlgZzmraI6ICR7Y29uZmlnLnNhZmV0eS5hdXRvU3RvcE9uSGlnaENvc3QgPyAn5pyJ5Yq5JyA6ICfnhKHlirknfWApO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHByb2R1Y3Rpb25QZXJmb3JtYW5jZUNvbmZpZyxcbiAgc3RhZ2luZ1BlcmZvcm1hbmNlQ29uZmlnLFxuICBkZXZlbG9wbWVudFBlcmZvcm1hbmNlQ29uZmlnLFxuICBnZXRQZXJmb3JtYW5jZUNvbmZpZyxcbiAgdmFsaWRhdGVQZXJmb3JtYW5jZUNvbmZpZyxcbiAgZGlzcGxheVBlcmZvcm1hbmNlQ29uZmlnXG59OyJdfQ==