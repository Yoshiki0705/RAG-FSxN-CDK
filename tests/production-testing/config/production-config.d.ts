/**
 * 本番環境テスト設定管理
 *
 * AWS東京リージョン本番環境への安全な接続設定を管理
 * 全てのテストは実本番リソースを使用し、読み取り専用モードで実行
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * 本番環境設定インターフェース
 */
export interface ProductionConfig {
    region: 'ap-northeast-1';
    environment: 'production';
    awsProfile: string;
    safetyMode: boolean;
    readOnlyMode: boolean;
    emergencyStopEnabled: boolean;
    resources: ProductionResources;
    execution: ExecutionConfig;
    monitoring: MonitoringConfig;
}
/**
 * 実本番リソース設定
 */
export interface ProductionResources {
    cloudFrontDistribution: string;
    lambdaWebAdapter: string;
    cognitoUserPool: string;
    cognitoClientId: string;
    wafWebAcl: string;
    bedrockModels: string[];
    openSearchDomain: string;
    openSearchIndex: string;
    dynamoDBTables: {
        sessions: string;
        users: string;
        documents: string;
    };
    fsxFileSystem: string;
    s3Buckets: {
        documents: string;
        embeddings: string;
    };
    cloudWatchLogGroups: string[];
    xrayServiceMap: string;
}
/**
 * テスト実行設定
 */
export interface ExecutionConfig {
    maxConcurrentTests: number;
    testTimeout: number;
    retryCount: number;
    failFast: boolean;
    maxTestDuration: number;
}
/**
 * 監視設定
 */
export interface MonitoringConfig {
    enableRealTimeMonitoring: boolean;
    metricsCollectionInterval: number;
    alertThresholds: {
        errorRate: number;
        responseTime: number;
        resourceUtilization: number;
    };
}
/**
 * 本番環境設定の作成
 */
export declare function createProductionConfig(): ProductionConfig;
/**
 * 設定の検証
 */
export declare function validateProductionConfig(config: ProductionConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * デフォルト本番環境設定
 */
export declare const defaultProductionConfig: ProductionConfig;
export default defaultProductionConfig;
