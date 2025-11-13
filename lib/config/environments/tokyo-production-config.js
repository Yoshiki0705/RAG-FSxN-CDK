"use strict";
/**
 * 東京リージョン本番設定 - 本番環境統合設定
 *
 * 東京リージョン（ap-northeast-1）での本番環境設定を定義します。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokyoProductionConfig = void 0;
// 東京リージョン本番環境設定
exports.tokyoProductionConfig = {
    environment: 'prod',
    region: 'ap-northeast-1',
    // プロジェクト設定
    project: {
        name: 'permission-aware-rag',
        version: '1.0.0',
        description: 'Permission-aware RAG System with FSx for NetApp ONTAP - Production'
    },
    // 命名設定（統一された命名規則）
    naming: {
        projectName: 'permission-aware-rag',
        environment: 'prod',
        regionPrefix: 'TokyoRegion',
        separator: '-'
    },
    // ネットワーク設定（本番環境強化）
    networking: {
        vpcCidr: '10.0.0.0/16',
        availabilityZones: 3, // 本番環境では3AZ
        natGateways: {
            enabled: true,
            count: 3 // 各AZにNAT Gateway
        },
        enableVpcFlowLogs: true,
        enableDnsHostnames: true,
        enableDnsSupport: true
    },
    // セキュリティ設定（本番環境強化）
    security: {
        enableWaf: true,
        enableGuardDuty: true, // 本番環境では有効化
        enableConfig: true, // 本番環境では有効化
        enableCloudTrail: true,
        kmsKeyRotation: true,
        encryptionAtRest: true,
        encryptionInTransit: true
    },
    // ストレージ設定（本番環境強化）
    storage: {
        s3: {
            enableVersioning: true,
            enableLifecyclePolicy: true,
            transitionToIADays: 30,
            transitionToGlacierDays: 90,
            expirationDays: 2555, // 7年保持（コンプライアンス要件）
            documents: {
                encryption: true,
                versioning: true
            },
            backup: {
                encryption: true,
                versioning: true
            },
            embeddings: {
                encryption: true,
                versioning: false
            }
        },
        fsxOntap: {
            enabled: false, // 一時的に無効化（VPC依存関係のため）
            storageCapacity: 4096, // 本番環境では大容量
            throughputCapacity: 512, // 本番環境では高スループット
            deploymentType: 'MULTI_AZ_1', // 本番環境では冗長化
            automaticBackupRetentionDays: 30, // 本番環境では長期保持
            activeDirectory: {
                enabled: false // デフォルトは無効（必要に応じて有効化）
            }
        },
        efs: {
            enabled: false, // EFSを無効化（DataStackには含めない）
            performanceMode: 'generalPurpose',
            throughputMode: 'provisioned',
            provisionedThroughputInMibps: 100,
            encrypted: true
        }
    },
    // データベース設定（本番環境強化）
    database: {
        dynamodb: {
            billingMode: 'PROVISIONED', // 本番環境では予測可能なコスト
            pointInTimeRecovery: true,
            enableStreams: true,
            streamViewType: 'NEW_AND_OLD_IMAGES'
        },
        opensearch: {
            instanceType: 'm6g.large.search', // 本番環境では高性能インスタンス
            instanceCount: 3, // 本番環境では冗長化
            dedicatedMasterEnabled: true, // 本番環境では専用マスター
            masterInstanceCount: 3,
            ebsEnabled: true,
            volumeType: 'gp3',
            volumeSize: 100, // 本番環境では大容量
            encryptionAtRest: true
        }
    },
    // Embedding設定（本番環境強化）
    embedding: {
        lambda: {
            runtime: 'nodejs20.x',
            timeout: 900, // 本番環境では最大タイムアウト
            memorySize: 3008, // 本番環境では高メモリ
            enableXRayTracing: true,
            enableDeadLetterQueue: true
        },
        batch: {
            enabled: true, // 本番環境では有効化
            computeEnvironmentType: 'FARGATE',
            instanceTypes: ['optimal'],
            minvCpus: 0,
            maxvCpus: 1024, // 本番環境では大規模処理対応
            desiredvCpus: 0
        },
        ecs: {
            enabled: true, // ECS on EC2を有効化
            instanceType: 'm5.xlarge', // 本番環境では高性能インスタンス
            minCapacity: 1,
            maxCapacity: 10,
            desiredCapacity: 2,
            enableManagedInstance: true
        }
    },
    // API設定（本番環境強化）
    api: {
        throttling: {
            rateLimit: 10000, // 本番環境では高いレート制限
            burstLimit: 20000
        },
        cors: {
            enabled: true,
            allowOrigins: [
                'https://rag-system.example.com',
                'https://app.rag-system.example.com'
            ], // 本番環境では特定ドメインのみ
            allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key']
        },
        authentication: {
            cognitoEnabled: true,
            apiKeyRequired: true // 本番環境ではAPI Key必須
        }
    },
    // AI設定（本番環境強化）
    ai: {
        bedrock: {
            enabled: true,
            models: [
                'anthropic.claude-3-sonnet-20240229-v1:0', // 本番環境では高性能モデル
                'anthropic.claude-3-haiku-20240307-v1:0'
            ],
            maxTokens: 8192, // 本番環境では大容量
            temperature: 0.3 // 本番環境では安定した出力
        },
        embedding: {
            model: 'amazon.titan-embed-text-v2:0', // 本番環境では最新モデル
            dimensions: 1536,
            batchSize: 500 // 本番環境では大バッチサイズ
        }
    },
    // 監視設定（本番環境強化）
    monitoring: {
        enableDetailedMonitoring: true,
        logRetentionDays: 365, // 本番環境では1年保持
        enableAlarms: true,
        alarmNotificationEmail: 'ops-team@example.com',
        enableDashboard: true,
        enableXRayTracing: true
    },
    // エンタープライズ設定（本番環境強化）
    enterprise: {
        enableAccessControl: true,
        enableAuditLogging: true,
        enableBIAnalytics: true, // 本番環境では有効化
        enableMultiTenant: true, // 本番環境では有効化
        dataRetentionDays: 2555 // 7年保持（コンプライアンス要件）
    },
    // 機能フラグ（本番環境では全機能有効）
    features: {
        enableNetworking: true,
        enableSecurity: true,
        enableStorage: true,
        enableDatabase: true,
        enableEmbedding: true,
        enableAPI: true,
        enableAI: true,
        enableMonitoring: true,
        enableEnterprise: true
    },
    // タグ設定（本番環境・IAM制限対応）
    tags: {
        Environment: 'prod',
        Project: 'permission-aware-rag',
        Owner: 'Platform-Team',
        CostCenter: 'Production',
        Backup: 'Critical',
        Monitoring: 'Enabled',
        Compliance: 'SOC2+GDPR+HIPAA',
        DataClassification: 'Confidential',
        Region: 'ap-northeast-1',
        Timezone: 'Asia/Tokyo',
        ComplianceFramework: 'SOC2+GDPR+HIPAA',
        // オプションタグ
        BusinessCriticality: 'High',
        DisasterRecovery: 'Enabled',
        SecurityLevel: 'High',
        EncryptionRequired: 'Yes',
        AuditRequired: 'Yes',
        PerformanceLevel: 'High',
        AvailabilityTarget: '99.9%',
        RPO: '1h',
        RTO: '4h'
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9reW8tcHJvZHVjdGlvbi1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0b2t5by1wcm9kdWN0aW9uLWNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7O0FBSUgsZ0JBQWdCO0FBQ0gsUUFBQSxxQkFBcUIsR0FBc0I7SUFDdEQsV0FBVyxFQUFFLE1BQU07SUFDbkIsTUFBTSxFQUFFLGdCQUFnQjtJQUV4QixXQUFXO0lBQ1gsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixPQUFPLEVBQUUsT0FBTztRQUNoQixXQUFXLEVBQUUsb0VBQW9FO0tBQ2xGO0lBRUQsa0JBQWtCO0lBQ2xCLE1BQU0sRUFBRTtRQUNOLFdBQVcsRUFBRSxzQkFBc0I7UUFDbkMsV0FBVyxFQUFFLE1BQU07UUFDbkIsWUFBWSxFQUFFLGFBQWE7UUFDM0IsU0FBUyxFQUFFLEdBQUc7S0FDZjtJQUVELG1CQUFtQjtJQUNuQixVQUFVLEVBQUU7UUFDVixPQUFPLEVBQUUsYUFBYTtRQUN0QixpQkFBaUIsRUFBRSxDQUFDLEVBQUUsWUFBWTtRQUNsQyxXQUFXLEVBQUU7WUFDWCxPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRSxDQUFDLENBQUMsa0JBQWtCO1NBQzVCO1FBQ0QsaUJBQWlCLEVBQUUsSUFBSTtRQUN2QixrQkFBa0IsRUFBRSxJQUFJO1FBQ3hCLGdCQUFnQixFQUFFLElBQUk7S0FDdkI7SUFFRCxtQkFBbUI7SUFDbkIsUUFBUSxFQUFFO1FBQ1IsU0FBUyxFQUFFLElBQUk7UUFDZixlQUFlLEVBQUUsSUFBSSxFQUFFLFlBQVk7UUFDbkMsWUFBWSxFQUFFLElBQUksRUFBRSxZQUFZO1FBQ2hDLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsY0FBYyxFQUFFLElBQUk7UUFDcEIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixtQkFBbUIsRUFBRSxJQUFJO0tBQzFCO0lBRUQsa0JBQWtCO0lBQ2xCLE9BQU8sRUFB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bUJBQW1CO0tBQzVDO0lBRUQscUJBQXFCO0lBQ3JCLFFBQVEsRUFBRTtRQUNSLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsY0FBYyxFQUFFLElBQUk7UUFDcEIsYUFBYSxFQUFFLElBQUk7UUFDbkIsY0FBYyxFQUFFLElBQUk7UUFDcEIsZUFBZSxFQUFFLElBQUk7UUFDckIsU0FBUyxFQUFFLElBQUk7UUFDZixRQUFRLEVBQUUsSUFBSTtRQUNkLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsZ0JBQWdCLEVBQUUsSUFBSTtLQUN2QjtJQUVELHFCQUFxQjtJQUNyQixJQUFJLEVBQUU7UUFDSixXQUFXLEVBQUUsTUFBTTtRQUNuQixPQUFPLEVBQUUsc0JBQXNCO1FBQy9CLEtBQUssRUFBRSxlQUFlO1FBQ3RCLFVBQVUsRUFBRSxZQUFZO1FBQ3hCLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLFVBQVUsRUFBRSxTQUFTO1FBQ3JCLFVBQVUsRUFBRSxpQkFBaUI7UUFDN0Isa0JBQWtCLEVBQUUsY0FBYztRQUNsQyxNQUFNLEVBQUUsZ0JBQWdCO1FBQ3hCLFFBQVEsRUFBRSxZQUFZO1FBQ3RCLG1CQUFtQixFQUFFLGlCQUFpQjtRQUN0QyxVQUFVO1FBQ1YsbUJBQW1CLEVBQUUsTUFBTTtRQUMzQixnQkFBZ0IsRUFBRSxTQUFTO1FBQzNCLGFBQWEsRUFBRSxNQUFNO1FBQ3JCLGtCQUFrQixFQUFFLEtBQUs7UUFDekIsYUFBYSxFQUFFLEtBQUs7UUFDcEIsZ0JBQWdCLEVBQUUsTUFBTTtRQUN4QixrQkFBa0IsRUFBRSxPQUFPO1FBQzNCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLElBQUk7S0FDVjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOadseS6rOODquODvOOCuOODp+ODs+acrOeVquioreWumiAtIOacrOeVqueSsOWig+e1seWQiOioreWumlxuICogXG4gKiDmnbHkuqzjg6rjg7zjgrjjg6fjg7PvvIhhcC1ub3J0aGVhc3QtMe+8ieOBp+OBruacrOeVqueSsOWig+ioreWumuOCkuWumue+qeOBl+OBvuOBmeOAglxuICovXG5cbmltcG9ydCB7IEVudmlyb25tZW50Q29uZmlnIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9lbnZpcm9ubWVudC1jb25maWcnO1xuXG4vLyDmnbHkuqzjg6rjg7zjgrjjg6fjg7PmnKznlarnkrDlooPoqK3lrppcbmV4cG9ydCBjb25zdCB0b2t5b1Byb2R1Y3Rpb25Db25maWc6IEVudmlyb25tZW50Q29uZmlnID0ge1xuICBlbnZpcm9ubWVudDogJ3Byb2QnLFxuICByZWdpb246ICdhcC1ub3J0aGVhc3QtMScsXG4gIFxuICAvLyDjg5fjg63jgrjjgqfjgq/jg4joqK3lrppcbiAgcHJvamVjdDoge1xuICAgIG5hbWU6ICdwZXJtaXNzaW9uLWF3YXJlLXJhZycsXG4gICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICBkZXNjcmlwdGlvbjogJ1Blcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbSB3aXRoIEZTeCBmb3IgTmV0QXBwIE9OVEFQIC0gUHJvZHVjdGlvbidcbiAgfSxcblxuICAvLyDlkb3lkI3oqK3lrprvvIjntbHkuIDjgZXjgozjgZ/lkb3lkI3opo/liYfvvIlcbiAgbmFtaW5nOiB7XG4gICAgcHJvamVjdE5hbWU6ICdwZXJtaXNzaW9uLWF3YXJlLXJhZycsXG4gICAgZW52aXJvbm1lbnQ6ICdwcm9kJyxcbiAgICByZWdpb25QcmVmaXg6ICdUb2t5b1JlZ2lvbicsXG4gICAgc2VwYXJhdG9yOiAnLSdcbiAgfSxcblxuICAvLyDjg43jg4Pjg4jjg6/jg7zjgq/oqK3lrprvvIjmnKznlarnkrDlooPlvLfljJbvvIlcbiAgbmV0d29ya2luZzoge1xuICAgIHZwY0NpZHI6ICcxMC4wLjAuMC8xNicsXG4gICAgYXZhaWxhYmlsaXR5Wm9uZXM6IDMsIC8vIOacrOeVqueSsOWig+OBp+OBrzNBWlxuICAgIG5hdEdhdGV3YXlzOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgY291bnQ6IDMgLy8g5ZCEQVrjgatOQVQgR2F0ZXdheVxuICAgIH0sXG4gICAgZW5hYmxlVnBjRmxvd0xvZ3M6IHRydWUsXG4gICAgZW5hYmxlRG5zSG9zdG5hbWVzOiB0cnVlLFxuICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWVcbiAgfSxcblxuICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrprvvIjmnKznlarnkrDlooPlvLfljJbvvIlcbiAgc2VjdXJpdHk6IHtcbiAgICBlbmFibGVXYWY6IHRydWUsXG4gICAgZW5hYmxlR3VhcmREdXR5OiB0cnVlLCAvLyDmnKznlarnkrDlooPjgafjga/mnInlirnljJZcbiAgICBlbmFibGVDb25maWc6IHRydWUsIC8vIOacrOeVqueSsOWig+OBp+OBr+acieWKueWMllxuICAgIGVuYWJsZUNsb3VkVHJhaWw6IHRydWUsXG4gICAga21zS2V5Um90YXRpb246IHRydWUsXG4gICAgZW5jcnlwdGlvbkF0UmVzdDogdHJ1ZSxcbiAgICBlbmNyeXB0aW9uSW5UcmFuc2l0OiB0cnVlXG4gIH0sXG5cbiAgLy8g44K544OI44Os44O844K46Kit5a6a77yI5pys55Wq55Kw5aKD5by35YyW77yJXG4gIHN0b3JhZ2U6IHtcbiAgICBzMzoge1xuICAgICAgZW5hYmxlVmVyc2lvbmluZzogdHJ1ZSxcbiAgICAgIGVuYWJsZUxpZmVjeWNsZVBvbGljeTogdHJ1ZSxcbiAgICAgIHRyYW5zaXRpb25Ub0lBRGF5czogMzAsXG4gICAgICB0cmFuc2l0aW9uVG9HbGFjaWVyRGF5czogOTAsXG4gICAgICBleHBpcmF0aW9uRGF5czogMjU1NSwgLy8gN+W5tOS/neaMge+8iOOCs+ODs+ODl+ODqeOCpOOCouODs+OCueimgeS7tu+8iVxuICAgICAgZG9jdW1lbnRzOiB7XG4gICAgICAgIGVuY3J5cHRpb246IHRydWUsXG4gICAgICAgIHZlcnNpb25pbmc6IHRydWVcbiAgICAgIH0sXG4gICAgICBiYWNrdXA6IHtcbiAgICAgICAgZW5jcnlwdGlvbjogdHJ1ZSxcbiAgICAgICAgdmVyc2lvbmluZzogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGVtYmVkZGluZ3M6IHtcbiAgICAgICAgZW5jcnlwdGlvbjogdHJ1ZSxcbiAgICAgICAgdmVyc2lvbmluZzogZmFsc2VcbiAgICAgIH1cbiAgICB9LFxuICAgIGZzeE9udGFwOiB7XG4gICAgICBlbmFibGVkOiBmYWxzZSwgLy8g5LiA5pmC55qE44Gr54Sh5Yq55YyW77yIVlBD5L6d5a2Y6Zai5L+C44Gu44Gf44KB77yJXG4gICAgICBzdG9yYWdlQ2FwYWNpdHk6IDQwOTYsIC8vIOacrOeVqueSsOWig+OBp+OBr+Wkp+WuuemHj1xuICAgICAgdGhyb3VnaHB1dENhcGFjaXR5OiA1MTIsIC8vIOacrOeVqueSsOWig+OBp+OBr+mrmOOCueODq+ODvOODl+ODg+ODiFxuICAgICAgZGVwbG95bWVudFR5cGU6ICdNVUxUSV9BWl8xJywgLy8g5pys55Wq55Kw5aKD44Gn44Gv5YaX6ZW35YyWXG4gICAgICBhdXRvbWF0aWNCYWNrdXBSZXRlbnRpb25EYXlzOiAzMCwgLy8g5pys55Wq55Kw5aKD44Gn44Gv6ZW35pyf5L+d5oyBXG4gICAgICBhY3RpdmVEaXJlY3Rvcnk6IHtcbiAgICAgICAgZW5hYmxlZDogZmFsc2UgLy8g44OH44OV44Kp44Or44OI44Gv54Sh5Yq577yI5b+F6KaB44Gr5b+c44GY44Gm5pyJ5Yq55YyW77yJXG4gICAgICB9XG4gICAgfSxcbiAgICBlZnM6IHtcbiAgICAgIGVuYWJsZWQ6IGZhbHNlLCAvLyBFRlPjgpLnhKHlirnljJbvvIhEYXRhU3RhY2vjgavjga/lkKvjgoHjgarjgYTvvIlcbiAgICAgIHBlcmZvcm1hbmNlTW9kZTogJ2dlbmVyYWxQdXJwb3NlJyxcbiAgICAgIHRocm91Z2hwdXRNb2RlOiAncHJvdmlzaW9uZWQnLFxuICAgICAgcHJvdmlzaW9uZWRUaHJvdWdocHV0SW5NaWJwczogMTAwLFxuICAgICAgZW5jcnlwdGVkOiB0cnVlXG4gICAgfVxuICB9LFxuXG4gIC8vIOODh+ODvOOCv+ODmeODvOOCueioreWumu+8iOacrOeVqueSsOWig+W8t+WMlu+8iVxuICBkYXRhYmFzZToge1xuICAgIGR5bmFtb2RiOiB7XG4gICAgICBiaWxsaW5nTW9kZTogJ1BST1ZJU0lPTkVEJywgLy8g5pys55Wq55Kw5aKD44Gn44Gv5LqI5ris5Y+v6IO944Gq44Kz44K544OIXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxuICAgICAgZW5hYmxlU3RyZWFtczogdHJ1ZSxcbiAgICAgIHN0cmVhbVZpZXdUeXBlOiAnTkVXX0FORF9PTERfSU1BR0VTJ1xuICAgIH0sXG4gICAgb3BlbnNlYXJjaDoge1xuICAgICAgaW5zdGFuY2VUeXBlOiAnbTZnLmxhcmdlLnNlYXJjaCcsIC8vIOacrOeVqueSsOWig+OBp+OBr+mrmOaAp+iDveOCpOODs+OCueOCv+ODs+OCuVxuICAgICAgaW5zdGFuY2VDb3VudDogMywgLy8g5pys55Wq55Kw5aKD44Gn44Gv5YaX6ZW35YyWXG4gICAgICBkZWRpY2F0ZWRNYXN0ZXJFbmFibGVkOiB0cnVlLCAvLyDmnKznlarnkrDlooPjgafjga/lsILnlKjjg57jgrnjgr/jg7xcbiAgICAgIG1hc3Rlckluc3RhbmNlQ291bnQ6IDMsXG4gICAgICBlYnNFbmFibGVkOiB0cnVlLFxuICAgICAgdm9sdW1lVHlwZTogJ2dwMycsXG4gICAgICB2b2x1bWVTaXplOiAxMDAsIC8vIOacrOeVqueSsOWig+OBp+OBr+Wkp+WuuemHj1xuICAgICAgZW5jcnlwdGlvbkF0UmVzdDogdHJ1ZVxuICAgIH1cbiAgfSxcblxuICAvLyBFbWJlZGRpbmfoqK3lrprvvIjmnKznlarnkrDlooPlvLfljJbvvIlcbiAgZW1iZWRkaW5nOiB7XG4gICAgbGFtYmRhOiB7XG4gICAgICBydW50aW1lOiAnbm9kZWpzMjAueCcsXG4gICAgICB0aW1lb3V0OiA5MDAsIC8vIOacrOeVqueSsOWig+OBp+OBr+acgOWkp+OCv+OCpOODoOOCouOCpuODiFxuICAgICAgbWVtb3J5U2l6ZTogMzAwOCwgLy8g5pys55Wq55Kw5aKD44Gn44Gv6auY44Oh44Oi44OqXG4gICAgICBlbmFibGVYUmF5VHJhY2luZzogdHJ1ZSxcbiAgICAgIGVuYWJsZURlYWRMZXR0ZXJRdWV1ZTogdHJ1ZVxuICAgIH0sXG4gICAgYmF0Y2g6IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsIC8vIOacrOeVqueSsOWig+OBp+OBr+acieWKueWMllxuICAgICAgY29tcHV0ZUVudmlyb25tZW50VHlwZTogJ0ZBUkdBVEUnLFxuICAgICAgaW5zdGFuY2VUeXBlczogWydvcHRpbWFsJ10sXG4gICAgICBtaW52Q3B1czogMCxcbiAgICAgIG1heHZDcHVzOiAxMDI0LCAvLyDmnKznlarnkrDlooPjgafjga/lpKfopo/mqKHlh6bnkIblr77lv5xcbiAgICAgIGRlc2lyZWR2Q3B1czogMFxuICAgIH0sXG4gICAgZWNzOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLCAvLyBFQ1Mgb24gRUMy44KS5pyJ5Yq55YyWXG4gICAgICBpbnN0YW5jZVR5cGU6ICdtNS54bGFyZ2UnLCAvLyDmnKznlarnkrDlooPjgafjga/pq5jmgKfog73jgqTjg7Pjgrnjgr/jg7PjgrlcbiAgICAgIG1pbkNhcGFjaXR5OiAxLFxuICAgICAgbWF4Q2FwYWNpdHk6IDEwLFxuICAgICAgZGVzaXJlZENhcGFjaXR5OiAyLFxuICAgICAgZW5hYmxlTWFuYWdlZEluc3RhbmNlOiB0cnVlXG4gICAgfVxuICB9LFxuXG4gIC8vIEFQSeioreWumu+8iOacrOeVqueSsOWig+W8t+WMlu+8iVxuICBhcGk6IHtcbiAgICB0aHJvdHRsaW5nOiB7XG4gICAgICByYXRlTGltaXQ6IDEwMDAwLCAvLyDmnKznlarnkrDlooPjgafjga/pq5jjgYTjg6zjg7zjg4jliLbpmZBcbiAgICAgIGJ1cnN0TGltaXQ6IDIwMDAwXG4gICAgfSxcbiAgICBjb3JzOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgYWxsb3dPcmlnaW5zOiBbXG4gICAgICAgICdodHRwczovL3JhZy1zeXN0ZW0uZXhhbXBsZS5jb20nLFxuICAgICAgICAnaHR0cHM6Ly9hcHAucmFnLXN5c3RlbS5leGFtcGxlLmNvbSdcbiAgICAgIF0sIC8vIOacrOeVqueSsOWig+OBp+OBr+eJueWumuODieODoeOCpOODs+OBruOBv1xuICAgICAgYWxsb3dNZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdERUxFVEUnLCAnT1BUSU9OUyddLFxuICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJywgJ1gtQW16LURhdGUnLCAnWC1BcGktS2V5J11cbiAgICB9LFxuICAgIGF1dGhlbnRpY2F0aW9uOiB7XG4gICAgICBjb2duaXRvRW5hYmxlZDogdHJ1ZSxcbiAgICAgIGFwaUtleVJlcXVpcmVkOiB0cnVlIC8vIOacrOeVqueSsOWig+OBp+OBr0FQSSBLZXnlv4XpoIhcbiAgICB9XG4gIH0sXG5cbiAgLy8gQUnoqK3lrprvvIjmnKznlarnkrDlooPlvLfljJbvvIlcbiAgYWk6IHtcbiAgICBiZWRyb2NrOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgbW9kZWxzOiBbXG4gICAgICAgICdhbnRocm9waWMuY2xhdWRlLTMtc29ubmV0LTIwMjQwMjI5LXYxOjAnLCAvLyDmnKznlarnkrDlooPjgafjga/pq5jmgKfog73jg6Ljg4fjg6tcbiAgICAgICAgJ2FudGhyb3BpYy5jbGF1ZGUtMy1oYWlrdS0yMDI0MDMwNy12MTowJ1xuICAgICAgXSxcbiAgICAgIG1heFRva2VuczogODE5MiwgLy8g5pys55Wq55Kw5aKD44Gn44Gv5aSn5a656YePXG4gICAgICB0ZW1wZXJhdHVyZTogMC4zIC8vIOacrOeVqueSsOWig+OBp+OBr+WuieWumuOBl+OBn+WHuuWKm1xuICAgIH0sXG4gICAgZW1iZWRkaW5nOiB7XG4gICAgICBtb2RlbDogJ2FtYXpvbi50aXRhbi1lbWJlZC10ZXh0LXYyOjAnLCAvLyDmnKznlarnkrDlooPjgafjga/mnIDmlrDjg6Ljg4fjg6tcbiAgICAgIGRpbWVuc2lvbnM6IDE1MzYsXG4gICAgICBiYXRjaFNpemU6IDUwMCAvLyDmnKznlarnkrDlooPjgafjga/lpKfjg5Djg4Pjg4HjgrXjgqTjgrpcbiAgICB9XG4gIH0sXG5cbiAgLy8g55uj6KaW6Kit5a6a77yI5pys55Wq55Kw5aKD5by35YyW77yJXG4gIG1vbml0b3Jpbmc6IHtcbiAgICBlbmFibGVEZXRhaWxlZE1vbml0b3Jpbmc6IHRydWUsXG4gICAgbG9nUmV0ZW50aW9uRGF5czogMzY1LCAvLyDmnKznlarnkrDlooPjgafjga8x5bm05L+d5oyBXG4gICAgZW5hYmxlQWxhcm1zOiB0cnVlLFxuICAgIGFsYXJtTm90aWZpY2F0aW9uRW1haWw6ICdvcHMtdGVhbUBleGFtcGxlLmNvbScsXG4gICAgZW5hYmxlRGFzaGJvYXJkOiB0cnVlLFxuICAgIGVuYWJsZVhSYXlUcmFjaW5nOiB0cnVlXG4gIH0sXG5cbiAgLy8g44Ko44Oz44K/44O844OX44Op44Kk44K66Kit5a6a77yI5pys55Wq55Kw5aKD5by35YyW77yJXG4gIGVudGVycHJpc2U6IHtcbiAgICBlbmFibGVBY2Nlc3NDb250cm9sOiB0cnVlLFxuICAgIGVuYWJsZUF1ZGl0TG9nZ2luZzogdHJ1ZSxcbiAgICBlbmFibGVCSUFuYWx5dGljczogdHJ1ZSwgLy8g5pys55Wq55Kw5aKD44Gn44Gv5pyJ5Yq55YyWXG4gICAgZW5hYmxlTXVsdGlUZW5hbnQ6IHRydWUsIC8vIOacrOeVqueSsOWig+OBp+OBr+acieWKueWMllxuICAgIGRhdGFSZXRlbnRpb25EYXlzOiAyNTU1IC8vIDflubTkv53mjIHvvIjjgrPjg7Pjg5fjg6njgqTjgqLjg7PjgrnopoHku7bvvIlcbiAgfSxcblxuICAvLyDmqZ/og73jg5Xjg6njgrDvvIjmnKznlarnkrDlooPjgafjga/lhajmqZ/og73mnInlirnvvIlcbiAgZmVhdHVyZXM6IHtcbiAgICBlbmFibGVOZXR3b3JraW5nOiB0cnVlLFxuICAgIGVuYWJsZVNlY3VyaXR5OiB0cnVlLFxuICAgIGVuYWJsZVN0b3JhZ2U6IHRydWUsXG4gICAgZW5hYmxlRGF0YWJhc2U6IHRydWUsXG4gICAgZW5hYmxlRW1iZWRkaW5nOiB0cnVlLFxuICAgIGVuYWJsZUFQSTogdHJ1ZSxcbiAgICBlbmFibGVBSTogdHJ1ZSxcbiAgICBlbmFibGVNb25pdG9yaW5nOiB0cnVlLFxuICAgIGVuYWJsZUVudGVycHJpc2U6IHRydWVcbiAgfSxcblxuICAvLyDjgr/jgrDoqK3lrprvvIjmnKznlarnkrDlooPjg7tJQU3liLbpmZDlr77lv5zvvIlcbiAgdGFnczoge1xuICAgIEVudmlyb25tZW50OiAncHJvZCcsXG4gICAgUHJvamVjdDogJ3Blcm1pc3Npb24tYXdhcmUtcmFnJyxcbiAgICBPd25lcjogJ1BsYXRmb3JtLVRlYW0nLFxuICAgIENvc3RDZW50ZXI6ICdQcm9kdWN0aW9uJyxcbiAgICBCYWNrdXA6ICdDcml0aWNhbCcsXG4gICAgTW9uaXRvcmluZzogJ0VuYWJsZWQnLFxuICAgIENvbXBsaWFuY2U6ICdTT0MyK0dEUFIrSElQQUEnLFxuICAgIERhdGFDbGFzc2lmaWNhdGlvbjogJ0NvbmZpZGVudGlhbCcsXG4gICAgUmVnaW9uOiAnYXAtbm9ydGhlYXN0LTEnLFxuICAgIFRpbWV6b25lOiAnQXNpYS9Ub2t5bycsXG4gICAgQ29tcGxpYW5jZUZyYW1ld29yazogJ1NPQzIrR0RQUitISVBBQScsXG4gICAgLy8g44Kq44OX44K344On44Oz44K/44KwXG4gICAgQnVzaW5lc3NDcml0aWNhbGl0eTogJ0hpZ2gnLFxuICAgIERpc2FzdGVyUmVjb3Zlcnk6ICdFbmFibGVkJyxcbiAgICBTZWN1cml0eUxldmVsOiAnSGlnaCcsXG4gICAgRW5jcnlwdGlvblJlcXVpcmVkOiAnWWVzJyxcbiAgICBBdWRpdFJlcXVpcmVkOiAnWWVzJyxcbiAgICBQZXJmb3JtYW5jZUxldmVsOiAnSGlnaCcsXG4gICAgQXZhaWxhYmlsaXR5VGFyZ2V0OiAnOTkuOSUnLFxuICAgIFJQTzogJzFoJyxcbiAgICBSVE86ICc0aCdcbiAgfVxufTsiXX0=