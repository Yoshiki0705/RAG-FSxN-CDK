#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BatchStack } from '../lib/stacks/integrated/batch-stack';

const app = new cdk.App();

// 環境設定
const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;

// VPC ID（既存VPCを使用する場合）
const vpcId = app.node.tryGetContext('vpcId');

// Batch設定
const minvCpus = app.node.tryGetContext('minvCpus') || 0;
const maxvCpus = app.node.tryGetContext('maxvCpus') || 10;
const desiredvCpus = app.node.tryGetContext('desiredvCpus') || 0;

// コンテナイメージURI（オプション）
const containerImageUri = app.node.tryGetContext('containerImageUri');

// Batch Stack
new BatchStack(app, `${projectName}-${environment}-batch-stack`, {
  projectName,
  environment,
  vpcId,
  minvCpus,
  maxvCpus,
  desiredvCpus,
  containerImageUri,
  env: {
    account,
    region,
  },
  description: `AWS Batch Stack for ${projectName} (${environment})`,
});

app.synth();
