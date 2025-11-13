# Amazon Bedrock Guardrails 完全ガイド

**作成日**: 2025-11-11  
**対象**: Permission-aware RAG FSxN CDK  
**バージョン**: Phase 5

## 📋 目次

1. [Bedrock Guardrailsとは](#bedrock-guardrailsとは)
2. [4つの主要機能](#4つの主要機能)
3. [設定可能なパラメーター](#設定可能なパラメーター)
4. [業界別プリセット](#業界別プリセット)
5. [実装例](#実装例)
6. [ベストプラクティス](#ベストプラクティス)

---

## Bedrock Guardrailsとは

Amazon Bedrock Guardrailsは、生成AIアプリケーションに**責任あるAI（Responsible AI）**のポリシーを適用するためのセキュリティ機能です。

### 主な目的

- **有害コンテンツのブロック**: 性的・暴力的・ヘイトスピーチ等の検出
- **個人情報保護**: PII（個人識別情報）の検出・匿名化・ブロック
- **トピック制御**: 特定のトピック（投資アドバイス、医療診断等）の禁止
- **不適切な言葉のフィルタリング**: 冒涜的な言葉やカスタムワードのブロック

### 適用タイミング

```
ユーザー入力
    ↓
【入力フィルタ】← Guardrails適用
    ↓
Bedrock Agent / LLM
    ↓
【出力フィルタ】← Guardrails適用
    ↓
ユーザーへの応答
```

---

## 4つの主要機能

### 1. コンテンツポリシー（Content Policy）

有害なコンテンツを検出してブロックします。

#### フィルタータイプ

| タイプ | 説明 | 例 |
|---|---|---|
| **SEXUAL** | 性的コンテンツ | 露骨な性的表現、アダルトコンテンツ |
| **VIOLENCE** | 暴力的コンテンツ | 暴力行為、傷害、殺人の描写 |
| **HATE** | ヘイトスピーチ | 人種差別、性差別、宗教差別 |
| **INSULTS** | 侮辱的コンテンツ | 個人攻撃、誹謗中傷 |
| **MISCONDUCT** | 不正行為 | 違法行為、詐欺、ハラスメント |
| **PROMPT_ATTACK** | プロンプトインジェクション | システムプロンプトの改ざん試行 |

#### フィルタ強度

| 強度 | 説明 | 使用場面 |
|---|---|---|
| **NONE** | フィルタなし | 出力のプロンプト攻撃検出（通常NONE） |
| **LOW** | 低（明らかな違反のみ） | 表現の自由を重視する場合 |
| **MEDIUM** | 中（バランス型） | 一般的な企業利用 |
| **HIGH** | 高（厳格） | 金融・医療等の規制業界 |

#### 設定例

```typescript
contentPolicyConfig: {
  filtersConfig: [
    {
      type: 'SEXUAL',
      inputStrength: 'MEDIUM',   // ユーザー入力の検査
      outputStrength: 'MEDIUM',  // AI応答の検査
    },
    {
      type: 'HATE',
      inputStrength: 'HIGH',     // 厳格に検査
      outputStrength: 'HIGH',
    },
    {
      type: 'PROMPT_ATTACK',
      inputStrength: 'HIGH',     // 入力のみ検査
      outputStrength: 'NONE',    // 出力は検査不要
    },
  ],
}
```

---

### 2. トピックポリシー（Topic Policy）

特定のトピックに関する会話を禁止します。

#### 使用例

- **金融業界**: 具体的な投資アドバイス、インサイダー取引
- **医療業界**: 医学的診断、処方薬の推奨
- **法律業界**: 法的助言、訴訟戦略

#### 設定例

```typescript
topicPolicyConfig: {
  topicsConfig: [
    {
      name: 'investment-advice',
      definition: '具体的な投資アドバイス、株式推奨、金融商品の勧誘を含むトピック',
      examples: [
        'この株を買うべきですか？',
        'どの投資信託がおすすめですか？',
        '今買うべき銘柄を教えてください',
      ],
      type: 'DENY',  // このトピックを拒否
    },
    {
      name: 'medical-diagnosis',
      definition: '具体的な医学的診断、治療法の推奨、処方薬の提案を含むトピック',
      examples: [
        'この症状は何の病気ですか？',
        'どの薬を飲むべきですか？',
        '治療法を教えてください',
      ],
      type: 'DENY',
    },
  ],
}
```

#### トピック定義のベストプラクティス

1. **明確な定義**: トピックの範囲を具体的に記述
2. **複数の例**: 3-5個の具体例を提供
3. **境界の明確化**: 許可される類似トピックとの違いを明示

---

### 3. 機密情報ポリシー（Sensitive Information Policy）

PII（個人識別情報）を検出して保護します。

#### アクション

| アクション | 説明 | 使用場面 |
|---|---|---|
| **BLOCK** | 完全にブロック | クレジットカード番号、パスワード |
| **ANONYMIZE** | 匿名化（マスキング） | 氏名、メールアドレス、電話番号 |

#### サポートされるPIIエンティティ

##### 個人情報

| エンティティ | 説明 | 例 |
|---|---|---|
| `NAME` | 氏名 | 山田太郎 |
| `EMAIL` | メールアドレス | taro@example.com |
| `PHONE` | 電話番号 | 03-1234-5678 |
| `ADDRESS` | 住所 | 東京都千代田区... |
| `AGE` | 年齢 | 35歳 |

##### 金融情報

| エンティティ | 説明 | 例 |
|---|---|---|
| `CREDIT_DEBIT_CARD_NUMBER` | クレジットカード番号 | 4111-1111-1111-1111 |
| `CREDIT_DEBIT_CARD_CVV` | CVV番号 | 123 |
| `CREDIT_DEBIT_CARD_EXPIRY` | 有効期限 | 12/25 |
| `US_BANK_ACCOUNT_NUMBER` | 米国銀行口座番号 | 123456789 |
| `US_BANK_ROUTING_NUMBER` | 米国ルーティング番号 | 021000021 |
| `INTERNATIONAL_BANK_ACCOUNT_NUMBER` | IBAN | DE89370400440532013000 |
| `SWIFT_CODE` | SWIFTコード | DEUTDEFF |

##### 政府発行ID

| エンティティ | 説明 | 例 |
|---|---|---|
| `US_SOCIAL_SECURITY_NUMBER` | 米国社会保障番号 | 123-45-6789 |
| `US_PASSPORT_NUMBER` | 米国パスポート番号 | 123456789 |
| `DRIVER_ID` | 運転免許証番号 | 123456789012 |
| `CA_SOCIAL_INSURANCE_NUMBER` | カナダ社会保険番号 | 123-456-789 |
| `UK_NATIONAL_INSURANCE_NUMBER` | 英国国民保険番号 | AB123456C |

##### 医療情報

| エンティティ | 説明 | 例 |
|---|---|---|
| `CA_HEALTH_NUMBER` | カナダ健康番号 | 1234567890 |
| `UK_NATIONAL_HEALTH_SERVICE_NUMBER` | 英国NHS番号 | 123 456 7890 |

##### 技術情報

| エンティティ | 説明 | 例 |
|---|---|---|
| `AWS_ACCESS_KEY` | AWSアクセスキー | AKIAIOSFODNN7EXAMPLE |
| `AWS_SECRET_KEY` | AWSシークレットキー | wJalrXUtnFEMI/K7MDENG/... |
| `PASSWORD` | パスワード | MyP@ssw0rd! |
| `IP_ADDRESS` | IPアドレス | 192.168.1.1 |
| `MAC_ADDRESS` | MACアドレス | 00:1B:44:11:3A:B7 |
| `URL` | URL | https://example.com |
| `USERNAME` | ユーザー名 | user123 |

##### その他

| エンティティ | 説明 | 例 |
|---|---|---|
| `LICENSE_PLATE` | ナンバープレート | ABC-1234 |
| `VEHICLE_IDENTIFICATION_NUMBER` | 車両識別番号 | 1HGBH41JXMN109186 |

#### 正規表現パターン（カスタムPII）

日本固有の情報など、標準エンティティでカバーされない情報を検出できます。

```typescript
sensitiveInformationPolicyConfig: {
  regexesConfig: [
    {
      name: 'japanese-bank-account',
      pattern: '\\d{7}',
      description: '日本の銀行口座番号（7桁）',
      action: 'BLOCK',
    },
    {
      name: 'japanese-credit-card',
      pattern: '\\d{4}-\\d{4}-\\d{4}-\\d{4}',
      description: '日本のクレジットカード番号',
      action: 'BLOCK',
    },
    {
      name: 'japanese-health-insurance',
      pattern: '\\d{8}',
      description: '日本の健康保険証番号（8桁）',
      action: 'BLOCK',
    },
    {
      name: 'medical-record-number',
      pattern: 'MRN-\\d{6,10}',
      description: '医療記録番号',
      action: 'BLOCK',
    },
  ],
}
```

#### 設定例

```typescript
sensitiveInformationPolicyConfig: {
  piiEntitiesConfig: [
    // 匿名化（マスキング）
    { type: 'EMAIL', action: 'ANONYMIZE' },        // → t***@example.com
    { type: 'PHONE', action: 'ANONYMIZE' },        // → 03-****-5678
    { type: 'NAME', action: 'ANONYMIZE' },         // → 山田**
    { type: 'ADDRESS', action: 'ANONYMIZE' },      // → 東京都***
    
    // 完全ブロック
    { type: 'PASSWORD', action: 'BLOCK' },
    { type: 'AWS_ACCESS_KEY', action: 'BLOCK' },
    { type: 'AWS_SECRET_KEY', action: 'BLOCK' },
    { type: 'CREDIT_DEBIT_CARD_NUMBER', action: 'BLOCK' },
    { type: 'CREDIT_DEBIT_CARD_CVV', action: 'BLOCK' },
    { type: 'US_SOCIAL_SECURITY_NUMBER', action: 'BLOCK' },
  ],
}
```

---

### 4. ワードポリシー（Word Policy）

特定の単語やフレーズをブロックします。

#### 管理対象ワードリスト

| タイプ | 説明 |
|---|---|
| `PROFANITY` | 冒涜的な言葉（AWS管理） |

#### カスタムワード

企業固有の禁止ワードを追加できます。

```typescript
wordPolicyConfig: {
  // AWS管理の冒涜的な言葉リスト
  managedWordListsConfig: [
    { type: 'PROFANITY' }
  ],
  
  // カスタム禁止ワード
  wordsConfig: [
    { text: '社外秘' },
    { text: '機密情報' },
    { text: 'confidential' },
    { text: 'internal only' },
  ],
}
```

---

## 設定可能なパラメーター

### GuardrailsConstructプロパティ

```typescript
interface BedrockGuardrailsConstructProps {
  // 基本設定
  enabled?: boolean;                    // Guardrails有効化
  projectName: string;                  // プロジェクト名
  environment: string;                  // 環境名
  guardrailName: string;                // Guardrail名
  description?: string;                 // 説明
  
  // ポリシー設定
  contentPolicyConfig?: GuardrailContentPolicyConfig;
  topicPolicyConfig?: GuardrailTopicPolicyConfig;
  sensitiveInformationPolicyConfig?: GuardrailSensitiveInformationPolicyConfig;
  wordPolicyConfig?: GuardrailWordPolicyConfig;
  
  // メッセージ設定
  blockedInputMessaging?: string;       // 入力ブロック時のメッセージ
  blockedOutputsMessaging?: string;     // 出力ブロック時のメッセージ
}
```

### ブロックメッセージのカスタマイズ

```typescript
// 一般企業向け
blockedInputMessaging: '申し訳ございません。この内容は企業ポリシーに違反するため処理できません。'
blockedOutputsMessaging: '申し訳ございません。この回答は企業ポリシーに違反するため提供できません。'

// 金融業界向け
blockedInputMessaging: '申し訳ございません。この内容は金融規制およびコンプライアンス要件に違反するため処理できません。'
blockedOutputsMessaging: '申し訳ございません。この回答は金融規制およびコンプライアンス要件に違反するため提供できません。'

// 医療業界向け
blockedInputMessaging: '申し訳ございません。この内容は医療規制およびHIPAA要件に違反するため処理できません。医療専門家にご相談ください。'
blockedOutputsMessaging: '申し訳ございません。この回答は医療規制およびHIPAA要件に違反するため提供できません。医療専門家にご相談ください。'
```

---

## 業界別プリセット

### 1. Standard（一般企業向け）

**用途**: 一般的な企業利用、社内チャットボット、カスタマーサポート

**特徴**:
- バランスの取れたフィルタリング（MEDIUM強度）
- 基本的なPII保護（匿名化中心）
- 冒涜的な言葉のフィルタリング

**設定内容**:
```typescript
{
  contentPolicy: {
    SEXUAL: MEDIUM,
    VIOLENCE: MEDIUM,
    HATE: HIGH,
    INSULTS: MEDIUM,
    MISCONDUCT: MEDIUM,
    PROMPT_ATTACK: HIGH (入力のみ)
  },
  piiProtection: [
    EMAIL, PHONE, NAME, ADDRESS → ANONYMIZE
    PASSWORD, AWS_KEYS, CREDIT_CARD → BLOCK
  ],
  wordPolicy: [
    PROFANITY (AWS管理)
  ]
}
```

### 2. Financial（金融業界向け）

**用途**: 銀行、証券会社、保険会社、フィンテック

**特徴**:
- 厳格なフィルタリング（HIGH強度）
- 金融規制対応（投資アドバイス禁止、インサイダー取引禁止）
- 包括的なPII保護（金融情報を完全ブロック）

**設定内容**:
```typescript
{
  contentPolicy: {
    全てHIGH強度
  },
  topicPolicy: [
    投資アドバイス禁止,
    インサイダー取引禁止,
    マネーロンダリング禁止
  ],
  piiProtection: [
    基本情報 → ANONYMIZE
    金融情報（口座番号、カード番号、SSN等） → BLOCK
    日本の銀行口座番号（正規表現） → BLOCK
  ],
  wordPolicy: [
    PROFANITY
  ]
}
```

### 3. Healthcare（医療業界向け）

**用途**: 病院、クリニック、製薬会社、医療機器メーカー

**特徴**:
- 厳格なフィルタリング（HIGH強度）
- HIPAA準拠（医療診断禁止、処方薬推奨禁止）
- PHI（保護対象医療情報）の完全保護

**設定内容**:
```typescript
{
  contentPolicy: {
    全てHIGH強度
  },
  topicPolicy: [
    医学的診断禁止,
    緊急医療対応禁止,
    処方薬推奨禁止
  ],
  piiProtection: [
    基本情報 + 年齢 → ANONYMIZE
    医療情報（健康保険番号、NHS番号等） → BLOCK
    日本の健康保険証番号（正規表現） → BLOCK
    医療記録番号（正規表現） → BLOCK
  ],
  wordPolicy: [
    PROFANITY
  ]
}
```

### 4. Education（教育・研究機関向け）

**用途**: 大学、研究所、学術機関、教育機関

**特徴**:
- 学術的自由の尊重（暴力的コンテンツは低強度）
- 研究倫理の徹底（学術不正行為を厳格に禁止）
- 学生情報保護（学籍番号、研究助成金番号を匿名化）

**設定内容**:
```typescript
{
  contentPolicy: {
    SEXUAL: MEDIUM,
    VIOLENCE: LOW,        // 研究目的での議論を許可
    HATE: HIGH,           // 差別は厳格に禁止
    INSULTS: MEDIUM,
    MISCONDUCT: HIGH,     // 学術不正は厳格に禁止
    PROMPT_ATTACK: HIGH (入力のみ)
  },
  topicPolicy: [
    学術不正行為禁止,
    試験カンニング禁止,
    学位・資格詐称禁止
  ],
  piiProtection: [
    基本情報 + 年齢 → ANONYMIZE
    学籍番号（正規表現） → ANONYMIZE
    研究助成金番号（正規表現） → ANONYMIZE
  ],
  wordPolicy: [
    PROFANITY
  ]
}
```

**学術的自由と研究倫理のバランス**:
- 暴力的コンテンツを`LOW`に設定することで、歴史・社会学・心理学などの研究での議論を許可
- 一方で、学術不正（論文盗用、データ改ざん）は`HIGH`で厳格に禁止
- 学生の個人情報は匿名化し、プライバシーを保護

### 5. Government（公共機関向け）

**用途**: 地方自治体、中央省庁、公的機関、公務員

**特徴**:
- 政治的中立性の維持（特定政党への支持表明を禁止）
- 情報管理の徹底（非公開情報の漏洩を防止）
- 公平性の確保（個人的意見の表明を禁止）

**設定内容**:
```typescript
{
  contentPolicy: {
    全てHIGH強度        // 公的機関として厳格
  },
  topicPolicy: [
    政治的偏向禁止,
    機密情報漏洩禁止,
    個人的意見表明禁止
  ],
  piiProtection: [
    基本情報 + 年齢 → ANONYMIZE
    マイナンバー（正規表現） → BLOCK
    公務員番号（正規表現） → ANONYMIZE
  ],
  wordPolicy: [
    PROFANITY
  ]
}
```

**公共機関特有の要件**:
- 政治的中立性を保つため、特定政党・政治家への支持表明を禁止
- 非公開の行政情報、機密文書の漏洩を防止
- 公務員個人の意見ではなく、組織としての公式見解のみを提供

---

## 実装例

### SecurityStackでの作成

```typescript
// cdk.jsonで設定
{
  "context": {
    "useBedrockGuardrails": true,
    "guardrailPreset": "financial"  // standard/financial/healthcare
  }
}

// SecurityStackが自動的にGuardrailsを作成
const securityStack = new SecurityStack(app, 'SecurityStack', {
  projectName: 'permission-aware-rag',
  environment: 'prod',
  useBedrockGuardrails: true,
  guardrailPreset: 'financial',
});

// Guardrail ARNを取得
const guardrailArn = securityStack.guardrailArn;
```

### EmbeddingStackでの適用

```typescript
// SecurityStackからGuardrail ARNを受け取る
const embeddingStack = new EmbeddingStack(app, 'EmbeddingStack', {
  projectName: 'permission-aware-rag',
  environment: 'prod',
  useBedrockAgent: true,
  guardrailArn: securityStack.guardrailArn,  // SecurityStackから取得
});
```

### Bedrock Agentへの適用

```typescript
// BedrockAgentConstructが自動的にGuardrailsを適用
const agent = new BedrockAgentConstruct(this, 'Agent', {
  projectName: 'permission-aware-rag',
  environment: 'prod',
  agentName: 'rag-agent',
  instruction: '...',
  guardrailArn: props.guardrailArn,      // SecurityStackから渡される
  guardrailVersion: 'DRAFT',              // または特定のバージョン
});
```

---

## ベストプラクティス

### 1. プリセットの選択

```
一般企業 → standard
金融業界 → financial
医療業界 → healthcare
```

### 2. 段階的な導入

```
Phase 1: standardプリセットで開始
    ↓
Phase 2: 業界固有の要件を追加
    ↓
Phase 3: カスタムトピック・ワードを追加
    ↓
Phase 4: 本番環境で運用
```

### 3. フィルタ強度の調整

| 環境 | 推奨強度 | 理由 |
|---|---|---|
| 開発環境 | LOW-MEDIUM | テストの柔軟性 |
| ステージング環境 | MEDIUM | 本番に近い検証 |
| 本番環境 | MEDIUM-HIGH | セキュリティ優先 |
| 規制業界 | HIGH | コンプライアンス要件 |

### 4. PII保護の戦略

```
機密度: 低 → ANONYMIZE（匿名化）
機密度: 中 → ANONYMIZE（匿名化）
機密度: 高 → BLOCK（完全ブロック）
```

**例**:
- 氏名、メールアドレス → ANONYMIZE（ログに残しても問題ない）
- クレジットカード番号、パスワード → BLOCK（絶対に処理しない）

### 5. カスタムトピックの設計

```typescript
// ❌ 悪い例（曖昧）
{
  name: 'bad-stuff',
  definition: '悪いこと',
  examples: ['悪いこと'],
  type: 'DENY',
}

// ✅ 良い例（具体的）
{
  name: 'investment-advice',
  definition: '具体的な投資アドバイス、株式推奨、金融商品の勧誘、ポートフォリオ構成の提案を含むトピック。一般的な金融教育や市場動向の説明は含まない。',
  examples: [
    'この株を買うべきですか？',
    'どの投資信託がおすすめですか？',
    '今買うべき銘柄を教えてください',
    'ポートフォリオをどう組むべきですか？',
    'この会社の株価は上がりますか？',
  ],
  type: 'DENY',
}
```

### 6. 監視とチューニング

1. **ログ分析**: ブロックされた入力/出力を定期的に確認
2. **誤検知の修正**: 過剰なブロックがあれば強度を調整
3. **漏れの検出**: ブロックすべき内容が通過していないか確認
4. **定期レビュー**: 四半期ごとにポリシーを見直し

---

## まとめ

Bedrock Guardrailsは、生成AIアプリケーションに**4つの主要なセキュリティレイヤー**を提供します：

1. **コンテンツポリシー**: 有害コンテンツのブロック
2. **トピックポリシー**: 禁止トピックの制御
3. **機密情報ポリシー**: PII保護
4. **ワードポリシー**: 不適切な言葉のフィルタリング

業界別プリセット（standard/financial/healthcare/education/government）を使用することで、迅速に責任あるAIを実装できます。

**関連ドキュメント**:
- `lib/modules/security/config/guardrails-presets.ts` - プリセット実装
- `lib/modules/security/constructs/bedrock-guardrails-construct.ts` - コンストラクト実装
- `docs/security/BEDROCK_GUARDRAILS_KNOWLEDGE_BASE_VS_AGENT.md` - Knowledge Base vs Agent の違い
- `development/docs/completion/bedrock-guardrails-relocation-20251111.md` - 実装完了レポート
