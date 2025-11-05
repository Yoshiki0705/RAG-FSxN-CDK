"use strict";
/**
 * 東京リージョン開発設定 - SQLite負荷試験対応
 *
 * 東京リージョン（ap-northeast-1）での開発環境設定を定義します。
 * SQLite負荷試験機能を含む包括的な設定
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokyoDevelopmentConfig = void 0;
// 東京リージョン開発環境設定
exports.tokyoDevelopmentConfig = {
    environment: 'dev',
    region: 'ap-northeast-1',
    // プロジェクト設定
    project: {
        name: 'permission-aware-rag',
        version: '1.0.0',
        description: 'Permission-aware RAG System with FSx for NetApp ONTAP - Development'
    },
    // 命名設定（統一された命名規則）
    naming: {
        projectName: 'permission-aware-rag',
        environment: 'dev',
        regionPrefix: 'TokyoRegion',
        separator: '-'
    },
    // ネットワーク設定（開発環境）
    networking: {
        vpcCidr: '10.21.0.0/16', // 既存VPCのCIDR
        availabilityZones: 2, // 開発環境では2AZ
        natGateways: {
            enabled: true,
            count: 1 // 開発環境では1つのNAT Gateway
        },
        enableVpcFlowLogs: false, // 開発環境ではコスト削減
        enableDnsHostnames: true,
        enableDnsSupport: true
    },
    // セキュリティ設定（開発環境）
    security: {
        enableWaf: false, // 開発環境ではコスト削減
        enableGuardDuty: false,
        enableConfig: false,
        enableCloudTrail: true,
        kmsKeyRotation: false, // 開発環境では無効
        encryptionAtRest: true,
        encryptionInTransit: true
    },
    // ストレージ設定（開発環境）
    storage: {
        s3: {
            enableVersioning: true,
            enableLifecyclePolicy: true,
            transitionToIADays: 30,
            transitionToGlacierDays: 90,
            expirationDays: 365 // 開発環境では1年保持
        },
        fsxOntap: {
            enabled: true,
            storageCapacity: 1024, // 開発環境では小容量
            throughputCapacity: 128, // 開発環境では低スループット
            deploymentType: 'SINGLE_AZ_1', // 開発環境では単一AZ
            automaticBackupRetentionDays: 7 // 開発環境では短期保持
        }
    },
    // データベース設定（開発環境）
    database: {
        dynamodb: {
            billingMode: 'PAY_PER_REQUEST', // 開発環境では従量課金
            pointInTimeRecovery: false, // 開発環境では無効
            enableStreams: false,
            streamViewType: 'KEYS_ONLY'
        },
        opensearch: {
            instanceType: 't3.small.search', // 開発環境では小型インスタンス
            instanceCount: 1, // 開発環境では単一インスタンス
            dedicatedMasterEnabled: false,
            masterInstanceCount: 0,
            ebsEnabled: true,
            volumeType: 'gp3',
            volumeSize: 20, // 開発環境では小容量
            encryptionAtRest: true
        }
    },
    // Embedding設定（開発環境・SQLite負荷試験対応）
    embedding: {
        lambda: {
            runtime: 'nodejs20.x',
            timeout: 300, // 開発環境では短いタイムアウト
            memorySize: 1024, // 開発環境では標準メモリ
            enableXRayTracing: false, // 開発環境ではコスト削減
            enableDeadLetterQueue: true
        },
        batch: {
            enabled: true,
            computeEnvironmentType: 'EC2', // 開発環境ではEC2
            instanceTypes: ['m5.large', 'm5.xlarge'],
            minvCpus: 0,
            maxvCpus: 20, // 開発環境では小規模
            desiredvCpus: 0
        },
        ecs: {
            enabled: false, // 開発環境では無効化
            instanceType: 'm5.large',
            minCapacity: 0,
            maxCapacity: 2,
            desiredCapacity: 0,
            enableManagedInstance: false
        },
        // SQLite負荷試験設定（開発環境で有効）
        sqliteLoadTest: {
            enabled: true, // 開発環境では有効
            enableWindowsLoadTest: true,
            fsxFileSystemId: 'fs-0efd9429aa9ba839a',
            fsxSvmId: 'svm-01b48eb910be1c588',
            fsxVolumeId: 'fsvol-0413e32de284cd0e4',
            fsxMountPath: '/sqlite-load-test',
            fsxNfsEndpoint: 'svm-01b48eb910be1c588.fs-0efd9429aa9ba839a.fsx.ap-northeast-1.amazonaws.com',
            fsxCifsEndpoint: '10.21.3.131',
            fsxCifsShareName: 'sqlite-load-test',
            keyPairName: 'fujiwara-2025',
            scheduleExpression: 'cron(0 2 * * ? *)', // 毎日午前2時
            maxvCpus: 20,
            instanceTypes: ['m5.large', 'm5.xlarge'],
            windowsInstanceType: 't3.medium',
            bedrockRegion: 'ap-northeast-1',
            bedrockModelId: 'amazon.titan-embed-text-v1'
        }
    },
    // API設定（開発環境）
    api: {
        throttling: {
            rateLimit: 1000, // 開発環境では低いレート制限
            burstLimit: 2000
        },
        cors: {
            enabled: true,
            allowOrigins: ['*'], // 開発環境では全て許可
            allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key']
        },
        authentication: {
            cognitoEnabled: true,
            apiKeyRequired: false // 開発環境では不要
        }
    },
    // AI設定（開発環境）
    ai: {
        bedrock: {
            enabled: true,
            models: [
                'anthropic.claude-3-haiku-20240307-v1:0', // 開発環境では軽量モデル
                'amazon.titan-embed-text-v1'
            ],
            maxTokens: 4096, // 開発環境では標準容量
            temperature: 0.7 // 開発環境では多様な出力
        },
        embedding: {
            model: 'amazon.titan-embed-text-v1',
            dimensions: 1536,
            batchSize: 100 // 開発環境では小バッチサイズ
        }
    },
    // 監視設定（開発環境）
    monitoring: {
        enableDetailedMonitoring: false, // 開発環境ではコスト削減
        logRetentionDays: 30, // 開発環境では短期保持
        enableAlarms: true,
        alarmNotificationEmail: 'dev-team@example.com',
        enableDashboard: true,
        enableXRayTracing: false // 開発環境ではコスト削減
    },
    // エンタープライズ設定（開発環境）
    enterprise: {
        enableAccessControl: true,
        enableAuditLogging: false, // 開発環境では無効
        enableBIAnalytics: false,
        enableMultiTenant: false,
        dataRetentionDays: 90 // 開発環境では短期保持
    },
    // 機能フラグ（開発環境では選択的有効化）
    features: {
        enableNetworking: true,
        enableSecurity: true,
        enableStorage: true,
        enableDatabase: true,
        enableEmbedding: true,
        enableAPI: true,
        enableAI: true,
        enableMonitoring: true,
        enableEnterprise: false // 開発環境では無効
    },
    // タグ設定（開発環境）
    tags: {
        Owner: 'Development-Team',
        CostCenter: 'Development',
        Backup: 'Standard',
        Compliance: 'Basic',
        DataClassification: 'Internal'
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9reW8tZGV2ZWxvcG1lbnQtY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidG9reW8tZGV2ZWxvcG1lbnQtY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7R0FLRzs7O0FBSUgsZ0JBQWdCO0FBQ0gsUUFBQSxzQkFBc0IsR0FBc0I7SUFDdkQsV0FBVyxFQUFFLEtBQUs7SUFDbEIsTUFBTSxFQUFFLGdCQUFnQjtJQUV4QixXQUFXO0lBQ1gsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixPQUFPLEVBQUUsT0FBTztRQUNoQixXQUFXLEVBQUUscUVBQXFFO0tBQ25GO0lBRUQsa0JBQWtCO0lBQ2xCLE1BQU0sRUFBRTtRQUNOLFdBQVcsRUFBRSxzQkFBc0I7UUFDbkMsV0FBVyxFQUFFLEtBQUs7UUFDbEIsWUFBWSxFQUFFLGFBQWE7UUFDM0IsU0FBUyxFQUFFLEdBQUc7S0FDZjtJQUVELGlCQUFpQjtJQUNqQixVQUFVLEVBQUU7UUFDVixPQUFPLEVBQUUsY0FBYyxFQUFFLGFBQWE7UUFDdEMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLFlBQVk7UUFDbEMsV0FBVyxFQUFFO1lBQ1gsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QjtTQUNqQztRQUNELGlCQUFpQixFQUFFLEtBQUssRUFBRSxjQUFjO1FBQ3hDLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsZ0JBQWdCLEVBQUUsSUFBSTtLQUN2QjtJQUVELGlCQUFpQjtJQUNqQixRQUFRLEVBQUU7UUFDUixTQUFTLEVBQUUsS0FBSyxFQUFFLGNBQWM7UUFDaEMsZUFBZSxFQUFFLEtBQUs7UUFDdEIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixjQUFjLEVBQUUsS0FBSyxFQUFFLFdBQVc7UUFDbEMsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixtQkFBbUIsRUFBRSxJQUFJO0tBQzFCO0lB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LEtBQUs7UUFDeEIsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGFBQWE7S0FDcEM7SUFFRCxzQkFBc0I7SUFDdEIsUUFBUSxFQUFFO1FBQ1IsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixjQUFjLEVBQUUsSUFBSTtRQUNwQixhQUFhLEVBQUUsSUFBSTtRQUNuQixjQUFjLEVBQUUsSUFBSTtRQUNwQixlQUFlLEVBQUUsSUFBSTtRQUNyQixTQUFTLEVBQUUsSUFBSTtRQUNmLFFBQVEsRUFBRSxJQUFJO1FBQ2QsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixnQkFBZ0IsRUFBRSxLQUFLLENBQUMsV0FBVztLQUNwQztJQUVELGFBQWE7SUFDYixJQUFJLEVBQUU7UUFDSixLQUFLLEVBQUUsa0JBQWtCO1FBQ3pCLFVBQVUsRUFBRSxhQUFhO1FBQ3pCLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLFVBQVUsRUFBRSxPQUFPO1FBQ25CLGtCQUFrQixFQUFFLFVBQVU7S0FDL0I7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDmnbHkuqzjg6rjg7zjgrjjg6fjg7PplovnmbroqK3lrpogLSBTUUxpdGXosqDojbfoqabpqJPlr77lv5xcbiAqIFxuICog5p2x5Lqs44Oq44O844K444On44Oz77yIYXAtbm9ydGhlYXN0LTHvvInjgafjga7plovnmbrnkrDlooPoqK3lrprjgpLlrprnvqnjgZfjgb7jgZnjgIJcbiAqIFNRTGl0ZeiyoOiNt+ippumok+apn+iDveOCkuWQq+OCgOWMheaLrOeahOOBquioreWumlxuICovXG5cbmltcG9ydCB7IEVudmlyb25tZW50Q29uZmlnIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9lbnZpcm9ubWVudC1jb25maWcnO1xuXG4vLyDmnbHkuqzjg6rjg7zjgrjjg6fjg7PplovnmbrnkrDlooPoqK3lrppcbmV4cG9ydCBjb25zdCB0b2t5b0RldmVsb3BtZW50Q29uZmlnOiBFbnZpcm9ubWVudENvbmZpZyA9IHtcbiAgZW52aXJvbm1lbnQ6ICdkZXYnLFxuICByZWdpb246ICdhcC1ub3J0aGVhc3QtMScsXG4gIFxuICAvLyDjg5fjg63jgrjjgqfjgq/jg4joqK3lrppcbiAgcHJvamVjdDoge1xuICAgIG5hbWU6ICdwZXJtaXNzaW9uLWF3YXJlLXJhZycsXG4gICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICBkZXNjcmlwdGlvbjogJ1Blcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbSB3aXRoIEZTeCBmb3IgTmV0QXBwIE9OVEFQIC0gRGV2ZWxvcG1lbnQnXG4gIH0sXG5cbiAgLy8g5ZG95ZCN6Kit5a6a77yI57Wx5LiA44GV44KM44Gf5ZG95ZCN6KaP5YmH77yJXG4gIG5hbWluZzoge1xuICAgIHByb2plY3ROYW1lOiAncGVybWlzc2lvbi1hd2FyZS1yYWcnLFxuICAgIGVudmlyb25tZW50OiAnZGV2JyxcbiAgICByZWdpb25QcmVmaXg6ICdUb2t5b1JlZ2lvbicsXG4gICAgc2VwYXJhdG9yOiAnLSdcbiAgfSxcblxuICAvLyDjg43jg4Pjg4jjg6/jg7zjgq/oqK3lrprvvIjplovnmbrnkrDlooPvvIlcbiAgbmV0d29ya2luZzoge1xuICAgIHZwY0NpZHI6ICcxMC4yMS4wLjAvMTYnLCAvLyDml6LlrZhWUEPjga5DSURSXG4gICAgYXZhaWxhYmlsaXR5Wm9uZXM6IDIsIC8vIOmWi+eZuueSsOWig+OBp+OBrzJBWlxuICAgIG5hdEdhdGV3YXlzOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgY291bnQ6IDEgLy8g6ZaL55m655Kw5aKD44Gn44GvMeOBpOOBrk5BVCBHYXRld2F5XG4gICAgfSxcbiAgICBlbmFibGVWcGNGbG93TG9nczogZmFsc2UsIC8vIOmWi+eZuueSsOWig+OBp+OBr+OCs+OCueODiOWJiua4m1xuICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICBlbmFibGVEbnNTdXBwb3J0OiB0cnVlXG4gIH0sXG5cbiAgLy8g44K744Kt44Ol44Oq44OG44Kj6Kit5a6a77yI6ZaL55m655Kw5aKD77yJXG4gIHNlY3VyaXR5OiB7XG4gICAgZW5hYmxlV2FmOiBmYWxzZSwgLy8g6ZaL55m655Kw5aKD44Gn44Gv44Kz44K544OI5YmK5ribXG4gICAgZW5hYmxlR3VhcmREdXR5OiBmYWxzZSxcbiAgICBlbmFibGVDb25maWc6IGZhbHNlLFxuICAgIGVuYWJsZUNsb3VkVHJhaWw6IHRydWUsXG4gICAga21zS2V5Um90YXRpb246IGZhbHNlLCAvLyDplovnmbrnkrDlooPjgafjga/nhKHlirlcbiAgICBlbmNyeXB0aW9uQXRSZXN0OiB0cnVlLFxuICAgIGVuY3J5cHRpb25JblRyYW5zaXQ6IHRydWVcbiAgfSxcblxuICAvLyDjgrnjg4jjg6zjg7zjgrjoqK3lrprvvIjplovnmbrnkrDlooPvvIlcbiAgc3RvcmFnZToge1xuICAgIHMzOiB7XG4gICAgICBlbmFibGVWZXJzaW9uaW5nOiB0cnVlLFxuICAgICAgZW5hYmxlTGlmZWN5Y2xlUG9saWN5OiB0cnVlLFxuICAgICAgdHJhbnNpdGlvblRvSUFEYXlzOiAzMCxcbiAgICAgIHRyYW5zaXRpb25Ub0dsYWNpZXJEYXlzOiA5MCxcbiAgICAgIGV4cGlyYXRpb25EYXlzOiAzNjUgLy8g6ZaL55m655Kw5aKD44Gn44GvMeW5tOS/neaMgVxuICAgIH0sXG4gICAgZnN4T250YXA6IHtcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBzdG9yYWdlQ2FwYWNpdHk6IDEwMjQsIC8vIOmWi+eZuueSsOWig+OBp+OBr+Wwj+WuuemHj1xuICAgICAgdGhyb3VnaHB1dENhcGFjaXR5OiAxMjgsIC8vIOmWi+eZuueSsOWig+OBp+OBr+S9juOCueODq+ODvOODl+ODg+ODiFxuICAgICAgZGVwbG95bWVudFR5cGU6ICdTSU5HTEVfQVpfMScsIC8vIOmWi+eZuueSsOWig+OBp+OBr+WNmOS4gEFaXG4gICAgICBhdXRvbWF0aWNCYWNrdXBSZXRlbnRpb25EYXlzOiA3IC8vIOmWi+eZuueSsOWig+OBp+OBr+efreacn+S/neaMgVxuICAgIH1cbiAgfSxcblxuICAvLyDjg4fjg7zjgr/jg5njg7zjgrnoqK3lrprvvIjplovnmbrnkrDlooPvvIlcbiAgZGF0YWJhc2U6IHtcbiAgICBkeW5hbW9kYjoge1xuICAgICAgYmlsbGluZ01vZGU6ICdQQVlfUEVSX1JFUVVFU1QnLCAvLyDplovnmbrnkrDlooPjgafjga/lvpPph4/oqrLph5FcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IGZhbHNlLCAvLyDplovnmbrnkrDlooPjgafjga/nhKHlirlcbiAgICAgIGVuYWJsZVN0cmVhbXM6IGZhbHNlLFxuICAgICAgc3RyZWFtVmlld1R5cGU6ICdLRVlTX09OTFknXG4gICAgfSxcbiAgICBvcGVuc2VhcmNoOiB7XG4gICAgICBpbnN0YW5jZVR5cGU6ICd0My5zbWFsbC5zZWFyY2gnLCAvLyDplovnmbrnkrDlooPjgafjga/lsI/lnovjgqTjg7Pjgrnjgr/jg7PjgrlcbiAgICAgIGluc3RhbmNlQ291bnQ6IDEsIC8vIOmWi+eZuueSsOWig+OBp+OBr+WNmOS4gOOCpOODs+OCueOCv+ODs+OCuVxuICAgICAgZGVkaWNhdGVkTWFzdGVyRW5hYmxlZDogZmFsc2UsXG4gICAgICBtYXN0ZXJJbnN0YW5jZUNvdW50OiAwLFxuICAgICAgZWJzRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHZvbHVtZVR5cGU6ICdncDMnLFxuICAgICAgdm9sdW1lU2l6ZTogMjAsIC8vIOmWi+eZuueSsOWig+OBp+OBr+Wwj+WuuemHj1xuICAgICAgZW5jcnlwdGlvbkF0UmVzdDogdHJ1ZVxuICAgIH1cbiAgfSxcblxuICAvLyBFbWJlZGRpbmfoqK3lrprvvIjplovnmbrnkrDlooPjg7tTUUxpdGXosqDojbfoqabpqJPlr77lv5zvvIlcbiAgZW1iZWRkaW5nOiB7XG4gICAgbGFtYmRhOiB7XG4gICAgICBydW50aW1lOiAnbm9kZWpzMjAueCcsXG4gICAgICB0aW1lb3V0OiAzMDAsIC8vIOmWi+eZuueSsOWig+OBp+OBr+efreOBhOOCv+OCpOODoOOCouOCpuODiFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCwgLy8g6ZaL55m655Kw5aKD44Gn44Gv5qiZ5rqW44Oh44Oi44OqXG4gICAgICBlbmFibGVYUmF5VHJhY2luZzogZmFsc2UsIC8vIOmWi+eZuueSsOWig+OBp+OBr+OCs+OCueODiOWJiua4m1xuICAgICAgZW5hYmxlRGVhZExldHRlclF1ZXVlOiB0cnVlXG4gICAgfSxcbiAgICBiYXRjaDoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGNvbXB1dGVFbnZpcm9ubWVudFR5cGU6ICdFQzInLCAvLyDplovnmbrnkrDlooPjgafjga9FQzJcbiAgICAgIGluc3RhbmNlVHlwZXM6IFsnbTUubGFyZ2UnLCAnbTUueGxhcmdlJ10sXG4gICAgICBtaW52Q3B1czogMCxcbiAgICAgIG1heHZDcHVzOiAyMCwgLy8g6ZaL55m655Kw5aKD44Gn44Gv5bCP6KaP5qihXG4gICAgICBkZXNpcmVkdkNwdXM6IDBcbiAgICB9LFxuICAgIGVjczoge1xuICAgICAgZW5hYmxlZDogZmFsc2UsIC8vIOmWi+eZuueSsOWig+OBp+OBr+eEoeWKueWMllxuICAgICAgaW5zdGFuY2VUeXBlOiAnbTUubGFyZ2UnLFxuICAgICAgbWluQ2FwYWNpdHk6IDAsXG4gICAgICBtYXhDYXBhY2l0eTogMixcbiAgICAgIGRlc2lyZWRDYXBhY2l0eTogMCxcbiAgICAgIGVuYWJsZU1hbmFnZWRJbnN0YW5jZTogZmFsc2VcbiAgICB9LFxuICAgIC8vIFNRTGl0ZeiyoOiNt+ippumok+ioreWumu+8iOmWi+eZuueSsOWig+OBp+acieWKue+8iVxuICAgIHNxbGl0ZUxvYWRUZXN0OiB7XG4gICAgICBlbmFibGVkOiB0cnVlLCAvLyDplovnmbrnkrDlooPjgafjga/mnInlirlcbiAgICAgIGVuYWJsZVdpbmRvd3NMb2FkVGVzdDogdHJ1ZSxcbiAgICAgIGZzeEZpbGVTeXN0ZW1JZDogJ2ZzLTBlZmQ5NDI5YWE5YmE4MzlhJyxcbiAgICAgIGZzeFN2bUlkOiAnc3ZtLTAxYjQ4ZWI5MTBiZTFjNTg4JyxcbiAgICAgIGZzeFZvbHVtZUlkOiAnZnN2b2wtMDQxM2UzMmRlMjg0Y2QwZTQnLFxuICAgICAgZnN4TW91bnRQYXRoOiAnL3NxbGl0ZS1sb2FkLXRlc3QnLFxuICAgICAgZnN4TmZzRW5kcG9pbnQ6ICdzdm0tMDFiNDhlYjkxMGJlMWM1ODguZnMtMGVmZDk0MjlhYTliYTgzOWEuZnN4LmFwLW5vcnRoZWFzdC0xLmFtYXpvbmF3cy5jb20nLFxuICAgICAgZnN4Q2lmc0VuZHBvaW50OiAnMTAuMjEuMy4xMzEnLFxuICAgICAgZnN4Q2lmc1NoYXJlTmFtZTogJ3NxbGl0ZS1sb2FkLXRlc3QnLFxuICAgICAga2V5UGFpck5hbWU6ICdmdWppd2FyYS0yMDI1JyxcbiAgICAgIHNjaGVkdWxlRXhwcmVzc2lvbjogJ2Nyb24oMCAyICogKiA/ICopJywgLy8g5q+O5pel5Y2I5YmNMuaZglxuICAgICAgbWF4dkNwdXM6IDIwLFxuICAgICAgaW5zdGFuY2VUeXBlczogWydtNS5sYXJnZScsICdtNS54bGFyZ2UnXSxcbiAgICAgIHdpbmRvd3NJbnN0YW5jZVR5cGU6ICd0My5tZWRpdW0nLFxuICAgICAgYmVkcm9ja1JlZ2lvbjogJ2FwLW5vcnRoZWFzdC0xJyxcbiAgICAgIGJlZHJvY2tNb2RlbElkOiAnYW1hem9uLnRpdGFuLWVtYmVkLXRleHQtdjEnXG4gICAgfVxuICB9LFxuXG4gIC8vIEFQSeioreWumu+8iOmWi+eZuueSsOWig++8iVxuICBhcGk6IHtcbiAgICB0aHJvdHRsaW5nOiB7XG4gICAgICByYXRlTGltaXQ6IDEwMDAsIC8vIOmWi+eZuueSsOWig+OBp+OBr+S9juOBhOODrOODvOODiOWItumZkFxuICAgICAgYnVyc3RMaW1pdDogMjAwMFxuICAgIH0sXG4gICAgY29yczoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGFsbG93T3JpZ2luczogWycqJ10sIC8vIOmWi+eZuueSsOWig+OBp+OBr+WFqOOBpuioseWPr1xuICAgICAgYWxsb3dNZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdERUxFVEUnLCAnT1BUSU9OUyddLFxuICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJywgJ1gtQW16LURhdGUnLCAnWC1BcGktS2V5J11cbiAgICB9LFxuICAgIGF1dGhlbnRpY2F0aW9uOiB7XG4gICAgICBjb2duaXRvRW5hYmxlZDogdHJ1ZSxcbiAgICAgIGFwaUtleVJlcXVpcmVkOiBmYWxzZSAvLyDplovnmbrnkrDlooPjgafjga/kuI3opoFcbiAgICB9XG4gIH0sXG5cbiAgLy8gQUnoqK3lrprvvIjplovnmbrnkrDlooPvvIlcbiAgYWk6IHtcbiAgICBiZWRyb2NrOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgbW9kZWxzOiBbXG4gICAgICAgICdhbnRocm9waWMuY2xhdWRlLTMtaGFpa3UtMjAyNDAzMDctdjE6MCcsIC8vIOmWi+eZuueSsOWig+OBp+OBr+i7vemHj+ODouODh+ODq1xuICAgICAgICAnYW1hem9uLnRpdGFuLWVtYmVkLXRleHQtdjEnXG4gICAgICBdLFxuICAgICAgbWF4VG9rZW5zOiA0MDk2LCAvLyDplovnmbrnkrDlooPjgafjga/mqJnmupblrrnph49cbiAgICAgIHRlbXBlcmF0dXJlOiAwLjcgLy8g6ZaL55m655Kw5aKD44Gn44Gv5aSa5qeY44Gq5Ye65YqbXG4gICAgfSxcbiAgICBlbWJlZGRpbmc6IHtcbiAgICAgIG1vZGVsOiAnYW1hem9uLnRpdGFuLWVtYmVkLXRleHQtdjEnLFxuICAgICAgZGltZW5zaW9uczogMTUzNixcbiAgICAgIGJhdGNoU2l6ZTogMTAwIC8vIOmWi+eZuueSsOWig+OBp+OBr+Wwj+ODkOODg+ODgeOCteOCpOOCulxuICAgIH1cbiAgfSxcblxuICAvLyDnm6PoppboqK3lrprvvIjplovnmbrnkrDlooPvvIlcbiAgbW9uaXRvcmluZzoge1xuICAgIGVuYWJsZURldGFpbGVkTW9uaXRvcmluZzogZmFsc2UsIC8vIOmWi+eZuueSsOWig+OBp+OBr+OCs+OCueODiOWJiua4m1xuICAgIGxvZ1JldGVudGlvbkRheXM6IDMwLCAvLyDplovnmbrnkrDlooPjgafjga/nn63mnJ/kv53mjIFcbiAgICBlbmFibGVBbGFybXM6IHRydWUsXG4gICAgYWxhcm1Ob3RpZmljYXRpb25FbWFpbDogJ2Rldi10ZWFtQGV4YW1wbGUuY29tJyxcbiAgICBlbmFibGVEYXNoYm9hcmQ6IHRydWUsXG4gICAgZW5hYmxlWFJheVRyYWNpbmc6IGZhbHNlIC8vIOmWi+eZuueSsOWig+OBp+OBr+OCs+OCueODiOWJiua4m1xuICB9LFxuXG4gIC8vIOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuuioreWumu+8iOmWi+eZuueSsOWig++8iVxuICBlbnRlcnByaXNlOiB7XG4gICAgZW5hYmxlQWNjZXNzQ29udHJvbDogdHJ1ZSxcbiAgICBlbmFibGVBdWRpdExvZ2dpbmc6IGZhbHNlLCAvLyDplovnmbrnkrDlooPjgafjga/nhKHlirlcbiAgICBlbmFibGVCSUFuYWx5dGljczogZmFsc2UsXG4gICAgZW5hYmxlTXVsdGlUZW5hbnQ6IGZhbHNlLFxuICAgIGRhdGFSZXRlbnRpb25EYXlzOiA5MCAvLyDplovnmbrnkrDlooPjgafjga/nn63mnJ/kv53mjIFcbiAgfSxcblxuICAvLyDmqZ/og73jg5Xjg6njgrDvvIjplovnmbrnkrDlooPjgafjga/pgbjmip7nmoTmnInlirnljJbvvIlcbiAgZmVhdHVyZXM6IHtcbiAgICBlbmFibGVOZXR3b3JraW5nOiB0cnVlLFxuICAgIGVuYWJsZVNlY3VyaXR5OiB0cnVlLFxuICAgIGVuYWJsZVN0b3JhZ2U6IHRydWUsXG4gICAgZW5hYmxlRGF0YWJhc2U6IHRydWUsXG4gICAgZW5hYmxlRW1iZWRkaW5nOiB0cnVlLFxuICAgIGVuYWJsZUFQSTogdHJ1ZSxcbiAgICBlbmFibGVBSTogdHJ1ZSxcbiAgICBlbmFibGVNb25pdG9yaW5nOiB0cnVlLFxuICAgIGVuYWJsZUVudGVycHJpc2U6IGZhbHNlIC8vIOmWi+eZuueSsOWig+OBp+OBr+eEoeWKuVxuICB9LFxuXG4gIC8vIOOCv+OCsOioreWumu+8iOmWi+eZuueSsOWig++8iVxuICB0YWdzOiB7XG4gICAgT3duZXI6ICdEZXZlbG9wbWVudC1UZWFtJyxcbiAgICBDb3N0Q2VudGVyOiAnRGV2ZWxvcG1lbnQnLFxuICAgIEJhY2t1cDogJ1N0YW5kYXJkJyxcbiAgICBDb21wbGlhbmNlOiAnQmFzaWMnLFxuICAgIERhdGFDbGFzc2lmaWNhdGlvbjogJ0ludGVybmFsJ1xuICB9XG59OyJdfQ==