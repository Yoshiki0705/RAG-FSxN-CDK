/**
 * セキュリティテスト設定
 *
 * 実本番環境でのセキュリティテストに関する設定を管理
 * HTTPS暗号化、WAF防御、攻撃耐性、セキュリティ監視のテスト設定
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * HTTPS暗号化テスト設定
 */
export interface HttpsEncryptionTestConfig {
    cloudFrontDistribution: {
        domainName: string;
        distributionId: string;
        originDomainName: string;
    };
    tlsCertificate: {
        certificateArn: string;
        expectedSubject: string;
        minimumTlsVersion: string;
        supportedProtocols: string[];
    };
    securityHeaders: {
        strictTransportSecurity: {
            enabled: boolean;
            maxAge: number;
            includeSubdomains: boolean;
        };
        contentSecurityPolicy: {
            enabled: boolean;
            directives: Record<string, string>;
        };
        xFrameOptions: {
            enabled: boolean;
            value: string;
        };
        xContentTypeOptions: {
            enabled: boolean;
            value: string;
        };
        referrerPolicy: {
            enabled: boolean;
            value: string;
        };
    };
    testEndpoints: string[];
    httpRedirectTest: boolean;
    mixedContentTest: boolean;
    certificateValidityTest: boolean;
}
/**
 * 攻撃耐性テスト設定
 */
export interface AttackResistanceTestConfig {
    wafConfiguration: {
        webAclId: string;
        webAclName: string;
        associatedResources: string[];
        ruleGroups: string[];
    };
    sqlInjectionTests: {
        enabled: boolean;
        testPayloads: string[];
        targetEndpoints: string[];
        expectedBlockResponse: number;
    };
    xssTests: {
        enabled: boolean;
        testPayloads: string[];
        targetEndpoints: string[];
        expectedBlockResponse: number;
    };
    unauthorizedApiTests: {
        enabled: boolean;
        testEndpoints: string[];
        invalidTokens: string[];
        expectedResponse: number;
    };
    sessionHijackingTests: {
        enabled: boolean;
        testScenarios: string[];
        sessionTokenPatterns: string[];
        expectedBehavior: string;
    };
    rateLimitTests: {
        enabled: boolean;
        requestsPerMinute: number;
        burstLimit: number;
        testDuration: number;
        expectedThrottling: boolean;
    };
}
/**
 * セキュリティ監視テスト設定
 */
export interface SecurityMonitoringTestConfig {
    cloudTrail: {
        trailName: string;
        s3BucketName: string;
        logGroupName: string;
        eventCategories: string[];
    };
    anomalyDetection: {
        enabled: boolean;
        monitoringPeriod: number;
        thresholds: {
            requestsPerMinute: number;
            uniqueIpCount: number;
            errorRate: number;
            suspiciousPatterns: string[];
        };
    };
    securityAlerts: {
        enabled: boolean;
        alertTypes: string[];
        notificationTargets: string[];
        severityLevels: string[];
    };
    logAnalysis: {
        enabled: boolean;
        analysisPatterns: string[];
        retentionPeriod: number;
        realTimeAnalysis: boolean;
    };
}
/**
 * 本番環境セキュリティテスト設定
 */
export declare const productionSecurityConfig: {
    httpsEncryption: HttpsEncryptionTestConfig;
    attackResistance: AttackResistanceTestConfig;
    securityMonitoring: SecurityMonitoringTestConfig;
    general: {
        testTimeout: number;
        maxRetries: number;
        retryDelay: number;
        parallelExecution: boolean;
        emergencyStopEnabled: boolean;
        detailedLogging: boolean;
        executionOrder: string[];
        mandatoryTests: string[];
        productionConstraints: {
            readOnlyMode: boolean;
            noDataModification: boolean;
            noResourceCreation: boolean;
            limitedTestDuration: boolean;
            maxConcurrentTests: number;
        };
    };
};
/**
 * ステージング環境セキュリティテスト設定
 */
