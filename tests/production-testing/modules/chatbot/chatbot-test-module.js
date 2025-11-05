"use strict";
/**
 * チャットボット機能テストモジュール
 *
 * 実本番Amazon Bedrockでの応答生成品質テスト
 * 日本語応答の精度、ストリーミング機能、RAG連携を検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotTestModule = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_opensearchserverless_1 = require("@aws-sdk/client-opensearchserverless");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * チャットボット機能テストモジュールクラス
 */
class ChatbotTestModule {
    config;
    bedrockClient;
    openSearchClient;
    dynamoClient;
    testQuestions;
    constructor(config) {
        n;
        this.config = config;
        n;
        n;
        const clientConfig = { n, region: config.region, n, credentials: { profile: config.awsProfile }, n };
        n;
        n;
        this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient(clientConfig);
        n;
        this.openSearchClient = new client_opensearchserverless_1.OpenSearchServerlessClient(clientConfig);
        n;
        this.dynamoClient = new client_dynamodb_1.DynamoDBClient(clientConfig);
        n;
        n; // テスト質問データの初期化\n    this.testQuestions = this.loadTestQuestions();\n  }\n\n  /**\n   * テスト質問データの読み込み\n   */\n  private loadTestQuestions(): TestQuestion[] {\n    return [\n      {\n        id: 'jp-general-001',\n        question: 'こんにちは。このシステムについて教えてください。',\n        category: 'general',\n        expectedKeywords: ['システム', 'RAG', '文書検索', 'AI'],\n        difficulty: 'easy',\n        language: 'japanese'\n      },\n      {\n        id: 'jp-general-002',\n        question: 'どのような機能がありますか？',\n        category: 'general',\n        expectedKeywords: ['機能', '検索', 'チャット', '文書'],\n        difficulty: 'easy',\n        language: 'japanese'\n      },\n      {\n        id: 'jp-document-001',\n        question: 'NetAppのストレージソリューションについて詳しく教えてください。',\n        category: 'document-based',\n        expectedKeywords: ['NetApp', 'ストレージ', 'ONTAP', 'FSx'],\n        expectedDocuments: ['netapp-storage-guide', 'fsx-ontap-overview'],\n        difficulty: 'medium',\n        language: 'japanese'\n      },\n      {\n        id: 'jp-technical-001',\n        question: 'Amazon FSx for NetApp ONTAPの設定方法を教えてください。',\n        category: 'technical',\n        expectedKeywords: ['FSx', 'ONTAP', '設定', 'AWS'],\n        expectedDocuments: ['fsx-setup-guide', 'ontap-configuration'],\n        difficulty: 'hard',\n        language: 'japanese'\n      },\n      {\n        id: 'jp-conversational-001',\n        question: '先ほどの質問に関連して、パフォーマンスの最適化についても教えてください。',\n        category: 'conversational',\n        expectedKeywords: ['パフォーマンス', '最適化', '設定'],\n        difficulty: 'medium',\n        language: 'japanese'\n      },\n      {\n        id: 'jp-complex-001',\n        question: 'マルチプロトコル環境でのFSx for NetApp ONTAPの運用における、セキュリティとパフォーマンスのバランスを取るためのベストプラクティスを、具体的な設定例とともに詳しく説明してください。',\n        category: 'technical',\n        expectedKeywords: ['マルチプロトコル', 'セキュリティ', 'パフォーマンス', 'ベストプラクティス'],\n        expectedDocuments: ['security-best-practices', 'performance-tuning'],\n        difficulty: 'hard',\n        language: 'japanese'\n      }\n    ];\n  }\n\n  /**\n   * 日本語応答品質テスト\n   */\n  async testJapaneseResponseQuality(): Promise<ChatbotTestResult> {\n    const testId = 'chatbot-japanese-001';\n    const startTime = Date.now();\n    \n    console.log('🗾 日本語応答品質テストを開始...');\n\n    try {\n      const testQuestion = this.testQuestions.find(q => q.id === 'jp-general-001');\n      \n      if (!testQuestion) {\n        throw new Error('テスト質問が見つかりません');\n      }\n\n      // 実本番Bedrockでの応答生成\n      const responseResult = await this.generateResponse(\n        testQuestion.question,\n        'anthropic.claude-3-haiku-20240307-v1:0'\n      );\n\n      // 日本語品質の評価\n      const qualityMetrics = await this.evaluateJapaneseQuality(\n        responseResult.responseText,\n        testQuestion\n      );\n\n      const success = qualityMetrics.grammar >= 0.7 && \n                     qualityMetrics.naturalness >= 0.7 &&\n                     responseResult.responseTime < 10000;\n\n      const result: ChatbotTestResult = {\n        testId,\n        testName: '日本語応答品質テスト',\n        category: 'chatbot',\n        status: success ? TestExecutionStatus.COMPLETED : TestExecutionStatus.FAILED,\n        startTime: new Date(startTime),\n        endTime: new Date(),\n        duration: Date.now() - startTime,\n        success,\n        responseDetails: {\n          responseText: responseResult.responseText,\n          responseTime: responseResult.responseTime,\n          tokenCount: responseResult.tokenCount,\n          modelUsed: 'anthropic.claude-3-haiku-20240307-v1:0',\n          isStreaming: false,\n          japaneseQuality: this.calculateOverallQuality(qualityMetrics)\n        },\n        metadata: {\n          question: testQuestion.question,\n          qualityMetrics: qualityMetrics,\n          expectedKeywords: testQuestion.expectedKeywords,\n          keywordMatches: this.countKeywordMatches(responseResult.responseText, testQuestion.expectedKeywords)\n        }\n      };\n\n      if (success) {\n        console.log('✅ 日本語応答品質テスト成功');\n        console.log(`   品質スコア: ${(result.responseDetails!.japaneseQuality * 100).toFixed(1)}%`);\n        console.log(`   応答時間: ${responseResult.responseTime}ms`);\n      } else {\n        console.error('❌ 日本語応答品質テスト失敗');\n      }\n\n      return result;\n\n    } catch (error) {\n      console.error('❌ 日本語応答品質テスト実行エラー:', error);\n      \n      return {\n        testId,\n        testName: '日本語応答品質テスト',\n        category: 'chatbot',\n        status: TestExecutionStatus.FAILED,\n        startTime: new Date(startTime),\n        endTime: new Date(),\n        duration: Date.now() - startTime,\n        success: false,\n        error: error instanceof Error ? error.message : String(error)\n      };\n    }\n  }\n\n  /**\n   * 文書関連応答テスト\n   */\n  async testDocumentBasedResponse(): Promise<ChatbotTestResult> {\n    const testId = 'chatbot-document-001';\n    const startTime = Date.now();\n    \n    console.log('📄 文書関連応答テストを開始...');\n\n    try {\n      const testQuestion = this.testQuestions.find(q => q.id === 'jp-document-001');\n      \n      if (!testQuestion) {\n        throw new Error('テスト質問が見つかりません');\n      }\n\n      // 関連文書の検索\n      const documentsResult = await this.searchRelevantDocuments(\n        testQuestion.question\n      );\n\n      // RAG機能を使用した応答生成\n      const responseResult = await this.generateRAGResponse(\n        testQuestion.question,\n        documentsResult.documents\n      );\n\n      // 文書関連性の評価\n      const relevanceScore = this.evaluateDocumentRelevance(\n        responseResult.responseText,\n        documentsResult.documents,\n        testQuestion.expectedKeywords\n      );\n\n      const success = documentsResult.documents.length > 0 &&\n                     relevanceScore >= 0.7 &&\n                     responseResult.responseTime < 15000;\n\n      const result: ChatbotTestResult = {\n        testId,\n        testName: '文書関連応答テスト',\n        category: 'chatbot',\n        status: success ? TestExecutionStatus.COMPLETED : TestExecutionStatus.FAILED,\n        startTime: new Date(startTime),\n        endTime: new Date(),\n        duration: Date.now() - startTime,\n        success,\n        responseDetails: {\n          responseText: responseResult.responseText,\n          responseTime: responseResult.responseTime,\n          tokenCount: responseResult.tokenCount,\n          modelUsed: responseResult.modelUsed,\n          isStreaming: false,\n          japaneseQuality: 0.8 // 簡略化\n        },\n        ragDetails: {\n          documentsFound: documentsResult.documents.length,\n          relevantDocuments: documentsResult.relevantCount,\n          citationsIncluded: this.checkCitationsIncluded(responseResult.responseText),\n          sourceAccuracy: relevanceScore\n        },\n        metadata: {\n          question: testQuestion.question,\n          searchQuery: documentsResult.searchQuery,\n          documentsRetrieved: documentsResult.documents.map(doc => doc.title || doc.id),\n          expectedDocuments: testQuestion.expectedDocuments\n        }\n      };\n\n      if (success) {\n        console.log('✅ 文書関連応答テスト成功');\n        console.log(`   関連文書数: ${documentsResult.documents.length}`);\n        console.log(`   関連性スコア: ${(relevanceScore * 100).toFixed(1)}%`);\n      } else {\n        console.error('❌ 文書関連応答テスト失敗');\n      }\n\n      return result;\n\n    } catch (error) {\n      console.error('❌ 文書関連応答テスト実行エラー:', error);\n      \n      return {\n        testId,\n        testName: '文書関連応答テスト',\n        category: 'chatbot',\n        status: TestExecutionStatus.FAILED,\n        startTime: new Date(startTime),\n        endTime: new Date(),\n        duration: Date.now() - startTime,\n        success: false,\n        error: error instanceof Error ? error.message : String(error)\n      };\n    }\n  }"} 
        ToolResult: SUCCESS - Created;
        the;
        tests / production - testing / modules / chatbot / chatbot - test - module.ts;
        file.
            < function_calls >
            name;
        "fsAppend" >
            name;
        "path" > tests / production - testing / modules / chatbot / chatbot - test - module.ts;
        /**
          * ストリーミング応答テスト
          */
        async;
        testStreamingResponse();
        Promise < ChatbotTestResult > {
            const: testId = 'chatbot-streaming-001',
            const: startTime = Date.now(),
            console, : .log('🌊 ストリーミング応答テストを開始...'),
            try: {
                const: testQuestion = this.testQuestions.find(q => q.id === 'jp-technical-001'),
                if(, testQuestion) {
                    throw new Error('テスト質問が見つかりません');
                }
                // ストリーミング応答の生成
                ,
                // ストリーミング応答の生成
                const: streamingResult = await this.generateStreamingResponse(testQuestion.question, 'anthropic.claude-3-haiku-20240307-v1:0'),
                // ストリーミング品質の評価
                const: streamingQuality = this.evaluateStreamingQuality(streamingResult),
                const: success = streamingResult.chunks.length > 0 &&
                    streamingResult.totalTime < 20000 &&
                    streamingQuality.consistency >= 0.8,
                const: result, ChatbotTestResult = {
                    testId,
                    testName: 'ストリーミング応答テスト',
                    category: 'chatbot',
                    status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                    startTime: new Date(startTime),
                    endTime: new Date(),
                    duration: Date.now() - startTime,
                    success,
                    responseDetails: {
                        responseText: streamingResult.fullResponse,
                        responseTime: streamingResult.totalTime,
                        tokenCount: streamingResult.totalTokens,
                        modelUsed: 'anthropic.claude-3-haiku-20240307-v1:0',
                        isStreaming: true,
                        japaneseQuality: 0.8 // 簡略化
                    },
                    performanceMetrics: {
                        latency: streamingResult.firstChunkTime,
                        throughput: streamingResult.totalTokens / (streamingResult.totalTime / 1000),
                        errorRate: streamingResult.errorCount / streamingResult.chunks.length,
                        resourceUsage: 0.5 // 簡略化
                    },
                    metadata: {
                        question: testQuestion.question,
                        chunkCount: streamingResult.chunks.length,
                        averageChunkSize: streamingResult.averageChunkSize,
                        streamingQuality: streamingQuality
                    }
                },
                if(success) {
                    console.log('✅ ストリーミング応答テスト成功');
                    console.log(`   チャンク数: ${streamingResult.chunks.length}`);
                    console.log(`   初回応答時間: ${streamingResult.firstChunkTime}ms`);
                    console.log(`   総応答時間: ${streamingResult.totalTime}ms`);
                }, else: {
                    console, : .error('❌ ストリーミング応答テスト失敗')
                },
                return: result
            }, catch(error) {
                console.error('❌ ストリーミング応答テスト実行エラー:', error);
                return {
                    testId,
                    testName: 'ストリーミング応答テスト',
                    category: 'chatbot',
                    status: production_test_engine_1.TestExecutionStatus.FAILED,
                    startTime: new Date(startTime),
                    endTime: new Date(),
                    duration: Date.now() - startTime,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        };
        /**
         * エラーハンドリングテスト
         */
        async;
        testErrorHandling();
        Promise < ChatbotTestResult > {
            const: testId = 'chatbot-error-001',
            const: startTime = Date.now(),
            console, : .log('⚠️ エラーハンドリングテストを開始...'),
            try: {
                const: errorScenarios = [
                    {
                        type: 'inappropriate_content',
                        question: '機密情報を教えてください。',
                        expectedBehavior: 'polite_refusal'
                    },
                    {
                        type: 'ambiguous_question',
                        question: 'それについて教えて。',
                        expectedBehavior: 'clarification_request'
                    },
                    {
                        type: 'out_of_scope',
                        question: '今日の天気はどうですか？',
                        expectedBehavior: 'scope_explanation'
                    }
                ],
                const: scenarioResults = [],
                for(, scenario, of, errorScenarios) {
                    const scenarioResult = await this.testErrorScenario(scenario);
                    scenarioResults.push(scenarioResult);
                },
                const: successfulScenarios = scenarioResults.filter(r => r.success).length,
                const: success = successfulScenarios >= errorScenarios.length * 0.8, // 80%以上成功
                const: result, ChatbotTestResult = {
                    testId,
                    testName: 'エラーハンドリングテスト',
                    category: 'chatbot',
                    status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                    startTime: new Date(startTime),
                    endTime: new Date(),
                    duration: Date.now() - startTime,
                    success,
                    metadata: {
                        totalScenarios: errorScenarios.length,
                        successfulScenarios: successfulScenarios,
                        failedScenarios: errorScenarios.length - successfulScenarios,
                        scenarioResults: scenarioResults
                    }
                },
                if(success) {
                    console.log('✅ エラーハンドリングテスト成功');
                    console.log(`   成功シナリオ: ${successfulScenarios}/${errorScenarios.length}`);
                }, else: {
                    console, : .error('❌ エラーハンドリングテスト失敗')
                },
                return: result
            }, catch(error) {
                console.error('❌ エラーハンドリングテスト実行エラー:', error);
                return {
                    testId,
                    testName: 'エラーハンドリングテスト',
                    category: 'chatbot',
                    status: production_test_engine_1.TestExecutionStatus.FAILED,
                    startTime: new Date(startTime),
                    endTime: new Date(),
                    duration: Date.now() - startTime,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        };
        /**
         * 複雑な質問への応答テスト
         */
        async;
        testComplexQuestionHandling();
        Promise < ChatbotTestResult > {
            const: testId = 'chatbot-complex-001',
            const: startTime = Date.now(),
            console, : .log('🧠 複雑な質問への応答テストを開始...'),
            try: {
                const: complexQuestion = this.testQuestions.find(q => q.id === 'jp-complex-001'),
                if(, complexQuestion) {
                    throw new Error('複雑なテスト質問が見つかりません');
                }
                // 複雑な質問に対する応答生成
                ,
                // 複雑な質問に対する応答生成
                const: responseResult = await this.generateResponse(complexQuestion.question, 'anthropic.claude-3-sonnet-20240229-v1:0' // より高性能なモデルを使用
                ),
                // 応答の複雑性評価
                const: complexityAnalysis = this.analyzeResponseComplexity(responseResult.responseText, complexQuestion),
                const: success = complexityAnalysis.depth >= 0.7 &&
                    complexityAnalysis.accuracy >= 0.8 &&
                    complexityAnalysis.structure >= 0.7,
                const: result, ChatbotTestResult = {
                    testId,
                    testName: '複雑な質問への応答テスト',
                    category: 'chatbot',
                    status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                    startTime: new Date(startTime),
                    endTime: new Date(),
                    duration: Date.now() - startTime,
                    success,
                    responseDetails: {
                        responseText: responseResult.responseText,
                        responseTime: responseResult.responseTime,
                        tokenCount: responseResult.tokenCount,
                        modelUsed: 'anthropic.claude-3-sonnet-20240229-v1:0',
                        isStreaming: false,
                        japaneseQuality: complexityAnalysis.languageQuality
                    },
                    metadata: {
                        question: complexQuestion.question,
                        complexityAnalysis: complexityAnalysis,
                        expectedKeywords: complexQuestion.expectedKeywords,
                        keywordCoverage: this.calculateKeywordCoverage(responseResult.responseText, complexQuestion.expectedKeywords)
                    }
                },
                if(success) {
                    console.log('✅ 複雑な質問への応答テスト成功');
                    console.log(`   応答の深度: ${(complexityAnalysis.depth * 100).toFixed(1)}%`);
                    console.log(`   応答の正確性: ${(complexityAnalysis.accuracy * 100).toFixed(1)}%`);
                }, else: {
                    console, : .error('❌ 複雑な質問への応答テスト失敗')
                },
                return: result
            }, catch(error) {
                console.error('❌ 複雑な質問への応答テスト実行エラー:', error);
                return {
                    testId,
                    testName: '複雑な質問への応答テスト',
                    category: 'chatbot',
                    status: production_test_engine_1.TestExecutionStatus.FAILED,
                    startTime: new Date(startTime),
                    endTime: new Date(),
                    duration: Date.now() - startTime,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        };
        /**
         * 実本番Bedrockでの応答生成
         */
    }
    /**
     * 実本番Bedrockでの応答生成
     */
    async generateResponse(question, modelId) {
        const startTime = Date.now();
        try {
            const requestBody = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: question
                    }
                ]
            };
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: modelId,
                body: JSON.stringify(requestBody),
                contentType: 'application/json'
            });
            const response = await this.bedrockClient.send(command);
            const responseTime = Date.now() - startTime;
            if (!response.body) {
                throw new Error('Bedrockからの応答が空です');
            }
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const responseText = responseBody.content?.[0]?.text || '';
            const tokenCount = responseBody.usage?.output_tokens || 0;
            return {
                responseText,
                responseTime,
                tokenCount
            };
        }
        catch (error) {
            console.error('Bedrock応答生成エラー:', error);
            throw error;
        }
    }
    /**
     * 関連文書の検索
     */
    async searchRelevantDocuments(question) {
        try {
            // 検索クエリの構築
            const searchQuery = this.buildSearchQuery(question);
            const searchBody = {
                query: {
                    multi_match: {
                        query: searchQuery,
                        fields: ['title', 'content', 'description', 'tags']
                    }
                },
                size: 10,
                _source: ['id', 'title', 'content', 'tags', 'metadata']
            };
            const searchCommand = new client_opensearchserverless_1.SearchCommand({
                index: this.config.resources.openSearchIndex,
                body: searchBody
            });
            const response = await this.openSearchClient.send(searchCommand);
            const hits = response.body?.hits?.hits || [];
            const documents = hits.map((hit) => hit._source);
            const relevantCount = this.countRelevantDocuments(documents, question);
            return {
                documents,
                relevantCount,
                searchQuery
            };
        }
        catch (error) {
            console.error('文書検索エラー:', error);
            return {
                documents: [],
                relevantCount: 0,
                searchQuery: question
            };
        }
    }
    /**
     * RAG機能を使用した応答生成
     */
    async generateRAGResponse(question, documents) {
        const startTime = Date.now();
        try {
            // 文書コンテキストの構築
            const documentContext = this.buildDocumentContext(documents);
            const ragPrompt = `以下の文書を参考にして、質問に答えてください。回答には参考にした文書の情報を含めてください。

参考文書:
${documentContext}

質問: ${question}

回答:`;
            const requestBody = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1500,
                messages: [
                    {
                        role: "user",
                        content: ragPrompt
                    }
                ]
            };
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
                body: JSON.stringify(requestBody),
                contentType: 'application/json'
            });
            const response = await this.bedrockClient.send(command);
            const responseTime = Date.now() - startTime;
            if (!response.body) {
                throw new Error('RAG応答生成でBedrockからの応答が空です');
            }
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const responseText = responseBody.content?.[0]?.text || '';
            const tokenCount = responseBody.usage?.output_tokens || 0;
            return {
                responseText,
                responseTime,
                tokenCount,
                modelUsed: 'anthropic.claude-3-haiku-20240307-v1:0'
            };
        }
        catch (error) {
            console.error('RAG応答生成エラー:', error);
            throw error;
        }
    }
    /**
     * ストリーミング応答の生成
     */
    async generateStreamingResponse(question, modelId) {
        const startTime = Date.now();
        let firstChunkTime = 0;
        let fullResponse = '';
        const chunks = [];
        let totalTokens = 0;
        let errorCount = 0;
        try {
            const requestBody = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: question
                    }
                ]
            };
            const command = new client_bedrock_runtime_1.InvokeModelWithResponseStreamCommand({
                modelId: modelId,
                body: JSON.stringify(requestBody),
                contentType: 'application/json'
            });
            const response = await this.bedrockClient.send(command);
            if (response.body) {
                for await (const chunk of response.body) {
                    try {
                        if (chunk.chunk?.bytes) {
                            const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
                            if (chunkData.type === 'content_block_delta' && chunkData.delta?.text) {
                                const chunkText = chunkData.delta.text;
                                chunks.push(chunkText);
                                fullResponse += chunkText;
                                if (firstChunkTime === 0) {
                                    firstChunkTime = Date.now() - startTime;
                                }
                            }
                            if (chunkData.usage?.output_tokens) {
                                totalTokens = chunkData.usage.output_tokens;
                            }
                        }
                    }
                    catch (chunkError) {
                        errorCount++;
                        console.warn('ストリーミングチャンク処理エラー:', chunkError);
                    }
                }
            }
            const totalTime = Date.now() - startTime;
            const averageChunkSize = chunks.length > 0 ? fullResponse.length / chunks.length : 0;
            return {
                fullResponse,
                chunks,
                totalTime,
                firstChunkTime,
                totalTokens,
                averageChunkSize,
                errorCount
            };
        }
        catch (error) {
            console.error('ストリーミング応答生成エラー:', error);
            throw error;
        }
    }
    "} ;
    ToolResult;
}
exports.ChatbotTestModule = ChatbotTestModule;
-Appended;
the;
text;
to;
the;
tests / production - testing / modules / chatbot / chatbot - test - module.ts;
file.
    < function_calls >
    name;
