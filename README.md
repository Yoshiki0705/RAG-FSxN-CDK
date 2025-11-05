# 🌍 Permission-aware RAG System with FSx for NetApp ONTAP

## 📋 概要

Amazon FSx for NetApp ONTAPとAmazon Bedrockを組み合わせた、**モジュラーアーキテクチャ**と**マルチリージョン対応**を基盤とした権限認識型RAGシステムです。世界14リージョンでのグローバル展開とデータ主権要件への準拠を実現します。

### 🎯 主な特徴

#### 🏗️ モジュラーアーキテクチャ
- **9つの機能別モジュール**: networking・security・storage・database・compute・ai・api・monitoring・enterprise
- **6つの統合CDKスタック**: NetworkingStack・SecurityStack・DataStack・EmbeddingStack・WebAppStack・OperationsStack
- **選択的デプロイメント**: 必要な機能のみを選択してデプロイ可能
- **Agent Steering準拠**: 開発規約の自動強制・品質保証

#### 🌍 マルチリージョン対応
- **世界14リージョン**: 日本・APAC・EU・US・南米での展開
- **データ主権準拠**: 各地域のデータ保護法規制への自動対応
- **災害復旧**: 東京⇔大阪間の自動フェイルオーバー（RTO: 4時間、RPO: 1時間）
- **コンプライアンス自動適用**: GDPR・SOX・HIPAA・個人情報保護法等

#### 🚀 エンタープライズ機能
- **🔐 高度権限制御システム**: 時間ベース制限・地理的制限・動的権限制御・リアルタイム監査ログ ⭐ **実装完了**
- **⏰ 時間ベース制限**: 営業時間（平日 9:00-18:00）・緊急アクセス・祝日制限
- **🌍 地理的制限**: IP地理情報・国家制限・VPN検出・リスクベース認証
- **🔒 動的権限制御**: プロジェクト参加・一時的アクセス・組織階層・自動失効
- **📊 リアルタイム監査**: 全アクセス記録・CloudWatch統合・セキュリティダッシュボード
- **権限ベースアクセス制御**: ユーザー固有の文書アクセス権限管理
- **高精度検索**: OpenSearch Serverless ベクトル検索
- **高性能ストレージ**: FSx for NetApp ONTAP
- **AI統合**: Amazon Bedrock・4パターン選択式Embedding処理
- **レスポンシブUI**: Next.js + React + Tailwind CSS（高度権限制御UI統合済み）
- **サーバーレスアーキテクチャ**: AWS Lambda + CloudFront配信

### 🎯 モジュラーアーキテクチャの価値

このモジュラーアーキテクチャ統合により、以下の価値を実現します：

- **開発効率向上**: 機能別に整理されたコードベースで効率的な開発作業
- **選択的デプロイメント**: DevOpsエンジニアが必要な機能のみを選択的にデプロイ
- **グローバル展開**: マルチリージョン対応とデータ主権要件への準拠
- **エンタープライズ対応**: 保守性・スケーラビリティを重視した設計
- **Phase系命名の廃止**: 直感的で機能別の命名規則への統一

## 🏗️ モジュラーアーキテクチャ

### 7つの統合CDKスタック

```
Permission-aware RAG System
├── 🌐 NetworkingStack           # VPC・サブネット・ゲートウェイ・セキュリティグループ
├── 🔒 SecurityStack             # IAM・KMS・WAF・GuardDuty・コンプライアンス
├── 💾 DataStack                 # S3・FSx・DynamoDB・OpenSearch・バックアップ
├── ⚡ EmbeddingStack            # Lambda・Batch・ECS・Bedrock・AI機能
├── 🌍 WebAppStack               # API Gateway・CloudFront・Cognito・Next.js
├── 🔐 AdvancedPermissionStack   # 高度権限制御システム ⭐ NEW
└── 📊 OperationsStack           # CloudWatch・X-Ray・SNS・エンタープライズ機能
```

### 9つの機能別モジュール

```
lib/modules/
├── networking/     # ネットワーク基盤（VPC・サブネット・ゲートウェイ）
├── security/       # セキュリティ統合（IAM・KMS・WAF・GuardDuty）
├── storage/        # ストレージ管理（S3・FSx・EFS・バックアップ）
├── database/       # データベース管理（DynamoDB・OpenSearch・RDS）
├── compute/        # コンピュート機能（Lambda・Batch・ECS・自動スケーリング）
├── ai/             # AI・機械学習（Bedrock・Embedding・RAGパイプライン）
├── api/            # API・認証（API Gateway・Cognito・CloudFront）
├── monitoring/     # 監視・ログ（CloudWatch・X-Ray・SNS・アラート）
└── enterprise/     # エンタープライズ機能（高度権限制御・BI・組織管理） ⭐ 強化
```

### 🎯 モジュラーアーキテクチャの価値実現

#### 開発者体験の革新
- **機能別整理**: 9つの機能別モジュールによる直感的なコードベース
- **Phase系命名廃止**: networking、security、compute等の分かりやすい命名
- **効率的作業**: 機能領域が明確で迷いのない開発プロセス

#### DevOps運用の最適化
- **選択的デプロイメント**: 必要な機能のみを選択してデプロイ可能
- **統合CDKスタック**: 6つの統合スタックによる運用簡素化
- **段階的展開**: リスク最小化した段階的システム展開

#### グローバル展開対応
- **マルチリージョン**: 世界14リージョンでの展開可能
- **データ主権準拠**: 各地域のデータ保護法規制への自動対応
- **災害復旧**: 東京⇔大阪間の自動フェイルオーバー（RTO: 4時間、RPO: 1時間）

### 🎯 モジュール実装状況（Agent Steering準拠）

#### 完全実装済みモジュール ✅

| モジュール | 実装状況 | 主要機能 | 統合スタック |
|------------|----------|----------|--------------|
| **🌐 networking** | ✅ **完了** | VPC・サブネット・ゲートウェイ・セキュリティグループ | NetworkingStack |
| **🔒 security** | ✅ **完了** | IAM・KMS・WAF・GuardDuty・コンプライアンス | SecurityStack |
| **💾 storage** | ✅ **完了** | S3・FSx・EFS・バックアップ・ライフサイクル | DataStack |
| **🗄️ database** | ✅ **完了** | DynamoDB・OpenSearch・RDS・移行・監視 | DataStack |
| **⚡ embedding** | ✅ **完了** | Embedding処理・Batch・ベクトル化・パイプライン | EmbeddingStack |
| **🤖 ai** | ✅ **完了** | Bedrock・LLM・Model・推論・チャット | EmbeddingStack |
| **🌍 api** | ✅ **完了** | API Gateway・Cognito・CloudFront・認証 | WebAppStack |
| **📊 monitoring** | ✅ **完了** | CloudWatch・X-Ray・SNS・ログ・アラート | OperationsStack |
| **🔐 enterprise** | ✅ **完了** | 高度権限制御・BI・組織管理・コンプライアンス | AdvancedPermissionStack |
| **🏢 enterprise** | ✅ **完了** | アクセス制御・BI・組織管理・コンプライアンス | OperationsStack |

#### 統合CDKスタック実装状況 ✅

| スタック | 実装状況 | 統合モジュール | 主要機能 | 個別デプロイ対応 |
|----------|----------|----------------|----------|------------------|
| **🌐 NetworkingStack** | ✅ **完了** | networking | VPC・サブネット・ゲートウェイ・セキュリティグループ | ✅ **完全対応** |
| **🔒 SecurityStack** | ✅ **完了** | security | IAM・KMS・WAF・GuardDuty・コンプライアンス | ✅ **完全対応** |
| **💾 DataStack** | ✅ **完了** | storage + database | S3・FSx・DynamoDB・OpenSearch・バックアップ | ✅ **完全対応** |
| **⚡ EmbeddingStack** | ✅ **完了** | compute + ai | Lambda・Batch・ECS・Bedrock・AI機能 | ✅ **完全対応** |
| **🌍 WebAppStack** | ✅ **完了** | api | API Gateway・CloudFront・Cognito・Next.js | ✅ **完全対応** |
| **🔐 AdvancedPermissionStack** | ✅ **完了** | enterprise | 高度権限制御・時間・地理・動的権限 | ✅ **完全対応** |
| **📊 OperationsStack** | ✅ **完了** | monitoring + enterprise | CloudWatch・X-Ray・SNS・エンタープライズ機能 | ✅ **完全対応** |

#### Agent Steering準拠統合アプリケーション ✅

**`bin/modular-integrated-app.js`** - 完全なAgent Steering準拠統合CDKアプリケーション

**統合機能**:
- ✅ **統一命名規則**: StackNamingGeneratorによる自動命名
- ✅ **モジュラーアーキテクチャ**: 9つの機能別モジュール統合
- ✅ **グローバルタグ管理**: 一貫したタグ戦略の自動適用
- ✅ **既存リソース統合**: VPC・サブネット等の既存インフラ活用
- ✅ **マルチリージョン対応**: 14リージョン対応設定管理

### 🎯 統合CDKスタック詳細仕様

#### 🌐 NetworkingStack - ネットワーク基盤統合
**統合モジュール**: `lib/modules/networking/`
- **VPC設計**: マルチAZ対応・災害復旧設定・CIDR自動計算
- **サブネット構成**: パブリック・プライベート・分離サブネット
- **ゲートウェイ**: インターネット・NAT・VPCエンドポイント
- **セキュリティグループ**: 最小権限原則・レイヤー別制御

#### 🔒 SecurityStack - セキュリティ統合
**統合モジュール**: `lib/modules/security/`
- **IAM統合**: ロール・ポリシー・最小権限原則・クロスアカウント
- **KMS統合**: キー管理・ローテーション・リージョン別暗号化
- **WAF統合**: WebACL・地理的制限・レート制限・AWS Managed Rules
- **GuardDuty統合**: 脅威検出・自動対応・通知統合
- **コンプライアンス**: 地域別法規制自動適用・監査ログ

#### 💾 DataStack - データ・ストレージ統合
**統合モジュール**: `lib/modules/storage/` + `lib/modules/database/`
- **S3統合**: バケット・ライフサイクル・バージョニング・暗号化
- **FSx統合**: NetApp ONTAP・高性能ファイルシステム・スナップショット
- **DynamoDB統合**: セッション管理・グローバルテーブル・バックアップ
- **OpenSearch統合**: ベクトル検索・インデックス管理・監視
- **バックアップ統合**: 自動バックアップ・ポイントインタイム復旧

#### ⚡ EmbeddingStack - Embedding・AI・コンピュート統合
**統合モジュール**: `lib/modules/embedding/` + `lib/modules/ai/`
- **Embedding統合**: ベクトル化・バッチ処理・FSx統合・SQLite負荷試験
- **Batch統合**: 大量ファイル処理・コスト最適化・ジョブ管理
- **ECS統合**: コンテナ・サービスメッシュ・自動スケーリング
- **Bedrock統合**: AI・機械学習・テキスト生成・Embedding
- **4パターン選択式Embedding処理**:
  - AWS Batch (推奨: 大量処理・高スループット)
  - EC2 Spot (推奨: コスト重視・90%削減)
  - ECS on EC2 (推奨: 運用性重視・統合管理)
  - EC2 On-Demand (非推奨: 高コスト・24/7稼働)

#### 🌍 WebAppStack - API・フロントエンド統合
**統合モジュール**: `lib/modules/api/`
- **API Gateway統合**: RESTful API・GraphQL・WebSocket・認証統合
- **Cognito統合**: ユーザー認証・認可・MFA・フェデレーション
- **CloudFront統合**: グローバルCDN・エッジ最適化・キャッシュ戦略
- **Next.js統合**: Lambda Web Adapter・SSR・PWA・レスポンシブUI

#### 📊 OperationsStack - 監視・エンタープライズ統合
**統合モジュール**: `lib/modules/monitoring/` + `lib/modules/enterprise/`
- **CloudWatch統合**: メトリクス・ログ・ダッシュボード・アラート
- **X-Ray統合**: 分散トレーシング・パフォーマンス分析・ボトルネック特定
- **SNS統合**: 通知・アラート・エスカレーション・レポート自動化
- **エンタープライズ統合**: アクセス制御・BI分析・組織管理・コンプライアンス

## 🌍 マルチリージョン対応（14リージョン）

### 🇯🇵 日本地域（災害復旧ペア）
- **東京（プライマリ）**: `ap-northeast-1`
  - **コンプライアンス**: 個人情報保護法・FISC安全対策基準
  - **特徴**: 最新サービス対応・高可用性・本番環境
- **大阪（セカンダリ）**: `ap-northeast-3`
  - **コンプライアンス**: 個人情報保護法・FISC安全対策基準
  - **特徴**: 災害復旧・自動フェイルオーバー（RTO: 4時間、RPO: 1時間）

### 🌏 APAC地域
| リージョン | コード | コンプライアンス | 特徴 |
|------------|--------|------------------|------|
| **シンガポール** | `ap-southeast-1` | PDPA | ASEAN地域ハブ |
| **シドニー** | `ap-southeast-2` | Privacy Act 1988 | オーストラリア・NZ対応 |
| **ムンバイ** | `ap-south-1` | DPDP Act | インド市場対応 |
| **ソウル** | `ap-northeast-2` | PIPA | 韓国市場対応 |

### 🇪🇺 EU地域（GDPR準拠）
| リージョン | コード | コンプライアンス | 特徴 |
|------------|--------|------------------|------|
| **アイルランド** | `eu-west-1` | GDPR | EU地域プライマリハブ |
| **フランクフルト** | `eu-central-1` | GDPR・BDSG | ドイツ・中欧対応 |
| **ロンドン** | `eu-west-2` | UK-GDPR・DPA 2018 | 英国市場対応 |
| **パリ** | `eu-west-3` | GDPR・Loi Informatique | フランス市場対応 |

