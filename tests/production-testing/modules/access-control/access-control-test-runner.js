"use strict";
/**
 * アクセス権限テスト実行ランナー
 *
 * 実本番IAM/OpenSearchでのアクセス権限テストを安全に実行
 * テスト結果の収集と報告を行う
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlTestRunner = void 0;
const access_control_test_module_1 = __importDefault(require("./access-control-test-module"));
/**
 * アクセス権限テスト実行ランナークラス
 */
class AccessControlTestRunner {
    config;
    testModule;
    testEngine;
    constructor(config, testEngine) {
        this.config = config;
        this.testEngine = testEngine;
        this.testModule = new access_control_test_module_1.default(config);
    }
    /**
     * アクセス権限テストスイートの作成
     */
    createAccessControlTestSuite() {
        const testDefinitions = [
            {
                testId: 'access-authorized-001',
                testName: '権限を持つユーザーの文書検索テスト',
                category: 'access-control',
                description: '実本番OpenSearchで権限を持つユーザーの文書アクセステスト',
                timeout: 45000, // 45秒
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testAuthorizedDocumentAccess();
                }
            },
            {
                testId: 'access-unauthorized-001',
                testName: '権限を持たないユーザーのアクセス拒否テスト',
                category: 'access-control',
                description: '実本番OpenSearchで権限を持たないユーザーのアクセス拒否テスト',
                timeout: 45000,
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testUnauthorizedDocumentAccess();
                }
            },
            {
                testId: 'access-admin-001',
                testName: '管理者権限テスト',
                category: 'access-control',
                description: '管理者ユーザーの全文書アクセス権限テスト',
                timeout: 60000, // 60秒
                retryCount: 1,
                dependencies: ['access-authorized-001'],
                execute: async (engine) => {
                    return await this.testModule.testAdminPermissions();
                }
            },
            {
                testId: 'access-multigroup-001',
                testName: '複数グループ所属ユーザーの権限統合テスト',
                category: 'access-control',
                description: '複数グループに所属するユーザーの権限統合機能テスト',
                timeout: 60000,
                retryCount: 1,
                dependencies: ['access-authorized-001'],
                execute: async (engine) => {
                    return await this.testModule.testMultiGroupPermissions();
                }
            },
            {
                testId: 'access-iam-role-001',
                testName: 'IAMロールベースアクセス制御テスト',
                category: 'access-control',
                description: '実本番IAMロールでのアクセス制御機能テスト',
                timeout: 45000,
                retryCount: 2,
                dependencies: [],
                execute: async (engine) => {
                    return await this.testModule.testIAMRoleBasedAccess();
                }
            }
        ];
        return {
            suiteId: 'access-control-test-suite',
            suiteName: 'アクセス権限テストスイート',
            description: '実本番IAMロールとOpenSearch Serverlessでの権限ベースアクセス制御包括テスト',
            tests: testDefinitions,
            configuration: {
                parallel: false, // アクセス権限テストは順次実行
                maxConcurrency: 1,
                failFast: false, // 一つのテストが失敗しても他のテストを継続
                continueOnError: true
            }
        };
    }
    /**
     * アクセス権限テストの実行
     */
    async runAccessControlTests() {
        console.log('🚀 アクセス権限テストスイートを実行開始...');
        try {
            // テストスイートの作成
            const testSuite = this.createAccessControlTestSuite();
            // テストエンジンでの実行
            const results = await this.testEngine.executeTestSuite(testSuite);
            // 結果の集計
            const summary = this.generateTestSummary(results);
            console.log('📊 アクセス権限テスト実行結果:');
            console.log(`   総テスト数: ${summary.totalTests}`);
            console.log(`   成功: ${summary.passedTests}`);
            console.log(`   失敗: ${summary.failedTests}`);
            console.log(`   スキップ: ${summary.skippedTests}`);
            console.log(`   成功率: ${(summary.successRate * 100).toFixed(1)}%`);
            console.log(`   セキュリティスコア: ${(summary.securityScore * 100).toFixed(1)}%`);
            console.log(`   総実行時間: ${summary.totalDuration}ms`);
            const success = summary.failedTests === 0;
            if (success) {
                console.log('✅ アクセス権限テストスイート実行完了 - 全テスト成功');
            }
            else {
                console.log('⚠️ アクセス権限テストスイート実行完了 - 一部テスト失敗');
            }
            return {
                success,
                results: results,
                summary
            };
        }
        catch (error) {
            console.error('❌ アクセス権限テスト実行エラー:', error);
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
        // セキュリティスコアの計算（権限テストの重要度を考慮）
        const securityScore = this.calculateSecurityScore(resultsArray);
        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            successRate,
            totalDuration,
            securityScore
        };
    }
    /**
     * セキュリティスコアの計算
     */
    calculateSecurityScore(results) {
        const weights = {
            'access-authorized-001': 0.2, // 正当なアクセス
            'access-unauthorized-001': 0.3, // 不正アクセス防止（重要）
            'access-admin-001': 0.2, // 管理者権限
            'access-multigroup-001': 0.15, // 複数グループ権限
            'access-iam-role-001': 0.15 // IAMロール
        };
        let totalScore = 0;
        let totalWeight = 0;
        results.forEach(result => {
            const weight = weights[result.testId] || 0.1;
            totalWeight += weight;
            if (result.success) {
                totalScore += weight;
            }
        });
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    /**
     * 詳細レポートの生成
     */
    async generateDetailedReport(results) {
        const timestamp = new Date().toISOString();
        const summary = this.generateTestSummary(results);
        let report = `# アクセス権限テスト詳細レポート\n\n`;
        report += `**実行日時**: ${timestamp}\n`;
        report += `**テスト環境**: AWS東京リージョン本番環境 (${this.config.region})\n`;
        report += `**OpenSearchドメイン**: ${this.config.resources.openSearchDomain}\n`;
        report += `**DynamoDBテーブル**: ${this.config.resources.dynamoDBTables.sessions}\n\n`;
        report += `## 実行サマリー\n\n`;
        report += `- **総テスト数**: ${summary.totalTests}\n`;
        report += `- **成功**: ${summary.passedTests}\n`;
        report += `- **失敗**: ${summary.failedTests}\n`;
        report += `- **スキップ**: ${summary.skippedTests}\n`;
        report += `- **成功率**: ${(summary.successRate * 100).toFixed(1)}%\n`;
        report += `- **セキュリティスコア**: ${(summary.securityScore * 100).toFixed(1)}%\n`;
        report += `- **総実行時間**: ${summary.totalDuration}ms\n\n`;
        // セキュリティ評価
        report += `## セキュリティ評価\n\n`;
        if (summary.securityScore >= 0.9) {
            report += `🟢 **優秀**: アクセス制御が適切に機能しています\n`;
        }
        else if (summary.securityScore >= 0.7) {
            report += `🟡 **良好**: 軽微な改善点があります\n`;
        }
        else {
            report += `🔴 **要改善**: セキュリティ上の問題が検出されました\n`;
        }
        report += `\n`;
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
            if (result.accessDetails) {
                report += `- **アクセス詳細**:\n`;
                report += `  - アクセス権限: ${result.accessDetails.hasAccess ? 'あり' : 'なし'}\n`;
                report += `  - 権限レベル: ${result.accessDetails.permissionLevel}\n`;
                report += `  - アクセス可能文書: ${result.accessDetails.allowedDocuments}件\n`;
                report += `  - アクセス拒否文書: ${result.accessDetails.deniedDocuments}件\n`;
                report += `  - ユーザーグループ: ${result.accessDetails.userGroups.join(', ')}\n`;
            }
            if (result.searchResults) {
                report += `- **検索結果詳細**:\n`;
                report += `  - 総文書数: ${result.searchResults.totalDocuments}件\n`;
                report += `  - アクセス可能: ${result.searchResults.accessibleDocuments}件\n`;
                report += `  - 制限文書: ${result.searchResults.restrictedDocuments}件\n`;
                report += `  - 検索クエリ: "${result.searchResults.searchQuery}"\n`;
            }
            if (result.roleDetails) {
                report += `- **IAMロール詳細**:\n`;
                report += `  - ロール名: ${result.roleDetails.roleName}\n`;
                report += `  - ポリシー数: ${result.roleDetails.policies.length}\n`;
                report += `  - 権限数: ${result.roleDetails.permissions.length}\n`;
            }
            report += `\n`;
        }
        // 推奨事項
        report += `## 推奨事項\n\n`;
        report += this.generateRecommendations(results);
        return report;
    }
    /**
     * 推奨事項の生成
     */
    generateRecommendations(results) {
        let recommendations = '';
        const failedTests = Array.from(results.values()).filter(r => !r.success);
        if (failedTests.length === 0) {
            recommendations += `✅ 全てのアクセス制御テストが成功しました。現在の設定を維持してください。\n\n`;
        }
        else {
            recommendations += `以下の改善を推奨します:\n\n`;
            failedTests.forEach(test => {
                switch (test.testId) {
                    case 'access-authorized-001':
                        recommendations += `- **正当なアクセス**: OpenSearchの権限設定を確認し、適切なユーザーがアクセスできるよう調整してください\n`;
                        break;
                    case 'access-unauthorized-001':
                        recommendations += `- **不正アクセス防止**: セキュリティ設定を強化し、権限のないユーザーのアクセスを確実に拒否してください\n`;
                        break;
                    case 'access-admin-001':
                        recommendations += `- **管理者権限**: 管理者ユーザーの権限設定を確認し、必要な文書にアクセスできるよう設定してください\n`;
                        break;
                    case 'access-multigroup-001':
                        recommendations += `- **複数グループ権限**: グループ権限の統合ロジックを確認し、適切に動作するよう修正してください\n`;
                        break;
                    case 'access-iam-role-001':
                        recommendations += `- **IAMロール**: IAMロールとポリシーの設定を確認し、必要な権限が付与されているか確認してください\n`;
                        break;
                }
            });
        }
        recommendations += `\n### セキュリティベストプラクティス\n\n`;
        recommendations += `- 定期的な権限監査の実施\n`;
        recommendations += `- 最小権限の原則の適用\n`;
        recommendations += `- アクセスログの継続的な監視\n`;
        recommendations += `- 権限変更時の影響評価\n`;
        return recommendations;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 アクセス権限テストランナーをクリーンアップ中...');
        await this.testModule.cleanup();
        console.log('✅ アクセス権限テストランナーのクリーンアップ完了');
    }
}
exports.AccessControlTestRunner = AccessControlTestRunner;
exports.default = AccessControlTestRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzLWNvbnRyb2wtdGVzdC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhY2Nlc3MtY29udHJvbC10ZXN0LXJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7OztBQUVILDhGQUFnRztBQUloRzs7R0FFRztBQUNILE1BQWEsdUJBQXVCO0lBQzFCLE1BQU0sQ0FBbUI7SUFDekIsVUFBVSxDQUEwQjtJQUNwQyxVQUFVLENBQXVCO0lBRXpDLFlBQVksTUFBd0IsRUFBRSxVQUFnQztRQUNwRSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksb0NBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsNEJBQTRCO1FBQzFCLE1BQU0sZUFBZSxHQUFxQjtZQUN4QztnQkFDRSxNQUFNLEVBQUUsdUJBQXVCO2dCQUMvQixRQUFRLEVBQUUsbUJBQW1CO2dCQUM3QixRQUFRLEVBQUUsZ0JBQWdCO2dCQUMxQixXQUFXLEVBQUUsbUNBQW1DO2dCQUNoRCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU07Z0JBQ3RCLFVBQVUsRUFBRSxDQUFDO2dCQUNiLFlBQVksRUFBRSxFQUFFO2dCQUNoQixPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUN4QixPQUFPLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO2dCQUM5RCxDQUFDO2FBQ0Y7WUFDRDtnQkFDRSxNQUFNLEVBQUUseUJBQXlCO2dCQUNqQyxRQUFRLEVBQUUsdUJBQXVCO2dCQUNqQyxRQUFRLEVBQUUsZ0JBQWdCO2dCQUMxQixXQUFXLEVBQUUscUNBQXFDO2dCQUNsRCxPQUFPLEVBQUUsS0FBSztnQkFDZCxVQUFVLEVBQUUsQ0FBQztnQkFD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WUFFdEMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekIsUUFBUSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3BCLEtBQUssdUJBQXVCO3dCQUMxQixlQUFlLElBQUksZ0VBQWdFLENBQUM7d0JBQ3BGLE1BQU07b0JBQ1IsS0FBSyx5QkFBeUI7d0JBQzVCLGVBQWUsSUFBSSwyREFBMkQsQ0FBQzt3QkFDL0UsTUFBTTtvQkFDUixLQUFLLGtCQUFrQjt3QkFDckIsZUFBZSxJQUFJLHlEQUF5RCxDQUFDO3dCQUM3RSxNQUFNO29CQUNSLEtBQUssdUJBQXVCO3dCQUMxQixlQUFlLElBQUksdURBQXVELENBQUM7d0JBQzNFLE1BQU07b0JBQ1IsS0FBSyxxQkFBcUI7d0JBQ3hCLGVBQWUsSUFBSSwyREFBMkQsQ0FBQzt3QkFDL0UsTUFBTTtnQkFDVixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsZUFBZSxJQUFJLDJCQUEyQixDQUFDO1FBQy9DLGVBQWUsSUFBSSxpQkFBaUIsQ0FBQztRQUNyQyxlQUFlLElBQUksZ0JBQWdCLENBQUM7UUFDcEMsZUFBZSxJQUFJLG1CQUFtQixDQUFDO1FBQ3ZDLGVBQWUsSUFBSSxnQkFBZ0IsQ0FBQztRQUVwQyxPQUFPLGVBQWUsQ0FBQztJQUN6QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUM1QyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FDRjtBQXhWRCwwREF3VkM7QUFFRCxrQkFBZSx1QkFBdUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog44Ki44Kv44K744K55qip6ZmQ44OG44K544OI5a6f6KGM44Op44Oz44OK44O8XG4gKiBcbiAqIOWun+acrOeVqklBTS9PcGVuU2VhcmNo44Gn44Gu44Ki44Kv44K744K55qip6ZmQ44OG44K544OI44KS5a6J5YWo44Gr5a6f6KGMXG4gKiDjg4bjgrnjg4jntZDmnpzjga7lj47pm4bjgajloLHlkYrjgpLooYzjgYZcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCBBY2Nlc3NDb250cm9sVGVzdE1vZHVsZSwgeyBBY2Nlc3NDb250cm9sVGVzdFJlc3VsdCB9IGZyb20gJy4vYWNjZXNzLWNvbnRyb2wtdGVzdC1tb2R1bGUnO1xuaW1wb3J0IFByb2R1Y3Rpb25UZXN0RW5naW5lLCB7IFRlc3REZWZpbml0aW9uLCBUZXN0U3VpdGUgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5cbi8qKlxuICog44Ki44Kv44K744K55qip6ZmQ44OG44K544OI5a6f6KGM44Op44Oz44OK44O844Kv44Op44K5XG4gKi9cbmV4cG9ydCBjbGFzcyBBY2Nlc3NDb250cm9sVGVzdFJ1bm5lciB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIHRlc3RNb2R1bGU6IEFjY2Vzc0NvbnRyb2xUZXN0TW9kdWxlO1xuICBwcml2YXRlIHRlc3RFbmdpbmU6IFByb2R1Y3Rpb25UZXN0RW5naW5lO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZywgdGVzdEVuZ2luZTogUHJvZHVjdGlvblRlc3RFbmdpbmUpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnRlc3RFbmdpbmUgPSB0ZXN0RW5naW5lO1xuICAgIHRoaXMudGVzdE1vZHVsZSA9IG5ldyBBY2Nlc3NDb250cm9sVGVzdE1vZHVsZShjb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCouOCr+OCu+OCueaoqemZkOODhuOCueODiOOCueOCpOODvOODiOOBruS9nOaIkFxuICAgKi9cbiAgY3JlYXRlQWNjZXNzQ29udHJvbFRlc3RTdWl0ZSgpOiBUZXN0U3VpdGUge1xuICAgIGNvbnN0IHRlc3REZWZpbml0aW9uczogVGVzdERlZmluaXRpb25bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAnYWNjZXNzLWF1dGhvcml6ZWQtMDAxJyxcbiAgICAgICAgdGVzdE5hbWU6ICfmqKnpmZDjgpLmjIHjgaTjg6bjg7zjgrbjg7zjga7mlofmm7jmpJzntKLjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FjY2Vzcy1jb250cm9sJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICflrp/mnKznlapPcGVuU2VhcmNo44Gn5qip6ZmQ44KS5oyB44Gk44Om44O844K244O844Gu5paH5pu444Ki44Kv44K744K544OG44K544OIJyxcbiAgICAgICAgdGltZW91dDogNDUwMDAsIC8vIDQ156eSXG4gICAgICAgIHJldHJ5Q291bnQ6IDIsXG4gICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgIGV4ZWN1dGU6IGFzeW5jIChlbmdpbmUpID0+IHtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy50ZXN0TW9kdWxlLnRlc3RBdXRob3JpemVkRG9jdW1lbnRBY2Nlc3MoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdGVzdElkOiAnYWNjZXNzLXVuYXV0aG9yaXplZC0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+aoqemZkOOCkuaMgeOBn+OBquOBhOODpuODvOOCtuODvOOBruOCouOCr+OCu+OCueaLkuWQpuODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnYWNjZXNzLWNvbnRyb2wnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+Wun+acrOeVqk9wZW5TZWFyY2jjgafmqKnpmZDjgpLmjIHjgZ/jgarjgYTjg6bjg7zjgrbjg7zjga7jgqLjgq/jgrvjgrnmi5LlkKbjg4bjgrnjg4gnLFxuICAgICAgICB0aW1lb3V0OiA0NTAwMCxcbiAgICAgICAgcmV0cnlDb3VudDogMixcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdFVuYXV0aG9yaXplZERvY3VtZW50QWNjZXNzKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRlc3RJZDogJ2FjY2Vzcy1hZG1pbi0wMDEnLFxuICAgICAgICB0ZXN0TmFtZTogJ+euoeeQhuiAheaoqemZkOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnYWNjZXNzLWNvbnRyb2wnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+euoeeQhuiAheODpuODvOOCtuODvOOBruWFqOaWh+abuOOCouOCr+OCu+OCueaoqemZkOODhuOCueODiCcsXG4gICAgICAgIHRpbWVvdXQ6IDYwMDAwLCAvLyA2MOenklxuICAgICAgICByZXRyeUNvdW50OiAxLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFsnYWNjZXNzLWF1dGhvcml6ZWQtMDAxJ10sXG4gICAgICAgIGV4ZWN1dGU6IGFzeW5jIChlbmdpbmUpID0+IHtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy50ZXN0TW9kdWxlLnRlc3RBZG1pblBlcm1pc3Npb25zKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRlc3RJZDogJ2FjY2Vzcy1tdWx0aWdyb3VwLTAwMScsXG4gICAgICAgIHRlc3ROYW1lOiAn6KSH5pWw44Kw44Or44O844OX5omA5bGe44Om44O844K244O844Gu5qip6ZmQ57Wx5ZCI44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2Nlc3MtY29udHJvbCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn6KSH5pWw44Kw44Or44O844OX44Gr5omA5bGe44GZ44KL44Om44O844K244O844Gu5qip6ZmQ57Wx5ZCI5qmf6IO944OG44K544OIJyxcbiAgICAgICAgdGltZW91dDogNjAwMDAsXG4gICAgICAgIHJldHJ5Q291bnQ6IDEsXG4gICAgICAgIGRlcGVuZGVuY2llczogWydhY2Nlc3MtYXV0aG9yaXplZC0wMDEnXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdE11bHRpR3JvdXBQZXJtaXNzaW9ucygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0ZXN0SWQ6ICdhY2Nlc3MtaWFtLXJvbGUtMDAxJyxcbiAgICAgICAgdGVzdE5hbWU6ICdJQU3jg63jg7zjg6vjg5njg7zjgrnjgqLjgq/jgrvjgrnliLblvqHjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FjY2Vzcy1jb250cm9sJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICflrp/mnKznlapJQU3jg63jg7zjg6vjgafjga7jgqLjgq/jgrvjgrnliLblvqHmqZ/og73jg4bjgrnjg4gnLFxuICAgICAgICB0aW1lb3V0OiA0NTAwMCxcbiAgICAgICAgcmV0cnlDb3VudDogMixcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbXSxcbiAgICAgICAgZXhlY3V0ZTogYXN5bmMgKGVuZ2luZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnRlc3RNb2R1bGUudGVzdElBTVJvbGVCYXNlZEFjY2VzcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdWl0ZUlkOiAnYWNjZXNzLWNvbnRyb2wtdGVzdC1zdWl0ZScsXG4gICAgICBzdWl0ZU5hbWU6ICfjgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4jjgrnjgqTjg7zjg4gnLFxuICAgICAgZGVzY3JpcHRpb246ICflrp/mnKznlapJQU3jg63jg7zjg6vjgahPcGVuU2VhcmNoIFNlcnZlcmxlc3Pjgafjga7mqKnpmZDjg5njg7zjgrnjgqLjgq/jgrvjgrnliLblvqHljIXmi6zjg4bjgrnjg4gnLFxuICAgICAgdGVzdHM6IHRlc3REZWZpbml0aW9ucyxcbiAgICAgIGNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgcGFyYWxsZWw6IGZhbHNlLCAvLyDjgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4jjga/poIbmrKHlrp/ooYxcbiAgICAgICAgbWF4Q29uY3VycmVuY3k6IDEsXG4gICAgICAgIGZhaWxGYXN0OiBmYWxzZSwgLy8g5LiA44Gk44Gu44OG44K544OI44GM5aSx5pWX44GX44Gm44KC5LuW44Gu44OG44K544OI44KS57aZ57aaXG4gICAgICAgIGNvbnRpbnVlT25FcnJvcjogdHJ1ZVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44Ki44Kv44K744K55qip6ZmQ44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBhc3luYyBydW5BY2Nlc3NDb250cm9sVGVzdHMoKTogUHJvbWlzZTx7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgICByZXN1bHRzOiBNYXA8c3RyaW5nLCBBY2Nlc3NDb250cm9sVGVzdFJlc3VsdD47XG4gICAgc3VtbWFyeToge1xuICAgICAgdG90YWxUZXN0czogbnVtYmVyO1xuICAgICAgcGFzc2VkVGVzdHM6IG51bWJlcjtcbiAgICAgIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gICAgICBza2lwcGVkVGVzdHM6IG51bWJlcjtcbiAgICAgIHN1Y2Nlc3NSYXRlOiBudW1iZXI7XG4gICAgICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gICAgICBzZWN1cml0eVNjb3JlOiBudW1iZXI7XG4gICAgfTtcbiAgfT4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5qAIOOCouOCr+OCu+OCueaoqemZkOODhuOCueODiOOCueOCpOODvOODiOOCkuWun+ihjOmWi+Wniy4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIOODhuOCueODiOOCueOCpOODvOODiOOBruS9nOaIkFxuICAgICAgY29uc3QgdGVzdFN1aXRlID0gdGhpcy5jcmVhdGVBY2Nlc3NDb250cm9sVGVzdFN1aXRlKCk7XG5cbiAgICAgIC8vIOODhuOCueODiOOCqOODs+OCuOODs+OBp+OBruWun+ihjFxuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMudGVzdEVuZ2luZS5leGVjdXRlVGVzdFN1aXRlKHRlc3RTdWl0ZSk7XG5cbiAgICAgIC8vIOe1kOaenOOBrumbhuioiFxuICAgICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuZ2VuZXJhdGVUZXN0U3VtbWFyeShyZXN1bHRzKTtcblxuICAgICAgY29uc29sZS5sb2coJ/Cfk4og44Ki44Kv44K744K55qip6ZmQ44OG44K544OI5a6f6KGM57WQ5p6cOicpO1xuICAgICAgY29uc29sZS5sb2coYCAgIOe3j+ODhuOCueODiOaVsDogJHtzdW1tYXJ5LnRvdGFsVGVzdHN9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg5oiQ5YqfOiAke3N1bW1hcnkucGFzc2VkVGVzdHN9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg5aSx5pWXOiAke3N1bW1hcnkuZmFpbGVkVGVzdHN9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44K544Kt44OD44OXOiAke3N1bW1hcnkuc2tpcHBlZFRlc3RzfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOaIkOWKn+eOhzogJHsoc3VtbWFyeS5zdWNjZXNzUmF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAg44K744Kt44Ol44Oq44OG44Kj44K544Kz44KiOiAkeyhzdW1tYXJ5LnNlY3VyaXR5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIOe3j+Wun+ihjOaZgumWkzogJHtzdW1tYXJ5LnRvdGFsRHVyYXRpb259bXNgKTtcblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IHN1bW1hcnkuZmFpbGVkVGVzdHMgPT09IDA7XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg44Ki44Kv44K744K55qip6ZmQ44OG44K544OI44K544Kk44O844OI5a6f6KGM5a6M5LqGIC0g5YWo44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygn4pqg77iPIOOCouOCr+OCu+OCueaoqemZkOODhuOCueODiOOCueOCpOODvOODiOWun+ihjOWujOS6hiAtIOS4gOmDqOODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzLFxuICAgICAgICByZXN1bHRzOiByZXN1bHRzIGFzIE1hcDxzdHJpbmcsIEFjY2Vzc0NvbnRyb2xUZXN0UmVzdWx0PixcbiAgICAgICAgc3VtbWFyeVxuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44Ki44Kv44K744K55qip6ZmQ44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jntZDmnpzjgrXjg57jg6rjg7zjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVUZXN0U3VtbWFyeShyZXN1bHRzOiBNYXA8c3RyaW5nLCBhbnk+KToge1xuICAgIHRvdGFsVGVzdHM6IG51bWJlcjtcbiAgICBwYXNzZWRUZXN0czogbnVtYmVyO1xuICAgIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gICAgc2tpcHBlZFRlc3RzOiBudW1iZXI7XG4gICAgc3VjY2Vzc1JhdGU6IG51bWJlcjtcbiAgICB0b3RhbER1cmF0aW9uOiBudW1iZXI7XG4gICAgc2VjdXJpdHlTY29yZTogbnVtYmVyO1xuICB9IHtcbiAgICBjb25zdCByZXN1bHRzQXJyYXkgPSBBcnJheS5mcm9tKHJlc3VsdHMudmFsdWVzKCkpO1xuICAgIFxuICAgIGNvbnN0IHRvdGFsVGVzdHMgPSByZXN1bHRzQXJyYXkubGVuZ3RoO1xuICAgIGNvbnN0IHBhc3NlZFRlc3RzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xuICAgIGNvbnN0IGZhaWxlZFRlc3RzID0gcmVzdWx0c0FycmF5LmZpbHRlcihyID0+ICFyLnN1Y2Nlc3MgJiYgci5zdGF0dXMgIT09ICdTS0lQUEVEJykubGVuZ3RoO1xuICAgIGNvbnN0IHNraXBwZWRUZXN0cyA9IHJlc3VsdHNBcnJheS5maWx0ZXIociA9PiByLnN0YXR1cyA9PT0gJ1NLSVBQRUQnKS5sZW5ndGg7XG4gICAgY29uc3Qgc3VjY2Vzc1JhdGUgPSB0b3RhbFRlc3RzID4gMCA/IHBhc3NlZFRlc3RzIC8gdG90YWxUZXN0cyA6IDA7XG4gICAgY29uc3QgdG90YWxEdXJhdGlvbiA9IHJlc3VsdHNBcnJheS5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgKHIuZHVyYXRpb24gfHwgMCksIDApO1xuICAgIFxuICAgIC8vIOOCu+OCreODpeODquODhuOCo+OCueOCs+OCouOBruioiOeul++8iOaoqemZkOODhuOCueODiOOBrumHjeimgeW6puOCkuiAg+aFru+8iVxuICAgIGNvbnN0IHNlY3VyaXR5U2NvcmUgPSB0aGlzLmNhbGN1bGF0ZVNlY3VyaXR5U2NvcmUocmVzdWx0c0FycmF5KTtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3RhbFRlc3RzLFxuICAgICAgcGFzc2VkVGVzdHMsXG4gICAgICBmYWlsZWRUZXN0cyxcbiAgICAgIHNraXBwZWRUZXN0cyxcbiAgICAgIHN1Y2Nlc3NSYXRlLFxuICAgICAgdG90YWxEdXJhdGlvbixcbiAgICAgIHNlY3VyaXR5U2NvcmVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOOCu+OCreODpeODquODhuOCo+OCueOCs+OCouOBruioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVTZWN1cml0eVNjb3JlKHJlc3VsdHM6IGFueVtdKTogbnVtYmVyIHtcbiAgICBjb25zdCB3ZWlnaHRzID0ge1xuICAgICAgJ2FjY2Vzcy1hdXRob3JpemVkLTAwMSc6IDAuMiwgICAgLy8g5q2j5b2T44Gq44Ki44Kv44K744K5XG4gICAgICAnYWNjZXNzLXVuYXV0aG9yaXplZC0wMDEnOiAwLjMsICAvLyDkuI3mraPjgqLjgq/jgrvjgrnpmLLmraLvvIjph43opoHvvIlcbiAgICAgICdhY2Nlc3MtYWRtaW4tMDAxJzogMC4yLCAgICAgICAgIC8vIOeuoeeQhuiAheaoqemZkFxuICAgICAgJ2FjY2Vzcy1tdWx0aWdyb3VwLTAwMSc6IDAuMTUsICAgLy8g6KSH5pWw44Kw44Or44O844OX5qip6ZmQXG4gICAgICAnYWNjZXNzLWlhbS1yb2xlLTAwMSc6IDAuMTUgICAgICAvLyBJQU3jg63jg7zjg6tcbiAgICB9O1xuXG4gICAgbGV0IHRvdGFsU2NvcmUgPSAwO1xuICAgIGxldCB0b3RhbFdlaWdodCA9IDA7XG5cbiAgICByZXN1bHRzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IHdlaWdodCA9IHdlaWdodHNbcmVzdWx0LnRlc3RJZCBhcyBrZXlvZiB0eXBlb2Ygd2VpZ2h0c10gfHwgMC4xO1xuICAgICAgdG90YWxXZWlnaHQgKz0gd2VpZ2h0O1xuICAgICAgXG4gICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgdG90YWxTY29yZSArPSB3ZWlnaHQ7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdG90YWxXZWlnaHQgPiAwID8gdG90YWxTY29yZSAvIHRvdGFsV2VpZ2h0IDogMDtcbiAgfVxuXG4gIC8qKlxuICAgKiDoqbPntLDjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICovXG4gIGFzeW5jIGdlbmVyYXRlRGV0YWlsZWRSZXBvcnQocmVzdWx0czogTWFwPHN0cmluZywgQWNjZXNzQ29udHJvbFRlc3RSZXN1bHQ+KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3Qgc3VtbWFyeSA9IHRoaXMuZ2VuZXJhdGVUZXN0U3VtbWFyeShyZXN1bHRzKTtcblxuICAgIGxldCByZXBvcnQgPSBgIyDjgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4joqbPntLDjg6zjg53jg7zjg4hcXG5cXG5gO1xuICAgIHJlcG9ydCArPSBgKirlrp/ooYzml6XmmYIqKjogJHt0aW1lc3RhbXB9XFxuYDtcbiAgICByZXBvcnQgKz0gYCoq44OG44K544OI55Kw5aKDKio6IEFXU+adseS6rOODquODvOOCuOODp+ODs+acrOeVqueSsOWigyAoJHt0aGlzLmNvbmZpZy5yZWdpb259KVxcbmA7XG4gICAgcmVwb3J0ICs9IGAqKk9wZW5TZWFyY2jjg4njg6HjgqTjg7MqKjogJHt0aGlzLmNvbmZpZy5yZXNvdXJjZXMub3BlblNlYXJjaERvbWFpbn1cXG5gO1xuICAgIHJlcG9ydCArPSBgKipEeW5hbW9EQuODhuODvOODluODqyoqOiAke3RoaXMuY29uZmlnLnJlc291cmNlcy5keW5hbW9EQlRhYmxlcy5zZXNzaW9uc31cXG5cXG5gO1xuXG4gICAgcmVwb3J0ICs9IGAjIyDlrp/ooYzjgrXjg57jg6rjg7xcXG5cXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKue3j+ODhuOCueODiOaVsCoqOiAke3N1bW1hcnkudG90YWxUZXN0c31cXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKuaIkOWKnyoqOiAke3N1bW1hcnkucGFzc2VkVGVzdHN9XFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirlpLHmlZcqKjogJHtzdW1tYXJ5LmZhaWxlZFRlc3RzfVxcbmA7XG4gICAgcmVwb3J0ICs9IGAtICoq44K544Kt44OD44OXKio6ICR7c3VtbWFyeS5za2lwcGVkVGVzdHN9XFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirmiJDlip/njocqKjogJHsoc3VtbWFyeS5zdWNjZXNzUmF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYDtcbiAgICByZXBvcnQgKz0gYC0gKirjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgrPjgqIqKjogJHsoc3VtbWFyeS5zZWN1cml0eVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gO1xuICAgIHJlcG9ydCArPSBgLSAqKue3j+Wun+ihjOaZgumWkyoqOiAke3N1bW1hcnkudG90YWxEdXJhdGlvbn1tc1xcblxcbmA7XG5cbiAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPoqZXkvqFcbiAgICByZXBvcnQgKz0gYCMjIOOCu+OCreODpeODquODhuOCo+ipleS+oVxcblxcbmA7XG4gICAgaWYgKHN1bW1hcnkuc2VjdXJpdHlTY29yZSA+PSAwLjkpIHtcbiAgICAgIHJlcG9ydCArPSBg8J+foiAqKuWEquengCoqOiDjgqLjgq/jgrvjgrnliLblvqHjgYzpganliIfjgavmqZ/og73jgZfjgabjgYTjgb7jgZlcXG5gO1xuICAgIH0gZWxzZSBpZiAoc3VtbWFyeS5zZWN1cml0eVNjb3JlID49IDAuNykge1xuICAgICAgcmVwb3J0ICs9IGDwn5+hICoq6Imv5aW9Kio6IOi7veW+ruOBquaUueWWhOeCueOBjOOBguOCiuOBvuOBmVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcG9ydCArPSBg8J+UtCAqKuimgeaUueWWhCoqOiDjgrvjgq3jg6Xjg6rjg4bjgqPkuIrjga7llY/poYzjgYzmpJzlh7rjgZXjgozjgb7jgZfjgZ9cXG5gO1xuICAgIH1cbiAgICByZXBvcnQgKz0gYFxcbmA7XG5cbiAgICByZXBvcnQgKz0gYCMjIOODhuOCueODiOe1kOaenOips+e0sFxcblxcbmA7XG5cbiAgICBmb3IgKGNvbnN0IFt0ZXN0SWQsIHJlc3VsdF0gb2YgcmVzdWx0cykge1xuICAgICAgY29uc3Qgc3RhdHVzID0gcmVzdWx0LnN1Y2Nlc3MgPyAn4pyFIOaIkOWKnycgOiAn4p2MIOWkseaVlyc7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IHJlc3VsdC5kdXJhdGlvbiB8fCAwO1xuXG4gICAgICByZXBvcnQgKz0gYCMjIyAke3Jlc3VsdC50ZXN0TmFtZX0gKCR7dGVzdElkfSlcXG5cXG5gO1xuICAgICAgcmVwb3J0ICs9IGAtICoq44K544OG44O844K/44K5Kio6ICR7c3RhdHVzfVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirlrp/ooYzmmYLplpMqKjogJHtkdXJhdGlvbn1tc1xcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirplovlp4vmmYLliLsqKjogJHtyZXN1bHQuc3RhcnRUaW1lPy50b0lTT1N0cmluZygpfVxcbmA7XG4gICAgICByZXBvcnQgKz0gYC0gKirntYLkuobmmYLliLsqKjogJHtyZXN1bHQuZW5kVGltZT8udG9JU09TdHJpbmcoKX1cXG5gO1xuXG4gICAgICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuOCqOODqeODvCoqOiAke3Jlc3VsdC5lcnJvcn1cXG5gO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0LmFjY2Vzc0RldGFpbHMpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoq44Ki44Kv44K744K56Kmz57SwKio6XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAgIC0g44Ki44Kv44K744K55qip6ZmQOiAke3Jlc3VsdC5hY2Nlc3NEZXRhaWxzLmhhc0FjY2VzcyA/ICfjgYLjgoonIDogJ+OBquOBlyd9XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAgIC0g5qip6ZmQ44Os44OZ44OrOiAke3Jlc3VsdC5hY2Nlc3NEZXRhaWxzLnBlcm1pc3Npb25MZXZlbH1cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjgqLjgq/jgrvjgrnlj6/og73mlofmm7g6ICR7cmVzdWx0LmFjY2Vzc0RldGFpbHMuYWxsb3dlZERvY3VtZW50c33ku7ZcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjgqLjgq/jgrvjgrnmi5LlkKbmlofmm7g6ICR7cmVzdWx0LmFjY2Vzc0RldGFpbHMuZGVuaWVkRG9jdW1lbnRzfeS7tlxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgICAtIOODpuODvOOCtuODvOOCsOODq+ODvOODlzogJHtyZXN1bHQuYWNjZXNzRGV0YWlscy51c2VyR3JvdXBzLmpvaW4oJywgJyl9XFxuYDtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC5zZWFyY2hSZXN1bHRzKSB7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKuaknOe0oue1kOaenOips+e0sCoqOlxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgICAtIOe3j+aWh+abuOaVsDogJHtyZXN1bHQuc2VhcmNoUmVzdWx0cy50b3RhbERvY3VtZW50c33ku7ZcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjgqLjgq/jgrvjgrnlj6/og706ICR7cmVzdWx0LnNlYXJjaFJlc3VsdHMuYWNjZXNzaWJsZURvY3VtZW50c33ku7ZcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDliLbpmZDmlofmm7g6ICR7cmVzdWx0LnNlYXJjaFJlc3VsdHMucmVzdHJpY3RlZERvY3VtZW50c33ku7ZcXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDmpJzntKLjgq/jgqjjg6o6IFwiJHtyZXN1bHQuc2VhcmNoUmVzdWx0cy5zZWFyY2hRdWVyeX1cIlxcbmA7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQucm9sZURldGFpbHMpIHtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoqSUFN44Ot44O844Or6Kmz57SwKio6XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAgIC0g44Ot44O844Or5ZCNOiAke3Jlc3VsdC5yb2xlRGV0YWlscy5yb2xlTmFtZX1cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDjg53jg6rjgrfjg7zmlbA6ICR7cmVzdWx0LnJvbGVEZXRhaWxzLnBvbGljaWVzLmxlbmd0aH1cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCAgLSDmqKnpmZDmlbA6ICR7cmVzdWx0LnJvbGVEZXRhaWxzLnBlcm1pc3Npb25zLmxlbmd0aH1cXG5gO1xuICAgICAgfVxuXG4gICAgICByZXBvcnQgKz0gYFxcbmA7XG4gICAgfVxuXG4gICAgLy8g5o6o5aWo5LqL6aCFXG4gICAgcmVwb3J0ICs9IGAjIyDmjqjlpajkuovpoIVcXG5cXG5gO1xuICAgIHJlcG9ydCArPSB0aGlzLmdlbmVyYXRlUmVjb21tZW5kYXRpb25zKHJlc3VsdHMpO1xuXG4gICAgcmV0dXJuIHJlcG9ydDtcbiAgfVxuXG4gIC8qKlxuICAgKiDmjqjlpajkuovpoIXjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVSZWNvbW1lbmRhdGlvbnMocmVzdWx0czogTWFwPHN0cmluZywgQWNjZXNzQ29udHJvbFRlc3RSZXN1bHQ+KTogc3RyaW5nIHtcbiAgICBsZXQgcmVjb21tZW5kYXRpb25zID0gJyc7XG4gICAgY29uc3QgZmFpbGVkVGVzdHMgPSBBcnJheS5mcm9tKHJlc3VsdHMudmFsdWVzKCkpLmZpbHRlcihyID0+ICFyLnN1Y2Nlc3MpO1xuXG4gICAgaWYgKGZhaWxlZFRlc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zICs9IGDinIUg5YWo44Gm44Gu44Ki44Kv44K744K55Yi25b6h44OG44K544OI44GM5oiQ5Yqf44GX44G+44GX44Gf44CC54++5Zyo44Gu6Kit5a6a44KS57at5oyB44GX44Gm44GP44Gg44GV44GE44CCXFxuXFxuYDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVjb21tZW5kYXRpb25zICs9IGDku6XkuIvjga7mlLnlloTjgpLmjqjlpajjgZfjgb7jgZk6XFxuXFxuYDtcbiAgICAgIFxuICAgICAgZmFpbGVkVGVzdHMuZm9yRWFjaCh0ZXN0ID0+IHtcbiAgICAgICAgc3dpdGNoICh0ZXN0LnRlc3RJZCkge1xuICAgICAgICAgIGNhc2UgJ2FjY2Vzcy1hdXRob3JpemVkLTAwMSc6XG4gICAgICAgICAgICByZWNvbW1lbmRhdGlvbnMgKz0gYC0gKirmraPlvZPjgarjgqLjgq/jgrvjgrkqKjogT3BlblNlYXJjaOOBruaoqemZkOioreWumuOCkueiuuiqjeOBl+OAgemBqeWIh+OBquODpuODvOOCtuODvOOBjOOCouOCr+OCu+OCueOBp+OBjeOCi+OCiOOBhuiqv+aVtOOBl+OBpuOBj+OBoOOBleOBhFxcbmA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdhY2Nlc3MtdW5hdXRob3JpemVkLTAwMSc6XG4gICAgICAgICAgICByZWNvbW1lbmRhdGlvbnMgKz0gYC0gKirkuI3mraPjgqLjgq/jgrvjgrnpmLLmraIqKjog44K744Kt44Ol44Oq44OG44Kj6Kit5a6a44KS5by35YyW44GX44CB5qip6ZmQ44Gu44Gq44GE44Om44O844K244O844Gu44Ki44Kv44K744K544KS56K65a6f44Gr5ouS5ZCm44GX44Gm44GP44Gg44GV44GEXFxuYDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2FjY2Vzcy1hZG1pbi0wMDEnOlxuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zICs9IGAtICoq566h55CG6ICF5qip6ZmQKio6IOeuoeeQhuiAheODpuODvOOCtuODvOOBruaoqemZkOioreWumuOCkueiuuiqjeOBl+OAgeW/heimgeOBquaWh+abuOOBq+OCouOCr+OCu+OCueOBp+OBjeOCi+OCiOOBhuioreWumuOBl+OBpuOBj+OBoOOBleOBhFxcbmA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdhY2Nlc3MtbXVsdGlncm91cC0wMDEnOlxuICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zICs9IGAtICoq6KSH5pWw44Kw44Or44O844OX5qip6ZmQKio6IOOCsOODq+ODvOODl+aoqemZkOOBrue1seWQiOODreOCuOODg+OCr+OCkueiuuiqjeOBl+OAgemBqeWIh+OBq+WLleS9nOOBmeOCi+OCiOOBhuS/ruato+OBl+OBpuOBj+OBoOOBleOBhFxcbmA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdhY2Nlc3MtaWFtLXJvbGUtMDAxJzpcbiAgICAgICAgICAgIHJlY29tbWVuZGF0aW9ucyArPSBgLSAqKklBTeODreODvOODqyoqOiBJQU3jg63jg7zjg6vjgajjg53jg6rjgrfjg7zjga7oqK3lrprjgpLnorroqo3jgZfjgIHlv4XopoHjgarmqKnpmZDjgYzku5jkuI7jgZXjgozjgabjgYTjgovjgYvnorroqo3jgZfjgabjgY/jgaDjgZXjgYRcXG5gO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlY29tbWVuZGF0aW9ucyArPSBgXFxuIyMjIOOCu+OCreODpeODquODhuOCo+ODmeOCueODiOODl+ODqeOCr+ODhuOCo+OCuVxcblxcbmA7XG4gICAgcmVjb21tZW5kYXRpb25zICs9IGAtIOWumuacn+eahOOBquaoqemZkOebo+afu+OBruWun+aWvVxcbmA7XG4gICAgcmVjb21tZW5kYXRpb25zICs9IGAtIOacgOWwj+aoqemZkOOBruWOn+WJh+OBrumBqeeUqFxcbmA7XG4gICAgcmVjb21tZW5kYXRpb25zICs9IGAtIOOCouOCr+OCu+OCueODreOCsOOBrue2mee2mueahOOBquebo+imllxcbmA7XG4gICAgcmVjb21tZW5kYXRpb25zICs9IGAtIOaoqemZkOWkieabtOaZguOBruW9semfv+ipleS+oVxcbmA7XG5cbiAgICByZXR1cm4gcmVjb21tZW5kYXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIOODquOCveODvOOCueOBruOCr+ODquODvOODs+OCouODg+ODl1xuICAgKi9cbiAgYXN5bmMgY2xlYW51cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+nuSDjgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4jjg6njg7Pjg4rjg7zjgpLjgq/jg6rjg7zjg7PjgqLjg4Pjg5fkuK0uLi4nKTtcbiAgICBhd2FpdCB0aGlzLnRlc3RNb2R1bGUuY2xlYW51cCgpO1xuICAgIGNvbnNvbGUubG9nKCfinIUg44Ki44Kv44K744K55qip6ZmQ44OG44K544OI44Op44Oz44OK44O844Gu44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQWNjZXNzQ29udHJvbFRlc3RSdW5uZXI7Il19