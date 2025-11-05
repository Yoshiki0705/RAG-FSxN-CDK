/**
 * 監視設定マッパー
 * 
 * 簡略化された設定から詳細なMonitoringConfigインターフェースにマッピングします。
 */

import { Duration } from 'aws-cdk-lib';
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
export function mapToMonitoringConfig(
  simpleConfig: SimpleMonitoringConfig,
  projectName: string,
  environment: string
): MonitoringConfig {
  return {
    cloudWatch: {
      dashboardName: `${projectName}-${environment}-dashboard`,
      logRetention: {
        lambdaLogs: simpleConfig.logRetentionDays,
        apiGatewayLogs: simpleConfig.logRetentionDays,
        applicationLogs: simpleConfig.logRetentionDays
      },
      metrics: {
        enableCustomMetrics: true,
        enableDetailedMonitoring: simpleConfig.enableDetailedMonitoring
      }
    },
    xray: {
      enabled: simpleConfig.enableXRayTracing,
      samplingRate: 0.1,
      traceRetention: Duration.days(30)
    },
    alerts: {
      snsTopicName: `${projectName}-${environment}-alerts`,
      notificationEmails: [simpleConfig.alarmNotificationEmail],
      alarms: {
        lambdaErrorRate: {
          enabled: simpleConfig.enableAlarms,
          threshold: 5,
          evaluationPeriods: 2
        },
        apiResponseTime: {
          enabled: simpleConfig.enableAlarms,
          threshold: Duration.seconds(5),
          evaluationPeriods: 3
        },
        dynamodbThrottling: {
          enabled: simpleConfig.enableAlarms,
          threshold: 10,
          evaluationPeriods: 2
        },
        fsxUsage: {
          enabled: simpleConfig.enableAlarms,
          threshold: 80,
          evaluationPeriods: 3
        }
      }
    },
    features: {
      enableCloudWatch: true,
      enableXRay: simpleConfig.enableXRayTracing,
      enableAlerts: simpleConfig.enableAlarms,
      enableCustomDashboard: simpleConfig.enableDashboard
    }
  };
}