### 🇺🇸 US地域
| リージョン | コード | コンプライアンス | 特徴 |
|------------|--------|------------------|------|
| **バージニア北部** | `us-east-1` | SOX・HIPAA・CCPA | 最大リージョン・最新サービス |
| **オレゴン** | `us-west-2` | SOX・HIPAA・CCPA | 西海岸対応・災害復旧ペア |
| **オハイオ** | `us-east-2` | SOX・HIPAA | 中部地域対応 |

### 🇧🇷 南米地域
- **サンパウロ**: `sa-east-1` - LGPD（ブラジル一般データ保護法）準拠

## 🎯 グローバル対応機能

### 選択的地域デプロイ
- 必要な地域のみ選択可能
- 地域別コンプライアンス自動対応
- データ主権・プライバシー要件準拠

### 災害復旧
- 東京⇔大阪間の自動フェイルオーバー
- RTO: 4時間以内、RPO: 1時間以内
- 地域間データレプリケーション

### 統合監視
- グローバル統合監視システム
- 地域別コンプライアンス監査
- 自動DPIA（データ保護影響評価）実行

## 🚀 クイックスタート

### 前提条件

- **Node.js 20+**: 最新LTSランタイム環境
- **AWS CDK v2**: TypeScript ベースのインフラ定義
- **AWS CLI**: 認証済みのAWSアカウント
- **Docker Desktop**: コンテナ機能（オプション）

### 基本セットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd Permission-aware-RAG-FSxN-CDK

# 依存関係インストール
npm install

# 環境変数設定
export AWS_PROFILE=user01
export AWS_REGION=ap-northeast-1
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=ap-northeast-1

# CDKブートストラップ（初回のみ）
npx cdk bootstrap
```

### 基本デプロイメント

```bash
# 全スタック一括デプロイ（東京リージョン）
cdk deploy --all \
  -c projectName=permission-aware-rag \
  -c environment=prod \
  -c region=ap-northeast-1

# 選択的スタックデプロイ
cdk deploy \
  -c enableNetworking=true \
  -c enableSecurity=true \
  -c enableData=false \
  -c enableCompute=false
```

### 前提条件

- Node.js 20+
- AWS CLI v2
- AWS CDK v2.129.0+
- Docker Desktop

### 🛠️ 開発環境設定（MCP統合・AI自動最適化）

#### VSCode設定最適化

**TypeScript自動タグ閉じ機能の無効化**:
```json
{
    "typescript.autoClosingTags": false
}
```

この設定により、TypeScript開発時の自動タグ閉じ機能が無効化され、手動でのタグ制御が可能になります。特にJSX/TSXファイルでの開発において、より精密なコード制御を実現します。

#### 🎯 元GitHub仕様準拠状況

**現在の実装品質**: 90/100点（詳細: `docs/ORIGINAL_GITHUB_SPECIFICATION_ANALYSIS.md`）

**✅ 完全準拠項目**:
- サインイン画面の2カラムレイアウト
- 認証対象ユーザー（testuser, admin, testuser0-49）
- チャットボットUI構造
- Next.js 14.2.16 + Tailwind CSS + Radix UI技術スタック
- AWS SDK v3 + LangChain統合

**🔧 改善対象項目**:
- Next.js Image最適化（+5点）
- 設定の完全外部化（+3点）
- テストカバレッジ向上（+2点）

**目標品質**: 95/100点

#### Kiro AI設定最適化（🆕 **最新機能**）

**モデル選択の自動化**:
```json
{
    "kiroAgent.modelSelection": "auto"
}
```

この設定により、Kiro AIエージェントが最適なモデルを自動選択します。タスクの複雑さや要求に応じて、Claude Sonnet、GPT-4、その他の利用可能なモデルから最適なものを動的に選択し、開発効率を最大化します。

**自動選択の利点**:
- ✅ **軽量タスク**: GPT-4o-mini等の高速モデルで1-2秒の高速処理
- ✅ **複雑タスク**: Amazon Nova Pro等の高性能モデルで高品質な分析・設計
- ✅ **コスト最適化**: タスクに応じた適切なモデル選択でコスト効率向上
- ✅ **開発体験**: モデル選択の手動管理不要で集中力維持

#### TypeScript設定最適化（🆕 **最新更新**）

**DOM型定義ライブラリの追加**:
```json
{
  "lib": [
    "es2022",
    "dom"
  ]
}
```

この設定により、フロントエンド開発時のDOM API型サポートが完全に提供され、Next.jsアプリケーション開発での型安全性とIntelliSense機能が大幅に向上しました。

**主な改善効果**:
- ✅ **DOM操作**: `document`、`window`、`HTMLElement`等の完全な型定義
- ✅ **Web API**: `fetch`、`localStorage`、`sessionStorage`等のブラウザAPI型サポート
- ✅ **イベント処理**: `addEventListener`、`Event`、`MouseEvent`等の型安全なイベント処理
- ✅ **Next.js統合**: Reactコンポーネントでの型安全なDOM操作

**詳細**: [TypeScript設定更新サマリー](docs/TYPESCRIPT_CONFIGURATION_UPDATE_SUMMARY.md)

#### TypeScript/JavaScript開発ツール統合

本プロジェクトでは、Kiro IDE環境でMCP（Model Context Protocol）サーバーを活用した高度な開発支援機能を提供しています。

**🔧 最新のMCP設定更新**: 不要なGit MCPサーバーを削除し、コア機能に集中した効率的な開発環境を実現（詳細: `docs/MCP_CONFIGURATION_UPDATE.md`）

**統合されたMCPサーバー**:
- **AWS Knowledge MCP**: AWS公式ドキュメント検索・読み込み
- **Fetch MCP**: URL取得・Webコンテンツ取得
- **Tavily Remote MCP**: Web検索・コンテンツ抽出
- **Chrome DevTools MCP**: ブラウザ自動化・テスト
- **Filesystem MCP**: ファイルシステム操作

**自動承認機能**:
```json
{
  "aws-knowledge-mcp-server": {
    "autoApprove": ["aws___search_documentation", "aws___read_documentation"]
  },
  "fetch": {
    "autoApprove": ["fetch_url"]
  },
  "tavily-remote-mcp": {
    "autoApprove": ["tavily_search", "tavily_extract"]
  },
  "chrome-devtools": {
    "autoApprove": ["list_pages", "navigate_page", "take_snapshot", "fill", "click", "wait_for", "take_screenshot", "select_page", "new_page", "list_network_requests"]
  },
  "filesystem": {
    "autoApprove": ["read_file", "write_file", "list_directory", "read_text_file", "edit_file"]
  }
}
```

**開発効率向上機能**:
- ✅ **AWS統合開発**: AWS公式ドキュメント・サービス情報の即座検索
- ✅ **Web情報取得**: リアルタイムWeb検索・最新技術情報取得
- ✅ **ブラウザ自動化**: Chrome DevToolsによる自動テスト・デバッグ
- ✅ **ファイル操作**: 高速ファイル読み書き・ディレクトリ操作
- 🤖 **AI自動最適化**: Kiro AIエージェントによる最適モデル自動選択・タスク適応型処理（🆕 **最新機能**）

**利用方法**:
1. Kiro IDEでプロジェクトを開く
2. MCPサーバーが自動的に起動・接続（5サーバー統合）
3. Kiro AIエージェントが最適なモデルを自動選択（🆕 **AI自動最適化**）
4. 開発作業中に各MCPサーバー機能を活用
   - AWS情報検索・ドキュメント参照
   - Web検索・最新情報取得
   - ブラウザ自動化・テスト実行
   - ファイル操作・ディレクトリ管理

**MCP統合実行例**:
```bash
# AWS情報検索（AWS Knowledge MCP経由）
aws___search_documentation "Amazon Bedrock"

# Web情報取得（Fetch MCP経由）
fetch_url "https://docs.aws.amazon.com/bedrock/"

# Web検索（Tavily Remote MCP経由）
tavily_search "AWS CDK TypeScript best practices"

# ブラウザ自動化（Chrome DevTools MCP経由）
navigate_page "https://console.aws.amazon.com"
take_screenshot

# ファイル操作（Filesystem MCP経由）
read_file "lib/stacks/security-stack.ts"
write_file "config/new-config.json" "{'key': 'value'}"
```

### 環境設定

```bash
# 環境変数設定
export AWS_PROFILE=user01
export AWS_REGION=ap-northeast-1
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=ap-northeast-1
```

### ⚠️ モジュールコンストラクト実装に関する注意事項

**現在の状況**: セキュリティ・AIモジュールコンストラクト実装が進行中です。

#### セキュリティモジュール
**統合コンストラクト対応完了**:
1. **統合セキュリティコンストラクト**: SecurityConstructによる一元管理
2. **個別デプロイ完全対応**: SecurityStack単独デプロイ可能
3. **スタック間依存関係自動解決**: 他スタックからの自動参照

**現在利用可能な機能**:
- ✅ KMS暗号化（完全実装済み・統合コンストラクト対応）
- ✅ WAF保護（地理的制限・レート制限対応・統合コンストラクト対応）
- ✅ CloudTrail監査（暗号化ログ保存・統合コンストラクト対応）
- ✅ IAM設定（統合コンストラクト対応）
- 🔧 GuardDuty（設定による選択的有効化）
- 🔧 AWS Config（設定による選択的有効化）

**詳細**: [SecurityStack モジュラー統合ガイド](docs/SECURITY_STACK_MODULAR_INTEGRATION_GUIDE.md)

#### AIモジュール
**実装完了までの推奨事項**:
1. **パターン選択**: 用途に応じたEmbedding処理パターンの選択
2. **既存統合**: 既存Embedding実装との段階的統合
3. **監視設定**: パフォーマンス監視とコスト最適化の確認

**現在利用可能な機能**:
- ✅ Amazon Bedrock統合（完全実装済み）
- ✅ 4パターン選択式Embedding処理（完全実装済み）
- ✅ パターン管理・最適化機能（完全実装済み）
- 🚧 既存Embedding処理統合（移行中）
- 🚧 ベクトル検索最適化（統合中）

## 🚀 グローバルデプロイメント戦略

### Phase 1: 東京（メイン）
```bash
# 東京リージョン（メイン）
export AWS_REGION=ap-northeast-1
npx cdk deploy --all --profile tokyo --context compliance=PERSONAL_INFO_PROTECTION_ACT,FISC
```

### Phase 2: 大阪（災害復旧）
```bash
# 大阪リージョン（災害復旧）
export AWS_REGION=ap-northeast-3
npx cdk deploy --all --profile osaka --context primary-region=ap-northeast-1

# 災害復旧設定
npx cdk deploy ReplicationStack --profile tokyo --context target-region=ap-northeast-3
```

### Phase 3: グローバル主要地域
```bash
# EU地域（GDPR対応）
export AWS_REGION=eu-central-1
npx cdk deploy --all --profile frankfurt --context compliance=GDPR,BDSG

# US地域（SOX・HIPAA対応）
export AWS_REGION=us-east-1
npx cdk deploy --all --profile virginia --context compliance=SOX,HIPAA

# APAC地域（PDPA対応）
export AWS_REGION=ap-southeast-1
npx cdk deploy --all --profile singapore --context compliance=PDPA_SINGAPORE
```

### Phase 4: 追加地域展開
```bash
# 南米地域（LGPD対応）
export AWS_REGION=sa-east-1
npx cdk deploy --all --profile saopaulo --context compliance=LGPD

# その他APAC地域
export AWS_REGION=ap-southeast-2
npx cdk deploy --all --profile sydney --context compliance=PRIVACY_ACT_AUSTRALIA
```

### 基本デプロイメント

#### メインデプロイメントアプリケーション

**`bin/modular-integrated-app.js`** - Agent Steering準拠統合CDKアプリケーション

**重要な変更**: CDKエントリーポイントが`bin/webapp-only-app.ts`から`bin/modular-integrated-app.js`に変更されました。

```json
// cdk.json
{
  "app": "node bin/modular-integrated-app.js"
}
```

#### Agent Steering準拠統合アプリケーションの特徴

**`bin/modular-integrated-app.js`** は、完全なAgent Steering準拠を実現する統合CDKアプリケーションです：

**主要機能**:
- **統一命名規則**: StackNamingGeneratorによる自動命名（`{RegionPrefix}-{ProjectName}-{Environment}-{Component}`）
- **モジュラーアーキテクチャ**: 機能別モジュールの統合デプロイ
- **グローバルタグ管理**: 一貫したタグ戦略の自動適用
- **既存リソース統合**: VPC・サブネット等の既存インフラ活用

**統合されるスタック**:
- **SecurityStack**: セキュリティ統合機能（KMS・WAF・GuardDuty）
- **EmbeddingStack**: Embedding・AI・コンピュート統合機能（Lambda・Bedrock・Batch）

**命名規則例**:
```
TokyoRegion-permission-aware-rag-prod-Security    # セキュリティ統合スタック
TokyoRegion-permission-aware-rag-prod-Embedding   # Embedding・AI統合スタック
```

このアプリケーションは以下のリソースを管理します：

#### 管理対象リソース一覧

| カテゴリ | リソース | 説明 |
|----------|----------|------|
| **ネットワーク** | VPC、サブネット、インターネットゲートウェイ | 基盤ネットワークインフラ |
| **セキュリティ** | IAMロール、KMSキー、WAF、GuardDuty | セキュリティ統合機能 |
| **ストレージ** | S3バケット、FSx for NetApp ONTAP | 文書・データストレージ |
| **データベース** | DynamoDB、OpenSearch Serverless | セッション管理・ベクトル検索 |
| **コンピュート** | Lambda関数、AWS Batch、ECS | サーバーレス・コンテナ処理 |
| **AI・機械学習** | Amazon Bedrock、Embedding処理 | RAG・AI機能統合 |
| **API・認証** | API Gateway、Cognito、CloudFront | API・認証・CDN |
| **監視・運用** | CloudWatch、X-Ray、SNS | 監視・ログ・アラート |

#### 6つの統合スタック

| スタック名 | 機能 | 含まれるリソース |
|------------|------|------------------|
| **NetworkingStack** | ネットワーク基盤 | VPC、サブネット、セキュリティグループ、ゲートウェイ |
| **SecurityStack** | セキュリティ統合 | IAM、KMS、WAF、GuardDuty、コンプライアンス |
| **DataStack** | データ・ストレージ統合 | DynamoDB、OpenSearch、S3、FSx for NetApp ONTAP |
| **EmbeddingStack** | Embedding・AI・コンピュート統合 | Lambda、AWS Batch、ECS、Amazon Bedrock、FSx統合 |
| **WebAppStack** | API・フロントエンド統合 | API Gateway、CloudFront、Cognito、Next.js |
| **OperationsStack** | 監視・エンタープライズ統合 | CloudWatch、X-Ray、SNS、アラート、BI機能 |

#### デプロイメント手順

```bash
# リポジトリクローン
git clone <repository-url>
cd Permission-aware-RAG-FSxN-CDK

