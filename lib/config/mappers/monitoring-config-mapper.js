"use strict";
/**
 * 監視設定マッパー
 *
 * 簡略化された設定から詳細なMonitoringConfigインターフェースにマッピングします。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToMonitoringConfig = mapToMonitoringConfig;
const aws_cdk_lib_1 = require("aws-cdk-lib");
/**
 * 簡略化された設定から詳細なMonitoringConfigにマッピング
 */
function mapToMonitoringConfig(simpleConfig, projectName, environment) {
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
            traceRetention: aws_cdk_lib_1.Duration.days(30)
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
                    threshold: aws_cdk_lib_1.Duration.seconds(5),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1jb25maWctbWFwcGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9uaXRvcmluZy1jb25maWctbWFwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztHQUlHOztBQW9CSCxzREF3REM7QUExRUQsNkNBQXVDO0FBZXZDOztHQUVHO0FBQ0gsU0FBZ0IscUJBQXFCLENBQ25DLFlBQW9DLEVBQ3BDLFdBQW1CLEVBQ25CLFdBQW1CO0lBRW5CLE9BQU87UUFDTCxVQUFVLEVBQUU7WUFDVixhQUFhLEVBQUUsR0FBRyxXQUFXLElBQUksV0FBVyxZQUFZO1lBQ3hELFlBQVksRUFBRTtnQkFDWixVQUFVLEVBQUUsWUFBWSxDQUFDLGdCQUFnQjtnQkFDekMsY0FBYyxFQUFFLFlBQVksQ0FBQyxnQkFBZ0I7Z0JBQzdDLGVBQWUsRUFBRSxZQUFZLENBQUMsZ0JBQWdCO2FBQy9DO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLHdCQUF3QixFQUFFLFlBQVksQ0FBQyx3QkFBd0I7YUFDaEU7U0FDRjtRQUNELElBQUksRUFBRTtZQUNKLE9BQU8sRUFBRSxZQUFZLENBQUMsaUJBQWlCO1lBQ3ZDLFlBQVksRUFBRSxHQUFHO1lBQ2pCLGNBQWMsRUFBRSxzQkFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7U0FDbEM7UUFDRCxNQUFNLEVBQUU7WUFDTixZQUFZLEVBQUUsR0FBRyxXQUFXLElBQUksV0FBVyxTQUFTO1lBQ3BELGtCQUFrQixFQUFFLENBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDO1lBQ3pELE1BQU0sRUFBRTtnQkFDTixlQUFlLEVBQUU7b0JBQ2YsT0FBTyxFQUFFLFlBQVksQ0FBQyxZQUFZO29CQUNsQyxTQUFTLEVBQUUsQ0FBQztvQkFDWixpQkFBaUIsRUFBRSxDQUFDO2lCQUNyQjtnQkFDRCxlQUFlLEVBQUU7b0JBQ2YsT0FBTyxFQUFFLFlBQVksQ0FBQyxZQUFZO29CQUNsQyxTQUFTLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUM5QixpQkFBaUIsRUFBRSxDQUFDO2lCQUNyQjtnQkFDRCxrQkFBa0IsRUFBRTtvQkFDbEIsT0FBTyxFQUFFLFlBQVksQ0FBQyxZQUFZO29CQUNsQyxTQUFTLEVBQUUsRUFBRTtvQkFDYixpQkFBaUIsRUFBRSxDQUFDO2lCQUNyQjtnQkFDRCxRQUFRLEVBQUU7b0JBQ1IsT0FBTyxFQUFFLFlBQVksQ0FBQyxZQUFZO29CQUNsQyxTQUFTLEVBQUUsRUFBRTtvQkFDYixpQkFBaUIsRUFBRSxDQUFDO2lCQUNyQjthQUNGO1NBQ0Y7UUFDRCxRQUFRLEVBQUU7WUFDUixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLFVBQVUsRUFBRSxZQUFZLENBQUMsaUJBQWlCO1lBQzFDLFlBQVksRUFBRSxZQUFZLENBQUMsWUFBWTtZQUN2QyxxQkFBcUIsRUFBRSxZQUFZLENBQUMsZUFBZTtTQUNwRDtLQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDnm6PoppboqK3lrprjg57jg4Pjg5Hjg7xcbiAqIFxuICog57Ch55Wl5YyW44GV44KM44Gf6Kit5a6a44GL44KJ6Kmz57Sw44GqTW9uaXRvcmluZ0NvbmZpZ+OCpOODs+OCv+ODvOODleOCp+ODvOOCueOBq+ODnuODg+ODlOODs+OCsOOBl+OBvuOBmeOAglxuICovXG5cbmltcG9ydCB7IER1cmF0aW9uIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgTW9uaXRvcmluZ0NvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvbW9uaXRvcmluZy9pbnRlcmZhY2VzL21vbml0b3JpbmctY29uZmlnJztcblxuLyoqXG4gKiDnsKHnlaXljJbjgZXjgozjgZ/nm6PoppboqK3lrprjgqTjg7Pjgr/jg7zjg5Xjgqfjg7zjgrlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTaW1wbGVNb25pdG9yaW5nQ29uZmlnIHtcbiAgZW5hYmxlRGV0YWlsZWRNb25pdG9yaW5nOiBib29sZWFuO1xuICBsb2dSZXRlbnRpb25EYXlzOiBudW1iZXI7XG4gIGVuYWJsZUFsYXJtczogYm9vbGVhbjtcbiAgYWxhcm1Ob3RpZmljYXRpb25FbWFpbDogc3RyaW5nO1xuICBlbmFibGVEYXNoYm9hcmQ6IGJvb2xlYW47XG4gIGVuYWJsZVhSYXlUcmFjaW5nOiBib29sZWFuO1xufVxuXG4vKipcbiAqIOewoeeVpeWMluOBleOCjOOBn+ioreWumuOBi+OCieips+e0sOOBqk1vbml0b3JpbmdDb25maWfjgavjg57jg4Pjg5Tjg7PjgrBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcFRvTW9uaXRvcmluZ0NvbmZpZyhcbiAgc2ltcGxlQ29uZmlnOiBTaW1wbGVNb25pdG9yaW5nQ29uZmlnLFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICBlbnZpcm9ubWVudDogc3RyaW5nXG4pOiBNb25pdG9yaW5nQ29uZmlnIHtcbiAgcmV0dXJuIHtcbiAgICBjbG91ZFdhdGNoOiB7XG4gICAgICBkYXNoYm9hcmROYW1lOiBgJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tZGFzaGJvYXJkYCxcbiAgICAgIGxvZ1JldGVudGlvbjoge1xuICAgICAgICBsYW1iZGFMb2dzOiBzaW1wbGVDb25maWcubG9nUmV0ZW50aW9uRGF5cyxcbiAgICAgICAgYXBpR2F0ZXdheUxvZ3M6IHNpbXBsZUNvbmZpZy5sb2dSZXRlbnRpb25EYXlzLFxuICAgICAgICBhcHBsaWNhdGlvbkxvZ3M6IHNpbXBsZUNvbmZpZy5sb2dSZXRlbnRpb25EYXlzXG4gICAgICB9LFxuICAgICAgbWV0cmljczoge1xuICAgICAgICBlbmFibGVDdXN0b21NZXRyaWNzOiB0cnVlLFxuICAgICAgICBlbmFibGVEZXRhaWxlZE1vbml0b3Jpbmc6IHNpbXBsZUNvbmZpZy5lbmFibGVEZXRhaWxlZE1vbml0b3JpbmdcbiAgICAgIH1cbiAgICB9LFxuICAgIHhyYXk6IHtcbiAgICAgIGVuYWJsZWQ6IHNpbXBsZUNvbmZpZy5lbmFibGVYUmF5VHJhY2luZyxcbiAgICAgIHNhbXBsaW5nUmF0ZTogMC4xLFxuICAgICAgdHJhY2VSZXRlbnRpb246IER1cmF0aW9uLmRheXMoMzApXG4gICAgfSxcbiAgICBhbGVydHM6IHtcbiAgICAgIHNuc1RvcGljTmFtZTogYCR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LWFsZXJ0c2AsXG4gICAgICBub3RpZmljYXRpb25FbWFpbHM6IFtzaW1wbGVDb25maWcuYWxhcm1Ob3RpZmljYXRpb25FbWFpbF0sXG4gICAgICBhbGFybXM6IHtcbiAgICAgICAgbGFtYmRhRXJyb3JSYXRlOiB7XG4gICAgICAgICAgZW5hYmxlZDogc2ltcGxlQ29uZmlnLmVuYWJsZUFsYXJtcyxcbiAgICAgICAgICB0aHJlc2hvbGQ6IDUsXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDJcbiAgICAgICAgfSxcbiAgICAgICAgYXBpUmVzcG9uc2VUaW1lOiB7XG4gICAgICAgICAgZW5hYmxlZDogc2ltcGxlQ29uZmlnLmVuYWJsZUFsYXJtcyxcbiAgICAgICAgICB0aHJlc2hvbGQ6IER1cmF0aW9uLnNlY29uZHMoNSksXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDNcbiAgICAgICAgfSxcbiAgICAgICAgZHluYW1vZGJUaHJvdHRsaW5nOiB7XG4gICAgICAgICAgZW5hYmxlZDogc2ltcGxlQ29uZmlnLmVuYWJsZUFsYXJtcyxcbiAgICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyXG4gICAgICAgIH0sXG4gICAgICAgIGZzeFVzYWdlOiB7XG4gICAgICAgICAgZW5hYmxlZDogc2ltcGxlQ29uZmlnLmVuYWJsZUFsYXJtcyxcbiAgICAgICAgICB0aHJlc2hvbGQ6IDgwLFxuICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAzXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGZlYXR1cmVzOiB7XG4gICAgICBlbmFibGVDbG91ZFdhdGNoOiB0cnVlLFxuICAgICAgZW5hYmxlWFJheTogc2ltcGxlQ29uZmlnLmVuYWJsZVhSYXlUcmFjaW5nLFxuICAgICAgZW5hYmxlQWxlcnRzOiBzaW1wbGVDb25maWcuZW5hYmxlQWxhcm1zLFxuICAgICAgZW5hYmxlQ3VzdG9tRGFzaGJvYXJkOiBzaW1wbGVDb25maWcuZW5hYmxlRGFzaGJvYXJkXG4gICAgfVxuICB9O1xufSJdfQ==