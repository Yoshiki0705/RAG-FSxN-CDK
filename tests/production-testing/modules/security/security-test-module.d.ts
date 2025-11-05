/**
 * セキュリティテストモジュール
 *
 * 実本番環境でのセキュリティテスト機能を提供
 * HTTPS暗号化、攻撃耐性、セキュリティ監視のテストを実行
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import ProductionTestEngine, { TestResult } from '../../core/production-test-engine';
/**
 * セキュリティテスト結果インターフェース
 */
export interface SecurityTestResult extends TestResult {
    securityMetrics: {
        httpsCompliance: boolean;
        certificateValid: boolean;
        securityHeadersPresent: boolean;
        wafProtectionActive: boolean;
        attacksBlocked: number;
        vulnerabilitiesFound: number;
        securityScore: number;
    };
    detailedResults: {
        httpsEncryption?: Map<string, any>;
        attackResistance?: Map<string, any>;
        securityMonitoring?: Map<string, any>;
    };
}
/**
 * セキュリティテストモジュールクラス
 */
export declare class SecurityTestModule {
    private config;
    private testEngine;
    private securityConfig;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * セキュリティテストの初期化
     */
    initialize(): Promise<void>;
    /**
     * セキュリティテストの実行
     */
    runSecurityTests(): Promise<SecurityTestResult>;
    /**
       * HTTPS暗号化テストの実行
       */
    private runHttpsEncryptionTests;
    /**
     * 攻撃耐性テストの実行
     */
    private runAttackResistanceTests;
    /**
     * セキュリティ監視テストの実行
     */
    private runSecurityMonitoringTests;
    /**
     * HTTPSリダイレクトテスト
     */
    private testHttpsRedirect;
    /**
     * TLS証明書検証テスト
     */
    private testTlsCertificate;
    /**
     * セキュリティヘッダーテスト
     */
    private testSecurityHeaders;
    /**
     * 暗号化プロトコルテスト
     */
    private testEncryptionProtocols;
    /**
     * TLSバージョンのマッピング
     */
    private mapTlsVersion;
    /**
     * TLS接続テスト
     */
    private testTlsConnection; /**
     
  * SQLインジェクション保護テスト
     */
    private testSqlInjectionProtection;
    /**
     * XSS保護テスト
     */
    private testXssProtection;
    /**
     * 不正APIアクセステスト
     */
    private testUnauthorizedApiAccess;
    /**
     * セッションハイジャック保護テスト
     */
    private testSessionHijackingProtection;
    /**
     * レート制限テスト
     */
    private testRateLimit;
    /**
     * CloudTrailログ記録テスト
     */
    private testCloudTrailLogging;
    /**
     * 異常検出テスト
     */
    private testAnomalyDetection;
    /**
     * セキュリティアラートテスト
     */
    private testSecurityAlerts;
    /**
     * ログ分析テスト
     */
    private testLogAnalysis;
    /**
     * セキュリティメトリクスの計算
     */
    private calculateSecurityMetrics;
    /**
     * セキュリティ設定の検証
     */
    private validateSecurityConfiguration;
    /**
     * 本番環境接続の確認
     */
    private verifyProductionConnectivity;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default SecurityTestModule;
