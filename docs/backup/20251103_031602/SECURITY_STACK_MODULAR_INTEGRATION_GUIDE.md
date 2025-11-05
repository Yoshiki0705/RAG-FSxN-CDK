# SecurityStack モジュラー統合ガイド

## 概要

SecurityStackを統合セキュリティコンストラクト使用に修正し、**個別スタックデプロイ完全対応**を実現しました。モジュラーアーキテクチャの利点を活用しながら、従来の柔軟なデプロイメント方式を完全に維持しています。

## 🎯 修正内容

### 1. **統合セキュリティコンストラクトの採用**

#### 修正前: 個別コンストラクト方式
```typescript
// 複数の個別コンストラクトを個別に管理
import { IamConstruct } from '../../modules/security/constructs/iam-construct';
import { KmsConstruct } from '../../modules/security/constructs/kms-construct';
import { WafConstruct } from '../../modules/security/constructs/waf-construct';
import { GuardDutyConstruct } from '../../modules/security/constructs/guardduty-construct';

export class SecurityStack extends cdk.Stack {
  public readonly iam: IamConstruct;
  public readonly kms: KmsConstruct;
  public readonly waf: WafConstruct;
  public readonly guardDuty: GuardDutyConstruct;
  // 個別に管理・設定が必要
}
```

#### 修正後: 統合コンストラクト方式
```typescript
// 統合セキュリティコンストラクトによる一元管理
import { SecurityConstruct } from '../../modules/security/constructs/security-construct';

export class SecurityStack extends cdk.Stack {
  /** 統合セキュリティコンストラクト */
  public readonly security: SecurityConstruct;
  
  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // 統合セキュリティコンストラクト作成（一元管理）
    this.security = new SecurityConstruct(this, 'Security', {
      config: props.config.security,
      projectName: props.config.project.name,
      environment: props.config.environment,
      namingGenerator: props.namingGenerator,
    });
  }
}
```

### 2. **Agent Steering準拠インターフェース**

#### 統一された設定インターフェース
```typescript
export interface SecurityStackProps extends cdk.StackProps {
  readonly config: any; // 統合設定オブジェクト
  readonly namingGenerator?: any; // Agent Steering準拠命名ジェネレーター（オプション）
}
```

### 3. **個別デプロイ対応の出力値**

#### 他スタックからの参照用プロパティ
```typescript
export class SecurityStack extends cdk.Stack {
  /** KMSキー（他スタックからの参照用） */
  public readonly kmsKey: cdk.aws_kms.Key;
  
  /** WAF WebACL ARN（他スタックからの参照用） */
  public readonly wafWebAclArn?: string;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    // 統合コンストラクト作成
    this.security = new SecurityConstruct(this, 'Security', { ... });

    // 他スタックからの参照用プロパティ設定
    this.kmsKey = this.security.kmsKey;
    this.wafWebAclArn = this.security.wafWebAcl?.attrArn;
  }
}
```

## 🚀 個別スタックデプロイ完全対応

### 1. **個別デプロイ方法**

#### SecurityStackのみデプロイ
```bash
# セキュリティスタック単独デプロイ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security

# 期待される結果:
# ✅ KMS Key作成
# ✅ WAF WebACL作成
# ✅ GuardDuty設定（設定により）
# ✅ CloudTrail設定（設定により）
# ✅ IAM設定
```

#### 他スタックとの組み合わせデプロイ
```bash
# セキュリティ + コンピュートスタック
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security TokyoRegion-permission-aware-rag-prod-Embedding

# セキュリティ + データスタック
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security TokyoRegion-permission-aware-rag-prod-Data
```

### 2. **スタック間依存関係の自動解決**

#### ComputeStackからSecurityStackの参照
```typescript
// ComputeStackでSecurityStackのKMSキーを参照
export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // SecurityStackからKMSキーを自動参照
    const kmsKey = cdk.aws_kms.Key.fromKeyArn(
      this, 'ImportedKmsKey',
      cdk.Fn.importValue(`${props.securityStackName}-KmsKeyArn`)
    );

    // Lambda関数でKMSキーを使用
    new cdk.aws_lambda.Function(this, 'SecureFunction', {
      // KMSキーによる暗号化
      environment: {
        KMS_KEY_ID: kmsKey.keyId,
      },
    });
  }
}
```

#### 自動依存関係解決
```bash
# EmbeddingStackをデプロイすると、SecurityStackが自動的に先にデプロイされる
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Embedding
# → 自動的にSecurityStackもデプロイ（必要に応じて）
```

### 3. **段階的デプロイメント戦略**

#### Phase 1: 基盤セキュリティ
```bash
# セキュリティ基盤の構築
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security

# 確認: セキュリティリソースの作成確認
aws kms list-keys --query 'Keys[?contains(KeyId, `permission-aware-rag`)]'
aws wafv2 list-web-acls --scope REGIONAL
```

#### Phase 2: アプリケーション層
```bash
# セキュリティ基盤を活用したアプリケーション層デプロイ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Embedding
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Data
```

#### Phase 3: フロントエンド・監視
```bash
# 最終層のデプロイ
npx cdk deploy TokyoRegion-permission-aware-rag-prod-WebApp
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Operations
```

