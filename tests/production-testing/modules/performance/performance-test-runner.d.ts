/**
 * パフォーマンステストランナー
 *
 * パフォーマンステストモジュールの実行を管理
 * 実本番環境でのパフォーマンステストの統合実行機能を提供
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
import { ProductionConfig } from '../../config/production-config';
import ProductionTestEngine from '../../core/production-test-engine';
export interface PerformanceTestResult {
    success: boolean;
    summary: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        skippedTests: number;
        overallPerformanceScore: number;
        bottlenecks: string[];
        recommendations: string[];
    };
    results: Map<string, any>;
    errors?: string[];
}
/**
 * パフォーマンステストランナークラス
 */
export declare class PerformanceTestRunner {
    private config;
    private testEngine;
    constructor(config: ProductionConfig, testEngine: ProductionTestEngine);
    /**
     * パフォーマンステストランナーの初期化
     */
    initialize(): Promise<void>;
    /**
     * パフォーマンステストの実行
     */
    runPerformanceTests(): Promise<PerformanceTestResult>;
    /**
     * リソースのクリーンアップ
     */
    cleanup(): Promise<void>;
}
export default PerformanceTestRunner;
