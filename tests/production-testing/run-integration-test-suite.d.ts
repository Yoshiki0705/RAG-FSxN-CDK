#!/usr/bin/env node
/**
 * 統合テストスイート実行スクリプト
 *
 * 全テストモジュールを統合して実行し、包括的なレポートを生成
 *
 * 使用方法:
 *   npm run test:integration
 *   node run-integration-test-suite.ts
 *   node run-integration-test-suite.ts --mode=parallel
 *   node run-integration-test-suite.ts --modules=auth,chatbot --format=html
 */
/**
 * メイン実行関数
 */
declare function main(): Promise<void>;
export { main };
