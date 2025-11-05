/**
 * API設定マッパー
 * 
 * 簡略化された設定から詳細なAPIConfigインターフェースにマッピングします。
 */

import { Duration } from 'aws-cdk-lib';
import { APIConfig } from '../../modules/api/interfaces/api-config';

/**
 * 簡略化されたAPI設定インターフェース
 */
export interface SimpleApiConfig {
  throttling: {
    rateLimit: number;
    burstLimit: number;
  };
  cors: {
    enabled: boolean;
    allowOrigins: string[];
    allowMethods: string[];
    allowHeaders: string[];
  };
  authentication: {
    cognitoEnabled: boolean;
    apiKeyRequired: boolean;
  };
}

/**
 * 簡略化された設定から詳細なAPIConfigにマッピング
 */
export function mapToAPIConfig(
  simpleConfig: SimpleApiConfig,
  projectName: string,
  environment: string
): APIConfig {
  return {
    apiGateway: {
      apiName: `${projectName}-${environment}-api`,
      stageName: environment,
      corsConfig: {
        allowOrigins: simpleConfig.cors.allowOrigins,
        allowMethods: simpleConfig.cors.allowMethods,
        allowHeaders: simpleConfig.cors.allowHeaders,
        allowCredentials: true
      },
      throttling: simpleConfig.throttling,
      apiKeyConfig: {
        enabled: simpleConfig.authentication.apiKeyRequired,
        keyName: `${projectName}-${environment}-api-key`,
        description: `API Key for ${projectName} ${environment} environment`
      }
    },
    cognito: {
      userPoolName: `${projectName}-${environment}-user-pool`,
      userPoolClientName: `${projectName}-${environment}-client`,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false
      },
      mfaConfig: {
        enabled: false,
        smsEnabled: false,
        totpEnabled: false
      },
      attributes: {
        email: true,
        emailVerified: true,
        preferredUsername: true
      }
    },
    cloudFront: {
      distributionName: `${projectName}-${environment}-distribution`,
      priceClass: 'PriceClass_100',
      cacheConfig: {
        defaultTtl: Duration.hours(24),
        maxTtl: Duration.days(365),
        minTtl: Duration.seconds(0)
      },
      geoRestriction: {
        restrictionType: 'allowlist',
        locations: ['JP', 'US'] as string[]
      }
    },
    nextjs: {
      appName: `${projectName}-${environment}-nextjs`,
      environment: {
        NODE_ENV: environment,
        NEXT_PUBLIC_API_URL: `https://api.${projectName}-${environment}.com`
      },
      memory: 1024,
      timeout: Duration.seconds(30)
    },
    features: {
      enableApiGateway: true,
      enableCognito: simpleConfig.authentication.cognitoEnabled,
      enableCloudFront: true,
      enableNextjs: true
    }
  };
}