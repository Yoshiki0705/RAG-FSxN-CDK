"use strict";
/**
 * チャットボット機能テストモジュール統合エクスポート
 *
 * 実本番Amazon Bedrockでのチャットボット機能テスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_QUALITY_THRESHOLDS = exports.CHATBOT_TEST_PRIORITIES = exports.CHATBOT_TEST_CATEGORIES = exports.CHATBOT_EVALUATION_CRITERIA = exports.PERFORMANCE_BENCHMARKS = exports.ERROR_HANDLING_SCENARIOS = exports.STREAMING_QUALITY_CRITERIA = exports.RAG_EVALUATION_CRITERIA = exports.JAPANESE_QUALITY_CRITERIA = exports.TEST_QUESTION_CATEGORIES = exports.BEDROCK_MODELS = exports.getChatbotTestConfig = exports.ChatbotTestRunner = exports.ChatbotTestModule = void 0;
var chatbot_test_module_1 = require("./chatbot-test-module");
Object.defineProperty(exports, "ChatbotTestModule", { enumerable: true, get: function () { return __importDefault(chatbot_test_module_1).default; } });
var chatbot_test_runner_1 = require("./chatbot-test-runner");
Object.defineProperty(exports, "ChatbotTestRunner", { enumerable: true, get: function () { return __importDefault(chatbot_test_runner_1).default; } });
var chatbot_config_1 = require("./chatbot-config");
Object.defineProperty(exports, "getChatbotTestConfig", { enumerable: true, get: function () { return chatbot_config_1.getChatbotTestConfig; } });
Object.defineProperty(exports, "BEDROCK_MODELS", { enumerable: true, get: function () { return chatbot_config_1.BEDROCK_MODELS; } });
Object.defineProperty(exports, "TEST_QUESTION_CATEGORIES", { enumerable: true, get: function () { return chatbot_config_1.TEST_QUESTION_CATEGORIES; } });
Object.defineProperty(exports, "JAPANESE_QUALITY_CRITERIA", { enumerable: true, get: function () { return chatbot_config_1.JAPANESE_QUALITY_CRITERIA; } });
Object.defineProperty(exports, "RAG_EVALUATION_CRITERIA", { enumerable: true, get: function () { return chatbot_config_1.RAG_EVALUATION_CRITERIA; } });
Object.defineProperty(exports, "STREAMING_QUALITY_CRITERIA", { enumerable: true, get: function () { return chatbot_config_1.STREAMING_QUALITY_CRITERIA; } });
Object.defineProperty(exports, "ERROR_HANDLING_SCENARIOS", { enumerable: true, get: function () { return chatbot_config_1.ERROR_HANDLING_SCENARIOS; } });
Object.defineProperty(exports, "PERFORMANCE_BENCHMARKS", { enumerable: true, get: function () { return chatbot_config_1.PERFORMANCE_BENCHMARKS; } });
Object.defineProperty(exports, "CHATBOT_EVALUATION_CRITERIA", { enumerable: true, get: function () { return chatbot_config_1.CHATBOT_EVALUATION_CRITERIA; } });
// テストカテゴリの定義
exports.CHATBOT_TEST_CATEGORIES = {
    JAPANESE_QUALITY: 'japanese-quality',
    DOCUMENT_BASED: 'document-based',
    STREAMING: 'streaming',
    ERROR_HANDLING: 'error-handling',
    COMPLEX_QUESTIONS: 'complex-questions'
};
// テスト重要度の定義
exports.CHATBOT_TEST_PRIORITIES = {
    CRITICAL: 'critical', // 基本的な日本語応答
    HIGH: 'high', // 文書ベース応答
    MEDIUM: 'medium', // ストリーミング機能
    LOW: 'low' // 複雑な質問対応
};
// AI品質スコア閾値
exports.AI_QUALITY_THRESHOLDS = {
    EXCELLENT: 0.9,
    GOOD: 0.75,
    ACCEPTABLE: 0.6,
    NEEDS_IMPROVEMENT: 0.4
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7R0FPRzs7Ozs7O0FBRUgsNkRBQXFFO0FBQTVELHlJQUFBLE9BQU8sT0FBcUI7QUFDckMsNkRBQXFFO0FBQTVELHlJQUFBLE9BQU8sT0FBcUI7QUFZckMsbURBVTBCO0FBVHhCLHNIQUFBLG9CQUFvQixPQUFBO0FBQ3BCLGdIQUFBLGNBQWMsT0FBQTtBQUNkLDBIQUFBLHdCQUF3QixPQUFBO0FBQ3hCLDJIQUFBLHlCQUF5QixPQUFBO0FBQ3pCLHlIQUFBLHVCQUF1QixPQUFBO0FBQ3ZCLDRIQUFBLDBCQUEwQixPQUFBO0FBQzFCLDBIQUFBLHdCQUF3QixPQUFBO0FBQ3hCLHdIQUFBLHNCQUFzQixPQUFBO0FBQ3RCLDZIQUFBLDJCQUEyQixPQUFBO0FBRzdCLGFBQWE7QUFDQSxRQUFBLHVCQUF1QixHQUFHO0lBQ3JDLGdCQUFnQixFQUFFLGtCQUFrQjtJQUNwQyxjQUFjLEVBQUUsZ0JBQWdCO0lBQ2hDLFNBQVMsRUFBRSxXQUFXO0lBQ3RCLGNBQWMsRUFBRSxnQkFBZ0I7SUFDaEMsaUJBQWlCLEVBQUUsbUJBQW1CO0NBQzlCLENBQUM7QUFFWCxZQUFZO0FBQ0MsUUFBQSx1QkFBdUIsR0FBRztJQUNyQyxRQUFRLEVBQUUsVUFBVSxFQUFLLFlBQVk7SUFDckMsSUFBSSxFQUFFLE1BQU0sRUFBWSxVQUFVO0lBQ2xDLE1BQU0sRUFBRSxRQUFRLEVBQVEsWUFBWTtJQUNwQyxHQUFHLEVBQUUsS0FBSyxDQUFjLFVBQVU7Q0FDMUIsQ0FBQztBQUVYLFlBQVk7QUFDQyxRQUFBLHFCQUFxQixHQUFHO0lBQ25DLFNBQVMsRUFBRSxHQUFHO0lBQ2QsSUFBSSxFQUFFLElBQUk7SUFDVixVQUFVLEVBQUUsR0FBRztJQUNmLGlCQUFpQixFQUFFLEdBQUc7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73jg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vntbHlkIjjgqjjgq/jgrnjg53jg7zjg4hcbiAqIFxuICog5a6f5pys55WqQW1hem9uIEJlZHJvY2vjgafjga7jg4Hjg6Pjg4Pjg4jjg5zjg4Pjg4jmqZ/og73jg4bjgrnjg4hcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgQ2hhdGJvdFRlc3RNb2R1bGUgfSBmcm9tICcuL2NoYXRib3QtdGVzdC1tb2R1bGUnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBDaGF0Ym90VGVzdFJ1bm5lciB9IGZyb20gJy4vY2hhdGJvdC10ZXN0LXJ1bm5lcic7XG5cbmV4cG9ydCB0eXBlIHtcbiAgQ2hhdGJvdFRlc3RSZXN1bHQsXG4gIFRlc3RRdWVzdGlvbixcbiAgSmFwYW5lc2VRdWFsaXR5TWV0cmljc1xufSBmcm9tICcuL2NoYXRib3QtdGVzdC1tb2R1bGUnO1xuXG5leHBvcnQgdHlwZSB7XG4gIENoYXRib3RUZXN0Q29uZmlnXG59IGZyb20gJy4vY2hhdGJvdC1jb25maWcnO1xuXG5leHBvcnQge1xuICBnZXRDaGF0Ym90VGVzdENvbmZpZyxcbiAgQkVEUk9DS19NT0RFTFMsXG4gIFRFU1RfUVVFU1RJT05fQ0FURUdPUklFUyxcbiAgSkFQQU5FU0VfUVVBTElUWV9DUklURVJJQSxcbiAgUkFHX0VWQUxVQVRJT05fQ1JJVEVSSUEsXG4gIFNUUkVBTUlOR19RVUFMSVRZX0NSSVRFUklBLFxuICBFUlJPUl9IQU5ETElOR19TQ0VOQVJJT1MsXG4gIFBFUkZPUk1BTkNFX0JFTkNITUFSS1MsXG4gIENIQVRCT1RfRVZBTFVBVElPTl9DUklURVJJQVxufSBmcm9tICcuL2NoYXRib3QtY29uZmlnJztcblxuLy8g44OG44K544OI44Kr44OG44K044Oq44Gu5a6a576pXG5leHBvcnQgY29uc3QgQ0hBVEJPVF9URVNUX0NBVEVHT1JJRVMgPSB7XG4gIEpBUEFORVNFX1FVQUxJVFk6ICdqYXBhbmVzZS1xdWFsaXR5JyxcbiAgRE9DVU1FTlRfQkFTRUQ6ICdkb2N1bWVudC1iYXNlZCcsXG4gIFNUUkVBTUlORzogJ3N0cmVhbWluZycsXG4gIEVSUk9SX0hBTkRMSU5HOiAnZXJyb3ItaGFuZGxpbmcnLFxuICBDT01QTEVYX1FVRVNUSU9OUzogJ2NvbXBsZXgtcXVlc3Rpb25zJ1xufSBhcyBjb25zdDtcblxuLy8g44OG44K544OI6YeN6KaB5bqm44Gu5a6a576pXG5leHBvcnQgY29uc3QgQ0hBVEJPVF9URVNUX1BSSU9SSVRJRVMgPSB7XG4gIENSSVRJQ0FMOiAnY3JpdGljYWwnLCAgICAvLyDln7rmnKznmoTjgarml6XmnKzoqp7lv5znrZRcbiAgSElHSDogJ2hpZ2gnLCAgICAgICAgICAgLy8g5paH5pu444OZ44O844K55b+c562UXG4gIE1FRElVTTogJ21lZGl1bScsICAgICAgIC8vIOOCueODiOODquODvOODn+ODs+OCsOapn+iDvVxuICBMT1c6ICdsb3cnICAgICAgICAgICAgICAvLyDopIfpm5Hjgaros6rllY/lr77lv5xcbn0gYXMgY29uc3Q7XG5cbi8vIEFJ5ZOB6LOq44K544Kz44Ki6Za+5YCkXG5leHBvcnQgY29uc3QgQUlfUVVBTElUWV9USFJFU0hPTERTID0ge1xuICBFWENFTExFTlQ6IDAuOSxcbiAgR09PRDogMC43NSxcbiAgQUNDRVBUQUJMRTogMC42LFxuICBORUVEU19JTVBST1ZFTUVOVDogMC40XG59IGFzIGNvbnN0OyJdfQ==