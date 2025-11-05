# デプロイメントガイド

## 📋 概要

Permission-aware RAG System with FSx for NetApp ONTAP の統合デプロイメント手順書です。新しい`cdk deploy --all`機能により、全スタックを一括デプロイできます。

## 🚀 クイックスタート

### 前提条件の確認

```bash
# Node.js バージョン確認
node --version  # v20.0.0 以上

# AWS CLI バージョン確認
aws --version   # 2.0.0 以上

# CDK バージョン確認
cdk --version   # 2.174.1 以上
```

### 3分デプロイ（全スタック一括）

```bash
# 1. リポジトリクローン
git clone <repository-url>
cd Permission-aware-RAG-FSxN-CDK

# 2. 依存関係インストール
npm install

# 3. CDK Bootstrap
cdk bootstrap

# 4. 全スタック一括デプロイ
cdk deploy --all

# または npm スクリプト使用
npm run deploy:all
```

## 🔧 詳細セットアップ

### Step 1: 環境準備

#### AWS認証情報設定
```bash
# AWS プロファイル設定
aws configure --profile your-profile
# Access Key ID: [your-access-key]
# Secret Access Key: [your-secret-key]
# Default region: ap-northeast-1
# Default output format: json

# プロファイル確認
aws sts get-caller-identity --profile your-profile
```

#### 必要なIAM権限
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "dynamodb:*",
        "opensearch:*",
        "fsx:*",
        "bedrock:*",
        "cognito-idp:*",
        "cloudfront:*",
        "wafv2:*",
        "iam:*",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 2: 設定ファイル編集

#### config.ts の設定
```typescript
export const config = {
  // プロジェクト基本情報
  projectName: "your-rag-system",
  environment: "dev", // dev, staging, prod
  region: "ap-northeast-1",
  
  // 通知設定
  notificationEmail: "admin@your-domain.com",
  
  // FSx設定
  fsxConfig: {
    storageCapacity: 1024, // GB
    throughputCapacity: 128, // MB/s
    deploymentType: "SINGLE_AZ_1"
  },
  
  // OpenSearch設定
  opensearchConfig: {
    collectionName: "rag-documents",
    indexName: "document-index"
  },
  
  // Markitdown統合設定
  markitdownConfig: {
    enabled: true,
    supportedFormats: {
      docx: { enabled: true, processingStrategy: "markitdown-first" },
      xlsx: { enabled: true, processingStrategy: "markitdown-first" },
      pptx: { enabled: true, processingStrategy: "markitdown-first" },
      pdf: { enabled: true, processingStrategy: "both-compare", ocr: true },
      png: { enabled: true, processingStrategy: "markitdown-only", ocr: true },
      html: { enabled: true, processingStrategy: "langchain-first" },
      csv: { enabled: true, processingStrategy: "langchain-only" }
    },
    performance: {
      maxFileSize: "10MB",
      parallelProcessing: true,
      maxConcurrentProcesses: 3
    },
    tracking: {
      enabled: true,
      retentionDays: 90
    }
  },
  
  // セキュリティ設定
  enableWAF: true,
  enableXRay: true,
  enableBackup: true
};
```

### Step 3: CDK Bootstrap

#### 初回セットアップ
```bash
# CDK Bootstrap（初回のみ）
cdk bootstrap --profile your-profile

# 複数リージョンの場合
cdk bootstrap aws://ACCOUNT-ID/us-east-1 --profile your-profile
cdk bootstrap aws://ACCOUNT-ID/ap-northeast-1 --profile your-profile
```

### Step 4: Markitdown統合機能の設定

#### 環境別Markitdown設定

**開発環境設定**
```bash
# 開発環境用設定ファイル作成
cat > config/environments/markitdown-dev.json << EOF
{
  "markitdown": {
    "enabled": true,
    "supportedFormats": {
      "docx": {
        "enabled": true,
        "processingStrategy": "markitdown-only",
        "useMarkitdown": true,
        "useLangChain": false,
        "timeout": 30
      },
      "pdf": {
        "enabled": true,
        "processingStrategy": "langchain-only",
        "useMarkitdown": false,
        "useLangChain": true,
        "ocr": false,
        "timeout": 60
      }
    },
    "performance": {
      "maxFileSize": "5MB",
      "maxFileSizeBytes": 5242880,
      "parallelProcessing": false,
      "maxConcurrentProcesses": 1
    },
    "logging": {
      "level": "debug",
      "enableDetailedLogs": true,
      "enablePerformanceLogs": true
    }
  }
}
EOF
```