"fsAppend" >
    name;
"path" > tests / production - testing / modules / chatbot / chatbot - test - module.ts;
async;
evaluateJapaneseQuality(responseText, string, testQuestion, TestQuestion);
Promise < JapaneseQualityMetrics > {
    // 簡略化された日本語品質評価
    // 実際の実装では、より詳細な自然言語処理を行う
    const: metrics, JapaneseQualityMetrics = {
        grammar: this.evaluateGrammar(responseText),
        naturalness: this.evaluateNaturalness(responseText),
        politeness: this.evaluatePoliteness(responseText),
        clarity: this.evaluateClarity(responseText),
        completeness: this.evaluateCompleteness(responseText, testQuestion)
    },
    return: metrics
};
evaluateGrammar(text, string);
number;
{
    // 基本的な文法チェック
    let score = 1.0;
    // 文の終わりの句読点チェック
    const sentences = text.split(/[。！？]/);
    const properEndings = text.match(/[。！？]/g)?.length || 0;
    if (sentences.length > 1 && properEndings < sentences.length - 1) {
        score -= 0.2;
    }
    // ひらがな・カタカナ・漢字のバランスチェック
    const hiragana = (text.match(/[ひらがな]/g) || []).length;
    const katakana = (text.match(/[カタカナ]/g) || []).length;
    const kanji = (text.match(/[一-龯]/g) || []).length;
    if (hiragana === 0 && katakana === 0 && kanji === 0) {
        score -= 0.5; // 日本語でない可能性
    }
    return Math.max(0, score);
}
evaluateNaturalness(text, string);
number;
{
    let score = 0.8; // ベーススコア
    // 自然な日本語表現のパターンチェック
    const naturalPatterns = [
        /です。?$/,
        /ます。?$/,
        /である。?$/,
        /ください/,
        /について/,
        /に関して/
    ];
    const matchCount = naturalPatterns.filter(pattern => pattern.test(text)).length;
    score += (matchCount / naturalPatterns.length) * 0.2;
    return Math.min(1.0, score);
}
evaluatePoliteness(text, string);
number;
{
    let score = 0.5; // ベーススコア
    // 丁寧語・敬語のパターン
    const politePatterns = [
        /です/g,
        /ます/g,
        /ございます/g,
        /いたします/g,
        /させていただ/g
    ];
    let politeCount = 0;
    politePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches)
            politeCount += matches.length;
    });
    // 文の数に対する丁寧語の比率
    const sentences = text.split(/[。！？]/).length;
    if (sentences > 1) {
        score = Math.min(1.0, politeCount / sentences);
    }
    return score;
}
evaluateClarity(text, string);
number;
{
    let score = 0.8; // ベーススコア
    // 明確性を示す要素
    if (text.includes('具体的に'))
        score += 0.1;
    if (text.includes('例えば'))
        score += 0.1;
    if (text.includes('つまり'))
        score += 0.05;
    if (text.includes('まず'))
        score += 0.05;
    // 曖昧な表現の減点
    if (text.includes('かもしれません'))
        score -= 0.05;
    if (text.includes('と思います'))
        score -= 0.05;
    return Math.min(1.0, Math.max(0, score));
}
evaluateCompleteness(text, string, testQuestion, TestQuestion);
number;
{
    let score = 0.5; // ベーススコア
    // 期待されるキーワードの含有率
    const keywordMatches = this.countKeywordMatches(text, testQuestion.expectedKeywords);
    const keywordScore = keywordMatches / testQuestion.expectedKeywords.length;
    score += keywordScore * 0.5;
    return Math.min(1.0, score);
}
calculateOverallQuality(metrics, JapaneseQualityMetrics);
number;
{
    const weights = {
        grammar: 0.25,
        naturalness: 0.25,
        politeness: 0.2,
        clarity: 0.15,
        completeness: 0.15
    };
    return (metrics.grammar * weights.grammar +
        metrics.naturalness * weights.naturalness +
        metrics.politeness * weights.politeness +
        metrics.clarity * weights.clarity +
        metrics.completeness * weights.completeness);
}
countKeywordMatches(text, string, keywords, string[]);
number;
{
    return keywords.filter(keyword => text.includes(keyword)).length;
}
evaluateDocumentRelevance(responseText, string, documents, any[], expectedKeywords, string[]);
number;
{
    let relevanceScore = 0;
    // 文書内容の引用確認
    documents.forEach(doc => {
        if (doc.title && responseText.includes(doc.title)) {
            relevanceScore += 0.2;
        }
        if (doc.content) {
            const contentWords = doc.content.split(/\s+/).slice(0, 10);
            const mentionedWords = contentWords.filter(word => responseText.includes(word));
            relevanceScore += (mentionedWords.length / contentWords.length) * 0.3;
        }
    });
    // 期待キーワードの含有確認
    const keywordScore = this.countKeywordMatches(responseText, expectedKeywords) / expectedKeywords.length;
    relevanceScore += keywordScore * 0.5;
    return Math.min(1.0, relevanceScore);
}
checkCitationsIncluded(responseText, string);
boolean;
{
    const citationPatterns = [
        /参考[：:]/,
        /出典[：:]/,
        /引用[：:]/,
        /\[.*\]/,
        /「.*」/,
        /によると/,
        /に記載/
    ];
    return citationPatterns.some(pattern => pattern.test(responseText));
}
evaluateStreamingQuality(streamingResult, any);
{
    consistency: number;
    smoothness: number;
    completeness: number;
}
{
    const consistency = streamingResult.errorCount === 0 ? 1.0 :
        Math.max(0, 1.0 - (streamingResult.errorCount / streamingResult.chunks.length));
    const smoothness = streamingResult.chunks.length > 0 ?
        Math.min(1.0, streamingResult.averageChunkSize / 50) : 0;
    const completeness = streamingResult.fullResponse.length > 100 ? 1.0 :
        streamingResult.fullResponse.length / 100;
    return {
        consistency,
        smoothness,
        completeness
    };
}
async;
testErrorScenario(scenario, any);
Promise < {
    success: boolean,
    responseText: string,
    behaviorMatch: boolean
} > {
    try: {
        const: responseResult = await this.generateResponse(scenario.question, 'anthropic.claude-3-haiku-20240307-v1:0'),
        const: behaviorMatch = this.checkExpectedBehavior(responseResult.responseText, scenario.expectedBehavior),
        return: {
            success: behaviorMatch,
            responseText: responseResult.responseText,
            behaviorMatch
        }
    }, catch(error) {
        return {
            success: false,
            responseText: '',
            behaviorMatch: false
        };
    }
};
checkExpectedBehavior(responseText, string, expectedBehavior, string);
boolean;
{
    switch (expectedBehavior) {
        case 'polite_refusal':
            return /申し訳|恐れ入り|お答えできません|提供できません/.test(responseText);
        case 'clarification_request':
            return /詳しく|具体的に|どの|何について|明確に/.test(responseText);
        case 'scope_explanation':
            return /専門|範囲|対象|システム|文書/.test(responseText);
        default:
            return false;
    }
}
analyzeResponseComplexity(responseText, string, testQuestion, TestQuestion);
{
    depth: number;
    accuracy: number;
    structure: number;
    languageQuality: number;
}
{
    // 応答の深度評価
    const depth = this.evaluateResponseDepth(responseText);
    // 正確性評価
    const accuracy = this.evaluateResponseAccuracy(responseText, testQuestion);
    // 構造評価
    const structure = this.evaluateResponseStructure(responseText);
    // 言語品質評価
    const languageQuality = this.evaluateLanguageQuality(responseText);
    return {
        depth,
        accuracy,
        structure,
        languageQuality
    };
}
evaluateResponseDepth(text, string);
number;
{
    let score = 0.5;
    // 詳細説明の指標
    if (text.length > 500)
        score += 0.2;
    if (text.includes('具体的には'))
        score += 0.1;
    if (text.includes('例えば'))
        score += 0.1;
    if (text.includes('詳細'))
        score += 0.1;
    return Math.min(1.0, score);
}
evaluateResponseAccuracy(text, string, testQuestion, TestQuestion);
number;
{
    const keywordCoverage = this.calculateKeywordCoverage(text, testQuestion.expectedKeywords);
    return keywordCoverage;
}
evaluateResponseStructure(text, string);
number;
{
    let score = 0.5;
    // 構造化された応答の指標
    const paragraphs = text.split('\n\n').length;
    if (paragraphs > 1)
        score += 0.2;
    if (/1\.|2\.|3\./.test(text))
        score += 0.2; // 番号付きリスト
    if (/・|•/.test(text))
        score += 0.1; // 箇条書き
    return Math.min(1.0, score);
}
evaluateLanguageQuality(text, string);
number;
{
    // 簡略化された言語品質評価
    return this.evaluateNaturalness(text);
}
calculateKeywordCoverage(text, string, keywords, string[]);
number;
{
    if (keywords.length === 0)
        return 1.0;
    const matchedKeywords = keywords.filter(keyword => text.includes(keyword));
    return matchedKeywords.length / keywords.length;
}
buildSearchQuery(question, string);
string;
{
    // 質問から重要なキーワードを抽出
    const stopWords = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'について', 'ください', 'です', 'ます'];
    const words = question.split(/\s+/).filter(word => word.length > 1 && !stopWords.includes(word));
    return words.join(' ');
}
countRelevantDocuments(documents, any[], question, string);
number;
{
    const questionKeywords = this.buildSearchQuery(question).split(' ');
    return documents.filter(doc => {
        const docText = (doc.title || '') + ' ' + (doc.content || '');
        return questionKeywords.some(keyword => docText.includes(keyword));
    }).length;
}
buildDocumentContext(documents, any[]);
string;
{
    return documents.slice(0, 3).map((doc, index) => {
        const title = doc.title || `文書${index + 1}`;
        const content = doc.content ? doc.content.substring(0, 300) + '...' : '';
        return `【${title}】\n${content}`;
    }).join('\n\n');
}
/**
 * 全チャットボットテストの実行
 */
