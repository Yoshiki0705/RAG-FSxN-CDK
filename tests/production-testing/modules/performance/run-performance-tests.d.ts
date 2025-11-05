#!/usr/bin/env ts-node
/**
 * パフォーマンステスト実行スクリプト
 *
 * 実本番環境でのシステムパフォーマンステストを実行
 * コマンドライン引数で環境とテストタイプを指定可能
 *
 * 使用例:
 * npm run test:performance:production
 * npm run test:performance:staging
 * ts-node run-performance-tests.ts --env production --type all
 * ts-node run-performance-tests.ts --env staging --type concurrent
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * メイン実行関数
 */
declare function main(): Promise<void>;
export { main as runPerformanceTests };
