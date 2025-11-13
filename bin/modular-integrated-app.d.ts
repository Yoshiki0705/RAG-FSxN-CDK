#!/usr/bin/env node
/**
 * モジュラー統合アプリケーション エントリーポイント
 * Embedding Batch統合用の統一エントリーポイント
 *
 * 機能:
 * - Amazon Nova Pro統合によるコスト最適化（60-80%削減）
 * - 統一タグ戦略によるコスト配布管理
 * - 環境別設定の自動適用
 * - FSx for NetApp ONTAP統合
 * - SQLite負荷試験機能
 * - エラーハンドリングとログ出力
 *
 * 使用方法:
 *   export PROJECT_NAME=permission-aware-rag
 *   export ENVIRONMENT=dev
 *   export CDK_DEFAULT_ACCOUNT=123456789012
 *   export CDK_DEFAULT_REGION=ap-northeast-1
 *   npx cdk deploy
 *
 * 設定例:
 *   cdk.json の context セクションで詳細設定が可能
 */
import 'source-map-support/register';
