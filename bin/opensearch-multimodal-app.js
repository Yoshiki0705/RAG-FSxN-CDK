#!/usr/bin/env node
"use strict";
/**
 * OpenSearch Multimodal Embeddingデプロイメントアプリケーション
 *
 * Titan Multimodal Embedding用OpenSearchクラスターのデプロイ
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
const opensearch_multimodal_stack_1 = require("../lib/stacks/opensearch-multimodal-stack");
const app = new cdk.App();
// 環境設定取得
const environment = app.node.tryGetContext('environment') || 'dev';
const projectName = app.node.tryGetContext('projectName') || 'multimodal-rag';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
const performanceTier = app.node.tryGetContext('performanceTier') || 'standard';
const useVpc = app.node.tryGetContext('useVpc') === 'true';
const existingVpcId = app.node.tryGetContext('existingVpcId');
const enableKmsEncryption = app.node.tryGetContext('enableKmsEncryption') !== 'false';
// AWS環境設定
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
};
// スタック名生成
const stackName = `${projectName}-${environment}-opensearch-multimodal`;
console.log('🚀 OpenSearch Multimodal Embeddingスタックデプロイ開始');
console.log(`📍 設定情報:`);
console.log(`  • 環境: ${environment}`);
console.log(`  • プロジェクト名: ${projectName}`);
console.log(`  • リージョン: ${region}`);
console.log(`  • パフォーマンスティア: ${performanceTier}`);
console.log(`  • VPC使用: ${useVpc}`);
console.log(`  • KMS暗号化: ${enableKmsEncryption}`);
console.log(`  • スタック名: ${stackName}`);
// OpenSearchスタック作成
const openSearchStack = new opensearch_multimodal_stack_1.OpenSearchMultimodalStack(app, stackName, {
    env,
    environment,
    projectName,
    performanceTier: performanceTier,
    useVpc,
    existingVpcId,
    enableKmsEncryption,
    tags: {
        DeployedBy: 'CDK',
        DeploymentDate: new Date().toISOString().split('T')[0],
        EmbeddingModel: 'TitanMultimodal',
    },
    description: `OpenSearch cluster for ${projectName} multimodal embedding (${environment})`,
});
// スタック依存関係とメタデータ
cdk.Tags.of(openSearchStack).add('CDKApp', 'OpenSearchMultimodal');
cdk.Tags.of(openSearchStack).add('Version', '1.0.0');
console.log('✅ OpenSearch Multimodal Embeddingスタック設定完了');
console.log('💡 デプロイコマンド例:');
console.log(`   cdk deploy ${stackName} -c environment=${environment} -c region=${region}`);
console.log('💡 削除コマンド例:');
console.log(`   cdk destroy ${stackName} -c environment=${environment} -c region=${region}`);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbnNlYXJjaC1tdWx0aW1vZGFsLWFwcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wZW5zZWFyY2gtbXVsdGltb2RhbC1hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7OztHQUlHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsdUNBQXFDO0FBQ3JDLGlEQUFtQztBQUNuQywyRkFBc0Y7QUFFdEYsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsU0FBUztBQUNULE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUNuRSxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQztBQUM5RSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQztBQUNwRSxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLFVBQVUsQ0FBQztBQUNoRixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxNQUFNLENBQUM7QUFDM0QsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDOUQsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLE9BQU8sQ0FBQztBQUV0RixVQUFVO0FBQ1YsTUFBTSxHQUFHLEdBQUc7SUFDVixPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7SUFDeEMsTUFBTSxFQUFFLE1BQU07Q0FDZixDQUFDO0FBRUYsVUFBVTtBQUNWLE1BQU0sU0FBUyxHQUFHLEdBQUcsV0FBVyxJQUFJLFdBQVcsd0JBQXdCLENBQUM7QUFFeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO0FBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixlQUFlLEVBQUUsQ0FBQyxDQUFDO0FBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxtQkFBbUIsRUFBRSxDQUFDLENBQUM7QUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLFNBQVMsRUFBRSxDQUFDLENBQUM7QUFFdkMsbUJBQW1CO0FBQ25CLE1BQU0sZUFBZSxHQUFHLElBQUksdURBQXlCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtJQUNwRSxHQUFHO0lBQ0gsV0FBVztJQUNYLFdBQVc7SUFDWCxlQUFlLEVBQUUsZUFBc0M7SUFDdkQsTUFBTTtJQUNOLGFBQWE7SUFDYixtQkFBbUI7SUFDbkIsSUFBSSxFQUFFO1FBQ0osVUFBVSxFQUFFLEtBQUs7UUFDakIsY0FBYyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxjQUFjLEVBQUUsaUJBQWlCO0tBQ2xDO0lBQ0QsV0FBVyxFQUFFLDBCQUEwQixXQUFXLDBCQUEwQixXQUFXLEdBQUc7Q0FDM0YsQ0FBQyxDQUFDO0FBRUgsaUJBQWlCO0FBQ2pCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztBQUNuRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBRXJELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLENBQUMsQ0FBQztBQUN6RCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLFNBQVMsbUJBQW1CLFdBQVcsY0FBYyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQzVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsU0FBUyxtQkFBbUIsV0FBVyxjQUFjLE1BQU0sRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICogT3BlblNlYXJjaCBNdWx0aW1vZGFsIEVtYmVkZGluZ+ODh+ODl+ODreOCpOODoeODs+ODiOOCouODl+ODquOCseODvOOCt+ODp+ODs1xuICogXG4gKiBUaXRhbiBNdWx0aW1vZGFsIEVtYmVkZGluZ+eUqE9wZW5TZWFyY2jjgq/jg6njgrnjgr/jg7zjga7jg4fjg5fjg63jgqRcbiAqL1xuXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgT3BlblNlYXJjaE11bHRpbW9kYWxTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3Mvb3BlbnNlYXJjaC1tdWx0aW1vZGFsLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8g55Kw5aKD6Kit5a6a5Y+W5b6XXG5jb25zdCBlbnZpcm9ubWVudCA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2Vudmlyb25tZW50JykgfHwgJ2Rldic7XG5jb25zdCBwcm9qZWN0TmFtZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3Byb2plY3ROYW1lJykgfHwgJ211bHRpbW9kYWwtcmFnJztcbmNvbnN0IHJlZ2lvbiA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3JlZ2lvbicpIHx8ICdhcC1ub3J0aGVhc3QtMSc7XG5jb25zdCBwZXJmb3JtYW5jZVRpZXIgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdwZXJmb3JtYW5jZVRpZXInKSB8fCAnc3RhbmRhcmQnO1xuY29uc3QgdXNlVnBjID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgndXNlVnBjJykgPT09ICd0cnVlJztcbmNvbnN0IGV4aXN0aW5nVnBjSWQgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdleGlzdGluZ1ZwY0lkJyk7XG5jb25zdCBlbmFibGVLbXNFbmNyeXB0aW9uID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW5hYmxlS21zRW5jcnlwdGlvbicpICE9PSAnZmFsc2UnO1xuXG4vLyBBV1PnkrDlooPoqK3lrppcbmNvbnN0IGVudiA9IHtcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgcmVnaW9uOiByZWdpb24sXG59O1xuXG4vLyDjgrnjgr/jg4Pjgq/lkI3nlJ/miJBcbmNvbnN0IHN0YWNrTmFtZSA9IGAke3Byb2plY3ROYW1lfS0ke2Vudmlyb25tZW50fS1vcGVuc2VhcmNoLW11bHRpbW9kYWxgO1xuXG5jb25zb2xlLmxvZygn8J+agCBPcGVuU2VhcmNoIE11bHRpbW9kYWwgRW1iZWRkaW5n44K544K/44OD44Kv44OH44OX44Ot44Kk6ZaL5aeLJyk7XG5jb25zb2xlLmxvZyhg8J+TjSDoqK3lrprmg4XloLE6YCk7XG5jb25zb2xlLmxvZyhgICDigKIg55Kw5aKDOiAke2Vudmlyb25tZW50fWApO1xuY29uc29sZS5sb2coYCAg4oCiIOODl+ODreOCuOOCp+OCr+ODiOWQjTogJHtwcm9qZWN0TmFtZX1gKTtcbmNvbnNvbGUubG9nKGAgIOKAoiDjg6rjg7zjgrjjg6fjg7M6ICR7cmVnaW9ufWApO1xuY29uc29sZS5sb2coYCAg4oCiIOODkeODleOCqeODvOODnuODs+OCueODhuOCo+OCojogJHtwZXJmb3JtYW5jZVRpZXJ9YCk7XG5jb25zb2xlLmxvZyhgICDigKIgVlBD5L2/55SoOiAke3VzZVZwY31gKTtcbmNvbnNvbGUubG9nKGAgIOKAoiBLTVPmmpflj7fljJY6ICR7ZW5hYmxlS21zRW5jcnlwdGlvbn1gKTtcbmNvbnNvbGUubG9nKGAgIOKAoiDjgrnjgr/jg4Pjgq/lkI06ICR7c3RhY2tOYW1lfWApO1xuXG4vLyBPcGVuU2VhcmNo44K544K/44OD44Kv5L2c5oiQXG5jb25zdCBvcGVuU2VhcmNoU3RhY2sgPSBuZXcgT3BlblNlYXJjaE11bHRpbW9kYWxTdGFjayhhcHAsIHN0YWNrTmFtZSwge1xuICBlbnYsXG4gIGVudmlyb25tZW50LFxuICBwcm9qZWN0TmFtZSxcbiAgcGVyZm9ybWFuY2VUaWVyOiBwZXJmb3JtYW5jZVRpZXIgYXMgJ3N0YW5kYXJkJyB8ICdoaWdoJyxcbiAgdXNlVnBjLFxuICBleGlzdGluZ1ZwY0lkLFxuICBlbmFibGVLbXNFbmNyeXB0aW9uLFxuICB0YWdzOiB7XG4gICAgRGVwbG95ZWRCeTogJ0NESycsXG4gICAgRGVwbG95bWVudERhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdLFxuICAgIEVtYmVkZGluZ01vZGVsOiAnVGl0YW5NdWx0aW1vZGFsJyxcbiAgfSxcbiAgZGVzY3JpcHRpb246IGBPcGVuU2VhcmNoIGNsdXN0ZXIgZm9yICR7cHJvamVjdE5hbWV9IG11bHRpbW9kYWwgZW1iZWRkaW5nICgke2Vudmlyb25tZW50fSlgLFxufSk7XG5cbi8vIOOCueOCv+ODg+OCr+S+neWtmOmWouS/guOBqOODoeOCv+ODh+ODvOOCv1xuY2RrLlRhZ3Mub2Yob3BlblNlYXJjaFN0YWNrKS5hZGQoJ0NES0FwcCcsICdPcGVuU2VhcmNoTXVsdGltb2RhbCcpO1xuY2RrLlRhZ3Mub2Yob3BlblNlYXJjaFN0YWNrKS5hZGQoJ1ZlcnNpb24nLCAnMS4wLjAnKTtcblxuY29uc29sZS5sb2coJ+KchSBPcGVuU2VhcmNoIE11bHRpbW9kYWwgRW1iZWRkaW5n44K544K/44OD44Kv6Kit5a6a5a6M5LqGJyk7XG5jb25zb2xlLmxvZygn8J+SoSDjg4fjg5fjg63jgqTjgrPjg57jg7Pjg4nkvos6Jyk7XG5jb25zb2xlLmxvZyhgICAgY2RrIGRlcGxveSAke3N0YWNrTmFtZX0gLWMgZW52aXJvbm1lbnQ9JHtlbnZpcm9ubWVudH0gLWMgcmVnaW9uPSR7cmVnaW9ufWApO1xuY29uc29sZS5sb2coJ/CfkqEg5YmK6Zmk44Kz44Oe44Oz44OJ5L6LOicpO1xuY29uc29sZS5sb2coYCAgIGNkayBkZXN0cm95ICR7c3RhY2tOYW1lfSAtYyBlbnZpcm9ubWVudD0ke2Vudmlyb25tZW50fSAtYyByZWdpb249JHtyZWdpb259YCk7Il19