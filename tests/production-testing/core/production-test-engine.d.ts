/**
 * 本番環境テスト実行エンジン
 *
 * 実本番AWSリソースでのテスト実行を安全に管理
 * 読み取り専用モードでの実行制御と緊急停止機能を提供
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { EventEmitter } from 'events';
import ProductionConnectionManager from './production-connection-manager';
import EmergencyStopManager from './emergency-stop-manager';
import { ProductionConfig } from '../config/production-config';
/**
 * テスト実行状態
 */
export declare enum TestExecutionStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    STOPPED = "STOPPED",
    SKIPPED = "SKIPPED"
}
/**
 * テスト結果インターフェース
 */
export interface TestResult {
    testId: string;
    testName: string;
    category: string;
    status: TestExecutionStatus;
    startTime: Date;
    endTime?: Date;
    duration: number;
    success: boolean;
    error?: string;
    metrics?: any;
    metadata?: any;
}
/**
 * テストスイートインターフェース
 */
export interface TestSuite {
    suiteId: string;
    suiteName: string;
    description: string;
    tests: TestDefinition[];
    configuration: TestSuiteConfig;
}
/**
 * テスト定義インターフェース
 */
export interface TestDefinition {
    testId: string;
    testName: string;
    category: string;
    description: string;
    timeout: number;
    retryCount: number;
    dependencies: string[];
    execute: (engine: ProductionTestEngine) => Promise<TestResult>;
}
/**
 * テストスイート設定
 */
export interface TestSuiteConfig {
    parallel: boolean;
    maxConcurrency: number;
    failFast: boolean;
    continueOnError: boolean;
}
/**
 * 実行統計
 */
export interface ExecutionStatistics {
    totalTests: number;
    completedTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    averageDuration: number;
    successRate: number;
}
/**
 * 本番環境テスト実行エンジンクラス
 */
export declare class ProductionTestEngine extends EventEmitter {
    private config;
    private connectionManager;
    private emergencyStopManager;
    private isInitialized;
    private currentExecution;
    constructor(config: ProductionConfig);
    /**
     * イベントハンドラーの設定
     */
    private setupEventHandlers;
    /**
     * エンジンの初期化
     */
    initialize(): Promise<void>;
    /**
     * 設定の検証
     */
    private validateConfiguration;
    /**
     * 安全性制約の確認
     */
    private validateSafetyConstraints;
    /**
     * テストスイートの実行
     */
    executeTestSuite(testSuite: TestSuite): Promise<Map<string, TestResult>>;
    /**
     * テストの並列実行
     */
    private executeTestsInParallel;
    /**
     * テストの順次実行
     */
    private executeTestsSequentially;
    /**
     * 個別テストの実行
     */
    private executeIndividualTest;
    /**
     * タイムアウトPromiseの作成
     */
    private createTimeoutPromise;
    /**
     * セマフォの取得
     */
    private acquireSemaphore;
    /**
     * 遅延処理
     */
    private delay;
    /**
     * 実行統計の更新
     */
    private updateExecutionStatistics;
    /**
     * 現在の実行統計を取得
     */
    getCurrentExecutionStatistics(): ExecutionStatistics | null;
    /**
     * 接続管理システムの取得
     */
    getConnectionManager(): ProductionConnectionManager;
    /**
     * 緊急停止管理システムの取得
     */
    getEmergencyStopManager(): EmergencyStopManager;
    /**
     * 設定の取得
     */
    getConfig(): ProductionConfig;
    /**
     * 緊急停止の要求
     */
    requestEmergencyStop(reason: string): Promise<void>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default ProductionTestEngine;