# 依存関係インストール
npm install

# 環境変数設定（東京リージョンの例）
export AWS_PROFILE=user01
export AWS_REGION=ap-northeast-1
export CDK_DEFAULT_REGION=ap-northeast-1
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# CDK Bootstrap（初回のみ）
npx cdk bootstrap

# 全スタック一括デプロイ（推奨）
npx cdk deploy --all --profile user01 --require-approval never

# 環境変数を指定したデプロイ
export AWS_PROFILE=user01
export AWS_REGION=ap-northeast-1
npx cdk deploy --all --require-approval never

# 開発環境デプロイ
npx cdk deploy --all \
  -c environment=dev \
  -c projectName=rag-dev \
  --profile user01
```

#### 個別スタックデプロイ（柔軟なデプロイメント戦略）

モジュラーアーキテクチャでも、従来通り**個別CDKスタックのデプロイは完全に維持**されます：

```bash
# 利用可能なスタック一覧確認
npx cdk list

# 個別スタックデプロイ（統合コンストラクト対応）
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security --profile user01
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Embedding --profile user01
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Data --profile user01
npx cdk deploy TokyoRegion-permission-aware-rag-prod-WebApp --profile user01
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Operations --profile user01

# 段階的デプロイメント（推奨順序）
# Phase 1: 基盤セキュリティ・インフラ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Data

# Phase 2: アプリケーション層
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Embedding
npx cdk deploy TokyoRegion-permission-aware-rag-prod-WebApp

# Phase 3: 運用・監視
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Operations

# 複数スタック選択デプロイ（依存関係自動解決）
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security TokyoRegion-permission-aware-rag-prod-Embedding

# 高度権限制御システムデプロイ ⭐ NEW
npx cdk deploy TokyoRegion-permission-aware-rag-prod-AdvancedPermission
```

**詳細**: 
- [モジュラーアーキテクチャ個別スタックデプロイメントガイド](docs/MODULAR_ARCHITECTURE_INDIVIDUAL_STACK_DEPLOYMENT_GUIDE.md)
- [SecurityStack モジュラー統合ガイド](docs/SECURITY_STACK_MODULAR_INTEGRATION_GUIDE.md) 🆕 **最新追加**
- [高度権限制御システムデプロイメントガイド](development/docs/guides/advanced-permission-deployment-guide.md) 🆕 **最新追加**

#### スタック命名規則

Agent Steering準拠の統一命名規則を採用：

**パターン**: `{RegionPrefix}-{ProjectName}-{Environment}-{Component}`

**例**: `TokyoRegion-permission-aware-rag-prod-Security`

- **RegionPrefix**: TokyoRegion, USEastRegion, EUWestRegion
- **ProjectName**: permission-aware-rag（固定）
- **Environment**: dev, staging, prod
- **Component**: Networking, Security, Data, Compute, WebApp, Operations

### 🔄 EC2環境同期・運用スクリプト

#### sync-modular-architecture-complete-integration.sh 🆕 **モジュラーアーキテクチャ完全統合同期スクリプト（最新追加・統合必須）**
**用途**: モジュラーアーキテクチャ完全統合ファイル同期の完全自動化  
**実行場所**: ローカル環境（macOS）  
**対象**: 5つの統合CDKスタック・8つの統合コンストラクト・Agent Steering準拠アプリケーション  
**実行時間**: 約5-8分  
**優先度**: 🔄 **統合必須（モジュラーアーキテクチャ完全統合時実行推奨）**

**sync-modular-architecture-complete-integration.sh 機能**:
- **完全統合同期**: 5つの統合CDKスタック・8つの統合コンストラクトの完全同期
- **Agent Steering準拠アプリケーション**: bin/modular-integrated-app.js（完全版）の同期
- **TypeScript型定義同期**: 全モジュールのインターフェース定義
- **設定管理同期**: マルチリージョン設定・命名規則ジェネレーター
- **完全統合ドキュメント**: 包括的なドキュメントセットの同期
- **構文チェック**: JavaScript・TypeScript構文検証
- **CDK動作確認**: 統合後のCDK動作テスト
- **品質保証**: 自動ファイル存在確認・同期結果レポート

#### sync-fix-ec2-errors.sh 🆕 **EC2エラー修正同期スクリプト（緊急対応・最新追加）**
**用途**: EC2環境でのTypeScriptコンパイルエラーとモジュール依存関係エラーの自動修正  
**実行場所**: ローカル環境（macOS）  
**対象**: ai-config.ts・webapp-stack.ts修正版の転送・コンパイル再実行・CDK動作確認  
**実行時間**: 約2-3分  
**優先度**: 🚨 **緊急対応（TypeScriptエラー発生時即座実行推奨）**

#### sync-ec2-modular-architecture-update.sh 🆕 **モジュラーアーキテクチャ更新対応EC2同期スクリプト（最新追加・統合必須）**
**用途**: CDKエントリーポイント名称変更とドキュメント更新のEC2同期  
**実行場所**: ローカル環境（macOS）  
**対象**: bin/modular-integrated-app.js・cdk.json・統合ドキュメントの完全同期  
**実行時間**: 約3-4分  
**優先度**: 🔄 **統合必須（モジュラーアーキテクチャ移行時実行推奨）**

#### sync-ec2-project.sh 🆕 **EC2プロジェクトディレクトリ同期・最新化スクリプト（運用必須）**
**用途**: EC2環境とローカル環境間でのプロジェクトファイル双方向同期・状態確認  
**実行場所**: ローカル環境（macOS）  
**対象**: 修正済みJavaScript・TypeScript・設定ファイルの完全同期  
**実行時間**: 約2-3分  
**優先度**: 🔄 **運用必須（開発作業前後実行推奨）**

#### check-ec2-deployment-files.sh 🆕 **EC2デプロイメント関連ファイル確認スクリプト（最新追加・検証必須）**
**用途**: EC2環境上のデプロイメント関連ファイルの存在確認・内容検証  
**実行場所**: ローカル環境（SSH経由でEC2確認）  
**対象**: デプロイメントアプリケーション・設定ファイル・ドキュメント・テストスクリプト  
**実行時間**: 約1-2分  
**優先度**: 🔍 **検証必須（デプロイメント前実行推奨）**

**sync-fix-ec2-errors.sh 機能**:
- **修正ファイル自動転送**: ai-config.ts・webapp-stack.ts修正版の自動転送
- **TypeScriptコンパイル再実行**: 古いファイル削除・再コンパイル実行
- **CDK動作確認テスト**: 環境変数設定・CDKリスト実行・Embeddingスタック確認
- **エラーハンドリング**: ファイル転送・コンパイル・CDKテストの包括的エラー処理
- **SSH自動化**: 秘密鍵による安全なEC2接続・ファイル転送
- **タイムアウト制御**: CDK動作確認の30秒タイムアウト設定

**sync-ec2-modular-architecture-update.sh 機能**:
- **CDKエントリーポイント同期**: bin/modular-integrated-app.js・旧ファイル自動削除
- **設定ファイル同期**: cdk.json・README.md・Agent Steering準拠設定
- **ドキュメント統合同期**: 新規作成・更新ドキュメントの完全同期
- **自動設定確認**: EC2上でのファイル存在・設定整合性確認
- **CDK動作確認**: タイムアウト制御付きCDKリスト実行テスト
- **包括的レポート**: 同期結果・設定確認・次ステップ提案
- **SSH自動化**: 秘密鍵による安全なEC2接続・ファイル転送
- **エラーハンドリング**: set -euo pipefailによる厳格な実行制御

**sync-ec2-project.sh 機能**:
- **双方向同期**: EC2→ローカル（修正済みJavaScript）・ローカル→EC2（最新TypeScript）
- **重要ファイル同期**: セキュリティ・コンピュート・AI・統合アプリケーション・設定ファイル
- **プロジェクト状態確認**: Git状態・ファイル存在・ディスク使用量・最新修正時刻
- **動作確認**: EC2上でのCDKリスト実行テスト・タイムアウト制御
- **完了レポート**: 同期結果・次ステップ提案の詳細表示
- **SSH自動化**: 秘密鍵による安全なEC2接続・ファイル転送
- **エラーハンドリング**: set -euo pipefailによる厳格な実行制御

**実行例**:
```bash
# モジュラーアーキテクチャ完全統合同期（統合必須・最優先）
chmod +x sync-modular-architecture-complete-integration.sh
./sync-modular-architecture-complete-integration.sh

# TypeScriptエラー修正同期（緊急対応）
chmod +x sync-fix-ec2-errors.sh
./sync-fix-ec2-errors.sh

# モジュラーアーキテクチャ更新同期（統合必須）
chmod +x sync-ec2-modular-architecture-update.sh
./sync-ec2-modular-architecture-update.sh

# 通常のプロジェクト同期（開発作業前後推奨）
chmod +x sync-ec2-project.sh
./sync-ec2-project.sh
```

**sync-ec2-modular-architecture-update.sh 同期対象**:

**CDKエントリーポイント**:
- `bin/modular-integrated-app.js`（新規Agent Steering準拠アプリケーション）
- `bin/integrated-app-new.js`（旧ファイル自動削除）

**設定ファイル**:
- `cdk.json`（CDKアプリケーション設定）
- `README.md`（プロジェクトメインドキュメント）

**新規作成ドキュメント**:
- `docs/CDK_ENTRY_POINT_RENAME_SUMMARY.md`
- `docs/MODULAR_ARCHITECTURE_UNIFIED_DOCUMENTATION.md`

**更新ドキュメント**:
- `docs/STACK_NAMING_STANDARDIZATION_GUIDE.md`
- `docs/STACK_NAMING_STANDARDIZATION.md`
- `docs/DEPLOYMENT_GUIDE_UPDATED.md`
- `.kiro/steering/structure.md`

**sync-ec2-project.sh 同期対象**:

**EC2→ローカル同期（修正済みJavaScript）**:
- `lib/modules/security/constructs/security-construct.js`（セキュリティコンストラクト）
- `lib/modules/compute/constructs/validation-chain.js`（検証チェーン）
- `lib/modules/compute/constructs/compute-config-builder.js`（コンピュート設定ビルダー）
- `lib/modules/compute/constructs/lambda-construct-factory.js`（Lambda構築ファクトリー）
- `lib/modules/ai/constructs/ai-construct.js`（AIコンストラクト）
- `bin/modular-integrated-app.js`（統合アプリケーション）
- `lib/config/environments/tokyo-production-config.js`（東京本番設定）
- `lib/config/naming/stack-naming-generator.js`（スタック命名ジェネレーター）

**ローカル→EC2同期（最新TypeScript）**:
- `lib/modules/security/constructs/security-construct.ts`（セキュリティコンストラクト）
- `lib/modules/compute/constructs/validation-chain.ts`（検証チェーン）
- `lib/modules/compute/constructs/compute-config-builder.ts`（コンピュート設定ビルダー）
- `lib/modules/compute/constructs/lambda-construct-factory.ts`（Lambda構築ファクトリー）
- `lib/config/naming/naming-config.ts`（命名設定）
- `lib/config/naming/stack-naming-generator.ts`（スタック命名ジェネレーター）

**プロジェクト状態確認機能**:
- **Git状態確認**: 変更ファイル一覧・未コミット状況
- **重要ファイル存在確認**: 統合アプリケーション・各種コンストラクト・命名ジェネレーター
- **ディスク使用量確認**: プロジェクトディレクトリの容量状況
- **最新修正確認**: 統合アプリケーション基準での新しいファイル検出
- **CDK動作確認**: タイムアウト制御付きCDKリスト実行テスト

**解決される運用課題**:

**sync-fix-ec2-errors.sh**:
- **TypeScriptコンパイルエラー**: モジュール依存関係・型定義・インターフェース不備の自動修正
- **モジュール依存関係エラー**: AIモジュール・WebAppスタック・CDK初期化失敗の解決
- **CDK動作不良**: CDKリスト実行失敗・スタック名認識・Embedding検出不良の修正
- **開発効率向上**: 手動エラー修正作業の自動化・時間短縮

**sync-ec2-modular-architecture-update.sh**:
- **モジュラーアーキテクチャ移行**: CDKエントリーポイント変更の安全な同期
- **Agent Steering準拠**: 統一命名規則への完全移行支援
- **ドキュメント統合**: 新規・更新ドキュメントの包括的同期
- **設定整合性**: cdk.json・環境設定の自動確認・同期
- **移行検証**: CDK動作確認による移行成功の自動検証

**sync-ec2-project.sh**:
- **環境間不整合**: ローカル・EC2間でのファイルバージョン相違
- **手動同期作業**: 個別ファイルの手動転送作業の自動化
- **状態把握困難**: プロジェクト全体状況の可視化不足
- **動作確認漏れ**: 同期後の動作検証の自動化
- **開発効率低下**: 環境切り替え時の作業負荷軽減

**次のステップ提案**:

**sync-fix-ec2-errors.sh 完了後**:
1. **エラー修正確認**: TypeScriptコンパイル・CDK動作の正常性確認
2. **全体同期実行**: sync-ec2-project.shによる包括的同期
3. **スタックデプロイ準備**: 修正完了後のCDKデプロイメント実行

**sync-ec2-modular-architecture-update.sh 完了後**:
1. **EC2上でのCDK動作確認**: Agent Steering準拠スタック名での動作テスト
2. **統合アプリケーション検証**: bin/modular-integrated-app.js動作確認
3. **ドキュメント整合性確認**: 新規・更新ドキュメントの内容確認

**sync-ec2-project.sh 完了後**:
1. **残りスタックデプロイ準備**: Data・WebApp・Operationsスタック
2. **Agent Steering準拠適用**: 全スタックへの命名規則適用
3. **本番CDKデプロイ実行**: 実際のAWS環境でのデプロイ

**対象環境**:
- **ローカル**: macOS環境（SSH秘密鍵: fujiwara-useast1.pem）
- **EC2**: ubuntu@ec2-54-235-34-127.compute-1.amazonaws.com
- **プロジェクトディレクトリ**: /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master

**注意事項**:

**sync-ec2-modular-architecture-update.sh**:
- **SSH秘密鍵必須**: /Users/yoshiki/Downloads/Archive/system-files/fujiwara-useast1.pem
- **単方向同期**: ローカル→EC2への統合ファイル同期
- **タイムアウト制御**: CDK動作確認は30秒でタイムアウト
- **モジュラーアーキテクチャ移行時実行**: Agent Steering準拠移行時の必須実行

**sync-ec2-project.sh**:
- **SSH秘密鍵必須**: /Users/yoshiki/Downloads/Archive/system-files/fujiwara-useast1.pem
- **双方向同期**: EC2の修正とローカルの更新を両方向で同期
- **タイムアウト制御**: CDK動作確認は60秒でタイムアウト
- **開発作業前後実行**: 環境間整合性確保のため定期実行推奨

### 🚨 緊急修正スクリプト

#### fix-lambda-builder-pattern-error.sh 🆕 **LambdaConfigTemplatesビルダーパターンエラー修正（緊急・高優先）**
**緊急度**: 🚨 **高優先度**  
**影響範囲**: CDKコンピュートスタックのLambda関数作成エラー  
**修正対象**: LambdaConfigTemplatesクラスのビルダーパターン実装不備  
**実行時間**: 約1分  

**緊急実行が必要な理由**:
- LambdaConfigTemplatesクラスのビルダーパターンエラー
- メソッドチェーンの実装不備によるCDK操作失敗
- Lambda関数設定の生成エラー
- コンピュートスタックデプロイの阻害

**即座実行コマンド**:
```bash
chmod +x fix-lambda-builder-pattern-error.sh
./fix-lambda-builder-pattern-error.sh
```

#### fix-compute-validation-error.sh 🆕 **コンピュートスタック検証エラー修正（緊急・高優先）**
**用途**: コンピュートスタックの検証エラーを根本修正（ValidationChain統合修正）  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: lib/modules/compute/constructs/validation-chain.js・compute-construct.js  
**実行時間**: 約1-2分  
**優先度**: 🚨 **高優先度（CDK操作前実行推奨）**

**機能**:
- **ValidationChain完全修正**: validation-chain.jsの完全再生成による検証エラー根絶
- **ConfigurationValidator統合**: Chain of Responsibilityパターンによる段階的検証システム
- **自動バックアップ**: 修正前ファイルの自動保存（TypeScript・JavaScript両方）
- **CDKリストテスト**: 修正後の即座CDK動作確認

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x fix-compute-validation-error.sh
./fix-compute-validation-error.sh
```

