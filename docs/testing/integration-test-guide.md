# 統合テストガイド

## 概要

Permission-aware RAG Systemの統合テストスイートは、グローバル多地域デプロイメントの品質を保証する包括的なテストフレームワークです。

## テストスイート構成

### 🌍 地域別統合テスト (Regional Integration Tests)
**ファイル**: `tests/integration/regional/regional-deployment-test-suite.ts`

#### 対象範囲
- **14地域でのデプロイメント検証**: 全対象地域での正常なスタック作成
- **地域間連携テスト**: データレプリケーション、監視システム統合
- **パフォーマンステスト**: 地域別目標値の達成確認
- **コンプライアンス準拠**: 地域固有の法規制要件確認

#### テスト地域
| 地域 | リージョン | コンプライアンス | 役割 |
|------|------------|------------------|------|
| 東京 | ap-northeast-1 | PDPA, FISC | メイン |
| 大阪 | ap-northeast-3 | PDPA, FISC | 災害復旧 |
| シンガポール | ap-southeast-1 | PDPA-SG | APAC |
| シドニー | ap-southeast-2 | Privacy-Act-AU | APAC |
| ムンバイ | ap-south-1 | DPDP-India | APAC |
| ソウル | ap-northeast-2 | PIPA-Korea | APAC |
| アイルランド | eu-west-1 | GDPR | EU |
| フランクフルト | eu-central-1 | GDPR, BDSG | EU |
| ロンドン | eu-west-2 | GDPR, UK-GDPR | EU |
| パリ | eu-west-3 | GDPR | EU |
| バージニア | us-east-1 | SOX, HIPAA | US |
| オレゴン | us-west-2 | CCPA, SOX | US |
| オハイオ | us-east-2 | SOX | US |
| サンパウロ | sa-east-1 | LGPD | 南米 |

#### パフォーマンス目標値
```typescript
const performanceTargets = {
  'ap-northeast-1': { responseTime: 200, throughput: 1000 },
  'us-east-1': { responseTime: 150, throughput: 1500 },
  'eu-west-1': { responseTime: 180, throughput: 1200 }
};
```

### 🔄 災害復旧テスト (Disaster Recovery Tests)
**ファイル**: `tests/integration/disaster-recovery/disaster-recovery-test-suite.ts`

#### 対象範囲
- **フェイルオーバーテスト自動化**: 自動切り替え機能の検証
- **データ整合性テスト**: レプリケーション品質の確認
- **RTO/RPO検証**: 復旧時間・復旧ポイント目標の達成確認

#### 災害復旧ペア
| プライマリ | セカンダリ | RTO | RPO | タイプ |
|------------|------------|-----|-----|--------|
| 東京 | 大阪 | 4時間 | 1時間 | Active-Passive |
| バージニア | オレゴン | 8時間 | 2時間 | Backup |
| アイルランド | フランクフルト | 6時間 | 1.5時間 | Backup |

#### データレプリケーション
- **DynamoDB Global Tables**: リアルタイム同期
- **FSx SnapMirror**: ファイルシステムレプリケーション
- **OpenSearch**: クロスリージョンレプリケーション

### 📋 コンプライアンステスト (Compliance Tests)
**ファイル**: `tests/integration/compliance/compliance-test-suite.ts`

#### 対象範囲
- **地域別法規制準拠**: GDPR、SOX、HIPAA、LGPD等の要件確認
- **DPIA自動実行**: データ保護影響評価の自動化検証
- **データ主権**: 国境間データ転送制御の確認

#### コンプライアンスフレームワーク
```typescript
const complianceFrameworks = {
  GDPR: ['right-to-be-forgotten', 'data-portability', 'consent-management'],
  SOX: ['financial-controls', 'audit-trail', 'data-integrity'],
  HIPAA: ['phi-protection', 'access-control', 'breach-notification'],
  LGPD: ['consent-management', 'data-protection', 'breach-notification']
};
```

## 実行方法

### 基本実行
```bash
# 全統合テストの実行
npm run test:integration

# 特定のテストスイート実行
npm run test:integration -- --suite=regional
npm run test:integration -- --suite=disaster-recovery
npm run test:integration -- --suite=compliance

# カバレッジ付き実行
npm run test:integration -- --coverage

# 詳細ログ付き実行
npm run test:integration -- --verbose

# 失敗時即座停止
npm run test:integration -- --bail
```

### 高度なオプション
```bash
# 並列実行（対応テストのみ）
npm run test:integration -- --parallel

# タイムアウト設定
npm run test:integration -- --timeout=1800000

# 特定地域のみテスト
npm run test:integration -- --suite=regional --region=ap-northeast-1
```

## テスト結果の解釈