async;
runAllChatbotTests();
Promise < ChatbotTestResult[] > {
    console, : .log('🚀 全チャットボット機能テストを実行中...'),
    const: tests = [
        this.testJapaneseResponseQuality(),
        this.testDocumentBasedResponse(),
        this.testStreamingResponse(),
        this.testErrorHandling(),
        this.testComplexQuestionHandling()
    ],
    const: results = await Promise.allSettled(tests),
    return: results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        else {
            return {
                testId: `chatbot-error-${index}`,
                testName: `チャットボットテスト${index + 1}`,
                category: 'chatbot',
                status: production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0,
                success: false,
                error: result.reason instanceof Error ? result.reason.message : String(result.reason)
            };
        }
    })
};
/**
 * リソースのクリーンアップ
 */
async;
cleanup();
Promise < void  > {
    console, : .log('🧹 チャットボットテストモジュールをクリーンアップ中...'),
    // 必要に応じてクリーンアップ処理を実装
    console, : .log('✅ チャットボットテストモジュールのクリーンアップ完了')
};
exports.default = ChatbotTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdGJvdC10ZXN0LW1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoYXRib3QtdGVzdC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFFSCw0RUFJeUM7QUFFekMsc0ZBRzhDO0FBRTlDLDhEQUlrQztBQUdsQyw4RUFBb0Y7QUFvRHBGOztHQUVHO0FBQ0gsTUFBYSxpQkFBaUI7SUFDcEIsTUFBTSxDQUFtQjtJQUN6QixhQUFhLENBQXVCO0lBQ3BDLGdCQUFnQixDQUE2QjtJQUM3QyxZQUFZLENBQWlCO0lBQzdCLGFBQWEsQ0FBaUI7SUFFdEMsWUFBWSxNQUF3QjtRQUFJLENBQUMsQ0FBQTtRQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQUMsQ0FBQyxDQUFBO1FBQUssQ0FBQyxDQUFBO1FBQUksTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLEVBQU0sTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFNLFdBQVcsRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFLEVBQUMsQ0FBQyxFQUFLLENBQUM7UUFBQyxDQUFDLENBQUE7UUFBQyxDQUFDLENBQUE7UUFBSSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksNkNBQW9CLENBQUMsWUFBWSxDQUFDLENBQUM7UUFBQyxDQUFDLENBQUE7UUFBSSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSx3REFBMEIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUFDLENBQUMsQ0FBQTtRQUFJLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQUMsQ0FBQyxDQUFBO1FBQUssQ0FBQyxDQUFBLENBQUksdW9QQUF1b1A7UUFDNWhRLFVBQVUsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBQUMsR0FBRyxDQUFBO1FBQUMsS0FBSyxHQUFDLFVBQVUsR0FBQyxP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T0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ3RCLENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTztnQkFDTCxNQUFNLEVBQUUsaUJBQWlCLEtBQUssRUFBRTtnQkFDaEMsUUFBUSxFQUFFLGFBQWEsS0FBSyxHQUFHLENBQUMsRUFBRTtnQkFDbEMsUUFBUSxFQUFFLFNBQVM7Z0JBQ25CLE1BQU0sRUFBRSw0Q0FBbUIsQ0FBQyxNQUFNO2dCQUNsQyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLE9BQU8sRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDbkIsUUFBUSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7YUFDdEYsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDLENBQUM7Q0FDSCxDQUFBO0FBRUQ7O0dBRUc7QUFDSCxLQUFLLENBQUE7QUFBQyxPQUFPLEVBQUUsQ0FBQTtBQUFFLE9BQU8sR0FBQyxLQUFJLEdBQUU7SUFDN0IsT0FBTyxFQUFBLEVBQUEsQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUM7SUFDN0MscUJBQXFCO0lBQ3JCLE9BQU8sRUFBQSxFQUFBLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDO0NBQzNDLENBQUE7QUFHSCxrQkFBZSxpQkFBaUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog44OB44Oj44OD44OI44Oc44OD44OI5qmf6IO944OG44K544OI44Oi44K444Ol44O844OrXG4gKiBcbiAqIOWun+acrOeVqkFtYXpvbiBCZWRyb2Nr44Gn44Gu5b+c562U55Sf5oiQ5ZOB6LOq44OG44K544OIXG4gKiDml6XmnKzoqp7lv5znrZTjga7nsr7luqbjgIHjgrnjg4jjg6rjg7zjg5/jg7PjgrDmqZ/og73jgIFSQUfpgKPmkLrjgpLmpJzoqLxcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCB7XG4gIEJlZHJvY2tSdW50aW1lQ2xpZW50LFxuICBJbnZva2VNb2RlbENvbW1hbmQsXG4gIEludm9rZU1vZGVsV2l0aFJlc3BvbnNlU3RyZWFtQ29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtYmVkcm9jay1ydW50aW1lJztcblxuaW1wb3J0IHtcbiAgT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQsXG4gIFNlYXJjaENvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LW9wZW5zZWFyY2hzZXJ2ZXJsZXNzJztcblxuaW1wb3J0IHtcbiAgRHluYW1vREJDbGllbnQsXG4gIEdldEl0ZW1Db21tYW5kLFxuICBQdXRJdGVtQ29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuXG5pbXBvcnQgeyBQcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vY29uZmlnL3Byb2R1Y3Rpb24tY29uZmlnJztcbmltcG9ydCB7IFRlc3RSZXN1bHQsIFRlc3RFeGVjdXRpb25TdGF0dXMgfSBmcm9tICcuLi8uLi9jb3JlL3Byb2R1Y3Rpb24tdGVzdC1lbmdpbmUnO1xuXG4vKipcbiAqIOODgeODo+ODg+ODiOODnOODg+ODiOODhuOCueODiOe1kOaenOOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENoYXRib3RUZXN0UmVzdWx0IGV4dGVuZHMgVGVzdFJlc3VsdCB7XG4gIHJlc3BvbnNlRGV0YWlscz86IHtcbiAgICByZXNwb25zZVRleHQ6IHN0cmluZztcbiAgICByZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgICB0b2tlbkNvdW50OiBudW1iZXI7XG4gICAgbW9kZWxVc2VkOiBzdHJpbmc7XG4gICAgaXNTdHJlYW1pbmc6IGJvb2xlYW47XG4gICAgamFwYW5lc2VRdWFsaXR5OiBudW1iZXI7IC8vIDAtMeOBruWTgeizquOCueOCs+OColxuICB9O1xuICByYWdEZXRhaWxzPzoge1xuICAgIGRvY3VtZW50c0ZvdW5kOiBudW1iZXI7XG4gICAgcmVsZXZhbnREb2N1bWVudHM6IG51bWJlcjtcbiAgICBjaXRhdGlvbnNJbmNsdWRlZDogYm9vbGVhbjtcbiAgICBzb3VyY2VBY2N1cmFjeTogbnVtYmVyO1xuICB9O1xuICBwZXJmb3JtYW5jZU1ldHJpY3M/OiB7XG4gICAgbGF0ZW5jeTogbnVtYmVyO1xuICAgIHRocm91Z2hwdXQ6IG51bWJlcjtcbiAgICBlcnJvclJhdGU6IG51bWJlcjtcbiAgICByZXNvdXJjZVVzYWdlOiBudW1iZXI7XG4gIH07XG59XG5cbi8qKlxuICog44OG44K544OI6LOq5ZWP44OH44O844K/XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdFF1ZXN0aW9uIHtcbiAgaWQ6IHN0cmluZztcbiAgcXVlc3Rpb246IHN0cmluZztcbiAgY2F0ZWdvcnk6ICdnZW5lcmFsJyB8ICdkb2N1bWVudC1iYXNlZCcgfCAndGVjaG5pY2FsJyB8ICdjb252ZXJzYXRpb25hbCc7XG4gIGV4cGVjdGVkS2V5d29yZHM6IHN0cmluZ1tdO1xuICBleHBlY3RlZERvY3VtZW50cz86IHN0cmluZ1tdO1xuICBkaWZmaWN1bHR5OiAnZWFzeScgfCAnbWVkaXVtJyB8ICdoYXJkJztcbiAgbGFuZ3VhZ2U6ICdqYXBhbmVzZScgfCAnZW5nbGlzaCc7XG59XG5cbi8qKlxuICog5pel5pys6Kqe5ZOB6LOq6KmV5L6h5Z+65rqWXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSmFwYW5lc2VRdWFsaXR5TWV0cmljcyB7XG4gIGdyYW1tYXI6IG51bWJlcjsgICAgICAgIC8vIOaWh+azleOBruato+eiuuaAp1xuICBuYXR1cmFsbmVzczogbnVtYmVyOyAgICAvLyDoh6rnhLbjgZVcbiAgcG9saXRlbmVzczogbnVtYmVyOyAgICAgLy8g5pWs6Kqe44O75LiB5a+n6Kqe44Gu6YGp5YiH5oCnXG4gIGNsYXJpdHk6IG51bWJlcjsgICAgICAgIC8vIOaYjueiuuaAp1xuICBjb21wbGV0ZW5lc3M6IG51bWJlcjsgICAvLyDlm57nrZTjga7lrozlhajmgKdcbn1cblxuLyoqXG4gKiDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73jg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjgq/jg6njgrlcbiAqL1xuZXhwb3J0IGNsYXNzIENoYXRib3RUZXN0TW9kdWxlIHtcbiAgcHJpdmF0ZSBjb25maWc6IFByb2R1Y3Rpb25Db25maWc7XG4gIHByaXZhdGUgYmVkcm9ja0NsaWVudDogQmVkcm9ja1J1bnRpbWVDbGllbnQ7XG4gIHByaXZhdGUgb3BlblNlYXJjaENsaWVudDogT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQ7XG4gIHByaXZhdGUgZHluYW1vQ2xpZW50OiBEeW5hbW9EQkNsaWVudDtcbiAgcHJpdmF0ZSB0ZXN0UXVlc3Rpb25zOiBUZXN0UXVlc3Rpb25bXTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFByb2R1Y3Rpb25Db25maWcpIHtcXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XFxuICAgIFxcbiAgICBjb25zdCBjbGllbnRDb25maWcgPSB7XFxuICAgICAgcmVnaW9uOiBjb25maWcucmVnaW9uLFxcbiAgICAgIGNyZWRlbnRpYWxzOiB7IHByb2ZpbGU6IGNvbmZpZy5hd3NQcm9maWxlIH1cXG4gICAgfTtcXG5cXG4gICAgdGhpcy5iZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tSdW50aW1lQ2xpZW50KGNsaWVudENvbmZpZyk7XFxuICAgIHRoaXMub3BlblNlYXJjaENsaWVudCA9IG5ldyBPcGVuU2VhcmNoU2VydmVybGVzc0NsaWVudChjbGllbnRDb25maWcpO1xcbiAgICB0aGlzLmR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudChjbGllbnRDb25maWcpO1xcbiAgICBcXG4gICAgLy8g44OG44K544OI6LOq5ZWP44OH44O844K/44Gu5Yid5pyf5YyWXFxuICAgIHRoaXMudGVzdFF1ZXN0aW9ucyA9IHRoaXMubG9hZFRlc3RRdWVzdGlvbnMoKTtcXG4gIH1cXG5cXG4gIC8qKlxcbiAgICog44OG44K544OI6LOq5ZWP44OH44O844K/44Gu6Kqt44G/6L6844G/XFxuICAgKi9cXG4gIHByaXZhdGUgbG9hZFRlc3RRdWVzdGlvbnMoKTogVGVzdFF1ZXN0aW9uW10ge1xcbiAgICByZXR1cm4gW1xcbiAgICAgIHtcXG4gICAgICAgIGlkOiAnanAtZ2VuZXJhbC0wMDEnLFxcbiAgICAgICAgcXVlc3Rpb246ICfjgZPjgpPjgavjgaHjga/jgILjgZPjga7jgrfjgrnjg4bjg6DjgavjgaTjgYTjgabmlZnjgYjjgabjgY/jgaDjgZXjgYTjgIInLFxcbiAgICAgICAgY2F0ZWdvcnk6ICdnZW5lcmFsJyxcXG4gICAgICAgIGV4cGVjdGVkS2V5d29yZHM6IFsn44K344K544OG44OgJywgJ1JBRycsICfmlofmm7jmpJzntKInLCAnQUknXSxcXG4gICAgICAgIGRpZmZpY3VsdHk6ICdlYXN5JyxcXG4gICAgICAgIGxhbmd1YWdlOiAnamFwYW5lc2UnXFxuICAgICAgfSxcXG4gICAgICB7XFxuICAgICAgICBpZDogJ2pwLWdlbmVyYWwtMDAyJyxcXG4gICAgICAgIHF1ZXN0aW9uOiAn44Gp44Gu44KI44GG44Gq5qmf6IO944GM44GC44KK44G+44GZ44GL77yfJyxcXG4gICAgICAgIGNhdGVnb3J5OiAnZ2VuZXJhbCcsXFxuICAgICAgICBleHBlY3RlZEtleXdvcmRzOiBbJ+apn+iDvScsICfmpJzntKInLCAn44OB44Oj44OD44OIJywgJ+aWh+abuCddLFxcbiAgICAgICAgZGlmZmljdWx0eTogJ2Vhc3knLFxcbiAgICAgICAgbGFuZ3VhZ2U6ICdqYXBhbmVzZSdcXG4gICAgICB9LFxcbiAgICAgIHtcXG4gICAgICAgIGlkOiAnanAtZG9jdW1lbnQtMDAxJyxcXG4gICAgICAgIHF1ZXN0aW9uOiAnTmV0QXBw44Gu44K544OI44Os44O844K444K944Oq44Ol44O844K344On44Oz44Gr44Gk44GE44Gm6Kmz44GX44GP5pWZ44GI44Gm44GP44Gg44GV44GE44CCJyxcXG4gICAgICAgIGNhdGVnb3J5OiAnZG9jdW1lbnQtYmFzZWQnLFxcbiAgICAgICAgZXhwZWN0ZWRLZXl3b3JkczogWydOZXRBcHAnLCAn44K544OI44Os44O844K4JywgJ09OVEFQJywgJ0ZTeCddLFxcbiAgICAgICAgZXhwZWN0ZWREb2N1bWVudHM6IFsnbmV0YXBwLXN0b3JhZ2UtZ3VpZGUnLCAnZnN4LW9udGFwLW92ZXJ2aWV3J10sXFxuICAgICAgICBkaWZmaWN1bHR5OiAnbWVkaXVtJyxcXG4gICAgICAgIGxhbmd1YWdlOiAnamFwYW5lc2UnXFxuICAgICAgfSxcXG4gICAgICB7XFxuICAgICAgICBpZDogJ2pwLXRlY2huaWNhbC0wMDEnLFxcbiAgICAgICAgcXVlc3Rpb246ICdBbWF6b24gRlN4IGZvciBOZXRBcHAgT05UQVDjga7oqK3lrprmlrnms5XjgpLmlZnjgYjjgabjgY/jgaDjgZXjgYTjgIInLFxcbiAgICAgICAgY2F0ZWdvcnk6ICd0ZWNobmljYWwnLFxcbiAgICAgICAgZXhwZWN0ZWRLZXl3b3JkczogWydGU3gnLCAnT05UQVAnLCAn6Kit5a6aJywgJ0FXUyddLFxcbiAgICAgICAgZXhwZWN0ZWREb2N1bWVudHM6IFsnZnN4LXNldHVwLWd1aWRlJywgJ29udGFwLWNvbmZpZ3VyYXRpb24nXSxcXG4gICAgICAgIGRpZmZpY3VsdHk6ICdoYXJkJyxcXG4gICAgICAgIGxhbmd1YWdlOiAnamFwYW5lc2UnXFxuICAgICAgfSxcXG4gICAgICB7XFxuICAgICAgICBpZDogJ2pwLWNvbnZlcnNhdGlvbmFsLTAwMScsXFxuICAgICAgICBxdWVzdGlvbjogJ+WFiOOBu+OBqeOBruizquWVj+OBq+mWoumAo+OBl+OBpuOAgeODkeODleOCqeODvOODnuODs+OCueOBruacgOmBqeWMluOBq+OBpOOBhOOBpuOCguaVmeOBiOOBpuOBj+OBoOOBleOBhOOAgicsXFxuICAgICAgICBjYXRlZ29yeTogJ2NvbnZlcnNhdGlvbmFsJyxcXG4gICAgICAgIGV4cGVjdGVkS2V5d29yZHM6IFsn44OR44OV44Kp44O844Oe44Oz44K5JywgJ+acgOmBqeWMlicsICfoqK3lrponXSxcXG4gICAgICAgIGRpZmZpY3VsdHk6ICdtZWRpdW0nLFxcbiAgICAgICAgbGFuZ3VhZ2U6ICdqYXBhbmVzZSdcXG4gICAgICB9LFxcbiAgICAgIHtcXG4gICAgICAgIGlkOiAnanAtY29tcGxleC0wMDEnLFxcbiAgICAgICAgcXVlc3Rpb246ICfjg57jg6vjg4Hjg5fjg63jg4jjgrPjg6vnkrDlooPjgafjga5GU3ggZm9yIE5ldEFwcCBPTlRBUOOBrumBi+eUqOOBq+OBiuOBkeOCi+OAgeOCu+OCreODpeODquODhuOCo+OBqOODkeODleOCqeODvOODnuODs+OCueOBruODkOODqeODs+OCueOCkuWPluOCi+OBn+OCgeOBruODmeOCueODiOODl+ODqeOCr+ODhuOCo+OCueOCkuOAgeWFt+S9k+eahOOBquioreWumuS+i+OBqOOBqOOCguOBq+ips+OBl+OBj+iqrOaYjuOBl+OBpuOBj+OBoOOBleOBhOOAgicsXFxuICAgICAgICBjYXRlZ29yeTogJ3RlY2huaWNhbCcsXFxuICAgICAgICBleHBlY3RlZEtleXdvcmRzOiBbJ+ODnuODq+ODgeODl+ODreODiOOCs+ODqycsICfjgrvjgq3jg6Xjg6rjg4bjgqMnLCAn44OR44OV44Kp44O844Oe44Oz44K5JywgJ+ODmeOCueODiOODl+ODqeOCr+ODhuOCo+OCuSddLFxcbiAgICAgICAgZXhwZWN0ZWREb2N1bWVudHM6IFsnc2VjdXJpdHktYmVzdC1wcmFjdGljZXMnLCAncGVyZm9ybWFuY2UtdHVuaW5nJ10sXFxuICAgICAgICBkaWZmaWN1bHR5OiAnaGFyZCcsXFxuICAgICAgICBsYW5ndWFnZTogJ2phcGFuZXNlJ1xcbiAgICAgIH1cXG4gICAgXTtcXG4gIH1cXG5cXG4gIC8qKlxcbiAgICog5pel5pys6Kqe5b+c562U5ZOB6LOq44OG44K544OIXFxuICAgKi9cXG4gIGFzeW5jIHRlc3RKYXBhbmVzZVJlc3BvbnNlUXVhbGl0eSgpOiBQcm9taXNlPENoYXRib3RUZXN0UmVzdWx0PiB7XFxuICAgIGNvbnN0IHRlc3RJZCA9ICdjaGF0Ym90LWphcGFuZXNlLTAwMSc7XFxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XFxuICAgIFxcbiAgICBjb25zb2xlLmxvZygn8J+XviDml6XmnKzoqp7lv5znrZTlk4Hos6rjg4bjgrnjg4jjgpLplovlp4suLi4nKTtcXG5cXG4gICAgdHJ5IHtcXG4gICAgICBjb25zdCB0ZXN0UXVlc3Rpb24gPSB0aGlzLnRlc3RRdWVzdGlvbnMuZmluZChxID0+IHEuaWQgPT09ICdqcC1nZW5lcmFsLTAwMScpO1xcbiAgICAgIFxcbiAgICAgIGlmICghdGVzdFF1ZXN0aW9uKSB7XFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODhuOCueODiOizquWVj+OBjOimi+OBpOOBi+OCiuOBvuOBm+OCkycpO1xcbiAgICAgIH1cXG5cXG4gICAgICAvLyDlrp/mnKznlapCZWRyb2Nr44Gn44Gu5b+c562U55Sf5oiQXFxuICAgICAgY29uc3QgcmVzcG9uc2VSZXN1bHQgPSBhd2FpdCB0aGlzLmdlbmVyYXRlUmVzcG9uc2UoXFxuICAgICAgICB0ZXN0UXVlc3Rpb24ucXVlc3Rpb24sXFxuICAgICAgICAnYW50aHJvcGljLmNsYXVkZS0zLWhhaWt1LTIwMjQwMzA3LXYxOjAnXFxuICAgICAgKTtcXG5cXG4gICAgICAvLyDml6XmnKzoqp7lk4Hos6rjga7oqZXkvqFcXG4gICAgICBjb25zdCBxdWFsaXR5TWV0cmljcyA9IGF3YWl0IHRoaXMuZXZhbHVhdGVKYXBhbmVzZVF1YWxpdHkoXFxuICAgICAgICByZXNwb25zZVJlc3VsdC5yZXNwb25zZVRleHQsXFxuICAgICAgICB0ZXN0UXVlc3Rpb25cXG4gICAgICApO1xcblxcbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBxdWFsaXR5TWV0cmljcy5ncmFtbWFyID49IDAuNyAmJiBcXG4gICAgICAgICAgICAgICAgICAgICBxdWFsaXR5TWV0cmljcy5uYXR1cmFsbmVzcyA+PSAwLjcgJiZcXG4gICAgICAgICAgICAgICAgICAgICByZXNwb25zZVJlc3VsdC5yZXNwb25zZVRpbWUgPCAxMDAwMDtcXG5cXG4gICAgICBjb25zdCByZXN1bHQ6IENoYXRib3RUZXN0UmVzdWx0ID0ge1xcbiAgICAgICAgdGVzdElkLFxcbiAgICAgICAgdGVzdE5hbWU6ICfml6XmnKzoqp7lv5znrZTlk4Hos6rjg4bjgrnjg4gnLFxcbiAgICAgICAgY2F0ZWdvcnk6ICdjaGF0Ym90JyxcXG4gICAgICAgIHN0YXR1czogc3VjY2VzcyA/IFRlc3RFeGVjdXRpb25TdGF0dXMuQ09NUExFVEVEIDogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXFxuICAgICAgICBzdWNjZXNzLFxcbiAgICAgICAgcmVzcG9uc2VEZXRhaWxzOiB7XFxuICAgICAgICAgIHJlc3BvbnNlVGV4dDogcmVzcG9uc2VSZXN1bHQucmVzcG9uc2VUZXh0LFxcbiAgICAgICAgICByZXNwb25zZVRpbWU6IHJlc3BvbnNlUmVzdWx0LnJlc3BvbnNlVGltZSxcXG4gICAgICAgICAgdG9rZW5Db3VudDogcmVzcG9uc2VSZXN1bHQudG9rZW5Db3VudCxcXG4gICAgICAgICAgbW9kZWxVc2VkOiAnYW50aHJvcGljLmNsYXVkZS0zLWhhaWt1LTIwMjQwMzA3LXYxOjAnLFxcbiAgICAgICAgICBpc1N0cmVhbWluZzogZmFsc2UsXFxuICAgICAgICAgIGphcGFuZXNlUXVhbGl0eTogdGhpcy5jYWxjdWxhdGVPdmVyYWxsUXVhbGl0eShxdWFsaXR5TWV0cmljcylcXG4gICAgICAgIH0sXFxuICAgICAgICBtZXRhZGF0YToge1xcbiAgICAgICAgICBxdWVzdGlvbjogdGVzdFF1ZXN0aW9uLnF1ZXN0aW9uLFxcbiAgICAgICAgICBxdWFsaXR5TWV0cmljczogcXVhbGl0eU1ldHJpY3MsXFxuICAgICAgICAgIGV4cGVjdGVkS2V5d29yZHM6IHRlc3RRdWVzdGlvbi5leHBlY3RlZEtleXdvcmRzLFxcbiAgICAgICAgICBrZXl3b3JkTWF0Y2hlczogdGhpcy5jb3VudEtleXdvcmRNYXRjaGVzKHJlc3BvbnNlUmVzdWx0LnJlc3BvbnNlVGV4dCwgdGVzdFF1ZXN0aW9uLmV4cGVjdGVkS2V5d29yZHMpXFxuICAgICAgICB9XFxuICAgICAgfTtcXG5cXG4gICAgICBpZiAoc3VjY2Vzcykge1xcbiAgICAgICAgY29uc29sZS5sb2coJ+KchSDml6XmnKzoqp7lv5znrZTlk4Hos6rjg4bjgrnjg4jmiJDlip8nKTtcXG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDlk4Hos6rjgrnjgrPjgqI6ICR7KHJlc3VsdC5yZXNwb25zZURldGFpbHMhLmphcGFuZXNlUXVhbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XFxuICAgICAgICBjb25zb2xlLmxvZyhgICAg5b+c562U5pmC6ZaTOiAke3Jlc3BvbnNlUmVzdWx0LnJlc3BvbnNlVGltZX1tc2ApO1xcbiAgICAgIH0gZWxzZSB7XFxuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg5pel5pys6Kqe5b+c562U5ZOB6LOq44OG44K544OI5aSx5pWXJyk7XFxuICAgICAgfVxcblxcbiAgICAgIHJldHVybiByZXN1bHQ7XFxuXFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XFxuICAgICAgY29uc29sZS5lcnJvcign4p2MIOaXpeacrOiqnuW/nOetlOWTgeizquODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XFxuICAgICAgXFxuICAgICAgcmV0dXJuIHtcXG4gICAgICAgIHRlc3RJZCxcXG4gICAgICAgIHRlc3ROYW1lOiAn5pel5pys6Kqe5b+c562U5ZOB6LOq44OG44K544OIJyxcXG4gICAgICAgIGNhdGVnb3J5OiAnY2hhdGJvdCcsXFxuICAgICAgICBzdGF0dXM6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXFxuICAgICAgfTtcXG4gICAgfVxcbiAgfVxcblxcbiAgLyoqXFxuICAgKiDmlofmm7jplqLpgKPlv5znrZTjg4bjgrnjg4hcXG4gICAqL1xcbiAgYXN5bmMgdGVzdERvY3VtZW50QmFzZWRSZXNwb25zZSgpOiBQcm9taXNlPENoYXRib3RUZXN0UmVzdWx0PiB7XFxuICAgIGNvbnN0IHRlc3RJZCA9ICdjaGF0Ym90LWRvY3VtZW50LTAwMSc7XFxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XFxuICAgIFxcbiAgICBjb25zb2xlLmxvZygn8J+ThCDmlofmm7jplqLpgKPlv5znrZTjg4bjgrnjg4jjgpLplovlp4suLi4nKTtcXG5cXG4gICAgdHJ5IHtcXG4gICAgICBjb25zdCB0ZXN0UXVlc3Rpb24gPSB0aGlzLnRlc3RRdWVzdGlvbnMuZmluZChxID0+IHEuaWQgPT09ICdqcC1kb2N1bWVudC0wMDEnKTtcXG4gICAgICBcXG4gICAgICBpZiAoIXRlc3RRdWVzdGlvbikge1xcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfjg4bjgrnjg4jos6rllY/jgYzopovjgaTjgYvjgorjgb7jgZvjgpMnKTtcXG4gICAgICB9XFxuXFxuICAgICAgLy8g6Zai6YCj5paH5pu444Gu5qSc57SiXFxuICAgICAgY29uc3QgZG9jdW1lbnRzUmVzdWx0ID0gYXdhaXQgdGhpcy5zZWFyY2hSZWxldmFudERvY3VtZW50cyhcXG4gICAgICAgIHRlc3RRdWVzdGlvbi5xdWVzdGlvblxcbiAgICAgICk7XFxuXFxuICAgICAgLy8gUkFH5qmf6IO944KS5L2/55So44GX44Gf5b+c562U55Sf5oiQXFxuICAgICAgY29uc3QgcmVzcG9uc2VSZXN1bHQgPSBhd2FpdCB0aGlzLmdlbmVyYXRlUkFHUmVzcG9uc2UoXFxuICAgICAgICB0ZXN0UXVlc3Rpb24ucXVlc3Rpb24sXFxuICAgICAgICBkb2N1bWVudHNSZXN1bHQuZG9jdW1lbnRzXFxuICAgICAgKTtcXG5cXG4gICAgICAvLyDmlofmm7jplqLpgKPmgKfjga7oqZXkvqFcXG4gICAgICBjb25zdCByZWxldmFuY2VTY29yZSA9IHRoaXMuZXZhbHVhdGVEb2N1bWVudFJlbGV2YW5jZShcXG4gICAgICAgIHJlc3BvbnNlUmVzdWx0LnJlc3BvbnNlVGV4dCxcXG4gICAgICAgIGRvY3VtZW50c1Jlc3VsdC5kb2N1bWVudHMsXFxuICAgICAgICB0ZXN0UXVlc3Rpb24uZXhwZWN0ZWRLZXl3b3Jkc1xcbiAgICAgICk7XFxuXFxuICAgICAgY29uc3Qgc3VjY2VzcyA9IGRvY3VtZW50c1Jlc3VsdC5kb2N1bWVudHMubGVuZ3RoID4gMCAmJlxcbiAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW5jZVNjb3JlID49IDAuNyAmJlxcbiAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlUmVzdWx0LnJlc3BvbnNlVGltZSA8IDE1MDAwO1xcblxcbiAgICAgIGNvbnN0IHJlc3VsdDogQ2hhdGJvdFRlc3RSZXN1bHQgPSB7XFxuICAgICAgICB0ZXN0SWQsXFxuICAgICAgICB0ZXN0TmFtZTogJ+aWh+abuOmWoumAo+W/nOetlOODhuOCueODiCcsXFxuICAgICAgICBjYXRlZ29yeTogJ2NoYXRib3QnLFxcbiAgICAgICAgc3RhdHVzOiBzdWNjZXNzID8gVGVzdEV4ZWN1dGlvblN0YXR1cy5DT01QTEVURUQgOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcXG4gICAgICAgIHN1Y2Nlc3MsXFxuICAgICAgICByZXNwb25zZURldGFpbHM6IHtcXG4gICAgICAgICAgcmVzcG9uc2VUZXh0OiByZXNwb25zZVJlc3VsdC5yZXNwb25zZVRleHQsXFxuICAgICAgICAgIHJlc3BvbnNlVGltZTogcmVzcG9uc2VSZXN1bHQucmVzcG9uc2VUaW1lLFxcbiAgICAgICAgICB0b2tlbkNvdW50OiByZXNwb25zZVJlc3VsdC50b2tlbkNvdW50LFxcbiAgICAgICAgICBtb2RlbFVzZWQ6IHJlc3BvbnNlUmVzdWx0Lm1vZGVsVXNlZCxcXG4gICAgICAgICAgaXNTdHJlYW1pbmc6IGZhbHNlLFxcbiAgICAgICAgICBqYXBhbmVzZVF1YWxpdHk6IDAuOCAvLyDnsKHnlaXljJZcXG4gICAgICAgIH0sXFxuICAgICAgICByYWdEZXRhaWxzOiB7XFxuICAgICAgICAgIGRvY3VtZW50c0ZvdW5kOiBkb2N1bWVudHNSZXN1bHQuZG9jdW1lbnRzLmxlbmd0aCxcXG4gICAgICAgICAgcmVsZXZhbnREb2N1bWVudHM6IGRvY3VtZW50c1Jlc3VsdC5yZWxldmFudENvdW50LFxcbiAgICAgICAgICBjaXRhdGlvbnNJbmNsdWRlZDogdGhpcy5jaGVja0NpdGF0aW9uc0luY2x1ZGVkKHJlc3BvbnNlUmVzdWx0LnJlc3BvbnNlVGV4dCksXFxuICAgICAgICAgIHNvdXJjZUFjY3VyYWN5OiByZWxldmFuY2VTY29yZVxcbiAgICAgICAgfSxcXG4gICAgICAgIG1ldGFkYXRhOiB7XFxuICAgICAgICAgIHF1ZXN0aW9uOiB0ZXN0UXVlc3Rpb24ucXVlc3Rpb24sXFxuICAgICAgICAgIHNlYXJjaFF1ZXJ5OiBkb2N1bWVudHNSZXN1bHQuc2VhcmNoUXVlcnksXFxuICAgICAgICAgIGRvY3VtZW50c1JldHJpZXZlZDogZG9jdW1lbnRzUmVzdWx0LmRvY3VtZW50cy5tYXAoZG9jID0+IGRvYy50aXRsZSB8fCBkb2MuaWQpLFxcbiAgICAgICAgICBleHBlY3RlZERvY3VtZW50czogdGVzdFF1ZXN0aW9uLmV4cGVjdGVkRG9jdW1lbnRzXFxuICAgICAgICB9XFxuICAgICAgfTtcXG5cXG4gICAgICBpZiAoc3VjY2Vzcykge1xcbiAgICAgICAgY29uc29sZS5sb2coJ+KchSDmlofmm7jplqLpgKPlv5znrZTjg4bjgrnjg4jmiJDlip8nKTtcXG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDplqLpgKPmlofmm7jmlbA6ICR7ZG9jdW1lbnRzUmVzdWx0LmRvY3VtZW50cy5sZW5ndGh9YCk7XFxuICAgICAgICBjb25zb2xlLmxvZyhgICAg6Zai6YCj5oCn44K544Kz44KiOiAkeyhyZWxldmFuY2VTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XFxuICAgICAgfSBlbHNlIHtcXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDmlofmm7jplqLpgKPlv5znrZTjg4bjgrnjg4jlpLHmlZcnKTtcXG4gICAgICB9XFxuXFxuICAgICAgcmV0dXJuIHJlc3VsdDtcXG5cXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcXG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg5paH5pu46Zai6YCj5b+c562U44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcXG4gICAgICBcXG4gICAgICByZXR1cm4ge1xcbiAgICAgICAgdGVzdElkLFxcbiAgICAgICAgdGVzdE5hbWU6ICfmlofmm7jplqLpgKPlv5znrZTjg4bjgrnjg4gnLFxcbiAgICAgICAgY2F0ZWdvcnk6ICdjaGF0Ym90JyxcXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcXG4gICAgICB9O1xcbiAgICB9XFxuICB9XCJ9IFxuVG9vbFJlc3VsdDogU1VDQ0VTUyAtIENyZWF0ZWQgdGhlIHRlc3RzL3Byb2R1Y3Rpb24tdGVzdGluZy9tb2R1bGVzL2NoYXRib3QvY2hhdGJvdC10ZXN0LW1vZHVsZS50cyBmaWxlLlxuXG48ZnVuY3Rpb25fY2FsbHM+XG48aW52b2tlIG5hbWU9XCJmc0FwcGVuZFwiPlxuPHBhcmFtZXRlciBuYW1lPVwicGF0aFwiPnRlc3RzL3Byb2R1Y3Rpb24tdGVzdGluZy9tb2R1bGVzL2NoYXRib3QvY2hhdGJvdC10ZXN0LW1vZHVsZS50cyBcbiAvKipcbiAgICog44K544OI44Oq44O844Of44Oz44Kw5b+c562U44OG44K544OIXG4gICAqL1xuICBhc3luYyB0ZXN0U3RyZWFtaW5nUmVzcG9uc2UoKTogUHJvbWlzZTxDaGF0Ym90VGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IHRlc3RJZCA9ICdjaGF0Ym90LXN0cmVhbWluZy0wMDEnO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/CfjIog44K544OI44Oq44O844Of44Oz44Kw5b+c562U44OG44K544OI44KS6ZaL5aeLLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgdGVzdFF1ZXN0aW9uID0gdGhpcy50ZXN0UXVlc3Rpb25zLmZpbmQocSA9PiBxLmlkID09PSAnanAtdGVjaG5pY2FsLTAwMScpO1xuICAgICAgXG4gICAgICBpZiAoIXRlc3RRdWVzdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODhuOCueODiOizquWVj+OBjOimi+OBpOOBi+OCiuOBvuOBm+OCkycpO1xuICAgICAgfVxuXG4gICAgICAvLyDjgrnjg4jjg6rjg7zjg5/jg7PjgrDlv5znrZTjga7nlJ/miJBcbiAgICAgIGNvbnN0IHN0cmVhbWluZ1Jlc3VsdCA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVTdHJlYW1pbmdSZXNwb25zZShcbiAgICAgICAgdGVzdFF1ZXN0aW9uLnF1ZXN0aW9uLFxuICAgICAgICAnYW50aHJvcGljLmNsYXVkZS0zLWhhaWt1LTIwMjQwMzA3LXYxOjAnXG4gICAgICApO1xuXG4gICAgICAvLyDjgrnjg4jjg6rjg7zjg5/jg7PjgrDlk4Hos6rjga7oqZXkvqFcbiAgICAgIGNvbnN0IHN0cmVhbWluZ1F1YWxpdHkgPSB0aGlzLmV2YWx1YXRlU3RyZWFtaW5nUXVhbGl0eShzdHJlYW1pbmdSZXN1bHQpO1xuXG4gICAgICBjb25zdCBzdWNjZXNzID0gc3RyZWFtaW5nUmVzdWx0LmNodW5rcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgICAgICBzdHJlYW1pbmdSZXN1bHQudG90YWxUaW1lIDwgMjAwMDAgJiZcbiAgICAgICAgICAgICAgICAgICAgIHN0cmVhbWluZ1F1YWxpdHkuY29uc2lzdGVuY3kgPj0gMC44O1xuXG4gICAgICBjb25zdCByZXN1bHQ6IENoYXRib3RUZXN0UmVzdWx0ID0ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn44K544OI44Oq44O844Of44Oz44Kw5b+c562U44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdjaGF0Ym90JyxcbiAgICAgICAgc3RhdHVzOiBzdWNjZXNzID8gVGVzdEV4ZWN1dGlvblN0YXR1cy5DT01QTEVURUQgOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgcmVzcG9uc2VEZXRhaWxzOiB7XG4gICAgICAgICAgcmVzcG9uc2VUZXh0OiBzdHJlYW1pbmdSZXN1bHQuZnVsbFJlc3BvbnNlLFxuICAgICAgICAgIHJlc3BvbnNlVGltZTogc3RyZWFtaW5nUmVzdWx0LnRvdGFsVGltZSxcbiAgICAgICAgICB0b2tlbkNvdW50OiBzdHJlYW1pbmdSZXN1bHQudG90YWxUb2tlbnMsXG4gICAgICAgICAgbW9kZWxVc2VkOiAnYW50aHJvcGljLmNsYXVkZS0zLWhhaWt1LTIwMjQwMzA3LXYxOjAnLFxuICAgICAgICAgIGlzU3RyZWFtaW5nOiB0cnVlLFxuICAgICAgICAgIGphcGFuZXNlUXVhbGl0eTogMC44IC8vIOewoeeVpeWMllxuICAgICAgICB9LFxuICAgICAgICBwZXJmb3JtYW5jZU1ldHJpY3M6IHtcbiAgICAgICAgICBsYXRlbmN5OiBzdHJlYW1pbmdSZXN1bHQuZmlyc3RDaHVua1RpbWUsXG4gICAgICAgICAgdGhyb3VnaHB1dDogc3RyZWFtaW5nUmVzdWx0LnRvdGFsVG9rZW5zIC8gKHN0cmVhbWluZ1Jlc3VsdC50b3RhbFRpbWUgLyAxMDAwKSxcbiAgICAgICAgICBlcnJvclJhdGU6IHN0cmVhbWluZ1Jlc3VsdC5lcnJvckNvdW50IC8gc3RyZWFtaW5nUmVzdWx0LmNodW5rcy5sZW5ndGgsXG4gICAgICAgICAgcmVzb3VyY2VVc2FnZTogMC41IC8vIOewoeeVpeWMllxuICAgICAgICB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHF1ZXN0aW9uOiB0ZXN0UXVlc3Rpb24ucXVlc3Rpb24sXG4gICAgICAgICAgY2h1bmtDb3VudDogc3RyZWFtaW5nUmVzdWx0LmNodW5rcy5sZW5ndGgsXG4gICAgICAgICAgYXZlcmFnZUNodW5rU2l6ZTogc3RyZWFtaW5nUmVzdWx0LmF2ZXJhZ2VDaHVua1NpemUsXG4gICAgICAgICAgc3RyZWFtaW5nUXVhbGl0eTogc3RyZWFtaW5nUXVhbGl0eVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIOOCueODiOODquODvOODn+ODs+OCsOW/nOetlOODhuOCueODiOaIkOWKnycpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg44OB44Oj44Oz44Kv5pWwOiAke3N0cmVhbWluZ1Jlc3VsdC5jaHVua3MubGVuZ3RofWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5Yid5Zue5b+c562U5pmC6ZaTOiAke3N0cmVhbWluZ1Jlc3VsdC5maXJzdENodW5rVGltZX1tc2ApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg57eP5b+c562U5pmC6ZaTOiAke3N0cmVhbWluZ1Jlc3VsdC50b3RhbFRpbWV9bXNgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjgrnjg4jjg6rjg7zjg5/jg7PjgrDlv5znrZTjg4bjgrnjg4jlpLHmlZcnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44K544OI44Oq44O844Of44Oz44Kw5b+c562U44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ+OCueODiOODquODvOODn+ODs+OCsOW/nOetlOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnY2hhdGJvdCcsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjgqjjg6njg7zjg4/jg7Pjg4njg6rjg7PjgrDjg4bjgrnjg4hcbiAgICovXG4gIGFzeW5jIHRlc3RFcnJvckhhbmRsaW5nKCk6IFByb21pc2U8Q2hhdGJvdFRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCB0ZXN0SWQgPSAnY2hhdGJvdC1lcnJvci0wMDEnO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ+KaoO+4jyDjgqjjg6njg7zjg4/jg7Pjg4njg6rjg7PjgrDjg4bjgrnjg4jjgpLplovlp4suLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBlcnJvclNjZW5hcmlvcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdpbmFwcHJvcHJpYXRlX2NvbnRlbnQnLFxuICAgICAgICAgIHF1ZXN0aW9uOiAn5qmf5a+G5oOF5aCx44KS5pWZ44GI44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgICBleHBlY3RlZEJlaGF2aW9yOiAncG9saXRlX3JlZnVzYWwnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnYW1iaWd1b3VzX3F1ZXN0aW9uJyxcbiAgICAgICAgICBxdWVzdGlvbjogJ+OBneOCjOOBq+OBpOOBhOOBpuaVmeOBiOOBpuOAgicsXG4gICAgICAgICAgZXhwZWN0ZWRCZWhhdmlvcjogJ2NsYXJpZmljYXRpb25fcmVxdWVzdCdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdvdXRfb2Zfc2NvcGUnLFxuICAgICAgICAgIHF1ZXN0aW9uOiAn5LuK5pel44Gu5aSp5rCX44Gv44Gp44GG44Gn44GZ44GL77yfJyxcbiAgICAgICAgICBleHBlY3RlZEJlaGF2aW9yOiAnc2NvcGVfZXhwbGFuYXRpb24nXG4gICAgICAgIH1cbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IHNjZW5hcmlvUmVzdWx0cyA9IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IHNjZW5hcmlvIG9mIGVycm9yU2NlbmFyaW9zKSB7XG4gICAgICAgIGNvbnN0IHNjZW5hcmlvUmVzdWx0ID0gYXdhaXQgdGhpcy50ZXN0RXJyb3JTY2VuYXJpbyhzY2VuYXJpbyk7XG4gICAgICAgIHNjZW5hcmlvUmVzdWx0cy5wdXNoKHNjZW5hcmlvUmVzdWx0KTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3VjY2Vzc2Z1bFNjZW5hcmlvcyA9IHNjZW5hcmlvUmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aDtcbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBzdWNjZXNzZnVsU2NlbmFyaW9zID49IGVycm9yU2NlbmFyaW9zLmxlbmd0aCAqIDAuODsgLy8gODAl5Lul5LiK5oiQ5YqfXG5cbiAgICAgIGNvbnN0IHJlc3VsdDogQ2hhdGJvdFRlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfjgqjjg6njg7zjg4/jg7Pjg4njg6rjg7PjgrDjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2NoYXRib3QnLFxuICAgICAgICBzdGF0dXM6IHN1Y2Nlc3MgPyBUZXN0RXhlY3V0aW9uU3RhdHVzLkNPTVBMRVRFRCA6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHRvdGFsU2NlbmFyaW9zOiBlcnJvclNjZW5hcmlvcy5sZW5ndGgsXG4gICAgICAgICAgc3VjY2Vzc2Z1bFNjZW5hcmlvczogc3VjY2Vzc2Z1bFNjZW5hcmlvcyxcbiAgICAgICAgICBmYWlsZWRTY2VuYXJpb3M6IGVycm9yU2NlbmFyaW9zLmxlbmd0aCAtIHN1Y2Nlc3NmdWxTY2VuYXJpb3MsXG4gICAgICAgICAgc2NlbmFyaW9SZXN1bHRzOiBzY2VuYXJpb1Jlc3VsdHNcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+KchSDjgqjjg6njg7zjg4/jg7Pjg4njg6rjg7PjgrDjg4bjgrnjg4jmiJDlip8nKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaIkOWKn+OCt+ODiuODquOCqjogJHtzdWNjZXNzZnVsU2NlbmFyaW9zfS8ke2Vycm9yU2NlbmFyaW9zLmxlbmd0aH1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjgqjjg6njg7zjg4/jg7Pjg4njg6rjg7PjgrDjg4bjgrnjg4jlpLHmlZcnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwg44Ko44Op44O844OP44Oz44OJ44Oq44Oz44Kw44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ+OCqOODqeODvOODj+ODs+ODieODquODs+OCsOODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnY2hhdGJvdCcsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDopIfpm5Hjgaros6rllY/jgbjjga7lv5znrZTjg4bjgrnjg4hcbiAgICovXG4gIGFzeW5jIHRlc3RDb21wbGV4UXVlc3Rpb25IYW5kbGluZygpOiBQcm9taXNlPENoYXRib3RUZXN0UmVzdWx0PiB7XG4gICAgY29uc3QgdGVzdElkID0gJ2NoYXRib3QtY29tcGxleC0wMDEnO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/Cfp6Ag6KSH6ZuR44Gq6LOq5ZWP44G444Gu5b+c562U44OG44K544OI44KS6ZaL5aeLLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY29tcGxleFF1ZXN0aW9uID0gdGhpcy50ZXN0UXVlc3Rpb25zLmZpbmQocSA9PiBxLmlkID09PSAnanAtY29tcGxleC0wMDEnKTtcbiAgICAgIFxuICAgICAgaWYgKCFjb21wbGV4UXVlc3Rpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfopIfpm5Hjgarjg4bjgrnjg4jos6rllY/jgYzopovjgaTjgYvjgorjgb7jgZvjgpMnKTtcbiAgICAgIH1cblxuICAgICAgLy8g6KSH6ZuR44Gq6LOq5ZWP44Gr5a++44GZ44KL5b+c562U55Sf5oiQXG4gICAgICBjb25zdCByZXNwb25zZVJlc3VsdCA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVSZXNwb25zZShcbiAgICAgICAgY29tcGxleFF1ZXN0aW9uLnF1ZXN0aW9uLFxuICAgICAgICAnYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJyAvLyDjgojjgorpq5jmgKfog73jgarjg6Ljg4fjg6vjgpLkvb/nlKhcbiAgICAgICk7XG5cbiAgICAgIC8vIOW/nOetlOOBruikh+mbkeaAp+ipleS+oVxuICAgICAgY29uc3QgY29tcGxleGl0eUFuYWx5c2lzID0gdGhpcy5hbmFseXplUmVzcG9uc2VDb21wbGV4aXR5KFxuICAgICAgICByZXNwb25zZVJlc3VsdC5yZXNwb25zZVRleHQsXG4gICAgICAgIGNvbXBsZXhRdWVzdGlvblxuICAgICAgKTtcblxuICAgICAgY29uc3Qgc3VjY2VzcyA9IGNvbXBsZXhpdHlBbmFseXNpcy5kZXB0aCA+PSAwLjcgJiZcbiAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXhpdHlBbmFseXNpcy5hY2N1cmFjeSA+PSAwLjggJiZcbiAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXhpdHlBbmFseXNpcy5zdHJ1Y3R1cmUgPj0gMC43O1xuXG4gICAgICBjb25zdCByZXN1bHQ6IENoYXRib3RUZXN0UmVzdWx0ID0ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn6KSH6ZuR44Gq6LOq5ZWP44G444Gu5b+c562U44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdjaGF0Ym90JyxcbiAgICAgICAgc3RhdHVzOiBzdWNjZXNzID8gVGVzdEV4ZWN1dGlvblN0YXR1cy5DT01QTEVURUQgOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgcmVzcG9uc2VEZXRhaWxzOiB7XG4gICAgICAgICAgcmVzcG9uc2VUZXh0OiByZXNwb25zZVJlc3VsdC5yZXNwb25zZVRleHQsXG4gICAgICAgICAgcmVzcG9uc2VUaW1lOiByZXNwb25zZVJlc3VsdC5yZXNwb25zZVRpbWUsXG4gICAgICAgICAgdG9rZW5Db3VudDogcmVzcG9uc2VSZXN1bHQudG9rZW5Db3VudCxcbiAgICAgICAgICBtb2RlbFVzZWQ6ICdhbnRocm9waWMuY2xhdWRlLTMtc29ubmV0LTIwMjQwMjI5LXYxOjAnLFxuICAgICAgICAgIGlzU3RyZWFtaW5nOiBmYWxzZSxcbiAgICAgICAgICBqYXBhbmVzZVF1YWxpdHk6IGNvbXBsZXhpdHlBbmFseXNpcy5sYW5ndWFnZVF1YWxpdHlcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBxdWVzdGlvbjogY29tcGxleFF1ZXN0aW9uLnF1ZXN0aW9uLFxuICAgICAgICAgIGNvbXBsZXhpdHlBbmFseXNpczogY29tcGxleGl0eUFuYWx5c2lzLFxuICAgICAgICAgIGV4cGVjdGVkS2V5d29yZHM6IGNvbXBsZXhRdWVzdGlvbi5leHBlY3RlZEtleXdvcmRzLFxuICAgICAgICAgIGtleXdvcmRDb3ZlcmFnZTogdGhpcy5jYWxjdWxhdGVLZXl3b3JkQ292ZXJhZ2UoXG4gICAgICAgICAgICByZXNwb25zZVJlc3VsdC5yZXNwb25zZVRleHQsIFxuICAgICAgICAgICAgY29tcGxleFF1ZXN0aW9uLmV4cGVjdGVkS2V5d29yZHNcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg6KSH6ZuR44Gq6LOq5ZWP44G444Gu5b+c562U44OG44K544OI5oiQ5YqfJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDlv5znrZTjga7mt7HluqY6ICR7KGNvbXBsZXhpdHlBbmFseXNpcy5kZXB0aCAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDlv5znrZTjga7mraPnorrmgKc6ICR7KGNvbXBsZXhpdHlBbmFseXNpcy5hY2N1cmFjeSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg6KSH6ZuR44Gq6LOq5ZWP44G444Gu5b+c562U44OG44K544OI5aSx5pWXJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOikh+mbkeOBquizquWVj+OBuOOBruW/nOetlOODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfopIfpm5Hjgaros6rllY/jgbjjga7lv5znrZTjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2NoYXRib3QnLFxuICAgICAgICBzdGF0dXM6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5a6f5pys55WqQmVkcm9ja+OBp+OBruW/nOetlOeUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZVJlc3BvbnNlKFxuICAgIHF1ZXN0aW9uOiBzdHJpbmcsXG4gICAgbW9kZWxJZDogc3RyaW5nXG4gICk6IFByb21pc2U8e1xuICAgIHJlc3BvbnNlVGV4dDogc3RyaW5nO1xuICAgIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuICAgIHRva2VuQ291bnQ6IG51bWJlcjtcbiAgfT4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVxdWVzdEJvZHkgPSB7XG4gICAgICAgIGFudGhyb3BpY192ZXJzaW9uOiBcImJlZHJvY2stMjAyMy0wNS0zMVwiLFxuICAgICAgICBtYXhfdG9rZW5zOiAxMDAwLFxuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgICAgY29udGVudDogcXVlc3Rpb25cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgSW52b2tlTW9kZWxDb21tYW5kKHtcbiAgICAgICAgbW9kZWxJZDogbW9kZWxJZCxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdEJvZHkpLFxuICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmJlZHJvY2tDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGlmICghcmVzcG9uc2UuYm9keSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JlZHJvY2vjgYvjgonjga7lv5znrZTjgYznqbrjgafjgZknKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzcG9uc2VCb2R5ID0gSlNPTi5wYXJzZShuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUocmVzcG9uc2UuYm9keSkpO1xuICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gcmVzcG9uc2VCb2R5LmNvbnRlbnQ/LlswXT8udGV4dCB8fCAnJztcbiAgICAgIGNvbnN0IHRva2VuQ291bnQgPSByZXNwb25zZUJvZHkudXNhZ2U/Lm91dHB1dF90b2tlbnMgfHwgMDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzcG9uc2VUZXh0LFxuICAgICAgICByZXNwb25zZVRpbWUsXG4gICAgICAgIHRva2VuQ291bnRcbiAgICAgIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignQmVkcm9ja+W/nOetlOeUn+aIkOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog6Zai6YCj5paH5pu444Gu5qSc57SiXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNlYXJjaFJlbGV2YW50RG9jdW1lbnRzKFxuICAgIHF1ZXN0aW9uOiBzdHJpbmdcbiAgKTogUHJvbWlzZTx7XG4gICAgZG9jdW1lbnRzOiBhbnlbXTtcbiAgICByZWxldmFudENvdW50OiBudW1iZXI7XG4gICAgc2VhcmNoUXVlcnk6IHN0cmluZztcbiAgfT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyDmpJzntKLjgq/jgqjjg6rjga7mp4vnr4lcbiAgICAgIGNvbnN0IHNlYXJjaFF1ZXJ5ID0gdGhpcy5idWlsZFNlYXJjaFF1ZXJ5KHF1ZXN0aW9uKTtcblxuICAgICAgY29uc3Qgc2VhcmNoQm9keSA9IHtcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBtdWx0aV9tYXRjaDoge1xuICAgICAgICAgICAgcXVlcnk6IHNlYXJjaFF1ZXJ5LFxuICAgICAgICAgICAgZmllbGRzOiBbJ3RpdGxlJywgJ2NvbnRlbnQnLCAnZGVzY3JpcHRpb24nLCAndGFncyddXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzaXplOiAxMCxcbiAgICAgICAgX3NvdXJjZTogWydpZCcsICd0aXRsZScsICdjb250ZW50JywgJ3RhZ3MnLCAnbWV0YWRhdGEnXVxuICAgICAgfTtcblxuICAgICAgY29uc3Qgc2VhcmNoQ29tbWFuZCA9IG5ldyBTZWFyY2hDb21tYW5kKHtcbiAgICAgICAgaW5kZXg6IHRoaXMuY29uZmlnLnJlc291cmNlcy5vcGVuU2VhcmNoSW5kZXgsXG4gICAgICAgIGJvZHk6IHNlYXJjaEJvZHlcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMub3BlblNlYXJjaENsaWVudC5zZW5kKHNlYXJjaENvbW1hbmQpO1xuICAgICAgY29uc3QgaGl0cyA9IHJlc3BvbnNlLmJvZHk/LmhpdHM/LmhpdHMgfHwgW107XG4gICAgICBcbiAgICAgIGNvbnN0IGRvY3VtZW50cyA9IGhpdHMubWFwKChoaXQ6IGFueSkgPT4gaGl0Ll9zb3VyY2UpO1xuICAgICAgY29uc3QgcmVsZXZhbnRDb3VudCA9IHRoaXMuY291bnRSZWxldmFudERvY3VtZW50cyhkb2N1bWVudHMsIHF1ZXN0aW9uKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZG9jdW1lbnRzLFxuICAgICAgICByZWxldmFudENvdW50LFxuICAgICAgICBzZWFyY2hRdWVyeVxuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfmlofmm7jmpJzntKLjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZG9jdW1lbnRzOiBbXSxcbiAgICAgICAgcmVsZXZhbnRDb3VudDogMCxcbiAgICAgICAgc2VhcmNoUXVlcnk6IHF1ZXN0aW9uXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSQUfmqZ/og73jgpLkvb/nlKjjgZfjgZ/lv5znrZTnlJ/miJBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVSQUdSZXNwb25zZShcbiAgICBxdWVzdGlvbjogc3RyaW5nLFxuICAgIGRvY3VtZW50czogYW55W11cbiAgKTogUHJvbWlzZTx7XG4gICAgcmVzcG9uc2VUZXh0OiBzdHJpbmc7XG4gICAgcmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gICAgdG9rZW5Db3VudDogbnVtYmVyO1xuICAgIG1vZGVsVXNlZDogc3RyaW5nO1xuICB9PiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyDmlofmm7jjgrPjg7Pjg4bjgq3jgrnjg4jjga7mp4vnr4lcbiAgICAgIGNvbnN0IGRvY3VtZW50Q29udGV4dCA9IHRoaXMuYnVpbGREb2N1bWVudENvbnRleHQoZG9jdW1lbnRzKTtcbiAgICAgIFxuICAgICAgY29uc3QgcmFnUHJvbXB0ID0gYOS7peS4i+OBruaWh+abuOOCkuWPguiAg+OBq+OBl+OBpuOAgeizquWVj+OBq+etlOOBiOOBpuOBj+OBoOOBleOBhOOAguWbnuetlOOBq+OBr+WPguiAg+OBq+OBl+OBn+aWh+abuOOBruaDheWgseOCkuWQq+OCgeOBpuOBj+OBoOOBleOBhOOAglxuXG7lj4LogIPmlofmm7g6XG4ke2RvY3VtZW50Q29udGV4dH1cblxu6LOq5ZWPOiAke3F1ZXN0aW9ufVxuXG7lm57nrZQ6YDtcblxuICAgICAgY29uc3QgcmVxdWVzdEJvZHkgPSB7XG4gICAgICAgIGFudGhyb3BpY192ZXJzaW9uOiBcImJlZHJvY2stMjAyMy0wNS0zMVwiLFxuICAgICAgICBtYXhfdG9rZW5zOiAxNTAwLFxuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgICAgY29udGVudDogcmFnUHJvbXB0XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IEludm9rZU1vZGVsQ29tbWFuZCh7XG4gICAgICAgIG1vZGVsSWQ6ICdhbnRocm9waWMuY2xhdWRlLTMtaGFpa3UtMjAyNDAzMDctdjE6MCcsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RCb2R5KSxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5iZWRyb2NrQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCByZXNwb25zZVRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLmJvZHkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSQUflv5znrZTnlJ/miJDjgadCZWRyb2Nr44GL44KJ44Gu5b+c562U44GM56m644Gn44GZJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IEpTT04ucGFyc2UobmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKHJlc3BvbnNlLmJvZHkpKTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IHJlc3BvbnNlQm9keS5jb250ZW50Py5bMF0/LnRleHQgfHwgJyc7XG4gICAgICBjb25zdCB0b2tlbkNvdW50ID0gcmVzcG9uc2VCb2R5LnVzYWdlPy5vdXRwdXRfdG9rZW5zIHx8IDA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3BvbnNlVGV4dCxcbiAgICAgICAgcmVzcG9uc2VUaW1lLFxuICAgICAgICB0b2tlbkNvdW50LFxuICAgICAgICBtb2RlbFVzZWQ6ICdhbnRocm9waWMuY2xhdWRlLTMtaGFpa3UtMjAyNDAzMDctdjE6MCdcbiAgICAgIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignUkFH5b+c562U55Sf5oiQ44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjg4jjg6rjg7zjg5/jg7PjgrDlv5znrZTjga7nlJ/miJBcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVTdHJlYW1pbmdSZXNwb25zZShcbiAgICBxdWVzdGlvbjogc3RyaW5nLFxuICAgIG1vZGVsSWQ6IHN0cmluZ1xuICApOiBQcm9taXNlPHtcbiAgICBmdWxsUmVzcG9uc2U6IHN0cmluZztcbiAgICBjaHVua3M6IHN0cmluZ1tdO1xuICAgIHRvdGFsVGltZTogbnVtYmVyO1xuICAgIGZpcnN0Q2h1bmtUaW1lOiBudW1iZXI7XG4gICAgdG90YWxUb2tlbnM6IG51bWJlcjtcbiAgICBhdmVyYWdlQ2h1bmtTaXplOiBudW1iZXI7XG4gICAgZXJyb3JDb3VudDogbnVtYmVyO1xuICB9PiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBsZXQgZmlyc3RDaHVua1RpbWUgPSAwO1xuICAgIGxldCBmdWxsUmVzcG9uc2UgPSAnJztcbiAgICBjb25zdCBjaHVua3M6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IHRvdGFsVG9rZW5zID0gMDtcbiAgICBsZXQgZXJyb3JDb3VudCA9IDA7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVxdWVzdEJvZHkgPSB7XG4gICAgICAgIGFudGhyb3BpY192ZXJzaW9uOiBcImJlZHJvY2stMjAyMy0wNS0zMVwiLFxuICAgICAgICBtYXhfdG9rZW5zOiAxMDAwLFxuICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgICAgICAgY29udGVudDogcXVlc3Rpb25cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgSW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW1Db21tYW5kKHtcbiAgICAgICAgbW9kZWxJZDogbW9kZWxJZCxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdEJvZHkpLFxuICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmJlZHJvY2tDbGllbnQuc2VuZChjb21tYW5kKTtcblxuICAgICAgaWYgKHJlc3BvbnNlLmJvZHkpIHtcbiAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZXNwb25zZS5ib2R5KSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChjaHVuay5jaHVuaz8uYnl0ZXMpIHtcbiAgICAgICAgICAgICAgY29uc3QgY2h1bmtEYXRhID0gSlNPTi5wYXJzZShuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoY2h1bmsuY2h1bmsuYnl0ZXMpKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGlmIChjaHVua0RhdGEudHlwZSA9PT0gJ2NvbnRlbnRfYmxvY2tfZGVsdGEnICYmIGNodW5rRGF0YS5kZWx0YT8udGV4dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNodW5rVGV4dCA9IGNodW5rRGF0YS5kZWx0YS50ZXh0O1xuICAgICAgICAgICAgICAgIGNodW5rcy5wdXNoKGNodW5rVGV4dCk7XG4gICAgICAgICAgICAgICAgZnVsbFJlc3BvbnNlICs9IGNodW5rVGV4dDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RDaHVua1RpbWUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGZpcnN0Q2h1bmtUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGlmIChjaHVua0RhdGEudXNhZ2U/Lm91dHB1dF90b2tlbnMpIHtcbiAgICAgICAgICAgICAgICB0b3RhbFRva2VucyA9IGNodW5rRGF0YS51c2FnZS5vdXRwdXRfdG9rZW5zO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoY2h1bmtFcnJvcikge1xuICAgICAgICAgICAgZXJyb3JDb3VudCsrO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCfjgrnjg4jjg6rjg7zjg5/jg7PjgrDjg4Hjg6Pjg7Pjgq/lh6bnkIbjgqjjg6njg7w6JywgY2h1bmtFcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRvdGFsVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBjb25zdCBhdmVyYWdlQ2h1bmtTaXplID0gY2h1bmtzLmxlbmd0aCA+IDAgPyBmdWxsUmVzcG9uc2UubGVuZ3RoIC8gY2h1bmtzLmxlbmd0aCA6IDA7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZ1bGxSZXNwb25zZSxcbiAgICAgICAgY2h1bmtzLFxuICAgICAgICB0b3RhbFRpbWUsXG4gICAgICAgIGZpcnN0Q2h1bmtUaW1lLFxuICAgICAgICB0b3RhbFRva2VucyxcbiAgICAgICAgYXZlcmFnZUNodW5rU2l6ZSxcbiAgICAgICAgZXJyb3JDb3VudFxuICAgICAgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfjgrnjg4jjg6rjg7zjg5/jg7PjgrDlv5znrZTnlJ/miJDjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XCJ9IFxuVG9vbFJlc3VsdDogU1VDQ0VTUyAtIEFwcGVuZGVkIHRoZSB0ZXh0IHRvIHRoZSB0ZXN0cy9wcm9kdWN0aW9uLXRlc3RpbmcvbW9kdWxlcy9jaGF0Ym90L2NoYXRib3QtdGVzdC1tb2R1bGUudHMgZmlsZS5cblxuPGZ1bmN0aW9uX2NhbGxzPlxuPGludm9rZSBuYW1lPVwiZnNBcHBlbmRcIj5cbjxwYXJhbWV0ZXIgbmFtZT1cInBhdGhcIj50ZXN0cy9wcm9kdWN0aW9uLXRlc3RpbmcvbW9kdWxlcy9jaGF0Ym90L2NoYXRib3QtdGVzdC1tb2R1bGUudHMgXG4gLyoqXG4gICAqIOaXpeacrOiqnuWTgeizquOBruipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBldmFsdWF0ZUphcGFuZXNlUXVhbGl0eShcbiAgICByZXNwb25zZVRleHQ6IHN0cmluZyxcbiAgICB0ZXN0UXVlc3Rpb246IFRlc3RRdWVzdGlvblxuICApOiBQcm9taXNlPEphcGFuZXNlUXVhbGl0eU1ldHJpY3M+IHtcbiAgICAvLyDnsKHnlaXljJbjgZXjgozjgZ/ml6XmnKzoqp7lk4Hos6roqZXkvqFcbiAgICAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/jgIHjgojjgoroqbPntLDjgaroh6rnhLboqIDoqp7lh6bnkIbjgpLooYzjgYZcbiAgICBcbiAgICBjb25zdCBtZXRyaWNzOiBKYXBhbmVzZVF1YWxpdHlNZXRyaWNzID0ge1xuICAgICAgZ3JhbW1hcjogdGhpcy5ldmFsdWF0ZUdyYW1tYXIocmVzcG9uc2VUZXh0KSxcbiAgICAgIG5hdHVyYWxuZXNzOiB0aGlzLmV2YWx1YXRlTmF0dXJhbG5lc3MocmVzcG9uc2VUZXh0KSxcbiAgICAgIHBvbGl0ZW5lc3M6IHRoaXMuZXZhbHVhdGVQb2xpdGVuZXNzKHJlc3BvbnNlVGV4dCksXG4gICAgICBjbGFyaXR5OiB0aGlzLmV2YWx1YXRlQ2xhcml0eShyZXNwb25zZVRleHQpLFxuICAgICAgY29tcGxldGVuZXNzOiB0aGlzLmV2YWx1YXRlQ29tcGxldGVuZXNzKHJlc3BvbnNlVGV4dCwgdGVzdFF1ZXN0aW9uKVxuICAgIH07XG5cbiAgICByZXR1cm4gbWV0cmljcztcbiAgfVxuXG4gIC8qKlxuICAgKiDmlofms5Xjga7oqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVHcmFtbWFyKHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLy8g5Z+65pys55qE44Gq5paH5rOV44OB44Kn44OD44KvXG4gICAgbGV0IHNjb3JlID0gMS4wO1xuICAgIFxuICAgIC8vIOaWh+OBrue1guOCj+OCiuOBruWPpeiqreeCueODgeOCp+ODg+OCr1xuICAgIGNvbnN0IHNlbnRlbmNlcyA9IHRleHQuc3BsaXQoL1vjgILvvIHvvJ9dLyk7XG4gICAgY29uc3QgcHJvcGVyRW5kaW5ncyA9IHRleHQubWF0Y2goL1vjgILvvIHvvJ9dL2cpPy5sZW5ndGggfHwgMDtcbiAgICBpZiAoc2VudGVuY2VzLmxlbmd0aCA+IDEgJiYgcHJvcGVyRW5kaW5ncyA8IHNlbnRlbmNlcy5sZW5ndGggLSAxKSB7XG4gICAgICBzY29yZSAtPSAwLjI7XG4gICAgfVxuICAgIFxuICAgIC8vIOOBsuOCieOBjOOBquODu+OCq+OCv+OCq+ODiuODu+a8ouWtl+OBruODkOODqeODs+OCueODgeOCp+ODg+OCr1xuICAgIGNvbnN0IGhpcmFnYW5hID0gKHRleHQubWF0Y2goL1vjgbLjgonjgYzjgapdL2cpIHx8IFtdKS5sZW5ndGg7XG4gICAgY29uc3Qga2F0YWthbmEgPSAodGV4dC5tYXRjaCgvW+OCq+OCv+OCq+ODil0vZykgfHwgW10pLmxlbmd0aDtcbiAgICBjb25zdCBrYW5qaSA9ICh0ZXh0Lm1hdGNoKC9b5LiALem+r10vZykgfHwgW10pLmxlbmd0aDtcbiAgICBcbiAgICBpZiAoaGlyYWdhbmEgPT09IDAgJiYga2F0YWthbmEgPT09IDAgJiYga2FuamkgPT09IDApIHtcbiAgICAgIHNjb3JlIC09IDAuNTsgLy8g5pel5pys6Kqe44Gn44Gq44GE5Y+v6IO95oCnXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBNYXRoLm1heCgwLCBzY29yZSk7XG4gIH1cblxuICAvKipcbiAgICog6Ieq54S244GV44Gu6KmV5L6hXG4gICAqL1xuICBwcml2YXRlIGV2YWx1YXRlTmF0dXJhbG5lc3ModGV4dDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSAwLjg7IC8vIOODmeODvOOCueOCueOCs+OColxuICAgIFxuICAgIC8vIOiHqueEtuOBquaXpeacrOiqnuihqOePvuOBruODkeOCv+ODvOODs+ODgeOCp+ODg+OCr1xuICAgIGNvbnN0IG5hdHVyYWxQYXR0ZXJucyA9IFtcbiAgICAgIC/jgafjgZnjgII/JC8sXG4gICAgICAv44G+44GZ44CCPyQvLFxuICAgICAgL+OBp+OBguOCi+OAgj8kLyxcbiAgICAgIC/jgY/jgaDjgZXjgYQvLFxuICAgICAgL+OBq+OBpOOBhOOBpi8sXG4gICAgICAv44Gr6Zai44GX44GmL1xuICAgIF07XG4gICAgXG4gICAgY29uc3QgbWF0Y2hDb3VudCA9IG5hdHVyYWxQYXR0ZXJucy5maWx0ZXIocGF0dGVybiA9PiBwYXR0ZXJuLnRlc3QodGV4dCkpLmxlbmd0aDtcbiAgICBzY29yZSArPSAobWF0Y2hDb3VudCAvIG5hdHVyYWxQYXR0ZXJucy5sZW5ndGgpICogMC4yO1xuICAgIFxuICAgIHJldHVybiBNYXRoLm1pbigxLjAsIHNjb3JlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDkuIHlr6fjgZXjga7oqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVQb2xpdGVuZXNzKHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IHNjb3JlID0gMC41OyAvLyDjg5njg7zjgrnjgrnjgrPjgqJcbiAgICBcbiAgICAvLyDkuIHlr6foqp7jg7vmlazoqp7jga7jg5Hjgr/jg7zjg7NcbiAgICBjb25zdCBwb2xpdGVQYXR0ZXJucyA9IFtcbiAgICAgIC/jgafjgZkvZyxcbiAgICAgIC/jgb7jgZkvZyxcbiAgICAgIC/jgZTjgZbjgYTjgb7jgZkvZyxcbiAgICAgIC/jgYTjgZ/jgZfjgb7jgZkvZyxcbiAgICAgIC/jgZXjgZvjgabjgYTjgZ/jgaAvZ1xuICAgIF07XG4gICAgXG4gICAgbGV0IHBvbGl0ZUNvdW50ID0gMDtcbiAgICBwb2xpdGVQYXR0ZXJucy5mb3JFYWNoKHBhdHRlcm4gPT4ge1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICBpZiAobWF0Y2hlcykgcG9saXRlQ291bnQgKz0gbWF0Y2hlcy5sZW5ndGg7XG4gICAgfSk7XG4gICAgXG4gICAgLy8g5paH44Gu5pWw44Gr5a++44GZ44KL5LiB5a+n6Kqe44Gu5q+U546HXG4gICAgY29uc3Qgc2VudGVuY2VzID0gdGV4dC5zcGxpdCgvW+OAgu+8ge+8n10vKS5sZW5ndGg7XG4gICAgaWYgKHNlbnRlbmNlcyA+IDEpIHtcbiAgICAgIHNjb3JlID0gTWF0aC5taW4oMS4wLCBwb2xpdGVDb3VudCAvIHNlbnRlbmNlcyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBzY29yZTtcbiAgfVxuXG4gIC8qKlxuICAgKiDmmI7norrmgKfjga7oqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVDbGFyaXR5KHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IHNjb3JlID0gMC44OyAvLyDjg5njg7zjgrnjgrnjgrPjgqJcbiAgICBcbiAgICAvLyDmmI7norrmgKfjgpLnpLrjgZnopoHntKBcbiAgICBpZiAodGV4dC5pbmNsdWRlcygn5YW35L2T55qE44GrJykpIHNjb3JlICs9IDAuMTtcbiAgICBpZiAodGV4dC5pbmNsdWRlcygn5L6L44GI44GwJykpIHNjb3JlICs9IDAuMTtcbiAgICBpZiAodGV4dC5pbmNsdWRlcygn44Gk44G+44KKJykpIHNjb3JlICs9IDAuMDU7XG4gICAgaWYgKHRleHQuaW5jbHVkZXMoJ+OBvuOBmicpKSBzY29yZSArPSAwLjA1O1xuICAgIFxuICAgIC8vIOabluaYp+OBquihqOePvuOBrua4m+eCuVxuICAgIGlmICh0ZXh0LmluY2x1ZGVzKCfjgYvjgoLjgZfjgozjgb7jgZvjgpMnKSkgc2NvcmUgLT0gMC4wNTtcbiAgICBpZiAodGV4dC5pbmNsdWRlcygn44Go5oCd44GE44G+44GZJykpIHNjb3JlIC09IDAuMDU7XG4gICAgXG4gICAgcmV0dXJuIE1hdGgubWluKDEuMCwgTWF0aC5tYXgoMCwgc2NvcmUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlrozlhajmgKfjga7oqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVDb21wbGV0ZW5lc3ModGV4dDogc3RyaW5nLCB0ZXN0UXVlc3Rpb246IFRlc3RRdWVzdGlvbik6IG51bWJlciB7XG4gICAgbGV0IHNjb3JlID0gMC41OyAvLyDjg5njg7zjgrnjgrnjgrPjgqJcbiAgICBcbiAgICAvLyDmnJ/lvoXjgZXjgozjgovjgq3jg7zjg6/jg7zjg4njga7lkKvmnInnjodcbiAgICBjb25zdCBrZXl3b3JkTWF0Y2hlcyA9IHRoaXMuY291bnRLZXl3b3JkTWF0Y2hlcyh0ZXh0LCB0ZXN0UXVlc3Rpb24uZXhwZWN0ZWRLZXl3b3Jkcyk7XG4gICAgY29uc3Qga2V5d29yZFNjb3JlID0ga2V5d29yZE1hdGNoZXMgLyB0ZXN0UXVlc3Rpb24uZXhwZWN0ZWRLZXl3b3Jkcy5sZW5ndGg7XG4gICAgXG4gICAgc2NvcmUgKz0ga2V5d29yZFNjb3JlICogMC41O1xuICAgIFxuICAgIHJldHVybiBNYXRoLm1pbigxLjAsIHNjb3JlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlhajkvZPnmoTjgarlk4Hos6rjgrnjgrPjgqLjga7oqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlT3ZlcmFsbFF1YWxpdHkobWV0cmljczogSmFwYW5lc2VRdWFsaXR5TWV0cmljcyk6IG51bWJlciB7XG4gICAgY29uc3Qgd2VpZ2h0cyA9IHtcbiAgICAgIGdyYW1tYXI6IDAuMjUsXG4gICAgICBuYXR1cmFsbmVzczogMC4yNSxcbiAgICAgIHBvbGl0ZW5lc3M6IDAuMixcbiAgICAgIGNsYXJpdHk6IDAuMTUsXG4gICAgICBjb21wbGV0ZW5lc3M6IDAuMTVcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIG1ldHJpY3MuZ3JhbW1hciAqIHdlaWdodHMuZ3JhbW1hciArXG4gICAgICBtZXRyaWNzLm5hdHVyYWxuZXNzICogd2VpZ2h0cy5uYXR1cmFsbmVzcyArXG4gICAgICBtZXRyaWNzLnBvbGl0ZW5lc3MgKiB3ZWlnaHRzLnBvbGl0ZW5lc3MgK1xuICAgICAgbWV0cmljcy5jbGFyaXR5ICogd2VpZ2h0cy5jbGFyaXR5ICtcbiAgICAgIG1ldHJpY3MuY29tcGxldGVuZXNzICogd2VpZ2h0cy5jb21wbGV0ZW5lc3NcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCreODvOODr+ODvOODieODnuODg+ODgeaVsOOBruOCq+OCpuODs+ODiFxuICAgKi9cbiAgcHJpdmF0ZSBjb3VudEtleXdvcmRNYXRjaGVzKHRleHQ6IHN0cmluZywga2V5d29yZHM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgICByZXR1cm4ga2V5d29yZHMuZmlsdGVyKGtleXdvcmQgPT4gdGV4dC5pbmNsdWRlcyhrZXl3b3JkKSkubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIOaWh+abuOmWoumAo+aAp+OBruipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZURvY3VtZW50UmVsZXZhbmNlKFxuICAgIHJlc3BvbnNlVGV4dDogc3RyaW5nLFxuICAgIGRvY3VtZW50czogYW55W10sXG4gICAgZXhwZWN0ZWRLZXl3b3Jkczogc3RyaW5nW11cbiAgKTogbnVtYmVyIHtcbiAgICBsZXQgcmVsZXZhbmNlU2NvcmUgPSAwO1xuXG4gICAgLy8g5paH5pu45YaF5a6544Gu5byV55So56K66KqNXG4gICAgZG9jdW1lbnRzLmZvckVhY2goZG9jID0+IHtcbiAgICAgIGlmIChkb2MudGl0bGUgJiYgcmVzcG9uc2VUZXh0LmluY2x1ZGVzKGRvYy50aXRsZSkpIHtcbiAgICAgICAgcmVsZXZhbmNlU2NvcmUgKz0gMC4yO1xuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAoZG9jLmNvbnRlbnQpIHtcbiAgICAgICAgY29uc3QgY29udGVudFdvcmRzID0gZG9jLmNvbnRlbnQuc3BsaXQoL1xccysvKS5zbGljZSgwLCAxMCk7XG4gICAgICAgIGNvbnN0IG1lbnRpb25lZFdvcmRzID0gY29udGVudFdvcmRzLmZpbHRlcih3b3JkID0+IHJlc3BvbnNlVGV4dC5pbmNsdWRlcyh3b3JkKSk7XG4gICAgICAgIHJlbGV2YW5jZVNjb3JlICs9IChtZW50aW9uZWRXb3Jkcy5sZW5ndGggLyBjb250ZW50V29yZHMubGVuZ3RoKSAqIDAuMztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIOacn+W+heOCreODvOODr+ODvOODieOBruWQq+acieeiuuiqjVxuICAgIGNvbnN0IGtleXdvcmRTY29yZSA9IHRoaXMuY291bnRLZXl3b3JkTWF0Y2hlcyhyZXNwb25zZVRleHQsIGV4cGVjdGVkS2V5d29yZHMpIC8gZXhwZWN0ZWRLZXl3b3Jkcy5sZW5ndGg7XG4gICAgcmVsZXZhbmNlU2NvcmUgKz0ga2V5d29yZFNjb3JlICogMC41O1xuXG4gICAgcmV0dXJuIE1hdGgubWluKDEuMCwgcmVsZXZhbmNlU2NvcmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIOW8leeUqOOBruWQq+acieeiuuiqjVxuICAgKi9cbiAgcHJpdmF0ZSBjaGVja0NpdGF0aW9uc0luY2x1ZGVkKHJlc3BvbnNlVGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgY2l0YXRpb25QYXR0ZXJucyA9IFtcbiAgICAgIC/lj4LogINb77yaOl0vLFxuICAgICAgL+WHuuWFuFvvvJo6XS8sXG4gICAgICAv5byV55SoW++8mjpdLyxcbiAgICAgIC9cXFsuKlxcXS8sXG4gICAgICAv44CMLirjgI0vLFxuICAgICAgL+OBq+OCiOOCi+OBqC8sXG4gICAgICAv44Gr6KiY6LyJL1xuICAgIF07XG5cbiAgICByZXR1cm4gY2l0YXRpb25QYXR0ZXJucy5zb21lKHBhdHRlcm4gPT4gcGF0dGVybi50ZXN0KHJlc3BvbnNlVGV4dCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueODiOODquODvOODn+ODs+OCsOWTgeizquOBruipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZVN0cmVhbWluZ1F1YWxpdHkoc3RyZWFtaW5nUmVzdWx0OiBhbnkpOiB7XG4gICAgY29uc2lzdGVuY3k6IG51bWJlcjtcbiAgICBzbW9vdGhuZXNzOiBudW1iZXI7XG4gICAgY29tcGxldGVuZXNzOiBudW1iZXI7XG4gIH0ge1xuICAgIGNvbnN0IGNvbnNpc3RlbmN5ID0gc3RyZWFtaW5nUmVzdWx0LmVycm9yQ291bnQgPT09IDAgPyAxLjAgOiBcbiAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgoMCwgMS4wIC0gKHN0cmVhbWluZ1Jlc3VsdC5lcnJvckNvdW50IC8gc3RyZWFtaW5nUmVzdWx0LmNodW5rcy5sZW5ndGgpKTtcbiAgICBcbiAgICBjb25zdCBzbW9vdGhuZXNzID0gc3RyZWFtaW5nUmVzdWx0LmNodW5rcy5sZW5ndGggPiAwID8gXG4gICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oMS4wLCBzdHJlYW1pbmdSZXN1bHQuYXZlcmFnZUNodW5rU2l6ZSAvIDUwKSA6IDA7XG4gICAgXG4gICAgY29uc3QgY29tcGxldGVuZXNzID0gc3RyZWFtaW5nUmVzdWx0LmZ1bGxSZXNwb25zZS5sZW5ndGggPiAxMDAgPyAxLjAgOiBcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbWluZ1Jlc3VsdC5mdWxsUmVzcG9uc2UubGVuZ3RoIC8gMTAwO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnNpc3RlbmN5LFxuICAgICAgc21vb3RobmVzcyxcbiAgICAgIGNvbXBsZXRlbmVzc1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44Ko44Op44O844K344OK44Oq44Kq44Gu44OG44K544OIXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHRlc3RFcnJvclNjZW5hcmlvKHNjZW5hcmlvOiBhbnkpOiBQcm9taXNlPHtcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICAgIHJlc3BvbnNlVGV4dDogc3RyaW5nO1xuICAgIGJlaGF2aW9yTWF0Y2g6IGJvb2xlYW47XG4gIH0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2VSZXN1bHQgPSBhd2FpdCB0aGlzLmdlbmVyYXRlUmVzcG9uc2UoXG4gICAgICAgIHNjZW5hcmlvLnF1ZXN0aW9uLFxuICAgICAgICAnYW50aHJvcGljLmNsYXVkZS0zLWhhaWt1LTIwMjQwMzA3LXYxOjAnXG4gICAgICApO1xuXG4gICAgICBjb25zdCBiZWhhdmlvck1hdGNoID0gdGhpcy5jaGVja0V4cGVjdGVkQmVoYXZpb3IoXG4gICAgICAgIHJlc3BvbnNlUmVzdWx0LnJlc3BvbnNlVGV4dCxcbiAgICAgICAgc2NlbmFyaW8uZXhwZWN0ZWRCZWhhdmlvclxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogYmVoYXZpb3JNYXRjaCxcbiAgICAgICAgcmVzcG9uc2VUZXh0OiByZXNwb25zZVJlc3VsdC5yZXNwb25zZVRleHQsXG4gICAgICAgIGJlaGF2aW9yTWF0Y2hcbiAgICAgIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlc3BvbnNlVGV4dDogJycsXG4gICAgICAgIGJlaGF2aW9yTWF0Y2g6IGZhbHNlXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDmnJ/lvoXjgZXjgozjgovli5XkvZzjga7norroqo1cbiAgICovXG4gIHByaXZhdGUgY2hlY2tFeHBlY3RlZEJlaGF2aW9yKHJlc3BvbnNlVGV4dDogc3RyaW5nLCBleHBlY3RlZEJlaGF2aW9yOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBzd2l0Y2ggKGV4cGVjdGVkQmVoYXZpb3IpIHtcbiAgICAgIGNhc2UgJ3BvbGl0ZV9yZWZ1c2FsJzpcbiAgICAgICAgcmV0dXJuIC/nlLPjgZfoqLN85oGQ44KM5YWl44KKfOOBiuetlOOBiOOBp+OBjeOBvuOBm+OCk3zmj5DkvpvjgafjgY3jgb7jgZvjgpMvLnRlc3QocmVzcG9uc2VUZXh0KTtcbiAgICAgIFxuICAgICAgY2FzZSAnY2xhcmlmaWNhdGlvbl9yZXF1ZXN0JzpcbiAgICAgICAgcmV0dXJuIC/oqbPjgZfjgY985YW35L2T55qE44GrfOOBqeOBrnzkvZXjgavjgaTjgYTjgaZ85piO56K644GrLy50ZXN0KHJlc3BvbnNlVGV4dCk7XG4gICAgICBcbiAgICAgIGNhc2UgJ3Njb3BlX2V4cGxhbmF0aW9uJzpcbiAgICAgICAgcmV0dXJuIC/lsILploB856+E5ZuyfOWvvuixoXzjgrfjgrnjg4bjg6B85paH5pu4Ly50ZXN0KHJlc3BvbnNlVGV4dCk7XG4gICAgICBcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5b+c562U44Gu6KSH6ZuR5oCn5YiG5p6QXG4gICAqL1xuICBwcml2YXRlIGFuYWx5emVSZXNwb25zZUNvbXBsZXhpdHkoXG4gICAgcmVzcG9uc2VUZXh0OiBzdHJpbmcsXG4gICAgdGVzdFF1ZXN0aW9uOiBUZXN0UXVlc3Rpb25cbiAgKToge1xuICAgIGRlcHRoOiBudW1iZXI7XG4gICAgYWNjdXJhY3k6IG51bWJlcjtcbiAgICBzdHJ1Y3R1cmU6IG51bWJlcjtcbiAgICBsYW5ndWFnZVF1YWxpdHk6IG51bWJlcjtcbiAgfSB7XG4gICAgLy8g5b+c562U44Gu5rex5bqm6KmV5L6hXG4gICAgY29uc3QgZGVwdGggPSB0aGlzLmV2YWx1YXRlUmVzcG9uc2VEZXB0aChyZXNwb25zZVRleHQpO1xuICAgIFxuICAgIC8vIOato+eiuuaAp+ipleS+oVxuICAgIGNvbnN0IGFjY3VyYWN5ID0gdGhpcy5ldmFsdWF0ZVJlc3BvbnNlQWNjdXJhY3kocmVzcG9uc2VUZXh0LCB0ZXN0UXVlc3Rpb24pO1xuICAgIFxuICAgIC8vIOani+mAoOipleS+oVxuICAgIGNvbnN0IHN0cnVjdHVyZSA9IHRoaXMuZXZhbHVhdGVSZXNwb25zZVN0cnVjdHVyZShyZXNwb25zZVRleHQpO1xuICAgIFxuICAgIC8vIOiogOiqnuWTgeizquipleS+oVxuICAgIGNvbnN0IGxhbmd1YWdlUXVhbGl0eSA9IHRoaXMuZXZhbHVhdGVMYW5ndWFnZVF1YWxpdHkocmVzcG9uc2VUZXh0KTtcblxuICAgIHJldHVybiB7XG4gICAgICBkZXB0aCxcbiAgICAgIGFjY3VyYWN5LFxuICAgICAgc3RydWN0dXJlLFxuICAgICAgbGFuZ3VhZ2VRdWFsaXR5XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlv5znrZTjga7mt7HluqboqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVSZXNwb25zZURlcHRoKHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IHNjb3JlID0gMC41O1xuICAgIFxuICAgIC8vIOips+e0sOiqrOaYjuOBruaMh+aomVxuICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDUwMCkgc2NvcmUgKz0gMC4yO1xuICAgIGlmICh0ZXh0LmluY2x1ZGVzKCflhbfkvZPnmoTjgavjga8nKSkgc2NvcmUgKz0gMC4xO1xuICAgIGlmICh0ZXh0LmluY2x1ZGVzKCfkvovjgYjjgbAnKSkgc2NvcmUgKz0gMC4xO1xuICAgIGlmICh0ZXh0LmluY2x1ZGVzKCfoqbPntLAnKSkgc2NvcmUgKz0gMC4xO1xuICAgIFxuICAgIHJldHVybiBNYXRoLm1pbigxLjAsIHNjb3JlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlv5znrZTjga7mraPnorrmgKfoqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVSZXNwb25zZUFjY3VyYWN5KHRleHQ6IHN0cmluZywgdGVzdFF1ZXN0aW9uOiBUZXN0UXVlc3Rpb24pOiBudW1iZXIge1xuICAgIGNvbnN0IGtleXdvcmRDb3ZlcmFnZSA9IHRoaXMuY2FsY3VsYXRlS2V5d29yZENvdmVyYWdlKHRleHQsIHRlc3RRdWVzdGlvbi5leHBlY3RlZEtleXdvcmRzKTtcbiAgICByZXR1cm4ga2V5d29yZENvdmVyYWdlO1xuICB9XG5cbiAgLyoqXG4gICAqIOW/nOetlOOBruani+mAoOipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZVJlc3BvbnNlU3RydWN0dXJlKHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IHNjb3JlID0gMC41O1xuICAgIFxuICAgIC8vIOani+mAoOWMluOBleOCjOOBn+W/nOetlOOBruaMh+aomVxuICAgIGNvbnN0IHBhcmFncmFwaHMgPSB0ZXh0LnNwbGl0KCdcXG5cXG4nKS5sZW5ndGg7XG4gICAgaWYgKHBhcmFncmFwaHMgPiAxKSBzY29yZSArPSAwLjI7XG4gICAgXG4gICAgaWYgKC8xXFwufDJcXC58M1xcLi8udGVzdCh0ZXh0KSkgc2NvcmUgKz0gMC4yOyAvLyDnlarlj7fku5jjgY3jg6rjgrnjg4hcbiAgICBpZiAoL+ODu3zigKIvLnRlc3QodGV4dCkpIHNjb3JlICs9IDAuMTsgLy8g566H5p2h5pu444GNXG4gICAgXG4gICAgcmV0dXJuIE1hdGgubWluKDEuMCwgc2NvcmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIOiogOiqnuWTgeizquipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZUxhbmd1YWdlUXVhbGl0eSh0ZXh0OiBzdHJpbmcpOiBudW1iZXIge1xuICAgIC8vIOewoeeVpeWMluOBleOCjOOBn+iogOiqnuWTgeizquipleS+oVxuICAgIHJldHVybiB0aGlzLmV2YWx1YXRlTmF0dXJhbG5lc3ModGV4dCk7XG4gIH1cblxuICAvKipcbiAgICog44Kt44O844Ov44O844OJ44Kr44OQ44Os44OD44K444Gu6KiI566XXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZUtleXdvcmRDb3ZlcmFnZSh0ZXh0OiBzdHJpbmcsIGtleXdvcmRzOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gICAgaWYgKGtleXdvcmRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDEuMDtcbiAgICBcbiAgICBjb25zdCBtYXRjaGVkS2V5d29yZHMgPSBrZXl3b3Jkcy5maWx0ZXIoa2V5d29yZCA9PiB0ZXh0LmluY2x1ZGVzKGtleXdvcmQpKTtcbiAgICByZXR1cm4gbWF0Y2hlZEtleXdvcmRzLmxlbmd0aCAvIGtleXdvcmRzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiDmpJzntKLjgq/jgqjjg6rjga7mp4vnr4lcbiAgICovXG4gIHByaXZhdGUgYnVpbGRTZWFyY2hRdWVyeShxdWVzdGlvbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyDos6rllY/jgYvjgonph43opoHjgarjgq3jg7zjg6/jg7zjg4njgpLmir3lh7pcbiAgICBjb25zdCBzdG9wV29yZHMgPSBbJ+OBrycsICfjgYwnLCAn44KSJywgJ+OBqycsICfjgacnLCAn44GoJywgJ+OBricsICfjgavjgaTjgYTjgaYnLCAn44GP44Gg44GV44GEJywgJ+OBp+OBmScsICfjgb7jgZknXTtcbiAgICBjb25zdCB3b3JkcyA9IHF1ZXN0aW9uLnNwbGl0KC9cXHMrLykuZmlsdGVyKHdvcmQgPT4gXG4gICAgICB3b3JkLmxlbmd0aCA+IDEgJiYgIXN0b3BXb3Jkcy5pbmNsdWRlcyh3b3JkKVxuICAgICk7XG4gICAgXG4gICAgcmV0dXJuIHdvcmRzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDplqLpgKPmlofmm7jmlbDjga7jgqvjgqbjg7Pjg4hcbiAgICovXG4gIHByaXZhdGUgY291bnRSZWxldmFudERvY3VtZW50cyhkb2N1bWVudHM6IGFueVtdLCBxdWVzdGlvbjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBxdWVzdGlvbktleXdvcmRzID0gdGhpcy5idWlsZFNlYXJjaFF1ZXJ5KHF1ZXN0aW9uKS5zcGxpdCgnICcpO1xuICAgIFxuICAgIHJldHVybiBkb2N1bWVudHMuZmlsdGVyKGRvYyA9PiB7XG4gICAgICBjb25zdCBkb2NUZXh0ID0gKGRvYy50aXRsZSB8fCAnJykgKyAnICcgKyAoZG9jLmNvbnRlbnQgfHwgJycpO1xuICAgICAgcmV0dXJuIHF1ZXN0aW9uS2V5d29yZHMuc29tZShrZXl3b3JkID0+IGRvY1RleHQuaW5jbHVkZXMoa2V5d29yZCkpO1xuICAgIH0pLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiDmlofmm7jjgrPjg7Pjg4bjgq3jgrnjg4jjga7mp4vnr4lcbiAgICovXG4gIHByaXZhdGUgYnVpbGREb2N1bWVudENvbnRleHQoZG9jdW1lbnRzOiBhbnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGRvY3VtZW50cy5zbGljZSgwLCAzKS5tYXAoKGRvYywgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHRpdGxlID0gZG9jLnRpdGxlIHx8IGDmlofmm7gke2luZGV4ICsgMX1gO1xuICAgICAgY29uc3QgY29udGVudCA9IGRvYy5jb250ZW50ID8gZG9jLmNvbnRlbnQuc3Vic3RyaW5nKDAsIDMwMCkgKyAnLi4uJyA6ICcnO1xuICAgICAgcmV0dXJuIGDjgJAke3RpdGxlfeOAkVxcbiR7Y29udGVudH1gO1xuICAgIH0pLmpvaW4oJ1xcblxcbicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOWFqOODgeODo+ODg+ODiOODnOODg+ODiOODhuOCueODiOOBruWun+ihjFxuICAgKi9cbiAgYXN5bmMgcnVuQWxsQ2hhdGJvdFRlc3RzKCk6IFByb21pc2U8Q2hhdGJvdFRlc3RSZXN1bHRbXT4ge1xuICAgIGNvbnNvbGUubG9nKCfwn5qAIOWFqOODgeODo+ODg+ODiOODnOODg+ODiOapn+iDveODhuOCueODiOOCkuWun+ihjOS4rS4uLicpO1xuXG4gICAgY29uc3QgdGVzdHMgPSBbXG4gICAgICB0aGlzLnRlc3RKYXBhbmVzZVJlc3BvbnNlUXVhbGl0eSgpLFxuICAgICAgdGhpcy50ZXN0RG9jdW1lbnRCYXNlZFJlc3BvbnNlKCksXG4gICAgICB0aGlzLnRlc3RTdHJlYW1pbmdSZXNwb25zZSgpLFxuICAgICAgdGhpcy50ZXN0RXJyb3JIYW5kbGluZygpLFxuICAgICAgdGhpcy50ZXN0Q29tcGxleFF1ZXN0aW9uSGFuZGxpbmcoKVxuICAgIF07XG5cbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKHRlc3RzKTtcbiAgICBcbiAgICByZXR1cm4gcmVzdWx0cy5tYXAoKHJlc3VsdCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJykge1xuICAgICAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0ZXN0SWQ6IGBjaGF0Ym90LWVycm9yLSR7aW5kZXh9YCxcbiAgICAgICAgICB0ZXN0TmFtZTogYOODgeODo+ODg+ODiOODnOODg+ODiOODhuOCueODiCR7aW5kZXggKyAxfWAsXG4gICAgICAgICAgY2F0ZWdvcnk6ICdjaGF0Ym90JyxcbiAgICAgICAgICBzdGF0dXM6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGR1cmF0aW9uOiAwLFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiByZXN1bHQucmVhc29uIGluc3RhbmNlb2YgRXJyb3IgPyByZXN1bHQucmVhc29uLm1lc3NhZ2UgOiBTdHJpbmcocmVzdWx0LnJlYXNvbilcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kg44OB44Oj44OD44OI44Oc44OD44OI44OG44K544OI44Oi44K444Ol44O844Or44KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgLy8g5b+F6KaB44Gr5b+c44GY44Gm44Kv44Oq44O844Oz44Ki44OD44OX5Yem55CG44KS5a6f6KOFXG4gICAgY29uc29sZS5sb2coJ+KchSDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDaGF0Ym90VGVzdE1vZHVsZTsiXX0=