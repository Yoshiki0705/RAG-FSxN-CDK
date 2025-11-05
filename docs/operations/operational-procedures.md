# 運用手順書

## 📋 概要

このドキュメントは、Permission-aware RAG System with FSx for NetApp ONTAPの日常運用手順を詳細に定義します。運用チームが効率的かつ確実にシステムを運用するための具体的な手順とスクリプトを提供します。

## 🎯 運用体制

### 運用チーム構成

#### 運用責任者
- **役割**: 運用全体の統括・意思決定
- **責任範囲**: SLA管理、エスカレーション判断、運用改善
- **勤務体制**: 平日 9:00-18:00 + オンコール対応

#### 運用エンジニア（レベル1）
- **役割**: 日常監視、基本対応、アラート初期対応
- **責任範囲**: 監視、基本トラブルシューティング、定型作業
- **勤務体制**: 24時間365日（シフト制）

#### 運用エンジニア（レベル2）
- **役割**: 高度なトラブルシューティング、システム変更
- **責任範囲**: 複雑な問題解決、システム最適化、手順書更新
- **勤務体制**: 平日 9:00-18:00 + エスカレーション対応

#### 運用アーキテクト
- **役割**: 運用設計、改善提案、技術的エスカレーション対応
- **責任範囲**: アーキテクチャ変更、パフォーマンス最適化
- **勤務体制**: 平日 9:00-18:00 + 重大インシデント対応

### 勤務シフト

#### 24時間監視体制
```
シフトA: 08:00-16:00 (日勤)
シフトB: 16:00-00:00 (夕勤)  
シフトC: 00:00-08:00 (夜勤)
```

#### 週末・祝日体制
```
土日祝: 09:00-18:00 (1名体制)
夜間: オンコール対応
```

## 📊 日常運用手順

### 朝の運用開始手順 (08:00-09:00)

#### 1. 夜間状況確認
```bash
# 夜間アラート確認
npm run operations:overnight-alerts

# 夜間バッチ処理結果確認
npm run operations:batch-results -- --date $(date -d yesterday +%Y-%m-%d)

# システム全体ヘルスチェック
npm run operations:morning-health-check
```

#### 2. 引き継ぎ事項確認
```bash
# 前シフトからの引き継ぎ確認
npm run operations:shift-handover -- --previous-shift C

# 未解決インシデント確認
npm run operations:open-incidents

# 予定作業確認
npm run operations:scheduled-tasks -- --date $(date +%Y-%m-%d)
```

#### 3. 朝礼・情報共有
- 夜間発生事象の共有
- 当日予定作業の確認
- 注意事項・変更点の共有
- 各地域の状況確認

### 日中運用手順 (09:00-18:00)

#### 監視・アラート対応

**アラート受信時の対応フロー**
```bash
# 1. アラート詳細確認
npm run operations:alert-details -- --alert-id [ALERT_ID]

# 2. 影響範囲確認
npm run operations:impact-assessment -- --alert-id [ALERT_ID]

# 3. 初期対応実行
npm run operations:initial-response -- --alert-id [ALERT_ID]

# 4. エスカレーション判断
npm run operations:escalation-check -- --alert-id [ALERT_ID]
```

**Critical アラート対応**
```bash
# 緊急対応チーム招集
npm run operations:emergency-response -- --alert-id [ALERT_ID]

# 関係者通知
npm run operations:notify-stakeholders -- --severity critical --alert-id [ALERT_ID]

# 対応状況更新
npm run operations:update-incident-status -- --incident-id [INCIDENT_ID] --status investigating
```

#### 定期チェック作業

**毎時チェック (毎時00分)**
```bash
# システム状態確認
npm run operations:hourly-check

# パフォーマンスメトリクス確認
npm run operations:performance-metrics -- --period 1h

# 容量使用状況確認
npm run operations:capacity-check
```

