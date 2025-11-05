#!/usr/bin/env node
/**
 * アクセス権限テスト実行スクリプト
 *
 * 実本番IAM/OpenSearchでのアクセス権限テストを実行
 * コマンドライン引数でテスト設定をカスタマイズ可能
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
/**
 * コマンドライン引数の定義
 */
interface CommandOptions {
    config?: string;
    environment?: string;
    output?: string;
    verbose?: boolean;
    dryRun?: boolean;
    testIds?: string;
    timeout?: number;
    retries?: number;
}
/**
 * アクセス権限テスト実行クラス
 */
declare class AccessControlTestExecutor {
    private options;
    private config;
    private testEngine;
    private testRunner;
    constructor(options: CommandOptions);
    /**
     * 初期化
     */
    initialize(): Promise<void>;
    /**
     * 設定の読み込み
     */
    private loadConfiguration;
    /**
     * アクセス権限テストの実行
     */
    executeTests(): Promise<void>;
    /**
     * ドライランの実行
     */
    private performDryRun;
    /**
     * レポートの生成と保存
     */
    private generateAndSaveReport;
    /**
     * クリーンアップ
     */
    cleanup(): Promise<void>;
}
export default AccessControlTestExecutor;
