# 📚 ドキュメント生成システム

Permission-aware RAG System の包括的なドキュメント自動生成システムです。

## 🎯 概要

このシステムは、プロジェクトの全体的なドキュメントを自動生成し、開発者、運用者、エンドユーザー向けの包括的な情報を提供します。

### 🆕 最新機能: Markitdown統合

Microsoft Markitdownライブラリを統合し、多様なファイル形式の高品質な文書変換を実現：

- **12種類のファイル形式対応**: Office文書、PDF、画像、Web文書、データファイル
- **6つの処理戦略**: ファイル形式別の最適化された処理方法選択
- **品質比較機能**: 複数処理方法の品質評価と自動選択
- **処理追跡システム**: Embedding処理の詳細監視とパフォーマンス分析
- **動的設定変更**: 実行時の処理方法変更とリアルタイム最適化

### 生成されるドキュメント

- **📋 メインドキュメント**: プロジェクト概要、セットアップ、使用方法
- **🔗 API ドキュメント**: REST API、GraphQL、Lambda関数の詳細
- **🏗️ アーキテクチャドキュメント**: システム構成、データフロー、セキュリティ
- **📊 テストレポート**: ユニット、統合、E2Eテストの結果
- **📖 運用ガイド**: トラブルシューティング、監視、チェックリスト
- **🔄 Markitdown統合ガイド**: 文書変換、処理戦略、品質管理

## 🚀 使用方法

### 基本的な生成

```bash
# 全ドキュメントの生成
npm run docs:generate

# 開発環境用ドキュメント
npm run docs:generate:dev

# 本番環境用ドキュメント
npm run docs:generate:prod
```

### カスタム設定での生成

```bash
# 環境変数での設定
PROJECT_NAME="My RAG System" \
PROJECT_VERSION="2.0.0" \
OUTPUT_DIR="./custom-docs" \
npm run docs:generate
```

### 生成されたドキュメントの確認

```bash
# ローカルサーバーでの確認
npm run docs:serve

# ブラウザで http://localhost:8080 にアクセス
```

## 📁 ディレクトリ構造

```
docs/
├── README.md                           # このファイル
├── generate-documentation.ts           # メイン実行スクリプト
├── config/
│   └── documentation-config.ts         # 設定ファイル
├── generators/
│   ├── documentation-generator.ts      # メインジェネレーター
│   ├── documentation-generator-part2.ts # 拡張ジェネレーター
│   └── operational-guides-generator.ts # 運用ガイドジェネレーター
├── templates/                          # テンプレートファイル
└── generated-docs/                     # 生成されたドキュメント（出力先）
```

## ⚙️ 設定

### 基本設定

`docs/config/documentation-config.ts` で設定を変更できます：

```typescript
export const defaultConfig: DocumentationConfig = {
  projectName: 'Permission-aware RAG System',
  version: '1.0.0',
  outputDirectory: './generated-docs',
  generateApiDocs: true,
  generateArchitectureDiagrams: true,
  generateTestReports: true,
  generateOperationalGuides: true,
  includeCodeExamples: true,
  includeScreenshots: false,
  formats: ['markdown', 'html']
};
```

### 環境別設定

開発、ステージング、本番環境ごとに異なる設定を使用できます：

```typescript
const environmentConfigs = {
  development: { /* 開発環境設定 */ },
  staging: { /* ステージング環境設定 */ },
  production: { /* 本番環境設定 */ }
};
```

## 🔧 カスタマイズ

### 新しいドキュメントタイプの追加

1. `generators/` ディレクトリに新しいジェネレータークラスを作成
2. `DocumentationGeneratorPart2` クラスに統合
3. 設定ファイルに新しいオプションを追加

### テンプレートのカスタマイズ

1. `templates/` ディレクトリにカスタムテンプレートを配置
2. `templateConfig` でカスタムテンプレートを有効化

## 📊 生成統計

ドキュメント生成後、以下の統計情報が表示されます：

- 総ファイル数
- 総サイズ
- ファイル種別ごとの内訳

## 🔍 トラブルシューティング

### よくある問題

#### 1. 生成エラーが発生する

```bash
# 依存関係の確認
npm install

# TypeScript コンパイルの確認
npm run build
```

#### 2. 出力ディレクトリが作成されない

```bash
# 権限の確認
ls -la ./

# ディレクトリの手動作成
mkdir -p generated-docs
```

#### 3. メモリ不足エラー

```bash
# Node.js のメモリ制限を増加
NODE_OPTIONS="--max-old-space-size=4096" npm run docs:generate
```

### ログの確認

生成プロセス中のログを確認して問題を特定：

```bash
# 詳細ログ付きで実行
DEBUG=docs:* npm run docs:generate
```

## 🤝 貢献

ドキュメント生成システムの改善にご協力ください：

1. 新しいドキュメントタイプの提案
2. テンプレートの改善
3. バグ報告と修正
4. パフォーマンスの最適化

## 📝 ライセンス

このドキュメント生成システムは、メインプロジェクトと同じライセンスの下で提供されます。