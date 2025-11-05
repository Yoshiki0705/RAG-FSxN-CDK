"use strict";
/**
 * テスト実行オーケストレーター
 *
 * 統合テストスイートの実行を制御し、最適化された実行戦略を提供
 * - 依存関係管理
 * - リソース監視
 * - 実行最適化
 * - 障害回復
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestOrchestrator = void 0;
const events_1 = require("events");
/**
 * テスト実行オーケストレーター
 */
class TestOrchestrator extends events_1.EventEmitter {
    modules = new Map();
    strategies = new Map();
    resourceMonitor;
    dependencyResolver;
    constructor() {
        super();
        this.initializeStrategies();
        this.resourceMonitor = new ResourceMonitor();
        this.dependencyResolver = new DependencyResolver();
    }
    /**
     * 実行戦略の初期化
     */
    initializeStrategies() {
        // 順次実行戦略
        this.strategies.set('sequential', new SequentialStrategy());
        // 並列実行戦略
        this.strategies.set('parallel', new ParallelStrategy());
        // 最適化実行戦略
        this.strategies.set('optimized', new OptimizedStrategy());
        // 依存関係考慮戦略
        this.strategies.set('dependency-aware', new DependencyAwareStrategy());
    }
    /**
     * テストモジュールの登録
     */
    registerModule(module) {
        console.log(`📋 テストモジュール登録: ${module.name}`);
        this.modules.set(module.name, module);
        this.emit('moduleRegistered', module);
    }
    /**
     * テスト実行の開始
     */
    async execute(strategyName = 'optimized') {
        console.log(`🚀 テスト実行開始 - 戦略: ${strategyName}`);
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`未知の実行戦略: ${strategyName}`);
        }
        // 実行前の準備
        await this.prepareExecution();
        // 依存関係の解決
        const sortedModules = this.dependencyResolver.resolve(Array.from(this.modules.values()));
        // リソース監視開始
        this.resourceMonitor.start();
        try {
            // 戦略に基づく実行
            const result = await strategy.execute(sortedModules);
            // 最適化メトリクスの計算
            result.optimizationMetrics = this.calculateOptimizationMetrics(result);
            console.log('✅ テスト実行完了');
            this.emit('executionCompleted', result);
            return result;
        }
        catch (error) {
            console.error('❌ テスト実行エラー:', error);
            this.emit('executionFailed', error);
            throw error;
        }
        finally {
            // リソース監視停止
            this.resourceMonitor.stop();
            // クリーンアップ
            await this.cleanup();
        }
    }
    /**
     * 実行前の準備
     */
    async prepareExecution() {
        console.log('🔧 実行環境を準備中...');
        // システムリソースの確認
        const systemResources = await this.resourceMonitor.getSystemResources();
        console.log('💻 システムリソース:', systemResources);
        // 必要リソースの計算
        const requiredResources = this.calculateRequiredResources();
        console.log('📊 必要リソース:', requiredResources);
        // リソース不足の確認
        if (!this.hasEnoughResources(systemResources, requiredResources)) {
            throw new Error('システムリソースが不足しています');
        }
        console.log('✅ 実行環境準備完了');
    }
    /**
     * 必要リソースの計算
     */
    calculateRequiredResources() {
        let totalCpu = 0;
        let totalMemory = 0;
        let totalNetwork = 0;
        for (const module of this.modules.values()) {
            totalCpu += module.resourceRequirements.cpu;
            totalMemory += module.resourceRequirements.memory;
            totalNetwork += module.resourceRequirements.network;
        }
        return {
            cpu: totalCpu,
            memory: totalMemory,
            network: totalNetwork,
            concurrent: true
        };
    }
    /**
     * リソース充足性の確認
     */
    hasEnoughResources(available, required) {
        return (available.cpu >= required.cpu &&
            available.memory >= required.memory &&
            available.network >= required.network);
    }
    /**
     * 最適化メトリクスの計算
     */
    calculateOptimizationMetrics(result) {
        const totalModules = Object.keys(result.modules).length;
        const parallelModules = Object.values(result.modules)
            .filter(m => m.resourceUsage.concurrentTests > 1).length;
        return {
            parallelizationRatio: totalModules > 0 ? parallelModules / totalModules : 0,
            resourceEfficiency: this.calculateResourceEfficiency(result.resourceUsage),
            timeOptimization: this.calculateTimeOptimization(result),
            failureRecoveryTime: this.calculateFailureRecoveryTime(result)
        };
    }
    /**
     * リソース効率の計算
     */
    calculateResourceEfficiency(usage) {
        // CPU、メモリ、ネットワークの平均使用効率
        const cpuEfficiency = Math.min(usage.peakCpu / 100, 1);
        const memoryEfficiency = Math.min(usage.peakMemory / 8192, 1); // 8GB基準
        const networkEfficiency = Math.min(usage.networkTraffic / 100, 1); // 100Mbps基準
        return (cpuEfficiency + memoryEfficiency + networkEfficiency) / 3;
    }
    /**
     * 時間最適化の計算
     */
    calculateTimeOptimization(result) {
        // 順次実行時間と実際の実行時間の比較
        const sequentialTime = Object.values(result.modules)
            .reduce((total, module) => total + module.duration, 0);
        return sequentialTime > 0 ? 1 - (result.totalDuration / sequentialTime) : 0;
    }
    /**
     * 障害回復時間の計算
     */
    calculateFailureRecoveryTime(result) {
        const failedModules = Object.values(result.modules)
            .filter(m => !m.success);
        if (failedModules.length === 0)
            return 0;
        return failedModules.reduce((total, module) => {
            return total + (module.retryCount * module.duration);
        }, 0);
    }
    /**
     * クリーンアップ
     */
    async cleanup() {
        console.log('🧹 実行環境をクリーンアップ中...');
        // リソース監視の停止
        this.resourceMonitor.stop();
        // 一時ファイルの削除
        // ネットワーク接続のクリーンアップ
        // メモリの解放
        console.log('✅ クリーンアップ完了');
    }
}
exports.TestOrchestrator = TestOrchestrator;
/**
 * 順次実行戦略
 */
class SequentialStrategy {
    name = 'sequential';
    description = '全テストを順次実行';
    async execute(modules) {
        console.log('📋 順次実行戦略でテスト実行中...');
        const startTime = Date.now();
        const results = {};
        const resourceUsage = {
            peakCpu: 0,
            peakMemory: 0,
            networkTraffic: 0,
            concurrentTests: 1
        };
        for (const module of modules) {
            console.log(`🔄 ${module.name} 実行中...`);
            const moduleStartTime = Date.now();
            try {
                const result = await module.execute();
                results[module.name] = {
                    ...result,
                    startTime: new Date(moduleStartTime).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: Date.now() - moduleStartTime,
                    retryCount: 0,
                    resourceUsage: {
                        peakCpu: module.resourceRequirements.cpu,
                        peakMemory: module.resourceRequirements.memory,
                        networkTraffic: module.resourceRequirements.network,
                        concurrentTests: 1
                    }
                };
                // リソース使用量の更新
                resourceUsage.peakCpu = Math.max(resourceUsage.peakCpu, module.resourceRequirements.cpu);
                resourceUsage.peakMemory = Math.max(resourceUsage.peakMemory, module.resourceRequirements.memory);
                resourceUsage.networkTraffic += module.resourceRequirements.network;
                console.log(`✅ ${module.name} 完了`);
            }
            catch (error) {
                console.error(`❌ ${module.name} 失敗:`, error);
                results[module.name] = {
                    success: false,
                    duration: Date.now() - moduleStartTime,
                    startTime: new Date(moduleStartTime).toISOString(),
                    endTime: new Date().toISOString(),
                    error: error.message,
                    retryCount: 0,
                    resourceUsage: {
                        peakCpu: 0,
                        peakMemory: 0,
                        networkTraffic: 0,
                        concurrentTests: 1
                    }
                };
            }
        }
        const totalDuration = Date.now() - startTime;
        const success = Object.values(results).every(r => r.success);
        return {
            success,
            modules: results,
            totalDuration,
            resourceUsage,
            optimizationMetrics: {
                parallelizationRatio: 0,
                resourceEfficiency: 0,
                timeOptimization: 0,
                failureRecoveryTime: 0
            }
        };
    }
}
/**
 * 並列実行戦略
 */
class ParallelStrategy {
    name = 'parallel';
    description = '可能な限り並列実行';
    async execute(modules) {
        console.log('⚡ 並列実行戦略でテスト実行中...');
        const startTime = Date.now();
        const concurrentModules = modules.filter(m => m.resourceRequirements.concurrent);
        const sequentialModules = modules.filter(m => !m.resourceRequirements.concurrent);
        // 並列実行可能なモジュールを並列実行
        const parallelPromises = concurrentModules.map(async (module) => {
            const moduleStartTime = Date.now();
            try {
                const result = await module.execute();
                return {
                    name: module.name,
                    result: {
                        ...result,
                        startTime: new Date(moduleStartTime).toISOString(),
                        endTime: new Date().toISOString(),
                        duration: Date.now() - moduleStartTime,
                        retryCount: 0,
                        resourceUsage: {
                            peakCpu: module.resourceRequirements.cpu,
                            peakMemory: module.resourceRequirements.memory,
                            networkTraffic: module.resourceRequirements.network,
                            concurrentTests: concurrentModules.length
                        }
                    }
                };
            }
            catch (error) {
                return {
                    name: module.name,
                    result: {
                        success: false,
                        duration: Date.now() - moduleStartTime,
                        startTime: new Date(moduleStartTime).toISOString(),
                        endTime: new Date().toISOString(),
                        error: error.message,
                        retryCount: 0,
                        resourceUsage: {
                            peakCpu: 0,
                            peakMemory: 0,
                            networkTraffic: 0,
                            concurrentTests: 1
                        }
                    }
                };
            }
        });
        const parallelResults = await Promise.all(parallelPromises);
        const results = {};
        // 並列実行結果の統合
        for (const { name, result } of parallelResults) {
            results[name] = result;
        }
        // 順次実行が必要なモジュールを実行
        for (const module of sequentialModules) {
            const moduleStartTime = Date.now();
            try {
                const result = await module.execute();
                results[module.name] = {
                    ...result,
                    startTime: new Date(moduleStartTime).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: Date.now() - moduleStartTime,
                    retryCount: 0,
                    resourceUsage: {
                        peakCpu: module.resourceRequirements.cpu,
                        peakMemory: module.resourceRequirements.memory,
                        networkTraffic: module.resourceRequirements.network,
                        concurrentTests: 1
                    }
                };
            }
            catch (error) {
                results[module.name] = {
                    success: false,
                    duration: Date.now() - moduleStartTime,
                    startTime: new Date(moduleStartTime).toISOString(),
                    endTime: new Date().toISOString(),
                    error: error.message,
                    retryCount: 0,
                    resourceUsage: {
                        peakCpu: 0,
                        peakMemory: 0,
                        networkTraffic: 0,
                        concurrentTests: 1
                    }
                };
            }
        }
        const totalDuration = Date.now() - startTime;
        const success = Object.values(results).every(r => r.success);
        // リソース使用量の計算
        const resourceUsage = {
            peakCpu: Math.max(...Object.values(results).map(r => r.resourceUsage.peakCpu)),
            peakMemory: Math.max(...Object.values(results).map(r => r.resourceUsage.peakMemory)),
            networkTraffic: Object.values(results).reduce((sum, r) => sum + r.resourceUsage.networkTraffic, 0),
            concurrentTests: concurrentModules.length
        };
        return {
            success,
            modules: results,
            totalDuration,
            resourceUsage,
            optimizationMetrics: {
                parallelizationRatio: 0,
                resourceEfficiency: 0,
                timeOptimization: 0,
                failureRecoveryTime: 0
            }
        };
    }
}
/**
 * 最適化実行戦略
 */
