# デプロイメントガイド

## 📋 概要

Permission-aware RAG System with FSx for NetApp ONTAPのデプロイメント手順を説明します。新しい統合デプロイメントシステムにより、`cdk deploy --all`で全スタックを一括デプロイできます。

## 🏗️ 統合デプロイメントアーキテクチャ

### 現在利用可能なスタック

```
統合デプロイメント構成:
MinimalIntegratedStack ✅ 推奨・統合機能
    ├── セキュリティ機能（KMS、WAF、CloudTrail）
    └── ネットワーキング機能（VPC、サブネット）

MinimalProductionStack ✅ 本番対応
    ├── DynamoDB（セッション管理）
    ├── S3（ドキュメント・埋め込み）
    └── Lambda（API処理）
```

## 🚀 クイックスタート

### 1. 環境準備

```bash
# リポジトリクローン
git clone <repository-url>
cd Permission-aware-RAG-FSxN-CDK

# 依存関係インストール
npm install

# TypeScriptビルド
npm run build
```

### 2. AWS環境設定

```bash
# AWS CLI設定確認
aws sts get-caller-identity

# CDK Bootstrap（初回のみ）
cdk bootstrap --profile your-profile --region ap-northeast-1
```

### 3. 全スタック一括デプロイ（推奨）

```bash
# 全スタックを一括デプロイ
cdk deploy --all

# または npm スクリプト使用
npm run deploy:all

# 開発環境向け
npm run deploy:all:dev

# 本番環境向け
npm run deploy:all:prod
```

### 4. 選択的デプロイ

```bash
# 統合スタックのみ
npm run deploy:integrated-only

# プロダクションスタックのみ
npm run deploy:production-only

# 特定スタック指定
cdk deploy rag-system-dev-minimal-integrated
cdk deploy rag-system-dev-minimal-production
```

### 5. Markitdown統合機能の有効化（オプション）

```bash
# Markitdown統合機能付きデプロイ
cdk deploy --all -c markitdown=enabled

# 設定ファイルの準備
cp config/markitdown-config.json.template config/markitdown-config.json

# 環境変数設定
export MARKITDOWN_ENABLED=true
export MARKITDOWN_CONFIG_PATH=./config/markitdown-config.json

# 詳細な設定手順は以下を参照
# docs/deployment/MARKITDOWN_DEPLOYMENT_GUIDE.md
```

## 📊 現在のデプロイ状況

### ✅ 利用可能なスタック

#### MinimalIntegratedStack（推奨・統合機能）✅
- **セキュリティ機能**:
  - KMS暗号化キー（キーローテーション有効）
  - WAF WebACL（レート制限・AWS管理ルール）
  - CloudTrail（S3・CloudWatch Logs統合）
- **ネットワーキング機能**:
  - VPC（マルチAZ構成）
  - プライベート・パブリックサブネット
  - インターネットゲートウェイ・NATゲートウェイ

#### MinimalProductionStack（本番対応）✅
- **データベース**: DynamoDB（セッション管理・バックアップ有効）
- **ストレージ**: S3バケット（ドキュメント・埋め込み用）
- **コンピュート**: Lambda関数（API処理・認証）
- **監視**: CloudWatch Logs・メトリクス

```bash
# 全スタック確認
cdk list

# 特定スタック確認
aws cloudformation describe-stacks --stack-name rag-system-dev-minimal-integrated
aws cloudformation describe-stacks --stack-name rag-system-dev-minimal-production

# CDK Synthテスト（検証用）
cdk synth --all
```

### 🎯 デプロイメント戦略

#### 推奨デプロイメント順序
1. **一括デプロイ**: `cdk deploy --all`（推奨）
2. **段階的デプロイ**: 統合スタック → プロダクションスタック
3. **選択的デプロイ**: 必要な機能のみ有効化

## 🌍 環境別デプロイメント

### 開発環境（推奨）

```bash
# 開発環境全スタックデプロイ
cdk deploy --all -c environment=dev

# または npm スクリプト使用
npm run deploy:all:dev

# 設定確認
cdk list -c environment=dev
```

### 本番環境

