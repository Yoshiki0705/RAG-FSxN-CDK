"use strict";
/**
 * セキュリティテスト設定
 *
 * 実本番環境でのセキュリティテストに関する設定を管理
 * HTTPS暗号化、WAF防御、攻撃耐性、セキュリティ監視のテスト設定
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.developmentSecurityConfig = exports.stagingSecurityConfig = exports.productionSecurityConfig = void 0;
exports.getSecurityConfig = getSecurityConfig;
exports.validateSecurityConfig = validateSecurityConfig;
/**
 * 本番環境セキュリティテスト設定
 */
exports.productionSecurityConfig = {
    // HTTPS暗号化テスト設定
    httpsEncryption: {
        cloudFrontDistribution: {
            domainName: process.env.CLOUDFRONT_DOMAIN_NAME || 'example.cloudfront.net',
            distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
            originDomainName: process.env.ORIGIN_DOMAIN_NAME || ''
        },
        tlsCertificate: {
            certificateArn: process.env.TLS_CERTIFICATE_ARN || '',
            expectedSubject: process.env.CERTIFICATE_SUBJECT || '*.example.com',
            minimumTlsVersion: 'TLSv1.2',
            supportedProtocols: ['TLSv1.2', 'TLSv1.3']
        },
        securityHeaders: {
            strictTransportSecurity: {
                enabled: true,
                maxAge: 31536000, // 1年
                includeSubdomains: true
            },
            contentSecurityPolicy: {
                enabled: true,
                directives: {
                    'default-src': "'self'",
                    'script-src': "'self' 'unsafe-inline'",
                    'style-src': "'self' 'unsafe-inline'",
                    'img-src': "'self' data: https:",
                    'connect-src': "'self' https:",
                    'font-src': "'self'",
                    'object-src': "'none'",
                    'media-src': "'self'",
                    'frame-src': "'none'"
                }
            },
            xFrameOptions: {
                enabled: true,
                value: 'DENY'
            },
            xContentTypeOptions: {
                enabled: true,
                value: 'nosniff'
            },
            referrerPolicy: {
                enabled: true,
                value: 'strict-origin-when-cross-origin'
            }
        },
        testEndpoints: [
            '/',
            '/api/health',
            '/api/auth/login',
            '/api/chat',
            '/static/css/main.css',
            '/static/js/main.js'
        ],
        httpRedirectTest: true,
        mixedContentTest: true,
        certificateValidityTest: true
    },
    // 攻撃耐性テスト設定
    attackResistance: {
        wafConfiguration: {
            webAclId: process.env.WAF_WEB_ACL_ID || '',
            webAclName: process.env.WAF_WEB_ACL_NAME || 'ChatbotUIWAF',
            associatedResources: [
                process.env.CLOUDFRONT_DISTRIBUTION_ARN || ''
            ],
            ruleGroups: [
                'AWSManagedRulesCommonRuleSet',
                'AWSManagedRulesKnownBadInputsRuleSet',
                'AWSManagedRulesSQLiRuleSet',
                'AWSManagedRulesLinuxRuleSet'
            ]
        },
        sqlInjectionTests: {
            enabled: true,
            testPayloads: [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT * FROM users --",
                "1' AND (SELECT COUNT(*) FROM users) > 0 --",
                "admin'/**/OR/**/1=1#"
            ],
            targetEndpoints: [
                '/api/chat',
                '/api/search',
                '/api/documents'
            ],
            expectedBlockResponse: 403
        },
        xssTests: {
            enabled: true,
            testPayloads: [
                "<script>alert('XSS')</script>",
                "javascript:alert('XSS')",
                "<img src=x onerror=alert('XSS')>",
                "<svg onload=alert('XSS')>",
                "';alert('XSS');//"
            ],
            targetEndpoints: [
                '/api/chat',
                '/api/feedback',
                '/api/user/profile'
            ],
            expectedBlockResponse: 403
        },
        unauthorizedApiTests: {
            enabled: true,
            testEndpoints: [
                '/api/admin/users',
                '/api/admin/settings',
                '/api/documents/private',
                '/api/analytics/data'
            ],
            invalidTokens: [
                'invalid_token',
                'expired_token_12345',
                '',
                'Bearer malformed.token.here'
            ],
            expectedResponse: 401
        },
        sessionHijackingTests: {
            enabled: true,
            testScenarios: [
                'session_fixation',
                'session_replay',
                'cross_site_session_transfer'
            ],
            sessionTokenPatterns: [
                'stolen_session_token',
                'replayed_session_token',
                'cross_origin_session_token'
            ],
            expectedBehavior: 'reject_and_invalidate'
        },
        rateLimitTests: {
            enabled: true,
            requestsPerMinute: 100,
            burstLimit: 20,
            testDuration: 60000, // 1分
            expectedThrottling: true
        }
    },
    // セキュリティ監視テスト設定
    securityMonitoring: {
        cloudTrail: {
            trailName: process.env.CLOUDTRAIL_NAME || 'ChatbotUISecurityTrail',
            s3BucketName: process.env.CLOUDTRAIL_S3_BUCKET || '',
            logGroupName: process.env.CLOUDTRAIL_LOG_GROUP || '/aws/cloudtrail/security',
            eventCategories: [
                'Management',
                'Data',
                'Insight'
            ]
        },
        anomalyDetection: {
            enabled: true,
            monitoringPeriod: 300000, // 5分
            thresholds: {
                requestsPerMinute: 1000,
                uniqueIpCount: 100,
                errorRate: 0.05, // 5%
                suspiciousPatterns: [
                    'rapid_sequential_requests',
                    'multiple_failed_auth_attempts',
                    'unusual_geographic_access',
                    'suspicious_user_agent_patterns'
                ]
            }
        },
        securityAlerts: {
            enabled: true,
            alertTypes: [
                'waf_block_event',
                'authentication_failure',
                'unauthorized_access_attempt',
                'suspicious_activity_detected',
                'security_policy_violation'
            ],
            notificationTargets: [
                process.env.SECURITY_SNS_TOPIC || '',
                process.env.SECURITY_EMAIL || 'security@example.com'
            ],
            severityLevels: [
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            ]
        },
        logAnalysis: {
            enabled: true,
            analysisPatterns: [
                'failed_authentication_patterns',
                'blocked_request_patterns',
                'error_rate_spikes',
                'geographic_anomalies',
                'time_based_anomalies'
            ],
            retentionPeriod: 2592000000, // 30日
            realTimeAnalysis: true
        }
    },
    // 全般設定
    general: {
        testTimeout: 300000, // 5分
        maxRetries: 3,
        retryDelay: 5000, // 5秒
        parallelExecution: false, // セキュリティテストは順次実行
        emergencyStopEnabled: true,
        detailedLogging: true,
        // テスト実行順序
        executionOrder: [
            'https_encryption',
            'attack_resistance',
            'security_monitoring'
        ],
        // 必須テスト（スキップ不可）
        mandatoryTests: [
            'https_redirect_test',
            'tls_certificate_validation',
            'security_headers_validation',
            'sql_injection_protection',
            'xss_protection',
            'unauthorized_access_protection'
        ],
        // 本番環境制約
        productionConstraints: {
            readOnlyMode: true,
            noDataModification: true,
            noResourceCreation: true,
            limitedTestDuration: true,
            maxConcurrentTests: 1
        }
    }
};
/**
 * ステージング環境セキュリティテスト設定
 */
