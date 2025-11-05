# Markitdown統合機能 設定ガイド

## 📋 概要

Permission-aware RAG SystemにおけるMicrosoft Markitdown統合機能の詳細設定ガイドです。ファイル形式別の処理戦略、パフォーマンス調整、セキュリティ設定について説明します。

## 🔧 設定ファイル構造

### メイン設定ファイル (`config/markitdown-config.json`)

```json
{
  "version": "1.0.0",
  "markitdown": {
    "enabled": true,
    "supportedFormats": {
      "pdf": {
        "enabled": true,
        "timeout": 120,
        "ocr": true,
        "description": "PDF文書（OCR対応）",
        "processingStrategy": "both-compare",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": true,
        "maxFileSizeBytes": 52428800,
        "ocrSettings": {
          "accuracy": "high",
          "language": "auto",
          "preserveLayout": true
        }
      },
      "docx": {
        "enabled": true,
        "timeout": 30,
        "description": "Microsoft Word文書",
        "processingStrategy": "markitdown-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": false,
        "maxFileSizeBytes": 10485760
      },
      "xlsx": {
        "enabled": true,
        "timeout": 45,
        "description": "Microsoft Excel文書",
        "processingStrategy": "markitdown-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": false,
        "maxFileSizeBytes": 10485760,
        "excelSettings": {
          "includeFormulas": true,
          "preserveFormatting": true,
          "maxSheets": 10
        }
      },
      "pptx": {
        "enabled": true,
        "timeout": 60,
        "description": "Microsoft PowerPoint文書",
        "processingStrategy": "markitdown-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": false,
        "maxFileSizeBytes": 20971520,
        "powerpointSettings": {
          "includeNotes": true,
          "includeSlideNumbers": true,
          "preserveAnimations": false
        }
      },
      "png": {
        "enabled": true,
        "timeout": 90,
        "ocr": true,
        "description": "PNG画像（OCR対応）",
        "processingStrategy": "markitdown-only",
        "useMarkitdown": true,
        "useLangChain": false,
        "enableQualityComparison": false,
        "maxFileSizeBytes": 5242880,
        "imageSettings": {
          "maxWidth": 4096,
          "maxHeight": 4096,
          "compressionQuality": 85
        }
      },
      "jpg": {
        "enabled": true,
        "timeout": 90,
        "ocr": true,
        "description": "JPEG画像（OCR対応）",
        "processingStrategy": "markitdown-only",
        "useMarkitdown": true,
        "useLangChain": false,
        "enableQualityComparison": false,
        "maxFileSizeBytes": 5242880
      },
      "html": {
        "enabled": true,
        "timeout": 30,
        "description": "HTML文書",
        "processingStrategy": "langchain-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": false,
        "maxFileSizeBytes": 2097152,
        "htmlSettings": {
          "preserveLinks": true,
          "includeMetadata": true,
          "cleanupTags": true
        }
      },
      "csv": {
        "enabled": true,
        "timeout": 15,
        "description": "CSV文書",
        "processingStrategy": "langchain-only",
        "useMarkitdown": false,
        "useLangChain": true,
        "enableQualityComparison": false,
        "maxFileSizeBytes": 10485760,
        "csvSettings": {
          "delimiter": "auto",
          "encoding": "utf-8",
          "maxRows": 10000
        }
      },
      "txt": {
        "enabled": true,
        "timeout": 10,
        "description": "テキストファイル",
        "processingStrategy": "langchain-only",
        "useMarkitdown": false,
        "useLangChain": true,
        "enableQualityComparison": false,
        "maxFileSizeBytes": 5242880
      }
    },
    "performance": {
      "maxFileSize": "10MB",
      "maxFileSizeBytes": 10485760,
      "memoryLimit": "1024MB",
      "memoryLimitMB": 1024,
      "parallelProcessing": true,
      "maxConcurrentProcesses": 3,
      "timeoutSettings": {
        "defaultTimeout": 60,
        "maxTimeout": 300,
        "retryTimeout": 30
      },
      "caching": {
        "enabled": true,
        "ttlMinutes": 60,
        "maxCacheSize": 100
      }
    },
    "fallback": {
      "enabled": true,
      "useLangChainOnFailure": true,
      "retryAttempts": 2,
      "retryDelayMs": 1000,
      "escalationStrategy": "langchain-fallback",
      "fallbackTimeout": 30
    },
    "security": {
      "validateFileType": true,
      "validateFileSize": true,
      "encryptTempFiles": true,
      "autoDeleteTempFiles": true,
      "tempFileRetentionMinutes": 30,
      "allowedMimeTypes": [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/png",
        "image/jpeg",
        "text/html",
        "text/csv",
        "text/plain"
      ],
      "virusScanning": {
        "enabled": false,
        "provider": "clamav",
        "timeout": 30
      }
    },
    "logging": {
      "level": "info",
      "enableDetailedLogs": true,
      "enablePerformanceLogs": true,
      "enableErrorTracking": true,
      "logRetentionDays": 30,
      "structuredLogging": true,
      "logFormat": "json"
    },
    "quality": {
      "ocrAccuracy": "high",
      "textExtractionQuality": "high",
      "preserveFormatting": true,
      "preserveImages": false,
      "qualityThreshold": 85,
      "enableQualityMetrics": true
    },
    "monitoring": {
      "enableMetrics": true,
      "metricsNamespace": "RAG/DocumentProcessor/Markitdown",
      "enableAlarms": true,
      "alarmThresholds": {
        "errorRate": 5.0,
        "processingTime": 30000,
        "memoryUsage": 80.0
      }
    }
  }
}
```

