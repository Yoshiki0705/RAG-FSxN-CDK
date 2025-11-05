/**
 * 監視設定マッパー
 *
 * 簡略化された設定から詳細なMonitoringConfigインターフェースにマッピングします。
 */
import { MonitoringConfig } from '../../modules/monitoring/interfaces/monitoring-config';
/**
 * 簡略化された監視設定インターフェース
 */
export interface SimpleMonitoringConfig {
    enableDetailedMonitoring: boolean;
    logRetentionDays: number;
    enableAlarms: boolean;
    alarmNotificationEmail: string;
    enableDashboard: boolean;
    enableXRayTracing: boolean;
}
/**
 * 簡略化された設定から詳細なMonitoringConfigにマッピング
 */
export declare function mapToMonitoringConfig(simpleConfig: SimpleMonitoringConfig, projectName: string, environment: string): MonitoringConfig;
