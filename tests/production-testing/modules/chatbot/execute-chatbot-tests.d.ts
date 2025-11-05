#!/usr/bin/env node
/**
 * チャットボット機能テスト実行スクリプト
 *
 * 実本番Amazon Bedrockでのチャットボット機能テストを実行
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
    model?: string;
    skipStreaming?: boolean;
    skipComplex?: boolean;
}
/**
 * チャットボットテスト実行クラス
 */
declare class ChatbotTestExecutor {
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
     * チャットボット機能テストの実行
     */
    executeTests(): Promise<void>;
    /**
     * ドライランの実行
     */
    private performDryRun;
    /**
     * 品質評価の表示
     */
    private displayQualityAssessment;
    /**
     * レポートの生成と保存
     */
    private generateAndSaveReport;
    /**
     * クリーンアップ
     */
    cleanup(): Promise<void>;
}
export default ChatbotTestExecutor;
