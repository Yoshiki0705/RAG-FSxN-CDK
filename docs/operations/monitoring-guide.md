# Permission-aware RAG System with FSx for NetApp ONTAP - 監視・アラート設定ガイド

**バージョン**: 2.0.0  
**最終更新**: 2025-10-17

## 📊 監視対象メトリクス

### Lambda 関数監視

#### 重要メトリクス
- **Duration**: 実行時間（目標: < 5秒）
- **Errors**: エラー数（目標: < 1%）
- **Throttles**: スロットリング数（目標: 0）
- **ConcurrentExecutions**: 同時実行数

#### CloudWatch アラーム設定例
```bash
# Lambda Duration アラーム
aws cloudwatch put-metric-alarm \
  --alarm-name "RAG-Lambda-Duration-High" \
  --alarm-description "Lambda function duration is high" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 5000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \
  --evaluation-periods 2
```

### DynamoDB 監視

#### 重要メトリクス
- **ConsumedReadCapacityUnits**: 読み込みキャパシティ消費
- **ConsumedWriteCapacityUnits**: 書き込みキャパシティ消費
- **ThrottledRequests**: スロットリングされたリクエスト
- **SystemErrors**: システムエラー

### OpenSearch 監視

#### 重要メトリクス
- **SearchLatency**: 検索レイテンシ（目標: < 1秒）
- **ClusterStatus**: クラスター状態（目標: Green）
- **CPUUtilization**: CPU使用率（目標: < 80%）

## 🔔 アラート通知設定

### アラート重要度レベル

#### Critical (緊急) - 即座対応必要
- **対象**: システム全体停止、データ損失リスク
- **通知先**: SMS + Email + Slack #critical
- **対応時間**: 5分以内に初期対応開始

#### High (高) - 緊急対応必要
- **対象**: 主要機能停止、パフォーマンス大幅低下
- **通知先**: Slack #alerts + Email
- **対応時間**: 30分以内に対応開始

#### Medium (中) - 計画的対応
- **対象**: 軽微な機能障害、容量警告
- **通知先**: Slack #monitoring + Email
- **対応時間**: 4時間以内に確認

## 📈 CloudWatch ダッシュボード設定

### メインダッシュボード構成
- Lambda パフォーマンス監視
- DynamoDB キャパシティ監視
- OpenSearch クラスター監視
- エラー・アラート状況

### ダッシュボード作成スクリプト
```bash
#!/bin/bash
# CloudWatch ダッシュボード作成

aws cloudwatch put-dashboard \
  --dashboard-name "RAG-System-Overview" \
  --dashboard-body file://dashboard-config.json

echo "✅ ダッシュボード作成完了"
```

## 🎯 SLA/SLO 監視

### サービスレベル目標

#### 可用性
- **目標**: 99.9% (月間43分以内のダウンタイム)
- **測定**: ヘルスチェックエンドポイントの成功率

#### パフォーマンス
- **目標**: 95%のリクエストが2秒以内に応答
- **測定**: Lambda Duration メトリクス

#### エラー率
- **目標**: エラー率1%未満
- **測定**: Lambda Errors / Invocations

---

**監視システム運用ガイドライン**:
1. アラートは適切な重要度で分類し、過剰な通知を避ける
2. SLO違反時は必ず根本原因分析を実施する
3. 監視設定は定期的に見直し、ビジネス要件に合わせて調整する