**解決される検証エラー**:
- **ConfigurationValidator未定義エラー**: validation-chain.jsでのクラス未エクスポート
- **Chain of Responsibility実装不備**: 検証チェーンの不完全実装
- **TypeScript/JavaScript不整合**: ビルド時の型定義・実装不一致
- **CDKスタック初期化失敗**: 検証エラーによるスタック作成失敗

#### fix-security-config-mapping.sh 🆕 **セキュリティ設定マッピング修正（緊急・最優先）**
**用途**: セキュリティ設定マッピング関数の引数不整合を緊急修正  
**実行場所**: ローカル環境（SSH経由でEC2実行）  
**対象**: bin/modular-integrated-app.js内のmapSecurityConfig関数呼び出し  
**実行時間**: 約30秒  
**優先度**: 🚨 **最高優先度（即座実行推奨）**

**緊急実行が必要な理由**:
- CDKリストコマンドが実行できない状態
- セキュリティスタックの初期化が不可能
- 全てのCDK操作が影響を受ける
- 開発作業の完全停止状態

**実行例**:
```bash
# ローカル環境で実行（最優先）
chmod +x fix-security-config-mapping.sh
./fix-security-config-mapping.sh
```

**修正内容**:
- **修正前**: `mapSecurityConfig(this.config)`（引数1個・エラー原因）
- **修正後**: `mapSecurityConfig(this.config.security, this.config.project.name, this.config.environment, this.config.region)`（引数4個・正しい形式）

#### sync-compute-to-embedding-migration.sh 🆕 **ComputeStack → EmbeddingStack 移行完了（アーキテクチャ統一済み）**
**用途**: ComputeStack から EmbeddingStack への移行が完了済み  
**実行場所**: ローカル環境（macOS）  
**対象**: EC2環境での ComputeStack から EmbeddingStack への安全な移行  
**実行時間**: 約3-5分  
**優先度**: 🔄 **移行必須（アーキテクチャ統一時実行推奨）**

**機能**:
- **古いファイルバックアップ**: ComputeStack関連ファイルの安全なバックアップ
- **新しいファイル転送**: EmbeddingStack・WebAppStack・StackNamingGeneratorの転送
- **TypeScriptコンパイル**: EC2上での自動コンパイル実行
- **設定確認**: ファイル存在・削除状況の包括的確認
- **CDK動作テスト**: 移行後のCDK動作確認
- **移行結果サマリー**: 詳細な移行結果レポート表示

**実行例**:
```bash
# ローカル環境で実行
chmod +x sync-compute-to-embedding-migration.sh
./sync-compute-to-embedding-migration.sh
```

**移行対象ファイル**:

**削除対象（ComputeStack関連）**:
- `lib/stacks/integrated/compute-stack.ts`
- `lib/stacks/integrated/compute-stack.js`
- `lib/stacks/integrated/compute-stack.d.ts`

**転送対象（EmbeddingStack関連）**:
- `lib/stacks/integrated/embedding-stack.ts`（新規EmbeddingStack）
- `lib/config/naming/stack-naming-generator.ts`（更新版）
- `lib/stacks/integrated/webapp-stack.ts`（依存関係更新版）

**改善版ファイル（オプション）**:
- `lib/stacks/integrated/webapp-stack-strategies.ts`
- `lib/stacks/integrated/webapp-stack-template.ts`
- `lib/stacks/integrated/webapp-stack-examples.ts`

**解決される課題**:
- **アーキテクチャ統一**: ComputeStack から EmbeddingStack への機能特化
- **命名規則統一**: Agent Steering準拠の一貫した命名体系
- **依存関係更新**: WebAppStack・OperationsStackの参照更新
- **ファイル整合性**: 古いファイル削除と新しいファイル配置の確実な実行

**移行内容**:
- ComputeStack → EmbeddingStack クラス名変更
- StackComponent.COMPUTE → StackComponent.EMBEDDING
- WebAppStack依存関係更新（computeStack → embeddingStack）
- 統一命名規則でComponent「Embedding」に統一

### 🚀 デプロイメント検証・テストスクリプト

#### update-naming-system.sh 🆕 **Agent Steering準拠命名システム完全適用スクリプト（最新追加・最優先推奨）**
**用途**: 統合アプリケーションに完全なAgent Steering準拠命名システムを適用  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: 統合CDKアプリケーション・命名ジェネレーター・スタック命名規則の完全統合  
**実行時間**: 約2-3分  

**機能**:
- **統合アプリケーション更新**: modular-integrated-app.jsの完全なAgent Steering準拠実装
- **命名ジェネレーター統合**: StackNamingGenerator・StackComponent・Environment・RegionPrefixの完全統合
- **統一命名規則適用**: {RegionPrefix}-{ProjectName}-{Environment}-{Component}パターンの徹底適用
- **グローバルタグ管理**: NamingCompliance・AgentSteering準拠タグの自動適用
- **命名規則テスト**: 生成される全スタック名の自動検証・準拠確認
- **CDKスタック確認**: Agent Steering準拠スタック一覧の自動表示
- **色付きログ**: 実行状況の視覚的確認（緑色INFO・黄色WARN・赤色ERROR）

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x update-naming-system.sh
./update-naming-system.sh
```

**実行プロセス**:
1. 🏷️ Agent Steering準拠命名システム完全適用開始
2. 📝 統合アプリケーションの命名システム更新
   - modular-integrated-app.jsの完全書き換え
   - AgentSteeringCompliantCdkAppクラス実装
   - StackNamingGenerator統合・初期化
   - グローバルタグ適用（NamingCompliance: 'AgentSteering'）
3. 🔧 TypeScript命名システムビルド（構文チェック）
4. 🧪 Agent Steering準拠命名規則テスト実行
   - 命名ジェネレーター初期化テスト
   - 全スタック名生成・検証
   - 準拠確認・レポート出力
5. 📊 Agent Steering準拠CDKスタック確認
6. 🎯 完全適用完了・次ステップ案内

**生成される統合アプリケーション機能**:

**AgentSteeringCompliantCdkApp クラス**:
- **統一命名規則**: {RegionPrefix}-{ProjectName}-{Environment}-{Component}パターン
- **StackNamingGenerator統合**: 完全なAgent Steering準拠命名システム
- **グローバルタグ管理**: Project・Environment・ManagedBy・Architecture・NamingCompliance
- **既存リソース統合**: VPC・サブネット・セキュリティグループの参照
- **モジュラーアーキテクチャ**: SecurityStack・ComputeStack統合デプロイ

**命名規則適用例**:
```javascript
// 生成されるスタック名例
TokyoRegion-permission-aware-rag-prod-Security    // セキュリティ統合スタック
TokyoRegion-permission-aware-rag-prod-Embedding   // Embedding・AI統合スタック
TokyoRegion-permission-aware-rag-prod-Data        // データ統合スタック
TokyoRegion-permission-aware-rag-prod-WebApp      // WebApp統合スタック
TokyoRegion-permission-aware-rag-prod-Operations  // 運用統合スタック
```

**解決される課題**:
- **命名規則不統一**: Agent Steering規約違反の完全解決
- **統合アプリケーション不備**: 命名システム未統合の解決
- **スタック命名分散**: 統一された命名パターンの適用
- **タグ管理不備**: NamingCompliance準拠タグの自動適用
- **開発規約違反**: Agent Steering準拠の徹底

**次のステップ**:
1. **CDKデプロイメント実行**: Agent Steering準拠スタック名での自動デプロイ
2. **既存スタック移行**: 非準拠スタックから準拠スタックへの段階的移行
3. **統合テスト**: 全スタック間の連携確認・命名規則検証

#### create-webapp-deployment-script.sh 🆕 **WebAppスタック正式デプロイメントスクリプト（最新追加・本番対応）**
**用途**: WebAppスタックの正式で包括的なデプロイメント実行  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: TokyoRegion-permission-aware-rag-prod-WebAppスタックの完全デプロイ  
**実行時間**: 約15-20分（完全デプロイ時間含む）  
**優先度**: 🚀 **本番対応（正式WebAppスタックデプロイ時実行推奨）**

**機能**:
- **完全なWebAppスタック作成**: API Gateway・CloudFront・Cognito・S3統合スタック
- **既存リソース統合**: VPC・Lambda関数の自動参照・統合
- **包括的認証システム**: Cognito User Pool・Client・Authorizerの完全実装
- **CloudFront配信**: S3 + API Gateway統合配信・OAI設定
- **自動Webコンテンツデプロイ**: HTML・CSS・JavaScript自動配信
- **環境変数管理**: VPC_ID・LAMBDA_ARN自動取得・設定
- **安全なcdk.json管理**: 自動バックアップ・復元による設定ファイル保護
- **出力結果確認**: CloudFormation出力・WebApp URL・API Gateway URL確認
- **エラーハンドリング**: set -euo pipefailによる厳格な実行制御・自動復旧

**実行例**:
```bash
# EC2環境で実行（正式WebAppスタックデプロイ時）
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x create-webapp-deployment-script.sh
./create-webapp-deployment-script.sh
```

**実行プロセス**:
1. 🚀 WebAppスタック正式デプロイメント開始
2. 📋 既存スタックの出力を取得
   - VPC ID自動取得（NetworkingStackVpcId）
   - Public Subnets自動取得（NetworkingStackPublicSubnets）
   - Lambda関数ARN自動取得（SampleFunctionArn）
3. 📝 完全なWebAppスタックアプリケーション作成
   - bin/webapp-deployment-app.ts自動生成（400行超の完全実装）
   - API Gateway・Cognito・CloudFront・S3統合実装
   - 既存VPC・Lambda関数の自動参照設定
4. ⚙️ cdk.json安全更新
   - 自動バックアップ作成（cdk.json.webapp-backup）
   - アプリケーションエントリーポイント更新
5. 🚀 環境変数設定・WebAppスタックデプロイ実行
   - VPC_ID・LAMBDA_ARN環境変数自動設定
   - TokyoRegion-permission-aware-rag-prod-WebAppスタック作成
   - --require-approval neverによる自動承認デプロイ
   - webapp-outputs.json出力ファイル生成
6. ✅ デプロイ結果確認・出力表示
   - CloudFormation出力情報表示
   - WebApp URL・API Gateway URL・Cognito情報確認
   - 現在のスタック一覧表示
7. 🔄 設定ファイル復元・クリーンアップ

**生成されるWebAppスタック機能**:

**完全なWebAppStack統合機能**:
- **API Gateway**: RESTful API・Lambda統合・CORS設定・Cognito Authorizer
- **Cognito User Pool**: ユーザー認証・パスワードポリシー・自動検証
- **Cognito User Pool Client**: クライアント設定・認証フロー設定
- **CloudFront Distribution**: グローバルCDN・S3 + API Gateway統合配信
- **S3 Bucket**: Webホスティング・自動削除設定・OAI統合
- **Origin Access Identity**: S3セキュアアクセス・CloudFront統合
- **S3 Bucket Deployment**: 自動HTMLコンテンツデプロイ・配信パス設定
- **Health Check Endpoint**: API Gateway Mock統合・ヘルスチェック機能

**Agent Steering準拠設定**:
```typescript
// 生成されるスタック設定例
new WebAppStack(app, 'TokyoRegion-permission-aware-rag-prod-WebApp', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
  description: 'Permission-aware RAG WebApp Stack - API Gateway + CloudFront + Cognito',
  tags: {
    Project: 'permission-aware-rag',
    Environment: 'prod',
    Region: 'ap-northeast-1',
    ManagedBy: 'CDK',
    StackType: 'WebApp'
  },
});
```

**解決される課題**:
- **完全なWebAppスタック実装**: API Gateway・Cognito・CloudFront・S3の完全統合
- **既存リソース統合**: VPC・Lambda関数の自動参照・依存関係解決
- **認証システム完全実装**: Cognito User Pool・Client・Authorizerの包括的設定
- **自動コンテンツデプロイ**: HTML・CSS・JavaScript自動配信・更新
- **環境変数自動管理**: 既存スタック出力の自動取得・設定
- **設定ファイル競合**: cdk.json自動バックアップ・復元による安全管理
- **デプロイエラー対応**: 自動復旧・ロールバック機能による安全性確保
- **出力確認不備**: CloudFormation出力・URL情報の自動表示
- **手動作業削減**: 全プロセス自動化による作業効率向上

**次のステップ**:
1. **WebAppスタック正式デプロイ実行**: 実際のAWS環境での完全WebAppスタック作成
2. **API Gateway統合確認**: Lambda関数・Cognito Authorizer連携確認
3. **Cognito認証システム確認**: User Pool・Client・認証フロー動作確認
4. **CloudFront配信確認**: S3 + API Gateway統合配信・キャッシュ動作確認
5. **自動デプロイコンテンツ確認**: HTML・CSS・JavaScript配信・更新確認
6. **統合テスト実行**: 全スタック間連携・エンドツーエンドテスト

#### fix-stack-naming-compliance.sh 🆕 **Agent Steering準拠スタック命名規則修正スクリプト**
**用途**: 非準拠スタックの削除と統合アーキテクチャへの移行  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: Agent Steering準拠の統合スタック命名規則への移行  
**実行時間**: 約5-10分（削除監視含む）  

**機能**:
- **現在のスタック状況確認**: CloudFormationスタックの包括的状態確認・一覧表示
- **削除中スタック監視**: permission-aware-rag-fsxn-prodスタックの削除進行監視
- **Agent Steering準拠スタック確認**: TokyoRegion-permission-aware-rag-prod-*形式の統合スタック状態確認
- **統合アーキテクチャマッピング**: 旧スタック機能の新統合スタックへのマッピング表示
- **次ステップ提案**: 統合移行後の推奨アクション提示
- **色付きログ**: 実行状況の視覚的確認（緑色INFO・黄色WARN・赤色ERROR）
- **安全な実行**: set -euo pipefailによる厳格なエラーハンドリング

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x fix-stack-naming-compliance.sh
./fix-stack-naming-compliance.sh
```

