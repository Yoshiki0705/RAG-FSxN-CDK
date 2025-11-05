# Markitdown統合機能 API仕様書

## 📋 概要

Permission-aware RAG SystemのMarkitdown統合機能が提供するAPI仕様書です。文書処理、設定管理、監視機能のエンドポイントを詳細に説明します。

## 🌐 ベースURL

```
Production: https://your-domain.com/api
Staging: https://staging.your-domain.com/api
Development: https://dev.your-domain.com/api
```

## 🔐 認証

### Bearer Token認証

```http
Authorization: Bearer <JWT_TOKEN>
```

### APIキー認証（管理者用）

```http
X-API-Key: <API_KEY>
```

## 📄 文書処理API

### 1. 文書アップロード・処理

#### `POST /documents/upload`

Markitdown統合機能を使用して文書をアップロード・処理します。

**リクエスト**

```http
POST /api/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <JWT_TOKEN>

--boundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[ファイルデータ]
--boundary
Content-Disposition: form-data; name="processingStrategy"

markitdown-first
--boundary
Content-Disposition: form-data; name="projectId"

project-123
--boundary--
```

**パラメータ**

| パラメータ | 型 | 必須 | 説明 |
|------------|----|----|------|
| `file` | File | ✅ | アップロードするファイル |
| `processingStrategy` | String | ❌ | 処理戦略（デフォルト: auto） |
| `projectId` | String | ✅ | プロジェクトID |
| `enableOCR` | Boolean | ❌ | OCR有効化（画像・PDF用） |
| `qualityThreshold` | Number | ❌ | 品質閾値（0-100） |

**処理戦略オプション**

- `auto` - ファイル形式に基づく自動選択
- `markitdown-only` - Markitdownのみ使用
- `langchain-only` - LangChainのみ使用
- `markitdown-first` - Markitdown優先、失敗時LangChain
- `langchain-first` - LangChain優先、失敗時Markitdown
- `both-compare` - 両方実行して品質比較

**レスポンス**

```json
{
  "success": true,
  "data": {
    "fileId": "file-uuid-123",
    "fileName": "document.pdf",
    "fileSize": 1048576,
    "fileFormat": "pdf",
    "processingMethod": "markitdown",
    "processingTime": 2500.5,
    "qualityScore": 87.5,
    "markdownContent": "# Document Title\n\nDocument content...",
    "metadata": {
      "pageCount": 5,
      "wordCount": 1250,
      "language": "ja",
      "extractedImages": 2,
      "processingTimestamp": "2025-01-15T10:30:00Z"
    },
    "chunks": [
      {
        "id": "chunk-1",
        "content": "# Document Title\n\nFirst section...",
        "metadata": {
          "chunkType": "header",
          "position": 0,
          "length": 150
        }
      }
    ],
    "embeddings": [
      {
        "chunkId": "chunk-1",
        "vector": [0.1, 0.2, 0.3, "..."],
        "model": "amazon.titan-embed-text-v1"
      }
    ]
  },
  "processing": {
    "strategy": "markitdown-first",
    "attempts": [
      {
        "method": "markitdown",
        "success": true,
        "duration": 2500.5,
        "qualityScore": 87.5
      }
    ],
    "fallbackUsed": false
  }
}
```

**エラーレスポンス**

```json
{
  "success": false,
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "文書処理に失敗しました",
    "details": {
      "fileFormat": "pdf",
      "processingMethod": "markitdown",
      "errorType": "CONVERSION_ERROR",
      "originalError": "OCR processing failed"
    }
  },
  "processing": {
    "strategy": "markitdown-first",
    "attempts": [
      {
        "method": "markitdown",
        "success": false,
        "duration": 1200.0,
        "error": "OCR processing failed"
      },
      {
        "method": "langchain",
        "success": false,
        "duration": 800.0,
        "error": "Unsupported file format"
      }
    ],
    "fallbackUsed": true
  }
}
```

### 2. 文書処理状況確認

#### `GET /documents/{fileId}/status`

文書処理の状況を確認します。

**リクエスト**

```http
GET /api/documents/file-uuid-123/status
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "fileId": "file-uuid-123",
    "status": "completed",
    "progress": 100,
    "processingMethod": "markitdown",
    "startTime": "2025-01-15T10:30:00Z",
    "endTime": "2025-01-15T10:30:02Z",
    "processingTime": 2500.5,
    "qualityScore": 87.5,
    "chunkCount": 15,
    "embeddingCount": 15
  }
}
```

**ステータス値**

- `queued` - 処理待ち
- `processing` - 処理中
- `completed` - 処理完了
- `failed` - 処理失敗
- `cancelled` - 処理キャンセル

