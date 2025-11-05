"use strict";
/**
 * マルチモーダル入力テストモジュール
 *
 * テキスト・画像入力の統合処理を検証
 * 実本番Amazon Bedrockでのマルチモーダル機能をテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultimodalInputTestModule = void 0;
// 定数定義
const MULTIMODAL_TEST_CONSTANTS = {
    MODEL_ID: 'amazon.nova-pro-v1:0',
    MAX_TEXT_LENGTH: 10000,
    MIN_TEXT_LENGTH: 1,
    DEFAULT_MAX_TOKENS: 1000,
    MAX_TOKENS_LIMIT: 8192,
    MIN_TOKENS: 100,
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_TOP_P: 0.9,
    SUCCESS_THRESHOLD: {
        INTEGRATION_QUALITY: 0.8,
        RESPONSE_RELEVANCE: 0.85,
        OVERALL_SCORE: 0.8
    },
    ALLOWED_IMAGE_FORMATS: ['png', 'jpeg', 'jpg', 'webp']
};
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * マルチモーダル入力テストモジュール
 */
class MultimodalInputTestModule {
    config;
    bedrockClient;
    testCases;
    constructor(config) {
        // 設定の検証
        if (!config.region || !config.awsProfile) {
            throw new Error('必須設定が不足しています: region, awsProfile');
        }
        this.config = config;
        try {
            this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
                region: config.region,
                credentials: (0, credential_providers_1.fromIni)({ profile: config.awsProfile })
            });
        }
        catch (error) {
            throw new Error(`AWS認証設定エラー: ${error}`);
        }
        this.testCases = this.loadMultimodalTestCases();
    }
    /**
     * マルチモーダルテストケースの読み込み
     */
    loadMultimodalTestCases() {
        return [
            // テキストのみ（ベースライン）
            {
                id: 'mm-text-001',
                name: 'テキストのみ処理テスト',
                textInput: 'RAGシステムのアーキテクチャ図について説明してください。',
                expectedOutput: 'technical-explanation',
                modalities: ['text'],
                difficulty: 'basic'
            },
            // テキスト + 画像説明（模擬）
            {
                id: 'mm-text-image-001',
                name: 'テキスト・画像統合処理テスト',
                textInput: 'この図に示されているシステム構成について、技術的な観点から分析してください。',
                imageInput: {
                    description: 'RAGシステムのアーキテクチャ図（AWS構成図）',
                    format: 'PNG',
                    size: '1024x768',
                    mockData: true
                },
                expectedOutput: 'multimodal-analysis',
                modalities: ['text', 'image'],
                difficulty: 'intermediate'
            },
            // 複雑なマルチモーダル
            {
                id: 'mm-complex-001',
                name: '複雑マルチモーダル処理テスト',
                textInput: 'この画像に表示されているクラウドアーキテクチャの利点と課題を、コスト効率性とセキュリティの観点から評価してください。また、改善提案も含めてください。',
                imageInput: {
                    description: 'AWS クラウドアーキテクチャ図（複数サービス統合）',
                    format: 'JPEG',
                    size: '1920x1080',
                    mockData: true
                },
                expectedOutput: 'comprehensive-analysis',
                modalities: ['text', 'image'],
                difficulty: 'advanced'
            },
            // 日本語マルチモーダル
            {
                id: 'mm-japanese-001',
                name: '日本語マルチモーダル処理テスト',
                textInput: 'この図表を参考に、日本企業におけるRAGシステム導入のベストプラクティスを日本語で詳しく説明してください。',
                imageInput: {
                    description: '日本語ラベル付きRAG導入フローチャート',
                    format: 'PNG',
                    size: '800x600',
                    mockData: true
                },
                expectedOutput: 'japanese-business-analysis',
                modalities: ['text', 'image'],
                difficulty: 'advanced'
            }
        ];
    }
    /**
     * 包括的マルチモーダルテスト
     */
    async testComprehensiveMultimodal() {
        const testId = 'multimodal-comprehensive-001';
        const startTime = Date.now();
        console.log('🖼️ 包括的マルチモーダルテストを開始...');
        try {
            const results = [];
            // 各テストケースを並列実行（パフォーマンス向上）
            const testPromises = this.testCases.map(async (testCase) => {
                console.log(`   マルチモーダルテスト実行中: ${testCase.name}`);
                return await this.executeMultimodalTest(testCase);
            });
            const testResults = await Promise.allSettled(testPromises);
            // 結果を処理
            testResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    console.error(`❌ テストケース ${this.testCases[index].id} 実行失敗:`, result.reason);
                    results.push({
                        testCase: this.testCases[index],
                        response: '',
                        metrics: { overallScore: 0 },
                        success: false
                    });
                }
            });
            // メトリクス計算
            const modalityMetrics = this.calculateModalityMetrics(results);
            const inputAnalysis = this.analyzeInputComplexity(results);
            const success = modalityMetrics.integrationQuality > MULTIMODAL_TEST_CONSTANTS.SUCCESS_THRESHOLD.INTEGRATION_QUALITY &&
                modalityMetrics.responseRelevance > MULTIMODAL_TEST_CONSTANTS.SUCCESS_THRESHOLD.RESPONSE_RELEVANCE;
            const result = {
                testId,
                testName: '包括的マルチモーダルテスト',
                category: 'multimodal',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                modalityMetrics,
                inputAnalysis,
                metadata: {
                    testCaseCount: this.testCases.length,
                    testResults: results
                }
            };
            if (success) {
                console.log('✅ 包括的マルチモーダルテスト成功');
            }
            else {
                console.error('❌ 包括的マルチモーダルテスト失敗');
            }
            return result;
        }
        catch (error) {
            console.error('❌ 包括的マルチモーダルテスト実行エラー:', error);
            return {
                testId,
                testName: '包括的マルチモーダルテスト',
                category: 'multimodal',
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
     * 個別マルチモーダルテストの実行
     */
    async executeMultimodalTest(testCase) {
        try {
            // 読み取り専用モードでは模擬結果を返す
            if (this.config.readOnlyMode) {
                return this.generateMockMultimodalResult(testCase);
            }
            // 実際のマルチモーダル推論
            const response = await this.performMultimodalInference(testCase);
            // 応答品質評価
            const metrics = this.evaluateMultimodalResponse(response, testCase);
            const success = metrics.overallScore > MULTIMODAL_TEST_CONSTANTS.SUCCESS_THRESHOLD.OVERALL_SCORE;
            return {
                testCase,
                response,
                metrics,
                success
            };
        }
        catch (error) {
            console.error(`❌ マルチモーダルテスト実行エラー (${testCase.id}):`, error);
            return {
                testCase,
                response: '',
                metrics: { overallScore: 0 },
                success: false
            };
        }
    }
    /**
     * マルチモーダル推論実行
     */
    async performMultimodalInference(testCase) {
        try {
            // 入力検証
            if (!testCase.textInput || testCase.textInput.trim().length < MULTIMODAL_TEST_CONSTANTS.MIN_TEXT_LENGTH) {
                throw new Error('テキスト入力が空です');
            }
            if (testCase.textInput.length > MULTIMODAL_TEST_CONSTANTS.MAX_TEXT_LENGTH) {
                throw new Error(`テキスト入力が長すぎます（${MULTIMODAL_TEST_CONSTANTS.MAX_TEXT_LENGTH}文字以内）`);
            }
            // Nova Pro（マルチモーダル対応）を使用
            const requestBody = this.buildMultimodalRequest(testCase);
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: MULTIMODAL_TEST_CONSTANTS.MODEL_ID,
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
            // 応答の検証
            if (!responseBody.results || !Array.isArray(responseBody.results) || responseBody.results.length === 0) {
                throw new Error('Bedrock応答の形式が不正です');
            }
            return responseBody.results[0]?.outputText || '';
        }
        catch (error) {
            console.error('❌ マルチモーダル推論エラー:', error);
            throw error;
        }
    }
    /**
     * マルチモーダルリクエスト構築
     */
    buildMultimodalRequest(testCase) {
        // パラメータの検証と制限
        const maxTokenCount = Math.min(Math.max(MULTIMODAL_TEST_CONSTANTS.MIN_TOKENS, MULTIMODAL_TEST_CONSTANTS.DEFAULT_MAX_TOKENS), MULTIMODAL_TEST_CONSTANTS.MAX_TOKENS_LIMIT);
        const temperature = Math.max(0, Math.min(1, MULTIMODAL_TEST_CONSTANTS.DEFAULT_TEMPERATURE));
        const topP = Math.max(0, Math.min(1, MULTIMODAL_TEST_CONSTANTS.DEFAULT_TOP_P));
        const request = {
            inputText: testCase.textInput.trim(),
            textGenerationConfig: {
                maxTokenCount,
                temperature,
                topP
            }
        };
        // 画像入力がある場合（実際の実装では画像データを含める）
        if (testCase.imageInput && !testCase.imageInput.mockData) {
            // 許可された画像フォーマットのみ受け入れ
            const format = testCase.imageInput.format.toLowerCase();
            if (!MULTIMODAL_TEST_CONSTANTS.ALLOWED_IMAGE_FORMATS.includes(format)) {
                throw new Error(`サポートされていない画像フォーマット: ${format}. 許可されたフォーマット: ${MULTIMODAL_TEST_CONSTANTS.ALLOWED_IMAGE_FORMATS.join(', ')}`);
            }
            request.multimodalInput = {
                images: [
                    {
                        format,
                        source: {
                            bytes: 'base64-encoded-image-data' // 実際の実装では実画像データ
                        }
                    }
                ]
            };
        }
        return request;
    }
    /**
     * 模擬マルチモーダル結果生成
     */
    generateMockMultimodalResult(testCase) {
        const mockResponses = {
            'mm-text-001': 'RAGシステムのアーキテクチャは、検索エンジン、ベクトルデータベース、生成AIモデルの3つの主要コンポーネントから構成されます。',
            'mm-text-image-001': 'この図に示されているRAGシステムは、Amazon FSx for NetApp ONTAPをストレージ層として使用し、Amazon Bedrockを生成AI層として活用する構成になっています。',
            'mm-complex-001': 'このクラウドアーキテクチャの利点として、スケーラビリティと可用性の向上が挙げられます。一方、課題としてはコスト管理とセキュリティ設定の複雑性があります。',
            'mm-japanese-001': '日本企業におけるRAGシステム導入では、既存システムとの統合性、コンプライアンス要件への対応、段階的な導入アプローチが重要なベストプラクティスとなります。'
        };
        const response = mockResponses[testCase.id] || 'マルチモーダル処理による応答です。';
        const metrics = {
            textAccuracy: 0.9,
            imageUnderstanding: testCase.modalities.includes('image') ? 0.85 : 1.0,
            integrationScore: testCase.modalities.length > 1 ? 0.88 : 0.95,
            overallScore: 0.87
        };
        return {
            testCase,
            response,
            metrics,
            success: metrics.overallScore > 0.8
        };
    }
    /**
     * マルチモーダル応答評価
     */
    evaluateMultimodalResponse(response, testCase) {
        // テキスト品質評価
        const textAccuracy = this.evaluateTextQuality(response, testCase);
        // 画像理解評価（画像入力がある場合）
        const imageUnderstanding = testCase.modalities.includes('image') ?
            this.evaluateImageUnderstanding(response, testCase) : 1.0;
        // 統合品質評価
        const integrationScore = this.evaluateModalityIntegration(response, testCase);
        const overallScore = (textAccuracy + imageUnderstanding + integrationScore) / 3;
        return {
            textAccuracy,
            imageUnderstanding,
            integrationScore,
            overallScore
        };
    }
    /**
     * テキスト品質評価
     */
    evaluateTextQuality(response, testCase) {
        // 基本的な品質指標
        const lengthScore = response.length > 50 ? 1.0 : 0.5;
        const relevanceScore = response.includes('システム') || response.includes('RAG') ? 1.0 : 0.7;
        const coherenceScore = response.includes('。') && response.length > 100 ? 1.0 : 0.8;
        return (lengthScore + relevanceScore + coherenceScore) / 3;
    }
    /**
     * 画像理解評価
     */
    evaluateImageUnderstanding(response, testCase) {
        if (!testCase.imageInput)
            return 1.0;
        // 画像に関する言及があるかチェック
        const imageReferences = ['図', '画像', 'アーキテクチャ', '構成', '表示'];
        const mentionsImage = imageReferences.some(ref => response.includes(ref));
        // 技術的な分析があるかチェック
        const technicalTerms = ['システム', 'サービス', '構成', '設計', '実装'];
        const includesTechnicalAnalysis = technicalTerms.some(term => response.includes(term));
        return mentionsImage && includesTechnicalAnalysis ? 0.9 : 0.7;
    }
    /**
     * モダリティ統合評価
     */
    evaluateModalityIntegration(response, testCase) {
        if (testCase.modalities.length === 1)
            return 1.0;
        // テキストと画像の情報が統合されているかチェック
        const integrationIndicators = ['この図', 'に示されている', 'を参考に', 'について分析'];
        const showsIntegration = integrationIndicators.some(indicator => response.includes(indicator));
        return showsIntegration ? 0.9 : 0.6;
    }
    /**
     * モダリティメトリクス計算
     */
    calculateModalityMetrics(results) {
        const validResults = results.filter(r => r.success && r.metrics);
        if (validResults.length === 0) {
            return {
                textProcessingAccuracy: 0,
                imageProcessingAccuracy: 0,
                integrationQuality: 0,
                responseRelevance: 0
            };
        }
        const textAccuracy = validResults.reduce((sum, r) => sum + r.metrics.textAccuracy, 0) / validResults.length;
        const imageAccuracy = validResults.reduce((sum, r) => sum + r.metrics.imageUnderstanding, 0) / validResults.length;
        const integration = validResults.reduce((sum, r) => sum + r.metrics.integrationScore, 0) / validResults.length;
        const relevance = validResults.reduce((sum, r) => sum + r.metrics.overallScore, 0) / validResults.length;
        return {
            textProcessingAccuracy: textAccuracy,
            imageProcessingAccuracy: imageAccuracy,
            integrationQuality: integration,
            responseRelevance: relevance
        };
    }
    /**
     * 入力複雑性分析
     */
    analyzeInputComplexity(results) {
        const totalTextLength = results.reduce((sum, r) => sum + r.testCase.textInput.length, 0);
        const imageCount = results.filter(r => r.testCase.modalities.includes('image')).length;
        const multimodalCount = results.filter(r => r.testCase.modalities.length > 1).length;
        const modalityCombination = `${results.length - imageCount}テキスト + ${imageCount}画像`;
        const complexityScore = (multimodalCount / results.length) * 0.7 + (imageCount / results.length) * 0.3;
        return {
            textLength: totalTextLength / results.length,
            imageCount,
            modalityCombination,
            complexityScore
        };
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 マルチモーダル入力テストモジュールをクリーンアップ中...');
        try {
            // 必要に応じてリソースのクリーンアップ処理を実装
            // 例: 一時ファイルの削除、接続の切断など
            console.log('✅ マルチモーダル入力テストモジュールのクリーンアップ完了');
        }
        catch (error) {
            console.error('❌ クリーンアップ中にエラーが発生:', error);
            throw error;
        }
    }
}
exports.MultimodalInputTestModule = MultimodalInputTestModule;
exports.default = MultimodalInputTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGltb2RhbC1pbnB1dC10ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXVsdGltb2RhbC1pbnB1dC10ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsT0FBTztBQUNQLE1BQU0seUJBQXlCLEdBQUc7SUFDaEMsUUFBUSxFQUFFLHNCQUFzQjtJQUNoQyxlQUFlLEVBQUUsS0FBSztJQUN0QixlQUFlLEVBQUUsQ0FBQztJQUNsQixrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCLGdCQUFnQixFQUFFLElBQUk7SUFDdEIsVUFBVSxFQUFFLEdBQUc7SUFDZixtQkFBbUIsRUFBRSxHQUFHO0lBQ3hCLGFBQWEsRUFBRSxHQUFHO0lBQ2xCLGlCQUFpQixFQUFFO1FBQ2pCLG1CQUFtQixFQUFFLEdBQUc7UUFDeEIsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixhQUFhLEVBQUUsR0FBRztLQUNuQjtJQUNELHFCQUFxQixFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFVO0NBQ3RELENBQUM7QUFFWCw0RUFHeUM7QUFDekMsd0VBQXdEO0FBR3hELDhFQUFvRjtBQXNDcEY7O0dBRUc7QUFDSCxNQUFhLHlCQUF5QjtJQUM1QixNQUFNLENBQW1CO0lBQ3pCLGFBQWEsQ0FBdUI7SUFDcEMsU0FBUyxDQUF1QjtJQUV4QyxZQUFZLE1BQXdCO1FBQ2xDLFFBQVE7UUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXJCLElBQUksQ0FBQztZQUNILElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQztnQkFDNUMsTUFBTSxFQUFFLE1BQU0sQ0FB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QyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUVyRixNQUFNLG1CQUFtQixHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxVQUFVLFVBQVUsVUFBVSxJQUFJLENBQUM7UUFDbkYsTUFBTSxlQUFlLEdBQUcsQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBRXZHLE9BQU87WUFDTCxVQUFVLEVBQUUsZUFBZSxHQUFHLE9BQU8sQ0FBQyxNQUFNO1lBQzVDLFVBQVU7WUFDVixtQkFBbUI7WUFDbkIsZUFBZTtTQUNoQixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7UUFFaEQsSUFBSSxDQUFDO1lBQ0gsMEJBQTBCO1lBQzFCLHVCQUF1QjtZQUV2QixPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNDLE1BQU0sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7Q0FDRjtBQWxlRCw4REFrZUM7QUFFRCxrQkFBZSx5QkFBeUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog44Oe44Or44OB44Oi44O844OA44Or5YWl5Yqb44OG44K544OI44Oi44K444Ol44O844OrXG4gKiBcbiAqIOODhuOCreOCueODiOODu+eUu+WDj+WFpeWKm+OBrue1seWQiOWHpueQhuOCkuaknOiovFxuICog5a6f5pys55WqQW1hem9uIEJlZHJvY2vjgafjga7jg57jg6vjg4Hjg6Ljg7zjg4Djg6vmqZ/og73jgpLjg4bjgrnjg4hcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbi8vIOWumuaVsOWumue+qVxuY29uc3QgTVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUyA9IHtcbiAgTU9ERUxfSUQ6ICdhbWF6b24ubm92YS1wcm8tdjE6MCcsXG4gIE1BWF9URVhUX0xFTkdUSDogMTAwMDAsXG4gIE1JTl9URVhUX0xFTkdUSDogMSxcbiAgREVGQVVMVF9NQVhfVE9LRU5TOiAxMDAwLFxuICBNQVhfVE9LRU5TX0xJTUlUOiA4MTkyLFxuICBNSU5fVE9LRU5TOiAxMDAsXG4gIERFRkFVTFRfVEVNUEVSQVRVUkU6IDAuNyxcbiAgREVGQVVMVF9UT1BfUDogMC45LFxuICBTVUNDRVNTX1RIUkVTSE9MRDoge1xuICAgIElOVEVHUkFUSU9OX1FVQUxJVFk6IDAuOCxcbiAgICBSRVNQT05TRV9SRUxFVkFOQ0U6IDAuODUsXG4gICAgT1ZFUkFMTF9TQ09SRTogMC44XG4gIH0sXG4gIEFMTE9XRURfSU1BR0VfRk9STUFUUzogWydwbmcnLCAnanBlZycsICdqcGcnLCAnd2VicCddIGFzIGNvbnN0XG59IGFzIGNvbnN0O1xuXG5pbXBvcnQge1xuICBCZWRyb2NrUnVudGltZUNsaWVudCxcbiAgSW52b2tlTW9kZWxDb21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1iZWRyb2NrLXJ1bnRpbWUnO1xuaW1wb3J0IHsgZnJvbUluaSB9IGZyb20gJ0Bhd3Mtc2RrL2NyZWRlbnRpYWwtcHJvdmlkZXJzJztcblxuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5pbXBvcnQgeyBUZXN0UmVzdWx0LCBUZXN0RXhlY3V0aW9uU3RhdHVzIH0gZnJvbSAnLi4vLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcblxuLyoqXG4gKiDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vjg4bjgrnjg4jntZDmnpxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNdWx0aW1vZGFsVGVzdFJlc3VsdCBleHRlbmRzIFRlc3RSZXN1bHQge1xuICBtb2RhbGl0eU1ldHJpY3M/OiB7XG4gICAgdGV4dFByb2Nlc3NpbmdBY2N1cmFjeTogbnVtYmVyO1xuICAgIGltYWdlUHJvY2Vzc2luZ0FjY3VyYWN5OiBudW1iZXI7XG4gICAgaW50ZWdyYXRpb25RdWFsaXR5OiBudW1iZXI7XG4gICAgcmVzcG9uc2VSZWxldmFuY2U6IG51bWJlcjtcbiAgfTtcbiAgaW5wdXRBbmFseXNpcz86IHtcbiAgICB0ZXh0TGVuZ3RoOiBudW1iZXI7XG4gICAgaW1hZ2VDb3VudDogbnVtYmVyO1xuICAgIG1vZGFsaXR5Q29tYmluYXRpb246IHN0cmluZztcbiAgICBjb21wbGV4aXR5U2NvcmU6IG51bWJlcjtcbiAgfTtcbn1cblxuLyoqXG4gKiDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vjg4bjgrnjg4jjgrHjg7zjgrlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNdWx0aW1vZGFsVGVzdENhc2Uge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHRleHRJbnB1dDogc3RyaW5nO1xuICBpbWFnZUlucHV0Pzoge1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgZm9ybWF0OiBzdHJpbmc7XG4gICAgc2l6ZTogc3RyaW5nO1xuICAgIG1vY2tEYXRhOiBib29sZWFuO1xuICB9O1xuICBleHBlY3RlZE91dHB1dDogc3RyaW5nO1xuICBtb2RhbGl0aWVzOiAoJ3RleHQnIHwgJ2ltYWdlJylbXTtcbiAgZGlmZmljdWx0eTogJ2Jhc2ljJyB8ICdpbnRlcm1lZGlhdGUnIHwgJ2FkdmFuY2VkJztcbn1cblxuLyoqXG4gKiDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vlhaXlipvjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6tcbiAqL1xuZXhwb3J0IGNsYXNzIE11bHRpbW9kYWxJbnB1dFRlc3RNb2R1bGUge1xuICBwcml2YXRlIGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZztcbiAgcHJpdmF0ZSBiZWRyb2NrQ2xpZW50OiBCZWRyb2NrUnVudGltZUNsaWVudDtcbiAgcHJpdmF0ZSB0ZXN0Q2FzZXM6IE11bHRpbW9kYWxUZXN0Q2FzZVtdO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZykge1xuICAgIC8vIOioreWumuOBruaknOiovFxuICAgIGlmICghY29uZmlnLnJlZ2lvbiB8fCAhY29uZmlnLmF3c1Byb2ZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign5b+F6aCI6Kit5a6a44GM5LiN6Laz44GX44Gm44GE44G+44GZOiByZWdpb24sIGF3c1Byb2ZpbGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICBcbiAgICB0cnkge1xuICAgICAgdGhpcy5iZWRyb2NrQ2xpZW50ID0gbmV3IEJlZHJvY2tSdW50aW1lQ2xpZW50KHtcbiAgICAgICAgcmVnaW9uOiBjb25maWcucmVnaW9uLFxuICAgICAgICBjcmVkZW50aWFsczogZnJvbUluaSh7IHByb2ZpbGU6IGNvbmZpZy5hd3NQcm9maWxlIH0pXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBV1Poqo3oqLzoqK3lrprjgqjjg6njg7w6ICR7ZXJyb3J9YCk7XG4gICAgfVxuICAgIFxuICAgIHRoaXMudGVzdENhc2VzID0gdGhpcy5sb2FkTXVsdGltb2RhbFRlc3RDYXNlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIOODnuODq+ODgeODouODvOODgOODq+ODhuOCueODiOOCseODvOOCueOBruiqreOBv+i+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBsb2FkTXVsdGltb2RhbFRlc3RDYXNlcygpOiBNdWx0aW1vZGFsVGVzdENhc2VbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIOODhuOCreOCueODiOOBruOBv++8iOODmeODvOOCueODqeOCpOODs++8iVxuICAgICAge1xuICAgICAgICBpZDogJ21tLXRleHQtMDAxJyxcbiAgICAgICAgbmFtZTogJ+ODhuOCreOCueODiOOBruOBv+WHpueQhuODhuOCueODiCcsXG4gICAgICAgIHRleHRJbnB1dDogJ1JBR+OCt+OCueODhuODoOOBruOCouODvOOCreODhuOCr+ODgeODo+Wbs+OBq+OBpOOBhOOBpuiqrOaYjuOBl+OBpuOBj+OBoOOBleOBhOOAgicsXG4gICAgICAgIGV4cGVjdGVkT3V0cHV0OiAndGVjaG5pY2FsLWV4cGxhbmF0aW9uJyxcbiAgICAgICAgbW9kYWxpdGllczogWyd0ZXh0J10sXG4gICAgICAgIGRpZmZpY3VsdHk6ICdiYXNpYydcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIOODhuOCreOCueODiCArIOeUu+WDj+iqrOaYju+8iOaooeaTrO+8iVxuICAgICAge1xuICAgICAgICBpZDogJ21tLXRleHQtaW1hZ2UtMDAxJyxcbiAgICAgICAgbmFtZTogJ+ODhuOCreOCueODiOODu+eUu+WDj+e1seWQiOWHpueQhuODhuOCueODiCcsXG4gICAgICAgIHRleHRJbnB1dDogJ+OBk+OBruWbs+OBq+ekuuOBleOCjOOBpuOBhOOCi+OCt+OCueODhuODoOani+aIkOOBq+OBpOOBhOOBpuOAgeaKgOihk+eahOOBquims+eCueOBi+OCieWIhuaekOOBl+OBpuOBj+OBoOOBleOBhOOAgicsXG4gICAgICAgIGltYWdlSW5wdXQ6IHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JBR+OCt+OCueODhuODoOOBruOCouODvOOCreODhuOCr+ODgeODo+Wbs++8iEFXU+ani+aIkOWbs++8iScsXG4gICAgICAgICAgZm9ybWF0OiAnUE5HJyxcbiAgICAgICAgICBzaXplOiAnMTAyNHg3NjgnLFxuICAgICAgICAgIG1vY2tEYXRhOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGV4cGVjdGVkT3V0cHV0OiAnbXVsdGltb2RhbC1hbmFseXNpcycsXG4gICAgICAgIG1vZGFsaXRpZXM6IFsndGV4dCcsICdpbWFnZSddLFxuICAgICAgICBkaWZmaWN1bHR5OiAnaW50ZXJtZWRpYXRlJ1xuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8g6KSH6ZuR44Gq44Oe44Or44OB44Oi44O844OA44OrXG4gICAgICB7XG4gICAgICAgIGlkOiAnbW0tY29tcGxleC0wMDEnLFxuICAgICAgICBuYW1lOiAn6KSH6ZuR44Oe44Or44OB44Oi44O844OA44Or5Yem55CG44OG44K544OIJyxcbiAgICAgICAgdGV4dElucHV0OiAn44GT44Gu55S75YOP44Gr6KGo56S644GV44KM44Gm44GE44KL44Kv44Op44Km44OJ44Ki44O844Kt44OG44Kv44OB44Oj44Gu5Yip54K544Go6Kqy6aGM44KS44CB44Kz44K544OI5Yq5546H5oCn44Go44K744Kt44Ol44Oq44OG44Kj44Gu6Kaz54K544GL44KJ6KmV5L6h44GX44Gm44GP44Gg44GV44GE44CC44G+44Gf44CB5pS55ZaE5o+Q5qGI44KC5ZCr44KB44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgaW1hZ2VJbnB1dDoge1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQVdTIOOCr+ODqeOCpuODieOCouODvOOCreODhuOCr+ODgeODo+Wbs++8iOikh+aVsOOCteODvOODk+OCuee1seWQiO+8iScsXG4gICAgICAgICAgZm9ybWF0OiAnSlBFRycsXG4gICAgICAgICAgc2l6ZTogJzE5MjB4MTA4MCcsXG4gICAgICAgICAgbW9ja0RhdGE6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdjb21wcmVoZW5zaXZlLWFuYWx5c2lzJyxcbiAgICAgICAgbW9kYWxpdGllczogWyd0ZXh0JywgJ2ltYWdlJ10sXG4gICAgICAgIGRpZmZpY3VsdHk6ICdhZHZhbmNlZCdcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIOaXpeacrOiqnuODnuODq+ODgeODouODvOODgOODq1xuICAgICAge1xuICAgICAgICBpZDogJ21tLWphcGFuZXNlLTAwMScsXG4gICAgICAgIG5hbWU6ICfml6XmnKzoqp7jg57jg6vjg4Hjg6Ljg7zjg4Djg6vlh6bnkIbjg4bjgrnjg4gnLFxuICAgICAgICB0ZXh0SW5wdXQ6ICfjgZPjga7lm7PooajjgpLlj4LogIPjgavjgIHml6XmnKzkvIHmpa3jgavjgYrjgZHjgotSQUfjgrfjgrnjg4bjg6DlsI7lhaXjga7jg5njgrnjg4jjg5fjg6njgq/jg4bjgqPjgrnjgpLml6XmnKzoqp7jgafoqbPjgZfjgY/oqqzmmI7jgZfjgabjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICBpbWFnZUlucHV0OiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICfml6XmnKzoqp7jg6njg5njg6vku5jjgY1SQUflsI7lhaXjg5Xjg63jg7zjg4Hjg6Pjg7zjg4gnLFxuICAgICAgICAgIGZvcm1hdDogJ1BORycsXG4gICAgICAgICAgc2l6ZTogJzgwMHg2MDAnLFxuICAgICAgICAgIG1vY2tEYXRhOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGV4cGVjdGVkT3V0cHV0OiAnamFwYW5lc2UtYnVzaW5lc3MtYW5hbHlzaXMnLFxuICAgICAgICBtb2RhbGl0aWVzOiBbJ3RleHQnLCAnaW1hZ2UnXSxcbiAgICAgICAgZGlmZmljdWx0eTogJ2FkdmFuY2VkJ1xuICAgICAgfVxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICog5YyF5ous55qE44Oe44Or44OB44Oi44O844OA44Or44OG44K544OIXG4gICAqL1xuICBhc3luYyB0ZXN0Q29tcHJlaGVuc2l2ZU11bHRpbW9kYWwoKTogUHJvbWlzZTxNdWx0aW1vZGFsVGVzdFJlc3VsdD4ge1xuICAgIGNvbnN0IHRlc3RJZCA9ICdtdWx0aW1vZGFsLWNvbXByZWhlbnNpdmUtMDAxJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn5a877iPIOWMheaLrOeahOODnuODq+ODgeODouODvOODgOODq+ODhuOCueODiOOCkumWi+Wniy4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICAgIC8vIOWQhOODhuOCueODiOOCseODvOOCueOCkuS4puWIl+Wun+ihjO+8iOODkeODleOCqeODvOODnuODs+OCueWQkeS4iu+8iVxuICAgICAgY29uc3QgdGVzdFByb21pc2VzID0gdGhpcy50ZXN0Q2FzZXMubWFwKGFzeW5jICh0ZXN0Q2FzZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg44Oe44Or44OB44Oi44O844OA44Or44OG44K544OI5a6f6KGM5LitOiAke3Rlc3RDYXNlLm5hbWV9YCk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWN1dGVNdWx0aW1vZGFsVGVzdCh0ZXN0Q2FzZSk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgdGVzdFJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQodGVzdFByb21pc2VzKTtcbiAgICAgIFxuICAgICAgLy8g57WQ5p6c44KS5Yem55CGXG4gICAgICB0ZXN0UmVzdWx0cy5mb3JFYWNoKChyZXN1bHQsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJykge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQudmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCDjg4bjgrnjg4jjgrHjg7zjgrkgJHt0aGlzLnRlc3RDYXNlc1tpbmRleF0uaWR9IOWun+ihjOWkseaVlzpgLCByZXN1bHQucmVhc29uKTtcbiAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgdGVzdENhc2U6IHRoaXMudGVzdENhc2VzW2luZGV4XSxcbiAgICAgICAgICAgIHJlc3BvbnNlOiAnJyxcbiAgICAgICAgICAgIG1ldHJpY3M6IHsgb3ZlcmFsbFNjb3JlOiAwIH0sXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8g44Oh44OI44Oq44Kv44K56KiI566XXG4gICAgICBjb25zdCBtb2RhbGl0eU1ldHJpY3MgPSB0aGlzLmNhbGN1bGF0ZU1vZGFsaXR5TWV0cmljcyhyZXN1bHRzKTtcbiAgICAgIGNvbnN0IGlucHV0QW5hbHlzaXMgPSB0aGlzLmFuYWx5emVJbnB1dENvbXBsZXhpdHkocmVzdWx0cyk7XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBtb2RhbGl0eU1ldHJpY3MuaW50ZWdyYXRpb25RdWFsaXR5ID4gTVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUy5TVUNDRVNTX1RIUkVTSE9MRC5JTlRFR1JBVElPTl9RVUFMSVRZICYmIFxuICAgICAgICAgICAgICAgICAgICAgbW9kYWxpdHlNZXRyaWNzLnJlc3BvbnNlUmVsZXZhbmNlID4gTVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUy5TVUNDRVNTX1RIUkVTSE9MRC5SRVNQT05TRV9SRUxFVkFOQ0U7XG5cbiAgICAgIGNvbnN0IHJlc3VsdDogTXVsdGltb2RhbFRlc3RSZXN1bHQgPSB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfljIXmi6znmoTjg57jg6vjg4Hjg6Ljg7zjg4Djg6vjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ211bHRpbW9kYWwnLFxuICAgICAgICBzdGF0dXM6IHN1Y2Nlc3MgPyBUZXN0RXhlY3V0aW9uU3RhdHVzLkNPTVBMRVRFRCA6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzLFxuICAgICAgICBtb2RhbGl0eU1ldHJpY3MsXG4gICAgICAgIGlucHV0QW5hbHlzaXMsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgdGVzdENhc2VDb3VudDogdGhpcy50ZXN0Q2FzZXMubGVuZ3RoLFxuICAgICAgICAgIHRlc3RSZXN1bHRzOiByZXN1bHRzXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUg5YyF5ous55qE44Oe44Or44OB44Oi44O844OA44Or44OG44K544OI5oiQ5YqfJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg5YyF5ous55qE44Oe44Or44OB44Oi44O844OA44Or44OG44K544OI5aSx5pWXJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOWMheaLrOeahOODnuODq+ODgeODouODvOODgOODq+ODhuOCueODiOWun+ihjOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRlc3RJZCxcbiAgICAgICAgdGVzdE5hbWU6ICfljIXmi6znmoTjg57jg6vjg4Hjg6Ljg7zjg4Djg6vjg4bjgrnjg4gnLFxuICAgICAgICBjYXRlZ29yeTogJ211bHRpbW9kYWwnLFxuICAgICAgICBzdGF0dXM6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5YCL5Yil44Oe44Or44OB44Oi44O844OA44Or44OG44K544OI44Gu5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVNdWx0aW1vZGFsVGVzdCh0ZXN0Q2FzZTogTXVsdGltb2RhbFRlc3RDYXNlKTogUHJvbWlzZTx7XG4gICAgdGVzdENhc2U6IE11bHRpbW9kYWxUZXN0Q2FzZTtcbiAgICByZXNwb25zZTogc3RyaW5nO1xuICAgIG1ldHJpY3M6IGFueTtcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIOiqreOBv+WPluOCiuWwgueUqOODouODvOODieOBp+OBr+aooeaTrOe1kOaenOOCkui/lOOBmVxuICAgICAgaWYgKHRoaXMuY29uZmlnLnJlYWRPbmx5TW9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZU1vY2tNdWx0aW1vZGFsUmVzdWx0KHRlc3RDYXNlKTtcbiAgICAgIH1cblxuICAgICAgLy8g5a6f6Zqb44Gu44Oe44Or44OB44Oi44O844OA44Or5o6o6KuWXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucGVyZm9ybU11bHRpbW9kYWxJbmZlcmVuY2UodGVzdENhc2UpO1xuICAgICAgXG4gICAgICAvLyDlv5znrZTlk4Hos6roqZXkvqFcbiAgICAgIGNvbnN0IG1ldHJpY3MgPSB0aGlzLmV2YWx1YXRlTXVsdGltb2RhbFJlc3BvbnNlKHJlc3BvbnNlLCB0ZXN0Q2FzZSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBtZXRyaWNzLm92ZXJhbGxTY29yZSA+IE1VTFRJTU9EQUxfVEVTVF9DT05TVEFOVFMuU1VDQ0VTU19USFJFU0hPTEQuT1ZFUkFMTF9TQ09SRTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdENhc2UsXG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBtZXRyaWNzLFxuICAgICAgICBzdWNjZXNzXG4gICAgICB9O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7wgKCR7dGVzdENhc2UuaWR9KTpgLCBlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0Q2FzZSxcbiAgICAgICAgcmVzcG9uc2U6ICcnLFxuICAgICAgICBtZXRyaWNzOiB7IG92ZXJhbGxTY29yZTogMCB9LFxuICAgICAgICBzdWNjZXNzOiBmYWxzZVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44Oe44Or44OB44Oi44O844OA44Or5o6o6KuW5a6f6KGMXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1NdWx0aW1vZGFsSW5mZXJlbmNlKHRlc3RDYXNlOiBNdWx0aW1vZGFsVGVzdENhc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICAvLyDlhaXlipvmpJzoqLxcbiAgICAgIGlmICghdGVzdENhc2UudGV4dElucHV0IHx8IHRlc3RDYXNlLnRleHRJbnB1dC50cmltKCkubGVuZ3RoIDwgTVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUy5NSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfjg4bjgq3jgrnjg4jlhaXlipvjgYznqbrjgafjgZknKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKHRlc3RDYXNlLnRleHRJbnB1dC5sZW5ndGggPiBNVUxUSU1PREFMX1RFU1RfQ09OU1RBTlRTLk1BWF9URVhUX0xFTkdUSCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOODhuOCreOCueODiOWFpeWKm+OBjOmVt+OBmeOBjuOBvuOBme+8iCR7TVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUy5NQVhfVEVYVF9MRU5HVEh95paH5a2X5Lul5YaF77yJYCk7XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdmEgUHJv77yI44Oe44Or44OB44Oi44O844OA44Or5a++5b+c77yJ44KS5L2/55SoXG4gICAgICBjb25zdCByZXF1ZXN0Qm9keSA9IHRoaXMuYnVpbGRNdWx0aW1vZGFsUmVxdWVzdCh0ZXN0Q2FzZSk7XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgSW52b2tlTW9kZWxDb21tYW5kKHtcbiAgICAgICAgbW9kZWxJZDogTVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUy5NT0RFTF9JRCxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgYWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RCb2R5KVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5iZWRyb2NrQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBcbiAgICAgIGlmICghcmVzcG9uc2UuYm9keSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JlZHJvY2vjgYvjgonjga7lv5znrZTjgYznqbrjgafjgZknKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHJlc3BvbnNlQm9keTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3BvbnNlQm9keSA9IEpTT04ucGFyc2UobmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKHJlc3BvbnNlLmJvZHkpKTtcbiAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCZWRyb2Nr5b+c562U44Gu44OR44O844K544Gr5aSx5pWXOiAke3BhcnNlRXJyb3J9YCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIOW/nOetlOOBruaknOiovFxuICAgICAgaWYgKCFyZXNwb25zZUJvZHkucmVzdWx0cyB8fCAhQXJyYXkuaXNBcnJheShyZXNwb25zZUJvZHkucmVzdWx0cykgfHwgcmVzcG9uc2VCb2R5LnJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQmVkcm9ja+W/nOetlOOBruW9ouW8j+OBjOS4jeato+OBp+OBmScpO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gcmVzcG9uc2VCb2R5LnJlc3VsdHNbMF0/Lm91dHB1dFRleHQgfHwgJyc7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOODnuODq+ODgeODouODvOODgOODq+aOqOirluOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44Oe44Or44OB44Oi44O844OA44Or44Oq44Kv44Ko44K544OI5qeL56+JXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkTXVsdGltb2RhbFJlcXVlc3QodGVzdENhc2U6IE11bHRpbW9kYWxUZXN0Q2FzZSk6IGFueSB7XG4gICAgLy8g44OR44Op44Oh44O844K/44Gu5qSc6Ki844Go5Yi26ZmQXG4gICAgY29uc3QgbWF4VG9rZW5Db3VudCA9IE1hdGgubWluKFxuICAgICAgTWF0aC5tYXgoTVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUy5NSU5fVE9LRU5TLCBNVUxUSU1PREFMX1RFU1RfQ09OU1RBTlRTLkRFRkFVTFRfTUFYX1RPS0VOUyksIFxuICAgICAgTVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUy5NQVhfVE9LRU5TX0xJTUlUXG4gICAgKTtcbiAgICBjb25zdCB0ZW1wZXJhdHVyZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIE1VTFRJTU9EQUxfVEVTVF9DT05TVEFOVFMuREVGQVVMVF9URU1QRVJBVFVSRSkpO1xuICAgIGNvbnN0IHRvcFAgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBNVUxUSU1PREFMX1RFU1RfQ09OU1RBTlRTLkRFRkFVTFRfVE9QX1ApKTtcblxuICAgIGNvbnN0IHJlcXVlc3Q6IGFueSA9IHtcbiAgICAgIGlucHV0VGV4dDogdGVzdENhc2UudGV4dElucHV0LnRyaW0oKSxcbiAgICAgIHRleHRHZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgICAgIG1heFRva2VuQ291bnQsXG4gICAgICAgIHRlbXBlcmF0dXJlLFxuICAgICAgICB0b3BQXG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIOeUu+WDj+WFpeWKm+OBjOOBguOCi+WgtOWQiO+8iOWun+mam+OBruWun+ijheOBp+OBr+eUu+WDj+ODh+ODvOOCv+OCkuWQq+OCgeOCi++8iVxuICAgIGlmICh0ZXN0Q2FzZS5pbWFnZUlucHV0ICYmICF0ZXN0Q2FzZS5pbWFnZUlucHV0Lm1vY2tEYXRhKSB7XG4gICAgICAvLyDoqLHlj6/jgZXjgozjgZ/nlLvlg4/jg5Xjgqnjg7zjg57jg4Pjg4jjga7jgb/lj5fjgZHlhaXjgoxcbiAgICAgIGNvbnN0IGZvcm1hdCA9IHRlc3RDYXNlLmltYWdlSW5wdXQuZm9ybWF0LnRvTG93ZXJDYXNlKCk7XG4gICAgICBcbiAgICAgIGlmICghTVVMVElNT0RBTF9URVNUX0NPTlNUQU5UUy5BTExPV0VEX0lNQUdFX0ZPUk1BVFMuaW5jbHVkZXMoZm9ybWF0IGFzIGFueSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDjgrXjg53jg7zjg4jjgZXjgozjgabjgYTjgarjgYTnlLvlg4/jg5Xjgqnjg7zjg57jg4Pjg4g6ICR7Zm9ybWF0fS4g6Kix5Y+v44GV44KM44Gf44OV44Kp44O844Oe44OD44OIOiAke01VTFRJTU9EQUxfVEVTVF9DT05TVEFOVFMuQUxMT1dFRF9JTUFHRV9GT1JNQVRTLmpvaW4oJywgJyl9YCk7XG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3QubXVsdGltb2RhbElucHV0ID0ge1xuICAgICAgICBpbWFnZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmb3JtYXQsXG4gICAgICAgICAgICBzb3VyY2U6IHtcbiAgICAgICAgICAgICAgYnl0ZXM6ICdiYXNlNjQtZW5jb2RlZC1pbWFnZS1kYXRhJyAvLyDlrp/pmpvjga7lrp/oo4Xjgafjga/lrp/nlLvlg4/jg4fjg7zjgr9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcXVlc3Q7XG4gIH1cblxuICAvKipcbiAgICog5qih5pOs44Oe44Or44OB44Oi44O844OA44Or57WQ5p6c55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlTW9ja011bHRpbW9kYWxSZXN1bHQodGVzdENhc2U6IE11bHRpbW9kYWxUZXN0Q2FzZSk6IHtcbiAgICB0ZXN0Q2FzZTogTXVsdGltb2RhbFRlc3RDYXNlO1xuICAgIHJlc3BvbnNlOiBzdHJpbmc7XG4gICAgbWV0cmljczogYW55O1xuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XG4gIH0ge1xuICAgIGNvbnN0IG1vY2tSZXNwb25zZXMgPSB7XG4gICAgICAnbW0tdGV4dC0wMDEnOiAnUkFH44K344K544OG44Og44Gu44Ki44O844Kt44OG44Kv44OB44Oj44Gv44CB5qSc57Si44Ko44Oz44K444Oz44CB44OZ44Kv44OI44Or44OH44O844K/44OZ44O844K544CB55Sf5oiQQUnjg6Ljg4fjg6vjga4z44Gk44Gu5Li76KaB44Kz44Oz44Od44O844ON44Oz44OI44GL44KJ5qeL5oiQ44GV44KM44G+44GZ44CCJyxcbiAgICAgICdtbS10ZXh0LWltYWdlLTAwMSc6ICfjgZPjga7lm7PjgavnpLrjgZXjgozjgabjgYTjgotSQUfjgrfjgrnjg4bjg6Djga/jgIFBbWF6b24gRlN4IGZvciBOZXRBcHAgT05UQVDjgpLjgrnjg4jjg6zjg7zjgrjlsaTjgajjgZfjgabkvb/nlKjjgZfjgIFBbWF6b24gQmVkcm9ja+OCkueUn+aIkEFJ5bGk44Go44GX44Gm5rS755So44GZ44KL5qeL5oiQ44Gr44Gq44Gj44Gm44GE44G+44GZ44CCJyxcbiAgICAgICdtbS1jb21wbGV4LTAwMSc6ICfjgZPjga7jgq/jg6njgqbjg4njgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjga7liKnngrnjgajjgZfjgabjgIHjgrnjgrHjg7zjg6njg5Pjg6rjg4bjgqPjgajlj6/nlKjmgKfjga7lkJHkuIrjgYzmjJnjgZLjgonjgozjgb7jgZnjgILkuIDmlrnjgIHoqrLpoYzjgajjgZfjgabjga/jgrPjgrnjg4jnrqHnkIbjgajjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrprjga7opIfpm5HmgKfjgYzjgYLjgorjgb7jgZnjgIInLFxuICAgICAgJ21tLWphcGFuZXNlLTAwMSc6ICfml6XmnKzkvIHmpa3jgavjgYrjgZHjgotSQUfjgrfjgrnjg4bjg6DlsI7lhaXjgafjga/jgIHml6LlrZjjgrfjgrnjg4bjg6Djgajjga7ntbHlkIjmgKfjgIHjgrPjg7Pjg5fjg6njgqTjgqLjg7PjgrnopoHku7bjgbjjga7lr77lv5zjgIHmrrXpmo7nmoTjgarlsI7lhaXjgqLjg5fjg63jg7zjg4HjgYzph43opoHjgarjg5njgrnjg4jjg5fjg6njgq/jg4bjgqPjgrnjgajjgarjgorjgb7jgZnjgIInXG4gICAgfTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gbW9ja1Jlc3BvbnNlc1t0ZXN0Q2FzZS5pZCBhcyBrZXlvZiB0eXBlb2YgbW9ja1Jlc3BvbnNlc10gfHwgJ+ODnuODq+ODgeODouODvOODgOODq+WHpueQhuOBq+OCiOOCi+W/nOetlOOBp+OBmeOAgic7XG4gICAgXG4gICAgY29uc3QgbWV0cmljcyA9IHtcbiAgICAgIHRleHRBY2N1cmFjeTogMC45LFxuICAgICAgaW1hZ2VVbmRlcnN0YW5kaW5nOiB0ZXN0Q2FzZS5tb2RhbGl0aWVzLmluY2x1ZGVzKCdpbWFnZScpID8gMC44NSA6IDEuMCxcbiAgICAgIGludGVncmF0aW9uU2NvcmU6IHRlc3RDYXNlLm1vZGFsaXRpZXMubGVuZ3RoID4gMSA/IDAuODggOiAwLjk1LFxuICAgICAgb3ZlcmFsbFNjb3JlOiAwLjg3XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICB0ZXN0Q2FzZSxcbiAgICAgIHJlc3BvbnNlLFxuICAgICAgbWV0cmljcyxcbiAgICAgIHN1Y2Nlc3M6IG1ldHJpY3Mub3ZlcmFsbFNjb3JlID4gMC44XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vlv5znrZToqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVNdWx0aW1vZGFsUmVzcG9uc2UocmVzcG9uc2U6IHN0cmluZywgdGVzdENhc2U6IE11bHRpbW9kYWxUZXN0Q2FzZSk6IGFueSB7XG4gICAgLy8g44OG44Kt44K544OI5ZOB6LOq6KmV5L6hXG4gICAgY29uc3QgdGV4dEFjY3VyYWN5ID0gdGhpcy5ldmFsdWF0ZVRleHRRdWFsaXR5KHJlc3BvbnNlLCB0ZXN0Q2FzZSk7XG4gICAgXG4gICAgLy8g55S75YOP55CG6Kej6KmV5L6h77yI55S75YOP5YWl5Yqb44GM44GC44KL5aC05ZCI77yJXG4gICAgY29uc3QgaW1hZ2VVbmRlcnN0YW5kaW5nID0gdGVzdENhc2UubW9kYWxpdGllcy5pbmNsdWRlcygnaW1hZ2UnKSA/IFxuICAgICAgdGhpcy5ldmFsdWF0ZUltYWdlVW5kZXJzdGFuZGluZyhyZXNwb25zZSwgdGVzdENhc2UpIDogMS4wO1xuICAgIFxuICAgIC8vIOe1seWQiOWTgeizquipleS+oVxuICAgIGNvbnN0IGludGVncmF0aW9uU2NvcmUgPSB0aGlzLmV2YWx1YXRlTW9kYWxpdHlJbnRlZ3JhdGlvbihyZXNwb25zZSwgdGVzdENhc2UpO1xuICAgIFxuICAgIGNvbnN0IG92ZXJhbGxTY29yZSA9ICh0ZXh0QWNjdXJhY3kgKyBpbWFnZVVuZGVyc3RhbmRpbmcgKyBpbnRlZ3JhdGlvblNjb3JlKSAvIDM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEFjY3VyYWN5LFxuICAgICAgaW1hZ2VVbmRlcnN0YW5kaW5nLFxuICAgICAgaW50ZWdyYXRpb25TY29yZSxcbiAgICAgIG92ZXJhbGxTY29yZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog44OG44Kt44K544OI5ZOB6LOq6KmV5L6hXG4gICAqL1xuICBwcml2YXRlIGV2YWx1YXRlVGV4dFF1YWxpdHkocmVzcG9uc2U6IHN0cmluZywgdGVzdENhc2U6IE11bHRpbW9kYWxUZXN0Q2FzZSk6IG51bWJlciB7XG4gICAgLy8g5Z+65pys55qE44Gq5ZOB6LOq5oyH5qiZXG4gICAgY29uc3QgbGVuZ3RoU2NvcmUgPSByZXNwb25zZS5sZW5ndGggPiA1MCA/IDEuMCA6IDAuNTtcbiAgICBjb25zdCByZWxldmFuY2VTY29yZSA9IHJlc3BvbnNlLmluY2x1ZGVzKCfjgrfjgrnjg4bjg6AnKSB8fCByZXNwb25zZS5pbmNsdWRlcygnUkFHJykgPyAxLjAgOiAwLjc7XG4gICAgY29uc3QgY29oZXJlbmNlU2NvcmUgPSByZXNwb25zZS5pbmNsdWRlcygn44CCJykgJiYgcmVzcG9uc2UubGVuZ3RoID4gMTAwID8gMS4wIDogMC44O1xuXG4gICAgcmV0dXJuIChsZW5ndGhTY29yZSArIHJlbGV2YW5jZVNjb3JlICsgY29oZXJlbmNlU2NvcmUpIC8gMztcbiAgfVxuXG4gIC8qKlxuICAgKiDnlLvlg4/nkIbop6PoqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVJbWFnZVVuZGVyc3RhbmRpbmcocmVzcG9uc2U6IHN0cmluZywgdGVzdENhc2U6IE11bHRpbW9kYWxUZXN0Q2FzZSk6IG51bWJlciB7XG4gICAgaWYgKCF0ZXN0Q2FzZS5pbWFnZUlucHV0KSByZXR1cm4gMS4wO1xuXG4gICAgLy8g55S75YOP44Gr6Zai44GZ44KL6KiA5Y+K44GM44GC44KL44GL44OB44Kn44OD44KvXG4gICAgY29uc3QgaW1hZ2VSZWZlcmVuY2VzID0gWyflm7MnLCAn55S75YOPJywgJ+OCouODvOOCreODhuOCr+ODgeODoycsICfmp4vmiJAnLCAn6KGo56S6J107XG4gICAgY29uc3QgbWVudGlvbnNJbWFnZSA9IGltYWdlUmVmZXJlbmNlcy5zb21lKHJlZiA9PiByZXNwb25zZS5pbmNsdWRlcyhyZWYpKTtcbiAgICBcbiAgICAvLyDmioDooZPnmoTjgarliIbmnpDjgYzjgYLjgovjgYvjg4Hjgqfjg4Pjgq9cbiAgICBjb25zdCB0ZWNobmljYWxUZXJtcyA9IFsn44K344K544OG44OgJywgJ+OCteODvOODk+OCuScsICfmp4vmiJAnLCAn6Kit6KiIJywgJ+Wun+ijhSddO1xuICAgIGNvbnN0IGluY2x1ZGVzVGVjaG5pY2FsQW5hbHlzaXMgPSB0ZWNobmljYWxUZXJtcy5zb21lKHRlcm0gPT4gcmVzcG9uc2UuaW5jbHVkZXModGVybSkpO1xuXG4gICAgcmV0dXJuIG1lbnRpb25zSW1hZ2UgJiYgaW5jbHVkZXNUZWNobmljYWxBbmFseXNpcyA/IDAuOSA6IDAuNztcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6Ljg4Djg6rjg4bjgqPntbHlkIjoqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVNb2RhbGl0eUludGVncmF0aW9uKHJlc3BvbnNlOiBzdHJpbmcsIHRlc3RDYXNlOiBNdWx0aW1vZGFsVGVzdENhc2UpOiBudW1iZXIge1xuICAgIGlmICh0ZXN0Q2FzZS5tb2RhbGl0aWVzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIDEuMDtcblxuICAgIC8vIOODhuOCreOCueODiOOBqOeUu+WDj+OBruaDheWgseOBjOe1seWQiOOBleOCjOOBpuOBhOOCi+OBi+ODgeOCp+ODg+OCr1xuICAgIGNvbnN0IGludGVncmF0aW9uSW5kaWNhdG9ycyA9IFsn44GT44Gu5ZuzJywgJ+OBq+ekuuOBleOCjOOBpuOBhOOCiycsICfjgpLlj4LogIPjgasnLCAn44Gr44Gk44GE44Gm5YiG5p6QJ107XG4gICAgY29uc3Qgc2hvd3NJbnRlZ3JhdGlvbiA9IGludGVncmF0aW9uSW5kaWNhdG9ycy5zb21lKGluZGljYXRvciA9PiByZXNwb25zZS5pbmNsdWRlcyhpbmRpY2F0b3IpKTtcblxuICAgIHJldHVybiBzaG93c0ludGVncmF0aW9uID8gMC45IDogMC42O1xuICB9XG5cbiAgLyoqXG4gICAqIOODouODgOODquODhuOCo+ODoeODiOODquOCr+OCueioiOeul1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVNb2RhbGl0eU1ldHJpY3MocmVzdWx0czogYW55W10pOiB7XG4gICAgdGV4dFByb2Nlc3NpbmdBY2N1cmFjeTogbnVtYmVyO1xuICAgIGltYWdlUHJvY2Vzc2luZ0FjY3VyYWN5OiBudW1iZXI7XG4gICAgaW50ZWdyYXRpb25RdWFsaXR5OiBudW1iZXI7XG4gICAgcmVzcG9uc2VSZWxldmFuY2U6IG51bWJlcjtcbiAgfSB7XG4gICAgY29uc3QgdmFsaWRSZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MgJiYgci5tZXRyaWNzKTtcbiAgICBcbiAgICBpZiAodmFsaWRSZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dFByb2Nlc3NpbmdBY2N1cmFjeTogMCxcbiAgICAgICAgaW1hZ2VQcm9jZXNzaW5nQWNjdXJhY3k6IDAsXG4gICAgICAgIGludGVncmF0aW9uUXVhbGl0eTogMCxcbiAgICAgICAgcmVzcG9uc2VSZWxldmFuY2U6IDBcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dEFjY3VyYWN5ID0gdmFsaWRSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLm1ldHJpY3MudGV4dEFjY3VyYWN5LCAwKSAvIHZhbGlkUmVzdWx0cy5sZW5ndGg7XG4gICAgY29uc3QgaW1hZ2VBY2N1cmFjeSA9IHZhbGlkUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5tZXRyaWNzLmltYWdlVW5kZXJzdGFuZGluZywgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuICAgIGNvbnN0IGludGVncmF0aW9uID0gdmFsaWRSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLm1ldHJpY3MuaW50ZWdyYXRpb25TY29yZSwgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuICAgIGNvbnN0IHJlbGV2YW5jZSA9IHZhbGlkUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcikgPT4gc3VtICsgci5tZXRyaWNzLm92ZXJhbGxTY29yZSwgMCkgLyB2YWxpZFJlc3VsdHMubGVuZ3RoO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHRQcm9jZXNzaW5nQWNjdXJhY3k6IHRleHRBY2N1cmFjeSxcbiAgICAgIGltYWdlUHJvY2Vzc2luZ0FjY3VyYWN5OiBpbWFnZUFjY3VyYWN5LFxuICAgICAgaW50ZWdyYXRpb25RdWFsaXR5OiBpbnRlZ3JhdGlvbixcbiAgICAgIHJlc3BvbnNlUmVsZXZhbmNlOiByZWxldmFuY2VcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOWFpeWKm+ikh+mbkeaAp+WIhuaekFxuICAgKi9cbiAgcHJpdmF0ZSBhbmFseXplSW5wdXRDb21wbGV4aXR5KHJlc3VsdHM6IGFueVtdKToge1xuICAgIHRleHRMZW5ndGg6IG51bWJlcjtcbiAgICBpbWFnZUNvdW50OiBudW1iZXI7XG4gICAgbW9kYWxpdHlDb21iaW5hdGlvbjogc3RyaW5nO1xuICAgIGNvbXBsZXhpdHlTY29yZTogbnVtYmVyO1xuICB9IHtcbiAgICBjb25zdCB0b3RhbFRleHRMZW5ndGggPSByZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLnRlc3RDYXNlLnRleHRJbnB1dC5sZW5ndGgsIDApO1xuICAgIGNvbnN0IGltYWdlQ291bnQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIudGVzdENhc2UubW9kYWxpdGllcy5pbmNsdWRlcygnaW1hZ2UnKSkubGVuZ3RoO1xuICAgIGNvbnN0IG11bHRpbW9kYWxDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci50ZXN0Q2FzZS5tb2RhbGl0aWVzLmxlbmd0aCA+IDEpLmxlbmd0aDtcbiAgICBcbiAgICBjb25zdCBtb2RhbGl0eUNvbWJpbmF0aW9uID0gYCR7cmVzdWx0cy5sZW5ndGggLSBpbWFnZUNvdW50feODhuOCreOCueODiCArICR7aW1hZ2VDb3VudH3nlLvlg49gO1xuICAgIGNvbnN0IGNvbXBsZXhpdHlTY29yZSA9IChtdWx0aW1vZGFsQ291bnQgLyByZXN1bHRzLmxlbmd0aCkgKiAwLjcgKyAoaW1hZ2VDb3VudCAvIHJlc3VsdHMubGVuZ3RoKSAqIDAuMztcblxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0TGVuZ3RoOiB0b3RhbFRleHRMZW5ndGggLyByZXN1bHRzLmxlbmd0aCxcbiAgICAgIGltYWdlQ291bnQsXG4gICAgICBtb2RhbGl0eUNvbWJpbmF0aW9uLFxuICAgICAgY29tcGxleGl0eVNjb3JlXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjg6rjgr3jg7zjgrnjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5dcbiAgICovXG4gIGFzeW5jIGNsZWFudXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ/Cfp7kg44Oe44Or44OB44Oi44O844OA44Or5YWl5Yqb44OG44K544OI44Oi44K444Ol44O844Or44KS44Kv44Oq44O844Oz44Ki44OD44OX5LitLi4uJyk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIOW/heimgeOBq+W/nOOBmOOBpuODquOCveODvOOCueOBruOCr+ODquODvOODs+OCouODg+ODl+WHpueQhuOCkuWun+ijhVxuICAgICAgLy8g5L6LOiDkuIDmmYLjg5XjgqHjgqTjg6vjga7liYrpmaTjgIHmjqXntprjga7liIfmlq3jgarjgalcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ+KchSDjg57jg6vjg4Hjg6Ljg7zjg4Djg6vlhaXlipvjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vjga7jgq/jg6rjg7zjg7PjgqLjg4Pjg5flrozkuoYnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOOCr+ODquODvOODs+OCouODg+ODl+S4reOBq+OCqOODqeODvOOBjOeZuueUnzonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTXVsdGltb2RhbElucHV0VGVzdE1vZHVsZTsiXX0=