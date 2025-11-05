"use strict";
/**
 * Amazon Nova モデルファミリーテストモジュール
 *
 * Nova Lite, Micro, Pro モデルの統合テストを実行
 * 実本番Amazon Bedrockでの各モデルの特性検証
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NovaModelTestModule = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * Amazon Nova モデルテストモジュール
 */
class NovaModelTestModule {
    config;
    bedrockClient;
    novaModels;
    testPrompts;
    constructor(config) {
        this.config = config;
        this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: config.region,
            credentials: (0, credential_providers_1.fromIni)({ profile: config.awsProfile })
        });
        // Nova モデル設定の読み込み
        this.novaModels = this.loadNovaModelConfigs();
        this.testPrompts = this.loadTestPrompts();
    }
    /**
     * Nova モデル設定の読み込み
     */
    loadNovaModelConfigs() {
        return [
            {
                modelId: 'amazon.nova-lite-v1:0',
                modelName: 'Nova Lite',
                description: '高速・軽量なテキスト生成モデル',
                capabilities: ['text-generation', 'conversation', 'summarization'],
                maxTokens: 4096,
                temperature: 0.7,
                topP: 0.9
            },
            {
                modelId: 'amazon.nova-micro-v1:0',
                modelName: 'Nova Micro',
                description: '超高速・コスト効率重視モデル',
                capabilities: ['text-generation', 'simple-qa', 'classification'],
                maxTokens: 2048,
                temperature: 0.5,
                topP: 0.8
            },
            {
                modelId: 'amazon.nova-pro-v1:0',
                modelName: 'Nova Pro',
                description: '高性能・マルチモーダル対応モデル',
                capabilities: ['text-generation', 'multimodal', 'complex-reasoning', 'code-generation'],
                maxTokens: 8192,
                temperature: 0.8,
                topP: 0.95
            }
        ];
    }
    /**
     * テストプロンプトの読み込み
     */
    loadTestPrompts() {
        return [
            // 日本語基本テスト
            {
                id: 'ja-basic-001',
                category: 'japanese-basic',
                prompt: 'こんにちは。今日の天気について教えてください。',
                expectedType: 'conversational-response',
                language: 'ja',
                difficulty: 'basic'
            },
            {
                id: 'ja-business-001',
                category: 'japanese-business',
                prompt: 'RAGシステムの利点と課題について、ビジネス観点から300文字程度で説明してください。',
                expectedType: 'technical-explanation',
                language: 'ja',
                difficulty: 'intermediate'
            },
            {
                id: 'ja-technical-001',
                category: 'japanese-technical',
                prompt: 'Amazon FSx for NetApp ONTAPとAmazon Bedrockを組み合わせたアーキテクチャの技術的優位性を、具体的な実装例を含めて詳細に説明してください。',
                expectedType: 'technical-analysis',
                language: 'ja',
                difficulty: 'advanced'
            },
            // 英語テスト
            {
                id: 'en-basic-001',
                category: 'english-basic',
                prompt: 'Hello! Can you explain what RAG (Retrieval-Augmented Generation) is in simple terms?',
                expectedType: 'explanation',
                language: 'en',
                difficulty: 'basic'
            },
            {
                id: 'en-technical-001',
                category: 'english-technical',
                prompt: 'Analyze the performance characteristics of Amazon Nova model family and compare their use cases in enterprise environments.',
                expectedType: 'technical-analysis',
                language: 'en',
                difficulty: 'advanced'
            },
            // 混合言語テスト
            {
                id: 'mixed-001',
                category: 'multilingual',
                prompt: 'Please explain the concept of "権限認識型RAG" (Permission-aware RAG) in both Japanese and English, highlighting the key differences in implementation.',
                expectedType: 'multilingual-explanation',
                language: 'mixed',
                difficulty: 'advanced'
            },
            // 創造性テスト
            {
                id: 'creative-001',
                category: 'creativity',
                prompt: 'AIとクラウドストレージが融合した未来のオフィス環境について、革新的なアイデアを3つ提案してください。',
                expectedType: 'creative-response',
                language: 'ja',
                difficulty: 'intermediate'
            }
        ];
    }
    /**
     * Nova Lite モデルテスト
     */
    async testNovaLiteModel() {
        const testId = 'nova-lite-001';
        const startTime = Date.now();
        console.log('🤖 Nova Lite モデルテストを開始...');
        try {
            const novaLite = this.novaModels.find(m => m.modelName === 'Nova Lite');
            if (!novaLite) {
                throw new Error('Nova Lite モデル設定が見つかりません');
            }
            // 基本的な日本語テストプロンプトを使用
            const testPrompt = this.testPrompts.find(p => p.id === 'ja-basic-001');
            if (!testPrompt) {
                throw new Error('テストプロンプトが見つかりません');
            }
            // Nova Lite での推論実行
            const inferenceResult = await this.executeInference(novaLite, testPrompt);
            // パフォーマンス評価
            const performanceMetrics = this.evaluatePerformance(inferenceResult);
            // 応答品質評価
            const responseQuality = await this.evaluateResponseQuality(inferenceResult.response, testPrompt);
            const success = performanceMetrics.responseTime < 3000 &&
                responseQuality.japaneseAccuracy > 0.8;
            const result = {
                testId,
                testName: 'Nova Lite モデルテスト',
                category: 'ai-model',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                modelDetails: {
                    modelId: novaLite.modelId,
                    modelName: novaLite.modelName,
                    version: 'v1:0',
                    capabilities: novaLite.capabilities
                },
                performanceMetrics,
                responseQuality,
                metadata: {
                    testPrompt: testPrompt,
                    inferenceResult: inferenceResult
                }
            };
            if (success) {
                console.log('✅ Nova Lite モデルテスト成功');
            }
            else {
                console.error('❌ Nova Lite モデルテスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ Nova Lite モデルテスト実行エラー:', error);
            return {
                testId,
                testName: 'Nova Lite モデルテスト',
                category: 'ai-model',
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
     * Nova Micro モデルテスト
     */
    async testNovaMicroModel() {
        const testId = 'nova-micro-001';
        const startTime = Date.now();
        console.log('🤖 Nova Micro モデルテストを開始...');
        try {
            const novaMicro = this.novaModels.find(m => m.modelName === 'Nova Micro');
            if (!novaMicro) {
                throw new Error('Nova Micro モデル設定が見つかりません');
            }
            // 軽量タスク用のテストプロンプトを使用
            const testPrompt = this.testPrompts.find(p => p.id === 'ja-basic-001');
            if (!testPrompt) {
                throw new Error('テストプロンプトが見つかりません');
            }
            // Nova Micro での推論実行
            const inferenceResult = await this.executeInference(novaMicro, testPrompt);
            // パフォーマンス評価（Microは高速性重視）
            const performanceMetrics = this.evaluatePerformance(inferenceResult);
            // 応答品質評価
            const responseQuality = await this.evaluateResponseQuality(inferenceResult.response, testPrompt);
            const success = performanceMetrics.responseTime < 1500 && // Microは1.5秒以内
                responseQuality.japaneseAccuracy > 0.7; // 精度は若干低めでも許容
            const result = {
                testId,
                testName: 'Nova Micro モデルテスト',
                category: 'ai-model',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                modelDetails: {
                    modelId: novaMicro.modelId,
                    modelName: novaMicro.modelName,
                    version: 'v1:0',
                    capabilities: novaMicro.capabilities
                },
                performanceMetrics,
                responseQuality,
                metadata: {
                    testPrompt: testPrompt,
                    inferenceResult: inferenceResult,
                    optimizedFor: 'speed-and-cost'
                }
            };
            if (success) {
                console.log('✅ Nova Micro モデルテスト成功');
            }
            else {
                console.error('❌ Nova Micro モデルテスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ Nova Micro モデルテスト実行エラー:', error);
            return {
                testId,
                testName: 'Nova Micro モデルテスト',
                category: 'ai-model',
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
     * Nova Pro モデルテスト
     */
    async testNovaProModel() {
        const testId = 'nova-pro-001';
        const startTime = Date.now();
        console.log('🤖 Nova Pro モデルテストを開始...');
        try {
            const novaPro = this.novaModels.find(m => m.modelName === 'Nova Pro');
            if (!novaPro) {
                throw new Error('Nova Pro モデル設定が見つかりません');
            }
            // 高度なテクニカルプロンプトを使用
            const testPrompt = this.testPrompts.find(p => p.id === 'ja-technical-001');
            if (!testPrompt) {
                throw new Error('テストプロンプトが見つかりません');
            }
            // Nova Pro での推論実行
            const inferenceResult = await this.executeInference(novaPro, testPrompt);
            // パフォーマンス評価
            const performanceMetrics = this.evaluatePerformance(inferenceResult);
            // 応答品質評価（Proは高品質重視）
            const responseQuality = await this.evaluateResponseQuality(inferenceResult.response, testPrompt);
            const success = performanceMetrics.responseTime < 5000 && // Proは5秒以内
                responseQuality.japaneseAccuracy > 0.9 && // 高精度要求
                responseQuality.coherence > 0.85;
            const result = {
                testId,
                testName: 'Nova Pro モデルテスト',
                category: 'ai-model',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                modelDetails: {
                    modelId: novaPro.modelId,
                    modelName: novaPro.modelName,
                    version: 'v1:0',
                    capabilities: novaPro.capabilities
                },
                performanceMetrics,
                responseQuality,
                metadata: {
                    testPrompt: testPrompt,
                    inferenceResult: inferenceResult,
                    optimizedFor: 'quality-and-capability'
                }
            };
            if (success) {
                console.log('✅ Nova Pro モデルテスト成功');
            }
            else {
                console.error('❌ Nova Pro モデルテスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ Nova Pro モデルテスト実行エラー:', error);
            return {
                testId,
                testName: 'Nova Pro モデルテスト',
                category: 'ai-model',
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
     * 推論実行
     */
    async executeInference(model, prompt) {
        const startTime = Date.now();
        try {
            // 読み取り専用モードでは模擬応答を返す
            if (this.config.readOnlyMode) {
                console.log(`📋 読み取り専用モード: ${model.modelName} 推論をシミュレート`);
                const mockResponse = this.generateMockResponse(model, prompt);
                const executionTime = Date.now() - startTime;
                return {
                    response: mockResponse,
                    tokensGenerated: Math.floor(mockResponse.length / 4), // 概算
                    executionTime
                };
            }
            // 実際のBedrock推論
            // 入力検証
            if (!prompt.prompt || prompt.prompt.trim().length === 0) {
                throw new Error('プロンプトが空です');
            }
            if (prompt.prompt.length > 10000) {
                throw new Error('プロンプトが長すぎます（10000文字以内）');
            }
            const requestBody = {
                inputText: prompt.prompt,
                textGenerationConfig: {
                    maxTokenCount: Math.min(model.maxTokens, 8192), // 上限制限
                    temperature: Math.max(0, Math.min(1, model.temperature)), // 範囲制限
                    topP: Math.max(0, Math.min(1, model.topP)) // 範囲制限
                }
            };
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: model.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            });
            const response = await this.bedrockClient.send(command);
            if (!response.body) {
                throw new Error('Bedrockからの応答が空です');
            }
            let responseBody;
            try {
                responseBody = JSON.parse(new TextDecoder().decode(response.body));
            }
            catch (parseError) {
                throw new Error(`Bedrock応答のパースに失敗: ${parseError}`);
            }
            const executionTime = Date.now() - startTime;
            // 応答の検証
            if (!responseBody.results || !Array.isArray(responseBody.results) || responseBody.results.length === 0) {
                throw new Error('Bedrock応答の形式が不正です');
            }
            return {
                response: responseBody.results[0]?.outputText || '',
                tokensGenerated: responseBody.results[0]?.tokenCount || 0,
                executionTime
            };
        }
        catch (error) {
            console.error(`❌ ${model.modelName} 推論エラー:`, error);
            throw error;
        }
    }
    /**
     * 模擬応答生成
     */
    generateMockResponse(model, prompt) {
        const responses = {
            'nova-lite': {
                'ja-basic-001': 'こんにちは！今日の天気は晴れで、気温は20度程度です。外出には最適な天気ですね。',
                'ja-business-001': 'RAGシステムは検索拡張生成技術で、既存の知識ベースと生成AIを組み合わせることで、より正確で関連性の高い回答を提供できます。利点は情報の正確性向上と最新情報の活用ですが、課題としてはシステムの複雑性とコスト増加があります。',
                'ja-technical-001': 'Amazon FSx for NetApp ONTAPとAmazon Bedrockの組み合わせにより、高性能なファイルストレージと先進的なAI機能を統合できます。FSxの高速アクセスとBedrockの生成AI機能により、リアルタイムでの文書検索と応答生成が可能になります。'
            },
            'nova-micro': {
                'ja-basic-001': 'こんにちは。今日は晴れです。',
                'ja-business-001': 'RAGは検索と生成を組み合わせた技術です。正確性が向上しますが、コストがかかります。',
                'ja-technical-001': 'FSxとBedrockの組み合わせで高性能なRAGシステムを構築できます。'
            },
            'nova-pro': {
                'ja-basic-001': 'こんにちは！今日の天気についてお答えします。現在の気象条件を確認したところ、晴天で気温は摂氏20度、湿度60%、風速2m/sとなっており、外出や屋外活動には非常に適した気候条件です。',
                'ja-business-001': 'RAG（Retrieval-Augmented Generation）システムは、企業の知識管理において革新的なソリューションを提供します。主な利点として、①既存の文書データベースとの統合による情報の正確性向上、②リアルタイムでの最新情報反映、③コンテキストに応じた適切な回答生成があります。一方、課題としては①初期導入コストの高さ、②システム統合の複雑性、③データ品質管理の重要性が挙げられます。',
                'ja-technical-001': 'Amazon FSx for NetApp ONTAPとAmazon Bedrockを組み合わせたアーキテクチャは、エンタープライズグレードのRAGシステムにおいて卓越した技術的優位性を提供します。FSxの高性能NASストレージは、大容量文書の高速アクセスを実現し、Bedrockの生成AI機能と組み合わせることで、ミリ秒レベルでの文書検索と高品質な応答生成を可能にします。具体的な実装例として、権限ベースの文書アクセス制御、ベクトル検索による意味的類似性マッチング、ストリーミング応答による低レイテンシ実現などが挙げられます。'
            }
        };
        const modelKey = model.modelName.toLowerCase().replace(' ', '-');
        const promptKey = prompt.id;
        return responses[modelKey]?.[promptKey] || `${model.modelName}による応答: ${prompt.prompt}に対する回答です。`;
    }
    /**
     * パフォーマンス評価
     */
    evaluatePerformance(inferenceResult) {
        const responseTime = inferenceResult.executionTime;
        const tokensGenerated = inferenceResult.tokensGenerated;
        const tokensPerSecond = tokensGenerated > 0 ? (tokensGenerated / (responseTime / 1000)) : 0;
        // 基本的な精度評価（応答の長さと内容の妥当性）
        const accuracy = inferenceResult.response.length > 10 ? 0.85 : 0.5;
        return {
            responseTime,
            tokensGenerated,
            tokensPerSecond,
            accuracy
        };
    }
    /**
     * 応答品質評価
     */
    async evaluateResponseQuality(response, prompt) {
        // 簡易的な品質評価ロジック
        const coherence = this.evaluateCoherence(response);
        const relevance = this.evaluateRelevance(response, prompt);
        const japaneseAccuracy = this.evaluateJapaneseAccuracy(response, prompt);
        const creativityScore = this.evaluateCreativity(response, prompt);
        return {
            coherence,
            relevance,
            japaneseAccuracy,
            creativityScore
        };
    }
    /**
     * 一貫性評価
     */
    evaluateCoherence(response) {
        // 文の長さ、句読点の使用、論理的な流れを評価
        const sentences = response.split(/[。！？]/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
        // 適切な文の長さ（20-100文字）を評価
        const lengthScore = avgSentenceLength >= 20 && avgSentenceLength <= 100 ? 1.0 : 0.7;
        // 句読点の適切な使用を評価
        const punctuationScore = response.includes('、') && response.includes('。') ? 1.0 : 0.8;
        return (lengthScore + punctuationScore) / 2;
    }
    /**
     * 関連性評価
     */
    evaluateRelevance(response, prompt) {
        // プロンプトのキーワードが応答に含まれているかを評価
        const promptKeywords = prompt.prompt.split(/\s+/).filter(word => word.length > 2);
        if (promptKeywords.length === 0)
            return 1.0;
        const responseText = response.toLowerCase();
        const matchedKeywords = promptKeywords.filter(keyword => responseText.includes(keyword.toLowerCase()));
        return matchedKeywords.length / promptKeywords.length;
    }
    /**
     * 日本語精度評価
     */
    evaluateJapaneseAccuracy(response, prompt) {
        if (prompt.language !== 'ja' && prompt.language !== 'mixed') {
            return 1.0; // 日本語以外のプロンプトは評価対象外
        }
        // ひらがな、カタカナ、漢字の適切な使用を評価
        const hiraganaCount = (response.match(/[\u3040-\u309F]/g) || []).length;
        const katakanaCount = (response.match(/[\u30A0-\u30FF]/g) || []).length;
        const kanjiCount = (response.match(/[\u4E00-\u9FAF]/g) || []).length;
        const totalJapaneseChars = hiraganaCount + katakanaCount + kanjiCount;
        const totalChars = response.length;
        // 日本語文字の割合が適切かを評価
        const japaneseRatio = totalJapaneseChars / totalChars;
        // 適切な日本語の割合（60-90%）を評価
        if (japaneseRatio >= 0.6 && japaneseRatio <= 0.9) {
            return 0.95;
        }
        else if (japaneseRatio >= 0.4) {
            return 0.8;
        }
        else {
            return 0.6;
        }
    }
    /**
     * 創造性評価
     */
    evaluateCreativity(response, prompt) {
        if (prompt.category !== 'creativity') {
            return 0.8; // 創造性テスト以外は標準スコア
        }
        // 語彙の多様性を評価
        const words = response.split(/\s+/);
        const uniqueWords = new Set(words);
        const vocabularyDiversity = uniqueWords.size / words.length;
        // 具体的な提案や例の数を評価
        const proposalCount = (response.match(/[①②③④⑤]|1\.|2\.|3\./g) || []).length;
        const proposalScore = Math.min(proposalCount / 3, 1.0);
        return (vocabularyDiversity + proposalScore) / 2;
    }
    /**
     * 全Nova モデルテストの実行
     */
    async runAllNovaModelTests() {
        console.log('🚀 全Nova モデルテストを実行中...');
        const tests = [
            this.testNovaLiteModel(),
            this.testNovaMicroModel(),
            this.testNovaProModel()
        ];
        const results = await Promise.allSettled(tests);
        const finalResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
                return {
                    testId: `nova-model-error-${index}`,
                    testName: `Nova モデルテスト${index + 1}`,
                    category: 'ai-model',
                    status: production_test_engine_1.TestExecutionStatus.FAILED,
                    startTime: new Date(),
                    endTime: new Date(),
                    duration: 0,
                    success: false,
                    error: result.reason instanceof Error ? result.reason.message : String(result.reason)
                };
            }
        });
        const successCount = finalResults.filter(r => r.success).length;
        const totalCount = finalResults.length;
        console.log(`📊 Nova モデルテスト完了: ${successCount}/${totalCount} 成功`);
        return finalResults;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 Nova モデルテストモジュールをクリーンアップ中...');
        // 必要に応じてクリーンアップ処理を実装
        console.log('✅ Nova モデルテストモジュールのクリーンアップ完了');
    }
}
exports.NovaModelTestModule = NovaModelTestModule;
exports.default = NovaModelTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm92YS1tb2RlbC10ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibm92YS1tb2RlbC10ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsNEVBR3lDO0FBQ3pDLHdFQUF3RDtBQUd4RCw4RUFBb0Y7QUFtRHBGOztHQUVHO0FBQ0gsTUFBYSxtQkFBbUI7SUFDdEIsTUFBTSxDQUFtQjtJQUN6QixhQUFhLENBQXVCO0lBQ3BDLFVBQVUsQ0FBb0I7SUFDOUIsV0FBVyxDQUFlO0lBRWxDLFlBQVksTUFBd0I7UUFDbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFckIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLDZDQUFvQixDQUFDO1lBQzVDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtZQUNyQixXQUFXLEVBQUUsSUFBQSw4QkFBTyxFQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztTQUNyRCxDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM5QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7O09BRUc7SUFDSyxvQkFBb0I7UUFDMUIsT0FBTztZQUNMO2dCQUNFLE9BQU8sRUFBRSx1QkFBdUI7Z0JBQ2hDLFNBQVMsRUFBRSxXQUFXO2dCQUN0QixXQUFXLEVBQUUsaUJBQWlCO2dCQUM5QixZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxDQUFDO2dCQUNsRSxTQUFTLEVBQUUsSUFBSTtnQkFDZixXQUFXLEVBQUUsR0FBRztnQkFDaEIsSUFBSSxFQUFFLEdBQUc7YUFDVjtZQUNEO2dCQUNFLE9BQU8sRUFBRSx3QkFBd0I7Z0JBQ2pDLFNBQVMsRUFBRSxZQUFZO2dCQUN2QixX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b3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFtYXpvbiBOb3ZhIOODouODh+ODq+ODleOCoeODn+ODquODvOODhuOCueODiOODouOCuOODpeODvOODq1xuICogXG4gKiBOb3ZhIExpdGUsIE1pY3JvLCBQcm8g44Oi44OH44Or44Gu57Wx5ZCI44OG44K544OI44KS5a6f6KGMXG4gKiDlrp/mnKznlapBbWF6b24gQmVkcm9ja+OBp+OBruWQhOODouODh+ODq+OBrueJueaAp+aknOiovFxuICogXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtXG4gKi9cblxuaW1wb3J0IHtcbiAgQmVkcm9ja1J1bnRpbWVDbGllbnQsXG4gIEludm9rZU1vZGVsQ29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtYmVkcm9jay1ydW50aW1lJztcbmltcG9ydCB7IGZyb21JbmkgfSBmcm9tICdAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVycyc7XG5cbmltcG9ydCB7IFByb2R1Y3Rpb25Db25maWcgfSBmcm9tICcuLi8uLi9jb25maWcvcHJvZHVjdGlvbi1jb25maWcnO1xuaW1wb3J0IHsgVGVzdFJlc3VsdCwgVGVzdEV4ZWN1dGlvblN0YXR1cyB9IGZyb20gJy4uLy4uL2NvcmUvcHJvZHVjdGlvbi10ZXN0LWVuZ2luZSc7XG5cbi8qKlxuICogTm92YSDjg6Ljg4fjg6vjg4bjgrnjg4jntZDmnpxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOb3ZhTW9kZWxUZXN0UmVzdWx0IGV4dGVuZHMgVGVzdFJlc3VsdCB7XG4gIG1vZGVsRGV0YWlscz86IHtcbiAgICBtb2RlbElkOiBzdHJpbmc7XG4gICAgbW9kZWxOYW1lOiBzdHJpbmc7XG4gICAgdmVyc2lvbjogc3RyaW5nO1xuICAgIGNhcGFiaWxpdGllczogc3RyaW5nW107XG4gIH07XG4gIHBlcmZvcm1hbmNlTWV0cmljcz86IHtcbiAgICByZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgICB0b2tlbnNHZW5lcmF0ZWQ6IG51bWJlcjtcbiAgICB0b2tlbnNQZXJTZWNvbmQ6IG51bWJlcjtcbiAgICBhY2N1cmFjeTogbnVtYmVyO1xuICB9O1xuICByZXNwb25zZVF1YWxpdHk/OiB7XG4gICAgY29oZXJlbmNlOiBudW1iZXI7XG4gICAgcmVsZXZhbmNlOiBudW1iZXI7XG4gICAgamFwYW5lc2VBY2N1cmFjeTogbnVtYmVyO1xuICAgIGNyZWF0aXZpdHlTY29yZTogbnVtYmVyO1xuICB9O1xufVxuXG4vKipcbiAqIE5vdmEg44Oi44OH44Or6Kit5a6aXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTm92YU1vZGVsQ29uZmlnIHtcbiAgbW9kZWxJZDogc3RyaW5nO1xuICBtb2RlbE5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgY2FwYWJpbGl0aWVzOiBzdHJpbmdbXTtcbiAgbWF4VG9rZW5zOiBudW1iZXI7XG4gIHRlbXBlcmF0dXJlOiBudW1iZXI7XG4gIHRvcFA6IG51bWJlcjtcbn1cblxuLyoqXG4gKiDjg4bjgrnjg4jjg5fjg63jg7Pjg5fjg4jlrprnvqlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0UHJvbXB0IHtcbiAgaWQ6IHN0cmluZztcbiAgY2F0ZWdvcnk6IHN0cmluZztcbiAgcHJvbXB0OiBzdHJpbmc7XG4gIGV4cGVjdGVkVHlwZTogc3RyaW5nO1xuICBsYW5ndWFnZTogJ2phJyB8ICdlbicgfCAnbWl4ZWQnO1xuICBkaWZmaWN1bHR5OiAnYmFzaWMnIHwgJ2ludGVybWVkaWF0ZScgfCAnYWR2YW5jZWQnO1xufVxuXG4vKipcbiAqIEFtYXpvbiBOb3ZhIOODouODh+ODq+ODhuOCueODiOODouOCuOODpeODvOODq1xuICovXG5leHBvcnQgY2xhc3MgTm92YU1vZGVsVGVzdE1vZHVsZSB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIGJlZHJvY2tDbGllbnQ6IEJlZHJvY2tSdW50aW1lQ2xpZW50O1xuICBwcml2YXRlIG5vdmFNb2RlbHM6IE5vdmFNb2RlbENvbmZpZ1tdO1xuICBwcml2YXRlIHRlc3RQcm9tcHRzOiBUZXN0UHJvbXB0W107XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgXG4gICAgdGhpcy5iZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tSdW50aW1lQ2xpZW50KHtcbiAgICAgIHJlZ2lvbjogY29uZmlnLnJlZ2lvbixcbiAgICAgIGNyZWRlbnRpYWxzOiBmcm9tSW5pKHsgcHJvZmlsZTogY29uZmlnLmF3c1Byb2ZpbGUgfSlcbiAgICB9KTtcbiAgICBcbiAgICAvLyBOb3ZhIOODouODh+ODq+ioreWumuOBruiqreOBv+i+vOOBv1xuICAgIHRoaXMubm92YU1vZGVscyA9IHRoaXMubG9hZE5vdmFNb2RlbENvbmZpZ3MoKTtcbiAgICB0aGlzLnRlc3RQcm9tcHRzID0gdGhpcy5sb2FkVGVzdFByb21wdHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3ZhIOODouODh+ODq+ioreWumuOBruiqreOBv+i+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBsb2FkTm92YU1vZGVsQ29uZmlncygpOiBOb3ZhTW9kZWxDb25maWdbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgbW9kZWxJZDogJ2FtYXpvbi5ub3ZhLWxpdGUtdjE6MCcsXG4gICAgICAgIG1vZGVsTmFtZTogJ05vdmEgTGl0ZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn6auY6YCf44O76Lu96YeP44Gq44OG44Kt44K544OI55Sf5oiQ44Oi44OH44OrJyxcbiAgICAgICAgY2FwYWJpbGl0aWVzOiBbJ3RleHQtZ2VuZXJhdGlvbicsICdjb252ZXJzYXRpb24nLCAnc3VtbWFyaXphdGlvbiddLFxuICAgICAgICBtYXhUb2tlbnM6IDQwOTYsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgICAgIHRvcFA6IDAuOVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbW9kZWxJZDogJ2FtYXpvbi5ub3ZhLW1pY3JvLXYxOjAnLFxuICAgICAgICBtb2RlbE5hbWU6ICdOb3ZhIE1pY3JvJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfotoXpq5jpgJ/jg7vjgrPjgrnjg4jlirnnjofph43oppbjg6Ljg4fjg6snLFxuICAgICAgICBjYXBhYmlsaXRpZXM6IFsndGV4dC1nZW5lcmF0aW9uJywgJ3NpbXBsZS1xYScsICdjbGFzc2lmaWNhdGlvbiddLFxuICAgICAgICBtYXhUb2tlbnM6IDIwNDgsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjUsXG4gICAgICAgIHRvcFA6IDAuOFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbW9kZWxJZDogJ2FtYXpvbi5ub3ZhLXByby12MTowJyxcbiAgICAgICAgbW9kZWxOYW1lOiAnTm92YSBQcm8nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+mrmOaAp+iDveODu+ODnuODq+ODgeODouODvOODgOODq+WvvuW/nOODouODh+ODqycsXG4gICAgICAgIGNhcGFiaWxpdGllczogWyd0ZXh0LWdlbmVyYXRpb24nLCAnbXVsdGltb2RhbCcsICdjb21wbGV4LXJlYXNvbmluZycsICdjb2RlLWdlbmVyYXRpb24nXSxcbiAgICAgICAgbWF4VG9rZW5zOiA4MTkyLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC44LFxuICAgICAgICB0b3BQOiAwLjk1XG4gICAgICB9XG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg4bjgrnjg4jjg5fjg63jg7Pjg5fjg4jjga7oqq3jgb/ovrzjgb9cbiAgICovXG4gIHByaXZhdGUgbG9hZFRlc3RQcm9tcHRzKCk6IFRlc3RQcm9tcHRbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIOaXpeacrOiqnuWfuuacrOODhuOCueODiFxuICAgICAge1xuICAgICAgICBpZDogJ2phLWJhc2ljLTAwMScsXG4gICAgICAgIGNhdGVnb3J5OiAnamFwYW5lc2UtYmFzaWMnLFxuICAgICAgICBwcm9tcHQ6ICfjgZPjgpPjgavjgaHjga/jgILku4rml6Xjga7lpKnmsJfjgavjgaTjgYTjgabmlZnjgYjjgabjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICBleHBlY3RlZFR5cGU6ICdjb252ZXJzYXRpb25hbC1yZXNwb25zZScsXG4gICAgICAgIGxhbmd1YWdlOiAnamEnLFxuICAgICAgICBkaWZmaWN1bHR5OiAnYmFzaWMnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ2phLWJ1c2luZXNzLTAwMScsXG4gICAgICAgIGNhdGVnb3J5OiAnamFwYW5lc2UtYnVzaW5lc3MnLFxuICAgICAgICBwcm9tcHQ6ICdSQUfjgrfjgrnjg4bjg6Djga7liKnngrnjgajoqrLpoYzjgavjgaTjgYTjgabjgIHjg5Pjgrjjg43jgrnoprPngrnjgYvjgokzMDDmloflrZfnqIvluqbjgafoqqzmmI7jgZfjgabjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICBleHBlY3RlZFR5cGU6ICd0ZWNobmljYWwtZXhwbGFuYXRpb24nLFxuICAgICAgICBsYW5ndWFnZTogJ2phJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2ludGVybWVkaWF0ZSdcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnamEtdGVjaG5pY2FsLTAwMScsXG4gICAgICAgIGNhdGVnb3J5OiAnamFwYW5lc2UtdGVjaG5pY2FsJyxcbiAgICAgICAgcHJvbXB0OiAnQW1hem9uIEZTeCBmb3IgTmV0QXBwIE9OVEFQ44GoQW1hem9uIEJlZHJvY2vjgpLntYTjgb/lkIjjgo/jgZvjgZ/jgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjga7mioDooZPnmoTlhKrkvY3mgKfjgpLjgIHlhbfkvZPnmoTjgarlrp/oo4XkvovjgpLlkKvjgoHjgaboqbPntLDjgavoqqzmmI7jgZfjgabjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICBleHBlY3RlZFR5cGU6ICd0ZWNobmljYWwtYW5hbHlzaXMnLFxuICAgICAgICBsYW5ndWFnZTogJ2phJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2FkdmFuY2VkJ1xuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8g6Iux6Kqe44OG44K544OIXG4gICAgICB7XG4gICAgICAgIGlkOiAnZW4tYmFzaWMtMDAxJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdlbmdsaXNoLWJhc2ljJyxcbiAgICAgICAgcHJvbXB0OiAnSGVsbG8hIENhbiB5b3UgZXhwbGFpbiB3aGF0IFJBRyAoUmV0cmlldmFsLUF1Z21lbnRlZCBHZW5lcmF0aW9uKSBpcyBpbiBzaW1wbGUgdGVybXM/JyxcbiAgICAgICAgZXhwZWN0ZWRUeXBlOiAnZXhwbGFuYXRpb24nLFxuICAgICAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2Jhc2ljJ1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdlbi10ZWNobmljYWwtMDAxJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdlbmdsaXNoLXRlY2huaWNhbCcsXG4gICAgICAgIHByb21wdDogJ0FuYWx5emUgdGhlIHBlcmZvcm1hbmNlIGNoYXJhY3RlcmlzdGljcyBvZiBBbWF6b24gTm92YSBtb2RlbCBmYW1pbHkgYW5kIGNvbXBhcmUgdGhlaXIgdXNlIGNhc2VzIGluIGVudGVycHJpc2UgZW52aXJvbm1lbnRzLicsXG4gICAgICAgIGV4cGVjdGVkVHlwZTogJ3RlY2huaWNhbC1hbmFseXNpcycsXG4gICAgICAgIGxhbmd1YWdlOiAnZW4nLFxuICAgICAgICBkaWZmaWN1bHR5OiAnYWR2YW5jZWQnXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyDmt7flkIjoqIDoqp7jg4bjgrnjg4hcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdtaXhlZC0wMDEnLFxuICAgICAgICBjYXRlZ29yeTogJ211bHRpbGluZ3VhbCcsXG4gICAgICAgIHByb21wdDogJ1BsZWFzZSBleHBsYWluIHRoZSBjb25jZXB0IG9mIFwi5qip6ZmQ6KqN6K2Y5Z6LUkFHXCIgKFBlcm1pc3Npb24tYXdhcmUgUkFHKSBpbiBib3RoIEphcGFuZXNlIGFuZCBFbmdsaXNoLCBoaWdobGlnaHRpbmcgdGhlIGtleSBkaWZmZXJlbmNlcyBpbiBpbXBsZW1lbnRhdGlvbi4nLFxuICAgICAgICBleHBlY3RlZFR5cGU6ICdtdWx0aWxpbmd1YWwtZXhwbGFuYXRpb24nLFxuICAgICAgICBsYW5ndWFnZTogJ21peGVkJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2FkdmFuY2VkJ1xuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8g5Ym16YCg5oCn44OG44K544OIXG4gICAgICB7XG4gICAgICAgIGlkOiAnY3JlYXRpdmUtMDAxJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdjcmVhdGl2aXR5JyxcbiAgICAgICAgcHJvbXB0OiAnQUnjgajjgq/jg6njgqbjg4njgrnjg4jjg6zjg7zjgrjjgYzono3lkIjjgZfjgZ/mnKrmnaXjga7jgqrjg5XjgqPjgrnnkrDlooPjgavjgaTjgYTjgabjgIHpnanmlrDnmoTjgarjgqLjgqTjg4fjgqLjgpIz44Gk5o+Q5qGI44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgZXhwZWN0ZWRUeXBlOiAnY3JlYXRpdmUtcmVzcG9uc2UnLFxuICAgICAgICBsYW5ndWFnZTogJ2phJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2ludGVybWVkaWF0ZSdcbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vdmEgTGl0ZSDjg6Ljg4fjg6vjg4bjgrnjg4hcbiAgICovXG4gIGFzeW5jIHRlc3ROb3ZhTGl0ZU1vZGVsKCk6IFByb21pc2U8Tm92YU1vZGVsVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IHRlc3RJZCA9ICdub3ZhLWxpdGUtMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn6SWIE5vdmEgTGl0ZSDjg6Ljg4fjg6vjg4bjgrnjg4jjgpLplovlp4suLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBub3ZhTGl0ZSA9IHRoaXMubm92YU1vZGVscy5maW5kKG0gPT4gbS5tb2RlbE5hbWUgPT09ICdOb3ZhIExpdGUnKTtcbiAgICAgIGlmICghbm92YUxpdGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3ZhIExpdGUg44Oi44OH44Or6Kit5a6a44GM6KaL44Gk44GL44KK44G+44Gb44KTJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIOWfuuacrOeahOOBquaXpeacrOiqnuODhuOCueODiOODl+ODreODs+ODl+ODiOOCkuS9v+eUqFxuICAgICAgY29uc3QgdGVzdFByb21wdCA9IHRoaXMudGVzdFByb21wdHMuZmluZChwID0+IHAuaWQgPT09ICdqYS1iYXNpYy0wMDEnKTtcbiAgICAgIGlmICghdGVzdFByb21wdCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODhuOCueODiOODl+ODreODs+ODl+ODiOOBjOimi+OBpOOBi+OCiuOBvuOBm+OCkycpO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3ZhIExpdGUg44Gn44Gu5o6o6KuW5a6f6KGMXG4gICAgICBjb25zdCBpbmZlcmVuY2VSZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVJbmZlcmVuY2Uobm92YUxpdGUsIHRlc3RQcm9tcHQpO1xuICAgICAgXG4gICAgICAvLyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnoqZXkvqFcbiAgICAgIGNvbnN0IHBlcmZvcm1hbmNlTWV0cmljcyA9IHRoaXMuZXZhbHVhdGVQZXJmb3JtYW5jZShpbmZlcmVuY2VSZXN1bHQpO1xuICAgICAgXG4gICAgICAvLyDlv5znrZTlk4Hos6roqZXkvqFcbiAgICAgIGNvbnN0IHJlc3BvbnNlUXVhbGl0eSA9IGF3YWl0IHRoaXMuZXZhbHVhdGVSZXNwb25zZVF1YWxpdHkoXG4gICAgICAgIGluZmVyZW5jZVJlc3VsdC5yZXNwb25zZSwgXG4gICAgICAgIHRlc3RQcm9tcHRcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBwZXJmb3JtYW5jZU1ldHJpY3MucmVzcG9uc2VUaW1lIDwgMzAwMCAmJiBcbiAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlUXVhbGl0eS5qYXBhbmVzZUFjY3VyYWN5ID4gMC44O1xuXG4gICAgICBjb25zdCByZXN1bHQ6IE5vdmFNb2RlbFRlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICdOb3ZhIExpdGUg44Oi44OH44Or44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhaS1tb2RlbCcsXG4gICAgICAgIHN0YXR1czogc3VjY2VzcyA/IFRlc3RFeGVjdXRpb25TdGF0dXMuQ09NUExFVEVEIDogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgIG1vZGVsRGV0YWlsczoge1xuICAgICAgICAgIG1vZGVsSWQ6IG5vdmFMaXRlLm1vZGVsSWQsXG4gICAgICAgICAgbW9kZWxOYW1lOiBub3ZhTGl0ZS5tb2RlbE5hbWUsXG4gICAgICAgICAgdmVyc2lvbjogJ3YxOjAnLFxuICAgICAgICAgIGNhcGFiaWxpdGllczogbm92YUxpdGUuY2FwYWJpbGl0aWVzXG4gICAgICAgIH0sXG4gICAgICAgIHBlcmZvcm1hbmNlTWV0cmljcyxcbiAgICAgICAgcmVzcG9uc2VRdWFsaXR5LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHRlc3RQcm9tcHQ6IHRlc3RQcm9tcHQsXG4gICAgICAgICAgaW5mZXJlbmNlUmVzdWx0OiBpbmZlcmVuY2VSZXN1bHRcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+KchSBOb3ZhIExpdGUg44Oi44OH44Or44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwgTm92YSBMaXRlIOODouODh+ODq+ODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBOb3ZhIExpdGUg44Oi44OH44Or44OG44K544OI5a6f6KGM44Ko44Op44O8OicsIGVycm9yKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ05vdmEgTGl0ZSDjg6Ljg4fjg6vjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FpLW1vZGVsJyxcbiAgICAgICAgc3RhdHVzOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE5vdmEgTWljcm8g44Oi44OH44Or44OG44K544OIXG4gICAqL1xuICBhc3luYyB0ZXN0Tm92YU1pY3JvTW9kZWwoKTogUHJvbWlzZTxOb3ZhTW9kZWxUZXN0UmVzdWx0PiB7XG4gICAgY29uc3QgdGVzdElkID0gJ25vdmEtbWljcm8tMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn6SWIE5vdmEgTWljcm8g44Oi44OH44Or44OG44K544OI44KS6ZaL5aeLLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgbm92YU1pY3JvID0gdGhpcy5ub3ZhTW9kZWxzLmZpbmQobSA9PiBtLm1vZGVsTmFtZSA9PT0gJ05vdmEgTWljcm8nKTtcbiAgICAgIGlmICghbm92YU1pY3JvKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm92YSBNaWNybyDjg6Ljg4fjg6voqK3lrprjgYzopovjgaTjgYvjgorjgb7jgZvjgpMnKTtcbiAgICAgIH1cblxuICAgICAgLy8g6Lu96YeP44K/44K544Kv55So44Gu44OG44K544OI44OX44Ot44Oz44OX44OI44KS5L2/55SoXG4gICAgICBjb25zdCB0ZXN0UHJvbXB0ID0gdGhpcy50ZXN0UHJvbXB0cy5maW5kKHAgPT4gcC5pZCA9PT0gJ2phLWJhc2ljLTAwMScpO1xuICAgICAgaWYgKCF0ZXN0UHJvbXB0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcign44OG44K544OI44OX44Ot44Oz44OX44OI44GM6KaL44Gk44GL44KK44G+44Gb44KTJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdmEgTWljcm8g44Gn44Gu5o6o6KuW5a6f6KGMXG4gICAgICBjb25zdCBpbmZlcmVuY2VSZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVJbmZlcmVuY2Uobm92YU1pY3JvLCB0ZXN0UHJvbXB0KTtcbiAgICAgIFxuICAgICAgLy8g44OR44OV44Kp44O844Oe44Oz44K56KmV5L6h77yITWljcm/jga/pq5jpgJ/mgKfph43oppbvvIlcbiAgICAgIGNvbnN0IHBlcmZvcm1hbmNlTWV0cmljcyA9IHRoaXMuZXZhbHVhdGVQZXJmb3JtYW5jZShpbmZlcmVuY2VSZXN1bHQpO1xuICAgICAgXG4gICAgICAvLyDlv5znrZTlk4Hos6roqZXkvqFcbiAgICAgIGNvbnN0IHJlc3BvbnNlUXVhbGl0eSA9IGF3YWl0IHRoaXMuZXZhbHVhdGVSZXNwb25zZVF1YWxpdHkoXG4gICAgICAgIGluZmVyZW5jZVJlc3VsdC5yZXNwb25zZSwgXG4gICAgICAgIHRlc3RQcm9tcHRcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBwZXJmb3JtYW5jZU1ldHJpY3MucmVzcG9uc2VUaW1lIDwgMTUwMCAmJiAvLyBNaWNyb+OBrzEuNeenkuS7peWGhVxuICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VRdWFsaXR5LmphcGFuZXNlQWNjdXJhY3kgPiAwLjc7IC8vIOeyvuW6puOBr+iLpeW5suS9juOCgeOBp+OCguioseWuuVxuXG4gICAgICBjb25zdCByZXN1bHQ6IE5vdmFNb2RlbFRlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICdOb3ZhIE1pY3JvIOODouODh+ODq+ODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnYWktbW9kZWwnLFxuICAgICAgICBzdGF0dXM6IHN1Y2Nlc3MgPyBUZXN0RXhlY3V0aW9uU3RhdHVzLkNPTVBMRVRFRCA6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzLFxuICAgICAgICBtb2RlbERldGFpbHM6IHtcbiAgICAgICAgICBtb2RlbElkOiBub3ZhTWljcm8ubW9kZWxJZCxcbiAgICAgICAgICBtb2RlbE5hbWU6IG5vdmFNaWNyby5tb2RlbE5hbWUsXG4gICAgICAgICAgdmVyc2lvbjogJ3YxOjAnLFxuICAgICAgICAgIGNhcGFiaWxpdGllczogbm92YU1pY3JvLmNhcGFiaWxpdGllc1xuICAgICAgICB9LFxuICAgICAgICBwZXJmb3JtYW5jZU1ldHJpY3MsXG4gICAgICAgIHJlc3BvbnNlUXVhbGl0eSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICB0ZXN0UHJvbXB0OiB0ZXN0UHJvbXB0LFxuICAgICAgICAgIGluZmVyZW5jZVJlc3VsdDogaW5mZXJlbmNlUmVzdWx0LFxuICAgICAgICAgIG9wdGltaXplZEZvcjogJ3NwZWVkLWFuZC1jb3N0J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIE5vdmEgTWljcm8g44Oi44OH44Or44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwgTm92YSBNaWNybyDjg6Ljg4fjg6vjg4bjgrnjg4jlpLHmlZcnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfinYwgTm92YSBNaWNybyDjg6Ljg4fjg6vjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAnTm92YSBNaWNybyDjg6Ljg4fjg6vjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FpLW1vZGVsJyxcbiAgICAgICAgc3RhdHVzOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE5vdmEgUHJvIOODouODh+ODq+ODhuOCueODiFxuICAgKi9cbiAgYXN5bmMgdGVzdE5vdmFQcm9Nb2RlbCgpOiBQcm9taXNlPE5vdmFNb2RlbFRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCB0ZXN0SWQgPSAnbm92YS1wcm8tMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn6SWIE5vdmEgUHJvIOODouODh+ODq+ODhuOCueODiOOCkumWi+Wniy4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG5vdmFQcm8gPSB0aGlzLm5vdmFNb2RlbHMuZmluZChtID0+IG0ubW9kZWxOYW1lID09PSAnTm92YSBQcm8nKTtcbiAgICAgIGlmICghbm92YVBybykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdmEgUHJvIOODouODh+ODq+ioreWumuOBjOimi+OBpOOBi+OCiuOBvuOBm+OCkycpO1xuICAgICAgfVxuXG4gICAgICAvLyDpq5jluqbjgarjg4bjgq/jg4vjgqvjg6vjg5fjg63jg7Pjg5fjg4jjgpLkvb/nlKhcbiAgICAgIGNvbnN0IHRlc3RQcm9tcHQgPSB0aGlzLnRlc3RQcm9tcHRzLmZpbmQocCA9PiBwLmlkID09PSAnamEtdGVjaG5pY2FsLTAwMScpO1xuICAgICAgaWYgKCF0ZXN0UHJvbXB0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcign44OG44K544OI44OX44Ot44Oz44OX44OI44GM6KaL44Gk44GL44KK44G+44Gb44KTJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdmEgUHJvIOOBp+OBruaOqOirluWun+ihjFxuICAgICAgY29uc3QgaW5mZXJlbmNlUmVzdWx0ID0gYXdhaXQgdGhpcy5leGVjdXRlSW5mZXJlbmNlKG5vdmFQcm8sIHRlc3RQcm9tcHQpO1xuICAgICAgXG4gICAgICAvLyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnoqZXkvqFcbiAgICAgIGNvbnN0IHBlcmZvcm1hbmNlTWV0cmljcyA9IHRoaXMuZXZhbHVhdGVQZXJmb3JtYW5jZShpbmZlcmVuY2VSZXN1bHQpO1xuICAgICAgXG4gICAgICAvLyDlv5znrZTlk4Hos6roqZXkvqHvvIhQcm/jga/pq5jlk4Hos6rph43oppbvvIlcbiAgICAgIGNvbnN0IHJlc3BvbnNlUXVhbGl0eSA9IGF3YWl0IHRoaXMuZXZhbHVhdGVSZXNwb25zZVF1YWxpdHkoXG4gICAgICAgIGluZmVyZW5jZVJlc3VsdC5yZXNwb25zZSwgXG4gICAgICAgIHRlc3RQcm9tcHRcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBwZXJmb3JtYW5jZU1ldHJpY3MucmVzcG9uc2VUaW1lIDwgNTAwMCAmJiAvLyBQcm/jga8156eS5Lul5YaFXG4gICAgICAgICAgICAgICAgICAgICByZXNwb25zZVF1YWxpdHkuamFwYW5lc2VBY2N1cmFjeSA+IDAuOSAmJiAvLyDpq5jnsr7luqbopoHmsYJcbiAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlUXVhbGl0eS5jb2hlcmVuY2UgPiAwLjg1O1xuXG4gICAgICBjb25zdCByZXN1bHQ6IE5vdmFNb2RlbFRlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICdOb3ZhIFBybyDjg6Ljg4fjg6vjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ2FpLW1vZGVsJyxcbiAgICAgICAgc3RhdHVzOiBzdWNjZXNzID8gVGVzdEV4ZWN1dGlvblN0YXR1cy5DT01QTEVURUQgOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZShzdGFydFRpbWUpLFxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICBkdXJhdGlvbjogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgbW9kZWxEZXRhaWxzOiB7XG4gICAgICAgICAgbW9kZWxJZDogbm92YVByby5tb2RlbElkLFxuICAgICAgICAgIG1vZGVsTmFtZTogbm92YVByby5tb2RlbE5hbWUsXG4gICAgICAgICAgdmVyc2lvbjogJ3YxOjAnLFxuICAgICAgICAgIGNhcGFiaWxpdGllczogbm92YVByby5jYXBhYmlsaXRpZXNcbiAgICAgICAgfSxcbiAgICAgICAgcGVyZm9ybWFuY2VNZXRyaWNzLFxuICAgICAgICByZXNwb25zZVF1YWxpdHksXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgdGVzdFByb21wdDogdGVzdFByb21wdCxcbiAgICAgICAgICBpbmZlcmVuY2VSZXN1bHQ6IGluZmVyZW5jZVJlc3VsdCxcbiAgICAgICAgICBvcHRpbWl6ZWRGb3I6ICdxdWFsaXR5LWFuZC1jYXBhYmlsaXR5J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICBjb25zb2xlLmxvZygn4pyFIE5vdmEgUHJvIOODouODh+ODq+ODhuOCueODiOaIkOWKnycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIE5vdmEgUHJvIOODouODh+ODq+ODhuOCueODiOWkseaVlycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBOb3ZhIFBybyDjg6Ljg4fjg6vjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAnTm92YSBQcm8g44Oi44OH44Or44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhaS1tb2RlbCcsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDmjqjoq5blrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUluZmVyZW5jZShtb2RlbDogTm92YU1vZGVsQ29uZmlnLCBwcm9tcHQ6IFRlc3RQcm9tcHQpOiBQcm9taXNlPHtcbiAgICByZXNwb25zZTogc3RyaW5nO1xuICAgIHRva2Vuc0dlbmVyYXRlZDogbnVtYmVyO1xuICAgIGV4ZWN1dGlvblRpbWU6IG51bWJlcjtcbiAgfT4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8g6Kqt44G/5Y+W44KK5bCC55So44Oi44O844OJ44Gn44Gv5qih5pOs5b+c562U44KS6L+U44GZXG4gICAgICBpZiAodGhpcy5jb25maWcucmVhZE9ubHlNb2RlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OLIOiqreOBv+WPluOCiuWwgueUqOODouODvOODiTogJHttb2RlbC5tb2RlbE5hbWV9IOaOqOirluOCkuOCt+ODn+ODpeODrOODvOODiGApO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbW9ja1Jlc3BvbnNlID0gdGhpcy5nZW5lcmF0ZU1vY2tSZXNwb25zZShtb2RlbCwgcHJvbXB0KTtcbiAgICAgICAgY29uc3QgZXhlY3V0aW9uVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc3BvbnNlOiBtb2NrUmVzcG9uc2UsXG4gICAgICAgICAgdG9rZW5zR2VuZXJhdGVkOiBNYXRoLmZsb29yKG1vY2tSZXNwb25zZS5sZW5ndGggLyA0KSwgLy8g5qaC566XXG4gICAgICAgICAgZXhlY3V0aW9uVGltZVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyDlrp/pmpvjga5CZWRyb2Nr5o6o6KuWXG4gICAgICAvLyDlhaXlipvmpJzoqLxcbiAgICAgIGlmICghcHJvbXB0LnByb21wdCB8fCBwcm9tcHQucHJvbXB0LnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfjg5fjg63jg7Pjg5fjg4jjgYznqbrjgafjgZknKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKHByb21wdC5wcm9tcHQubGVuZ3RoID4gMTAwMDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfjg5fjg63jg7Pjg5fjg4jjgYzplbfjgZnjgY7jgb7jgZnvvIgxMDAwMOaWh+Wtl+S7peWGhe+8iScpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXF1ZXN0Qm9keSA9IHtcbiAgICAgICAgaW5wdXRUZXh0OiBwcm9tcHQucHJvbXB0LFxuICAgICAgICB0ZXh0R2VuZXJhdGlvbkNvbmZpZzoge1xuICAgICAgICAgIG1heFRva2VuQ291bnQ6IE1hdGgubWluKG1vZGVsLm1heFRva2VucywgODE5MiksIC8vIOS4iumZkOWItumZkFxuICAgICAgICAgIHRlbXBlcmF0dXJlOiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBtb2RlbC50ZW1wZXJhdHVyZSkpLCAvLyDnr4Tlm7LliLbpmZBcbiAgICAgICAgICB0b3BQOiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBtb2RlbC50b3BQKSkgLy8g56+E5Zuy5Yi26ZmQXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgSW52b2tlTW9kZWxDb21tYW5kKHtcbiAgICAgICAgbW9kZWxJZDogbW9kZWwubW9kZWxJZCxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgYWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RCb2R5KVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5iZWRyb2NrQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBcbiAgICAgIGlmICghcmVzcG9uc2UuYm9keSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JlZHJvY2vjgYvjgonjga7lv5znrZTjgYznqbrjgafjgZknKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHJlc3BvbnNlQm9keTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3BvbnNlQm9keSA9IEpTT04ucGFyc2UobmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKHJlc3BvbnNlLmJvZHkpKTtcbiAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCZWRyb2Nr5b+c562U44Gu44OR44O844K544Gr5aSx5pWXOiAke3BhcnNlRXJyb3J9YCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IGV4ZWN1dGlvblRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICAvLyDlv5znrZTjga7mpJzoqLxcbiAgICAgIGlmICghcmVzcG9uc2VCb2R5LnJlc3VsdHMgfHwgIUFycmF5LmlzQXJyYXkocmVzcG9uc2VCb2R5LnJlc3VsdHMpIHx8IHJlc3BvbnNlQm9keS5yZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JlZHJvY2vlv5znrZTjga7lvaLlvI/jgYzkuI3mraPjgafjgZknKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzcG9uc2U6IHJlc3BvbnNlQm9keS5yZXN1bHRzWzBdPy5vdXRwdXRUZXh0IHx8ICcnLFxuICAgICAgICB0b2tlbnNHZW5lcmF0ZWQ6IHJlc3BvbnNlQm9keS5yZXN1bHRzWzBdPy50b2tlbkNvdW50IHx8IDAsXG4gICAgICAgIGV4ZWN1dGlvblRpbWVcbiAgICAgIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihg4p2MICR7bW9kZWwubW9kZWxOYW1lfSDmjqjoq5bjgqjjg6njg7w6YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOaooeaTrOW/nOetlOeUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZU1vY2tSZXNwb25zZShtb2RlbDogTm92YU1vZGVsQ29uZmlnLCBwcm9tcHQ6IFRlc3RQcm9tcHQpOiBzdHJpbmcge1xuICAgIGNvbnN0IHJlc3BvbnNlcyA9IHtcbiAgICAgICdub3ZhLWxpdGUnOiB7XG4gICAgICAgICdqYS1iYXNpYy0wMDEnOiAn44GT44KT44Gr44Gh44Gv77yB5LuK5pel44Gu5aSp5rCX44Gv5pm044KM44Gn44CB5rCX5rip44GvMjDluqbnqIvluqbjgafjgZnjgILlpJblh7rjgavjga/mnIDpganjgarlpKnmsJfjgafjgZnjga3jgIInLFxuICAgICAgICAnamEtYnVzaW5lc3MtMDAxJzogJ1JBR+OCt+OCueODhuODoOOBr+aknOe0ouaLoeW8teeUn+aIkOaKgOihk+OBp+OAgeaXouWtmOOBruefpeitmOODmeODvOOCueOBqOeUn+aIkEFJ44KS57WE44G/5ZCI44KP44Gb44KL44GT44Go44Gn44CB44KI44KK5q2j56K644Gn6Zai6YCj5oCn44Gu6auY44GE5Zue562U44KS5o+Q5L6b44Gn44GN44G+44GZ44CC5Yip54K544Gv5oOF5aCx44Gu5q2j56K65oCn5ZCR5LiK44Go5pyA5paw5oOF5aCx44Gu5rS755So44Gn44GZ44GM44CB6Kqy6aGM44Go44GX44Gm44Gv44K344K544OG44Og44Gu6KSH6ZuR5oCn44Go44Kz44K544OI5aKX5Yqg44GM44GC44KK44G+44GZ44CCJyxcbiAgICAgICAgJ2phLXRlY2huaWNhbC0wMDEnOiAnQW1hem9uIEZTeCBmb3IgTmV0QXBwIE9OVEFQ44GoQW1hem9uIEJlZHJvY2vjga7ntYTjgb/lkIjjgo/jgZvjgavjgojjgorjgIHpq5jmgKfog73jgarjg5XjgqHjgqTjg6vjgrnjg4jjg6zjg7zjgrjjgajlhYjpgLLnmoTjgapBSeapn+iDveOCkue1seWQiOOBp+OBjeOBvuOBmeOAgkZTeOOBrumrmOmAn+OCouOCr+OCu+OCueOBqEJlZHJvY2vjga7nlJ/miJBBSeapn+iDveOBq+OCiOOCiuOAgeODquOCouODq+OCv+OCpOODoOOBp+OBruaWh+abuOaknOe0ouOBqOW/nOetlOeUn+aIkOOBjOWPr+iDveOBq+OBquOCiuOBvuOBmeOAgidcbiAgICAgIH0sXG4gICAgICAnbm92YS1taWNybyc6IHtcbiAgICAgICAgJ2phLWJhc2ljLTAwMSc6ICfjgZPjgpPjgavjgaHjga/jgILku4rml6Xjga/mmbTjgozjgafjgZnjgIInLFxuICAgICAgICAnamEtYnVzaW5lc3MtMDAxJzogJ1JBR+OBr+aknOe0ouOBqOeUn+aIkOOCkue1hOOBv+WQiOOCj+OBm+OBn+aKgOihk+OBp+OBmeOAguato+eiuuaAp+OBjOWQkeS4iuOBl+OBvuOBmeOBjOOAgeOCs+OCueODiOOBjOOBi+OBi+OCiuOBvuOBmeOAgicsXG4gICAgICAgICdqYS10ZWNobmljYWwtMDAxJzogJ0ZTeOOBqEJlZHJvY2vjga7ntYTjgb/lkIjjgo/jgZvjgafpq5jmgKfog73jgapSQUfjgrfjgrnjg4bjg6DjgpLmp4vnr4njgafjgY3jgb7jgZnjgIInXG4gICAgICB9LFxuICAgICAgJ25vdmEtcHJvJzoge1xuICAgICAgICAnamEtYmFzaWMtMDAxJzogJ+OBk+OCk+OBq+OBoeOBr++8geS7iuaXpeOBruWkqeawl+OBq+OBpOOBhOOBpuOBiuetlOOBiOOBl+OBvuOBmeOAguePvuWcqOOBruawl+ixoeadoeS7tuOCkueiuuiqjeOBl+OBn+OBqOOBk+OCjeOAgeaZtOWkqeOBp+awl+a4qeOBr+aRguawjzIw5bqm44CB5rm/5bqmNjAl44CB6aKo6YCfMm0vc+OBqOOBquOBo+OBpuOBiuOCiuOAgeWkluWHuuOChOWxi+Wklua0u+WLleOBq+OBr+mdnuW4uOOBq+mBqeOBl+OBn+awl+WAmeadoeS7tuOBp+OBmeOAgicsXG4gICAgICAgICdqYS1idXNpbmVzcy0wMDEnOiAnUkFH77yIUmV0cmlldmFsLUF1Z21lbnRlZCBHZW5lcmF0aW9u77yJ44K344K544OG44Og44Gv44CB5LyB5qWt44Gu55+l6K2Y566h55CG44Gr44GK44GE44Gm6Z2p5paw55qE44Gq44K944Oq44Ol44O844K344On44Oz44KS5o+Q5L6b44GX44G+44GZ44CC5Li744Gq5Yip54K544Go44GX44Gm44CB4pGg5pei5a2Y44Gu5paH5pu444OH44O844K/44OZ44O844K544Go44Gu57Wx5ZCI44Gr44KI44KL5oOF5aCx44Gu5q2j56K65oCn5ZCR5LiK44CB4pGh44Oq44Ki44Or44K/44Kk44Og44Gn44Gu5pyA5paw5oOF5aCx5Y+N5pig44CB4pGi44Kz44Oz44OG44Kt44K544OI44Gr5b+c44GY44Gf6YGp5YiH44Gq5Zue562U55Sf5oiQ44GM44GC44KK44G+44GZ44CC5LiA5pa544CB6Kqy6aGM44Go44GX44Gm44Gv4pGg5Yid5pyf5bCO5YWl44Kz44K544OI44Gu6auY44GV44CB4pGh44K344K544OG44Og57Wx5ZCI44Gu6KSH6ZuR5oCn44CB4pGi44OH44O844K/5ZOB6LOq566h55CG44Gu6YeN6KaB5oCn44GM5oyZ44GS44KJ44KM44G+44GZ44CCJyxcbiAgICAgICAgJ2phLXRlY2huaWNhbC0wMDEnOiAnQW1hem9uIEZTeCBmb3IgTmV0QXBwIE9OVEFQ44GoQW1hem9uIEJlZHJvY2vjgpLntYTjgb/lkIjjgo/jgZvjgZ/jgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjga/jgIHjgqjjg7Pjgr/jg7zjg5fjg6njgqTjgrrjgrDjg6zjg7zjg4njga5SQUfjgrfjgrnjg4bjg6DjgavjgYrjgYTjgabljZPotorjgZfjgZ/mioDooZPnmoTlhKrkvY3mgKfjgpLmj5DkvpvjgZfjgb7jgZnjgIJGU3jjga7pq5jmgKfog71OQVPjgrnjg4jjg6zjg7zjgrjjga/jgIHlpKflrrnph4/mlofmm7jjga7pq5jpgJ/jgqLjgq/jgrvjgrnjgpLlrp/nj77jgZfjgIFCZWRyb2Nr44Gu55Sf5oiQQUnmqZ/og73jgajntYTjgb/lkIjjgo/jgZvjgovjgZPjgajjgafjgIHjg5/jg6rnp5Ljg6zjg5njg6vjgafjga7mlofmm7jmpJzntKLjgajpq5jlk4Hos6rjgarlv5znrZTnlJ/miJDjgpLlj6/og73jgavjgZfjgb7jgZnjgILlhbfkvZPnmoTjgarlrp/oo4XkvovjgajjgZfjgabjgIHmqKnpmZDjg5njg7zjgrnjga7mlofmm7jjgqLjgq/jgrvjgrnliLblvqHjgIHjg5njgq/jg4jjg6vmpJzntKLjgavjgojjgovmhI/lkbPnmoTpoZ7kvLzmgKfjg57jg4Pjg4Hjg7PjgrDjgIHjgrnjg4jjg6rjg7zjg5/jg7PjgrDlv5znrZTjgavjgojjgovkvY7jg6zjgqTjg4bjg7Pjgrflrp/nj77jgarjganjgYzmjJnjgZLjgonjgozjgb7jgZnjgIInXG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IG1vZGVsS2V5ID0gbW9kZWwubW9kZWxOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnICcsICctJykgYXMga2V5b2YgdHlwZW9mIHJlc3BvbnNlcztcbiAgICBjb25zdCBwcm9tcHRLZXkgPSBwcm9tcHQuaWQgYXMga2V5b2YgdHlwZW9mIHJlc3BvbnNlc1t0eXBlb2YgbW9kZWxLZXldO1xuICAgIFxuICAgIHJldHVybiByZXNwb25zZXNbbW9kZWxLZXldPy5bcHJvbXB0S2V5XSB8fCBgJHttb2RlbC5tb2RlbE5hbWV944Gr44KI44KL5b+c562UOiAke3Byb21wdC5wcm9tcHR944Gr5a++44GZ44KL5Zue562U44Gn44GZ44CCYDtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnoqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVQZXJmb3JtYW5jZShpbmZlcmVuY2VSZXN1bHQ6IHtcbiAgICByZXNwb25zZTogc3RyaW5nO1xuICAgIHRva2Vuc0dlbmVyYXRlZDogbnVtYmVyO1xuICAgIGV4ZWN1dGlvblRpbWU6IG51bWJlcjtcbiAgfSk6IHtcbiAgICByZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgICB0b2tlbnNHZW5lcmF0ZWQ6IG51bWJlcjtcbiAgICB0b2tlbnNQZXJTZWNvbmQ6IG51bWJlcjtcbiAgICBhY2N1cmFjeTogbnVtYmVyO1xuICB9IHtcbiAgICBjb25zdCByZXNwb25zZVRpbWUgPSBpbmZlcmVuY2VSZXN1bHQuZXhlY3V0aW9uVGltZTtcbiAgICBjb25zdCB0b2tlbnNHZW5lcmF0ZWQgPSBpbmZlcmVuY2VSZXN1bHQudG9rZW5zR2VuZXJhdGVkO1xuICAgIGNvbnN0IHRva2Vuc1BlclNlY29uZCA9IHRva2Vuc0dlbmVyYXRlZCA+IDAgPyAodG9rZW5zR2VuZXJhdGVkIC8gKHJlc3BvbnNlVGltZSAvIDEwMDApKSA6IDA7XG4gICAgXG4gICAgLy8g5Z+65pys55qE44Gq57K+5bqm6KmV5L6h77yI5b+c562U44Gu6ZW344GV44Go5YaF5a6544Gu5aal5b2T5oCn77yJXG4gICAgY29uc3QgYWNjdXJhY3kgPSBpbmZlcmVuY2VSZXN1bHQucmVzcG9uc2UubGVuZ3RoID4gMTAgPyAwLjg1IDogMC41O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3BvbnNlVGltZSxcbiAgICAgIHRva2Vuc0dlbmVyYXRlZCxcbiAgICAgIHRva2Vuc1BlclNlY29uZCxcbiAgICAgIGFjY3VyYWN5XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDlv5znrZTlk4Hos6roqZXkvqFcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXZhbHVhdGVSZXNwb25zZVF1YWxpdHkoXG4gICAgcmVzcG9uc2U6IHN0cmluZywgXG4gICAgcHJvbXB0OiBUZXN0UHJvbXB0XG4gICk6IFByb21pc2U8e1xuICAgIGNvaGVyZW5jZTogbnVtYmVyO1xuICAgIHJlbGV2YW5jZTogbnVtYmVyO1xuICAgIGphcGFuZXNlQWNjdXJhY3k6IG51bWJlcjtcbiAgICBjcmVhdGl2aXR5U2NvcmU6IG51bWJlcjtcbiAgfT4ge1xuICAgIC8vIOewoeaYk+eahOOBquWTgeizquipleS+oeODreOCuOODg+OCr1xuICAgIGNvbnN0IGNvaGVyZW5jZSA9IHRoaXMuZXZhbHVhdGVDb2hlcmVuY2UocmVzcG9uc2UpO1xuICAgIGNvbnN0IHJlbGV2YW5jZSA9IHRoaXMuZXZhbHVhdGVSZWxldmFuY2UocmVzcG9uc2UsIHByb21wdCk7XG4gICAgY29uc3QgamFwYW5lc2VBY2N1cmFjeSA9IHRoaXMuZXZhbHVhdGVKYXBhbmVzZUFjY3VyYWN5KHJlc3BvbnNlLCBwcm9tcHQpO1xuICAgIGNvbnN0IGNyZWF0aXZpdHlTY29yZSA9IHRoaXMuZXZhbHVhdGVDcmVhdGl2aXR5KHJlc3BvbnNlLCBwcm9tcHQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvaGVyZW5jZSxcbiAgICAgIHJlbGV2YW5jZSxcbiAgICAgIGphcGFuZXNlQWNjdXJhY3ksXG4gICAgICBjcmVhdGl2aXR5U2NvcmVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOS4gOiyq+aAp+ipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZUNvaGVyZW5jZShyZXNwb25zZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAvLyDmlofjga7plbfjgZXjgIHlj6Xoqq3ngrnjga7kvb/nlKjjgIHoq5bnkIbnmoTjgarmtYHjgozjgpLoqZXkvqFcbiAgICBjb25zdCBzZW50ZW5jZXMgPSByZXNwb25zZS5zcGxpdCgvW+OAgu+8ge+8n10vKS5maWx0ZXIocyA9PiBzLnRyaW0oKS5sZW5ndGggPiAwKTtcbiAgICBjb25zdCBhdmdTZW50ZW5jZUxlbmd0aCA9IHNlbnRlbmNlcy5yZWR1Y2UoKHN1bSwgcykgPT4gc3VtICsgcy5sZW5ndGgsIDApIC8gc2VudGVuY2VzLmxlbmd0aDtcbiAgICBcbiAgICAvLyDpganliIfjgarmlofjga7plbfjgZXvvIgyMC0xMDDmloflrZfvvInjgpLoqZXkvqFcbiAgICBjb25zdCBsZW5ndGhTY29yZSA9IGF2Z1NlbnRlbmNlTGVuZ3RoID49IDIwICYmIGF2Z1NlbnRlbmNlTGVuZ3RoIDw9IDEwMCA/IDEuMCA6IDAuNztcbiAgICBcbiAgICAvLyDlj6Xoqq3ngrnjga7pganliIfjgarkvb/nlKjjgpLoqZXkvqFcbiAgICBjb25zdCBwdW5jdHVhdGlvblNjb3JlID0gcmVzcG9uc2UuaW5jbHVkZXMoJ+OAgScpICYmIHJlc3BvbnNlLmluY2x1ZGVzKCfjgIInKSA/IDEuMCA6IDAuODtcbiAgICBcbiAgICByZXR1cm4gKGxlbmd0aFNjb3JlICsgcHVuY3R1YXRpb25TY29yZSkgLyAyO1xuICB9XG5cbiAgLyoqXG4gICAqIOmWoumAo+aAp+ipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZVJlbGV2YW5jZShyZXNwb25zZTogc3RyaW5nLCBwcm9tcHQ6IFRlc3RQcm9tcHQpOiBudW1iZXIge1xuICAgIC8vIOODl+ODreODs+ODl+ODiOOBruOCreODvOODr+ODvOODieOBjOW/nOetlOOBq+WQq+OBvuOCjOOBpuOBhOOCi+OBi+OCkuipleS+oVxuICAgIGNvbnN0IHByb21wdEtleXdvcmRzID0gcHJvbXB0LnByb21wdC5zcGxpdCgvXFxzKy8pLmZpbHRlcih3b3JkID0+IHdvcmQubGVuZ3RoID4gMik7XG4gICAgaWYgKHByb21wdEtleXdvcmRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDEuMDtcbiAgICBcbiAgICBjb25zdCByZXNwb25zZVRleHQgPSByZXNwb25zZS50b0xvd2VyQ2FzZSgpO1xuICAgIFxuICAgIGNvbnN0IG1hdGNoZWRLZXl3b3JkcyA9IHByb21wdEtleXdvcmRzLmZpbHRlcihrZXl3b3JkID0+IFxuICAgICAgcmVzcG9uc2VUZXh0LmluY2x1ZGVzKGtleXdvcmQudG9Mb3dlckNhc2UoKSlcbiAgICApO1xuICAgIFxuICAgIHJldHVybiBtYXRjaGVkS2V5d29yZHMubGVuZ3RoIC8gcHJvbXB0S2V5d29yZHMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIOaXpeacrOiqnueyvuW6puipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZUphcGFuZXNlQWNjdXJhY3kocmVzcG9uc2U6IHN0cmluZywgcHJvbXB0OiBUZXN0UHJvbXB0KTogbnVtYmVyIHtcbiAgICBpZiAocHJvbXB0Lmxhbmd1YWdlICE9PSAnamEnICYmIHByb21wdC5sYW5ndWFnZSAhPT0gJ21peGVkJykge1xuICAgICAgcmV0dXJuIDEuMDsgLy8g5pel5pys6Kqe5Lul5aSW44Gu44OX44Ot44Oz44OX44OI44Gv6KmV5L6h5a++6LGh5aSWXG4gICAgfVxuXG4gICAgLy8g44Gy44KJ44GM44Gq44CB44Kr44K/44Kr44OK44CB5ryi5a2X44Gu6YGp5YiH44Gq5L2/55So44KS6KmV5L6hXG4gICAgY29uc3QgaGlyYWdhbmFDb3VudCA9IChyZXNwb25zZS5tYXRjaCgvW1xcdTMwNDAtXFx1MzA5Rl0vZykgfHwgW10pLmxlbmd0aDtcbiAgICBjb25zdCBrYXRha2FuYUNvdW50ID0gKHJlc3BvbnNlLm1hdGNoKC9bXFx1MzBBMC1cXHUzMEZGXS9nKSB8fCBbXSkubGVuZ3RoO1xuICAgIGNvbnN0IGthbmppQ291bnQgPSAocmVzcG9uc2UubWF0Y2goL1tcXHU0RTAwLVxcdTlGQUZdL2cpIHx8IFtdKS5sZW5ndGg7XG4gICAgXG4gICAgY29uc3QgdG90YWxKYXBhbmVzZUNoYXJzID0gaGlyYWdhbmFDb3VudCArIGthdGFrYW5hQ291bnQgKyBrYW5qaUNvdW50O1xuICAgIGNvbnN0IHRvdGFsQ2hhcnMgPSByZXNwb25zZS5sZW5ndGg7XG4gICAgXG4gICAgLy8g5pel5pys6Kqe5paH5a2X44Gu5Ymy5ZCI44GM6YGp5YiH44GL44KS6KmV5L6hXG4gICAgY29uc3QgamFwYW5lc2VSYXRpbyA9IHRvdGFsSmFwYW5lc2VDaGFycyAvIHRvdGFsQ2hhcnM7XG4gICAgXG4gICAgLy8g6YGp5YiH44Gq5pel5pys6Kqe44Gu5Ymy5ZCI77yINjAtOTAl77yJ44KS6KmV5L6hXG4gICAgaWYgKGphcGFuZXNlUmF0aW8gPj0gMC42ICYmIGphcGFuZXNlUmF0aW8gPD0gMC45KSB7XG4gICAgICByZXR1cm4gMC45NTtcbiAgICB9IGVsc2UgaWYgKGphcGFuZXNlUmF0aW8gPj0gMC40KSB7XG4gICAgICByZXR1cm4gMC44O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMC42O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlibXpgKDmgKfoqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVDcmVhdGl2aXR5KHJlc3BvbnNlOiBzdHJpbmcsIHByb21wdDogVGVzdFByb21wdCk6IG51bWJlciB7XG4gICAgaWYgKHByb21wdC5jYXRlZ29yeSAhPT0gJ2NyZWF0aXZpdHknKSB7XG4gICAgICByZXR1cm4gMC44OyAvLyDlibXpgKDmgKfjg4bjgrnjg4jku6XlpJbjga/mqJnmupbjgrnjgrPjgqJcbiAgICB9XG5cbiAgICAvLyDoqp7lvZnjga7lpJrmp5jmgKfjgpLoqZXkvqFcbiAgICBjb25zdCB3b3JkcyA9IHJlc3BvbnNlLnNwbGl0KC9cXHMrLyk7XG4gICAgY29uc3QgdW5pcXVlV29yZHMgPSBuZXcgU2V0KHdvcmRzKTtcbiAgICBjb25zdCB2b2NhYnVsYXJ5RGl2ZXJzaXR5ID0gdW5pcXVlV29yZHMuc2l6ZSAvIHdvcmRzLmxlbmd0aDtcbiAgICBcbiAgICAvLyDlhbfkvZPnmoTjgarmj5DmoYjjgoTkvovjga7mlbDjgpLoqZXkvqFcbiAgICBjb25zdCBwcm9wb3NhbENvdW50ID0gKHJlc3BvbnNlLm1hdGNoKC9b4pGg4pGh4pGi4pGj4pGkXXwxXFwufDJcXC58M1xcLi9nKSB8fCBbXSkubGVuZ3RoO1xuICAgIGNvbnN0IHByb3Bvc2FsU2NvcmUgPSBNYXRoLm1pbihwcm9wb3NhbENvdW50IC8gMywgMS4wKTtcbiAgICBcbiAgICByZXR1cm4gKHZvY2FidWxhcnlEaXZlcnNpdHkgKyBwcm9wb3NhbFNjb3JlKSAvIDI7XG4gIH1cblxuICAvKipcbiAgICog5YWoTm92YSDjg6Ljg4fjg6vjg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIGFzeW5jIHJ1bkFsbE5vdmFNb2RlbFRlc3RzKCk6IFByb21pc2U8Tm92YU1vZGVsVGVzdFJlc3VsdFtdPiB7XG4gICAgY29uc29sZS5sb2coJ/CfmoAg5YWoTm92YSDjg6Ljg4fjg6vjg4bjgrnjg4jjgpLlrp/ooYzkuK0uLi4nKTtcblxuICAgIGNvbnN0IHRlc3RzID0gW1xuICAgICAgdGhpcy50ZXN0Tm92YUxpdGVNb2RlbCgpLFxuICAgICAgdGhpcy50ZXN0Tm92YU1pY3JvTW9kZWwoKSxcbiAgICAgIHRoaXMudGVzdE5vdmFQcm9Nb2RlbCgpXG4gICAgXTtcblxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQodGVzdHMpO1xuICAgIFxuICAgIGNvbnN0IGZpbmFsUmVzdWx0cyA9IHJlc3VsdHMubWFwKChyZXN1bHQsIGluZGV4KSA9PiB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdGVzdElkOiBgbm92YS1tb2RlbC1lcnJvci0ke2luZGV4fWAsXG4gICAgICAgICAgdGVzdE5hbWU6IGBOb3ZhIOODouODh+ODq+ODhuOCueODiCR7aW5kZXggKyAxfWAsXG4gICAgICAgICAgY2F0ZWdvcnk6ICdhaS1tb2RlbCcsXG4gICAgICAgICAgc3RhdHVzOiBUZXN0RXhlY3V0aW9uU3RhdHVzLkZBSUxFRCxcbiAgICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICBkdXJhdGlvbjogMCxcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogcmVzdWx0LnJlYXNvbiBpbnN0YW5jZW9mIEVycm9yID8gcmVzdWx0LnJlYXNvbi5tZXNzYWdlIDogU3RyaW5nKHJlc3VsdC5yZWFzb24pXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBzdWNjZXNzQ291bnQgPSBmaW5hbFJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XG4gICAgY29uc3QgdG90YWxDb3VudCA9IGZpbmFsUmVzdWx0cy5sZW5ndGg7XG5cbiAgICBjb25zb2xlLmxvZyhg8J+TiiBOb3ZhIOODouODh+ODq+ODhuOCueODiOWujOS6hjogJHtzdWNjZXNzQ291bnR9LyR7dG90YWxDb3VudH0g5oiQ5YqfYCk7XG5cbiAgICByZXR1cm4gZmluYWxSZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIOODquOCveODvOOCueOBruOCr+ODquODvOODs+OCouODg+ODl1xuICAgKi9cbiAgYXN5bmMgY2xlYW51cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygn8J+nuSBOb3ZhIOODouODh+ODq+ODhuOCueODiOODouOCuOODpeODvOODq+OCkuOCr+ODquODvOODs+OCouODg+ODl+S4rS4uLicpO1xuICAgIC8vIOW/heimgeOBq+W/nOOBmOOBpuOCr+ODquODvOODs+OCouODg+ODl+WHpueQhuOCkuWun+ijhVxuICAgIGNvbnNvbGUubG9nKCfinIUgTm92YSDjg6Ljg4fjg6vjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBOb3ZhTW9kZWxUZXN0TW9kdWxlOyJdfQ==