### 3. 文書再処理

#### `POST /documents/{fileId}/reprocess`

既存文書を異なる戦略で再処理します。

**リクエスト**

```http
POST /api/documents/file-uuid-123/reprocess
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "processingStrategy": "both-compare",
  "enableOCR": true,
  "qualityThreshold": 90
}
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "fileId": "file-uuid-123",
    "reprocessingId": "reprocess-uuid-456",
    "status": "queued",
    "estimatedTime": 5000
  }
}
```

## ⚙️ 設定管理API

### 1. 設定取得

#### `GET /markitdown/config`

現在のMarkitdown設定を取得します。

**リクエスト**

```http
GET /api/markitdown/config
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "enabled": true,
    "supportedFormats": {
      "pdf": {
        "enabled": true,
        "timeout": 120,
        "ocr": true,
        "processingStrategy": "markitdown-first",
        "maxFileSizeBytes": 52428800
      },
      "docx": {
        "enabled": true,
        "timeout": 30,
        "processingStrategy": "markitdown-first",
        "maxFileSizeBytes": 10485760
      }
    },
    "performance": {
      "maxFileSizeBytes": 52428800,
      "parallelProcessing": true,
      "maxConcurrentProcesses": 3
    },
    "environment": "prod",
    "lastUpdated": "2025-01-15T10:00:00Z"
  }
}
```

### 2. サポートファイル形式取得

#### `GET /markitdown/supported-formats`

サポートされているファイル形式一覧を取得します。

**リクエスト**

```http
GET /api/markitdown/supported-formats
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "formats": [
      {
        "extension": "pdf",
        "mimeType": "application/pdf",
        "enabled": true,
        "description": "PDF文書（OCR対応）",
        "processingStrategy": "markitdown-first",
        "maxFileSize": "50MB",
        "features": ["ocr", "text-extraction", "image-extraction"]
      },
      {
        "extension": "docx",
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "enabled": true,
        "description": "Microsoft Word文書",
        "processingStrategy": "markitdown-first",
        "maxFileSize": "10MB",
        "features": ["text-extraction", "formatting-preservation"]
      }
    ],
    "totalFormats": 9,
    "enabledFormats": 8
  }
}
```

### 3. 設定更新（管理者用）

#### `PUT /markitdown/config`

Markitdown設定を更新します。

**リクエスト**

```http
PUT /api/markitdown/config
Content-Type: application/json
X-API-Key: <ADMIN_API_KEY>

{
  "supportedFormats.pdf.processingStrategy": "both-compare",
  "performance.maxConcurrentProcesses": 5,
  "logging.level": "debug"
}
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "updatedFields": [
      "supportedFormats.pdf.processingStrategy",
      "performance.maxConcurrentProcesses",
      "logging.level"
    ],
    "timestamp": "2025-01-15T10:30:00Z",
    "appliedImmediately": true
  }
}
```

### 4. 設定リロード（管理者用）

#### `POST /markitdown/config/reload`

設定ファイルを再読み込みします。

**リクエスト**

```http
POST /api/markitdown/config/reload
X-API-Key: <ADMIN_API_KEY>
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "reloadedAt": "2025-01-15T10:30:00Z",
    "configVersion": "1.0.1",
    "changesDetected": true,
    "affectedServices": ["document-processor", "embedding-service"]
  }
}
```

## 📊 監視・統計API

### 1. 処理統計取得

#### `GET /markitdown/stats`

Markitdown処理統計を取得します。

**リクエスト**

```http
GET /api/markitdown/stats?period=24h&format=pdf
Authorization: Bearer <JWT_TOKEN>
```

**クエリパラメータ**