class OptimizedStrategy {
    name = 'optimized';
    description = 'リソースと依存関係を考慮した最適化実行';
    async execute(modules) {
        console.log('🎯 最適化実行戦略でテスト実行中...');
        // 実行計画の作成
        const executionPlan = this.createExecutionPlan(modules);
        const startTime = Date.now();
        const results = {};
        // 実行計画に基づく実行
        for (const phase of executionPlan) {
            console.log(`🔄 Phase ${phase.id} 実行中: ${phase.modules.map(m => m.name).join(', ')}`);
            if (phase.parallel) {
                // 並列実行
                const promises = phase.modules.map(module => this.executeModule(module));
                const phaseResults = await Promise.all(promises);
                for (const result of phaseResults) {
                    results[result.name] = result.result;
                }
            }
            else {
                // 順次実行
                for (const module of phase.modules) {
                    const result = await this.executeModule(module);
                    results[result.name] = result.result;
                }
            }
        }
        const totalDuration = Date.now() - startTime;
        const success = Object.values(results).every(r => r.success);
        // リソース使用量の計算
        const resourceUsage = {
            peakCpu: Math.max(...Object.values(results).map(r => r.resourceUsage.peakCpu)),
            peakMemory: Math.max(...Object.values(results).map(r => r.resourceUsage.peakMemory)),
            networkTraffic: Object.values(results).reduce((sum, r) => sum + r.resourceUsage.networkTraffic, 0),
            concurrentTests: Math.max(...executionPlan.filter(p => p.parallel).map(p => p.modules.length))
        };
        return {
            success,
            modules: results,
            totalDuration,
            resourceUsage,
            optimizationMetrics: {
                parallelizationRatio: 0,
                resourceEfficiency: 0,
                timeOptimization: 0,
                failureRecoveryTime: 0
            }
        };
    }
    /**
     * 実行計画の作成
     */
    createExecutionPlan(modules) {
        const phases = [];
        const processed = new Set();
        // 優先度とリソース要件に基づく最適化
        const sortedModules = [...modules].sort((a, b) => {
            // 優先度が高い順
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // リソース要件が少ない順
            const aResource = a.resourceRequirements.cpu + a.resourceRequirements.memory;
            const bResource = b.resourceRequirements.cpu + b.resourceRequirements.memory;
            return aResource - bResource;
        });
        let phaseId = 1;
        while (processed.size < modules.length) {
            const phaseModules = [];
            let totalCpu = 0;
            let totalMemory = 0;
            for (const module of sortedModules) {
                if (processed.has(module.name))
                    continue;
                // 依存関係の確認
                const dependenciesMet = module.dependencies.every(dep => processed.has(dep));
                if (!dependenciesMet)
                    continue;
                // リソース制限の確認（CPU 80%, Memory 6GB制限）
                if (totalCpu + module.resourceRequirements.cpu > 80 ||
                    totalMemory + module.resourceRequirements.memory > 6144) {
                    continue;
                }
                phaseModules.push(module);
                totalCpu += module.resourceRequirements.cpu;
                totalMemory += module.resourceRequirements.memory;
                processed.add(module.name);
                // 並列実行不可の場合は1つだけ
                if (!module.resourceRequirements.concurrent) {
                    break;
                }
            }
            if (phaseModules.length > 0) {
                phases.push({
                    id: phaseId++,
                    modules: phaseModules,
                    parallel: phaseModules.length > 1 && phaseModules.every(m => m.resourceRequirements.concurrent),
                    estimatedDuration: Math.max(...phaseModules.map(m => m.estimatedDuration))
                });
            }
            else {
                // デッドロック回避：残りのモジュールを強制実行
                const remaining = sortedModules.filter(m => !processed.has(m.name));
                if (remaining.length > 0) {
                    phases.push({
                        id: phaseId++,
                        modules: [remaining[0]],
                        parallel: false,
                        estimatedDuration: remaining[0].estimatedDuration
                    });
                    processed.add(remaining[0].name);
                }
            }
        }
        return phases;
    }
    /**
     * モジュールの実行
     */
    async executeModule(module) {
        const moduleStartTime = Date.now();
        try {
            const result = await module.execute();
            return {
                name: module.name,
                result: {
                    ...result,
                    startTime: new Date(moduleStartTime).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: Date.now() - moduleStartTime,
                    retryCount: 0,
                    resourceUsage: {
                        peakCpu: module.resourceRequirements.cpu,
                        peakMemory: module.resourceRequirements.memory,
                        networkTraffic: module.resourceRequirements.network,
                        concurrentTests: 1
                    }
                }
            };
        }
        catch (error) {
            return {
                name: module.name,
                result: {
                    success: false,
                    duration: Date.now() - moduleStartTime,
                    startTime: new Date(moduleStartTime).toISOString(),
                    endTime: new Date().toISOString(),
                    error: error.message,
                    retryCount: 0,
                    resourceUsage: {
                        peakCpu: 0,
                        peakMemory: 0,
                        networkTraffic: 0,
                        concurrentTests: 1
                    }
                }
            };
        }
    }
}
/**
 * 依存関係考慮戦略
 */
class DependencyAwareStrategy {
    name = 'dependency-aware';
    description = '依存関係を厳密に考慮した実行';
    async execute(modules) {
        console.log('🔗 依存関係考慮戦略でテスト実行中...');
        // 依存関係グラフの構築と実行順序の決定
        const executionOrder = this.resolveDependencies(modules);
        const startTime = Date.now();
        const results = {};
        for (const module of executionOrder) {
            const moduleStartTime = Date.now();
            try {
                const result = await module.execute();
                results[module.name] = {
                    ...result,
                    startTime: new Date(moduleStartTime).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: Date.now() - moduleStartTime,
                    retryCount: 0,
                    resourceUsage: {
                        peakCpu: module.resourceRequirements.cpu,
                        peakMemory: module.resourceRequirements.memory,
                        networkTraffic: module.resourceRequirements.network,
                        concurrentTests: 1
                    }
                };
                console.log(`✅ ${module.name} 完了`);
            }
            catch (error) {
                console.error(`❌ ${module.name} 失敗:`, error);
                results[module.name] = {
                    success: false,
                    duration: Date.now() - moduleStartTime,
                    startTime: new Date(moduleStartTime).toISOString(),
                    endTime: new Date().toISOString(),
                    error: error.message,
                    retryCount: 0,
                    resourceUsage: {
                        peakCpu: 0,
                        peakMemory: 0,
                        networkTraffic: 0,
                        concurrentTests: 1
                    }
                };
                // 依存関係エラーの場合は後続テストをスキップ
                break;
            }
        }
        const totalDuration = Date.now() - startTime;
        const success = Object.values(results).every(r => r.success);
        const resourceUsage = {
            peakCpu: Math.max(...Object.values(results).map(r => r.resourceUsage.peakCpu)),
            peakMemory: Math.max(...Object.values(results).map(r => r.resourceUsage.peakMemory)),
            networkTraffic: Object.values(results).reduce((sum, r) => sum + r.resourceUsage.networkTraffic, 0),
            concurrentTests: 1
        };
        return {
            success,
            modules: results,
            totalDuration,
            resourceUsage,
            optimizationMetrics: {
                parallelizationRatio: 0,
                resourceEfficiency: 0,
                timeOptimization: 0,
                failureRecoveryTime: 0
            }
        };
    }
    /**
     * 依存関係の解決
     */
    resolveDependencies(modules) {
        const resolved = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (module) => {
            if (visiting.has(module.name)) {
                throw new Error(`循環依存が検出されました: ${module.name}`);
            }
            if (visited.has(module.name)) {
                return;
            }
            visiting.add(module.name);
            // 依存関係を先に解決
            for (const depName of module.dependencies) {
                const dependency = modules.find(m => m.name === depName);
                if (dependency) {
                    visit(dependency);
                }
            }
            visiting.delete(module.name);
            visited.add(module.name);
            resolved.push(module);
        };
        for (const module of modules) {
            visit(module);
        }
        return resolved;
    }
}
/**
 * リソース監視クラス
 */
class ResourceMonitor {
    monitoring = false;
    metrics = {
        peakCpu: 0,
        peakMemory: 0,
        networkTraffic: 0,
        concurrentTests: 0
    };
    start() {
        this.monitoring = true;
        console.log('📊 リソース監視開始');
    }
    stop() {
        this.monitoring = false;
        console.log('📊 リソース監視停止');
    }
    async getSystemResources() {
        // システムリソースの取得（実装は環境依存）
        return {
            cpu: 100, // 利用可能CPU (%)
            memory: 8192, // 利用可能メモリ (MB)
            network: 1000, // 利用可能帯域 (Mbps)
            concurrent: true
        };
    }
    getMetrics() {
        return { ...this.metrics };
    }
}
/**
 * 依存関係解決クラス
 */
