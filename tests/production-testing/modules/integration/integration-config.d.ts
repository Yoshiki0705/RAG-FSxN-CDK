/**
 * 統合テスト設定
 *
 * 実本番環境でのエンドツーエンド統合テストに関する設定を管理
 * ユーザーフロー、外部システム連携、障害時フォールバック機能のテスト設定
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * 完全ユーザーフローテスト設定
 */
export interface UserFlowTestConfig {
    testScenarios: {
        basicUserFlow: {
            enabled: boolean;
            steps: string[];
            expectedDuration: number;
            timeoutPerStep: number;
        };
        authenticatedUserFlow: {
            enabled: boolean;
            steps: string[];
            expectedDuration: number;
            timeoutPerStep: number;
        };
        adminUserFlow: {
            enabled: boolean;
            steps: string[];
            expectedDuration: number;
            timeoutPerStep: number;
        };
        guestUserFlow: {
            enabled: boolean;
            steps: string[];
            expectedDuration: number;
            timeoutPerStep: number;
        };
    };
    sessionManagement: {
        testSessionCreation: boolean;
        testSessionPersistence: boolean;
        testSessionExpiration: boolean;
        testConcurrentSessions: boolean;
        maxConcurrentUsers: number;
    };
    performanceThresholds: {
        pageLoadTime: number;
        authenticationTime: number;
        chatResponseTime: number;
        documentSearchTime: number;
        overallFlowTime: number;
    };
    dataConsistencyChecks: {
        userDataConsistency: boolean;
        sessionDataConsistency: boolean;
        chatHistoryConsistency: boolean;
        documentAccessConsistency: boolean;
    };
}
/**
 * 外部システム連携テスト設定
 */
export interface ExternalSystemIntegrationConfig {
    fsxIntegration: {
        enabled: boolean;
        testEndpoints: string[];
        documentTypes: string[];
        accessPatterns: string[];
        performanceThresholds: {
            documentRetrievalTime: number;
            fileSystemResponseTime: number;
            metadataQueryTime: number;
        };
    };
    bedrockIntegration: {
        enabled: boolean;
        modelIds: string[];
        testPrompts: string[];
        responseValidation: {
            minResponseLength: number;
            maxResponseLength: number;
            languageCheck: boolean;
            contentQualityCheck: boolean;
        };
        performanceThresholds: {
            modelInvocationTime: number;
            streamingResponseTime: number;
            batchProcessingTime: number;
        };
    };
    openSearchIntegration: {
        enabled: boolean;
        indexNames: string[];
        searchQueries: string[];
        vectorSearchQueries: string[];
        performanceThresholds: {
            searchResponseTime: number;
            vectorSearchTime: number;
            indexUpdateTime: number;
        };
    };
    dynamoDbIntegration: {
        enabled: boolean;
        tableNames: string[];
        operationTypes: string[];
        performanceThresholds: {
            readOperationTime: number;
            writeOperationTime: number;
            queryOperationTime: number;
        };
    };
    cloudFrontIntegration: {
        enabled: boolean;
        distributionDomains: string[];
        cacheTestPaths: string[];
        performanceThresholds: {
            cacheHitTime: number;
            cacheMissTime: number;
            originResponseTime: number;
        };
    };
    dataFlowConsistency: {
        endToEndDataFlow: boolean;
        crossSystemDataSync: boolean;
        dataTransformationValidation: boolean;
        errorPropagationTest: boolean;
    };
}
/**
 * 障害時フォールバック機能テスト設定
 */
export interface FailoverTestConfig {
    failureSimulation: {
        enabled: boolean;
        simulationTypes: string[];
        recoveryTimeThresholds: {
            serviceRecovery: number;
            dataRecovery: number;
            userSessionRecovery: number;
        };
    };
    fallbackMechanisms: {
        serviceUnavailableHandling: {
            enabled: boolean;
            fallbackMessages: string[];
            gracefulDegradation: boolean;
        };
        dataUnavailableHandling: {
            enabled: boolean;
            cacheUtilization: boolean;
            alternativeDataSources: string[];
        };
        networkFailureHandling: {
            enabled: boolean;
            retryMechanisms: boolean;
            timeoutHandling: boolean;
        };
    };
    autoRecovery: {
        enabled: boolean;
        recoveryStrategies: string[];
        healthCheckInterval: number;
        maxRecoveryAttempts: number;
    };
    failureNotification: {
        enabled: boolean;
        notificationChannels: string[];
        escalationLevels: string[];
        responseTimeRequirements: number;
    };
}
/**
 * 本番環境統合テスト設定
 */
