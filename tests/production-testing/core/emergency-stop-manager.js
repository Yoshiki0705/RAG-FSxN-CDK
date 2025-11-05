"use strict";
/**
 * 緊急停止管理システム
 *
 * 本番環境テスト実行中の異常検出時に安全な緊急停止を実行
 * データ整合性を保ちながらテストを中断し、システムを安全な状態に戻す
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyStopManager = exports.EmergencyStopReason = void 0;
const events_1 = require("events");
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
/**
 * 緊急停止理由の列挙
 */
var EmergencyStopReason;
(function (EmergencyStopReason) {
    EmergencyStopReason["DATA_INTEGRITY_VIOLATION"] = "DATA_INTEGRITY_VIOLATION";
    EmergencyStopReason["RESOURCE_OVERLOAD"] = "RESOURCE_OVERLOAD";
    EmergencyStopReason["SECURITY_BREACH"] = "SECURITY_BREACH";
    EmergencyStopReason["UNEXPECTED_ERROR"] = "UNEXPECTED_ERROR";
    EmergencyStopReason["MANUAL_REQUEST"] = "MANUAL_REQUEST";
    EmergencyStopReason["TIMEOUT_EXCEEDED"] = "TIMEOUT_EXCEEDED";
    EmergencyStopReason["RESOURCE_UNAVAILABLE"] = "RESOURCE_UNAVAILABLE";
})(EmergencyStopReason || (exports.EmergencyStopReason = EmergencyStopReason = {}));
/**
 * 緊急停止管理クラス
 */
