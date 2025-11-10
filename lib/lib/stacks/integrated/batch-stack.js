"use strict";
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
exports.BatchStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const batch_compute_1 = require("../../modules/embedding/batch-compute");
/**
 * AWS Batch Stack
 *
 * SQLite Embedding処理用のBatch環境を構築
 *
 * 主な機能:
 * - AWS Batch Compute Environment
 * - Job Queue
 * - Job Definition
 * - IAM Roles
 */
class BatchStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // 既存VPCの取得
        const vpc = props.vpcId
            ? ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId })
            : ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: false });
        // セキュリティグループの作成
        const securityGroup = new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
            vpc,
            securityGroupName: `${props.projectName}-${props.environment}-batch-sg`,
            description: 'Security group for AWS Batch compute environment',
            allowAllOutbound: true,
        });
        // Batch環境の作成
        this.batchEnvironment = new batch_compute_1.BatchComputeEnvironment(this, 'BatchEnvironment', {
            projectName: props.projectName,
            environment: props.environment,
            vpc,
            securityGroup,
            minvCpus: props.minvCpus,
            maxvCpus: props.maxvCpus,
            desiredvCpus: props.desiredvCpus,
            containerImageUri: props.containerImageUri,
        });
        // Stack Outputs
        new cdk.CfnOutput(this, 'StackName', {
            value: this.stackName,
            description: 'Batch Stack Name',
        });
        new cdk.CfnOutput(this, 'VpcId', {
            value: vpc.vpcId,
            description: 'VPC ID',
        });
        new cdk.CfnOutput(this, 'SecurityGroupId', {
            value: securityGroup.securityGroupId,
            description: 'Security Group ID',
        });
    }
}
exports.BatchStack = BatchStack;
