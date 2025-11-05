"use strict";
/**
 * API設定マッパー
 *
 * 簡略化された設定から詳細なAPIConfigインターフェースにマッピングします。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToAPIConfig = mapToAPIConfig;
const aws_cdk_lib_1 = require("aws-cdk-lib");
/**
 * 簡略化された設定から詳細なAPIConfigにマッピング
 */
function mapToAPIConfig(simpleConfig, projectName, environment) {
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
                defaultTtl: aws_cdk_lib_1.Duration.hours(24),
                maxTtl: aws_cdk_lib_1.Duration.days(365),
                minTtl: aws_cdk_lib_1.Duration.seconds(0)
            },
            geoRestriction: {
                restrictionType: 'allowlist',
                locations: ['JP', 'US']
            }
        },
        nextjs: {
            appName: `${projectName}-${environment}-nextjs`,
            environment: {
                NODE_ENV: environment,
                NEXT_PUBLIC_API_URL: `https://api.${projectName}-${environment}.com`
            },
            memory: 1024,
            timeout: aws_cdk_lib_1.Duration.seconds(30)
        },
        features: {
            enableApiGateway: true,
            enableCognito: simpleConfig.authentication.cognitoEnabled,
            enableCloudFront: true,
            enableNextjs: true
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWNvbmZpZy1tYXBwZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcGktY29uZmlnLW1hcHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7QUE0Qkgsd0NBd0VDO0FBbEdELDZDQUF1QztBQXVCdkM7O0dBRUc7QUFDSCxTQUFnQixjQUFjLENBQzVCLFlBQTZCLEVBQzdCLFdBQW1CLEVBQ25CLFdBQW1CO0lBRW5CLE9BQU87UUFDTCxVQUFVLEVBQUU7WUFDVixPQUFPLEVBQUUsR0FBRyxXQUFXLElBQUksV0FBVyxNQUFNO1lBQzVDLFNBQVMsRUFBRSxXQUFXO1lBQ3RCLFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZO2dCQUM1QyxZQUFZLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZO2dCQUM1QyxZQUFZLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZO2dCQUM1QyxnQkFBZ0IsRUFBRSxJQUFJO2FBQ3ZCO1lBQ0QsVUFBVSxFQUFFLFlBQVksQ0FBQyxVQUFVO1lBQ25DLFlBQVksRUFBRTtnQkFDWixPQUFPLEVBQUUsWUFBWSxDQUFDLGNBQWMsQ0FBQyxjQUFjO2dCQUNuRCxPQUFPLEVBQUUsR0FBRyxXQUFXLElBQUksV0FBVyxVQUFVO2dCQUNoRCxXQUFXLEVBQUUsZUFBZSxXQUFXLElBQUksV0FBVyxjQUFjO2FBQ3JFO1NBQ0Y7UUFDRCxPQUFPLEVBQUU7WUFDUCxZQUFZLEVBQUUsR0FBRyxXQUFXLElBQUksV0FBVyxZQUFZO1lBQ3ZELGtCQUFrQixFQUFFLEdBQUcsV0FBVyxJQUFJLFdBQVcsU0FBUztZQUMxRCxjQUFjLEVBQUU7Z0JBQ2QsU0FBUyxFQUFFLENBQUM7Z0JBQ1osZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLGNBQWMsRUFBRSxLQUFLO2FBQ3RCO1lBQ0QsU0FBUyxFQUFFO2dCQUNULE9BQU8sRUFBRSxLQUFLO2dCQUNkLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixXQUFXLEVBQUUsS0FBSzthQUNuQjtZQUNELFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsSUFBSTtnQkFDWCxhQUFhLEVBQUUsSUFBSTtnQkFDbkIsaUJBQWlCLEVBQUUsSUFBSTthQUN4QjtTQUNGO1FBQ0QsVUFBVSxFQUFFO1lBQ1YsZ0JBQWdCLEVBQUUsR0FBRyxXQUFXLElBQUksV0FBVyxlQUFlO1lBQzlELFVBQVUsRUFBRSxnQkFBZ0I7WUFDNUIsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxzQkFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sRUFBRSxzQkFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQzFCLE1BQU0sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDNUI7WUFDRCxjQUFjLEVBQUU7Z0JBQ2QsZUFBZSxFQUFFLFdBQVc7Z0JBQzVCLFNBQVMsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQWE7YUFDcEM7U0FDRjtRQUNELE1BQU0sRUFBRTtZQUNOLE9BQU8sRUFBRSxHQUFHLFdBQVcsSUFBSSxXQUFXLFNBQVM7WUFDL0MsV0FBVyxFQUFFO2dCQUNYLFFBQVEsRUFBRSxXQUFXO2dCQUNyQixtQkFBbUIsRUFBRSxlQUFlLFdBQVcsSUFBSSxXQUFXLE1BQU07YUFDckU7WUFDRCxNQUFNLEVBQUUsSUFBSTtZQUNaLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7U0FDOUI7UUFDRCxRQUFRLEVBQUU7WUFDUixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLGFBQWEsRUFBRSxZQUFZLENBQUMsY0FBYyxDQUFDLGNBQWM7WUFDekQsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixZQUFZLEVBQUUsSUFBSTtTQUNuQjtLQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBUEnoqK3lrprjg57jg4Pjg5Hjg7xcbiAqIFxuICog57Ch55Wl5YyW44GV44KM44Gf6Kit5a6a44GL44KJ6Kmz57Sw44GqQVBJQ29uZmln44Kk44Oz44K/44O844OV44Kn44O844K544Gr44Oe44OD44OU44Oz44Kw44GX44G+44GZ44CCXG4gKi9cblxuaW1wb3J0IHsgRHVyYXRpb24gfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBBUElDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL2FwaS9pbnRlcmZhY2VzL2FwaS1jb25maWcnO1xuXG4vKipcbiAqIOewoeeVpeWMluOBleOCjOOBn0FQSeioreWumuOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNpbXBsZUFwaUNvbmZpZyB7XG4gIHRocm90dGxpbmc6IHtcbiAgICByYXRlTGltaXQ6IG51bWJlcjtcbiAgICBidXJzdExpbWl0OiBudW1iZXI7XG4gIH07XG4gIGNvcnM6IHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIGFsbG93T3JpZ2luczogc3RyaW5nW107XG4gICAgYWxsb3dNZXRob2RzOiBzdHJpbmdbXTtcbiAgICBhbGxvd0hlYWRlcnM6IHN0cmluZ1tdO1xuICB9O1xuICBhdXRoZW50aWNhdGlvbjoge1xuICAgIGNvZ25pdG9FbmFibGVkOiBib29sZWFuO1xuICAgIGFwaUtleVJlcXVpcmVkOiBib29sZWFuO1xuICB9O1xufVxuXG4vKipcbiAqIOewoeeVpeWMluOBleOCjOOBn+ioreWumuOBi+OCieips+e0sOOBqkFQSUNvbmZpZ+OBq+ODnuODg+ODlOODs+OCsFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwVG9BUElDb25maWcoXG4gIHNpbXBsZUNvbmZpZzogU2ltcGxlQXBpQ29uZmlnLFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICBlbnZpcm9ubWVudDogc3RyaW5nXG4pOiBBUElDb25maWcge1xuICByZXR1cm4ge1xuICAgIGFwaUdhdGV3YXk6IHtcbiAgICAgIGFwaU5hbWU6IGAke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS1hcGlgLFxuICAgICAgc3RhZ2VOYW1lOiBlbnZpcm9ubWVudCxcbiAgICAgIGNvcnNDb25maWc6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBzaW1wbGVDb25maWcuY29ycy5hbGxvd09yaWdpbnMsXG4gICAgICAgIGFsbG93TWV0aG9kczogc2ltcGxlQ29uZmlnLmNvcnMuYWxsb3dNZXRob2RzLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IHNpbXBsZUNvbmZpZy5jb3JzLmFsbG93SGVhZGVycyxcbiAgICAgICAgYWxsb3dDcmVkZW50aWFsczogdHJ1ZVxuICAgICAgfSxcbiAgICAgIHRocm90dGxpbmc6IHNpbXBsZUNvbmZpZy50aHJvdHRsaW5nLFxuICAgICAgYXBpS2V5Q29uZmlnOiB7XG4gICAgICAgIGVuYWJsZWQ6IHNpbXBsZUNvbmZpZy5hdXRoZW50aWNhdGlvbi5hcGlLZXlSZXF1aXJlZCxcbiAgICAgICAga2V5TmFtZTogYCR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LWFwaS1rZXlgLFxuICAgICAgICBkZXNjcmlwdGlvbjogYEFQSSBLZXkgZm9yICR7cHJvamVjdE5hbWV9ICR7ZW52aXJvbm1lbnR9IGVudmlyb25tZW50YFxuICAgICAgfVxuICAgIH0sXG4gICAgY29nbml0bzoge1xuICAgICAgdXNlclBvb2xOYW1lOiBgJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tdXNlci1wb29sYCxcbiAgICAgIHVzZXJQb29sQ2xpZW50TmFtZTogYCR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LWNsaWVudGAsXG4gICAgICBwYXNzd29yZFBvbGljeToge1xuICAgICAgICBtaW5MZW5ndGg6IDgsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXG4gICAgICAgIHJlcXVpcmVTeW1ib2xzOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIG1mYUNvbmZpZzoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgc21zRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIHRvdHBFbmFibGVkOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIGVtYWlsVmVyaWZpZWQ6IHRydWUsXG4gICAgICAgIHByZWZlcnJlZFVzZXJuYW1lOiB0cnVlXG4gICAgICB9XG4gICAgfSxcbiAgICBjbG91ZEZyb250OiB7XG4gICAgICBkaXN0cmlidXRpb25OYW1lOiBgJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tZGlzdHJpYnV0aW9uYCxcbiAgICAgIHByaWNlQ2xhc3M6ICdQcmljZUNsYXNzXzEwMCcsXG4gICAgICBjYWNoZUNvbmZpZzoge1xuICAgICAgICBkZWZhdWx0VHRsOiBEdXJhdGlvbi5ob3VycygyNCksXG4gICAgICAgIG1heFR0bDogRHVyYXRpb24uZGF5cygzNjUpLFxuICAgICAgICBtaW5UdGw6IER1cmF0aW9uLnNlY29uZHMoMClcbiAgICAgIH0sXG4gICAgICBnZW9SZXN0cmljdGlvbjoge1xuICAgICAgICByZXN0cmljdGlvblR5cGU6ICdhbGxvd2xpc3QnLFxuICAgICAgICBsb2NhdGlvbnM6IFsnSlAnLCAnVVMnXSBhcyBzdHJpbmdbXVxuICAgICAgfVxuICAgIH0sXG4gICAgbmV4dGpzOiB7XG4gICAgICBhcHBOYW1lOiBgJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tbmV4dGpzYCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIE5PREVfRU5WOiBlbnZpcm9ubWVudCxcbiAgICAgICAgTkVYVF9QVUJMSUNfQVBJX1VSTDogYGh0dHBzOi8vYXBpLiR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LmNvbWBcbiAgICAgIH0sXG4gICAgICBtZW1vcnk6IDEwMjQsXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDMwKVxuICAgIH0sXG4gICAgZmVhdHVyZXM6IHtcbiAgICAgIGVuYWJsZUFwaUdhdGV3YXk6IHRydWUsXG4gICAgICBlbmFibGVDb2duaXRvOiBzaW1wbGVDb25maWcuYXV0aGVudGljYXRpb24uY29nbml0b0VuYWJsZWQsXG4gICAgICBlbmFibGVDbG91ZEZyb250OiB0cnVlLFxuICAgICAgZW5hYmxlTmV4dGpzOiB0cnVlXG4gICAgfVxuICB9O1xufSJdfQ==