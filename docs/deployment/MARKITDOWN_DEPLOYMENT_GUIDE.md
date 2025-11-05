# Markitdown統合機能 デプロイメントガイド

## 📋 概要

Permission-aware RAG SystemにおけるMicrosoft Markitdown統合機能の詳細デプロイメント手順書です。

## 🎯 デプロイメント戦略

### Phase 1: 基盤設定
1. 設定ファイルの準備
2. DynamoDB追跡テーブルの作成
3. Lambda環境変数の設定

### Phase 2: 段階的展開
1. 開発環境での検証
2. ステージング環境での統合テスト
3. 本番環境への段階的ロールアウト

### Phase 3: 運用最適化
1. パフォーマンス監視
2. 設定の動的調整
3. 品質評価とフィードバック

## 🚀 詳細デプロイメント手順

### Step 1: 前提条件の確認

#### 必要なパッケージ
```bash
# Node.js依存関係の確認
npm list typescript @types/node aws-cdk-lib

# 必要に応じてインストール
npm install --save-dev typescript @types/node
npm install aws-cdk-lib constructs
```

#### AWS権限の確認
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction",
        "secretsmanager:GetSecretValue",
        "bedrock:InvokeModel"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 2: 設定ファイルの準備

#### メイン設定ファイル作成
```bash
# メイン設定ファイルの作成
mkdir -p config
cat > config/markitdown-config.json << 'EOF'
{
  "markitdown": {
    "enabled": true,
    "supportedFormats": {
      "docx": {
        "enabled": true,
        "timeout": 30,
        "description": "Microsoft Word文書",
        "processingStrategy": "markitdown-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": false
      },
      "xlsx": {
        "enabled": true,
        "timeout": 45,
        "description": "Microsoft Excel文書",
        "processingStrategy": "markitdown-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": false
      },
      "pptx": {
        "enabled": true,
        "timeout": 60,
        "description": "Microsoft PowerPoint文書",
        "processingStrategy": "markitdown-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": false
      },
      "pdf": {
        "enabled": true,
        "timeout": 120,
        "ocr": true,
        "description": "PDF文書（OCR対応）",
        "processingStrategy": "both-compare",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": true
      },
      "png": {
        "enabled": true,
        "timeout": 90,
        "ocr": true,
        "description": "PNG画像（OCR対応）",
        "processingStrategy": "markitdown-only",
        "useMarkitdown": true,
        "useLangChain": false,
        "enableQualityComparison": false
      },
      "html": {
        "enabled": true,
        "timeout": 30,
        "description": "HTML文書",
        "processingStrategy": "langchain-first",
        "useMarkitdown": true,
        "useLangChain": true,
        "enableQualityComparison": false
      },
      "csv": {
        "enabled": true,
        "timeout": 15,
        "description": "CSV文書",
        "processingStrategy": "langchain-only",
        "useMarkitdown": false,
        "useLangChain": true,
        "enableQualityComparison": false
      }
    },
    "performance": {
      "maxFileSize": "10MB",
      "maxFileSizeBytes": 10485760,
      "memoryLimit": "1024MB",
      "memoryLimitMB": 1024,
      "parallelProcessing": true,
      "maxConcurrentProcesses": 3
    },
    "fallback": {
      "enabled": true,
      "useLangChainOnFailure": true,
      "retryAttempts": 2,
      "retryDelayMs": 1000
    },
    "security": {
      "validateFileType": true,
      "validateFileSize": true,
      "encryptTempFiles": true,
      "autoDeleteTempFiles": true,
      "tempFileRetentionMinutes": 30
    },
    "logging": {
      "level": "info",
      "enableDetailedLogs": true,
      "enablePerformanceLogs": true,
      "enableErrorTracking": true
    },
    "quality": {
      "ocrAccuracy": "high",
      "textExtractionQuality": "high",
      "preserveFormatting": true,
      "preserveImages": false
    }
  }
}
EOF
```

