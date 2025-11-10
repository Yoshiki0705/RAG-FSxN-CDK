"use strict";
/**
 * Cognito VPC Endpointコンストラクト
 *
 * AWS PrivateLinkを使用してCognito User Poolsへの閉域網接続を提供
 * CDKコンテキスト変数 `cognitoPrivateEndpoint` で有効化
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
exports.CognitoVpcEndpoint = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const constructs_1 = require("constructs");
/**
 * Cognito VPC Endpointコンストラクト
 *
 * AWS PrivateLinkを使用してCognito User Poolsへの閉域網接続を提供します。
 *
 * 使用例:
 * ```typescript
 * const cognitoEndpoint = new CognitoVpcEndpoint(this, 'CognitoEndpoint', {
 *   vpc,
 *   subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
 *   securityGroups: [cognitoEndpointSg],
 *   enabled: true,
 *   projectName: 'permission-aware-rag',
 *   environment: 'prod',
 * });
 * ```
 */
class CognitoVpcEndpoint extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // CDKコンテキスト変数からenabled設定を取得（propsが優先）
        const contextEnabled = scope.node.tryGetContext('cognitoPrivateEndpoint') === true;
        this.isEnabled = props.enabled ?? contextEnabled;
        if (!this.isEnabled) {
            console.log('ℹ️  Cognito VPC Endpoint: 無効（Public Endpoint使用）');
            return;
        }
        console.log('✅ Cognito VPC Endpoint: 有効（Private Endpoint使用）');
        // リージョンを取得
        const region = cdk.Stack.of(this).region;
        // Cognito User Pools用のVPC Endpointサービス名
        const serviceName = `com.amazonaws.${region}.cognito-idp`;
        // デフォルトのサブネット選択（プライベートサブネット）
        const subnetSelection = props.subnets ?? {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        };
        // VPC Endpoint作成
        this.vpcEndpoint = new ec2.InterfaceVpcEndpoint(this, 'CognitoVpcEndpoint', {
            vpc: props.vpc,
            service: new ec2.InterfaceVpcEndpointService(serviceName),
            subnets: subnetSelection,
            securityGroups: props.securityGroups,
            privateDnsEnabled: props.enablePrivateDns ?? true,
        });
        // タグ設定
        cdk.Tags.of(this.vpcEndpoint).add('Name', `${props.projectName}-${props.environment}-cognito-endpoint`);
        cdk.Tags.of(this.vpcEndpoint).add('Service', 'Cognito');
        cdk.Tags.of(this.vpcEndpoint).add('ConnectionType', 'PrivateLink');
        cdk.Tags.of(this.vpcEndpoint).add('Project', props.projectName);
        cdk.Tags.of(this.vpcEndpoint).add('Environment', props.environment);
        // 出力値
        new cdk.CfnOutput(this, 'CognitoVpcEndpointId', {
            value: this.vpcEndpoint.vpcEndpointId,
            description: 'Cognito VPC Endpoint ID',
            exportName: `${cdk.Stack.of(this).stackName}-CognitoVpcEndpointId`,
        });
        new cdk.CfnOutput(this, 'CognitoVpcEndpointDnsEntries', {
            value: cdk.Fn.join(',', this.vpcEndpoint.vpcEndpointDnsEntries),
            description: 'Cognito VPC Endpoint DNS Entries',
            exportName: `${cdk.Stack.of(this).stackName}-CognitoVpcEndpointDnsEntries`,
        });
        console.log(`📝 Cognito VPC Endpoint作成完了: ${serviceName}`);
    }
    /**
     * VPC EndpointのDNSエントリを取得
     */
    getDnsEntries() {
        return this.vpcEndpoint?.vpcEndpointDnsEntries ?? [];
    }
    /**
     * VPC Endpoint IDを取得
     */
    getEndpointId() {
        return this.vpcEndpoint?.vpcEndpointId;
    }
}
exports.CognitoVpcEndpoint = CognitoVpcEndpoint;
