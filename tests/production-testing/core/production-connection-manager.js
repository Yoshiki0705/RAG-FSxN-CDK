"use strict";
/**
 * 本番環境接続管理システム
 *
 * 実本番AWSリソースへの安全な接続を管理
 * 読み取り専用モードでの安全なアクセス制御を提供
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionConnectionManager = void 0;
const client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_opensearchserverless_1 = require("@aws-sdk/client-opensearchserverless");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_fsx_1 = require("@aws-sdk/client-fsx");
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
/**
 * 本番環境接続管理クラス
 */
class ProductionConnectionManager {
    config;
    clients = new Map();
    connectionStatus = new Map();
    emergencyStopRequested = false;
    constructor(config) {
        this.config = config;
        this.initializeClients();
    }
    /**
     * AWSクライアントの初期化
     */
    initializeClients() {
        console.log('🔧 AWS クライアントを初期化中...');
        const clientConfig = {
            region: this.config.region,
            credentials: {
                profile: this.config.awsProfile
            }
        };
        try {
            // フロントエンド関連クライアント
            this.clients.set('cloudfront', new client_cloudfront_1.CloudFrontClient(clientConfig));
            // 認証・セキュリティ関連クライアント
            this.clients.set('cognito', new client_cognito_identity_provider_1.CognitoIdentityProviderClient(clientConfig));
            // データベース関連クライアント
            this.clients.set('dynamodb', new client_dynamodb_1.DynamoDBClient(clientConfig));
            this.clients.set('opensearch', new client_opensearchserverless_1.OpenSearchServerlessClient(clientConfig));
            // AI関連クライアント
            this.clients.set('bedrock', new client_bedrock_runtime_1.BedrockRuntimeClient(clientConfig));
            // ストレージ関連クライアント
            this.clients.set('fsx', new client_fsx_1.FSxClient(clientConfig));
            // 監視関連クライアント
            this.clients.set('cloudwatch', new client_cloudwatch_1.CloudWatchClient(clientConfig));
            console.log('✅ AWS クライアント初期化完了');
        }
        catch (error) {
            console.error('❌ AWS クライアント初期化エラー:', error);
            throw new Error(`AWS クライアント初期化に失敗しました: ${error}`);
        }
    }
    /**
     * 本番環境への接続テスト
     */
    async testProductionConnection() {
        console.log('🔗 本番環境接続テストを開始...');
        if (this.emergencyStopRequested) {
            throw new Error('緊急停止が要求されています。接続テストを中止します。');
        }
        const startTime = Date.now();
        const connectionTests = [
            { name: 'cloudfront', test: this.testCloudFrontConnection.bind(this) },
            { name: 'cognito', test: this.testCognitoConnection.bind(this) },
            { name: 'dynamodb', test: this.testDynamoDBConnection.bind(this) },
            { name: 'opensearch', test: this.testOpenSearchConnection.bind(this) },
            { name: 'bedrock', test: this.testBedrockConnection.bind(this) },
            { name: 'fsx', test: this.testFSxConnection.bind(this) }
        ];
        const results = [];
        const connectedServices = [];
        const failedServices = [];
        // 並列で接続テストを実行
        const testPromises = connectionTests.map(async ({ name, test }) => {
            try {
                const testStartTime = Date.now();
                const result = await test();
                const responseTime = Date.now() - testStartTime;
                const status = {
                    service: name,
                    connected: result.success,
                    lastChecked: new Date(),
                    responseTime,
                    metadata: result.metadata
                };
                if (result.success) {
                    connectedServices.push(name);
                    console.log(`✅ ${name} 接続成功 (${responseTime}ms)`);
                }
                else {
                    failedServices.push(name);
                    status.error = result.error;
                    console.error(`❌ ${name} 接続失敗: ${result.error}`);
                }
                this.connectionStatus.set(name, status);
                return status;
            }
            catch (error) {
                const status = {
                    service: name,
                    connected: false,
                    lastChecked: new Date(),
                    responseTime: 0,
                    error: error instanceof Error ? error.message : String(error)
                };
                failedServices.push(name);
                this.connectionStatus.set(name, status);
                console.error(`❌ ${name} 接続テスト例外:`, error);
                return status;
            }
        });
        results.push(...await Promise.all(testPromises));
        const totalResponseTime = Date.now() - startTime;
        const success = failedServices.length === 0;
        // CloudWatchにメトリクスを送信
        await this.sendConnectionMetrics(connectedServices.length, failedServices.length, totalResponseTime);
        console.log(`🔗 本番環境接続テスト完了: 成功 ${connectedServices.length}件, 失敗 ${failedServices.length}件 (${totalResponseTime}ms)`);
        return {
            success,
            connectedServices,
            failedServices,
            totalResponseTime,
            details: results
        };
    }
    /**
     * CloudFront接続テスト
     */
    async testCloudFrontConnection() {
        try {
            const client = this.clients.get('cloudfront');
            const command = new client_cloudfront_1.GetDistributionCommand({
                Id: this.config.resources.cloudFrontDistribution
            });
            const response = await client.send(command);
            return {
                success: true,
                metadata: {
                    distributionId: response.Distribution?.Id,
                    status: response.Distribution?.Status,
                    domainName: response.Distribution?.DomainName,
                    enabled: response.Distribution?.DistributionConfig?.Enabled
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Cognito接続テスト
     */
    async testCognitoConnection() {
        try {
            const client = this.clients.get('cognito');
            const command = new client_cognito_identity_provider_1.DescribeUserPoolCommand({
                UserPoolId: this.config.resources.cognitoUserPool
            });
            const response = await client.send(command);
            return {
                success: true,
                metadata: {
                    userPoolId: response.UserPool?.Id,
                    name: response.UserPool?.Name,
                    status: response.UserPool?.Status,
                    userCount: response.UserPool?.EstimatedNumberOfUsers
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * DynamoDB接続テスト
     */
    async testDynamoDBConnection() {
        try {
            const client = this.clients.get('dynamodb');
            const command = new client_dynamodb_1.DescribeTableCommand({
                TableName: this.config.resources.dynamoDBTables.sessions
            });
            const response = await client.send(command);
            return {
                success: true,
                metadata: {
                    tableName: response.Table?.TableName,
                    status: response.Table?.TableStatus,
                    itemCount: response.Table?.ItemCount,
                    tableSize: response.Table?.TableSizeBytes
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * OpenSearch接続テスト
     */
    async testOpenSearchConnection() {
        try {
            const client = this.clients.get('opensearch');
            const command = new client_opensearchserverless_1.GetCollectionCommand({
                id: this.config.resources.openSearchDomain
            });
            const response = await client.send(command);
            return {
                success: true,
                metadata: {
                    collectionId: response.collectionDetail?.id,
                    name: response.collectionDetail?.name,
                    status: response.collectionDetail?.status,
                    type: response.collectionDetail?.type
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Bedrock接続テスト
     */
    async testBedrockConnection() {
        try {
            const client = this.clients.get('bedrock');
            const command = new client_bedrock_runtime_1.ListFoundationModelsCommand({});
            const response = await client.send(command);
            const availableModels = response.modelSummaries?.filter(model => this.config.resources.bedrockModels.includes(model.modelId || ''));
            return {
                success: true,
                metadata: {
                    totalModels: response.modelSummaries?.length || 0,
                    availableConfiguredModels: availableModels?.length || 0,
                    configuredModels: this.config.resources.bedrockModels
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * FSx接続テスト
     */
    async testFSxConnection() {
        try {
            const client = this.clients.get('fsx');
            const command = new client_fsx_1.DescribeFileSystemsCommand({
                FileSystemIds: [this.config.resources.fsxFileSystem]
            });
            const response = await client.send(command);
            const fileSystem = response.FileSystems?.[0];
            return {
                success: true,
                metadata: {
                    fileSystemId: fileSystem?.FileSystemId,
                    fileSystemType: fileSystem?.FileSystemType,
                    lifecycle: fileSystem?.Lifecycle,
                    storageCapacity: fileSystem?.StorageCapacity
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 接続メトリクスをCloudWatchに送信
     */
    async sendConnectionMetrics(connectedCount, failedCount, responseTime) {
        try {
            const client = this.clients.get('cloudwatch');
            const command = new client_cloudwatch_1.PutMetricDataCommand({
                Namespace: 'ProductionTesting/Connection',
                MetricData: [
                    {
                        MetricName: 'ConnectedServices',
                        Value: connectedCount,
                        Unit: 'Count',
                        Timestamp: new Date()
                    },
                    {
                        MetricName: 'FailedServices',
                        Value: failedCount,
                        Unit: 'Count',
                        Timestamp: new Date()
                    },
                    {
                        MetricName: 'ConnectionTestResponseTime',
                        Value: responseTime,
                        Unit: 'Milliseconds',
                        Timestamp: new Date()
                    }
                ]
            });
            await client.send(command);
            console.log('📊 接続メトリクスをCloudWatchに送信しました');
        }
        catch (error) {
            console.warn('⚠️ CloudWatchメトリクス送信に失敗:', error);
        }
    }
    /**
     * 緊急停止の要求
     */
    requestEmergencyStop(reason) {
        console.warn(`🚨 緊急停止が要求されました: ${reason}`);
        this.emergencyStopRequested = true;
    }
    /**
     * 緊急停止状態のリセット
     */
    resetEmergencyStop() {
        console.log('🔄 緊急停止状態をリセットしました');
        this.emergencyStopRequested = false;
    }
    /**
     * 現在の接続状態を取得
     */
    getConnectionStatus() {
        return new Map(this.connectionStatus);
    }
    /**
     * 特定のサービスの接続状態を取得
     */
    getServiceConnectionStatus(serviceName) {
        return this.connectionStatus.get(serviceName);
    }
    /**
     * 接続の健全性チェック
     */
    async performHealthCheck() {
        const issues = [];
        const recommendations = [];
        // 最近の接続テスト結果をチェック
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5分
        for (const [service, status] of this.connectionStatus) {
            const age = now - status.lastChecked.getTime();
            if (age > maxAge) {
                issues.push(`${service} の接続状態が古すぎます (${Math.round(age / 1000)}秒前)`);
                recommendations.push(`${service} の接続テストを再実行してください`);
            }
            if (!status.connected) {
                issues.push(`${service} への接続に失敗しています: ${status.error}`);
                recommendations.push(`${service} の設定と権限を確認してください`);
            }
            if (status.responseTime > 10000) {
                issues.push(`${service} の応答時間が遅すぎます (${status.responseTime}ms)`);
                recommendations.push(`${service} のパフォーマンスを確認してください`);
            }
        }
        const healthy = issues.length === 0;
        console.log(`🏥 健全性チェック完了: ${healthy ? '正常' : '問題あり'} (問題 ${issues.length}件)`);
        return {
            healthy,
            issues,
            recommendations
        };
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 接続管理システムをクリーンアップ中...');
        // クライアントの切断
        this.clients.clear();
        this.connectionStatus.clear();
        console.log('✅ クリーンアップ完了');
    }
}
exports.ProductionConnectionManager = ProductionConnectionManager;
exports.default = ProductionConnectionManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdGlvbi1jb25uZWN0aW9uLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm9kdWN0aW9uLWNvbm5lY3Rpb24tbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVILGtFQUdvQztBQUNwQyxnR0FHbUQ7QUFDbkQsOERBR2tDO0FBQ2xDLHNGQUc4QztBQUM5Qyw0RUFHeUM7QUFDekMsb0RBRzZCO0FBQzdCLGtFQUdvQztBQTJCcEM7O0dBRUc7QUFDSCxNQUFhLDJCQUEyQjtJQUM5QixNQUFNLENBQW1CO0lBQ3pCLE9BQU8sR0FBcUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUN0QyxnQkFBZ0IsR0FBa0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUM1RCxzQkFBc0IsR0FBWSxLQUFLLENBQUM7SUFFaEQsWUFBWSxNQUF3QjtRQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQ7O09BRUc7SUFDSyxpQkFBaUI7UUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBRXJDLE1BQU0sWUFBWSxHQUFHO1lBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDMUIsV0FBVyxFQUFFO2dCQUNYLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVU7YUFDaEM7U0FDRixDQUFDO1FBRUYsSUFBSSxDQUFDO1lBQ0gsa0JBQWtCO1lBQ2xCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLG9DQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFbkUsb0JBQW9CO1lBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLGdFQUE2QixDQUFDLFlBQVksQ0FBQyxDQUFD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T0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1FBRXBDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLFFBQVEsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFFL0UsT0FBTztZQUNMLE9BQU87WUFDUCxNQUFNO1lBQ04sZUFBZTtTQUNoQixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFFdkMsWUFBWTtRQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1FBRTlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDN0IsQ0FBQztDQUNGO0FBemJELGtFQXliQztBQUVELGtCQUFlLDJCQUEyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDmnKznlarnkrDlooPmjqXntprnrqHnkIbjgrfjgrnjg4bjg6BcbiAqIFxuICog5a6f5pys55WqQVdT44Oq44K944O844K544G444Gu5a6J5YWo44Gq5o6l57aa44KS566h55CGXG4gKiDoqq3jgb/lj5bjgorlsILnlKjjg6Ljg7zjg4njgafjga7lronlhajjgarjgqLjgq/jgrvjgrnliLblvqHjgpLmj5DkvptcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCB7XG4gIENsb3VkRnJvbnRDbGllbnQsXG4gIEdldERpc3RyaWJ1dGlvbkNvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWNsb3VkZnJvbnQnO1xuaW1wb3J0IHtcbiAgQ29nbml0b0lkZW50aXR5UHJvdmlkZXJDbGllbnQsXG4gIERlc2NyaWJlVXNlclBvb2xDb21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1jb2duaXRvLWlkZW50aXR5LXByb3ZpZGVyJztcbmltcG9ydCB7XG4gIER5bmFtb0RCQ2xpZW50LFxuICBEZXNjcmliZVRhYmxlQ29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHtcbiAgT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQsXG4gIEdldENvbGxlY3Rpb25Db21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1vcGVuc2VhcmNoc2VydmVybGVzcyc7XG5pbXBvcnQge1xuICBCZWRyb2NrUnVudGltZUNsaWVudCxcbiAgTGlzdEZvdW5kYXRpb25Nb2RlbHNDb21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1iZWRyb2NrLXJ1bnRpbWUnO1xuaW1wb3J0IHtcbiAgRlN4Q2xpZW50LFxuICBEZXNjcmliZUZpbGVTeXN0ZW1zQ29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtZnN4JztcbmltcG9ydCB7XG4gIENsb3VkV2F0Y2hDbGllbnQsXG4gIFB1dE1ldHJpY0RhdGFDb21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1jbG91ZHdhdGNoJztcblxuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5cbi8qKlxuICog5o6l57aa54q25oWL44Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdGlvblN0YXR1cyB7XG4gIHNlcnZpY2U6IHN0cmluZztcbiAgY29ubmVjdGVkOiBib29sZWFuO1xuICBsYXN0Q2hlY2tlZDogRGF0ZTtcbiAgcmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gIGVycm9yPzogc3RyaW5nO1xuICBtZXRhZGF0YT86IGFueTtcbn1cblxuLyoqXG4gKiDmjqXntprntZDmnpzjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0aW9uUmVzdWx0IHtcbiAgc3VjY2VzczogYm9vbGVhbjtcbiAgY29ubmVjdGVkU2VydmljZXM6IHN0cmluZ1tdO1xuICBmYWlsZWRTZXJ2aWNlczogc3RyaW5nW107XG4gIHRvdGFsUmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gIGRldGFpbHM6IENvbm5lY3Rpb25TdGF0dXNbXTtcbn1cblxuLyoqXG4gKiDmnKznlarnkrDlooPmjqXntprnrqHnkIbjgq/jg6njgrlcbiAqL1xuZXhwb3J0IGNsYXNzIFByb2R1Y3Rpb25Db25uZWN0aW9uTWFuYWdlciB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIGNsaWVudHM6IE1hcDxzdHJpbmcsIGFueT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgY29ubmVjdGlvblN0YXR1czogTWFwPHN0cmluZywgQ29ubmVjdGlvblN0YXR1cz4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgZW1lcmdlbmN5U3RvcFJlcXVlc3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuaW5pdGlhbGl6ZUNsaWVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBV1Pjgq/jg6njgqTjgqLjg7Pjg4jjga7liJ3mnJ/ljJZcbiAgICovXG4gIHByaXZhdGUgaW5pdGlhbGl6ZUNsaWVudHMoKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coJ/CflKcgQVdTIOOCr+ODqeOCpOOCouODs+ODiOOCkuWIneacn+WMluS4rS4uLicpO1xuXG4gICAgY29uc3QgY2xpZW50Q29uZmlnID0ge1xuICAgICAgcmVnaW9uOiB0aGlzLmNvbmZpZy5yZWdpb24sXG4gICAgICBjcmVkZW50aWFsczoge1xuICAgICAgICBwcm9maWxlOiB0aGlzLmNvbmZpZy5hd3NQcm9maWxlXG4gICAgICB9XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAvLyDjg5Xjg63jg7Pjg4jjgqjjg7Pjg4nplqLpgKPjgq/jg6njgqTjgqLjg7Pjg4hcbiAgICAgIHRoaXMuY2xpZW50cy5zZXQoJ2Nsb3VkZnJvbnQnLCBuZXcgQ2xvdWRGcm9udENsaWVudChjbGllbnRDb25maWcpKTtcblxuICAgICAgLy8g6KqN6Ki844O744K744Kt44Ol44Oq44OG44Kj6Zai6YCj44Kv44Op44Kk44Ki44Oz44OIXG4gICAgICB0aGlzLmNsaWVudHMuc2V0KCdjb2duaXRvJywgbmV3IENvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50KGNsaWVudENvbmZpZykpO1xuXG4gICAgICAvLyDjg4fjg7zjgr/jg5njg7zjgrnplqLpgKPjgq/jg6njgqTjgqLjg7Pjg4hcbiAgICAgIHRoaXMuY2xpZW50cy5zZXQoJ2R5bmFtb2RiJywgbmV3IER5bmFtb0RCQ2xpZW50KGNsaWVudENvbmZpZykpO1xuICAgICAgdGhpcy5jbGllbnRzLnNldCgnb3BlbnNlYXJjaCcsIG5ldyBPcGVuU2VhcmNoU2VydmVybGVzc0NsaWVudChjbGllbnRDb25maWcpKTtcblxuICAgICAgLy8gQUnplqLpgKPjgq/jg6njgqTjgqLjg7Pjg4hcbiAgICAgIHRoaXMuY2xpZW50cy5zZXQoJ2JlZHJvY2snLCBuZXcgQmVkcm9ja1J1bnRpbWVDbGllbnQoY2xpZW50Q29uZmlnKSk7XG5cbiAgICAgIC8vIOOCueODiOODrOODvOOCuOmWoumAo+OCr+ODqeOCpOOCouODs+ODiFxuICAgICAgdGhpcy5jbGllbnRzLnNldCgnZnN4JywgbmV3IEZTeENsaWVudChjbGllbnRDb25maWcpKTtcblxuICAgICAgLy8g55uj6KaW6Zai6YCj44Kv44Op44Kk44Ki44Oz44OIXG4gICAgICB0aGlzLmNsaWVudHMuc2V0KCdjbG91ZHdhdGNoJywgbmV3IENsb3VkV2F0Y2hDbGllbnQoY2xpZW50Q29uZmlnKSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQVdTIOOCr+ODqeOCpOOCouODs+ODiOWIneacn+WMluWujOS6hicpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwgQVdTIOOCr+ODqeOCpOOCouODs+ODiOWIneacn+WMluOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEFXUyDjgq/jg6njgqTjgqLjg7Pjg4jliJ3mnJ/ljJbjgavlpLHmlZfjgZfjgb7jgZfjgZ86ICR7ZXJyb3J9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOacrOeVqueSsOWig+OBuOOBruaOpee2muODhuOCueODiFxuICAgKi9cbiAgYXN5bmMgdGVzdFByb2R1Y3Rpb25Db25uZWN0aW9uKCk6IFByb21pc2U8Q29ubmVjdGlvblJlc3VsdD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5SXIOacrOeVqueSsOWig+aOpee2muODhuOCueODiOOCkumWi+Wniy4uLicpO1xuXG4gICAgaWYgKHRoaXMuZW1lcmdlbmN5U3RvcFJlcXVlc3RlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfnt4rmgKXlgZzmraLjgYzopoHmsYLjgZXjgozjgabjgYTjgb7jgZnjgILmjqXntprjg4bjgrnjg4jjgpLkuK3mraLjgZfjgb7jgZnjgIInKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGNvbm5lY3Rpb25UZXN0cyA9IFtcbiAgICAgIHsgbmFtZTogJ2Nsb3VkZnJvbnQnLCB0ZXN0OiB0aGlzLnRlc3RDbG91ZEZyb250Q29ubmVjdGlvbi5iaW5kKHRoaXMpIH0sXG4gICAgICB7IG5hbWU6ICdjb2duaXRvJywgdGVzdDogdGhpcy50ZXN0Q29nbml0b0Nvbm5lY3Rpb24uYmluZCh0aGlzKSB9LFxuICAgICAgeyBuYW1lOiAnZHluYW1vZGInLCB0ZXN0OiB0aGlzLnRlc3REeW5hbW9EQkNvbm5lY3Rpb24uYmluZCh0aGlzKSB9LFxuICAgICAgeyBuYW1lOiAnb3BlbnNlYXJjaCcsIHRlc3Q6IHRoaXMudGVzdE9wZW5TZWFyY2hDb25uZWN0aW9uLmJpbmQodGhpcykgfSxcbiAgICAgIHsgbmFtZTogJ2JlZHJvY2snLCB0ZXN0OiB0aGlzLnRlc3RCZWRyb2NrQ29ubmVjdGlvbi5iaW5kKHRoaXMpIH0sXG4gICAgICB7IG5hbWU6ICdmc3gnLCB0ZXN0OiB0aGlzLnRlc3RGU3hDb25uZWN0aW9uLmJpbmQodGhpcykgfVxuICAgIF07XG5cbiAgICBjb25zdCByZXN1bHRzOiBDb25uZWN0aW9uU3RhdHVzW10gPSBbXTtcbiAgICBjb25zdCBjb25uZWN0ZWRTZXJ2aWNlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBmYWlsZWRTZXJ2aWNlczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIOS4puWIl+OBp+aOpee2muODhuOCueODiOOCkuWun+ihjFxuICAgIGNvbnN0IHRlc3RQcm9taXNlcyA9IGNvbm5lY3Rpb25UZXN0cy5tYXAoYXN5bmMgKHsgbmFtZSwgdGVzdCB9KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXN0U3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGVzdCgpO1xuICAgICAgICBjb25zdCByZXNwb25zZVRpbWUgPSBEYXRlLm5vdygpIC0gdGVzdFN0YXJ0VGltZTtcblxuICAgICAgICBjb25zdCBzdGF0dXM6IENvbm5lY3Rpb25TdGF0dXMgPSB7XG4gICAgICAgICAgc2VydmljZTogbmFtZSxcbiAgICAgICAgICBjb25uZWN0ZWQ6IHJlc3VsdC5zdWNjZXNzLFxuICAgICAgICAgIGxhc3RDaGVja2VkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIHJlc3BvbnNlVGltZSxcbiAgICAgICAgICBtZXRhZGF0YTogcmVzdWx0Lm1ldGFkYXRhXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgY29ubmVjdGVkU2VydmljZXMucHVzaChuYW1lKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhg4pyFICR7bmFtZX0g5o6l57aa5oiQ5YqfICgke3Jlc3BvbnNlVGltZX1tcylgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmYWlsZWRTZXJ2aWNlcy5wdXNoKG5hbWUpO1xuICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHJlc3VsdC5lcnJvcjtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgJHtuYW1lfSDmjqXntprlpLHmlZc6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25uZWN0aW9uU3RhdHVzLnNldChuYW1lLCBzdGF0dXMpO1xuICAgICAgICByZXR1cm4gc3RhdHVzO1xuXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBzdGF0dXM6IENvbm5lY3Rpb25TdGF0dXMgPSB7XG4gICAgICAgICAgc2VydmljZTogbmFtZSxcbiAgICAgICAgICBjb25uZWN0ZWQ6IGZhbHNlLFxuICAgICAgICAgIGxhc3RDaGVja2VkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIHJlc3BvbnNlVGltZTogMCxcbiAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgIH07XG5cbiAgICAgICAgZmFpbGVkU2VydmljZXMucHVzaChuYW1lKTtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uU3RhdHVzLnNldChuYW1lLCBzdGF0dXMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgJHtuYW1lfSDmjqXntprjg4bjgrnjg4jkvovlpJY6YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmVzdWx0cy5wdXNoKC4uLmF3YWl0IFByb21pc2UuYWxsKHRlc3RQcm9taXNlcykpO1xuXG4gICAgY29uc3QgdG90YWxSZXNwb25zZVRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgIGNvbnN0IHN1Y2Nlc3MgPSBmYWlsZWRTZXJ2aWNlcy5sZW5ndGggPT09IDA7XG5cbiAgICAvLyBDbG91ZFdhdGNo44Gr44Oh44OI44Oq44Kv44K544KS6YCB5L+hXG4gICAgYXdhaXQgdGhpcy5zZW5kQ29ubmVjdGlvbk1ldHJpY3MoY29ubmVjdGVkU2VydmljZXMubGVuZ3RoLCBmYWlsZWRTZXJ2aWNlcy5sZW5ndGgsIHRvdGFsUmVzcG9uc2VUaW1lKTtcblxuICAgIGNvbnNvbGUubG9nKGDwn5SXIOacrOeVqueSsOWig+aOpee2muODhuOCueODiOWujOS6hjog5oiQ5YqfICR7Y29ubmVjdGVkU2VydmljZXMubGVuZ3RofeS7tiwg5aSx5pWXICR7ZmFpbGVkU2VydmljZXMubGVuZ3RofeS7tiAoJHt0b3RhbFJlc3BvbnNlVGltZX1tcylgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzLFxuICAgICAgY29ubmVjdGVkU2VydmljZXMsXG4gICAgICBmYWlsZWRTZXJ2aWNlcyxcbiAgICAgIHRvdGFsUmVzcG9uc2VUaW1lLFxuICAgICAgZGV0YWlsczogcmVzdWx0c1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRGcm9udOaOpee2muODhuOCueODiFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB0ZXN0Q2xvdWRGcm9udENvbm5lY3Rpb24oKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nOyBtZXRhZGF0YT86IGFueSB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY2xpZW50cy5nZXQoJ2Nsb3VkZnJvbnQnKSBhcyBDbG91ZEZyb250Q2xpZW50O1xuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBHZXREaXN0cmlidXRpb25Db21tYW5kKHtcbiAgICAgICAgSWQ6IHRoaXMuY29uZmlnLnJlc291cmNlcy5jbG91ZEZyb250RGlzdHJpYnV0aW9uXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBkaXN0cmlidXRpb25JZDogcmVzcG9uc2UuRGlzdHJpYnV0aW9uPy5JZCxcbiAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLkRpc3RyaWJ1dGlvbj8uU3RhdHVzLFxuICAgICAgICAgIGRvbWFpbk5hbWU6IHJlc3BvbnNlLkRpc3RyaWJ1dGlvbj8uRG9tYWluTmFtZSxcbiAgICAgICAgICBlbmFibGVkOiByZXNwb25zZS5EaXN0cmlidXRpb24/LkRpc3RyaWJ1dGlvbkNvbmZpZz8uRW5hYmxlZFxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29nbml0b+aOpee2muODhuOCueODiFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB0ZXN0Q29nbml0b0Nvbm5lY3Rpb24oKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nOyBtZXRhZGF0YT86IGFueSB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY2xpZW50cy5nZXQoJ2NvZ25pdG8nKSBhcyBDb2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudDtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgRGVzY3JpYmVVc2VyUG9vbENvbW1hbmQoe1xuICAgICAgICBVc2VyUG9vbElkOiB0aGlzLmNvbmZpZy5yZXNvdXJjZXMuY29nbml0b1VzZXJQb29sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICB1c2VyUG9vbElkOiByZXNwb25zZS5Vc2VyUG9vbD8uSWQsXG4gICAgICAgICAgbmFtZTogcmVzcG9uc2UuVXNlclBvb2w/Lk5hbWUsXG4gICAgICAgICAgc3RhdHVzOiByZXNwb25zZS5Vc2VyUG9vbD8uU3RhdHVzLFxuICAgICAgICAgIHVzZXJDb3VudDogcmVzcG9uc2UuVXNlclBvb2w/LkVzdGltYXRlZE51bWJlck9mVXNlcnNcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIER5bmFtb0RC5o6l57aa44OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3REeW5hbW9EQkNvbm5lY3Rpb24oKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nOyBtZXRhZGF0YT86IGFueSB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY2xpZW50cy5nZXQoJ2R5bmFtb2RiJykgYXMgRHluYW1vREJDbGllbnQ7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IERlc2NyaWJlVGFibGVDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLmNvbmZpZy5yZXNvdXJjZXMuZHluYW1vREJUYWJsZXMuc2Vzc2lvbnNcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHRhYmxlTmFtZTogcmVzcG9uc2UuVGFibGU/LlRhYmxlTmFtZSxcbiAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLlRhYmxlPy5UYWJsZVN0YXR1cyxcbiAgICAgICAgICBpdGVtQ291bnQ6IHJlc3BvbnNlLlRhYmxlPy5JdGVtQ291bnQsXG4gICAgICAgICAgdGFibGVTaXplOiByZXNwb25zZS5UYWJsZT8uVGFibGVTaXplQnl0ZXNcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5TZWFyY2jmjqXntprjg4bjgrnjg4hcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdGVzdE9wZW5TZWFyY2hDb25uZWN0aW9uKCk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBlcnJvcj86IHN0cmluZzsgbWV0YWRhdGE/OiBhbnkgfT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjbGllbnQgPSB0aGlzLmNsaWVudHMuZ2V0KCdvcGVuc2VhcmNoJykgYXMgT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQ7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IEdldENvbGxlY3Rpb25Db21tYW5kKHtcbiAgICAgICAgaWQ6IHRoaXMuY29uZmlnLnJlc291cmNlcy5vcGVuU2VhcmNoRG9tYWluXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBjb2xsZWN0aW9uSWQ6IHJlc3BvbnNlLmNvbGxlY3Rpb25EZXRhaWw/LmlkLFxuICAgICAgICAgIG5hbWU6IHJlc3BvbnNlLmNvbGxlY3Rpb25EZXRhaWw/Lm5hbWUsXG4gICAgICAgICAgc3RhdHVzOiByZXNwb25zZS5jb2xsZWN0aW9uRGV0YWlsPy5zdGF0dXMsXG4gICAgICAgICAgdHlwZTogcmVzcG9uc2UuY29sbGVjdGlvbkRldGFpbD8udHlwZVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQmVkcm9ja+aOpee2muODhuOCueODiFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB0ZXN0QmVkcm9ja0Nvbm5lY3Rpb24oKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nOyBtZXRhZGF0YT86IGFueSB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY2xpZW50cy5nZXQoJ2JlZHJvY2snKSBhcyBCZWRyb2NrUnVudGltZUNsaWVudDtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgTGlzdEZvdW5kYXRpb25Nb2RlbHNDb21tYW5kKHt9KTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgY29uc3QgYXZhaWxhYmxlTW9kZWxzID0gcmVzcG9uc2UubW9kZWxTdW1tYXJpZXM/LmZpbHRlcihtb2RlbCA9PiBcbiAgICAgICAgdGhpcy5jb25maWcucmVzb3VyY2VzLmJlZHJvY2tNb2RlbHMuaW5jbHVkZXMobW9kZWwubW9kZWxJZCB8fCAnJylcbiAgICAgICk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgdG90YWxNb2RlbHM6IHJlc3BvbnNlLm1vZGVsU3VtbWFyaWVzPy5sZW5ndGggfHwgMCxcbiAgICAgICAgICBhdmFpbGFibGVDb25maWd1cmVkTW9kZWxzOiBhdmFpbGFibGVNb2RlbHM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICAgIGNvbmZpZ3VyZWRNb2RlbHM6IHRoaXMuY29uZmlnLnJlc291cmNlcy5iZWRyb2NrTW9kZWxzXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGU3jmjqXntprjg4bjgrnjg4hcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdGVzdEZTeENvbm5lY3Rpb24oKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nOyBtZXRhZGF0YT86IGFueSB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY2xpZW50cy5nZXQoJ2ZzeCcpIGFzIEZTeENsaWVudDtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgRGVzY3JpYmVGaWxlU3lzdGVtc0NvbW1hbmQoe1xuICAgICAgICBGaWxlU3lzdGVtSWRzOiBbdGhpcy5jb25maWcucmVzb3VyY2VzLmZzeEZpbGVTeXN0ZW1dXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGZpbGVTeXN0ZW0gPSByZXNwb25zZS5GaWxlU3lzdGVtcz8uWzBdO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGZpbGVTeXN0ZW1JZDogZmlsZVN5c3RlbT8uRmlsZVN5c3RlbUlkLFxuICAgICAgICAgIGZpbGVTeXN0ZW1UeXBlOiBmaWxlU3lzdGVtPy5GaWxlU3lzdGVtVHlwZSxcbiAgICAgICAgICBsaWZlY3ljbGU6IGZpbGVTeXN0ZW0/LkxpZmVjeWNsZSxcbiAgICAgICAgICBzdG9yYWdlQ2FwYWNpdHk6IGZpbGVTeXN0ZW0/LlN0b3JhZ2VDYXBhY2l0eVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5o6l57aa44Oh44OI44Oq44Kv44K544KSQ2xvdWRXYXRjaOOBq+mAgeS/oVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzZW5kQ29ubmVjdGlvbk1ldHJpY3MoXG4gICAgY29ubmVjdGVkQ291bnQ6IG51bWJlcixcbiAgICBmYWlsZWRDb3VudDogbnVtYmVyLFxuICAgIHJlc3BvbnNlVGltZTogbnVtYmVyXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjbGllbnQgPSB0aGlzLmNsaWVudHMuZ2V0KCdjbG91ZHdhdGNoJykgYXMgQ2xvdWRXYXRjaENsaWVudDtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgUHV0TWV0cmljRGF0YUNvbW1hbmQoe1xuICAgICAgICBOYW1lc3BhY2U6ICdQcm9kdWN0aW9uVGVzdGluZy9Db25uZWN0aW9uJyxcbiAgICAgICAgTWV0cmljRGF0YTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIE1ldHJpY05hbWU6ICdDb25uZWN0ZWRTZXJ2aWNlcycsXG4gICAgICAgICAgICBWYWx1ZTogY29ubmVjdGVkQ291bnQsXG4gICAgICAgICAgICBVbml0OiAnQ291bnQnLFxuICAgICAgICAgICAgVGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBNZXRyaWNOYW1lOiAnRmFpbGVkU2VydmljZXMnLFxuICAgICAgICAgICAgVmFsdWU6IGZhaWxlZENvdW50LFxuICAgICAgICAgICAgVW5pdDogJ0NvdW50JyxcbiAgICAgICAgICAgIFRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgTWV0cmljTmFtZTogJ0Nvbm5lY3Rpb25UZXN0UmVzcG9uc2VUaW1lJyxcbiAgICAgICAgICAgIFZhbHVlOiByZXNwb25zZVRpbWUsXG4gICAgICAgICAgICBVbml0OiAnTWlsbGlzZWNvbmRzJyxcbiAgICAgICAgICAgIFRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IGNsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgY29uc29sZS5sb2coJ/Cfk4og5o6l57aa44Oh44OI44Oq44Kv44K544KSQ2xvdWRXYXRjaOOBq+mAgeS/oeOBl+OBvuOBl+OBnycpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyBDbG91ZFdhdGNo44Oh44OI44Oq44Kv44K56YCB5L+h44Gr5aSx5pWXOicsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog57eK5oCl5YGc5q2i44Gu6KaB5rGCXG4gICAqL1xuICByZXF1ZXN0RW1lcmdlbmN5U3RvcChyZWFzb246IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnNvbGUud2Fybihg8J+aqCDnt4rmgKXlgZzmraLjgYzopoHmsYLjgZXjgozjgb7jgZfjgZ86ICR7cmVhc29ufWApO1xuICAgIHRoaXMuZW1lcmdlbmN5U3RvcFJlcXVlc3RlZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICog57eK5oCl5YGc5q2i54q25oWL44Gu44Oq44K744OD44OIXG4gICAqL1xuICByZXNldEVtZXJnZW5jeVN0b3AoKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coJ/CflIQg57eK5oCl5YGc5q2i54q25oWL44KS44Oq44K744OD44OI44GX44G+44GX44GfJyk7XG4gICAgdGhpcy5lbWVyZ2VuY3lTdG9wUmVxdWVzdGVkID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICog54++5Zyo44Gu5o6l57aa54q25oWL44KS5Y+W5b6XXG4gICAqL1xuICBnZXRDb25uZWN0aW9uU3RhdHVzKCk6IE1hcDxzdHJpbmcsIENvbm5lY3Rpb25TdGF0dXM+IHtcbiAgICByZXR1cm4gbmV3IE1hcCh0aGlzLmNvbm5lY3Rpb25TdGF0dXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIOeJueWumuOBruOCteODvOODk+OCueOBruaOpee2mueKtuaFi+OCkuWPluW+l1xuICAgKi9cbiAgZ2V0U2VydmljZUNvbm5lY3Rpb25TdGF0dXMoc2VydmljZU5hbWU6IHN0cmluZyk6IENvbm5lY3Rpb25TdGF0dXMgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb25TdGF0dXMuZ2V0KHNlcnZpY2VOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDmjqXntprjga7lgaXlhajmgKfjg4Hjgqfjg4Pjgq9cbiAgICovXG4gIGFzeW5jIHBlcmZvcm1IZWFsdGhDaGVjaygpOiBQcm9taXNlPHtcbiAgICBoZWFsdGh5OiBib29sZWFuO1xuICAgIGlzc3Vlczogc3RyaW5nW107XG4gICAgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXTtcbiAgfT4ge1xuICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDmnIDov5Hjga7mjqXntprjg4bjgrnjg4jntZDmnpzjgpLjg4Hjgqfjg4Pjgq9cbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IG1heEFnZSA9IDUgKiA2MCAqIDEwMDA7IC8vIDXliIZcblxuICAgIGZvciAoY29uc3QgW3NlcnZpY2UsIHN0YXR1c10gb2YgdGhpcy5jb25uZWN0aW9uU3RhdHVzKSB7XG4gICAgICBjb25zdCBhZ2UgPSBub3cgLSBzdGF0dXMubGFzdENoZWNrZWQuZ2V0VGltZSgpO1xuICAgICAgXG4gICAgICBpZiAoYWdlID4gbWF4QWdlKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGAke3NlcnZpY2V9IOOBruaOpee2mueKtuaFi+OBjOWPpOOBmeOBjuOBvuOBmSAoJHtNYXRoLnJvdW5kKGFnZSAvIDEwMDApfeenkuWJjSlgKTtcbiAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goYCR7c2VydmljZX0g44Gu5o6l57aa44OG44K544OI44KS5YaN5a6f6KGM44GX44Gm44GP44Gg44GV44GEYCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghc3RhdHVzLmNvbm5lY3RlZCkge1xuICAgICAgICBpc3N1ZXMucHVzaChgJHtzZXJ2aWNlfSDjgbjjga7mjqXntprjgavlpLHmlZfjgZfjgabjgYTjgb7jgZk6ICR7c3RhdHVzLmVycm9yfWApO1xuICAgICAgICByZWNvbW1lbmRhdGlvbnMucHVzaChgJHtzZXJ2aWNlfSDjga7oqK3lrprjgajmqKnpmZDjgpLnorroqo3jgZfjgabjgY/jgaDjgZXjgYRgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXR1cy5yZXNwb25zZVRpbWUgPiAxMDAwMCkge1xuICAgICAgICBpc3N1ZXMucHVzaChgJHtzZXJ2aWNlfSDjga7lv5znrZTmmYLplpPjgYzpgYXjgZnjgY7jgb7jgZkgKCR7c3RhdHVzLnJlc3BvbnNlVGltZX1tcylgKTtcbiAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goYCR7c2VydmljZX0g44Gu44OR44OV44Kp44O844Oe44Oz44K544KS56K66KqN44GX44Gm44GP44Gg44GV44GEYCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaGVhbHRoeSA9IGlzc3Vlcy5sZW5ndGggPT09IDA7XG5cbiAgICBjb25zb2xlLmxvZyhg8J+PpSDlgaXlhajmgKfjg4Hjgqfjg4Pjgq/lrozkuoY6ICR7aGVhbHRoeSA/ICfmraPluLgnIDogJ+WVj+mhjOOBguOCiid9ICjllY/poYwgJHtpc3N1ZXMubGVuZ3RofeS7tilgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBoZWFsdGh5LFxuICAgICAgaXNzdWVzLFxuICAgICAgcmVjb21tZW5kYXRpb25zXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kg5o6l57aa566h55CG44K344K544OG44Og44KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgXG4gICAgLy8g44Kv44Op44Kk44Ki44Oz44OI44Gu5YiH5patXG4gICAgdGhpcy5jbGllbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5jb25uZWN0aW9uU3RhdHVzLmNsZWFyKCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ+KchSDjgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcm9kdWN0aW9uQ29ubmVjdGlvbk1hbmFnZXI7Il19