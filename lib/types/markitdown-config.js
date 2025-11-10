"use strict";
/**
 * Markitdown設定型定義
 * Microsoft Markitdownライブラリ統合用の設定インターフェース
 *
 * @version 1.0.0
 * @author Permission-aware RAG System Team
 * @since 2024-10-19
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENVIRONMENT_DEFAULTS = exports.DEFAULT_MARKITDOWN_CONFIG = exports.MarkitdownErrorCode = exports.FILE_SIZE_LIMITS = exports.FILE_FORMAT_CATEGORIES = exports.PROCESSING_STRATEGY_INFO = void 0;
exports.validateMarkitdownConfig = validateMarkitdownConfig;
exports.isFormatEnabled = isFormatEnabled;
exports.isFileSizeValid = isFileSizeValid;
exports.shouldUseMarkitdown = shouldUseMarkitdown;
exports.shouldUseLangChain = shouldUseLangChain;
exports.getProcessingOrder = getProcessingOrder;
exports.shouldPerformQualityComparison = shouldPerformQualityComparison;
exports.extractEmbeddingInfo = extractEmbeddingInfo;
exports.generateFormatConfigFromStrategy = generateFormatConfigFromStrategy;
exports.getRecommendedStrategy = getRecommendedStrategy;
exports.normalizeFormatConfig = normalizeFormatConfig;
/**
 * 処理戦略の詳細情報
 */
exports.PROCESSING_STRATEGY_INFO = {
    'markitdown-only': {
        description: 'Markitdownライブラリのみを使用した変換',
        useMarkitdown: true,
        useLangChain: false,
        requiresComparison: false,
        priority: 1
    },
    'langchain-only': {
        description: 'LangChainローダーのみを使用した変換',
        useMarkitdown: false,
        useLangChain: true,
        requiresComparison: false,
        priority: 1
    },
    'markitdown-first': {
        description: 'Markitdown優先、失敗時LangChainフォールバック',
        useMarkitdown: true,
        useLangChain: true,
        requiresComparison: false,
        priority: 2
    },
    'langchain-first': {
        description: 'LangChain優先、失敗時Markitdownフォールバック',
        useMarkitdown: true,
        useLangChain: true,
        requiresComparison: false,
        priority: 2
    },
    'both-compare': {
        description: '両方実行して品質比較による最適選択',
        useMarkitdown: true,
        useLangChain: true,
        requiresComparison: true,
        priority: 3
    },
    'auto-select': {
        description: 'ファイル特性に基づく自動選択',
        useMarkitdown: true,
        useLangChain: true,
        requiresComparison: false,
        priority: 4
    }
};
/**
 * ファイル形式のカテゴリ分類
 */
exports.FILE_FORMAT_CATEGORIES = {
    OFFICE: ['docx', 'xlsx', 'pptx'],
    DOCUMENT: ['pdf', 'html', 'xml'],
    IMAGE: ['png', 'jpg', 'jpeg', 'gif'],
    DATA: ['csv', 'tsv']
};
/**
 * ファイル形式の最大サイズ制限（バイト）
 */
exports.FILE_SIZE_LIMITS = {
    docx: 50 * 1024 * 1024, // 50MB
    xlsx: 100 * 1024 * 1024, // 100MB
    pptx: 200 * 1024 * 1024, // 200MB
    pdf: 100 * 1024 * 1024, // 100MB
    png: 20 * 1024 * 1024, // 20MB
    jpg: 20 * 1024 * 1024, // 20MB
    jpeg: 20 * 1024 * 1024, // 20MB
    gif: 10 * 1024 * 1024, // 10MB
    html: 5 * 1024 * 1024, // 5MB
    xml: 5 * 1024 * 1024, // 5MB
    csv: 50 * 1024 * 1024, // 50MB
    tsv: 50 * 1024 * 1024 // 50MB
};
/**
 * エラーコードの定義
 */
var MarkitdownErrorCode;
(function (MarkitdownErrorCode) {
    MarkitdownErrorCode["CONVERSION_FAILED"] = "CONVERSION_FAILED";
    MarkitdownErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    MarkitdownErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
    MarkitdownErrorCode["UNSUPPORTED_FORMAT"] = "UNSUPPORTED_FORMAT";
    MarkitdownErrorCode["SECURITY_VIOLATION"] = "SECURITY_VIOLATION";
    MarkitdownErrorCode["MEMORY_LIMIT_EXCEEDED"] = "MEMORY_LIMIT_EXCEEDED";
    MarkitdownErrorCode["OCR_FAILED"] = "OCR_FAILED";
    MarkitdownErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
})(MarkitdownErrorCode || (exports.MarkitdownErrorCode = MarkitdownErrorCode = {}));
/**
 * 設定値の検証関数
 */
