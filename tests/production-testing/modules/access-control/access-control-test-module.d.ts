/**
 * アクセス権限テストモジュール
 *
 * 実本番IAMロールとOpenSearch Serverlessでの権限ベースアクセス制御テスト
 * 文書レベルアクセス権限、グループベース権限システムの検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * アクセス権限テスト結果インターフェース
 */
export interface AccessTestResult extends TestResult {
    accessDetails?: {
        hasAccess: boolean;
        permissionLevel: string;
        allowedResources: string[];
        deniedResources: string[];
    };
    userDetails?: {
        userId: string;
        username: string;
        groups: string[];
        permissions: string[];
    };
    searchResults?: {
        totalDocuments: number;
        accessibleDocuments: number;
        restrictedDocuments: number;
        searchQuery: string;
    };
}
/**
 * テストユーザー権限情報
 */
export interface TestUserPermissions {
    userId: string;
    username: string;
    groups: string[];
    permissions: string[];
    expectedAccess: {
        documents: string[];
        operations: string[];
    };
    restrictedAccess: {
        documents: string[];
        operations: string[];
    };
}
/**
 * 文書アクセステストケース
 */
export interface DocumentAccessTestCase {
    documentId: string;
    documentTitle: string;
    requiredPermissions: string[];
    allowedGroups: string[];
    testUsers: {
        userId: string;
        expectedAccess: boolean;
        reason: string;
    }[];
}
/**
 * アクセス権限テストモジュールクラス
 */
export declare class AccessControlTestModule {
    private config;
    private openSearchClient;
    private iamClient;
    private stsClient;
    private dynamoClient;
    private testUsers;
    private testDocuments;
    constructor(config: ProductionConfig); /**
     *
   テストユーザーの読み込み
     */
    private loadTestUsers;
    /**
     * テスト文書の読み込み
     */
    private loadTestDocuments;
    /**
     * 権限を持つユーザーの文書アクセステスト
     */
    testAuthorizedDocumentAccess(): Promise<AccessTestResult>;
    /**
     * 権限を持たないユーザーのアクセス拒否テスト
     */
    testUnauthorizedDocumentAccess(): Promise<AccessTestResult>; /**
  
     * 管理者権限テスト
     */
    testAdministratorAccess(): Promise<AccessTestResult>;
    /**
     * 動的権限変更テスト
     */
    testDynamicPermissionChange(): Promise<AccessTestResult>;
}