export declare const stagingSecurityConfig: {
    general: {
        parallelExecution: boolean;
        maxConcurrentTests: number;
        testTimeout: number;
        productionConstraints: {
            readOnlyMode: boolean;
            noDataModification: boolean;
            noResourceCreation: boolean;
            limitedTestDuration: boolean;
            maxConcurrentTests: number;
        };
        maxRetries: number;
        retryDelay: number;
        emergencyStopEnabled: boolean;
        detailedLogging: boolean;
        executionOrder: string[];
        mandatoryTests: string[];
    };
    attackResistance: {
        rateLimitTests: {
            requestsPerMinute: number;
            testDuration: number;
            enabled: boolean;
            burstLimit: number;
            expectedThrottling: boolean;
        };
        wafConfiguration: {
            webAclId: string;
            webAclName: string;
            associatedResources: string[];
            ruleGroups: string[];
        };
        sqlInjectionTests: {
            enabled: boolean;
            testPayloads: string[];
            targetEndpoints: string[];
            expectedBlockResponse: number;
        };
        xssTests: {
            enabled: boolean;
            testPayloads: string[];
            targetEndpoints: string[];
            expectedBlockResponse: number;
        };
        unauthorizedApiTests: {
            enabled: boolean;
            testEndpoints: string[];
            invalidTokens: string[];
            expectedResponse: number;
        };
        sessionHijackingTests: {
            enabled: boolean;
            testScenarios: string[];
            sessionTokenPatterns: string[];
            expectedBehavior: string;
        };
    };
    httpsEncryption: HttpsEncryptionTestConfig;
    securityMonitoring: SecurityMonitoringTestConfig;
};
/**
 * 開発環境セキュリティテスト設定
 */
export declare const developmentSecurityConfig: {
    general: {
        parallelExecution: boolean;
        maxConcurrentTests: number;
        testTimeout: number;
        mandatoryTests: string[];
        productionConstraints: {
            readOnlyMode: boolean;
            noDataModification: boolean;
            noResourceCreation: boolean;
            limitedTestDuration: boolean;
            maxConcurrentTests: number;
        };
        maxRetries: number;
        retryDelay: number;
        emergencyStopEnabled: boolean;
        detailedLogging: boolean;
        executionOrder: string[];
    };
    attackResistance: {
        sqlInjectionTests: {
            testPayloads: string[];
            enabled: boolean;
            targetEndpoints: string[];
            expectedBlockResponse: number;
        };
        xssTests: {
            testPayloads: string[];
            enabled: boolean;
            targetEndpoints: string[];
            expectedBlockResponse: number;
        };
        rateLimitTests: {
            enabled: boolean;
            requestsPerMinute: number;
            burstLimit: number;
            testDuration: number;
            expectedThrottling: boolean;
        };
        wafConfiguration: {
            webAclId: string;
            webAclName: string;
            associatedResources: string[];
            ruleGroups: string[];
        };
        unauthorizedApiTests: {
            enabled: boolean;
            testEndpoints: string[];
            invalidTokens: string[];
            expectedResponse: number;
        };
        sessionHijackingTests: {
            enabled: boolean;
            testScenarios: string[];
            sessionTokenPatterns: string[];
            expectedBehavior: string;
        };
    };
    httpsEncryption: HttpsEncryptionTestConfig;
    securityMonitoring: SecurityMonitoringTestConfig;
};
/**
 * 環境に応じた設定の取得
 */
export declare function getSecurityConfig(environment: string): {
    httpsEncryption: HttpsEncryptionTestConfig;
    attackResistance: AttackResistanceTestConfig;
    securityMonitoring: SecurityMonitoringTestConfig;
    general: {
        testTimeout: number;
        maxRetries: number;
        retryDelay: number;
        parallelExecution: boolean;
        emergencyStopEnabled: boolean;
        detailedLogging: boolean;
        executionOrder: string[];
        mandatoryTests: string[];
        productionConstraints: {
            readOnlyMode: boolean;
            noDataModification: boolean;
            noResourceCreation: boolean;
            limitedTestDuration: boolean;
            maxConcurrentTests: number;
        };
    };
};
/**
 * セキュリティ設定の検証
 */
