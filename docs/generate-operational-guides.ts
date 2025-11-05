#!/usr/bin/env ts-node

/**
 * 運用ガイド生成スクリプト
 * Permission-aware RAG System の包括的運用ガイドを生成
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

import * as fs from 'fs';
import * as path from 'path';
import { OperationalGuidesGenerator } from './generators/operational-guides-generator';

/**
 * 生成設定の型定義
 */
interface GenerationConfig {
  outputDirectory: string;
  fileMode: number;
  encoding: BufferEncoding;
  enableParallelProcessing: boolean;
  maxConcurrentWrites: number;
}

/**
 * 生成結果の型定義
 */
interface GenerationResult {
  filename: string;
  success: boolean;
  size: number;
  error?: Error;
}

/**
 * 生成サマリーの型定義
 */
interface GenerationSummary {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  totalSize: number;
  outputDirectory: string;
  results: GenerationResult[];
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: GenerationConfig = {
  outputDirectory: 'operations',
  fileMode: 0o644,
  encoding: 'utf-8',
  enableParallelProcessing: true,
  maxConcurrentWrites: 10
};

/**
 * パスの検証と解決（セキュリティ対策）
 */
function validateAndResolvePath(inputPath: string): string {
  // 入力値の基本検証
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('無効なパスが指定されました');
  }

  // 危険なパスパターンの検証
  const dangerousPatterns = [
    /\.\./,           // パストラバーサル
    /~/,              // ホームディレクトリ参照
    /\0/,             // ヌル文字
    /[<>:"|?*]/,      // 無効なファイル名文字
    /^\/+/,           // 絶対パス
    /\\+/             // バックスラッシュ
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(inputPath)) {
      throw new Error(`不正なパスパターンが検出されました: ${inputPath}`);
    }
  }

  // パスの正規化と解決
  const resolvedPath = path.resolve(__dirname, inputPath);
  const projectRoot = path.resolve(__dirname, '..');

  // プロジェクトルート外へのアクセスを防ぐ
  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error(`プロジェクトディレクトリ外へのアクセスは禁止されています: ${resolvedPath}`);
  }

  return resolvedPath;
}

/**
 * ディレクトリの安全な作成
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true, mode: 0o755 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`ディレクトリ作成に失敗しました: ${dirPath} - ${errorMessage}`);
  }
}

/**
 * ガイドの並列書き込み（パフォーマンス最適化）
 */
