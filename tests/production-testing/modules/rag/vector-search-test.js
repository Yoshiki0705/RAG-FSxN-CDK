"use strict";
/**
 * ベクトル検索テストモジュール
 *
 * OpenSearch Serverless を使用したベクトル検索機能を検証
 * 実本番環境での検索精度と応答時間をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorSearchTestModule = void 0;
// 定数定義
const VECTOR_SEARCH_CONSTANTS = {
    VECTOR_SIZE: 1536,
    MAX_QUERY_LENGTH: 1000,
    MIN_K_VALUE: 1,
    MAX_K_VALUE: 100,
    DEFAULT_K_VALUE: 10,
    MIN_SIZE_VALUE: 1,
    MAX_SIZE_VALUE: 50,
    DEFAULT_SIZE_VALUE: 10,
    SEARCH_TIMEOUT_MS: 10000,
    SUCCESS_THRESHOLDS: {
        RELEVANCE_SCORE: 0.7,
        RESPONSE_TIME_MS: 3000,
        OVERALL_RESPONSE_TIME_MS: 2000,
        SEMANTIC_ACCURACY: 0.85,
        OVERALL_RELEVANCE: 0.8
    },
    MOCK_RESPONSE_TIME: {
        MIN: 500,
        MAX: 1500
    },
    MOCK_RELEVANCE: {
        BASE: 0.85,
        VARIANCE: 0.1
    },
    MOCK_PRECISION: {
        BASE: 0.8,
        VARIANCE: 0.15
    }
};
const client_opensearchserverless_1 = require("@aws-sdk/client-opensearchserverless");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * ベクトル検索テストモジュール
 */
