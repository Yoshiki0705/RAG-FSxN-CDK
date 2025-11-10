"use strict";
/**
 * Cognito VPC Endpoint用セキュリティグループコンストラクト
 *
 * VPC内からのHTTPS通信を許可し、Cognito User Poolsへの閉域網接続を実現
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
exports.CognitoEndpointSecurityGroup = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const constructs_1 = require("constructs");
/**
 * Cognito VPC Endpoint用セキュリティグループコンストラクト
 *
 * VPC内からのHTTPS（ポート443）通信を許可し、
 * Cognito User Poolsへの閉域網接続を実現します。
 *
 * 使用例:
 * ```typescript
 * const cognitoSg = new CognitoEndpointSecurityGroup(this, 'CognitoSG', {
 *   vpc,
 *   enabled: true,
 *   projectName: 'permission-aware-rag',
 *   environment: 'prod',
 * });
 * ```
 */
class CognitoEndpointSecurityGroup extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // CDKコンテキスト変数からenabled設定を取得（propsが優先）
        const contextEnabled = scope.node.tryGetContext('cognitoPrivateEndpoint') === true;
        this.isEnabled = props.enabled ?? contextEnabled;
        if (!this.isEnabled) {
            console.log('ℹ️  Cognito Endpoint Security Group: 無効');
            return;
        }
        console.log('✅ Cognito Endpoint Security Group: 有効');
        // セキュリティグループ作成
        this.securityGroup = new ec2.SecurityGroup(this, 'CognitoEndpointSecurityGroup', {
            vpc: props.vpc,
            description: props.description ?? 'Security group for Cognito VPC Endpoint',
            allowAllOutbound: true, // Cognitoへのアウトバウンド通信を許可
        });
        // インバウンドルール: VPC内からのHTTPS通信を許可
        const allowedCidrs = props.allowedCidrs ?? [props.vpc.vpcCidrBlock];
        allowedCidrs.forEach((cidr, index) => {
            this.securityGroup.addIngressRule(ec2.Peer.ipv4(cidr), ec2.Port.tcp(443), `Allow HTTPS from ${cidr}`);
            console.log(`📝 インバウンドルール追加: ${cidr} → 443/tcp`);
        });
        // タグ設定
        cdk.Tags.of(this.securityGroup).add('Name', `${props.projectName}-${props.environment}-cognito-endpoint-sg`);
        cdk.Tags.of(this.securityGroup).add('Service', 'Cognito');
        cdk.Tags.of(this.securityGroup).add('Purpose', 'VPC-Endpoint');
        cdk.Tags.of(this.securityGroup).add('Project', props.projectName);
        cdk.Tags.of(this.securityGroup).add('Environment', props.environment);
        // 出力値
        new cdk.CfnOutput(this, 'CognitoEndpointSecurityGroupId', {
            value: this.securityGroup.securityGroupId,
            description: 'Cognito VPC Endpoint Security Group ID',
            exportName: `${cdk.Stack.of(this).stackName}-CognitoEndpointSecurityGroupId`,
        });
        console.log(`📝 Cognito Endpoint Security Group作成完了: ${this.securityGroup.securityGroupId}`);
    }
    /**
     * セキュリティグループIDを取得
     */
    getSecurityGroupId() {
        return this.securityGroup?.securityGroupId;
    }
    /**
     * Lambda関数などからの接続を許可
     *
     * @param peer 接続元（セキュリティグループまたはCIDR）
     * @param description ルールの説明
     */
    allowConnectionFrom(peer, description) {
        if (!this.securityGroup) {
            console.warn('⚠️  セキュリティグループが無効のため、接続許可を追加できません');
            return;
        }
        this.securityGroup.addIngressRule(peer, ec2.Port.tcp(443), description ?? 'Allow HTTPS connection');
        console.log(`📝 接続許可追加: ${description ?? 'Custom peer'}`);
    }
}
exports.CognitoEndpointSecurityGroup = CognitoEndpointSecurityGroup;