async function writeGuidesParallel(
  guides: Record<string, string>, 
  outputDir: string, 
  config: GenerationConfig
): Promise<GenerationResult[]> {
  const writePromises = Object.entries(guides).map(async ([filename, content]) => {
    const filePath = path.join(outputDir, `${filename}.md`);
    
    try {
      await fs.promises.writeFile(filePath, content, { 
        encoding: config.encoding, 
        mode: config.fileMode 
      });
      
      const stats = await fs.promises.stat(filePath);
      console.log(`✅ 生成完了: ${filename}.md (${Math.round(stats.size / 1024)} KB)`);
      
      return {
        filename: `${filename}.md`,
        success: true,
        size: stats.size
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ 生成失敗: ${filename}.md`, err.message);
      
      return {
        filename: `${filename}.md`,
        success: false,
        size: 0,
        error: err
      };
    }
  });
  
  const results = await Promise.allSettled(writePromises);
  
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        filename: 'unknown',
        success: false,
        size: 0,
        error: new Error(result.reason)
      };
    }
  });
}

/**
 * 目次ファイルの生成
 */
async function generateIndexFile(
  generator: OperationalGuidesGenerator, 
  outputDir: string, 
  config: GenerationConfig
): Promise<GenerationResult> {
  try {
    const indexContent = generator.generateOperationalGuideIndex();
    const indexPath = path.join(outputDir, 'README.md');
    
    await fs.promises.writeFile(indexPath, indexContent, { 
      encoding: config.encoding, 
      mode: config.fileMode 
    });
    
    const stats = await fs.promises.stat(indexPath);
    console.log(`✅ 目次生成完了: README.md (${Math.round(stats.size / 1024)} KB)`);
    
    return {
      filename: 'README.md',
      success: true,
      size: stats.size
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ 目次生成失敗:', err.message);
    
    return {
      filename: 'README.md',
      success: false,
      size: 0,
      error: err
    };
  }
}

/**
 * 生成サマリーの表示
 */
function displayGenerationSummary(summary: GenerationSummary): void {
  console.log('\n📊 運用ガイド生成サマリー:');
  console.log(`   出力ディレクトリ: ${summary.outputDirectory}`);
  console.log(`   総ファイル数: ${summary.totalFiles}`);
  console.log(`   成功: ${summary.successCount} / 失敗: ${summary.failureCount}`);
  console.log(`   総サイズ: ${Math.round(summary.totalSize / 1024)} KB`);
  
  if (summary.successCount > 0) {
    console.log('\n✅ 生成成功ファイル:');
    summary.results
      .filter(result => result.success)
      .forEach(result => {
        console.log(`     - ${result.filename}`);
      });
  }
  
  if (summary.failureCount > 0) {
    console.log('\n❌ 生成失敗ファイル:');
    summary.results
      .filter(result => !result.success)
      .forEach(result => {
        console.log(`     - ${result.filename}: ${result.error?.message || '不明なエラー'}`);
      });
  }
  
  console.log('\n🎯 使用方法:');
  console.log('   1. docs/operations/ ディレクトリを確認');
  console.log('   2. README.md から必要なガイドを選択');
  console.log('   3. 各ガイドの手順に従って運用を実施');
  console.log('   4. 定期的にガイドを見直し・更新');
}

/**
 * エラーハンドリング
 */
function handleGenerationError(error: unknown): void {
  console.error('\n❌ 運用ガイド生成エラー:');
  
  if (error instanceof Error) {
    console.error(`エラーメッセージ: ${error.message}`);
    if (error.stack) {
      console.error(`スタックトレース: ${error.stack}`);
    }
  } else {
    console.error('予期しないエラー:', error);
  }
  
  console.error('\n🔧 トラブルシューティング:');
  console.error('   1. 出力ディレクトリの権限を確認');
  console.error('   2. ディスク容量を確認');
  console.error('   3. OperationalGuidesGenerator の実装を確認');
}

/**
 * メイン処理
 */
async function generateOperationalGuides(): Promise<void> {
  console.log('🚀 運用ガイド生成開始...');
  
  const startTime = Date.now();
  
  try {
    // 設定の読み込み
    const config = { ...DEFAULT_CONFIG };
    
    // ジェネレーターの初期化
    const generator = new OperationalGuidesGenerator();
    
    // 出力ディレクトリの検証と作成
    const outputDir = validateAndResolvePath(config.outputDirectory);
    await ensureDirectoryExists(outputDir);
    
    console.log(`📁 出力ディレクトリ: ${outputDir}`);
    
    // 全運用ガイド生成
    console.log('📖 運用ガイド生成中...');
    const guides = generator.generateAllOperationalGuides();
    
    // ガイドファイルの並列書き込み
    const guideResults = await writeGuidesParallel(guides, outputDir, config);
    
    // 目次ファイルの生成
    const indexResult = await generateIndexFile(generator, outputDir, config);
    
    // 結果の集計
    const allResults = [...guideResults, indexResult];
    const summary: GenerationSummary = {
      totalFiles: allResults.length,
      successCount: allResults.filter(r => r.success).length,
      failureCount: allResults.filter(r => !r.success).length,
      totalSize: allResults.reduce((sum, r) => sum + r.size, 0),
      outputDirectory: outputDir,
      results: allResults
    };
    
    // サマリー表示
    displayGenerationSummary(summary);
    
    const duration = Date.now() - startTime;
    console.log(`\n⏱️ 実行時間: ${duration}ms`);
    
    if (summary.failureCount > 0) {
      console.log('\n⚠️ 一部のファイル生成に失敗しましたが、処理を継続しました');
    } else {
      console.log('\n✅ 運用ガイド生成完了！');
    }
    
  } catch (error) {
    handleGenerationError(error);
    throw error; // 再スロー
  }
}

// メイン実行
if (require.main === module) {
  generateOperationalGuides().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { generateOperationalGuides };