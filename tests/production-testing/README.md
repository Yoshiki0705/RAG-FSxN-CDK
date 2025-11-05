# AWS東京リージョン本番環境 Chatbot UIテストシステム

## 概要

Permission-aware RAG System with FSx for NetApp ONTAPのChatbot UIについて、AWS東京リージョン（ap-northeast-1）の**実本番環境**で実施する包括的テストシステムです。

## 🚨 重要な制約事項

**実環境テスト必須**: 全てのテストは実際のAWS本番リソースを使用して実行します。モック環境、テスト環境、シミュレーション環境は一切使用しません。

## 🏗️ システム構成

### コアコンポーネント

- **ProductionTestEngine**: テスト実行の中核エンジン
- **ProductionConnectionManager**: 実本番AWSリソースへの安全な接続管理
- **EmergencyStopManager**: 異常検出時の緊急停止機能
- **ProductionConfig**: 本番環境設定管理

### テストモジュール

1. **認証テスト**: 実本番Cognitoでの認証検証
2. **アクセス権限テスト**: 実本番IAM/OpenSearchでの権限検証
3. **AI応答品質テスト**: 実本番Bedrockでの応答生成検証
4. **パフォーマンステスト**: 実本番環境での負荷・応答時間測定
5. **UI/UXテスト**: Kiro MCP Chrome DevToolsでの実ブラウザテスト
6. **セキュリティテスト**: 実本番WAF/CloudFrontでのセキュリティ検証
7. **統合テスト**: エンドツーエンドでの全機能連携検証
8. **データ整合性テスト**: 実本番データでの整合性保証

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd tests/production-testing
npm install
```

### 2. 本番環境設定

```bash
# 設定ファイルのコピー
cp .env.production.example .env.production

# 実際の本番リソース情報を設定
vi .env.production
```

### 3. 必須環境変数

```bash
# AWS基本設定
AWS_REGION=ap-northeast-1
AWS_PROFILE=user01

# 実本番リソースID（実際の値に置き換え）
PROD_CLOUDFRONT_DISTRIBUTION=E1234567890ABC
PROD_COGNITO_USER_POOL=ap-northeast-1_XXXXXXXXX
PROD_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
PROD_OPENSEARCH_DOMAIN=prod-rag-opensearch
PROD_DYNAMODB_SESSION_TABLE=prod-rag-sessions
PROD_FSX_FILE_SYSTEM=fs-0123456789abcdef0

# 安全性設定（必須）
SAFETY_MODE=true
READ_ONLY_MODE=true
EMERGENCY_STOP_ENABLED=true
```

### 4. TypeScriptビルド

```bash
npm run build
```

## 🧪 テスト実行

### 基本テスト

```bash
# 本番環境接続テスト
npm run test:connection

# 認証システムテスト
npm run test:auth

# AI応答品質テスト
npm run test:ai

# パフォーマンステスト
npm run test:performance

# UI/UXテスト
npm run test:ui

# セキュリティテスト
npm run test:security

# 統合テスト
npm run test:integration
```

### 包括的テスト

```bash
# 全テストの実行
npm run test:all
```

## 🛡️ 安全性保証

### 読み取り専用モード

- 全てのテストは読み取り専用で実行
- データの変更は一切行わない
- リソースの作成・削除は禁止

### 緊急停止機能

- 異常検出時の自動停止
- 手動での緊急停止要求
- データ整合性の保証

### 監視機能

- リアルタイム実行監視
- CloudWatchメトリクス送信
- 詳細ログ記録

## 📊 テスト結果

### 出力ファイル

- `test-results/`: テスト結果の詳細レポート
- `logs/`: 実行ログファイル
- `screenshots/`: UI/UXテストのスクリーンショット
- `metrics/`: パフォーマンスメトリクス

### レポート形式

- JSON形式の詳細結果
- HTML形式のサマリーレポート
- CloudWatchダッシュボード

## 🔧 開発・デバッグ

### 開発モード

```bash
npm run dev
```

### ログレベル設定

```bash
# 環境変数でログレベルを制御
export LOG_LEVEL=debug
npm run test:all
```

### 個別テストの実行

```bash
# TypeScriptで直接実行
npx ts-node src/modules/authentication/authentication-test.ts
```

## 📋 設定詳細

### ProductionConfig

```typescript
interface ProductionConfig {
  region: 'ap-northeast-1';
  environment: 'production';
  awsProfile: string;
  safetyMode: boolean;        // 必須: true
  readOnlyMode: boolean;      // 必須: true
  emergencyStopEnabled: boolean; // 必須: true
  resources: ProductionResources;
  execution: ExecutionConfig;
  monitoring: MonitoringConfig;
}
```

### 実行制限

- 最大同時実行テスト数: 5
- テストタイムアウト: 5分
- 最大実行時間: 1時間
- リトライ回数: 2回

## 🚨 トラブルシューティング

### 接続エラー

```bash
# AWS認証情報の確認
aws sts get-caller-identity --profile user01

# リージョン設定の確認
aws configure get region --profile user01
```

### 権限エラー

必要なIAM権限:
- CloudFront: `cloudfront:GetDistribution`
- Cognito: `cognito-idp:DescribeUserPool`
- DynamoDB: `dynamodb:DescribeTable`
- OpenSearch: `es:DescribeDomain`
- Bedrock: `bedrock:ListFoundationModels`
- FSx: `fsx:DescribeFileSystems`
- CloudWatch: `cloudwatch:PutMetricData`

### 緊急停止の解除

```bash
# 緊急停止状態のリセット
npx ts-node -e "
import { EmergencyStopManager } from './core/emergency-stop-manager';
const manager = new EmergencyStopManager(config);
manager.resetEmergencyStopState();
"
```

## 📚 関連ドキュメント

- [要件定義書](../../.kiro/specs/chatbot-ui-production-testing/requirements.md)
- [設計書](../../.kiro/specs/chatbot-ui-production-testing/design.md)
- [実装タスクリスト](../../.kiro/specs/chatbot-ui-production-testing/tasks.md)

## 🤝 サポート

問題が発生した場合は、以下の情報を含めてお問い合わせください:

1. エラーメッセージの詳細
2. 実行していたテストの種類
3. 環境設定（機密情報を除く）
4. ログファイルの関連部分

---

**注意**: このシステムは実本番環境で動作するため、実行前に必ず設定を確認し、安全性制約を遵守してください。