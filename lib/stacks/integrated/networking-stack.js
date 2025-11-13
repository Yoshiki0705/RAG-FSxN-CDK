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
    networkingConstruct;
    vpc;
    publicSubnets;
    privateSubnets;
    isolatedSubnets;
    securityGroups;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmtpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUVuQyx5REFBK0Q7QUFHL0QsT0FBTztBQUNQLGdFQUFzRjtBQWN0RixNQUFhLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUIsbUJBQW1CLENBQXNCO0lBQ3pDLEdBQUcsQ0FBa0I7SUFDckIsYUFBYSxDQUF3QjtJQUNyQyxjQUFjLENBQXdCO0lBQ3RDLGVBQWUsQ0FBd0I7SUFDdkMsY0FBYyxDQUErQztJQUU3RSxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGFBQWE7UUFDYixNQUFNLGFBQWEsR0FBRyx1Q0FBc0IsQ0FBQyxpQkFBaUIsQ0FDNUQsS0FBSyxDQUFDLFdBQVcsRUFDakIsS0FBSyxDQUFDLFdBQVcsQ0FDbEIsQ0FBQztRQUNGLGdDQUFlLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRXRELElBQUksQ0FBQztZQUNILFNBQVM7WUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFCLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztZQUVuRCxvQkFBb0I7WUFDcEIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksZ0NBQW1CLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO2dCQUM5RSxNQUFNO2dCQUNOLFdBQVc7Z0JBQ1gsV0FBVzthQUNaLENBQUMsQ0FBQztZQUVILGVBQWU7WUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxtQkFBbUIs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LEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUI7U0FDOUMsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNJLGdCQUFnQixDQUFDLElBQVk7UUFDbEMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7T0FFRztJQUNJLGVBQWU7UUFDcEIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQztJQUNyRCxDQUFDO0NBQ0Y7QUF6TUQsMENBeU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDntbHlkIjjg43jg4Pjg4jjg6/jg7zjgq3jg7PjgrDjgrnjgr/jg4Pjgq9cbiAqIFxuICog44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj44Gr5Z+644Gl44GP44ON44OD44OI44Ov44O844Kv5Z+655uk57Wx5ZCI566h55CGXG4gKiAtIFZQQ+ODu+OCteODluODjeODg+ODiOani+aIkFxuICogLSDjgqTjg7Pjgr/jg7zjg43jg4Pjg4jjgrLjg7zjg4jjgqbjgqfjgqTjg7tOQVTjgrLjg7zjg4jjgqbjgqfjgqRcbiAqIC0g44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OX44O7TkFDTFxuICogLSBWUEPjgqjjg7Pjg4njg53jgqTjg7Pjg4hcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBOZXR3b3JraW5nQ29uc3RydWN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9uZXR3b3JraW5nJztcbmltcG9ydCB7IE5ldHdvcmtpbmdDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL25ldHdvcmtpbmcnO1xuXG4vLyDjgr/jgrDoqK3lrppcbmltcG9ydCB7IFRhZ2dpbmdTdHJhdGVneSwgUGVybWlzc2lvbkF3YXJlUkFHVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdnaW5nLWNvbmZpZyc7XG5cbi8qKlxuICogTmV0d29ya2luZ1N0YWNrIOOBruODl+ODreODkeODhuOCo1xuICovXG5leHBvcnQgaW50ZXJmYWNlIE5ldHdvcmtpbmdTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICAvKiog44ON44OD44OI44Ov44O844Kt44Oz44Kw6Kit5a6aICovXG4gIGNvbmZpZzogTmV0d29ya2luZ0NvbmZpZztcbiAgLyoqIOODl+ODreOCuOOCp+OCr+ODiOWQje+8iDUw5paH5a2X5Lul5YaF77yJICovXG4gIHByb2plY3ROYW1lOiBzdHJpbmc7XG4gIC8qKiDnkrDlooPlkI3vvIhkZXYvc3RhZ2luZy9wcm9kL3Rlc3TvvIkgKi9cbiAgZW52aXJvbm1lbnQ6ICdkZXYnIHwgJ3N0YWdpbmcnIHwgJ3Byb2QnIHwgJ3Rlc3QnO1xufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya2luZ1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IG5ldHdvcmtpbmdDb25zdHJ1Y3Q6IE5ldHdvcmtpbmdDb25zdHJ1Y3Q7XG4gIHB1YmxpYyByZWFkb25seSB2cGM6IGNkay5hd3NfZWMyLlZwYztcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldHM6IGNkay5hd3NfZWMyLklTdWJuZXRbXTtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRzOiBjZGsuYXdzX2VjMi5JU3VibmV0W107XG4gIHB1YmxpYyByZWFkb25seSBpc29sYXRlZFN1Ym5ldHM6IGNkay5hd3NfZWMyLklTdWJuZXRbXTtcbiAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5R3JvdXBzOiB7IFtrZXk6IHN0cmluZ106IGNkay5hd3NfZWMyLlNlY3VyaXR5R3JvdXAgfTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTmV0d29ya2luZ1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIOOCs+OCueODiOmFjeW4g+OCv+OCsOOBrumBqeeUqFxuICAgIGNvbnN0IHRhZ2dpbmdDb25maWcgPSBQZXJtaXNzaW9uQXdhcmVSQUdUYWdzLmdldFN0YW5kYXJkQ29uZmlnKFxuICAgICAgcHJvcHMucHJvamVjdE5hbWUsXG4gICAgICBwcm9wcy5lbnZpcm9ubWVudFxuICAgICk7XG4gICAgVGFnZ2luZ1N0cmF0ZWd5LmFwcGx5VGFnc1RvU3RhY2sodGhpcywgdGFnZ2luZ0NvbmZpZyk7XG5cbiAgICB0cnkge1xuICAgICAgLy8g5YWl5Yqb5YCk44Gu5qSc6Ki8XG4gICAgICB0aGlzLnZhbGlkYXRlUHJvcHMocHJvcHMpO1xuXG4gICAgICBjb25zdCB7IGNvbmZpZywgcHJvamVjdE5hbWUsIGVudmlyb25tZW50IH0gPSBwcm9wcztcblxuICAgICAgLy8g44ON44OD44OI44Ov44O844Kt44Oz44Kw44Kz44Oz44K544OI44Op44Kv44OI5L2c5oiQXG4gICAgICB0aGlzLm5ldHdvcmtpbmdDb25zdHJ1Y3QgPSBuZXcgTmV0d29ya2luZ0NvbnN0cnVjdCh0aGlzLCAnTmV0d29ya2luZ0NvbnN0cnVjdCcsIHtcbiAgICAgICAgY29uZmlnLFxuICAgICAgICBwcm9qZWN0TmFtZSxcbiAgICAgICAgZW52aXJvbm1lbnQsXG4gICAgICB9KTtcblxuICAgICAgLy8g5Li76KaB44Oq44K944O844K544Gu5Y+C54Wn44KS6Kit5a6aXG4gICAgICB0aGlzLnZwYyA9IHRoaXMubmV0d29ya2luZ0NvbnN0cnVjdC52cGM7XG4gICAgICB0aGlzLnB1YmxpY1N1Ym5ldHMgPSB0aGlzLm5ldHdvcmtpbmdDb25zdHJ1Y3QucHVibGljU3VibmV0cztcbiAgICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMgPSB0aGlzLm5ldHdvcmtpbmdDb25zdHJ1Y3QucHJpdmF0ZVN1Ym5ldHM7XG4gICAgICB0aGlzLmlzb2xhdGVkU3VibmV0cyA9IHRoaXMubmV0d29ya2luZ0NvbnN0cnVjdC5pc29sYXRlZFN1Ym5ldHM7XG4gICAgICB0aGlzLnNlY3VyaXR5R3JvdXBzID0gdGhpcy5uZXR3b3JraW5nQ29uc3RydWN0LnNlY3VyaXR5R3JvdXBzO1xuXG4gICAgICAvLyBDbG91ZEZvcm1hdGlvbuWHuuWKm1xuICAgICAgdGhpcy5jcmVhdGVPdXRwdXRzKCk7XG5cbiAgICAgIC8vIOOCueOCv+ODg+OCr+ODrOODmeODq+OBruOCv+OCsOioreWumlxuICAgICAgdGhpcy5hcHBseVN0YWNrVGFncyhwcm9qZWN0TmFtZSwgZW52aXJvbm1lbnQpO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTmV0d29ya2luZ1N0YWNr5Yid5pyf5YyW44Ko44Op44O8OiAke2Vycm9yTWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44OX44Ot44OR44OG44Kj44Gu5qSc6Ki8XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlUHJvcHMocHJvcHM6IE5ldHdvcmtpbmdTdGFja1Byb3BzKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb25maWcsIHByb2plY3ROYW1lLCBlbnZpcm9ubWVudCB9ID0gcHJvcHM7XG5cbiAgICBpZiAoIXByb2plY3ROYW1lIHx8IHByb2plY3ROYW1lLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign44OX44Ot44K444Kn44Kv44OI5ZCN44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gICAgfVxuXG4gICAgaWYgKCFlbnZpcm9ubWVudCB8fCBlbnZpcm9ubWVudC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+eSsOWig+WQjeOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgIH1cblxuICAgIGlmICghY29uZmlnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODjeODg+ODiOODr+ODvOOCreODs+OCsOioreWumuOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgIH1cblxuICAgIC8vIOODl+ODreOCuOOCp+OCr+ODiOWQjeOBrumVt+OBleWItumZkO+8iEFXUyDjg6rjgr3jg7zjgrnlkI3liLbpmZDjgpLogIPmha7vvIlcbiAgICBpZiAocHJvamVjdE5hbWUubGVuZ3RoID4gNTApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign44OX44Ot44K444Kn44Kv44OI5ZCN44GvNTDmloflrZfku6XlhoXjgafoqK3lrprjgZfjgabjgY/jgaDjgZXjgYQnKTtcbiAgICB9XG5cbiAgICAvLyDnkrDlooPlkI3jga7mpJzoqLxcbiAgICBjb25zdCB2YWxpZEVudmlyb25tZW50cyA9IFsnZGV2JywgJ3N0YWdpbmcnLCAncHJvZCcsICd0ZXN0J107XG4gICAgaWYgKCF2YWxpZEVudmlyb25tZW50cy5pbmNsdWRlcyhlbnZpcm9ubWVudCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg55Kw5aKD5ZCN44Gv5qyh44Gu44GE44Ga44KM44GL44KS5oyH5a6a44GX44Gm44GP44Gg44GV44GEOiAke3ZhbGlkRW52aXJvbm1lbnRzLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3VkRm9ybWF0aW9u5Ye65Yqb44Gu5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgLy8gVlBD5oOF5aCxXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1ZwY0lkJywge1xuICAgICAgdmFsdWU6IHRoaXMudnBjLnZwY0lkLFxuICAgICAgZGVzY3JpcHRpb246ICdWUEMgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVZwY0lkYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdWcGNDaWRyJywge1xuICAgICAgdmFsdWU6IHRoaXMudnBjLnZwY0NpZHJCbG9jayxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVlBDIENJRFIgQmxvY2snLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVZwY0NpZHJgLFxuICAgIH0pO1xuXG4gICAgLy8g44K144OW44ON44OD44OI5oOF5aCxXG4gICAgdGhpcy5wdWJsaWNTdWJuZXRzLmZvckVhY2goKHN1Ym5ldCwgaW5kZXgpID0+IHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGBQdWJsaWNTdWJuZXQke2luZGV4ICsgMX1JZGAsIHtcbiAgICAgICAgdmFsdWU6IHN1Ym5ldC5zdWJuZXRJZCxcbiAgICAgICAgZGVzY3JpcHRpb246IGBQdWJsaWMgU3VibmV0ICR7aW5kZXggKyAxfSBJRGAsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1QdWJsaWNTdWJuZXQke2luZGV4ICsgMX1JZGAsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYFByaXZhdGVTdWJuZXQke2luZGV4ICsgMX1JZGAsIHtcbiAgICAgICAgdmFsdWU6IHN1Ym5ldC5zdWJuZXRJZCxcbiAgICAgICAgZGVzY3JpcHRpb246IGBQcml2YXRlIFN1Ym5ldCAke2luZGV4ICsgMX0gSURgLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tUHJpdmF0ZVN1Ym5ldCR7aW5kZXggKyAxfUlkYCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5pc29sYXRlZFN1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYElzb2xhdGVkU3VibmV0JHtpbmRleCArIDF9SWRgLCB7XG4gICAgICAgIHZhbHVlOiBzdWJuZXQuc3VibmV0SWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgSXNvbGF0ZWQgU3VibmV0ICR7aW5kZXggKyAxfSBJRGAsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1Jc29sYXRlZFN1Ym5ldCR7aW5kZXggKyAxfUlkYCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OX5oOF5aCxXG4gICAgT2JqZWN0LmVudHJpZXModGhpcy5zZWN1cml0eUdyb3VwcykuZm9yRWFjaCgoW25hbWUsIHNnXSkgPT4ge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYFNlY3VyaXR5R3JvdXAke25hbWV9SWRgLCB7XG4gICAgICAgIHZhbHVlOiBzZy5zZWN1cml0eUdyb3VwSWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgU2VjdXJpdHkgR3JvdXAgJHtuYW1lfSBJRGAsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1TZWN1cml0eUdyb3VwJHtuYW1lfUlkYCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8g44Ki44OZ44Kk44Op44OT44Oq44OG44Kj44K+44O844Oz5oOF5aCxXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0F2YWlsYWJpbGl0eVpvbmVzJywge1xuICAgICAgdmFsdWU6IHRoaXMudnBjLmF2YWlsYWJpbGl0eVpvbmVzLmpvaW4oJywnKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQXZhaWxhYmlsaXR5IFpvbmVzJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1BdmFpbGFiaWxpdHlab25lc2AsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv44Os44OZ44Or44Gu44K/44Kw6Kit5a6aXG4gICAqL1xuICBwcml2YXRlIGFwcGx5U3RhY2tUYWdzKHByb2plY3ROYW1lOiBzdHJpbmcsIGVudmlyb25tZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvLyDjgr/jgrDlgKTjga7jgrXjg4vjgr/jgqTjgrrvvIjjgrvjgq3jg6Xjg6rjg4bjgqPlr77nrZbvvIlcbiAgICBjb25zdCBzYW5pdGl6ZWRQcm9qZWN0TmFtZSA9IHRoaXMuc2FuaXRpemVUYWdWYWx1ZShwcm9qZWN0TmFtZSk7XG4gICAgY29uc3Qgc2FuaXRpemVkRW52aXJvbm1lbnQgPSB0aGlzLnNhbml0aXplVGFnVmFsdWUoZW52aXJvbm1lbnQpO1xuICAgIFxuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnUHJvamVjdCcsIHNhbml0aXplZFByb2plY3ROYW1lKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0Vudmlyb25tZW50Jywgc2FuaXRpemVkRW52aXJvbm1lbnQpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RhY2snLCAnTmV0d29ya2luZ1N0YWNrJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb21wb25lbnQnLCAnSW5mcmFzdHJ1Y3R1cmUnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0Nvc3RDZW50ZXInLCBgJHtzYW5pdGl6ZWRQcm9qZWN0TmFtZX0tJHtzYW5pdGl6ZWRFbnZpcm9ubWVudH0tbmV0d29ya2luZ2ApO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ3JlYXRlZEF0JywgbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCv+OCsOWApOOBruOCteODi+OCv+OCpOOCulxuICAgKi9cbiAgcHJpdmF0ZSBzYW5pdGl6ZVRhZ1ZhbHVlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIOS4jeato+OBquaWh+Wtl+OCkumZpOWOu+OBl+OAgemVt+OBleOCkuWItumZkFxuICAgIHJldHVybiB2YWx1ZVxuICAgICAgLnJlcGxhY2UoL1s8PlxcXCInJl0vZywgJycpIC8vIFhTU+WvvuetllxuICAgICAgLnN1YnN0cmluZygwLCAyNTYpIC8vIEFXUyDjgr/jgrDlgKTjga7mnIDlpKfplbfliLbpmZBcbiAgICAgIC50cmltKCk7XG4gIH1cblxuICAvKipcbiAgICog5LuW44Gu44K544K/44OD44Kv44Gn5L2/55So44GZ44KL44Gf44KB44Gu44ON44OD44OI44Ov44O844Kv5oOF5aCx44KS5Y+W5b6XXG4gICAqL1xuICBwdWJsaWMgZ2V0TmV0d29ya2luZ0luZm8oKToge1xuICAgIHZwYzogY2RrLmF3c19lYzIuVnBjO1xuICAgIHB1YmxpY1N1Ym5ldHM6IGNkay5hd3NfZWMyLklTdWJuZXRbXTtcbiAgICBwcml2YXRlU3VibmV0czogY2RrLmF3c19lYzIuSVN1Ym5ldFtdO1xuICAgIGlzb2xhdGVkU3VibmV0czogY2RrLmF3c19lYzIuSVN1Ym5ldFtdO1xuICAgIHNlY3VyaXR5R3JvdXBzOiB7IFtrZXk6IHN0cmluZ106IGNkay5hd3NfZWMyLlNlY3VyaXR5R3JvdXAgfTtcbiAgICBhdmFpbGFiaWxpdHlab25lczogc3RyaW5nW107XG4gIH0ge1xuICAgIHJldHVybiB7XG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgcHVibGljU3VibmV0czogdGhpcy5wdWJsaWNTdWJuZXRzLFxuICAgICAgcHJpdmF0ZVN1Ym5ldHM6IHRoaXMucHJpdmF0ZVN1Ym5ldHMsXG4gICAgICBpc29sYXRlZFN1Ym5ldHM6IHRoaXMuaXNvbGF0ZWRTdWJuZXRzLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IHRoaXMuc2VjdXJpdHlHcm91cHMsXG4gICAgICBhdmFpbGFiaWxpdHlab25lczogdGhpcy52cGMuYXZhaWxhYmlsaXR5Wm9uZXMsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDnibnlrprjga7jgrvjgq3jg6Xjg6rjg4bjgqPjgrDjg6vjg7zjg5fjgpLlj5blvpdcbiAgICovXG4gIHB1YmxpYyBnZXRTZWN1cml0eUdyb3VwKG5hbWU6IHN0cmluZyk6IGNkay5hd3NfZWMyLlNlY3VyaXR5R3JvdXAgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnNlY3VyaXR5R3JvdXBzW25hbWVdO1xuICB9XG5cbiAgLyoqXG4gICAqIFZQQ+OCqOODs+ODieODneOCpOODs+ODiOaDheWgseOCkuWPluW+l1xuICAgKi9cbiAgcHVibGljIGdldFZwY0VuZHBvaW50cygpOiB7IFtrZXk6IHN0cmluZ106IGNkay5hd3NfZWMyLkludGVyZmFjZVZwY0VuZHBvaW50IHwgY2RrLmF3c19lYzIuR2F0ZXdheVZwY0VuZHBvaW50IH0ge1xuICAgIHJldHVybiB0aGlzLm5ldHdvcmtpbmdDb25zdHJ1Y3QudnBjRW5kcG9pbnRzIHx8IHt9O1xuICB9XG59Il19