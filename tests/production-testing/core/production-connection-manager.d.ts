/**
 * 本番環境接続管理システム
 *
 * 実本番AWSリソースへの安全な接続を管理
 * 読み取り専用モードでの安全なアクセス制御を提供
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../config/production-config';
/**
 * 接続状態インターフェース
 */
export interface ConnectionStatus {
    service: string;
    connected: boolean;
    lastChecked: Date;
    responseTime: number;
    error?: string;
    metadata?: any;
}
/**
 * 接続結果インターフェース
 */
export interface ConnectionResult {
    success: boolean;
    connectedServices: string[];
    failedServices: string[];
    totalResponseTime: number;
    details: ConnectionStatus[];
}
/**
 * 本番環境接続管理クラス
 */
export declare class ProductionConnectionManager {
    private config;
    private clients;
    private connectionStatus;
    private emergencyStopRequested;
    constructor(config: ProductionConfig);
    /**
     * AWSクライアントの初期化
     */
    private initializeClients;
    /**
     * 本番環境への接続テスト
     */
    testProductionConnection(): Promise<ConnectionResult>;
    /**
     * CloudFront接続テスト
     */
    private testCloudFrontConnection;
    /**
     * Cognito接続テスト
     */
    private testCognitoConnection;
    /**
     * DynamoDB接続テスト
     */
    private testDynamoDBConnection;
    /**
     * OpenSearch接続テスト
     */
    private testOpenSearchConnection;
    /**
     * Bedrock接続テスト
     */
    private testBedrockConnection;
    /**
     * FSx接続テスト
     */
    private testFSxConnection;
    /**
     * 接続メトリクスをCloudWatchに送信
     */
    private sendConnectionMetrics;
    /**
     * 緊急停止の要求
     */
    requestEmergencyStop(reason: string): void;
    /**
     * 緊急停止状態のリセット
     */
    resetEmergencyStop(): void;
    /**
     * 現在の接続状態を取得
     */
    getConnectionStatus(): Map<string, ConnectionStatus>;
    /**
     * 特定のサービスの接続状態を取得
     */
    getServiceConnectionStatus(serviceName: string): ConnectionStatus | undefined;
    /**
     * 接続の健全性チェック
     */
    performHealthCheck(): Promise<{
        healthy: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default ProductionConnectionManager;
