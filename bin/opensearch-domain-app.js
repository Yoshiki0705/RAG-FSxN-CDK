#!/usr/bin/env node
"use strict";
/**
 * OpenSearch Domain CDKアプリケーション
 *
 * 通常のOpenSearchクラスター（非Serverless）をデプロイ
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
const opensearch_domain_stack_1 = require("../lib/stacks/opensearch-domain-stack");
const app = new cdk.App();
// コンテキスト変数取得
const environment = app.node.tryGetContext('environment') || 'dev';
const projectName = app.node.tryGetContext('projectName') || 'multimodal';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
const useVpc = app.node.tryGetContext('useVpc') === 'true';
const existingVpcId = app.node.tryGetContext('existingVpcId');
const enableKmsEncryption = app.node.tryGetContext('enableKmsEncryption') === 'true';
// スタック名生成（Agent Steering命名規則準拠）
const getRegionPrefix = (region) => {
    switch (region) {
        case 'ap-northeast-1': return 'TokyoRegion';
        case 'ap-northeast-3': return 'OsakaRegion';
        case 'us-east-1': return 'USEastRegion';
        case 'us-west-2': return 'USWestRegion';
        case 'eu-west-1': return 'EuropeRegion';
        default: return 'DefaultRegion';
    }
};
const regionPrefix = getRegionPrefix(region);
const stackName = app.node.tryGetContext('stackName') || `${regionPrefix}-${projectName}-${environment}-ExternalVectorDB`;
// OpenSearch Domainスタック作成
new opensearch_domain_stack_1.OpenSearchDomainStack(app, stackName, {
    environment,
    projectName,
    useVpc,
    existingVpcId,
    enableKmsEncryption,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
    },
    tags: {
        Environment: environment,
        ProjectName: projectName,
        Component: 'OpenSearch',
        Purpose: 'MultimodalEmbedding',
        ManagedBy: 'CDK',
        DeployedBy: process.env.USER || 'unknown',
        DeployedAt: new Date().toISOString(),
    },
    description: `OpenSearch Domain for ${projectName} ${environment} environment - Multimodal Embedding`,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbnNlYXJjaC1kb21haW4tYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsib3BlbnNlYXJjaC1kb21haW4tYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7R0FJRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsbUZBQThFO0FBRTlFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLGFBQWE7QUFDYixNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUM7QUFDbkUsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLElBQUksWUFBWSxDQUFDO0FBQzFFLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO0FBQ3BFLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFLLE1BQU0sQ0FBQztBQUMzRCxNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUM5RCxNQUFNLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLEtBQUssTUFBTSxDQUFDO0FBRXJGLGdDQUFnQztBQUNoQyxNQUFNLGVBQWUsR0FBRyxDQUFDLE1BQWMsRUFBVSxFQUFFO0lBQ2pELFFBQVEsTUFBTSxFQUFFLENBQUM7UUFDZixLQUFLLGdCQUFnQixDQUFDLENBQUMsT0FBTyxhQUFhLENBQUM7UUFDNUMsS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLE9BQU8sYUFBYSxDQUFDO1FBQzVDLEtBQUssV0FBVyxDQUFDLENBQUMsT0FBTyxjQUFjLENBQUM7UUFDeEMsS0FBSyxXQUFXLENBQUMsQ0FBQyxPQUFPLGNBQWMsQ0FBQztRQUN4QyxLQUFLLFdBQVcsQ0FBQyxDQUFDLE9BQU8sY0FBYyxDQUFDO1FBQ3hDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDO0lBQ2xDLENBQUM7QUFDSCxDQUFDLENBQUM7QUFFRixNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0MsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxZQUFZLElBQUksV0FBVyxJQUFJLFdBQVcsbUJBQW1CLENBQUM7QUFFMUgsMEJBQTBCO0FBQzFCLElBQUksK0NBQXFCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtJQUN4QyxXQUFXO0lBQ1gsV0FBVztJQUNYLE1BQU07SUFDTixhQUFhO0lBQ2IsbUJBQW1CO0lBRW5CLEdBQUcsRUFBRTtRQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtRQUN4QyxNQUFNLEVBQUUsTUFBTTtLQUNmO0lBRUQsSUFBSSxFQUFFO1FBQ0osV0FBVyxFQUFFLFdBQVc7UUFDeEIsV0FBVyxFQUFFLFdBQVc7UUFDeEIsU0FBUyxFQUFFLFlBQVk7UUFDdkIsT0FBTyxFQUFFLHFCQUFxQjtRQUM5QixTQUFTLEVBQUUsS0FBSztRQUNoQixVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksU0FBUztRQUN6QyxVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDckM7SUFFRCxXQUFXLEVBQUUseUJBQXlCLFdBQVcsSUFBSSxXQUFXLHFDQUFxQztDQUN0RyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICogT3BlblNlYXJjaCBEb21haW4gQ0RL44Ki44OX44Oq44Kx44O844K344On44OzXG4gKiBcbiAqIOmAmuW4uOOBrk9wZW5TZWFyY2jjgq/jg6njgrnjgr/jg7zvvIjpnZ5TZXJ2ZXJsZXNz77yJ44KS44OH44OX44Ot44KkXG4gKi9cblxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IE9wZW5TZWFyY2hEb21haW5TdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3Mvb3BlbnNlYXJjaC1kb21haW4tc3RhY2snO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG4vLyDjgrPjg7Pjg4bjgq3jgrnjg4jlpInmlbDlj5blvpdcbmNvbnN0IGVudmlyb25tZW50ID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnQnKSB8fCAnZGV2JztcbmNvbnN0IHByb2plY3ROYW1lID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgncHJvamVjdE5hbWUnKSB8fCAnbXVsdGltb2RhbCc7XG5jb25zdCByZWdpb24gPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdyZWdpb24nKSB8fCAnYXAtbm9ydGhlYXN0LTEnO1xuY29uc3QgdXNlVnBjID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgndXNlVnBjJykgPT09ICd0cnVlJztcbmNvbnN0IGV4aXN0aW5nVnBjSWQgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdleGlzdGluZ1ZwY0lkJyk7XG5jb25zdCBlbmFibGVLbXNFbmNyeXB0aW9uID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW5hYmxlS21zRW5jcnlwdGlvbicpID09PSAndHJ1ZSc7XG5cbi8vIOOCueOCv+ODg+OCr+WQjeeUn+aIkO+8iEFnZW50IFN0ZWVyaW5n5ZG95ZCN6KaP5YmH5rqW5oug77yJXG5jb25zdCBnZXRSZWdpb25QcmVmaXggPSAocmVnaW9uOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBzd2l0Y2ggKHJlZ2lvbikge1xuICAgIGNhc2UgJ2FwLW5vcnRoZWFzdC0xJzogcmV0dXJuICdUb2t5b1JlZ2lvbic7XG4gICAgY2FzZSAnYXAtbm9ydGhlYXN0LTMnOiByZXR1cm4gJ09zYWthUmVnaW9uJztcbiAgICBjYXNlICd1cy1lYXN0LTEnOiByZXR1cm4gJ1VTRWFzdFJlZ2lvbic7XG4gICAgY2FzZSAndXMtd2VzdC0yJzogcmV0dXJuICdVU1dlc3RSZWdpb24nO1xuICAgIGNhc2UgJ2V1LXdlc3QtMSc6IHJldHVybiAnRXVyb3BlUmVnaW9uJztcbiAgICBkZWZhdWx0OiByZXR1cm4gJ0RlZmF1bHRSZWdpb24nO1xuICB9XG59O1xuXG5jb25zdCByZWdpb25QcmVmaXggPSBnZXRSZWdpb25QcmVmaXgocmVnaW9uKTtcbmNvbnN0IHN0YWNrTmFtZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3N0YWNrTmFtZScpIHx8IGAke3JlZ2lvblByZWZpeH0tJHtwcm9qZWN0TmFtZX0tJHtlbnZpcm9ubWVudH0tRXh0ZXJuYWxWZWN0b3JEQmA7XG5cbi8vIE9wZW5TZWFyY2ggRG9tYWlu44K544K/44OD44Kv5L2c5oiQXG5uZXcgT3BlblNlYXJjaERvbWFpblN0YWNrKGFwcCwgc3RhY2tOYW1lLCB7XG4gIGVudmlyb25tZW50LFxuICBwcm9qZWN0TmFtZSxcbiAgdXNlVnBjLFxuICBleGlzdGluZ1ZwY0lkLFxuICBlbmFibGVLbXNFbmNyeXB0aW9uLFxuICBcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHJlZ2lvbixcbiAgfSxcbiAgXG4gIHRhZ3M6IHtcbiAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnQsXG4gICAgUHJvamVjdE5hbWU6IHByb2plY3ROYW1lLFxuICAgIENvbXBvbmVudDogJ09wZW5TZWFyY2gnLFxuICAgIFB1cnBvc2U6ICdNdWx0aW1vZGFsRW1iZWRkaW5nJyxcbiAgICBNYW5hZ2VkQnk6ICdDREsnLFxuICAgIERlcGxveWVkQnk6IHByb2Nlc3MuZW52LlVTRVIgfHwgJ3Vua25vd24nLFxuICAgIERlcGxveWVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgfSxcbiAgXG4gIGRlc2NyaXB0aW9uOiBgT3BlblNlYXJjaCBEb21haW4gZm9yICR7cHJvamVjdE5hbWV9ICR7ZW52aXJvbm1lbnR9IGVudmlyb25tZW50IC0gTXVsdGltb2RhbCBFbWJlZGRpbmdgLFxufSk7Il19