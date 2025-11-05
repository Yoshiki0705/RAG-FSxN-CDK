# スタック統合・依存関係整理計画

## 📋 現在のスタック状況

### ✅ デプロイ済みスタック

#### 1. rag-system-prod-Security (CDK管理下)
- **状態**: CREATE_COMPLETE
- **管理**: 統合CDKアプリケーション
- **リソース**: KMS Key, WAF WebACL
- **出力**: 
  - KmsKeyId: `781ad5cd-8b6b-4d11-9146-dab63a2147d6`
  - KmsKeyArn: `arn:aws:kms:ap-northeast-1:178625946981:key/781ad5cd-8b6b-4d11-9146-dab63a2147d6`
  - WafWebAclId: `d0fdcdae-e606-4aa9-8d37-ddf8ed4bb8ea`

#### 2. TokyoRegion-permission-aware-rag-prod-Data (レガシー)
- **状態**: CREATE_COMPLETE
- **管理**: 旧CDKアプリケーション
- **リソース**: S3バケット、DynamoDB、FSx for ONTAP
- **出力**:
  - DocumentsBucketName: `tokyoregion-permission-aw-storageconstructdocument-tavuxtzodhgz`
  - SessionTableName: `TokyoRegion-permission-aware-rag-prod-Data-DatabaseConstructSessionTableB7A378FC-MAR9Z6MWLWDC`
  - FSxOntapFileSystemId: `fs-0efd9429aa9ba839a`

#### 3. TokyoRegion-permission-aware-rag-prod-Networking (レガシー)
- **状態**: UPDATE_COMPLETE
- **管理**: 旧CDKアプリケーション
- **リソース**: VPC、サブネット、セキュリティグループ
- **出力**:
  - VpcId: `vpc-09aa251d6db52b1fc`
  - PrivateSubnetIds: `subnet-0a84a16a1641e970f,subnet-0c4599b4863ff4d33,subnet-0c9ad18a58c06e7c5`
  - PublicSubnetIds: `subnet-06a00a8866d09b912,subnet-0d7c7e43c1325cd3b,subnet-06df589d2ed2a5fc0`

## 🎯 統合戦略

### Phase 1: 依存関係の整理
1. **既存リソースの参照方法確立**
   - CloudFormation Export/Import使用
   - 既存リソースIDの直接参照

2. **統合CDKアプリケーションでの既存リソース活用**
   - VPC: `vpc-09aa251d6db52b1fc`
   - KMS Key: `781ad5cd-8b6b-4d11-9146-dab63a2147d6`
   - Private Subnets: 既存サブネット活用

### Phase 2: 新規スタックのデプロイ
1. **ComputeStack (コンピュート・AI統合)**
   - Lambda関数群
   - AWS Batch (本番環境)
   - Bedrock統合

2. **WebAppStack (API・フロントエンド統合)**
   - API Gateway
   - CloudFront
   - Cognito

3. **OperationsStack (監視・エンタープライズ統合)**
   - CloudWatch
   - X-Ray
   - SNS

### Phase 3: レガシースタックの段階的移行 (将来)
1. **データスタック移行**
   - 既存リソースのインポート
   - 新規統合スタックへの移行

2. **ネットワークスタック移行**
   - 既存VPCの活用継続
   - 新規リソースは統合スタックで管理

## 🔧 実装計画

### 1. 本番環境統合CDKアプリケーションの拡張

#### 既存リソース参照の実装
```typescript
// 既存VPCの参照
const existingVpc = ec2.Vpc.fromVpcAttributes(this, 'ExistingVpc', {
  vpcId: 'vpc-09aa251d6db52b1fc',
  availabilityZones: ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
  privateSubnetIds: [
    'subnet-0a84a16a1641e970f',
    'subnet-0c4599b4863ff4d33', 
    'subnet-0c9ad18a58c06e7c5'
  ],
  publicSubnetIds: [
    'subnet-06a00a8866d09b912',
    'subnet-0d7c7e43c1325cd3b',
    'subnet-06df589d2ed2a5fc0'
  ]
});

// 既存KMS Keyの参照
const existingKmsKey = kms.Key.fromKeyArn(this, 'ExistingKmsKey', 
  'arn:aws:kms:ap-northeast-1:178625946981:key/781ad5cd-8b6b-4d11-9146-dab63a2147d6'
);
```

#### 新規スタックの依存関係設定
```typescript
// ComputeStack
const computeStack = new ComputeStack(this.app, `${this.stackPrefix}-Compute`, {
  env: this.env,
  vpc: existingVpc,
  kmsKey: existingKmsKey,
  // 既存データリソースの参照
  documentsBucket: s3.Bucket.fromBucketName(this, 'ExistingDocumentsBucket', 
    'tokyoregion-permission-aw-storageconstructdocument-tavuxtzodhgz'),
  sessionTable: dynamodb.Table.fromTableName(this, 'ExistingSessionTable',
    'TokyoRegion-permission-aware-rag-prod-Data-DatabaseConstructSessionTableB7A378FC-MAR9Z6MWLWDC')
});
```

### 2. 段階的デプロイメント順序

#### Step 1: ComputeStack
- **依存関係**: Security, 既存VPC, 既存Data
- **リソース**: Lambda関数、Batch環境、Bedrock統合
- **優先度**: High (AIコア機能)

#### Step 2: WebAppStack  
- **依存関係**: Security, Compute, 既存VPC
- **リソース**: API Gateway、CloudFront、Cognito
- **優先度**: High (フロントエンド)

#### Step 3: OperationsStack
- **依存関係**: 全スタック
- **リソース**: CloudWatch、X-Ray、SNS
- **優先度**: Medium (監視・運用)

## 📊 リスク評価と対策

### 🔴 High Risk
1. **既存リソースへの影響**
   - **リスク**: 既存スタック変更時の影響
   - **対策**: 読み取り専用参照、段階的移行

2. **依存関係の複雑化**
   - **リスク**: スタック間の循環依存
   - **対策**: 明確な依存関係定義、Export/Import活用

### 🟡 Medium Risk
1. **命名規則の不整合**
   - **リスク**: 新旧スタック間の命名不整合
   - **対策**: 統一命名規則の適用

2. **タグ管理の複雑化**
   - **リスク**: 新旧リソースのタグ不整合
   - **対策**: 統一タグ戦略の適用

## 🎯 成功指標

### 技術指標
- [ ] 新規スタックのデプロイ成功率: 100%
- [ ] 既存リソースへの影響: 0件
- [ ] 依存関係エラー: 0件
- [ ] デプロイ時間: 各スタック15分以内

### 運用指標
- [ ] 統合CDK管理下リソース: 80%以上
- [ ] 統一命名規則適用: 100%
- [ ] 統一タグ適用: 100%
- [ ] ドキュメント整備: 完了

## 📅 実装スケジュール

### Week 1: 基盤整備
- [ ] 既存リソース参照実装
- [ ] 統合CDKアプリケーション拡張
- [ ] ComputeStack実装

### Week 2: フロントエンド統合
- [ ] ComputeStackデプロイ
- [ ] WebAppStack実装・デプロイ
- [ ] 統合テスト

### Week 3: 運用統合
- [ ] OperationsStackデプロイ
- [ ] 監視・アラート設定
- [ ] ドキュメント整備

### Week 4: 最適化・移行準備
- [ ] パフォーマンス最適化
- [ ] レガシースタック移行計画
- [ ] 運用手順書作成

## 🔄 次のアクション

1. **ComputeStackの実装開始**
2. **既存リソース参照の実装**
3. **統合CDKアプリケーションの拡張**
4. **段階的デプロイメントの実行**