#### 環境別オーバーライド設定
```bash
# 環境別設定ディレクトリ作成
mkdir -p config/environments

# 環境別オーバーライド設定作成
cat > config/environments/markitdown-overrides.json << 'EOF'
{
  "dev": {
    "enabled": true,
    "supportedFormats": {
      "docx": {
        "enabled": true,
        "processingStrategy": "markitdown-only",
        "useMarkitdown": true,
        "useLangChain": false
      },
      "pdf": {
        "enabled": true,
        "processingStrategy": "langchain-only",
        "useMarkitdown": false,
        "useLangChain": true,
        "ocr": false
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
      "enableDetailedLogs": true
    }
  },
  "staging": {
    "enabled": true,
    "performance": {
      "maxFileSize": "8MB",
      "maxFileSizeBytes": 8388608,
      "parallelProcessing": true,
      "maxConcurrentProcesses": 2
    },
    "logging": {
      "level": "info",
      "enableDetailedLogs": true
    }
  },
  "prod": {
    "enabled": true,
    "performance": {
      "maxFileSize": "10MB",
      "maxFileSizeBytes": 10485760,
      "parallelProcessing": true,
      "maxConcurrentProcesses": 3
    },
    "fallback": {
      "retryAttempts": 3,
      "retryDelayMs": 2000
    },
    "security": {
      "tempFileRetentionMinutes": 15
    },
    "logging": {
      "level": "warn",
      "enableDetailedLogs": false
    }
  }
}
EOF
```

### Step 3: DynamoDB追跡テーブルの作成

#### CDKスタック定義
```bash
# 追跡テーブル用CDKスタック作成
mkdir -p lib/stacks
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

    // CloudWatch メトリクス
    new cdk.aws_cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: this.trackingTable.metricUserErrors(),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'High error rate in embedding tracking table'
    });
  }
}
EOF
```

#### テーブルデプロイ
```bash
# 追跡テーブルのデプロイ
cdk deploy EmbeddingTrackingStack

# テーブル作成確認
aws dynamodb describe-table --table-name EmbeddingProcessingTracking
```

### Step 4: Lambda関数の設定

#### 環境変数設定スクリプト
```bash
# Lambda環境変数設定スクリプト作成
cat > scripts/setup-lambda-env.sh << 'EOF'
#!/bin/bash

FUNCTION_NAME="your-document-processor-function"
ENVIRONMENT="prod"

echo "🔧 Lambda関数の環境変数を設定中..."

# Markitdown関連環境変数
aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --environment Variables='{
    "MARKITDOWN_ENABLED": "true",
    "MARKITDOWN_CONFIG_PATH": "/opt/config/markitdown-config.json",
    "MARKITDOWN_ENVIRONMENT": "'$ENVIRONMENT'",
    "MARKITDOWN_TRACKING_TABLE": "EmbeddingProcessingTracking",
    "MARKITDOWN_LOG_LEVEL": "info",
    "MARKITDOWN_MAX_FILE_SIZE": "10485760",
    "MARKITDOWN_PARALLEL_PROCESSING": "true",
    "MARKITDOWN_MAX_CONCURRENT": "3"
  }'

echo "✅ Lambda環境変数の設定が完了しました"
EOF

chmod +x scripts/setup-lambda-env.sh
```

#### Lambda Layer作成（オプション）
```bash
# Markitdown用Lambda Layer作成
mkdir -p layers/markitdown/nodejs
cd layers/markitdown/nodejs

# 必要なパッケージをインストール
npm init -y
npm install markitdown

# Layer作成
cd ../../..
zip -r markitdown-layer.zip layers/markitdown/

# Layer公開
aws lambda publish-layer-version \
  --layer-name markitdown-layer \
  --zip-file fileb://markitdown-layer.zip \
  --compatible-runtimes nodejs20.x \
  --description "Microsoft Markitdown library for document processing"
```

### Step 5: 段階的デプロイメント

#### 開発環境デプロイ
```bash
# 開発環境設定の検証
./scripts/validate-markitdown-config.sh

# 開発環境デプロイ
cdk deploy --all -c environment=dev -c markitdown=enabled

# 基本動作テスト
npx ts-node config/test-markitdown-config.ts
```

#### ステージング環境デプロイ
```bash
# ステージング環境デプロイ
cdk deploy --all -c environment=staging -c markitdown=enabled

# 統合テスト実行
npm run test:integration:markitdown --env staging

# パフォーマンステスト
npm run test:performance:markitdown --env staging
```

#### 本番環境デプロイ
```bash
# 本番環境デプロイ（Blue-Green方式）
cdk deploy --all -c environment=prod -c markitdown=enabled -c deployment=blue-green

# カナリアデプロイ（10%のトラフィック）
aws lambda update-alias \
  --function-name your-document-processor \
  --name LIVE \
  --routing-config AdditionalVersionWeights='{"2":0.1}'

# 監視とメトリクス確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=your-document-processor \
  --start-time 2025-10-19T00:00:00Z \
  --end-time 2025-10-19T23:59:59Z \
  --period 3600 \
  --statistics Average

# 問題なければ100%にロールアウト
aws lambda update-alias \
  --function-name your-document-processor \
  --name LIVE \
  --function-version 2
```

