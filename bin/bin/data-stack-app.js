#!/usr/bin/env node
"use strict";
/**
 * DataStack デプロイ用エントリーポイント
 *
 * 機能:
 * - DataStackの単独デプロイ
 * - NetworkingStackとの連携
 * - S3・EFS・DynamoDB統合管理
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
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const data_stack_1 = require("../lib/stacks/integrated/data-stack");
const tokyo_production_config_1 = require("../lib/config/environments/tokyo-production-config");
const app = new cdk.App();
// 環境設定の取得
const projectName = 'permission-aware-rag';
const environment = 'prod';
const region = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;
// 必須環境変数の検証
if (!account) {
    console.error('❌ エラー: CDK_DEFAULT_ACCOUNT環境変数が設定されていません');
    process.exit(1);
}
console.log(`🚀 DataStack デプロイ設定:`);
console.log(`   プロジェクト名: ${projectName}`);
console.log(`   環境: ${environment}`);
console.log(`   リージョン: ${region}`);
console.log(`   アカウント: ${account}`);
// NetworkingStackからVPC情報を取得
const vpcId = 'vpc-09aa251d6db52b1fc';
const privateSubnetIds = ['subnet-0a84a16a1641e970f', 'subnet-0c4599b4863ff4d33', 'subnet-0c9ad18a58c06e7c5'];
const publicSubnetIds = ['subnet-06a00a8866d09b912', 'subnet-0d7c7e43c1325cd3b', 'subnet-06df589d2ed2a5fc0'];
const availabilityZones = ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'];
// VPCをインポート
const vpc = ec2.Vpc.fromVpcAttributes(app, 'ImportedVpc', {
    vpcId: vpcId,
    availabilityZones: availabilityZones,
    privateSubnetIds: privateSubnetIds,
    publicSubnetIds: publicSubnetIds
});
// DataStack作成
const dataStack = new data_stack_1.DataStack(app, 'TokyoRegion-permission-aware-rag-prod-Data', {
    env: {
        account,
        region
    },
    projectName,
    environment,
    config: {
        storage: tokyo_production_config_1.tokyoProductionConfig.storage,
        database: tokyo_production_config_1.tokyoProductionConfig.database
    },
    vpc,
    privateSubnetIds,
    description: `DataStack for ${projectName} (${environment}) - Storage and Database Integration`
});
// タグ適用
cdk.Tags.of(dataStack).add('Project', projectName);
cdk.Tags.of(dataStack).add('Environment', environment);
cdk.Tags.of(dataStack).add('Stack', 'Data');
cdk.Tags.of(dataStack).add('ManagedBy', 'CDK');
app.synth();
