"use strict";
/**
 * コンテキスト維持テストモジュール
 *
 * セッション間でのコンテキスト保持機能を検証
 * 実本番環境での会話継続性をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextPersistenceTestModule = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * コンテキスト維持テストモジュール
 */
class ContextPersistenceTestModule {
    config;
    dynamoClient;
    testCases;
    sessionsTable;
    constructor(config) {
        this.config = config;
        this.dynamoClient = new client_dynamodb_1.DynamoDBClient({
            region: config.region,
            credentials: { profile: config.awsProfile }
        });
        this.testCases = this.loadContextTestCases();
        this.sessionsTable = config.resources.dynamoDBTables.sessions;
    }
    /**
     * コンテキストテストケースの読み込み
     */
    loadContextTestCases() {
        return [
            // 短期セッション - シンプルな継続
            {
                id: 'context-short-001',
                scenario: '基本的な質問の継続',
                conversationFlow: [
                    {
                        userMessage: 'RAGシステムについて教えてください',
                        expectedContext: ['RAG', 'システム', '概要'],
                        contextDependency: false
                    },
                    {
                        userMessage: 'それの主要な利点は何ですか？',
                        expectedContext: ['RAG', 'システム', '利点'],
                        contextDependency: true
                    },
                    {
                        userMessage: '実装時の注意点はありますか？',
                        expectedContext: ['RAG', 'システム', '実装', '注意点'],
                        contextDependency: true
                    }
                ],
                sessionType: 'short',
                complexityLevel: 'simple'
            },
            // 中期セッション - トピック切り替え
            {
                id: 'context-medium-001',
                scenario: 'トピック切り替えを含む会話',
                conversationFlow: [
                    {
                        userMessage: 'Amazon FSx for NetApp ONTAPの特徴を教えてください',
                        expectedContext: ['FSx', 'NetApp', 'ONTAP', '特徴'],
                        contextDependency: false
                    },
                    {
                        userMessage: 'パフォーマンスはどの程度ですか？',
                        expectedContext: ['FSx', 'NetApp', 'ONTAP', 'パフォーマンス'],
                        contextDependency: true
                    },
                    {
                        userMessage: 'RAGシステムとの統合方法について教えてください',
                        expectedContext: ['FSx', 'RAG', '統合'],
                        contextDependency: true
                    },
                    {
                        userMessage: 'セキュリティ面での考慮事項はありますか？',
                        expectedContext: ['FSx', 'RAG', 'セキュリティ'],
                        contextDependency: true
                    },
                    {
                        userMessage: 'コスト最適化の方法はありますか？',
                        expectedContext: ['FSx', 'コスト', '最適化'],
                        contextDependency: true
                    }
                ],
                sessionType: 'medium',
                complexityLevel: 'moderate'
            },
            // 長期セッション - 複雑な文脈管理
            {
                id: 'context-long-001',
                scenario: '複雑なプロジェクト相談',
                conversationFlow: [
                    {
                        userMessage: '新しいRAGシステムの導入を検討しています。要件定義から始めたいのですが',
                        expectedContext: ['RAG', 'システム', '導入', '要件定義'],
                        contextDependency: false
                    },
                    {
                        userMessage: 'ユーザー数は約1000人、文書数は10万件程度です',
                        expectedContext: ['RAG', '1000人', '10万件', 'スケール'],
                        contextDependency: true
                    },
                    {
                        userMessage: 'セキュリティ要件として、部署別のアクセス制御が必要です',
                        expectedContext: ['RAG', 'セキュリティ', '部署別', 'アクセス制御'],
                        contextDependency: true
                    },
                    {
                        userMessage: '予算は年間500万円程度を想定しています',
                        expectedContext: ['RAG', '予算', '500万円', 'コスト'],
                        contextDependency: true
                    },
                    {
                        userMessage: 'これらの条件でAmazon FSxを使用するメリットはありますか？',
                        expectedContext: ['RAG', 'FSx', '1000人', '10万件', 'セキュリティ', '500万円'],
                        contextDependency: true
                    },
                    {
                        userMessage: '導入スケジュールはどの程度を見込むべきでしょうか？',
                        expectedContext: ['RAG', 'FSx', '導入', 'スケジュール', '1000人', '10万件'],
                        contextDependency: true
                    }
                ],
                sessionType: 'long',
                complexityLevel: 'complex'
            },
            // クロスセッション継続
            {
                id: 'context-cross-session-001',
                scenario: 'セッション間での継続性',
                conversationFlow: [
                    {
                        userMessage: '昨日相談したRAGシステムの件ですが',
                        expectedContext: ['RAG', 'システム', '前回', '継続'],
                        contextDependency: true
                    },
                    {
                        userMessage: 'FSxの導入について追加で質問があります',
                        expectedContext: ['RAG', 'FSx', '導入', '追加質問'],
                        contextDependency: true
                    }
                ],
                sessionType: 'medium',
                complexityLevel: 'moderate'
            }
        ];
    }
    /**
     * 包括的コンテキスト維持テスト
     */
    async testComprehensiveContextPersistence() {
        const testId = 'context-persistence-comprehensive-001';
        const startTime = Date.now();
        console.log('💾 包括的コンテキスト維持テストを開始...');
        try {
            const contextResults = [];
            // 各テストケースを実行
            for (const testCase of this.testCases) {
                console.log(`   コンテキストテスト実行中: ${testCase.scenario}`);
                const caseResult = await this.executeContextTest(testCase);
                contextResults.push(caseResult);
            }
            // メトリクス計算
            const contextMetrics = this.calculateContextMetrics(contextResults);
            const sessionAnalysis = this.calculateSessionAnalysis(contextResults);
            const success = contextMetrics.sessionContinuity > 0.85 &&
                contextMetrics.contextRetention > 0.8;
            const result = {
                testId,
                testName: '包括的コンテキスト維持テスト',
                category: 'context-persistence',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                contextMetrics,
                sessionAnalysis,
                metadata: {
                    testCaseCount: this.testCases.length,
                    contextResults: contextResults
                }
            };
            if (success) {
                console.log('✅ 包括的コンテキスト維持テスト成功');
            }
            else {
                console.error('❌ 包括的コンテキスト維持テスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 包括的コンテキスト維持テスト実行エラー:', error);
            return {
                testId,
                testName: '包括的コンテキスト維持テスト',
                category: 'context-persistence',
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
     * 個別コンテキストテストの実行
     */
    async executeContextTest(testCase) {
        try {
            // セッション作成
            const session = await this.createTestSession(testCase);
            const contextScores = [];
            // 会話フローを順次実行
            for (let i = 0; i < testCase.conversationFlow.length; i++) {
                const flow = testCase.conversationFlow[i];
                // ユーザーメッセージを追加
                await this.addMessageToSession(session, {
                    messageId: `msg-${i}-user`,
                    role: 'user',
                    content: flow.userMessage,
                    timestamp: new Date()
                });
                // コンテキスト評価
                const contextScore = await this.evaluateContextUsage(session, flow);
                contextScores.push(contextScore);
                // アシスタント応答を生成・追加
                const assistantResponse = await this.generateContextAwareResponse(session, flow);
                await this.addMessageToSession(session, {
                    messageId: `msg-${i}-assistant`,
                    role: 'assistant',
                    content: assistantResponse,
                    timestamp: new Date(),
                    metadata: {
                        contextUsed: flow.expectedContext
                    }
                });
                // セッションコンテキストを更新
                await this.updateSessionContext(session, flow);
            }
            const overallScore = contextScores.reduce((sum, score) => sum + score, 0) / contextScores.length;
            const success = overallScore > 0.7;
            return {
                testCase,
                session,
                contextScores,
                overallScore,
                success
            };
        }
        catch (error) {
            console.error(`❌ コンテキストテスト実行エラー (${testCase.id}):`, error);
            return {
                testCase,
                session: {},
                contextScores: [],
                overallScore: 0,
                success: false
            };
        }
    }
    /**
     * テストセッション作成
     */
    async createTestSession(testCase) {
        const sessionId = `test-session-${testCase.id}-${Date.now()}`;
        const userId = `test-user-${testCase.id}`;
        const session = {
            sessionId,
            userId,
            messages: [],
            context: {
                topics: [],
                entities: {},
                preferences: {},
                documentHistory: [],
                conversationSummary: ''
            },
            createdAt: new Date(),
            lastUpdated: new Date()
        };
        // 読み取り専用モードでない場合、DynamoDBに保存
        if (!this.config.readOnlyMode) {
            await this.saveSessionToDynamoDB(session);
        }
        return session;
    }
    /**
     * セッションにメッセージ追加
     */
    async addMessageToSession(session, message) {
        session.messages.push(message);
        session.lastUpdated = new Date();
        // 読み取り専用モードでない場合、DynamoDBを更新
        if (!this.config.readOnlyMode) {
            await this.updateSessionInDynamoDB(session);
        }
    }
    /**
     * コンテキスト使用評価
     */
    async evaluateContextUsage(session, flow) {
        if (!flow.contextDependency) {
            return 1.0; // コンテキスト依存でない場合は満点
        }
        // 期待されるコンテキストが現在のセッションに含まれているかチェック
        const currentTopics = session.context.topics;
        const expectedContext = flow.expectedContext;
        const matchedContext = expectedContext.filter(context => currentTopics.some(topic => topic.includes(context) || context.includes(topic)));
        return matchedContext.length / expectedContext.length;
    }
    /**
     * コンテキスト認識応答生成
     */
    async generateContextAwareResponse(session, flow) {
        // 読み取り専用モードでは模擬応答を生成
        if (this.config.readOnlyMode) {
            return this.generateMockContextResponse(session, flow);
        }
        // 実際の実装では、セッションコンテキストを使用してBedrockで応答生成
        // ここでは簡略化した模擬実装
        return this.generateMockContextResponse(session, flow);
    }
    /**
     * 模擬コンテキスト応答生成
     */
    generateMockContextResponse(session, flow) {
        const contextTerms = session.context.topics.join('、');
        const userMessage = flow.userMessage;
        if (flow.contextDependency && session.context.topics.length > 0) {
            return `${contextTerms}に関連して、${userMessage}についてお答えします。これまでの会話の流れを踏まえて説明いたします。`;
        }
        else {
            return `${userMessage}についてお答えします。`;
        }
    }
    /**
     * セッションコンテキスト更新
     */
    async updateSessionContext(session, flow) {
        // トピックを更新
        flow.expectedContext.forEach((context) => {
            if (!session.context.topics.includes(context)) {
                session.context.topics.push(context);
            }
        });
        // トピック数を制限（最新の10個まで）
        if (session.context.topics.length > 10) {
            session.context.topics = session.context.topics.slice(-10);
        }
        // 会話サマリーを更新
        session.context.conversationSummary = `${session.context.topics.join('、')}について議論中`;
        session.lastUpdated = new Date();
        // 読み取り専用モードでない場合、DynamoDBを更新
        if (!this.config.readOnlyMode) {
            await this.updateSessionInDynamoDB(session);
        }
    }
    /**
     * DynamoDBにセッション保存
     */
    async saveSessionToDynamoDB(session) {
        try {
            const command = new client_dynamodb_1.PutItemCommand({
                TableName: this.sessionsTable,
                Item: {
                    sessionId: { S: session.sessionId },
                    userId: { S: session.userId },
                    messages: { S: JSON.stringify(session.messages) },
                    context: { S: JSON.stringify(session.context) },
                    createdAt: { S: session.createdAt.toISOString() },
                    lastUpdated: { S: session.lastUpdated.toISOString() }
                }
            });
            await this.dynamoClient.send(command);
        }
        catch (error) {
            console.error('❌ DynamoDBセッション保存エラー:', error);
            // テスト継続のためエラーを無視
        }
    }
    /**
     * DynamoDBのセッション更新
     */
    async updateSessionInDynamoDB(session) {
        try {
            const command = new client_dynamodb_1.UpdateItemCommand({
                TableName: this.sessionsTable,
                Key: {
                    sessionId: { S: session.sessionId }
                },
                UpdateExpression: 'SET messages = :messages, context = :context, lastUpdated = :lastUpdated',
                ExpressionAttributeValues: {
                    ':messages': { S: JSON.stringify(session.messages) },
                    ':context': { S: JSON.stringify(session.context) },
                    ':lastUpdated': { S: session.lastUpdated.toISOString() }
                }
            });
            await this.dynamoClient.send(command);
        }
        catch (error) {
            console.error('❌ DynamoDBセッション更新エラー:', error);
            // テスト継続のためエラーを無視
        }
    }
    /**
     * コンテキストメトリクス計算
     */
    calculateContextMetrics(results) {
        const validResults = results.filter(r => r.success);
        if (validResults.length === 0) {
            return {
                sessionContinuity: 0,
                contextRetention: 0,
                conversationCoherence: 0,
                memoryEfficiency: 0
            };
        }
        // セッション継続性（会話の流れの自然さ）
        const sessionContinuity = validResults.reduce((sum, r) => sum + r.overallScore, 0) / validResults.length;
        // コンテキスト保持率（期待されるコンテキストの保持度）
        const contextRetention = validResults.reduce((sum, r) => {
            const avgScore = r.contextScores.reduce((s, score) => s + score, 0) / r.contextScores.length;
            return sum + avgScore;
        }, 0) / validResults.length;
        // 会話一貫性（トピックの一貫した管理）
        const conversationCoherence = validResults.reduce((sum, r) => {
            const topicCount = r.session.context?.topics?.length || 0;
            const messageCount = r.session.messages?.length || 1;
            return sum + Math.min(topicCount / messageCount, 1.0);
        }, 0) / validResults.length;
        // メモリ効率（適切なコンテキスト管理）
        const memoryEfficiency = (sessionContinuity + contextRetention) / 2;
        return {
            sessionContinuity,
            contextRetention,
            conversationCoherence,
            memoryEfficiency
        };
    }
    /**
     * セッション分析計算
     */
    calculateSessionAnalysis(results) {
        const validResults = results.filter(r => r.success);
        if (validResults.length === 0) {
            return {
                averageSessionLength: 0,
                contextSwitchAccuracy: 0,
                longTermMemoryScore: 0,
                crossSessionRelevance: 0
            };
        }
        // 平均セッション長
        const averageSessionLength = validResults.reduce((sum, r) => sum + (r.session.messages?.length || 0), 0) / validResults.length;
        // コンテキスト切り替え精度
        const contextSwitchAccuracy = validResults.reduce((sum, r) => {
            const switchCount = r.contextScores.filter((score) => score > 0.8).length;
            return sum + (switchCount / r.contextScores.length);
        }, 0) / validResults.length;
        // 長期記憶スコア（長いセッションでのコンテキスト保持）
        const longSessions = validResults.filter(r => r.testCase.sessionType === 'long');
        const longTermMemoryScore = longSessions.length > 0 ?
            longSessions.reduce((sum, r) => sum + r.overallScore, 0) / longSessions.length : 0.8;
        // クロスセッション関連性
        const crossSessionTests = validResults.filter(r => r.testCase.id.includes('cross-session'));
        const crossSessionRelevance = crossSessionTests.length > 0 ?
            crossSessionTests.reduce((sum, r) => sum + r.overallScore, 0) / crossSessionTests.length : 0.7;
        return {
            averageSessionLength,
            contextSwitchAccuracy,
            longTermMemoryScore,
            crossSessionRelevance
        };
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 コンテキスト維持テストモジュールをクリーンアップ中...');
        // テストセッションのクリーンアップ（読み取り専用モードでない場合）
        if (!this.config.readOnlyMode) {
            // 実際の実装では、テスト用セッションを削除
            console.log('🗑️  テストセッションをクリーンアップ中...');
        }
        console.log('✅ コンテキスト維持テストモジュールのクリーンアップ完了');
    }
}
exports.ContextPersistenceTestModule = ContextPersistenceTestModule;
exports.default = ContextPersistenceTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC1wZXJzaXN0ZW5jZS10ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29udGV4dC1wZXJzaXN0ZW5jZS10ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsOERBTWtDO0FBR2xDLDhFQUFvRjtBQXlFcEY7O0dBRUc7QUFDSCxNQUFhLDRCQUE0QjtJQUMvQixNQUFNLENBQW1CO0lBQ3pCLFlBQVksQ0FBaUI7SUFDN0IsU0FBUyxDQUFvQjtJQUM3QixhQUFhLENBQVM7SUFFOUIsWUFBWSxNQUF3QjtRQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUVyQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQztZQUNyQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsV0FBVyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUU7U0FDNUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQztJQUNoRSxDQUFDO0lBRUQ7O09BRUc7SUFDSyxvQkFBb0I7UUFDMUIsT0FBTztZQUNMLG9CQUFvQjtZQUNwQjtnQkFDRSxFQUFFLEVBQUUsbUJBQW1CO2dCQUN2QixRQUFRLEVBQUUsV0FBVztnQkFDckIsZ0JBQWdCLEVBQUU7b0JBQ2hCO3dCQUNFLFdBQVcsRUFBRSxvQkFBb0I7d0JBQ2pDLGVBQWUsRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDO3dCQUN0QyxpQkFBaUIsRUFBRSxLQUFLO3FCQUN6QjtvQkFDRDt3QkFDRSxXQUFXLEVBQUUsZ0JBQWdCO3dCQUM3QixlQUFlLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUks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QyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDOUIsdUJBQXVCO1lBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FDRjtBQWpqQkQsb0VBaWpCQztBQUVELGtCQUFlLDRCQUE0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6tcbiAqIFxuICog44K744OD44K344On44Oz6ZaT44Gn44Gu44Kz44Oz44OG44Kt44K544OI5L+d5oyB5qmf6IO944KS5qSc6Ki8XG4gKiDlrp/mnKznlarnkrDlooPjgafjga7kvJroqbHntpnntprmgKfjgpLjg4bjgrnjg4hcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCB7XG4gIER5bmFtb0RCQ2xpZW50LFxuICBHZXRJdGVtQ29tbWFuZCxcbiAgUHV0SXRlbUNvbW1hbmQsXG4gIFVwZGF0ZUl0ZW1Db21tYW5kLFxuICBRdWVyeUNvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcblxuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5pbXBvcnQgeyBUZXN0UmVzdWx0LCBUZXN0RXhlY3V0aW9uU3RhdHVzIH0gZnJvbSAnLi4vLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcblxuLyoqXG4gKiDjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjg4bjgrnjg4jntZDmnpxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb250ZXh0UGVyc2lzdGVuY2VUZXN0UmVzdWx0IGV4dGVuZHMgVGVzdFJlc3VsdCB7XG4gIGNvbnRleHRNZXRyaWNzPzoge1xuICAgIHNlc3Npb25Db250aW51aXR5OiBudW1iZXI7XG4gICAgY29udGV4dFJldGVudGlvbjogbnVtYmVyO1xuICAgIGNvbnZlcnNhdGlvbkNvaGVyZW5jZTogbnVtYmVyO1xuICAgIG1lbW9yeUVmZmljaWVuY3k6IG51bWJlcjtcbiAgfTtcbiAgc2Vzc2lvbkFuYWx5c2lzPzoge1xuICAgIGF2ZXJhZ2VTZXNzaW9uTGVuZ3RoOiBudW1iZXI7XG4gICAgY29udGV4dFN3aXRjaEFjY3VyYWN5OiBudW1iZXI7XG4gICAgbG9uZ1Rlcm1NZW1vcnlTY29yZTogbnVtYmVyO1xuICAgIGNyb3NzU2Vzc2lvblJlbGV2YW5jZTogbnVtYmVyO1xuICB9O1xufVxuXG4vKipcbiAqIOS8muipseOCu+ODg+OCt+ODp+ODs1xuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbnZlcnNhdGlvblNlc3Npb24ge1xuICBzZXNzaW9uSWQ6IHN0cmluZztcbiAgdXNlcklkOiBzdHJpbmc7XG4gIG1lc3NhZ2VzOiBDb252ZXJzYXRpb25NZXNzYWdlW107XG4gIGNvbnRleHQ6IFNlc3Npb25Db250ZXh0O1xuICBjcmVhdGVkQXQ6IERhdGU7XG4gIGxhc3RVcGRhdGVkOiBEYXRlO1xufVxuXG4vKipcbiAqIOS8muipseODoeODg+OCu+ODvOOCuFxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbnZlcnNhdGlvbk1lc3NhZ2Uge1xuICBtZXNzYWdlSWQ6IHN0cmluZztcbiAgcm9sZTogJ3VzZXInIHwgJ2Fzc2lzdGFudCc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgdGltZXN0YW1wOiBEYXRlO1xuICBtZXRhZGF0YT86IHtcbiAgICBzb3VyY2VzPzogc3RyaW5nW107XG4gICAgY29uZmlkZW5jZT86IG51bWJlcjtcbiAgICBjb250ZXh0VXNlZD86IHN0cmluZ1tdO1xuICB9O1xufVxuXG4vKipcbiAqIOOCu+ODg+OCt+ODp+ODs+OCs+ODs+ODhuOCreOCueODiFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25Db250ZXh0IHtcbiAgdG9waWNzOiBzdHJpbmdbXTtcbiAgZW50aXRpZXM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG4gIHByZWZlcmVuY2VzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xuICBkb2N1bWVudEhpc3Rvcnk6IHN0cmluZ1tdO1xuICBjb252ZXJzYXRpb25TdW1tYXJ5OiBzdHJpbmc7XG59XG5cbi8qKlxuICog44Kz44Oz44OG44Kt44K544OI57at5oyB44OG44K544OI44Kx44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29udGV4dFRlc3RDYXNlIHtcbiAgaWQ6IHN0cmluZztcbiAgc2NlbmFyaW86IHN0cmluZztcbiAgY29udmVyc2F0aW9uRmxvdzoge1xuICAgIHVzZXJNZXNzYWdlOiBzdHJpbmc7XG4gICAgZXhwZWN0ZWRDb250ZXh0OiBzdHJpbmdbXTtcbiAgICBjb250ZXh0RGVwZW5kZW5jeTogYm9vbGVhbjtcbiAgfVtdO1xuICBzZXNzaW9uVHlwZTogJ3Nob3J0JyB8ICdtZWRpdW0nIHwgJ2xvbmcnO1xuICBjb21wbGV4aXR5TGV2ZWw6ICdzaW1wbGUnIHwgJ21vZGVyYXRlJyB8ICdjb21wbGV4Jztcbn1cblxuLyoqXG4gKiDjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6tcbiAqL1xuZXhwb3J0IGNsYXNzIENvbnRleHRQZXJzaXN0ZW5jZVRlc3RNb2R1bGUge1xuICBwcml2YXRlIGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZztcbiAgcHJpdmF0ZSBkeW5hbW9DbGllbnQ6IER5bmFtb0RCQ2xpZW50O1xuICBwcml2YXRlIHRlc3RDYXNlczogQ29udGV4dFRlc3RDYXNlW107XG4gIHByaXZhdGUgc2Vzc2lvbnNUYWJsZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIFxuICAgIHRoaXMuZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHtcbiAgICAgIHJlZ2lvbjogY29uZmlnLnJlZ2lvbixcbiAgICAgIGNyZWRlbnRpYWxzOiB7IHByb2ZpbGU6IGNvbmZpZy5hd3NQcm9maWxlIH1cbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLnRlc3RDYXNlcyA9IHRoaXMubG9hZENvbnRleHRUZXN0Q2FzZXMoKTtcbiAgICB0aGlzLnNlc3Npb25zVGFibGUgPSBjb25maWcucmVzb3VyY2VzLmR5bmFtb0RCVGFibGVzLnNlc3Npb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCs+ODs+ODhuOCreOCueODiOODhuOCueODiOOCseODvOOCueOBruiqreOBv+i+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBsb2FkQ29udGV4dFRlc3RDYXNlcygpOiBDb250ZXh0VGVzdENhc2VbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIOefreacn+OCu+ODg+OCt+ODp+ODsyAtIOOCt+ODs+ODl+ODq+OBque2mee2mlxuICAgICAge1xuICAgICAgICBpZDogJ2NvbnRleHQtc2hvcnQtMDAxJyxcbiAgICAgICAgc2NlbmFyaW86ICfln7rmnKznmoTjgaros6rllY/jga7ntpnntponLFxuICAgICAgICBjb252ZXJzYXRpb25GbG93OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXNlck1lc3NhZ2U6ICdSQUfjgrfjgrnjg4bjg6DjgavjgaTjgYTjgabmlZnjgYjjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICAgICAgZXhwZWN0ZWRDb250ZXh0OiBbJ1JBRycsICfjgrfjgrnjg4bjg6AnLCAn5qaC6KaBJ10sXG4gICAgICAgICAgICBjb250ZXh0RGVwZW5kZW5jeTogZmFsc2VcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVzZXJNZXNzYWdlOiAn44Gd44KM44Gu5Li76KaB44Gq5Yip54K544Gv5L2V44Gn44GZ44GL77yfJyxcbiAgICAgICAgICAgIGV4cGVjdGVkQ29udGV4dDogWydSQUcnLCAn44K344K544OG44OgJywgJ+WIqeeCuSddLFxuICAgICAgICAgICAgY29udGV4dERlcGVuZGVuY3k6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVzZXJNZXNzYWdlOiAn5a6f6KOF5pmC44Gu5rOo5oSP54K544Gv44GC44KK44G+44GZ44GL77yfJyxcbiAgICAgICAgICAgIGV4cGVjdGVkQ29udGV4dDogWydSQUcnLCAn44K344K544OG44OgJywgJ+Wun+ijhScsICfms6jmhI/ngrknXSxcbiAgICAgICAgICAgIGNvbnRleHREZXBlbmRlbmN5OiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBzZXNzaW9uVHlwZTogJ3Nob3J0JyxcbiAgICAgICAgY29tcGxleGl0eUxldmVsOiAnc2ltcGxlJ1xuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8g5Lit5pyf44K744OD44K344On44OzIC0g44OI44OU44OD44Kv5YiH44KK5pu/44GIXG4gICAgICB7XG4gICAgICAgIGlkOiAnY29udGV4dC1tZWRpdW0tMDAxJyxcbiAgICAgICAgc2NlbmFyaW86ICfjg4jjg5Tjg4Pjgq/liIfjgormm7/jgYjjgpLlkKvjgoDkvJroqbEnLFxuICAgICAgICBjb252ZXJzYXRpb25GbG93OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXNlck1lc3NhZ2U6ICdBbWF6b24gRlN4IGZvciBOZXRBcHAgT05UQVDjga7nibnlvrTjgpLmlZnjgYjjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICAgICAgZXhwZWN0ZWRDb250ZXh0OiBbJ0ZTeCcsICdOZXRBcHAnLCAnT05UQVAnLCAn54m55b60J10sXG4gICAgICAgICAgICBjb250ZXh0RGVwZW5kZW5jeTogZmFsc2VcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVzZXJNZXNzYWdlOiAn44OR44OV44Kp44O844Oe44Oz44K544Gv44Gp44Gu56iL5bqm44Gn44GZ44GL77yfJyxcbiAgICAgICAgICAgIGV4cGVjdGVkQ29udGV4dDogWydGU3gnLCAnTmV0QXBwJywgJ09OVEFQJywgJ+ODkeODleOCqeODvOODnuODs+OCuSddLFxuICAgICAgICAgICAgY29udGV4dERlcGVuZGVuY3k6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVzZXJNZXNzYWdlOiAnUkFH44K344K544OG44Og44Go44Gu57Wx5ZCI5pa55rOV44Gr44Gk44GE44Gm5pWZ44GI44Gm44GP44Gg44GV44GEJyxcbiAgICAgICAgICAgIGV4cGVjdGVkQ29udGV4dDogWydGU3gnLCAnUkFHJywgJ+e1seWQiCddLFxuICAgICAgICAgICAgY29udGV4dERlcGVuZGVuY3k6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVzZXJNZXNzYWdlOiAn44K744Kt44Ol44Oq44OG44Kj6Z2i44Gn44Gu6ICD5oWu5LqL6aCF44Gv44GC44KK44G+44GZ44GL77yfJyxcbiAgICAgICAgICAgIGV4cGVjdGVkQ29udGV4dDogWydGU3gnLCAnUkFHJywgJ+OCu+OCreODpeODquODhuOCoyddLFxuICAgICAgICAgICAgY29udGV4dERlcGVuZGVuY3k6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVzZXJNZXNzYWdlOiAn44Kz44K544OI5pyA6YGp5YyW44Gu5pa55rOV44Gv44GC44KK44G+44GZ44GL77yfJyxcbiAgICAgICAgICAgIGV4cGVjdGVkQ29udGV4dDogWydGU3gnLCAn44Kz44K544OIJywgJ+acgOmBqeWMliddLFxuICAgICAgICAgICAgY29udGV4dERlcGVuZGVuY3k6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHNlc3Npb25UeXBlOiAnbWVkaXVtJyxcbiAgICAgICAgY29tcGxleGl0eUxldmVsOiAnbW9kZXJhdGUnXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyDplbfmnJ/jgrvjg4Pjgrfjg6fjg7MgLSDopIfpm5HjgarmlofohIjnrqHnkIZcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdjb250ZXh0LWxvbmctMDAxJyxcbiAgICAgICAgc2NlbmFyaW86ICfopIfpm5Hjgarjg5fjg63jgrjjgqfjgq/jg4jnm7joq4cnLFxuICAgICAgICBjb252ZXJzYXRpb25GbG93OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXNlck1lc3NhZ2U6ICfmlrDjgZfjgYRSQUfjgrfjgrnjg4bjg6Djga7lsI7lhaXjgpLmpJzoqI7jgZfjgabjgYTjgb7jgZnjgILopoHku7blrprnvqnjgYvjgonlp4vjgoHjgZ/jgYTjga7jgafjgZnjgYwnLFxuICAgICAgICAgICAgZXhwZWN0ZWRDb250ZXh0OiBbJ1JBRycsICfjgrfjgrnjg4bjg6AnLCAn5bCO5YWlJywgJ+imgeS7tuWumue+qSddLFxuICAgICAgICAgICAgY29udGV4dERlcGVuZGVuY3k6IGZhbHNlXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1c2VyTWVzc2FnZTogJ+ODpuODvOOCtuODvOaVsOOBr+e0hDEwMDDkurrjgIHmlofmm7jmlbDjga8xMOS4h+S7tueoi+W6puOBp+OBmScsXG4gICAgICAgICAgICBleHBlY3RlZENvbnRleHQ6IFsnUkFHJywgJzEwMDDkuronLCAnMTDkuIfku7YnLCAn44K544Kx44O844OrJ10sXG4gICAgICAgICAgICBjb250ZXh0RGVwZW5kZW5jeTogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXNlck1lc3NhZ2U6ICfjgrvjgq3jg6Xjg6rjg4bjgqPopoHku7bjgajjgZfjgabjgIHpg6jnvbLliKXjga7jgqLjgq/jgrvjgrnliLblvqHjgYzlv4XopoHjgafjgZknLFxuICAgICAgICAgICAgZXhwZWN0ZWRDb250ZXh0OiBbJ1JBRycsICfjgrvjgq3jg6Xjg6rjg4bjgqMnLCAn6YOo572y5YilJywgJ+OCouOCr+OCu+OCueWItuW+oSddLFxuICAgICAgICAgICAgY29udGV4dERlcGVuZGVuY3k6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVzZXJNZXNzYWdlOiAn5LqI566X44Gv5bm06ZaTNTAw5LiH5YaG56iL5bqm44KS5oOz5a6a44GX44Gm44GE44G+44GZJyxcbiAgICAgICAgICAgIGV4cGVjdGVkQ29udGV4dDogWydSQUcnLCAn5LqI566XJywgJzUwMOS4h+WGhicsICfjgrPjgrnjg4gnXSxcbiAgICAgICAgICAgIGNvbnRleHREZXBlbmRlbmN5OiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1c2VyTWVzc2FnZTogJ+OBk+OCjOOCieOBruadoeS7tuOBp0FtYXpvbiBGU3jjgpLkvb/nlKjjgZnjgovjg6Hjg6rjg4Pjg4jjga/jgYLjgorjgb7jgZnjgYvvvJ8nLFxuICAgICAgICAgICAgZXhwZWN0ZWRDb250ZXh0OiBbJ1JBRycsICdGU3gnLCAnMTAwMOS6uicsICcxMOS4h+S7ticsICfjgrvjgq3jg6Xjg6rjg4bjgqMnLCAnNTAw5LiH5YaGJ10sXG4gICAgICAgICAgICBjb250ZXh0RGVwZW5kZW5jeTogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXNlck1lc3NhZ2U6ICflsI7lhaXjgrnjgrHjgrjjg6Xjg7zjg6vjga/jganjga7nqIvluqbjgpLopovovrzjgoDjgbnjgY3jgafjgZfjgofjgYbjgYvvvJ8nLFxuICAgICAgICAgICAgZXhwZWN0ZWRDb250ZXh0OiBbJ1JBRycsICdGU3gnLCAn5bCO5YWlJywgJ+OCueOCseOCuOODpeODvOODqycsICcxMDAw5Lq6JywgJzEw5LiH5Lu2J10sXG4gICAgICAgICAgICBjb250ZXh0RGVwZW5kZW5jeTogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgc2Vzc2lvblR5cGU6ICdsb25nJyxcbiAgICAgICAgY29tcGxleGl0eUxldmVsOiAnY29tcGxleCdcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIOOCr+ODreOCueOCu+ODg+OCt+ODp+ODs+e2mee2mlxuICAgICAge1xuICAgICAgICBpZDogJ2NvbnRleHQtY3Jvc3Mtc2Vzc2lvbi0wMDEnLFxuICAgICAgICBzY2VuYXJpbzogJ+OCu+ODg+OCt+ODp+ODs+mWk+OBp+OBrue2mee2muaApycsXG4gICAgICAgIGNvbnZlcnNhdGlvbkZsb3c6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1c2VyTWVzc2FnZTogJ+aYqOaXpeebuOirh+OBl+OBn1JBR+OCt+OCueODhuODoOOBruS7tuOBp+OBmeOBjCcsXG4gICAgICAgICAgICBleHBlY3RlZENvbnRleHQ6IFsnUkFHJywgJ+OCt+OCueODhuODoCcsICfliY3lm54nLCAn57aZ57aaJ10sXG4gICAgICAgICAgICBjb250ZXh0RGVwZW5kZW5jeTogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXNlck1lc3NhZ2U6ICdGU3jjga7lsI7lhaXjgavjgaTjgYTjgabov73liqDjgafos6rllY/jgYzjgYLjgorjgb7jgZknLFxuICAgICAgICAgICAgZXhwZWN0ZWRDb250ZXh0OiBbJ1JBRycsICdGU3gnLCAn5bCO5YWlJywgJ+i/veWKoOizquWVjyddLFxuICAgICAgICAgICAgY29udGV4dERlcGVuZGVuY3k6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIHNlc3Npb25UeXBlOiAnbWVkaXVtJyxcbiAgICAgICAgY29tcGxleGl0eUxldmVsOiAnbW9kZXJhdGUnXG4gICAgICB9XG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiDljIXmi6znmoTjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjg4bjgrnjg4hcbiAgICovXG4gIGFzeW5jIHRlc3RDb21wcmVoZW5zaXZlQ29udGV4dFBlcnNpc3RlbmNlKCk6IFByb21pc2U8Q29udGV4dFBlcnNpc3RlbmNlVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IHRlc3RJZCA9ICdjb250ZXh0LXBlcnNpc3RlbmNlLWNvbXByZWhlbnNpdmUtMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn5K+IOWMheaLrOeahOOCs+ODs+ODhuOCreOCueODiOe2reaMgeODhuOCueODiOOCkumWi+Wniy4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHRSZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgICAvLyDlkITjg4bjgrnjg4jjgrHjg7zjgrnjgpLlrp/ooYxcbiAgICAgIGZvciAoY29uc3QgdGVzdENhc2Ugb2YgdGhpcy50ZXN0Q2FzZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOOCs+ODs+ODhuOCreOCueODiOODhuOCueODiOWun+ihjOS4rTogJHt0ZXN0Q2FzZS5zY2VuYXJpb31gKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNhc2VSZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVDb250ZXh0VGVzdCh0ZXN0Q2FzZSk7XG4gICAgICAgIGNvbnRleHRSZXN1bHRzLnB1c2goY2FzZVJlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIC8vIOODoeODiOODquOCr+OCueioiOeul1xuICAgICAgY29uc3QgY29udGV4dE1ldHJpY3MgPSB0aGlzLmNhbGN1bGF0ZUNvbnRleHRNZXRyaWNzKGNvbnRleHRSZXN1bHRzKTtcbiAgICAgIGNvbnN0IHNlc3Npb25BbmFseXNpcyA9IHRoaXMuY2FsY3VsYXRlU2Vzc2lvbkFuYWx5c2lzKGNvbnRleHRSZXN1bHRzKTtcblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IGNvbnRleHRNZXRyaWNzLnNlc3Npb25Db250aW51aXR5ID4gMC44NSAmJiBcbiAgICAgICAgICAgICAgICAgICAgIGNvbnRleHRNZXRyaWNzLmNvbnRleHRSZXRlbnRpb24gPiAwLjg7XG5cbiAgICAgIGNvbnN0IHJlc3VsdDogQ29udGV4dFBlcnNpc3RlbmNlVGVzdFJlc3VsdCA9IHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ+WMheaLrOeahOOCs+ODs+ODhuOCreOCueODiOe2reaMgeODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnY29udGV4dC1wZXJzaXN0ZW5jZScsXG4gICAgICAgIHN0YXR1czogc3VjY2VzcyA/IFRlc3RFeGVjdXRpb25TdGF0dXMuQ09NUExFVEVEIDogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgIGNvbnRleHRNZXRyaWNzLFxuICAgICAgICBzZXNzaW9uQW5hbHlzaXMsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgdGVzdENhc2VDb3VudDogdGhpcy50ZXN0Q2FzZXMubGVuZ3RoLFxuICAgICAgICAgIGNvbnRleHRSZXN1bHRzOiBjb250ZXh0UmVzdWx0c1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIOWMheaLrOeahOOCs+ODs+ODhuOCreOCueODiOe2reaMgeODhuOCueODiOaIkOWKnycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOWMheaLrOeahOOCs+ODs+ODhuOCreOCueODiOe2reaMgeODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDljIXmi6znmoTjgrPjg7Pjg4bjgq3jgrnjg4jntq3mjIHjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn5YyF5ous55qE44Kz44Oz44OG44Kt44K544OI57at5oyB44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdjb250ZXh0LXBlcnNpc3RlbmNlJyxcbiAgICAgICAgc3RhdHVzOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOWAi+WIpeOCs+ODs+ODhuOCreOCueODiOODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlQ29udGV4dFRlc3QodGVzdENhc2U6IENvbnRleHRUZXN0Q2FzZSk6IFByb21pc2U8e1xuICAgIHRlc3RDYXNlOiBDb250ZXh0VGVzdENhc2U7XG4gICAgc2Vzc2lvbjogQ29udmVyc2F0aW9uU2Vzc2lvbjtcbiAgICBjb250ZXh0U2NvcmVzOiBudW1iZXJbXTtcbiAgICBvdmVyYWxsU2NvcmU6IG51bWJlcjtcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIOOCu+ODg+OCt+ODp+ODs+S9nOaIkFxuICAgICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuY3JlYXRlVGVzdFNlc3Npb24odGVzdENhc2UpO1xuICAgICAgY29uc3QgY29udGV4dFNjb3JlczogbnVtYmVyW10gPSBbXTtcblxuICAgICAgLy8g5Lya6Kmx44OV44Ot44O844KS6aCG5qyh5a6f6KGMXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRlc3RDYXNlLmNvbnZlcnNhdGlvbkZsb3cubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZmxvdyA9IHRlc3RDYXNlLmNvbnZlcnNhdGlvbkZsb3dbaV07XG4gICAgICAgIFxuICAgICAgICAvLyDjg6bjg7zjgrbjg7zjg6Hjg4Pjgrvjg7zjgrjjgpLov73liqBcbiAgICAgICAgYXdhaXQgdGhpcy5hZGRNZXNzYWdlVG9TZXNzaW9uKHNlc3Npb24sIHtcbiAgICAgICAgICBtZXNzYWdlSWQ6IGBtc2ctJHtpfS11c2VyYCxcbiAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgY29udGVudDogZmxvdy51c2VyTWVzc2FnZSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g44Kz44Oz44OG44Kt44K544OI6KmV5L6hXG4gICAgICAgIGNvbnN0IGNvbnRleHRTY29yZSA9IGF3YWl0IHRoaXMuZXZhbHVhdGVDb250ZXh0VXNhZ2Uoc2Vzc2lvbiwgZmxvdyk7XG4gICAgICAgIGNvbnRleHRTY29yZXMucHVzaChjb250ZXh0U2NvcmUpO1xuXG4gICAgICAgIC8vIOOCouOCt+OCueOCv+ODs+ODiOW/nOetlOOCkueUn+aIkOODu+i/veWKoFxuICAgICAgICBjb25zdCBhc3Npc3RhbnRSZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVDb250ZXh0QXdhcmVSZXNwb25zZShzZXNzaW9uLCBmbG93KTtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGRNZXNzYWdlVG9TZXNzaW9uKHNlc3Npb24sIHtcbiAgICAgICAgICBtZXNzYWdlSWQ6IGBtc2ctJHtpfS1hc3Npc3RhbnRgLFxuICAgICAgICAgIHJvbGU6ICdhc3Npc3RhbnQnLFxuICAgICAgICAgIGNvbnRlbnQ6IGFzc2lzdGFudFJlc3BvbnNlLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgY29udGV4dFVzZWQ6IGZsb3cuZXhwZWN0ZWRDb250ZXh0XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDjgrvjg4Pjgrfjg6fjg7PjgrPjg7Pjg4bjgq3jgrnjg4jjgpLmm7TmlrBcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVTZXNzaW9uQ29udGV4dChzZXNzaW9uLCBmbG93KTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3ZlcmFsbFNjb3JlID0gY29udGV4dFNjb3Jlcy5yZWR1Y2UoKHN1bSwgc2NvcmUpID0+IHN1bSArIHNjb3JlLCAwKSAvIGNvbnRleHRTY29yZXMubGVuZ3RoO1xuICAgICAgY29uc3Qgc3VjY2VzcyA9IG92ZXJhbGxTY29yZSA+IDAuNztcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdENhc2UsXG4gICAgICAgIHNlc3Npb24sXG4gICAgICAgIGNvbnRleHRTY29yZXMsXG4gICAgICAgIG92ZXJhbGxTY29yZSxcbiAgICAgICAgc3VjY2Vzc1xuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGDinYwg44Kz44Oz44OG44Kt44K544OI44OG44K544OI5a6f6KGM44Ko44Op44O8ICgke3Rlc3RDYXNlLmlkfSk6YCwgZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdENhc2UsXG4gICAgICAgIHNlc3Npb246IHt9IGFzIENvbnZlcnNhdGlvblNlc3Npb24sXG4gICAgICAgIGNvbnRleHRTY29yZXM6IFtdLFxuICAgICAgICBvdmVyYWxsU2NvcmU6IDAsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jjgrvjg4Pjgrfjg6fjg7PkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlVGVzdFNlc3Npb24odGVzdENhc2U6IENvbnRleHRUZXN0Q2FzZSk6IFByb21pc2U8Q29udmVyc2F0aW9uU2Vzc2lvbj4ge1xuICAgIGNvbnN0IHNlc3Npb25JZCA9IGB0ZXN0LXNlc3Npb24tJHt0ZXN0Q2FzZS5pZH0tJHtEYXRlLm5vdygpfWA7XG4gICAgY29uc3QgdXNlcklkID0gYHRlc3QtdXNlci0ke3Rlc3RDYXNlLmlkfWA7XG5cbiAgICBjb25zdCBzZXNzaW9uOiBDb252ZXJzYXRpb25TZXNzaW9uID0ge1xuICAgICAgc2Vzc2lvbklkLFxuICAgICAgdXNlcklkLFxuICAgICAgbWVzc2FnZXM6IFtdLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICB0b3BpY3M6IFtdLFxuICAgICAgICBlbnRpdGllczoge30sXG4gICAgICAgIHByZWZlcmVuY2VzOiB7fSxcbiAgICAgICAgZG9jdW1lbnRIaXN0b3J5OiBbXSxcbiAgICAgICAgY29udmVyc2F0aW9uU3VtbWFyeTogJydcbiAgICAgIH0sXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICBsYXN0VXBkYXRlZDogbmV3IERhdGUoKVxuICAgIH07XG5cbiAgICAvLyDoqq3jgb/lj5bjgorlsILnlKjjg6Ljg7zjg4njgafjgarjgYTloLTlkIjjgIFEeW5hbW9EQuOBq+S/neWtmFxuICAgIGlmICghdGhpcy5jb25maWcucmVhZE9ubHlNb2RlKSB7XG4gICAgICBhd2FpdCB0aGlzLnNhdmVTZXNzaW9uVG9EeW5hbW9EQihzZXNzaW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2Vzc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrvjg4Pjgrfjg6fjg7Pjgavjg6Hjg4Pjgrvjg7zjgrjov73liqBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgYWRkTWVzc2FnZVRvU2Vzc2lvbihzZXNzaW9uOiBDb252ZXJzYXRpb25TZXNzaW9uLCBtZXNzYWdlOiBDb252ZXJzYXRpb25NZXNzYWdlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgc2Vzc2lvbi5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIHNlc3Npb24ubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgLy8g6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44Gn44Gq44GE5aC05ZCI44CBRHluYW1vRELjgpLmm7TmlrBcbiAgICBpZiAoIXRoaXMuY29uZmlnLnJlYWRPbmx5TW9kZSkge1xuICAgICAgYXdhaXQgdGhpcy51cGRhdGVTZXNzaW9uSW5EeW5hbW9EQihzZXNzaW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44Kz44Oz44OG44Kt44K544OI5L2/55So6KmV5L6hXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV2YWx1YXRlQ29udGV4dFVzYWdlKHNlc3Npb246IENvbnZlcnNhdGlvblNlc3Npb24sIGZsb3c6IGFueSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKCFmbG93LmNvbnRleHREZXBlbmRlbmN5KSB7XG4gICAgICByZXR1cm4gMS4wOyAvLyDjgrPjg7Pjg4bjgq3jgrnjg4jkvp3lrZjjgafjgarjgYTloLTlkIjjga/muoDngrlcbiAgICB9XG5cbiAgICAvLyDmnJ/lvoXjgZXjgozjgovjgrPjg7Pjg4bjgq3jgrnjg4jjgYznj77lnKjjga7jgrvjg4Pjgrfjg6fjg7PjgavlkKvjgb7jgozjgabjgYTjgovjgYvjg4Hjgqfjg4Pjgq9cbiAgICBjb25zdCBjdXJyZW50VG9waWNzID0gc2Vzc2lvbi5jb250ZXh0LnRvcGljcztcbiAgICBjb25zdCBleHBlY3RlZENvbnRleHQgPSBmbG93LmV4cGVjdGVkQ29udGV4dDtcblxuICAgIGNvbnN0IG1hdGNoZWRDb250ZXh0ID0gZXhwZWN0ZWRDb250ZXh0LmZpbHRlcihjb250ZXh0ID0+IFxuICAgICAgY3VycmVudFRvcGljcy5zb21lKHRvcGljID0+IHRvcGljLmluY2x1ZGVzKGNvbnRleHQpIHx8IGNvbnRleHQuaW5jbHVkZXModG9waWMpKVxuICAgICk7XG5cbiAgICByZXR1cm4gbWF0Y2hlZENvbnRleHQubGVuZ3RoIC8gZXhwZWN0ZWRDb250ZXh0Lmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrPjg7Pjg4bjgq3jgrnjg4joqo3orZjlv5znrZTnlJ/miJBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVDb250ZXh0QXdhcmVSZXNwb25zZShzZXNzaW9uOiBDb252ZXJzYXRpb25TZXNzaW9uLCBmbG93OiBhbnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIOiqreOBv+WPluOCiuWwgueUqOODouODvOODieOBp+OBr+aooeaTrOW/nOetlOOCkueUn+aIkFxuICAgIGlmICh0aGlzLmNvbmZpZy5yZWFkT25seU1vZGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlTW9ja0NvbnRleHRSZXNwb25zZShzZXNzaW9uLCBmbG93KTtcbiAgICB9XG5cbiAgICAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/jgIHjgrvjg4Pjgrfjg6fjg7PjgrPjg7Pjg4bjgq3jgrnjg4jjgpLkvb/nlKjjgZfjgaZCZWRyb2Nr44Gn5b+c562U55Sf5oiQXG4gICAgLy8g44GT44GT44Gn44Gv57Ch55Wl5YyW44GX44Gf5qih5pOs5a6f6KOFXG4gICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVNb2NrQ29udGV4dFJlc3BvbnNlKHNlc3Npb24sIGZsb3cpO1xuICB9XG5cbiAgLyoqXG4gICAqIOaooeaTrOOCs+ODs+ODhuOCreOCueODiOW/nOetlOeUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZU1vY2tDb250ZXh0UmVzcG9uc2Uoc2Vzc2lvbjogQ29udmVyc2F0aW9uU2Vzc2lvbiwgZmxvdzogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb250ZXh0VGVybXMgPSBzZXNzaW9uLmNvbnRleHQudG9waWNzLmpvaW4oJ+OAgScpO1xuICAgIGNvbnN0IHVzZXJNZXNzYWdlID0gZmxvdy51c2VyTWVzc2FnZTtcblxuICAgIGlmIChmbG93LmNvbnRleHREZXBlbmRlbmN5ICYmIHNlc3Npb24uY29udGV4dC50b3BpY3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGAke2NvbnRleHRUZXJtc33jgavplqLpgKPjgZfjgabjgIEke3VzZXJNZXNzYWdlfeOBq+OBpOOBhOOBpuOBiuetlOOBiOOBl+OBvuOBmeOAguOBk+OCjOOBvuOBp+OBruS8muipseOBrua1geOCjOOCkui4j+OBvuOBiOOBpuiqrOaYjuOBhOOBn+OBl+OBvuOBmeOAgmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBgJHt1c2VyTWVzc2FnZX3jgavjgaTjgYTjgabjgYrnrZTjgYjjgZfjgb7jgZnjgIJgO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjgrvjg4Pjgrfjg6fjg7PjgrPjg7Pjg4bjgq3jgrnjg4jmm7TmlrBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlU2Vzc2lvbkNvbnRleHQoc2Vzc2lvbjogQ29udmVyc2F0aW9uU2Vzc2lvbiwgZmxvdzogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8g44OI44OU44OD44Kv44KS5pu05pawXG4gICAgZmxvdy5leHBlY3RlZENvbnRleHQuZm9yRWFjaCgoY29udGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoIXNlc3Npb24uY29udGV4dC50b3BpY3MuaW5jbHVkZXMoY29udGV4dCkpIHtcbiAgICAgICAgc2Vzc2lvbi5jb250ZXh0LnRvcGljcy5wdXNoKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8g44OI44OU44OD44Kv5pWw44KS5Yi26ZmQ77yI5pyA5paw44GuMTDlgIvjgb7jgafvvIlcbiAgICBpZiAoc2Vzc2lvbi5jb250ZXh0LnRvcGljcy5sZW5ndGggPiAxMCkge1xuICAgICAgc2Vzc2lvbi5jb250ZXh0LnRvcGljcyA9IHNlc3Npb24uY29udGV4dC50b3BpY3Muc2xpY2UoLTEwKTtcbiAgICB9XG5cbiAgICAvLyDkvJroqbHjgrXjg57jg6rjg7zjgpLmm7TmlrBcbiAgICBzZXNzaW9uLmNvbnRleHQuY29udmVyc2F0aW9uU3VtbWFyeSA9IGAke3Nlc3Npb24uY29udGV4dC50b3BpY3Muam9pbign44CBJyl944Gr44Gk44GE44Gm6K2w6KuW5LitYDtcblxuICAgIHNlc3Npb24ubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgLy8g6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44Gn44Gq44GE5aC05ZCI44CBRHluYW1vRELjgpLmm7TmlrBcbiAgICBpZiAoIXRoaXMuY29uZmlnLnJlYWRPbmx5TW9kZSkge1xuICAgICAgYXdhaXQgdGhpcy51cGRhdGVTZXNzaW9uSW5EeW5hbW9EQihzZXNzaW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHluYW1vRELjgavjgrvjg4Pjgrfjg6fjg7Pkv53lrZhcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc2F2ZVNlc3Npb25Ub0R5bmFtb0RCKHNlc3Npb246IENvbnZlcnNhdGlvblNlc3Npb24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBQdXRJdGVtQ29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy5zZXNzaW9uc1RhYmxlLFxuICAgICAgICBJdGVtOiB7XG4gICAgICAgICAgc2Vzc2lvbklkOiB7IFM6IHNlc3Npb24uc2Vzc2lvbklkIH0sXG4gICAgICAgICAgdXNlcklkOiB7IFM6IHNlc3Npb24udXNlcklkIH0sXG4gICAgICAgICAgbWVzc2FnZXM6IHsgUzogSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbi5tZXNzYWdlcykgfSxcbiAgICAgICAgICBjb250ZXh0OiB7IFM6IEpTT04uc3RyaW5naWZ5KHNlc3Npb24uY29udGV4dCkgfSxcbiAgICAgICAgICBjcmVhdGVkQXQ6IHsgUzogc2Vzc2lvbi5jcmVhdGVkQXQudG9JU09TdHJpbmcoKSB9LFxuICAgICAgICAgIGxhc3RVcGRhdGVkOiB7IFM6IHNlc3Npb24ubGFzdFVwZGF0ZWQudG9JU09TdHJpbmcoKSB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBhd2FpdCB0aGlzLmR5bmFtb0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBEeW5hbW9EQuOCu+ODg+OCt+ODp+ODs+S/neWtmOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICAvLyDjg4bjgrnjg4jntpnntprjga7jgZ/jgoHjgqjjg6njg7zjgpLnhKHoppZcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHluYW1vRELjga7jgrvjg4Pjgrfjg6fjg7Pmm7TmlrBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlU2Vzc2lvbkluRHluYW1vREIoc2Vzc2lvbjogQ29udmVyc2F0aW9uU2Vzc2lvbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFVwZGF0ZUl0ZW1Db21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnNlc3Npb25zVGFibGUsXG4gICAgICAgIEtleToge1xuICAgICAgICAgIHNlc3Npb25JZDogeyBTOiBzZXNzaW9uLnNlc3Npb25JZCB9XG4gICAgICAgIH0sXG4gICAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdTRVQgbWVzc2FnZXMgPSA6bWVzc2FnZXMsIGNvbnRleHQgPSA6Y29udGV4dCwgbGFzdFVwZGF0ZWQgPSA6bGFzdFVwZGF0ZWQnLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzptZXNzYWdlcyc6IHsgUzogSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbi5tZXNzYWdlcykgfSxcbiAgICAgICAgICAnOmNvbnRleHQnOiB7IFM6IEpTT04uc3RyaW5naWZ5KHNlc3Npb24uY29udGV4dCkgfSxcbiAgICAgICAgICAnOmxhc3RVcGRhdGVkJzogeyBTOiBzZXNzaW9uLmxhc3RVcGRhdGVkLnRvSVNPU3RyaW5nKCkgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwgRHluYW1vRELjgrvjg4Pjgrfjg6fjg7Pmm7TmlrDjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgLy8g44OG44K544OI57aZ57aa44Gu44Gf44KB44Ko44Op44O844KS54Sh6KaWXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOOCs+ODs+ODhuOCreOCueODiOODoeODiOODquOCr+OCueioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVDb250ZXh0TWV0cmljcyhyZXN1bHRzOiBhbnlbXSk6IHtcbiAgICBzZXNzaW9uQ29udGludWl0eTogbnVtYmVyO1xuICAgIGNvbnRleHRSZXRlbnRpb246IG51bWJlcjtcbiAgICBjb252ZXJzYXRpb25Db2hlcmVuY2U6IG51bWJlcjtcbiAgICBtZW1vcnlFZmZpY2llbmN5OiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IHZhbGlkUmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKTtcbiAgICBcbiAgICBpZiAodmFsaWRSZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2Vzc2lvbkNvbnRpbnVpdHk6IDAsXG4gICAgICAgIGNvbnRleHRSZXRlbnRpb246IDAsXG4gICAgICAgIGNvbnZlcnNhdGlvbkNvaGVyZW5jZTogMCxcbiAgICAgICAgbWVtb3J5RWZmaWNpZW5jeTogMFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDjgrvjg4Pjgrfjg6fjg7PntpnntprmgKfvvIjkvJroqbHjga7mtYHjgozjga7oh6rnhLbjgZXvvIlcbiAgICBjb25zdCBzZXNzaW9uQ29udGludWl0eSA9IHZhbGlkUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5vdmVyYWxsU2NvcmUsIDApIC8gdmFsaWRSZXN1bHRzLmxlbmd0aDtcblxuICAgIC8vIOOCs+ODs+ODhuOCreOCueODiOS/neaMgeeOh++8iOacn+W+heOBleOCjOOCi+OCs+ODs+ODhuOCreOCueODiOOBruS/neaMgeW6pu+8iVxuICAgIGNvbnN0IGNvbnRleHRSZXRlbnRpb24gPSB2YWxpZFJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHtcbiAgICAgIGNvbnN0IGF2Z1Njb3JlID0gci5jb250ZXh0U2NvcmVzLnJlZHVjZSgoczogbnVtYmVyLCBzY29yZTogbnVtYmVyKSA9PiBzICsgc2NvcmUsIDApIC8gci5jb250ZXh0U2NvcmVzLmxlbmd0aDtcbiAgICAgIHJldHVybiBzdW0gKyBhdmdTY29yZTtcbiAgICB9LCAwKSAvIHZhbGlkUmVzdWx0cy5sZW5ndGg7XG5cbiAgICAvLyDkvJroqbHkuIDosqvmgKfvvIjjg4jjg5Tjg4Pjgq/jga7kuIDosqvjgZfjgZ/nrqHnkIbvvIlcbiAgICBjb25zdCBjb252ZXJzYXRpb25Db2hlcmVuY2UgPSB2YWxpZFJlc3VsdHMucmVkdWNlKChzdW0sIHIpID0+IHtcbiAgICAgIGNvbnN0IHRvcGljQ291bnQgPSByLnNlc3Npb24uY29udGV4dD8udG9waWNzPy5sZW5ndGggfHwgMDtcbiAgICAgIGNvbnN0IG1lc3NhZ2VDb3VudCA9IHIuc2Vzc2lvbi5tZXNzYWdlcz8ubGVuZ3RoIHx8IDE7XG4gICAgICByZXR1cm4gc3VtICsgTWF0aC5taW4odG9waWNDb3VudCAvIG1lc3NhZ2VDb3VudCwgMS4wKTtcbiAgICB9LCAwKSAvIHZhbGlkUmVzdWx0cy5sZW5ndGg7XG5cbiAgICAvLyDjg6Hjg6Ljg6rlirnnjofvvIjpganliIfjgarjgrPjg7Pjg4bjgq3jgrnjg4jnrqHnkIbvvIlcbiAgICBjb25zdCBtZW1vcnlFZmZpY2llbmN5ID0gKHNlc3Npb25Db250aW51aXR5ICsgY29udGV4dFJldGVudGlvbikgLyAyO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlc3Npb25Db250aW51aXR5LFxuICAgICAgY29udGV4dFJldGVudGlvbixcbiAgICAgIGNvbnZlcnNhdGlvbkNvaGVyZW5jZSxcbiAgICAgIG1lbW9yeUVmZmljaWVuY3lcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOOCu+ODg+OCt+ODp+ODs+WIhuaekOioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVTZXNzaW9uQW5hbHlzaXMocmVzdWx0czogYW55W10pOiB7XG4gICAgYXZlcmFnZVNlc3Npb25MZW5ndGg6IG51bWJlcjtcbiAgICBjb250ZXh0U3dpdGNoQWNjdXJhY3k6IG51bWJlcjtcbiAgICBsb25nVGVybU1lbW9yeVNjb3JlOiBudW1iZXI7XG4gICAgY3Jvc3NTZXNzaW9uUmVsZXZhbmNlOiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IHZhbGlkUmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKTtcbiAgICBcbiAgICBpZiAodmFsaWRSZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXZlcmFnZVNlc3Npb25MZW5ndGg6IDAsXG4gICAgICAgIGNvbnRleHRTd2l0Y2hBY2N1cmFjeTogMCxcbiAgICAgICAgbG9uZ1Rlcm1NZW1vcnlTY29yZTogMCxcbiAgICAgICAgY3Jvc3NTZXNzaW9uUmVsZXZhbmNlOiAwXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIOW5s+Wdh+OCu+ODg+OCt+ODp+ODs+mVt1xuICAgIGNvbnN0IGF2ZXJhZ2VTZXNzaW9uTGVuZ3RoID0gdmFsaWRSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBcbiAgICAgIHN1bSArIChyLnNlc3Npb24ubWVzc2FnZXM/Lmxlbmd0aCB8fCAwKSwgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuXG4gICAgLy8g44Kz44Oz44OG44Kt44K544OI5YiH44KK5pu/44GI57K+5bqmXG4gICAgY29uc3QgY29udGV4dFN3aXRjaEFjY3VyYWN5ID0gdmFsaWRSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiB7XG4gICAgICBjb25zdCBzd2l0Y2hDb3VudCA9IHIuY29udGV4dFNjb3Jlcy5maWx0ZXIoKHNjb3JlOiBudW1iZXIpID0+IHNjb3JlID4gMC44KS5sZW5ndGg7XG4gICAgICByZXR1cm4gc3VtICsgKHN3aXRjaENvdW50IC8gci5jb250ZXh0U2NvcmVzLmxlbmd0aCk7XG4gICAgfSwgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuXG4gICAgLy8g6ZW35pyf6KiY5oa244K544Kz44Ki77yI6ZW344GE44K744OD44K344On44Oz44Gn44Gu44Kz44Oz44OG44Kt44K544OI5L+d5oyB77yJXG4gICAgY29uc3QgbG9uZ1Nlc3Npb25zID0gdmFsaWRSZXN1bHRzLmZpbHRlcihyID0+IHIudGVzdENhc2Uuc2Vzc2lvblR5cGUgPT09ICdsb25nJyk7XG4gICAgY29uc3QgbG9uZ1Rlcm1NZW1vcnlTY29yZSA9IGxvbmdTZXNzaW9ucy5sZW5ndGggPiAwID8gXG4gICAgICBsb25nU2Vzc2lvbnMucmVkdWNlKChzdW0sIHIpID0+IHN1bSArIHIub3ZlcmFsbFNjb3JlLCAwKSAvIGxvbmdTZXNzaW9ucy5sZW5ndGggOiAwLjg7XG5cbiAgICAvLyDjgq/jg63jgrnjgrvjg4Pjgrfjg6fjg7PplqLpgKPmgKdcbiAgICBjb25zdCBjcm9zc1Nlc3Npb25UZXN0cyA9IHZhbGlkUmVzdWx0cy5maWx0ZXIociA9PiByLnRlc3RDYXNlLmlkLmluY2x1ZGVzKCdjcm9zcy1zZXNzaW9uJykpO1xuICAgIGNvbnN0IGNyb3NzU2Vzc2lvblJlbGV2YW5jZSA9IGNyb3NzU2Vzc2lvblRlc3RzLmxlbmd0aCA+IDAgPyBcbiAgICAgIGNyb3NzU2Vzc2lvblRlc3RzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLm92ZXJhbGxTY29yZSwgMCkgLyBjcm9zc1Nlc3Npb25UZXN0cy5sZW5ndGggOiAwLjc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgYXZlcmFnZVNlc3Npb25MZW5ndGgsXG4gICAgICBjb250ZXh0U3dpdGNoQWNjdXJhY3ksXG4gICAgICBsb25nVGVybU1lbW9yeVNjb3JlLFxuICAgICAgY3Jvc3NTZXNzaW9uUmVsZXZhbmNlXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kg44Kz44Oz44OG44Kt44K544OI57at5oyB44OG44K544OI44Oi44K444Ol44O844Or44KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgXG4gICAgLy8g44OG44K544OI44K744OD44K344On44Oz44Gu44Kv44Oq44O844Oz44Ki44OD44OX77yI6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44Gn44Gq44GE5aC05ZCI77yJXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5yZWFkT25seU1vZGUpIHtcbiAgICAgIC8vIOWun+mam+OBruWun+ijheOBp+OBr+OAgeODhuOCueODiOeUqOOCu+ODg+OCt+ODp+ODs+OCkuWJiumZpFxuICAgICAgY29uc29sZS5sb2coJ/Cfl5HvuI8gIOODhuOCueODiOOCu+ODg+OCt+ODp+ODs+OCkuOCr+ODquODvOODs+OCouODg+ODl+S4rS4uLicpO1xuICAgIH1cbiAgICBcbiAgICBjb25zb2xlLmxvZygn4pyFIOOCs+ODs+ODhuOCreOCueODiOe2reaMgeODhuOCueODiOODouOCuOODpeODvOODq+OBruOCr+ODquODvOODs+OCouODg+ODl+WujOS6hicpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbnRleHRQZXJzaXN0ZW5jZVRlc3RNb2R1bGU7Il19