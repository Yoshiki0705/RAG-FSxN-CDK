#!/usr/bin/env node
"use strict";
/**
 * NetworkingStack専用エントリーポイント
 *
 * Cognito VPC Endpoint統合のテスト用
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const networking_stack_1 = require("../lib/stacks/integrated/networking-stack");
const app = new cdk.App();
// 環境変数の取得
const account = process.env.CDK_DEFAULT_ACCOUNT || '533267025162';
const region = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';
const projectName = 'permission-aware-rag';
const environment = 'prod';
console.log(`🚀 NetworkingStackデプロイ設定:`);
console.log(`   プロジェクト名: ${projectName}`);
console.log(`   環境: ${environment}`);
console.log(`   リージョン: ${region}`);
console.log(`   アカウント: ${account}`);
// Cognito Private Endpoint設定
const cognitoPrivateEndpoint = app.node.tryGetContext('cognitoPrivateEndpoint') === true;
console.log(`   Cognito Private Endpoint: ${cognitoPrivateEndpoint ? '有効' : '無効'}`);
// NetworkingStack設定
const networkingConfig = {
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    enablePublicSubnets: true,
    enablePrivateSubnets: true,
    enableIsolatedSubnets: false,
    enableNatGateway: true,
    enableFlowLogs: true,
    securityGroups: {
        web: true,
        api: true,
        database: true,
        lambda: true,
    },
    vpcEndpoints: {
        s3: true,
        dynamodb: true,
    },
};
// NetworkingStackのデプロイ
const networkingStack = new networking_stack_1.NetworkingStack(app, 'NetworkingStack', {
    config: networkingConfig,
    projectName,
    environment: environment,
    env: {
        account,
        region,
    },
});
// タグ設定
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
app.synth();
