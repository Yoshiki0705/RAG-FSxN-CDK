"use strict";
/**
 * Global Configuration Types
 * グローバル設定型定義
 *
 * 14地域対応のグローバル多地域RAGシステム設定
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGIONAL_CONFIGS = void 0;
// 地域別設定テンプレート
exports.REGIONAL_CONFIGS = {
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