function validateMarkitdownConfig(config) {
    const errors = [];
    // 基本設定の検証
    if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
        errors.push('enabled設定はboolean型である必要があります');
    }
    // サポートファイル形式の検証
    if (config.supportedFormats) {
        for (const [format, formatConfig] of Object.entries(config.supportedFormats)) {
            const formatErrors = validateFormatConfig(format, formatConfig);
            errors.push(...formatErrors);
        }
    }
    // パフォーマンス設定の検証
    if (config.performance) {
        if (config.performance.maxFileSizeBytes && config.performance.maxFileSizeBytes > 500 * 1024 * 1024) {
            errors.push('最大ファイルサイズは500MBを超えることはできません');
        }
        if (config.performance.memoryLimitMB && config.performance.memoryLimitMB > 3008) {
            errors.push('メモリ制限はLambdaの最大値3008MBを超えることはできません');
        }
        if (config.performance.maxConcurrentProcesses && config.performance.maxConcurrentProcesses > 10) {
            errors.push('最大同時処理数は10を超えることはできません');
        }
        if (config.performance.maxConcurrentProcesses && config.performance.maxConcurrentProcesses < 1) {
            errors.push('最大同時処理数は1以上である必要があります');
        }
    }
    // セキュリティ設定の検証
    if (config.security?.tempFileRetentionMinutes && config.security.tempFileRetentionMinutes > 1440) {
        errors.push('一時ファイル保持時間は24時間（1440分）を超えることはできません');
    }
    return errors;
}
/**
 * ファイル形式設定の検証
 */
function validateFormatConfig(format, formatConfig) {
    const errors = [];
    // 基本設定の検証
    if (typeof formatConfig.enabled !== 'boolean') {
        errors.push(`${format}: enabled設定はboolean型である必要があります`);
    }
    if (typeof formatConfig.timeout !== 'number' || formatConfig.timeout <= 0) {
        errors.push(`${format}: timeout設定は正の数値である必要があります`);
    }
    if (formatConfig.timeout > 900) { // Lambda最大実行時間
        errors.push(`${format}: timeout設定は900秒を超えることはできません`);
    }
    // 処理戦略の整合性検証
    const strategyInfo = exports.PROCESSING_STRATEGY_INFO[formatConfig.processingStrategy];
    if (!strategyInfo) {
        errors.push(`${format}: 無効な処理戦略が指定されています: ${formatConfig.processingStrategy}`);
        return errors;
    }
    // useMarkitdown/useLangChainと処理戦略の整合性チェック
    if (formatConfig.useMarkitdown !== strategyInfo.useMarkitdown) {
        errors.push(`${format}: useMarkitdown設定が処理戦略と一致しません`);
    }
    if (formatConfig.useLangChain !== strategyInfo.useLangChain) {
        errors.push(`${format}: useLangChain設定が処理戦略と一致しません`);
    }
    // 品質比較設定の整合性チェック
    if (formatConfig.enableQualityComparison && !strategyInfo.requiresComparison) {
        errors.push(`${format}: 品質比較は'both-compare'戦略でのみ有効です`);
    }
    return errors;
}
/**
 * ファイル形式が有効かチェック
 */
function isFormatEnabled(config, format) {
    return config.enabled &&
        config.supportedFormats[format]?.enabled === true;
}
/**
 * ファイルサイズが制限内かチェック
 */
function isFileSizeValid(config, format, sizeBytes) {
    const formatLimit = exports.FILE_SIZE_LIMITS[format];
    const globalLimit = config.performance.maxFileSizeBytes;
    return sizeBytes <= Math.min(formatLimit, globalLimit);
}
/**
 * ファイル形式に対してMarkitdownを使用するかチェック
 */
function shouldUseMarkitdown(config, format) {
    const formatConfig = config.supportedFormats[format];
    return config.enabled &&
        formatConfig?.enabled === true &&
        formatConfig?.useMarkitdown === true;
}
/**
 * ファイル形式に対してLangChainを使用するかチェック
 */
function shouldUseLangChain(config, format) {
    const formatConfig = config.supportedFormats[format];
    return formatConfig?.enabled === true &&
        formatConfig?.useLangChain === true;
}
/**
 * 処理戦略に基づいて実行順序を決定
 */
