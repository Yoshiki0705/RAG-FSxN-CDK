/**
 * セキュリティ設定マッパー
 *
 * 環境設定からセキュリティモジュール用の詳細設定に変換
 */
import { SecurityConfig as EnvSecurityConfig } from '../interfaces/environment-config';
import { SecurityConfig as ModuleSecurityConfig } from '../../modules/security/interfaces/security-config';
export declare function mapSecurityConfig(envConfig: EnvSecurityConfig, projectName: string, environment: string, region: string): ModuleSecurityConfig;
