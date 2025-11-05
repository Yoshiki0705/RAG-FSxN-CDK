/**
 * 認証テスト実行ランナー
 *
 * 実本番Cognitoでの認証テストを安全に実行
 * テスト結果の収集と報告を行う
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { AuthTestResult } from './authentication-test-module';
import ProductionTestEngine, { TestSuite } from '../../core/production-test-engine';
import { ProductionConfig } from '../../config/production-config';
/**
 * 認証テスト実行ランナークラス
 */
export declare class AuthenticationTestRunner {
    private config;
    private testModule;
    private testEngine;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * 認証テストスイートの作成
     */
    createAuthenticationTestSuite(): TestSuite;
    /**
     * 認証テストの実行
     */
    runAuthenticationTests(): Promise<{
        success: boolean;
        results: Map<string, AuthTestResult>;
        summary: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
            skippedTests: number;
            successRate: number;
            totalDuration: number;
        };
    }>;
    /**
     * テスト結果サマリーの生成
     */
    private generateTestSummary;
    /**
     * 詳細レポートの生成
     */
    generateDetailedReport(results: Map<string, AuthTestResult>): Promise<string>;
    /**
     * SIDベース認証テストの実行
     */
    private executeSIDAuthenticationTests;
    /**
     * マルチリージョン認証テストの実行
     */
    private executeMultiRegionAuthTests;
    /**
     * 失敗結果の作成ヘルパー
     */
    private createFailureResult;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default AuthenticationTestRunner;
