# Cognito VPC Endpoint 設定ガイド

**最終更新**: 2025年11月10日

## 📋 概要

このドキュメントでは、Cognito VPC Endpointの設定方法と優先順位について説明します。

## 🎯 設定方法

Cognito VPC Endpointの有効/無効は、以下の3つの方法で制御できます。

### 優先順位

1. **設定ファイル** (`lib/config/environments/*.ts`)
2. **CDKコンテキスト変数** (`cdk.json` または `-c` オプション)
3. **デフォルト値** (false - Public接続モード)

## 📝 設定例

### 方法1: 設定ファイルで制御（推奨）

**ファイル**: `lib/config/environments/tokyo-production-config.ts`

```typescript
export const tokyoProductionConfig: EnvironmentConfig = {
  // ... 他の設定 ...
  
  networking: {
    // ... 他のネットワーク設定 ...
    
    vpcEndpoints: {
      s3: true,
      dynamodb: true,
      
      // Cognito VPC Endpoint設定
      cognito: {
        // Private接続モードを有効化
        enabled: true,
        
        // プライベートDNSを有効化（推奨）
        enablePrivateDns: true,
        
        // VPC Endpointを配置するサブネット
        subnets: {
          subnetType: 'PRIVATE_WITH_EGRESS', // プライベートサブネット（推奨）
        },
        
        // セキュリティグループの説明
        securityGroupDescription: 'Security group for Cognito VPC Endpoint',
        
        // インバウンドトラフィックを許可するCIDRブロック（オプション）
        // 指定しない場合、VPC CIDRが使用される
        allowedCidrs: ['10.0.0.0/16'],
      },
    },
  },
};
```

**デプロイ**:
```bash
npx cdk deploy NetworkingStack
```

### 方法2: CDKコンテキスト変数で制御

#### cdk.jsonで設定

**ファイル**: `cdk.json`

```json
{
  "context": {
    "cognitoPrivateEndpoint": true
  }
}
```

**デプロイ**:
```bash
npx cdk deploy NetworkingStack
```

#### コマンドラインオプションで設定

```bash
# Private接続モード有効化
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=true

# Public接続モード（デフォルト）
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=false
```

### 方法3: デフォルト値（設定なし）

設定を指定しない場合、デフォルトでPublic接続モード（VPC Endpoint無効）になります。

```bash
npx cdk deploy NetworkingStack
```

## 🔧 設定パラメータ詳細

### CognitoVpcEndpointConfig

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `enabled` | boolean | false | Cognito VPC Endpointを作成するかどうか |
| `enablePrivateDns` | boolean | true | プライベートDNSを有効化するかどうか |
| `subnets.subnetType` | string | 'PRIVATE_WITH_EGRESS' | VPC Endpointを配置するサブネットタイプ |
| `securityGroupDescription` | string | 'Security group for Cognito VPC Endpoint' | セキュリティグループの説明 |
| `allowedCidrs` | string[] | [VPC CIDR] | インバウンドトラフィックを許可するCIDRブロック |

### サブネットタイプ

- **PRIVATE_WITH_EGRESS** (推奨): プライベートサブネット（NAT Gateway経由でインターネット接続可能）
- **PRIVATE_ISOLATED**: 完全に分離されたプライベートサブネット（インターネット接続不可）
- **PUBLIC**: パブリックサブネット（非推奨）

## 🎨 設定パターン

### パターン1: 開発環境（Public接続モード）

```typescript
networking: {
  vpcEndpoints: {
    cognito: {
      enabled: false, // Public接続モード
    },
  },
}
```

**特徴**:
- コスト: $0/月
- セキュリティ: 標準
- 用途: 開発環境、テスト環境

### パターン2: 本番環境（Private接続モード - 基本）

```typescript
networking: {
  vpcEndpoints: {
    cognito: {
      enabled: true,
      enablePrivateDns: true,
      subnets: {
        subnetType: 'PRIVATE_WITH_EGRESS',
      },
    },
  },
}
```

