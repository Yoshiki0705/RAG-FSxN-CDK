"use strict";
/**
 * 運用ガイド生成システム
 * Permission-aware RAG System with FSx for NetApp ONTAP の包括的運用ガイド生成
 *
 * 機能:
 * - トラブルシューティングガイド
 * - 運用チェックリスト
 * - 監視・アラート設定ガイド
 * - インシデント対応手順
 * - 災害復旧手順
 * - セキュリティ運用ガイド
 * - パフォーマンス最適化ガイド
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalGuidesGenerator = void 0;
class OperationalGuidesGenerator {
    systemName = 'Permission-aware RAG System with FSx for NetApp ONTAP';
    version = '2.0.0';
    lastUpdated = new Date().toISOString().split('T')[0];
    /**
     * 包括的トラブルシューティングガイドの生成
     */
    generateTroubleshootingGuide() {
        return `# ${this.systemName} - トラブルシューティングガイド

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 🚨 緊急時対応プロトコル

### レベル1: システム全体停止

#### 症状
- Webサイトが完全にアクセス不可
- 全APIエンドポイントが500エラー
- CloudFrontが503エラーを返す
- ユーザーが一切サービスを利用できない

#### 即座実行手順（5分以内）
\`\`\`bash
# 1. システム状態の緊急確認
aws cloudformation describe-stacks --stack-name rag-system-prod-minimal-integrated
aws cloudformation describe-stacks --stack-name rag-system-prod-minimal-production

# 2. CloudFront状態確認
aws cloudfront get-distribution --id <DISTRIBUTION_ID>

# 3. Lambda関数状態確認
aws lambda list-functions --query 'Functions[?contains(FunctionName, \`rag-system\`)].{Name:FunctionName,State:State}'

# 4. 緊急メンテナンスページ有効化
aws s3 cp maintenance.html s3://rag-system-prod-website/index.html
\`\`\`

#### エスカレーション基準
- **15分以内に復旧しない場合**: レベル2エスカレーション
- **データ損失の可能性**: 即座にレベル3エスカレーション

### レベル2: 主要機能障害

#### チャット機能完全停止

##### 症状
- チャット送信でタイムアウト
- AI応答が一切返らない
- 検索結果が空または500エラー

##### 診断手順
\`\`\`bash
# 1. Bedrock接続確認
aws bedrock-runtime invoke-model \\
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \\
  --body '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}' \\
  --region ap-northeast-1 response.json

# 2. OpenSearch接続確認
curl -X GET "https://your-opensearch-endpoint.ap-northeast-1.es.amazonaws.com/_cluster/health"

# 3. FSx接続確認
aws fsx describe-file-systems --query 'FileSystems[?contains(Tags[?Key==\`Project\`].Value, \`rag-system\`)].{Id:FileSystemId,State:Lifecycle}'

# 4. Lambda関数ログ確認
aws logs tail /aws/lambda/rag-system-chat-handler --follow --since 1h
\`\`\`

##### 対処手順
\`\`\`bash
# 1. Lambda関数の強制再起動
aws lambda update-function-configuration \\
  --function-name rag-system-chat-handler \\
  --environment Variables='{FORCE_RESTART=true}'

# 2. OpenSearchインデックス確認・修復
curl -X POST "https://your-opensearch-endpoint/_refresh"
curl -X GET "https://your-opensearch-endpoint/_cat/indices?v"

# 3. DynamoDBテーブル状態確認
aws dynamodb describe-table --table-name rag-system-sessions
\`\`\`

#### 認証システム障害

##### 症状
- ログインできない
- セッションが無効になる
- 権限エラーが頻発

##### 診断・対処手順
\`\`\`bash
# 1. Cognito状態確認
aws cognito-idp describe-user-pool --user-pool-id <USER_POOL_ID>

# 2. DynamoDBセッションテーブル確認
aws dynamodb scan --table-name rag-system-sessions --limit 5

# 3. IAMロール確認
aws iam get-role --role-name rag-system-lambda-execution-role
\`\`\`

### レベル3: データ整合性問題

#### 文書検索結果の不整合

##### 症状
- 検索結果が古い
- 新しくアップロードした文書が検索されない
- 削除した文書が検索結果に表示される

##### 診断手順
\`\`\`bash
# 1. OpenSearchインデックス状態確認
curl -X GET "https://your-opensearch-endpoint/_cat/indices/documents?v&s=store.size:desc"

# 2. FSxファイルシステム確認
aws fsx describe-file-systems --file-system-ids <FSX_ID>

# 3. 埋め込み処理状態確認
aws lambda invoke --function-name rag-system-embedding-processor \\
  --payload '{"test": true}' response.json
\`\`\`

##### 修復手順
\`\`\`bash
# 1. インデックス再構築
curl -X DELETE "https://your-opensearch-endpoint/documents"
curl -X PUT "https://your-opensearch-endpoint/documents" -H 'Content-Type: application/json' -d '{
  "mappings": {
    "properties": {
      "content": {"type": "text"},
      "embedding": {"type": "dense_vector", "dims": 1536},
      "metadata": {"type": "object"}
    }
  }
}'

# 2. 全文書の再埋め込み処理
aws lambda invoke --function-name rag-system-reindex-all \\
  --payload '{"force": true}' response.json
\`\`\`

## 📊 パフォーマンス問題診断

### 応答時間劣化（>5秒）

#### 診断フローチャート
\`\`\`
応答時間遅延
├── Lambda実行時間 > 10秒
│   ├── メモリ不足 → メモリ増加
│   ├── コールドスタート → プロビジョニング済み同時実行
│   └── 外部API遅延 → タイムアウト設定見直し
├── DynamoDB遅延
│   ├── スロットリング → キャパシティ増加
│   ├── ホットパーティション → パーティションキー見直し
│   └── インデックス不足 → GSI追加
└── OpenSearch遅延
    ├── クラスター負荷 → インスタンス追加
    ├── インデックス断片化 → 最適化実行
    └── クエリ非効率 → クエリ最適化
\`\`\`

#### 自動診断スクリプト
\`\`\`bash
#!/bin/bash
# パフォーマンス診断スクリプト

echo "🔍 パフォーマンス診断開始..."

# Lambda関数の平均実行時間確認
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Duration \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Average,Maximum

# DynamoDBスロットリング確認
aws cloudwatch get-metric-statistics \\
  --namespace AWS/DynamoDB \\
  --metric-name ThrottledRequests \\
  --dimensions Name=TableName,Value=rag-system-sessions \\
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Sum

echo "✅ 診断完了"
\`\`\`

## 🔒 セキュリティインシデント対応

### 不正アクセス検出時の対応

#### Phase 1: 即座封じ込め（5分以内）
\`\`\`bash
# 1. 疑わしいIPアドレスの即座ブロック
aws wafv2 update-ip-set \\
  --scope REGIONAL \\
  --id <IP_SET_ID> \\
  --addresses "192.0.2.1/32,198.51.100.0/24"

# 2. 影響を受けた可能性のあるユーザーセッション無効化
aws dynamodb scan --table-name rag-system-sessions \\
  --filter-expression "contains(ip_address, :ip)" \\
  --expression-attribute-values '{":ip":{"S":"192.0.2.1"}}'
\`\`\`

#### Phase 2: 影響範囲調査（30分以内）
\`\`\`bash
# 1. CloudTrailログ分析
aws logs start-query \\
  --log-group-name CloudTrail/rag-system \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string 'fields @timestamp, sourceIPAddress, eventName | filter sourceIPAddress = "192.0.2.1"'

# 2. アクセスパターン分析
aws logs insights start-query \\
  --log-group-name /aws/lambda/rag-system-auth \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string 'fields @timestamp, @message | filter @message like /FAILED_LOGIN/ | stats count() by bin(5m)'
\`\`\`

#### Phase 3: 復旧・強化（2時間以内）
\`\`\`bash
# 1. セキュリティグループ見直し
aws ec2 describe-security-groups \\
  --filters "Name=group-name,Values=rag-system-*" \\
  --query 'SecurityGroups[*].{GroupId:GroupId,Rules:IpPermissions}'

# 2. IAM権限監査
aws iam generate-credential-report
aws iam get-credential-report
\`\`\`

## 🔧 予防保守手順

### 週次メンテナンス

#### システムヘルスチェック
\`\`\`bash
#!/bin/bash
# 週次ヘルスチェックスクリプト

echo "📋 週次システムヘルスチェック開始"

# 1. 全Lambda関数の実行状況確認
aws lambda list-functions --query 'Functions[?contains(FunctionName, \`rag-system\`)].FunctionName' \\
  | xargs -I {} aws lambda get-function --function-name {}

# 2. DynamoDBテーブル使用量確認
aws dynamodb describe-table --table-name rag-system-sessions \\
  --query 'Table.{TableSizeBytes:TableSizeBytes,ItemCount:ItemCount}'

# 3. OpenSearchクラスター状態確認
curl -s "https://your-opensearch-endpoint/_cluster/health" | jq '.'

# 4. FSxファイルシステム使用量確認
aws fsx describe-file-systems --query 'FileSystems[*].{Id:FileSystemId,StorageCapacity:StorageCapacity,StorageType:StorageType}'

echo "✅ 週次ヘルスチェック完了"
\`\`\`

### 月次最適化

#### パフォーマンス最適化
\`\`\`bash
# 1. 未使用インデックスの特定・削除
curl -X GET "https://your-opensearch-endpoint/_cat/indices?v&s=docs.count:desc"

# 2. DynamoDBテーブルの最適化
aws dynamodb describe-table --table-name rag-system-sessions \\
  --query 'Table.ProvisionedThroughput'

# 3. Lambda関数のメモリ使用量最適化
aws logs filter-log-events \\
  --log-group-name /aws/lambda/rag-system-chat-handler \\
  --filter-pattern "REPORT" \\
  --start-time $(date -d '30 days ago' +%s)000
\`\`\`

## 📞 エスカレーション連絡先

### 緊急連絡先
- **レベル1**: システム管理者 (24時間対応)
- **レベル2**: 開発チームリーダー
- **レベル3**: アーキテクト・セキュリティ責任者

### 外部ベンダー連絡先
- **AWS サポート**: Enterprise Support
- **NetApp サポート**: FSx専用サポート

---

**注意**: このガイドは定期的に更新されます。最新版は常にGitリポジトリで確認してください。
`;
    }
    /**
     * 包括的運用チェックリストの生成
     */
    generateOperationalChecklist() {
        return `# ${this.systemName} - 運用チェックリスト

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 📅 日次運用チェック（毎日 9:00 実行）

### 🔍 システム状態確認（所要時間: 15分）

#### 基本機能確認
- [ ] **Webサイト動作確認**
  - [ ] メインページ読み込み（< 3秒）
  - [ ] ログイン機能動作
  - [ ] チャットインターフェース表示
  - [ ] ファイルアップロード機能

- [ ] **API エンドポイント確認**
  \`\`\`bash
  # ヘルスチェックエンドポイント
  curl -f https://your-domain.com/api/health
  
  # 認証エンドポイント
  curl -f https://your-domain.com/api/auth/status
  
  # チャットエンドポイント
  curl -f -X POST https://your-domain.com/api/chat/test
  \`\`\`

- [ ] **チャット機能動作確認**
  - [ ] テストメッセージ送信
  - [ ] AI応答受信（< 10秒）
  - [ ] 文書検索機能
  - [ ] 権限ベースアクセス制御

#### パフォーマンス確認
- [ ] **応答時間確認**
  - [ ] Webページ読み込み: < 2秒
  - [ ] API応答時間: < 1秒
  - [ ] チャット応答時間: < 10秒
  - [ ] 検索応答時間: < 5秒

- [ ] **エラー率確認**
  - [ ] HTTP 5xx エラー率: < 0.1%
  - [ ] Lambda エラー率: < 0.5%
  - [ ] DynamoDB エラー率: < 0.1%
  - [ ] OpenSearch エラー率: < 0.1%

- [ ] **リソース使用率確認**
  \`\`\`bash
  # Lambda同時実行数確認
  aws cloudwatch get-metric-statistics \\
    --namespace AWS/Lambda \\
    --metric-name ConcurrentExecutions \\
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
    --period 300 --statistics Maximum
  
  # DynamoDBキャパシティ使用率
  aws cloudwatch get-metric-statistics \\
    --namespace AWS/DynamoDB \\
    --metric-name ConsumedReadCapacityUnits \\
    --dimensions Name=TableName,Value=rag-system-sessions \\
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
    --period 300 --statistics Sum
  \`\`\`

### 🔒 セキュリティ確認（所要時間: 10分）

- [ ] **不正アクセス確認**
  - [ ] WAF ブロック状況確認
  - [ ] 異常なアクセスパターン検出
  - [ ] 失敗ログイン試行回数確認
  - [ ] GuardDuty アラート確認

- [ ] **証明書・設定確認**
  - [ ] SSL証明書有効性（有効期限 > 30日）
  - [ ] セキュリティヘッダー設定
  - [ ] CORS設定確認
  - [ ] API認証設定確認

### 📊 ログ・アラート確認（所要時間: 5分）

- [ ] **CloudWatch アラート確認**
  - [ ] Critical アラート: 0件
  - [ ] High アラート: 対応済み
  - [ ] Medium アラート: 確認済み

- [ ] **ログエラー確認**
  \`\`\`bash
  # 過去24時間のエラーログ確認
  aws logs filter-log-events \\
    --log-group-name /aws/lambda/rag-system-chat-handler \\
    --filter-pattern "ERROR" \\
    --start-time $(date -d '24 hours ago' +%s)000
  \`\`\`

## 📅 週次運用チェック（毎週月曜日 10:00 実行）

### 📈 容量・使用量分析（所要時間: 30分）

#### ストレージ使用量確認
- [ ] **DynamoDB使用量**
  \`\`\`bash
  # テーブルサイズ確認
  aws dynamodb describe-table --table-name rag-system-sessions \\
    --query 'Table.{TableSizeBytes:TableSizeBytes,ItemCount:ItemCount}'
  
  # 使用キャパシティ分析
  aws cloudwatch get-metric-statistics \\
    --namespace AWS/DynamoDB \\
    --metric-name ConsumedReadCapacityUnits \\
    --dimensions Name=TableName,Value=rag-system-sessions \\
    --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \\
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
    --period 3600 --statistics Average,Maximum
  \`\`\`

- [ ] **OpenSearch使用量**
  \`\`\`bash
  # インデックスサイズ確認
  curl -X GET "https://your-opensearch-endpoint/_cat/indices?v&s=store.size:desc"
  
  # クラスター使用量確認
  curl -X GET "https://your-opensearch-endpoint/_cluster/stats"
  \`\`\`

- [ ] **FSx使用量**
  \`\`\`bash
  # ファイルシステム使用量確認
  aws fsx describe-file-systems \\
    --query 'FileSystems[*].{Id:FileSystemId,StorageCapacity:StorageCapacity,StorageType:StorageType}'
  
  # 使用量メトリクス確認
  aws cloudwatch get-metric-statistics \\
    --namespace AWS/FSx \\
    --metric-name StorageUtilization \\
    --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \\
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
    --period 3600 --statistics Average,Maximum
  \`\`\`

#### Lambda実行統計
- [ ] **実行回数・時間分析**
  \`\`\`bash
  # 週次実行統計
  aws cloudwatch get-metric-statistics \\
    --namespace AWS/Lambda \\
    --metric-name Invocations \\
    --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
    --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \\
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
    --period 86400 --statistics Sum
  
  # 平均実行時間
  aws cloudwatch get-metric-statistics \\
    --namespace AWS/Lambda \\
    --metric-name Duration \\
    --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
    --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \\
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
    --period 86400 --statistics Average,Maximum
  \`\`\`

### 💰 コスト分析（所要時間: 20分）

- [ ] **週次コストレポート確認**
  \`\`\`bash
  # 過去7日間のコスト確認
  aws ce get-cost-and-usage \\
    --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \\
    --granularity DAILY \\
    --metrics BlendedCost \\
    --group-by Type=DIMENSION,Key=SERVICE
  \`\`\`

- [ ] **予算アラート確認**
  - [ ] 月次予算の使用率確認
  - [ ] 予算超過リスクの評価
  - [ ] コスト異常の特定

- [ ] **不要リソース特定**
  - [ ] 未使用Lambda関数の特定
  - [ ] 空のDynamoDBテーブル確認
  - [ ] 未使用S3バケット確認

## 📅 月次運用チェック（毎月1日 14:00 実行）

### 📊 パフォーマンス分析（所要時間: 60分）

#### 月次パフォーマンスレポート作成
- [ ] **応答時間トレンド分析**
  \`\`\`bash
  # 月次応答時間統計
  aws cloudwatch get-metric-statistics \\
    --namespace AWS/Lambda \\
    --metric-name Duration \\
    --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
    --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \\
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
    --period 86400 --statistics Average,Maximum,Minimum
  \`\`\`

- [ ] **エラー率トレンド分析**
- [ ] **スループット分析**
- [ ] **ユーザー利用パターン分析**

#### ボトルネック分析
- [ ] **最も時間のかかる処理の特定**
- [ ] **リソース使用率の高い時間帯特定**
- [ ] **スケーリングポイントの特定**

#### 最適化提案作成
- [ ] **Lambda関数最適化提案**
- [ ] **DynamoDBキャパシティ最適化提案**
- [ ] **OpenSearchクラスター最適化提案**
- [ ] **コスト最適化提案**

### 🔐 セキュリティ監査（所要時間: 45分）

#### アクセス権限監査
- [ ] **IAMロール・ポリシー見直し**
  \`\`\`bash
  # 全IAMロールの確認
  aws iam list-roles --query 'Roles[?contains(RoleName, \`rag-system\`)].{RoleName:RoleName,CreateDate:CreateDate}'
  
  # 未使用ロールの特定
  aws iam generate-credential-report
  aws iam get-credential-report
  \`\`\`

- [ ] **ユーザーアクセス監査**
  - [ ] 非アクティブユーザーの特定
  - [ ] 権限過多ユーザーの特定
  - [ ] 最終ログイン日時確認

#### セキュリティ設定見直し
- [ ] **セキュリティグループ監査**
  \`\`\`bash
  # 不要なポート開放確認
  aws ec2 describe-security-groups \\
    --filters "Name=group-name,Values=rag-system-*" \\
    --query 'SecurityGroups[*].{GroupId:GroupId,Rules:IpPermissions}'
  \`\`\`

- [ ] **WAFルール最適化**
- [ ] **暗号化設定確認**
- [ ] **ログ保持期間見直し**

### 📋 コンプライアンス確認（所要時間: 30分）

- [ ] **データ保護規制遵守確認**
- [ ] **ログ保持ポリシー遵守確認**
- [ ] **バックアップポリシー遵守確認**
- [ ] **災害復旧計画の見直し**

## 📅 四半期運用チェック（四半期初月15日 実行）

### 🔄 災害復旧テスト（所要時間: 120分）

- [ ] **バックアップ復元テスト**
- [ ] **フェイルオーバーテスト**
- [ ] **データ整合性確認**
- [ ] **復旧時間測定**

### 📈 キャパシティプランニング（所要時間: 90分）

- [ ] **成長予測に基づくリソース計画**
- [ ] **スケーリング戦略見直し**
- [ ] **コスト予測更新**

## ✅ チェックリスト完了確認

### 日次チェック完了基準
- [ ] 全項目チェック完了
- [ ] 異常項目の対応完了または記録
- [ ] 次回チェック予定確認

### 週次チェック完了基準
- [ ] 容量分析レポート作成
- [ ] コスト分析レポート作成
- [ ] 最適化アクション項目作成

### 月次チェック完了基準
- [ ] パフォーマンスレポート作成
- [ ] セキュリティ監査レポート作成
- [ ] 改善提案書作成

---

**注意事項**:
- チェック実行時は必ず結果を記録してください
- 異常を発見した場合は即座にエスカレーションしてください
- 定期的にチェックリストの見直しを行ってください
`;
    }
    /**
     * 包括的監視・アラート設定ガイドの生成
     */
    generateMonitoringGuide() {
        return `# ${this.systemName} - 監視・アラート設定ガイド

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 📊 監視アーキテクチャ概要

\`\`\`
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│   CloudWatch     │───▶│   SNS Topics    │
│   Components    │    │   Metrics/Logs   │    │   Notifications │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Custom        │    │   CloudWatch     │    │   PagerDuty     │
│   Metrics       │    │   Dashboards     │    │   Slack/Email   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
\`\`\`

## 🎯 監視対象コンポーネント

### 1. Lambda 関数監視

#### 主要関数
- \`rag-system-chat-handler\`: チャット処理
- \`rag-system-auth-handler\`: 認証処理
- \`rag-system-document-processor\`: 文書処理
- \`rag-system-embedding-processor\`: 埋め込み処理

#### 重要メトリクス
\`\`\`json
{
  "Duration": {
    "description": "関数実行時間",
    "threshold": {
      "warning": "5000ms",
      "critical": "10000ms"
    },
    "slo": "95%のリクエストが3秒以内"
  },
  "Errors": {
    "description": "エラー数",
    "threshold": {
      "warning": "5 errors/5min",
      "critical": "20 errors/5min"
    },
    "slo": "エラー率 < 1%"
  },
  "Throttles": {
    "description": "スロットリング数",
    "threshold": {
      "warning": "1 throttle/5min",
      "critical": "5 throttles/5min"
    },
    "slo": "スロットリング率 < 0.1%"
  },
  "ConcurrentExecutions": {
    "description": "同時実行数",
    "threshold": {
      "warning": "800",
      "critical": "950"
    },
    "limit": "1000"
  },
  "DeadLetterErrors": {
    "description": "DLQエラー数",
    "threshold": {
      "warning": "1 error/hour",
      "critical": "5 errors/hour"
    }
  }
}
\`\`\`

#### CloudWatch アラーム設定例
\`\`\`bash
# Lambda Duration アラーム
aws cloudwatch put-metric-alarm \\
  --alarm-name "RAG-Lambda-Duration-High" \\
  --alarm-description "Lambda function duration is high" \\
  --metric-name Duration \\
  --namespace AWS/Lambda \\
  --statistic Average \\
  --period 300 \\
  --threshold 5000 \\
  --comparison-operator GreaterThanThreshold \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --evaluation-periods 2 \\
  --alarm-actions arn:aws:sns:ap-northeast-1:123456789012:rag-system-alerts

# Lambda Error Rate アラーム
aws cloudwatch put-metric-alarm \\
  --alarm-name "RAG-Lambda-ErrorRate-High" \\
  --alarm-description "Lambda function error rate is high" \\
  --metric-name Errors \\
  --namespace AWS/Lambda \\
  --statistic Sum \\
  --period 300 \\
  --threshold 5 \\
  --comparison-operator GreaterThanThreshold \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --evaluation-periods 1 \\
  --alarm-actions arn:aws:sns:ap-northeast-1:123456789012:rag-system-critical-alerts
\`\`\`

### 2. DynamoDB 監視

#### 監視対象テーブル
- \`rag-system-sessions\`: ユーザーセッション
- \`rag-system-documents\`: 文書メタデータ
- \`rag-system-user-permissions\`: ユーザー権限

#### 重要メトリクス
\`\`\`json
{
  "ConsumedReadCapacityUnits": {
    "description": "読み込みキャパシティ消費",
    "threshold": {
      "warning": "80% of provisioned",
      "critical": "95% of provisioned"
    }
  },
  "ConsumedWriteCapacityUnits": {
    "description": "書き込みキャパシティ消費",
    "threshold": {
      "warning": "80% of provisioned",
      "critical": "95% of provisioned"
    }
  },
  "ThrottledRequests": {
    "description": "スロットリングされたリクエスト",
    "threshold": {
      "warning": "1 request/5min",
      "critical": "10 requests/5min"
    }
  },
  "SystemErrors": {
    "description": "システムエラー",
    "threshold": {
      "warning": "1 error/5min",
      "critical": "5 errors/5min"
    }
  }
}
\`\`\`

### 3. OpenSearch 監視

#### 重要メトリクス
\`\`\`json
{
  "SearchLatency": {
    "description": "検索レイテンシ",
    "threshold": {
      "warning": "1000ms",
      "critical": "3000ms"
    }
  },
  "SearchRate": {
    "description": "検索レート",
    "monitoring": "trend analysis"
  },
  "IndexingLatency": {
    "description": "インデックスレイテンシ",
    "threshold": {
      "warning": "5000ms",
      "critical": "10000ms"
    }
  },
  "ClusterStatus": {
    "description": "クラスター状態",
    "threshold": {
      "warning": "yellow",
      "critical": "red"
    }
  },
  "CPUUtilization": {
    "description": "CPU使用率",
    "threshold": {
      "warning": "80%",
      "critical": "95%"
    }
  },
  "JVMMemoryPressure": {
    "description": "JVMメモリ圧迫",
    "threshold": {
      "warning": "80%",
      "critical": "95%"
    }
  }
}
\`\`\`

### 4. FSx for NetApp ONTAP 監視

#### 重要メトリクス
\`\`\`json
{
  "StorageUtilization": {
    "description": "ストレージ使用率",
    "threshold": {
      "warning": "80%",
      "critical": "90%"
    }
  },
  "ThroughputUtilization": {
    "description": "スループット使用率",
    "threshold": {
      "warning": "80%",
      "critical": "95%"
    }
  },
  "ClientConnections": {
    "description": "クライアント接続数",
    "monitoring": "trend analysis"
  },
  "NetworkThroughput": {
    "description": "ネットワークスループット",
    "threshold": {
      "warning": "80% of baseline",
      "critical": "95% of baseline"
    }
  }
}
\`\`\`

## 🔔 アラート通知システム

### アラート重要度分類

#### Critical (緊急) - 即座対応必要
- **対象**: システム全体停止、データ損失リスク、セキュリティ侵害
- **通知先**: PagerDuty + SMS + 電話 + Slack #critical
- **対応時間**: 5分以内に初期対応開始
- **エスカレーション**: 15分で自動エスカレーション

\`\`\`bash
# Critical アラート SNS トピック作成
aws sns create-topic --name rag-system-critical-alerts
aws sns subscribe \\
  --topic-arn arn:aws:sns:ap-northeast-1:123456789012:rag-system-critical-alerts \\
  --protocol sms \\
  --notification-endpoint +81-90-1234-5678
\`\`\`

#### High (高) - 緊急対応必要
- **対象**: 主要機能停止、パフォーマンス大幅低下
- **通知先**: Slack #alerts + Email
- **対応時間**: 30分以内に対応開始
- **エスカレーション**: 2時間で管理者エスカレーション

#### Medium (中) - 計画的対応
- **対象**: 軽微な機能障害、容量警告
- **通知先**: Slack #monitoring + Email
- **対応時間**: 4時間以内に確認
- **エスカレーション**: 24時間で担当者エスカレーション

#### Low (低) - 情報提供
- **対象**: 使用量レポート、予防的警告
- **通知先**: Email のみ
- **対応時間**: 次回定期メンテナンス時

### 通知チャンネル設定

#### Slack 統合
\`\`\`bash
# Slack Webhook URL設定
aws ssm put-parameter \\
  --name "/rag-system/slack/webhook-url" \\
  --value "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \\
  --type "SecureString"

# Lambda関数でSlack通知
aws lambda create-function \\
  --function-name rag-system-slack-notifier \\
  --runtime python3.9 \\
  --role arn:aws:iam::123456789012:role/lambda-execution-role \\
  --handler index.lambda_handler \\
  --zip-file fileb://slack-notifier.zip
\`\`\`

## 📈 CloudWatch ダッシュボード設定

### メインダッシュボード構成

#### 1. システム概要ダッシュボード
\`\`\`json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "rag-system-chat-handler"],
          ["AWS/Lambda", "Duration", "FunctionName", "rag-system-chat-handler"],
          ["AWS/Lambda", "Errors", "FunctionName", "rag-system-chat-handler"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-northeast-1",
        "title": "Lambda Performance"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "rag-system-sessions"],
          ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "rag-system-sessions"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "ap-northeast-1",
        "title": "DynamoDB Capacity"
      }
    }
  ]
}
\`\`\`

#### 2. パフォーマンスダッシュボード
- Lambda実行時間トレンド
- DynamoDBレスポンス時間
- OpenSearch検索レイテンシ
- FSxスループット使用率

#### 3. エラー・アラートダッシュボード
- エラー率トレンド
- アラート発生状況
- 異常検知結果
- SLA/SLO達成状況

### ダッシュボード作成スクリプト
\`\`\`bash
#!/bin/bash
# CloudWatch ダッシュボード作成

aws cloudwatch put-dashboard \\
  --dashboard-name "RAG-System-Overview" \\
  --dashboard-body file://dashboard-config.json

echo "✅ ダッシュボード作成完了"
echo "URL: https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=RAG-System-Overview"
\`\`\`

## 🔍 ログ監視・分析

### CloudWatch Logs Insights クエリ集

#### エラーパターン分析
\`\`\`sql
-- Lambda関数のエラーパターン分析
fields @timestamp, @message, @requestId
| filter @message like /ERROR/
| stats count() by bin(5m)
| sort @timestamp desc

-- 特定エラーの詳細分析
fields @timestamp, @message, @requestId
| filter @message like /TimeoutError/
| sort @timestamp desc
| limit 100
\`\`\`

#### パフォーマンス分析
\`\`\`sql
-- Lambda実行時間分析
fields @timestamp, @duration, @requestId
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)
| sort @timestamp desc

-- メモリ使用量分析
fields @timestamp, @maxMemoryUsed, @memorySize, @requestId
| filter @type = "REPORT"
| stats avg(@maxMemoryUsed/@memorySize*100) as MemoryUtilization by bin(1h)
| sort @timestamp desc
\`\`\`

#### セキュリティ分析
\`\`\`sql
-- 認証失敗パターン分析
fields @timestamp, @message, sourceIP
| filter @message like /AUTHENTICATION_FAILED/
| stats count() by sourceIP
| sort count desc

-- 異常アクセスパターン検出
fields @timestamp, @message, userAgent, sourceIP
| filter @message like /SUSPICIOUS_ACTIVITY/
| sort @timestamp desc
\`\`\`

## 🎯 SLA/SLO 監視システム

### サービスレベル目標定義

#### 可用性 SLO
\`\`\`json
{
  "availability": {
    "target": "99.9%",
    "measurement": "uptime percentage",
    "error_budget": "43.2 minutes/month",
    "monitoring": {
      "method": "synthetic monitoring",
      "frequency": "1 minute",
      "endpoints": [
        "https://your-domain.com/health",
        "https://your-domain.com/api/status"
      ]
    }
  }
}
\`\`\`

#### レスポンス時間 SLO
\`\`\`json
{
  "response_time": {
    "target": "95% of requests < 2 seconds",
    "measurement": "Lambda Duration percentile",
    "error_budget": "5% of requests can exceed 2 seconds",
    "monitoring": {
      "metric": "AWS/Lambda Duration",
      "statistic": "p95",
      "period": "5 minutes"
    }
  }
}
\`\`\`

#### エラー率 SLO
\`\`\`json
{
  "error_rate": {
    "target": "< 1% error rate",
    "measurement": "Lambda Errors / Invocations",
    "error_budget": "1% of requests can fail",
    "monitoring": {
      "metric": "AWS/Lambda Errors",
      "calculation": "Errors / Invocations * 100",
      "period": "5 minutes"
    }
  }
}
\`\`\`

### SLO監視ダッシュボード
\`\`\`bash
# SLO監視用カスタムメトリクス作成
aws cloudwatch put-metric-data \\
  --namespace "RAG-System/SLO" \\
  --metric-data MetricName=Availability,Value=99.95,Unit=Percent \\
  --metric-data MetricName=ResponseTimeP95,Value=1.2,Unit=Seconds \\
  --metric-data MetricName=ErrorRate,Value=0.5,Unit=Percent
\`\`\`

## 🚨 異常検知システム

### CloudWatch Anomaly Detection

#### Lambda関数異常検知
\`\`\`bash
# Duration異常検知
aws cloudwatch put-anomaly-detector \\
  --namespace AWS/Lambda \\
  --metric-name Duration \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --stat Average

# Invocations異常検知
aws cloudwatch put-anomaly-detector \\
  --namespace AWS/Lambda \\
  --metric-name Invocations \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --stat Sum
\`\`\`

### カスタム異常検知

#### ビジネスメトリクス異常検知
\`\`\`python
# Lambda関数でカスタム異常検知
import boto3
import json
from datetime import datetime, timedelta

def lambda_handler(event, context):
    cloudwatch = boto3.client('cloudwatch')
    
    # 過去24時間のメトリクス取得
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=24)
    
    response = cloudwatch.get_metric_statistics(
        Namespace='RAG-System/Business',
        MetricName='ChatRequestsPerHour',
        StartTime=start_time,
        EndTime=end_time,
        Period=3600,
        Statistics=['Average']
    )
    
    # 異常検知ロジック
    current_value = response['Datapoints'][-1]['Average']
    historical_average = sum(dp['Average'] for dp in response['Datapoints'][:-1]) / (len(response['Datapoints']) - 1)
    
    if current_value > historical_average * 2 or current_value < historical_average * 0.5:
        # アラート送信
        sns = boto3.client('sns')
        sns.publish(
            TopicArn='arn:aws:sns:ap-northeast-1:123456789012:rag-system-anomaly-alerts',
            Message=f'Anomaly detected: Current value {current_value}, Historical average {historical_average}',
            Subject='RAG System Anomaly Detection Alert'
        )
    
    return {'statusCode': 200}
\`\`\`

## 📊 レポート・分析システム

### 自動レポート生成

#### 日次レポート
\`\`\`bash
#!/bin/bash
# 日次監視レポート生成

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="daily-report-$REPORT_DATE.json"

# メトリクス収集
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Invocations \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 3600 \\
  --statistics Sum > $REPORT_FILE

# レポート送信
aws ses send-email \\
  --source monitoring@your-domain.com \\
  --destination ToAddresses=ops-team@your-domain.com \\
  --message Subject="Daily Monitoring Report - $REPORT_DATE",Body="Text={Data=Please find attached the daily monitoring report.}"
\`\`\`

---

**監視システム運用ガイドライン**:
1. アラートは適切な重要度で分類し、過剰な通知を避ける
2. SLO違反時は必ず根本原因分析を実施する
3. 監視設定は定期的に見直し、ビジネス要件に合わせて調整する
4. 異常検知の精度向上のため、機械学習モデルを継続的に改善する
`;
    }
} /**
   *
 インシデント対応手順ガイドの生成
   */
exports.OperationalGuidesGenerator = OperationalGuidesGenerator;
generateIncidentResponseGuide();
string;
{
    return `# ${this.systemName} - インシデント対応手順ガイド

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 🚨 インシデント対応フレームワーク

### インシデント分類

#### Severity 1 (Critical) - 全社影響
- **定義**: サービス全体停止、データ損失、セキュリティ侵害
- **対応時間**: 5分以内に初期対応
- **通知**: 即座に全関係者に通知
- **エスカレーション**: 15分で経営陣に報告

#### Severity 2 (High) - 主要機能影響
- **定義**: 主要機能停止、パフォーマンス大幅低下
- **対応時間**: 30分以内に初期対応
- **通知**: 技術チーム + 管理者
- **エスカレーション**: 2時間で上位管理者に報告

#### Severity 3 (Medium) - 部分的影響
- **定義**: 一部機能停止、軽微なパフォーマンス低下
- **対応時間**: 4時間以内に対応開始
- **通知**: 担当チーム
- **エスカレーション**: 24時間で管理者に報告

#### Severity 4 (Low) - 軽微な影響
- **定義**: 軽微な問題、予防的対応
- **対応時間**: 次回営業時間内
- **通知**: 担当者のみ
- **エスカレーション**: 週次レポートで報告

### インシデント対応チーム構成

#### インシデント指揮官 (Incident Commander)
- **役割**: 全体指揮、意思決定、コミュニケーション統制
- **権限**: リソース配分、外部連絡、復旧方針決定
- **連絡先**: [24時間対応電話番号]

#### 技術リーダー (Tech Lead)
- **役割**: 技術的調査、復旧作業指揮
- **権限**: システム変更、緊急デプロイ承認
- **連絡先**: [技術チーム連絡先]

#### コミュニケーション担当
- **役割**: 内外への情報発信、ステータス更新
- **権限**: 公式発表、顧客連絡
- **連絡先**: [広報・CS連絡先]

## 📋 インシデント対応プロセス

### Phase 1: 検知・初期対応 (0-15分)

#### 1.1 インシデント検知
\`\`\`bash
# 自動検知システム
- CloudWatch アラーム
- 外形監視システム
- ユーザー報告
- 内部監視ツール

# 手動確認手順
curl -f https://your-domain.com/health
aws cloudformation describe-stacks --stack-name rag-system-prod
aws lambda list-functions --query 'Functions[?contains(FunctionName, \`rag-system\`)].State'
\`\`\`

#### 1.2 初期トリアージ
\`\`\`bash
# 影響範囲確認
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Errors \\
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 --statistics Sum

# ユーザー影響確認
aws logs filter-log-events \\
  --log-group-name /aws/lambda/rag-system-chat-handler \\
  --filter-pattern "ERROR" \\
  --start-time $(date -d '1 hour ago' +%s)000
\`\`\`

#### 1.3 インシデント宣言
\`\`\`bash
# インシデント管理システムに登録
curl -X POST https://incident-management.com/api/incidents \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "RAG System Service Degradation",
    "severity": "high",
    "description": "Chat functionality experiencing high error rates",
    "affected_services": ["chat", "search"],
    "incident_commander": "tech-lead@company.com"
  }'

# 関係者通知
aws sns publish \\
  --topic-arn arn:aws:sns:ap-northeast-1:123456789012:incident-alerts \\
  --message "INCIDENT DECLARED: RAG System experiencing issues. War room: #incident-response"
\`\`\`

### Phase 2: 調査・診断 (15-60分)

#### 2.1 システム状態調査
\`\`\`bash
#!/bin/bash
# 包括的システム診断スクリプト

echo "🔍 システム診断開始..."

# Lambda関数状態
echo "📊 Lambda Functions:"
aws lambda list-functions --query 'Functions[?contains(FunctionName, \`rag-system\`)].{Name:FunctionName,State:State,LastModified:LastModified}'

# DynamoDB状態
echo "📊 DynamoDB Tables:"
aws dynamodb list-tables --query 'TableNames[?contains(@, \`rag-system\`)]' | xargs -I {} aws dynamodb describe-table --table-name {}

# OpenSearch状態
echo "📊 OpenSearch Cluster:"
curl -s "https://your-opensearch-endpoint/_cluster/health" | jq '.'

# FSx状態
echo "📊 FSx File Systems:"
aws fsx describe-file-systems --query 'FileSystems[?contains(Tags[?Key==\`Project\`].Value, \`rag-system\`)].{Id:FileSystemId,State:Lifecycle,StorageCapacity:StorageCapacity}'

echo "✅ システム診断完了"
\`\`\`

#### 2.2 ログ分析
\`\`\`sql
-- CloudWatch Logs Insights クエリ
-- エラーパターン分析
fields @timestamp, @message, @requestId
| filter @message like /ERROR/
| stats count() by bin(5m), @message
| sort @timestamp desc

-- パフォーマンス分析
fields @timestamp, @duration, @requestId
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), count() by bin(5m)
| sort @timestamp desc
\`\`\`

#### 2.3 根本原因分析
\`\`\`bash
# タイムライン分析
aws logs describe-log-streams \\
  --log-group-name /aws/lambda/rag-system-chat-handler \\
  --order-by LastEventTime \\
  --descending

# 変更履歴確認
aws cloudformation describe-stack-events \\
  --stack-name rag-system-prod \\
  --query 'StackEvents[?Timestamp >= \`2024-01-01T00:00:00Z\`]'

# デプロイ履歴確認
aws lambda list-versions-by-function \\
  --function-name rag-system-chat-handler \\
  --query 'Versions[*].{Version:Version,LastModified:LastModified}'
\`\`\`

### Phase 3: 復旧・対処 (60-120分)

#### 3.1 緊急復旧手順

##### 即座復旧 (Hot Fix)
\`\`\`bash
# Lambda関数ロールバック
aws lambda update-function-code \\
  --function-name rag-system-chat-handler \\
  --s3-bucket deployment-artifacts \\
  --s3-key lambda/previous-version.zip

# 設定ロールバック
aws lambda update-function-configuration \\
  --function-name rag-system-chat-handler \\
  --environment Variables='{ROLLBACK=true,VERSION=previous}'

# トラフィック制御
aws lambda put-provisioned-concurrency-config \\
  --function-name rag-system-chat-handler \\
  --qualifier \$LATEST \\
  --provisioned-concurrency-units 10
\`\`\`

##### インフラ復旧
\`\`\`bash
# CloudFormation スタック復旧
aws cloudformation update-stack \\
  --stack-name rag-system-prod \\
  --use-previous-template \\
  --parameters ParameterKey=Version,ParameterValue=stable

# DynamoDB復旧
aws dynamodb restore-table-from-backup \\
  --target-table-name rag-system-sessions-restored \\
  --backup-arn arn:aws:dynamodb:ap-northeast-1:123456789012:table/rag-system-sessions/backup/01234567890123-abcdefgh

# OpenSearch復旧
curl -X POST "https://your-opensearch-endpoint/_snapshot/backup-repo/snapshot-name/_restore"
\`\`\`

#### 3.2 段階的復旧

##### Phase 3.2.1: 基本機能復旧
\`\`\`bash
# 認証システム復旧確認
curl -X POST https://your-domain.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"testuser","password":"testpass"}'

# 基本API復旧確認
curl -f https://your-domain.com/api/health
\`\`\`

##### Phase 3.2.2: チャット機能復旧
\`\`\`bash
# Bedrock接続確認
aws bedrock-runtime invoke-model \\
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \\
  --body '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}' \\
  response.json

# チャット機能テスト
curl -X POST https://your-domain.com/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \$TEST_TOKEN" \\
  -d '{"message":"Hello, this is a test"}'
\`\`\`

##### Phase 3.2.3: 検索機能復旧
\`\`\`bash
# OpenSearch接続確認
curl -X GET "https://your-opensearch-endpoint/_cluster/health"

# 検索機能テスト
curl -X POST "https://your-opensearch-endpoint/documents/_search" \\
  -H "Content-Type: application/json" \\
  -d '{"query":{"match":{"content":"test"}}}'
\`\`\`

### Phase 4: 検証・監視強化 (120-180分)

#### 4.1 復旧検証
\`\`\`bash
#!/bin/bash
# 復旧検証スクリプト

echo "🧪 復旧検証開始..."

# 機能テスト
./tests/integration/full-system-test.sh

# パフォーマンステスト
./tests/performance/load-test.sh --duration 10m --users 100

# セキュリティテスト
./tests/security/security-scan.sh

echo "✅ 復旧検証完了"
\`\`\`

#### 4.2 監視強化
\`\`\`bash
# 一時的監視強化
aws cloudwatch put-metric-alarm \\
  --alarm-name "RAG-PostIncident-ErrorRate" \\
  --alarm-description "Enhanced monitoring post-incident" \\
  --metric-name Errors \\
  --namespace AWS/Lambda \\
  --statistic Sum \\
  --period 60 \\
  --threshold 1 \\
  --comparison-operator GreaterThanThreshold \\
  --evaluation-periods 1

# ログレベル一時的変更
aws lambda update-function-configuration \\
  --function-name rag-system-chat-handler \\
  --environment Variables='{LOG_LEVEL=DEBUG,ENHANCED_MONITORING=true}'
\`\`\`

### Phase 5: 事後処理・改善 (180分以降)

#### 5.1 インシデント報告書作成
\`\`\`markdown
# インシデント報告書テンプレート

## 基本情報
- **インシデントID**: INC-2024-001
- **発生日時**: 2024-01-15 14:30 JST
- **検知日時**: 2024-01-15 14:32 JST
- **復旧日時**: 2024-01-15 16:45 JST
- **影響時間**: 2時間15分
- **Severity**: High

## 影響範囲
- **影響ユーザー数**: 約1,200名
- **影響機能**: チャット機能、文書検索
- **ビジネス影響**: 顧客問い合わせ増加、売上機会損失

## 根本原因
- Lambda関数のメモリ不足によるタイムアウト
- DynamoDBの書き込みキャパシティ不足
- 監視アラートの設定不備

## 対応アクション
1. Lambda関数メモリを512MB→1024MBに増加
2. DynamoDB書き込みキャパシティを自動スケーリング設定
3. 監視アラートの閾値見直し

## 再発防止策
1. 容量計画の定期見直し（月次）
2. 負荷テストの自動化
3. 監視システムの改善
\`\`\`

#### 5.2 改善アクション実装
\`\`\`bash
# 恒久対策実装
aws lambda update-function-configuration \\
  --function-name rag-system-chat-handler \\
  --memory-size 1024 \\
  --timeout 30

# DynamoDB自動スケーリング設定
aws application-autoscaling register-scalable-target \\
  --service-namespace dynamodb \\
  --resource-id table/rag-system-sessions \\
  --scalable-dimension dynamodb:table:WriteCapacityUnits \\
  --min-capacity 5 \\
  --max-capacity 100

# 監視改善
aws cloudwatch put-metric-alarm \\
  --alarm-name "RAG-Lambda-MemoryUtilization" \\
  --metric-name MemoryUtilization \\
  --namespace AWS/Lambda \\
  --statistic Average \\
  --period 300 \\
  --threshold 80 \\
  --comparison-operator GreaterThanThreshold
\`\`\`

## 📞 緊急連絡先・エスカレーション

### 24時間対応連絡先
- **インシデント指揮官**: +81-90-1234-5678
- **技術リーダー**: +81-90-2345-6789
- **システム管理者**: +81-90-3456-7890

### エスカレーション基準
- **15分**: 初期対応完了しない場合
- **1時間**: 復旧見込み立たない場合
- **2時間**: 外部影響拡大の場合

### 外部連絡先
- **AWS サポート**: Enterprise Support Case
- **NetApp サポート**: FSx専用サポート
- **セキュリティベンダー**: 24時間SOC

---

**重要**: このガイドは定期的に訓練で使用し、実効性を確認してください。
`;
} /**
 
  * 災害復旧手順ガイドの生成
   */
generateDisasterRecoveryGuide();
string;
{
    return `# ${this.systemName} - 災害復旧手順ガイド

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 🌪️ 災害復旧計画概要

### 復旧目標
- **RTO (Recovery Time Objective)**: 4時間以内
- **RPO (Recovery Point Objective)**: 1時間以内
- **可用性目標**: 99.9% (年間8.76時間以内のダウンタイム)

### 災害シナリオ分類

#### レベル1: リージョン部分障害
- **想定**: 単一AZ障害、一部サービス停止
- **影響**: 性能低下、一時的アクセス困難
- **復旧時間**: 30分以内
- **対応**: 自動フェイルオーバー

#### レベル2: リージョン全体障害
- **想定**: リージョン全体のサービス停止
- **影響**: 全サービス停止
- **復旧時間**: 4時間以内
- **対応**: 他リージョンへの切り替え

#### レベル3: データセンター災害
- **想定**: 自然災害、大規模インフラ障害
- **影響**: 長期間のサービス停止
- **復旧時間**: 24時間以内
- **対応**: 完全な災害復旧手順

## 🏗️ 災害復旧アーキテクチャ

\`\`\`
Primary Region (ap-northeast-1)     Secondary Region (us-east-1)
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  Production Environment     │    │  DR Environment (Standby)   │
│  ┌─────────────────────────┐│    │  ┌─────────────────────────┐│
│  │ Lambda Functions        ││    │  │ Lambda Functions        ││
│  │ DynamoDB Tables         ││───▶│  │ DynamoDB Global Tables  ││
│  │ OpenSearch Cluster      ││    │  │ OpenSearch Cluster      ││
│  │ FSx File System         ││    │  │ FSx Backup/Restore      ││
│  │ S3 Buckets              ││───▶│  │ S3 Cross-Region Repl.   ││
│  └─────────────────────────┘│    │  └─────────────────────────┘│
└─────────────────────────────┘    └─────────────────────────────┘
            │                                      ▲
            ▼                                      │
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  Route 53 Health Checks     │    │  Automated Failover         │
│  CloudFront Distribution    │    │  DNS Switching              │
└─────────────────────────────┘    └─────────────────────────────┘
\`\`\`

## 📋 事前準備・バックアップ戦略

### 自動バックアップ設定

#### DynamoDB バックアップ
\`\`\`bash
# Point-in-time Recovery有効化
aws dynamodb update-continuous-backups \\
  --table-name rag-system-sessions \\
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# 日次バックアップ設定
aws dynamodb put-backup-policy \\
  --table-name rag-system-sessions \\
  --backup-policy BackupEnabled=true

# Global Tables設定（災害復旧用）
aws dynamodb create-global-table \\
  --global-table-name rag-system-sessions \\
  --replication-group RegionName=ap-northeast-1 RegionName=us-east-1
\`\`\`

#### S3 クロスリージョンレプリケーション
\`\`\`bash
# レプリケーション設定
aws s3api put-bucket-replication \\
  --bucket rag-system-documents \\
  --replication-configuration file://replication-config.json

# replication-config.json
{
  "Role": "arn:aws:iam::123456789012:role/replication-role",
  "Rules": [
    {
      "ID": "ReplicateToUSEast1",
      "Status": "Enabled",
      "Prefix": "",
      "Destination": {
        "Bucket": "arn:aws:s3:::rag-system-documents-dr-us-east-1",
        "StorageClass": "STANDARD_IA"
      }
    }
  ]
}
\`\`\`

#### FSx バックアップ
\`\`\`bash
# 自動バックアップ設定
aws fsx modify-file-system \\
  --file-system-id fs-0123456789abcdef0 \\
  --ontap-configuration AutomaticBackupRetentionDays=30,DailyAutomaticBackupStartTime=03:00

# 手動バックアップ作成
aws fsx create-backup \\
  --file-system-id fs-0123456789abcdef0 \\
  --tags Key=Purpose,Value=DisasterRecovery
\`\`\`

#### Lambda 関数バックアップ
\`\`\`bash
# 関数コードのS3バックアップ
aws lambda get-function \\
  --function-name rag-system-chat-handler \\
  --query 'Code.Location' \\
  | xargs wget -O lambda-backup.zip

# 設定のバックアップ
aws lambda get-function-configuration \\
  --function-name rag-system-chat-handler > lambda-config-backup.json
\`\`\`

### OpenSearch バックアップ
\`\`\`bash
# スナップショットリポジトリ作成
curl -X PUT "https://your-opensearch-endpoint/_snapshot/backup-repo" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "s3",
    "settings": {
      "bucket": "rag-system-opensearch-backups",
      "region": "ap-northeast-1",
      "role_arn": "arn:aws:iam::123456789012:role/opensearch-backup-role"
    }
  }'

# 日次スナップショット作成
curl -X PUT "https://your-opensearch-endpoint/_snapshot/backup-repo/daily-$(date +%Y%m%d)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "indices": "documents,sessions",
    "ignore_unavailable": true,
    "include_global_state": false
  }'
\`\`\`

## 🚨 災害検知・判定

### 自動災害検知システム
\`\`\`python
# Lambda関数による災害検知
import boto3
import json
from datetime import datetime, timedelta

def lambda_handler(event, context):
    cloudwatch = boto3.client('cloudwatch')
    
    # 複数メトリクスでの健全性確認
    metrics_to_check = [
        ('AWS/Lambda', 'Errors', 'rag-system-chat-handler'),
        ('AWS/DynamoDB', 'SystemErrors', 'rag-system-sessions'),
        ('AWS/ES', 'ClusterStatus.red', 'rag-system-search')
    ]
    
    failure_count = 0
    for namespace, metric_name, dimension_value in metrics_to_check:
        response = cloudwatch.get_metric_statistics(
            Namespace=namespace,
            MetricName=metric_name,
            StartTime=datetime.utcnow() - timedelta(minutes=15),
            EndTime=datetime.utcnow(),
            Period=300,
            Statistics=['Sum']
        )
        
        if response['Datapoints'] and response['Datapoints'][-1]['Sum'] > 0:
            failure_count += 1
    
    # 災害判定（3つ以上のサービスで障害）
    if failure_count >= 3:
        trigger_disaster_recovery()
    
    return {'statusCode': 200, 'failure_count': failure_count}

def trigger_disaster_recovery():
    sns = boto3.client('sns')
    sns.publish(
        TopicArn='arn:aws:sns:ap-northeast-1:123456789012:disaster-recovery-alerts',
        Message='DISASTER RECOVERY TRIGGERED: Multiple service failures detected',
        Subject='DISASTER RECOVERY ACTIVATION'
    )
\`\`\`

### 手動災害判定基準
- **サービス停止時間**: 30分以上
- **影響範囲**: 全ユーザーの50%以上
- **復旧見込み**: 2時間以内の復旧困難
- **データ損失リスク**: 重要データの損失可能性

## 🔄 災害復旧手順

### Phase 1: 緊急対応 (0-30分)

#### 1.1 災害宣言
\`\`\`bash
# 災害復旧チーム招集
aws sns publish \\
  --topic-arn arn:aws:sns:ap-northeast-1:123456789012:dr-team-alerts \\
  --message "DISASTER RECOVERY ACTIVATED - All DR team members report to war room"

# ステータスページ更新
curl -X POST https://status-api.your-domain.com/incidents \\
  -H "Authorization: Bearer \$STATUS_API_TOKEN" \\
  -d '{
    "name": "Service Disruption - Disaster Recovery in Progress",
    "status": "investigating",
    "message": "We are experiencing a service disruption and have activated our disaster recovery procedures."
  }'
\`\`\`

#### 1.2 影響範囲確認
\`\`\`bash
# 全リージョンでの状態確認
for region in ap-northeast-1 us-east-1 eu-west-1; do
  echo "Checking region: $region"
  aws cloudformation describe-stacks \\
    --region $region \\
    --stack-name rag-system-prod \\
    --query 'Stacks[0].StackStatus' || echo "Stack not found in $region"
done

# DNS解決確認
nslookup your-domain.com
dig your-domain.com
\`\`\`

#### 1.3 セカンダリリージョン準備確認
\`\`\`bash
# DR環境の状態確認
aws cloudformation describe-stacks \\
  --region us-east-1 \\
  --stack-name rag-system-dr \\
  --query 'Stacks[0].StackStatus'

# DRデータベースの状態確認
aws dynamodb describe-table \\
  --region us-east-1 \\
  --table-name rag-system-sessions \\
  --query 'Table.TableStatus'
\`\`\`

### Phase 2: データ復旧 (30-120分)

#### 2.1 データ整合性確認
\`\`\`bash
# 最新バックアップの確認
aws dynamodb list-backups \\
  --table-name rag-system-sessions \\
  --query 'BackupSummaries[0].{BackupArn:BackupArn,BackupCreationDateTime:BackupCreationDateTime}'

# S3データ同期状況確認
aws s3api get-bucket-replication \\
  --bucket rag-system-documents \\
  --query 'ReplicationConfiguration.Rules[0].Status'

# FSxバックアップ確認
aws fsx describe-backups \\
  --filters Name=file-system-id,Values=fs-0123456789abcdef0 \\
  --query 'Backups[0].{BackupId:BackupId,CreationTime:CreationTime,Lifecycle:Lifecycle}'
\`\`\`

#### 2.2 セカンダリリージョンでのデータ復元
\`\`\`bash
# DynamoDB復元
aws dynamodb restore-table-from-backup \\
  --region us-east-1 \\
  --target-table-name rag-system-sessions \\
  --backup-arn arn:aws:dynamodb:ap-northeast-1:123456789012:table/rag-system-sessions/backup/01234567890123-abcdefgh

# OpenSearch復元
curl -X POST "https://dr-opensearch-endpoint.us-east-1.es.amazonaws.com/_snapshot/backup-repo/latest/_restore" \\
  -H "Content-Type: application/json" \\
  -d '{
    "indices": "documents,sessions",
    "ignore_unavailable": true,
    "include_global_state": false,
    "rename_pattern": "(.+)",
    "rename_replacement": "restored-$1"
  }'

# FSx復元
aws fsx restore-volume-from-snapshot \\
  --region us-east-1 \\
  --creation-tokens rag-system-dr-volume \\
  --snapshot-id snap-0123456789abcdef0
\`\`\`

### Phase 3: サービス復旧 (120-240分)

#### 3.1 セカンダリリージョンでのサービス起動
\`\`\`bash
# Lambda関数デプロイ
aws lambda create-function \\
  --region us-east-1 \\
  --function-name rag-system-chat-handler \\
  --runtime python3.9 \\
  --role arn:aws:iam::123456789012:role/lambda-execution-role \\
  --handler index.lambda_handler \\
  --code S3Bucket=rag-system-deployments,S3Key=lambda/chat-handler.zip

# API Gateway設定
aws apigateway create-rest-api \\
  --region us-east-1 \\
  --name rag-system-api-dr \\
  --description "Disaster Recovery API"

# CloudFront設定更新
aws cloudfront update-distribution \\
  --id E1234567890123 \\
  --distribution-config file://dr-distribution-config.json
\`\`\`

#### 3.2 DNS切り替え
\`\`\`bash
# Route 53 レコード更新
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890123 \\
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "your-domain.com",
          "Type": "A",
          "AliasTarget": {
            "DNSName": "dr-alb-123456789.us-east-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true,
            "HostedZoneId": "Z35SXDOTRQ7X7K"
          }
        }
      }
    ]
  }'

# DNS伝播確認
for i in {1..10}; do
  echo "DNS Check $i:"
  nslookup your-domain.com 8.8.8.8
  sleep 30
done
\`\`\`

#### 3.3 サービス動作確認
\`\`\`bash
# 基本機能テスト
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/status

# 認証テスト
curl -X POST https://your-domain.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"testuser","password":"testpass"}'

# チャット機能テスト
curl -X POST https://your-domain.com/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \$TEST_TOKEN" \\
  -d '{"message":"災害復旧テストメッセージ"}'
\`\`\`

### Phase 4: 監視・安定化 (240分以降)

#### 4.1 強化監視設定
\`\`\`bash
# DR環境用監視設定
aws cloudwatch put-metric-alarm \\
  --region us-east-1 \\
  --alarm-name "DR-Lambda-Errors" \\
  --alarm-description "DR environment Lambda errors" \\
  --metric-name Errors \\
  --namespace AWS/Lambda \\
  --statistic Sum \\
  --period 60 \\
  --threshold 1 \\
  --comparison-operator GreaterThanThreshold

# ログ監視強化
aws logs create-log-group \\
  --region us-east-1 \\
  --log-group-name /aws/lambda/rag-system-dr-monitoring
\`\`\`

#### 4.2 パフォーマンス最適化
\`\`\`bash
# Lambda同時実行数調整
aws lambda put-provisioned-concurrency-config \\
  --region us-east-1 \\
  --function-name rag-system-chat-handler \\
  --qualifier \$LATEST \\
  --provisioned-concurrency-units 50

# DynamoDBキャパシティ調整
aws dynamodb update-table \\
  --region us-east-1 \\
  --table-name rag-system-sessions \\
  --provisioned-throughput ReadCapacityUnits=100,WriteCapacityUnits=100
\`\`\`

## 🔄 フェイルバック手順

### プライマリリージョン復旧後の手順

#### 1. データ同期確認
\`\`\`bash
# データ差分確認
aws dynamodb scan \\
  --region ap-northeast-1 \\
  --table-name rag-system-sessions \\
  --select COUNT

aws dynamodb scan \\
  --region us-east-1 \\
  --table-name rag-system-sessions \\
  --select COUNT

# 差分データの同期
aws dynamodb export-table-to-point-in-time \\
  --region us-east-1 \\
  --table-arn arn:aws:dynamodb:us-east-1:123456789012:table/rag-system-sessions \\
  --s3-bucket rag-system-dr-sync
\`\`\`

#### 2. 段階的フェイルバック
\`\`\`bash
# トラフィック段階的移行（10%→50%→100%）
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890123 \\
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "your-domain.com",
          "Type": "A",
          "SetIdentifier": "Primary",
          "Weight": 10,
          "AliasTarget": {
            "DNSName": "primary-alb-123456789.ap-northeast-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true,
            "HostedZoneId": "Z14GRHDCWA56QT"
          }
        }
      }
    ]
  }'
\`\`\`

## 📊 災害復旧テスト

### 定期テスト計画
- **月次**: 部分的フェイルオーバーテスト
- **四半期**: 完全災害復旧テスト
- **年次**: 全社災害復旧訓練

### テスト手順
\`\`\`bash
#!/bin/bash
# 災害復旧テストスクリプト

echo "🧪 災害復旧テスト開始..."

# テスト環境での災害シミュレーション
aws lambda update-function-configuration \\
  --function-name rag-system-chat-handler-test \\
  --environment Variables='{SIMULATE_DISASTER=true}'

# フェイルオーバー実行
./scripts/failover-to-dr.sh --test-mode

# 復旧時間測定
start_time=$(date +%s)
./scripts/verify-dr-functionality.sh
end_time=$(date +%s)
recovery_time=$((end_time - start_time))

echo "✅ 災害復旧テスト完了"
echo "復旧時間: ${recovery_time}秒"
\`\`\`

---

**重要**: 災害復旧計画は定期的にテストし、実際の災害時に確実に機能することを確認してください。
`;
}
/**
   * セキュリティ運用ガイドの生成
   */
generateSecurityOperationsGuide();
string;
{
    return `# ${this.systemName} - セキュリティ運用ガイド

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 🔒 セキュリティ運用フレームワーク

### セキュリティ運用の基本原則
1. **多層防御**: 複数のセキュリティ層による保護
2. **最小権限の原則**: 必要最小限のアクセス権限
3. **継続的監視**: 24/7セキュリティ監視
4. **インシデント対応**: 迅速な脅威対応
5. **定期的監査**: セキュリティ設定の定期見直し

### セキュリティ責任分担モデル
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    お客様の責任                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ アプリケーションレベルセキュリティ                    │ │
│  │ - IAM権限管理                                      │ │
│  │ - アプリケーション認証・認可                        │ │
│  │ - データ暗号化                                      │ │
│  │ - ネットワーク設定                                  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    AWSの責任                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ インフラストラクチャセキュリティ                      │ │
│  │ - 物理セキュリティ                                  │ │
│  │ - ネットワークインフラ                              │ │
│  │ - ハイパーバイザー                                  │ │
│  │ - マネージドサービス                                │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
\`\`\`

## 🛡️ セキュリティコンポーネント監視

### 1. IAM セキュリティ監視

#### 権限監査スクリプト
\`\`\`bash
#!/bin/bash
# IAM権限監査スクリプト

echo "🔍 IAM権限監査開始..."

# 過度な権限を持つロールの特定
aws iam list-roles --query 'Roles[?contains(RoleName, \`rag-system\`)].RoleName' \\
  | xargs -I {} aws iam list-attached-role-policies --role-name {}

# 未使用IAMロールの特定
aws iam generate-credential-report
sleep 10
aws iam get-credential-report --query 'Content' --output text | base64 -d > credential-report.csv

# 最終使用日が90日以上前のロールを特定
python3 << EOF
import csv
from datetime import datetime, timedelta

with open('credential-report.csv', 'r') as f:
    reader = csv.DictReader(f)
    cutoff_date = datetime.now() - timedelta(days=90)
    
    for row in reader:
        if 'rag-system' in row['user']:
            last_used = row.get('password_last_used', 'N/A')
            if last_used != 'N/A' and last_used != 'no_information':
                last_used_date = datetime.strptime(last_used.split('T')[0], '%Y-%m-%d')
                if last_used_date < cutoff_date:
                    print(f"⚠️  未使用ロール: {row['user']} (最終使用: {last_used})")
EOF

echo "✅ IAM権限監査完了"
\`\`\`

#### 異常なIAM活動検知
\`\`\`bash
# CloudTrail IAMイベント分析
aws logs start-query \\
  --log-group-name CloudTrail/rag-system \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, eventName, sourceIPAddress, userIdentity.type, userIdentity.userName
    | filter eventName like /CreateRole|AttachRolePolicy|PutRolePolicy|CreateUser|AttachUserPolicy/
    | sort @timestamp desc
  '

# 権限昇格の検知
aws logs start-query \\
  --log-group-name CloudTrail/rag-system \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, eventName, sourceIPAddress, userIdentity.userName, requestParameters
    | filter eventName = "AttachRolePolicy" and requestParameters.policyArn like /AdministratorAccess|PowerUserAccess/
    | sort @timestamp desc
  '
\`\`\`

### 2. ネットワークセキュリティ監視

#### WAF ログ分析
\`\`\`bash
# WAF攻撃パターン分析
aws logs start-query \\
  --log-group-name aws-waf-logs-rag-system \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, httpRequest.clientIp, httpRequest.uri, action, terminatingRuleId
    | filter action = "BLOCK"
    | stats count() by httpRequest.clientIp, terminatingRuleId
    | sort count desc
  '

# 地理的異常アクセス検知
aws logs start-query \\
  --log-group-name aws-waf-logs-rag-system \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, httpRequest.clientIp, httpRequest.country
    | filter httpRequest.country not in ["JP", "US"]
    | stats count() by httpRequest.country, httpRequest.clientIp
    | sort count desc
  '
\`\`\`

#### VPC Flow Logs 分析
\`\`\`bash
# 異常なネットワークトラフィック検知
aws logs start-query \\
  --log-group-name VPCFlowLogs \\
  --start-time $(date -d '1 hour ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, srcaddr, dstaddr, srcport, dstport, protocol, action
    | filter action = "REJECT"
    | stats count() by srcaddr, dstport
    | sort count desc
    | limit 20
  '

# 内部通信の異常検知
aws logs start-query \\
  --log-group-name VPCFlowLogs \\
  --start-time $(date -d '1 hour ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, srcaddr, dstaddr, bytes
    | filter srcaddr like /^10\\./ and dstaddr like /^10\\./
    | stats sum(bytes) as total_bytes by srcaddr, dstaddr
    | sort total_bytes desc
    | limit 10
  '
\`\`\`

### 3. アプリケーションセキュリティ監視

#### 認証・認可ログ監視
\`\`\`bash
# 認証失敗パターン分析
aws logs start-query \\
  --log-group-name /aws/lambda/rag-system-auth-handler \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, @message, @requestId
    | filter @message like /AUTHENTICATION_FAILED/
    | parse @message "sourceIP: * username: *" as sourceIP, username
    | stats count() by sourceIP, username
    | sort count desc
  '

# ブルートフォース攻撃検知
aws logs start-query \\
  --log-group-name /aws/lambda/rag-system-auth-handler \\
  --start-time $(date -d '1 hour ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, @message
    | filter @message like /AUTHENTICATION_FAILED/
    | parse @message "sourceIP: *" as sourceIP
    | stats count() as failure_count by sourceIP
    | filter failure_count > 10
    | sort failure_count desc
  '
\`\`\`

#### SQLインジェクション・XSS検知
\`\`\`bash
# 悪意のあるペイロード検知
aws logs start-query \\
  --log-group-name /aws/lambda/rag-system-chat-handler \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, @message, @requestId
    | filter @message like /SELECT.*FROM|UNION.*SELECT|<script|javascript:|eval\(/
    | sort @timestamp desc
  '

# 異常なファイルアップロード検知
aws logs start-query \\
  --log-group-name /aws/lambda/rag-system-document-processor \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, @message
    | filter @message like /SUSPICIOUS_FILE_TYPE|MALWARE_DETECTED|FILE_SIZE_EXCEEDED/
    | sort @timestamp desc
  '
\`\`\`

## 🚨 セキュリティインシデント対応

### インシデント分類・対応マトリクス

| 重要度 | インシデントタイプ | 対応時間 | 通知先 | エスカレーション |
|--------|-------------------|----------|--------|------------------|
| Critical | データ漏洩、システム侵害 | 15分以内 | CISO + 全役員 | 即座 |
| High | 不正アクセス、マルウェア | 1時間以内 | セキュリティチーム | 2時間後 |
| Medium | 権限昇格、設定不備 | 4時間以内 | 運用チーム | 24時間後 |
| Low | ポリシー違反、軽微な脆弱性 | 24時間以内 | 担当者 | 週次報告 |

### セキュリティインシデント対応手順

#### Phase 1: 検知・初期対応 (0-15分)
\`\`\`bash
# セキュリティインシデント検知時の初期対応
#!/bin/bash

INCIDENT_ID="SEC-$(date +%Y%m%d-%H%M%S)"
echo "🚨 セキュリティインシデント検知: $INCIDENT_ID"

# 1. 影響範囲の初期評価
echo "📊 影響範囲評価中..."
aws cloudtrail lookup-events \\
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole \\
  --start-time $(date -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date +%Y-%m-%dT%H:%M:%S)

# 2. 疑わしいアクティビティの隔離
echo "🔒 疑わしいアクティビティ隔離中..."
# 疑わしいIPアドレスのブロック
aws wafv2 update-ip-set \\
  --scope REGIONAL \\
  --id suspicious-ips \\
  --addresses "192.0.2.1/32"

# 3. インシデント通知
echo "📢 インシデント通知送信中..."
aws sns publish \\
  --topic-arn arn:aws:sns:ap-northeast-1:123456789012:security-incidents \\
  --message "SECURITY INCIDENT DETECTED: $INCIDENT_ID - Immediate attention required"
\`\`\`

#### Phase 2: 封じ込め・調査 (15-60分)
\`\`\`bash
# セキュリティインシデント調査スクリプト
#!/bin/bash

echo "🔍 詳細調査開始..."

# 1. 攻撃者の活動タイムライン作成
aws logs start-query \\
  --log-group-name CloudTrail/rag-system \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, eventName, sourceIPAddress, userIdentity.userName, awsRegion
    | filter sourceIPAddress = "192.0.2.1"
    | sort @timestamp asc
  '

# 2. 影響を受けたリソースの特定
aws cloudtrail lookup-events \\
  --lookup-attributes AttributeKey=Username,AttributeValue=compromised-user \\
  --start-time $(date -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --query 'Events[*].{EventTime:EventTime,EventName:EventName,Resources:Resources}'

# 3. データアクセス状況確認
aws logs start-query \\
  --log-group-name /aws/lambda/rag-system-document-processor \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, @message
    | filter @message like /DOCUMENT_ACCESS/
    | parse @message "user: * document: *" as user, document
    | filter user = "compromised-user"
    | sort @timestamp desc
  '
\`\`\`

#### Phase 3: 根絶・復旧 (60-240分)
\`\`\`bash
# セキュリティインシデント復旧スクリプト
#!/bin/bash

echo "🛠️ セキュリティ復旧開始..."

# 1. 侵害されたアカウントの無効化
aws iam delete-login-profile --user-name compromised-user
aws iam list-access-keys --user-name compromised-user \\
  --query 'AccessKeyMetadata[*].AccessKeyId' \\
  | xargs -I {} aws iam delete-access-key --user-name compromised-user --access-key-id {}

# 2. セッションの無効化
aws dynamodb scan --table-name rag-system-sessions \\
  --filter-expression "contains(username, :user)" \\
  --expression-attribute-values '{":user":{"S":"compromised-user"}}' \\
  --query 'Items[*].session_id.S' \\
  | xargs -I {} aws dynamodb delete-item --table-name rag-system-sessions --key '{"session_id":{"S":"{}"}}'

# 3. 影響を受けたデータの確認・復旧
aws s3api list-object-versions \\
  --bucket rag-system-documents \\
  --prefix "user/compromised-user/" \\
  --query 'Versions[?IsLatest==\`false\`].{Key:Key,VersionId:VersionId,LastModified:LastModified}'

# 4. セキュリティ設定の強化
aws iam put-user-policy \\
  --user-name emergency-admin \\
  --policy-name EmergencySecurityPolicy \\
  --policy-document file://emergency-security-policy.json
\`\`\`

## 🔐 データ保護・暗号化管理

### 暗号化状態監視
\`\`\`bash
# 全サービスの暗号化状態確認
#!/bin/bash

echo "🔐 暗号化状態確認開始..."

# S3バケット暗号化確認
aws s3api get-bucket-encryption --bucket rag-system-documents \\
  --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault'

# DynamoDB暗号化確認
aws dynamodb describe-table --table-name rag-system-sessions \\
  --query 'Table.SSEDescription.Status'

# Lambda環境変数暗号化確認
aws lambda get-function-configuration --function-name rag-system-chat-handler \\
  --query 'KMSKeyArn'

# OpenSearch暗号化確認
curl -X GET "https://your-opensearch-endpoint/_cluster/settings" \\
  -H "Content-Type: application/json" | jq '.persistent.cluster.encryption'

echo "✅ 暗号化状態確認完了"
\`\`\`

### KMS キー管理
\`\`\`bash
# KMSキーローテーション状態確認
aws kms describe-key --key-id alias/rag-system-encryption \\
  --query 'KeyMetadata.{KeyId:KeyId,KeyRotationStatus:KeyRotationStatus,CreationDate:CreationDate}'

# キー使用状況監視
aws cloudwatch get-metric-statistics \\
  --namespace AWS/KMS \\
  --metric-name NumberOfRequestsSucceeded \\
  --dimensions Name=KeyId,Value=arn:aws:kms:ap-northeast-1:123456789012:key/12345678-1234-1234-1234-123456789012 \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 3600 \\
  --statistics Sum

# 異常なKMS使用パターン検知
aws logs start-query \\
  --log-group-name CloudTrail/rag-system \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, eventName, sourceIPAddress, userIdentity.userName
    | filter eventName like /Decrypt|GenerateDataKey/
    | stats count() by sourceIPAddress, userIdentity.userName
    | sort count desc
  '
\`\`\`

## 🔍 脆弱性管理

### 定期脆弱性スキャン
\`\`\`bash
#!/bin/bash
# 脆弱性スキャンスクリプト

echo "🔍 脆弱性スキャン開始..."

# 1. Lambda関数の依存関係スキャン
for function in $(aws lambda list-functions --query 'Functions[?contains(FunctionName, \`rag-system\`)].FunctionName' --output text); do
  echo "Scanning function: $function"
  
  # 関数コードダウンロード
  aws lambda get-function --function-name $function --query 'Code.Location' \\
    | xargs wget -O /tmp/$function.zip
  
  # 依存関係抽出・スキャン
  unzip -q /tmp/$function.zip -d /tmp/$function/
  if [ -f /tmp/$function/requirements.txt ]; then
    safety check -r /tmp/$function/requirements.txt
  fi
  
  rm -rf /tmp/$function*
done

# 2. コンテナイメージスキャン（ECRの場合）
aws ecr describe-repositories --query 'repositories[?contains(repositoryName, \`rag-system\`)].repositoryName' --output text \\
  | xargs -I {} aws ecr start-image-scan --repository-name {} --image-id imageTag=latest

# 3. インフラ設定スキャン
aws config get-compliance-summary-by-config-rule \\
  --query 'ComplianceSummary.{CompliantRuleCount:CompliantRuleCount,NonCompliantRuleCount:NonCompliantRuleCount}'

echo "✅ 脆弱性スキャン完了"
\`\`\`

### セキュリティ設定監査
\`\`\`bash
# AWS Config ルールによるセキュリティ監査
aws config put-config-rule \\
  --config-rule '{
    "ConfigRuleName": "s3-bucket-public-access-prohibited",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
    }
  }'

aws config put-config-rule \\
  --config-rule '{
    "ConfigRuleName": "lambda-function-public-access-prohibited",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED"
    }
  }'

# セキュリティグループ監査
aws ec2 describe-security-groups \\
  --filters "Name=group-name,Values=rag-system-*" \\
  --query 'SecurityGroups[*].{GroupId:GroupId,GroupName:GroupName,IpPermissions:IpPermissions}' \\
  | jq '.[] | select(.IpPermissions[].IpRanges[]?.CidrIp == "0.0.0.0/0")'
\`\`\`

## 📊 セキュリティメトリクス・レポート

### セキュリティダッシュボード
\`\`\`json
{
  "dashboard_name": "RAG-System-Security-Dashboard",
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/WAF", "BlockedRequests", "WebACL", "rag-system-waf"],
          ["AWS/WAF", "AllowedRequests", "WebACL", "rag-system-waf"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "ap-northeast-1",
        "title": "WAF Request Statistics"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/lambda/rag-system-auth-handler' | fields @timestamp, @message | filter @message like /AUTHENTICATION_FAILED/ | stats count() by bin(5m)",
        "region": "ap-northeast-1",
        "title": "Authentication Failures"
      }
    }
  ]
}
\`\`\`

### 月次セキュリティレポート生成
\`\`\`python
#!/usr/bin/env python3
# 月次セキュリティレポート生成スクリプト

import boto3
import json
from datetime import datetime, timedelta
from collections import defaultdict

def generate_security_report():
    # CloudTrail分析
    cloudtrail = boto3.client('cloudtrail')
    logs = boto3.client('logs')
    
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=30)
    
    # セキュリティイベント集計
    security_events = defaultdict(int)
    
    # WAFブロック統計
    waf_query = '''
    fields @timestamp, httpRequest.clientIp, action, terminatingRuleId
    | filter action = "BLOCK"
    | stats count() by terminatingRuleId
    '''
    
    response = logs.start_query(
        logGroupName='aws-waf-logs-rag-system',
        startTime=int(start_time.timestamp()),
        endTime=int(end_time.timestamp()),
        queryString=waf_query
    )
    
    # 認証失敗統計
    auth_query = '''
    fields @timestamp, @message
    | filter @message like /AUTHENTICATION_FAILED/
    | stats count() by bin(1d)
    '''
    
    auth_response = logs.start_query(
        logGroupName='/aws/lambda/rag-system-auth-handler',
        startTime=int(start_time.timestamp()),
        endTime=int(end_time.timestamp()),
        queryString=auth_query
    )
    
    # レポート生成
    report = {
        'report_period': f"{start_time.strftime('%Y-%m-%d')} to {end_time.strftime('%Y-%m-%d')}",
        'waf_blocks': 'Processing...',
        'auth_failures': 'Processing...',
        'security_recommendations': [
            'Review and update IAM policies',
            'Rotate access keys older than 90 days',
            'Update security group rules',
            'Review CloudTrail logs for anomalies'
        ]
    }
    
    with open(f'security-report-{end_time.strftime("%Y%m")}.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"✅ セキュリティレポート生成完了: security-report-{end_time.strftime('%Y%m')}.json")

if __name__ == "__main__":
    generate_security_report()
\`\`\`

## 🎯 セキュリティ運用KPI

### 主要セキュリティメトリクス
- **セキュリティインシデント対応時間**: 平均15分以内
- **脆弱性修正時間**: Critical 24時間以内、High 7日以内
- **セキュリティ監査合格率**: 95%以上
- **不正アクセス検知率**: 99%以上
- **データ漏洩件数**: 0件

### セキュリティ成熟度評価
\`\`\`bash
# セキュリティ成熟度チェックリスト
echo "🔍 セキュリティ成熟度評価..."

# Level 1: 基本的なセキュリティ対策
echo "Level 1 チェック:"
echo "- [ ] WAF設定済み"
echo "- [ ] CloudTrail有効化"
echo "- [ ] 暗号化設定済み"

# Level 2: 高度なセキュリティ対策
echo "Level 2 チェック:"
echo "- [ ] GuardDuty有効化"
echo "- [ ] Config Rules設定"
echo "- [ ] セキュリティ監視自動化"

# Level 3: 最高レベルのセキュリティ
echo "Level 3 チェック:"
echo "- [ ] ゼロトラスト実装"
echo "- [ ] AI/ML脅威検知"
echo "- [ ] 継続的セキュリティ監査"
\`\`\`

---

**セキュリティ運用の重要ポイント**:
1. セキュリティは継続的なプロセスです
2. 定期的な訓練と教育が重要です
3. インシデント対応計画は定期的に更新してください
4. セキュリティメトリクスを継続的に監視してください
`;
}
/**
   * パフォーマンス最適化ガイドの生成
   */
generatePerformanceOptimizationGuide();
string;
{
    return `# ${this.systemName} - パフォーマンス最適化ガイド

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 🚀 パフォーマンス最適化戦略

### パフォーマンス目標
- **応答時間**: 95%のリクエストが2秒以内
- **スループット**: 1000 req/sec以上
- **可用性**: 99.9%以上
- **エラー率**: 1%未満

### 最適化の優先順位
1. **ユーザー体験に直結する機能**: チャット応答、検索機能
2. **ボトルネックとなりやすい箇所**: データベースアクセス、AI処理
3. **コスト効率**: リソース使用量とパフォーマンスのバランス
4. **スケーラビリティ**: 負荷増加への対応能力

## 📊 パフォーマンス監視・分析

### 主要パフォーマンスメトリクス

#### Lambda関数パフォーマンス
\`\`\`bash
# Lambda関数の詳細パフォーマンス分析
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Duration \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Average,Maximum,Minimum

# メモリ使用率分析
aws logs start-query \\
  --log-group-name /aws/lambda/rag-system-chat-handler \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, @maxMemoryUsed, @memorySize, @duration
    | filter @type = "REPORT"
    | stats avg(@maxMemoryUsed/@memorySize*100) as MemoryUtilization, 
            avg(@duration) as AvgDuration,
            max(@duration) as MaxDuration
    by bin(1h)
  '

# コールドスタート分析
aws logs start-query \\
  --log-group-name /aws/lambda/rag-system-chat-handler \\
  --start-time $(date -d '24 hours ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @timestamp, @duration, @initDuration
    | filter @type = "REPORT" and ispresent(@initDuration)
    | stats count() as ColdStarts, avg(@initDuration) as AvgInitDuration
    by bin(1h)
  '
\`\`\`

#### DynamoDB パフォーマンス
\`\`\`bash
# DynamoDBレスポンス時間分析
aws cloudwatch get-metric-statistics \\
  --namespace AWS/DynamoDB \\
  --metric-name SuccessfulRequestLatency \\
  --dimensions Name=TableName,Value=rag-system-sessions Name=Operation,Value=GetItem \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Average,Maximum

# スロットリング分析
aws cloudwatch get-metric-statistics \\
  --namespace AWS/DynamoDB \\
  --metric-name ThrottledRequests \\
  --dimensions Name=TableName,Value=rag-system-sessions \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Sum

# ホットパーティション検知
aws dynamodb describe-table --table-name rag-system-sessions \\
  --query 'Table.{PartitionKey:KeySchema[0].AttributeName,GSI:GlobalSecondaryIndexes[*].KeySchema}'
\`\`\`

#### OpenSearch パフォーマンス
\`\`\`bash
# OpenSearch検索パフォーマンス分析
curl -X GET "https://your-opensearch-endpoint/_nodes/stats/indices/search" | jq '.nodes[].indices.search'

# インデックス最適化状況確認
curl -X GET "https://your-opensearch-endpoint/_cat/indices?v&s=store.size:desc"

# クエリパフォーマンス分析
curl -X GET "https://your-opensearch-endpoint/_cat/thread_pool/search?v&h=node_name,active,queue,rejected,completed"

# 遅いクエリの特定
curl -X GET "https://your-opensearch-endpoint/_cluster/settings" \\
  -H "Content-Type: application/json" \\
  -d '{
    "persistent": {
      "index.search.slowlog.threshold.query.warn": "2s",
      "index.search.slowlog.threshold.query.info": "1s"
    }
  }'
\`\`\`

## ⚡ Lambda関数最適化

### メモリ・タイムアウト最適化
\`\`\`bash
#!/bin/bash
# Lambda関数最適化スクリプト

FUNCTION_NAME="rag-system-chat-handler"

echo "🔧 Lambda関数最適化開始: $FUNCTION_NAME"

# 現在の設定確認
aws lambda get-function-configuration --function-name $FUNCTION_NAME \\
  --query '{MemorySize:MemorySize,Timeout:Timeout,Runtime:Runtime}'

# メモリ使用率分析
MEMORY_STATS=$(aws logs start-query \\
  --log-group-name /aws/lambda/$FUNCTION_NAME \\
  --start-time $(date -d '7 days ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @maxMemoryUsed, @memorySize, @duration
    | filter @type = "REPORT"
    | stats avg(@maxMemoryUsed) as AvgMemoryUsed,
            max(@maxMemoryUsed) as MaxMemoryUsed,
            avg(@memorySize) as ConfiguredMemory,
            avg(@duration) as AvgDuration
  ')

echo "メモリ使用統計: $MEMORY_STATS"

# 最適なメモリサイズ計算（使用量の1.2倍を推奨）
OPTIMAL_MEMORY=$(echo "$MEMORY_STATS" | jq -r '.results[0].MaxMemoryUsed * 1.2 | ceil')

# メモリサイズ更新（128MB単位で調整）
ADJUSTED_MEMORY=$(( (OPTIMAL_MEMORY + 127) / 128 * 128 ))

if [ $ADJUSTED_MEMORY -ne $(aws lambda get-function-configuration --function-name $FUNCTION_NAME --query 'MemorySize') ]; then
  echo "メモリサイズを ${ADJUSTED_MEMORY}MB に更新中..."
  aws lambda update-function-configuration \\
    --function-name $FUNCTION_NAME \\
    --memory-size $ADJUSTED_MEMORY
fi

echo "✅ Lambda関数最適化完了"
\`\`\`

### プロビジョニング済み同時実行設定
\`\`\`bash
# コールドスタート削減のためのプロビジョニング設定
aws lambda put-provisioned-concurrency-config \\
  --function-name rag-system-chat-handler \\
  --qualifier \$LATEST \\
  --provisioned-concurrency-units 10

# 使用状況監視
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name ProvisionedConcurrencyUtilization \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Average,Maximum
\`\`\`

### Lambda Layer活用
\`\`\`bash
# 共通ライブラリのLayer化
zip -r common-libraries.zip python/
aws lambda publish-layer-version \\
  --layer-name rag-system-common-libs \\
  --description "Common libraries for RAG system" \\
  --zip-file fileb://common-libraries.zip \\
  --compatible-runtimes python3.9

# 関数にLayer適用
aws lambda update-function-configuration \\
  --function-name rag-system-chat-handler \\
  --layers arn:aws:lambda:ap-northeast-1:123456789012:layer:rag-system-common-libs:1
\`\`\`

## 🗄️ DynamoDB最適化

### キャパシティ最適化
\`\`\`bash
# 自動スケーリング設定
aws application-autoscaling register-scalable-target \\
  --service-namespace dynamodb \\
  --resource-id table/rag-system-sessions \\
  --scalable-dimension dynamodb:table:ReadCapacityUnits \\
  --min-capacity 5 \\
  --max-capacity 100

aws application-autoscaling put-scaling-policy \\
  --service-namespace dynamodb \\
  --resource-id table/rag-system-sessions \\
  --scalable-dimension dynamodb:table:ReadCapacityUnits \\
  --policy-name rag-system-sessions-read-scaling-policy \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "ScaleInCooldown": 60,
    "ScaleOutCooldown": 60,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "DynamoDBReadCapacityUtilization"
    }
  }'

# パーティション分散確認
aws dynamodb describe-table --table-name rag-system-sessions \\
  --query 'Table.{ItemCount:ItemCount,TableSizeBytes:TableSizeBytes,PartitionKey:KeySchema[0]}'
\`\`\`

### インデックス最適化
\`\`\`bash
# GSI使用状況分析
aws cloudwatch get-metric-statistics \\
  --namespace AWS/DynamoDB \\
  --metric-name ConsumedReadCapacityUnits \\
  --dimensions Name=TableName,Value=rag-system-sessions Name=GlobalSecondaryIndexName,Value=user-index \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 3600 \\
  --statistics Sum

# 未使用インデックスの特定
aws logs start-query \\
  --log-group-name /aws/lambda/rag-system-chat-handler \\
  --start-time $(date -d '30 days ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string '
    fields @message
    | filter @message like /DynamoDB.*Query.*IndexName/
    | parse @message "IndexName: *" as IndexName
    | stats count() by IndexName
    | sort count desc
  '
\`\`\`

### DynamoDB Accelerator (DAX) 導入
\`\`\`bash
# DAXクラスター作成
aws dax create-cluster \\
  --cluster-name rag-system-dax \\
  --node-type dax.r4.large \\
  --replication-factor 3 \\
  --iam-role-arn arn:aws:iam::123456789012:role/DAXServiceRole \\
  --subnet-group-name rag-system-dax-subnet-group \\
  --security-group-ids sg-12345678

# DAX使用量監視
aws cloudwatch get-metric-statistics \\
  --namespace AWS/DAX \\
  --metric-name CacheHitRate \\
  --dimensions Name=ClusterName,Value=rag-system-dax \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Average
\`\`\`

## 🔍 OpenSearch最適化

### インデックス最適化
\`\`\`bash
# インデックステンプレート最適化
curl -X PUT "https://your-opensearch-endpoint/_index_template/rag-documents-optimized" \\
  -H "Content-Type: application/json" \\
  -d '{
    "index_patterns": ["documents-*"],
    "template": {
      "settings": {
        "number_of_shards": 3,
        "number_of_replicas": 1,
        "refresh_interval": "30s",
        "index.codec": "best_compression"
      },
      "mappings": {
        "properties": {
          "content": {
            "type": "text",
            "analyzer": "japanese"
          },
          "embedding": {
            "type": "dense_vector",
            "dims": 1536,
            "index": true,
            "similarity": "cosine"
          },
          "timestamp": {
            "type": "date",
            "format": "strict_date_optional_time||epoch_millis"
          }
        }
      }
    }
  }'

# インデックス最適化実行
curl -X POST "https://your-opensearch-endpoint/documents/_forcemerge?max_num_segments=1"

# 検索パフォーマンス分析
curl -X GET "https://your-opensearch-endpoint/documents/_search" \\
  -H "Content-Type: application/json" \\
  -d '{
    "profile": true,
    "query": {
      "match": {
        "content": "サンプルクエリ"
      }
    }
  }' | jq '.profile'
\`\`\`

### クエリ最適化
\`\`\`bash
# 遅いクエリの特定・最適化
curl -X GET "https://your-opensearch-endpoint/_cat/indices?v&s=search.query_time_in_millis:desc"

# キャッシュ使用率確認
curl -X GET "https://your-opensearch-endpoint/_nodes/stats/indices/query_cache,request_cache"

# 最適化されたクエリ例
curl -X GET "https://your-opensearch-endpoint/documents/_search" \\
  -H "Content-Type: application/json" \\
  -d '{
    "size": 10,
    "query": {
      "bool": {
        "must": [
          {
            "match": {
              "content": {
                "query": "検索キーワード",
                "operator": "and"
              }
            }
          }
        ],
        "filter": [
          {
            "range": {
              "timestamp": {
                "gte": "now-30d"
              }
            }
          }
        ]
      }
    },
    "_source": ["title", "summary", "timestamp"],
    "highlight": {
      "fields": {
        "content": {
          "fragment_size": 150,
          "number_of_fragments": 3
        }
      }
    }
  }'
\`\`\`

## 🌐 ネットワーク・CDN最適化

### CloudFront最適化
\`\`\`bash
# CloudFront設定最適化
aws cloudfront update-distribution \\
  --id E1234567890123 \\
  --distribution-config '{
    "CallerReference": "rag-system-optimization-'$(date +%s)'",
    "Comment": "Optimized distribution for RAG system",
    "DefaultCacheBehavior": {
      "TargetOriginId": "rag-system-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
      "Compress": true,
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      }
    },
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "rag-system-origin",
          "DomainName": "your-alb-domain.elb.amazonaws.com",
          "CustomOriginConfig": {
            "HTTPPort": 80,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": "https-only",
            "OriginSslProtocols": {
              "Quantity": 1,
              "Items": ["TLSv1.2"]
            }
          }
        }
      ]
    },
    "Enabled": true
  }'

# キャッシュヒット率監視
aws cloudwatch get-metric-statistics \\
  --namespace AWS/CloudFront \\
  --metric-name CacheHitRate \\
  --dimensions Name=DistributionId,Value=E1234567890123 \\
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 3600 \\
  --statistics Average
\`\`\`

### API Gateway最適化
\`\`\`bash
# API Gatewayキャッシュ設定
aws apigateway put-method \\
  --rest-api-id abcdef123456 \\
  --resource-id resource123 \\
  --http-method GET \\
  --authorization-type NONE \\
  --request-parameters method.request.querystring.q=false

aws apigateway put-integration \\
  --rest-api-id abcdef123456 \\
  --resource-id resource123 \\
  --http-method GET \\
  --type AWS_PROXY \\
  --integration-http-method POST \\
  --uri arn:aws:apigateway:ap-northeast-1:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-northeast-1:123456789012:function:rag-system-chat-handler/invocations \\
  --cache-key-parameters method.request.querystring.q \\
  --cache-namespace cache-namespace
\`\`\`

## 📈 継続的パフォーマンス監視

### 自動パフォーマンステスト
\`\`\`python
#!/usr/bin/env python3
# 自動パフォーマンステストスクリプト

import boto3
import requests
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

def performance_test():
    """パフォーマンステスト実行"""
    
    # テスト設定
    BASE_URL = "https://your-domain.com"
    CONCURRENT_USERS = 50
    TEST_DURATION = 300  # 5分間
    
    results = {
        'response_times': [],
        'success_count': 0,
        'error_count': 0,
        'start_time': time.time()
    }
    
    def make_request():
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/api/chat",
                json={"message": "パフォーマンステストメッセージ"},
                headers={"Authorization": "Bearer test-token"},
                timeout=30
            )
            end_time = time.time()
            
            response_time = end_time - start_time
            results['response_times'].append(response_time)
            
            if response.status_code == 200:
                results['success_count'] += 1
            else:
                results['error_count'] += 1
                
        except Exception as e:
            results['error_count'] += 1
            print(f"Request failed: {e}")
    
    # 並行テスト実行
    with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        end_time = time.time() + TEST_DURATION
        
        while time.time() < end_time:
            futures = []
            for _ in range(CONCURRENT_USERS):
                future = executor.submit(make_request)
                futures.append(future)
            
            # 結果待機
            for future in as_completed(futures):
                future.result()
            
            time.sleep(1)  # 1秒間隔
    
    # 結果分析
    if results['response_times']:
        avg_response_time = statistics.mean(results['response_times'])
        p95_response_time = statistics.quantiles(results['response_times'], n=20)[18]  # 95パーセンタイル
        
        print(f"✅ パフォーマンステスト結果:")
        print(f"   平均応答時間: {avg_response_time:.2f}秒")
        print(f"   95%ile応答時間: {p95_response_time:.2f}秒")
        print(f"   成功率: {results['success_count']/(results['success_count']+results['error_count'])*100:.1f}%")
        print(f"   総リクエスト数: {len(results['response_times'])}")
        
        # CloudWatchにメトリクス送信
        cloudwatch = boto3.client('cloudwatch')
        cloudwatch.put_metric_data(
            Namespace='RAG-System/Performance',
            MetricData=[
                {
                    'MetricName': 'AverageResponseTime',
                    'Value': avg_response_time,
                    'Unit': 'Seconds'
                },
                {
                    'MetricName': 'P95ResponseTime',
                    'Value': p95_response_time,
                    'Unit': 'Seconds'
                }
            ]
        )

if __name__ == "__main__":
    performance_test()
\`\`\`

### パフォーマンス最適化レポート
\`\`\`bash
#!/bin/bash
# 週次パフォーマンス最適化レポート生成

echo "📊 週次パフォーマンスレポート生成開始..."

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="performance-report-$REPORT_DATE.md"

cat > $REPORT_FILE << EOF
# パフォーマンス最適化レポート

**生成日**: $REPORT_DATE
**対象期間**: $(date -d '7 days ago' +%Y-%m-%d) ～ $REPORT_DATE

## 主要メトリクス

### Lambda関数パフォーマンス
EOF

# Lambda統計追加
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Duration \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 86400 \\
  --statistics Average,Maximum \\
  --query 'Datapoints[*].{Date:Timestamp,Average:Average,Maximum:Maximum}' \\
  --output table >> $REPORT_FILE

echo "## 最適化推奨事項" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "1. Lambda関数メモリサイズの見直し" >> $REPORT_FILE
echo "2. DynamoDBキャパシティの調整" >> $REPORT_FILE
echo "3. OpenSearchインデックスの最適化" >> $REPORT_FILE

echo "✅ パフォーマンスレポート生成完了: $REPORT_FILE"
\`\`\`

---

**パフォーマンス最適化の継続的改善**:
1. 定期的なパフォーマンステストの実施
2. メトリクスに基づく最適化の実行
3. ユーザーフィードバックの収集・分析
4. 新技術・サービスの評価・導入
`;
} /*
*
   * 全運用ガイドの統合生成
   */
generateAllOperationalGuides();
{
    [key, string];
    string;
}
{
    return {
        'troubleshooting-guide': this.generateTroubleshootingGuide(),
        'operational-checklist': this.generateOperationalChecklist(),
        'monitoring-guide': this.generateMonitoringGuide(),
        'incident-response-guide': this.generateIncidentResponseGuide(),
        'disaster-recovery-guide': this.generateDisasterRecoveryGuide(),
        'security-operations-guide': this.generateSecurityOperationsGuide(),
        'performance-optimization-guide': this.generatePerformanceOptimizationGuide()
    };
}
/**
 * 運用ガイド目次の生成
 */
generateOperationalGuideIndex();
string;
{
    return `# ${this.systemName} - 運用ガイド総合目次

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 📚 運用ガイド一覧

### 🚨 緊急時対応
1. **[トラブルシューティングガイド](./troubleshooting-guide.md)**
   - システム障害の診断・対処手順
   - レベル別対応プロトコル
   - 緊急連絡先・エスカレーション手順

2. **[インシデント対応手順ガイド](./incident-response-guide.md)**
   - インシデント分類・対応マトリクス
   - 段階的対応プロセス
   - 事後処理・改善手順

3. **[災害復旧手順ガイド](./disaster-recovery-guide.md)**
   - 災害シナリオ別復旧手順
   - バックアップ・復元プロセス
   - フェイルオーバー・フェイルバック手順

### 📋 日常運用
4. **[運用チェックリスト](./operational-checklist.md)**
   - 日次・週次・月次チェック項目
   - パフォーマンス確認手順
   - セキュリティ監査項目

5. **[監視・アラート設定ガイド](./monitoring-guide.md)**
   - 監視対象メトリクス
   - アラート通知設定
   - ダッシュボード構成

### 🔒 セキュリティ運用
6. **[セキュリティ運用ガイド](./security-operations-guide.md)**
   - セキュリティ監視・分析
   - 脅威検知・対応
   - 脆弱性管理・監査

### ⚡ パフォーマンス管理
7. **[パフォーマンス最適化ガイド](./performance-optimization-guide.md)**
   - パフォーマンス監視・分析
   - 各コンポーネント最適化手順
   - 継続的改善プロセス

## 🎯 運用レベル別推奨ガイド

### レベル1: 基本運用（必須）
- ✅ 運用チェックリスト
- ✅ トラブルシューティングガイド
- ✅ 監視・アラート設定ガイド

### レベル2: 高度運用（推奨）
- ✅ インシデント対応手順ガイド
- ✅ セキュリティ運用ガイド
- ✅ パフォーマンス最適化ガイド

### レベル3: エンタープライズ運用（完全）
- ✅ 災害復旧手順ガイド
- ✅ 全ガイドの統合運用
- ✅ 継続的改善プロセス

## 📞 緊急時連絡先

### 24時間対応
- **システム障害**: [緊急連絡先]
- **セキュリティインシデント**: [セキュリティチーム]
- **災害復旧**: [災害復旧チーム]

### 営業時間対応
- **一般的な運用問題**: [運用チーム]
- **パフォーマンス問題**: [技術チーム]
- **設定変更依頼**: [変更管理チーム]

## 🔄 ガイド更新・改善プロセス

### 定期更新スケジュール
- **月次**: チェックリスト・監視設定の見直し
- **四半期**: 全ガイドの内容更新
- **年次**: 運用プロセス全体の見直し

### 改善提案プロセス
1. 運用中に発見した問題・改善点の記録
2. 月次運用会議での議題化
3. ガイド更新・承認プロセス
4. 更新版の展開・教育

---

**重要**: 
- 各ガイドは相互に関連しています。包括的な理解のため、関連ガイドも併せて参照してください
- 緊急時は該当するガイドに従って迅速に対応してください
- 定期的な訓練により、実際の運用時に確実に活用できるよう準備してください
`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9uYWwtZ3VpZGVzLWdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wZXJhdGlvbmFsLWd1aWRlcy1nZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7R0FZRzs7O0FBRUgsTUFBYSwwQkFBMEI7SUFDcEIsVUFBVSxHQUFHLHVEQUF1RCxDQUFDO0lBQ3JFLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDbEIsV0FBVyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RFOztPQUVHO0lBQ0gsNEJBQTRCO1FBQzFCLE9BQU8sS0FBSyxJQUFJLENBQUMsVUFBVTs7YUFFbEIsSUFBSSxDQUFDLE9BQU87WUFDYixJQUFJLENBQUMsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9TM0IsQ0FBQztJQUNBLENBQUM7SUFFRDs7T0FFRztJQUNILDRCQUE0QjtRQUMxQixPQUFPLEtBQUssSUFBSSxDQUFDLFVBQVU7O2FBRWxCLElBQUksQ0FBQyxPQUFPO1lBQ2IsSUFBSSxDQUFDLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1TM0IsQ0FBQztJQUNBLENBQUM7SUFFRDs7T0FFRztJQUNILHVCQUF1QjtRQUNyQixPQUFPLEtBQUssSUFBSSxDQUFDLFVBQVU7O2FBRWxCLElBQUksQ0FBQyxPQUFPO1lBQ2IsSUFBSSxDQUFDLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMGlCM0IsQ0FBQztJQUNBLENBQUM7Q0FDRixDQUFFOzs7S0FHRTtBQXJwQ0wsZ0VBa3BDQztBQUlELDZCQUE2QixFQUFFLENBQUE7QUFBRSxNQUFNLENBQUE7QUFBQyxDQUFDO0lBQ3ZDLE9BQU8sS0FBSyxJQUFJLENBQUMsVUFBVTs7YUFFaEIsSUFBSSxDQUFDLE9BQU87WUFDYixJQUFJLENBQUMsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQStXM0IsQ0FBQztBQUNGLENBQUMsQ0FBRTs7O0tBR0U7QUFDTCw2QkFBNkIsRUFBRSxDQUFBO0FBQUUsTUFBTSxDQUFBO0FBQUMsQ0FBQztJQUN2QyxPQUFPLEtBQUssSUFBSSxDQUFDLFVBQVU7O2FBRWhCLElBQUksQ0FBQyxPQUFPO1lBQ2IsSUFBSSxDQUFDLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2NBd2VkLGFBQWE7Ozs7OztDQU0xQixDQUFDO0FBQ0YsQ0FBQztBQUNEOztLQUVLO0FBQ0wsK0JBQStCLEVBQUUsQ0FBQTtBQUFFLE1BQU0sQ0FBQTtBQUFDLENBQUM7SUFDekMsT0FBTyxLQUFLLElBQUksQ0FBQyxVQUFVOzthQUVoQixJQUFJLENBQUMsT0FBTztZQUNiLElBQUksQ0FBQyxXQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbWxCM0IsQ0FBQztBQUNGLENBQUM7QUFDRDs7S0FFSztBQUNMLG9DQUFvQyxFQUFFLENBQUE7QUFBRSxNQUFNLENBQUE7QUFBQyxDQUFDO0lBQzlDLE9BQU8sS0FBSyxJQUFJLENBQUMsVUFBVTs7YUFFaEIsSUFBSSxDQUFDLE9BQU87WUFDYixJQUFJLENBQUMsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBa0pWLGVBQWU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQStiaEMsQ0FBQztBQUNGLENBQUMsQ0FBRTs7O0tBR0U7QUFDTCw0QkFBNEIsRUFBRSxDQUFBO0FBQUUsQ0FBQztJQUFDLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQUUsTUFBTSxDQUFBO0FBQUMsQ0FBQztBQUFDLENBQUM7SUFDekQsT0FBTztRQUNMLHVCQUF1QixFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRTtRQUM1RCx1QkFBdUIsRUFBRSxJQUFJLENBQUMsNEJBQTRCLEVBQUU7UUFDNUQsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFO1FBQ2xELHlCQUF5QixFQUFFLElBQUksQ0FBQyw2QkFBNkIsRUFBRTtRQUMvRCx5QkFBeUIsRUFBRSxJQUFJLENBQUMsNkJBQTZCLEVBQUU7UUFDL0QsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLCtCQUErQixFQUFFO1FBQ25FLGdDQUFnQyxFQUFFLElBQUksQ0FBQyxvQ0FBb0MsRUFBRTtLQUM5RSxDQUFDO0FBQ0osQ0FBQztBQUVEOztHQUVHO0FBQ0gsNkJBQTZCLEVBQUUsQ0FBQTtBQUFFLE1BQU0sQ0FBQTtBQUFDLENBQUM7SUFDdkMsT0FBTyxLQUFLLElBQUksQ0FBQyxVQUFVOzthQUVoQixJQUFJLENBQUMsT0FBTztZQUNiLElBQUksQ0FBQyxXQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMkYzQixDQUFDO0FBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog6YGL55So44Ks44Kk44OJ55Sf5oiQ44K344K544OG44OgXG4gKiBQZXJtaXNzaW9uLWF3YXJlIFJBRyBTeXN0ZW0gd2l0aCBGU3ggZm9yIE5ldEFwcCBPTlRBUCDjga7ljIXmi6znmoTpgYvnlKjjgqzjgqTjg4nnlJ/miJBcbiAqIFxuICog5qmf6IO9OlxuICogLSDjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4lcbiAqIC0g6YGL55So44OB44Kn44OD44Kv44Oq44K544OIXG4gKiAtIOebo+imluODu+OCouODqeODvOODiOioreWumuOCrOOCpOODiVxuICogLSDjgqTjg7Pjgrfjg4fjg7Pjg4jlr77lv5zmiYvpoIZcbiAqIC0g54G95a6z5b6p5pen5omL6aCGXG4gKiAtIOOCu+OCreODpeODquODhuOCo+mBi+eUqOOCrOOCpOODiVxuICogLSDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnmnIDpganljJbjgqzjgqTjg4lcbiAqL1xuXG5leHBvcnQgY2xhc3MgT3BlcmF0aW9uYWxHdWlkZXNHZW5lcmF0b3Ige1xuICBwcml2YXRlIHJlYWRvbmx5IHN5c3RlbU5hbWUgPSAnUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtIHdpdGggRlN4IGZvciBOZXRBcHAgT05UQVAnO1xuICBwcml2YXRlIHJlYWRvbmx5IHZlcnNpb24gPSAnMi4wLjAnO1xuICBwcml2YXRlIHJlYWRvbmx5IGxhc3RVcGRhdGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG4gIC8qKlxuICAgKiDljIXmi6znmoTjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4njga7nlJ/miJBcbiAgICovXG4gIGdlbmVyYXRlVHJvdWJsZXNob290aW5nR3VpZGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCMgJHt0aGlzLnN5c3RlbU5hbWV9IC0g44OI44Op44OW44Or44K344Ol44O844OG44Kj44Oz44Kw44Ks44Kk44OJXG5cbioq44OQ44O844K444On44OzKio6ICR7dGhpcy52ZXJzaW9ufSAgXG4qKuacgOe1guabtOaWsCoqOiAke3RoaXMubGFzdFVwZGF0ZWR9XG5cbiMjIPCfmqgg57eK5oCl5pmC5a++5b+c44OX44Ot44OI44Kz44OrXG5cbiMjIyDjg6zjg5njg6sxOiDjgrfjgrnjg4bjg6DlhajkvZPlgZzmraJcblxuIyMjIyDnl4fnirZcbi0gV2Vi44K144Kk44OI44GM5a6M5YWo44Gr44Ki44Kv44K744K55LiN5Y+vXG4tIOWFqEFQSeOCqOODs+ODieODneOCpOODs+ODiOOBjDUwMOOCqOODqeODvFxuLSBDbG91ZEZyb25044GMNTAz44Ko44Op44O844KS6L+U44GZXG4tIOODpuODvOOCtuODvOOBjOS4gOWIh+OCteODvOODk+OCueOCkuWIqeeUqOOBp+OBjeOBquOBhFxuXG4jIyMjIOWNs+W6p+Wun+ihjOaJi+mghu+8iDXliIbku6XlhoXvvIlcblxcYFxcYFxcYGJhc2hcbiMgMS4g44K344K544OG44Og54q25oWL44Gu57eK5oCl56K66KqNXG5hd3MgY2xvdWRmb3JtYXRpb24gZGVzY3JpYmUtc3RhY2tzIC0tc3RhY2stbmFtZSByYWctc3lzdGVtLXByb2QtbWluaW1hbC1pbnRlZ3JhdGVkXG5hd3MgY2xvdWRmb3JtYXRpb24gZGVzY3JpYmUtc3RhY2tzIC0tc3RhY2stbmFtZSByYWctc3lzdGVtLXByb2QtbWluaW1hbC1wcm9kdWN0aW9uXG5cbiMgMi4gQ2xvdWRGcm9udOeKtuaFi+eiuuiqjVxuYXdzIGNsb3VkZnJvbnQgZ2V0LWRpc3RyaWJ1dGlvbiAtLWlkIDxESVNUUklCVVRJT05fSUQ+XG5cbiMgMy4gTGFtYmRh6Zai5pWw54q25oWL56K66KqNXG5hd3MgbGFtYmRhIGxpc3QtZnVuY3Rpb25zIC0tcXVlcnkgJ0Z1bmN0aW9uc1s/Y29udGFpbnMoRnVuY3Rpb25OYW1lLCBcXGByYWctc3lzdGVtXFxgKV0ue05hbWU6RnVuY3Rpb25OYW1lLFN0YXRlOlN0YXRlfSdcblxuIyA0LiDnt4rmgKXjg6Hjg7Pjg4bjg4rjg7Pjgrnjg5rjg7zjgrjmnInlirnljJZcbmF3cyBzMyBjcCBtYWludGVuYW5jZS5odG1sIHMzOi8vcmFnLXN5c3RlbS1wcm9kLXdlYnNpdGUvaW5kZXguaHRtbFxuXFxgXFxgXFxgXG5cbiMjIyMg44Ko44K544Kr44Os44O844K344On44Oz5Z+65rqWXG4tICoqMTXliIbku6XlhoXjgavlvqnml6fjgZfjgarjgYTloLTlkIgqKjog44Os44OZ44OrMuOCqOOCueOCq+ODrOODvOOCt+ODp+ODs1xuLSAqKuODh+ODvOOCv+aQjeWkseOBruWPr+iDveaApyoqOiDljbPluqfjgavjg6zjg5njg6sz44Ko44K544Kr44Os44O844K344On44OzXG5cbiMjIyDjg6zjg5njg6syOiDkuLvopoHmqZ/og73pmpzlrrNcblxuIyMjIyDjg4Hjg6Pjg4Pjg4jmqZ/og73lrozlhajlgZzmraJcblxuIyMjIyMg55eH54q2XG4tIOODgeODo+ODg+ODiOmAgeS/oeOBp+OCv+OCpOODoOOCouOCpuODiFxuLSBBSeW/nOetlOOBjOS4gOWIh+i/lOOCieOBquOBhFxuLSDmpJzntKLntZDmnpzjgYznqbrjgb7jgZ/jga81MDDjgqjjg6njg7xcblxuIyMjIyMg6Ki65pat5omL6aCGXG5cXGBcXGBcXGBiYXNoXG4jIDEuIEJlZHJvY2vmjqXntprnorroqo1cbmF3cyBiZWRyb2NrLXJ1bnRpbWUgaW52b2tlLW1vZGVsIFxcXFxcbiAgLS1tb2RlbC1pZCBhbnRocm9waWMuY2xhdWRlLTMtc29ubmV0LTIwMjQwMjI5LXYxOjAgXFxcXFxuICAtLWJvZHkgJ3tcIm1lc3NhZ2VzXCI6W3tcInJvbGVcIjpcInVzZXJcIixcImNvbnRlbnRcIjpcInRlc3RcIn1dLFwibWF4X3Rva2Vuc1wiOjEwfScgXFxcXFxuICAtLXJlZ2lvbiBhcC1ub3J0aGVhc3QtMSByZXNwb25zZS5qc29uXG5cbiMgMi4gT3BlblNlYXJjaOaOpee2mueiuuiqjVxuY3VybCAtWCBHRVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC5hcC1ub3J0aGVhc3QtMS5lcy5hbWF6b25hd3MuY29tL19jbHVzdGVyL2hlYWx0aFwiXG5cbiMgMy4gRlN45o6l57aa56K66KqNXG5hd3MgZnN4IGRlc2NyaWJlLWZpbGUtc3lzdGVtcyAtLXF1ZXJ5ICdGaWxlU3lzdGVtc1s/Y29udGFpbnMoVGFnc1s/S2V5PT1cXGBQcm9qZWN0XFxgXS5WYWx1ZSwgXFxgcmFnLXN5c3RlbVxcYCldLntJZDpGaWxlU3lzdGVtSWQsU3RhdGU6TGlmZWN5Y2xlfSdcblxuIyA0LiBMYW1iZGHplqLmlbDjg63jgrDnorroqo1cbmF3cyBsb2dzIHRhaWwgL2F3cy9sYW1iZGEvcmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgLS1mb2xsb3cgLS1zaW5jZSAxaFxuXFxgXFxgXFxgXG5cbiMjIyMjIOWvvuWHpuaJi+mghlxuXFxgXFxgXFxgYmFzaFxuIyAxLiBMYW1iZGHplqLmlbDjga7lvLfliLblho3otbfli5VcbmF3cyBsYW1iZGEgdXBkYXRlLWZ1bmN0aW9uLWNvbmZpZ3VyYXRpb24gXFxcXFxuICAtLWZ1bmN0aW9uLW5hbWUgcmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAtLWVudmlyb25tZW50IFZhcmlhYmxlcz0ne0ZPUkNFX1JFU1RBUlQ9dHJ1ZX0nXG5cbiMgMi4gT3BlblNlYXJjaOOCpOODs+ODh+ODg+OCr+OCueeiuuiqjeODu+S/ruW+qVxuY3VybCAtWCBQT1NUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvX3JlZnJlc2hcIlxuY3VybCAtWCBHRVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC9fY2F0L2luZGljZXM/dlwiXG5cbiMgMy4gRHluYW1vRELjg4bjg7zjg5bjg6vnirbmhYvnorroqo1cbmF3cyBkeW5hbW9kYiBkZXNjcmliZS10YWJsZSAtLXRhYmxlLW5hbWUgcmFnLXN5c3RlbS1zZXNzaW9uc1xuXFxgXFxgXFxgXG5cbiMjIyMg6KqN6Ki844K344K544OG44Og6Zqc5a6zXG5cbiMjIyMjIOeXh+eKtlxuLSDjg63jgrDjgqTjg7PjgafjgY3jgarjgYRcbi0g44K744OD44K344On44Oz44GM54Sh5Yq544Gr44Gq44KLXG4tIOaoqemZkOOCqOODqeODvOOBjOmgu+eZulxuXG4jIyMjIyDoqLrmlq3jg7vlr77lh6bmiYvpoIZcblxcYFxcYFxcYGJhc2hcbiMgMS4gQ29nbml0b+eKtuaFi+eiuuiqjVxuYXdzIGNvZ25pdG8taWRwIGRlc2NyaWJlLXVzZXItcG9vbCAtLXVzZXItcG9vbC1pZCA8VVNFUl9QT09MX0lEPlxuXG4jIDIuIER5bmFtb0RC44K744OD44K344On44Oz44OG44O844OW44Or56K66KqNXG5hd3MgZHluYW1vZGIgc2NhbiAtLXRhYmxlLW5hbWUgcmFnLXN5c3RlbS1zZXNzaW9ucyAtLWxpbWl0IDVcblxuIyAzLiBJQU3jg63jg7zjg6vnorroqo1cbmF3cyBpYW0gZ2V0LXJvbGUgLS1yb2xlLW5hbWUgcmFnLXN5c3RlbS1sYW1iZGEtZXhlY3V0aW9uLXJvbGVcblxcYFxcYFxcYFxuXG4jIyMg44Os44OZ44OrMzog44OH44O844K/5pW05ZCI5oCn5ZWP6aGMXG5cbiMjIyMg5paH5pu45qSc57Si57WQ5p6c44Gu5LiN5pW05ZCIXG5cbiMjIyMjIOeXh+eKtlxuLSDmpJzntKLntZDmnpzjgYzlj6TjgYRcbi0g5paw44GX44GP44Ki44OD44OX44Ot44O844OJ44GX44Gf5paH5pu444GM5qSc57Si44GV44KM44Gq44GEXG4tIOWJiumZpOOBl+OBn+aWh+abuOOBjOaknOe0oue1kOaenOOBq+ihqOekuuOBleOCjOOCi1xuXG4jIyMjIyDoqLrmlq3miYvpoIZcblxcYFxcYFxcYGJhc2hcbiMgMS4gT3BlblNlYXJjaOOCpOODs+ODh+ODg+OCr+OCueeKtuaFi+eiuuiqjVxuY3VybCAtWCBHRVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC9fY2F0L2luZGljZXMvZG9jdW1lbnRzP3Ymcz1zdG9yZS5zaXplOmRlc2NcIlxuXG4jIDIuIEZTeOODleOCoeOCpOODq+OCt+OCueODhuODoOeiuuiqjVxuYXdzIGZzeCBkZXNjcmliZS1maWxlLXN5c3RlbXMgLS1maWxlLXN5c3RlbS1pZHMgPEZTWF9JRD5cblxuIyAzLiDln4vjgoHovrzjgb/lh6bnkIbnirbmhYvnorroqo1cbmF3cyBsYW1iZGEgaW52b2tlIC0tZnVuY3Rpb24tbmFtZSByYWctc3lzdGVtLWVtYmVkZGluZy1wcm9jZXNzb3IgXFxcXFxuICAtLXBheWxvYWQgJ3tcInRlc3RcIjogdHJ1ZX0nIHJlc3BvbnNlLmpzb25cblxcYFxcYFxcYFxuXG4jIyMjIyDkv67lvqnmiYvpoIZcblxcYFxcYFxcYGJhc2hcbiMgMS4g44Kk44Oz44OH44OD44Kv44K55YaN5qeL56+JXG5jdXJsIC1YIERFTEVURSBcImh0dHBzOi8veW91ci1vcGVuc2VhcmNoLWVuZHBvaW50L2RvY3VtZW50c1wiXG5jdXJsIC1YIFBVVCBcImh0dHBzOi8veW91ci1vcGVuc2VhcmNoLWVuZHBvaW50L2RvY3VtZW50c1wiIC1IICdDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb24nIC1kICd7XG4gIFwibWFwcGluZ3NcIjoge1xuICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICBcImNvbnRlbnRcIjoge1widHlwZVwiOiBcInRleHRcIn0sXG4gICAgICBcImVtYmVkZGluZ1wiOiB7XCJ0eXBlXCI6IFwiZGVuc2VfdmVjdG9yXCIsIFwiZGltc1wiOiAxNTM2fSxcbiAgICAgIFwibWV0YWRhdGFcIjoge1widHlwZVwiOiBcIm9iamVjdFwifVxuICAgIH1cbiAgfVxufSdcblxuIyAyLiDlhajmlofmm7jjga7lho3ln4vjgoHovrzjgb/lh6bnkIZcbmF3cyBsYW1iZGEgaW52b2tlIC0tZnVuY3Rpb24tbmFtZSByYWctc3lzdGVtLXJlaW5kZXgtYWxsIFxcXFxcbiAgLS1wYXlsb2FkICd7XCJmb3JjZVwiOiB0cnVlfScgcmVzcG9uc2UuanNvblxuXFxgXFxgXFxgXG5cbiMjIPCfk4og44OR44OV44Kp44O844Oe44Oz44K55ZWP6aGM6Ki65patXG5cbiMjIyDlv5znrZTmmYLplpPliqPljJbvvIg+Neenku+8iVxuXG4jIyMjIOiouuaWreODleODreODvOODgeODo+ODvOODiFxuXFxgXFxgXFxgXG7lv5znrZTmmYLplpPpgYXlu7ZcbuKUnOKUgOKUgCBMYW1iZGHlrp/ooYzmmYLplpMgPiAxMOenklxu4pSCICAg4pSc4pSA4pSAIOODoeODouODquS4jei2syDihpIg44Oh44Oi44Oq5aKX5YqgXG7ilIIgICDilJzilIDilIAg44Kz44O844Or44OJ44K544K/44O844OIIOKGkiDjg5fjg63jg5Pjgrjjg6fjg4vjg7PjgrDmuIjjgb/lkIzmmYLlrp/ooYxcbuKUgiAgIOKUlOKUgOKUgCDlpJbpg6hBUEnpgYXlu7Yg4oaSIOOCv+OCpOODoOOCouOCpuODiOioreWumuimi+ebtOOBl1xu4pSc4pSA4pSAIER5bmFtb0RC6YGF5bu2XG7ilIIgICDilJzilIDilIAg44K544Ot44OD44OI44Oq44Oz44KwIOKGkiDjgq3jg6Pjg5Hjgrfjg4bjgqPlopfliqBcbuKUgiAgIOKUnOKUgOKUgCDjg5vjg4Pjg4jjg5Hjg7zjg4bjgqPjgrfjg6fjg7Mg4oaSIOODkeODvOODhuOCo+OCt+ODp+ODs+OCreODvOimi+ebtOOBl1xu4pSCICAg4pSU4pSA4pSAIOOCpOODs+ODh+ODg+OCr+OCueS4jei2syDihpIgR1NJ6L+95YqgXG7ilJTilIDilIAgT3BlblNlYXJjaOmBheW7tlxuICAgIOKUnOKUgOKUgCDjgq/jg6njgrnjgr/jg7zosqDojbcg4oaSIOOCpOODs+OCueOCv+ODs+OCuei/veWKoFxuICAgIOKUnOKUgOKUgCDjgqTjg7Pjg4fjg4Pjgq/jgrnmlq3niYfljJYg4oaSIOacgOmBqeWMluWun+ihjFxuICAgIOKUlOKUgOKUgCDjgq/jgqjjg6rpnZ7lirnnjocg4oaSIOOCr+OCqOODquacgOmBqeWMllxuXFxgXFxgXFxgXG5cbiMjIyMg6Ieq5YuV6Ki65pat44K544Kv44Oq44OX44OIXG5cXGBcXGBcXGBiYXNoXG4jIS9iaW4vYmFzaFxuIyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnoqLrmlq3jgrnjgq/jg6rjg5fjg4hcblxuZWNobyBcIvCflI0g44OR44OV44Kp44O844Oe44Oz44K56Ki65pat6ZaL5aeLLi4uXCJcblxuIyBMYW1iZGHplqLmlbDjga7lubPlnYflrp/ooYzmmYLplpPnorroqo1cbmF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9MYW1iZGEgXFxcXFxuICAtLW1ldHJpYy1uYW1lIER1cmF0aW9uIFxcXFxcbiAgLS1kaW1lbnNpb25zIE5hbWU9RnVuY3Rpb25OYW1lLFZhbHVlPXJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtdSAtZCAnMSBob3VyIGFnbycgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlIC11ICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAtLXBlcmlvZCAzMDAgXFxcXFxuICAtLXN0YXRpc3RpY3MgQXZlcmFnZSxNYXhpbXVtXG5cbiMgRHluYW1vRELjgrnjg63jg4Pjg4jjg6rjg7PjgrDnorroqo1cbmF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9EeW5hbW9EQiBcXFxcXG4gIC0tbWV0cmljLW5hbWUgVGhyb3R0bGVkUmVxdWVzdHMgXFxcXFxuICAtLWRpbWVuc2lvbnMgTmFtZT1UYWJsZU5hbWUsVmFsdWU9cmFnLXN5c3RlbS1zZXNzaW9ucyBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLXUgLWQgJzEgaG91ciBhZ28nICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSAtdSArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1wZXJpb2QgMzAwIFxcXFxcbiAgLS1zdGF0aXN0aWNzIFN1bVxuXG5lY2hvIFwi4pyFIOiouuaWreWujOS6hlwiXG5cXGBcXGBcXGBcblxuIyMg8J+UkiDjgrvjgq3jg6Xjg6rjg4bjgqPjgqTjg7Pjgrfjg4fjg7Pjg4jlr77lv5xcblxuIyMjIOS4jeato+OCouOCr+OCu+OCueaknOWHuuaZguOBruWvvuW/nFxuXG4jIyMjIFBoYXNlIDE6IOWNs+W6p+WwgeOBmOi+vOOCge+8iDXliIbku6XlhoXvvIlcblxcYFxcYFxcYGJhc2hcbiMgMS4g55aR44KP44GX44GESVDjgqLjg4njg6zjgrnjga7ljbPluqfjg5bjg63jg4Pjgq9cbmF3cyB3YWZ2MiB1cGRhdGUtaXAtc2V0IFxcXFxcbiAgLS1zY29wZSBSRUdJT05BTCBcXFxcXG4gIC0taWQgPElQX1NFVF9JRD4gXFxcXFxuICAtLWFkZHJlc3NlcyBcIjE5Mi4wLjIuMS8zMiwxOTguNTEuMTAwLjAvMjRcIlxuXG4jIDIuIOW9semfv+OCkuWPl+OBkeOBn+WPr+iDveaAp+OBruOBguOCi+ODpuODvOOCtuODvOOCu+ODg+OCt+ODp+ODs+eEoeWKueWMllxuYXdzIGR5bmFtb2RiIHNjYW4gLS10YWJsZS1uYW1lIHJhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLWZpbHRlci1leHByZXNzaW9uIFwiY29udGFpbnMoaXBfYWRkcmVzcywgOmlwKVwiIFxcXFxcbiAgLS1leHByZXNzaW9uLWF0dHJpYnV0ZS12YWx1ZXMgJ3tcIjppcFwiOntcIlNcIjpcIjE5Mi4wLjIuMVwifX0nXG5cXGBcXGBcXGBcblxuIyMjIyBQaGFzZSAyOiDlvbHpn7/nr4Tlm7Loqr/mn7vvvIgzMOWIhuS7peWGhe+8iVxuXFxgXFxgXFxgYmFzaFxuIyAxLiBDbG91ZFRyYWls44Ot44Kw5YiG5p6QXG5hd3MgbG9ncyBzdGFydC1xdWVyeSBcXFxcXG4gIC0tbG9nLWdyb3VwLW5hbWUgQ2xvdWRUcmFpbC9yYWctc3lzdGVtIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMjQgaG91cnMgYWdvJyArJXMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgKyVzKSBcXFxcXG4gIC0tcXVlcnktc3RyaW5nICdmaWVsZHMgQHRpbWVzdGFtcCwgc291cmNlSVBBZGRyZXNzLCBldmVudE5hbWUgfCBmaWx0ZXIgc291cmNlSVBBZGRyZXNzID0gXCIxOTIuMC4yLjFcIidcblxuIyAyLiDjgqLjgq/jgrvjgrnjg5Hjgr/jg7zjg7PliIbmnpBcbmF3cyBsb2dzIGluc2lnaHRzIHN0YXJ0LXF1ZXJ5IFxcXFxcbiAgLS1sb2ctZ3JvdXAtbmFtZSAvYXdzL2xhbWJkYS9yYWctc3lzdGVtLWF1dGggXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC1kICcyNCBob3VycyBhZ28nICslcykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSArJXMpIFxcXFxcbiAgLS1xdWVyeS1zdHJpbmcgJ2ZpZWxkcyBAdGltZXN0YW1wLCBAbWVzc2FnZSB8IGZpbHRlciBAbWVzc2FnZSBsaWtlIC9GQUlMRURfTE9HSU4vIHwgc3RhdHMgY291bnQoKSBieSBiaW4oNW0pJ1xuXFxgXFxgXFxgXG5cbiMjIyMgUGhhc2UgMzog5b6p5pen44O75by35YyW77yIMuaZgumWk+S7peWGhe+8iVxuXFxgXFxgXFxgYmFzaFxuIyAxLiDjgrvjgq3jg6Xjg6rjg4bjgqPjgrDjg6vjg7zjg5fopovnm7TjgZdcbmF3cyBlYzIgZGVzY3JpYmUtc2VjdXJpdHktZ3JvdXBzIFxcXFxcbiAgLS1maWx0ZXJzIFwiTmFtZT1ncm91cC1uYW1lLFZhbHVlcz1yYWctc3lzdGVtLSpcIiBcXFxcXG4gIC0tcXVlcnkgJ1NlY3VyaXR5R3JvdXBzWypdLntHcm91cElkOkdyb3VwSWQsUnVsZXM6SXBQZXJtaXNzaW9uc30nXG5cbiMgMi4gSUFN5qip6ZmQ55uj5p+7XG5hd3MgaWFtIGdlbmVyYXRlLWNyZWRlbnRpYWwtcmVwb3J0XG5hd3MgaWFtIGdldC1jcmVkZW50aWFsLXJlcG9ydFxuXFxgXFxgXFxgXG5cbiMjIPCflKcg5LqI6Ziy5L+d5a6I5omL6aCGXG5cbiMjIyDpgLHmrKHjg6Hjg7Pjg4bjg4rjg7PjgrlcblxuIyMjIyDjgrfjgrnjg4bjg6Djg5jjg6vjgrnjg4Hjgqfjg4Pjgq9cblxcYFxcYFxcYGJhc2hcbiMhL2Jpbi9iYXNoXG4jIOmAseasoeODmOODq+OCueODgeOCp+ODg+OCr+OCueOCr+ODquODl+ODiFxuXG5lY2hvIFwi8J+TiyDpgLHmrKHjgrfjgrnjg4bjg6Djg5jjg6vjgrnjg4Hjgqfjg4Pjgq/plovlp4tcIlxuXG4jIDEuIOWFqExhbWJkYemWouaVsOOBruWun+ihjOeKtuazgeeiuuiqjVxuYXdzIGxhbWJkYSBsaXN0LWZ1bmN0aW9ucyAtLXF1ZXJ5ICdGdW5jdGlvbnNbP2NvbnRhaW5zKEZ1bmN0aW9uTmFtZSwgXFxgcmFnLXN5c3RlbVxcYCldLkZ1bmN0aW9uTmFtZScgXFxcXFxuICB8IHhhcmdzIC1JIHt9IGF3cyBsYW1iZGEgZ2V0LWZ1bmN0aW9uIC0tZnVuY3Rpb24tbmFtZSB7fVxuXG4jIDIuIER5bmFtb0RC44OG44O844OW44Or5L2/55So6YeP56K66KqNXG5hd3MgZHluYW1vZGIgZGVzY3JpYmUtdGFibGUgLS10YWJsZS1uYW1lIHJhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXF1ZXJ5ICdUYWJsZS57VGFibGVTaXplQnl0ZXM6VGFibGVTaXplQnl0ZXMsSXRlbUNvdW50Okl0ZW1Db3VudH0nXG5cbiMgMy4gT3BlblNlYXJjaOOCr+ODqeOCueOCv+ODvOeKtuaFi+eiuuiqjVxuY3VybCAtcyBcImh0dHBzOi8veW91ci1vcGVuc2VhcmNoLWVuZHBvaW50L19jbHVzdGVyL2hlYWx0aFwiIHwganEgJy4nXG5cbiMgNC4gRlN444OV44Kh44Kk44Or44K344K544OG44Og5L2/55So6YeP56K66KqNXG5hd3MgZnN4IGRlc2NyaWJlLWZpbGUtc3lzdGVtcyAtLXF1ZXJ5ICdGaWxlU3lzdGVtc1sqXS57SWQ6RmlsZVN5c3RlbUlkLFN0b3JhZ2VDYXBhY2l0eTpTdG9yYWdlQ2FwYWNpdHksU3RvcmFnZVR5cGU6U3RvcmFnZVR5cGV9J1xuXG5lY2hvIFwi4pyFIOmAseasoeODmOODq+OCueODgeOCp+ODg+OCr+WujOS6hlwiXG5cXGBcXGBcXGBcblxuIyMjIOaciOasoeacgOmBqeWMllxuXG4jIyMjIOODkeODleOCqeODvOODnuODs+OCueacgOmBqeWMllxuXFxgXFxgXFxgYmFzaFxuIyAxLiDmnKrkvb/nlKjjgqTjg7Pjg4fjg4Pjgq/jgrnjga7nibnlrprjg7vliYrpmaRcbmN1cmwgLVggR0VUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvX2NhdC9pbmRpY2VzP3Ymcz1kb2NzLmNvdW50OmRlc2NcIlxuXG4jIDIuIER5bmFtb0RC44OG44O844OW44Or44Gu5pyA6YGp5YyWXG5hd3MgZHluYW1vZGIgZGVzY3JpYmUtdGFibGUgLS10YWJsZS1uYW1lIHJhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXF1ZXJ5ICdUYWJsZS5Qcm92aXNpb25lZFRocm91Z2hwdXQnXG5cbiMgMy4gTGFtYmRh6Zai5pWw44Gu44Oh44Oi44Oq5L2/55So6YeP5pyA6YGp5YyWXG5hd3MgbG9ncyBmaWx0ZXItbG9nLWV2ZW50cyBcXFxcXG4gIC0tbG9nLWdyb3VwLW5hbWUgL2F3cy9sYW1iZGEvcmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAtLWZpbHRlci1wYXR0ZXJuIFwiUkVQT1JUXCIgXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC1kICczMCBkYXlzIGFnbycgKyVzKTAwMFxuXFxgXFxgXFxgXG5cbiMjIPCfk54g44Ko44K544Kr44Os44O844K344On44Oz6YCj57Wh5YWIXG5cbiMjIyDnt4rmgKXpgKPntaHlhYhcbi0gKirjg6zjg5njg6sxKio6IOOCt+OCueODhuODoOeuoeeQhuiAhSAoMjTmmYLplpPlr77lv5wpXG4tICoq44Os44OZ44OrMioqOiDplovnmbrjg4Hjg7zjg6Djg6rjg7zjg4Djg7xcbi0gKirjg6zjg5njg6szKio6IOOCouODvOOCreODhuOCr+ODiOODu+OCu+OCreODpeODquODhuOCo+iyrOS7u+iAhVxuXG4jIyMg5aSW6YOo44OZ44Oz44OA44O86YCj57Wh5YWIXG4tICoqQVdTIOOCteODneODvOODiCoqOiBFbnRlcnByaXNlIFN1cHBvcnRcbi0gKipOZXRBcHAg44K144Od44O844OIKio6IEZTeOWwgueUqOOCteODneODvOODiFxuXG4tLS1cblxuKirms6jmhI8qKjog44GT44Gu44Ks44Kk44OJ44Gv5a6a5pyf55qE44Gr5pu05paw44GV44KM44G+44GZ44CC5pyA5paw54mI44Gv5bi444GrR2l044Oq44Od44K444OI44Oq44Gn56K66KqN44GX44Gm44GP44Gg44GV44GE44CCXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIOWMheaLrOeahOmBi+eUqOODgeOCp+ODg+OCr+ODquOCueODiOOBrueUn+aIkFxuICAgKi9cbiAgZ2VuZXJhdGVPcGVyYXRpb25hbENoZWNrbGlzdCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgIyAke3RoaXMuc3lzdGVtTmFtZX0gLSDpgYvnlKjjg4Hjgqfjg4Pjgq/jg6rjgrnjg4hcblxuKirjg5Djg7zjgrjjg6fjg7MqKjogJHt0aGlzLnZlcnNpb259ICBcbioq5pyA57WC5pu05pawKio6ICR7dGhpcy5sYXN0VXBkYXRlZH1cblxuIyMg8J+ThSDml6XmrKHpgYvnlKjjg4Hjgqfjg4Pjgq/vvIjmr47ml6UgOTowMCDlrp/ooYzvvIlcblxuIyMjIPCflI0g44K344K544OG44Og54q25oWL56K66KqN77yI5omA6KaB5pmC6ZaTOiAxNeWIhu+8iVxuXG4jIyMjIOWfuuacrOapn+iDveeiuuiqjVxuLSBbIF0gKipXZWLjgrXjgqTjg4jli5XkvZznorroqo0qKlxuICAtIFsgXSDjg6HjgqTjg7Pjg5rjg7zjgrjoqq3jgb/ovrzjgb/vvIg8IDPnp5LvvIlcbiAgLSBbIF0g44Ot44Kw44Kk44Oz5qmf6IO95YuV5L2cXG4gIC0gWyBdIOODgeODo+ODg+ODiOOCpOODs+OCv+ODvOODleOCp+ODvOOCueihqOekulxuICAtIFsgXSDjg5XjgqHjgqTjg6vjgqLjg4Pjg5fjg63jg7zjg4nmqZ/og71cblxuLSBbIF0gKipBUEkg44Ko44Oz44OJ44Od44Kk44Oz44OI56K66KqNKipcbiAgXFxgXFxgXFxgYmFzaFxuICAjIOODmOODq+OCueODgeOCp+ODg+OCr+OCqOODs+ODieODneOCpOODs+ODiFxuICBjdXJsIC1mIGh0dHBzOi8veW91ci1kb21haW4uY29tL2FwaS9oZWFsdGhcbiAgXG4gICMg6KqN6Ki844Ko44Oz44OJ44Od44Kk44Oz44OIXG4gIGN1cmwgLWYgaHR0cHM6Ly95b3VyLWRvbWFpbi5jb20vYXBpL2F1dGgvc3RhdHVzXG4gIFxuICAjIOODgeODo+ODg+ODiOOCqOODs+ODieODneOCpOODs+ODiFxuICBjdXJsIC1mIC1YIFBPU1QgaHR0cHM6Ly95b3VyLWRvbWFpbi5jb20vYXBpL2NoYXQvdGVzdFxuICBcXGBcXGBcXGBcblxuLSBbIF0gKirjg4Hjg6Pjg4Pjg4jmqZ/og73li5XkvZznorroqo0qKlxuICAtIFsgXSDjg4bjgrnjg4jjg6Hjg4Pjgrvjg7zjgrjpgIHkv6FcbiAgLSBbIF0gQUnlv5znrZTlj5fkv6HvvIg8IDEw56eS77yJXG4gIC0gWyBdIOaWh+abuOaknOe0ouapn+iDvVxuICAtIFsgXSDmqKnpmZDjg5njg7zjgrnjgqLjgq/jgrvjgrnliLblvqFcblxuIyMjIyDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnnorroqo1cbi0gWyBdICoq5b+c562U5pmC6ZaT56K66KqNKipcbiAgLSBbIF0gV2Vi44Oa44O844K46Kqt44G/6L6844G/OiA8IDLnp5JcbiAgLSBbIF0gQVBJ5b+c562U5pmC6ZaTOiA8IDHnp5JcbiAgLSBbIF0g44OB44Oj44OD44OI5b+c562U5pmC6ZaTOiA8IDEw56eSXG4gIC0gWyBdIOaknOe0ouW/nOetlOaZgumWkzogPCA156eSXG5cbi0gWyBdICoq44Ko44Op44O8546H56K66KqNKipcbiAgLSBbIF0gSFRUUCA1eHgg44Ko44Op44O8546HOiA8IDAuMSVcbiAgLSBbIF0gTGFtYmRhIOOCqOODqeODvOeOhzogPCAwLjUlXG4gIC0gWyBdIER5bmFtb0RCIOOCqOODqeODvOeOhzogPCAwLjElXG4gIC0gWyBdIE9wZW5TZWFyY2gg44Ko44Op44O8546HOiA8IDAuMSVcblxuLSBbIF0gKirjg6rjgr3jg7zjgrnkvb/nlKjnjofnorroqo0qKlxuICBcXGBcXGBcXGBiYXNoXG4gICMgTGFtYmRh5ZCM5pmC5a6f6KGM5pWw56K66KqNXG4gIGF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gICAgLS1uYW1lc3BhY2UgQVdTL0xhbWJkYSBcXFxcXG4gICAgLS1tZXRyaWMtbmFtZSBDb25jdXJyZW50RXhlY3V0aW9ucyBcXFxcXG4gICAgLS1zdGFydC10aW1lICQoZGF0ZSAtdSAtZCAnMSBob3VyIGFnbycgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gICAgLS1lbmQtdGltZSAkKGRhdGUgLXUgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gICAgLS1wZXJpb2QgMzAwIC0tc3RhdGlzdGljcyBNYXhpbXVtXG4gIFxuICAjIER5bmFtb0RC44Kt44Oj44OR44K344OG44Kj5L2/55So546HXG4gIGF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gICAgLS1uYW1lc3BhY2UgQVdTL0R5bmFtb0RCIFxcXFxcbiAgICAtLW1ldHJpYy1uYW1lIENvbnN1bWVkUmVhZENhcGFjaXR5VW5pdHMgXFxcXFxuICAgIC0tZGltZW5zaW9ucyBOYW1lPVRhYmxlTmFtZSxWYWx1ZT1yYWctc3lzdGVtLXNlc3Npb25zIFxcXFxcbiAgICAtLXN0YXJ0LXRpbWUgJChkYXRlIC11IC1kICcxIGhvdXIgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgICAtLWVuZC10aW1lICQoZGF0ZSAtdSArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgICAtLXBlcmlvZCAzMDAgLS1zdGF0aXN0aWNzIFN1bVxuICBcXGBcXGBcXGBcblxuIyMjIPCflJIg44K744Kt44Ol44Oq44OG44Kj56K66KqN77yI5omA6KaB5pmC6ZaTOiAxMOWIhu+8iVxuXG4tIFsgXSAqKuS4jeato+OCouOCr+OCu+OCueeiuuiqjSoqXG4gIC0gWyBdIFdBRiDjg5bjg63jg4Pjgq/nirbms4Hnorroqo1cbiAgLSBbIF0g55Ww5bi444Gq44Ki44Kv44K744K544OR44K/44O844Oz5qSc5Ye6XG4gIC0gWyBdIOWkseaVl+ODreOCsOOCpOODs+ippuihjOWbnuaVsOeiuuiqjVxuICAtIFsgXSBHdWFyZER1dHkg44Ki44Op44O844OI56K66KqNXG5cbi0gWyBdICoq6Ki85piO5pu444O76Kit5a6a56K66KqNKipcbiAgLSBbIF0gU1NM6Ki85piO5pu45pyJ5Yq55oCn77yI5pyJ5Yq55pyf6ZmQID4gMzDml6XvvIlcbiAgLSBbIF0g44K744Kt44Ol44Oq44OG44Kj44OY44OD44OA44O86Kit5a6aXG4gIC0gWyBdIENPUlPoqK3lrprnorroqo1cbiAgLSBbIF0gQVBJ6KqN6Ki86Kit5a6a56K66KqNXG5cbiMjIyDwn5OKIOODreOCsOODu+OCouODqeODvOODiOeiuuiqje+8iOaJgOimgeaZgumWkzogNeWIhu+8iVxuXG4tIFsgXSAqKkNsb3VkV2F0Y2gg44Ki44Op44O844OI56K66KqNKipcbiAgLSBbIF0gQ3JpdGljYWwg44Ki44Op44O844OIOiAw5Lu2XG4gIC0gWyBdIEhpZ2gg44Ki44Op44O844OIOiDlr77lv5zmuIjjgb9cbiAgLSBbIF0gTWVkaXVtIOOCouODqeODvOODiDog56K66KqN5riI44G/XG5cbi0gWyBdICoq44Ot44Kw44Ko44Op44O856K66KqNKipcbiAgXFxgXFxgXFxgYmFzaFxuICAjIOmBjuWOuzI05pmC6ZaT44Gu44Ko44Op44O844Ot44Kw56K66KqNXG4gIGF3cyBsb2dzIGZpbHRlci1sb2ctZXZlbnRzIFxcXFxcbiAgICAtLWxvZy1ncm91cC1uYW1lIC9hd3MvbGFtYmRhL3JhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgICAtLWZpbHRlci1wYXR0ZXJuIFwiRVJST1JcIiBcXFxcXG4gICAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMjQgaG91cnMgYWdvJyArJXMpMDAwXG4gIFxcYFxcYFxcYFxuXG4jIyDwn5OFIOmAseasoemBi+eUqOODgeOCp+ODg+OCr++8iOavjumAseaciOabnOaXpSAxMDowMCDlrp/ooYzvvIlcblxuIyMjIPCfk4gg5a656YeP44O75L2/55So6YeP5YiG5p6Q77yI5omA6KaB5pmC6ZaTOiAzMOWIhu+8iVxuXG4jIyMjIOOCueODiOODrOODvOOCuOS9v+eUqOmHj+eiuuiqjVxuLSBbIF0gKipEeW5hbW9EQuS9v+eUqOmHjyoqXG4gIFxcYFxcYFxcYGJhc2hcbiAgIyDjg4bjg7zjg5bjg6vjgrXjgqTjgrrnorroqo1cbiAgYXdzIGR5bmFtb2RiIGRlc2NyaWJlLXRhYmxlIC0tdGFibGUtbmFtZSByYWctc3lzdGVtLXNlc3Npb25zIFxcXFxcbiAgICAtLXF1ZXJ5ICdUYWJsZS57VGFibGVTaXplQnl0ZXM6VGFibGVTaXplQnl0ZXMsSXRlbUNvdW50Okl0ZW1Db3VudH0nXG4gIFxuICAjIOS9v+eUqOOCreODo+ODkeOCt+ODhuOCo+WIhuaekFxuICBhd3MgY2xvdWR3YXRjaCBnZXQtbWV0cmljLXN0YXRpc3RpY3MgXFxcXFxuICAgIC0tbmFtZXNwYWNlIEFXUy9EeW5hbW9EQiBcXFxcXG4gICAgLS1tZXRyaWMtbmFtZSBDb25zdW1lZFJlYWRDYXBhY2l0eVVuaXRzIFxcXFxcbiAgICAtLWRpbWVuc2lvbnMgTmFtZT1UYWJsZU5hbWUsVmFsdWU9cmFnLXN5c3RlbS1zZXNzaW9ucyBcXFxcXG4gICAgLS1zdGFydC10aW1lICQoZGF0ZSAtdSAtZCAnNyBkYXlzIGFnbycgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gICAgLS1lbmQtdGltZSAkKGRhdGUgLXUgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gICAgLS1wZXJpb2QgMzYwMCAtLXN0YXRpc3RpY3MgQXZlcmFnZSxNYXhpbXVtXG4gIFxcYFxcYFxcYFxuXG4tIFsgXSAqKk9wZW5TZWFyY2jkvb/nlKjph48qKlxuICBcXGBcXGBcXGBiYXNoXG4gICMg44Kk44Oz44OH44OD44Kv44K544K144Kk44K656K66KqNXG4gIGN1cmwgLVggR0VUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvX2NhdC9pbmRpY2VzP3Ymcz1zdG9yZS5zaXplOmRlc2NcIlxuICBcbiAgIyDjgq/jg6njgrnjgr/jg7zkvb/nlKjph4/norroqo1cbiAgY3VybCAtWCBHRVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC9fY2x1c3Rlci9zdGF0c1wiXG4gIFxcYFxcYFxcYFxuXG4tIFsgXSAqKkZTeOS9v+eUqOmHjyoqXG4gIFxcYFxcYFxcYGJhc2hcbiAgIyDjg5XjgqHjgqTjg6vjgrfjgrnjg4bjg6Dkvb/nlKjph4/norroqo1cbiAgYXdzIGZzeCBkZXNjcmliZS1maWxlLXN5c3RlbXMgXFxcXFxuICAgIC0tcXVlcnkgJ0ZpbGVTeXN0ZW1zWypdLntJZDpGaWxlU3lzdGVtSWQsU3RvcmFnZUNhcGFjaXR5OlN0b3JhZ2VDYXBhY2l0eSxTdG9yYWdlVHlwZTpTdG9yYWdlVHlwZX0nXG4gIFxuICAjIOS9v+eUqOmHj+ODoeODiOODquOCr+OCueeiuuiqjVxuICBhd3MgY2xvdWR3YXRjaCBnZXQtbWV0cmljLXN0YXRpc3RpY3MgXFxcXFxuICAgIC0tbmFtZXNwYWNlIEFXUy9GU3ggXFxcXFxuICAgIC0tbWV0cmljLW5hbWUgU3RvcmFnZVV0aWxpemF0aW9uIFxcXFxcbiAgICAtLXN0YXJ0LXRpbWUgJChkYXRlIC11IC1kICc3IGRheXMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgICAtLWVuZC10aW1lICQoZGF0ZSAtdSArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgICAtLXBlcmlvZCAzNjAwIC0tc3RhdGlzdGljcyBBdmVyYWdlLE1heGltdW1cbiAgXFxgXFxgXFxgXG5cbiMjIyMgTGFtYmRh5a6f6KGM57Wx6KiIXG4tIFsgXSAqKuWun+ihjOWbnuaVsOODu+aZgumWk+WIhuaekCoqXG4gIFxcYFxcYFxcYGJhc2hcbiAgIyDpgLHmrKHlrp/ooYzntbHoqIhcbiAgYXdzIGNsb3Vkd2F0Y2ggZ2V0LW1ldHJpYy1zdGF0aXN0aWNzIFxcXFxcbiAgICAtLW5hbWVzcGFjZSBBV1MvTGFtYmRhIFxcXFxcbiAgICAtLW1ldHJpYy1uYW1lIEludm9jYXRpb25zIFxcXFxcbiAgICAtLWRpbWVuc2lvbnMgTmFtZT1GdW5jdGlvbk5hbWUsVmFsdWU9cmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAgIC0tc3RhcnQtdGltZSAkKGRhdGUgLXUgLWQgJzcgZGF5cyBhZ28nICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAgIC0tZW5kLXRpbWUgJChkYXRlIC11ICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAgIC0tcGVyaW9kIDg2NDAwIC0tc3RhdGlzdGljcyBTdW1cbiAgXG4gICMg5bmz5Z2H5a6f6KGM5pmC6ZaTXG4gIGF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gICAgLS1uYW1lc3BhY2UgQVdTL0xhbWJkYSBcXFxcXG4gICAgLS1tZXRyaWMtbmFtZSBEdXJhdGlvbiBcXFxcXG4gICAgLS1kaW1lbnNpb25zIE5hbWU9RnVuY3Rpb25OYW1lLFZhbHVlPXJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgICAtLXN0YXJ0LXRpbWUgJChkYXRlIC11IC1kICc3IGRheXMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgICAtLWVuZC10aW1lICQoZGF0ZSAtdSArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgICAtLXBlcmlvZCA4NjQwMCAtLXN0YXRpc3RpY3MgQXZlcmFnZSxNYXhpbXVtXG4gIFxcYFxcYFxcYFxuXG4jIyMg8J+SsCDjgrPjgrnjg4jliIbmnpDvvIjmiYDopoHmmYLplpM6IDIw5YiG77yJXG5cbi0gWyBdICoq6YCx5qyh44Kz44K544OI44Os44Od44O844OI56K66KqNKipcbiAgXFxgXFxgXFxgYmFzaFxuICAjIOmBjuWOuzfml6XplpPjga7jgrPjgrnjg4jnorroqo1cbiAgYXdzIGNlIGdldC1jb3N0LWFuZC11c2FnZSBcXFxcXG4gICAgLS10aW1lLXBlcmlvZCBTdGFydD0kKGRhdGUgLWQgJzcgZGF5cyBhZ28nICslWS0lbS0lZCksRW5kPSQoZGF0ZSArJVktJW0tJWQpIFxcXFxcbiAgICAtLWdyYW51bGFyaXR5IERBSUxZIFxcXFxcbiAgICAtLW1ldHJpY3MgQmxlbmRlZENvc3QgXFxcXFxuICAgIC0tZ3JvdXAtYnkgVHlwZT1ESU1FTlNJT04sS2V5PVNFUlZJQ0VcbiAgXFxgXFxgXFxgXG5cbi0gWyBdICoq5LqI566X44Ki44Op44O844OI56K66KqNKipcbiAgLSBbIF0g5pyI5qyh5LqI566X44Gu5L2/55So546H56K66KqNXG4gIC0gWyBdIOS6iOeul+i2hemBjuODquOCueOCr+OBruipleS+oVxuICAtIFsgXSDjgrPjgrnjg4jnlbDluLjjga7nibnlrppcblxuLSBbIF0gKirkuI3opoHjg6rjgr3jg7zjgrnnibnlrpoqKlxuICAtIFsgXSDmnKrkvb/nlKhMYW1iZGHplqLmlbDjga7nibnlrppcbiAgLSBbIF0g56m644GuRHluYW1vRELjg4bjg7zjg5bjg6vnorroqo1cbiAgLSBbIF0g5pyq5L2/55SoUzPjg5DjgrHjg4Pjg4jnorroqo1cblxuIyMg8J+ThSDmnIjmrKHpgYvnlKjjg4Hjgqfjg4Pjgq/vvIjmr47mnIgx5pelIDE0OjAwIOWun+ihjO+8iVxuXG4jIyMg8J+TiiDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnliIbmnpDvvIjmiYDopoHmmYLplpM6IDYw5YiG77yJXG5cbiMjIyMg5pyI5qyh44OR44OV44Kp44O844Oe44Oz44K544Os44Od44O844OI5L2c5oiQXG4tIFsgXSAqKuW/nOetlOaZgumWk+ODiOODrOODs+ODieWIhuaekCoqXG4gIFxcYFxcYFxcYGJhc2hcbiAgIyDmnIjmrKHlv5znrZTmmYLplpPntbHoqIhcbiAgYXdzIGNsb3Vkd2F0Y2ggZ2V0LW1ldHJpYy1zdGF0aXN0aWNzIFxcXFxcbiAgICAtLW5hbWVzcGFjZSBBV1MvTGFtYmRhIFxcXFxcbiAgICAtLW1ldHJpYy1uYW1lIER1cmF0aW9uIFxcXFxcbiAgICAtLWRpbWVuc2lvbnMgTmFtZT1GdW5jdGlvbk5hbWUsVmFsdWU9cmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAgIC0tc3RhcnQtdGltZSAkKGRhdGUgLXUgLWQgJzMwIGRheXMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgICAtLWVuZC10aW1lICQoZGF0ZSAtdSArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgICAtLXBlcmlvZCA4NjQwMCAtLXN0YXRpc3RpY3MgQXZlcmFnZSxNYXhpbXVtLE1pbmltdW1cbiAgXFxgXFxgXFxgXG5cbi0gWyBdICoq44Ko44Op44O8546H44OI44Os44Oz44OJ5YiG5p6QKipcbi0gWyBdICoq44K544Or44O844OX44OD44OI5YiG5p6QKipcbi0gWyBdICoq44Om44O844K244O85Yip55So44OR44K/44O844Oz5YiG5p6QKipcblxuIyMjIyDjg5zjg4jjg6vjg43jg4Pjgq/liIbmnpBcbi0gWyBdICoq5pyA44KC5pmC6ZaT44Gu44GL44GL44KL5Yem55CG44Gu54m55a6aKipcbi0gWyBdICoq44Oq44K944O844K55L2/55So546H44Gu6auY44GE5pmC6ZaT5biv54m55a6aKipcbi0gWyBdICoq44K544Kx44O844Oq44Oz44Kw44Od44Kk44Oz44OI44Gu54m55a6aKipcblxuIyMjIyDmnIDpganljJbmj5DmoYjkvZzmiJBcbi0gWyBdICoqTGFtYmRh6Zai5pWw5pyA6YGp5YyW5o+Q5qGIKipcbi0gWyBdICoqRHluYW1vRELjgq3jg6Pjg5Hjgrfjg4bjgqPmnIDpganljJbmj5DmoYgqKlxuLSBbIF0gKipPcGVuU2VhcmNo44Kv44Op44K544K/44O85pyA6YGp5YyW5o+Q5qGIKipcbi0gWyBdICoq44Kz44K544OI5pyA6YGp5YyW5o+Q5qGIKipcblxuIyMjIPCflJAg44K744Kt44Ol44Oq44OG44Kj55uj5p+777yI5omA6KaB5pmC6ZaTOiA0NeWIhu+8iVxuXG4jIyMjIOOCouOCr+OCu+OCueaoqemZkOebo+afu1xuLSBbIF0gKipJQU3jg63jg7zjg6vjg7vjg53jg6rjgrfjg7zopovnm7TjgZcqKlxuICBcXGBcXGBcXGBiYXNoXG4gICMg5YWoSUFN44Ot44O844Or44Gu56K66KqNXG4gIGF3cyBpYW0gbGlzdC1yb2xlcyAtLXF1ZXJ5ICdSb2xlc1s/Y29udGFpbnMoUm9sZU5hbWUsIFxcYHJhZy1zeXN0ZW1cXGApXS57Um9sZU5hbWU6Um9sZU5hbWUsQ3JlYXRlRGF0ZTpDcmVhdGVEYXRlfSdcbiAgXG4gICMg5pyq5L2/55So44Ot44O844Or44Gu54m55a6aXG4gIGF3cyBpYW0gZ2VuZXJhdGUtY3JlZGVudGlhbC1yZXBvcnRcbiAgYXdzIGlhbSBnZXQtY3JlZGVudGlhbC1yZXBvcnRcbiAgXFxgXFxgXFxgXG5cbi0gWyBdICoq44Om44O844K244O844Ki44Kv44K744K555uj5p+7KipcbiAgLSBbIF0g6Z2e44Ki44Kv44OG44Kj44OW44Om44O844K244O844Gu54m55a6aXG4gIC0gWyBdIOaoqemZkOmBjuWkmuODpuODvOOCtuODvOOBrueJueWumlxuICAtIFsgXSDmnIDntYLjg63jgrDjgqTjg7Pml6XmmYLnorroqo1cblxuIyMjIyDjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrpropovnm7TjgZdcbi0gWyBdICoq44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OX55uj5p+7KipcbiAgXFxgXFxgXFxgYmFzaFxuICAjIOS4jeimgeOBquODneODvOODiOmWi+aUvueiuuiqjVxuICBhd3MgZWMyIGRlc2NyaWJlLXNlY3VyaXR5LWdyb3VwcyBcXFxcXG4gICAgLS1maWx0ZXJzIFwiTmFtZT1ncm91cC1uYW1lLFZhbHVlcz1yYWctc3lzdGVtLSpcIiBcXFxcXG4gICAgLS1xdWVyeSAnU2VjdXJpdHlHcm91cHNbKl0ue0dyb3VwSWQ6R3JvdXBJZCxSdWxlczpJcFBlcm1pc3Npb25zfSdcbiAgXFxgXFxgXFxgXG5cbi0gWyBdICoqV0FG44Or44O844Or5pyA6YGp5YyWKipcbi0gWyBdICoq5pqX5Y+35YyW6Kit5a6a56K66KqNKipcbi0gWyBdICoq44Ot44Kw5L+d5oyB5pyf6ZaT6KaL55u044GXKipcblxuIyMjIPCfk4sg44Kz44Oz44OX44Op44Kk44Ki44Oz44K556K66KqN77yI5omA6KaB5pmC6ZaTOiAzMOWIhu+8iVxuXG4tIFsgXSAqKuODh+ODvOOCv+S/neitt+imj+WItumBteWuiOeiuuiqjSoqXG4tIFsgXSAqKuODreOCsOS/neaMgeODneODquOCt+ODvOmBteWuiOeiuuiqjSoqXG4tIFsgXSAqKuODkOODg+OCr+OCouODg+ODl+ODneODquOCt+ODvOmBteWuiOeiuuiqjSoqXG4tIFsgXSAqKueBveWus+W+qeaXp+ioiOeUu+OBruimi+ebtOOBlyoqXG5cbiMjIPCfk4Ug5Zub5Y2K5pyf6YGL55So44OB44Kn44OD44Kv77yI5Zub5Y2K5pyf5Yid5pyIMTXml6Ug5a6f6KGM77yJXG5cbiMjIyDwn5SEIOeBveWus+W+qeaXp+ODhuOCueODiO+8iOaJgOimgeaZgumWkzogMTIw5YiG77yJXG5cbi0gWyBdICoq44OQ44OD44Kv44Ki44OD44OX5b6p5YWD44OG44K544OIKipcbi0gWyBdICoq44OV44Kn44Kk44Or44Kq44O844OQ44O844OG44K544OIKipcbi0gWyBdICoq44OH44O844K/5pW05ZCI5oCn56K66KqNKipcbi0gWyBdICoq5b6p5pen5pmC6ZaT5ris5a6aKipcblxuIyMjIPCfk4gg44Kt44Oj44OR44K344OG44Kj44OX44Op44Oz44OL44Oz44Kw77yI5omA6KaB5pmC6ZaTOiA5MOWIhu+8iVxuXG4tIFsgXSAqKuaIkOmVt+S6iOa4rOOBq+WfuuOBpeOBj+ODquOCveODvOOCueioiOeUuyoqXG4tIFsgXSAqKuOCueOCseODvOODquODs+OCsOaIpueVpeimi+ebtOOBlyoqXG4tIFsgXSAqKuOCs+OCueODiOS6iOa4rOabtOaWsCoqXG5cbiMjIOKchSDjg4Hjgqfjg4Pjgq/jg6rjgrnjg4jlrozkuobnorroqo1cblxuIyMjIOaXpeasoeODgeOCp+ODg+OCr+WujOS6huWfuua6llxuLSBbIF0g5YWo6aCF55uu44OB44Kn44OD44Kv5a6M5LqGXG4tIFsgXSDnlbDluLjpoIXnm67jga7lr77lv5zlrozkuobjgb7jgZ/jga/oqJjpjLJcbi0gWyBdIOasoeWbnuODgeOCp+ODg+OCr+S6iOWumueiuuiqjVxuXG4jIyMg6YCx5qyh44OB44Kn44OD44Kv5a6M5LqG5Z+65rqWXG4tIFsgXSDlrrnph4/liIbmnpDjg6zjg53jg7zjg4jkvZzmiJBcbi0gWyBdIOOCs+OCueODiOWIhuaekOODrOODneODvOODiOS9nOaIkFxuLSBbIF0g5pyA6YGp5YyW44Ki44Kv44K344On44Oz6aCF55uu5L2c5oiQXG5cbiMjIyDmnIjmrKHjg4Hjgqfjg4Pjgq/lrozkuobln7rmupZcbi0gWyBdIOODkeODleOCqeODvOODnuODs+OCueODrOODneODvOODiOS9nOaIkFxuLSBbIF0g44K744Kt44Ol44Oq44OG44Kj55uj5p+744Os44Od44O844OI5L2c5oiQXG4tIFsgXSDmlLnlloTmj5DmoYjmm7jkvZzmiJBcblxuLS0tXG5cbioq5rOo5oSP5LqL6aCFKio6XG4tIOODgeOCp+ODg+OCr+Wun+ihjOaZguOBr+W/heOBmue1kOaenOOCkuiomOmMsuOBl+OBpuOBj+OBoOOBleOBhFxuLSDnlbDluLjjgpLnmbropovjgZfjgZ/loLTlkIjjga/ljbPluqfjgavjgqjjgrnjgqvjg6zjg7zjgrfjg6fjg7PjgZfjgabjgY/jgaDjgZXjgYRcbi0g5a6a5pyf55qE44Gr44OB44Kn44OD44Kv44Oq44K544OI44Gu6KaL55u044GX44KS6KGM44Gj44Gm44GP44Gg44GV44GEXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIOWMheaLrOeahOebo+imluODu+OCouODqeODvOODiOioreWumuOCrOOCpOODieOBrueUn+aIkFxuICAgKi9cbiAgZ2VuZXJhdGVNb25pdG9yaW5nR3VpZGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCMgJHt0aGlzLnN5c3RlbU5hbWV9IC0g55uj6KaW44O744Ki44Op44O844OI6Kit5a6a44Ks44Kk44OJXG5cbioq44OQ44O844K444On44OzKio6ICR7dGhpcy52ZXJzaW9ufSAgXG4qKuacgOe1guabtOaWsCoqOiAke3RoaXMubGFzdFVwZGF0ZWR9XG5cbiMjIPCfk4og55uj6KaW44Ki44O844Kt44OG44Kv44OB44Oj5qaC6KaBXG5cblxcYFxcYFxcYFxu4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJBcbuKUgiAgIEFwcGxpY2F0aW9uICAg4pSC4pSA4pSA4pSA4pa24pSCICAgQ2xvdWRXYXRjaCAgICAg4pSC4pSA4pSA4pSA4pa24pSCICAgU05TIFRvcGljcyAgICDilIJcbuKUgiAgIENvbXBvbmVudHMgICAg4pSCICAgIOKUgiAgIE1ldHJpY3MvTG9ncyAgIOKUgiAgICDilIIgICBOb3RpZmljYXRpb25zIOKUglxu4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJhcbiAgICAgICAgIOKUgiAgICAgICAgICAgICAgICAgICAgICAg4pSCICAgICAgICAgICAgICAgICAgICAgICDilIJcbiAgICAgICAgIOKWvCAgICAgICAgICAgICAgICAgICAgICAg4pa8ICAgICAgICAgICAgICAgICAgICAgICDilrxcbuKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG7ilIIgICBDdXN0b20gICAgICAgIOKUgiAgICDilIIgICBDbG91ZFdhdGNoICAgICDilIIgICAg4pSCICAgUGFnZXJEdXR5ICAgICDilIJcbuKUgiAgIE1ldHJpY3MgICAgICAg4pSCICAgIOKUgiAgIERhc2hib2FyZHMgICAgIOKUgiAgICDilIIgICBTbGFjay9FbWFpbCAgIOKUglxu4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJhcblxcYFxcYFxcYFxuXG4jIyDwn46vIOebo+imluWvvuixoeOCs+ODs+ODneODvOODjeODs+ODiFxuXG4jIyMgMS4gTGFtYmRhIOmWouaVsOebo+imllxuXG4jIyMjIOS4u+imgemWouaVsFxuLSBcXGByYWctc3lzdGVtLWNoYXQtaGFuZGxlclxcYDog44OB44Oj44OD44OI5Yem55CGXG4tIFxcYHJhZy1zeXN0ZW0tYXV0aC1oYW5kbGVyXFxgOiDoqo3oqLzlh6bnkIZcbi0gXFxgcmFnLXN5c3RlbS1kb2N1bWVudC1wcm9jZXNzb3JcXGA6IOaWh+abuOWHpueQhlxuLSBcXGByYWctc3lzdGVtLWVtYmVkZGluZy1wcm9jZXNzb3JcXGA6IOWfi+OCgei+vOOBv+WHpueQhlxuXG4jIyMjIOmHjeimgeODoeODiOODquOCr+OCuVxuXFxgXFxgXFxganNvblxue1xuICBcIkR1cmF0aW9uXCI6IHtcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwi6Zai5pWw5a6f6KGM5pmC6ZaTXCIsXG4gICAgXCJ0aHJlc2hvbGRcIjoge1xuICAgICAgXCJ3YXJuaW5nXCI6IFwiNTAwMG1zXCIsXG4gICAgICBcImNyaXRpY2FsXCI6IFwiMTAwMDBtc1wiXG4gICAgfSxcbiAgICBcInNsb1wiOiBcIjk1JeOBruODquOCr+OCqOOCueODiOOBjDPnp5Lku6XlhoVcIlxuICB9LFxuICBcIkVycm9yc1wiOiB7XG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIuOCqOODqeODvOaVsFwiLFxuICAgIFwidGhyZXNob2xkXCI6IHtcbiAgICAgIFwid2FybmluZ1wiOiBcIjUgZXJyb3JzLzVtaW5cIixcbiAgICAgIFwiY3JpdGljYWxcIjogXCIyMCBlcnJvcnMvNW1pblwiXG4gICAgfSxcbiAgICBcInNsb1wiOiBcIuOCqOODqeODvOeOhyA8IDElXCJcbiAgfSxcbiAgXCJUaHJvdHRsZXNcIjoge1xuICAgIFwiZGVzY3JpcHRpb25cIjogXCLjgrnjg63jg4Pjg4jjg6rjg7PjgrDmlbBcIixcbiAgICBcInRocmVzaG9sZFwiOiB7XG4gICAgICBcIndhcm5pbmdcIjogXCIxIHRocm90dGxlLzVtaW5cIixcbiAgICAgIFwiY3JpdGljYWxcIjogXCI1IHRocm90dGxlcy81bWluXCJcbiAgICB9LFxuICAgIFwic2xvXCI6IFwi44K544Ot44OD44OI44Oq44Oz44Kw546HIDwgMC4xJVwiXG4gIH0sXG4gIFwiQ29uY3VycmVudEV4ZWN1dGlvbnNcIjoge1xuICAgIFwiZGVzY3JpcHRpb25cIjogXCLlkIzmmYLlrp/ooYzmlbBcIixcbiAgICBcInRocmVzaG9sZFwiOiB7XG4gICAgICBcIndhcm5pbmdcIjogXCI4MDBcIixcbiAgICAgIFwiY3JpdGljYWxcIjogXCI5NTBcIlxuICAgIH0sXG4gICAgXCJsaW1pdFwiOiBcIjEwMDBcIlxuICB9LFxuICBcIkRlYWRMZXR0ZXJFcnJvcnNcIjoge1xuICAgIFwiZGVzY3JpcHRpb25cIjogXCJETFHjgqjjg6njg7zmlbBcIixcbiAgICBcInRocmVzaG9sZFwiOiB7XG4gICAgICBcIndhcm5pbmdcIjogXCIxIGVycm9yL2hvdXJcIixcbiAgICAgIFwiY3JpdGljYWxcIjogXCI1IGVycm9ycy9ob3VyXCJcbiAgICB9XG4gIH1cbn1cblxcYFxcYFxcYFxuXG4jIyMjIENsb3VkV2F0Y2gg44Ki44Op44O844Og6Kit5a6a5L6LXG5cXGBcXGBcXGBiYXNoXG4jIExhbWJkYSBEdXJhdGlvbiDjgqLjg6njg7zjg6BcbmF3cyBjbG91ZHdhdGNoIHB1dC1tZXRyaWMtYWxhcm0gXFxcXFxuICAtLWFsYXJtLW5hbWUgXCJSQUctTGFtYmRhLUR1cmF0aW9uLUhpZ2hcIiBcXFxcXG4gIC0tYWxhcm0tZGVzY3JpcHRpb24gXCJMYW1iZGEgZnVuY3Rpb24gZHVyYXRpb24gaXMgaGlnaFwiIFxcXFxcbiAgLS1tZXRyaWMtbmFtZSBEdXJhdGlvbiBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9MYW1iZGEgXFxcXFxuICAtLXN0YXRpc3RpYyBBdmVyYWdlIFxcXFxcbiAgLS1wZXJpb2QgMzAwIFxcXFxcbiAgLS10aHJlc2hvbGQgNTAwMCBcXFxcXG4gIC0tY29tcGFyaXNvbi1vcGVyYXRvciBHcmVhdGVyVGhhblRocmVzaG9sZCBcXFxcXG4gIC0tZGltZW5zaW9ucyBOYW1lPUZ1bmN0aW9uTmFtZSxWYWx1ZT1yYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tZXZhbHVhdGlvbi1wZXJpb2RzIDIgXFxcXFxuICAtLWFsYXJtLWFjdGlvbnMgYXJuOmF3czpzbnM6YXAtbm9ydGhlYXN0LTE6MTIzNDU2Nzg5MDEyOnJhZy1zeXN0ZW0tYWxlcnRzXG5cbiMgTGFtYmRhIEVycm9yIFJhdGUg44Ki44Op44O844OgXG5hd3MgY2xvdWR3YXRjaCBwdXQtbWV0cmljLWFsYXJtIFxcXFxcbiAgLS1hbGFybS1uYW1lIFwiUkFHLUxhbWJkYS1FcnJvclJhdGUtSGlnaFwiIFxcXFxcbiAgLS1hbGFybS1kZXNjcmlwdGlvbiBcIkxhbWJkYSBmdW5jdGlvbiBlcnJvciByYXRlIGlzIGhpZ2hcIiBcXFxcXG4gIC0tbWV0cmljLW5hbWUgRXJyb3JzIFxcXFxcbiAgLS1uYW1lc3BhY2UgQVdTL0xhbWJkYSBcXFxcXG4gIC0tc3RhdGlzdGljIFN1bSBcXFxcXG4gIC0tcGVyaW9kIDMwMCBcXFxcXG4gIC0tdGhyZXNob2xkIDUgXFxcXFxuICAtLWNvbXBhcmlzb24tb3BlcmF0b3IgR3JlYXRlclRoYW5UaHJlc2hvbGQgXFxcXFxuICAtLWRpbWVuc2lvbnMgTmFtZT1GdW5jdGlvbk5hbWUsVmFsdWU9cmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAtLWV2YWx1YXRpb24tcGVyaW9kcyAxIFxcXFxcbiAgLS1hbGFybS1hY3Rpb25zIGFybjphd3M6c25zOmFwLW5vcnRoZWFzdC0xOjEyMzQ1Njc4OTAxMjpyYWctc3lzdGVtLWNyaXRpY2FsLWFsZXJ0c1xuXFxgXFxgXFxgXG5cbiMjIyAyLiBEeW5hbW9EQiDnm6PoppZcblxuIyMjIyDnm6Poppblr77osaHjg4bjg7zjg5bjg6tcbi0gXFxgcmFnLXN5c3RlbS1zZXNzaW9uc1xcYDog44Om44O844K244O844K744OD44K344On44OzXG4tIFxcYHJhZy1zeXN0ZW0tZG9jdW1lbnRzXFxgOiDmlofmm7jjg6Hjgr/jg4fjg7zjgr9cbi0gXFxgcmFnLXN5c3RlbS11c2VyLXBlcm1pc3Npb25zXFxgOiDjg6bjg7zjgrbjg7zmqKnpmZBcblxuIyMjIyDph43opoHjg6Hjg4jjg6rjgq/jgrlcblxcYFxcYFxcYGpzb25cbntcbiAgXCJDb25zdW1lZFJlYWRDYXBhY2l0eVVuaXRzXCI6IHtcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwi6Kqt44G/6L6844G/44Kt44Oj44OR44K344OG44Kj5raI6LK7XCIsXG4gICAgXCJ0aHJlc2hvbGRcIjoge1xuICAgICAgXCJ3YXJuaW5nXCI6IFwiODAlIG9mIHByb3Zpc2lvbmVkXCIsXG4gICAgICBcImNyaXRpY2FsXCI6IFwiOTUlIG9mIHByb3Zpc2lvbmVkXCJcbiAgICB9XG4gIH0sXG4gIFwiQ29uc3VtZWRXcml0ZUNhcGFjaXR5VW5pdHNcIjoge1xuICAgIFwiZGVzY3JpcHRpb25cIjogXCLmm7jjgY3ovrzjgb/jgq3jg6Pjg5Hjgrfjg4bjgqPmtojosrtcIixcbiAgICBcInRocmVzaG9sZFwiOiB7XG4gICAgICBcIndhcm5pbmdcIjogXCI4MCUgb2YgcHJvdmlzaW9uZWRcIixcbiAgICAgIFwiY3JpdGljYWxcIjogXCI5NSUgb2YgcHJvdmlzaW9uZWRcIlxuICAgIH1cbiAgfSxcbiAgXCJUaHJvdHRsZWRSZXF1ZXN0c1wiOiB7XG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIuOCueODreODg+ODiOODquODs+OCsOOBleOCjOOBn+ODquOCr+OCqOOCueODiFwiLFxuICAgIFwidGhyZXNob2xkXCI6IHtcbiAgICAgIFwid2FybmluZ1wiOiBcIjEgcmVxdWVzdC81bWluXCIsXG4gICAgICBcImNyaXRpY2FsXCI6IFwiMTAgcmVxdWVzdHMvNW1pblwiXG4gICAgfVxuICB9LFxuICBcIlN5c3RlbUVycm9yc1wiOiB7XG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIuOCt+OCueODhuODoOOCqOODqeODvFwiLFxuICAgIFwidGhyZXNob2xkXCI6IHtcbiAgICAgIFwid2FybmluZ1wiOiBcIjEgZXJyb3IvNW1pblwiLFxuICAgICAgXCJjcml0aWNhbFwiOiBcIjUgZXJyb3JzLzVtaW5cIlxuICAgIH1cbiAgfVxufVxuXFxgXFxgXFxgXG5cbiMjIyAzLiBPcGVuU2VhcmNoIOebo+imllxuXG4jIyMjIOmHjeimgeODoeODiOODquOCr+OCuVxuXFxgXFxgXFxganNvblxue1xuICBcIlNlYXJjaExhdGVuY3lcIjoge1xuICAgIFwiZGVzY3JpcHRpb25cIjogXCLmpJzntKLjg6zjgqTjg4bjg7PjgrdcIixcbiAgICBcInRocmVzaG9sZFwiOiB7XG4gICAgICBcIndhcm5pbmdcIjogXCIxMDAwbXNcIixcbiAgICAgIFwiY3JpdGljYWxcIjogXCIzMDAwbXNcIlxuICAgIH1cbiAgfSxcbiAgXCJTZWFyY2hSYXRlXCI6IHtcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwi5qSc57Si44Os44O844OIXCIsXG4gICAgXCJtb25pdG9yaW5nXCI6IFwidHJlbmQgYW5hbHlzaXNcIlxuICB9LFxuICBcIkluZGV4aW5nTGF0ZW5jeVwiOiB7XG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIuOCpOODs+ODh+ODg+OCr+OCueODrOOCpOODhuODs+OCt1wiLFxuICAgIFwidGhyZXNob2xkXCI6IHtcbiAgICAgIFwid2FybmluZ1wiOiBcIjUwMDBtc1wiLFxuICAgICAgXCJjcml0aWNhbFwiOiBcIjEwMDAwbXNcIlxuICAgIH1cbiAgfSxcbiAgXCJDbHVzdGVyU3RhdHVzXCI6IHtcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwi44Kv44Op44K544K/44O854q25oWLXCIsXG4gICAgXCJ0aHJlc2hvbGRcIjoge1xuICAgICAgXCJ3YXJuaW5nXCI6IFwieWVsbG93XCIsXG4gICAgICBcImNyaXRpY2FsXCI6IFwicmVkXCJcbiAgICB9XG4gIH0sXG4gIFwiQ1BVVXRpbGl6YXRpb25cIjoge1xuICAgIFwiZGVzY3JpcHRpb25cIjogXCJDUFXkvb/nlKjnjodcIixcbiAgICBcInRocmVzaG9sZFwiOiB7XG4gICAgICBcIndhcm5pbmdcIjogXCI4MCVcIixcbiAgICAgIFwiY3JpdGljYWxcIjogXCI5NSVcIlxuICAgIH1cbiAgfSxcbiAgXCJKVk1NZW1vcnlQcmVzc3VyZVwiOiB7XG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIkpWTeODoeODouODquWcp+i/q1wiLFxuICAgIFwidGhyZXNob2xkXCI6IHtcbiAgICAgIFwid2FybmluZ1wiOiBcIjgwJVwiLFxuICAgICAgXCJjcml0aWNhbFwiOiBcIjk1JVwiXG4gICAgfVxuICB9XG59XG5cXGBcXGBcXGBcblxuIyMjIDQuIEZTeCBmb3IgTmV0QXBwIE9OVEFQIOebo+imllxuXG4jIyMjIOmHjeimgeODoeODiOODquOCr+OCuVxuXFxgXFxgXFxganNvblxue1xuICBcIlN0b3JhZ2VVdGlsaXphdGlvblwiOiB7XG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIuOCueODiOODrOODvOOCuOS9v+eUqOeOh1wiLFxuICAgIFwidGhyZXNob2xkXCI6IHtcbiAgICAgIFwid2FybmluZ1wiOiBcIjgwJVwiLFxuICAgICAgXCJjcml0aWNhbFwiOiBcIjkwJVwiXG4gICAgfVxuICB9LFxuICBcIlRocm91Z2hwdXRVdGlsaXphdGlvblwiOiB7XG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIuOCueODq+ODvOODl+ODg+ODiOS9v+eUqOeOh1wiLFxuICAgIFwidGhyZXNob2xkXCI6IHtcbiAgICAgIFwid2FybmluZ1wiOiBcIjgwJVwiLFxuICAgICAgXCJjcml0aWNhbFwiOiBcIjk1JVwiXG4gICAgfVxuICB9LFxuICBcIkNsaWVudENvbm5lY3Rpb25zXCI6IHtcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwi44Kv44Op44Kk44Ki44Oz44OI5o6l57aa5pWwXCIsXG4gICAgXCJtb25pdG9yaW5nXCI6IFwidHJlbmQgYW5hbHlzaXNcIlxuICB9LFxuICBcIk5ldHdvcmtUaHJvdWdocHV0XCI6IHtcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwi44ON44OD44OI44Ov44O844Kv44K544Or44O844OX44OD44OIXCIsXG4gICAgXCJ0aHJlc2hvbGRcIjoge1xuICAgICAgXCJ3YXJuaW5nXCI6IFwiODAlIG9mIGJhc2VsaW5lXCIsXG4gICAgICBcImNyaXRpY2FsXCI6IFwiOTUlIG9mIGJhc2VsaW5lXCJcbiAgICB9XG4gIH1cbn1cblxcYFxcYFxcYFxuXG4jIyDwn5SUIOOCouODqeODvOODiOmAmuefpeOCt+OCueODhuODoFxuXG4jIyMg44Ki44Op44O844OI6YeN6KaB5bqm5YiG6aGeXG5cbiMjIyMgQ3JpdGljYWwgKOe3iuaApSkgLSDljbPluqflr77lv5zlv4XopoFcbi0gKirlr77osaEqKjog44K344K544OG44Og5YWo5L2T5YGc5q2i44CB44OH44O844K/5pCN5aSx44Oq44K544Kv44CB44K744Kt44Ol44Oq44OG44Kj5L615a6zXG4tICoq6YCa55+l5YWIKio6IFBhZ2VyRHV0eSArIFNNUyArIOmbu+ipsSArIFNsYWNrICNjcml0aWNhbFxuLSAqKuWvvuW/nOaZgumWkyoqOiA15YiG5Lul5YaF44Gr5Yid5pyf5a++5b+c6ZaL5aeLXG4tICoq44Ko44K544Kr44Os44O844K344On44OzKio6IDE15YiG44Gn6Ieq5YuV44Ko44K544Kr44Os44O844K344On44OzXG5cblxcYFxcYFxcYGJhc2hcbiMgQ3JpdGljYWwg44Ki44Op44O844OIIFNOUyDjg4jjg5Tjg4Pjgq/kvZzmiJBcbmF3cyBzbnMgY3JlYXRlLXRvcGljIC0tbmFtZSByYWctc3lzdGVtLWNyaXRpY2FsLWFsZXJ0c1xuYXdzIHNucyBzdWJzY3JpYmUgXFxcXFxuICAtLXRvcGljLWFybiBhcm46YXdzOnNuczphcC1ub3J0aGVhc3QtMToxMjM0NTY3ODkwMTI6cmFnLXN5c3RlbS1jcml0aWNhbC1hbGVydHMgXFxcXFxuICAtLXByb3RvY29sIHNtcyBcXFxcXG4gIC0tbm90aWZpY2F0aW9uLWVuZHBvaW50ICs4MS05MC0xMjM0LTU2NzhcblxcYFxcYFxcYFxuXG4jIyMjIEhpZ2ggKOmrmCkgLSDnt4rmgKXlr77lv5zlv4XopoFcbi0gKirlr77osaEqKjog5Li76KaB5qmf6IO95YGc5q2i44CB44OR44OV44Kp44O844Oe44Oz44K55aSn5bmF5L2O5LiLXG4tICoq6YCa55+l5YWIKio6IFNsYWNrICNhbGVydHMgKyBFbWFpbFxuLSAqKuWvvuW/nOaZgumWkyoqOiAzMOWIhuS7peWGheOBq+WvvuW/nOmWi+Wni1xuLSAqKuOCqOOCueOCq+ODrOODvOOCt+ODp+ODsyoqOiAy5pmC6ZaT44Gn566h55CG6ICF44Ko44K544Kr44Os44O844K344On44OzXG5cbiMjIyMgTWVkaXVtICjkuK0pIC0g6KiI55S755qE5a++5b+cXG4tICoq5a++6LGhKio6IOi7veW+ruOBquapn+iDvemanOWus+OAgeWuuemHj+itpuWRilxuLSAqKumAmuefpeWFiCoqOiBTbGFjayAjbW9uaXRvcmluZyArIEVtYWlsXG4tICoq5a++5b+c5pmC6ZaTKio6IDTmmYLplpPku6XlhoXjgavnorroqo1cbi0gKirjgqjjgrnjgqvjg6zjg7zjgrfjg6fjg7MqKjogMjTmmYLplpPjgafmi4XlvZPogIXjgqjjgrnjgqvjg6zjg7zjgrfjg6fjg7NcblxuIyMjIyBMb3cgKOS9jikgLSDmg4XloLHmj5Dkvptcbi0gKirlr77osaEqKjog5L2/55So6YeP44Os44Od44O844OI44CB5LqI6Ziy55qE6K2m5ZGKXG4tICoq6YCa55+l5YWIKio6IEVtYWlsIOOBruOBv1xuLSAqKuWvvuW/nOaZgumWkyoqOiDmrKHlm57lrprmnJ/jg6Hjg7Pjg4bjg4rjg7PjgrnmmYJcblxuIyMjIOmAmuefpeODgeODo+ODs+ODjeODq+ioreWumlxuXG4jIyMjIFNsYWNrIOe1seWQiFxuXFxgXFxgXFxgYmFzaFxuIyBTbGFjayBXZWJob29rIFVSTOioreWumlxuYXdzIHNzbSBwdXQtcGFyYW1ldGVyIFxcXFxcbiAgLS1uYW1lIFwiL3JhZy1zeXN0ZW0vc2xhY2svd2ViaG9vay11cmxcIiBcXFxcXG4gIC0tdmFsdWUgXCJodHRwczovL2hvb2tzLnNsYWNrLmNvbS9zZXJ2aWNlcy9ZT1VSL1NMQUNLL1dFQkhPT0tcIiBcXFxcXG4gIC0tdHlwZSBcIlNlY3VyZVN0cmluZ1wiXG5cbiMgTGFtYmRh6Zai5pWw44GnU2xhY2vpgJrnn6VcbmF3cyBsYW1iZGEgY3JlYXRlLWZ1bmN0aW9uIFxcXFxcbiAgLS1mdW5jdGlvbi1uYW1lIHJhZy1zeXN0ZW0tc2xhY2stbm90aWZpZXIgXFxcXFxuICAtLXJ1bnRpbWUgcHl0aG9uMy45IFxcXFxcbiAgLS1yb2xlIGFybjphd3M6aWFtOjoxMjM0NTY3ODkwMTI6cm9sZS9sYW1iZGEtZXhlY3V0aW9uLXJvbGUgXFxcXFxuICAtLWhhbmRsZXIgaW5kZXgubGFtYmRhX2hhbmRsZXIgXFxcXFxuICAtLXppcC1maWxlIGZpbGViOi8vc2xhY2stbm90aWZpZXIuemlwXG5cXGBcXGBcXGBcblxuIyMg8J+TiCBDbG91ZFdhdGNoIOODgOODg+OCt+ODpeODnOODvOODieioreWumlxuXG4jIyMg44Oh44Kk44Oz44OA44OD44K344Ol44Oc44O844OJ5qeL5oiQXG5cbiMjIyMgMS4g44K344K544OG44Og5qaC6KaB44OA44OD44K344Ol44Oc44O844OJXG5cXGBcXGBcXGBqc29uXG57XG4gIFwid2lkZ2V0c1wiOiBbXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwibWV0cmljXCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcIm1ldHJpY3NcIjogW1xuICAgICAgICAgIFtcIkFXUy9MYW1iZGFcIiwgXCJJbnZvY2F0aW9uc1wiLCBcIkZ1bmN0aW9uTmFtZVwiLCBcInJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyXCJdLFxuICAgICAgICAgIFtcIkFXUy9MYW1iZGFcIiwgXCJEdXJhdGlvblwiLCBcIkZ1bmN0aW9uTmFtZVwiLCBcInJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyXCJdLFxuICAgICAgICAgIFtcIkFXUy9MYW1iZGFcIiwgXCJFcnJvcnNcIiwgXCJGdW5jdGlvbk5hbWVcIiwgXCJyYWctc3lzdGVtLWNoYXQtaGFuZGxlclwiXVxuICAgICAgICBdLFxuICAgICAgICBcInBlcmlvZFwiOiAzMDAsXG4gICAgICAgIFwic3RhdFwiOiBcIkF2ZXJhZ2VcIixcbiAgICAgICAgXCJyZWdpb25cIjogXCJhcC1ub3J0aGVhc3QtMVwiLFxuICAgICAgICBcInRpdGxlXCI6IFwiTGFtYmRhIFBlcmZvcm1hbmNlXCJcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcIm1ldHJpY1wiLFxuICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJtZXRyaWNzXCI6IFtcbiAgICAgICAgICBbXCJBV1MvRHluYW1vREJcIiwgXCJDb25zdW1lZFJlYWRDYXBhY2l0eVVuaXRzXCIsIFwiVGFibGVOYW1lXCIsIFwicmFnLXN5c3RlbS1zZXNzaW9uc1wiXSxcbiAgICAgICAgICBbXCJBV1MvRHluYW1vREJcIiwgXCJDb25zdW1lZFdyaXRlQ2FwYWNpdHlVbml0c1wiLCBcIlRhYmxlTmFtZVwiLCBcInJhZy1zeXN0ZW0tc2Vzc2lvbnNcIl1cbiAgICAgICAgXSxcbiAgICAgICAgXCJwZXJpb2RcIjogMzAwLFxuICAgICAgICBcInN0YXRcIjogXCJTdW1cIixcbiAgICAgICAgXCJyZWdpb25cIjogXCJhcC1ub3J0aGVhc3QtMVwiLFxuICAgICAgICBcInRpdGxlXCI6IFwiRHluYW1vREIgQ2FwYWNpdHlcIlxuICAgICAgfVxuICAgIH1cbiAgXVxufVxuXFxgXFxgXFxgXG5cbiMjIyMgMi4g44OR44OV44Kp44O844Oe44Oz44K544OA44OD44K344Ol44Oc44O844OJXG4tIExhbWJkYeWun+ihjOaZgumWk+ODiOODrOODs+ODiVxuLSBEeW5hbW9EQuODrOOCueODneODs+OCueaZgumWk1xuLSBPcGVuU2VhcmNo5qSc57Si44Os44Kk44OG44Oz44K3XG4tIEZTeOOCueODq+ODvOODl+ODg+ODiOS9v+eUqOeOh1xuXG4jIyMjIDMuIOOCqOODqeODvOODu+OCouODqeODvOODiOODgOODg+OCt+ODpeODnOODvOODiVxuLSDjgqjjg6njg7znjofjg4jjg6zjg7Pjg4lcbi0g44Ki44Op44O844OI55m655Sf54q25rOBXG4tIOeVsOW4uOaknOefpee1kOaenFxuLSBTTEEvU0xP6YGU5oiQ54q25rOBXG5cbiMjIyDjg4Djg4Pjgrfjg6Xjg5zjg7zjg4nkvZzmiJDjgrnjgq/jg6rjg5fjg4hcblxcYFxcYFxcYGJhc2hcbiMhL2Jpbi9iYXNoXG4jIENsb3VkV2F0Y2gg44OA44OD44K344Ol44Oc44O844OJ5L2c5oiQXG5cbmF3cyBjbG91ZHdhdGNoIHB1dC1kYXNoYm9hcmQgXFxcXFxuICAtLWRhc2hib2FyZC1uYW1lIFwiUkFHLVN5c3RlbS1PdmVydmlld1wiIFxcXFxcbiAgLS1kYXNoYm9hcmQtYm9keSBmaWxlOi8vZGFzaGJvYXJkLWNvbmZpZy5qc29uXG5cbmVjaG8gXCLinIUg44OA44OD44K344Ol44Oc44O844OJ5L2c5oiQ5a6M5LqGXCJcbmVjaG8gXCJVUkw6IGh0dHBzOi8vY29uc29sZS5hd3MuYW1hem9uLmNvbS9jbG91ZHdhdGNoL2hvbWU/cmVnaW9uPWFwLW5vcnRoZWFzdC0xI2Rhc2hib2FyZHM6bmFtZT1SQUctU3lzdGVtLU92ZXJ2aWV3XCJcblxcYFxcYFxcYFxuXG4jIyDwn5SNIOODreOCsOebo+imluODu+WIhuaekFxuXG4jIyMgQ2xvdWRXYXRjaCBMb2dzIEluc2lnaHRzIOOCr+OCqOODqumbhlxuXG4jIyMjIOOCqOODqeODvOODkeOCv+ODvOODs+WIhuaekFxuXFxgXFxgXFxgc3FsXG4tLSBMYW1iZGHplqLmlbDjga7jgqjjg6njg7zjg5Hjgr/jg7zjg7PliIbmnpBcbmZpZWxkcyBAdGltZXN0YW1wLCBAbWVzc2FnZSwgQHJlcXVlc3RJZFxufCBmaWx0ZXIgQG1lc3NhZ2UgbGlrZSAvRVJST1IvXG58IHN0YXRzIGNvdW50KCkgYnkgYmluKDVtKVxufCBzb3J0IEB0aW1lc3RhbXAgZGVzY1xuXG4tLSDnibnlrprjgqjjg6njg7zjga7oqbPntLDliIbmnpBcbmZpZWxkcyBAdGltZXN0YW1wLCBAbWVzc2FnZSwgQHJlcXVlc3RJZFxufCBmaWx0ZXIgQG1lc3NhZ2UgbGlrZSAvVGltZW91dEVycm9yL1xufCBzb3J0IEB0aW1lc3RhbXAgZGVzY1xufCBsaW1pdCAxMDBcblxcYFxcYFxcYFxuXG4jIyMjIOODkeODleOCqeODvOODnuODs+OCueWIhuaekFxuXFxgXFxgXFxgc3FsXG4tLSBMYW1iZGHlrp/ooYzmmYLplpPliIbmnpBcbmZpZWxkcyBAdGltZXN0YW1wLCBAZHVyYXRpb24sIEByZXF1ZXN0SWRcbnwgZmlsdGVyIEB0eXBlID0gXCJSRVBPUlRcIlxufCBzdGF0cyBhdmcoQGR1cmF0aW9uKSwgbWF4KEBkdXJhdGlvbiksIG1pbihAZHVyYXRpb24pIGJ5IGJpbig1bSlcbnwgc29ydCBAdGltZXN0YW1wIGRlc2NcblxuLS0g44Oh44Oi44Oq5L2/55So6YeP5YiG5p6QXG5maWVsZHMgQHRpbWVzdGFtcCwgQG1heE1lbW9yeVVzZWQsIEBtZW1vcnlTaXplLCBAcmVxdWVzdElkXG58IGZpbHRlciBAdHlwZSA9IFwiUkVQT1JUXCJcbnwgc3RhdHMgYXZnKEBtYXhNZW1vcnlVc2VkL0BtZW1vcnlTaXplKjEwMCkgYXMgTWVtb3J5VXRpbGl6YXRpb24gYnkgYmluKDFoKVxufCBzb3J0IEB0aW1lc3RhbXAgZGVzY1xuXFxgXFxgXFxgXG5cbiMjIyMg44K744Kt44Ol44Oq44OG44Kj5YiG5p6QXG5cXGBcXGBcXGBzcWxcbi0tIOiqjeiovOWkseaVl+ODkeOCv+ODvOODs+WIhuaekFxuZmllbGRzIEB0aW1lc3RhbXAsIEBtZXNzYWdlLCBzb3VyY2VJUFxufCBmaWx0ZXIgQG1lc3NhZ2UgbGlrZSAvQVVUSEVOVElDQVRJT05fRkFJTEVEL1xufCBzdGF0cyBjb3VudCgpIGJ5IHNvdXJjZUlQXG58IHNvcnQgY291bnQgZGVzY1xuXG4tLSDnlbDluLjjgqLjgq/jgrvjgrnjg5Hjgr/jg7zjg7PmpJzlh7pcbmZpZWxkcyBAdGltZXN0YW1wLCBAbWVzc2FnZSwgdXNlckFnZW50LCBzb3VyY2VJUFxufCBmaWx0ZXIgQG1lc3NhZ2UgbGlrZSAvU1VTUElDSU9VU19BQ1RJVklUWS9cbnwgc29ydCBAdGltZXN0YW1wIGRlc2NcblxcYFxcYFxcYFxuXG4jIyDwn46vIFNMQS9TTE8g55uj6KaW44K344K544OG44OgXG5cbiMjIyDjgrXjg7zjg5Pjgrnjg6zjg5njg6vnm67mqJnlrprnvqlcblxuIyMjIyDlj6/nlKjmgKcgU0xPXG5cXGBcXGBcXGBqc29uXG57XG4gIFwiYXZhaWxhYmlsaXR5XCI6IHtcbiAgICBcInRhcmdldFwiOiBcIjk5LjklXCIsXG4gICAgXCJtZWFzdXJlbWVudFwiOiBcInVwdGltZSBwZXJjZW50YWdlXCIsXG4gICAgXCJlcnJvcl9idWRnZXRcIjogXCI0My4yIG1pbnV0ZXMvbW9udGhcIixcbiAgICBcIm1vbml0b3JpbmdcIjoge1xuICAgICAgXCJtZXRob2RcIjogXCJzeW50aGV0aWMgbW9uaXRvcmluZ1wiLFxuICAgICAgXCJmcmVxdWVuY3lcIjogXCIxIG1pbnV0ZVwiLFxuICAgICAgXCJlbmRwb2ludHNcIjogW1xuICAgICAgICBcImh0dHBzOi8veW91ci1kb21haW4uY29tL2hlYWx0aFwiLFxuICAgICAgICBcImh0dHBzOi8veW91ci1kb21haW4uY29tL2FwaS9zdGF0dXNcIlxuICAgICAgXVxuICAgIH1cbiAgfVxufVxuXFxgXFxgXFxgXG5cbiMjIyMg44Os44K544Od44Oz44K55pmC6ZaTIFNMT1xuXFxgXFxgXFxganNvblxue1xuICBcInJlc3BvbnNlX3RpbWVcIjoge1xuICAgIFwidGFyZ2V0XCI6IFwiOTUlIG9mIHJlcXVlc3RzIDwgMiBzZWNvbmRzXCIsXG4gICAgXCJtZWFzdXJlbWVudFwiOiBcIkxhbWJkYSBEdXJhdGlvbiBwZXJjZW50aWxlXCIsXG4gICAgXCJlcnJvcl9idWRnZXRcIjogXCI1JSBvZiByZXF1ZXN0cyBjYW4gZXhjZWVkIDIgc2Vjb25kc1wiLFxuICAgIFwibW9uaXRvcmluZ1wiOiB7XG4gICAgICBcIm1ldHJpY1wiOiBcIkFXUy9MYW1iZGEgRHVyYXRpb25cIixcbiAgICAgIFwic3RhdGlzdGljXCI6IFwicDk1XCIsXG4gICAgICBcInBlcmlvZFwiOiBcIjUgbWludXRlc1wiXG4gICAgfVxuICB9XG59XG5cXGBcXGBcXGBcblxuIyMjIyDjgqjjg6njg7znjocgU0xPXG5cXGBcXGBcXGBqc29uXG57XG4gIFwiZXJyb3JfcmF0ZVwiOiB7XG4gICAgXCJ0YXJnZXRcIjogXCI8IDElIGVycm9yIHJhdGVcIixcbiAgICBcIm1lYXN1cmVtZW50XCI6IFwiTGFtYmRhIEVycm9ycyAvIEludm9jYXRpb25zXCIsXG4gICAgXCJlcnJvcl9idWRnZXRcIjogXCIxJSBvZiByZXF1ZXN0cyBjYW4gZmFpbFwiLFxuICAgIFwibW9uaXRvcmluZ1wiOiB7XG4gICAgICBcIm1ldHJpY1wiOiBcIkFXUy9MYW1iZGEgRXJyb3JzXCIsXG4gICAgICBcImNhbGN1bGF0aW9uXCI6IFwiRXJyb3JzIC8gSW52b2NhdGlvbnMgKiAxMDBcIixcbiAgICAgIFwicGVyaW9kXCI6IFwiNSBtaW51dGVzXCJcbiAgICB9XG4gIH1cbn1cblxcYFxcYFxcYFxuXG4jIyMgU0xP55uj6KaW44OA44OD44K344Ol44Oc44O844OJXG5cXGBcXGBcXGBiYXNoXG4jIFNMT+ebo+imlueUqOOCq+OCueOCv+ODoOODoeODiOODquOCr+OCueS9nOaIkFxuYXdzIGNsb3Vkd2F0Y2ggcHV0LW1ldHJpYy1kYXRhIFxcXFxcbiAgLS1uYW1lc3BhY2UgXCJSQUctU3lzdGVtL1NMT1wiIFxcXFxcbiAgLS1tZXRyaWMtZGF0YSBNZXRyaWNOYW1lPUF2YWlsYWJpbGl0eSxWYWx1ZT05OS45NSxVbml0PVBlcmNlbnQgXFxcXFxuICAtLW1ldHJpYy1kYXRhIE1ldHJpY05hbWU9UmVzcG9uc2VUaW1lUDk1LFZhbHVlPTEuMixVbml0PVNlY29uZHMgXFxcXFxuICAtLW1ldHJpYy1kYXRhIE1ldHJpY05hbWU9RXJyb3JSYXRlLFZhbHVlPTAuNSxVbml0PVBlcmNlbnRcblxcYFxcYFxcYFxuXG4jIyDwn5qoIOeVsOW4uOaknOefpeOCt+OCueODhuODoFxuXG4jIyMgQ2xvdWRXYXRjaCBBbm9tYWx5IERldGVjdGlvblxuXG4jIyMjIExhbWJkYemWouaVsOeVsOW4uOaknOefpVxuXFxgXFxgXFxgYmFzaFxuIyBEdXJhdGlvbueVsOW4uOaknOefpVxuYXdzIGNsb3Vkd2F0Y2ggcHV0LWFub21hbHktZGV0ZWN0b3IgXFxcXFxuICAtLW5hbWVzcGFjZSBBV1MvTGFtYmRhIFxcXFxcbiAgLS1tZXRyaWMtbmFtZSBEdXJhdGlvbiBcXFxcXG4gIC0tZGltZW5zaW9ucyBOYW1lPUZ1bmN0aW9uTmFtZSxWYWx1ZT1yYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tc3RhdCBBdmVyYWdlXG5cbiMgSW52b2NhdGlvbnPnlbDluLjmpJznn6VcbmF3cyBjbG91ZHdhdGNoIHB1dC1hbm9tYWx5LWRldGVjdG9yIFxcXFxcbiAgLS1uYW1lc3BhY2UgQVdTL0xhbWJkYSBcXFxcXG4gIC0tbWV0cmljLW5hbWUgSW52b2NhdGlvbnMgXFxcXFxuICAtLWRpbWVuc2lvbnMgTmFtZT1GdW5jdGlvbk5hbWUsVmFsdWU9cmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAtLXN0YXQgU3VtXG5cXGBcXGBcXGBcblxuIyMjIOOCq+OCueOCv+ODoOeVsOW4uOaknOefpVxuXG4jIyMjIOODk+OCuOODjeOCueODoeODiOODquOCr+OCueeVsOW4uOaknOefpVxuXFxgXFxgXFxgcHl0aG9uXG4jIExhbWJkYemWouaVsOOBp+OCq+OCueOCv+ODoOeVsOW4uOaknOefpVxuaW1wb3J0IGJvdG8zXG5pbXBvcnQganNvblxuZnJvbSBkYXRldGltZSBpbXBvcnQgZGF0ZXRpbWUsIHRpbWVkZWx0YVxuXG5kZWYgbGFtYmRhX2hhbmRsZXIoZXZlbnQsIGNvbnRleHQpOlxuICAgIGNsb3Vkd2F0Y2ggPSBib3RvMy5jbGllbnQoJ2Nsb3Vkd2F0Y2gnKVxuICAgIFxuICAgICMg6YGO5Y67MjTmmYLplpPjga7jg6Hjg4jjg6rjgq/jgrnlj5blvpdcbiAgICBlbmRfdGltZSA9IGRhdGV0aW1lLnV0Y25vdygpXG4gICAgc3RhcnRfdGltZSA9IGVuZF90aW1lIC0gdGltZWRlbHRhKGhvdXJzPTI0KVxuICAgIFxuICAgIHJlc3BvbnNlID0gY2xvdWR3YXRjaC5nZXRfbWV0cmljX3N0YXRpc3RpY3MoXG4gICAgICAgIE5hbWVzcGFjZT0nUkFHLVN5c3RlbS9CdXNpbmVzcycsXG4gICAgICAgIE1ldHJpY05hbWU9J0NoYXRSZXF1ZXN0c1BlckhvdXInLFxuICAgICAgICBTdGFydFRpbWU9c3RhcnRfdGltZSxcbiAgICAgICAgRW5kVGltZT1lbmRfdGltZSxcbiAgICAgICAgUGVyaW9kPTM2MDAsXG4gICAgICAgIFN0YXRpc3RpY3M9WydBdmVyYWdlJ11cbiAgICApXG4gICAgXG4gICAgIyDnlbDluLjmpJznn6Xjg63jgrjjg4Pjgq9cbiAgICBjdXJyZW50X3ZhbHVlID0gcmVzcG9uc2VbJ0RhdGFwb2ludHMnXVstMV1bJ0F2ZXJhZ2UnXVxuICAgIGhpc3RvcmljYWxfYXZlcmFnZSA9IHN1bShkcFsnQXZlcmFnZSddIGZvciBkcCBpbiByZXNwb25zZVsnRGF0YXBvaW50cyddWzotMV0pIC8gKGxlbihyZXNwb25zZVsnRGF0YXBvaW50cyddKSAtIDEpXG4gICAgXG4gICAgaWYgY3VycmVudF92YWx1ZSA+IGhpc3RvcmljYWxfYXZlcmFnZSAqIDIgb3IgY3VycmVudF92YWx1ZSA8IGhpc3RvcmljYWxfYXZlcmFnZSAqIDAuNTpcbiAgICAgICAgIyDjgqLjg6njg7zjg4jpgIHkv6FcbiAgICAgICAgc25zID0gYm90bzMuY2xpZW50KCdzbnMnKVxuICAgICAgICBzbnMucHVibGlzaChcbiAgICAgICAgICAgIFRvcGljQXJuPSdhcm46YXdzOnNuczphcC1ub3J0aGVhc3QtMToxMjM0NTY3ODkwMTI6cmFnLXN5c3RlbS1hbm9tYWx5LWFsZXJ0cycsXG4gICAgICAgICAgICBNZXNzYWdlPWYnQW5vbWFseSBkZXRlY3RlZDogQ3VycmVudCB2YWx1ZSB7Y3VycmVudF92YWx1ZX0sIEhpc3RvcmljYWwgYXZlcmFnZSB7aGlzdG9yaWNhbF9hdmVyYWdlfScsXG4gICAgICAgICAgICBTdWJqZWN0PSdSQUcgU3lzdGVtIEFub21hbHkgRGV0ZWN0aW9uIEFsZXJ0J1xuICAgICAgICApXG4gICAgXG4gICAgcmV0dXJuIHsnc3RhdHVzQ29kZSc6IDIwMH1cblxcYFxcYFxcYFxuXG4jIyDwn5OKIOODrOODneODvOODiOODu+WIhuaekOOCt+OCueODhuODoFxuXG4jIyMg6Ieq5YuV44Os44Od44O844OI55Sf5oiQXG5cbiMjIyMg5pel5qyh44Os44Od44O844OIXG5cXGBcXGBcXGBiYXNoXG4jIS9iaW4vYmFzaFxuIyDml6XmrKHnm6Poppbjg6zjg53jg7zjg4jnlJ/miJBcblxuUkVQT1JUX0RBVEU9JChkYXRlICslWS0lbS0lZClcblJFUE9SVF9GSUxFPVwiZGFpbHktcmVwb3J0LSRSRVBPUlRfREFURS5qc29uXCJcblxuIyDjg6Hjg4jjg6rjgq/jgrnlj47pm4ZcbmF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9MYW1iZGEgXFxcXFxuICAtLW1ldHJpYy1uYW1lIEludm9jYXRpb25zIFxcXFxcbiAgLS1kaW1lbnNpb25zIE5hbWU9RnVuY3Rpb25OYW1lLFZhbHVlPXJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtdSAtZCAnMjQgaG91cnMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgLXUgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tcGVyaW9kIDM2MDAgXFxcXFxuICAtLXN0YXRpc3RpY3MgU3VtID4gJFJFUE9SVF9GSUxFXG5cbiMg44Os44Od44O844OI6YCB5L+hXG5hd3Mgc2VzIHNlbmQtZW1haWwgXFxcXFxuICAtLXNvdXJjZSBtb25pdG9yaW5nQHlvdXItZG9tYWluLmNvbSBcXFxcXG4gIC0tZGVzdGluYXRpb24gVG9BZGRyZXNzZXM9b3BzLXRlYW1AeW91ci1kb21haW4uY29tIFxcXFxcbiAgLS1tZXNzYWdlIFN1YmplY3Q9XCJEYWlseSBNb25pdG9yaW5nIFJlcG9ydCAtICRSRVBPUlRfREFURVwiLEJvZHk9XCJUZXh0PXtEYXRhPVBsZWFzZSBmaW5kIGF0dGFjaGVkIHRoZSBkYWlseSBtb25pdG9yaW5nIHJlcG9ydC59XCJcblxcYFxcYFxcYFxuXG4tLS1cblxuKirnm6Poppbjgrfjgrnjg4bjg6DpgYvnlKjjgqzjgqTjg4njg6njgqTjg7MqKjpcbjEuIOOCouODqeODvOODiOOBr+mBqeWIh+OBqumHjeimgeW6puOBp+WIhumhnuOBl+OAgemBjuWJsOOBqumAmuefpeOCkumBv+OBkeOCi1xuMi4gU0xP6YGV5Y+N5pmC44Gv5b+F44Ga5qC55pys5Y6f5Zug5YiG5p6Q44KS5a6f5pa944GZ44KLXG4zLiDnm6PoppboqK3lrprjga/lrprmnJ/nmoTjgavopovnm7TjgZfjgIHjg5Pjgrjjg43jgrnopoHku7bjgavlkIjjgo/jgZvjgaboqr/mlbTjgZnjgotcbjQuIOeVsOW4uOaknOefpeOBrueyvuW6puWQkeS4iuOBruOBn+OCgeOAgeapn+aisOWtpue/kuODouODh+ODq+OCkue2mee2mueahOOBq+aUueWWhOOBmeOCi1xuYDtcbiAgfVxufSAgLyoqXG4gICAqXG4g44Kk44Oz44K344OH44Oz44OI5a++5b+c5omL6aCG44Ks44Kk44OJ44Gu55Sf5oiQXG4gICAqL1xuZ2VuZXJhdGVJbmNpZGVudFJlc3BvbnNlR3VpZGUoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAjICR7dGhpcy5zeXN0ZW1OYW1lfSAtIOOCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOaJi+mghuOCrOOCpOODiVxuXG4qKuODkOODvOOCuOODp+ODsyoqOiAke3RoaXMudmVyc2lvbn0gIFxuKirmnIDntYLmm7TmlrAqKjogJHt0aGlzLmxhc3RVcGRhdGVkfVxuXG4jIyDwn5qoIOOCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOODleODrOODvOODoOODr+ODvOOCr1xuXG4jIyMg44Kk44Oz44K344OH44Oz44OI5YiG6aGeXG5cbiMjIyMgU2V2ZXJpdHkgMSAoQ3JpdGljYWwpIC0g5YWo56S+5b2x6Z+/XG4tICoq5a6a576pKio6IOOCteODvOODk+OCueWFqOS9k+WBnOatouOAgeODh+ODvOOCv+aQjeWkseOAgeOCu+OCreODpeODquODhuOCo+S+teWus1xuLSAqKuWvvuW/nOaZgumWkyoqOiA15YiG5Lul5YaF44Gr5Yid5pyf5a++5b+cXG4tICoq6YCa55+lKio6IOWNs+W6p+OBq+WFqOmWouS/guiAheOBq+mAmuefpVxuLSAqKuOCqOOCueOCq+ODrOODvOOCt+ODp+ODsyoqOiAxNeWIhuOBp+e1jOWWtumZo+OBq+WgseWRilxuXG4jIyMjIFNldmVyaXR5IDIgKEhpZ2gpIC0g5Li76KaB5qmf6IO95b2x6Z+/XG4tICoq5a6a576pKio6IOS4u+imgeapn+iDveWBnOatouOAgeODkeODleOCqeODvOODnuODs+OCueWkp+W5heS9juS4i1xuLSAqKuWvvuW/nOaZgumWkyoqOiAzMOWIhuS7peWGheOBq+WIneacn+WvvuW/nFxuLSAqKumAmuefpSoqOiDmioDooZPjg4Hjg7zjg6AgKyDnrqHnkIbogIVcbi0gKirjgqjjgrnjgqvjg6zjg7zjgrfjg6fjg7MqKjogMuaZgumWk+OBp+S4iuS9jeeuoeeQhuiAheOBq+WgseWRilxuXG4jIyMjIFNldmVyaXR5IDMgKE1lZGl1bSkgLSDpg6jliIbnmoTlvbHpn79cbi0gKirlrprnvqkqKjog5LiA6YOo5qmf6IO95YGc5q2i44CB6Lu95b6u44Gq44OR44OV44Kp44O844Oe44Oz44K55L2O5LiLXG4tICoq5a++5b+c5pmC6ZaTKio6IDTmmYLplpPku6XlhoXjgavlr77lv5zplovlp4tcbi0gKirpgJrnn6UqKjog5ouF5b2T44OB44O844OgXG4tICoq44Ko44K544Kr44Os44O844K344On44OzKio6IDI05pmC6ZaT44Gn566h55CG6ICF44Gr5aCx5ZGKXG5cbiMjIyMgU2V2ZXJpdHkgNCAoTG93KSAtIOi7veW+ruOBquW9semfv1xuLSAqKuWumue+qSoqOiDou73lvq7jgarllY/poYzjgIHkuojpmLLnmoTlr77lv5xcbi0gKirlr77lv5zmmYLplpMqKjog5qyh5Zue5Za25qWt5pmC6ZaT5YaFXG4tICoq6YCa55+lKio6IOaLheW9k+iAheOBruOBv1xuLSAqKuOCqOOCueOCq+ODrOODvOOCt+ODp+ODsyoqOiDpgLHmrKHjg6zjg53jg7zjg4jjgafloLHlkYpcblxuIyMjIOOCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOODgeODvOODoOani+aIkFxuXG4jIyMjIOOCpOODs+OCt+ODh+ODs+ODiOaMh+aPruWumCAoSW5jaWRlbnQgQ29tbWFuZGVyKVxuLSAqKuW9ueWJsioqOiDlhajkvZPmjIfmj67jgIHmhI/mgJ3msbrlrprjgIHjgrPjg5/jg6Xjg4vjgrHjg7zjgrfjg6fjg7PntbHliLZcbi0gKirmqKnpmZAqKjog44Oq44K944O844K56YWN5YiG44CB5aSW6YOo6YCj57Wh44CB5b6p5pen5pa56Yed5rG65a6aXG4tICoq6YCj57Wh5YWIKio6IFsyNOaZgumWk+WvvuW/nOmbu+ipseeVquWPt11cblxuIyMjIyDmioDooZPjg6rjg7zjg4Djg7wgKFRlY2ggTGVhZClcbi0gKirlvbnlibIqKjog5oqA6KGT55qE6Kq/5p+744CB5b6p5pen5L2c5qWt5oyH5o+uXG4tICoq5qip6ZmQKio6IOOCt+OCueODhuODoOWkieabtOOAgee3iuaApeODh+ODl+ODreOCpOaJv+iqjVxuLSAqKumAo+e1oeWFiCoqOiBb5oqA6KGT44OB44O844Og6YCj57Wh5YWIXVxuXG4jIyMjIOOCs+ODn+ODpeODi+OCseODvOOCt+ODp+ODs+aLheW9k1xuLSAqKuW9ueWJsioqOiDlhoXlpJbjgbjjga7mg4XloLHnmbrkv6HjgIHjgrnjg4bjg7zjgr/jgrnmm7TmlrBcbi0gKirmqKnpmZAqKjog5YWs5byP55m66KGo44CB6aGn5a6i6YCj57WhXG4tICoq6YCj57Wh5YWIKio6IFvluoPloLHjg7tDU+mAo+e1oeWFiF1cblxuIyMg8J+TiyDjgqTjg7Pjgrfjg4fjg7Pjg4jlr77lv5zjg5fjg63jgrvjgrlcblxuIyMjIFBoYXNlIDE6IOaknOefpeODu+WIneacn+WvvuW/nCAoMC0xNeWIhilcblxuIyMjIyAxLjEg44Kk44Oz44K344OH44Oz44OI5qSc55+lXG5cXGBcXGBcXGBiYXNoXG4jIOiHquWLleaknOefpeOCt+OCueODhuODoFxuLSBDbG91ZFdhdGNoIOOCouODqeODvOODoFxuLSDlpJblvaLnm6Poppbjgrfjgrnjg4bjg6Bcbi0g44Om44O844K244O85aCx5ZGKXG4tIOWGhemDqOebo+imluODhOODvOODq1xuXG4jIOaJi+WLleeiuuiqjeaJi+mghlxuY3VybCAtZiBodHRwczovL3lvdXItZG9tYWluLmNvbS9oZWFsdGhcbmF3cyBjbG91ZGZvcm1hdGlvbiBkZXNjcmliZS1zdGFja3MgLS1zdGFjay1uYW1lIHJhZy1zeXN0ZW0tcHJvZFxuYXdzIGxhbWJkYSBsaXN0LWZ1bmN0aW9ucyAtLXF1ZXJ5ICdGdW5jdGlvbnNbP2NvbnRhaW5zKEZ1bmN0aW9uTmFtZSwgXFxgcmFnLXN5c3RlbVxcYCldLlN0YXRlJ1xuXFxgXFxgXFxgXG5cbiMjIyMgMS4yIOWIneacn+ODiOODquOCouODvOOCuFxuXFxgXFxgXFxgYmFzaFxuIyDlvbHpn7/nr4Tlm7Lnorroqo1cbmF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9MYW1iZGEgXFxcXFxuICAtLW1ldHJpYy1uYW1lIEVycm9ycyBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLXUgLWQgJzEgaG91ciBhZ28nICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSAtdSArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1wZXJpb2QgMzAwIC0tc3RhdGlzdGljcyBTdW1cblxuIyDjg6bjg7zjgrbjg7zlvbHpn7/norroqo1cbmF3cyBsb2dzIGZpbHRlci1sb2ctZXZlbnRzIFxcXFxcbiAgLS1sb2ctZ3JvdXAtbmFtZSAvYXdzL2xhbWJkYS9yYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tZmlsdGVyLXBhdHRlcm4gXCJFUlJPUlwiIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMSBob3VyIGFnbycgKyVzKTAwMFxuXFxgXFxgXFxgXG5cbiMjIyMgMS4zIOOCpOODs+OCt+ODh+ODs+ODiOWuo+iogFxuXFxgXFxgXFxgYmFzaFxuIyDjgqTjg7Pjgrfjg4fjg7Pjg4jnrqHnkIbjgrfjgrnjg4bjg6DjgavnmbvpjLJcbmN1cmwgLVggUE9TVCBodHRwczovL2luY2lkZW50LW1hbmFnZW1lbnQuY29tL2FwaS9pbmNpZGVudHMgXFxcXFxuICAtSCBcIkNvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvblwiIFxcXFxcbiAgLWQgJ3tcbiAgICBcInRpdGxlXCI6IFwiUkFHIFN5c3RlbSBTZXJ2aWNlIERlZ3JhZGF0aW9uXCIsXG4gICAgXCJzZXZlcml0eVwiOiBcImhpZ2hcIixcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ2hhdCBmdW5jdGlvbmFsaXR5IGV4cGVyaWVuY2luZyBoaWdoIGVycm9yIHJhdGVzXCIsXG4gICAgXCJhZmZlY3RlZF9zZXJ2aWNlc1wiOiBbXCJjaGF0XCIsIFwic2VhcmNoXCJdLFxuICAgIFwiaW5jaWRlbnRfY29tbWFuZGVyXCI6IFwidGVjaC1sZWFkQGNvbXBhbnkuY29tXCJcbiAgfSdcblxuIyDplqLkv4LogIXpgJrnn6VcbmF3cyBzbnMgcHVibGlzaCBcXFxcXG4gIC0tdG9waWMtYXJuIGFybjphd3M6c25zOmFwLW5vcnRoZWFzdC0xOjEyMzQ1Njc4OTAxMjppbmNpZGVudC1hbGVydHMgXFxcXFxuICAtLW1lc3NhZ2UgXCJJTkNJREVOVCBERUNMQVJFRDogUkFHIFN5c3RlbSBleHBlcmllbmNpbmcgaXNzdWVzLiBXYXIgcm9vbTogI2luY2lkZW50LXJlc3BvbnNlXCJcblxcYFxcYFxcYFxuXG4jIyMgUGhhc2UgMjog6Kq/5p+744O76Ki65patICgxNS02MOWIhilcblxuIyMjIyAyLjEg44K344K544OG44Og54q25oWL6Kq/5p+7XG5cXGBcXGBcXGBiYXNoXG4jIS9iaW4vYmFzaFxuIyDljIXmi6znmoTjgrfjgrnjg4bjg6DoqLrmlq3jgrnjgq/jg6rjg5fjg4hcblxuZWNobyBcIvCflI0g44K344K544OG44Og6Ki65pat6ZaL5aeLLi4uXCJcblxuIyBMYW1iZGHplqLmlbDnirbmhYtcbmVjaG8gXCLwn5OKIExhbWJkYSBGdW5jdGlvbnM6XCJcbmF3cyBsYW1iZGEgbGlzdC1mdW5jdGlvbnMgLS1xdWVyeSAnRnVuY3Rpb25zWz9jb250YWlucyhGdW5jdGlvbk5hbWUsIFxcYHJhZy1zeXN0ZW1cXGApXS57TmFtZTpGdW5jdGlvbk5hbWUsU3RhdGU6U3RhdGUsTGFzdE1vZGlmaWVkOkxhc3RNb2RpZmllZH0nXG5cbiMgRHluYW1vRELnirbmhYtcbmVjaG8gXCLwn5OKIER5bmFtb0RCIFRhYmxlczpcIlxuYXdzIGR5bmFtb2RiIGxpc3QtdGFibGVzIC0tcXVlcnkgJ1RhYmxlTmFtZXNbP2NvbnRhaW5zKEAsIFxcYHJhZy1zeXN0ZW1cXGApXScgfCB4YXJncyAtSSB7fSBhd3MgZHluYW1vZGIgZGVzY3JpYmUtdGFibGUgLS10YWJsZS1uYW1lIHt9XG5cbiMgT3BlblNlYXJjaOeKtuaFi1xuZWNobyBcIvCfk4ogT3BlblNlYXJjaCBDbHVzdGVyOlwiXG5jdXJsIC1zIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvX2NsdXN0ZXIvaGVhbHRoXCIgfCBqcSAnLidcblxuIyBGU3jnirbmhYtcbmVjaG8gXCLwn5OKIEZTeCBGaWxlIFN5c3RlbXM6XCJcbmF3cyBmc3ggZGVzY3JpYmUtZmlsZS1zeXN0ZW1zIC0tcXVlcnkgJ0ZpbGVTeXN0ZW1zWz9jb250YWlucyhUYWdzWz9LZXk9PVxcYFByb2plY3RcXGBdLlZhbHVlLCBcXGByYWctc3lzdGVtXFxgKV0ue0lkOkZpbGVTeXN0ZW1JZCxTdGF0ZTpMaWZlY3ljbGUsU3RvcmFnZUNhcGFjaXR5OlN0b3JhZ2VDYXBhY2l0eX0nXG5cbmVjaG8gXCLinIUg44K344K544OG44Og6Ki65pat5a6M5LqGXCJcblxcYFxcYFxcYFxuXG4jIyMjIDIuMiDjg63jgrDliIbmnpBcblxcYFxcYFxcYHNxbFxuLS0gQ2xvdWRXYXRjaCBMb2dzIEluc2lnaHRzIOOCr+OCqOODqlxuLS0g44Ko44Op44O844OR44K/44O844Oz5YiG5p6QXG5maWVsZHMgQHRpbWVzdGFtcCwgQG1lc3NhZ2UsIEByZXF1ZXN0SWRcbnwgZmlsdGVyIEBtZXNzYWdlIGxpa2UgL0VSUk9SL1xufCBzdGF0cyBjb3VudCgpIGJ5IGJpbig1bSksIEBtZXNzYWdlXG58IHNvcnQgQHRpbWVzdGFtcCBkZXNjXG5cbi0tIOODkeODleOCqeODvOODnuODs+OCueWIhuaekFxuZmllbGRzIEB0aW1lc3RhbXAsIEBkdXJhdGlvbiwgQHJlcXVlc3RJZFxufCBmaWx0ZXIgQHR5cGUgPSBcIlJFUE9SVFwiXG58IHN0YXRzIGF2ZyhAZHVyYXRpb24pLCBtYXgoQGR1cmF0aW9uKSwgY291bnQoKSBieSBiaW4oNW0pXG58IHNvcnQgQHRpbWVzdGFtcCBkZXNjXG5cXGBcXGBcXGBcblxuIyMjIyAyLjMg5qC55pys5Y6f5Zug5YiG5p6QXG5cXGBcXGBcXGBiYXNoXG4jIOOCv+OCpOODoOODqeOCpOODs+WIhuaekFxuYXdzIGxvZ3MgZGVzY3JpYmUtbG9nLXN0cmVhbXMgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIC9hd3MvbGFtYmRhL3JhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1vcmRlci1ieSBMYXN0RXZlbnRUaW1lIFxcXFxcbiAgLS1kZXNjZW5kaW5nXG5cbiMg5aSJ5pu05bGl5q2056K66KqNXG5hd3MgY2xvdWRmb3JtYXRpb24gZGVzY3JpYmUtc3RhY2stZXZlbnRzIFxcXFxcbiAgLS1zdGFjay1uYW1lIHJhZy1zeXN0ZW0tcHJvZCBcXFxcXG4gIC0tcXVlcnkgJ1N0YWNrRXZlbnRzWz9UaW1lc3RhbXAgPj0gXFxgMjAyNC0wMS0wMVQwMDowMDowMFpcXGBdJ1xuXG4jIOODh+ODl+ODreOCpOWxpeattOeiuuiqjVxuYXdzIGxhbWJkYSBsaXN0LXZlcnNpb25zLWJ5LWZ1bmN0aW9uIFxcXFxcbiAgLS1mdW5jdGlvbi1uYW1lIHJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1xdWVyeSAnVmVyc2lvbnNbKl0ue1ZlcnNpb246VmVyc2lvbixMYXN0TW9kaWZpZWQ6TGFzdE1vZGlmaWVkfSdcblxcYFxcYFxcYFxuXG4jIyMgUGhhc2UgMzog5b6p5pen44O75a++5YemICg2MC0xMjDliIYpXG5cbiMjIyMgMy4xIOe3iuaApeW+qeaXp+aJi+mghlxuXG4jIyMjIyDljbPluqflvqnml6cgKEhvdCBGaXgpXG5cXGBcXGBcXGBiYXNoXG4jIExhbWJkYemWouaVsOODreODvOODq+ODkOODg+OCr1xuYXdzIGxhbWJkYSB1cGRhdGUtZnVuY3Rpb24tY29kZSBcXFxcXG4gIC0tZnVuY3Rpb24tbmFtZSByYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tczMtYnVja2V0IGRlcGxveW1lbnQtYXJ0aWZhY3RzIFxcXFxcbiAgLS1zMy1rZXkgbGFtYmRhL3ByZXZpb3VzLXZlcnNpb24uemlwXG5cbiMg6Kit5a6a44Ot44O844Or44OQ44OD44KvXG5hd3MgbGFtYmRhIHVwZGF0ZS1mdW5jdGlvbi1jb25maWd1cmF0aW9uIFxcXFxcbiAgLS1mdW5jdGlvbi1uYW1lIHJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1lbnZpcm9ubWVudCBWYXJpYWJsZXM9J3tST0xMQkFDSz10cnVlLFZFUlNJT049cHJldmlvdXN9J1xuXG4jIOODiOODqeODleOCo+ODg+OCr+WItuW+oVxuYXdzIGxhbWJkYSBwdXQtcHJvdmlzaW9uZWQtY29uY3VycmVuY3ktY29uZmlnIFxcXFxcbiAgLS1mdW5jdGlvbi1uYW1lIHJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1xdWFsaWZpZXIgXFwkTEFURVNUIFxcXFxcbiAgLS1wcm92aXNpb25lZC1jb25jdXJyZW5jeS11bml0cyAxMFxuXFxgXFxgXFxgXG5cbiMjIyMjIOOCpOODs+ODleODqeW+qeaXp1xuXFxgXFxgXFxgYmFzaFxuIyBDbG91ZEZvcm1hdGlvbiDjgrnjgr/jg4Pjgq/lvqnml6dcbmF3cyBjbG91ZGZvcm1hdGlvbiB1cGRhdGUtc3RhY2sgXFxcXFxuICAtLXN0YWNrLW5hbWUgcmFnLXN5c3RlbS1wcm9kIFxcXFxcbiAgLS11c2UtcHJldmlvdXMtdGVtcGxhdGUgXFxcXFxuICAtLXBhcmFtZXRlcnMgUGFyYW1ldGVyS2V5PVZlcnNpb24sUGFyYW1ldGVyVmFsdWU9c3RhYmxlXG5cbiMgRHluYW1vRELlvqnml6dcbmF3cyBkeW5hbW9kYiByZXN0b3JlLXRhYmxlLWZyb20tYmFja3VwIFxcXFxcbiAgLS10YXJnZXQtdGFibGUtbmFtZSByYWctc3lzdGVtLXNlc3Npb25zLXJlc3RvcmVkIFxcXFxcbiAgLS1iYWNrdXAtYXJuIGFybjphd3M6ZHluYW1vZGI6YXAtbm9ydGhlYXN0LTE6MTIzNDU2Nzg5MDEyOnRhYmxlL3JhZy1zeXN0ZW0tc2Vzc2lvbnMvYmFja3VwLzAxMjM0NTY3ODkwMTIzLWFiY2RlZmdoXG5cbiMgT3BlblNlYXJjaOW+qeaXp1xuY3VybCAtWCBQT1NUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvX3NuYXBzaG90L2JhY2t1cC1yZXBvL3NuYXBzaG90LW5hbWUvX3Jlc3RvcmVcIlxuXFxgXFxgXFxgXG5cbiMjIyMgMy4yIOautemajueahOW+qeaXp1xuXG4jIyMjIyBQaGFzZSAzLjIuMTog5Z+65pys5qmf6IO95b6p5penXG5cXGBcXGBcXGBiYXNoXG4jIOiqjeiovOOCt+OCueODhuODoOW+qeaXp+eiuuiqjVxuY3VybCAtWCBQT1NUIGh0dHBzOi8veW91ci1kb21haW4uY29tL2FwaS9hdXRoL2xvZ2luIFxcXFxcbiAgLUggXCJDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25cIiBcXFxcXG4gIC1kICd7XCJ1c2VybmFtZVwiOlwidGVzdHVzZXJcIixcInBhc3N3b3JkXCI6XCJ0ZXN0cGFzc1wifSdcblxuIyDln7rmnKxBUEnlvqnml6fnorroqo1cbmN1cmwgLWYgaHR0cHM6Ly95b3VyLWRvbWFpbi5jb20vYXBpL2hlYWx0aFxuXFxgXFxgXFxgXG5cbiMjIyMjIFBoYXNlIDMuMi4yOiDjg4Hjg6Pjg4Pjg4jmqZ/og73lvqnml6dcblxcYFxcYFxcYGJhc2hcbiMgQmVkcm9ja+aOpee2mueiuuiqjVxuYXdzIGJlZHJvY2stcnVudGltZSBpbnZva2UtbW9kZWwgXFxcXFxuICAtLW1vZGVsLWlkIGFudGhyb3BpYy5jbGF1ZGUtMy1zb25uZXQtMjAyNDAyMjktdjE6MCBcXFxcXG4gIC0tYm9keSAne1wibWVzc2FnZXNcIjpbe1wicm9sZVwiOlwidXNlclwiLFwiY29udGVudFwiOlwidGVzdFwifV0sXCJtYXhfdG9rZW5zXCI6MTB9JyBcXFxcXG4gIHJlc3BvbnNlLmpzb25cblxuIyDjg4Hjg6Pjg4Pjg4jmqZ/og73jg4bjgrnjg4hcbmN1cmwgLVggUE9TVCBodHRwczovL3lvdXItZG9tYWluLmNvbS9hcGkvY2hhdCBcXFxcXG4gIC1IIFwiQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXCIgXFxcXFxuICAtSCBcIkF1dGhvcml6YXRpb246IEJlYXJlciBcXCRURVNUX1RPS0VOXCIgXFxcXFxuICAtZCAne1wibWVzc2FnZVwiOlwiSGVsbG8sIHRoaXMgaXMgYSB0ZXN0XCJ9J1xuXFxgXFxgXFxgXG5cbiMjIyMjIFBoYXNlIDMuMi4zOiDmpJzntKLmqZ/og73lvqnml6dcblxcYFxcYFxcYGJhc2hcbiMgT3BlblNlYXJjaOaOpee2mueiuuiqjVxuY3VybCAtWCBHRVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC9fY2x1c3Rlci9oZWFsdGhcIlxuXG4jIOaknOe0ouapn+iDveODhuOCueODiFxuY3VybCAtWCBQT1NUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvZG9jdW1lbnRzL19zZWFyY2hcIiBcXFxcXG4gIC1IIFwiQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXCIgXFxcXFxuICAtZCAne1wicXVlcnlcIjp7XCJtYXRjaFwiOntcImNvbnRlbnRcIjpcInRlc3RcIn19fSdcblxcYFxcYFxcYFxuXG4jIyMgUGhhc2UgNDog5qSc6Ki844O755uj6KaW5by35YyWICgxMjAtMTgw5YiGKVxuXG4jIyMjIDQuMSDlvqnml6fmpJzoqLxcblxcYFxcYFxcYGJhc2hcbiMhL2Jpbi9iYXNoXG4jIOW+qeaXp+aknOiovOOCueOCr+ODquODl+ODiFxuXG5lY2hvIFwi8J+nqiDlvqnml6fmpJzoqLzplovlp4suLi5cIlxuXG4jIOapn+iDveODhuOCueODiFxuLi90ZXN0cy9pbnRlZ3JhdGlvbi9mdWxsLXN5c3RlbS10ZXN0LnNoXG5cbiMg44OR44OV44Kp44O844Oe44Oz44K544OG44K544OIXG4uL3Rlc3RzL3BlcmZvcm1hbmNlL2xvYWQtdGVzdC5zaCAtLWR1cmF0aW9uIDEwbSAtLXVzZXJzIDEwMFxuXG4jIOOCu+OCreODpeODquODhuOCo+ODhuOCueODiFxuLi90ZXN0cy9zZWN1cml0eS9zZWN1cml0eS1zY2FuLnNoXG5cbmVjaG8gXCLinIUg5b6p5pen5qSc6Ki85a6M5LqGXCJcblxcYFxcYFxcYFxuXG4jIyMjIDQuMiDnm6PoppblvLfljJZcblxcYFxcYFxcYGJhc2hcbiMg5LiA5pmC55qE55uj6KaW5by35YyWXG5hd3MgY2xvdWR3YXRjaCBwdXQtbWV0cmljLWFsYXJtIFxcXFxcbiAgLS1hbGFybS1uYW1lIFwiUkFHLVBvc3RJbmNpZGVudC1FcnJvclJhdGVcIiBcXFxcXG4gIC0tYWxhcm0tZGVzY3JpcHRpb24gXCJFbmhhbmNlZCBtb25pdG9yaW5nIHBvc3QtaW5jaWRlbnRcIiBcXFxcXG4gIC0tbWV0cmljLW5hbWUgRXJyb3JzIFxcXFxcbiAgLS1uYW1lc3BhY2UgQVdTL0xhbWJkYSBcXFxcXG4gIC0tc3RhdGlzdGljIFN1bSBcXFxcXG4gIC0tcGVyaW9kIDYwIFxcXFxcbiAgLS10aHJlc2hvbGQgMSBcXFxcXG4gIC0tY29tcGFyaXNvbi1vcGVyYXRvciBHcmVhdGVyVGhhblRocmVzaG9sZCBcXFxcXG4gIC0tZXZhbHVhdGlvbi1wZXJpb2RzIDFcblxuIyDjg63jgrDjg6zjg5njg6vkuIDmmYLnmoTlpInmm7RcbmF3cyBsYW1iZGEgdXBkYXRlLWZ1bmN0aW9uLWNvbmZpZ3VyYXRpb24gXFxcXFxuICAtLWZ1bmN0aW9uLW5hbWUgcmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAtLWVudmlyb25tZW50IFZhcmlhYmxlcz0ne0xPR19MRVZFTD1ERUJVRyxFTkhBTkNFRF9NT05JVE9SSU5HPXRydWV9J1xuXFxgXFxgXFxgXG5cbiMjIyBQaGFzZSA1OiDkuovlvozlh6bnkIbjg7vmlLnlloQgKDE4MOWIhuS7pemZjSlcblxuIyMjIyA1LjEg44Kk44Oz44K344OH44Oz44OI5aCx5ZGK5pu45L2c5oiQXG5cXGBcXGBcXGBtYXJrZG93blxuIyDjgqTjg7Pjgrfjg4fjg7Pjg4jloLHlkYrmm7jjg4bjg7Pjg5fjg6zjg7zjg4hcblxuIyMg5Z+65pys5oOF5aCxXG4tICoq44Kk44Oz44K344OH44Oz44OISUQqKjogSU5DLTIwMjQtMDAxXG4tICoq55m655Sf5pel5pmCKio6IDIwMjQtMDEtMTUgMTQ6MzAgSlNUXG4tICoq5qSc55+l5pel5pmCKio6IDIwMjQtMDEtMTUgMTQ6MzIgSlNUXG4tICoq5b6p5pen5pel5pmCKio6IDIwMjQtMDEtMTUgMTY6NDUgSlNUXG4tICoq5b2x6Z+/5pmC6ZaTKio6IDLmmYLplpMxNeWIhlxuLSAqKlNldmVyaXR5Kio6IEhpZ2hcblxuIyMg5b2x6Z+/56+E5ZuyXG4tICoq5b2x6Z+/44Om44O844K244O85pWwKio6IOe0hDEsMjAw5ZCNXG4tICoq5b2x6Z+/5qmf6IO9Kio6IOODgeODo+ODg+ODiOapn+iDveOAgeaWh+abuOaknOe0olxuLSAqKuODk+OCuOODjeOCueW9semfvyoqOiDpoaflrqLllY/jgYTlkIjjgo/jgZvlopfliqDjgIHlo7LkuIrmqZ/kvJrmkI3lpLFcblxuIyMg5qC55pys5Y6f5ZugXG4tIExhbWJkYemWouaVsOOBruODoeODouODquS4jei2s+OBq+OCiOOCi+OCv+OCpOODoOOCouOCpuODiFxuLSBEeW5hbW9EQuOBruabuOOBjei+vOOBv+OCreODo+ODkeOCt+ODhuOCo+S4jei2s1xuLSDnm6PoppbjgqLjg6njg7zjg4jjga7oqK3lrprkuI3lgplcblxuIyMg5a++5b+c44Ki44Kv44K344On44OzXG4xLiBMYW1iZGHplqLmlbDjg6Hjg6Ljg6rjgpI1MTJNQuKGkjEwMjRNQuOBq+Wil+WKoFxuMi4gRHluYW1vRELmm7jjgY3ovrzjgb/jgq3jg6Pjg5Hjgrfjg4bjgqPjgpLoh6rli5XjgrnjgrHjg7zjg6rjg7PjgrDoqK3lrppcbjMuIOebo+imluOCouODqeODvOODiOOBrumWvuWApOimi+ebtOOBl1xuXG4jIyDlho3nmbrpmLLmraLnrZZcbjEuIOWuuemHj+ioiOeUu+OBruWumuacn+imi+ebtOOBl++8iOaciOasoe+8iVxuMi4g6LKg6I2344OG44K544OI44Gu6Ieq5YuV5YyWXG4zLiDnm6Poppbjgrfjgrnjg4bjg6Djga7mlLnlloRcblxcYFxcYFxcYFxuXG4jIyMjIDUuMiDmlLnlloTjgqLjgq/jgrfjg6fjg7Plrp/oo4VcblxcYFxcYFxcYGJhc2hcbiMg5oGS5LmF5a++562W5a6f6KOFXG5hd3MgbGFtYmRhIHVwZGF0ZS1mdW5jdGlvbi1jb25maWd1cmF0aW9uIFxcXFxcbiAgLS1mdW5jdGlvbi1uYW1lIHJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1tZW1vcnktc2l6ZSAxMDI0IFxcXFxcbiAgLS10aW1lb3V0IDMwXG5cbiMgRHluYW1vRELoh6rli5XjgrnjgrHjg7zjg6rjg7PjgrDoqK3lrppcbmF3cyBhcHBsaWNhdGlvbi1hdXRvc2NhbGluZyByZWdpc3Rlci1zY2FsYWJsZS10YXJnZXQgXFxcXFxuICAtLXNlcnZpY2UtbmFtZXNwYWNlIGR5bmFtb2RiIFxcXFxcbiAgLS1yZXNvdXJjZS1pZCB0YWJsZS9yYWctc3lzdGVtLXNlc3Npb25zIFxcXFxcbiAgLS1zY2FsYWJsZS1kaW1lbnNpb24gZHluYW1vZGI6dGFibGU6V3JpdGVDYXBhY2l0eVVuaXRzIFxcXFxcbiAgLS1taW4tY2FwYWNpdHkgNSBcXFxcXG4gIC0tbWF4LWNhcGFjaXR5IDEwMFxuXG4jIOebo+imluaUueWWhFxuYXdzIGNsb3Vkd2F0Y2ggcHV0LW1ldHJpYy1hbGFybSBcXFxcXG4gIC0tYWxhcm0tbmFtZSBcIlJBRy1MYW1iZGEtTWVtb3J5VXRpbGl6YXRpb25cIiBcXFxcXG4gIC0tbWV0cmljLW5hbWUgTWVtb3J5VXRpbGl6YXRpb24gXFxcXFxuICAtLW5hbWVzcGFjZSBBV1MvTGFtYmRhIFxcXFxcbiAgLS1zdGF0aXN0aWMgQXZlcmFnZSBcXFxcXG4gIC0tcGVyaW9kIDMwMCBcXFxcXG4gIC0tdGhyZXNob2xkIDgwIFxcXFxcbiAgLS1jb21wYXJpc29uLW9wZXJhdG9yIEdyZWF0ZXJUaGFuVGhyZXNob2xkXG5cXGBcXGBcXGBcblxuIyMg8J+TniDnt4rmgKXpgKPntaHlhYjjg7vjgqjjgrnjgqvjg6zjg7zjgrfjg6fjg7NcblxuIyMjIDI05pmC6ZaT5a++5b+c6YCj57Wh5YWIXG4tICoq44Kk44Oz44K344OH44Oz44OI5oyH5o+u5a6YKio6ICs4MS05MC0xMjM0LTU2Nzhcbi0gKirmioDooZPjg6rjg7zjg4Djg7wqKjogKzgxLTkwLTIzNDUtNjc4OVxuLSAqKuOCt+OCueODhuODoOeuoeeQhuiAhSoqOiArODEtOTAtMzQ1Ni03ODkwXG5cbiMjIyDjgqjjgrnjgqvjg6zjg7zjgrfjg6fjg7Pln7rmupZcbi0gKioxNeWIhioqOiDliJ3mnJ/lr77lv5zlrozkuobjgZfjgarjgYTloLTlkIhcbi0gKiox5pmC6ZaTKio6IOW+qeaXp+imi+i+vOOBv+eri+OBn+OBquOBhOWgtOWQiFxuLSAqKjLmmYLplpMqKjog5aSW6YOo5b2x6Z+/5ouh5aSn44Gu5aC05ZCIXG5cbiMjIyDlpJbpg6jpgKPntaHlhYhcbi0gKipBV1Mg44K144Od44O844OIKio6IEVudGVycHJpc2UgU3VwcG9ydCBDYXNlXG4tICoqTmV0QXBwIOOCteODneODvOODiCoqOiBGU3jlsILnlKjjgrXjg53jg7zjg4hcbi0gKirjgrvjgq3jg6Xjg6rjg4bjgqPjg5njg7Pjg4Djg7wqKjogMjTmmYLplpNTT0NcblxuLS0tXG5cbioq6YeN6KaBKio6IOOBk+OBruOCrOOCpOODieOBr+Wumuacn+eahOOBq+iok+e3tOOBp+S9v+eUqOOBl+OAgeWun+WKueaAp+OCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhOOAglxuYDtcbn0gIC8qKlxuIFxuICAqIOeBveWus+W+qeaXp+aJi+mghuOCrOOCpOODieOBrueUn+aIkFxuICAgKi9cbmdlbmVyYXRlRGlzYXN0ZXJSZWNvdmVyeUd1aWRlKCk6IHN0cmluZyB7XG4gIHJldHVybiBgIyAke3RoaXMuc3lzdGVtTmFtZX0gLSDngb3lrrPlvqnml6fmiYvpoIbjgqzjgqTjg4lcblxuKirjg5Djg7zjgrjjg6fjg7MqKjogJHt0aGlzLnZlcnNpb259ICBcbioq5pyA57WC5pu05pawKio6ICR7dGhpcy5sYXN0VXBkYXRlZH1cblxuIyMg8J+Mqu+4jyDngb3lrrPlvqnml6foqIjnlLvmpoLopoFcblxuIyMjIOW+qeaXp+ebruaomVxuLSAqKlJUTyAoUmVjb3ZlcnkgVGltZSBPYmplY3RpdmUpKio6IDTmmYLplpPku6XlhoVcbi0gKipSUE8gKFJlY292ZXJ5IFBvaW50IE9iamVjdGl2ZSkqKjogMeaZgumWk+S7peWGhVxuLSAqKuWPr+eUqOaAp+ebruaomSoqOiA5OS45JSAo5bm06ZaTOC43NuaZgumWk+S7peWGheOBruODgOOCpuODs+OCv+OCpOODoClcblxuIyMjIOeBveWus+OCt+ODiuODquOCquWIhumhnlxuXG4jIyMjIOODrOODmeODqzE6IOODquODvOOCuOODp+ODs+mDqOWIhumanOWus1xuLSAqKuaDs+WumioqOiDljZjkuIBBWumanOWus+OAgeS4gOmDqOOCteODvOODk+OCueWBnOatolxuLSAqKuW9semfvyoqOiDmgKfog73kvY7kuIvjgIHkuIDmmYLnmoTjgqLjgq/jgrvjgrnlm7Dpm6Ncbi0gKirlvqnml6fmmYLplpMqKjogMzDliIbku6XlhoVcbi0gKirlr77lv5wqKjog6Ieq5YuV44OV44Kn44Kk44Or44Kq44O844OQ44O8XG5cbiMjIyMg44Os44OZ44OrMjog44Oq44O844K444On44Oz5YWo5L2T6Zqc5a6zXG4tICoq5oOz5a6aKio6IOODquODvOOCuOODp+ODs+WFqOS9k+OBruOCteODvOODk+OCueWBnOatolxuLSAqKuW9semfvyoqOiDlhajjgrXjg7zjg5PjgrnlgZzmraJcbi0gKirlvqnml6fmmYLplpMqKjogNOaZgumWk+S7peWGhVxuLSAqKuWvvuW/nCoqOiDku5bjg6rjg7zjgrjjg6fjg7Pjgbjjga7liIfjgormm7/jgYhcblxuIyMjIyDjg6zjg5njg6szOiDjg4fjg7zjgr/jgrvjg7Pjgr/jg7zngb3lrrNcbi0gKirmg7PlrpoqKjog6Ieq54S254G95a6z44CB5aSn6KaP5qih44Kk44Oz44OV44Op6Zqc5a6zXG4tICoq5b2x6Z+/Kio6IOmVt+acn+mWk+OBruOCteODvOODk+OCueWBnOatolxuLSAqKuW+qeaXp+aZgumWkyoqOiAyNOaZgumWk+S7peWGhVxuLSAqKuWvvuW/nCoqOiDlrozlhajjgarngb3lrrPlvqnml6fmiYvpoIZcblxuIyMg8J+Pl++4jyDngb3lrrPlvqnml6fjgqLjg7zjgq3jg4bjgq/jg4Hjg6NcblxuXFxgXFxgXFxgXG5QcmltYXJ5IFJlZ2lvbiAoYXAtbm9ydGhlYXN0LTEpICAgICBTZWNvbmRhcnkgUmVnaW9uICh1cy1lYXN0LTEpXG7ilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG7ilIIgIFByb2R1Y3Rpb24gRW52aXJvbm1lbnQgICAgIOKUgiAgICDilIIgIERSIEVudmlyb25tZW50IChTdGFuZGJ5KSAgIOKUglxu4pSCICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJDilIIgICAg4pSCICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJDilIJcbuKUgiAg4pSCIExhbWJkYSBGdW5jdGlvbnMgICAgICAgIOKUguKUgiAgICDilIIgIOKUgiBMYW1iZGEgRnVuY3Rpb25zICAgICAgICDilILilIJcbuKUgiAg4pSCIER5bmFtb0RCIFRhYmxlcyAgICAgICAgIOKUguKUguKUgOKUgOKUgOKWtuKUgiAg4pSCIER5bmFtb0RCIEdsb2JhbCBUYWJsZXMgIOKUguKUglxu4pSCICDilIIgT3BlblNlYXJjaCBDbHVzdGVyICAgICAg4pSC4pSCICAgIOKUgiAg4pSCIE9wZW5TZWFyY2ggQ2x1c3RlciAgICAgIOKUguKUglxu4pSCICDilIIgRlN4IEZpbGUgU3lzdGVtICAgICAgICAg4pSC4pSCICAgIOKUgiAg4pSCIEZTeCBCYWNrdXAvUmVzdG9yZSAgICAgIOKUguKUglxu4pSCICDilIIgUzMgQnVja2V0cyAgICAgICAgICAgICAg4pSC4pSC4pSA4pSA4pSA4pa24pSCICDilIIgUzMgQ3Jvc3MtUmVnaW9uIFJlcGwuICAg4pSC4pSCXG7ilIIgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmOKUgiAgICDilIIgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmOKUglxu4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmFxuICAgICAgICAgICAg4pSCICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilrJcbiAgICAgICAgICAgIOKWvCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCXG7ilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG7ilIIgIFJvdXRlIDUzIEhlYWx0aCBDaGVja3MgICAgIOKUgiAgICDilIIgIEF1dG9tYXRlZCBGYWlsb3ZlciAgICAgICAgIOKUglxu4pSCICBDbG91ZEZyb250IERpc3RyaWJ1dGlvbiAgICDilIIgICAg4pSCICBETlMgU3dpdGNoaW5nICAgICAgICAgICAgICDilIJcbuKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJhcblxcYFxcYFxcYFxuXG4jIyDwn5OLIOS6i+WJjea6luWCmeODu+ODkOODg+OCr+OCouODg+ODl+aIpueVpVxuXG4jIyMg6Ieq5YuV44OQ44OD44Kv44Ki44OD44OX6Kit5a6aXG5cbiMjIyMgRHluYW1vREIg44OQ44OD44Kv44Ki44OD44OXXG5cXGBcXGBcXGBiYXNoXG4jIFBvaW50LWluLXRpbWUgUmVjb3ZlcnnmnInlirnljJZcbmF3cyBkeW5hbW9kYiB1cGRhdGUtY29udGludW91cy1iYWNrdXBzIFxcXFxcbiAgLS10YWJsZS1uYW1lIHJhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXBvaW50LWluLXRpbWUtcmVjb3Zlcnktc3BlY2lmaWNhdGlvbiBQb2ludEluVGltZVJlY292ZXJ5RW5hYmxlZD10cnVlXG5cbiMg5pel5qyh44OQ44OD44Kv44Ki44OD44OX6Kit5a6aXG5hd3MgZHluYW1vZGIgcHV0LWJhY2t1cC1wb2xpY3kgXFxcXFxuICAtLXRhYmxlLW5hbWUgcmFnLXN5c3RlbS1zZXNzaW9ucyBcXFxcXG4gIC0tYmFja3VwLXBvbGljeSBCYWNrdXBFbmFibGVkPXRydWVcblxuIyBHbG9iYWwgVGFibGVz6Kit5a6a77yI54G95a6z5b6p5pen55So77yJXG5hd3MgZHluYW1vZGIgY3JlYXRlLWdsb2JhbC10YWJsZSBcXFxcXG4gIC0tZ2xvYmFsLXRhYmxlLW5hbWUgcmFnLXN5c3RlbS1zZXNzaW9ucyBcXFxcXG4gIC0tcmVwbGljYXRpb24tZ3JvdXAgUmVnaW9uTmFtZT1hcC1ub3J0aGVhc3QtMSBSZWdpb25OYW1lPXVzLWVhc3QtMVxuXFxgXFxgXFxgXG5cbiMjIyMgUzMg44Kv44Ot44K544Oq44O844K444On44Oz44Os44OX44Oq44Kx44O844K344On44OzXG5cXGBcXGBcXGBiYXNoXG4jIOODrOODl+ODquOCseODvOOCt+ODp+ODs+ioreWumlxuYXdzIHMzYXBpIHB1dC1idWNrZXQtcmVwbGljYXRpb24gXFxcXFxuICAtLWJ1Y2tldCByYWctc3lzdGVtLWRvY3VtZW50cyBcXFxcXG4gIC0tcmVwbGljYXRpb24tY29uZmlndXJhdGlvbiBmaWxlOi8vcmVwbGljYXRpb24tY29uZmlnLmpzb25cblxuIyByZXBsaWNhdGlvbi1jb25maWcuanNvblxue1xuICBcIlJvbGVcIjogXCJhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnJvbGUvcmVwbGljYXRpb24tcm9sZVwiLFxuICBcIlJ1bGVzXCI6IFtcbiAgICB7XG4gICAgICBcIklEXCI6IFwiUmVwbGljYXRlVG9VU0Vhc3QxXCIsXG4gICAgICBcIlN0YXR1c1wiOiBcIkVuYWJsZWRcIixcbiAgICAgIFwiUHJlZml4XCI6IFwiXCIsXG4gICAgICBcIkRlc3RpbmF0aW9uXCI6IHtcbiAgICAgICAgXCJCdWNrZXRcIjogXCJhcm46YXdzOnMzOjo6cmFnLXN5c3RlbS1kb2N1bWVudHMtZHItdXMtZWFzdC0xXCIsXG4gICAgICAgIFwiU3RvcmFnZUNsYXNzXCI6IFwiU1RBTkRBUkRfSUFcIlxuICAgICAgfVxuICAgIH1cbiAgXVxufVxuXFxgXFxgXFxgXG5cbiMjIyMgRlN4IOODkOODg+OCr+OCouODg+ODl1xuXFxgXFxgXFxgYmFzaFxuIyDoh6rli5Xjg5Djg4Pjgq/jgqLjg4Pjg5foqK3lrppcbmF3cyBmc3ggbW9kaWZ5LWZpbGUtc3lzdGVtIFxcXFxcbiAgLS1maWxlLXN5c3RlbS1pZCBmcy0wMTIzNDU2Nzg5YWJjZGVmMCBcXFxcXG4gIC0tb250YXAtY29uZmlndXJhdGlvbiBBdXRvbWF0aWNCYWNrdXBSZXRlbnRpb25EYXlzPTMwLERhaWx5QXV0b21hdGljQmFja3VwU3RhcnRUaW1lPTAzOjAwXG5cbiMg5omL5YuV44OQ44OD44Kv44Ki44OD44OX5L2c5oiQXG5hd3MgZnN4IGNyZWF0ZS1iYWNrdXAgXFxcXFxuICAtLWZpbGUtc3lzdGVtLWlkIGZzLTAxMjM0NTY3ODlhYmNkZWYwIFxcXFxcbiAgLS10YWdzIEtleT1QdXJwb3NlLFZhbHVlPURpc2FzdGVyUmVjb3ZlcnlcblxcYFxcYFxcYFxuXG4jIyMjIExhbWJkYSDplqLmlbDjg5Djg4Pjgq/jgqLjg4Pjg5dcblxcYFxcYFxcYGJhc2hcbiMg6Zai5pWw44Kz44O844OJ44GuUzPjg5Djg4Pjgq/jgqLjg4Pjg5dcbmF3cyBsYW1iZGEgZ2V0LWZ1bmN0aW9uIFxcXFxcbiAgLS1mdW5jdGlvbi1uYW1lIHJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1xdWVyeSAnQ29kZS5Mb2NhdGlvbicgXFxcXFxuICB8IHhhcmdzIHdnZXQgLU8gbGFtYmRhLWJhY2t1cC56aXBcblxuIyDoqK3lrprjga7jg5Djg4Pjgq/jgqLjg4Pjg5dcbmF3cyBsYW1iZGEgZ2V0LWZ1bmN0aW9uLWNvbmZpZ3VyYXRpb24gXFxcXFxuICAtLWZ1bmN0aW9uLW5hbWUgcmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgPiBsYW1iZGEtY29uZmlnLWJhY2t1cC5qc29uXG5cXGBcXGBcXGBcblxuIyMjIE9wZW5TZWFyY2gg44OQ44OD44Kv44Ki44OD44OXXG5cXGBcXGBcXGBiYXNoXG4jIOOCueODiuODg+ODl+OCt+ODp+ODg+ODiOODquODneOCuOODiOODquS9nOaIkFxuY3VybCAtWCBQVVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC9fc25hcHNob3QvYmFja3VwLXJlcG9cIiBcXFxcXG4gIC1IIFwiQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXCIgXFxcXFxuICAtZCAne1xuICAgIFwidHlwZVwiOiBcInMzXCIsXG4gICAgXCJzZXR0aW5nc1wiOiB7XG4gICAgICBcImJ1Y2tldFwiOiBcInJhZy1zeXN0ZW0tb3BlbnNlYXJjaC1iYWNrdXBzXCIsXG4gICAgICBcInJlZ2lvblwiOiBcImFwLW5vcnRoZWFzdC0xXCIsXG4gICAgICBcInJvbGVfYXJuXCI6IFwiYXJuOmF3czppYW06OjEyMzQ1Njc4OTAxMjpyb2xlL29wZW5zZWFyY2gtYmFja3VwLXJvbGVcIlxuICAgIH1cbiAgfSdcblxuIyDml6XmrKHjgrnjg4rjg4Pjg5fjgrfjg6fjg4Pjg4jkvZzmiJBcbmN1cmwgLVggUFVUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvX3NuYXBzaG90L2JhY2t1cC1yZXBvL2RhaWx5LSQoZGF0ZSArJVklbSVkKVwiIFxcXFxcbiAgLUggXCJDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25cIiBcXFxcXG4gIC1kICd7XG4gICAgXCJpbmRpY2VzXCI6IFwiZG9jdW1lbnRzLHNlc3Npb25zXCIsXG4gICAgXCJpZ25vcmVfdW5hdmFpbGFibGVcIjogdHJ1ZSxcbiAgICBcImluY2x1ZGVfZ2xvYmFsX3N0YXRlXCI6IGZhbHNlXG4gIH0nXG5cXGBcXGBcXGBcblxuIyMg8J+aqCDngb3lrrPmpJznn6Xjg7vliKTlrppcblxuIyMjIOiHquWLleeBveWus+aknOefpeOCt+OCueODhuODoFxuXFxgXFxgXFxgcHl0aG9uXG4jIExhbWJkYemWouaVsOOBq+OCiOOCi+eBveWus+aknOefpVxuaW1wb3J0IGJvdG8zXG5pbXBvcnQganNvblxuZnJvbSBkYXRldGltZSBpbXBvcnQgZGF0ZXRpbWUsIHRpbWVkZWx0YVxuXG5kZWYgbGFtYmRhX2hhbmRsZXIoZXZlbnQsIGNvbnRleHQpOlxuICAgIGNsb3Vkd2F0Y2ggPSBib3RvMy5jbGllbnQoJ2Nsb3Vkd2F0Y2gnKVxuICAgIFxuICAgICMg6KSH5pWw44Oh44OI44Oq44Kv44K544Gn44Gu5YGl5YWo5oCn56K66KqNXG4gICAgbWV0cmljc190b19jaGVjayA9IFtcbiAgICAgICAgKCdBV1MvTGFtYmRhJywgJ0Vycm9ycycsICdyYWctc3lzdGVtLWNoYXQtaGFuZGxlcicpLFxuICAgICAgICAoJ0FXUy9EeW5hbW9EQicsICdTeXN0ZW1FcnJvcnMnLCAncmFnLXN5c3RlbS1zZXNzaW9ucycpLFxuICAgICAgICAoJ0FXUy9FUycsICdDbHVzdGVyU3RhdHVzLnJlZCcsICdyYWctc3lzdGVtLXNlYXJjaCcpXG4gICAgXVxuICAgIFxuICAgIGZhaWx1cmVfY291bnQgPSAwXG4gICAgZm9yIG5hbWVzcGFjZSwgbWV0cmljX25hbWUsIGRpbWVuc2lvbl92YWx1ZSBpbiBtZXRyaWNzX3RvX2NoZWNrOlxuICAgICAgICByZXNwb25zZSA9IGNsb3Vkd2F0Y2guZ2V0X21ldHJpY19zdGF0aXN0aWNzKFxuICAgICAgICAgICAgTmFtZXNwYWNlPW5hbWVzcGFjZSxcbiAgICAgICAgICAgIE1ldHJpY05hbWU9bWV0cmljX25hbWUsXG4gICAgICAgICAgICBTdGFydFRpbWU9ZGF0ZXRpbWUudXRjbm93KCkgLSB0aW1lZGVsdGEobWludXRlcz0xNSksXG4gICAgICAgICAgICBFbmRUaW1lPWRhdGV0aW1lLnV0Y25vdygpLFxuICAgICAgICAgICAgUGVyaW9kPTMwMCxcbiAgICAgICAgICAgIFN0YXRpc3RpY3M9WydTdW0nXVxuICAgICAgICApXG4gICAgICAgIFxuICAgICAgICBpZiByZXNwb25zZVsnRGF0YXBvaW50cyddIGFuZCByZXNwb25zZVsnRGF0YXBvaW50cyddWy0xXVsnU3VtJ10gPiAwOlxuICAgICAgICAgICAgZmFpbHVyZV9jb3VudCArPSAxXG4gICAgXG4gICAgIyDngb3lrrPliKTlrprvvIgz44Gk5Lul5LiK44Gu44K144O844OT44K544Gn6Zqc5a6z77yJXG4gICAgaWYgZmFpbHVyZV9jb3VudCA+PSAzOlxuICAgICAgICB0cmlnZ2VyX2Rpc2FzdGVyX3JlY292ZXJ5KClcbiAgICBcbiAgICByZXR1cm4geydzdGF0dXNDb2RlJzogMjAwLCAnZmFpbHVyZV9jb3VudCc6IGZhaWx1cmVfY291bnR9XG5cbmRlZiB0cmlnZ2VyX2Rpc2FzdGVyX3JlY292ZXJ5KCk6XG4gICAgc25zID0gYm90bzMuY2xpZW50KCdzbnMnKVxuICAgIHNucy5wdWJsaXNoKFxuICAgICAgICBUb3BpY0Fybj0nYXJuOmF3czpzbnM6YXAtbm9ydGhlYXN0LTE6MTIzNDU2Nzg5MDEyOmRpc2FzdGVyLXJlY292ZXJ5LWFsZXJ0cycsXG4gICAgICAgIE1lc3NhZ2U9J0RJU0FTVEVSIFJFQ09WRVJZIFRSSUdHRVJFRDogTXVsdGlwbGUgc2VydmljZSBmYWlsdXJlcyBkZXRlY3RlZCcsXG4gICAgICAgIFN1YmplY3Q9J0RJU0FTVEVSIFJFQ09WRVJZIEFDVElWQVRJT04nXG4gICAgKVxuXFxgXFxgXFxgXG5cbiMjIyDmiYvli5Xngb3lrrPliKTlrprln7rmupZcbi0gKirjgrXjg7zjg5PjgrnlgZzmraLmmYLplpMqKjogMzDliIbku6XkuIpcbi0gKirlvbHpn7/nr4Tlm7IqKjog5YWo44Om44O844K244O844GuNTAl5Lul5LiKXG4tICoq5b6p5pen6KaL6L6844G/Kio6IDLmmYLplpPku6XlhoXjga7lvqnml6flm7Dpm6Ncbi0gKirjg4fjg7zjgr/mkI3lpLHjg6rjgrnjgq8qKjog6YeN6KaB44OH44O844K/44Gu5pCN5aSx5Y+v6IO95oCnXG5cbiMjIPCflIQg54G95a6z5b6p5pen5omL6aCGXG5cbiMjIyBQaGFzZSAxOiDnt4rmgKXlr77lv5wgKDAtMzDliIYpXG5cbiMjIyMgMS4xIOeBveWus+Wuo+iogFxuXFxgXFxgXFxgYmFzaFxuIyDngb3lrrPlvqnml6fjg4Hjg7zjg6Dmi5vpm4ZcbmF3cyBzbnMgcHVibGlzaCBcXFxcXG4gIC0tdG9waWMtYXJuIGFybjphd3M6c25zOmFwLW5vcnRoZWFzdC0xOjEyMzQ1Njc4OTAxMjpkci10ZWFtLWFsZXJ0cyBcXFxcXG4gIC0tbWVzc2FnZSBcIkRJU0FTVEVSIFJFQ09WRVJZIEFDVElWQVRFRCAtIEFsbCBEUiB0ZWFtIG1lbWJlcnMgcmVwb3J0IHRvIHdhciByb29tXCJcblxuIyDjgrnjg4bjg7zjgr/jgrnjg5rjg7zjgrjmm7TmlrBcbmN1cmwgLVggUE9TVCBodHRwczovL3N0YXR1cy1hcGkueW91ci1kb21haW4uY29tL2luY2lkZW50cyBcXFxcXG4gIC1IIFwiQXV0aG9yaXphdGlvbjogQmVhcmVyIFxcJFNUQVRVU19BUElfVE9LRU5cIiBcXFxcXG4gIC1kICd7XG4gICAgXCJuYW1lXCI6IFwiU2VydmljZSBEaXNydXB0aW9uIC0gRGlzYXN0ZXIgUmVjb3ZlcnkgaW4gUHJvZ3Jlc3NcIixcbiAgICBcInN0YXR1c1wiOiBcImludmVzdGlnYXRpbmdcIixcbiAgICBcIm1lc3NhZ2VcIjogXCJXZSBhcmUgZXhwZXJpZW5jaW5nIGEgc2VydmljZSBkaXNydXB0aW9uIGFuZCBoYXZlIGFjdGl2YXRlZCBvdXIgZGlzYXN0ZXIgcmVjb3ZlcnkgcHJvY2VkdXJlcy5cIlxuICB9J1xuXFxgXFxgXFxgXG5cbiMjIyMgMS4yIOW9semfv+evhOWbsueiuuiqjVxuXFxgXFxgXFxgYmFzaFxuIyDlhajjg6rjg7zjgrjjg6fjg7Pjgafjga7nirbmhYvnorroqo1cbmZvciByZWdpb24gaW4gYXAtbm9ydGhlYXN0LTEgdXMtZWFzdC0xIGV1LXdlc3QtMTsgZG9cbiAgZWNobyBcIkNoZWNraW5nIHJlZ2lvbjogJHJlZ2lvblwiXG4gIGF3cyBjbG91ZGZvcm1hdGlvbiBkZXNjcmliZS1zdGFja3MgXFxcXFxuICAgIC0tcmVnaW9uICRyZWdpb24gXFxcXFxuICAgIC0tc3RhY2stbmFtZSByYWctc3lzdGVtLXByb2QgXFxcXFxuICAgIC0tcXVlcnkgJ1N0YWNrc1swXS5TdGFja1N0YXR1cycgfHwgZWNobyBcIlN0YWNrIG5vdCBmb3VuZCBpbiAkcmVnaW9uXCJcbmRvbmVcblxuIyBETlPop6Pmsbrnorroqo1cbm5zbG9va3VwIHlvdXItZG9tYWluLmNvbVxuZGlnIHlvdXItZG9tYWluLmNvbVxuXFxgXFxgXFxgXG5cbiMjIyMgMS4zIOOCu+OCq+ODs+ODgOODquODquODvOOCuOODp+ODs+a6luWCmeeiuuiqjVxuXFxgXFxgXFxgYmFzaFxuIyBEUueSsOWig+OBrueKtuaFi+eiuuiqjVxuYXdzIGNsb3VkZm9ybWF0aW9uIGRlc2NyaWJlLXN0YWNrcyBcXFxcXG4gIC0tcmVnaW9uIHVzLWVhc3QtMSBcXFxcXG4gIC0tc3RhY2stbmFtZSByYWctc3lzdGVtLWRyIFxcXFxcbiAgLS1xdWVyeSAnU3RhY2tzWzBdLlN0YWNrU3RhdHVzJ1xuXG4jIERS44OH44O844K/44OZ44O844K544Gu54q25oWL56K66KqNXG5hd3MgZHluYW1vZGIgZGVzY3JpYmUtdGFibGUgXFxcXFxuICAtLXJlZ2lvbiB1cy1lYXN0LTEgXFxcXFxuICAtLXRhYmxlLW5hbWUgcmFnLXN5c3RlbS1zZXNzaW9ucyBcXFxcXG4gIC0tcXVlcnkgJ1RhYmxlLlRhYmxlU3RhdHVzJ1xuXFxgXFxgXFxgXG5cbiMjIyBQaGFzZSAyOiDjg4fjg7zjgr/lvqnml6cgKDMwLTEyMOWIhilcblxuIyMjIyAyLjEg44OH44O844K/5pW05ZCI5oCn56K66KqNXG5cXGBcXGBcXGBiYXNoXG4jIOacgOaWsOODkOODg+OCr+OCouODg+ODl+OBrueiuuiqjVxuYXdzIGR5bmFtb2RiIGxpc3QtYmFja3VwcyBcXFxcXG4gIC0tdGFibGUtbmFtZSByYWctc3lzdGVtLXNlc3Npb25zIFxcXFxcbiAgLS1xdWVyeSAnQmFja3VwU3VtbWFyaWVzWzBdLntCYWNrdXBBcm46QmFja3VwQXJuLEJhY2t1cENyZWF0aW9uRGF0ZVRpbWU6QmFja3VwQ3JlYXRpb25EYXRlVGltZX0nXG5cbiMgUzPjg4fjg7zjgr/lkIzmnJ/nirbms4Hnorroqo1cbmF3cyBzM2FwaSBnZXQtYnVja2V0LXJlcGxpY2F0aW9uIFxcXFxcbiAgLS1idWNrZXQgcmFnLXN5c3RlbS1kb2N1bWVudHMgXFxcXFxuICAtLXF1ZXJ5ICdSZXBsaWNhdGlvbkNvbmZpZ3VyYXRpb24uUnVsZXNbMF0uU3RhdHVzJ1xuXG4jIEZTeOODkOODg+OCr+OCouODg+ODl+eiuuiqjVxuYXdzIGZzeCBkZXNjcmliZS1iYWNrdXBzIFxcXFxcbiAgLS1maWx0ZXJzIE5hbWU9ZmlsZS1zeXN0ZW0taWQsVmFsdWVzPWZzLTAxMjM0NTY3ODlhYmNkZWYwIFxcXFxcbiAgLS1xdWVyeSAnQmFja3Vwc1swXS57QmFja3VwSWQ6QmFja3VwSWQsQ3JlYXRpb25UaW1lOkNyZWF0aW9uVGltZSxMaWZlY3ljbGU6TGlmZWN5Y2xlfSdcblxcYFxcYFxcYFxuXG4jIyMjIDIuMiDjgrvjgqvjg7Pjg4Djg6rjg6rjg7zjgrjjg6fjg7Pjgafjga7jg4fjg7zjgr/lvqnlhYNcblxcYFxcYFxcYGJhc2hcbiMgRHluYW1vRELlvqnlhYNcbmF3cyBkeW5hbW9kYiByZXN0b3JlLXRhYmxlLWZyb20tYmFja3VwIFxcXFxcbiAgLS1yZWdpb24gdXMtZWFzdC0xIFxcXFxcbiAgLS10YXJnZXQtdGFibGUtbmFtZSByYWctc3lzdGVtLXNlc3Npb25zIFxcXFxcbiAgLS1iYWNrdXAtYXJuIGFybjphd3M6ZHluYW1vZGI6YXAtbm9ydGhlYXN0LTE6MTIzNDU2Nzg5MDEyOnRhYmxlL3JhZy1zeXN0ZW0tc2Vzc2lvbnMvYmFja3VwLzAxMjM0NTY3ODkwMTIzLWFiY2RlZmdoXG5cbiMgT3BlblNlYXJjaOW+qeWFg1xuY3VybCAtWCBQT1NUIFwiaHR0cHM6Ly9kci1vcGVuc2VhcmNoLWVuZHBvaW50LnVzLWVhc3QtMS5lcy5hbWF6b25hd3MuY29tL19zbmFwc2hvdC9iYWNrdXAtcmVwby9sYXRlc3QvX3Jlc3RvcmVcIiBcXFxcXG4gIC1IIFwiQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXCIgXFxcXFxuICAtZCAne1xuICAgIFwiaW5kaWNlc1wiOiBcImRvY3VtZW50cyxzZXNzaW9uc1wiLFxuICAgIFwiaWdub3JlX3VuYXZhaWxhYmxlXCI6IHRydWUsXG4gICAgXCJpbmNsdWRlX2dsb2JhbF9zdGF0ZVwiOiBmYWxzZSxcbiAgICBcInJlbmFtZV9wYXR0ZXJuXCI6IFwiKC4rKVwiLFxuICAgIFwicmVuYW1lX3JlcGxhY2VtZW50XCI6IFwicmVzdG9yZWQtJDFcIlxuICB9J1xuXG4jIEZTeOW+qeWFg1xuYXdzIGZzeCByZXN0b3JlLXZvbHVtZS1mcm9tLXNuYXBzaG90IFxcXFxcbiAgLS1yZWdpb24gdXMtZWFzdC0xIFxcXFxcbiAgLS1jcmVhdGlvbi10b2tlbnMgcmFnLXN5c3RlbS1kci12b2x1bWUgXFxcXFxuICAtLXNuYXBzaG90LWlkIHNuYXAtMDEyMzQ1Njc4OWFiY2RlZjBcblxcYFxcYFxcYFxuXG4jIyMgUGhhc2UgMzog44K144O844OT44K55b6p5penICgxMjAtMjQw5YiGKVxuXG4jIyMjIDMuMSDjgrvjgqvjg7Pjg4Djg6rjg6rjg7zjgrjjg6fjg7Pjgafjga7jgrXjg7zjg5Pjgrnotbfli5VcblxcYFxcYFxcYGJhc2hcbiMgTGFtYmRh6Zai5pWw44OH44OX44Ot44KkXG5hd3MgbGFtYmRhIGNyZWF0ZS1mdW5jdGlvbiBcXFxcXG4gIC0tcmVnaW9uIHVzLWVhc3QtMSBcXFxcXG4gIC0tZnVuY3Rpb24tbmFtZSByYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tcnVudGltZSBweXRob24zLjkgXFxcXFxuICAtLXJvbGUgYXJuOmF3czppYW06OjEyMzQ1Njc4OTAxMjpyb2xlL2xhbWJkYS1leGVjdXRpb24tcm9sZSBcXFxcXG4gIC0taGFuZGxlciBpbmRleC5sYW1iZGFfaGFuZGxlciBcXFxcXG4gIC0tY29kZSBTM0J1Y2tldD1yYWctc3lzdGVtLWRlcGxveW1lbnRzLFMzS2V5PWxhbWJkYS9jaGF0LWhhbmRsZXIuemlwXG5cbiMgQVBJIEdhdGV3YXnoqK3lrppcbmF3cyBhcGlnYXRld2F5IGNyZWF0ZS1yZXN0LWFwaSBcXFxcXG4gIC0tcmVnaW9uIHVzLWVhc3QtMSBcXFxcXG4gIC0tbmFtZSByYWctc3lzdGVtLWFwaS1kciBcXFxcXG4gIC0tZGVzY3JpcHRpb24gXCJEaXNhc3RlciBSZWNvdmVyeSBBUElcIlxuXG4jIENsb3VkRnJvbnToqK3lrprmm7TmlrBcbmF3cyBjbG91ZGZyb250IHVwZGF0ZS1kaXN0cmlidXRpb24gXFxcXFxuICAtLWlkIEUxMjM0NTY3ODkwMTIzIFxcXFxcbiAgLS1kaXN0cmlidXRpb24tY29uZmlnIGZpbGU6Ly9kci1kaXN0cmlidXRpb24tY29uZmlnLmpzb25cblxcYFxcYFxcYFxuXG4jIyMjIDMuMiBETlPliIfjgormm7/jgYhcblxcYFxcYFxcYGJhc2hcbiMgUm91dGUgNTMg44Os44Kz44O844OJ5pu05pawXG5hd3Mgcm91dGU1MyBjaGFuZ2UtcmVzb3VyY2UtcmVjb3JkLXNldHMgXFxcXFxuICAtLWhvc3RlZC16b25lLWlkIFoxMjM0NTY3ODkwMTIzIFxcXFxcbiAgLS1jaGFuZ2UtYmF0Y2ggJ3tcbiAgICBcIkNoYW5nZXNcIjogW1xuICAgICAge1xuICAgICAgICBcIkFjdGlvblwiOiBcIlVQU0VSVFwiLFxuICAgICAgICBcIlJlc291cmNlUmVjb3JkU2V0XCI6IHtcbiAgICAgICAgICBcIk5hbWVcIjogXCJ5b3VyLWRvbWFpbi5jb21cIixcbiAgICAgICAgICBcIlR5cGVcIjogXCJBXCIsXG4gICAgICAgICAgXCJBbGlhc1RhcmdldFwiOiB7XG4gICAgICAgICAgICBcIkROU05hbWVcIjogXCJkci1hbGItMTIzNDU2Nzg5LnVzLWVhc3QtMS5lbGIuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgICAgICAgXCJFdmFsdWF0ZVRhcmdldEhlYWx0aFwiOiB0cnVlLFxuICAgICAgICAgICAgXCJIb3N0ZWRab25lSWRcIjogXCJaMzVTWERPVFJRN1g3S1wiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgXVxuICB9J1xuXG4jIEROU+S8neaSreeiuuiqjVxuZm9yIGkgaW4gezEuLjEwfTsgZG9cbiAgZWNobyBcIkROUyBDaGVjayAkaTpcIlxuICBuc2xvb2t1cCB5b3VyLWRvbWFpbi5jb20gOC44LjguOFxuICBzbGVlcCAzMFxuZG9uZVxuXFxgXFxgXFxgXG5cbiMjIyMgMy4zIOOCteODvOODk+OCueWLleS9nOeiuuiqjVxuXFxgXFxgXFxgYmFzaFxuIyDln7rmnKzmqZ/og73jg4bjgrnjg4hcbmN1cmwgLWYgaHR0cHM6Ly95b3VyLWRvbWFpbi5jb20vaGVhbHRoXG5jdXJsIC1mIGh0dHBzOi8veW91ci1kb21haW4uY29tL2FwaS9zdGF0dXNcblxuIyDoqo3oqLzjg4bjgrnjg4hcbmN1cmwgLVggUE9TVCBodHRwczovL3lvdXItZG9tYWluLmNvbS9hcGkvYXV0aC9sb2dpbiBcXFxcXG4gIC1IIFwiQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXCIgXFxcXFxuICAtZCAne1widXNlcm5hbWVcIjpcInRlc3R1c2VyXCIsXCJwYXNzd29yZFwiOlwidGVzdHBhc3NcIn0nXG5cbiMg44OB44Oj44OD44OI5qmf6IO944OG44K544OIXG5jdXJsIC1YIFBPU1QgaHR0cHM6Ly95b3VyLWRvbWFpbi5jb20vYXBpL2NoYXQgXFxcXFxuICAtSCBcIkNvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvblwiIFxcXFxcbiAgLUggXCJBdXRob3JpemF0aW9uOiBCZWFyZXIgXFwkVEVTVF9UT0tFTlwiIFxcXFxcbiAgLWQgJ3tcIm1lc3NhZ2VcIjpcIueBveWus+W+qeaXp+ODhuOCueODiOODoeODg+OCu+ODvOOCuFwifSdcblxcYFxcYFxcYFxuXG4jIyMgUGhhc2UgNDog55uj6KaW44O75a6J5a6a5YyWICgyNDDliIbku6XpmY0pXG5cbiMjIyMgNC4xIOW8t+WMluebo+imluioreWumlxuXFxgXFxgXFxgYmFzaFxuIyBEUueSsOWig+eUqOebo+imluioreWumlxuYXdzIGNsb3Vkd2F0Y2ggcHV0LW1ldHJpYy1hbGFybSBcXFxcXG4gIC0tcmVnaW9uIHVzLWVhc3QtMSBcXFxcXG4gIC0tYWxhcm0tbmFtZSBcIkRSLUxhbWJkYS1FcnJvcnNcIiBcXFxcXG4gIC0tYWxhcm0tZGVzY3JpcHRpb24gXCJEUiBlbnZpcm9ubWVudCBMYW1iZGEgZXJyb3JzXCIgXFxcXFxuICAtLW1ldHJpYy1uYW1lIEVycm9ycyBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9MYW1iZGEgXFxcXFxuICAtLXN0YXRpc3RpYyBTdW0gXFxcXFxuICAtLXBlcmlvZCA2MCBcXFxcXG4gIC0tdGhyZXNob2xkIDEgXFxcXFxuICAtLWNvbXBhcmlzb24tb3BlcmF0b3IgR3JlYXRlclRoYW5UaHJlc2hvbGRcblxuIyDjg63jgrDnm6PoppblvLfljJZcbmF3cyBsb2dzIGNyZWF0ZS1sb2ctZ3JvdXAgXFxcXFxuICAtLXJlZ2lvbiB1cy1lYXN0LTEgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIC9hd3MvbGFtYmRhL3JhZy1zeXN0ZW0tZHItbW9uaXRvcmluZ1xuXFxgXFxgXFxgXG5cbiMjIyMgNC4yIOODkeODleOCqeODvOODnuODs+OCueacgOmBqeWMllxuXFxgXFxgXFxgYmFzaFxuIyBMYW1iZGHlkIzmmYLlrp/ooYzmlbDoqr/mlbRcbmF3cyBsYW1iZGEgcHV0LXByb3Zpc2lvbmVkLWNvbmN1cnJlbmN5LWNvbmZpZyBcXFxcXG4gIC0tcmVnaW9uIHVzLWVhc3QtMSBcXFxcXG4gIC0tZnVuY3Rpb24tbmFtZSByYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tcXVhbGlmaWVyIFxcJExBVEVTVCBcXFxcXG4gIC0tcHJvdmlzaW9uZWQtY29uY3VycmVuY3ktdW5pdHMgNTBcblxuIyBEeW5hbW9EQuOCreODo+ODkeOCt+ODhuOCo+iqv+aVtFxuYXdzIGR5bmFtb2RiIHVwZGF0ZS10YWJsZSBcXFxcXG4gIC0tcmVnaW9uIHVzLWVhc3QtMSBcXFxcXG4gIC0tdGFibGUtbmFtZSByYWctc3lzdGVtLXNlc3Npb25zIFxcXFxcbiAgLS1wcm92aXNpb25lZC10aHJvdWdocHV0IFJlYWRDYXBhY2l0eVVuaXRzPTEwMCxXcml0ZUNhcGFjaXR5VW5pdHM9MTAwXG5cXGBcXGBcXGBcblxuIyMg8J+UhCDjg5XjgqfjgqTjg6vjg5Djg4Pjgq/miYvpoIZcblxuIyMjIOODl+ODqeOCpOODnuODquODquODvOOCuOODp+ODs+W+qeaXp+W+jOOBruaJi+mghlxuXG4jIyMjIDEuIOODh+ODvOOCv+WQjOacn+eiuuiqjVxuXFxgXFxgXFxgYmFzaFxuIyDjg4fjg7zjgr/lt67liIbnorroqo1cbmF3cyBkeW5hbW9kYiBzY2FuIFxcXFxcbiAgLS1yZWdpb24gYXAtbm9ydGhlYXN0LTEgXFxcXFxuICAtLXRhYmxlLW5hbWUgcmFnLXN5c3RlbS1zZXNzaW9ucyBcXFxcXG4gIC0tc2VsZWN0IENPVU5UXG5cbmF3cyBkeW5hbW9kYiBzY2FuIFxcXFxcbiAgLS1yZWdpb24gdXMtZWFzdC0xIFxcXFxcbiAgLS10YWJsZS1uYW1lIHJhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXNlbGVjdCBDT1VOVFxuXG4jIOW3ruWIhuODh+ODvOOCv+OBruWQjOacn1xuYXdzIGR5bmFtb2RiIGV4cG9ydC10YWJsZS10by1wb2ludC1pbi10aW1lIFxcXFxcbiAgLS1yZWdpb24gdXMtZWFzdC0xIFxcXFxcbiAgLS10YWJsZS1hcm4gYXJuOmF3czpkeW5hbW9kYjp1cy1lYXN0LTE6MTIzNDU2Nzg5MDEyOnRhYmxlL3JhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXMzLWJ1Y2tldCByYWctc3lzdGVtLWRyLXN5bmNcblxcYFxcYFxcYFxuXG4jIyMjIDIuIOautemajueahOODleOCp+OCpOODq+ODkOODg+OCr1xuXFxgXFxgXFxgYmFzaFxuIyDjg4jjg6njg5XjgqPjg4Pjgq/mrrXpmo7nmoTnp7vooYzvvIgxMCXihpI1MCXihpIxMDAl77yJXG5hd3Mgcm91dGU1MyBjaGFuZ2UtcmVzb3VyY2UtcmVjb3JkLXNldHMgXFxcXFxuICAtLWhvc3RlZC16b25lLWlkIFoxMjM0NTY3ODkwMTIzIFxcXFxcbiAgLS1jaGFuZ2UtYmF0Y2ggJ3tcbiAgICBcIkNoYW5nZXNcIjogW1xuICAgICAge1xuICAgICAgICBcIkFjdGlvblwiOiBcIlVQU0VSVFwiLFxuICAgICAgICBcIlJlc291cmNlUmVjb3JkU2V0XCI6IHtcbiAgICAgICAgICBcIk5hbWVcIjogXCJ5b3VyLWRvbWFpbi5jb21cIixcbiAgICAgICAgICBcIlR5cGVcIjogXCJBXCIsXG4gICAgICAgICAgXCJTZXRJZGVudGlmaWVyXCI6IFwiUHJpbWFyeVwiLFxuICAgICAgICAgIFwiV2VpZ2h0XCI6IDEwLFxuICAgICAgICAgIFwiQWxpYXNUYXJnZXRcIjoge1xuICAgICAgICAgICAgXCJETlNOYW1lXCI6IFwicHJpbWFyeS1hbGItMTIzNDU2Nzg5LmFwLW5vcnRoZWFzdC0xLmVsYi5hbWF6b25hd3MuY29tXCIsXG4gICAgICAgICAgICBcIkV2YWx1YXRlVGFyZ2V0SGVhbHRoXCI6IHRydWUsXG4gICAgICAgICAgICBcIkhvc3RlZFpvbmVJZFwiOiBcIloxNEdSSERDV0E1NlFUXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdXG4gIH0nXG5cXGBcXGBcXGBcblxuIyMg8J+TiiDngb3lrrPlvqnml6fjg4bjgrnjg4hcblxuIyMjIOWumuacn+ODhuOCueODiOioiOeUu1xuLSAqKuaciOasoSoqOiDpg6jliIbnmoTjg5XjgqfjgqTjg6vjgqrjg7zjg5Djg7zjg4bjgrnjg4hcbi0gKirlm5vljYrmnJ8qKjog5a6M5YWo54G95a6z5b6p5pen44OG44K544OIXG4tICoq5bm05qyhKio6IOWFqOekvueBveWus+W+qeaXp+iok+e3tFxuXG4jIyMg44OG44K544OI5omL6aCGXG5cXGBcXGBcXGBiYXNoXG4jIS9iaW4vYmFzaFxuIyDngb3lrrPlvqnml6fjg4bjgrnjg4jjgrnjgq/jg6rjg5fjg4hcblxuZWNobyBcIvCfp6og54G95a6z5b6p5pen44OG44K544OI6ZaL5aeLLi4uXCJcblxuIyDjg4bjgrnjg4jnkrDlooPjgafjga7ngb3lrrPjgrfjg5/jg6Xjg6zjg7zjgrfjg6fjg7NcbmF3cyBsYW1iZGEgdXBkYXRlLWZ1bmN0aW9uLWNvbmZpZ3VyYXRpb24gXFxcXFxuICAtLWZ1bmN0aW9uLW5hbWUgcmFnLXN5c3RlbS1jaGF0LWhhbmRsZXItdGVzdCBcXFxcXG4gIC0tZW52aXJvbm1lbnQgVmFyaWFibGVzPSd7U0lNVUxBVEVfRElTQVNURVI9dHJ1ZX0nXG5cbiMg44OV44Kn44Kk44Or44Kq44O844OQ44O85a6f6KGMXG4uL3NjcmlwdHMvZmFpbG92ZXItdG8tZHIuc2ggLS10ZXN0LW1vZGVcblxuIyDlvqnml6fmmYLplpPmuKzlrppcbnN0YXJ0X3RpbWU9JChkYXRlICslcylcbi4vc2NyaXB0cy92ZXJpZnktZHItZnVuY3Rpb25hbGl0eS5zaFxuZW5kX3RpbWU9JChkYXRlICslcylcbnJlY292ZXJ5X3RpbWU9JCgoZW5kX3RpbWUgLSBzdGFydF90aW1lKSlcblxuZWNobyBcIuKchSDngb3lrrPlvqnml6fjg4bjgrnjg4jlrozkuoZcIlxuZWNobyBcIuW+qeaXp+aZgumWkzogJHtyZWNvdmVyeV90aW1lfeenklwiXG5cXGBcXGBcXGBcblxuLS0tXG5cbioq6YeN6KaBKio6IOeBveWus+W+qeaXp+ioiOeUu+OBr+Wumuacn+eahOOBq+ODhuOCueODiOOBl+OAgeWun+mam+OBrueBveWus+aZguOBq+eiuuWun+OBq+apn+iDveOBmeOCi+OBk+OBqOOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhOOAglxuYDtcbn1cbi8qKlxuICAgKiDjgrvjgq3jg6Xjg6rjg4bjgqPpgYvnlKjjgqzjgqTjg4njga7nlJ/miJBcbiAgICovXG5nZW5lcmF0ZVNlY3VyaXR5T3BlcmF0aW9uc0d1aWRlKCk6IHN0cmluZyB7XG4gIHJldHVybiBgIyAke3RoaXMuc3lzdGVtTmFtZX0gLSDjgrvjgq3jg6Xjg6rjg4bjgqPpgYvnlKjjgqzjgqTjg4lcblxuKirjg5Djg7zjgrjjg6fjg7MqKjogJHt0aGlzLnZlcnNpb259ICBcbioq5pyA57WC5pu05pawKio6ICR7dGhpcy5sYXN0VXBkYXRlZH1cblxuIyMg8J+UkiDjgrvjgq3jg6Xjg6rjg4bjgqPpgYvnlKjjg5Xjg6zjg7zjg6Djg6/jg7zjgq9cblxuIyMjIOOCu+OCreODpeODquODhuOCo+mBi+eUqOOBruWfuuacrOWOn+WJh1xuMS4gKirlpJrlsaTpmLLlvqEqKjog6KSH5pWw44Gu44K744Kt44Ol44Oq44OG44Kj5bGk44Gr44KI44KL5L+d6K23XG4yLiAqKuacgOWwj+aoqemZkOOBruWOn+WJhyoqOiDlv4XopoHmnIDlsI/pmZDjga7jgqLjgq/jgrvjgrnmqKnpmZBcbjMuICoq57aZ57aa55qE55uj6KaWKio6IDI0Lzfjgrvjgq3jg6Xjg6rjg4bjgqPnm6PoppZcbjQuICoq44Kk44Oz44K344OH44Oz44OI5a++5b+cKio6IOi/hemAn+OBquiEheWogeWvvuW/nFxuNS4gKirlrprmnJ/nmoTnm6Pmn7sqKjog44K744Kt44Ol44Oq44OG44Kj6Kit5a6a44Gu5a6a5pyf6KaL55u044GXXG5cbiMjIyDjgrvjgq3jg6Xjg6rjg4bjgqPosqzku7vliIbmi4Xjg6Ljg4fjg6tcblxcYFxcYFxcYFxu4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG7ilIIgICAgICAgICAgICAgICAgICAgIOOBiuWuouanmOOBruiyrOS7uyAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCXG7ilIIgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCDilIJcbuKUgiAg4pSCIOOCouODl+ODquOCseODvOOCt+ODp+ODs+ODrOODmeODq+OCu+OCreODpeODquODhuOCoyAgICAgICAgICAgICAgICAgICAg4pSCIOKUglxu4pSCICDilIIgLSBJQU3mqKnpmZDnrqHnkIYgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiDilIJcbuKUgiAg4pSCIC0g44Ki44OX44Oq44Kx44O844K344On44Oz6KqN6Ki844O76KqN5Y+vICAgICAgICAgICAgICAgICAgICAgICAg4pSCIOKUglxu4pSCICDilIIgLSDjg4fjg7zjgr/mmpflj7fljJYgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiDilIJcbuKUgiAg4pSCIC0g44ON44OD44OI44Ov44O844Kv6Kit5a6aICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiDilIJcbuKUgiAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIOKUglxu4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYXG7ilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJBcbuKUgiAgICAgICAgICAgICAgICAgICAgQVdT44Gu6LKs5Lu7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUglxu4pSCICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAg4pSCXG7ilIIgIOKUgiDjgqTjg7Pjg5Xjg6njgrnjg4jjg6njgq/jg4Hjg6Pjgrvjgq3jg6Xjg6rjg4bjgqMgICAgICAgICAgICAgICAgICAgICAg4pSCIOKUglxu4pSCICDilIIgLSDniannkIbjgrvjgq3jg6Xjg6rjg4bjgqMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIOKUglxu4pSCICDilIIgLSDjg43jg4Pjg4jjg6/jg7zjgq/jgqTjg7Pjg5Xjg6kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIIg4pSCXG7ilIIgIOKUgiAtIOODj+OCpOODkeODvOODkOOCpOOCtuODvCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIIg4pSCXG7ilIIgIOKUgiAtIOODnuODjeODvOOCuOODieOCteODvOODk+OCuSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIOKUglxu4pSCICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJgg4pSCXG7ilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJhcblxcYFxcYFxcYFxuXG4jIyDwn5uh77iPIOOCu+OCreODpeODquODhuOCo+OCs+ODs+ODneODvOODjeODs+ODiOebo+imllxuXG4jIyMgMS4gSUFNIOOCu+OCreODpeODquODhuOCo+ebo+imllxuXG4jIyMjIOaoqemZkOebo+afu+OCueOCr+ODquODl+ODiFxuXFxgXFxgXFxgYmFzaFxuIyEvYmluL2Jhc2hcbiMgSUFN5qip6ZmQ55uj5p+744K544Kv44Oq44OX44OIXG5cbmVjaG8gXCLwn5SNIElBTeaoqemZkOebo+afu+mWi+Wniy4uLlwiXG5cbiMg6YGO5bqm44Gq5qip6ZmQ44KS5oyB44Gk44Ot44O844Or44Gu54m55a6aXG5hd3MgaWFtIGxpc3Qtcm9sZXMgLS1xdWVyeSAnUm9sZXNbP2NvbnRhaW5zKFJvbGVOYW1lLCBcXGByYWctc3lzdGVtXFxgKV0uUm9sZU5hbWUnIFxcXFxcbiAgfCB4YXJncyAtSSB7fSBhd3MgaWFtIGxpc3QtYXR0YWNoZWQtcm9sZS1wb2xpY2llcyAtLXJvbGUtbmFtZSB7fVxuXG4jIOacquS9v+eUqElBTeODreODvOODq+OBrueJueWumlxuYXdzIGlhbSBnZW5lcmF0ZS1jcmVkZW50aWFsLXJlcG9ydFxuc2xlZXAgMTBcbmF3cyBpYW0gZ2V0LWNyZWRlbnRpYWwtcmVwb3J0IC0tcXVlcnkgJ0NvbnRlbnQnIC0tb3V0cHV0IHRleHQgfCBiYXNlNjQgLWQgPiBjcmVkZW50aWFsLXJlcG9ydC5jc3ZcblxuIyDmnIDntYLkvb/nlKjml6XjgYw5MOaXpeS7peS4iuWJjeOBruODreODvOODq+OCkueJueWumlxucHl0aG9uMyA8PCBFT0ZcbmltcG9ydCBjc3ZcbmZyb20gZGF0ZXRpbWUgaW1wb3J0IGRhdGV0aW1lLCB0aW1lZGVsdGFcblxud2l0aCBvcGVuKCdjcmVkZW50aWFsLXJlcG9ydC5jc3YnLCAncicpIGFzIGY6XG4gICAgcmVhZGVyID0gY3N2LkRpY3RSZWFkZXIoZilcbiAgICBjdXRvZmZfZGF0ZSA9IGRhdGV0aW1lLm5vdygpIC0gdGltZWRlbHRhKGRheXM9OTApXG4gICAgXG4gICAgZm9yIHJvdyBpbiByZWFkZXI6XG4gICAgICAgIGlmICdyYWctc3lzdGVtJyBpbiByb3dbJ3VzZXInXTpcbiAgICAgICAgICAgIGxhc3RfdXNlZCA9IHJvdy5nZXQoJ3Bhc3N3b3JkX2xhc3RfdXNlZCcsICdOL0EnKVxuICAgICAgICAgICAgaWYgbGFzdF91c2VkICE9ICdOL0EnIGFuZCBsYXN0X3VzZWQgIT0gJ25vX2luZm9ybWF0aW9uJzpcbiAgICAgICAgICAgICAgICBsYXN0X3VzZWRfZGF0ZSA9IGRhdGV0aW1lLnN0cnB0aW1lKGxhc3RfdXNlZC5zcGxpdCgnVCcpWzBdLCAnJVktJW0tJWQnKVxuICAgICAgICAgICAgICAgIGlmIGxhc3RfdXNlZF9kYXRlIDwgY3V0b2ZmX2RhdGU6XG4gICAgICAgICAgICAgICAgICAgIHByaW50KGZcIuKaoO+4jyAg5pyq5L2/55So44Ot44O844OrOiB7cm93Wyd1c2VyJ119ICjmnIDntYLkvb/nlKg6IHtsYXN0X3VzZWR9KVwiKVxuRU9GXG5cbmVjaG8gXCLinIUgSUFN5qip6ZmQ55uj5p+75a6M5LqGXCJcblxcYFxcYFxcYFxuXG4jIyMjIOeVsOW4uOOBqklBTea0u+WLleaknOefpVxuXFxgXFxgXFxgYmFzaFxuIyBDbG91ZFRyYWlsIElBTeOCpOODmeODs+ODiOWIhuaekFxuYXdzIGxvZ3Mgc3RhcnQtcXVlcnkgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIENsb3VkVHJhaWwvcmFnLXN5c3RlbSBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLWQgJzI0IGhvdXJzIGFnbycgKyVzKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlICslcykgXFxcXFxuICAtLXF1ZXJ5LXN0cmluZyAnXG4gICAgZmllbGRzIEB0aW1lc3RhbXAsIGV2ZW50TmFtZSwgc291cmNlSVBBZGRyZXNzLCB1c2VySWRlbnRpdHkudHlwZSwgdXNlcklkZW50aXR5LnVzZXJOYW1lXG4gICAgfCBmaWx0ZXIgZXZlbnROYW1lIGxpa2UgL0NyZWF0ZVJvbGV8QXR0YWNoUm9sZVBvbGljeXxQdXRSb2xlUG9saWN5fENyZWF0ZVVzZXJ8QXR0YWNoVXNlclBvbGljeS9cbiAgICB8IHNvcnQgQHRpbWVzdGFtcCBkZXNjXG4gICdcblxuIyDmqKnpmZDmmIfmoLzjga7mpJznn6VcbmF3cyBsb2dzIHN0YXJ0LXF1ZXJ5IFxcXFxcbiAgLS1sb2ctZ3JvdXAtbmFtZSBDbG91ZFRyYWlsL3JhZy1zeXN0ZW0gXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC1kICcyNCBob3VycyBhZ28nICslcykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSArJXMpIFxcXFxcbiAgLS1xdWVyeS1zdHJpbmcgJ1xuICAgIGZpZWxkcyBAdGltZXN0YW1wLCBldmVudE5hbWUsIHNvdXJjZUlQQWRkcmVzcywgdXNlcklkZW50aXR5LnVzZXJOYW1lLCByZXF1ZXN0UGFyYW1ldGVyc1xuICAgIHwgZmlsdGVyIGV2ZW50TmFtZSA9IFwiQXR0YWNoUm9sZVBvbGljeVwiIGFuZCByZXF1ZXN0UGFyYW1ldGVycy5wb2xpY3lBcm4gbGlrZSAvQWRtaW5pc3RyYXRvckFjY2Vzc3xQb3dlclVzZXJBY2Nlc3MvXG4gICAgfCBzb3J0IEB0aW1lc3RhbXAgZGVzY1xuICAnXG5cXGBcXGBcXGBcblxuIyMjIDIuIOODjeODg+ODiOODr+ODvOOCr+OCu+OCreODpeODquODhuOCo+ebo+imllxuXG4jIyMjIFdBRiDjg63jgrDliIbmnpBcblxcYFxcYFxcYGJhc2hcbiMgV0FG5pS75pKD44OR44K/44O844Oz5YiG5p6QXG5hd3MgbG9ncyBzdGFydC1xdWVyeSBcXFxcXG4gIC0tbG9nLWdyb3VwLW5hbWUgYXdzLXdhZi1sb2dzLXJhZy1zeXN0ZW0gXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC1kICcyNCBob3VycyBhZ28nICslcykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSArJXMpIFxcXFxcbiAgLS1xdWVyeS1zdHJpbmcgJ1xuICAgIGZpZWxkcyBAdGltZXN0YW1wLCBodHRwUmVxdWVzdC5jbGllbnRJcCwgaHR0cFJlcXVlc3QudXJpLCBhY3Rpb24sIHRlcm1pbmF0aW5nUnVsZUlkXG4gICAgfCBmaWx0ZXIgYWN0aW9uID0gXCJCTE9DS1wiXG4gICAgfCBzdGF0cyBjb3VudCgpIGJ5IGh0dHBSZXF1ZXN0LmNsaWVudElwLCB0ZXJtaW5hdGluZ1J1bGVJZFxuICAgIHwgc29ydCBjb3VudCBkZXNjXG4gICdcblxuIyDlnLDnkIbnmoTnlbDluLjjgqLjgq/jgrvjgrnmpJznn6VcbmF3cyBsb2dzIHN0YXJ0LXF1ZXJ5IFxcXFxcbiAgLS1sb2ctZ3JvdXAtbmFtZSBhd3Mtd2FmLWxvZ3MtcmFnLXN5c3RlbSBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLWQgJzI0IGhvdXJzIGFnbycgKyVzKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlICslcykgXFxcXFxuICAtLXF1ZXJ5LXN0cmluZyAnXG4gICAgZmllbGRzIEB0aW1lc3RhbXAsIGh0dHBSZXF1ZXN0LmNsaWVudElwLCBodHRwUmVxdWVzdC5jb3VudHJ5XG4gICAgfCBmaWx0ZXIgaHR0cFJlcXVlc3QuY291bnRyeSBub3QgaW4gW1wiSlBcIiwgXCJVU1wiXVxuICAgIHwgc3RhdHMgY291bnQoKSBieSBodHRwUmVxdWVzdC5jb3VudHJ5LCBodHRwUmVxdWVzdC5jbGllbnRJcFxuICAgIHwgc29ydCBjb3VudCBkZXNjXG4gICdcblxcYFxcYFxcYFxuXG4jIyMjIFZQQyBGbG93IExvZ3Mg5YiG5p6QXG5cXGBcXGBcXGBiYXNoXG4jIOeVsOW4uOOBquODjeODg+ODiOODr+ODvOOCr+ODiOODqeODleOCo+ODg+OCr+aknOefpVxuYXdzIGxvZ3Mgc3RhcnQtcXVlcnkgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIFZQQ0Zsb3dMb2dzIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMSBob3VyIGFnbycgKyVzKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlICslcykgXFxcXFxuICAtLXF1ZXJ5LXN0cmluZyAnXG4gICAgZmllbGRzIEB0aW1lc3RhbXAsIHNyY2FkZHIsIGRzdGFkZHIsIHNyY3BvcnQsIGRzdHBvcnQsIHByb3RvY29sLCBhY3Rpb25cbiAgICB8IGZpbHRlciBhY3Rpb24gPSBcIlJFSkVDVFwiXG4gICAgfCBzdGF0cyBjb3VudCgpIGJ5IHNyY2FkZHIsIGRzdHBvcnRcbiAgICB8IHNvcnQgY291bnQgZGVzY1xuICAgIHwgbGltaXQgMjBcbiAgJ1xuXG4jIOWGhemDqOmAmuS/oeOBrueVsOW4uOaknOefpVxuYXdzIGxvZ3Mgc3RhcnQtcXVlcnkgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIFZQQ0Zsb3dMb2dzIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMSBob3VyIGFnbycgKyVzKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlICslcykgXFxcXFxuICAtLXF1ZXJ5LXN0cmluZyAnXG4gICAgZmllbGRzIEB0aW1lc3RhbXAsIHNyY2FkZHIsIGRzdGFkZHIsIGJ5dGVzXG4gICAgfCBmaWx0ZXIgc3JjYWRkciBsaWtlIC9eMTBcXFxcLi8gYW5kIGRzdGFkZHIgbGlrZSAvXjEwXFxcXC4vXG4gICAgfCBzdGF0cyBzdW0oYnl0ZXMpIGFzIHRvdGFsX2J5dGVzIGJ5IHNyY2FkZHIsIGRzdGFkZHJcbiAgICB8IHNvcnQgdG90YWxfYnl0ZXMgZGVzY1xuICAgIHwgbGltaXQgMTBcbiAgJ1xuXFxgXFxgXFxgXG5cbiMjIyAzLiDjgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7Pjgrvjgq3jg6Xjg6rjg4bjgqPnm6PoppZcblxuIyMjIyDoqo3oqLzjg7voqo3lj6/jg63jgrDnm6PoppZcblxcYFxcYFxcYGJhc2hcbiMg6KqN6Ki85aSx5pWX44OR44K/44O844Oz5YiG5p6QXG5hd3MgbG9ncyBzdGFydC1xdWVyeSBcXFxcXG4gIC0tbG9nLWdyb3VwLW5hbWUgL2F3cy9sYW1iZGEvcmFnLXN5c3RlbS1hdXRoLWhhbmRsZXIgXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC1kICcyNCBob3VycyBhZ28nICslcykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSArJXMpIFxcXFxcbiAgLS1xdWVyeS1zdHJpbmcgJ1xuICAgIGZpZWxkcyBAdGltZXN0YW1wLCBAbWVzc2FnZSwgQHJlcXVlc3RJZFxuICAgIHwgZmlsdGVyIEBtZXNzYWdlIGxpa2UgL0FVVEhFTlRJQ0FUSU9OX0ZBSUxFRC9cbiAgICB8IHBhcnNlIEBtZXNzYWdlIFwic291cmNlSVA6ICogdXNlcm5hbWU6ICpcIiBhcyBzb3VyY2VJUCwgdXNlcm5hbWVcbiAgICB8IHN0YXRzIGNvdW50KCkgYnkgc291cmNlSVAsIHVzZXJuYW1lXG4gICAgfCBzb3J0IGNvdW50IGRlc2NcbiAgJ1xuXG4jIOODluODq+ODvOODiOODleOCqeODvOOCueaUu+aSg+aknOefpVxuYXdzIGxvZ3Mgc3RhcnQtcXVlcnkgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIC9hd3MvbGFtYmRhL3JhZy1zeXN0ZW0tYXV0aC1oYW5kbGVyIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMSBob3VyIGFnbycgKyVzKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlICslcykgXFxcXFxuICAtLXF1ZXJ5LXN0cmluZyAnXG4gICAgZmllbGRzIEB0aW1lc3RhbXAsIEBtZXNzYWdlXG4gICAgfCBmaWx0ZXIgQG1lc3NhZ2UgbGlrZSAvQVVUSEVOVElDQVRJT05fRkFJTEVEL1xuICAgIHwgcGFyc2UgQG1lc3NhZ2UgXCJzb3VyY2VJUDogKlwiIGFzIHNvdXJjZUlQXG4gICAgfCBzdGF0cyBjb3VudCgpIGFzIGZhaWx1cmVfY291bnQgYnkgc291cmNlSVBcbiAgICB8IGZpbHRlciBmYWlsdXJlX2NvdW50ID4gMTBcbiAgICB8IHNvcnQgZmFpbHVyZV9jb3VudCBkZXNjXG4gICdcblxcYFxcYFxcYFxuXG4jIyMjIFNRTOOCpOODs+OCuOOCp+OCr+OCt+ODp+ODs+ODu1hTU+aknOefpVxuXFxgXFxgXFxgYmFzaFxuIyDmgqrmhI/jga7jgYLjgovjg5rjgqTjg63jg7zjg4nmpJznn6VcbmF3cyBsb2dzIHN0YXJ0LXF1ZXJ5IFxcXFxcbiAgLS1sb2ctZ3JvdXAtbmFtZSAvYXdzL2xhbWJkYS9yYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLWQgJzI0IGhvdXJzIGFnbycgKyVzKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlICslcykgXFxcXFxuICAtLXF1ZXJ5LXN0cmluZyAnXG4gICAgZmllbGRzIEB0aW1lc3RhbXAsIEBtZXNzYWdlLCBAcmVxdWVzdElkXG4gICAgfCBmaWx0ZXIgQG1lc3NhZ2UgbGlrZSAvU0VMRUNULipGUk9NfFVOSU9OLipTRUxFQ1R8PHNjcmlwdHxqYXZhc2NyaXB0OnxldmFsXFwoL1xuICAgIHwgc29ydCBAdGltZXN0YW1wIGRlc2NcbiAgJ1xuXG4jIOeVsOW4uOOBquODleOCoeOCpOODq+OCouODg+ODl+ODreODvOODieaknOefpVxuYXdzIGxvZ3Mgc3RhcnQtcXVlcnkgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIC9hd3MvbGFtYmRhL3JhZy1zeXN0ZW0tZG9jdW1lbnQtcHJvY2Vzc29yIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMjQgaG91cnMgYWdvJyArJXMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgKyVzKSBcXFxcXG4gIC0tcXVlcnktc3RyaW5nICdcbiAgICBmaWVsZHMgQHRpbWVzdGFtcCwgQG1lc3NhZ2VcbiAgICB8IGZpbHRlciBAbWVzc2FnZSBsaWtlIC9TVVNQSUNJT1VTX0ZJTEVfVFlQRXxNQUxXQVJFX0RFVEVDVEVEfEZJTEVfU0laRV9FWENFRURFRC9cbiAgICB8IHNvcnQgQHRpbWVzdGFtcCBkZXNjXG4gICdcblxcYFxcYFxcYFxuXG4jIyDwn5qoIOOCu+OCreODpeODquODhuOCo+OCpOODs+OCt+ODh+ODs+ODiOWvvuW/nFxuXG4jIyMg44Kk44Oz44K344OH44Oz44OI5YiG6aGe44O75a++5b+c44Oe44OI44Oq44Kv44K5XG5cbnwg6YeN6KaB5bqmIHwg44Kk44Oz44K344OH44Oz44OI44K/44Kk44OXIHwg5a++5b+c5pmC6ZaTIHwg6YCa55+l5YWIIHwg44Ko44K544Kr44Os44O844K344On44OzIHxcbnwtLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS18LS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tfFxufCBDcml0aWNhbCB8IOODh+ODvOOCv+a8j+a0qeOAgeOCt+OCueODhuODoOS+teWusyB8IDE15YiG5Lul5YaFIHwgQ0lTTyArIOWFqOW9ueWToSB8IOWNs+W6pyB8XG58IEhpZ2ggfCDkuI3mraPjgqLjgq/jgrvjgrnjgIHjg57jg6vjgqbjgqfjgqIgfCAx5pmC6ZaT5Lul5YaFIHwg44K744Kt44Ol44Oq44OG44Kj44OB44O844OgIHwgMuaZgumWk+W+jCB8XG58IE1lZGl1bSB8IOaoqemZkOaYh+agvOOAgeioreWumuS4jeWCmSB8IDTmmYLplpPku6XlhoUgfCDpgYvnlKjjg4Hjg7zjg6AgfCAyNOaZgumWk+W+jCB8XG58IExvdyB8IOODneODquOCt+ODvOmBleWPjeOAgei7veW+ruOBquiEhuW8seaApyB8IDI05pmC6ZaT5Lul5YaFIHwg5ouF5b2T6ICFIHwg6YCx5qyh5aCx5ZGKIHxcblxuIyMjIOOCu+OCreODpeODquODhuOCo+OCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOaJi+mghlxuXG4jIyMjIFBoYXNlIDE6IOaknOefpeODu+WIneacn+WvvuW/nCAoMC0xNeWIhilcblxcYFxcYFxcYGJhc2hcbiMg44K744Kt44Ol44Oq44OG44Kj44Kk44Oz44K344OH44Oz44OI5qSc55+l5pmC44Gu5Yid5pyf5a++5b+cXG4jIS9iaW4vYmFzaFxuXG5JTkNJREVOVF9JRD1cIlNFQy0kKGRhdGUgKyVZJW0lZC0lSCVNJVMpXCJcbmVjaG8gXCLwn5qoIOOCu+OCreODpeODquODhuOCo+OCpOODs+OCt+ODh+ODs+ODiOaknOefpTogJElOQ0lERU5UX0lEXCJcblxuIyAxLiDlvbHpn7/nr4Tlm7Ljga7liJ3mnJ/oqZXkvqFcbmVjaG8gXCLwn5OKIOW9semfv+evhOWbsuipleS+oeS4rS4uLlwiXG5hd3MgY2xvdWR0cmFpbCBsb29rdXAtZXZlbnRzIFxcXFxcbiAgLS1sb29rdXAtYXR0cmlidXRlcyBBdHRyaWJ1dGVLZXk9RXZlbnROYW1lLEF0dHJpYnV0ZVZhbHVlPUFzc3VtZVJvbGUgXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC1kICcxIGhvdXIgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgKyVZLSVtLSVkVCVIOiVNOiVTKVxuXG4jIDIuIOeWkeOCj+OBl+OBhOOCouOCr+ODhuOCo+ODk+ODhuOCo+OBrumalOmbolxuZWNobyBcIvCflJIg55aR44KP44GX44GE44Ki44Kv44OG44Kj44OT44OG44Kj6ZqU6Zui5LitLi4uXCJcbiMg55aR44KP44GX44GESVDjgqLjg4njg6zjgrnjga7jg5bjg63jg4Pjgq9cbmF3cyB3YWZ2MiB1cGRhdGUtaXAtc2V0IFxcXFxcbiAgLS1zY29wZSBSRUdJT05BTCBcXFxcXG4gIC0taWQgc3VzcGljaW91cy1pcHMgXFxcXFxuICAtLWFkZHJlc3NlcyBcIjE5Mi4wLjIuMS8zMlwiXG5cbiMgMy4g44Kk44Oz44K344OH44Oz44OI6YCa55+lXG5lY2hvIFwi8J+ToiDjgqTjg7Pjgrfjg4fjg7Pjg4jpgJrnn6XpgIHkv6HkuK0uLi5cIlxuYXdzIHNucyBwdWJsaXNoIFxcXFxcbiAgLS10b3BpYy1hcm4gYXJuOmF3czpzbnM6YXAtbm9ydGhlYXN0LTE6MTIzNDU2Nzg5MDEyOnNlY3VyaXR5LWluY2lkZW50cyBcXFxcXG4gIC0tbWVzc2FnZSBcIlNFQ1VSSVRZIElOQ0lERU5UIERFVEVDVEVEOiAkSU5DSURFTlRfSUQgLSBJbW1lZGlhdGUgYXR0ZW50aW9uIHJlcXVpcmVkXCJcblxcYFxcYFxcYFxuXG4jIyMjIFBoYXNlIDI6IOWwgeOBmOi+vOOCgeODu+iqv+afuyAoMTUtNjDliIYpXG5cXGBcXGBcXGBiYXNoXG4jIOOCu+OCreODpeODquODhuOCo+OCpOODs+OCt+ODh+ODs+ODiOiqv+afu+OCueOCr+ODquODl+ODiFxuIyEvYmluL2Jhc2hcblxuZWNobyBcIvCflI0g6Kmz57Sw6Kq/5p+76ZaL5aeLLi4uXCJcblxuIyAxLiDmlLvmkoPogIXjga7mtLvli5Xjgr/jgqTjg6Djg6njgqTjg7PkvZzmiJBcbmF3cyBsb2dzIHN0YXJ0LXF1ZXJ5IFxcXFxcbiAgLS1sb2ctZ3JvdXAtbmFtZSBDbG91ZFRyYWlsL3JhZy1zeXN0ZW0gXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC1kICcyNCBob3VycyBhZ28nICslcykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSArJXMpIFxcXFxcbiAgLS1xdWVyeS1zdHJpbmcgJ1xuICAgIGZpZWxkcyBAdGltZXN0YW1wLCBldmVudE5hbWUsIHNvdXJjZUlQQWRkcmVzcywgdXNlcklkZW50aXR5LnVzZXJOYW1lLCBhd3NSZWdpb25cbiAgICB8IGZpbHRlciBzb3VyY2VJUEFkZHJlc3MgPSBcIjE5Mi4wLjIuMVwiXG4gICAgfCBzb3J0IEB0aW1lc3RhbXAgYXNjXG4gICdcblxuIyAyLiDlvbHpn7/jgpLlj5fjgZHjgZ/jg6rjgr3jg7zjgrnjga7nibnlrppcbmF3cyBjbG91ZHRyYWlsIGxvb2t1cC1ldmVudHMgXFxcXFxuICAtLWxvb2t1cC1hdHRyaWJ1dGVzIEF0dHJpYnV0ZUtleT1Vc2VybmFtZSxBdHRyaWJ1dGVWYWx1ZT1jb21wcm9taXNlZC11c2VyIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMjQgaG91cnMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1xdWVyeSAnRXZlbnRzWypdLntFdmVudFRpbWU6RXZlbnRUaW1lLEV2ZW50TmFtZTpFdmVudE5hbWUsUmVzb3VyY2VzOlJlc291cmNlc30nXG5cbiMgMy4g44OH44O844K/44Ki44Kv44K744K554q25rOB56K66KqNXG5hd3MgbG9ncyBzdGFydC1xdWVyeSBcXFxcXG4gIC0tbG9nLWdyb3VwLW5hbWUgL2F3cy9sYW1iZGEvcmFnLXN5c3RlbS1kb2N1bWVudC1wcm9jZXNzb3IgXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC1kICcyNCBob3VycyBhZ28nICslcykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSArJXMpIFxcXFxcbiAgLS1xdWVyeS1zdHJpbmcgJ1xuICAgIGZpZWxkcyBAdGltZXN0YW1wLCBAbWVzc2FnZVxuICAgIHwgZmlsdGVyIEBtZXNzYWdlIGxpa2UgL0RPQ1VNRU5UX0FDQ0VTUy9cbiAgICB8IHBhcnNlIEBtZXNzYWdlIFwidXNlcjogKiBkb2N1bWVudDogKlwiIGFzIHVzZXIsIGRvY3VtZW50XG4gICAgfCBmaWx0ZXIgdXNlciA9IFwiY29tcHJvbWlzZWQtdXNlclwiXG4gICAgfCBzb3J0IEB0aW1lc3RhbXAgZGVzY1xuICAnXG5cXGBcXGBcXGBcblxuIyMjIyBQaGFzZSAzOiDmoLnntbbjg7vlvqnml6cgKDYwLTI0MOWIhilcblxcYFxcYFxcYGJhc2hcbiMg44K744Kt44Ol44Oq44OG44Kj44Kk44Oz44K344OH44Oz44OI5b6p5pen44K544Kv44Oq44OX44OIXG4jIS9iaW4vYmFzaFxuXG5lY2hvIFwi8J+boO+4jyDjgrvjgq3jg6Xjg6rjg4bjgqPlvqnml6fplovlp4suLi5cIlxuXG4jIDEuIOS+teWus+OBleOCjOOBn+OCouOCq+OCpuODs+ODiOOBrueEoeWKueWMllxuYXdzIGlhbSBkZWxldGUtbG9naW4tcHJvZmlsZSAtLXVzZXItbmFtZSBjb21wcm9taXNlZC11c2VyXG5hd3MgaWFtIGxpc3QtYWNjZXNzLWtleXMgLS11c2VyLW5hbWUgY29tcHJvbWlzZWQtdXNlciBcXFxcXG4gIC0tcXVlcnkgJ0FjY2Vzc0tleU1ldGFkYXRhWypdLkFjY2Vzc0tleUlkJyBcXFxcXG4gIHwgeGFyZ3MgLUkge30gYXdzIGlhbSBkZWxldGUtYWNjZXNzLWtleSAtLXVzZXItbmFtZSBjb21wcm9taXNlZC11c2VyIC0tYWNjZXNzLWtleS1pZCB7fVxuXG4jIDIuIOOCu+ODg+OCt+ODp+ODs+OBrueEoeWKueWMllxuYXdzIGR5bmFtb2RiIHNjYW4gLS10YWJsZS1uYW1lIHJhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLWZpbHRlci1leHByZXNzaW9uIFwiY29udGFpbnModXNlcm5hbWUsIDp1c2VyKVwiIFxcXFxcbiAgLS1leHByZXNzaW9uLWF0dHJpYnV0ZS12YWx1ZXMgJ3tcIjp1c2VyXCI6e1wiU1wiOlwiY29tcHJvbWlzZWQtdXNlclwifX0nIFxcXFxcbiAgLS1xdWVyeSAnSXRlbXNbKl0uc2Vzc2lvbl9pZC5TJyBcXFxcXG4gIHwgeGFyZ3MgLUkge30gYXdzIGR5bmFtb2RiIGRlbGV0ZS1pdGVtIC0tdGFibGUtbmFtZSByYWctc3lzdGVtLXNlc3Npb25zIC0ta2V5ICd7XCJzZXNzaW9uX2lkXCI6e1wiU1wiOlwie31cIn19J1xuXG4jIDMuIOW9semfv+OCkuWPl+OBkeOBn+ODh+ODvOOCv+OBrueiuuiqjeODu+W+qeaXp1xuYXdzIHMzYXBpIGxpc3Qtb2JqZWN0LXZlcnNpb25zIFxcXFxcbiAgLS1idWNrZXQgcmFnLXN5c3RlbS1kb2N1bWVudHMgXFxcXFxuICAtLXByZWZpeCBcInVzZXIvY29tcHJvbWlzZWQtdXNlci9cIiBcXFxcXG4gIC0tcXVlcnkgJ1ZlcnNpb25zWz9Jc0xhdGVzdD09XFxgZmFsc2VcXGBdLntLZXk6S2V5LFZlcnNpb25JZDpWZXJzaW9uSWQsTGFzdE1vZGlmaWVkOkxhc3RNb2RpZmllZH0nXG5cbiMgNC4g44K744Kt44Ol44Oq44OG44Kj6Kit5a6a44Gu5by35YyWXG5hd3MgaWFtIHB1dC11c2VyLXBvbGljeSBcXFxcXG4gIC0tdXNlci1uYW1lIGVtZXJnZW5jeS1hZG1pbiBcXFxcXG4gIC0tcG9saWN5LW5hbWUgRW1lcmdlbmN5U2VjdXJpdHlQb2xpY3kgXFxcXFxuICAtLXBvbGljeS1kb2N1bWVudCBmaWxlOi8vZW1lcmdlbmN5LXNlY3VyaXR5LXBvbGljeS5qc29uXG5cXGBcXGBcXGBcblxuIyMg8J+UkCDjg4fjg7zjgr/kv53orbfjg7vmmpflj7fljJbnrqHnkIZcblxuIyMjIOaal+WPt+WMlueKtuaFi+ebo+imllxuXFxgXFxgXFxgYmFzaFxuIyDlhajjgrXjg7zjg5Pjgrnjga7mmpflj7fljJbnirbmhYvnorroqo1cbiMhL2Jpbi9iYXNoXG5cbmVjaG8gXCLwn5SQIOaal+WPt+WMlueKtuaFi+eiuuiqjemWi+Wniy4uLlwiXG5cbiMgUzPjg5DjgrHjg4Pjg4jmmpflj7fljJbnorroqo1cbmF3cyBzM2FwaSBnZXQtYnVja2V0LWVuY3J5cHRpb24gLS1idWNrZXQgcmFnLXN5c3RlbS1kb2N1bWVudHMgXFxcXFxuICAtLXF1ZXJ5ICdTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24uUnVsZXNbMF0uQXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdCdcblxuIyBEeW5hbW9EQuaal+WPt+WMlueiuuiqjVxuYXdzIGR5bmFtb2RiIGRlc2NyaWJlLXRhYmxlIC0tdGFibGUtbmFtZSByYWctc3lzdGVtLXNlc3Npb25zIFxcXFxcbiAgLS1xdWVyeSAnVGFibGUuU1NFRGVzY3JpcHRpb24uU3RhdHVzJ1xuXG4jIExhbWJkYeeSsOWig+WkieaVsOaal+WPt+WMlueiuuiqjVxuYXdzIGxhbWJkYSBnZXQtZnVuY3Rpb24tY29uZmlndXJhdGlvbiAtLWZ1bmN0aW9uLW5hbWUgcmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAtLXF1ZXJ5ICdLTVNLZXlBcm4nXG5cbiMgT3BlblNlYXJjaOaal+WPt+WMlueiuuiqjVxuY3VybCAtWCBHRVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC9fY2x1c3Rlci9zZXR0aW5nc1wiIFxcXFxcbiAgLUggXCJDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25cIiB8IGpxICcucGVyc2lzdGVudC5jbHVzdGVyLmVuY3J5cHRpb24nXG5cbmVjaG8gXCLinIUg5pqX5Y+35YyW54q25oWL56K66KqN5a6M5LqGXCJcblxcYFxcYFxcYFxuXG4jIyMgS01TIOOCreODvOeuoeeQhlxuXFxgXFxgXFxgYmFzaFxuIyBLTVPjgq3jg7zjg63jg7zjg4bjg7zjgrfjg6fjg7PnirbmhYvnorroqo1cbmF3cyBrbXMgZGVzY3JpYmUta2V5IC0ta2V5LWlkIGFsaWFzL3JhZy1zeXN0ZW0tZW5jcnlwdGlvbiBcXFxcXG4gIC0tcXVlcnkgJ0tleU1ldGFkYXRhLntLZXlJZDpLZXlJZCxLZXlSb3RhdGlvblN0YXR1czpLZXlSb3RhdGlvblN0YXR1cyxDcmVhdGlvbkRhdGU6Q3JlYXRpb25EYXRlfSdcblxuIyDjgq3jg7zkvb/nlKjnirbms4Hnm6PoppZcbmF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9LTVMgXFxcXFxuICAtLW1ldHJpYy1uYW1lIE51bWJlck9mUmVxdWVzdHNTdWNjZWVkZWQgXFxcXFxuICAtLWRpbWVuc2lvbnMgTmFtZT1LZXlJZCxWYWx1ZT1hcm46YXdzOmttczphcC1ub3J0aGVhc3QtMToxMjM0NTY3ODkwMTI6a2V5LzEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQ1Njc4OTAxMiBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLXUgLWQgJzI0IGhvdXJzIGFnbycgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlIC11ICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAtLXBlcmlvZCAzNjAwIFxcXFxcbiAgLS1zdGF0aXN0aWNzIFN1bVxuXG4jIOeVsOW4uOOBqktNU+S9v+eUqOODkeOCv+ODvOODs+aknOefpVxuYXdzIGxvZ3Mgc3RhcnQtcXVlcnkgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIENsb3VkVHJhaWwvcmFnLXN5c3RlbSBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLWQgJzI0IGhvdXJzIGFnbycgKyVzKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlICslcykgXFxcXFxuICAtLXF1ZXJ5LXN0cmluZyAnXG4gICAgZmllbGRzIEB0aW1lc3RhbXAsIGV2ZW50TmFtZSwgc291cmNlSVBBZGRyZXNzLCB1c2VySWRlbnRpdHkudXNlck5hbWVcbiAgICB8IGZpbHRlciBldmVudE5hbWUgbGlrZSAvRGVjcnlwdHxHZW5lcmF0ZURhdGFLZXkvXG4gICAgfCBzdGF0cyBjb3VudCgpIGJ5IHNvdXJjZUlQQWRkcmVzcywgdXNlcklkZW50aXR5LnVzZXJOYW1lXG4gICAgfCBzb3J0IGNvdW50IGRlc2NcbiAgJ1xuXFxgXFxgXFxgXG5cbiMjIPCflI0g6ISG5byx5oCn566h55CGXG5cbiMjIyDlrprmnJ/ohIblvLHmgKfjgrnjgq3jg6Pjg7NcblxcYFxcYFxcYGJhc2hcbiMhL2Jpbi9iYXNoXG4jIOiEhuW8seaAp+OCueOCreODo+ODs+OCueOCr+ODquODl+ODiFxuXG5lY2hvIFwi8J+UjSDohIblvLHmgKfjgrnjgq3jg6Pjg7Pplovlp4suLi5cIlxuXG4jIDEuIExhbWJkYemWouaVsOOBruS+neWtmOmWouS/guOCueOCreODo+ODs1xuZm9yIGZ1bmN0aW9uIGluICQoYXdzIGxhbWJkYSBsaXN0LWZ1bmN0aW9ucyAtLXF1ZXJ5ICdGdW5jdGlvbnNbP2NvbnRhaW5zKEZ1bmN0aW9uTmFtZSwgXFxgcmFnLXN5c3RlbVxcYCldLkZ1bmN0aW9uTmFtZScgLS1vdXRwdXQgdGV4dCk7IGRvXG4gIGVjaG8gXCJTY2FubmluZyBmdW5jdGlvbjogJGZ1bmN0aW9uXCJcbiAgXG4gICMg6Zai5pWw44Kz44O844OJ44OA44Km44Oz44Ot44O844OJXG4gIGF3cyBsYW1iZGEgZ2V0LWZ1bmN0aW9uIC0tZnVuY3Rpb24tbmFtZSAkZnVuY3Rpb24gLS1xdWVyeSAnQ29kZS5Mb2NhdGlvbicgXFxcXFxuICAgIHwgeGFyZ3Mgd2dldCAtTyAvdG1wLyRmdW5jdGlvbi56aXBcbiAgXG4gICMg5L6d5a2Y6Zai5L+C5oq95Ye644O744K544Kt44Oj44OzXG4gIHVuemlwIC1xIC90bXAvJGZ1bmN0aW9uLnppcCAtZCAvdG1wLyRmdW5jdGlvbi9cbiAgaWYgWyAtZiAvdG1wLyRmdW5jdGlvbi9yZXF1aXJlbWVudHMudHh0IF07IHRoZW5cbiAgICBzYWZldHkgY2hlY2sgLXIgL3RtcC8kZnVuY3Rpb24vcmVxdWlyZW1lbnRzLnR4dFxuICBmaVxuICBcbiAgcm0gLXJmIC90bXAvJGZ1bmN0aW9uKlxuZG9uZVxuXG4jIDIuIOOCs+ODs+ODhuODiuOCpOODoeODvOOCuOOCueOCreODo+ODs++8iEVDUuOBruWgtOWQiO+8iVxuYXdzIGVjciBkZXNjcmliZS1yZXBvc2l0b3JpZXMgLS1xdWVyeSAncmVwb3NpdG9yaWVzWz9jb250YWlucyhyZXBvc2l0b3J5TmFtZSwgXFxgcmFnLXN5c3RlbVxcYCldLnJlcG9zaXRvcnlOYW1lJyAtLW91dHB1dCB0ZXh0IFxcXFxcbiAgfCB4YXJncyAtSSB7fSBhd3MgZWNyIHN0YXJ0LWltYWdlLXNjYW4gLS1yZXBvc2l0b3J5LW5hbWUge30gLS1pbWFnZS1pZCBpbWFnZVRhZz1sYXRlc3RcblxuIyAzLiDjgqTjg7Pjg5Xjg6noqK3lrprjgrnjgq3jg6Pjg7NcbmF3cyBjb25maWcgZ2V0LWNvbXBsaWFuY2Utc3VtbWFyeS1ieS1jb25maWctcnVsZSBcXFxcXG4gIC0tcXVlcnkgJ0NvbXBsaWFuY2VTdW1tYXJ5LntDb21wbGlhbnRSdWxlQ291bnQ6Q29tcGxpYW50UnVsZUNvdW50LE5vbkNvbXBsaWFudFJ1bGVDb3VudDpOb25Db21wbGlhbnRSdWxlQ291bnR9J1xuXG5lY2hvIFwi4pyFIOiEhuW8seaAp+OCueOCreODo+ODs+WujOS6hlwiXG5cXGBcXGBcXGBcblxuIyMjIOOCu+OCreODpeODquODhuOCo+ioreWumuebo+afu1xuXFxgXFxgXFxgYmFzaFxuIyBBV1MgQ29uZmlnIOODq+ODvOODq+OBq+OCiOOCi+OCu+OCreODpeODquODhuOCo+ebo+afu1xuYXdzIGNvbmZpZyBwdXQtY29uZmlnLXJ1bGUgXFxcXFxuICAtLWNvbmZpZy1ydWxlICd7XG4gICAgXCJDb25maWdSdWxlTmFtZVwiOiBcInMzLWJ1Y2tldC1wdWJsaWMtYWNjZXNzLXByb2hpYml0ZWRcIixcbiAgICBcIlNvdXJjZVwiOiB7XG4gICAgICBcIk93bmVyXCI6IFwiQVdTXCIsXG4gICAgICBcIlNvdXJjZUlkZW50aWZpZXJcIjogXCJTM19CVUNLRVRfUFVCTElDX0FDQ0VTU19QUk9ISUJJVEVEXCJcbiAgICB9XG4gIH0nXG5cbmF3cyBjb25maWcgcHV0LWNvbmZpZy1ydWxlIFxcXFxcbiAgLS1jb25maWctcnVsZSAne1xuICAgIFwiQ29uZmlnUnVsZU5hbWVcIjogXCJsYW1iZGEtZnVuY3Rpb24tcHVibGljLWFjY2Vzcy1wcm9oaWJpdGVkXCIsXG4gICAgXCJTb3VyY2VcIjoge1xuICAgICAgXCJPd25lclwiOiBcIkFXU1wiLFxuICAgICAgXCJTb3VyY2VJZGVudGlmaWVyXCI6IFwiTEFNQkRBX0ZVTkNUSU9OX1BVQkxJQ19BQ0NFU1NfUFJPSElCSVRFRFwiXG4gICAgfVxuICB9J1xuXG4jIOOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODl+ebo+afu1xuYXdzIGVjMiBkZXNjcmliZS1zZWN1cml0eS1ncm91cHMgXFxcXFxuICAtLWZpbHRlcnMgXCJOYW1lPWdyb3VwLW5hbWUsVmFsdWVzPXJhZy1zeXN0ZW0tKlwiIFxcXFxcbiAgLS1xdWVyeSAnU2VjdXJpdHlHcm91cHNbKl0ue0dyb3VwSWQ6R3JvdXBJZCxHcm91cE5hbWU6R3JvdXBOYW1lLElwUGVybWlzc2lvbnM6SXBQZXJtaXNzaW9uc30nIFxcXFxcbiAgfCBqcSAnLltdIHwgc2VsZWN0KC5JcFBlcm1pc3Npb25zW10uSXBSYW5nZXNbXT8uQ2lkcklwID09IFwiMC4wLjAuMC8wXCIpJ1xuXFxgXFxgXFxgXG5cbiMjIPCfk4og44K744Kt44Ol44Oq44OG44Kj44Oh44OI44Oq44Kv44K544O744Os44Od44O844OIXG5cbiMjIyDjgrvjgq3jg6Xjg6rjg4bjgqPjg4Djg4Pjgrfjg6Xjg5zjg7zjg4lcblxcYFxcYFxcYGpzb25cbntcbiAgXCJkYXNoYm9hcmRfbmFtZVwiOiBcIlJBRy1TeXN0ZW0tU2VjdXJpdHktRGFzaGJvYXJkXCIsXG4gIFwid2lkZ2V0c1wiOiBbXG4gICAge1xuICAgICAgXCJ0eXBlXCI6IFwibWV0cmljXCIsXG4gICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICBcIm1ldHJpY3NcIjogW1xuICAgICAgICAgIFtcIkFXUy9XQUZcIiwgXCJCbG9ja2VkUmVxdWVzdHNcIiwgXCJXZWJBQ0xcIiwgXCJyYWctc3lzdGVtLXdhZlwiXSxcbiAgICAgICAgICBbXCJBV1MvV0FGXCIsIFwiQWxsb3dlZFJlcXVlc3RzXCIsIFwiV2ViQUNMXCIsIFwicmFnLXN5c3RlbS13YWZcIl1cbiAgICAgICAgXSxcbiAgICAgICAgXCJwZXJpb2RcIjogMzAwLFxuICAgICAgICBcInN0YXRcIjogXCJTdW1cIixcbiAgICAgICAgXCJyZWdpb25cIjogXCJhcC1ub3J0aGVhc3QtMVwiLFxuICAgICAgICBcInRpdGxlXCI6IFwiV0FGIFJlcXVlc3QgU3RhdGlzdGljc1wiXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBcInR5cGVcIjogXCJsb2dcIixcbiAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgIFwicXVlcnlcIjogXCJTT1VSQ0UgJy9hd3MvbGFtYmRhL3JhZy1zeXN0ZW0tYXV0aC1oYW5kbGVyJyB8IGZpZWxkcyBAdGltZXN0YW1wLCBAbWVzc2FnZSB8IGZpbHRlciBAbWVzc2FnZSBsaWtlIC9BVVRIRU5USUNBVElPTl9GQUlMRUQvIHwgc3RhdHMgY291bnQoKSBieSBiaW4oNW0pXCIsXG4gICAgICAgIFwicmVnaW9uXCI6IFwiYXAtbm9ydGhlYXN0LTFcIixcbiAgICAgICAgXCJ0aXRsZVwiOiBcIkF1dGhlbnRpY2F0aW9uIEZhaWx1cmVzXCJcbiAgICAgIH1cbiAgICB9XG4gIF1cbn1cblxcYFxcYFxcYFxuXG4jIyMg5pyI5qyh44K744Kt44Ol44Oq44OG44Kj44Os44Od44O844OI55Sf5oiQXG5cXGBcXGBcXGBweXRob25cbiMhL3Vzci9iaW4vZW52IHB5dGhvbjNcbiMg5pyI5qyh44K744Kt44Ol44Oq44OG44Kj44Os44Od44O844OI55Sf5oiQ44K544Kv44Oq44OX44OIXG5cbmltcG9ydCBib3RvM1xuaW1wb3J0IGpzb25cbmZyb20gZGF0ZXRpbWUgaW1wb3J0IGRhdGV0aW1lLCB0aW1lZGVsdGFcbmZyb20gY29sbGVjdGlvbnMgaW1wb3J0IGRlZmF1bHRkaWN0XG5cbmRlZiBnZW5lcmF0ZV9zZWN1cml0eV9yZXBvcnQoKTpcbiAgICAjIENsb3VkVHJhaWzliIbmnpBcbiAgICBjbG91ZHRyYWlsID0gYm90bzMuY2xpZW50KCdjbG91ZHRyYWlsJylcbiAgICBsb2dzID0gYm90bzMuY2xpZW50KCdsb2dzJylcbiAgICBcbiAgICBlbmRfdGltZSA9IGRhdGV0aW1lLnV0Y25vdygpXG4gICAgc3RhcnRfdGltZSA9IGVuZF90aW1lIC0gdGltZWRlbHRhKGRheXM9MzApXG4gICAgXG4gICAgIyDjgrvjgq3jg6Xjg6rjg4bjgqPjgqTjg5njg7Pjg4jpm4boqIhcbiAgICBzZWN1cml0eV9ldmVudHMgPSBkZWZhdWx0ZGljdChpbnQpXG4gICAgXG4gICAgIyBXQUbjg5bjg63jg4Pjgq/ntbHoqIhcbiAgICB3YWZfcXVlcnkgPSAnJydcbiAgICBmaWVsZHMgQHRpbWVzdGFtcCwgaHR0cFJlcXVlc3QuY2xpZW50SXAsIGFjdGlvbiwgdGVybWluYXRpbmdSdWxlSWRcbiAgICB8IGZpbHRlciBhY3Rpb24gPSBcIkJMT0NLXCJcbiAgICB8IHN0YXRzIGNvdW50KCkgYnkgdGVybWluYXRpbmdSdWxlSWRcbiAgICAnJydcbiAgICBcbiAgICByZXNwb25zZSA9IGxvZ3Muc3RhcnRfcXVlcnkoXG4gICAgICAgIGxvZ0dyb3VwTmFtZT0nYXdzLXdhZi1sb2dzLXJhZy1zeXN0ZW0nLFxuICAgICAgICBzdGFydFRpbWU9aW50KHN0YXJ0X3RpbWUudGltZXN0YW1wKCkpLFxuICAgICAgICBlbmRUaW1lPWludChlbmRfdGltZS50aW1lc3RhbXAoKSksXG4gICAgICAgIHF1ZXJ5U3RyaW5nPXdhZl9xdWVyeVxuICAgIClcbiAgICBcbiAgICAjIOiqjeiovOWkseaVl+e1seioiFxuICAgIGF1dGhfcXVlcnkgPSAnJydcbiAgICBmaWVsZHMgQHRpbWVzdGFtcCwgQG1lc3NhZ2VcbiAgICB8IGZpbHRlciBAbWVzc2FnZSBsaWtlIC9BVVRIRU5USUNBVElPTl9GQUlMRUQvXG4gICAgfCBzdGF0cyBjb3VudCgpIGJ5IGJpbigxZClcbiAgICAnJydcbiAgICBcbiAgICBhdXRoX3Jlc3BvbnNlID0gbG9ncy5zdGFydF9xdWVyeShcbiAgICAgICAgbG9nR3JvdXBOYW1lPScvYXdzL2xhbWJkYS9yYWctc3lzdGVtLWF1dGgtaGFuZGxlcicsXG4gICAgICAgIHN0YXJ0VGltZT1pbnQoc3RhcnRfdGltZS50aW1lc3RhbXAoKSksXG4gICAgICAgIGVuZFRpbWU9aW50KGVuZF90aW1lLnRpbWVzdGFtcCgpKSxcbiAgICAgICAgcXVlcnlTdHJpbmc9YXV0aF9xdWVyeVxuICAgIClcbiAgICBcbiAgICAjIOODrOODneODvOODiOeUn+aIkFxuICAgIHJlcG9ydCA9IHtcbiAgICAgICAgJ3JlcG9ydF9wZXJpb2QnOiBmXCJ7c3RhcnRfdGltZS5zdHJmdGltZSgnJVktJW0tJWQnKX0gdG8ge2VuZF90aW1lLnN0cmZ0aW1lKCclWS0lbS0lZCcpfVwiLFxuICAgICAgICAnd2FmX2Jsb2Nrcyc6ICdQcm9jZXNzaW5nLi4uJyxcbiAgICAgICAgJ2F1dGhfZmFpbHVyZXMnOiAnUHJvY2Vzc2luZy4uLicsXG4gICAgICAgICdzZWN1cml0eV9yZWNvbW1lbmRhdGlvbnMnOiBbXG4gICAgICAgICAgICAnUmV2aWV3IGFuZCB1cGRhdGUgSUFNIHBvbGljaWVzJyxcbiAgICAgICAgICAgICdSb3RhdGUgYWNjZXNzIGtleXMgb2xkZXIgdGhhbiA5MCBkYXlzJyxcbiAgICAgICAgICAgICdVcGRhdGUgc2VjdXJpdHkgZ3JvdXAgcnVsZXMnLFxuICAgICAgICAgICAgJ1JldmlldyBDbG91ZFRyYWlsIGxvZ3MgZm9yIGFub21hbGllcydcbiAgICAgICAgXVxuICAgIH1cbiAgICBcbiAgICB3aXRoIG9wZW4oZidzZWN1cml0eS1yZXBvcnQte2VuZF90aW1lLnN0cmZ0aW1lKFwiJVklbVwiKX0uanNvbicsICd3JykgYXMgZjpcbiAgICAgICAganNvbi5kdW1wKHJlcG9ydCwgZiwgaW5kZW50PTIpXG4gICAgXG4gICAgcHJpbnQoZlwi4pyFIOOCu+OCreODpeODquODhuOCo+ODrOODneODvOODiOeUn+aIkOWujOS6hjogc2VjdXJpdHktcmVwb3J0LXtlbmRfdGltZS5zdHJmdGltZSgnJVklbScpfS5qc29uXCIpXG5cbmlmIF9fbmFtZV9fID09IFwiX19tYWluX19cIjpcbiAgICBnZW5lcmF0ZV9zZWN1cml0eV9yZXBvcnQoKVxuXFxgXFxgXFxgXG5cbiMjIPCfjq8g44K744Kt44Ol44Oq44OG44Kj6YGL55SoS1BJXG5cbiMjIyDkuLvopoHjgrvjgq3jg6Xjg6rjg4bjgqPjg6Hjg4jjg6rjgq/jgrlcbi0gKirjgrvjgq3jg6Xjg6rjg4bjgqPjgqTjg7Pjgrfjg4fjg7Pjg4jlr77lv5zmmYLplpMqKjog5bmz5Z2HMTXliIbku6XlhoVcbi0gKirohIblvLHmgKfkv67mraPmmYLplpMqKjogQ3JpdGljYWwgMjTmmYLplpPku6XlhoXjgIFIaWdoIDfml6Xku6XlhoVcbi0gKirjgrvjgq3jg6Xjg6rjg4bjgqPnm6Pmn7vlkIjmoLznjocqKjogOTUl5Lul5LiKXG4tICoq5LiN5q2j44Ki44Kv44K744K55qSc55+l546HKio6IDk5JeS7peS4ilxuLSAqKuODh+ODvOOCv+a8j+a0qeS7tuaVsCoqOiAw5Lu2XG5cbiMjIyDjgrvjgq3jg6Xjg6rjg4bjgqPmiJDnhp/luqboqZXkvqFcblxcYFxcYFxcYGJhc2hcbiMg44K744Kt44Ol44Oq44OG44Kj5oiQ54af5bqm44OB44Kn44OD44Kv44Oq44K544OIXG5lY2hvIFwi8J+UjSDjgrvjgq3jg6Xjg6rjg4bjgqPmiJDnhp/luqboqZXkvqEuLi5cIlxuXG4jIExldmVsIDE6IOWfuuacrOeahOOBquOCu+OCreODpeODquODhuOCo+WvvuetllxuZWNobyBcIkxldmVsIDEg44OB44Kn44OD44KvOlwiXG5lY2hvIFwiLSBbIF0gV0FG6Kit5a6a5riI44G/XCJcbmVjaG8gXCItIFsgXSBDbG91ZFRyYWls5pyJ5Yq55YyWXCJcbmVjaG8gXCItIFsgXSDmmpflj7fljJboqK3lrprmuIjjgb9cIlxuXG4jIExldmVsIDI6IOmrmOW6puOBquOCu+OCreODpeODquODhuOCo+WvvuetllxuZWNobyBcIkxldmVsIDIg44OB44Kn44OD44KvOlwiXG5lY2hvIFwiLSBbIF0gR3VhcmREdXR55pyJ5Yq55YyWXCJcbmVjaG8gXCItIFsgXSBDb25maWcgUnVsZXPoqK3lrppcIlxuZWNobyBcIi0gWyBdIOOCu+OCreODpeODquODhuOCo+ebo+imluiHquWLleWMllwiXG5cbiMgTGV2ZWwgMzog5pyA6auY44Os44OZ44Or44Gu44K744Kt44Ol44Oq44OG44KjXG5lY2hvIFwiTGV2ZWwgMyDjg4Hjgqfjg4Pjgq86XCJcbmVjaG8gXCItIFsgXSDjgrzjg63jg4jjg6njgrnjg4jlrp/oo4VcIlxuZWNobyBcIi0gWyBdIEFJL01M6ISF5aiB5qSc55+lXCJcbmVjaG8gXCItIFsgXSDntpnntprnmoTjgrvjgq3jg6Xjg6rjg4bjgqPnm6Pmn7tcIlxuXFxgXFxgXFxgXG5cbi0tLVxuXG4qKuOCu+OCreODpeODquODhuOCo+mBi+eUqOOBrumHjeimgeODneOCpOODs+ODiCoqOlxuMS4g44K744Kt44Ol44Oq44OG44Kj44Gv57aZ57aa55qE44Gq44OX44Ot44K744K544Gn44GZXG4yLiDlrprmnJ/nmoTjgaroqJPnt7TjgajmlZnogrLjgYzph43opoHjgafjgZlcbjMuIOOCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOioiOeUu+OBr+Wumuacn+eahOOBq+abtOaWsOOBl+OBpuOBj+OBoOOBleOBhFxuNC4g44K744Kt44Ol44Oq44OG44Kj44Oh44OI44Oq44Kv44K544KS57aZ57aa55qE44Gr55uj6KaW44GX44Gm44GP44Gg44GV44GEXG5gO1xufVxuLyoqXG4gICAqIOODkeODleOCqeODvOODnuODs+OCueacgOmBqeWMluOCrOOCpOODieOBrueUn+aIkFxuICAgKi9cbmdlbmVyYXRlUGVyZm9ybWFuY2VPcHRpbWl6YXRpb25HdWlkZSgpOiBzdHJpbmcge1xuICByZXR1cm4gYCMgJHt0aGlzLnN5c3RlbU5hbWV9IC0g44OR44OV44Kp44O844Oe44Oz44K55pyA6YGp5YyW44Ks44Kk44OJXG5cbioq44OQ44O844K444On44OzKio6ICR7dGhpcy52ZXJzaW9ufSAgXG4qKuacgOe1guabtOaWsCoqOiAke3RoaXMubGFzdFVwZGF0ZWR9XG5cbiMjIPCfmoAg44OR44OV44Kp44O844Oe44Oz44K55pyA6YGp5YyW5oim55WlXG5cbiMjIyDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnnm67mqJlcbi0gKirlv5znrZTmmYLplpMqKjogOTUl44Gu44Oq44Kv44Ko44K544OI44GMMuenkuS7peWGhVxuLSAqKuOCueODq+ODvOODl+ODg+ODiCoqOiAxMDAwIHJlcS9zZWPku6XkuIpcbi0gKirlj6/nlKjmgKcqKjogOTkuOSXku6XkuIpcbi0gKirjgqjjg6njg7znjocqKjogMSXmnKrmuoBcblxuIyMjIOacgOmBqeWMluOBruWEquWFiOmghuS9jVxuMS4gKirjg6bjg7zjgrbjg7zkvZPpqJPjgavnm7TntZDjgZnjgovmqZ/og70qKjog44OB44Oj44OD44OI5b+c562U44CB5qSc57Si5qmf6IO9XG4yLiAqKuODnOODiOODq+ODjeODg+OCr+OBqOOBquOCiuOChOOBmeOBhOeuh+aJgCoqOiDjg4fjg7zjgr/jg5njg7zjgrnjgqLjgq/jgrvjgrnjgIFBSeWHpueQhlxuMy4gKirjgrPjgrnjg4jlirnnjocqKjog44Oq44K944O844K55L2/55So6YeP44Go44OR44OV44Kp44O844Oe44Oz44K544Gu44OQ44Op44Oz44K5XG40LiAqKuOCueOCseODvOODqeODk+ODquODhuOCoyoqOiDosqDojbflopfliqDjgbjjga7lr77lv5zog73liptcblxuIyMg8J+TiiDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnnm6Poppbjg7vliIbmnpBcblxuIyMjIOS4u+imgeODkeODleOCqeODvOODnuODs+OCueODoeODiOODquOCr+OCuVxuXG4jIyMjIExhbWJkYemWouaVsOODkeODleOCqeODvOODnuODs+OCuVxuXFxgXFxgXFxgYmFzaFxuIyBMYW1iZGHplqLmlbDjga7oqbPntLDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnliIbmnpBcbmF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9MYW1iZGEgXFxcXFxuICAtLW1ldHJpYy1uYW1lIER1cmF0aW9uIFxcXFxcbiAgLS1kaW1lbnNpb25zIE5hbWU9RnVuY3Rpb25OYW1lLFZhbHVlPXJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtdSAtZCAnMjQgaG91cnMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgLXUgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tcGVyaW9kIDMwMCBcXFxcXG4gIC0tc3RhdGlzdGljcyBBdmVyYWdlLE1heGltdW0sTWluaW11bVxuXG4jIOODoeODouODquS9v+eUqOeOh+WIhuaekFxuYXdzIGxvZ3Mgc3RhcnQtcXVlcnkgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIC9hd3MvbGFtYmRhL3JhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMjQgaG91cnMgYWdvJyArJXMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgKyVzKSBcXFxcXG4gIC0tcXVlcnktc3RyaW5nICdcbiAgICBmaWVsZHMgQHRpbWVzdGFtcCwgQG1heE1lbW9yeVVzZWQsIEBtZW1vcnlTaXplLCBAZHVyYXRpb25cbiAgICB8IGZpbHRlciBAdHlwZSA9IFwiUkVQT1JUXCJcbiAgICB8IHN0YXRzIGF2ZyhAbWF4TWVtb3J5VXNlZC9AbWVtb3J5U2l6ZSoxMDApIGFzIE1lbW9yeVV0aWxpemF0aW9uLCBcbiAgICAgICAgICAgIGF2ZyhAZHVyYXRpb24pIGFzIEF2Z0R1cmF0aW9uLFxuICAgICAgICAgICAgbWF4KEBkdXJhdGlvbikgYXMgTWF4RHVyYXRpb25cbiAgICBieSBiaW4oMWgpXG4gICdcblxuIyDjgrPjg7zjg6vjg4njgrnjgr/jg7zjg4jliIbmnpBcbmF3cyBsb2dzIHN0YXJ0LXF1ZXJ5IFxcXFxcbiAgLS1sb2ctZ3JvdXAtbmFtZSAvYXdzL2xhbWJkYS9yYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLWQgJzI0IGhvdXJzIGFnbycgKyVzKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlICslcykgXFxcXFxuICAtLXF1ZXJ5LXN0cmluZyAnXG4gICAgZmllbGRzIEB0aW1lc3RhbXAsIEBkdXJhdGlvbiwgQGluaXREdXJhdGlvblxuICAgIHwgZmlsdGVyIEB0eXBlID0gXCJSRVBPUlRcIiBhbmQgaXNwcmVzZW50KEBpbml0RHVyYXRpb24pXG4gICAgfCBzdGF0cyBjb3VudCgpIGFzIENvbGRTdGFydHMsIGF2ZyhAaW5pdER1cmF0aW9uKSBhcyBBdmdJbml0RHVyYXRpb25cbiAgICBieSBiaW4oMWgpXG4gICdcblxcYFxcYFxcYFxuXG4jIyMjIER5bmFtb0RCIOODkeODleOCqeODvOODnuODs+OCuVxuXFxgXFxgXFxgYmFzaFxuIyBEeW5hbW9EQuODrOOCueODneODs+OCueaZgumWk+WIhuaekFxuYXdzIGNsb3Vkd2F0Y2ggZ2V0LW1ldHJpYy1zdGF0aXN0aWNzIFxcXFxcbiAgLS1uYW1lc3BhY2UgQVdTL0R5bmFtb0RCIFxcXFxcbiAgLS1tZXRyaWMtbmFtZSBTdWNjZXNzZnVsUmVxdWVzdExhdGVuY3kgXFxcXFxuICAtLWRpbWVuc2lvbnMgTmFtZT1UYWJsZU5hbWUsVmFsdWU9cmFnLXN5c3RlbS1zZXNzaW9ucyBOYW1lPU9wZXJhdGlvbixWYWx1ZT1HZXRJdGVtIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtdSAtZCAnMjQgaG91cnMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgLXUgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tcGVyaW9kIDMwMCBcXFxcXG4gIC0tc3RhdGlzdGljcyBBdmVyYWdlLE1heGltdW1cblxuIyDjgrnjg63jg4Pjg4jjg6rjg7PjgrDliIbmnpBcbmF3cyBjbG91ZHdhdGNoIGdldC1tZXRyaWMtc3RhdGlzdGljcyBcXFxcXG4gIC0tbmFtZXNwYWNlIEFXUy9EeW5hbW9EQiBcXFxcXG4gIC0tbWV0cmljLW5hbWUgVGhyb3R0bGVkUmVxdWVzdHMgXFxcXFxuICAtLWRpbWVuc2lvbnMgTmFtZT1UYWJsZU5hbWUsVmFsdWU9cmFnLXN5c3RlbS1zZXNzaW9ucyBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLXUgLWQgJzI0IGhvdXJzIGFnbycgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlIC11ICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAtLXBlcmlvZCAzMDAgXFxcXFxuICAtLXN0YXRpc3RpY3MgU3VtXG5cbiMg44Ob44OD44OI44OR44O844OG44Kj44K344On44Oz5qSc55+lXG5hd3MgZHluYW1vZGIgZGVzY3JpYmUtdGFibGUgLS10YWJsZS1uYW1lIHJhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXF1ZXJ5ICdUYWJsZS57UGFydGl0aW9uS2V5OktleVNjaGVtYVswXS5BdHRyaWJ1dGVOYW1lLEdTSTpHbG9iYWxTZWNvbmRhcnlJbmRleGVzWypdLktleVNjaGVtYX0nXG5cXGBcXGBcXGBcblxuIyMjIyBPcGVuU2VhcmNoIOODkeODleOCqeODvOODnuODs+OCuVxuXFxgXFxgXFxgYmFzaFxuIyBPcGVuU2VhcmNo5qSc57Si44OR44OV44Kp44O844Oe44Oz44K55YiG5p6QXG5jdXJsIC1YIEdFVCBcImh0dHBzOi8veW91ci1vcGVuc2VhcmNoLWVuZHBvaW50L19ub2Rlcy9zdGF0cy9pbmRpY2VzL3NlYXJjaFwiIHwganEgJy5ub2Rlc1tdLmluZGljZXMuc2VhcmNoJ1xuXG4jIOOCpOODs+ODh+ODg+OCr+OCueacgOmBqeWMlueKtuazgeeiuuiqjVxuY3VybCAtWCBHRVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC9fY2F0L2luZGljZXM/diZzPXN0b3JlLnNpemU6ZGVzY1wiXG5cbiMg44Kv44Ko44Oq44OR44OV44Kp44O844Oe44Oz44K55YiG5p6QXG5jdXJsIC1YIEdFVCBcImh0dHBzOi8veW91ci1vcGVuc2VhcmNoLWVuZHBvaW50L19jYXQvdGhyZWFkX3Bvb2wvc2VhcmNoP3YmaD1ub2RlX25hbWUsYWN0aXZlLHF1ZXVlLHJlamVjdGVkLGNvbXBsZXRlZFwiXG5cbiMg6YGF44GE44Kv44Ko44Oq44Gu54m55a6aXG5jdXJsIC1YIEdFVCBcImh0dHBzOi8veW91ci1vcGVuc2VhcmNoLWVuZHBvaW50L19jbHVzdGVyL3NldHRpbmdzXCIgXFxcXFxuICAtSCBcIkNvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvblwiIFxcXFxcbiAgLWQgJ3tcbiAgICBcInBlcnNpc3RlbnRcIjoge1xuICAgICAgXCJpbmRleC5zZWFyY2guc2xvd2xvZy50aHJlc2hvbGQucXVlcnkud2FyblwiOiBcIjJzXCIsXG4gICAgICBcImluZGV4LnNlYXJjaC5zbG93bG9nLnRocmVzaG9sZC5xdWVyeS5pbmZvXCI6IFwiMXNcIlxuICAgIH1cbiAgfSdcblxcYFxcYFxcYFxuXG4jIyDimqEgTGFtYmRh6Zai5pWw5pyA6YGp5YyWXG5cbiMjIyDjg6Hjg6Ljg6rjg7vjgr/jgqTjg6DjgqLjgqbjg4jmnIDpganljJZcblxcYFxcYFxcYGJhc2hcbiMhL2Jpbi9iYXNoXG4jIExhbWJkYemWouaVsOacgOmBqeWMluOCueOCr+ODquODl+ODiFxuXG5GVU5DVElPTl9OQU1FPVwicmFnLXN5c3RlbS1jaGF0LWhhbmRsZXJcIlxuXG5lY2hvIFwi8J+UpyBMYW1iZGHplqLmlbDmnIDpganljJbplovlp4s6ICRGVU5DVElPTl9OQU1FXCJcblxuIyDnj77lnKjjga7oqK3lrprnorroqo1cbmF3cyBsYW1iZGEgZ2V0LWZ1bmN0aW9uLWNvbmZpZ3VyYXRpb24gLS1mdW5jdGlvbi1uYW1lICRGVU5DVElPTl9OQU1FIFxcXFxcbiAgLS1xdWVyeSAne01lbW9yeVNpemU6TWVtb3J5U2l6ZSxUaW1lb3V0OlRpbWVvdXQsUnVudGltZTpSdW50aW1lfSdcblxuIyDjg6Hjg6Ljg6rkvb/nlKjnjofliIbmnpBcbk1FTU9SWV9TVEFUUz0kKGF3cyBsb2dzIHN0YXJ0LXF1ZXJ5IFxcXFxcbiAgLS1sb2ctZ3JvdXAtbmFtZSAvYXdzL2xhbWJkYS8kRlVOQ1RJT05fTkFNRSBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLWQgJzcgZGF5cyBhZ28nICslcykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSArJXMpIFxcXFxcbiAgLS1xdWVyeS1zdHJpbmcgJ1xuICAgIGZpZWxkcyBAbWF4TWVtb3J5VXNlZCwgQG1lbW9yeVNpemUsIEBkdXJhdGlvblxuICAgIHwgZmlsdGVyIEB0eXBlID0gXCJSRVBPUlRcIlxuICAgIHwgc3RhdHMgYXZnKEBtYXhNZW1vcnlVc2VkKSBhcyBBdmdNZW1vcnlVc2VkLFxuICAgICAgICAgICAgbWF4KEBtYXhNZW1vcnlVc2VkKSBhcyBNYXhNZW1vcnlVc2VkLFxuICAgICAgICAgICAgYXZnKEBtZW1vcnlTaXplKSBhcyBDb25maWd1cmVkTWVtb3J5LFxuICAgICAgICAgICAgYXZnKEBkdXJhdGlvbikgYXMgQXZnRHVyYXRpb25cbiAgJylcblxuZWNobyBcIuODoeODouODquS9v+eUqOe1seioiDogJE1FTU9SWV9TVEFUU1wiXG5cbiMg5pyA6YGp44Gq44Oh44Oi44Oq44K144Kk44K66KiI566X77yI5L2/55So6YeP44GuMS4y5YCN44KS5o6o5aWo77yJXG5PUFRJTUFMX01FTU9SWT0kKGVjaG8gXCIkTUVNT1JZX1NUQVRTXCIgfCBqcSAtciAnLnJlc3VsdHNbMF0uTWF4TWVtb3J5VXNlZCAqIDEuMiB8IGNlaWwnKVxuXG4jIOODoeODouODquOCteOCpOOCuuabtOaWsO+8iDEyOE1C5Y2Y5L2N44Gn6Kq/5pW077yJXG5BREpVU1RFRF9NRU1PUlk9JCgoIChPUFRJTUFMX01FTU9SWSArIDEyNykgLyAxMjggKiAxMjggKSlcblxuaWYgWyAkQURKVVNURURfTUVNT1JZIC1uZSAkKGF3cyBsYW1iZGEgZ2V0LWZ1bmN0aW9uLWNvbmZpZ3VyYXRpb24gLS1mdW5jdGlvbi1uYW1lICRGVU5DVElPTl9OQU1FIC0tcXVlcnkgJ01lbW9yeVNpemUnKSBdOyB0aGVuXG4gIGVjaG8gXCLjg6Hjg6Ljg6rjgrXjgqTjgrrjgpIgJHtBREpVU1RFRF9NRU1PUll9TUIg44Gr5pu05paw5LitLi4uXCJcbiAgYXdzIGxhbWJkYSB1cGRhdGUtZnVuY3Rpb24tY29uZmlndXJhdGlvbiBcXFxcXG4gICAgLS1mdW5jdGlvbi1uYW1lICRGVU5DVElPTl9OQU1FIFxcXFxcbiAgICAtLW1lbW9yeS1zaXplICRBREpVU1RFRF9NRU1PUllcbmZpXG5cbmVjaG8gXCLinIUgTGFtYmRh6Zai5pWw5pyA6YGp5YyW5a6M5LqGXCJcblxcYFxcYFxcYFxuXG4jIyMg44OX44Ot44OT44K444On44OL44Oz44Kw5riI44G/5ZCM5pmC5a6f6KGM6Kit5a6aXG5cXGBcXGBcXGBiYXNoXG4jIOOCs+ODvOODq+ODieOCueOCv+ODvOODiOWJiua4m+OBruOBn+OCgeOBruODl+ODreODk+OCuOODp+ODi+ODs+OCsOioreWumlxuYXdzIGxhbWJkYSBwdXQtcHJvdmlzaW9uZWQtY29uY3VycmVuY3ktY29uZmlnIFxcXFxcbiAgLS1mdW5jdGlvbi1uYW1lIHJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1xdWFsaWZpZXIgXFwkTEFURVNUIFxcXFxcbiAgLS1wcm92aXNpb25lZC1jb25jdXJyZW5jeS11bml0cyAxMFxuXG4jIOS9v+eUqOeKtuazgeebo+imllxuYXdzIGNsb3Vkd2F0Y2ggZ2V0LW1ldHJpYy1zdGF0aXN0aWNzIFxcXFxcbiAgLS1uYW1lc3BhY2UgQVdTL0xhbWJkYSBcXFxcXG4gIC0tbWV0cmljLW5hbWUgUHJvdmlzaW9uZWRDb25jdXJyZW5jeVV0aWxpemF0aW9uIFxcXFxcbiAgLS1kaW1lbnNpb25zIE5hbWU9RnVuY3Rpb25OYW1lLFZhbHVlPXJhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtdSAtZCAnMjQgaG91cnMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgLXUgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tcGVyaW9kIDMwMCBcXFxcXG4gIC0tc3RhdGlzdGljcyBBdmVyYWdlLE1heGltdW1cblxcYFxcYFxcYFxuXG4jIyMgTGFtYmRhIExheWVy5rS755SoXG5cXGBcXGBcXGBiYXNoXG4jIOWFsemAmuODqeOCpOODluODqeODquOBrkxheWVy5YyWXG56aXAgLXIgY29tbW9uLWxpYnJhcmllcy56aXAgcHl0aG9uL1xuYXdzIGxhbWJkYSBwdWJsaXNoLWxheWVyLXZlcnNpb24gXFxcXFxuICAtLWxheWVyLW5hbWUgcmFnLXN5c3RlbS1jb21tb24tbGlicyBcXFxcXG4gIC0tZGVzY3JpcHRpb24gXCJDb21tb24gbGlicmFyaWVzIGZvciBSQUcgc3lzdGVtXCIgXFxcXFxuICAtLXppcC1maWxlIGZpbGViOi8vY29tbW9uLWxpYnJhcmllcy56aXAgXFxcXFxuICAtLWNvbXBhdGlibGUtcnVudGltZXMgcHl0aG9uMy45XG5cbiMg6Zai5pWw44GrTGF5ZXLpgannlKhcbmF3cyBsYW1iZGEgdXBkYXRlLWZ1bmN0aW9uLWNvbmZpZ3VyYXRpb24gXFxcXFxuICAtLWZ1bmN0aW9uLW5hbWUgcmFnLXN5c3RlbS1jaGF0LWhhbmRsZXIgXFxcXFxuICAtLWxheWVycyBhcm46YXdzOmxhbWJkYTphcC1ub3J0aGVhc3QtMToxMjM0NTY3ODkwMTI6bGF5ZXI6cmFnLXN5c3RlbS1jb21tb24tbGliczoxXG5cXGBcXGBcXGBcblxuIyMg8J+XhO+4jyBEeW5hbW9EQuacgOmBqeWMllxuXG4jIyMg44Kt44Oj44OR44K344OG44Kj5pyA6YGp5YyWXG5cXGBcXGBcXGBiYXNoXG4jIOiHquWLleOCueOCseODvOODquODs+OCsOioreWumlxuYXdzIGFwcGxpY2F0aW9uLWF1dG9zY2FsaW5nIHJlZ2lzdGVyLXNjYWxhYmxlLXRhcmdldCBcXFxcXG4gIC0tc2VydmljZS1uYW1lc3BhY2UgZHluYW1vZGIgXFxcXFxuICAtLXJlc291cmNlLWlkIHRhYmxlL3JhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXNjYWxhYmxlLWRpbWVuc2lvbiBkeW5hbW9kYjp0YWJsZTpSZWFkQ2FwYWNpdHlVbml0cyBcXFxcXG4gIC0tbWluLWNhcGFjaXR5IDUgXFxcXFxuICAtLW1heC1jYXBhY2l0eSAxMDBcblxuYXdzIGFwcGxpY2F0aW9uLWF1dG9zY2FsaW5nIHB1dC1zY2FsaW5nLXBvbGljeSBcXFxcXG4gIC0tc2VydmljZS1uYW1lc3BhY2UgZHluYW1vZGIgXFxcXFxuICAtLXJlc291cmNlLWlkIHRhYmxlL3JhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXNjYWxhYmxlLWRpbWVuc2lvbiBkeW5hbW9kYjp0YWJsZTpSZWFkQ2FwYWNpdHlVbml0cyBcXFxcXG4gIC0tcG9saWN5LW5hbWUgcmFnLXN5c3RlbS1zZXNzaW9ucy1yZWFkLXNjYWxpbmctcG9saWN5IFxcXFxcbiAgLS1wb2xpY3ktdHlwZSBUYXJnZXRUcmFja2luZ1NjYWxpbmcgXFxcXFxuICAtLXRhcmdldC10cmFja2luZy1zY2FsaW5nLXBvbGljeS1jb25maWd1cmF0aW9uICd7XG4gICAgXCJUYXJnZXRWYWx1ZVwiOiA3MC4wLFxuICAgIFwiU2NhbGVJbkNvb2xkb3duXCI6IDYwLFxuICAgIFwiU2NhbGVPdXRDb29sZG93blwiOiA2MCxcbiAgICBcIlByZWRlZmluZWRNZXRyaWNTcGVjaWZpY2F0aW9uXCI6IHtcbiAgICAgIFwiUHJlZGVmaW5lZE1ldHJpY1R5cGVcIjogXCJEeW5hbW9EQlJlYWRDYXBhY2l0eVV0aWxpemF0aW9uXCJcbiAgICB9XG4gIH0nXG5cbiMg44OR44O844OG44Kj44K344On44Oz5YiG5pWj56K66KqNXG5hd3MgZHluYW1vZGIgZGVzY3JpYmUtdGFibGUgLS10YWJsZS1uYW1lIHJhZy1zeXN0ZW0tc2Vzc2lvbnMgXFxcXFxuICAtLXF1ZXJ5ICdUYWJsZS57SXRlbUNvdW50Okl0ZW1Db3VudCxUYWJsZVNpemVCeXRlczpUYWJsZVNpemVCeXRlcyxQYXJ0aXRpb25LZXk6S2V5U2NoZW1hWzBdfSdcblxcYFxcYFxcYFxuXG4jIyMg44Kk44Oz44OH44OD44Kv44K55pyA6YGp5YyWXG5cXGBcXGBcXGBiYXNoXG4jIEdTSeS9v+eUqOeKtuazgeWIhuaekFxuYXdzIGNsb3Vkd2F0Y2ggZ2V0LW1ldHJpYy1zdGF0aXN0aWNzIFxcXFxcbiAgLS1uYW1lc3BhY2UgQVdTL0R5bmFtb0RCIFxcXFxcbiAgLS1tZXRyaWMtbmFtZSBDb25zdW1lZFJlYWRDYXBhY2l0eVVuaXRzIFxcXFxcbiAgLS1kaW1lbnNpb25zIE5hbWU9VGFibGVOYW1lLFZhbHVlPXJhZy1zeXN0ZW0tc2Vzc2lvbnMgTmFtZT1HbG9iYWxTZWNvbmRhcnlJbmRleE5hbWUsVmFsdWU9dXNlci1pbmRleCBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLXUgLWQgJzI0IGhvdXJzIGFnbycgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tZW5kLXRpbWUgJChkYXRlIC11ICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAtLXBlcmlvZCAzNjAwIFxcXFxcbiAgLS1zdGF0aXN0aWNzIFN1bVxuXG4jIOacquS9v+eUqOOCpOODs+ODh+ODg+OCr+OCueOBrueJueWumlxuYXdzIGxvZ3Mgc3RhcnQtcXVlcnkgXFxcXFxuICAtLWxvZy1ncm91cC1uYW1lIC9hd3MvbGFtYmRhL3JhZy1zeXN0ZW0tY2hhdC1oYW5kbGVyIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtZCAnMzAgZGF5cyBhZ28nICslcykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSArJXMpIFxcXFxcbiAgLS1xdWVyeS1zdHJpbmcgJ1xuICAgIGZpZWxkcyBAbWVzc2FnZVxuICAgIHwgZmlsdGVyIEBtZXNzYWdlIGxpa2UgL0R5bmFtb0RCLipRdWVyeS4qSW5kZXhOYW1lL1xuICAgIHwgcGFyc2UgQG1lc3NhZ2UgXCJJbmRleE5hbWU6ICpcIiBhcyBJbmRleE5hbWVcbiAgICB8IHN0YXRzIGNvdW50KCkgYnkgSW5kZXhOYW1lXG4gICAgfCBzb3J0IGNvdW50IGRlc2NcbiAgJ1xuXFxgXFxgXFxgXG5cbiMjIyBEeW5hbW9EQiBBY2NlbGVyYXRvciAoREFYKSDlsI7lhaVcblxcYFxcYFxcYGJhc2hcbiMgREFY44Kv44Op44K544K/44O85L2c5oiQXG5hd3MgZGF4IGNyZWF0ZS1jbHVzdGVyIFxcXFxcbiAgLS1jbHVzdGVyLW5hbWUgcmFnLXN5c3RlbS1kYXggXFxcXFxuICAtLW5vZGUtdHlwZSBkYXgucjQubGFyZ2UgXFxcXFxuICAtLXJlcGxpY2F0aW9uLWZhY3RvciAzIFxcXFxcbiAgLS1pYW0tcm9sZS1hcm4gYXJuOmF3czppYW06OjEyMzQ1Njc4OTAxMjpyb2xlL0RBWFNlcnZpY2VSb2xlIFxcXFxcbiAgLS1zdWJuZXQtZ3JvdXAtbmFtZSByYWctc3lzdGVtLWRheC1zdWJuZXQtZ3JvdXAgXFxcXFxuICAtLXNlY3VyaXR5LWdyb3VwLWlkcyBzZy0xMjM0NTY3OFxuXG4jIERBWOS9v+eUqOmHj+ebo+imllxuYXdzIGNsb3Vkd2F0Y2ggZ2V0LW1ldHJpYy1zdGF0aXN0aWNzIFxcXFxcbiAgLS1uYW1lc3BhY2UgQVdTL0RBWCBcXFxcXG4gIC0tbWV0cmljLW5hbWUgQ2FjaGVIaXRSYXRlIFxcXFxcbiAgLS1kaW1lbnNpb25zIE5hbWU9Q2x1c3Rlck5hbWUsVmFsdWU9cmFnLXN5c3RlbS1kYXggXFxcXFxuICAtLXN0YXJ0LXRpbWUgJChkYXRlIC11IC1kICcyNCBob3VycyBhZ28nICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSAtdSArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1wZXJpb2QgMzAwIFxcXFxcbiAgLS1zdGF0aXN0aWNzIEF2ZXJhZ2VcblxcYFxcYFxcYFxuXG4jIyDwn5SNIE9wZW5TZWFyY2jmnIDpganljJZcblxuIyMjIOOCpOODs+ODh+ODg+OCr+OCueacgOmBqeWMllxuXFxgXFxgXFxgYmFzaFxuIyDjgqTjg7Pjg4fjg4Pjgq/jgrnjg4bjg7Pjg5fjg6zjg7zjg4jmnIDpganljJZcbmN1cmwgLVggUFVUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvX2luZGV4X3RlbXBsYXRlL3JhZy1kb2N1bWVudHMtb3B0aW1pemVkXCIgXFxcXFxuICAtSCBcIkNvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvblwiIFxcXFxcbiAgLWQgJ3tcbiAgICBcImluZGV4X3BhdHRlcm5zXCI6IFtcImRvY3VtZW50cy0qXCJdLFxuICAgIFwidGVtcGxhdGVcIjoge1xuICAgICAgXCJzZXR0aW5nc1wiOiB7XG4gICAgICAgIFwibnVtYmVyX29mX3NoYXJkc1wiOiAzLFxuICAgICAgICBcIm51bWJlcl9vZl9yZXBsaWNhc1wiOiAxLFxuICAgICAgICBcInJlZnJlc2hfaW50ZXJ2YWxcIjogXCIzMHNcIixcbiAgICAgICAgXCJpbmRleC5jb2RlY1wiOiBcImJlc3RfY29tcHJlc3Npb25cIlxuICAgICAgfSxcbiAgICAgIFwibWFwcGluZ3NcIjoge1xuICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgIFwiY29udGVudFwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXG4gICAgICAgICAgICBcImFuYWx5emVyXCI6IFwiamFwYW5lc2VcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJlbWJlZGRpbmdcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZGVuc2VfdmVjdG9yXCIsXG4gICAgICAgICAgICBcImRpbXNcIjogMTUzNixcbiAgICAgICAgICAgIFwiaW5kZXhcIjogdHJ1ZSxcbiAgICAgICAgICAgIFwic2ltaWxhcml0eVwiOiBcImNvc2luZVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInRpbWVzdGFtcFwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJkYXRlXCIsXG4gICAgICAgICAgICBcImZvcm1hdFwiOiBcInN0cmljdF9kYXRlX29wdGlvbmFsX3RpbWV8fGVwb2NoX21pbGxpc1wiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9J1xuXG4jIOOCpOODs+ODh+ODg+OCr+OCueacgOmBqeWMluWun+ihjFxuY3VybCAtWCBQT1NUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvZG9jdW1lbnRzL19mb3JjZW1lcmdlP21heF9udW1fc2VnbWVudHM9MVwiXG5cbiMg5qSc57Si44OR44OV44Kp44O844Oe44Oz44K55YiG5p6QXG5jdXJsIC1YIEdFVCBcImh0dHBzOi8veW91ci1vcGVuc2VhcmNoLWVuZHBvaW50L2RvY3VtZW50cy9fc2VhcmNoXCIgXFxcXFxuICAtSCBcIkNvbnRlbnQtVHlwZTogYXBwbGljYXRpb24vanNvblwiIFxcXFxcbiAgLWQgJ3tcbiAgICBcInByb2ZpbGVcIjogdHJ1ZSxcbiAgICBcInF1ZXJ5XCI6IHtcbiAgICAgIFwibWF0Y2hcIjoge1xuICAgICAgICBcImNvbnRlbnRcIjogXCLjgrXjg7Pjg5fjg6vjgq/jgqjjg6pcIlxuICAgICAgfVxuICAgIH1cbiAgfScgfCBqcSAnLnByb2ZpbGUnXG5cXGBcXGBcXGBcblxuIyMjIOOCr+OCqOODquacgOmBqeWMllxuXFxgXFxgXFxgYmFzaFxuIyDpgYXjgYTjgq/jgqjjg6rjga7nibnlrprjg7vmnIDpganljJZcbmN1cmwgLVggR0VUIFwiaHR0cHM6Ly95b3VyLW9wZW5zZWFyY2gtZW5kcG9pbnQvX2NhdC9pbmRpY2VzP3Ymcz1zZWFyY2gucXVlcnlfdGltZV9pbl9taWxsaXM6ZGVzY1wiXG5cbiMg44Kt44Oj44OD44K344Ol5L2/55So546H56K66KqNXG5jdXJsIC1YIEdFVCBcImh0dHBzOi8veW91ci1vcGVuc2VhcmNoLWVuZHBvaW50L19ub2Rlcy9zdGF0cy9pbmRpY2VzL3F1ZXJ5X2NhY2hlLHJlcXVlc3RfY2FjaGVcIlxuXG4jIOacgOmBqeWMluOBleOCjOOBn+OCr+OCqOODquS+i1xuY3VybCAtWCBHRVQgXCJodHRwczovL3lvdXItb3BlbnNlYXJjaC1lbmRwb2ludC9kb2N1bWVudHMvX3NlYXJjaFwiIFxcXFxcbiAgLUggXCJDb250ZW50LVR5cGU6IGFwcGxpY2F0aW9uL2pzb25cIiBcXFxcXG4gIC1kICd7XG4gICAgXCJzaXplXCI6IDEwLFxuICAgIFwicXVlcnlcIjoge1xuICAgICAgXCJib29sXCI6IHtcbiAgICAgICAgXCJtdXN0XCI6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIm1hdGNoXCI6IHtcbiAgICAgICAgICAgICAgXCJjb250ZW50XCI6IHtcbiAgICAgICAgICAgICAgICBcInF1ZXJ5XCI6IFwi5qSc57Si44Kt44O844Ov44O844OJXCIsXG4gICAgICAgICAgICAgICAgXCJvcGVyYXRvclwiOiBcImFuZFwiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIFwiZmlsdGVyXCI6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcInJhbmdlXCI6IHtcbiAgICAgICAgICAgICAgXCJ0aW1lc3RhbXBcIjoge1xuICAgICAgICAgICAgICAgIFwiZ3RlXCI6IFwibm93LTMwZFwiXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9LFxuICAgIFwiX3NvdXJjZVwiOiBbXCJ0aXRsZVwiLCBcInN1bW1hcnlcIiwgXCJ0aW1lc3RhbXBcIl0sXG4gICAgXCJoaWdobGlnaHRcIjoge1xuICAgICAgXCJmaWVsZHNcIjoge1xuICAgICAgICBcImNvbnRlbnRcIjoge1xuICAgICAgICAgIFwiZnJhZ21lbnRfc2l6ZVwiOiAxNTAsXG4gICAgICAgICAgXCJudW1iZXJfb2ZfZnJhZ21lbnRzXCI6IDNcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSdcblxcYFxcYFxcYFxuXG4jIyDwn4yQIOODjeODg+ODiOODr+ODvOOCr+ODu0NETuacgOmBqeWMllxuXG4jIyMgQ2xvdWRGcm9udOacgOmBqeWMllxuXFxgXFxgXFxgYmFzaFxuIyBDbG91ZEZyb2506Kit5a6a5pyA6YGp5YyWXG5hd3MgY2xvdWRmcm9udCB1cGRhdGUtZGlzdHJpYnV0aW9uIFxcXFxcbiAgLS1pZCBFMTIzNDU2Nzg5MDEyMyBcXFxcXG4gIC0tZGlzdHJpYnV0aW9uLWNvbmZpZyAne1xuICAgIFwiQ2FsbGVyUmVmZXJlbmNlXCI6IFwicmFnLXN5c3RlbS1vcHRpbWl6YXRpb24tJyQoZGF0ZSArJXMpJ1wiLFxuICAgIFwiQ29tbWVudFwiOiBcIk9wdGltaXplZCBkaXN0cmlidXRpb24gZm9yIFJBRyBzeXN0ZW1cIixcbiAgICBcIkRlZmF1bHRDYWNoZUJlaGF2aW9yXCI6IHtcbiAgICAgIFwiVGFyZ2V0T3JpZ2luSWRcIjogXCJyYWctc3lzdGVtLW9yaWdpblwiLFxuICAgICAgXCJWaWV3ZXJQcm90b2NvbFBvbGljeVwiOiBcInJlZGlyZWN0LXRvLWh0dHBzXCIsXG4gICAgICBcIkNhY2hlUG9saWN5SWRcIjogXCI0MTM1ZWEyZC02ZGY4LTQ0YTMtOWRmMy00YjVhODRiZTM5YWRcIixcbiAgICAgIFwiQ29tcHJlc3NcIjogdHJ1ZSxcbiAgICAgIFwiVHJ1c3RlZFNpZ25lcnNcIjoge1xuICAgICAgICBcIkVuYWJsZWRcIjogZmFsc2UsXG4gICAgICAgIFwiUXVhbnRpdHlcIjogMFxuICAgICAgfVxuICAgIH0sXG4gICAgXCJPcmlnaW5zXCI6IHtcbiAgICAgIFwiUXVhbnRpdHlcIjogMSxcbiAgICAgIFwiSXRlbXNcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgXCJJZFwiOiBcInJhZy1zeXN0ZW0tb3JpZ2luXCIsXG4gICAgICAgICAgXCJEb21haW5OYW1lXCI6IFwieW91ci1hbGItZG9tYWluLmVsYi5hbWF6b25hd3MuY29tXCIsXG4gICAgICAgICAgXCJDdXN0b21PcmlnaW5Db25maWdcIjoge1xuICAgICAgICAgICAgXCJIVFRQUG9ydFwiOiA4MCxcbiAgICAgICAgICAgIFwiSFRUUFNQb3J0XCI6IDQ0MyxcbiAgICAgICAgICAgIFwiT3JpZ2luUHJvdG9jb2xQb2xpY3lcIjogXCJodHRwcy1vbmx5XCIsXG4gICAgICAgICAgICBcIk9yaWdpblNzbFByb3RvY29sc1wiOiB7XG4gICAgICAgICAgICAgIFwiUXVhbnRpdHlcIjogMSxcbiAgICAgICAgICAgICAgXCJJdGVtc1wiOiBbXCJUTFN2MS4yXCJdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSxcbiAgICBcIkVuYWJsZWRcIjogdHJ1ZVxuICB9J1xuXG4jIOOCreODo+ODg+OCt+ODpeODkuODg+ODiOeOh+ebo+imllxuYXdzIGNsb3Vkd2F0Y2ggZ2V0LW1ldHJpYy1zdGF0aXN0aWNzIFxcXFxcbiAgLS1uYW1lc3BhY2UgQVdTL0Nsb3VkRnJvbnQgXFxcXFxuICAtLW1ldHJpYy1uYW1lIENhY2hlSGl0UmF0ZSBcXFxcXG4gIC0tZGltZW5zaW9ucyBOYW1lPURpc3RyaWJ1dGlvbklkLFZhbHVlPUUxMjM0NTY3ODkwMTIzIFxcXFxcbiAgLS1zdGFydC10aW1lICQoZGF0ZSAtdSAtZCAnMjQgaG91cnMgYWdvJyArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1lbmQtdGltZSAkKGRhdGUgLXUgKyVZLSVtLSVkVCVIOiVNOiVTKSBcXFxcXG4gIC0tcGVyaW9kIDM2MDAgXFxcXFxuICAtLXN0YXRpc3RpY3MgQXZlcmFnZVxuXFxgXFxgXFxgXG5cbiMjIyBBUEkgR2F0ZXdheeacgOmBqeWMllxuXFxgXFxgXFxgYmFzaFxuIyBBUEkgR2F0ZXdheeOCreODo+ODg+OCt+ODpeioreWumlxuYXdzIGFwaWdhdGV3YXkgcHV0LW1ldGhvZCBcXFxcXG4gIC0tcmVzdC1hcGktaWQgYWJjZGVmMTIzNDU2IFxcXFxcbiAgLS1yZXNvdXJjZS1pZCByZXNvdXJjZTEyMyBcXFxcXG4gIC0taHR0cC1tZXRob2QgR0VUIFxcXFxcbiAgLS1hdXRob3JpemF0aW9uLXR5cGUgTk9ORSBcXFxcXG4gIC0tcmVxdWVzdC1wYXJhbWV0ZXJzIG1ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLnE9ZmFsc2VcblxuYXdzIGFwaWdhdGV3YXkgcHV0LWludGVncmF0aW9uIFxcXFxcbiAgLS1yZXN0LWFwaS1pZCBhYmNkZWYxMjM0NTYgXFxcXFxuICAtLXJlc291cmNlLWlkIHJlc291cmNlMTIzIFxcXFxcbiAgLS1odHRwLW1ldGhvZCBHRVQgXFxcXFxuICAtLXR5cGUgQVdTX1BST1hZIFxcXFxcbiAgLS1pbnRlZ3JhdGlvbi1odHRwLW1ldGhvZCBQT1NUIFxcXFxcbiAgLS11cmkgYXJuOmF3czphcGlnYXRld2F5OmFwLW5vcnRoZWFzdC0xOmxhbWJkYTpwYXRoLzIwMTUtMDMtMzEvZnVuY3Rpb25zL2Fybjphd3M6bGFtYmRhOmFwLW5vcnRoZWFzdC0xOjEyMzQ1Njc4OTAxMjpmdW5jdGlvbjpyYWctc3lzdGVtLWNoYXQtaGFuZGxlci9pbnZvY2F0aW9ucyBcXFxcXG4gIC0tY2FjaGUta2V5LXBhcmFtZXRlcnMgbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcucSBcXFxcXG4gIC0tY2FjaGUtbmFtZXNwYWNlIGNhY2hlLW5hbWVzcGFjZVxuXFxgXFxgXFxgXG5cbiMjIPCfk4gg57aZ57aa55qE44OR44OV44Kp44O844Oe44Oz44K555uj6KaWXG5cbiMjIyDoh6rli5Xjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4hcblxcYFxcYFxcYHB5dGhvblxuIyEvdXNyL2Jpbi9lbnYgcHl0aG9uM1xuIyDoh6rli5Xjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jjgrnjgq/jg6rjg5fjg4hcblxuaW1wb3J0IGJvdG8zXG5pbXBvcnQgcmVxdWVzdHNcbmltcG9ydCB0aW1lXG5pbXBvcnQgc3RhdGlzdGljc1xuZnJvbSBjb25jdXJyZW50LmZ1dHVyZXMgaW1wb3J0IFRocmVhZFBvb2xFeGVjdXRvciwgYXNfY29tcGxldGVkXG5cbmRlZiBwZXJmb3JtYW5jZV90ZXN0KCk6XG4gICAgXCJcIlwi44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI5a6f6KGMXCJcIlwiXG4gICAgXG4gICAgIyDjg4bjgrnjg4joqK3lrppcbiAgICBCQVNFX1VSTCA9IFwiaHR0cHM6Ly95b3VyLWRvbWFpbi5jb21cIlxuICAgIENPTkNVUlJFTlRfVVNFUlMgPSA1MFxuICAgIFRFU1RfRFVSQVRJT04gPSAzMDAgICMgNeWIhumWk1xuICAgIFxuICAgIHJlc3VsdHMgPSB7XG4gICAgICAgICdyZXNwb25zZV90aW1lcyc6IFtdLFxuICAgICAgICAnc3VjY2Vzc19jb3VudCc6IDAsXG4gICAgICAgICdlcnJvcl9jb3VudCc6IDAsXG4gICAgICAgICdzdGFydF90aW1lJzogdGltZS50aW1lKClcbiAgICB9XG4gICAgXG4gICAgZGVmIG1ha2VfcmVxdWVzdCgpOlxuICAgICAgICB0cnk6XG4gICAgICAgICAgICBzdGFydF90aW1lID0gdGltZS50aW1lKClcbiAgICAgICAgICAgIHJlc3BvbnNlID0gcmVxdWVzdHMucG9zdChcbiAgICAgICAgICAgICAgICBmXCJ7QkFTRV9VUkx9L2FwaS9jaGF0XCIsXG4gICAgICAgICAgICAgICAganNvbj17XCJtZXNzYWdlXCI6IFwi44OR44OV44Kp44O844Oe44Oz44K544OG44K544OI44Oh44OD44K744O844K4XCJ9LFxuICAgICAgICAgICAgICAgIGhlYWRlcnM9e1wiQXV0aG9yaXphdGlvblwiOiBcIkJlYXJlciB0ZXN0LXRva2VuXCJ9LFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ9MzBcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIGVuZF90aW1lID0gdGltZS50aW1lKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVzcG9uc2VfdGltZSA9IGVuZF90aW1lIC0gc3RhcnRfdGltZVxuICAgICAgICAgICAgcmVzdWx0c1sncmVzcG9uc2VfdGltZXMnXS5hcHBlbmQocmVzcG9uc2VfdGltZSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcmVzcG9uc2Uuc3RhdHVzX2NvZGUgPT0gMjAwOlxuICAgICAgICAgICAgICAgIHJlc3VsdHNbJ3N1Y2Nlc3NfY291bnQnXSArPSAxXG4gICAgICAgICAgICBlbHNlOlxuICAgICAgICAgICAgICAgIHJlc3VsdHNbJ2Vycm9yX2NvdW50J10gKz0gMVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6XG4gICAgICAgICAgICByZXN1bHRzWydlcnJvcl9jb3VudCddICs9IDFcbiAgICAgICAgICAgIHByaW50KGZcIlJlcXVlc3QgZmFpbGVkOiB7ZX1cIilcbiAgICBcbiAgICAjIOS4puihjOODhuOCueODiOWun+ihjFxuICAgIHdpdGggVGhyZWFkUG9vbEV4ZWN1dG9yKG1heF93b3JrZXJzPUNPTkNVUlJFTlRfVVNFUlMpIGFzIGV4ZWN1dG9yOlxuICAgICAgICBlbmRfdGltZSA9IHRpbWUudGltZSgpICsgVEVTVF9EVVJBVElPTlxuICAgICAgICBcbiAgICAgICAgd2hpbGUgdGltZS50aW1lKCkgPCBlbmRfdGltZTpcbiAgICAgICAgICAgIGZ1dHVyZXMgPSBbXVxuICAgICAgICAgICAgZm9yIF8gaW4gcmFuZ2UoQ09OQ1VSUkVOVF9VU0VSUyk6XG4gICAgICAgICAgICAgICAgZnV0dXJlID0gZXhlY3V0b3Iuc3VibWl0KG1ha2VfcmVxdWVzdClcbiAgICAgICAgICAgICAgICBmdXR1cmVzLmFwcGVuZChmdXR1cmUpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICMg57WQ5p6c5b6F5qmfXG4gICAgICAgICAgICBmb3IgZnV0dXJlIGluIGFzX2NvbXBsZXRlZChmdXR1cmVzKTpcbiAgICAgICAgICAgICAgICBmdXR1cmUucmVzdWx0KClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGltZS5zbGVlcCgxKSAgIyAx56eS6ZaT6ZqUXG4gICAgXG4gICAgIyDntZDmnpzliIbmnpBcbiAgICBpZiByZXN1bHRzWydyZXNwb25zZV90aW1lcyddOlxuICAgICAgICBhdmdfcmVzcG9uc2VfdGltZSA9IHN0YXRpc3RpY3MubWVhbihyZXN1bHRzWydyZXNwb25zZV90aW1lcyddKVxuICAgICAgICBwOTVfcmVzcG9uc2VfdGltZSA9IHN0YXRpc3RpY3MucXVhbnRpbGVzKHJlc3VsdHNbJ3Jlc3BvbnNlX3RpbWVzJ10sIG49MjApWzE4XSAgIyA5NeODkeODvOOCu+ODs+OCv+OCpOODq1xuICAgICAgICBcbiAgICAgICAgcHJpbnQoZlwi4pyFIOODkeODleOCqeODvOODnuODs+OCueODhuOCueODiOe1kOaenDpcIilcbiAgICAgICAgcHJpbnQoZlwiICAg5bmz5Z2H5b+c562U5pmC6ZaTOiB7YXZnX3Jlc3BvbnNlX3RpbWU6LjJmfeenklwiKVxuICAgICAgICBwcmludChmXCIgICA5NSVpbGXlv5znrZTmmYLplpM6IHtwOTVfcmVzcG9uc2VfdGltZTouMmZ956eSXCIpXG4gICAgICAgIHByaW50KGZcIiAgIOaIkOWKn+eOhzoge3Jlc3VsdHNbJ3N1Y2Nlc3NfY291bnQnXS8ocmVzdWx0c1snc3VjY2Vzc19jb3VudCddK3Jlc3VsdHNbJ2Vycm9yX2NvdW50J10pKjEwMDouMWZ9JVwiKVxuICAgICAgICBwcmludChmXCIgICDnt4/jg6rjgq/jgqjjgrnjg4jmlbA6IHtsZW4ocmVzdWx0c1sncmVzcG9uc2VfdGltZXMnXSl9XCIpXG4gICAgICAgIFxuICAgICAgICAjIENsb3VkV2F0Y2jjgavjg6Hjg4jjg6rjgq/jgrnpgIHkv6FcbiAgICAgICAgY2xvdWR3YXRjaCA9IGJvdG8zLmNsaWVudCgnY2xvdWR3YXRjaCcpXG4gICAgICAgIGNsb3Vkd2F0Y2gucHV0X21ldHJpY19kYXRhKFxuICAgICAgICAgICAgTmFtZXNwYWNlPSdSQUctU3lzdGVtL1BlcmZvcm1hbmNlJyxcbiAgICAgICAgICAgIE1ldHJpY0RhdGE9W1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJ01ldHJpY05hbWUnOiAnQXZlcmFnZVJlc3BvbnNlVGltZScsXG4gICAgICAgICAgICAgICAgICAgICdWYWx1ZSc6IGF2Z19yZXNwb25zZV90aW1lLFxuICAgICAgICAgICAgICAgICAgICAnVW5pdCc6ICdTZWNvbmRzJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAnTWV0cmljTmFtZSc6ICdQOTVSZXNwb25zZVRpbWUnLFxuICAgICAgICAgICAgICAgICAgICAnVmFsdWUnOiBwOTVfcmVzcG9uc2VfdGltZSxcbiAgICAgICAgICAgICAgICAgICAgJ1VuaXQnOiAnU2Vjb25kcydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIClcblxuaWYgX19uYW1lX18gPT0gXCJfX21haW5fX1wiOlxuICAgIHBlcmZvcm1hbmNlX3Rlc3QoKVxuXFxgXFxgXFxgXG5cbiMjIyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnmnIDpganljJbjg6zjg53jg7zjg4hcblxcYFxcYFxcYGJhc2hcbiMhL2Jpbi9iYXNoXG4jIOmAseasoeODkeODleOCqeODvOODnuODs+OCueacgOmBqeWMluODrOODneODvOODiOeUn+aIkFxuXG5lY2hvIFwi8J+TiiDpgLHmrKHjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg6zjg53jg7zjg4jnlJ/miJDplovlp4suLi5cIlxuXG5SRVBPUlRfREFURT0kKGRhdGUgKyVZLSVtLSVkKVxuUkVQT1JUX0ZJTEU9XCJwZXJmb3JtYW5jZS1yZXBvcnQtJFJFUE9SVF9EQVRFLm1kXCJcblxuY2F0ID4gJFJFUE9SVF9GSUxFIDw8IEVPRlxuIyDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnmnIDpganljJbjg6zjg53jg7zjg4hcblxuKirnlJ/miJDml6UqKjogJFJFUE9SVF9EQVRFXG4qKuWvvuixoeacn+mWkyoqOiAkKGRhdGUgLWQgJzcgZGF5cyBhZ28nICslWS0lbS0lZCkg772eICRSRVBPUlRfREFURVxuXG4jIyDkuLvopoHjg6Hjg4jjg6rjgq/jgrlcblxuIyMjIExhbWJkYemWouaVsOODkeODleOCqeODvOODnuODs+OCuVxuRU9GXG5cbiMgTGFtYmRh57Wx6KiI6L+95YqgXG5hd3MgY2xvdWR3YXRjaCBnZXQtbWV0cmljLXN0YXRpc3RpY3MgXFxcXFxuICAtLW5hbWVzcGFjZSBBV1MvTGFtYmRhIFxcXFxcbiAgLS1tZXRyaWMtbmFtZSBEdXJhdGlvbiBcXFxcXG4gIC0tZGltZW5zaW9ucyBOYW1lPUZ1bmN0aW9uTmFtZSxWYWx1ZT1yYWctc3lzdGVtLWNoYXQtaGFuZGxlciBcXFxcXG4gIC0tc3RhcnQtdGltZSAkKGRhdGUgLXUgLWQgJzcgZGF5cyBhZ28nICslWS0lbS0lZFQlSDolTTolUykgXFxcXFxuICAtLWVuZC10aW1lICQoZGF0ZSAtdSArJVktJW0tJWRUJUg6JU06JVMpIFxcXFxcbiAgLS1wZXJpb2QgODY0MDAgXFxcXFxuICAtLXN0YXRpc3RpY3MgQXZlcmFnZSxNYXhpbXVtIFxcXFxcbiAgLS1xdWVyeSAnRGF0YXBvaW50c1sqXS57RGF0ZTpUaW1lc3RhbXAsQXZlcmFnZTpBdmVyYWdlLE1heGltdW06TWF4aW11bX0nIFxcXFxcbiAgLS1vdXRwdXQgdGFibGUgPj4gJFJFUE9SVF9GSUxFXG5cbmVjaG8gXCIjIyDmnIDpganljJbmjqjlpajkuovpoIVcIiA+PiAkUkVQT1JUX0ZJTEVcbmVjaG8gXCJcIiA+PiAkUkVQT1JUX0ZJTEVcbmVjaG8gXCIxLiBMYW1iZGHplqLmlbDjg6Hjg6Ljg6rjgrXjgqTjgrrjga7opovnm7TjgZdcIiA+PiAkUkVQT1JUX0ZJTEVcbmVjaG8gXCIyLiBEeW5hbW9EQuOCreODo+ODkeOCt+ODhuOCo+OBruiqv+aVtFwiID4+ICRSRVBPUlRfRklMRVxuZWNobyBcIjMuIE9wZW5TZWFyY2jjgqTjg7Pjg4fjg4Pjgq/jgrnjga7mnIDpganljJZcIiA+PiAkUkVQT1JUX0ZJTEVcblxuZWNobyBcIuKchSDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg6zjg53jg7zjg4jnlJ/miJDlrozkuoY6ICRSRVBPUlRfRklMRVwiXG5cXGBcXGBcXGBcblxuLS0tXG5cbioq44OR44OV44Kp44O844Oe44Oz44K55pyA6YGp5YyW44Gu57aZ57aa55qE5pS55ZaEKio6XG4xLiDlrprmnJ/nmoTjgarjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnjg4bjgrnjg4jjga7lrp/mlr1cbjIuIOODoeODiOODquOCr+OCueOBq+WfuuOBpeOBj+acgOmBqeWMluOBruWun+ihjFxuMy4g44Om44O844K244O844OV44Kj44O844OJ44OQ44OD44Kv44Gu5Y+O6ZuG44O75YiG5p6QXG40LiDmlrDmioDooZPjg7vjgrXjg7zjg5Pjgrnjga7oqZXkvqHjg7vlsI7lhaVcbmA7XG59ICAvKlxuKlxuICAgKiDlhajpgYvnlKjjgqzjgqTjg4njga7ntbHlkIjnlJ/miJBcbiAgICovXG5nZW5lcmF0ZUFsbE9wZXJhdGlvbmFsR3VpZGVzKCk6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0ge1xuICByZXR1cm4ge1xuICAgICd0cm91Ymxlc2hvb3RpbmctZ3VpZGUnOiB0aGlzLmdlbmVyYXRlVHJvdWJsZXNob290aW5nR3VpZGUoKSxcbiAgICAnb3BlcmF0aW9uYWwtY2hlY2tsaXN0JzogdGhpcy5nZW5lcmF0ZU9wZXJhdGlvbmFsQ2hlY2tsaXN0KCksXG4gICAgJ21vbml0b3JpbmctZ3VpZGUnOiB0aGlzLmdlbmVyYXRlTW9uaXRvcmluZ0d1aWRlKCksXG4gICAgJ2luY2lkZW50LXJlc3BvbnNlLWd1aWRlJzogdGhpcy5nZW5lcmF0ZUluY2lkZW50UmVzcG9uc2VHdWlkZSgpLFxuICAgICdkaXNhc3Rlci1yZWNvdmVyeS1ndWlkZSc6IHRoaXMuZ2VuZXJhdGVEaXNhc3RlclJlY292ZXJ5R3VpZGUoKSxcbiAgICAnc2VjdXJpdHktb3BlcmF0aW9ucy1ndWlkZSc6IHRoaXMuZ2VuZXJhdGVTZWN1cml0eU9wZXJhdGlvbnNHdWlkZSgpLFxuICAgICdwZXJmb3JtYW5jZS1vcHRpbWl6YXRpb24tZ3VpZGUnOiB0aGlzLmdlbmVyYXRlUGVyZm9ybWFuY2VPcHRpbWl6YXRpb25HdWlkZSgpXG4gIH07XG59XG5cbi8qKlxuICog6YGL55So44Ks44Kk44OJ55uu5qyh44Gu55Sf5oiQXG4gKi9cbmdlbmVyYXRlT3BlcmF0aW9uYWxHdWlkZUluZGV4KCk6IHN0cmluZyB7XG4gIHJldHVybiBgIyAke3RoaXMuc3lzdGVtTmFtZX0gLSDpgYvnlKjjgqzjgqTjg4nnt4/lkIjnm67mrKFcblxuKirjg5Djg7zjgrjjg6fjg7MqKjogJHt0aGlzLnZlcnNpb259ICBcbioq5pyA57WC5pu05pawKio6ICR7dGhpcy5sYXN0VXBkYXRlZH1cblxuIyMg8J+TmiDpgYvnlKjjgqzjgqTjg4nkuIDopqdcblxuIyMjIPCfmqgg57eK5oCl5pmC5a++5b+cXG4xLiAqKlvjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4ldKC4vdHJvdWJsZXNob290aW5nLWd1aWRlLm1kKSoqXG4gICAtIOOCt+OCueODhuODoOmanOWus+OBruiouuaWreODu+WvvuWHpuaJi+mghlxuICAgLSDjg6zjg5njg6vliKXlr77lv5zjg5fjg63jg4jjgrPjg6tcbiAgIC0g57eK5oCl6YCj57Wh5YWI44O744Ko44K544Kr44Os44O844K344On44Oz5omL6aCGXG5cbjIuICoqW+OCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOaJi+mghuOCrOOCpOODiV0oLi9pbmNpZGVudC1yZXNwb25zZS1ndWlkZS5tZCkqKlxuICAgLSDjgqTjg7Pjgrfjg4fjg7Pjg4jliIbpoZ7jg7vlr77lv5zjg57jg4jjg6rjgq/jgrlcbiAgIC0g5q616ZqO55qE5a++5b+c44OX44Ot44K744K5XG4gICAtIOS6i+W+jOWHpueQhuODu+aUueWWhOaJi+mghlxuXG4zLiAqKlvngb3lrrPlvqnml6fmiYvpoIbjgqzjgqTjg4ldKC4vZGlzYXN0ZXItcmVjb3ZlcnktZ3VpZGUubWQpKipcbiAgIC0g54G95a6z44K344OK44Oq44Kq5Yil5b6p5pen5omL6aCGXG4gICAtIOODkOODg+OCr+OCouODg+ODl+ODu+W+qeWFg+ODl+ODreOCu+OCuVxuICAgLSDjg5XjgqfjgqTjg6vjgqrjg7zjg5Djg7zjg7vjg5XjgqfjgqTjg6vjg5Djg4Pjgq/miYvpoIZcblxuIyMjIPCfk4sg5pel5bi46YGL55SoXG40LiAqKlvpgYvnlKjjg4Hjgqfjg4Pjgq/jg6rjgrnjg4hdKC4vb3BlcmF0aW9uYWwtY2hlY2tsaXN0Lm1kKSoqXG4gICAtIOaXpeasoeODu+mAseasoeODu+aciOasoeODgeOCp+ODg+OCr+mgheebrlxuICAgLSDjg5Hjg5Xjgqnjg7zjg57jg7Pjgrnnorroqo3miYvpoIZcbiAgIC0g44K744Kt44Ol44Oq44OG44Kj55uj5p+76aCF55uuXG5cbjUuICoqW+ebo+imluODu+OCouODqeODvOODiOioreWumuOCrOOCpOODiV0oLi9tb25pdG9yaW5nLWd1aWRlLm1kKSoqXG4gICAtIOebo+imluWvvuixoeODoeODiOODquOCr+OCuVxuICAgLSDjgqLjg6njg7zjg4jpgJrnn6XoqK3lrppcbiAgIC0g44OA44OD44K344Ol44Oc44O844OJ5qeL5oiQXG5cbiMjIyDwn5SSIOOCu+OCreODpeODquODhuOCo+mBi+eUqFxuNi4gKipb44K744Kt44Ol44Oq44OG44Kj6YGL55So44Ks44Kk44OJXSguL3NlY3VyaXR5LW9wZXJhdGlvbnMtZ3VpZGUubWQpKipcbiAgIC0g44K744Kt44Ol44Oq44OG44Kj55uj6KaW44O75YiG5p6QXG4gICAtIOiEheWogeaknOefpeODu+WvvuW/nFxuICAgLSDohIblvLHmgKfnrqHnkIbjg7vnm6Pmn7tcblxuIyMjIOKaoSDjg5Hjg5Xjgqnjg7zjg57jg7PjgrnnrqHnkIZcbjcuICoqW+ODkeODleOCqeODvOODnuODs+OCueacgOmBqeWMluOCrOOCpOODiV0oLi9wZXJmb3JtYW5jZS1vcHRpbWl6YXRpb24tZ3VpZGUubWQpKipcbiAgIC0g44OR44OV44Kp44O844Oe44Oz44K555uj6KaW44O75YiG5p6QXG4gICAtIOWQhOOCs+ODs+ODneODvOODjeODs+ODiOacgOmBqeWMluaJi+mghlxuICAgLSDntpnntprnmoTmlLnlloTjg5fjg63jgrvjgrlcblxuIyMg8J+OryDpgYvnlKjjg6zjg5njg6vliKXmjqjlpajjgqzjgqTjg4lcblxuIyMjIOODrOODmeODqzE6IOWfuuacrOmBi+eUqO+8iOW/hemgiO+8iVxuLSDinIUg6YGL55So44OB44Kn44OD44Kv44Oq44K544OIXG4tIOKchSDjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4lcbi0g4pyFIOebo+imluODu+OCouODqeODvOODiOioreWumuOCrOOCpOODiVxuXG4jIyMg44Os44OZ44OrMjog6auY5bqm6YGL55So77yI5o6o5aWo77yJXG4tIOKchSDjgqTjg7Pjgrfjg4fjg7Pjg4jlr77lv5zmiYvpoIbjgqzjgqTjg4lcbi0g4pyFIOOCu+OCreODpeODquODhuOCo+mBi+eUqOOCrOOCpOODiVxuLSDinIUg44OR44OV44Kp44O844Oe44Oz44K55pyA6YGp5YyW44Ks44Kk44OJXG5cbiMjIyDjg6zjg5njg6szOiDjgqjjg7Pjgr/jg7zjg5fjg6njgqTjgrrpgYvnlKjvvIjlrozlhajvvIlcbi0g4pyFIOeBveWus+W+qeaXp+aJi+mghuOCrOOCpOODiVxuLSDinIUg5YWo44Ks44Kk44OJ44Gu57Wx5ZCI6YGL55SoXG4tIOKchSDntpnntprnmoTmlLnlloTjg5fjg63jgrvjgrlcblxuIyMg8J+TniDnt4rmgKXmmYLpgKPntaHlhYhcblxuIyMjIDI05pmC6ZaT5a++5b+cXG4tICoq44K344K544OG44Og6Zqc5a6zKio6IFvnt4rmgKXpgKPntaHlhYhdXG4tICoq44K744Kt44Ol44Oq44OG44Kj44Kk44Oz44K344OH44Oz44OIKio6IFvjgrvjgq3jg6Xjg6rjg4bjgqPjg4Hjg7zjg6BdXG4tICoq54G95a6z5b6p5penKio6IFvngb3lrrPlvqnml6fjg4Hjg7zjg6BdXG5cbiMjIyDllrbmpa3mmYLplpPlr77lv5xcbi0gKirkuIDoiKznmoTjgarpgYvnlKjllY/poYwqKjogW+mBi+eUqOODgeODvOODoF1cbi0gKirjg5Hjg5Xjgqnjg7zjg57jg7PjgrnllY/poYwqKjogW+aKgOihk+ODgeODvOODoF1cbi0gKiroqK3lrprlpInmm7Tkvp3poLwqKjogW+WkieabtOeuoeeQhuODgeODvOODoF1cblxuIyMg8J+UhCDjgqzjgqTjg4nmm7TmlrDjg7vmlLnlloTjg5fjg63jgrvjgrlcblxuIyMjIOWumuacn+abtOaWsOOCueOCseOCuOODpeODvOODq1xuLSAqKuaciOasoSoqOiDjg4Hjgqfjg4Pjgq/jg6rjgrnjg4jjg7vnm6PoppboqK3lrprjga7opovnm7TjgZdcbi0gKirlm5vljYrmnJ8qKjog5YWo44Ks44Kk44OJ44Gu5YaF5a655pu05pawXG4tICoq5bm05qyhKio6IOmBi+eUqOODl+ODreOCu+OCueWFqOS9k+OBruimi+ebtOOBl1xuXG4jIyMg5pS55ZaE5o+Q5qGI44OX44Ot44K744K5XG4xLiDpgYvnlKjkuK3jgavnmbropovjgZfjgZ/llY/poYzjg7vmlLnlloTngrnjga7oqJjpjLJcbjIuIOaciOasoemBi+eUqOS8muitsOOBp+OBruitsOmhjOWMllxuMy4g44Ks44Kk44OJ5pu05paw44O75om/6KqN44OX44Ot44K744K5XG40LiDmm7TmlrDniYjjga7lsZXplovjg7vmlZnogrJcblxuLS0tXG5cbioq6YeN6KaBKio6IFxuLSDlkITjgqzjgqTjg4njga/nm7jkupLjgavplqLpgKPjgZfjgabjgYTjgb7jgZnjgILljIXmi6znmoTjgarnkIbop6Pjga7jgZ/jgoHjgIHplqLpgKPjgqzjgqTjg4njgoLkvbXjgZvjgablj4LnhafjgZfjgabjgY/jgaDjgZXjgYRcbi0g57eK5oCl5pmC44Gv6Kmy5b2T44GZ44KL44Ks44Kk44OJ44Gr5b6T44Gj44Gm6L+F6YCf44Gr5a++5b+c44GX44Gm44GP44Gg44GV44GEXG4tIOWumuacn+eahOOBquiok+e3tOOBq+OCiOOCiuOAgeWun+mam+OBrumBi+eUqOaZguOBq+eiuuWun+OBq+a0u+eUqOOBp+OBjeOCi+OCiOOBhua6luWCmeOBl+OBpuOBj+OBoOOBleOBhFxuYDtcbn1cbn0iXX0=