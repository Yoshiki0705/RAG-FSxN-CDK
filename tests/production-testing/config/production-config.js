"use strict";
/**
 * 本番環境テスト設定管理
 *
 * AWS東京リージョン本番環境への安全な接続設定を管理
 * 全てのテストは実本番リソースを使用し、読み取り専用モードで実行
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultProductionConfig = void 0;
exports.createProductionConfig = createProductionConfig;
exports.validateProductionConfig = validateProductionConfig;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// 本番環境設定の読み込み
dotenv.config({ path: path.join(process.cwd(), '.env.production') });
/**
 * 本番環境設定の作成
 */
function createProductionConfig() {
    // 必須環境変数の検証
    const requiredEnvVars = [
        'AWS_REGION',
        'AWS_PROFILE',
        'PROD_CLOUDFRONT_DISTRIBUTION',
        'PROD_COGNITO_USER_POOL',
        'PROD_COGNITO_CLIENT_ID',
        'PROD_OPENSEARCH_DOMAIN',
        'PROD_DYNAMODB_SESSION_TABLE',
        'PROD_FSX_FILE_SYSTEM'
    ];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`必須環境変数が設定されていません: ${missingVars.join(', ')}`);
    }
    return {
        region: 'ap-northeast-1',
        environment: 'production',
        awsProfile: process.env.AWS_PROFILE,
        // 安全性制約（必須）
        safetyMode: true,
        readOnlyMode: true,
        emergencyStopEnabled: true,
        resources: {
            // フロントエンド
            cloudFrontDistribution: process.env.PROD_CLOUDFRONT_DISTRIBUTION,
            lambdaWebAdapter: process.env.PROD_LAMBDA_WEB_ADAPTER || '',
            // 認証・セキュリティ
            cognitoUserPool: process.env.PROD_COGNITO_USER_POOL,
            cognitoClientId: process.env.PROD_COGNITO_CLIENT_ID,
            wafWebAcl: process.env.PROD_WAF_WEB_ACL || '',
            // AI・RAG
            bedrockModels: [
                'amazon.nova-lite-v1:0',
                'amazon.nova-micro-v1:0',
                'anthropic.claude-3-haiku-20240307-v1:0'
            ],
            openSearchDomain: process.env.PROD_OPENSEARCH_DOMAIN,
            openSearchIndex: process.env.PROD_OPENSEARCH_INDEX || 'documents',
            // データ・ストレージ
            dynamoDBTables: {
                sessions: process.env.PROD_DYNAMODB_SESSION_TABLE,
                users: process.env.PROD_DYNAMODB_USER_TABLE || '',
                documents: process.env.PROD_DYNAMODB_DOCUMENT_TABLE || ''
            },
            fsxFileSystem: process.env.PROD_FSX_FILE_SYSTEM,
            s3Buckets: {
                documents: process.env.PROD_S3_DOCUMENTS_BUCKET || '',
                embeddings: process.env.PROD_S3_EMBEDDINGS_BUCKET || ''
            },
            // 監視・ログ
            cloudWatchLogGroups: [
                '/aws/lambda/prod-rag-api',
                '/aws/lambda/prod-rag-embedding',
                '/aws/apigateway/prod-rag-api'
            ],
            xrayServiceMap: process.env.PROD_XRAY_SERVICE_MAP || ''
        },
        execution: {
            maxConcurrentTests: 5,
            testTimeout: 300000, // 5分
            retryCount: 2,
            failFast: false,
            maxTestDuration: 3600000 // 1時間
        },
        monitoring: {
            enableRealTimeMonitoring: true,
            metricsCollectionInterval: 30000, // 30秒
            alertThresholds: {
                errorRate: 0.05, // 5%
                responseTime: 5000, // 5秒
                resourceUtilization: 0.8 // 80%
            }
        }
    };
}
/**
 * 設定の検証
 */
