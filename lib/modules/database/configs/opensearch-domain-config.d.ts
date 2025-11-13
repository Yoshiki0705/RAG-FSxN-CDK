/**
 * OpenSearch Domain設定
 *
 * 環境別のOpenSearchドメイン設定を提供
 */
import { OpenSearchDomainConfig } from '../constructs/opensearch-domain-construct';
/**
 * 開発環境用OpenSearch設定
 */
export declare function getDevOpenSearchConfig(projectName?: string): OpenSearchDomainConfig;
/**
 * ステージング環境用OpenSearch設定
 */
export declare function getStagingOpenSearchConfig(projectName?: string): OpenSearchDomainConfig;
/**
 * 本番環境用OpenSearch設定
 */
export declare function getProdOpenSearchConfig(projectName?: string): OpenSearchDomainConfig;
/**
 * 環境に応じた設定取得
 */
export declare function getOpenSearchDomainConfig(environment: string, projectName?: string): OpenSearchDomainConfig;
