/**
 * アクセス権限テストモジュール統合エクスポート
 *
 * 実本番IAM/OpenSearchでの権限ベースアクセス制御テスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
export { default as AccessControlTestModule } from './access-control-test-module';
export { default as AccessControlTestRunner } from './access-control-test-runner';
export type { AccessControlTestResult, TestUserPermissions, DocumentAccessInfo } from './access-control-test-module';
export declare const ACCESS_CONTROL_TEST_CATEGORIES: {
    readonly AUTHORIZED_ACCESS: "authorized-access";
    readonly UNAUTHORIZED_ACCESS: "unauthorized-access";
    readonly ADMIN_PERMISSIONS: "admin-permissions";
    readonly MULTI_GROUP_PERMISSIONS: "multi-group-permissions";
    readonly IAM_ROLE_ACCESS: "iam-role-access";
};
export declare const ACCESS_CONTROL_TEST_PRIORITIES: {
    readonly CRITICAL: "critical";
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
};
export declare const SECURITY_SCORE_THRESHOLDS: {
    readonly EXCELLENT: 0.9;
    readonly GOOD: 0.7;
    readonly NEEDS_IMPROVEMENT: 0.5;
};