**4時間毎チェック (06:00, 10:00, 14:00, 18:00, 22:00, 02:00)**
```bash
# 詳細ヘルスチェック
npm run operations:detailed-health-check

# データレプリケーション状況確認
npm run operations:replication-check

# セキュリティ状況確認
npm run operations:security-check
```

### 夜間運用手順 (18:00-08:00)

#### 夜間バッチ処理監視
```bash
# バッチ処理開始確認
npm run operations:batch-start-check -- --time 20:00

# バッチ処理進捗監視
npm run operations:batch-progress -- --job-id [JOB_ID]

# バッチ処理完了確認
npm run operations:batch-completion-check -- --time 06:00
```

#### 夜間メンテナンス作業
```bash
# メンテナンス作業実行
npm run operations:maintenance-tasks -- --type nightly

# システム最適化実行
npm run operations:nightly-optimization

# ログローテーション実行
npm run operations:log-rotation
```

## 🔧 システム変更手順

### 計画変更手順

#### 変更申請・承認プロセス
1. **変更申請書作成**
   ```bash
   npm run operations:create-change-request -- --type planned --description "変更内容"
   ```

2. **影響評価実行**
   ```bash
   npm run operations:change-impact-assessment -- --change-id [CHANGE_ID]
   ```

3. **承認プロセス**
   ```bash
   npm run operations:submit-for-approval -- --change-id [CHANGE_ID]
   ```

4. **変更実行**
   ```bash
   npm run operations:execute-change -- --change-id [CHANGE_ID]
   ```

5. **変更検証**
   ```bash
   npm run operations:verify-change -- --change-id [CHANGE_ID]
   ```

#### 設定変更手順

**Lambda関数設定変更**
```bash
# 1. 現在の設定バックアップ
npm run operations:backup-lambda-config -- --function-name [FUNCTION_NAME]

# 2. 設定変更実行
npm run operations:update-lambda-config -- --function-name [FUNCTION_NAME] --config-file [CONFIG_FILE]

# 3. 動作確認
npm run operations:test-lambda-function -- --function-name [FUNCTION_NAME]

# 4. ロールバック準備
npm run operations:prepare-rollback -- --function-name [FUNCTION_NAME]
```

**DynamoDB設定変更**
```bash
# 1. テーブル設定確認
npm run operations:check-dynamodb-config -- --table-name [TABLE_NAME]

# 2. 容量変更実行
npm run operations:update-dynamodb-capacity -- --table-name [TABLE_NAME] --read-capacity [READ] --write-capacity [WRITE]

# 3. 変更結果確認
npm run operations:verify-dynamodb-change -- --table-name [TABLE_NAME]
```

### 緊急変更手順

#### 緊急変更承認プロセス
```bash
# 1. 緊急変更申請
npm run operations:emergency-change-request -- --severity critical --description "緊急変更理由"

# 2. 緊急承認取得
npm run operations:emergency-approval -- --change-id [CHANGE_ID]

# 3. 緊急変更実行
npm run operations:execute-emergency-change -- --change-id [CHANGE_ID]

# 4. 事後報告
npm run operations:post-change-report -- --change-id [CHANGE_ID]
```

## 📈 パフォーマンス管理

### パフォーマンス監視

#### リアルタイム監視
```bash
# 現在のパフォーマンス状況確認
npm run operations:current-performance

# 地域別パフォーマンス確認
npm run operations:regional-performance -- --region [REGION]

# ボトルネック特定
npm run operations:identify-bottlenecks
```

#### パフォーマンス分析
```bash
# 日次パフォーマンス分析
npm run operations:daily-performance-analysis

# 週次パフォーマンストレンド分析
npm run operations:weekly-performance-trend

# 月次パフォーマンスレポート生成
npm run operations:monthly-performance-report
```

### 容量管理

#### 容量監視
```bash
# 現在の容量使用状況
npm run operations:capacity-usage

# 容量予測分析
npm run operations:capacity-forecast

# 容量アラート設定確認
npm run operations:capacity-alert-config
```