function validateProductionConfig(config) {
    const errors = [];
    const warnings = [];
    // 基本設定の検証
    if (config.region !== 'ap-northeast-1') {
        errors.push('リージョンは ap-northeast-1 である必要があります');
    }
    if (config.environment !== 'production') {
        errors.push('環境は production である必要があります');
    }
    // 安全性制約の検証
    if (!config.safetyMode) {
        errors.push('本番環境テストでは safetyMode は必須です');
    }
    if (!config.readOnlyMode) {
        errors.push('本番環境テストでは readOnlyMode は必須です');
    }
    if (!config.emergencyStopEnabled) {
        errors.push('本番環境テストでは emergencyStopEnabled は必須です');
    }
    // リソース設定の検証
    if (!config.resources.cloudFrontDistribution) {
        errors.push('CloudFront Distribution IDが設定されていません');
    }
    if (!config.resources.cognitoUserPool) {
        errors.push('Cognito User Pool IDが設定されていません');
    }
    if (!config.resources.openSearchDomain) {
        errors.push('OpenSearch Domain名が設定されていません');
    }
    if (!config.resources.dynamoDBTables.sessions) {
        errors.push('DynamoDB Session Table名が設定されていません');
    }
    if (!config.resources.fsxFileSystem) {
        errors.push('FSx File System IDが設定されていません');
    }
    // 実行設定の検証
    if (config.execution.maxConcurrentTests > 10) {
        warnings.push('同時実行テスト数が多すぎます。本番環境への負荷を考慮してください');
    }
    if (config.execution.testTimeout < 30000) {
        warnings.push('テストタイムアウトが短すぎる可能性があります');
    }
    console.log(`🔍 本番環境設定検証完了: エラー ${errors.length}件, 警告 ${warnings.length}件`);
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * デフォルト本番環境設定
 */
exports.defaultProductionConfig = createProductionConfig();
exports.default = exports.defaultProductionConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdGlvbi1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm9kdWN0aW9uLWNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOEZILHdEQXNGQztBQUtELDREQW1FQztBQTFQRCwrQ0FBaUM7QUFDakMsMkNBQTZCO0FBRTdCLGNBQWM7QUFDZCxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBcUZyRTs7R0FFRztBQUNILFNBQWdCLHNCQUFzQjtJQUNwQyxZQUFZO0lBQ1osTUFBTSxlQUFlLEdBQUc7UUFDdEIsWUFBWTtRQUNaLGFBQWE7UUFDYiw4QkFBOEI7UUFDOUIsd0JBQXdCO1FBQ3hCLHdCQUF3QjtRQUN4Qix3QkFBd0I7UUFDeEIsNkJBQTZCO1FBQzdCLHNCQUFzQjtLQUN2QixDQUFDO0lBRUYsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdFLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxnQkFBZ0I7UUFDeEIsV0FBVyxFQUFFLFlBQVk7UUFDekIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBWTtRQUVwQyxZQUFZO1FBQ1osVUFBVSxFQUFFLElBQUk7UUFDaEIsWUFBWSxFQUFFLElBQUk7UUFDbEIsb0JB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R0FBRyxDQUFDLHNCQUFzQixNQUFNLENBQUMsTUFBTSxTQUFTLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRTVFLE9BQU87UUFDTCxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDO1FBQzVCLE1BQU07UUFDTixRQUFRO0tBQ1QsQ0FBQztBQUNKLENBQUM7QUFFRDs7R0FFRztBQUNVLFFBQUEsdUJBQXVCLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztBQUVoRSxrQkFBZSwrQkFBdUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5pys55Wq55Kw5aKD44OG44K544OI6Kit5a6a566h55CGXG4gKiBcbiAqIEFXU+adseS6rOODquODvOOCuOODp+ODs+acrOeVqueSsOWig+OBuOOBruWuieWFqOOBquaOpee2muioreWumuOCkueuoeeQhlxuICog5YWo44Gm44Gu44OG44K544OI44Gv5a6f5pys55Wq44Oq44K944O844K544KS5L2/55So44GX44CB6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44Gn5a6f6KGMXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgKiBhcyBkb3RlbnYgZnJvbSAnZG90ZW52JztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIOacrOeVqueSsOWig+ioreWumuOBruiqreOBv+i+vOOBv1xuZG90ZW52LmNvbmZpZyh7IHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnLmVudi5wcm9kdWN0aW9uJykgfSk7XG5cbi8qKlxuICog5pys55Wq55Kw5aKD6Kit5a6a44Kk44Oz44K/44O844OV44Kn44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjdGlvbkNvbmZpZyB7XG4gIC8vIEFXU+WfuuacrOioreWumlxuICByZWdpb246ICdhcC1ub3J0aGVhc3QtMSc7XG4gIGVudmlyb25tZW50OiAncHJvZHVjdGlvbic7XG4gIGF3c1Byb2ZpbGU6IHN0cmluZztcbiAgXG4gIC8vIOWuieWFqOaAp+WItue0hFxuICBzYWZldHlNb2RlOiBib29sZWFuO1xuICByZWFkT25seU1vZGU6IGJvb2xlYW47XG4gIGVtZXJnZW5jeVN0b3BFbmFibGVkOiBib29sZWFuO1xuICBcbiAgLy8g5a6f5pys55Wq44Oq44K944O844K56Kit5a6aXG4gIHJlc291cmNlczogUHJvZHVjdGlvblJlc291cmNlcztcbiAgXG4gIC8vIOODhuOCueODiOWun+ihjOioreWumlxuICBleGVjdXRpb246IEV4ZWN1dGlvbkNvbmZpZztcbiAgXG4gIC8vIOebo+imluioreWumlxuICBtb25pdG9yaW5nOiBNb25pdG9yaW5nQ29uZmlnO1xufVxuXG4vKipcbiAqIOWun+acrOeVquODquOCveODvOOCueioreWumlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFByb2R1Y3Rpb25SZXNvdXJjZXMge1xuICAvLyDjg5Xjg63jg7Pjg4jjgqjjg7Pjg4lcbiAgY2xvdWRGcm9udERpc3RyaWJ1dGlvbjogc3RyaW5nO1xuICBsYW1iZGFXZWJBZGFwdGVyOiBzdHJpbmc7XG4gIFxuICAvLyDoqo3oqLzjg7vjgrvjgq3jg6Xjg6rjg4bjgqNcbiAgY29nbml0b1VzZXJQb29sOiBzdHJpbmc7XG4gIGNvZ25pdG9DbGllbnRJZDogc3RyaW5nO1xuICB3YWZXZWJBY2w6IHN0cmluZztcbiAgXG4gIC8vIEFJ44O7UkFHXG4gIGJlZHJvY2tNb2RlbHM6IHN0cmluZ1tdO1xuICBvcGVuU2VhcmNoRG9tYWluOiBzdHJpbmc7XG4gIG9wZW5TZWFyY2hJbmRleDogc3RyaW5nO1xuICBcbiAgLy8g44OH44O844K/44O744K544OI44Os44O844K4XG4gIGR5bmFtb0RCVGFibGVzOiB7XG4gICAgc2Vzc2lvbnM6IHN0cmluZztcbiAgICB1c2Vyczogc3RyaW5nO1xuICAgIGRvY3VtZW50czogc3RyaW5nO1xuICB9O1xuICBmc3hGaWxlU3lzdGVtOiBzdHJpbmc7XG4gIHMzQnVja2V0czoge1xuICAgIGRvY3VtZW50czogc3RyaW5nO1xuICAgIGVtYmVkZGluZ3M6IHN0cmluZztcbiAgfTtcbiAgXG4gIC8vIOebo+imluODu+ODreOCsFxuICBjbG91ZFdhdGNoTG9nR3JvdXBzOiBzdHJpbmdbXTtcbiAgeHJheVNlcnZpY2VNYXA6IHN0cmluZztcbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jlrp/ooYzoqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeGVjdXRpb25Db25maWcge1xuICBtYXhDb25jdXJyZW50VGVzdHM6IG51bWJlcjtcbiAgdGVzdFRpbWVvdXQ6IG51bWJlcjtcbiAgcmV0cnlDb3VudDogbnVtYmVyO1xuICBmYWlsRmFzdDogYm9vbGVhbjtcbiAgbWF4VGVzdER1cmF0aW9uOiBudW1iZXI7XG59XG5cbi8qKlxuICog55uj6KaW6Kit5a6aXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTW9uaXRvcmluZ0NvbmZpZyB7XG4gIGVuYWJsZVJlYWxUaW1lTW9uaXRvcmluZzogYm9vbGVhbjtcbiAgbWV0cmljc0NvbGxlY3Rpb25JbnRlcnZhbDogbnVtYmVyO1xuICBhbGVydFRocmVzaG9sZHM6IHtcbiAgICBlcnJvclJhdGU6IG51bWJlcjtcbiAgICByZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgICByZXNvdXJjZVV0aWxpemF0aW9uOiBudW1iZXI7XG4gIH07XG59XG5cbi8qKlxuICog5pys55Wq55Kw5aKD6Kit5a6a44Gu5L2c5oiQXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcm9kdWN0aW9uQ29uZmlnKCk6IFByb2R1Y3Rpb25Db25maWcge1xuICAvLyDlv4XpoIjnkrDlooPlpInmlbDjga7mpJzoqLxcbiAgY29uc3QgcmVxdWlyZWRFbnZWYXJzID0gW1xuICAgICdBV1NfUkVHSU9OJyxcbiAgICAnQVdTX1BST0ZJTEUnLFxuICAgICdQUk9EX0NMT1VERlJPTlRfRElTVFJJQlVUSU9OJyxcbiAgICAnUFJPRF9DT0dOSVRPX1VTRVJfUE9PTCcsXG4gICAgJ1BST0RfQ09HTklUT19DTElFTlRfSUQnLFxuICAgICdQUk9EX09QRU5TRUFSQ0hfRE9NQUlOJyxcbiAgICAnUFJPRF9EWU5BTU9EQl9TRVNTSU9OX1RBQkxFJyxcbiAgICAnUFJPRF9GU1hfRklMRV9TWVNURU0nXG4gIF07XG5cbiAgY29uc3QgbWlzc2luZ1ZhcnMgPSByZXF1aXJlZEVudlZhcnMuZmlsdGVyKHZhck5hbWUgPT4gIXByb2Nlc3MuZW52W3Zhck5hbWVdKTtcbiAgaWYgKG1pc3NpbmdWYXJzLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYOW/hemgiOeSsOWig+WkieaVsOOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkzogJHttaXNzaW5nVmFycy5qb2luKCcsICcpfWApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZWdpb246ICdhcC1ub3J0aGVhc3QtMScsXG4gICAgZW52aXJvbm1lbnQ6ICdwcm9kdWN0aW9uJyxcbiAgICBhd3NQcm9maWxlOiBwcm9jZXNzLmVudi5BV1NfUFJPRklMRSEsXG4gICAgXG4gICAgLy8g5a6J5YWo5oCn5Yi257SE77yI5b+F6aCI77yJXG4gICAgc2FmZXR5TW9kZTogdHJ1ZSxcbiAgICByZWFkT25seU1vZGU6IHRydWUsXG4gICAgZW1lcmdlbmN5U3RvcEVuYWJsZWQ6IHRydWUsXG4gICAgXG4gICAgcmVzb3VyY2VzOiB7XG4gICAgICAvLyDjg5Xjg63jg7Pjg4jjgqjjg7Pjg4lcbiAgICAgIGNsb3VkRnJvbnREaXN0cmlidXRpb246IHByb2Nlc3MuZW52LlBST0RfQ0xPVURGUk9OVF9ESVNUUklCVVRJT04hLFxuICAgICAgbGFtYmRhV2ViQWRhcHRlcjogcHJvY2Vzcy5lbnYuUFJPRF9MQU1CREFfV0VCX0FEQVBURVIgfHwgJycsXG4gICAgICBcbiAgICAgIC8vIOiqjeiovOODu+OCu+OCreODpeODquODhuOCo1xuICAgICAgY29nbml0b1VzZXJQb29sOiBwcm9jZXNzLmVudi5QUk9EX0NPR05JVE9fVVNFUl9QT09MISxcbiAgICAgIGNvZ25pdG9DbGllbnRJZDogcHJvY2Vzcy5lbnYuUFJPRF9DT0dOSVRPX0NMSUVOVF9JRCEsXG4gICAgICB3YWZXZWJBY2w6IHByb2Nlc3MuZW52LlBST0RfV0FGX1dFQl9BQ0wgfHwgJycsXG4gICAgICBcbiAgICAgIC8vIEFJ44O7UkFHXG4gICAgICBiZWRyb2NrTW9kZWxzOiBbXG4gICAgICAgICdhbWF6b24ubm92YS1saXRlLXYxOjAnLFxuICAgICAgICAnYW1hem9uLm5vdmEtbWljcm8tdjE6MCcsXG4gICAgICAgICdhbnRocm9waWMuY2xhdWRlLTMtaGFpa3UtMjAyNDAzMDctdjE6MCdcbiAgICAgIF0sXG4gICAgICBvcGVuU2VhcmNoRG9tYWluOiBwcm9jZXNzLmVudi5QUk9EX09QRU5TRUFSQ0hfRE9NQUlOISxcbiAgICAgIG9wZW5TZWFyY2hJbmRleDogcHJvY2Vzcy5lbnYuUFJPRF9PUEVOU0VBUkNIX0lOREVYIHx8ICdkb2N1bWVudHMnLFxuICAgICAgXG4gICAgICAvLyDjg4fjg7zjgr/jg7vjgrnjg4jjg6zjg7zjgrhcbiAgICAgIGR5bmFtb0RCVGFibGVzOiB7XG4gICAgICAgIHNlc3Npb25zOiBwcm9jZXNzLmVudi5QUk9EX0RZTkFNT0RCX1NFU1NJT05fVEFCTEUhLFxuICAgICAgICB1c2VyczogcHJvY2Vzcy5lbnYuUFJPRF9EWU5BTU9EQl9VU0VSX1RBQkxFIHx8ICcnLFxuICAgICAgICBkb2N1bWVudHM6IHByb2Nlc3MuZW52LlBST0RfRFlOQU1PREJfRE9DVU1FTlRfVEFCTEUgfHwgJydcbiAgICAgIH0sXG4gICAgICBmc3hGaWxlU3lzdGVtOiBwcm9jZXNzLmVudi5QUk9EX0ZTWF9GSUxFX1NZU1RFTSEsXG4gICAgICBzM0J1Y2tldHM6IHtcbiAgICAgICAgZG9jdW1lbnRzOiBwcm9jZXNzLmVudi5QUk9EX1MzX0RPQ1VNRU5UU19CVUNLRVQgfHwgJycsXG4gICAgICAgIGVtYmVkZGluZ3M6IHByb2Nlc3MuZW52LlBST0RfUzNfRU1CRURESU5HU19CVUNLRVQgfHwgJydcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIOebo+imluODu+ODreOCsFxuICAgICAgY2xvdWRXYXRjaExvZ0dyb3VwczogW1xuICAgICAgICAnL2F3cy9sYW1iZGEvcHJvZC1yYWctYXBpJyxcbiAgICAgICAgJy9hd3MvbGFtYmRhL3Byb2QtcmFnLWVtYmVkZGluZycsXG4gICAgICAgICcvYXdzL2FwaWdhdGV3YXkvcHJvZC1yYWctYXBpJ1xuICAgICAgXSxcbiAgICAgIHhyYXlTZXJ2aWNlTWFwOiBwcm9jZXNzLmVudi5QUk9EX1hSQVlfU0VSVklDRV9NQVAgfHwgJydcbiAgICB9LFxuICAgIFxuICAgIGV4ZWN1dGlvbjoge1xuICAgICAgbWF4Q29uY3VycmVudFRlc3RzOiA1LFxuICAgICAgdGVzdFRpbWVvdXQ6IDMwMDAwMCwgLy8gNeWIhlxuICAgICAgcmV0cnlDb3VudDogMixcbiAgICAgIGZhaWxGYXN0OiBmYWxzZSxcbiAgICAgIG1heFRlc3REdXJhdGlvbjogMzYwMDAwMCAvLyAx5pmC6ZaTXG4gICAgfSxcbiAgICBcbiAgICBtb25pdG9yaW5nOiB7XG4gICAgICBlbmFibGVSZWFsVGltZU1vbml0b3Jpbmc6IHRydWUsXG4gICAgICBtZXRyaWNzQ29sbGVjdGlvbkludGVydmFsOiAzMDAwMCwgLy8gMzDnp5JcbiAgICAgIGFsZXJ0VGhyZXNob2xkczoge1xuICAgICAgICBlcnJvclJhdGU6IDAuMDUsIC8vIDUlXG4gICAgICAgIHJlc3BvbnNlVGltZTogNTAwMCwgLy8gNeenklxuICAgICAgICByZXNvdXJjZVV0aWxpemF0aW9uOiAwLjggLy8gODAlXG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIOioreWumuOBruaknOiovFxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQcm9kdWN0aW9uQ29uZmlnKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZyk6IHtcbiAgaXNWYWxpZDogYm9vbGVhbjtcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgLy8g5Z+65pys6Kit5a6a44Gu5qSc6Ki8XG4gIGlmIChjb25maWcucmVnaW9uICE9PSAnYXAtbm9ydGhlYXN0LTEnKSB7XG4gICAgZXJyb3JzLnB1c2goJ+ODquODvOOCuOODp+ODs+OBryBhcC1ub3J0aGVhc3QtMSDjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIGlmIChjb25maWcuZW52aXJvbm1lbnQgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGVycm9ycy5wdXNoKCfnkrDlooPjga8gcHJvZHVjdGlvbiDjgafjgYLjgovlv4XopoHjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIC8vIOWuieWFqOaAp+WItue0hOOBruaknOiovFxuICBpZiAoIWNvbmZpZy5zYWZldHlNb2RlKSB7XG4gICAgZXJyb3JzLnB1c2goJ+acrOeVqueSsOWig+ODhuOCueODiOOBp+OBryBzYWZldHlNb2RlIOOBr+W/hemgiOOBp+OBmScpO1xuICB9XG5cbiAgaWYgKCFjb25maWcucmVhZE9ubHlNb2RlKSB7XG4gICAgZXJyb3JzLnB1c2goJ+acrOeVqueSsOWig+ODhuOCueODiOOBp+OBryByZWFkT25seU1vZGUg44Gv5b+F6aCI44Gn44GZJyk7XG4gIH1cblxuICBpZiAoIWNvbmZpZy5lbWVyZ2VuY3lTdG9wRW5hYmxlZCkge1xuICAgIGVycm9ycy5wdXNoKCfmnKznlarnkrDlooPjg4bjgrnjg4jjgafjga8gZW1lcmdlbmN5U3RvcEVuYWJsZWQg44Gv5b+F6aCI44Gn44GZJyk7XG4gIH1cblxuICAvLyDjg6rjgr3jg7zjgrnoqK3lrprjga7mpJzoqLxcbiAgaWYgKCFjb25maWcucmVzb3VyY2VzLmNsb3VkRnJvbnREaXN0cmlidXRpb24pIHtcbiAgICBlcnJvcnMucHVzaCgnQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gSUTjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIGlmICghY29uZmlnLnJlc291cmNlcy5jb2duaXRvVXNlclBvb2wpIHtcbiAgICBlcnJvcnMucHVzaCgnQ29nbml0byBVc2VyIFBvb2wgSUTjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIGlmICghY29uZmlnLnJlc291cmNlcy5vcGVuU2VhcmNoRG9tYWluKSB7XG4gICAgZXJyb3JzLnB1c2goJ09wZW5TZWFyY2ggRG9tYWlu5ZCN44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gIH1cblxuICBpZiAoIWNvbmZpZy5yZXNvdXJjZXMuZHluYW1vREJUYWJsZXMuc2Vzc2lvbnMpIHtcbiAgICBlcnJvcnMucHVzaCgnRHluYW1vREIgU2Vzc2lvbiBUYWJsZeWQjeOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICB9XG5cbiAgaWYgKCFjb25maWcucmVzb3VyY2VzLmZzeEZpbGVTeXN0ZW0pIHtcbiAgICBlcnJvcnMucHVzaCgnRlN4IEZpbGUgU3lzdGVtIElE44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gIH1cblxuICAvLyDlrp/ooYzoqK3lrprjga7mpJzoqLxcbiAgaWYgKGNvbmZpZy5leGVjdXRpb24ubWF4Q29uY3VycmVudFRlc3RzID4gMTApIHtcbiAgICB3YXJuaW5ncy5wdXNoKCflkIzmmYLlrp/ooYzjg4bjgrnjg4jmlbDjgYzlpJrjgZnjgY7jgb7jgZnjgILmnKznlarnkrDlooPjgbjjga7osqDojbfjgpLogIPmha7jgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgfVxuXG4gIGlmIChjb25maWcuZXhlY3V0aW9uLnRlc3RUaW1lb3V0IDwgMzAwMDApIHtcbiAgICB3YXJuaW5ncy5wdXNoKCfjg4bjgrnjg4jjgr/jgqTjg6DjgqLjgqbjg4jjgYznn63jgZnjgY7jgovlj6/og73mgKfjgYzjgYLjgorjgb7jgZknKTtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGDwn5SNIOacrOeVqueSsOWig+ioreWumuaknOiovOWujOS6hjog44Ko44Op44O8ICR7ZXJyb3JzLmxlbmd0aH3ku7YsIOitpuWRiiAke3dhcm5pbmdzLmxlbmd0aH3ku7ZgKTtcblxuICByZXR1cm4ge1xuICAgIGlzVmFsaWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgZXJyb3JzLFxuICAgIHdhcm5pbmdzXG4gIH07XG59XG5cbi8qKlxuICog44OH44OV44Kp44Or44OI5pys55Wq55Kw5aKD6Kit5a6aXG4gKi9cbmV4cG9ydCBjb25zdCBkZWZhdWx0UHJvZHVjdGlvbkNvbmZpZyA9IGNyZWF0ZVByb2R1Y3Rpb25Db25maWcoKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmYXVsdFByb2R1Y3Rpb25Db25maWc7Il19