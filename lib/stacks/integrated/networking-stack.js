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
class NetworkingStack extends cdk.Stack {
    networkingConstruct;
    vpc;
    publicSubnets;
    privateSubnets;
    isolatedSubnets;
    securityGroups;
    constructor(scope, id, props) {
        super(scope, id, props);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmtpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUVuQyx5REFBK0Q7QUFlL0QsTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzVCLG1CQUFtQixDQUFzQjtJQUN6QyxHQUFHLENBQWtCO0lBQ3JCLGFBQWEsQ0FBd0I7SUFDckMsY0FBYyxDQUF3QjtJQUN0QyxlQUFlLENBQXdCO0lBQ3ZDLGNBQWMsQ0FBK0M7SUFFN0UsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUEyQjtRQUNuRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixJQUFJLENBQUM7WUFDSCxTQUFTO1lBQ1QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUxQixNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUM7WUFFbkQsb0JBQW9CO1lBQ3BCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLGdDQUFtQixDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtnQkFDOUUsTUFBTTtnQkFDTixXQUFXO2dCQUNYLFdBQVc7YUFDWixDQUFDLENBQUM7WUFFSCxlQUFlO1lBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsQ0FBQztZQUM1RCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLENBQUM7WUFDOUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMs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SSxDQUFDLG1CQUFtQixDQUFDLFlBQVksSUFBSSxFQUFFLENBQUM7SUFDckQsQ0FBQztDQUNGO0FBbE1ELDBDQWtNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog57Wx5ZCI44ON44OD44OI44Ov44O844Kt44Oz44Kw44K544K/44OD44KvXG4gKiBcbiAqIOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo+OBq+WfuuOBpeOBj+ODjeODg+ODiOODr+ODvOOCr+WfuuebpOe1seWQiOeuoeeQhlxuICogLSBWUEPjg7vjgrXjg5bjg43jg4Pjg4jmp4vmiJBcbiAqIC0g44Kk44Oz44K/44O844ON44OD44OI44Ky44O844OI44Km44Kn44Kk44O7TkFU44Ky44O844OI44Km44Kn44KkXG4gKiAtIOOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODl+ODu05BQ0xcbiAqIC0gVlBD44Ko44Oz44OJ44Od44Kk44Oz44OIXG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgTmV0d29ya2luZ0NvbnN0cnVjdCB9IGZyb20gJy4uLy4uL21vZHVsZXMvbmV0d29ya2luZyc7XG5pbXBvcnQgeyBOZXR3b3JraW5nQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9uZXR3b3JraW5nJztcblxuLyoqXG4gKiBOZXR3b3JraW5nU3RhY2sg44Gu44OX44Ot44OR44OG44KjXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmV0d29ya2luZ1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIC8qKiDjg43jg4Pjg4jjg6/jg7zjgq3jg7PjgrDoqK3lrpogKi9cbiAgY29uZmlnOiBOZXR3b3JraW5nQ29uZmlnO1xuICAvKiog44OX44Ot44K444Kn44Kv44OI5ZCN77yINTDmloflrZfku6XlhoXvvIkgKi9cbiAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgLyoqIOeSsOWig+WQje+8iGRldi9zdGFnaW5nL3Byb2QvdGVzdO+8iSAqL1xuICBlbnZpcm9ubWVudDogJ2RldicgfCAnc3RhZ2luZycgfCAncHJvZCcgfCAndGVzdCc7XG59XG5cbmV4cG9ydCBjbGFzcyBOZXR3b3JraW5nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgbmV0d29ya2luZ0NvbnN0cnVjdDogTmV0d29ya2luZ0NvbnN0cnVjdDtcbiAgcHVibGljIHJlYWRvbmx5IHZwYzogY2RrLmF3c19lYzIuVnBjO1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljU3VibmV0czogY2RrLmF3c19lYzIuSVN1Ym5ldFtdO1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZVN1Ym5ldHM6IGNkay5hd3NfZWMyLklTdWJuZXRbXTtcbiAgcHVibGljIHJlYWRvbmx5IGlzb2xhdGVkU3VibmV0czogY2RrLmF3c19lYzIuSVN1Ym5ldFtdO1xuICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlHcm91cHM6IHsgW2tleTogc3RyaW5nXTogY2RrLmF3c19lYzIuU2VjdXJpdHlHcm91cCB9O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBOZXR3b3JraW5nU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIOWFpeWKm+WApOOBruaknOiovFxuICAgICAgdGhpcy52YWxpZGF0ZVByb3BzKHByb3BzKTtcblxuICAgICAgY29uc3QgeyBjb25maWcsIHByb2plY3ROYW1lLCBlbnZpcm9ubWVudCB9ID0gcHJvcHM7XG5cbiAgICAgIC8vIOODjeODg+ODiOODr+ODvOOCreODs+OCsOOCs+ODs+OCueODiOODqeOCr+ODiOS9nOaIkFxuICAgICAgdGhpcy5uZXR3b3JraW5nQ29uc3RydWN0ID0gbmV3IE5ldHdvcmtpbmdDb25zdHJ1Y3QodGhpcywgJ05ldHdvcmtpbmdDb25zdHJ1Y3QnLCB7XG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgcHJvamVjdE5hbWUsXG4gICAgICAgIGVudmlyb25tZW50LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIOS4u+imgeODquOCveODvOOCueOBruWPgueFp+OCkuioreWumlxuICAgICAgdGhpcy52cGMgPSB0aGlzLm5ldHdvcmtpbmdDb25zdHJ1Y3QudnBjO1xuICAgICAgdGhpcy5wdWJsaWNTdWJuZXRzID0gdGhpcy5uZXR3b3JraW5nQ29uc3RydWN0LnB1YmxpY1N1Ym5ldHM7XG4gICAgICB0aGlzLnByaXZhdGVTdWJuZXRzID0gdGhpcy5uZXR3b3JraW5nQ29uc3RydWN0LnByaXZhdGVTdWJuZXRzO1xuICAgICAgdGhpcy5pc29sYXRlZFN1Ym5ldHMgPSB0aGlzLm5ldHdvcmtpbmdDb25zdHJ1Y3QuaXNvbGF0ZWRTdWJuZXRzO1xuICAgICAgdGhpcy5zZWN1cml0eUdyb3VwcyA9IHRoaXMubmV0d29ya2luZ0NvbnN0cnVjdC5zZWN1cml0eUdyb3VwcztcblxuICAgICAgLy8gQ2xvdWRGb3JtYXRpb27lh7rliptcbiAgICAgIHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgICAvLyDjgrnjgr/jg4Pjgq/jg6zjg5njg6vjga7jgr/jgrDoqK3lrppcbiAgICAgIHRoaXMuYXBwbHlTdGFja1RhZ3MocHJvamVjdE5hbWUsIGVudmlyb25tZW50KTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5ldHdvcmtpbmdTdGFja+WIneacn+WMluOCqOODqeODvDogJHtlcnJvck1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOODl+ODreODkeODhuOCo+OBruaknOiovFxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZVByb3BzKHByb3BzOiBOZXR3b3JraW5nU3RhY2tQcm9wcyk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29uZmlnLCBwcm9qZWN0TmFtZSwgZW52aXJvbm1lbnQgfSA9IHByb3BzO1xuXG4gICAgaWYgKCFwcm9qZWN0TmFtZSB8fCBwcm9qZWN0TmFtZS50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODl+ODreOCuOOCp+OCr+ODiOWQjeOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgIH1cblxuICAgIGlmICghZW52aXJvbm1lbnQgfHwgZW52aXJvbm1lbnQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfnkrDlooPlkI3jgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfjg43jg4Pjg4jjg6/jg7zjgq3jg7PjgrDoqK3lrprjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgICB9XG5cbiAgICAvLyDjg5fjg63jgrjjgqfjgq/jg4jlkI3jga7plbfjgZXliLbpmZDvvIhBV1Mg44Oq44K944O844K55ZCN5Yi26ZmQ44KS6ICD5oWu77yJXG4gICAgaWYgKHByb2plY3ROYW1lLmxlbmd0aCA+IDUwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODl+ODreOCuOOCp+OCr+ODiOWQjeOBrzUw5paH5a2X5Lul5YaF44Gn6Kit5a6a44GX44Gm44GP44Gg44GV44GEJyk7XG4gICAgfVxuXG4gICAgLy8g55Kw5aKD5ZCN44Gu5qSc6Ki8XG4gICAgY29uc3QgdmFsaWRFbnZpcm9ubWVudHMgPSBbJ2RldicsICdzdGFnaW5nJywgJ3Byb2QnLCAndGVzdCddO1xuICAgIGlmICghdmFsaWRFbnZpcm9ubWVudHMuaW5jbHVkZXMoZW52aXJvbm1lbnQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOeSsOWig+WQjeOBr+asoeOBruOBhOOBmuOCjOOBi+OCkuaMh+WumuOBl+OBpuOBj+OBoOOBleOBhDogJHt2YWxpZEVudmlyb25tZW50cy5qb2luKCcsICcpfWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbG91ZEZvcm1hdGlvbuWHuuWKm+OBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRzKCk6IHZvaWQge1xuICAgIC8vIFZQQ+aDheWgsVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdWcGNJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnZwYy52cGNJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVlBDIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1WcGNJZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVnBjQ2lkcicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnZwYy52cGNDaWRyQmxvY2ssXG4gICAgICBkZXNjcmlwdGlvbjogJ1ZQQyBDSURSIEJsb2NrJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1WcGNDaWRyYCxcbiAgICB9KTtcblxuICAgIC8vIOOCteODluODjeODg+ODiOaDheWgsVxuICAgIHRoaXMucHVibGljU3VibmV0cy5mb3JFYWNoKChzdWJuZXQsIGluZGV4KSA9PiB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBgUHVibGljU3VibmV0JHtpbmRleCArIDF9SWRgLCB7XG4gICAgICAgIHZhbHVlOiBzdWJuZXQuc3VibmV0SWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgUHVibGljIFN1Ym5ldCAke2luZGV4ICsgMX0gSURgLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tUHVibGljU3VibmV0JHtpbmRleCArIDF9SWRgLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnByaXZhdGVTdWJuZXRzLmZvckVhY2goKHN1Ym5ldCwgaW5kZXgpID0+IHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGBQcml2YXRlU3VibmV0JHtpbmRleCArIDF9SWRgLCB7XG4gICAgICAgIHZhbHVlOiBzdWJuZXQuc3VibmV0SWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgUHJpdmF0ZSBTdWJuZXQgJHtpbmRleCArIDF9IElEYCxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVByaXZhdGVTdWJuZXQke2luZGV4ICsgMX1JZGAsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuaXNvbGF0ZWRTdWJuZXRzLmZvckVhY2goKHN1Ym5ldCwgaW5kZXgpID0+IHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGBJc29sYXRlZFN1Ym5ldCR7aW5kZXggKyAxfUlkYCwge1xuICAgICAgICB2YWx1ZTogc3VibmV0LnN1Ym5ldElkLFxuICAgICAgICBkZXNjcmlwdGlvbjogYElzb2xhdGVkIFN1Ym5ldCAke2luZGV4ICsgMX0gSURgLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tSXNvbGF0ZWRTdWJuZXQke2luZGV4ICsgMX1JZGAsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIOOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODl+aDheWgsVxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuc2VjdXJpdHlHcm91cHMpLmZvckVhY2goKFtuYW1lLCBzZ10pID0+IHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGBTZWN1cml0eUdyb3VwJHtuYW1lfUlkYCwge1xuICAgICAgICB2YWx1ZTogc2cuc2VjdXJpdHlHcm91cElkLFxuICAgICAgICBkZXNjcmlwdGlvbjogYFNlY3VyaXR5IEdyb3VwICR7bmFtZX0gSURgLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tU2VjdXJpdHlHcm91cCR7bmFtZX1JZGAsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIOOCouODmeOCpOODqeODk+ODquODhuOCo+OCvuODvOODs+aDheWgsVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBdmFpbGFiaWxpdHlab25lcycsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnZwYy5hdmFpbGFiaWxpdHlab25lcy5qb2luKCcsJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ0F2YWlsYWJpbGl0eSBab25lcycsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tQXZhaWxhYmlsaXR5Wm9uZXNgLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+ODrOODmeODq+OBruOCv+OCsOioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBhcHBseVN0YWNrVGFncyhwcm9qZWN0TmFtZTogc3RyaW5nLCBlbnZpcm9ubWVudDogc3RyaW5nKTogdm9pZCB7XG4gICAgLy8g44K/44Kw5YCk44Gu44K144OL44K/44Kk44K677yI44K744Kt44Ol44Oq44OG44Kj5a++562W77yJXG4gICAgY29uc3Qgc2FuaXRpemVkUHJvamVjdE5hbWUgPSB0aGlzLnNhbml0aXplVGFnVmFsdWUocHJvamVjdE5hbWUpO1xuICAgIGNvbnN0IHNhbml0aXplZEVudmlyb25tZW50ID0gdGhpcy5zYW5pdGl6ZVRhZ1ZhbHVlKGVudmlyb25tZW50KTtcbiAgICBcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1Byb2plY3QnLCBzYW5pdGl6ZWRQcm9qZWN0TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIHNhbml0aXplZEVudmlyb25tZW50KTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1N0YWNrJywgJ05ldHdvcmtpbmdTdGFjaycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ29tcG9uZW50JywgJ0luZnJhc3RydWN0dXJlJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb3N0Q2VudGVyJywgYCR7c2FuaXRpemVkUHJvamVjdE5hbWV9LSR7c2FuaXRpemVkRW52aXJvbm1lbnR9LW5ldHdvcmtpbmdgKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0NyZWF0ZWRBdCcsIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgr/jgrDlgKTjga7jgrXjg4vjgr/jgqTjgrpcbiAgICovXG4gIHByaXZhdGUgc2FuaXRpemVUYWdWYWx1ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyDkuI3mraPjgarmloflrZfjgpLpmaTljrvjgZfjgIHplbfjgZXjgpLliLbpmZBcbiAgICByZXR1cm4gdmFsdWVcbiAgICAgIC5yZXBsYWNlKC9bPD5cXFwiJyZdL2csICcnKSAvLyBYU1Plr77nrZZcbiAgICAgIC5zdWJzdHJpbmcoMCwgMjU2KSAvLyBBV1Mg44K/44Kw5YCk44Gu5pyA5aSn6ZW35Yi26ZmQXG4gICAgICAudHJpbSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIOS7luOBruOCueOCv+ODg+OCr+OBp+S9v+eUqOOBmeOCi+OBn+OCgeOBruODjeODg+ODiOODr+ODvOOCr+aDheWgseOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldE5ldHdvcmtpbmdJbmZvKCk6IHtcbiAgICB2cGM6IGNkay5hd3NfZWMyLlZwYztcbiAgICBwdWJsaWNTdWJuZXRzOiBjZGsuYXdzX2VjMi5JU3VibmV0W107XG4gICAgcHJpdmF0ZVN1Ym5ldHM6IGNkay5hd3NfZWMyLklTdWJuZXRbXTtcbiAgICBpc29sYXRlZFN1Ym5ldHM6IGNkay5hd3NfZWMyLklTdWJuZXRbXTtcbiAgICBzZWN1cml0eUdyb3VwczogeyBba2V5OiBzdHJpbmddOiBjZGsuYXdzX2VjMi5TZWN1cml0eUdyb3VwIH07XG4gICAgYXZhaWxhYmlsaXR5Wm9uZXM6IHN0cmluZ1tdO1xuICB9IHtcbiAgICByZXR1cm4ge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIHB1YmxpY1N1Ym5ldHM6IHRoaXMucHVibGljU3VibmV0cyxcbiAgICAgIHByaXZhdGVTdWJuZXRzOiB0aGlzLnByaXZhdGVTdWJuZXRzLFxuICAgICAgaXNvbGF0ZWRTdWJuZXRzOiB0aGlzLmlzb2xhdGVkU3VibmV0cyxcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiB0aGlzLnNlY3VyaXR5R3JvdXBzLFxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZXM6IHRoaXMudnBjLmF2YWlsYWJpbGl0eVpvbmVzLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog54m55a6a44Gu44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OX44KS5Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgZ2V0U2VjdXJpdHlHcm91cChuYW1lOiBzdHJpbmcpOiBjZGsuYXdzX2VjMi5TZWN1cml0eUdyb3VwIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5zZWN1cml0eUdyb3Vwc1tuYW1lXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWUEPjgqjjg7Pjg4njg53jgqTjg7Pjg4jmg4XloLHjgpLlj5blvpdcbiAgICovXG4gIHB1YmxpYyBnZXRWcGNFbmRwb2ludHMoKTogeyBba2V5OiBzdHJpbmddOiBjZGsuYXdzX2VjMi5JbnRlcmZhY2VWcGNFbmRwb2ludCB8IGNkay5hd3NfZWMyLkdhdGV3YXlWcGNFbmRwb2ludCB9IHtcbiAgICByZXR1cm4gdGhpcy5uZXR3b3JraW5nQ29uc3RydWN0LnZwY0VuZHBvaW50cyB8fCB7fTtcbiAgfVxufSJdfQ==