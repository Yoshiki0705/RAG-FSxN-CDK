"use strict";
/**
 * 統合ネットワーキングスタック
 *
 * モジュラーアーキテクチャに基づくネットワーク基盤統合管理
 * - VPC・サブネット構成
 * - インターネットゲートウェイ・NATゲートウェイ
 * - セキュリティグループ・NACL
 * - VPCエンドポイント
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
exports.NetworkingStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const networking_1 = require("../../modules/networking");
// タグ設定
const tagging_config_1 = require("../../config/tagging-config");
class NetworkingStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // コスト配布タグの適用
        const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(props.projectName, props.environment);
        tagging_config_1.TaggingStrategy.applyTagsToStack(this, taggingConfig);
        try {
            // 入力値の検証
            this.validateProps(props);
            const { config, projectName, environment } = props;
            // ネットワーキングコンストラクト作成
            this.networkingConstruct = new networking_1.NetworkingConstruct(this, 'NetworkingConstruct', {
                config,
                projectName,
                environment,
            });
            // 主要リソースの参照を設定
            this.vpc = this.networkingConstruct.vpc;
            this.publicSubnets = this.networkingConstruct.publicSubnets;
            this.privateSubnets = this.networkingConstruct.privateSubnets;
            this.isolatedSubnets = this.networkingConstruct.isolatedSubnets;
            this.securityGroups = this.networkingConstruct.securityGroups;
            // CloudFormation出力
            this.createOutputs();
            // スタックレベルのタグ設定
            this.applyStackTags(projectName, environment);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`NetworkingStack初期化エラー: ${errorMessage}`);
        }
    }
    /**
     * プロパティの検証
     */
    validateProps(props) {
        const { config, projectName, environment } = props;
        if (!projectName || projectName.trim().length === 0) {
            throw new Error('プロジェクト名が設定されていません');
        }
        if (!environment || environment.trim().length === 0) {
            throw new Error('環境名が設定されていません');
        }
        if (!config) {
            throw new Error('ネットワーキング設定が設定されていません');
        }
        // プロジェクト名の長さ制限（AWS リソース名制限を考慮）
        if (projectName.length > 50) {
            throw new Error('プロジェクト名は50文字以内で設定してください');
        }
        // 環境名の検証
        const validEnvironments = ['dev', 'staging', 'prod', 'test'];
        if (!validEnvironments.includes(environment)) {
            throw new Error(`環境名は次のいずれかを指定してください: ${validEnvironments.join(', ')}`);
        }
    }
    /**
     * CloudFormation出力の作成
     */
    createOutputs() {
        // VPC情報
        new cdk.CfnOutput(this, 'VpcId', {
            value: this.vpc.vpcId,
            description: 'VPC ID',
            exportName: `${this.stackName}-VpcId`,
        });
        new cdk.CfnOutput(this, 'VpcCidr', {
            value: this.vpc.vpcCidrBlock,
            description: 'VPC CIDR Block',
            exportName: `${this.stackName}-VpcCidr`,
        });
        // サブネット情報
        this.publicSubnets.forEach((subnet, index) => {
            new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
                value: subnet.subnetId,
                description: `Public Subnet ${index + 1} ID`,
                exportName: `${this.stackName}-PublicSubnet${index + 1}Id`,
            });
        });
        this.privateSubnets.forEach((subnet, index) => {
            new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
                value: subnet.subnetId,
                description: `Private Subnet ${index + 1} ID`,
                exportName: `${this.stackName}-PrivateSubnet${index + 1}Id`,
            });
        });
        this.isolatedSubnets.forEach((subnet, index) => {
            new cdk.CfnOutput(this, `IsolatedSubnet${index + 1}Id`, {
                value: subnet.subnetId,
                description: `Isolated Subnet ${index + 1} ID`,
                exportName: `${this.stackName}-IsolatedSubnet${index + 1}Id`,
            });
        });
        // セキュリティグループ情報
        Object.entries(this.securityGroups).forEach(([name, sg]) => {
            new cdk.CfnOutput(this, `SecurityGroup${name}Id`, {
                value: sg.securityGroupId,
                description: `Security Group ${name} ID`,
                exportName: `${this.stackName}-SecurityGroup${name}Id`,
            });
        });
        // アベイラビリティゾーン情報
        new cdk.CfnOutput(this, 'AvailabilityZones', {
            value: this.vpc.availabilityZones.join(','),
            description: 'Availability Zones',
            exportName: `${this.stackName}-AvailabilityZones`,
        });
    }
    /**
     * スタックレベルのタグ設定
     */
    applyStackTags(projectName, environment) {
        // タグ値のサニタイズ（セキュリティ対策）
        const sanitizedProjectName = this.sanitizeTagValue(projectName);
        const sanitizedEnvironment = this.sanitizeTagValue(environment);
        cdk.Tags.of(this).add('Project', sanitizedProjectName);
        cdk.Tags.of(this).add('Environment', sanitizedEnvironment);
        cdk.Tags.of(this).add('Stack', 'NetworkingStack');
        cdk.Tags.of(this).add('Component', 'Infrastructure');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('CostCenter', `${sanitizedProjectName}-${sanitizedEnvironment}-networking`);
        cdk.Tags.of(this).add('CreatedAt', new Date().toISOString().split('T')[0]);
    }
    /**
     * タグ値のサニタイズ
     */
    sanitizeTagValue(value) {
        // 不正な文字を除去し、長さを制限
        return value
            .replace(/[<>\"'&]/g, '') // XSS対策
            .substring(0, 256) // AWS タグ値の最大長制限
            .trim();
    }
    /**
     * 他のスタックで使用するためのネットワーク情報を取得
     */
    getNetworkingInfo() {
        return {
            vpc: this.vpc,
            publicSubnets: this.publicSubnets,
            privateSubnets: this.privateSubnets,
            isolatedSubnets: this.isolatedSubnets,
            securityGroups: this.securityGroups,
            availabilityZones: this.vpc.availabilityZones,
        };
    }
    /**
     * 特定のセキュリティグループを取得
     */
    getSecurityGroup(name) {
        return this.securityGroups[name];
    }
    /**
     * VPCエンドポイント情報を取得
     */
    getVpcEndpoints() {
        return this.networkingConstruct.vpcEndpoints || {};
    }
}
exports.NetworkingStack = NetworkingStack;
