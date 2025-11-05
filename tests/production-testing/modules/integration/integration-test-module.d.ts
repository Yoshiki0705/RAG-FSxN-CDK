/**
 * 統合テストモジュール
 *
 * 実本番環境でのエンドツーエンド統合テスト機能を提供
 * ユーザーフロー、外部システム連携、障害時フォールバック機能のテストを実行
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import ProductionTestEngine, { TestResult } from '../../core/production-test-engine';
/**
 * 統合テスト結果インターフェース
 */
export interface IntegrationTestResult extends TestResult {
    integrationMetrics: {
        userFlowSuccess: boolean;
        externalSystemsConnected: number;
        dataFlowConsistency: boolean;
        failoverMechanismsWorking: boolean;
        overallIntegrationScore: number;
        endToEndLatency: number;
        systemReliability: number;
    };
    detailedResults: {
        userFlowTests?: Map<string, any>;
        externalSystemTests?: Map<string, any>;
        failoverTests?: Map<string, any>;
    };
}
/**
 * 統合テストモジュールクラス
 */
export declare class IntegrationTestModule {
    private config;
    private testEngine;
    private integrationConfig;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * 統合テストの初期化
     */
    initialize(): Promise<void>;
    /**
     * 統合テストの実行
     */
    runIntegrationTests(): Promise<IntegrationTestResult>;
    /**
     * 完全ユーザーフローテストの実行
     */
    private runUserFlowTests;
    /**
     * 外部システム連携テストの実行
     */
    private runExternalSystemIntegrationTests;
    /**
       * 障害時フォールバック機能テストの実行
       */
    private runFailoverTests;
    /**
     * ユーザーフローシナリオの実行
     */
    private executeUserFlowScenario;
    /**
     * ホームページへのナビゲーション
     */
    private navigateToHomepage;
    /**
     * ページロードの検証
     */
    private verifyPageLoad;
    /**
     * チャットインターフェースへのアクセス
     */
    private accessChatInterface;
    /**
     * 基本的な質問の送信
     */
    private sendBasicQuestion;
    /**
     * 応答の受信
     */
    private receiveResponse;
    /**
     * 応答品質の検証
     */
    private verifyResponseQuality;
    /**
     * ログインの開始
     */
    private initiateLogin;
    /**
     * ユーザー認証
     */
    private authenticateUser;
    /**
     * 認証の検証
     */
    private verifyAuthentication;
    /**
     * 保護されたコンテンツへのアクセス
     */
    private accessProtectedContent;
    /**
     * 認証済み質問の送信
     */
    private sendAuthenticatedQuestion;
    /**
     * パーソナライズされた応答の受信
     */
    private receivePersonalizedResponse;
    /**
     * アクセス制御の検証
     */
    private verifyAccessControl;
    /**
     * ユーザーのログアウト
     */
    private logoutUser;
    /**
     * セッション管理テスト
     */
    private testSessionManagement;
    /**
     * セッション作成テスト
     */
    private testSessionCreation;
    /**
     * セッション永続化テスト
     */
    private testSessionPersistence;
    /**
     * セッション有効期限テスト
     */
    private testSessionExpiration;
    /**
     * 同時セッションテスト
     */
    private testConcurrentSessions;
}