exports.stagingSecurityConfig = {
    ...exports.productionSecurityConfig,
    // ステージング環境では並列実行可能
    general: {
        ...exports.productionSecurityConfig.general,
        parallelExecution: true,
        maxConcurrentTests: 3,
        testTimeout: 600000, // 10分
        // ステージング環境制約（本番より緩い）
        productionConstraints: {
            readOnlyMode: false,
            noDataModification: false,
            noResourceCreation: true,
            limitedTestDuration: false,
            maxConcurrentTests: 3
        }
    },
    // より積極的な攻撃テスト
    attackResistance: {
        ...exports.productionSecurityConfig.attackResistance,
        rateLimitTests: {
            ...exports.productionSecurityConfig.attackResistance.rateLimitTests,
            requestsPerMinute: 200,
            testDuration: 120000 // 2分
        }
    }
};
/**
 * 開発環境セキュリティテスト設定
 */
exports.developmentSecurityConfig = {
    ...exports.productionSecurityConfig,
    // 開発環境では基本的なセキュリティテストのみ
    general: {
        ...exports.productionSecurityConfig.general,
        parallelExecution: true,
        maxConcurrentTests: 5,
        testTimeout: 180000, // 3分
        // 必須テストを最小限に
        mandatoryTests: [
            'https_redirect_test',
            'tls_certificate_validation',
            'basic_security_headers'
        ],
        // 開発環境制約（最も緩い）
        productionConstraints: {
            readOnlyMode: false,
            noDataModification: false,
            noResourceCreation: false,
            limitedTestDuration: false,
            maxConcurrentTests: 5
        }
    },
    // 軽量な攻撃テスト
    attackResistance: {
        ...exports.productionSecurityConfig.attackResistance,
        sqlInjectionTests: {
            ...exports.productionSecurityConfig.attackResistance.sqlInjectionTests,
            testPayloads: exports.productionSecurityConfig.attackResistance.sqlInjectionTests.testPayloads.slice(0, 2)
        },
        xssTests: {
            ...exports.productionSecurityConfig.attackResistance.xssTests,
            testPayloads: exports.productionSecurityConfig.attackResistance.xssTests.testPayloads.slice(0, 2)
        },
        rateLimitTests: {
            ...exports.productionSecurityConfig.attackResistance.rateLimitTests,
            enabled: false // 開発環境ではレート制限テストをスキップ
        }
    }
};
/**
 * 環境に応じた設定の取得
 */
function getSecurityConfig(environment) {
    switch (environment.toLowerCase()) {
        case 'production':
        case 'prod':
            return exports.productionSecurityConfig;
        case 'staging':
        case 'stage':
            return exports.stagingSecurityConfig;
        case 'development':
        case 'dev':
            return exports.developmentSecurityConfig;
        default:
            console.warn(`未知の環境: ${environment}. 開発環境設定を使用します。`);
            return exports.developmentSecurityConfig;
    }
}
/**
 * セキュリティ設定の検証
 */
