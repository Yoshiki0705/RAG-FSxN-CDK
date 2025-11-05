# Permission-aware RAG System with FSx for NetApp ONTAP - トラブルシューティングガイド

**バージョン**: 2.0.0  
**最終更新**: 2025-10-17

## 🚨 緊急時対応プロトコル

### レベル1: システム全体停止

#### 症状
- Webサイトが完全にアクセス不可
- 全APIエンドポイントが500エラー
- CloudFrontが503エラーを返す
- ユーザーが一切サービスを利用できない

#### 即座実行手順（5分以内）
```bash
# 1. システム状態の緊急確認
aws cloudformation describe-stacks --stack-name rag-system-prod-minimal-integrated
aws cloudformation describe-stacks --stack-name rag-system-prod-minimal-production

# 2. CloudFront状態確認
aws cloudfront get-distribution --id <DISTRIBUTION_ID>

# 3. Lambda関数状態確認
aws lambda list-functions --query 'Functions[?contains(FunctionName, `rag-system`)].{Name:FunctionName,State:State}'

# 4. 緊急メンテナンスページ有効化
aws s3 cp maintenance.html s3://rag-system-prod-website/index.html
```

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
```bash
# 1. Bedrock接続確認
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}' \
  --region ap-northeast-1 response.json

# 2. OpenSearch接続確認
curl -X GET "https://your-opensearch-endpoint.ap-northeast-1.es.amazonaws.com/_cluster/health"

# 3. Lambda関数ログ確認
aws logs tail /aws/lambda/rag-system-chat-handler --follow --since 1h
```

##### 対処手順
```bash
# 1. Lambda関数の強制再起動
aws lambda update-function-configuration \
  --function-name rag-system-chat-handler \
  --environment Variables='{FORCE_RESTART=true}'

# 2. OpenSearchインデックス確認・修復
curl -X POST "https://your-opensearch-endpoint/_refresh"
curl -X GET "https://your-opensearch-endpoint/_cat/indices?v"
```

## 📊 パフォーマンス問題診断

### 応答時間劣化（>5秒）

#### 自動診断スクリプト
```bash
#!/bin/bash
# パフォーマンス診断スクリプト

echo "🔍 パフォーマンス診断開始..."

# Lambda関数の平均実行時間確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

echo "✅ 診断完了"
```

## 📞 エスカレーション連絡先

### 緊急連絡先
- **レベル1**: システム管理者 (24時間対応)
- **レベル2**: 開発チームリーダー
- **レベル3**: アーキテクト・セキュリティ責任者

---

**注意**: このガイドは定期的に更新されます。最新版は常にGitリポジトリで確認してください。