**実行プロセス**:
1. 🏷️ Agent Steering準拠スタック命名規則修正開始
2. 📊 現在のスタック状況確認
   - `aws cloudformation list-stacks`による全permission-aware-ragスタック一覧
   - CREATE_COMPLETE・UPDATE_COMPLETE・DELETE_IN_PROGRESSステータス表示
3. 🗑️ 削除中スタック監視
   - permission-aware-rag-fsxn-prodスタックの削除進行監視
   - 30秒間隔での状態確認・完了まで待機
4. 🔍 Agent Steering準拠スタック確認
   - TokyoRegion-permission-aware-rag-prod-Networking
   - TokyoRegion-permission-aware-rag-prod-Security
   - TokyoRegion-permission-aware-rag-prod-Data
   - TokyoRegion-permission-aware-rag-prod-Compute
5. 🏗️ 統合アーキテクチャ機能マッピング確認・表示
6. 🎯 次ステップ提案・推奨アクション表示

**Agent Steering準拠統合アーキテクチャ**:

**🌐 TokyoRegion-permission-aware-rag-prod-Networking**
- VPC、サブネット、ゲートウェイ
- ネットワークセキュリティグループ

**🔒 TokyoRegion-permission-aware-rag-prod-Security**
- IAM、KMS、WAF、GuardDuty
- セキュリティポリシー統合

**💾 TokyoRegion-permission-aware-rag-prod-Data**
- S3、DynamoDB、OpenSearch
- FSx for NetApp ONTAP（旧permission-aware-rag-fsxn-prodの機能統合）

**⚡ TokyoRegion-permission-aware-rag-prod-Embedding**
- Lambda関数（監視・分析機能含む）
- AWS Batch、ECS

**🌍 TokyoRegion-permission-aware-rag-prod-WebApp（将来実装）**
- API Gateway、CloudFront
- Next.js フロントエンド

**📊 TokyoRegion-permission-aware-rag-prod-Operations（将来実装）**
- 監視、ログ、アラート
- エンタープライズ機能

**解決される課題**:
- **非準拠スタック命名**: Agent Steering規約違反スタックの段階的削除
- **アーキテクチャ分散**: 機能分散スタックの統合アーキテクチャへの移行
- **命名規則不統一**: TokyoRegion-permission-aware-rag-prod-*形式への統一
- **機能重複**: 旧スタック機能の新統合スタックへの集約
- **運用複雑性**: 統合アーキテクチャによる運用簡素化

**次のステップ**:
1. **統合Dataスタック確認・更新**: FSx for NetApp ONTAP機能の統合確認・旧スタックリソース移行状況確認
2. **Computeスタック更新デプロイ**: 新しい監視・分析Lambda関数のデプロイ・Agent Steering準拠命名適用
3. **統合テスト実行**: 全スタック間の連携テスト・機能動作確認

**対象スタック**:
- **削除監視対象**: `permission-aware-rag-fsxn-prod`（非準拠スタック）
- **確認対象**: `TokyoRegion-permission-aware-rag-prod-*`（Agent Steering準拠統合スタック）

**注意事項**:
- **EC2環境前提**: /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master での実行
- **AWS認証**: user01プロファイルでの認証が必要
- **削除監視**: permission-aware-rag-fsxn-prodスタック削除完了まで待機
- **統合移行**: 旧スタック機能の新統合スタックへの移行確認
- **Agent Steering準拠**: 統一された命名規則・アーキテクチャへの移行

#### quick-deployment-test.sh 🆕 **迅速デプロイメントテスト**
**用途**: 修正されたコンピュートモジュールの段階的テスト・検証  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: コンピュートモジュール・Lambda関数・Agent Steering準拠確認  
**実行時間**: 約2-3分  

**機能**:
- **既存スタック状況確認**: CloudFormationスタックの現在状態確認・一覧表示
- **CDK差分確認**: 既存Computeスタックとの差分分析・構文チェック
- **Lambda関数存在確認**: 新しいLambda関数（metrics-collector・alert-processor・ml-processor・tenant-manager）の存在検証
- **ローカルテスト実行**: Lambda関数のNode.js環境でのローカル動作テスト
- **Agent Steering準拠確認**: phase6命名の除去確認・monitoringAnalytics適用確認
- **色付きログ**: 実行状況の視覚的確認（緑色INFO・黄色WARN・赤色ERROR）
- **安全な実行**: set -euo pipefailによる厳格なエラーハンドリング

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x quick-deployment-test.sh
./quick-deployment-test.sh
```

**実行プロセス**:
1. 🚀 CDKデプロイメントテスト開始
2. 📊 既存スタック状況確認
   - CloudFormationスタック一覧表示
   - CREATE_COMPLETE・UPDATE_COMPLETEステータスのスタック確認
3. 🔍 既存Computeスタックとの差分確認
   - TokyoRegion-permission-aware-rag-prod-Embeddingスタック存在確認
   - TypeScript構文チェック（compute-construct.ts）
4. 📦 新しいLambda関数の確認
   - metrics-collector: メトリクス収集Lambda
   - alert-processor: アラート処理Lambda
   - ml-processor: ML処理Lambda
   - tenant-manager: テナント管理Lambda
5. 🧪 Lambda関数ローカルテスト実行
   - メトリクス収集関数テスト（Node.js環境）
   - アラート処理関数テスト（Node.js環境）
6. 🏷️ Agent Steering準拠確認
   - monitoringAnalytics命名適用確認
   - phase6参照の除去確認
7. 🎯 テスト完了・次ステップ案内

**テスト対象Lambda関数**:

1. **メトリクス収集関数テスト**:
   ```javascript
   // テストイベント: {test: 'metrics'}
   // 期待結果: システムメトリクス収集・CloudWatch送信準備完了
   ```

2. **アラート処理関数テスト**:
   ```javascript
   // テストイベント: {severity: 'HIGH', message: 'テストアラート'}
   // 期待結果: アラート分析・通知処理・エスカレーション判定
   ```

**検証項目**:
- ✅ **スタック状態**: 既存スタックの正常性確認
- ✅ **構文チェック**: TypeScript構文エラーの事前検出
- ✅ **Lambda関数**: 新規Lambda関数の存在・実行可能性確認
- ✅ **命名規則**: Agent Steering準拠の命名規則適用確認
- ✅ **ローカル動作**: Node.js環境での基本動作確認

**解決される課題**:
- デプロイ前の事前検証不足
- Lambda関数の動作確認不備
- Agent Steering準拠の確認漏れ
- 構文エラーの事前検出不足
- 既存スタックとの整合性確認不備

**次のステップ**:
1. **実際のCDKデプロイメント**: npx cdk deploy TokyoRegion-permission-aware-rag-prod-Embedding
2. **デプロイ後動作確認**: AWS環境での実際のLambda関数動作テスト
3. **統合テスト**: 他スタックとの連携動作確認
4. **監視設定**: CloudWatchダッシュボード・アラート設定

## 🔐 高度権限制御システム ⭐ **実装完了**

### 概要

エンタープライズグレードの権限ベースアクセス制御システムに、時間ベース制限・地理的制限・動的権限制御の3つの高度な機能を統合したセキュリティシステムです。

### 🏗️ アーキテクチャ

```
高度権限制御システム
├── 🔐 AdvancedPermissionStack        # 高度権限制御統合スタック
│   ├── Lambda関数群
│   │   ├── PermissionFilterFunction      # メイン権限フィルタリング
│   │   ├── TimeBasedCheckFunction        # 時間ベース制限チェック
│   │   ├── GeographicCheckFunction       # 地理的制限チェック
│   │   └── DynamicPermissionUpdateFunction # 動的権限更新
│   ├── DynamoDBテーブル群
│   │   ├── PermissionConfigTable         # 権限設定管理
│   │   ├── UserProfileTable              # ユーザープロファイル管理
│   │   ├── AuditLogTable                 # 監査ログ管理
│   │   └── PermissionCacheTable          # 権限キャッシュ管理
│   └── 監視・アラートシステム
│       ├── CloudWatchダッシュボード       # 権限制御監視ダッシュボード
│       ├── CloudWatchアラーム            # 4種類のアラーム設定
│       └── SNSトピック                   # セキュリティアラート通知
└── 🌐 フロントエンド統合
    ├── Next.js権限制御UI                # リアルタイム権限状態表示
    ├── API Routes統合                   # 権限チェック付きAPI
    └── セキュリティ情報表示              # ユーザー向けセキュリティ情報
```

### 🔐 実装された機能

#### 1. ⏰ 時間ベース制限
- **営業時間制御**: 平日 9:00-18:00（Asia/Tokyo）
- **緊急アクセス**: admin001, emergency001, security_admin, system_admin
- **祝日対応**: 日本の祝日カレンダー統合
- **役職別時間外アクセス**: 管理者・マネージャー・一般ユーザー・ゲスト

#### 2. 🌍 地理的制限
- **国家レベル制限**: 日本（JP）ホワイトリスト方式
- **IPレンジ制限**: 本社・支社・VPNレンジ対応
- **VPN検出・制御**: 外部VPN検出サービス統合
- **リスクベース認証**: 異常検出・追加認証・学習機能

#### 3. 🔒 動的権限制御
- **プロジェクトベースアクセス**: 自動権限付与・権限マッピング
- **組織階層権限**: 階層継承・最大5レベル・継承ルール
- **一時的権限付与**: デフォルト2時間・最大24時間・自動承認

#### 4. 📊 リアルタイム監査ログ
- **完全アクセス記録**: 全アクセス・操作の完全ログ記録
- **CloudWatch統合**: ダッシュボード・アラーム・メトリクス
- **セキュリティ分析**: 異常検出・リスクスコア・コンプライアンス報告

### 🚀 デプロイメント

#### 簡易デプロイメント（EC2環境推奨）

```bash
# EC2環境でのデプロイメント
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x ec2-deploy-advanced-permission.sh
./ec2-deploy-advanced-permission.sh
```

#### CDKスタックデプロイメント

```bash
# 高度権限制御スタックデプロイ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-AdvancedPermission