## 🎯 処理戦略の詳細

### 利用可能な処理戦略

| 戦略 | 説明 | 使用場面 | パフォーマンス |
|------|------|----------|----------------|
| `markitdown-only` | Markitdownのみ使用 | 画像ファイル、OCR処理 | 高速 |
| `langchain-only` | LangChainのみ使用 | テキストファイル、CSV | 高速 |
| `markitdown-first` | Markitdown優先、失敗時LangChain | Office文書 | 中速 |
| `langchain-first` | LangChain優先、失敗時Markitdown | HTML、XML | 中速 |
| `both-compare` | 両方実行して品質比較 | PDF（重要文書） | 低速・高品質 |

### 戦略選択の指針

```json
{
  "推奨設定": {
    "高速処理優先": {
      "pdf": "markitdown-only",
      "docx": "markitdown-only",
      "txt": "langchain-only"
    },
    "品質優先": {
      "pdf": "both-compare",
      "docx": "markitdown-first",
      "txt": "langchain-only"
    },
    "バランス型": {
      "pdf": "markitdown-first",
      "docx": "markitdown-first",
      "txt": "langchain-only"
    }
  }
}
```

## 🔧 環境別設定オーバーライド

### 環境別設定ファイル (`config/environments/markitdown-overrides.json`)

```json
{
  "dev": {
    "enabled": true,
    "supportedFormats": {
      "pdf": {
        "processingStrategy": "markitdown-only",
        "ocr": false,
        "timeout": 60
      },
      "docx": {
        "processingStrategy": "markitdown-only",
        "timeout": 15
      }
    },
    "performance": {
      "maxFileSizeBytes": 5242880,
      "parallelProcessing": false,
      "maxConcurrentProcesses": 1
    },
    "logging": {
      "level": "debug",
      "enableDetailedLogs": true
    },
    "security": {
      "tempFileRetentionMinutes": 60
    }
  },
  "staging": {
    "enabled": true,
    "supportedFormats": {
      "pdf": {
        "processingStrategy": "markitdown-first",
        "ocr": true,
        "timeout": 90
      }
    },
    "performance": {
      "maxFileSizeBytes": 8388608,
      "parallelProcessing": true,
      "maxConcurrentProcesses": 2
    },
    "logging": {
      "level": "info",
      "enableDetailedLogs": true
    },
    "monitoring": {
      "enableAlarms": false
    }
  },
  "prod": {
    "enabled": true,
    "supportedFormats": {
      "pdf": {
        "processingStrategy": "both-compare",
        "ocr": true,
        "timeout": 120
      }
    },
    "performance": {
      "maxFileSizeBytes": 52428800,
      "parallelProcessing": true,
      "maxConcurrentProcesses": 5
    },
    "fallback": {
      "retryAttempts": 3,
      "retryDelayMs": 2000
    },
    "security": {
      "tempFileRetentionMinutes": 15,
      "virusScanning": {
        "enabled": true
      }
    },
    "logging": {
      "level": "warn",
      "enableDetailedLogs": false
    },
    "monitoring": {
      "enableAlarms": true,
      "alarmThresholds": {
        "errorRate": 2.0,
        "processingTime": 60000
      }
    }
  }
}
```

## 🌍 環境変数設定

### 基本環境変数