### 成功基準
- **全体成功率**: 95%以上
- **地域別デプロイメント**: 90%以上の地域で成功
- **災害復旧**: RTO/RPO要件の100%達成
- **コンプライアンス**: 各フレームワーク95%以上の準拠

### 結果サマリー例
```
📊 テスト結果サマリー:
実行時間: 1247.3秒
テストスイート: 3/3 成功
テストケース: 142/145 成功
失敗: 3 テスト

📋 詳細結果:
✅ regional-deployment-test-suite.ts: 48/50 成功 (456.2秒)
✅ disaster-recovery-test-suite.ts: 36/36 成功 (389.7秒)
✅ compliance-test-suite.ts: 58/59 成功 (401.4秒)

🏆 総合成功率: 97.9%
```

## トラブルシューティング

### よくある問題

#### 1. AWS認証エラー
```bash
# AWS認証情報の確認
aws configure list

# プロファイル設定
export AWS_PROFILE=your-profile

# 認証情報の設定
aws configure --profile your-profile
```

#### 2. タイムアウトエラー
```bash
# タイムアウト時間の延長
npm run test:integration -- --timeout=3600000  # 1時間

# 個別テストの実行
npm run test:integration -- --suite=regional
```

#### 3. 地域別デプロイメント失敗
```bash
# 特定地域のリソース確認
aws cloudformation describe-stacks --region ap-northeast-1

# サービス制限の確認
aws service-quotas get-service-quota --service-code lambda --quota-code L-B99A9384
```

#### 4. メモリ不足エラー
```bash
# Node.jsメモリ制限の増加
export NODE_OPTIONS="--max-old-space-size=8192"

# テストの分割実行
npm run test:integration -- --suite=regional
npm run test:integration -- --suite=disaster-recovery
npm run test:integration -- --suite=compliance
```

### ログ分析

#### テスト実行ログ
```bash
# 詳細ログの確認
npm run test:integration -- --verbose > test-output.log 2>&1

# エラーログの抽出
grep "❌\|ERROR\|FAIL" test-output.log

# 成功率の確認
grep "成功率\|success rate" test-output.log
```

#### Jest出力の解析
```bash
# Jest詳細レポート
npx jest --verbose --reporters=default --reporters=jest-html-reporters

# カバレッジレポート
npx jest --coverage --coverageReporters=html
open coverage/index.html
```

## CI/CD統合

### GitHub Actions設定
```yaml
name: Integration Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-suite: [regional, disaster-recovery, compliance]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Run integration tests
        run: npm run test:integration -- --suite=${{ matrix.test-suite }}
        timeout-minutes: 30
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.test-suite }}
          path: test-results/
```

### 品質ゲート統合
```bash
# 品質ゲートでの統合テスト実行
npm run quality-gate:integration

# 最小成功率の設定
export MIN_SUCCESS_RATE=95

# 失敗時の自動ロールバック
if [ $SUCCESS_RATE -lt $MIN_SUCCESS_RATE ]; then
  npm run rollback:deployment
fi
```

## パフォーマンス最適化

### テスト実行時間の短縮
1. **並列実行の活用**: 独立したテストの並列実行
2. **テスト分割**: 大きなテストスイートの分割
3. **モック活用**: 外部依存関係のモック化
4. **キャッシュ利用**: CDK合成結果のキャッシュ

### リソース使用量の最適化
```bash
# メモリ使用量の監視
npm run test:integration -- --detectOpenHandles --logHeapUsage

# 並列実行数の調整
npm run test:integration -- --maxWorkers=4

# タイムアウトの最適化
npm run test:integration -- --timeout=600000
```

## ベストプラクティス

### 1. テスト設計
- **独立性**: テスト間の依存関係を排除
- **冪等性**: 何度実行しても同じ結果
- **明確性**: テストの目的と期待結果を明確化

### 2. エラーハンドリング
- **詳細なエラーメッセージ**: 問題の特定を容易に
- **適切なタイムアウト**: 地域やテスト内容に応じた設定
- **リトライ機能**: 一時的な障害への対応

### 3. 保守性
- **モジュール化**: 共通機能の再利用
- **設定外部化**: ハードコードの排除
- **ドキュメント**: テストの目的と手順の明記

## まとめ

統合テストスイートにより、Permission-aware RAG Systemは以下を保証します：

- ✅ **グローバル展開品質**: 14地域での確実なデプロイメント
- ✅ **災害復旧能力**: RTO/RPO要件の確実な達成
- ✅ **コンプライアンス準拠**: 地域別法規制の100%準拠
- ✅ **パフォーマンス**: 地域別目標値の確実な達成
- ✅ **運用品質**: 24/7安定稼働の保証

このテストスイートにより、世界最高レベルの品質でグローバル展開が可能になります。