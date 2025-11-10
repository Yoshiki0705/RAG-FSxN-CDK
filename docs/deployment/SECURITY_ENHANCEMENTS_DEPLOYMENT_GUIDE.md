# セキュリティ・ネットワーク強化機能 デプロイメントガイド

**最終更新**: 2025年11月10日  
**対象バージョン**: v1.0.0

## 📋 概要

このガイドでは、Permission-aware RAG FSxN CDKプロジェクトのセキュリティ・ネットワーク強化機能のデプロイ方法を説明します。

### 実装された機能

1. **FSx for ONTAP Backup無効化**（必須）
   - 自動バックアップの無効化
   - コスト削減効果: 約$50-100/月

2. **Cognito VPC Private接続**（オプション）
   - VPC Endpoint経由のCognito接続
   - Lambda関数の自動VPC配置
   - 追加コスト: 約$8.45/月

## 🎯 デプロイメントパターン

### パターン1: 開発環境（デフォルト）

**特徴**:
- FSx Backup無効化
- Public接続モード（Cognito）
- 追加コストなし

**推奨用途**: 開発環境、テスト環境

### パターン2: 本番環境（セキュリティ強化）

**特徴**:
- FSx Backup無効化
- Private接続モード（Cognito VPC Endpoint）
- セキュリティ強化

**推奨用途**: 本番環境、セキュリティ要件が厳格な環境

## 📦 前提条件

### 必須要件

- **AWS CLI**: バージョン2.x以上
- **Node.js**: バージョン20.x以上
- **AWS CDK**: バージョン2.129.0以上
- **TypeScript**: バージョン5.3以上
- **AWS認証情報**: 適切な権限を持つIAMユーザー/ロール

### 必要なIAM権限

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "ec2:*",
        "lambda:*",
        "s3:*",
        "fsx:*",
        "cognito-idp:*",
        "iam:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 環境確認

```bash
# AWS CLI確認
aws --version

# Node.js確認
node --version

# CDK確認
npx cdk --version

# AWS認証情報確認
aws sts get-caller-identity
```

## 🚀 デプロイ手順

### Step 1: プロジェクトのセットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd Permission-aware-RAG-FSxN-CDK

# 依存関係のインストール
npm install

# TypeScriptビルド
npm run build
```

### Step 2: CDKブートストラップ（初回のみ）

```bash
# CDKブートストラップ
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>

# 例: 東京リージョン
npx cdk bootstrap aws://123456789012/ap-northeast-1
```

### Step 3: パターン1 - 開発環境デプロイ

#### 3.1 設定確認

```bash
# cdk.jsonの確認
cat cdk.json | grep cognitoPrivateEndpoint
# 出力: "cognitoPrivateEndpoint": false
```

#### 3.2 デプロイ実行

```bash
# 全スタックデプロイ
npx cdk deploy --all

# または個別デプロイ
npx cdk deploy NetworkingStack
npx cdk deploy DataStack
npx cdk deploy WebAppStack
```

#### 3.3 デプロイ検証

```bash
# 統合検証スクリプト実行
./development/scripts/deployment/verify-security-enhancements.sh
```

**期待される結果**:
```
✅ PASS: FSx Backup無効化確認
⏭️  SKIP: Cognito VPC Endpoint確認（オプション機能）
✅ PASS: Lambda VPC配置確認（VPC外）
```

### Step 4: パターン2 - 本番環境デプロイ

#### 4.1 Cognito VPC Endpoint有効化

**方法1: コマンドライン引数（推奨）**

```bash
# NetworkingStackデプロイ（VPC Endpoint有効化）
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=true

# DataStackデプロイ
npx cdk deploy DataStack

# WebAppStackデプロイ（Lambda自動VPC配置）
npx cdk deploy WebAppStack -c cognitoPrivateEndpoint=true
```

**方法2: cdk.json編集（恒久的）**

```json
{
  "context": {
    "cognitoPrivateEndpoint": true
  }
}
```

```bash
# 全スタックデプロイ
npx cdk deploy --all
```

#### 4.2 デプロイ検証

```bash
# 統合検証スクリプト実行
./development/scripts/deployment/verify-security-enhancements.sh
```

**期待される結果**:
```
✅ PASS: FSx Backup無効化確認
✅ PASS: Cognito VPC Endpoint確認
✅ PASS: プライベートDNS有効化確認
✅ PASS: Lambda VPC配置確認（VPC内）
✅ PASS: COGNITO_CONNECTION_MODE確認（private）
```

## 🔄 モード切り替え

### Public → Private 切り替え

```bash
# 1. NetworkingStackを更新（VPC Endpoint追加）
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=true

# 2. WebAppStackを更新（Lambda VPC配置）
npx cdk deploy WebAppStack -c cognitoPrivateEndpoint=true