**本番環境設定**
```bash
# 本番環境用設定ファイル作成
cat > config/environments/markitdown-prod.json << EOF
{
  "markitdown": {
    "enabled": true,
    "supportedFormats": {
      "docx": {
        "enabled": true,
        "processingStrategy": "markitdown-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "timeout": 30,
        "enableQualityComparison": false
      },
      "xlsx": {
        "enabled": true,
        "processingStrategy": "markitdown-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "timeout": 45,
        "enableQualityComparison": false
      },
      "pdf": {
        "enabled": true,
        "processingStrategy": "both-compare",
        "useMarkitdown": true,
        "useLangChain": true,
        "ocr": true,
        "timeout": 120,
        "enableQualityComparison": true
      },
      "png": {
        "enabled": true,
        "processingStrategy": "markitdown-only",
        "useMarkitdown": true,
        "useLangChain": false,
        "ocr": true,
        "timeout": 90
      }
    },
    "performance": {
      "maxFileSize": "10MB",
      "maxFileSizeBytes": 10485760,
      "parallelProcessing": true,
      "maxConcurrentProcesses": 3
    },
    "fallback": {
      "enabled": true,
      "useLangChainOnFailure": true,
      "retryAttempts": 3,
      "retryDelayMs": 2000
    },
    "logging": {
      "level": "warn",
      "enableDetailedLogs": false,
      "enablePerformanceLogs": true
    }
  }
}
EOF
```

#### DynamoDB追跡テーブルの設定

```bash
# Embedding追跡テーブル作成用CDKスタック
cat > lib/stacks/embedding-tracking-stack.ts << 'EOF'
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class EmbeddingTrackingStack extends cdk.Stack {
  public readonly trackingTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Embedding処理追跡テーブル
    this.trackingTable = new dynamodb.Table(this, 'EmbeddingTrackingTable', {
      tableName: 'EmbeddingProcessingTracking',
      partitionKey: {
        name: 'fileHash',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'processedAt',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.ON_DEMAND,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // GSI: ファイル形式別インデックス
    this.trackingTable.addGlobalSecondaryIndex({
      indexName: 'FileFormatIndex',
      partitionKey: {
        name: 'fileFormat',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'processedAt',
        type: dynamodb.AttributeType.STRING
      }
    });

    // GSI: 処理方法別インデックス
    this.trackingTable.addGlobalSecondaryIndex({
      indexName: 'ProcessingMethodIndex',
      partitionKey: {
        name: 'finalMethod',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'processedAt',
        type: dynamodb.AttributeType.STRING
      }
    });

    // GSI: ユーザー別インデックス
    this.trackingTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'processedAt',
        type: dynamodb.AttributeType.STRING
      }
    });
  }
}
EOF
```

#### Lambda環境変数の設定

```bash
# Lambda関数にMarkitdown設定を環境変数として設定
export MARKITDOWN_CONFIG_PATH="/opt/config/markitdown-config.json"
export MARKITDOWN_ENABLED="true"
export MARKITDOWN_TRACKING_TABLE="EmbeddingProcessingTracking"
export MARKITDOWN_LOG_LEVEL="info"
export MARKITDOWN_MAX_FILE_SIZE="10485760"
export MARKITDOWN_PARALLEL_PROCESSING="true"
```

#### 設定検証スクリプト

```bash
# Markitdown設定検証スクリプト作成
cat > scripts/validate-markitdown-config.sh << 'EOF'
#!/bin/bash

echo "🔍 Markitdown設定検証を開始します..."

# 設定ファイルの存在確認
if [ ! -f "config/markitdown-config.json" ]; then
    echo "❌ メイン設定ファイルが見つかりません: config/markitdown-config.json"
    exit 1
fi

# 環境別設定ファイルの確認
for env in dev staging prod; do
    if [ ! -f "config/environments/markitdown-overrides.json" ]; then
        echo "⚠️ 環境別設定ファイルが見つかりません: markitdown-overrides.json"
    else
        echo "✅ 環境別設定ファイル確認: $env"
    fi
done

# TypeScript型チェック
echo "🔍 TypeScript型チェック実行中..."
npx tsc --noEmit types/markitdown-config.ts
if [ $? -eq 0 ]; then
    echo "✅ TypeScript型チェック成功"
else
    echo "❌ TypeScript型チェック失敗"
    exit 1
fi

# 設定テスト実行
echo "🧪 設定テスト実行中..."
npx ts-node config/test-markitdown-config.ts
if [ $? -eq 0 ]; then
    echo "✅ 設定テスト成功"
else
    echo "❌ 設定テスト失敗"
    exit 1
fi

echo "🎉 Markitdown設定検証が完了しました！"
EOF

chmod +x scripts/validate-markitdown-config.sh
```

### Step 5: デプロイ実行

