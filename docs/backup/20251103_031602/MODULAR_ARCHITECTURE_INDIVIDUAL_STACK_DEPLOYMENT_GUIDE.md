# モジュラーアーキテクチャ個別スタックデプロイメントガイド

## 概要

モジュラーアーキテクチャでも、従来通り**個別CDKスタックのデプロイは完全に維持**されます。統合アプリケーション（`bin/modular-integrated-app.js`）は、複数の独立したCDKスタックを定義するため、CDKの標準的な個別デプロイ機能がそのまま利用できます。

## 🎯 個別スタックデプロイの仕組み

### 1. **CDKアプリケーション内での複数スタック定義**

モジュラーアーキテクチャでは、1つのCDKアプリケーション内で複数の独立したスタックを定義します：

```javascript
// bin/modular-integrated-app.js
class AgentSteeringCompliantCdkApp {
    deploy() {
        // 各スタックを独立して定義
        const securityStack = this.deploySecurityStack();      // SecurityStack
        const computeStack = this.deployComputeStack();        // ComputeStack
        const dataStack = this.deployDataStack();              // DataStack
        const webappStack = this.deployWebAppStack();          // WebAppStack
        const operationsStack = this.deployOperationsStack();  // OperationsStack
    }
}
```

### 2. **Agent Steering準拠の統一スタック名**

各スタックは統一された命名規則で個別に識別されます：

```
TokyoRegion-permission-aware-rag-prod-Security    # セキュリティ統合スタック
TokyoRegion-permission-aware-rag-prod-Embedding   # Embedding・AI統合スタック
TokyoRegion-permission-aware-rag-prod-Data        # データ・ストレージ統合スタック
TokyoRegion-permission-aware-rag-prod-WebApp      # API・フロントエンド統合スタック
TokyoRegion-permission-aware-rag-prod-Operations  # 監視・エンタープライズ統合スタック
```

## 🚀 個別スタックデプロイメント方法

### 1. **全スタック一覧確認**

```bash
# 利用可能なスタック一覧表示
npx cdk list

# 期待される出力:
# TokyoRegion-permission-aware-rag-prod-Security
# TokyoRegion-permission-aware-rag-prod-Compute
# TokyoRegion-permission-aware-rag-prod-Data
# TokyoRegion-permission-aware-rag-prod-WebApp
# TokyoRegion-permission-aware-rag-prod-Operations
```

### 2. **個別スタックデプロイ**

#### セキュリティスタックのみデプロイ
```bash
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security
```

#### コンピュートスタックのみデプロイ
```bash
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Compute
```

#### データスタックのみデプロイ
```bash
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Data
```

#### WebAppスタックのみデプロイ
```bash
npx cdk deploy TokyoRegion-permission-aware-rag-prod-WebApp
```

#### 運用スタックのみデプロイ
```bash
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Operations
```

### 3. **複数スタック選択デプロイ**

#### セキュリティ + コンピュートスタック
```bash
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security TokyoRegion-permission-aware-rag-prod-Compute
```

#### データ + WebAppスタック
```bash
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Data TokyoRegion-permission-aware-rag-prod-WebApp
```

### 4. **全スタック一括デプロイ**

```bash
# 全スタック一括デプロイ
npx cdk deploy --all

# または明示的に全スタック指定
npx cdk deploy \
  TokyoRegion-permission-aware-rag-prod-Security \
  TokyoRegion-permission-aware-rag-prod-Compute \
  TokyoRegion-permission-aware-rag-prod-Data \
  TokyoRegion-permission-aware-rag-prod-WebApp \
  TokyoRegion-permission-aware-rag-prod-Operations
```

## 🎯 個別スタック管理の利点

### 1. **段階的デプロイメント**
```bash
# Phase 1: 基盤インフラ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Data

# Phase 2: アプリケーション層
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Compute
npx cdk deploy TokyoRegion-permission-aware-rag-prod-WebApp

# Phase 3: 運用・監視
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Operations
```

### 2. **リスク最小化**
```bash
# 新機能テスト: コンピュートスタックのみ更新
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Compute

# 問題発生時: 該当スタックのみロールバック
npx cdk destroy TokyoRegion-permission-aware-rag-prod-Compute
```

### 3. **チーム分担**
```bash
# インフラチーム: ネットワーク・セキュリティ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security

# 開発チーム: アプリケーション・API
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Compute
npx cdk deploy TokyoRegion-permission-aware-rag-prod-WebApp

# 運用チーム: 監視・ログ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Operations
```

## 🔧 スタック間依存関係の管理

### 1. **依存関係の自動解決**

CDKは自動的にスタック間の依存関係を解決します：

