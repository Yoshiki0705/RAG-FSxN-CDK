#!/usr/bin/env ts-node
/**
 * UI/UXテスト実行スクリプト
 *
 * Kiro MCP Chrome DevToolsを使用した実ブラウザでのUI/UXテストを実行
 * コマンドライン引数で環境とテストタイプを指定可能
 *
 * 使用例:
 * npm run test:production:ui-ux
 * npm run test:production:ui-ux:staging
 * ts-node run-ui-ux-tests.ts --env production --type all
 * ts-node run-ui-ux-tests.ts --env staging --type responsive
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * メイン実行関数
 */
declare function main(): Promise<void>;
export { main as runUIUXTests };
