/**
 * セキュリティ設定マッパー
 * 
 * 環境設定からセキュリティモジュール用の詳細設定に変換
 */

import { SecurityConfig as EnvSecurityConfig } from '../interfaces/environment-config';
import { SecurityConfig as ModuleSecurityConfig } from '../../modules/security/interfaces/security-config';

export function mapSecurityConfig(
  envConfig: EnvSecurityConfig,
  projectName: string,
  environment: string,
  region: string
): ModuleSecurityConfig {
  return {
    kms: {
      enableKeyRotation: envConfig.kmsKeyRotation,
      keySpec: 'SYMMETRIC_DEFAULT',
      keyUsage: 'ENCRYPT_DECRYPT',
    },
    waf: {
      enabled: envConfig.enableWaf,
      scope: region === 'us-east-1' ? 'CLOUDFRONT' : 'REGIONAL',
      rules: {
        enableAWSManagedRules: true,
        enableRateLimiting: true,
        rateLimit: 2000,
        enableGeoBlocking: false,
        blockedCountries: [],
      },
    },

    cloudTrail: {
      enabled: envConfig.enableCloudTrail,
      s3BucketName: `${projectName}-${environment}-cloudtrail-${region}`,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false,
      enableLogFileValidation: true,
    },


    tags: {
      SecurityLevel: environment === 'prod' ? 'High' : 'Medium',
      EncryptionRequired: envConfig.encryptionAtRest,
      ComplianceFramework: 'SOC2',
      DataClassification: environment === 'prod' ? 'Confidential' : 'Internal',
    },
  };
}