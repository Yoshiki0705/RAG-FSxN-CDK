/**
 * 認証システムテストモジュール
 *
 * 実本番Amazon Cognitoユーザープールでの認証テスト機能を提供
 * セッション管理、MFA、認証フローの完全性を検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * 認証テスト結果インターフェース
 */
export interface AuthTestResult extends TestResult {
    authDetails?: {
        accessToken?: string;
        idToken?: string;
        refreshToken?: string;
        tokenType?: string;
        expiresIn?: number;
        sessionId?: string;
    };
    sessionDetails?: {
        sessionCreated: boolean;
        sessionValid: boolean;
        sessionExpiry?: Date;
    };
    mfaDetails?: {
        mfaRequired: boolean;
        mfaCompleted: boolean;
        challengeType?: string;
    };
}
/**
 * テストユーザー情報
 */
export interface TestUser {
    username: string;
    password: string;
    email?: string;
    mfaEnabled?: boolean;
    expectedPermissions?: string[];
    userGroup?: string;
}
/**
 * 認証システムテストモジュールクラス
 */
export declare class AuthenticationTestModule {
    private config;
    private cognitoClient;
    private dynamoClient;
    private testUsers;
    private sidAuthModule;
    private multiRegionAuthModule;
    constructor(config: ProductionConfig);
    /**
      * テストユーザーの読み込み
      */
    private loadTestUsers;
    /**
     * 有効な認証情報での認証成功テスト
     */
    testValidAuthentication(): Promise<AuthTestResult>;
    /**
     * 無効な認証情報での認証拒否テスト
     */
    testInvalidAuthentication(): Promise<AuthTestResult>; /**
  
     * セッション管理テスト
     */
    testSessionManagement(): Promise<AuthTestResult>;
    /**
     * MFA機能テスト
     */
    testMFAAuthentication(): Promise<AuthTestResult>; /**
  
     * セッション作成テスト
     */
    private testSessionCreation;
    /**
     * セッション検証テスト
     */
    private testSessionValidation;
    /**
     * セッション終了テスト
     */
    private testSessionTermination;
    /**
     * 認証フロー完全性テスト
     */
    testAuthenticationFlow(): Promise<AuthTestResult>;
    /**
     * 認証実行ヘルパー
     */
    private performAuthentication;
    /**
     * ユーザー情報取得ヘルパー
     */
    private getUserInfo;
    /**
     * トークン更新テスト
     */
    private testTokenRefresh;
    /**
     * 全認証テストの実行（統合版）
     */
    runAllAuthenticationTests(): Promise<AuthTestResult[]>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default AuthenticationTestModule;
