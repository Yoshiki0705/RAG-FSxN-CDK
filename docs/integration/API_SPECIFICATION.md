# API仕様書

## 📋 概要

Permission-aware RAG System のAPI仕様書です。

## 🔗 エンドポイント

### 認証API

#### POST /api/auth/login
ユーザーログイン

**リクエスト**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**レスポンス**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 検索API

#### POST /api/search
文書検索

**リクエスト**
```json
{
  "query": "検索クエリ",
  "filters": {
    "category": "category-name",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "results": [
    {
      "id": "doc-id",
      "title": "文書タイトル",
      "content": "文書内容の抜粋",
      "score": 0.95,
      "metadata": {
        "category": "category-name",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    }
  ],
  "total": 100
}
```

### チャットAPI

#### POST /api/chat
RAGチャット

**リクエスト**
```json
{
  "message": "質問内容",
  "sessionId": "session-id",
  "context": {
    "documentIds": ["doc-1", "doc-2"]
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "response": "AIの回答",
  "sources": [
    {
      "documentId": "doc-1",
      "title": "参照文書タイトル",
      "excerpt": "関連箇所の抜粋"
    }
  ],
  "sessionId": "session-id"
}
```

## 🔒 認証・認可

### JWT トークン
- ヘッダー: `Authorization: Bearer <token>`
- 有効期限: 24時間
- リフレッシュ: `/api/auth/refresh` エンドポイント

### 権限レベル
- `admin`: 全機能アクセス可能
- `user`: 基本機能のみアクセス可能
- `readonly`: 読み取り専用

## 📊 エラーレスポンス

### 標準エラー形式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": "詳細情報"
  }
}
```

### エラーコード一覧
- `AUTH_REQUIRED`: 認証が必要
- `INVALID_TOKEN`: 無効なトークン
- `PERMISSION_DENIED`: 権限不足
- `VALIDATION_ERROR`: 入力値エラー
- `INTERNAL_ERROR`: 内部エラー

---

**最終更新**: $(date '+%Y/%m/%d %H:%M:%S')  
**自動更新**: ドキュメント自動更新システムにより生成
