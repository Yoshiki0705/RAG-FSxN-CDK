#!/usr/bin/env node

/**
 * ドキュメント生成実行スクリプト
 * 全ドキュメントの自動生成を実行
 */

import { DocumentationConfig } from './generators/documentation-generator';
import { DocumentationGeneratorPart2 } from './generators/documentation-generator-part2';
import { OperationalGuidesGenerator } from './generators/operational-guides-generator';

/**
 * 設定検証結果の型定義
 */
interface ValidationResult {
  isValid: boolean;
  validatedPath: string;
  warnings: string[];
}

/**
 * 出力ディレクトリのパス検証（セキュリティ対策強化版）
 */
function validateOutputDirectory(outputDir: string): string {
  // パストラバーサル攻撃を防ぐ
  if (outputDir.includes('..') || outputDir.includes('~')) {
    throw new Error('不正なパスが検出されました');
  }
  
  // プロジェクトルート外へのアクセスを防ぐ
  const path = require('path');
  const resolvedPath = path.resolve(outputDir);
  const projectRoot = process.cwd();
  
  if (!resolvedPath.startsWith(projectRoot)) {
    console.warn('⚠️ プロジェクト外のパスが指定されました。デフォルトパスを使用します。');
    return './generated-docs';
  }
  
  return outputDir;
}

async function generateDocumentation() {
  console.log('📚 ドキュメント生成を開始します...');
  console.log('=====================================');
  console.log('');

  try {
    // 設定の読み込みと検証
    const rawOutputDir = process.env.OUTPUT_DIR || './generated-docs';
    const validatedOutputDir = validateOutputDirectory(rawOutputDir);

    const config: DocumentationConfig = {
      projectName: process.env.PROJECT_NAME || 'Permission-aware RAG System',
      version: process.env.PROJECT_VERSION || '1.0.0',
      outputDirectory: validatedOutputDir,
      generateApiDocs: process.env.GENERATE_API_DOCS !== 'false',
      generateArchitectureDiagrams: process.env.GENERATE_ARCHITECTURE !== 'false',
      generateTestReports: process.env.GENERATE_TEST_REPORTS !== 'false',
      generateOperationalGuides: process.env.GENERATE_OPERATIONAL_GUIDES !== 'false',
      includeCodeExamples: process.env.INCLUDE_CODE_EXAMPLES !== 'false',
      includeScreenshots: process.env.INCLUDE_SCREENSHOTS === 'true',
      formats: (process.env.OUTPUT_FORMATS?.split(',') as ('markdown' | 'html' | 'pdf')[]) || ['markdown', 'html']
    };

    console.log('🔧 設定情報:');
    console.log(`   プロジェクト: ${config.projectName}`);
    console.log(`   バージョン: ${config.version}`);
    console.log(`   出力ディレクトリ: ${config.outputDirectory}`);
    console.log(`   生成形式: ${config.formats.join(', ')}`);
    console.log('');

    // ドキュメント生成器の初期化
    const generator = new DocumentationGeneratorPart2(config);
    const operationalGenerator = new OperationalGuidesGenerator();

    // 出力ディレクトリの準備
    await ensureOutputDirectory(config.outputDirectory);

    // 全ドキュメントの生成
    await generator.generateAllDocumentation();

    // 運用ガイドの追加生成（並列実行で高速化）
    console.log('📖 追加運用ガイドを生成中...');
    
    const operationalTasks = [
      {
        name: 'トラブルシューティングガイド',
        task: async () => {
          const content = operationalGenerator.generateTroubleshootingGuide();
          await writeFile(config.outputDirectory, 'operations/troubleshooting.md', content);
        }
      },
      {
        name: '運用チェックリスト',
        task: async () => {
          const content = operationalGenerator.generateOperationalChecklist();
          await writeFile(config.outputDirectory, 'operations/checklist.md', content);
        }
      },
      {
        name: '監視ガイド',
        task: async () => {
          const content = operationalGenerator.generateMonitoringGuide();
          await writeFile(config.outputDirectory, 'operations/monitoring.md', content);
        }
      }
    ];

    // 並列実行でパフォーマンス向上
    const results = await Promise.allSettled(
      operationalTasks.map(({ task }) => task())
    );

    // 結果の確認とログ出力
    results.forEach((result, index) => {
      const taskName = operationalTasks[index].name;
      if (result.status === 'fulfilled') {
        console.log(`   ✅ ${taskName}生成完了`);
      } else {
        console.error(`   ❌ ${taskName}生成失敗:`, result.reason);
        throw new Error(`${taskName}の生成に失敗しました`);
      }
    });

    console.log('');
    console.log('🎉 ドキュメント生成が完了しました！');
    console.log('=====================================');
    console.log('');
    console.log('📁 生成されたドキュメント:');
    console.log(`   📋 メインドキュメント: ${config.outputDirectory}/README.md`);
    console.log(`   🔗 API ドキュメント: ${config.outputDirectory}/api/`);
    console.log(`   🏗️ アーキテクチャ: ${config.outputDirectory}/architecture/`);
    console.log(`   📊 テストレポート: ${config.outputDirectory}/tests/`);
    console.log(`   📖 運用ガイド: ${config.outputDirectory}/operations/`);
    console.log('');

    // 生成統計の表示
    await displayGenerationStats(config.outputDirectory);

  } catch (error) {
    console.error('');
    console.error('❌ ドキュメント生成エラー:');
    
    if (error instanceof Error) {
      console.error(`エラーメッセージ: ${error.message}`);
      console.error(`エラータイプ: ${error.constructor.name}`);
      
      if (error.stack) {
        console.error(`スタックトレース: ${error.stack}`);
      }
      
      // 一般的なエラーパターンに対する解決策を提示
      if (error.message.includes('ENOENT')) {
        console.error('💡 解決策: ファイルまたはディレクトリが存在しません。パスを確認してください。');
      } else if (error.message.includes('EACCES')) {
        console.error('💡 解決策: ファイルアクセス権限を確認してください。');
      } else if (error.message.includes('不正なパス')) {
        console.error('💡 解決策: 出力ディレクトリのパスを確認してください。');
      }
    } else {
      console.error('予期しないエラー:', error);
    }
    
    console.error('');
    console.error('🔧 トラブルシューティング:');
    console.error('   1. 出力ディレクトリの権限を確認');
    console.error('   2. 依存関係が正しくインストールされているか確認');
    console.error('   3. 環境変数の設定を確認');
    console.error('');
    
    process.exit(1);
  }
}

/**
 * 出力ディレクトリの確保
 */
async function ensureOutputDirectory(outputDir: string): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  
  const fullPath = path.resolve(outputDir);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 出力ディレクトリを作成しました: ${fullPath}`);
  }

  // サブディレクトリの作成
  const subdirs = ['api', 'architecture', 'tests', 'operations', 'assets'];
  for (const subdir of subdirs) {
    const subdirPath = path.join(fullPath, subdir);
    if (!fs.existsSync(subdirPath)) {
      fs.mkdirSync(subdirPath, { recursive: true });
    }
  }
}

/**
 * ファイル書き込み（メモリ効率最適化版）
 */
async function writeFile(baseDir: string, relativePath: string, content: string): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const fullPath = path.join(baseDir, relativePath);
    const dir = path.dirname(fullPath);
    
    // ディレクトリの存在確認と作成
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
    
    // 大きなファイルの場合はストリーム書き込みを使用
    if (content.length > 1024 * 1024) { // 1MB以上
      const writeStream = fs.createWriteStream(fullPath, { encoding: 'utf8' });
      writeStream.write(content);
      writeStream.end();
      
      return new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else {
      // 小さなファイルは同期書き込み
      fs.writeFileSync(fullPath, content, { encoding: 'utf8', mode: 0o644 });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`ファイル書き込みエラー (${relativePath}): ${errorMessage}`);
  }
}

/**
 * 生成統計の表示
 */
async function displayGenerationStats(outputDir: string): Promise<void> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      filesByType: {} as Record<string, number>
    };

    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          stats.totalFiles++;
          stats.totalSize += stat.size;
          
          const ext = path.extname(file).toLowerCase();
          stats.filesByType[ext] = (stats.filesByType[ext] || 0) + 1;
        }
      });
    };

    walkDir(outputDir);

    console.log('📊 生成統計:');
    console.log(`   📄 総ファイル数: ${stats.totalFiles}`);
    console.log(`   💾 総サイズ: ${(stats.totalSize / 1024).toFixed(1)} KB`);
    console.log('');
    console.log('   📋 ファイル種別:');
    Object.entries(stats.filesByType).forEach(([ext, count]) => {
      console.log(`     ${ext || '(拡張子なし)'}: ${count}ファイル`);
    });
    console.log('');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ 統計情報の取得に失敗しました:', errorMessage);
  }
}

/**
 * メイン実行
 */
if (require.main === module) {
  generateDocumentation().catch((error) => {
    console.error('❌ 予期しないエラーが発生しました:', error);
    process.exit(1);
  });
}

export { generateDocumentation };