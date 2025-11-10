/**
 * 東京リージョン本番設定 - 本番環境統合設定
 * 
 * 東京リージョン（ap-northeast-1）での本番環境設定を定義します。
 */

import { EnvironmentConfig } from '../interfaces/environment-config';

// 東京リージョン本番環境設定
export const tokyoProductionConfig: EnvironmentConfig = {
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
    maxAzs: 3, // 本番環境では3AZ
    enablePublicSubnets: true,
    enablePrivateSubnets: true,
    enableIsolatedSubnets: true,
    enableNatGateway: true,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    enableFlowLogs: true,
    vpcEndpoints: {
      s3: true,
      dynamodb: true,
      lambda: false,
      opensearch: false,
      // Cognito VPC Endpoint設定（オプション）
      // CDKコンテキスト変数 `cognitoPrivateEndpoint` で有効/無効を制御可能
      // デフォルト: false（Public接続モード）
      cognito: {
        enabled: false, // デフォルトはPublic接続モード
        enablePrivateDns: true,
        subnets: {
          subnetType: 'PRIVATE_WITH_EGRESS',
        },
        securityGroupDescription: 'Security group for Cognito VPC Endpoint',
        // allowedCidrs: ['10.0.0.0/16'], // 指定しない場合、VPC CIDRが使用される
      },
    },
    securityGroups: {
      web: true,
      api: true,
      database: true,
      lambda: true,
    },
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
      automaticBackupRetentionDays: 0, // 自動バックアップ無効化（コスト最適化）
      disableBackupConfirmed: true // 本番環境での無効化を明示的に承認
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