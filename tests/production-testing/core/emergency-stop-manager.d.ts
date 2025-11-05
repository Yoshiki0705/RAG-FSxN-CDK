/**
 * 緊急停止管理システム
 *
 * 本番環境テスト実行中の異常検出時に安全な緊急停止を実行
 * データ整合性を保ちながらテストを中断し、システムを安全な状態に戻す
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { EventEmitter } from 'events';
import { ProductionConfig } from '../config/production-config';
/**
 * 緊急停止理由の列挙
 */
export declare enum EmergencyStopReason {
    DATA_INTEGRITY_VIOLATION = "DATA_INTEGRITY_VIOLATION",
    RESOURCE_OVERLOAD = "RESOURCE_OVERLOAD",
    SECURITY_BREACH = "SECURITY_BREACH",
    UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
    MANUAL_REQUEST = "MANUAL_REQUEST",
    TIMEOUT_EXCEEDED = "TIMEOUT_EXCEEDED",
    RESOURCE_UNAVAILABLE = "RESOURCE_UNAVAILABLE"
}
/**
 * 緊急停止状態インターフェース
 */
export interface EmergencyStopState {
    isActive: boolean;
    reason: EmergencyStopReason;
    timestamp: Date;
    initiatedBy: string;
    affectedTests: string[];
    recoveryActions: string[];
}
/**
 * 実行中テスト情報
 */
export interface ActiveTest {
    testId: string;
    testName: string;
    startTime: Date;
    category: string;
    status: 'running' | 'stopping' | 'stopped';
    resourcesInUse: string[];
}
/**
 * 緊急停止管理クラス
 */
export declare class EmergencyStopManager extends EventEmitter {
    private config;
    private cloudWatchClient;
    private stopState;
    private activeTests;
    private stopInProgress;
    private recoveryCallbacks;
    constructor(config: ProductionConfig);
    /**
     * イベントリスナーの設定
     */
    private setupEventListeners;
    /**
     * 緊急停止の開始
     */
    initiateEmergencyStop(reason: EmergencyStopReason, details: string, initiatedBy?: string): Promise<void>;
    /**
     * 実行中テストの安全な停止
     */
    private stopActiveTests;
    /**
     * 個別テストの停止処理
     */
    private stopIndividualTest;
    /**
     * 認証テストの停止
     */
    private stopAuthenticationTest;
    /**
     * AI応答テストの停止
     */
    private stopAIResponseTest;
    /**
     * パフォーマンステストの停止
     */
    private stopPerformanceTest;
    /**
     * UI/UXテストの停止
     */
    private stopUIUXTest;
    /**
     * 汎用テストの停止
     */
    private stopGenericTest;
    /**
     * リソースの安全な切断
     */
    private disconnectResources;
    /**
     * データ整合性の確認
     */
    private verifyDataIntegrity;
    /**
     * 復旧アクションの実行
     */
    private executeRecoveryActions;
    /**
     * 管理者への通知
     */
    private notifyAdministrators;
    /**
     * 緊急停止メトリクスの送信
     */
    private sendEmergencyStopMetrics;
    /**
     * テストの登録
     */
    registerActiveTest(test: ActiveTest): void;
    /**
     * テストの登録解除
     */
    unregisterActiveTest(testId: string): void;
    /**
     * 復旧コールバックの登録
     */
    registerRecoveryCallback(callback: () => Promise<void>): void;
    /**
     * 緊急停止状態の取得
     */
    getEmergencyStopState(): EmergencyStopState | null;
    /**
     * 緊急停止状態のリセット
     */
    resetEmergencyStopState(): void;
    /**
     * アクティブテスト一覧の取得
     */
    getActiveTests(): ActiveTest[];
    /**
     * 緊急停止が有効かどうかの確認
     */
    isEmergencyStopActive(): boolean;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default EmergencyStopManager;