# 3. 検証
./development/scripts/deployment/verify-security-enhancements.sh
```

### Private → Public 切り替え

```bash
# 1. WebAppStackを更新（Lambda VPC外配置）
npx cdk deploy WebAppStack -c cognitoPrivateEndpoint=false

# 2. NetworkingStackを更新（VPC Endpoint削除）
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=false

# 3. 検証
./development/scripts/deployment/verify-security-enhancements.sh
```

## 📊 デプロイ時間とコスト

### デプロイ時間

| スタック | 初回デプロイ | 更新デプロイ |
|---|---|---|
| NetworkingStack | 5-10分 | 2-5分 |
| DataStack | 15-20分 | 5-10分 |
| WebAppStack | 5-10分 | 2-5分 |
| **合計** | **25-40分** | **9-20分** |

### コスト比較

#### パターン1: 開発環境

| 項目 | 月額コスト |
|---|---|
| FSx Backup（無効化） | $0 |
| VPC Endpoint | $0 |
| Lambda ENI | $0 |
| **合計** | **$0** |

**コスト削減効果**: 約$50-100/月（FSx Backup無効化）

#### パターン2: 本番環境

| 項目 | 月額コスト |
|---|---|
| FSx Backup（無効化） | $0 |
| VPC Endpoint | $7.30 |
| Lambda ENI（2個） | $0.15 |
| データ処理（100GB） | $1.00 |
| **合計** | **$8.45** |

**コスト削減効果**: 約$41.55-91.55/月（FSx Backup無効化 - VPC Endpoint追加コスト）

## 🔍 デプロイ後の確認

### 1. CloudFormationスタック確認

```bash
# スタック一覧表示
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?starts_with(StackName, `NetworkingStack`) || starts_with(StackName, `DataStack`) || starts_with(StackName, `WebAppStack`)].{Name:StackName, Status:StackStatus}' \
  --output table
```

### 2. FSx Backup設定確認

```bash
# FSx FileSystem ID取得
FSX_ID=$(aws cloudformation describe-stack-resources \
  --stack-name DataStack \
  --query 'StackResources[?ResourceType==`AWS::FSx::FileSystem`].PhysicalResourceId' \
  --output text)

# Backup設定確認
aws fsx describe-file-systems \
  --file-system-ids $FSX_ID \
  --query 'FileSystems[0].OntapConfiguration.AutomaticBackupRetentionDays'
```

**期待値**: `0`

### 3. Cognito VPC Endpoint確認

```bash
# VPC ID取得
VPC_ID=$(aws cloudformation describe-stack-resources \
  --stack-name NetworkingStack \
  --query 'StackResources[?ResourceType==`AWS::EC2::VPC`].PhysicalResourceId' \
  --output text)

# VPC Endpoint確認
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=$VPC_ID" \
            "Name=service-name,Values=com.amazonaws.ap-northeast-1.cognito-idp" \
  --query 'VpcEndpoints[0].{ID:VpcEndpointId, State:State, DNS:PrivateDnsEnabled}'
```

### 4. Lambda VPC設定確認

```bash
# Lambda関数名取得
LAMBDA_NAME=$(aws cloudformation describe-stack-resources \
  --stack-name WebAppStack \
  --query 'StackResources[?ResourceType==`AWS::Lambda::Function`].PhysicalResourceId' \
  --output text | head -n 1)

# VPC設定確認
aws lambda get-function-configuration \
  --function-name $LAMBDA_NAME \
  --query '{VpcId:VpcConfig.VpcId, ConnectionMode:Environment.Variables.COGNITO_CONNECTION_MODE}'
