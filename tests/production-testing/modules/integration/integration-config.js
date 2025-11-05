"use strict";
/**
 * 統合テスト設定
 *
 * 実本番環境でのエンドツーエンド統合テストに関する設定を管理
 * ユーザーフロー、外部システム連携、障害時フォールバック機能のテスト設定
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.developmentIntegrationConfig = exports.stagingIntegrationConfig = exports.productionIntegrationConfig = void 0;
exports.getIntegrationConfig = getIntegrationConfig;
exports.validateIntegrationConfig = validateIntegrationConfig;
/**
 * 本番環境統合テスト設定
 */
exports.productionIntegrationConfig = {
    // 完全ユーザーフローテスト設定
    userFlowTest: {
        testScenarios: {
            basicUserFlow: {
                enabled: true,
                steps: [
                    'navigate_to_homepage',
                    'verify_page_load',
                    'access_chat_interface',
                    'send_basic_question',
                    'receive_response',
                    'verify_response_quality'
                ],
                expectedDuration: 30000, // 30秒
                timeoutPerStep: 10000 // 10秒
            },
            authenticatedUserFlow: {
                enabled: true,
                steps: [
                    'navigate_to_homepage',
                    'initiate_login',
                    'authenticate_user',
                    'verify_authentication',
                    'access_protected_content',
                    'send_authenticated_question',
                    'receive_personalized_response',
                    'verify_access_control',
                    'logout_user'
                ],
                expectedDuration: 60000, // 60秒
                timeoutPerStep: 15000 // 15秒
            },
            adminUserFlow: {
                enabled: true,
                steps: [
                    'navigate_to_homepage',
                    'admin_login',
                    'verify_admin_privileges',
                    'access_admin_functions',
                    'perform_admin_operations',
                    'verify_admin_access_control',
                    'admin_logout'
                ],
                expectedDuration: 45000, // 45秒
                timeoutPerStep: 12000 // 12秒
            },
            guestUserFlow: {
                enabled: true,
                steps: [
                    'navigate_to_homepage',
                    'access_public_content',
                    'send_guest_question',
                    'receive_limited_response',
                    'verify_guest_restrictions'
                ],
                expectedDuration: 20000, // 20秒
                timeoutPerStep: 8000 // 8秒
            }
        },
        sessionManagement: {
            testSessionCreation: true,
            testSessionPersistence: true,
            testSessionExpiration: true,
            testConcurrentSessions: true,
            maxConcurrentUsers: 25
        },
        performanceThresholds: {
            pageLoadTime: 3000, // 3秒
            authenticationTime: 5000, // 5秒
            chatResponseTime: 10000, // 10秒
            documentSearchTime: 8000, // 8秒
            overallFlowTime: 60000 // 60秒
        },
        dataConsistencyChecks: {
            userDataConsistency: true,
            sessionDataConsistency: true,
            chatHistoryConsistency: true,
            documentAccessConsistency: true
        }
    },
    // 外部システム連携テスト設定
    externalSystemIntegration: {
        fsxIntegration: {
            enabled: true,
            testEndpoints: [
                '/api/documents/list',
                '/api/documents/search',
                '/api/documents/content'
            ],
            documentTypes: ['pdf', 'docx', 'txt', 'md'],
            accessPatterns: ['read', 'search', 'metadata'],
            performanceThresholds: {
                documentRetrievalTime: 5000, // 5秒
                fileSystemResponseTime: 3000, // 3秒
                metadataQueryTime: 2000 // 2秒
            }
        },
        bedrockIntegration: {
            enabled: true,
            modelIds: [
                'amazon.nova-lite-v1:0',
                'amazon.nova-micro-v1:0'
            ],
            testPrompts: [
                '日本語で簡単な質問に答えてください',
                'この文書の内容を要約してください',
                '技術的な質問について詳しく説明してください'
            ],
            responseValidation: {
                minResponseLength: 10,
                maxResponseLength: 2000,
                languageCheck: true,
                contentQualityCheck: true
            },
            performanceThresholds: {
                modelInvocationTime: 8000, // 8秒
                streamingResponseTime: 12000, // 12秒
                batchProcessingTime: 30000 // 30秒
            }
        },
        openSearchIntegration: {
            enabled: true,
            indexNames: [
                process.env.OPENSEARCH_INDEX_NAME || 'documents-index',
                process.env.OPENSEARCH_VECTOR_INDEX || 'vector-index'
            ],
            searchQueries: [
                'テスト文書',
                '技術仕様',
                'ユーザーガイド'
            ],
            vectorSearchQueries: [
                'similar documents',
                'related content',
                'semantic search'
            ],
            performanceThresholds: {
                searchResponseTime: 3000, // 3秒
                vectorSearchTime: 5000, // 5秒
                indexUpdateTime: 10000 // 10秒
            }
        },
        dynamoDbIntegration: {
            enabled: true,
            tableNames: [
                process.env.DYNAMODB_SESSION_TABLE || 'user-sessions',
                process.env.DYNAMODB_USER_TABLE || 'users'
            ],
            operationTypes: ['read', 'write', 'query', 'scan'],
            performanceThresholds: {
                readOperationTime: 1000, // 1秒
                writeOperationTime: 2000, // 2秒
                queryOperationTime: 3000 // 3秒
            }
        },
        cloudFrontIntegration: {
            enabled: true,
            distributionDomains: [
                process.env.CLOUDFRONT_DOMAIN_NAME || 'example.cloudfront.net'
            ],
            cacheTestPaths: [
                '/',
                '/static/css/main.css',
                '/static/js/main.js',
                '/api/health'
            ],
            performanceThresholds: {
                cacheHitTime: 500, // 0.5秒
                cacheMissTime: 2000, // 2秒
                originResponseTime: 3000 // 3秒
            }
        },
        dataFlowConsistency: {
            endToEndDataFlow: true,
            crossSystemDataSync: true,
            dataTransformationValidation: true,
            errorPropagationTest: true
        }
    },
    // 障害時フォールバック機能テスト設定
    failoverTest: {
        failureSimulation: {
            enabled: true,
            simulationTypes: [
                'service_unavailable',
                'network_timeout',
                'database_connection_failure',
                'external_api_failure'
            ],
            recoveryTimeThresholds: {
                serviceRecovery: 30000, // 30秒
                dataRecovery: 60000, // 60秒
                userSessionRecovery: 15000 // 15秒
            }
        },
        fallbackMechanisms: {
            serviceUnavailableHandling: {
                enabled: true,
                fallbackMessages: [
                    'サービスが一時的に利用できません。しばらくお待ちください。',
                    'システムメンテナンス中です。後ほど再度お試しください。',
                    '申し訳ございませんが、現在サービスに接続できません。'
                ],
                gracefulDegradation: true
            },
            dataUnavailableHandling: {
                enabled: true,
                cacheUtilization: true,
                alternativeDataSources: [
                    'local_cache',
                    'backup_database',
                    'static_content'
                ]
            },
            networkFailureHandling: {
                enabled: true,
                retryMechanisms: true,
                timeoutHandling: true
            }
        },
        autoRecovery: {
            enabled: true,
            recoveryStrategies: [
                'service_restart',
                'connection_retry',
                'fallback_activation',
                'cache_refresh'
            ],
            healthCheckInterval: 30000, // 30秒
            maxRecoveryAttempts: 3
        },
        failureNotification: {
            enabled: true,
            notificationChannels: [
                process.env.ALERT_SNS_TOPIC || '',
                process.env.ALERT_EMAIL || 'admin@example.com'
            ],
            escalationLevels: ['info', 'warning', 'critical'],
            responseTimeRequirements: 300000 // 5分
        }
    },
    // 全般設定
    general: {
        testTimeout: 600000, // 10分
        maxRetries: 3,
        retryDelay: 10000, // 10秒
        parallelExecution: false, // 統合テストは順次実行
        emergencyStopEnabled: true,
        detailedLogging: true,
        // テスト実行順序
        executionOrder: [
            'user_flow_test',
            'external_system_integration',
            'failover_test'
        ],
        // 必須テスト（スキップ不可）
        mandatoryTests: [
            'basic_user_flow',
            'authenticated_user_flow',
            'fsx_integration',
            'bedrock_integration',
            'opensearch_integration',
            'service_unavailable_handling'
        ],
        // 本番環境制約
        productionConstraints: {
            readOnlyMode: true,
            noDataModification: true,
            noResourceCreation: true,
            limitedTestDuration: true,
            maxConcurrentTests: 1,
            safeFailureSimulation: true // 安全な障害シミュレーションのみ
        }
    }
};
/**
 * ステージング環境統合テスト設定
 */
