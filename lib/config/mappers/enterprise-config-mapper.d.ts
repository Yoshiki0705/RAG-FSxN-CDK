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
export declare function mapToEnterpriseConfig(simpleConfig: SimpleEnterpriseConfig, projectName: string, environment: string): EnterpriseConfig;
