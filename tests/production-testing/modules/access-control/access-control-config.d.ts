/**
 * アクセス権限テスト設定
 *
 * 実本番環境でのアクセス権限テストに関する設定を管理
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * アクセス権限テスト設定インターフェース
 */
export interface AccessControlTestConfig {
    execution: {
        timeout: number;
        retryCount: number;
        maxConcurrency: number;
        failFast: boolean;
    };
    testUsers: {
        enabledUsers: string[];
        adminUser?: string;
        readOnlyUser?: string;
        multiGroupUser?: string;
    };
    testDocuments: {
        enabledDocuments: string[];
        publicDocuments: string[];
        restrictedDocuments: string[];
        confidentialDocuments: string[];
    };
    security: {
        enableRealTimeValidation: boolean;
        logAccessAttempts: boolean;
        alertOnUnauthorizedAccess: boolean;
        maxFailedAttempts: number;
    };
    reporting: {
        generateDetailedReport: boolean;
        includeMetadata: boolean;
        exportFormat: 'json' | 'markdown' | 'both';
        saveToFile: boolean;
    };
}
/**
 * デフォルトアクセス権限テスト設定
 */
export declare const defaultAccessControlTestConfig: AccessControlTestConfig;
/**
 * 本番環境用アクセス権限テスト設定
 */
export declare const productionAccessControlTestConfig: AccessControlTestConfig;
/**
 * 開発環境用アクセス権限テスト設定
 */
export declare const developmentAccessControlTestConfig: AccessControlTestConfig;
/**
 * 環境に応じた設定の取得
 */
export declare function getAccessControlTestConfig(environment: string): AccessControlTestConfig;
/**
 * テストユーザーグループ定義
 */
export declare const TEST_USER_GROUPS: {
    readonly ADMINS: "admins";
    readonly USERS: "users";
    readonly READONLY_USERS: "readonly-users";
    readonly ENGINEERING: "engineering";
    readonly SECURITY: "security";
};
/**
 * 文書セキュリティレベル定義
 */
export declare const DOCUMENT_SECURITY_LEVELS: {
    readonly PUBLIC: "public";
    readonly INTERNAL: "internal";
    readonly CONFIDENTIAL: "confidential";
    readonly RESTRICTED: "restricted";
};
/**
 * 権限レベル定義
 */
export declare const PERMISSION_LEVELS: {
    readonly NONE: "none";
    readonly READ: "read";
    readonly WRITE: "write";
    readonly ADMIN: "admin";
};
/**
 * アクセス権限テスト結果の評価基準
 */
export declare const ACCESS_CONTROL_EVALUATION_CRITERIA: {
    SECURITY_WEIGHTS: {
        UNAUTHORIZED_ACCESS_PREVENTION: number;
        AUTHORIZED_ACCESS_GUARANTEE: number;
        ADMIN_PERMISSIONS: number;
        MULTI_GROUP_INTEGRATION: number;
        IAM_ROLE_COMPLIANCE: number;
    };
    SUCCESS_RATE_THRESHOLDS: {
        EXCELLENT: number;
        GOOD: number;
        ACCEPTABLE: number;
        NEEDS_IMPROVEMENT: number;
    };
    SECURITY_SCORE_THRESHOLDS: {
        EXCELLENT: number;
        GOOD: number;
        ACCEPTABLE: number;
        CRITICAL: number;
    };
};
declare const _default: {
    defaultAccessControlTestConfig: AccessControlTestConfig;
    productionAccessControlTestConfig: AccessControlTestConfig;
    developmentAccessControlTestConfig: AccessControlTestConfig;
    getAccessControlTestConfig: typeof getAccessControlTestConfig;
    TEST_USER_GROUPS: {
        readonly ADMINS: "admins";
        readonly USERS: "users";
        readonly READONLY_USERS: "readonly-users";
        readonly ENGINEERING: "engineering";
        readonly SECURITY: "security";
    };
    DOCUMENT_SECURITY_LEVELS: {
        readonly PUBLIC: "public";
        readonly INTERNAL: "internal";
        readonly CONFIDENTIAL: "confidential";
        readonly RESTRICTED: "restricted";
    };
    PERMISSION_LEVELS: {
        readonly NONE: "none";
        readonly READ: "read";
        readonly WRITE: "write";
        readonly ADMIN: "admin";
    };
    ACCESS_CONTROL_EVALUATION_CRITERIA: {
        SECURITY_WEIGHTS: {
            UNAUTHORIZED_ACCESS_PREVENTION: number;
            AUTHORIZED_ACCESS_GUARANTEE: number;
            ADMIN_PERMISSIONS: number;
            MULTI_GROUP_INTEGRATION: number;
            IAM_ROLE_COMPLIANCE: number;
        };
        SUCCESS_RATE_THRESHOLDS: {
            EXCELLENT: number;
            GOOD: number;
            ACCEPTABLE: number;
            NEEDS_IMPROVEMENT: number;
        };
        SECURITY_SCORE_THRESHOLDS: {
            EXCELLENT: number;
            GOOD: number;
            ACCEPTABLE: number;
            CRITICAL: number;
        };
    };
};
export default _default;
