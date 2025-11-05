"use strict";
/**
 * エンタープライズ設定マッパー
 *
 * 簡略化された設定から詳細なEnterpriseConfigインターフェースにマッピングします。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToEnterpriseConfig = mapToEnterpriseConfig;
/**
 * 簡略化された設定から詳細なEnterpriseConfigにマッピング
 */
function mapToEnterpriseConfig(simpleConfig, projectName, environment) {
    return {
        accessControl: {
            enableRBAC: simpleConfig.enableAccessControl,
            enableABAC: false,
            defaultRoles: {
                admin: `${projectName}-admin`,
                user: `${projectName}-user`,
                readonly: `${projectName}-readonly`
            },
            permissions: {
                documentAccess: {
                    read: [`${projectName}-user`, `${projectName}-admin`],
                    write: [`${projectName}-admin`],
                    delete: [`${projectName}-admin`]
                },
                systemAdmin: {
                    userManagement: [`${projectName}-admin`],
                    systemConfig: [`${projectName}-admin`],
                    monitoring: [`${projectName}-admin`, `${projectName}-user`]
                }
            }
        },
        businessIntelligence: {
            enableQuickSight: simpleConfig.enableBIAnalytics,
            enableCustomDashboard: simpleConfig.enableBIAnalytics,
            dataSources: {
                dynamodb: simpleConfig.enableBIAnalytics,
                cloudwatchLogs: simpleConfig.enableBIAnalytics,
                s3DataLake: simpleConfig.enableBIAnalytics
            },
            reports: {
                usageReport: {
                    enabled: simpleConfig.enableBIAnalytics,
                    schedule: 'cron(0 9 * * MON)'
                },
                performanceReport: {
                    enabled: simpleConfig.enableBIAnalytics,
                    schedule: 'cron(0 9 1 * *)'
                },
                securityReport: {
                    enabled: simpleConfig.enableAuditLogging,
                    schedule: 'cron(0 9 * * *)'
                }
            }
        },
        organization: {
            enableMultiTenant: simpleConfig.enableMultiTenant,
            organizationHierarchy: {
                enabled: simpleConfig.enableMultiTenant,
                maxDepth: 3
            },
            tenantIsolation: {
                dataIsolationLevel: simpleConfig.enableMultiTenant ? 'strict' : 'basic',
                resourceIsolation: simpleConfig.enableMultiTenant
            }
        },
        features: {
            enableAccessControl: simpleConfig.enableAccessControl,
            enableBusinessIntelligence: simpleConfig.enableBIAnalytics,
            enableOrganizationManagement: simpleConfig.enableMultiTenant,
            enableAuditLogging: simpleConfig.enableAuditLogging
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50ZXJwcmlzZS1jb25maWctbWFwcGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW50ZXJwcmlzZS1jb25maWctbWFwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztHQUlHOztBQWtCSCxzREFvRUM7QUF2RUQ7O0dBRUc7QUFDSCxTQUFnQixxQkFBcUIsQ0FDbkMsWUFBb0MsRUFDcEMsV0FBbUIsRUFDbkIsV0FBbUI7SUFFbkIsT0FBTztRQUNMLGFBQWEsRUFBRTtZQUNiLFVBQVUsRUFBRSxZQUFZLENBQUMsbUJBQW1CO1lBQzVDLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLFlBQVksRUFBRTtnQkFDWixLQUFLLEVBQUUsR0FBRyxXQUFXLFFBQVE7Z0JBQzdCLElBQUksRUFBRSxHQUFHLFdBQVcsT0FBTztnQkFDM0IsUUFBUSxFQUFFLEdBQUcsV0FBVyxXQUFXO2FBQ3BDO1lBQ0QsV0FBVyxFQUFFO2dCQUNYLGNBQWMsRUFBRTtvQkFDZCxJQUFJLEVBQUUsQ0FBQyxHQUFHLFdBQVcsT0FBTyxFQUFFLEdBQUcsV0FBVyxRQUFRLENBQUM7b0JBQ3JELEtBQUssRUFBRSxDQUFDLEdBQUcsV0FBVyxRQUFRLENBQUM7b0JBQy9CLE1BQU0sRUFBRSxDQUFDLEdBQUcsV0FBVyxRQUFRLENBQUM7aUJBQ2pDO2dCQUNELFdBQVcsRUFBRTtvQkFDWCxjQUFjLEVBQUUsQ0FBQyxHQUFHLFdBQVcsUUFBUSxDQUFDO29CQUN4QyxZQUFZLEVBQUUsQ0FBQyxHQUFHLFdBQVcsUUFBUSxDQUFDO29CQUN0QyxVQUFVLEVBQUUsQ0FBQyxHQUFHLFdBQVcsUUFBUSxFQUFFLEdBQUcsV0FBVyxPQUFPLENBQUM7aUJBQzVEO2FBQ0Y7U0FDRjtRQUNELG9CQUFvQixFQUFFO1lBQ3BCLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxpQkFBaUI7WUFDaEQscUJBQXFCLEVBQUUsWUFBWSxDQUFDLGlCQUFpQjtZQUNyRCxXQUFXLEVBQUU7Z0JBQ1gsUUFBUSxFQUFFLFlBQVksQ0FBQyxpQkFBaUI7Z0JBQ3hDLGNBQWMsRUFBRSxZQUFZLENBQUMsaUJBQWlCO2dCQUM5QyxVQUFVLEVBQUUsWUFBWSxDQUFDLGlCQUFpQjthQUMzQztZQUNELE9BQU8sRUFBRTtnQkFDUCxXQUFXLEVBQUU7b0JBQ1gsT0FBTyxFQUFFLFlBQVksQ0FBQyxpQkFBaUI7b0JBQ3ZDLFFBQVEsRUFBRSxtQkFBbUI7aUJBQzlCO2dCQUNELGlCQUFpQixFQUFFO29CQUNqQixPQUFPLEVBQUUsWUFBWSxDQUFDLGlCQUFpQjtvQkFDdkMsUUFBUSxFQUFFLGlCQUFpQjtpQkFDNUI7Z0JBQ0QsY0FBYyxFQUFFO29CQUNkLE9BQU8sRUFBRSxZQUFZLENBQUMsa0JBQWtCO29CQUN4QyxRQUFRLEVBQUUsaUJBQWlCO2lCQUM1QjthQUNGO1NBQ0Y7UUFDRCxZQUFZLEVBQUU7WUFDWixpQkFBaUIsRUFBRSxZQUFZLENBQUMsaUJBQWlCO1lBQ2pELHFCQUFxQixFQUFFO2dCQUNyQixPQUFPLEVBQUUsWUFBWSxDQUFDLGlCQUFpQjtnQkFDdkMsUUFBUSxFQUFFLENBQUM7YUFDWjtZQUNELGVBQWUsRUFBRTtnQkFDZixrQkFBa0IsRUFBRSxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTztnQkFDdkUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLGlCQUFpQjthQUNsRDtTQUNGO1FBQ0QsUUFBUSxFQUFFO1lBQ1IsbUJBQW1CLEVBQUUsWUFBWSxDQUFDLG1CQUFtQjtZQUNyRCwwQkFBMEIsRUFBRSxZQUFZLENBQUMsaUJBQWlCO1lBQzFELDRCQUE0QixFQUFFLFlBQVksQ0FBQyxpQkFBaUI7WUFDNUQsa0JBQWtCLEVBQUUsWUFBWSxDQUFDLGtCQUFrQjtTQUNwRDtLQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjgqjjg7Pjgr/jg7zjg5fjg6njgqTjgrroqK3lrprjg57jg4Pjg5Hjg7xcbiAqIFxuICog57Ch55Wl5YyW44GV44KM44Gf6Kit5a6a44GL44KJ6Kmz57Sw44GqRW50ZXJwcmlzZUNvbmZpZ+OCpOODs+OCv+ODvOODleOCp+ODvOOCueOBq+ODnuODg+ODlOODs+OCsOOBl+OBvuOBmeOAglxuICovXG5cbmltcG9ydCB7IEVudGVycHJpc2VDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2VudGVycHJpc2UvaW50ZXJmYWNlcy9lbnRlcnByaXNlLWNvbmZpZyc7XG5cbi8qKlxuICog57Ch55Wl5YyW44GV44KM44Gf44Ko44Oz44K/44O844OX44Op44Kk44K66Kit5a6a44Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2ltcGxlRW50ZXJwcmlzZUNvbmZpZyB7XG4gIGVuYWJsZUFjY2Vzc0NvbnRyb2w6IGJvb2xlYW47XG4gIGVuYWJsZUF1ZGl0TG9nZ2luZzogYm9vbGVhbjtcbiAgZW5hYmxlQklBbmFseXRpY3M6IGJvb2xlYW47XG4gIGVuYWJsZU11bHRpVGVuYW50OiBib29sZWFuO1xuICBkYXRhUmV0ZW50aW9uRGF5czogbnVtYmVyO1xufVxuXG4vKipcbiAqIOewoeeVpeWMluOBleOCjOOBn+ioreWumuOBi+OCieips+e0sOOBqkVudGVycHJpc2VDb25maWfjgavjg57jg4Pjg5Tjg7PjgrBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcFRvRW50ZXJwcmlzZUNvbmZpZyhcbiAgc2ltcGxlQ29uZmlnOiBTaW1wbGVFbnRlcnByaXNlQ29uZmlnLFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICBlbnZpcm9ubWVudDogc3RyaW5nXG4pOiBFbnRlcnByaXNlQ29uZmlnIHtcbiAgcmV0dXJuIHtcbiAgICBhY2Nlc3NDb250cm9sOiB7XG4gICAgICBlbmFibGVSQkFDOiBzaW1wbGVDb25maWcuZW5hYmxlQWNjZXNzQ29udHJvbCxcbiAgICAgIGVuYWJsZUFCQUM6IGZhbHNlLFxuICAgICAgZGVmYXVsdFJvbGVzOiB7XG4gICAgICAgIGFkbWluOiBgJHtwcm9qZWN0TmFtZX0tYWRtaW5gLFxuICAgICAgICB1c2VyOiBgJHtwcm9qZWN0TmFtZX0tdXNlcmAsXG4gICAgICAgIHJlYWRvbmx5OiBgJHtwcm9qZWN0TmFtZX0tcmVhZG9ubHlgXG4gICAgICB9LFxuICAgICAgcGVybWlzc2lvbnM6IHtcbiAgICAgICAgZG9jdW1lbnRBY2Nlc3M6IHtcbiAgICAgICAgICByZWFkOiBbYCR7cHJvamVjdE5hbWV9LXVzZXJgLCBgJHtwcm9qZWN0TmFtZX0tYWRtaW5gXSxcbiAgICAgICAgICB3cml0ZTogW2Ake3Byb2plY3ROYW1lfS1hZG1pbmBdLFxuICAgICAgICAgIGRlbGV0ZTogW2Ake3Byb2plY3ROYW1lfS1hZG1pbmBdXG4gICAgICAgIH0sXG4gICAgICAgIHN5c3RlbUFkbWluOiB7XG4gICAgICAgICAgdXNlck1hbmFnZW1lbnQ6IFtgJHtwcm9qZWN0TmFtZX0tYWRtaW5gXSxcbiAgICAgICAgICBzeXN0ZW1Db25maWc6IFtgJHtwcm9qZWN0TmFtZX0tYWRtaW5gXSxcbiAgICAgICAgICBtb25pdG9yaW5nOiBbYCR7cHJvamVjdE5hbWV9LWFkbWluYCwgYCR7cHJvamVjdE5hbWV9LXVzZXJgXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBidXNpbmVzc0ludGVsbGlnZW5jZToge1xuICAgICAgZW5hYmxlUXVpY2tTaWdodDogc2ltcGxlQ29uZmlnLmVuYWJsZUJJQW5hbHl0aWNzLFxuICAgICAgZW5hYmxlQ3VzdG9tRGFzaGJvYXJkOiBzaW1wbGVDb25maWcuZW5hYmxlQklBbmFseXRpY3MsXG4gICAgICBkYXRhU291cmNlczoge1xuICAgICAgICBkeW5hbW9kYjogc2ltcGxlQ29uZmlnLmVuYWJsZUJJQW5hbHl0aWNzLFxuICAgICAgICBjbG91ZHdhdGNoTG9nczogc2ltcGxlQ29uZmlnLmVuYWJsZUJJQW5hbHl0aWNzLFxuICAgICAgICBzM0RhdGFMYWtlOiBzaW1wbGVDb25maWcuZW5hYmxlQklBbmFseXRpY3NcbiAgICAgIH0sXG4gICAgICByZXBvcnRzOiB7XG4gICAgICAgIHVzYWdlUmVwb3J0OiB7XG4gICAgICAgICAgZW5hYmxlZDogc2ltcGxlQ29uZmlnLmVuYWJsZUJJQW5hbHl0aWNzLFxuICAgICAgICAgIHNjaGVkdWxlOiAnY3JvbigwIDkgKiAqIE1PTiknXG4gICAgICAgIH0sXG4gICAgICAgIHBlcmZvcm1hbmNlUmVwb3J0OiB7XG4gICAgICAgICAgZW5hYmxlZDogc2ltcGxlQ29uZmlnLmVuYWJsZUJJQW5hbHl0aWNzLFxuICAgICAgICAgIHNjaGVkdWxlOiAnY3JvbigwIDkgMSAqICopJ1xuICAgICAgICB9LFxuICAgICAgICBzZWN1cml0eVJlcG9ydDoge1xuICAgICAgICAgIGVuYWJsZWQ6IHNpbXBsZUNvbmZpZy5lbmFibGVBdWRpdExvZ2dpbmcsXG4gICAgICAgICAgc2NoZWR1bGU6ICdjcm9uKDAgOSAqICogKiknXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG9yZ2FuaXphdGlvbjoge1xuICAgICAgZW5hYmxlTXVsdGlUZW5hbnQ6IHNpbXBsZUNvbmZpZy5lbmFibGVNdWx0aVRlbmFudCxcbiAgICAgIG9yZ2FuaXphdGlvbkhpZXJhcmNoeToge1xuICAgICAgICBlbmFibGVkOiBzaW1wbGVDb25maWcuZW5hYmxlTXVsdGlUZW5hbnQsXG4gICAgICAgIG1heERlcHRoOiAzXG4gICAgICB9LFxuICAgICAgdGVuYW50SXNvbGF0aW9uOiB7XG4gICAgICAgIGRhdGFJc29sYXRpb25MZXZlbDogc2ltcGxlQ29uZmlnLmVuYWJsZU11bHRpVGVuYW50ID8gJ3N0cmljdCcgOiAnYmFzaWMnLFxuICAgICAgICByZXNvdXJjZUlzb2xhdGlvbjogc2ltcGxlQ29uZmlnLmVuYWJsZU11bHRpVGVuYW50XG4gICAgICB9XG4gICAgfSxcbiAgICBmZWF0dXJlczoge1xuICAgICAgZW5hYmxlQWNjZXNzQ29udHJvbDogc2ltcGxlQ29uZmlnLmVuYWJsZUFjY2Vzc0NvbnRyb2wsXG4gICAgICBlbmFibGVCdXNpbmVzc0ludGVsbGlnZW5jZTogc2ltcGxlQ29uZmlnLmVuYWJsZUJJQW5hbHl0aWNzLFxuICAgICAgZW5hYmxlT3JnYW5pemF0aW9uTWFuYWdlbWVudDogc2ltcGxlQ29uZmlnLmVuYWJsZU11bHRpVGVuYW50LFxuICAgICAgZW5hYmxlQXVkaXRMb2dnaW5nOiBzaW1wbGVDb25maWcuZW5hYmxlQXVkaXRMb2dnaW5nXG4gICAgfVxuICB9O1xufSJdfQ==