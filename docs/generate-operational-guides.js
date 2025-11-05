#!/usr/bin/env ts-node
"use strict";
/**
 * 運用ガイド生成スクリプト
 * Permission-aware RAG System の包括的運用ガイドを生成
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
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
exports.generateOperationalGuides = generateOperationalGuides;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const operational_guides_generator_1 = require("./generators/operational-guides-generator");
/**
 * デフォルト設定
 */
const DEFAULT_CONFIG = {
    outputDirectory: 'operations',
    fileMode: 0o644,
    encoding: 'utf-8',
    enableParallelProcessing: true,
    maxConcurrentWrites: 10
};
/**
 * パスの検証と解決（セキュリティ対策）
 */
function validateAndResolvePath(inputPath) {
    // 入力値の基本検証
    if (!inputPath || typeof inputPath !== 'string') {
        throw new Error('無効なパスが指定されました');
    }
    // 危険なパスパターンの検証
    const dangerousPatterns = [
        /\.\./, // パストラバーサル
        /~/, // ホームディレクトリ参照
        /\0/, // ヌル文字
        /[<>:"|?*]/, // 無効なファイル名文字
        /^\/+/, // 絶対パス
        /\\+/ // バックスラッシュ
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
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.promises.mkdir(dirPath, { recursive: true, mode: 0o755 });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`ディレクトリ作成に失敗しました: ${dirPath} - ${errorMessage}`);
    }
}
/**
 * ガイドの並列書き込み（パフォーマンス最適化）
 */
