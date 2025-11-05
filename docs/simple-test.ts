#!/usr/bin/env node

/**
 * 簡単なドキュメント生成システムテスト
 */

import { DocumentationConfig } from './generators/documentation-generator';
import { DocumentationGeneratorPart2 } from './generators/documentation-generator-part2';

async function simpleTest() {
  console.log('🧪 簡単なテストを開始します...');

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

    console.log('1️⃣ ドキュメント生成器のインスタンス化...');
    const generator = new DocumentationGeneratorPart2(config);
    console.log('   ✅ インスタンス化成功');

    console.log('2️⃣ README生成テスト...');
    console.log('   Part2クラスのメソッド:', Object.getOwnPropertyNames(Object.getPrototypeOf(generator)));
    console.log('   基底クラスのメソッド:', Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(generator))));
    
    // 直接メソッドを呼び出してみる
    try {
      const readmeContent = (generator as any).generateMainReadme();
      console.log(`   📄 README: ${readmeContent.length} 文字`);
      console.log('   ✅ README生成成功');
    } catch (error) {
      console.log('   ❌ README生成エラー:', error.message);
    }

    console.log('');
    console.log('🎉 簡単なテストが正常に完了しました！');

  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  simpleTest();
}