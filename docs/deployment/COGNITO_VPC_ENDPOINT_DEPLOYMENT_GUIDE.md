# Cognito VPC Endpoint デプロイメントガイド

**最終更新**: 2025年11月10日  
**対象環境**: 東京リージョン (ap-northeast-1)

## 📋 概要

このガイドでは、Cognito VPC Endpointを使用した閉域網認証の設定とデプロイ方法を説明します。

## 🎯 デプロイモード

### Public接続モード（デフォルト）
- Cognito VPC Endpointを作成しない
- インターネット経由でCognito User Poolsに接続
- コスト: 追加コストなし
- 用途: 開発環境、テスト環境

### Private接続モード（オプション）
- Cognito VPC Endpointを作成
- VPC内からCognito User Poolsに閉域網接続
- コスト: VPC Endpoint時間料金 + データ転送料金
- 用途: 本番環境、セキュリティ要件が厳格な環境

## 🏗️ アーキテクチャ

### 実装済みコンポーネント

1. **CognitoVpcEndpoint** (`lib/modules/networking/constructs/cognito-vpc-endpoint.ts`)
   - Interface VPC Endpoint作成
   - プライベートDNS有効化
   - CDKコンテキスト変数対応

2. **CognitoEndpointSecurityGroup** (`lib/modules/security/constructs/cognito-endpoint-security-group.ts`)
   - VPC内からのHTTPS（443）通信許可
   - セキュリティグループルール設定

3. **NetworkingConstruct統合** (`lib/modules/networking/constructs/networking-construct.ts`)
   - 自動的にCognito VPC Endpointを統合
   - CDKコンテキスト変数で有効/無効を制御

## 📦 デプロイ手順

### 前提条件

- AWS CLI設定完了
- CDK CLI インストール済み
- Node.js 20+ インストール済み
- プロジェクトディレクトリに移動済み

### 環境変数設定

```bash
export PROJECT_NAME="permission-aware-rag"
export ENVIRONMENT="prod"
export CDK_DEFAULT_ACCOUNT="178625946981"
export CDK_DEFAULT_REGION="ap-northeast-1"
export AWS_DEFAULT_REGION="ap-northeast-1"
export AWS_REGION="ap-northeast-1"
```

### Public接続モード（デフォルト）

```bash
# 1. TypeScriptビルド
npm run build

# 2. CDK差分確認
npx cdk diff NetworkingStack

# 3. デプロイ実行
npx cdk deploy NetworkingStack --require-approval never
```

### Private接続モード（Cognito VPC Endpoint有効化）

```bash
# 1. TypeScriptビルド
npm run build

# 2. CDK差分確認（Cognito VPC Endpoint有効）
npx cdk diff NetworkingStack -c cognitoPrivateEndpoint=true

# 3. デプロイ実行
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=true --require-approval never
```

### 統合デプロイスクリプト使用

```bash
# Public接続モード
./development/scripts/deployment/deploy-integrated-stacks.sh

# Private接続モード
./development/scripts/deployment/deploy-integrated-stacks.sh true
```

## 🔍 デプロイ検証

### VPC Endpoint確認

```bash
# 検証スクリプト実行
./development/scripts/deployment/verify-cognito-vpc-endpoint.sh
```

### 手動確認

```bash
# VPC Endpoint一覧
aws ec2 describe-vpc-endpoints \
    --region ap-northeast-1 \
    --filters "Name=service-name,Values=com.amazonaws.ap-northeast-1.cognito-idp" \
    --query 'VpcEndpoints[].{ID:VpcEndpointId, State:State, DNS:PrivateDnsEnabled}' \
    --output table

# DNS エントリ確認
aws ec2 describe-vpc-endpoints \
    --region ap-northeast-1 \
    --vpc-endpoint-ids vpce-xxxxx \
    --query 'VpcEndpoints[0].DnsEntries[].DnsName' \
    --output table
```

## 🔄 モード切り替え

### Public → Private への切り替え

```bash
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=true
```

### Private → Public への切り替え

```bash
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=false
# または
npx cdk deploy NetworkingStack
```

## 🧹 Minimalスタックのクリーンアップ

既存のMinimalNetworkingStackとMinimalDataStackを削除して、統合スタックに移行する場合：

```bash
# クリーンアップスクリプト実行
./development/scripts/deployment/cleanup-minimal-stacks.sh
```

**注意**: このスクリプトは以下を削除します：
- MinimalNetworkingStack
- MinimalDataStack

削除前に、必ずバックアップを取得してください。

## 💰 コスト分析

### Public接続モード
- **追加コスト**: $0/月
- **特徴**: インターネット経由接続、NAT Gateway経由

### Private接続モード
- **VPC Endpoint時間料金**: $0.01/時間 × 730時間/月 = $7.30/月
- **データ処理料金**: $0.01/GB × 月間データ転送量
- **例**: 100GB/月の場合、$7.30 + $1.00 = $8.30/月

## 🔧 トラブルシューティング

### VPC Endpointが作成されない

**原因**: CDKコンテキスト変数が設定されていない

**解決策**:
```bash
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=true
```

### DNS解決エラー

**原因**: プライベートDNSが無効

**解決策**:
1. VPC設定確認: `enableDnsHostnames: true`, `enableDnsSupport: true`
2. VPC Endpoint再作成

### Lambda関数からの接続エラー

**原因**: Lambda関数がVPC外に配置されている

**解決策**:
1. Lambda関数をVPC内に配置
2. セキュリティグループ設定確認

## 📝 次のステップ

1. **Lambda関数のVPC設定更新** (Task 2.9)
   - Cognito Private Endpoint有効時のみLambda関数をVPC内に配置
   - 環境変数での接続モード通知

2. **統合テスト実行**
   - 認証フローのE2Eテスト
   - パフォーマンステスト

3. **モニタリング設定**
   - CloudWatch Metricsダッシュボード作成
   - CloudWatch Alarms設定

## 📚 関連ドキュメント

- [要件定義書](.kiro/specs/security-network-enhancements/requirements.md)
- [設計書](.kiro/specs/security-network-enhancements/design.md)
- [タスクリスト](.kiro/specs/security-network-enhancements/tasks.md)
- [EC2デプロイ完了レポート](../../development/docs/completion/ec2-deployment-completion-20251110.md)

## ✅ 完了チェックリスト

- [ ] 環境変数設定完了
- [ ] TypeScriptビルド成功
- [ ] CDK差分確認完了
- [ ] NetworkingStackデプロイ成功
- [ ] VPC Endpoint動作確認完了
- [ ] DNS解決テスト完了
- [ ] 認証フローテスト完了

