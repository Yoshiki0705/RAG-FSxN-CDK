/**
 * チャットボット機能テスト設定
 *
 * 実本番環境でのチャットボット機能テストに関する設定を管理
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * チャットボットテスト設定インターフェース
 */
export interface ChatbotTestConfig {
    execution: {
        timeout: number;
        retryCount: number;
        maxConcurrency: number;
        failFast: boolean;
    };
    models: {
        primaryModel: string;
        fallbackModel: string;
        streamingModel: string;
        complexQuestionModel: string;
    };
    qualityThresholds: {
        japaneseQuality: number;
        responseTime: number;
        ragRelevance: number;
        streamingConsistency: number;
    };
    testQuestions: {
        enabledCategories: string[];
        maxQuestionsPerCategory: number;
        includeComplexQuestions: boolean;
    };
    rag: {
        maxDocuments: number;
        relevanceThreshold: number;
        enableCitationCheck: boolean;
        documentContextLength: number;
    };
    streaming: {
        enableStreamingTests: boolean;
        maxChunkSize: number;
        timeoutPerChunk: number;
        errorTolerance: number;
    };
    reporting: {
        generateDetailedReport: boolean;
        includeResponseText: boolean;
        includePerformanceMetrics: boolean;
        saveToFile: boolean;
    };
}
/**
 * デフォルトチャットボットテスト設定
 */
export declare const defaultChatbotTestConfig: ChatbotTestConfig;
/**
 * 本番環境用チャットボットテスト設定
 */
export declare const productionChatbotTestConfig: ChatbotTestConfig;
/**
 * 開発環境用チャットボットテスト設定
 */
export declare const developmentChatbotTestConfig: ChatbotTestConfig;
/**
 * 環境に応じた設定の取得
 */
export declare function getChatbotTestConfig(environment: string): ChatbotTestConfig;
/**
 * Bedrockモデル定義
 */
export declare const BEDROCK_MODELS: {
    readonly CLAUDE_3_HAIKU: "anthropic.claude-3-haiku-20240307-v1:0";
    readonly CLAUDE_3_SONNET: "anthropic.claude-3-sonnet-20240229-v1:0";
    readonly CLAUDE_3_OPUS: "anthropic.claude-3-opus-20240229-v1:0";
};
/**
 * テスト質問カテゴリ定義
 */
export declare const TEST_QUESTION_CATEGORIES: {
    readonly GENERAL: "general";
    readonly DOCUMENT_BASED: "document-based";
    readonly TECHNICAL: "technical";
    readonly CONVERSATIONAL: "conversational";
};
/**
 * 日本語品質評価基準
 */
export declare const JAPANESE_QUALITY_CRITERIA: {
    readonly GRAMMAR_WEIGHT: 0.25;
    readonly NATURALNESS_WEIGHT: 0.25;
    readonly POLITENESS_WEIGHT: 0.2;
    readonly CLARITY_WEIGHT: 0.15;
    readonly COMPLETENESS_WEIGHT: 0.15;
};
/**
 * RAG評価基準
 */
export declare const RAG_EVALUATION_CRITERIA: {
    readonly DOCUMENT_RELEVANCE_WEIGHT: 0.4;
    readonly CITATION_ACCURACY_WEIGHT: 0.3;
    readonly CONTENT_INTEGRATION_WEIGHT: 0.3;
};
/**
 * ストリーミング品質基準
 */
export declare const STREAMING_QUALITY_CRITERIA: {
    readonly CONSISTENCY_WEIGHT: 0.4;
    readonly SMOOTHNESS_WEIGHT: 0.3;
    readonly COMPLETENESS_WEIGHT: 0.3;
    readonly MAX_ERROR_RATE: 0.1;
    readonly MIN_CHUNK_SIZE: 10;
    readonly MAX_CHUNK_SIZE: 200;
};
/**
 * エラーハンドリングシナリオ定義
 */
export declare const ERROR_HANDLING_SCENARIOS: {
    readonly INAPPROPRIATE_CONTENT: {
        readonly type: "inappropriate_content";
        readonly expectedBehavior: "polite_refusal";
        readonly keywords: readonly ["申し訳", "恐れ入り", "お答えできません", "提供できません"];
    };
    readonly AMBIGUOUS_QUESTION: {
        readonly type: "ambiguous_question";
        readonly expectedBehavior: "clarification_request";
        readonly keywords: readonly ["詳しく", "具体的に", "どの", "何について", "明確に"];
    };
    readonly OUT_OF_SCOPE: {
        readonly type: "out_of_scope";
        readonly expectedBehavior: "scope_explanation";
        readonly keywords: readonly ["専門", "範囲", "対象", "システム", "文書"];
    };
};
/**
 * パフォーマンス評価基準
 */
export declare const PERFORMANCE_BENCHMARKS: {
    readonly RESPONSE_TIME: {
        readonly EXCELLENT: 3000;
        readonly GOOD: 5000;
        readonly ACCEPTABLE: 8000;
        readonly POOR: 10000;
    };
    readonly THROUGHPUT: {
        readonly MIN_TOKENS_PER_SECOND: 10;
        readonly TARGET_TOKENS_PER_SECOND: 50;
        readonly EXCELLENT_TOKENS_PER_SECOND: 100;
    };
    readonly ERROR_RATES: {
        readonly EXCELLENT: 0.01;
        readonly GOOD: 0.05;
        readonly ACCEPTABLE: 0.1;
        readonly POOR: 0.2;
    };
};
/**
 * チャットボットテスト結果の評価基準
 */
