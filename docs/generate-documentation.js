#!/usr/bin/env node
"use strict";
/**
 * ドキュメント生成実行スクリプト
 * 全ドキュメントの自動生成を実行
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocumentation = generateDocumentation;
const documentation_generator_part2_1 = require("./generators/documentation-generator-part2");
const operational_guides_generator_1 = require("./generators/operational-guides-generator");
/**
 * 出力ディレクトリのパス検証（セキュリティ対策強化版）
 */
function validateOutputDirectory(outputDir) {
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
        const config = {
            projectName: process.env.PROJECT_NAME || 'Permission-aware RAG System',
            version: process.env.PROJECT_VERSION || '1.0.0',
            outputDirectory: validatedOutputDir,
            generateApiDocs: process.env.GENERATE_API_DOCS !== 'false',
            generateArchitectureDiagrams: process.env.GENERATE_ARCHITECTURE !== 'false',
            generateTestReports: process.env.GENERATE_TEST_REPORTS !== 'false',
            generateOperationalGuides: process.env.GENERATE_OPERATIONAL_GUIDES !== 'false',
            includeCodeExamples: process.env.INCLUDE_CODE_EXAMPLES !== 'false',
            includeScreenshots: process.env.INCLUDE_SCREENSHOTS === 'true',
            formats: process.env.OUTPUT_FORMATS?.split(',') || ['markdown', 'html']
        };
        console.log('🔧 設定情報:');
        console.log(`   プロジェクト: ${config.projectName}`);
        console.log(`   バージョン: ${config.version}`);
        console.log(`   出力ディレクトリ: ${config.outputDirectory}`);
        console.log(`   生成形式: ${config.formats.join(', ')}`);
        console.log('');
        // ドキュメント生成器の初期化
        const generator = new documentation_generator_part2_1.DocumentationGeneratorPart2(config);
        const operationalGenerator = new operational_guides_generator_1.OperationalGuidesGenerator();
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
        const results = await Promise.allSettled(operationalTasks.map(({ task }) => task()));
        // 結果の確認とログ出力
        results.forEach((result, index) => {
            const taskName = operationalTasks[index].name;
            if (result.status === 'fulfilled') {
                console.log(`   ✅ ${taskName}生成完了`);
            }
            else {
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
    }
    catch (error) {
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
            }
            else if (error.message.includes('EACCES')) {
                console.error('💡 解決策: ファイルアクセス権限を確認してください。');
            }
            else if (error.message.includes('不正なパス')) {
                console.error('💡 解決策: 出力ディレクトリのパスを確認してください。');
            }
        }
        else {
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
async function ensureOutputDirectory(outputDir) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
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
async function writeFile(baseDir, relativePath, content) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
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
        }
        else {
            // 小さなファイルは同期書き込み
            fs.writeFileSync(fullPath, content, { encoding: 'utf8', mode: 0o644 });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`ファイル書き込みエラー (${relativePath}): ${errorMessage}`);
    }
}
/**
 * 生成統計の表示
 */
