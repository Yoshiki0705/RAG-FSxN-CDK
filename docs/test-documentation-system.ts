#!/usr/bin/env node

/**
 * ドキュメント生成システムのテストスクリプト
 */

import { DocumentationConfig } from './generators/documentation-generator';
import { DocumentationGeneratorPart2 } from './generators/documentation-generator-part2';
import { OperationalGuidesGenerator } from './generators/operational-guides-generator';

async function testDocumentationSystem() {
  console.log('🧪 ドキュメント生成システムのテストを開始します...');
  console.log('================================================');
  console.log('');

  try {
    // テスト用設定
    const config: DocumentationConfig = {
      projectName: 'RAG System Test',
      version: '1.0.0-test',
      outputDirectory: './test-docs',
      generateApiDocs: true,
      generateArchitectureDiagrams: true,
      generateTestReports: true,
      generateOperationalGuides: true,
      includeCodeExamples: true,
      includeScreenshots: false,
      formats: ['markdown']
    };

    console.log('📋 テスト設定:');
    console.log(`   プロジェクト: ${config.projectName}`);
    console.log(`   出力ディレクトリ: ${config.outputDirectory}`);
    console.log('');

    // 1. ドキュメント生成器のインスタンス化テスト
    console.log('1️⃣ ドキュメント生成器のインスタンス化テスト...');
    const generator = new DocumentationGeneratorPart2(config);
    const operationalGenerator = new OperationalGuidesGenerator();
    console.log('   ✅ インスタンス化成功');

    // 2. 運用ガイド生成テスト
    console.log('2️⃣ 運用ガイド生成テスト...');
    const troubleshootingGuide = operationalGenerator.generateTroubleshootingGuide();
    const operationalChecklist = operationalGenerator.generateOperationalChecklist();
    const monitoringGuide = operationalGenerator.generateMonitoringGuide();
    
    console.log(`   📖 トラブルシューティングガイド: ${troubleshootingGuide.length} 文字`);
    console.log(`   📋 運用チェックリスト: ${operationalChecklist.length} 文字`);
    console.log(`   📊 監視ガイド: ${monitoringGuide.length} 文字`);
    console.log('   ✅ 運用ガイド生成成功');

    // 3. 基本ドキュメント生成テスト
    console.log('3️⃣ 基本ドキュメント生成テスト...');
    const readmeContent = generator.generateMainReadme();
    
    console.log(`   📄 README: ${readmeContent.length} 文字`);
    console.log('   ✅ 基本ドキュメント生成成功');

    console.log('');
    console.log('🎉 全テストが正常に完了しました！');
    console.log('================================================');
    console.log('');
    console.log('📊 テスト結果サマリー:');
    console.log('   ✅ インスタンス化: 成功');
    console.log('   ✅ 運用ガイド生成: 成功');
    console.log('   ✅ 基本ドキュメント生成: 成功');
    console.log('');
    console.log('💡 次のステップ:');
    console.log('   npm run docs:generate でフルドキュメント生成を実行');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ テスト実行エラー:');
    console.error(error);
    console.error('');
    console.error('🔍 デバッグ情報:');
    console.error(`   エラータイプ: ${error.constructor.name}`);
    console.error(`   エラーメッセージ: ${error.message}`);
    if (error.stack) {
      console.error(`   スタックトレース: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
    console.error('');
    process.exit(1);
  }
}

/**
 * メイン実行
 */
if (require.main === module) {
  testDocumentationSystem();
}

export { testDocumentationSystem };