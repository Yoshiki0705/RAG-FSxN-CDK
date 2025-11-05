#!/usr/bin/env node

/**
 * 完全ドキュメント生成システム v2.0 テストスクリプト
 * TypeScriptファイルをJavaScriptで簡単にテスト実行
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 完全ドキュメント生成システム v2.0 テスト開始');
console.log('');

// 環境変数の設定
process.env.PROJECT_NAME = 'Permission-aware RAG System';
process.env.PROJECT_VERSION = '2.0.0';
process.env.OUTPUT_DIR = './test-generated-docs-v2';
process.env.GENERATE_API_DOCS = 'true';
process.env.GENERATE_ARCH_DIAGRAMS = 'true';
process.env.GENERATE_TEST_REPORTS = 'true';
process.env.GENERATE_OPS_GUIDES = 'true';
process.env.INCLUDE_CODE_EXAMPLES = 'true';
process.env.INCLUDE_SCREENSHOTS = 'false';
process.env.OUTPUT_FORMATS = 'markdown';
process.env.LANGUAGES = 'ja';

console.log('📋 テスト設定:');
console.log(`   プロジェクト名: ${process.env.PROJECT_NAME}`);
console.log(`   バージョン: ${process.env.PROJECT_VERSION}`);
console.log(`   出力ディレクトリ: ${process.env.OUTPUT_DIR}`);
console.log(`   言語: ${process.env.LANGUAGES}`);
console.log(`   形式: ${process.env.OUTPUT_FORMATS}`);
console.log('');

try {
    // 既存のテスト出力ディレクトリを削除
    if (fs.existsSync(process.env.OUTPUT_DIR)) {
        console.log('🧹 既存のテスト出力をクリーンアップ中...');
        fs.rmSync(process.env.OUTPUT_DIR, { recursive: true, force: true });
        console.log('   ✅ クリーンアップ完了');
    }

    console.log('');
    console.log('🚀 TypeScriptファイルをコンパイル・実行中...');
    
    // TypeScriptファイルを直接実行
    const tsFilePath = path.join(__dirname, 'generators', 'complete-documentation-generator-v2.ts');
    
    console.log(`   実行ファイル: ${tsFilePath}`);
    console.log('');
    
    // ts-nodeで実行
    execSync(`npx ts-node "${tsFilePath}"`, { 
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    console.log('');
    console.log('✅ テスト実行完了');
    
    // 生成結果の確認
    if (fs.existsSync(process.env.OUTPUT_DIR)) {
        console.log('');
        console.log('📁 生成されたファイル:');
        
        const files = [];
        function findFiles(dir, prefix = '') {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const relativePath = prefix + item;
                
                if (fs.statSync(fullPath).isDirectory()) {
                    findFiles(fullPath, relativePath + '/');
                } else {
                    files.push(relativePath);
                }
            });
        }
        
        findFiles(process.env.OUTPUT_DIR);
        files.sort().forEach(file => {
            console.log(`   ${file}`);
        });
        
        // 生成レポートの表示
        const reportPath = path.join(process.env.OUTPUT_DIR, 'generation-report.json');
        if (fs.existsSync(reportPath)) {
            console.log('');
            console.log('📊 生成レポート:');
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            console.log(`   プロジェクト: ${report.projectName}`);
            console.log(`   バージョン: ${report.version}`);
            console.log(`   実行時間: ${report.duration}ms`);
            console.log(`   対応言語: ${report.languages.join(', ')}`);
            console.log(`   出力形式: ${report.formats.join(', ')}`);
        }
        
        console.log('');
        console.log('🎯 テスト結果確認:');
        console.log(`   メインREADME: ${path.resolve(process.env.OUTPUT_DIR, 'README.md')}`);
        console.log(`   日本語API: ${path.resolve(process.env.OUTPUT_DIR, 'ja', 'api', 'README.md')}`);
        console.log(`   アーキテクチャ: ${path.resolve(process.env.OUTPUT_DIR, 'ja', 'architecture', 'README.md')}`);
        console.log('');
        
    } else {
        console.log('❌ 出力ディレクトリが作成されませんでした');
        process.exit(1);
    }
    
} catch (error) {
    console.error('');
    console.error('❌ テスト実行エラー:', error.message);
    console.error('');
    console.error('🔧 トラブルシューティング:');
    console.error('   1. TypeScriptの依存関係を確認: npm install typescript ts-node');
    console.error('   2. Node.jsバージョンを確認: node --version');
    console.error('   3. ファイルパスを確認');
    console.error('');
    process.exit(1);
}

console.log('🎉 テスト完了');
console.log('');