| パラメータ | 型 | 説明 |
|------------|----|----|
| `period` | String | 期間（1h, 24h, 7d, 30d） |
| `format` | String | ファイル形式フィルタ |
| `method` | String | 処理方法フィルタ |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "period": "24h",
    "totalProcessed": 1250,
    "successRate": 96.8,
    "averageProcessingTime": 2150.5,
    "byFormat": {
      "pdf": {
        "count": 450,
        "successRate": 94.2,
        "averageTime": 3200.0,
        "averageQuality": 87.5
      },
      "docx": {
        "count": 380,
        "successRate": 98.9,
        "averageTime": 1800.0,
        "averageQuality": 92.1
      }
    },
    "byMethod": {
      "markitdown": {
        "count": 850,
        "successRate": 95.3,
        "averageTime": 2000.0
      },
      "langchain": {
        "count": 400,
        "successRate": 99.5,
        "averageTime": 1200.0
      }
    },
    "errors": {
      "total": 40,
      "byType": {
        "CONVERSION_ERROR": 25,
        "TIMEOUT_ERROR": 10,
        "FILE_SIZE_ERROR": 5
      }
    }
  }
}
```

### 2. システム健全性確認

#### `GET /markitdown/health`

Markitdown統合機能の健全性を確認します。

**リクエスト**

```http
GET /api/markitdown/health
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "1.0.0",
    "components": {
      "markitdown-service": {
        "status": "healthy",
        "responseTime": 150.5,
        "lastCheck": "2025-01-15T10:30:00Z"
      },
      "langchain-service": {
        "status": "healthy",
        "responseTime": 89.2,
        "lastCheck": "2025-01-15T10:30:00Z"
      },
      "bedrock-embedding": {
        "status": "healthy",
        "responseTime": 245.8,
        "lastCheck": "2025-01-15T10:30:00Z"
      },
      "dynamodb-tracking": {
        "status": "healthy",
        "responseTime": 12.3,
        "lastCheck": "2025-01-15T10:30:00Z"
      }
    },
    "metrics": {
      "activeProcesses": 3,
      "queuedJobs": 12,
      "memoryUsage": 67.8,
      "cpuUsage": 23.4
    }
  }
}
```

### 3. パフォーマンスメトリクス

#### `GET /markitdown/metrics`

詳細なパフォーマンスメトリクスを取得します。

**リクエスト**

```http
GET /api/markitdown/metrics?start=2025-01-15T00:00:00Z&end=2025-01-15T23:59:59Z
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "timeRange": {
      "start": "2025-01-15T00:00:00Z",
      "end": "2025-01-15T23:59:59Z"
    },
    "metrics": {
      "processingTime": {
        "average": 2150.5,
        "median": 1800.0,
        "p95": 4500.0,
        "p99": 8200.0,
        "min": 150.0,
        "max": 12000.0
      },
      "throughput": {
        "requestsPerSecond": 0.85,
        "documentsPerHour": 52.1,
        "peakRps": 2.3
      },
      "qualityScores": {
        "average": 89.2,
        "median": 91.0,
        "distribution": {
          "excellent": 45.2,
          "good": 38.7,
          "fair": 12.8,
          "poor": 3.3
        }
      },
      "resourceUsage": {
        "memoryUsage": {
          "average": 67.8,
          "peak": 89.2
        },
        "cpuUsage": {
          "average": 23.4,
          "peak": 78.9
        }
      }
    }
  }
}
```

## 🔍 検索・取得API

### 1. 処理履歴検索

#### `GET /documents/history`

文書処理履歴を検索します。

**リクエスト**

```http
GET /api/documents/history?format=pdf&method=markitdown&limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**クエリパラメータ**

| パラメータ | 型 | 説明 |
|------------|----|----|
| `format` | String | ファイル形式フィルタ |
| `method` | String | 処理方法フィルタ |
| `status` | String | 処理状況フィルタ |
| `startDate` | String | 開始日時（ISO 8601） |
| `endDate` | String | 終了日時（ISO 8601） |
| `limit` | Number | 取得件数（最大100） |
| `offset` | Number | オフセット |

**レスポンス**

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "fileId": "file-uuid-123",
        "fileName": "document.pdf",
        "fileFormat": "pdf",
        "processingMethod": "markitdown",
        "status": "completed",
        "processingTime": 2500.5,
        "qualityScore": 87.5,
        "processedAt": "2025-01-15T10:30:00Z",
        "userId": "user-123",
        "projectId": "project-456"
      }
    ],
    "pagination": {
      "total": 1250,
      "limit": 50,
      "offset": 0,
      "hasNext": true
    }
  }
}
```

### 2. 文書詳細取得

#### `GET /documents/{fileId}`

特定文書の詳細情報を取得します。

**リクエスト**

```http
GET /api/documents/file-uuid-123
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス**

```json
{
  "success": true,
  "data": {
    "fileId": "file-uuid-123",
    "fileName": "document.pdf",
    "fileSize": 1048576,
    "fileFormat": "pdf",
    "uploadedAt": "2025-01-15T10:30:00Z",
    "processedAt": "2025-01-15T10:30:02Z",
    "processingMethod": "markitdown",
    "processingTime": 2500.5,
    "qualityScore": 87.5,
    "status": "completed",
    "metadata": {
      "pageCount": 5,
      "wordCount": 1250,
      "language": "ja",
      "extractedImages": 2,
      "ocrUsed": true
    },
    "processing": {
      "strategy": "markitdown-first",
      "attempts": [
        {
          "method": "markitdown",
          "success": true,
          "duration": 2500.5,
          "qualityScore": 87.5
        }
      ],
      "fallbackUsed": false
    },
    "chunks": {
      "count": 15,
      "totalLength": 12500,
      "averageLength": 833
    },
    "embeddings": {
      "count": 15,
      "model": "amazon.titan-embed-text-v1",
      "dimensions": 1536
    }
  }
}
```

