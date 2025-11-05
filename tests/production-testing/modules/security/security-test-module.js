"use strict";
/**
 * セキュリティテストモジュール
 *
 * 実本番環境でのセキュリティテスト機能を提供
 * HTTPS暗号化、攻撃耐性、セキュリティ監視のテストを実行
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityTestModule = void 0;
const production_test_engine_1 = require("../../core/production-test-engine");
const security_config_1 = require("./security-config");
const https = __importStar(require("https"));
const tls = __importStar(require("tls"));
const axios_1 = __importDefault(require("axios"));
/**
 * セキュリティテストモジュールクラス
 */
class SecurityTestModule {
    config;
    testEngine;
    securityConfig;
    constructor(config, testEngine) {
        this.config = config;
        this.testEngine = testEngine;
        this.securityConfig = security_config_1.productionSecurityConfig;
    }
    /**
     * セキュリティテストの初期化
     */
    async initialize() {
        console.log('🔒 セキュリティテストモジュールを初期化中...');
        try {
            // テストエンジンの初期化確認
            if (!this.testEngine.isInitialized()) {
                throw new Error('テストエンジンが初期化されていません');
            }
            // セキュリティ設定の検証
            await this.validateSecurityConfiguration();
            // 本番環境接続の確認
            await this.verifyProductionConnectivity();
            console.log('✅ セキュリティテストモジュール初期化完了');
        }
        catch (error) {
            console.error('❌ セキュリティテストモジュール初期化エラー:', error);
            throw error;
        }
    }
    /**
     * セキュリティテストの実行
     */
    async runSecurityTests() {
        console.log('🚀 セキュリティテスト実行開始...');
        const startTime = Date.now();
        const testResults = new Map();
        let overallSuccess = true;
        const errors = [];
        try {
            // 1. HTTPS暗号化テスト
            console.log('🔐 HTTPS暗号化テスト実行中...');
            const httpsResults = await this.runHttpsEncryptionTests();
            testResults.set('https_encryption', httpsResults);
            if (!httpsResults.success) {
                overallSuccess = false;
                errors.push('HTTPS暗号化テストに失敗しました');
            }
            // 2. 攻撃耐性テスト
            console.log('🛡️ 攻撃耐性テスト実行中...');
            const attackResults = await this.runAttackResistanceTests();
            testResults.set('attack_resistance', attackResults);
            if (!attackResults.success) {
                overallSuccess = false;
                errors.push('攻撃耐性テストに失敗しました');
            }
            // 3. セキュリティ監視テスト
            console.log('👁️ セキュリティ監視テスト実行中...');
            const monitoringResults = await this.runSecurityMonitoringTests();
            testResults.set('security_monitoring', monitoringResults);
            if (!monitoringResults.success) {
                overallSuccess = false;
                errors.push('セキュリティ監視テストに失敗しました');
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            // セキュリティメトリクスの計算
            const securityMetrics = this.calculateSecurityMetrics(testResults);
            const result = {
                testId: `security-test-${Date.now()}`,
                testName: 'セキュリティテスト',
                status: overallSuccess ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                success: overallSuccess,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration,
                results: testResults,
                securityMetrics,
                detailedResults: {
                    httpsEncryption: testResults.get('https_encryption')?.details,
                    attackResistance: testResults.get('attack_resistance')?.details,
                    securityMonitoring: testResults.get('security_monitoring')?.details
                },
                errors: errors.length > 0 ? errors : undefined
            };
            console.log('📊 セキュリティテスト完了:');
            console.log(`   セキュリティスコア: ${(securityMetrics.securityScore * 100).toFixed(1)}%`);
            console.log(`   HTTPS準拠: ${securityMetrics.httpsCompliance ? '✓' : '✗'}`);
            console.log(`   証明書有効: ${securityMetrics.certificateValid ? '✓' : '✗'}`);
            console.log(`   WAF保護: ${securityMetrics.wafProtectionActive ? '✓' : '✗'}`);
            console.log(`   ブロック攻撃数: ${securityMetrics.attacksBlocked}`);
            console.log(`   脆弱性発見数: ${securityMetrics.vulnerabilitiesFound}`);
            return result;
        }
        catch (error) {
            console.error('❌ セキュリティテスト実行エラー:', error);
            const endTime = Date.now();
            return {
                testId: `security-test-${Date.now()}`,
                testName: 'セキュリティテスト',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                success: false,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration: endTime - startTime,
                results: testResults,
                securityMetrics: {
                    httpsCompliance: false,
                    certificateValid: false,
                    securityHeadersPresent: false,
                    wafProtectionActive: false,
                    attacksBlocked: 0,
                    vulnerabilitiesFound: 0,
                    securityScore: 0
                },
                detailedResults: {},
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }
    /**
       * HTTPS暗号化テストの実行
       */
    async runHttpsEncryptionTests() {
        const httpsConfig = this.securityConfig.httpsEncryption;
        const results = new Map();
        let overallSuccess = true;
        try {
            // 1. HTTPS リダイレクトテスト
            const redirectResult = await this.testHttpsRedirect(httpsConfig);
            results.set('https_redirect', redirectResult);
            if (!redirectResult.success)
                overallSuccess = false;
            // 2. TLS証明書検証テスト
            const certificateResult = await this.testTlsCertificate(httpsConfig);
            results.set('tls_certificate', certificateResult);
            if (!certificateResult.success)
                overallSuccess = false;
            // 3. セキュリティヘッダーテスト
            const headersResult = await this.testSecurityHeaders(httpsConfig);
            results.set('security_headers', headersResult);
            if (!headersResult.success)
                overallSuccess = false;
            // 4. 暗号化プロトコルテスト
            const protocolResult = await this.testEncryptionProtocols(httpsConfig);
            results.set('encryption_protocols', protocolResult);
            if (!protocolResult.success)
                overallSuccess = false;
            return {
                success: overallSuccess,
                details: results,
                summary: {
                    totalTests: results.size,
                    passedTests: Array.from(results.values()).filter(r => r.success).length,
                    failedTests: Array.from(results.values()).filter(r => !r.success).length
                }
            };
        }
        catch (error) {
            console.error('HTTPS暗号化テストエラー:', error);
            return {
                success: false,
                details: results,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 攻撃耐性テストの実行
     */
    async runAttackResistanceTests() {
        const attackConfig = this.securityConfig.attackResistance;
        const results = new Map();
        let overallSuccess = true;
        let attacksBlocked = 0;
        try {
            // 1. SQLインジェクション攻撃テスト
            if (attackConfig.sqlInjectionTests.enabled) {
                const sqlResult = await this.testSqlInjectionProtection(attackConfig);
                results.set('sql_injection_protection', sqlResult);
                if (!sqlResult.success)
                    overallSuccess = false;
                attacksBlocked += sqlResult.blockedAttacks || 0;
            }
            // 2. XSS攻撃テスト
            if (attackConfig.xssTests.enabled) {
                const xssResult = await this.testXssProtection(attackConfig);
                results.set('xss_protection', xssResult);
                if (!xssResult.success)
                    overallSuccess = false;
                attacksBlocked += xssResult.blockedAttacks || 0;
            }
            // 3. 不正APIアクセステスト
            if (attackConfig.unauthorizedApiTests.enabled) {
                const apiResult = await this.testUnauthorizedApiAccess(attackConfig);
                results.set('unauthorized_api_access', apiResult);
                if (!apiResult.success)
                    overallSuccess = false;
            }
            // 4. セッションハイジャック攻撃テスト
            if (attackConfig.sessionHijackingTests.enabled) {
                const sessionResult = await this.testSessionHijackingProtection(attackConfig);
                results.set('session_hijacking_protection', sessionResult);
                if (!sessionResult.success)
                    overallSuccess = false;
            }
            // 5. レート制限テスト
            if (attackConfig.rateLimitTests.enabled) {
                const rateLimitResult = await this.testRateLimit(attackConfig);
                results.set('rate_limit', rateLimitResult);
                if (!rateLimitResult.success)
                    overallSuccess = false;
            }
            return {
                success: overallSuccess,
                details: results,
                attacksBlocked,
                summary: {
                    totalTests: results.size,
                    passedTests: Array.from(results.values()).filter(r => r.success).length,
                    failedTests: Array.from(results.values()).filter(r => !r.success).length,
                    totalAttacksBlocked: attacksBlocked
                }
            };
        }
        catch (error) {
            console.error('攻撃耐性テストエラー:', error);
            return {
                success: false,
                details: results,
                attacksBlocked,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * セキュリティ監視テストの実行
     */
    async runSecurityMonitoringTests() {
        const monitoringConfig = this.securityConfig.securityMonitoring;
        const results = new Map();
        let overallSuccess = true;
        try {
            // 1. CloudTrailログ記録テスト
            const cloudTrailResult = await this.testCloudTrailLogging(monitoringConfig);
            results.set('cloudtrail_logging', cloudTrailResult);
            if (!cloudTrailResult.success)
                overallSuccess = false;
            // 2. 異常アクセスパターン検出テスト
            if (monitoringConfig.anomalyDetection.enabled) {
                const anomalyResult = await this.testAnomalyDetection(monitoringConfig);
                results.set('anomaly_detection', anomalyResult);
                if (!anomalyResult.success)
                    overallSuccess = false;
            }
            // 3. セキュリティアラートテスト
            if (monitoringConfig.securityAlerts.enabled) {
                const alertResult = await this.testSecurityAlerts(monitoringConfig);
                results.set('security_alerts', alertResult);
                if (!alertResult.success)
                    overallSuccess = false;
            }
            // 4. ログ分析テスト
            if (monitoringConfig.logAnalysis.enabled) {
                const logAnalysisResult = await this.testLogAnalysis(monitoringConfig);
                results.set('log_analysis', logAnalysisResult);
                if (!logAnalysisResult.success)
                    overallSuccess = false;
            }
            return {
                success: overallSuccess,
                details: results,
                summary: {
                    totalTests: results.size,
                    passedTests: Array.from(results.values()).filter(r => r.success).length,
                    failedTests: Array.from(results.values()).filter(r => !r.success).length
                }
            };
        }
        catch (error) {
            console.error('セキュリティ監視テストエラー:', error);
            return {
                success: false,
                details: results,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * HTTPSリダイレクトテスト
     */
    async testHttpsRedirect(config) {
        const results = [];
        for (const endpoint of config.testEndpoints) {
            try {
                const httpUrl = `http://${config.cloudFrontDistribution.domainName}${endpoint}`;
                const response = await axios_1.default.get(httpUrl, {
                    maxRedirects: 0,
                    validateStatus: (status) => status >= 200 && status < 400
                });
                const isRedirect = response.status >= 300 && response.status < 400;
                const locationHeader = response.headers.location;
                const isHttpsRedirect = locationHeader && locationHeader.startsWith('https://');
                results.push({
                    endpoint,
                    httpUrl,
                    status: response.status,
                    isRedirect,
                    isHttpsRedirect,
                    locationHeader,
                    success: isRedirect && isHttpsRedirect
                });
            }
            catch (error) {
                results.push({
                    endpoint,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        const successCount = results.filter(r => r.success).length;
        return {
            success: successCount === results.length,
            results,
            summary: {
                totalEndpoints: results.length,
                successfulRedirects: successCount,
                failedRedirects: results.length - successCount
            }
        };
    }
    /**
     * TLS証明書検証テスト
     */
    async testTlsCertificate(config) {
        return new Promise((resolve) => {
            const options = {
                host: config.cloudFrontDistribution.domainName,
                port: 443,
                method: 'GET',
                path: '/',
                rejectUnauthorized: true
            };
            const req = https.request(options, (res) => {
                const cert = res.socket.getPeerCertificate();
                const now = new Date();
                const validFrom = new Date(cert.valid_from);
                const validTo = new Date(cert.valid_to);
                const isValid = now >= validFrom && now <= validTo;
                const subjectMatches = cert.subject.CN === config.tlsCertificate.expectedSubject ||
                    cert.subjectaltname?.includes(config.cloudFrontDistribution.domainName);
                resolve({
                    success: isValid && subjectMatches,
                    certificate: {
                        subject: cert.subject,
                        issuer: cert.issuer,
                        validFrom: cert.valid_from,
                        validTo: cert.valid_to,
                        fingerprint: cert.fingerprint,
                        serialNumber: cert.serialNumber,
                        subjectAltName: cert.subjectaltname
                    },
                    validation: {
                        isValid,
                        subjectMatches,
                        daysUntilExpiry: Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    }
                });
            });
            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
            req.end();
        });
    }
    /**
     * セキュリティヘッダーテスト
     */
    async testSecurityHeaders(config) {
        const results = [];
        for (const endpoint of config.testEndpoints) {
            try {
                const url = `https://${config.cloudFrontDistribution.domainName}${endpoint}`;
                const response = await axios_1.default.get(url);
                const headers = response.headers;
                const headerChecks = {
                    strictTransportSecurity: {
                        present: !!headers['strict-transport-security'],
                        value: headers['strict-transport-security'],
                        expected: config.securityHeaders.strictTransportSecurity.enabled
                    },
                    contentSecurityPolicy: {
                        present: !!headers['content-security-policy'],
                        value: headers['content-security-policy'],
                        expected: config.securityHeaders.contentSecurityPolicy.enabled
                    },
                    xFrameOptions: {
                        present: !!headers['x-frame-options'],
                        value: headers['x-frame-options'],
                        expected: config.securityHeaders.xFrameOptions.enabled
                    },
                    xContentTypeOptions: {
                        present: !!headers['x-content-type-options'],
                        value: headers['x-content-type-options'],
                        expected: config.securityHeaders.xContentTypeOptions.enabled
                    },
                    referrerPolicy: {
                        present: !!headers['referrer-policy'],
                        value: headers['referrer-policy'],
                        expected: config.securityHeaders.referrerPolicy.enabled
                    }
                };
                const allHeadersPresent = Object.values(headerChecks).every(check => !check.expected || check.present);
                results.push({
                    endpoint,
                    url,
                    success: allHeadersPresent,
                    headers: headerChecks
                });
            }
            catch (error) {
                results.push({
                    endpoint,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        const successCount = results.filter(r => r.success).length;
        return {
            success: successCount === results.length,
            results,
            summary: {
                totalEndpoints: results.length,
                endpointsWithAllHeaders: successCount,
                endpointsMissingHeaders: results.length - successCount
            }
        };
    }
    /**
     * 暗号化プロトコルテスト
     */
    async testEncryptionProtocols(config) {
        const results = [];
        for (const protocol of config.tlsCertificate.supportedProtocols) {
            try {
                const options = {
                    host: config.cloudFrontDistribution.domainName,
                    port: 443,
                    secureProtocol: this.mapTlsVersion(protocol)
                };
                const result = await this.testTlsConnection(options);
                results.push({
                    protocol,
                    supported: result.success,
                    details: result
                });
            }
            catch (error) {
                results.push({
                    protocol,
                    supported: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        const supportedCount = results.filter(r => r.supported).length;
        return {
            success: supportedCount > 0,
            results,
            summary: {
                totalProtocols: results.length,
                supportedProtocols: supportedCount,
                unsupportedProtocols: results.length - supportedCount
            }
        };
    }
    /**
     * TLSバージョンのマッピング
     */
    mapTlsVersion(version) {
        const mapping = {
            'TLSv1.2': 'TLSv1_2_method',
            'TLSv1.3': 'TLS_method'
        };
        return mapping[version] || 'TLS_method';
    }
    /**
     * TLS接続テスト
     */
    async testTlsConnection(options) {
        return new Promise((resolve) => {
            const socket = tls.connect(options, () => {
                const protocol = socket.getProtocol();
                const cipher = socket.getCipher();
                resolve({
                    success: true,
                    protocol,
                    cipher,
                    authorized: socket.authorized
                });
                socket.end();
            });
            socket.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
            socket.setTimeout(10000, () => {
                socket.destroy();
                resolve({
                    success: false,
                    error: 'Connection timeout'
                });
            });
        });
    } /**
     
  * SQLインジェクション保護テスト
     */
    async testSqlInjectionProtection(config) {
        const results = [];
        let blockedAttacks = 0;
        for (const endpoint of config.sqlInjectionTests.targetEndpoints) {
            for (const payload of config.sqlInjectionTests.testPayloads) {
                try {
                    const url = `https://${this.securityConfig.httpsEncryption.cloudFrontDistribution.domainName}${endpoint}`;
                    const response = await axios_1.default.post(url, {
                        query: payload,
                        message: payload
                    }, {
                        timeout: 10000,
                        validateStatus: () => true // すべてのステータスコードを受け入れ
                    });
                    const isBlocked = response.status === config.sqlInjectionTests.expectedBlockResponse;
                    if (isBlocked)
                        blockedAttacks++;
                    results.push({
                        endpoint,
                        payload: payload.substring(0, 50) + '...', // ログ用に短縮
                        status: response.status,
                        isBlocked,
                        success: isBlocked
                    });
                    // 攻撃間隔を空ける
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    results.push({
                        endpoint,
                        payload: payload.substring(0, 50) + '...',
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
        }
        const successCount = results.filter(r => r.success).length;
        return {
            success: successCount === results.length,
            results,
            blockedAttacks,
            summary: {
                totalAttempts: results.length,
                blockedAttempts: successCount,
                allowedAttempts: results.length - successCount
            }
        };
    }
    /**
     * XSS保護テスト
     */
    async testXssProtection(config) {
        const results = [];
        let blockedAttacks = 0;
        for (const endpoint of config.xssTests.targetEndpoints) {
            for (const payload of config.xssTests.testPayloads) {
                try {
                    const url = `https://${this.securityConfig.httpsEncryption.cloudFrontDistribution.domainName}${endpoint}`;
                    const response = await axios_1.default.post(url, {
                        content: payload,
                        message: payload
                    }, {
                        timeout: 10000,
                        validateStatus: () => true
                    });
                    const isBlocked = response.status === config.xssTests.expectedBlockResponse;
                    if (isBlocked)
                        blockedAttacks++;
                    results.push({
                        endpoint,
                        payload: payload.substring(0, 50) + '...',
                        status: response.status,
                        isBlocked,
                        success: isBlocked
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    results.push({
                        endpoint,
                        payload: payload.substring(0, 50) + '...',
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
        }
        const successCount = results.filter(r => r.success).length;
        return {
            success: successCount === results.length,
            results,
            blockedAttacks,
            summary: {
                totalAttempts: results.length,
                blockedAttempts: successCount,
                allowedAttempts: results.length - successCount
            }
        };
    }
    /**
     * 不正APIアクセステスト
     */
    async testUnauthorizedApiAccess(config) {
        const results = [];
        for (const endpoint of config.unauthorizedApiTests.testEndpoints) {
            for (const token of config.unauthorizedApiTests.invalidTokens) {
                try {
                    const url = `https://${this.securityConfig.httpsEncryption.cloudFrontDistribution.domainName}${endpoint}`;
                    const headers = {};
                    if (token) {
                        headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                    }
                    const response = await axios_1.default.get(url, {
                        headers,
                        timeout: 10000,
                        validateStatus: () => true
                    });
                    const isRejected = response.status === config.unauthorizedApiTests.expectedResponse;
                    results.push({
                        endpoint,
                        token: token ? 'invalid_token_***' : 'no_token',
                        status: response.status,
                        isRejected,
                        success: isRejected
                    });
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                catch (error) {
                    results.push({
                        endpoint,
                        token: token ? 'invalid_token_***' : 'no_token',
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
        }
        const successCount = results.filter(r => r.success).length;
        return {
            success: successCount === results.length,
            results,
            summary: {
                totalAttempts: results.length,
                rejectedAttempts: successCount,
                allowedAttempts: results.length - successCount
            }
        };
    }
    /**
     * セッションハイジャック保護テスト
     */
    async testSessionHijackingProtection(config) {
        const results = [];
        for (const scenario of config.sessionHijackingTests.testScenarios) {
            for (const tokenPattern of config.sessionHijackingTests.sessionTokenPatterns) {
                try {
                    const url = `https://${this.securityConfig.httpsEncryption.cloudFrontDistribution.domainName}/api/auth/verify`;
                    const response = await axios_1.default.post(url, {
                        sessionToken: tokenPattern,
                        scenario: scenario
                    }, {
                        timeout: 10000,
                        validateStatus: () => true
                    });
                    const isRejected = response.status === 401 || response.status === 403;
                    results.push({
                        scenario,
                        tokenPattern: 'hijacked_token_***',
                        status: response.status,
                        isRejected,
                        success: isRejected
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    results.push({
                        scenario,
                        tokenPattern: 'hijacked_token_***',
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
        }
        const successCount = results.filter(r => r.success).length;
        return {
            success: successCount === results.length,
            results,
            summary: {
                totalAttempts: results.length,
                rejectedAttempts: successCount,
                allowedAttempts: results.length - successCount
            }
        };
    }
    /**
     * レート制限テスト
     */
    async testRateLimit(config) {
        const url = `https://${this.securityConfig.httpsEncryption.cloudFrontDistribution.domainName}/api/health`;
        const results = [];
        let throttledRequests = 0;
        const startTime = Date.now();
        const endTime = startTime + config.rateLimitTests.testDuration;
        console.log(`レート制限テスト開始: ${config.rateLimitTests.requestsPerMinute}req/min で ${config.rateLimitTests.testDuration / 1000}秒間`);
        while (Date.now() < endTime) {
            try {
                const response = await axios_1.default.get(url, {
                    timeout: 5000,
                    validateStatus: () => true
                });
                const isThrottled = response.status === 429 || response.status === 503;
                if (isThrottled)
                    throttledRequests++;
                results.push({
                    timestamp: Date.now(),
                    status: response.status,
                    isThrottled
                });
                // リクエスト間隔の調整（1分間に指定回数のリクエスト）
                const intervalMs = 60000 / config.rateLimitTests.requestsPerMinute;
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
            catch (error) {
                results.push({
                    timestamp: Date.now(),
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        const totalRequests = results.length;
        const successfulRequests = results.filter(r => !r.isThrottled && !r.error).length;
        return {
            success: config.rateLimitTests.expectedThrottling ? throttledRequests > 0 : throttledRequests === 0,
            results: results.slice(-10), // 最後の10件のみ保存
            summary: {
                totalRequests,
                successfulRequests,
                throttledRequests,
                errorRequests: results.filter(r => r.error).length,
                testDuration: config.rateLimitTests.testDuration,
                averageRequestsPerMinute: (totalRequests / (config.rateLimitTests.testDuration / 60000)).toFixed(2)
            }
        };
    }
    /**
     * CloudTrailログ記録テスト
     */
    async testCloudTrailLogging(config) {
        try {
            // CloudTrailの設定確認（読み取り専用）
            const cloudTrailStatus = await this.testEngine.executeAwsCommand('cloudtrail', 'describe-trails', {
                trailNameList: [config.cloudTrail.trailName]
            });
            if (!cloudTrailStatus || cloudTrailStatus.length === 0) {
                return {
                    success: false,
                    error: 'CloudTrailが見つかりません'
                };
            }
            const trail = cloudTrailStatus[0];
            // ログ記録状況の確認
            const loggingStatus = await this.testEngine.executeAwsCommand('cloudtrail', 'get-trail-status', {
                Name: config.cloudTrail.trailName
            });
            return {
                success: loggingStatus.IsLogging,
                trail: {
                    name: trail.Name,
                    s3BucketName: trail.S3BucketName,
                    includeGlobalServiceEvents: trail.IncludeGlobalServiceEvents,
                    isMultiRegionTrail: trail.IsMultiRegionTrail,
                    isLogging: loggingStatus.IsLogging,
                    latestDeliveryTime: loggingStatus.LatestDeliveryTime
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 異常検出テスト
     */
    async testAnomalyDetection(config) {
        try {
            // CloudWatchメトリクスの確認
            const metrics = await this.testEngine.executeAwsCommand('cloudwatch', 'get-metric-statistics', {
                Namespace: 'AWS/CloudFront',
                MetricName: 'Requests',
                Dimensions: [
                    {
                        Name: 'DistributionId',
                        Value: this.securityConfig.httpsEncryption.cloudFrontDistribution.distributionId
                    }
                ],
                StartTime: new Date(Date.now() - config.anomalyDetection.monitoringPeriod),
                EndTime: new Date(),
                Period: 300,
                Statistics: ['Sum', 'Average']
            });
            const totalRequests = metrics.Datapoints?.reduce((sum, point) => sum + point.Sum, 0) || 0;
            const averageRequests = totalRequests / (metrics.Datapoints?.length || 1);
            const isAnomalous = averageRequests > config.anomalyDetection.thresholds.requestsPerMinute;
            return {
                success: true,
                anomalyDetected: isAnomalous,
                metrics: {
                    totalRequests,
                    averageRequests,
                    dataPoints: metrics.Datapoints?.length || 0,
                    threshold: config.anomalyDetection.thresholds.requestsPerMinute
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * セキュリティアラートテスト
     */
    async testSecurityAlerts(config) {
        try {
            // SNSトピックの確認
            const topics = await this.testEngine.executeAwsCommand('sns', 'list-topics');
            const securityTopic = topics.Topics?.find((topic) => config.securityAlerts.notificationTargets.some(target => topic.TopicArn.includes(target)));
            if (!securityTopic) {
                return {
                    success: false,
                    error: 'セキュリティアラート用SNSトピックが見つかりません'
                };
            }
            // サブスクリプションの確認
            const subscriptions = await this.testEngine.executeAwsCommand('sns', 'list-subscriptions-by-topic', {
                TopicArn: securityTopic.TopicArn
            });
            return {
                success: true,
                topic: securityTopic,
                subscriptions: subscriptions.Subscriptions?.length || 0,
                alertTypes: config.securityAlerts.alertTypes
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * ログ分析テスト
     */
    async testLogAnalysis(config) {
        try {
            // CloudWatch Logsの確認
            const logGroups = await this.testEngine.executeAwsCommand('logs', 'describe-log-groups', {
                logGroupNamePrefix: config.cloudTrail.logGroupName
            });
            if (!logGroups.logGroups || logGroups.logGroups.length === 0) {
                return {
                    success: false,
                    error: 'セキュリティログ用CloudWatch Logsグループが見つかりません'
                };
            }
            const logGroup = logGroups.logGroups[0];
            // 最近のログストリームの確認
            const logStreams = await this.testEngine.executeAwsCommand('logs', 'describe-log-streams', {
                logGroupName: logGroup.logGroupName,
                orderBy: 'LastEventTime',
                descending: true,
                limit: 5
            });
            return {
                success: true,
                logGroup: {
                    name: logGroup.logGroupName,
                    retentionInDays: logGroup.retentionInDays,
                    storedBytes: logGroup.storedBytes
                },
                recentStreams: logStreams.logStreams?.length || 0,
                analysisPatterns: config.logAnalysis.analysisPatterns
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * セキュリティメトリクスの計算
     */
    calculateSecurityMetrics(testResults) {
        const httpsResult = testResults.get('https_encryption');
        const attackResult = testResults.get('attack_resistance');
        const monitoringResult = testResults.get('security_monitoring');
        const httpsCompliance = httpsResult?.success || false;
        const certificateValid = httpsResult?.details?.get('tls_certificate')?.success || false;
        const securityHeadersPresent = httpsResult?.details?.get('security_headers')?.success || false;
        const wafProtectionActive = attackResult?.success || false;
        const attacksBlocked = attackResult?.attacksBlocked || 0;
        // 脆弱性の計算
        let vulnerabilitiesFound = 0;
        if (!httpsCompliance)
            vulnerabilitiesFound++;
        if (!certificateValid)
            vulnerabilitiesFound++;
        if (!securityHeadersPresent)
            vulnerabilitiesFound++;
        if (!wafProtectionActive)
            vulnerabilitiesFound++;
        // セキュリティスコアの計算（0-1の範囲）
        const maxScore = 4;
        const currentScore = maxScore - vulnerabilitiesFound;
        const securityScore = Math.max(0, currentScore / maxScore);
        return {
            httpsCompliance,
            certificateValid,
            securityHeadersPresent,
            wafProtectionActive,
            attacksBlocked,
            vulnerabilitiesFound,
            securityScore
        };
    }
    /**
     * セキュリティ設定の検証
     */
    async validateSecurityConfiguration() {
        if (!this.securityConfig.httpsEncryption?.cloudFrontDistribution?.domainName) {
            throw new Error('CloudFrontドメイン名が設定されていません');
        }
        if (!this.securityConfig.attackResistance?.wafConfiguration?.webAclId) {
            console.warn('WAF WebACL IDが設定されていません。攻撃耐性テストが制限される可能性があります。');
        }
        if (!this.securityConfig.securityMonitoring?.cloudTrail?.trailName) {
            console.warn('CloudTrail名が設定されていません。セキュリティ監視テストが制限される可能性があります。');
        }
    }
    /**
     * 本番環境接続の確認
     */
    async verifyProductionConnectivity() {
        try {
            const url = `https://${this.securityConfig.httpsEncryption.cloudFrontDistribution.domainName}/api/health`;
            const response = await axios_1.default.get(url, { timeout: 10000 });
            if (response.status !== 200) {
                throw new Error(`本番環境への接続確認に失敗: ${response.status}`);
            }
            console.log('✅ 本番環境への接続確認完了');
        }
        catch (error) {
            throw new Error(`本番環境への接続に失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 セキュリティテストモジュールをクリーンアップ中...');
        try {
            // 特別なクリーンアップ処理は不要（読み取り専用テストのため）
            console.log('✅ セキュリティテストモジュールのクリーンアップ完了');
        }
        catch (error) {
            console.warn('⚠️ セキュリティテストモジュールのクリーンアップ中にエラー:', error);
        }
    }
}
exports.SecurityTestModule = SecurityTestModule;
exports.default = SecurityTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktdGVzdC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS10ZXN0LW1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0gsOEVBQTBHO0FBQzFHLHVEQUsyQjtBQUMzQiw2Q0FBK0I7QUFDL0IseUNBQTJCO0FBQzNCLGtEQUEwQjtBQXVCMUI7O0dBRUc7QUFDSCxNQUFhLGtCQUFrQjtJQUNyQixNQUFNLENBQW1CO0lBQ3pCLFVBQVUsQ0FBdUI7SUFDakMsY0FBYyxDQUFNO0lBRTVCLFlBQVksTUFBd0IsRUFBRSxVQUFnQztRQUNwRSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLDBDQUF3QixDQUFDO0lBQ2pELENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxVQUFVO1FBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBRXpDLElBQUksQ0FBQztZQUNILGdCQUFnQjtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUVELGNBQWM7WUFDZCxNQUFNLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1lBRTNDLFlBQVk7WUFDWixNQUFNLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO1lBRTFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUV2QyxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUM7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RUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUU3QyxJQUFJLENBQUM7WUFDSCxnQ0FBZ0M7WUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBRTVDLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBNW1DRCxnREE0bUNDO0FBRUQsa0JBQWUsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOODouOCuOODpeODvOODq1xuICogXG4gKiDlrp/mnKznlarnkrDlooPjgafjga7jgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jmqZ/og73jgpLmj5DkvptcbiAqIEhUVFBT5pqX5Y+35YyW44CB5pS75pKD6ICQ5oCn44CB44K744Kt44Ol44Oq44OG44Kj55uj6KaW44Gu44OG44K544OI44KS5a6f6KGMXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCBQcm9kdWN0aW9uVGVzdEVuZ2luZSwgeyBUZXN0UmVzdWx0LCBUZXN0RXhlY3V0aW9uU3RhdHVzIH0gZnJvbSAnLi4vLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcbmltcG9ydCB7IFxuICBwcm9kdWN0aW9uU2VjdXJpdHlDb25maWcsIFxuICBIdHRwc0VuY3J5cHRpb25UZXN0Q29uZmlnLCBcbiAgQXR0YWNrUmVzaXN0YW5jZVRlc3RDb25maWcsIFxuICBTZWN1cml0eU1vbml0b3JpbmdUZXN0Q29uZmlnIFxufSBmcm9tICcuL3NlY3VyaXR5LWNvbmZpZyc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyB0bHMgZnJvbSAndGxzJztcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XG5cbi8qKlxuICog44K744Kt44Ol44Oq44OG44Kj44OG44K544OI57WQ5p6c44Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJpdHlUZXN0UmVzdWx0IGV4dGVuZHMgVGVzdFJlc3VsdCB7XG4gIHNlY3VyaXR5TWV0cmljczoge1xuICAgIGh0dHBzQ29tcGxpYW5jZTogYm9vbGVhbjtcbiAgICBjZXJ0aWZpY2F0ZVZhbGlkOiBib29sZWFuO1xuICAgIHNlY3VyaXR5SGVhZGVyc1ByZXNlbnQ6IGJvb2xlYW47XG4gICAgd2FmUHJvdGVjdGlvbkFjdGl2ZTogYm9vbGVhbjtcbiAgICBhdHRhY2tzQmxvY2tlZDogbnVtYmVyO1xuICAgIHZ1bG5lcmFiaWxpdGllc0ZvdW5kOiBudW1iZXI7XG4gICAgc2VjdXJpdHlTY29yZTogbnVtYmVyO1xuICB9O1xuICBcbiAgZGV0YWlsZWRSZXN1bHRzOiB7XG4gICAgaHR0cHNFbmNyeXB0aW9uPzogTWFwPHN0cmluZywgYW55PjtcbiAgICBhdHRhY2tSZXNpc3RhbmNlPzogTWFwPHN0cmluZywgYW55PjtcbiAgICBzZWN1cml0eU1vbml0b3Jpbmc/OiBNYXA8c3RyaW5nLCBhbnk+O1xuICB9O1xufVxuXG4vKipcbiAqIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOODouOCuOODpeODvOODq+OCr+ODqeOCuVxuICovXG5leHBvcnQgY2xhc3MgU2VjdXJpdHlUZXN0TW9kdWxlIHtcbiAgcHJpdmF0ZSBjb25maWc6IFByb2R1Y3Rpb25Db25maWc7XG4gIHByaXZhdGUgdGVzdEVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmU7XG4gIHByaXZhdGUgc2VjdXJpdHlDb25maWc6IGFueTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFByb2R1Y3Rpb25Db25maWcsIHRlc3RFbmdpbmU6IFByb2R1Y3Rpb25UZXN0RW5naW5lKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy50ZXN0RW5naW5lID0gdGVzdEVuZ2luZTtcbiAgICB0aGlzLnNlY3VyaXR5Q29uZmlnID0gcHJvZHVjdGlvblNlY3VyaXR5Q29uZmlnO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOOBruWIneacn+WMllxuICAgKi9cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+UkiDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjgpLliJ3mnJ/ljJbkuK0uLi4nKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8g44OG44K544OI44Ko44Oz44K444Oz44Gu5Yid5pyf5YyW56K66KqNXG4gICAgICBpZiAoIXRoaXMudGVzdEVuZ2luZS5pc0luaXRpYWxpemVkKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfjg4bjgrnjg4jjgqjjg7Pjgrjjg7PjgYzliJ3mnJ/ljJbjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8g44K744Kt44Ol44Oq44OG44Kj6Kit5a6a44Gu5qSc6Ki8XG4gICAgICBhd2FpdCB0aGlzLnZhbGlkYXRlU2VjdXJpdHlDb25maWd1cmF0aW9uKCk7XG4gICAgICBcbiAgICAgIC8vIOacrOeVqueSsOWig+aOpee2muOBrueiuuiqjVxuICAgICAgYXdhaXQgdGhpcy52ZXJpZnlQcm9kdWN0aW9uQ29ubmVjdGl2aXR5KCk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Oi44K444Ol44O844Or5Yid5pyf5YyW5a6M5LqGJyk7XG4gICAgICBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOODouOCuOODpeODvOODq+WIneacn+WMluOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44K744Kt44Ol44Oq44OG44Kj44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBhc3luYyBydW5TZWN1cml0eVRlc3RzKCk6IFByb21pc2U8U2VjdXJpdHlUZXN0UmVzdWx0PiB7XG4gICAgY29uc29sZS5sb2coJ/CfmoAg44K744Kt44Ol44Oq44OG44Kj44OG44K544OI5a6f6KGM6ZaL5aeLLi4uJyk7XG4gICAgXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB0ZXN0UmVzdWx0cyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG4gICAgbGV0IG92ZXJhbGxTdWNjZXNzID0gdHJ1ZTtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICB0cnkge1xuICAgICAgLy8gMS4gSFRUUFPmmpflj7fljJbjg4bjgrnjg4hcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SQIEhUVFBT5pqX5Y+35YyW44OG44K544OI5a6f6KGM5LitLi4uJyk7XG4gICAgICBjb25zdCBodHRwc1Jlc3VsdHMgPSBhd2FpdCB0aGlzLnJ1bkh0dHBzRW5jcnlwdGlvblRlc3RzKCk7XG4gICAgICB0ZXN0UmVzdWx0cy5zZXQoJ2h0dHBzX2VuY3J5cHRpb24nLCBodHRwc1Jlc3VsdHMpO1xuICAgICAgXG4gICAgICBpZiAoIWh0dHBzUmVzdWx0cy5zdWNjZXNzKSB7XG4gICAgICAgIG92ZXJhbGxTdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIGVycm9ycy5wdXNoKCdIVFRQU+aal+WPt+WMluODhuOCueODiOOBq+WkseaVl+OBl+OBvuOBl+OBnycpO1xuICAgICAgfVxuXG4gICAgICAvLyAyLiDmlLvmkoPogJDmgKfjg4bjgrnjg4hcbiAgICAgIGNvbnNvbGUubG9nKCfwn5uh77iPIOaUu+aSg+iAkOaAp+ODhuOCueODiOWun+ihjOS4rS4uLicpO1xuICAgICAgY29uc3QgYXR0YWNrUmVzdWx0cyA9IGF3YWl0IHRoaXMucnVuQXR0YWNrUmVzaXN0YW5jZVRlc3RzKCk7XG4gICAgICB0ZXN0UmVzdWx0cy5zZXQoJ2F0dGFja19yZXNpc3RhbmNlJywgYXR0YWNrUmVzdWx0cyk7XG4gICAgICBcbiAgICAgIGlmICghYXR0YWNrUmVzdWx0cy5zdWNjZXNzKSB7XG4gICAgICAgIG92ZXJhbGxTdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIGVycm9ycy5wdXNoKCfmlLvmkoPogJDmgKfjg4bjgrnjg4jjgavlpLHmlZfjgZfjgb7jgZfjgZ8nKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4g44K744Kt44Ol44Oq44OG44Kj55uj6KaW44OG44K544OIXG4gICAgICBjb25zb2xlLmxvZygn8J+Rge+4jyDjgrvjgq3jg6Xjg6rjg4bjgqPnm6Poppbjg4bjgrnjg4jlrp/ooYzkuK0uLi4nKTtcbiAgICAgIGNvbnN0IG1vbml0b3JpbmdSZXN1bHRzID0gYXdhaXQgdGhpcy5ydW5TZWN1cml0eU1vbml0b3JpbmdUZXN0cygpO1xuICAgICAgdGVzdFJlc3VsdHMuc2V0KCdzZWN1cml0eV9tb25pdG9yaW5nJywgbW9uaXRvcmluZ1Jlc3VsdHMpO1xuICAgICAgXG4gICAgICBpZiAoIW1vbml0b3JpbmdSZXN1bHRzLnN1Y2Nlc3MpIHtcbiAgICAgICAgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgZXJyb3JzLnB1c2goJ+OCu+OCreODpeODquODhuOCo+ebo+imluODhuOCueODiOOBq+WkseaVl+OBl+OBvuOBl+OBnycpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBlbmRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gZW5kVGltZSAtIHN0YXJ0VGltZTtcblxuICAgICAgLy8g44K744Kt44Ol44Oq44OG44Kj44Oh44OI44Oq44Kv44K544Gu6KiI566XXG4gICAgICBjb25zdCBzZWN1cml0eU1ldHJpY3MgPSB0aGlzLmNhbGN1bGF0ZVNlY3VyaXR5TWV0cmljcyh0ZXN0UmVzdWx0cyk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdDogU2VjdXJpdHlUZXN0UmVzdWx0ID0ge1xuICAgICAgICB0ZXN0SWQ6IGBzZWN1cml0eS10ZXN0LSR7RGF0ZS5ub3coKX1gLFxuICAgICAgICB0ZXN0TmFtZTogJ+OCu+OCreODpeODquODhuOCo+ODhuOCueODiCcsXG4gICAgICAgIHN0YXR1czogb3ZlcmFsbFN1Y2Nlc3MgPyBUZXN0RXhlY3V0aW9uU3RhdHVzLkNPTVBMRVRFRCA6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdWNjZXNzOiBvdmVyYWxsU3VjY2VzcyxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZShlbmRUaW1lKSxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIHJlc3VsdHM6IHRlc3RSZXN1bHRzLFxuICAgICAgICBzZWN1cml0eU1ldHJpY3MsXG4gICAgICAgIGRldGFpbGVkUmVzdWx0czoge1xuICAgICAgICAgIGh0dHBzRW5jcnlwdGlvbjogdGVzdFJlc3VsdHMuZ2V0KCdodHRwc19lbmNyeXB0aW9uJyk/LmRldGFpbHMsXG4gICAgICAgICAgYXR0YWNrUmVzaXN0YW5jZTogdGVzdFJlc3VsdHMuZ2V0KCdhdHRhY2tfcmVzaXN0YW5jZScpPy5kZXRhaWxzLFxuICAgICAgICAgIHNlY3VyaXR5TW9uaXRvcmluZzogdGVzdFJlc3VsdHMuZ2V0KCdzZWN1cml0eV9tb25pdG9yaW5nJyk/LmRldGFpbHNcbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3JzOiBlcnJvcnMubGVuZ3RoID4gMCA/IGVycm9ycyA6IHVuZGVmaW5lZFxuICAgICAgfTtcblxuICAgICAgY29uc29sZS5sb2coJ/Cfk4og44K744Kt44Ol44Oq44OG44Kj44OG44K544OI5a6M5LqGOicpO1xuICAgICAgY29uc29sZS5sb2coYCAgIOOCu+OCreODpeODquODhuOCo+OCueOCs+OCojogJHsoc2VjdXJpdHlNZXRyaWNzLnNlY3VyaXR5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIEhUVFBT5rqW5ougOiAke3NlY3VyaXR5TWV0cmljcy5odHRwc0NvbXBsaWFuY2UgPyAn4pyTJyA6ICfinJcnfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOiovOaYjuabuOacieWKuTogJHtzZWN1cml0eU1ldHJpY3MuY2VydGlmaWNhdGVWYWxpZCA/ICfinJMnIDogJ+Kclyd9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgV0FG5L+d6K23OiAke3NlY3VyaXR5TWV0cmljcy53YWZQcm90ZWN0aW9uQWN0aXZlID8gJ+KckycgOiAn4pyXJ31gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDjg5bjg63jg4Pjgq/mlLvmkoPmlbA6ICR7c2VjdXJpdHlNZXRyaWNzLmF0dGFja3NCbG9ja2VkfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOiEhuW8seaAp+eZuuimi+aVsDogJHtzZWN1cml0eU1ldHJpY3MudnVsbmVyYWJpbGl0aWVzRm91bmR9YCk7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICBcbiAgICAgIGNvbnN0IGVuZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdElkOiBgc2VjdXJpdHktdGVzdC0ke0RhdGUubm93KCl9YCxcbiAgICAgICAgdGVzdE5hbWU6ICfjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4gnLFxuICAgICAgICBzdGF0dXM6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZShlbmRUaW1lKSxcbiAgICAgICAgZHVyYXRpb246IGVuZFRpbWUgLSBzdGFydFRpbWUsXG4gICAgICAgIHJlc3VsdHM6IHRlc3RSZXN1bHRzLFxuICAgICAgICBzZWN1cml0eU1ldHJpY3M6IHtcbiAgICAgICAgICBodHRwc0NvbXBsaWFuY2U6IGZhbHNlLFxuICAgICAgICAgIGNlcnRpZmljYXRlVmFsaWQ6IGZhbHNlLFxuICAgICAgICAgIHNlY3VyaXR5SGVhZGVyc1ByZXNlbnQ6IGZhbHNlLFxuICAgICAgICAgIHdhZlByb3RlY3Rpb25BY3RpdmU6IGZhbHNlLFxuICAgICAgICAgIGF0dGFja3NCbG9ja2VkOiAwLFxuICAgICAgICAgIHZ1bG5lcmFiaWxpdGllc0ZvdW5kOiAwLFxuICAgICAgICAgIHNlY3VyaXR5U2NvcmU6IDBcbiAgICAgICAgfSxcbiAgICAgICAgZGV0YWlsZWRSZXN1bHRzOiB7fSxcbiAgICAgICAgZXJyb3JzOiBbZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXVxuICAgICAgfTtcbiAgICB9XG4gIH0gIFxuLyoqXG4gICAqIEhUVFBT5pqX5Y+35YyW44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHJ1bkh0dHBzRW5jcnlwdGlvblRlc3RzKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgaHR0cHNDb25maWcgPSB0aGlzLnNlY3VyaXR5Q29uZmlnLmh0dHBzRW5jcnlwdGlvbiBhcyBIdHRwc0VuY3J5cHRpb25UZXN0Q29uZmlnO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xuICAgIGxldCBvdmVyYWxsU3VjY2VzcyA9IHRydWU7XG5cbiAgICB0cnkge1xuICAgICAgLy8gMS4gSFRUUFMg44Oq44OA44Kk44Os44Kv44OI44OG44K544OIXG4gICAgICBjb25zdCByZWRpcmVjdFJlc3VsdCA9IGF3YWl0IHRoaXMudGVzdEh0dHBzUmVkaXJlY3QoaHR0cHNDb25maWcpO1xuICAgICAgcmVzdWx0cy5zZXQoJ2h0dHBzX3JlZGlyZWN0JywgcmVkaXJlY3RSZXN1bHQpO1xuICAgICAgaWYgKCFyZWRpcmVjdFJlc3VsdC5zdWNjZXNzKSBvdmVyYWxsU3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICAvLyAyLiBUTFPoqLzmmI7mm7jmpJzoqLzjg4bjgrnjg4hcbiAgICAgIGNvbnN0IGNlcnRpZmljYXRlUmVzdWx0ID0gYXdhaXQgdGhpcy50ZXN0VGxzQ2VydGlmaWNhdGUoaHR0cHNDb25maWcpO1xuICAgICAgcmVzdWx0cy5zZXQoJ3Rsc19jZXJ0aWZpY2F0ZScsIGNlcnRpZmljYXRlUmVzdWx0KTtcbiAgICAgIGlmICghY2VydGlmaWNhdGVSZXN1bHQuc3VjY2Vzcykgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgLy8gMy4g44K744Kt44Ol44Oq44OG44Kj44OY44OD44OA44O844OG44K544OIXG4gICAgICBjb25zdCBoZWFkZXJzUmVzdWx0ID0gYXdhaXQgdGhpcy50ZXN0U2VjdXJpdHlIZWFkZXJzKGh0dHBzQ29uZmlnKTtcbiAgICAgIHJlc3VsdHMuc2V0KCdzZWN1cml0eV9oZWFkZXJzJywgaGVhZGVyc1Jlc3VsdCk7XG4gICAgICBpZiAoIWhlYWRlcnNSZXN1bHQuc3VjY2Vzcykgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgLy8gNC4g5pqX5Y+35YyW44OX44Ot44OI44Kz44Or44OG44K544OIXG4gICAgICBjb25zdCBwcm90b2NvbFJlc3VsdCA9IGF3YWl0IHRoaXMudGVzdEVuY3J5cHRpb25Qcm90b2NvbHMoaHR0cHNDb25maWcpO1xuICAgICAgcmVzdWx0cy5zZXQoJ2VuY3J5cHRpb25fcHJvdG9jb2xzJywgcHJvdG9jb2xSZXN1bHQpO1xuICAgICAgaWYgKCFwcm90b2NvbFJlc3VsdC5zdWNjZXNzKSBvdmVyYWxsU3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBvdmVyYWxsU3VjY2VzcyxcbiAgICAgICAgZGV0YWlsczogcmVzdWx0cyxcbiAgICAgICAgc3VtbWFyeToge1xuICAgICAgICAgIHRvdGFsVGVzdHM6IHJlc3VsdHMuc2l6ZSxcbiAgICAgICAgICBwYXNzZWRUZXN0czogQXJyYXkuZnJvbShyZXN1bHRzLnZhbHVlcygpKS5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aCxcbiAgICAgICAgICBmYWlsZWRUZXN0czogQXJyYXkuZnJvbShyZXN1bHRzLnZhbHVlcygpKS5maWx0ZXIociA9PiAhci5zdWNjZXNzKS5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdIVFRQU+aal+WPt+WMluODhuOCueODiOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZGV0YWlsczogcmVzdWx0cyxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5pS75pKD6ICQ5oCn44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHJ1bkF0dGFja1Jlc2lzdGFuY2VUZXN0cygpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGF0dGFja0NvbmZpZyA9IHRoaXMuc2VjdXJpdHlDb25maWcuYXR0YWNrUmVzaXN0YW5jZSBhcyBBdHRhY2tSZXNpc3RhbmNlVGVzdENvbmZpZztcbiAgICBjb25zdCByZXN1bHRzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcbiAgICBsZXQgb3ZlcmFsbFN1Y2Nlc3MgPSB0cnVlO1xuICAgIGxldCBhdHRhY2tzQmxvY2tlZCA9IDA7XG5cbiAgICB0cnkge1xuICAgICAgLy8gMS4gU1FM44Kk44Oz44K444Kn44Kv44K344On44Oz5pS75pKD44OG44K544OIXG4gICAgICBpZiAoYXR0YWNrQ29uZmlnLnNxbEluamVjdGlvblRlc3RzLmVuYWJsZWQpIHtcbiAgICAgICAgY29uc3Qgc3FsUmVzdWx0ID0gYXdhaXQgdGhpcy50ZXN0U3FsSW5qZWN0aW9uUHJvdGVjdGlvbihhdHRhY2tDb25maWcpO1xuICAgICAgICByZXN1bHRzLnNldCgnc3FsX2luamVjdGlvbl9wcm90ZWN0aW9uJywgc3FsUmVzdWx0KTtcbiAgICAgICAgaWYgKCFzcWxSZXN1bHQuc3VjY2Vzcykgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgYXR0YWNrc0Jsb2NrZWQgKz0gc3FsUmVzdWx0LmJsb2NrZWRBdHRhY2tzIHx8IDA7XG4gICAgICB9XG5cbiAgICAgIC8vIDIuIFhTU+aUu+aSg+ODhuOCueODiFxuICAgICAgaWYgKGF0dGFja0NvbmZpZy54c3NUZXN0cy5lbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IHhzc1Jlc3VsdCA9IGF3YWl0IHRoaXMudGVzdFhzc1Byb3RlY3Rpb24oYXR0YWNrQ29uZmlnKTtcbiAgICAgICAgcmVzdWx0cy5zZXQoJ3hzc19wcm90ZWN0aW9uJywgeHNzUmVzdWx0KTtcbiAgICAgICAgaWYgKCF4c3NSZXN1bHQuc3VjY2Vzcykgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgYXR0YWNrc0Jsb2NrZWQgKz0geHNzUmVzdWx0LmJsb2NrZWRBdHRhY2tzIHx8IDA7XG4gICAgICB9XG5cbiAgICAgIC8vIDMuIOS4jeato0FQSeOCouOCr+OCu+OCueODhuOCueODiFxuICAgICAgaWYgKGF0dGFja0NvbmZpZy51bmF1dGhvcml6ZWRBcGlUZXN0cy5lbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IGFwaVJlc3VsdCA9IGF3YWl0IHRoaXMudGVzdFVuYXV0aG9yaXplZEFwaUFjY2VzcyhhdHRhY2tDb25maWcpO1xuICAgICAgICByZXN1bHRzLnNldCgndW5hdXRob3JpemVkX2FwaV9hY2Nlc3MnLCBhcGlSZXN1bHQpO1xuICAgICAgICBpZiAoIWFwaVJlc3VsdC5zdWNjZXNzKSBvdmVyYWxsU3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyA0LiDjgrvjg4Pjgrfjg6fjg7Pjg4/jgqTjgrjjg6Pjg4Pjgq/mlLvmkoPjg4bjgrnjg4hcbiAgICAgIGlmIChhdHRhY2tDb25maWcuc2Vzc2lvbkhpamFja2luZ1Rlc3RzLmVuYWJsZWQpIHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvblJlc3VsdCA9IGF3YWl0IHRoaXMudGVzdFNlc3Npb25IaWphY2tpbmdQcm90ZWN0aW9uKGF0dGFja0NvbmZpZyk7XG4gICAgICAgIHJlc3VsdHMuc2V0KCdzZXNzaW9uX2hpamFja2luZ19wcm90ZWN0aW9uJywgc2Vzc2lvblJlc3VsdCk7XG4gICAgICAgIGlmICghc2Vzc2lvblJlc3VsdC5zdWNjZXNzKSBvdmVyYWxsU3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyA1LiDjg6zjg7zjg4jliLbpmZDjg4bjgrnjg4hcbiAgICAgIGlmIChhdHRhY2tDb25maWcucmF0ZUxpbWl0VGVzdHMuZW5hYmxlZCkge1xuICAgICAgICBjb25zdCByYXRlTGltaXRSZXN1bHQgPSBhd2FpdCB0aGlzLnRlc3RSYXRlTGltaXQoYXR0YWNrQ29uZmlnKTtcbiAgICAgICAgcmVzdWx0cy5zZXQoJ3JhdGVfbGltaXQnLCByYXRlTGltaXRSZXN1bHQpO1xuICAgICAgICBpZiAoIXJhdGVMaW1pdFJlc3VsdC5zdWNjZXNzKSBvdmVyYWxsU3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBvdmVyYWxsU3VjY2VzcyxcbiAgICAgICAgZGV0YWlsczogcmVzdWx0cyxcbiAgICAgICAgYXR0YWNrc0Jsb2NrZWQsXG4gICAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgICB0b3RhbFRlc3RzOiByZXN1bHRzLnNpemUsXG4gICAgICAgICAgcGFzc2VkVGVzdHM6IEFycmF5LmZyb20ocmVzdWx0cy52YWx1ZXMoKSkuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGgsXG4gICAgICAgICAgZmFpbGVkVGVzdHM6IEFycmF5LmZyb20ocmVzdWx0cy52YWx1ZXMoKSkuZmlsdGVyKHIgPT4gIXIuc3VjY2VzcykubGVuZ3RoLFxuICAgICAgICAgIHRvdGFsQXR0YWNrc0Jsb2NrZWQ6IGF0dGFja3NCbG9ja2VkXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign5pS75pKD6ICQ5oCn44OG44K544OI44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBkZXRhaWxzOiByZXN1bHRzLFxuICAgICAgICBhdHRhY2tzQmxvY2tlZCxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44K744Kt44Ol44Oq44OG44Kj55uj6KaW44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHJ1blNlY3VyaXR5TW9uaXRvcmluZ1Rlc3RzKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgbW9uaXRvcmluZ0NvbmZpZyA9IHRoaXMuc2VjdXJpdHlDb25maWcuc2VjdXJpdHlNb25pdG9yaW5nIGFzIFNlY3VyaXR5TW9uaXRvcmluZ1Rlc3RDb25maWc7XG4gICAgY29uc3QgcmVzdWx0cyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG4gICAgbGV0IG92ZXJhbGxTdWNjZXNzID0gdHJ1ZTtcblxuICAgIHRyeSB7XG4gICAgICAvLyAxLiBDbG91ZFRyYWls44Ot44Kw6KiY6Yyy44OG44K544OIXG4gICAgICBjb25zdCBjbG91ZFRyYWlsUmVzdWx0ID0gYXdhaXQgdGhpcy50ZXN0Q2xvdWRUcmFpbExvZ2dpbmcobW9uaXRvcmluZ0NvbmZpZyk7XG4gICAgICByZXN1bHRzLnNldCgnY2xvdWR0cmFpbF9sb2dnaW5nJywgY2xvdWRUcmFpbFJlc3VsdCk7XG4gICAgICBpZiAoIWNsb3VkVHJhaWxSZXN1bHQuc3VjY2Vzcykgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcblxuICAgICAgLy8gMi4g55Ww5bi444Ki44Kv44K744K544OR44K/44O844Oz5qSc5Ye644OG44K544OIXG4gICAgICBpZiAobW9uaXRvcmluZ0NvbmZpZy5hbm9tYWx5RGV0ZWN0aW9uLmVuYWJsZWQpIHtcbiAgICAgICAgY29uc3QgYW5vbWFseVJlc3VsdCA9IGF3YWl0IHRoaXMudGVzdEFub21hbHlEZXRlY3Rpb24obW9uaXRvcmluZ0NvbmZpZyk7XG4gICAgICAgIHJlc3VsdHMuc2V0KCdhbm9tYWx5X2RldGVjdGlvbicsIGFub21hbHlSZXN1bHQpO1xuICAgICAgICBpZiAoIWFub21hbHlSZXN1bHQuc3VjY2Vzcykgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4g44K744Kt44Ol44Oq44OG44Kj44Ki44Op44O844OI44OG44K544OIXG4gICAgICBpZiAobW9uaXRvcmluZ0NvbmZpZy5zZWN1cml0eUFsZXJ0cy5lbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IGFsZXJ0UmVzdWx0ID0gYXdhaXQgdGhpcy50ZXN0U2VjdXJpdHlBbGVydHMobW9uaXRvcmluZ0NvbmZpZyk7XG4gICAgICAgIHJlc3VsdHMuc2V0KCdzZWN1cml0eV9hbGVydHMnLCBhbGVydFJlc3VsdCk7XG4gICAgICAgIGlmICghYWxlcnRSZXN1bHQuc3VjY2Vzcykgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gNC4g44Ot44Kw5YiG5p6Q44OG44K544OIXG4gICAgICBpZiAobW9uaXRvcmluZ0NvbmZpZy5sb2dBbmFseXNpcy5lbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IGxvZ0FuYWx5c2lzUmVzdWx0ID0gYXdhaXQgdGhpcy50ZXN0TG9nQW5hbHlzaXMobW9uaXRvcmluZ0NvbmZpZyk7XG4gICAgICAgIHJlc3VsdHMuc2V0KCdsb2dfYW5hbHlzaXMnLCBsb2dBbmFseXNpc1Jlc3VsdCk7XG4gICAgICAgIGlmICghbG9nQW5hbHlzaXNSZXN1bHQuc3VjY2Vzcykgb3ZlcmFsbFN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2Vzczogb3ZlcmFsbFN1Y2Nlc3MsXG4gICAgICAgIGRldGFpbHM6IHJlc3VsdHMsXG4gICAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgICB0b3RhbFRlc3RzOiByZXN1bHRzLnNpemUsXG4gICAgICAgICAgcGFzc2VkVGVzdHM6IEFycmF5LmZyb20ocmVzdWx0cy52YWx1ZXMoKSkuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGgsXG4gICAgICAgICAgZmFpbGVkVGVzdHM6IEFycmF5LmZyb20ocmVzdWx0cy52YWx1ZXMoKSkuZmlsdGVyKHIgPT4gIXIuc3VjY2VzcykubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign44K744Kt44Ol44Oq44OG44Kj55uj6KaW44OG44K544OI44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBkZXRhaWxzOiByZXN1bHRzLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIVFRQU+ODquODgOOCpOODrOOCr+ODiOODhuOCueODiFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB0ZXN0SHR0cHNSZWRpcmVjdChjb25maWc6IEh0dHBzRW5jcnlwdGlvblRlc3RDb25maWcpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IGVuZHBvaW50IG9mIGNvbmZpZy50ZXN0RW5kcG9pbnRzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBodHRwVXJsID0gYGh0dHA6Ly8ke2NvbmZpZy5jbG91ZEZyb250RGlzdHJpYnV0aW9uLmRvbWFpbk5hbWV9JHtlbmRwb2ludH1gO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoaHR0cFVybCwge1xuICAgICAgICAgIG1heFJlZGlyZWN0czogMCxcbiAgICAgICAgICB2YWxpZGF0ZVN0YXR1czogKHN0YXR1cykgPT4gc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCA0MDBcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBpc1JlZGlyZWN0ID0gcmVzcG9uc2Uuc3RhdHVzID49IDMwMCAmJiByZXNwb25zZS5zdGF0dXMgPCA0MDA7XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uSGVhZGVyID0gcmVzcG9uc2UuaGVhZGVycy5sb2NhdGlvbjtcbiAgICAgICAgY29uc3QgaXNIdHRwc1JlZGlyZWN0ID0gbG9jYXRpb25IZWFkZXIgJiYgbG9jYXRpb25IZWFkZXIuc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKTtcbiAgICAgICAgXG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgaHR0cFVybCxcbiAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICBpc1JlZGlyZWN0LFxuICAgICAgICAgIGlzSHR0cHNSZWRpcmVjdCxcbiAgICAgICAgICBsb2NhdGlvbkhlYWRlcixcbiAgICAgICAgICBzdWNjZXNzOiBpc1JlZGlyZWN0ICYmIGlzSHR0cHNSZWRpcmVjdFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIGVuZHBvaW50LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHN1Y2Nlc3NDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IHN1Y2Nlc3NDb3VudCA9PT0gcmVzdWx0cy5sZW5ndGgsXG4gICAgICByZXN1bHRzLFxuICAgICAgc3VtbWFyeToge1xuICAgICAgICB0b3RhbEVuZHBvaW50czogcmVzdWx0cy5sZW5ndGgsXG4gICAgICAgIHN1Y2Nlc3NmdWxSZWRpcmVjdHM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgZmFpbGVkUmVkaXJlY3RzOiByZXN1bHRzLmxlbmd0aCAtIHN1Y2Nlc3NDb3VudFxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVExT6Ki85piO5pu45qSc6Ki844OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RUbHNDZXJ0aWZpY2F0ZShjb25maWc6IEh0dHBzRW5jcnlwdGlvblRlc3RDb25maWcpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgaG9zdDogY29uZmlnLmNsb3VkRnJvbnREaXN0cmlidXRpb24uZG9tYWluTmFtZSxcbiAgICAgICAgcG9ydDogNDQzLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdHJ1ZVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVxID0gaHR0cHMucmVxdWVzdChvcHRpb25zLCAocmVzKSA9PiB7XG4gICAgICAgIGNvbnN0IGNlcnQgPSByZXMuc29ja2V0LmdldFBlZXJDZXJ0aWZpY2F0ZSgpO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgY29uc3QgdmFsaWRGcm9tID0gbmV3IERhdGUoY2VydC52YWxpZF9mcm9tKTtcbiAgICAgICAgY29uc3QgdmFsaWRUbyA9IG5ldyBEYXRlKGNlcnQudmFsaWRfdG8pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgaXNWYWxpZCA9IG5vdyA+PSB2YWxpZEZyb20gJiYgbm93IDw9IHZhbGlkVG87XG4gICAgICAgIGNvbnN0IHN1YmplY3RNYXRjaGVzID0gY2VydC5zdWJqZWN0LkNOID09PSBjb25maWcudGxzQ2VydGlmaWNhdGUuZXhwZWN0ZWRTdWJqZWN0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZXJ0LnN1YmplY3RhbHRuYW1lPy5pbmNsdWRlcyhjb25maWcuY2xvdWRGcm9udERpc3RyaWJ1dGlvbi5kb21haW5OYW1lKTtcbiAgICAgICAgXG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgIHN1Y2Nlc3M6IGlzVmFsaWQgJiYgc3ViamVjdE1hdGNoZXMsXG4gICAgICAgICAgY2VydGlmaWNhdGU6IHtcbiAgICAgICAgICAgIHN1YmplY3Q6IGNlcnQuc3ViamVjdCxcbiAgICAgICAgICAgIGlzc3VlcjogY2VydC5pc3N1ZXIsXG4gICAgICAgICAgICB2YWxpZEZyb206IGNlcnQudmFsaWRfZnJvbSxcbiAgICAgICAgICAgIHZhbGlkVG86IGNlcnQudmFsaWRfdG8sXG4gICAgICAgICAgICBmaW5nZXJwcmludDogY2VydC5maW5nZXJwcmludCxcbiAgICAgICAgICAgIHNlcmlhbE51bWJlcjogY2VydC5zZXJpYWxOdW1iZXIsXG4gICAgICAgICAgICBzdWJqZWN0QWx0TmFtZTogY2VydC5zdWJqZWN0YWx0bmFtZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdmFsaWRhdGlvbjoge1xuICAgICAgICAgICAgaXNWYWxpZCxcbiAgICAgICAgICAgIHN1YmplY3RNYXRjaGVzLFxuICAgICAgICAgICAgZGF5c1VudGlsRXhwaXJ5OiBNYXRoLmZsb29yKCh2YWxpZFRvLmdldFRpbWUoKSAtIG5vdy5nZXRUaW1lKCkpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpKVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICByZXEuZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog44K744Kt44Ol44Oq44OG44Kj44OY44OD44OA44O844OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RTZWN1cml0eUhlYWRlcnMoY29uZmlnOiBIdHRwc0VuY3J5cHRpb25UZXN0Q29uZmlnKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgXG4gICAgZm9yIChjb25zdCBlbmRwb2ludCBvZiBjb25maWcudGVzdEVuZHBvaW50cykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vJHtjb25maWcuY2xvdWRGcm9udERpc3RyaWJ1dGlvbi5kb21haW5OYW1lfSR7ZW5kcG9pbnR9YDtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQodXJsKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSByZXNwb25zZS5oZWFkZXJzO1xuICAgICAgICBjb25zdCBoZWFkZXJDaGVja3MgPSB7XG4gICAgICAgICAgc3RyaWN0VHJhbnNwb3J0U2VjdXJpdHk6IHtcbiAgICAgICAgICAgIHByZXNlbnQ6ICEhaGVhZGVyc1snc3RyaWN0LXRyYW5zcG9ydC1zZWN1cml0eSddLFxuICAgICAgICAgICAgdmFsdWU6IGhlYWRlcnNbJ3N0cmljdC10cmFuc3BvcnQtc2VjdXJpdHknXSxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBjb25maWcuc2VjdXJpdHlIZWFkZXJzLnN0cmljdFRyYW5zcG9ydFNlY3VyaXR5LmVuYWJsZWRcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRlbnRTZWN1cml0eVBvbGljeToge1xuICAgICAgICAgICAgcHJlc2VudDogISFoZWFkZXJzWydjb250ZW50LXNlY3VyaXR5LXBvbGljeSddLFxuICAgICAgICAgICAgdmFsdWU6IGhlYWRlcnNbJ2NvbnRlbnQtc2VjdXJpdHktcG9saWN5J10sXG4gICAgICAgICAgICBleHBlY3RlZDogY29uZmlnLnNlY3VyaXR5SGVhZGVycy5jb250ZW50U2VjdXJpdHlQb2xpY3kuZW5hYmxlZFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeEZyYW1lT3B0aW9uczoge1xuICAgICAgICAgICAgcHJlc2VudDogISFoZWFkZXJzWyd4LWZyYW1lLW9wdGlvbnMnXSxcbiAgICAgICAgICAgIHZhbHVlOiBoZWFkZXJzWyd4LWZyYW1lLW9wdGlvbnMnXSxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBjb25maWcuc2VjdXJpdHlIZWFkZXJzLnhGcmFtZU9wdGlvbnMuZW5hYmxlZFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeENvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgICAgICAgcHJlc2VudDogISFoZWFkZXJzWyd4LWNvbnRlbnQtdHlwZS1vcHRpb25zJ10sXG4gICAgICAgICAgICB2YWx1ZTogaGVhZGVyc1sneC1jb250ZW50LXR5cGUtb3B0aW9ucyddLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGNvbmZpZy5zZWN1cml0eUhlYWRlcnMueENvbnRlbnRUeXBlT3B0aW9ucy5lbmFibGVkXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZWZlcnJlclBvbGljeToge1xuICAgICAgICAgICAgcHJlc2VudDogISFoZWFkZXJzWydyZWZlcnJlci1wb2xpY3knXSxcbiAgICAgICAgICAgIHZhbHVlOiBoZWFkZXJzWydyZWZlcnJlci1wb2xpY3knXSxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBjb25maWcuc2VjdXJpdHlIZWFkZXJzLnJlZmVycmVyUG9saWN5LmVuYWJsZWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBjb25zdCBhbGxIZWFkZXJzUHJlc2VudCA9IE9iamVjdC52YWx1ZXMoaGVhZGVyQ2hlY2tzKS5ldmVyeShjaGVjayA9PiBcbiAgICAgICAgICAhY2hlY2suZXhwZWN0ZWQgfHwgY2hlY2sucHJlc2VudFxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBlbmRwb2ludCxcbiAgICAgICAgICB1cmwsXG4gICAgICAgICAgc3VjY2VzczogYWxsSGVhZGVyc1ByZXNlbnQsXG4gICAgICAgICAgaGVhZGVyczogaGVhZGVyQ2hlY2tzXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY29uc3Qgc3VjY2Vzc0NvdW50ID0gcmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aDtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2Vzczogc3VjY2Vzc0NvdW50ID09PSByZXN1bHRzLmxlbmd0aCxcbiAgICAgIHJlc3VsdHMsXG4gICAgICBzdW1tYXJ5OiB7XG4gICAgICAgIHRvdGFsRW5kcG9pbnRzOiByZXN1bHRzLmxlbmd0aCxcbiAgICAgICAgZW5kcG9pbnRzV2l0aEFsbEhlYWRlcnM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgZW5kcG9pbnRzTWlzc2luZ0hlYWRlcnM6IHJlc3VsdHMubGVuZ3RoIC0gc3VjY2Vzc0NvdW50XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDmmpflj7fljJbjg5fjg63jg4jjgrPjg6vjg4bjgrnjg4hcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdGVzdEVuY3J5cHRpb25Qcm90b2NvbHMoY29uZmlnOiBIdHRwc0VuY3J5cHRpb25UZXN0Q29uZmlnKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgXG4gICAgZm9yIChjb25zdCBwcm90b2NvbCBvZiBjb25maWcudGxzQ2VydGlmaWNhdGUuc3VwcG9ydGVkUHJvdG9jb2xzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgIGhvc3Q6IGNvbmZpZy5jbG91ZEZyb250RGlzdHJpYnV0aW9uLmRvbWFpbk5hbWUsXG4gICAgICAgICAgcG9ydDogNDQzLFxuICAgICAgICAgIHNlY3VyZVByb3RvY29sOiB0aGlzLm1hcFRsc1ZlcnNpb24ocHJvdG9jb2wpXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnRlc3RUbHNDb25uZWN0aW9uKG9wdGlvbnMpO1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHByb3RvY29sLFxuICAgICAgICAgIHN1cHBvcnRlZDogcmVzdWx0LnN1Y2Nlc3MsXG4gICAgICAgICAgZGV0YWlsczogcmVzdWx0XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgcHJvdG9jb2wsXG4gICAgICAgICAgc3VwcG9ydGVkOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zdCBzdXBwb3J0ZWRDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdXBwb3J0ZWQpLmxlbmd0aDtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2Vzczogc3VwcG9ydGVkQ291bnQgPiAwLFxuICAgICAgcmVzdWx0cyxcbiAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgdG90YWxQcm90b2NvbHM6IHJlc3VsdHMubGVuZ3RoLFxuICAgICAgICBzdXBwb3J0ZWRQcm90b2NvbHM6IHN1cHBvcnRlZENvdW50LFxuICAgICAgICB1bnN1cHBvcnRlZFByb3RvY29sczogcmVzdWx0cy5sZW5ndGggLSBzdXBwb3J0ZWRDb3VudFxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVExT44OQ44O844K444On44Oz44Gu44Oe44OD44OU44Oz44KwXG4gICAqL1xuICBwcml2YXRlIG1hcFRsc1ZlcnNpb24odmVyc2lvbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXBwaW5nOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgJ1RMU3YxLjInOiAnVExTdjFfMl9tZXRob2QnLFxuICAgICAgJ1RMU3YxLjMnOiAnVExTX21ldGhvZCdcbiAgICB9O1xuICAgIHJldHVybiBtYXBwaW5nW3ZlcnNpb25dIHx8ICdUTFNfbWV0aG9kJztcbiAgfVxuXG4gIC8qKlxuICAgKiBUTFPmjqXntprjg4bjgrnjg4hcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdGVzdFRsc0Nvbm5lY3Rpb24ob3B0aW9uczogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNvbnN0IHNvY2tldCA9IHRscy5jb25uZWN0KG9wdGlvbnMsICgpID0+IHtcbiAgICAgICAgY29uc3QgcHJvdG9jb2wgPSBzb2NrZXQuZ2V0UHJvdG9jb2woKTtcbiAgICAgICAgY29uc3QgY2lwaGVyID0gc29ja2V0LmdldENpcGhlcigpO1xuICAgICAgICBcbiAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICBwcm90b2NvbCxcbiAgICAgICAgICBjaXBoZXIsXG4gICAgICAgICAgYXV0aG9yaXplZDogc29ja2V0LmF1dGhvcml6ZWRcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBzb2NrZXQuZW5kKCk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgc29ja2V0Lm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBzb2NrZXQuc2V0VGltZW91dCgxMDAwMCwgKCkgPT4ge1xuICAgICAgICBzb2NrZXQuZGVzdHJveSgpO1xuICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogJ0Nvbm5lY3Rpb24gdGltZW91dCdcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSAgLyoqXG4gICBcbiogU1FM44Kk44Oz44K444Kn44Kv44K344On44Oz5L+d6K2344OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RTcWxJbmplY3Rpb25Qcm90ZWN0aW9uKGNvbmZpZzogQXR0YWNrUmVzaXN0YW5jZVRlc3RDb25maWcpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBsZXQgYmxvY2tlZEF0dGFja3MgPSAwO1xuICAgIFxuICAgIGZvciAoY29uc3QgZW5kcG9pbnQgb2YgY29uZmlnLnNxbEluamVjdGlvblRlc3RzLnRhcmdldEVuZHBvaW50cykge1xuICAgICAgZm9yIChjb25zdCBwYXlsb2FkIG9mIGNvbmZpZy5zcWxJbmplY3Rpb25UZXN0cy50ZXN0UGF5bG9hZHMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly8ke3RoaXMuc2VjdXJpdHlDb25maWcuaHR0cHNFbmNyeXB0aW9uLmNsb3VkRnJvbnREaXN0cmlidXRpb24uZG9tYWluTmFtZX0ke2VuZHBvaW50fWA7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KHVybCwge1xuICAgICAgICAgICAgcXVlcnk6IHBheWxvYWQsXG4gICAgICAgICAgICBtZXNzYWdlOiBwYXlsb2FkXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgdGltZW91dDogMTAwMDAsXG4gICAgICAgICAgICB2YWxpZGF0ZVN0YXR1czogKCkgPT4gdHJ1ZSAvLyDjgZnjgbnjgabjga7jgrnjg4bjg7zjgr/jgrnjgrPjg7zjg4njgpLlj5fjgZHlhaXjgoxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBpc0Jsb2NrZWQgPSByZXNwb25zZS5zdGF0dXMgPT09IGNvbmZpZy5zcWxJbmplY3Rpb25UZXN0cy5leHBlY3RlZEJsb2NrUmVzcG9uc2U7XG4gICAgICAgICAgaWYgKGlzQmxvY2tlZCkgYmxvY2tlZEF0dGFja3MrKztcbiAgICAgICAgICBcbiAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgICBwYXlsb2FkOiBwYXlsb2FkLnN1YnN0cmluZygwLCA1MCkgKyAnLi4uJywgLy8g44Ot44Kw55So44Gr55+t57iuXG4gICAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICAgIGlzQmxvY2tlZCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGlzQmxvY2tlZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIOaUu+aSg+mWk+malOOCkuepuuOBkeOCi1xuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwKSk7XG4gICAgICAgICAgXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIGVuZHBvaW50LFxuICAgICAgICAgICAgcGF5bG9hZDogcGF5bG9hZC5zdWJzdHJpbmcoMCwgNTApICsgJy4uLicsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zdCBzdWNjZXNzQ291bnQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBzdWNjZXNzQ291bnQgPT09IHJlc3VsdHMubGVuZ3RoLFxuICAgICAgcmVzdWx0cyxcbiAgICAgIGJsb2NrZWRBdHRhY2tzLFxuICAgICAgc3VtbWFyeToge1xuICAgICAgICB0b3RhbEF0dGVtcHRzOiByZXN1bHRzLmxlbmd0aCxcbiAgICAgICAgYmxvY2tlZEF0dGVtcHRzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgIGFsbG93ZWRBdHRlbXB0czogcmVzdWx0cy5sZW5ndGggLSBzdWNjZXNzQ291bnRcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFhTU+S/neitt+ODhuOCueODiFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB0ZXN0WHNzUHJvdGVjdGlvbihjb25maWc6IEF0dGFja1Jlc2lzdGFuY2VUZXN0Q29uZmlnKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgbGV0IGJsb2NrZWRBdHRhY2tzID0gMDtcbiAgICBcbiAgICBmb3IgKGNvbnN0IGVuZHBvaW50IG9mIGNvbmZpZy54c3NUZXN0cy50YXJnZXRFbmRwb2ludHMpIHtcbiAgICAgIGZvciAoY29uc3QgcGF5bG9hZCBvZiBjb25maWcueHNzVGVzdHMudGVzdFBheWxvYWRzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vJHt0aGlzLnNlY3VyaXR5Q29uZmlnLmh0dHBzRW5jcnlwdGlvbi5jbG91ZEZyb250RGlzdHJpYnV0aW9uLmRvbWFpbk5hbWV9JHtlbmRwb2ludH1gO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdCh1cmwsIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IHBheWxvYWQsXG4gICAgICAgICAgICBtZXNzYWdlOiBwYXlsb2FkXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgdGltZW91dDogMTAwMDAsXG4gICAgICAgICAgICB2YWxpZGF0ZVN0YXR1czogKCkgPT4gdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGlzQmxvY2tlZCA9IHJlc3BvbnNlLnN0YXR1cyA9PT0gY29uZmlnLnhzc1Rlc3RzLmV4cGVjdGVkQmxvY2tSZXNwb25zZTtcbiAgICAgICAgICBpZiAoaXNCbG9ja2VkKSBibG9ja2VkQXR0YWNrcysrO1xuICAgICAgICAgIFxuICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICBlbmRwb2ludCxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQuc3Vic3RyaW5nKDAsIDUwKSArICcuLi4nLFxuICAgICAgICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgICAgICAgICBpc0Jsb2NrZWQsXG4gICAgICAgICAgICBzdWNjZXNzOiBpc0Jsb2NrZWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMCkpO1xuICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICBlbmRwb2ludCxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQuc3Vic3RyaW5nKDAsIDUwKSArICcuLi4nLFxuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY29uc3Qgc3VjY2Vzc0NvdW50ID0gcmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aDtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2Vzczogc3VjY2Vzc0NvdW50ID09PSByZXN1bHRzLmxlbmd0aCxcbiAgICAgIHJlc3VsdHMsXG4gICAgICBibG9ja2VkQXR0YWNrcyxcbiAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgdG90YWxBdHRlbXB0czogcmVzdWx0cy5sZW5ndGgsXG4gICAgICAgIGJsb2NrZWRBdHRlbXB0czogc3VjY2Vzc0NvdW50LFxuICAgICAgICBhbGxvd2VkQXR0ZW1wdHM6IHJlc3VsdHMubGVuZ3RoIC0gc3VjY2Vzc0NvdW50XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDkuI3mraNBUEnjgqLjgq/jgrvjgrnjg4bjgrnjg4hcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdGVzdFVuYXV0aG9yaXplZEFwaUFjY2Vzcyhjb25maWc6IEF0dGFja1Jlc2lzdGFuY2VUZXN0Q29uZmlnKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgXG4gICAgZm9yIChjb25zdCBlbmRwb2ludCBvZiBjb25maWcudW5hdXRob3JpemVkQXBpVGVzdHMudGVzdEVuZHBvaW50cykge1xuICAgICAgZm9yIChjb25zdCB0b2tlbiBvZiBjb25maWcudW5hdXRob3JpemVkQXBpVGVzdHMuaW52YWxpZFRva2Vucykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7dGhpcy5zZWN1cml0eUNvbmZpZy5odHRwc0VuY3J5cHRpb24uY2xvdWRGcm9udERpc3RyaWJ1dGlvbi5kb21haW5OYW1lfSR7ZW5kcG9pbnR9YDtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBoZWFkZXJzOiBhbnkgPSB7fTtcbiAgICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9IHRva2VuLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSA/IHRva2VuIDogYEJlYXJlciAke3Rva2VufWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KHVybCwge1xuICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IDEwMDAwLFxuICAgICAgICAgICAgdmFsaWRhdGVTdGF0dXM6ICgpID0+IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBpc1JlamVjdGVkID0gcmVzcG9uc2Uuc3RhdHVzID09PSBjb25maWcudW5hdXRob3JpemVkQXBpVGVzdHMuZXhwZWN0ZWRSZXNwb25zZTtcbiAgICAgICAgICBcbiAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgICB0b2tlbjogdG9rZW4gPyAnaW52YWxpZF90b2tlbl8qKionIDogJ25vX3Rva2VuJyxcbiAgICAgICAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgICAgICAgaXNSZWplY3RlZCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGlzUmVqZWN0ZWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwKSk7XG4gICAgICAgICAgXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIGVuZHBvaW50LFxuICAgICAgICAgICAgdG9rZW46IHRva2VuID8gJ2ludmFsaWRfdG9rZW5fKioqJyA6ICdub190b2tlbicsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zdCBzdWNjZXNzQ291bnQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBzdWNjZXNzQ291bnQgPT09IHJlc3VsdHMubGVuZ3RoLFxuICAgICAgcmVzdWx0cyxcbiAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgdG90YWxBdHRlbXB0czogcmVzdWx0cy5sZW5ndGgsXG4gICAgICAgIHJlamVjdGVkQXR0ZW1wdHM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgYWxsb3dlZEF0dGVtcHRzOiByZXN1bHRzLmxlbmd0aCAtIHN1Y2Nlc3NDb3VudFxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44K744OD44K344On44Oz44OP44Kk44K444Oj44OD44Kv5L+d6K2344OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RTZXNzaW9uSGlqYWNraW5nUHJvdGVjdGlvbihjb25maWc6IEF0dGFja1Jlc2lzdGFuY2VUZXN0Q29uZmlnKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgXG4gICAgZm9yIChjb25zdCBzY2VuYXJpbyBvZiBjb25maWcuc2Vzc2lvbkhpamFja2luZ1Rlc3RzLnRlc3RTY2VuYXJpb3MpIHtcbiAgICAgIGZvciAoY29uc3QgdG9rZW5QYXR0ZXJuIG9mIGNvbmZpZy5zZXNzaW9uSGlqYWNraW5nVGVzdHMuc2Vzc2lvblRva2VuUGF0dGVybnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly8ke3RoaXMuc2VjdXJpdHlDb25maWcuaHR0cHNFbmNyeXB0aW9uLmNsb3VkRnJvbnREaXN0cmlidXRpb24uZG9tYWluTmFtZX0vYXBpL2F1dGgvdmVyaWZ5YDtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QodXJsLCB7XG4gICAgICAgICAgICBzZXNzaW9uVG9rZW46IHRva2VuUGF0dGVybixcbiAgICAgICAgICAgIHNjZW5hcmlvOiBzY2VuYXJpb1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIHRpbWVvdXQ6IDEwMDAwLFxuICAgICAgICAgICAgdmFsaWRhdGVTdGF0dXM6ICgpID0+IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBpc1JlamVjdGVkID0gcmVzcG9uc2Uuc3RhdHVzID09PSA0MDEgfHwgcmVzcG9uc2Uuc3RhdHVzID09PSA0MDM7XG4gICAgICAgICAgXG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIHNjZW5hcmlvLFxuICAgICAgICAgICAgdG9rZW5QYXR0ZXJuOiAnaGlqYWNrZWRfdG9rZW5fKioqJyxcbiAgICAgICAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgICAgICAgaXNSZWplY3RlZCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGlzUmVqZWN0ZWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMCkpO1xuICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICBzY2VuYXJpbyxcbiAgICAgICAgICAgIHRva2VuUGF0dGVybjogJ2hpamFja2VkX3Rva2VuXyoqKicsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zdCBzdWNjZXNzQ291bnQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBzdWNjZXNzQ291bnQgPT09IHJlc3VsdHMubGVuZ3RoLFxuICAgICAgcmVzdWx0cyxcbiAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgdG90YWxBdHRlbXB0czogcmVzdWx0cy5sZW5ndGgsXG4gICAgICAgIHJlamVjdGVkQXR0ZW1wdHM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgYWxsb3dlZEF0dGVtcHRzOiByZXN1bHRzLmxlbmd0aCAtIHN1Y2Nlc3NDb3VudFxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44Os44O844OI5Yi26ZmQ44OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RSYXRlTGltaXQoY29uZmlnOiBBdHRhY2tSZXNpc3RhbmNlVGVzdENvbmZpZyk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vJHt0aGlzLnNlY3VyaXR5Q29uZmlnLmh0dHBzRW5jcnlwdGlvbi5jbG91ZEZyb250RGlzdHJpYnV0aW9uLmRvbWFpbk5hbWV9L2FwaS9oZWFsdGhgO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBsZXQgdGhyb3R0bGVkUmVxdWVzdHMgPSAwO1xuICAgIFxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgZW5kVGltZSA9IHN0YXJ0VGltZSArIGNvbmZpZy5yYXRlTGltaXRUZXN0cy50ZXN0RHVyYXRpb247XG4gICAgXG4gICAgY29uc29sZS5sb2coYOODrOODvOODiOWItumZkOODhuOCueODiOmWi+WnizogJHtjb25maWcucmF0ZUxpbWl0VGVzdHMucmVxdWVzdHNQZXJNaW51dGV9cmVxL21pbiDjgacgJHtjb25maWcucmF0ZUxpbWl0VGVzdHMudGVzdER1cmF0aW9uLzEwMDB956eS6ZaTYCk7XG4gICAgXG4gICAgd2hpbGUgKERhdGUubm93KCkgPCBlbmRUaW1lKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldCh1cmwsIHtcbiAgICAgICAgICB0aW1lb3V0OiA1MDAwLFxuICAgICAgICAgIHZhbGlkYXRlU3RhdHVzOiAoKSA9PiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgaXNUaHJvdHRsZWQgPSByZXNwb25zZS5zdGF0dXMgPT09IDQyOSB8fCByZXNwb25zZS5zdGF0dXMgPT09IDUwMztcbiAgICAgICAgaWYgKGlzVGhyb3R0bGVkKSB0aHJvdHRsZWRSZXF1ZXN0cysrO1xuICAgICAgICBcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgICAgICAgaXNUaHJvdHRsZWRcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDjg6rjgq/jgqjjgrnjg4jplpPpmpTjga7oqr/mlbTvvIgx5YiG6ZaT44Gr5oyH5a6a5Zue5pWw44Gu44Oq44Kv44Ko44K544OI77yJXG4gICAgICAgIGNvbnN0IGludGVydmFsTXMgPSA2MDAwMCAvIGNvbmZpZy5yYXRlTGltaXRUZXN0cy5yZXF1ZXN0c1Blck1pbnV0ZTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGludGVydmFsTXMpKTtcbiAgICAgICAgXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBjb25zdCB0b3RhbFJlcXVlc3RzID0gcmVzdWx0cy5sZW5ndGg7XG4gICAgY29uc3Qgc3VjY2Vzc2Z1bFJlcXVlc3RzID0gcmVzdWx0cy5maWx0ZXIociA9PiAhci5pc1Rocm90dGxlZCAmJiAhci5lcnJvcikubGVuZ3RoO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBjb25maWcucmF0ZUxpbWl0VGVzdHMuZXhwZWN0ZWRUaHJvdHRsaW5nID8gdGhyb3R0bGVkUmVxdWVzdHMgPiAwIDogdGhyb3R0bGVkUmVxdWVzdHMgPT09IDAsXG4gICAgICByZXN1bHRzOiByZXN1bHRzLnNsaWNlKC0xMCksIC8vIOacgOW+jOOBrjEw5Lu244Gu44G/5L+d5a2YXG4gICAgICBzdW1tYXJ5OiB7XG4gICAgICAgIHRvdGFsUmVxdWVzdHMsXG4gICAgICAgIHN1Y2Nlc3NmdWxSZXF1ZXN0cyxcbiAgICAgICAgdGhyb3R0bGVkUmVxdWVzdHMsXG4gICAgICAgIGVycm9yUmVxdWVzdHM6IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5lcnJvcikubGVuZ3RoLFxuICAgICAgICB0ZXN0RHVyYXRpb246IGNvbmZpZy5yYXRlTGltaXRUZXN0cy50ZXN0RHVyYXRpb24sXG4gICAgICAgIGF2ZXJhZ2VSZXF1ZXN0c1Blck1pbnV0ZTogKHRvdGFsUmVxdWVzdHMgLyAoY29uZmlnLnJhdGVMaW1pdFRlc3RzLnRlc3REdXJhdGlvbiAvIDYwMDAwKSkudG9GaXhlZCgyKVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRUcmFpbOODreOCsOiomOmMsuODhuOCueODiFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB0ZXN0Q2xvdWRUcmFpbExvZ2dpbmcoY29uZmlnOiBTZWN1cml0eU1vbml0b3JpbmdUZXN0Q29uZmlnKTogUHJvbWlzZTxhbnk+IHtcbiAgICB0cnkge1xuICAgICAgLy8gQ2xvdWRUcmFpbOOBruioreWumueiuuiqje+8iOiqreOBv+WPluOCiuWwgueUqO+8iVxuICAgICAgY29uc3QgY2xvdWRUcmFpbFN0YXR1cyA9IGF3YWl0IHRoaXMudGVzdEVuZ2luZS5leGVjdXRlQXdzQ29tbWFuZCgnY2xvdWR0cmFpbCcsICdkZXNjcmliZS10cmFpbHMnLCB7XG4gICAgICAgIHRyYWlsTmFtZUxpc3Q6IFtjb25maWcuY2xvdWRUcmFpbC50cmFpbE5hbWVdXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgaWYgKCFjbG91ZFRyYWlsU3RhdHVzIHx8IGNsb3VkVHJhaWxTdGF0dXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6ICdDbG91ZFRyYWls44GM6KaL44Gk44GL44KK44G+44Gb44KTJ1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCB0cmFpbCA9IGNsb3VkVHJhaWxTdGF0dXNbMF07XG4gICAgICBcbiAgICAgIC8vIOODreOCsOiomOmMsueKtuazgeOBrueiuuiqjVxuICAgICAgY29uc3QgbG9nZ2luZ1N0YXR1cyA9IGF3YWl0IHRoaXMudGVzdEVuZ2luZS5leGVjdXRlQXdzQ29tbWFuZCgnY2xvdWR0cmFpbCcsICdnZXQtdHJhaWwtc3RhdHVzJywge1xuICAgICAgICBOYW1lOiBjb25maWcuY2xvdWRUcmFpbC50cmFpbE5hbWVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBsb2dnaW5nU3RhdHVzLklzTG9nZ2luZyxcbiAgICAgICAgdHJhaWw6IHtcbiAgICAgICAgICBuYW1lOiB0cmFpbC5OYW1lLFxuICAgICAgICAgIHMzQnVja2V0TmFtZTogdHJhaWwuUzNCdWNrZXROYW1lLFxuICAgICAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiB0cmFpbC5JbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50cyxcbiAgICAgICAgICBpc011bHRpUmVnaW9uVHJhaWw6IHRyYWlsLklzTXVsdGlSZWdpb25UcmFpbCxcbiAgICAgICAgICBpc0xvZ2dpbmc6IGxvZ2dpbmdTdGF0dXMuSXNMb2dnaW5nLFxuICAgICAgICAgIGxhdGVzdERlbGl2ZXJ5VGltZTogbG9nZ2luZ1N0YXR1cy5MYXRlc3REZWxpdmVyeVRpbWVcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog55Ww5bi45qSc5Ye644OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RBbm9tYWx5RGV0ZWN0aW9uKGNvbmZpZzogU2VjdXJpdHlNb25pdG9yaW5nVGVzdENvbmZpZyk6IFByb21pc2U8YW55PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENsb3VkV2F0Y2jjg6Hjg4jjg6rjgq/jgrnjga7norroqo1cbiAgICAgIGNvbnN0IG1ldHJpY3MgPSBhd2FpdCB0aGlzLnRlc3RFbmdpbmUuZXhlY3V0ZUF3c0NvbW1hbmQoJ2Nsb3Vkd2F0Y2gnLCAnZ2V0LW1ldHJpYy1zdGF0aXN0aWNzJywge1xuICAgICAgICBOYW1lc3BhY2U6ICdBV1MvQ2xvdWRGcm9udCcsXG4gICAgICAgIE1ldHJpY05hbWU6ICdSZXF1ZXN0cycsXG4gICAgICAgIERpbWVuc2lvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAnRGlzdHJpYnV0aW9uSWQnLFxuICAgICAgICAgICAgVmFsdWU6IHRoaXMuc2VjdXJpdHlDb25maWcuaHR0cHNFbmNyeXB0aW9uLmNsb3VkRnJvbnREaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWRcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIFN0YXJ0VGltZTogbmV3IERhdGUoRGF0ZS5ub3coKSAtIGNvbmZpZy5hbm9tYWx5RGV0ZWN0aW9uLm1vbml0b3JpbmdQZXJpb2QpLFxuICAgICAgICBFbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBQZXJpb2Q6IDMwMCxcbiAgICAgICAgU3RhdGlzdGljczogWydTdW0nLCAnQXZlcmFnZSddXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgdG90YWxSZXF1ZXN0cyA9IG1ldHJpY3MuRGF0YXBvaW50cz8ucmVkdWNlKChzdW06IG51bWJlciwgcG9pbnQ6IGFueSkgPT4gc3VtICsgcG9pbnQuU3VtLCAwKSB8fCAwO1xuICAgICAgY29uc3QgYXZlcmFnZVJlcXVlc3RzID0gdG90YWxSZXF1ZXN0cyAvIChtZXRyaWNzLkRhdGFwb2ludHM/Lmxlbmd0aCB8fCAxKTtcbiAgICAgIFxuICAgICAgY29uc3QgaXNBbm9tYWxvdXMgPSBhdmVyYWdlUmVxdWVzdHMgPiBjb25maWcuYW5vbWFseURldGVjdGlvbi50aHJlc2hvbGRzLnJlcXVlc3RzUGVyTWludXRlO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBhbm9tYWx5RGV0ZWN0ZWQ6IGlzQW5vbWFsb3VzLFxuICAgICAgICBtZXRyaWNzOiB7XG4gICAgICAgICAgdG90YWxSZXF1ZXN0cyxcbiAgICAgICAgICBhdmVyYWdlUmVxdWVzdHMsXG4gICAgICAgICAgZGF0YVBvaW50czogbWV0cmljcy5EYXRhcG9pbnRzPy5sZW5ndGggfHwgMCxcbiAgICAgICAgICB0aHJlc2hvbGQ6IGNvbmZpZy5hbm9tYWx5RGV0ZWN0aW9uLnRocmVzaG9sZHMucmVxdWVzdHNQZXJNaW51dGVcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44K744Kt44Ol44Oq44OG44Kj44Ki44Op44O844OI44OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RTZWN1cml0eUFsZXJ0cyhjb25maWc6IFNlY3VyaXR5TW9uaXRvcmluZ1Rlc3RDb25maWcpOiBQcm9taXNlPGFueT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBTTlPjg4jjg5Tjg4Pjgq/jga7norroqo1cbiAgICAgIGNvbnN0IHRvcGljcyA9IGF3YWl0IHRoaXMudGVzdEVuZ2luZS5leGVjdXRlQXdzQ29tbWFuZCgnc25zJywgJ2xpc3QtdG9waWNzJyk7XG4gICAgICBcbiAgICAgIGNvbnN0IHNlY3VyaXR5VG9waWMgPSB0b3BpY3MuVG9waWNzPy5maW5kKCh0b3BpYzogYW55KSA9PiBcbiAgICAgICAgY29uZmlnLnNlY3VyaXR5QWxlcnRzLm5vdGlmaWNhdGlvblRhcmdldHMuc29tZSh0YXJnZXQgPT4gXG4gICAgICAgICAgdG9waWMuVG9waWNBcm4uaW5jbHVkZXModGFyZ2V0KVxuICAgICAgICApXG4gICAgICApO1xuICAgICAgXG4gICAgICBpZiAoIXNlY3VyaXR5VG9waWMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogJ+OCu+OCreODpeODquODhuOCo+OCouODqeODvOODiOeUqFNOU+ODiOODlOODg+OCr+OBjOimi+OBpOOBi+OCiuOBvuOBm+OCkydcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8g44K144OW44K544Kv44Oq44OX44K344On44Oz44Gu56K66KqNXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gYXdhaXQgdGhpcy50ZXN0RW5naW5lLmV4ZWN1dGVBd3NDb21tYW5kKCdzbnMnLCAnbGlzdC1zdWJzY3JpcHRpb25zLWJ5LXRvcGljJywge1xuICAgICAgICBUb3BpY0Fybjogc2VjdXJpdHlUb3BpYy5Ub3BpY0FyblxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHRvcGljOiBzZWN1cml0eVRvcGljLFxuICAgICAgICBzdWJzY3JpcHRpb25zOiBzdWJzY3JpcHRpb25zLlN1YnNjcmlwdGlvbnM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICBhbGVydFR5cGVzOiBjb25maWcuc2VjdXJpdHlBbGVydHMuYWxlcnRUeXBlc1xuICAgICAgfTtcbiAgICAgIFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44Ot44Kw5YiG5p6Q44OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RMb2dBbmFseXNpcyhjb25maWc6IFNlY3VyaXR5TW9uaXRvcmluZ1Rlc3RDb25maWcpOiBQcm9taXNlPGFueT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBDbG91ZFdhdGNoIExvZ3Pjga7norroqo1cbiAgICAgIGNvbnN0IGxvZ0dyb3VwcyA9IGF3YWl0IHRoaXMudGVzdEVuZ2luZS5leGVjdXRlQXdzQ29tbWFuZCgnbG9ncycsICdkZXNjcmliZS1sb2ctZ3JvdXBzJywge1xuICAgICAgICBsb2dHcm91cE5hbWVQcmVmaXg6IGNvbmZpZy5jbG91ZFRyYWlsLmxvZ0dyb3VwTmFtZVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGlmICghbG9nR3JvdXBzLmxvZ0dyb3VwcyB8fCBsb2dHcm91cHMubG9nR3JvdXBzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiAn44K744Kt44Ol44Oq44OG44Kj44Ot44Kw55SoQ2xvdWRXYXRjaCBMb2dz44Kw44Or44O844OX44GM6KaL44Gk44GL44KK44G+44Gb44KTJ1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCBsb2dHcm91cCA9IGxvZ0dyb3Vwcy5sb2dHcm91cHNbMF07XG4gICAgICBcbiAgICAgIC8vIOacgOi/keOBruODreOCsOOCueODiOODquODvOODoOOBrueiuuiqjVxuICAgICAgY29uc3QgbG9nU3RyZWFtcyA9IGF3YWl0IHRoaXMudGVzdEVuZ2luZS5leGVjdXRlQXdzQ29tbWFuZCgnbG9ncycsICdkZXNjcmliZS1sb2ctc3RyZWFtcycsIHtcbiAgICAgICAgbG9nR3JvdXBOYW1lOiBsb2dHcm91cC5sb2dHcm91cE5hbWUsXG4gICAgICAgIG9yZGVyQnk6ICdMYXN0RXZlbnRUaW1lJyxcbiAgICAgICAgZGVzY2VuZGluZzogdHJ1ZSxcbiAgICAgICAgbGltaXQ6IDVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBsb2dHcm91cDoge1xuICAgICAgICAgIG5hbWU6IGxvZ0dyb3VwLmxvZ0dyb3VwTmFtZSxcbiAgICAgICAgICByZXRlbnRpb25JbkRheXM6IGxvZ0dyb3VwLnJldGVudGlvbkluRGF5cyxcbiAgICAgICAgICBzdG9yZWRCeXRlczogbG9nR3JvdXAuc3RvcmVkQnl0ZXNcbiAgICAgICAgfSxcbiAgICAgICAgcmVjZW50U3RyZWFtczogbG9nU3RyZWFtcy5sb2dTdHJlYW1zPy5sZW5ndGggfHwgMCxcbiAgICAgICAgYW5hbHlzaXNQYXR0ZXJuczogY29uZmlnLmxvZ0FuYWx5c2lzLmFuYWx5c2lzUGF0dGVybnNcbiAgICAgIH07XG4gICAgICBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOOCu+OCreODpeODquODhuOCo+ODoeODiOODquOCr+OCueOBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVTZWN1cml0eU1ldHJpY3ModGVzdFJlc3VsdHM6IE1hcDxzdHJpbmcsIGFueT4pOiBhbnkge1xuICAgIGNvbnN0IGh0dHBzUmVzdWx0ID0gdGVzdFJlc3VsdHMuZ2V0KCdodHRwc19lbmNyeXB0aW9uJyk7XG4gICAgY29uc3QgYXR0YWNrUmVzdWx0ID0gdGVzdFJlc3VsdHMuZ2V0KCdhdHRhY2tfcmVzaXN0YW5jZScpO1xuICAgIGNvbnN0IG1vbml0b3JpbmdSZXN1bHQgPSB0ZXN0UmVzdWx0cy5nZXQoJ3NlY3VyaXR5X21vbml0b3JpbmcnKTtcbiAgICBcbiAgICBjb25zdCBodHRwc0NvbXBsaWFuY2UgPSBodHRwc1Jlc3VsdD8uc3VjY2VzcyB8fCBmYWxzZTtcbiAgICBjb25zdCBjZXJ0aWZpY2F0ZVZhbGlkID0gaHR0cHNSZXN1bHQ/LmRldGFpbHM/LmdldCgndGxzX2NlcnRpZmljYXRlJyk/LnN1Y2Nlc3MgfHwgZmFsc2U7XG4gICAgY29uc3Qgc2VjdXJpdHlIZWFkZXJzUHJlc2VudCA9IGh0dHBzUmVzdWx0Py5kZXRhaWxzPy5nZXQoJ3NlY3VyaXR5X2hlYWRlcnMnKT8uc3VjY2VzcyB8fCBmYWxzZTtcbiAgICBjb25zdCB3YWZQcm90ZWN0aW9uQWN0aXZlID0gYXR0YWNrUmVzdWx0Py5zdWNjZXNzIHx8IGZhbHNlO1xuICAgIGNvbnN0IGF0dGFja3NCbG9ja2VkID0gYXR0YWNrUmVzdWx0Py5hdHRhY2tzQmxvY2tlZCB8fCAwO1xuICAgIFxuICAgIC8vIOiEhuW8seaAp+OBruioiOeul1xuICAgIGxldCB2dWxuZXJhYmlsaXRpZXNGb3VuZCA9IDA7XG4gICAgaWYgKCFodHRwc0NvbXBsaWFuY2UpIHZ1bG5lcmFiaWxpdGllc0ZvdW5kKys7XG4gICAgaWYgKCFjZXJ0aWZpY2F0ZVZhbGlkKSB2dWxuZXJhYmlsaXRpZXNGb3VuZCsrO1xuICAgIGlmICghc2VjdXJpdHlIZWFkZXJzUHJlc2VudCkgdnVsbmVyYWJpbGl0aWVzRm91bmQrKztcbiAgICBpZiAoIXdhZlByb3RlY3Rpb25BY3RpdmUpIHZ1bG5lcmFiaWxpdGllc0ZvdW5kKys7XG4gICAgXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj44K544Kz44Ki44Gu6KiI566X77yIMC0x44Gu56+E5Zuy77yJXG4gICAgY29uc3QgbWF4U2NvcmUgPSA0O1xuICAgIGNvbnN0IGN1cnJlbnRTY29yZSA9IG1heFNjb3JlIC0gdnVsbmVyYWJpbGl0aWVzRm91bmQ7XG4gICAgY29uc3Qgc2VjdXJpdHlTY29yZSA9IE1hdGgubWF4KDAsIGN1cnJlbnRTY29yZSAvIG1heFNjb3JlKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgaHR0cHNDb21wbGlhbmNlLFxuICAgICAgY2VydGlmaWNhdGVWYWxpZCxcbiAgICAgIHNlY3VyaXR5SGVhZGVyc1ByZXNlbnQsXG4gICAgICB3YWZQcm90ZWN0aW9uQWN0aXZlLFxuICAgICAgYXR0YWNrc0Jsb2NrZWQsXG4gICAgICB2dWxuZXJhYmlsaXRpZXNGb3VuZCxcbiAgICAgIHNlY3VyaXR5U2NvcmVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOOCu+OCreODpeODquODhuOCo+ioreWumuOBruaknOiovFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZVNlY3VyaXR5Q29uZmlndXJhdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuc2VjdXJpdHlDb25maWcuaHR0cHNFbmNyeXB0aW9uPy5jbG91ZEZyb250RGlzdHJpYnV0aW9uPy5kb21haW5OYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nsb3VkRnJvbnTjg4njg6HjgqTjg7PlkI3jgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCF0aGlzLnNlY3VyaXR5Q29uZmlnLmF0dGFja1Jlc2lzdGFuY2U/LndhZkNvbmZpZ3VyYXRpb24/LndlYkFjbElkKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1dBRiBXZWJBQ0wgSUTjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpPjgILmlLvmkoPogJDmgKfjg4bjgrnjg4jjgYzliLbpmZDjgZXjgozjgovlj6/og73mgKfjgYzjgYLjgorjgb7jgZnjgIInKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCF0aGlzLnNlY3VyaXR5Q29uZmlnLnNlY3VyaXR5TW9uaXRvcmluZz8uY2xvdWRUcmFpbD8udHJhaWxOYW1lKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0Nsb3VkVHJhaWzlkI3jgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpPjgILjgrvjgq3jg6Xjg6rjg4bjgqPnm6Poppbjg4bjgrnjg4jjgYzliLbpmZDjgZXjgozjgovlj6/og73mgKfjgYzjgYLjgorjgb7jgZnjgIInKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5pys55Wq55Kw5aKD5o6l57aa44Gu56K66KqNXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHZlcmlmeVByb2R1Y3Rpb25Db25uZWN0aXZpdHkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7dGhpcy5zZWN1cml0eUNvbmZpZy5odHRwc0VuY3J5cHRpb24uY2xvdWRGcm9udERpc3RyaWJ1dGlvbi5kb21haW5OYW1lfS9hcGkvaGVhbHRoYDtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KHVybCwgeyB0aW1lb3V0OiAxMDAwMCB9KTtcbiAgICAgIFxuICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihg5pys55Wq55Kw5aKD44G444Gu5o6l57aa56K66KqN44Gr5aSx5pWXOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ+KchSDmnKznlarnkrDlooPjgbjjga7mjqXntprnorroqo3lrozkuoYnKTtcbiAgICAgIFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOacrOeVqueSsOWig+OBuOOBruaOpee2muOBq+WkseaVlzogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOODquOCveODvOOCueOBruOCr+ODquODvOODs+OCouODg+ODl1xuICAgKi9cbiAgYXN5bmMgY2xlYW51cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+nuSDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjgpLjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK0uLi4nKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8g54m55Yil44Gq44Kv44Oq44O844Oz44Ki44OD44OX5Yem55CG44Gv5LiN6KaB77yI6Kqt44G/5Y+W44KK5bCC55So44OG44K544OI44Gu44Gf44KB77yJXG4gICAgICBjb25zb2xlLmxvZygn4pyFIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOODouOCuOODpeODvOODq+OBruOCr+ODquODvOODs+OCouODg+ODl+WujOS6hicpO1xuICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2Fybign4pqg77iPIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiOODouOCuOODpeODvOODq+OBruOCr+ODquODvOODs+OCouODg+ODl+S4reOBq+OCqOODqeODvDonLCBlcnJvcik7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3VyaXR5VGVzdE1vZHVsZTsiXX0=