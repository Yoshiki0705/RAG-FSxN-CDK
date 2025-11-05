#!/usr/bin/env node
"use strict";
/**
 * シンプルなOpenSearchデプロイメントアプリケーション
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
const simple_opensearch_stack_1 = require("../lib/stacks/simple-opensearch-stack");
const app = new cdk.App();
// 環境設定取得
const environment = app.node.tryGetContext('environment') || 'dev';
const projectName = app.node.tryGetContext('projectName') || 'multimodal';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';
// AWS環境設定
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
};
// スタック名生成
const stackName = `${projectName}-${environment}-opensearch`;
console.log('🚀 シンプルOpenSearchスタックデプロイ開始');
console.log(`📍 設定情報:`);
console.log(`  • 環境: ${environment}`);
console.log(`  • プロジェクト名: ${projectName}`);
console.log(`  • リージョン: ${region}`);
console.log(`  • スタック名: ${stackName}`);
// OpenSearchスタック作成
const openSearchStack = new simple_opensearch_stack_1.SimpleOpenSearchStack(app, stackName, {
    env,
    environment,
    projectName,
    description: `Simple OpenSearch cluster for ${projectName} (${environment})`,
});
console.log('✅ シンプルOpenSearchスタック設定完了');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlLW9wZW5zZWFyY2gtYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2ltcGxlLW9wZW5zZWFyY2gtYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7O0dBRUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLG1GQUE4RTtBQUU5RSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixTQUFTO0FBQ1QsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxDQUFDO0FBQ25FLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFlBQVksQ0FBQztBQUMxRSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQztBQUVwRSxVQUFVO0FBQ1YsTUFBTSxHQUFHLEdBQUc7SUFDVixPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7SUFDeEMsTUFBTSxFQUFFLE1BQU07Q0FDZixDQUFDO0FBRUYsVUFBVTtBQUNWLE1BQU0sU0FBUyxHQUFHLEdBQUcsV0FBVyxJQUFJLFdBQVcsYUFBYSxDQUFDO0FBRTdELE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLFNBQVMsRUFBRSxDQUFDLENBQUM7QUFFdkMsbUJBQW1CO0FBQ25CLE1BQU0sZUFBZSxHQUFHLElBQUksK0NBQXFCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtJQUNoRSxHQUFHO0lBQ0gsV0FBVztJQUNYLFdBQVc7SUFDWCxXQUFXLEVBQUUsaUNBQWlDLFdBQVcsS0FBSyxXQUFXLEdBQUc7Q0FDN0UsQ0FBQyxDQUFDO0FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqIOOCt+ODs+ODl+ODq+OBqk9wZW5TZWFyY2jjg4fjg5fjg63jgqTjg6Hjg7Pjg4jjgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7NcbiAqL1xuXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgU2ltcGxlT3BlblNlYXJjaFN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9zaW1wbGUtb3BlbnNlYXJjaC1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIOeSsOWig+ioreWumuWPluW+l1xuY29uc3QgZW52aXJvbm1lbnQgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbnZpcm9ubWVudCcpIHx8ICdkZXYnO1xuY29uc3QgcHJvamVjdE5hbWUgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdwcm9qZWN0TmFtZScpIHx8ICdtdWx0aW1vZGFsJztcbmNvbnN0IHJlZ2lvbiA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3JlZ2lvbicpIHx8ICdhcC1ub3J0aGVhc3QtMSc7XG5cbi8vIEFXU+eSsOWig+ioreWumlxuY29uc3QgZW52ID0ge1xuICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICByZWdpb246IHJlZ2lvbixcbn07XG5cbi8vIOOCueOCv+ODg+OCr+WQjeeUn+aIkFxuY29uc3Qgc3RhY2tOYW1lID0gYCR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LW9wZW5zZWFyY2hgO1xuXG5jb25zb2xlLmxvZygn8J+agCDjgrfjg7Pjg5fjg6tPcGVuU2VhcmNo44K544K/44OD44Kv44OH44OX44Ot44Kk6ZaL5aeLJyk7XG5jb25zb2xlLmxvZyhg8J+TjSDoqK3lrprmg4XloLE6YCk7XG5jb25zb2xlLmxvZyhgICDigKIg55Kw5aKDOiAke2Vudmlyb25tZW50fWApO1xuY29uc29sZS5sb2coYCAg4oCiIOODl+ODreOCuOOCp+OCr+ODiOWQjTogJHtwcm9qZWN0TmFtZX1gKTtcbmNvbnNvbGUubG9nKGAgIOKAoiDjg6rjg7zjgrjjg6fjg7M6ICR7cmVnaW9ufWApO1xuY29uc29sZS5sb2coYCAg4oCiIOOCueOCv+ODg+OCr+WQjTogJHtzdGFja05hbWV9YCk7XG5cbi8vIE9wZW5TZWFyY2jjgrnjgr/jg4Pjgq/kvZzmiJBcbmNvbnN0IG9wZW5TZWFyY2hTdGFjayA9IG5ldyBTaW1wbGVPcGVuU2VhcmNoU3RhY2soYXBwLCBzdGFja05hbWUsIHtcbiAgZW52LFxuICBlbnZpcm9ubWVudCxcbiAgcHJvamVjdE5hbWUsXG4gIGRlc2NyaXB0aW9uOiBgU2ltcGxlIE9wZW5TZWFyY2ggY2x1c3RlciBmb3IgJHtwcm9qZWN0TmFtZX0gKCR7ZW52aXJvbm1lbnR9KWAsXG59KTtcblxuY29uc29sZS5sb2coJ+KchSDjgrfjg7Pjg5fjg6tPcGVuU2VhcmNo44K544K/44OD44Kv6Kit5a6a5a6M5LqGJyk7Il19