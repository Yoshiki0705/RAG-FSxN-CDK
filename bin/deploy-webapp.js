#!/usr/bin/env node
"use strict";
/**
 * WebAppStack統合デプロイエントリーポイント
 *
 * 用途:
 * - WebAppStackの標準デプロイ
 * - 環境変数による柔軟な設定
 * - MultiRegionConfigFactoryによる設定管理
 *
 * 使用方法:
 *   npx cdk deploy -a "npx ts-node bin/deploy-webapp.ts"
 *
 * 環境変数:
 *   PROJECT_NAME: プロジェクト名（デフォルト: permission-aware-rag）
 *   ENVIRONMENT: 環境名（デフォルト: prod）
 *   CDK_DEFAULT_REGION: リージョン（デフォルト: ap-northeast-1）
 *   CDK_DEFAULT_ACCOUNT: AWSアカウントID（必須）
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
const webapp_stack_1 = require("../lib/stacks/integrated/webapp-stack");
const tokyo_production_config_1 = require("../lib/config/environments/tokyo-production-config");
const app = new cdk.App();
// 環境設定
const projectName = process.env.PROJECT_NAME || 'permission-aware-rag';
const environment = process.env.ENVIRONMENT || 'prod';
const region = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;
if (!account) {
    console.error('❌ エラー: CDK_DEFAULT_ACCOUNT環境変数が設定されていません');
    console.error('');
    console.error('設定方法:');
    console.error('  export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)');
    process.exit(1);
}
console.log('🚀 WebAppStackデプロイ設定:');
console.log(`   プロジェクト名: ${projectName}`);
console.log(`   環境: ${environment}`);
console.log(`   リージョン: ${region}`);
console.log(`   アカウント: ${account}`);
// 設定読み込み
const config = tokyo_production_config_1.tokyoProductionConfig;
console.log('✅ 設定読み込み完了');
// スタック名生成
const stackName = `${config.naming.regionPrefix}-${projectName}-${environment}-WebApp`;
// WebAppStackのデプロイ
try {
    const webAppStack = new webapp_stack_1.WebAppStack(app, stackName, {
        env: {
            account,
            region,
        },
        config,
    });
    console.log(`✅ WebAppStack "${webAppStack.stackName}" を初期化しました`);
    // タグ設定
    cdk.Tags.of(app).add('Project', projectName);
    cdk.Tags.of(app).add('Environment', environment);
    cdk.Tags.of(app).add('ManagedBy', 'CDK');
    cdk.Tags.of(app).add('Region', region);
    app.synth();
}
catch (error) {
    console.error('❌ WebAppStack初期化エラー:', error);
    process.exit(1);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95LXdlYmFwcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRlcGxveS13ZWJhcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsd0VBQW9FO0FBQ3BFLGdHQUEyRjtBQUUzRixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixPQUFPO0FBQ1AsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksc0JBQXNCLENBQUM7QUFDdkUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDO0FBQ3RELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksZ0JBQWdCLENBQUM7QUFDbEUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQztBQUVoRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7SUFDMUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZCLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkZBQTJGLENBQUMsQ0FBQztJQUMzRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUM7QUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFFcEMsU0FBUztBQUNULE1BQU0sTUFBTSxHQUFHLCtDQUFxQixDQUFDO0FBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFMUIsVUFBVTtBQUNWLE1BQU0sU0FBUyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLElBQUksV0FBVyxJQUFJLFdBQVcsU0FBUyxDQUFDO0FBRXZGLG1CQUFtQjtBQUNuQixJQUFJLENBQUM7SUFDSCxNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtRQUNsRCxHQUFHLEVBQUU7WUFDSCxPQUFPO1lBQ1AsTUFBTTtTQUNQO1FBQ0QsTUFBTTtLQUNQLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLFdBQVcsQ0FBQyxTQUFTLFlBQVksQ0FBQyxDQUFDO0lBRWpFLE9BQU87SUFDUCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQzdDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDakQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN6QyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRXZDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO0lBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG4vKipcbiAqIFdlYkFwcFN0YWNr57Wx5ZCI44OH44OX44Ot44Kk44Ko44Oz44OI44Oq44O844Od44Kk44Oz44OIXG4gKiBcbiAqIOeUqOmAlDpcbiAqIC0gV2ViQXBwU3RhY2vjga7mqJnmupbjg4fjg5fjg63jgqRcbiAqIC0g55Kw5aKD5aSJ5pWw44Gr44KI44KL5p+U6Luf44Gq6Kit5a6aXG4gKiAtIE11bHRpUmVnaW9uQ29uZmlnRmFjdG9yeeOBq+OCiOOCi+ioreWumueuoeeQhlxuICogXG4gKiDkvb/nlKjmlrnms5U6XG4gKiAgIG5weCBjZGsgZGVwbG95IC1hIFwibnB4IHRzLW5vZGUgYmluL2RlcGxveS13ZWJhcHAudHNcIlxuICogXG4gKiDnkrDlooPlpInmlbA6XG4gKiAgIFBST0pFQ1RfTkFNRTog44OX44Ot44K444Kn44Kv44OI5ZCN77yI44OH44OV44Kp44Or44OIOiBwZXJtaXNzaW9uLWF3YXJlLXJhZ++8iVxuICogICBFTlZJUk9OTUVOVDog55Kw5aKD5ZCN77yI44OH44OV44Kp44Or44OIOiBwcm9k77yJXG4gKiAgIENES19ERUZBVUxUX1JFR0lPTjog44Oq44O844K444On44Oz77yI44OH44OV44Kp44Or44OIOiBhcC1ub3J0aGVhc3QtMe+8iVxuICogICBDREtfREVGQVVMVF9BQ0NPVU5UOiBBV1PjgqLjgqvjgqbjg7Pjg4hJRO+8iOW/hemgiO+8iVxuICovXG5cbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBXZWJBcHBTdGFjayB9IGZyb20gJy4uL2xpYi9zdGFja3MvaW50ZWdyYXRlZC93ZWJhcHAtc3RhY2snO1xuaW1wb3J0IHsgdG9reW9Qcm9kdWN0aW9uQ29uZmlnIH0gZnJvbSAnLi4vbGliL2NvbmZpZy9lbnZpcm9ubWVudHMvdG9reW8tcHJvZHVjdGlvbi1jb25maWcnO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG4vLyDnkrDlooPoqK3lrppcbmNvbnN0IHByb2plY3ROYW1lID0gcHJvY2Vzcy5lbnYuUFJPSkVDVF9OQU1FIHx8ICdwZXJtaXNzaW9uLWF3YXJlLXJhZyc7XG5jb25zdCBlbnZpcm9ubWVudCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UIHx8ICdwcm9kJztcbmNvbnN0IHJlZ2lvbiA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAnYXAtbm9ydGhlYXN0LTEnO1xuY29uc3QgYWNjb3VudCA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQ7XG5cbmlmICghYWNjb3VudCkge1xuICBjb25zb2xlLmVycm9yKCfinYwg44Ko44Op44O8OiBDREtfREVGQVVMVF9BQ0NPVU5U55Kw5aKD5aSJ5pWw44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gIGNvbnNvbGUuZXJyb3IoJycpO1xuICBjb25zb2xlLmVycm9yKCfoqK3lrprmlrnms5U6Jyk7XG4gIGNvbnNvbGUuZXJyb3IoJyAgZXhwb3J0IENES19ERUZBVUxUX0FDQ09VTlQ9JChhd3Mgc3RzIGdldC1jYWxsZXItaWRlbnRpdHkgLS1xdWVyeSBBY2NvdW50IC0tb3V0cHV0IHRleHQpJyk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxuY29uc29sZS5sb2coJ/CfmoAgV2ViQXBwU3RhY2vjg4fjg5fjg63jgqToqK3lrpo6Jyk7XG5jb25zb2xlLmxvZyhgICAg44OX44Ot44K444Kn44Kv44OI5ZCNOiAke3Byb2plY3ROYW1lfWApO1xuY29uc29sZS5sb2coYCAgIOeSsOWigzogJHtlbnZpcm9ubWVudH1gKTtcbmNvbnNvbGUubG9nKGAgICDjg6rjg7zjgrjjg6fjg7M6ICR7cmVnaW9ufWApO1xuY29uc29sZS5sb2coYCAgIOOCouOCq+OCpuODs+ODiDogJHthY2NvdW50fWApO1xuXG4vLyDoqK3lrproqq3jgb/ovrzjgb9cbmNvbnN0IGNvbmZpZyA9IHRva3lvUHJvZHVjdGlvbkNvbmZpZztcbmNvbnNvbGUubG9nKCfinIUg6Kit5a6a6Kqt44G/6L6844G/5a6M5LqGJyk7XG5cbi8vIOOCueOCv+ODg+OCr+WQjeeUn+aIkFxuY29uc3Qgc3RhY2tOYW1lID0gYCR7Y29uZmlnLm5hbWluZy5yZWdpb25QcmVmaXh9LSR7cHJvamVjdE5hbWV9LSR7ZW52aXJvbm1lbnR9LVdlYkFwcGA7XG5cbi8vIFdlYkFwcFN0YWNr44Gu44OH44OX44Ot44KkXG50cnkge1xuICBjb25zdCB3ZWJBcHBTdGFjayA9IG5ldyBXZWJBcHBTdGFjayhhcHAsIHN0YWNrTmFtZSwge1xuICAgIGVudjoge1xuICAgICAgYWNjb3VudCxcbiAgICAgIHJlZ2lvbixcbiAgICB9LFxuICAgIGNvbmZpZyxcbiAgfSk7XG5cbiAgY29uc29sZS5sb2coYOKchSBXZWJBcHBTdGFjayBcIiR7d2ViQXBwU3RhY2suc3RhY2tOYW1lfVwiIOOCkuWIneacn+WMluOBl+OBvuOBl+OBn2ApO1xuXG4gIC8vIOOCv+OCsOioreWumlxuICBjZGsuVGFncy5vZihhcHApLmFkZCgnUHJvamVjdCcsIHByb2plY3ROYW1lKTtcbiAgY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ0Vudmlyb25tZW50JywgZW52aXJvbm1lbnQpO1xuICBjZGsuVGFncy5vZihhcHApLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xuICBjZGsuVGFncy5vZihhcHApLmFkZCgnUmVnaW9uJywgcmVnaW9uKTtcblxuICBhcHAuc3ludGgoKTtcbn0gY2F0Y2ggKGVycm9yKSB7XG4gIGNvbnNvbGUuZXJyb3IoJ+KdjCBXZWJBcHBTdGFja+WIneacn+WMluOCqOODqeODvDonLCBlcnJvcik7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cbiJdfQ==