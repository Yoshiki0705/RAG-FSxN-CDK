# MCP統合版 AWS Batch 負荷試験レポート

## 実行概要

- **実行日時**: Mon Nov  3 12:06:51 JST 2025
- **リージョン**: us-east-1
- **MCP統合**: 有効
- **最大コスト制限**: $25.00

## テスト結果

### 負荷試験スイート
AWS Batch Load Test Suite Results (Simulation Mode)
Started: Mon Nov  3 12:06:46 JST 2025
========================================

Scenario: light
Status: SUCCESS
Duration: 180s
Configuration: CONCURRENT_JOBS=2 TEST_DURATION=180 MAX_COST_THRESHOLD=5.00
Scenario Cost: $3.25
Log File: /Users/yoshiki/Downloads/Kiro/Permission-aware-RAG-FSxN-CDK/templates/embedding-batch-workload-template/reports/mcp-integrated-test-20251103-120643/test-results/light-test-simulation.log
Completed: Mon Nov  3 12:06:46 JST 2025

Scenario: medium  
Status: SUCCESS
Duration: 300s
Configuration: CONCURRENT_JOBS=5 TEST_DURATION=300 MAX_COST_THRESHOLD=10.00
Scenario Cost: $7.80
Log File: /Users/yoshiki/Downloads/Kiro/Permission-aware-RAG-FSxN-CDK/templates/embedding-batch-workload-template/reports/mcp-integrated-test-20251103-120643/test-results/medium-test-simulation.log
Completed: Mon Nov  3 12:06:46 JST 2025

Scenario: heavy
Status: SUCCESS
Duration: 600s
Configuration: CONCURRENT_JOBS=10 TEST_DURATION=600 MAX_COST_THRESHOLD=20.00
Scenario Cost: $15.45
Log File: /Users/yoshiki/Downloads/Kiro/Permission-aware-RAG-FSxN-CDK/templates/embedding-batch-workload-template/reports/mcp-integrated-test-20251103-120643/test-results/heavy-test-simulation.log
Completed: Mon Nov  3 12:06:46 JST 2025

========================================
Completed: Mon Nov  3 12:06:46 JST 2025
Failed Scenarios: 0
Total Suite Cost: $26.50
Cost Efficiency: 8.83 per scenario

### コスト分析
- Spot インスタンスの使用で最大70%削減可能
- オートスケーリング設定でアイドル時間を最小化
- 予測可能なワークロード用のリザーブドインスタンスを検討

## 生成されたファイル

### レポート
- HTMLダッシュボード: `dashboard/batch-load-test-report.html`
- メトリクス詳細: `metrics/`
- テスト結果: `test-results/`

### CloudWatch ダッシュボード
- [CloudWatch ダッシュボード](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=EmbeddingBatchLoadTest)

## 推奨事項

1. **コスト最適化**: Spot インスタンスの使用を検討
2. **パフォーマンス**: オートスケーリング設定の調整
3. **監視**: 継続的なMCP統合監視の実装

---
*このレポートはMCP統合版負荷試験スクリプトにより自動生成されました*
