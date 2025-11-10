/**
 * ネットワーキングコンストラクト
 * VPC、サブネット、セキュリティグループの統合管理
 */

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { NetworkingConfig, NetworkingConstructProps } from '../interfaces/networking-config';
import { CognitoVpcEndpoint } from './cognito-vpc-endpoint';
import { CognitoEndpointSecurityGroup } from '../../security/constructs/cognito-endpoint-security-group';

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly isolatedSubnets: ec2.ISubnet[];
  public readonly securityGroups: { [key: string]: ec2.SecurityGroup };
  public readonly vpcEndpoints?: { [key: string]: ec2.InterfaceVpcEndpoint | ec2.GatewayVpcEndpoint };
  public readonly cognitoVpcEndpoint?: CognitoVpcEndpoint;
  public readonly cognitoEndpointSecurityGroup?: CognitoEndpointSecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { config, projectName, environment } = props;

    // VPCの作成または既存VPCの参照（冪等性担保）
    // 優先順位:
    // 1. config.existingVpcId（設定ファイル）
    // 2. CDKコンテキスト変数 `existingVpcId`
    // 3. デフォルト: 新規VPC作成
    const existingVpcId = config.existingVpcId ?? 
      scope.node.tryGetContext('existingVpcId');
    
    if (existingVpcId) {
      // 既存VPCを参照（冪等性）
      this.vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: existingVpcId,
      }) as ec2.Vpc;
      
      console.log(`✅ 既存VPCを参照: ${existingVpcId}`);
    } else {
      // 新規VPCを作成
      this.vpc = this.createVpc(config, projectName, environment);
      console.log(`✅ 新規VPCを作成: ${this.vpc.vpcId}`);
    }

    // サブネットの参照を設定
    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;
    this.isolatedSubnets = this.vpc.isolatedSubnets;

    // セキュリティグループの作成
    this.securityGroups = this.createSecurityGroups(config, projectName, environment);

    // VPCエンドポイントの作成
    if (config.vpcEndpoints) {
      this.vpcEndpoints = this.createVpcEndpoints(config);
    }

    // Cognito VPC Endpoint統合（オプション機能）
    // 設定の優先順位:
    // 1. config.vpcEndpoints?.cognito?.enabled（設定ファイル）
    // 2. CDKコンテキスト変数 `cognitoPrivateEndpoint`
    // 3. デフォルト: false（Public接続モード）
    const cognitoConfig = config.vpcEndpoints?.cognito;
    const cognitoEnabled = cognitoConfig?.enabled ?? 
      scope.node.tryGetContext('cognitoPrivateEndpoint') === true;
    
    // セキュリティグループ作成（Cognito VPC Endpoint有効時のみ）
    this.cognitoEndpointSecurityGroup = new CognitoEndpointSecurityGroup(this, 'CognitoEndpointSG', {
      vpc: this.vpc,
      enabled: cognitoEnabled,
      description: cognitoConfig?.securityGroupDescription,
      allowedCidrs: cognitoConfig?.allowedCidrs,
      projectName,
      environment,
    });

    // VPC Endpoint作成（Cognito VPC Endpoint有効時のみ）
    const subnetType = cognitoConfig?.subnets?.subnetType === 'PRIVATE_ISOLATED' 
      ? ec2.SubnetType.PRIVATE_ISOLATED
      : cognitoConfig?.subnets?.subnetType === 'PUBLIC'
      ? ec2.SubnetType.PUBLIC
      : ec2.SubnetType.PRIVATE_WITH_EGRESS;
    
    this.cognitoVpcEndpoint = new CognitoVpcEndpoint(this, 'CognitoVpcEndpoint', {
      vpc: this.vpc,
      enabled: cognitoEnabled,
      subnets: { subnetType },
      enablePrivateDns: cognitoConfig?.enablePrivateDns,
      securityGroups: this.cognitoEndpointSecurityGroup.securityGroup 
        ? [this.cognitoEndpointSecurityGroup.securityGroup] 
        : undefined,
      projectName,
      environment,
    });

    // フローログの設定
    if (config.enableFlowLogs) {
      this.createFlowLogs(projectName, environment);
    }
  }

  /**
   * VPCの作成
   */
  private createVpc(config: NetworkingConfig, projectName: string, environment: string): ec2.Vpc {
    const vpcName = `${projectName}-${environment}-vpc`;

    return new ec2.Vpc(this, 'Vpc', {
      vpcName,
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: config.maxAzs,
      enableDnsHostnames: config.enableDnsHostnames ?? true,
      enableDnsSupport: config.enableDnsSupport ?? true,
      subnetConfiguration: this.createSubnetConfiguration(config),
      natGateways: config.enableNatGateway ? config.maxAzs : 0,
    });
  }

  /**
   * サブネット設定の作成
   */
  private createSubnetConfiguration(config: NetworkingConfig): ec2.SubnetConfiguration[] {
    const subnets: ec2.SubnetConfiguration[] = [];

    if (config.enablePublicSubnets) {
      subnets.push({
        name: 'Public',
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,
      });
    }

    if (config.enablePrivateSubnets) {
      subnets.push({
        name: 'Private',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      });
    }

    if (config.enableIsolatedSubnets) {
      subnets.push({
        name: 'Isolated',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: 24,
      });
    }

    return subnets;
  }

  /**
   * セキュリティグループの作成
   */
  private createSecurityGroups(
    config: NetworkingConfig,
    projectName: string,
    environment: string
  ): { [key: string]: ec2.SecurityGroup } {
    const securityGroups: { [key: string]: ec2.SecurityGroup } = {};

    if (config.securityGroups?.web) {
      securityGroups.web = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
        vpc: this.vpc,
        description: 'Web層用セキュリティグループ',
        securityGroupName: `${projectName}-${environment}-web-sg`,
      });

      // HTTP/HTTPSトラフィックを許可
      securityGroups.web.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        'HTTP traffic'
      );
      securityGroups.web.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        'HTTPS traffic'
      );
    }

    if (config.securityGroups?.api) {
      securityGroups.api = new ec2.SecurityGroup(this, 'ApiSecurityGroup', {
        vpc: this.vpc,
        description: 'API層用セキュリティグループ',
        securityGroupName: `${projectName}-${environment}-api-sg`,
      });
    }

    if (config.securityGroups?.database) {
      securityGroups.database = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
        vpc: this.vpc,
        description: 'データベース層用セキュリティグループ',
        securityGroupName: `${projectName}-${environment}-db-sg`,
      });
    }

    if (config.securityGroups?.lambda) {
      securityGroups.lambda = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
        vpc: this.vpc,
        description: 'Lambda関数用セキュリティグループ',
        securityGroupName: `${projectName}-${environment}-lambda-sg`,
      });
    }

    return securityGroups;
  }

  /**
   * VPCエンドポイントの作成
   */
  private createVpcEndpoints(config: NetworkingConfig): { [key: string]: ec2.InterfaceVpcEndpoint | ec2.GatewayVpcEndpoint } {
    const endpoints: { [key: string]: ec2.InterfaceVpcEndpoint | ec2.GatewayVpcEndpoint } = {};

    if (config.vpcEndpoints?.s3) {
      endpoints.s3 = new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
        vpc: this.vpc,
        service: ec2.GatewayVpcEndpointAwsService.S3,
      });
    }

    if (config.vpcEndpoints?.dynamodb) {
      endpoints.dynamodb = new ec2.GatewayVpcEndpoint(this, 'DynamoDbEndpoint', {
        vpc: this.vpc,
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      });
    }

    if (config.vpcEndpoints?.lambda) {
      endpoints.lambda = new ec2.InterfaceVpcEndpoint(this, 'LambdaEndpoint', {
        vpc: this.vpc,
        service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
        privateDnsEnabled: true,
      });
    }

    return endpoints;
  }

  /**
   * VPCフローログの作成
   */
  private createFlowLogs(projectName: string, environment: string): void {
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      flowLogName: `${projectName}-${environment}-vpc-flowlog`,
    });
  }
}