export declare function validateSecurityConfig(config: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
declare const _default: {
    productionSecurityConfig: {
        httpsEncryption: HttpsEncryptionTestConfig;
        attackResistance: AttackResistanceTestConfig;
        securityMonitoring: SecurityMonitoringTestConfig;
        general: {
            testTimeout: number;
            maxRetries: number;
            retryDelay: number;
            parallelExecution: boolean;
            emergencyStopEnabled: boolean;
            detailedLogging: boolean;
            executionOrder: string[];
            mandatoryTests: string[];
            productionConstraints: {
                readOnlyMode: boolean;
                noDataModification: boolean;
                noResourceCreation: boolean;
                limitedTestDuration: boolean;
                maxConcurrentTests: number;
            };
        };
    };
    stagingSecurityConfig: {
        general: {
            parallelExecution: boolean;
            maxConcurrentTests: number;
            testTimeout: number;
            productionConstraints: {
                readOnlyMode: boolean;
                noDataModification: boolean;
                noResourceCreation: boolean;
                limitedTestDuration: boolean;
                maxConcurrentTests: number;
            };
            maxRetries: number;
            retryDelay: number;
            emergencyStopEnabled: boolean;
            detailedLogging: boolean;
            executionOrder: string[];
            mandatoryTests: string[];
        };
        attackResistance: {
            rateLimitTests: {
                requestsPerMinute: number;
                testDuration: number;
                enabled: boolean;
                burstLimit: number;
                expectedThrottling: boolean;
            };
            wafConfiguration: {
                webAclId: string;
                webAclName: string;
                associatedResources: string[];
                ruleGroups: string[];
            };
            sqlInjectionTests: {
                enabled: boolean;
                testPayloads: string[];
                targetEndpoints: string[];
                expectedBlockResponse: number;
            };
            xssTests: {
                enabled: boolean;
                testPayloads: string[];
                targetEndpoints: string[];
                expectedBlockResponse: number;
            };
            unauthorizedApiTests: {
                enabled: boolean;
                testEndpoints: string[];
                invalidTokens: string[];
                expectedResponse: number;
            };
            sessionHijackingTests: {
                enabled: boolean;
                testScenarios: string[];
                sessionTokenPatterns: string[];
                expectedBehavior: string;
            };
        };
        httpsEncryption: HttpsEncryptionTestConfig;
        securityMonitoring: SecurityMonitoringTestConfig;
    };
    developmentSecurityConfig: {
        general: {
            parallelExecution: boolean;
            maxConcurrentTests: number;
            testTimeout: number;
            mandatoryTests: string[];
            productionConstraints: {
                readOnlyMode: boolean;
                noDataModification: boolean;
                noResourceCreation: boolean;
                limitedTestDuration: boolean;
                maxConcurrentTests: number;
            };
            maxRetries: number;
            retryDelay: number;
            emergencyStopEnabled: boolean;
            detailedLogging: boolean;
            executionOrder: string[];
        };
        attackResistance: {
            sqlInjectionTests: {
                testPayloads: string[];
                enabled: boolean;
                targetEndpoints: string[];
                expectedBlockResponse: number;
            };
            xssTests: {
                testPayloads: string[];
                enabled: boolean;
                targetEndpoints: string[];
                expectedBlockResponse: number;
            };
            rateLimitTests: {
                enabled: boolean;
                requestsPerMinute: number;
                burstLimit: number;
                testDuration: number;
                expectedThrottling: boolean;
            };
            wafConfiguration: {
                webAclId: string;
                webAclName: string;
                associatedResources: string[];
                ruleGroups: string[];
            };
            unauthorizedApiTests: {
                enabled: boolean;
                testEndpoints: string[];
                invalidTokens: string[];
                expectedResponse: number;
            };
            sessionHijackingTests: {
                enabled: boolean;
                testScenarios: string[];
                sessionTokenPatterns: string[];
                expectedBehavior: string;
            };
        };
        httpsEncryption: HttpsEncryptionTestConfig;
        securityMonitoring: SecurityMonitoringTestConfig;
    };
    getSecurityConfig: typeof getSecurityConfig;
    validateSecurityConfig: typeof validateSecurityConfig;
};
export default _default;
