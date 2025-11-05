/**
 * API設定マッパー
 *
 * 簡略化された設定から詳細なAPIConfigインターフェースにマッピングします。
 */
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
export declare function mapToAPIConfig(simpleConfig: SimpleApiConfig, projectName: string, environment: string): APIConfig;