exports.stagingIntegrationConfig = {
    ...exports.productionIntegrationConfig,
    // ステージング環境では並列実行可能
    general: {
        ...exports.productionIntegrationConfig.general,
        parallelExecution: true,
        maxConcurrentTests: 3,
        testTimeout: 900000, // 15分
        // ステージング環境制約（本番より緩い）
        productionConstraints: {
            readOnlyMode: false,
            noDataModification: false,
            noResourceCreation: true,
            limitedTestDuration: false,
            maxConcurrentTests: 3,
            safeFailureSimulation: false // より積極的な障害シミュレーション
        }
    },
    // より積極的な障害テスト
    failoverTest: {
        ...exports.productionIntegrationConfig.failoverTest,
        failureSimulation: {
            ...exports.productionIntegrationConfig.failoverTest.failureSimulation,
            simulationTypes: [
                ...exports.productionIntegrationConfig.failoverTest.failureSimulation.simulationTypes,
                'memory_exhaustion',
                'disk_full',
                'cpu_overload'
            ]
        }
    }
};
/**
 * 開発環境統合テスト設定
 */
exports.developmentIntegrationConfig = {
    ...exports.productionIntegrationConfig,
    // 開発環境では基本的な統合テストのみ
    general: {
        ...exports.productionIntegrationConfig.general,
        parallelExecution: true,
        maxConcurrentTests: 5,
        testTimeout: 300000, // 5分
        // 必須テストを最小限に
        mandatoryTests: [
            'basic_user_flow',
            'fsx_integration',
            'bedrock_integration'
        ],
        // 開発環境制約（最も緩い）
        productionConstraints: {
            readOnlyMode: false,
            noDataModification: false,
            noResourceCreation: false,
            limitedTestDuration: false,
            maxConcurrentTests: 5,
            safeFailureSimulation: false
        }
    },
    // 軽量な統合テスト
    userFlowTest: {
        ...exports.productionIntegrationConfig.userFlowTest,
        testScenarios: {
            basicUserFlow: exports.productionIntegrationConfig.userFlowTest.testScenarios.basicUserFlow,
            authenticatedUserFlow: {
                ...exports.productionIntegrationConfig.userFlowTest.testScenarios.authenticatedUserFlow,
                enabled: false // 開発環境では認証フローをスキップ
            },
            adminUserFlow: {
                ...exports.productionIntegrationConfig.userFlowTest.testScenarios.adminUserFlow,
                enabled: false // 開発環境では管理者フローをスキップ
            },
            guestUserFlow: exports.productionIntegrationConfig.userFlowTest.testScenarios.guestUserFlow
        }
    },
    // 軽量な障害テスト
    failoverTest: {
        ...exports.productionIntegrationConfig.failoverTest,
        failureSimulation: {
            ...exports.productionIntegrationConfig.failoverTest.failureSimulation,
            enabled: false // 開発環境では障害シミュレーションをスキップ
        }
    }
};
/**
 * 環境に応じた設定の取得
 */
function getIntegrationConfig(environment) {
    switch (environment.toLowerCase()) {
        case 'production':
        case 'prod':
            return exports.productionIntegrationConfig;
        case 'staging':
        case 'stage':
            return exports.stagingIntegrationConfig;
        case 'development':
        case 'dev':
            return exports.developmentIntegrationConfig;
        default:
            console.warn(`未知の環境: ${environment}. 開発環境設定を使用します。`);
            return exports.developmentIntegrationConfig;
    }
}
/**
 * 統合テスト設定の検証
 */
