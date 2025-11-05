"use strict";
/**
 * 本番環境テスト実行エンジン
 *
 * 実本番AWSリソースでのテスト実行を安全に管理
 * 読み取り専用モードでの実行制御と緊急停止機能を提供
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionTestEngine = exports.TestExecutionStatus = void 0;
const events_1 = require("events");
const production_connection_manager_1 = __importDefault(require("./production-connection-manager"));
const emergency_stop_manager_1 = __importStar(require("./emergency-stop-manager"));
/**
 * テスト実行状態
 */
var TestExecutionStatus;
(function (TestExecutionStatus) {
    TestExecutionStatus["PENDING"] = "PENDING";
    TestExecutionStatus["RUNNING"] = "RUNNING";
    TestExecutionStatus["COMPLETED"] = "COMPLETED";
    TestExecutionStatus["FAILED"] = "FAILED";
    TestExecutionStatus["STOPPED"] = "STOPPED";
    TestExecutionStatus["SKIPPED"] = "SKIPPED";
})(TestExecutionStatus || (exports.TestExecutionStatus = TestExecutionStatus = {}));
/**
 * 本番環境テスト実行エンジンクラス
 */
class ProductionTestEngine extends events_1.EventEmitter {
    config;
    connectionManager;
    emergencyStopManager;
    isInitialized = false;
    currentExecution = null;
    constructor(config) {
        super();
        this.config = config;
        this.connectionManager = new production_connection_manager_1.default(config);
        this.emergencyStopManager = new emergency_stop_manager_1.default(config);
        this.setupEventHandlers();
    }
    /**
     * イベントハンドラーの設定
     */
    setupEventHandlers() {
        // 緊急停止イベントの処理
        this.emergencyStopManager.on('emergencyStopCompleted', (stopState) => {
            console.log('🛑 緊急停止が完了しました');
            this.emit('emergencyStopCompleted', stopState);
        });
        this.emergencyStopManager.on('emergencyStopFailed', (error) => {
            console.error('❌ 緊急停止処理に失敗しました:', error);
            this.emit('emergencyStopFailed', error);
        });
    }
    /**
     * エンジンの初期化
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ エンジンは既に初期化されています');
            return;
        }
        console.log('🚀 本番環境テストエンジンを初期化中...');
        try {
            // 1. 設定の検証
            await this.validateConfiguration();
            // 2. 本番環境への接続テスト
            const connectionResult = await this.connectionManager.testProductionConnection();
            if (!connectionResult.success) {
                throw new Error(`本番環境接続に失敗しました: ${connectionResult.failedServices.join(', ')}`);
            }
            // 3. 安全性制約の確認
            await this.validateSafetyConstraints();
            this.isInitialized = true;
            console.log('✅ 本番環境テストエンジンの初期化完了');
            this.emit('initialized');
        }
        catch (error) {
            console.error('❌ エンジン初期化エラー:', error);
            throw error;
        }
    }
    /**
     * 設定の検証
     */
    async validateConfiguration() {
        console.log('🔍 設定を検証中...');
        // 必須設定の確認
        if (!this.config.safetyMode) {
            throw new Error('本番環境テストでは safetyMode が必須です');
        }
        if (!this.config.readOnlyMode) {
            throw new Error('本番環境テストでは readOnlyMode が必須です');
        }
        if (!this.config.emergencyStopEnabled) {
            throw new Error('本番環境テストでは emergencyStopEnabled が必須です');
        }
        if (this.config.region !== 'ap-northeast-1') {
            throw new Error('本番環境テストは ap-northeast-1 リージョンでのみ実行可能です');
        }
        console.log('✅ 設定検証完了');
    }
    /**
     * 安全性制約の確認
     */
    async validateSafetyConstraints() {
        console.log('🛡️ 安全性制約を確認中...');
        // 読み取り専用モードの確認
        if (!this.config.readOnlyMode) {
            throw new Error('読み取り専用モードが有効になっていません');
        }
        // 緊急停止機能の確認
        if (!this.config.emergencyStopEnabled) {
            throw new Error('緊急停止機能が有効になっていません');
        }
        // リソース制限の確認
        if (this.config.execution.maxConcurrentTests > 10) {
            throw new Error('同時実行テスト数が制限を超えています（最大10）');
        }
        console.log('✅ 安全性制約確認完了');
    }
    /**
     * テストスイートの実行
     */
    async executeTestSuite(testSuite) {
        if (!this.isInitialized) {
            throw new Error('エンジンが初期化されていません。initialize() を先に実行してください。');
        }
        if (this.emergencyStopManager.isEmergencyStopActive()) {
            throw new Error('緊急停止が有効になっています。実行を中止します。');
        }
        console.log(`🎯 テストスイート実行開始: ${testSuite.suiteName}`);
        console.log(`   テスト数: ${testSuite.tests.length}`);
        console.log(`   並列実行: ${testSuite.configuration.parallel ? 'Yes' : 'No'}`);
        const startTime = Date.now();
        const results = new Map();
        // 実行統計の初期化
        this.currentExecution = {
            suiteId: testSuite.suiteId,
            startTime: new Date(),
            results,
            statistics: {
                totalTests: testSuite.tests.length,
                completedTests: 0,
                passedTests: 0,
                failedTests: 0,
                skippedTests: 0,
                totalDuration: 0,
                averageDuration: 0,
                successRate: 0
            }
        };
        try {
            // テスト実行前の健全性チェック
            const healthCheck = await this.connectionManager.performHealthCheck();
            if (!healthCheck.healthy) {
                console.warn('⚠️ 健全性チェックで問題が検出されました:', healthCheck.issues);
                if (testSuite.configuration.failFast) {
                    throw new Error(`健全性チェック失敗: ${healthCheck.issues.join(', ')}`);
                }
            }
            // テストの実行
            if (testSuite.configuration.parallel) {
                await this.executeTestsInParallel(testSuite.tests, testSuite.configuration);
            }
            else {
                await this.executeTestsSequentially(testSuite.tests, testSuite.configuration);
            }
            // 実行統計の更新
            this.updateExecutionStatistics();
            const totalDuration = Date.now() - startTime;
            console.log(`✅ テストスイート実行完了: ${testSuite.suiteName} (${totalDuration}ms)`);
            console.log(`   成功: ${this.currentExecution.statistics.passedTests}/${this.currentExecution.statistics.totalTests}`);
            console.log(`   成功率: ${(this.currentExecution.statistics.successRate * 100).toFixed(1)}%`);
            this.emit('testSuiteCompleted', {
                suiteId: testSuite.suiteId,
                results: results,
                statistics: this.currentExecution.statistics
            });
            return results;
        }
        catch (error) {
            console.error(`❌ テストスイート実行エラー: ${testSuite.suiteName}`, error);
            // 緊急停止の発動
            await this.emergencyStopManager.initiateEmergencyStop(emergency_stop_manager_1.EmergencyStopReason.UNEXPECTED_ERROR, `Test suite execution failed: ${error}`, 'ProductionTestEngine');
            throw error;
        }
    }
    /**
     * テストの並列実行
     */
    async executeTestsInParallel(tests, config) {
        console.log(`🔄 並列テスト実行開始 (最大同時実行数: ${config.maxConcurrency})`);
        const semaphore = new Array(config.maxConcurrency).fill(null);
        const testPromises = [];
        for (const test of tests) {
            const testPromise = this.acquireSemaphore(semaphore).then(async (release) => {
                try {
                    await this.executeIndividualTest(test, config);
                }
                finally {
                    release();
                }
            });
            testPromises.push(testPromise);
        }
        await Promise.allSettled(testPromises);
        console.log('✅ 並列テスト実行完了');
    }
    /**
     * テストの順次実行
     */
    async executeTestsSequentially(tests, config) {
        console.log('🔄 順次テスト実行開始');
        for (const test of tests) {
            if (this.emergencyStopManager.isEmergencyStopActive()) {
                console.log('🛑 緊急停止が有効になったため、残りのテストをスキップします');
                break;
            }
            await this.executeIndividualTest(test, config);
            if (config.failFast && this.currentExecution) {
                const lastResult = Array.from(this.currentExecution.results.values()).pop();
                if (lastResult && !lastResult.success) {
                    console.log('🛑 failFast が有効で、テストが失敗したため実行を中止します');
                    break;
                }
            }
        }
        console.log('✅ 順次テスト実行完了');
    }
    /**
     * 個別テストの実行
     */
    async executeIndividualTest(test, config) {
        const testStartTime = Date.now();
        console.log(`🧪 テスト実行開始: ${test.testName} (${test.testId})`);
        // アクティブテストとして登録
        const activeTest = {
            testId: test.testId,
            testName: test.testName,
            startTime: new Date(),
            category: test.category,
            status: 'running',
            resourcesInUse: [] // 実際のリソース使用状況に応じて更新
        };
        this.emergencyStopManager.registerActiveTest(activeTest);
        let result;
        let retryCount = 0;
        while (retryCount <= test.retryCount) {
            try {
                // 緊急停止チェック
                if (this.emergencyStopManager.isEmergencyStopActive()) {
                    result = {
                        testId: test.testId,
                        testName: test.testName,
                        category: test.category,
                        status: TestExecutionStatus.STOPPED,
                        startTime: new Date(testStartTime),
                        duration: Date.now() - testStartTime,
                        success: false,
                        error: 'Emergency stop activated'
                    };
                    break;
                }
                // テストの実行
                result = await Promise.race([
                    test.execute(this),
                    this.createTimeoutPromise(test.timeout, test.testId)
                ]);
                // 成功した場合はリトライループを抜ける
                if (result.success) {
                    break;
                }
                retryCount++;
                if (retryCount <= test.retryCount) {
                    console.log(`🔄 テストリトライ: ${test.testName} (${retryCount}/${test.retryCount})`);
                    await this.delay(1000 * retryCount); // 指数バックオフ
                }
            }
            catch (error) {
                retryCount++;
                result = {
                    testId: test.testId,
                    testName: test.testName,
                    category: test.category,
                    status: TestExecutionStatus.FAILED,
                    startTime: new Date(testStartTime),
                    duration: Date.now() - testStartTime,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
                if (retryCount <= test.retryCount) {
                    console.log(`🔄 テストリトライ (エラー): ${test.testName} (${retryCount}/${test.retryCount})`);
                    await this.delay(1000 * retryCount);
                }
            }
        }
        // 結果の最終設定
        result.endTime = new Date();
        result.duration = Date.now() - testStartTime;
        // 結果の保存
        if (this.currentExecution) {
            this.currentExecution.results.set(test.testId, result);
        }
        // アクティブテストの登録解除
        this.emergencyStopManager.unregisterActiveTest(test.testId);
        // 結果のログ出力
        if (result.success) {
            console.log(`✅ テスト成功: ${test.testName} (${result.duration}ms)`);
        }
        else {
            console.error(`❌ テスト失敗: ${test.testName} - ${result.error}`);
        }
        this.emit('testCompleted', result);
    }
    /**
     * タイムアウトPromiseの作成
     */
    createTimeoutPromise(timeout, testId) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Test timeout after ${timeout}ms: ${testId}`));
            }, timeout);
        });
    }
    /**
     * セマフォの取得
     */
    async acquireSemaphore(semaphore) {
        return new Promise((resolve) => {
            const tryAcquire = () => {
                const index = semaphore.findIndex(slot => slot === null);
                if (index !== -1) {
                    semaphore[index] = true;
                    resolve(() => {
                        semaphore[index] = null;
                    });
                }
                else {
                    setTimeout(tryAcquire, 10);
                }
            };
            tryAcquire();
        });
    }
    /**
     * 遅延処理
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 実行統計の更新
     */
    updateExecutionStatistics() {
        if (!this.currentExecution)
            return;
        const results = Array.from(this.currentExecution.results.values());
        const stats = this.currentExecution.statistics;
        stats.completedTests = results.length;
        stats.passedTests = results.filter(r => r.success).length;
        stats.failedTests = results.filter(r => !r.success && r.status !== TestExecutionStatus.SKIPPED).length;
        stats.skippedTests = results.filter(r => r.status === TestExecutionStatus.SKIPPED).length;
        stats.totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        stats.averageDuration = stats.completedTests > 0 ? stats.totalDuration / stats.completedTests : 0;
        stats.successRate = stats.completedTests > 0 ? stats.passedTests / stats.completedTests : 0;
    }
    /**
     * 現在の実行統計を取得
     */
    getCurrentExecutionStatistics() {
        return this.currentExecution?.statistics || null;
    }
    /**
     * 接続管理システムの取得
     */
    getConnectionManager() {
        return this.connectionManager;
    }
    /**
     * 緊急停止管理システムの取得
     */
    getEmergencyStopManager() {
        return this.emergencyStopManager;
    }
    /**
     * 設定の取得
     */
    getConfig() {
        return this.config;
    }
    /**
     * 緊急停止の要求
     */
    async requestEmergencyStop(reason) {
        await this.emergencyStopManager.initiateEmergencyStop(emergency_stop_manager_1.EmergencyStopReason.MANUAL_REQUEST, reason, 'ProductionTestEngine');
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 本番環境テストエンジンをクリーンアップ中...');
        try {
            // 緊急停止管理システムのクリーンアップ
            await this.emergencyStopManager.cleanup();
            // 接続管理システムのクリーンアップ
            await this.connectionManager.cleanup();
            // 実行状態のクリア
            this.currentExecution = null;
            this.isInitialized = false;
            // イベントリスナーの削除
            this.removeAllListeners();
            console.log('✅ 本番環境テストエンジンのクリーンアップ完了');
        }
        catch (error) {
            console.error('❌ クリーンアップエラー:', error);
            throw error;
        }
    }
}
exports.ProductionTestEngine = ProductionTestEngine;
exports.default = ProductionTestEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdGlvbi10ZXN0LWVuZ2luZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByb2R1Y3Rpb24tdGVzdC1lbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILG1DQUFzQztBQUN0QyxvR0FBZ0c7QUFDaEcsbUZBQWlHO0FBR2pHOztHQUVHO0FBQ0gsSUFBWSxtQkFPWDtBQVBELFdBQVksbUJBQW1CO0lBQzdCLDBDQUFtQixDQUFBO0lBQ25CLDBDQUFtQixDQUFBO0lBQ25CLDhDQUF1QixDQUFBO0lBQ3ZCLHdDQUFpQixDQUFBO0lBQ2pCLDBDQUFtQixDQUFBO0lBQ25CLDBDQUFtQixDQUFBO0FBQ3JCLENBQUMsRUFQVyxtQkFBbUIsbUNBQW5CLG1CQUFtQixRQU85QjtBQW9FRDs7R0FFRztBQUNILE1BQWEsb0JBQXFCLFNBQVEscUJBQVk7SUFDNUMsTUFBTSxDQUFtQjtJQUN6QixpQkFBaUIsQ0FBOEI7SUFDL0Msb0JBQW9CLENBQXVCO0lBQzNDLGFBQWEsR0FBWSxLQUFLLENBQUM7SUFDL0IsZ0JBQWdCLEdBS2IsSUFBSSxDQUFDO0lBRWhCLFlBQVksTUFBd0I7UUFDbEMsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSx1Q0FBMkIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxnQ0FBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUU3RCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQ7O09BRUc7SUFDSyxrQkFBa0I7UUFDeEIsY0FBYztRQUNkLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUNu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LENBQUMsb0JBQW9CLENBQUMsTUFBYztRQUN2QyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxxQkFBcUIsQ0FDbkQsNENBQW1CLENBQUMsY0FBYyxFQUNsQyxNQUFNLEVBQ04sc0JBQXNCLENBQ3ZCLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUUxQyxJQUFJLENBQUM7WUFDSCxxQkFBcUI7WUFDckIsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFMUMsbUJBQW1CO1lBQ25CLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXZDLFdBQVc7WUFDWCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzdCLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1lBRTNCLGNBQWM7WUFDZCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUUxQixPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFFekMsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0QyxNQUFNLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUF0ZUQsb0RBc2VDO0FBRUQsa0JBQWUsb0JBQW9CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOacrOeVqueSsOWig+ODhuOCueODiOWun+ihjOOCqOODs+OCuOODs1xuICogXG4gKiDlrp/mnKznlapBV1Pjg6rjgr3jg7zjgrnjgafjga7jg4bjgrnjg4jlrp/ooYzjgpLlronlhajjgavnrqHnkIZcbiAqIOiqreOBv+WPluOCiuWwgueUqOODouODvOODieOBp+OBruWun+ihjOWItuW+oeOBqOe3iuaApeWBnOatouapn+iDveOCkuaPkOS+m1xuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCBQcm9kdWN0aW9uQ29ubmVjdGlvbk1hbmFnZXIsIHsgQ29ubmVjdGlvblJlc3VsdCB9IGZyb20gJy4vcHJvZHVjdGlvbi1jb25uZWN0aW9uLW1hbmFnZXInO1xuaW1wb3J0IEVtZXJnZW5jeVN0b3BNYW5hZ2VyLCB7IEVtZXJnZW5jeVN0b3BSZWFzb24sIEFjdGl2ZVRlc3QgfSBmcm9tICcuL2VtZXJnZW5jeS1zdG9wLW1hbmFnZXInO1xuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5cbi8qKlxuICog44OG44K544OI5a6f6KGM54q25oWLXG4gKi9cbmV4cG9ydCBlbnVtIFRlc3RFeGVjdXRpb25TdGF0dXMge1xuICBQRU5ESU5HID0gJ1BFTkRJTkcnLFxuICBSVU5OSU5HID0gJ1JVTk5JTkcnLFxuICBDT01QTEVURUQgPSAnQ09NUExFVEVEJyxcbiAgRkFJTEVEID0gJ0ZBSUxFRCcsXG4gIFNUT1BQRUQgPSAnU1RPUFBFRCcsXG4gIFNLSVBQRUQgPSAnU0tJUFBFRCdcbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jntZDmnpzjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0UmVzdWx0IHtcbiAgdGVzdElkOiBzdHJpbmc7XG4gIHRlc3ROYW1lOiBzdHJpbmc7XG4gIGNhdGVnb3J5OiBzdHJpbmc7XG4gIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cztcbiAgc3RhcnRUaW1lOiBEYXRlO1xuICBlbmRUaW1lPzogRGF0ZTtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgc3VjY2VzczogYm9vbGVhbjtcbiAgZXJyb3I/OiBzdHJpbmc7XG4gIG1ldHJpY3M/OiBhbnk7XG4gIG1ldGFkYXRhPzogYW55O1xufVxuXG4vKipcbiAqIOODhuOCueODiOOCueOCpOODvOODiOOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RTdWl0ZSB7XG4gIHN1aXRlSWQ6IHN0cmluZztcbiAgc3VpdGVOYW1lOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIHRlc3RzOiBUZXN0RGVmaW5pdGlvbltdO1xuICBjb25maWd1cmF0aW9uOiBUZXN0U3VpdGVDb25maWc7XG59XG5cbi8qKlxuICog44OG44K544OI5a6a576p44Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdERlZmluaXRpb24ge1xuICB0ZXN0SWQ6IHN0cmluZztcbiAgdGVzdE5hbWU6IHN0cmluZztcbiAgY2F0ZWdvcnk6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgdGltZW91dDogbnVtYmVyO1xuICByZXRyeUNvdW50OiBudW1iZXI7XG4gIGRlcGVuZGVuY2llczogc3RyaW5nW107XG4gIGV4ZWN1dGU6IChlbmdpbmU6IFByb2R1Y3Rpb25UZXN0RW5naW5lKSA9PiBQcm9taXNlPFRlc3RSZXN1bHQ+O1xufVxuXG4vKipcbiAqIOODhuOCueODiOOCueOCpOODvOODiOioreWumlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RTdWl0ZUNvbmZpZyB7XG4gIHBhcmFsbGVsOiBib29sZWFuO1xuICBtYXhDb25jdXJyZW5jeTogbnVtYmVyO1xuICBmYWlsRmFzdDogYm9vbGVhbjtcbiAgY29udGludWVPbkVycm9yOiBib29sZWFuO1xufVxuXG4vKipcbiAqIOWun+ihjOe1seioiFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEV4ZWN1dGlvblN0YXRpc3RpY3Mge1xuICB0b3RhbFRlc3RzOiBudW1iZXI7XG4gIGNvbXBsZXRlZFRlc3RzOiBudW1iZXI7XG4gIHBhc3NlZFRlc3RzOiBudW1iZXI7XG4gIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gIHNraXBwZWRUZXN0czogbnVtYmVyO1xuICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gIGF2ZXJhZ2VEdXJhdGlvbjogbnVtYmVyO1xuICBzdWNjZXNzUmF0ZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIOacrOeVqueSsOWig+ODhuOCueODiOWun+ihjOOCqOODs+OCuOODs+OCr+ODqeOCuVxuICovXG5leHBvcnQgY2xhc3MgUHJvZHVjdGlvblRlc3RFbmdpbmUgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBwcml2YXRlIGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZztcbiAgcHJpdmF0ZSBjb25uZWN0aW9uTWFuYWdlcjogUHJvZHVjdGlvbkNvbm5lY3Rpb25NYW5hZ2VyO1xuICBwcml2YXRlIGVtZXJnZW5jeVN0b3BNYW5hZ2VyOiBFbWVyZ2VuY3lTdG9wTWFuYWdlcjtcbiAgcHJpdmF0ZSBpc0luaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgY3VycmVudEV4ZWN1dGlvbjoge1xuICAgIHN1aXRlSWQ6IHN0cmluZztcbiAgICBzdGFydFRpbWU6IERhdGU7XG4gICAgcmVzdWx0czogTWFwPHN0cmluZywgVGVzdFJlc3VsdD47XG4gICAgc3RhdGlzdGljczogRXhlY3V0aW9uU3RhdGlzdGljcztcbiAgfSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IG5ldyBQcm9kdWN0aW9uQ29ubmVjdGlvbk1hbmFnZXIoY29uZmlnKTtcbiAgICB0aGlzLmVtZXJnZW5jeVN0b3BNYW5hZ2VyID0gbmV3IEVtZXJnZW5jeVN0b3BNYW5hZ2VyKGNvbmZpZyk7XG5cbiAgICB0aGlzLnNldHVwRXZlbnRIYW5kbGVycygpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCpOODmeODs+ODiOODj+ODs+ODieODqeODvOOBruioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cEV2ZW50SGFuZGxlcnMoKTogdm9pZCB7XG4gICAgLy8g57eK5oCl5YGc5q2i44Kk44OZ44Oz44OI44Gu5Yem55CGXG4gICAgdGhpcy5lbWVyZ2VuY3lTdG9wTWFuYWdlci5vbignZW1lcmdlbmN5U3RvcENvbXBsZXRlZCcsIChzdG9wU3RhdGUpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5uRIOe3iuaApeWBnOatouOBjOWujOS6huOBl+OBvuOBl+OBnycpO1xuICAgICAgdGhpcy5lbWl0KCdlbWVyZ2VuY3lTdG9wQ29tcGxldGVkJywgc3RvcFN0YXRlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZW1lcmdlbmN5U3RvcE1hbmFnZXIub24oJ2VtZXJnZW5jeVN0b3BGYWlsZWQnLCAoZXJyb3IpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDnt4rmgKXlgZzmraLlh6bnkIbjgavlpLHmlZfjgZfjgb7jgZfjgZ86JywgZXJyb3IpO1xuICAgICAgdGhpcy5lbWl0KCdlbWVyZ2VuY3lTdG9wRmFpbGVkJywgZXJyb3IpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCqOODs+OCuOODs+OBruWIneacn+WMllxuICAgKi9cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pqg77iPIOOCqOODs+OCuOODs+OBr+aXouOBq+WIneacn+WMluOBleOCjOOBpuOBhOOBvuOBmScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfwn5qAIOacrOeVqueSsOWig+ODhuOCueODiOOCqOODs+OCuOODs+OCkuWIneacn+WMluS4rS4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIDEuIOioreWumuOBruaknOiovFxuICAgICAgYXdhaXQgdGhpcy52YWxpZGF0ZUNvbmZpZ3VyYXRpb24oKTtcblxuICAgICAgLy8gMi4g5pys55Wq55Kw5aKD44G444Gu5o6l57aa44OG44K544OIXG4gICAgICBjb25zdCBjb25uZWN0aW9uUmVzdWx0ID0gYXdhaXQgdGhpcy5jb25uZWN0aW9uTWFuYWdlci50ZXN0UHJvZHVjdGlvbkNvbm5lY3Rpb24oKTtcbiAgICAgIGlmICghY29ubmVjdGlvblJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihg5pys55Wq55Kw5aKD5o6l57aa44Gr5aSx5pWX44GX44G+44GX44GfOiAke2Nvbm5lY3Rpb25SZXN1bHQuZmFpbGVkU2VydmljZXMuam9pbignLCAnKX1gKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4g5a6J5YWo5oCn5Yi257SE44Gu56K66KqNXG4gICAgICBhd2FpdCB0aGlzLnZhbGlkYXRlU2FmZXR5Q29uc3RyYWludHMoKTtcblxuICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg5pys55Wq55Kw5aKD44OG44K544OI44Ko44Oz44K444Oz44Gu5Yid5pyf5YyW5a6M5LqGJyk7XG4gICAgICB0aGlzLmVtaXQoJ2luaXRpYWxpemVkJyk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOOCqOODs+OCuOODs+WIneacn+WMluOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog6Kit5a6a44Gu5qSc6Ki8XG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlQ29uZmlndXJhdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+UjSDoqK3lrprjgpLmpJzoqLzkuK0uLi4nKTtcblxuICAgIC8vIOW/hemgiOioreWumuOBrueiuuiqjVxuICAgIGlmICghdGhpcy5jb25maWcuc2FmZXR5TW9kZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfmnKznlarnkrDlooPjg4bjgrnjg4jjgafjga8gc2FmZXR5TW9kZSDjgYzlv4XpoIjjgafjgZknKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY29uZmlnLnJlYWRPbmx5TW9kZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfmnKznlarnkrDlooPjg4bjgrnjg4jjgafjga8gcmVhZE9ubHlNb2RlIOOBjOW/hemgiOOBp+OBmScpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb25maWcuZW1lcmdlbmN5U3RvcEVuYWJsZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign5pys55Wq55Kw5aKD44OG44K544OI44Gn44GvIGVtZXJnZW5jeVN0b3BFbmFibGVkIOOBjOW/hemgiOOBp+OBmScpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNvbmZpZy5yZWdpb24gIT09ICdhcC1ub3J0aGVhc3QtMScpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign5pys55Wq55Kw5aKD44OG44K544OI44GvIGFwLW5vcnRoZWFzdC0xIOODquODvOOCuOODp+ODs+OBp+OBruOBv+Wun+ihjOWPr+iDveOBp+OBmScpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfinIUg6Kit5a6a5qSc6Ki85a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICog5a6J5YWo5oCn5Yi257SE44Gu56K66KqNXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlU2FmZXR5Q29uc3RyYWludHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfm6HvuI8g5a6J5YWo5oCn5Yi257SE44KS56K66KqN5LitLi4uJyk7XG5cbiAgICAvLyDoqq3jgb/lj5bjgorlsILnlKjjg6Ljg7zjg4njga7norroqo1cbiAgICBpZiAoIXRoaXMuY29uZmlnLnJlYWRPbmx5TW9kZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfoqq3jgb/lj5bjgorlsILnlKjjg6Ljg7zjg4njgYzmnInlirnjgavjgarjgaPjgabjgYTjgb7jgZvjgpMnKTtcbiAgICB9XG5cbiAgICAvLyDnt4rmgKXlgZzmraLmqZ/og73jga7norroqo1cbiAgICBpZiAoIXRoaXMuY29uZmlnLmVtZXJnZW5jeVN0b3BFbmFibGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+e3iuaApeWBnOatouapn+iDveOBjOacieWKueOBq+OBquOBo+OBpuOBhOOBvuOBm+OCkycpO1xuICAgIH1cblxuICAgIC8vIOODquOCveODvOOCueWItumZkOOBrueiuuiqjVxuICAgIGlmICh0aGlzLmNvbmZpZy5leGVjdXRpb24ubWF4Q29uY3VycmVudFRlc3RzID4gMTApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign5ZCM5pmC5a6f6KGM44OG44K544OI5pWw44GM5Yi26ZmQ44KS6LaF44GI44Gm44GE44G+44GZ77yI5pyA5aSnMTDvvIknKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIOWuieWFqOaAp+WItue0hOeiuuiqjeWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOODhuOCueODiOOCueOCpOODvOODiOOBruWun+ihjFxuICAgKi9cbiAgYXN5bmMgZXhlY3V0ZVRlc3RTdWl0ZSh0ZXN0U3VpdGU6IFRlc3RTdWl0ZSk6IFByb21pc2U8TWFwPHN0cmluZywgVGVzdFJlc3VsdD4+IHtcbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfjgqjjg7Pjgrjjg7PjgYzliJ3mnJ/ljJbjgZXjgozjgabjgYTjgb7jgZvjgpPjgIJpbml0aWFsaXplKCkg44KS5YWI44Gr5a6f6KGM44GX44Gm44GP44Gg44GV44GE44CCJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZW1lcmdlbmN5U3RvcE1hbmFnZXIuaXNFbWVyZ2VuY3lTdG9wQWN0aXZlKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign57eK5oCl5YGc5q2i44GM5pyJ5Yq544Gr44Gq44Gj44Gm44GE44G+44GZ44CC5a6f6KGM44KS5Lit5q2i44GX44G+44GZ44CCJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYPCfjq8g44OG44K544OI44K544Kk44O844OI5a6f6KGM6ZaL5aeLOiAke3Rlc3RTdWl0ZS5zdWl0ZU5hbWV9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOODhuOCueODiOaVsDogJHt0ZXN0U3VpdGUudGVzdHMubGVuZ3RofWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDkuKbliJflrp/ooYw6ICR7dGVzdFN1aXRlLmNvbmZpZ3VyYXRpb24ucGFyYWxsZWwgPyAnWWVzJyA6ICdObyd9YCk7XG5cbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBuZXcgTWFwPHN0cmluZywgVGVzdFJlc3VsdD4oKTtcblxuICAgIC8vIOWun+ihjOe1seioiOOBruWIneacn+WMllxuICAgIHRoaXMuY3VycmVudEV4ZWN1dGlvbiA9IHtcbiAgICAgIHN1aXRlSWQ6IHRlc3RTdWl0ZS5zdWl0ZUlkLFxuICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgcmVzdWx0cyxcbiAgICAgIHN0YXRpc3RpY3M6IHtcbiAgICAgICAgdG90YWxUZXN0czogdGVzdFN1aXRlLnRlc3RzLmxlbmd0aCxcbiAgICAgICAgY29tcGxldGVkVGVzdHM6IDAsXG4gICAgICAgIHBhc3NlZFRlc3RzOiAwLFxuICAgICAgICBmYWlsZWRUZXN0czogMCxcbiAgICAgICAgc2tpcHBlZFRlc3RzOiAwLFxuICAgICAgICB0b3RhbER1cmF0aW9uOiAwLFxuICAgICAgICBhdmVyYWdlRHVyYXRpb246IDAsXG4gICAgICAgIHN1Y2Nlc3NSYXRlOiAwXG4gICAgICB9XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICAvLyDjg4bjgrnjg4jlrp/ooYzliY3jga7lgaXlhajmgKfjg4Hjgqfjg4Pjgq9cbiAgICAgIGNvbnN0IGhlYWx0aENoZWNrID0gYXdhaXQgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5wZXJmb3JtSGVhbHRoQ2hlY2soKTtcbiAgICAgIGlmICghaGVhbHRoQ2hlY2suaGVhbHRoeSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyDlgaXlhajmgKfjg4Hjgqfjg4Pjgq/jgafllY/poYzjgYzmpJzlh7rjgZXjgozjgb7jgZfjgZ86JywgaGVhbHRoQ2hlY2suaXNzdWVzKTtcbiAgICAgICAgaWYgKHRlc3RTdWl0ZS5jb25maWd1cmF0aW9uLmZhaWxGYXN0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlgaXlhajmgKfjg4Hjgqfjg4Pjgq/lpLHmlZc6ICR7aGVhbHRoQ2hlY2suaXNzdWVzLmpvaW4oJywgJyl9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8g44OG44K544OI44Gu5a6f6KGMXG4gICAgICBpZiAodGVzdFN1aXRlLmNvbmZpZ3VyYXRpb24ucGFyYWxsZWwpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlVGVzdHNJblBhcmFsbGVsKHRlc3RTdWl0ZS50ZXN0cywgdGVzdFN1aXRlLmNvbmZpZ3VyYXRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlVGVzdHNTZXF1ZW50aWFsbHkodGVzdFN1aXRlLnRlc3RzLCB0ZXN0U3VpdGUuY29uZmlndXJhdGlvbik7XG4gICAgICB9XG5cbiAgICAgIC8vIOWun+ihjOe1seioiOOBruabtOaWsFxuICAgICAgdGhpcy51cGRhdGVFeGVjdXRpb25TdGF0aXN0aWNzKCk7XG5cbiAgICAgIGNvbnN0IHRvdGFsRHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgY29uc29sZS5sb2coYOKchSDjg4bjgrnjg4jjgrnjgqTjg7zjg4jlrp/ooYzlrozkuoY6ICR7dGVzdFN1aXRlLnN1aXRlTmFtZX0gKCR7dG90YWxEdXJhdGlvbn1tcylgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDmiJDlip86ICR7dGhpcy5jdXJyZW50RXhlY3V0aW9uLnN0YXRpc3RpY3MucGFzc2VkVGVzdHN9LyR7dGhpcy5jdXJyZW50RXhlY3V0aW9uLnN0YXRpc3RpY3MudG90YWxUZXN0c31gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDmiJDlip/njoc6ICR7KHRoaXMuY3VycmVudEV4ZWN1dGlvbi5zdGF0aXN0aWNzLnN1Y2Nlc3NSYXRlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcblxuICAgICAgdGhpcy5lbWl0KCd0ZXN0U3VpdGVDb21wbGV0ZWQnLCB7XG4gICAgICAgIHN1aXRlSWQ6IHRlc3RTdWl0ZS5zdWl0ZUlkLFxuICAgICAgICByZXN1bHRzOiByZXN1bHRzLFxuICAgICAgICBzdGF0aXN0aWNzOiB0aGlzLmN1cnJlbnRFeGVjdXRpb24uc3RhdGlzdGljc1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiByZXN1bHRzO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCDjg4bjgrnjg4jjgrnjgqTjg7zjg4jlrp/ooYzjgqjjg6njg7w6ICR7dGVzdFN1aXRlLnN1aXRlTmFtZX1gLCBlcnJvcik7XG4gICAgICBcbiAgICAgIC8vIOe3iuaApeWBnOatouOBrueZuuWLlVxuICAgICAgYXdhaXQgdGhpcy5lbWVyZ2VuY3lTdG9wTWFuYWdlci5pbml0aWF0ZUVtZXJnZW5jeVN0b3AoXG4gICAgICAgIEVtZXJnZW5jeVN0b3BSZWFzb24uVU5FWFBFQ1RFRF9FUlJPUixcbiAgICAgICAgYFRlc3Qgc3VpdGUgZXhlY3V0aW9uIGZhaWxlZDogJHtlcnJvcn1gLFxuICAgICAgICAnUHJvZHVjdGlvblRlc3RFbmdpbmUnXG4gICAgICApO1xuXG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44OG44K544OI44Gu5Lim5YiX5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVUZXN0c0luUGFyYWxsZWwoXG4gICAgdGVzdHM6IFRlc3REZWZpbml0aW9uW10sXG4gICAgY29uZmlnOiBUZXN0U3VpdGVDb25maWdcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coYPCflIQg5Lim5YiX44OG44K544OI5a6f6KGM6ZaL5aeLICjmnIDlpKflkIzmmYLlrp/ooYzmlbA6ICR7Y29uZmlnLm1heENvbmN1cnJlbmN5fSlgKTtcblxuICAgIGNvbnN0IHNlbWFwaG9yZSA9IG5ldyBBcnJheShjb25maWcubWF4Q29uY3VycmVuY3kpLmZpbGwobnVsbCk7XG4gICAgY29uc3QgdGVzdFByb21pc2VzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgdGVzdCBvZiB0ZXN0cykge1xuICAgICAgY29uc3QgdGVzdFByb21pc2UgPSB0aGlzLmFjcXVpcmVTZW1hcGhvcmUoc2VtYXBob3JlKS50aGVuKGFzeW5jIChyZWxlYXNlKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5leGVjdXRlSW5kaXZpZHVhbFRlc3QodGVzdCwgY29uZmlnKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICByZWxlYXNlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0UHJvbWlzZXMucHVzaCh0ZXN0UHJvbWlzZSk7XG4gICAgfVxuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKHRlc3RQcm9taXNlcyk7XG4gICAgY29uc29sZS5sb2coJ+KchSDkuKbliJfjg4bjgrnjg4jlrp/ooYzlrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jjga7poIbmrKHlrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVRlc3RzU2VxdWVudGlhbGx5KFxuICAgIHRlc3RzOiBUZXN0RGVmaW5pdGlvbltdLFxuICAgIGNvbmZpZzogVGVzdFN1aXRlQ29uZmlnXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5SEIOmghuasoeODhuOCueODiOWun+ihjOmWi+WniycpO1xuXG4gICAgZm9yIChjb25zdCB0ZXN0IG9mIHRlc3RzKSB7XG4gICAgICBpZiAodGhpcy5lbWVyZ2VuY3lTdG9wTWFuYWdlci5pc0VtZXJnZW5jeVN0b3BBY3RpdmUoKSkge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+bkSDnt4rmgKXlgZzmraLjgYzmnInlirnjgavjgarjgaPjgZ/jgZ/jgoHjgIHmrovjgorjga7jg4bjgrnjg4jjgpLjgrnjgq3jg4Pjg5fjgZfjgb7jgZknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUluZGl2aWR1YWxUZXN0KHRlc3QsIGNvbmZpZyk7XG5cbiAgICAgIGlmIChjb25maWcuZmFpbEZhc3QgJiYgdGhpcy5jdXJyZW50RXhlY3V0aW9uKSB7XG4gICAgICAgIGNvbnN0IGxhc3RSZXN1bHQgPSBBcnJheS5mcm9tKHRoaXMuY3VycmVudEV4ZWN1dGlvbi5yZXN1bHRzLnZhbHVlcygpKS5wb3AoKTtcbiAgICAgICAgaWYgKGxhc3RSZXN1bHQgJiYgIWxhc3RSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCfwn5uRIGZhaWxGYXN0IOOBjOacieWKueOBp+OAgeODhuOCueODiOOBjOWkseaVl+OBl+OBn+OBn+OCgeWun+ihjOOCkuS4reatouOBl+OBvuOBmScpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ+KchSDpoIbmrKHjg4bjgrnjg4jlrp/ooYzlrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlgIvliKXjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUluZGl2aWR1YWxUZXN0KFxuICAgIHRlc3Q6IFRlc3REZWZpbml0aW9uLFxuICAgIGNvbmZpZzogVGVzdFN1aXRlQ29uZmlnXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRlc3RTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGDwn6eqIOODhuOCueODiOWun+ihjOmWi+WnizogJHt0ZXN0LnRlc3ROYW1lfSAoJHt0ZXN0LnRlc3RJZH0pYCk7XG5cbiAgICAvLyDjgqLjgq/jg4bjgqPjg5bjg4bjgrnjg4jjgajjgZfjgabnmbvpjLJcbiAgICBjb25zdCBhY3RpdmVUZXN0OiBBY3RpdmVUZXN0ID0ge1xuICAgICAgdGVzdElkOiB0ZXN0LnRlc3RJZCxcbiAgICAgIHRlc3ROYW1lOiB0ZXN0LnRlc3ROYW1lLFxuICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgY2F0ZWdvcnk6IHRlc3QuY2F0ZWdvcnksXG4gICAgICBzdGF0dXM6ICdydW5uaW5nJyxcbiAgICAgIHJlc291cmNlc0luVXNlOiBbXSAvLyDlrp/pmpvjga7jg6rjgr3jg7zjgrnkvb/nlKjnirbms4Hjgavlv5zjgZjjgabmm7TmlrBcbiAgICB9O1xuXG4gICAgdGhpcy5lbWVyZ2VuY3lTdG9wTWFuYWdlci5yZWdpc3RlckFjdGl2ZVRlc3QoYWN0aXZlVGVzdCk7XG5cbiAgICBsZXQgcmVzdWx0OiBUZXN0UmVzdWx0O1xuICAgIGxldCByZXRyeUNvdW50ID0gMDtcblxuICAgIHdoaWxlIChyZXRyeUNvdW50IDw9IHRlc3QucmV0cnlDb3VudCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8g57eK5oCl5YGc5q2i44OB44Kn44OD44KvXG4gICAgICAgIGlmICh0aGlzLmVtZXJnZW5jeVN0b3BNYW5hZ2VyLmlzRW1lcmdlbmN5U3RvcEFjdGl2ZSgpKSB7XG4gICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgdGVzdElkOiB0ZXN0LnRlc3RJZCxcbiAgICAgICAgICAgIHRlc3ROYW1lOiB0ZXN0LnRlc3ROYW1lLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IHRlc3QuY2F0ZWdvcnksXG4gICAgICAgICAgICBzdGF0dXM6IFRlc3RFeGVjdXRpb25TdGF0dXMuU1RPUFBFRCxcbiAgICAgICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUodGVzdFN0YXJ0VGltZSksXG4gICAgICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHRlc3RTdGFydFRpbWUsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAnRW1lcmdlbmN5IHN0b3AgYWN0aXZhdGVkJ1xuICAgICAgICAgIH07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDjg4bjgrnjg4jjga7lrp/ooYxcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICB0ZXN0LmV4ZWN1dGUodGhpcyksXG4gICAgICAgICAgdGhpcy5jcmVhdGVUaW1lb3V0UHJvbWlzZSh0ZXN0LnRpbWVvdXQsIHRlc3QudGVzdElkKVxuICAgICAgICBdKTtcblxuICAgICAgICAvLyDmiJDlip/jgZfjgZ/loLTlkIjjga/jg6rjg4jjg6njgqTjg6vjg7zjg5fjgpLmipzjgZHjgotcbiAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXRyeUNvdW50Kys7XG4gICAgICAgIGlmIChyZXRyeUNvdW50IDw9IHRlc3QucmV0cnlDb3VudCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGDwn5SEIOODhuOCueODiOODquODiOODqeOCpDogJHt0ZXN0LnRlc3ROYW1lfSAoJHtyZXRyeUNvdW50fS8ke3Rlc3QucmV0cnlDb3VudH0pYCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5kZWxheSgxMDAwICogcmV0cnlDb3VudCk7IC8vIOaMh+aVsOODkOODg+OCr+OCquODlVxuICAgICAgICB9XG5cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHJ5Q291bnQrKztcbiAgICAgICAgXG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICB0ZXN0SWQ6IHRlc3QudGVzdElkLFxuICAgICAgICAgIHRlc3ROYW1lOiB0ZXN0LnRlc3ROYW1lLFxuICAgICAgICAgIGNhdGVnb3J5OiB0ZXN0LmNhdGVnb3J5LFxuICAgICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSh0ZXN0U3RhcnRUaW1lKSxcbiAgICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHRlc3RTdGFydFRpbWUsXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChyZXRyeUNvdW50IDw9IHRlc3QucmV0cnlDb3VudCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGDwn5SEIOODhuOCueODiOODquODiOODqeOCpCAo44Ko44Op44O8KTogJHt0ZXN0LnRlc3ROYW1lfSAoJHtyZXRyeUNvdW50fS8ke3Rlc3QucmV0cnlDb3VudH0pYCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5kZWxheSgxMDAwICogcmV0cnlDb3VudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDntZDmnpzjga7mnIDntYLoqK3lrppcbiAgICByZXN1bHQhLmVuZFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgIHJlc3VsdCEuZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gdGVzdFN0YXJ0VGltZTtcblxuICAgIC8vIOe1kOaenOOBruS/neWtmFxuICAgIGlmICh0aGlzLmN1cnJlbnRFeGVjdXRpb24pIHtcbiAgICAgIHRoaXMuY3VycmVudEV4ZWN1dGlvbi5yZXN1bHRzLnNldCh0ZXN0LnRlc3RJZCwgcmVzdWx0ISk7XG4gICAgfVxuXG4gICAgLy8g44Ki44Kv44OG44Kj44OW44OG44K544OI44Gu55m76Yyy6Kej6ZmkXG4gICAgdGhpcy5lbWVyZ2VuY3lTdG9wTWFuYWdlci51bnJlZ2lzdGVyQWN0aXZlVGVzdCh0ZXN0LnRlc3RJZCk7XG5cbiAgICAvLyDntZDmnpzjga7jg63jgrDlh7rliptcbiAgICBpZiAocmVzdWx0IS5zdWNjZXNzKSB7XG4gICAgICBjb25zb2xlLmxvZyhg4pyFIOODhuOCueODiOaIkOWKnzogJHt0ZXN0LnRlc3ROYW1lfSAoJHtyZXN1bHQhLmR1cmF0aW9ufW1zKWApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKGDinYwg44OG44K544OI5aSx5pWXOiAke3Rlc3QudGVzdE5hbWV9IC0gJHtyZXN1bHQhLmVycm9yfWApO1xuICAgIH1cblxuICAgIHRoaXMuZW1pdCgndGVzdENvbXBsZXRlZCcsIHJlc3VsdCEpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCv+OCpOODoOOCouOCpuODiFByb21pc2Xjga7kvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlVGltZW91dFByb21pc2UodGltZW91dDogbnVtYmVyLCB0ZXN0SWQ6IHN0cmluZyk6IFByb21pc2U8VGVzdFJlc3VsdD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgoXywgcmVqZWN0KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgVGVzdCB0aW1lb3V0IGFmdGVyICR7dGltZW91dH1tczogJHt0ZXN0SWR9YCkpO1xuICAgICAgfSwgdGltZW91dCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog44K744Oe44OV44Kp44Gu5Y+W5b6XXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGFjcXVpcmVTZW1hcGhvcmUoc2VtYXBob3JlOiBhbnlbXSk6IFByb21pc2U8KCkgPT4gdm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgdHJ5QWNxdWlyZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBzZW1hcGhvcmUuZmluZEluZGV4KHNsb3QgPT4gc2xvdCA9PT0gbnVsbCk7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICBzZW1hcGhvcmVbaW5kZXhdID0gdHJ1ZTtcbiAgICAgICAgICByZXNvbHZlKCgpID0+IHtcbiAgICAgICAgICAgIHNlbWFwaG9yZVtpbmRleF0gPSBudWxsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFRpbWVvdXQodHJ5QWNxdWlyZSwgMTApO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdHJ5QWNxdWlyZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOmBheW7tuWHpueQhlxuICAgKi9cbiAgcHJpdmF0ZSBkZWxheShtczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIOWun+ihjOe1seioiOOBruabtOaWsFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVFeGVjdXRpb25TdGF0aXN0aWNzKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jdXJyZW50RXhlY3V0aW9uKSByZXR1cm47XG5cbiAgICBjb25zdCByZXN1bHRzID0gQXJyYXkuZnJvbSh0aGlzLmN1cnJlbnRFeGVjdXRpb24ucmVzdWx0cy52YWx1ZXMoKSk7XG4gICAgY29uc3Qgc3RhdHMgPSB0aGlzLmN1cnJlbnRFeGVjdXRpb24uc3RhdGlzdGljcztcblxuICAgIHN0YXRzLmNvbXBsZXRlZFRlc3RzID0gcmVzdWx0cy5sZW5ndGg7XG4gICAgc3RhdHMucGFzc2VkVGVzdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIHN0YXRzLmZhaWxlZFRlc3RzID0gcmVzdWx0cy5maWx0ZXIociA9PiAhci5zdWNjZXNzICYmIHIuc3RhdHVzICE9PSBUZXN0RXhlY3V0aW9uU3RhdHVzLlNLSVBQRUQpLmxlbmd0aDtcbiAgICBzdGF0cy5za2lwcGVkVGVzdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3RhdHVzID09PSBUZXN0RXhlY3V0aW9uU3RhdHVzLlNLSVBQRUQpLmxlbmd0aDtcbiAgICBzdGF0cy50b3RhbER1cmF0aW9uID0gcmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5kdXJhdGlvbiwgMCk7XG4gICAgc3RhdHMuYXZlcmFnZUR1cmF0aW9uID0gc3RhdHMuY29tcGxldGVkVGVzdHMgPiAwID8gc3RhdHMudG90YWxEdXJhdGlvbiAvIHN0YXRzLmNvbXBsZXRlZFRlc3RzIDogMDtcbiAgICBzdGF0cy5zdWNjZXNzUmF0ZSA9IHN0YXRzLmNvbXBsZXRlZFRlc3RzID4gMCA/IHN0YXRzLnBhc3NlZFRlc3RzIC8gc3RhdHMuY29tcGxldGVkVGVzdHMgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIOePvuWcqOOBruWun+ihjOe1seioiOOCkuWPluW+l1xuICAgKi9cbiAgZ2V0Q3VycmVudEV4ZWN1dGlvblN0YXRpc3RpY3MoKTogRXhlY3V0aW9uU3RhdGlzdGljcyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRFeGVjdXRpb24/LnN0YXRpc3RpY3MgfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiDmjqXntprnrqHnkIbjgrfjgrnjg4bjg6Djga7lj5blvpdcbiAgICovXG4gIGdldENvbm5lY3Rpb25NYW5hZ2VyKCk6IFByb2R1Y3Rpb25Db25uZWN0aW9uTWFuYWdlciB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbk1hbmFnZXI7XG4gIH1cblxuICAvKipcbiAgICog57eK5oCl5YGc5q2i566h55CG44K344K544OG44Og44Gu5Y+W5b6XXG4gICAqL1xuICBnZXRFbWVyZ2VuY3lTdG9wTWFuYWdlcigpOiBFbWVyZ2VuY3lTdG9wTWFuYWdlciB7XG4gICAgcmV0dXJuIHRoaXMuZW1lcmdlbmN5U3RvcE1hbmFnZXI7XG4gIH1cblxuICAvKipcbiAgICog6Kit5a6a44Gu5Y+W5b6XXG4gICAqL1xuICBnZXRDb25maWcoKTogUHJvZHVjdGlvbkNvbmZpZyB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnO1xuICB9XG5cbiAgLyoqXG4gICAqIOe3iuaApeWBnOatouOBruimgeaxglxuICAgKi9cbiAgYXN5bmMgcmVxdWVzdEVtZXJnZW5jeVN0b3AocmVhc29uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmVtZXJnZW5jeVN0b3BNYW5hZ2VyLmluaXRpYXRlRW1lcmdlbmN5U3RvcChcbiAgICAgIEVtZXJnZW5jeVN0b3BSZWFzb24uTUFOVUFMX1JFUVVFU1QsXG4gICAgICByZWFzb24sXG4gICAgICAnUHJvZHVjdGlvblRlc3RFbmdpbmUnXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kg5pys55Wq55Kw5aKD44OG44K544OI44Ko44Oz44K444Oz44KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgLy8g57eK5oCl5YGc5q2i566h55CG44K344K544OG44Og44Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAgICBhd2FpdCB0aGlzLmVtZXJnZW5jeVN0b3BNYW5hZ2VyLmNsZWFudXAoKTtcblxuICAgICAgLy8g5o6l57aa566h55CG44K344K544OG44Og44Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAgICBhd2FpdCB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLmNsZWFudXAoKTtcblxuICAgICAgLy8g5a6f6KGM54q25oWL44Gu44Kv44Oq44KiXG4gICAgICB0aGlzLmN1cnJlbnRFeGVjdXRpb24gPSBudWxsO1xuICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgIC8vIOOCpOODmeODs+ODiOODquOCueODiuODvOOBruWJiumZpFxuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcblxuICAgICAgY29uc29sZS5sb2coJ+KchSDmnKznlarnkrDlooPjg4bjgrnjg4jjgqjjg7Pjgrjjg7Pjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44Kv44Oq44O844Oz44Ki44OD44OX44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcm9kdWN0aW9uVGVzdEVuZ2luZTsiXX0=