function getProcessingOrder(config, format) {
    const formatConfig = config.supportedFormats[format];
    if (!formatConfig?.enabled)
        return [];
    switch (formatConfig.processingStrategy) {
        case 'markitdown-only':
            return formatConfig.useMarkitdown ? ['markitdown'] : [];
        case 'langchain-only':
            return formatConfig.useLangChain ? ['langchain'] : [];
        case 'markitdown-first':
            const markitdownFirst = [];
            if (formatConfig.useMarkitdown)
                markitdownFirst.push('markitdown');
            if (formatConfig.useLangChain)
                markitdownFirst.push('langchain');
            return markitdownFirst;
        case 'langchain-first':
            const langchainFirst = [];
            if (formatConfig.useLangChain)
                langchainFirst.push('langchain');
            if (formatConfig.useMarkitdown)
                langchainFirst.push('markitdown');
            return langchainFirst;
        case 'both-compare':
            const both = [];
            if (formatConfig.useMarkitdown)
                both.push('markitdown');
            if (formatConfig.useLangChain)
                both.push('langchain');
            return both;
        case 'auto-select':
            return getAutoSelectedOrder(format);
        default:
            return [];
    }
}
/**
 * ファイル形式に基づく自動選択ロジック
 */
function getAutoSelectedOrder(format) {
    // Office文書: Markitdown優先
    if (exports.FILE_FORMAT_CATEGORIES.OFFICE.includes(format)) {
        return ['markitdown', 'langchain'];
    }
    // 画像: Markitdownのみ（OCR機能）
    if (exports.FILE_FORMAT_CATEGORIES.IMAGE.includes(format)) {
        return ['markitdown'];
    }
    // データファイル: LangChainのみ
    if (exports.FILE_FORMAT_CATEGORIES.DATA.includes(format)) {
        return ['langchain'];
    }
    // その他: LangChain優先
    return ['langchain', 'markitdown'];
}
/**
 * 品質比較が必要かチェック
 */
function shouldPerformQualityComparison(config, format) {
    const formatConfig = config.supportedFormats[format];
    return formatConfig?.enableQualityComparison === true &&
        formatConfig?.processingStrategy === 'both-compare';
}
/**
 * 処理メタデータからEmbedding情報を生成
 */
function extractEmbeddingInfo(metadata) {
    return {
        fileName: metadata.originalFileName,
        fileFormat: metadata.fileType,
        usedMarkitdown: metadata.markitdownUsed,
        usedLangChain: metadata.langchainUsed,
        finalMethod: metadata.selectedMethod,
        strategy: metadata.processingStrategy,
        processingTime: metadata.totalConversionTime,
        qualityScore: metadata.finalQualityScore,
        processedAt: metadata.endTime
    };
}
/**
 * 処理戦略から設定を自動生成
 */
function generateFormatConfigFromStrategy(strategy, timeout = 30, description = '', ocrEnabled = false) {
    const strategyInfo = exports.PROCESSING_STRATEGY_INFO[strategy];
    return {
        timeout,
        description,
        ocr: ocrEnabled,
        processingStrategy: strategy,
        useMarkitdown: strategyInfo.useMarkitdown,
        useLangChain: strategyInfo.useLangChain,
        enableQualityComparison: strategyInfo.requiresComparison
    };
}
/**
 * ファイル形式に推奨される処理戦略を取得
 */
function getRecommendedStrategy(format) {
    // Office文書: Markitdown優先
    if (exports.FILE_FORMAT_CATEGORIES.OFFICE.includes(format)) {
        return 'markitdown-first';
    }
    // 画像: Markitdownのみ（OCR機能）
    if (exports.FILE_FORMAT_CATEGORIES.IMAGE.includes(format)) {
        return 'markitdown-only';
    }
    // データファイル: LangChainのみ
    if (exports.FILE_FORMAT_CATEGORIES.DATA.includes(format)) {
        return 'langchain-only';
    }
    // PDF: 品質比較
    if (format === 'pdf') {
        return 'both-compare';
    }
    // その他: LangChain優先
    return 'langchain-first';
}
/**
 * 設定の整合性を自動修正
 */
function normalizeFormatConfig(config) {
    const strategyInfo = exports.PROCESSING_STRATEGY_INFO[config.processingStrategy];
    return {
        ...config,
        useMarkitdown: strategyInfo.useMarkitdown,
        useLangChain: strategyInfo.useLangChain,
        enableQualityComparison: strategyInfo.requiresComparison ? config.enableQualityComparison : false
    };
}
/**
 * デフォルトのMarkitdown設定
 */