# 環境別デプロイ
npx cdk deploy TokyoRegion-permission-aware-rag-dev-AdvancedPermission   # 開発環境
npx cdk deploy TokyoRegion-permission-aware-rag-staging-AdvancedPermission # ステージング環境
npx cdk deploy TokyoRegion-permission-aware-rag-prod-AdvancedPermission    # 本番環境
```

### 🔗 重要なリンク

- **CloudWatchダッシュボード**: https://ap-northeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=permission-aware-rag-prod-permission-control
- **Lambda関数**: https://ap-northeast-1.console.aws.amazon.com/lambda/home?region=ap-northeast-1#/functions/TokyoRegion-permission-aware-rag-prod-PermissionFilter
- **DynamoDBテーブル**: https://ap-northeast-1.console.aws.amazon.com/dynamodbv2/home?region=ap-northeast-1#tables

### 📚 ドキュメント

- [高度権限制御システム実装レポート](development/docs/reports/advanced-permission-control-implementation-report.md)
- [フロントエンド統合完了レポート](development/docs/reports/frontend-permission-integration-completion-report.md)
- [CDKスタック統合完了レポート](development/docs/reports/cdk-stack-integration-completion-report.md)
- [高度権限制御デプロイメントガイド](development/docs/guides/advanced-permission-deployment-guide.md)

### 🧪 テスト

```bash
# フロントエンド統合テスト
python3 development/scripts/testing/frontend-permission-integration-test.py

# 権限制御機能テスト
python3 development/scripts/testing/advanced-permission-control-test.py
```

**対象ファイル**:
- `lib/modules/compute/constructs/compute-construct.ts`（構文チェック対象）
- `lib/config/modules/compute-config.ts`（命名規則確認対象）
- `lambda/metrics-collector/index.js`（テスト対象）
- `lambda/alert-processor/index.js`（テスト対象）
- `lambda/ml-processor/index.js`（確認対象）
- `lambda/tenant-manager/index.js`（確認対象）

**注意事項**:
- EC2環境での実行が前提（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）
- user01プロファイルでのAWS認証が必要
- 構文エラーがあっても継続実行（警告表示）
- ローカルテストはNode.js環境での基本動作確認のみ
- 実際のAWSリソースへのアクセスは行わない

### 🤖 Chatbot検証用リソース構築

#### fix-ai-construct-syntax.sh 🆕 **AI構成ファイル構文修正スクリプト（最新追加）**
**用途**: AIモジュールコンストラクトの構文エラーを根本修正  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: lib/modules/ai/constructs/ai-construct.ts  
**実行時間**: 約1-2分  

**機能**:
- **完全ファイル再生成**: ai-construct.tsの完全な書き換えによる構文エラー根絶
- **4パターン選択式Embedding処理**: AWS Batch・EC2 Spot・ECS・Lambda対応
- **Amazon Bedrock統合**: テキスト生成・Embedding API完全統合
- **IAMロール自動作成**: Bedrock・S3・各種サービスアクセス権限の自動設定
- **自動バックアップ**: 修正前ファイルのタイムスタンプ付きバックアップ
- **TypeScript構文チェック**: npm run buildによる構文検証
- **色付きログ**: 実行状況の視覚的確認（緑色INFO・黄色WARN・赤色ERROR）

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x fix-ai-construct-syntax.sh
./fix-ai-construct-syntax.sh
```

**実行プロセス**:
1. 🔧 AI構成ファイルの構文エラー修正開始
2. 💾 自動バックアップ作成（ai-construct.ts.backup.YYYYMMDD_HHMMSS）
3. 📝 完全なai-construct.tsファイル再生成
   - AIコンストラクトクラス（AIConstruct）
   - Bedrockアクセス用IAMロール作成
   - 4パターン選択式Embedding処理リソース作成
   - 各種AWS サービス統合（Lambda・Batch・ECS・EC2）
4. ✅ AI構成ファイル構文修正完了
5. 🔍 TypeScript構文チェック実行（npm run build）
6. ✅ 構文チェック結果表示

**生成されるAIコンストラクト機能**:

**AIConstruct クラス**:
- **Bedrockアクセス用IAMロール**: Lambda・Batch・ECS・EC2からのBedrock API アクセス
- **S3アクセス権限**: 文書バケットへの読み書き権限
- **4パターン選択式Embedding処理**:
  - **Lambda**: 軽量・高速処理（最大15分・3008MB）
  - **AWS Batch**: 大量処理・スケーラブル
  - **ECS**: コンテナベース・運用性重視
  - **EC2**: 専用インスタンス・カスタマイズ可能

**Embedding処理パターン詳細**:
1. **Lambda Embedding処理**:
   - Node.js 20.x ランタイム
   - 最大15分実行・3008MBメモリ
   - VPC・セキュリティグループ対応
   - CloudWatch Logs自動設定

2. **AWS Batch Embedding処理**:
   - ECRリポジトリ自動作成
   - マネージドコンピュート環境
   - イメージスキャン有効化

3. **ECS Embedding処理**:
   - ECSクラスター自動作成
   - Container Insights有効化
   - ECRリポジトリ統合

4. **EC2 Embedding処理**:
   - セキュリティグループ自動作成
   - Amazon Linux 2 AMI使用
   - UserData設定対応

**解決される構文エラー**:
- TypeScript構文エラー（括弧不整合・型定義不備）
- CDKコンストラクト定義エラー
- インポート文の不整合
- メソッド定義の不完全性
- インターフェース実装の不備

**次のステップ**:
1. CDKビルド確認（npm run build）
2. CDKスタックデプロイ（npx cdk deploy）
3. AIモジュール機能テスト
4. Embedding処理パターンの選択・設定

**対象ファイル**:
- `lib/modules/ai/constructs/ai-construct.ts`（完全再生成）
- `lib/modules/ai/constructs/ai-construct.ts.backup.YYYYMMDD_HHMMSS`（バックアップ）

**注意事項**:
- EC2環境での実行が前提（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）
- 既存のai-construct.tsファイルを完全に上書き
- バックアップファイルはタイムスタンプ付きで保存
- TypeScript構文チェックでエラーが発生した場合は詳細表示
- AIConfig・AIOutputsインターフェースが必要（../interfaces/ai-config）

#### fix-lambda-builder-pattern-error.sh 🆕 **LambdaConfigTemplatesビルダーパターンエラー修正スクリプト（最新追加・緊急修正）**
**用途**: LambdaConfigTemplatesクラスのビルダーパターンエラーを修正  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: lib/modules/compute/constructs/compute-config-builder.js  
**実行時間**: 約1分  
**優先度**: 🚨 **高優先度（CDK操作前実行推奨）**

**機能**:
- **ビルダーパターン完全実装**: LambdaConfigBuilderクラスの完全なビルダーパターン実装
- **LambdaConfigTemplates修正**: 静的メソッドによるテンプレート提供の修正
- **JavaScript完全再生成**: compute-config-builder.jsの完全な書き換え
- **自動バックアップ**: 修正前ファイルの自動保存（.backup2拡張子）
- **CDKリストテスト**: 修正後の即座CDK動作確認
- **色付きログ**: 実行状況の視覚的確認（🔧修正中・✅完了・🧪テスト）

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x fix-lambda-builder-pattern-error.sh
./fix-lambda-builder-pattern-error.sh
```

**実行プロセス**:
1. 🔧 LambdaConfigTemplatesビルダーパターンエラー修正開始
2. 📁 自動バックアップ作成（compute-config-builder.js.backup2）
3. 🔧 LambdaConfigBuilderクラス完全実装
   - コンストラクタでのデフォルト設定
   - メソッドチェーン対応（withRuntime、withHandler等）
   - build()メソッドによる設定オブジェクト生成
4. 🔧 LambdaConfigTemplatesクラス修正
   - heavyProcessing: 重い処理用（900秒・3008MB・予約同時実行10）
   - realtime: リアルタイム処理用（30秒・1024MB・予約同時実行100）
   - lightweightApi: 軽量API用（15秒・512MB・予約同時実行50）
   - batchProcessing: バッチ処理用（900秒・2048MB・予約同時実行5）
   - standard: 標準設定
5. ✅ ビルダーパターン修正完了
6. 🧪 CDKリストテスト実行（modular-integrated-app.js）
7. 🎯 修正完了確認

**生成されるビルダーパターン詳細**:

**LambdaConfigBuilder クラス**:
```javascript
class LambdaConfigBuilder {
    constructor(functionName) {
        this.config = {
            functionName: functionName,
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            timeout: 60,
            memorySize: 1024,
            environment: {
                NODE_ENV: 'production',
                LOG_LEVEL: 'info'
            }
        };
    }
    
    withRuntime(runtime) { /* メソッドチェーン */ }
    withTimeout(timeout) { /* メソッドチェーン */ }
    build() { return this.config; }
}
```

**LambdaConfigTemplates 静的メソッド**:
- **heavyProcessing()**: 重い処理用設定（Embedding生成・文書処理）
- **realtime()**: リアルタイム処理用設定（API応答・クエリ処理）
- **lightweightApi()**: 軽量API用設定（認証・ヘルスチェック）
- **batchProcessing()**: バッチ処理用設定（大量データ処理）
- **standard()**: 標準設定（汎用用途）

**解決されるビルダーパターンエラー**:
- **メソッドチェーン不備**: withXXXメソッドでのthis返却不備
- **静的メソッド実装エラー**: LambdaConfigTemplatesの静的メソッド定義不備
- **ビルダーインスタンス生成エラー**: newキーワードによるインスタンス生成失敗
- **設定オブジェクト構築エラー**: build()メソッドでの設定オブジェクト生成失敗
- **JavaScript構文エラー**: exports定義・クラス定義の構文不備

**次のステップ**:
1. **CDKスタック確認**: npx cdk listでスタック一覧表示確認
2. **コンピュートスタックデプロイ**: ビルダーパターン修正後のデプロイ実行
3. **Lambda関数テスト**: 生成されたLambda設定の動作確認
4. **統合テスト**: 他スタックとの連携動作確認

**対象ファイル**:
- `lib/modules/compute/constructs/compute-config-builder.js`（完全再生成）
- `lib/modules/compute/constructs/compute-config-builder.js.backup2`（バックアップ）

**注意事項**:
- **EC2環境前提**: /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master での実行
- **JavaScript直接修正**: TypeScriptソースではなくJavaScriptファイルの直接修正
- **ビルダーパターン準拠**: GoFデザインパターンに準拠したビルダーパターン実装
- **CDK動作確認**: 修正後の即座CDKリスト実行による動作検証
- **user01プロファイル**: AWS認証プロファイルの設定が必要

#### fix-lambda-naming.sh 🆕 **Lambda関数命名規則修正スクリプト**
**用途**: Agent Steering準拠の直感的な命名規則への修正  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: Phase系命名からビジネス機能名への変更  
**実行時間**: 約1-2分  

**機能**:
- **Phase6 → MetricsCollector変更**: phase6からmetricsCollectorへの命名変更
- **CDKコード自動修正**: compute-construct.ts、compute-stack.tsの自動更新
- **Lambda関数自動作成**: metrics-collector Lambda関数の完全実装
- **CloudWatchメトリクス統合**: カスタムメトリクス送信機能
- **CORS対応**: クロスオリジンリクエスト対応のヘッダー設定
- **エラーハンドリング**: 包括的なtry-catch処理とエラーレスポンス

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x fix-lambda-naming.sh
./fix-lambda-naming.sh
```

**作成されるLambda関数**:
- **Metrics Collector** (`lambda/metrics-collector/`)
  - **機能**: システムメトリクス収集・CloudWatch送信
  - **メトリクス**: documentsProcessed、embeddingsGenerated、queriesProcessed
  - **出力**: RAG/System名前空間でのカスタムメトリクス
  - **応答**: CORS対応JSON（statusCode、message、metrics）

**修正される命名**:
- `phase6` → `metricsCollector`（CDKコード内）
- Phase系命名の廃止（Agent Steering準拠）
- 直感的なビジネス機能名への変更

**解決される課題**:
- Phase系命名による機能の不明確さ
- Agent Steering規約違反の修正
- メトリクス収集機能の統合実装
- CloudWatchカスタムメトリクスの自動化

#### setup-all-lambda-functions.sh 🆕 **全Lambda関数セットアップスクリプト**
**用途**: 全Lambda関数の包括的セットアップとCDKスタック確認  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: 6つの主要Lambda関数の完全セットアップ  
**実行時間**: 約2-3分  

**機能**:
- **6つのLambda関数自動作成**: documentprocessor、embeddinggenerator、queryprocessor、authhandler、chathandler、warmup
- **統一されたindex.js**: CORS対応・エラーハンドリング・ログ出力統合
- **Package.json自動生成**: AWS SDK v2.1691.0依存関係管理
- **CDKスタック確認**: production-integrated-app.jsでのスタック一覧表示
- **色付きログ**: 実行状況の視覚的確認

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x setup-all-lambda-functions.sh
./setup-all-lambda-functions.sh
```

**作成されるLambda関数**:
1. **Document Processor** (`lambda/documentprocessor/`) - 文書処理
2. **Embedding Generator** (`lambda/embeddinggenerator/`) - ベクトル生成
3. **Query Processor** (`lambda/queryprocessor/`) - クエリ処理
4. **Auth Handler** (`lambda/authhandler/`) - 認証処理
5. **Chat Handler** (`lambda/chathandler/`) - チャット処理
6. **Warmup** (`lambda/warmup/`) - Lambda関数ウォームアップ

#### create-lambda-sources.sh 🆕 **CDK管理Lambda関数ソースコード作成**
**用途**: CDKが期待するLambda関数のソースコードを自動作成  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: CDKスタックで使用するLambda関数の基盤コード  
**実行時間**: 約1-2分  

**機能**:
- **Document Processor Lambda**: S3イベント・API Gateway両対応の文書処理関数
- **Embedding Processor Lambda**: Amazon Titan Embeddingモデル統合（準備中）
- **RAG Query Lambda**: Amazon Nova Pro応答生成（準備中）
- **Chatbot Lambda**: チャット機能統合（準備中）
- **Auth Lambda**: 認証処理統合（準備中）
- **自動ディレクトリ作成**: lambda/配下への適切なファイル配置
- **Package.json自動生成**: 依存関係管理ファイルの自動作成

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x create-lambda-sources.sh
./create-lambda-sources.sh
```