#### 容量拡張手順
```bash
# 1. 容量拡張計画作成
npm run operations:create-capacity-plan -- --component [COMPONENT] --target-capacity [CAPACITY]

# 2. 拡張作業実行
npm run operations:execute-capacity-expansion -- --plan-id [PLAN_ID]

# 3. 拡張結果確認
npm run operations:verify-capacity-expansion -- --plan-id [PLAN_ID]
```

## 🔐 セキュリティ運用

### セキュリティ監視

#### 日次セキュリティチェック
```bash
# セキュリティイベント確認
npm run operations:security-events -- --date $(date +%Y-%m-%d)

# 異常アクセス検知
npm run operations:anomaly-detection

# 脆弱性スキャン結果確認
npm run operations:vulnerability-scan-results
```

#### セキュリティインシデント対応
```bash
# 1. インシデント検知・分類
npm run operations:classify-security-incident -- --incident-id [INCIDENT_ID]

# 2. 初期封じ込め
npm run operations:contain-security-incident -- --incident-id [INCIDENT_ID]

# 3. 詳細調査
npm run operations:investigate-security-incident -- --incident-id [INCIDENT_ID]

# 4. 根絶・復旧
npm run operations:remediate-security-incident -- --incident-id [INCIDENT_ID]

# 5. 事後対応
npm run operations:post-incident-activities -- --incident-id [INCIDENT_ID]
```

### アクセス管理

#### ユーザーアクセス管理
```bash
# 新規ユーザー追加
npm run operations:add-user -- --username [USERNAME] --role [ROLE] --region [REGION]

# ユーザー権限変更
npm run operations:modify-user-permissions -- --username [USERNAME] --permissions [PERMISSIONS]

# ユーザー削除
npm run operations:remove-user -- --username [USERNAME]

# アクセス権限監査
npm run operations:audit-user-access
```

## 📊 レポート・ドキュメント管理

### 定期レポート作成

#### 日次レポート
```bash
# 日次運用レポート生成
npm run operations:generate-daily-report -- --date $(date +%Y-%m-%d)

# レポート配布
npm run operations:distribute-daily-report
```

#### 週次レポート
```bash
# 週次運用レポート生成
npm run operations:generate-weekly-report -- --week $(date +%Y-W%U)

# パフォーマンストレンド分析
npm run operations:weekly-performance-analysis

# インシデント分析レポート
npm run operations:weekly-incident-analysis
```

#### 月次レポート
```bash
# 月次運用レポート生成
npm run operations:generate-monthly-report -- --month $(date +%Y-%m)

# SLA達成状況レポート
npm run operations:sla-achievement-report

# 容量・コスト分析レポート
npm run operations:capacity-cost-analysis
```

### ドキュメント管理

#### 手順書更新
```bash
# 手順書更新申請
npm run operations:request-procedure-update -- --document [DOCUMENT] --changes [CHANGES]

# 手順書レビュー
npm run operations:review-procedure-update -- --request-id [REQUEST_ID]

# 手順書承認・公開
npm run operations:approve-procedure-update -- --request-id [REQUEST_ID]
```

#### ナレッジベース管理
```bash
# 新規ナレッジ登録
npm run operations:add-knowledge -- --title [TITLE] --content [CONTENT] --category [CATEGORY]

# ナレッジ検索
npm run operations:search-knowledge -- --query [QUERY]

# ナレッジ更新
npm run operations:update-knowledge -- --knowledge-id [ID] --content [CONTENT]
```

## 🚨 インシデント管理

### インシデント対応プロセス

#### インシデント検知・記録
```bash
# インシデント登録
npm run operations:create-incident -- --severity [SEVERITY] --description [DESCRIPTION]

# インシデント分類
npm run operations:classify-incident -- --incident-id [INCIDENT_ID] --category [CATEGORY]

# 初期対応記録
npm run operations:log-initial-response -- --incident-id [INCIDENT_ID] --actions [ACTIONS]
```