```bash
# Markitdown機能制御
export MARKITDOWN_ENABLED=true
export MARKITDOWN_CONFIG_PATH=/opt/config/markitdown-config.json
export MARKITDOWN_ENVIRONMENT=prod

# パフォーマンス設定
export MARKITDOWN_MAX_FILE_SIZE=52428800
export MARKITDOWN_MAX_PROCESSING_TIME=300000
export MARKITDOWN_PARALLEL_PROCESSING=true
export MARKITDOWN_MAX_CONCURRENT=5

# セキュリティ設定
export MARKITDOWN_ENCRYPT_TEMP_FILES=true
export MARKITDOWN_AUTO_DELETE_TEMP=true
export MARKITDOWN_TEMP_RETENTION_MINUTES=15

# ログ設定
export MARKITDOWN_LOG_LEVEL=info
export MARKITDOWN_ENABLE_DETAILED_LOGS=false
export MARKITDOWN_ENABLE_PERFORMANCE_LOGS=true

# 監視設定
export MARKITDOWN_ENABLE_METRICS=true
export MARKITDOWN_METRICS_NAMESPACE=RAG/DocumentProcessor/Markitdown
export MARKITDOWN_ENABLE_ALARMS=true

# AWS設定
export AWS_REGION=us-east-1
export DYNAMODB_TRACKING_TABLE=EmbeddingProcessingTracking
export BEDROCK_EMBEDDING_MODEL=amazon.titan-embed-text-v1
```

### Lambda関数環境変数

```json
{
  "Environment": {
    "Variables": {
      "MARKITDOWN_ENABLED": "true",
      "MARKITDOWN_CONFIG_PATH": "/opt/config/markitdown-config.json",
      "MARKITDOWN_ENVIRONMENT": "prod",
      "MARKITDOWN_MAX_FILE_SIZE": "52428800",
      "MARKITDOWN_PARALLEL_PROCESSING": "true",
      "MARKITDOWN_LOG_LEVEL": "info",
      "DYNAMODB_TRACKING_TABLE": "EmbeddingProcessingTracking",
      "BEDROCK_EMBEDDING_MODEL": "amazon.titan-embed-text-v1"
    }
  }
}
```

## 📊 パフォーマンス調整

### ファイルサイズ制限

```json
{
  "ファイルサイズ制限": {
    "小規模環境": {
      "maxFileSizeBytes": 5242880,
      "説明": "5MB制限、開発・テスト環境向け"
    },
    "中規模環境": {
      "maxFileSizeBytes": 10485760,
      "説明": "10MB制限、ステージング環境向け"
    },
    "大規模環境": {
      "maxFileSizeBytes": 52428800,
      "説明": "50MB制限、本番環境向け"
    }
  }
}
```

### 並行処理設定

```json
{
  "並行処理設定": {
    "開発環境": {
      "parallelProcessing": false,
      "maxConcurrentProcesses": 1,
      "理由": "リソース節約、デバッグ容易性"
    },
    "ステージング環境": {
      "parallelProcessing": true,
      "maxConcurrentProcesses": 2,
      "理由": "本番環境のテスト"
    },
    "本番環境": {
      "parallelProcessing": true,
      "maxConcurrentProcesses": 5,
      "理由": "最大スループット"
    }
  }
}
```

### タイムアウト設定

```json
{
  "タイムアウト設定": {
    "ファイル形式別": {
      "txt": 10,
      "csv": 15,
      "docx": 30,
      "xlsx": 45,
      "pptx": 60,
      "html": 30,
      "png": 90,
      "jpg": 90,
      "pdf": 120
    },
    "環境別調整": {
      "dev": "基本値の50%",
      "staging": "基本値の75%",
      "prod": "基本値の100%"
    }
  }
}
```

## 🔒 セキュリティ設定

### ファイル検証

```json
{
  "security": {
    "validateFileType": true,
    "validateFileSize": true,
    "allowedMimeTypes": [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/png",
      "image/jpeg",
      "text/html",
      "text/csv",
      "text/plain"
    ],
    "blockedExtensions": [
      ".exe",
      ".bat",
      ".cmd",
      ".scr",
      ".vbs",
      ".js"
    ]
  }
}
```

### 一時ファイル管理

```json
{
  "tempFileManagement": {
    "encryptTempFiles": true,
    "autoDeleteTempFiles": true,
    "tempFileRetentionMinutes": 30,
    "tempFileLocation": "/tmp/markitdown",
    "encryptionAlgorithm": "AES-256-GCM",
    "cleanupSchedule": "*/5 * * * *"
  }
}
```

## 📈 監視・メトリクス設定

### CloudWatchメトリクス

```json
{
  "monitoring": {
    "enableMetrics": true,
    "metricsNamespace": "RAG/DocumentProcessor/Markitdown",
    "customMetrics": [
      {
        "name": "ConversionSuccess",
        "unit": "Count",
        "dimensions": ["FileFormat", "ProcessingMethod"]
      },
      {
        "name": "ProcessingTime",
        "unit": "Milliseconds",
        "dimensions": ["FileFormat", "FileSize"]
      },
      {
        "name": "QualityScore",
        "unit": "Percent",
        "dimensions": ["FileFormat", "ProcessingMethod"]
      },
      {
        "name": "ErrorRate",
        "unit": "Percent",
        "dimensions": ["ErrorType", "FileFormat"]
      }
    ]
  }
}
```

