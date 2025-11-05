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
    testEnvironment: 'production' | 'staging' | 'development';
    region: string;
    awsProfile: string;
    thresholds: {
        maxResponseTime: number;
        minThroughput: number;
        maxErrorRate: number;
        maxCpuUtilization: number;
        maxMemoryUtilization: number;
        maxNetworkLatency: number;
    };
    loadTest: {
        basicTest: {
            requestCount: number;
            requestInterval: number;
            timeout: number;
        };
        concurrentTest: {
            maxConcurrentUsers: number;
            testDuration: number;
            rampUpTime: number;
            requestInterval: number;
            maxRequestsPerUser: number;
        };
        scalabilityTest: {
            userLevels: number[];
            testDurationPerLevel: number;
            levelInterval: number;
        };
    };
    monitoring: {
        sampleInterval: number;
        monitoringDuration: number;
        metricsToCollect: string[];
        cloudWatchNamespace: string;
    };
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
    costLimits: {
        maxTestCost: number;
        bedrockTokenLimit: number;
        openSearchQueryLimit: number;
        dynamoDBReadLimit: number;
    };
    safety: {
        enableEmergencyStop: boolean;
        maxTestDuration: number;
        resourceUsageThreshold: number;
        autoStopOnHighCost: boolean;
    };
}
/**
 * 本番環境用パフォーマンステスト設定
 */
export declare const productionPerformanceConfig: PerformanceTestConfig;
/**
 * ステージング環境用パフォーマンステスト設定
 */
export declare const stagingPerformanceConfig: PerformanceTestConfig;
/**
 * 開発環境用パフォーマンステスト設定
 */
export declare const developmentPerformanceConfig: PerformanceTestConfig;
/**
 * 環境に応じた設定の取得
 */
export declare function getPerformanceConfig(environment: string): PerformanceTestConfig;
/**
 * パフォーマンステスト設定の検証
 */
export declare function validatePerformanceConfig(config: PerformanceTestConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * パフォーマンステスト設定の表示
 */
export declare function displayPerformanceConfig(config: PerformanceTestConfig): void;
declare const _default: {
    productionPerformanceConfig: PerformanceTestConfig;
    stagingPerformanceConfig: PerformanceTestConfig;
    developmentPerformanceConfig: PerformanceTestConfig;
    getPerformanceConfig: typeof getPerformanceConfig;
    validatePerformanceConfig: typeof validatePerformanceConfig;
    displayPerformanceConfig: typeof displayPerformanceConfig;
};
export default _default;
