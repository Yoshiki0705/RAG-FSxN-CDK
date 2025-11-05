"use strict";
/**
 * 認証テスト実行ランナー
 *
 * 実本番Cognitoでの認証テストを安全に実行
 * テスト結果の収集と報告を行う
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationTestRunner = void 0;
const authentication_test_module_1 = __importDefault(require("./authentication-test-module"));
/**
 * 認証テスト実行ランナークラス
 */
class AuthenticationTestRunner {
    config;
    testModule;
    testEngine;
    constructor(config, testEngine) {
        this.config = config;
        this.testEngine = testEngine;
        this.testModule = new authentication_test_module_1.default(config);
    }
    /**
     * 認証テストスイートの作成
     */
    createAuthenticationTestSuite() {
        const testDefinitions = [
            // 基本認証テスト
            {
                testId: 'auth-valid-001',
                testName: '有効な認証情報での認証テスト',
                category: 'authentication',
                description: '実本番Cognitoで有効な認証情報を使用した認証成功テスト',
                timeout: 30000, // 30秒
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testValidAuthentication();
                }
            },
            {
                testId: 'auth-invalid-001',
                testName: '無効な認証情報での認証拒否テスト',
                category: 'authentication',
                description: '実本番Cognitoで無効な認証情報を使用した認証拒否テスト',
                timeout: 30000,
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testInvalidAuthentication();
                }
            },
            {
                testId: 'auth-session-001',
                testName: 'セッション管理テスト',
                category: 'authentication',
                description: '実本番DynamoDBでのセッション作成・検証・終了テスト',
                timeout: 60000, // 60秒
                retryCount: 1,
                dependencies: ['auth-valid-001'],
                execute: async (engine) => {
                    return await this.testModule.testSessionManagement();
                }
            },
            {
                testId: 'auth-mfa-001',
                testName: 'MFA機能テスト',
                category: 'authentication',
                description: '実本番CognitoでのMFA（多要素認証）機能テスト',
                timeout: 45000, // 45秒
                retryCount: 1,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testMFAAuthentication();
                }
            },
            {
                testId: 'auth-flow-001',
                testName: '認証フロー完全性テスト',
                category: 'authentication',
                description: '認証から認証情報取得、セッション終了までの完全なフローテスト',
                timeout: 90000, // 90秒
                retryCount: 1,
                dependencies: ['auth-valid-001', 'auth-session-001'],
                execute: async (engine) => {
                    return await this.testModule.testAuthenticationFlow();
                }
            },
            // SIDベース認証テスト
            {
                testId: 'auth-sid-comprehensive-001',
                testName: 'SIDベース認証包括テスト',
                category: 'authentication',
                description: 'testuser, admin, testuser0-49のSIDベース認証包括テスト',
                timeout: 300000, // 5分
                retryCount: 1,
                dependencies: ['auth-valid-001'],
                execute: async (engine) => {
                    return await this.executeSIDAuthenticationTests(engine);
                }
            },
            // マルチリージョン認証テスト
            {
                testId: 'auth-multi-region-001',
                testName: 'マルチリージョン認証テスト',
                category: 'authentication',
                description: '東京-大阪リージョン間認証一貫性とフェイルオーバーテスト',
                timeout: 180000, // 3分
                retryCount: 1,
                dependencies: ['auth-valid-001'],
                execute: async (engine) => {
                    return await this.executeMultiRegionAuthTests(engine);
                }
            }
        ];
        return {
            suiteId: 'authentication-test-suite',
            suiteName: '認証システムテストスイート',
            description: '実本番Amazon Cognitoユーザープールでの認証機能包括テスト',
            tests: testDefinitions,
            configuration: {
                parallel: false, // 認証テストは順次実行
                maxConcurrency: 1,
                failFast: false, // 一つのテストが失敗しても他のテストを継続
                continueOnError: true
            }
        };
    }
    /**
     * 認証テストの実行
     */
    async runAuthenticationTests() {
        console.log('🚀 認証システムテストスイートを実行開始...');
        try {
            // テストスイートの作成
            const testSuite = this.createAuthenticationTestSuite();
            // テストエンジンでの実行
            const results = await this.testEngine.executeTestSuite(testSuite);
            // 結果の集計
            const summary = this.generateTestSummary(results);
            console.log('📊 認証テスト実行結果:');
            console.log(`   総テスト数: ${summary.totalTests}`);
            console.log(`   成功: ${summary.passedTests}`);
            console.log(`   失敗: ${summary.failedTests}`);
            console.log(`   スキップ: ${summary.skippedTests}`);
            console.log(`   成功率: ${(summary.successRate * 100).toFixed(1)}%`);
            console.log(`   総実行時間: ${summary.totalDuration}ms`);
            const success = summary.failedTests === 0;
            if (success) {
                console.log('✅ 認証システムテストスイート実行完了 - 全テスト成功');
            }
            else {
                console.log('⚠️ 認証システムテストスイート実行完了 - 一部テスト失敗');
            }
            return {
                success,
                results: results,
                summary
            };
        }
        catch (error) {
            console.error('❌ 認証テスト実行エラー:', error);
            throw error;
        }
    }
    /**
     * テスト結果サマリーの生成
     */
    generateTestSummary(results) {
        const resultsArray = Array.from(results.values());
        const totalTests = resultsArray.length;
        const passedTests = resultsArray.filter(r => r.success).length;
        const failedTests = resultsArray.filter(r => !r.success && r.status !== 'SKIPPED').length;
        const skippedTests = resultsArray.filter(r => r.status === 'SKIPPED').length;
        const successRate = totalTests > 0 ? passedTests / totalTests : 0;
        const totalDuration = resultsArray.reduce((sum, r) => sum + (r.duration || 0), 0);
        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            successRate,
            totalDuration
        };
    }
    /**
     * 詳細レポートの生成
     */
    async generateDetailedReport(results) {
        const timestamp = new Date().toISOString();
        const summary = this.generateTestSummary(results);
        let report = `# 認証システムテスト詳細レポート\n\n`;
        report += `**実行日時**: ${timestamp}\n`;
        report += `**テスト環境**: AWS東京リージョン本番環境 (${this.config.region})\n`;
        report += `**Cognitoユーザープール**: ${this.config.resources.cognitoUserPool}\n\n`;
        report += `## 実行サマリー\n\n`;
        report += `- **総テスト数**: ${summary.totalTests}\n`;
        report += `- **成功**: ${summary.passedTests}\n`;
        report += `- **失敗**: ${summary.failedTests}\n`;
        report += `- **スキップ**: ${summary.skippedTests}\n`;
        report += `- **成功率**: ${(summary.successRate * 100).toFixed(1)}%\n`;
        report += `- **総実行時間**: ${summary.totalDuration}ms\n\n`;
        report += `## テスト結果詳細\n\n`;
        for (const [testId, result] of results) {
            const status = result.success ? '✅ 成功' : '❌ 失敗';
            const duration = result.duration || 0;
            report += `### ${result.testName} (${testId})\n\n`;
            report += `- **ステータス**: ${status}\n`;
            report += `- **実行時間**: ${duration}ms\n`;
            report += `- **開始時刻**: ${result.startTime?.toISOString()}\n`;
            report += `- **終了時刻**: ${result.endTime?.toISOString()}\n`;
            if (result.error) {
                report += `- **エラー**: ${result.error}\n`;
            }
            if (result.authDetails) {
                report += `- **認証詳細**:\n`;
                report += `  - トークンタイプ: ${result.authDetails.tokenType || 'N/A'}\n`;
                report += `  - 有効期限: ${result.authDetails.expiresIn || 'N/A'}秒\n`;
            }
            if (result.sessionDetails) {
                report += `- **セッション詳細**:\n`;
                report += `  - セッション作成: ${result.sessionDetails.sessionCreated ? '成功' : '失敗'}\n`;
                report += `  - セッション検証: ${result.sessionDetails.sessionValid ? '成功' : '失敗'}\n`;
            }
            if (result.mfaDetails) {
                report += `- **MFA詳細**:\n`;
                report += `  - MFA要求: ${result.mfaDetails.mfaRequired ? 'あり' : 'なし'}\n`;
                report += `  - チャレンジタイプ: ${result.mfaDetails.challengeType || 'N/A'}\n`;
            }
            report += `\n`;
        }
        return report;
    }
    /**
     * SIDベース認証テストの実行
     */
    async executeSIDAuthenticationTests(engine) {
        try {
            console.log('🔐 SIDベース認証テスト実行中...');
            // SIDベース認証テストモジュールを動的インポート
            const { SIDBasedAuthTestModule } = await Promise.resolve().then(() => __importStar(require('./sid-based-auth-test')));
            const sidModule = new SIDBasedAuthTestModule(this.config);
            const results = await sidModule.runAllSIDAuthenticationTests();
            // 結果の集約
            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;
            return {
                testId: 'auth-sid-comprehensive-001',
                testName: 'SIDベース認証包括テスト',
                category: 'authentication',
                status: successCount === totalCount ? 'COMPLETED' : 'FAILED',
                startTime: new Date(),
                endTime: new Date(),
                duration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
                success: successCount === totalCount,
                metadata: {
                    sidTestCount: totalCount,
                    successCount,
                    failedCount: totalCount - successCount,
                    detailedResults: results
                }
            };
        }
        catch (error) {
            console.error('❌ SIDベース認証テスト実行エラー:', error);
            return this.createFailureResult('auth-sid-comprehensive-001', 'SIDベース認証包括テスト', error);
        }
    }
    /**
     * マルチリージョン認証テストの実行
     */
    async executeMultiRegionAuthTests(engine) {
        try {
            console.log('🌏 マルチリージョン認証テスト実行中...');
            // マルチリージョン認証テストモジュールを動的インポート
            const { MultiRegionAuthTestModule } = await Promise.resolve().then(() => __importStar(require('./multi-region-auth-test')));
            const multiRegionModule = new MultiRegionAuthTestModule(this.config);
            const results = await multiRegionModule.runAllMultiRegionAuthTests();
            // 結果の集約
            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;
            return {
                testId: 'auth-multi-region-001',
                testName: 'マルチリージョン認証テスト',
                category: 'authentication',
                status: successCount === totalCount ? 'COMPLETED' : 'FAILED',
                startTime: new Date(),
                endTime: new Date(),
                duration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
                success: successCount === totalCount,
                metadata: {
                    multiRegionTestCount: totalCount,
                    successCount,
                    failedCount: totalCount - successCount,
                    detailedResults: results
                }
            };
        }
        catch (error) {
            console.error('❌ マルチリージョン認証テスト実行エラー:', error);
            return this.createFailureResult('auth-multi-region-001', 'マルチリージョン認証テスト', error);
        }
    }
    /**
     * 失敗結果の作成ヘルパー
     */
    createFailureResult(testId, testName, error) {
        return {
            testId,
            testName,
            category: 'authentication',
            status: 'FAILED',
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 認証テストランナーをクリーンアップ中...');
        await this.testModule.cleanup();
        console.log('✅ 認証テストランナーのクリーンアップ完了');
    }
}
exports.AuthenticationTestRunner = AuthenticationTestRunner;
exports.default = AuthenticationTestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24tdGVzdC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhdXRoZW50aWNhdGlvbi10ZXN0LXJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsOEZBQXdGO0FBSXhGOztHQUVHO0FBQ0gsTUFBYSx3QkFBd0I7SUFDM0IsTUFBTSxDQUFtQjtJQUN6QixVQUFVLENBQTJCO0lBQ3JDLFVBQVUsQ0FBdUI7SUFFekMsWUFBWSxNQUF3QixFQUFFLFVBQWdDO1FBQ3BFLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxvQ0FBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCw2QkFBNkI7UUFDM0IsTUFBTSxlQUFlLEdBQXFCO1lBQ3hDLFVBQVU7WUFDVjtnQkFDRSxNQUFNLEVBQUUsZ0JBQWdCO2dCQUN4QixRQUFRLEVBQUUsZ0JBQWdCO2dCQUMxQixRQUFRLEVBQUUsZ0JBQWdCO2dCQUMxQixXQUFXLEVBQUUsZ0NBQWdDO2dCQUM3QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU07Z0JBQ3RCLFVBQVUsRUFBRSxDQUFDO2dCQUNiLFlBQVksRUFBRSxFQUFFO2dCQUNoQixPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUN4QixPQUFPLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUN6RCxDQUFDO2FBQ0Y7WUFDRDtnQkFDRSxNQUFNLEVBQUUsa0JBQWtCO2dCQUMxQixRQUFRLEVBQUUsa0JBQWtCO2dCQUM1QixRQUFRLEVBQUUsZ0JBQWdCO2dCQUMxQixXQUFXLEVBQUUsZ0NBQWdDO2dCQUM3QyxPQUFPLEVB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QUFDLHVCQUF1QixFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuRixDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0ssbUJBQW1CLENBQUMsTUFBYyxFQUFFLFFBQWdCLEVBQUUsS0FBVTtRQUN0RSxPQUFPO1lBQ0wsTUFBTTtZQUNOLFFBQVE7WUFDUixRQUFRLEVBQUUsZ0JBQWdCO1lBQzFCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtZQUNyQixPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFDbkIsUUFBUSxFQUFFLENBQUM7WUFDWCxPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1NBQzlELENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUN4QyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQW5YRCw0REFtWEM7QUFFRCxrQkFBZSx3QkFBd0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog6KqN6Ki844OG44K544OI5a6f6KGM44Op44Oz44OK44O8XG4gKiBcbiAqIOWun+acrOeVqkNvZ25pdG/jgafjga7oqo3oqLzjg4bjgrnjg4jjgpLlronlhajjgavlrp/ooYxcbiAqIOODhuOCueODiOe1kOaenOOBruWPjumbhuOBqOWgseWRiuOCkuihjOOBhlxuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0IEF1dGhlbnRpY2F0aW9uVGVzdE1vZHVsZSwgeyBBdXRoVGVzdFJlc3VsdCB9IGZyb20gJy4vYXV0aGVudGljYXRpb24tdGVzdC1tb2R1bGUnO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lLCB7IFRlc3REZWZpbml0aW9uLCBUZXN0U3VpdGUgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5cbi8qKlxuICog6KqN6Ki844OG44K544OI5a6f6KGM44Op44Oz44OK44O844Kv44Op44K5XG4gKi9cbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvblRlc3RSdW5uZXIge1xuICBwcml2YXRlIGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZztcbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlOiBBdXRoZW50aWNhdGlvblRlc3RNb2R1bGU7XG4gIHByaXZhdGUgdGVzdEVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmU7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnLCB0ZXN0RW5naW5lOiBQcm9kdWN0aW9uVGVzdEVuZ2luZSkge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMudGVzdEVuZ2luZSA9IHRlc3RFbmdpbmU7XG4gICAgdGhpcy50ZXN0TW9kdWxlID0gbmV3IEF1dGhlbnRpY2F0aW9uVGVzdE1vZHVsZShjb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIOiqjeiovOODhuOCueODiOOCueOCpOODvOODiOOBruS9nOaIkFxuICAgKi9cbiAgY3JlYXRlQXV0aGVudGljYXRpb25UZXN0U3VpdGUoKTogVGVzdFN1aXRlIHtcbiAgICBjb25zdCB0ZXN0RGVmaW5pdGlvbnM6IFRlc3REZWZpbml0aW9uW10gPSBbXG4gICAgICAvLyDln7rmnKzoqo3oqLzjg4bjgrnjg4hcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAnYXV0aC12YWxpZC0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+acieWKueOBquiqjeiovOaDheWgseOBp+OBruiqjeiovOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnYXV0aGVudGljYXRpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+Wun+acrOeVqkNvZ25pdG/jgafmnInlirnjgaroqo3oqLzmg4XloLHjgpLkvb/nlKjjgZfjgZ/oqo3oqLzmiJDlip/jg4bjgrnjg4gnLFxuICAgICAgICB0aW1lb3V0OiAzMDAwMCwgLy8gMzDnp5JcbiAgICAgICAgcmV0cnlDb3VudDogMixcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdFZhbGlkQXV0aGVudGljYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAnYXV0aC1pbnZhbGlkLTAwMScsXG4gICAgICAgIHRlc3ROYW1lOiAn54Sh5Yq544Gq6KqN6Ki85oOF5aCx44Gn44Gu6KqN6Ki85ouS5ZCm44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhdXRoZW50aWNhdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn5a6f5pys55WqQ29nbml0b+OBp+eEoeWKueOBquiqjeiovOaDheWgseOCkuS9v+eUqOOBl+OBn+iqjeiovOaLkuWQpuODhuOCueODiCcsXG4gICAgICAgIHRpbWVvdXQ6IDMwMDAwLFxuICAgICAgICByZXRyeUNvdW50OiAyLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgICBleGVjdXRlOiBhc3luYyAoZW5naW5lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudGVzdE1vZHVsZS50ZXN0SW52YWxpZEF1dGhlbnRpY2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRlc3RJZDogJ2F1dGgtc2Vzc2lvbi0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+OCu+ODg+OCt+ODp+ODs+euoeeQhuODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnYXV0aGVudGljYXRpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+Wun+acrOeVqkR5bmFtb0RC44Gn44Gu44K744OD44K344On44Oz5L2c5oiQ44O75qSc6Ki844O757WC5LqG44OG44K544OIJyxcbiAgICAgICAgdGltZW91dDogNjAwMDAsIC8vIDYw56eSXG4gICAgICAgIHJldHJ5Q291bnQ6IDEsXG4gICAgICAgIGRlcGVuZGVuY2llczogWydhdXRoLXZhbGlkLTAwMSddLFxuICAgICAgICBleGVjdXRlOiBhc3luYyAoZW5naW5lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudGVzdE1vZHVsZS50ZXN0U2Vzc2lvbk1hbmFnZW1lbnQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAnYXV0aC1tZmEtMDAxJyxcbiAgICAgICAgdGVzdE5hbWU6ICdNRkHmqZ/og73jg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2F1dGhlbnRpY2F0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICflrp/mnKznlapDb2duaXRv44Gn44GuTUZB77yI5aSa6KaB57Sg6KqN6Ki877yJ5qmf6IO944OG44K544OIJyxcbiAgICAgICAgdGltZW91dDogNDUwMDAsIC8vIDQ156eSXG4gICAgICAgIHJldHJ5Q291bnQ6IDEsXG4gICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgIGV4ZWN1dGU6IGFzeW5jIChlbmdpbmUpID0+IHtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy50ZXN0TW9kdWxlLnRlc3RNRkFBdXRoZW50aWNhdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0ZXN0SWQ6ICdhdXRoLWZsb3ctMDAxJyxcbiAgICAgICAgdGVzdE5hbWU6ICfoqo3oqLzjg5Xjg63jg7zlrozlhajmgKfjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2F1dGhlbnRpY2F0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfoqo3oqLzjgYvjgonoqo3oqLzmg4XloLHlj5blvpfjgIHjgrvjg4Pjgrfjg6fjg7PntYLkuobjgb7jgafjga7lrozlhajjgarjg5Xjg63jg7zjg4bjgrnjg4gnLFxuICAgICAgICB0aW1lb3V0OiA5MDAwMCwgLy8gOTDnp5JcbiAgICAgICAgcmV0cnlDb3VudDogMSxcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbJ2F1dGgtdmFsaWQtMDAxJywgJ2F1dGgtc2Vzc2lvbi0wMDEnXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdEF1dGhlbnRpY2F0aW9uRmxvdygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBTSUTjg5njg7zjgrnoqo3oqLzjg4bjgrnjg4hcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAnYXV0aC1zaWQtY29tcHJlaGVuc2l2ZS0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ1NJROODmeODvOOCueiqjeiovOWMheaLrOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnYXV0aGVudGljYXRpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ3Rlc3R1c2VyLCBhZG1pbiwgdGVzdHVzZXIwLTQ544GuU0lE44OZ44O844K56KqN6Ki85YyF5ous44OG44K544OIJyxcbiAgICAgICAgdGltZW91dDogMzAwMDAwLCAvLyA15YiGXG4gICAgICAgIHJldHJ5Q291bnQ6IDEsXG4gICAgICAgIGRlcGVuZGVuY2llczogWydhdXRoLXZhbGlkLTAwMSddLFxuICAgICAgICBleGVjdXRlOiBhc3luYyAoZW5naW5lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY3V0ZVNJREF1dGhlbnRpY2F0aW9uVGVzdHMoZW5naW5lKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8g44Oe44Or44OB44Oq44O844K444On44Oz6KqN6Ki844OG44K544OIXG4gICAgICB7XG4gICAgICAgIHRlc3RJZDogJ2F1dGgtbXVsdGktcmVnaW9uLTAwMScsXG4gICAgICAgIHRlc3ROYW1lOiAn44Oe44Or44OB44Oq44O844K444On44Oz6KqN6Ki844OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhdXRoZW50aWNhdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn5p2x5LqsLeWkp+mYquODquODvOOCuOODp+ODs+mWk+iqjeiovOS4gOiyq+aAp+OBqOODleOCp+OCpOODq+OCquODvOODkOODvOODhuOCueODiCcsXG4gICAgICAgIHRpbWVvdXQ6IDE4MDAwMCwgLy8gM+WIhlxuICAgICAgICByZXRyeUNvdW50OiAxLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFsnYXV0aC12YWxpZC0wMDEnXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWN1dGVNdWx0aVJlZ2lvbkF1dGhUZXN0cyhlbmdpbmUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdWl0ZUlkOiAnYXV0aGVudGljYXRpb24tdGVzdC1zdWl0ZScsXG4gICAgICBzdWl0ZU5hbWU6ICfoqo3oqLzjgrfjgrnjg4bjg6Djg4bjgrnjg4jjgrnjgqTjg7zjg4gnLFxuICAgICAgZGVzY3JpcHRpb246ICflrp/mnKznlapBbWF6b24gQ29nbml0b+ODpuODvOOCtuODvOODl+ODvOODq+OBp+OBruiqjeiovOapn+iDveWMheaLrOODhuOCueODiCcsXG4gICAgICB0ZXN0czogdGVzdERlZmluaXRpb25zLFxuICAgICAgY29uZmlndXJhdGlvbjoge1xuICAgICAgICBwYXJhbGxlbDogZmFsc2UsIC8vIOiqjeiovOODhuOCueODiOOBr+mghuasoeWun+ihjFxuICAgICAgICBtYXhDb25jdXJyZW5jeTogMSxcbiAgICAgICAgZmFpbEZhc3Q6IGZhbHNlLCAvLyDkuIDjgaTjga7jg4bjgrnjg4jjgYzlpLHmlZfjgZfjgabjgoLku5bjga7jg4bjgrnjg4jjgpLntpnntppcbiAgICAgICAgY29udGludWVPbkVycm9yOiB0cnVlXG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDoqo3oqLzjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIGFzeW5jIHJ1bkF1dGhlbnRpY2F0aW9uVGVzdHMoKTogUHJvbWlzZTx7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgICByZXN1bHRzOiBNYXA8c3RyaW5nLCBBdXRoVGVzdFJlc3VsdD47XG4gICAgc3VtbWFyeToge1xuICAgICAgdG90YWxUZXN0czogbnVtYmVyO1xuICAgICAgcGFzc2VkVGVzdHM6IG51bWJlcjtcbiAgICAgIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gICAgICBza2lwcGVkVGVzdHM6IG51bWJlcjtcbiAgICAgIHN1Y2Nlc3NSYXRlOiBudW1iZXI7XG4gICAgICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gICAgfTtcbiAgfT4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5qAIOiqjeiovOOCt+OCueODhuODoOODhuOCueODiOOCueOCpOODvOODiOOCkuWun+ihjOmWi+Wniy4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIOODhuOCueODiOOCueOCpOODvOODiOOBruS9nOaIkFxuICAgICAgY29uc3QgdGVzdFN1aXRlID0gdGhpcy5jcmVhdGVBdXRoZW50aWNhdGlvblRlc3RTdWl0ZSgpO1xuXG4gICAgICAvLyDjg4bjgrnjg4jjgqjjg7Pjgrjjg7Pjgafjga7lrp/ooYxcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnRlc3RFbmdpbmUuZXhlY3V0ZVRlc3RTdWl0ZSh0ZXN0U3VpdGUpO1xuXG4gICAgICAvLyDntZDmnpzjga7pm4boqIhcbiAgICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLmdlbmVyYXRlVGVzdFN1bW1hcnkocmVzdWx0cyk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfwn5OKIOiqjeiovOODhuOCueODiOWun+ihjOe1kOaenDonKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDnt4/jg4bjgrnjg4jmlbA6ICR7c3VtbWFyeS50b3RhbFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOaIkOWKnzogJHtzdW1tYXJ5LnBhc3NlZFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOWkseaVlzogJHtzdW1tYXJ5LmZhaWxlZFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOOCueOCreODg+ODlzogJHtzdW1tYXJ5LnNraXBwZWRUZXN0c31gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICDmiJDlip/njoc6ICR7KHN1bW1hcnkuc3VjY2Vzc1JhdGUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOe3j+Wun+ihjOaZgumWkzogJHtzdW1tYXJ5LnRvdGFsRHVyYXRpb259bXNgKTtcblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IHN1bW1hcnkuZmFpbGVkVGVzdHMgPT09IDA7XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg6KqN6Ki844K344K544OG44Og44OG44K544OI44K544Kk44O844OI5a6f6KGM5a6M5LqGIC0g5YWo44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygn4pqg77iPIOiqjeiovOOCt+OCueODhuODoOODhuOCueODiOOCueOCpOODvOODiOWun+ihjOWujOS6hiAtIOS4gOmDqOODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzLFxuICAgICAgICByZXN1bHRzOiByZXN1bHRzIGFzIE1hcDxzdHJpbmcsIEF1dGhUZXN0UmVzdWx0PixcbiAgICAgICAgc3VtbWFyeVxuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg6KqN6Ki844OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jntZDmnpzjgrXjg57jg6rjg7zjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVUZXN0U3VtbWFyeShyZXN1bHRzOiBNYXA8c3RyaW5nLCBhbnk+KToge1xuICAgIHRvdGFsVGVzdHM6IG51bWJlcjtcbiAgICBwYXNzZWRUZXN0czogbnVtYmVyO1xuICAgIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gICAgc2tpcHBlZFRlc3RzOiBudW1iZXI7XG4gICAgc3VjY2Vzc1JhdGU6IG51bWJlcjtcbiAgICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IHJlc3VsdHNBcnJheSA9IEFycmF5LmZyb20ocmVzdWx0cy52YWx1ZXMoKSk7XG4gICAgXG4gICAgY29uc3QgdG90YWxUZXN0cyA9IHJlc3VsdHNBcnJheS5sZW5ndGg7XG4gICAgY29uc3QgcGFzc2VkVGVzdHMgPSByZXN1bHRzQXJyYXkuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XG4gICAgY29uc3QgZmFpbGVkVGVzdHMgPSByZXN1bHRzQXJyYXkuZmlsdGVyKHIgPT4gIXIuc3VjY2VzcyAmJiByLnN0YXR1cyAhPT0gJ1NLSVBQRUQnKS5sZW5ndGg7XG4gICAgY29uc3Qgc2tpcHBlZFRlc3RzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+IHIuc3RhdHVzID09PSAnU0tJUFBFRCcpLmxlbmd0aDtcbiAgICBjb25zdCBzdWNjZXNzUmF0ZSA9IHRvdGFsVGVzdHMgPiAwID8gcGFzc2VkVGVzdHMgLyB0b3RhbFRlc3RzIDogMDtcbiAgICBjb25zdCB0b3RhbER1cmF0aW9uID0gcmVzdWx0c0FycmF5LnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyAoci5kdXJhdGlvbiB8fCAwKSwgMCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG90YWxUZXN0cyxcbiAgICAgIHBhc3NlZFRlc3RzLFxuICAgICAgZmFpbGVkVGVzdHMsXG4gICAgICBza2lwcGVkVGVzdHMsXG4gICAgICBzdWNjZXNzUmF0ZSxcbiAgICAgIHRvdGFsRHVyYXRpb25cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOips+e0sOODrOODneODvOODiOOBrueUn+aIkFxuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVEZXRhaWxlZFJlcG9ydChyZXN1bHRzOiBNYXA8c3RyaW5nLCBBdXRoVGVzdFJlc3VsdD4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBjb25zdCBzdW1tYXJ5ID0gdGhpcy5nZW5lcmF0ZVRlc3RTdW1tYXJ5KHJlc3VsdHMpO1xuXG4gICAgbGV0IHJlcG9ydCA9IGAjIOiqjeiovOOCt+OCueODhuODoOODhuOCueODiOips+e0sOODrOODneODvOODiFxcblxcbmA7XG4gICAgcmVwb3J0ICs9IGAqKuWun+ihjOaXpeaZgioqOiAke3RpbWVzdGFtcH1cXG5gO1xuICAgIHJlcG9ydCArPSBgKirjg4bjgrnjg4jnkrDlooMqKjogQVdT5p2x5Lqs44Oq44O844K444On44Oz5pys55Wq55Kw5aKDICgke3RoaXMuY29uZmlnLnJlZ2lvbn0pXFxuYDtcbiAgICByZXBvcnQgKz0gYCoqQ29nbml0b+ODpuODvOOCtuODvOODl+ODvOODqyoqOiAke3RoaXMuY29uZmlnLnJlc291cmNlcy5jb2duaXRvVXNlclBvb2x9XFxuXFxuYDtcblxuICAgIHJlcG9ydCArPSBgIyMg5a6f6KGM44K144Oe44Oq44O8XFxuXFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirnt4/jg4bjgrnjg4jmlbAqKjogJHtzdW1tYXJ5LnRvdGFsVGVzdHN9XFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirmiJDlip8qKjogJHtzdW1tYXJ5LnBhc3NlZFRlc3RzfVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq5aSx5pWXKio6ICR7c3VtbWFyeS5mYWlsZWRUZXN0c31cXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKuOCueOCreODg+ODlyoqOiAke3N1bW1hcnkuc2tpcHBlZFRlc3RzfVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq5oiQ5Yqf546HKio6ICR7KHN1bW1hcnkuc3VjY2Vzc1JhdGUgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq57eP5a6f6KGM5pmC6ZaTKio6ICR7c3VtbWFyeS50b3RhbER1cmF0aW9ufW1zXFxuXFxuYDtcblxuICAgIHJlcG9ydCArPSBgIyMg44OG44K544OI57WQ5p6c6Kmz57SwXFxuXFxuYDtcblxuICAgIGZvciAoY29uc3QgW3Rlc3RJZCwgcmVzdWx0XSBvZiByZXN1bHRzKSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSByZXN1bHQuc3VjY2VzcyA/ICfinIUg5oiQ5YqfJyA6ICfinYwg5aSx5pWXJztcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gcmVzdWx0LmR1cmF0aW9uIHx8IDA7XG5cbiAgICAgIHJlcG9ydCArPSBgIyMjICR7cmVzdWx0LnRlc3ROYW1lfSAoJHt0ZXN0SWR9KVxcblxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirjgrnjg4bjg7zjgr/jgrkqKjogJHtzdGF0dXN9XFxuYDtcbiAgICAgIHJlcG9ydCArPSBgLSAqKuWun+ihjOaZgumWkyoqOiAke2R1cmF0aW9ufW1zXFxuYDtcbiAgICAgIHJlcG9ydCArPSBgLSAqKumWi+Wni+aZguWIuyoqOiAke3Jlc3VsdC5zdGFydFRpbWU/LnRvSVNPU3RyaW5nKCl9XFxuYDtcbiAgICAgIHJlcG9ydCArPSBgLSAqKue1guS6huaZguWIuyoqOiAke3Jlc3VsdC5lbmRUaW1lPy50b0lTT1N0cmluZygpfVxcbmA7XG5cbiAgICAgIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44Ko44Op44O8Kio6ICR7cmVzdWx0LmVycm9yfVxcbmA7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQuYXV0aERldGFpbHMpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq6KqN6Ki86Kmz57SwKio6XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAgIC0g44OI44O844Kv44Oz44K/44Kk44OXOiAke3Jlc3VsdC5hdXRoRGV0YWlscy50b2tlblR5cGUgfHwgJ04vQSd9XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAgIC0g5pyJ5Yq55pyf6ZmQOiAke3Jlc3VsdC5hdXRoRGV0YWlscy5leHBpcmVzSW4gfHwgJ04vQSd956eSXFxuYDtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC5zZXNzaW9uRGV0YWlscykge1xuICAgICAgICByZXBvcnQgKz0gYC0gKirjgrvjg4Pjgrfjg6fjg7PoqbPntLAqKjpcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjgrvjg4Pjgrfjg6fjg7PkvZzmiJA6ICR7cmVzdWx0LnNlc3Npb25EZXRhaWxzLnNlc3Npb25DcmVhdGVkID8gJ+aIkOWKnycgOiAn5aSx5pWXJ31cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjgrvjg4Pjgrfjg6fjg7PmpJzoqLw6ICR7cmVzdWx0LnNlc3Npb25EZXRhaWxzLnNlc3Npb25WYWxpZCA/ICfmiJDlip8nIDogJ+WkseaVlyd9XFxuYDtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC5tZmFEZXRhaWxzKSB7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKk1GQeips+e0sCoqOlxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgICAtIE1GQeimgeaxgjogJHtyZXN1bHQubWZhRGV0YWlscy5tZmFSZXF1aXJlZCA/ICfjgYLjgoonIDogJ+OBquOBlyd9XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAgIC0g44OB44Oj44Os44Oz44K444K/44Kk44OXOiAke3Jlc3VsdC5tZmFEZXRhaWxzLmNoYWxsZW5nZVR5cGUgfHwgJ04vQSd9XFxuYDtcbiAgICAgIH1cblxuICAgICAgcmVwb3J0ICs9IGBcXG5gO1xuICAgIH1cblxuICAgIHJldHVybiByZXBvcnQ7XG4gIH1cblxuICAvKipcbiAgICogU0lE44OZ44O844K56KqN6Ki844OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVTSURBdXRoZW50aWNhdGlvblRlc3RzKGVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmUpOiBQcm9taXNlPEF1dGhUZXN0UmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SQIFNJROODmeODvOOCueiqjeiovOODhuOCueODiOWun+ihjOS4rS4uLicpO1xuICAgICAgXG4gICAgICAvLyBTSUTjg5njg7zjgrnoqo3oqLzjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjgpLli5XnmoTjgqTjg7Pjg53jg7zjg4hcbiAgICAgIGNvbnN0IHsgU0lEQmFzZWRBdXRoVGVzdE1vZHVsZSB9ID0gYXdhaXQgaW1wb3J0KCcuL3NpZC1iYXNlZC1hdXRoLXRlc3QnKTtcbiAgICAgIGNvbnN0IHNpZE1vZHVsZSA9IG5ldyBTSURCYXNlZEF1dGhUZXN0TW9kdWxlKHRoaXMuY29uZmlnKTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHNpZE1vZHVsZS5ydW5BbGxTSURBdXRoZW50aWNhdGlvblRlc3RzKCk7XG4gICAgICBcbiAgICAgIC8vIOe1kOaenOOBrumbhue0hFxuICAgICAgY29uc3Qgc3VjY2Vzc0NvdW50ID0gcmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aDtcbiAgICAgIGNvbnN0IHRvdGFsQ291bnQgPSByZXN1bHRzLmxlbmd0aDtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdElkOiAnYXV0aC1zaWQtY29tcHJlaGVuc2l2ZS0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ1NJROODmeODvOOCueiqjeiovOWMheaLrOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnYXV0aGVudGljYXRpb24nLFxuICAgICAgICBzdGF0dXM6IHN1Y2Nlc3NDb3VudCA9PT0gdG90YWxDb3VudCA/ICdDT01QTEVURUQnIDogJ0ZBSUxFRCcsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IHJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIChyLmR1cmF0aW9uIHx8IDApLCAwKSxcbiAgICAgICAgc3VjY2Vzczogc3VjY2Vzc0NvdW50ID09PSB0b3RhbENvdW50LFxuICAgICAgICBtZXRhZGF0YTogeyBcbiAgICAgICAgICBzaWRUZXN0Q291bnQ6IHRvdGFsQ291bnQsXG4gICAgICAgICAgc3VjY2Vzc0NvdW50LFxuICAgICAgICAgIGZhaWxlZENvdW50OiB0b3RhbENvdW50IC0gc3VjY2Vzc0NvdW50LFxuICAgICAgICAgIGRldGFpbGVkUmVzdWx0czogcmVzdWx0c1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBTSUTjg5njg7zjgrnoqo3oqLzjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRmFpbHVyZVJlc3VsdCgnYXV0aC1zaWQtY29tcHJlaGVuc2l2ZS0wMDEnLCAnU0lE44OZ44O844K56KqN6Ki85YyF5ous44OG44K544OIJywgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7Poqo3oqLzjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZU11bHRpUmVnaW9uQXV0aFRlc3RzKGVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmUpOiBQcm9taXNlPEF1dGhUZXN0UmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn4yPIOODnuODq+ODgeODquODvOOCuOODp+ODs+iqjeiovOODhuOCueODiOWun+ihjOS4rS4uLicpO1xuICAgICAgXG4gICAgICAvLyDjg57jg6vjg4Hjg6rjg7zjgrjjg6fjg7Poqo3oqLzjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjgpLli5XnmoTjgqTjg7Pjg53jg7zjg4hcbiAgICAgIGNvbnN0IHsgTXVsdGlSZWdpb25BdXRoVGVzdE1vZHVsZSB9ID0gYXdhaXQgaW1wb3J0KCcuL211bHRpLXJlZ2lvbi1hdXRoLXRlc3QnKTtcbiAgICAgIGNvbnN0IG11bHRpUmVnaW9uTW9kdWxlID0gbmV3IE11bHRpUmVnaW9uQXV0aFRlc3RNb2R1bGUodGhpcy5jb25maWcpO1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgbXVsdGlSZWdpb25Nb2R1bGUucnVuQWxsTXVsdGlSZWdpb25BdXRoVGVzdHMoKTtcbiAgICAgIFxuICAgICAgLy8g57WQ5p6c44Gu6ZuG57SEXG4gICAgICBjb25zdCBzdWNjZXNzQ291bnQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgICAgY29uc3QgdG90YWxDb3VudCA9IHJlc3VsdHMubGVuZ3RoO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQ6ICdhdXRoLW11bHRpLXJlZ2lvbi0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+ODnuODq+ODgeODquODvOOCuOODp+ODs+iqjeiovOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnYXV0aGVudGljYXRpb24nLFxuICAgICAgICBzdGF0dXM6IHN1Y2Nlc3NDb3VudCA9PT0gdG90YWxDb3VudCA/ICdDT01QTEVURUQnIDogJ0ZBSUxFRCcsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IHJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIChyLmR1cmF0aW9uIHx8IDApLCAwKSxcbiAgICAgICAgc3VjY2Vzczogc3VjY2Vzc0NvdW50ID09PSB0b3RhbENvdW50LFxuICAgICAgICBtZXRhZGF0YTogeyBcbiAgICAgICAgICBtdWx0aVJlZ2lvblRlc3RDb3VudDogdG90YWxDb3VudCxcbiAgICAgICAgICBzdWNjZXNzQ291bnQsXG4gICAgICAgICAgZmFpbGVkQ291bnQ6IHRvdGFsQ291bnQgLSBzdWNjZXNzQ291bnQsXG4gICAgICAgICAgZGV0YWlsZWRSZXN1bHRzOiByZXN1bHRzXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOODnuODq+ODgeODquODvOOCuOODp+ODs+iqjeiovOODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICByZXR1cm4gdGhpcy5jcmVhdGVGYWlsdXJlUmVzdWx0KCdhdXRoLW11bHRpLXJlZ2lvbi0wMDEnLCAn44Oe44Or44OB44Oq44O844K444On44Oz6KqN6Ki844OG44K544OIJywgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlpLHmlZfntZDmnpzjga7kvZzmiJDjg5jjg6vjg5Hjg7xcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRmFpbHVyZVJlc3VsdCh0ZXN0SWQ6IHN0cmluZywgdGVzdE5hbWU6IHN0cmluZywgZXJyb3I6IGFueSk6IEF1dGhUZXN0UmVzdWx0IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGVzdElkLFxuICAgICAgdGVzdE5hbWUsXG4gICAgICBjYXRlZ29yeTogJ2F1dGhlbnRpY2F0aW9uJyxcbiAgICAgIHN0YXR1czogJ0ZBSUxFRCcsXG4gICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgZHVyYXRpb246IDAsXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOODquOCveODvOOCueOBruOCr+ODquODvOODs+OCouODg+ODl1xuICAgKi9cbiAgYXN5bmMgY2xlYW51cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+nuSDoqo3oqLzjg4bjgrnjg4jjg6njg7Pjg4rjg7zjgpLjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK0uLi4nKTtcbiAgICBhd2FpdCB0aGlzLnRlc3RNb2R1bGUuY2xlYW51cCgpO1xuICAgIGNvbnNvbGUubG9nKCfinIUg6KqN6Ki844OG44K544OI44Op44Oz44OK44O844Gu44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQXV0aGVudGljYXRpb25UZXN0UnVubmVyOyJdfQ==