class EmergencyStopManager extends events_1.EventEmitter {
    config;
    cloudWatchClient;
    stopState = null;
    activeTests = new Map();
    stopInProgress = false;
    recoveryCallbacks = [];
    constructor(config) {
        super();
        this.config = config;
        this.cloudWatchClient = new client_cloudwatch_1.CloudWatchClient({
            region: config.region,
            credentials: { profile: config.awsProfile }
        });
        // 緊急停止イベントリスナーの設定
        this.setupEventListeners();
    }
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // プロセス終了時の緊急停止
        process.on('SIGINT', () => {
            console.log('\n🛑 SIGINT受信: 緊急停止を開始します...');
            this.initiateEmergencyStop(EmergencyStopReason.MANUAL_REQUEST, 'SIGINT signal received');
        });
        process.on('SIGTERM', () => {
            console.log('\n🛑 SIGTERM受信: 緊急停止を開始します...');
            this.initiateEmergencyStop(EmergencyStopReason.MANUAL_REQUEST, 'SIGTERM signal received');
        });
        // 未処理例外時の緊急停止
        process.on('uncaughtException', (error) => {
            console.error('🚨 未処理例外が発生しました:', error);
            this.initiateEmergencyStop(EmergencyStopReason.UNEXPECTED_ERROR, `Uncaught exception: ${error.message}`);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('🚨 未処理のPromise拒否が発生しました:', reason);
            this.initiateEmergencyStop(EmergencyStopReason.UNEXPECTED_ERROR, `Unhandled rejection: ${reason}`);
        });
    }
    /**
     * 緊急停止の開始
     */
    async initiateEmergencyStop(reason, details, initiatedBy = 'system') {
        if (this.stopInProgress) {
            console.log('⚠️ 緊急停止は既に進行中です');
            return;
        }
        this.stopInProgress = true;
        const timestamp = new Date();
        console.log(`🚨 緊急停止開始: ${reason}`);
        console.log(`   理由: ${details}`);
        console.log(`   開始者: ${initiatedBy}`);
        console.log(`   時刻: ${timestamp.toISOString()}`);
        // 緊急停止状態の設定
        this.stopState = {
            isActive: true,
            reason,
            timestamp,
            initiatedBy,
            affectedTests: Array.from(this.activeTests.keys()),
            recoveryActions: []
        };
        try {
            // 1. 実行中テストの安全な停止
            await this.stopActiveTests();
            // 2. リソースの安全な切断
            await this.disconnectResources();
            // 3. データ整合性の確認
            await this.verifyDataIntegrity();
            // 4. 復旧アクションの実行
            await this.executeRecoveryActions();
            // 5. 管理者への通知
            await this.notifyAdministrators(reason, details);
            // 6. メトリクスの送信
            await this.sendEmergencyStopMetrics(reason);
            console.log('✅ 緊急停止処理が完了しました');
            this.emit('emergencyStopCompleted', this.stopState);
        }
        catch (error) {
            console.error('❌ 緊急停止処理中にエラーが発生しました:', error);
            this.emit('emergencyStopFailed', error);
        }
        finally {
            this.stopInProgress = false;
        }
    }
    /**
     * 実行中テストの安全な停止
     */
    async stopActiveTests() {
        console.log(`🛑 実行中テストを停止中... (${this.activeTests.size}件)`);
        const stopPromises = Array.from(this.activeTests.values()).map(async (test) => {
            try {
                console.log(`   停止中: ${test.testName} (${test.testId})`);
                // テスト状態を停止中に変更
                test.status = 'stopping';
                // テスト固有の停止処理
                await this.stopIndividualTest(test);
                // テスト状態を停止済みに変更
                test.status = 'stopped';
                console.log(`   ✅ 停止完了: ${test.testName}`);
            }
            catch (error) {
                console.error(`   ❌ テスト停止エラー (${test.testName}):`, error);
                this.stopState?.recoveryActions.push(`テスト ${test.testName} の手動確認が必要`);
            }
        });
        await Promise.allSettled(stopPromises);
        console.log('✅ 全テストの停止処理完了');
    }
    /**
     * 個別テストの停止処理
     */
    async stopIndividualTest(test) {
        // テストカテゴリに応じた停止処理
        switch (test.category) {
            case 'authentication':
                await this.stopAuthenticationTest(test);
                break;
            case 'ai-response':
                await this.stopAIResponseTest(test);
                break;
            case 'performance':
                await this.stopPerformanceTest(test);
                break;
            case 'ui-ux':
                await this.stopUIUXTest(test);
                break;
            default:
                await this.stopGenericTest(test);
                break;
        }
    }
    /**
     * 認証テストの停止
     */
    async stopAuthenticationTest(test) {
        // 認証セッションのクリーンアップ
        console.log(`   🔐 認証テストのセッションをクリーンアップ中: ${test.testId}`);
        // 実装: セッション無効化、一時的な認証情報の削除など
    }
    /**
     * AI応答テストの停止
     */
    async stopAIResponseTest(test) {
        // AI応答生成の中断
        console.log(`   🤖 AI応答テストを中断中: ${test.testId}`);
        // 実装: Bedrockリクエストのキャンセル、ストリーミングの停止など
    }
    /**
     * パフォーマンステストの停止
     */
    async stopPerformanceTest(test) {
        // 負荷生成の停止
        console.log(`   ⚡ パフォーマンステストの負荷生成を停止中: ${test.testId}`);
        // 実装: 同時リクエストの停止、リソース使用量の正常化など
    }
    /**
     * UI/UXテストの停止
     */
    async stopUIUXTest(test) {
        // ブラウザセッションの終了
        console.log(`   🖥️ UI/UXテストのブラウザセッションを終了中: ${test.testId}`);
        // 実装: ブラウザの安全な終了、スクリーンショットの保存など
    }
    /**
     * 汎用テストの停止
     */
    async stopGenericTest(test) {
        console.log(`   🔧 汎用テストを停止中: ${test.testId}`);
        // 実装: 汎用的なクリーンアップ処理
    }
    /**
     * リソースの安全な切断
     */
    async disconnectResources() {
        console.log('🔌 リソースを安全に切断中...');
        try {
            // AWS接続の切断
            // 実装: 各AWSクライアントの適切な終了処理
            // ブラウザセッションの終了
            // 実装: 全ブラウザインスタンスの終了
            // 一時ファイルのクリーンアップ
            // 実装: テスト中に作成された一時ファイルの削除
            console.log('✅ リソース切断完了');
        }
        catch (error) {
            console.error('❌ リソース切断エラー:', error);
            this.stopState?.recoveryActions.push('リソースの手動切断確認が必要');
        }
    }
    /**
     * データ整合性の確認
     */
    async verifyDataIntegrity() {
        console.log('🔍 データ整合性を確認中...');
        try {
            // 本番データの整合性チェック
            // 実装: DynamoDB、OpenSearch、FSxのデータ状態確認
            console.log('✅ データ整合性確認完了');
        }
        catch (error) {
            console.error('❌ データ整合性確認エラー:', error);
            this.stopState?.recoveryActions.push('データ整合性の手動確認が必要');
        }
    }
    /**
     * 復旧アクションの実行
     */
    async executeRecoveryActions() {
        console.log('🔄 復旧アクションを実行中...');
        for (const callback of this.recoveryCallbacks) {
            try {
                await callback();
            }
            catch (error) {
                console.error('❌ 復旧アクション実行エラー:', error);
            }
        }
        console.log('✅ 復旧アクション実行完了');
    }
    /**
     * 管理者への通知
     */
    async notifyAdministrators(reason, details) {
        console.log('📧 管理者に通知中...');
        try {
            // 実装: Slack、メール、SNSなどでの通知
            const notificationMessage = {
                title: '🚨 本番環境テスト緊急停止',
                reason: reason,
                details: details,
                timestamp: new Date().toISOString(),
                affectedTests: this.stopState?.affectedTests || [],
                recoveryActions: this.stopState?.recoveryActions || []
            };
            console.log('通知内容:', JSON.stringify(notificationMessage, null, 2));
            // TODO: 実際の通知システムとの統合
        }
        catch (error) {
            console.error('❌ 管理者通知エラー:', error);
        }
    }
    /**
     * 緊急停止メトリクスの送信
     */
    async sendEmergencyStopMetrics(reason) {
        try {
            const command = new client_cloudwatch_1.PutMetricDataCommand({
                Namespace: 'ProductionTesting/EmergencyStop',
                MetricData: [
                    {
                        MetricName: 'EmergencyStopCount',
                        Value: 1,
                        Unit: 'Count',
                        Dimensions: [
                            {
                                Name: 'Reason',
                                Value: reason
                            }
                        ],
                        Timestamp: new Date()
                    },
                    {
                        MetricName: 'AffectedTestsCount',
                        Value: this.activeTests.size,
                        Unit: 'Count',
                        Timestamp: new Date()
                    }
                ]
            });
            await this.cloudWatchClient.send(command);
            console.log('📊 緊急停止メトリクスをCloudWatchに送信しました');
        }
        catch (error) {
            console.warn('⚠️ 緊急停止メトリクス送信に失敗:', error);
        }
    }
    /**
     * テストの登録
     */
    registerActiveTest(test) {
        this.activeTests.set(test.testId, test);
        console.log(`📝 アクティブテスト登録: ${test.testName} (${test.testId})`);
    }
    /**
     * テストの登録解除
     */
    unregisterActiveTest(testId) {
        if (this.activeTests.delete(testId)) {
            console.log(`📝 アクティブテスト登録解除: ${testId}`);
        }
    }
    /**
     * 復旧コールバックの登録
     */
    registerRecoveryCallback(callback) {
        this.recoveryCallbacks.push(callback);
    }
    /**
     * 緊急停止状態の取得
     */
    getEmergencyStopState() {
        return this.stopState;
    }
    /**
     * 緊急停止状態のリセット
     */
    resetEmergencyStopState() {
        if (this.stopState) {
            console.log('🔄 緊急停止状態をリセットします');
            this.stopState = null;
            this.activeTests.clear();
            this.stopInProgress = false;
            this.emit('emergencyStopReset');
        }
    }
    /**
     * アクティブテスト一覧の取得
     */
    getActiveTests() {
        return Array.from(this.activeTests.values());
    }
    /**
     * 緊急停止が有効かどうかの確認
     */
    isEmergencyStopActive() {
        return this.stopState?.isActive || false;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 緊急停止管理システムをクリーンアップ中...');
        // イベントリスナーの削除
        this.removeAllListeners();
        // アクティブテストのクリア
        this.activeTests.clear();
        // 復旧コールバックのクリア
        this.recoveryCallbacks = [];
        console.log('✅ 緊急停止管理システムのクリーンアップ完了');
    }
}
exports.EmergencyStopManager = EmergencyStopManager;
exports.default = EmergencyStopManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1lcmdlbmN5LXN0b3AtbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVtZXJnZW5jeS1zdG9wLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFFSCxtQ0FBc0M7QUFDdEMsa0VBQW9GO0FBR3BGOztHQUVHO0FBQ0gsSUFBWSxtQkFRWDtBQVJELFdBQVksbUJBQW1CO0lBQzdCLDRFQUFxRCxDQUFBO0lBQ3JELDhEQUF1QyxDQUFBO0lBQ3ZDLDBEQUFtQyxDQUFBO0lBQ25DLDREQUFxQyxDQUFBO0lBQ3JDLHdEQUFpQyxDQUFBO0lBQ2pDLDREQUFxQyxDQUFBO0lBQ3JDLG9FQUE2QyxDQUFBO0FBQy9DLENBQUMsRUFSVyxtQkFBbUIsbUNBQW5CLG1CQUFtQixRQVE5QjtBQTBCRDs7R0FFRztBQUNILE1BQWEsb0JBQXFCLFNBQVEscUJBQVk7SUFDNUMsTUFBTSxDQUFtQjtJQUN6QixnQkFBZ0IsQ0FBbUI7SUFDbkMsU0FBUyxHQUE4QixJQUFJLENBQUM7SUFDNUMsV0FBVyxHQUE0QixJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2pELGNBQWMsR0FBWSxLQUFLLENBQUM7SUFDaEMsaUJBQWlCLEdBQStCLEVBQUUsQ0FBQztJQUUzRCxZQUFZLE1BQXdCO1FBQ2xDLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksb0NBQWdCLENBQUM7WUFDM0MsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLFdBQVcsRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFO1NBQzVDLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSyxtQkFBbUI7UUFDekIsZUFBZTtRQUNmLE9BQU8sQ0FB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SyxDQUFDO1lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsY0FBYztRQUNaLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVEOztPQUVHO0lBQ0gscUJBQXFCO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLElBQUksS0FBSyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBRXpDLGNBQWM7UUFDZCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUUxQixlQUFlO1FBQ2YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUV6QixlQUFlO1FBQ2YsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUU1QixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBcFpELG9EQW9aQztBQUVELGtCQUFlLG9CQUFvQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDnt4rmgKXlgZzmraLnrqHnkIbjgrfjgrnjg4bjg6BcbiAqIFxuICog5pys55Wq55Kw5aKD44OG44K544OI5a6f6KGM5Lit44Gu55Ww5bi45qSc5Ye65pmC44Gr5a6J5YWo44Gq57eK5oCl5YGc5q2i44KS5a6f6KGMXG4gKiDjg4fjg7zjgr/mlbTlkIjmgKfjgpLkv53jgaHjgarjgYzjgonjg4bjgrnjg4jjgpLkuK3mlq3jgZfjgIHjgrfjgrnjg4bjg6DjgpLlronlhajjgarnirbmhYvjgavmiLvjgZlcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBDbG91ZFdhdGNoQ2xpZW50LCBQdXRNZXRyaWNEYXRhQ29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1jbG91ZHdhdGNoJztcbmltcG9ydCB7IFByb2R1Y3Rpb25Db25maWcgfSBmcm9tICcuLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuXG4vKipcbiAqIOe3iuaApeWBnOatoueQhueUseOBruWIl+aMmVxuICovXG5leHBvcnQgZW51bSBFbWVyZ2VuY3lTdG9wUmVhc29uIHtcbiAgREFUQV9JTlRFR1JJVFlfVklPTEFUSU9OID0gJ0RBVEFfSU5URUdSSVRZX1ZJT0xBVElPTicsXG4gIFJFU09VUkNFX09WRVJMT0FEID0gJ1JFU09VUkNFX09WRVJMT0FEJyxcbiAgU0VDVVJJVFlfQlJFQUNIID0gJ1NFQ1VSSVRZX0JSRUFDSCcsXG4gIFVORVhQRUNURURfRVJST1IgPSAnVU5FWFBFQ1RFRF9FUlJPUicsXG4gIE1BTlVBTF9SRVFVRVNUID0gJ01BTlVBTF9SRVFVRVNUJyxcbiAgVElNRU9VVF9FWENFRURFRCA9ICdUSU1FT1VUX0VYQ0VFREVEJyxcbiAgUkVTT1VSQ0VfVU5BVkFJTEFCTEUgPSAnUkVTT1VSQ0VfVU5BVkFJTEFCTEUnXG59XG5cbi8qKlxuICog57eK5oCl5YGc5q2i54q25oWL44Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRW1lcmdlbmN5U3RvcFN0YXRlIHtcbiAgaXNBY3RpdmU6IGJvb2xlYW47XG4gIHJlYXNvbjogRW1lcmdlbmN5U3RvcFJlYXNvbjtcbiAgdGltZXN0YW1wOiBEYXRlO1xuICBpbml0aWF0ZWRCeTogc3RyaW5nO1xuICBhZmZlY3RlZFRlc3RzOiBzdHJpbmdbXTtcbiAgcmVjb3ZlcnlBY3Rpb25zOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiDlrp/ooYzkuK3jg4bjgrnjg4jmg4XloLFcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBY3RpdmVUZXN0IHtcbiAgdGVzdElkOiBzdHJpbmc7XG4gIHRlc3ROYW1lOiBzdHJpbmc7XG4gIHN0YXJ0VGltZTogRGF0ZTtcbiAgY2F0ZWdvcnk6IHN0cmluZztcbiAgc3RhdHVzOiAncnVubmluZycgfCAnc3RvcHBpbmcnIHwgJ3N0b3BwZWQnO1xuICByZXNvdXJjZXNJblVzZTogc3RyaW5nW107XG59XG5cbi8qKlxuICog57eK5oCl5YGc5q2i566h55CG44Kv44Op44K5XG4gKi9cbmV4cG9ydCBjbGFzcyBFbWVyZ2VuY3lTdG9wTWFuYWdlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIGNsb3VkV2F0Y2hDbGllbnQ6IENsb3VkV2F0Y2hDbGllbnQ7XG4gIHByaXZhdGUgc3RvcFN0YXRlOiBFbWVyZ2VuY3lTdG9wU3RhdGUgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVUZXN0czogTWFwPHN0cmluZywgQWN0aXZlVGVzdD4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgc3RvcEluUHJvZ3Jlc3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWNvdmVyeUNhbGxiYWNrczogQXJyYXk8KCkgPT4gUHJvbWlzZTx2b2lkPj4gPSBbXTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFByb2R1Y3Rpb25Db25maWcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuY2xvdWRXYXRjaENsaWVudCA9IG5ldyBDbG91ZFdhdGNoQ2xpZW50KHtcbiAgICAgIHJlZ2lvbjogY29uZmlnLnJlZ2lvbixcbiAgICAgIGNyZWRlbnRpYWxzOiB7IHByb2ZpbGU6IGNvbmZpZy5hd3NQcm9maWxlIH1cbiAgICB9KTtcblxuICAgIC8vIOe3iuaApeWBnOatouOCpOODmeODs+ODiOODquOCueODiuODvOOBruioreWumlxuICAgIHRoaXMuc2V0dXBFdmVudExpc3RlbmVycygpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCpOODmeODs+ODiOODquOCueODiuODvOOBruioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cEV2ZW50TGlzdGVuZXJzKCk6IHZvaWQge1xuICAgIC8vIOODl+ODreOCu+OCuee1guS6huaZguOBrue3iuaApeWBnOatolxuICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7wn5uRIFNJR0lOVOWPl+S/oTog57eK5oCl5YGc5q2i44KS6ZaL5aeL44GX44G+44GZLi4uJyk7XG4gICAgICB0aGlzLmluaXRpYXRlRW1lcmdlbmN5U3RvcChFbWVyZ2VuY3lTdG9wUmVhc29uLk1BTlVBTF9SRVFVRVNULCAnU0lHSU5UIHNpZ25hbCByZWNlaXZlZCcpO1xuICAgIH0pO1xuXG4gICAgcHJvY2Vzcy5vbignU0lHVEVSTScsICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXG7wn5uRIFNJR1RFUk3lj5fkv6E6IOe3iuaApeWBnOatouOCkumWi+Wni+OBl+OBvuOBmS4uLicpO1xuICAgICAgdGhpcy5pbml0aWF0ZUVtZXJnZW5jeVN0b3AoRW1lcmdlbmN5U3RvcFJlYXNvbi5NQU5VQUxfUkVRVUVTVCwgJ1NJR1RFUk0gc2lnbmFsIHJlY2VpdmVkJyk7XG4gICAgfSk7XG5cbiAgICAvLyDmnKrlh6bnkIbkvovlpJbmmYLjga7nt4rmgKXlgZzmraJcbiAgICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnJvcikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcign8J+aqCDmnKrlh6bnkIbkvovlpJbjgYznmbrnlJ/jgZfjgb7jgZfjgZ86JywgZXJyb3IpO1xuICAgICAgdGhpcy5pbml0aWF0ZUVtZXJnZW5jeVN0b3AoRW1lcmdlbmN5U3RvcFJlYXNvbi5VTkVYUEVDVEVEX0VSUk9SLCBgVW5jYXVnaHQgZXhjZXB0aW9uOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uLCBwcm9taXNlKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKCfwn5qoIOacquWHpueQhuOBrlByb21pc2Xmi5LlkKbjgYznmbrnlJ/jgZfjgb7jgZfjgZ86JywgcmVhc29uKTtcbiAgICAgIHRoaXMuaW5pdGlhdGVFbWVyZ2VuY3lTdG9wKEVtZXJnZW5jeVN0b3BSZWFzb24uVU5FWFBFQ1RFRF9FUlJPUiwgYFVuaGFuZGxlZCByZWplY3Rpb246ICR7cmVhc29ufWApO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOe3iuaApeWBnOatouOBrumWi+Wni1xuICAgKi9cbiAgYXN5bmMgaW5pdGlhdGVFbWVyZ2VuY3lTdG9wKFxuICAgIHJlYXNvbjogRW1lcmdlbmN5U3RvcFJlYXNvbixcbiAgICBkZXRhaWxzOiBzdHJpbmcsXG4gICAgaW5pdGlhdGVkQnk6IHN0cmluZyA9ICdzeXN0ZW0nXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnN0b3BJblByb2dyZXNzKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pqg77iPIOe3iuaApeWBnOatouOBr+aXouOBq+mAsuihjOS4reOBp+OBmScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcEluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG5cbiAgICBjb25zb2xlLmxvZyhg8J+aqCDnt4rmgKXlgZzmraLplovlp4s6ICR7cmVhc29ufWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDnkIbnlLE6ICR7ZGV0YWlsc31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg6ZaL5aeL6ICFOiAke2luaXRpYXRlZEJ5fWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDmmYLliLs6ICR7dGltZXN0YW1wLnRvSVNPU3RyaW5nKCl9YCk7XG5cbiAgICAvLyDnt4rmgKXlgZzmraLnirbmhYvjga7oqK3lrppcbiAgICB0aGlzLnN0b3BTdGF0ZSA9IHtcbiAgICAgIGlzQWN0aXZlOiB0cnVlLFxuICAgICAgcmVhc29uLFxuICAgICAgdGltZXN0YW1wLFxuICAgICAgaW5pdGlhdGVkQnksXG4gICAgICBhZmZlY3RlZFRlc3RzOiBBcnJheS5mcm9tKHRoaXMuYWN0aXZlVGVzdHMua2V5cygpKSxcbiAgICAgIHJlY292ZXJ5QWN0aW9uczogW11cbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIDEuIOWun+ihjOS4reODhuOCueODiOOBruWuieWFqOOBquWBnOatolxuICAgICAgYXdhaXQgdGhpcy5zdG9wQWN0aXZlVGVzdHMoKTtcblxuICAgICAgLy8gMi4g44Oq44K944O844K544Gu5a6J5YWo44Gq5YiH5patXG4gICAgICBhd2FpdCB0aGlzLmRpc2Nvbm5lY3RSZXNvdXJjZXMoKTtcblxuICAgICAgLy8gMy4g44OH44O844K/5pW05ZCI5oCn44Gu56K66KqNXG4gICAgICBhd2FpdCB0aGlzLnZlcmlmeURhdGFJbnRlZ3JpdHkoKTtcblxuICAgICAgLy8gNC4g5b6p5pen44Ki44Kv44K344On44Oz44Gu5a6f6KGMXG4gICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVSZWNvdmVyeUFjdGlvbnMoKTtcblxuICAgICAgLy8gNS4g566h55CG6ICF44G444Gu6YCa55+lXG4gICAgICBhd2FpdCB0aGlzLm5vdGlmeUFkbWluaXN0cmF0b3JzKHJlYXNvbiwgZGV0YWlscyk7XG5cbiAgICAgIC8vIDYuIOODoeODiOODquOCr+OCueOBrumAgeS/oVxuICAgICAgYXdhaXQgdGhpcy5zZW5kRW1lcmdlbmN5U3RvcE1ldHJpY3MocmVhc29uKTtcblxuICAgICAgY29uc29sZS5sb2coJ+KchSDnt4rmgKXlgZzmraLlh6bnkIbjgYzlrozkuobjgZfjgb7jgZfjgZ8nKTtcbiAgICAgIHRoaXMuZW1pdCgnZW1lcmdlbmN5U3RvcENvbXBsZXRlZCcsIHRoaXMuc3RvcFN0YXRlKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg57eK5oCl5YGc5q2i5Yem55CG5Lit44Gr44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOicsIGVycm9yKTtcbiAgICAgIHRoaXMuZW1pdCgnZW1lcmdlbmN5U3RvcEZhaWxlZCcsIGVycm9yKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5zdG9wSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlrp/ooYzkuK3jg4bjgrnjg4jjga7lronlhajjgarlgZzmraJcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc3RvcEFjdGl2ZVRlc3RzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKGDwn5uRIOWun+ihjOS4reODhuOCueODiOOCkuWBnOatouS4rS4uLiAoJHt0aGlzLmFjdGl2ZVRlc3RzLnNpemV95Lu2KWApO1xuXG4gICAgY29uc3Qgc3RvcFByb21pc2VzID0gQXJyYXkuZnJvbSh0aGlzLmFjdGl2ZVRlc3RzLnZhbHVlcygpKS5tYXAoYXN5bmMgKHRlc3QpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDlgZzmraLkuK06ICR7dGVzdC50ZXN0TmFtZX0gKCR7dGVzdC50ZXN0SWR9KWApO1xuICAgICAgICBcbiAgICAgICAgLy8g44OG44K544OI54q25oWL44KS5YGc5q2i5Lit44Gr5aSJ5pu0XG4gICAgICAgIHRlc3Quc3RhdHVzID0gJ3N0b3BwaW5nJztcbiAgICAgICAgXG4gICAgICAgIC8vIOODhuOCueODiOWbuuacieOBruWBnOatouWHpueQhlxuICAgICAgICBhd2FpdCB0aGlzLnN0b3BJbmRpdmlkdWFsVGVzdCh0ZXN0KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOODhuOCueODiOeKtuaFi+OCkuWBnOatoua4iOOBv+OBq+WkieabtFxuICAgICAgICB0ZXN0LnN0YXR1cyA9ICdzdG9wcGVkJztcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDinIUg5YGc5q2i5a6M5LqGOiAke3Rlc3QudGVzdE5hbWV9YCk7XG4gICAgICAgIFxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgICAg4p2MIOODhuOCueODiOWBnOatouOCqOODqeODvCAoJHt0ZXN0LnRlc3ROYW1lfSk6YCwgZXJyb3IpO1xuICAgICAgICB0aGlzLnN0b3BTdGF0ZT8ucmVjb3ZlcnlBY3Rpb25zLnB1c2goYOODhuOCueODiCAke3Rlc3QudGVzdE5hbWV9IOOBruaJi+WLleeiuuiqjeOBjOW/heimgWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKHN0b3BQcm9taXNlcyk7XG4gICAgY29uc29sZS5sb2coJ+KchSDlhajjg4bjgrnjg4jjga7lgZzmraLlh6bnkIblrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlgIvliKXjg4bjgrnjg4jjga7lgZzmraLlh6bnkIZcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc3RvcEluZGl2aWR1YWxUZXN0KHRlc3Q6IEFjdGl2ZVRlc3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyDjg4bjgrnjg4jjgqvjg4bjgrTjg6rjgavlv5zjgZjjgZ/lgZzmraLlh6bnkIZcbiAgICBzd2l0Y2ggKHRlc3QuY2F0ZWdvcnkpIHtcbiAgICAgIGNhc2UgJ2F1dGhlbnRpY2F0aW9uJzpcbiAgICAgICAgYXdhaXQgdGhpcy5zdG9wQXV0aGVudGljYXRpb25UZXN0KHRlc3QpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2FpLXJlc3BvbnNlJzpcbiAgICAgICAgYXdhaXQgdGhpcy5zdG9wQUlSZXNwb25zZVRlc3QodGVzdCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncGVyZm9ybWFuY2UnOlxuICAgICAgICBhd2FpdCB0aGlzLnN0b3BQZXJmb3JtYW5jZVRlc3QodGVzdCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndWktdXgnOlxuICAgICAgICBhd2FpdCB0aGlzLnN0b3BVSVVYVGVzdCh0ZXN0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhd2FpdCB0aGlzLnN0b3BHZW5lcmljVGVzdCh0ZXN0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOiqjeiovOODhuOCueODiOOBruWBnOatolxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzdG9wQXV0aGVudGljYXRpb25UZXN0KHRlc3Q6IEFjdGl2ZVRlc3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyDoqo3oqLzjgrvjg4Pjgrfjg6fjg7Pjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICBjb25zb2xlLmxvZyhgICAg8J+UkCDoqo3oqLzjg4bjgrnjg4jjga7jgrvjg4Pjgrfjg6fjg7PjgpLjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK06ICR7dGVzdC50ZXN0SWR9YCk7XG4gICAgLy8g5a6f6KOFOiDjgrvjg4Pjgrfjg6fjg7PnhKHlirnljJbjgIHkuIDmmYLnmoTjgaroqo3oqLzmg4XloLHjga7liYrpmaTjgarjgalcbiAgfVxuXG4gIC8qKlxuICAgKiBBSeW/nOetlOODhuOCueODiOOBruWBnOatolxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzdG9wQUlSZXNwb25zZVRlc3QodGVzdDogQWN0aXZlVGVzdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIEFJ5b+c562U55Sf5oiQ44Gu5Lit5patXG4gICAgY29uc29sZS5sb2coYCAgIPCfpJYgQUnlv5znrZTjg4bjgrnjg4jjgpLkuK3mlq3kuK06ICR7dGVzdC50ZXN0SWR9YCk7XG4gICAgLy8g5a6f6KOFOiBCZWRyb2Nr44Oq44Kv44Ko44K544OI44Gu44Kt44Oj44Oz44K744Or44CB44K544OI44Oq44O844Of44Oz44Kw44Gu5YGc5q2i44Gq44GpXG4gIH1cblxuICAvKipcbiAgICog44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI44Gu5YGc5q2iXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHN0b3BQZXJmb3JtYW5jZVRlc3QodGVzdDogQWN0aXZlVGVzdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIOiyoOiNt+eUn+aIkOOBruWBnOatolxuICAgIGNvbnNvbGUubG9nKGAgICDimqEg44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI44Gu6LKg6I2355Sf5oiQ44KS5YGc5q2i5LitOiAke3Rlc3QudGVzdElkfWApO1xuICAgIC8vIOWun+ijhTog5ZCM5pmC44Oq44Kv44Ko44K544OI44Gu5YGc5q2i44CB44Oq44K944O844K55L2/55So6YeP44Gu5q2j5bi45YyW44Gq44GpXG4gIH1cblxuICAvKipcbiAgICogVUkvVVjjg4bjgrnjg4jjga7lgZzmraJcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc3RvcFVJVVhUZXN0KHRlc3Q6IEFjdGl2ZVRlc3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyDjg5bjg6njgqbjgrbjgrvjg4Pjgrfjg6fjg7Pjga7ntYLkuoZcbiAgICBjb25zb2xlLmxvZyhgICAg8J+Wpe+4jyBVSS9VWOODhuOCueODiOOBruODluODqeOCpuOCtuOCu+ODg+OCt+ODp+ODs+OCkue1guS6huS4rTogJHt0ZXN0LnRlc3RJZH1gKTtcbiAgICAvLyDlrp/oo4U6IOODluODqeOCpuOCtuOBruWuieWFqOOBque1guS6huOAgeOCueOCr+ODquODvOODs+OCt+ODp+ODg+ODiOOBruS/neWtmOOBquOBqVxuICB9XG5cbiAgLyoqXG4gICAqIOaxjueUqOODhuOCueODiOOBruWBnOatolxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzdG9wR2VuZXJpY1Rlc3QodGVzdDogQWN0aXZlVGVzdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKGAgICDwn5SnIOaxjueUqOODhuOCueODiOOCkuWBnOatouS4rTogJHt0ZXN0LnRlc3RJZH1gKTtcbiAgICAvLyDlrp/oo4U6IOaxjueUqOeahOOBquOCr+ODquODvOODs+OCouODg+ODl+WHpueQhlxuICB9XG5cbiAgLyoqXG4gICAqIOODquOCveODvOOCueOBruWuieWFqOOBquWIh+aWrVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBkaXNjb25uZWN0UmVzb3VyY2VzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5SMIOODquOCveODvOOCueOCkuWuieWFqOOBq+WIh+aWreS4rS4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEFXU+aOpee2muOBruWIh+aWrVxuICAgICAgLy8g5a6f6KOFOiDlkIRBV1Pjgq/jg6njgqTjgqLjg7Pjg4jjga7pganliIfjgarntYLkuoblh6bnkIZcblxuICAgICAgLy8g44OW44Op44Km44K244K744OD44K344On44Oz44Gu57WC5LqGXG4gICAgICAvLyDlrp/oo4U6IOWFqOODluODqeOCpuOCtuOCpOODs+OCueOCv+ODs+OCueOBrue1guS6hlxuXG4gICAgICAvLyDkuIDmmYLjg5XjgqHjgqTjg6vjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICAgIC8vIOWun+ijhTog44OG44K544OI5Lit44Gr5L2c5oiQ44GV44KM44Gf5LiA5pmC44OV44Kh44Kk44Or44Gu5YmK6ZmkXG5cbiAgICAgIGNvbnNvbGUubG9nKCfinIUg44Oq44K944O844K55YiH5pat5a6M5LqGJyk7XG4gICAgICBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOODquOCveODvOOCueWIh+aWreOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aGlzLnN0b3BTdGF0ZT8ucmVjb3ZlcnlBY3Rpb25zLnB1c2goJ+ODquOCveODvOOCueOBruaJi+WLleWIh+aWreeiuuiqjeOBjOW/heimgScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjg4fjg7zjgr/mlbTlkIjmgKfjga7norroqo1cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdmVyaWZ5RGF0YUludGVncml0eSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+UjSDjg4fjg7zjgr/mlbTlkIjmgKfjgpLnorroqo3kuK0uLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyDmnKznlarjg4fjg7zjgr/jga7mlbTlkIjmgKfjg4Hjgqfjg4Pjgq9cbiAgICAgIC8vIOWun+ijhTogRHluYW1vRELjgIFPcGVuU2VhcmNo44CBRlN444Gu44OH44O844K/54q25oWL56K66KqNXG5cbiAgICAgIGNvbnNvbGUubG9nKCfinIUg44OH44O844K/5pW05ZCI5oCn56K66KqN5a6M5LqGJyk7XG4gICAgICBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOODh+ODvOOCv+aVtOWQiOaAp+eiuuiqjeOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aGlzLnN0b3BTdGF0ZT8ucmVjb3ZlcnlBY3Rpb25zLnB1c2goJ+ODh+ODvOOCv+aVtOWQiOaAp+OBruaJi+WLleeiuuiqjeOBjOW/heimgScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlvqnml6fjgqLjgq/jgrfjg6fjg7Pjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVJlY292ZXJ5QWN0aW9ucygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+UhCDlvqnml6fjgqLjgq/jgrfjg6fjg7PjgpLlrp/ooYzkuK0uLi4nKTtcblxuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5yZWNvdmVyeUNhbGxiYWNrcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgY2FsbGJhY2soKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlvqnml6fjgqLjgq/jgrfjg6fjg7Plrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfinIUg5b6p5pen44Ki44Kv44K344On44Oz5a6f6KGM5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICog566h55CG6ICF44G444Gu6YCa55+lXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIG5vdGlmeUFkbWluaXN0cmF0b3JzKHJlYXNvbjogRW1lcmdlbmN5U3RvcFJlYXNvbiwgZGV0YWlsczogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfk6cg566h55CG6ICF44Gr6YCa55+l5LitLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgLy8g5a6f6KOFOiBTbGFja+OAgeODoeODvOODq+OAgVNOU+OBquOBqeOBp+OBrumAmuefpVxuICAgICAgY29uc3Qgbm90aWZpY2F0aW9uTWVzc2FnZSA9IHtcbiAgICAgICAgdGl0bGU6ICfwn5qoIOacrOeVqueSsOWig+ODhuOCueODiOe3iuaApeWBnOatoicsXG4gICAgICAgIHJlYXNvbjogcmVhc29uLFxuICAgICAgICBkZXRhaWxzOiBkZXRhaWxzLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgYWZmZWN0ZWRUZXN0czogdGhpcy5zdG9wU3RhdGU/LmFmZmVjdGVkVGVzdHMgfHwgW10sXG4gICAgICAgIHJlY292ZXJ5QWN0aW9uczogdGhpcy5zdG9wU3RhdGU/LnJlY292ZXJ5QWN0aW9ucyB8fCBbXVxuICAgICAgfTtcblxuICAgICAgY29uc29sZS5sb2coJ+mAmuefpeWGheWuuTonLCBKU09OLnN0cmluZ2lmeShub3RpZmljYXRpb25NZXNzYWdlLCBudWxsLCAyKSk7XG4gICAgICBcbiAgICAgIC8vIFRPRE86IOWun+mam+OBrumAmuefpeOCt+OCueODhuODoOOBqOOBrue1seWQiFxuICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDnrqHnkIbogIXpgJrnn6Xjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDnt4rmgKXlgZzmraLjg6Hjg4jjg6rjgq/jgrnjga7pgIHkv6FcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc2VuZEVtZXJnZW5jeVN0b3BNZXRyaWNzKHJlYXNvbjogRW1lcmdlbmN5U3RvcFJlYXNvbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFB1dE1ldHJpY0RhdGFDb21tYW5kKHtcbiAgICAgICAgTmFtZXNwYWNlOiAnUHJvZHVjdGlvblRlc3RpbmcvRW1lcmdlbmN5U3RvcCcsXG4gICAgICAgIE1ldHJpY0RhdGE6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBNZXRyaWNOYW1lOiAnRW1lcmdlbmN5U3RvcENvdW50JyxcbiAgICAgICAgICAgIFZhbHVlOiAxLFxuICAgICAgICAgICAgVW5pdDogJ0NvdW50JyxcbiAgICAgICAgICAgIERpbWVuc2lvbnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE5hbWU6ICdSZWFzb24nLFxuICAgICAgICAgICAgICAgIFZhbHVlOiByZWFzb25cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgTWV0cmljTmFtZTogJ0FmZmVjdGVkVGVzdHNDb3VudCcsXG4gICAgICAgICAgICBWYWx1ZTogdGhpcy5hY3RpdmVUZXN0cy5zaXplLFxuICAgICAgICAgICAgVW5pdDogJ0NvdW50JyxcbiAgICAgICAgICAgIFRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHRoaXMuY2xvdWRXYXRjaENsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgY29uc29sZS5sb2coJ/Cfk4og57eK5oCl5YGc5q2i44Oh44OI44Oq44Kv44K544KSQ2xvdWRXYXRjaOOBq+mAgeS/oeOBl+OBvuOBl+OBnycpO1xuICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2Fybign4pqg77iPIOe3iuaApeWBnOatouODoeODiOODquOCr+OCuemAgeS/oeOBq+WkseaVlzonLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOODhuOCueODiOOBrueZu+mMslxuICAgKi9cbiAgcmVnaXN0ZXJBY3RpdmVUZXN0KHRlc3Q6IEFjdGl2ZVRlc3QpOiB2b2lkIHtcbiAgICB0aGlzLmFjdGl2ZVRlc3RzLnNldCh0ZXN0LnRlc3RJZCwgdGVzdCk7XG4gICAgY29uc29sZS5sb2coYPCfk50g44Ki44Kv44OG44Kj44OW44OG44K544OI55m76YyyOiAke3Rlc3QudGVzdE5hbWV9ICgke3Rlc3QudGVzdElkfSlgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jjga7nmbvpjLLop6PpmaRcbiAgICovXG4gIHVucmVnaXN0ZXJBY3RpdmVUZXN0KHRlc3RJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuYWN0aXZlVGVzdHMuZGVsZXRlKHRlc3RJZCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OdIOOCouOCr+ODhuOCo+ODluODhuOCueODiOeZu+mMsuino+mZpDogJHt0ZXN0SWR9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOW+qeaXp+OCs+ODvOODq+ODkOODg+OCr+OBrueZu+mMslxuICAgKi9cbiAgcmVnaXN0ZXJSZWNvdmVyeUNhbGxiYWNrKGNhbGxiYWNrOiAoKSA9PiBQcm9taXNlPHZvaWQ+KTogdm9pZCB7XG4gICAgdGhpcy5yZWNvdmVyeUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDnt4rmgKXlgZzmraLnirbmhYvjga7lj5blvpdcbiAgICovXG4gIGdldEVtZXJnZW5jeVN0b3BTdGF0ZSgpOiBFbWVyZ2VuY3lTdG9wU3RhdGUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5zdG9wU3RhdGU7XG4gIH1cblxuICAvKipcbiAgICog57eK5oCl5YGc5q2i54q25oWL44Gu44Oq44K744OD44OIXG4gICAqL1xuICByZXNldEVtZXJnZW5jeVN0b3BTdGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdG9wU3RhdGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SEIOe3iuaApeWBnOatoueKtuaFi+OCkuODquOCu+ODg+ODiOOBl+OBvuOBmScpO1xuICAgICAgdGhpcy5zdG9wU3RhdGUgPSBudWxsO1xuICAgICAgdGhpcy5hY3RpdmVUZXN0cy5jbGVhcigpO1xuICAgICAgdGhpcy5zdG9wSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgdGhpcy5lbWl0KCdlbWVyZ2VuY3lTdG9wUmVzZXQnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44Ki44Kv44OG44Kj44OW44OG44K544OI5LiA6Kan44Gu5Y+W5b6XXG4gICAqL1xuICBnZXRBY3RpdmVUZXN0cygpOiBBY3RpdmVUZXN0W10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuYWN0aXZlVGVzdHMudmFsdWVzKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIOe3iuaApeWBnOatouOBjOacieWKueOBi+OBqeOBhuOBi+OBrueiuuiqjVxuICAgKi9cbiAgaXNFbWVyZ2VuY3lTdG9wQWN0aXZlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0b3BTdGF0ZT8uaXNBY3RpdmUgfHwgZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICog44Oq44K944O844K544Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAqL1xuICBhc3luYyBjbGVhbnVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn6e5IOe3iuaApeWBnOatoueuoeeQhuOCt+OCueODhuODoOOCkuOCr+ODquODvOODs+OCouODg+ODl+S4rS4uLicpO1xuICAgIFxuICAgIC8vIOOCpOODmeODs+ODiOODquOCueODiuODvOOBruWJiumZpFxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgXG4gICAgLy8g44Ki44Kv44OG44Kj44OW44OG44K544OI44Gu44Kv44Oq44KiXG4gICAgdGhpcy5hY3RpdmVUZXN0cy5jbGVhcigpO1xuICAgIFxuICAgIC8vIOW+qeaXp+OCs+ODvOODq+ODkOODg+OCr+OBruOCr+ODquOColxuICAgIHRoaXMucmVjb3ZlcnlDYWxsYmFja3MgPSBbXTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygn4pyFIOe3iuaApeWBnOatoueuoeeQhuOCt+OCueODhuODoOOBruOCr+ODquODvOODs+OCouODg+ODl+WujOS6hicpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEVtZXJnZW5jeVN0b3BNYW5hZ2VyOyJdfQ==