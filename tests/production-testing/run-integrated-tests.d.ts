#!/usr/bin/env node
/**
 * 統合テスト実行スクリプト
 * セキュリティ、パフォーマンス、機能テストの統合実行
 * 本番環境での包括的なシステム検証を実行
 */
declare function runIntegratedTests(): Promise<void>;
export { runIntegratedTests };