exports.DEFAULT_MARKITDOWN_CONFIG = {
    enabled: true,
    supportedFormats: {
        docx: {
            enabled: true,
            timeout: 30,
            description: 'Microsoft Word文書',
            processingStrategy: 'markitdown-first',
            useMarkitdown: true,
            useLangChain: true,
            enableQualityComparison: false
        },
        xlsx: {
            enabled: true,
            timeout: 45,
            description: 'Microsoft Excel文書',
            processingStrategy: 'markitdown-first',
            useMarkitdown: true,
            useLangChain: true,
            enableQualityComparison: false
        },
        pptx: {
            enabled: true,
            timeout: 60,
            description: 'Microsoft PowerPoint文書',
            processingStrategy: 'markitdown-first',
            useMarkitdown: true,
            useLangChain: true,
            enableQualityComparison: false
        },
        pdf: {
            enabled: true,
            timeout: 120,
            ocr: true,
            description: 'PDF文書（OCR対応）',
            processingStrategy: 'both-compare',
            useMarkitdown: true,
            useLangChain: true,
            enableQualityComparison: true
        },
        png: {
            enabled: true,
            timeout: 90,
            ocr: true,
            description: 'PNG画像（OCR対応）',
            processingStrategy: 'markitdown-only',
            useMarkitdown: true,
            useLangChain: false,
            enableQualityComparison: false
        },
        jpg: {
            enabled: true,
            timeout: 90,
            ocr: true,
            description: 'JPEG画像（OCR対応）',
            processingStrategy: 'markitdown-only',
            useMarkitdown: true,
            useLangChain: false,
            enableQualityComparison: false
        },
        jpeg: {
            enabled: true,
            timeout: 90,
            ocr: true,
            description: 'JPEG画像（OCR対応）',
            processingStrategy: 'markitdown-only',
            useMarkitdown: true,
            useLangChain: false,
            enableQualityComparison: false
        },
        gif: {
            enabled: true,
            timeout: 90,
            ocr: true,
            description: 'GIF画像（OCR対応）',
            processingStrategy: 'markitdown-only',
            useMarkitdown: true,
            useLangChain: false,
            enableQualityComparison: false
        },
        html: {
            enabled: true,
            timeout: 30,
            description: 'HTML文書',
            processingStrategy: 'langchain-first',
            useMarkitdown: true,
            useLangChain: true,
            enableQualityComparison: false
        },
        xml: {
            enabled: true,
            timeout: 30,
            description: 'XML文書',
            processingStrategy: 'langchain-first',
            useMarkitdown: true,
            useLangChain: true,
            enableQualityComparison: false
        },
        csv: {
            enabled: true,
            timeout: 15,
            description: 'CSV文書',
            processingStrategy: 'langchain-only',
            useMarkitdown: false,
            useLangChain: true,
            enableQualityComparison: false
        },
        tsv: {
            enabled: true,
            timeout: 15,
            description: 'TSV文書',
            processingStrategy: 'langchain-only',
            useMarkitdown: false,
            useLangChain: true,
            enableQualityComparison: false
        }
    },
    performance: {
        maxFileSize: '10MB',
        maxFileSizeBytes: 10485760,
        memoryLimit: '1024MB',
        memoryLimitMB: 1024,
        parallelProcessing: true,
        maxConcurrentProcesses: 3
    },
    fallback: {
        enabled: true,
        useLangChainOnFailure: true,
        retryAttempts: 2,
        retryDelayMs: 1000
    },
    security: {
        validateFileType: true,
        validateFileSize: true,
        encryptTempFiles: true,
        autoDeleteTempFiles: true,
        tempFileRetentionMinutes: 30
    },
    logging: {
        level: 'info',
        enableDetailedLogs: true,
        enablePerformanceLogs: true,
        enableErrorTracking: true
    },
    quality: {
        ocrAccuracy: 'high',
        textExtractionQuality: 'high',
        preserveFormatting: true,
        preserveImages: false
    }
};
/**
 * 環境別デフォルト設定
 */
exports.ENVIRONMENT_DEFAULTS = {
    dev: {
        logging: {
            level: 'debug',
            enableDetailedLogs: true,
            enablePerformanceLogs: true,
            enableErrorTracking: true
        },
        performance: {
            maxFileSize: '5MB',
            maxFileSizeBytes: 5242880,
            memoryLimit: '512MB',
            memoryLimitMB: 512,
            parallelProcessing: false,
            maxConcurrentProcesses: 1
        }
    },
    staging: {
        logging: {
            level: 'info',
            enableDetailedLogs: true,
            enablePerformanceLogs: true,
            enableErrorTracking: true
        },
        performance: {
            maxFileSize: '10MB',
            maxFileSizeBytes: 10485760,
            memoryLimit: '1024MB',
            memoryLimitMB: 1024,
            parallelProcessing: true,
            maxConcurrentProcesses: 2
        }
    },
    prod: {
        logging: {
            level: 'warn',
            enableDetailedLogs: false,
            enablePerformanceLogs: true,
            enableErrorTracking: true
        },
        performance: {
            maxFileSize: '50MB',
            maxFileSizeBytes: 52428800,
            memoryLimit: '3008MB',
            memoryLimitMB: 3008,
            parallelProcessing: true,
            maxConcurrentProcesses: 5
        }
    }
};
