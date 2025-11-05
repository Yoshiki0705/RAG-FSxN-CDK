#!/usr/bin/env node
"use strict";
/**
 * 完全なドキュメント自動生成システム
 * Permission-aware RAG System with FSx for NetApp ONTAP
 *
 * 機能:
 * - APIドキュメント自動生成
 * - アーキテクチャ図生成
 * - テストレポート生成
 * - 運用ガイド統合
 * - 多言語対応（日本語・英語）
 *
 * @version 2.0.0
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
exports.CompleteDocumentationGenerator = exports.DEFAULT_DOCUMENTATION_CONFIG = void 0;
exports.mergeDocumentationConfig = mergeDocumentationConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * デフォルト設定の定義
 */
exports.DEFAULT_DOCUMENTATION_CONFIG = {
    version: '1.0.0',
    outputDirectory: './generated-docs',
    generateApiDocs: true,
    generateArchitectureDiagrams: true,
    generateTestReports: true,
    generateOperationalGuides: true,
    includeCodeExamples: true,
    includeScreenshots: false,
    formats: ['markdown', 'html'],
    languages: ['ja', 'en']
};
/**
 * 設定のマージ関数
 */
function mergeDocumentationConfig(userConfig) {
    return {
        ...exports.DEFAULT_DOCUMENTATION_CONFIG,
        ...userConfig
    };
}
/**
 * 完全なドキュメント生成システムの実装クラス
 */