#### インシデント対応・解決
```bash
# 対応チーム編成
npm run operations:assign-incident-team -- --incident-id [INCIDENT_ID] --team [TEAM]

# 対応進捗更新
npm run operations:update-incident-progress -- --incident-id [INCIDENT_ID] --status [STATUS] --notes [NOTES]

# インシデント解決
npm run operations:resolve-incident -- --incident-id [INCIDENT_ID] --resolution [RESOLUTION]
```

#### 事後分析・改善
```bash
# 根本原因分析実行
npm run operations:root-cause-analysis -- --incident-id [INCIDENT_ID]

# 改善計画作成
npm run operations:create-improvement-plan -- --incident-id [INCIDENT_ID]

# 教訓・ナレッジ化
npm run operations:create-lessons-learned -- --incident-id [INCIDENT_ID]
```

## 📋 運用チェックリスト

### シフト開始時チェックリスト
- [ ] 前シフトからの引き継ぎ確認
- [ ] 未解決インシデント・アラート確認
- [ ] システム全体ヘルスチェック実行
- [ ] 当日予定作業確認
- [ ] 監視ツール・ダッシュボード確認
- [ ] 緊急連絡先・エスカレーション手順確認

### シフト終了時チェックリスト
- [ ] 当シフト中の作業・対応記録
- [ ] 未解決事項の次シフトへの引き継ぎ
- [ ] システム状態の最終確認
- [ ] アラート・インシデント状況確認
- [ ] 引き継ぎ事項の文書化
- [ ] 次シフトへの申し送り実行

### 週次チェックリスト
- [ ] 週次運用レポート作成・レビュー
- [ ] パフォーマンストレンド分析
- [ ] 容量使用状況確認・予測更新
- [ ] セキュリティ状況レビュー
- [ ] インシデント分析・改善計画確認
- [ ] 手順書・ドキュメント更新確認

### 月次チェックリスト
- [ ] 月次運用レポート作成・配布
- [ ] SLA達成状況評価
- [ ] 容量・コスト分析実行
- [ ] セキュリティ監査実行
- [ ] 災害復旧テスト実行
- [ ] 運用プロセス改善検討

## 📞 連絡先・エスカレーション

### 内部連絡先

#### 運用チーム
- **運用責任者**: ops-manager@company.com / +81-XX-XXXX-XXXX
- **運用リーダー**: ops-lead@company.com / +81-XX-XXXX-XXXX
- **24時間運用**: ops-24x7@company.com / +81-XX-XXXX-XXXX

#### 開発チーム
- **開発責任者**: dev-manager@company.com
- **アーキテクト**: architect@company.com
- **緊急対応**: dev-emergency@company.com

#### 経営陣
- **CTO**: cto@company.com
- **情報システム部長**: is-manager@company.com

### 外部連絡先

#### ベンダーサポート
- **AWS Enterprise Support**: 24時間対応
- **NetApp サポート**: +81-XX-XXXX-XXXX
- **セキュリティベンダー**: security-support@vendor.com

#### 緊急時外部連絡先
- **法務**: legal@company.com
- **広報**: pr@company.com
- **顧客サポート**: customer-support@company.com

## 📚 関連ドキュメント

### 運用ドキュメント
- [グローバル運用ガイド](./global-operations-guide.md)
- [災害復旧手順書](./disaster-recovery-procedures.md)
- [セキュリティ運用手順書](./security-operations-guide.md)
- [コンプライアンス対応ガイド](./compliance-operations-guide.md)

### 技術ドキュメント
- [システムアーキテクチャ](../architecture/global-architecture.md)
- [API リファレンス](../api/api-reference.md)
- [トラブルシューティングガイド](./troubleshooting-guide.md)

### 管理ドキュメント
- [運用SLA](../policies/operational-sla.md)
- [インシデント管理ポリシー](../policies/incident-management-policy.md)
- [変更管理ポリシー](../policies/change-management-policy.md)

---

**ドキュメントバージョン**: 1.0  
**最終更新**: 2024年1月  
**次回レビュー予定**: 2024年4月  
**承認者**: [運用責任者名]