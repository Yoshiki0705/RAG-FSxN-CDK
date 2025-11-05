/**
 * エンタープライズ設定マッパー
 * 
 * 簡略化された設定から詳細なEnterpriseConfigインターフェースにマッピングします。
 */

import { EnterpriseConfig } from '../../modules/enterprise/interfaces/enterprise-config';

/**
 * 簡略化されたエンタープライズ設定インターフェース
 */
export interface SimpleEnterpriseConfig {
  enableAccessControl: boolean;
  enableAuditLogging: boolean;
  enableBIAnalytics: boolean;
  enableMultiTenant: boolean;
  dataRetentionDays: number;
}

/**
 * 簡略化された設定から詳細なEnterpriseConfigにマッピング
 */
export function mapToEnterpriseConfig(
  simpleConfig: SimpleEnterpriseConfig,
  projectName: string,
  environment: string
): EnterpriseConfig {
  return {
    accessControl: {
      enableRBAC: simpleConfig.enableAccessControl,
      enableABAC: false,
      defaultRoles: {
        admin: `${projectName}-admin`,
        user: `${projectName}-user`,
        readonly: `${projectName}-readonly`
      },
      permissions: {
        documentAccess: {
          read: [`${projectName}-user`, `${projectName}-admin`],
          write: [`${projectName}-admin`],
          delete: [`${projectName}-admin`]
        },
        systemAdmin: {
          userManagement: [`${projectName}-admin`],
          systemConfig: [`${projectName}-admin`],
          monitoring: [`${projectName}-admin`, `${projectName}-user`]
        }
      }
    },
    businessIntelligence: {
      enableQuickSight: simpleConfig.enableBIAnalytics,
      enableCustomDashboard: simpleConfig.enableBIAnalytics,
      dataSources: {
        dynamodb: simpleConfig.enableBIAnalytics,
        cloudwatchLogs: simpleConfig.enableBIAnalytics,
        s3DataLake: simpleConfig.enableBIAnalytics
      },
      reports: {
        usageReport: {
          enabled: simpleConfig.enableBIAnalytics,
          schedule: 'cron(0 9 * * MON)'
        },
        performanceReport: {
          enabled: simpleConfig.enableBIAnalytics,
          schedule: 'cron(0 9 1 * *)'
        },
        securityReport: {
          enabled: simpleConfig.enableAuditLogging,
          schedule: 'cron(0 9 * * *)'
        }
      }
    },
    organization: {
      enableMultiTenant: simpleConfig.enableMultiTenant,
      organizationHierarchy: {
        enabled: simpleConfig.enableMultiTenant,
        maxDepth: 3
      },
      tenantIsolation: {
        dataIsolationLevel: simpleConfig.enableMultiTenant ? 'strict' : 'basic',
        resourceIsolation: simpleConfig.enableMultiTenant
      }
    },
    features: {
      enableAccessControl: simpleConfig.enableAccessControl,
      enableBusinessIntelligence: simpleConfig.enableBIAnalytics,
      enableOrganizationManagement: simpleConfig.enableMultiTenant,
      enableAuditLogging: simpleConfig.enableAuditLogging
    }
  };
}