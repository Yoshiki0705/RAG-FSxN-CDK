#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const data_stack_1 = require("../lib/stacks/integrated/data-stack");
/**
 * DataStack専用CDKアプリケーション
 *
 * NetworkingStack統合完了後のDataStackデプロイ用エントリーポイント
 *
 * 前提条件:
 * - NetworkingStack: デプロイ済み（UPDATE_COMPLETE）
 * - SecurityStack: デプロイ済み（CREATE_COMPLETE）
 */
const app = new cdk.App();
// 環境設定
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT || '178625946981',
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};
// プロジェクト設定
const projectName = 'permission-aware-rag';
const environment = 'prod';
const regionPrefix = 'TokyoRegion';
// NetworkingStackからのVPC情報（CloudFormation出力値から取得）
const vpcConfig = {
    vpcId: 'vpc-09aa251d6db52b1fc',
    availabilityZones: ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
    publicSubnetIds: ['subnet-06a00a8866d09b912', 'subnet-0d7c7e43c1325cd3b', 'subnet-06df589d2ed2a5fc0'],
    privateSubnetIds: ['subnet-0a84a16a1641e970f', 'subnet-0c4599b4863ff4d33', 'subnet-0c9ad18a58c06e7c5'],
    vpcCidrBlock: '10.21.0.0/16',
};
// SecurityStackからのKMS情報
const kmsKeyArn = 'arn:aws:kms:ap-northeast-1:178625946981:key/b212097e-8282-4f86-a133-7998463a7528';
// DataStack作成
const dataStack = new data_stack_1.DataStack(app, `${regionPrefix}-${projectName}-${environment}-Data`, {
    env,
    description: 'Data and Storage Stack - S3, DynamoDB (FSx ONTAP temporarily disabled)',
    // VPC設定（NetworkingStackから）
    vpc: vpcConfig,
    // KMS設定（SecurityStackから）
    kmsKeyArn,
    // プロジェクト設定
    projectName,
    environment,
    // タグ設定
    tags: {
        Project: projectName,
        Environment: environment,
        ManagedBy: 'CDK',
        Stack: 'DataStack',
        Region: env.region,
        DeployedBy: 'DataStackApp',
        NamingCompliance: 'AgentSteering',
    },
});
// グローバルタグ適用
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Architecture', 'Modular');
cdk.Tags.of(app).add('Region', env.region);
cdk.Tags.of(app).add('CreatedBy', 'DataStackApp');
cdk.Tags.of(app).add('NamingCompliance', 'AgentSteering');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zdGFjay1hcHAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYXRhLXN0YWNrLWFwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsb0VBQWdFO0FBRWhFOzs7Ozs7OztHQVFHO0FBRUgsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsT0FBTztBQUNQLE1BQU0sR0FBRyxHQUFHO0lBQ1YsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksY0FBYztJQUMxRCxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxnQkFBZ0I7Q0FDM0QsQ0FBQztBQUVGLFdBQVc7QUFDWCxNQUFNLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQztBQUMzQyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUM7QUFDM0IsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDO0FBRW5DLGlEQUFpRDtBQUNqRCxNQUFNLFNBQVMsR0FBRztJQUNoQixLQUFLLEVBQUUsdUJBQXVCO0lBQzlCLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUM7SUFDNUUsZUFBZSxFQUFFLENBQUMsMEJBQTBCLEVBQUUsMEJBQTBCLEVBQUUsMEJBQTBCLENBQUM7SUFDckcsZ0JBQWdCLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSwwQkFBMEIsRUFBRSwwQkFBMEIsQ0FBQztJQUN0RyxZQUFZLEVBQUUsY0FBYztDQUM3QixDQUFDO0FBRUYsd0JBQXdCO0FBQ3hCLE1BQU0sU0FBUyxHQUFHLGtGQUFrRixDQUFDO0FBRXJHLGNBQWM7QUFDZCxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsWUFBWSxJQUFJLFdBQVcsSUFBSSxXQUFXLE9BQU8sRUFBRTtJQUN6RixHQUFHO0lBQ0gsV0FBVyxFQUFFLHdFQUF3RTtJQUVyRiwyQkFBMkI7SUFDM0IsR0FBRyxFQUFFLFNBQVM7SUFFZCx5QkFBeUI7SUFDekIsU0FBUztJQUVULFdBQVc7SUFDWCxXQUFXO0lBQ1gsV0FBVztJQUVYLE9BQU87SUFDUCxJQUFJLEVBQUU7UUFDSixPQUFPLEVBQUUsV0FBVztRQUNwQixXQUFXLEVBQUUsV0FBVztRQUN4QixTQUFTLEVBQUUsS0FBSztRQUNoQixLQUFLLEVBQUUsV0FBVztRQUNsQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07UUFDbEIsVUFBVSxFQUFFLGNBQWM7UUFDMUIsZ0JBQWdCLEVBQUUsZUFBZTtLQUNsQztDQUNGLENBQUMsQ0FBQztBQUVILFlBQVk7QUFDWixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQzdDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDakQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN6QyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ2hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDbEQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBRTFELEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBEYXRhU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL2ludGVncmF0ZWQvZGF0YS1zdGFjayc7XG5cbi8qKlxuICogRGF0YVN0YWNr5bCC55SoQ0RL44Ki44OX44Oq44Kx44O844K344On44OzXG4gKiBcbiAqIE5ldHdvcmtpbmdTdGFja+e1seWQiOWujOS6huW+jOOBrkRhdGFTdGFja+ODh+ODl+ODreOCpOeUqOOCqOODs+ODiOODquODvOODneOCpOODs+ODiFxuICogXG4gKiDliY3mj5DmnaHku7Y6XG4gKiAtIE5ldHdvcmtpbmdTdGFjazog44OH44OX44Ot44Kk5riI44G/77yIVVBEQVRFX0NPTVBMRVRF77yJXG4gKiAtIFNlY3VyaXR5U3RhY2s6IOODh+ODl+ODreOCpOa4iOOBv++8iENSRUFURV9DT01QTEVURe+8iVxuICovXG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIOeSsOWig+ioreWumlxuY29uc3QgZW52ID0ge1xuICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UIHx8ICcxNzg2MjU5NDY5ODEnLFxuICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAnYXAtbm9ydGhlYXN0LTEnLFxufTtcblxuLy8g44OX44Ot44K444Kn44Kv44OI6Kit5a6aXG5jb25zdCBwcm9qZWN0TmFtZSA9ICdwZXJtaXNzaW9uLWF3YXJlLXJhZyc7XG5jb25zdCBlbnZpcm9ubWVudCA9ICdwcm9kJztcbmNvbnN0IHJlZ2lvblByZWZpeCA9ICdUb2t5b1JlZ2lvbic7XG5cbi8vIE5ldHdvcmtpbmdTdGFja+OBi+OCieOBrlZQQ+aDheWgse+8iENsb3VkRm9ybWF0aW9u5Ye65Yqb5YCk44GL44KJ5Y+W5b6X77yJXG5jb25zdCB2cGNDb25maWcgPSB7XG4gIHZwY0lkOiAndnBjLTA5YWEyNTFkNmRiNTJiMWZjJyxcbiAgYXZhaWxhYmlsaXR5Wm9uZXM6IFsnYXAtbm9ydGhlYXN0LTFhJywgJ2FwLW5vcnRoZWFzdC0xYycsICdhcC1ub3J0aGVhc3QtMWQnXSxcbiAgcHVibGljU3VibmV0SWRzOiBbJ3N1Ym5ldC0wNmEwMGE4ODY2ZDA5YjkxMicsICdzdWJuZXQtMGQ3YzdlNDNjMTMyNWNkM2InLCAnc3VibmV0LTA2ZGY1ODlkMmVkMmE1ZmMwJ10sXG4gIHByaXZhdGVTdWJuZXRJZHM6IFsnc3VibmV0LTBhODRhMTZhMTY0MWU5NzBmJywgJ3N1Ym5ldC0wYzQ1OTliNDg2M2ZmNGQzMycsICdzdWJuZXQtMGM5YWQxOGE1OGMwNmU3YzUnXSxcbiAgdnBjQ2lkckJsb2NrOiAnMTAuMjEuMC4wLzE2Jyxcbn07XG5cbi8vIFNlY3VyaXR5U3RhY2vjgYvjgonjga5LTVPmg4XloLFcbmNvbnN0IGttc0tleUFybiA9ICdhcm46YXdzOmttczphcC1ub3J0aGVhc3QtMToxNzg2MjU5NDY5ODE6a2V5L2IyMTIwOTdlLTgyODItNGY4Ni1hMTMzLTc5OTg0NjNhNzUyOCc7XG5cbi8vIERhdGFTdGFja+S9nOaIkFxuY29uc3QgZGF0YVN0YWNrID0gbmV3IERhdGFTdGFjayhhcHAsIGAke3JlZ2lvblByZWZpeH0tJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tRGF0YWAsIHtcbiAgZW52LFxuICBkZXNjcmlwdGlvbjogJ0RhdGEgYW5kIFN0b3JhZ2UgU3RhY2sgLSBTMywgRHluYW1vREIgKEZTeCBPTlRBUCB0ZW1wb3JhcmlseSBkaXNhYmxlZCknLFxuICBcbiAgLy8gVlBD6Kit5a6a77yITmV0d29ya2luZ1N0YWNr44GL44KJ77yJXG4gIHZwYzogdnBjQ29uZmlnLFxuICBcbiAgLy8gS01T6Kit5a6a77yIU2VjdXJpdHlTdGFja+OBi+OCie+8iVxuICBrbXNLZXlBcm4sXG4gIFxuICAvLyDjg5fjg63jgrjjgqfjgq/jg4joqK3lrppcbiAgcHJvamVjdE5hbWUsXG4gIGVudmlyb25tZW50LFxuICBcbiAgLy8g44K/44Kw6Kit5a6aXG4gIHRhZ3M6IHtcbiAgICBQcm9qZWN0OiBwcm9qZWN0TmFtZSxcbiAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnQsXG4gICAgTWFuYWdlZEJ5OiAnQ0RLJyxcbiAgICBTdGFjazogJ0RhdGFTdGFjaycsXG4gICAgUmVnaW9uOiBlbnYucmVnaW9uLFxuICAgIERlcGxveWVkQnk6ICdEYXRhU3RhY2tBcHAnLFxuICAgIE5hbWluZ0NvbXBsaWFuY2U6ICdBZ2VudFN0ZWVyaW5nJyxcbiAgfSxcbn0pO1xuXG4vLyDjgrDjg63jg7zjg5Djg6vjgr/jgrDpgannlKhcbmNkay5UYWdzLm9mKGFwcCkuYWRkKCdQcm9qZWN0JywgcHJvamVjdE5hbWUpO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ0Vudmlyb25tZW50JywgZW52aXJvbm1lbnQpO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcbmNkay5UYWdzLm9mKGFwcCkuYWRkKCdBcmNoaXRlY3R1cmUnLCAnTW9kdWxhcicpO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ1JlZ2lvbicsIGVudi5yZWdpb24pO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ0NyZWF0ZWRCeScsICdEYXRhU3RhY2tBcHAnKTtcbmNkay5UYWdzLm9mKGFwcCkuYWRkKCdOYW1pbmdDb21wbGlhbmNlJywgJ0FnZW50U3RlZXJpbmcnKTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=