```typescript
// SecurityStack → ComputeStack の依存関係例
export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);
    
    // SecurityStackからのKMSキー参照
    const kmsKey = cdk.aws_kms.Key.fromKeyArn(
      this, 'ImportedKmsKey', 
      props.securityStack.kmsKeyArn  // 自動的に依存関係を作成
    );
  }
}
```

### 2. **依存関係を考慮したデプロイ順序**

```bash
# 正しいデプロイ順序（依存関係順）
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security    # 1. 基盤セキュリティ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Data        # 2. データストレージ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Compute     # 3. コンピュート（Security依存）
npx cdk deploy TokyoRegion-permission-aware-rag-prod-WebApp      # 4. WebApp（Compute依存）
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Operations  # 5. 監視（全スタック依存）
```

### 3. **自動依存関係解決**

```bash
# CDKが自動的に依存関係を解決してデプロイ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-WebApp
# → 自動的にSecurity, Data, Computeスタックも必要に応じてデプロイ
```

## 📊 個別スタック操作コマンド

### 1. **スタック状態確認**

```bash
# 個別スタック状態確認
npx cdk diff TokyoRegion-permission-aware-rag-prod-Security

# 複数スタック状態確認
npx cdk diff TokyoRegion-permission-aware-rag-prod-Security TokyoRegion-permission-aware-rag-prod-Compute
```

### 2. **スタック削除**

```bash
# 個別スタック削除
npx cdk destroy TokyoRegion-permission-aware-rag-prod-Operations

# 複数スタック削除（依存関係逆順）
npx cdk destroy TokyoRegion-permission-aware-rag-prod-Operations TokyoRegion-permission-aware-rag-prod-WebApp
```

### 3. **スタック情報表示**

```bash
# 個別スタック詳細情報
npx cdk synth TokyoRegion-permission-aware-rag-prod-Security

# 全スタック情報
npx cdk synth
```

## 🎯 モジュラーアーキテクチャの利点

### 1. **従来の個別デプロイ + モジュラー統合**

| 機能 | 従来方式 | モジュラーアーキテクチャ |
|------|----------|------------------------|
| **個別スタックデプロイ** | ✅ 可能 | ✅ **完全維持** |
| **スタック間依存関係** | ❌ 手動管理 | ✅ **自動解決** |
| **統一命名規則** | ❌ 不統一 | ✅ **Agent Steering準拠** |
| **モジュール再利用** | ❌ 困難 | ✅ **完全対応** |
| **設定管理** | ❌ 分散 | ✅ **統一管理** |

### 2. **柔軟なデプロイメント戦略**

#### 開発環境: 個別スタック中心
```bash
# 開発中の機能のみデプロイ
npx cdk deploy TokyoRegion-permission-aware-rag-dev-Compute
```

#### ステージング環境: 段階的デプロイ
```bash
# 段階的検証デプロイ
npx cdk deploy TokyoRegion-permission-aware-rag-staging-Security
npx cdk deploy TokyoRegion-permission-aware-rag-staging-Data
npx cdk deploy TokyoRegion-permission-aware-rag-staging-Compute
```

#### 本番環境: 一括デプロイ
```bash
# 本番環境一括デプロイ
npx cdk deploy --all --profile production
```

## 🔧 実装例: 個別スタック対応統合アプリケーション

### bin/modular-integrated-app.js の構造

```javascript
class AgentSteeringCompliantCdkApp {
    deploy() {
        // 各スタックを独立して定義（個別デプロイ可能）
        const securityStack = new SecurityStack(this.app, 'TokyoRegion-permission-aware-rag-prod-Security', {
            env: this.env,
            // スタック固有設定
        });

        const computeStack = new ComputeStack(this.app, 'TokyoRegion-permission-aware-rag-prod-Compute', {
            env: this.env,
            securityStack: securityStack,  // 依存関係定義
            // スタック固有設定
        });

        // 他のスタックも同様に独立定義...
    }
}
```

## 📝 まとめ

**モジュラーアーキテクチャでも個別CDKスタックデプロイは完全に維持されます**：

### ✅ **維持される機能**
- 個別スタックデプロイ（`npx cdk deploy <stack-name>`）
- 複数スタック選択デプロイ
- スタック間依存関係の自動解決
- 段階的デプロイメント戦略

### ✅ **追加される価値**
- Agent Steering準拠の統一命名規則
- モジュール化されたコンストラクト再利用
- 統一された設定管理
- グローバルタグ管理

### ✅ **運用の柔軟性**
- 開発環境: 個別スタック中心の迅速開発
- ステージング環境: 段階的検証デプロイ
- 本番環境: 一括デプロイまたは慎重な個別デプロイ

モジュラーアーキテクチャは、従来の個別デプロイ機能を完全に維持しながら、統一性と再利用性を大幅に向上させる最適なソリューションです。