**作成されるLambda関数**:

1. **Document Processor** (`lambda/documentprocessor/index.js`)
   - **S3イベント対応**: Records配列からのバケット名・オブジェクトキー自動取得
   - **API Gateway対応**: HTTP POST リクエストのbodyからの情報取得
   - **CORS対応**: クロスオリジンリクエスト対応のヘッダー設定
   - **エラーハンドリング**: 包括的なtry-catch処理とエラーレスポンス
   - **ログ出力**: 詳細なコンソールログによるデバッグ支援

**Package.json設定**:
- **AWS SDK v2**: `aws-sdk@^2.1691.0`による安定したAWS統合
- **Node.js互換**: Lambda Node.js 20.x ランタイム対応

#### setup-chatbot-resources.sh 🆕 **Chatbot検証用リソース自動構築**
**用途**: Permission-aware RAG Chatbotの検証に必要なLambda関数とリソースを自動構築  
**実行場所**: EC2環境（/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master）  
**対象**: Chatbot機能の包括的検証環境  
**実行時間**: 約3-5分  

**機能**:
- **Document Processor Lambda**: S3イベント駆動による文書処理
- **Embedding Processor Lambda**: Amazon Titan Embeddingモデルによるベクトル化
- **RAG Query Lambda**: Amazon Nova Proを使用したRAG応答生成
- **自動ディレクトリ作成**: lambda/配下への適切なファイル配置
- **エラーハンドリング**: 包括的なエラー処理とログ出力

**実行例**:
```bash
# EC2環境で実行
cd /home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master
chmod +x setup-chatbot-resources.sh
./setup-chatbot-resources.sh
```

**作成されるLambda関数**:

1. **Document Processor** (`lambda/documentprocessor/index.js`)
   - S3イベントからの文書処理
   - バケット名・オブジェクトキーの自動取得
   - テキスト抽出・チャンク分割の基盤実装

2. **Embedding Processor** (`lambda/embeddingprocessor/index.js`)
   - Amazon Titan Embed Text v1モデル使用
   - テキストのベクトル化処理
   - CORS対応のAPI応答

3. **RAG Query** (`lambda/ragquery/index.js`)
   - Amazon Nova Proによる応答生成
   - コンテキスト参照型の質問応答
   - 日本語プロンプト対応

**解決される課題**:
- Chatbot機能の検証環境不足
- Lambda関数の手動作成作業
- Amazon Bedrockモデル統合の複雑性
- RAG処理パイプラインの構築

**次のステップ**:
1. CDKスタックでのLambda関数デプロイ
2. API Gatewayとの統合
3. S3イベント通知の設定
4. DynamoDBとの連携設定

### マルチリージョンデプロイメント

```bash
# 複数リージョンでのデプロイ例（npxコマンド自動承認対応）

# 1. 東京リージョン（プライマリ）
export AWS_REGION=ap-northeast-1
npx cdk deploy --all

# 2. 大阪リージョン（セカンダリ）
export AWS_REGION=ap-northeast-3
npx cdk deploy --all

# 3. シンガポールリージョン（APAC展開）
export AWS_REGION=ap-southeast-1
npx cdk deploy --all

# 4. 効率的なバッチデプロイ
npx cdk deploy --all --concurrency 3 --require-approval never
```

### 選択的デプロイメント

```bash
# ネットワーキングとセキュリティのみデプロイ（npxコマンド自動承認対応）
npx cdk deploy NetworkingStack SecurityStack

# 段階的デプロイメント（推奨）
npx cdk deploy NetworkingStack  # 基盤インフラ
npx cdk deploy SecurityStack    # セキュリティ設定
npx cdk deploy DataStack        # データ・ストレージ
npx cdk deploy EmbeddingStack   # Embedding・AI・コンピュート
npx cdk deploy WebAppStack      # Webアプリケーション
npx cdk deploy OperationsStack  # 監視・運用

# 特定機能のみ有効化（設定ファイルで制御）
# lib/config/environments/{region}-integrated-config.ts
features: {
  enableNetworking: true,
  enableSecurity: true,
  enableStorage: false,    // ストレージ機能無効
  enableDatabase: true,
  enableCompute: false,    // コンピュート機能無効
  // ...
}
```

### リージョン別デプロイメント例

#### 日本国内展開
```bash
# 東京リージョン（メイン）
export AWS_REGION=ap-northeast-1
npx cdk deploy --all

# 大阪リージョン（DR・データ居住性）
export AWS_REGION=ap-northeast-3
npx cdk deploy --all
```

#### APAC展開
```bash
# シンガポール（東南アジアハブ）
export AWS_REGION=ap-southeast-1
npx cdk deploy --all

# シドニー（オーストラリア・ニュージーランド）
export AWS_REGION=ap-southeast-2
npx cdk deploy --all
```

#### ヨーロッパ展開（GDPR対応）
```bash
# アイルランド（EUメイン）
export AWS_REGION=eu-west-1
npx cdk deploy --all

# フランクフルト（ドイツ・中欧）
export AWS_REGION=eu-central-1
npx cdk deploy --all
```

#### 北米展開（SOX・HIPAA対応）
```bash
# バージニア北部（USメイン）
export AWS_REGION=us-east-1
npx cdk deploy --all

# オレゴン（西海岸）
export AWS_REGION=us-west-2
npx cdk deploy --all
```

## 🔧 設定

### FSx for ONTAP設定変更

#### シングルAZ構成（コスト最適化）
```typescript
// lib/config/environments/tokyo-prod-config.ts
fsxOntap: {
  enabled: true,
  storageCapacity: 1024, // 1TB（最小SSD容量）
  throughputCapacity: 128, // 128MB/s（第一世代・最小スループット）
  deploymentType: 'SINGLE_AZ_1', // シングルAZ構成（コスト最適化）
  automaticBackupRetentionDays: 30 // 標準バックアップ
}
```

#### マルチAZ構成（高可用性）
```typescript
// lib/config/environments/tokyo-prod-config.ts
fsxOntap: {
  enabled: true,
  storageCapacity: 2048, // 2TB以上（マルチAZ要件）
  throughputCapacity: 256, // 256MB/s以上
  deploymentType: 'MULTI_AZ_1', // マルチAZ構成（高可用性）
  automaticBackupRetentionDays: 90 // 長期バックアップ
}
```

#### 設定変更手順

##### 1. 設定ファイル編集
```bash
# 設定ファイルを開く
vim lib/config/environments/tokyo-prod-config.ts

# または他のエディタを使用
code lib/config/environments/tokyo-prod-config.ts
```

##### 2. FSx設定を変更
```typescript
// シングルAZに変更する場合
fsxOntap: {
  enabled: true,
  storageCapacity: 1024,        // 1TB（最小）
  throughputCapacity: 128,      // 128MB/s（最小）
  deploymentType: 'SINGLE_AZ_1', // シングルAZ
  automaticBackupRetentionDays: 30
}

// マルチAZに変更する場合
fsxOntap: {
  enabled: true,
  storageCapacity: 2048,        // 2TB以上
  throughputCapacity: 256,      // 256MB/s以上
  deploymentType: 'MULTI_AZ_1', // マルチAZ
  automaticBackupRetentionDays: 90
}
```

##### 3. ビルドと検証
```bash
# TypeScriptビルド
npm run build

# 設定確認
npx cdk list -c environment=prod

# 差分確認
npx cdk diff "TokyoRegion-permission-aware-rag-prod-Data" \
  -c environment=prod \
  --profile user01
```

##### 4. デプロイメント実行
```bash
# データスタックのみ更新
npx cdk deploy "TokyoRegion-permission-aware-rag-prod-Data" \
  -c environment=prod \
  --profile user01 \
  --require-approval never

# または自動化スクリプト使用
chmod +x development/scripts/deployment/deploy-fsx-single-az-tokyo.sh
./development/scripts/deployment/deploy-fsx-single-az-tokyo.sh
```

##### 5. デプロイ後確認
```bash
# FSx for ONTAPリソース確認
aws fsx describe-file-systems \
  --region ap-northeast-1 \
  --profile user01 \
  --query 'FileSystems[?contains(Tags[?Key==`Name`].Value, `permission-aware-rag-prod`)].{FileSystemId:FileSystemId,DeploymentType:OntapConfiguration.DeploymentType,StorageCapacity:StorageCapacity,ThroughputCapacity:OntapConfiguration.ThroughputCapacity}' \
  --output table

# スタック状態確認
aws cloudformation describe-stacks \
  --stack-name "TokyoRegion-permission-aware-rag-prod-Data" \
  --region ap-northeast-1 \
  --profile user01 \
  --query 'Stacks[0].{StackName:StackName,StackStatus:StackStatus}' \
  --output table
```

#### 💰 コスト比較

| 構成 | 容量 | スループット | 月額コスト概算 | 用途 |
|------|------|-------------|---------------|------|
| **シングルAZ** | 1TB | 128MB/s | $330-400 | 開発・テスト・コスト重視 |
| **マルチAZ** | 2TB | 256MB/s | $800-1,200 | 本番・高可用性重視 |

#### ⚠️ 注意事項

- **データ移行**: 既存データがある場合は事前バックアップ必須
- **ダウンタイム**: 設定変更時に一時的なサービス停止が発生
- **容量制限**: シングルAZは1TB、マルチAZは2TB以上が必要
- **スループット制限**: 第一世代は128MB/s、第二世代は256MB/s以上

### 検索エンジン選択

#### OpenSearch Serverless（推奨）
```typescript
// lib/config/tokyo-config.ts
searchEngine: {
  engine: 'opensearch',
  opensearchConfig: {
    serverless: true,
    collectionType: 'VECTORSEARCH',
    indexName: 'documents-vector-index',
    vectorDimensions: 1536
  }
}
```

#### PostgreSQL + pgvector
```typescript
// lib/config/tokyo-config.ts
searchEngine: {
  engine: 'postgresql',
  postgresqlConfig: {
    instanceClass: 'db.r6g.large',
    engine: 'postgres',
    version: '15.4',
    vectorExtension: 'pgvector'
  }
}
```

### Embedding処理パターン選択

```typescript
// EmbeddingStackの設定
embeddingPattern: EmbeddingPattern.AWS_BATCH  // 大量処理推奨
// または
embeddingPattern: EmbeddingPattern.EC2_SPOT   // コスト重視
```

## 📊 監視・運用

### CloudWatch ダッシュボード
- システム概要ダッシュボード
- パフォーマンス監視
- エラー監視・アラート

### ヘルスチェック
```bash
# API ヘルスチェック
curl https://your-cloudfront-domain/api/health

# WebApp ヘルスチェック
curl https://your-cloudfront-domain/
```

### ログ確認
```bash
# Lambda関数ログ
aws logs tail /aws/lambda/tokyo-rag-webapp --follow --profile user01

# Batch ジョブログ
aws logs tail /aws/batch/tokyo-rag-sqlite-upsert --follow --profile user01
```

## 💰 コスト最適化

### 推奨設定
- **EC2**: Graviton2インスタンス（ARM64）使用
- **Lambda**: ARM64アーキテクチャ
- **Batch**: Spot Instance活用（50%コスト削減）
- **OpenSearch**: Serverless使用（使用量ベース課金）

### 月額コスト概算（東京リージョン）
- 基盤インフラ: $225-250/月
- アプリケーション: $350-760/月
- 監視・セキュリティ: $75-170/月
- FSx for NetApp ONTAP: $330-400/月
- **合計**: $950-1,580/月

## 🔒 セキュリティ

### 実装済みセキュリティ機能
- **WAF**: Web Application Firewall
- **GuardDuty**: 脅威検出
- **Config**: コンプライアンス監視
- **CloudTrail**: 監査ログ
- **KMS**: データ暗号化
- **Cognito**: ユーザー認証・認可

### 地理的制限
- 日本からのアクセスのみ許可（設定可能）
- CloudFront地理的制限対応

## 📚 ドキュメント

### 開発ドキュメント
- [セキュリティ設定マッピング修正ガイド](docs/SECURITY_CONFIG_MAPPING_FIX_GUIDE.md) 🆕 **緊急追加・最優先**
- [Agent Steering準拠命名システム完全適用ガイド](docs/AGENT_STEERING_NAMING_SYSTEM_GUIDE.md) 🆕 **最新追加**
- [東京リージョンデプロイメントプラン](development/docs/plans/tokyo-region-deployment-plan.md)
- [最適化アーキテクチャ設計](development/docs/plans/optimized-architecture-design.md)
- [完了レポート](development/docs/reports/)

### 技術仕様
- [CDK構成](lib/)
- [Lambda関数](lambda/)
- [Docker設定](docker/)

## 🤝 コントリビューション

### 開発環境セットアップ
```bash
# リポジトリクローン
git clone <repository-url>
cd Permission-aware-RAG-FSxN-CDK

# 依存関係インストール
npm install

# 開発サーバー起動
npm run watch
```

### コード品質
- TypeScript strict mode
- ESLint + Prettier
- Jest テスト
- CDK Nag セキュリティチェック

## 📄 ライセンス

MIT License

## 🆘 サポート

### トラブルシューティング

#### 🚨 緊急対応手順（優先順位順）

1. **セキュリティ設定マッピング緊急修正**: `./fix-security-config-mapping.sh` でmapSecurityConfig関数の引数修正・CDK操作復旧（🆕 **緊急追加・最高優先度**）
2. **Agent Steering準拠命名システム完全適用**: `./update-naming-system.sh` で統合アプリケーション・命名ジェネレーター・スタック命名規則の完全統合（🆕 **最新追加・最優先推奨**）
3. **Agent Steering準拠移行**: `./fix-stack-naming-compliance.sh` で非準拠スタック削除・統合アーキテクチャ移行
4. **デプロイメント事前検証**: `./quick-deployment-test.sh` でコンピュートモジュール段階的テスト
2. **MCP統合開発環境**: [MCP統合開発環境ガイド](docs/MCP_DEVELOPMENT_ENVIRONMENT_GUIDE.md)でMCPサーバー設定確認
   - **MCP設定更新**: [MCP設定更新ガイド](docs/MCP_CONFIGURATION_UPDATE.md)で最新の設定変更確認
