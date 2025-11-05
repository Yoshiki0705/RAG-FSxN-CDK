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
class NetworkingConstruct extends constructs_1.Construct {
    vpc;
    publicSubnets;
    privateSubnets;
    isolatedSubnets;
    securityGroups;
    vpcEndpoints;
    constructor(scope, id, props) {
        super(scope, id);
        const { config, projectName, environment } = props;
        // VPCの作成
        this.vpc = this.createVpc(config, projectName, environment);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXR3b3JraW5nLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILHlEQUEyQztBQUMzQywyQ0FBdUM7QUFHdkMsTUFBYSxtQkFBb0IsU0FBUSxzQkFBUztJQUNoQyxHQUFHLENBQVU7SUFDYixhQUFhLENBQWdCO0lBQzdCLGNBQWMsQ0FBZ0I7SUFDOUIsZUFBZSxDQUFnQjtJQUMvQixjQUFjLENBQXVDO0lBQ3JELFlBQVksQ0FBd0U7SUFFcEcsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUErQjtRQUN2RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUVuRCxTQUFTO1FBQ1QsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFNUQsY0FBYztRQUNkLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7UUFDNUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQztRQUM5QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDO1FBRWhELGdCQUFnQjtRQUNoQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRWxGLGdCQUFnQjtRQUNoQixJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUks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LENBQUMsR0FBRyxDQUFDO1lBQ3ZELFdBQVcsRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLEVBQUU7WUFDdEQsV0FBVyxFQUFFLEdBQUcsV0FBVyxJQUFJLFdBQVcsY0FBYztTQUN6RCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF2TEQsa0RBdUxDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjg43jg4Pjg4jjg6/jg7zjgq3jg7PjgrDjgrPjg7Pjgrnjg4jjg6njgq/jg4hcbiAqIFZQQ+OAgeOCteODluODjeODg+ODiOOAgeOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODl+OBrue1seWQiOeuoeeQhlxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IE5ldHdvcmtpbmdDb25maWcsIE5ldHdvcmtpbmdDb25zdHJ1Y3RQcm9wcyB9IGZyb20gJy4uL2ludGVyZmFjZXMvbmV0d29ya2luZy1jb25maWcnO1xuXG5leHBvcnQgY2xhc3MgTmV0d29ya2luZ0NvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSB2cGM6IGVjMi5WcGM7XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRzOiBlYzIuSVN1Ym5ldFtdO1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZVN1Ym5ldHM6IGVjMi5JU3VibmV0W107XG4gIHB1YmxpYyByZWFkb25seSBpc29sYXRlZFN1Ym5ldHM6IGVjMi5JU3VibmV0W107XG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwczogeyBba2V5OiBzdHJpbmddOiBlYzIuU2VjdXJpdHlHcm91cCB9O1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjRW5kcG9pbnRzPzogeyBba2V5OiBzdHJpbmddOiBlYzIuSW50ZXJmYWNlVnBjRW5kcG9pbnQgfCBlYzIuR2F0ZXdheVZwY0VuZHBvaW50IH07XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IE5ldHdvcmtpbmdDb25zdHJ1Y3RQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB7IGNvbmZpZywgcHJvamVjdE5hbWUsIGVudmlyb25tZW50IH0gPSBwcm9wcztcblxuICAgIC8vIFZQQ+OBruS9nOaIkFxuICAgIHRoaXMudnBjID0gdGhpcy5jcmVhdGVWcGMoY29uZmlnLCBwcm9qZWN0TmFtZSwgZW52aXJvbm1lbnQpO1xuXG4gICAgLy8g44K144OW44ON44OD44OI44Gu5Y+C54Wn44KS6Kit5a6aXG4gICAgdGhpcy5wdWJsaWNTdWJuZXRzID0gdGhpcy52cGMucHVibGljU3VibmV0cztcbiAgICB0aGlzLnByaXZhdGVTdWJuZXRzID0gdGhpcy52cGMucHJpdmF0ZVN1Ym5ldHM7XG4gICAgdGhpcy5pc29sYXRlZFN1Ym5ldHMgPSB0aGlzLnZwYy5pc29sYXRlZFN1Ym5ldHM7XG5cbiAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgrDjg6vjg7zjg5fjga7kvZzmiJBcbiAgICB0aGlzLnNlY3VyaXR5R3JvdXBzID0gdGhpcy5jcmVhdGVTZWN1cml0eUdyb3Vwcyhjb25maWcsIHByb2plY3ROYW1lLCBlbnZpcm9ubWVudCk7XG5cbiAgICAvLyBWUEPjgqjjg7Pjg4njg53jgqTjg7Pjg4jjga7kvZzmiJBcbiAgICBpZiAoY29uZmlnLnZwY0VuZHBvaW50cykge1xuICAgICAgdGhpcy52cGNFbmRwb2ludHMgPSB0aGlzLmNyZWF0ZVZwY0VuZHBvaW50cyhjb25maWcpO1xuICAgIH1cblxuICAgIC8vIOODleODreODvOODreOCsOOBruioreWumlxuICAgIGlmIChjb25maWcuZW5hYmxlRmxvd0xvZ3MpIHtcbiAgICAgIHRoaXMuY3JlYXRlRmxvd0xvZ3MocHJvamVjdE5hbWUsIGVudmlyb25tZW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVlBD44Gu5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVZwYyhjb25maWc6IE5ldHdvcmtpbmdDb25maWcsIHByb2plY3ROYW1lOiBzdHJpbmcsIGVudmlyb25tZW50OiBzdHJpbmcpOiBlYzIuVnBjIHtcbiAgICBjb25zdCB2cGNOYW1lID0gYCR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LXZwY2A7XG5cbiAgICByZXR1cm4gbmV3IGVjMi5WcGModGhpcywgJ1ZwYycsIHtcbiAgICAgIHZwY05hbWUsXG4gICAgICBpcEFkZHJlc3NlczogZWMyLklwQWRkcmVzc2VzLmNpZHIoY29uZmlnLnZwY0NpZHIpLFxuICAgICAgbWF4QXpzOiBjb25maWcubWF4QXpzLFxuICAgICAgZW5hYmxlRG5zSG9zdG5hbWVzOiBjb25maWcuZW5hYmxlRG5zSG9zdG5hbWVzID8/IHRydWUsXG4gICAgICBlbmFibGVEbnNTdXBwb3J0OiBjb25maWcuZW5hYmxlRG5zU3VwcG9ydCA/PyB0cnVlLFxuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogdGhpcy5jcmVhdGVTdWJuZXRDb25maWd1cmF0aW9uKGNvbmZpZyksXG4gICAgICBuYXRHYXRld2F5czogY29uZmlnLmVuYWJsZU5hdEdhdGV3YXkgPyBjb25maWcubWF4QXpzIDogMCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrXjg5bjg43jg4Pjg4joqK3lrprjga7kvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlU3VibmV0Q29uZmlndXJhdGlvbihjb25maWc6IE5ldHdvcmtpbmdDb25maWcpOiBlYzIuU3VibmV0Q29uZmlndXJhdGlvbltdIHtcbiAgICBjb25zdCBzdWJuZXRzOiBlYzIuU3VibmV0Q29uZmlndXJhdGlvbltdID0gW107XG5cbiAgICBpZiAoY29uZmlnLmVuYWJsZVB1YmxpY1N1Ym5ldHMpIHtcbiAgICAgIHN1Ym5ldHMucHVzaCh7XG4gICAgICAgIG5hbWU6ICdQdWJsaWMnLFxuICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuZW5hYmxlUHJpdmF0ZVN1Ym5ldHMpIHtcbiAgICAgIHN1Ym5ldHMucHVzaCh7XG4gICAgICAgIG5hbWU6ICdQcml2YXRlJyxcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyxcbiAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5lbmFibGVJc29sYXRlZFN1Ym5ldHMpIHtcbiAgICAgIHN1Ym5ldHMucHVzaCh7XG4gICAgICAgIG5hbWU6ICdJc29sYXRlZCcsXG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQsXG4gICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBzdWJuZXRzO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODl+OBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVTZWN1cml0eUdyb3VwcyhcbiAgICBjb25maWc6IE5ldHdvcmtpbmdDb25maWcsXG4gICAgcHJvamVjdE5hbWU6IHN0cmluZyxcbiAgICBlbnZpcm9ubWVudDogc3RyaW5nXG4gICk6IHsgW2tleTogc3RyaW5nXTogZWMyLlNlY3VyaXR5R3JvdXAgfSB7XG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cHM6IHsgW2tleTogc3RyaW5nXTogZWMyLlNlY3VyaXR5R3JvdXAgfSA9IHt9O1xuXG4gICAgaWYgKGNvbmZpZy5zZWN1cml0eUdyb3Vwcz8ud2ViKSB7XG4gICAgICBzZWN1cml0eUdyb3Vwcy53ZWIgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ1dlYlNlY3VyaXR5R3JvdXAnLCB7XG4gICAgICAgIHZwYzogdGhpcy52cGMsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2Vi5bGk55So44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OXJyxcbiAgICAgICAgc2VjdXJpdHlHcm91cE5hbWU6IGAke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS13ZWItc2dgLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEhUVFAvSFRUUFPjg4jjg6njg5XjgqPjg4Pjgq/jgpLoqLHlj69cbiAgICAgIHNlY3VyaXR5R3JvdXBzLndlYi5hZGRJbmdyZXNzUnVsZShcbiAgICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgICBlYzIuUG9ydC50Y3AoODApLFxuICAgICAgICAnSFRUUCB0cmFmZmljJ1xuICAgICAgKTtcbiAgICAgIHNlY3VyaXR5R3JvdXBzLndlYi5hZGRJbmdyZXNzUnVsZShcbiAgICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgICBlYzIuUG9ydC50Y3AoNDQzKSxcbiAgICAgICAgJ0hUVFBTIHRyYWZmaWMnXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuc2VjdXJpdHlHcm91cHM/LmFwaSkge1xuICAgICAgc2VjdXJpdHlHcm91cHMuYXBpID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdBcGlTZWN1cml0eUdyb3VwJywge1xuICAgICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FQSeWxpOeUqOOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODlycsXG4gICAgICAgIHNlY3VyaXR5R3JvdXBOYW1lOiBgJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tYXBpLXNnYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuc2VjdXJpdHlHcm91cHM/LmRhdGFiYXNlKSB7XG4gICAgICBzZWN1cml0eUdyb3Vwcy5kYXRhYmFzZSA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnRGF0YWJhc2VTZWN1cml0eUdyb3VwJywge1xuICAgICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ+ODh+ODvOOCv+ODmeODvOOCueWxpOeUqOOCu+OCreODpeODquODhuOCo+OCsOODq+ODvOODlycsXG4gICAgICAgIHNlY3VyaXR5R3JvdXBOYW1lOiBgJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tZGItc2dgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5zZWN1cml0eUdyb3Vwcz8ubGFtYmRhKSB7XG4gICAgICBzZWN1cml0eUdyb3Vwcy5sYW1iZGEgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0xhbWJkYVNlY3VyaXR5R3JvdXAnLCB7XG4gICAgICAgIHZwYzogdGhpcy52cGMsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTGFtYmRh6Zai5pWw55So44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OXJyxcbiAgICAgICAgc2VjdXJpdHlHcm91cE5hbWU6IGAke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS1sYW1iZGEtc2dgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlY3VyaXR5R3JvdXBzO1xuICB9XG5cbiAgLyoqXG4gICAqIFZQQ+OCqOODs+ODieODneOCpOODs+ODiOOBruS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVWcGNFbmRwb2ludHMoY29uZmlnOiBOZXR3b3JraW5nQ29uZmlnKTogeyBba2V5OiBzdHJpbmddOiBlYzIuSW50ZXJmYWNlVnBjRW5kcG9pbnQgfCBlYzIuR2F0ZXdheVZwY0VuZHBvaW50IH0ge1xuICAgIGNvbnN0IGVuZHBvaW50czogeyBba2V5OiBzdHJpbmddOiBlYzIuSW50ZXJmYWNlVnBjRW5kcG9pbnQgfCBlYzIuR2F0ZXdheVZwY0VuZHBvaW50IH0gPSB7fTtcblxuICAgIGlmIChjb25maWcudnBjRW5kcG9pbnRzPy5zMykge1xuICAgICAgZW5kcG9pbnRzLnMzID0gbmV3IGVjMi5HYXRld2F5VnBjRW5kcG9pbnQodGhpcywgJ1MzRW5kcG9pbnQnLCB7XG4gICAgICAgIHZwYzogdGhpcy52cGMsXG4gICAgICAgIHNlcnZpY2U6IGVjMi5HYXRld2F5VnBjRW5kcG9pbnRBd3NTZXJ2aWNlLlMzLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy52cGNFbmRwb2ludHM/LmR5bmFtb2RiKSB7XG4gICAgICBlbmRwb2ludHMuZHluYW1vZGIgPSBuZXcgZWMyLkdhdGV3YXlWcGNFbmRwb2ludCh0aGlzLCAnRHluYW1vRGJFbmRwb2ludCcsIHtcbiAgICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgICAgc2VydmljZTogZWMyLkdhdGV3YXlWcGNFbmRwb2ludEF3c1NlcnZpY2UuRFlOQU1PREIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnZwY0VuZHBvaW50cz8ubGFtYmRhKSB7XG4gICAgICBlbmRwb2ludHMubGFtYmRhID0gbmV3IGVjMi5JbnRlcmZhY2VWcGNFbmRwb2ludCh0aGlzLCAnTGFtYmRhRW5kcG9pbnQnLCB7XG4gICAgICAgIHZwYzogdGhpcy52cGMsXG4gICAgICAgIHNlcnZpY2U6IGVjMi5JbnRlcmZhY2VWcGNFbmRwb2ludEF3c1NlcnZpY2UuTEFNQkRBLFxuICAgICAgICBwcml2YXRlRG5zRW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBlbmRwb2ludHM7XG4gIH1cblxuICAvKipcbiAgICogVlBD44OV44Ot44O844Ot44Kw44Gu5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUZsb3dMb2dzKHByb2plY3ROYW1lOiBzdHJpbmcsIGVudmlyb25tZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBuZXcgZWMyLkZsb3dMb2codGhpcywgJ1ZwY0Zsb3dMb2cnLCB7XG4gICAgICByZXNvdXJjZVR5cGU6IGVjMi5GbG93TG9nUmVzb3VyY2VUeXBlLmZyb21WcGModGhpcy52cGMpLFxuICAgICAgZGVzdGluYXRpb246IGVjMi5GbG93TG9nRGVzdGluYXRpb24udG9DbG91ZFdhdGNoTG9ncygpLFxuICAgICAgZmxvd0xvZ05hbWU6IGAke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS12cGMtZmxvd2xvZ2AsXG4gICAgfSk7XG4gIH1cbn0iXX0=