# 開発者セットアップガイド

## 📋 概要

Permission-aware RAG System の新規開発者向けセットアップガイドです。統合継続監視システムが稼働中のため、適切な開発環境構築が重要です。

## 🎯 重要な前提知識

### 統合継続監視システム（稼働中）

このプロジェクトには**史上最高の統合継続監視システム**が実装されており、以下が自動実行されています：

- **平置きファイル監視**: プロジェクトルートへの不適切なファイル配置を自動検出
- **自動分類**: 検出されたファイルの適切なディレクトリへの自動移動
- **品質保証**: Agent Steering準拠率100%の継続維持
- **24時間監視**: ローカル・EC2両環境での継続監視

### ⚠️ 開発時の注意事項

1. **平置きファイル禁止**: プロジェクトルートに直接ファイルを配置しない
2. **Agent Steering準拠**: ファイル配置ガイドラインに従う
3. **監視システム維持**: launchd/cronサービスの変更禁止

## 🚀 セットアップ手順

### 1. 環境準備

#### 必要なソフトウェア
```bash
# Node.js 20+ のインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# AWS CLI v2 のインストール
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# AWS CDK のインストール
npm install -g aws-cdk@latest
```

#### AWS認証設定
```bash
# AWSプロファイル設定
aws configure --profile your-profile
# Access Key ID: [your-access-key]
# Secret Access Key: [your-secret-key]
# Default region: [your-region]
# Default output format: json
```

### 2. プロジェクトセットアップ

#### リポジトリクローン
```bash
git clone <repository-url>
cd Permission-aware-RAG-FSxN-CDK
```

#### 依存関係インストール
```bash
npm install
```

#### 設定ファイル準備
```bash
# 設定テンプレートをコピー（適切なディレクトリに配置）
cp config.template.ts config.ts
# config.ts を環境に合わせて編集

# 環境変数テンプレートをコピー
cp .env.template .env
# .env を環境に合わせて編集
```

### 3. 開発環境確認

#### 統合継続監視システム確認
```bash
# ローカル環境監視システム確認
launchctl list | grep com.project.file-organization

# 期待される出力:
# com.project.file-organization.watch (終了コード0)
# com.project.file-organization.report (終了コード0)
```

#### プロジェクト構造確認
```bash
# 平置きファイル数確認（0個であることを確認）
find . -maxdepth 1 -type f \( -name "*.sh" -o -name "*.md" -o -name "*.ts" -o -name "*.js" \) | wc -l

# 期待される出力: 0
```

### 4. 開発環境テスト

#### CDK環境テスト
```bash
# CDK Bootstrap（初回のみ）
cdk bootstrap --profile your-profile

# CDK構文チェック
cdk synth --profile your-profile
```

#### 統合テスト実行
```bash
# 基本統合テスト
./development/scripts/testing/quick_integration_test.sh

# 品質チェック
./development/scripts/utilities/security_check.sh
```

## 📁 ファイル配置ルール

### ✅ 正しい配置

```bash
# スクリプトファイル
development/scripts/
├── sync/           # 同期スクリプト
├── implementation/ # 実装スクリプト
├── fixes/          # 修正スクリプト
├── checks/         # 確認スクリプト
├── deployment/     # デプロイスクリプト
├── testing/        # テストスクリプト
├── debugging/      # デバッグスクリプト
└── utilities/      # ユーティリティスクリプト

# ドキュメントファイル
development/docs/
├── reports/        # プロジェクトレポート
├── phases/         # フェーズ別記録
├── completion/     # 完了記録
├── guides/         # 内部ガイド
└── troubleshooting/ # トラブルシューティング

# 設定ファイル
development/configs/
├── dev/            # 開発環境設定
├── staging/        # ステージング環境設定
└── prod/           # 本番環境設定
```

### ❌ 禁止される配置

```bash
# プロジェクトルートへの直接配置（自動検出・移動される）
./script.sh         # ❌ 禁止
./document.md       # ❌ 禁止
./config.json       # ❌ 禁止
./test.ts           # ❌ 禁止
```

## 🔧 開発ワークフロー

### 1. 新機能開発

```bash
# 1. フィーチャーブランチ作成
git checkout -b feature/new-feature

# 2. 適切なディレクトリにファイル作成
# 例: 新しい実装スクリプト
touch development/scripts/implementation/implement_new_feature.sh

# 3. 開発・テスト
# ...

# 4. 品質チェック
./development/scripts/utilities/security_check.sh

# 5. コミット・プッシュ
git add .
git commit -m "Add new feature implementation"
git push origin feature/new-feature
```

### 2. 監視システムとの連携

```bash
# 監視ログ確認
tail -f monitoring/logs/cron-watch.log

# 日次レポート確認
cat monitoring/logs/daily-report-$(date +%Y%m%d).log

# 平置きファイル検出時の対応
# → 自動分類されるため、通常は対応不要
# → ログで移動先を確認可能
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. 平置きファイルが検出される
```bash
# 原因: プロジェクトルートに直接ファイルを配置
# 対処: 自動分類されるため通常は対応不要
# 確認: 監視ログで移動先を確認
tail -f monitoring/logs/cron-watch.log
```

#### 2. 監視システムが停止している
```bash
# ローカル環境確認
launchctl list | grep com.project.file-organization

# 再起動（必要に応じて）
launchctl load ~/Library/LaunchAgents/com.project.file-organization.watch.plist
launchctl load ~/Library/LaunchAgents/com.project.file-organization.report.plist
```

#### 3. Agent Steering準拠率が低下
```bash
# 品質チェック実行
./development/scripts/utilities/security_check.sh

# ファイル配置確認
find . -maxdepth 1 -type f \( -name "*.sh" -o -name "*.md" -o -name "*.ts" \) | wc -l
```

## 📞 サポート・連絡先

### 技術サポート
- **統合継続監視システム**: 自動運用中（人的介入不要）
- **品質チェック**: `./development/scripts/utilities/security_check.sh`
- **ドキュメント**: `docs/` ディレクトリ参照

### 緊急時対応
- **監視システム停止**: launchd/cronサービス確認
- **品質低下**: Agent Steeringガイドライン確認
- **ファイル配置問題**: 自動分類システムが対応

## 🎯 開発成功のポイント

1. **Agent Steering準拠**: ファイル配置ガイドラインを厳守
2. **監視システム理解**: 自動化されたシステムの動作を理解
3. **適切な配置**: development/ 配下の適切なディレクトリを使用
4. **品質チェック**: 定期的な品質チェック実行
5. **ログ確認**: 監視ログでシステム状況を把握

## 🏆 期待される開発体験

- **平置きファイル0個**: 常にクリーンなプロジェクト構造
- **自動品質保証**: Agent Steering準拠率100%維持
- **24時間監視**: 継続的な品質保証
- **完全自動化**: 手動メンテナンス不要
- **高品質開発**: 業界最高水準の開発環境

---

**最終更新**: 2025年10月5日  
**監視システム**: 稼働中（24時間体制）  
**品質レベル**: 史上最高