function validateSecurityConfig(config) {
    const errors = [];
    const warnings = [];
    // CloudFront設定の検証
    if (!config.httpsEncryption?.cloudFrontDistribution?.domainName) {
        errors.push('CloudFrontドメイン名が設定されていません');
    }
    // WAF設定の検証
    if (!config.attackResistance?.wafConfiguration?.webAclId) {
        errors.push('WAF WebACL IDが設定されていません');
    }
    // CloudTrail設定の検証
    if (!config.securityMonitoring?.cloudTrail?.trailName) {
        warnings.push('CloudTrail名が設定されていません');
    }
    // テストエンドポイントの検証
    if (!config.httpsEncryption?.testEndpoints?.length) {
        warnings.push('HTTPSテスト用エンドポイントが設定されていません');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
// エンドツーエンド暗号化テスト設定を追加
exports.productionSecurityConfig.general.executionOrder.push('end_to_end_encryption', 'authentication_authorization');
exports.stagingSecurityConfig.general.executionOrder.push('end_to_end_encryption', 'authentication_authorization');
exports.developmentSecurityConfig.general.executionOrder.push('end_to_end_encryption', 'authentication_authorization');
exports.default = {
    productionSecurityConfig: exports.productionSecurityConfig,
    stagingSecurityConfig: exports.stagingSecurityConfig,
    developmentSecurityConfig: exports.developmentSecurityConfig,
    getSecurityConfig,
    validateSecurityConfig
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VjdXJpdHktY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBMmVILDhDQWVDO0FBS0Qsd0RBaUNDO0FBNVlEOztHQUVHO0FBQ1UsUUFBQSx3QkFBd0IsR0FBRztJQUN0QyxnQkFBZ0I7SUFDaEIsZUFBZSxFQUFFO1FBQ2Ysc0JBQXNCLEVBQUU7WUFDdEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLElBQUksd0JBQXdCO1lBQzFFLGNBQWMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixJQUFJLEVBQUU7WUFDNUQsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxFQUFFO1NBQ3ZEO1FBRUQsY0FBYyxFQUFFO1lBQ2QsY0FBYyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksRUFBRTtZQUNyRCxlQUFlLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxlQUFlO1lBQ25FLGlCQUFpQixFQUFFLFNBQVM7WUFDNUIsa0JBQWtCLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO1NBQzNDO1FBRUQsZUFBZSxFQUFFO1lBQ2YsdUJBQXVCLEVBQUU7Z0JBQ3ZCLE9BQU8sRUFBRSxJQUFJO2dCQUNiLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSztnQkFDdkIsaUJBQWlCLEVBQUUsSUFBSTthQUN4QjtZQUNELHFCQUFxQixFQUFFO2dCQUNyQixPQUFPLEVBQUUsSUFBSTtnQkFDYixVQUFVLEVBQUU7b0JBQ1YsYUFBYSxFQUFFLFFBQVE7b0JBQ3ZCLFlBQVksRUFBRSx3QkFBd0I7b0JBQ3RDLFdBQVcsRUFBRSx3QkFBd0I7b0JBQ3JDLFNBQVMsRUFBRSxxQkFBcUI7b0JBQ2hDLGFBQWEsRUFBRSxlQUFlO29CQUM5QixVQUFVLEVBQUUs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SSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUM7UUFDdEQsUUFBUSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBQ25ELFFBQVEsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQsT0FBTztRQUNMLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUM7UUFDNUIsTUFBTTtRQUNOLFFBQVE7S0FDVCxDQUFDO0FBQ0osQ0FBQztBQUVELHNCQUFzQjtBQUN0QixnQ0FBd0IsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0FBQzlHLDZCQUFxQixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLDhCQUE4QixDQUFDLENBQUM7QUFDM0csaUNBQXlCLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsOEJBQThCLENBQUMsQ0FBQztBQUUvRyxrQkFBZTtJQUNiLHdCQUF3QixFQUF4QixnQ0FBd0I7SUFDeEIscUJBQXFCLEVBQXJCLDZCQUFxQjtJQUNyQix5QkFBeUIsRUFBekIsaUNBQXlCO0lBQ3pCLGlCQUFpQjtJQUNqQixzQkFBc0I7Q0FDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog44K744Kt44Ol44Oq44OG44Kj44OG44K544OI6Kit5a6aXG4gKiBcbiAqIOWun+acrOeVqueSsOWig+OBp+OBruOCu+OCreODpeODquODhuOCo+ODhuOCueODiOOBq+mWouOBmeOCi+ioreWumuOCkueuoeeQhlxuICogSFRUUFPmmpflj7fljJbjgIFXQUbpmLLlvqHjgIHmlLvmkoPogJDmgKfjgIHjgrvjgq3jg6Xjg6rjg4bjgqPnm6Poppbjga7jg4bjgrnjg4joqK3lrppcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbi8qKlxuICogSFRUUFPmmpflj7fljJbjg4bjgrnjg4joqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBIdHRwc0VuY3J5cHRpb25UZXN0Q29uZmlnIHtcbiAgLy8gQ2xvdWRGcm9udOioreWumlxuICBjbG91ZEZyb250RGlzdHJpYnV0aW9uOiB7XG4gICAgZG9tYWluTmFtZTogc3RyaW5nO1xuICAgIGRpc3RyaWJ1dGlvbklkOiBzdHJpbmc7XG4gICAgb3JpZ2luRG9tYWluTmFtZTogc3RyaW5nO1xuICB9O1xuICBcbiAgLy8gVExT6Ki85piO5pu46Kit5a6aXG4gIHRsc0NlcnRpZmljYXRlOiB7XG4gICAgY2VydGlmaWNhdGVBcm46IHN0cmluZztcbiAgICBleHBlY3RlZFN1YmplY3Q6IHN0cmluZztcbiAgICBtaW5pbXVtVGxzVmVyc2lvbjogc3RyaW5nO1xuICAgIHN1cHBvcnRlZFByb3RvY29sczogc3RyaW5nW107XG4gIH07XG4gIFxuICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjg5jjg4Pjg4Djg7zoqK3lrppcbiAgc2VjdXJpdHlIZWFkZXJzOiB7XG4gICAgc3RyaWN0VHJhbnNwb3J0U2VjdXJpdHk6IHtcbiAgICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgICBtYXhBZ2U6IG51bWJlcjtcbiAgICAgIGluY2x1ZGVTdWJkb21haW5zOiBib29sZWFuO1xuICAgIH07XG4gICAgY29udGVudFNlY3VyaXR5UG9saWN5OiB7XG4gICAgICBlbmFibGVkOiBib29sZWFuO1xuICAgICAgZGlyZWN0aXZlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICB9O1xuICAgIHhGcmFtZU9wdGlvbnM6IHtcbiAgICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgICB2YWx1ZTogc3RyaW5nO1xuICAgIH07XG4gICAgeENvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgfTtcbiAgICByZWZlcnJlclBvbGljeToge1xuICAgICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgfTtcbiAgfTtcbiAgXG4gIC8vIOODhuOCueODiOioreWumlxuICB0ZXN0RW5kcG9pbnRzOiBzdHJpbmdbXTtcbiAgaHR0cFJlZGlyZWN0VGVzdDogYm9vbGVhbjtcbiAgbWl4ZWRDb250ZW50VGVzdDogYm9vbGVhbjtcbiAgY2VydGlmaWNhdGVWYWxpZGl0eVRlc3Q6IGJvb2xlYW47XG59XG5cbi8qKlxuICog5pS75pKD6ICQ5oCn44OG44K544OI6Kit5a6aXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQXR0YWNrUmVzaXN0YW5jZVRlc3RDb25maWcge1xuICAvLyBXQUboqK3lrppcbiAgd2FmQ29uZmlndXJhdGlvbjoge1xuICAgIHdlYkFjbElkOiBzdHJpbmc7XG4gICAgd2ViQWNsTmFtZTogc3RyaW5nO1xuICAgIGFzc29jaWF0ZWRSZXNvdXJjZXM6IHN0cmluZ1tdO1xuICAgIHJ1bGVHcm91cHM6IHN0cmluZ1tdO1xuICB9O1xuICBcbiAgLy8gU1FM44Kk44Oz44K444Kn44Kv44K344On44Oz5pS75pKD44OG44K544OIXG4gIHNxbEluamVjdGlvblRlc3RzOiB7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICB0ZXN0UGF5bG9hZHM6IHN0cmluZ1tdO1xuICAgIHRhcmdldEVuZHBvaW50czogc3RyaW5nW107XG4gICAgZXhwZWN0ZWRCbG9ja1Jlc3BvbnNlOiBudW1iZXI7XG4gIH07XG4gIFxuICAvLyBYU1PmlLvmkoPjg4bjgrnjg4hcbiAgeHNzVGVzdHM6IHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHRlc3RQYXlsb2Fkczogc3RyaW5nW107XG4gICAgdGFyZ2V0RW5kcG9pbnRzOiBzdHJpbmdbXTtcbiAgICBleHBlY3RlZEJsb2NrUmVzcG9uc2U6IG51bWJlcjtcbiAgfTtcbiAgXG4gIC8vIOS4jeato0FQSeOCouOCr+OCu+OCueODhuOCueODiFxuICB1bmF1dGhvcml6ZWRBcGlUZXN0czoge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgdGVzdEVuZHBvaW50czogc3RyaW5nW107XG4gICAgaW52YWxpZFRva2Vuczogc3RyaW5nW107XG4gICAgZXhwZWN0ZWRSZXNwb25zZTogbnVtYmVyO1xuICB9O1xuICBcbiAgLy8g44K744OD44K344On44Oz44OP44Kk44K444Oj44OD44Kv5pS75pKD44OG44K544OIXG4gIHNlc3Npb25IaWphY2tpbmdUZXN0czoge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgdGVzdFNjZW5hcmlvczogc3RyaW5nW107XG4gICAgc2Vzc2lvblRva2VuUGF0dGVybnM6IHN0cmluZ1tdO1xuICAgIGV4cGVjdGVkQmVoYXZpb3I6IHN0cmluZztcbiAgfTtcbiAgXG4gIC8vIOODrOODvOODiOWItumZkOODhuOCueODiFxuICByYXRlTGltaXRUZXN0czoge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgcmVxdWVzdHNQZXJNaW51dGU6IG51bWJlcjtcbiAgICBidXJzdExpbWl0OiBudW1iZXI7XG4gICAgdGVzdER1cmF0aW9uOiBudW1iZXI7XG4gICAgZXhwZWN0ZWRUaHJvdHRsaW5nOiBib29sZWFuO1xuICB9O1xufVxuXG4vKipcbiAqIOOCu+OCreODpeODquODhuOCo+ebo+imluODhuOCueODiOioreWumlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyaXR5TW9uaXRvcmluZ1Rlc3RDb25maWcge1xuICAvLyBDbG91ZFRyYWls6Kit5a6aXG4gIGNsb3VkVHJhaWw6IHtcbiAgICB0cmFpbE5hbWU6IHN0cmluZztcbiAgICBzM0J1Y2tldE5hbWU6IHN0cmluZztcbiAgICBsb2dHcm91cE5hbWU6IHN0cmluZztcbiAgICBldmVudENhdGVnb3JpZXM6IHN0cmluZ1tdO1xuICB9O1xuICBcbiAgLy8g55Ww5bi444Ki44Kv44K744K544OR44K/44O844Oz5qSc5Ye6XG4gIGFub21hbHlEZXRlY3Rpb246IHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIG1vbml0b3JpbmdQZXJpb2Q6IG51bWJlcjtcbiAgICB0aHJlc2hvbGRzOiB7XG4gICAgICByZXF1ZXN0c1Blck1pbnV0ZTogbnVtYmVyO1xuICAgICAgdW5pcXVlSXBDb3VudDogbnVtYmVyO1xuICAgICAgZXJyb3JSYXRlOiBudW1iZXI7XG4gICAgICBzdXNwaWNpb3VzUGF0dGVybnM6IHN0cmluZ1tdO1xuICAgIH07XG4gIH07XG4gIFxuICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgqLjg6njg7zjg4hcbiAgc2VjdXJpdHlBbGVydHM6IHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIGFsZXJ0VHlwZXM6IHN0cmluZ1tdO1xuICAgIG5vdGlmaWNhdGlvblRhcmdldHM6IHN0cmluZ1tdO1xuICAgIHNldmVyaXR5TGV2ZWxzOiBzdHJpbmdbXTtcbiAgfTtcbiAgXG4gIC8vIOODreOCsOWIhuaekOioreWumlxuICBsb2dBbmFseXNpczoge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgYW5hbHlzaXNQYXR0ZXJuczogc3RyaW5nW107XG4gICAgcmV0ZW50aW9uUGVyaW9kOiBudW1iZXI7XG4gICAgcmVhbFRpbWVBbmFseXNpczogYm9vbGVhbjtcbiAgfTtcbn1cblxuLyoqXG4gKiDmnKznlarnkrDlooPjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4joqK3lrppcbiAqL1xuZXhwb3J0IGNvbnN0IHByb2R1Y3Rpb25TZWN1cml0eUNvbmZpZyA9IHtcbiAgLy8gSFRUUFPmmpflj7fljJbjg4bjgrnjg4joqK3lrppcbiAgaHR0cHNFbmNyeXB0aW9uOiB7XG4gICAgY2xvdWRGcm9udERpc3RyaWJ1dGlvbjoge1xuICAgICAgZG9tYWluTmFtZTogcHJvY2Vzcy5lbnYuQ0xPVURGUk9OVF9ET01BSU5fTkFNRSB8fCAnZXhhbXBsZS5jbG91ZGZyb250Lm5ldCcsXG4gICAgICBkaXN0cmlidXRpb25JZDogcHJvY2Vzcy5lbnYuQ0xPVURGUk9OVF9ESVNUUklCVVRJT05fSUQgfHwgJycsXG4gICAgICBvcmlnaW5Eb21haW5OYW1lOiBwcm9jZXNzLmVudi5PUklHSU5fRE9NQUlOX05BTUUgfHwgJydcbiAgICB9LFxuICAgIFxuICAgIHRsc0NlcnRpZmljYXRlOiB7XG4gICAgICBjZXJ0aWZpY2F0ZUFybjogcHJvY2Vzcy5lbnYuVExTX0NFUlRJRklDQVRFX0FSTiB8fCAnJyxcbiAgICAgIGV4cGVjdGVkU3ViamVjdDogcHJvY2Vzcy5lbnYuQ0VSVElGSUNBVEVfU1VCSkVDVCB8fCAnKi5leGFtcGxlLmNvbScsXG4gICAgICBtaW5pbXVtVGxzVmVyc2lvbjogJ1RMU3YxLjInLFxuICAgICAgc3VwcG9ydGVkUHJvdG9jb2xzOiBbJ1RMU3YxLjInLCAnVExTdjEuMyddXG4gICAgfSxcbiAgICBcbiAgICBzZWN1cml0eUhlYWRlcnM6IHtcbiAgICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIG1heEFnZTogMzE1MzYwMDAsIC8vIDHlubRcbiAgICAgICAgaW5jbHVkZVN1YmRvbWFpbnM6IHRydWVcbiAgICAgIH0sXG4gICAgICBjb250ZW50U2VjdXJpdHlQb2xpY3k6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aXZlczoge1xuICAgICAgICAgICdkZWZhdWx0LXNyYyc6IFwiJ3NlbGYnXCIsXG4gICAgICAgICAgJ3NjcmlwdC1zcmMnOiBcIidzZWxmJyAndW5zYWZlLWlubGluZSdcIixcbiAgICAgICAgICAnc3R5bGUtc3JjJzogXCInc2VsZicgJ3Vuc2FmZS1pbmxpbmUnXCIsXG4gICAgICAgICAgJ2ltZy1zcmMnOiBcIidzZWxmJyBkYXRhOiBodHRwczpcIixcbiAgICAgICAgICAnY29ubmVjdC1zcmMnOiBcIidzZWxmJyBodHRwczpcIixcbiAgICAgICAgICAnZm9udC1zcmMnOiBcIidzZWxmJ1wiLFxuICAgICAgICAgICdvYmplY3Qtc3JjJzogXCInbm9uZSdcIixcbiAgICAgICAgICAnbWVkaWEtc3JjJzogXCInc2VsZidcIixcbiAgICAgICAgICAnZnJhbWUtc3JjJzogXCInbm9uZSdcIlxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgeEZyYW1lT3B0aW9uczoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICB2YWx1ZTogJ0RFTlknXG4gICAgICB9LFxuICAgICAgeENvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICB2YWx1ZTogJ25vc25pZmYnXG4gICAgICB9LFxuICAgICAgcmVmZXJyZXJQb2xpY3k6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICdzdHJpY3Qtb3JpZ2luLXdoZW4tY3Jvc3Mtb3JpZ2luJ1xuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgdGVzdEVuZHBvaW50czogW1xuICAgICAgJy8nLFxuICAgICAgJy9hcGkvaGVhbHRoJyxcbiAgICAgICcvYXBpL2F1dGgvbG9naW4nLFxuICAgICAgJy9hcGkvY2hhdCcsXG4gICAgICAnL3N0YXRpYy9jc3MvbWFpbi5jc3MnLFxuICAgICAgJy9zdGF0aWMvanMvbWFpbi5qcydcbiAgICBdLFxuICAgIGh0dHBSZWRpcmVjdFRlc3Q6IHRydWUsXG4gICAgbWl4ZWRDb250ZW50VGVzdDogdHJ1ZSxcbiAgICBjZXJ0aWZpY2F0ZVZhbGlkaXR5VGVzdDogdHJ1ZVxuICB9IGFzIEh0dHBzRW5jcnlwdGlvblRlc3RDb25maWcsXG4gIFxuICAvLyDmlLvmkoPogJDmgKfjg4bjgrnjg4joqK3lrppcbiAgYXR0YWNrUmVzaXN0YW5jZToge1xuICAgIHdhZkNvbmZpZ3VyYXRpb246IHtcbiAgICAgIHdlYkFjbElkOiBwcm9jZXNzLmVudi5XQUZfV0VCX0FDTF9JRCB8fCAnJyxcbiAgICAgIHdlYkFjbE5hbWU6IHByb2Nlc3MuZW52LldBRl9XRUJfQUNMX05BTUUgfHwgJ0NoYXRib3RVSVdBRicsXG4gICAgICBhc3NvY2lhdGVkUmVzb3VyY2VzOiBbXG4gICAgICAgIHByb2Nlc3MuZW52LkNMT1VERlJPTlRfRElTVFJJQlVUSU9OX0FSTiB8fCAnJ1xuICAgICAgXSxcbiAgICAgIHJ1bGVHcm91cHM6IFtcbiAgICAgICAgJ0FXU01hbmFnZWRSdWxlc0NvbW1vblJ1bGVTZXQnLFxuICAgICAgICAnQVdTTWFuYWdlZFJ1bGVzS25vd25CYWRJbnB1dHNSdWxlU2V0JyxcbiAgICAgICAgJ0FXU01hbmFnZWRSdWxlc1NRTGlSdWxlU2V0JyxcbiAgICAgICAgJ0FXU01hbmFnZWRSdWxlc0xpbnV4UnVsZVNldCdcbiAgICAgIF1cbiAgICB9LFxuICAgIFxuICAgIHNxbEluamVjdGlvblRlc3RzOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgdGVzdFBheWxvYWRzOiBbXG4gICAgICAgIFwiJyBPUiAnMSc9JzFcIixcbiAgICAgICAgXCInOyBEUk9QIFRBQkxFIHVzZXJzOyAtLVwiLFxuICAgICAgICBcIicgVU5JT04gU0VMRUNUICogRlJPTSB1c2VycyAtLVwiLFxuICAgICAgICBcIjEnIEFORCAoU0VMRUNUIENPVU5UKCopIEZST00gdXNlcnMpID4gMCAtLVwiLFxuICAgICAgICBcImFkbWluJy8qKi9PUi8qKi8xPTEjXCJcbiAgICAgIF0sXG4gICAgICB0YXJnZXRFbmRwb2ludHM6IFtcbiAgICAgICAgJy9hcGkvY2hhdCcsXG4gICAgICAgICcvYXBpL3NlYXJjaCcsXG4gICAgICAgICcvYXBpL2RvY3VtZW50cydcbiAgICAgIF0sXG4gICAgICBleHBlY3RlZEJsb2NrUmVzcG9uc2U6IDQwM1xuICAgIH0sXG4gICAgXG4gICAgeHNzVGVzdHM6IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICB0ZXN0UGF5bG9hZHM6IFtcbiAgICAgICAgXCI8c2NyaXB0PmFsZXJ0KCdYU1MnKTwvc2NyaXB0PlwiLFxuICAgICAgICBcImphdmFzY3JpcHQ6YWxlcnQoJ1hTUycpXCIsXG4gICAgICAgIFwiPGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KCdYU1MnKT5cIixcbiAgICAgICAgXCI8c3ZnIG9ubG9hZD1hbGVydCgnWFNTJyk+XCIsXG4gICAgICAgIFwiJzthbGVydCgnWFNTJyk7Ly9cIlxuICAgICAgXSxcbiAgICAgIHRhcmdldEVuZHBvaW50czogW1xuICAgICAgICAnL2FwaS9jaGF0JyxcbiAgICAgICAgJy9hcGkvZmVlZGJhY2snLFxuICAgICAgICAnL2FwaS91c2VyL3Byb2ZpbGUnXG4gICAgICBdLFxuICAgICAgZXhwZWN0ZWRCbG9ja1Jlc3BvbnNlOiA0MDNcbiAgICB9LFxuICAgIFxuICAgIHVuYXV0aG9yaXplZEFwaVRlc3RzOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgdGVzdEVuZHBvaW50czogW1xuICAgICAgICAnL2FwaS9hZG1pbi91c2VycycsXG4gICAgICAgICcvYXBpL2FkbWluL3NldHRpbmdzJyxcbiAgICAgICAgJy9hcGkvZG9jdW1lbnRzL3ByaXZhdGUnLFxuICAgICAgICAnL2FwaS9hbmFseXRpY3MvZGF0YSdcbiAgICAgIF0sXG4gICAgICBpbnZhbGlkVG9rZW5zOiBbXG4gICAgICAgICdpbnZhbGlkX3Rva2VuJyxcbiAgICAgICAgJ2V4cGlyZWRfdG9rZW5fMTIzNDUnLFxuICAgICAgICAnJyxcbiAgICAgICAgJ0JlYXJlciBtYWxmb3JtZWQudG9rZW4uaGVyZSdcbiAgICAgIF0sXG4gICAgICBleHBlY3RlZFJlc3BvbnNlOiA0MDFcbiAgICB9LFxuICAgIFxuICAgIHNlc3Npb25IaWphY2tpbmdUZXN0czoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHRlc3RTY2VuYXJpb3M6IFtcbiAgICAgICAgJ3Nlc3Npb25fZml4YXRpb24nLFxuICAgICAgICAnc2Vzc2lvbl9yZXBsYXknLFxuICAgICAgICAnY3Jvc3Nfc2l0ZV9zZXNzaW9uX3RyYW5zZmVyJ1xuICAgICAgXSxcbiAgICAgIHNlc3Npb25Ub2tlblBhdHRlcm5zOiBbXG4gICAgICAgICdzdG9sZW5fc2Vzc2lvbl90b2tlbicsXG4gICAgICAgICdyZXBsYXllZF9zZXNzaW9uX3Rva2VuJyxcbiAgICAgICAgJ2Nyb3NzX29yaWdpbl9zZXNzaW9uX3Rva2VuJ1xuICAgICAgXSxcbiAgICAgIGV4cGVjdGVkQmVoYXZpb3I6ICdyZWplY3RfYW5kX2ludmFsaWRhdGUnXG4gICAgfSxcbiAgICBcbiAgICByYXRlTGltaXRUZXN0czoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHJlcXVlc3RzUGVyTWludXRlOiAxMDAsXG4gICAgICBidXJzdExpbWl0OiAyMCxcbiAgICAgIHRlc3REdXJhdGlvbjogNjAwMDAsIC8vIDHliIZcbiAgICAgIGV4cGVjdGVkVGhyb3R0bGluZzogdHJ1ZVxuICAgIH1cbiAgfSBhcyBBdHRhY2tSZXNpc3RhbmNlVGVzdENvbmZpZyxcbiAgXG4gIC8vIOOCu+OCreODpeODquODhuOCo+ebo+imluODhuOCueODiOioreWumlxuICBzZWN1cml0eU1vbml0b3Jpbmc6IHtcbiAgICBjbG91ZFRyYWlsOiB7XG4gICAgICB0cmFpbE5hbWU6IHByb2Nlc3MuZW52LkNMT1VEVFJBSUxfTkFNRSB8fCAnQ2hhdGJvdFVJU2VjdXJpdHlUcmFpbCcsXG4gICAgICBzM0J1Y2tldE5hbWU6IHByb2Nlc3MuZW52LkNMT1VEVFJBSUxfUzNfQlVDS0VUIHx8ICcnLFxuICAgICAgbG9nR3JvdXBOYW1lOiBwcm9jZXNzLmVudi5DTE9VRFRSQUlMX0xPR19HUk9VUCB8fCAnL2F3cy9jbG91ZHRyYWlsL3NlY3VyaXR5JyxcbiAgICAgIGV2ZW50Q2F0ZWdvcmllczogW1xuICAgICAgICAnTWFuYWdlbWVudCcsXG4gICAgICAgICdEYXRhJyxcbiAgICAgICAgJ0luc2lnaHQnXG4gICAgICBdXG4gICAgfSxcbiAgICBcbiAgICBhbm9tYWx5RGV0ZWN0aW9uOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgbW9uaXRvcmluZ1BlcmlvZDogMzAwMDAwLCAvLyA15YiGXG4gICAgICB0aHJlc2hvbGRzOiB7XG4gICAgICAgIHJlcXVlc3RzUGVyTWludXRlOiAxMDAwLFxuICAgICAgICB1bmlxdWVJcENvdW50OiAxMDAsXG4gICAgICAgIGVycm9yUmF0ZTogMC4wNSwgLy8gNSVcbiAgICAgICAgc3VzcGljaW91c1BhdHRlcm5zOiBbXG4gICAgICAgICAgJ3JhcGlkX3NlcXVlbnRpYWxfcmVxdWVzdHMnLFxuICAgICAgICAgICdtdWx0aXBsZV9mYWlsZWRfYXV0aF9hdHRlbXB0cycsXG4gICAgICAgICAgJ3VudXN1YWxfZ2VvZ3JhcGhpY19hY2Nlc3MnLFxuICAgICAgICAgICdzdXNwaWNpb3VzX3VzZXJfYWdlbnRfcGF0dGVybnMnXG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIHNlY3VyaXR5QWxlcnRzOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgYWxlcnRUeXBlczogW1xuICAgICAgICAnd2FmX2Jsb2NrX2V2ZW50JyxcbiAgICAgICAgJ2F1dGhlbnRpY2F0aW9uX2ZhaWx1cmUnLFxuICAgICAgICAndW5hdXRob3JpemVkX2FjY2Vzc19hdHRlbXB0JyxcbiAgICAgICAgJ3N1c3BpY2lvdXNfYWN0aXZpdHlfZGV0ZWN0ZWQnLFxuICAgICAgICAnc2VjdXJpdHlfcG9saWN5X3Zpb2xhdGlvbidcbiAgICAgIF0sXG4gICAgICBub3RpZmljYXRpb25UYXJnZXRzOiBbXG4gICAgICAgIHByb2Nlc3MuZW52LlNFQ1VSSVRZX1NOU19UT1BJQyB8fCAnJyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuU0VDVVJJVFlfRU1BSUwgfHwgJ3NlY3VyaXR5QGV4YW1wbGUuY29tJ1xuICAgICAgXSxcbiAgICAgIHNldmVyaXR5TGV2ZWxzOiBbXG4gICAgICAgICdMT1cnLFxuICAgICAgICAnTUVESVVNJyxcbiAgICAgICAgJ0hJR0gnLFxuICAgICAgICAnQ1JJVElDQUwnXG4gICAgICBdXG4gICAgfSxcbiAgICBcbiAgICBsb2dBbmFseXNpczoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGFuYWx5c2lzUGF0dGVybnM6IFtcbiAgICAgICAgJ2ZhaWxlZF9hdXRoZW50aWNhdGlvbl9wYXR0ZXJucycsXG4gICAgICAgICdibG9ja2VkX3JlcXVlc3RfcGF0dGVybnMnLFxuICAgICAgICAnZXJyb3JfcmF0ZV9zcGlrZXMnLFxuICAgICAgICAnZ2VvZ3JhcGhpY19hbm9tYWxpZXMnLFxuICAgICAgICAndGltZV9iYXNlZF9hbm9tYWxpZXMnXG4gICAgICBdLFxuICAgICAgcmV0ZW50aW9uUGVyaW9kOiAyNTkyMDAwMDAwLCAvLyAzMOaXpVxuICAgICAgcmVhbFRpbWVBbmFseXNpczogdHJ1ZVxuICAgIH1cbiAgfSBhcyBTZWN1cml0eU1vbml0b3JpbmdUZXN0Q29uZmlnLFxuICBcbiAgLy8g5YWo6Iis6Kit5a6aXG4gIGdlbmVyYWw6IHtcbiAgICB0ZXN0VGltZW91dDogMzAwMDAwLCAvLyA15YiGXG4gICAgbWF4UmV0cmllczogMyxcbiAgICByZXRyeURlbGF5OiA1MDAwLCAvLyA156eSXG4gICAgcGFyYWxsZWxFeGVjdXRpb246IGZhbHNlLCAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjga/poIbmrKHlrp/ooYxcbiAgICBlbWVyZ2VuY3lTdG9wRW5hYmxlZDogdHJ1ZSxcbiAgICBkZXRhaWxlZExvZ2dpbmc6IHRydWUsXG4gICAgXG4gICAgLy8g44OG44K544OI5a6f6KGM6aCG5bqPXG4gICAgZXhlY3V0aW9uT3JkZXI6IFtcbiAgICAgICdodHRwc19lbmNyeXB0aW9uJyxcbiAgICAgICdhdHRhY2tfcmVzaXN0YW5jZScsXG4gICAgICAnc2VjdXJpdHlfbW9uaXRvcmluZydcbiAgICBdLFxuICAgIFxuICAgIC8vIOW/hemgiOODhuOCueODiO+8iOOCueOCreODg+ODl+S4jeWPr++8iVxuICAgIG1hbmRhdG9yeVRlc3RzOiBbXG4gICAgICAnaHR0cHNfcmVkaXJlY3RfdGVzdCcsXG4gICAgICAndGxzX2NlcnRpZmljYXRlX3ZhbGlkYXRpb24nLFxuICAgICAgJ3NlY3VyaXR5X2hlYWRlcnNfdmFsaWRhdGlvbicsXG4gICAgICAnc3FsX2luamVjdGlvbl9wcm90ZWN0aW9uJyxcbiAgICAgICd4c3NfcHJvdGVjdGlvbicsXG4gICAgICAndW5hdXRob3JpemVkX2FjY2Vzc19wcm90ZWN0aW9uJ1xuICAgIF0sXG4gICAgXG4gICAgLy8g5pys55Wq55Kw5aKD5Yi257SEXG4gICAgcHJvZHVjdGlvbkNvbnN0cmFpbnRzOiB7XG4gICAgICByZWFkT25seU1vZGU6IHRydWUsXG4gICAgICBub0RhdGFNb2RpZmljYXRpb246IHRydWUsXG4gICAgICBub1Jlc291cmNlQ3JlYXRpb246IHRydWUsXG4gICAgICBsaW1pdGVkVGVzdER1cmF0aW9uOiB0cnVlLFxuICAgICAgbWF4Q29uY3VycmVudFRlc3RzOiAxXG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIOOCueODhuODvOOCuOODs+OCsOeSsOWig+OCu+OCreODpeODquODhuOCo+ODhuOCueODiOioreWumlxuICovXG5leHBvcnQgY29uc3Qgc3RhZ2luZ1NlY3VyaXR5Q29uZmlnID0ge1xuICAuLi5wcm9kdWN0aW9uU2VjdXJpdHlDb25maWcsXG4gIFxuICAvLyDjgrnjg4bjg7zjgrjjg7PjgrDnkrDlooPjgafjga/kuKbliJflrp/ooYzlj6/og71cbiAgZ2VuZXJhbDoge1xuICAgIC4uLnByb2R1Y3Rpb25TZWN1cml0eUNvbmZpZy5nZW5lcmFsLFxuICAgIHBhcmFsbGVsRXhlY3V0aW9uOiB0cnVlLFxuICAgIG1heENvbmN1cnJlbnRUZXN0czogMyxcbiAgICB0ZXN0VGltZW91dDogNjAwMDAwLCAvLyAxMOWIhlxuICAgIFxuICAgIC8vIOOCueODhuODvOOCuOODs+OCsOeSsOWig+WItue0hO+8iOacrOeVquOCiOOCiue3qeOBhO+8iVxuICAgIHByb2R1Y3Rpb25Db25zdHJhaW50czoge1xuICAgICAgcmVhZE9ubHlNb2RlOiBmYWxzZSxcbiAgICAgIG5vRGF0YU1vZGlmaWNhdGlvbjogZmFsc2UsXG4gICAgICBub1Jlc291cmNlQ3JlYXRpb246IHRydWUsXG4gICAgICBsaW1pdGVkVGVzdER1cmF0aW9uOiBmYWxzZSxcbiAgICAgIG1heENvbmN1cnJlbnRUZXN0czogM1xuICAgIH1cbiAgfSxcbiAgXG4gIC8vIOOCiOOCiuepjealteeahOOBquaUu+aSg+ODhuOCueODiFxuICBhdHRhY2tSZXNpc3RhbmNlOiB7XG4gICAgLi4ucHJvZHVjdGlvblNlY3VyaXR5Q29uZmlnLmF0dGFja1Jlc2lzdGFuY2UsXG4gICAgcmF0ZUxpbWl0VGVzdHM6IHtcbiAgICAgIC4uLnByb2R1Y3Rpb25TZWN1cml0eUNvbmZpZy5hdHRhY2tSZXNpc3RhbmNlLnJhdGVMaW1pdFRlc3RzLFxuICAgICAgcmVxdWVzdHNQZXJNaW51dGU6IDIwMCxcbiAgICAgIHRlc3REdXJhdGlvbjogMTIwMDAwIC8vIDLliIZcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICog6ZaL55m655Kw5aKD44K744Kt44Ol44Oq44OG44Kj44OG44K544OI6Kit5a6aXG4gKi9cbmV4cG9ydCBjb25zdCBkZXZlbG9wbWVudFNlY3VyaXR5Q29uZmlnID0ge1xuICAuLi5wcm9kdWN0aW9uU2VjdXJpdHlDb25maWcsXG4gIFxuICAvLyDplovnmbrnkrDlooPjgafjga/ln7rmnKznmoTjgarjgrvjgq3jg6Xjg6rjg4bjgqPjg4bjgrnjg4jjga7jgb9cbiAgZ2VuZXJhbDoge1xuICAgIC4uLnByb2R1Y3Rpb25TZWN1cml0eUNvbmZpZy5nZW5lcmFsLFxuICAgIHBhcmFsbGVsRXhlY3V0aW9uOiB0cnVlLFxuICAgIG1heENvbmN1cnJlbnRUZXN0czogNSxcbiAgICB0ZXN0VGltZW91dDogMTgwMDAwLCAvLyAz5YiGXG4gICAgXG4gICAgLy8g5b+F6aCI44OG44K544OI44KS5pyA5bCP6ZmQ44GrXG4gICAgbWFuZGF0b3J5VGVzdHM6IFtcbiAgICAgICdodHRwc19yZWRpcmVjdF90ZXN0JyxcbiAgICAgICd0bHNfY2VydGlmaWNhdGVfdmFsaWRhdGlvbicsXG4gICAgICAnYmFzaWNfc2VjdXJpdHlfaGVhZGVycydcbiAgICBdLFxuICAgIFxuICAgIC8vIOmWi+eZuueSsOWig+WItue0hO+8iOacgOOCgue3qeOBhO+8iVxuICAgIHByb2R1Y3Rpb25Db25zdHJhaW50czoge1xuICAgICAgcmVhZE9ubHlNb2RlOiBmYWxzZSxcbiAgICAgIG5vRGF0YU1vZGlmaWNhdGlvbjogZmFsc2UsXG4gICAgICBub1Jlc291cmNlQ3JlYXRpb246IGZhbHNlLFxuICAgICAgbGltaXRlZFRlc3REdXJhdGlvbjogZmFsc2UsXG4gICAgICBtYXhDb25jdXJyZW50VGVzdHM6IDVcbiAgICB9XG4gIH0sXG4gIFxuICAvLyDou73ph4/jgarmlLvmkoPjg4bjgrnjg4hcbiAgYXR0YWNrUmVzaXN0YW5jZToge1xuICAgIC4uLnByb2R1Y3Rpb25TZWN1cml0eUNvbmZpZy5hdHRhY2tSZXNpc3RhbmNlLFxuICAgIHNxbEluamVjdGlvblRlc3RzOiB7XG4gICAgICAuLi5wcm9kdWN0aW9uU2VjdXJpdHlDb25maWcuYXR0YWNrUmVzaXN0YW5jZS5zcWxJbmplY3Rpb25UZXN0cyxcbiAgICAgIHRlc3RQYXlsb2FkczogcHJvZHVjdGlvblNlY3VyaXR5Q29uZmlnLmF0dGFja1Jlc2lzdGFuY2Uuc3FsSW5qZWN0aW9uVGVzdHMudGVzdFBheWxvYWRzLnNsaWNlKDAsIDIpXG4gICAgfSxcbiAgICB4c3NUZXN0czoge1xuICAgICAgLi4ucHJvZHVjdGlvblNlY3VyaXR5Q29uZmlnLmF0dGFja1Jlc2lzdGFuY2UueHNzVGVzdHMsXG4gICAgICB0ZXN0UGF5bG9hZHM6IHByb2R1Y3Rpb25TZWN1cml0eUNvbmZpZy5hdHRhY2tSZXNpc3RhbmNlLnhzc1Rlc3RzLnRlc3RQYXlsb2Fkcy5zbGljZSgwLCAyKVxuICAgIH0sXG4gICAgcmF0ZUxpbWl0VGVzdHM6IHtcbiAgICAgIC4uLnByb2R1Y3Rpb25TZWN1cml0eUNvbmZpZy5hdHRhY2tSZXNpc3RhbmNlLnJhdGVMaW1pdFRlc3RzLFxuICAgICAgZW5hYmxlZDogZmFsc2UgLy8g6ZaL55m655Kw5aKD44Gn44Gv44Os44O844OI5Yi26ZmQ44OG44K544OI44KS44K544Kt44OD44OXXG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIOeSsOWig+OBq+W/nOOBmOOBn+ioreWumuOBruWPluW+l1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VjdXJpdHlDb25maWcoZW52aXJvbm1lbnQ6IHN0cmluZykge1xuICBzd2l0Y2ggKGVudmlyb25tZW50LnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdwcm9kdWN0aW9uJzpcbiAgICBjYXNlICdwcm9kJzpcbiAgICAgIHJldHVybiBwcm9kdWN0aW9uU2VjdXJpdHlDb25maWc7XG4gICAgY2FzZSAnc3RhZ2luZyc6XG4gICAgY2FzZSAnc3RhZ2UnOlxuICAgICAgcmV0dXJuIHN0YWdpbmdTZWN1cml0eUNvbmZpZztcbiAgICBjYXNlICdkZXZlbG9wbWVudCc6XG4gICAgY2FzZSAnZGV2JzpcbiAgICAgIHJldHVybiBkZXZlbG9wbWVudFNlY3VyaXR5Q29uZmlnO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zb2xlLndhcm4oYOacquefpeOBrueSsOWigzogJHtlbnZpcm9ubWVudH0uIOmWi+eZuueSsOWig+ioreWumuOCkuS9v+eUqOOBl+OBvuOBmeOAgmApO1xuICAgICAgcmV0dXJuIGRldmVsb3BtZW50U2VjdXJpdHlDb25maWc7XG4gIH1cbn1cblxuLyoqXG4gKiDjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrprjga7mpJzoqLxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU2VjdXJpdHlDb25maWcoY29uZmlnOiBhbnkpOiB7XG4gIGlzVmFsaWQ6IGJvb2xlYW47XG4gIGVycm9yczogc3RyaW5nW107XG4gIHdhcm5pbmdzOiBzdHJpbmdbXTtcbn0ge1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIENsb3VkRnJvbnToqK3lrprjga7mpJzoqLxcbiAgaWYgKCFjb25maWcuaHR0cHNFbmNyeXB0aW9uPy5jbG91ZEZyb250RGlzdHJpYnV0aW9uPy5kb21haW5OYW1lKSB7XG4gICAgZXJyb3JzLnB1c2goJ0Nsb3VkRnJvbnTjg4njg6HjgqTjg7PlkI3jgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIC8vIFdBRuioreWumuOBruaknOiovFxuICBpZiAoIWNvbmZpZy5hdHRhY2tSZXNpc3RhbmNlPy53YWZDb25maWd1cmF0aW9uPy53ZWJBY2xJZCkge1xuICAgIGVycm9ycy5wdXNoKCdXQUYgV2ViQUNMIElE44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gIH1cblxuICAvLyBDbG91ZFRyYWls6Kit5a6a44Gu5qSc6Ki8XG4gIGlmICghY29uZmlnLnNlY3VyaXR5TW9uaXRvcmluZz8uY2xvdWRUcmFpbD8udHJhaWxOYW1lKSB7XG4gICAgd2FybmluZ3MucHVzaCgnQ2xvdWRUcmFpbOWQjeOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICB9XG5cbiAgLy8g44OG44K544OI44Ko44Oz44OJ44Od44Kk44Oz44OI44Gu5qSc6Ki8XG4gIGlmICghY29uZmlnLmh0dHBzRW5jcnlwdGlvbj8udGVzdEVuZHBvaW50cz8ubGVuZ3RoKSB7XG4gICAgd2FybmluZ3MucHVzaCgnSFRUUFPjg4bjgrnjg4jnlKjjgqjjg7Pjg4njg53jgqTjg7Pjg4jjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaXNWYWxpZDogZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICBlcnJvcnMsXG4gICAgd2FybmluZ3NcbiAgfTtcbn1cblxuLy8g44Ko44Oz44OJ44OE44O844Ko44Oz44OJ5pqX5Y+35YyW44OG44K544OI6Kit5a6a44KS6L+95YqgXG5wcm9kdWN0aW9uU2VjdXJpdHlDb25maWcuZ2VuZXJhbC5leGVjdXRpb25PcmRlci5wdXNoKCdlbmRfdG9fZW5kX2VuY3J5cHRpb24nLCAnYXV0aGVudGljYXRpb25fYXV0aG9yaXphdGlvbicpO1xuc3RhZ2luZ1NlY3VyaXR5Q29uZmlnLmdlbmVyYWwuZXhlY3V0aW9uT3JkZXIucHVzaCgnZW5kX3RvX2VuZF9lbmNyeXB0aW9uJywgJ2F1dGhlbnRpY2F0aW9uX2F1dGhvcml6YXRpb24nKTtcbmRldmVsb3BtZW50U2VjdXJpdHlDb25maWcuZ2VuZXJhbC5leGVjdXRpb25PcmRlci5wdXNoKCdlbmRfdG9fZW5kX2VuY3J5cHRpb24nLCAnYXV0aGVudGljYXRpb25fYXV0aG9yaXphdGlvbicpO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHByb2R1Y3Rpb25TZWN1cml0eUNvbmZpZyxcbiAgc3RhZ2luZ1NlY3VyaXR5Q29uZmlnLFxuICBkZXZlbG9wbWVudFNlY3VyaXR5Q29uZmlnLFxuICBnZXRTZWN1cml0eUNvbmZpZyxcbiAgdmFsaWRhdGVTZWN1cml0eUNvbmZpZ1xufTsiXX0=