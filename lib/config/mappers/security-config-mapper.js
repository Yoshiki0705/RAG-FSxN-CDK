"use strict";
/**
 * セキュリティ設定マッパー
 *
 * 環境設定からセキュリティモジュール用の詳細設定に変換
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSecurityConfig = mapSecurityConfig;
function mapSecurityConfig(envConfig, projectName, environment, region) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktY29uZmlnLW1hcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlY3VyaXR5LWNvbmZpZy1tYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7O0FBS0gsOENBeUNDO0FBekNELFNBQWdCLGlCQUFpQixDQUMvQixTQUE0QixFQUM1QixXQUFtQixFQUNuQixXQUFtQixFQUNuQixNQUFjO0lBRWQsT0FBTztRQUNMLEdBQUcsRUFBRTtZQUNILGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxjQUFjO1lBQzNDLE9BQU8sRUFBRSxtQkFBbUI7WUFDNUIsUUFBUSxFQUFFLGlCQUFpQjtTQUM1QjtRQUNELEdBQUcsRUFBRTtZQUNILE9BQU8sRUFBRSxTQUFTLENBQUMsU0FBUztZQUM1QixLQUFLLEVBQUUsTUFBTSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxVQUFVO1lBQ3pELEtBQUssRUFBRTtnQkFDTCxxQkFBcUIsRUFBRSxJQUFJO2dCQUMzQixrQkFBa0IsRUFBRSxJQUFJO2dCQUN4QixTQUFTLEVBQUUsSUFBSTtnQkFDZixpQkFBaUIsRUFBRSxLQUFLO2dCQUN4QixnQkFBZ0IsRUFBRSxFQUFFO2FBQ3JCO1NBQ0Y7UUFFRCxVQUFVLEVBQUU7WUFDVixPQUFPLEVBQUUsU0FBUyxDQUFDLGdCQUFnQjtZQUNuQyxZQUFZLEVBQUUsR0FBRyxXQUFXLElBQUksV0FBVyxlQUFlLE1BQU0sRUFBRTtZQUNsRSxXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLDBCQUEwQixFQUFFLElBQUk7WUFDaEMsa0JBQWtCLEVBQUUsS0FBSztZQUN6Qix1QkFBdUIsRUFBRSxJQUFJO1NBQzlCO1FBR0QsSUFBSSxFQUFFO1lBQ0osYUFBYSxFQUFFLFdBQVcsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUTtZQUN6RCxrQkFBa0IsRUFBRSxTQUFTLENBQUMsZ0JBQWdCO1lBQzlDLG1CQUFtQixFQUFFLE1BQU07WUFDM0Isa0JBQWtCLEVBQUUsV0FBVyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxVQUFVO1NBQ3pFO0tBQ0YsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOOCu+OCreODpeODquODhuOCo+ioreWumuODnuODg+ODkeODvFxuICogXG4gKiDnkrDlooPoqK3lrprjgYvjgonjgrvjgq3jg6Xjg6rjg4bjgqPjg6Ljgrjjg6Xjg7zjg6vnlKjjga7oqbPntLDoqK3lrprjgavlpInmj5tcbiAqL1xuXG5pbXBvcnQgeyBTZWN1cml0eUNvbmZpZyBhcyBFbnZTZWN1cml0eUNvbmZpZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvZW52aXJvbm1lbnQtY29uZmlnJztcbmltcG9ydCB7IFNlY3VyaXR5Q29uZmlnIGFzIE1vZHVsZVNlY3VyaXR5Q29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9zZWN1cml0eS9pbnRlcmZhY2VzL3NlY3VyaXR5LWNvbmZpZyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBTZWN1cml0eUNvbmZpZyhcbiAgZW52Q29uZmlnOiBFbnZTZWN1cml0eUNvbmZpZyxcbiAgcHJvamVjdE5hbWU6IHN0cmluZyxcbiAgZW52aXJvbm1lbnQ6IHN0cmluZyxcbiAgcmVnaW9uOiBzdHJpbmdcbik6IE1vZHVsZVNlY3VyaXR5Q29uZmlnIHtcbiAgcmV0dXJuIHtcbiAgICBrbXM6IHtcbiAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiBlbnZDb25maWcua21zS2V5Um90YXRpb24sXG4gICAgICBrZXlTcGVjOiAnU1lNTUVUUklDX0RFRkFVTFQnLFxuICAgICAga2V5VXNhZ2U6ICdFTkNSWVBUX0RFQ1JZUFQnLFxuICAgIH0sXG4gICAgd2FmOiB7XG4gICAgICBlbmFibGVkOiBlbnZDb25maWcuZW5hYmxlV2FmLFxuICAgICAgc2NvcGU6IHJlZ2lvbiA9PT0gJ3VzLWVhc3QtMScgPyAnQ0xPVURGUk9OVCcgOiAnUkVHSU9OQUwnLFxuICAgICAgcnVsZXM6IHtcbiAgICAgICAgZW5hYmxlQVdTTWFuYWdlZFJ1bGVzOiB0cnVlLFxuICAgICAgICBlbmFibGVSYXRlTGltaXRpbmc6IHRydWUsXG4gICAgICAgIHJhdGVMaW1pdDogMjAwMCxcbiAgICAgICAgZW5hYmxlR2VvQmxvY2tpbmc6IGZhbHNlLFxuICAgICAgICBibG9ja2VkQ291bnRyaWVzOiBbXSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIGNsb3VkVHJhaWw6IHtcbiAgICAgIGVuYWJsZWQ6IGVudkNvbmZpZy5lbmFibGVDbG91ZFRyYWlsLFxuICAgICAgczNCdWNrZXROYW1lOiBgJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tY2xvdWR0cmFpbC0ke3JlZ2lvbn1gLFxuICAgICAgczNLZXlQcmVmaXg6ICdjbG91ZHRyYWlsLWxvZ3MvJyxcbiAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiB0cnVlLFxuICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiBmYWxzZSxcbiAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiB0cnVlLFxuICAgIH0sXG5cblxuICAgIHRhZ3M6IHtcbiAgICAgIFNlY3VyaXR5TGV2ZWw6IGVudmlyb25tZW50ID09PSAncHJvZCcgPyAnSGlnaCcgOiAnTWVkaXVtJyxcbiAgICAgIEVuY3J5cHRpb25SZXF1aXJlZDogZW52Q29uZmlnLmVuY3J5cHRpb25BdFJlc3QsXG4gICAgICBDb21wbGlhbmNlRnJhbWV3b3JrOiAnU09DMicsXG4gICAgICBEYXRhQ2xhc3NpZmljYXRpb246IGVudmlyb25tZW50ID09PSAncHJvZCcgPyAnQ29uZmlkZW50aWFsJyA6ICdJbnRlcm5hbCcsXG4gICAgfSxcbiAgfTtcbn0iXX0=