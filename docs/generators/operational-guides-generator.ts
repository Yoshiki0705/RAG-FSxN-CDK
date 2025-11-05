ファイルが途中で切れているようです。完全なドキュメント生成システムを新しく作成しましょう。


9 edits to file

complete - documentation - generator.ts


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

export class OperationalGuidesGenerator {
  private readonly systemName = 'Permission-aware RAG System with FSx for NetApp ONTAP';
  private readonly version = '2.0.0';
  private readonly lastUpdated = new Date().toISOString().split('T')[0];
  /**
   * 包括的トラブルシューティングガイドの生成
   */
  generateTroubleshootingGuide(): string {
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
  generateOperationalChecklist(): string {
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
  generateMonitoringGuide(): string {
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
}  /**
   *
 インシデント対応手順ガイドの生成
   */
generateIncidentResponseGuide(): string {
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
}  /**
 
  * 災害復旧手順ガイドの生成
   */
generateDisasterRecoveryGuide(): string {
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
generateSecurityOperationsGuide(): string {
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
generatePerformanceOptimizationGuide(): string {
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
}  /*
*
   * 全運用ガイドの統合生成
   */
generateAllOperationalGuides(): { [key: string]: string } {
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
generateOperationalGuideIndex(): string {
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
}