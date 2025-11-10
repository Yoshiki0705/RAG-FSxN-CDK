#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { BatchComputeEnvironment } from '../lib/modules/embedding/batch-compute';

/**
 * AWS Batch Embedding アプリケーション
 * 
 * SQLite Embedding処理用のBatch環境を構築
 */

const app = new cdk.App();

// コンテキストから設定を取得
const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
const environment = app.node.tryGetContext('environment') || 'prod';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
const vpcId = app.node.tryGetContext('vpcId') || 'vpc-09aa251d6db52b1fc';

// スタック作成
const stack = new cdk.Stack(app, `${projectName}-${environment}-BatchEmbedding`, {
  env: {
    region,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  description: 'AWS Batch environment for SQLite Embedding processing',
});

// VPC取得
const vpc = ec2.Vpc.fromLookup(stack, 'Vpc', { vpcId });

// サブネットIDを明示的に指定（プライベートサブネット）
const subnetIds = [
  'subnet-0c9ad18a58c06e7c5', // ap-northeast-1d
  'subnet-0a84a16a1641e970f', // ap-northeast-1a
];

// セキュリティグループ作成
const securityGroup = new ec2.SecurityGroup(stack, 'BatchSecurityGroup', {
  vpc,
  securityGroupName: `${projectName}-${environment}-batch-sg`,
  description: 'Security group for AWS Batch compute environment',
  allowAllOutbound: true,
});

// VPC内通信許可
securityGroup.addIngressRule(
  ec2.Peer.ipv4('10.21.0.0/16'),
  ec2.Port.allTraffic(),
  'VPC internal communication'
);

// Batch環境作成
const batchEnvironment = new BatchComputeEnvironment(stack, 'BatchEnvironment', {
  projectName,
  environment,
  vpc,
  securityGroup,
  subnetIds,
  minvCpus: 0,
  maxvCpus: 10,
  desiredvCpus: 0,
  instanceTypes: [
    ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
    ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE),
  ],
});

// タグ適用
cdk.Tags.of(stack).add('Project', projectName);
cdk.Tags.of(stack).add('Environment', environment);
cdk.Tags.of(stack).add('Component', 'BatchEmbedding');
cdk.Tags.of(stack).add('ManagedBy', 'CDK');

app.synth();
