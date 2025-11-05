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
    projectName: string;
    environment: 'dev' | 'staging' | 'prod';
    region: string;
    regionPrefix?: string;
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
    regionalSettings: RegionalSettings;
    disasterRecovery?: DisasterRecoveryConfig;
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
    rto: number;
    rpo: number;
    replicationServices: ('dynamodb' | 'fsx' | 'opensearch' | 's3')[];
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
export type ComplianceRegulation = 'GDPR' | 'SOX' | 'LGPD' | 'PDPA' | 'CCPA' | 'HIPAA' | 'PIPA' | 'DPDP' | 'FISC' | 'PRIVACY_ACT' | 'BDSG' | 'UK_GDPR';
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
export declare const REGIONAL_CONFIGS: Record<string, Partial<GlobalRagConfig>>;