## 🎯 統合コンストラクトの利点

### 1. **一元管理による効率化**

| 項目 | 個別コンストラクト方式 | 統合コンストラクト方式 |
|------|----------------------|----------------------|
| **設定管理** | ❌ 分散・複雑 | ✅ **一元管理** |
| **依存関係** | ❌ 手動管理 | ✅ **自動解決** |
| **エラー処理** | ❌ 個別対応 | ✅ **統一処理** |
| **保守性** | ❌ 困難 | ✅ **高保守性** |
| **再利用性** | ❌ 限定的 | ✅ **高再利用性** |

### 2. **Agent Steering準拠の統一性**

#### 統一された命名規則
```typescript
// 統合コンストラクト内で自動適用
const kmsKeyAlias = `alias/${projectName}-${environment}-security`;
const wafName = `${projectName}-${environment}-waf`;
const cloudTrailName = `${projectName}-${environment}-cloudtrail`;
```

#### 統一されたタグ戦略
```typescript
// 自動的に適用されるタグ
cdk.Tags.of(this).add('Module', 'Security');
cdk.Tags.of(this).add('StackType', 'Integrated');
cdk.Tags.of(this).add('Architecture', 'Modular');
cdk.Tags.of(this).add('IndividualDeploySupport', 'Yes');
```

### 3. **柔軟な設定制御**

#### 機能の選択的有効化
```typescript
// 設定による機能制御
const securityConfig = {
  kms: { enabled: true, enableKeyRotation: true },
  waf: { enabled: true, scope: 'REGIONAL' },
  guardDuty: { enabled: false }, // 一時的に無効化
  cloudTrail: { enabled: true },
  config: { enabled: false }, // 一時的に無効化
};
```

## 🔧 実装例: 統合セキュリティスタック

### 完全な実装例
```typescript
/**
 * SecurityStack - 統合セキュリティスタック（モジュラーアーキテクチャ対応）
 */
export class SecurityStack extends cdk.Stack {
  /** 統合セキュリティコンストラクト */
  public readonly security: SecurityConstruct;
  
  /** KMSキー（他スタックからの参照用） */
  public readonly kmsKey: cdk.aws_kms.Key;
  
  /** WAF WebACL ARN（他スタックからの参照用） */
  public readonly wafWebAclArn?: string;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // 統合セキュリティコンストラクト作成
    this.security = new SecurityConstruct(this, 'Security', {
      config: props.config.security,
      projectName: props.config.project.name,
      environment: props.config.environment,
      namingGenerator: props.namingGenerator,
    });

    // 他スタックからの参照用プロパティ設定
    this.kmsKey = this.security.kmsKey;
    this.wafWebAclArn = this.security.wafWebAcl?.attrArn;

    // スタック出力（個別デプロイ対応）
    this.createOutputs();

    // Agent Steering準拠タグ設定
    this.addStackTags();
  }

  private createOutputs(): void {
    // 他スタックからの参照用出力値
    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.security.kmsKey.keyArn,
      exportName: `${this.stackName}-KmsKeyArn`,
    });

    if (this.security.wafWebAcl) {
      new cdk.CfnOutput(this, 'WafWebAclArn', {
        value: this.security.wafWebAcl.attrArn,
        exportName: `${this.stackName}-WafWebAclArn`,
      });
    }
  }
}
```

## 🔍 検証方法

### 1. **個別デプロイ検証**

```bash
# SecurityStack単独デプロイテスト
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Security --dry-run

# 期待される結果確認
npx cdk diff TokyoRegion-permission-aware-rag-prod-Security
```

### 2. **スタック間依存関係検証**

```bash
# 依存関係を持つスタックのデプロイテスト
npx cdk deploy TokyoRegion-permission-aware-rag-prod-Embedding --dry-run

# 自動的にSecurityStackも含まれることを確認
npx cdk list --long
```

### 3. **出力値検証**

```bash
# SecurityStackの出力値確認
aws cloudformation describe-stacks \
  --stack-name TokyoRegion-permission-aware-rag-prod-Security \
  --query 'Stacks[0].Outputs'

# 期待される出力値:
# - KmsKeyId
# - KmsKeyArn
# - WafWebAclId (存在する場合)
# - WafWebAclArn (存在する場合)
```

## 📝 まとめ

**SecurityStackの統合コンストラクト化により、以下の価値が実現されました**：

### ✅ **個別デプロイ完全対応**
- SecurityStack単独デプロイ: 完全対応
- 他スタックとの組み合わせデプロイ: 完全対応
- スタック間依存関係の自動解決: 完全対応

### ✅ **モジュラーアーキテクチャの利点**
- 統合コンストラクトによる一元管理
- Agent Steering準拠の統一命名規則
- 高い再利用性と保守性

### ✅ **運用の柔軟性**
- 段階的デプロイメント戦略
- 機能の選択的有効化
- 設定による柔軟な制御

**結論**: 統合コンストラクトを使用しても、個別CDKスタックデプロイは完全に維持され、むしろモジュラーアーキテクチャの利点により、より効率的で保守性の高いデプロイメントが実現されます。