## 🚨 エラーコード

### 一般エラー

| コード | HTTP | 説明 |
|--------|------|------|
| `INVALID_REQUEST` | 400 | リクエストが無効 |
| `UNAUTHORIZED` | 401 | 認証が必要 |
| `FORBIDDEN` | 403 | アクセス権限なし |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `METHOD_NOT_ALLOWED` | 405 | HTTPメソッドが許可されていない |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限超過 |
| `INTERNAL_ERROR` | 500 | 内部サーバーエラー |

### Markitdown固有エラー

| コード | HTTP | 説明 |
|--------|------|------|
| `MARKITDOWN_DISABLED` | 503 | Markitdown機能が無効 |
| `UNSUPPORTED_FORMAT` | 400 | サポートされていないファイル形式 |
| `FILE_TOO_LARGE` | 413 | ファイルサイズが制限を超過 |
| `PROCESSING_FAILED` | 422 | 文書処理に失敗 |
| `CONVERSION_ERROR` | 422 | 変換エラー |
| `OCR_ERROR` | 422 | OCR処理エラー |
| `TIMEOUT_ERROR` | 408 | 処理タイムアウト |
| `QUALITY_TOO_LOW` | 422 | 変換品質が閾値を下回る |
| `CONCURRENT_LIMIT` | 429 | 同時処理数制限超過 |

## 📝 使用例

### JavaScript/TypeScript

```typescript
// 文書アップロード
const uploadDocument = async (file: File, strategy: string = 'auto') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('processingStrategy', strategy);
  formData.append('projectId', 'project-123');

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};

// 処理状況確認
const checkStatus = async (fileId: string) => {
  const response = await fetch(`/api/documents/${fileId}/status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// 設定取得
const getConfig = async () => {
  const response = await fetch('/api/markitdown/config', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### Python

```python
import requests
import json

class MarkitdownAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def upload_document(self, file_path: str, strategy: str = 'auto'):
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {
                'processingStrategy': strategy,
                'projectId': 'project-123'
            }
            
            response = requests.post(
                f'{self.base_url}/documents/upload',
                headers=self.headers,
                files=files,
                data=data
            )
            
            return response.json()
    
    def check_status(self, file_id: str):
        response = requests.get(
            f'{self.base_url}/documents/{file_id}/status',
            headers=self.headers
        )
        
        return response.json()
    
    def get_stats(self, period: str = '24h'):
        response = requests.get(
            f'{self.base_url}/markitdown/stats',
            headers=self.headers,
            params={'period': period}
        )
        
        return response.json()

# 使用例
api = MarkitdownAPI('https://your-domain.com/api', 'your-token')

# 文書アップロード
result = api.upload_document('document.pdf', 'markitdown-first')
print(f"File ID: {result['data']['fileId']}")

# 処理状況確認
status = api.check_status(result['data']['fileId'])
print(f"Status: {status['data']['status']}")

# 統計取得
stats = api.get_stats('24h')
print(f"Success Rate: {stats['data']['successRate']}%")
```

### cURL

```bash
# 文書アップロード
curl -X POST https://your-domain.com/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "processingStrategy=markitdown-first" \
  -F "projectId=project-123"

# 処理状況確認
curl -X GET https://your-domain.com/api/documents/file-uuid-123/status \
  -H "Authorization: Bearer $TOKEN"

# 設定取得
curl -X GET https://your-domain.com/api/markitdown/config \
  -H "Authorization: Bearer $TOKEN"

# 統計取得
curl -X GET "https://your-domain.com/api/markitdown/stats?period=24h" \
  -H "Authorization: Bearer $TOKEN"

# 健全性確認
curl -X GET https://your-domain.com/api/markitdown/health
```

## 📚 関連ドキュメント

- [Markitdown設定ガイド](../configuration/MARKITDOWN_CONFIGURATION_GUIDE.md)
- [Markitdownデプロイメントガイド](../deployment/MARKITDOWN_DEPLOYMENT_GUIDE.md)
- [エラーハンドリングガイド](../troubleshooting/MARKITDOWN_ERROR_HANDLING.md)
- [パフォーマンス最適化ガイド](../performance/MARKITDOWN_PERFORMANCE_GUIDE.md)

---

**最終更新**: 2025/01/15  
**APIバージョン**: v1.0  
**対象**: Markitdown統合機能 v1.0  
**メンテナンス**: 開発チーム