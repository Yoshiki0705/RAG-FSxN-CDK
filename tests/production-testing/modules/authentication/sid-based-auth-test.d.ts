/**
 * SIDベース認証テストモジュール
 *
 * testuser, admin, testuser0-49 の認証フローを包括的にテスト
 * 実本番環境でのSIDベース権限管理システムを検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * SIDベース認証テスト結果
 */
export interface SIDAuthTestResult extends TestResult {
    sidDetails?: {
        sid: string;
        userGroup: string;
        permissions: string[];
        documentAccess: string[];
    };
    authenticationDetails?: {
        accessToken?: string;
        userAttributes?: Record<string, string>;
        groupMemberships?: string[];
    };
}
/**
 * SIDテストユーザー定義
 */
export interface SIDTestUser {
    username: string;
    sid: string;
    userType: 'testuser' | 'admin' | 'numbered_testuser';
    expectedGroups: string[];
    expectedPermissions: string[];
    expectedDocumentAccess: string[];
    password?: string;
}
/**
 * SIDベース認証テストモジュール
 */
export declare class SIDBasedAuthTestModule {
    private config;
    private cognitoClient;
    private dynamoClient;
    private sidTestUsers;
    constructor(config: ProductionConfig);
    /**
     * SIDテストユーザーの読み込み
     */
    private loadSIDTestUsers;
    /**
     * SIDベース認証テスト - testuser
     */
    testTestUserAuthentication(): Promise<SIDAuthTestResult>;
    /**
     * SIDベース認証テスト - admin
     */
    testAdminAuthentication(): Promise<SIDAuthTestResult>;
    /**
     * SIDベース認証テスト - testuser0-49 (サンプル)
     */
    testNumberedUserAuthentication(): Promise<SIDAuthTestResult[]>;
    /**
     * SID認証実行
     */
    private performSIDAuthentication;
    /**
     * SID検証
     */
    private validateSID;
    /**
     * ユーザー情報からSIDを抽出
     */
    private extractSIDFromUserInfo;
    /**
     * 権限検証
     */
    private validatePermissions;
    /**
     * グループから権限へのマッピング
     */
    private mapGroupsToPermissions;
    /**
     * 文書アクセス権限検証
     */
    private validateDocumentAccess;
    /**
     * 管理者権限検証
     */
    private validateAdminPrivileges;
    /**
     * 全文書アクセス権限検証
     */
    private validateFullDocumentAccess;
    /**
     * ユーザー固有アクセス検証
     */
    private validateUserSpecificAccess;
    /**
     * ユーザー情報取得ヘルパー
     */
    private getUserInfo;
    /**
     * ユーザーグループ取得ヘルパー
     */
    private getUserGroups;
    /**
     * スキップ結果作成ヘルパー
     */
    private createSkippedResult;
    /**
     * 全SIDベース認証テストの実行
     */
    runAllSIDAuthenticationTests(): Promise<SIDAuthTestResult[]>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default SIDBasedAuthTestModule;
