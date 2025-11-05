/**
 * Global Configuration Types
 * グローバル設定型定義
 * 
 * 14地域対応のグローバル多地域RAGシステム設定
 */

import { NetworkingConfig } from '../lib/modules/networking/interfaces';
import { SecurityConfig } from '../lib/modules/security/interfaces';
import { MarkitdownConfig } from './markitdown-config';

export interface GlobalRagConfig {
  // 基本設定
  projectName: string;
  environment: 'dev' | 'staging' | 'prod';
  region: string;
  regionPrefix?: string;
  
  // 機能フラグ
  features: {
    networking: NetworkingFeatures;
    security: SecurityFeatures;
    storage: StorageFeatures;
    database: DatabaseFeatures;
    compute: ComputeFeatures;
    api: ApiFeatures;
    ai: AiFeatures;
    monitoring: MonitoringFeatures;
    enterprise: EnterpriseFeatures;
  };
  
  // 地域別設定
  regionalSettings: RegionalSettings;
  
  // 災害復旧設定（オプション機能）
  disasterRecovery?: DisasterRecoveryConfig;
  
  // コンプライアンス設定
  compliance: ComplianceSettings;
}

export interface NetworkingFeatures {
  vpc: boolean;
  loadBalancer: boolean;
  cdn: boolean;
  customDomain?: string;
  config?: NetworkingConfig;
}

export interface SecurityFeatures {
  waf: boolean;
  cognito: boolean;
  encryption: boolean;
  compliance: boolean;
  config?: SecurityConfig;
}

export interface StorageFeatures {
  fsx: boolean;
  s3: boolean;
  backup: boolean;
  lifecycle: boolean;
}

export interface DatabaseFeatures {
  dynamodb: boolean;
  opensearch: boolean;
  rds?: boolean;
  migration: boolean;
}

export interface ComputeFeatures {
  lambda: boolean;
  ecs?: boolean;
  batch?: boolean;
  scaling: boolean;
}

export interface ApiFeatures {
  restApi: boolean;
  graphql?: boolean;
  websocket?: boolean;
  frontend: boolean;
}

export interface AiFeatures {
  bedrock: boolean;
  embedding: boolean;
  rag: boolean;
  modelManagement: boolean;
  markitdown?: boolean;
  config?: MarkitdownConfig;
}

export interface MonitoringFeatures {
  cloudwatch: boolean;
  xray: boolean;
  alarms: boolean;
  dashboards: boolean;
}

export interface EnterpriseFeatures {
  multiTenant?: boolean;
  billing?: boolean;
  compliance?: boolean;
  governance?: boolean;
}

export interface RegionalSettings {
  primaryRegion: string;
  secondaryRegion?: string;
  supportedRegions: string[];
  dataResidency: string;
  timezone: string;
}

export interface DisasterRecoveryConfig {
  enabled: boolean;
  primaryRegion: string;
  secondaryRegion: string;
  rto: number; // Recovery Time Objective (hours)
  rpo: number; // Recovery Point Objective (hours)
  replicationServices: ('dynamodb' | 'fsx' | 'opensearch' | 's3')[];
  // オプション機能: 必要に応じてCDKで設定可能
  autoFailover?: boolean;
  healthCheckInterval?: number;
  backupStrategy?: 'continuous' | 'scheduled';
}

export interface ComplianceSettings {
  regulations: ComplianceRegulation[];
  dataProtection: DataProtectionSettings;
  auditLogging: boolean;
  gdprCompliance?: GdprSettings;
}

export type ComplianceRegulation = 
  | 'GDPR'      // EU General Data Protection Regulation
  | 'SOX'       // US Sarbanes-Oxley Act
  | 'LGPD'      // Brazil Lei Geral de Proteção de Dados
  | 'PDPA'      // Singapore Personal Data Protection Act
  | 'CCPA'      // California Consumer Privacy Act
  | 'HIPAA'     // Health Insurance Portability and Accountability Act
  | 'PIPA'      // Korea Personal Information Protection Act
  | 'DPDP'      // India Digital Personal Data Protection Act
  | 'FISC'      // Japan Financial Information Systems Center
  | 'PRIVACY_ACT' // Australia Privacy Act
  | 'BDSG'      // Germany Bundesdatenschutzgesetz
  | 'UK_GDPR';  // UK General Data Protection Regulation

export interface DataProtectionSettings {
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  dataClassification: boolean;
  accessLogging: boolean;
  dataRetention: DataRetentionSettings;
}

export interface DataRetentionSettings {
  defaultRetentionDays: number;
  personalDataRetentionDays: number;
  logRetentionDays: number;
  backupRetentionDays: number;
}

export interface GdprSettings {
  dpiaRequired: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
  consentManagement: boolean;
  dataProcessingRecords: boolean;
}

// 地域別設定テンプレート
export const REGIONAL_CONFIGS: Record<string, Partial<GlobalRagConfig>> = {
  // 日本地域
  'ap-northeast-1': {
    regionalSettings: {
      primaryRegion: 'ap-northeast-1',
      secondaryRegion: 'ap-northeast-3',
      supportedRegions: ['ap-northeast-1', 'ap-northeast-3'],
      dataResidency: 'japan',
      timezone: 'Asia/Tokyo'
    },
    compliance: {
      regulations: ['FISC'],
      dataProtection: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        dataClassification: true,
        accessLogging: true,
        dataRetention: {
          defaultRetentionDays: 2555, // 7 years for financial data
          personalDataRetentionDays: 1095, // 3 years
          logRetentionDays: 365,
          backupRetentionDays: 2555
        }
      },
      auditLogging: true
    }
  },
  
  // EU地域
  'eu-west-1': {
    regionalSettings: {
      primaryRegion: 'eu-west-1',
      supportedRegions: ['eu-west-1', 'eu-central-1', 'eu-west-2', 'eu-west-3'],
      dataResidency: 'eu',
      timezone: 'Europe/Dublin'
    },
    compliance: {
      regulations: ['GDPR'],
      dataProtection: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        dataClassification: true,
        accessLogging: true,
        dataRetention: {
          defaultRetentionDays: 1095, // 3 years
          personalDataRetentionDays: 1095,
          logRetentionDays: 365,
          backupRetentionDays: 1095
        }
      },
      auditLogging: true,
      gdprCompliance: {
        dpiaRequired: true,
        rightToErasure: true,
        dataPortability: true,
        consentManagement: true,
        dataProcessingRecords: true
      }
    }
  },
  
  // US地域
  'us-east-1': {
    regionalSettings: {
      primaryRegion: 'us-east-1',
      supportedRegions: ['us-east-1', 'us-west-2', 'us-east-2'],
      dataResidency: 'us',
      timezone: 'America/New_York'
    },
    compliance: {
      regulations: ['SOX', 'HIPAA'],
      dataProtection: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        dataClassification: true,
        accessLogging: true,
        dataRetention: {
          defaultRetentionDays: 2555, // 7 years for SOX
          personalDataRetentionDays: 2190, // 6 years for HIPAA
          logRetentionDays: 365,
          backupRetentionDays: 2555
        }
      },
      auditLogging: true
    }
  }
};