async function displayGenerationStats(outputDir) {
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            filesByType: {}
        };
        const walkDir = (dir) => {
            if (!fs.existsSync(dir))
                return;
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    walkDir(filePath);
                }
                else {
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
    }
    catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtZG9jdW1lbnRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdlbmVyYXRlLWRvY3VtZW50YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7O0dBR0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzU00sc0RBQXFCO0FBblM5Qiw4RkFBeUY7QUFDekYsNEZBQXVGO0FBV3ZGOztHQUVHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FBQyxTQUFpQjtJQUNoRCxnQkFBZ0I7SUFDaEIsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN4RCxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxzQkFBc0I7SUFDdEIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzdCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDN0MsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRWxDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7UUFDMUMsT0FBTyxDQUFDLElBQUksQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBQ3JELE9BQU8sa0JBQWtCLENBQUM7SUFDNUIsQ0FBQztJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRCxLQUFLLFVBQVUscUJBQXFCO0lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7SUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVoQixJQUFJLENBQUM7UUFDSCxhQUFhO1FBQ2Is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QUFDLENBQUM7UUFDM0MsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICog44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ5a6f6KGM44K544Kv44Oq44OX44OIXG4gKiDlhajjg4njgq3jg6Xjg6Hjg7Pjg4jjga7oh6rli5XnlJ/miJDjgpLlrp/ooYxcbiAqL1xuXG5pbXBvcnQgeyBEb2N1bWVudGF0aW9uQ29uZmlnIH0gZnJvbSAnLi9nZW5lcmF0b3JzL2RvY3VtZW50YXRpb24tZ2VuZXJhdG9yJztcbmltcG9ydCB7IERvY3VtZW50YXRpb25HZW5lcmF0b3JQYXJ0MiB9IGZyb20gJy4vZ2VuZXJhdG9ycy9kb2N1bWVudGF0aW9uLWdlbmVyYXRvci1wYXJ0Mic7XG5pbXBvcnQgeyBPcGVyYXRpb25hbEd1aWRlc0dlbmVyYXRvciB9IGZyb20gJy4vZ2VuZXJhdG9ycy9vcGVyYXRpb25hbC1ndWlkZXMtZ2VuZXJhdG9yJztcblxuLyoqXG4gKiDoqK3lrprmpJzoqLzntZDmnpzjga7lnovlrprnvqlcbiAqL1xuaW50ZXJmYWNlIFZhbGlkYXRpb25SZXN1bHQge1xuICBpc1ZhbGlkOiBib29sZWFuO1xuICB2YWxpZGF0ZWRQYXRoOiBzdHJpbmc7XG4gIHdhcm5pbmdzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjga7jg5HjgrnmpJzoqLzvvIjjgrvjgq3jg6Xjg6rjg4bjgqPlr77nrZblvLfljJbniYjvvIlcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVPdXRwdXREaXJlY3Rvcnkob3V0cHV0RGlyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyDjg5Hjgrnjg4jjg6njg5Djg7zjgrXjg6vmlLvmkoPjgpLpmLLjgZBcbiAgaWYgKG91dHB1dERpci5pbmNsdWRlcygnLi4nKSB8fCBvdXRwdXREaXIuaW5jbHVkZXMoJ34nKSkge1xuICAgIHRocm93IG5ldyBFcnJvcign5LiN5q2j44Gq44OR44K544GM5qSc5Ye644GV44KM44G+44GX44GfJyk7XG4gIH1cbiAgXG4gIC8vIOODl+ODreOCuOOCp+OCr+ODiOODq+ODvOODiOWkluOBuOOBruOCouOCr+OCu+OCueOCkumYsuOBkFxuICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuICBjb25zdCByZXNvbHZlZFBhdGggPSBwYXRoLnJlc29sdmUob3V0cHV0RGlyKTtcbiAgY29uc3QgcHJvamVjdFJvb3QgPSBwcm9jZXNzLmN3ZCgpO1xuICBcbiAgaWYgKCFyZXNvbHZlZFBhdGguc3RhcnRzV2l0aChwcm9qZWN0Um9vdCkpIHtcbiAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyDjg5fjg63jgrjjgqfjgq/jg4jlpJbjga7jg5HjgrnjgYzmjIflrprjgZXjgozjgb7jgZfjgZ/jgILjg4fjg5Xjgqnjg6vjg4jjg5HjgrnjgpLkvb/nlKjjgZfjgb7jgZnjgIInKTtcbiAgICByZXR1cm4gJy4vZ2VuZXJhdGVkLWRvY3MnO1xuICB9XG4gIFxuICByZXR1cm4gb3V0cHV0RGlyO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZURvY3VtZW50YXRpb24oKSB7XG4gIGNvbnNvbGUubG9nKCfwn5OaIOODieOCreODpeODoeODs+ODiOeUn+aIkOOCkumWi+Wni+OBl+OBvuOBmS4uLicpO1xuICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuICBjb25zb2xlLmxvZygnJyk7XG5cbiAgdHJ5IHtcbiAgICAvLyDoqK3lrprjga7oqq3jgb/ovrzjgb/jgajmpJzoqLxcbiAgICBjb25zdCByYXdPdXRwdXREaXIgPSBwcm9jZXNzLmVudi5PVVRQVVRfRElSIHx8ICcuL2dlbmVyYXRlZC1kb2NzJztcbiAgICBjb25zdCB2YWxpZGF0ZWRPdXRwdXREaXIgPSB2YWxpZGF0ZU91dHB1dERpcmVjdG9yeShyYXdPdXRwdXREaXIpO1xuXG4gICAgY29uc3QgY29uZmlnOiBEb2N1bWVudGF0aW9uQ29uZmlnID0ge1xuICAgICAgcHJvamVjdE5hbWU6IHByb2Nlc3MuZW52LlBST0pFQ1RfTkFNRSB8fCAnUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtJyxcbiAgICAgIHZlcnNpb246IHByb2Nlc3MuZW52LlBST0pFQ1RfVkVSU0lPTiB8fCAnMS4wLjAnLFxuICAgICAgb3V0cHV0RGlyZWN0b3J5OiB2YWxpZGF0ZWRPdXRwdXREaXIsXG4gICAgICBnZW5lcmF0ZUFwaURvY3M6IHByb2Nlc3MuZW52LkdFTkVSQVRFX0FQSV9ET0NTICE9PSAnZmFsc2UnLFxuICAgICAgZ2VuZXJhdGVBcmNoaXRlY3R1cmVEaWFncmFtczogcHJvY2Vzcy5lbnYuR0VORVJBVEVfQVJDSElURUNUVVJFICE9PSAnZmFsc2UnLFxuICAgICAgZ2VuZXJhdGVUZXN0UmVwb3J0czogcHJvY2Vzcy5lbnYuR0VORVJBVEVfVEVTVF9SRVBPUlRTICE9PSAnZmFsc2UnLFxuICAgICAgZ2VuZXJhdGVPcGVyYXRpb25hbEd1aWRlczogcHJvY2Vzcy5lbnYuR0VORVJBVEVfT1BFUkFUSU9OQUxfR1VJREVTICE9PSAnZmFsc2UnLFxuICAgICAgaW5jbHVkZUNvZGVFeGFtcGxlczogcHJvY2Vzcy5lbnYuSU5DTFVERV9DT0RFX0VYQU1QTEVTICE9PSAnZmFsc2UnLFxuICAgICAgaW5jbHVkZVNjcmVlbnNob3RzOiBwcm9jZXNzLmVudi5JTkNMVURFX1NDUkVFTlNIT1RTID09PSAndHJ1ZScsXG4gICAgICBmb3JtYXRzOiAocHJvY2Vzcy5lbnYuT1VUUFVUX0ZPUk1BVFM/LnNwbGl0KCcsJykgYXMgKCdtYXJrZG93bicgfCAnaHRtbCcgfCAncGRmJylbXSkgfHwgWydtYXJrZG93bicsICdodG1sJ11cbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ/CflKcg6Kit5a6a5oOF5aCxOicpO1xuICAgIGNvbnNvbGUubG9nKGAgICDjg5fjg63jgrjjgqfjgq/jg4g6ICR7Y29uZmlnLnByb2plY3ROYW1lfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDjg5Djg7zjgrjjg6fjg7M6ICR7Y29uZmlnLnZlcnNpb259YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODqjogJHtjb25maWcub3V0cHV0RGlyZWN0b3J5fWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDnlJ/miJDlvaLlvI86ICR7Y29uZmlnLmZvcm1hdHMuam9pbignLCAnKX1gKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG5cbiAgICAvLyDjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDlmajjga7liJ3mnJ/ljJZcbiAgICBjb25zdCBnZW5lcmF0b3IgPSBuZXcgRG9jdW1lbnRhdGlvbkdlbmVyYXRvclBhcnQyKGNvbmZpZyk7XG4gICAgY29uc3Qgb3BlcmF0aW9uYWxHZW5lcmF0b3IgPSBuZXcgT3BlcmF0aW9uYWxHdWlkZXNHZW5lcmF0b3IoKTtcblxuICAgIC8vIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBrua6luWCmVxuICAgIGF3YWl0IGVuc3VyZU91dHB1dERpcmVjdG9yeShjb25maWcub3V0cHV0RGlyZWN0b3J5KTtcblxuICAgIC8vIOWFqOODieOCreODpeODoeODs+ODiOOBrueUn+aIkFxuICAgIGF3YWl0IGdlbmVyYXRvci5nZW5lcmF0ZUFsbERvY3VtZW50YXRpb24oKTtcblxuICAgIC8vIOmBi+eUqOOCrOOCpOODieOBrui/veWKoOeUn+aIkO+8iOS4puWIl+Wun+ihjOOBp+mrmOmAn+WMlu+8iVxuICAgIGNvbnNvbGUubG9nKCfwn5OWIOi/veWKoOmBi+eUqOOCrOOCpOODieOCkueUn+aIkOS4rS4uLicpO1xuICAgIFxuICAgIGNvbnN0IG9wZXJhdGlvbmFsVGFza3MgPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICfjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4knLFxuICAgICAgICB0YXNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IG9wZXJhdGlvbmFsR2VuZXJhdG9yLmdlbmVyYXRlVHJvdWJsZXNob290aW5nR3VpZGUoKTtcbiAgICAgICAgICBhd2FpdCB3cml0ZUZpbGUoY29uZmlnLm91dHB1dERpcmVjdG9yeSwgJ29wZXJhdGlvbnMvdHJvdWJsZXNob290aW5nLm1kJywgY29udGVudCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICfpgYvnlKjjg4Hjgqfjg4Pjgq/jg6rjgrnjg4gnLFxuICAgICAgICB0YXNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IG9wZXJhdGlvbmFsR2VuZXJhdG9yLmdlbmVyYXRlT3BlcmF0aW9uYWxDaGVja2xpc3QoKTtcbiAgICAgICAgICBhd2FpdCB3cml0ZUZpbGUoY29uZmlnLm91dHB1dERpcmVjdG9yeSwgJ29wZXJhdGlvbnMvY2hlY2tsaXN0Lm1kJywgY29udGVudCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICfnm6PoppbjgqzjgqTjg4knLFxuICAgICAgICB0YXNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IG9wZXJhdGlvbmFsR2VuZXJhdG9yLmdlbmVyYXRlTW9uaXRvcmluZ0d1aWRlKCk7XG4gICAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGNvbmZpZy5vdXRwdXREaXJlY3RvcnksICdvcGVyYXRpb25zL21vbml0b3JpbmcubWQnLCBjb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG5cbiAgICAvLyDkuKbliJflrp/ooYzjgafjg5Hjg5Xjgqnjg7zjg57jg7PjgrnlkJHkuIpcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKFxuICAgICAgb3BlcmF0aW9uYWxUYXNrcy5tYXAoKHsgdGFzayB9KSA9PiB0YXNrKCkpXG4gICAgKTtcblxuICAgIC8vIOe1kOaenOOBrueiuuiqjeOBqOODreOCsOWHuuWKm1xuICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgdGFza05hbWUgPSBvcGVyYXRpb25hbFRhc2tzW2luZGV4XS5uYW1lO1xuICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDinIUgJHt0YXNrTmFtZX3nlJ/miJDlrozkuoZgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYCAgIOKdjCAke3Rhc2tOYW1lfeeUn+aIkOWkseaVlzpgLCByZXN1bHQucmVhc29uKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3Rhc2tOYW1lfeOBrueUn+aIkOOBq+WkseaVl+OBl+OBvuOBl+OBn2ApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCfwn46JIOODieOCreODpeODoeODs+ODiOeUn+aIkOOBjOWujOS6huOBl+OBvuOBl+OBn++8gScpO1xuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OBIOeUn+aIkOOBleOCjOOBn+ODieOCreODpeODoeODs+ODiDonKTtcbiAgICBjb25zb2xlLmxvZyhgICAg8J+TiyDjg6HjgqTjg7Pjg4njgq3jg6Xjg6Hjg7Pjg4g6ICR7Y29uZmlnLm91dHB1dERpcmVjdG9yeX0vUkVBRE1FLm1kYCk7XG4gICAgY29uc29sZS5sb2coYCAgIPCflJcgQVBJIOODieOCreODpeODoeODs+ODiDogJHtjb25maWcub3V0cHV0RGlyZWN0b3J5fS9hcGkvYCk7XG4gICAgY29uc29sZS5sb2coYCAgIPCfj5fvuI8g44Ki44O844Kt44OG44Kv44OB44OjOiAke2NvbmZpZy5vdXRwdXREaXJlY3Rvcnl9L2FyY2hpdGVjdHVyZS9gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg8J+TiiDjg4bjgrnjg4jjg6zjg53jg7zjg4g6ICR7Y29uZmlnLm91dHB1dERpcmVjdG9yeX0vdGVzdHMvYCk7XG4gICAgY29uc29sZS5sb2coYCAgIPCfk5Yg6YGL55So44Ks44Kk44OJOiAke2NvbmZpZy5vdXRwdXREaXJlY3Rvcnl9L29wZXJhdGlvbnMvYCk7XG4gICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgLy8g55Sf5oiQ57Wx6KiI44Gu6KGo56S6XG4gICAgYXdhaXQgZGlzcGxheUdlbmVyYXRpb25TdGF0cyhjb25maWcub3V0cHV0RGlyZWN0b3J5KTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJycpO1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDjgqjjg6njg7w6Jyk7XG4gICAgXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOOCqOODqeODvOODoeODg+OCu+ODvOOCuDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgY29uc29sZS5lcnJvcihg44Ko44Op44O844K/44Kk44OXOiAke2Vycm9yLmNvbnN0cnVjdG9yLm5hbWV9YCk7XG4gICAgICBcbiAgICAgIGlmIChlcnJvci5zdGFjaykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGDjgrnjgr/jg4Pjgq/jg4jjg6zjg7zjgrk6ICR7ZXJyb3Iuc3RhY2t9YCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIOS4gOiIrOeahOOBquOCqOODqeODvOODkeOCv+ODvOODs+OBq+WvvuOBmeOCi+ino+axuuetluOCkuaPkOekulxuICAgICAgaWYgKGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJ0VOT0VOVCcpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ/CfkqEg6Kej5rG6562WOiDjg5XjgqHjgqTjg6vjgb7jgZ/jga/jg4fjgqPjg6zjgq/jg4jjg6rjgYzlrZjlnKjjgZfjgb7jgZvjgpPjgILjg5HjgrnjgpLnorroqo3jgZfjgabjgY/jgaDjgZXjgYTjgIInKTtcbiAgICAgIH0gZWxzZSBpZiAoZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnRUFDQ0VTJykpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign8J+SoSDop6PmsbrnrZY6IOODleOCoeOCpOODq+OCouOCr+OCu+OCueaoqemZkOOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhOOAgicpO1xuICAgICAgfSBlbHNlIGlmIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCfkuI3mraPjgarjg5HjgrknKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfwn5KhIOino+axuuetljog5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu44OR44K544KS56K66KqN44GX44Gm44GP44Gg44GV44GE44CCJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+S6iOacn+OBl+OBquOBhOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUuZXJyb3IoJycpO1xuICAgIGNvbnNvbGUuZXJyb3IoJ/CflKcg44OI44Op44OW44Or44K344Ol44O844OG44Kj44Oz44KwOicpO1xuICAgIGNvbnNvbGUuZXJyb3IoJyAgIDEuIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBruaoqemZkOOCkueiuuiqjScpO1xuICAgIGNvbnNvbGUuZXJyb3IoJyAgIDIuIOS+neWtmOmWouS/guOBjOato+OBl+OBj+OCpOODs+OCueODiOODvOODq+OBleOCjOOBpuOBhOOCi+OBi+eiuuiqjScpO1xuICAgIGNvbnNvbGUuZXJyb3IoJyAgIDMuIOeSsOWig+WkieaVsOOBruioreWumuOCkueiuuiqjScpO1xuICAgIGNvbnNvbGUuZXJyb3IoJycpO1xuICAgIFxuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxufVxuXG4vKipcbiAqIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBrueiuuS/nVxuICovXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVPdXRwdXREaXJlY3Rvcnkob3V0cHV0RGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZnMgPSBhd2FpdCBpbXBvcnQoJ2ZzJyk7XG4gIGNvbnN0IHBhdGggPSBhd2FpdCBpbXBvcnQoJ3BhdGgnKTtcbiAgXG4gIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5yZXNvbHZlKG91dHB1dERpcik7XG4gIFxuICBpZiAoIWZzLmV4aXN0c1N5bmMoZnVsbFBhdGgpKSB7XG4gICAgZnMubWtkaXJTeW5jKGZ1bGxQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zb2xlLmxvZyhg8J+TgSDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjgpLkvZzmiJDjgZfjgb7jgZfjgZ86ICR7ZnVsbFBhdGh9YCk7XG4gIH1cblxuICAvLyDjgrXjg5bjg4fjgqPjg6zjgq/jg4jjg6rjga7kvZzmiJBcbiAgY29uc3Qgc3ViZGlycyA9IFsnYXBpJywgJ2FyY2hpdGVjdHVyZScsICd0ZXN0cycsICdvcGVyYXRpb25zJywgJ2Fzc2V0cyddO1xuICBmb3IgKGNvbnN0IHN1YmRpciBvZiBzdWJkaXJzKSB7XG4gICAgY29uc3Qgc3ViZGlyUGF0aCA9IHBhdGguam9pbihmdWxsUGF0aCwgc3ViZGlyKTtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoc3ViZGlyUGF0aCkpIHtcbiAgICAgIGZzLm1rZGlyU3luYyhzdWJkaXJQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiDjg5XjgqHjgqTjg6vmm7jjgY3ovrzjgb/vvIjjg6Hjg6Ljg6rlirnnjofmnIDpganljJbniYjvvIlcbiAqL1xuYXN5bmMgZnVuY3Rpb24gd3JpdGVGaWxlKGJhc2VEaXI6IHN0cmluZywgcmVsYXRpdmVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBmcyA9IGF3YWl0IGltcG9ydCgnZnMnKTtcbiAgY29uc3QgcGF0aCA9IGF3YWl0IGltcG9ydCgncGF0aCcpO1xuICBcbiAgdHJ5IHtcbiAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihiYXNlRGlyLCByZWxhdGl2ZVBhdGgpO1xuICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShmdWxsUGF0aCk7XG4gICAgXG4gICAgLy8g44OH44Kj44Os44Kv44OI44Oq44Gu5a2Y5Zyo56K66KqN44Go5L2c5oiQXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBtb2RlOiAwbzc1NSB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8g5aSn44GN44Gq44OV44Kh44Kk44Or44Gu5aC05ZCI44Gv44K544OI44Oq44O844Og5pu444GN6L6844G/44KS5L2/55SoXG4gICAgaWYgKGNvbnRlbnQubGVuZ3RoID4gMTAyNCAqIDEwMjQpIHsgLy8gMU1C5Lul5LiKXG4gICAgICBjb25zdCB3cml0ZVN0cmVhbSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZ1bGxQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICB3cml0ZVN0cmVhbS53cml0ZShjb250ZW50KTtcbiAgICAgIHdyaXRlU3RyZWFtLmVuZCgpO1xuICAgICAgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB3cml0ZVN0cmVhbS5vbignZmluaXNoJywgcmVzb2x2ZSk7XG4gICAgICAgIHdyaXRlU3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8g5bCP44GV44Gq44OV44Kh44Kk44Or44Gv5ZCM5pyf5pu444GN6L6844G/XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKGZ1bGxQYXRoLCBjb250ZW50LCB7IGVuY29kaW5nOiAndXRmOCcsIG1vZGU6IDBvNjQ0IH0pO1xuICAgIH1cbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgdGhyb3cgbmV3IEVycm9yKGDjg5XjgqHjgqTjg6vmm7jjgY3ovrzjgb/jgqjjg6njg7wgKCR7cmVsYXRpdmVQYXRofSk6ICR7ZXJyb3JNZXNzYWdlfWApO1xuICB9XG59XG5cbi8qKlxuICog55Sf5oiQ57Wx6KiI44Gu6KGo56S6XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGRpc3BsYXlHZW5lcmF0aW9uU3RhdHMob3V0cHV0RGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBmcyA9IGF3YWl0IGltcG9ydCgnZnMnKTtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgaW1wb3J0KCdwYXRoJyk7XG4gICAgXG4gICAgY29uc3Qgc3RhdHMgPSB7XG4gICAgICB0b3RhbEZpbGVzOiAwLFxuICAgICAgdG90YWxTaXplOiAwLFxuICAgICAgZmlsZXNCeVR5cGU6IHt9IGFzIFJlY29yZDxzdHJpbmcsIG51bWJlcj5cbiAgICB9O1xuXG4gICAgY29uc3Qgd2Fsa0RpciA9IChkaXI6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHJldHVybjtcbiAgICAgIFxuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyhkaXIpO1xuICAgICAgXG4gICAgICBmaWxlcy5mb3JFYWNoKGZpbGUgPT4ge1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xuICAgICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZmlsZVBhdGgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgIHdhbGtEaXIoZmlsZVBhdGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRzLnRvdGFsRmlsZXMrKztcbiAgICAgICAgICBzdGF0cy50b3RhbFNpemUgKz0gc3RhdC5zaXplO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIHN0YXRzLmZpbGVzQnlUeXBlW2V4dF0gPSAoc3RhdHMuZmlsZXNCeVR5cGVbZXh0XSB8fCAwKSArIDE7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICB3YWxrRGlyKG91dHB1dERpcik7XG5cbiAgICBjb25zb2xlLmxvZygn8J+TiiDnlJ/miJDntbHoqIg6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIPCfk4Qg57eP44OV44Kh44Kk44Or5pWwOiAke3N0YXRzLnRvdGFsRmlsZXN9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIPCfkr4g57eP44K144Kk44K6OiAkeyhzdGF0cy50b3RhbFNpemUgLyAxMDI0KS50b0ZpeGVkKDEpfSBLQmApO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygnICAg8J+TiyDjg5XjgqHjgqTjg6vnqK7liKU6Jyk7XG4gICAgT2JqZWN0LmVudHJpZXMoc3RhdHMuZmlsZXNCeVR5cGUpLmZvckVhY2goKFtleHQsIGNvdW50XSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCAgICAgJHtleHQgfHwgJyjmi6HlvLXlrZDjgarjgZcpJ306ICR7Y291bnR944OV44Kh44Kk44OrYCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJycpO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgIGNvbnNvbGUud2Fybign4pqg77iPIOe1seioiOaDheWgseOBruWPluW+l+OBq+WkseaVl+OBl+OBvuOBl+OBnzonLCBlcnJvck1lc3NhZ2UpO1xuICB9XG59XG5cbi8qKlxuICog44Oh44Kk44Oz5a6f6KGMXG4gKi9cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBnZW5lcmF0ZURvY3VtZW50YXRpb24oKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg5LqI5pyf44GX44Gq44GE44Ko44Op44O844GM55m655Sf44GX44G+44GX44GfOicsIGVycm9yKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH0pO1xufVxuXG5leHBvcnQgeyBnZW5lcmF0ZURvY3VtZW50YXRpb24gfTsiXX0=