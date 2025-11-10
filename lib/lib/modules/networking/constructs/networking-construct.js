"use strict";
/**
 * ネットワーキングコンストラクト
 * VPC、サブネット、セキュリティグループの統合管理
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkingConstruct = void 0;
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const constructs_1 = require("constructs");
const cognito_vpc_endpoint_1 = require("./cognito-vpc-endpoint");
const cognito_endpoint_security_group_1 = require("../../security/constructs/cognito-endpoint-security-group");
class NetworkingConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
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
            });
            console.log(`✅ 既存VPCを参照: ${existingVpcId}`);
        }
        else {
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
        this.cognitoEndpointSecurityGroup = new cognito_endpoint_security_group_1.CognitoEndpointSecurityGroup(this, 'CognitoEndpointSG', {
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
        this.cognitoVpcEndpoint = new cognito_vpc_endpoint_1.CognitoVpcEndpoint(this, 'CognitoVpcEndpoint', {
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
    createVpc(config, projectName, environment) {
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
    createSubnetConfiguration(config) {
        const subnets = [];
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
    createSecurityGroups(config, projectName, environment) {
        const securityGroups = {};
        if (config.securityGroups?.web) {
            securityGroups.web = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
                vpc: this.vpc,
                description: 'Web層用セキュリティグループ',
                securityGroupName: `${projectName}-${environment}-web-sg`,
            });
            // HTTP/HTTPSトラフィックを許可
            securityGroups.web.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP traffic');
            securityGroups.web.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS traffic');
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
    createVpcEndpoints(config) {
        const endpoints = {};
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
    createFlowLogs(projectName, environment) {
        new ec2.FlowLog(this, 'VpcFlowLog', {
            resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
            destination: ec2.FlowLogDestination.toCloudWatchLogs(),
            flowLogName: `${projectName}-${environment}-vpc-flowlog`,
        });
    }
}
exports.NetworkingConstruct = NetworkingConstruct;
