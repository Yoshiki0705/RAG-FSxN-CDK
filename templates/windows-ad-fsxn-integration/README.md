# Windows AD FSxN統合環境 CloudFormationテンプレート

別のAWSアカウントでWindows EC2サーバーとActive Directoryサーバーを兼用し、既存のFSx for NetApp ONTAPファイルシステムをActive Directoryドメインに参加させる環境を構築するCloudFormationテンプレート集です。

## 概要

このテンプレートは以下の機能を提供します：

- **Windows Server 2022 + Active Directory**: EC2インスタンス上でのADドメインコントローラー自動構築
- **FSx ONTAP統合**: 既存のFSx for ONTAPファイルシステムのドメイン参加
- **SID埋め込み**: エンタープライズグレードのセキュリティ機能
- **ネストされたスタック**: モジュラー構成による保守性向上
- **パラメータ化**: 環境別設定の柔軟な管理

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Account (別アカウント)                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                        VPC                              │  │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐  │  │
│  │  │ Public Subnet   │    │      Private Subnet         │  │  │
│  │  │                 │    │                             │  │  │
│  │  │  NAT Gateway    │    │  Windows Server 2022        │  │  │
│  │  │                 │    │  + Active Directory         │  │  │
│  │  │                 │    │                             │  │  │
│  │  └─────────────────┘    │  FSx for NetApp ONTAP       │  │  │
│  │           │              │  (既存・ドメイン参加)          │  │  │
│  │  Internet Gateway        │                             │  │  │
│  │                          └─────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  セキュリティ: IAM・セキュリティグループ・WAF                      │
│  監視: CloudWatch・Systems Manager・CloudTrail                │
└─────────────────────────────────────────────────────────────┘
```

## ディレクトリ構造

```
templates/windows-ad-fsxn-integration/
├── README.md                                    # このファイル
├── windows-ad-fsxn-environment.yaml            # メインテンプレート
├── nested-stacks/                              # ネストされたスタック
│   ├── network-stack.yaml                      # ネットワーク基盤
│   ├── security-stack.yaml                     # セキュリティ設定
│   ├── windows-ad-stack.yaml                   # Windows AD設定
│   ├── fsxn-integration-stack.yaml             # FSx ONTAP統合
│   └── monitoring-stack.yaml                   # 監視・運用
├── parameters/                                 # パラメータファイル
│   ├── dev-environment-parameters.json         # 開発環境設定
│   └── prod-environment-parameters.json        # 本番環境設定
└── scripts/                                   # デプロイメントスクリプト
    └── deploy-stack.sh                        # 自動デプロイスクリプト
```

## 前提条件

### 必須要件

1. **AWS CLI**: バージョン2.x以上がインストール・設定済み
2. **IAM権限**: 以下のサービスに対する適切な権限
   - CloudFormation (フルアクセス)
   - EC2 (フルアクセス)
   - VPC (フルアクセス)
   - IAM (ロール・ポリシー作成権限)
   - S3 (バケット作成・オブジェクト操作権限)
   - FSx (ファイルシステム管理権限)
   - CloudWatch (ログ・メトリクス権限)
   - Systems Manager (パラメータストア・セッション管理権限)

3. **既存リソース**:
   - EC2キーペア（Windows インスタンス用）
   - FSx for NetApp ONTAPファイルシステム（既存）

### 推奨要件

- **AWS Organizations**: マルチアカウント管理
- **AWS Config**: コンプライアンス監視
- **GuardDuty**: 脅威検出（本番環境）

## クイックスタート

### 1. パラメータファイルの設定

開発環境用のパラメータファイルを編集：

```bash
# パラメータファイルをコピー
cp parameters/dev-environment-parameters.json parameters/my-dev-parameters.json

# 必要な値を設定
vi parameters/my-dev-parameters.json
```

**必須変更項目**:
- `AdminPassword`: 強力なパスワードに変更
- `SafeModePassword`: セーフモード用パスワードに変更
- `FSxFileSystemId`: 既存のFSxファイルシステムIDに変更
- `KeyPairName`: 既存のEC2キーペア名に変更

### 2. 自動デプロイ実行

```bash
# スクリプトに実行権限付与
chmod +x scripts/deploy-stack.sh

# 開発環境デプロイ
./scripts/deploy-stack.sh dev ap-northeast-1 your-aws-profile

