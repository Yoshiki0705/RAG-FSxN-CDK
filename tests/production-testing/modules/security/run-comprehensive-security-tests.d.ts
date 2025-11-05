#!/usr/bin/env node
/**
 * 包括的セキュリティテスト実行スクリプト
 * エンドツーエンド暗号化テストと認証・認可テストを含む
 * 本番環境での包括的なセキュリティ検証を実行
 */
declare function runComprehensiveSecurityTests(): Promise<void>;
export { runComprehensiveSecurityTests };
