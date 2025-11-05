#!/usr/bin/env ts-node
/**
 * セキュリティテスト実行スクリプト
 *
 * 実本番環境でのセキュリティテストを実行
 * HTTPS暗号化、攻撃耐性、セキュリティ監視のテストを包括的に実行
 *
 * 使用例:
 * npm run test:production:security
 * ts-node run-security-tests.ts --env production
 * ts-node run-security-tests.ts --env staging --verbose
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * メイン実行関数
 */
declare function main(): Promise<void>;
export { main as runSecurityTests };
