/**
 * テスト実行オーケストレーター
 *
 * 統合テストスイートの実行を制御し、最適化された実行戦略を提供
 * - 依存関係管理
 * - リソース監視
 * - 実行最適化
 * - 障害回復
 */
import { EventEmitter } from 'events';
interface TestModule {
    name: string;
    priority: number;
    dependencies: string[];
    estimatedDuration: number;
    resourceRequirements: ResourceRequirements;
    execute(): Promise<ModuleResult>;
}
interface ResourceRequirements {
    cpu: number;
    memory: number;
    network: number;
    concurrent: boolean;
}
interface ExecutionResult {
    success: boolean;
    modules: {
        [key: string]: ModuleResult;
    };
    totalDuration: number;
    resourceUsage: ResourceUsage;
    optimizationMetrics: OptimizationMetrics;
}
interface ModuleResult {
    success: boolean;
    duration: number;
    startTime: string;
    endTime: string;
    resourceUsage: ResourceUsage;
    error?: string;
    retryCount: number;
}
interface ResourceUsage {
    peakCpu: number;
    peakMemory: number;
    networkTraffic: number;
    concurrentTests: number;
}
interface OptimizationMetrics {
    parallelizationRatio: number;
    resourceEfficiency: number;
    timeOptimization: number;
    failureRecoveryTime: number;
}
/**
 * テスト実行オーケストレーター
 */
export declare class TestOrchestrator extends EventEmitter {
    private modules;
    private strategies;
    private resourceMonitor;
    private dependencyResolver;
    constructor();
    /**
     * 実行戦略の初期化
     */
    private initializeStrategies;
    /**
     * テストモジュールの登録
     */
    registerModule(module: TestModule): void;
    /**
     * テスト実行の開始
     */
    execute(strategyName?: string): Promise<ExecutionResult>;
    /**
     * 実行前の準備
     */
    private prepareExecution;
    /**
     * 必要リソースの計算
     */
    private calculateRequiredResources;
    /**
     * リソース充足性の確認
     */
    private hasEnoughResources;
    /**
     * 最適化メトリクスの計算
     */
    private calculateOptimizationMetrics;
    /**
     * リソース効率の計算
     */
    private calculateResourceEfficiency;
    /**
     * 時間最適化の計算
     */
    private calculateTimeOptimization;
    /**
     * 障害回復時間の計算
     */
    private calculateFailureRecoveryTime;
    /**
     * クリーンアップ
     */
    private cleanup;
}
export {};
