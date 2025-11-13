# Bedrock Guardrails: Knowledge Base vs Agent の違い

**作成日**: 2025-11-11  
**対象**: Permission-aware RAG FSxN CDK  
**バージョン**: Phase 5

## 📋 目次

1. [概要](#概要)
2. [Knowledge Base での Guardrails](#knowledge-base-での-guardrails)
3. [Agent での Guardrails](#agent-での-guardrails)
4. [実装の違い](#実装の違い)
5. [業界別プリセットの完全版](#業界別プリセットの完全版)
6. [推奨構成](#推奨構成)

---

## 概要

Bedrock GuardrailsはKnowledge BaseとAgentで**適用方法と範囲が異なります**。

### 基本的な違い

| 項目 | Knowledge Base | Agent |
|---|---|---|
| **適用範囲** | 検索クエリ・検索結果 | 全ての入力・出力 |
| **設定場所** | RetrieveAndGenerate API | Agent設定 |
| **制御レベル** | 検索特化 | 会話全体 |
| **実装方法** | API呼び出し時に指定 | Agent作成時に設定 |

---

## Knowledge Base での Guardrails

### 適用タイミング

```
ユーザークエリ
    ↓
【入力フィルタ】← Guardrails適用（検索クエリ）
    ↓
Knowledge Base検索
    ↓
【出力フィルタ】← Guardrails適用（検索結果）
    ↓
LLMによる回答生成
    ↓
【出力フィルタ】← Guardrails適用（最終回答）
    ↓
ユーザーへの応答
```

### 実装方法（Lambda関数での使用例）

```typescript
// RetrieveAndGenerate API呼び出し時にGuardrailsを指定
const response = await bedrockAgent.retrieveAndGenerate({
  input: {
    text: userQuery,
  },
  retrieveAndGenerateConfiguration: {
    type: 'KNOWLEDGE_BASE',
    knowledgeBaseConfiguration: {
      knowledgeBaseId: 'your-kb-id',
      modelArn: 'arn:aws:bedrock:region::foundation-model/anthropic.claude-v2',
      // Guardrails設定
      generationConfiguration: {
        guardrailConfiguration: {
          guardrailId: 'your-guardrail-id',
          guardrailVersion: 'DRAFT',
        },
      },
    },
  },
});
```

### 特徴

- **検索特化**: 検索クエリと検索結果に特化したフィルタリング
- **動的適用**: API呼び出し毎に異なるGuardrailsを適用可能
- **細かい制御**: 検索フェーズと生成フェーズで異なる制御が可能

---

## Agent での Guardrails

### 適用タイミング

```
ユーザー入力
    ↓
【入力フィルタ】← Guardrails適用（全入力）
    ↓
Agent処理（推論・Action Groups・Knowledge Base）
    ↓
【出力フィルタ】← Guardrails適用（全出力）
    ↓
ユーザーへの応答
```

### 実装方法（CDKでの設定）

```typescript
// Agent作成時にGuardrailsを設定
const agent = new bedrock.CfnAgent(this, 'Agent', {
  agentName: 'rag-agent',
  agentResourceRoleArn: agentRole.roleArn,
  foundationModel: 'anthropic.claude-v2',
  instruction: 'You are a helpful assistant...',
  
  // Guardrails設定（Agent全体に適用）
  guardrailConfiguration: {
    guardrailIdentifier: 'your-guardrail-arn',
    guardrailVersion: 'DRAFT',
  },
});
```

### 特徴

- **包括的制御**: Agent全体の入力・出力を制御
- **一貫性**: 全ての会話で同じポリシーを適用
- **統合管理**: 1つのGuardrailsで全機能を制御

---

## 実装の違い

### 現在の実装状況

#### ✅ Agent での Guardrails（実装済み）

```typescript
// BedrockAgentConstruct
export interface BedrockAgentConstructProps {
  // ... 他のプロパティ
  
  /**
   * Guardrail ARN（オプション - Phase 5）
   * SecurityStackから取得したGuardrail ARNを指定
   */
  guardrailArn?: string;

  /**
   * Guardrail Version（オプション - Phase 5）
   * @default DRAFT
   */
  guardrailVersion?: string;
}

// Agent作成時にGuardrailsを適用
private createAgent(props: BedrockAgentConstructProps): bedrock.CfnAgent {
  const agentConfig: any = {
    // ... 基本設定
  };

  // Guardrails設定
  if (props.guardrailArn) {
    agentConfig.guardrailConfiguration = {
      guardrailIdentifier: props.guardrailArn,
      guardrailVersion: props.guardrailVersion || 'DRAFT',
    };
  }

  return new bedrock.CfnAgent(this, 'Agent', agentConfig);
}
```

#### 🔄 Knowledge Base での Guardrails（要実装）

現在のプロジェクトでは**Knowledge Base単体での実装はありません**。
AgentがKnowledge Baseを使用する際は、**Agent レベルのGuardrailsが適用**されます。

```typescript
// 現在の実装: AgentがKnowledge Baseを使用
private createAgent(props: BedrockAgentConstructProps): bedrock.CfnAgent {
  // ...
  
  // Knowledge Base関連付け（指定されている場合）
  if (props.knowledgeBaseArn) {
    agent.knowledgeBases = [
      {
        knowledgeBaseId: this.extractKnowledgeBaseId(props.knowledgeBaseArn),
        description: 'Permission-aware RAG Knowledge Base',
        knowledgeBaseState: 'ENABLED',
      },
    ];
  }
  
  // ✅ Agent レベルのGuardrailsが自動適用される
  // ❌ Knowledge Base 固有のGuardrailsは設定されていない
}
```

### 推奨アプローチ

**現在のプロジェクト構成では、Agent レベルのGuardrailsで十分です。**

理由:
1. **統一性**: 全ての機能（推論・Action Groups・Knowledge Base）で一貫したポリシー
2. **管理の簡素化**: 1つのGuardrailsで全体を制御
3. **実装の簡潔性**: 複雑な設定が不要

---

## 業界別プリセットの完全版

### 1. Standard（一般企業向け）

**対象**: 一般的な企業、スタートアップ、中小企業

**特徴**:
- **バランス重視**: セキュリティと利便性のバランス
- **基本的な保護**: 標準的なコンテンツフィルタリング
- **柔軟性**: 幅広い業種に対応

**主要設定**:
```typescript
{
  contentPolicy: {
    SEXUAL: MEDIUM,
    VIOLENCE: MEDIUM,
    HATE: HIGH,
    INSULTS: MEDIUM,
    MISCONDUCT: MEDIUM,
    PROMPT_ATTACK: HIGH,
  },
  piiProtection: [
    'EMAIL → ANONYMIZE',
    'PHONE → ANONYMIZE',
    'PASSWORD → BLOCK',
    'AWS_ACCESS_KEY → BLOCK',
  ]
}
```

### 2. Financial（金融業界向け）

**対象**: 銀行、証券会社、保険会社、フィンテック企業

**特徴**:
- **厳格なコンプライアンス**: 金融規制対応
- **投資アドバイス禁止**: 具体的な投資推奨を防止
- **金融情報保護**: 口座番号、カード番号を完全ブロック

**主要設定**:
```typescript
{
  contentPolicy: {
    全てHIGH強度,
  },
  topicPolicy: [
    '投資アドバイス禁止',
    'インサイダー取引禁止',
    'マネーロンダリング禁止',
  ],
  piiProtection: [
    'CREDIT_DEBIT_CARD_NUMBER → BLOCK',
    'BANK_ACCOUNT_NUMBER → BLOCK',
    'SWIFT_CODE → BLOCK',
  ]
}
```

### 3. Healthcare（医療業界向け）

**対象**: 病院、クリニック、製薬会社、医療機器メーカー

**特徴**:
- **HIPAA準拠**: 米国医療保険の相互運用性と説明責任に関する法律
- **医療診断禁止**: 具体的な診断・治療法の推奨を防止
- **PHI保護**: 保護対象医療情報の厳格な管理

**主要設定**:
```typescript
{
  contentPolicy: {
    全てHIGH強度,
  },
  topicPolicy: [
    '医療診断禁止',
    '緊急医療対応禁止',
    '処方薬推奨禁止',
  ],
  piiProtection: [
    'HEALTH_INSURANCE_NUMBER → BLOCK',
    'MEDICAL_RECORD_NUMBER → BLOCK',
    'PRESCRIPTION_NUMBER → BLOCK',
  ]
}
```

### 4. Education（教育・研究機関向け）

**対象**: 大学、研究所、学術機関、教育機関

**特徴**:
- **学術的自由の尊重**: 暴力的コンテンツは低強度（研究目的を考慮）
- **研究倫理の徹底**: 学術不正行為を厳格に禁止
- **学生情報保護**: 学籍番号、研究助成金番号を匿名化

**主要設定**:
```typescript
{
  contentPolicy: {
    VIOLENCE: LOW,        // 研究目的での議論を許可
    HATE: HIGH,           // 差別は厳格に禁止
    MISCONDUCT: HIGH,     // 学術不正は厳格に禁止
  },
  topicPolicy: [
    '学術不正行為禁止',
    '試験カンニング禁止',
    '学位・資格詐称禁止',
  ],
  piiProtection: [
    '学籍番号 → ANONYMIZE',
    '研究助成金番号 → ANONYMIZE',
  ]
}
```

**学術的自由と研究倫理のバランス**:
- 暴力的コンテンツを`LOW`に設定することで、歴史・社会学・心理学などの研究での議論を許可
- 一方で、学術不正（論文盗用、データ改ざん）は`HIGH`で厳格に禁止
- 学生の個人情報は匿名化し、プライバシーを保護

### 5. Government（公共機関向け）

**対象**: 地方自治体、中央省庁、公的機関、公務員

**特徴**:
- **政治的中立性**: 特定政党への支持表明を禁止
- **情報管理**: 非公開情報の漏洩を防止
- **公平性**: 個人的意見の表明を禁止

**主要設定**:
```typescript
{
  contentPolicy: {
    全てHIGH強度,        // 公的機関として厳格
  },
  topicPolicy: [
    '政治的偏向禁止',
    '機密情報漏洩禁止',
    '個人的意見表明禁止',
  ],
  piiProtection: [
    'マイナンバー → BLOCK',
    '公務員番号 → ANONYMIZE',
  ]
}
```

**公共機関特有の要件**:
- 政治的中立性を保つため、特定政党・政治家への支持表明を禁止
- 非公開の行政情報、機密文書の漏洩を防止
- 公務員個人の意見ではなく、組織としての公式見解のみを提供

---

## プリセット選択ガイド

### 業種別推奨プリセット

| 組織タイプ | 推奨プリセット | 主な理由 |
|---|---|---|
| 一般企業 | `standard` | バランスの取れた設定 |
| 銀行・証券 | `financial` | 金融規制対応 |
| 病院・製薬 | `healthcare` | HIPAA準拠 |
| 大学・研究所 | `education` | 学術的自由と研究倫理 |
| 自治体・省庁 | `government` | 政治的中立性と情報管理 |

### 設定例

```typescript
// cdk.json
{
  "context": {
    "useBedrockGuardrails": true,
    "guardrailPreset": "education",  // 教育機関向け
    "useBedrockAgent": true
  }
}
```

---

## 推奨構成

### 現在のプロジェクト（Agent中心）

```
┌─────────────────────────────────────────────────┐
│ SecurityStack                                    │
│ └── Bedrock Guardrails                          │
│     ├── standard/financial/healthcare/          │
│     │   education/government プリセット         │
│     └── 業界固有のポリシー設定                  │
└─────────────────────────────────────────────────┘
                    ↓ guardrailArn
┌─────────────────────────────────────────────────┐
│ EmbeddingStack                                   │
│ └── Bedrock Agent                               │
│     ├── Agent レベル Guardrails適用            │
│     ├── Knowledge Base 統合                     │
│     └── Action Groups 統合                      │
└─────────────────────────────────────────────────┘
```

### デプロイ手順

```bash
# 1. SecurityStackをデプロイ（Guardrails作成）
cdk deploy SecurityStack -c guardrailPreset=education

# 2. EmbeddingStackをデプロイ（Agent作成）
cdk deploy EmbeddingStack -c useBedrockAgent=true

# 3. 動作確認
aws bedrock-agent get-agent --agent-id <agent-id>
```

### 利点

1. **統一性**: Agent・Knowledge Base・Action Groups全てで同じポリシー
2. **管理の簡素化**: 1つのGuardrailsで全体を制御
3. **業界対応**: 5つのプリセットで幅広い業界をカバー
4. **拡張性**: 必要に応じてカスタムポリシーを追加可能

---

## まとめ

### Knowledge Base vs Agent の違い

- **Knowledge Base**: 検索特化、動的適用、細かい制御
- **Agent**: 包括的制御、一貫性、統合管理

### 現在の実装

- ✅ **Agent レベル Guardrails**: 完全実装済み
- ❌ **Knowledge Base 単体 Guardrails**: 未実装（不要）

### 業界別プリセット

- ✅ **5つのプリセット**: standard, financial, healthcare, education, government
- ✅ **幅広いカバレッジ**: 一般企業から専門機関まで対応

### 推奨アプローチ

**Agent レベルのGuardrailsで統一的にセキュリティポリシーを適用**することで、
管理が簡素化され、一貫性のあるセキュリティ制御が実現できます。

---

## 関連ドキュメント

- `lib/modules/security/config/guardrails-presets.ts` - 拡張されたプリセット実装
- `lib/modules/ai/constructs/bedrock-agent-construct.ts` - Agent Guardrails実装
- `docs/security/BEDROCK_GUARDRAILS_GUIDE.md` - 完全ガイド
- `lib/stacks/integrated/security-stack.ts` - SecurityStack実装
- `lib/stacks/integrated/embedding-stack.ts` - EmbeddingStack実装
