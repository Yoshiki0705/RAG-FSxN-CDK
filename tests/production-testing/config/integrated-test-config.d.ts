/**
 * 統合テスト設定
 * セキュリティ、パフォーマンス、機能テストの統合実行設定
 */
import { IntegratedTestConfig, TestSuiteConfig } from '../integrated-test-runner';
/**
 * 本番環境統合テスト設定
 */
export declare const productionIntegratedTestConfig: IntegratedTestConfig;
/**
 * ステージング環境統合テスト設定
 */
export declare const stagingIntegratedTestConfig: IntegratedTestConfig;
/**
 * 開発環境統合テスト設定
 */
export declare const developmentIntegratedTestConfig: IntegratedTestConfig;
/**
 * CI/CD環境統合テスト設定
 */
export declare const cicdIntegratedTestConfig: IntegratedTestConfig;
/**
 * 環境に応じた設定の取得
 */
export declare function getIntegratedTestConfig(environment: string): IntegratedTestConfig;
/**
 * 統合テスト設定の検証
 */
export declare function validateIntegratedTestConfig(config: IntegratedTestConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * テストスイート設定のマージ
 */
export declare function mergeTestSuiteConfigs(baseConfig: TestSuiteConfig, overrideConfig: Partial<TestSuiteConfig>): TestSuiteConfig;
declare const _default: {
    productionIntegratedTestConfig: IntegratedTestConfig;
    stagingIntegratedTestConfig: IntegratedTestConfig;
    developmentIntegratedTestConfig: IntegratedTestConfig;
    cicdIntegratedTestConfig: IntegratedTestConfig;
    getIntegratedTestConfig: typeof getIntegratedTestConfig;
    validateIntegratedTestConfig: typeof validateIntegratedTestConfig;
    mergeTestSuiteConfigs: typeof mergeTestSuiteConfigs;
};
export default _default;