async function writeGuidesParallel(guides, outputDir, config) {
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
        }
        catch (error) {
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
        }
        else {
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
async function generateIndexFile(generator, outputDir, config) {
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
    }
    catch (error) {
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
function displayGenerationSummary(summary) {
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
function handleGenerationError(error) {
    console.error('\n❌ 運用ガイド生成エラー:');
    if (error instanceof Error) {
        console.error(`エラーメッセージ: ${error.message}`);
        if (error.stack) {
            console.error(`スタックトレース: ${error.stack}`);
        }
    }
    else {
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
async function generateOperationalGuides() {
    console.log('🚀 運用ガイド生成開始...');
    const startTime = Date.now();
    try {
        // 設定の読み込み
        const config = { ...DEFAULT_CONFIG };
        // ジェネレーターの初期化
        const generator = new operational_guides_generator_1.OperationalGuidesGenerator();
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
        const summary = {
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
        }
        else {
            console.log('\n✅ 運用ガイド生成完了！');
        }
    }
    catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtb3BlcmF0aW9uYWwtZ3VpZGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2VuZXJhdGUtb3BlcmF0aW9uYWwtZ3VpZGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMlRNLDhEQUF5QjtBQXpUbEMsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3Qiw0RkFBdUY7QUFtQ3ZGOztHQUVHO0FBQ0gsTUFBTSxjQUFjLEdBQXFCO0lBQ3ZDLGVBQWUsRUFBRSxZQUFZO0lBQzdCLFFBQVEsRUFBRSxLQUFLO0lBQ2YsUUFBUSxFQUFFLE9BQU87SUFDakIsd0JBQXdCLEVBQUUsSUFBSTtJQUM5QixtQkFBbUIsRUFBRSxFQUFFO0NBQ3hCLENBQUM7QUFFRjs7R0FFRztBQUNILFNBQVMsc0JBQXNCLENBQUMsU0FBaUI7SUFDL0MsV0FBVztJQUNYLElBQUksQ0FBQyxTQUFTLElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDaEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsZUFBZTtJQUNmLE1BQU0saUJBQWlCLEdBQUc7UUFDeEIsTUFBTSxFQUFZLFdBQVc7UUFDN0IsR0FBRyxFQUFlLGNBQWM7UUFDaEMsSUFBSSxFQUFjLE9BQU87UUFDekIsV0FBVyxFQUFPLGFBQWE7UUFDL0IsTUFBTSxFQUFZLE9BQU87UUFDekIsS0FBSyxDQUFhLFdBQVc7S0FDOUIsQ0FBQztJQUVGLEtBQUssTUFBTSxPQUFPLElBQUksaUJBQWlCLEVBQUUsQ0FBQztRQUN4QyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ3JELENBQUM7SUFDSCxDQUFDO0lBRUQsWUFBWTtJQUNaLE1BQU0sWUFB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QUNmLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdCLE1BQU0sS0FBSyxDQUFDLENBQUMsT0FBTztJQUN0QixDQUFDO0FBQ0gsQ0FBQztBQUVELFFBQVE7QUFDUixJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7SUFDNUIseUJBQXlCLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDeEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiB0cy1ub2RlXG5cbi8qKlxuICog6YGL55So44Ks44Kk44OJ55Sf5oiQ44K544Kv44Oq44OX44OIXG4gKiBQZXJtaXNzaW9uLWF3YXJlIFJBRyBTeXN0ZW0g44Gu5YyF5ous55qE6YGL55So44Ks44Kk44OJ44KS55Sf5oiQXG4gKiBcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIE5ldEFwcCBKYXBhbiBUZWNobm9sb2d5IFRlYW1cbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT3BlcmF0aW9uYWxHdWlkZXNHZW5lcmF0b3IgfSBmcm9tICcuL2dlbmVyYXRvcnMvb3BlcmF0aW9uYWwtZ3VpZGVzLWdlbmVyYXRvcic7XG5cbi8qKlxuICog55Sf5oiQ6Kit5a6a44Gu5Z6L5a6a576pXG4gKi9cbmludGVyZmFjZSBHZW5lcmF0aW9uQ29uZmlnIHtcbiAgb3V0cHV0RGlyZWN0b3J5OiBzdHJpbmc7XG4gIGZpbGVNb2RlOiBudW1iZXI7XG4gIGVuY29kaW5nOiBCdWZmZXJFbmNvZGluZztcbiAgZW5hYmxlUGFyYWxsZWxQcm9jZXNzaW5nOiBib29sZWFuO1xuICBtYXhDb25jdXJyZW50V3JpdGVzOiBudW1iZXI7XG59XG5cbi8qKlxuICog55Sf5oiQ57WQ5p6c44Gu5Z6L5a6a576pXG4gKi9cbmludGVyZmFjZSBHZW5lcmF0aW9uUmVzdWx0IHtcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgc3VjY2VzczogYm9vbGVhbjtcbiAgc2l6ZTogbnVtYmVyO1xuICBlcnJvcj86IEVycm9yO1xufVxuXG4vKipcbiAqIOeUn+aIkOOCteODnuODquODvOOBruWei+Wumue+qVxuICovXG5pbnRlcmZhY2UgR2VuZXJhdGlvblN1bW1hcnkge1xuICB0b3RhbEZpbGVzOiBudW1iZXI7XG4gIHN1Y2Nlc3NDb3VudDogbnVtYmVyO1xuICBmYWlsdXJlQ291bnQ6IG51bWJlcjtcbiAgdG90YWxTaXplOiBudW1iZXI7XG4gIG91dHB1dERpcmVjdG9yeTogc3RyaW5nO1xuICByZXN1bHRzOiBHZW5lcmF0aW9uUmVzdWx0W107XG59XG5cbi8qKlxuICog44OH44OV44Kp44Or44OI6Kit5a6aXG4gKi9cbmNvbnN0IERFRkFVTFRfQ09ORklHOiBHZW5lcmF0aW9uQ29uZmlnID0ge1xuICBvdXRwdXREaXJlY3Rvcnk6ICdvcGVyYXRpb25zJyxcbiAgZmlsZU1vZGU6IDBvNjQ0LFxuICBlbmNvZGluZzogJ3V0Zi04JyxcbiAgZW5hYmxlUGFyYWxsZWxQcm9jZXNzaW5nOiB0cnVlLFxuICBtYXhDb25jdXJyZW50V3JpdGVzOiAxMFxufTtcblxuLyoqXG4gKiDjg5Hjgrnjga7mpJzoqLzjgajop6PmsbrvvIjjgrvjgq3jg6Xjg6rjg4bjgqPlr77nrZbvvIlcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVBbmRSZXNvbHZlUGF0aChpbnB1dFBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIOWFpeWKm+WApOOBruWfuuacrOaknOiovFxuICBpZiAoIWlucHV0UGF0aCB8fCB0eXBlb2YgaW5wdXRQYXRoICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcign54Sh5Yq544Gq44OR44K544GM5oyH5a6a44GV44KM44G+44GX44GfJyk7XG4gIH1cblxuICAvLyDljbHpmbrjgarjg5Hjgrnjg5Hjgr/jg7zjg7Pjga7mpJzoqLxcbiAgY29uc3QgZGFuZ2Vyb3VzUGF0dGVybnMgPSBbXG4gICAgL1xcLlxcLi8sICAgICAgICAgICAvLyDjg5Hjgrnjg4jjg6njg5Djg7zjgrXjg6tcbiAgICAvfi8sICAgICAgICAgICAgICAvLyDjg5vjg7zjg6Djg4fjgqPjg6zjgq/jg4jjg6rlj4LnhadcbiAgICAvXFwwLywgICAgICAgICAgICAgLy8g44OM44Or5paH5a2XXG4gICAgL1s8PjpcInw/Kl0vLCAgICAgIC8vIOeEoeWKueOBquODleOCoeOCpOODq+WQjeaWh+Wtl1xuICAgIC9eXFwvKy8sICAgICAgICAgICAvLyDntbblr77jg5HjgrlcbiAgICAvXFxcXCsvICAgICAgICAgICAgIC8vIOODkOODg+OCr+OCueODqeODg+OCt+ODpVxuICBdO1xuXG4gIGZvciAoY29uc3QgcGF0dGVybiBvZiBkYW5nZXJvdXNQYXR0ZXJucykge1xuICAgIGlmIChwYXR0ZXJuLnRlc3QoaW5wdXRQYXRoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGDkuI3mraPjgarjg5Hjgrnjg5Hjgr/jg7zjg7PjgYzmpJzlh7rjgZXjgozjgb7jgZfjgZ86ICR7aW5wdXRQYXRofWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIOODkeOCueOBruato+imj+WMluOBqOino+axulxuICBjb25zdCByZXNvbHZlZFBhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBpbnB1dFBhdGgpO1xuICBjb25zdCBwcm9qZWN0Um9vdCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicpO1xuXG4gIC8vIOODl+ODreOCuOOCp+OCr+ODiOODq+ODvOODiOWkluOBuOOBruOCouOCr+OCu+OCueOCkumYsuOBkFxuICBpZiAoIXJlc29sdmVkUGF0aC5zdGFydHNXaXRoKHByb2plY3RSb290KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihg44OX44Ot44K444Kn44Kv44OI44OH44Kj44Os44Kv44OI44Oq5aSW44G444Gu44Ki44Kv44K744K544Gv56aB5q2i44GV44KM44Gm44GE44G+44GZOiAke3Jlc29sdmVkUGF0aH1gKTtcbiAgfVxuXG4gIHJldHVybiByZXNvbHZlZFBhdGg7XG59XG5cbi8qKlxuICog44OH44Kj44Os44Kv44OI44Oq44Gu5a6J5YWo44Gq5L2c5oiQXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZURpcmVjdG9yeUV4aXN0cyhkaXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2RpcihkaXJQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgbW9kZTogMG83NTUgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgIHRocm93IG5ldyBFcnJvcihg44OH44Kj44Os44Kv44OI44Oq5L2c5oiQ44Gr5aSx5pWX44GX44G+44GX44GfOiAke2RpclBhdGh9IC0gJHtlcnJvck1lc3NhZ2V9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiDjgqzjgqTjg4njga7kuKbliJfmm7jjgY3ovrzjgb/vvIjjg5Hjg5Xjgqnjg7zjg57jg7PjgrnmnIDpganljJbvvIlcbiAqL1xuYXN5bmMgZnVuY3Rpb24gd3JpdGVHdWlkZXNQYXJhbGxlbChcbiAgZ3VpZGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LCBcbiAgb3V0cHV0RGlyOiBzdHJpbmcsIFxuICBjb25maWc6IEdlbmVyYXRpb25Db25maWdcbik6IFByb21pc2U8R2VuZXJhdGlvblJlc3VsdFtdPiB7XG4gIGNvbnN0IHdyaXRlUHJvbWlzZXMgPSBPYmplY3QuZW50cmllcyhndWlkZXMpLm1hcChhc3luYyAoW2ZpbGVuYW1lLCBjb250ZW50XSkgPT4ge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKG91dHB1dERpciwgYCR7ZmlsZW5hbWV9Lm1kYCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShmaWxlUGF0aCwgY29udGVudCwgeyBcbiAgICAgICAgZW5jb2Rpbmc6IGNvbmZpZy5lbmNvZGluZywgXG4gICAgICAgIG1vZGU6IGNvbmZpZy5maWxlTW9kZSBcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZmlsZVBhdGgpO1xuICAgICAgY29uc29sZS5sb2coYOKchSDnlJ/miJDlrozkuoY6ICR7ZmlsZW5hbWV9Lm1kICgke01hdGgucm91bmQoc3RhdHMuc2l6ZSAvIDEwMjQpfSBLQilgKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmlsZW5hbWU6IGAke2ZpbGVuYW1lfS5tZGAsXG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHNpemU6IHN0YXRzLnNpemVcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGVyciA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCDnlJ/miJDlpLHmlZc6ICR7ZmlsZW5hbWV9Lm1kYCwgZXJyLm1lc3NhZ2UpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBmaWxlbmFtZTogYCR7ZmlsZW5hbWV9Lm1kYCxcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHNpemU6IDAsXG4gICAgICAgIGVycm9yOiBlcnJcbiAgICAgIH07XG4gICAgfVxuICB9KTtcbiAgXG4gIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQod3JpdGVQcm9taXNlcyk7XG4gIFxuICByZXR1cm4gcmVzdWx0cy5tYXAocmVzdWx0ID0+IHtcbiAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZpbGVuYW1lOiAndW5rbm93bicsXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBzaXplOiAwLFxuICAgICAgICBlcnJvcjogbmV3IEVycm9yKHJlc3VsdC5yZWFzb24pXG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICog55uu5qyh44OV44Kh44Kk44Or44Gu55Sf5oiQXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlSW5kZXhGaWxlKFxuICBnZW5lcmF0b3I6IE9wZXJhdGlvbmFsR3VpZGVzR2VuZXJhdG9yLCBcbiAgb3V0cHV0RGlyOiBzdHJpbmcsIFxuICBjb25maWc6IEdlbmVyYXRpb25Db25maWdcbik6IFByb21pc2U8R2VuZXJhdGlvblJlc3VsdD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGluZGV4Q29udGVudCA9IGdlbmVyYXRvci5nZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVJbmRleCgpO1xuICAgIGNvbnN0IGluZGV4UGF0aCA9IHBhdGguam9pbihvdXRwdXREaXIsICdSRUFETUUubWQnKTtcbiAgICBcbiAgICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUoaW5kZXhQYXRoLCBpbmRleENvbnRlbnQsIHsgXG4gICAgICBlbmNvZGluZzogY29uZmlnLmVuY29kaW5nLCBcbiAgICAgIG1vZGU6IGNvbmZpZy5maWxlTW9kZSBcbiAgICB9KTtcbiAgICBcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoaW5kZXhQYXRoKTtcbiAgICBjb25zb2xlLmxvZyhg4pyFIOebruasoeeUn+aIkOWujOS6hjogUkVBRE1FLm1kICgke01hdGgucm91bmQoc3RhdHMuc2l6ZSAvIDEwMjQpfSBLQilgKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgZmlsZW5hbWU6ICdSRUFETUUubWQnLFxuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHNpemU6IHN0YXRzLnNpemVcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnN0IGVyciA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKTtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg55uu5qyh55Sf5oiQ5aSx5pWXOicsIGVyci5tZXNzYWdlKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgZmlsZW5hbWU6ICdSRUFETUUubWQnLFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBzaXplOiAwLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiDnlJ/miJDjgrXjg57jg6rjg7zjga7ooajnpLpcbiAqL1xuZnVuY3Rpb24gZGlzcGxheUdlbmVyYXRpb25TdW1tYXJ5KHN1bW1hcnk6IEdlbmVyYXRpb25TdW1tYXJ5KTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCdcXG7wn5OKIOmBi+eUqOOCrOOCpOODieeUn+aIkOOCteODnuODquODvDonKTtcbiAgY29uc29sZS5sb2coYCAgIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODqjogJHtzdW1tYXJ5Lm91dHB1dERpcmVjdG9yeX1gKTtcbiAgY29uc29sZS5sb2coYCAgIOe3j+ODleOCoeOCpOODq+aVsDogJHtzdW1tYXJ5LnRvdGFsRmlsZXN9YCk7XG4gIGNvbnNvbGUubG9nKGAgICDmiJDlip86ICR7c3VtbWFyeS5zdWNjZXNzQ291bnR9IC8g5aSx5pWXOiAke3N1bW1hcnkuZmFpbHVyZUNvdW50fWApO1xuICBjb25zb2xlLmxvZyhgICAg57eP44K144Kk44K6OiAke01hdGgucm91bmQoc3VtbWFyeS50b3RhbFNpemUgLyAxMDI0KX0gS0JgKTtcbiAgXG4gIGlmIChzdW1tYXJ5LnN1Y2Nlc3NDb3VudCA+IDApIHtcbiAgICBjb25zb2xlLmxvZygnXFxu4pyFIOeUn+aIkOaIkOWKn+ODleOCoeOCpOODqzonKTtcbiAgICBzdW1tYXJ5LnJlc3VsdHNcbiAgICAgIC5maWx0ZXIocmVzdWx0ID0+IHJlc3VsdC5zdWNjZXNzKVxuICAgICAgLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICAgLSAke3Jlc3VsdC5maWxlbmFtZX1gKTtcbiAgICAgIH0pO1xuICB9XG4gIFxuICBpZiAoc3VtbWFyeS5mYWlsdXJlQ291bnQgPiAwKSB7XG4gICAgY29uc29sZS5sb2coJ1xcbuKdjCDnlJ/miJDlpLHmlZfjg5XjgqHjgqTjg6s6Jyk7XG4gICAgc3VtbWFyeS5yZXN1bHRzXG4gICAgICAuZmlsdGVyKHJlc3VsdCA9PiAhcmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgICAtICR7cmVzdWx0LmZpbGVuYW1lfTogJHtyZXN1bHQuZXJyb3I/Lm1lc3NhZ2UgfHwgJ+S4jeaYjuOBquOCqOODqeODvCd9YCk7XG4gICAgICB9KTtcbiAgfVxuICBcbiAgY29uc29sZS5sb2coJ1xcbvCfjq8g5L2/55So5pa55rOVOicpO1xuICBjb25zb2xlLmxvZygnICAgMS4gZG9jcy9vcGVyYXRpb25zLyDjg4fjgqPjg6zjgq/jg4jjg6rjgpLnorroqo0nKTtcbiAgY29uc29sZS5sb2coJyAgIDIuIFJFQURNRS5tZCDjgYvjgonlv4XopoHjgarjgqzjgqTjg4njgpLpgbjmip4nKTtcbiAgY29uc29sZS5sb2coJyAgIDMuIOWQhOOCrOOCpOODieOBruaJi+mghuOBq+W+k+OBo+OBpumBi+eUqOOCkuWun+aWvScpO1xuICBjb25zb2xlLmxvZygnICAgNC4g5a6a5pyf55qE44Gr44Ks44Kk44OJ44KS6KaL55u044GX44O75pu05pawJyk7XG59XG5cbi8qKlxuICog44Ko44Op44O844OP44Oz44OJ44Oq44Oz44KwXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZUdlbmVyYXRpb25FcnJvcihlcnJvcjogdW5rbm93bik6IHZvaWQge1xuICBjb25zb2xlLmVycm9yKCdcXG7inYwg6YGL55So44Ks44Kk44OJ55Sf5oiQ44Ko44Op44O8OicpO1xuICBcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGDjgqjjg6njg7zjg6Hjg4Pjgrvjg7zjgrg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICBpZiAoZXJyb3Iuc3RhY2spIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYOOCueOCv+ODg+OCr+ODiOODrOODvOOCuTogJHtlcnJvci5zdGFja31gKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcign5LqI5pyf44GX44Gq44GE44Ko44Op44O8OicsIGVycm9yKTtcbiAgfVxuICBcbiAgY29uc29sZS5lcnJvcignXFxu8J+UpyDjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrA6Jyk7XG4gIGNvbnNvbGUuZXJyb3IoJyAgIDEuIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBruaoqemZkOOCkueiuuiqjScpO1xuICBjb25zb2xlLmVycm9yKCcgICAyLiDjg4fjgqPjgrnjgq/lrrnph4/jgpLnorroqo0nKTtcbiAgY29uc29sZS5lcnJvcignICAgMy4gT3BlcmF0aW9uYWxHdWlkZXNHZW5lcmF0b3Ig44Gu5a6f6KOF44KS56K66KqNJyk7XG59XG5cbi8qKlxuICog44Oh44Kk44Oz5Yem55CGXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlT3BlcmF0aW9uYWxHdWlkZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnNvbGUubG9nKCfwn5qAIOmBi+eUqOOCrOOCpOODieeUn+aIkOmWi+Wniy4uLicpO1xuICBcbiAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgXG4gIHRyeSB7XG4gICAgLy8g6Kit5a6a44Gu6Kqt44G/6L6844G/XG4gICAgY29uc3QgY29uZmlnID0geyAuLi5ERUZBVUxUX0NPTkZJRyB9O1xuICAgIFxuICAgIC8vIOOCuOOCp+ODjeODrOODvOOCv+ODvOOBruWIneacn+WMllxuICAgIGNvbnN0IGdlbmVyYXRvciA9IG5ldyBPcGVyYXRpb25hbEd1aWRlc0dlbmVyYXRvcigpO1xuICAgIFxuICAgIC8vIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBruaknOiovOOBqOS9nOaIkFxuICAgIGNvbnN0IG91dHB1dERpciA9IHZhbGlkYXRlQW5kUmVzb2x2ZVBhdGgoY29uZmlnLm91dHB1dERpcmVjdG9yeSk7XG4gICAgYXdhaXQgZW5zdXJlRGlyZWN0b3J5RXhpc3RzKG91dHB1dERpcik7XG4gICAgXG4gICAgY29uc29sZS5sb2coYPCfk4Eg5Ye65Yqb44OH44Kj44Os44Kv44OI44OqOiAke291dHB1dERpcn1gKTtcbiAgICBcbiAgICAvLyDlhajpgYvnlKjjgqzjgqTjg4nnlJ/miJBcbiAgICBjb25zb2xlLmxvZygn8J+TliDpgYvnlKjjgqzjgqTjg4nnlJ/miJDkuK0uLi4nKTtcbiAgICBjb25zdCBndWlkZXMgPSBnZW5lcmF0b3IuZ2VuZXJhdGVBbGxPcGVyYXRpb25hbEd1aWRlcygpO1xuICAgIFxuICAgIC8vIOOCrOOCpOODieODleOCoeOCpOODq+OBruS4puWIl+abuOOBjei+vOOBv1xuICAgIGNvbnN0IGd1aWRlUmVzdWx0cyA9IGF3YWl0IHdyaXRlR3VpZGVzUGFyYWxsZWwoZ3VpZGVzLCBvdXRwdXREaXIsIGNvbmZpZyk7XG4gICAgXG4gICAgLy8g55uu5qyh44OV44Kh44Kk44Or44Gu55Sf5oiQXG4gICAgY29uc3QgaW5kZXhSZXN1bHQgPSBhd2FpdCBnZW5lcmF0ZUluZGV4RmlsZShnZW5lcmF0b3IsIG91dHB1dERpciwgY29uZmlnKTtcbiAgICBcbiAgICAvLyDntZDmnpzjga7pm4boqIhcbiAgICBjb25zdCBhbGxSZXN1bHRzID0gWy4uLmd1aWRlUmVzdWx0cywgaW5kZXhSZXN1bHRdO1xuICAgIGNvbnN0IHN1bW1hcnk6IEdlbmVyYXRpb25TdW1tYXJ5ID0ge1xuICAgICAgdG90YWxGaWxlczogYWxsUmVzdWx0cy5sZW5ndGgsXG4gICAgICBzdWNjZXNzQ291bnQ6IGFsbFJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGgsXG4gICAgICBmYWlsdXJlQ291bnQ6IGFsbFJlc3VsdHMuZmlsdGVyKHIgPT4gIXIuc3VjY2VzcykubGVuZ3RoLFxuICAgICAgdG90YWxTaXplOiBhbGxSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLnNpemUsIDApLFxuICAgICAgb3V0cHV0RGlyZWN0b3J5OiBvdXRwdXREaXIsXG4gICAgICByZXN1bHRzOiBhbGxSZXN1bHRzXG4gICAgfTtcbiAgICBcbiAgICAvLyDjgrXjg57jg6rjg7zooajnpLpcbiAgICBkaXNwbGF5R2VuZXJhdGlvblN1bW1hcnkoc3VtbWFyeSk7XG4gICAgXG4gICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgIGNvbnNvbGUubG9nKGBcXG7ij7HvuI8g5a6f6KGM5pmC6ZaTOiAke2R1cmF0aW9ufW1zYCk7XG4gICAgXG4gICAgaWYgKHN1bW1hcnkuZmFpbHVyZUNvdW50ID4gMCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcbuKaoO+4jyDkuIDpg6jjga7jg5XjgqHjgqTjg6vnlJ/miJDjgavlpLHmlZfjgZfjgb7jgZfjgZ/jgYzjgIHlh6bnkIbjgpLntpnntprjgZfjgb7jgZfjgZ8nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJ1xcbuKchSDpgYvnlKjjgqzjgqTjg4nnlJ/miJDlrozkuobvvIEnKTtcbiAgICB9XG4gICAgXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlR2VuZXJhdGlvbkVycm9yKGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjsgLy8g5YaN44K544Ot44O8XG4gIH1cbn1cblxuLy8g44Oh44Kk44Oz5a6f6KGMXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgZ2VuZXJhdGVPcGVyYXRpb25hbEd1aWRlcygpLmNhdGNoKGVycm9yID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCdGYXRhbCBlcnJvcjonLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9KTtcbn1cblxuZXhwb3J0IHsgZ2VuZXJhdGVPcGVyYXRpb25hbEd1aWRlcyB9OyJdfQ==