function validateIntegrationConfig(config) {
    const errors = [];
    const warnings = [];
    // ユーザーフローテスト設定の検証
    if (!config.userFlowTest?.testScenarios) {
        errors.push('ユーザーフローテストシナリオが設定されていません');
    }
    // 外部システム連携設定の検証
    if (!config.externalSystemIntegration) {
        errors.push('外部システム連携設定が設定されていません');
    }
    // パフォーマンス閾値の検証
    const thresholds = config.userFlowTest?.performanceThresholds;
    if (thresholds) {
        Object.entries(thresholds).forEach(([key, value]) => {
            if (typeof value !== 'number' || value <= 0) {
                errors.push(`無効なパフォーマンス閾値: ${key}`);
            }
        });
    }
    // 本番環境制約の確認
    if (config.general?.productionConstraints?.readOnlyMode === false) {
        warnings.push('本番環境で読み取り専用モードが無効になっています');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
exports.default = {
    productionIntegrationConfig: exports.productionIntegrationConfig,
    stagingIntegrationConfig: exports.stagingIntegrationConfig,
    developmentIntegrationConfig: exports.developmentIntegrationConfig,
    getIntegrationConfig,
    validateIntegrationConfig
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyYXRpb24tY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWdyYXRpb24tY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBOGtCSCxvREFlQztBQUtELDhEQXNDQztBQXZjRDs7R0FFRztBQUNVLFFBQUEsMkJBQTJCLEdBQUc7SUFDekMsaUJBQWlCO0lBQ2pCLFlBQVksRUFBRTtRQUNaLGFBQWEsRUFBRTtZQUNiLGFBQWEsRUFBRTtnQkFDYixPQUFPLEVBQUUsSUFBSTtnQkFDYixLQUFLLEVBQUU7b0JBQ0wsc0JBQXNCO29CQUN0QixrQkFBa0I7b0JBQ2xCLHVCQUF1QjtvQkFDdkIscUJBQXFCO29CQUNyQixrQkFBa0I7b0JBQ2xCLHlCQUF5QjtpQkFDMUI7Z0JBQ0QsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLE1BQU07Z0JBQy9CLGNBQWMsRUFBRSxLQUFLLENBQUMsTUFBTTthQUM3QjtZQUNELHFCQUFxQixFQUFFO2dCQUNyQixPQUFPLEVBQUUsSUFBSTtnQkFDYixLQUFLLEVBQUU7b0JBQ0wsc0JBQXNCO29CQUN0QixnQkFBZ0I7b0JBQ2hCLG1CQUFtQjtvQkFDbkIsdUJBQXVCO29CQUN2QiwwQkFBMEI7b0JBQzFCLDZCQUE2QjtvQkFDN0IsK0JBQStCO29CQUMvQix1QkFBdUI7b0JBQ3ZCLGFBQWE7aUJBQ2Q7Z0JBQ0QsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLE1BQU07Z0JBQy9CLGNBQWMsRUFBRSxLQUFLLENBQUMsTUFBTTthQUM3QjtZQUNELGFBQWEsRUFBRTtnQkFDYixPQUFPLEVBQUUsSUFBSTtnQkFDYixLQUFLLEVBQUU7b0JBQ0wsc0JBQXNCO29CQUN0QixhQUFhO29CQUNiLHlCQUF5QjtvQkFDekIsd0JBQXdCO29CQUN4QiwwQkFBMEI7b0JBQzFCLDZCQUE2QjtvQkFDN0IsY0FBYztpQkFDZjtnQkFDRCxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsTUFBTTtnQkFDL0Is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bnRlbnQiOlsiLyoqXG4gKiDntbHlkIjjg4bjgrnjg4joqK3lrppcbiAqIFxuICog5a6f5pys55Wq55Kw5aKD44Gn44Gu44Ko44Oz44OJ44OE44O844Ko44Oz44OJ57Wx5ZCI44OG44K544OI44Gr6Zai44GZ44KL6Kit5a6a44KS566h55CGXG4gKiDjg6bjg7zjgrbjg7zjg5Xjg63jg7zjgIHlpJbpg6jjgrfjgrnjg4bjg6DpgKPmkLrjgIHpmpzlrrPmmYLjg5Xjgqnjg7zjg6vjg5Djg4Pjgq/mqZ/og73jga7jg4bjgrnjg4joqK3lrppcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbi8qKlxuICog5a6M5YWo44Om44O844K244O844OV44Ot44O844OG44K544OI6Kit5a6aXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVXNlckZsb3dUZXN0Q29uZmlnIHtcbiAgLy8g44OG44K544OI44K344OK44Oq44Kq6Kit5a6aXG4gIHRlc3RTY2VuYXJpb3M6IHtcbiAgICBiYXNpY1VzZXJGbG93OiB7XG4gICAgICBlbmFibGVkOiBib29sZWFuO1xuICAgICAgc3RlcHM6IHN0cmluZ1tdO1xuICAgICAgZXhwZWN0ZWREdXJhdGlvbjogbnVtYmVyO1xuICAgICAgdGltZW91dFBlclN0ZXA6IG51bWJlcjtcbiAgICB9O1xuICAgIGF1dGhlbnRpY2F0ZWRVc2VyRmxvdzoge1xuICAgICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICAgIHN0ZXBzOiBzdHJpbmdbXTtcbiAgICAgIGV4cGVjdGVkRHVyYXRpb246IG51bWJlcjtcbiAgICAgIHRpbWVvdXRQZXJTdGVwOiBudW1iZXI7XG4gICAgfTtcbiAgICBhZG1pblVzZXJGbG93OiB7XG4gICAgICBlbmFibGVkOiBib29sZWFuO1xuICAgICAgc3RlcHM6IHN0cmluZ1tdO1xuICAgICAgZXhwZWN0ZWREdXJhdGlvbjogbnVtYmVyO1xuICAgICAgdGltZW91dFBlclN0ZXA6IG51bWJlcjtcbiAgICB9O1xuICAgIGd1ZXN0VXNlckZsb3c6IHtcbiAgICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgICBzdGVwczogc3RyaW5nW107XG4gICAgICBleHBlY3RlZER1cmF0aW9uOiBudW1iZXI7XG4gICAgICB0aW1lb3V0UGVyU3RlcDogbnVtYmVyO1xuICAgIH07XG4gIH07XG4gIFxuICAvLyDjg6bjg7zjgrbjg7zjgrvjg4Pjgrfjg6fjg7PoqK3lrppcbiAgc2Vzc2lvbk1hbmFnZW1lbnQ6IHtcbiAgICB0ZXN0U2Vzc2lvbkNyZWF0aW9uOiBib29sZWFuO1xuICAgIHRlc3RTZXNzaW9uUGVyc2lzdGVuY2U6IGJvb2xlYW47XG4gICAgdGVzdFNlc3Npb25FeHBpcmF0aW9uOiBib29sZWFuO1xuICAgIHRlc3RDb25jdXJyZW50U2Vzc2lvbnM6IGJvb2xlYW47XG4gICAgbWF4Q29uY3VycmVudFVzZXJzOiBudW1iZXI7XG4gIH07XG4gIFxuICAvLyDjgqjjg7Pjg4njg4Tjg7zjgqjjg7Pjg4nlv5znrZTmmYLplpPoqK3lrppcbiAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgcGFnZUxvYWRUaW1lOiBudW1iZXI7XG4gICAgYXV0aGVudGljYXRpb25UaW1lOiBudW1iZXI7XG4gICAgY2hhdFJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIGRvY3VtZW50U2VhcmNoVGltZTogbnVtYmVyO1xuICAgIG92ZXJhbGxGbG93VGltZTogbnVtYmVyO1xuICB9O1xuICBcbiAgLy8g44OH44O844K/5pW05ZCI5oCn44OB44Kn44OD44KvXG4gIGRhdGFDb25zaXN0ZW5jeUNoZWNrczoge1xuICAgIHVzZXJEYXRhQ29uc2lzdGVuY3k6IGJvb2xlYW47XG4gICAgc2Vzc2lvbkRhdGFDb25zaXN0ZW5jeTogYm9vbGVhbjtcbiAgICBjaGF0SGlzdG9yeUNvbnNpc3RlbmN5OiBib29sZWFuO1xuICAgIGRvY3VtZW50QWNjZXNzQ29uc2lzdGVuY3k6IGJvb2xlYW47XG4gIH07XG59XG5cbi8qKlxuICog5aSW6YOo44K344K544OG44Og6YCj5pC644OG44K544OI6Kit5a6aXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXh0ZXJuYWxTeXN0ZW1JbnRlZ3JhdGlvbkNvbmZpZyB7XG4gIC8vIEZTeCBmb3IgTmV0QXBwIE9OVEFQ6YCj5pC66Kit5a6aXG4gIGZzeEludGVncmF0aW9uOiB7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICB0ZXN0RW5kcG9pbnRzOiBzdHJpbmdbXTtcbiAgICBkb2N1bWVudFR5cGVzOiBzdHJpbmdbXTtcbiAgICBhY2Nlc3NQYXR0ZXJuczogc3RyaW5nW107XG4gICAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgICBkb2N1bWVudFJldHJpZXZhbFRpbWU6IG51bWJlcjtcbiAgICAgIGZpbGVTeXN0ZW1SZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgICAgIG1ldGFkYXRhUXVlcnlUaW1lOiBudW1iZXI7XG4gICAgfTtcbiAgfTtcbiAgXG4gIC8vIEFtYXpvbiBCZWRyb2Nr6YCj5pC66Kit5a6aXG4gIGJlZHJvY2tJbnRlZ3JhdGlvbjoge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgbW9kZWxJZHM6IHN0cmluZ1tdO1xuICAgIHRlc3RQcm9tcHRzOiBzdHJpbmdbXTtcbiAgICByZXNwb25zZVZhbGlkYXRpb246IHtcbiAgICAgIG1pblJlc3BvbnNlTGVuZ3RoOiBudW1iZXI7XG4gICAgICBtYXhSZXNwb25zZUxlbmd0aDogbnVtYmVyO1xuICAgICAgbGFuZ3VhZ2VDaGVjazogYm9vbGVhbjtcbiAgICAgIGNvbnRlbnRRdWFsaXR5Q2hlY2s6IGJvb2xlYW47XG4gICAgfTtcbiAgICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICAgIG1vZGVsSW52b2NhdGlvblRpbWU6IG51bWJlcjtcbiAgICAgIHN0cmVhbWluZ1Jlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgICAgYmF0Y2hQcm9jZXNzaW5nVGltZTogbnVtYmVyO1xuICAgIH07XG4gIH07XG4gIFxuICAvLyBPcGVuU2VhcmNoIFNlcnZlcmxlc3PpgKPmkLroqK3lrppcbiAgb3BlblNlYXJjaEludGVncmF0aW9uOiB7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICBpbmRleE5hbWVzOiBzdHJpbmdbXTtcbiAgICBzZWFyY2hRdWVyaWVzOiBzdHJpbmdbXTtcbiAgICB2ZWN0b3JTZWFyY2hRdWVyaWVzOiBzdHJpbmdbXTtcbiAgICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICAgIHNlYXJjaFJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgICAgdmVjdG9yU2VhcmNoVGltZTogbnVtYmVyO1xuICAgICAgaW5kZXhVcGRhdGVUaW1lOiBudW1iZXI7XG4gICAgfTtcbiAgfTtcbiAgXG4gIC8vIER5bmFtb0RC6YCj5pC66Kit5a6aXG4gIGR5bmFtb0RiSW50ZWdyYXRpb246IHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHRhYmxlTmFtZXM6IHN0cmluZ1tdO1xuICAgIG9wZXJhdGlvblR5cGVzOiBzdHJpbmdbXTtcbiAgICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICAgIHJlYWRPcGVyYXRpb25UaW1lOiBudW1iZXI7XG4gICAgICB3cml0ZU9wZXJhdGlvblRpbWU6IG51bWJlcjtcbiAgICAgIHF1ZXJ5T3BlcmF0aW9uVGltZTogbnVtYmVyO1xuICAgIH07XG4gIH07XG4gIFxuICAvLyBDbG91ZEZyb2506YCj5pC66Kit5a6aXG4gIGNsb3VkRnJvbnRJbnRlZ3JhdGlvbjoge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgZGlzdHJpYnV0aW9uRG9tYWluczogc3RyaW5nW107XG4gICAgY2FjaGVUZXN0UGF0aHM6IHN0cmluZ1tdO1xuICAgIHBlcmZvcm1hbmNlVGhyZXNob2xkczoge1xuICAgICAgY2FjaGVIaXRUaW1lOiBudW1iZXI7XG4gICAgICBjYWNoZU1pc3NUaW1lOiBudW1iZXI7XG4gICAgICBvcmlnaW5SZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgICB9O1xuICB9O1xuICBcbiAgLy8g44OH44O844K/44OV44Ot44O85pW05ZCI5oCn6Kit5a6aXG4gIGRhdGFGbG93Q29uc2lzdGVuY3k6IHtcbiAgICBlbmRUb0VuZERhdGFGbG93OiBib29sZWFuO1xuICAgIGNyb3NzU3lzdGVtRGF0YVN5bmM6IGJvb2xlYW47XG4gICAgZGF0YVRyYW5zZm9ybWF0aW9uVmFsaWRhdGlvbjogYm9vbGVhbjtcbiAgICBlcnJvclByb3BhZ2F0aW9uVGVzdDogYm9vbGVhbjtcbiAgfTtcbn1cblxuLyoqXG4gKiDpmpzlrrPmmYLjg5Xjgqnjg7zjg6vjg5Djg4Pjgq/mqZ/og73jg4bjgrnjg4joqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGYWlsb3ZlclRlc3RDb25maWcge1xuICAvLyDjgrfjgrnjg4bjg6DpmpzlrrPjgrfjg5/jg6Xjg6zjg7zjgrfjg6fjg7PoqK3lrppcbiAgZmFpbHVyZVNpbXVsYXRpb246IHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHNpbXVsYXRpb25UeXBlczogc3RyaW5nW107XG4gICAgcmVjb3ZlcnlUaW1lVGhyZXNob2xkczoge1xuICAgICAgc2VydmljZVJlY292ZXJ5OiBudW1iZXI7XG4gICAgICBkYXRhUmVjb3Zlcnk6IG51bWJlcjtcbiAgICAgIHVzZXJTZXNzaW9uUmVjb3Zlcnk6IG51bWJlcjtcbiAgICB9O1xuICB9O1xuICBcbiAgLy8g44OV44Kp44O844Or44OQ44OD44Kv5Yem55CG6Kit5a6aXG4gIGZhbGxiYWNrTWVjaGFuaXNtczoge1xuICAgIHNlcnZpY2VVbmF2YWlsYWJsZUhhbmRsaW5nOiB7XG4gICAgICBlbmFibGVkOiBib29sZWFuO1xuICAgICAgZmFsbGJhY2tNZXNzYWdlczogc3RyaW5nW107XG4gICAgICBncmFjZWZ1bERlZ3JhZGF0aW9uOiBib29sZWFuO1xuICAgIH07XG4gICAgZGF0YVVuYXZhaWxhYmxlSGFuZGxpbmc6IHtcbiAgICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgICBjYWNoZVV0aWxpemF0aW9uOiBib29sZWFuO1xuICAgICAgYWx0ZXJuYXRpdmVEYXRhU291cmNlczogc3RyaW5nW107XG4gICAgfTtcbiAgICBuZXR3b3JrRmFpbHVyZUhhbmRsaW5nOiB7XG4gICAgICBlbmFibGVkOiBib29sZWFuO1xuICAgICAgcmV0cnlNZWNoYW5pc21zOiBib29sZWFuO1xuICAgICAgdGltZW91dEhhbmRsaW5nOiBib29sZWFuO1xuICAgIH07XG4gIH07XG4gIFxuICAvLyDoh6rli5Xlvqnml6fmqZ/og73oqK3lrppcbiAgYXV0b1JlY292ZXJ5OiB7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICByZWNvdmVyeVN0cmF0ZWdpZXM6IHN0cmluZ1tdO1xuICAgIGhlYWx0aENoZWNrSW50ZXJ2YWw6IG51bWJlcjtcbiAgICBtYXhSZWNvdmVyeUF0dGVtcHRzOiBudW1iZXI7XG4gIH07XG4gIFxuICAvLyDpmpzlrrPpgJrnn6XoqK3lrppcbiAgZmFpbHVyZU5vdGlmaWNhdGlvbjoge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgbm90aWZpY2F0aW9uQ2hhbm5lbHM6IHN0cmluZ1tdO1xuICAgIGVzY2FsYXRpb25MZXZlbHM6IHN0cmluZ1tdO1xuICAgIHJlc3BvbnNlVGltZVJlcXVpcmVtZW50czogbnVtYmVyO1xuICB9O1xufVxuXG4vKipcbiAqIOacrOeVqueSsOWig+e1seWQiOODhuOCueODiOioreWumlxuICovXG5leHBvcnQgY29uc3QgcHJvZHVjdGlvbkludGVncmF0aW9uQ29uZmlnID0ge1xuICAvLyDlrozlhajjg6bjg7zjgrbjg7zjg5Xjg63jg7zjg4bjgrnjg4joqK3lrppcbiAgdXNlckZsb3dUZXN0OiB7XG4gICAgdGVzdFNjZW5hcmlvczoge1xuICAgICAgYmFzaWNVc2VyRmxvdzoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICduYXZpZ2F0ZV90b19ob21lcGFnZScsXG4gICAgICAgICAgJ3ZlcmlmeV9wYWdlX2xvYWQnLFxuICAgICAgICAgICdhY2Nlc3NfY2hhdF9pbnRlcmZhY2UnLFxuICAgICAgICAgICdzZW5kX2Jhc2ljX3F1ZXN0aW9uJyxcbiAgICAgICAgICAncmVjZWl2ZV9yZXNwb25zZScsXG4gICAgICAgICAgJ3ZlcmlmeV9yZXNwb25zZV9xdWFsaXR5J1xuICAgICAgICBdLFxuICAgICAgICBleHBlY3RlZER1cmF0aW9uOiAzMDAwMCwgLy8gMzDnp5JcbiAgICAgICAgdGltZW91dFBlclN0ZXA6IDEwMDAwIC8vIDEw56eSXG4gICAgICB9LFxuICAgICAgYXV0aGVudGljYXRlZFVzZXJGbG93OiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgJ25hdmlnYXRlX3RvX2hvbWVwYWdlJyxcbiAgICAgICAgICAnaW5pdGlhdGVfbG9naW4nLFxuICAgICAgICAgICdhdXRoZW50aWNhdGVfdXNlcicsXG4gICAgICAgICAgJ3ZlcmlmeV9hdXRoZW50aWNhdGlvbicsXG4gICAgICAgICAgJ2FjY2Vzc19wcm90ZWN0ZWRfY29udGVudCcsXG4gICAgICAgICAgJ3NlbmRfYXV0aGVudGljYXRlZF9xdWVzdGlvbicsXG4gICAgICAgICAgJ3JlY2VpdmVfcGVyc29uYWxpemVkX3Jlc3BvbnNlJyxcbiAgICAgICAgICAndmVyaWZ5X2FjY2Vzc19jb250cm9sJyxcbiAgICAgICAgICAnbG9nb3V0X3VzZXInXG4gICAgICAgIF0sXG4gICAgICAgIGV4cGVjdGVkRHVyYXRpb246IDYwMDAwLCAvLyA2MOenklxuICAgICAgICB0aW1lb3V0UGVyU3RlcDogMTUwMDAgLy8gMTXnp5JcbiAgICAgIH0sXG4gICAgICBhZG1pblVzZXJGbG93OiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgJ25hdmlnYXRlX3RvX2hvbWVwYWdlJyxcbiAgICAgICAgICAnYWRtaW5fbG9naW4nLFxuICAgICAgICAgICd2ZXJpZnlfYWRtaW5fcHJpdmlsZWdlcycsXG4gICAgICAgICAgJ2FjY2Vzc19hZG1pbl9mdW5jdGlvbnMnLFxuICAgICAgICAgICdwZXJmb3JtX2FkbWluX29wZXJhdGlvbnMnLFxuICAgICAgICAgICd2ZXJpZnlfYWRtaW5fYWNjZXNzX2NvbnRyb2wnLFxuICAgICAgICAgICdhZG1pbl9sb2dvdXQnXG4gICAgICAgIF0sXG4gICAgICAgIGV4cGVjdGVkRHVyYXRpb246IDQ1MDAwLCAvLyA0NeenklxuICAgICAgICB0aW1lb3V0UGVyU3RlcDogMTIwMDAgLy8gMTLnp5JcbiAgICAgIH0sXG4gICAgICBndWVzdFVzZXJGbG93OiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgJ25hdmlnYXRlX3RvX2hvbWVwYWdlJyxcbiAgICAgICAgICAnYWNjZXNzX3B1YmxpY19jb250ZW50JyxcbiAgICAgICAgICAnc2VuZF9ndWVzdF9xdWVzdGlvbicsXG4gICAgICAgICAgJ3JlY2VpdmVfbGltaXRlZF9yZXNwb25zZScsXG4gICAgICAgICAgJ3ZlcmlmeV9ndWVzdF9yZXN0cmljdGlvbnMnXG4gICAgICAgIF0sXG4gICAgICAgIGV4cGVjdGVkRHVyYXRpb246IDIwMDAwLCAvLyAyMOenklxuICAgICAgICB0aW1lb3V0UGVyU3RlcDogODAwMCAvLyA456eSXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBzZXNzaW9uTWFuYWdlbWVudDoge1xuICAgICAgdGVzdFNlc3Npb25DcmVhdGlvbjogdHJ1ZSxcbiAgICAgIHRlc3RTZXNzaW9uUGVyc2lzdGVuY2U6IHRydWUsXG4gICAgICB0ZXN0U2Vzc2lvbkV4cGlyYXRpb246IHRydWUsXG4gICAgICB0ZXN0Q29uY3VycmVudFNlc3Npb25zOiB0cnVlLFxuICAgICAgbWF4Q29uY3VycmVudFVzZXJzOiAyNVxuICAgIH0sXG4gICAgXG4gICAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgICBwYWdlTG9hZFRpbWU6IDMwMDAsIC8vIDPnp5JcbiAgICAgIGF1dGhlbnRpY2F0aW9uVGltZTogNTAwMCwgLy8gNeenklxuICAgICAgY2hhdFJlc3BvbnNlVGltZTogMTAwMDAsIC8vIDEw56eSXG4gICAgICBkb2N1bWVudFNlYXJjaFRpbWU6IDgwMDAsIC8vIDjnp5JcbiAgICAgIG92ZXJhbGxGbG93VGltZTogNjAwMDAgLy8gNjDnp5JcbiAgICB9LFxuICAgIFxuICAgIGRhdGFDb25zaXN0ZW5jeUNoZWNrczoge1xuICAgICAgdXNlckRhdGFDb25zaXN0ZW5jeTogdHJ1ZSxcbiAgICAgIHNlc3Npb25EYXRhQ29uc2lzdGVuY3k6IHRydWUsXG4gICAgICBjaGF0SGlzdG9yeUNvbnNpc3RlbmN5OiB0cnVlLFxuICAgICAgZG9jdW1lbnRBY2Nlc3NDb25zaXN0ZW5jeTogdHJ1ZVxuICAgIH1cbiAgfSBhcyBVc2VyRmxvd1Rlc3RDb25maWcsXG4gIFxuICAvLyDlpJbpg6jjgrfjgrnjg4bjg6DpgKPmkLrjg4bjgrnjg4joqK3lrppcbiAgZXh0ZXJuYWxTeXN0ZW1JbnRlZ3JhdGlvbjoge1xuICAgIGZzeEludGVncmF0aW9uOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgdGVzdEVuZHBvaW50czogW1xuICAgICAgICAnL2FwaS9kb2N1bWVudHMvbGlzdCcsXG4gICAgICAgICcvYXBpL2RvY3VtZW50cy9zZWFyY2gnLFxuICAgICAgICAnL2FwaS9kb2N1bWVudHMvY29udGVudCdcbiAgICAgIF0sXG4gICAgICBkb2N1bWVudFR5cGVzOiBbJ3BkZicsICdkb2N4JywgJ3R4dCcsICdtZCddLFxuICAgICAgYWNjZXNzUGF0dGVybnM6IFsncmVhZCcsICdzZWFyY2gnLCAnbWV0YWRhdGEnXSxcbiAgICAgIHBlcmZvcm1hbmNlVGhyZXNob2xkczoge1xuICAgICAgICBkb2N1bWVudFJldHJpZXZhbFRpbWU6IDUwMDAsIC8vIDXnp5JcbiAgICAgICAgZmlsZVN5c3RlbVJlc3BvbnNlVGltZTogMzAwMCwgLy8gM+enklxuICAgICAgICBtZXRhZGF0YVF1ZXJ5VGltZTogMjAwMCAvLyAy56eSXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBiZWRyb2NrSW50ZWdyYXRpb246IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBtb2RlbElkczogW1xuICAgICAgICAnYW1hem9uLm5vdmEtbGl0ZS12MTowJyxcbiAgICAgICAgJ2FtYXpvbi5ub3ZhLW1pY3JvLXYxOjAnXG4gICAgICBdLFxuICAgICAgdGVzdFByb21wdHM6IFtcbiAgICAgICAgJ+aXpeacrOiqnuOBp+ewoeWNmOOBquizquWVj+OBq+etlOOBiOOBpuOBj+OBoOOBleOBhCcsXG4gICAgICAgICfjgZPjga7mlofmm7jjga7lhoXlrrnjgpLopoHntITjgZfjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICAn5oqA6KGT55qE44Gq6LOq5ZWP44Gr44Gk44GE44Gm6Kmz44GX44GP6Kqs5piO44GX44Gm44GP44Gg44GV44GEJ1xuICAgICAgXSxcbiAgICAgIHJlc3BvbnNlVmFsaWRhdGlvbjoge1xuICAgICAgICBtaW5SZXNwb25zZUxlbmd0aDogMTAsXG4gICAgICAgIG1heFJlc3BvbnNlTGVuZ3RoOiAyMDAwLFxuICAgICAgICBsYW5ndWFnZUNoZWNrOiB0cnVlLFxuICAgICAgICBjb250ZW50UXVhbGl0eUNoZWNrOiB0cnVlXG4gICAgICB9LFxuICAgICAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgICAgIG1vZGVsSW52b2NhdGlvblRpbWU6IDgwMDAsIC8vIDjnp5JcbiAgICAgICAgc3RyZWFtaW5nUmVzcG9uc2VUaW1lOiAxMjAwMCwgLy8gMTLnp5JcbiAgICAgICAgYmF0Y2hQcm9jZXNzaW5nVGltZTogMzAwMDAgLy8gMzDnp5JcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIG9wZW5TZWFyY2hJbnRlZ3JhdGlvbjoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGluZGV4TmFtZXM6IFtcbiAgICAgICAgcHJvY2Vzcy5lbnYuT1BFTlNFQVJDSF9JTkRFWF9OQU1FIHx8ICdkb2N1bWVudHMtaW5kZXgnLFxuICAgICAgICBwcm9jZXNzLmVudi5PUEVOU0VBUkNIX1ZFQ1RPUl9JTkRFWCB8fCAndmVjdG9yLWluZGV4J1xuICAgICAgXSxcbiAgICAgIHNlYXJjaFF1ZXJpZXM6IFtcbiAgICAgICAgJ+ODhuOCueODiOaWh+abuCcsXG4gICAgICAgICfmioDooZPku5Xmp5gnLFxuICAgICAgICAn44Om44O844K244O844Ks44Kk44OJJ1xuICAgICAgXSxcbiAgICAgIHZlY3RvclNlYXJjaFF1ZXJpZXM6IFtcbiAgICAgICAgJ3NpbWlsYXIgZG9jdW1lbnRzJyxcbiAgICAgICAgJ3JlbGF0ZWQgY29udGVudCcsXG4gICAgICAgICdzZW1hbnRpYyBzZWFyY2gnXG4gICAgICBdLFxuICAgICAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgICAgIHNlYXJjaFJlc3BvbnNlVGltZTogMzAwMCwgLy8gM+enklxuICAgICAgICB2ZWN0b3JTZWFyY2hUaW1lOiA1MDAwLCAvLyA156eSXG4gICAgICAgIGluZGV4VXBkYXRlVGltZTogMTAwMDAgLy8gMTDnp5JcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIGR5bmFtb0RiSW50ZWdyYXRpb246IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICB0YWJsZU5hbWVzOiBbXG4gICAgICAgIHByb2Nlc3MuZW52LkRZTkFNT0RCX1NFU1NJT05fVEFCTEUgfHwgJ3VzZXItc2Vzc2lvbnMnLFxuICAgICAgICBwcm9jZXNzLmVudi5EWU5BTU9EQl9VU0VSX1RBQkxFIHx8ICd1c2VycydcbiAgICAgIF0sXG4gICAgICBvcGVyYXRpb25UeXBlczogWydyZWFkJywgJ3dyaXRlJywgJ3F1ZXJ5JywgJ3NjYW4nXSxcbiAgICAgIHBlcmZvcm1hbmNlVGhyZXNob2xkczoge1xuICAgICAgICByZWFkT3BlcmF0aW9uVGltZTogMTAwMCwgLy8gMeenklxuICAgICAgICB3cml0ZU9wZXJhdGlvblRpbWU6IDIwMDAsIC8vIDLnp5JcbiAgICAgICAgcXVlcnlPcGVyYXRpb25UaW1lOiAzMDAwIC8vIDPnp5JcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIGNsb3VkRnJvbnRJbnRlZ3JhdGlvbjoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGRpc3RyaWJ1dGlvbkRvbWFpbnM6IFtcbiAgICAgICAgcHJvY2Vzcy5lbnYuQ0xPVURGUk9OVF9ET01BSU5fTkFNRSB8fCAnZXhhbXBsZS5jbG91ZGZyb250Lm5ldCdcbiAgICAgIF0sXG4gICAgICBjYWNoZVRlc3RQYXRoczogW1xuICAgICAgICAnLycsXG4gICAgICAgICcvc3RhdGljL2Nzcy9tYWluLmNzcycsXG4gICAgICAgICcvc3RhdGljL2pzL21haW4uanMnLFxuICAgICAgICAnL2FwaS9oZWFsdGgnXG4gICAgICBdLFxuICAgICAgcGVyZm9ybWFuY2VUaHJlc2hvbGRzOiB7XG4gICAgICAgIGNhY2hlSGl0VGltZTogNTAwLCAvLyAwLjXnp5JcbiAgICAgICAgY2FjaGVNaXNzVGltZTogMjAwMCwgLy8gMuenklxuICAgICAgICBvcmlnaW5SZXNwb25zZVRpbWU6IDMwMDAgLy8gM+enklxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgZGF0YUZsb3dDb25zaXN0ZW5jeToge1xuICAgICAgZW5kVG9FbmREYXRhRmxvdzogdHJ1ZSxcbiAgICAgIGNyb3NzU3lzdGVtRGF0YVN5bmM6IHRydWUsXG4gICAgICBkYXRhVHJhbnNmb3JtYXRpb25WYWxpZGF0aW9uOiB0cnVlLFxuICAgICAgZXJyb3JQcm9wYWdhdGlvblRlc3Q6IHRydWVcbiAgICB9XG4gIH0gYXMgRXh0ZXJuYWxTeXN0ZW1JbnRlZ3JhdGlvbkNvbmZpZyxcbiAgXG4gIC8vIOmanOWus+aZguODleOCqeODvOODq+ODkOODg+OCr+apn+iDveODhuOCueODiOioreWumlxuICBmYWlsb3ZlclRlc3Q6IHtcbiAgICBmYWlsdXJlU2ltdWxhdGlvbjoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHNpbXVsYXRpb25UeXBlczogW1xuICAgICAgICAnc2VydmljZV91bmF2YWlsYWJsZScsXG4gICAgICAgICduZXR3b3JrX3RpbWVvdXQnLFxuICAgICAgICAnZGF0YWJhc2VfY29ubmVjdGlvbl9mYWlsdXJlJyxcbiAgICAgICAgJ2V4dGVybmFsX2FwaV9mYWlsdXJlJ1xuICAgICAgXSxcbiAgICAgIHJlY292ZXJ5VGltZVRocmVzaG9sZHM6IHtcbiAgICAgICAgc2VydmljZVJlY292ZXJ5OiAzMDAwMCwgLy8gMzDnp5JcbiAgICAgICAgZGF0YVJlY292ZXJ5OiA2MDAwMCwgLy8gNjDnp5JcbiAgICAgICAgdXNlclNlc3Npb25SZWNvdmVyeTogMTUwMDAgLy8gMTXnp5JcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIGZhbGxiYWNrTWVjaGFuaXNtczoge1xuICAgICAgc2VydmljZVVuYXZhaWxhYmxlSGFuZGxpbmc6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgZmFsbGJhY2tNZXNzYWdlczogW1xuICAgICAgICAgICfjgrXjg7zjg5PjgrnjgYzkuIDmmYLnmoTjgavliKnnlKjjgafjgY3jgb7jgZvjgpPjgILjgZfjgbDjgonjgY/jgYrlvoXjgaHjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICAgICfjgrfjgrnjg4bjg6Djg6Hjg7Pjg4bjg4rjg7PjgrnkuK3jgafjgZnjgILlvozjgbvjganlho3luqbjgYroqabjgZfjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICAgICfnlLPjgZfoqLPjgZTjgZbjgYTjgb7jgZvjgpPjgYzjgIHnj77lnKjjgrXjg7zjg5PjgrnjgavmjqXntprjgafjgY3jgb7jgZvjgpPjgIInXG4gICAgICAgIF0sXG4gICAgICAgIGdyYWNlZnVsRGVncmFkYXRpb246IHRydWVcbiAgICAgIH0sXG4gICAgICBkYXRhVW5hdmFpbGFibGVIYW5kbGluZzoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBjYWNoZVV0aWxpemF0aW9uOiB0cnVlLFxuICAgICAgICBhbHRlcm5hdGl2ZURhdGFTb3VyY2VzOiBbXG4gICAgICAgICAgJ2xvY2FsX2NhY2hlJyxcbiAgICAgICAgICAnYmFja3VwX2RhdGFiYXNlJyxcbiAgICAgICAgICAnc3RhdGljX2NvbnRlbnQnXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICBuZXR3b3JrRmFpbHVyZUhhbmRsaW5nOiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIHJldHJ5TWVjaGFuaXNtczogdHJ1ZSxcbiAgICAgICAgdGltZW91dEhhbmRsaW5nOiB0cnVlXG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBhdXRvUmVjb3Zlcnk6IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICByZWNvdmVyeVN0cmF0ZWdpZXM6IFtcbiAgICAgICAgJ3NlcnZpY2VfcmVzdGFydCcsXG4gICAgICAgICdjb25uZWN0aW9uX3JldHJ5JyxcbiAgICAgICAgJ2ZhbGxiYWNrX2FjdGl2YXRpb24nLFxuICAgICAgICAnY2FjaGVfcmVmcmVzaCdcbiAgICAgIF0sXG4gICAgICBoZWFsdGhDaGVja0ludGVydmFsOiAzMDAwMCwgLy8gMzDnp5JcbiAgICAgIG1heFJlY292ZXJ5QXR0ZW1wdHM6IDNcbiAgICB9LFxuICAgIFxuICAgIGZhaWx1cmVOb3RpZmljYXRpb246IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBub3RpZmljYXRpb25DaGFubmVsczogW1xuICAgICAgICBwcm9jZXNzLmVudi5BTEVSVF9TTlNfVE9QSUMgfHwgJycsXG4gICAgICAgIHByb2Nlc3MuZW52LkFMRVJUX0VNQUlMIHx8ICdhZG1pbkBleGFtcGxlLmNvbSdcbiAgICAgIF0sXG4gICAgICBlc2NhbGF0aW9uTGV2ZWxzOiBbJ2luZm8nLCAnd2FybmluZycsICdjcml0aWNhbCddLFxuICAgICAgcmVzcG9uc2VUaW1lUmVxdWlyZW1lbnRzOiAzMDAwMDAgLy8gNeWIhlxuICAgIH1cbiAgfSBhcyBGYWlsb3ZlclRlc3RDb25maWcsXG4gIFxuICAvLyDlhajoiKzoqK3lrppcbiAgZ2VuZXJhbDoge1xuICAgIHRlc3RUaW1lb3V0OiA2MDAwMDAsIC8vIDEw5YiGXG4gICAgbWF4UmV0cmllczogMyxcbiAgICByZXRyeURlbGF5OiAxMDAwMCwgLy8gMTDnp5JcbiAgICBwYXJhbGxlbEV4ZWN1dGlvbjogZmFsc2UsIC8vIOe1seWQiOODhuOCueODiOOBr+mghuasoeWun+ihjFxuICAgIGVtZXJnZW5jeVN0b3BFbmFibGVkOiB0cnVlLFxuICAgIGRldGFpbGVkTG9nZ2luZzogdHJ1ZSxcbiAgICBcbiAgICAvLyDjg4bjgrnjg4jlrp/ooYzpoIbluo9cbiAgICBleGVjdXRpb25PcmRlcjogW1xuICAgICAgJ3VzZXJfZmxvd190ZXN0JyxcbiAgICAgICdleHRlcm5hbF9zeXN0ZW1faW50ZWdyYXRpb24nLFxuICAgICAgJ2ZhaWxvdmVyX3Rlc3QnXG4gICAgXSxcbiAgICBcbiAgICAvLyDlv4XpoIjjg4bjgrnjg4jvvIjjgrnjgq3jg4Pjg5fkuI3lj6/vvIlcbiAgICBtYW5kYXRvcnlUZXN0czogW1xuICAgICAgJ2Jhc2ljX3VzZXJfZmxvdycsXG4gICAgICAnYXV0aGVudGljYXRlZF91c2VyX2Zsb3cnLFxuICAgICAgJ2ZzeF9pbnRlZ3JhdGlvbicsXG4gICAgICAnYmVkcm9ja19pbnRlZ3JhdGlvbicsXG4gICAgICAnb3BlbnNlYXJjaF9pbnRlZ3JhdGlvbicsXG4gICAgICAnc2VydmljZV91bmF2YWlsYWJsZV9oYW5kbGluZydcbiAgICBdLFxuICAgIFxuICAgIC8vIOacrOeVqueSsOWig+WItue0hFxuICAgIHByb2R1Y3Rpb25Db25zdHJhaW50czoge1xuICAgICAgcmVhZE9ubHlNb2RlOiB0cnVlLFxuICAgICAgbm9EYXRhTW9kaWZpY2F0aW9uOiB0cnVlLFxuICAgICAgbm9SZXNvdXJjZUNyZWF0aW9uOiB0cnVlLFxuICAgICAgbGltaXRlZFRlc3REdXJhdGlvbjogdHJ1ZSxcbiAgICAgIG1heENvbmN1cnJlbnRUZXN0czogMSxcbiAgICAgIHNhZmVGYWlsdXJlU2ltdWxhdGlvbjogdHJ1ZSAvLyDlronlhajjgarpmpzlrrPjgrfjg5/jg6Xjg6zjg7zjgrfjg6fjg7Pjga7jgb9cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICog44K544OG44O844K444Oz44Kw55Kw5aKD57Wx5ZCI44OG44K544OI6Kit5a6aXG4gKi9cbmV4cG9ydCBjb25zdCBzdGFnaW5nSW50ZWdyYXRpb25Db25maWcgPSB7XG4gIC4uLnByb2R1Y3Rpb25JbnRlZ3JhdGlvbkNvbmZpZyxcbiAgXG4gIC8vIOOCueODhuODvOOCuOODs+OCsOeSsOWig+OBp+OBr+S4puWIl+Wun+ihjOWPr+iDvVxuICBnZW5lcmFsOiB7XG4gICAgLi4ucHJvZHVjdGlvbkludGVncmF0aW9uQ29uZmlnLmdlbmVyYWwsXG4gICAgcGFyYWxsZWxFeGVjdXRpb246IHRydWUsXG4gICAgbWF4Q29uY3VycmVudFRlc3RzOiAzLFxuICAgIHRlc3RUaW1lb3V0OiA5MDAwMDAsIC8vIDE15YiGXG4gICAgXG4gICAgLy8g44K544OG44O844K444Oz44Kw55Kw5aKD5Yi257SE77yI5pys55Wq44KI44KK57ep44GE77yJXG4gICAgcHJvZHVjdGlvbkNvbnN0cmFpbnRzOiB7XG4gICAgICByZWFkT25seU1vZGU6IGZhbHNlLFxuICAgICAgbm9EYXRhTW9kaWZpY2F0aW9uOiBmYWxzZSxcbiAgICAgIG5vUmVzb3VyY2VDcmVhdGlvbjogdHJ1ZSxcbiAgICAgIGxpbWl0ZWRUZXN0RHVyYXRpb246IGZhbHNlLFxuICAgICAgbWF4Q29uY3VycmVudFRlc3RzOiAzLFxuICAgICAgc2FmZUZhaWx1cmVTaW11bGF0aW9uOiBmYWxzZSAvLyDjgojjgornqY3mpbXnmoTjgarpmpzlrrPjgrfjg5/jg6Xjg6zjg7zjgrfjg6fjg7NcbiAgICB9XG4gIH0sXG4gIFxuICAvLyDjgojjgornqY3mpbXnmoTjgarpmpzlrrPjg4bjgrnjg4hcbiAgZmFpbG92ZXJUZXN0OiB7XG4gICAgLi4ucHJvZHVjdGlvbkludGVncmF0aW9uQ29uZmlnLmZhaWxvdmVyVGVzdCxcbiAgICBmYWlsdXJlU2ltdWxhdGlvbjoge1xuICAgICAgLi4ucHJvZHVjdGlvbkludGVncmF0aW9uQ29uZmlnLmZhaWxvdmVyVGVzdC5mYWlsdXJlU2ltdWxhdGlvbixcbiAgICAgIHNpbXVsYXRpb25UeXBlczogW1xuICAgICAgICAuLi5wcm9kdWN0aW9uSW50ZWdyYXRpb25Db25maWcuZmFpbG92ZXJUZXN0LmZhaWx1cmVTaW11bGF0aW9uLnNpbXVsYXRpb25UeXBlcyxcbiAgICAgICAgJ21lbW9yeV9leGhhdXN0aW9uJyxcbiAgICAgICAgJ2Rpc2tfZnVsbCcsXG4gICAgICAgICdjcHVfb3ZlcmxvYWQnXG4gICAgICBdXG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIOmWi+eZuueSsOWig+e1seWQiOODhuOCueODiOioreWumlxuICovXG5leHBvcnQgY29uc3QgZGV2ZWxvcG1lbnRJbnRlZ3JhdGlvbkNvbmZpZyA9IHtcbiAgLi4ucHJvZHVjdGlvbkludGVncmF0aW9uQ29uZmlnLFxuICBcbiAgLy8g6ZaL55m655Kw5aKD44Gn44Gv5Z+65pys55qE44Gq57Wx5ZCI44OG44K544OI44Gu44G/XG4gIGdlbmVyYWw6IHtcbiAgICAuLi5wcm9kdWN0aW9uSW50ZWdyYXRpb25Db25maWcuZ2VuZXJhbCxcbiAgICBwYXJhbGxlbEV4ZWN1dGlvbjogdHJ1ZSxcbiAgICBtYXhDb25jdXJyZW50VGVzdHM6IDUsXG4gICAgdGVzdFRpbWVvdXQ6IDMwMDAwMCwgLy8gNeWIhlxuICAgIFxuICAgIC8vIOW/hemgiOODhuOCueODiOOCkuacgOWwj+mZkOOBq1xuICAgIG1hbmRhdG9yeVRlc3RzOiBbXG4gICAgICAnYmFzaWNfdXNlcl9mbG93JyxcbiAgICAgICdmc3hfaW50ZWdyYXRpb24nLFxuICAgICAgJ2JlZHJvY2tfaW50ZWdyYXRpb24nXG4gICAgXSxcbiAgICBcbiAgICAvLyDplovnmbrnkrDlooPliLbntITvvIjmnIDjgoLnt6njgYTvvIlcbiAgICBwcm9kdWN0aW9uQ29uc3RyYWludHM6IHtcbiAgICAgIHJlYWRPbmx5TW9kZTogZmFsc2UsXG4gICAgICBub0RhdGFNb2RpZmljYXRpb246IGZhbHNlLFxuICAgICAgbm9SZXNvdXJjZUNyZWF0aW9uOiBmYWxzZSxcbiAgICAgIGxpbWl0ZWRUZXN0RHVyYXRpb246IGZhbHNlLFxuICAgICAgbWF4Q29uY3VycmVudFRlc3RzOiA1LFxuICAgICAgc2FmZUZhaWx1cmVTaW11bGF0aW9uOiBmYWxzZVxuICAgIH1cbiAgfSxcbiAgXG4gIC8vIOi7vemHj+OBque1seWQiOODhuOCueODiFxuICB1c2VyRmxvd1Rlc3Q6IHtcbiAgICAuLi5wcm9kdWN0aW9uSW50ZWdyYXRpb25Db25maWcudXNlckZsb3dUZXN0LFxuICAgIHRlc3RTY2VuYXJpb3M6IHtcbiAgICAgIGJhc2ljVXNlckZsb3c6IHByb2R1Y3Rpb25JbnRlZ3JhdGlvbkNvbmZpZy51c2VyRmxvd1Rlc3QudGVzdFNjZW5hcmlvcy5iYXNpY1VzZXJGbG93LFxuICAgICAgYXV0aGVudGljYXRlZFVzZXJGbG93OiB7XG4gICAgICAgIC4uLnByb2R1Y3Rpb25JbnRlZ3JhdGlvbkNvbmZpZy51c2VyRmxvd1Rlc3QudGVzdFNjZW5hcmlvcy5hdXRoZW50aWNhdGVkVXNlckZsb3csXG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlIC8vIOmWi+eZuueSsOWig+OBp+OBr+iqjeiovOODleODreODvOOCkuOCueOCreODg+ODl1xuICAgICAgfSxcbiAgICAgIGFkbWluVXNlckZsb3c6IHtcbiAgICAgICAgLi4ucHJvZHVjdGlvbkludGVncmF0aW9uQ29uZmlnLnVzZXJGbG93VGVzdC50ZXN0U2NlbmFyaW9zLmFkbWluVXNlckZsb3csXG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlIC8vIOmWi+eZuueSsOWig+OBp+OBr+euoeeQhuiAheODleODreODvOOCkuOCueOCreODg+ODl1xuICAgICAgfSxcbiAgICAgIGd1ZXN0VXNlckZsb3c6IHByb2R1Y3Rpb25JbnRlZ3JhdGlvbkNvbmZpZy51c2VyRmxvd1Rlc3QudGVzdFNjZW5hcmlvcy5ndWVzdFVzZXJGbG93XG4gICAgfVxuICB9LFxuICBcbiAgLy8g6Lu96YeP44Gq6Zqc5a6z44OG44K544OIXG4gIGZhaWxvdmVyVGVzdDoge1xuICAgIC4uLnByb2R1Y3Rpb25JbnRlZ3JhdGlvbkNvbmZpZy5mYWlsb3ZlclRlc3QsXG4gICAgZmFpbHVyZVNpbXVsYXRpb246IHtcbiAgICAgIC4uLnByb2R1Y3Rpb25JbnRlZ3JhdGlvbkNvbmZpZy5mYWlsb3ZlclRlc3QuZmFpbHVyZVNpbXVsYXRpb24sXG4gICAgICBlbmFibGVkOiBmYWxzZSAvLyDplovnmbrnkrDlooPjgafjga/pmpzlrrPjgrfjg5/jg6Xjg6zjg7zjgrfjg6fjg7PjgpLjgrnjgq3jg4Pjg5dcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICog55Kw5aKD44Gr5b+c44GY44Gf6Kit5a6a44Gu5Y+W5b6XXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnRlZ3JhdGlvbkNvbmZpZyhlbnZpcm9ubWVudDogc3RyaW5nKSB7XG4gIHN3aXRjaCAoZW52aXJvbm1lbnQudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ3Byb2R1Y3Rpb24nOlxuICAgIGNhc2UgJ3Byb2QnOlxuICAgICAgcmV0dXJuIHByb2R1Y3Rpb25JbnRlZ3JhdGlvbkNvbmZpZztcbiAgICBjYXNlICdzdGFnaW5nJzpcbiAgICBjYXNlICdzdGFnZSc6XG4gICAgICByZXR1cm4gc3RhZ2luZ0ludGVncmF0aW9uQ29uZmlnO1xuICAgIGNhc2UgJ2RldmVsb3BtZW50JzpcbiAgICBjYXNlICdkZXYnOlxuICAgICAgcmV0dXJuIGRldmVsb3BtZW50SW50ZWdyYXRpb25Db25maWc7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnNvbGUud2Fybihg5pyq55+l44Gu55Kw5aKDOiAke2Vudmlyb25tZW50fS4g6ZaL55m655Kw5aKD6Kit5a6a44KS5L2/55So44GX44G+44GZ44CCYCk7XG4gICAgICByZXR1cm4gZGV2ZWxvcG1lbnRJbnRlZ3JhdGlvbkNvbmZpZztcbiAgfVxufVxuXG4vKipcbiAqIOe1seWQiOODhuOCueODiOioreWumuOBruaknOiovFxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVJbnRlZ3JhdGlvbkNvbmZpZyhjb25maWc6IGFueSk6IHtcbiAgaXNWYWxpZDogYm9vbGVhbjtcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgLy8g44Om44O844K244O844OV44Ot44O844OG44K544OI6Kit5a6a44Gu5qSc6Ki8XG4gIGlmICghY29uZmlnLnVzZXJGbG93VGVzdD8udGVzdFNjZW5hcmlvcykge1xuICAgIGVycm9ycy5wdXNoKCfjg6bjg7zjgrbjg7zjg5Xjg63jg7zjg4bjgrnjg4jjgrfjg4rjg6rjgqrjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIC8vIOWklumDqOOCt+OCueODhuODoOmAo+aQuuioreWumuOBruaknOiovFxuICBpZiAoIWNvbmZpZy5leHRlcm5hbFN5c3RlbUludGVncmF0aW9uKSB7XG4gICAgZXJyb3JzLnB1c2goJ+WklumDqOOCt+OCueODhuODoOmAo+aQuuioreWumuOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICB9XG5cbiAgLy8g44OR44OV44Kp44O844Oe44Oz44K56Za+5YCk44Gu5qSc6Ki8XG4gIGNvbnN0IHRocmVzaG9sZHMgPSBjb25maWcudXNlckZsb3dUZXN0Py5wZXJmb3JtYW5jZVRocmVzaG9sZHM7XG4gIGlmICh0aHJlc2hvbGRzKSB7XG4gICAgT2JqZWN0LmVudHJpZXModGhyZXNob2xkcykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJyB8fCB2YWx1ZSA8PSAwKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKGDnhKHlirnjgarjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnplr7lgKQ6ICR7a2V5fWApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8g5pys55Wq55Kw5aKD5Yi257SE44Gu56K66KqNXG4gIGlmIChjb25maWcuZ2VuZXJhbD8ucHJvZHVjdGlvbkNvbnN0cmFpbnRzPy5yZWFkT25seU1vZGUgPT09IGZhbHNlKSB7XG4gICAgd2FybmluZ3MucHVzaCgn5pys55Wq55Kw5aKD44Gn6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44GM54Sh5Yq544Gr44Gq44Gj44Gm44GE44G+44GZJyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGlzVmFsaWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgZXJyb3JzLFxuICAgIHdhcm5pbmdzXG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgcHJvZHVjdGlvbkludGVncmF0aW9uQ29uZmlnLFxuICBzdGFnaW5nSW50ZWdyYXRpb25Db25maWcsXG4gIGRldmVsb3BtZW50SW50ZWdyYXRpb25Db25maWcsXG4gIGdldEludGVncmF0aW9uQ29uZmlnLFxuICB2YWxpZGF0ZUludGVncmF0aW9uQ29uZmlnXG59OyJdfQ==