### アラーム設定

```json
{
  "alarms": {
    "highErrorRate": {
      "threshold": 5.0,
      "comparisonOperator": "GreaterThanThreshold",
      "evaluationPeriods": 2,
      "period": 300
    },
    "highProcessingTime": {
      "threshold": 30000,
      "comparisonOperator": "GreaterThanThreshold",
      "evaluationPeriods": 3,
      "period": 300
    },
    "highMemoryUsage": {
      "threshold": 80.0,
      "comparisonOperator": "GreaterThanThreshold",
      "evaluationPeriods": 2,
      "period": 300
    }
  }
}
```

## 🧪 設定テスト・検証

### 設定検証スクリプト

```bash
#!/bin/bash
# config/validate-markitdown-config.sh

echo "🔧 Markitdown設定検証開始"

# 設定ファイル存在確認
if [ ! -f "config/markitdown-config.json" ]; then
    echo "❌ 設定ファイルが見つかりません: config/markitdown-config.json"
    exit 1
fi

# JSON構文チェック
if ! jq empty config/markitdown-config.json 2>/dev/null; then
    echo "❌ JSON構文エラー: config/markitdown-config.json"
    exit 1
fi

# 必須フィールドチェック
required_fields=(
    ".markitdown.enabled"
    ".markitdown.supportedFormats"
    ".markitdown.performance"
    ".markitdown.fallback"
    ".markitdown.security"
)

for field in "${required_fields[@]}"; do
    if ! jq -e "$field" config/markitdown-config.json >/dev/null; then
        echo "❌ 必須フィールドが見つかりません: $field"
        exit 1
    fi
done

# ファイルサイズ制限チェック
max_size=$(jq -r '.markitdown.performance.maxFileSizeBytes' config/markitdown-config.json)
if [ "$max_size" -gt 104857600 ]; then  # 100MB
    echo "⚠️  警告: ファイルサイズ制限が大きすぎます: ${max_size}バイト"
fi

# タイムアウト設定チェック
formats=$(jq -r '.markitdown.supportedFormats | keys[]' config/markitdown-config.json)
for format in $formats; do
    timeout=$(jq -r ".markitdown.supportedFormats.$format.timeout" config/markitdown-config.json)
    if [ "$timeout" -gt 300 ]; then  # 5分
        echo "⚠️  警告: ${format}のタイムアウトが長すぎます: ${timeout}秒"
    fi
done

echo "✅ Markitdown設定検証完了"
```

### 設定テストコマンド

```bash
# 設定検証実行
chmod +x config/validate-markitdown-config.sh
./config/validate-markitdown-config.sh

# TypeScript設定テスト
npx ts-node config/test-markitdown-config.ts

# 環境別設定テスト
MARKITDOWN_ENVIRONMENT=dev npx ts-node config/test-markitdown-config.ts
MARKITDOWN_ENVIRONMENT=staging npx ts-node config/test-markitdown-config.ts
MARKITDOWN_ENVIRONMENT=prod npx ts-node config/test-markitdown-config.ts
```

## 🔄 設定の動的更新

### 実行時設定変更

```typescript
// 実行時設定更新例
import { updateMarkitdownConfig } from './config-loader';

// 特定ファイル形式の無効化
await updateMarkitdownConfig({
  'supportedFormats.pdf.enabled': false
});

// パフォーマンス設定の調整
await updateMarkitdownConfig({
  'performance.maxConcurrentProcesses': 3,
  'performance.parallelProcessing': true
});

// ログレベルの変更
await updateMarkitdownConfig({
  'logging.level': 'debug',
  'logging.enableDetailedLogs': true
});
```

### 設定ホットリロード

```bash
# 設定ファイル更新後のホットリロード
curl -X POST https://your-domain.com/api/markitdown/config/reload \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 特定設定の更新
curl -X PUT https://your-domain.com/api/markitdown/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "supportedFormats.pdf.processingStrategy": "markitdown-first",
    "performance.maxConcurrentProcesses": 4
  }'
```

## 📚 設定リファレンス

### 完全設定スキーマ

詳細な設定スキーマは以下のTypeScript型定義を参照してください：

- `types/markitdown-config.ts` - メイン設定型定義
- `types/format-config.ts` - ファイル形式別設定
- `types/performance-config.ts` - パフォーマンス設定
- `types/security-config.ts` - セキュリティ設定

### 設定例テンプレート

- `config/templates/markitdown-config.dev.json` - 開発環境用
- `config/templates/markitdown-config.staging.json` - ステージング環境用
- `config/templates/markitdown-config.prod.json` - 本番環境用

---

**最終更新**: 2025/01/15  
**バージョン**: 1.0.0  
**対象**: Markitdown統合機能 v1.0  
**メンテナンス**: 開発チーム