#!/usr/bin/env node
"use strict";
/**
 * 簡単なドキュメント生成システムテスト
 */
Object.defineProperty(exports, "__esModule", { value: true });
const documentation_generator_part2_1 = require("./generators/documentation-generator-part2");
async function simpleTest() {
    console.log('🧪 簡単なテストを開始します...');
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
        console.log('1️⃣ ドキュメント生成器のインスタンス化...');
        const generator = new documentation_generator_part2_1.DocumentationGeneratorPart2(config);
        console.log('   ✅ インスタンス化成功');
        console.log('2️⃣ README生成テスト...');
        console.log('   Part2クラスのメソッド:', Object.getOwnPropertyNames(Object.getPrototypeOf(generator)));
        console.log('   基底クラスのメソッド:', Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(generator))));
        // 直接メソッドを呼び出してみる
        try {
            const readmeContent = generator.generateMainReadme();
            console.log(`   📄 README: ${readmeContent.length} 文字`);
            console.log('   ✅ README生成成功');
        }
        catch (error) {
            console.log('   ❌ README生成エラー:', error.message);
        }
        console.log('');
        console.log('🎉 簡単なテストが正常に完了しました！');
    }
    catch (error) {
        console.error('❌ テスト実行エラー:', error.message);
        process.exit(1);
    }
}
if (require.main === module) {
    simpleTest();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlLXRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaW1wbGUtdGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBOztHQUVHOztBQUdILDhGQUF5RjtBQUV6RixLQUFLLFVBQVUsVUFBVTtJQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFFbEMsSUFBSSxDQUFDO1FBQ0gsU0FBUztRQUNULE1BQU0sTUFBTSxHQUF3QjtZQUNsQyxXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLGVBQWUsRUFBRSxhQUFhO1lBQzlCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLDRCQUE0QixFQUFFLElBQUk7WUFDbEMsbUJBQW1CLEVBQUUsSUFBSTtZQUN6Qix5QkFBeUIsRUFBRSxJQUFJO1lBQy9CLG1CQUFtQixFQUFFLElBQUk7WUFDekIsa0JBQWtCLEVBQUUsS0FBSztZQUN6QixPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUM7U0FDdEIsQ0FBQztRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUN4QyxNQUFNLFNBQVMsR0FBRyxJQUFJLDJEQUEyQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUU5QixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRW5ILGlCQUFpQjtRQUNqQixJQUFJLENBQUM7WUFDSCxNQUFNLGFBQWEsR0FBSSxTQUFpQixDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDOUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7WUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBRXRDLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztBQUNILENBQUM7QUFFRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7SUFDNUIsVUFBVSxFQUFFLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqIOewoeWNmOOBquODieOCreODpeODoeODs+ODiOeUn+aIkOOCt+OCueODhuODoOODhuOCueODiFxuICovXG5cbmltcG9ydCB7IERvY3VtZW50YXRpb25Db25maWcgfSBmcm9tICcuL2dlbmVyYXRvcnMvZG9jdW1lbnRhdGlvbi1nZW5lcmF0b3InO1xuaW1wb3J0IHsgRG9jdW1lbnRhdGlvbkdlbmVyYXRvclBhcnQyIH0gZnJvbSAnLi9nZW5lcmF0b3JzL2RvY3VtZW50YXRpb24tZ2VuZXJhdG9yLXBhcnQyJztcblxuYXN5bmMgZnVuY3Rpb24gc2ltcGxlVGVzdCgpIHtcbiAgY29uc29sZS5sb2coJ/Cfp6og57Ch5Y2Y44Gq44OG44K544OI44KS6ZaL5aeL44GX44G+44GZLi4uJyk7XG5cbiAgdHJ5IHtcbiAgICAvLyDjg4bjgrnjg4jnlKjoqK3lrppcbiAgICBjb25zdCBjb25maWc6IERvY3VtZW50YXRpb25Db25maWcgPSB7XG4gICAgICBwcm9qZWN0TmFtZTogJ1JBRyBTeXN0ZW0gVGVzdCcsXG4gICAgICB2ZXJzaW9uOiAnMS4wLjAtdGVzdCcsXG4gICAgICBvdXRwdXREaXJlY3Rvcnk6ICcuL3Rlc3QtZG9jcycsXG4gICAgICBnZW5lcmF0ZUFwaURvY3M6IHRydWUsXG4gICAgICBnZW5lcmF0ZUFyY2hpdGVjdHVyZURpYWdyYW1zOiB0cnVlLFxuICAgICAgZ2VuZXJhdGVUZXN0UmVwb3J0czogdHJ1ZSxcbiAgICAgIGdlbmVyYXRlT3BlcmF0aW9uYWxHdWlkZXM6IHRydWUsXG4gICAgICBpbmNsdWRlQ29kZUV4YW1wbGVzOiB0cnVlLFxuICAgICAgaW5jbHVkZVNjcmVlbnNob3RzOiBmYWxzZSxcbiAgICAgIGZvcm1hdHM6IFsnbWFya2Rvd24nXVxuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZygnMe+4j+KDoyDjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDlmajjga7jgqTjg7Pjgrnjgr/jg7PjgrnljJYuLi4nKTtcbiAgICBjb25zdCBnZW5lcmF0b3IgPSBuZXcgRG9jdW1lbnRhdGlvbkdlbmVyYXRvclBhcnQyKGNvbmZpZyk7XG4gICAgY29uc29sZS5sb2coJyAgIOKchSDjgqTjg7Pjgrnjgr/jg7PjgrnljJbmiJDlip8nKTtcblxuICAgIGNvbnNvbGUubG9nKCcy77iP4oOjIFJFQURNReeUn+aIkOODhuOCueODiC4uLicpO1xuICAgIGNvbnNvbGUubG9nKCcgICBQYXJ0MuOCr+ODqeOCueOBruODoeOCveODg+ODiTonLCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QuZ2V0UHJvdG90eXBlT2YoZ2VuZXJhdG9yKSkpO1xuICAgIGNvbnNvbGUubG9nKCcgICDln7rlupXjgq/jg6njgrnjga7jg6Hjgr3jg4Pjg4k6JywgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZihnZW5lcmF0b3IpKSkpO1xuICAgIFxuICAgIC8vIOebtOaOpeODoeOCveODg+ODieOCkuWRvOOBs+WHuuOBl+OBpuOBv+OCi1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZWFkbWVDb250ZW50ID0gKGdlbmVyYXRvciBhcyBhbnkpLmdlbmVyYXRlTWFpblJlYWRtZSgpO1xuICAgICAgY29uc29sZS5sb2coYCAgIPCfk4QgUkVBRE1FOiAke3JlYWRtZUNvbnRlbnQubGVuZ3RofSDmloflrZdgKTtcbiAgICAgIGNvbnNvbGUubG9nKCcgICDinIUgUkVBRE1F55Sf5oiQ5oiQ5YqfJyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCcgICDinYwgUkVBRE1F55Sf5oiQ44Ko44Op44O8OicsIGVycm9yLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygn8J+OiSDnsKHljZjjgarjg4bjgrnjg4jjgYzmraPluLjjgavlrozkuobjgZfjgb7jgZfjgZ/vvIEnKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDjg4bjgrnjg4jlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBzaW1wbGVUZXN0KCk7XG59Il19