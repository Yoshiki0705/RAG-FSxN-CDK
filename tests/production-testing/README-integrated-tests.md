# 統合テストスイート

セキュリティ、パフォーマンス、機能テストを統合実行する包括的なテストシステムです。

## 🎯 概要

統合テストスイートは、本番環境での包括的なシステム検証を実行し、以下の3つの主要テスト領域を統合します：

- **🔒 セキュリティテスト**: 暗号化、認証・認可、脆弱性スキャン
- **⚡ パフォーマンステスト**: 負荷テスト、スケーラビリティテスト、アップタイム監視
- **🔧 機能テスト**: UI テスト、API テスト、統合テスト

## 🚀 クイックスタート

### 基本実行

```bash
# 開発環境での実行
npm run test:integrated

# 本番環境での実行
NODE_ENV=production npm run test:integrated

# ステージング環境での実行
NODE_ENV=staging npm run test:integrated
```

### 環境変数設定

```bash
# 必須環境変数
export NODE_ENV=production
export AWS_REGION=us-east-1
export PROJECT_NAME=rag-system
export DOMAIN_NAME=your-domain.com

# オプション環境変数
export AWS_ACCOUNT_ID=123456789012
export CERTIFICATE_ARN=arn:aws:acm:...
export HOSTED_ZONE_ID=Z1234567890ABC
```

## 📋 テストスイート設定

### 環境別設定

#### 本番環境 (Production)
- **実行方式**: 順次実行（安全性重視）
- **テストスイート**: セキュリティ → 機能 → パフォーマンス
- **リソース制限**: 厳格（CPU 70%, メモリ 80%）
- **コスト上限**: $50

#### ステージング環境 (Staging)
- **実行方式**: 並列実行（効率性重視）
- **テストスイート**: 全テスト + 侵入テスト
- **リソース制限**: 緩和（CPU 85%, メモリ 90%）
- **コスト上限**: $100

#### 開発環境 (Development)
- **実行方式**: 並列実行（高速実行）
- **テストスイート**: 基本テストのみ
- **リソース制限**: 最小限
- **コスト上限**: $200

#### CI/CD環境
- **実行方式**: 並列実行（高速 + 確実性）
- **テストスイート**: 必要最小限
- **失敗時**: 後続テストをスキップ
- **レポート**: JSON + HTML

## 🔧 設定カスタマイズ

### テストスイート設定

```typescript
// config/integrated-test-config.ts
export const customTestConfig: IntegratedTestConfig = {
  environment: 'custom',
  testSuites: [
    {
      name: 'security',
      enabled: true,
      priority: 100,
      dependencies: [],
      criticalTest: true,
      skipOnFailure: false
    }
  ],
  parallelExecution: true,
  maxConcurrentTests: 2,
  timeoutMs: 3600000
};
```

### リソース制限設定

```typescript
resourceLimits: {
  maxCpuUsage: 70,        // CPU使用率上限
  maxMemoryUsage: 80,     // メモリ使用率上限
  maxNetworkBandwidth: 100, // ネットワーク帯域上限
  maxStorageUsage: 10,    // ストレージ使用量上限
  maxCostThreshold: 50.0  // コスト上限
}
```

## 📊 テスト結果とレポート

### 結果の評価基準

#### 総合スコア
- **95-100点**: 🏆 優秀 - 最高レベルの品質
- **85-94点**: ✅ 良好 - 高い品質を維持
- **75-84点**: ⚠️ 注意 - 改善が必要
- **60-74点**: 🚨 警告 - 重要な問題あり
- **0-59点**: 💥 危険 - 深刻な問題あり

#### 分野別評価
- **🔒 セキュリティ**: 80点未満で要改善
- **⚡ パフォーマンス**: 75点未満で要最適化
- **🔧 機能**: 90点未満で要修正

### レポート形式

#### JSON レポート
```json
{
  "testRunId": "integrated-test-1234567890",
  "overallSuccess": true,
  "summary": {
    "overallScore": 88.5,
    "totalTests": 148,
    "passedTests": 142,
    "failedTests": 6
  }
}
```

#### HTML レポート
- 視覚的なダッシュボード
- グラフとチャート
- 詳細な結果表示

#### CSV レポート
- スプレッドシート用データ
- 統計分析用フォーマット

## 🔍 トラブルシューティング

### よくある問題

#### 1. 認証エラー
```bash
# AWS認証情報の確認
aws sts get-caller-identity

# プロファイル設定
export AWS_PROFILE=your-profile
```

#### 2. タイムアウトエラー
```bash
# タイムアウト時間の延長
export TEST_TIMEOUT=7200000  # 2時間
```

#### 3. リソース不足エラー
```bash
# リソース制限の緩和
export MAX_CPU_USAGE=90
export MAX_MEMORY_USAGE=95
```

### ログの確認

```bash
# 詳細ログの有効化
export ENABLE_DETAILED_LOGGING=true

# ログファイルの確認
tail -f ./test-reports/integrated-test-*.log
```

## 🛠️ 開発者向け情報

### アーキテクチャ

```
統合テストランナー
├── セキュリティテストランナー
│   ├── エンドツーエンド暗号化テスト
│   └── 認証・認可テスト
├── パフォーマンステストランナー
│   ├── 負荷テスト
│   ├── スケーラビリティテスト
│   └── アップタイム監視テスト
└── 機能テストランナー
    ├── UIテスト
    ├── APIテスト
    └── 統合テスト
```

### 新しいテストスイートの追加

1. テストランナーの実装
```typescript
export class CustomTestRunner {
  async runCustomTests(): Promise<CustomTestResult> {
    // テスト実装
  }
}
```

2. 統合テストランナーへの追加
```typescript
// integrated-test-runner.ts
case 'custom':
  return await this.runCustomTests();
```

3. 設定の追加
```typescript
// integrated-test-config.ts
testSuites: [
  {
    name: 'custom',
    enabled: true,
    priority: 70
  }
]
```

### テスト結果の拡張

```typescript
export interface CustomTestResult {
  success: boolean;
  summary: {
    customMetric: number;
    customRecommendations: string[];
  };
}
```

## 📈 メトリクスと監視

### 収集されるメトリクス

- **実行時間**: 各テストスイートの実行時間
- **リソース使用量**: CPU、メモリ、ネットワーク、ストレージ
- **コスト**: AWS リソースの推定コスト
- **成功率**: テストの成功/失敗率
- **カバレッジ**: 各分野のテストカバレッジ

### 監視とアラート

- **緊急停止**: リソース使用量やコストが上限を超えた場合
- **品質アラート**: スコアが閾値を下回った場合
- **失敗通知**: 重要なテストが失敗した場合

## 🔗 関連ドキュメント

- [セキュリティテスト詳細](./modules/security/README.md)
- [パフォーマンステスト詳細](./modules/performance/README.md)
- [機能テスト詳細](./modules/functional/README.md)
- [本番環境設定](./config/README.md)

## 📞 サポート

問題が発生した場合は、以下の情報を含めてお問い合わせください：

1. 実行環境（本番/ステージング/開発）
2. エラーメッセージ
3. テスト実行ID
4. 設定ファイル
5. ログファイル

---

**注意**: 本番環境でのテスト実行は慎重に行い、必要に応じて事前にステージング環境での検証を実施してください。