```

### 5. 統合検証

```bash
# 統合検証スクリプト実行
./development/scripts/deployment/verify-security-enhancements.sh
```

## 🛠️ トラブルシューティング

### 問題1: CDKデプロイ失敗

**症状**: `cdk deploy`コマンドがエラーで終了

**原因と解決策**:

1. **IAM権限不足**
   ```bash
   # 現在の権限確認
   aws iam get-user
   
   # 必要な権限を付与
   ```

2. **リソース制限**
   ```bash
   # VPC制限確認
   aws ec2 describe-account-attributes \
     --attribute-names max-elastic-ips
   
   # サービスクォータ引き上げリクエスト
   ```

3. **既存リソースの競合**
   ```bash
   # 既存スタック確認
   aws cloudformation list-stacks
   
   # 競合するスタックを削除
   npx cdk destroy <stack-name>
   ```

### 問題2: VPC Endpoint作成失敗

**症状**: Cognito VPC Endpointが作成されない

**原因と解決策**:

1. **サブネット不足**
   ```bash
   # サブネット確認
   aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID"
   
   # 最低2つのAZにサブネットが必要
   ```

2. **セキュリティグループ設定**
   ```bash
   # セキュリティグループ確認
   aws ec2 describe-security-groups \
     --filters "Name=vpc-id,Values=$VPC_ID"
   ```

### 問題3: Lambda関数がVPC内に配置されない

**症状**: Cognito VPC Endpoint有効時にLambda関数がVPC外に配置される

**原因と解決策**:

1. **コンテキスト変数の確認**
   ```bash
   # cdk.jsonの確認
   cat cdk.json | grep cognitoPrivateEndpoint
   
   # コマンドライン引数で明示的に指定
   npx cdk deploy WebAppStack -c cognitoPrivateEndpoint=true
   ```

2. **Lambda関数の再デプロイ**
   ```bash
   # WebAppStackを再デプロイ
   npx cdk deploy WebAppStack --force
   ```

### 問題4: DNS解決失敗

**症状**: Cognito DNS名が解決できない

**原因と解決策**:

1. **プライベートDNS確認**
   ```bash
   # VPC EndpointのプライベートDNS確認
   aws ec2 describe-vpc-endpoints \
     --vpc-endpoint-ids $ENDPOINT_ID \
     --query 'VpcEndpoints[0].PrivateDnsEnabled'
   
   # 期待値: true
   ```

2. **VPC DNS設定確認**
   ```bash
   # VPC DNS設定確認
   aws ec2 describe-vpc-attribute \
     --vpc-id $VPC_ID \
     --attribute enableDnsHostnames
   
   # enableDnsHostnames: true が必要
   ```

## 📚 関連ドキュメント

### 設定ガイド
- [Cognito VPC Endpoint設定ガイド](../configuration/COGNITO_VPC_ENDPOINT_CONFIGURATION.md)
- [Lambda VPC設定ガイド](../configuration/LAMBDA_VPC_CONFIGURATION.md)

### 運用ガイド
- [運用ガイド](../operations/SECURITY_ENHANCEMENTS_OPERATIONS_GUIDE.md)（作成予定）

### 開発ドキュメント
- [要件定義書](../../.kiro/specs/security-network-enhancements/requirements.md)
- [設計書](../../.kiro/specs/security-network-enhancements/design.md)
- [タスクリスト](../../.kiro/specs/security-network-enhancements/tasks.md)

## 🔄 ロールバック手順

### 緊急ロールバック

```bash
# 1. 最新のデプロイを確認
aws cloudformation describe-stacks \
  --stack-name WebAppStack \
  --query 'Stacks[0].LastUpdatedTime'

# 2. スタックをロールバック
aws cloudformation rollback-stack --stack-name WebAppStack

# 3. ロールバック状態確認
aws cloudformation describe-stacks \
  --stack-name WebAppStack \
  --query 'Stacks[0].StackStatus'
```

### 段階的ロールバック

```bash
# 1. WebAppStackをPublicモードに戻す
npx cdk deploy WebAppStack -c cognitoPrivateEndpoint=false

# 2. NetworkingStackからVPC Endpointを削除
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=false

# 3. 検証
./development/scripts/deployment/verify-security-enhancements.sh
```

## ✅ デプロイチェックリスト

### デプロイ前

- [ ] AWS認証情報の確認
- [ ] IAM権限の確認
- [ ] リージョン設定の確認
- [ ] cdk.jsonの設定確認
- [ ] 依存関係のインストール
- [ ] TypeScriptビルド成功

### デプロイ中

- [ ] CDKブートストラップ完了
- [ ] NetworkingStackデプロイ成功
- [ ] DataStackデプロイ成功
- [ ] WebAppStackデプロイ成功

### デプロイ後

- [ ] CloudFormationスタック確認
- [ ] FSx Backup設定確認
- [ ] Cognito VPC Endpoint確認（オプション）
- [ ] Lambda VPC設定確認
- [ ] 統合検証スクリプト実行
- [ ] アプリケーション動作確認

## 📝 備考

### デプロイのベストプラクティス

1. **段階的デプロイ**: 開発環境 → ステージング環境 → 本番環境
2. **検証の徹底**: 各ステップで検証スクリプトを実行
3. **ロールバック計画**: 問題発生時の対応手順を事前に準備
4. **コスト監視**: デプロイ後のコスト変化を監視

### セキュリティ考慮事項

1. **IAM権限**: 最小権限の原則に従う
2. **VPC設定**: プライベートサブネットの使用
3. **セキュリティグループ**: 必要最小限のルール
4. **ログ監視**: CloudWatch Logsの有効化

---

**最終更新**: 2025年11月10日  
**作成者**: Kiro AI Assistant  
**バージョン**: 1.0.0