```bash
# 本番環境用設定
export AWS_PROFILE=prod
export AWS_REGION=ap-northeast-1

# 本番環境全スタックデプロイ
cdk deploy --all -c environment=prod

# または npm スクリプト使用
npm run deploy:all:prod
```

### カスタム設定デプロイ

```bash
# プロジェクト名・リージョン指定
cdk deploy --all \
  -c projectName=my-rag-system \
  -c environment=staging \
  -c region=us-east-1

# 機能選択デプロイ
cdk deploy --all \
  -c enableIntegrated=true \
  -c enableProduction=false
```

## 🔧 設定管理

### デプロイメント設定

新しい統合デプロイメントシステムでは、コンテキスト変数で設定を制御します：

```bash
# 基本設定
cdk deploy --all \
  -c projectName=rag-system \
  -c environment=dev \
  -c region=us-east-1

# 機能制御
cdk deploy --all \
  -c enableIntegrated=true \    # 統合スタック有効
  -c enableProduction=true      # プロダクションスタック有効
```

### 利用可能なコンテキスト変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `projectName` | `rag-system` | プロジェクト名 |
| `environment` | `dev` | 環境名（dev/staging/prod） |
| `region` | `us-east-1` | AWSリージョン |
| `enableIntegrated` | `true` | 統合スタック有効化 |
| `enableProduction` | `true` | プロダクションスタック有効化 |

### 設定例

```bash
# 開発環境（両スタック有効）
cdk deploy --all -c environment=dev

# ステージング環境（統合スタックのみ）
cdk deploy --all \
  -c environment=staging \
  -c enableIntegrated=true \
  -c enableProduction=false

# 本番環境（全機能有効）
cdk deploy --all \
  -c environment=prod \
  -c region=ap-northeast-1
```

## 📋 デプロイメント前チェックリスト

### 必須確認事項

- [ ] AWS CLI設定済み（`aws sts get-caller-identity`）
- [ ] 適切なIAM権限設定済み
- [ ] CDK Bootstrap実行済み（`cdk bootstrap`）
- [ ] Node.js 20+ インストール済み
- [ ] 依存関係インストール済み（`npm install`）

### デプロイメント確認

```bash
# 1. スタック一覧確認
cdk list

# 期待される出力:
# rag-system-dev-minimal-integrated
# rag-system-dev-minimal-production

# 2. 設定確認（Dry Run）
cdk synth --all

# 3. 差分確認
cdk diff --all
```

### セキュリティチェック

- [ ] KMS キー権限確認
- [ ] WAF ルール設定確認
- [ ] CloudTrail ログ設定確認
- [ ] S3 バケット暗号化確認
- [ ] DynamoDB暗号化確認

## 🚨 トラブルシューティング

### よくある問題

#### 1. CDK Bootstrap未実行
```bash
Error: Need to perform AWS CDK bootstrap

# 解決方法
cdk bootstrap --profile your-profile --region ap-northeast-1
```

#### 2. IAM権限不足
```bash
Error: User is not authorized to perform: iam:CreateRole

# 必要な権限
- IAMFullAccess
- KMSFullAccess
- WAFv2FullAccess
- CloudTrailFullAccess
- S3FullAccess
- CloudWatchLogsFullAccess
```

#### 3. TypeScriptコンパイルエラー
```bash
# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install

# TypeScriptビルド
npm run build
```

## 📊 デプロイメント監視

### CloudFormationスタック確認

```bash
# 全スタック一覧
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# 統合スタック詳細
aws cloudformation describe-stacks --stack-name rag-system-dev-minimal-integrated

# プロダクションスタック詳細
aws cloudformation describe-stacks --stack-name rag-system-dev-minimal-production

# スタックイベント確認
aws cloudformation describe-stack-events --stack-name rag-system-dev-minimal-integrated
```

### リソース確認

#### 統合スタック（MinimalIntegratedStack）
```bash
# KMS キー確認
aws kms list-aliases --query 'Aliases[?contains(AliasName, `rag-system`)]'

# WAF WebACL確認
aws wafv2 list-web-acls --scope REGIONAL

# VPC確認
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=rag-system"
```

