#!/usr/bin/env node
"use strict";
/**
 * ドキュメント生成システムのテストスクリプト
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDocumentationSystem = testDocumentationSystem;
const documentation_generator_part2_1 = require("./generators/documentation-generator-part2");
const operational_guides_generator_1 = require("./generators/operational-guides-generator");
async function testDocumentationSystem() {
    console.log('🧪 ドキュメント生成システムのテストを開始します...');
    console.log('================================================');
    console.log('');
    try {
        // テスト用設定
        const config = {
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
        const generator = new documentation_generator_part2_1.DocumentationGeneratorPart2(config);
        const operationalGenerator = new operational_guides_generator_1.OperationalGuidesGenerator();
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
    }
    catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1kb2N1bWVudGF0aW9uLXN5c3RlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QtZG9jdW1lbnRhdGlvbi1zeXN0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7R0FFRzs7QUEyRk0sMERBQXVCO0FBeEZoQyw4RkFBeUY7QUFDekYsNEZBQXVGO0FBRXZGLEtBQUssVUFBVSx1QkFBdUI7SUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0RBQWtELENBQUMsQ0FBQztJQUNoRSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRWhCLElBQUksQ0FBQztRQUNILFNBQVM7UUFDVCxNQUFNLE1BQU0sR0FBd0I7WUFDbEMsV0FBVyxFQUFFLGlCQUFpQjtZQUM5QixPQUFPLEVBQUUsWUFBWTtZQUNyQixlQUFlLEVBQUUsYUFBYTtZQUM5QixlQUFlLEVBQUUsSUFBSTtZQUNyQiw0QkFBNEIsRUFBRSxJQUFJO1lBQ2xDLG1CQUFtQixFQUFFLElBQUk7WUFDekIseUJBQXlCLEVBQUUsSUFBSTtZQUMvQixtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO1NBQ3RCLENBQUM7UUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixNQUFNLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztRQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWhCLDBCQUEwQjtRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDM0MsTUFBTSxT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QyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBQ0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7SUFDNUIsdUJBQXVCLEVBQUUsQ0FBQztBQUM1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqIOODieOCreODpeODoeODs+ODiOeUn+aIkOOCt+OCueODhuODoOOBruODhuOCueODiOOCueOCr+ODquODl+ODiFxuICovXG5cbmltcG9ydCB7IERvY3VtZW50YXRpb25Db25maWcgfSBmcm9tICcuL2dlbmVyYXRvcnMvZG9jdW1lbnRhdGlvbi1nZW5lcmF0b3InO1xuaW1wb3J0IHsgRG9jdW1lbnRhdGlvbkdlbmVyYXRvclBhcnQyIH0gZnJvbSAnLi9nZW5lcmF0b3JzL2RvY3VtZW50YXRpb24tZ2VuZXJhdG9yLXBhcnQyJztcbmltcG9ydCB7IE9wZXJhdGlvbmFsR3VpZGVzR2VuZXJhdG9yIH0gZnJvbSAnLi9nZW5lcmF0b3JzL29wZXJhdGlvbmFsLWd1aWRlcy1nZW5lcmF0b3InO1xuXG5hc3luYyBmdW5jdGlvbiB0ZXN0RG9jdW1lbnRhdGlvblN5c3RlbSgpIHtcbiAgY29uc29sZS5sb2coJ/Cfp6og44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ44K344K544OG44Og44Gu44OG44K544OI44KS6ZaL5aeL44GX44G+44GZLi4uJyk7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgY29uc29sZS5sb2coJycpO1xuXG4gIHRyeSB7XG4gICAgLy8g44OG44K544OI55So6Kit5a6aXG4gICAgY29uc3QgY29uZmlnOiBEb2N1bWVudGF0aW9uQ29uZmlnID0ge1xuICAgICAgcHJvamVjdE5hbWU6ICdSQUcgU3lzdGVtIFRlc3QnLFxuICAgICAgdmVyc2lvbjogJzEuMC4wLXRlc3QnLFxuICAgICAgb3V0cHV0RGlyZWN0b3J5OiAnLi90ZXN0LWRvY3MnLFxuICAgICAgZ2VuZXJhdGVBcGlEb2NzOiB0cnVlLFxuICAgICAgZ2VuZXJhdGVBcmNoaXRlY3R1cmVEaWFncmFtczogdHJ1ZSxcbiAgICAgIGdlbmVyYXRlVGVzdFJlcG9ydHM6IHRydWUsXG4gICAgICBnZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzOiB0cnVlLFxuICAgICAgaW5jbHVkZUNvZGVFeGFtcGxlczogdHJ1ZSxcbiAgICAgIGluY2x1ZGVTY3JlZW5zaG90czogZmFsc2UsXG4gICAgICBmb3JtYXRzOiBbJ21hcmtkb3duJ11cbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ/Cfk4sg44OG44K544OI6Kit5a6aOicpO1xuICAgIGNvbnNvbGUubG9nKGAgICDjg5fjg63jgrjjgqfjgq/jg4g6ICR7Y29uZmlnLnByb2plY3ROYW1lfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6o6ICR7Y29uZmlnLm91dHB1dERpcmVjdG9yeX1gKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG5cbiAgICAvLyAxLiDjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDlmajjga7jgqTjg7Pjgrnjgr/jg7PjgrnljJbjg4bjgrnjg4hcbiAgICBjb25zb2xlLmxvZygnMe+4j+KDoyDjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDlmajjga7jgqTjg7Pjgrnjgr/jg7PjgrnljJbjg4bjgrnjg4guLi4nKTtcbiAgICBjb25zdCBnZW5lcmF0b3IgPSBuZXcgRG9jdW1lbnRhdGlvbkdlbmVyYXRvclBhcnQyKGNvbmZpZyk7XG4gICAgY29uc3Qgb3BlcmF0aW9uYWxHZW5lcmF0b3IgPSBuZXcgT3BlcmF0aW9uYWxHdWlkZXNHZW5lcmF0b3IoKTtcbiAgICBjb25zb2xlLmxvZygnICAg4pyFIOOCpOODs+OCueOCv+ODs+OCueWMluaIkOWKnycpO1xuXG4gICAgLy8gMi4g6YGL55So44Ks44Kk44OJ55Sf5oiQ44OG44K544OIXG4gICAgY29uc29sZS5sb2coJzLvuI/ig6Mg6YGL55So44Ks44Kk44OJ55Sf5oiQ44OG44K544OILi4uJyk7XG4gICAgY29uc3QgdHJvdWJsZXNob290aW5nR3VpZGUgPSBvcGVyYXRpb25hbEdlbmVyYXRvci5nZW5lcmF0ZVRyb3VibGVzaG9vdGluZ0d1aWRlKCk7XG4gICAgY29uc3Qgb3BlcmF0aW9uYWxDaGVja2xpc3QgPSBvcGVyYXRpb25hbEdlbmVyYXRvci5nZW5lcmF0ZU9wZXJhdGlvbmFsQ2hlY2tsaXN0KCk7XG4gICAgY29uc3QgbW9uaXRvcmluZ0d1aWRlID0gb3BlcmF0aW9uYWxHZW5lcmF0b3IuZ2VuZXJhdGVNb25pdG9yaW5nR3VpZGUoKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgICAg8J+TliDjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4k6ICR7dHJvdWJsZXNob290aW5nR3VpZGUubGVuZ3RofSDmloflrZdgKTtcbiAgICBjb25zb2xlLmxvZyhgICAg8J+TiyDpgYvnlKjjg4Hjgqfjg4Pjgq/jg6rjgrnjg4g6ICR7b3BlcmF0aW9uYWxDaGVja2xpc3QubGVuZ3RofSDmloflrZdgKTtcbiAgICBjb25zb2xlLmxvZyhgICAg8J+TiiDnm6PoppbjgqzjgqTjg4k6ICR7bW9uaXRvcmluZ0d1aWRlLmxlbmd0aH0g5paH5a2XYCk7XG4gICAgY29uc29sZS5sb2coJyAgIOKchSDpgYvnlKjjgqzjgqTjg4nnlJ/miJDmiJDlip8nKTtcblxuICAgIC8vIDMuIOWfuuacrOODieOCreODpeODoeODs+ODiOeUn+aIkOODhuOCueODiFxuICAgIGNvbnNvbGUubG9nKCcz77iP4oOjIOWfuuacrOODieOCreODpeODoeODs+ODiOeUn+aIkOODhuOCueODiC4uLicpO1xuICAgIGNvbnN0IHJlYWRtZUNvbnRlbnQgPSBnZW5lcmF0b3IuZ2VuZXJhdGVNYWluUmVhZG1lKCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coYCAgIPCfk4QgUkVBRE1FOiAke3JlYWRtZUNvbnRlbnQubGVuZ3RofSDmloflrZdgKTtcbiAgICBjb25zb2xlLmxvZygnICAg4pyFIOWfuuacrOODieOCreODpeODoeODs+ODiOeUn+aIkOaIkOWKnycpO1xuXG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCfwn46JIOWFqOODhuOCueODiOOBjOato+W4uOOBq+WujOS6huOBl+OBvuOBl+OBn++8gScpO1xuICAgIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJ/Cfk4og44OG44K544OI57WQ5p6c44K144Oe44Oq44O8OicpO1xuICAgIGNvbnNvbGUubG9nKCcgICDinIUg44Kk44Oz44K544K/44Oz44K55YyWOiDmiJDlip8nKTtcbiAgICBjb25zb2xlLmxvZygnICAg4pyFIOmBi+eUqOOCrOOCpOODieeUn+aIkDog5oiQ5YqfJyk7XG4gICAgY29uc29sZS5sb2coJyAgIOKchSDln7rmnKzjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJA6IOaIkOWKnycpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygn8J+SoSDmrKHjga7jgrnjg4bjg4Pjg5c6Jyk7XG4gICAgY29uc29sZS5sb2coJyAgIG5wbSBydW4gZG9jczpnZW5lcmF0ZSDjgafjg5Xjg6vjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDjgpLlrp/ooYwnKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCcnKTtcbiAgICBjb25zb2xlLmVycm9yKCfinYwg44OG44K544OI5a6f6KGM44Ko44Op44O8OicpO1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIGNvbnNvbGUuZXJyb3IoJycpO1xuICAgIGNvbnNvbGUuZXJyb3IoJ/CflI0g44OH44OQ44OD44Kw5oOF5aCxOicpO1xuICAgIGNvbnNvbGUuZXJyb3IoYCAgIOOCqOODqeODvOOCv+OCpOODlzogJHtlcnJvci5jb25zdHJ1Y3Rvci5uYW1lfWApO1xuICAgIGNvbnNvbGUuZXJyb3IoYCAgIOOCqOODqeODvOODoeODg+OCu+ODvOOCuDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgIGlmIChlcnJvci5zdGFjaykge1xuICAgICAgY29uc29sZS5lcnJvcihgICAg44K544K/44OD44Kv44OI44Os44O844K5OiAke2Vycm9yLnN0YWNrLnNwbGl0KCdcXG4nKS5zbGljZSgwLCA1KS5qb2luKCdcXG4nKX1gKTtcbiAgICB9XG4gICAgY29uc29sZS5lcnJvcignJyk7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbi8qKlxuICog44Oh44Kk44Oz5a6f6KGMXG4gKi9cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICB0ZXN0RG9jdW1lbnRhdGlvblN5c3RlbSgpO1xufVxuXG5leHBvcnQgeyB0ZXN0RG9jdW1lbnRhdGlvblN5c3RlbSB9OyJdfQ==