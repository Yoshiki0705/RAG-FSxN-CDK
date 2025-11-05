/**
 * 機能テストランナー
 *
 * 機能テストモジュールの実行を管理
 * 実本番環境での機能テストの統合実行機能を提供
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import ProductionTestEngine from '../../core/production-test-engine';
export interface FunctionalTestResult {
    success: boolean;
    summary: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        skippedTests: number;
        overallFunctionalScore: number;
        failedFeatures: string[];
        recommendations: string[];
    };
    results: Map<string, any>;
    errors?: string[];
}
/**
 * 機能テストランナークラス
 */
export declare class FunctionalTestRunner {
    private config;
    private testEngine;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * 機能テストランナーの初期化
     */
    initialize(): Promise<void>;
    /**
     * 機能テストの実行
     */
    runFunctionalTests(): Promise<FunctionalTestResult>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default FunctionalTestRunner;