# 本番環境デプロイ
./scripts/deploy-stack.sh prod ap-northeast-1 your-aws-profile
```

### 3. 手動デプロイ（詳細制御が必要な場合）

```bash
# テンプレート検証
aws cloudformation validate-template \
  --template-body file://windows-ad-fsxn-environment.yaml

# スタック作成
aws cloudformation create-stack \
  --stack-name windows-ad-fsxn-dev \
  --template-body file://windows-ad-fsxn-environment.yaml \
  --parameters file://parameters/dev-environment-parameters.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region ap-northeast-1

# デプロイ進行状況確認
aws cloudformation describe-stack-events \
  --stack-name windows-ad-fsxn-dev \
  --region ap-northeast-1
```

## パラメータ設定ガイド

### 基本設定

| パラメータ | 説明 | 例 |
|-----------|------|-----|
| `ProjectName` | プロジェクト識別子 | `windows-ad-fsxn` |
| `Environment` | 環境名 | `dev`, `staging`, `prod` |
| `DomainName` | ADドメイン名 | `corp.local` |
| `NetBiosName` | NetBIOS名 | `CORP` |

### セキュリティ設定

| パラメータ | 説明 | 推奨値 |
|-----------|------|--------|
| `AdminPassword` | AD管理者パスワード | 複雑なパスワード（8文字以上） |
| `AllowedCidrForRDP` | RDP接続許可範囲 | VPC内部のみ推奨 |
| `EnableCloudTrail` | 監査ログ有効化 | `true`（本番環境必須） |

### ネットワーク設定

| パラメータ | 説明 | デフォルト |
|-----------|------|-----------|
| `VpcCidr` | VPC CIDR範囲 | `10.0.0.0/16` |
| `PrivateSubnetCidr` | プライベートサブネット | `10.0.1.0/24` |
| `PublicSubnetCidr` | パブリックサブネット | `10.0.2.0/24` |

## デプロイ後の設定

### 1. Windows ADサーバーへの接続

```bash
# RDP接続（Windows）
mstsc /v:<WindowsADPrivateIP>

# PowerShell リモート接続
Enter-PSSession -ComputerName <WindowsADPrivateIP> -Credential CORP\\Administrator
```

### 2. Active Directory設定

```powershell
# ドメインユーザー作成
New-ADUser -Name "TestUser" -UserPrincipalName "testuser@corp.local" -Enabled $true

# セキュリティグループ作成
New-ADGroup -Name "FSxUsers" -GroupScope Global -GroupCategory Security

# ユーザーをグループに追加
Add-ADGroupMember -Identity "FSxUsers" -Members "TestUser"
```

### 3. FSx ONTAP設定確認

```powershell
# FSx SVM ドメイン参加状況確認
Get-FSxSVM -FileSystemId <FSxFileSystemId>

# SMB共有作成
New-FSxSMBShare -Name "SharedFolder" -Path "/vol1/shared" -SecurityStyle NTFS
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. Active Directory設定失敗

**症状**: EC2インスタンスは起動するがADが設定されない

**原因と対策**:
- DNS設定の問題 → Route 53 Resolver設定確認
- パスワード複雑性要件 → パスワードポリシー確認
- ネットワーク接続 → セキュリティグループ設定確認

```powershell
# AD設定状況確認
Get-WindowsFeature -Name AD-Domain-Services
Get-ADDomain
```

#### 2. FSx ドメイン参加失敗

**症状**: FSxがドメインに参加できない

**原因と対策**:
- DNS解決失敗 → DNSフォワーダー設定確認
- 認証失敗 → ドメイン管理者権限確認
- ネットワーク接続 → セキュリティグループのポート設定確認

```bash
# FSx設定確認
aws fsx describe-storage-virtual-machines --storage-virtual-machine-ids <SVM-ID>
```

#### 3. CloudFormation デプロイ失敗

**症状**: スタック作成が失敗する

**原因と対策**:
- IAM権限不足 → 必要な権限を確認・付与
- リソース制限 → サービス制限の確認
- パラメータエラー → パラメータファイルの検証

```bash
# スタックイベント確認
aws cloudformation describe-stack-events --stack-name <stack-name>

# ロールバック理由確認
aws cloudformation describe-stack-resources --stack-name <stack-name>
```

### ログ確認方法

#### CloudWatch Logs
```bash
# Windows イベントログ確認
aws logs describe-log-groups --log-group-name-prefix "/aws/ec2/windows"

# Active Directory ログ確認
aws logs filter-log-events \
  --log-group-name "/aws/ec2/windows/ad-setup" \
  --start-time $(date -d '1 hour ago' +%s)000
```

