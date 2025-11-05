# Markitdown統合機能テストスイート

このディレクトリには、Markitdown統合機能の包括的なテストスイートが含まれています。

## テストの種類

### 1. 単体テスト (`test_markitdown_integration.py`)
- 各コンポーネントの個別機能テスト
- モックを使用した独立したテスト
- 高速実行、依存関係なし

### 2. 統合テスト (`test_integration.py`)
- コンポーネント間の連携テスト
- エンドツーエンドフローテスト
- モックAWSサービスを使用

### 3. AWS統合テスト (`integration_test_runner.py`)
- 実際のAWSサービスを使用
- 本格的な統合テスト
- 実環境での動作確認

## テスト実行方法

### 全テスト実行
```bash
# 全テストを実行
python3 run_all_tests.py

# 詳細出力付き
python3 run_all_tests.py --verbose

# 特定のテストをスキップ
python3 run_all_tests.py --skip-unit --skip-integration
python3 run_all_tests.py --skip-aws
```

### 個別テスト実行
```bash
# 単体テストのみ
python3 test_markitdown_integration.py

# 統合テストのみ
python3 test_integration.py

# AWS統合テストのみ
python3 integration_test_runner.py --region us-east-1 --environment test
```

### テストデータ生成
```bash
# テスト用サンプルファイル生成
python3 test_data/sample_documents.py
```

## 必要な依存関係

```bash
pip install boto3 moto unittest-xml-reporting
```

## 環境変数

テスト実行時に以下の環境変数を設定できます：

```bash
export AWS_REGION=us-east-1
export ENVIRONMENT=test
export LOG_LEVEL=DEBUG
export MARKITDOWN_CONFIG_PATH=/path/to/config.json
```

## テスト設定

### AWS統合テスト設定
- **リージョン**: `--region` オプションで指定（デフォルト: us-east-1）
- **環境**: `--environment` オプションで指定（デフォルト: test）
- **タイムアウト**: 各テストに適切なタイムアウトを設定

### テストデータ
- `test_data/sample_documents.py`: 各種ファイル形式のサンプル生成
- PDF、DOCX、TXT、大容量ファイル、日本語ファイルなど

## テスト結果

### レポート出力
- JSON形式の詳細レポート生成
- 実行時間、成功率、エラー詳細を含む
- `comprehensive_test_report.json` に保存

### ログ出力
- 構造化ログによる詳細な実行ログ
- CloudWatchメトリクス送信（AWS統合テスト時）
- エラー詳細とスタックトレース

## トラブルシューティング

### よくある問題

1. **依存関係エラー**
   ```bash
   pip install -r requirements.txt
   ```

2. **AWS認証エラー**
   ```bash
   aws configure
   # または
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   ```

3. **Lambda関数が見つからない**
   - テスト環境でLambda関数がデプロイされていることを確認
   - 関数名が正しいことを確認

4. **S3バケットアクセスエラー**
   - 適切なIAM権限があることを確認
   - バケット名の重複を避ける

### デバッグ方法

```bash
# 詳細ログ出力
python3 run_all_tests.py --verbose

# 特定のテストのみ実行
python3 test_integration.py TestEndToEndProcessing.test_complete_document_processing_flow

# AWS統合テストのデバッグ
python3 integration_test_runner.py --verbose --environment debug
```

## テスト拡張

新しいテストを追加する場合：

1. **単体テスト**: `test_markitdown_integration.py` にテストクラスを追加
2. **統合テスト**: `test_integration.py` にテストケースを追加
3. **AWS統合テスト**: `integration_test_runner.py` にシナリオを追加

### テストクラス命名規則
- `Test{ComponentName}`: 単体テスト
- `Test{Feature}Integration`: 統合テスト
- `Test{Scenario}`: シナリオテスト

## CI/CD統合

### GitHub Actions例
```yaml
- name: Run Markitdown Tests
  run: |
    cd lambda/documentprocessor/tests
    python3 run_all_tests.py --skip-aws
```

### Jenkins例
```groovy
stage('Markitdown Tests') {
    steps {
        dir('lambda/documentprocessor/tests') {
            sh 'python3 run_all_tests.py'
        }
    }
}
```

## パフォーマンス基準

- **単体テスト**: 各テスト < 5秒
- **統合テスト**: 全体 < 15分
- **AWS統合テスト**: 全体 < 30分
- **大容量ファイル処理**: < 60秒
- **メモリ使用量**: < 512MB増加

## セキュリティ考慮事項

- テスト用の機密情報は環境変数で管理
- テスト後のリソースクリーンアップを確実に実行
- 本番環境でのテスト実行は禁止
- テストデータに実際の機密情報を含めない