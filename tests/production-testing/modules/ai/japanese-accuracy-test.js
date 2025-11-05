"use strict";
/**
 * 日本語サポート精度テストモジュール
 *
 * 95%以上の日本語精度検証を実行
 * 実本番Amazon Bedrockでの日本語処理能力を包括的にテスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JapaneseAccuracyTestModule = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const production_test_engine_1 = require("../../core/production-test-engine");
/**
 * 日本語サポート精度テストモジュール
 */
class JapaneseAccuracyTestModule {
    config;
    bedrockClient;
    testCases;
    constructor(config) {
        this.config = config;
        this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: config.region,
            credentials: (0, credential_providers_1.fromIni)({ profile: config.awsProfile })
        });
        this.testCases = this.loadJapaneseTestCases();
    }
    /**
     * 日本語テストケースの読み込み
     */
    loadJapaneseTestCases() {
        return [
            // 基本的な敬語テスト
            {
                id: 'jp-keigo-001',
                category: 'keigo-basic',
                prompt: 'お客様への報告書を作成してください。プロジェクトの進捗について丁寧に説明してください。',
                expectedElements: ['です・ます調', '敬語表現', '丁寧語'],
                grammarPoints: ['です', 'ます', 'ございます'],
                formalityLevel: 'formal',
                difficulty: 'intermediate'
            },
            // ビジネス日本語テスト
            {
                id: 'jp-business-001',
                category: 'business-japanese',
                prompt: 'RAGシステムの導入効果について、経営陣向けの提案資料を作成してください。',
                expectedElements: ['ビジネス用語', '論理的構成', '数値的根拠'],
                grammarPoints: ['である調', '専門用語', '提案表現'],
                formalityLevel: 'formal',
                difficulty: 'advanced'
            },
            // 技術文書テスト
            {
                id: 'jp-technical-001',
                category: 'technical-japanese',
                prompt: 'Amazon FSx for NetApp ONTAPの技術仕様について、エンジニア向けに詳細に説明してください。',
                expectedElements: ['技術用語', '正確な表現', '具体的説明'],
                grammarPoints: ['専門用語', '説明文', '技術表現'],
                formalityLevel: 'polite',
                difficulty: 'advanced'
            },
            // 日常会話テスト
            {
                id: 'jp-casual-001',
                category: 'casual-conversation',
                prompt: 'チャットボットの使い方について、初心者にもわかりやすく教えてください。',
                expectedElements: ['わかりやすい表現', '親しみやすさ', '具体例'],
                grammarPoints: ['です・ます調', '平易な語彙', '例示表現'],
                formalityLevel: 'polite',
                difficulty: 'basic'
            },
            // 複雑な文法テスト
            {
                id: 'jp-grammar-001',
                category: 'complex-grammar',
                prompt: 'もしAIシステムが完全に自動化されたとしても、人間の判断が必要な場面について考察してください。',
                expectedElements: ['仮定表現', '複文構造', '論理的思考'],
                grammarPoints: ['もし〜としても', '〜について', '〜が必要'],
                formalityLevel: 'formal',
                difficulty: 'advanced'
            }
        ];
    }
    /**
     * 包括的日本語精度テスト
     */
    async testComprehensiveJapaneseAccuracy() {
        const testId = 'jp-accuracy-comprehensive-001';
        const startTime = Date.now();
        console.log('🇯🇵 包括的日本語精度テストを開始...');
        try {
            const categoryResults = {};
            let totalScore = 0;
            let testCount = 0;
            // 各テストケースを実行
            for (const testCase of this.testCases) {
                console.log(`   テスト実行中: ${testCase.category}`);
                const caseResult = await this.executeJapaneseTest(testCase);
                categoryResults[testCase.category] = caseResult;
                totalScore += caseResult.score;
                testCount++;
            }
            const overallAccuracy = totalScore / testCount;
            // 詳細な精度メトリクスを計算
            const accuracyMetrics = this.calculateDetailedAccuracy(categoryResults);
            const success = overallAccuracy >= 0.95; // 95%以上の精度要求
            const result = {
                testId,
                testName: '包括的日本語精度テスト',
                category: 'japanese-accuracy',
                status: success ? production_test_engine_1.TestExecutionStatus.COMPLETED : production_test_engine_1.TestExecutionStatus.FAILED,
                startTime: new Date(startTime),
                endTime: new Date(),
                duration: Date.now() - startTime,
                success,
                accuracyMetrics,
                testCategories: categoryResults,
                metadata: {
                    targetAccuracy: 0.95,
                    actualAccuracy: overallAccuracy,
                    testCaseCount: testCount
                }
            };
            if (success) {
                console.log(`✅ 包括的日本語精度テスト成功 (精度: ${(overallAccuracy * 100).toFixed(1)}%)`);
            }
            else {
                console.error(`❌ 包括的日本語精度テスト失敗 (精度: ${(overallAccuracy * 100).toFixed(1)}%)`);
            }
            return result;
        }
        catch (error) {
            console.error('❌ 包括的日本語精度テスト実行エラー:', error);
            return {
                testId,
                testName: '包括的日本語精度テスト',
                category: 'japanese-accuracy',
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
     * 個別日本語テストの実行
     */
    async executeJapaneseTest(testCase) {
        try {
            // 読み取り専用モードでは模擬応答を使用
            if (this.config.readOnlyMode) {
                return this.generateMockJapaneseTestResult(testCase);
            }
            // 実際のBedrock推論（Nova Proを使用）
            const requestBody = {
                inputText: testCase.prompt,
                textGenerationConfig: {
                    maxTokenCount: 1000,
                    temperature: 0.7,
                    topP: 0.9
                }
            };
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: 'amazon.nova-pro-v1:0',
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            });
            const response = await this.bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const generatedText = responseBody.results?.[0]?.outputText || '';
            // 日本語精度を評価
            const score = this.evaluateJapaneseAccuracy(generatedText, testCase);
            const details = this.generateEvaluationDetails(generatedText, testCase, score);
            return { score, details };
        }
        catch (error) {
            console.error(`❌ 日本語テスト実行エラー (${testCase.id}):`, error);
            return {
                score: 0,
                details: `テスト実行エラー: ${error}`
            };
        }
    }
    /**
     * 模擬日本語テスト結果生成
     */
    generateMockJapaneseTestResult(testCase) {
        // カテゴリ別の模擬スコア
        const mockScores = {
            'keigo-basic': 0.92,
            'business-japanese': 0.96,
            'technical-japanese': 0.94,
            'casual-conversation': 0.98,
            'complex-grammar': 0.89
        };
        const score = mockScores[testCase.category] || 0.90;
        const details = `模擬テスト結果: ${testCase.category} - スコア ${(score * 100).toFixed(1)}%`;
        return { score, details };
    }
    /**
     * 日本語精度評価
     */
    evaluateJapaneseAccuracy(text, testCase) {
        let totalScore = 0;
        let criteriaCount = 0;
        // 1. 文法ポイントの評価
        const grammarScore = this.evaluateGrammarPoints(text, testCase.grammarPoints);
        totalScore += grammarScore;
        criteriaCount++;
        // 2. 期待要素の評価
        const elementsScore = this.evaluateExpectedElements(text, testCase.expectedElements);
        totalScore += elementsScore;
        criteriaCount++;
        // 3. 敬語レベルの評価
        const formalityScore = this.evaluateFormalityLevel(text, testCase.formalityLevel);
        totalScore += formalityScore;
        criteriaCount++;
        // 4. 日本語文字使用率の評価
        const characterScore = this.evaluateJapaneseCharacterUsage(text);
        totalScore += characterScore;
        criteriaCount++;
        return totalScore / criteriaCount;
    }
    /**
     * 文法ポイント評価
     */
    evaluateGrammarPoints(text, grammarPoints) {
        const foundPoints = grammarPoints.filter(point => text.includes(point));
        return foundPoints.length / grammarPoints.length;
    }
    /**
     * 期待要素評価
     */
    evaluateExpectedElements(text, expectedElements) {
        let score = 0;
        for (const element of expectedElements) {
            switch (element) {
                case 'です・ます調':
                    score += text.includes('です') || text.includes('ます') ? 1 : 0;
                    break;
                case 'ビジネス用語':
                    score += /効果|効率|改善|最適化|導入/.test(text) ? 1 : 0;
                    break;
                case '技術用語':
                    score += /システム|アーキテクチャ|インフラ|API/.test(text) ? 1 : 0;
                    break;
                default:
                    score += 0.5; // 部分点
            }
        }
        return score / expectedElements.length;
    }
    /**
     * 敬語レベル評価
     */
    evaluateFormalityLevel(text, expectedLevel) {
        const formalPatterns = /ございます|いたします|させていただき/;
        const politePatterns = /です|ます|でしょう/;
        const casualPatterns = /だ|である|〜ね|〜よ/;
        switch (expectedLevel) {
            case 'formal':
                return formalPatterns.test(text) ? 1.0 : (politePatterns.test(text) ? 0.7 : 0.3);
            case 'polite':
                return politePatterns.test(text) ? 1.0 : 0.5;
            case 'casual':
                return casualPatterns.test(text) ? 1.0 : (politePatterns.test(text) ? 0.8 : 0.4);
            default:
                return 0.5;
        }
    }
    /**
     * 日本語文字使用率評価
     */
    evaluateJapaneseCharacterUsage(text) {
        const hiragana = (text.match(/[\u3040-\u309F]/g) || []).length;
        const katakana = (text.match(/[\u30A0-\u30FF]/g) || []).length;
        const kanji = (text.match(/[\u4E00-\u9FAF]/g) || []).length;
        const japaneseChars = hiragana + katakana + kanji;
        const totalChars = text.length;
        const ratio = japaneseChars / totalChars;
        // 適切な日本語使用率（70-95%）を評価
        if (ratio >= 0.7 && ratio <= 0.95) {
            return 1.0;
        }
        else if (ratio >= 0.5) {
            return 0.8;
        }
        else {
            return 0.4;
        }
    }
    /**
     * 詳細精度メトリクス計算
     */
    calculateDetailedAccuracy(categoryResults) {
        const scores = Object.values(categoryResults).map(r => r.score);
        const overallAccuracy = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        // カテゴリ別精度を計算
        const grammarAccuracy = categoryResults['complex-grammar']?.score || 0.9;
        const vocabularyAccuracy = categoryResults['technical-japanese']?.score || 0.9;
        const contextAccuracy = categoryResults['business-japanese']?.score || 0.9;
        const formalityAccuracy = categoryResults['keigo-basic']?.score || 0.9;
        return {
            overallAccuracy,
            grammarAccuracy,
            vocabularyAccuracy,
            contextAccuracy,
            formalityAccuracy
        };
    }
    /**
     * 評価詳細生成
     */
    generateEvaluationDetails(text, testCase, score) {
        return `カテゴリ: ${testCase.category}, スコア: ${(score * 100).toFixed(1)}%, ` +
            `敬語レベル: ${testCase.formalityLevel}, 難易度: ${testCase.difficulty}`;
    }
    /**
     * リソースのクリーンアップ
     */
    async cleanup() {
        console.log('🧹 日本語精度テストモジュールをクリーンアップ中...');
        console.log('✅ 日本語精度テストモジュールのクリーンアップ完了');
    }
}
exports.JapaneseAccuracyTestModule = JapaneseAccuracyTestModule;
exports.default = JapaneseAccuracyTestModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamFwYW5lc2UtYWNjdXJhY3ktdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImphcGFuZXNlLWFjY3VyYWN5LXRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFFSCw0RUFHeUM7QUFDekMsd0VBQXdEO0FBR3hELDhFQUFvRjtBQWtDcEY7O0dBRUc7QUFDSCxNQUFhLDBCQUEwQjtJQUM3QixNQUFNLENBQW1CO0lBQ3pCLGFBQWEsQ0FBdUI7SUFDcEMsU0FBUyxDQUFxQjtJQUV0QyxZQUFZLE1BQXdCO1FBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXJCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQztZQUM1QyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsV0FBVyxFQUFFLElBQUEsOEJBQU8sRUFBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7U0FDckQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUNoRCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxxQkFBcUI7UUFDM0IsT0FBTztZQUNMLFlBQVk7WUFDWjtnQkFDRSxFQUFFLEVBQUUsY0FBYztnQkFDbEIsUUFBUSxFQUFFLGFBQWE7Z0JBQ3ZCLE1BQU0sRUFBRSw2Q0FBNkM7Z0JBQ3JELGdCQUFnQixFQUFFLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUM7Z0JBQzNDLGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDO2dCQUNwQyxjQUFjLEVBQUUsUUFBUTtnQkFDeEIsVUFBVSxFQUFFLGNBQWM7YUFDM0I7WUFFRCxhQUFhO1lBQ2I7Z0JBQ0UsRUFBRSxFQUFFLGlCQUFpQjtnQkFDckIsUUFBUSxFQUFFLG1CQUFtQjtnQkFDN0IsTUFBTSxFQUFFLHVDQUF1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QUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUMzQyxDQUFDO0NBQ0Y7QUFwWEQsZ0VBb1hDO0FBRUQsa0JBQWUsMEJBQTBCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOaXpeacrOiqnuOCteODneODvOODiOeyvuW6puODhuOCueODiOODouOCuOODpeODvOODq1xuICogXG4gKiA5NSXku6XkuIrjga7ml6XmnKzoqp7nsr7luqbmpJzoqLzjgpLlrp/ooYxcbiAqIOWun+acrOeVqkFtYXpvbiBCZWRyb2Nr44Gn44Gu5pel5pys6Kqe5Yem55CG6IO95Yqb44KS5YyF5ous55qE44Gr44OG44K544OIXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQge1xuICBCZWRyb2NrUnVudGltZUNsaWVudCxcbiAgSW52b2tlTW9kZWxDb21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1iZWRyb2NrLXJ1bnRpbWUnO1xuaW1wb3J0IHsgZnJvbUluaSB9IGZyb20gJ0Bhd3Mtc2RrL2NyZWRlbnRpYWwtcHJvdmlkZXJzJztcblxuaW1wb3J0IHsgUHJvZHVjdGlvbkNvbmZpZyB9IGZyb20gJy4uLy4uL2NvbmZpZy9wcm9kdWN0aW9uLWNvbmZpZyc7XG5pbXBvcnQgeyBUZXN0UmVzdWx0LCBUZXN0RXhlY3V0aW9uU3RhdHVzIH0gZnJvbSAnLi4vLi4vY29yZS9wcm9kdWN0aW9uLXRlc3QtZW5naW5lJztcblxuLyoqXG4gKiDml6XmnKzoqp7nsr7luqbjg4bjgrnjg4jntZDmnpxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBKYXBhbmVzZUFjY3VyYWN5VGVzdFJlc3VsdCBleHRlbmRzIFRlc3RSZXN1bHQge1xuICBhY2N1cmFjeU1ldHJpY3M/OiB7XG4gICAgb3ZlcmFsbEFjY3VyYWN5OiBudW1iZXI7XG4gICAgZ3JhbW1hckFjY3VyYWN5OiBudW1iZXI7XG4gICAgdm9jYWJ1bGFyeUFjY3VyYWN5OiBudW1iZXI7XG4gICAgY29udGV4dEFjY3VyYWN5OiBudW1iZXI7XG4gICAgZm9ybWFsaXR5QWNjdXJhY3k6IG51bWJlcjtcbiAgfTtcbiAgdGVzdENhdGVnb3JpZXM/OiB7XG4gICAgW2NhdGVnb3J5OiBzdHJpbmddOiB7XG4gICAgICBzY29yZTogbnVtYmVyO1xuICAgICAgZGV0YWlsczogc3RyaW5nO1xuICAgIH07XG4gIH07XG59XG5cbi8qKlxuICog5pel5pys6Kqe44OG44K544OI44Kx44O844K5XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSmFwYW5lc2VUZXN0Q2FzZSB7XG4gIGlkOiBzdHJpbmc7XG4gIGNhdGVnb3J5OiBzdHJpbmc7XG4gIHByb21wdDogc3RyaW5nO1xuICBleHBlY3RlZEVsZW1lbnRzOiBzdHJpbmdbXTtcbiAgZ3JhbW1hclBvaW50czogc3RyaW5nW107XG4gIGZvcm1hbGl0eUxldmVsOiAnY2FzdWFsJyB8ICdwb2xpdGUnIHwgJ2Zvcm1hbCc7XG4gIGRpZmZpY3VsdHk6ICdiYXNpYycgfCAnaW50ZXJtZWRpYXRlJyB8ICdhZHZhbmNlZCc7XG59XG5cbi8qKlxuICog5pel5pys6Kqe44K144Od44O844OI57K+5bqm44OG44K544OI44Oi44K444Ol44O844OrXG4gKi9cbmV4cG9ydCBjbGFzcyBKYXBhbmVzZUFjY3VyYWN5VGVzdE1vZHVsZSB7XG4gIHByaXZhdGUgY29uZmlnOiBQcm9kdWN0aW9uQ29uZmlnO1xuICBwcml2YXRlIGJlZHJvY2tDbGllbnQ6IEJlZHJvY2tSdW50aW1lQ2xpZW50O1xuICBwcml2YXRlIHRlc3RDYXNlczogSmFwYW5lc2VUZXN0Q2FzZVtdO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUHJvZHVjdGlvbkNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIFxuICAgIHRoaXMuYmVkcm9ja0NsaWVudCA9IG5ldyBCZWRyb2NrUnVudGltZUNsaWVudCh7XG4gICAgICByZWdpb246IGNvbmZpZy5yZWdpb24sXG4gICAgICBjcmVkZW50aWFsczogZnJvbUluaSh7IHByb2ZpbGU6IGNvbmZpZy5hd3NQcm9maWxlIH0pXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy50ZXN0Q2FzZXMgPSB0aGlzLmxvYWRKYXBhbmVzZVRlc3RDYXNlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIOaXpeacrOiqnuODhuOCueODiOOCseODvOOCueOBruiqreOBv+i+vOOBv1xuICAgKi9cbiAgcHJpdmF0ZSBsb2FkSmFwYW5lc2VUZXN0Q2FzZXMoKTogSmFwYW5lc2VUZXN0Q2FzZVtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgLy8g5Z+65pys55qE44Gq5pWs6Kqe44OG44K544OIXG4gICAgICB7XG4gICAgICAgIGlkOiAnanAta2VpZ28tMDAxJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdrZWlnby1iYXNpYycsXG4gICAgICAgIHByb21wdDogJ+OBiuWuouanmOOBuOOBruWgseWRiuabuOOCkuS9nOaIkOOBl+OBpuOBj+OBoOOBleOBhOOAguODl+ODreOCuOOCp+OCr+ODiOOBrumAsuaNl+OBq+OBpOOBhOOBpuS4geWvp+OBq+iqrOaYjuOBl+OBpuOBj+OBoOOBleOBhOOAgicsXG4gICAgICAgIGV4cGVjdGVkRWxlbWVudHM6IFsn44Gn44GZ44O744G+44GZ6Kq/JywgJ+aVrOiqnuihqOePvicsICfkuIHlr6foqp4nXSxcbiAgICAgICAgZ3JhbW1hclBvaW50czogWyfjgafjgZknLCAn44G+44GZJywgJ+OBlOOBluOBhOOBvuOBmSddLFxuICAgICAgICBmb3JtYWxpdHlMZXZlbDogJ2Zvcm1hbCcsXG4gICAgICAgIGRpZmZpY3VsdHk6ICdpbnRlcm1lZGlhdGUnXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyDjg5Pjgrjjg43jgrnml6XmnKzoqp7jg4bjgrnjg4hcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdqcC1idXNpbmVzcy0wMDEnLFxuICAgICAgICBjYXRlZ29yeTogJ2J1c2luZXNzLWphcGFuZXNlJyxcbiAgICAgICAgcHJvbXB0OiAnUkFH44K344K544OG44Og44Gu5bCO5YWl5Yq55p6c44Gr44Gk44GE44Gm44CB57WM5Za26Zmj5ZCR44GR44Gu5o+Q5qGI6LOH5paZ44KS5L2c5oiQ44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgZXhwZWN0ZWRFbGVtZW50czogWyfjg5Pjgrjjg43jgrnnlKjoqp4nLCAn6KuW55CG55qE5qeL5oiQJywgJ+aVsOWApOeahOagueaLoCddLFxuICAgICAgICBncmFtbWFyUG9pbnRzOiBbJ+OBp+OBguOCi+iqvycsICflsILploDnlKjoqp4nLCAn5o+Q5qGI6KGo54++J10sXG4gICAgICAgIGZvcm1hbGl0eUxldmVsOiAnZm9ybWFsJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2FkdmFuY2VkJ1xuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8g5oqA6KGT5paH5pu444OG44K544OIXG4gICAgICB7XG4gICAgICAgIGlkOiAnanAtdGVjaG5pY2FsLTAwMScsXG4gICAgICAgIGNhdGVnb3J5OiAndGVjaG5pY2FsLWphcGFuZXNlJyxcbiAgICAgICAgcHJvbXB0OiAnQW1hem9uIEZTeCBmb3IgTmV0QXBwIE9OVEFQ44Gu5oqA6KGT5LuV5qeY44Gr44Gk44GE44Gm44CB44Ko44Oz44K444OL44Ki5ZCR44GR44Gr6Kmz57Sw44Gr6Kqs5piO44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgZXhwZWN0ZWRFbGVtZW50czogWyfmioDooZPnlKjoqp4nLCAn5q2j56K644Gq6KGo54++JywgJ+WFt+S9k+eahOiqrOaYjiddLFxuICAgICAgICBncmFtbWFyUG9pbnRzOiBbJ+WwgumWgOeUqOiqnicsICfoqqzmmI7mlocnLCAn5oqA6KGT6KGo54++J10sXG4gICAgICAgIGZvcm1hbGl0eUxldmVsOiAncG9saXRlJyxcbiAgICAgICAgZGlmZmljdWx0eTogJ2FkdmFuY2VkJ1xuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8g5pel5bi45Lya6Kmx44OG44K544OIXG4gICAgICB7XG4gICAgICAgIGlkOiAnanAtY2FzdWFsLTAwMScsXG4gICAgICAgIGNhdGVnb3J5OiAnY2FzdWFsLWNvbnZlcnNhdGlvbicsXG4gICAgICAgIHByb21wdDogJ+ODgeODo+ODg+ODiOODnOODg+ODiOOBruS9v+OBhOaWueOBq+OBpOOBhOOBpuOAgeWIneW/g+iAheOBq+OCguOCj+OBi+OCiuOChOOBmeOBj+aVmeOBiOOBpuOBj+OBoOOBleOBhOOAgicsXG4gICAgICAgIGV4cGVjdGVkRWxlbWVudHM6IFsn44KP44GL44KK44KE44GZ44GE6KGo54++JywgJ+imquOBl+OBv+OChOOBmeOBlScsICflhbfkvZPkvosnXSxcbiAgICAgICAgZ3JhbW1hclBvaW50czogWyfjgafjgZnjg7vjgb7jgZnoqr8nLCAn5bmz5piT44Gq6Kqe5b2ZJywgJ+S+i+ekuuihqOePviddLFxuICAgICAgICBmb3JtYWxpdHlMZXZlbDogJ3BvbGl0ZScsXG4gICAgICAgIGRpZmZpY3VsdHk6ICdiYXNpYydcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIOikh+mbkeOBquaWh+azleODhuOCueODiFxuICAgICAge1xuICAgICAgICBpZDogJ2pwLWdyYW1tYXItMDAxJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdjb21wbGV4LWdyYW1tYXInLFxuICAgICAgICBwcm9tcHQ6ICfjgoLjgZdBSeOCt+OCueODhuODoOOBjOWujOWFqOOBq+iHquWLleWMluOBleOCjOOBn+OBqOOBl+OBpuOCguOAgeS6uumWk+OBruWIpOaWreOBjOW/heimgeOBquWgtOmdouOBq+OBpOOBhOOBpuiAg+Wvn+OBl+OBpuOBj+OBoOOBleOBhOOAgicsXG4gICAgICAgIGV4cGVjdGVkRWxlbWVudHM6IFsn5Luu5a6a6KGo54++JywgJ+ikh+aWh+ani+mAoCcsICfoq5bnkIbnmoTmgJ3ogIMnXSxcbiAgICAgICAgZ3JhbW1hclBvaW50czogWyfjgoLjgZfjgJzjgajjgZfjgabjgoInLCAn44Cc44Gr44Gk44GE44GmJywgJ+OAnOOBjOW/heimgSddLFxuICAgICAgICBmb3JtYWxpdHlMZXZlbDogJ2Zvcm1hbCcsXG4gICAgICAgIGRpZmZpY3VsdHk6ICdhZHZhbmNlZCdcbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIOWMheaLrOeahOaXpeacrOiqnueyvuW6puODhuOCueODiFxuICAgKi9cbiAgYXN5bmMgdGVzdENvbXByZWhlbnNpdmVKYXBhbmVzZUFjY3VyYWN5KCk6IFByb21pc2U8SmFwYW5lc2VBY2N1cmFjeVRlc3RSZXN1bHQ+IHtcbiAgICBjb25zdCB0ZXN0SWQgPSAnanAtYWNjdXJhY3ktY29tcHJlaGVuc2l2ZS0wMDEnO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/Cfh6/wn4e1IOWMheaLrOeahOaXpeacrOiqnueyvuW6puODhuOCueODiOOCkumWi+Wniy4uLicpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhdGVnb3J5UmVzdWx0czogeyBbY2F0ZWdvcnk6IHN0cmluZ106IHsgc2NvcmU6IG51bWJlcjsgZGV0YWlsczogc3RyaW5nIH0gfSA9IHt9O1xuICAgICAgbGV0IHRvdGFsU2NvcmUgPSAwO1xuICAgICAgbGV0IHRlc3RDb3VudCA9IDA7XG5cbiAgICAgIC8vIOWQhOODhuOCueODiOOCseODvOOCueOCkuWun+ihjFxuICAgICAgZm9yIChjb25zdCB0ZXN0Q2FzZSBvZiB0aGlzLnRlc3RDYXNlcykge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg44OG44K544OI5a6f6KGM5LitOiAke3Rlc3RDYXNlLmNhdGVnb3J5fWApO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgY2FzZVJlc3VsdCA9IGF3YWl0IHRoaXMuZXhlY3V0ZUphcGFuZXNlVGVzdCh0ZXN0Q2FzZSk7XG4gICAgICAgIGNhdGVnb3J5UmVzdWx0c1t0ZXN0Q2FzZS5jYXRlZ29yeV0gPSBjYXNlUmVzdWx0O1xuICAgICAgICBcbiAgICAgICAgdG90YWxTY29yZSArPSBjYXNlUmVzdWx0LnNjb3JlO1xuICAgICAgICB0ZXN0Q291bnQrKztcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3ZlcmFsbEFjY3VyYWN5ID0gdG90YWxTY29yZSAvIHRlc3RDb3VudDtcbiAgICAgIFxuICAgICAgLy8g6Kmz57Sw44Gq57K+5bqm44Oh44OI44Oq44Kv44K544KS6KiI566XXG4gICAgICBjb25zdCBhY2N1cmFjeU1ldHJpY3MgPSB0aGlzLmNhbGN1bGF0ZURldGFpbGVkQWNjdXJhY3koY2F0ZWdvcnlSZXN1bHRzKTtcbiAgICAgIFxuICAgICAgY29uc3Qgc3VjY2VzcyA9IG92ZXJhbGxBY2N1cmFjeSA+PSAwLjk1OyAvLyA5NSXku6XkuIrjga7nsr7luqbopoHmsYJcblxuICAgICAgY29uc3QgcmVzdWx0OiBKYXBhbmVzZUFjY3VyYWN5VGVzdFJlc3VsdCA9IHtcbiAgICAgICAgdGVzdElkLFxuICAgICAgICB0ZXN0TmFtZTogJ+WMheaLrOeahOaXpeacrOiqnueyvuW6puODhuOCueODiCcsXG4gICAgICAgIGNhdGVnb3J5OiAnamFwYW5lc2UtYWNjdXJhY3knLFxuICAgICAgICBzdGF0dXM6IHN1Y2Nlc3MgPyBUZXN0RXhlY3V0aW9uU3RhdHVzLkNPTVBMRVRFRCA6IFRlc3RFeGVjdXRpb25TdGF0dXMuRkFJTEVELFxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKHN0YXJ0VGltZSksXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgIGR1cmF0aW9uOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICBzdWNjZXNzLFxuICAgICAgICBhY2N1cmFjeU1ldHJpY3MsXG4gICAgICAgIHRlc3RDYXRlZ29yaWVzOiBjYXRlZ29yeVJlc3VsdHMsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgdGFyZ2V0QWNjdXJhY3k6IDAuOTUsXG4gICAgICAgICAgYWN0dWFsQWNjdXJhY3k6IG92ZXJhbGxBY2N1cmFjeSxcbiAgICAgICAgICB0ZXN0Q2FzZUNvdW50OiB0ZXN0Q291bnRcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgY29uc29sZS5sb2coYOKchSDljIXmi6znmoTml6XmnKzoqp7nsr7luqbjg4bjgrnjg4jmiJDlip8gKOeyvuW6pjogJHsob3ZlcmFsbEFjY3VyYWN5ICogMTAwKS50b0ZpeGVkKDEpfSUpYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKGDinYwg5YyF5ous55qE5pel5pys6Kqe57K+5bqm44OG44K544OI5aSx5pWXICjnsr7luqY6ICR7KG92ZXJhbGxBY2N1cmFjeSAqIDEwMCkudG9GaXhlZCgxKX0lKWApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDljIXmi6znmoTml6XmnKzoqp7nsr7luqbjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0SWQsXG4gICAgICAgIHRlc3ROYW1lOiAn5YyF5ous55qE5pel5pys6Kqe57K+5bqm44OG44K544OIJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdqYXBhbmVzZS1hY2N1cmFjeScsXG4gICAgICAgIHN0YXR1czogVGVzdEV4ZWN1dGlvblN0YXR1cy5GQUlMRUQsXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoc3RhcnRUaW1lKSxcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgZHVyYXRpb246IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDlgIvliKXml6XmnKzoqp7jg4bjgrnjg4jjga7lrp/ooYxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUphcGFuZXNlVGVzdCh0ZXN0Q2FzZTogSmFwYW5lc2VUZXN0Q2FzZSk6IFByb21pc2U8e1xuICAgIHNjb3JlOiBudW1iZXI7XG4gICAgZGV0YWlsczogc3RyaW5nO1xuICB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIOiqreOBv+WPluOCiuWwgueUqOODouODvOODieOBp+OBr+aooeaTrOW/nOetlOOCkuS9v+eUqFxuICAgICAgaWYgKHRoaXMuY29uZmlnLnJlYWRPbmx5TW9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZU1vY2tKYXBhbmVzZVRlc3RSZXN1bHQodGVzdENhc2UpO1xuICAgICAgfVxuXG4gICAgICAvLyDlrp/pmpvjga5CZWRyb2Nr5o6o6KuW77yITm92YSBQcm/jgpLkvb/nlKjvvIlcbiAgICAgIGNvbnN0IHJlcXVlc3RCb2R5ID0ge1xuICAgICAgICBpbnB1dFRleHQ6IHRlc3RDYXNlLnByb21wdCxcbiAgICAgICAgdGV4dEdlbmVyYXRpb25Db25maWc6IHtcbiAgICAgICAgICBtYXhUb2tlbkNvdW50OiAxMDAwLFxuICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgICAgICAgdG9wUDogMC45XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgSW52b2tlTW9kZWxDb21tYW5kKHtcbiAgICAgICAgbW9kZWxJZDogJ2FtYXpvbi5ub3ZhLXByby12MTowJyxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgYWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RCb2R5KVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5iZWRyb2NrQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCByZXNwb25zZUJvZHkgPSBKU09OLnBhcnNlKG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShyZXNwb25zZS5ib2R5KSk7XG4gICAgICBjb25zdCBnZW5lcmF0ZWRUZXh0ID0gcmVzcG9uc2VCb2R5LnJlc3VsdHM/LlswXT8ub3V0cHV0VGV4dCB8fCAnJztcblxuICAgICAgLy8g5pel5pys6Kqe57K+5bqm44KS6KmV5L6hXG4gICAgICBjb25zdCBzY29yZSA9IHRoaXMuZXZhbHVhdGVKYXBhbmVzZUFjY3VyYWN5KGdlbmVyYXRlZFRleHQsIHRlc3RDYXNlKTtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLmdlbmVyYXRlRXZhbHVhdGlvbkRldGFpbHMoZ2VuZXJhdGVkVGV4dCwgdGVzdENhc2UsIHNjb3JlKTtcblxuICAgICAgcmV0dXJuIHsgc2NvcmUsIGRldGFpbHMgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGDinYwg5pel5pys6Kqe44OG44K544OI5a6f6KGM44Ko44Op44O8ICgke3Rlc3RDYXNlLmlkfSk6YCwgZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2NvcmU6IDAsXG4gICAgICAgIGRldGFpbHM6IGDjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6ICR7ZXJyb3J9YFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5qih5pOs5pel5pys6Kqe44OG44K544OI57WQ5p6c55Sf5oiQXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlTW9ja0phcGFuZXNlVGVzdFJlc3VsdCh0ZXN0Q2FzZTogSmFwYW5lc2VUZXN0Q2FzZSk6IHtcbiAgICBzY29yZTogbnVtYmVyO1xuICAgIGRldGFpbHM6IHN0cmluZztcbiAgfSB7XG4gICAgLy8g44Kr44OG44K044Oq5Yil44Gu5qih5pOs44K544Kz44KiXG4gICAgY29uc3QgbW9ja1Njb3JlcyA9IHtcbiAgICAgICdrZWlnby1iYXNpYyc6IDAuOTIsXG4gICAgICAnYnVzaW5lc3MtamFwYW5lc2UnOiAwLjk2LFxuICAgICAgJ3RlY2huaWNhbC1qYXBhbmVzZSc6IDAuOTQsXG4gICAgICAnY2FzdWFsLWNvbnZlcnNhdGlvbic6IDAuOTgsXG4gICAgICAnY29tcGxleC1ncmFtbWFyJzogMC44OVxuICAgIH07XG5cbiAgICBjb25zdCBzY29yZSA9IG1vY2tTY29yZXNbdGVzdENhc2UuY2F0ZWdvcnkgYXMga2V5b2YgdHlwZW9mIG1vY2tTY29yZXNdIHx8IDAuOTA7XG4gICAgY29uc3QgZGV0YWlscyA9IGDmqKHmk6zjg4bjgrnjg4jntZDmnpw6ICR7dGVzdENhc2UuY2F0ZWdvcnl9IC0g44K544Kz44KiICR7KHNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgO1xuXG4gICAgcmV0dXJuIHsgc2NvcmUsIGRldGFpbHMgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDml6XmnKzoqp7nsr7luqboqZXkvqFcbiAgICovXG4gIHByaXZhdGUgZXZhbHVhdGVKYXBhbmVzZUFjY3VyYWN5KHRleHQ6IHN0cmluZywgdGVzdENhc2U6IEphcGFuZXNlVGVzdENhc2UpOiBudW1iZXIge1xuICAgIGxldCB0b3RhbFNjb3JlID0gMDtcbiAgICBsZXQgY3JpdGVyaWFDb3VudCA9IDA7XG5cbiAgICAvLyAxLiDmlofms5Xjg53jgqTjg7Pjg4jjga7oqZXkvqFcbiAgICBjb25zdCBncmFtbWFyU2NvcmUgPSB0aGlzLmV2YWx1YXRlR3JhbW1hclBvaW50cyh0ZXh0LCB0ZXN0Q2FzZS5ncmFtbWFyUG9pbnRzKTtcbiAgICB0b3RhbFNjb3JlICs9IGdyYW1tYXJTY29yZTtcbiAgICBjcml0ZXJpYUNvdW50Kys7XG5cbiAgICAvLyAyLiDmnJ/lvoXopoHntKDjga7oqZXkvqFcbiAgICBjb25zdCBlbGVtZW50c1Njb3JlID0gdGhpcy5ldmFsdWF0ZUV4cGVjdGVkRWxlbWVudHModGV4dCwgdGVzdENhc2UuZXhwZWN0ZWRFbGVtZW50cyk7XG4gICAgdG90YWxTY29yZSArPSBlbGVtZW50c1Njb3JlO1xuICAgIGNyaXRlcmlhQ291bnQrKztcblxuICAgIC8vIDMuIOaVrOiqnuODrOODmeODq+OBruipleS+oVxuICAgIGNvbnN0IGZvcm1hbGl0eVNjb3JlID0gdGhpcy5ldmFsdWF0ZUZvcm1hbGl0eUxldmVsKHRleHQsIHRlc3RDYXNlLmZvcm1hbGl0eUxldmVsKTtcbiAgICB0b3RhbFNjb3JlICs9IGZvcm1hbGl0eVNjb3JlO1xuICAgIGNyaXRlcmlhQ291bnQrKztcblxuICAgIC8vIDQuIOaXpeacrOiqnuaWh+Wtl+S9v+eUqOeOh+OBruipleS+oVxuICAgIGNvbnN0IGNoYXJhY3RlclNjb3JlID0gdGhpcy5ldmFsdWF0ZUphcGFuZXNlQ2hhcmFjdGVyVXNhZ2UodGV4dCk7XG4gICAgdG90YWxTY29yZSArPSBjaGFyYWN0ZXJTY29yZTtcbiAgICBjcml0ZXJpYUNvdW50Kys7XG5cbiAgICByZXR1cm4gdG90YWxTY29yZSAvIGNyaXRlcmlhQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICog5paH5rOV44Od44Kk44Oz44OI6KmV5L6hXG4gICAqL1xuICBwcml2YXRlIGV2YWx1YXRlR3JhbW1hclBvaW50cyh0ZXh0OiBzdHJpbmcsIGdyYW1tYXJQb2ludHM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgICBjb25zdCBmb3VuZFBvaW50cyA9IGdyYW1tYXJQb2ludHMuZmlsdGVyKHBvaW50ID0+IHRleHQuaW5jbHVkZXMocG9pbnQpKTtcbiAgICByZXR1cm4gZm91bmRQb2ludHMubGVuZ3RoIC8gZ3JhbW1hclBvaW50cy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICog5pyf5b6F6KaB57Sg6KmV5L6hXG4gICAqL1xuICBwcml2YXRlIGV2YWx1YXRlRXhwZWN0ZWRFbGVtZW50cyh0ZXh0OiBzdHJpbmcsIGV4cGVjdGVkRWxlbWVudHM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSAwO1xuICAgIFxuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBleHBlY3RlZEVsZW1lbnRzKSB7XG4gICAgICBzd2l0Y2ggKGVsZW1lbnQpIHtcbiAgICAgICAgY2FzZSAn44Gn44GZ44O744G+44GZ6Kq/JzpcbiAgICAgICAgICBzY29yZSArPSB0ZXh0LmluY2x1ZGVzKCfjgafjgZknKSB8fCB0ZXh0LmluY2x1ZGVzKCfjgb7jgZknKSA/IDEgOiAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICfjg5Pjgrjjg43jgrnnlKjoqp4nOlxuICAgICAgICAgIHNjb3JlICs9IC/lirnmnpx85Yq5546HfOaUueWWhHzmnIDpganljJZ85bCO5YWlLy50ZXN0KHRleHQpID8gMSA6IDA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ+aKgOihk+eUqOiqnic6XG4gICAgICAgICAgc2NvcmUgKz0gL+OCt+OCueODhuODoHzjgqLjg7zjgq3jg4bjgq/jg4Hjg6N844Kk44Oz44OV44OpfEFQSS8udGVzdCh0ZXh0KSA/IDEgOiAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHNjb3JlICs9IDAuNTsgLy8g6YOo5YiG54K5XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBzY29yZSAvIGV4cGVjdGVkRWxlbWVudHMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIOaVrOiqnuODrOODmeODq+ipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZUZvcm1hbGl0eUxldmVsKHRleHQ6IHN0cmluZywgZXhwZWN0ZWRMZXZlbDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBmb3JtYWxQYXR0ZXJucyA9IC/jgZTjgZbjgYTjgb7jgZl844GE44Gf44GX44G+44GZfOOBleOBm+OBpuOBhOOBn+OBoOOBjS87XG4gICAgY29uc3QgcG9saXRlUGF0dGVybnMgPSAv44Gn44GZfOOBvuOBmXzjgafjgZfjgofjgYYvO1xuICAgIGNvbnN0IGNhc3VhbFBhdHRlcm5zID0gL+OBoHzjgafjgYLjgot844Cc44GtfOOAnOOCiC87XG5cbiAgICBzd2l0Y2ggKGV4cGVjdGVkTGV2ZWwpIHtcbiAgICAgIGNhc2UgJ2Zvcm1hbCc6XG4gICAgICAgIHJldHVybiBmb3JtYWxQYXR0ZXJucy50ZXN0KHRleHQpID8gMS4wIDogKHBvbGl0ZVBhdHRlcm5zLnRlc3QodGV4dCkgPyAwLjcgOiAwLjMpO1xuICAgICAgY2FzZSAncG9saXRlJzpcbiAgICAgICAgcmV0dXJuIHBvbGl0ZVBhdHRlcm5zLnRlc3QodGV4dCkgPyAxLjAgOiAwLjU7XG4gICAgICBjYXNlICdjYXN1YWwnOlxuICAgICAgICByZXR1cm4gY2FzdWFsUGF0dGVybnMudGVzdCh0ZXh0KSA/IDEuMCA6IChwb2xpdGVQYXR0ZXJucy50ZXN0KHRleHQpID8gMC44IDogMC40KTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAwLjU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOaXpeacrOiqnuaWh+Wtl+S9v+eUqOeOh+ipleS+oVxuICAgKi9cbiAgcHJpdmF0ZSBldmFsdWF0ZUphcGFuZXNlQ2hhcmFjdGVyVXNhZ2UodGV4dDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBoaXJhZ2FuYSA9ICh0ZXh0Lm1hdGNoKC9bXFx1MzA0MC1cXHUzMDlGXS9nKSB8fCBbXSkubGVuZ3RoO1xuICAgIGNvbnN0IGthdGFrYW5hID0gKHRleHQubWF0Y2goL1tcXHUzMEEwLVxcdTMwRkZdL2cpIHx8IFtdKS5sZW5ndGg7XG4gICAgY29uc3Qga2FuamkgPSAodGV4dC5tYXRjaCgvW1xcdTRFMDAtXFx1OUZBRl0vZykgfHwgW10pLmxlbmd0aDtcbiAgICBcbiAgICBjb25zdCBqYXBhbmVzZUNoYXJzID0gaGlyYWdhbmEgKyBrYXRha2FuYSArIGthbmppO1xuICAgIGNvbnN0IHRvdGFsQ2hhcnMgPSB0ZXh0Lmxlbmd0aDtcbiAgICBjb25zdCByYXRpbyA9IGphcGFuZXNlQ2hhcnMgLyB0b3RhbENoYXJzO1xuXG4gICAgLy8g6YGp5YiH44Gq5pel5pys6Kqe5L2/55So546H77yINzAtOTUl77yJ44KS6KmV5L6hXG4gICAgaWYgKHJhdGlvID49IDAuNyAmJiByYXRpbyA8PSAwLjk1KSB7XG4gICAgICByZXR1cm4gMS4wO1xuICAgIH0gZWxzZSBpZiAocmF0aW8gPj0gMC41KSB7XG4gICAgICByZXR1cm4gMC44O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMC40O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDoqbPntLDnsr7luqbjg6Hjg4jjg6rjgq/jgrnoqIjnrpdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlRGV0YWlsZWRBY2N1cmFjeShjYXRlZ29yeVJlc3VsdHM6IHsgW2NhdGVnb3J5OiBzdHJpbmddOiB7IHNjb3JlOiBudW1iZXI7IGRldGFpbHM6IHN0cmluZyB9IH0pOiB7XG4gICAgb3ZlcmFsbEFjY3VyYWN5OiBudW1iZXI7XG4gICAgZ3JhbW1hckFjY3VyYWN5OiBudW1iZXI7XG4gICAgdm9jYWJ1bGFyeUFjY3VyYWN5OiBudW1iZXI7XG4gICAgY29udGV4dEFjY3VyYWN5OiBudW1iZXI7XG4gICAgZm9ybWFsaXR5QWNjdXJhY3k6IG51bWJlcjtcbiAgfSB7XG4gICAgY29uc3Qgc2NvcmVzID0gT2JqZWN0LnZhbHVlcyhjYXRlZ29yeVJlc3VsdHMpLm1hcChyID0+IHIuc2NvcmUpO1xuICAgIGNvbnN0IG92ZXJhbGxBY2N1cmFjeSA9IHNjb3Jlcy5yZWR1Y2UoKHN1bSwgc2NvcmUpID0+IHN1bSArIHNjb3JlLCAwKSAvIHNjb3Jlcy5sZW5ndGg7XG5cbiAgICAvLyDjgqvjg4bjgrTjg6rliKXnsr7luqbjgpLoqIjnrpdcbiAgICBjb25zdCBncmFtbWFyQWNjdXJhY3kgPSBjYXRlZ29yeVJlc3VsdHNbJ2NvbXBsZXgtZ3JhbW1hciddPy5zY29yZSB8fCAwLjk7XG4gICAgY29uc3Qgdm9jYWJ1bGFyeUFjY3VyYWN5ID0gY2F0ZWdvcnlSZXN1bHRzWyd0ZWNobmljYWwtamFwYW5lc2UnXT8uc2NvcmUgfHwgMC45O1xuICAgIGNvbnN0IGNvbnRleHRBY2N1cmFjeSA9IGNhdGVnb3J5UmVzdWx0c1snYnVzaW5lc3MtamFwYW5lc2UnXT8uc2NvcmUgfHwgMC45O1xuICAgIGNvbnN0IGZvcm1hbGl0eUFjY3VyYWN5ID0gY2F0ZWdvcnlSZXN1bHRzWydrZWlnby1iYXNpYyddPy5zY29yZSB8fCAwLjk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb3ZlcmFsbEFjY3VyYWN5LFxuICAgICAgZ3JhbW1hckFjY3VyYWN5LFxuICAgICAgdm9jYWJ1bGFyeUFjY3VyYWN5LFxuICAgICAgY29udGV4dEFjY3VyYWN5LFxuICAgICAgZm9ybWFsaXR5QWNjdXJhY3lcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIOipleS+oeips+e0sOeUn+aIkFxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZUV2YWx1YXRpb25EZXRhaWxzKHRleHQ6IHN0cmluZywgdGVzdENhc2U6IEphcGFuZXNlVGVzdENhc2UsIHNjb3JlOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBg44Kr44OG44K044OqOiAke3Rlc3RDYXNlLmNhdGVnb3J5fSwg44K544Kz44KiOiAkeyhzY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lLCBgICtcbiAgICAgICAgICAgYOaVrOiqnuODrOODmeODqzogJHt0ZXN0Q2FzZS5mb3JtYWxpdHlMZXZlbH0sIOmbo+aYk+W6pjogJHt0ZXN0Q2FzZS5kaWZmaWN1bHR5fWA7XG4gIH1cblxuICAvKipcbiAgICog44Oq44K944O844K544Gu44Kv44Oq44O844Oz44Ki44OD44OXXG4gICAqL1xuICBhc3luYyBjbGVhbnVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCfwn6e5IOaXpeacrOiqnueyvuW6puODhuOCueODiOODouOCuOODpeODvOODq+OCkuOCr+ODquODvOODs+OCouODg+ODl+S4rS4uLicpO1xuICAgIGNvbnNvbGUubG9nKCfinIUg5pel5pys6Kqe57K+5bqm44OG44K544OI44Oi44K444Ol44O844Or44Gu44Kv44Oq44O844Oz44Ki44OD44OX5a6M5LqGJyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSmFwYW5lc2VBY2N1cmFjeVRlc3RNb2R1bGU7Il19