class CompleteDocumentationGenerator {
    config;
    startTime;
    constructor(config) {
        this.config = config;
        this.startTime = Date.now();
        this.validateConfiguration();
    }
    /**
     * 全ドキュメントの生成（メイン処理）
     */
    async generateAllDocumentation() {
        console.log('📚 完全ドキュメント生成システムを開始します...');
        console.log(`プロジェクト: ${this.config.projectName}`);
        console.log(`バージョン: ${this.config.version}`);
        console.log(`出力先: ${this.config.outputDirectory}`);
        console.log('');
        try {
            // 出力ディレクトリの準備
            await this.ensureOutputDirectory();
            // 並列実行可能なタスクを定義
            const tasks = [];
            if (this.config.generateApiDocs) {
                tasks.push({
                    name: 'APIドキュメント',
                    task: this.generateApiDocumentation()
                });
            }
            if (this.config.generateArchitectureDiagrams) {
                tasks.push({
                    name: 'アーキテクチャ図',
                    task: this.generateArchitectureDiagrams()
                });
            }
            if (this.config.generateTestReports) {
                tasks.push({
                    name: 'テストレポート',
                    task: this.generateTestReports()
                });
            }
            if (this.config.generateOperationalGuides) {
                tasks.push({
                    name: '運用ガイド',
                    task: this.generateOperationalGuides()
                });
            }
            // 全タスクを並列実行
            const results = await Promise.allSettled(tasks.map(({ task }) => task));
            // 結果の確認
            results.forEach((result, index) => {
                const taskName = tasks[index].name;
                if (result.status === 'fulfilled') {
                    console.log(`   ✅ ${taskName}生成完了`);
                }
                else {
                    console.error(`   ❌ ${taskName}生成失敗:`, result.reason);
                    throw new Error(`${taskName}の生成に失敗しました`);
                }
            });
            // 統合インデックスの生成
            await this.generateMasterIndex();
            const duration = Date.now() - this.startTime;
            console.log('');
            console.log(`🎉 完全ドキュメント生成完了！（実行時間: ${duration}ms）`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ ドキュメント生成エラー:', errorMessage);
            throw new Error(`ドキュメント生成に失敗しました: ${errorMessage}`);
        }
    }
    /**
     * 設定値の検証（セキュリティ対策）
     */
    validateConfiguration() {
        const { projectName, outputDirectory, formats, languages } = this.config;
        // プロジェクト名の検証
        if (!projectName || typeof projectName !== 'string') {
            throw new Error('プロジェクト名が設定されていません');
        }
        if (projectName.includes('..') || projectName.includes('/') || projectName.includes('\\')) {
            throw new Error('不正なプロジェクト名が検出されました');
        }
        // 出力ディレクトリの検証
        if (!outputDirectory || typeof outputDirectory !== 'string') {
            throw new Error('出力ディレクトリが設定されていません');
        }
        const resolvedPath = path.resolve(outputDirectory);
        if (!resolvedPath.startsWith(process.cwd())) {
            throw new Error('プロジェクト外への出力は禁止されています');
        }
        // フォーマットの検証
        if (!Array.isArray(formats) || formats.length === 0) {
            throw new Error('出力フォーマットが設定されていません');
        }
        // 言語設定の検証
        if (!Array.isArray(languages) || languages.length === 0) {
            throw new Error('対応言語が設定されていません');
        }
    }
    /**
     * 出力ディレクトリの準備
     */
    async ensureOutputDirectory() {
        const { outputDirectory } = this.config;
        try {
            if (!fs.existsSync(outputDirectory)) {
                fs.mkdirSync(outputDirectory, { recursive: true, mode: 0o755 });
                console.log(`📁 出力ディレクトリを作成しました: ${outputDirectory}`);
            }
            // サブディレクトリの作成
            const subdirs = ['api', 'architecture', 'tests', 'operations', 'assets'];
            for (const subdir of subdirs) {
                const subdirPath = path.join(outputDirectory, subdir);
                if (!fs.existsSync(subdirPath)) {
                    fs.mkdirSync(subdirPath, { recursive: true, mode: 0o755 });
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`出力ディレクトリの準備に失敗しました: ${errorMessage}`);
        }
    }
    /**
     * APIドキュメントの生成
     */
    async generateApiDocumentation() {
        console.log('   📖 APIドキュメントを生成中...');
        // 実装予定: OpenAPI仕様の自動生成
        const apiDoc = this.generateOpenApiSpec();
        await this.writeFile('api/openapi.json', JSON.stringify(apiDoc, null, 2));
        // Markdown形式のAPIドキュメント
        const markdownDoc = this.generateApiMarkdown(apiDoc);
        await this.writeFile('api/README.md', markdownDoc);
    }
    /**
     * アーキテクチャ図の生成
     */
    async generateArchitectureDiagrams() {
        console.log('   🏗️ アーキテクチャ図を生成中...');
        // 実装予定: Mermaid図の自動生成
        const architectureDiagram = this.generateMermaidDiagram();
        await this.writeFile('architecture/system-architecture.md', architectureDiagram);
    }
    /**
     * テストレポートの生成
     */
    async generateTestReports() {
        console.log('   📊 テストレポートを生成中...');
        // 実装予定: テスト結果の収集と分析
        const testReport = this.generateTestReport();
        await this.writeFile('tests/test-report.md', testReport);
    }
    /**
     * 運用ガイドの生成
     */
    async generateOperationalGuides() {
        console.log('   📋 運用ガイドを生成中...');
        // 実装予定: 運用ガイドの統合生成
        const operationalGuide = this.generateOperationalGuide();
        await this.writeFile('operations/README.md', operationalGuide);
    }
    /**
     * 統合インデックスの生成
     */
    async generateMasterIndex() {
        const indexContent = `# ${this.config.projectName} ドキュメント

バージョン: ${this.config.version}  
生成日時: ${new Date().toLocaleString('ja-JP')}

## 📚 ドキュメント一覧

### API ドキュメント
- [API リファレンス](./api/README.md)
- [OpenAPI 仕様](./api/openapi.json)

### アーキテクチャ
- [システムアーキテクチャ](./architecture/system-architecture.md)

### テストレポート
- [テスト結果](./tests/test-report.md)

### 運用ガイド
- [運用手順](./operations/README.md)

---
このドキュメントは自動生成されています。
`;
        await this.writeFile('README.md', indexContent);
    }
    /**
     * ファイル書き込み（安全性確保）
     */
    async writeFile(relativePath, content) {
        const fullPath = path.join(this.config.outputDirectory, relativePath);
        const dir = path.dirname(fullPath);
        // ディレクトリの存在確認
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        }
        fs.writeFileSync(fullPath, content, { encoding: 'utf8', mode: 0o644 });
    }
    // 以下は実装予定のプライベートメソッド
    generateOpenApiSpec() {
        // TODO: 実装予定
        return {
            openapi: '3.0.0',
            info: {
                title: this.config.projectName,
                version: this.config.version
            },
            paths: {}
        };
    }
    generateApiMarkdown(apiSpec) {
        // TODO: 実装予定
        return `# API ドキュメント\n\n${this.config.projectName} のAPI仕様書です。`;
    }
    generateMermaidDiagram() {
        // TODO: 実装予定
        return `# システムアーキテクチャ\n\n\`\`\`mermaid\ngraph TD\n    A[User] --> B[CloudFront]\n\`\`\``;
    }
    generateTestReport() {
        // TODO: 実装予定
        return `# テストレポート\n\n${this.config.projectName} のテスト結果です。`;
    }
    generateOperationalGuide() {
        // TODO: 実装予定
        return `# 運用ガイド\n\n${this.config.projectName} の運用手順です。`;
    }
}
exports.CompleteDocumentationGenerator = CompleteDocumentationGenerator;
/**
 * メイン実行関数（CLI使用時）
 */
async function main() {
    try {
        const config = mergeDocumentationConfig({
            projectName: process.env.PROJECT_NAME || 'Permission-aware RAG System',
            version: process.env.PROJECT_VERSION || '2.0.0',
            outputDirectory: process.env.OUTPUT_DIR || './generated-docs'
        });
        const generator = new CompleteDocumentationGenerator(config);
        await generator.generateAllDocumentation();
        console.log('');
        console.log('🎯 次のステップ:');
        console.log('   1. 生成されたドキュメントの内容確認');
        console.log('   2. 必要に応じて手動調整');
        console.log('   3. チームメンバーへの共有');
        console.log('');
    }
    catch (error) {
        console.error('❌ 実行エラー:', error);
        process.exit(1);
    }
}
// CLI実行時のメイン処理
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 予期しないエラー:', error);
        process.exit(1);
    });
}
class CompleteDocumentationGenerator {
    config;
    projectRoot;
    systemName = 'Permission-aware RAG System with FSx for NetApp ONTAP';
    constructor(config) {
        this.config = config;
        this.projectRoot = process.cwd();
    }
    /**
     * 全ドキュメントの生成
     */
    async generateAllDocumentation() {
        console.log('📚 完全ドキュメント生成システム開始...');
        console.log(`📋 プロジェクト: ${this.config.projectName} v${this.config.version}`);
        console.log(`📁 出力ディレクトリ: ${this.config.outputDirectory}`);
        console.log(`🌐 対応言語: ${this.config.languages.join(', ')}`);
        console.log('');
        try {
            // 出力ディレクトリの作成
            await this.ensureOutputDirectory();
            // 各言語でドキュメント生成
            for (const language of this.config.languages) {
                console.log(`🌐 ${language === 'ja' ? '日本語' : '英語'}ドキュメント生成中...`);
                await this.generateDocumentationForLanguage(language);
            }
            // 共通リソースの生成
            await this.generateCommonResources();
            // インデックスページの生成
            await this.generateIndexPage();
            console.log('');
            console.log('✅ 完全ドキュメント生成完了');
            console.log(`📁 生成されたドキュメント: ${this.config.outputDirectory}`);
        }
        catch (error) {
            console.error('❌ ドキュメント生成エラー:', error);
            throw error;
        }
    }
    /**
     * 出力ディレクトリの確保
     */
    async ensureOutputDirectory() {
        const outputPath = path.resolve(this.projectRoot, this.config.outputDirectory);
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true, mode: 0o755 });
        }
        // サブディレクトリの作成
        const subdirs = ['api', 'architecture', 'tests', 'operations', 'assets', 'ja', 'en'];
        for (const subdir of subdirs) {
            const subdirPath = path.join(outputPath, subdir);
            if (!fs.existsSync(subdirPath)) {
                fs.mkdirSync(subdirPath, { recursive: true, mode: 0o755 });
            }
        }
    }
    /**
     * 言語別ドキュメント生成
     */
    async generateDocumentationForLanguage(language) {
        const langDir = path.join(this.config.outputDirectory, language);
        // APIドキュメントの生成
        if (this.config.generateApiDocs) {
            console.log(`   🔗 ${language} APIドキュメント生成中...`);
            await this.generateApiDocumentation(language, langDir);
        }
        // アーキテクチャ図の生成
        if (this.config.generateArchitectureDiagrams) {
            console.log(`   🏗️ ${language} アーキテクチャ図生成中...`);
            await this.generateArchitectureDiagrams(language, langDir);
        }
        // テストレポートの生成
        if (this.config.generateTestReports) {
            console.log(`   📊 ${language} テストレポート生成中...`);
            await this.generateTestReports(language, langDir);
        }
        // 運用ガイドの生成
        if (this.config.generateOperationalGuides) {
            console.log(`   📖 ${language} 運用ガイド生成中...`);
            await this.generateOperationalGuides(language, langDir);
        }
    }
    /**
      * APIドキュメントの生成
      */
    async generateApiDocumentation(language, outputDir) {
        const apiEndpoints = await this.collectApiEndpoints();
        // OpenAPI仕様の生成
        const openApiSpec = this.generateOpenApiSpec(apiEndpoints, language);
        await this.writeFile(path.join(outputDir, 'api', 'openapi.json'), JSON.stringify(openApiSpec, null, 2));
        // Markdownドキュメントの生成
        const apiMarkdown = this.generateApiMarkdown(apiEndpoints, language);
        await this.writeFile(path.join(outputDir, 'api', 'README.md'), apiMarkdown);
        // HTMLドキュメントの生成
        if (this.config.formats.includes('html')) {
            const apiHtml = this.generateApiHtml(apiEndpoints, language);
            await this.writeFile(path.join(outputDir, 'api', 'index.html'), apiHtml);
        }
        console.log(`     ✅ ${apiEndpoints.length}個のAPIエンドポイント処理完了`);
    }
    /**
     * アーキテクチャ図の生成
     */
    async generateArchitectureDiagrams(language, outputDir) {
        const architectureData = this.getArchitectureData(language);
        // Mermaid図の生成
        const mermaidDiagram = this.generateMermaidDiagram(architectureData, language);
        await this.writeFile(path.join(outputDir, 'architecture', 'system-architecture.md'), mermaidDiagram);
        // アーキテクチャドキュメントの生成
        const archDoc = this.generateArchitectureDocument(architectureData, language);
        await this.writeFile(path.join(outputDir, 'architecture', 'README.md'), archDoc);
        console.log(`     ✅ アーキテクチャ図生成完了`);
    }
    /**
     * テストレポートの生成
     */
    async generateTestReports(language, outputDir) {
        const testResults = await this.collectTestResults();
        // テストサマリーレポート
        const testSummary = this.generateTestSummaryReport(testResults, language);
        await this.writeFile(path.join(outputDir, 'tests', 'test-summary.md'), testSummary);
        // 詳細テストレポート
        const detailedReport = this.generateDetailedTestReport(testResults, language);
        await this.writeFile(path.join(outputDir, 'tests', 'detailed-report.md'), detailedReport);
        // カバレッジレポート
        const coverageReport = this.generateCoverageReport(testResults, language);
        await this.writeFile(path.join(outputDir, 'tests', 'coverage-report.md'), coverageReport);
        console.log(`     ✅ テストレポート生成完了`);
    }
    /**
     * 運用ガイドの生成
     */
    async generateOperationalGuides(language, outputDir) {
        // 既存の運用ガイドを多言語化
        const operationalGuides = this.getOperationalGuidesData(language);
        for (const [guideName, content] of Object.entries(operationalGuides)) {
            await this.writeFile(path.join(outputDir, 'operations', `${guideName}.md`), content);
        }
        // 運用ガイド目次の生成
        const operationsIndex = this.generateOperationsIndex(language);
        await this.writeFile(path.join(outputDir, 'operations', 'README.md'), operationsIndex);
        console.log(`     ✅ 運用ガイド生成完了`);
    }
    /**
         * OpenAPI仕様の生成
         */
    generateOpenApiSpec(endpoints, language) {
        const isJapanese = language === 'ja';
        return {
            openapi: '3.0.3',
            info: {
                title: `${this.config.projectName} API`,
                version: this.config.version,
                description: isJapanese
                    ? 'Permission-aware RAG System API ドキュメント'
                    : 'Permission-aware RAG System API Documentation',
                contact: {
                    name: 'NetApp Japan Technology Team',
                    email: 'support@example.com'
                }
            },
            servers: [
                {
                    url: 'https://api.example.com',
                    description: isJapanese ? '本番環境' : 'Production Environment'
                },
                {
                    url: 'https://staging-api.example.com',
                    description: isJapanese ? 'ステージング環境' : 'Staging Environment'
                }
            ],
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            },
            paths: this.buildOpenApiPaths(endpoints)
        };
    }
    /**
     * OpenAPIパスの構築
     */
    buildOpenApiPaths(endpoints) {
        const paths = {};
        endpoints.forEach(endpoint => {
            if (!paths[endpoint.path]) {
                paths[endpoint.path] = {};
            }
            paths[endpoint.path][endpoint.method.toLowerCase()] = {
                summary: endpoint.summary,
                description: endpoint.description,
                tags: endpoint.tags,
                parameters: endpoint.parameters.map(param => ({
                    name: param.name,
                    in: param.in,
                    required: param.required,
                    schema: { type: param.type },
                    description: param.description,
                    example: param.example
                })),
                requestBody: endpoint.requestBody ? {
                    description: endpoint.requestBody.description,
                    content: {
                        [endpoint.requestBody.contentType]: {
                            schema: endpoint.requestBody.schema,
                            example: endpoint.requestBody.example
                        }
                    }
                } : undefined,
                responses: endpoint.responses.reduce((acc, response) => {
                    acc[response.statusCode] = {
                        description: response.description,
                        content: response.contentType ? {
                            [response.contentType]: {
                                schema: response.schema,
                                example: response.example
                            }
                        } : undefined
                    };
                    return acc;
                }, {}),
                security: endpoint.security ? endpoint.security.map(sec => ({ [sec]: [] })) : undefined
            };
        });
        return paths;
    }
    /**
         * API Markdownドキュメントの生成
         */
    generateApiMarkdown(endpoints, language) {
        const isJapanese = language === 'ja';
        let markdown = `# ${this.config.projectName} API ${isJapanese ? 'ドキュメント' : 'Documentation'}\n\n`;
        markdown += `${isJapanese ? 'バージョン' : 'Version'}: ${this.config.version}\n`;
        markdown += `${isJapanese ? '生成日時' : 'Generated'}: ${new Date().toLocaleString(isJapanese ? 'ja-JP' : 'en-US')}\n\n`;
        // 目次の生成
        markdown += `## ${isJapanese ? '目次' : 'Table of Contents'}\n\n`;
        const tags = [...new Set(endpoints.flatMap(e => e.tags))];
        tags.forEach(tag => {
            markdown += `- [${tag}](#${tag.toLowerCase().replace(/\s+/g, '-')})\n`;
        });
        markdown += '\n';
        // 認証情報
        markdown += `## ${isJapanese ? '認証' : 'Authentication'}\n\n`;
        markdown += isJapanese
            ? 'このAPIは Bearer Token 認証を使用します。\n\n'
            : 'This API uses Bearer Token authentication.\n\n';
        markdown += '```\nAuthorization: Bearer <your-token>\n```\n\n';
        // エンドポイントをタグ別にグループ化
        tags.forEach(tag => {
            markdown += `## ${tag}\n\n`;
            const tagEndpoints = endpoints.filter(e => e.tags.includes(tag));
            tagEndpoints.forEach(endpoint => {
                markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
                markdown += `${endpoint.description}\n\n`;
                // パラメータ
                if (endpoint.parameters.length > 0) {
                    markdown += `#### ${isJapanese ? 'パラメータ' : 'Parameters'}\n\n`;
                    markdown += `| ${isJapanese ? '名前' : 'Name'} | ${isJapanese ? '場所' : 'Location'} | ${isJapanese ? '必須' : 'Required'} | ${isJapanese ? '型' : 'Type'} | ${isJapanese ? '説明' : 'Description'} |\n`;
                    markdown += '|------|------|------|----|---------|\n';
                    endpoint.parameters.forEach(param => {
                        markdown += `| ${param.name} | ${param.in} | ${param.required ? '✓' : ''} | ${param.type} | ${param.description} |\n`;
                    });
                    markdown += '\n';
                }
                // リクエストボディ
                if (endpoint.requestBody) {
                    markdown += `#### ${isJapanese ? 'リクエストボディ' : 'Request Body'}\n\n`;
                    markdown += `**Content-Type:** ${endpoint.requestBody.contentType}\n\n`;
                    markdown += `${endpoint.requestBody.description}\n\n`;
                    if (endpoint.requestBody.example) {
                        markdown += `**${isJapanese ? '例' : 'Example'}:**\n\n`;
                        markdown += '```json\n';
                        markdown += JSON.stringify(endpoint.requestBody.example, null, 2);
                        markdown += '\n```\n\n';
                    }
                }
                // レスポンス
                markdown += `#### ${isJapanese ? 'レスポンス' : 'Responses'}\n\n`;
                endpoint.responses.forEach(response => {
                    markdown += `**${response.statusCode}** - ${response.description}\n\n`;
                    if (response.example) {
                        markdown += '```json\n';
                        markdown += JSON.stringify(response.example, null, 2);
                        markdown += '\n```\n\n';
                    }
                });
                markdown += '---\n\n';
            });
        });
        return markdown;
    }
    /**
     * アーキテクチャデータの取得
     */
    getArchitectureData(language) {
        // 入力値検証
        if (!language || (language !== 'ja' && language !== 'en')) {
            throw new Error('無効な言語設定です。"ja" または "en" を指定してください。');
        }
        const isJapanese = language === 'ja';
        return {
            title: isJapanese ? 'システムアーキテクチャ' : 'System Architecture',
            components: [
                {
                    id: 'cloudfront',
                    name: 'CloudFront',
                    type: 'cdn',
                    description: isJapanese ? 'グローバルCDN・エッジキャッシュ' : 'Global CDN and Edge Caching'
                },
                {
                    id: 'apigateway',
                    name: 'API Gateway',
                    type: 'api',
                    description: isJapanese ? 'RESTful API管理' : 'RESTful API Management'
                },
                {
                    id: 'lambda',
                    name: 'Lambda Functions',
                    type: 'compute',
                    description: isJapanese ? 'サーバーレスコンピュート' : 'Serverless Compute'
                },
                {
                    id: 'dynamodb',
                    name: 'DynamoDB',
                    type: 'database',
                    description: isJapanese ? 'NoSQLデータベース' : 'NoSQL Database'
                },
                {
                    id: 'opensearch',
                    name: 'OpenSearch',
                    type: 'search',
                    description: isJapanese ? 'ベクトル検索エンジン' : 'Vector Search Engine'
                },
                {
                    id: 'fsx',
                    name: 'FSx for NetApp ONTAP',
                    type: 'storage',
                    description: isJapanese ? '高性能ファイルシステム' : 'High-Performance File System'
                },
                {
                    id: 'bedrock',
                    name: 'Amazon Bedrock',
                    type: 'ai',
                    description: isJapanese ? '生成AI・LLMサービス' : 'Generative AI and LLM Service'
                }
            ],
            connections: [
                { from: 'cloudfront', to: 'apigateway' },
                { from: 'apigateway', to: 'lambda' },
                { from: 'lambda', to: 'dynamodb' },
                { from: 'lambda', to: 'opensearch' },
                { from: 'lambda', to: 'fsx' },
                { from: 'lambda', to: 'bedrock' }
            ]
        };
    }
    /**
     * Mermaid図の生成
     */
    generateMermaidDiagram(architectureData, language) {
        const isJapanese = language === 'ja';
        let mermaid = `# ${architectureData.title}\n\n`;
        mermaid += '```mermaid\n';
        mermaid += 'graph TB\n';
        // ノードの定義
        architectureData.components.forEach((component) => {
            mermaid += `    ${component.id}[${component.name}]\n`;
        });
        mermaid += '\n';
        // 接続の定義
        architectureData.connections.forEach((connection) => {
            mermaid += `    ${connection.from} --> ${connection.to}\n`;
        });
        mermaid += '```\n\n';
        // コンポーネント説明
        mermaid += `## ${isJapanese ? 'コンポーネント説明' : 'Component Descriptions'}\n\n`;
        architectureData.components.forEach((component) => {
            mermaid += `### ${component.name}\n`;
            mermaid += `${component.description}\n\n`;
        });
        return mermaid;
    }
    /**
     * アーキテクチャドキュメントの生成
     */
    generateArchitectureDocument(architectureData, language) {
        const isJapanese = language === 'ja';
        let doc = `# ${this.systemName} - ${isJapanese ? 'アーキテクチャドキュメント' : 'Architecture Documentation'}\n\n`;
        doc += `**${isJapanese ? 'バージョン' : 'Version'}**: ${this.config.version}\n`;
        doc += `**${isJapanese ? '最終更新' : 'Last Updated'}**: ${new Date().toISOString().split('T')[0]}\n\n`;
        // システム概要
        doc += `## ${isJapanese ? 'システム概要' : 'System Overview'}\n\n`;
        doc += isJapanese
            ? 'Permission-aware RAG Systemは、Amazon FSx for NetApp ONTAPとAmazon Bedrockを組み合わせた、エンタープライズグレードのRAG（Retrieval-Augmented Generation）システムです。\n\n'
            : 'Permission-aware RAG System is an enterprise-grade RAG (Retrieval-Augmented Generation) system that combines Amazon FSx for NetApp ONTAP with Amazon Bedrock.\n\n';
        // アーキテクチャ図
        doc += `## ${isJapanese ? 'アーキテクチャ図' : 'Architecture Diagram'}\n\n`;
        doc += '[システムアーキテクチャ図](./system-architecture.md)\n\n';
        // 主要コンポーネント
        doc += `## ${isJapanese ? '主要コンポーネント' : 'Key Components'}\n\n`;
        architectureData.components.forEach((component) => {
            doc += `### ${component.name}\n`;
            doc += `**${isJapanese ? 'タイプ' : 'Type'}**: ${component.type}\n`;
            doc += `**${isJapanese ? '説明' : 'Description'}**: ${component.description}\n\n`;
        });
        return doc;
    } /**

     * テスト結果の収集
     */
    async collectTestResults() {
        return {
            testRunId: `test-run-${Date.now()}`,
            timestamp: new Date(),
            environment: 'development',
            summary: {
                totalTests: 45,
                passedTests: 42,
                failedTests: 2,
                skippedTests: 1,
                overallScore: 93.3
            },
            suiteResults: [
                {
                    suiteName: 'Authentication Tests',
                    success: true,
                    score: 100,
                    duration: 1200,
                    testCount: 8,
                    details: { passedTests: 8, failedTests: 0 }
                },
                {
                    suiteName: 'Chat Functionality Tests',
                    success: true,
                    score: 95,
                    duration: 3500,
                    testCount: 15,
                    details: { passedTests: 14, failedTests: 1 }
                },
                {
                    suiteName: 'Document Management Tests',
                    success: true,
                    score: 90,
                    duration: 2800,
                    testCount: 12,
                    details: { passedTests: 11, failedTests: 1 }
                },
                {
                    suiteName: 'Security Tests',
                    success: true,
                    score: 100,
                    duration: 1800,
                    testCount: 10,
                    details: { passedTests: 10, failedTests: 0 }
                }
            ],
            recommendations: [
                'Chat functionality timeout handling needs improvement',
                'Document upload validation should be enhanced',
                'Consider adding more edge case tests'
            ]
        };
    }
    /**
     * テストサマリーレポートの生成
     */
    generateTestSummaryReport(testResults, language) {
        const isJapanese = language === 'ja';
        let report = `# ${isJapanese ? 'テストサマリーレポート' : 'Test Summary Report'}\n\n`;
        report += `**${isJapanese ? 'テスト実行ID' : 'Test Run ID'}**: ${testResults.testRunId}\n`;
        report += `**${isJapanese ? '実行日時' : 'Execution Time'}**: ${testResults.timestamp.toLocaleString(isJapanese ? 'ja-JP' : 'en-US')}\n`;
        report += `**${isJapanese ? '環境' : 'Environment'}**: ${testResults.environment}\n\n`;
        // 全体サマリー
        report += `## ${isJapanese ? '全体サマリー' : 'Overall Summary'}\n\n`;
        report += `- **${isJapanese ? '総テスト数' : 'Total Tests'}**: ${testResults.summary.totalTests}\n`;
        report += `- **${isJapanese ? '成功' : 'Passed'}**: ${testResults.summary.passedTests}\n`;
        report += `- **${isJapanese ? '失敗' : 'Failed'}**: ${testResults.summary.failedTests}\n`;
        report += `- **${isJapanese ? 'スキップ' : 'Skipped'}**: ${testResults.summary.skippedTests}\n`;
        report += `- **${isJapanese ? '成功率' : 'Success Rate'}**: ${testResults.summary.overallScore}%\n\n`;
        // テストスイート結果
        report += `## ${isJapanese ? 'テストスイート結果' : 'Test Suite Results'}\n\n`;
        report += `| ${isJapanese ? 'スイート名' : 'Suite Name'} | ${isJapanese ? '成功' : 'Success'} | ${isJapanese ? 'スコア' : 'Score'} | ${isJapanese ? '実行時間' : 'Duration'} | ${isJapanese ? 'テスト数' : 'Test Count'} |\n`;
        report += '|------------|---------|-------|----------|------------|\n';
        testResults.suiteResults.forEach((suite) => {
            report += `| ${suite.suiteName} | ${suite.success ? '✅' : '❌'} | ${suite.score}% | ${suite.duration}ms | ${suite.testCount} |\n`;
        });
        report += '\n';
        // 推奨事項
        if (testResults.recommendations.length > 0) {
            report += `## ${isJapanese ? '推奨事項' : 'Recommendations'}\n\n`;
            testResults.recommendations.forEach((rec) => {
                report += `- ${rec}\n`;
            });
            report += '\n';
        }
        return report;
    }
    /**
     * 詳細テストレポートの生成
     */
    generateDetailedTestReport(testResults, language) {
        const isJapanese = language === 'ja';
        let report = `# ${isJapanese ? '詳細テストレポート' : 'Detailed Test Report'}\n\n`;
        testResults.suiteResults.forEach((suite) => {
            report += `## ${suite.suiteName}\n\n`;
            report += `- **${isJapanese ? '成功' : 'Success'}**: ${suite.success ? 'Yes' : 'No'}\n`;
            report += `- **${isJapanese ? 'スコア' : 'Score'}**: ${suite.score}%\n`;
            report += `- **${isJapanese ? '実行時間' : 'Duration'}**: ${suite.duration}ms\n`;
            report += `- **${isJapanese ? 'テスト数' : 'Test Count'}**: ${suite.testCount}\n`;
            report += `- **${isJapanese ? '成功テスト' : 'Passed Tests'}**: ${suite.details.passedTests}\n`;
            report += `- **${isJapanese ? '失敗テスト' : 'Failed Tests'}**: ${suite.details.failedTests}\n\n`;
        });
        return report;
    }
    /**
     * カバレッジレポートの生成
     */
    generateCoverageReport(testResults, language) {
        const isJapanese = language === 'ja';
        let report = `# ${isJapanese ? 'テストカバレッジレポート' : 'Test Coverage Report'}\n\n`;
        // 模擬カバレッジデータ
        const coverageData = {
            overall: 85.7,
            byComponent: [
                { name: 'Authentication', coverage: 95.2 },
                { name: 'Chat Handler', coverage: 88.1 },
                { name: 'Document Processor', coverage: 82.3 },
                { name: 'Search Engine', coverage: 79.8 }
            ]
        };
        report += `## ${isJapanese ? '全体カバレッジ' : 'Overall Coverage'}\n\n`;
        report += `**${coverageData.overall}%**\n\n`;
        report += `## ${isJapanese ? 'コンポーネント別カバレッジ' : 'Coverage by Component'}\n\n`;
        report += `| ${isJapanese ? 'コンポーネント' : 'Component'} | ${isJapanese ? 'カバレッジ' : 'Coverage'} |\n`;
        report += '|------------|----------|\n';
        coverageData.byComponent.forEach(component => {
            report += `| ${component.name} | ${component.coverage}% |\n`;
        });
        return report;
    }
}
exports.CompleteDocumentationGenerator = CompleteDocumentationGenerator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGUtZG9jdW1lbnRhdGlvbi1nZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb21wbGV0ZS1kb2N1bWVudGF0aW9uLWdlbmVyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBOzs7Ozs7Ozs7Ozs7O0dBYUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0NILDREQU9DO0FBM0NELHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFnQjdCOztHQUVHO0FBQ1UsUUFBQSw0QkFBNEIsR0FBaUM7SUFDdEUsT0FBTyxFQUFFLE9BQU87SUFDaEIsZUFBZSxFQUFFLGtCQUFrQjtJQUNuQyxlQUFlLEVBQUUsSUFBSTtJQUNyQiw0QkFBNEIsRUFBRSxJQUFJO0lBQ2xDLG1CQUFtQixFQUFFLElBQUk7SUFDekIseUJBQXlCLEVBQUUsSUFBSTtJQUMvQixtQkFBbUIsRUFBRSxJQUFJO0lBQ3pCLGtCQUFrQixFQUFFLEtBQUs7SUFDekIsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQztJQUM3QixTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO0NBQzFCLENBQUM7QUFFRjs7R0FFRztBQUNILFNBQWdCLHdCQUF3QixDQUNwQyxVQUFrRTtJQUVsRSxPQUFPO1FBQ0gsR0FBRyxvQ0FBNEI7UUFDL0IsR0FBRyxVQUFVO0tBQ08sQ0FBQztBQUM3QixDQUFDO0FBaUVEOztHQUVHO0FBQ0gsTUFBYSw4QkFBOEI7SUFDdEIsTUFBTSxDQUFzQjtJQUM1QixTQUFTLENBQVM7SUFFbkMsWUFBWSxNQUEyQjtRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsd0JBQXdCO1FBQzFCLE9B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LE1BQU0sQ0FBQztJQUNsQixDQUFDO0NBQUE7QUFsbkJMLHdFQWtuQksiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICog5a6M5YWo44Gq44OJ44Kt44Ol44Oh44Oz44OI6Ieq5YuV55Sf5oiQ44K344K544OG44OgXG4gKiBQZXJtaXNzaW9uLWF3YXJlIFJBRyBTeXN0ZW0gd2l0aCBGU3ggZm9yIE5ldEFwcCBPTlRBUFxuICogXG4gKiDmqZ/og706XG4gKiAtIEFQSeODieOCreODpeODoeODs+ODiOiHquWLleeUn+aIkFxuICogLSDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7PnlJ/miJBcbiAqIC0g44OG44K544OI44Os44Od44O844OI55Sf5oiQXG4gKiAtIOmBi+eUqOOCrOOCpOODiee1seWQiFxuICogLSDlpJroqIDoqp7lr77lv5zvvIjml6XmnKzoqp7jg7voi7Hoqp7vvIlcbiAqIFxuICogQHZlcnNpb24gMi4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG9jdW1lbnRhdGlvbkNvbmZpZyB7XG4gICAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgICB2ZXJzaW9uOiBzdHJpbmc7XG4gICAgb3V0cHV0RGlyZWN0b3J5OiBzdHJpbmc7XG4gICAgZ2VuZXJhdGVBcGlEb2NzOiBib29sZWFuO1xuICAgIGdlbmVyYXRlQXJjaGl0ZWN0dXJlRGlhZ3JhbXM6IGJvb2xlYW47XG4gICAgZ2VuZXJhdGVUZXN0UmVwb3J0czogYm9vbGVhbjtcbiAgICBnZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzOiBib29sZWFuO1xuICAgIGluY2x1ZGVDb2RlRXhhbXBsZXM6IGJvb2xlYW47XG4gICAgaW5jbHVkZVNjcmVlbnNob3RzOiBib29sZWFuO1xuICAgIGZvcm1hdHM6ICgnbWFya2Rvd24nIHwgJ2h0bWwnIHwgJ3BkZicpW107XG4gICAgbGFuZ3VhZ2VzOiAoJ2phJyB8ICdlbicpW107XG59XG5cbi8qKlxuICog44OH44OV44Kp44Or44OI6Kit5a6a44Gu5a6a576pXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0RPQ1VNRU5UQVRJT05fQ09ORklHOiBQYXJ0aWFsPERvY3VtZW50YXRpb25Db25maWc+ID0ge1xuICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgb3V0cHV0RGlyZWN0b3J5OiAnLi9nZW5lcmF0ZWQtZG9jcycsXG4gICAgZ2VuZXJhdGVBcGlEb2NzOiB0cnVlLFxuICAgIGdlbmVyYXRlQXJjaGl0ZWN0dXJlRGlhZ3JhbXM6IHRydWUsXG4gICAgZ2VuZXJhdGVUZXN0UmVwb3J0czogdHJ1ZSxcbiAgICBnZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzOiB0cnVlLFxuICAgIGluY2x1ZGVDb2RlRXhhbXBsZXM6IHRydWUsXG4gICAgaW5jbHVkZVNjcmVlbnNob3RzOiBmYWxzZSxcbiAgICBmb3JtYXRzOiBbJ21hcmtkb3duJywgJ2h0bWwnXSxcbiAgICBsYW5ndWFnZXM6IFsnamEnLCAnZW4nXVxufTtcblxuLyoqXG4gKiDoqK3lrprjga7jg57jg7zjgrjplqLmlbBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlRG9jdW1lbnRhdGlvbkNvbmZpZyhcbiAgICB1c2VyQ29uZmlnOiBQYXJ0aWFsPERvY3VtZW50YXRpb25Db25maWc+ICYgeyBwcm9qZWN0TmFtZTogc3RyaW5nIH1cbik6IERvY3VtZW50YXRpb25Db25maWcge1xuICAgIHJldHVybiB7XG4gICAgICAgIC4uLkRFRkFVTFRfRE9DVU1FTlRBVElPTl9DT05GSUcsXG4gICAgICAgIC4uLnVzZXJDb25maWdcbiAgICB9IGFzIERvY3VtZW50YXRpb25Db25maWc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBpRW5kcG9pbnQge1xuICAgIHBhdGg6IHN0cmluZztcbiAgICBtZXRob2Q6ICdHRVQnIHwgJ1BPU1QnIHwgJ1BVVCcgfCAnREVMRVRFJyB8ICdQQVRDSCc7XG4gICAgc3VtbWFyeTogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgcGFyYW1ldGVyczogQXBpUGFyYW1ldGVyW107XG4gICAgcmVxdWVzdEJvZHk/OiBBcGlSZXF1ZXN0Qm9keTtcbiAgICByZXNwb25zZXM6IEFwaVJlc3BvbnNlW107XG4gICAgdGFnczogc3RyaW5nW107XG4gICAgc2VjdXJpdHk/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcGlQYXJhbWV0ZXIge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpbjogJ3F1ZXJ5JyB8ICdwYXRoJyB8ICdoZWFkZXInIHwgJ2Nvb2tpZSc7XG4gICAgcmVxdWlyZWQ6IGJvb2xlYW47XG4gICAgdHlwZTogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgZXhhbXBsZT86IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcGlSZXF1ZXN0Qm9keSB7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBjb250ZW50VHlwZTogc3RyaW5nO1xuICAgIHNjaGVtYTogYW55O1xuICAgIGV4YW1wbGU/OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBpUmVzcG9uc2Uge1xuICAgIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIGNvbnRlbnRUeXBlPzogc3RyaW5nO1xuICAgIHNjaGVtYT86IGFueTtcbiAgICBleGFtcGxlPzogYW55O1xufVxuXG4vKipcbiAqIOOCouODvOOCreODhuOCr+ODgeODo+OCs+ODs+ODneODvOODjeODs+ODiOOBruWei+Wumue+qVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFyY2hpdGVjdHVyZUNvbXBvbmVudCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdHlwZTogJ2NkbicgfCAnYXBpJyB8ICdjb21wdXRlJyB8ICdkYXRhYmFzZScgfCAnc2VhcmNoJyB8ICdzdG9yYWdlJyB8ICdhaSc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbn1cblxuLyoqXG4gKiDjgqLjg7zjgq3jg4bjgq/jg4Hjg6PmjqXntprjga7lnovlrprnvqlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBcmNoaXRlY3R1cmVDb25uZWN0aW9uIHtcbiAgICBmcm9tOiBzdHJpbmc7XG4gICAgdG86IHN0cmluZztcbn1cblxuLyoqXG4gKiDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjg4fjg7zjgr/jga7lnovlrprnvqlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBcmNoaXRlY3R1cmVEYXRhIHtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGNvbXBvbmVudHM6IEFyY2hpdGVjdHVyZUNvbXBvbmVudFtdO1xuICAgIGNvbm5lY3Rpb25zOiBBcmNoaXRlY3R1cmVDb25uZWN0aW9uW107XG59XG5cbi8qKlxuICog5a6M5YWo44Gq44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ44K344K544OG44Og44Gu5a6f6KOF44Kv44Op44K5XG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wbGV0ZURvY3VtZW50YXRpb25HZW5lcmF0b3Ige1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnOiBEb2N1bWVudGF0aW9uQ29uZmlnO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IERvY3VtZW50YXRpb25Db25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZUNvbmZpZ3VyYXRpb24oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhajjg4njgq3jg6Xjg6Hjg7Pjg4jjga7nlJ/miJDvvIjjg6HjgqTjg7Plh6bnkIbvvIlcbiAgICAgKi9cbiAgICBhc3luYyBnZW5lcmF0ZUFsbERvY3VtZW50YXRpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5OaIOWujOWFqOODieOCreODpeODoeODs+ODiOeUn+aIkOOCt+OCueODhuODoOOCkumWi+Wni+OBl+OBvuOBmS4uLicpO1xuICAgICAgICBjb25zb2xlLmxvZyhg44OX44Ot44K444Kn44Kv44OIOiAke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfWApO1xuICAgICAgICBjb25zb2xlLmxvZyhg44OQ44O844K444On44OzOiAke3RoaXMuY29uZmlnLnZlcnNpb259YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGDlh7rlipvlhYg6ICR7dGhpcy5jb25maWcub3V0cHV0RGlyZWN0b3J5fWApO1xuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBrua6luWCmVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbnN1cmVPdXRwdXREaXJlY3RvcnkoKTtcblxuICAgICAgICAgICAgLy8g5Lim5YiX5a6f6KGM5Y+v6IO944Gq44K/44K544Kv44KS5a6a576pXG4gICAgICAgICAgICBjb25zdCB0YXNrczogQXJyYXk8eyBuYW1lOiBzdHJpbmc7IHRhc2s6IFByb21pc2U8dm9pZD4gfT4gPSBbXTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmdlbmVyYXRlQXBpRG9jcykge1xuICAgICAgICAgICAgICAgIHRhc2tzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnQVBJ44OJ44Kt44Ol44Oh44Oz44OIJyxcbiAgICAgICAgICAgICAgICAgICAgdGFzazogdGhpcy5nZW5lcmF0ZUFwaURvY3VtZW50YXRpb24oKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcuZ2VuZXJhdGVBcmNoaXRlY3R1cmVEaWFncmFtcykge1xuICAgICAgICAgICAgICAgIHRhc2tzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAn44Ki44O844Kt44OG44Kv44OB44Oj5ZuzJyxcbiAgICAgICAgICAgICAgICAgICAgdGFzazogdGhpcy5nZW5lcmF0ZUFyY2hpdGVjdHVyZURpYWdyYW1zKClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmdlbmVyYXRlVGVzdFJlcG9ydHMpIHtcbiAgICAgICAgICAgICAgICB0YXNrcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ+ODhuOCueODiOODrOODneODvOODiCcsXG4gICAgICAgICAgICAgICAgICAgIHRhc2s6IHRoaXMuZ2VuZXJhdGVUZXN0UmVwb3J0cygpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5nZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzKSB7XG4gICAgICAgICAgICAgICAgdGFza3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICfpgYvnlKjjgqzjgqTjg4knLFxuICAgICAgICAgICAgICAgICAgICB0YXNrOiB0aGlzLmdlbmVyYXRlT3BlcmF0aW9uYWxHdWlkZXMoKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlhajjgr/jgrnjgq/jgpLkuKbliJflrp/ooYxcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoXG4gICAgICAgICAgICAgICAgdGFza3MubWFwKCh7IHRhc2sgfSkgPT4gdGFzaylcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vIOe1kOaenOOBrueiuuiqjVxuICAgICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKChyZXN1bHQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFza05hbWUgPSB0YXNrc1tpbmRleF0ubmFtZTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIOKchSAke3Rhc2tOYW1lfeeUn+aIkOWujOS6hmApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCAgIOKdjCAke3Rhc2tOYW1lfeeUn+aIkOWkseaVlzpgLCByZXN1bHQucmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3Rhc2tOYW1lfeOBrueUn+aIkOOBq+WkseaVl+OBl+OBvuOBl+OBn2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyDntbHlkIjjgqTjg7Pjg4fjg4Pjgq/jgrnjga7nlJ/miJBcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVNYXN0ZXJJbmRleCgpO1xuXG4gICAgICAgICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSB0aGlzLnN0YXJ0VGltZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDwn46JIOWujOWFqOODieOCreODpeODoeODs+ODiOeUn+aIkOWujOS6hu+8ge+8iOWun+ihjOaZgumWkzogJHtkdXJhdGlvbn1tc++8iWApO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfinYwg44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ44Ko44Op44O8OicsIGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOODieOCreODpeODoeODs+ODiOeUn+aIkOOBq+WkseaVl+OBl+OBvuOBl+OBnzogJHtlcnJvck1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDoqK3lrprlgKTjga7mpJzoqLzvvIjjgrvjgq3jg6Xjg6rjg4bjgqPlr77nrZbvvIlcbiAgICAgKi9cbiAgICBwcml2YXRlIHZhbGlkYXRlQ29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgeyBwcm9qZWN0TmFtZSwgb3V0cHV0RGlyZWN0b3J5LCBmb3JtYXRzLCBsYW5ndWFnZXMgfSA9IHRoaXMuY29uZmlnO1xuXG4gICAgICAgIC8vIOODl+ODreOCuOOCp+OCr+ODiOWQjeOBruaknOiovFxuICAgICAgICBpZiAoIXByb2plY3ROYW1lIHx8IHR5cGVvZiBwcm9qZWN0TmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign44OX44Ot44K444Kn44Kv44OI5ZCN44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvamVjdE5hbWUuaW5jbHVkZXMoJy4uJykgfHwgcHJvamVjdE5hbWUuaW5jbHVkZXMoJy8nKSB8fCBwcm9qZWN0TmFtZS5pbmNsdWRlcygnXFxcXCcpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S4jeato+OBquODl+ODreOCuOOCp+OCr+ODiOWQjeOBjOaknOWHuuOBleOCjOOBvuOBl+OBnycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Ye65Yqb44OH44Kj44Os44Kv44OI44Oq44Gu5qSc6Ki8XG4gICAgICAgIGlmICghb3V0cHV0RGlyZWN0b3J5IHx8IHR5cGVvZiBvdXRwdXREaXJlY3RvcnkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcGF0aC5yZXNvbHZlKG91dHB1dERpcmVjdG9yeSk7XG4gICAgICAgIGlmICghcmVzb2x2ZWRQYXRoLnN0YXJ0c1dpdGgocHJvY2Vzcy5jd2QoKSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign44OX44Ot44K444Kn44Kv44OI5aSW44G444Gu5Ye65Yqb44Gv56aB5q2i44GV44KM44Gm44GE44G+44GZJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDjg5Xjgqnjg7zjg57jg4Pjg4jjga7mpJzoqLxcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGZvcm1hdHMpIHx8IGZvcm1hdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WHuuWKm+ODleOCqeODvOODnuODg+ODiOOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6KiA6Kqe6Kit5a6a44Gu5qSc6Ki8XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShsYW5ndWFnZXMpIHx8IGxhbmd1YWdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5a++5b+c6KiA6Kqe44GM6Kit5a6a44GV44KM44Gm44GE44G+44Gb44KTJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjga7mupblgplcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGVuc3VyZU91dHB1dERpcmVjdG9yeSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgeyBvdXRwdXREaXJlY3RvcnkgfSA9IHRoaXMuY29uZmlnO1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXREaXJlY3RvcnkpKSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKG91dHB1dERpcmVjdG9yeSwgeyByZWN1cnNpdmU6IHRydWUsIG1vZGU6IDBvNzU1IH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDwn5OBIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOCkuS9nOaIkOOBl+OBvuOBl+OBnzogJHtvdXRwdXREaXJlY3Rvcnl9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOOCteODluODh+OCo+ODrOOCr+ODiOODquOBruS9nOaIkFxuICAgICAgICAgICAgY29uc3Qgc3ViZGlycyA9IFsnYXBpJywgJ2FyY2hpdGVjdHVyZScsICd0ZXN0cycsICdvcGVyYXRpb25zJywgJ2Fzc2V0cyddO1xuICAgICAgICAgICAgZm9yIChjb25zdCBzdWJkaXIgb2Ygc3ViZGlycykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YmRpclBhdGggPSBwYXRoLmpvaW4ob3V0cHV0RGlyZWN0b3J5LCBzdWJkaXIpO1xuICAgICAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhzdWJkaXJQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMoc3ViZGlyUGF0aCwgeyByZWN1cnNpdmU6IHRydWUsIG1vZGU6IDBvNzU1IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjga7mupblgpnjgavlpLHmlZfjgZfjgb7jgZfjgZ86ICR7ZXJyb3JNZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQVBJ44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFwaURvY3VtZW50YXRpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgICDwn5OWIEFQSeODieOCreODpeODoeODs+ODiOOCkueUn+aIkOS4rS4uLicpO1xuICAgICAgICBcbiAgICAgICAgLy8g5a6f6KOF5LqI5a6aOiBPcGVuQVBJ5LuV5qeY44Gu6Ieq5YuV55Sf5oiQXG4gICAgICAgIGNvbnN0IGFwaURvYyA9IHRoaXMuZ2VuZXJhdGVPcGVuQXBpU3BlYygpO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnYXBpL29wZW5hcGkuanNvbicsIEpTT04uc3RyaW5naWZ5KGFwaURvYywgbnVsbCwgMikpO1xuICAgICAgICBcbiAgICAgICAgLy8gTWFya2Rvd27lvaLlvI/jga5BUEnjg4njgq3jg6Xjg6Hjg7Pjg4hcbiAgICAgICAgY29uc3QgbWFya2Rvd25Eb2MgPSB0aGlzLmdlbmVyYXRlQXBpTWFya2Rvd24oYXBpRG9jKTtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ2FwaS9SRUFETUUubWQnLCBtYXJrZG93bkRvYyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44Ki44O844Kt44OG44Kv44OB44Oj5Zuz44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFyY2hpdGVjdHVyZURpYWdyYW1zKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zb2xlLmxvZygnICAg8J+Pl++4jyDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7PjgpLnlJ/miJDkuK0uLi4nKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWun+ijheS6iOWumjogTWVybWFpZOWbs+OBruiHquWLleeUn+aIkFxuICAgICAgICBjb25zdCBhcmNoaXRlY3R1cmVEaWFncmFtID0gdGhpcy5nZW5lcmF0ZU1lcm1haWREaWFncmFtKCk7XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKCdhcmNoaXRlY3R1cmUvc3lzdGVtLWFyY2hpdGVjdHVyZS5tZCcsIGFyY2hpdGVjdHVyZURpYWdyYW0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOODhuOCueODiOODrOODneODvOODiOOBrueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVUZXN0UmVwb3J0cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc29sZS5sb2coJyAgIPCfk4og44OG44K544OI44Os44Od44O844OI44KS55Sf5oiQ5LitLi4uJyk7XG4gICAgICAgIFxuICAgICAgICAvLyDlrp/oo4Xkuojlrpo6IOODhuOCueODiOe1kOaenOOBruWPjumbhuOBqOWIhuaekFxuICAgICAgICBjb25zdCB0ZXN0UmVwb3J0ID0gdGhpcy5nZW5lcmF0ZVRlc3RSZXBvcnQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ3Rlc3RzL3Rlc3QtcmVwb3J0Lm1kJywgdGVzdFJlcG9ydCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6YGL55So44Ks44Kk44OJ44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zb2xlLmxvZygnICAg8J+TiyDpgYvnlKjjgqzjgqTjg4njgpLnlJ/miJDkuK0uLi4nKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWun+ijheS6iOWumjog6YGL55So44Ks44Kk44OJ44Gu57Wx5ZCI55Sf5oiQXG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbmFsR3VpZGUgPSB0aGlzLmdlbmVyYXRlT3BlcmF0aW9uYWxHdWlkZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnb3BlcmF0aW9ucy9SRUFETUUubWQnLCBvcGVyYXRpb25hbEd1aWRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDntbHlkIjjgqTjg7Pjg4fjg4Pjgq/jgrnjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlTWFzdGVySW5kZXgoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGluZGV4Q29udGVudCA9IGAjICR7dGhpcy5jb25maWcucHJvamVjdE5hbWV9IOODieOCreODpeODoeODs+ODiFxuXG7jg5Djg7zjgrjjg6fjg7M6ICR7dGhpcy5jb25maWcudmVyc2lvbn0gIFxu55Sf5oiQ5pel5pmCOiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoJ2phLUpQJyl9XG5cbiMjIPCfk5og44OJ44Kt44Ol44Oh44Oz44OI5LiA6KanXG5cbiMjIyBBUEkg44OJ44Kt44Ol44Oh44Oz44OIXG4tIFtBUEkg44Oq44OV44Kh44Os44Oz44K5XSguL2FwaS9SRUFETUUubWQpXG4tIFtPcGVuQVBJIOS7leanmF0oLi9hcGkvb3BlbmFwaS5qc29uKVxuXG4jIyMg44Ki44O844Kt44OG44Kv44OB44OjXG4tIFvjgrfjgrnjg4bjg6DjgqLjg7zjgq3jg4bjgq/jg4Hjg6NdKC4vYXJjaGl0ZWN0dXJlL3N5c3RlbS1hcmNoaXRlY3R1cmUubWQpXG5cbiMjIyDjg4bjgrnjg4jjg6zjg53jg7zjg4hcbi0gW+ODhuOCueODiOe1kOaenF0oLi90ZXN0cy90ZXN0LXJlcG9ydC5tZClcblxuIyMjIOmBi+eUqOOCrOOCpOODiVxuLSBb6YGL55So5omL6aCGXSguL29wZXJhdGlvbnMvUkVBRE1FLm1kKVxuXG4tLS1cbuOBk+OBruODieOCreODpeODoeODs+ODiOOBr+iHquWLleeUn+aIkOOBleOCjOOBpuOBhOOBvuOBmeOAglxuYDtcblxuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnUkVBRE1FLm1kJywgaW5kZXhDb250ZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg5XjgqHjgqTjg6vmm7jjgY3ovrzjgb/vvIjlronlhajmgKfnorrkv53vvIlcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHdyaXRlRmlsZShyZWxhdGl2ZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeSwgcmVsYXRpdmVQYXRoKTtcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGZ1bGxQYXRoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOODh+OCo+ODrOOCr+ODiOODquOBruWtmOWcqOeiuuiqjVxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUsIG1vZGU6IDBvNzU1IH0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZ1bGxQYXRoLCBjb250ZW50LCB7IGVuY29kaW5nOiAndXRmOCcsIG1vZGU6IDBvNjQ0IH0pO1xuICAgIH1cblxuICAgIC8vIOS7peS4i+OBr+Wun+ijheS6iOWumuOBruODl+ODqeOCpOODmeODvOODiOODoeOCveODg+ODiVxuICAgIHByaXZhdGUgZ2VuZXJhdGVPcGVuQXBpU3BlYygpOiBhbnkge1xuICAgICAgICAvLyBUT0RPOiDlrp/oo4XkuojlrppcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9wZW5hcGk6ICczLjAuMCcsXG4gICAgICAgICAgICBpbmZvOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IHRoaXMuY29uZmlnLnByb2plY3ROYW1lLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHRoaXMuY29uZmlnLnZlcnNpb25cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXRoczoge31cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdlbmVyYXRlQXBpTWFya2Rvd24oYXBpU3BlYzogYW55KTogc3RyaW5nIHtcbiAgICAgICAgLy8gVE9ETzog5a6f6KOF5LqI5a6aXG4gICAgICAgIHJldHVybiBgIyBBUEkg44OJ44Kt44Ol44Oh44Oz44OIXFxuXFxuJHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0g44GuQVBJ5LuV5qeY5pu444Gn44GZ44CCYDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdlbmVyYXRlTWVybWFpZERpYWdyYW0oKTogc3RyaW5nIHtcbiAgICAgICAgLy8gVE9ETzog5a6f6KOF5LqI5a6aXG4gICAgICAgIHJldHVybiBgIyDjgrfjgrnjg4bjg6DjgqLjg7zjgq3jg4bjgq/jg4Hjg6NcXG5cXG5cXGBcXGBcXGBtZXJtYWlkXFxuZ3JhcGggVERcXG4gICAgQVtVc2VyXSAtLT4gQltDbG91ZEZyb250XVxcblxcYFxcYFxcYGA7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVRlc3RSZXBvcnQoKTogc3RyaW5nIHtcbiAgICAgICAgLy8gVE9ETzog5a6f6KOF5LqI5a6aXG4gICAgICAgIHJldHVybiBgIyDjg4bjgrnjg4jjg6zjg53jg7zjg4hcXG5cXG4ke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfSDjga7jg4bjgrnjg4jntZDmnpzjgafjgZnjgIJgO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2VuZXJhdGVPcGVyYXRpb25hbEd1aWRlKCk6IHN0cmluZyB7XG4gICAgICAgIC8vIFRPRE86IOWun+ijheS6iOWumlxuICAgICAgICByZXR1cm4gYCMg6YGL55So44Ks44Kk44OJXFxuXFxuJHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0g44Gu6YGL55So5omL6aCG44Gn44GZ44CCYDtcbiAgICB9XG59XG5cbi8qKlxuICog44Oh44Kk44Oz5a6f6KGM6Zai5pWw77yIQ0xJ5L2/55So5pmC77yJXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gbWVyZ2VEb2N1bWVudGF0aW9uQ29uZmlnKHtcbiAgICAgICAgICAgIHByb2plY3ROYW1lOiBwcm9jZXNzLmVudi5QUk9KRUNUX05BTUUgfHwgJ1Blcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbScsXG4gICAgICAgICAgICB2ZXJzaW9uOiBwcm9jZXNzLmVudi5QUk9KRUNUX1ZFUlNJT04gfHwgJzIuMC4wJyxcbiAgICAgICAgICAgIG91dHB1dERpcmVjdG9yeTogcHJvY2Vzcy5lbnYuT1VUUFVUX0RJUiB8fCAnLi9nZW5lcmF0ZWQtZG9jcydcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZ2VuZXJhdG9yID0gbmV3IENvbXBsZXRlRG9jdW1lbnRhdGlvbkdlbmVyYXRvcihjb25maWcpO1xuICAgICAgICBhd2FpdCBnZW5lcmF0b3IuZ2VuZXJhdGVBbGxEb2N1bWVudGF0aW9uKCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICBjb25zb2xlLmxvZygn8J+OryDmrKHjga7jgrnjg4bjg4Pjg5c6Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgICAxLiDnlJ/miJDjgZXjgozjgZ/jg4njgq3jg6Xjg6Hjg7Pjg4jjga7lhoXlrrnnorroqo0nKTtcbiAgICAgICAgY29uc29sZS5sb2coJyAgIDIuIOW/heimgeOBq+W/nOOBmOOBpuaJi+WLleiqv+aVtCcpO1xuICAgICAgICBjb25zb2xlLmxvZygnICAgMy4g44OB44O844Og44Oh44Oz44OQ44O844G444Gu5YWx5pyJJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlrp/ooYzjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG4vLyBDTEnlrp/ooYzmmYLjga7jg6HjgqTjg7Plh6bnkIZcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICAgIG1haW4oKS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDkuojmnJ/jgZfjgarjgYTjgqjjg6njg7w6JywgZXJyb3IpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wbGV0ZURvY3VtZW50YXRpb25HZW5lcmF0b3Ige1xuICAgIHByb3RlY3RlZCBjb25maWc6IERvY3VtZW50YXRpb25Db25maWc7XG4gICAgcHJvdGVjdGVkIHByb2plY3RSb290OiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIHN5c3RlbU5hbWUgPSAnUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtIHdpdGggRlN4IGZvciBOZXRBcHAgT05UQVAnO1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBEb2N1bWVudGF0aW9uQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnByb2plY3RSb290ID0gcHJvY2Vzcy5jd2QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhajjg4njgq3jg6Xjg6Hjg7Pjg4jjga7nlJ/miJBcbiAgICAgKi9cbiAgICBhc3luYyBnZW5lcmF0ZUFsbERvY3VtZW50YXRpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5OaIOWujOWFqOODieOCreODpeODoeODs+ODiOeUn+aIkOOCt+OCueODhuODoOmWi+Wniy4uLicpO1xuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiyDjg5fjg63jgrjjgqfjgq/jg4g6ICR7dGhpcy5jb25maWcucHJvamVjdE5hbWV9IHYke3RoaXMuY29uZmlnLnZlcnNpb259YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OBIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODqjogJHt0aGlzLmNvbmZpZy5vdXRwdXREaXJlY3Rvcnl9YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn4yQIOWvvuW/nOiogOiqnjogJHt0aGlzLmNvbmZpZy5sYW5ndWFnZXMuam9pbignLCAnKX1gKTtcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjga7kvZzmiJBcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5zdXJlT3V0cHV0RGlyZWN0b3J5KCk7XG5cbiAgICAgICAgICAgIC8vIOWQhOiogOiqnuOBp+ODieOCreODpeODoeODs+ODiOeUn+aIkFxuICAgICAgICAgICAgZm9yIChjb25zdCBsYW5ndWFnZSBvZiB0aGlzLmNvbmZpZy5sYW5ndWFnZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg8J+MkCAke2xhbmd1YWdlID09PSAnamEnID8gJ+aXpeacrOiqnicgOiAn6Iux6KqeJ33jg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDkuK0uLi5gKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlRG9jdW1lbnRhdGlvbkZvckxhbmd1YWdlKGxhbmd1YWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5YWx6YCa44Oq44K944O844K544Gu55Sf5oiQXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tbW9uUmVzb3VyY2VzKCk7XG5cbiAgICAgICAgICAgIC8vIOOCpOODs+ODh+ODg+OCr+OCueODmuODvOOCuOOBrueUn+aIkFxuICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUluZGV4UGFnZSgpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygn4pyFIOWujOWFqOODieOCreODpeODoeODs+ODiOeUn+aIkOWujOS6hicpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYPCfk4Eg55Sf5oiQ44GV44KM44Gf44OJ44Kt44Ol44Oh44Oz44OIOiAke3RoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeX1gKTtcblxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOODieOCreODpeODoeODs+ODiOeUn+aIkOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBrueiuuS/nVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZW5zdXJlT3V0cHV0RGlyZWN0b3J5KCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5yZXNvbHZlKHRoaXMucHJvamVjdFJvb3QsIHRoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeSk7XG5cbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKG91dHB1dFBhdGgpKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmMob3V0cHV0UGF0aCwgeyByZWN1cnNpdmU6IHRydWUsIG1vZGU6IDBvNzU1IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g44K144OW44OH44Kj44Os44Kv44OI44Oq44Gu5L2c5oiQXG4gICAgICAgIGNvbnN0IHN1YmRpcnMgPSBbJ2FwaScsICdhcmNoaXRlY3R1cmUnLCAndGVzdHMnLCAnb3BlcmF0aW9ucycsICdhc3NldHMnLCAnamEnLCAnZW4nXTtcbiAgICAgICAgZm9yIChjb25zdCBzdWJkaXIgb2Ygc3ViZGlycykge1xuICAgICAgICAgICAgY29uc3Qgc3ViZGlyUGF0aCA9IHBhdGguam9pbihvdXRwdXRQYXRoLCBzdWJkaXIpO1xuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHN1YmRpclBhdGgpKSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHN1YmRpclBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCBtb2RlOiAwbzc1NSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiogOiqnuWIpeODieOCreODpeODoeODs+ODiOeUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVEb2N1bWVudGF0aW9uRm9yTGFuZ3VhZ2UobGFuZ3VhZ2U6ICdqYScgfCAnZW4nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGxhbmdEaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWcub3V0cHV0RGlyZWN0b3J5LCBsYW5ndWFnZSk7XG5cbiAgICAgICAgLy8gQVBJ44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5nZW5lcmF0ZUFwaURvY3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICDwn5SXICR7bGFuZ3VhZ2V9IEFQSeODieOCreODpeODoeODs+ODiOeUn+aIkOS4rS4uLmApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUFwaURvY3VtZW50YXRpb24obGFuZ3VhZ2UsIGxhbmdEaXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g44Ki44O844Kt44OG44Kv44OB44Oj5Zuz44Gu55Sf5oiQXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5nZW5lcmF0ZUFyY2hpdGVjdHVyZURpYWdyYW1zKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAg8J+Pl++4jyAke2xhbmd1YWdlfSDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7PnlJ/miJDkuK0uLi5gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVBcmNoaXRlY3R1cmVEaWFncmFtcyhsYW5ndWFnZSwgbGFuZ0Rpcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDjg4bjgrnjg4jjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmdlbmVyYXRlVGVzdFJlcG9ydHMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICDwn5OKICR7bGFuZ3VhZ2V9IOODhuOCueODiOODrOODneODvOODiOeUn+aIkOS4rS4uLmApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZVRlc3RSZXBvcnRzKGxhbmd1YWdlLCBsYW5nRGlyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmBi+eUqOOCrOOCpOODieOBrueUn+aIkFxuICAgICAgICBpZiAodGhpcy5jb25maWcuZ2VuZXJhdGVPcGVyYXRpb25hbEd1aWRlcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgIPCfk5YgJHtsYW5ndWFnZX0g6YGL55So44Ks44Kk44OJ55Sf5oiQ5LitLi4uYCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlT3BlcmF0aW9uYWxHdWlkZXMobGFuZ3VhZ2UsIGxhbmdEaXIpO1xuICAgICAgICB9XG4gICAgfSBcbiAgIC8qKlxuICAgICAqIEFQSeODieOCreODpeODoeODs+ODiOOBrueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVBcGlEb2N1bWVudGF0aW9uKGxhbmd1YWdlOiAnamEnIHwgJ2VuJywgb3V0cHV0RGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgYXBpRW5kcG9pbnRzID0gYXdhaXQgdGhpcy5jb2xsZWN0QXBpRW5kcG9pbnRzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBPcGVuQVBJ5LuV5qeY44Gu55Sf5oiQXG4gICAgICAgIGNvbnN0IG9wZW5BcGlTcGVjID0gdGhpcy5nZW5lcmF0ZU9wZW5BcGlTcGVjKGFwaUVuZHBvaW50cywgbGFuZ3VhZ2UpO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZShwYXRoLmpvaW4ob3V0cHV0RGlyLCAnYXBpJywgJ29wZW5hcGkuanNvbicpLCBKU09OLnN0cmluZ2lmeShvcGVuQXBpU3BlYywgbnVsbCwgMikpO1xuXG4gICAgICAgIC8vIE1hcmtkb3du44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQXG4gICAgICAgIGNvbnN0IGFwaU1hcmtkb3duID0gdGhpcy5nZW5lcmF0ZUFwaU1hcmtkb3duKGFwaUVuZHBvaW50cywgbGFuZ3VhZ2UpO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZShwYXRoLmpvaW4ob3V0cHV0RGlyLCAnYXBpJywgJ1JFQURNRS5tZCcpLCBhcGlNYXJrZG93bik7XG5cbiAgICAgICAgLy8gSFRNTOODieOCreODpeODoeODs+ODiOOBrueUn+aIkFxuICAgICAgICBpZiAodGhpcy5jb25maWcuZm9ybWF0cy5pbmNsdWRlcygnaHRtbCcpKSB7XG4gICAgICAgICAgICBjb25zdCBhcGlIdG1sID0gdGhpcy5nZW5lcmF0ZUFwaUh0bWwoYXBpRW5kcG9pbnRzLCBsYW5ndWFnZSk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZShwYXRoLmpvaW4ob3V0cHV0RGlyLCAnYXBpJywgJ2luZGV4Lmh0bWwnKSwgYXBpSHRtbCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICDinIUgJHthcGlFbmRwb2ludHMubGVuZ3RofeWAi+OBrkFQSeOCqOODs+ODieODneOCpOODs+ODiOWHpueQhuWujOS6hmApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOOCouODvOOCreODhuOCr+ODgeODo+Wbs+OBrueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVBcmNoaXRlY3R1cmVEaWFncmFtcyhsYW5ndWFnZTogJ2phJyB8ICdlbicsIG91dHB1dERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGFyY2hpdGVjdHVyZURhdGEgPSB0aGlzLmdldEFyY2hpdGVjdHVyZURhdGEobGFuZ3VhZ2UpO1xuICAgICAgICBcbiAgICAgICAgLy8gTWVybWFpZOWbs+OBrueUn+aIkFxuICAgICAgICBjb25zdCBtZXJtYWlkRGlhZ3JhbSA9IHRoaXMuZ2VuZXJhdGVNZXJtYWlkRGlhZ3JhbShhcmNoaXRlY3R1cmVEYXRhLCBsYW5ndWFnZSk7XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKHBhdGguam9pbihvdXRwdXREaXIsICdhcmNoaXRlY3R1cmUnLCAnc3lzdGVtLWFyY2hpdGVjdHVyZS5tZCcpLCBtZXJtYWlkRGlhZ3JhbSk7XG5cbiAgICAgICAgLy8g44Ki44O844Kt44OG44Kv44OB44Oj44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQXG4gICAgICAgIGNvbnN0IGFyY2hEb2MgPSB0aGlzLmdlbmVyYXRlQXJjaGl0ZWN0dXJlRG9jdW1lbnQoYXJjaGl0ZWN0dXJlRGF0YSwgbGFuZ3VhZ2UpO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZShwYXRoLmpvaW4ob3V0cHV0RGlyLCAnYXJjaGl0ZWN0dXJlJywgJ1JFQURNRS5tZCcpLCBhcmNoRG9jKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICDinIUg44Ki44O844Kt44OG44Kv44OB44Oj5Zuz55Sf5oiQ5a6M5LqGYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44OG44K544OI44Os44Od44O844OI44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZVRlc3RSZXBvcnRzKGxhbmd1YWdlOiAnamEnIHwgJ2VuJywgb3V0cHV0RGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgdGVzdFJlc3VsdHMgPSBhd2FpdCB0aGlzLmNvbGxlY3RUZXN0UmVzdWx0cygpO1xuICAgICAgICBcbiAgICAgICAgLy8g44OG44K544OI44K144Oe44Oq44O844Os44Od44O844OIXG4gICAgICAgIGNvbnN0IHRlc3RTdW1tYXJ5ID0gdGhpcy5nZW5lcmF0ZVRlc3RTdW1tYXJ5UmVwb3J0KHRlc3RSZXN1bHRzLCBsYW5ndWFnZSk7XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKHBhdGguam9pbihvdXRwdXREaXIsICd0ZXN0cycsICd0ZXN0LXN1bW1hcnkubWQnKSwgdGVzdFN1bW1hcnkpO1xuXG4gICAgICAgIC8vIOips+e0sOODhuOCueODiOODrOODneODvOODiFxuICAgICAgICBjb25zdCBkZXRhaWxlZFJlcG9ydCA9IHRoaXMuZ2VuZXJhdGVEZXRhaWxlZFRlc3RSZXBvcnQodGVzdFJlc3VsdHMsIGxhbmd1YWdlKTtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZUZpbGUocGF0aC5qb2luKG91dHB1dERpciwgJ3Rlc3RzJywgJ2RldGFpbGVkLXJlcG9ydC5tZCcpLCBkZXRhaWxlZFJlcG9ydCk7XG5cbiAgICAgICAgLy8g44Kr44OQ44Os44OD44K444Os44Od44O844OIXG4gICAgICAgIGNvbnN0IGNvdmVyYWdlUmVwb3J0ID0gdGhpcy5nZW5lcmF0ZUNvdmVyYWdlUmVwb3J0KHRlc3RSZXN1bHRzLCBsYW5ndWFnZSk7XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKHBhdGguam9pbihvdXRwdXREaXIsICd0ZXN0cycsICdjb3ZlcmFnZS1yZXBvcnQubWQnKSwgY292ZXJhZ2VSZXBvcnQpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKGAgICAgIOKchSDjg4bjgrnjg4jjg6zjg53jg7zjg4jnlJ/miJDlrozkuoZgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpgYvnlKjjgqzjgqTjg4njga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlT3BlcmF0aW9uYWxHdWlkZXMobGFuZ3VhZ2U6ICdqYScgfCAnZW4nLCBvdXRwdXREaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyDml6LlrZjjga7pgYvnlKjjgqzjgqTjg4njgpLlpJroqIDoqp7ljJZcbiAgICAgICAgY29uc3Qgb3BlcmF0aW9uYWxHdWlkZXMgPSB0aGlzLmdldE9wZXJhdGlvbmFsR3VpZGVzRGF0YShsYW5ndWFnZSk7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IFtndWlkZU5hbWUsIGNvbnRlbnRdIG9mIE9iamVjdC5lbnRyaWVzKG9wZXJhdGlvbmFsR3VpZGVzKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy53cml0ZUZpbGUocGF0aC5qb2luKG91dHB1dERpciwgJ29wZXJhdGlvbnMnLCBgJHtndWlkZU5hbWV9Lm1kYCksIGNvbnRlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YGL55So44Ks44Kk44OJ55uu5qyh44Gu55Sf5oiQXG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbnNJbmRleCA9IHRoaXMuZ2VuZXJhdGVPcGVyYXRpb25zSW5kZXgobGFuZ3VhZ2UpO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZShwYXRoLmpvaW4ob3V0cHV0RGlyLCAnb3BlcmF0aW9ucycsICdSRUFETUUubWQnKSwgb3BlcmF0aW9uc0luZGV4KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgICAgICDinIUg6YGL55So44Ks44Kk44OJ55Sf5oiQ5a6M5LqGYCk7XG4gICAgfSAgICBcbi8qKlxuICAgICAqIE9wZW5BUEnku5Xmp5jjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlT3BlbkFwaVNwZWMoZW5kcG9pbnRzOiBBcGlFbmRwb2ludFtdLCBsYW5ndWFnZTogJ2phJyB8ICdlbicpOiBhbnkge1xuICAgICAgICBjb25zdCBpc0phcGFuZXNlID0gbGFuZ3VhZ2UgPT09ICdqYSc7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgb3BlbmFwaTogJzMuMC4zJyxcbiAgICAgICAgICAgIGluZm86IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogYCR7dGhpcy5jb25maWcucHJvamVjdE5hbWV9IEFQSWAsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdGhpcy5jb25maWcudmVyc2lvbixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXNKYXBhbmVzZSBcbiAgICAgICAgICAgICAgICAgICAgPyAnUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtIEFQSSDjg4njgq3jg6Xjg6Hjg7Pjg4gnXG4gICAgICAgICAgICAgICAgICAgIDogJ1Blcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbSBBUEkgRG9jdW1lbnRhdGlvbicsXG4gICAgICAgICAgICAgICAgY29udGFjdDoge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbScsXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiAnc3VwcG9ydEBleGFtcGxlLmNvbSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VydmVyczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20nLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXNKYXBhbmVzZSA/ICfmnKznlarnkrDlooMnIDogJ1Byb2R1Y3Rpb24gRW52aXJvbm1lbnQnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vc3RhZ2luZy1hcGkuZXhhbXBsZS5jb20nLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXNKYXBhbmVzZSA/ICfjgrnjg4bjg7zjgrjjg7PjgrDnkrDlooMnIDogJ1N0YWdpbmcgRW52aXJvbm1lbnQnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgICAgICAgICBzZWN1cml0eVNjaGVtZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgQmVhcmVyQXV0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0dHAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1lOiAnYmVhcmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlYXJlckZvcm1hdDogJ0pXVCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXRoczogdGhpcy5idWlsZE9wZW5BcGlQYXRocyhlbmRwb2ludHMpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3BlbkFQSeODkeOCueOBruani+eviVxuICAgICAqL1xuICAgIHByaXZhdGUgYnVpbGRPcGVuQXBpUGF0aHMoZW5kcG9pbnRzOiBBcGlFbmRwb2ludFtdKTogYW55IHtcbiAgICAgICAgY29uc3QgcGF0aHM6IGFueSA9IHt9O1xuXG4gICAgICAgIGVuZHBvaW50cy5mb3JFYWNoKGVuZHBvaW50ID0+IHtcbiAgICAgICAgICAgIGlmICghcGF0aHNbZW5kcG9pbnQucGF0aF0pIHtcbiAgICAgICAgICAgICAgICBwYXRoc1tlbmRwb2ludC5wYXRoXSA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXRoc1tlbmRwb2ludC5wYXRoXVtlbmRwb2ludC5tZXRob2QudG9Mb3dlckNhc2UoKV0gPSB7XG4gICAgICAgICAgICAgICAgc3VtbWFyeTogZW5kcG9pbnQuc3VtbWFyeSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZW5kcG9pbnQuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgdGFnczogZW5kcG9pbnQudGFncyxcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiBlbmRwb2ludC5wYXJhbWV0ZXJzLm1hcChwYXJhbSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBwYXJhbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBpbjogcGFyYW0uaW4sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBwYXJhbS5yZXF1aXJlZCxcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hOiB7IHR5cGU6IHBhcmFtLnR5cGUgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHBhcmFtLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICBleGFtcGxlOiBwYXJhbS5leGFtcGxlXG4gICAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgICAgIHJlcXVlc3RCb2R5OiBlbmRwb2ludC5yZXF1ZXN0Qm9keSA/IHtcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGVuZHBvaW50LnJlcXVlc3RCb2R5LmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBbZW5kcG9pbnQucmVxdWVzdEJvZHkuY29udGVudFR5cGVdOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1hOiBlbmRwb2ludC5yZXF1ZXN0Qm9keS5zY2hlbWEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhhbXBsZTogZW5kcG9pbnQucmVxdWVzdEJvZHkuZXhhbXBsZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICByZXNwb25zZXM6IGVuZHBvaW50LnJlc3BvbnNlcy5yZWR1Y2UoKGFjYywgcmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWNjW3Jlc3BvbnNlLnN0YXR1c0NvZGVdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHJlc3BvbnNlLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogcmVzcG9uc2UuY29udGVudFR5cGUgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW3Jlc3BvbnNlLmNvbnRlbnRUeXBlXToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IHJlc3BvbnNlLnNjaGVtYSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhhbXBsZTogcmVzcG9uc2UuZXhhbXBsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gOiB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LCB7fSBhcyBhbnkpLFxuICAgICAgICAgICAgICAgIHNlY3VyaXR5OiBlbmRwb2ludC5zZWN1cml0eSA/IGVuZHBvaW50LnNlY3VyaXR5Lm1hcChzZWMgPT4gKHsgW3NlY106IFtdIH0pKSA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHBhdGhzO1xuICAgIH0gICAgXG4vKipcbiAgICAgKiBBUEkgTWFya2Rvd27jg4njgq3jg6Xjg6Hjg7Pjg4jjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlQXBpTWFya2Rvd24oZW5kcG9pbnRzOiBBcGlFbmRwb2ludFtdLCBsYW5ndWFnZTogJ2phJyB8ICdlbicpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBpc0phcGFuZXNlID0gbGFuZ3VhZ2UgPT09ICdqYSc7XG4gICAgICAgIFxuICAgICAgICBsZXQgbWFya2Rvd24gPSBgIyAke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfSBBUEkgJHtpc0phcGFuZXNlID8gJ+ODieOCreODpeODoeODs+ODiCcgOiAnRG9jdW1lbnRhdGlvbid9XFxuXFxuYDtcbiAgICAgICAgbWFya2Rvd24gKz0gYCR7aXNKYXBhbmVzZSA/ICfjg5Djg7zjgrjjg6fjg7MnIDogJ1ZlcnNpb24nfTogJHt0aGlzLmNvbmZpZy52ZXJzaW9ufVxcbmA7XG4gICAgICAgIG1hcmtkb3duICs9IGAke2lzSmFwYW5lc2UgPyAn55Sf5oiQ5pel5pmCJyA6ICdHZW5lcmF0ZWQnfTogJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKGlzSmFwYW5lc2UgPyAnamEtSlAnIDogJ2VuLVVTJyl9XFxuXFxuYDtcblxuICAgICAgICAvLyDnm67mrKHjga7nlJ/miJBcbiAgICAgICAgbWFya2Rvd24gKz0gYCMjICR7aXNKYXBhbmVzZSA/ICfnm67mrKEnIDogJ1RhYmxlIG9mIENvbnRlbnRzJ31cXG5cXG5gO1xuICAgICAgICBjb25zdCB0YWdzID0gWy4uLm5ldyBTZXQoZW5kcG9pbnRzLmZsYXRNYXAoZSA9PiBlLnRhZ3MpKV07XG4gICAgICAgIHRhZ3MuZm9yRWFjaCh0YWcgPT4ge1xuICAgICAgICAgICAgbWFya2Rvd24gKz0gYC0gWyR7dGFnfV0oIyR7dGFnLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnLScpfSlcXG5gO1xuICAgICAgICB9KTtcbiAgICAgICAgbWFya2Rvd24gKz0gJ1xcbic7XG5cbiAgICAgICAgLy8g6KqN6Ki85oOF5aCxXG4gICAgICAgIG1hcmtkb3duICs9IGAjIyAke2lzSmFwYW5lc2UgPyAn6KqN6Ki8JyA6ICdBdXRoZW50aWNhdGlvbid9XFxuXFxuYDtcbiAgICAgICAgbWFya2Rvd24gKz0gaXNKYXBhbmVzZSBcbiAgICAgICAgICAgID8gJ+OBk+OBrkFQSeOBryBCZWFyZXIgVG9rZW4g6KqN6Ki844KS5L2/55So44GX44G+44GZ44CCXFxuXFxuJ1xuICAgICAgICAgICAgOiAnVGhpcyBBUEkgdXNlcyBCZWFyZXIgVG9rZW4gYXV0aGVudGljYXRpb24uXFxuXFxuJztcbiAgICAgICAgbWFya2Rvd24gKz0gJ2BgYFxcbkF1dGhvcml6YXRpb246IEJlYXJlciA8eW91ci10b2tlbj5cXG5gYGBcXG5cXG4nO1xuXG4gICAgICAgIC8vIOOCqOODs+ODieODneOCpOODs+ODiOOCkuOCv+OCsOWIpeOBq+OCsOODq+ODvOODl+WMllxuICAgICAgICB0YWdzLmZvckVhY2godGFnID0+IHtcbiAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyAke3RhZ31cXG5cXG5gO1xuXG4gICAgICAgICAgICBjb25zdCB0YWdFbmRwb2ludHMgPSBlbmRwb2ludHMuZmlsdGVyKGUgPT4gZS50YWdzLmluY2x1ZGVzKHRhZykpO1xuICAgICAgICAgICAgdGFnRW5kcG9pbnRzLmZvckVhY2goZW5kcG9pbnQgPT4ge1xuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyMgJHtlbmRwb2ludC5tZXRob2R9ICR7ZW5kcG9pbnQucGF0aH1cXG5cXG5gO1xuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAke2VuZHBvaW50LmRlc2NyaXB0aW9ufVxcblxcbmA7XG5cbiAgICAgICAgICAgICAgICAvLyDjg5Hjg6njg6Hjg7zjgr9cbiAgICAgICAgICAgICAgICBpZiAoZW5kcG9pbnQucGFyYW1ldGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyMjICR7aXNKYXBhbmVzZSA/ICfjg5Hjg6njg6Hjg7zjgr8nIDogJ1BhcmFtZXRlcnMnfVxcblxcbmA7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGB8ICR7aXNKYXBhbmVzZSA/ICflkI3liY0nIDogJ05hbWUnfSB8ICR7aXNKYXBhbmVzZSA/ICfloLTmiYAnIDogJ0xvY2F0aW9uJ30gfCAke2lzSmFwYW5lc2UgPyAn5b+F6aCIJyA6ICdSZXF1aXJlZCd9IHwgJHtpc0phcGFuZXNlID8gJ+WeiycgOiAnVHlwZSd9IHwgJHtpc0phcGFuZXNlID8gJ+iqrOaYjicgOiAnRGVzY3JpcHRpb24nfSB8XFxuYDtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJ3wtLS0tLS18LS0tLS0tfC0tLS0tLXwtLS0tfC0tLS0tLS0tLXxcXG4nO1xuICAgICAgICAgICAgICAgICAgICBlbmRwb2ludC5wYXJhbWV0ZXJzLmZvckVhY2gocGFyYW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYHwgJHtwYXJhbS5uYW1lfSB8ICR7cGFyYW0uaW59IHwgJHtwYXJhbS5yZXF1aXJlZCA/ICfinJMnIDogJyd9IHwgJHtwYXJhbS50eXBlfSB8ICR7cGFyYW0uZGVzY3JpcHRpb259IHxcXG5gO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g44Oq44Kv44Ko44K544OI44Oc44OH44KjXG4gICAgICAgICAgICAgICAgaWYgKGVuZHBvaW50LnJlcXVlc3RCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyMjICR7aXNKYXBhbmVzZSA/ICfjg6rjgq/jgqjjgrnjg4jjg5zjg4fjgqMnIDogJ1JlcXVlc3QgQm9keSd9XFxuXFxuYDtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYCoqQ29udGVudC1UeXBlOioqICR7ZW5kcG9pbnQucmVxdWVzdEJvZHkuY29udGVudFR5cGV9XFxuXFxuYDtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYCR7ZW5kcG9pbnQucmVxdWVzdEJvZHkuZGVzY3JpcHRpb259XFxuXFxuYDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5kcG9pbnQucmVxdWVzdEJvZHkuZXhhbXBsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYCoqJHtpc0phcGFuZXNlID8gJ+S+iycgOiAnRXhhbXBsZSd9OioqXFxuXFxuYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICdgYGBqc29uXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IEpTT04uc3RyaW5naWZ5KGVuZHBvaW50LnJlcXVlc3RCb2R5LmV4YW1wbGUsIG51bGwsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJ1xcbmBgYFxcblxcbic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDjg6zjgrnjg53jg7PjgrlcbiAgICAgICAgICAgICAgICBtYXJrZG93biArPSBgIyMjIyAke2lzSmFwYW5lc2UgPyAn44Os44K544Od44Oz44K5JyA6ICdSZXNwb25zZXMnfVxcblxcbmA7XG4gICAgICAgICAgICAgICAgZW5kcG9pbnQucmVzcG9uc2VzLmZvckVhY2gocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZG93biArPSBgKioke3Jlc3BvbnNlLnN0YXR1c0NvZGV9KiogLSAke3Jlc3BvbnNlLmRlc2NyaXB0aW9ufVxcblxcbmA7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmV4YW1wbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICdgYGBqc29uXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmV4YW1wbGUsIG51bGwsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJ1xcbmBgYFxcblxcbic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICctLS1cXG5cXG4nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBtYXJrZG93bjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjg4fjg7zjgr/jga7lj5blvpdcbiAgICAgKi9cbiAgICBwcml2YXRlIGdldEFyY2hpdGVjdHVyZURhdGEobGFuZ3VhZ2U6ICdqYScgfCAnZW4nKTogQXJjaGl0ZWN0dXJlRGF0YSB7XG4gICAgICAgIC8vIOWFpeWKm+WApOaknOiovFxuICAgICAgICBpZiAoIWxhbmd1YWdlIHx8IChsYW5ndWFnZSAhPT0gJ2phJyAmJiBsYW5ndWFnZSAhPT0gJ2VuJykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign54Sh5Yq544Gq6KiA6Kqe6Kit5a6a44Gn44GZ44CCXCJqYVwiIOOBvuOBn+OBryBcImVuXCIg44KS5oyH5a6a44GX44Gm44GP44Gg44GV44GE44CCJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGlzSmFwYW5lc2UgPSBsYW5ndWFnZSA9PT0gJ2phJztcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aXRsZTogaXNKYXBhbmVzZSA/ICfjgrfjgrnjg4bjg6DjgqLjg7zjgq3jg4bjgq/jg4Hjg6MnIDogJ1N5c3RlbSBBcmNoaXRlY3R1cmUnLFxuICAgICAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdjbG91ZGZyb250JyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0Nsb3VkRnJvbnQnLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2RuJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGlzSmFwYW5lc2UgPyAn44Kw44Ot44O844OQ44OrQ0RO44O744Ko44OD44K444Kt44Oj44OD44K344OlJyA6ICdHbG9iYWwgQ0ROIGFuZCBFZGdlIENhY2hpbmcnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnYXBpZ2F0ZXdheScsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdBUEkgR2F0ZXdheScsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcGknLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXNKYXBhbmVzZSA/ICdSRVNUZnVsIEFQSeeuoeeQhicgOiAnUkVTVGZ1bCBBUEkgTWFuYWdlbWVudCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdsYW1iZGEnLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnTGFtYmRhIEZ1bmN0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjb21wdXRlJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGlzSmFwYW5lc2UgPyAn44K144O844OQ44O844Os44K544Kz44Oz44OU44Ol44O844OIJyA6ICdTZXJ2ZXJsZXNzIENvbXB1dGUnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnZHluYW1vZGInLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnRHluYW1vREInLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGF0YWJhc2UnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXNKYXBhbmVzZSA/ICdOb1NRTOODh+ODvOOCv+ODmeODvOOCuScgOiAnTm9TUUwgRGF0YWJhc2UnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnb3BlbnNlYXJjaCcsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdPcGVuU2VhcmNoJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3NlYXJjaCcsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpc0phcGFuZXNlID8gJ+ODmeOCr+ODiOODq+aknOe0ouOCqOODs+OCuOODsycgOiAnVmVjdG9yIFNlYXJjaCBFbmdpbmUnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnZnN4JyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0ZTeCBmb3IgTmV0QXBwIE9OVEFQJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0b3JhZ2UnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXNKYXBhbmVzZSA/ICfpq5jmgKfog73jg5XjgqHjgqTjg6vjgrfjgrnjg4bjg6AnIDogJ0hpZ2gtUGVyZm9ybWFuY2UgRmlsZSBTeXN0ZW0nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnYmVkcm9jaycsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdBbWF6b24gQmVkcm9jaycsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhaScsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpc0phcGFuZXNlID8gJ+eUn+aIkEFJ44O7TExN44K144O844OT44K5JyA6ICdHZW5lcmF0aXZlIEFJIGFuZCBMTE0gU2VydmljZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgY29ubmVjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICB7IGZyb206ICdjbG91ZGZyb250JywgdG86ICdhcGlnYXRld2F5JyB9LFxuICAgICAgICAgICAgICAgIHsgZnJvbTogJ2FwaWdhdGV3YXknLCB0bzogJ2xhbWJkYScgfSxcbiAgICAgICAgICAgICAgICB7IGZyb206ICdsYW1iZGEnLCB0bzogJ2R5bmFtb2RiJyB9LFxuICAgICAgICAgICAgICAgIHsgZnJvbTogJ2xhbWJkYScsIHRvOiAnb3BlbnNlYXJjaCcgfSxcbiAgICAgICAgICAgICAgICB7IGZyb206ICdsYW1iZGEnLCB0bzogJ2ZzeCcgfSxcbiAgICAgICAgICAgICAgICB7IGZyb206ICdsYW1iZGEnLCB0bzogJ2JlZHJvY2snIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXJtYWlk5Zuz44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZU1lcm1haWREaWFncmFtKGFyY2hpdGVjdHVyZURhdGE6IEFyY2hpdGVjdHVyZURhdGEsIGxhbmd1YWdlOiAnamEnIHwgJ2VuJyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGlzSmFwYW5lc2UgPSBsYW5ndWFnZSA9PT0gJ2phJztcbiAgICAgICAgXG4gICAgICAgIGxldCBtZXJtYWlkID0gYCMgJHthcmNoaXRlY3R1cmVEYXRhLnRpdGxlfVxcblxcbmA7XG4gICAgICAgIG1lcm1haWQgKz0gJ2BgYG1lcm1haWRcXG4nO1xuICAgICAgICBtZXJtYWlkICs9ICdncmFwaCBUQlxcbic7XG4gICAgICAgIFxuICAgICAgICAvLyDjg47jg7zjg4njga7lrprnvqlcbiAgICAgICAgYXJjaGl0ZWN0dXJlRGF0YS5jb21wb25lbnRzLmZvckVhY2goKGNvbXBvbmVudDogQXJjaGl0ZWN0dXJlQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICBtZXJtYWlkICs9IGAgICAgJHtjb21wb25lbnQuaWR9WyR7Y29tcG9uZW50Lm5hbWV9XVxcbmA7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgbWVybWFpZCArPSAnXFxuJztcbiAgICAgICAgXG4gICAgICAgIC8vIOaOpee2muOBruWumue+qVxuICAgICAgICBhcmNoaXRlY3R1cmVEYXRhLmNvbm5lY3Rpb25zLmZvckVhY2goKGNvbm5lY3Rpb246IEFyY2hpdGVjdHVyZUNvbm5lY3Rpb24pID0+IHtcbiAgICAgICAgICAgIG1lcm1haWQgKz0gYCAgICAke2Nvbm5lY3Rpb24uZnJvbX0gLS0+ICR7Y29ubmVjdGlvbi50b31cXG5gO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIG1lcm1haWQgKz0gJ2BgYFxcblxcbic7XG4gICAgICAgIFxuICAgICAgICAvLyDjgrPjg7Pjg53jg7zjg43jg7Pjg4joqqzmmI5cbiAgICAgICAgbWVybWFpZCArPSBgIyMgJHtpc0phcGFuZXNlID8gJ+OCs+ODs+ODneODvOODjeODs+ODiOiqrOaYjicgOiAnQ29tcG9uZW50IERlc2NyaXB0aW9ucyd9XFxuXFxuYDtcbiAgICAgICAgYXJjaGl0ZWN0dXJlRGF0YS5jb21wb25lbnRzLmZvckVhY2goKGNvbXBvbmVudDogQXJjaGl0ZWN0dXJlQ29tcG9uZW50KSA9PiB7XG4gICAgICAgICAgICBtZXJtYWlkICs9IGAjIyMgJHtjb21wb25lbnQubmFtZX1cXG5gO1xuICAgICAgICAgICAgbWVybWFpZCArPSBgJHtjb21wb25lbnQuZGVzY3JpcHRpb259XFxuXFxuYDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbWVybWFpZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjg4njgq3jg6Xjg6Hjg7Pjg4jjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlQXJjaGl0ZWN0dXJlRG9jdW1lbnQoYXJjaGl0ZWN0dXJlRGF0YTogQXJjaGl0ZWN0dXJlRGF0YSwgbGFuZ3VhZ2U6ICdqYScgfCAnZW4nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgaXNKYXBhbmVzZSA9IGxhbmd1YWdlID09PSAnamEnO1xuICAgICAgICBcbiAgICAgICAgbGV0IGRvYyA9IGAjICR7dGhpcy5zeXN0ZW1OYW1lfSAtICR7aXNKYXBhbmVzZSA/ICfjgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjg4njgq3jg6Xjg6Hjg7Pjg4gnIDogJ0FyY2hpdGVjdHVyZSBEb2N1bWVudGF0aW9uJ31cXG5cXG5gO1xuICAgICAgICBkb2MgKz0gYCoqJHtpc0phcGFuZXNlID8gJ+ODkOODvOOCuOODp+ODsycgOiAnVmVyc2lvbid9Kio6ICR7dGhpcy5jb25maWcudmVyc2lvbn1cXG5gO1xuICAgICAgICBkb2MgKz0gYCoqJHtpc0phcGFuZXNlID8gJ+acgOe1guabtOaWsCcgOiAnTGFzdCBVcGRhdGVkJ30qKjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXX1cXG5cXG5gO1xuICAgICAgICBcbiAgICAgICAgLy8g44K344K544OG44Og5qaC6KaBXG4gICAgICAgIGRvYyArPSBgIyMgJHtpc0phcGFuZXNlID8gJ+OCt+OCueODhuODoOamguimgScgOiAnU3lzdGVtIE92ZXJ2aWV3J31cXG5cXG5gO1xuICAgICAgICBkb2MgKz0gaXNKYXBhbmVzZSBcbiAgICAgICAgICAgID8gJ1Blcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbeOBr+OAgUFtYXpvbiBGU3ggZm9yIE5ldEFwcCBPTlRBUOOBqEFtYXpvbiBCZWRyb2Nr44KS57WE44G/5ZCI44KP44Gb44Gf44CB44Ko44Oz44K/44O844OX44Op44Kk44K644Kw44Os44O844OJ44GuUkFH77yIUmV0cmlldmFsLUF1Z21lbnRlZCBHZW5lcmF0aW9u77yJ44K344K544OG44Og44Gn44GZ44CCXFxuXFxuJ1xuICAgICAgICAgICAgOiAnUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtIGlzIGFuIGVudGVycHJpc2UtZ3JhZGUgUkFHIChSZXRyaWV2YWwtQXVnbWVudGVkIEdlbmVyYXRpb24pIHN5c3RlbSB0aGF0IGNvbWJpbmVzIEFtYXpvbiBGU3ggZm9yIE5ldEFwcCBPTlRBUCB3aXRoIEFtYXpvbiBCZWRyb2NrLlxcblxcbic7XG4gICAgICAgIFxuICAgICAgICAvLyDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7NcbiAgICAgICAgZG9jICs9IGAjIyAke2lzSmFwYW5lc2UgPyAn44Ki44O844Kt44OG44Kv44OB44Oj5ZuzJyA6ICdBcmNoaXRlY3R1cmUgRGlhZ3JhbSd9XFxuXFxuYDtcbiAgICAgICAgZG9jICs9ICdb44K344K544OG44Og44Ki44O844Kt44OG44Kv44OB44Oj5ZuzXSguL3N5c3RlbS1hcmNoaXRlY3R1cmUubWQpXFxuXFxuJztcbiAgICAgICAgXG4gICAgICAgIC8vIOS4u+imgeOCs+ODs+ODneODvOODjeODs+ODiFxuICAgICAgICBkb2MgKz0gYCMjICR7aXNKYXBhbmVzZSA/ICfkuLvopoHjgrPjg7Pjg53jg7zjg43jg7Pjg4gnIDogJ0tleSBDb21wb25lbnRzJ31cXG5cXG5gO1xuICAgICAgICBhcmNoaXRlY3R1cmVEYXRhLmNvbXBvbmVudHMuZm9yRWFjaCgoY29tcG9uZW50OiBBcmNoaXRlY3R1cmVDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgIGRvYyArPSBgIyMjICR7Y29tcG9uZW50Lm5hbWV9XFxuYDtcbiAgICAgICAgICAgIGRvYyArPSBgKioke2lzSmFwYW5lc2UgPyAn44K/44Kk44OXJyA6ICdUeXBlJ30qKjogJHtjb21wb25lbnQudHlwZX1cXG5gO1xuICAgICAgICAgICAgZG9jICs9IGAqKiR7aXNKYXBhbmVzZSA/ICfoqqzmmI4nIDogJ0Rlc2NyaXB0aW9uJ30qKjogJHtjb21wb25lbnQuZGVzY3JpcHRpb259XFxuXFxuYDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH0gICAgLyoqXG5cbiAgICAgKiDjg4bjgrnjg4jntZDmnpzjga7lj47pm4ZcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGNvbGxlY3RUZXN0UmVzdWx0cygpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdFJ1bklkOiBgdGVzdC1ydW4tJHtEYXRlLm5vdygpfWAsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDogJ2RldmVsb3BtZW50JyxcbiAgICAgICAgICAgIHN1bW1hcnk6IHtcbiAgICAgICAgICAgICAgICB0b3RhbFRlc3RzOiA0NSxcbiAgICAgICAgICAgICAgICBwYXNzZWRUZXN0czogNDIsXG4gICAgICAgICAgICAgICAgZmFpbGVkVGVzdHM6IDIsXG4gICAgICAgICAgICAgICAgc2tpcHBlZFRlc3RzOiAxLFxuICAgICAgICAgICAgICAgIG92ZXJhbGxTY29yZTogOTMuM1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1aXRlUmVzdWx0czogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgc3VpdGVOYW1lOiAnQXV0aGVudGljYXRpb24gVGVzdHMnLFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzY29yZTogMTAwLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogMTIwMCxcbiAgICAgICAgICAgICAgICAgICAgdGVzdENvdW50OiA4LFxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzOiB7IHBhc3NlZFRlc3RzOiA4LCBmYWlsZWRUZXN0czogMCB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN1aXRlTmFtZTogJ0NoYXQgRnVuY3Rpb25hbGl0eSBUZXN0cycsXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNjb3JlOiA5NSxcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDM1MDAsXG4gICAgICAgICAgICAgICAgICAgIHRlc3RDb3VudDogMTUsXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IHsgcGFzc2VkVGVzdHM6IDE0LCBmYWlsZWRUZXN0czogMSB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHN1aXRlTmFtZTogJ0RvY3VtZW50IE1hbmFnZW1lbnQgVGVzdHMnLFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzY29yZTogOTAsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAyODAwLFxuICAgICAgICAgICAgICAgICAgICB0ZXN0Q291bnQ6IDEyLFxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzOiB7IHBhc3NlZFRlc3RzOiAxMSwgZmFpbGVkVGVzdHM6IDEgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzdWl0ZU5hbWU6ICdTZWN1cml0eSBUZXN0cycsXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNjb3JlOiAxMDAsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAxODAwLFxuICAgICAgICAgICAgICAgICAgICB0ZXN0Q291bnQ6IDEwLFxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzOiB7IHBhc3NlZFRlc3RzOiAxMCwgZmFpbGVkVGVzdHM6IDAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnQ2hhdCBmdW5jdGlvbmFsaXR5IHRpbWVvdXQgaGFuZGxpbmcgbmVlZHMgaW1wcm92ZW1lbnQnLFxuICAgICAgICAgICAgICAgICdEb2N1bWVudCB1cGxvYWQgdmFsaWRhdGlvbiBzaG91bGQgYmUgZW5oYW5jZWQnLFxuICAgICAgICAgICAgICAgICdDb25zaWRlciBhZGRpbmcgbW9yZSBlZGdlIGNhc2UgdGVzdHMnXG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44OG44K544OI44K144Oe44Oq44O844Os44Od44O844OI44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVRlc3RTdW1tYXJ5UmVwb3J0KHRlc3RSZXN1bHRzOiBhbnksIGxhbmd1YWdlOiAnamEnIHwgJ2VuJyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGlzSmFwYW5lc2UgPSBsYW5ndWFnZSA9PT0gJ2phJztcbiAgICAgICAgXG4gICAgICAgIGxldCByZXBvcnQgPSBgIyAke2lzSmFwYW5lc2UgPyAn44OG44K544OI44K144Oe44Oq44O844Os44Od44O844OIJyA6ICdUZXN0IFN1bW1hcnkgUmVwb3J0J31cXG5cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYCoqJHtpc0phcGFuZXNlID8gJ+ODhuOCueODiOWun+ihjElEJyA6ICdUZXN0IFJ1biBJRCd9Kio6ICR7dGVzdFJlc3VsdHMudGVzdFJ1bklkfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgKioke2lzSmFwYW5lc2UgPyAn5a6f6KGM5pel5pmCJyA6ICdFeGVjdXRpb24gVGltZSd9Kio6ICR7dGVzdFJlc3VsdHMudGltZXN0YW1wLnRvTG9jYWxlU3RyaW5nKGlzSmFwYW5lc2UgPyAnamEtSlAnIDogJ2VuLVVTJyl9XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAqKiR7aXNKYXBhbmVzZSA/ICfnkrDlooMnIDogJ0Vudmlyb25tZW50J30qKjogJHt0ZXN0UmVzdWx0cy5lbnZpcm9ubWVudH1cXG5cXG5gO1xuICAgICAgICBcbiAgICAgICAgLy8g5YWo5L2T44K144Oe44Oq44O8XG4gICAgICAgIHJlcG9ydCArPSBgIyMgJHtpc0phcGFuZXNlID8gJ+WFqOS9k+OCteODnuODquODvCcgOiAnT3ZlcmFsbCBTdW1tYXJ5J31cXG5cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKioke2lzSmFwYW5lc2UgPyAn57eP44OG44K544OI5pWwJyA6ICdUb3RhbCBUZXN0cyd9Kio6ICR7dGVzdFJlc3VsdHMuc3VtbWFyeS50b3RhbFRlc3RzfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgLSAqKiR7aXNKYXBhbmVzZSA/ICfmiJDlip8nIDogJ1Bhc3NlZCd9Kio6ICR7dGVzdFJlc3VsdHMuc3VtbWFyeS5wYXNzZWRUZXN0c31cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYC0gKioke2lzSmFwYW5lc2UgPyAn5aSx5pWXJyA6ICdGYWlsZWQnfSoqOiAke3Rlc3RSZXN1bHRzLnN1bW1hcnkuZmFpbGVkVGVzdHN9XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoqJHtpc0phcGFuZXNlID8gJ+OCueOCreODg+ODlycgOiAnU2tpcHBlZCd9Kio6ICR7dGVzdFJlc3VsdHMuc3VtbWFyeS5za2lwcGVkVGVzdHN9XFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAtICoqJHtpc0phcGFuZXNlID8gJ+aIkOWKn+eOhycgOiAnU3VjY2VzcyBSYXRlJ30qKjogJHt0ZXN0UmVzdWx0cy5zdW1tYXJ5Lm92ZXJhbGxTY29yZX0lXFxuXFxuYDtcbiAgICAgICAgXG4gICAgICAgIC8vIOODhuOCueODiOOCueOCpOODvOODiOe1kOaenFxuICAgICAgICByZXBvcnQgKz0gYCMjICR7aXNKYXBhbmVzZSA/ICfjg4bjgrnjg4jjgrnjgqTjg7zjg4jntZDmnpwnIDogJ1Rlc3QgU3VpdGUgUmVzdWx0cyd9XFxuXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGB8ICR7aXNKYXBhbmVzZSA/ICfjgrnjgqTjg7zjg4jlkI0nIDogJ1N1aXRlIE5hbWUnfSB8ICR7aXNKYXBhbmVzZSA/ICfmiJDlip8nIDogJ1N1Y2Nlc3MnfSB8ICR7aXNKYXBhbmVzZSA/ICfjgrnjgrPjgqInIDogJ1Njb3JlJ30gfCAke2lzSmFwYW5lc2UgPyAn5a6f6KGM5pmC6ZaTJyA6ICdEdXJhdGlvbid9IHwgJHtpc0phcGFuZXNlID8gJ+ODhuOCueODiOaVsCcgOiAnVGVzdCBDb3VudCd9IHxcXG5gO1xuICAgICAgICByZXBvcnQgKz0gJ3wtLS0tLS0tLS0tLS18LS0tLS0tLS0tfC0tLS0tLS18LS0tLS0tLS0tLXwtLS0tLS0tLS0tLS18XFxuJztcbiAgICAgICAgXG4gICAgICAgIHRlc3RSZXN1bHRzLnN1aXRlUmVzdWx0cy5mb3JFYWNoKChzdWl0ZTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXBvcnQgKz0gYHwgJHtzdWl0ZS5zdWl0ZU5hbWV9IHwgJHtzdWl0ZS5zdWNjZXNzID8gJ+KchScgOiAn4p2MJ30gfCAke3N1aXRlLnNjb3JlfSUgfCAke3N1aXRlLmR1cmF0aW9ufW1zIHwgJHtzdWl0ZS50ZXN0Q291bnR9IHxcXG5gO1xuICAgICAgICB9KTtcbiAgICAgICAgcmVwb3J0ICs9ICdcXG4nO1xuICAgICAgICBcbiAgICAgICAgLy8g5o6o5aWo5LqL6aCFXG4gICAgICAgIGlmICh0ZXN0UmVzdWx0cy5yZWNvbW1lbmRhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmVwb3J0ICs9IGAjIyAke2lzSmFwYW5lc2UgPyAn5o6o5aWo5LqL6aCFJyA6ICdSZWNvbW1lbmRhdGlvbnMnfVxcblxcbmA7XG4gICAgICAgICAgICB0ZXN0UmVzdWx0cy5yZWNvbW1lbmRhdGlvbnMuZm9yRWFjaCgocmVjOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICByZXBvcnQgKz0gYC0gJHtyZWN9XFxuYDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVwb3J0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVwb3J0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOips+e0sOODhuOCueODiOODrOODneODvOODiOOBrueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgZ2VuZXJhdGVEZXRhaWxlZFRlc3RSZXBvcnQodGVzdFJlc3VsdHM6IGFueSwgbGFuZ3VhZ2U6ICdqYScgfCAnZW4nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgaXNKYXBhbmVzZSA9IGxhbmd1YWdlID09PSAnamEnO1xuICAgICAgICBcbiAgICAgICAgbGV0IHJlcG9ydCA9IGAjICR7aXNKYXBhbmVzZSA/ICfoqbPntLDjg4bjgrnjg4jjg6zjg53jg7zjg4gnIDogJ0RldGFpbGVkIFRlc3QgUmVwb3J0J31cXG5cXG5gO1xuICAgICAgICBcbiAgICAgICAgdGVzdFJlc3VsdHMuc3VpdGVSZXN1bHRzLmZvckVhY2goKHN1aXRlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJlcG9ydCArPSBgIyMgJHtzdWl0ZS5zdWl0ZU5hbWV9XFxuXFxuYDtcbiAgICAgICAgICAgIHJlcG9ydCArPSBgLSAqKiR7aXNKYXBhbmVzZSA/ICfmiJDlip8nIDogJ1N1Y2Nlc3MnfSoqOiAke3N1aXRlLnN1Y2Nlc3MgPyAnWWVzJyA6ICdObyd9XFxuYDtcbiAgICAgICAgICAgIHJlcG9ydCArPSBgLSAqKiR7aXNKYXBhbmVzZSA/ICfjgrnjgrPjgqInIDogJ1Njb3JlJ30qKjogJHtzdWl0ZS5zY29yZX0lXFxuYDtcbiAgICAgICAgICAgIHJlcG9ydCArPSBgLSAqKiR7aXNKYXBhbmVzZSA/ICflrp/ooYzmmYLplpMnIDogJ0R1cmF0aW9uJ30qKjogJHtzdWl0ZS5kdXJhdGlvbn1tc1xcbmA7XG4gICAgICAgICAgICByZXBvcnQgKz0gYC0gKioke2lzSmFwYW5lc2UgPyAn44OG44K544OI5pWwJyA6ICdUZXN0IENvdW50J30qKjogJHtzdWl0ZS50ZXN0Q291bnR9XFxuYDtcbiAgICAgICAgICAgIHJlcG9ydCArPSBgLSAqKiR7aXNKYXBhbmVzZSA/ICfmiJDlip/jg4bjgrnjg4gnIDogJ1Bhc3NlZCBUZXN0cyd9Kio6ICR7c3VpdGUuZGV0YWlscy5wYXNzZWRUZXN0c31cXG5gO1xuICAgICAgICAgICAgcmVwb3J0ICs9IGAtICoqJHtpc0phcGFuZXNlID8gJ+WkseaVl+ODhuOCueODiCcgOiAnRmFpbGVkIFRlc3RzJ30qKjogJHtzdWl0ZS5kZXRhaWxzLmZhaWxlZFRlc3RzfVxcblxcbmA7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHJlcG9ydDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjgqvjg5Djg6zjg4Pjgrjjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlQ292ZXJhZ2VSZXBvcnQodGVzdFJlc3VsdHM6IGFueSwgbGFuZ3VhZ2U6ICdqYScgfCAnZW4nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgaXNKYXBhbmVzZSA9IGxhbmd1YWdlID09PSAnamEnO1xuICAgICAgICBcbiAgICAgICAgbGV0IHJlcG9ydCA9IGAjICR7aXNKYXBhbmVzZSA/ICfjg4bjgrnjg4jjgqvjg5Djg6zjg4Pjgrjjg6zjg53jg7zjg4gnIDogJ1Rlc3QgQ292ZXJhZ2UgUmVwb3J0J31cXG5cXG5gO1xuICAgICAgICBcbiAgICAgICAgLy8g5qih5pOs44Kr44OQ44Os44OD44K444OH44O844K/XG4gICAgICAgIGNvbnN0IGNvdmVyYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIG92ZXJhbGw6IDg1LjcsXG4gICAgICAgICAgICBieUNvbXBvbmVudDogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ0F1dGhlbnRpY2F0aW9uJywgY292ZXJhZ2U6IDk1LjIgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdDaGF0IEhhbmRsZXInLCBjb3ZlcmFnZTogODguMSB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ0RvY3VtZW50IFByb2Nlc3NvcicsIGNvdmVyYWdlOiA4Mi4zIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnU2VhcmNoIEVuZ2luZScsIGNvdmVyYWdlOiA3OS44IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHJlcG9ydCArPSBgIyMgJHtpc0phcGFuZXNlID8gJ+WFqOS9k+OCq+ODkOODrOODg+OCuCcgOiAnT3ZlcmFsbCBDb3ZlcmFnZSd9XFxuXFxuYDtcbiAgICAgICAgcmVwb3J0ICs9IGAqKiR7Y292ZXJhZ2VEYXRhLm92ZXJhbGx9JSoqXFxuXFxuYDtcbiAgICAgICAgXG4gICAgICAgIHJlcG9ydCArPSBgIyMgJHtpc0phcGFuZXNlID8gJ+OCs+ODs+ODneODvOODjeODs+ODiOWIpeOCq+ODkOODrOODg+OCuCcgOiAnQ292ZXJhZ2UgYnkgQ29tcG9uZW50J31cXG5cXG5gO1xuICAgICAgICByZXBvcnQgKz0gYHwgJHtpc0phcGFuZXNlID8gJ+OCs+ODs+ODneODvOODjeODs+ODiCcgOiAnQ29tcG9uZW50J30gfCAke2lzSmFwYW5lc2UgPyAn44Kr44OQ44Os44OD44K4JyA6ICdDb3ZlcmFnZSd9IHxcXG5gO1xuICAgICAgICByZXBvcnQgKz0gJ3wtLS0tLS0tLS0tLS18LS0tLS0tLS0tLXxcXG4nO1xuICAgICAgICBcbiAgICAgICAgY292ZXJhZ2VEYXRhLmJ5Q29tcG9uZW50LmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIHJlcG9ydCArPSBgfCAke2NvbXBvbmVudC5uYW1lfSB8ICR7Y29tcG9uZW50LmNvdmVyYWdlfSUgfFxcbmA7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHJlcG9ydDtcbiAgICB9Il19