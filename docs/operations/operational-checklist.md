# Permission-aware RAG System with FSx for NetApp ONTAP - 運用チェックリスト

**バージョン**: 2.0.0  
**最終更新**: 2025-10-17

## 📅 日次運用チェック（毎日 9:00 実行）

### 🔍 システム状態確認（所要時間: 15分）

#### 基本機能確認
- [ ] **Webサイト動作確認**
  - [ ] メインページ読み込み（< 3秒）
  - [ ] ログイン機能動作
  - [ ] チャットインターフェース表示
  - [ ] ファイルアップロード機能

- [ ] **API エンドポイント確認**
  ```bash
  # ヘルスチェックエンドポイント
  curl -f https://your-domain.com/api/health
  
  # 認証エンドポイント
  curl -f https://your-domain.com/api/auth/status
  ```

#### パフォーマンス確認
- [ ] **応答時間確認**
  - [ ] Webページ読み込み: < 2秒
  - [ ] API応答時間: < 1秒
  - [ ] チャット応答時間: < 10秒

- [ ] **エラー率確認**
  - [ ] HTTP 5xx エラー率: < 0.1%
  - [ ] Lambda エラー率: < 0.5%

### 🔒 セキュリティ確認（所要時間: 10分）

- [ ] **不正アクセス確認**
  - [ ] WAF ブロック状況確認
  - [ ] 異常なアクセスパターン検出
  - [ ] 失敗ログイン試行回数確認

- [ ] **証明書・設定確認**
  - [ ] SSL証明書有効性（有効期限 > 30日）
  - [ ] セキュリティヘッダー設定

## 📅 週次運用チェック（毎週月曜日 10:00 実行）

### 📈 容量・使用量分析（所要時間: 30分）

#### ストレージ使用量確認
- [ ] **DynamoDB使用量**
  ```bash
  # テーブルサイズ確認
  aws dynamodb describe-table --table-name rag-system-sessions \
    --query 'Table.{TableSizeBytes:TableSizeBytes,ItemCount:ItemCount}'
  ```

- [ ] **Lambda実行統計**
  ```bash
  # 週次実行統計
  aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=rag-system-chat-handler \
    --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 --statistics Sum
  ```

### 💰 コスト分析（所要時間: 20分）

- [ ] **週次コストレポート確認**
- [ ] **予算アラート確認**
- [ ] **不要リソース特定**

## 📅 月次運用チェック（毎月1日 14:00 実行）

### 📊 パフォーマンス分析（所要時間: 60分）

- [ ] **月次パフォーマンスレポート作成**
- [ ] **ボトルネック分析**
- [ ] **最適化提案作成**

### 🔐 セキュリティ監査（所要時間: 45分）

- [ ] **IAMロール・ポリシー見直し**
- [ ] **ユーザーアクセス監査**
- [ ] **セキュリティ設定見直し**

## ✅ チェックリスト完了確認

### 日次チェック完了基準
- [ ] 全項目チェック完了
- [ ] 異常項目の対応完了または記録
- [ ] 次回チェック予定確認

---

**注意事項**:
- チェック実行時は必ず結果を記録してください
- 異常を発見した場合は即座にエスカレーションしてください