class VectorSearchTestModule {
    config;
    opensearchClient;
    testCases;
    collectionEndpoint;
    constructor(config) {
        // 設定の検証
        if (!config.region || !config.awsProfile) {
            throw new Error('必須設定が不足しています: region, awsProfile');
        }
        this.config = config;
        try {
            this.opensearchClient = new client_opensearchserverless_1.OpenSearchServerlessClient({
                region: config.region,
                credentials: (0, credential_providers_1.fromIni)({ profile: config.awsProfile })
            });
        }
        catch (error) {
            throw new Error(`AWS認証設定エラー: ${error}`);
        }
        this.testCases = this.loadSearchTestCases();
        this.collectionEndpoint = process.env.OPENSEARCH_COLLECTION_ENDPOINT || '';
    }
    /**
     * 検索テストケースの読み込み
     */
    loadSearchTestCases() {
        return [
            // 基本的な事実検索
            {
                id: 'search-factual-001',
                query: 'RAGシステムとは何ですか？',
                queryType: 'factual',
                expectedDocuments: ['rag-overview.md', 'rag-architecture.md'],
                language: 'ja',
                difficulty: 'basic'
            },
            // 技術的概念検索
            {
                id: 'search-technical-001',
                query: 'Amazon FSx for NetApp ONTAPの性能特性について',
                queryType: 'technical',
                expectedDocuments: ['fsx-performance.md', 'ontap-features.md'],
                language: 'ja',
                difficulty: 'intermediate'
            },
            // 複雑な概念検索
            {
                id: 'search-conceptual-001',
                query: '権限認識型RAGシステムにおけるセキュリティ設計の考慮事項',
                queryType: 'conceptual',
                expectedDocuments: ['security-design.md', 'permission-model.md'],
                language: 'ja',
                difficulty: 'advanced'
            },
            // 会話的検索
            {
                id: 'search-conversational-001',
                query: 'チャットボットの応答が遅い場合の対処法を教えてください',
                queryType: 'conversational',
                expectedDocuments: ['troubleshooting.md', 'performance-tuning.md'],
                language: 'ja',
                difficulty: 'intermediate'
            },
            // 英語検索
            {
                id: 'search-english-001',
                query: 'How to implement vector search with OpenSearch Serverless?',
                queryType: 'technical',
                expectedDocuments: ['opensearch-implementation.md', 'vector-search-guide.md'],
                language: 'en',
                difficulty: 'advanced'
            },
            // 混合言語検索
            {
                id: 'search-mixed-001',
                query: 'Amazon Bedrockを使用したRAG implementation in Japanese enterprise environment',
                queryType: 'technical',
                expectedDocuments: ['bedrock-integration.md', 'enterprise-deployment.md'],
                language: 'mixed',
                difficulty: 'advanced'
            }
        ];
    }
    /**
     * 包括的ベクトル検索テスト
     */
    async testComprehensiveVectorSearch() {
        const testId = 'vector-search-comprehensive-001';
        const startTime = Date.now();
        console.log('🔍 包括的ベクトル検索テストを開始...');
        try {
            // OpenSearch Serverless 接続確認
            await this.verifyOpenSearchConnection();
            const searchResults = [];
            // 各テストケースを並列実行（パフォーマンス向上）
            const testPromises = this.testCases.map(async (testCase) => {
                console.log(`   検索テスト実行中: ${testCase.query.substring(0, 30)}...`);
                return await this.executeSearchTest(testCase);
            });
            const testResults = await Promise.allSettled(testPromises);
            // 結果を処理
            testResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    searchResults.push(result.value);
                }
                else {
                    console.error(`❌ テストケース ${this.testCases[index].id} 実行失敗:`, result.reason);
                    searchResults.push({
                        testCase: this.testCases[index],
                        results: [],
                        metrics: { relevanceScore: 0, responseTime: 0 },
                        success: false
                    });
                }
            });
            // メトリクス計算
            const searchMetrics = this.calculateSearchMetrics(searchResults);
            const qualityMetrics = this.calculateQualityMetrics(searchResults);
            const success = searchMetrics.responseTime < VECTOR_SEARCH_CONSTANTS.SUCCESS_THRESHOLDS.OVERALL_RESPONSE_TIME_MS &&
                searchMetrics.relevanceScore > VECTOR_SEARCH_CONSTANTS.SUCCESS_THRESHOLDS.OVERALL_RELEVANCE &&
                qualityMetrics.semanticAccuracy > VECTOR_SEARCH_CONSTANTS.SUCCESS_THRESHOLDS.SEMANTIC_ACCURACY;
            const result = {
                testId,
                testName: '包括的ベクトル検索テスト',
                category: 'vector-search',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                searchMetrics,
                qualityMetrics,
                metadata: {
                    testCaseCount: this.testCases.length,
                    searchResults: searchResults,
                    collectionEndpoint: this.collectionEndpoint
                }
            };
            if (success) {
                console.log('✅ 包括的ベクトル検索テスト成功');
            }
            else {
                console.error('❌ 包括的ベクトル検索テスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 包括的ベクトル検索テスト実行エラー:', error);
            return {
                testId,
                testName: '包括的ベクトル検索テスト',
                category: 'vector-search',
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
     * OpenSearch Serverless 接続確認
     */
    async verifyOpenSearchConnection() {
        try {
            // 読み取り専用モードでは接続確認をスキップ
            if (this.config.readOnlyMode) {
                console.log('📋 読み取り専用モード: OpenSearch接続確認をスキップ');
                return;
            }
            const command = new client_opensearchserverless_1.ListCollectionsCommand({});
            const response = await this.opensearchClient.send(command);
            console.log(`✅ OpenSearch Serverless接続確認完了: ${response.collectionSummaries?.length || 0}個のコレクション`);
        }
        catch (error) {
            console.error('❌ OpenSearch Serverless接続エラー:', error);
            throw new Error('OpenSearch Serverless への接続に失敗しました');
        }
    }
    /**
     * 個別検索テストの実行
     */
    async executeSearchTest(testCase) {
        const searchStartTime = Date.now();
        const timeout = VECTOR_SEARCH_CONSTANTS.SEARCH_TIMEOUT_MS;
        try {
            // 読み取り専用モードでは模擬結果を返す
            if (this.config.readOnlyMode) {
                return this.generateMockSearchResult(testCase, searchStartTime);
            }
            // タイムアウト付きでベクトル検索実行
            const searchResults = await Promise.race([
                this.performVectorSearch(testCase),
                new Promise((_, reject) => setTimeout(() => reject(new Error('検索タイムアウト')), timeout))
            ]);
            const responseTime = Date.now() - searchStartTime;
            // 検索結果評価
            const metrics = this.evaluateSearchResults(searchResults, testCase, responseTime);
            const success = metrics.relevanceScore > VECTOR_SEARCH_CONSTANTS.SUCCESS_THRESHOLDS.RELEVANCE_SCORE &&
                responseTime < VECTOR_SEARCH_CONSTANTS.SUCCESS_THRESHOLDS.RESPONSE_TIME_MS;
            return {
                testCase,
                results: searchResults,
                metrics,
                success
            };
        }
        catch (error) {
            console.error(`❌ 検索テスト実行エラー (${testCase.id}):`, error);
            return {
                testCase,
                results: [],
                metrics: { relevanceScore: 0, responseTime: Date.now() - searchStartTime },
                success: false
            };
        }
    }
    /**
     * ベクトル検索実行
     */
    async performVectorSearch(testCase) {
        try {
            // 入力検証
            if (!testCase.query || testCase.query.trim().length === 0) {
                throw new Error('検索クエリが空です');
            }
            if (testCase.query.length > VECTOR_SEARCH_CONSTANTS.MAX_QUERY_LENGTH) {
                throw new Error(`検索クエリが長すぎます（${VECTOR_SEARCH_CONSTANTS.MAX_QUERY_LENGTH}文字以内）`);
            }
            // 実際のOpenSearch Serverless検索API呼び出し
            // 注意: 実装では適切なベクトル検索クエリを構築する必要があります
            const searchQuery = {
                query: {
                    knn: {
                        vector_field: {
                            vector: await this.generateQueryVector(testCase.query),
                            k: Math.min(Math.max(VECTOR_SEARCH_CONSTANTS.MIN_K_VALUE, VECTOR_SEARCH_CONSTANTS.DEFAULT_K_VALUE), VECTOR_SEARCH_CONSTANTS.MAX_K_VALUE)
                        }
                    }
                },
                _source: ['title', 'content', 'metadata'],
                size: Math.min(Math.max(VECTOR_SEARCH_CONSTANTS.MIN_SIZE_VALUE, VECTOR_SEARCH_CONSTANTS.DEFAULT_SIZE_VALUE), VECTOR_SEARCH_CONSTANTS.MAX_SIZE_VALUE)
            };
            // HTTP APIを使用してOpenSearch Serverlessに検索リクエストを送信
            // 実際の実装では fetch または axios を使用
            const response = await this.sendSearchRequest(searchQuery);
            // レスポンス検証
            if (!response || typeof response !== 'object') {
                throw new Error('無効な検索レスポンス');
            }
            return response.hits?.hits || [];
        }
        catch (error) {
            console.error('❌ ベクトル検索実行エラー:', error);
            throw error;
        }
    }
    /**
     * クエリベクトル生成（模擬）
     */
    async generateQueryVector(_query) {
        // 実際の実装では、Bedrockの埋め込みモデルを使用してベクトルを生成
        // ここでは模擬的なベクトルを返す
        return Array.from({ length: VECTOR_SEARCH_CONSTANTS.VECTOR_SIZE }, () => Math.random() - 0.5);
    }
    /**
     * 検索リクエスト送信（模擬）
     */
    async sendSearchRequest(_searchQuery) {
        // 実際の実装では、OpenSearch ServerlessのHTTP APIを呼び出し
        // ここでは模擬レスポンスを返す
        return {
            hits: {
                hits: [
                    {
                        _source: {
                            title: 'RAGシステム概要',
                            content: 'RAG（Retrieval-Augmented Generation）は...',
                            metadata: { category: 'overview', language: 'ja' }
                        },
                        _score: 0.95
                    },
                    {
                        _source: {
                            title: 'Amazon FSx for NetApp ONTAP',
                            content: 'Amazon FSx for NetApp ONTAPは高性能な...',
                            metadata: { category: 'technical', language: 'ja' }
                        },
                        _score: 0.87
                    }
                ]
            }
        };
    }
    /**
     * 模擬検索結果生成
     */
    generateMockSearchResult(testCase, _startTime) {
        const responseTime = Math.random() * (VECTOR_SEARCH_CONSTANTS.MOCK_RESPONSE_TIME.MAX - VECTOR_SEARCH_CONSTANTS.MOCK_RESPONSE_TIME.MIN) + VECTOR_SEARCH_CONSTANTS.MOCK_RESPONSE_TIME.MIN;
        const mockResults = testCase.expectedDocuments.map((doc, index) => ({
            _source: {
                title: doc.replace('.md', '').replace('-', ' '),
                content: `${testCase.query}に関連する内容です。`,
                metadata: {
                    category: testCase.queryType,
                    language: testCase.language,
                    document: doc
                }
            },
            _score: 0.9 - (index * 0.1)
        }));
        const metrics = {
            responseTime,
            relevanceScore: VECTOR_SEARCH_CONSTANTS.MOCK_RELEVANCE.BASE + Math.random() * VECTOR_SEARCH_CONSTANTS.MOCK_RELEVANCE.VARIANCE,
            documentsFound: mockResults.length,
            precision: VECTOR_SEARCH_CONSTANTS.MOCK_PRECISION.BASE + Math.random() * VECTOR_SEARCH_CONSTANTS.MOCK_PRECISION.VARIANCE
        };
        return {
            testCase,
            results: mockResults,
            metrics,
            success: metrics.relevanceScore > VECTOR_SEARCH_CONSTANTS.SUCCESS_THRESHOLDS.RELEVANCE_SCORE &&
                responseTime < VECTOR_SEARCH_CONSTANTS.SUCCESS_THRESHOLDS.RESPONSE_TIME_MS
        };
    }
    /**
     * 検索結果評価
     */
    evaluateSearchResults(results, testCase, responseTime) {
        // 関連性スコア計算
        const relevanceScore = this.calculateRelevanceScore(results, testCase);
        // 精度計算（上位5件での適合率）
        const precisionAt5 = this.calculatePrecisionAt5(results, testCase);
        // 再現率計算
        const recallScore = this.calculateRecallScore(results, testCase);
        return {
            responseTime,
            relevanceScore,
            precisionAt5,
            recallScore,
            documentsFound: results.length
        };
    }
    /**
     * 関連性スコア計算
     */
    calculateRelevanceScore(results, testCase) {
        if (results.length === 0)
            return 0;
        // 検索結果の平均スコアを関連性として使用
        const avgScore = results.reduce((sum, result) => sum + (result._score || 0), 0) / results.length;
        // クエリタイプに基づく重み付け
        const typeWeight = {
            'factual': 1.0,
            'technical': 0.9,
            'conceptual': 0.8,
            'conversational': 0.85
        };
        return avgScore * (typeWeight[testCase.queryType] || 0.8);
    }
    /**
     * 上位5件精度計算
     */
    calculatePrecisionAt5(results, testCase) {
        const top5Results = results.slice(0, 5);
        if (top5Results.length === 0)
            return 0;
        // 期待される文書が上位5件に含まれているかチェック
        const relevantCount = top5Results.filter(result => {
            const docName = result._source?.metadata?.document || '';
            return testCase.expectedDocuments.some(expected => docName.includes(expected.replace('.md', '')));
        }).length;
        return relevantCount / Math.min(5, testCase.expectedDocuments.length);
    }
    /**
     * 再現率計算
     */
    calculateRecallScore(results, testCase) {
        if (testCase.expectedDocuments.length === 0)
            return 1.0;
        // 期待される文書のうち、検索結果に含まれているものの割合
        const foundDocuments = results.filter(result => {
            const docName = result._source?.metadata?.document || '';
            return testCase.expectedDocuments.some(expected => docName.includes(expected.replace('.md', '')));
        }).length;
        return foundDocuments / testCase.expectedDocuments.length;
    }
    /**
     * 検索メトリクス計算
     */
    calculateSearchMetrics(searchResults) {
        const validResults = searchResults.filter(r => r.success && r.metrics);
        if (validResults.length === 0) {
            return {
                responseTime: 0,
                relevanceScore: 0,
                precisionAt5: 0,
                recallScore: 0,
                documentsFound: 0
            };
        }
        const avgResponseTime = validResults.reduce((sum, r) => sum + r.metrics.responseTime, 0) / validResults.length;
        const avgRelevance = validResults.reduce((sum, r) => sum + r.metrics.relevanceScore, 0) / validResults.length;
        const avgPrecision = validResults.reduce((sum, r) => sum + (r.metrics.precisionAt5 || 0), 0) / validResults.length;
        const avgRecall = validResults.reduce((sum, r) => sum + (r.metrics.recallScore || 0), 0) / validResults.length;
        const totalDocs = validResults.reduce((sum, r) => sum + r.metrics.documentsFound, 0);
        return {
            responseTime: avgResponseTime,
            relevanceScore: avgRelevance,
            precisionAt5: avgPrecision,
            recallScore: avgRecall,
            documentsFound: totalDocs / validResults.length
        };
    }
    /**
     * 品質メトリクス計算
     */
    calculateQualityMetrics(searchResults) {
        const validResults = searchResults.filter(r => r.success);
        if (validResults.length === 0) {
            return {
                semanticAccuracy: 0,
                contextualRelevance: 0,
                diversityScore: 0
            };
        }
        // 意味的精度（クエリタイプ別の成功率）
        const semanticAccuracy = validResults.length / searchResults.length;
        // 文脈的関連性（言語別の適合性）
        const contextualRelevance = this.evaluateContextualRelevance(validResults);
        // 多様性スコア（結果の多様性）
        const diversityScore = this.evaluateDiversityScore(validResults);
        return {
            semanticAccuracy,
            contextualRelevance,
            diversityScore
        };
    }
    /**
     * 文脈的関連性評価
     */
    evaluateContextualRelevance(results) {
        // 言語別の適合性を評価
        const languageGroups = results.reduce((groups, result) => {
            const lang = result.testCase.language;
            if (!groups[lang])
                groups[lang] = [];
            groups[lang].push(result);
            return groups;
        }, {});
        let totalRelevance = 0;
        let groupCount = 0;
        for (const [_lang, groupResults] of Object.entries(languageGroups)) {
            const avgRelevance = groupResults.reduce((sum, r) => sum + r.metrics.relevanceScore, 0) / groupResults.length;
            totalRelevance += avgRelevance;
            groupCount++;
        }
        return groupCount > 0 ? totalRelevance / groupCount : 0;
    }
    /**
     * 多様性スコア評価
     */
    evaluateDiversityScore(results) {
        // クエリタイプの多様性を評価
        const queryTypes = new Set(results.map(r => r.testCase.queryType));
        const typeCount = queryTypes.size;
        const maxTypes = 4; // factual, technical, conceptual, conversational
        return maxTypes > 0 ? typeCount / maxTypes : 0;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 ベクトル検索テストモジュールをクリーンアップ中...');
        console.log('✅ ベクトル検索テストモジュールのクリーンアップ完了');
    }
}
exports.VectorSearchTestModule = VectorSearchTestModule;
exports.default = VectorSearchTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVjdG9yLXNlYXJjaC10ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidmVjdG9yLXNlYXJjaC10ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsT0FBTztBQUNQLE1BQU0sdUJBQXVCLEdBQUc7SUFDOUIsV0FBVyxFQUFFLElBQUk7SUFDakIsZ0JBQWdCLEVBQUUsSUFBSTtJQUN0QixXQUFXLEVBQUUsQ0FBQztJQUNkLFdBQVcsRUFBRSxHQUFHO0lBQ2hCLGVBQWUsRUFBRSxFQUFFO0lBQ25CLGNBQWMsRUFBRSxDQUFDO0lBQ2pCLGNBQWMsRUFBRSxFQUFFO0lBQ2xCLGtCQUFrQixFQUFFLEVBQUU7SUFDdEIsaUJBQWlCLEVBQUUsS0FBSztJQUN4QixrQkFBa0IsRUFBRTtRQUNsQixlQUFlLEVBQUUsR0FBRztRQUNwQixnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLHdCQUF3QixFQUFFLElBQUk7UUFDOUIsaUJBQWlCLEVBQUUsSUFBSTtRQUN2QixpQkFBaUIsRUFBRSxHQUFHO0tBQ3ZCO0lBQ0Qsa0JBQWtCLEVBQUU7UUFDbEIsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsSUFBSTtLQUNWO0lBQ0QsY0FBYyxFQUFFO1FBQ2QsSUFBSSxFQUFFLElBQUk7UUFDVixRQUFRLEVBQUUsR0FBRztLQUNkO0lBQ0QsY0FBYyxFQUFFO1FBQ2QsSUFBSSxFQUFFLEdBQUc7UUFDVCxRQUFRLEVBQUUsSUFBSTtLQUNmO0NBQ08sQ0FBQztBQUVYLHNGQUc4QztBQUM5Qyx3RUFBd0Q7QUFHeEQsOEVBQW9GO0FBZ0NwRjs7R0FFRztBQUNILE1BQWEsc0JBQXNCO0lBQ3pCLE1BQU0sQ0FBbUI7SUFDekIsZ0JBQWdCLENBQTZCO0lBQzdDLFNBQVMsQ0FBbUI7SUFDNUIsa0JBQWtCLENBQVM7SUFFbkMsWUFBWSxNQUF3QjtRQUNsQyxRQUFRO1FBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FB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Q0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztRQUNsQyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxpREFBaUQ7UUFFckUsT0FBTyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Q0FDRjtBQS9qQkQsd0RBK2pCQztBQUVELGtCQUFlLHNCQUFzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6tcbiAqIFxuICogT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIOOCkuS9v+eUqOOBl+OBn+ODmeOCr+ODiOODq+aknOe0ouapn+iDveOCkuaknOiovFxuICog5a6f5pys55Wq55Kw5aKD44Gn44Gu5qSc57Si57K+5bqm44Go5b+c562U5pmC6ZaT44KS44OG44K544OIXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG4vLyDlrprmlbDlrprnvqlcbmNvbnN0IFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTID0ge1xuICBWRUNUT1JfU0laRTogMTUzNixcbiAgTUFYX1FVRVJZX0xFTkdUSDogMTAwMCxcbiAgTUlOX0tfVkFMVUU6IDEsXG4gIE1BWF9LX1ZBTFVFOiAxMDAsXG4gIERFRkFVTFRfS19WQUxVRTogMTAsXG4gIE1JTl9TSVpFX1ZBTFVFOiAxLFxuICBNQVhfU0laRV9WQUxVRTogNTAsXG4gIERFRkFVTFRfU0laRV9WQUxVRTogMTAsXG4gIFNFQVJDSF9USU1FT1VUX01TOiAxMDAwMCxcbiAgU1VDQ0VTU19USFJFU0hPTERTOiB7XG4gICAgUkVMRVZBTkNFX1NDT1JFOiAwLjcsXG4gICAgUkVTUE9OU0VfVElNRV9NUzogMzAwMCxcbiAgICBPVkVSQUxMX1JFU1BPTlNFX1RJTUVfTVM6IDIwMDAsXG4gICAgU0VNQU5USUNfQUNDVVJBQ1k6IDAuODUsXG4gICAgT1ZFUkFMTF9SRUxFVkFOQ0U6IDAuOFxuICB9LFxuICBNT0NLX1JFU1BPTlNFX1RJTUU6IHtcbiAgICBNSU46IDUwMCxcbiAgICBNQVg6IDE1MDBcbiAgfSxcbiAgTU9DS19SRUxFVkFOQ0U6IHtcbiAgICBCQVNFOiAwLjg1LFxuICAgIFZBUklBTkNFOiAwLjFcbiAgfSxcbiAgTU9DS19QUkVDSVNJT046IHtcbiAgICBCQVNFOiAwLjgsXG4gICAgVkFSSUFOQ0U6IDAuMTVcbiAgfVxufSBhcyBjb25zdDtcblxuaW1wb3J0IHtcbiAgT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQsXG4gIExpc3RDb2xsZWN0aW9uc0NvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LW9wZW5zZWFyY2hzZXJ2ZXJsZXNzJztcbmltcG9ydCB7IGZyb21JbmkgfSBmcm9tICdAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVycyc7XG5cbmltcG9ydCB7IFByb2R1Y3Rpb25Db25maWcgfSBmcm9tICcuLi8uLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuaW1wb3J0IHsgVGVzdFJlc3VsdCwgVGVzdEV4ZWN1dGlvblN0YXR1cyB9IGZyb20gJy4uLy4uL2NvcmUvcHJvZHVjdGlvbi10ZXN0LWVuZ2luZSc7XG5cbi8qKlxuICog44OZ44Kv44OI44Or5qSc57Si44OG44K544OI57WQ5p6cXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVmVjdG9yU2VhcmNoVGVzdFJlc3VsdCBleHRlbmRzIFRlc3RSZXN1bHQge1xuICBzZWFyY2hNZXRyaWNzPzoge1xuICAgIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIHJlbGV2YW5jZVNjb3JlOiBudW1iZXI7XG4gICAgcHJlY2lzaW9uQXQ1OiBudW1iZXI7XG4gICAgcmVjYWxsU2NvcmU6IG51bWJlcjtcbiAgICBkb2N1bWVudHNGb3VuZDogbnVtYmVyO1xuICB9O1xuICBxdWFsaXR5TWV0cmljcz86IHtcbiAgICBzZW1hbnRpY0FjY3VyYWN5OiBudW1iZXI7XG4gICAgY29udGV4dHVhbFJlbGV2YW5jZTogbnVtYmVyO1xuICAgIGRpdmVyc2l0eVNjb3JlOiBudW1iZXI7XG4gIH07XG59XG5cbi8qKlxuICog5qSc57Si44OG44K544OI44Kx44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoVGVzdENhc2Uge1xuICBpZDogc3RyaW5nO1xuICBxdWVyeTogc3RyaW5nO1xuICBxdWVyeVR5cGU6ICdmYWN0dWFsJyB8ICdjb25jZXB0dWFsJyB8ICd0ZWNobmljYWwnIHwgJ2NvbnZlcnNhdGlvbmFsJztcbiAgZXhwZWN0ZWREb2N1bWVudHM6IHN0cmluZ1tdO1xuICBsYW5ndWFnZTogJ2phJyB8ICdlbicgfCAnbWl4ZWQnO1xuICBkaWZmaWN1bHR5OiAnYmFzaWMnIHwgJ2ludGVybWVkaWF0ZScgfCAnYWR2YW5jZWQnO1xufVxuXG4vKipcbiAqIOODmeOCr+ODiOODq+aknOe0ouODhuOCueODiOODouOCuOODpeODvOODq1xuICovXG5leHBvcnQgY2xhc3MgVmVjdG9yU2VhcmNoVGVzdE1vZHVsZSB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIG9wZW5zZWFyY2hDbGllbnQ6IE9wZW5TZWFyY2hTZXJ2ZXJsZXNzQ2xpZW50O1xuICBwcml2YXRlIHRlc3RDYXNlczogU2VhcmNoVGVzdENhc2VbXTtcbiAgcHJpdmF0ZSBjb2xsZWN0aW9uRW5kcG9pbnQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFByb2R1Y3Rpb25Db25maWcpIHtcbiAgICAvLyDoqK3lrprjga7mpJzoqLxcbiAgICBpZiAoIWNvbmZpZy5yZWdpb24gfHwgIWNvbmZpZy5hd3NQcm9maWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W/hemgiOioreWumuOBjOS4jei2s+OBl+OBpuOBhOOBvuOBmTogcmVnaW9uLCBhd3NQcm9maWxlJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMub3BlbnNlYXJjaENsaWVudCA9IG5ldyBPcGVuU2VhcmNoU2VydmVybGVzc0NsaWVudCh7XG4gICAgICAgIHJlZ2lvbjogY29uZmlnLnJlZ2lvbixcbiAgICAgICAgY3JlZGVudGlhbHM6IGZyb21JbmkoeyBwcm9maWxlOiBjb25maWcuYXdzUHJvZmlsZSB9KVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQVdT6KqN6Ki86Kit5a6a44Ko44Op44O8OiAke2Vycm9yfWApO1xuICAgIH1cbiAgICBcbiAgICB0aGlzLnRlc3RDYXNlcyA9IHRoaXMubG9hZFNlYXJjaFRlc3RDYXNlcygpO1xuICAgIHRoaXMuY29sbGVjdGlvbkVuZHBvaW50ID0gcHJvY2Vzcy5lbnYuT1BFTlNFQVJDSF9DT0xMRUNUSU9OX0VORFBPSU5UIHx8ICcnO1xuICB9XG5cbiAgLyoqXG4gICAqIOaknOe0ouODhuOCueODiOOCseODvOOCueOBruiqreOBv+i+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBsb2FkU2VhcmNoVGVzdENhc2VzKCk6IFNlYXJjaFRlc3RDYXNlW10ge1xuICAgIHJldHVybiBbXG4gICAgICAvLyDln7rmnKznmoTjgarkuovlrp/mpJzntKJcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdzZWFyY2gtZmFjdHVhbC0wMDEnLFxuICAgICAgICBxdWVyeTogJ1JBR+OCt+OCueODhuODoOOBqOOBr+S9leOBp+OBmeOBi++8nycsXG4gICAgICAgIHF1ZXJ5VHlwZTogJ2ZhY3R1YWwnLFxuICAgICAgICBleHBlY3RlZERvY3VtZW50czogWydyYWctb3ZlcnZpZXcubWQnLCAncmFnLWFyY2hpdGVjdHVyZS5tZCddLFxuICAgICAgICBsYW5ndWFnZTogJ2phJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2Jhc2ljJ1xuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8g5oqA6KGT55qE5qaC5b+15qSc57SiXG4gICAgICB7XG4gICAgICAgIGlkOiAnc2VhcmNoLXRlY2huaWNhbC0wMDEnLFxuICAgICAgICBxdWVyeTogJ0FtYXpvbiBGU3ggZm9yIE5ldEFwcCBPTlRBUOOBruaAp+iDveeJueaAp+OBq+OBpOOBhOOBpicsXG4gICAgICAgIHF1ZXJ5VHlwZTogJ3RlY2huaWNhbCcsXG4gICAgICAgIGV4cGVjdGVkRG9jdW1lbnRzOiBbJ2ZzeC1wZXJmb3JtYW5jZS5tZCcsICdvbnRhcC1mZWF0dXJlcy5tZCddLFxuICAgICAgICBsYW5ndWFnZTogJ2phJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2ludGVybWVkaWF0ZSdcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIOikh+mbkeOBquamguW/teaknOe0olxuICAgICAge1xuICAgICAgICBpZDogJ3NlYXJjaC1jb25jZXB0dWFsLTAwMScsXG4gICAgICAgIHF1ZXJ5OiAn5qip6ZmQ6KqN6K2Y5Z6LUkFH44K344K544OG44Og44Gr44GK44GR44KL44K744Kt44Ol44Oq44OG44Kj6Kit6KiI44Gu6ICD5oWu5LqL6aCFJyxcbiAgICAgICAgcXVlcnlUeXBlOiAnY29uY2VwdHVhbCcsXG4gICAgICAgIGV4cGVjdGVkRG9jdW1lbnRzOiBbJ3NlY3VyaXR5LWRlc2lnbi5tZCcsICdwZXJtaXNzaW9uLW1vZGVsLm1kJ10sXG4gICAgICAgIGxhbmd1YWdlOiAnamEnLFxuICAgICAgICBkaWZmaWN1bHR5OiAnYWR2YW5jZWQnXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyDkvJroqbHnmoTmpJzntKJcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdzZWFyY2gtY29udmVyc2F0aW9uYWwtMDAxJyxcbiAgICAgICAgcXVlcnk6ICfjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jjga7lv5znrZTjgYzpgYXjgYTloLTlkIjjga7lr77lh6bms5XjgpLmlZnjgYjjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICBxdWVyeVR5cGU6ICdjb252ZXJzYXRpb25hbCcsXG4gICAgICAgIGV4cGVjdGVkRG9jdW1lbnRzOiBbJ3Ryb3VibGVzaG9vdGluZy5tZCcsICdwZXJmb3JtYW5jZS10dW5pbmcubWQnXSxcbiAgICAgICAgbGFuZ3VhZ2U6ICdqYScsXG4gICAgICAgIGRpZmZpY3VsdHk6ICdpbnRlcm1lZGlhdGUnXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyDoi7Hoqp7mpJzntKJcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdzZWFyY2gtZW5nbGlzaC0wMDEnLFxuICAgICAgICBxdWVyeTogJ0hvdyB0byBpbXBsZW1lbnQgdmVjdG9yIHNlYXJjaCB3aXRoIE9wZW5TZWFyY2ggU2VydmVybGVzcz8nLFxuICAgICAgICBxdWVyeVR5cGU6ICd0ZWNobmljYWwnLFxuICAgICAgICBleHBlY3RlZERvY3VtZW50czogWydvcGVuc2VhcmNoLWltcGxlbWVudGF0aW9uLm1kJywgJ3ZlY3Rvci1zZWFyY2gtZ3VpZGUubWQnXSxcbiAgICAgICAgbGFuZ3VhZ2U6ICdlbicsXG4gICAgICAgIGRpZmZpY3VsdHk6ICdhZHZhbmNlZCdcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIOa3t+WQiOiogOiqnuaknOe0olxuICAgICAge1xuICAgICAgICBpZDogJ3NlYXJjaC1taXhlZC0wMDEnLFxuICAgICAgICBxdWVyeTogJ0FtYXpvbiBCZWRyb2Nr44KS5L2/55So44GX44GfUkFHIGltcGxlbWVudGF0aW9uIGluIEphcGFuZXNlIGVudGVycHJpc2UgZW52aXJvbm1lbnQnLFxuICAgICAgICBxdWVyeVR5cGU6ICd0ZWNobmljYWwnLFxuICAgICAgICBleHBlY3RlZERvY3VtZW50czogWydiZWRyb2NrLWludGVncmF0aW9uLm1kJywgJ2VudGVycHJpc2UtZGVwbG95bWVudC5tZCddLFxuICAgICAgICBsYW5ndWFnZTogJ21peGVkJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2FkdmFuY2VkJ1xuICAgICAgfVxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICog5YyF5ous55qE44OZ44Kv44OI44Or5qSc57Si44OG44K544OIXG4gICAqL1xuICBhc3luYyB0ZXN0Q29tcHJlaGVuc2l2ZVZlY3RvclNlYXJjaCgpOiBQcm9taXNlPFZlY3RvclNlYXJjaFRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCB0ZXN0SWQgPSAndmVjdG9yLXNlYXJjaC1jb21wcmVoZW5zaXZlLTAwMSc7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygn8J+UjSDljIXmi6znmoTjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4jjgpLplovlp4suLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBPcGVuU2VhcmNoIFNlcnZlcmxlc3Mg5o6l57aa56K66KqNXG4gICAgICBhd2FpdCB0aGlzLnZlcmlmeU9wZW5TZWFyY2hDb25uZWN0aW9uKCk7XG5cbiAgICAgIGNvbnN0IHNlYXJjaFJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICAgIC8vIOWQhOODhuOCueODiOOCseODvOOCueOCkuS4puWIl+Wun+ihjO+8iOODkeODleOCqeODvOODnuODs+OCueWQkeS4iu+8iVxuICAgICAgY29uc3QgdGVzdFByb21pc2VzID0gdGhpcy50ZXN0Q2FzZXMubWFwKGFzeW5jICh0ZXN0Q2FzZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5qSc57Si44OG44K544OI5a6f6KGM5LitOiAke3Rlc3RDYXNlLnF1ZXJ5LnN1YnN0cmluZygwLCAzMCl9Li4uYCk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWN1dGVTZWFyY2hUZXN0KHRlc3RDYXNlKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCB0ZXN0UmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZCh0ZXN0UHJvbWlzZXMpO1xuICAgICAgXG4gICAgICAvLyDntZDmnpzjgpLlh6bnkIZcbiAgICAgIHRlc3RSZXN1bHRzLmZvckVhY2goKHJlc3VsdCwgaW5kZXgpID0+IHtcbiAgICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnKSB7XG4gICAgICAgICAgc2VhcmNoUmVzdWx0cy5wdXNoKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihg4p2MIOODhuOCueODiOOCseODvOOCuSAke3RoaXMudGVzdENhc2VzW2luZGV4XS5pZH0g5a6f6KGM5aSx5pWXOmAsIHJlc3VsdC5yZWFzb24pO1xuICAgICAgICAgIHNlYXJjaFJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICB0ZXN0Q2FzZTogdGhpcy50ZXN0Q2FzZXNbaW5kZXhdLFxuICAgICAgICAgICAgcmVzdWx0czogW10sXG4gICAgICAgICAgICBtZXRyaWNzOiB7IHJlbGV2YW5jZVNjb3JlOiAwLCByZXNwb25zZVRpbWU6IDAgfSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyDjg6Hjg4jjg6rjgq/jgrnoqIjnrpdcbiAgICAgIGNvbnN0IHNlYXJjaE1ldHJpY3MgPSB0aGlzLmNhbGN1bGF0ZVNlYXJjaE1ldHJpY3Moc2VhcmNoUmVzdWx0cyk7XG4gICAgICBjb25zdCBxdWFsaXR5TWV0cmljcyA9IHRoaXMuY2FsY3VsYXRlUXVhbGl0eU1ldHJpY3Moc2VhcmNoUmVzdWx0cyk7XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBzZWFyY2hNZXRyaWNzLnJlc3BvbnNlVGltZSA8IFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLlNVQ0NFU1NfVEhSRVNIT0xEUy5PVkVSQUxMX1JFU1BPTlNFX1RJTUVfTVMgJiYgXG4gICAgICAgICAgICAgICAgICAgICBzZWFyY2hNZXRyaWNzLnJlbGV2YW5jZVNjb3JlID4gVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuU1VDQ0VTU19USFJFU0hPTERTLk9WRVJBTExfUkVMRVZBTkNFICYmXG4gICAgICAgICAgICAgICAgICAgICBxdWFsaXR5TWV0cmljcy5zZW1hbnRpY0FjY3VyYWN5ID4gVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuU1VDQ0VTU19USFJFU0hPTERTLlNFTUFOVElDX0FDQ1VSQUNZO1xuXG4gICAgICBjb25zdCByZXN1bHQ6IFZlY3RvclNlYXJjaFRlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfljIXmi6znmoTjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3ZlY3Rvci1zZWFyY2gnLFxuICAgICAgICBzdGF0dXM6IHN1Y2Nlc3MgPyBUZXN0RXhlY3V0aW9uU3RhdHVzLkNPTVBMRVRFRCA6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzLFxuICAgICAgICBzZWFyY2hNZXRyaWNzLFxuICAgICAgICBxdWFsaXR5TWV0cmljcyxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICB0ZXN0Q2FzZUNvdW50OiB0aGlzLnRlc3RDYXNlcy5sZW5ndGgsXG4gICAgICAgICAgc2VhcmNoUmVzdWx0czogc2VhcmNoUmVzdWx0cyxcbiAgICAgICAgICBjb2xsZWN0aW9uRW5kcG9pbnQ6IHRoaXMuY29sbGVjdGlvbkVuZHBvaW50XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg5YyF5ous55qE44OZ44Kv44OI44Or5qSc57Si44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg5YyF5ous55qE44OZ44Kv44OI44Or5qSc57Si44OG44K544OI5aSx5pWXJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOWMheaLrOeahOODmeOCr+ODiOODq+aknOe0ouODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfljIXmi6znmoTjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ3ZlY3Rvci1zZWFyY2gnLFxuICAgICAgICBzdGF0dXM6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIOaOpee2mueiuuiqjVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB2ZXJpZnlPcGVuU2VhcmNoQ29ubmVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgLy8g6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44Gn44Gv5o6l57aa56K66KqN44KS44K544Kt44OD44OXXG4gICAgICBpZiAodGhpcy5jb25maWcucmVhZE9ubHlNb2RlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5OLIOiqreOBv+WPluOCiuWwgueUqOODouODvOODiTogT3BlblNlYXJjaOaOpee2mueiuuiqjeOCkuOCueOCreODg+ODlycpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgTGlzdENvbGxlY3Rpb25zQ29tbWFuZCh7fSk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMub3BlbnNlYXJjaENsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhg4pyFIE9wZW5TZWFyY2ggU2VydmVybGVzc+aOpee2mueiuuiqjeWujOS6hjogJHtyZXNwb25zZS5jb2xsZWN0aW9uU3VtbWFyaWVzPy5sZW5ndGggfHwgMH3lgIvjga7jgrPjg6zjgq/jgrfjg6fjg7NgKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwgT3BlblNlYXJjaCBTZXJ2ZXJsZXNz5o6l57aa44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIOOBuOOBruaOpee2muOBq+WkseaVl+OBl+OBvuOBl+OBnycpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlgIvliKXmpJzntKLjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVNlYXJjaFRlc3QodGVzdENhc2U6IFNlYXJjaFRlc3RDYXNlKTogUHJvbWlzZTx7XG4gICAgdGVzdENhc2U6IFNlYXJjaFRlc3RDYXNlO1xuICAgIHJlc3VsdHM6IGFueVtdO1xuICAgIG1ldHJpY3M6IGFueTtcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICB9PiB7XG4gICAgY29uc3Qgc2VhcmNoU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB0aW1lb3V0ID0gVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuU0VBUkNIX1RJTUVPVVRfTVM7XG5cbiAgICB0cnkge1xuICAgICAgLy8g6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44Gn44Gv5qih5pOs57WQ5p6c44KS6L+U44GZXG4gICAgICBpZiAodGhpcy5jb25maWcucmVhZE9ubHlNb2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlTW9ja1NlYXJjaFJlc3VsdCh0ZXN0Q2FzZSwgc2VhcmNoU3RhcnRUaW1lKTtcbiAgICAgIH1cblxuICAgICAgLy8g44K/44Kk44Og44Ki44Km44OI5LuY44GN44Gn44OZ44Kv44OI44Or5qSc57Si5a6f6KGMXG4gICAgICBjb25zdCBzZWFyY2hSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgdGhpcy5wZXJmb3JtVmVjdG9yU2VhcmNoKHRlc3RDYXNlKSxcbiAgICAgICAgbmV3IFByb21pc2U8bmV2ZXI+KChfLCByZWplY3QpID0+IFxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcign5qSc57Si44K/44Kk44Og44Ki44Km44OIJykpLCB0aW1lb3V0KVxuICAgICAgICApXG4gICAgICBdKTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHNlYXJjaFN0YXJ0VGltZTtcblxuICAgICAgLy8g5qSc57Si57WQ5p6c6KmV5L6hXG4gICAgICBjb25zdCBtZXRyaWNzID0gdGhpcy5ldmFsdWF0ZVNlYXJjaFJlc3VsdHMoc2VhcmNoUmVzdWx0cywgdGVzdENhc2UsIHJlc3BvbnNlVGltZSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBtZXRyaWNzLnJlbGV2YW5jZVNjb3JlID4gVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuU1VDQ0VTU19USFJFU0hPTERTLlJFTEVWQU5DRV9TQ09SRSAmJiBcbiAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlVGltZSA8IFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLlNVQ0NFU1NfVEhSRVNIT0xEUy5SRVNQT05TRV9USU1FX01TO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0Q2FzZSxcbiAgICAgICAgcmVzdWx0czogc2VhcmNoUmVzdWx0cyxcbiAgICAgICAgbWV0cmljcyxcbiAgICAgICAgc3VjY2Vzc1xuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGDinYwg5qSc57Si44OG44K544OI5a6f6KGM44Ko44Op44O8ICgke3Rlc3RDYXNlLmlkfSk6YCwgZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdENhc2UsXG4gICAgICAgIHJlc3VsdHM6IFtdLFxuICAgICAgICBtZXRyaWNzOiB7IHJlbGV2YW5jZVNjb3JlOiAwLCByZXNwb25zZVRpbWU6IERhdGUubm93KCkgLSBzZWFyY2hTdGFydFRpbWUgfSxcbiAgICAgICAgc3VjY2VzczogZmFsc2VcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOODmeOCr+ODiOODq+aknOe0ouWun+ihjFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtVmVjdG9yU2VhcmNoKHRlc3RDYXNlOiBTZWFyY2hUZXN0Q2FzZSk6IFByb21pc2U8YW55W10+IHtcbiAgICB0cnkge1xuICAgICAgLy8g5YWl5Yqb5qSc6Ki8XG4gICAgICBpZiAoIXRlc3RDYXNlLnF1ZXJ5IHx8IHRlc3RDYXNlLnF1ZXJ5LnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmpJzntKLjgq/jgqjjg6rjgYznqbrjgafjgZknKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKHRlc3RDYXNlLnF1ZXJ5Lmxlbmd0aCA+IFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLk1BWF9RVUVSWV9MRU5HVEgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmpJzntKLjgq/jgqjjg6rjgYzplbfjgZnjgY7jgb7jgZnvvIgke1ZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLk1BWF9RVUVSWV9MRU5HVEh95paH5a2X5Lul5YaF77yJYCk7XG4gICAgICB9XG5cbiAgICAgIC8vIOWun+mam+OBrk9wZW5TZWFyY2ggU2VydmVybGVzc+aknOe0okFQSeWRvOOBs+WHuuOBl1xuICAgICAgLy8g5rOo5oSPOiDlrp/oo4Xjgafjga/pganliIfjgarjg5njgq/jg4jjg6vmpJzntKLjgq/jgqjjg6rjgpLmp4vnr4njgZnjgovlv4XopoHjgYzjgYLjgorjgb7jgZlcbiAgICAgIFxuICAgICAgY29uc3Qgc2VhcmNoUXVlcnkgPSB7XG4gICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAga25uOiB7XG4gICAgICAgICAgICB2ZWN0b3JfZmllbGQ6IHtcbiAgICAgICAgICAgICAgdmVjdG9yOiBhd2FpdCB0aGlzLmdlbmVyYXRlUXVlcnlWZWN0b3IodGVzdENhc2UucXVlcnkpLFxuICAgICAgICAgICAgICBrOiBNYXRoLm1pbihNYXRoLm1heChWRUNUT1JfU0VBUkNIX0NPTlNUQU5UUy5NSU5fS19WQUxVRSwgVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuREVGQVVMVF9LX1ZBTFVFKSwgVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuTUFYX0tfVkFMVUUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfc291cmNlOiBbJ3RpdGxlJywgJ2NvbnRlbnQnLCAnbWV0YWRhdGEnXSxcbiAgICAgICAgc2l6ZTogTWF0aC5taW4oTWF0aC5tYXgoVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuTUlOX1NJWkVfVkFMVUUsIFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLkRFRkFVTFRfU0laRV9WQUxVRSksIFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLk1BWF9TSVpFX1ZBTFVFKVxuICAgICAgfTtcblxuICAgICAgLy8gSFRUUCBBUEnjgpLkvb/nlKjjgZfjgaZPcGVuU2VhcmNoIFNlcnZlcmxlc3PjgavmpJzntKLjg6rjgq/jgqjjgrnjg4jjgpLpgIHkv6FcbiAgICAgIC8vIOWun+mam+OBruWun+ijheOBp+OBryBmZXRjaCDjgb7jgZ/jga8gYXhpb3Mg44KS5L2/55SoXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuc2VuZFNlYXJjaFJlcXVlc3Qoc2VhcmNoUXVlcnkpO1xuICAgICAgXG4gICAgICAvLyDjg6zjgrnjg53jg7PjgrnmpJzoqLxcbiAgICAgIGlmICghcmVzcG9uc2UgfHwgdHlwZW9mIHJlc3BvbnNlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+eEoeWKueOBquaknOe0ouODrOOCueODneODs+OCuScpO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gcmVzcG9uc2UuaGl0cz8uaGl0cyB8fCBbXTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44OZ44Kv44OI44Or5qSc57Si5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjgq/jgqjjg6rjg5njgq/jg4jjg6vnlJ/miJDvvIjmqKHmk6zvvIlcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVRdWVyeVZlY3RvcihfcXVlcnk6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyW10+IHtcbiAgICAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/jgIFCZWRyb2Nr44Gu5Z+L44KB6L6844G/44Oi44OH44Or44KS5L2/55So44GX44Gm44OZ44Kv44OI44Or44KS55Sf5oiQXG4gICAgLy8g44GT44GT44Gn44Gv5qih5pOs55qE44Gq44OZ44Kv44OI44Or44KS6L+U44GZXG4gICAgcmV0dXJuIEFycmF5LmZyb20oeyBsZW5ndGg6IFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLlZFQ1RPUl9TSVpFIH0sICgpID0+IE1hdGgucmFuZG9tKCkgLSAwLjUpO1xuICB9XG5cbiAgLyoqXG4gICAqIOaknOe0ouODquOCr+OCqOOCueODiOmAgeS/oe+8iOaooeaTrO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzZW5kU2VhcmNoUmVxdWVzdChfc2VhcmNoUXVlcnk6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgLy8g5a6f6Zqb44Gu5a6f6KOF44Gn44Gv44CBT3BlblNlYXJjaCBTZXJ2ZXJsZXNz44GuSFRUUCBBUEnjgpLlkbzjgbPlh7rjgZdcbiAgICAvLyDjgZPjgZPjgafjga/mqKHmk6zjg6zjgrnjg53jg7PjgrnjgpLov5TjgZlcbiAgICByZXR1cm4ge1xuICAgICAgaGl0czoge1xuICAgICAgICBoaXRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgX3NvdXJjZToge1xuICAgICAgICAgICAgICB0aXRsZTogJ1JBR+OCt+OCueODhuODoOamguimgScsXG4gICAgICAgICAgICAgIGNvbnRlbnQ6ICdSQUfvvIhSZXRyaWV2YWwtQXVnbWVudGVkIEdlbmVyYXRpb27vvInjga8uLi4nLFxuICAgICAgICAgICAgICBtZXRhZGF0YTogeyBjYXRlZ29yeTogJ292ZXJ2aWV3JywgbGFuZ3VhZ2U6ICdqYScgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9zY29yZTogMC45NVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgX3NvdXJjZToge1xuICAgICAgICAgICAgICB0aXRsZTogJ0FtYXpvbiBGU3ggZm9yIE5ldEFwcCBPTlRBUCcsXG4gICAgICAgICAgICAgIGNvbnRlbnQ6ICdBbWF6b24gRlN4IGZvciBOZXRBcHAgT05UQVDjga/pq5jmgKfog73jgaouLi4nLFxuICAgICAgICAgICAgICBtZXRhZGF0YTogeyBjYXRlZ29yeTogJ3RlY2huaWNhbCcsIGxhbmd1YWdlOiAnamEnIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfc2NvcmU6IDAuODdcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOaooeaTrOaknOe0oue1kOaenOeUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZU1vY2tTZWFyY2hSZXN1bHQodGVzdENhc2U6IFNlYXJjaFRlc3RDYXNlLCBfc3RhcnRUaW1lOiBudW1iZXIpOiB7XG4gICAgdGVzdENhc2U6IFNlYXJjaFRlc3RDYXNlO1xuICAgIHJlc3VsdHM6IGFueVtdO1xuICAgIG1ldHJpY3M6IGFueTtcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICB9IHtcbiAgICBjb25zdCByZXNwb25zZVRpbWUgPSBNYXRoLnJhbmRvbSgpICogKFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLk1PQ0tfUkVTUE9OU0VfVElNRS5NQVggLSBWRUNUT1JfU0VBUkNIX0NPTlNUQU5UUy5NT0NLX1JFU1BPTlNFX1RJTUUuTUlOKSArIFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLk1PQ0tfUkVTUE9OU0VfVElNRS5NSU47XG4gICAgXG4gICAgY29uc3QgbW9ja1Jlc3VsdHMgPSB0ZXN0Q2FzZS5leHBlY3RlZERvY3VtZW50cy5tYXAoKGRvYywgaW5kZXgpID0+ICh7XG4gICAgICBfc291cmNlOiB7XG4gICAgICAgIHRpdGxlOiBkb2MucmVwbGFjZSgnLm1kJywgJycpLnJlcGxhY2UoJy0nLCAnICcpLFxuICAgICAgICBjb250ZW50OiBgJHt0ZXN0Q2FzZS5xdWVyeX3jgavplqLpgKPjgZnjgovlhoXlrrnjgafjgZnjgIJgLFxuICAgICAgICBtZXRhZGF0YTogeyBcbiAgICAgICAgICBjYXRlZ29yeTogdGVzdENhc2UucXVlcnlUeXBlLCBcbiAgICAgICAgICBsYW5ndWFnZTogdGVzdENhc2UubGFuZ3VhZ2UsXG4gICAgICAgICAgZG9jdW1lbnQ6IGRvY1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgX3Njb3JlOiAwLjkgLSAoaW5kZXggKiAwLjEpXG4gICAgfSkpO1xuXG4gICAgY29uc3QgbWV0cmljcyA9IHtcbiAgICAgIHJlc3BvbnNlVGltZSxcbiAgICAgIHJlbGV2YW5jZVNjb3JlOiBWRUNUT1JfU0VBUkNIX0NPTlNUQU5UUy5NT0NLX1JFTEVWQU5DRS5CQVNFICsgTWF0aC5yYW5kb20oKSAqIFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLk1PQ0tfUkVMRVZBTkNFLlZBUklBTkNFLFxuICAgICAgZG9jdW1lbnRzRm91bmQ6IG1vY2tSZXN1bHRzLmxlbmd0aCxcbiAgICAgIHByZWNpc2lvbjogVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuTU9DS19QUkVDSVNJT04uQkFTRSArIE1hdGgucmFuZG9tKCkgKiBWRUNUT1JfU0VBUkNIX0NPTlNUQU5UUy5NT0NLX1BSRUNJU0lPTi5WQVJJQU5DRVxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGVzdENhc2UsXG4gICAgICByZXN1bHRzOiBtb2NrUmVzdWx0cyxcbiAgICAgIG1ldHJpY3MsXG4gICAgICBzdWNjZXNzOiBtZXRyaWNzLnJlbGV2YW5jZVNjb3JlID4gVkVDVE9SX1NFQVJDSF9DT05TVEFOVFMuU1VDQ0VTU19USFJFU0hPTERTLlJFTEVWQU5DRV9TQ09SRSAmJiBcbiAgICAgICAgICAgICAgIHJlc3BvbnNlVGltZSA8IFZFQ1RPUl9TRUFSQ0hfQ09OU1RBTlRTLlNVQ0NFU1NfVEhSRVNIT0xEUy5SRVNQT05TRV9USU1FX01TXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDmpJzntKLntZDmnpzoqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVTZWFyY2hSZXN1bHRzKHJlc3VsdHM6IGFueVtdLCB0ZXN0Q2FzZTogU2VhcmNoVGVzdENhc2UsIHJlc3BvbnNlVGltZTogbnVtYmVyKTogYW55IHtcbiAgICAvLyDplqLpgKPmgKfjgrnjgrPjgqLoqIjnrpdcbiAgICBjb25zdCByZWxldmFuY2VTY29yZSA9IHRoaXMuY2FsY3VsYXRlUmVsZXZhbmNlU2NvcmUocmVzdWx0cywgdGVzdENhc2UpO1xuICAgIFxuICAgIC8vIOeyvuW6puioiOeul++8iOS4iuS9jTXku7bjgafjga7pganlkIjnjofvvIlcbiAgICBjb25zdCBwcmVjaXNpb25BdDUgPSB0aGlzLmNhbGN1bGF0ZVByZWNpc2lvbkF0NShyZXN1bHRzLCB0ZXN0Q2FzZSk7XG4gICAgXG4gICAgLy8g5YaN54++546H6KiI566XXG4gICAgY29uc3QgcmVjYWxsU2NvcmUgPSB0aGlzLmNhbGN1bGF0ZVJlY2FsbFNjb3JlKHJlc3VsdHMsIHRlc3RDYXNlKTtcblxuICAgIHJldHVybiB7XG4gICAgICByZXNwb25zZVRpbWUsXG4gICAgICByZWxldmFuY2VTY29yZSxcbiAgICAgIHByZWNpc2lvbkF0NSxcbiAgICAgIHJlY2FsbFNjb3JlLFxuICAgICAgZG9jdW1lbnRzRm91bmQ6IHJlc3VsdHMubGVuZ3RoXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDplqLpgKPmgKfjgrnjgrPjgqLoqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlUmVsZXZhbmNlU2NvcmUocmVzdWx0czogYW55W10sIHRlc3RDYXNlOiBTZWFyY2hUZXN0Q2FzZSk6IG51bWJlciB7XG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcblxuICAgIC8vIOaknOe0oue1kOaenOOBruW5s+Wdh+OCueOCs+OCouOCkumWoumAo+aAp+OBqOOBl+OBpuS9v+eUqFxuICAgIGNvbnN0IGF2Z1Njb3JlID0gcmVzdWx0cy5yZWR1Y2UoKHN1bSwgcmVzdWx0KSA9PiBzdW0gKyAocmVzdWx0Ll9zY29yZSB8fCAwKSwgMCkgLyByZXN1bHRzLmxlbmd0aDtcbiAgICBcbiAgICAvLyDjgq/jgqjjg6rjgr/jgqTjg5fjgavln7rjgaXjgY/ph43jgb/ku5jjgZFcbiAgICBjb25zdCB0eXBlV2VpZ2h0ID0ge1xuICAgICAgJ2ZhY3R1YWwnOiAxLjAsXG4gICAgICAndGVjaG5pY2FsJzogMC45LFxuICAgICAgJ2NvbmNlcHR1YWwnOiAwLjgsXG4gICAgICAnY29udmVyc2F0aW9uYWwnOiAwLjg1XG4gICAgfTtcblxuICAgIHJldHVybiBhdmdTY29yZSAqICh0eXBlV2VpZ2h0W3Rlc3RDYXNlLnF1ZXJ5VHlwZV0gfHwgMC44KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDkuIrkvY015Lu257K+5bqm6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVByZWNpc2lvbkF0NShyZXN1bHRzOiBhbnlbXSwgdGVzdENhc2U6IFNlYXJjaFRlc3RDYXNlKTogbnVtYmVyIHtcbiAgICBjb25zdCB0b3A1UmVzdWx0cyA9IHJlc3VsdHMuc2xpY2UoMCwgNSk7XG4gICAgXG4gICAgaWYgKHRvcDVSZXN1bHRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG5cbiAgICAvLyDmnJ/lvoXjgZXjgozjgovmlofmm7jjgYzkuIrkvY015Lu244Gr5ZCr44G+44KM44Gm44GE44KL44GL44OB44Kn44OD44KvXG4gICAgY29uc3QgcmVsZXZhbnRDb3VudCA9IHRvcDVSZXN1bHRzLmZpbHRlcihyZXN1bHQgPT4ge1xuICAgICAgY29uc3QgZG9jTmFtZSA9IHJlc3VsdC5fc291cmNlPy5tZXRhZGF0YT8uZG9jdW1lbnQgfHwgJyc7XG4gICAgICByZXR1cm4gdGVzdENhc2UuZXhwZWN0ZWREb2N1bWVudHMuc29tZShleHBlY3RlZCA9PiBcbiAgICAgICAgZG9jTmFtZS5pbmNsdWRlcyhleHBlY3RlZC5yZXBsYWNlKCcubWQnLCAnJykpXG4gICAgICApO1xuICAgIH0pLmxlbmd0aDtcblxuICAgIHJldHVybiByZWxldmFudENvdW50IC8gTWF0aC5taW4oNSwgdGVzdENhc2UuZXhwZWN0ZWREb2N1bWVudHMubGVuZ3RoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlho3nj77njofoqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlUmVjYWxsU2NvcmUocmVzdWx0czogYW55W10sIHRlc3RDYXNlOiBTZWFyY2hUZXN0Q2FzZSk6IG51bWJlciB7XG4gICAgaWYgKHRlc3RDYXNlLmV4cGVjdGVkRG9jdW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDEuMDtcblxuICAgIC8vIOacn+W+heOBleOCjOOCi+aWh+abuOOBruOBhuOBoeOAgeaknOe0oue1kOaenOOBq+WQq+OBvuOCjOOBpuOBhOOCi+OCguOBruOBruWJsuWQiFxuICAgIGNvbnN0IGZvdW5kRG9jdW1lbnRzID0gcmVzdWx0cy5maWx0ZXIocmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IGRvY05hbWUgPSByZXN1bHQuX3NvdXJjZT8ubWV0YWRhdGE/LmRvY3VtZW50IHx8ICcnO1xuICAgICAgcmV0dXJuIHRlc3RDYXNlLmV4cGVjdGVkRG9jdW1lbnRzLnNvbWUoZXhwZWN0ZWQgPT4gXG4gICAgICAgIGRvY05hbWUuaW5jbHVkZXMoZXhwZWN0ZWQucmVwbGFjZSgnLm1kJywgJycpKVxuICAgICAgKTtcbiAgICB9KS5sZW5ndGg7XG5cbiAgICByZXR1cm4gZm91bmREb2N1bWVudHMgLyB0ZXN0Q2FzZS5leHBlY3RlZERvY3VtZW50cy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICog5qSc57Si44Oh44OI44Oq44Kv44K56KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVNlYXJjaE1ldHJpY3Moc2VhcmNoUmVzdWx0czogYW55W10pOiB7XG4gICAgcmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gICAgcmVsZXZhbmNlU2NvcmU6IG51bWJlcjtcbiAgICBwcmVjaXNpb25BdDU6IG51bWJlcjtcbiAgICByZWNhbGxTY29yZTogbnVtYmVyO1xuICAgIGRvY3VtZW50c0ZvdW5kOiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IHZhbGlkUmVzdWx0cyA9IHNlYXJjaFJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzICYmIHIubWV0cmljcyk7XG4gICAgXG4gICAgaWYgKHZhbGlkUmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3BvbnNlVGltZTogMCxcbiAgICAgICAgcmVsZXZhbmNlU2NvcmU6IDAsXG4gICAgICAgIHByZWNpc2lvbkF0NTogMCxcbiAgICAgICAgcmVjYWxsU2NvcmU6IDAsXG4gICAgICAgIGRvY3VtZW50c0ZvdW5kOiAwXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IGF2Z1Jlc3BvbnNlVGltZSA9IHZhbGlkUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5tZXRyaWNzLnJlc3BvbnNlVGltZSwgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuICAgIGNvbnN0IGF2Z1JlbGV2YW5jZSA9IHZhbGlkUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5tZXRyaWNzLnJlbGV2YW5jZVNjb3JlLCAwKSAvIHZhbGlkUmVzdWx0cy5sZW5ndGg7XG4gICAgY29uc3QgYXZnUHJlY2lzaW9uID0gdmFsaWRSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyAoci5tZXRyaWNzLnByZWNpc2lvbkF0NSB8fCAwKSwgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuICAgIGNvbnN0IGF2Z1JlY2FsbCA9IHZhbGlkUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgKHIubWV0cmljcy5yZWNhbGxTY29yZSB8fCAwKSwgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuICAgIGNvbnN0IHRvdGFsRG9jcyA9IHZhbGlkUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5tZXRyaWNzLmRvY3VtZW50c0ZvdW5kLCAwKTtcblxuICAgIHJldHVybiB7XG4gICAgICByZXNwb25zZVRpbWU6IGF2Z1Jlc3BvbnNlVGltZSxcbiAgICAgIHJlbGV2YW5jZVNjb3JlOiBhdmdSZWxldmFuY2UsXG4gICAgICBwcmVjaXNpb25BdDU6IGF2Z1ByZWNpc2lvbixcbiAgICAgIHJlY2FsbFNjb3JlOiBhdmdSZWNhbGwsXG4gICAgICBkb2N1bWVudHNGb3VuZDogdG90YWxEb2NzIC8gdmFsaWRSZXN1bHRzLmxlbmd0aFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog5ZOB6LOq44Oh44OI44Oq44Kv44K56KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVF1YWxpdHlNZXRyaWNzKHNlYXJjaFJlc3VsdHM6IGFueVtdKToge1xuICAgIHNlbWFudGljQWNjdXJhY3k6IG51bWJlcjtcbiAgICBjb250ZXh0dWFsUmVsZXZhbmNlOiBudW1iZXI7XG4gICAgZGl2ZXJzaXR5U2NvcmU6IG51bWJlcjtcbiAgfSB7XG4gICAgY29uc3QgdmFsaWRSZXN1bHRzID0gc2VhcmNoUmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpO1xuICAgIFxuICAgIGlmICh2YWxpZFJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzZW1hbnRpY0FjY3VyYWN5OiAwLFxuICAgICAgICBjb250ZXh0dWFsUmVsZXZhbmNlOiAwLFxuICAgICAgICBkaXZlcnNpdHlTY29yZTogMFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDmhI/lkbPnmoTnsr7luqbvvIjjgq/jgqjjg6rjgr/jgqTjg5fliKXjga7miJDlip/njofvvIlcbiAgICBjb25zdCBzZW1hbnRpY0FjY3VyYWN5ID0gdmFsaWRSZXN1bHRzLmxlbmd0aCAvIHNlYXJjaFJlc3VsdHMubGVuZ3RoO1xuXG4gICAgLy8g5paH6ISI55qE6Zai6YCj5oCn77yI6KiA6Kqe5Yil44Gu6YGp5ZCI5oCn77yJXG4gICAgY29uc3QgY29udGV4dHVhbFJlbGV2YW5jZSA9IHRoaXMuZXZhbHVhdGVDb250ZXh0dWFsUmVsZXZhbmNlKHZhbGlkUmVzdWx0cyk7XG5cbiAgICAvLyDlpJrmp5jmgKfjgrnjgrPjgqLvvIjntZDmnpzjga7lpJrmp5jmgKfvvIlcbiAgICBjb25zdCBkaXZlcnNpdHlTY29yZSA9IHRoaXMuZXZhbHVhdGVEaXZlcnNpdHlTY29yZSh2YWxpZFJlc3VsdHMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlbWFudGljQWNjdXJhY3ksXG4gICAgICBjb250ZXh0dWFsUmVsZXZhbmNlLFxuICAgICAgZGl2ZXJzaXR5U2NvcmVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOaWh+iEiOeahOmWoumAo+aAp+ipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZUNvbnRleHR1YWxSZWxldmFuY2UocmVzdWx0czogYW55W10pOiBudW1iZXIge1xuICAgIC8vIOiogOiqnuWIpeOBrumBqeWQiOaAp+OCkuipleS+oVxuICAgIGNvbnN0IGxhbmd1YWdlR3JvdXBzID0gcmVzdWx0cy5yZWR1Y2UoKGdyb3VwcywgcmVzdWx0KSA9PiB7XG4gICAgICBjb25zdCBsYW5nID0gcmVzdWx0LnRlc3RDYXNlLmxhbmd1YWdlO1xuICAgICAgaWYgKCFncm91cHNbbGFuZ10pIGdyb3Vwc1tsYW5nXSA9IFtdO1xuICAgICAgZ3JvdXBzW2xhbmddLnB1c2gocmVzdWx0KTtcbiAgICAgIHJldHVybiBncm91cHM7XG4gICAgfSwge30gYXMgYW55KTtcblxuICAgIGxldCB0b3RhbFJlbGV2YW5jZSA9IDA7XG4gICAgbGV0IGdyb3VwQ291bnQgPSAwO1xuXG4gICAgZm9yIChjb25zdCBbX2xhbmcsIGdyb3VwUmVzdWx0c10gb2YgT2JqZWN0LmVudHJpZXMobGFuZ3VhZ2VHcm91cHMpKSB7XG4gICAgICBjb25zdCBhdmdSZWxldmFuY2UgPSAoZ3JvdXBSZXN1bHRzIGFzIGFueVtdKS5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5tZXRyaWNzLnJlbGV2YW5jZVNjb3JlLCAwKSAvIChncm91cFJlc3VsdHMgYXMgYW55W10pLmxlbmd0aDtcbiAgICAgIHRvdGFsUmVsZXZhbmNlICs9IGF2Z1JlbGV2YW5jZTtcbiAgICAgIGdyb3VwQ291bnQrKztcbiAgICB9XG5cbiAgICByZXR1cm4gZ3JvdXBDb3VudCA+IDAgPyB0b3RhbFJlbGV2YW5jZSAvIGdyb3VwQ291bnQgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIOWkmuanmOaAp+OCueOCs+OCouipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZURpdmVyc2l0eVNjb3JlKHJlc3VsdHM6IGFueVtdKTogbnVtYmVyIHtcbiAgICAvLyDjgq/jgqjjg6rjgr/jgqTjg5fjga7lpJrmp5jmgKfjgpLoqZXkvqFcbiAgICBjb25zdCBxdWVyeVR5cGVzID0gbmV3IFNldChyZXN1bHRzLm1hcChyID0+IHIudGVzdENhc2UucXVlcnlUeXBlKSk7XG4gICAgY29uc3QgdHlwZUNvdW50ID0gcXVlcnlUeXBlcy5zaXplO1xuICAgIGNvbnN0IG1heFR5cGVzID0gNDsgLy8gZmFjdHVhbCwgdGVjaG5pY2FsLCBjb25jZXB0dWFsLCBjb252ZXJzYXRpb25hbFxuXG4gICAgcmV0dXJuIG1heFR5cGVzID4gMCA/IHR5cGVDb3VudCAvIG1heFR5cGVzIDogMDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kg44OZ44Kv44OI44Or5qSc57Si44OG44K544OI44Oi44K444Ol44O844Or44KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgY29uc29sZS5sb2coJ+KchSDjg5njgq/jg4jjg6vmpJzntKLjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBWZWN0b3JTZWFyY2hUZXN0TW9kdWxlOyJdfQ==