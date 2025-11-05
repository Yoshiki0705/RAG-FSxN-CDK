/**
 * アクセス権限テスト実行ランナー
 *
 * 実本番IAM/OpenSearchでのアクセス権限テストを安全に実行
 * テスト結果の収集と報告を行う
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { AccessControlTestResult } from './access-control-test-module';
import ProductionTestEngine, { TestSuite } from '../../core/production-test-engine';
import { ProductionConfig } from '../../config/production-config';
/**
 * アクセス権限テスト実行ランナークラス
 */
export declare class AccessControlTestRunner {
    private config;
    private testModule;
    private testEngine;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * アクセス権限テストスイートの作成
     */
    createAccessControlTestSuite(): TestSuite;
    /**
     * アクセス権限テストの実行
     */
    runAccessControlTests(): Promise<{
        success: boolean;
        results: Map<string, AccessControlTestResult>;
        summary: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
            skippedTests: number;
            successRate: number;
            totalDuration: number;
            securityScore: number;
        };
    }>;
    /**
     * テスト結果サマリーの生成
     */
    private generateTestSummary;
    /**
     * セキュリティスコアの計算
     */
    private calculateSecurityScore;
    /**
     * 詳細レポートの生成
     */
    generateDetailedReport(results: Map<string, AccessControlTestResult>): Promise<string>;
    /**
     * 推奨事項の生成
     */
    private generateRecommendations;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default AccessControlTestRunner;
