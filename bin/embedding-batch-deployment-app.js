#!/usr/bin/env node
"use strict";
/**
 * Embedding Batch デプロイメントアプリケーション
 *
 * Agent Steeringルール準拠:
 * - 実際のAWS環境へのCDKデプロイ実行
 * - Batchリソース作成確認
 * - FSx for NetApp ONTAPマウント動作確認
 *
 * Requirements: 1.4, 1.5, 8.3
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
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const embedding_stack_1 = require("../lib/stacks/integrated/embedding-stack");
const app = new cdk.App();
// 環境設定
const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;
// Batch統合設定
const enableBatchIntegration = app.node.tryGetContext('enableBatchIntegration') ?? true;
const enableBatchTesting = app.node.tryGetContext('enableBatchTesting') ?? false;
const imagePath = app.node.tryGetContext('imagePath') || 'embedding-server';
const imageTag = app.node.tryGetContext('imageTag') || 'latest';
// スタック名生成（統一命名規則）
const stackName = `${projectName}-${environment}-embedding-batch`;
// EmbeddingStackのデプロイ
const embeddingStack = new embedding_stack_1.EmbeddingStack(app, 'EmbeddingBatchStack', {
    stackName,
    env: {
        account,
        region,
    },
    // 既存の設定（型安全な設定）
    computeConfig: {
        lambda: {
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: 300,
            memorySize: 512,
        },
        ecs: {
            enabled: false,
            cluster: {
                containerInsights: false
            }
        },
        batch: {
            enabled: enableBatchIntegration,
            computeEnvironments: [],
            jobQueues: []
        },
    },
    aiConfig: {
        bedrock: {
            enabled: true,
            models: {
                embedding: 'amazon.titan-embed-text-v1',
                textGeneration: 'anthropic.claude-3-sonnet-20240229-v1:0',
            },
        },
    },
    // Embedding Batch統合設定
    projectName,
    environment,
    enableBatchIntegration,
    enableBatchTesting,
    imagePath,
    imageTag,
    // 既存システムとの分離
    vpcId: app.node.tryGetContext('vpcId'), // 既存VPCを使用する場合
    privateSubnetIds: app.node.tryGetContext('privateSubnetIds'),
    securityGroupIds: app.node.tryGetContext('securityGroupIds'),
    // リソース設定
    kmsKeyArn: app.node.tryGetContext('kmsKeyArn'),
    s3BucketArns: app.node.tryGetContext('s3BucketArns'),
    dynamoDbTableArns: app.node.tryGetContext('dynamoDbTableArns'),
    openSearchCollectionArn: app.node.tryGetContext('openSearchCollectionArn'),
    // タグ設定
    tags: {
        Project: projectName,
        Environment: environment,
        Component: 'Embedding',
        Module: 'BATCH_DEPLOYMENT',
        ManagedBy: 'CDK',
        DeploymentType: 'BatchIntegration',
    },
});
// CloudFormation出力
new cdk.CfnOutput(embeddingStack, 'DeploymentInfo', {
    value: JSON.stringify({
        stackName: embeddingStack.stackName,
        region: embeddingStack.region,
        account: embeddingStack.account,
        batchIntegrationEnabled: enableBatchIntegration,
        batchTestingEnabled: enableBatchTesting,
        embeddingConfig: {
            awsBatchEnabled: embeddingStack.getEmbeddingConfig().awsBatch.enabled,
            projectName: embeddingStack.getEmbeddingConfig().projectName,
            environment: embeddingStack.getEmbeddingConfig().environment,
        },
    }),
    description: 'Embedding Batch Deployment Information',
});
// デプロイメント後の確認用出力
new cdk.CfnOutput(embeddingStack, 'PostDeploymentChecklist', {
    value: JSON.stringify({
        steps: [
            '1. Batch Compute Environment が VALID 状態であることを確認',
            '2. Job Definition が ACTIVE 状態であることを確認',
            '3. Job Queue が ENABLED 状態であることを確認',
            '4. FSx for NetApp ONTAP ファイルシステムが AVAILABLE 状態であることを確認',
            '5. テストジョブを実行してFSxマウントを確認',
            '6. 自動スケーリング・自動復旧機能をテスト',
        ],
        testCommands: [
            'aws batch describe-compute-environments --compute-environments <compute-env-name>',
            'aws batch describe-job-definitions --job-definition-name <job-def-name>',
            'aws batch describe-job-queues --job-queues <job-queue-name>',
            'aws fsx describe-file-systems --file-system-ids <fsx-id>',
        ],
    }),
    description: 'Post-deployment verification checklist',
});
// 環境別設定例の出力
new cdk.CfnOutput(embeddingStack, 'ContextExample', {
    value: JSON.stringify(embedding_stack_1.EmbeddingStack.getContextExample(environment), null, 2),
    description: `CDK Context example for ${environment} environment`,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWRkaW5nLWJhdGNoLWRlcGxveW1lbnQtYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW1iZWRkaW5nLWJhdGNoLWRlcGxveW1lbnQtYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0E7Ozs7Ozs7OztHQVNHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsdUNBQXFDO0FBQ3JDLGlEQUFtQztBQUNuQywrREFBaUQ7QUFDakQsOEVBQTBFO0FBRTFFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE9BQU87QUFDUCxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxzQkFBc0IsQ0FBQztBQUNwRixNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUM7QUFDbkUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksZ0JBQWdCLENBQUM7QUFDcEUsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQztBQUVyRixZQUFZO0FBQ1osTUFBTSxzQkFBc0IsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLElBQUksQ0FBQztBQUN4RixNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLElBQUksS0FBSyxDQUFDO0FBQ2pGLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLGtCQUFrQixDQUFDO0FBQzVFLE1BQU0sUUFBUSxHQUFHLEdB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LFdBQVcsRUFBRSx3Q0FBd0M7Q0FDdEQsQ0FBQyxDQUFDO0FBRUgsaUJBQWlCO0FBQ2pCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUseUJBQXlCLEVBQUU7SUFDM0QsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDcEIsS0FBSyxFQUFFO1lBQ0wsaURBQWlEO1lBQ2pELHVDQUF1QztZQUN2QyxtQ0FBbUM7WUFDbkMsd0RBQXdEO1lBQ3hELDBCQUEwQjtZQUMxQix3QkFBd0I7U0FDekI7UUFDRCxZQUFZLEVBQUU7WUFDWixtRkFBbUY7WUFDbkYseUVBQXlFO1lBQ3pFLDZEQUE2RDtZQUM3RCwwREFBMEQ7U0FDM0Q7S0FDRixDQUFDO0lBQ0YsV0FBVyxFQUFFLHdDQUF3QztDQUN0RCxDQUFDLENBQUM7QUFFSCxZQUFZO0FBQ1osSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRTtJQUNsRCxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQ0FBYyxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDN0UsV0FBVyxFQUFFLDJCQUEyQixXQUFXLGNBQWM7Q0FDbEUsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuLyoqXG4gKiBFbWJlZGRpbmcgQmF0Y2gg44OH44OX44Ot44Kk44Oh44Oz44OI44Ki44OX44Oq44Kx44O844K344On44OzXG4gKiBcbiAqIEFnZW50IFN0ZWVyaW5n44Or44O844Or5rqW5ougOlxuICogLSDlrp/pmpvjga5BV1PnkrDlooPjgbjjga5DREvjg4fjg5fjg63jgqTlrp/ooYxcbiAqIC0gQmF0Y2jjg6rjgr3jg7zjgrnkvZzmiJDnorroqo1cbiAqIC0gRlN4IGZvciBOZXRBcHAgT05UQVDjg57jgqbjg7Pjg4jli5XkvZznorroqo1cbiAqIFxuICogUmVxdWlyZW1lbnRzOiAxLjQsIDEuNSwgOC4zXG4gKi9cblxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IEVtYmVkZGluZ1N0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9pbnRlZ3JhdGVkL2VtYmVkZGluZy1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIOeSsOWig+ioreWumlxuY29uc3QgcHJvamVjdE5hbWUgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdwcm9qZWN0TmFtZScpIHx8ICdwZXJtaXNzaW9uLWF3YXJlLXJhZyc7XG5jb25zdCBlbnZpcm9ubWVudCA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2Vudmlyb25tZW50JykgfHwgJ2Rldic7XG5jb25zdCByZWdpb24gPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdyZWdpb24nKSB8fCAnYXAtbm9ydGhlYXN0LTEnO1xuY29uc3QgYWNjb3VudCA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2FjY291bnQnKSB8fCBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UO1xuXG4vLyBCYXRjaOe1seWQiOioreWumlxuY29uc3QgZW5hYmxlQmF0Y2hJbnRlZ3JhdGlvbiA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VuYWJsZUJhdGNoSW50ZWdyYXRpb24nKSA/PyB0cnVlO1xuY29uc3QgZW5hYmxlQmF0Y2hUZXN0aW5nID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW5hYmxlQmF0Y2hUZXN0aW5nJykgPz8gZmFsc2U7XG5jb25zdCBpbWFnZVBhdGggPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdpbWFnZVBhdGgnKSB8fCAnZW1iZWRkaW5nLXNlcnZlcic7XG5jb25zdCBpbWFnZVRhZyA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2ltYWdlVGFnJykgfHwgJ2xhdGVzdCc7XG5cbi8vIOOCueOCv+ODg+OCr+WQjeeUn+aIkO+8iOe1seS4gOWRveWQjeimj+WJh++8iVxuY29uc3Qgc3RhY2tOYW1lID0gYCR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LWVtYmVkZGluZy1iYXRjaGA7XG5cbi8vIEVtYmVkZGluZ1N0YWNr44Gu44OH44OX44Ot44KkXG5jb25zdCBlbWJlZGRpbmdTdGFjayA9IG5ldyBFbWJlZGRpbmdTdGFjayhhcHAsICdFbWJlZGRpbmdCYXRjaFN0YWNrJywge1xuICBzdGFja05hbWUsXG4gIGVudjoge1xuICAgIGFjY291bnQsXG4gICAgcmVnaW9uLFxuICB9LFxuICBcbiAgLy8g5pei5a2Y44Gu6Kit5a6a77yI5Z6L5a6J5YWo44Gq6Kit5a6a77yJXG4gIGNvbXB1dGVDb25maWc6IHtcbiAgICBsYW1iZGE6IHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgdGltZW91dDogMzAwLFxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgIH0sXG4gICAgZWNzOiB7XG4gICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgIGNsdXN0ZXI6IHsgXG4gICAgICAgIGNvbnRhaW5lckluc2lnaHRzOiBmYWxzZSBcbiAgICAgIH1cbiAgICB9LFxuICAgIGJhdGNoOiB7XG4gICAgICBlbmFibGVkOiBlbmFibGVCYXRjaEludGVncmF0aW9uLFxuICAgICAgY29tcHV0ZUVudmlyb25tZW50czogW10sXG4gICAgICBqb2JRdWV1ZXM6IFtdXG4gICAgfSxcbiAgfSxcbiAgYWlDb25maWc6IHtcbiAgICBiZWRyb2NrOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgbW9kZWxzOiB7XG4gICAgICAgIGVtYmVkZGluZzogJ2FtYXpvbi50aXRhbi1lbWJlZC10ZXh0LXYxJyxcbiAgICAgICAgdGV4dEdlbmVyYXRpb246ICdhbnRocm9waWMuY2xhdWRlLTMtc29ubmV0LTIwMjQwMjI5LXYxOjAnLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBcbiAgLy8gRW1iZWRkaW5nIEJhdGNo57Wx5ZCI6Kit5a6aXG4gIHByb2plY3ROYW1lLFxuICBlbnZpcm9ubWVudCxcbiAgZW5hYmxlQmF0Y2hJbnRlZ3JhdGlvbixcbiAgZW5hYmxlQmF0Y2hUZXN0aW5nLFxuICBpbWFnZVBhdGgsXG4gIGltYWdlVGFnLFxuICBcbiAgLy8g5pei5a2Y44K344K544OG44Og44Go44Gu5YiG6ZuiXG4gIHZwY0lkOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCd2cGNJZCcpLCAvLyDml6LlrZhWUEPjgpLkvb/nlKjjgZnjgovloLTlkIhcbiAgcHJpdmF0ZVN1Ym5ldElkczogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgncHJpdmF0ZVN1Ym5ldElkcycpLFxuICBzZWN1cml0eUdyb3VwSWRzOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdzZWN1cml0eUdyb3VwSWRzJyksXG4gIFxuICAvLyDjg6rjgr3jg7zjgrnoqK3lrppcbiAga21zS2V5QXJuOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdrbXNLZXlBcm4nKSxcbiAgczNCdWNrZXRBcm5zOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdzM0J1Y2tldEFybnMnKSxcbiAgZHluYW1vRGJUYWJsZUFybnM6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2R5bmFtb0RiVGFibGVBcm5zJyksXG4gIG9wZW5TZWFyY2hDb2xsZWN0aW9uQXJuOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdvcGVuU2VhcmNoQ29sbGVjdGlvbkFybicpLFxuICBcbiAgLy8g44K/44Kw6Kit5a6aXG4gIHRhZ3M6IHtcbiAgICBQcm9qZWN0OiBwcm9qZWN0TmFtZSxcbiAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnQsXG4gICAgQ29tcG9uZW50OiAnRW1iZWRkaW5nJyxcbiAgICBNb2R1bGU6ICdCQVRDSF9ERVBMT1lNRU5UJyxcbiAgICBNYW5hZ2VkQnk6ICdDREsnLFxuICAgIERlcGxveW1lbnRUeXBlOiAnQmF0Y2hJbnRlZ3JhdGlvbicsXG4gIH0sXG59KTtcblxuLy8gQ2xvdWRGb3JtYXRpb27lh7rliptcbm5ldyBjZGsuQ2ZuT3V0cHV0KGVtYmVkZGluZ1N0YWNrLCAnRGVwbG95bWVudEluZm8nLCB7XG4gIHZhbHVlOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgc3RhY2tOYW1lOiBlbWJlZGRpbmdTdGFjay5zdGFja05hbWUsXG4gICAgcmVnaW9uOiBlbWJlZGRpbmdTdGFjay5yZWdpb24sXG4gICAgYWNjb3VudDogZW1iZWRkaW5nU3RhY2suYWNjb3VudCxcbiAgICBiYXRjaEludGVncmF0aW9uRW5hYmxlZDogZW5hYmxlQmF0Y2hJbnRlZ3JhdGlvbixcbiAgICBiYXRjaFRlc3RpbmdFbmFibGVkOiBlbmFibGVCYXRjaFRlc3RpbmcsXG4gICAgZW1iZWRkaW5nQ29uZmlnOiB7XG4gICAgICBhd3NCYXRjaEVuYWJsZWQ6IGVtYmVkZGluZ1N0YWNrLmdldEVtYmVkZGluZ0NvbmZpZygpLmF3c0JhdGNoLmVuYWJsZWQsXG4gICAgICBwcm9qZWN0TmFtZTogZW1iZWRkaW5nU3RhY2suZ2V0RW1iZWRkaW5nQ29uZmlnKCkucHJvamVjdE5hbWUsXG4gICAgICBlbnZpcm9ubWVudDogZW1iZWRkaW5nU3RhY2suZ2V0RW1iZWRkaW5nQ29uZmlnKCkuZW52aXJvbm1lbnQsXG4gICAgfSxcbiAgfSksXG4gIGRlc2NyaXB0aW9uOiAnRW1iZWRkaW5nIEJhdGNoIERlcGxveW1lbnQgSW5mb3JtYXRpb24nLFxufSk7XG5cbi8vIOODh+ODl+ODreOCpOODoeODs+ODiOW+jOOBrueiuuiqjeeUqOWHuuWKm1xubmV3IGNkay5DZm5PdXRwdXQoZW1iZWRkaW5nU3RhY2ssICdQb3N0RGVwbG95bWVudENoZWNrbGlzdCcsIHtcbiAgdmFsdWU6IEpTT04uc3RyaW5naWZ5KHtcbiAgICBzdGVwczogW1xuICAgICAgJzEuIEJhdGNoIENvbXB1dGUgRW52aXJvbm1lbnQg44GMIFZBTElEIOeKtuaFi+OBp+OBguOCi+OBk+OBqOOCkueiuuiqjScsXG4gICAgICAnMi4gSm9iIERlZmluaXRpb24g44GMIEFDVElWRSDnirbmhYvjgafjgYLjgovjgZPjgajjgpLnorroqo0nLFxuICAgICAgJzMuIEpvYiBRdWV1ZSDjgYwgRU5BQkxFRCDnirbmhYvjgafjgYLjgovjgZPjgajjgpLnorroqo0nLFxuICAgICAgJzQuIEZTeCBmb3IgTmV0QXBwIE9OVEFQIOODleOCoeOCpOODq+OCt+OCueODhuODoOOBjCBBVkFJTEFCTEUg54q25oWL44Gn44GC44KL44GT44Go44KS56K66KqNJyxcbiAgICAgICc1LiDjg4bjgrnjg4jjgrjjg6fjg5bjgpLlrp/ooYzjgZfjgaZGU3jjg57jgqbjg7Pjg4jjgpLnorroqo0nLFxuICAgICAgJzYuIOiHquWLleOCueOCseODvOODquODs+OCsOODu+iHquWLleW+qeaXp+apn+iDveOCkuODhuOCueODiCcsXG4gICAgXSxcbiAgICB0ZXN0Q29tbWFuZHM6IFtcbiAgICAgICdhd3MgYmF0Y2ggZGVzY3JpYmUtY29tcHV0ZS1lbnZpcm9ubWVudHMgLS1jb21wdXRlLWVudmlyb25tZW50cyA8Y29tcHV0ZS1lbnYtbmFtZT4nLFxuICAgICAgJ2F3cyBiYXRjaCBkZXNjcmliZS1qb2ItZGVmaW5pdGlvbnMgLS1qb2ItZGVmaW5pdGlvbi1uYW1lIDxqb2ItZGVmLW5hbWU+JyxcbiAgICAgICdhd3MgYmF0Y2ggZGVzY3JpYmUtam9iLXF1ZXVlcyAtLWpvYi1xdWV1ZXMgPGpvYi1xdWV1ZS1uYW1lPicsXG4gICAgICAnYXdzIGZzeCBkZXNjcmliZS1maWxlLXN5c3RlbXMgLS1maWxlLXN5c3RlbS1pZHMgPGZzeC1pZD4nLFxuICAgIF0sXG4gIH0pLFxuICBkZXNjcmlwdGlvbjogJ1Bvc3QtZGVwbG95bWVudCB2ZXJpZmljYXRpb24gY2hlY2tsaXN0Jyxcbn0pO1xuXG4vLyDnkrDlooPliKXoqK3lrprkvovjga7lh7rliptcbm5ldyBjZGsuQ2ZuT3V0cHV0KGVtYmVkZGluZ1N0YWNrLCAnQ29udGV4dEV4YW1wbGUnLCB7XG4gIHZhbHVlOiBKU09OLnN0cmluZ2lmeShFbWJlZGRpbmdTdGFjay5nZXRDb250ZXh0RXhhbXBsZShlbnZpcm9ubWVudCksIG51bGwsIDIpLFxuICBkZXNjcmlwdGlvbjogYENESyBDb250ZXh0IGV4YW1wbGUgZm9yICR7ZW52aXJvbm1lbnR9IGVudmlyb25tZW50YCxcbn0pO1xuXG5hcHAuc3ludGgoKTsiXX0=