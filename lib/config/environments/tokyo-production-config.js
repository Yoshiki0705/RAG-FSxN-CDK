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
            expirationDays: 2555 // 7年保持（コンプライアンス要件）
        },
        fsxOntap: {
            enabled: true,
            storageCapacity: 4096, // 本番環境では大容量
            throughputCapacity: 512, // 本番環境では高スループット
            deploymentType: 'MULTI_AZ_1', // 本番環境では冗長化
            automaticBackupRetentionDays: 30 // 本番環境では長期保持
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
        },
        // SQLite負荷試験設定
        sqliteLoadTest: {
            enabled: false, // 本番環境では通常無効
            enableWindowsLoadTest: false,
            scheduleExpression: 'cron(0 2 * * ? *)', // 毎日午前2時
            maxvCpus: 20,
            instanceTypes: ['m5.large', 'm5.xlarge'],
            windowsInstanceType: 't3.medium'
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
        Owner: 'Platform-Team',
        CostCenter: 'Production',
        Backup: 'Critical',
        Compliance: 'SOC2+GDPR+HIPAA',
        DataClassification: 'Confidential'
        // 他のタグは統合済み：
        // - SecurityLevel/EncryptionRequired/AuditRequired → Compliance
        // - Timezone/Region → Environment
        // - RTO/RPO → Backup
        // - PerformanceLevel/PerformanceTier → BusinessCriticality
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9reW8tcHJvZHVjdGlvbi1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0b2t5by1wcm9kdWN0aW9uLWNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7O0FBSUgsZ0JBQWdCO0FBQ0gsUUFBQSxxQkFBcUIsR0FBc0I7SUFDdEQsV0FBVyxFQUFFLE1BQU07SUFDbkIsTUFBTSxFQUFFLGdCQUFnQjtJQUV4QixXQUFXO0lBQ1gsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixPQUFPLEVBQUUsT0FBTztRQUNoQixXQUFXLEVBQUUsb0VBQW9FO0tBQ2xGO0lBRUQsa0JBQWtCO0lBQ2xCLE1BQU0sRUFBRTtRQUNOLFdBQVcsRUFBRSxzQkFBc0I7UUFDbkMsV0FBVyxFQUFFLE1BQU07UUFDbkIsWUFBWSxFQUFFLGFBQWE7UUFDM0IsU0FBUyxFQUFFLEdBQUc7S0FDZjtJQUVELG1CQUFtQjtJQUNuQixVQUFVLEVBQUU7UUFDVixPQUFPLEVBQUUsYUFBYTtRQUN0QixpQkFBaUIsRUFBRSxDQUFDLEVBQUUsWUFBWTtRQUNsQyxXQUFXLEVBQUU7WUFDWCxPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRSxDQUFDLENBQUMsa0JBQWtCO1NBQzVCO1FBQ0QsaUJBQWlCLEVBQUUsSUFBSTtRQUN2QixrQkFBa0IsRUFBRSxJQUFJO1FBQ3hCLGdCQUFnQixFQUFFLElBQUk7S0FDdkI7SUFFRCxtQkFBbUI7SUFDbkIsUUFBUSxFQUFFO1FBQ1IsU0FBUyxFQUFFLElBQUk7UUFDZixlQUFlLEVBQUUsSUFBSSxFQUFFLFlBQVk7UUFDbkMsWUFBWSxFQUFFLElBQUksRUFBRSxZQUFZO1FBQ2hDLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsY0FBYyxFQUFFLElBQUk7UUFDcEIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixtQkFBbUIsRUFBRSxJQUFJO0tBQzFCO0lBRUQsa0JBQWtCO0lBQ2xCLE9BQU8sRUFB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Z0IsRUFBRSxJQUFJO1FBQ3RCLGdCQUFnQixFQUFFLElBQUk7S0FDdkI7SUFFRCxxQkFBcUI7SUFDckIsSUFBSSxFQUFFO1FBQ0osS0FBSyxFQUFFLGVBQWU7UUFDdEIsVUFBVSxFQUFFLFlBQVk7UUFDeEIsTUFBTSxFQUFFLFVBQVU7UUFDbEIsVUFBVSxFQUFFLGlCQUFpQjtRQUM3QixrQkFBa0IsRUFBRSxjQUFjO1FBQ2xDLGFBQWE7UUFDYixnRUFBZ0U7UUFDaEUsa0NBQWtDO1FBQ2xDLHFCQUFxQjtRQUNyQiwyREFBMkQ7S0FDNUQ7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDmnbHkuqzjg6rjg7zjgrjjg6fjg7PmnKznlaroqK3lrpogLSDmnKznlarnkrDlooPntbHlkIjoqK3lrppcbiAqIFxuICog5p2x5Lqs44Oq44O844K444On44Oz77yIYXAtbm9ydGhlYXN0LTHvvInjgafjga7mnKznlarnkrDlooPoqK3lrprjgpLlrprnvqnjgZfjgb7jgZnjgIJcbiAqL1xuXG5pbXBvcnQgeyBFbnZpcm9ubWVudENvbmZpZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvZW52aXJvbm1lbnQtY29uZmlnJztcblxuLy8g5p2x5Lqs44Oq44O844K444On44Oz5pys55Wq55Kw5aKD6Kit5a6aXG5leHBvcnQgY29uc3QgdG9reW9Qcm9kdWN0aW9uQ29uZmlnOiBFbnZpcm9ubWVudENvbmZpZyA9IHtcbiAgZW52aXJvbm1lbnQ6ICdwcm9kJyxcbiAgcmVnaW9uOiAnYXAtbm9ydGhlYXN0LTEnLFxuICBcbiAgLy8g44OX44Ot44K444Kn44Kv44OI6Kit5a6aXG4gIHByb2plY3Q6IHtcbiAgICBuYW1lOiAncGVybWlzc2lvbi1hd2FyZS1yYWcnLFxuICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgZGVzY3JpcHRpb246ICdQZXJtaXNzaW9uLWF3YXJlIFJBRyBTeXN0ZW0gd2l0aCBGU3ggZm9yIE5ldEFwcCBPTlRBUCAtIFByb2R1Y3Rpb24nXG4gIH0sXG5cbiAgLy8g5ZG95ZCN6Kit5a6a77yI57Wx5LiA44GV44KM44Gf5ZG95ZCN6KaP5YmH77yJXG4gIG5hbWluZzoge1xuICAgIHByb2plY3ROYW1lOiAncGVybWlzc2lvbi1hd2FyZS1yYWcnLFxuICAgIGVudmlyb25tZW50OiAncHJvZCcsXG4gICAgcmVnaW9uUHJlZml4OiAnVG9reW9SZWdpb24nLFxuICAgIHNlcGFyYXRvcjogJy0nXG4gIH0sXG5cbiAgLy8g44ON44OD44OI44Ov44O844Kv6Kit5a6a77yI5pys55Wq55Kw5aKD5by35YyW77yJXG4gIG5ldHdvcmtpbmc6IHtcbiAgICB2cGNDaWRyOiAnMTAuMC4wLjAvMTYnLFxuICAgIGF2YWlsYWJpbGl0eVpvbmVzOiAzLCAvLyDmnKznlarnkrDlooPjgafjga8zQVpcbiAgICBuYXRHYXRld2F5czoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGNvdW50OiAzIC8vIOWQhEFa44GrTkFUIEdhdGV3YXlcbiAgICB9LFxuICAgIGVuYWJsZVZwY0Zsb3dMb2dzOiB0cnVlLFxuICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICBlbmFibGVEbnNTdXBwb3J0OiB0cnVlXG4gIH0sXG5cbiAgLy8g44K744Kt44Ol44Oq44OG44Kj6Kit5a6a77yI5pys55Wq55Kw5aKD5by35YyW77yJXG4gIHNlY3VyaXR5OiB7XG4gICAgZW5hYmxlV2FmOiB0cnVlLFxuICAgIGVuYWJsZUd1YXJkRHV0eTogdHJ1ZSwgLy8g5pys55Wq55Kw5aKD44Gn44Gv5pyJ5Yq55YyWXG4gICAgZW5hYmxlQ29uZmlnOiB0cnVlLCAvLyDmnKznlarnkrDlooPjgafjga/mnInlirnljJZcbiAgICBlbmFibGVDbG91ZFRyYWlsOiB0cnVlLFxuICAgIGttc0tleVJvdGF0aW9uOiB0cnVlLFxuICAgIGVuY3J5cHRpb25BdFJlc3Q6IHRydWUsXG4gICAgZW5jcnlwdGlvbkluVHJhbnNpdDogdHJ1ZVxuICB9LFxuXG4gIC8vIOOCueODiOODrOODvOOCuOioreWumu+8iOacrOeVqueSsOWig+W8t+WMlu+8iVxuICBzdG9yYWdlOiB7XG4gICAgczM6IHtcbiAgICAgIGVuYWJsZVZlcnNpb25pbmc6IHRydWUsXG4gICAgICBlbmFibGVMaWZlY3ljbGVQb2xpY3k6IHRydWUsXG4gICAgICB0cmFuc2l0aW9uVG9JQURheXM6IDMwLFxuICAgICAgdHJhbnNpdGlvblRvR2xhY2llckRheXM6IDkwLFxuICAgICAgZXhwaXJhdGlvbkRheXM6IDI1NTUgLy8gN+W5tOS/neaMge+8iOOCs+ODs+ODl+ODqeOCpOOCouODs+OCueimgeS7tu+8iVxuICAgIH0sXG4gICAgZnN4T250YXA6IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBzdG9yYWdlQ2FwYWNpdHk6IDQwOTYsIC8vIOacrOeVqueSsOWig+OBp+OBr+Wkp+WuuemHj1xuICAgICAgdGhyb3VnaHB1dENhcGFjaXR5OiA1MTIsIC8vIOacrOeVqueSsOWig+OBp+OBr+mrmOOCueODq+ODvOODl+ODg+ODiFxuICAgICAgZGVwbG95bWVudFR5cGU6ICdNVUxUSV9BWl8xJywgLy8g5pys55Wq55Kw5aKD44Gn44Gv5YaX6ZW35YyWXG4gICAgICBhdXRvbWF0aWNCYWNrdXBSZXRlbnRpb25EYXlzOiAzMCAvLyDmnKznlarnkrDlooPjgafjga/plbfmnJ/kv53mjIFcbiAgICB9XG4gIH0sXG5cbiAgLy8g44OH44O844K/44OZ44O844K56Kit5a6a77yI5pys55Wq55Kw5aKD5by35YyW77yJXG4gIGRhdGFiYXNlOiB7XG4gICAgZHluYW1vZGI6IHtcbiAgICAgIGJpbGxpbmdNb2RlOiAnUFJPVklTSU9ORUQnLCAvLyDmnKznlarnkrDlooPjgafjga/kuojmuKzlj6/og73jgarjgrPjgrnjg4hcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgICBlbmFibGVTdHJlYW1zOiB0cnVlLFxuICAgICAgc3RyZWFtVmlld1R5cGU6ICdORVdfQU5EX09MRF9JTUFHRVMnXG4gICAgfSxcbiAgICBvcGVuc2VhcmNoOiB7XG4gICAgICBpbnN0YW5jZVR5cGU6ICdtNmcubGFyZ2Uuc2VhcmNoJywgLy8g5pys55Wq55Kw5aKD44Gn44Gv6auY5oCn6IO944Kk44Oz44K544K/44Oz44K5XG4gICAgICBpbnN0YW5jZUNvdW50OiAzLCAvLyDmnKznlarnkrDlooPjgafjga/lhpfplbfljJZcbiAgICAgIGRlZGljYXRlZE1hc3RlckVuYWJsZWQ6IHRydWUsIC8vIOacrOeVqueSsOWig+OBp+OBr+WwgueUqOODnuOCueOCv+ODvFxuICAgICAgbWFzdGVySW5zdGFuY2VDb3VudDogMyxcbiAgICAgIGVic0VuYWJsZWQ6IHRydWUsXG4gICAgICB2b2x1bWVUeXBlOiAnZ3AzJyxcbiAgICAgIHZvbHVtZVNpemU6IDEwMCwgLy8g5pys55Wq55Kw5aKD44Gn44Gv5aSn5a656YePXG4gICAgICBlbmNyeXB0aW9uQXRSZXN0OiB0cnVlXG4gICAgfVxuICB9LFxuXG4gIC8vIEVtYmVkZGluZ+ioreWumu+8iOacrOeVqueSsOWig+W8t+WMlu+8iVxuICBlbWJlZGRpbmc6IHtcbiAgICBsYW1iZGE6IHtcbiAgICAgIHJ1bnRpbWU6ICdub2RlanMyMC54JyxcbiAgICAgIHRpbWVvdXQ6IDkwMCwgLy8g5pys55Wq55Kw5aKD44Gn44Gv5pyA5aSn44K/44Kk44Og44Ki44Km44OIXG4gICAgICBtZW1vcnlTaXplOiAzMDA4LCAvLyDmnKznlarnkrDlooPjgafjga/pq5jjg6Hjg6Ljg6pcbiAgICAgIGVuYWJsZVhSYXlUcmFjaW5nOiB0cnVlLFxuICAgICAgZW5hYmxlRGVhZExldHRlclF1ZXVlOiB0cnVlXG4gICAgfSxcbiAgICBiYXRjaDoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSwgLy8g5pys55Wq55Kw5aKD44Gn44Gv5pyJ5Yq55YyWXG4gICAgICBjb21wdXRlRW52aXJvbm1lbnRUeXBlOiAnRkFSR0FURScsXG4gICAgICBpbnN0YW5jZVR5cGVzOiBbJ29wdGltYWwnXSxcbiAgICAgIG1pbnZDcHVzOiAwLFxuICAgICAgbWF4dkNwdXM6IDEwMjQsIC8vIOacrOeVqueSsOWig+OBp+OBr+Wkp+imj+aooeWHpueQhuWvvuW/nFxuICAgICAgZGVzaXJlZHZDcHVzOiAwXG4gICAgfSxcbiAgICBlY3M6IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsIC8vIEVDUyBvbiBFQzLjgpLmnInlirnljJZcbiAgICAgIGluc3RhbmNlVHlwZTogJ201LnhsYXJnZScsIC8vIOacrOeVqueSsOWig+OBp+OBr+mrmOaAp+iDveOCpOODs+OCueOCv+ODs+OCuVxuICAgICAgbWluQ2FwYWNpdHk6IDEsXG4gICAgICBtYXhDYXBhY2l0eTogMTAsXG4gICAgICBkZXNpcmVkQ2FwYWNpdHk6IDIsXG4gICAgICBlbmFibGVNYW5hZ2VkSW5zdGFuY2U6IHRydWVcbiAgICB9LFxuICAgIC8vIFNRTGl0ZeiyoOiNt+ippumok+ioreWumlxuICAgIHNxbGl0ZUxvYWRUZXN0OiB7XG4gICAgICBlbmFibGVkOiBmYWxzZSwgLy8g5pys55Wq55Kw5aKD44Gn44Gv6YCa5bi454Sh5Yq5XG4gICAgICBlbmFibGVXaW5kb3dzTG9hZFRlc3Q6IGZhbHNlLFxuICAgICAgc2NoZWR1bGVFeHByZXNzaW9uOiAnY3JvbigwIDIgKiAqID8gKiknLCAvLyDmr47ml6XljYjliY0y5pmCXG4gICAgICBtYXh2Q3B1czogMjAsXG4gICAgICBpbnN0YW5jZVR5cGVzOiBbJ201LmxhcmdlJywgJ201LnhsYXJnZSddLFxuICAgICAgd2luZG93c0luc3RhbmNlVHlwZTogJ3QzLm1lZGl1bSdcbiAgICB9XG4gIH0sXG5cbiAgLy8gQVBJ6Kit5a6a77yI5pys55Wq55Kw5aKD5by35YyW77yJXG4gIGFwaToge1xuICAgIHRocm90dGxpbmc6IHtcbiAgICAgIHJhdGVMaW1pdDogMTAwMDAsIC8vIOacrOeVqueSsOWig+OBp+OBr+mrmOOBhOODrOODvOODiOWItumZkFxuICAgICAgYnVyc3RMaW1pdDogMjAwMDBcbiAgICB9LFxuICAgIGNvcnM6IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBhbGxvd09yaWdpbnM6IFtcbiAgICAgICAgJ2h0dHBzOi8vcmFnLXN5c3RlbS5leGFtcGxlLmNvbScsXG4gICAgICAgICdodHRwczovL2FwcC5yYWctc3lzdGVtLmV4YW1wbGUuY29tJ1xuICAgICAgXSwgLy8g5pys55Wq55Kw5aKD44Gn44Gv54m55a6a44OJ44Oh44Kk44Oz44Gu44G/XG4gICAgICBhbGxvd01ldGhvZHM6IFsnR0VUJywgJ1BPU1QnLCAnUFVUJywgJ0RFTEVURScsICdPUFRJT05TJ10sXG4gICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1BbXotRGF0ZScsICdYLUFwaS1LZXknXVxuICAgIH0sXG4gICAgYXV0aGVudGljYXRpb246IHtcbiAgICAgIGNvZ25pdG9FbmFibGVkOiB0cnVlLFxuICAgICAgYXBpS2V5UmVxdWlyZWQ6IHRydWUgLy8g5pys55Wq55Kw5aKD44Gn44GvQVBJIEtleeW/hemgiFxuICAgIH1cbiAgfSxcblxuICAvLyBBSeioreWumu+8iOacrOeVqueSsOWig+W8t+WMlu+8iVxuICBhaToge1xuICAgIGJlZHJvY2s6IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBtb2RlbHM6IFtcbiAgICAgICAgJ2FudGhyb3BpYy5jbGF1ZGUtMy1zb25uZXQtMjAyNDAyMjktdjE6MCcsIC8vIOacrOeVqueSsOWig+OBp+OBr+mrmOaAp+iDveODouODh+ODq1xuICAgICAgICAnYW50aHJvcGljLmNsYXVkZS0zLWhhaWt1LTIwMjQwMzA3LXYxOjAnXG4gICAgICBdLFxuICAgICAgbWF4VG9rZW5zOiA4MTkyLCAvLyDmnKznlarnkrDlooPjgafjga/lpKflrrnph49cbiAgICAgIHRlbXBlcmF0dXJlOiAwLjMgLy8g5pys55Wq55Kw5aKD44Gn44Gv5a6J5a6a44GX44Gf5Ye65YqbXG4gICAgfSxcbiAgICBlbWJlZGRpbmc6IHtcbiAgICAgIG1vZGVsOiAnYW1hem9uLnRpdGFuLWVtYmVkLXRleHQtdjI6MCcsIC8vIOacrOeVqueSsOWig+OBp+OBr+acgOaWsOODouODh+ODq1xuICAgICAgZGltZW5zaW9uczogMTUzNixcbiAgICAgIGJhdGNoU2l6ZTogNTAwIC8vIOacrOeVqueSsOWig+OBp+OBr+Wkp+ODkOODg+ODgeOCteOCpOOCulxuICAgIH1cbiAgfSxcblxuICAvLyDnm6PoppboqK3lrprvvIjmnKznlarnkrDlooPlvLfljJbvvIlcbiAgbW9uaXRvcmluZzoge1xuICAgIGVuYWJsZURldGFpbGVkTW9uaXRvcmluZzogdHJ1ZSxcbiAgICBsb2dSZXRlbnRpb25EYXlzOiAzNjUsIC8vIOacrOeVqueSsOWig+OBp+OBrzHlubTkv53mjIFcbiAgICBlbmFibGVBbGFybXM6IHRydWUsXG4gICAgYWxhcm1Ob3RpZmljYXRpb25FbWFpbDogJ29wcy10ZWFtQGV4YW1wbGUuY29tJyxcbiAgICBlbmFibGVEYXNoYm9hcmQ6IHRydWUsXG4gICAgZW5hYmxlWFJheVRyYWNpbmc6IHRydWVcbiAgfSxcblxuICAvLyDjgqjjg7Pjgr/jg7zjg5fjg6njgqTjgrroqK3lrprvvIjmnKznlarnkrDlooPlvLfljJbvvIlcbiAgZW50ZXJwcmlzZToge1xuICAgIGVuYWJsZUFjY2Vzc0NvbnRyb2w6IHRydWUsXG4gICAgZW5hYmxlQXVkaXRMb2dnaW5nOiB0cnVlLFxuICAgIGVuYWJsZUJJQW5hbHl0aWNzOiB0cnVlLCAvLyDmnKznlarnkrDlooPjgafjga/mnInlirnljJZcbiAgICBlbmFibGVNdWx0aVRlbmFudDogdHJ1ZSwgLy8g5pys55Wq55Kw5aKD44Gn44Gv5pyJ5Yq55YyWXG4gICAgZGF0YVJldGVudGlvbkRheXM6IDI1NTUgLy8gN+W5tOS/neaMge+8iOOCs+ODs+ODl+ODqeOCpOOCouODs+OCueimgeS7tu+8iVxuICB9LFxuXG4gIC8vIOapn+iDveODleODqeOCsO+8iOacrOeVqueSsOWig+OBp+OBr+WFqOapn+iDveacieWKue+8iVxuICBmZWF0dXJlczoge1xuICAgIGVuYWJsZU5ldHdvcmtpbmc6IHRydWUsXG4gICAgZW5hYmxlU2VjdXJpdHk6IHRydWUsXG4gICAgZW5hYmxlU3RvcmFnZTogdHJ1ZSxcbiAgICBlbmFibGVEYXRhYmFzZTogdHJ1ZSxcbiAgICBlbmFibGVFbWJlZGRpbmc6IHRydWUsXG4gICAgZW5hYmxlQVBJOiB0cnVlLFxuICAgIGVuYWJsZUFJOiB0cnVlLFxuICAgIGVuYWJsZU1vbml0b3Jpbmc6IHRydWUsXG4gICAgZW5hYmxlRW50ZXJwcmlzZTogdHJ1ZVxuICB9LFxuXG4gIC8vIOOCv+OCsOioreWumu+8iOacrOeVqueSsOWig+ODu0lBTeWItumZkOWvvuW/nO+8iVxuICB0YWdzOiB7XG4gICAgT3duZXI6ICdQbGF0Zm9ybS1UZWFtJyxcbiAgICBDb3N0Q2VudGVyOiAnUHJvZHVjdGlvbicsXG4gICAgQmFja3VwOiAnQ3JpdGljYWwnLFxuICAgIENvbXBsaWFuY2U6ICdTT0MyK0dEUFIrSElQQUEnLFxuICAgIERhdGFDbGFzc2lmaWNhdGlvbjogJ0NvbmZpZGVudGlhbCdcbiAgICAvLyDku5bjga7jgr/jgrDjga/ntbHlkIjmuIjjgb/vvJpcbiAgICAvLyAtIFNlY3VyaXR5TGV2ZWwvRW5jcnlwdGlvblJlcXVpcmVkL0F1ZGl0UmVxdWlyZWQg4oaSIENvbXBsaWFuY2VcbiAgICAvLyAtIFRpbWV6b25lL1JlZ2lvbiDihpIgRW52aXJvbm1lbnRcbiAgICAvLyAtIFJUTy9SUE8g4oaSIEJhY2t1cFxuICAgIC8vIC0gUGVyZm9ybWFuY2VMZXZlbC9QZXJmb3JtYW5jZVRpZXIg4oaSIEJ1c2luZXNzQ3JpdGljYWxpdHlcbiAgfVxufTsiXX0=