export declare const CHATBOT_EVALUATION_CRITERIA: {
    OVERALL_QUALITY_WEIGHTS: {
        JAPANESE_QUALITY: number;
        RAG_EFFECTIVENESS: number;
        RESPONSE_TIME: number;
        STREAMING_QUALITY: number;
        ERROR_HANDLING: number;
    };
    SUCCESS_RATE_THRESHOLDS: {
        EXCELLENT: number;
        GOOD: number;
        ACCEPTABLE: number;
        NEEDS_IMPROVEMENT: number;
    };
    QUALITY_SCORE_THRESHOLDS: {
        EXCELLENT: number;
        GOOD: number;
        ACCEPTABLE: number;
        CRITICAL: number;
    };
};
declare const _default: {
    defaultChatbotTestConfig: ChatbotTestConfig;
    productionChatbotTestConfig: ChatbotTestConfig;
    developmentChatbotTestConfig: ChatbotTestConfig;
    getChatbotTestConfig: typeof getChatbotTestConfig;
    BEDROCK_MODELS: {
        readonly CLAUDE_3_HAIKU: "anthropic.claude-3-haiku-20240307-v1:0";
        readonly CLAUDE_3_SONNET: "anthropic.claude-3-sonnet-20240229-v1:0";
        readonly CLAUDE_3_OPUS: "anthropic.claude-3-opus-20240229-v1:0";
    };
    TEST_QUESTION_CATEGORIES: {
        readonly GENERAL: "general";
        readonly DOCUMENT_BASED: "document-based";
        readonly TECHNICAL: "technical";
        readonly CONVERSATIONAL: "conversational";
    };
    JAPANESE_QUALITY_CRITERIA: {
        readonly GRAMMAR_WEIGHT: 0.25;
        readonly NATURALNESS_WEIGHT: 0.25;
        readonly POLITENESS_WEIGHT: 0.2;
        readonly CLARITY_WEIGHT: 0.15;
        readonly COMPLETENESS_WEIGHT: 0.15;
    };
    RAG_EVALUATION_CRITERIA: {
        readonly DOCUMENT_RELEVANCE_WEIGHT: 0.4;
        readonly CITATION_ACCURACY_WEIGHT: 0.3;
        readonly CONTENT_INTEGRATION_WEIGHT: 0.3;
    };
    STREAMING_QUALITY_CRITERIA: {
        readonly CONSISTENCY_WEIGHT: 0.4;
        readonly SMOOTHNESS_WEIGHT: 0.3;
        readonly COMPLETENESS_WEIGHT: 0.3;
        readonly MAX_ERROR_RATE: 0.1;
        readonly MIN_CHUNK_SIZE: 10;
        readonly MAX_CHUNK_SIZE: 200;
    };
    ERROR_HANDLING_SCENARIOS: {
        readonly INAPPROPRIATE_CONTENT: {
            readonly type: "inappropriate_content";
            readonly expectedBehavior: "polite_refusal";
            readonly keywords: readonly ["申し訳", "恐れ入り", "お答えできません", "提供できません"];
        };
        readonly AMBIGUOUS_QUESTION: {
            readonly type: "ambiguous_question";
            readonly expectedBehavior: "clarification_request";
            readonly keywords: readonly ["詳しく", "具体的に", "どの", "何について", "明確に"];
        };
        readonly OUT_OF_SCOPE: {
            readonly type: "out_of_scope";
            readonly expectedBehavior: "scope_explanation";
            readonly keywords: readonly ["専門", "範囲", "対象", "システム", "文書"];
        };
    };
    PERFORMANCE_BENCHMARKS: {
        readonly RESPONSE_TIME: {
            readonly EXCELLENT: 3000;
            readonly GOOD: 5000;
            readonly ACCEPTABLE: 8000;
            readonly POOR: 10000;
        };
        readonly THROUGHPUT: {
            readonly MIN_TOKENS_PER_SECOND: 10;
            readonly TARGET_TOKENS_PER_SECOND: 50;
            readonly EXCELLENT_TOKENS_PER_SECOND: 100;
        };
        readonly ERROR_RATES: {
            readonly EXCELLENT: 0.01;
            readonly GOOD: 0.05;
            readonly ACCEPTABLE: 0.1;
            readonly POOR: 0.2;
        };
    };
    CHATBOT_EVALUATION_CRITERIA: {
        OVERALL_QUALITY_WEIGHTS: {
            JAPANESE_QUALITY: number;
            RAG_EFFECTIVENESS: number;
            RESPONSE_TIME: number;
            STREAMING_QUALITY: number;
            ERROR_HANDLING: number;
        };
        SUCCESS_RATE_THRESHOLDS: {
            EXCELLENT: number;
            GOOD: number;
            ACCEPTABLE: number;
            NEEDS_IMPROVEMENT: number;
        };
        QUALITY_SCORE_THRESHOLDS: {
            EXCELLENT: number;
            GOOD: number;
            ACCEPTABLE: number;
            CRITICAL: number;
        };
    };
};
export default _default;