export declare const productionIntegrationConfig: {
    userFlowTest: UserFlowTestConfig;
    externalSystemIntegration: ExternalSystemIntegrationConfig;
    failoverTest: FailoverTestConfig;
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
            safeFailureSimulation: boolean;
        };
    };
};
/**
 * ステージング環境統合テスト設定
 */
export declare const stagingIntegrationConfig: {
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
            safeFailureSimulation: boolean;
        };
        maxRetries: number;
        retryDelay: number;
        emergencyStopEnabled: boolean;
        detailedLogging: boolean;
        executionOrder: string[];
        mandatoryTests: string[];
    };
    failoverTest: {
        failureSimulation: {
            simulationTypes: string[];
            enabled: boolean;
            recoveryTimeThresholds: {
                serviceRecovery: number;
                dataRecovery: number;
                userSessionRecovery: number;
            };
        };
        fallbackMechanisms: {
            serviceUnavailableHandling: {
                enabled: boolean;
                fallbackMessages: string[];
                gracefulDegradation: boolean;
            };
            dataUnavailableHandling: {
                enabled: boolean;
                cacheUtilization: boolean;
                alternativeDataSources: string[];
            };
            networkFailureHandling: {
                enabled: boolean;
                retryMechanisms: boolean;
                timeoutHandling: boolean;
            };
        };
        autoRecovery: {
            enabled: boolean;
            recoveryStrategies: string[];
            healthCheckInterval: number;
            maxRecoveryAttempts: number;
        };
        failureNotification: {
            enabled: boolean;
            notificationChannels: string[];
            escalationLevels: string[];
            responseTimeRequirements: number;
        };
    };
    userFlowTest: UserFlowTestConfig;
    externalSystemIntegration: ExternalSystemIntegrationConfig;
};
/**
 * 開発環境統合テスト設定
 */
export declare const developmentIntegrationConfig: {
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
            safeFailureSimulation: boolean;
        };
        maxRetries: number;
        retryDelay: number;
        emergencyStopEnabled: boolean;
        detailedLogging: boolean;
        executionOrder: string[];
    };
    userFlowTest: {
        testScenarios: {
            basicUserFlow: {
                enabled: boolean;
                steps: string[];
                expectedDuration: number;
                timeoutPerStep: number;
            };
            authenticatedUserFlow: {
                enabled: boolean;
                steps: string[];
                expectedDuration: number;
                timeoutPerStep: number;
            };
            adminUserFlow: {
                enabled: boolean;
                steps: string[];
                expectedDuration: number;
                timeoutPerStep: number;
            };
            guestUserFlow: {
                enabled: boolean;
                steps: string[];
                expectedDuration: number;
                timeoutPerStep: number;
            };
        };
        sessionManagement: {
            testSessionCreation: boolean;
            testSessionPersistence: boolean;
            testSessionExpiration: boolean;
            testConcurrentSessions: boolean;
            maxConcurrentUsers: number;
        };
        performanceThresholds: {
            pageLoadTime: number;
            authenticationTime: number;
            chatResponseTime: number;
            documentSearchTime: number;
            overallFlowTime: number;
        };
        dataConsistencyChecks: {
            userDataConsistency: boolean;
            sessionDataConsistency: boolean;
            chatHistoryConsistency: boolean;
            documentAccessConsistency: boolean;
        };
    };
    failoverTest: {
        failureSimulation: {
            enabled: boolean;
            simulationTypes: string[];
            recoveryTimeThresholds: {
                serviceRecovery: number;
                dataRecovery: number;
                userSessionRecovery: number;
            };
        };
        fallbackMechanisms: {
            serviceUnavailableHandling: {
                enabled: boolean;
                fallbackMessages: string[];
                gracefulDegradation: boolean;
            };
            dataUnavailableHandling: {
                enabled: boolean;
                cacheUtilization: boolean;
                alternativeDataSources: string[];
            };
            networkFailureHandling: {
                enabled: boolean;
                retryMechanisms: boolean;
                timeoutHandling: boolean;
            };
        };
        autoRecovery: {
            enabled: boolean;
            recoveryStrategies: string[];
            healthCheckInterval: number;
            maxRecoveryAttempts: number;
        };
        failureNotification: {
            enabled: boolean;
            notificationChannels: string[];
            escalationLevels: string[];
            responseTimeRequirements: number;
        };
    };
    externalSystemIntegration: ExternalSystemIntegrationConfig;
};
/**
 * 環境に応じた設定の取得
 */
export declare function getIntegrationConfig(environment: string): {
    userFlowTest: UserFlowTestConfig;
    externalSystemIntegration: ExternalSystemIntegrationConfig;
    failoverTest: FailoverTestConfig;
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
            safeFailureSimulation: boolean;
        };
    };
};
/**
 * 統合テスト設定の検証
 */
