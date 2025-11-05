"use strict";
/**
 * 統合レポート生成システム
 *
 * 全テストモジュールの結果を統合し、包括的なレポートを生成
 * - エグゼクティブサマリー
 * - 詳細分析レポート
 * - パフォーマンス分析
 * - セキュリティ評価
 * - 品質スコア算出
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultReportConfig = exports.IntegrationReportGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 統合レポート生成クラス
 */
class IntegrationReportGenerator {
    config;
    constructor(config) {
        this.config = config;
        this.ensureOutputDirectory();
    }
    /**
     * 統合レポートの生成
     */
    async generateReport(testResults) {
        console.log('📊 統合レポート生成開始...');
        // レポートデータの構築
        const reportData = await this.buildReportData(testResults);
        // 各形式でのレポート生成
        const generatedFiles = [];
        for (const format of this.config.formats) {
            try {
                const filePath = await this.generateFormatSpecificReport(reportData, format);
                generatedFiles.push(filePath);
                console.log(`✅ ${format.toUpperCase()}レポート生成完了: ${filePath}`);
            }
            catch (error) {
                console.error(`❌ ${format.toUpperCase()}レポート生成エラー:`, error);
            }
        }
        console.log('✅ 統合レポート生成完了');
        return generatedFiles;
    }
    /**
     * レポートデータの構築
     */
    async buildReportData(testResults) {
        console.log('🔄 レポートデータ構築中...');
        const reportId = this.generateReportId();
        const generatedAt = new Date().toISOString();
        // エグゼクティブサマリーの構築
        const executiveSummary = this.buildExecutiveSummary(testResults);
        // モジュール別結果の構築
        const moduleResults = this.buildModuleResults(testResults);
        // 統合分析の実行
        const analysis = await this.performIntegratedAnalysis(testResults);
        // 推奨事項の生成
        const recommendations = this.generateRecommendations(analysis);
        // 添付ファイルの準備
        const attachments = await this.prepareAttachments(testResults);
        return {
            metadata: {
                reportId,
                generatedAt,
                testSuiteVersion: '1.0.0',
                environment: 'production',
                executionDuration: testResults.overall?.executionTime || 0
            },
            executiveSummary,
            moduleResults,
            analysis,
            recommendations,
            attachments
        };
    }
    /**
     * エグゼクティブサマリーの構築
     */
    buildExecutiveSummary(testResults) {
        const overall = testResults.overall || {};
        const modules = testResults.modules || {};
        // 全体ステータスの判定
        let overallStatus = 'PASS';
        if (overall.failedTests > 0) {
            overallStatus = 'FAIL';
        }
        else if (overall.qualityScore < 90) {
            overallStatus = 'WARNING';
        }
        // 重要な問題の抽出
        const criticalIssues = this.extractCriticalIssues(testResults);
        // 主要推奨事項の生成
        const recommendations = this.generateKeyRecommendations(testResults);
        // 主要メトリクスの計算
        const keyMetrics = this.calculateKeyMetrics(testResults);
        return {
            overallStatus,
            qualityScore: overall.qualityScore || 0,
            criticalIssues: criticalIssues.length,
            recommendations,
            keyMetrics
        };
    }
    /**
     * 重要な問題の抽出
     */
    extractCriticalIssues(testResults) {
        const issues = [];
        // 失敗したテストの確認
        if (testResults.overall?.failedTests > 0) {
            issues.push(`${testResults.overall.failedTests}個のテストが失敗`);
        }
        // パフォーマンス問題の確認
        const performanceModule = testResults.modules?.performance;
        if (performanceModule?.metrics?.responseTime > 3000) {
            issues.push('応答時間が基準値を超過');
        }
        // セキュリティ問題の確認
        const securityModule = testResults.modules?.security;
        if (securityModule?.securityScore < 85) {
            issues.push('セキュリティスコアが基準値を下回る');
        }
        // アクセシビリティ問題の確認
        const uiUxModule = testResults.modules?.uiUx;
        if (uiUxModule?.accessibilityScore < 90) {
            issues.push('アクセシビリティスコアが基準値を下回る');
        }
        return issues;
    }
    /**
     * 主要推奨事項の生成
     */
    generateKeyRecommendations(testResults) {
        const recommendations = [];
        // パフォーマンス改善
        const performanceModule = testResults.modules?.performance;
        if (performanceModule?.metrics?.responseTime > 2000) {
            recommendations.push('API応答時間の最適化を検討してください');
        }
        // セキュリティ強化
        const securityModule = testResults.modules?.security;
        if (securityModule?.vulnerabilities?.length > 0) {
            recommendations.push('検出された脆弱性の修正を優先してください');
        }
        // ユーザビリティ向上
        const uiUxModule = testResults.modules?.uiUx;
        if (uiUxModule?.usabilityIssues?.length > 0) {
            recommendations.push('ユーザビリティの改善を検討してください');
        }
        return recommendations;
    }
    /**
     * 主要メトリクスの計算
     */
    calculateKeyMetrics(testResults) {
        const overall = testResults.overall || {};
        const modules = testResults.modules || {};
        // 合格率の計算
        const passRate = overall.totalTests > 0 ?
            (overall.passedTests / overall.totalTests) * 100 : 0;
        // 平均応答時間の計算
        const performanceModule = modules.performance;
        const averageResponseTime = performanceModule?.metrics?.responseTime || 0;
        // セキュリティスコアの取得
        const securityModule = modules.security;
        const securityScore = securityModule?.securityScore || 0;
        // アクセシビリティスコアの取得
        const uiUxModule = modules.uiUx;
        const accessibilityScore = uiUxModule?.accessibilityScore || 0;
        return {
            totalTests: overall.totalTests || 0,
            passRate: Math.round(passRate * 100) / 100,
            averageResponseTime: Math.round(averageResponseTime),
            securityScore: Math.round(securityScore),
            accessibilityScore: Math.round(accessibilityScore)
        };
    }
    /**
     * モジュール別結果の構築
     */
    buildModuleResults(testResults) {
        const moduleResults = {};
        const modules = testResults.modules || {};
        for (const [moduleName, moduleData] of Object.entries(modules)) {
            const data = moduleData;
            moduleResults[moduleName] = {
                name: moduleName,
                status: this.determineModuleStatus(data),
                executionTime: data.executionTime || 0,
                testCount: data.totalTests || 0,
                passCount: data.passedTests || 0,
                failCount: data.failedTests || 0,
                skipCount: data.skippedTests || 0,
                coverage: data.coverage || 0,
                issues: this.extractModuleIssues(data),
                metrics: data.metrics || {}
            };
        }
        return moduleResults;
    }
    /**
     * モジュールステータスの判定
     */
    determineModuleStatus(moduleData) {
        if (moduleData.failedTests > 0) {
            return 'FAIL';
        }
        if (moduleData.coverage < 80 || moduleData.qualityScore < 85) {
            return 'WARNING';
        }
        return 'PASS';
    }
    /**
     * モジュール問題の抽出
     */
    extractModuleIssues(moduleData) {
        const issues = [];
        // 失敗したテストの問題
        if (moduleData.failedTests > 0) {
            issues.push({
                severity: 'HIGH',
                category: 'Test Failure',
                title: 'テスト失敗',
                description: `${moduleData.failedTests}個のテストが失敗しました`,
                location: 'テスト実行',
                recommendation: '失敗したテストの原因を調査し、修正してください'
            });
        }
        // カバレッジ不足の問題
        if (moduleData.coverage < 80) {
            issues.push({
                severity: 'MEDIUM',
                category: 'Coverage',
                title: 'テストカバレッジ不足',
                description: `テストカバレッジが${moduleData.coverage}%です`,
                location: 'テストカバレッジ',
                recommendation: 'テストカバレッジを80%以上に向上させてください'
            });
        }
        return issues;
    }
    /**
     * 統合分析の実行
     */
    async performIntegratedAnalysis(testResults) {
        console.log('🔍 統合分析実行中...');
        // パフォーマンス分析
        const performanceAnalysis = this.analyzePerformance(testResults);
        // セキュリティ分析
        const securityAnalysis = this.analyzeSecurity(testResults);
        // 品質分析
        const qualityAnalysis = this.analyzeQuality(testResults);
        // クロスモジュール分析
        const crossModuleAnalysis = this.analyzeCrossModule(testResults);
        return {
            performanceAnalysis,
            securityAnalysis,
            qualityAnalysis,
            crossModuleAnalysis
        };
    }
    /**
     * パフォーマンス分析
     */
    analyzePerformance(testResults) {
        const performanceModule = testResults.modules?.performance || {};
        const metrics = performanceModule.metrics || {};
        return {
            overallScore: this.calculatePerformanceScore(metrics),
            responseTimeAnalysis: {
                average: metrics.responseTime || 0,
                median: metrics.medianResponseTime || 0,
                p95: metrics.p95ResponseTime || 0,
                p99: metrics.p99ResponseTime || 0,
                slowestEndpoints: metrics.slowestEndpoints || []
            },
            resourceUsageAnalysis: {
                cpuUsage: metrics.cpuUsage || 0,
                memoryUsage: metrics.memoryUsage || 0,
                networkUsage: metrics.networkUsage || 0,
                bottlenecks: metrics.bottlenecks || []
            },
            scalabilityAnalysis: {
                concurrentUserCapacity: metrics.maxConcurrentUsers || 0,
                throughputLimit: metrics.maxThroughput || 0,
                recommendations: this.generatePerformanceRecommendations(metrics)
            }
        };
    }
    /**
     * パフォーマンススコアの計算
     */
    calculatePerformanceScore(metrics) {
        let score = 100;
        // 応答時間による減点
        if (metrics.responseTime > 3000)
            score -= 30;
        else if (metrics.responseTime > 2000)
            score -= 20;
        else if (metrics.responseTime > 1000)
            score -= 10;
        // リソース使用量による減点
        if (metrics.cpuUsage > 80)
            score -= 20;
        else if (metrics.cpuUsage > 60)
            score -= 10;
        if (metrics.memoryUsage > 80)
            score -= 20;
        else if (metrics.memoryUsage > 60)
            score -= 10;
        return Math.max(0, score);
    }
    /**
     * パフォーマンス推奨事項の生成
     */
    generatePerformanceRecommendations(metrics) {
        const recommendations = [];
        if (metrics.responseTime > 2000) {
            recommendations.push('API応答時間の最適化を検討してください');
        }
        if (metrics.cpuUsage > 70) {
            recommendations.push('CPU使用率が高いため、処理の最適化を検討してください');
        }
        if (metrics.memoryUsage > 70) {
            recommendations.push('メモリ使用量が多いため、メモリリークの確認を行ってください');
        }
        return recommendations;
    }
    /**
     * セキュリティ分析
     */
    analyzeSecurity(testResults) {
        const securityModule = testResults.modules?.security || {};
        return {
            overallScore: securityModule.securityScore || 0,
            vulnerabilities: {
                critical: securityModule.vulnerabilities?.critical || [],
                high: securityModule.vulnerabilities?.high || [],
                medium: securityModule.vulnerabilities?.medium || [],
                low: securityModule.vulnerabilities?.low || []
            },
            complianceStatus: securityModule.compliance || {},
            authenticationAnalysis: {
                strength: securityModule.authStrength || 0,
                issues: securityModule.authIssues || [],
                recommendations: securityModule.authRecommendations || []
            },
            dataProtectionAnalysis: {
                encryptionStatus: securityModule.encryptionEnabled || false,
                dataLeakageRisk: securityModule.dataLeakageRisk || 0,
                recommendations: securityModule.dataProtectionRecommendations || []
            }
        };
    }
    /**
     * 品質分析
     */
    analyzeQuality(testResults) {
        const overallScore = testResults.overall?.qualityScore || 0;
        return {
            overallScore,
            functionalQuality: {
                score: this.calculateFunctionalQualityScore(testResults),
                issues: this.extractFunctionalIssues(testResults)
            },
            usabilityQuality: {
                score: this.calculateUsabilityScore(testResults),
                accessibilityScore: testResults.modules?.uiUx?.accessibilityScore || 0,
                userExperienceIssues: testResults.modules?.uiUx?.uxIssues || []
            },
            reliabilityQuality: {
                score: this.calculateReliabilityScore(testResults),
                errorRate: this.calculateErrorRate(testResults),
                availabilityScore: testResults.modules?.integration?.availabilityScore || 0
            },
            maintainabilityQuality: {
                score: this.calculateMaintainabilityScore(testResults),
                codeQualityIssues: this.extractCodeQualityIssues(testResults)
            }
        };
    }
    /**
     * 機能品質スコアの計算
     */
    calculateFunctionalQualityScore(testResults) {
        const overall = testResults.overall || {};
        if (overall.totalTests === 0)
            return 0;
        return (overall.passedTests / overall.totalTests) * 100;
    }
    /**
     * 機能問題の抽出
     */
    extractFunctionalIssues(testResults) {
        const issues = [];
        if (testResults.overall?.failedTests > 0) {
            issues.push(`${testResults.overall.failedTests}個の機能テストが失敗`);
        }
        return issues;
    }
    /**
     * ユーザビリティスコアの計算
     */
    calculateUsabilityScore(testResults) {
        const uiUxModule = testResults.modules?.uiUx || {};
        return uiUxModule.usabilityScore || 0;
    }
    /**
     * 信頼性スコアの計算
     */
    calculateReliabilityScore(testResults) {
        const errorRate = this.calculateErrorRate(testResults);
        return Math.max(0, 100 - (errorRate * 10));
    }
    /**
     * エラー率の計算
     */
    calculateErrorRate(testResults) {
        const overall = testResults.overall || {};
        if (overall.totalTests === 0)
            return 0;
        return (overall.failedTests / overall.totalTests) * 100;
    }
    /**
     * 保守性スコアの計算
     */
    calculateMaintainabilityScore(testResults) {
        // 保守性は複数の要因で決定
        let score = 100;
        // テストカバレッジによる評価
        const avgCoverage = this.calculateAverageCoverage(testResults);
        if (avgCoverage < 80)
            score -= 20;
        else if (avgCoverage < 90)
            score -= 10;
        return Math.max(0, score);
    }
    /**
     * 平均カバレッジの計算
     */
    calculateAverageCoverage(testResults) {
        const modules = testResults.modules || {};
        const coverages = Object.values(modules)
            .map((module) => module.coverage || 0)
            .filter(coverage => coverage > 0);
        if (coverages.length === 0)
            return 0;
        return coverages.reduce((sum, coverage) => sum + coverage, 0) / coverages.length;
    }
    /**
     * コード品質問題の抽出
     */
    extractCodeQualityIssues(testResults) {
        const issues = [];
        const avgCoverage = this.calculateAverageCoverage(testResults);
        if (avgCoverage < 80) {
            issues.push(`テストカバレッジが低い: ${avgCoverage.toFixed(1)}%`);
        }
        return issues;
    }
    /**
     * クロスモジュール分析
     */
    analyzeCrossModule(testResults) {
        return {
            integrationIssues: this.findIntegrationIssues(testResults),
            dataFlowAnalysis: {
                bottlenecks: this.findDataFlowBottlenecks(testResults),
                inconsistencies: this.findDataInconsistencies(testResults)
            },
            dependencyAnalysis: {
                circularDependencies: [],
                missingDependencies: []
            },
            performanceImpact: {
                crossModuleLatency: this.calculateCrossModuleLatency(testResults),
                resourceContention: this.findResourceContention(testResults)
            }
        };
    }
    /**
     * 統合問題の発見
     */
    findIntegrationIssues(testResults) {
        const issues = [];
        const integrationModule = testResults.modules?.integration;
        if (integrationModule && integrationModule.failedTests > 0) {
            issues.push('モジュール間の統合テストで問題が発見されました');
        }
        return issues;
    }
    /**
     * データフローボトルネックの発見
     */
    findDataFlowBottlenecks(testResults) {
        const bottlenecks = [];
        const performanceModule = testResults.modules?.performance;
        if (performanceModule?.metrics?.slowestEndpoints) {
            bottlenecks.push(...performanceModule.metrics.slowestEndpoints.map((endpoint) => `${endpoint.method} ${endpoint.endpoint}`));
        }
        return bottlenecks;
    }
    /**
     * データ不整合の発見
     */
    findDataInconsistencies(testResults) {
        // データ不整合の検出ロジック
        return [];
    }
    /**
     * クロスモジュールレイテンシの計算
     */
    calculateCrossModuleLatency(testResults) {
        const integrationModule = testResults.modules?.integration;
        return integrationModule?.metrics?.crossModuleLatency || 0;
    }
    /**
     * リソース競合の発見
     */
    findResourceContention(testResults) {
        const contentions = [];
        // CPU競合の確認
        const performanceModule = testResults.modules?.performance;
        if (performanceModule?.metrics?.cpuUsage > 80) {
            contentions.push('CPU使用率が高く、リソース競合の可能性があります');
        }
        return contentions;
    }
    /**
     * 推奨事項の生成
     */
    generateRecommendations(analysis) {
        return {
            immediate: this.generateImmediateRecommendations(analysis),
            shortTerm: this.generateShortTermRecommendations(analysis),
            longTerm: this.generateLongTermRecommendations(analysis)
        };
    }
    /**
     * 即座対応推奨事項の生成
     */
    generateImmediateRecommendations(analysis) {
        const recommendations = [];
        // 重要なセキュリティ問題
        if (analysis.securityAnalysis.vulnerabilities.critical.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Security',
                title: '重要なセキュリティ脆弱性の修正',
                description: '重要度の高いセキュリティ脆弱性が検出されました',
                impact: 'セキュリティリスクの大幅な軽減',
                effort: '高',
                timeline: '即座'
            });
        }
        // パフォーマンス問題
        if (analysis.performanceAnalysis.responseTimeAnalysis.average > 3000) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Performance',
                title: 'API応答時間の改善',
                description: 'API応答時間が基準値を大幅に超過しています',
                impact: 'ユーザーエクスペリエンスの向上',
                effort: '中',
                timeline: '1週間以内'
            });
        }
        return recommendations;
    }
    /**
     * 短期推奨事項の生成
     */
    generateShortTermRecommendations(analysis) {
        const recommendations = [];
        // テストカバレッジの改善
        if (analysis.qualityAnalysis.overallScore < 85) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Quality',
                title: 'テストカバレッジの向上',
                description: 'テストカバレッジを向上させて品質を改善してください',
                impact: 'コード品質の向上',
                effort: '中',
                timeline: '1ヶ月以内'
            });
        }
        return recommendations;
    }
    /**
     * 長期推奨事項の生成
     */
    generateLongTermRecommendations(analysis) {
        const recommendations = [];
        // アーキテクチャの改善
        if (analysis.crossModuleAnalysis.integrationIssues.length > 0) {
            recommendations.push({
                priority: 'LOW',
                category: 'Architecture',
                title: 'システムアーキテクチャの見直し',
                description: 'モジュール間の統合を改善してください',
                impact: 'システム全体の保守性向上',
                effort: '高',
                timeline: '3ヶ月以内'
            });
        }
        return recommendations;
    }
    /**
     * 添付ファイルの準備
     */
    async prepareAttachments(testResults) {
        const attachments = {
            screenshots: [],
            logs: [],
            charts: [],
            rawData: []
        };
        // スクリーンショットの収集
        if (this.config.includeScreenshots) {
            attachments.screenshots = await this.collectScreenshots(testResults);
        }
        // ログファイルの収集
        if (this.config.includeDetailedLogs) {
            attachments.logs = await this.collectLogFiles(testResults);
        }
        // チャートの生成
        if (this.config.includePerformanceCharts) {
            attachments.charts = await this.generateCharts(testResults);
        }
        // 生データの保存
        attachments.rawData = await this.saveRawData(testResults);
        return attachments;
    }
    /**
     * スクリーンショットの収集
     */
    async collectScreenshots(testResults) {
        // スクリーンショットファイルの収集ロジック
        return [];
    }
    /**
     * ログファイルの収集
     */
    async collectLogFiles(testResults) {
        // ログファイルの収集ロジック
        return [];
    }
    /**
     * チャートの生成
     */
    async generateCharts(testResults) {
        // パフォーマンスチャートの生成ロジック
        return [];
    }
    /**
     * 生データの保存
     */
    async saveRawData(testResults) {
        const rawDataPath = path.join(this.config.outputDirectory, 'raw-data.json');
        await fs.promises.writeFile(rawDataPath, JSON.stringify(testResults, null, 2), 'utf8');
        return [rawDataPath];
    }
    /**
     * 形式別レポートの生成
     */
    async generateFormatSpecificReport(reportData, format) {
        switch (format) {
            case 'json':
                return await this.generateJsonReport(reportData);
            case 'html':
                return await this.generateHtmlReport(reportData);
            case 'pdf':
                return await this.generatePdfReport(reportData);
            case 'csv':
                return await this.generateCsvReport(reportData);
            default:
                throw new Error(`未対応のレポート形式: ${format}`);
        }
    }
    /**
     * JSONレポートの生成
     */
    async generateJsonReport(reportData) {
        const filePath = path.join(this.config.outputDirectory, `integration-report-${reportData.metadata.reportId}.json`);
        await fs.promises.writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf8');
        return filePath;
    }
    /**
     * HTMLレポートの生成
     */
    async generateHtmlReport(reportData) {
        const filePath = path.join(this.config.outputDirectory, `integration-report-${reportData.metadata.reportId}.html`);
        const htmlContent = this.buildHtmlContent(reportData);
        await fs.promises.writeFile(filePath, htmlContent, 'utf8');
        return filePath;
    }
    /**
     * HTMLコンテンツの構築
     */
    buildHtmlContent(reportData) {
        const branding = this.config.customBranding || {
            companyName: 'Test Company',
            reportTitle: '統合テストレポート',
            primaryColor: '#007bff',
            secondaryColor: '#6c757d'
        };
        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${branding.reportTitle}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor});
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid ${branding.primaryColor};
        }
        .card h3 {
            margin: 0 0 10px 0;
            color: ${branding.primaryColor};
        }
        .metric {
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }
        .status-pass { color: #28a745; }
        .status-fail { color: #dc3545; }
        .status-warning { color: #ffc107; }
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section-header {
            background: ${branding.primaryColor};
            color: white;
            padding: 15px 20px;
            font-size: 1.2em;
            font-weight: bold;
        }
        .section-content {
            padding: 20px;
        }
        .module-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .module-card {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
        }
        .module-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 10px;
        }
        .module-name {
            font-weight: bold;
            font-size: 1.1em;
        }
        .module-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .recommendations {
            list-style: none;
            padding: 0;
        }
        .recommendation {
            background: #f8f9fa;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .recommendation.high { border-left-color: #dc3545; }
        .recommendation.medium { border-left-color: #ffc107; }
        .recommendation.low { border-left-color: #28a745; }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 20px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${branding.reportTitle}</h1>
        <p>${branding.companyName}</p>
        <p>生成日時: ${new Date(reportData.metadata.generatedAt).toLocaleString('ja-JP')}</p>
    </div>

    <div class="summary-cards">
        <div class="card">
            <h3>全体ステータス</h3>
            <div class="metric status-${reportData.executiveSummary.overallStatus.toLowerCase()}">
                ${reportData.executiveSummary.overallStatus}
            </div>
        </div>
        <div class="card">
            <h3>品質スコア</h3>
            <div class="metric">${reportData.executiveSummary.qualityScore.toFixed(1)}%</div>
        </div>
        <div class="card">
            <h3>テスト合格率</h3>
            <div class="metric">${reportData.executiveSummary.keyMetrics.passRate.toFixed(1)}%</div>
        </div>
        <div class="card">
            <h3>平均応答時間</h3>
            <div class="metric">${reportData.executiveSummary.keyMetrics.averageResponseTime}ms</div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">モジュール別結果</div>
        <div class="section-content">
            <div class="module-grid">
                ${Object.entries(reportData.moduleResults).map(([name, result]) => `
                    <div class="module-card">
                        <div class="module-header">
                            <span class="module-name">${name}</span>
                            <span class="module-status status-${result.status.toLowerCase()}">${result.status}</span>
                        </div>
                        <p>実行時間: ${result.executionTime}ms</p>
                        <p>テスト数: ${result.testCount} (成功: ${result.passCount}, 失敗: ${result.failCount})</p>
                        <p>カバレッジ: ${result.coverage}%</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">推奨事項</div>
        <div class="section-content">
            <h4>即座対応が必要</h4>
            <ul class="recommendations">
                ${reportData.recommendations.immediate.map(rec => `
                    <li class="recommendation ${rec.priority.toLowerCase()}">
                        <strong>${rec.title}</strong><br>
                        ${rec.description}<br>
                        <small>影響: ${rec.impact} | 工数: ${rec.effort} | 期限: ${rec.timeline}</small>
                    </li>
                `).join('')}
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>このレポートは統合テストスイート v${reportData.metadata.testSuiteVersion} により生成されました</p>
        <p>レポートID: ${reportData.metadata.reportId}</p>
    </div>
</body>
</html>`;
    }
    /**
     * PDFレポートの生成
     */
    async generatePdfReport(reportData) {
        // PDF生成ライブラリ（puppeteer等）を使用してHTMLからPDFを生成
        const htmlContent = this.buildHtmlContent(reportData);
        const filePath = path.join(this.config.outputDirectory, `integration-report-${reportData.metadata.reportId}.pdf`);
        // 実際のPDF生成は外部ライブラリに依存
        // ここではプレースホルダーとしてHTMLファイルを保存
        await fs.promises.writeFile(filePath.replace('.pdf', '.html'), htmlContent, 'utf8');
        return filePath;
    }
    /**
     * CSVレポートの生成
     */
    async generateCsvReport(reportData) {
        const filePath = path.join(this.config.outputDirectory, `integration-report-${reportData.metadata.reportId}.csv`);
        const csvContent = this.buildCsvContent(reportData);
        await fs.promises.writeFile(filePath, csvContent, 'utf8');
        return filePath;
    }
    /**
     * CSVコンテンツの構築
     */
    buildCsvContent(reportData) {
        const rows = [
            ['モジュール名', 'ステータス', '実行時間(ms)', 'テスト数', '成功数', '失敗数', 'カバレッジ(%)']
        ];
        for (const [name, result] of Object.entries(reportData.moduleResults)) {
            rows.push([
                name,
                result.status,
                result.executionTime.toString(),
                result.testCount.toString(),
                result.passCount.toString(),
                result.failCount.toString(),
                result.coverage.toString()
            ]);
        }
        return rows.map(row => row.join(',')).join('\n');
    }
    /**
     * レポートIDの生成
     */
    generateReportId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${random}`;
    }
    /**
     * 出力ディレクトリの確保
     */
    ensureOutputDirectory() {
        if (!fs.existsSync(this.config.outputDirectory)) {
            fs.mkdirSync(this.config.outputDirectory, { recursive: true });
        }
    }
}
exports.IntegrationReportGenerator = IntegrationReportGenerator;
// デフォルト設定
exports.DefaultReportConfig = {
    outputDirectory: './test-reports',
    formats: ['json', 'html'],
    includeScreenshots: true,
    includeDetailedLogs: true,
    includePerformanceCharts: true,
    includeSecurityAnalysis: true,
    generateExecutiveSummary: true,
    customBranding: {
        companyName: 'NetApp Japan',
        reportTitle: 'Permission-aware RAG System 統合テストレポート',
        primaryColor: '#0067C5',
        secondaryColor: '#00A1C9'
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyYXRpb24tcmVwb3J0LWdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVncmF0aW9uLXJlcG9ydC1nZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBc083Qjs7R0FFRztBQUNILE1BQWEsMEJBQTBCO0lBQzdCLE1BQU0sQ0FBZTtJQUU3QixZQUFZLE1BQW9CO1FBQzlCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxjQUFjLENBQUMsV0FBZ0I7UUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBRWhDLGFBQWE7UUFDYixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFM0QsY0FBYztRQUNkLE1BQU0sY0FBYyxHQUFhLEVBQUUsQ0FBQztRQUVwQyxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDekMsSUFBSSxDQUFDO2dCQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLDRCQUE0QixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDN0UsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxXQUFXLEVBQUUsYUFBYSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxNQUFNLENBQUMsV0FBVyxF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QVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUQsT0FBTyxHQUFHLFNBQVMsSUFBSSxNQUFNLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7O09BRUc7SUFDSyxxQkFBcUI7UUFDM0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQ2hELEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNqRSxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBNWtDRCxnRUE0a0NDO0FBRUQsVUFBVTtBQUNHLFFBQUEsbUJBQW1CLEdBQWlCO0lBQy9DLGVBQWUsRUFBRSxnQkFBZ0I7SUFDakMsT0FBTyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztJQUN6QixrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCLG1CQUFtQixFQUFFLElBQUk7SUFDekIsd0JBQXdCLEVBQUUsSUFBSTtJQUM5Qix1QkFBdUIsRUFBRSxJQUFJO0lBQzdCLHdCQUF3QixFQUFFLElBQUk7SUFDOUIsY0FBYyxFQUFFO1FBQ2QsV0FBVyxFQUFFLGNBQWM7UUFDM0IsV0FBVyxFQUFFLHVDQUF1QztRQUNwRCxZQUFZLEVBQUUsU0FBUztRQUN2QixjQUFjLEVBQUUsU0FBUztLQUMxQjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOe1seWQiOODrOODneODvOODiOeUn+aIkOOCt+OCueODhuODoFxuICogXG4gKiDlhajjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjga7ntZDmnpzjgpLntbHlkIjjgZfjgIHljIXmi6znmoTjgarjg6zjg53jg7zjg4jjgpLnlJ/miJBcbiAqIC0g44Ko44Kw44K844Kv44OG44Kj44OW44K144Oe44Oq44O8XG4gKiAtIOips+e0sOWIhuaekOODrOODneODvOODiFxuICogLSDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnliIbmnpBcbiAqIC0g44K744Kt44Ol44Oq44OG44Kj6KmV5L6hXG4gKiAtIOWTgeizquOCueOCs+OCoueul+WHulxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIOODrOODneODvOODiOioreWumlxuaW50ZXJmYWNlIFJlcG9ydENvbmZpZyB7XG4gIG91dHB1dERpcmVjdG9yeTogc3RyaW5nO1xuICBmb3JtYXRzOiAoJ2pzb24nIHwgJ2h0bWwnIHwgJ3BkZicgfCAnY3N2JylbXTtcbiAgaW5jbHVkZVNjcmVlbnNob3RzOiBib29sZWFuO1xuICBpbmNsdWRlRGV0YWlsZWRMb2dzOiBib29sZWFuO1xuICBpbmNsdWRlUGVyZm9ybWFuY2VDaGFydHM6IGJvb2xlYW47XG4gIGluY2x1ZGVTZWN1cml0eUFuYWx5c2lzOiBib29sZWFuO1xuICBnZW5lcmF0ZUV4ZWN1dGl2ZVN1bW1hcnk6IGJvb2xlYW47XG4gIGN1c3RvbUJyYW5kaW5nPzogQnJhbmRpbmdDb25maWc7XG59XG5cbi8vIOODluODqeODs+ODh+OCo+ODs+OCsOioreWumlxuaW50ZXJmYWNlIEJyYW5kaW5nQ29uZmlnIHtcbiAgY29tcGFueU5hbWU6IHN0cmluZztcbiAgbG9nb1BhdGg/OiBzdHJpbmc7XG4gIHByaW1hcnlDb2xvcjogc3RyaW5nO1xuICBzZWNvbmRhcnlDb2xvcjogc3RyaW5nO1xuICByZXBvcnRUaXRsZTogc3RyaW5nO1xufVxuXG4vLyDntbHlkIjjg6zjg53jg7zjg4jjg4fjg7zjgr9cbmludGVyZmFjZSBJbnRlZ3JhdGlvblJlcG9ydERhdGEge1xuICAvLyDjg6Hjgr/jg4fjg7zjgr9cbiAgbWV0YWRhdGE6IHtcbiAgICByZXBvcnRJZDogc3RyaW5nO1xuICAgIGdlbmVyYXRlZEF0OiBzdHJpbmc7XG4gICAgdGVzdFN1aXRlVmVyc2lvbjogc3RyaW5nO1xuICAgIGVudmlyb25tZW50OiBzdHJpbmc7XG4gICAgZXhlY3V0aW9uRHVyYXRpb246IG51bWJlcjtcbiAgfTtcbiAgXG4gIC8vIOOCqOOCsOOCvOOCr+ODhuOCo+ODluOCteODnuODquODvFxuICBleGVjdXRpdmVTdW1tYXJ5OiB7XG4gICAgb3ZlcmFsbFN0YXR1czogJ1BBU1MnIHwgJ0ZBSUwnIHwgJ1dBUk5JTkcnO1xuICAgIHF1YWxpdHlTY29yZTogbnVtYmVyO1xuICAgIGNyaXRpY2FsSXNzdWVzOiBudW1iZXI7XG4gICAgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXTtcbiAgICBrZXlNZXRyaWNzOiB7XG4gICAgICB0b3RhbFRlc3RzOiBudW1iZXI7XG4gICAgICBwYXNzUmF0ZTogbnVtYmVyO1xuICAgICAgYXZlcmFnZVJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgICAgc2VjdXJpdHlTY29yZTogbnVtYmVyO1xuICAgICAgYWNjZXNzaWJpbGl0eVNjb3JlOiBudW1iZXI7XG4gICAgfTtcbiAgfTtcbiAgXG4gIC8vIOODouOCuOODpeODvOODq+WIpee1kOaenFxuICBtb2R1bGVSZXN1bHRzOiB7XG4gICAgW21vZHVsZU5hbWU6IHN0cmluZ106IE1vZHVsZVJlcG9ydERhdGE7XG4gIH07XG4gIFxuICAvLyDntbHlkIjliIbmnpBcbiAgYW5hbHlzaXM6IHtcbiAgICBwZXJmb3JtYW5jZUFuYWx5c2lzOiBQZXJmb3JtYW5jZUFuYWx5c2lzO1xuICAgIHNlY3VyaXR5QW5hbHlzaXM6IFNlY3VyaXR5QW5hbHlzaXM7XG4gICAgcXVhbGl0eUFuYWx5c2lzOiBRdWFsaXR5QW5hbHlzaXM7XG4gICAgY3Jvc3NNb2R1bGVBbmFseXNpczogQ3Jvc3NNb2R1bGVBbmFseXNpcztcbiAgfTtcbiAgXG4gIC8vIOaOqOWlqOS6i+mghVxuICByZWNvbW1lbmRhdGlvbnM6IHtcbiAgICBpbW1lZGlhdGU6IFJlY29tbWVuZGF0aW9uSXRlbVtdO1xuICAgIHNob3J0VGVybTogUmVjb21tZW5kYXRpb25JdGVtW107XG4gICAgbG9uZ1Rlcm06IFJlY29tbWVuZGF0aW9uSXRlbVtdO1xuICB9O1xuICBcbiAgLy8g5re75LuY44OV44Kh44Kk44OrXG4gIGF0dGFjaG1lbnRzOiB7XG4gICAgc2NyZWVuc2hvdHM6IHN0cmluZ1tdO1xuICAgIGxvZ3M6IHN0cmluZ1tdO1xuICAgIGNoYXJ0czogc3RyaW5nW107XG4gICAgcmF3RGF0YTogc3RyaW5nW107XG4gIH07XG59XG5cbi8vIOODouOCuOODpeODvOODq+WIpeODrOODneODvOODiOODh+ODvOOCv1xuaW50ZXJmYWNlIE1vZHVsZVJlcG9ydERhdGEge1xuICBuYW1lOiBzdHJpbmc7XG4gIHN0YXR1czogJ1BBU1MnIHwgJ0ZBSUwnIHwgJ1dBUk5JTkcnO1xuICBleGVjdXRpb25UaW1lOiBudW1iZXI7XG4gIHRlc3RDb3VudDogbnVtYmVyO1xuICBwYXNzQ291bnQ6IG51bWJlcjtcbiAgZmFpbENvdW50OiBudW1iZXI7XG4gIHNraXBDb3VudDogbnVtYmVyO1xuICBjb3ZlcmFnZTogbnVtYmVyO1xuICBpc3N1ZXM6IElzc3VlSXRlbVtdO1xuICBtZXRyaWNzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xufVxuXG4vLyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnliIbmnpBcbmludGVyZmFjZSBQZXJmb3JtYW5jZUFuYWx5c2lzIHtcbiAgb3ZlcmFsbFNjb3JlOiBudW1iZXI7XG4gIHJlc3BvbnNlVGltZUFuYWx5c2lzOiB7XG4gICAgYXZlcmFnZTogbnVtYmVyO1xuICAgIG1lZGlhbjogbnVtYmVyO1xuICAgIHA5NTogbnVtYmVyO1xuICAgIHA5OTogbnVtYmVyO1xuICAgIHNsb3dlc3RFbmRwb2ludHM6IEVuZHBvaW50TWV0cmljW107XG4gIH07XG4gIHJlc291cmNlVXNhZ2VBbmFseXNpczoge1xuICAgIGNwdVVzYWdlOiBudW1iZXI7XG4gICAgbWVtb3J5VXNhZ2U6IG51bWJlcjtcbiAgICBuZXR3b3JrVXNhZ2U6IG51bWJlcjtcbiAgICBib3R0bGVuZWNrczogc3RyaW5nW107XG4gIH07XG4gIHNjYWxhYmlsaXR5QW5hbHlzaXM6IHtcbiAgICBjb25jdXJyZW50VXNlckNhcGFjaXR5OiBudW1iZXI7XG4gICAgdGhyb3VnaHB1dExpbWl0OiBudW1iZXI7XG4gICAgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXTtcbiAgfTtcbn1cblxuLy8g44K744Kt44Ol44Oq44OG44Kj5YiG5p6QXG5pbnRlcmZhY2UgU2VjdXJpdHlBbmFseXNpcyB7XG4gIG92ZXJhbGxTY29yZTogbnVtYmVyO1xuICB2dWxuZXJhYmlsaXRpZXM6IHtcbiAgICBjcml0aWNhbDogVnVsbmVyYWJpbGl0eUl0ZW1bXTtcbiAgICBoaWdoOiBWdWxuZXJhYmlsaXR5SXRlbVtdO1xuICAgIG1lZGl1bTogVnVsbmVyYWJpbGl0eUl0ZW1bXTtcbiAgICBsb3c6IFZ1bG5lcmFiaWxpdHlJdGVtW107XG4gIH07XG4gIGNvbXBsaWFuY2VTdGF0dXM6IHtcbiAgICBbc3RhbmRhcmQ6IHN0cmluZ106IENvbXBsaWFuY2VSZXN1bHQ7XG4gIH07XG4gIGF1dGhlbnRpY2F0aW9uQW5hbHlzaXM6IHtcbiAgICBzdHJlbmd0aDogbnVtYmVyO1xuICAgIGlzc3Vlczogc3RyaW5nW107XG4gICAgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXTtcbiAgfTtcbiAgZGF0YVByb3RlY3Rpb25BbmFseXNpczoge1xuICAgIGVuY3J5cHRpb25TdGF0dXM6IGJvb2xlYW47XG4gICAgZGF0YUxlYWthZ2VSaXNrOiBudW1iZXI7XG4gICAgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXTtcbiAgfTtcbn1cblxuLy8g5ZOB6LOq5YiG5p6QXG5pbnRlcmZhY2UgUXVhbGl0eUFuYWx5c2lzIHtcbiAgb3ZlcmFsbFNjb3JlOiBudW1iZXI7XG4gIGZ1bmN0aW9uYWxRdWFsaXR5OiB7XG4gICAgc2NvcmU6IG51bWJlcjtcbiAgICBpc3N1ZXM6IHN0cmluZ1tdO1xuICB9O1xuICB1c2FiaWxpdHlRdWFsaXR5OiB7XG4gICAgc2NvcmU6IG51bWJlcjtcbiAgICBhY2Nlc3NpYmlsaXR5U2NvcmU6IG51bWJlcjtcbiAgICB1c2VyRXhwZXJpZW5jZUlzc3Vlczogc3RyaW5nW107XG4gIH07XG4gIHJlbGlhYmlsaXR5UXVhbGl0eToge1xuICAgIHNjb3JlOiBudW1iZXI7XG4gICAgZXJyb3JSYXRlOiBudW1iZXI7XG4gICAgYXZhaWxhYmlsaXR5U2NvcmU6IG51bWJlcjtcbiAgfTtcbiAgbWFpbnRhaW5hYmlsaXR5UXVhbGl0eToge1xuICAgIHNjb3JlOiBudW1iZXI7XG4gICAgY29kZVF1YWxpdHlJc3N1ZXM6IHN0cmluZ1tdO1xuICB9O1xufVxuXG4vLyDjgq/jg63jgrnjg6Ljgrjjg6Xjg7zjg6vliIbmnpBcbmludGVyZmFjZSBDcm9zc01vZHVsZUFuYWx5c2lzIHtcbiAgaW50ZWdyYXRpb25Jc3N1ZXM6IHN0cmluZ1tdO1xuICBkYXRhRmxvd0FuYWx5c2lzOiB7XG4gICAgYm90dGxlbmVja3M6IHN0cmluZ1tdO1xuICAgIGluY29uc2lzdGVuY2llczogc3RyaW5nW107XG4gIH07XG4gIGRlcGVuZGVuY3lBbmFseXNpczoge1xuICAgIGNpcmN1bGFyRGVwZW5kZW5jaWVzOiBzdHJpbmdbXTtcbiAgICBtaXNzaW5nRGVwZW5kZW5jaWVzOiBzdHJpbmdbXTtcbiAgfTtcbiAgcGVyZm9ybWFuY2VJbXBhY3Q6IHtcbiAgICBjcm9zc01vZHVsZUxhdGVuY3k6IG51bWJlcjtcbiAgICByZXNvdXJjZUNvbnRlbnRpb246IHN0cmluZ1tdO1xuICB9O1xufVxuXG4vLyDmjqjlpajkuovpoIXjgqLjgqTjg4bjg6BcbmludGVyZmFjZSBSZWNvbW1lbmRhdGlvbkl0ZW0ge1xuICBwcmlvcml0eTogJ0hJR0gnIHwgJ01FRElVTScgfCAnTE9XJztcbiAgY2F0ZWdvcnk6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgaW1wYWN0OiBzdHJpbmc7XG4gIGVmZm9ydDogc3RyaW5nO1xuICB0aW1lbGluZTogc3RyaW5nO1xufVxuXG4vLyDllY/poYzjgqLjgqTjg4bjg6BcbmludGVyZmFjZSBJc3N1ZUl0ZW0ge1xuICBzZXZlcml0eTogJ0NSSVRJQ0FMJyB8ICdISUdIJyB8ICdNRURJVU0nIHwgJ0xPVyc7XG4gIGNhdGVnb3J5OiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGxvY2F0aW9uOiBzdHJpbmc7XG4gIHJlY29tbWVuZGF0aW9uOiBzdHJpbmc7XG59XG5cbi8vIOOCqOODs+ODieODneOCpOODs+ODiOODoeODiOODquODg+OCr1xuaW50ZXJmYWNlIEVuZHBvaW50TWV0cmljIHtcbiAgZW5kcG9pbnQ6IHN0cmluZztcbiAgbWV0aG9kOiBzdHJpbmc7XG4gIGF2ZXJhZ2VSZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgcmVxdWVzdENvdW50OiBudW1iZXI7XG4gIGVycm9yUmF0ZTogbnVtYmVyO1xufVxuXG4vLyDohIblvLHmgKfjgqLjgqTjg4bjg6BcbmludGVyZmFjZSBWdWxuZXJhYmlsaXR5SXRlbSB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIHNldmVyaXR5OiAnQ1JJVElDQUwnIHwgJ0hJR0gnIHwgJ01FRElVTScgfCAnTE9XJztcbiAgY3dlPzogc3RyaW5nO1xuICBjdnNzPzogbnVtYmVyO1xuICByZWNvbW1lbmRhdGlvbjogc3RyaW5nO1xufVxuXG4vLyDjgrPjg7Pjg5fjg6njgqTjgqLjg7PjgrnntZDmnpxcbmludGVyZmFjZSBDb21wbGlhbmNlUmVzdWx0IHtcbiAgc3RhdHVzOiAnQ09NUExJQU5UJyB8ICdOT05fQ09NUExJQU5UJyB8ICdQQVJUSUFMJztcbiAgc2NvcmU6IG51bWJlcjtcbiAgcmVxdWlyZW1lbnRzOiB7XG4gICAgW3JlcXVpcmVtZW50OiBzdHJpbmddOiBib29sZWFuO1xuICB9O1xuICBnYXBzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiDntbHlkIjjg6zjg53jg7zjg4jnlJ/miJDjgq/jg6njgrlcbiAqL1xuZXhwb3J0IGNsYXNzIEludGVncmF0aW9uUmVwb3J0R2VuZXJhdG9yIHtcbiAgcHJpdmF0ZSBjb25maWc6IFJlcG9ydENvbmZpZztcbiAgXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUmVwb3J0Q29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5lbnN1cmVPdXRwdXREaXJlY3RvcnkoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOe1seWQiOODrOODneODvOODiOOBrueUn+aIkFxuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVSZXBvcnQodGVzdFJlc3VsdHM6IGFueSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zb2xlLmxvZygn8J+TiiDntbHlkIjjg6zjg53jg7zjg4jnlJ/miJDplovlp4suLi4nKTtcbiAgICBcbiAgICAvLyDjg6zjg53jg7zjg4jjg4fjg7zjgr/jga7mp4vnr4lcbiAgICBjb25zdCByZXBvcnREYXRhID0gYXdhaXQgdGhpcy5idWlsZFJlcG9ydERhdGEodGVzdFJlc3VsdHMpO1xuICAgIFxuICAgIC8vIOWQhOW9ouW8j+OBp+OBruODrOODneODvOODiOeUn+aIkFxuICAgIGNvbnN0IGdlbmVyYXRlZEZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGZvciAoY29uc3QgZm9ybWF0IG9mIHRoaXMuY29uZmlnLmZvcm1hdHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUZvcm1hdFNwZWNpZmljUmVwb3J0KHJlcG9ydERhdGEsIGZvcm1hdCk7XG4gICAgICAgIGdlbmVyYXRlZEZpbGVzLnB1c2goZmlsZVBhdGgpO1xuICAgICAgICBjb25zb2xlLmxvZyhg4pyFICR7Zm9ybWF0LnRvVXBwZXJDYXNlKCl944Os44Od44O844OI55Sf5oiQ5a6M5LqGOiAke2ZpbGVQYXRofWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihg4p2MICR7Zm9ybWF0LnRvVXBwZXJDYXNlKCl944Os44Od44O844OI55Sf5oiQ44Ko44Op44O8OmAsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coJ+KchSDntbHlkIjjg6zjg53jg7zjg4jnlJ/miJDlrozkuoYnKTtcbiAgICByZXR1cm4gZ2VuZXJhdGVkRmlsZXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjg6zjg53jg7zjg4jjg4fjg7zjgr/jga7mp4vnr4lcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgYnVpbGRSZXBvcnREYXRhKHRlc3RSZXN1bHRzOiBhbnkpOiBQcm9taXNlPEludGVncmF0aW9uUmVwb3J0RGF0YT4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5SEIOODrOODneODvOODiOODh+ODvOOCv+ani+evieS4rS4uLicpO1xuICAgIFxuICAgIGNvbnN0IHJlcG9ydElkID0gdGhpcy5nZW5lcmF0ZVJlcG9ydElkKCk7XG4gICAgY29uc3QgZ2VuZXJhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgXG4gICAgLy8g44Ko44Kw44K844Kv44OG44Kj44OW44K144Oe44Oq44O844Gu5qeL56+JXG4gICAgY29uc3QgZXhlY3V0aXZlU3VtbWFyeSA9IHRoaXMuYnVpbGRFeGVjdXRpdmVTdW1tYXJ5KHRlc3RSZXN1bHRzKTtcbiAgICBcbiAgICAvLyDjg6Ljgrjjg6Xjg7zjg6vliKXntZDmnpzjga7mp4vnr4lcbiAgICBjb25zdCBtb2R1bGVSZXN1bHRzID0gdGhpcy5idWlsZE1vZHVsZVJlc3VsdHModGVzdFJlc3VsdHMpO1xuICAgIFxuICAgIC8vIOe1seWQiOWIhuaekOOBruWun+ihjFxuICAgIGNvbnN0IGFuYWx5c2lzID0gYXdhaXQgdGhpcy5wZXJmb3JtSW50ZWdyYXRlZEFuYWx5c2lzKHRlc3RSZXN1bHRzKTtcbiAgICBcbiAgICAvLyDmjqjlpajkuovpoIXjga7nlJ/miJBcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSB0aGlzLmdlbmVyYXRlUmVjb21tZW5kYXRpb25zKGFuYWx5c2lzKTtcbiAgICBcbiAgICAvLyDmt7vku5jjg5XjgqHjgqTjg6vjga7mupblgplcbiAgICBjb25zdCBhdHRhY2htZW50cyA9IGF3YWl0IHRoaXMucHJlcGFyZUF0dGFjaG1lbnRzKHRlc3RSZXN1bHRzKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgcmVwb3J0SWQsXG4gICAgICAgIGdlbmVyYXRlZEF0LFxuICAgICAgICB0ZXN0U3VpdGVWZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgICBlbnZpcm9ubWVudDogJ3Byb2R1Y3Rpb24nLFxuICAgICAgICBleGVjdXRpb25EdXJhdGlvbjogdGVzdFJlc3VsdHMub3ZlcmFsbD8uZXhlY3V0aW9uVGltZSB8fCAwXG4gICAgICB9LFxuICAgICAgZXhlY3V0aXZlU3VtbWFyeSxcbiAgICAgIG1vZHVsZVJlc3VsdHMsXG4gICAgICBhbmFseXNpcyxcbiAgICAgIHJlY29tbWVuZGF0aW9ucyxcbiAgICAgIGF0dGFjaG1lbnRzXG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOOCqOOCsOOCvOOCr+ODhuOCo+ODluOCteODnuODquODvOOBruani+eviVxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZEV4ZWN1dGl2ZVN1bW1hcnkodGVzdFJlc3VsdHM6IGFueSk6IGFueSB7XG4gICAgY29uc3Qgb3ZlcmFsbCA9IHRlc3RSZXN1bHRzLm92ZXJhbGwgfHwge307XG4gICAgY29uc3QgbW9kdWxlcyA9IHRlc3RSZXN1bHRzLm1vZHVsZXMgfHwge307XG4gICAgXG4gICAgLy8g5YWo5L2T44K544OG44O844K/44K544Gu5Yik5a6aXG4gICAgbGV0IG92ZXJhbGxTdGF0dXM6ICdQQVNTJyB8ICdGQUlMJyB8ICdXQVJOSU5HJyA9ICdQQVNTJztcbiAgICBpZiAob3ZlcmFsbC5mYWlsZWRUZXN0cyA+IDApIHtcbiAgICAgIG92ZXJhbGxTdGF0dXMgPSAnRkFJTCc7XG4gICAgfSBlbHNlIGlmIChvdmVyYWxsLnF1YWxpdHlTY29yZSA8IDkwKSB7XG4gICAgICBvdmVyYWxsU3RhdHVzID0gJ1dBUk5JTkcnO1xuICAgIH1cbiAgICBcbiAgICAvLyDph43opoHjgarllY/poYzjga7mir3lh7pcbiAgICBjb25zdCBjcml0aWNhbElzc3VlcyA9IHRoaXMuZXh0cmFjdENyaXRpY2FsSXNzdWVzKHRlc3RSZXN1bHRzKTtcbiAgICBcbiAgICAvLyDkuLvopoHmjqjlpajkuovpoIXjga7nlJ/miJBcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSB0aGlzLmdlbmVyYXRlS2V5UmVjb21tZW5kYXRpb25zKHRlc3RSZXN1bHRzKTtcbiAgICBcbiAgICAvLyDkuLvopoHjg6Hjg4jjg6rjgq/jgrnjga7oqIjnrpdcbiAgICBjb25zdCBrZXlNZXRyaWNzID0gdGhpcy5jYWxjdWxhdGVLZXlNZXRyaWNzKHRlc3RSZXN1bHRzKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgb3ZlcmFsbFN0YXR1cyxcbiAgICAgIHF1YWxpdHlTY29yZTogb3ZlcmFsbC5xdWFsaXR5U2NvcmUgfHwgMCxcbiAgICAgIGNyaXRpY2FsSXNzdWVzOiBjcml0aWNhbElzc3Vlcy5sZW5ndGgsXG4gICAgICByZWNvbW1lbmRhdGlvbnMsXG4gICAgICBrZXlNZXRyaWNzXG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOmHjeimgeOBquWVj+mhjOOBruaKveWHulxuICAgKi9cbiAgcHJpdmF0ZSBleHRyYWN0Q3JpdGljYWxJc3N1ZXModGVzdFJlc3VsdHM6IGFueSk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBpc3N1ZXM6IHN0cmluZ1tdID0gW107XG4gICAgXG4gICAgLy8g5aSx5pWX44GX44Gf44OG44K544OI44Gu56K66KqNXG4gICAgaWYgKHRlc3RSZXN1bHRzLm92ZXJhbGw/LmZhaWxlZFRlc3RzID4gMCkge1xuICAgICAgaXNzdWVzLnB1c2goYCR7dGVzdFJlc3VsdHMub3ZlcmFsbC5mYWlsZWRUZXN0c33lgIvjga7jg4bjgrnjg4jjgYzlpLHmlZdgKTtcbiAgICB9XG4gICAgXG4gICAgLy8g44OR44OV44Kp44O844Oe44Oz44K55ZWP6aGM44Gu56K66KqNXG4gICAgY29uc3QgcGVyZm9ybWFuY2VNb2R1bGUgPSB0ZXN0UmVzdWx0cy5tb2R1bGVzPy5wZXJmb3JtYW5jZTtcbiAgICBpZiAocGVyZm9ybWFuY2VNb2R1bGU/Lm1ldHJpY3M/LnJlc3BvbnNlVGltZSA+IDMwMDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCflv5znrZTmmYLplpPjgYzln7rmupblgKTjgpLotoXpgY4nKTtcbiAgICB9XG4gICAgXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj5ZWP6aGM44Gu56K66KqNXG4gICAgY29uc3Qgc2VjdXJpdHlNb2R1bGUgPSB0ZXN0UmVzdWx0cy5tb2R1bGVzPy5zZWN1cml0eTtcbiAgICBpZiAoc2VjdXJpdHlNb2R1bGU/LnNlY3VyaXR5U2NvcmUgPCA4NSkge1xuICAgICAgaXNzdWVzLnB1c2goJ+OCu+OCreODpeODquODhuOCo+OCueOCs+OCouOBjOWfuua6luWApOOCkuS4i+WbnuOCiycpO1xuICAgIH1cbiAgICBcbiAgICAvLyDjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPllY/poYzjga7norroqo1cbiAgICBjb25zdCB1aVV4TW9kdWxlID0gdGVzdFJlc3VsdHMubW9kdWxlcz8udWlVeDtcbiAgICBpZiAodWlVeE1vZHVsZT8uYWNjZXNzaWJpbGl0eVNjb3JlIDwgOTApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCfjgqLjgq/jgrvjgrfjg5Pjg6rjg4bjgqPjgrnjgrPjgqLjgYzln7rmupblgKTjgpLkuIvlm57jgosnKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGlzc3VlcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOS4u+imgeaOqOWlqOS6i+mgheOBrueUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZUtleVJlY29tbWVuZGF0aW9ucyh0ZXN0UmVzdWx0czogYW55KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICAvLyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnmlLnlloRcbiAgICBjb25zdCBwZXJmb3JtYW5jZU1vZHVsZSA9IHRlc3RSZXN1bHRzLm1vZHVsZXM/LnBlcmZvcm1hbmNlO1xuICAgIGlmIChwZXJmb3JtYW5jZU1vZHVsZT8ubWV0cmljcz8ucmVzcG9uc2VUaW1lID4gMjAwMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ0FQSeW/nOetlOaZgumWk+OBruacgOmBqeWMluOCkuaknOiojuOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgIH1cbiAgICBcbiAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPlvLfljJZcbiAgICBjb25zdCBzZWN1cml0eU1vZHVsZSA9IHRlc3RSZXN1bHRzLm1vZHVsZXM/LnNlY3VyaXR5O1xuICAgIGlmIChzZWN1cml0eU1vZHVsZT8udnVsbmVyYWJpbGl0aWVzPy5sZW5ndGggPiAwKSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn5qSc5Ye644GV44KM44Gf6ISG5byx5oCn44Gu5L+u5q2j44KS5YSq5YWI44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIOODpuODvOOCtuODk+ODquODhuOCo+WQkeS4ilxuICAgIGNvbnN0IHVpVXhNb2R1bGUgPSB0ZXN0UmVzdWx0cy5tb2R1bGVzPy51aVV4O1xuICAgIGlmICh1aVV4TW9kdWxlPy51c2FiaWxpdHlJc3N1ZXM/Lmxlbmd0aCA+IDApIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCfjg6bjg7zjgrbjg5Pjg6rjg4bjgqPjga7mlLnlloTjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlY29tbWVuZGF0aW9ucztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOS4u+imgeODoeODiOODquOCr+OCueOBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVLZXlNZXRyaWNzKHRlc3RSZXN1bHRzOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IG92ZXJhbGwgPSB0ZXN0UmVzdWx0cy5vdmVyYWxsIHx8IHt9O1xuICAgIGNvbnN0IG1vZHVsZXMgPSB0ZXN0UmVzdWx0cy5tb2R1bGVzIHx8IHt9O1xuICAgIFxuICAgIC8vIOWQiOagvOeOh+OBruioiOeul1xuICAgIGNvbnN0IHBhc3NSYXRlID0gb3ZlcmFsbC50b3RhbFRlc3RzID4gMCA/IFxuICAgICAgKG92ZXJhbGwucGFzc2VkVGVzdHMgLyBvdmVyYWxsLnRvdGFsVGVzdHMpICogMTAwIDogMDtcbiAgICBcbiAgICAvLyDlubPlnYflv5znrZTmmYLplpPjga7oqIjnrpdcbiAgICBjb25zdCBwZXJmb3JtYW5jZU1vZHVsZSA9IG1vZHVsZXMucGVyZm9ybWFuY2U7XG4gICAgY29uc3QgYXZlcmFnZVJlc3BvbnNlVGltZSA9IHBlcmZvcm1hbmNlTW9kdWxlPy5tZXRyaWNzPy5yZXNwb25zZVRpbWUgfHwgMDtcbiAgICBcbiAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgrPjgqLjga7lj5blvpdcbiAgICBjb25zdCBzZWN1cml0eU1vZHVsZSA9IG1vZHVsZXMuc2VjdXJpdHk7XG4gICAgY29uc3Qgc2VjdXJpdHlTY29yZSA9IHNlY3VyaXR5TW9kdWxlPy5zZWN1cml0eVNjb3JlIHx8IDA7XG4gICAgXG4gICAgLy8g44Ki44Kv44K744K344OT44Oq44OG44Kj44K544Kz44Ki44Gu5Y+W5b6XXG4gICAgY29uc3QgdWlVeE1vZHVsZSA9IG1vZHVsZXMudWlVeDtcbiAgICBjb25zdCBhY2Nlc3NpYmlsaXR5U2NvcmUgPSB1aVV4TW9kdWxlPy5hY2Nlc3NpYmlsaXR5U2NvcmUgfHwgMDtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgdG90YWxUZXN0czogb3ZlcmFsbC50b3RhbFRlc3RzIHx8IDAsXG4gICAgICBwYXNzUmF0ZTogTWF0aC5yb3VuZChwYXNzUmF0ZSAqIDEwMCkgLyAxMDAsXG4gICAgICBhdmVyYWdlUmVzcG9uc2VUaW1lOiBNYXRoLnJvdW5kKGF2ZXJhZ2VSZXNwb25zZVRpbWUpLFxuICAgICAgc2VjdXJpdHlTY29yZTogTWF0aC5yb3VuZChzZWN1cml0eVNjb3JlKSxcbiAgICAgIGFjY2Vzc2liaWxpdHlTY29yZTogTWF0aC5yb3VuZChhY2Nlc3NpYmlsaXR5U2NvcmUpXG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODouOCuOODpeODvOODq+WIpee1kOaenOOBruani+eviVxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZE1vZHVsZVJlc3VsdHModGVzdFJlc3VsdHM6IGFueSk6IHsgW21vZHVsZU5hbWU6IHN0cmluZ106IE1vZHVsZVJlcG9ydERhdGEgfSB7XG4gICAgY29uc3QgbW9kdWxlUmVzdWx0czogeyBbbW9kdWxlTmFtZTogc3RyaW5nXTogTW9kdWxlUmVwb3J0RGF0YSB9ID0ge307XG4gICAgY29uc3QgbW9kdWxlcyA9IHRlc3RSZXN1bHRzLm1vZHVsZXMgfHwge307XG4gICAgXG4gICAgZm9yIChjb25zdCBbbW9kdWxlTmFtZSwgbW9kdWxlRGF0YV0gb2YgT2JqZWN0LmVudHJpZXMobW9kdWxlcykpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBtb2R1bGVEYXRhIGFzIGFueTtcbiAgICAgIFxuICAgICAgbW9kdWxlUmVzdWx0c1ttb2R1bGVOYW1lXSA9IHtcbiAgICAgICAgbmFtZTogbW9kdWxlTmFtZSxcbiAgICAgICAgc3RhdHVzOiB0aGlzLmRldGVybWluZU1vZHVsZVN0YXR1cyhkYXRhKSxcbiAgICAgICAgZXhlY3V0aW9uVGltZTogZGF0YS5leGVjdXRpb25UaW1lIHx8IDAsXG4gICAgICAgIHRlc3RDb3VudDogZGF0YS50b3RhbFRlc3RzIHx8IDAsXG4gICAgICAgIHBhc3NDb3VudDogZGF0YS5wYXNzZWRUZXN0cyB8fCAwLFxuICAgICAgICBmYWlsQ291bnQ6IGRhdGEuZmFpbGVkVGVzdHMgfHwgMCxcbiAgICAgICAgc2tpcENvdW50OiBkYXRhLnNraXBwZWRUZXN0cyB8fCAwLFxuICAgICAgICBjb3ZlcmFnZTogZGF0YS5jb3ZlcmFnZSB8fCAwLFxuICAgICAgICBpc3N1ZXM6IHRoaXMuZXh0cmFjdE1vZHVsZUlzc3VlcyhkYXRhKSxcbiAgICAgICAgbWV0cmljczogZGF0YS5tZXRyaWNzIHx8IHt9XG4gICAgICB9O1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbW9kdWxlUmVzdWx0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODouOCuOODpeODvOODq+OCueODhuODvOOCv+OCueOBruWIpOWumlxuICAgKi9cbiAgcHJpdmF0ZSBkZXRlcm1pbmVNb2R1bGVTdGF0dXMobW9kdWxlRGF0YTogYW55KTogJ1BBU1MnIHwgJ0ZBSUwnIHwgJ1dBUk5JTkcnIHtcbiAgICBpZiAobW9kdWxlRGF0YS5mYWlsZWRUZXN0cyA+IDApIHtcbiAgICAgIHJldHVybiAnRkFJTCc7XG4gICAgfVxuICAgIFxuICAgIGlmIChtb2R1bGVEYXRhLmNvdmVyYWdlIDwgODAgfHwgbW9kdWxlRGF0YS5xdWFsaXR5U2NvcmUgPCA4NSkge1xuICAgICAgcmV0dXJuICdXQVJOSU5HJztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuICdQQVNTJztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODouOCuOODpeODvOODq+WVj+mhjOOBruaKveWHulxuICAgKi9cbiAgcHJpdmF0ZSBleHRyYWN0TW9kdWxlSXNzdWVzKG1vZHVsZURhdGE6IGFueSk6IElzc3VlSXRlbVtdIHtcbiAgICBjb25zdCBpc3N1ZXM6IElzc3VlSXRlbVtdID0gW107XG4gICAgXG4gICAgLy8g5aSx5pWX44GX44Gf44OG44K544OI44Gu5ZWP6aGMXG4gICAgaWYgKG1vZHVsZURhdGEuZmFpbGVkVGVzdHMgPiAwKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnSElHSCcsXG4gICAgICAgIGNhdGVnb3J5OiAnVGVzdCBGYWlsdXJlJyxcbiAgICAgICAgdGl0bGU6ICfjg4bjgrnjg4jlpLHmlZcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogYCR7bW9kdWxlRGF0YS5mYWlsZWRUZXN0c33lgIvjga7jg4bjgrnjg4jjgYzlpLHmlZfjgZfjgb7jgZfjgZ9gLFxuICAgICAgICBsb2NhdGlvbjogJ+ODhuOCueODiOWun+ihjCcsXG4gICAgICAgIHJlY29tbWVuZGF0aW9uOiAn5aSx5pWX44GX44Gf44OG44K544OI44Gu5Y6f5Zug44KS6Kq/5p+744GX44CB5L+u5q2j44GX44Gm44GP44Gg44GV44GEJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIOOCq+ODkOODrOODg+OCuOS4jei2s+OBruWVj+mhjFxuICAgIGlmIChtb2R1bGVEYXRhLmNvdmVyYWdlIDwgODApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdNRURJVU0nLFxuICAgICAgICBjYXRlZ29yeTogJ0NvdmVyYWdlJyxcbiAgICAgICAgdGl0bGU6ICfjg4bjgrnjg4jjgqvjg5Djg6zjg4PjgrjkuI3otrMnLFxuICAgICAgICBkZXNjcmlwdGlvbjogYOODhuOCueODiOOCq+ODkOODrOODg+OCuOOBjCR7bW9kdWxlRGF0YS5jb3ZlcmFnZX0l44Gn44GZYCxcbiAgICAgICAgbG9jYXRpb246ICfjg4bjgrnjg4jjgqvjg5Djg6zjg4PjgrgnLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogJ+ODhuOCueODiOOCq+ODkOODrOODg+OCuOOCkjgwJeS7peS4iuOBq+WQkeS4iuOBleOBm+OBpuOBj+OBoOOBleOBhCdcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gaXNzdWVzO1xuICB9XG4gIFxuICAvKipcbiAgICog57Wx5ZCI5YiG5p6Q44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1JbnRlZ3JhdGVkQW5hbHlzaXModGVzdFJlc3VsdHM6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc29sZS5sb2coJ/CflI0g57Wx5ZCI5YiG5p6Q5a6f6KGM5LitLi4uJyk7XG4gICAgXG4gICAgLy8g44OR44OV44Kp44O844Oe44Oz44K55YiG5p6QXG4gICAgY29uc3QgcGVyZm9ybWFuY2VBbmFseXNpcyA9IHRoaXMuYW5hbHl6ZVBlcmZvcm1hbmNlKHRlc3RSZXN1bHRzKTtcbiAgICBcbiAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPliIbmnpBcbiAgICBjb25zdCBzZWN1cml0eUFuYWx5c2lzID0gdGhpcy5hbmFseXplU2VjdXJpdHkodGVzdFJlc3VsdHMpO1xuICAgIFxuICAgIC8vIOWTgeizquWIhuaekFxuICAgIGNvbnN0IHF1YWxpdHlBbmFseXNpcyA9IHRoaXMuYW5hbHl6ZVF1YWxpdHkodGVzdFJlc3VsdHMpO1xuICAgIFxuICAgIC8vIOOCr+ODreOCueODouOCuOODpeODvOODq+WIhuaekFxuICAgIGNvbnN0IGNyb3NzTW9kdWxlQW5hbHlzaXMgPSB0aGlzLmFuYWx5emVDcm9zc01vZHVsZSh0ZXN0UmVzdWx0cyk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHBlcmZvcm1hbmNlQW5hbHlzaXMsXG4gICAgICBzZWN1cml0eUFuYWx5c2lzLFxuICAgICAgcXVhbGl0eUFuYWx5c2lzLFxuICAgICAgY3Jvc3NNb2R1bGVBbmFseXNpc1xuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnliIbmnpBcbiAgICovXG4gIHByaXZhdGUgYW5hbHl6ZVBlcmZvcm1hbmNlKHRlc3RSZXN1bHRzOiBhbnkpOiBQZXJmb3JtYW5jZUFuYWx5c2lzIHtcbiAgICBjb25zdCBwZXJmb3JtYW5jZU1vZHVsZSA9IHRlc3RSZXN1bHRzLm1vZHVsZXM/LnBlcmZvcm1hbmNlIHx8IHt9O1xuICAgIGNvbnN0IG1ldHJpY3MgPSBwZXJmb3JtYW5jZU1vZHVsZS5tZXRyaWNzIHx8IHt9O1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBvdmVyYWxsU2NvcmU6IHRoaXMuY2FsY3VsYXRlUGVyZm9ybWFuY2VTY29yZShtZXRyaWNzKSxcbiAgICAgIHJlc3BvbnNlVGltZUFuYWx5c2lzOiB7XG4gICAgICAgIGF2ZXJhZ2U6IG1ldHJpY3MucmVzcG9uc2VUaW1lIHx8IDAsXG4gICAgICAgIG1lZGlhbjogbWV0cmljcy5tZWRpYW5SZXNwb25zZVRpbWUgfHwgMCxcbiAgICAgICAgcDk1OiBtZXRyaWNzLnA5NVJlc3BvbnNlVGltZSB8fCAwLFxuICAgICAgICBwOTk6IG1ldHJpY3MucDk5UmVzcG9uc2VUaW1lIHx8IDAsXG4gICAgICAgIHNsb3dlc3RFbmRwb2ludHM6IG1ldHJpY3Muc2xvd2VzdEVuZHBvaW50cyB8fCBbXVxuICAgICAgfSxcbiAgICAgIHJlc291cmNlVXNhZ2VBbmFseXNpczoge1xuICAgICAgICBjcHVVc2FnZTogbWV0cmljcy5jcHVVc2FnZSB8fCAwLFxuICAgICAgICBtZW1vcnlVc2FnZTogbWV0cmljcy5tZW1vcnlVc2FnZSB8fCAwLFxuICAgICAgICBuZXR3b3JrVXNhZ2U6IG1ldHJpY3MubmV0d29ya1VzYWdlIHx8IDAsXG4gICAgICAgIGJvdHRsZW5lY2tzOiBtZXRyaWNzLmJvdHRsZW5lY2tzIHx8IFtdXG4gICAgICB9LFxuICAgICAgc2NhbGFiaWxpdHlBbmFseXNpczoge1xuICAgICAgICBjb25jdXJyZW50VXNlckNhcGFjaXR5OiBtZXRyaWNzLm1heENvbmN1cnJlbnRVc2VycyB8fCAwLFxuICAgICAgICB0aHJvdWdocHV0TGltaXQ6IG1ldHJpY3MubWF4VGhyb3VnaHB1dCB8fCAwLFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IHRoaXMuZ2VuZXJhdGVQZXJmb3JtYW5jZVJlY29tbWVuZGF0aW9ucyhtZXRyaWNzKVxuICAgICAgfVxuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnjgrnjgrPjgqLjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlUGVyZm9ybWFuY2VTY29yZShtZXRyaWNzOiBhbnkpOiBudW1iZXIge1xuICAgIGxldCBzY29yZSA9IDEwMDtcbiAgICBcbiAgICAvLyDlv5znrZTmmYLplpPjgavjgojjgovmuJvngrlcbiAgICBpZiAobWV0cmljcy5yZXNwb25zZVRpbWUgPiAzMDAwKSBzY29yZSAtPSAzMDtcbiAgICBlbHNlIGlmIChtZXRyaWNzLnJlc3BvbnNlVGltZSA+IDIwMDApIHNjb3JlIC09IDIwO1xuICAgIGVsc2UgaWYgKG1ldHJpY3MucmVzcG9uc2VUaW1lID4gMTAwMCkgc2NvcmUgLT0gMTA7XG4gICAgXG4gICAgLy8g44Oq44K944O844K55L2/55So6YeP44Gr44KI44KL5rib54K5XG4gICAgaWYgKG1ldHJpY3MuY3B1VXNhZ2UgPiA4MCkgc2NvcmUgLT0gMjA7XG4gICAgZWxzZSBpZiAobWV0cmljcy5jcHVVc2FnZSA+IDYwKSBzY29yZSAtPSAxMDtcbiAgICBcbiAgICBpZiAobWV0cmljcy5tZW1vcnlVc2FnZSA+IDgwKSBzY29yZSAtPSAyMDtcbiAgICBlbHNlIGlmIChtZXRyaWNzLm1lbW9yeVVzYWdlID4gNjApIHNjb3JlIC09IDEwO1xuICAgIFxuICAgIHJldHVybiBNYXRoLm1heCgwLCBzY29yZSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnmjqjlpajkuovpoIXjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVQZXJmb3JtYW5jZVJlY29tbWVuZGF0aW9ucyhtZXRyaWNzOiBhbnkpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGlmIChtZXRyaWNzLnJlc3BvbnNlVGltZSA+IDIwMDApIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKCdBUEnlv5znrZTmmYLplpPjga7mnIDpganljJbjgpLmpJzoqI7jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKG1ldHJpY3MuY3B1VXNhZ2UgPiA3MCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goJ0NQVeS9v+eUqOeOh+OBjOmrmOOBhOOBn+OCgeOAgeWHpueQhuOBruacgOmBqeWMluOCkuaknOiojuOBl+OBpuOBj+OBoOOBleOBhCcpO1xuICAgIH1cbiAgICBcbiAgICBpZiAobWV0cmljcy5tZW1vcnlVc2FnZSA+IDcwKSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCgn44Oh44Oi44Oq5L2/55So6YeP44GM5aSa44GE44Gf44KB44CB44Oh44Oi44Oq44Oq44O844Kv44Gu56K66KqN44KS6KGM44Gj44Gm44GP44Gg44GV44GEJyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZWNvbW1lbmRhdGlvbnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjgrvjgq3jg6Xjg6rjg4bjgqPliIbmnpBcbiAgICovXG4gIHByaXZhdGUgYW5hbHl6ZVNlY3VyaXR5KHRlc3RSZXN1bHRzOiBhbnkpOiBTZWN1cml0eUFuYWx5c2lzIHtcbiAgICBjb25zdCBzZWN1cml0eU1vZHVsZSA9IHRlc3RSZXN1bHRzLm1vZHVsZXM/LnNlY3VyaXR5IHx8IHt9O1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBvdmVyYWxsU2NvcmU6IHNlY3VyaXR5TW9kdWxlLnNlY3VyaXR5U2NvcmUgfHwgMCxcbiAgICAgIHZ1bG5lcmFiaWxpdGllczoge1xuICAgICAgICBjcml0aWNhbDogc2VjdXJpdHlNb2R1bGUudnVsbmVyYWJpbGl0aWVzPy5jcml0aWNhbCB8fCBbXSxcbiAgICAgICAgaGlnaDogc2VjdXJpdHlNb2R1bGUudnVsbmVyYWJpbGl0aWVzPy5oaWdoIHx8IFtdLFxuICAgICAgICBtZWRpdW06IHNlY3VyaXR5TW9kdWxlLnZ1bG5lcmFiaWxpdGllcz8ubWVkaXVtIHx8IFtdLFxuICAgICAgICBsb3c6IHNlY3VyaXR5TW9kdWxlLnZ1bG5lcmFiaWxpdGllcz8ubG93IHx8IFtdXG4gICAgICB9LFxuICAgICAgY29tcGxpYW5jZVN0YXR1czogc2VjdXJpdHlNb2R1bGUuY29tcGxpYW5jZSB8fCB7fSxcbiAgICAgIGF1dGhlbnRpY2F0aW9uQW5hbHlzaXM6IHtcbiAgICAgICAgc3RyZW5ndGg6IHNlY3VyaXR5TW9kdWxlLmF1dGhTdHJlbmd0aCB8fCAwLFxuICAgICAgICBpc3N1ZXM6IHNlY3VyaXR5TW9kdWxlLmF1dGhJc3N1ZXMgfHwgW10sXG4gICAgICAgIHJlY29tbWVuZGF0aW9uczogc2VjdXJpdHlNb2R1bGUuYXV0aFJlY29tbWVuZGF0aW9ucyB8fCBbXVxuICAgICAgfSxcbiAgICAgIGRhdGFQcm90ZWN0aW9uQW5hbHlzaXM6IHtcbiAgICAgICAgZW5jcnlwdGlvblN0YXR1czogc2VjdXJpdHlNb2R1bGUuZW5jcnlwdGlvbkVuYWJsZWQgfHwgZmFsc2UsXG4gICAgICAgIGRhdGFMZWFrYWdlUmlzazogc2VjdXJpdHlNb2R1bGUuZGF0YUxlYWthZ2VSaXNrIHx8IDAsXG4gICAgICAgIHJlY29tbWVuZGF0aW9uczogc2VjdXJpdHlNb2R1bGUuZGF0YVByb3RlY3Rpb25SZWNvbW1lbmRhdGlvbnMgfHwgW11cbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFxuICAvKipcbiAgICog5ZOB6LOq5YiG5p6QXG4gICAqL1xuICBwcml2YXRlIGFuYWx5emVRdWFsaXR5KHRlc3RSZXN1bHRzOiBhbnkpOiBRdWFsaXR5QW5hbHlzaXMge1xuICAgIGNvbnN0IG92ZXJhbGxTY29yZSA9IHRlc3RSZXN1bHRzLm92ZXJhbGw/LnF1YWxpdHlTY29yZSB8fCAwO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBvdmVyYWxsU2NvcmUsXG4gICAgICBmdW5jdGlvbmFsUXVhbGl0eToge1xuICAgICAgICBzY29yZTogdGhpcy5jYWxjdWxhdGVGdW5jdGlvbmFsUXVhbGl0eVNjb3JlKHRlc3RSZXN1bHRzKSxcbiAgICAgICAgaXNzdWVzOiB0aGlzLmV4dHJhY3RGdW5jdGlvbmFsSXNzdWVzKHRlc3RSZXN1bHRzKVxuICAgICAgfSxcbiAgICAgIHVzYWJpbGl0eVF1YWxpdHk6IHtcbiAgICAgICAgc2NvcmU6IHRoaXMuY2FsY3VsYXRlVXNhYmlsaXR5U2NvcmUodGVzdFJlc3VsdHMpLFxuICAgICAgICBhY2Nlc3NpYmlsaXR5U2NvcmU6IHRlc3RSZXN1bHRzLm1vZHVsZXM/LnVpVXg/LmFjY2Vzc2liaWxpdHlTY29yZSB8fCAwLFxuICAgICAgICB1c2VyRXhwZXJpZW5jZUlzc3VlczogdGVzdFJlc3VsdHMubW9kdWxlcz8udWlVeD8udXhJc3N1ZXMgfHwgW11cbiAgICAgIH0sXG4gICAgICByZWxpYWJpbGl0eVF1YWxpdHk6IHtcbiAgICAgICAgc2NvcmU6IHRoaXMuY2FsY3VsYXRlUmVsaWFiaWxpdHlTY29yZSh0ZXN0UmVzdWx0cyksXG4gICAgICAgIGVycm9yUmF0ZTogdGhpcy5jYWxjdWxhdGVFcnJvclJhdGUodGVzdFJlc3VsdHMpLFxuICAgICAgICBhdmFpbGFiaWxpdHlTY29yZTogdGVzdFJlc3VsdHMubW9kdWxlcz8uaW50ZWdyYXRpb24/LmF2YWlsYWJpbGl0eVNjb3JlIHx8IDBcbiAgICAgIH0sXG4gICAgICBtYWludGFpbmFiaWxpdHlRdWFsaXR5OiB7XG4gICAgICAgIHNjb3JlOiB0aGlzLmNhbGN1bGF0ZU1haW50YWluYWJpbGl0eVNjb3JlKHRlc3RSZXN1bHRzKSxcbiAgICAgICAgY29kZVF1YWxpdHlJc3N1ZXM6IHRoaXMuZXh0cmFjdENvZGVRdWFsaXR5SXNzdWVzKHRlc3RSZXN1bHRzKVxuICAgICAgfVxuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDmqZ/og73lk4Hos6rjgrnjgrPjgqLjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlRnVuY3Rpb25hbFF1YWxpdHlTY29yZSh0ZXN0UmVzdWx0czogYW55KTogbnVtYmVyIHtcbiAgICBjb25zdCBvdmVyYWxsID0gdGVzdFJlc3VsdHMub3ZlcmFsbCB8fCB7fTtcbiAgICBpZiAob3ZlcmFsbC50b3RhbFRlc3RzID09PSAwKSByZXR1cm4gMDtcbiAgICBcbiAgICByZXR1cm4gKG92ZXJhbGwucGFzc2VkVGVzdHMgLyBvdmVyYWxsLnRvdGFsVGVzdHMpICogMTAwO1xuICB9XG4gIFxuICAvKipcbiAgICog5qmf6IO95ZWP6aGM44Gu5oq95Ye6XG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3RGdW5jdGlvbmFsSXNzdWVzKHRlc3RSZXN1bHRzOiBhbnkpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgaXNzdWVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGlmICh0ZXN0UmVzdWx0cy5vdmVyYWxsPy5mYWlsZWRUZXN0cyA+IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGAke3Rlc3RSZXN1bHRzLm92ZXJhbGwuZmFpbGVkVGVzdHN95YCL44Gu5qmf6IO944OG44K544OI44GM5aSx5pWXYCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBpc3N1ZXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjg6bjg7zjgrbjg5Pjg6rjg4bjgqPjgrnjgrPjgqLjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlVXNhYmlsaXR5U2NvcmUodGVzdFJlc3VsdHM6IGFueSk6IG51bWJlciB7XG4gICAgY29uc3QgdWlVeE1vZHVsZSA9IHRlc3RSZXN1bHRzLm1vZHVsZXM/LnVpVXggfHwge307XG4gICAgcmV0dXJuIHVpVXhNb2R1bGUudXNhYmlsaXR5U2NvcmUgfHwgMDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOS/oemgvOaAp+OCueOCs+OCouOBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVSZWxpYWJpbGl0eVNjb3JlKHRlc3RSZXN1bHRzOiBhbnkpOiBudW1iZXIge1xuICAgIGNvbnN0IGVycm9yUmF0ZSA9IHRoaXMuY2FsY3VsYXRlRXJyb3JSYXRlKHRlc3RSZXN1bHRzKTtcbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgMTAwIC0gKGVycm9yUmF0ZSAqIDEwKSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjgqjjg6njg7znjofjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlRXJyb3JSYXRlKHRlc3RSZXN1bHRzOiBhbnkpOiBudW1iZXIge1xuICAgIGNvbnN0IG92ZXJhbGwgPSB0ZXN0UmVzdWx0cy5vdmVyYWxsIHx8IHt9O1xuICAgIGlmIChvdmVyYWxsLnRvdGFsVGVzdHMgPT09IDApIHJldHVybiAwO1xuICAgIFxuICAgIHJldHVybiAob3ZlcmFsbC5mYWlsZWRUZXN0cyAvIG92ZXJhbGwudG90YWxUZXN0cykgKiAxMDA7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDkv53lrojmgKfjgrnjgrPjgqLjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlTWFpbnRhaW5hYmlsaXR5U2NvcmUodGVzdFJlc3VsdHM6IGFueSk6IG51bWJlciB7XG4gICAgLy8g5L+d5a6I5oCn44Gv6KSH5pWw44Gu6KaB5Zug44Gn5rG65a6aXG4gICAgbGV0IHNjb3JlID0gMTAwO1xuICAgIFxuICAgIC8vIOODhuOCueODiOOCq+ODkOODrOODg+OCuOOBq+OCiOOCi+ipleS+oVxuICAgIGNvbnN0IGF2Z0NvdmVyYWdlID0gdGhpcy5jYWxjdWxhdGVBdmVyYWdlQ292ZXJhZ2UodGVzdFJlc3VsdHMpO1xuICAgIGlmIChhdmdDb3ZlcmFnZSA8IDgwKSBzY29yZSAtPSAyMDtcbiAgICBlbHNlIGlmIChhdmdDb3ZlcmFnZSA8IDkwKSBzY29yZSAtPSAxMDtcbiAgICBcbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgc2NvcmUpO1xuICB9XG4gIFxuICAvKipcbiAgICog5bmz5Z2H44Kr44OQ44Os44OD44K444Gu6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZUF2ZXJhZ2VDb3ZlcmFnZSh0ZXN0UmVzdWx0czogYW55KTogbnVtYmVyIHtcbiAgICBjb25zdCBtb2R1bGVzID0gdGVzdFJlc3VsdHMubW9kdWxlcyB8fCB7fTtcbiAgICBjb25zdCBjb3ZlcmFnZXMgPSBPYmplY3QudmFsdWVzKG1vZHVsZXMpXG4gICAgICAubWFwKChtb2R1bGU6IGFueSkgPT4gbW9kdWxlLmNvdmVyYWdlIHx8IDApXG4gICAgICAuZmlsdGVyKGNvdmVyYWdlID0+IGNvdmVyYWdlID4gMCk7XG4gICAgXG4gICAgaWYgKGNvdmVyYWdlcy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIFxuICAgIHJldHVybiBjb3ZlcmFnZXMucmVkdWNlKChzdW0sIGNvdmVyYWdlKSA9PiBzdW0gKyBjb3ZlcmFnZSwgMCkgLyBjb3ZlcmFnZXMubGVuZ3RoO1xuICB9XG4gIFxuICAvKipcbiAgICog44Kz44O844OJ5ZOB6LOq5ZWP6aGM44Gu5oq95Ye6XG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3RDb2RlUXVhbGl0eUlzc3Vlcyh0ZXN0UmVzdWx0czogYW55KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICBjb25zdCBhdmdDb3ZlcmFnZSA9IHRoaXMuY2FsY3VsYXRlQXZlcmFnZUNvdmVyYWdlKHRlc3RSZXN1bHRzKTtcbiAgICBpZiAoYXZnQ292ZXJhZ2UgPCA4MCkge1xuICAgICAgaXNzdWVzLnB1c2goYOODhuOCueODiOOCq+ODkOODrOODg+OCuOOBjOS9juOBhDogJHthdmdDb3ZlcmFnZS50b0ZpeGVkKDEpfSVgKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGlzc3VlcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOOCr+ODreOCueODouOCuOODpeODvOODq+WIhuaekFxuICAgKi9cbiAgcHJpdmF0ZSBhbmFseXplQ3Jvc3NNb2R1bGUodGVzdFJlc3VsdHM6IGFueSk6IENyb3NzTW9kdWxlQW5hbHlzaXMge1xuICAgIHJldHVybiB7XG4gICAgICBpbnRlZ3JhdGlvbklzc3VlczogdGhpcy5maW5kSW50ZWdyYXRpb25Jc3N1ZXModGVzdFJlc3VsdHMpLFxuICAgICAgZGF0YUZsb3dBbmFseXNpczoge1xuICAgICAgICBib3R0bGVuZWNrczogdGhpcy5maW5kRGF0YUZsb3dCb3R0bGVuZWNrcyh0ZXN0UmVzdWx0cyksXG4gICAgICAgIGluY29uc2lzdGVuY2llczogdGhpcy5maW5kRGF0YUluY29uc2lzdGVuY2llcyh0ZXN0UmVzdWx0cylcbiAgICAgIH0sXG4gICAgICBkZXBlbmRlbmN5QW5hbHlzaXM6IHtcbiAgICAgICAgY2lyY3VsYXJEZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgICBtaXNzaW5nRGVwZW5kZW5jaWVzOiBbXVxuICAgICAgfSxcbiAgICAgIHBlcmZvcm1hbmNlSW1wYWN0OiB7XG4gICAgICAgIGNyb3NzTW9kdWxlTGF0ZW5jeTogdGhpcy5jYWxjdWxhdGVDcm9zc01vZHVsZUxhdGVuY3kodGVzdFJlc3VsdHMpLFxuICAgICAgICByZXNvdXJjZUNvbnRlbnRpb246IHRoaXMuZmluZFJlc291cmNlQ29udGVudGlvbih0ZXN0UmVzdWx0cylcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFxuICAvKipcbiAgICog57Wx5ZCI5ZWP6aGM44Gu55m66KaLXG4gICAqL1xuICBwcml2YXRlIGZpbmRJbnRlZ3JhdGlvbklzc3Vlcyh0ZXN0UmVzdWx0czogYW55KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICBjb25zdCBpbnRlZ3JhdGlvbk1vZHVsZSA9IHRlc3RSZXN1bHRzLm1vZHVsZXM/LmludGVncmF0aW9uO1xuICAgIGlmIChpbnRlZ3JhdGlvbk1vZHVsZSAmJiBpbnRlZ3JhdGlvbk1vZHVsZS5mYWlsZWRUZXN0cyA+IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCfjg6Ljgrjjg6Xjg7zjg6vplpPjga7ntbHlkIjjg4bjgrnjg4jjgafllY/poYzjgYznmbropovjgZXjgozjgb7jgZfjgZ8nKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGlzc3VlcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODh+ODvOOCv+ODleODreODvOODnOODiOODq+ODjeODg+OCr+OBrueZuuimi1xuICAgKi9cbiAgcHJpdmF0ZSBmaW5kRGF0YUZsb3dCb3R0bGVuZWNrcyh0ZXN0UmVzdWx0czogYW55KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGJvdHRsZW5lY2tzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIGNvbnN0IHBlcmZvcm1hbmNlTW9kdWxlID0gdGVzdFJlc3VsdHMubW9kdWxlcz8ucGVyZm9ybWFuY2U7XG4gICAgaWYgKHBlcmZvcm1hbmNlTW9kdWxlPy5tZXRyaWNzPy5zbG93ZXN0RW5kcG9pbnRzKSB7XG4gICAgICBib3R0bGVuZWNrcy5wdXNoKC4uLnBlcmZvcm1hbmNlTW9kdWxlLm1ldHJpY3Muc2xvd2VzdEVuZHBvaW50cy5tYXAoXG4gICAgICAgIChlbmRwb2ludDogYW55KSA9PiBgJHtlbmRwb2ludC5tZXRob2R9ICR7ZW5kcG9pbnQuZW5kcG9pbnR9YFxuICAgICAgKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBib3R0bGVuZWNrcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODh+ODvOOCv+S4jeaVtOWQiOOBrueZuuimi1xuICAgKi9cbiAgcHJpdmF0ZSBmaW5kRGF0YUluY29uc2lzdGVuY2llcyh0ZXN0UmVzdWx0czogYW55KTogc3RyaW5nW10ge1xuICAgIC8vIOODh+ODvOOCv+S4jeaVtOWQiOOBruaknOWHuuODreOCuOODg+OCr1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOOCr+ODreOCueODouOCuOODpeODvOODq+ODrOOCpOODhuODs+OCt+OBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVDcm9zc01vZHVsZUxhdGVuY3kodGVzdFJlc3VsdHM6IGFueSk6IG51bWJlciB7XG4gICAgY29uc3QgaW50ZWdyYXRpb25Nb2R1bGUgPSB0ZXN0UmVzdWx0cy5tb2R1bGVzPy5pbnRlZ3JhdGlvbjtcbiAgICByZXR1cm4gaW50ZWdyYXRpb25Nb2R1bGU/Lm1ldHJpY3M/LmNyb3NzTW9kdWxlTGF0ZW5jeSB8fCAwO1xuICB9XG4gIFxuICAvKipcbiAgICog44Oq44K944O844K556u25ZCI44Gu55m66KaLXG4gICAqL1xuICBwcml2YXRlIGZpbmRSZXNvdXJjZUNvbnRlbnRpb24odGVzdFJlc3VsdHM6IGFueSk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBjb250ZW50aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICAvLyBDUFXnq7blkIjjga7norroqo1cbiAgICBjb25zdCBwZXJmb3JtYW5jZU1vZHVsZSA9IHRlc3RSZXN1bHRzLm1vZHVsZXM/LnBlcmZvcm1hbmNlO1xuICAgIGlmIChwZXJmb3JtYW5jZU1vZHVsZT8ubWV0cmljcz8uY3B1VXNhZ2UgPiA4MCkge1xuICAgICAgY29udGVudGlvbnMucHVzaCgnQ1BV5L2/55So546H44GM6auY44GP44CB44Oq44K944O844K556u25ZCI44Gu5Y+v6IO95oCn44GM44GC44KK44G+44GZJyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBjb250ZW50aW9ucztcbiAgfVxuICBcbiAgLyoqXG4gICAqIOaOqOWlqOS6i+mgheOBrueUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZVJlY29tbWVuZGF0aW9ucyhhbmFseXNpczogYW55KTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgaW1tZWRpYXRlOiB0aGlzLmdlbmVyYXRlSW1tZWRpYXRlUmVjb21tZW5kYXRpb25zKGFuYWx5c2lzKSxcbiAgICAgIHNob3J0VGVybTogdGhpcy5nZW5lcmF0ZVNob3J0VGVybVJlY29tbWVuZGF0aW9ucyhhbmFseXNpcyksXG4gICAgICBsb25nVGVybTogdGhpcy5nZW5lcmF0ZUxvbmdUZXJtUmVjb21tZW5kYXRpb25zKGFuYWx5c2lzKVxuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDljbPluqflr77lv5zmjqjlpajkuovpoIXjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVJbW1lZGlhdGVSZWNvbW1lbmRhdGlvbnMoYW5hbHlzaXM6IGFueSk6IFJlY29tbWVuZGF0aW9uSXRlbVtdIHtcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnM6IFJlY29tbWVuZGF0aW9uSXRlbVtdID0gW107XG4gICAgXG4gICAgLy8g6YeN6KaB44Gq44K744Kt44Ol44Oq44OG44Kj5ZWP6aGMXG4gICAgaWYgKGFuYWx5c2lzLnNlY3VyaXR5QW5hbHlzaXMudnVsbmVyYWJpbGl0aWVzLmNyaXRpY2FsLmxlbmd0aCA+IDApIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKHtcbiAgICAgICAgcHJpb3JpdHk6ICdISUdIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdTZWN1cml0eScsXG4gICAgICAgIHRpdGxlOiAn6YeN6KaB44Gq44K744Kt44Ol44Oq44OG44Kj6ISG5byx5oCn44Gu5L+u5q2jJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfph43opoHluqbjga7pq5jjgYTjgrvjgq3jg6Xjg6rjg4bjgqPohIblvLHmgKfjgYzmpJzlh7rjgZXjgozjgb7jgZfjgZ8nLFxuICAgICAgICBpbXBhY3Q6ICfjgrvjgq3jg6Xjg6rjg4bjgqPjg6rjgrnjgq/jga7lpKfluYXjgarou73muJsnLFxuICAgICAgICBlZmZvcnQ6ICfpq5gnLFxuICAgICAgICB0aW1lbGluZTogJ+WNs+W6pydcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnllY/poYxcbiAgICBpZiAoYW5hbHlzaXMucGVyZm9ybWFuY2VBbmFseXNpcy5yZXNwb25zZVRpbWVBbmFseXNpcy5hdmVyYWdlID4gMzAwMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goe1xuICAgICAgICBwcmlvcml0eTogJ0hJR0gnLFxuICAgICAgICBjYXRlZ29yeTogJ1BlcmZvcm1hbmNlJyxcbiAgICAgICAgdGl0bGU6ICdBUEnlv5znrZTmmYLplpPjga7mlLnlloQnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FQSeW/nOetlOaZgumWk+OBjOWfuua6luWApOOCkuWkp+W5heOBq+i2hemBjuOBl+OBpuOBhOOBvuOBmScsXG4gICAgICAgIGltcGFjdDogJ+ODpuODvOOCtuODvOOCqOOCr+OCueODmuODquOCqOODs+OCueOBruWQkeS4iicsXG4gICAgICAgIGVmZm9ydDogJ+S4rScsXG4gICAgICAgIHRpbWVsaW5lOiAnMemAsemWk+S7peWGhSdcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcmVjb21tZW5kYXRpb25zO1xuICB9XG4gIFxuICAvKipcbiAgICog55+t5pyf5o6o5aWo5LqL6aCF44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlU2hvcnRUZXJtUmVjb21tZW5kYXRpb25zKGFuYWx5c2lzOiBhbnkpOiBSZWNvbW1lbmRhdGlvbkl0ZW1bXSB7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zOiBSZWNvbW1lbmRhdGlvbkl0ZW1bXSA9IFtdO1xuICAgIFxuICAgIC8vIOODhuOCueODiOOCq+ODkOODrOODg+OCuOOBruaUueWWhFxuICAgIGlmIChhbmFseXNpcy5xdWFsaXR5QW5hbHlzaXMub3ZlcmFsbFNjb3JlIDwgODUpIHtcbiAgICAgIHJlY29tbWVuZGF0aW9ucy5wdXNoKHtcbiAgICAgICAgcHJpb3JpdHk6ICdNRURJVU0nLFxuICAgICAgICBjYXRlZ29yeTogJ1F1YWxpdHknLFxuICAgICAgICB0aXRsZTogJ+ODhuOCueODiOOCq+ODkOODrOODg+OCuOOBruWQkeS4iicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn44OG44K544OI44Kr44OQ44Os44OD44K444KS5ZCR5LiK44GV44Gb44Gm5ZOB6LOq44KS5pS55ZaE44GX44Gm44GP44Gg44GV44GEJyxcbiAgICAgICAgaW1wYWN0OiAn44Kz44O844OJ5ZOB6LOq44Gu5ZCR5LiKJyxcbiAgICAgICAgZWZmb3J0OiAn5LitJyxcbiAgICAgICAgdGltZWxpbmU6ICcx44O25pyI5Lul5YaFJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZWNvbW1lbmRhdGlvbnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDplbfmnJ/mjqjlpajkuovpoIXjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVMb25nVGVybVJlY29tbWVuZGF0aW9ucyhhbmFseXNpczogYW55KTogUmVjb21tZW5kYXRpb25JdGVtW10ge1xuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uczogUmVjb21tZW5kYXRpb25JdGVtW10gPSBbXTtcbiAgICBcbiAgICAvLyDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjga7mlLnlloRcbiAgICBpZiAoYW5hbHlzaXMuY3Jvc3NNb2R1bGVBbmFseXNpcy5pbnRlZ3JhdGlvbklzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgICByZWNvbW1lbmRhdGlvbnMucHVzaCh7XG4gICAgICAgIHByaW9yaXR5OiAnTE9XJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdBcmNoaXRlY3R1cmUnLFxuICAgICAgICB0aXRsZTogJ+OCt+OCueODhuODoOOCouODvOOCreODhuOCr+ODgeODo+OBruimi+ebtOOBlycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn44Oi44K444Ol44O844Or6ZaT44Gu57Wx5ZCI44KS5pS55ZaE44GX44Gm44GP44Gg44GV44GEJyxcbiAgICAgICAgaW1wYWN0OiAn44K344K544OG44Og5YWo5L2T44Gu5L+d5a6I5oCn5ZCR5LiKJyxcbiAgICAgICAgZWZmb3J0OiAn6auYJyxcbiAgICAgICAgdGltZWxpbmU6ICcz44O25pyI5Lul5YaFJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZWNvbW1lbmRhdGlvbnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDmt7vku5jjg5XjgqHjgqTjg6vjga7mupblgplcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcHJlcGFyZUF0dGFjaG1lbnRzKHRlc3RSZXN1bHRzOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGF0dGFjaG1lbnRzID0ge1xuICAgICAgc2NyZWVuc2hvdHM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgbG9nczogW10gYXMgc3RyaW5nW10sXG4gICAgICBjaGFydHM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgcmF3RGF0YTogW10gYXMgc3RyaW5nW11cbiAgICB9O1xuICAgIFxuICAgIC8vIOOCueOCr+ODquODvOODs+OCt+ODp+ODg+ODiOOBruWPjumbhlxuICAgIGlmICh0aGlzLmNvbmZpZy5pbmNsdWRlU2NyZWVuc2hvdHMpIHtcbiAgICAgIGF0dGFjaG1lbnRzLnNjcmVlbnNob3RzID0gYXdhaXQgdGhpcy5jb2xsZWN0U2NyZWVuc2hvdHModGVzdFJlc3VsdHMpO1xuICAgIH1cbiAgICBcbiAgICAvLyDjg63jgrDjg5XjgqHjgqTjg6vjga7lj47pm4ZcbiAgICBpZiAodGhpcy5jb25maWcuaW5jbHVkZURldGFpbGVkTG9ncykge1xuICAgICAgYXR0YWNobWVudHMubG9ncyA9IGF3YWl0IHRoaXMuY29sbGVjdExvZ0ZpbGVzKHRlc3RSZXN1bHRzKTtcbiAgICB9XG4gICAgXG4gICAgLy8g44OB44Oj44O844OI44Gu55Sf5oiQXG4gICAgaWYgKHRoaXMuY29uZmlnLmluY2x1ZGVQZXJmb3JtYW5jZUNoYXJ0cykge1xuICAgICAgYXR0YWNobWVudHMuY2hhcnRzID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUNoYXJ0cyh0ZXN0UmVzdWx0cyk7XG4gICAgfVxuICAgIFxuICAgIC8vIOeUn+ODh+ODvOOCv+OBruS/neWtmFxuICAgIGF0dGFjaG1lbnRzLnJhd0RhdGEgPSBhd2FpdCB0aGlzLnNhdmVSYXdEYXRhKHRlc3RSZXN1bHRzKTtcbiAgICBcbiAgICByZXR1cm4gYXR0YWNobWVudHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDjgrnjgq/jg6rjg7zjg7Pjgrfjg6fjg4Pjg4jjga7lj47pm4ZcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgY29sbGVjdFNjcmVlbnNob3RzKHRlc3RSZXN1bHRzOiBhbnkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgLy8g44K544Kv44Oq44O844Oz44K344On44OD44OI44OV44Kh44Kk44Or44Gu5Y+O6ZuG44Ot44K444OD44KvXG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIFxuICAvKipcbiAgICog44Ot44Kw44OV44Kh44Kk44Or44Gu5Y+O6ZuGXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGNvbGxlY3RMb2dGaWxlcyh0ZXN0UmVzdWx0czogYW55KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIC8vIOODreOCsOODleOCoeOCpOODq+OBruWPjumbhuODreOCuOODg+OCr1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODgeODo+ODvOODiOOBrueUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUNoYXJ0cyh0ZXN0UmVzdWx0czogYW55KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIC8vIOODkeODleOCqeODvOODnuODs+OCueODgeODo+ODvOODiOOBrueUn+aIkOODreOCuOODg+OCr1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOeUn+ODh+ODvOOCv+OBruS/neWtmFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzYXZlUmF3RGF0YSh0ZXN0UmVzdWx0czogYW55KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHJhd0RhdGFQYXRoID0gcGF0aC5qb2luKHRoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeSwgJ3Jhdy1kYXRhLmpzb24nKTtcbiAgICBcbiAgICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUoXG4gICAgICByYXdEYXRhUGF0aCxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHRlc3RSZXN1bHRzLCBudWxsLCAyKSxcbiAgICAgICd1dGY4J1xuICAgICk7XG4gICAgXG4gICAgcmV0dXJuIFtyYXdEYXRhUGF0aF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiDlvaLlvI/liKXjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVGb3JtYXRTcGVjaWZpY1JlcG9ydChcbiAgICByZXBvcnREYXRhOiBJbnRlZ3JhdGlvblJlcG9ydERhdGEsXG4gICAgZm9ybWF0OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdlbmVyYXRlSnNvblJlcG9ydChyZXBvcnREYXRhKTtcbiAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZW5lcmF0ZUh0bWxSZXBvcnQocmVwb3J0RGF0YSk7XG4gICAgICBjYXNlICdwZGYnOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZW5lcmF0ZVBkZlJlcG9ydChyZXBvcnREYXRhKTtcbiAgICAgIGNhc2UgJ2Nzdic6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdlbmVyYXRlQ3N2UmVwb3J0KHJlcG9ydERhdGEpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmnKrlr77lv5zjga7jg6zjg53jg7zjg4jlvaLlvI86ICR7Zm9ybWF0fWApO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEpTT07jg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVKc29uUmVwb3J0KHJlcG9ydERhdGE6IEludGVncmF0aW9uUmVwb3J0RGF0YSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oXG4gICAgICB0aGlzLmNvbmZpZy5vdXRwdXREaXJlY3RvcnksXG4gICAgICBgaW50ZWdyYXRpb24tcmVwb3J0LSR7cmVwb3J0RGF0YS5tZXRhZGF0YS5yZXBvcnRJZH0uanNvbmBcbiAgICApO1xuICAgIFxuICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShcbiAgICAgIGZpbGVQYXRoLFxuICAgICAgSlNPTi5zdHJpbmdpZnkocmVwb3J0RGF0YSwgbnVsbCwgMiksXG4gICAgICAndXRmOCdcbiAgICApO1xuICAgIFxuICAgIHJldHVybiBmaWxlUGF0aDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEhUTUzjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVIdG1sUmVwb3J0KHJlcG9ydERhdGE6IEludGVncmF0aW9uUmVwb3J0RGF0YSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oXG4gICAgICB0aGlzLmNvbmZpZy5vdXRwdXREaXJlY3RvcnksXG4gICAgICBgaW50ZWdyYXRpb24tcmVwb3J0LSR7cmVwb3J0RGF0YS5tZXRhZGF0YS5yZXBvcnRJZH0uaHRtbGBcbiAgICApO1xuICAgIFxuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gdGhpcy5idWlsZEh0bWxDb250ZW50KHJlcG9ydERhdGEpO1xuICAgIFxuICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShmaWxlUGF0aCwgaHRtbENvbnRlbnQsICd1dGY4Jyk7XG4gICAgXG4gICAgcmV0dXJuIGZpbGVQYXRoO1xuICB9XG4gIFxuICAvKipcbiAgICogSFRNTOOCs+ODs+ODhuODs+ODhOOBruani+eviVxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZEh0bWxDb250ZW50KHJlcG9ydERhdGE6IEludGVncmF0aW9uUmVwb3J0RGF0YSk6IHN0cmluZyB7XG4gICAgY29uc3QgYnJhbmRpbmcgPSB0aGlzLmNvbmZpZy5jdXN0b21CcmFuZGluZyB8fCB7XG4gICAgICBjb21wYW55TmFtZTogJ1Rlc3QgQ29tcGFueScsXG4gICAgICByZXBvcnRUaXRsZTogJ+e1seWQiOODhuOCueODiOODrOODneODvOODiCcsXG4gICAgICBwcmltYXJ5Q29sb3I6ICcjMDA3YmZmJyxcbiAgICAgIHNlY29uZGFyeUNvbG9yOiAnIzZjNzU3ZCdcbiAgICB9O1xuICAgIFxuICAgIHJldHVybiBgXG48IURPQ1RZUEUgaHRtbD5cbjxodG1sIGxhbmc9XCJqYVwiPlxuPGhlYWQ+XG4gICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIj5cbiAgICA8dGl0bGU+JHticmFuZGluZy5yZXBvcnRUaXRsZX08L3RpdGxlPlxuICAgIDxzdHlsZT5cbiAgICAgICAgYm9keSB7XG4gICAgICAgICAgICBmb250LWZhbWlseTogJ1NlZ29lIFVJJywgVGFob21hLCBHZW5ldmEsIFZlcmRhbmEsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y4ZjlmYTtcbiAgICAgICAgICAgIGNvbG9yOiAjMzMzO1xuICAgICAgICB9XG4gICAgICAgIC5oZWFkZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgJHticmFuZGluZy5wcmltYXJ5Q29sb3J9LCAke2JyYW5kaW5nLnNlY29uZGFyeUNvbG9yfSk7XG4gICAgICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgICAgICBwYWRkaW5nOiAzMHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDMwcHg7XG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgIH1cbiAgICAgICAgLmhlYWRlciBoMSB7XG4gICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICBmb250LXNpemU6IDIuNWVtO1xuICAgICAgICB9XG4gICAgICAgIC5oZWFkZXIgcCB7XG4gICAgICAgICAgICBtYXJnaW46IDEwcHggMCAwIDA7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjk7XG4gICAgICAgIH1cbiAgICAgICAgLnN1bW1hcnktY2FyZHMge1xuICAgICAgICAgICAgZGlzcGxheTogZ3JpZDtcbiAgICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgoMjUwcHgsIDFmcikpO1xuICAgICAgICAgICAgZ2FwOiAyMHB4O1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMzBweDtcbiAgICAgICAgfVxuICAgICAgICAuY2FyZCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAycHggMTBweCByZ2JhKDAsMCwwLDAuMSk7XG4gICAgICAgICAgICBib3JkZXItbGVmdDogNHB4IHNvbGlkICR7YnJhbmRpbmcucHJpbWFyeUNvbG9yfTtcbiAgICAgICAgfVxuICAgICAgICAuY2FyZCBoMyB7XG4gICAgICAgICAgICBtYXJnaW46IDAgMCAxMHB4IDA7XG4gICAgICAgICAgICBjb2xvcjogJHticmFuZGluZy5wcmltYXJ5Q29sb3J9O1xuICAgICAgICB9XG4gICAgICAgIC5tZXRyaWMge1xuICAgICAgICAgICAgZm9udC1zaXplOiAyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICAgIGNvbG9yOiAjMzMzO1xuICAgICAgICB9XG4gICAgICAgIC5zdGF0dXMtcGFzcyB7IGNvbG9yOiAjMjhhNzQ1OyB9XG4gICAgICAgIC5zdGF0dXMtZmFpbCB7IGNvbG9yOiAjZGMzNTQ1OyB9XG4gICAgICAgIC5zdGF0dXMtd2FybmluZyB7IGNvbG9yOiAjZmZjMTA3OyB9XG4gICAgICAgIC5zZWN0aW9uIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMzBweDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAycHggMTBweCByZ2JhKDAsMCwwLDAuMSk7XG4gICAgICAgIH1cbiAgICAgICAgLnNlY3Rpb24taGVhZGVyIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICR7YnJhbmRpbmcucHJpbWFyeUNvbG9yfTtcbiAgICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDE1cHggMjBweDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMS4yZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgfVxuICAgICAgICAuc2VjdGlvbi1jb250ZW50IHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgIH1cbiAgICAgICAgLm1vZHVsZS1ncmlkIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpdCwgbWlubWF4KDMwMHB4LCAxZnIpKTtcbiAgICAgICAgICAgIGdhcDogMjBweDtcbiAgICAgICAgfVxuICAgICAgICAubW9kdWxlLWNhcmQge1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2RlZTJlNjtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDE1cHg7XG4gICAgICAgIH1cbiAgICAgICAgLm1vZHVsZS1oZWFkZXIge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogYmV0d2VlbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuICAgICAgICB9XG4gICAgICAgIC5tb2R1bGUtbmFtZSB7XG4gICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMS4xZW07XG4gICAgICAgIH1cbiAgICAgICAgLm1vZHVsZS1zdGF0dXMge1xuICAgICAgICAgICAgcGFkZGluZzogNHB4IDhweDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMC44ZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgfVxuICAgICAgICAucmVjb21tZW5kYXRpb25zIHtcbiAgICAgICAgICAgIGxpc3Qtc3R5bGU6IG5vbmU7XG4gICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICB9XG4gICAgICAgIC5yZWNvbW1lbmRhdGlvbiB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjhmOWZhO1xuICAgICAgICAgICAgbWFyZ2luOiAxMHB4IDA7XG4gICAgICAgICAgICBwYWRkaW5nOiAxNXB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICAgICAgYm9yZGVyLWxlZnQ6IDRweCBzb2xpZCAjMDA3YmZmO1xuICAgICAgICB9XG4gICAgICAgIC5yZWNvbW1lbmRhdGlvbi5oaWdoIHsgYm9yZGVyLWxlZnQtY29sb3I6ICNkYzM1NDU7IH1cbiAgICAgICAgLnJlY29tbWVuZGF0aW9uLm1lZGl1bSB7IGJvcmRlci1sZWZ0LWNvbG9yOiAjZmZjMTA3OyB9XG4gICAgICAgIC5yZWNvbW1lbmRhdGlvbi5sb3cgeyBib3JkZXItbGVmdC1jb2xvcjogIzI4YTc0NTsgfVxuICAgICAgICAuZm9vdGVyIHtcbiAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDUwcHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgY29sb3I6ICM2Yzc1N2Q7XG4gICAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgI2RlZTJlNjtcbiAgICAgICAgfVxuICAgIDwvc3R5bGU+XG48L2hlYWQ+XG48Ym9keT5cbiAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgIDxoMT4ke2JyYW5kaW5nLnJlcG9ydFRpdGxlfTwvaDE+XG4gICAgICAgIDxwPiR7YnJhbmRpbmcuY29tcGFueU5hbWV9PC9wPlxuICAgICAgICA8cD7nlJ/miJDml6XmmYI6ICR7bmV3IERhdGUocmVwb3J0RGF0YS5tZXRhZGF0YS5nZW5lcmF0ZWRBdCkudG9Mb2NhbGVTdHJpbmcoJ2phLUpQJyl9PC9wPlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cInN1bW1hcnktY2FyZHNcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNhcmRcIj5cbiAgICAgICAgICAgIDxoMz7lhajkvZPjgrnjg4bjg7zjgr/jgrk8L2gzPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1ldHJpYyBzdGF0dXMtJHtyZXBvcnREYXRhLmV4ZWN1dGl2ZVN1bW1hcnkub3ZlcmFsbFN0YXR1cy50b0xvd2VyQ2FzZSgpfVwiPlxuICAgICAgICAgICAgICAgICR7cmVwb3J0RGF0YS5leGVjdXRpdmVTdW1tYXJ5Lm92ZXJhbGxTdGF0dXN9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkXCI+XG4gICAgICAgICAgICA8aDM+5ZOB6LOq44K544Kz44KiPC9oMz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZXRyaWNcIj4ke3JlcG9ydERhdGEuZXhlY3V0aXZlU3VtbWFyeS5xdWFsaXR5U2NvcmUudG9GaXhlZCgxKX0lPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZFwiPlxuICAgICAgICAgICAgPGgzPuODhuOCueODiOWQiOagvOeOhzwvaDM+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWV0cmljXCI+JHtyZXBvcnREYXRhLmV4ZWN1dGl2ZVN1bW1hcnkua2V5TWV0cmljcy5wYXNzUmF0ZS50b0ZpeGVkKDEpfSU8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkXCI+XG4gICAgICAgICAgICA8aDM+5bmz5Z2H5b+c562U5pmC6ZaTPC9oMz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZXRyaWNcIj4ke3JlcG9ydERhdGEuZXhlY3V0aXZlU3VtbWFyeS5rZXlNZXRyaWNzLmF2ZXJhZ2VSZXNwb25zZVRpbWV9bXM8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8ZGl2IGNsYXNzPVwic2VjdGlvblwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic2VjdGlvbi1oZWFkZXJcIj7jg6Ljgrjjg6Xjg7zjg6vliKXntZDmnpw8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNlY3Rpb24tY29udGVudFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZHVsZS1ncmlkXCI+XG4gICAgICAgICAgICAgICAgJHtPYmplY3QuZW50cmllcyhyZXBvcnREYXRhLm1vZHVsZVJlc3VsdHMpLm1hcCgoW25hbWUsIHJlc3VsdF0pID0+IGBcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZHVsZS1jYXJkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kdWxlLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibW9kdWxlLW5hbWVcIj4ke25hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibW9kdWxlLXN0YXR1cyBzdGF0dXMtJHtyZXN1bHQuc3RhdHVzLnRvTG93ZXJDYXNlKCl9XCI+JHtyZXN1bHQuc3RhdHVzfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+5a6f6KGM5pmC6ZaTOiAke3Jlc3VsdC5leGVjdXRpb25UaW1lfW1zPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+44OG44K544OI5pWwOiAke3Jlc3VsdC50ZXN0Q291bnR9ICjmiJDlip86ICR7cmVzdWx0LnBhc3NDb3VudH0sIOWkseaVlzogJHtyZXN1bHQuZmFpbENvdW50fSk8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD7jgqvjg5Djg6zjg4Pjgrg6ICR7cmVzdWx0LmNvdmVyYWdlfSU8L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIGApLmpvaW4oJycpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cInNlY3Rpb25cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNlY3Rpb24taGVhZGVyXCI+5o6o5aWo5LqL6aCFPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzZWN0aW9uLWNvbnRlbnRcIj5cbiAgICAgICAgICAgIDxoND7ljbPluqflr77lv5zjgYzlv4XopoE8L2g0PlxuICAgICAgICAgICAgPHVsIGNsYXNzPVwicmVjb21tZW5kYXRpb25zXCI+XG4gICAgICAgICAgICAgICAgJHtyZXBvcnREYXRhLnJlY29tbWVuZGF0aW9ucy5pbW1lZGlhdGUubWFwKHJlYyA9PiBgXG4gICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cInJlY29tbWVuZGF0aW9uICR7cmVjLnByaW9yaXR5LnRvTG93ZXJDYXNlKCl9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3Ryb25nPiR7cmVjLnRpdGxlfTwvc3Ryb25nPjxicj5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7cmVjLmRlc2NyaXB0aW9ufTxicj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzbWFsbD7lvbHpn786ICR7cmVjLmltcGFjdH0gfCDlt6XmlbA6ICR7cmVjLmVmZm9ydH0gfCDmnJ/pmZA6ICR7cmVjLnRpbWVsaW5lfTwvc21hbGw+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgYCkuam9pbignJyl9XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgPHA+44GT44Gu44Os44Od44O844OI44Gv57Wx5ZCI44OG44K544OI44K544Kk44O844OIIHYke3JlcG9ydERhdGEubWV0YWRhdGEudGVzdFN1aXRlVmVyc2lvbn0g44Gr44KI44KK55Sf5oiQ44GV44KM44G+44GX44GfPC9wPlxuICAgICAgICA8cD7jg6zjg53jg7zjg4hJRDogJHtyZXBvcnREYXRhLm1ldGFkYXRhLnJlcG9ydElkfTwvcD5cbiAgICA8L2Rpdj5cbjwvYm9keT5cbjwvaHRtbD5gO1xuICB9XG4gIFxuICAvKipcbiAgICogUERG44Os44Od44O844OI44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlUGRmUmVwb3J0KHJlcG9ydERhdGE6IEludGVncmF0aW9uUmVwb3J0RGF0YSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgLy8gUERG55Sf5oiQ44Op44Kk44OW44Op44Oq77yIcHVwcGV0ZWVy562J77yJ44KS5L2/55So44GX44GmSFRNTOOBi+OCiVBERuOCkueUn+aIkFxuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gdGhpcy5idWlsZEh0bWxDb250ZW50KHJlcG9ydERhdGEpO1xuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKFxuICAgICAgdGhpcy5jb25maWcub3V0cHV0RGlyZWN0b3J5LFxuICAgICAgYGludGVncmF0aW9uLXJlcG9ydC0ke3JlcG9ydERhdGEubWV0YWRhdGEucmVwb3J0SWR9LnBkZmBcbiAgICApO1xuICAgIFxuICAgIC8vIOWun+mam+OBrlBERueUn+aIkOOBr+WklumDqOODqeOCpOODluODqeODquOBq+S+neWtmFxuICAgIC8vIOOBk+OBk+OBp+OBr+ODl+ODrOODvOOCueODm+ODq+ODgOODvOOBqOOBl+OBpkhUTUzjg5XjgqHjgqTjg6vjgpLkv53lrZhcbiAgICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUoXG4gICAgICBmaWxlUGF0aC5yZXBsYWNlKCcucGRmJywgJy5odG1sJyksXG4gICAgICBodG1sQ29udGVudCxcbiAgICAgICd1dGY4J1xuICAgICk7XG4gICAgXG4gICAgcmV0dXJuIGZpbGVQYXRoO1xuICB9XG4gIFxuICAvKipcbiAgICogQ1NW44Os44Od44O844OI44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQ3N2UmVwb3J0KHJlcG9ydERhdGE6IEludGVncmF0aW9uUmVwb3J0RGF0YSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oXG4gICAgICB0aGlzLmNvbmZpZy5vdXRwdXREaXJlY3RvcnksXG4gICAgICBgaW50ZWdyYXRpb24tcmVwb3J0LSR7cmVwb3J0RGF0YS5tZXRhZGF0YS5yZXBvcnRJZH0uY3N2YFxuICAgICk7XG4gICAgXG4gICAgY29uc3QgY3N2Q29udGVudCA9IHRoaXMuYnVpbGRDc3ZDb250ZW50KHJlcG9ydERhdGEpO1xuICAgIFxuICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShmaWxlUGF0aCwgY3N2Q29udGVudCwgJ3V0ZjgnKTtcbiAgICBcbiAgICByZXR1cm4gZmlsZVBhdGg7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDU1bjgrPjg7Pjg4bjg7Pjg4Tjga7mp4vnr4lcbiAgICovXG4gIHByaXZhdGUgYnVpbGRDc3ZDb250ZW50KHJlcG9ydERhdGE6IEludGVncmF0aW9uUmVwb3J0RGF0YSk6IHN0cmluZyB7XG4gICAgY29uc3Qgcm93cyA9IFtcbiAgICAgIFsn44Oi44K444Ol44O844Or5ZCNJywgJ+OCueODhuODvOOCv+OCuScsICflrp/ooYzmmYLplpMobXMpJywgJ+ODhuOCueODiOaVsCcsICfmiJDlip/mlbAnLCAn5aSx5pWX5pWwJywgJ+OCq+ODkOODrOODg+OCuCglKSddXG4gICAgXTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IFtuYW1lLCByZXN1bHRdIG9mIE9iamVjdC5lbnRyaWVzKHJlcG9ydERhdGEubW9kdWxlUmVzdWx0cykpIHtcbiAgICAgIHJvd3MucHVzaChbXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHJlc3VsdC5zdGF0dXMsXG4gICAgICAgIHJlc3VsdC5leGVjdXRpb25UaW1lLnRvU3RyaW5nKCksXG4gICAgICAgIHJlc3VsdC50ZXN0Q291bnQudG9TdHJpbmcoKSxcbiAgICAgICAgcmVzdWx0LnBhc3NDb3VudC50b1N0cmluZygpLFxuICAgICAgICByZXN1bHQuZmFpbENvdW50LnRvU3RyaW5nKCksXG4gICAgICAgIHJlc3VsdC5jb3ZlcmFnZS50b1N0cmluZygpXG4gICAgICBdKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJvd3MubWFwKHJvdyA9PiByb3cuam9pbignLCcpKS5qb2luKCdcXG4nKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIOODrOODneODvOODiElE44Gu55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlUmVwb3J0SWQoKTogc3RyaW5nIHtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpO1xuICAgIGNvbnN0IHJhbmRvbSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA4KTtcbiAgICByZXR1cm4gYCR7dGltZXN0YW1wfS0ke3JhbmRvbX1gO1xuICB9XG4gIFxuICAvKipcbiAgICog5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu56K65L+dXG4gICAqL1xuICBwcml2YXRlIGVuc3VyZU91dHB1dERpcmVjdG9yeSgpOiB2b2lkIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmModGhpcy5jb25maWcub3V0cHV0RGlyZWN0b3J5KSkge1xuICAgICAgZnMubWtkaXJTeW5jKHRoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgfVxuICB9XG59XG5cbi8vIOODh+ODleOCqeODq+ODiOioreWumlxuZXhwb3J0IGNvbnN0IERlZmF1bHRSZXBvcnRDb25maWc6IFJlcG9ydENvbmZpZyA9IHtcbiAgb3V0cHV0RGlyZWN0b3J5OiAnLi90ZXN0LXJlcG9ydHMnLFxuICBmb3JtYXRzOiBbJ2pzb24nLCAnaHRtbCddLFxuICBpbmNsdWRlU2NyZWVuc2hvdHM6IHRydWUsXG4gIGluY2x1ZGVEZXRhaWxlZExvZ3M6IHRydWUsXG4gIGluY2x1ZGVQZXJmb3JtYW5jZUNoYXJ0czogdHJ1ZSxcbiAgaW5jbHVkZVNlY3VyaXR5QW5hbHlzaXM6IHRydWUsXG4gIGdlbmVyYXRlRXhlY3V0aXZlU3VtbWFyeTogdHJ1ZSxcbiAgY3VzdG9tQnJhbmRpbmc6IHtcbiAgICBjb21wYW55TmFtZTogJ05ldEFwcCBKYXBhbicsXG4gICAgcmVwb3J0VGl0bGU6ICdQZXJtaXNzaW9uLWF3YXJlIFJBRyBTeXN0ZW0g57Wx5ZCI44OG44K544OI44Os44Od44O844OIJyxcbiAgICBwcmltYXJ5Q29sb3I6ICcjMDA2N0M1JyxcbiAgICBzZWNvbmRhcnlDb2xvcjogJyMwMEExQzknXG4gIH1cbn07Il19