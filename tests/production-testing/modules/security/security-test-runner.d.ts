/**
 * セキュリティテストランナー
 *
 * セキュリティテストモジュールの実行を管理
 * 実本番環境でのセキュリティテストの統合実行機能を提供
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import ProductionTestEngine from '../../core/production-test-engine';
import { SecurityTestResult } from './security-test-module';
/**
 * セキュリティテストランナークラス
 */
export declare class SecurityTestRunner {
    private config;
    private testEngine;
    private emergencyStopManager?;
    private securityModule?;
    private securityConfig;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * セキュリティテストランナーの初期化
     */
    initialize(): Promise<void>;
    /**
     * セキュリティテストの実行
     */
    runSecurityTests(): Promise<{
        success: boolean;
        results: Map<string, SecurityTestResult>;
        summary: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
            skippedTests: number;
            overallSecurityScore: number;
            criticalIssues: number;
            recommendations: string[];
        };
        errors?: string[];
    }>;
    /**
     * 個別セキュリティテストの実行
     */
    private runIndividualSecurityTests;
    /**
     * HTTPS暗号化テストの実行
     */
    private runHttpsEncryptionTest;
    /**
     * 攻撃耐性テストの実行
     */
    private runAttackResistanceTest;
    /**
     * セキュリティ監視テストの実行
     */
    private runSecurityMonitoringTest;
    /**
     * エンドツーエンド暗号化テストの実行
     */
    private runEndToEndEncryptionTest;
    /**
     * 認証・認可テストの実行
     */
    private runAuthenticationAuthorizationTest;
    /**
     * セキュリティテスト結果の分析
     */
    private analyzeSecurityResults;
    /**
     * セキュリティ推奨事項の生成
     */
    private generateSecurityRecommendations;
    /**
     * セキュリティテスト設定の表示
     */
    displaySecurityConfig(): void;
    /**
     * セキュリティテスト結果のサマリー表示
     */
    displaySecuritySummary(results: Map<string, SecurityTestResult>): void;
    /**
     * セキュリティテスト結果のエクスポート
     */
    exportSecurityResults(results: Map<string, SecurityTestResult>, outputPath?: string): Promise<void>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default SecurityTestRunner;