export declare function validateIntegrationConfig(config: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
declare const _default: {
    productionIntegrationConfig: {
        userFlowTest: UserFlowTestConfig;
        externalSystemIntegration: ExternalSystemIntegrationConfig;
        failoverTest: FailoverTestConfig;
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
                safeFailureSimulation: boolean;
            };
        };
    };
    stagingIntegrationConfig: {
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
                safeFailureSimulation: boolean;
            };
            maxRetries: number;
            retryDelay: number;
            emergencyStopEnabled: boolean;
            detailedLogging: boolean;
            executionOrder: string[];
            mandatoryTests: string[];
        };
        failoverTest: {
            failureSimulation: {
                simulationTypes: string[];
                enabled: boolean;
                recoveryTimeThresholds: {
                    serviceRecovery: number;
                    dataRecovery: number;
                    userSessionRecovery: number;
                };
            };
            fallbackMechanisms: {
                serviceUnavailableHandling: {
                    enabled: boolean;
                    fallbackMessages: string[];
                    gracefulDegradation: boolean;
                };
                dataUnavailableHandling: {
                    enabled: boolean;
                    cacheUtilization: boolean;
                    alternativeDataSources: string[];
                };
                networkFailureHandling: {
                    enabled: boolean;
                    retryMechanisms: boolean;
                    timeoutHandling: boolean;
                };
            };
            autoRecovery: {
                enabled: boolean;
                recoveryStrategies: string[];
                healthCheckInterval: number;
                maxRecoveryAttempts: number;
            };
            failureNotification: {
                enabled: boolean;
                notificationChannels: string[];
                escalationLevels: string[];
                responseTimeRequirements: number;
            };
        };
        userFlowTest: UserFlowTestConfig;
        externalSystemIntegration: ExternalSystemIntegrationConfig;
    };
    developmentIntegrationConfig: {
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
                safeFailureSimulation: boolean;
            };
            maxRetries: number;
            retryDelay: number;
            emergencyStopEnabled: boolean;
            detailedLogging: boolean;
            executionOrder: string[];
        };
        userFlowTest: {
            testScenarios: {
                basicUserFlow: {
                    enabled: boolean;
                    steps: string[];
                    expectedDuration: number;
                    timeoutPerStep: number;
                };
                authenticatedUserFlow: {
                    enabled: boolean;
                    steps: string[];
                    expectedDuration: number;
                    timeoutPerStep: number;
                };
                adminUserFlow: {
                    enabled: boolean;
                    steps: string[];
                    expectedDuration: number;
                    timeoutPerStep: number;
                };
                guestUserFlow: {
                    enabled: boolean;
                    steps: string[];
                    expectedDuration: number;
                    timeoutPerStep: number;
                };
            };
            sessionManagement: {
                testSessionCreation: boolean;
                testSessionPersistence: boolean;
                testSessionExpiration: boolean;
                testConcurrentSessions: boolean;
                maxConcurrentUsers: number;
            };
            performanceThresholds: {
                pageLoadTime: number;
                authenticationTime: number;
                chatResponseTime: number;
                documentSearchTime: number;
                overallFlowTime: number;
            };
            dataConsistencyChecks: {
                userDataConsistency: boolean;
                sessionDataConsistency: boolean;
                chatHistoryConsistency: boolean;
                documentAccessConsistency: boolean;
            };
        };
        failoverTest: {
            failureSimulation: {
                enabled: boolean;
                simulationTypes: string[];
                recoveryTimeThresholds: {
                    serviceRecovery: number;
                    dataRecovery: number;
                    userSessionRecovery: number;
                };
            };
            fallbackMechanisms: {
                serviceUnavailableHandling: {
                    enabled: boolean;
                    fallbackMessages: string[];
                    gracefulDegradation: boolean;
                };
                dataUnavailableHandling: {
                    enabled: boolean;
                    cacheUtilization: boolean;
                    alternativeDataSources: string[];
                };
                networkFailureHandling: {
                    enabled: boolean;
                    retryMechanisms: boolean;
                    timeoutHandling: boolean;
                };
            };
            autoRecovery: {
                enabled: boolean;
                recoveryStrategies: string[];
                healthCheckInterval: number;
                maxRecoveryAttempts: number;
            };
            failureNotification: {
                enabled: boolean;
                notificationChannels: string[];
                escalationLevels: string[];
                responseTimeRequirements: number;
            };
        };
        externalSystemIntegration: ExternalSystemIntegrationConfig;
    };
    getIntegrationConfig: typeof getIntegrationConfig;
    validateIntegrationConfig: typeof validateIntegrationConfig;
};
export default _default;