#### 全スタック一括デプロイ（推奨）
```bash
# 全スタック確認
cdk list

# 開発環境全スタックデプロイ
cdk deploy --all -c environment=dev

# 本番環境全スタックデプロイ
cdk deploy --all -c environment=prod

# npm スクリプト使用
npm run deploy:all:dev   # 開発環境
npm run deploy:all:prod  # 本番環境
```

#### 選択的デプロイ
```bash
# 統合スタックのみ
npm run deploy:integrated-only

# プロダクションスタックのみ
npm run deploy:production-only

# 特定スタック指定
cdk deploy rag-system-dev-minimal-integrated
cdk deploy rag-system-dev-minimal-production
```

## 🌍 マルチリージョンデプロイ

### リージョン別設定

#### 米国東部（バージニア北部）
```bash
# us-east-1 デプロイ
cdk deploy UsEastStack --profile your-profile \
  --context region=us-east-1 \
  --context environment=prod
```

#### 日本（東京）
```bash
# ap-northeast-1 デプロイ
cdk deploy JapanStack --profile your-profile \
  --context region=ap-northeast-1 \
  --context environment=prod
```

#### ヨーロッパ（アイルランド）
```bash
# eu-west-1 デプロイ
cdk deploy EuropeStack --profile your-profile \
  --context region=eu-west-1 \
  --context environment=prod
```

## 🔄 CI/CD デプロイ

### GitHub Actions設定

#### シークレット設定
```yaml
# GitHub Repository Secrets
AWS_ACCESS_KEY_ID: your-access-key
AWS_SECRET_ACCESS_KEY: your-secret-key
AWS_REGION: ap-northeast-1
CDK_DEFAULT_ACCOUNT: your-account-id
```

#### ワークフロー実行
```bash
# プルリクエスト作成時
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature
# → 自動テスト・品質チェック実行

# メインブランチマージ時
git checkout main
git merge feature/new-feature
git push origin main
# → 自動デプロイ実行
```

## 🧪 デプロイ後検証

### 基本動作確認

#### ヘルスチェック
```bash
# API エンドポイント確認
curl https://your-domain.com/api/health

# 期待レスポンス
{
  "status": "healthy",
  "timestamp": "2025-10-02T10:35:00Z",
  "services": {
    "database": "healthy",
    "search": "healthy",
    "storage": "healthy"
  }
}
```

#### 統合テスト実行
```bash
# 基本統合テスト
./development/scripts/testing/quick_integration_test.sh

# 包括的テスト
./development/scripts/testing/phase_5_final_integration_test.sh

# セキュリティテスト
./development/scripts/testing/security_scan_integration_test.sh

# Markitdown統合機能テスト
npx ts-node config/test-markitdown-config.ts

# 文書処理パイプラインテスト
curl -X POST https://your-domain.com/api/documents/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-document.docx" \
  -F "processingStrategy=markitdown-first"
```

#### Markitdown機能の動作確認

**サポートファイル形式の確認**
```bash
# サポートされるファイル形式一覧取得
curl https://your-domain.com/api/markitdown/supported-formats

# 期待レスポンス
{
  "supportedFormats": {
    "docx": {
      "enabled": true,
      "processingStrategy": "markitdown-first",
      "description": "Microsoft Word文書"
    },
    "pdf": {
      "enabled": true,
      "processingStrategy": "both-compare",
      "description": "PDF文書（OCR対応）"
    }
  }
}
```

**処理方法の動的変更テスト**
```bash
# PDF処理戦略を品質比較モードに変更
curl -X PUT https://your-domain.com/api/markitdown/config \
  -H "Content-Type: application/json" \
  -d '{
    "format": "pdf",
    "processingStrategy": "both-compare",
    "enableQualityComparison": true
  }'

# 設定変更の確認
curl https://your-domain.com/api/markitdown/config/pdf
```

**処理追跡情報の確認**
```bash
# 処理統計の取得
curl https://your-domain.com/api/markitdown/stats

# 期待レスポンス
{
  "totalFiles": 150,
  "markitdownFiles": 95,
  "langchainFiles": 55,
  "averageProcessingTime": 2500,
  "formatStats": {
    "docx": {
      "count": 45,
      "markitdownUsage": 45,
      "averageProcessingTime": 1800
    }
  }
}
```

### パフォーマンステスト

#### 負荷テスト
```bash
# Apache Bench による負荷テスト
ab -n 1000 -c 10 https://your-domain.com/api/search

# 期待結果
# - レスポンス時間: < 500ms
# - 成功率: > 99%
# - スループット: > 100 req/sec
```

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. CDK Bootstrap エラー
```bash
# エラー: Bootstrap stack version mismatch
# 解決策: Bootstrap を再実行
cdk bootstrap --force --profile your-profile
```

