# セキュリティ運用ガイド

**対象システム**: Permission-aware RAG with FSx for NetApp ONTAP  
**対象環境**: 本番環境（prod）  
**最終更新**: 2025年11月10日

## 📋 目次

1. [日常運用手順](#日常運用手順)
2. [モニタリング](#モニタリング)
3. [トラブルシューティング](#トラブルシューティング)
4. [エスカレーション手順](#エスカレーション手順)
5. [定期メンテナンス](#定期メンテナンス)

---

## 日常運用手順

### 1. 日次チェック（毎朝9:00）

#### CloudWatchダッシュボード確認
```bash
# ダッシュボードURL
https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=permission-aware-rag-prod-security-metrics
```

**確認項目**:
- [ ] VPC Endpoint接続数（正常範囲: 1-100）
- [ ] Cognito認証成功率（目標: 95%以上）
- [ ] Lambda実行時間（目標: 5秒以内）
- [ ] Lambda エラー率（目標: 1%以下）

#### アラーム状態確認
```bash
# アラーム状態確認
aws cloudwatch describe-alarms \
  --region ap-northeast-1 \
  --alarm-name-prefix "permission-aware-rag-prod" \
  --state-value ALARM \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue,Reason:StateReason}' \
  --output table
```

**期待結果**: アラーム状態のアラームが0件

### 2. 週次チェック（毎週月曜日10:00）

#### セキュリティグループルール監査
```bash
# セキュリティグループルール確認
aws ec2 describe-security-groups \
  --region ap-northeast-1 \
  --filters "Name=vpc-id,Values=vpc-09aa251d6db52b1fc" \
  --query 'SecurityGroups[?GroupName!=`default`].[GroupId,GroupName,IpPermissions[].{From:FromPort,To:ToPort,Protocol:IpProtocol,Source:IpRanges[].CidrIp}]' \
  --output json
```

**確認項目**:
- [ ] 不要なインバウンドルールがないか
- [ ] 0.0.0.0/0からのアクセスが適切か
- [ ] 最小権限の原則が守られているか

#### VPC Endpoint状態確認
```bash
# VPC Endpoint状態確認
aws ec2 describe-vpc-endpoints \
  --region ap-northeast-1 \
  --filters "Name=vpc-id,Values=vpc-09aa251d6db52b1fc" \
  --query 'VpcEndpoints[].[VpcEndpointId,ServiceName,State,DnsEntries[].DnsName]' \
  --output table
```

**期待結果**: 全てのVPC Endpointが `available` 状態

### 3. 月次チェック（毎月1日11:00）

#### コスト分析
```bash
# 月次コスト確認（前月分）
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "last month" +%Y-%m-01),End=$(date +%Y-%m-01) \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter file://cost-filter.json
```

**cost-filter.json**:
```json
{
  "Tags": {
    "Key": "Project",
    "Values": ["permission-aware-rag"]
  }
}
```

#### セキュリティパッチ確認
```bash
# Lambda関数のランタイムバージョン確認
aws lambda list-functions \
  --region ap-northeast-1 \
  --query 'Functions[?starts_with(FunctionName, `permission-aware-rag`)].{Name:FunctionName,Runtime:Runtime}' \
  --output table
```

**確認項目**:
- [ ] Lambda ランタイムが最新か（nodejs20.x推奨）
- [ ] 非推奨ランタイムを使用していないか

---

## モニタリング

### CloudWatch Metricsの見方

#### 1. VPC Endpoint メトリクス

**ActiveConnections（アクティブ接続数）**
- **正常範囲**: 1-100
- **警告**: 0（接続なし）または 100超（過負荷）
- **対応**: 接続数が0の場合、VPC Endpoint設定を確認

**BytesProcessed（処理バイト数）**
- **正常範囲**: 1MB-1GB/5分
- **警告**: 0（トラフィックなし）または 10GB超（異常トラフィック）
- **対応**: トラフィックパターンの分析

#### 2. Cognito 認証メトリクス

**UserAuthentication（認証成功数）**
- **正常範囲**: 10-1000回/5分
- **警告**: 0（認証なし）または 1000超（異常アクセス）
- **対応**: アプリケーションログの確認

**UserAuthenticationFailure（認証失敗数）**
- **正常範囲**: 0-5回/5分
- **警告**: 10回超（潜在的な攻撃）
- **対応**: 失敗理由の分析、IP制限の検討

**認証失敗率**
- **目標**: 5%以下
- **警告**: 20%以上
- **対応**: ユーザー教育、パスワードリセット案内

#### 3. Lambda VPC 接続メトリクス

**Duration（実行時間）**
- **目標**: 5秒以内
- **警告**: 25秒以上（タイムアウト間近）
- **対応**: VPC接続の確認、コードの最適化

**Errors（エラー数）**
- **目標**: 0回
- **警告**: 5回以上/5分
- **対応**: CloudWatch Logsでエラー詳細を確認

**Throttles（スロットル数）**
- **目標**: 0回
- **警告**: 1回以上
- **対応**: 同時実行数の上限引き上げ

### CloudWatch Alarmsの対応

#### アラーム通知を受け取った場合

1. **アラーム詳細確認**
   ```bash
   aws cloudwatch describe-alarm-history \
     --alarm-name <アラーム名> \
     --region ap-northeast-1 \
     --max-records 10
   ```

2. **メトリクス詳細確認**
   - CloudWatchコンソールでグラフを確認
   - 異常値の発生時刻を特定
   - 関連するメトリクスも確認

3. **ログ確認**
   ```bash
   # Lambda関数ログ確認
   aws logs tail /aws/lambda/<function-name> \
     --region ap-northeast-1 \
     --since 1h \
     --follow
   ```

4. **対応実施**（トラブルシューティングセクション参照）

---

## トラブルシューティング

### 問題1: VPC Endpoint接続エラー

#### 症状
- Lambda関数からCognitoへの接続が失敗
- タイムアウトエラーが発生
- CloudWatch Logsに「Connection timeout」エラー

#### 原因分析
```bash
# 1. VPC Endpoint状態確認
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <endpoint-id> \
  --region ap-northeast-1 \
  --query 'VpcEndpoints[0].State'

# 2. セキュリティグループルール確認
aws ec2 describe-security-groups \
  --group-ids <security-group-id> \
  --region ap-northeast-1 \
  --query 'SecurityGroups[0].IpPermissions'

# 3. DNS解決確認
nslookup cognito-idp.ap-northeast-1.amazonaws.com
```

#### 解決手順

**ステップ1: VPC Endpoint状態確認**
```bash
# 期待値: available
# 実際の値が pending または failed の場合、VPC Endpoint再作成が必要
```

**ステップ2: セキュリティグループ修正**
```bash
# Lambda Security GroupからCognito Endpoint Security Groupへの443許可を確認
aws ec2 authorize-security-group-ingress \
  --group-id <cognito-endpoint-sg-id> \
  --protocol tcp \
  --port 443 \
  --source-group <lambda-sg-id> \
  --region ap-northeast-1
```

**ステップ3: プライベートDNS確認**
```bash
# VPC EndpointのプライベートDNSが有効か確認
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <endpoint-id> \
  --region ap-northeast-1 \
  --query 'VpcEndpoints[0].PrivateDnsEnabled'

# 期待値: true
```

**ステップ4: Lambda関数再デプロイ**
```bash
# Lambda関数を再デプロイして接続をリセット
aws lambda update-function-configuration \
  --function-name <function-name> \
  --region ap-northeast-1 \
  --description "VPC connection reset"
```

### 問題2: Cognito認証失敗率が高い

#### 症状
- 認証失敗率が20%を超える
- ユーザーからのログイン失敗報告が増加
- CloudWatch Alarmsが発火

#### 原因分析
```bash
# 1. 認証失敗の詳細確認
aws logs filter-log-events \
  --log-group-name /aws/cognito/<user-pool-id> \
  --region ap-northeast-1 \
  --filter-pattern "Authentication failed" \
  --start-time $(date -d "1 hour ago" +%s)000
```

#### 解決手順

**ステップ1: 失敗理由の分類**
- パスワード間違い → ユーザー教育
- アカウントロック → 一時的なロック解除
- MFA失敗 → MFA設定の確認
- 不正アクセス試行 → IP制限の検討

**ステップ2: 一時的な対応**
```bash
# ユーザーアカウントのロック解除
aws cognito-idp admin-enable-user \
  --user-pool-id <user-pool-id> \
  --username <username> \
  --region ap-northeast-1
```

**ステップ3: 恒久的な対策**
- パスワードポリシーの見直し
- MFA強制化の検討
- WAFルールの追加（レート制限）

### 問題3: Lambda VPC接続タイムアウト

#### 症状
- Lambda関数の実行時間が25秒以上
- タイムアウトエラーが頻発
- VPC内リソースへの接続が遅い

#### 原因分析
```bash
# 1. Lambda ENI状態確認
aws ec2 describe-network-interfaces \
  --filters "Name=description,Values=AWS Lambda VPC ENI*" \
  --region ap-northeast-1 \
  --query 'NetworkInterfaces[].[NetworkInterfaceId,Status,PrivateIpAddress]' \
  --output table

# 2. NAT Gateway状態確認
aws ec2 describe-nat-gateways \
  --filter "Name=vpc-id,Values=vpc-09aa251d6db52b1fc" \
  --region ap-northeast-1 \
  --query 'NatGateways[].[NatGatewayId,State]' \
  --output table
```

#### 解決手順

**ステップ1: Lambda ENIの確認**
```bash
# ENIが正常にアタッチされているか確認
# Status が "in-use" であることを確認
```

**ステップ2: サブネット設定確認**
```bash
# Lambda関数が適切なサブネットに配置されているか確認
aws lambda get-function-configuration \
  --function-name <function-name> \
  --region ap-northeast-1 \
  --query 'VpcConfig.SubnetIds'
```

**ステップ3: タイムアウト設定の調整**
```bash
# Lambda関数のタイムアウトを延長（最大15分）
aws lambda update-function-configuration \
  --function-name <function-name> \
  --timeout 60 \
  --region ap-northeast-1
```

**ステップ4: VPC Endpoint利用の確認**
```bash
# Lambda関数がVPC Endpoint経由でAWSサービスにアクセスしているか確認
# VPC Flow Logsで確認
```

---

## エスカレーション手順

### レベル1: 運用チーム（初動対応）

**対応時間**: 15分以内  
**対応範囲**:
- アラーム確認
- 基本的なトラブルシューティング
- ログ収集
- 一時的な対応（サービス再起動等）

**エスカレーション条件**:
- 15分以内に解決できない
- システム全体に影響がある
- データ損失の可能性がある

### レベル2: 開発チーム（技術対応）

**対応時間**: 1時間以内  
**対応範囲**:
- コード修正
- 設定変更
- インフラ変更
- ロールバック実施

**エスカレーション条件**:
- 1時間以内に解決できない
- アーキテクチャ変更が必要
- AWS サポートへの問い合わせが必要

### レベル3: アーキテクト/AWS サポート（専門対応）

**対応時間**: 4時間以内  
**対応範囲**:
- アーキテクチャ変更
- AWS サポートケース作成
- 緊急パッチ適用
- 災害復旧

### エスカレーション連絡先

| レベル | 担当 | 連絡方法 | 対応時間 |
|--------|------|---------|---------|
| L1 | 運用チーム | Slack: #rag-ops | 24/7 |
| L2 | 開発チーム | Slack: #rag-dev | 平日9-18時 |
| L3 | アーキテクト | Email + 電話 | オンコール |

---

## 定期メンテナンス

### 月次メンテナンス（毎月第1土曜日）

#### 1. セキュリティパッチ適用
```bash
# Lambda関数のランタイム更新
aws lambda update-function-configuration \
  --function-name <function-name> \
  --runtime nodejs20.x \
  --region ap-northeast-1
```

#### 2. 不要リソースのクリーンアップ
```bash
# 古いCloudWatch Logsの削除（90日以上前）
aws logs describe-log-groups \
  --region ap-northeast-1 \
  --query 'logGroups[?creationTime<`'$(date -d "90 days ago" +%s)'000`].logGroupName' \
  --output text | xargs -I {} aws logs delete-log-group --log-group-name {} --region ap-northeast-1
```

#### 3. バックアップ検証
```bash
# S3バケットのバージョニング確認
for bucket in permission-aware-rag-prod-documents-178625946981 permission-aware-rag-prod-backup-178625946981; do
  echo "Bucket: $bucket"
  aws s3api get-bucket-versioning --bucket $bucket --region ap-northeast-1
done
```

### 四半期メンテナンス（3ヶ月ごと）

#### 1. セキュリティ監査
- IAMロールの権限レビュー
- セキュリティグループルールの見直し
- VPC Endpointの利用状況分析

#### 2. コスト最適化レビュー
- 未使用リソースの特定
- ライフサイクルポリシーの見直し
- リザーブドインスタンスの検討

#### 3. ディザスタリカバリ訓練
- バックアップからの復元テスト
- フェイルオーバー手順の確認
- RTO/RPOの検証

---

## 緊急時対応

### シナリオ1: システム全体ダウン

#### 初動対応（5分以内）
1. **影響範囲の特定**
   ```bash
   # CloudFormationスタック状態確認
   aws cloudformation describe-stacks \
     --region ap-northeast-1 \
     --query 'Stacks[?contains(StackName, `permission-aware-rag`)].{Name:StackName,Status:StackStatus}' \
     --output table
   ```

2. **ヘルスチェック実行**
   ```bash
   # 検証スクリプト実行
   ./development/scripts/deployment/verify-security-enhancements.sh
   ```

3. **ステークホルダーへの通知**
   - Slack: #rag-incidents
   - Email: rag-team@company.com

#### 復旧手順（30分以内）

**Option 1: ロールバック**
```bash
# 前回の正常なスタックにロールバック
aws cloudformation update-stack \
  --stack-name TokyoRegion-permission-aware-rag-prod-NetworkingStack \
  --use-previous-template \
  --region ap-northeast-1
```

**Option 2: 再デプロイ**
```bash
# 最新のコードで再デプロイ
cd /home/ubuntu/Permission-aware-RAG-FSxN-CDK-github
./development/scripts/deployment/deploy-networking-stack-only.sh
```

### シナリオ2: セキュリティインシデント

#### 初動対応（即座）
1. **影響を受けたリソースの隔離**
   ```bash
   # セキュリティグループルールを一時的に削除
   aws ec2 revoke-security-group-ingress \
     --group-id <security-group-id> \
     --ip-permissions <permissions> \
     --region ap-northeast-1
   ```

2. **ログの保全**
   ```bash
   # CloudWatch Logsのエクスポート
   aws logs create-export-task \
     --log-group-name /aws/lambda/<function-name> \
     --from $(date -d "24 hours ago" +%s)000 \
     --to $(date +%s)000 \
     --destination <s3-bucket> \
     --region ap-northeast-1
   ```

3. **インシデント報告**
   - セキュリティチームへの即座報告
   - AWS サポートケース作成（Severity: Urgent）

---

## ベストプラクティス

### 1. 定期的なバックアップ確認
- S3バケットのバージョニング有効化確認
- バックアップの復元テスト（月次）

### 2. 最小権限の原則
- IAMロールの定期的なレビュー
- 不要な権限の削除

### 3. モニタリングの継続的改善
- アラーム閾値の調整
- 新しいメトリクスの追加
- ダッシュボードの改善

### 4. ドキュメントの更新
- 運用手順の定期的な見直し
- トラブルシューティング事例の追加
- ナレッジベースの構築

---

## 付録

### A. 便利なコマンド集

#### リソース一覧取得
```bash
# VPC内の全リソース確認
aws ec2 describe-vpcs --vpc-ids vpc-09aa251d6db52b1fc --region ap-northeast-1
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-09aa251d6db52b1fc" --region ap-northeast-1
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=vpc-09aa251d6db52b1fc" --region ap-northeast-1
```

#### ログ検索
```bash
# 特定のエラーメッセージを検索
aws logs filter-log-events \
  --log-group-name /aws/lambda/<function-name> \
  --filter-pattern "ERROR" \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --region ap-northeast-1
```

#### メトリクス取得
```bash
# 特定のメトリクスを取得
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=<function-name> \
  --start-time $(date -d "1 hour ago" --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average \
  --region ap-northeast-1
```

### B. 関連ドキュメント

- [Security Enhancements Deployment Guide](../deployment/SECURITY_ENHANCEMENTS_DEPLOYMENT_GUIDE.md)
- [Cognito VPC Endpoint Configuration](../configuration/COGNITO_VPC_ENDPOINT_CONFIGURATION.md)
- [Security Enhancements Cost Analysis](../cost-analysis/SECURITY_ENHANCEMENTS_COST_ANALYSIS.md)

### C. 連絡先

| 役割 | 担当者 | 連絡先 |
|------|--------|--------|
| プロジェクトオーナー | RAG Team | rag-team@company.com |
| 運用担当 | Ops Team | ops-team@company.com |
| セキュリティ担当 | Security Team | security-team@company.com |

---

**作成日**: 2025年11月10日  
**作成者**: Kiro AI Assistant  
**レビュー**: 必要に応じて人間によるレビュー推奨  
**次回更新予定**: 2025年12月10日