#### プロダクションスタック（MinimalProductionStack）
```bash
# DynamoDB テーブル確認
aws dynamodb list-tables --query 'TableNames[?contains(@, `rag-system`)]'

# S3 バケット確認
aws s3 ls | grep rag-system

# Lambda 関数確認
aws lambda list-functions --query 'Functions[?contains(FunctionName, `rag-system`)]'
```

## 🔄 ロールバック手順

### 全スタックロールバック

```bash
# 全スタック削除
cdk destroy --all

# 確認
aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE
```

### 個別スタックロールバック

```bash
# 統合スタックのみ削除
cdk destroy rag-system-dev-minimal-integrated

# プロダクションスタックのみ削除
cdk destroy rag-system-dev-minimal-production

# 確認
cdk list
```

### 緊急ロールバック

```bash
# 強制削除（リソース保護無効化）
cdk destroy --all --force

# 特定リソースの手動削除が必要な場合
aws cloudformation delete-stack --stack-name <stack-name>
```

## 📈 利用可能なデプロイメントコマンド

### NPMスクリプト

```bash
# 基本デプロイメント
npm run deploy:all              # 全スタック一括デプロイ
npm run deploy:all:dev          # 開発環境向けデプロイ
npm run deploy:all:prod         # 本番環境向けデプロイ

# 選択的デプロイメント
npm run deploy:integrated-only  # 統合スタックのみ
npm run deploy:production-only  # プロダクションスタックのみ
```

### CDKコマンド

```bash
# 基本コマンド
cdk list                        # スタック一覧表示
cdk synth --all                 # 全スタック合成
cdk diff --all                  # 全スタック差分表示
cdk deploy --all                # 全スタックデプロイ
cdk destroy --all               # 全スタック削除

# 個別スタック操作
cdk deploy rag-system-dev-minimal-integrated
cdk deploy rag-system-dev-minimal-production
cdk destroy rag-system-dev-minimal-integrated
```

### 高度なオプション

```bash
# プロファイル指定
cdk deploy --all --profile production

# 承認スキップ
cdk deploy --all --require-approval never

# 並行デプロイ
cdk deploy --all --concurrency 2

# ロールバック無効化
cdk deploy --all --no-rollback
```

## 📚 関連ドキュメント

- [モジュラーアーキテクチャ完了レポート](./MODULAR_ARCHITECTURE_COMPLETION_REPORT.md)
- [セキュリティ実装ガイド](./SECURITY_IMPLEMENTATION_GUIDE.md)
- [TypeScript設定ガイド](./configuration/TYPESCRIPT_CONFIGURATION_GUIDE.md)
- [Markitdown統合機能デプロイメントガイド](./deployment/MARKITDOWN_DEPLOYMENT_GUIDE.md) ⭐ **新規追加**
- [トラブルシューティングガイド](./TROUBLESHOOTING_GUIDE.md)

## 🎯 デプロイメント成功の確認

### デプロイ後確認手順

```bash
# 1. スタック状態確認
cdk list

# 2. リソース作成確認
aws cloudformation describe-stacks --stack-name rag-system-dev-minimal-integrated --query 'Stacks[0].StackStatus'
aws cloudformation describe-stacks --stack-name rag-system-dev-minimal-production --query 'Stacks[0].StackStatus'

# 3. 主要リソース確認
aws dynamodb list-tables | grep rag-system
aws s3 ls | grep rag-system
aws lambda list-functions --query 'Functions[?contains(FunctionName, `rag-system`)].FunctionName'
```

### 期待される結果

- **スタック状態**: `CREATE_COMPLETE` または `UPDATE_COMPLETE`
- **DynamoDBテーブル**: セッション管理用テーブル作成済み
- **S3バケット**: ドキュメント・埋め込み用バケット作成済み
- **Lambda関数**: API処理用関数作成済み
- **VPC**: マルチAZ構成のVPC作成済み
- **セキュリティ**: KMS・WAF・CloudTrail設定済み

---

**最終更新**: 2025年10月17日  
**対応状況**: 統合デプロイメントシステム完了・`cdk deploy --all`対応  
**利用可能機能**: MinimalIntegratedStack + MinimalProductionStack