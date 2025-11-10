/**
 * ネットワーキング設定インターフェース
 */

/**
 * Cognito VPC Endpoint設定
 * 
 * CDKコンテキスト変数 `cognitoPrivateEndpoint` で有効/無効を制御可能
 * 
 * 優先順位:
 * 1. NetworkingConfig.vpcEndpoints.cognito.enabled（設定ファイル）
 * 2. CDKコンテキスト変数 `cognitoPrivateEndpoint`
 * 3. デフォルト: false（Public接続モード）
 * 
 * 使用例:
 * ```typescript
 * const config: NetworkingConfig = {
 *   // ... 他の設定 ...
 *   vpcEndpoints: {
 *     cognito: {
 *       enabled: true,
 *       enablePrivateDns: true,
 *       subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
 *     },
 *   },
 * };
 * ```
 */
export interface CognitoVpcEndpointConfig {
  /**
   * Cognito VPC Endpointを作成するかどうか
   * 
   * - true: Private接続モード（VPC Endpoint経由）
   * - false: Public接続モード（インターネット経由）
   * 
   * @default false
   */
  enabled?: boolean;
  
  /**
   * プライベートDNSを有効化するかどうか
   * 
   * 有効化すると、VPC内から `cognito-idp.{region}.amazonaws.com` で
   * VPC Endpoint経由でアクセス可能
   * 
   * @default true
   */
  enablePrivateDns?: boolean;
  
  /**
   * VPC Endpointを配置するサブネット選択
   * 
   * プライベートサブネットを推奨
   * 
   * @default { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
   */
  subnets?: {
    subnetType?: 'PRIVATE_WITH_EGRESS' | 'PRIVATE_ISOLATED' | 'PUBLIC';
  };
  
  /**
   * セキュリティグループの説明
   * 
   * @default 'Security group for Cognito VPC Endpoint'
   */
  securityGroupDescription?: string;
  
  /**
   * インバウンドトラフィックを許可するCIDRブロック
   * 
   * 指定しない場合、VPC CIDRが使用される
   * 
   * @default [VPC CIDR]
   */
  allowedCidrs?: string[];
}

export interface NetworkingConfig {
  /** 既存VPC ID（指定した場合は既存VPCを使用） */
  existingVpcId?: string;
  
  /** VPC CIDR ブロック（新規VPC作成時のみ） */
  vpcCidr: string;
  
  /** アベイラビリティゾーン数（新規VPC作成時のみ） */
  maxAzs: number;
  
  /** パブリックサブネットの有効化 */
  enablePublicSubnets: boolean;
  
  /** プライベートサブネットの有効化 */
  enablePrivateSubnets: boolean;
  
  /** 分離サブネットの有効化 */
  enableIsolatedSubnets: boolean;
  
  /** NATゲートウェイの有効化 */
  enableNatGateway: boolean;
  
  /** VPCエンドポイントの設定 */
  vpcEndpoints?: {
    s3?: boolean;
    dynamodb?: boolean;
    lambda?: boolean;
    opensearch?: boolean;
    cognito?: CognitoVpcEndpointConfig;
  };
  
  /** セキュリティグループの設定 */
  securityGroups?: {
    web?: boolean;
    api?: boolean;
    database?: boolean;
    lambda?: boolean;
  };
  
  /** DNS設定 */
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  
  /** フローログの有効化 */
  enableFlowLogs?: boolean;
}

export interface NetworkingConstructProps {
  config: NetworkingConfig;
  projectName: string;
  environment: string;
}