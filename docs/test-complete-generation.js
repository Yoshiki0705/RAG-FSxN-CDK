#!/usr/bin/env node
"use strict";
/**
 * 完全なドキュメント生成システムのテスト
 * 全ての生成器を統合してテスト実行
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCompleteGeneration = testCompleteGeneration;
const generate_documentation_1 = require("./generate-documentation");
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
        await (0, generate_documentation_1.generateDocumentation)();
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
    }
    catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1jb21wbGV0ZS1nZW5lcmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGVzdC1jb21wbGV0ZS1nZW5lcmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7OztHQUdHOztBQWlFTSx3REFBc0I7QUEvRC9CLHFFQUFpRTtBQUVqRSxLQUFLLFVBQVUsc0JBQXNCO0lBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsQ0FBQztJQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7SUFDdkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVoQixJQUFJLENBQUM7UUFDSCxVQUFVO1FBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEdBQUcsNkJBQTZCLENBQUM7UUFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLHVCQUF1QixDQUFDO1FBRWpELE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWhCLGNBQWM7UUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbEMsTUFBTSxJQUFBLDhDQUFxQixHQUFFLENBQUM7UUFFOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1FBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUVoQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JCLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFbEIsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFLENBQUM7WUFDM0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QixPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDM0MsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUM5QyxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTO0FBQ1QsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzVCLHNCQUFzQixFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3JDLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICog5a6M5YWo44Gq44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ44K344K544OG44Og44Gu44OG44K544OIXG4gKiDlhajjgabjga7nlJ/miJDlmajjgpLntbHlkIjjgZfjgabjg4bjgrnjg4jlrp/ooYxcbiAqL1xuXG5pbXBvcnQgeyBnZW5lcmF0ZURvY3VtZW50YXRpb24gfSBmcm9tICcuL2dlbmVyYXRlLWRvY3VtZW50YXRpb24nO1xuXG5hc3luYyBmdW5jdGlvbiB0ZXN0Q29tcGxldGVHZW5lcmF0aW9uKCkge1xuICBjb25zb2xlLmxvZygn8J+nqiDlrozlhajjgarjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDjgrfjgrnjg4bjg6Djga7jg4bjgrnjg4jjgpLplovlp4vjgZfjgb7jgZkuLi4nKTtcbiAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgY29uc29sZS5sb2coJycpO1xuXG4gIHRyeSB7XG4gICAgLy8g55Kw5aKD5aSJ5pWw44Gu6Kit5a6aXG4gICAgcHJvY2Vzcy5lbnYuUFJPSkVDVF9OQU1FID0gJ1Blcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbSc7XG4gICAgcHJvY2Vzcy5lbnYuUFJPSkVDVF9WRVJTSU9OID0gJzEuMC4wJztcbiAgICBwcm9jZXNzLmVudi5PVVRQVVRfRElSID0gJy4vdGVzdC1nZW5lcmF0ZWQtZG9jcyc7XG5cbiAgICBjb25zb2xlLmxvZygn8J+UpyDjg4bjgrnjg4joqK3lrpo6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIOODl+ODreOCuOOCp+OCr+ODiOWQjTogJHtwcm9jZXNzLmVudi5QUk9KRUNUX05BTUV9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOODkOODvOOCuOODp+ODszogJHtwcm9jZXNzLmVudi5QUk9KRUNUX1ZFUlNJT059YCk7XG4gICAgY29uc29sZS5sb2coYCAgIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODqjogJHtwcm9jZXNzLmVudi5PVVRQVVRfRElSfWApO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcblxuICAgIC8vIOODieOCreODpeODoeODs+ODiOeUn+aIkOOBruWun+ihjFxuICAgIGNvbnNvbGUubG9nKCfwn5OaIOODieOCreODpeODoeODs+ODiOeUn+aIkOOCkuWun+ihjOS4rS4uLicpO1xuICAgIGF3YWl0IGdlbmVyYXRlRG9jdW1lbnRhdGlvbigpO1xuXG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCfinIUg44OG44K544OI5a6M5LqG77yBJyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OLIOeUn+aIkOOBleOCjOOBn+ODieOCreODpeODoeODs+ODiOOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhDonKTtcbiAgICBjb25zb2xlLmxvZygnICAgLSBBUEkg44OJ44Kt44Ol44Oh44Oz44OIJyk7XG4gICAgY29uc29sZS5sb2coJyAgIC0g44Ki44O844Kt44OG44Kv44OB44Oj5ZuzJyk7XG4gICAgY29uc29sZS5sb2coJyAgIC0g44OG44K544OI44Os44Od44O844OIJyk7XG4gICAgY29uc29sZS5sb2coJyAgIC0g6YGL55So44Ks44Kk44OJ77yI44OI44Op44OW44Or44K344Ol44O844OG44Kj44Oz44Kw44CB44OB44Kn44OD44Kv44Oq44K544OI44CB55uj6KaW77yJJyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCfwn46vIOasoeOBruOCueODhuODg+ODlzonKTtcbiAgICBjb25zb2xlLmxvZygnICAgMS4g55Sf5oiQ44GV44KM44Gf44OJ44Kt44Ol44Oh44Oz44OI44Gu5YaF5a6556K66KqNJyk7XG4gICAgY29uc29sZS5sb2coJyAgIDIuIOW/heimgeOBq+W/nOOBmOOBpuaJi+WLleiqv+aVtCcpO1xuICAgIGNvbnNvbGUubG9nKCcgICAzLiDmnKznlarnkrDlooPjgafjga7lrp/ooYwnKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJycpO1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg4bjgrnjg4jlpLHmlZc6Jyk7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgY29uc29sZS5lcnJvcignJyk7XG4gICAgXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+OCqOODqeODvOips+e0sDonKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCAg44Oh44OD44K744O844K4OiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICBpZiAoZXJyb3Iuc3RhY2spIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgICDjgrnjgr/jg4Pjgq/jg4jjg6zjg7zjgrk6ICR7ZXJyb3Iuc3RhY2t9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxufVxuXG4vLyDjg4bjgrnjg4jjga7lrp/ooYxcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICB0ZXN0Q29tcGxldGVHZW5lcmF0aW9uKCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+S6iOacn+OBl+OBquOBhOOCqOODqeODvOOBjOeZuueUn+OBl+OBvuOBl+OBnzonLCBlcnJvcik7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9KTtcbn1cblxuZXhwb3J0IHsgdGVzdENvbXBsZXRlR2VuZXJhdGlvbiB9OyJdfQ==