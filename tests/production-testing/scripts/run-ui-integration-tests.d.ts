#!/usr/bin/env ts-node
/**
 * UI統合テスト実行スクリプト
 * 全UIテストの実行とレポート生成
 */
/**
 * メイン実行関数（保守性向上）
 */
declare function main(): Promise<void>;
export { main as runUIIntegrationTests };
