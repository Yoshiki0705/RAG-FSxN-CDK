/**
 * 権限フィルタリングテストモジュール
 *
 * ユーザー権限に基づく文書アクセス制御を検証
 * 実本番環境での権限認識型RAG機能をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * 権限フィルタリングテスト結果
 */
export interface PermissionFilteringTestResult extends TestResult {
    permissionMetrics?: {
        accessControlAccuracy: number;
        unauthorizedBlocking: number;
        authorizedAccess: number;
        roleBasedFiltering: number;
    };
    securityAnalysis?: {
        dataLeakagePrevention: number;
        privilegeEscalationPrevention: number;
        auditTrailCompleteness: number;
        complianceScore: number;
    };
}
/**
 * ユーザー権限定義
 */
export interface UserPermission {
    userId: string;
    role: 'admin' | 'manager' | 'employee' | 'guest';
    department: string;
    accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
    documentCategories: string[];
    specialPermissions: string[];
}
/**
 * 文書権限定義
 */
export interface DocumentPermission {
    documentId: string;
    title: string;
    category: string;
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    requiredRole: string[];
    requiredDepartment: string[];
    specialRequirements: string[];
}
/**
 * 権限テストケース
 */
export interface PermissionTestCase {
    id: string;
    scenario: string;
    user: UserPermission;
    query: string;
    expectedAccessibleDocs: string[];
    expectedBlockedDocs: string[];
    testType: 'positive' | 'negative' | 'boundary';
}
/**
 * 権限フィルタリングテストモジュール
 */
export declare class PermissionFilteringTestModule {
    private config;
    private dynamoClient;
    private testCases;
    private testUsers;
    private testDocuments;
    private permissionCache;
    constructor(config: ProductionConfig);
    /**
     * テストユーザーの読み込み
     */
    private loadTestUsers;
    /**
     * テスト文書の読み込み
     */
    private loadTestDocuments;
    /**
     * 権限テストケースの読み込み
     */
    private loadPermissionTestCases;
    /**
     * 包括的権限フィルタリングテスト
     */
    testComprehensivePermissionFiltering(): Promise<PermissionFilteringTestResult>;
    /**
     * 個別権限テストの実行
     */
    private executePermissionTest;
    /**
     * 権限フィルタリング適用
     */
    private applyPermissionFilter;
    /**
     * 文書アクセス権限チェック
     */
    private checkDocumentAccess;
    /**
     * 文書アクセス検証
     */
    private validateDocumentAccess;
    /**
     * セキュリティコンプライアンス検証
     */
    private validateSecurityCompliance;
    /**
     * 権限メトリクス計算
     */
    private calculatePermissionMetrics;
    /**
     * セキュリティ分析計算
     */
    private calculateSecurityAnalysis;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default PermissionFilteringTestModule;