#### 2. Lambda デプロイエラー
```bash
# エラー: Code size exceeds limit
# 解決策: 依存関係の最適化
npm run build:optimize

# または Layer を使用
cdk deploy --context useLayer=true
```

#### 3. FSx 作成エラー
```bash
# エラー: Insufficient subnet capacity
# 解決策: 別のAZを指定
cdk deploy --context availabilityZone=ap-northeast-1c
```

#### 4. OpenSearch 接続エラー
```bash
# エラー: Access denied
# 解決策: セキュリティポリシー確認
aws opensearchserverless get-security-policy \
  --name your-collection-name \
  --type data
```

#### 5. Markitdown設定エラー
```bash
# エラー: Markitdown configuration validation failed
# 解決策: 設定ファイルの検証と修正
./scripts/validate-markitdown-config.sh

# 設定ファイルの構文チェック
jq . config/markitdown-config.json

# 環境別設定の確認
jq . config/environments/markitdown-overrides.json
```

#### 6. 文書変換エラー
```bash
# エラー: Document conversion failed
# 解決策: 処理戦略の確認と変更

# 現在の処理戦略確認
curl https://your-domain.com/api/markitdown/config/pdf

# フォールバック戦略に変更
curl -X PUT https://your-domain.com/api/markitdown/config \
  -H "Content-Type: application/json" \
  -d '{
    "format": "pdf",
    "processingStrategy": "langchain-first",
    "fallback": {
      "enabled": true,
      "useLangChainOnFailure": true
    }
  }'
```

#### 7. DynamoDB追跡テーブルエラー
```bash
# エラー: Tracking table not found
# 解決策: 追跡テーブルの作成確認
aws dynamodb describe-table --table-name EmbeddingProcessingTracking

# テーブルが存在しない場合は作成
cdk deploy EmbeddingTrackingStack
```

#### 8. OCR処理タイムアウト
```bash
# エラー: OCR processing timeout
# 解決策: タイムアウト時間の調整

# 現在のタイムアウト設定確認
curl https://your-domain.com/api/markitdown/config/png

# タイムアウト時間延長
curl -X PUT https://your-domain.com/api/markitdown/config \
  -H "Content-Type: application/json" \
  -d '{
    "format": "png",
    "timeout": 180,
    "ocr": true
  }'
```

### ログ確認方法

#### CloudWatch Logs
```bash
# Lambda ログ確認
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/

# 最新ログ取得
aws logs tail /aws/lambda/your-function-name --follow
```

#### X-Ray トレース
```bash
# トレース一覧取得
aws xray get-trace-summaries \
  --time-range-type TimeRangeByStartTime \
  --start-time 2025-10-02T10:00:00 \
  --end-time 2025-10-02T11:00:00
```

## 🔄 アップデート・メンテナンス

### 定期メンテナンス

#### 依存関係更新
```bash
# パッケージ更新確認
npm outdated

# セキュリティ更新
npm audit fix

# CDK 更新
npm install -g aws-cdk@latest
```

#### バックアップ確認
```bash
# DynamoDB バックアップ確認
aws dynamodb list-backups --table-name your-table-name

# FSx スナップショット確認
aws fsx describe-snapshots --filters Name=file-system-id,Values=fs-xxxxxxxxx
```

### ロールバック手順

#### 緊急ロールバック
```bash
# 前バージョンにロールバック
cdk deploy --rollback

# 特定バージョンにロールバック
cdk deploy --context version=v1.2.3
```

## 📊 監視・アラート設定

### CloudWatch アラーム

#### 重要メトリクス
- Lambda エラー率 > 1%
- DynamoDB スロットリング > 0
- OpenSearch クラスター状態 != Green
- FSx 使用率 > 80%

#### 通知設定
```bash
# SNS トピック作成
aws sns create-topic --name rag-system-alerts

# メール通知設定
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:rag-system-alerts \
  --protocol email \
  --notification-endpoint admin@your-domain.com
```

## 💰 コスト最適化

### コスト監視
- **予算アラート**: 月額予算の80%で通知
- **使用量監視**: 各サービスの使用量トラッキング
- **最適化提案**: AWS Cost Explorer による分析

### 節約のヒント
- **Lambda**: 適切なメモリサイズ設定
- **DynamoDB**: オンデマンド vs プロビジョンド選択
- **FSx**: 使用量に応じたストレージタイプ選択
- **OpenSearch**: 適切なインスタンスタイプ選択

---

**最終更新**: 2025/10/02 10:35:00  
**自動更新**: ドキュメント自動更新システムにより生成