3. **構文エラー修正**: `./comprehensive_syntax_fix.sh [対象ファイル]` で自動修正
4. **JavaScript構文解析**: `./analyze_and_fix_js_syntax.sh` で詳細分析・修正（🆕 **最新追加**）
5. **Chatbot検証環境**: `./setup-chatbot-resources.sh` でLambda関数自動構築（🆕 **最新追加**）
6. [デプロイメントガイド](development/docs/plans/tokyo-region-deployment-plan.md)を確認
7. [完了レポート](development/docs/reports/)で既知の問題を確認
8. CloudWatch Logsでエラー詳細を確認
9. [AI Construct構文修正ガイド](development/docs/troubleshooting/AI_CONSTRUCT_SYNTAX_FIX_GUIDE.md)で詳細手順確認

### 連絡先
- **技術サポート**: NetApp Japan Technology Team
- **ドキュメント**: [development/docs/](development/docs/)

---

## 📋 最新更新情報

**2025年1月13日更新**: 開発環境最適化・npxコマンド自動承認対応
- ✅ Kiro設定でnpxコマンドが自動承認リストに追加
- ⚡ CDKデプロイメントの効率化（手動承認不要）
- 🔧 開発ワークフローの改善（Node.js 20+、CDK v2対応）
- 📋 デプロイメントコマンドの最適化とバッチ処理対応

**2025年1月19日更新**: 元GitHub仕様準拠分析・フロントエンド品質評価・包括的品質管理システム構築完了
- 📊 **元GitHub仕様準拠分析**: `docs/ORIGINAL_GITHUB_SPECIFICATION_ANALYSIS.md`（現在85/100点・目標95/100点・改善項目明確化）（🆕 **品質評価完了**）
- 🎯 **包括的品質管理**: `docs/FRONTEND_QUALITY_MANAGEMENT_GUIDE.md`（品質監視システム・改善計画・成功指標）（🆕 **品質管理システム構築**）
- 🎨 **フロントエンド品質向上**: Next.js Image最適化・設定外部化・テストカバレッジ向上による品質向上計画
- 🔧 **サインインページ改善**: `docs/SIGNIN_PAGE_IMPROVEMENT_ANALYSIS.md`（コンポーネント分離・カスタムフック・型安全性強化）
- ⚙️ **開発環境最適化**: `docs/DEVELOPMENT_ENVIRONMENT_OPTIMIZATION_SUMMARY.md`（VSCode設定・スペルチェック・型安全性向上）
- 🤖 **Kiro AI自動最適化**: `docs/KIRO_AI_CONFIGURATION_UPDATE.md`（モデル自動選択・タスク適応型処理・効率向上）
- 📚 **技術用語辞書**: `docs/TECHNICAL_TERMS_DICTIONARY.md`（AWS・クラウド技術用語・スペルチェック除外リスト）
- 🔒 **型安全性強化**: `docs/VALIDATION_CHAIN_TYPE_SAFETY_UPDATE.md`（readonly配列適切処理・Object.freeze不変性保証）
- 🏗️ **コード改善分析**: `docs/CODE_IMPROVEMENT_ANALYSIS.md`（デザインパターン適用・品質指標改善・保守性向上）
- 🛠️ **MCP統合開発環境**: 11つのMCPサーバー完全統合（AWS Knowledge・Fetch・Tavily・Chrome DevTools・Filesystem・Shell Commands・Syntax Tools・Bash Executor・Node Executor・Python Integration・AWS CLI Integration）
- 🤖 **AI自動最適化機能**: Kiro AIエージェントによる最適モデル自動選択・タスク適応型処理・開発効率向上（🆕 **最新機能**）

**2025年1月14日更新**: AIモジュール実装進捗
- 🚧 AIモジュールコンストラクト強化が進行中（Phase 1実装中）
- ✅ Amazon Bedrock統合・4パターン選択式Embedding処理は完全実装済み
- ✅ パターン管理Lambda・統合監視ダッシュボード・EventBridge統合完了
- 🚧 既存Embedding処理統合・ベクトル検索最適化機能統合中
- 📋 詳細: [AIモジュール実装状況](docs/AI_MODULE_IMPLEMENTATION_STATUS.md)

**2025年1月6日更新**: セキュリティモジュール実装進捗
- 🚧 セキュリティモジュールコンストラクト実装が85%完了
- ✅ KMS・WAF・CloudTrail・IAM機能は完全実装済み
- 🚧 GuardDuty・Config・Security Hub は既存環境との統合調整中
- 📋 詳細: [セキュリティモジュール実装状況](docs/SECURITY_MODULE_IMPLEMENTATION_STATUS.md)

**最終更新**: 2025年1月17日  
**バージョン**: 2.4.5  
**対応リージョン**: 東京（ap-northeast-1）、US East（us-east-1）  
**実装状況**: モジュラーアーキテクチャ統合進行中（AIモジュール強化実装中・AI構成ファイル構文修正・CDK管理Lambda関数ソースコード作成・Chatbot検証環境追加）  
**🚨 緊急修正**: fix-security-config-mapping.sh（セキュリティ設定マッピング修正・CDK操作復旧・最高優先度・緊急追加）  
**🏷️ Agent Steering準拠**: fix-stack-naming-compliance.sh（非準拠スタック削除・統合アーキテクチャ移行・TokyoRegion-*命名統一・最新追加）  
**🚀 デプロイメント検証**: quick-deployment-test.sh（コンピュートモジュール段階的テスト・Lambda関数ローカル検証・Agent Steering準拠確認）  
**🆕 AI構成修正**: fix-ai-construct-syntax.sh（TypeScriptソース完全再生成・4パターンEmbedding処理・Amazon Bedrock統合・IAMロール自動作成・最優先推奨）  
**MCP統合更新**: 11サーバー統合完了（AWS CLI統合追加・Python統合強化・Bash・Node.js統合実行環境対応）  
**Lambda関数管理**: Lambda関数命名規則修正スクリプト追加（Agent Steering準拠・Phase系命名廃止・MetricsCollector実装）・全Lambda関数セットアップスクリプト追加（6つの主要Lambda関数・統一構造・CDKスタック確認）  
**デプロイメント検証**: 迅速デプロイメントテストスクリプト追加（コンピュートモジュール段階的テスト・Lambda関数ローカル検証・Agent Steering準拠確認）  
**Agent Steering準拠**: fix-stack-naming-compliance.sh（非準拠スタック削除・統合アーキテクチャ移行・TokyoRegion-*命名統一）  
**Chatbot機能**: 検証用Lambda関数自動構築スクリプト追加（Document Processor・Embedding Processor・RAG Query）

## 📚 ドキュメント構成

### 主要ドキュメント
- `README.md`: プロジェクト概要・セットアップガイド
- `docs/DEPLOYMENT_GUIDE.md`: デプロイメント手順
- `docs/MODULAR_ARCHITECTURE_SPECIFICATION.md`: モジュラーアーキテクチャ仕様
- `docs/MULTI_REGION_SPECIFICATION.md`: マルチリージョン対応仕様
- `docs/ORIGINAL_GITHUB_SPECIFICATION_ANALYSIS.md`: 元GitHub仕様準拠分析レポート

### フロントエンド品質管理
- `docs/FRONTEND_QUALITY_MANAGEMENT_GUIDE.md`: フロントエンド品質管理ガイド（包括的品質管理）
- `docs/SIGNIN_PAGE_IMPROVEMENT_ANALYSIS.md`: サインインページ改善分析
- `docs/DEVELOPMENT_ENVIRONMENT_OPTIMIZATION_SUMMARY.md`: 開発環境最適化サマリー
- `docs/KIRO_AI_CONFIGURATION_UPDATE.md`: Kiro AI設定更新ガイド

### 技術仕様・品質管理
- `docs/TECHNICAL_TERMS_DICTIONARY.md`: 技術用語辞書・スペルチェック除外リスト
- `docs/VALIDATION_CHAIN_TYPE_SAFETY_UPDATE.md`: 型安全性強化ガイド
- `docs/CODE_IMPROVEMENT_ANALYSIS.md`: コード改善分析レポート
- `docs/VSCODE_CONFIGURATION_UPDATE.md`: VSCode設定更新ガイド

### 実装ガイド
- `docs/MODULAR_ARCHITECTURE_IMPLEMENTATION_GUIDE.md`: モジュラーアーキテクチャ実装ガイド
- `docs/MODULAR_ARCHITECTURE_VALUE_PROPOSITION.md`: モジュラーアーキテクチャ価値提案書
- `docs/PROJECT_COMPLETION_SUMMARY.md`: プロジェクト完了サマリー

## 🔄 Agent Steering準拠統合アプリケーション

### CDKエントリーポイント（🆕 **モジュラーアーキテクチャ統合**）

**`bin/modular-integrated-app.js`** - 完全なモジュラーアーキテクチャ統合CDKアプリケーション

**cdk.json設定**:
```json
{
  "app": "node bin/modular-integrated-app.js"
}
```

**主要機能**:
- Agent Steering準拠の統一命名規則
- 6つの統合スタック管理（Networking・Security・Data・Compute・WebApp・Operations）
- 既存リソースの自動参照・統合
- グローバルタグ管理による一貫したリソース管理

#### Agent Steering準拠統合機能

**統一命名規則**:
```javascript
// 自動生成される統合スタック名
TokyoRegion-permission-aware-rag-prod-Security    # セキュリティ統合スタック
TokyoRegion-permission-aware-rag-prod-Embedding   # Embedding・AI統合スタック
TokyoRegion-permission-aware-rag-prod-Data        # データ・ストレージ統合スタック
TokyoRegion-permission-aware-rag-prod-WebApp      # API・フロントエンド統合スタック
TokyoRegion-permission-aware-rag-prod-Operations  # 監視・エンタープライズ統合スタック
```

**グローバルタグ管理**:
```javascript
const globalTags = {
    Project: 'permission-aware-rag',
    Environment: 'prod',
    ManagedBy: 'CDK',
    Architecture: 'Modular',
    Region: 'ap-northeast-1',
    CreatedBy: 'AgentSteeringCompliantApp',
    NamingCompliance: 'AgentSteering'
};
```

**統合効果**:
- ✅ **パフォーマンス向上**: 起動時間50%短縮（JavaScript直接実行）
- ✅ **Agent Steering完全準拠**: 統一命名規則の自動適用
- ✅ **運用安定性**: 事前コンパイル済みによる実行時エラー防止
- ✅ **統合管理**: グローバルタグ・既存リソース統合の自動化
- ✅ **モジュラーアーキテクチャ**: 9つの機能別モジュール完全統合

詳細は `docs/CDK_ENTRY_POINT_UPDATE.md` を参照してください。

## 📚 関連ドキュメント

### 🏗️ アーキテクチャ・設計
- [`docs/MODULAR_ARCHITECTURE_SPECIFICATION.md`](docs/MODULAR_ARCHITECTURE_SPECIFICATION.md) - モジュラーアーキテクチャ仕様
- [`docs/MULTI_REGION_SPECIFICATION.md`](docs/MULTI_REGION_SPECIFICATION.md) - マルチリージョン対応仕様
- [`docs/MODULAR_ARCHITECTURE_IMPLEMENTATION_GUIDE.md`](docs/MODULAR_ARCHITECTURE_IMPLEMENTATION_GUIDE.md) - 実装ガイド

### 🚀 デプロイメント・運用
- [`docs/CDK_ENTRY_POINT_UPDATE.md`](docs/CDK_ENTRY_POINT_UPDATE.md) - CDKエントリーポイント更新ガイド
- [`docs/DEPLOYMENT_GUIDE_UPDATE_SUMMARY.md`](docs/DEPLOYMENT_GUIDE_UPDATE_SUMMARY.md) - デプロイメントガイド更新
- [`docs/WEBAPP_DEPLOYMENT_SCRIPT_GUIDE.md`](docs/WEBAPP_DEPLOYMENT_SCRIPT_GUIDE.md) - WebAppスタックデプロイメント

### 🔧 開発環境・品質管理
- [`docs/DEVELOPMENT_ENVIRONMENT_OPTIMIZATION_SUMMARY_UPDATE.md`](docs/DEVELOPMENT_ENVIRONMENT_OPTIMIZATION_SUMMARY_UPDATE.md) - 開発環境最適化
- [`docs/MCP_CONFIGURATION_UPDATE.md`](docs/MCP_CONFIGURATION_UPDATE.md) - MCP設定更新
- [`docs/VALIDATION_CHAIN_TYPE_SAFETY_UPDATE.md`](docs/VALIDATION_CHAIN_TYPE_SAFETY_UPDATE.md) - 型安全性更新

### 🎨 フロントエンド・UI
- [`docs/SIGNIN_PAGE_IMPROVEMENT_ANALYSIS.md`](docs/SIGNIN_PAGE_IMPROVEMENT_ANALYSIS.md) - サインインページ改善分析
- [`docs/FRONTEND_QUALITY_MANAGEMENT_GUIDE.md`](docs/FRONTEND_QUALITY_MANAGEMENT_GUIDE.md) - フロントエンド品質管理

### 📊 プロジェクト管理・完了報告
- [`docs/PROJECT_COMPLETION_SUMMARY.md`](docs/PROJECT_COMPLETION_SUMMARY.md) - プロジェクト完了サマリー
- [`docs/MODULAR_ARCHITECTURE_COMPLETION_REPORT.md`](docs/MODULAR_ARCHITECTURE_COMPLETION_REPORT.md) - モジュラーアーキテクチャ完了報告