#### Systems Manager
```bash
# セッション履歴確認
aws ssm describe-sessions --state-filter "Active,History"

# コマンド実行履歴
aws ssm list-command-invocations --max-items 10
```

## セキュリティ考慮事項

### 必須セキュリティ設定

1. **ネットワーク分離**
   - プライベートサブネット配置
   - 最小権限セキュリティグループ
   - NACLによる追加制御

2. **暗号化**
   - EBS暗号化（保存時）
   - FSx暗号化（保存時・転送時）
   - CloudTrail暗号化

3. **アクセス制御**
   - IAM最小権限の原則
   - MFA強制（推奨）
   - 定期的なアクセスレビュー

4. **監視・監査**
   - CloudTrail有効化
   - GuardDuty有効化（本番環境）
   - Config Rules設定

### セキュリティチェックリスト

- [ ] 強力なパスワードポリシー設定
- [ ] 不要なポートの閉鎖
- [ ] 定期的なセキュリティパッチ適用
- [ ] バックアップ設定
- [ ] 災害復旧計画策定

## 運用・保守

### 定期メンテナンス

#### 月次作業
- セキュリティパッチ適用
- バックアップ確認
- ログローテーション
- パフォーマンス監視

#### 四半期作業
- セキュリティ監査
- 災害復旧テスト
- 容量計画見直し
- コスト最適化

### 監視項目

#### システム監視
- CPU・メモリ使用率
- ディスク容量
- ネットワーク帯域
- Active Directory レプリケーション

#### セキュリティ監視
- 不正ログイン試行
- 権限昇格イベント
- 異常なファイルアクセス
- ネットワーク異常通信

## サポート・お問い合わせ

### ドキュメント
- [AWS FSx for NetApp ONTAP ユーザーガイド](https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/)
- [Windows Server Active Directory 管理ガイド](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/)
- [CloudFormation ユーザーガイド](https://docs.aws.amazon.com/cloudformation/)

### コミュニティ
- [AWS re:Post](https://repost.aws/)
- [NetApp Community](https://community.netapp.com/)
- [Microsoft Tech Community](https://techcommunity.microsoft.com/)

## ライセンス

このテンプレートはMITライセンスの下で提供されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 貢献

プルリクエストやイシューの報告を歓迎します。貢献ガイドラインについては[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

## プロジェクト完了状況

✅ **完了済み機能**

### コア機能
- [x] Windows Server 2022 + Active Directory自動セットアップ
- [x] FSx for NetApp ONTAP ドメイン参加自動化
- [x] ネストされたスタック構造による保守性向上
- [x] 環境別パラメータ管理（dev/staging/prod）
- [x] Secrets Manager統合による機密情報管理

### セキュリティ機能
- [x] EBS・FSx暗号化（KMS）
- [x] CloudTrail監査ログ
- [x] GuardDuty脅威検出
- [x] AWS Config設定監視
- [x] VPC Flow Logs
- [x] IAM最小権限設定

### 監視・運用機能
- [x] CloudWatch監視ダッシュボード
- [x] Systems Managerパッチ管理
- [x] 自動バックアップ設定
- [x] SNSアラート通知
- [x] ヘルスチェック自動化

### 開発・運用ツール
- [x] 自動デプロイスクリプト
- [x] テンプレート検証スクリプト
- [x] 統合テストスクリプト
- [x] パフォーマンステストスクリプト
- [x] 環境設定スクリプト

### ドキュメント
- [x] デプロイメントガイド
- [x] 設定管理ガイド
- [x] トラブルシューティングガイド
- [x] 運用ガイド
- [x] 包括的なREADME

### 品質保証
- [x] CloudFormation構文検証
- [x] CFN Lint静的解析
- [x] CFN Nagセキュリティチェック
- [x] 統合テスト自動化
- [x] パフォーマンステスト自動化

## バージョン情報

- **現在のバージョン**: 1.0.0
- **最終更新日**: $(date +%Y-%m-%d)
- **対応リージョン**: ap-northeast-1, ap-northeast-3, us-east-1, us-west-2, eu-west-1
- **テスト済み環境**: AWS CLI 2.x, CloudFormation, Windows Server 2022

---

**注意**: このテンプレートは本番環境での使用を想定していますが、デプロイ前に十分なテストを実施してください。特にセキュリティ設定については、組織のポリシーに従って適切に設定してください。