/**
 * マルチリージョン認証テストモジュール
 *
 * 複数AWSリージョン間での認証一貫性を検証
 * 東京-大阪リージョン間のフェイルオーバー認証をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import { TestResult } from '../../core/production-test-engine';
/**
 * マルチリージョン認証テスト結果
 */
export interface MultiRegionAuthTestResult extends TestResult {
    regionDetails?: {
        primaryRegion: string;
        secondaryRegion: string;
        failoverTested: boolean;
        consistencyVerified: boolean;
    };
    authenticationResults?: {
        primaryRegionAuth: boolean;
        secondaryRegionAuth: boolean;
        crossRegionValidation: boolean;
    };
}
/**
 * リージョン設定
 */
export interface RegionConfig {
    region: string;
    cognitoUserPool: string;
    cognitoClientId: string;
    description: string;
}
/**
 * マルチリージョン認証テストモジュール
 */
export declare class MultiRegionAuthTestModule {
    private config;
    private regions;
    private cognitoClients;
    constructor(config: ProductionConfig);
    /**
     * リージョン設定の読み込み
     */
    private loadRegionConfigs;
    /**
     * Cognitoクライアントの初期化
     */
    private initializeCognitoClients;
    /**
     * 東京-大阪リージョン間認証一貫性テスト
     */
    testTokyoOsakaAuthConsistency(): Promise<MultiRegionAuthTestResult>;
    /**
     * グローバルリージョン認証テスト
     */
    testGlobalRegionAuthentication(): Promise<MultiRegionAuthTestResult>;
    /**
     * フェイルオーバー認証テスト
     */
    testFailoverAuthentication(): Promise<MultiRegionAuthTestResult>;
    /**
     * リージョン別認証実行
     */
    private performRegionAuthentication;
    /**
     * クロスリージョン一貫性検証
     */
    private validateCrossRegionConsistency;
    /**
     * フェイルオーバー機能テスト
     */
    private testFailoverFunctionality;
    /**
     * スキップ結果作成ヘルパー
     */
    private createSkippedResult;
    /**
     * 全マルチリージョン認証テストの実行
     */
    runAllMultiRegionAuthTests(): Promise<MultiRegionAuthTestResult[]>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default MultiRegionAuthTestModule;