## 🧪 デプロイ後検証

### 基本機能テスト

#### 設定確認
```bash
# Markitdown設定の確認
curl https://your-domain.com/api/markitdown/config

# サポートファイル形式の確認
curl https://your-domain.com/api/markitdown/supported-formats
```

#### 文書処理テスト
```bash
# Word文書のテスト
curl -X POST https://your-domain.com/api/documents/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.docx" \
  -F "processingStrategy=markitdown-first"

# PDF文書のテスト（品質比較）
curl -X POST https://your-domain.com/api/documents/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.pdf" \
  -F "processingStrategy=both-compare"

# 画像ファイルのテスト（OCR）
curl -X POST https://your-domain.com/api/documents/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.png" \
  -F "processingStrategy=markitdown-only"
```

### パフォーマンステスト

#### 負荷テスト
```bash
# Apache Benchによる負荷テスト
ab -n 100 -c 10 -T 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
   -p test-upload.txt https://your-domain.com/api/documents/upload

# 期待結果
# - 平均応答時間: < 3秒
# - 成功率: > 95%
# - エラー率: < 5%
```

#### 同時処理テスト
```bash
# 複数ファイル同時処理テスト
for i in {1..10}; do
  curl -X POST https://your-domain.com/api/documents/upload \
    -H "Content-Type: multipart/form-data" \
    -F "file=@test$i.docx" &
done
wait

# 処理結果の確認
curl https://your-domain.com/api/markitdown/stats
```

## 🔧 運用設定

### 監視設定

#### CloudWatchアラーム
```bash
# 処理エラー率アラーム
aws cloudwatch put-metric-alarm \
  --alarm-name "MarkitdownHighErrorRate" \
  --alarm-description "Markitdown processing error rate is high" \
  --metric-name "ErrorRate" \
  --namespace "RAG/DocumentProcessing" \
  --statistic Average \
  --period 300 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# 処理時間アラーム
aws cloudwatch put-metric-alarm \
  --alarm-name "MarkitdownHighLatency" \
  --alarm-description "Markitdown processing latency is high" \
  --metric-name "ProcessingTime" \
  --namespace "RAG/DocumentProcessing" \
  --statistic Average \
  --period 300 \
  --threshold 5000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

#### ダッシュボード作成
```bash
# CloudWatchダッシュボード作成
aws cloudwatch put-dashboard \
  --dashboard-name "MarkitdownProcessing" \
  --dashboard-body file://dashboard-config.json
```

### 自動スケーリング設定

#### Lambda同時実行数制限
```bash
# Lambda同時実行数の設定
aws lambda put-provisioned-concurrency-config \
  --function-name your-document-processor \
  --qualifier LIVE \
  --provisioned-concurrency-count 10

# 予約同時実行数の設定
aws lambda put-reserved-concurrency \
  --function-name your-document-processor \
  --reserved-concurrency-count 100
```

## 🔄 ロールバック手順

### 緊急ロールバック
```bash
# 前バージョンへの即座ロールバック
aws lambda update-alias \
  --function-name your-document-processor \
  --name LIVE \
  --function-version 1

# Markitdown機能の無効化
curl -X PUT https://your-domain.com/api/markitdown/config \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# 設定の確認
curl https://your-domain.com/api/markitdown/config
```

### 段階的ロールバック
```bash
# トラフィックを段階的に前バージョンに戻す
aws lambda update-alias \
  --function-name your-document-processor \
  --name LIVE \
  --routing-config AdditionalVersionWeights='{"1":0.5}'

# 監視しながら完全ロールバック
aws lambda update-alias \
  --function-name your-document-processor \
  --name LIVE \
  --function-version 1
```

## 📊 成功指標

### KPI目標値
- **処理成功率**: > 95%
- **平均処理時間**: < 3秒
- **エラー率**: < 5%
- **可用性**: > 99.9%

### 品質指標
- **Markitdown処理品質**: > 85%
- **OCR精度**: > 90%
- **ユーザー満足度**: > 4.0/5.0

---

**最終更新**: 2025/10/19  
**バージョン**: 1.0.0  
**対象環境**: 開発・ステージング・本番  
**メンテナンス**: 開発チーム