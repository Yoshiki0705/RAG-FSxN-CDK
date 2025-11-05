"use strict";
/**
 * アクセス権限テストモジュール
 *
 * 実本番IAMロールとOpenSearch Serverlessでの権限ベースアクセス制御テスト
 * 文書レベルアクセス権限、グループベース権限システムの検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlTestModule = void 0;
const client_opensearchserverless_1 = require("@aws-sdk/client-opensearchserverless");
const client_iam_1 = require("@aws-sdk/client-iam");
const client_sts_1 = require("@aws-sdk/client-sts");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * アクセス権限テストモジュールクラス
 */
class AccessControlTestModule {
    config;
    openSearchClient;
    iamClient;
    stsClient;
    dynamoClient;
    testUsers;
    testDocuments;
    constructor(config) {
        this.config = config;
        const clientConfig = {
            region: config.region,
            credentials: { profile: config.awsProfile }
        };
        this.openSearchClient = new client_opensearchserverless_1.OpenSearchServerlessClient(clientConfig);
        this.iamClient = new client_iam_1.IAMClient(clientConfig);
        this.stsClient = new client_sts_1.STSClient(clientConfig);
        this.dynamoClient = new client_dynamodb_1.DynamoDBClient(clientConfig);
        // テストユーザーと文書の設定
        this.testUsers = this.loadTestUsers();
        this.testDocuments = this.loadTestDocuments();
    } /**
     *
   テストユーザーの読み込み
     */
    loadTestUsers() {
        return [
            {
                userId: 'test-user-1',
                username: process.env.TEST_USER_1_USERNAME || 'test-user-1',
                groups: ['users', 'readers'],
                permissions: ['read', 'search'],
                expectedAccess: {
                    documents: ['doc-public-001', 'doc-users-001'],
                    operations: ['read', 'search']
                },
                restrictedAccess: {
                    documents: ['doc-admin-001', 'doc-confidential-001'],
                    operations: ['write', 'delete', 'admin']
                }
            },
            {
                userId: 'test-user-2',
                username: process.env.TEST_USER_2_USERNAME || 'test-user-2',
                groups: ['readonly-users'],
                permissions: ['read'],
                expectedAccess: {
                    documents: ['doc-public-001'],
                    operations: ['read']
                },
                restrictedAccess: {
                    documents: ['doc-users-001', 'doc-admin-001', 'doc-confidential-001'],
                    operations: ['write', 'delete', 'search', 'admin']
                }
            },
            {
                userId: 'test-admin-1',
                username: process.env.TEST_ADMIN_1_USERNAME || 'test-admin-1',
                groups: ['admins', 'users'],
                permissions: ['read', 'write', 'delete', 'search', 'admin'],
                expectedAccess: {
                    documents: ['doc-public-001', 'doc-users-001', 'doc-admin-001'],
                    operations: ['read', 'write', 'delete', 'search', 'admin']
                },
                restrictedAccess: {
                    documents: ['doc-confidential-001'], // 最高機密文書は別途権限が必要
                    operations: []
                }
            }
        ];
    }
    /**
     * テスト文書の読み込み
     */
    loadTestDocuments() {
        return [
            {
                documentId: 'doc-public-001',
                documentTitle: 'パブリック文書テスト',
                requiredPermissions: ['read'],
                allowedGroups: ['users', 'readonly-users', 'admins'],
                testUsers: [
                    { userId: 'test-user-1', expectedAccess: true, reason: 'users グループメンバー' },
                    { userId: 'test-user-2', expectedAccess: true, reason: 'readonly-users グループメンバー' },
                    { userId: 'test-admin-1', expectedAccess: true, reason: 'admins グループメンバー' }
                ]
            },
            {
                documentId: 'doc-users-001',
                documentTitle: 'ユーザー限定文書テスト',
                requiredPermissions: ['read', 'search'],
                allowedGroups: ['users', 'admins'],
                testUsers: [
                    { userId: 'test-user-1', expectedAccess: true, reason: 'users グループメンバーで必要権限あり' },
                    { userId: 'test-user-2', expectedAccess: false, reason: 'readonly-users グループで権限不足' },
                    { userId: 'test-admin-1', expectedAccess: true, reason: 'admins グループメンバー' }
                ]
            },
            {
                documentId: 'doc-admin-001',
                documentTitle: '管理者限定文書テスト',
                requiredPermissions: ['admin'],
                allowedGroups: ['admins'],
                testUsers: [
                    { userId: 'test-user-1', expectedAccess: false, reason: 'admin 権限なし' },
                    { userId: 'test-user-2', expectedAccess: false, reason: 'admin 権限なし' },
                    { userId: 'test-admin-1', expectedAccess: true, reason: 'admin 権限あり' }
                ]
            }
        ];
    }
    /**
     * 権限を持つユーザーの文書アクセステスト
     */
    async testAuthorizedDocumentAccess() {
        const testId = 'access-authorized-001';
        const startTime = Date.now();
        console.log('🔐 権限を持つユーザーの文書アクセステストを開始...');
        try {
            const testUser = this.testUsers[0]; // test-user-1
            const testDocument = this.testDocuments[0]; // doc-public-001
            // 実本番OpenSearchでの権限ベース検索テスト
            const searchResult = await this.performAuthorizedSearch(testUser, testDocument);
            // アクセス権限の検証
            const accessResult = await this.verifyDocumentAccess(testUser, testDocument);
            const success = searchResult.hasAccess && accessResult.hasAccess;
            const result = {
                testId,
                testName: '権限を持つユーザーの文書アクセステスト',
                category: 'access-control',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                accessDetails: {
                    hasAccess: accessResult.hasAccess,
                    permissionLevel: accessResult.permissionLevel,
                    allowedResources: testUser.expectedAccess.documents,
                    deniedResources: testUser.restrictedAccess.documents
                },
                userDetails: {
                    userId: testUser.userId,
                    username: testUser.username,
                    groups: testUser.groups,
                    permissions: testUser.permissions
                },
                searchResults: {
                    totalDocuments: searchResult.totalDocuments,
                    accessibleDocuments: searchResult.accessibleDocuments,
                    restrictedDocuments: searchResult.restrictedDocuments,
                    searchQuery: searchResult.searchQuery
                },
                metadata: {
                    testDocument: testDocument.documentId,
                    expectedAccess: true,
                    actualAccess: success,
                    openSearchDomain: this.config.resources.openSearchDomain
                }
            };
            if (success) {
                console.log('✅ 権限を持つユーザーの文書アクセステスト成功');
            }
            else {
                console.error('❌ 権限を持つユーザーの文書アクセステスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 権限アクセステスト実行エラー:', error);
            return {
                testId,
                testName: '権限を持つユーザーの文書アクセステスト',
                category: 'access-control',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 権限を持たないユーザーのアクセス拒否テスト
     */
    async testUnauthorizedDocumentAccess() {
        const testId = 'access-unauthorized-001';
        const startTime = Date.now();
        console.log('🔐 権限を持たないユーザーのアクセス拒否テストを開始...');
        try {
            const testUser = this.testUsers[1]; // test-user-2 (readonly-users)
            const testDocument = this.testDocuments[1]; // doc-users-001 (users グループ限定)
            // 実本番OpenSearchでの権限制限検索テスト
            const searchResult = await this.performUnauthorizedSearch(testUser, testDocument);
            // アクセス拒否の検証
            const accessResult = await this.verifyDocumentAccess(testUser, testDocument);
            const success = !searchResult.hasAccess && !accessResult.hasAccess; // アクセスが拒否されることが期待される
            const result = {
                testId,
                testName: '権限を持たないユーザーのアクセス拒否テスト',
                category: 'access-control',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                accessDetails: {
                    hasAccess: accessResult.hasAccess,
                    permissionLevel: accessResult.permissionLevel,
                    allowedResources: testUser.expectedAccess.documents,
                    deniedResources: testUser.restrictedAccess.documents
                },
                userDetails: {
                    userId: testUser.userId,
                    username: testUser.username,
                    groups: testUser.groups,
                    permissions: testUser.permissions
                },
                searchResults: {
                    totalDocuments: searchResult.totalDocuments,
                    accessibleDocuments: searchResult.accessibleDocuments,
                    restrictedDocuments: searchResult.restrictedDocuments,
                    searchQuery: searchResult.searchQuery
                },
                metadata: {
                    testDocument: testDocument.documentId,
                    expectedAccess: false,
                    actualAccess: !success, // 成功 = アクセス拒否
                    reason: 'readonly-users グループは users 限定文書にアクセス不可'
                }
            };
            if (success) {
                console.log('✅ 権限を持たないユーザーのアクセス拒否テスト成功');
            }
            else {
                console.error('❌ 権限を持たないユーザーのアクセス拒否テスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ アクセス拒否テスト実行エラー:', error);
            return {
                testId,
                testName: '権限を持たないユーザーのアクセス拒否テスト',
                category: 'access-control',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    } /**
  
     * 管理者権限テスト
     */
    async testAdministratorAccess() {
        const testId = 'access-admin-001';
        const startTime = Date.now();
        console.log('🔐 管理者権限テストを開始...');
        try {
            const adminUser = this.testUsers[2]; // test-admin-1
            // 管理者権限での全文書アクセステスト
            const allDocumentsAccessible = [];
            const accessDenied = [];
            for (const testDocument of this.testDocuments) {
                const accessResult = await this.verifyDocumentAccess(adminUser, testDocument);
                if (accessResult.hasAccess) {
                    allDocumentsAccessible.push(testDocument.documentId);
                }
                else {
                    accessDenied.push(testDocument.documentId);
                }
            }
            // 管理者は大部分の文書にアクセス可能であることを確認
            const expectedAccessibleCount = this.testDocuments.length - 1; // 最高機密文書以外
            const success = allDocumentsAccessible.length >= expectedAccessibleCount;
            const result = {
                testId,
                testName: '管理者権限テスト',
                category: 'access-control',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                accessDetails: {
                    hasAccess: success,
                    permissionLevel: 'administrator',
                    allowedResources: allDocumentsAccessible,
                    deniedResources: accessDenied
                },
                userDetails: {
                    userId: adminUser.userId,
                    username: adminUser.username,
                    groups: adminUser.groups,
                    permissions: adminUser.permissions
                },
                metadata: {
                    expectedAccessibleCount,
                    actualAccessibleCount: allDocumentsAccessible.length,
                    totalDocuments: this.testDocuments.length,
                    accessibleDocuments: allDocumentsAccessible,
                    deniedDocuments: accessDenied
                }
            };
            if (success) {
                console.log('✅ 管理者権限テスト成功');
            }
            else {
                console.error('❌ 管理者権限テスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 管理者権限テスト実行エラー:', error);
            return {
                testId,
                testName: '管理者権限テスト',
                category: 'access-control',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 動的権限変更テスト
     */
    async testDynamicPermissionChange() {
        const testId = 'access-dynamic-001';
        const startTime = Date.now();
        console.log('🔐 動的権限変更テストを開始...');
        try {
            const testUser = this.testUsers[0]; // test-user-1
            const testDocument = this.testDocuments[1]; // doc-users-001
            // 1. 初期アクセス状態の確認
            console.log('   1. 初期アクセス状態を確認中...');
            const initialAccess = await this.verifyDocumentAccess(testUser, testDocument);
            // 2. 権限変更のシミュレート（読み取り専用モードでは実際の変更は行わない）
            console.log('   2. 権限変更をシミュレート中...');
            const permissionChangeResult = await this.simulatePermissionChange(testUser, ['read', 'search', 'write']);
            // 3. 変更後のアクセス状態の確認
            console.log('   3. 変更後のアクセス状態を確認中...');
            const updatedAccess = await this.verifyDocumentAccess(testUser, testDocument);
            // 4. 複数グループ権限の統合テスト
            console.log('   4. 複数グループ権限の統合をテスト中...');
            const multiGroupAccess = await this.testMultipleGroupPermissions(testUser);
            const success = initialAccess.hasAccess &&
                permissionChangeResult.success &&
                updatedAccess.hasAccess &&
                multiGroupAccess.success;
            const result = {
                testId,
                testName: '動的権限変更テスト',
                category: 'access-control',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                userDetails: {
                    userId: testUser.userId,
                    username: testUser.username,
                    groups: testUser.groups,
                    permissions: testUser.permissions
                },
                metadata: {
                    initialAccess: initialAccess,
                    permissionChangeResult: permissionChangeResult,
                    updatedAccess: updatedAccess,
                    multiGroupAccess: multiGroupAccess,
                    testDocument: testDocument.documentId
                }
            };
            if (success) {
                console.log('✅ 動的権限変更テスト成功');
            }
            else {
                console.error('❌ 動的権限変更テスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 動的権限変更テスト実行エラー:', error);
            return {
                testId,
                testName: '動的権限変更テスト',
                category: 'access-control',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
exports.AccessControlTestModule = AccessControlTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzLWNvbnRyb2wtdGVzdC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhY2Nlc3MtY29udHJvbC10ZXN0LW1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVILHNGQUk4QztBQUU5QyxvREFNNkI7QUFFN0Isb0RBSTZCO0FBRTdCLDhEQUlrQztBQUdsQyw4RUFBb0Y7QUEyRHBGOztHQUVHO0FBQ0gsTUFBYSx1QkFBdUI7SUFDMUIsTUFBTSxDQUFtQjtJQUN6QixnQkFBZ0IsQ0FBNkI7SUFDN0MsU0FBUyxDQUFZO0lBQ3JCLFNBQVMsQ0FBWTtJQUNyQixZQUFZLENBQWlCO0lBQzdCLFNBQVMsQ0FBd0I7SUFDakMsYUFBYSxDQUEyQjtJQUVoRCxZQUFZLE1BQXdCO1FBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXJCLE1BQU0sWUFBWSxHQUFHO1lBQ25CLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtZQUNyQixXQUFXLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRTtTQUM1QyxDQUFDO1FBRUYsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksd0RBQTBCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDckUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFckQsZ0JBQWdCO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7SUFDaEQsQ0FBQyxDQUFFOzs7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QUFHLEVBQUUsR0FBRyxTQUFTO2dCQUNoQyxPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQzthQUM5RCxDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7Q0FBQTtBQTViSCwwREE0YkciLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOOCouOCr+OCu+OCueaoqemZkOODhuOCueODiOODouOCuOODpeODvOODq1xuICogXG4gKiDlrp/mnKznlapJQU3jg63jg7zjg6vjgahPcGVuU2VhcmNoIFNlcnZlcmxlc3Pjgafjga7mqKnpmZDjg5njg7zjgrnjgqLjgq/jgrvjgrnliLblvqHjg4bjgrnjg4hcbiAqIOaWh+abuOODrOODmeODq+OCouOCr+OCu+OCueaoqemZkOOAgeOCsOODq+ODvOODl+ODmeODvOOCueaoqemZkOOCt+OCueODhuODoOOBruaknOiovFxuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0IHtcbiAgT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQsXG4gIEdldENvbGxlY3Rpb25Db21tYW5kLFxuICBCYXRjaEdldENvbGxlY3Rpb25Db21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1vcGVuc2VhcmNoc2VydmVybGVzcyc7XG5cbmltcG9ydCB7XG4gIElBTUNsaWVudCxcbiAgR2V0Um9sZUNvbW1hbmQsXG4gIExpc3RBdHRhY2hlZFJvbGVQb2xpY2llc0NvbW1hbmQsXG4gIEdldFBvbGljeUNvbW1hbmQsXG4gIFNpbXVsYXRlUHJpbmNpcGFsUG9saWN5Q29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtaWFtJztcblxuaW1wb3J0IHtcbiAgU1RTQ2xpZW50LFxuICBBc3N1bWVSb2xlQ29tbWFuZCxcbiAgR2V0Q2FsbGVySWRlbnRpdHlDb21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zdHMnO1xuXG5pbXBvcnQge1xuICBEeW5hbW9EQkNsaWVudCxcbiAgR2V0SXRlbUNvbW1hbmQsXG4gIFF1ZXJ5Q29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuXG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCB7IFRlc3RSZXN1bHQsIFRlc3RFeGVjdXRpb25TdGF0dXMgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuXG4vKipcbiAqIOOCouOCr+OCu+OCueaoqemZkOODhuOCueODiOe1kOaenOOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFjY2Vzc1Rlc3RSZXN1bHQgZXh0ZW5kcyBUZXN0UmVzdWx0IHtcbiAgYWNjZXNzRGV0YWlscz86IHtcbiAgICBoYXNBY2Nlc3M6IGJvb2xlYW47XG4gICAgcGVybWlzc2lvbkxldmVsOiBzdHJpbmc7XG4gICAgYWxsb3dlZFJlc291cmNlczogc3RyaW5nW107XG4gICAgZGVuaWVkUmVzb3VyY2VzOiBzdHJpbmdbXTtcbiAgfTtcbiAgdXNlckRldGFpbHM/OiB7XG4gICAgdXNlcklkOiBzdHJpbmc7XG4gICAgdXNlcm5hbWU6IHN0cmluZztcbiAgICBncm91cHM6IHN0cmluZ1tdO1xuICAgIHBlcm1pc3Npb25zOiBzdHJpbmdbXTtcbiAgfTtcbiAgc2VhcmNoUmVzdWx0cz86IHtcbiAgICB0b3RhbERvY3VtZW50czogbnVtYmVyO1xuICAgIGFjY2Vzc2libGVEb2N1bWVudHM6IG51bWJlcjtcbiAgICByZXN0cmljdGVkRG9jdW1lbnRzOiBudW1iZXI7XG4gICAgc2VhcmNoUXVlcnk6IHN0cmluZztcbiAgfTtcbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jjg6bjg7zjgrbjg7zmqKnpmZDmg4XloLFcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0VXNlclBlcm1pc3Npb25zIHtcbiAgdXNlcklkOiBzdHJpbmc7XG4gIHVzZXJuYW1lOiBzdHJpbmc7XG4gIGdyb3Vwczogc3RyaW5nW107XG4gIHBlcm1pc3Npb25zOiBzdHJpbmdbXTtcbiAgZXhwZWN0ZWRBY2Nlc3M6IHtcbiAgICBkb2N1bWVudHM6IHN0cmluZ1tdO1xuICAgIG9wZXJhdGlvbnM6IHN0cmluZ1tdO1xuICB9O1xuICByZXN0cmljdGVkQWNjZXNzOiB7XG4gICAgZG9jdW1lbnRzOiBzdHJpbmdbXTtcbiAgICBvcGVyYXRpb25zOiBzdHJpbmdbXTtcbiAgfTtcbn1cblxuLyoqXG4gKiDmlofmm7jjgqLjgq/jgrvjgrnjg4bjgrnjg4jjgrHjg7zjgrlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEb2N1bWVudEFjY2Vzc1Rlc3RDYXNlIHtcbiAgZG9jdW1lbnRJZDogc3RyaW5nO1xuICBkb2N1bWVudFRpdGxlOiBzdHJpbmc7XG4gIHJlcXVpcmVkUGVybWlzc2lvbnM6IHN0cmluZ1tdO1xuICBhbGxvd2VkR3JvdXBzOiBzdHJpbmdbXTtcbiAgdGVzdFVzZXJzOiB7XG4gICAgdXNlcklkOiBzdHJpbmc7XG4gICAgZXhwZWN0ZWRBY2Nlc3M6IGJvb2xlYW47XG4gICAgcmVhc29uOiBzdHJpbmc7XG4gIH1bXTtcbn1cblxuLyoqXG4gKiDjgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjgq/jg6njgrlcbiAqL1xuZXhwb3J0IGNsYXNzIEFjY2Vzc0NvbnRyb2xUZXN0TW9kdWxlIHtcbiAgcHJpdmF0ZSBjb25maWc6IFByb2R1Y3Rpb25Db25maWc7XG4gIHByaXZhdGUgb3BlblNlYXJjaENsaWVudDogT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQ7XG4gIHByaXZhdGUgaWFtQ2xpZW50OiBJQU1DbGllbnQ7XG4gIHByaXZhdGUgc3RzQ2xpZW50OiBTVFNDbGllbnQ7XG4gIHByaXZhdGUgZHluYW1vQ2xpZW50OiBEeW5hbW9EQkNsaWVudDtcbiAgcHJpdmF0ZSB0ZXN0VXNlcnM6IFRlc3RVc2VyUGVybWlzc2lvbnNbXTtcbiAgcHJpdmF0ZSB0ZXN0RG9jdW1lbnRzOiBEb2N1bWVudEFjY2Vzc1Rlc3RDYXNlW107XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgXG4gICAgY29uc3QgY2xpZW50Q29uZmlnID0ge1xuICAgICAgcmVnaW9uOiBjb25maWcucmVnaW9uLFxuICAgICAgY3JlZGVudGlhbHM6IHsgcHJvZmlsZTogY29uZmlnLmF3c1Byb2ZpbGUgfVxuICAgIH07XG5cbiAgICB0aGlzLm9wZW5TZWFyY2hDbGllbnQgPSBuZXcgT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQoY2xpZW50Q29uZmlnKTtcbiAgICB0aGlzLmlhbUNsaWVudCA9IG5ldyBJQU1DbGllbnQoY2xpZW50Q29uZmlnKTtcbiAgICB0aGlzLnN0c0NsaWVudCA9IG5ldyBTVFNDbGllbnQoY2xpZW50Q29uZmlnKTtcbiAgICB0aGlzLmR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudChjbGllbnRDb25maWcpO1xuICAgIFxuICAgIC8vIOODhuOCueODiOODpuODvOOCtuODvOOBqOaWh+abuOOBruioreWumlxuICAgIHRoaXMudGVzdFVzZXJzID0gdGhpcy5sb2FkVGVzdFVzZXJzKCk7XG4gICAgdGhpcy50ZXN0RG9jdW1lbnRzID0gdGhpcy5sb2FkVGVzdERvY3VtZW50cygpO1xuICB9ICAvKipcbiAgICpcbiDjg4bjgrnjg4jjg6bjg7zjgrbjg7zjga7oqq3jgb/ovrzjgb9cbiAgICovXG4gIHByaXZhdGUgbG9hZFRlc3RVc2VycygpOiBUZXN0VXNlclBlcm1pc3Npb25zW10ge1xuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIHVzZXJJZDogJ3Rlc3QtdXNlci0xJyxcbiAgICAgICAgdXNlcm5hbWU6IHByb2Nlc3MuZW52LlRFU1RfVVNFUl8xX1VTRVJOQU1FIHx8ICd0ZXN0LXVzZXItMScsXG4gICAgICAgIGdyb3VwczogWyd1c2VycycsICdyZWFkZXJzJ10sXG4gICAgICAgIHBlcm1pc3Npb25zOiBbJ3JlYWQnLCAnc2VhcmNoJ10sXG4gICAgICAgIGV4cGVjdGVkQWNjZXNzOiB7XG4gICAgICAgICAgZG9jdW1lbnRzOiBbJ2RvYy1wdWJsaWMtMDAxJywgJ2RvYy11c2Vycy0wMDEnXSxcbiAgICAgICAgICBvcGVyYXRpb25zOiBbJ3JlYWQnLCAnc2VhcmNoJ11cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZEFjY2Vzczoge1xuICAgICAgICAgIGRvY3VtZW50czogWydkb2MtYWRtaW4tMDAxJywgJ2RvYy1jb25maWRlbnRpYWwtMDAxJ10sXG4gICAgICAgICAgb3BlcmF0aW9uczogWyd3cml0ZScsICdkZWxldGUnLCAnYWRtaW4nXVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB1c2VySWQ6ICd0ZXN0LXVzZXItMicsXG4gICAgICAgIHVzZXJuYW1lOiBwcm9jZXNzLmVudi5URVNUX1VTRVJfMl9VU0VSTkFNRSB8fCAndGVzdC11c2VyLTInLFxuICAgICAgICBncm91cHM6IFsncmVhZG9ubHktdXNlcnMnXSxcbiAgICAgICAgcGVybWlzc2lvbnM6IFsncmVhZCddLFxuICAgICAgICBleHBlY3RlZEFjY2Vzczoge1xuICAgICAgICAgIGRvY3VtZW50czogWydkb2MtcHVibGljLTAwMSddLFxuICAgICAgICAgIG9wZXJhdGlvbnM6IFsncmVhZCddXG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWRBY2Nlc3M6IHtcbiAgICAgICAgICBkb2N1bWVudHM6IFsnZG9jLXVzZXJzLTAwMScsICdkb2MtYWRtaW4tMDAxJywgJ2RvYy1jb25maWRlbnRpYWwtMDAxJ10sXG4gICAgICAgICAgb3BlcmF0aW9uczogWyd3cml0ZScsICdkZWxldGUnLCAnc2VhcmNoJywgJ2FkbWluJ11cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdXNlcklkOiAndGVzdC1hZG1pbi0xJyxcbiAgICAgICAgdXNlcm5hbWU6IHByb2Nlc3MuZW52LlRFU1RfQURNSU5fMV9VU0VSTkFNRSB8fCAndGVzdC1hZG1pbi0xJyxcbiAgICAgICAgZ3JvdXBzOiBbJ2FkbWlucycsICd1c2VycyddLFxuICAgICAgICBwZXJtaXNzaW9uczogWydyZWFkJywgJ3dyaXRlJywgJ2RlbGV0ZScsICdzZWFyY2gnLCAnYWRtaW4nXSxcbiAgICAgICAgZXhwZWN0ZWRBY2Nlc3M6IHtcbiAgICAgICAgICBkb2N1bWVudHM6IFsnZG9jLXB1YmxpYy0wMDEnLCAnZG9jLXVzZXJzLTAwMScsICdkb2MtYWRtaW4tMDAxJ10sXG4gICAgICAgICAgb3BlcmF0aW9uczogWydyZWFkJywgJ3dyaXRlJywgJ2RlbGV0ZScsICdzZWFyY2gnLCAnYWRtaW4nXVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkQWNjZXNzOiB7XG4gICAgICAgICAgZG9jdW1lbnRzOiBbJ2RvYy1jb25maWRlbnRpYWwtMDAxJ10sIC8vIOacgOmrmOapn+WvhuaWh+abuOOBr+WIpemAlOaoqemZkOOBjOW/heimgVxuICAgICAgICAgIG9wZXJhdGlvbnM6IFtdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIOODhuOCueODiOaWh+abuOOBruiqreOBv+i+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBsb2FkVGVzdERvY3VtZW50cygpOiBEb2N1bWVudEFjY2Vzc1Rlc3RDYXNlW10ge1xuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIGRvY3VtZW50SWQ6ICdkb2MtcHVibGljLTAwMScsXG4gICAgICAgIGRvY3VtZW50VGl0bGU6ICfjg5Hjg5bjg6rjg4Pjgq/mlofmm7jjg4bjgrnjg4gnLFxuICAgICAgICByZXF1aXJlZFBlcm1pc3Npb25zOiBbJ3JlYWQnXSxcbiAgICAgICAgYWxsb3dlZEdyb3VwczogWyd1c2VycycsICdyZWFkb25seS11c2VycycsICdhZG1pbnMnXSxcbiAgICAgICAgdGVzdFVzZXJzOiBbXG4gICAgICAgICAgeyB1c2VySWQ6ICd0ZXN0LXVzZXItMScsIGV4cGVjdGVkQWNjZXNzOiB0cnVlLCByZWFzb246ICd1c2VycyDjgrDjg6vjg7zjg5fjg6Hjg7Pjg5Djg7wnIH0sXG4gICAgICAgICAgeyB1c2VySWQ6ICd0ZXN0LXVzZXItMicsIGV4cGVjdGVkQWNjZXNzOiB0cnVlLCByZWFzb246ICdyZWFkb25seS11c2VycyDjgrDjg6vjg7zjg5fjg6Hjg7Pjg5Djg7wnIH0sXG4gICAgICAgICAgeyB1c2VySWQ6ICd0ZXN0LWFkbWluLTEnLCBleHBlY3RlZEFjY2VzczogdHJ1ZSwgcmVhc29uOiAnYWRtaW5zIOOCsOODq+ODvOODl+ODoeODs+ODkOODvCcgfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBkb2N1bWVudElkOiAnZG9jLXVzZXJzLTAwMScsXG4gICAgICAgIGRvY3VtZW50VGl0bGU6ICfjg6bjg7zjgrbjg7zpmZDlrprmlofmm7jjg4bjgrnjg4gnLFxuICAgICAgICByZXF1aXJlZFBlcm1pc3Npb25zOiBbJ3JlYWQnLCAnc2VhcmNoJ10sXG4gICAgICAgIGFsbG93ZWRHcm91cHM6IFsndXNlcnMnLCAnYWRtaW5zJ10sXG4gICAgICAgIHRlc3RVc2VyczogW1xuICAgICAgICAgIHsgdXNlcklkOiAndGVzdC11c2VyLTEnLCBleHBlY3RlZEFjY2VzczogdHJ1ZSwgcmVhc29uOiAndXNlcnMg44Kw44Or44O844OX44Oh44Oz44OQ44O844Gn5b+F6KaB5qip6ZmQ44GC44KKJyB9LFxuICAgICAgICAgIHsgdXNlcklkOiAndGVzdC11c2VyLTInLCBleHBlY3RlZEFjY2VzczogZmFsc2UsIHJlYXNvbjogJ3JlYWRvbmx5LXVzZXJzIOOCsOODq+ODvOODl+OBp+aoqemZkOS4jei2sycgfSxcbiAgICAgICAgICB7IHVzZXJJZDogJ3Rlc3QtYWRtaW4tMScsIGV4cGVjdGVkQWNjZXNzOiB0cnVlLCByZWFzb246ICdhZG1pbnMg44Kw44Or44O844OX44Oh44Oz44OQ44O8JyB9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGRvY3VtZW50SWQ6ICdkb2MtYWRtaW4tMDAxJyxcbiAgICAgICAgZG9jdW1lbnRUaXRsZTogJ+euoeeQhuiAhemZkOWumuaWh+abuOODhuOCueODiCcsXG4gICAgICAgIHJlcXVpcmVkUGVybWlzc2lvbnM6IFsnYWRtaW4nXSxcbiAgICAgICAgYWxsb3dlZEdyb3VwczogWydhZG1pbnMnXSxcbiAgICAgICAgdGVzdFVzZXJzOiBbXG4gICAgICAgICAgeyB1c2VySWQ6ICd0ZXN0LXVzZXItMScsIGV4cGVjdGVkQWNjZXNzOiBmYWxzZSwgcmVhc29uOiAnYWRtaW4g5qip6ZmQ44Gq44GXJyB9LFxuICAgICAgICAgIHsgdXNlcklkOiAndGVzdC11c2VyLTInLCBleHBlY3RlZEFjY2VzczogZmFsc2UsIHJlYXNvbjogJ2FkbWluIOaoqemZkOOBquOBlycgfSxcbiAgICAgICAgICB7IHVzZXJJZDogJ3Rlc3QtYWRtaW4tMScsIGV4cGVjdGVkQWNjZXNzOiB0cnVlLCByZWFzb246ICdhZG1pbiDmqKnpmZDjgYLjgoonIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICog5qip6ZmQ44KS5oyB44Gk44Om44O844K244O844Gu5paH5pu444Ki44Kv44K744K544OG44K544OIXG4gICAqL1xuICBhc3luYyB0ZXN0QXV0aG9yaXplZERvY3VtZW50QWNjZXNzKCk6IFByb21pc2U8QWNjZXNzVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IHRlc3RJZCA9ICdhY2Nlc3MtYXV0aG9yaXplZC0wMDEnO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/CflJAg5qip6ZmQ44KS5oyB44Gk44Om44O844K244O844Gu5paH5pu444Ki44Kv44K744K544OG44K544OI44KS6ZaL5aeLLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgdGVzdFVzZXIgPSB0aGlzLnRlc3RVc2Vyc1swXTsgLy8gdGVzdC11c2VyLTFcbiAgICAgIGNvbnN0IHRlc3REb2N1bWVudCA9IHRoaXMudGVzdERvY3VtZW50c1swXTsgLy8gZG9jLXB1YmxpYy0wMDFcbiAgICAgIFxuICAgICAgLy8g5a6f5pys55WqT3BlblNlYXJjaOOBp+OBruaoqemZkOODmeODvOOCueaknOe0ouODhuOCueODiFxuICAgICAgY29uc3Qgc2VhcmNoUmVzdWx0ID0gYXdhaXQgdGhpcy5wZXJmb3JtQXV0aG9yaXplZFNlYXJjaCh0ZXN0VXNlciwgdGVzdERvY3VtZW50KTtcbiAgICAgIFxuICAgICAgLy8g44Ki44Kv44K744K55qip6ZmQ44Gu5qSc6Ki8XG4gICAgICBjb25zdCBhY2Nlc3NSZXN1bHQgPSBhd2FpdCB0aGlzLnZlcmlmeURvY3VtZW50QWNjZXNzKHRlc3RVc2VyLCB0ZXN0RG9jdW1lbnQpO1xuICAgICAgXG4gICAgICBjb25zdCBzdWNjZXNzID0gc2VhcmNoUmVzdWx0Lmhhc0FjY2VzcyAmJiBhY2Nlc3NSZXN1bHQuaGFzQWNjZXNzO1xuXG4gICAgICBjb25zdCByZXN1bHQ6IEFjY2Vzc1Rlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfmqKnpmZDjgpLmjIHjgaTjg6bjg7zjgrbjg7zjga7mlofmm7jjgqLjgq/jgrvjgrnjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FjY2Vzcy1jb250cm9sJyxcbiAgICAgICAgc3RhdHVzOiBzdWNjZXNzID8gVGVzdEV4ZWN1dGlvblN0YXR1cy5DT01QTEVURUQgOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgYWNjZXNzRGV0YWlsczoge1xuICAgICAgICAgIGhhc0FjY2VzczogYWNjZXNzUmVzdWx0Lmhhc0FjY2VzcyxcbiAgICAgICAgICBwZXJtaXNzaW9uTGV2ZWw6IGFjY2Vzc1Jlc3VsdC5wZXJtaXNzaW9uTGV2ZWwsXG4gICAgICAgICAgYWxsb3dlZFJlc291cmNlczogdGVzdFVzZXIuZXhwZWN0ZWRBY2Nlc3MuZG9jdW1lbnRzLFxuICAgICAgICAgIGRlbmllZFJlc291cmNlczogdGVzdFVzZXIucmVzdHJpY3RlZEFjY2Vzcy5kb2N1bWVudHNcbiAgICAgICAgfSxcbiAgICAgICAgdXNlckRldGFpbHM6IHtcbiAgICAgICAgICB1c2VySWQ6IHRlc3RVc2VyLnVzZXJJZCxcbiAgICAgICAgICB1c2VybmFtZTogdGVzdFVzZXIudXNlcm5hbWUsXG4gICAgICAgICAgZ3JvdXBzOiB0ZXN0VXNlci5ncm91cHMsXG4gICAgICAgICAgcGVybWlzc2lvbnM6IHRlc3RVc2VyLnBlcm1pc3Npb25zXG4gICAgICAgIH0sXG4gICAgICAgIHNlYXJjaFJlc3VsdHM6IHtcbiAgICAgICAgICB0b3RhbERvY3VtZW50czogc2VhcmNoUmVzdWx0LnRvdGFsRG9jdW1lbnRzLFxuICAgICAgICAgIGFjY2Vzc2libGVEb2N1bWVudHM6IHNlYXJjaFJlc3VsdC5hY2Nlc3NpYmxlRG9jdW1lbnRzLFxuICAgICAgICAgIHJlc3RyaWN0ZWREb2N1bWVudHM6IHNlYXJjaFJlc3VsdC5yZXN0cmljdGVkRG9jdW1lbnRzLFxuICAgICAgICAgIHNlYXJjaFF1ZXJ5OiBzZWFyY2hSZXN1bHQuc2VhcmNoUXVlcnlcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICB0ZXN0RG9jdW1lbnQ6IHRlc3REb2N1bWVudC5kb2N1bWVudElkLFxuICAgICAgICAgIGV4cGVjdGVkQWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGFjdHVhbEFjY2Vzczogc3VjY2VzcyxcbiAgICAgICAgICBvcGVuU2VhcmNoRG9tYWluOiB0aGlzLmNvbmZpZy5yZXNvdXJjZXMub3BlblNlYXJjaERvbWFpblxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIOaoqemZkOOCkuaMgeOBpOODpuODvOOCtuODvOOBruaWh+abuOOCouOCr+OCu+OCueODhuOCueODiOaIkOWKnycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOaoqemZkOOCkuaMgeOBpOODpuODvOOCtuODvOOBruaWh+abuOOCouOCr+OCu+OCueODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDmqKnpmZDjgqLjgq/jgrvjgrnjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn5qip6ZmQ44KS5oyB44Gk44Om44O844K244O844Gu5paH5pu444Ki44Kv44K744K544OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2Nlc3MtY29udHJvbCcsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDmqKnpmZDjgpLmjIHjgZ/jgarjgYTjg6bjg7zjgrbjg7zjga7jgqLjgq/jgrvjgrnmi5LlkKbjg4bjgrnjg4hcbiAgICovXG4gIGFzeW5jIHRlc3RVbmF1dGhvcml6ZWREb2N1bWVudEFjY2VzcygpOiBQcm9taXNlPEFjY2Vzc1Rlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCB0ZXN0SWQgPSAnYWNjZXNzLXVuYXV0aG9yaXplZC0wMDEnO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/CflJAg5qip6ZmQ44KS5oyB44Gf44Gq44GE44Om44O844K244O844Gu44Ki44Kv44K744K55ouS5ZCm44OG44K544OI44KS6ZaL5aeLLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgdGVzdFVzZXIgPSB0aGlzLnRlc3RVc2Vyc1sxXTsgLy8gdGVzdC11c2VyLTIgKHJlYWRvbmx5LXVzZXJzKVxuICAgICAgY29uc3QgdGVzdERvY3VtZW50ID0gdGhpcy50ZXN0RG9jdW1lbnRzWzFdOyAvLyBkb2MtdXNlcnMtMDAxICh1c2VycyDjgrDjg6vjg7zjg5fpmZDlrpopXG4gICAgICBcbiAgICAgIC8vIOWun+acrOeVqk9wZW5TZWFyY2jjgafjga7mqKnpmZDliLbpmZDmpJzntKLjg4bjgrnjg4hcbiAgICAgIGNvbnN0IHNlYXJjaFJlc3VsdCA9IGF3YWl0IHRoaXMucGVyZm9ybVVuYXV0aG9yaXplZFNlYXJjaCh0ZXN0VXNlciwgdGVzdERvY3VtZW50KTtcbiAgICAgIFxuICAgICAgLy8g44Ki44Kv44K744K55ouS5ZCm44Gu5qSc6Ki8XG4gICAgICBjb25zdCBhY2Nlc3NSZXN1bHQgPSBhd2FpdCB0aGlzLnZlcmlmeURvY3VtZW50QWNjZXNzKHRlc3RVc2VyLCB0ZXN0RG9jdW1lbnQpO1xuICAgICAgXG4gICAgICBjb25zdCBzdWNjZXNzID0gIXNlYXJjaFJlc3VsdC5oYXNBY2Nlc3MgJiYgIWFjY2Vzc1Jlc3VsdC5oYXNBY2Nlc3M7IC8vIOOCouOCr+OCu+OCueOBjOaLkuWQpuOBleOCjOOCi+OBk+OBqOOBjOacn+W+heOBleOCjOOCi1xuXG4gICAgICBjb25zdCByZXN1bHQ6IEFjY2Vzc1Rlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfmqKnpmZDjgpLmjIHjgZ/jgarjgYTjg6bjg7zjgrbjg7zjga7jgqLjgq/jgrvjgrnmi5LlkKbjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FjY2Vzcy1jb250cm9sJyxcbiAgICAgICAgc3RhdHVzOiBzdWNjZXNzID8gVGVzdEV4ZWN1dGlvblN0YXR1cy5DT01QTEVURUQgOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgYWNjZXNzRGV0YWlsczoge1xuICAgICAgICAgIGhhc0FjY2VzczogYWNjZXNzUmVzdWx0Lmhhc0FjY2VzcyxcbiAgICAgICAgICBwZXJtaXNzaW9uTGV2ZWw6IGFjY2Vzc1Jlc3VsdC5wZXJtaXNzaW9uTGV2ZWwsXG4gICAgICAgICAgYWxsb3dlZFJlc291cmNlczogdGVzdFVzZXIuZXhwZWN0ZWRBY2Nlc3MuZG9jdW1lbnRzLFxuICAgICAgICAgIGRlbmllZFJlc291cmNlczogdGVzdFVzZXIucmVzdHJpY3RlZEFjY2Vzcy5kb2N1bWVudHNcbiAgICAgICAgfSxcbiAgICAgICAgdXNlckRldGFpbHM6IHtcbiAgICAgICAgICB1c2VySWQ6IHRlc3RVc2VyLnVzZXJJZCxcbiAgICAgICAgICB1c2VybmFtZTogdGVzdFVzZXIudXNlcm5hbWUsXG4gICAgICAgICAgZ3JvdXBzOiB0ZXN0VXNlci5ncm91cHMsXG4gICAgICAgICAgcGVybWlzc2lvbnM6IHRlc3RVc2VyLnBlcm1pc3Npb25zXG4gICAgICAgIH0sXG4gICAgICAgIHNlYXJjaFJlc3VsdHM6IHtcbiAgICAgICAgICB0b3RhbERvY3VtZW50czogc2VhcmNoUmVzdWx0LnRvdGFsRG9jdW1lbnRzLFxuICAgICAgICAgIGFjY2Vzc2libGVEb2N1bWVudHM6IHNlYXJjaFJlc3VsdC5hY2Nlc3NpYmxlRG9jdW1lbnRzLFxuICAgICAgICAgIHJlc3RyaWN0ZWREb2N1bWVudHM6IHNlYXJjaFJlc3VsdC5yZXN0cmljdGVkRG9jdW1lbnRzLFxuICAgICAgICAgIHNlYXJjaFF1ZXJ5OiBzZWFyY2hSZXN1bHQuc2VhcmNoUXVlcnlcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICB0ZXN0RG9jdW1lbnQ6IHRlc3REb2N1bWVudC5kb2N1bWVudElkLFxuICAgICAgICAgIGV4cGVjdGVkQWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBhY3R1YWxBY2Nlc3M6ICFzdWNjZXNzLCAvLyDmiJDlip8gPSDjgqLjgq/jgrvjgrnmi5LlkKZcbiAgICAgICAgICByZWFzb246ICdyZWFkb25seS11c2VycyDjgrDjg6vjg7zjg5fjga8gdXNlcnMg6ZmQ5a6a5paH5pu444Gr44Ki44Kv44K744K55LiN5Y+vJ1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIOaoqemZkOOCkuaMgeOBn+OBquOBhOODpuODvOOCtuODvOOBruOCouOCr+OCu+OCueaLkuWQpuODhuOCueODiOaIkOWKnycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOaoqemZkOOCkuaMgeOBn+OBquOBhOODpuODvOOCtuODvOOBruOCouOCr+OCu+OCueaLkuWQpuODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjgqLjgq/jgrvjgrnmi5LlkKbjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn5qip6ZmQ44KS5oyB44Gf44Gq44GE44Om44O844K244O844Gu44Ki44Kv44K744K55ouS5ZCm44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2Nlc3MtY29udHJvbCcsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfSAgLyoqXG5cbiAgICog566h55CG6ICF5qip6ZmQ44OG44K544OIXG4gICAqL1xuICBhc3luYyB0ZXN0QWRtaW5pc3RyYXRvckFjY2VzcygpOiBQcm9taXNlPEFjY2Vzc1Rlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCB0ZXN0SWQgPSAnYWNjZXNzLWFkbWluLTAwMSc7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygn8J+UkCDnrqHnkIbogIXmqKnpmZDjg4bjgrnjg4jjgpLplovlp4suLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhZG1pblVzZXIgPSB0aGlzLnRlc3RVc2Vyc1syXTsgLy8gdGVzdC1hZG1pbi0xXG4gICAgICBcbiAgICAgIC8vIOeuoeeQhuiAheaoqemZkOOBp+OBruWFqOaWh+abuOOCouOCr+OCu+OCueODhuOCueODiFxuICAgICAgY29uc3QgYWxsRG9jdW1lbnRzQWNjZXNzaWJsZSA9IFtdO1xuICAgICAgY29uc3QgYWNjZXNzRGVuaWVkID0gW107XG5cbiAgICAgIGZvciAoY29uc3QgdGVzdERvY3VtZW50IG9mIHRoaXMudGVzdERvY3VtZW50cykge1xuICAgICAgICBjb25zdCBhY2Nlc3NSZXN1bHQgPSBhd2FpdCB0aGlzLnZlcmlmeURvY3VtZW50QWNjZXNzKGFkbWluVXNlciwgdGVzdERvY3VtZW50KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChhY2Nlc3NSZXN1bHQuaGFzQWNjZXNzKSB7XG4gICAgICAgICAgYWxsRG9jdW1lbnRzQWNjZXNzaWJsZS5wdXNoKHRlc3REb2N1bWVudC5kb2N1bWVudElkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhY2Nlc3NEZW5pZWQucHVzaCh0ZXN0RG9jdW1lbnQuZG9jdW1lbnRJZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8g566h55CG6ICF44Gv5aSn6YOo5YiG44Gu5paH5pu444Gr44Ki44Kv44K744K55Y+v6IO944Gn44GC44KL44GT44Go44KS56K66KqNXG4gICAgICBjb25zdCBleHBlY3RlZEFjY2Vzc2libGVDb3VudCA9IHRoaXMudGVzdERvY3VtZW50cy5sZW5ndGggLSAxOyAvLyDmnIDpq5jmqZ/lr4bmlofmm7jku6XlpJZcbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhbGxEb2N1bWVudHNBY2Nlc3NpYmxlLmxlbmd0aCA+PSBleHBlY3RlZEFjY2Vzc2libGVDb3VudDtcblxuICAgICAgY29uc3QgcmVzdWx0OiBBY2Nlc3NUZXN0UmVzdWx0ID0ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn566h55CG6ICF5qip6ZmQ44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2Nlc3MtY29udHJvbCcsXG4gICAgICAgIHN0YXR1czogc3VjY2VzcyA/IFRlc3RFeGVjdXRpb25TdGF0dXMuQ09NUExFVEVEIDogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgIGFjY2Vzc0RldGFpbHM6IHtcbiAgICAgICAgICBoYXNBY2Nlc3M6IHN1Y2Nlc3MsXG4gICAgICAgICAgcGVybWlzc2lvbkxldmVsOiAnYWRtaW5pc3RyYXRvcicsXG4gICAgICAgICAgYWxsb3dlZFJlc291cmNlczogYWxsRG9jdW1lbnRzQWNjZXNzaWJsZSxcbiAgICAgICAgICBkZW5pZWRSZXNvdXJjZXM6IGFjY2Vzc0RlbmllZFxuICAgICAgICB9LFxuICAgICAgICB1c2VyRGV0YWlsczoge1xuICAgICAgICAgIHVzZXJJZDogYWRtaW5Vc2VyLnVzZXJJZCxcbiAgICAgICAgICB1c2VybmFtZTogYWRtaW5Vc2VyLnVzZXJuYW1lLFxuICAgICAgICAgIGdyb3VwczogYWRtaW5Vc2VyLmdyb3VwcyxcbiAgICAgICAgICBwZXJtaXNzaW9uczogYWRtaW5Vc2VyLnBlcm1pc3Npb25zXG4gICAgICAgIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgZXhwZWN0ZWRBY2Nlc3NpYmxlQ291bnQsXG4gICAgICAgICAgYWN0dWFsQWNjZXNzaWJsZUNvdW50OiBhbGxEb2N1bWVudHNBY2Nlc3NpYmxlLmxlbmd0aCxcbiAgICAgICAgICB0b3RhbERvY3VtZW50czogdGhpcy50ZXN0RG9jdW1lbnRzLmxlbmd0aCxcbiAgICAgICAgICBhY2Nlc3NpYmxlRG9jdW1lbnRzOiBhbGxEb2N1bWVudHNBY2Nlc3NpYmxlLFxuICAgICAgICAgIGRlbmllZERvY3VtZW50czogYWNjZXNzRGVuaWVkXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg566h55CG6ICF5qip6ZmQ44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg566h55CG6ICF5qip6ZmQ44OG44K544OI5aSx5pWXJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOeuoeeQhuiAheaoqemZkOODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfnrqHnkIbogIXmqKnpmZDjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FjY2Vzcy1jb250cm9sJyxcbiAgICAgICAgc3RhdHVzOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOWLleeahOaoqemZkOWkieabtOODhuOCueODiFxuICAgKi9cbiAgYXN5bmMgdGVzdER5bmFtaWNQZXJtaXNzaW9uQ2hhbmdlKCk6IFByb21pc2U8QWNjZXNzVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IHRlc3RJZCA9ICdhY2Nlc3MtZHluYW1pYy0wMDEnO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/CflJAg5YuV55qE5qip6ZmQ5aSJ5pu044OG44K544OI44KS6ZaL5aeLLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgdGVzdFVzZXIgPSB0aGlzLnRlc3RVc2Vyc1swXTsgLy8gdGVzdC11c2VyLTFcbiAgICAgIGNvbnN0IHRlc3REb2N1bWVudCA9IHRoaXMudGVzdERvY3VtZW50c1sxXTsgLy8gZG9jLXVzZXJzLTAwMVxuXG4gICAgICAvLyAxLiDliJ3mnJ/jgqLjgq/jgrvjgrnnirbmhYvjga7norroqo1cbiAgICAgIGNvbnNvbGUubG9nKCcgICAxLiDliJ3mnJ/jgqLjgq/jgrvjgrnnirbmhYvjgpLnorroqo3kuK0uLi4nKTtcbiAgICAgIGNvbnN0IGluaXRpYWxBY2Nlc3MgPSBhd2FpdCB0aGlzLnZlcmlmeURvY3VtZW50QWNjZXNzKHRlc3RVc2VyLCB0ZXN0RG9jdW1lbnQpO1xuXG4gICAgICAvLyAyLiDmqKnpmZDlpInmm7Tjga7jgrfjg5/jg6Xjg6zjg7zjg4jvvIjoqq3jgb/lj5bjgorlsILnlKjjg6Ljg7zjg4njgafjga/lrp/pmpvjga7lpInmm7Tjga/ooYzjgo/jgarjgYTvvIlcbiAgICAgIGNvbnNvbGUubG9nKCcgICAyLiDmqKnpmZDlpInmm7TjgpLjgrfjg5/jg6Xjg6zjg7zjg4jkuK0uLi4nKTtcbiAgICAgIGNvbnN0IHBlcm1pc3Npb25DaGFuZ2VSZXN1bHQgPSBhd2FpdCB0aGlzLnNpbXVsYXRlUGVybWlzc2lvbkNoYW5nZSh0ZXN0VXNlciwgWydyZWFkJywgJ3NlYXJjaCcsICd3cml0ZSddKTtcblxuICAgICAgLy8gMy4g5aSJ5pu05b6M44Gu44Ki44Kv44K744K554q25oWL44Gu56K66KqNXG4gICAgICBjb25zb2xlLmxvZygnICAgMy4g5aSJ5pu05b6M44Gu44Ki44Kv44K744K554q25oWL44KS56K66KqN5LitLi4uJyk7XG4gICAgICBjb25zdCB1cGRhdGVkQWNjZXNzID0gYXdhaXQgdGhpcy52ZXJpZnlEb2N1bWVudEFjY2Vzcyh0ZXN0VXNlciwgdGVzdERvY3VtZW50KTtcblxuICAgICAgLy8gNC4g6KSH5pWw44Kw44Or44O844OX5qip6ZmQ44Gu57Wx5ZCI44OG44K544OIXG4gICAgICBjb25zb2xlLmxvZygnICAgNC4g6KSH5pWw44Kw44Or44O844OX5qip6ZmQ44Gu57Wx5ZCI44KS44OG44K544OI5LitLi4uJyk7XG4gICAgICBjb25zdCBtdWx0aUdyb3VwQWNjZXNzID0gYXdhaXQgdGhpcy50ZXN0TXVsdGlwbGVHcm91cFBlcm1pc3Npb25zKHRlc3RVc2VyKTtcblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IGluaXRpYWxBY2Nlc3MuaGFzQWNjZXNzICYmIFxuICAgICAgICAgICAgICAgICAgICAgcGVybWlzc2lvbkNoYW5nZVJlc3VsdC5zdWNjZXNzICYmIFxuICAgICAgICAgICAgICAgICAgICAgdXBkYXRlZEFjY2Vzcy5oYXNBY2Nlc3MgJiZcbiAgICAgICAgICAgICAgICAgICAgIG11bHRpR3JvdXBBY2Nlc3Muc3VjY2VzcztcblxuICAgICAgY29uc3QgcmVzdWx0OiBBY2Nlc3NUZXN0UmVzdWx0ID0ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn5YuV55qE5qip6ZmQ5aSJ5pu044OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2Nlc3MtY29udHJvbCcsXG4gICAgICAgIHN0YXR1czogc3VjY2VzcyA/IFRlc3RFeGVjdXRpb25TdGF0dXMuQ09NUExFVEVEIDogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgIHVzZXJEZXRhaWxzOiB7XG4gICAgICAgICAgdXNlcklkOiB0ZXN0VXNlci51c2VySWQsXG4gICAgICAgICAgdXNlcm5hbWU6IHRlc3RVc2VyLnVzZXJuYW1lLFxuICAgICAgICAgIGdyb3VwczogdGVzdFVzZXIuZ3JvdXBzLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiB0ZXN0VXNlci5wZXJtaXNzaW9uc1xuICAgICAgICB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGluaXRpYWxBY2Nlc3M6IGluaXRpYWxBY2Nlc3MsXG4gICAgICAgICAgcGVybWlzc2lvbkNoYW5nZVJlc3VsdDogcGVybWlzc2lvbkNoYW5nZVJlc3VsdCxcbiAgICAgICAgICB1cGRhdGVkQWNjZXNzOiB1cGRhdGVkQWNjZXNzLFxuICAgICAgICAgIG11bHRpR3JvdXBBY2Nlc3M6IG11bHRpR3JvdXBBY2Nlc3MsXG4gICAgICAgICAgdGVzdERvY3VtZW50OiB0ZXN0RG9jdW1lbnQuZG9jdW1lbnRJZFxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIOWLleeahOaoqemZkOWkieabtOODhuOCueODiOaIkOWKnycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOWLleeahOaoqemZkOWkieabtOODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDli5XnmoTmqKnpmZDlpInmm7Tjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn5YuV55qE5qip6ZmQ5aSJ5pu044OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2Nlc3MtY29udHJvbCcsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfSJdfQ==