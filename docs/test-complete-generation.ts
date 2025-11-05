#!/usr/bin/env node

/**
 * 完全なドキュメント生成システムのテスト
 * 全ての生成器を統合してテスト実行
 */

import { generateDocumentation } from './generate-documentation';

async function testCompleteGeneration() {
  console.log('🧪 完全なドキュメント生成システムのテストを開始します...');
  console.log('=======================================================');
  console.log('');

  try {
    // 環境変数の設定
    process.env.PROJECT_NAME = 'Permission-aware RAG System';
    process.env.PROJECT_VERSION = '1.0.0';
    process.env.OUTPUT_DIR = './test-generated-docs';

    console.log('🔧 テスト設定:');
    console.log(`   プロジェクト名: ${process.env.PROJECT_NAME}`);
    console.log(`   バージョン: ${process.env.PROJECT_VERSION}`);
    console.log(`   出力ディレクトリ: ${process.env.OUTPUT_DIR}`);
    console.log('');

    // ドキュメント生成の実行
    console.log('📚 ドキュメント生成を実行中...');
    await generateDocumentation();

    console.log('');
    console.log('✅ テスト完了！');
    console.log('');
    console.log('📋 生成されたドキュメントを確認してください:');
    console.log('   - API ドキュメント');
    console.log('   - アーキテクチャ図');
    console.log('   - テストレポート');
    console.log('   - 運用ガイド（トラブルシューティング、チェックリスト、監視）');
    console.log('');
    console.log('🎯 次のステップ:');
    console.log('   1. 生成されたドキュメントの内容確認');
    console.log('   2. 必要に応じて手動調整');
    console.log('   3. 本番環境での実行');

  } catch (error) {
    console.error('');
    console.error('❌ テスト失敗:');
    console.error(error);
    console.error('');
    
    if (error instanceof Error) {
      console.error('エラー詳細:');
      console.error(`  メッセージ: ${error.message}`);
      if (error.stack) {
        console.error(`  スタックトレース: ${error.stack}`);
      }
    }
    
    process.exit(1);
  }
}

// テストの実行
if (require.main === module) {
  testCompleteGeneration().catch(error => {
    console.error('予期しないエラーが発生しました:', error);
    process.exit(1);
  });
}

export { testCompleteGeneration };