class DependencyResolver {
    resolve(modules) {
        // トポロジカルソートによる依存関係解決
        const resolved = [];
        const visited = new Set();
        const visit = (module) => {
            if (visited.has(module.name))
                return;
            // 依存関係を先に解決
            for (const depName of module.dependencies) {
                const dependency = modules.find(m => m.name === depName);
                if (dependency && !visited.has(dependency.name)) {
                    visit(dependency);
                }
            }
            visited.add(module.name);
            resolved.push(module);
        };
        for (const module of modules) {
            visit(module);
        }
        return resolved;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1vcmNoZXN0cmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0LW9yY2hlc3RyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVILG1DQUFzQztBQStEdEM7O0dBRUc7QUFDSCxNQUFhLGdCQUFpQixTQUFRLHFCQUFZO0lBQ3hDLE9BQU8sR0FBNEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUM3QyxVQUFVLEdBQW1DLElBQUksR0FBRyxFQUFFLENBQUM7SUFDdkQsZUFBZSxDQUFrQjtJQUNqQyxrQkFBa0IsQ0FBcUI7SUFFL0M7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO0lBQ3JELENBQUM7SUFFRDs7T0FFRztJQUNLLG9CQUFvQjtRQUMxQixTQUFTO1FBQ1QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1FBRTVELFNBQVM7UUFDVCxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7UUFFeEQsVUFBVTtRQUNWLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUUxRCxXQUFXO1FBQ1gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsSUFBSSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsY0FBYyxDQUFDLE1BQWtCO1FBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQXVCLFdBQVc7UUFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUVoRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsU0FBUztRQUNULE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFOUIsVUFBVTtRQUNWLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV6RixXQUFXO1FBQ1gsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUU3QixJQUFJLENBQUM7WUFDSCxXQUFXO1lBQ1gsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXJELGNBQWM7WUFDZCxNQUFNLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXZFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUV4QyxPQUFPLE1BQU0sQ0FBQztRQUVoQixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEMsTUFBTSxLQUFLLENBQUM7UUFFZCxDQUFDO2dCQUFTLENBQUM7WUFDVCxXQUFXO1lBQ1gsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUU1QixVQUFVO1lBQ1YsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxnQkFBZ0I7UUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRTlCLGNBQWM7UUFDZCxNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUN4RSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUU3QyxZQUFZO1FBQ1osTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUM1RCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBRTdDLFlBQVk7UUFDWixJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFDakUsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRDs7T0FFRztJQUNLLDBCQUEwQjtRQUNoQyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDakIsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztRQUVyQixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztZQUMzQyxRQUFRLElBQUksTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQztZQUM1QyxXQUFXLElBQUksTUFBTSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQztZQUNsRCxZQUFZLElBQUksTUFBTSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQztRQUN0RCxDQUFDO1FBRUQsT0FBTztZQUNMLEdBQUcsRUFBRSxRQUFRO1lBQ2IsTUFBTSxFQUFFLFdBQVc7WUFDbkIsT0FBTyxFQUFFLFlBQVk7WUFDckIsVUFBVSxFQUFFLElBQUk7U0FDakIsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLGtCQUFrQixDQUN4QixTQUErQixFQUMvQixRQUE4QjtRQUU5QixPQUFPLENBQ0wsU0FBUyxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsR0FBRztZQUM3QixTQUFTLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxNQUFNO1lBQ25DLFNBQVMsQ0FBQyxPQUFPLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FDdEMsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLDRCQUE0QixDQUFDLE1BQXVCO1FBQzFELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUN4RCxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7YUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBRTNELE9BQU87WUFDTCxvQkFBb0IsRUFBRSxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNFLGtCQUFrQixFQUFFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQzFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLENBQUM7WUFDeEQsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLE1BQU0sQ0FBQztTQUMvRCxDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0ssMkJBQTJCLENBQUMsS0FBb0I7UUFDdEQsd0JBQXdCO1FBQ3hCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUN2RSxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZO1FBRS9FLE9BQU8sQ0FBQyxhQUFhLEdBQUcsZ0JBQWdCLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVEOztPQUVHO0lBQ0sseUJBQXlCLENBQUMsTUFBdUI7UUFDdkQsb0JBQW9CO1FBQ3BCLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQzthQUNqRCxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV6RCxPQUFPLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQ7O09BRUc7SUFDSyw0QkFBNEIsQ0FBQyxNQUF1QjtRQUMxRCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7YUFDaEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFM0IsSUFBSSxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUM7WUFBRSxPQUFPLENBQUMsQ0FBQztRQUV6QyxPQUFPLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDNUMsT0FBTyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMsT0FBTztRQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFFbkMsWUFBWTtRQUNaLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFNUIsWUFBWTtRQUNaLG1CQUFtQjtRQUNuQixTQUFTO1FBRVQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUM3QixDQUFDO0NBQ0Y7QUFuTkQsNENBbU5DO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLGtCQUFrQjtJQUN0QixJQUFJLEdBQUcsWUFBWSxDQUFDO0lBQ3BCLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFFMUIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFxQjtRQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFFbkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE1BQU0sT0FBTyxHQUFvQyxFQUFFLENBQUM7UUFDcEQsTUFBTSxhQUFhLEdBQWtCO1lBQ25DLE9BQU8sRUFBRSxDQUFDO1lBQ1YsVUFBVSxFQUFFLENBQUM7WUFDYixjQUFjLEVBQUUsQ0FBQztZQUNqQixlQUFlLEVBQUUsQ0FBQztTQUNuQixDQUFDO1FBRUYsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDLENBQUM7WUFFeEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRW5DLElBQUksQ0FBQztnQkFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFdEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRztvQkFDckIsR0FBRyxNQUFNO29CQUNULFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLEVBQUU7b0JBQ2xELE9BQU8sRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtvQkFDakMsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxlQUFlO29CQUN0QyxVQUFVLEVBQUUsQ0FBQztvQkFDYixhQUFhLEVBQUU7d0JBQ2IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHO3dCQUN4QyxVQUFVLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLE1BQU07d0JBQzlDLGNBQWMsRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUMsT0FBTzt3QkFDbkQsZUFBZSxFQUFFLENBQUM7cUJBQ25CO2lCQUNGLENBQUM7Z0JBRUYsYUFBYTtnQkFDYixhQUFhLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3pGLGFBQWEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbEcsYUFBYSxDQUFDLGNBQWMsSUFBSSxNQUFNLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDO2dCQUVwRSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7WUFFckMsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFN0MsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRztvQkFDckIsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxlQUFlO29CQUN0QyxTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsV0FBVyxFQUFFO29CQUNsRCxPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7b0JBQ2pDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztvQkFDcEIsVUFBVSxFQUFFLENBQUM7b0JBQ2IsYUFBYSxFQUFFO3dCQUNiLE9BQU8sRUFBRSxDQUFDO3dCQUNWLFVBQVUsRUFBRSxDQUFDO3dCQUNiLGNBQWMsRUFBRSxDQUFDO3dCQUNqQixlQUFlLEVBQUUsQ0FBQztxQkFDbkI7aUJBQ0YsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztRQUM3QyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU3RCxPQUFPO1lBQ0wsT0FBTztZQUNQLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLGFBQWE7WUFDYixhQUFhO1lBQ2IsbUJBQW1CLEVBQUU7Z0JBQ25CLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3ZCLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3JCLGdCQUFnQixFQUFFLENBQUM7Z0JBQ25CLG1CQUFtQixFQUFFLENBQUM7YUFDdkI7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQjtJQUNwQixJQUFJLEdBQUcsVUFBVSxDQUFDO0lBQ2xCLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFFMUIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFxQjtRQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFFbEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqRixNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVsRixvQkFBb0I7UUFDcEIsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzlELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUVuQyxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU87b0JBQ0wsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO29CQUNqQixNQUFNLEVBQUU7d0JBQ04sR0FBRyxNQUFNO3dCQUNULFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLEVBQUU7d0JBQ2xELE9BQU8sRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTt3QkFDakMsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxlQUFlO3dCQUN0QyxVQUFVLEVBQUUsQ0FBQzt3QkFDYixhQUFhLEVBQUU7NEJBQ2IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHOzRCQUN4QyxVQUFVLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLE1BQU07NEJBQzlDLGNBQWMsRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUMsT0FBTzs0QkFDbkQsZUFBZSxFQUFFLGlCQUFpQixDQUFDLE1BQU07eUJBQzFDO3FCQUNGO2lCQUNGLENBQUM7WUFDSixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDZixPQUFPO29CQUNMLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtvQkFDakIsTUFBTSxFQUFFO3dCQUNOLE9BQU8sRUFBRSxLQUFLO3dCQUNkLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsZUFBZTt3QkFDdEMsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQVcsRUFBRTt3QkFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO3dCQUNqQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87d0JBQ3BCLFVBQVUsRUFBRSxDQUFDO3dCQUNiLGFBQWEsRUFBRTs0QkFDYixPQUFPLEVBQUUsQ0FBQzs0QkFDVixVQUFVLEVBQUUsQ0FBQzs0QkFDYixjQUFjLEVBQUUsQ0FBQzs0QkFDakIsZUFBZSxFQUFFLENBQUM7eUJBQ25CO3FCQUNGO2lCQUNGLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLGVBQWUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM1RCxNQUFNLE9BQU8sR0FBb0MsRUFBRSxDQUFDO1FBRXBELFlBQVk7UUFDWixLQUFLLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksZUFBZSxFQUFFLENBQUM7WUFDL0MsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUN6QixDQUFDO1FBRUQsbUJBQW1CO1FBQ25CLEtBQUssTUFBTSxNQUFNLElBQUksaUJBQWlCLEVBQUUsQ0FBQztZQUN2QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFbkMsSUFBSSxDQUFDO2dCQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0QyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHO29CQUNyQixHQUFHLE1BQU07b0JBQ1QsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQVcsRUFBRTtvQkFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO29CQUNqQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLGVBQWU7b0JBQ3RDLFVBQVUsRUFBRSxDQUFDO29CQUNiLGFBQWEsRUFBRTt3QkFDYixPQUFPLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUc7d0JBQ3hDLFVBQVUsRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUMsTUFBTTt3QkFDOUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPO3dCQUNuRCxlQUFlLEVBQUUsQ0FBQztxQkFDbkI7aUJBQ0YsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNmLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUc7b0JBQ3JCLE9BQU8sRUFBRSxLQUFLO29CQUNkLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsZUFBZTtvQkFDdEMsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQVcsRUFBRTtvQkFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO29CQUNqQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87b0JBQ3BCLFVBQVUsRUFBRSxDQUFDO29CQUNiLGFBQWEsRUFBRTt3QkFDYixPQUFPLEVBQUUsQ0FBQzt3QkFDVixVQUFVLEVBQUUsQ0FBQzt3QkFDYixjQUFjLEVBQUUsQ0FBQzt3QkFDakIsZUFBZSxFQUFFLENBQUM7cUJBQ25CO2lCQUNGLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUM7UUFDN0MsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFN0QsYUFBYTtRQUNiLE1BQU0sYUFBYSxHQUFrQjtZQUNuQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RSxVQUFVLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNwRixjQUFjLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQ2xHLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxNQUFNO1NBQzFDLENBQUM7UUFFRixPQUFPO1lBQ0wsT0FBTztZQUNQLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLGFBQWE7WUFDYixhQUFhO1lBQ2IsbUJBQW1CLEVBQUU7Z0JBQ25CLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3ZCLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3JCLGdCQUFnQixFQUFFLENBQUM7Z0JBQ25CLG1CQUFtQixFQUFFLENBQUM7YUFDdkI7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLGlCQUFpQjtJQUNyQixJQUFJLEdBQUcsV0FBVyxDQUFDO0lBQ25CLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQztJQUVwQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQXFCO1FBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUVwQyxVQUFVO1FBQ1YsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXhELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBb0MsRUFBRSxDQUFDO1FBRXBELGFBQWE7UUFDYixLQUFLLE1BQU0sS0FBSyxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxLQUFLLENBQUMsRUFBRSxTQUFTLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdEYsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25CLE9BQU87Z0JBQ1AsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFakQsS0FBSyxNQUFNLE1BQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQztvQkFDbEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUN2QyxDQUFDO1lBQ0gsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE9BQU87Z0JBQ1AsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ25DLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDaEQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUN2QyxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDO1FBQzdDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTdELGFBQWE7UUFDYixNQUFNLGFBQWEsR0FBa0I7WUFDbkMsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUUsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDcEYsY0FBYyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUNsRyxlQUFlLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvRixDQUFDO1FBRUYsT0FBTztZQUNMLE9BQU87WUFDUCxPQUFPLEVBQUUsT0FBTztZQUNoQixhQUFhO1lBQ2IsYUFBYTtZQUNiLG1CQUFtQixFQUFFO2dCQUNuQixvQkFBb0IsRUFBRSxDQUFDO2dCQUN2QixrQkFBa0IsRUFBRSxDQUFDO2dCQUNyQixnQkFBZ0IsRUFBRSxDQUFDO2dCQUNuQixtQkFBbUIsRUFBRSxDQUFDO2FBQ3ZCO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLG1CQUFtQixDQUFDLE9BQXFCO1FBQy9DLE1BQU0sTUFBTSxHQUFxQixFQUFFLENBQUM7UUFDcEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUVwQyxvQkFBb0I7UUFDcEIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQyxVQUFVO1lBQ1YsSUFBSSxDQUFDLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDakMsQ0FBQztZQUVELGNBQWM7WUFDZCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsb0JBQW9CLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7WUFDN0UsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDO1lBQzdFLE9BQU8sU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztRQUVoQixPQUFPLFNBQVMsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sWUFBWSxHQUFpQixFQUFFLENBQUM7WUFDdEMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztZQUVwQixLQUFLLE1BQU0sTUFBTSxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFBRSxTQUFTO2dCQUV6QyxVQUFVO2dCQUNWLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLENBQUMsZUFBZTtvQkFBRSxTQUFTO2dCQUUvQixtQ0FBbUM7Z0JBQ25DLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEdBQUcsRUFBRTtvQkFDL0MsV0FBVyxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUM7b0JBQzVELFNBQVM7Z0JBQ1gsQ0FBQztnQkFFRCxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxQixRQUFRLElBQUksTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQztnQkFDNUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7Z0JBQ2xELFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUUzQixpQkFBaUI7Z0JBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQzVDLE1BQU07Z0JBQ1IsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUM7b0JBQ1YsRUFBRSxFQUFFLE9BQU8sRUFBRTtvQkFDYixPQUFPLEVBQUUsWUFBWTtvQkFDckIsUUFBUSxFQUFFLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDO29CQUMvRixpQkFBaUIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2lCQUMzRSxDQUFDLENBQUM7WUFDTCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04seUJBQXlCO2dCQUN6QixNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7d0JBQ1YsRUFBRSxFQUFFLE9BQU8sRUFBRTt3QkFDYixPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZCLFFBQVEsRUFBRSxLQUFLO3dCQUNmLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7cUJBQ2xELENBQUMsQ0FBQztvQkFDSCxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFrQjtRQUM1QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFbkMsSUFBSSxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFdEMsT0FBTztnQkFDTCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7Z0JBQ2pCLE1BQU0sRUFBRTtvQkFDTixHQUFHLE1BQU07b0JBQ1QsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQVcsRUFBRTtvQkFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO29CQUNqQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLGVBQWU7b0JBQ3RDLFVBQVUsRUFBRSxDQUFDO29CQUNiLGFBQWEsRUFBRTt3QkFDYixPQUFPLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUc7d0JBQ3hDLFVBQVUsRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUMsTUFBTTt3QkFDOUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPO3dCQUNuRCxlQUFlLEVBQUUsQ0FBQztxQkFDbkI7aUJBQ0Y7YUFDRixDQUFDO1FBQ0osQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPO2dCQUNMLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtnQkFDakIsTUFBTSxFQUFFO29CQUNOLE9BQU8sRUFBRSxLQUFLO29CQUNkLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsZUFBZTtvQkFDdEMsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQVcsRUFBRTtvQkFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO29CQUNqQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87b0JBQ3BCLFVBQVUsRUFBRSxDQUFDO29CQUNiLGFBQWEsRUFBRTt3QkFDYixPQUFPLEVBQUUsQ0FBQzt3QkFDVixVQUFVLEVBQUUsQ0FBQzt3QkFDYixjQUFjLEVBQUUsQ0FBQzt3QkFDakIsZUFBZSxFQUFFLENBQUM7cUJBQ25CO2lCQUNGO2FBQ0YsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRDs7R0FFRztBQUNILE1BQU0sdUJBQXVCO0lBQzNCLElBQUksR0FBRyxrQkFBa0IsQ0FBQztJQUMxQixXQUFXLEdBQUcsZ0JBQWdCLENBQUM7SUFFL0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFxQjtRQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFFckMscUJBQXFCO1FBQ3JCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV6RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDN0IsTUFBTSxPQUFPLEdBQW9DLEVBQUUsQ0FBQztRQUVwRCxLQUFLLE1BQU0sTUFBTSxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUVuQyxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRXRDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUc7b0JBQ3JCLEdBQUcsTUFBTTtvQkFDVCxTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsV0FBVyxFQUFFO29CQUNsRCxPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7b0JBQ2pDLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsZUFBZTtvQkFDdEMsVUFBVSxFQUFFLENBQUM7b0JBQ2IsYUFBYSxFQUFFO3dCQUNiLE9BQU8sRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRzt3QkFDeEMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNO3dCQUM5QyxjQUFjLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLE9BQU87d0JBQ25ELGVBQWUsRUFBRSxDQUFDO3FCQUNuQjtpQkFDRixDQUFDO2dCQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztZQUVyQyxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDZixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUU3QyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHO29CQUNyQixPQUFPLEVBQUUsS0FBSztvQkFDZCxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLGVBQWU7b0JBQ3RDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLEVBQUU7b0JBQ2xELE9BQU8sRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtvQkFDakMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO29CQUNwQixVQUFVLEVBQUUsQ0FBQztvQkFDYixhQUFhLEVBQUU7d0JBQ2IsT0FBTyxFQUFFLENBQUM7d0JBQ1YsVUFBVSxFQUFFLENBQUM7d0JBQ2IsY0FBYyxFQUFFLENBQUM7d0JBQ2pCLGVBQWUsRUFBRSxDQUFDO3FCQUNuQjtpQkFDRixDQUFDO2dCQUVGLHdCQUF3QjtnQkFDeEIsTUFBTTtZQUNSLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztRQUM3QyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU3RCxNQUFNLGFBQWEsR0FBa0I7WUFDbkMsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUUsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDcEYsY0FBYyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUNsRyxlQUFlLEVBQUUsQ0FBQztTQUNuQixDQUFDO1FBRUYsT0FBTztZQUNMLE9BQU87WUFDUCxPQUFPLEVBQUUsT0FBTztZQUNoQixhQUFhO1lBQ2IsYUFBYTtZQUNiLG1CQUFtQixFQUFFO2dCQUNuQixvQkFBb0IsRUFBRSxDQUFDO2dCQUN2QixrQkFBa0IsRUFBRSxDQUFDO2dCQUNyQixnQkFBZ0IsRUFBRSxDQUFDO2dCQUNuQixtQkFBbUIsRUFBRSxDQUFDO2FBQ3ZCO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLG1CQUFtQixDQUFDLE9BQXFCO1FBQy9DLE1BQU0sUUFBUSxHQUFpQixFQUFFLENBQUM7UUFDbEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUNsQyxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBRW5DLE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBa0IsRUFBRSxFQUFFO1lBQ25DLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTztZQUNULENBQUM7WUFFRCxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUxQixZQUFZO1lBQ1osS0FBSyxNQUFNLE9BQU8sSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNmLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDcEIsQ0FBQztZQUNILENBQUM7WUFFRCxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQztRQUVGLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7WUFDN0IsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hCLENBQUM7UUFFRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0NBQ0Y7QUFVRDs7R0FFRztBQUNILE1BQU0sZUFBZTtJQUNYLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDbkIsT0FBTyxHQUFrQjtRQUMvQixPQUFPLEVBQUUsQ0FBQztRQUNWLFVBQVUsRUFBRSxDQUFDO1FBQ2IsY0FBYyxFQUFFLENBQUM7UUFDakIsZUFBZSxFQUFFLENBQUM7S0FDbkIsQ0FBQztJQUVGLEtBQUs7UUFDSCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQsS0FBSyxDQUFDLGtCQUFrQjtRQUN0Qix1QkFBdUI7UUFDdkIsT0FBTztZQUNMLEdBQUcsRUFBRSxHQUFHLEVBQU8sY0FBYztZQUM3QixNQUFNLEVBQUUsSUFBSSxFQUFHLGVBQWU7WUFDOUIsT0FBTyxFQUFFLElBQUksRUFBRSxnQkFBZ0I7WUFDL0IsVUFBVSxFQUFFLElBQUk7U0FDakIsQ0FBQztJQUNKLENBQUM7SUFFRCxVQUFVO1FBQ1IsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdCLENBQUM7Q0FDRjtBQUVEOztHQUVHO0FBQ0gsTUFBTSxrQkFBa0I7SUFDdEIsT0FBTyxDQUFDLE9BQXFCO1FBQzNCLHFCQUFxQjtRQUNyQixNQUFNLFFBQVEsR0FBaUIsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFFbEMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxNQUFrQixFQUFFLEVBQUU7WUFDbkMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBQUUsT0FBTztZQUVyQyxZQUFZO1lBQ1osS0FBSyxNQUFNLE9BQU8sSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ2hELEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDcEIsQ0FBQztZQUNILENBQUM7WUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQztRQUVGLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7WUFDN0IsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hCLENBQUM7UUFFRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOODhuOCueODiOWun+ihjOOCquODvOOCseOCueODiOODrOODvOOCv+ODvFxuICogXG4gKiDntbHlkIjjg4bjgrnjg4jjgrnjgqTjg7zjg4jjga7lrp/ooYzjgpLliLblvqHjgZfjgIHmnIDpganljJbjgZXjgozjgZ/lrp/ooYzmiKbnlaXjgpLmj5DkvptcbiAqIC0g5L6d5a2Y6Zai5L+C566h55CGXG4gKiAtIOODquOCveODvOOCueebo+imllxuICogLSDlrp/ooYzmnIDpganljJZcbiAqIC0g6Zqc5a6z5Zue5b6pXG4gKi9cblxuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcblxuLy8g5a6f6KGM5oim55Wl44Kk44Oz44K/44O8ZmFjZVxuaW50ZXJmYWNlIEV4ZWN1dGlvblN0cmF0ZWd5IHtcbiAgbmFtZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBleGVjdXRlKG1vZHVsZXM6IFRlc3RNb2R1bGVbXSk6IFByb21pc2U8RXhlY3V0aW9uUmVzdWx0Pjtcbn1cblxuLy8g44OG44K544OI44Oi44K444Ol44O844Or5a6a576pXG5pbnRlcmZhY2UgVGVzdE1vZHVsZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgcHJpb3JpdHk6IG51bWJlcjtcbiAgZGVwZW5kZW5jaWVzOiBzdHJpbmdbXTtcbiAgZXN0aW1hdGVkRHVyYXRpb246IG51bWJlcjtcbiAgcmVzb3VyY2VSZXF1aXJlbWVudHM6IFJlc291cmNlUmVxdWlyZW1lbnRzO1xuICBleGVjdXRlKCk6IFByb21pc2U8TW9kdWxlUmVzdWx0Pjtcbn1cblxuLy8g44Oq44K944O844K56KaB5Lu2XG5pbnRlcmZhY2UgUmVzb3VyY2VSZXF1aXJlbWVudHMge1xuICBjcHU6IG51bWJlcjsgICAgICAgIC8vIENQVeS9v+eUqOeOhyAoMC0xMDApXG4gIG1lbW9yeTogbnVtYmVyOyAgICAgLy8g44Oh44Oi44Oq5L2/55So6YePIChNQilcbiAgbmV0d29yazogbnVtYmVyOyAgICAvLyDjg43jg4Pjg4jjg6/jg7zjgq/luK/ln58gKE1icHMpXG4gIGNvbmN1cnJlbnQ6IGJvb2xlYW47IC8vIOS4puWIl+Wun+ihjOWPr+iDveOBi1xufVxuXG4vLyDlrp/ooYzntZDmnpxcbmludGVyZmFjZSBFeGVjdXRpb25SZXN1bHQge1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBtb2R1bGVzOiB7IFtrZXk6IHN0cmluZ106IE1vZHVsZVJlc3VsdCB9O1xuICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gIHJlc291cmNlVXNhZ2U6IFJlc291cmNlVXNhZ2U7XG4gIG9wdGltaXphdGlvbk1ldHJpY3M6IE9wdGltaXphdGlvbk1ldHJpY3M7XG59XG5cbi8vIOODouOCuOODpeODvOODq+e1kOaenFxuaW50ZXJmYWNlIE1vZHVsZVJlc3VsdCB7XG4gIHN1Y2Nlc3M6IGJvb2xlYW47XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIHN0YXJ0VGltZTogc3RyaW5nO1xuICBlbmRUaW1lOiBzdHJpbmc7XG4gIHJlc291cmNlVXNhZ2U6IFJlc291cmNlVXNhZ2U7XG4gIGVycm9yPzogc3RyaW5nO1xuICByZXRyeUNvdW50OiBudW1iZXI7XG59XG5cbi8vIOODquOCveODvOOCueS9v+eUqOmHj1xuaW50ZXJmYWNlIFJlc291cmNlVXNhZ2Uge1xuICBwZWFrQ3B1OiBudW1iZXI7XG4gIHBlYWtNZW1vcnk6IG51bWJlcjtcbiAgbmV0d29ya1RyYWZmaWM6IG51bWJlcjtcbiAgY29uY3VycmVudFRlc3RzOiBudW1iZXI7XG59XG5cbi8vIOacgOmBqeWMluODoeODiOODquOCr+OCuVxuaW50ZXJmYWNlIE9wdGltaXphdGlvbk1ldHJpY3Mge1xuICBwYXJhbGxlbGl6YXRpb25SYXRpbzogbnVtYmVyO1xuICByZXNvdXJjZUVmZmljaWVuY3k6IG51bWJlcjtcbiAgdGltZU9wdGltaXphdGlvbjogbnVtYmVyO1xuICBmYWlsdXJlUmVjb3ZlcnlUaW1lOiBudW1iZXI7XG59XG5cbi8qKlxuICog44OG44K544OI5a6f6KGM44Kq44O844Kx44K544OI44Os44O844K/44O8XG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0T3JjaGVzdHJhdG9yIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgcHJpdmF0ZSBtb2R1bGVzOiBNYXA8c3RyaW5nLCBUZXN0TW9kdWxlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdHJhdGVnaWVzOiBNYXA8c3RyaW5nLCBFeGVjdXRpb25TdHJhdGVneT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgcmVzb3VyY2VNb25pdG9yOiBSZXNvdXJjZU1vbml0b3I7XG4gIHByaXZhdGUgZGVwZW5kZW5jeVJlc29sdmVyOiBEZXBlbmRlbmN5UmVzb2x2ZXI7XG4gIFxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZVN0cmF0ZWdpZXMoKTtcbiAgICB0aGlzLnJlc291cmNlTW9uaXRvciA9IG5ldyBSZXNvdXJjZU1vbml0b3IoKTtcbiAgICB0aGlzLmRlcGVuZGVuY3lSZXNvbHZlciA9IG5ldyBEZXBlbmRlbmN5UmVzb2x2ZXIoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOWun+ihjOaIpueVpeOBruWIneacn+WMllxuICAgKi9cbiAgcHJpdmF0ZSBpbml0aWFsaXplU3RyYXRlZ2llcygpOiB2b2lkIHtcbiAgICAvLyDpoIbmrKHlrp/ooYzmiKbnlaVcbiAgICB0aGlzLnN0cmF0ZWdpZXMuc2V0KCdzZXF1ZW50aWFsJywgbmV3IFNlcXVlbnRpYWxTdHJhdGVneSgpKTtcbiAgICBcbiAgICAvLyDkuKbliJflrp/ooYzmiKbnlaVcbiAgICB0aGlzLnN0cmF0ZWdpZXMuc2V0KCdwYXJhbGxlbCcsIG5ldyBQYXJhbGxlbFN0cmF0ZWd5KCkpO1xuICAgIFxuICAgIC8vIOacgOmBqeWMluWun+ihjOaIpueVpVxuICAgIHRoaXMuc3RyYXRlZ2llcy5zZXQoJ29wdGltaXplZCcsIG5ldyBPcHRpbWl6ZWRTdHJhdGVneSgpKTtcbiAgICBcbiAgICAvLyDkvp3lrZjplqLkv4LogIPmha7miKbnlaVcbiAgICB0aGlzLnN0cmF0ZWdpZXMuc2V0KCdkZXBlbmRlbmN5LWF3YXJlJywgbmV3IERlcGVuZGVuY3lBd2FyZVN0cmF0ZWd5KCkpO1xuICB9XG4gIFxuICAvKipcbiAgICog44OG44K544OI44Oi44K444Ol44O844Or44Gu55m76YyyXG4gICAqL1xuICByZWdpc3Rlck1vZHVsZShtb2R1bGU6IFRlc3RNb2R1bGUpOiB2b2lkIHtcbiAgICBjb25zb2xlLmxvZyhg8J+TiyDjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vnmbvpjLI6ICR7bW9kdWxlLm5hbWV9YCk7XG4gICAgdGhpcy5tb2R1bGVzLnNldChtb2R1bGUubmFtZSwgbW9kdWxlKTtcbiAgICB0aGlzLmVtaXQoJ21vZHVsZVJlZ2lzdGVyZWQnLCBtb2R1bGUpO1xuICB9XG4gIFxuICAvKipcbiAgICog44OG44K544OI5a6f6KGM44Gu6ZaL5aeLXG4gICAqL1xuICBhc3luYyBleGVjdXRlKHN0cmF0ZWd5TmFtZTogc3RyaW5nID0gJ29wdGltaXplZCcpOiBQcm9taXNlPEV4ZWN1dGlvblJlc3VsdD4ge1xuICAgIGNvbnNvbGUubG9nKGDwn5qAIOODhuOCueODiOWun+ihjOmWi+WniyAtIOaIpueVpTogJHtzdHJhdGVneU5hbWV9YCk7XG4gICAgXG4gICAgY29uc3Qgc3RyYXRlZ3kgPSB0aGlzLnN0cmF0ZWdpZXMuZ2V0KHN0cmF0ZWd5TmFtZSk7XG4gICAgaWYgKCFzdHJhdGVneSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGDmnKrnn6Xjga7lrp/ooYzmiKbnlaU6ICR7c3RyYXRlZ3lOYW1lfWApO1xuICAgIH1cbiAgICBcbiAgICAvLyDlrp/ooYzliY3jga7mupblgplcbiAgICBhd2FpdCB0aGlzLnByZXBhcmVFeGVjdXRpb24oKTtcbiAgICBcbiAgICAvLyDkvp3lrZjplqLkv4Ljga7op6PmsbpcbiAgICBjb25zdCBzb3J0ZWRNb2R1bGVzID0gdGhpcy5kZXBlbmRlbmN5UmVzb2x2ZXIucmVzb2x2ZShBcnJheS5mcm9tKHRoaXMubW9kdWxlcy52YWx1ZXMoKSkpO1xuICAgIFxuICAgIC8vIOODquOCveODvOOCueebo+imlumWi+Wni1xuICAgIHRoaXMucmVzb3VyY2VNb25pdG9yLnN0YXJ0KCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIOaIpueVpeOBq+WfuuOBpeOBj+Wun+ihjFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc3RyYXRlZ3kuZXhlY3V0ZShzb3J0ZWRNb2R1bGVzKTtcbiAgICAgIFxuICAgICAgLy8g5pyA6YGp5YyW44Oh44OI44Oq44Kv44K544Gu6KiI566XXG4gICAgICByZXN1bHQub3B0aW1pemF0aW9uTWV0cmljcyA9IHRoaXMuY2FsY3VsYXRlT3B0aW1pemF0aW9uTWV0cmljcyhyZXN1bHQpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZygn4pyFIOODhuOCueODiOWun+ihjOWujOS6hicpO1xuICAgICAgdGhpcy5lbWl0KCdleGVjdXRpb25Db21wbGV0ZWQnLCByZXN1bHQpO1xuICAgICAgXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgdGhpcy5lbWl0KCdleGVjdXRpb25GYWlsZWQnLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIFxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyDjg6rjgr3jg7zjgrnnm6PoppblgZzmraJcbiAgICAgIHRoaXMucmVzb3VyY2VNb25pdG9yLnN0b3AoKTtcbiAgICAgIFxuICAgICAgLy8g44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAgICBhd2FpdCB0aGlzLmNsZWFudXAoKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDlrp/ooYzliY3jga7mupblgplcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcHJlcGFyZUV4ZWN1dGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+UpyDlrp/ooYznkrDlooPjgpLmupblgpnkuK0uLi4nKTtcbiAgICBcbiAgICAvLyDjgrfjgrnjg4bjg6Djg6rjgr3jg7zjgrnjga7norroqo1cbiAgICBjb25zdCBzeXN0ZW1SZXNvdXJjZXMgPSBhd2FpdCB0aGlzLnJlc291cmNlTW9uaXRvci5nZXRTeXN0ZW1SZXNvdXJjZXMoKTtcbiAgICBjb25zb2xlLmxvZygn8J+SuyDjgrfjgrnjg4bjg6Djg6rjgr3jg7zjgrk6Jywgc3lzdGVtUmVzb3VyY2VzKTtcbiAgICBcbiAgICAvLyDlv4XopoHjg6rjgr3jg7zjgrnjga7oqIjnrpdcbiAgICBjb25zdCByZXF1aXJlZFJlc291cmNlcyA9IHRoaXMuY2FsY3VsYXRlUmVxdWlyZWRSZXNvdXJjZXMoKTtcbiAgICBjb25zb2xlLmxvZygn8J+TiiDlv4XopoHjg6rjgr3jg7zjgrk6JywgcmVxdWlyZWRSZXNvdXJjZXMpO1xuICAgIFxuICAgIC8vIOODquOCveODvOOCueS4jei2s+OBrueiuuiqjVxuICAgIGlmICghdGhpcy5oYXNFbm91Z2hSZXNvdXJjZXMoc3lzdGVtUmVzb3VyY2VzLCByZXF1aXJlZFJlc291cmNlcykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign44K344K544OG44Og44Oq44K944O844K544GM5LiN6Laz44GX44Gm44GE44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKCfinIUg5a6f6KGM55Kw5aKD5rqW5YKZ5a6M5LqGJyk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDlv4XopoHjg6rjgr3jg7zjgrnjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlUmVxdWlyZWRSZXNvdXJjZXMoKTogUmVzb3VyY2VSZXF1aXJlbWVudHMge1xuICAgIGxldCB0b3RhbENwdSA9IDA7XG4gICAgbGV0IHRvdGFsTWVtb3J5ID0gMDtcbiAgICBsZXQgdG90YWxOZXR3b3JrID0gMDtcbiAgICBcbiAgICBmb3IgKGNvbnN0IG1vZHVsZSBvZiB0aGlzLm1vZHVsZXMudmFsdWVzKCkpIHtcbiAgICAgIHRvdGFsQ3B1ICs9IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5jcHU7XG4gICAgICB0b3RhbE1lbW9yeSArPSBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubWVtb3J5O1xuICAgICAgdG90YWxOZXR3b3JrICs9IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5uZXR3b3JrO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgY3B1OiB0b3RhbENwdSxcbiAgICAgIG1lbW9yeTogdG90YWxNZW1vcnksXG4gICAgICBuZXR3b3JrOiB0b3RhbE5ldHdvcmssXG4gICAgICBjb25jdXJyZW50OiB0cnVlXG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODquOCveODvOOCueWFhei2s+aAp+OBrueiuuiqjVxuICAgKi9cbiAgcHJpdmF0ZSBoYXNFbm91Z2hSZXNvdXJjZXMoXG4gICAgYXZhaWxhYmxlOiBSZXNvdXJjZVJlcXVpcmVtZW50cyxcbiAgICByZXF1aXJlZDogUmVzb3VyY2VSZXF1aXJlbWVudHNcbiAgKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIGF2YWlsYWJsZS5jcHUgPj0gcmVxdWlyZWQuY3B1ICYmXG4gICAgICBhdmFpbGFibGUubWVtb3J5ID49IHJlcXVpcmVkLm1lbW9yeSAmJlxuICAgICAgYXZhaWxhYmxlLm5ldHdvcmsgPj0gcmVxdWlyZWQubmV0d29ya1xuICAgICk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDmnIDpganljJbjg6Hjg4jjg6rjgq/jgrnjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlT3B0aW1pemF0aW9uTWV0cmljcyhyZXN1bHQ6IEV4ZWN1dGlvblJlc3VsdCk6IE9wdGltaXphdGlvbk1ldHJpY3Mge1xuICAgIGNvbnN0IHRvdGFsTW9kdWxlcyA9IE9iamVjdC5rZXlzKHJlc3VsdC5tb2R1bGVzKS5sZW5ndGg7XG4gICAgY29uc3QgcGFyYWxsZWxNb2R1bGVzID0gT2JqZWN0LnZhbHVlcyhyZXN1bHQubW9kdWxlcylcbiAgICAgIC5maWx0ZXIobSA9PiBtLnJlc291cmNlVXNhZ2UuY29uY3VycmVudFRlc3RzID4gMSkubGVuZ3RoO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBwYXJhbGxlbGl6YXRpb25SYXRpbzogdG90YWxNb2R1bGVzID4gMCA/IHBhcmFsbGVsTW9kdWxlcyAvIHRvdGFsTW9kdWxlcyA6IDAsXG4gICAgICByZXNvdXJjZUVmZmljaWVuY3k6IHRoaXMuY2FsY3VsYXRlUmVzb3VyY2VFZmZpY2llbmN5KHJlc3VsdC5yZXNvdXJjZVVzYWdlKSxcbiAgICAgIHRpbWVPcHRpbWl6YXRpb246IHRoaXMuY2FsY3VsYXRlVGltZU9wdGltaXphdGlvbihyZXN1bHQpLFxuICAgICAgZmFpbHVyZVJlY292ZXJ5VGltZTogdGhpcy5jYWxjdWxhdGVGYWlsdXJlUmVjb3ZlcnlUaW1lKHJlc3VsdClcbiAgICB9O1xuICB9XG4gIFxuICAvKipcbiAgICog44Oq44K944O844K55Yq5546H44Gu6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVJlc291cmNlRWZmaWNpZW5jeSh1c2FnZTogUmVzb3VyY2VVc2FnZSk6IG51bWJlciB7XG4gICAgLy8gQ1BV44CB44Oh44Oi44Oq44CB44ON44OD44OI44Ov44O844Kv44Gu5bmz5Z2H5L2/55So5Yq5546HXG4gICAgY29uc3QgY3B1RWZmaWNpZW5jeSA9IE1hdGgubWluKHVzYWdlLnBlYWtDcHUgLyAxMDAsIDEpO1xuICAgIGNvbnN0IG1lbW9yeUVmZmljaWVuY3kgPSBNYXRoLm1pbih1c2FnZS5wZWFrTWVtb3J5IC8gODE5MiwgMSk7IC8vIDhHQuWfuua6llxuICAgIGNvbnN0IG5ldHdvcmtFZmZpY2llbmN5ID0gTWF0aC5taW4odXNhZ2UubmV0d29ya1RyYWZmaWMgLyAxMDAsIDEpOyAvLyAxMDBNYnBz5Z+65rqWXG4gICAgXG4gICAgcmV0dXJuIChjcHVFZmZpY2llbmN5ICsgbWVtb3J5RWZmaWNpZW5jeSArIG5ldHdvcmtFZmZpY2llbmN5KSAvIDM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDmmYLplpPmnIDpganljJbjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlVGltZU9wdGltaXphdGlvbihyZXN1bHQ6IEV4ZWN1dGlvblJlc3VsdCk6IG51bWJlciB7XG4gICAgLy8g6aCG5qyh5a6f6KGM5pmC6ZaT44Go5a6f6Zqb44Gu5a6f6KGM5pmC6ZaT44Gu5q+U6LyDXG4gICAgY29uc3Qgc2VxdWVudGlhbFRpbWUgPSBPYmplY3QudmFsdWVzKHJlc3VsdC5tb2R1bGVzKVxuICAgICAgLnJlZHVjZSgodG90YWwsIG1vZHVsZSkgPT4gdG90YWwgKyBtb2R1bGUuZHVyYXRpb24sIDApO1xuICAgIFxuICAgIHJldHVybiBzZXF1ZW50aWFsVGltZSA+IDAgPyAxIC0gKHJlc3VsdC50b3RhbER1cmF0aW9uIC8gc2VxdWVudGlhbFRpbWUpIDogMDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOmanOWus+WbnuW+qeaZgumWk+OBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVGYWlsdXJlUmVjb3ZlcnlUaW1lKHJlc3VsdDogRXhlY3V0aW9uUmVzdWx0KTogbnVtYmVyIHtcbiAgICBjb25zdCBmYWlsZWRNb2R1bGVzID0gT2JqZWN0LnZhbHVlcyhyZXN1bHQubW9kdWxlcylcbiAgICAgIC5maWx0ZXIobSA9PiAhbS5zdWNjZXNzKTtcbiAgICBcbiAgICBpZiAoZmFpbGVkTW9kdWxlcy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIFxuICAgIHJldHVybiBmYWlsZWRNb2R1bGVzLnJlZHVjZSgodG90YWwsIG1vZHVsZSkgPT4ge1xuICAgICAgcmV0dXJuIHRvdGFsICsgKG1vZHVsZS5yZXRyeUNvdW50ICogbW9kdWxlLmR1cmF0aW9uKTtcbiAgICB9LCAwKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOOCr+ODquODvOODs+OCouODg+ODl1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjbGVhbnVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn6e5IOWun+ihjOeSsOWig+OCkuOCr+ODquODvOODs+OCouODg+ODl+S4rS4uLicpO1xuICAgIFxuICAgIC8vIOODquOCveODvOOCueebo+imluOBruWBnOatolxuICAgIHRoaXMucmVzb3VyY2VNb25pdG9yLnN0b3AoKTtcbiAgICBcbiAgICAvLyDkuIDmmYLjg5XjgqHjgqTjg6vjga7liYrpmaRcbiAgICAvLyDjg43jg4Pjg4jjg6/jg7zjgq/mjqXntprjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICAvLyDjg6Hjg6Ljg6rjga7op6PmlL5cbiAgICBcbiAgICBjb25zb2xlLmxvZygn4pyFIOOCr+ODquODvOODs+OCouODg+ODl+WujOS6hicpO1xuICB9XG59XG5cbi8qKlxuICog6aCG5qyh5a6f6KGM5oim55WlXG4gKi9cbmNsYXNzIFNlcXVlbnRpYWxTdHJhdGVneSBpbXBsZW1lbnRzIEV4ZWN1dGlvblN0cmF0ZWd5IHtcbiAgbmFtZSA9ICdzZXF1ZW50aWFsJztcbiAgZGVzY3JpcHRpb24gPSAn5YWo44OG44K544OI44KS6aCG5qyh5a6f6KGMJztcbiAgXG4gIGFzeW5jIGV4ZWN1dGUobW9kdWxlczogVGVzdE1vZHVsZVtdKTogUHJvbWlzZTxFeGVjdXRpb25SZXN1bHQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+TiyDpoIbmrKHlrp/ooYzmiKbnlaXjgafjg4bjgrnjg4jlrp/ooYzkuK0uLi4nKTtcbiAgICBcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHJlc3VsdHM6IHsgW2tleTogc3RyaW5nXTogTW9kdWxlUmVzdWx0IH0gPSB7fTtcbiAgICBjb25zdCByZXNvdXJjZVVzYWdlOiBSZXNvdXJjZVVzYWdlID0ge1xuICAgICAgcGVha0NwdTogMCxcbiAgICAgIHBlYWtNZW1vcnk6IDAsXG4gICAgICBuZXR3b3JrVHJhZmZpYzogMCxcbiAgICAgIGNvbmN1cnJlbnRUZXN0czogMVxuICAgIH07XG4gICAgXG4gICAgZm9yIChjb25zdCBtb2R1bGUgb2YgbW9kdWxlcykge1xuICAgICAgY29uc29sZS5sb2coYPCflIQgJHttb2R1bGUubmFtZX0g5a6f6KGM5LitLi4uYCk7XG4gICAgICBcbiAgICAgIGNvbnN0IG1vZHVsZVN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1vZHVsZS5leGVjdXRlKCk7XG4gICAgICAgIFxuICAgICAgICByZXN1bHRzW21vZHVsZS5uYW1lXSA9IHtcbiAgICAgICAgICAuLi5yZXN1bHQsXG4gICAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShtb2R1bGVTdGFydFRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gbW9kdWxlU3RhcnRUaW1lLFxuICAgICAgICAgIHJldHJ5Q291bnQ6IDAsXG4gICAgICAgICAgcmVzb3VyY2VVc2FnZToge1xuICAgICAgICAgICAgcGVha0NwdTogbW9kdWxlLnJlc291cmNlUmVxdWlyZW1lbnRzLmNwdSxcbiAgICAgICAgICAgIHBlYWtNZW1vcnk6IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5tZW1vcnksXG4gICAgICAgICAgICBuZXR3b3JrVHJhZmZpYzogbW9kdWxlLnJlc291cmNlUmVxdWlyZW1lbnRzLm5ldHdvcmssXG4gICAgICAgICAgICBjb25jdXJyZW50VGVzdHM6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyDjg6rjgr3jg7zjgrnkvb/nlKjph4/jga7mm7TmlrBcbiAgICAgICAgcmVzb3VyY2VVc2FnZS5wZWFrQ3B1ID0gTWF0aC5tYXgocmVzb3VyY2VVc2FnZS5wZWFrQ3B1LCBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMuY3B1KTtcbiAgICAgICAgcmVzb3VyY2VVc2FnZS5wZWFrTWVtb3J5ID0gTWF0aC5tYXgocmVzb3VyY2VVc2FnZS5wZWFrTWVtb3J5LCBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubWVtb3J5KTtcbiAgICAgICAgcmVzb3VyY2VVc2FnZS5uZXR3b3JrVHJhZmZpYyArPSBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubmV0d29yaztcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUgJHttb2R1bGUubmFtZX0g5a6M5LqGYCk7XG4gICAgICAgIFxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihg4p2MICR7bW9kdWxlLm5hbWV9IOWkseaVlzpgLCBlcnJvcik7XG4gICAgICAgIFxuICAgICAgICByZXN1bHRzW21vZHVsZS5uYW1lXSA9IHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIG1vZHVsZVN0YXJ0VGltZSxcbiAgICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKG1vZHVsZVN0YXJ0VGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgcmV0cnlDb3VudDogMCxcbiAgICAgICAgICByZXNvdXJjZVVzYWdlOiB7XG4gICAgICAgICAgICBwZWFrQ3B1OiAwLFxuICAgICAgICAgICAgcGVha01lbW9yeTogMCxcbiAgICAgICAgICAgIG5ldHdvcmtUcmFmZmljOiAwLFxuICAgICAgICAgICAgY29uY3VycmVudFRlc3RzOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zdCB0b3RhbER1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICBjb25zdCBzdWNjZXNzID0gT2JqZWN0LnZhbHVlcyhyZXN1bHRzKS5ldmVyeShyID0+IHIuc3VjY2Vzcyk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3MsXG4gICAgICBtb2R1bGVzOiByZXN1bHRzLFxuICAgICAgdG90YWxEdXJhdGlvbixcbiAgICAgIHJlc291cmNlVXNhZ2UsXG4gICAgICBvcHRpbWl6YXRpb25NZXRyaWNzOiB7XG4gICAgICAgIHBhcmFsbGVsaXphdGlvblJhdGlvOiAwLFxuICAgICAgICByZXNvdXJjZUVmZmljaWVuY3k6IDAsXG4gICAgICAgIHRpbWVPcHRpbWl6YXRpb246IDAsXG4gICAgICAgIGZhaWx1cmVSZWNvdmVyeVRpbWU6IDBcbiAgICAgIH1cbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICog5Lim5YiX5a6f6KGM5oim55WlXG4gKi9cbmNsYXNzIFBhcmFsbGVsU3RyYXRlZ3kgaW1wbGVtZW50cyBFeGVjdXRpb25TdHJhdGVneSB7XG4gIG5hbWUgPSAncGFyYWxsZWwnO1xuICBkZXNjcmlwdGlvbiA9ICflj6/og73jgarpmZDjgorkuKbliJflrp/ooYwnO1xuICBcbiAgYXN5bmMgZXhlY3V0ZShtb2R1bGVzOiBUZXN0TW9kdWxlW10pOiBQcm9taXNlPEV4ZWN1dGlvblJlc3VsdD4ge1xuICAgIGNvbnNvbGUubG9nKCfimqEg5Lim5YiX5a6f6KGM5oim55Wl44Gn44OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBjb25jdXJyZW50TW9kdWxlcyA9IG1vZHVsZXMuZmlsdGVyKG0gPT4gbS5yZXNvdXJjZVJlcXVpcmVtZW50cy5jb25jdXJyZW50KTtcbiAgICBjb25zdCBzZXF1ZW50aWFsTW9kdWxlcyA9IG1vZHVsZXMuZmlsdGVyKG0gPT4gIW0ucmVzb3VyY2VSZXF1aXJlbWVudHMuY29uY3VycmVudCk7XG4gICAgXG4gICAgLy8g5Lim5YiX5a6f6KGM5Y+v6IO944Gq44Oi44K444Ol44O844Or44KS5Lim5YiX5a6f6KGMXG4gICAgY29uc3QgcGFyYWxsZWxQcm9taXNlcyA9IGNvbmN1cnJlbnRNb2R1bGVzLm1hcChhc3luYyAobW9kdWxlKSA9PiB7XG4gICAgICBjb25zdCBtb2R1bGVTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtb2R1bGUuZXhlY3V0ZSgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5hbWU6IG1vZHVsZS5uYW1lLFxuICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgLi4ucmVzdWx0LFxuICAgICAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShtb2R1bGVTdGFydFRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIG1vZHVsZVN0YXJ0VGltZSxcbiAgICAgICAgICAgIHJldHJ5Q291bnQ6IDAsXG4gICAgICAgICAgICByZXNvdXJjZVVzYWdlOiB7XG4gICAgICAgICAgICAgIHBlYWtDcHU6IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5jcHUsXG4gICAgICAgICAgICAgIHBlYWtNZW1vcnk6IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5tZW1vcnksXG4gICAgICAgICAgICAgIG5ldHdvcmtUcmFmZmljOiBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubmV0d29yayxcbiAgICAgICAgICAgICAgY29uY3VycmVudFRlc3RzOiBjb25jdXJyZW50TW9kdWxlcy5sZW5ndGhcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5hbWU6IG1vZHVsZS5uYW1lLFxuICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIG1vZHVsZVN0YXJ0VGltZSxcbiAgICAgICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUobW9kdWxlU3RhcnRUaW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICByZXRyeUNvdW50OiAwLFxuICAgICAgICAgICAgcmVzb3VyY2VVc2FnZToge1xuICAgICAgICAgICAgICBwZWFrQ3B1OiAwLFxuICAgICAgICAgICAgICBwZWFrTWVtb3J5OiAwLFxuICAgICAgICAgICAgICBuZXR3b3JrVHJhZmZpYzogMCxcbiAgICAgICAgICAgICAgY29uY3VycmVudFRlc3RzOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHBhcmFsbGVsUmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKHBhcmFsbGVsUHJvbWlzZXMpO1xuICAgIGNvbnN0IHJlc3VsdHM6IHsgW2tleTogc3RyaW5nXTogTW9kdWxlUmVzdWx0IH0gPSB7fTtcbiAgICBcbiAgICAvLyDkuKbliJflrp/ooYzntZDmnpzjga7ntbHlkIhcbiAgICBmb3IgKGNvbnN0IHsgbmFtZSwgcmVzdWx0IH0gb2YgcGFyYWxsZWxSZXN1bHRzKSB7XG4gICAgICByZXN1bHRzW25hbWVdID0gcmVzdWx0O1xuICAgIH1cbiAgICBcbiAgICAvLyDpoIbmrKHlrp/ooYzjgYzlv4XopoHjgarjg6Ljgrjjg6Xjg7zjg6vjgpLlrp/ooYxcbiAgICBmb3IgKGNvbnN0IG1vZHVsZSBvZiBzZXF1ZW50aWFsTW9kdWxlcykge1xuICAgICAgY29uc3QgbW9kdWxlU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbW9kdWxlLmV4ZWN1dGUoKTtcbiAgICAgICAgcmVzdWx0c1ttb2R1bGUubmFtZV0gPSB7XG4gICAgICAgICAgLi4ucmVzdWx0LFxuICAgICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUobW9kdWxlU3RhcnRUaW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIG1vZHVsZVN0YXJ0VGltZSxcbiAgICAgICAgICByZXRyeUNvdW50OiAwLFxuICAgICAgICAgIHJlc291cmNlVXNhZ2U6IHtcbiAgICAgICAgICAgIHBlYWtDcHU6IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5jcHUsXG4gICAgICAgICAgICBwZWFrTWVtb3J5OiBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubWVtb3J5LFxuICAgICAgICAgICAgbmV0d29ya1RyYWZmaWM6IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5uZXR3b3JrLFxuICAgICAgICAgICAgY29uY3VycmVudFRlc3RzOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVzdWx0c1ttb2R1bGUubmFtZV0gPSB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBtb2R1bGVTdGFydFRpbWUsXG4gICAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShtb2R1bGVTdGFydFRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgIHJldHJ5Q291bnQ6IDAsXG4gICAgICAgICAgcmVzb3VyY2VVc2FnZToge1xuICAgICAgICAgICAgcGVha0NwdTogMCxcbiAgICAgICAgICAgIHBlYWtNZW1vcnk6IDAsXG4gICAgICAgICAgICBuZXR3b3JrVHJhZmZpYzogMCxcbiAgICAgICAgICAgIGNvbmN1cnJlbnRUZXN0czogMVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY29uc3QgdG90YWxEdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgY29uc3Qgc3VjY2VzcyA9IE9iamVjdC52YWx1ZXMocmVzdWx0cykuZXZlcnkociA9PiByLnN1Y2Nlc3MpO1xuICAgIFxuICAgIC8vIOODquOCveODvOOCueS9v+eUqOmHj+OBruioiOeul1xuICAgIGNvbnN0IHJlc291cmNlVXNhZ2U6IFJlc291cmNlVXNhZ2UgPSB7XG4gICAgICBwZWFrQ3B1OiBNYXRoLm1heCguLi5PYmplY3QudmFsdWVzKHJlc3VsdHMpLm1hcChyID0+IHIucmVzb3VyY2VVc2FnZS5wZWFrQ3B1KSksXG4gICAgICBwZWFrTWVtb3J5OiBNYXRoLm1heCguLi5PYmplY3QudmFsdWVzKHJlc3VsdHMpLm1hcChyID0+IHIucmVzb3VyY2VVc2FnZS5wZWFrTWVtb3J5KSksXG4gICAgICBuZXR3b3JrVHJhZmZpYzogT2JqZWN0LnZhbHVlcyhyZXN1bHRzKS5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5yZXNvdXJjZVVzYWdlLm5ldHdvcmtUcmFmZmljLCAwKSxcbiAgICAgIGNvbmN1cnJlbnRUZXN0czogY29uY3VycmVudE1vZHVsZXMubGVuZ3RoXG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzcyxcbiAgICAgIG1vZHVsZXM6IHJlc3VsdHMsXG4gICAgICB0b3RhbER1cmF0aW9uLFxuICAgICAgcmVzb3VyY2VVc2FnZSxcbiAgICAgIG9wdGltaXphdGlvbk1ldHJpY3M6IHtcbiAgICAgICAgcGFyYWxsZWxpemF0aW9uUmF0aW86IDAsXG4gICAgICAgIHJlc291cmNlRWZmaWNpZW5jeTogMCxcbiAgICAgICAgdGltZU9wdGltaXphdGlvbjogMCxcbiAgICAgICAgZmFpbHVyZVJlY292ZXJ5VGltZTogMFxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiDmnIDpganljJblrp/ooYzmiKbnlaVcbiAqL1xuY2xhc3MgT3B0aW1pemVkU3RyYXRlZ3kgaW1wbGVtZW50cyBFeGVjdXRpb25TdHJhdGVneSB7XG4gIG5hbWUgPSAnb3B0aW1pemVkJztcbiAgZGVzY3JpcHRpb24gPSAn44Oq44K944O844K544Go5L6d5a2Y6Zai5L+C44KS6ICD5oWu44GX44Gf5pyA6YGp5YyW5a6f6KGMJztcbiAgXG4gIGFzeW5jIGV4ZWN1dGUobW9kdWxlczogVGVzdE1vZHVsZVtdKTogUHJvbWlzZTxFeGVjdXRpb25SZXN1bHQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+OryDmnIDpganljJblrp/ooYzmiKbnlaXjgafjg4bjgrnjg4jlrp/ooYzkuK0uLi4nKTtcbiAgICBcbiAgICAvLyDlrp/ooYzoqIjnlLvjga7kvZzmiJBcbiAgICBjb25zdCBleGVjdXRpb25QbGFuID0gdGhpcy5jcmVhdGVFeGVjdXRpb25QbGFuKG1vZHVsZXMpO1xuICAgIFxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgcmVzdWx0czogeyBba2V5OiBzdHJpbmddOiBNb2R1bGVSZXN1bHQgfSA9IHt9O1xuICAgIFxuICAgIC8vIOWun+ihjOioiOeUu+OBq+WfuuOBpeOBj+Wun+ihjFxuICAgIGZvciAoY29uc3QgcGhhc2Ugb2YgZXhlY3V0aW9uUGxhbikge1xuICAgICAgY29uc29sZS5sb2coYPCflIQgUGhhc2UgJHtwaGFzZS5pZH0g5a6f6KGM5LitOiAke3BoYXNlLm1vZHVsZXMubWFwKG0gPT4gbS5uYW1lKS5qb2luKCcsICcpfWApO1xuICAgICAgXG4gICAgICBpZiAocGhhc2UucGFyYWxsZWwpIHtcbiAgICAgICAgLy8g5Lim5YiX5a6f6KGMXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gcGhhc2UubW9kdWxlcy5tYXAobW9kdWxlID0+IHRoaXMuZXhlY3V0ZU1vZHVsZShtb2R1bGUpKTtcbiAgICAgICAgY29uc3QgcGhhc2VSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgICAgICBcbiAgICAgICAgZm9yIChjb25zdCByZXN1bHQgb2YgcGhhc2VSZXN1bHRzKSB7XG4gICAgICAgICAgcmVzdWx0c1tyZXN1bHQubmFtZV0gPSByZXN1bHQucmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyDpoIbmrKHlrp/ooYxcbiAgICAgICAgZm9yIChjb25zdCBtb2R1bGUgb2YgcGhhc2UubW9kdWxlcykge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZXhlY3V0ZU1vZHVsZShtb2R1bGUpO1xuICAgICAgICAgIHJlc3VsdHNbcmVzdWx0Lm5hbWVdID0gcmVzdWx0LnJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zdCB0b3RhbER1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICBjb25zdCBzdWNjZXNzID0gT2JqZWN0LnZhbHVlcyhyZXN1bHRzKS5ldmVyeShyID0+IHIuc3VjY2Vzcyk7XG4gICAgXG4gICAgLy8g44Oq44K944O844K55L2/55So6YeP44Gu6KiI566XXG4gICAgY29uc3QgcmVzb3VyY2VVc2FnZTogUmVzb3VyY2VVc2FnZSA9IHtcbiAgICAgIHBlYWtDcHU6IE1hdGgubWF4KC4uLk9iamVjdC52YWx1ZXMocmVzdWx0cykubWFwKHIgPT4gci5yZXNvdXJjZVVzYWdlLnBlYWtDcHUpKSxcbiAgICAgIHBlYWtNZW1vcnk6IE1hdGgubWF4KC4uLk9iamVjdC52YWx1ZXMocmVzdWx0cykubWFwKHIgPT4gci5yZXNvdXJjZVVzYWdlLnBlYWtNZW1vcnkpKSxcbiAgICAgIG5ldHdvcmtUcmFmZmljOiBPYmplY3QudmFsdWVzKHJlc3VsdHMpLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLnJlc291cmNlVXNhZ2UubmV0d29ya1RyYWZmaWMsIDApLFxuICAgICAgY29uY3VycmVudFRlc3RzOiBNYXRoLm1heCguLi5leGVjdXRpb25QbGFuLmZpbHRlcihwID0+IHAucGFyYWxsZWwpLm1hcChwID0+IHAubW9kdWxlcy5sZW5ndGgpKVxuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3MsXG4gICAgICBtb2R1bGVzOiByZXN1bHRzLFxuICAgICAgdG90YWxEdXJhdGlvbixcbiAgICAgIHJlc291cmNlVXNhZ2UsXG4gICAgICBvcHRpbWl6YXRpb25NZXRyaWNzOiB7XG4gICAgICAgIHBhcmFsbGVsaXphdGlvblJhdGlvOiAwLFxuICAgICAgICByZXNvdXJjZUVmZmljaWVuY3k6IDAsXG4gICAgICAgIHRpbWVPcHRpbWl6YXRpb246IDAsXG4gICAgICAgIGZhaWx1cmVSZWNvdmVyeVRpbWU6IDBcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFxuICAvKipcbiAgICog5a6f6KGM6KiI55S744Gu5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUV4ZWN1dGlvblBsYW4obW9kdWxlczogVGVzdE1vZHVsZVtdKTogRXhlY3V0aW9uUGhhc2VbXSB7XG4gICAgY29uc3QgcGhhc2VzOiBFeGVjdXRpb25QaGFzZVtdID0gW107XG4gICAgY29uc3QgcHJvY2Vzc2VkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgXG4gICAgLy8g5YSq5YWI5bqm44Go44Oq44K944O844K56KaB5Lu244Gr5Z+644Gl44GP5pyA6YGp5YyWXG4gICAgY29uc3Qgc29ydGVkTW9kdWxlcyA9IFsuLi5tb2R1bGVzXS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAvLyDlhKrlhYjluqbjgYzpq5jjgYTpoIZcbiAgICAgIGlmIChhLnByaW9yaXR5ICE9PSBiLnByaW9yaXR5KSB7XG4gICAgICAgIHJldHVybiBiLnByaW9yaXR5IC0gYS5wcmlvcml0eTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8g44Oq44K944O844K56KaB5Lu244GM5bCR44Gq44GE6aCGXG4gICAgICBjb25zdCBhUmVzb3VyY2UgPSBhLnJlc291cmNlUmVxdWlyZW1lbnRzLmNwdSArIGEucmVzb3VyY2VSZXF1aXJlbWVudHMubWVtb3J5O1xuICAgICAgY29uc3QgYlJlc291cmNlID0gYi5yZXNvdXJjZVJlcXVpcmVtZW50cy5jcHUgKyBiLnJlc291cmNlUmVxdWlyZW1lbnRzLm1lbW9yeTtcbiAgICAgIHJldHVybiBhUmVzb3VyY2UgLSBiUmVzb3VyY2U7XG4gICAgfSk7XG4gICAgXG4gICAgbGV0IHBoYXNlSWQgPSAxO1xuICAgIFxuICAgIHdoaWxlIChwcm9jZXNzZWQuc2l6ZSA8IG1vZHVsZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwaGFzZU1vZHVsZXM6IFRlc3RNb2R1bGVbXSA9IFtdO1xuICAgICAgbGV0IHRvdGFsQ3B1ID0gMDtcbiAgICAgIGxldCB0b3RhbE1lbW9yeSA9IDA7XG4gICAgICBcbiAgICAgIGZvciAoY29uc3QgbW9kdWxlIG9mIHNvcnRlZE1vZHVsZXMpIHtcbiAgICAgICAgaWYgKHByb2Nlc3NlZC5oYXMobW9kdWxlLm5hbWUpKSBjb250aW51ZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS+neWtmOmWouS/guOBrueiuuiqjVxuICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXNNZXQgPSBtb2R1bGUuZGVwZW5kZW5jaWVzLmV2ZXJ5KGRlcCA9PiBwcm9jZXNzZWQuaGFzKGRlcCkpO1xuICAgICAgICBpZiAoIWRlcGVuZGVuY2llc01ldCkgY29udGludWU7XG4gICAgICAgIFxuICAgICAgICAvLyDjg6rjgr3jg7zjgrnliLbpmZDjga7norroqo3vvIhDUFUgODAlLCBNZW1vcnkgNkdC5Yi26ZmQ77yJXG4gICAgICAgIGlmICh0b3RhbENwdSArIG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5jcHUgPiA4MCB8fFxuICAgICAgICAgICAgdG90YWxNZW1vcnkgKyBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubWVtb3J5ID4gNjE0NCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwaGFzZU1vZHVsZXMucHVzaChtb2R1bGUpO1xuICAgICAgICB0b3RhbENwdSArPSBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMuY3B1O1xuICAgICAgICB0b3RhbE1lbW9yeSArPSBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubWVtb3J5O1xuICAgICAgICBwcm9jZXNzZWQuYWRkKG1vZHVsZS5uYW1lKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS4puWIl+Wun+ihjOS4jeWPr+OBruWgtOWQiOOBrzHjgaTjgaDjgZFcbiAgICAgICAgaWYgKCFtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMuY29uY3VycmVudCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChwaGFzZU1vZHVsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBwaGFzZXMucHVzaCh7XG4gICAgICAgICAgaWQ6IHBoYXNlSWQrKyxcbiAgICAgICAgICBtb2R1bGVzOiBwaGFzZU1vZHVsZXMsXG4gICAgICAgICAgcGFyYWxsZWw6IHBoYXNlTW9kdWxlcy5sZW5ndGggPiAxICYmIHBoYXNlTW9kdWxlcy5ldmVyeShtID0+IG0ucmVzb3VyY2VSZXF1aXJlbWVudHMuY29uY3VycmVudCksXG4gICAgICAgICAgZXN0aW1hdGVkRHVyYXRpb246IE1hdGgubWF4KC4uLnBoYXNlTW9kdWxlcy5tYXAobSA9PiBtLmVzdGltYXRlZER1cmF0aW9uKSlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyDjg4fjg4Pjg4njg63jg4Pjgq/lm57pgb/vvJrmrovjgorjga7jg6Ljgrjjg6Xjg7zjg6vjgpLlvLfliLblrp/ooYxcbiAgICAgICAgY29uc3QgcmVtYWluaW5nID0gc29ydGVkTW9kdWxlcy5maWx0ZXIobSA9PiAhcHJvY2Vzc2VkLmhhcyhtLm5hbWUpKTtcbiAgICAgICAgaWYgKHJlbWFpbmluZy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcGhhc2VzLnB1c2goe1xuICAgICAgICAgICAgaWQ6IHBoYXNlSWQrKyxcbiAgICAgICAgICAgIG1vZHVsZXM6IFtyZW1haW5pbmdbMF1dLFxuICAgICAgICAgICAgcGFyYWxsZWw6IGZhbHNlLFxuICAgICAgICAgICAgZXN0aW1hdGVkRHVyYXRpb246IHJlbWFpbmluZ1swXS5lc3RpbWF0ZWREdXJhdGlvblxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHByb2Nlc3NlZC5hZGQocmVtYWluaW5nWzBdLm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBwaGFzZXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjg6Ljgrjjg6Xjg7zjg6vjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZU1vZHVsZShtb2R1bGU6IFRlc3RNb2R1bGUpOiBQcm9taXNlPHsgbmFtZTogc3RyaW5nOyByZXN1bHQ6IE1vZHVsZVJlc3VsdCB9PiB7XG4gICAgY29uc3QgbW9kdWxlU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbW9kdWxlLmV4ZWN1dGUoKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogbW9kdWxlLm5hbWUsXG4gICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgIC4uLnJlc3VsdCxcbiAgICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKG1vZHVsZVN0YXJ0VGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBtb2R1bGVTdGFydFRpbWUsXG4gICAgICAgICAgcmV0cnlDb3VudDogMCxcbiAgICAgICAgICByZXNvdXJjZVVzYWdlOiB7XG4gICAgICAgICAgICBwZWFrQ3B1OiBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMuY3B1LFxuICAgICAgICAgICAgcGVha01lbW9yeTogbW9kdWxlLnJlc291cmNlUmVxdWlyZW1lbnRzLm1lbW9yeSxcbiAgICAgICAgICAgIG5ldHdvcmtUcmFmZmljOiBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubmV0d29yayxcbiAgICAgICAgICAgIGNvbmN1cnJlbnRUZXN0czogMVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogbW9kdWxlLm5hbWUsXG4gICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gbW9kdWxlU3RhcnRUaW1lLFxuICAgICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUobW9kdWxlU3RhcnRUaW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICByZXRyeUNvdW50OiAwLFxuICAgICAgICAgIHJlc291cmNlVXNhZ2U6IHtcbiAgICAgICAgICAgIHBlYWtDcHU6IDAsXG4gICAgICAgICAgICBwZWFrTWVtb3J5OiAwLFxuICAgICAgICAgICAgbmV0d29ya1RyYWZmaWM6IDAsXG4gICAgICAgICAgICBjb25jdXJyZW50VGVzdHM6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICog5L6d5a2Y6Zai5L+C6ICD5oWu5oim55WlXG4gKi9cbmNsYXNzIERlcGVuZGVuY3lBd2FyZVN0cmF0ZWd5IGltcGxlbWVudHMgRXhlY3V0aW9uU3RyYXRlZ3kge1xuICBuYW1lID0gJ2RlcGVuZGVuY3ktYXdhcmUnO1xuICBkZXNjcmlwdGlvbiA9ICfkvp3lrZjplqLkv4LjgpLljrPlr4bjgavogIPmha7jgZfjgZ/lrp/ooYwnO1xuICBcbiAgYXN5bmMgZXhlY3V0ZShtb2R1bGVzOiBUZXN0TW9kdWxlW10pOiBQcm9taXNlPEV4ZWN1dGlvblJlc3VsdD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5SXIOS+neWtmOmWouS/guiAg+aFruaIpueVpeOBp+ODhuOCueODiOWun+ihjOS4rS4uLicpO1xuICAgIFxuICAgIC8vIOS+neWtmOmWouS/guOCsOODqeODleOBruani+evieOBqOWun+ihjOmghuW6j+OBruaxuuWumlxuICAgIGNvbnN0IGV4ZWN1dGlvbk9yZGVyID0gdGhpcy5yZXNvbHZlRGVwZW5kZW5jaWVzKG1vZHVsZXMpO1xuICAgIFxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgcmVzdWx0czogeyBba2V5OiBzdHJpbmddOiBNb2R1bGVSZXN1bHQgfSA9IHt9O1xuICAgIFxuICAgIGZvciAoY29uc3QgbW9kdWxlIG9mIGV4ZWN1dGlvbk9yZGVyKSB7XG4gICAgICBjb25zdCBtb2R1bGVTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtb2R1bGUuZXhlY3V0ZSgpO1xuICAgICAgICBcbiAgICAgICAgcmVzdWx0c1ttb2R1bGUubmFtZV0gPSB7XG4gICAgICAgICAgLi4ucmVzdWx0LFxuICAgICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUobW9kdWxlU3RhcnRUaW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIG1vZHVsZVN0YXJ0VGltZSxcbiAgICAgICAgICByZXRyeUNvdW50OiAwLFxuICAgICAgICAgIHJlc291cmNlVXNhZ2U6IHtcbiAgICAgICAgICAgIHBlYWtDcHU6IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5jcHUsXG4gICAgICAgICAgICBwZWFrTWVtb3J5OiBtb2R1bGUucmVzb3VyY2VSZXF1aXJlbWVudHMubWVtb3J5LFxuICAgICAgICAgICAgbmV0d29ya1RyYWZmaWM6IG1vZHVsZS5yZXNvdXJjZVJlcXVpcmVtZW50cy5uZXR3b3JrLFxuICAgICAgICAgICAgY29uY3VycmVudFRlc3RzOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coYOKchSAke21vZHVsZS5uYW1lfSDlrozkuoZgKTtcbiAgICAgICAgXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgJHttb2R1bGUubmFtZX0g5aSx5pWXOmAsIGVycm9yKTtcbiAgICAgICAgXG4gICAgICAgIHJlc3VsdHNbbW9kdWxlLm5hbWVdID0ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gbW9kdWxlU3RhcnRUaW1lLFxuICAgICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUobW9kdWxlU3RhcnRUaW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICByZXRyeUNvdW50OiAwLFxuICAgICAgICAgIHJlc291cmNlVXNhZ2U6IHtcbiAgICAgICAgICAgIHBlYWtDcHU6IDAsXG4gICAgICAgICAgICBwZWFrTWVtb3J5OiAwLFxuICAgICAgICAgICAgbmV0d29ya1RyYWZmaWM6IDAsXG4gICAgICAgICAgICBjb25jdXJyZW50VGVzdHM6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyDkvp3lrZjplqLkv4Ljgqjjg6njg7zjga7loLTlkIjjga/lvozntprjg4bjgrnjg4jjgpLjgrnjgq3jg4Pjg5dcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHRvdGFsRHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgIGNvbnN0IHN1Y2Nlc3MgPSBPYmplY3QudmFsdWVzKHJlc3VsdHMpLmV2ZXJ5KHIgPT4gci5zdWNjZXNzKTtcbiAgICBcbiAgICBjb25zdCByZXNvdXJjZVVzYWdlOiBSZXNvdXJjZVVzYWdlID0ge1xuICAgICAgcGVha0NwdTogTWF0aC5tYXgoLi4uT2JqZWN0LnZhbHVlcyhyZXN1bHRzKS5tYXAociA9PiByLnJlc291cmNlVXNhZ2UucGVha0NwdSkpLFxuICAgICAgcGVha01lbW9yeTogTWF0aC5tYXgoLi4uT2JqZWN0LnZhbHVlcyhyZXN1bHRzKS5tYXAociA9PiByLnJlc291cmNlVXNhZ2UucGVha01lbW9yeSkpLFxuICAgICAgbmV0d29ya1RyYWZmaWM6IE9iamVjdC52YWx1ZXMocmVzdWx0cykucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIucmVzb3VyY2VVc2FnZS5uZXR3b3JrVHJhZmZpYywgMCksXG4gICAgICBjb25jdXJyZW50VGVzdHM6IDFcbiAgICB9O1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzLFxuICAgICAgbW9kdWxlczogcmVzdWx0cyxcbiAgICAgIHRvdGFsRHVyYXRpb24sXG4gICAgICByZXNvdXJjZVVzYWdlLFxuICAgICAgb3B0aW1pemF0aW9uTWV0cmljczoge1xuICAgICAgICBwYXJhbGxlbGl6YXRpb25SYXRpbzogMCxcbiAgICAgICAgcmVzb3VyY2VFZmZpY2llbmN5OiAwLFxuICAgICAgICB0aW1lT3B0aW1pemF0aW9uOiAwLFxuICAgICAgICBmYWlsdXJlUmVjb3ZlcnlUaW1lOiAwXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOS+neWtmOmWouS/guOBruino+axulxuICAgKi9cbiAgcHJpdmF0ZSByZXNvbHZlRGVwZW5kZW5jaWVzKG1vZHVsZXM6IFRlc3RNb2R1bGVbXSk6IFRlc3RNb2R1bGVbXSB7XG4gICAgY29uc3QgcmVzb2x2ZWQ6IFRlc3RNb2R1bGVbXSA9IFtdO1xuICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCB2aXNpdGluZyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIFxuICAgIGNvbnN0IHZpc2l0ID0gKG1vZHVsZTogVGVzdE1vZHVsZSkgPT4ge1xuICAgICAgaWYgKHZpc2l0aW5nLmhhcyhtb2R1bGUubmFtZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlvqrnkrDkvp3lrZjjgYzmpJzlh7rjgZXjgozjgb7jgZfjgZ86ICR7bW9kdWxlLm5hbWV9YCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmICh2aXNpdGVkLmhhcyhtb2R1bGUubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICB2aXNpdGluZy5hZGQobW9kdWxlLm5hbWUpO1xuICAgICAgXG4gICAgICAvLyDkvp3lrZjplqLkv4LjgpLlhYjjgavop6PmsbpcbiAgICAgIGZvciAoY29uc3QgZGVwTmFtZSBvZiBtb2R1bGUuZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSBtb2R1bGVzLmZpbmQobSA9PiBtLm5hbWUgPT09IGRlcE5hbWUpO1xuICAgICAgICBpZiAoZGVwZW5kZW5jeSkge1xuICAgICAgICAgIHZpc2l0KGRlcGVuZGVuY3kpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIHZpc2l0aW5nLmRlbGV0ZShtb2R1bGUubmFtZSk7XG4gICAgICB2aXNpdGVkLmFkZChtb2R1bGUubmFtZSk7XG4gICAgICByZXNvbHZlZC5wdXNoKG1vZHVsZSk7XG4gICAgfTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IG1vZHVsZSBvZiBtb2R1bGVzKSB7XG4gICAgICB2aXNpdChtb2R1bGUpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gIH1cbn1cblxuLy8g5a6f6KGM44OV44Kn44O844K65a6a576pXG5pbnRlcmZhY2UgRXhlY3V0aW9uUGhhc2Uge1xuICBpZDogbnVtYmVyO1xuICBtb2R1bGVzOiBUZXN0TW9kdWxlW107XG4gIHBhcmFsbGVsOiBib29sZWFuO1xuICBlc3RpbWF0ZWREdXJhdGlvbjogbnVtYmVyO1xufVxuXG4vKipcbiAqIOODquOCveODvOOCueebo+imluOCr+ODqeOCuVxuICovXG5jbGFzcyBSZXNvdXJjZU1vbml0b3Ige1xuICBwcml2YXRlIG1vbml0b3JpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBtZXRyaWNzOiBSZXNvdXJjZVVzYWdlID0ge1xuICAgIHBlYWtDcHU6IDAsXG4gICAgcGVha01lbW9yeTogMCxcbiAgICBuZXR3b3JrVHJhZmZpYzogMCxcbiAgICBjb25jdXJyZW50VGVzdHM6IDBcbiAgfTtcbiAgXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIHRoaXMubW9uaXRvcmluZyA9IHRydWU7XG4gICAgY29uc29sZS5sb2coJ/Cfk4og44Oq44K944O844K555uj6KaW6ZaL5aeLJyk7XG4gIH1cbiAgXG4gIHN0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5tb25pdG9yaW5nID0gZmFsc2U7XG4gICAgY29uc29sZS5sb2coJ/Cfk4og44Oq44K944O844K555uj6KaW5YGc5q2iJyk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN5c3RlbVJlc291cmNlcygpOiBQcm9taXNlPFJlc291cmNlUmVxdWlyZW1lbnRzPiB7XG4gICAgLy8g44K344K544OG44Og44Oq44K944O844K544Gu5Y+W5b6X77yI5a6f6KOF44Gv55Kw5aKD5L6d5a2Y77yJXG4gICAgcmV0dXJuIHtcbiAgICAgIGNwdTogMTAwLCAgICAgIC8vIOWIqeeUqOWPr+iDvUNQVSAoJSlcbiAgICAgIG1lbW9yeTogODE5MiwgIC8vIOWIqeeUqOWPr+iDveODoeODouODqiAoTUIpXG4gICAgICBuZXR3b3JrOiAxMDAwLCAvLyDliKnnlKjlj6/og73luK/ln58gKE1icHMpXG4gICAgICBjb25jdXJyZW50OiB0cnVlXG4gICAgfTtcbiAgfVxuICBcbiAgZ2V0TWV0cmljcygpOiBSZXNvdXJjZVVzYWdlIHtcbiAgICByZXR1cm4geyAuLi50aGlzLm1ldHJpY3MgfTtcbiAgfVxufVxuXG4vKipcbiAqIOS+neWtmOmWouS/guino+axuuOCr+ODqeOCuVxuICovXG5jbGFzcyBEZXBlbmRlbmN5UmVzb2x2ZXIge1xuICByZXNvbHZlKG1vZHVsZXM6IFRlc3RNb2R1bGVbXSk6IFRlc3RNb2R1bGVbXSB7XG4gICAgLy8g44OI44Od44Ot44K444Kr44Or44K944O844OI44Gr44KI44KL5L6d5a2Y6Zai5L+C6Kej5rG6XG4gICAgY29uc3QgcmVzb2x2ZWQ6IFRlc3RNb2R1bGVbXSA9IFtdO1xuICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBcbiAgICBjb25zdCB2aXNpdCA9IChtb2R1bGU6IFRlc3RNb2R1bGUpID0+IHtcbiAgICAgIGlmICh2aXNpdGVkLmhhcyhtb2R1bGUubmFtZSkpIHJldHVybjtcbiAgICAgIFxuICAgICAgLy8g5L6d5a2Y6Zai5L+C44KS5YWI44Gr6Kej5rG6XG4gICAgICBmb3IgKGNvbnN0IGRlcE5hbWUgb2YgbW9kdWxlLmRlcGVuZGVuY2llcykge1xuICAgICAgICBjb25zdCBkZXBlbmRlbmN5ID0gbW9kdWxlcy5maW5kKG0gPT4gbS5uYW1lID09PSBkZXBOYW1lKTtcbiAgICAgICAgaWYgKGRlcGVuZGVuY3kgJiYgIXZpc2l0ZWQuaGFzKGRlcGVuZGVuY3kubmFtZSkpIHtcbiAgICAgICAgICB2aXNpdChkZXBlbmRlbmN5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICB2aXNpdGVkLmFkZChtb2R1bGUubmFtZSk7XG4gICAgICByZXNvbHZlZC5wdXNoKG1vZHVsZSk7XG4gICAgfTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IG1vZHVsZSBvZiBtb2R1bGVzKSB7XG4gICAgICB2aXNpdChtb2R1bGUpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gIH1cbn0iXX0=