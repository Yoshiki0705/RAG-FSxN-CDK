#!/usr/bin/env node
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
import 'source-map-support/register';