**特徴**:
- コスト: 約$8/月
- セキュリティ: 高
- 用途: 本番環境、一般企業

### パターン3: 本番環境（Private接続モード - 高セキュリティ）

```typescript
networking: {
  vpcEndpoints: {
    cognito: {
      enabled: true,
      enablePrivateDns: true,
      subnets: {
        subnetType: 'PRIVATE_ISOLATED', // 完全分離
      },
      allowedCidrs: ['10.0.1.0/24', '10.0.2.0/24'], // 特定のサブネットのみ許可
    },
  },
}
```

**特徴**:
- コスト: 約$8/月
- セキュリティ: 最高
- 用途: 金融機関、医療機関

## 🔍 設定確認

### 現在の設定を確認

```bash
# CDK差分確認
npx cdk diff NetworkingStack

# VPC Endpoint確認
./development/scripts/deployment/verify-cognito-vpc-endpoint.sh
```

### 設定の優先順位を確認

```typescript
// NetworkingConstructの実装
const cognitoConfig = config.vpcEndpoints?.cognito;
const cognitoEnabled = cognitoConfig?.enabled ?? 
  scope.node.tryGetContext('cognitoPrivateEndpoint') === true;
```

**確認順序**:
1. `config.vpcEndpoints?.cognito?.enabled` をチェック
2. 設定されていない場合、CDKコンテキスト変数 `cognitoPrivateEndpoint` をチェック
3. どちらも設定されていない場合、デフォルト値 `false` を使用

## 💡 ベストプラクティス

### 1. 環境別設定

```typescript
// 開発環境
export const tokyoDevelopmentConfig: EnvironmentConfig = {
  networking: {
    vpcEndpoints: {
      cognito: { enabled: false }, // Public接続モード
    },
  },
};

// 本番環境
export const tokyoProductionConfig: EnvironmentConfig = {
  networking: {
    vpcEndpoints: {
      cognito: { enabled: true }, // Private接続モード
    },
  },
};
```

### 2. CDKコンテキスト変数での一時的な切り替え

```bash
# 本番環境でテスト的にPublic接続モードを使用
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=false

# 開発環境でPrivate接続モードをテスト
npx cdk deploy NetworkingStack -c cognitoPrivateEndpoint=true
```

### 3. プライベートDNSの有効化

プライベートDNSを有効化することで、VPC内から `cognito-idp.{region}.amazonaws.com` でVPC Endpoint経由でアクセス可能になります。

```typescript
cognito: {
  enabled: true,
  enablePrivateDns: true, // 推奨
}
```

### 4. セキュリティグループの最小権限

```typescript
cognito: {
  enabled: true,
  allowedCidrs: [
    '10.0.1.0/24', // Lambda関数のサブネット
    '10.0.2.0/24', // ECSタスクのサブネット
  ],
}
```

## 🔄 モード切り替え

### Public → Private への切り替え

```bash
# 設定ファイルを更新
# cognito.enabled: false → true

# デプロイ
npx cdk deploy NetworkingStack

# 確認
./development/scripts/deployment/verify-cognito-vpc-endpoint.sh
```

### Private → Public への切り替え

```bash
# 設定ファイルを更新
# cognito.enabled: true → false

# デプロイ
npx cdk deploy NetworkingStack

# VPC Endpointが削除されることを確認
npx cdk diff NetworkingStack
```

## 📚 関連ドキュメント

- [デプロイメントガイド](../deployment/COGNITO_VPC_ENDPOINT_DEPLOYMENT_GUIDE.md)
- [要件定義書](../../.kiro/specs/security-network-enhancements/requirements.md)
- [設計書](../../.kiro/specs/security-network-enhancements/design.md)

## ✅ チェックリスト

- [ ] 設定ファイルの更新完了
- [ ] CDK差分確認完了
- [ ] デプロイ実行完了
- [ ] VPC Endpoint動作確認完了
- [ ] DNS解決テスト完了
- [ ] 認証フローテスト完了

