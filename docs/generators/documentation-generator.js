#!/usr/bin/env node
"use strict";
/**
 * ドキュメント自動生成システム
 * APIドキュメント、アーキテクチャ図、テストレポートの自動生成
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
exports.DocumentationGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DocumentationGenerator {
    config;
    projectRoot;
    constructor(config) {
        this.config = config;
        this.projectRoot = process.cwd();
    }
    /**
     * 全ドキュメントの生成
     */
    async generateAllDocumentation() {
        console.log('📚 ドキュメント生成を開始します...');
        console.log(`📋 プロジェクト: ${this.config.projectName} v${this.config.version}`);
        console.log(`📁 出力ディレクトリ: ${this.config.outputDirectory}`);
        console.log('');
        try {
            // 出力ディレクトリの作成
            await this.ensureOutputDirectory();
            // APIドキュメントの生成
            if (this.config.generateApiDocs) {
                console.log('🔗 APIドキュメントを生成中...');
                await this.generateApiDocumentation();
            }
            // アーキテクチャ図の生成
            if (this.config.generateArchitectureDiagrams) {
                console.log('🏗️ アーキテクチャ図を生成中...');
                await this.generateArchitectureDiagrams();
            }
            // テストレポートの生成
            if (this.config.generateTestReports) {
                console.log('📊 テストレポートを生成中...');
                await this.generateTestReports();
            }
            // 運用ガイドの生成
            if (this.config.generateOperationalGuides) {
                console.log('📖 運用ガイドを生成中...');
                await this.generateOperationalGuides();
            }
            // インデックスページの生成
            await this.generateIndexPage();
            console.log('');
            console.log('✅ ドキュメント生成完了');
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
        // パストラバーサル攻撃を防ぐためのパス検証
        const outputPath = this.validateAndResolvePath(this.config.outputDirectory);
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true, mode: 0o755 });
        }
        // サブディレクトリの作成
        const allowedSubdirs = ['api', 'architecture', 'tests', 'operations', 'assets'];
        for (const subdir of allowedSubdirs) {
            const subdirPath = path.join(outputPath, subdir);
            if (!fs.existsSync(subdirPath)) {
                fs.mkdirSync(subdirPath, { recursive: true, mode: 0o755 });
            }
        }
    }
    /**
     * パスの検証と解決（セキュリティ対策強化版）
     */
    validateAndResolvePath(inputPath) {
        // 入力値の基本検証
        if (!inputPath || typeof inputPath !== 'string') {
            throw new Error('無効なパスが指定されました');
        }
        // 危険な文字列パターンの検証
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
        const normalizedPath = path.normalize(inputPath);
        const resolvedPath = path.resolve(this.projectRoot, normalizedPath);
        // プロジェクトルート外へのアクセスを防ぐ
        if (!resolvedPath.startsWith(this.projectRoot)) {
            throw new Error(`プロジェクトディレクトリ外へのアクセスは禁止されています: ${resolvedPath}`);
        }
        // パスの長さ制限（システム制限を考慮）
        if (resolvedPath.length > 260) {
            throw new Error('パスが長すぎます');
        }
        return resolvedPath;
    }
    /**
     * ファイル書き込み（セキュリティ対策付き）
     */
    async writeFile(relativePath, content) {
        const outputPath = this.validateAndResolvePath(this.config.outputDirectory);
        const filePath = path.join(outputPath, relativePath);
        // ディレクトリトラバーサル攻撃を防ぐ
        if (!filePath.startsWith(outputPath)) {
            throw new Error('不正なファイルパスが検出されました');
        }
        // ディレクトリが存在しない場合は作成
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        }
        // ファイル書き込み（適切な権限設定）
        fs.writeFileSync(filePath, content, { mode: 0o644 });
    }
    /**
     * APIドキュメントの生成
     */
    async generateApiDocumentation() {
        console.log('   📊 APIエンドポイントを収集中...');
        const apiEndpoints = await this.collectApiEndpoints();
        console.log(`   📝 ${apiEndpoints.length}個のエンドポイントを処理中...`);
        // 並列処理でドキュメント生成を高速化
        const tasks = [];
        // OpenAPI仕様の生成
        tasks.push(this.generateAndWriteOpenApiSpec(apiEndpoints));
        // Markdownドキュメントの生成
        tasks.push(this.generateAndWriteApiMarkdown(apiEndpoints));
        // HTMLドキュメントの生成（必要な場合のみ）
        if (this.config.formats.includes('html')) {
            tasks.push(this.generateAndWriteApiHtml(apiEndpoints));
        }
        // 全ての生成タスクを並列実行
        await Promise.all(tasks);
        console.log(`   ✅ APIドキュメント生成完了 (${apiEndpoints.length}エンドポイント)`);
    }
    /**
     * OpenAPI仕様の生成と書き込み
     */
    async generateAndWriteOpenApiSpec(apiEndpoints) {
        const openApiSpec = this.generateOpenApiSpec(apiEndpoints);
        await this.writeFile('api/openapi.json', JSON.stringify(openApiSpec, null, 2));
    }
    /**
     * APIマークダウンの生成と書き込み
     */
    async generateAndWriteApiMarkdown(apiEndpoints) {
        const apiMarkdown = this.generateApiMarkdown(apiEndpoints);
        await this.writeFile('api/README.md', apiMarkdown);
    }
    /**
     * API HTMLの生成と書き込み
     */
    async generateAndWriteApiHtml(apiEndpoints) {
        const apiHtml = this.generateApiHtml(apiEndpoints);
        await this.writeFile('api/index.html', apiHtml);
    }
    /**
     * API エンドポイントの収集
     */
    async collectApiEndpoints() {
        // 実際のコードベースからAPIエンドポイントを自動検出
        const endpoints = [];
        // Lambda関数ディレクトリをスキャン
        const lambdaDir = path.join(this.projectRoot, 'lambda');
        if (fs.existsSync(lambdaDir)) {
            const lambdaFunctions = fs.readdirSync(lambdaDir);
            for (const func of lambdaFunctions) {
                const funcEndpoints = await this.scanLambdaFunction(path.join(lambdaDir, func));
                endpoints.push(...funcEndpoints);
            }
        }
        // サンプルエンドポイントも含める（開発用）
        endpoints.push(...this.getSampleEndpoints());
        return endpoints;
    }
    /**
     * Lambda関数からAPIエンドポイントを抽出
     */
    async scanLambdaFunction(functionPath) {
        const endpoints = [];
        try {
            const indexFile = path.join(functionPath, 'index.js');
            if (fs.existsSync(indexFile)) {
                const content = fs.readFileSync(indexFile, 'utf-8');
                // 簡単なパターンマッチングでエンドポイントを検出
                // 実際の実装では、ASTパーサーを使用することを推奨
                const pathMatches = content.match(/\/api\/[^\s'"]+/g);
                if (pathMatches) {
                    pathMatches.forEach(pathMatch => {
                        endpoints.push(this.createEndpointFromPath(pathMatch, functionPath));
                    });
                }
            }
        }
        catch (error) {
            console.warn(`Lambda関数の解析に失敗: ${functionPath}`, error);
        }
        return endpoints;
    }
    /**
     * パスからエンドポイント情報を生成
     */
    createEndpointFromPath(apiPath, functionPath) {
        const functionName = path.basename(functionPath);
        return {
            path: apiPath,
            method: this.inferMethodFromFunction(functionName),
            summary: `${functionName}エンドポイント`,
            description: `${functionName}機能のAPIエンドポイント`,
            parameters: [],
            responses: [{
                    statusCode: 200,
                    description: '成功',
                    contentType: 'application/json'
                }],
            tags: [this.inferTagFromPath(apiPath)],
            security: ['BearerAuth']
        };
    }
    /**
     * 関数名からHTTPメソッドを推測
     */
    inferMethodFromFunction(functionName) {
        if (functionName.includes('get') || functionName.includes('list'))
            return 'GET';
        if (functionName.includes('create') || functionName.includes('upload'))
            return 'POST';
        if (functionName.includes('update'))
            return 'PUT';
        if (functionName.includes('delete'))
            return 'DELETE';
        return 'POST'; // デフォルト
    }
    /**
     * パスからタグを推測
     */
    inferTagFromPath(apiPath) {
        if (apiPath.includes('/auth'))
            return '認証';
        if (apiPath.includes('/chat'))
            return 'チャット';
        if (apiPath.includes('/document'))
            return 'ドキュメント';
        if (apiPath.includes('/user'))
            return 'ユーザー';
        return 'その他';
    }
    /**
     * サンプルエンドポイントの取得
     */
    getSampleEndpoints() {
        return [
            {
                path: '/api/auth/login',
                method: 'POST',
                summary: 'ユーザーログイン',
                description: 'ユーザー認証を行い、アクセストークンを取得します',
                parameters: [],
                requestBody: {
                    description: 'ログイン情報',
                    contentType: 'application/json',
                    schema: {
                        type: 'object',
                        properties: {
                            username: { type: 'string', description: 'ユーザー名' },
                            password: { type: 'string', description: 'パスワード' }
                        },
                        required: ['username', 'password']
                    },
                    example: {
                        username: 'testuser',
                        password: 'password123'
                    }
                },
                responses: [
                    {
                        statusCode: 200,
                        description: 'ログイン成功',
                        contentType: 'application/json',
                        schema: {
                            type: 'object',
                            properties: {
                                token: { type: 'string', description: 'アクセストークン' },
                                expiresIn: { type: 'number', description: '有効期限（秒）' }
                            }
                        },
                        example: {
                            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                            expiresIn: 3600
                        }
                    },
                    {
                        statusCode: 401,
                        description: 'ログイン失敗',
                        contentType: 'application/json',
                        schema: {
                            type: 'object',
                            properties: {
                                error: { type: 'string', description: 'エラーメッセージ' }
                            }
                        },
                        example: {
                            error: 'Invalid credentials'
                        }
                    }
                ],
                tags: ['認証'],
                security: []
            },
            {
                path: '/api/chat',
                method: 'POST',
                summary: 'チャット送信',
                description: 'ユーザーのメッセージを送信し、AI応答を取得します',
                parameters: [],
                requestBody: {
                    description: 'チャットメッセージ',
                    contentType: 'application/json',
                    schema: {
                        type: 'object',
                        properties: {
                            message: { type: 'string', description: 'ユーザーメッセージ' },
                            sessionId: { type: 'string', description: 'セッションID' }
                        },
                        required: ['message']
                    },
                    example: {
                        message: 'FSx for NetApp ONTAPについて教えてください',
                        sessionId: 'session-123'
                    }
                },
                responses: [
                    {
                        statusCode: 200,
                        description: 'チャット応答',
                        contentType: 'application/json',
                        schema: {
                            type: 'object',
                            properties: {
                                response: { type: 'string', description: 'AI応答' },
                                sources: { type: 'array', description: '参照ソース' },
                                sessionId: { type: 'string', description: 'セッションID' }
                            }
                        },
                        example: {
                            response: 'FSx for NetApp ONTAPは、NetAppのONTAPファイルシステムをベースとした...',
                            sources: ['document1.pdf', 'document2.pdf'],
                            sessionId: 'session-123'
                        }
                    }
                ],
                tags: ['チャット'],
                security: ['BearerAuth']
            },
            {
                path: '/api/documents',
                method: 'GET',
                summary: 'ドキュメント一覧取得',
                description: 'アップロードされたドキュメントの一覧を取得します',
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        required: false,
                        type: 'integer',
                        description: 'ページ番号',
                        example: 1
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        required: false,
                        type: 'integer',
                        description: '1ページあたりの件数',
                        example: 20
                    }
                ],
                responses: [
                    {
                        statusCode: 200,
                        description: 'ドキュメント一覧',
                        contentType: 'application/json',
                        schema: {
                            type: 'object',
                            properties: {
                                documents: { type: 'array', description: 'ドキュメント配列' },
                                total: { type: 'number', description: '総件数' },
                                page: { type: 'number', description: '現在のページ' }
                            }
                        }
                    }
                ],
                tags: ['ドキュメント'],
                security: ['BearerAuth']
            },
            {
                path: '/api/documents',
                method: 'POST',
                summary: 'ドキュメントアップロード',
                description: '新しいドキュメントをアップロードします',
                parameters: [],
                requestBody: {
                    description: 'アップロードファイル',
                    contentType: 'multipart/form-data',
                    schema: {
                        type: 'object',
                        properties: {
                            file: { type: 'string', format: 'binary', description: 'アップロードファイル' },
                            title: { type: 'string', description: 'ドキュメントタイトル' },
                            description: { type: 'string', description: 'ドキュメント説明' }
                        },
                        required: ['file']
                    }
                },
                responses: [
                    {
                        statusCode: 201,
                        description: 'アップロード成功',
                        contentType: 'application/json',
                        schema: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', description: 'ドキュメントID' },
                                filename: { type: 'string', description: 'ファイル名' },
                                status: { type: 'string', description: '処理状況' }
                            }
                        }
                    }
                ],
                tags: ['ドキュメント'],
                security: ['BearerAuth']
            }
        ];
    }
    /**
     * OpenAPI仕様の生成
     */
    generateOpenApiSpec(endpoints) {
        const spec = {
            openapi: '3.0.3',
            info: {
                title: `${this.config.projectName} API`,
                version: this.config.version,
                description: 'Permission-aware RAG System API Documentation',
                contact: {
                    name: 'NetApp Japan Technology Team',
                    email: 'support@example.com'
                }
            },
            servers: [
                {
                    url: 'https://api.example.com',
                    description: '本番環境'
                },
                {
                    url: 'https://staging-api.example.com',
                    description: 'ステージング環境'
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
            paths: {}
        };
        // エンドポイントの追加
        endpoints.forEach(endpoint => {
            if (!spec.paths[endpoint.path]) {
                spec.paths[endpoint.path] = {};
            }
            spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
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
        return spec;
    }
    /**
      * API Markdownドキュメントの生成
      */
    generateApiMarkdown(endpoints) {
        let markdown = `# ${this.config.projectName} API ドキュメント\n\n`;
        markdown += `バージョン: ${this.config.version}\n`;
        markdown += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
        // 目次の生成
        markdown += '## 目次\n\n';
        const tags = [...new Set(endpoints.flatMap(e => e.tags))];
        tags.forEach(tag => {
            markdown += `- [${tag}](#${tag.toLowerCase()})\n`;
        });
        markdown += '\n';
        // 認証情報
        markdown += '## 認証\n\n';
        markdown += 'このAPIは Bearer Token 認証を使用します。\n\n';
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
                    markdown += '#### パラメータ\n\n';
                    markdown += '| 名前 | 場所 | 必須 | 型 | 説明 |\n';
                    markdown += '|------|------|------|----|---------|\n';
                    endpoint.parameters.forEach(param => {
                        markdown += `| ${param.name} | ${param.in} | ${param.required ? '✓' : ''} | ${param.type} | ${param.description} |\n`;
                    });
                    markdown += '\n';
                }
                // リクエストボディ
                if (endpoint.requestBody) {
                    markdown += '#### リクエストボディ\n\n';
                    markdown += `**Content-Type:** ${endpoint.requestBody.contentType}\n\n`;
                    markdown += `${endpoint.requestBody.description}\n\n`;
                    if (endpoint.requestBody.example) {
                        markdown += '**例:**\n\n';
                        markdown += '```json\n';
                        markdown += JSON.stringify(endpoint.requestBody.example, null, 2);
                        markdown += '\n```\n\n';
                    }
                }
                // レスポンス
                markdown += '#### レスポンス\n\n';
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
     * API HTMLドキュメントの生成
     */
    generateApiHtml(endpoints) {
        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.projectName} API ドキュメント</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .endpoint { background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .endpoint-header { background: #007bff; color: white; padding: 15px; }
        .endpoint-body { padding: 20px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; margin-right: 10px; }
        .method.GET { background: #28a745; }
        .method.POST { background: #007bff; }
        .method.PUT { background: #ffc107; color: #212529; }
        .method.DELETE { background: #dc3545; }
        .params-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .params-table th, .params-table td { border: 1px solid #dee2e6; padding: 8px 12px; text-align: left; }
        .params-table th { background: #f8f9fa; }
        .code-block { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; margin: 10px 0; overflow-x: auto; }
        .nav { background: #343a40; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .nav a { color: #fff; text-decoration: none; margin-right: 20px; }
        .nav a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${this.config.projectName} API ドキュメント</h1>
            <p>バージョン: ${this.config.version} | 生成日時: ${new Date().toLocaleString('ja-JP')}</p>
        </div>

        <div class="nav">
            <strong>ナビゲーション:</strong>
            ${[...new Set(endpoints.flatMap(e => e.tags))].map(tag => `<a href="#${tag.toLowerCase()}">${tag}</a>`).join('')}
        </div>

        <div class="auth-section">
            <h2>認証</h2>
            <p>このAPIは Bearer Token 認証を使用します。</p>
            <div class="code-block">Authorization: Bearer &lt;your-token&gt;</div>
        </div>

        ${[...new Set(endpoints.flatMap(e => e.tags))].map(tag => `
            <h2 id="${tag.toLowerCase()}">${tag}</h2>
            ${endpoints.filter(e => e.tags.includes(tag)).map(endpoint => `
                <div class="endpoint">
                    <div class="endpoint-header">
                        <span class="method ${endpoint.method}">${endpoint.method}</span>
                        <strong>${endpoint.path}</strong>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">${endpoint.summary}</p>
                    </div>
                    <div class="endpoint-body">
                        <p>${endpoint.description}</p>
                        
                        ${endpoint.parameters.length > 0 ? `
                            <h4>パラメータ</h4>
                            <table class="params-table">
                                <thead>
                                    <tr><th>名前</th><th>場所</th><th>必須</th><th>型</th><th>説明</th></tr>
                                </thead>
                                <tbody>
                                    ${endpoint.parameters.map(param => `
                                        <tr>
                                            <td><code>${param.name}</code></td>
                                            <td>${param.in}</td>
                                            <td>${param.required ? '✓' : ''}</td>
                                            <td>${param.type}</td>
                                            <td>${param.description}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : ''}

                        ${endpoint.requestBody ? `
                            <h4>リクエストボディ</h4>
                            <p><strong>Content-Type:</strong> ${endpoint.requestBody.contentType}</p>
                            <p>${endpoint.requestBody.description}</p>
                            ${endpoint.requestBody.example ? `
                                <div class="code-block"><pre>${JSON.stringify(endpoint.requestBody.example, null, 2)}</pre></div>
                            ` : ''}
                        ` : ''}

                        <h4>レスポンス</h4>
                        ${endpoint.responses.map(response => `
                            <h5>${response.statusCode} - ${response.description}</h5>
                            ${response.example ? `
                                <div class="code-block"><pre>${JSON.stringify(response.example, null, 2)}</pre></div>
                            ` : ''}
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        `).join('')}
    </div>
</body>
</html>
    `;
    }
    /**
     * アーキテクチャ図の生成
     */
    async generateArchitectureDiagrams() {
        console.log('   🏗️ アーキテクチャコンポーネントを収集中...');
        const components = await this.collectArchitectureComponents();
        console.log(`   📊 ${components.length}個のコンポーネントを処理中...`);
        // 並列処理でドキュメント生成を高速化
        const tasks = [];
        // Mermaid図の生成
        tasks.push(this.generateAndWriteMermaidDiagram(components));
        // アーキテクチャドキュメントの生成
        tasks.push(this.generateAndWriteArchitectureMarkdown(components));
        // 全ての生成タスクを並列実行
        await Promise.all(tasks);
        console.log(`   ✅ アーキテクチャ図生成完了 (${components.length}コンポーネント)`);
    }
    /**
     * Mermaid図の生成と書き込み
     */
    async generateAndWriteMermaidDiagram(components) {
        const mermaidDiagram = this.generateMermaidDiagram(components);
        await this.writeFile('architecture/system-architecture.md', `# システムアーキテクチャ\n\n\`\`\`mermaid\n${mermaidDiagram}\n\`\`\`\n`);
    }
    /**
     * アーキテクチャマークダウンの生成と書き込み
     */
    async generateAndWriteArchitectureMarkdown(components) {
        const archMarkdown = this.generateArchitectureMarkdown(components);
        await this.writeFile('architecture/README.md', archMarkdown);
        console.log(`   ✅ アーキテクチャ図生成完了 (${components.length}コンポーネント)`);
    }
    /**
     * アーキテクチャコンポーネントの収集
     */
    async collectArchitectureComponents() {
        return [
            {
                id: 'cloudfront',
                name: 'CloudFront',
                type: 'network',
                description: 'グローバルCDN、静的コンテンツ配信',
                technology: 'Amazon CloudFront',
                connections: ['waf', 'alb'],
                properties: {
                    caching: true,
                    ssl: true,
                    gzip: true
                }
            },
            {
                id: 'waf',
                name: 'WAF',
                type: 'security',
                description: 'Webアプリケーションファイアウォール',
                technology: 'AWS WAF',
                connections: ['alb'],
                properties: {
                    sqlInjectionProtection: true,
                    xssProtection: true,
                    rateLimiting: true
                }
            },
            {
                id: 'alb',
                name: 'Application Load Balancer',
                type: 'network',
                description: 'アプリケーションロードバランサー',
                technology: 'AWS ALB',
                connections: ['lambda-web', 'lambda-api'],
                properties: {
                    healthCheck: true,
                    sslTermination: true
                }
            },
            {
                id: 'lambda-web',
                name: 'Web Lambda',
                type: 'service',
                description: 'Next.jsフロントエンドアプリケーション',
                technology: 'AWS Lambda + Next.js',
                connections: ['lambda-api'],
                properties: {
                    runtime: 'nodejs20.x',
                    memory: '1024MB',
                    timeout: '30s'
                }
            },
            {
                id: 'lambda-api',
                name: 'API Lambda',
                type: 'service',
                description: 'RESTful API サーバー',
                technology: 'AWS Lambda + Express.js',
                connections: ['dynamodb', 'opensearch', 'bedrock', 'fsx'],
                properties: {
                    runtime: 'nodejs20.x',
                    memory: '2048MB',
                    timeout: '5m'
                }
            },
            {
                id: 'lambda-embed',
                name: 'Embedding Lambda',
                type: 'service',
                description: 'ドキュメント埋め込み処理',
                technology: 'AWS Lambda + Python',
                connections: ['bedrock', 'opensearch', 'fsx'],
                properties: {
                    runtime: 'python3.11',
                    memory: '3008MB',
                    timeout: '15m'
                }
            },
            {
                id: 'dynamodb',
                name: 'DynamoDB',
                type: 'database',
                description: 'セッション管理、ユーザーデータ',
                technology: 'Amazon DynamoDB',
                connections: [],
                properties: {
                    billingMode: 'PAY_PER_REQUEST',
                    encryption: true,
                    pointInTimeRecovery: true
                }
            },
            {
                id: 'opensearch',
                name: 'OpenSearch Serverless',
                type: 'database',
                description: 'ベクトル検索エンジン',
                technology: 'Amazon OpenSearch Serverless',
                connections: [],
                properties: {
                    vectorSearch: true,
                    serverless: true,
                    encryption: true
                }
            },
            {
                id: 'fsx',
                name: 'FSx for NetApp ONTAP',
                type: 'storage',
                description: '高性能ファイルストレージ',
                technology: 'Amazon FSx for NetApp ONTAP',
                connections: [],
                properties: {
                    protocol: 'NFS/SMB',
                    deduplication: true,
                    compression: true,
                    snapshots: true
                }
            },
            {
                id: 'bedrock',
                name: 'Amazon Bedrock',
                type: 'service',
                description: 'AI/ML推論サービス',
                technology: 'Amazon Bedrock',
                connections: [],
                properties: {
                    models: ['Claude', 'Titan'],
                    embedding: true,
                    textGeneration: true
                }
            },
            {
                id: 'cognito',
                name: 'Cognito',
                type: 'security',
                description: 'ユーザー認証・認可',
                technology: 'Amazon Cognito',
                connections: ['lambda-api'],
                properties: {
                    userPool: true,
                    mfa: true,
                    oauth: true
                }
            },
            {
                id: 'cloudwatch',
                name: 'CloudWatch',
                type: 'monitoring',
                description: 'ログ・メトリクス監視',
                technology: 'Amazon CloudWatch',
                connections: ['lambda-web', 'lambda-api', 'lambda-embed'],
                properties: {
                    logs: true,
                    metrics: true,
                    alarms: true
                }
            }
        ];
    }
    /**
     * Mermaid図の生成
     */
    generateMermaidDiagram(components) {
        let diagram = 'graph TB\n';
        // ノードの定義
        components.forEach(component => {
            const shape = this.getNodeShape(component.type);
            diagram += `    ${component.id}${shape}${component.name}<br/>${component.technology}${shape.replace('[', ']').replace('(', ')')}\n`;
        });
        diagram += '\n';
        // 接続の定義
        components.forEach(component => {
            component.connections.forEach(connection => {
                diagram += `    ${component.id} --> ${connection}\n`;
            });
        });
        // スタイルの定義
        diagram += '\n';
        diagram += '    classDef service fill:#e1f5fe\n';
        diagram += '    classDef database fill:#f3e5f5\n';
        diagram += '    classDef storage fill:#e8f5e8\n';
        diagram += '    classDef network fill:#fff3e0\n';
        diagram += '    classDef security fill:#ffebee\n';
        diagram += '    classDef monitoring fill:#f1f8e9\n';
        // クラスの適用
        components.forEach(component => {
            diagram += `    class ${component.id} ${component.type}\n`;
        });
        return diagram;
    }
    /**
     * ノード形状の取得
     */
    getNodeShape(type) {
        switch (type) {
            case 'service': return '[';
            case 'database': return '[(';
            case 'storage': return '[/';
            case 'network': return '(';
            case 'security': return '{';
            case 'monitoring': return '((';
            default: return '[';
        }
    }
    /**
     * アーキテクチャMarkdownの生成
     */
    generateArchitectureMarkdown(components) {
        let markdown = `# ${this.config.projectName} システムアーキテクチャ\n\n`;
        markdown += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
        // 概要
        markdown += '## 概要\n\n';
        markdown += 'Permission-aware RAG System は、Amazon FSx for NetApp ONTAP と Amazon Bedrock を組み合わせた、エンタープライズグレードの RAG（Retrieval-Augmented Generation）システムです。\n\n';
        // アーキテクチャ図
        markdown += '## システム構成図\n\n';
        markdown += '```mermaid\n';
        markdown += this.generateMermaidDiagram(components);
        markdown += '\n```\n\n';
        // コンポーネント別説明
        const componentsByType = components.reduce((acc, component) => {
            if (!acc[component.type])
                acc[component.type] = [];
            acc[component.type].push(component);
            return acc;
        }, {});
        const typeNames = {
            service: 'サービス',
            database: 'データベース',
            storage: 'ストレージ',
            network: 'ネットワーク',
            security: 'セキュリティ',
            monitoring: '監視'
        };
        Object.entries(componentsByType).forEach(([type, comps]) => {
            markdown += `## ${typeNames[type] || type}\n\n`;
            comps.forEach(component => {
                markdown += `### ${component.name}\n\n`;
                markdown += `**技術:** ${component.technology}\n\n`;
                markdown += `**説明:** ${component.description}\n\n`;
                if (Object.keys(component.properties).length > 0) {
                    markdown += '**主要機能:**\n';
                    Object.entries(component.properties).forEach(([key, value]) => {
                        markdown += `- ${key}: ${value}\n`;
                    });
                    markdown += '\n';
                }
                if (component.connections.length > 0) {
                    markdown += `**接続先:** ${component.connections.join(', ')}\n\n`;
                }
                markdown += '---\n\n';
            });
        });
        return markdown;
    }
    /**
     * ファイル書き込み
     */
    async writeFile(relativePath, content) {
        const fullPath = path.join(this.config.outputDirectory, relativePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, 'utf8');
    }
    /**
       * APIマークダウンドキュメントの生成
       */
    generateApiMarkdown(endpoints) {
        let markdown = `# ${this.config.projectName} API ドキュメント\n\n`;
        markdown += `バージョン: ${this.config.version}\n\n`;
        markdown += `## 概要\n\nPermission-aware RAG System のAPI仕様書です。\n\n`;
        // タグ別にエンドポイントをグループ化
        const groupedEndpoints = this.groupEndpointsByTag(endpoints);
        for (const [tag, tagEndpoints] of Object.entries(groupedEndpoints)) {
            markdown += `## ${tag}\n\n`;
            for (const endpoint of tagEndpoints) {
                markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
                markdown += `${endpoint.description}\n\n`;
                // パラメータ
                if (endpoint.parameters.length > 0) {
                    markdown += `#### パラメータ\n\n`;
                    markdown += `| 名前 | 場所 | 必須 | 型 | 説明 |\n`;
                    markdown += `|------|------|------|----|----- |\n`;
                    for (const param of endpoint.parameters) {
                        markdown += `| ${param.name} | ${param.in} | ${param.required ? '✓' : ''} | ${param.type} | ${param.description} |\n`;
                    }
                    markdown += `\n`;
                }
                // レスポンス
                markdown += `#### レスポンス\n\n`;
                for (const response of endpoint.responses) {
                    markdown += `**${response.statusCode}** - ${response.description}\n\n`;
                    if (response.example) {
                        markdown += `\`\`\`json\n${JSON.stringify(response.example, null, 2)}\n\`\`\`\n\n`;
                    }
                }
            }
        }
        return markdown;
    }
    /**
     * API HTMLドキュメントの生成
     */
    generateApiHtml(endpoints) {
        const title = `${this.config.projectName} API ドキュメント`;
        let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .endpoint { border: 1px solid #ddd; margin: 20px 0; border-radius: 8px; }
        .endpoint-header { background: #f5f5f5; padding: 15px; border-radius: 8px 8px 0 0; }
        .endpoint-body { padding: 15px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .method.GET { background: #28a745; }
        .method.POST { background: #007bff; }
        .method.PUT { background: #ffc107; color: black; }
        .method.DELETE { background: #dc3545; }
        .method.PATCH { background: #6f42c1; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>バージョン: ${this.config.version}</p>
        <p>Permission-aware RAG System のAPI仕様書です。</p>
`;
        const groupedEndpoints = this.groupEndpointsByTag(endpoints);
        for (const [tag, tagEndpoints] of Object.entries(groupedEndpoints)) {
            html += `        <h2>${tag}</h2>\n`;
            for (const endpoint of tagEndpoints) {
                html += `        <div class="endpoint">
            <div class="endpoint-header">
                <span class="method ${endpoint.method}">${endpoint.method}</span>
                <strong>${endpoint.path}</strong>
                <p>${endpoint.description}</p>
            </div>
            <div class="endpoint-body">
`;
                // パラメータテーブル
                if (endpoint.parameters.length > 0) {
                    html += `                <h4>パラメータ</h4>
                <table>
                    <tr><th>名前</th><th>場所</th><th>必須</th><th>型</th><th>説明</th></tr>
`;
                    for (const param of endpoint.parameters) {
                        html += `                    <tr>
                        <td>${param.name}</td>
                        <td>${param.in}</td>
                        <td>${param.required ? '✓' : ''}</td>
                        <td>${param.type}</td>
                        <td>${param.description}</td>
                    </tr>
`;
                    }
                    html += `                </table>
`;
                }
                // レスポンス例
                html += `                <h4>レスポンス</h4>
`;
                for (const response of endpoint.responses) {
                    html += `                <p><strong>${response.statusCode}</strong> - ${response.description}</p>
`;
                    if (response.example) {
                        html += `                <pre><code>${JSON.stringify(response.example, null, 2)}</code></pre>
`;
                    }
                }
                html += `            </div>
        </div>
`;
            }
        }
        html += `    </div>
</body>
</html>`;
        return html;
    }
    /**
     * エンドポイントをタグ別にグループ化
     */
    groupEndpointsByTag(endpoints) {
        const grouped = {};
        for (const endpoint of endpoints) {
            for (const tag of endpoint.tags) {
                if (!grouped[tag]) {
                    grouped[tag] = [];
                }
                grouped[tag].push(endpoint);
            }
        }
        return grouped;
    }
    /**
     * アーキテクチャ図の生成
     */
    async generateArchitectureDiagrams() {
        console.log('   🏗️ アーキテクチャコンポーネントを収集中...');
        const components = await this.collectArchitectureComponents();
        // Mermaid図の生成
        const mermaidDiagram = this.generateMermaidDiagram(components);
        await this.writeFile('architecture/architecture.mmd', mermaidDiagram);
        // アーキテクチャドキュメントの生成
        const archMarkdown = this.generateArchitectureMarkdown(components);
        await this.writeFile('architecture/README.md', archMarkdown);
        console.log(`   ✅ アーキテクチャ図生成完了 (${components.length}コンポーネント)`);
    }
    /**
     * アーキテクチャコンポーネントの収集
     */
    async collectArchitectureComponents() {
        // CDKスタックからコンポーネント情報を抽出
        const components = [
            {
                id: 'cloudfront',
                name: 'CloudFront',
                type: 'network',
                description: 'グローバルCDN',
                technology: 'AWS CloudFront',
                connections: ['lambda-web-adapter'],
                properties: { caching: true, ssl: true }
            },
            {
                id: 'lambda-web-adapter',
                name: 'Lambda Web Adapter',
                type: 'service',
                description: 'Next.jsアプリケーション',
                technology: 'AWS Lambda + Next.js',
                connections: ['api-gateway', 'dynamodb'],
                properties: { runtime: 'nodejs20.x' }
            },
            {
                id: 'api-gateway',
                name: 'API Gateway',
                type: 'service',
                description: 'REST API',
                technology: 'AWS API Gateway',
                connections: ['lambda-functions'],
                properties: { cors: true, auth: 'Cognito' }
            },
            {
                id: 'lambda-functions',
                name: 'Lambda Functions',
                type: 'service',
                description: 'バックエンド処理',
                technology: 'AWS Lambda',
                connections: ['dynamodb', 'opensearch', 'bedrock'],
                properties: { runtime: 'nodejs20.x' }
            },
            {
                id: 'dynamodb',
                name: 'DynamoDB',
                type: 'database',
                description: 'セッション管理',
                technology: 'AWS DynamoDB',
                connections: [],
                properties: { billing: 'on-demand' }
            },
            {
                id: 'opensearch',
                name: 'OpenSearch Serverless',
                type: 'database',
                description: 'ベクトル検索',
                technology: 'AWS OpenSearch Serverless',
                connections: ['fsx'],
                properties: { vectorSearch: true }
            },
            {
                id: 'bedrock',
                name: 'Amazon Bedrock',
                type: 'service',
                description: 'AI/ML サービス',
                technology: 'AWS Bedrock',
                connections: [],
                properties: { models: ['Claude', 'Titan'] }
            },
            {
                id: 'fsx',
                name: 'FSx for NetApp ONTAP',
                type: 'storage',
                description: '高性能ファイルシステム',
                technology: 'AWS FSx',
                connections: [],
                properties: { protocol: 'NFS/SMB' }
            }
        ];
        return components;
    }
    /**
     * Mermaid図の生成
     */
    generateMermaidDiagram(components) {
        let mermaid = `graph TD\n`;
        // ノードの定義
        for (const component of components) {
            const shape = this.getMermaidShape(component.type);
            mermaid += `    ${component.id}${shape}${component.name}${shape.split('[')[1]}\n`;
        }
        mermaid += `\n`;
        // 接続の定義
        for (const component of components) {
            for (const connection of component.connections) {
                mermaid += `    ${component.id} --> ${connection}\n`;
            }
        }
        // スタイルの定義
        mermaid += `\n`;
        mermaid += `    classDef service fill:#e1f5fe\n`;
        mermaid += `    classDef database fill:#f3e5f5\n`;
        mermaid += `    classDef storage fill:#e8f5e8\n`;
        mermaid += `    classDef network fill:#fff3e0\n`;
        mermaid += `    classDef security fill:#ffebee\n`;
        for (const component of components) {
            mermaid += `    class ${component.id} ${component.type}\n`;
        }
        return mermaid;
    }
    /**
     * Mermaidの図形を取得
     */
    getMermaidShape(type) {
        switch (type) {
            case 'service': return '[';
            case 'database': return '[(';
            case 'storage': return '[/';
            case 'network': return '((';
            case 'security': return '{';
            default: return '[';
        }
    }
    /**
     * アーキテクチャマークダウンの生成
     */
    generateArchitectureMarkdown(components) {
        let markdown = `# ${this.config.projectName} アーキテクチャ\n\n`;
        markdown += `## システム概要\n\n`;
        markdown += `Permission-aware RAG System のアーキテクチャ構成図です。\n\n`;
        // コンポーネント一覧
        markdown += `## コンポーネント一覧\n\n`;
        markdown += `| コンポーネント | タイプ | 技術 | 説明 |\n`;
        markdown += `|---------------|--------|------|------|\n`;
        for (const component of components) {
            markdown += `| ${component.name} | ${component.type} | ${component.technology} | ${component.description} |\n`;
        }
        markdown += `\n## アーキテクチャ図\n\n`;
        markdown += `\`\`\`mermaid\n`;
        markdown += this.generateMermaidDiagram(components);
        markdown += `\`\`\`\n\n`;
        return markdown;
    }
    /**
     * テストレポートの生成
     */
    async generateTestReports() {
        console.log('   📊 テスト結果を収集中...');
        const testReports = await this.collectTestReports();
        for (const report of testReports) {
            const reportMarkdown = this.generateTestReportMarkdown(report);
            await this.writeFile(`tests/test-report-${report.testRunId}.md`, reportMarkdown);
        }
        // サマリーレポートの生成
        const summaryMarkdown = this.generateTestSummaryMarkdown(testReports);
        await this.writeFile('tests/README.md', summaryMarkdown);
        console.log(`   ✅ テストレポート生成完了 (${testReports.length}件)`);
    }
    /**
     * テストレポートの収集
     */
    async collectTestReports() {
        // 実際の実装では、テスト結果ファイルやCI/CDシステムから収集
        return [
            {
                testRunId: 'run-001',
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
                        suiteName: 'API Tests',
                        success: true,
                        score: 95.0,
                        duration: 120,
                        testCount: 20,
                        details: { coverage: '85%' }
                    },
                    {
                        suiteName: 'Integration Tests',
                        success: false,
                        score: 80.0,
                        duration: 300,
                        testCount: 15,
                        details: { failedTests: ['auth-flow', 'document-upload'] }
                    }
                ],
                recommendations: [
                    '認証フローのテストケースを見直してください',
                    'ドキュメントアップロード機能のエラーハンドリングを改善してください'
                ]
            }
        ];
    }
    /**
     * テストレポートマークダウンの生成
     */
    generateTestReportMarkdown(report) {
        let markdown = `# テストレポート - ${report.testRunId}\n\n`;
        markdown += `**実行日時**: ${report.timestamp.toLocaleString('ja-JP')}\n`;
        markdown += `**環境**: ${report.environment}\n\n`;
        // サマリー
        markdown += `## テスト結果サマリー\n\n`;
        markdown += `- **総テスト数**: ${report.summary.totalTests}\n`;
        markdown += `- **成功**: ${report.summary.passedTests}\n`;
        markdown += `- **失敗**: ${report.summary.failedTests}\n`;
        markdown += `- **スキップ**: ${report.summary.skippedTests}\n`;
        markdown += `- **成功率**: ${report.summary.overallScore.toFixed(1)}%\n\n`;
        // スイート別結果
        markdown += `## スイート別結果\n\n`;
        for (const suite of report.suiteResults) {
            const status = suite.success ? '✅' : '❌';
            markdown += `### ${status} ${suite.suiteName}\n\n`;
            markdown += `- **スコア**: ${suite.score.toFixed(1)}%\n`;
            markdown += `- **実行時間**: ${suite.duration}秒\n`;
            markdown += `- **テスト数**: ${suite.testCount}\n\n`;
        }
        // 推奨事項
        if (report.recommendations.length > 0) {
            markdown += `## 推奨事項\n\n`;
            for (const recommendation of report.recommendations) {
                markdown += `- ${recommendation}\n`;
            }
            markdown += `\n`;
        }
        return markdown;
    }
    /**
     * テストサマリーマークダウンの生成
     */
    generateTestSummaryMarkdown(reports) {
        let markdown = `# ${this.config.projectName} テストレポート\n\n`;
        markdown += `## 最新テスト結果\n\n`;
        if (reports.length > 0) {
            const latest = reports[reports.length - 1];
            markdown += `**最終実行**: ${latest.timestamp.toLocaleString('ja-JP')}\n`;
            markdown += `**成功率**: ${latest.summary.overallScore.toFixed(1)}%\n\n`;
        }
        markdown += `## テスト履歴\n\n`;
        markdown += `| 実行ID | 日時 | 環境 | 成功率 | 詳細 |\n`;
        markdown += `|--------|------|------|--------|------|\n`;
        for (const report of reports) {
            markdown += `| ${report.testRunId} | ${report.timestamp.toLocaleDateString('ja-JP')} | ${report.environment} | ${report.summary.overallScore.toFixed(1)}% | [詳細](./test-report-${report.testRunId}.md) |\n`;
        }
        return markdown;
    }
    /**
     * 運用ガイドの生成
     */
    async generateOperationalGuides() {
        console.log('   📖 運用ガイドを生成中...');
        const guides = [
            {
                filename: 'deployment-guide.md',
                title: 'デプロイメントガイド',
                content: this.generateDeploymentGuide()
            },
            {
                filename: 'monitoring-guide.md',
                title: '監視ガイド',
                content: this.generateMonitoringGuide()
            },
            {
                filename: 'troubleshooting-guide.md',
                title: 'トラブルシューティングガイド',
                content: this.generateTroubleshootingGuide()
            }
        ];
        for (const guide of guides) {
            await this.writeFile(`operations/${guide.filename}`, guide.content);
        }
        console.log(`   ✅ 運用ガイド生成完了 (${guides.length}ファイル)`);
    }
    /**
     * デプロイメントガイドの生成
     */
    generateDeploymentGuide() {
        return `# ${this.config.projectName} デプロイメントガイド

## 前提条件

- Node.js 20.x以上
- AWS CLI設定済み
- AWS CDK v2インストール済み

## デプロイ手順

### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 2. CDKブートストラップ

\`\`\`bash
npx cdk bootstrap
\`\`\`

### 3. スタックのデプロイ

\`\`\`bash
# 開発環境
npx cdk deploy --all -c environment=dev

# 本番環境
npx cdk deploy --all -c environment=prod
\`\`\`

## 設定項目

| 項目 | 説明 | デフォルト値 |
|------|------|-------------|
| projectName | プロジェクト名 | rag-system |
| environment | 環境名 | dev |
| region | AWSリージョン | ap-northeast-1 |

## トラブルシューティング

### よくある問題

1. **CDKブートストラップエラー**
   - AWS認証情報を確認してください
   - 適切な権限があることを確認してください

2. **デプロイタイムアウト**
   - CloudFormationコンソールでスタックの状態を確認してください
   - 必要に応じてロールバックしてください
`;
    }
    /**
     * 監視ガイドの生成
     */
    generateMonitoringGuide() {
        return `# ${this.config.projectName} 監視ガイド

## 監視項目

### Lambda関数
- 実行時間
- エラー率
- 同時実行数

### DynamoDB
- 読み取り/書き込み容量
- スロットリング
- エラー率

### OpenSearch
- クラスター状態
- 検索レスポンス時間
- インデックスサイズ

## アラート設定

### 重要度: Critical
- Lambda関数エラー率 > 5%
- DynamoDBスロットリング発生
- OpenSearchクラスター異常

### 重要度: Warning
- Lambda実行時間 > 10秒
- DynamoDB容量使用率 > 80%

## ダッシュボード

CloudWatchダッシュボードで以下のメトリクスを監視：

1. システム全体の健全性
2. パフォーマンスメトリクス
3. エラー率とレスポンス時間
`;
    }
    /**
     * トラブルシューティングガイドの生成
     */
    generateTroubleshootingGuide() {
        return `# ${this.config.projectName} トラブルシューティングガイド

## よくある問題と解決方法

### 1. 認証エラー

**症状**: ログインできない、認証トークンが無効

**原因**:
- Cognitoユーザープールの設定問題
- JWTトークンの期限切れ

**解決方法**:
1. Cognitoコンソールでユーザー状態を確認
2. トークンの有効期限を確認
3. 必要に応じてトークンを再発行

### 2. 検索結果が表示されない

**症状**: チャットで質問しても回答が返ってこない

**原因**:
- OpenSearchインデックスが空
- ベクトル埋め込みの問題
- Bedrock APIの制限

**解決方法**:
1. OpenSearchコンソールでインデックスを確認
2. ドキュメントの再インデックス
3. Bedrock APIの制限を確認

### 3. パフォーマンス問題

**症状**: レスポンスが遅い

**原因**:
- Lambda関数のコールドスタート
- DynamoDBの容量不足
- OpenSearchの性能問題

**解決方法**:
1. Lambda関数のウォームアップ
2. DynamoDBの容量設定見直し
3. OpenSearchのインスタンスタイプ変更

## ログの確認方法

### CloudWatch Logs
- Lambda関数のログ: \`/aws/lambda/[function-name]\`
- API Gatewayのログ: \`/aws/apigateway/[api-id]\`

### X-Ray トレース
- リクエストの詳細な追跡
- パフォーマンスボトルネックの特定
`;
    }
    /**
     * インデックスページの生成
     */
    async generateIndexPage() {
        const indexContent = `# ${this.config.projectName} ドキュメント

バージョン: ${this.config.version}

## 目次

### API仕様
- [API仕様書](./api/README.md)
- [OpenAPI仕様](./api/openapi.json)

### アーキテクチャ
- [システムアーキテクチャ](./architecture/README.md)
- [アーキテクチャ図](./architecture/architecture.mmd)

### テスト
- [テストレポート](./tests/README.md)

### 運用
- [デプロイメントガイド](./operations/deployment-guide.md)
- [監視ガイド](./operations/monitoring-guide.md)
- [トラブルシューティング](./operations/troubleshooting-guide.md)

## 生成日時
${new Date().toLocaleString('ja-JP')}
`;
        await this.writeFile('README.md', indexContent);
    }
}
exports.DocumentationGenerator = DocumentationGenerator;
// CLI実行用のメイン関数
async function main() {
    const config = {
        projectName: 'Permission-aware RAG System',
        version: '1.0.0',
        outputDirectory: './generated-docs',
        generateApiDocs: true,
        generateArchitectureDiagrams: true,
        generateTestReports: true,
        generateOperationalGuides: true,
        includeCodeExamples: true,
        includeScreenshots: false,
        formats: ['markdown', 'html']
    };
    const generator = new DocumentationGenerator(config);
    try {
        await generator.generateAllDocumentation();
        process.exit(0);
    }
    catch (error) {
        console.error('ドキュメント生成に失敗しました:', error);
        process.exit(1);
    }
}
// スクリプトとして直接実行された場合のみmain関数を呼び出し
if (require.main === module) {
    main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRhdGlvbi1nZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2N1bWVudGF0aW9uLWdlbmVyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBcUY3QixNQUFhLHNCQUFzQjtJQUNyQixNQUFNLENBQXNCO0lBQzVCLFdBQVcsQ0FBUztJQUU5QixZQUFZLE1BQTJCO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyx3QkFBd0I7UUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDN0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQzNELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFaEIsSUFBSSxDQUFDO1lBQ0QsY0FBYztZQUNkLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFFbkMsZUFBZTtZQUNmLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQzFDLENBQUM7WUFFRCxjQUFjO1lBQ2QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUM5QyxDQUFDO1lBRUQsYUFBYTtZQUNiLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDckMsQ0FBQztZQUVELFdBQVc7WUFDWCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMseUJBQXlCLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUMvQixNQUFNLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQzNDLENBQUM7WUFFRCxlQUFlO1lBQ2YsTUFBTSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUUvQixPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBRWxFLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QyxNQUFNLEtBQUssQ0FBQztRQUNoQixDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLHFCQUFxQjtRQUMvQix1QkFBdUI7UUFDdkIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFNUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUM3QixFQUFFLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVELGNBQWM7UUFDZCxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNoRixLQUFLLE1BQU0sTUFBTSxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMvRCxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLHNCQUFzQixDQUFDLFNBQWlCO1FBQzVDLFdBQVc7UUFDWCxJQUFJLENBQUMsU0FBUyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzlDLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELGdCQUFnQjtRQUNoQixNQUFNLGlCQUFpQixHQUFHO1lBQ3RCLE1BQU0sRUFBWSxXQUFXO1lBQzdCLEdBQUcsRUFBZSxjQUFjO1lBQ2hDLElBQUksRUFBYyxPQUFPO1lBQ3pCLFdBQVcsRUFBTyxhQUFhO1lBQy9CLE1BQU0sRUFBWSxPQUFPO1lBQ3pCLEtBQUssQ0FBYSxXQUFXO1NBQ2hDLENBQUM7UUFFRixLQUFLLE1BQU0sT0FBTyxJQUFJLGlCQUFpQixFQUFFLENBQUM7WUFDdEMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDdkQsQ0FBQztRQUNMLENBQUM7UUFFRCxZQUFZO1FBQ1osTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFcEUsc0JBQXNCO1FBQ3RCLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO1lBQzdDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELHFCQUFxQjtRQUNyQixJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQsT0FBTyxZQUFZLENBQUM7SUFDeEIsQ0FBQztJQUVEOztPQUVHO0lBQ08sS0FBSyxDQUFDLFNBQVMsQ0FBQyxZQUFvQixFQUFFLE9BQWU7UUFDM0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDNUUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFckQsb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxvQkFBb0I7UUFDcEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3RCLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsb0JBQW9CO1FBQ3BCLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyx3QkFBd0I7UUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFFdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLFlBQVksQ0FBQyxNQUFNLGtCQUFrQixDQUFDLENBQUM7UUFFNUQsb0JBQW9CO1FBQ3BCLE1BQU0sS0FBSyxHQUFvQixFQUFFLENBQUM7UUFFbEMsZUFBZTtRQUNmLEtBQUssQ0FBQyxJQUFJLENBQ04sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFlBQVksQ0FBQyxDQUNqRCxDQUFDO1FBRUYsb0JBQW9CO1FBQ3BCLEtBQUssQ0FBQyxJQUFJLENBQ04sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFlBQVksQ0FBQyxDQUNqRCxDQUFDO1FBRUYseUJBQXlCO1FBQ3pCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDdkMsS0FBSyxDQUFDLElBQUksQ0FDTixJQUFJLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLENBQzdDLENBQUM7UUFDTixDQUFDO1FBRUQsZ0JBQWdCO1FBQ2hCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV6QixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixZQUFZLENBQUMsTUFBTSxVQUFVLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMsMkJBQTJCLENBQUMsWUFBMkI7UUFDakUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNELE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMsMkJBQTJCLENBQUMsWUFBMkI7UUFDakUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNELE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLHVCQUF1QixDQUFDLFlBQTJCO1FBQzdELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkQsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxtQkFBbUI7UUFDN0IsNkJBQTZCO1FBQzdCLE1BQU0sU0FBUyxHQUFrQixFQUFFLENBQUM7UUFFcEMsc0JBQXNCO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4RCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUMzQixNQUFNLGVBQWUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELEtBQUssTUFBTSxJQUFJLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQztZQUNyQyxDQUFDO1FBQ0wsQ0FBQztRQUVELHVCQUF1QjtRQUN2QixTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztRQUU3QyxPQUFPLFNBQVMsQ0FBQztJQUNyQixDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMsa0JBQWtCLENBQUMsWUFBb0I7UUFDakQsTUFBTSxTQUFTLEdBQWtCLEVBQUUsQ0FBQztRQUVwQyxJQUFJLENBQUM7WUFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN0RCxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3BELDBCQUEwQjtnQkFDMUIsNEJBQTRCO2dCQUM1QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3RELElBQUksV0FBVyxFQUFFLENBQUM7b0JBQ2QsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTt3QkFDNUIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7b0JBQ3pFLENBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixZQUFZLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssc0JBQXNCLENBQUMsT0FBZSxFQUFFLFlBQW9CO1FBQ2hFLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFakQsT0FBTztZQUNILElBQUksRUFBRSxPQUFPO1lBQ2IsTUFBTSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLENBQUM7WUFDbEQsT0FBTyxFQUFFLEdBQUcsWUFBWSxTQUFTO1lBQ2pDLFdBQVcsRUFBRSxHQUFHLFlBQVksZUFBZTtZQUMzQyxVQUFVLEVBQUUsRUFBRTtZQUNkLFNBQVMsRUFBRSxDQUFDO29CQUNSLFVBQVUsRUFBRSxHQUFHO29CQUNmLFdBQVcsRUFBRSxJQUFJO29CQUNqQixXQUFXLEVBQUUsa0JBQWtCO2lCQUNsQyxDQUFDO1lBQ0YsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLFFBQVEsRUFBRSxDQUFDLFlBQVksQ0FBQztTQUMzQixDQUFDO0lBQ04sQ0FBQztJQUVEOztPQUVHO0lBQ0ssdUJBQXVCLENBQUMsWUFBb0I7UUFDaEQsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDaEYsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQUUsT0FBTyxNQUFNLENBQUM7UUFDdEYsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQ2xELElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFBRSxPQUFPLFFBQVEsQ0FBQztRQUNyRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLFFBQVE7SUFDM0IsQ0FBQztJQUVEOztPQUVHO0lBQ0ssZ0JBQWdCLENBQUMsT0FBZTtRQUNwQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFDM0MsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUFFLE9BQU8sTUFBTSxDQUFDO1FBQzdDLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7WUFBRSxPQUFPLFFBQVEsQ0FBQztRQUNuRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQUUsT0FBTyxNQUFNLENBQUM7UUFDN0MsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssa0JBQWtCO1FBQ3RCLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixNQUFNLEVBQUUsTUFBTTtnQkFDZCxPQUFPLEVBQUUsVUFBVTtnQkFDbkIsV0FBVyxFQUFFLDBCQUEwQjtnQkFDdkMsVUFBVSxFQUFFLEVBQUU7Z0JBQ2QsV0FBVyxFQUFFO29CQUNULFdBQVcsRUFBRSxRQUFRO29CQUNyQixXQUFXLEVBQUUsa0JBQWtCO29CQUMvQixNQUFNLEVBQUU7d0JBQ0osSUFBSSxFQUFFLFFBQVE7d0JBQ2QsVUFBVSxFQUFFOzRCQUNSLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRTs0QkFDbEQsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFO3lCQUNyRDt3QkFDRCxRQUFRLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO3FCQUNyQztvQkFDRCxPQUFPLEVBQUU7d0JBQ0wsUUFBUSxFQUFFLFVBQVU7d0JBQ3BCLFFBQVEsRUFBRSxhQUFhO3FCQUMxQjtpQkFDSjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1A7d0JBQ0ksVUFBVSxFQUFFLEdBQUc7d0JBQ2YsV0FBVyxFQUFFLFFBQVE7d0JBQ3JCLFdBQVcsRUFBRSxrQkFBa0I7d0JBQy9CLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxVQUFVLEVBQUU7Z0NBQ1IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFO2dDQUNsRCxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUU7NkJBQ3hEO3lCQUNKO3dCQUNELE9BQU8sRUFBRTs0QkFDTCxLQUFLLEVBQUUseUNBQXlDOzRCQUNoRCxTQUFTLEVBQUUsSUFBSTt5QkFDbEI7cUJBQ0o7b0JBQ0Q7d0JBQ0ksVUFBVSxFQUFFLEdBQUc7d0JBQ2YsV0FBVyxFQUFFLFFBQVE7d0JBQ3JCLFdBQVcsRUFBRSxrQkFBa0I7d0JBQy9CLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxVQUFVLEVBQUU7Z0NBQ1IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFOzZCQUNyRDt5QkFDSjt3QkFDRCxPQUFPLEVBQUU7NEJBQ0wsS0FBSyxFQUFFLHFCQUFxQjt5QkFDL0I7cUJBQ0o7aUJBQ0o7Z0JBQ0QsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDO2dCQUNaLFFBQVEsRUFBRSxFQUFFO2FBQ2Y7WUFDRDtnQkFDSSxJQUFJLEVBQUUsV0FBVztnQkFDakIsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLFdBQVcsRUFBRSwyQkFBMkI7Z0JBQ3hDLFVBQVUsRUFBRSxFQUFFO2dCQUNkLFdBQVcsRUFBRTtvQkFDVCxXQUFXLEVBQUUsV0FBVztvQkFDeEIsV0FBVyxFQUFFLGtCQUFrQjtvQkFDL0IsTUFBTSxFQUFFO3dCQUNKLElBQUksRUFBRSxRQUFRO3dCQUNkLFVBQVUsRUFBRTs0QkFDUixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7NEJBQ3JELFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRTt5QkFDeEQ7d0JBQ0QsUUFBUSxFQUFFLENBQUMsU0FBUyxDQUFDO3FCQUN4QjtvQkFDRCxPQUFPLEVBQUU7d0JBQ0wsT0FBTyxFQUFFLGlDQUFpQzt3QkFDMUMsU0FBUyxFQUFFLGFBQWE7cUJBQzNCO2lCQUNKO2dCQUNELFNBQVMsRUFBRTtvQkFDUDt3QkFDSSxVQUFVLEVBQUUsR0FBRzt3QkFDZixXQUFXLEVBQUUsUUFBUTt3QkFDckIsV0FBVyxFQUFFLGtCQUFrQjt3QkFDL0IsTUFBTSxFQUFFOzRCQUNKLElBQUksRUFBRSxRQUFROzRCQUNkLFVBQVUsRUFBRTtnQ0FDUixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUU7Z0NBQ2pELE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRTtnQ0FDaEQsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFOzZCQUN4RDt5QkFDSjt3QkFDRCxPQUFPLEVBQUU7NEJBQ0wsUUFBUSxFQUFFLHNEQUFzRDs0QkFDaEUsT0FBTyxFQUFFLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQzs0QkFDM0MsU0FBUyxFQUFFLGFBQWE7eUJBQzNCO3FCQUNKO2lCQUNKO2dCQUNELElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztnQkFDZCxRQUFRLEVBQUUsQ0FBQyxZQUFZLENBQUM7YUFDM0I7WUFDRDtnQkFDSSxJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixNQUFNLEVBQUUsS0FBSztnQkFDYixPQUFPLEVBQUUsWUFBWTtnQkFDckIsV0FBVyxFQUFFLDBCQUEwQjtnQkFDdkMsVUFBVSxFQUFFO29CQUNSO3dCQUNJLElBQUksRUFBRSxNQUFNO3dCQUNaLEVBQUUsRUFBRSxPQUFPO3dCQUNYLFFBQVEsRUFBRSxLQUFLO3dCQUNmLElBQUksRUFBRSxTQUFTO3dCQUNmLFdBQVcsRUFBRSxPQUFPO3dCQUNwQixPQUFPLEVBQUUsQ0FBQztxQkFDYjtvQkFDRDt3QkFDSSxJQUFJLEVBQUUsT0FBTzt3QkFDYixFQUFFLEVBQUUsT0FBTzt3QkFDWCxRQUFRLEVBQUUsS0FBSzt3QkFDZixJQUFJLEVBQUUsU0FBUzt3QkFDZixXQUFXLEVBQUUsWUFBWTt3QkFDekIsT0FBTyxFQUFFLEVBQUU7cUJBQ2Q7aUJBQ0o7Z0JBQ0QsU0FBUyxFQUFFO29CQUNQO3dCQUNJLFVBQVUsRUFBRSxHQUFHO3dCQUNmLFdBQVcsRUFBRSxVQUFVO3dCQUN2QixXQUFXLEVBQUUsa0JBQWtCO3dCQUMvQixNQUFNLEVBQUU7NEJBQ0osSUFBSSxFQUFFLFFBQVE7NEJBQ2QsVUFBVSxFQUFFO2dDQUNSLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRTtnQ0FDckQsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFO2dDQUM3QyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUU7NkJBQ2xEO3lCQUNKO3FCQUNKO2lCQUNKO2dCQUNELElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQztnQkFDaEIsUUFBUSxFQUFFLENBQUMsWUFBWSxDQUFDO2FBQzNCO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsT0FBTyxFQUFFLGNBQWM7Z0JBQ3ZCLFdBQVcsRUFBRSxxQkFBcUI7Z0JBQ2xDLFVBQVUsRUFBRSxFQUFFO2dCQUNkLFdBQVcsRUFBRTtvQkFDVCxXQUFXLEVBQUUsWUFBWTtvQkFDekIsV0FBVyxFQUFFLHFCQUFxQjtvQkFDbEMsTUFBTSxFQUFFO3dCQUNKLElBQUksRUFBRSxRQUFRO3dCQUNkLFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRTs0QkFDckUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFOzRCQUNwRCxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUU7eUJBQzNEO3dCQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztxQkFDckI7aUJBQ0o7Z0JBQ0QsU0FBUyxFQUFFO29CQUNQO3dCQUNJLFVBQVUsRUFBRSxHQUFHO3dCQUNmLFdBQVcsRUFBRSxVQUFVO3dCQUN2QixXQUFXLEVBQUUsa0JBQWtCO3dCQUMvQixNQUFNLEVBQUU7NEJBQ0osSUFBSSxFQUFFLFFBQVE7NEJBQ2QsVUFBVSxFQUFFO2dDQUNSLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRTtnQ0FDL0MsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFO2dDQUNsRCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUU7NkJBQ2xEO3lCQUNKO3FCQUNKO2lCQUNKO2dCQUNELElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQztnQkFDaEIsUUFBUSxFQUFFLENBQUMsWUFBWSxDQUFDO2FBQzNCO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNLLG1CQUFtQixDQUFDLFNBQXdCO1FBQ2hELE1BQU0sSUFBSSxHQUFHO1lBQ1QsT0FBTyxFQUFFLE9BQU87WUFDaEIsSUFBSSxFQUFFO2dCQUNGLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxNQUFNO2dCQUN2QyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUM1QixXQUFXLEVBQUUsK0NBQStDO2dCQUM1RCxPQUFPLEVBQUU7b0JBQ0wsSUFBSSxFQUFFLDhCQUE4QjtvQkFDcEMsS0FBSyxFQUFFLHFCQUFxQjtpQkFDL0I7YUFDSjtZQUNELE9BQU8sRUFBRTtnQkFDTDtvQkFDSSxHQUFHLEVBQUUseUJBQXlCO29CQUM5QixXQUFXLEVBQUUsTUFBTTtpQkFDdEI7Z0JBQ0Q7b0JBQ0ksR0FBRyxFQUFFLGlDQUFpQztvQkFDdEMsV0FBVyxFQUFFLFVBQVU7aUJBQzFCO2FBQ0o7WUFDRCxVQUFVLEVBQUU7Z0JBQ1IsZUFBZSxFQUFFO29CQUNiLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsTUFBTTt3QkFDWixNQUFNLEVBQUUsUUFBUTt3QkFDaEIsWUFBWSxFQUFFLEtBQUs7cUJBQ3RCO2lCQUNKO2FBQ0o7WUFDRCxLQUFLLEVBQUUsRUFBRTtTQUNaLENBQUM7UUFFRixhQUFhO1FBQ2IsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ25DLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUc7Z0JBQ3ZELE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztnQkFDekIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO2dCQUNqQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7Z0JBQ25CLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtvQkFDaEIsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNaLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUTtvQkFDeEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUU7b0JBQzVCLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVztvQkFDOUIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2lCQUN6QixDQUFDLENBQUM7Z0JBQ0gsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUNoQyxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXO29CQUM3QyxPQUFPLEVBQUU7d0JBQ0wsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxFQUFFOzRCQUNoQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNOzRCQUNuQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPO3lCQUN4QztxQkFDSjtpQkFDSixDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUNiLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRTtvQkFDbkQsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRzt3QkFDdkIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO3dCQUNqQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7NEJBQzVCLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dDQUNwQixNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07Z0NBQ3ZCLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTzs2QkFDNUI7eUJBQ0osQ0FBQyxDQUFDLENBQUMsU0FBUztxQkFDaEIsQ0FBQztvQkFDRixPQUFPLEdBQUcsQ0FBQztnQkFDZixDQUFDLEVBQUUsRUFBUyxDQUFDO2dCQUNiLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUzthQUMxRixDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0Q7O1FBRUk7SUFDSSxtQkFBbUIsQ0FBQyxTQUF3QjtRQUNoRCxJQUFJLFFBQVEsR0FBRyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxpQkFBaUIsQ0FBQztRQUM3RCxRQUFRLElBQUksVUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDO1FBQzlDLFFBQVEsSUFBSSxTQUFTLElBQUksSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFOUQsUUFBUTtRQUNSLFFBQVEsSUFBSSxXQUFXLENBQUM7UUFDeEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDZixRQUFRLElBQUksTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFDSCxRQUFRLElBQUksSUFBSSxDQUFDO1FBRWpCLE9BQU87UUFDUCxRQUFRLElBQUksV0FBVyxDQUFDO1FBQ3hCLFFBQVEsSUFBSSxtQ0FBbUMsQ0FBQztRQUNoRCxRQUFRLElBQUksa0RBQWtELENBQUM7UUFFL0Qsb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDZixRQUFRLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUU1QixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRSxZQUFZLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUM1QixRQUFRLElBQUksT0FBTyxRQUFRLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxJQUFJLE1BQU0sQ0FBQztnQkFDMUQsUUFBUSxJQUFJLEdBQUcsUUFBUSxDQUFDLFdBQVcsTUFBTSxDQUFDO2dCQUUxQyxRQUFRO2dCQUNSLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLFFBQVEsSUFBSSxnQkFBZ0IsQ0FBQztvQkFDN0IsUUFBUSxJQUFJLDZCQUE2QixDQUFDO29CQUMxQyxRQUFRLElBQUkseUNBQXlDLENBQUM7b0JBQ3RELFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO3dCQUNoQyxRQUFRLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLE1BQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sS0FBSyxDQUFDLElBQUksTUFBTSxLQUFLLENBQUMsV0FBVyxNQUFNLENBQUM7b0JBQzFILENBQUMsQ0FBQyxDQUFDO29CQUNILFFBQVEsSUFBSSxJQUFJLENBQUM7Z0JBQ3JCLENBQUM7Z0JBRUQsV0FBVztnQkFDWCxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDdkIsUUFBUSxJQUFJLG1CQUFtQixDQUFDO29CQUNoQyxRQUFRLElBQUkscUJBQXFCLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxNQUFNLENBQUM7b0JBQ3hFLFFBQVEsSUFBSSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxNQUFNLENBQUM7b0JBRXRELElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDL0IsUUFBUSxJQUFJLFlBQVksQ0FBQzt3QkFDekIsUUFBUSxJQUFJLFdBQVcsQ0FBQzt3QkFDeEIsUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUNsRSxRQUFRLElBQUksV0FBVyxDQUFDO29CQUM1QixDQUFDO2dCQUNMLENBQUM7Z0JBRUQsUUFBUTtnQkFDUixRQUFRLElBQUksZ0JBQWdCLENBQUM7Z0JBQzdCLFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUNsQyxRQUFRLElBQUksS0FBSyxRQUFRLENBQUMsVUFBVSxRQUFRLFFBQVEsQ0FBQyxXQUFXLE1BQU0sQ0FBQztvQkFFdkUsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ25CLFFBQVEsSUFBSSxXQUFXLENBQUM7d0JBQ3hCLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN0RCxRQUFRLElBQUksV0FBVyxDQUFDO29CQUM1QixDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVILFFBQVEsSUFBSSxTQUFTLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7T0FFRztJQUNLLGVBQWUsQ0FBQyxTQUF3QjtRQUM1QyxPQUFPOzs7Ozs7YUFNRixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBeUJsQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVc7d0JBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxZQUFZLElBQUksSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQzs7Ozs7Y0FLM0UsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUN6RCxhQUFhLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FDL0MsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDOzs7Ozs7Ozs7VUFTUixDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7c0JBQzVDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxHQUFHO2NBQ2pDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDOzs7OENBRzVCLFFBQVEsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLE1BQU07a0NBQy9DLFFBQVEsQ0FBQyxJQUFJO3NFQUN1QixRQUFRLENBQUMsT0FBTzs7OzZCQUd6RCxRQUFRLENBQUMsV0FBVzs7MEJBRXZCLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7Ozs7c0NBT3JCLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7O3dEQUVmLEtBQUssQ0FBQyxJQUFJO2tEQUNoQixLQUFLLENBQUMsRUFBRTtrREFDUixLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7a0RBQ3pCLEtBQUssQ0FBQyxJQUFJO2tEQUNWLEtBQUssQ0FBQyxXQUFXOztxQ0FFOUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Ozt5QkFHdEIsQ0FBQyxDQUFDLENBQUMsRUFBRTs7MEJBRUosUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7O2dFQUVlLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVztpQ0FDL0QsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXOzhCQUNuQyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7K0RBQ0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDOzZCQUN2RixDQUFDLENBQUMsQ0FBQyxFQUFFO3lCQUNULENBQUMsQ0FBQyxDQUFDLEVBQUU7OzswQkFHSixRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2tDQUMzQixRQUFRLENBQUMsVUFBVSxNQUFNLFFBQVEsQ0FBQyxXQUFXOzhCQUNqRCxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzsrREFDYyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQzs2QkFDM0UsQ0FBQyxDQUFDLENBQUMsRUFBRTt5QkFDVCxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzs7O2FBR3RCLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1NBQ2QsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Ozs7S0FJZCxDQUFDO0lBQ0YsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLDRCQUE0QjtRQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDNUMsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUU5RCxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsVUFBVSxDQUFDLE1BQU0sa0JBQWtCLENBQUMsQ0FBQztRQUUxRCxvQkFBb0I7UUFDcEIsTUFBTSxLQUFLLEdBQW9CLEVBQUUsQ0FBQztRQUVsQyxjQUFjO1FBQ2QsS0FBSyxDQUFDLElBQUksQ0FDTixJQUFJLENBQUMsOEJBQThCLENBQUMsVUFBVSxDQUFDLENBQ2xELENBQUM7UUFFRixtQkFBbUI7UUFDbkIsS0FBSyxDQUFDLElBQUksQ0FDTixJQUFJLENBQUMsb0NBQW9DLENBQUMsVUFBVSxDQUFDLENBQ3hELENBQUM7UUFFRixnQkFBZ0I7UUFDaEIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXpCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLFVBQVUsQ0FBQyxNQUFNLFVBQVUsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxVQUFtQztRQUM1RSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0QsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLHFDQUFxQyxFQUFFLG1DQUFtQyxjQUFjLFlBQVksQ0FBQyxDQUFDO0lBQy9ILENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxVQUFtQztRQUNsRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkUsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLHdCQUF3QixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRTdELE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLFVBQVUsQ0FBQyxNQUFNLFVBQVUsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRDs7T0FFRztJQUNLLEtBQUssQ0FBQyw2QkFBNkI7UUFDdkMsT0FBTztZQUNIO2dCQUNJLEVBQUUsRUFBRSxZQUFZO2dCQUNoQixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLG9CQUFvQjtnQkFDakMsVUFBVSxFQUFFLG1CQUFtQjtnQkFDL0IsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztnQkFDM0IsVUFBVSxFQUFFO29CQUNSLE9BQU8sRUFBRSxJQUFJO29CQUNiLEdBQUcsRUFBRSxJQUFJO29CQUNULElBQUksRUFBRSxJQUFJO2lCQUNiO2FBQ0o7WUFDRDtnQkFDSSxFQUFFLEVBQUUsS0FBSztnQkFDVCxJQUFJLEVBQUUsS0FBSztnQkFDWCxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsV0FBVyxFQUFFLHFCQUFxQjtnQkFDbEMsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQztnQkFDcEIsVUFBVSxFQUFFO29CQUNSLHNCQUFzQixFQUFFLElBQUk7b0JBQzVCLGFBQWEsRUFBRSxJQUFJO29CQUNuQixZQUFZLEVBQUUsSUFBSTtpQkFDckI7YUFDSjtZQUNEO2dCQUNJLEVBQUUsRUFBRSxLQUFLO2dCQUNULElBQUksRUFBRSwyQkFBMkI7Z0JBQ2pDLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSxrQkFBa0I7Z0JBQy9CLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixXQUFXLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO2dCQUN6QyxVQUFVLEVBQUU7b0JBQ1IsV0FBVyxFQUFFLElBQUk7b0JBQ2pCLGNBQWMsRUFBRSxJQUFJO2lCQUN2QjthQUNKO1lBQ0Q7Z0JBQ0ksRUFBRSxFQUFFLFlBQVk7Z0JBQ2hCLElBQUksRUFBRSxZQUFZO2dCQUNsQixJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsd0JBQXdCO2dCQUNyQyxVQUFVLEVBQUUsc0JBQXNCO2dCQUNsQyxXQUFXLEVBQUUsQ0FBQyxZQUFZLENBQUM7Z0JBQzNCLFVBQVUsRUFBRTtvQkFDUixPQUFPLEVBQUUsWUFBWTtvQkFDckIsTUFBTSxFQUFFLFFBQVE7b0JBQ2hCLE9BQU8sRUFBRSxLQUFLO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksRUFBRSxFQUFFLFlBQVk7Z0JBQ2hCLElBQUksRUFBRSxZQUFZO2dCQUNsQixJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsa0JBQWtCO2dCQUMvQixVQUFVLEVBQUUseUJBQXlCO2dCQUNyQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUM7Z0JBQ3pELFVBQVUsRUFBRTtvQkFDUixPQUFPLEVBQUUsWUFBWTtvQkFDckIsTUFBTSxFQUFFLFFBQVE7b0JBQ2hCLE9BQU8sRUFBRSxJQUFJO2lCQUNoQjthQUNKO1lBQ0Q7Z0JBQ0ksRUFBRSxFQUFFLGNBQWM7Z0JBQ2xCLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSxjQUFjO2dCQUMzQixVQUFVLEVBQUUscUJBQXFCO2dCQUNqQyxXQUFXLEVBQUUsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQztnQkFDN0MsVUFBVSxFQUFFO29CQUNSLE9BQU8sRUFBRSxZQUFZO29CQUNyQixNQUFNLEVBQUUsUUFBUTtvQkFDaEIsT0FBTyxFQUFFLEtBQUs7aUJBQ2pCO2FBQ0o7WUFDRDtnQkFDSSxFQUFFLEVBQUUsVUFBVTtnQkFDZCxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLFdBQVcsRUFBRSxpQkFBaUI7Z0JBQzlCLFVBQVUsRUFBRSxpQkFBaUI7Z0JBQzdCLFdBQVcsRUFBRSxFQUFFO2dCQUNmLFVBQVUsRUFBRTtvQkFDUixXQUFXLEVBQUUsaUJBQWlCO29CQUM5QixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsbUJBQW1CLEVBQUUsSUFBSTtpQkFDNUI7YUFDSjtZQUNEO2dCQUNJLEVBQUUsRUFBRSxZQUFZO2dCQUNoQixJQUFJLEVBQUUsdUJBQXVCO2dCQUM3QixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsV0FBVyxFQUFFLFlBQVk7Z0JBQ3pCLFVBQVUsRUFBRSw4QkFBOEI7Z0JBQzFDLFdBQVcsRUFBRSxFQUFFO2dCQUNmLFVBQVUsRUFBRTtvQkFDUixZQUFZLEVBQUUsSUFBSTtvQkFDbEIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFVBQVUsRUFBRSxJQUFJO2lCQUNuQjthQUNKO1lBQ0Q7Z0JBQ0ksRUFBRSxFQUFFLEtBQUs7Z0JBQ1QsSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLGNBQWM7Z0JBQzNCLFVBQVUsRUFBRSw2QkFBNkI7Z0JBQ3pDLFdBQVcsRUFBRSxFQUFFO2dCQUNmLFVBQVUsRUFBRTtvQkFDUixRQUFRLEVBQUUsU0FBUztvQkFDbkIsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFdBQVcsRUFBRSxJQUFJO29CQUNqQixTQUFTLEVBQUUsSUFBSTtpQkFDbEI7YUFDSjtZQUNEO2dCQUNJLEVBQUUsRUFBRSxTQUFTO2dCQUNiLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSxhQUFhO2dCQUMxQixVQUFVLEVBQUUsZ0JBQWdCO2dCQUM1QixXQUFXLEVBQUUsRUFBRTtnQkFDZixVQUFVLEVBQUU7b0JBQ1IsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQztvQkFDM0IsU0FBUyxFQUFFLElBQUk7b0JBQ2YsY0FBYyxFQUFFLElBQUk7aUJBQ3ZCO2FBQ0o7WUFDRDtnQkFDSSxFQUFFLEVBQUUsU0FBUztnQkFDYixJQUFJLEVBQUUsU0FBUztnQkFDZixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLFVBQVUsRUFBRSxnQkFBZ0I7Z0JBQzVCLFdBQVcsRUFBRSxDQUFDLFlBQVksQ0FBQztnQkFDM0IsVUFBVSxFQUFFO29CQUNSLFFBQVEsRUFBRSxJQUFJO29CQUNkLEdBQUcsRUFBRSxJQUFJO29CQUNULEtBQUssRUFBRSxJQUFJO2lCQUNkO2FBQ0o7WUFDRDtnQkFDSSxFQUFFLEVBQUUsWUFBWTtnQkFDaEIsSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLElBQUksRUFBRSxZQUFZO2dCQUNsQixXQUFXLEVBQUUsWUFBWTtnQkFDekIsVUFBVSxFQUFFLG1CQUFtQjtnQkFDL0IsV0FBVyxFQUFFLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUM7Z0JBQ3pELFVBQVUsRUFBRTtvQkFDUixJQUFJLEVBQUUsSUFBSTtvQkFDVixPQUFPLEVBQUUsSUFBSTtvQkFDYixNQUFNLEVBQUUsSUFBSTtpQkFDZjthQUNKO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNLLHNCQUFzQixDQUFDLFVBQW1DO1FBQzlELElBQUksT0FBTyxHQUFHLFlBQVksQ0FBQztRQUUzQixTQUFTO1FBQ1QsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUMzQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxPQUFPLElBQUksT0FBTyxTQUFTLENBQUMsRUFBRSxHQUFHLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxRQUFRLFNBQVMsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ3hJLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFJLElBQUksQ0FBQztRQUVoQixRQUFRO1FBQ1IsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUMzQixTQUFTLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDdkMsT0FBTyxJQUFJLE9BQU8sU0FBUyxDQUFDLEVBQUUsUUFBUSxVQUFVLElBQUksQ0FBQztZQUN6RCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsVUFBVTtRQUNWLE9BQU8sSUFBSSxJQUFJLENBQUM7UUFDaEIsT0FBTyxJQUFJLHFDQUFxQyxDQUFDO1FBQ2pELE9BQU8sSUFBSSxzQ0FBc0MsQ0FBQztRQUNsRCxPQUFPLElBQUkscUNBQXFDLENBQUM7UUFDakQsT0FBTyxJQUFJLHFDQUFxQyxDQUFDO1FBQ2pELE9BQU8sSUFBSSxzQ0FBc0MsQ0FBQztRQUNsRCxPQUFPLElBQUksd0NBQXdDLENBQUM7UUFFcEQsU0FBUztRQUNULFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDM0IsT0FBTyxJQUFJLGFBQWEsU0FBUyxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQ7O09BRUc7SUFDSyxZQUFZLENBQUMsSUFBWTtRQUM3QixRQUFRLElBQUksRUFBRSxDQUFDO1lBQ1gsS0FBSyxTQUFTLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQztZQUMzQixLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDO1lBQzdCLEtBQUssU0FBUyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUM7WUFDNUIsS0FBSyxTQUFTLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQztZQUMzQixLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDO1lBQzVCLEtBQUssWUFBWSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUM7WUFDL0IsT0FBTyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUM7UUFDeEIsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLDRCQUE0QixDQUFDLFVBQW1DO1FBQ3BFLElBQUksUUFBUSxHQUFHLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLGtCQUFrQixDQUFDO1FBQzlELFFBQVEsSUFBSSxTQUFTLElBQUksSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFOUQsS0FBSztRQUNMLFFBQVEsSUFBSSxXQUFXLENBQUM7UUFDeEIsUUFBUSxJQUFJLGlKQUFpSixDQUFDO1FBRTlKLFdBQVc7UUFDWCxRQUFRLElBQUksZ0JBQWdCLENBQUM7UUFDN0IsUUFBUSxJQUFJLGNBQWMsQ0FBQztRQUMzQixRQUFRLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BELFFBQVEsSUFBSSxXQUFXLENBQUM7UUFFeEIsYUFBYTtRQUNiLE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUMxRCxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDbkQsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEMsT0FBTyxHQUFHLENBQUM7UUFDZixDQUFDLEVBQUUsRUFBNkMsQ0FBQyxDQUFDO1FBRWxELE1BQU0sU0FBUyxHQUFHO1lBQ2QsT0FBTyxFQUFFLE1BQU07WUFDZixRQUFRLEVBQUUsUUFBUTtZQUNsQixPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUUsUUFBUTtZQUNqQixRQUFRLEVBQUUsUUFBUTtZQUNsQixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDO1FBRUYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDdkQsUUFBUSxJQUFJLE1BQU0sU0FBUyxDQUFDLElBQThCLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQztZQUUxRSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUN0QixRQUFRLElBQUksT0FBTyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUM7Z0JBQ3hDLFFBQVEsSUFBSSxXQUFXLFNBQVMsQ0FBQyxVQUFVLE1BQU0sQ0FBQztnQkFDbEQsUUFBUSxJQUFJLFdBQVcsU0FBUyxDQUFDLFdBQVcsTUFBTSxDQUFDO2dCQUVuRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDL0MsUUFBUSxJQUFJLGFBQWEsQ0FBQztvQkFDMUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTt3QkFDMUQsUUFBUSxJQUFJLEtBQUssR0FBRyxLQUFLLEtBQUssSUFBSSxDQUFDO29CQUN2QyxDQUFDLENBQUMsQ0FBQztvQkFDSCxRQUFRLElBQUksSUFBSSxDQUFDO2dCQUNyQixDQUFDO2dCQUVELElBQUksU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ25DLFFBQVEsSUFBSSxZQUFZLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ25FLENBQUM7Z0JBRUQsUUFBUSxJQUFJLFNBQVMsQ0FBQztZQUMxQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLFNBQVMsQ0FBQyxZQUFvQixFQUFFLE9BQWU7UUFDekQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN0RSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRW5DLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdEIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRDs7U0FFSztJQUNHLG1CQUFtQixDQUFDLFNBQXdCO1FBQ2hELElBQUksUUFBUSxHQUFHLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLGlCQUFpQixDQUFDO1FBQzdELFFBQVEsSUFBSSxVQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxNQUFNLENBQUM7UUFDaEQsUUFBUSxJQUFJLHFEQUFxRCxDQUFDO1FBRWxFLG9CQUFvQjtRQUNwQixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUU3RCxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7WUFDakUsUUFBUSxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFFNUIsS0FBSyxNQUFNLFFBQVEsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDbEMsUUFBUSxJQUFJLE9BQU8sUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxNQUFNLENBQUM7Z0JBQzFELFFBQVEsSUFBSSxHQUFHLFFBQVEsQ0FBQyxXQUFXLE1BQU0sQ0FBQztnQkFFMUMsUUFBUTtnQkFDUixJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNqQyxRQUFRLElBQUksZ0JBQWdCLENBQUM7b0JBQzdCLFFBQVEsSUFBSSw2QkFBNkIsQ0FBQztvQkFDMUMsUUFBUSxJQUFJLHNDQUFzQyxDQUFDO29CQUVuRCxLQUFLLE1BQU0sS0FBSyxJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDdEMsUUFBUSxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksTUFBTSxLQUFLLENBQUMsRUFBRSxNQUFNLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sS0FBSyxDQUFDLFdBQVcsTUFBTSxDQUFDO29CQUMxSCxDQUFDO29CQUNELFFBQVEsSUFBSSxJQUFJLENBQUM7Z0JBQ3JCLENBQUM7Z0JBRUQsUUFBUTtnQkFDUixRQUFRLElBQUksZ0JBQWdCLENBQUM7Z0JBQzdCLEtBQUssTUFBTSxRQUFRLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUN4QyxRQUFRLElBQUksS0FBSyxRQUFRLENBQUMsVUFBVSxRQUFRLFFBQVEsQ0FBQyxXQUFXLE1BQU0sQ0FBQztvQkFDdkUsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ25CLFFBQVEsSUFBSSxlQUFlLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQztvQkFDdkYsQ0FBQztnQkFDTCxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFFRCxPQUFPLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDSyxlQUFlLENBQUMsU0FBd0I7UUFDNUMsTUFBTSxLQUFLLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsYUFBYSxDQUFDO1FBRXRELElBQUksSUFBSSxHQUFHOzs7OzthQUtOLEtBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQXFCSixLQUFLO29CQUNDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTzs7Q0FFdEMsQ0FBQztRQUVNLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTdELEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztZQUNqRSxJQUFJLElBQUksZUFBZSxHQUFHLFNBQVMsQ0FBQztZQUVwQyxLQUFLLE1BQU0sUUFBUSxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNsQyxJQUFJLElBQUk7O3NDQUVjLFFBQVEsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLE1BQU07MEJBQy9DLFFBQVEsQ0FBQyxJQUFJO3FCQUNsQixRQUFRLENBQUMsV0FBVzs7O0NBR3hDLENBQUM7Z0JBRWMsWUFBWTtnQkFDWixJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNqQyxJQUFJLElBQUk7OztDQUczQixDQUFDO29CQUNrQixLQUFLLE1BQU0sS0FBSyxJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDdEMsSUFBSSxJQUFJOzhCQUNGLEtBQUssQ0FBQyxJQUFJOzhCQUNWLEtBQUssQ0FBQyxFQUFFOzhCQUNSLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTs4QkFDekIsS0FBSyxDQUFDLElBQUk7OEJBQ1YsS0FBSyxDQUFDLFdBQVc7O0NBRTlDLENBQUM7b0JBQ2tCLENBQUM7b0JBQ0QsSUFBSSxJQUFJO0NBQzNCLENBQUM7Z0JBQ2MsQ0FBQztnQkFFRCxTQUFTO2dCQUNULElBQUksSUFBSTtDQUN2QixDQUFDO2dCQUNjLEtBQUssTUFBTSxRQUFRLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUN4QyxJQUFJLElBQUksOEJBQThCLFFBQVEsQ0FBQyxVQUFVLGVBQWUsUUFBUSxDQUFDLFdBQVc7Q0FDL0csQ0FBQztvQkFDa0IsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ25CLElBQUksSUFBSSw4QkFBOEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Q0FDdEcsQ0FBQztvQkFDa0IsQ0FBQztnQkFDTCxDQUFDO2dCQUVELElBQUksSUFBSTs7Q0FFdkIsQ0FBQztZQUNVLENBQUM7UUFDTCxDQUFDO1FBRUQsSUFBSSxJQUFJOztRQUVSLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSyxtQkFBbUIsQ0FBQyxTQUF3QjtRQUNoRCxNQUFNLE9BQU8sR0FBa0MsRUFBRSxDQUFDO1FBRWxELEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7WUFDL0IsS0FBSyxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztnQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7UUFDTCxDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLDRCQUE0QjtRQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDNUMsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUU5RCxjQUFjO1FBQ2QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQywrQkFBK0IsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUV0RSxtQkFBbUI7UUFDbkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUU3RCxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixVQUFVLENBQUMsTUFBTSxVQUFVLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMsNkJBQTZCO1FBQ3ZDLHdCQUF3QjtRQUN4QixNQUFNLFVBQVUsR0FBNEI7WUFDeEM7Z0JBQ0ksRUFBRSxFQUFFLFlBQVk7Z0JBQ2hCLElBQUksRUFBRSxZQUFZO2dCQUNsQixJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsVUFBVTtnQkFDdkIsVUFBVSxFQUFFLGdCQUFnQjtnQkFDNUIsV0FBVyxFQUFFLENBQUMsb0JBQW9CLENBQUM7Z0JBQ25DLFVBQVUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTthQUMzQztZQUNEO2dCQUNJLEVBQUUsRUFBRSxvQkFBb0I7Z0JBQ3hCLElBQUksRUFBRSxvQkFBb0I7Z0JBQzFCLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSxpQkFBaUI7Z0JBQzlCLFVBQVUsRUFBRSxzQkFBc0I7Z0JBQ2xDLFdBQVcsRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUM7Z0JBQ3hDLFVBQVUsRUFBRSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUU7YUFDeEM7WUFDRDtnQkFDSSxFQUFFLEVBQUUsYUFBYTtnQkFDakIsSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSxVQUFVO2dCQUN2QixVQUFVLEVBQUUsaUJBQWlCO2dCQUM3QixXQUFXLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQztnQkFDakMsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO2FBQzlDO1lBQ0Q7Z0JBQ0ksRUFBRSxFQUFFLGtCQUFrQjtnQkFDdEIsSUFBSSxFQUFFLGtCQUFrQjtnQkFDeEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLFVBQVU7Z0JBQ3ZCLFVBQVUsRUFBRSxZQUFZO2dCQUN4QixXQUFXLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQztnQkFDbEQsVUFBVSxFQUFFLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRTthQUN4QztZQUNEO2dCQUNJLEVBQUUsRUFBRSxVQUFVO2dCQUNkLElBQUksRUFBRSxVQUFVO2dCQUNoQixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsV0FBVyxFQUFFLFNBQVM7Z0JBQ3RCLFVBQVUsRUFBRSxjQUFjO2dCQUMxQixXQUFXLEVBQUUsRUFBRTtnQkFDZixVQUFVLEVBQUUsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFO2FBQ3ZDO1lBQ0Q7Z0JBQ0ksRUFBRSxFQUFFLFlBQVk7Z0JBQ2hCLElBQUksRUFBRSx1QkFBdUI7Z0JBQzdCLElBQUksRUFBRSxVQUFVO2dCQUNoQixXQUFXLEVBQUUsUUFBUTtnQkFDckIsVUFBVSxFQUFFLDJCQUEyQjtnQkFDdkMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDO2dCQUNwQixVQUFVLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFO2FBQ3JDO1lBQ0Q7Z0JBQ0ksRUFBRSxFQUFFLFNBQVM7Z0JBQ2IsSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLFlBQVk7Z0JBQ3pCLFVBQVUsRUFBRSxhQUFhO2dCQUN6QixXQUFXLEVBQUUsRUFBRTtnQkFDZixVQUFVLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUU7YUFDOUM7WUFDRDtnQkFDSSxFQUFFLEVBQUUsS0FBSztnQkFDVCxJQUFJLEVBQUUsc0JBQXNCO2dCQUM1QixJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsYUFBYTtnQkFDMUIsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLFdBQVcsRUFBRSxFQUFFO2dCQUNmLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7YUFDdEM7U0FDSixDQUFDO1FBRUYsT0FBTyxVQUFVLENBQUM7SUFDdEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssc0JBQXNCLENBQUMsVUFBbUM7UUFDOUQsSUFBSSxPQUFPLEdBQUcsWUFBWSxDQUFDO1FBRTNCLFNBQVM7UUFDVCxLQUFLLE1BQU0sU0FBUyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELE9BQU8sSUFBSSxPQUFPLFNBQVMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3RGLENBQUM7UUFFRCxPQUFPLElBQUksSUFBSSxDQUFDO1FBRWhCLFFBQVE7UUFDUixLQUFLLE1BQU0sU0FBUyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2pDLEtBQUssTUFBTSxVQUFVLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLElBQUksT0FBTyxTQUFTLENBQUMsRUFBRSxRQUFRLFVBQVUsSUFBSSxDQUFDO1lBQ3pELENBQUM7UUFDTCxDQUFDO1FBRUQsVUFBVTtRQUNWLE9BQU8sSUFBSSxJQUFJLENBQUM7UUFDaEIsT0FBTyxJQUFJLHFDQUFxQyxDQUFDO1FBQ2pELE9BQU8sSUFBSSxzQ0FBc0MsQ0FBQztRQUNsRCxPQUFPLElBQUkscUNBQXFDLENBQUM7UUFDakQsT0FBTyxJQUFJLHFDQUFxQyxDQUFDO1FBQ2pELE9BQU8sSUFBSSxzQ0FBc0MsQ0FBQztRQUVsRCxLQUFLLE1BQU0sU0FBUyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2pDLE9BQU8sSUFBSSxhQUFhLFNBQVMsQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxDQUFDO1FBQy9ELENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQ7O09BRUc7SUFDSyxlQUFlLENBQUMsSUFBWTtRQUNoQyxRQUFRLElBQUksRUFBRSxDQUFDO1lBQ1gsS0FBSyxTQUFTLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQztZQUMzQixLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDO1lBQzdCLEtBQUssU0FBUyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUM7WUFDNUIsS0FBSyxTQUFTLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQztZQUM1QixLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDO1lBQzVCLE9BQU8sQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSyw0QkFBNEIsQ0FBQyxVQUFtQztRQUNwRSxJQUFJLFFBQVEsR0FBRyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxjQUFjLENBQUM7UUFDMUQsUUFBUSxJQUFJLGVBQWUsQ0FBQztRQUM1QixRQUFRLElBQUksZ0RBQWdELENBQUM7UUFFN0QsWUFBWTtRQUNaLFFBQVEsSUFBSSxrQkFBa0IsQ0FBQztRQUMvQixRQUFRLElBQUksK0JBQStCLENBQUM7UUFDNUMsUUFBUSxJQUFJLDRDQUE0QyxDQUFDO1FBRXpELEtBQUssTUFBTSxTQUFTLElBQUksVUFBVSxFQUFFLENBQUM7WUFDakMsUUFBUSxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksTUFBTSxTQUFTLENBQUMsSUFBSSxNQUFNLFNBQVMsQ0FBQyxVQUFVLE1BQU0sU0FBUyxDQUFDLFdBQVcsTUFBTSxDQUFDO1FBQ25ILENBQUM7UUFFRCxRQUFRLElBQUksbUJBQW1CLENBQUM7UUFDaEMsUUFBUSxJQUFJLGlCQUFpQixDQUFDO1FBQzlCLFFBQVEsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsUUFBUSxJQUFJLFlBQVksQ0FBQztRQUV6QixPQUFPLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDTyxLQUFLLENBQUMsbUJBQW1CO1FBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNsQyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBRXBELEtBQUssTUFBTSxNQUFNLElBQUksV0FBVyxFQUFFLENBQUM7WUFDL0IsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9ELE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsTUFBTSxDQUFDLFNBQVMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFFRCxjQUFjO1FBQ2QsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUV6RCxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixXQUFXLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMsa0JBQWtCO1FBQzVCLGtDQUFrQztRQUNsQyxPQUFPO1lBQ0g7Z0JBQ0ksU0FBUyxFQUFFLFNBQVM7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsV0FBVyxFQUFFLGFBQWE7Z0JBQzFCLE9BQU8sRUFBRTtvQkFDTCxVQUFVLEVBQUUsRUFBRTtvQkFDZCxXQUFXLEVBQUUsRUFBRTtvQkFDZixXQUFXLEVBQUUsQ0FBQztvQkFDZCxZQUFZLEVBQUUsQ0FBQztvQkFDZixZQUFZLEVBQUUsSUFBSTtpQkFDckI7Z0JBQ0QsWUFBWSxFQUFFO29CQUNWO3dCQUNJLFNBQVMsRUFBRSxXQUFXO3dCQUN0QixPQUFPLEVBQUUsSUFBSTt3QkFDYixLQUFLLEVBQUUsSUFBSTt3QkFDWCxRQUFRLEVBQUUsR0FBRzt3QkFDYixTQUFTLEVBQUUsRUFBRTt3QkFDYixPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFO3FCQUMvQjtvQkFDRDt3QkFDSSxTQUFTLEVBQUUsbUJBQW1CO3dCQUM5QixPQUFPLEVBQUUsS0FBSzt3QkFDZCxLQUFLLEVBQUUsSUFBSTt3QkFDWCxRQUFRLEVBQUUsR0FBRzt3QkFDYixTQUFTLEVBQUUsRUFBRTt3QkFDYixPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxXQUFXLEVBQUUsaUJBQWlCLENBQUMsRUFBRTtxQkFDN0Q7aUJBQ0o7Z0JBQ0QsZUFBZSxFQUFFO29CQUNiLHVCQUF1QjtvQkFDdkIsbUNBQW1DO2lCQUN0QzthQUNKO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRDs7T0FFRztJQUNLLDBCQUEwQixDQUFDLE1BQWtCO1FBQ2pELElBQUksUUFBUSxHQUFHLGVBQWUsTUFBTSxDQUFDLFNBQVMsTUFBTSxDQUFDO1FBQ3JELFFBQVEsSUFBSSxhQUFhLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDdEUsUUFBUSxJQUFJLFdBQVcsTUFBTSxDQUFDLFdBQVcsTUFBTSxDQUFDO1FBRWhELE9BQU87UUFDUCxRQUFRLElBQUksa0JBQWtCLENBQUM7UUFDL0IsUUFBUSxJQUFJLGdCQUFnQixNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsSUFBSSxDQUFDO1FBQzFELFFBQVEsSUFBSSxhQUFhLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUM7UUFDeEQsUUFBUSxJQUFJLGFBQWEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQztRQUN4RCxRQUFRLElBQUksZUFBZSxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksSUFBSSxDQUFDO1FBQzNELFFBQVEsSUFBSSxjQUFjLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBRXhFLFVBQVU7UUFDVixRQUFRLElBQUksZ0JBQWdCLENBQUM7UUFDN0IsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDekMsUUFBUSxJQUFJLE9BQU8sTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLE1BQU0sQ0FBQztZQUNuRCxRQUFRLElBQUksY0FBYyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ3RELFFBQVEsSUFBSSxlQUFlLEtBQUssQ0FBQyxRQUFRLEtBQUssQ0FBQztZQUMvQyxRQUFRLElBQUksZUFBZSxLQUFLLENBQUMsU0FBUyxNQUFNLENBQUM7UUFDckQsQ0FBQztRQUVELE9BQU87UUFDUCxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3BDLFFBQVEsSUFBSSxhQUFhLENBQUM7WUFDMUIsS0FBSyxNQUFNLGNBQWMsSUFBSSxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xELFFBQVEsSUFBSSxLQUFLLGNBQWMsSUFBSSxDQUFDO1lBQ3hDLENBQUM7WUFDRCxRQUFRLElBQUksSUFBSSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxPQUFPLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDSywyQkFBMkIsQ0FBQyxPQUFxQjtRQUNyRCxJQUFJLFFBQVEsR0FBRyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxjQUFjLENBQUM7UUFDMUQsUUFBUSxJQUFJLGdCQUFnQixDQUFDO1FBRTdCLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNyQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMzQyxRQUFRLElBQUksYUFBYSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ3RFLFFBQVEsSUFBSSxZQUFZLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQzFFLENBQUM7UUFFRCxRQUFRLElBQUksY0FBYyxDQUFDO1FBQzNCLFFBQVEsSUFBSSxpQ0FBaUMsQ0FBQztRQUM5QyxRQUFRLElBQUksNENBQTRDLENBQUM7UUFFekQsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUMzQixRQUFRLElBQUksS0FBSyxNQUFNLENBQUMsU0FBUyxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLE1BQU0sTUFBTSxDQUFDLFdBQVcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixNQUFNLENBQUMsU0FBUyxVQUFVLENBQUM7UUFDaE4sQ0FBQztRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7T0FFRztJQUNPLEtBQUssQ0FBQyx5QkFBeUI7UUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRWxDLE1BQU0sTUFBTSxHQUFHO1lBQ1g7Z0JBQ0ksUUFBUSxFQUFFLHFCQUFxQjtnQkFDL0IsS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLE9BQU8sRUFBRSxJQUFJLENBQUMsdUJBQXVCLEVBQUU7YUFDMUM7WUFDRDtnQkFDSSxRQUFRLEVBQUUscUJBQXFCO2dCQUMvQixLQUFLLEVBQUUsT0FBTztnQkFDZCxPQUFPLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFO2FBQzFDO1lBQ0Q7Z0JBQ0ksUUFBUSxFQUFFLDBCQUEwQjtnQkFDcEMsS0FBSyxFQUFFLGdCQUFnQjtnQkFDdkIsT0FBTyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRTthQUMvQztTQUNKLENBQUM7UUFFRixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLE1BQU0sQ0FBQyxNQUFNLE9BQU8sQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7T0FFRztJQUNLLHVCQUF1QjtRQUMzQixPQUFPLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtRDFDLENBQUM7SUFDRSxDQUFDO0lBRUQ7O09BRUc7SUFDSyx1QkFBdUI7UUFDM0IsT0FBTyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFDMUMsQ0FBQztJQUNFLENBQUM7SUFFRDs7T0FFRztJQUNLLDRCQUE0QjtRQUNoQyxPQUFPLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FzRDFDLENBQUM7SUFDRSxDQUFDO0lBRUQ7O09BRUc7SUFDTyxLQUFLLENBQUMsaUJBQWlCO1FBQzdCLE1BQU0sWUFBWSxHQUFHLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXOztTQUVoRCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXFCMUIsSUFBSSxJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO0NBQ25DLENBQUM7UUFFTSxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3BELENBQUM7Q0FDSjtBQTV1REQsd0RBNHVEQztBQUVELGVBQWU7QUFDZixLQUFLLFVBQVUsSUFBSTtJQUNmLE1BQU0sTUFBTSxHQUF3QjtRQUNoQyxXQUFXLEVBQUUsNkJBQTZCO1FBQzFDLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLGVBQWUsRUFBRSxrQkFBa0I7UUFDbkMsZUFBZSxFQUFFLElBQUk7UUFDckIsNEJBQTRCLEVBQUUsSUFBSTtRQUNsQyxtQkFBbUIsRUFBRSxJQUFJO1FBQ3pCLHlCQUF5QixFQUFFLElBQUk7UUFDL0IsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixrQkFBa0IsRUFBRSxLQUFLO1FBQ3pCLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUM7S0FDaEMsQ0FBQztJQUVGLE1BQU0sU0FBUyxHQUFHLElBQUksc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFckQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxTQUFTLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7QUFDTCxDQUFDO0FBRUQsaUNBQWlDO0FBQ2pDLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUMxQixJQUFJLEVBQUUsQ0FBQztBQUNYLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICog44OJ44Kt44Ol44Oh44Oz44OI6Ieq5YuV55Sf5oiQ44K344K544OG44OgXG4gKiBBUEnjg4njgq3jg6Xjg6Hjg7Pjg4jjgIHjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7PjgIHjg4bjgrnjg4jjg6zjg53jg7zjg4jjga7oh6rli5XnlJ/miJBcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG9jdW1lbnRhdGlvbkNvbmZpZyB7XG4gICAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgICB2ZXJzaW9uOiBzdHJpbmc7XG4gICAgb3V0cHV0RGlyZWN0b3J5OiBzdHJpbmc7XG4gICAgZ2VuZXJhdGVBcGlEb2NzOiBib29sZWFuO1xuICAgIGdlbmVyYXRlQXJjaGl0ZWN0dXJlRGlhZ3JhbXM6IGJvb2xlYW47XG4gICAgZ2VuZXJhdGVUZXN0UmVwb3J0czogYm9vbGVhbjtcbiAgICBnZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzOiBib29sZWFuO1xuICAgIGluY2x1ZGVDb2RlRXhhbXBsZXM6IGJvb2xlYW47XG4gICAgaW5jbHVkZVNjcmVlbnNob3RzOiBib29sZWFuO1xuICAgIGZvcm1hdHM6ICgnbWFya2Rvd24nIHwgJ2h0bWwnIHwgJ3BkZicpW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBpRW5kcG9pbnQge1xuICAgIHBhdGg6IHN0cmluZztcbiAgICBtZXRob2Q6ICdHRVQnIHwgJ1BPU1QnIHwgJ1BVVCcgfCAnREVMRVRFJyB8ICdQQVRDSCc7XG4gICAgc3VtbWFyeTogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgcGFyYW1ldGVyczogQXBpUGFyYW1ldGVyW107XG4gICAgcmVxdWVzdEJvZHk/OiBBcGlSZXF1ZXN0Qm9keTtcbiAgICByZXNwb25zZXM6IEFwaVJlc3BvbnNlW107XG4gICAgdGFnczogc3RyaW5nW107XG4gICAgc2VjdXJpdHk/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcGlQYXJhbWV0ZXIge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpbjogJ3F1ZXJ5JyB8ICdwYXRoJyB8ICdoZWFkZXInIHwgJ2Nvb2tpZSc7XG4gICAgcmVxdWlyZWQ6IGJvb2xlYW47XG4gICAgdHlwZTogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgZXhhbXBsZT86IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcGlSZXF1ZXN0Qm9keSB7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBjb250ZW50VHlwZTogc3RyaW5nO1xuICAgIHNjaGVtYTogYW55O1xuICAgIGV4YW1wbGU/OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBpUmVzcG9uc2Uge1xuICAgIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIGNvbnRlbnRUeXBlPzogc3RyaW5nO1xuICAgIHNjaGVtYT86IGFueTtcbiAgICBleGFtcGxlPzogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFyY2hpdGVjdHVyZUNvbXBvbmVudCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdHlwZTogJ3NlcnZpY2UnIHwgJ2RhdGFiYXNlJyB8ICdzdG9yYWdlJyB8ICduZXR3b3JrJyB8ICdzZWN1cml0eScgfCAnbW9uaXRvcmluZyc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICB0ZWNobm9sb2d5OiBzdHJpbmc7XG4gICAgY29ubmVjdGlvbnM6IHN0cmluZ1tdO1xuICAgIHByb3BlcnRpZXM6IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdFJlcG9ydCB7XG4gICAgdGVzdFJ1bklkOiBzdHJpbmc7XG4gICAgdGltZXN0YW1wOiBEYXRlO1xuICAgIGVudmlyb25tZW50OiBzdHJpbmc7XG4gICAgc3VtbWFyeToge1xuICAgICAgICB0b3RhbFRlc3RzOiBudW1iZXI7XG4gICAgICAgIHBhc3NlZFRlc3RzOiBudW1iZXI7XG4gICAgICAgIGZhaWxlZFRlc3RzOiBudW1iZXI7XG4gICAgICAgIHNraXBwZWRUZXN0czogbnVtYmVyO1xuICAgICAgICBvdmVyYWxsU2NvcmU6IG51bWJlcjtcbiAgICB9O1xuICAgIHN1aXRlUmVzdWx0czogVGVzdFN1aXRlUmVwb3J0W107XG4gICAgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXN0U3VpdGVSZXBvcnQge1xuICAgIHN1aXRlTmFtZTogc3RyaW5nO1xuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XG4gICAgc2NvcmU6IG51bWJlcjtcbiAgICBkdXJhdGlvbjogbnVtYmVyO1xuICAgIHRlc3RDb3VudDogbnVtYmVyO1xuICAgIGRldGFpbHM6IGFueTtcbn1cblxuZXhwb3J0IGNsYXNzIERvY3VtZW50YXRpb25HZW5lcmF0b3Ige1xuICAgIHByb3RlY3RlZCBjb25maWc6IERvY3VtZW50YXRpb25Db25maWc7XG4gICAgcHJvdGVjdGVkIHByb2plY3RSb290OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IERvY3VtZW50YXRpb25Db25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucHJvamVjdFJvb3QgPSBwcm9jZXNzLmN3ZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWFqOODieOCreODpeODoeODs+ODiOOBrueUn+aIkFxuICAgICAqL1xuICAgIGFzeW5jIGdlbmVyYXRlQWxsRG9jdW1lbnRhdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ/Cfk5og44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ44KS6ZaL5aeL44GX44G+44GZLi4uJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OLIOODl+ODreOCuOOCp+OCr+ODiDogJHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0gdiR7dGhpcy5jb25maWcudmVyc2lvbn1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4Eg5Ye65Yqb44OH44Kj44Os44Kv44OI44OqOiAke3RoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeX1gKTtcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlh7rlipvjg4fjgqPjg6zjgq/jg4jjg6rjga7kvZzmiJBcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5zdXJlT3V0cHV0RGlyZWN0b3J5KCk7XG5cbiAgICAgICAgICAgIC8vIEFQSeODieOCreODpeODoeODs+ODiOOBrueUn+aIkFxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmdlbmVyYXRlQXBpRG9jcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfwn5SXIEFQSeODieOCreODpeODoeODs+ODiOOCkueUn+aIkOS4rS4uLicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVBcGlEb2N1bWVudGF0aW9uKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOOCouODvOOCreODhuOCr+ODgeODo+Wbs+OBrueUn+aIkFxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmdlbmVyYXRlQXJjaGl0ZWN0dXJlRGlhZ3JhbXMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn8J+Pl++4jyDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7PjgpLnlJ/miJDkuK0uLi4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQXJjaGl0ZWN0dXJlRGlhZ3JhbXMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g44OG44K544OI44Os44Od44O844OI44Gu55Sf5oiQXG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcuZ2VuZXJhdGVUZXN0UmVwb3J0cykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfwn5OKIOODhuOCueODiOODrOODneODvOODiOOCkueUn+aIkOS4rS4uLicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVUZXN0UmVwb3J0cygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDpgYvnlKjjgqzjgqTjg4njga7nlJ/miJBcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5nZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ/Cfk5Yg6YGL55So44Ks44Kk44OJ44KS55Sf5oiQ5LitLi4uJyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOOCpOODs+ODh+ODg+OCr+OCueODmuODvOOCuOOBrueUn+aIkFxuICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUluZGV4UGFnZSgpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygn4pyFIOODieOCreODpeODoeODs+ODiOeUn+aIkOWujOS6hicpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYPCfk4Eg55Sf5oiQ44GV44KM44Gf44OJ44Kt44Ol44Oh44Oz44OIOiAke3RoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeX1gKTtcblxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign4p2MIOODieOCreODpeODoeODs+ODiOeUn+aIkOOCqOODqeODvDonLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWHuuWKm+ODh+OCo+ODrOOCr+ODiOODquOBrueiuuS/nVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZW5zdXJlT3V0cHV0RGlyZWN0b3J5KCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyDjg5Hjgrnjg4jjg6njg5Djg7zjgrXjg6vmlLvmkoPjgpLpmLLjgZDjgZ/jgoHjga7jg5HjgrnmpJzoqLxcbiAgICAgICAgY29uc3Qgb3V0cHV0UGF0aCA9IHRoaXMudmFsaWRhdGVBbmRSZXNvbHZlUGF0aCh0aGlzLmNvbmZpZy5vdXRwdXREaXJlY3RvcnkpO1xuXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXRQYXRoKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKG91dHB1dFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCBtb2RlOiAwbzc1NSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOOCteODluODh+OCo+ODrOOCr+ODiOODquOBruS9nOaIkFxuICAgICAgICBjb25zdCBhbGxvd2VkU3ViZGlycyA9IFsnYXBpJywgJ2FyY2hpdGVjdHVyZScsICd0ZXN0cycsICdvcGVyYXRpb25zJywgJ2Fzc2V0cyddO1xuICAgICAgICBmb3IgKGNvbnN0IHN1YmRpciBvZiBhbGxvd2VkU3ViZGlycykge1xuICAgICAgICAgICAgY29uc3Qgc3ViZGlyUGF0aCA9IHBhdGguam9pbihvdXRwdXRQYXRoLCBzdWJkaXIpO1xuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHN1YmRpclBhdGgpKSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHN1YmRpclBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCBtb2RlOiAwbzc1NSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOODkeOCueOBruaknOiovOOBqOino+axuu+8iOOCu+OCreODpeODquODhuOCo+WvvuetluW8t+WMlueJiO+8iVxuICAgICAqL1xuICAgIHByaXZhdGUgdmFsaWRhdGVBbmRSZXNvbHZlUGF0aChpbnB1dFBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIC8vIOWFpeWKm+WApOOBruWfuuacrOaknOiovFxuICAgICAgICBpZiAoIWlucHV0UGF0aCB8fCB0eXBlb2YgaW5wdXRQYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfnhKHlirnjgarjg5HjgrnjgYzmjIflrprjgZXjgozjgb7jgZfjgZ8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWNsemZuuOBquaWh+Wtl+WIl+ODkeOCv+ODvOODs+OBruaknOiovFxuICAgICAgICBjb25zdCBkYW5nZXJvdXNQYXR0ZXJucyA9IFtcbiAgICAgICAgICAgIC9cXC5cXC4vLCAgICAgICAgICAgLy8g44OR44K544OI44Op44OQ44O844K144OrXG4gICAgICAgICAgICAvfi8sICAgICAgICAgICAgICAvLyDjg5vjg7zjg6Djg4fjgqPjg6zjgq/jg4jjg6rlj4LnhadcbiAgICAgICAgICAgIC9cXDAvLCAgICAgICAgICAgICAvLyDjg4zjg6vmloflrZdcbiAgICAgICAgICAgIC9bPD46XCJ8PypdLywgICAgICAvLyDnhKHlirnjgarjg5XjgqHjgqTjg6vlkI3mloflrZdcbiAgICAgICAgICAgIC9eXFwvKy8sICAgICAgICAgICAvLyDntbblr77jg5HjgrlcbiAgICAgICAgICAgIC9cXFxcKy8gICAgICAgICAgICAgLy8g44OQ44OD44Kv44K544Op44OD44K344OlXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGRhbmdlcm91c1BhdHRlcm5zKSB7XG4gICAgICAgICAgICBpZiAocGF0dGVybi50ZXN0KGlucHV0UGF0aCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOS4jeato+OBquODkeOCueODkeOCv+ODvOODs+OBjOaknOWHuuOBleOCjOOBvuOBl+OBnzogJHtpbnB1dFBhdGh9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDjg5Hjgrnjga7mraPopo/ljJbjgajop6PmsbpcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFBhdGggPSBwYXRoLm5vcm1hbGl6ZShpbnB1dFBhdGgpO1xuICAgICAgICBjb25zdCByZXNvbHZlZFBhdGggPSBwYXRoLnJlc29sdmUodGhpcy5wcm9qZWN0Um9vdCwgbm9ybWFsaXplZFBhdGgpO1xuXG4gICAgICAgIC8vIOODl+ODreOCuOOCp+OCr+ODiOODq+ODvOODiOWkluOBuOOBruOCouOCr+OCu+OCueOCkumYsuOBkFxuICAgICAgICBpZiAoIXJlc29sdmVkUGF0aC5zdGFydHNXaXRoKHRoaXMucHJvamVjdFJvb3QpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOODl+ODreOCuOOCp+OCr+ODiOODh+OCo+ODrOOCr+ODiOODquWkluOBuOOBruOCouOCr+OCu+OCueOBr+emgeatouOBleOCjOOBpuOBhOOBvuOBmTogJHtyZXNvbHZlZFBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDjg5Hjgrnjga7plbfjgZXliLbpmZDvvIjjgrfjgrnjg4bjg6DliLbpmZDjgpLogIPmha7vvIlcbiAgICAgICAgaWYgKHJlc29sdmVkUGF0aC5sZW5ndGggPiAyNjApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign44OR44K544GM6ZW344GZ44GO44G+44GZJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRQYXRoO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOODleOCoeOCpOODq+abuOOBjei+vOOBv++8iOOCu+OCreODpeODquODhuOCo+WvvuetluS7mOOBje+8iVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyB3cml0ZUZpbGUocmVsYXRpdmVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBvdXRwdXRQYXRoID0gdGhpcy52YWxpZGF0ZUFuZFJlc29sdmVQYXRoKHRoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeSk7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKG91dHB1dFBhdGgsIHJlbGF0aXZlUGF0aCk7XG5cbiAgICAgICAgLy8g44OH44Kj44Os44Kv44OI44Oq44OI44Op44OQ44O844K144Or5pS75pKD44KS6Ziy44GQXG4gICAgICAgIGlmICghZmlsZVBhdGguc3RhcnRzV2l0aChvdXRwdXRQYXRoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuI3mraPjgarjg5XjgqHjgqTjg6vjg5HjgrnjgYzmpJzlh7rjgZXjgozjgb7jgZfjgZ8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOODh+OCo+ODrOOCr+ODiOODquOBjOWtmOWcqOOBl+OBquOBhOWgtOWQiOOBr+S9nOaIkFxuICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpO1xuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUsIG1vZGU6IDBvNzU1IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g44OV44Kh44Kk44Or5pu444GN6L6844G/77yI6YGp5YiH44Gq5qip6ZmQ6Kit5a6a77yJXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIGNvbnRlbnQsIHsgbW9kZTogMG82NDQgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQVBJ44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFwaURvY3VtZW50YXRpb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgICDwn5OKIEFQSeOCqOODs+ODieODneOCpOODs+ODiOOCkuWPjumbhuS4rS4uLicpO1xuICAgICAgICBjb25zdCBhcGlFbmRwb2ludHMgPSBhd2FpdCB0aGlzLmNvbGxlY3RBcGlFbmRwb2ludHMoKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgICAg8J+TnSAke2FwaUVuZHBvaW50cy5sZW5ndGh95YCL44Gu44Ko44Oz44OJ44Od44Kk44Oz44OI44KS5Yem55CG5LitLi4uYCk7XG5cbiAgICAgICAgLy8g5Lim5YiX5Yem55CG44Gn44OJ44Kt44Ol44Oh44Oz44OI55Sf5oiQ44KS6auY6YCf5YyWXG4gICAgICAgIGNvbnN0IHRhc2tzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcblxuICAgICAgICAvLyBPcGVuQVBJ5LuV5qeY44Gu55Sf5oiQXG4gICAgICAgIHRhc2tzLnB1c2goXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlQW5kV3JpdGVPcGVuQXBpU3BlYyhhcGlFbmRwb2ludHMpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gTWFya2Rvd27jg4njgq3jg6Xjg6Hjg7Pjg4jjga7nlJ/miJBcbiAgICAgICAgdGFza3MucHVzaChcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVBbmRXcml0ZUFwaU1hcmtkb3duKGFwaUVuZHBvaW50cylcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBIVE1M44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQ77yI5b+F6KaB44Gq5aC05ZCI44Gu44G/77yJXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5mb3JtYXRzLmluY2x1ZGVzKCdodG1sJykpIHtcbiAgICAgICAgICAgIHRhc2tzLnB1c2goXG4gICAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUFuZFdyaXRlQXBpSHRtbChhcGlFbmRwb2ludHMpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YWo44Gm44Gu55Sf5oiQ44K/44K544Kv44KS5Lim5YiX5a6f6KGMXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgICAg4pyFIEFQSeODieOCreODpeODoeODs+ODiOeUn+aIkOWujOS6hiAoJHthcGlFbmRwb2ludHMubGVuZ3RofeOCqOODs+ODieODneOCpOODs+ODiClgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPcGVuQVBJ5LuV5qeY44Gu55Sf5oiQ44Go5pu444GN6L6844G/XG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFuZFdyaXRlT3BlbkFwaVNwZWMoYXBpRW5kcG9pbnRzOiBBcGlFbmRwb2ludFtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IG9wZW5BcGlTcGVjID0gdGhpcy5nZW5lcmF0ZU9wZW5BcGlTcGVjKGFwaUVuZHBvaW50cyk7XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKCdhcGkvb3BlbmFwaS5qc29uJywgSlNPTi5zdHJpbmdpZnkob3BlbkFwaVNwZWMsIG51bGwsIDIpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBUEnjg57jg7zjgq/jg4Djgqbjg7Pjga7nlJ/miJDjgajmm7jjgY3ovrzjgb9cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQW5kV3JpdGVBcGlNYXJrZG93bihhcGlFbmRwb2ludHM6IEFwaUVuZHBvaW50W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgYXBpTWFya2Rvd24gPSB0aGlzLmdlbmVyYXRlQXBpTWFya2Rvd24oYXBpRW5kcG9pbnRzKTtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ2FwaS9SRUFETUUubWQnLCBhcGlNYXJrZG93bik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQVBJIEhUTUzjga7nlJ/miJDjgajmm7jjgY3ovrzjgb9cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQW5kV3JpdGVBcGlIdG1sKGFwaUVuZHBvaW50czogQXBpRW5kcG9pbnRbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBhcGlIdG1sID0gdGhpcy5nZW5lcmF0ZUFwaUh0bWwoYXBpRW5kcG9pbnRzKTtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ2FwaS9pbmRleC5odG1sJywgYXBpSHRtbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQVBJIOOCqOODs+ODieODneOCpOODs+ODiOOBruWPjumbhlxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY29sbGVjdEFwaUVuZHBvaW50cygpOiBQcm9taXNlPEFwaUVuZHBvaW50W10+IHtcbiAgICAgICAgLy8g5a6f6Zqb44Gu44Kz44O844OJ44OZ44O844K544GL44KJQVBJ44Ko44Oz44OJ44Od44Kk44Oz44OI44KS6Ieq5YuV5qSc5Ye6XG4gICAgICAgIGNvbnN0IGVuZHBvaW50czogQXBpRW5kcG9pbnRbXSA9IFtdO1xuXG4gICAgICAgIC8vIExhbWJkYemWouaVsOODh+OCo+ODrOOCr+ODiOODquOCkuOCueOCreODo+ODs1xuICAgICAgICBjb25zdCBsYW1iZGFEaXIgPSBwYXRoLmpvaW4odGhpcy5wcm9qZWN0Um9vdCwgJ2xhbWJkYScpO1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhsYW1iZGFEaXIpKSB7XG4gICAgICAgICAgICBjb25zdCBsYW1iZGFGdW5jdGlvbnMgPSBmcy5yZWFkZGlyU3luYyhsYW1iZGFEaXIpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBmdW5jIG9mIGxhbWJkYUZ1bmN0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmNFbmRwb2ludHMgPSBhd2FpdCB0aGlzLnNjYW5MYW1iZGFGdW5jdGlvbihwYXRoLmpvaW4obGFtYmRhRGlyLCBmdW5jKSk7XG4gICAgICAgICAgICAgICAgZW5kcG9pbnRzLnB1c2goLi4uZnVuY0VuZHBvaW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDjgrXjg7Pjg5fjg6vjgqjjg7Pjg4njg53jgqTjg7Pjg4jjgoLlkKvjgoHjgovvvIjplovnmbrnlKjvvIlcbiAgICAgICAgZW5kcG9pbnRzLnB1c2goLi4udGhpcy5nZXRTYW1wbGVFbmRwb2ludHMoKSk7XG5cbiAgICAgICAgcmV0dXJuIGVuZHBvaW50cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMYW1iZGHplqLmlbDjgYvjgolBUEnjgqjjg7Pjg4njg53jgqTjg7Pjg4jjgpLmir3lh7pcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHNjYW5MYW1iZGFGdW5jdGlvbihmdW5jdGlvblBhdGg6IHN0cmluZyk6IFByb21pc2U8QXBpRW5kcG9pbnRbXT4ge1xuICAgICAgICBjb25zdCBlbmRwb2ludHM6IEFwaUVuZHBvaW50W10gPSBbXTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXhGaWxlID0gcGF0aC5qb2luKGZ1bmN0aW9uUGF0aCwgJ2luZGV4LmpzJyk7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhpbmRleEZpbGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhpbmRleEZpbGUsICd1dGYtOCcpO1xuICAgICAgICAgICAgICAgIC8vIOewoeWNmOOBquODkeOCv+ODvOODs+ODnuODg+ODgeODs+OCsOOBp+OCqOODs+ODieODneOCpOODs+ODiOOCkuaknOWHulxuICAgICAgICAgICAgICAgIC8vIOWun+mam+OBruWun+ijheOBp+OBr+OAgUFTVOODkeODvOOCteODvOOCkuS9v+eUqOOBmeOCi+OBk+OBqOOCkuaOqOWlqFxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhNYXRjaGVzID0gY29udGVudC5tYXRjaCgvXFwvYXBpXFwvW15cXHMnXCJdKy9nKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aE1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aE1hdGNoZXMuZm9yRWFjaChwYXRoTWF0Y2ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnRzLnB1c2godGhpcy5jcmVhdGVFbmRwb2ludEZyb21QYXRoKHBhdGhNYXRjaCwgZnVuY3Rpb25QYXRoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgTGFtYmRh6Zai5pWw44Gu6Kej5p6Q44Gr5aSx5pWXOiAke2Z1bmN0aW9uUGF0aH1gLCBlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZW5kcG9pbnRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOODkeOCueOBi+OCieOCqOODs+ODieODneOCpOODs+ODiOaDheWgseOCkueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlRW5kcG9pbnRGcm9tUGF0aChhcGlQYXRoOiBzdHJpbmcsIGZ1bmN0aW9uUGF0aDogc3RyaW5nKTogQXBpRW5kcG9pbnQge1xuICAgICAgICBjb25zdCBmdW5jdGlvbk5hbWUgPSBwYXRoLmJhc2VuYW1lKGZ1bmN0aW9uUGF0aCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhdGg6IGFwaVBhdGgsXG4gICAgICAgICAgICBtZXRob2Q6IHRoaXMuaW5mZXJNZXRob2RGcm9tRnVuY3Rpb24oZnVuY3Rpb25OYW1lKSxcbiAgICAgICAgICAgIHN1bW1hcnk6IGAke2Z1bmN0aW9uTmFtZX3jgqjjg7Pjg4njg53jgqTjg7Pjg4hgLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGAke2Z1bmN0aW9uTmFtZX3mqZ/og73jga5BUEnjgqjjg7Pjg4njg53jgqTjg7Pjg4hgLFxuICAgICAgICAgICAgcGFyYW1ldGVyczogW10sXG4gICAgICAgICAgICByZXNwb25zZXM6IFt7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5oiQ5YqfJyxcbiAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIHRhZ3M6IFt0aGlzLmluZmVyVGFnRnJvbVBhdGgoYXBpUGF0aCldLFxuICAgICAgICAgICAgc2VjdXJpdHk6IFsnQmVhcmVyQXV0aCddXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6Zai5pWw5ZCN44GL44KJSFRUUOODoeOCveODg+ODieOCkuaOqOa4rFxuICAgICAqL1xuICAgIHByaXZhdGUgaW5mZXJNZXRob2RGcm9tRnVuY3Rpb24oZnVuY3Rpb25OYW1lOiBzdHJpbmcpOiAnR0VUJyB8ICdQT1NUJyB8ICdQVVQnIHwgJ0RFTEVURScgfCAnUEFUQ0gnIHtcbiAgICAgICAgaWYgKGZ1bmN0aW9uTmFtZS5pbmNsdWRlcygnZ2V0JykgfHwgZnVuY3Rpb25OYW1lLmluY2x1ZGVzKCdsaXN0JykpIHJldHVybiAnR0VUJztcbiAgICAgICAgaWYgKGZ1bmN0aW9uTmFtZS5pbmNsdWRlcygnY3JlYXRlJykgfHwgZnVuY3Rpb25OYW1lLmluY2x1ZGVzKCd1cGxvYWQnKSkgcmV0dXJuICdQT1NUJztcbiAgICAgICAgaWYgKGZ1bmN0aW9uTmFtZS5pbmNsdWRlcygndXBkYXRlJykpIHJldHVybiAnUFVUJztcbiAgICAgICAgaWYgKGZ1bmN0aW9uTmFtZS5pbmNsdWRlcygnZGVsZXRlJykpIHJldHVybiAnREVMRVRFJztcbiAgICAgICAgcmV0dXJuICdQT1NUJzsgLy8g44OH44OV44Kp44Or44OIXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44OR44K544GL44KJ44K/44Kw44KS5o6o5risXG4gICAgICovXG4gICAgcHJpdmF0ZSBpbmZlclRhZ0Zyb21QYXRoKGFwaVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmIChhcGlQYXRoLmluY2x1ZGVzKCcvYXV0aCcpKSByZXR1cm4gJ+iqjeiovCc7XG4gICAgICAgIGlmIChhcGlQYXRoLmluY2x1ZGVzKCcvY2hhdCcpKSByZXR1cm4gJ+ODgeODo+ODg+ODiCc7XG4gICAgICAgIGlmIChhcGlQYXRoLmluY2x1ZGVzKCcvZG9jdW1lbnQnKSkgcmV0dXJuICfjg4njgq3jg6Xjg6Hjg7Pjg4gnO1xuICAgICAgICBpZiAoYXBpUGF0aC5pbmNsdWRlcygnL3VzZXInKSkgcmV0dXJuICfjg6bjg7zjgrbjg7wnO1xuICAgICAgICByZXR1cm4gJ+OBneOBruS7lic7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44K144Oz44OX44Or44Ko44Oz44OJ44Od44Kk44Oz44OI44Gu5Y+W5b6XXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXRTYW1wbGVFbmRwb2ludHMoKTogQXBpRW5kcG9pbnRbXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGF0aDogJy9hcGkvYXV0aC9sb2dpbicsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgc3VtbWFyeTogJ+ODpuODvOOCtuODvOODreOCsOOCpOODsycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjg6bjg7zjgrbjg7zoqo3oqLzjgpLooYzjgYTjgIHjgqLjgq/jgrvjgrnjg4jjg7zjgq/jg7PjgpLlj5blvpfjgZfjgb7jgZknLFxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IFtdLFxuICAgICAgICAgICAgICAgIHJlcXVlc3RCb2R5OiB7XG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn44Ot44Kw44Kk44Oz5oOF5aCxJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICfjg6bjg7zjgrbjg7zlkI0nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAn44OR44K544Ov44O844OJJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXNlcm5hbWUnLCAncGFzc3dvcmQnXVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBleGFtcGxlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogJ3Rlc3R1c2VyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiAncGFzc3dvcmQxMjMnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+ODreOCsOOCpOODs+aIkOWKnycsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICfjgqLjgq/jgrvjgrnjg4jjg7zjgq/jg7MnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGlyZXNJbjogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICfmnInlirnmnJ/pmZDvvIjnp5LvvIknIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhhbXBsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuOiAnZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5Li4uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBpcmVzSW46IDM2MDBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjg63jgrDjgqTjg7PlpLHmlZcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAn44Ko44Op44O844Oh44OD44K744O844K4JyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4YW1wbGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ0ludmFsaWQgY3JlZGVudGlhbHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHRhZ3M6IFsn6KqN6Ki8J10sXG4gICAgICAgICAgICAgICAgc2VjdXJpdHk6IFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhdGg6ICcvYXBpL2NoYXQnLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHN1bW1hcnk6ICfjg4Hjg6Pjg4Pjg4jpgIHkv6EnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn44Om44O844K244O844Gu44Oh44OD44K744O844K444KS6YCB5L+h44GX44CBQUnlv5znrZTjgpLlj5blvpfjgZfjgb7jgZknLFxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IFtdLFxuICAgICAgICAgICAgICAgIHJlcXVlc3RCb2R5OiB7XG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn44OB44Oj44OD44OI44Oh44OD44K744O844K4JyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ+ODpuODvOOCtuODvOODoeODg+OCu+ODvOOCuCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uSWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAn44K744OD44K344On44OzSUQnIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydtZXNzYWdlJ11cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZXhhbXBsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZTeCBmb3IgTmV0QXBwIE9OVEFQ44Gr44Gk44GE44Gm5pWZ44GI44Gm44GP44Gg44GV44GEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb25JZDogJ3Nlc3Npb24tMTIzJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXNwb25zZXM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjg4Hjg6Pjg4Pjg4jlv5znrZQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQUnlv5znrZQnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZXM6IHsgdHlwZTogJ2FycmF5JywgZGVzY3JpcHRpb246ICflj4Lnhafjgr3jg7zjgrknIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb25JZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICfjgrvjg4Pjgrfjg6fjg7NJRCcgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGFtcGxlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6ICdGU3ggZm9yIE5ldEFwcCBPTlRBUOOBr+OAgU5ldEFwcOOBrk9OVEFQ44OV44Kh44Kk44Or44K344K544OG44Og44KS44OZ44O844K544Go44GX44GfLi4uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VzOiBbJ2RvY3VtZW50MS5wZGYnLCAnZG9jdW1lbnQyLnBkZiddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb25JZDogJ3Nlc3Npb24tMTIzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB0YWdzOiBbJ+ODgeODo+ODg+ODiCddLFxuICAgICAgICAgICAgICAgIHNlY3VyaXR5OiBbJ0JlYXJlckF1dGgnXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXRoOiAnL2FwaS9kb2N1bWVudHMnLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgc3VtbWFyeTogJ+ODieOCreODpeODoeODs+ODiOS4gOimp+WPluW+lycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjgqLjg4Pjg5fjg63jg7zjg4njgZXjgozjgZ/jg4njgq3jg6Xjg6Hjg7Pjg4jjga7kuIDopqfjgpLlj5blvpfjgZfjgb7jgZknLFxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3BhZ2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW46ICdxdWVyeScsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+ODmuODvOOCuOeVquWPtycsXG4gICAgICAgICAgICAgICAgICAgICAgICBleGFtcGxlOiAxXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdsaW1pdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbjogJ3F1ZXJ5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbnRlZ2VyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnMeODmuODvOOCuOOBguOBn+OCiuOBruS7tuaVsCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBleGFtcGxlOiAyMFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZXNwb25zZXM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjg4njgq3jg6Xjg6Hjg7Pjg4jkuIDopqcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnRzOiB7IHR5cGU6ICdhcnJheScsIGRlc2NyaXB0aW9uOiAn44OJ44Kt44Ol44Oh44Oz44OI6YWN5YiXJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICfnt4/ku7bmlbAnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2U6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAn54++5Zyo44Gu44Oa44O844K4JyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB0YWdzOiBbJ+ODieOCreODpeODoeODs+ODiCddLFxuICAgICAgICAgICAgICAgIHNlY3VyaXR5OiBbJ0JlYXJlckF1dGgnXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXRoOiAnL2FwaS9kb2N1bWVudHMnLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHN1bW1hcnk6ICfjg4njgq3jg6Xjg6Hjg7Pjg4jjgqLjg4Pjg5fjg63jg7zjg4knLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5paw44GX44GE44OJ44Kt44Ol44Oh44Oz44OI44KS44Ki44OD44OX44Ot44O844OJ44GX44G+44GZJyxcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiBbXSxcbiAgICAgICAgICAgICAgICByZXF1ZXN0Qm9keToge1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+OCouODg+ODl+ODreODvOODieODleOCoeOCpOODqycsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogeyB0eXBlOiAnc3RyaW5nJywgZm9ybWF0OiAnYmluYXJ5JywgZGVzY3JpcHRpb246ICfjgqLjg4Pjg5fjg63jg7zjg4njg5XjgqHjgqTjg6snIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAn44OJ44Kt44Ol44Oh44Oz44OI44K/44Kk44OI44OrJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ+ODieOCreODpeODoeODs+ODiOiqrOaYjicgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2ZpbGUnXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXNwb25zZXM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjgqLjg4Pjg5fjg63jg7zjg4nmiJDlip8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAn44OJ44Kt44Ol44Oh44Oz44OISUQnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ+ODleOCoeOCpOODq+WQjScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ+WHpueQhueKtuazgScgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgdGFnczogWyfjg4njgq3jg6Xjg6Hjg7Pjg4gnXSxcbiAgICAgICAgICAgICAgICBzZWN1cml0eTogWydCZWFyZXJBdXRoJ11cbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPcGVuQVBJ5LuV5qeY44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZU9wZW5BcGlTcGVjKGVuZHBvaW50czogQXBpRW5kcG9pbnRbXSk6IGFueSB7XG4gICAgICAgIGNvbnN0IHNwZWMgPSB7XG4gICAgICAgICAgICBvcGVuYXBpOiAnMy4wLjMnLFxuICAgICAgICAgICAgaW5mbzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBgJHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0gQVBJYCxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB0aGlzLmNvbmZpZy52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtIEFQSSBEb2N1bWVudGF0aW9uJyxcbiAgICAgICAgICAgICAgICBjb250YWN0OiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdOZXRBcHAgSmFwYW4gVGVjaG5vbG9neSBUZWFtJyxcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6ICdzdXBwb3J0QGV4YW1wbGUuY29tJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXJ2ZXJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL2FwaS5leGFtcGxlLmNvbScsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5pys55Wq55Kw5aKDJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICdodHRwczovL3N0YWdpbmctYXBpLmV4YW1wbGUuY29tJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjgrnjg4bjg7zjgrjjg7PjgrDnkrDlooMnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgICAgICAgICBzZWN1cml0eVNjaGVtZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgQmVhcmVyQXV0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0dHAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1lOiAnYmVhcmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlYXJlckZvcm1hdDogJ0pXVCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXRoczoge31cbiAgICAgICAgfTtcblxuICAgICAgICAvLyDjgqjjg7Pjg4njg53jgqTjg7Pjg4jjga7ov73liqBcbiAgICAgICAgZW5kcG9pbnRzLmZvckVhY2goZW5kcG9pbnQgPT4ge1xuICAgICAgICAgICAgaWYgKCFzcGVjLnBhdGhzW2VuZHBvaW50LnBhdGhdKSB7XG4gICAgICAgICAgICAgICAgc3BlYy5wYXRoc1tlbmRwb2ludC5wYXRoXSA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzcGVjLnBhdGhzW2VuZHBvaW50LnBhdGhdW2VuZHBvaW50Lm1ldGhvZC50b0xvd2VyQ2FzZSgpXSA9IHtcbiAgICAgICAgICAgICAgICBzdW1tYXJ5OiBlbmRwb2ludC5zdW1tYXJ5LFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBlbmRwb2ludC5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICB0YWdzOiBlbmRwb2ludC50YWdzLFxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IGVuZHBvaW50LnBhcmFtZXRlcnMubWFwKHBhcmFtID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHBhcmFtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGluOiBwYXJhbS5pbixcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHBhcmFtLnJlcXVpcmVkLFxuICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IHsgdHlwZTogcGFyYW0udHlwZSB9LFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogcGFyYW0uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgIGV4YW1wbGU6IHBhcmFtLmV4YW1wbGVcbiAgICAgICAgICAgICAgICB9KSksXG4gICAgICAgICAgICAgICAgcmVxdWVzdEJvZHk6IGVuZHBvaW50LnJlcXVlc3RCb2R5ID8ge1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZW5kcG9pbnQucmVxdWVzdEJvZHkuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFtlbmRwb2ludC5yZXF1ZXN0Qm9keS5jb250ZW50VHlwZV06IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IGVuZHBvaW50LnJlcXVlc3RCb2R5LnNjaGVtYSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGFtcGxlOiBlbmRwb2ludC5yZXF1ZXN0Qm9keS5leGFtcGxlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlczogZW5kcG9pbnQucmVzcG9uc2VzLnJlZHVjZSgoYWNjLCByZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhY2NbcmVzcG9uc2Uuc3RhdHVzQ29kZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogcmVzcG9uc2UuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNwb25zZS5jb250ZW50VHlwZSA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbcmVzcG9uc2UuY29udGVudFR5cGVdOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYTogcmVzcG9uc2Uuc2NoZW1hLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGFtcGxlOiByZXNwb25zZS5leGFtcGxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sIHt9IGFzIGFueSksXG4gICAgICAgICAgICAgICAgc2VjdXJpdHk6IGVuZHBvaW50LnNlY3VyaXR5ID8gZW5kcG9pbnQuc2VjdXJpdHkubWFwKHNlYyA9PiAoeyBbc2VjXTogW10gfSkpIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc3BlYztcbiAgICB9XG4gICAgLyoqXG4gICAgICAqIEFQSSBNYXJrZG93buODieOCreODpeODoeODs+ODiOOBrueUn+aIkFxuICAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlQXBpTWFya2Rvd24oZW5kcG9pbnRzOiBBcGlFbmRwb2ludFtdKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IG1hcmtkb3duID0gYCMgJHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0gQVBJIOODieOCreODpeODoeODs+ODiFxcblxcbmA7XG4gICAgICAgIG1hcmtkb3duICs9IGDjg5Djg7zjgrjjg6fjg7M6ICR7dGhpcy5jb25maWcudmVyc2lvbn1cXG5gO1xuICAgICAgICBtYXJrZG93biArPSBg55Sf5oiQ5pel5pmCOiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoJ2phLUpQJyl9XFxuXFxuYDtcblxuICAgICAgICAvLyDnm67mrKHjga7nlJ/miJBcbiAgICAgICAgbWFya2Rvd24gKz0gJyMjIOebruasoVxcblxcbic7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBbLi4ubmV3IFNldChlbmRwb2ludHMuZmxhdE1hcChlID0+IGUudGFncykpXTtcbiAgICAgICAgdGFncy5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICBtYXJrZG93biArPSBgLSBbJHt0YWd9XSgjJHt0YWcudG9Mb3dlckNhc2UoKX0pXFxuYDtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hcmtkb3duICs9ICdcXG4nO1xuXG4gICAgICAgIC8vIOiqjeiovOaDheWgsVxuICAgICAgICBtYXJrZG93biArPSAnIyMg6KqN6Ki8XFxuXFxuJztcbiAgICAgICAgbWFya2Rvd24gKz0gJ+OBk+OBrkFQSeOBryBCZWFyZXIgVG9rZW4g6KqN6Ki844KS5L2/55So44GX44G+44GZ44CCXFxuXFxuJztcbiAgICAgICAgbWFya2Rvd24gKz0gJ2BgYFxcbkF1dGhvcml6YXRpb246IEJlYXJlciA8eW91ci10b2tlbj5cXG5gYGBcXG5cXG4nO1xuXG4gICAgICAgIC8vIOOCqOODs+ODieODneOCpOODs+ODiOOCkuOCv+OCsOWIpeOBq+OCsOODq+ODvOODl+WMllxuICAgICAgICB0YWdzLmZvckVhY2godGFnID0+IHtcbiAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyAke3RhZ31cXG5cXG5gO1xuXG4gICAgICAgICAgICBjb25zdCB0YWdFbmRwb2ludHMgPSBlbmRwb2ludHMuZmlsdGVyKGUgPT4gZS50YWdzLmluY2x1ZGVzKHRhZykpO1xuICAgICAgICAgICAgdGFnRW5kcG9pbnRzLmZvckVhY2goZW5kcG9pbnQgPT4ge1xuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyMgJHtlbmRwb2ludC5tZXRob2R9ICR7ZW5kcG9pbnQucGF0aH1cXG5cXG5gO1xuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAke2VuZHBvaW50LmRlc2NyaXB0aW9ufVxcblxcbmA7XG5cbiAgICAgICAgICAgICAgICAvLyDjg5Hjg6njg6Hjg7zjgr9cbiAgICAgICAgICAgICAgICBpZiAoZW5kcG9pbnQucGFyYW1ldGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICcjIyMjIOODkeODqeODoeODvOOCv1xcblxcbic7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICd8IOWQjeWJjSB8IOWgtOaJgCB8IOW/hemgiCB8IOWeiyB8IOiqrOaYjiB8XFxuJztcbiAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJ3wtLS0tLS18LS0tLS0tfC0tLS0tLXwtLS0tfC0tLS0tLS0tLXxcXG4nO1xuICAgICAgICAgICAgICAgICAgICBlbmRwb2ludC5wYXJhbWV0ZXJzLmZvckVhY2gocGFyYW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYHwgJHtwYXJhbS5uYW1lfSB8ICR7cGFyYW0uaW59IHwgJHtwYXJhbS5yZXF1aXJlZCA/ICfinJMnIDogJyd9IHwgJHtwYXJhbS50eXBlfSB8ICR7cGFyYW0uZGVzY3JpcHRpb259IHxcXG5gO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g44Oq44Kv44Ko44K544OI44Oc44OH44KjXG4gICAgICAgICAgICAgICAgaWYgKGVuZHBvaW50LnJlcXVlc3RCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICcjIyMjIOODquOCr+OCqOOCueODiOODnOODh+OCo1xcblxcbic7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAqKkNvbnRlbnQtVHlwZToqKiAke2VuZHBvaW50LnJlcXVlc3RCb2R5LmNvbnRlbnRUeXBlfVxcblxcbmA7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAke2VuZHBvaW50LnJlcXVlc3RCb2R5LmRlc2NyaXB0aW9ufVxcblxcbmA7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuZHBvaW50LnJlcXVlc3RCb2R5LmV4YW1wbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICcqKuS+izoqKlxcblxcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZG93biArPSAnYGBganNvblxcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZG93biArPSBKU09OLnN0cmluZ2lmeShlbmRwb2ludC5yZXF1ZXN0Qm9keS5leGFtcGxlLCBudWxsLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICdcXG5gYGBcXG5cXG4nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g44Os44K544Od44Oz44K5XG4gICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJyMjIyMg44Os44K544Od44Oz44K5XFxuXFxuJztcbiAgICAgICAgICAgICAgICBlbmRwb2ludC5yZXNwb25zZXMuZm9yRWFjaChyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAqKiR7cmVzcG9uc2Uuc3RhdHVzQ29kZX0qKiAtICR7cmVzcG9uc2UuZGVzY3JpcHRpb259XFxuXFxuYDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZXhhbXBsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJ2BgYGpzb25cXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuZXhhbXBsZSwgbnVsbCwgMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZG93biArPSAnXFxuYGBgXFxuXFxuJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gJy0tLVxcblxcbic7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG1hcmtkb3duO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFQSSBIVE1M44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUFwaUh0bWwoZW5kcG9pbnRzOiBBcGlFbmRwb2ludFtdKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBcbjwhRE9DVFlQRSBodG1sPlxuPGh0bWwgbGFuZz1cImphXCI+XG48aGVhZD5cbiAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cbiAgICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFwiPlxuICAgIDx0aXRsZT4ke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfSBBUEkg44OJ44Kt44Ol44Oh44Oz44OIPC90aXRsZT5cbiAgICA8c3R5bGU+XG4gICAgICAgIGJvZHkgeyBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2Vnb2UgVUknLCBSb2JvdG8sIHNhbnMtc2VyaWY7IG1hcmdpbjogMDsgcGFkZGluZzogMjBweDsgfVxuICAgICAgICAuY29udGFpbmVyIHsgbWF4LXdpZHRoOiAxMjAwcHg7IG1hcmdpbjogMCBhdXRvOyB9XG4gICAgICAgIC5oZWFkZXIgeyBiYWNrZ3JvdW5kOiAjZjhmOWZhOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiA4cHg7IG1hcmdpbi1ib3R0b206IDMwcHg7IH1cbiAgICAgICAgLmVuZHBvaW50IHsgYmFja2dyb3VuZDogd2hpdGU7IGJvcmRlcjogMXB4IHNvbGlkICNlOWVjZWY7IGJvcmRlci1yYWRpdXM6IDhweDsgbWFyZ2luLWJvdHRvbTogMjBweDsgb3ZlcmZsb3c6IGhpZGRlbjsgfVxuICAgICAgICAuZW5kcG9pbnQtaGVhZGVyIHsgYmFja2dyb3VuZDogIzAwN2JmZjsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxNXB4OyB9XG4gICAgICAgIC5lbmRwb2ludC1ib2R5IHsgcGFkZGluZzogMjBweDsgfVxuICAgICAgICAubWV0aG9kIHsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBwYWRkaW5nOiA0cHggOHB4OyBib3JkZXItcmFkaXVzOiA0cHg7IGZvbnQtd2VpZ2h0OiBib2xkOyBtYXJnaW4tcmlnaHQ6IDEwcHg7IH1cbiAgICAgICAgLm1ldGhvZC5HRVQgeyBiYWNrZ3JvdW5kOiAjMjhhNzQ1OyB9XG4gICAgICAgIC5tZXRob2QuUE9TVCB7IGJhY2tncm91bmQ6ICMwMDdiZmY7IH1cbiAgICAgICAgLm1ldGhvZC5QVVQgeyBiYWNrZ3JvdW5kOiAjZmZjMTA3OyBjb2xvcjogIzIxMjUyOTsgfVxuICAgICAgICAubWV0aG9kLkRFTEVURSB7IGJhY2tncm91bmQ6ICNkYzM1NDU7IH1cbiAgICAgICAgLnBhcmFtcy10YWJsZSB7IHdpZHRoOiAxMDAlOyBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlOyBtYXJnaW46IDE1cHggMDsgfVxuICAgICAgICAucGFyYW1zLXRhYmxlIHRoLCAucGFyYW1zLXRhYmxlIHRkIHsgYm9yZGVyOiAxcHggc29saWQgI2RlZTJlNjsgcGFkZGluZzogOHB4IDEycHg7IHRleHQtYWxpZ246IGxlZnQ7IH1cbiAgICAgICAgLnBhcmFtcy10YWJsZSB0aCB7IGJhY2tncm91bmQ6ICNmOGY5ZmE7IH1cbiAgICAgICAgLmNvZGUtYmxvY2sgeyBiYWNrZ3JvdW5kOiAjZjhmOWZhOyBib3JkZXI6IDFweCBzb2xpZCAjZTllY2VmOyBib3JkZXItcmFkaXVzOiA0cHg7IHBhZGRpbmc6IDE1cHg7IG1hcmdpbjogMTBweCAwOyBvdmVyZmxvdy14OiBhdXRvOyB9XG4gICAgICAgIC5uYXYgeyBiYWNrZ3JvdW5kOiAjMzQzYTQwOyBjb2xvcjogd2hpdGU7IHBhZGRpbmc6IDE1cHg7IGJvcmRlci1yYWRpdXM6IDhweDsgbWFyZ2luLWJvdHRvbTogMjBweDsgfVxuICAgICAgICAubmF2IGEgeyBjb2xvcjogI2ZmZjsgdGV4dC1kZWNvcmF0aW9uOiBub25lOyBtYXJnaW4tcmlnaHQ6IDIwcHg7IH1cbiAgICAgICAgLm5hdiBhOmhvdmVyIHsgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7IH1cbiAgICA8L3N0eWxlPlxuPC9oZWFkPlxuPGJvZHk+XG4gICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgICAgICA8aDE+JHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0gQVBJIOODieOCreODpeODoeODs+ODiDwvaDE+XG4gICAgICAgICAgICA8cD7jg5Djg7zjgrjjg6fjg7M6ICR7dGhpcy5jb25maWcudmVyc2lvbn0gfCDnlJ/miJDml6XmmYI6ICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygnamEtSlAnKX08L3A+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3M9XCJuYXZcIj5cbiAgICAgICAgICAgIDxzdHJvbmc+44OK44OT44Ky44O844K344On44OzOjwvc3Ryb25nPlxuICAgICAgICAgICAgJHtbLi4ubmV3IFNldChlbmRwb2ludHMuZmxhdE1hcChlID0+IGUudGFncykpXS5tYXAodGFnID0+XG4gICAgICAgICAgICBgPGEgaHJlZj1cIiMke3RhZy50b0xvd2VyQ2FzZSgpfVwiPiR7dGFnfTwvYT5gXG4gICAgICAgICkuam9pbignJyl9XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3M9XCJhdXRoLXNlY3Rpb25cIj5cbiAgICAgICAgICAgIDxoMj7oqo3oqLw8L2gyPlxuICAgICAgICAgICAgPHA+44GT44GuQVBJ44GvIEJlYXJlciBUb2tlbiDoqo3oqLzjgpLkvb/nlKjjgZfjgb7jgZnjgII8L3A+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29kZS1ibG9ja1wiPkF1dGhvcml6YXRpb246IEJlYXJlciAmbHQ7eW91ci10b2tlbiZndDs8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgJHtbLi4ubmV3IFNldChlbmRwb2ludHMuZmxhdE1hcChlID0+IGUudGFncykpXS5tYXAodGFnID0+IGBcbiAgICAgICAgICAgIDxoMiBpZD1cIiR7dGFnLnRvTG93ZXJDYXNlKCl9XCI+JHt0YWd9PC9oMj5cbiAgICAgICAgICAgICR7ZW5kcG9pbnRzLmZpbHRlcihlID0+IGUudGFncy5pbmNsdWRlcyh0YWcpKS5tYXAoZW5kcG9pbnQgPT4gYFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJlbmRwb2ludFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZW5kcG9pbnQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm1ldGhvZCAke2VuZHBvaW50Lm1ldGhvZH1cIj4ke2VuZHBvaW50Lm1ldGhvZH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3Ryb25nPiR7ZW5kcG9pbnQucGF0aH08L3N0cm9uZz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiA1cHggMCAwIDA7IG9wYWNpdHk6IDAuOTtcIj4ke2VuZHBvaW50LnN1bW1hcnl9PC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImVuZHBvaW50LWJvZHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPiR7ZW5kcG9pbnQuZGVzY3JpcHRpb259PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAke2VuZHBvaW50LnBhcmFtZXRlcnMubGVuZ3RoID4gMCA/IGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+44OR44Op44Oh44O844K/PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJwYXJhbXMtdGFibGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPjx0aD7lkI3liY08L3RoPjx0aD7loLTmiYA8L3RoPjx0aD7lv4XpoIg8L3RoPjx0aD7lnos8L3RoPjx0aD7oqqzmmI48L3RoPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7ZW5kcG9pbnQucGFyYW1ldGVycy5tYXAocGFyYW0gPT4gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPiR7cGFyYW0ubmFtZX08L2NvZGU+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPiR7cGFyYW0uaW59PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPiR7cGFyYW0ucmVxdWlyZWQgPyAn4pyTJyA6ICcnfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4ke3BhcmFtLnR5cGV9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPiR7cGFyYW0uZGVzY3JpcHRpb259PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCkuam9pbignJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGAgOiAnJ31cblxuICAgICAgICAgICAgICAgICAgICAgICAgJHtlbmRwb2ludC5yZXF1ZXN0Qm9keSA/IGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+44Oq44Kv44Ko44K544OI44Oc44OH44KjPC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cD48c3Ryb25nPkNvbnRlbnQtVHlwZTo8L3N0cm9uZz4gJHtlbmRwb2ludC5yZXF1ZXN0Qm9keS5jb250ZW50VHlwZX08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHA+JHtlbmRwb2ludC5yZXF1ZXN0Qm9keS5kZXNjcmlwdGlvbn08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtlbmRwb2ludC5yZXF1ZXN0Qm9keS5leGFtcGxlID8gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29kZS1ibG9ja1wiPjxwcmU+JHtKU09OLnN0cmluZ2lmeShlbmRwb2ludC5yZXF1ZXN0Qm9keS5leGFtcGxlLCBudWxsLCAyKX08L3ByZT48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgIDogJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICBgIDogJyd9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoND7jg6zjgrnjg53jg7Pjgrk8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgJHtlbmRwb2ludC5yZXNwb25zZXMubWFwKHJlc3BvbnNlID0+IGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDU+JHtyZXNwb25zZS5zdGF0dXNDb2RlfSAtICR7cmVzcG9uc2UuZGVzY3JpcHRpb259PC9oNT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3Jlc3BvbnNlLmV4YW1wbGUgPyBgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2RlLWJsb2NrXCI+PHByZT4ke0pTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmV4YW1wbGUsIG51bGwsIDIpfTwvcHJlPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIGApLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGApLmpvaW4oJycpfVxuICAgICAgICBgKS5qb2luKCcnKX1cbiAgICA8L2Rpdj5cbjwvYm9keT5cbjwvaHRtbD5cbiAgICBgO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOOCouODvOOCreODhuOCr+ODgeODo+Wbs+OBrueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVBcmNoaXRlY3R1cmVEaWFncmFtcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc29sZS5sb2coJyAgIPCfj5fvuI8g44Ki44O844Kt44OG44Kv44OB44Oj44Kz44Oz44Od44O844ON44Oz44OI44KS5Y+O6ZuG5LitLi4uJyk7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBhd2FpdCB0aGlzLmNvbGxlY3RBcmNoaXRlY3R1cmVDb21wb25lbnRzKCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYCAgIPCfk4ogJHtjb21wb25lbnRzLmxlbmd0aH3lgIvjga7jgrPjg7Pjg53jg7zjg43jg7Pjg4jjgpLlh6bnkIbkuK0uLi5gKTtcblxuICAgICAgICAvLyDkuKbliJflh6bnkIbjgafjg4njgq3jg6Xjg6Hjg7Pjg4jnlJ/miJDjgpLpq5jpgJ/ljJZcbiAgICAgICAgY29uc3QgdGFza3M6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuXG4gICAgICAgIC8vIE1lcm1haWTlm7Pjga7nlJ/miJBcbiAgICAgICAgdGFza3MucHVzaChcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVBbmRXcml0ZU1lcm1haWREaWFncmFtKGNvbXBvbmVudHMpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8g44Ki44O844Kt44OG44Kv44OB44Oj44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQXG4gICAgICAgIHRhc2tzLnB1c2goXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlQW5kV3JpdGVBcmNoaXRlY3R1cmVNYXJrZG93bihjb21wb25lbnRzKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIOWFqOOBpuOBrueUn+aIkOOCv+OCueOCr+OCkuS4puWIl+Wun+ihjFxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0YXNrcyk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYCAgIOKchSDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7PnlJ/miJDlrozkuoYgKCR7Y29tcG9uZW50cy5sZW5ndGh944Kz44Oz44Od44O844ON44Oz44OIKWApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1lcm1haWTlm7Pjga7nlJ/miJDjgajmm7jjgY3ovrzjgb9cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQW5kV3JpdGVNZXJtYWlkRGlhZ3JhbShjb21wb25lbnRzOiBBcmNoaXRlY3R1cmVDb21wb25lbnRbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBtZXJtYWlkRGlhZ3JhbSA9IHRoaXMuZ2VuZXJhdGVNZXJtYWlkRGlhZ3JhbShjb21wb25lbnRzKTtcbiAgICAgICAgYXdhaXQgdGhpcy53cml0ZUZpbGUoJ2FyY2hpdGVjdHVyZS9zeXN0ZW0tYXJjaGl0ZWN0dXJlLm1kJywgYCMg44K344K544OG44Og44Ki44O844Kt44OG44Kv44OB44OjXFxuXFxuXFxgXFxgXFxgbWVybWFpZFxcbiR7bWVybWFpZERpYWdyYW19XFxuXFxgXFxgXFxgXFxuYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44Ki44O844Kt44OG44Kv44OB44Oj44Oe44O844Kv44OA44Km44Oz44Gu55Sf5oiQ44Go5pu444GN6L6844G/XG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFuZFdyaXRlQXJjaGl0ZWN0dXJlTWFya2Rvd24oY29tcG9uZW50czogQXJjaGl0ZWN0dXJlQ29tcG9uZW50W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgYXJjaE1hcmtkb3duID0gdGhpcy5nZW5lcmF0ZUFyY2hpdGVjdHVyZU1hcmtkb3duKGNvbXBvbmVudHMpO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnYXJjaGl0ZWN0dXJlL1JFQURNRS5tZCcsIGFyY2hNYXJrZG93bik7XG5cbiAgICAgICAgY29uc29sZS5sb2coYCAgIOKchSDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7PnlJ/miJDlrozkuoYgKCR7Y29tcG9uZW50cy5sZW5ndGh944Kz44Oz44Od44O844ON44Oz44OIKWApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOOCouODvOOCreODhuOCr+ODgeODo+OCs+ODs+ODneODvOODjeODs+ODiOOBruWPjumbhlxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY29sbGVjdEFyY2hpdGVjdHVyZUNvbXBvbmVudHMoKTogUHJvbWlzZTxBcmNoaXRlY3R1cmVDb21wb25lbnRbXT4ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnY2xvdWRmcm9udCcsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0Nsb3VkRnJvbnQnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICduZXR3b3JrJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+OCsOODreODvOODkOODq0NETuOAgemdmeeahOOCs+ODs+ODhuODs+ODhOmFjeS/oScsXG4gICAgICAgICAgICAgICAgdGVjaG5vbG9neTogJ0FtYXpvbiBDbG91ZEZyb250JyxcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uczogWyd3YWYnLCAnYWxiJ10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICBjYWNoaW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzc2w6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGd6aXA6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnd2FmJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnV0FGJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc2VjdXJpdHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnV2Vi44Ki44OX44Oq44Kx44O844K344On44Oz44OV44Kh44Kk44Ki44Km44Kp44O844OrJyxcbiAgICAgICAgICAgICAgICB0ZWNobm9sb2d5OiAnQVdTIFdBRicsXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnM6IFsnYWxiJ10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICBzcWxJbmplY3Rpb25Qcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB4c3NQcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICByYXRlTGltaXRpbmc6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnYWxiJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlcicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ25ldHdvcmsnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn44Ki44OX44Oq44Kx44O844K344On44Oz44Ot44O844OJ44OQ44Op44Oz44K144O8JyxcbiAgICAgICAgICAgICAgICB0ZWNobm9sb2d5OiAnQVdTIEFMQicsXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnM6IFsnbGFtYmRhLXdlYicsICdsYW1iZGEtYXBpJ10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICBoZWFsdGhDaGVjazogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc3NsVGVybWluYXRpb246IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnbGFtYmRhLXdlYicsXG4gICAgICAgICAgICAgICAgbmFtZTogJ1dlYiBMYW1iZGEnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05leHQuanPjg5Xjg63jg7Pjg4jjgqjjg7Pjg4njgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7MnLFxuICAgICAgICAgICAgICAgIHRlY2hub2xvZ3k6ICdBV1MgTGFtYmRhICsgTmV4dC5qcycsXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnM6IFsnbGFtYmRhLWFwaSddLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgcnVudGltZTogJ25vZGVqczIwLngnLFxuICAgICAgICAgICAgICAgICAgICBtZW1vcnk6ICcxMDI0TUInLFxuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiAnMzBzJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICdsYW1iZGEtYXBpJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnQVBJIExhbWJkYScsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUkVTVGZ1bCBBUEkg44K144O844OQ44O8JyxcbiAgICAgICAgICAgICAgICB0ZWNobm9sb2d5OiAnQVdTIExhbWJkYSArIEV4cHJlc3MuanMnLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBbJ2R5bmFtb2RiJywgJ29wZW5zZWFyY2gnLCAnYmVkcm9jaycsICdmc3gnXSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bnRpbWU6ICdub2RlanMyMC54JyxcbiAgICAgICAgICAgICAgICAgICAgbWVtb3J5OiAnMjA0OE1CJyxcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dDogJzVtJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICdsYW1iZGEtZW1iZWQnLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdFbWJlZGRpbmcgTGFtYmRhJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc2VydmljZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjg4njgq3jg6Xjg6Hjg7Pjg4jln4vjgoHovrzjgb/lh6bnkIYnLFxuICAgICAgICAgICAgICAgIHRlY2hub2xvZ3k6ICdBV1MgTGFtYmRhICsgUHl0aG9uJyxcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uczogWydiZWRyb2NrJywgJ29wZW5zZWFyY2gnLCAnZnN4J10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICBydW50aW1lOiAncHl0aG9uMy4xMScsXG4gICAgICAgICAgICAgICAgICAgIG1lbW9yeTogJzMwMDhNQicsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6ICcxNW0nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogJ2R5bmFtb2RiJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnRHluYW1vREInLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdkYXRhYmFzZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjgrvjg4Pjgrfjg6fjg7PnrqHnkIbjgIHjg6bjg7zjgrbjg7zjg4fjg7zjgr8nLFxuICAgICAgICAgICAgICAgIHRlY2hub2xvZ3k6ICdBbWF6b24gRHluYW1vREInLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBbXSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGJpbGxpbmdNb2RlOiAnUEFZX1BFUl9SRVFVRVNUJyxcbiAgICAgICAgICAgICAgICAgICAgZW5jcnlwdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICdvcGVuc2VhcmNoJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnT3BlblNlYXJjaCBTZXJ2ZXJsZXNzJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGF0YWJhc2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn44OZ44Kv44OI44Or5qSc57Si44Ko44Oz44K444OzJyxcbiAgICAgICAgICAgICAgICB0ZWNobm9sb2d5OiAnQW1hem9uIE9wZW5TZWFyY2ggU2VydmVybGVzcycsXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnM6IFtdLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgdmVjdG9yU2VhcmNoOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJsZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBlbmNyeXB0aW9uOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogJ2ZzeCcsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0ZTeCBmb3IgTmV0QXBwIE9OVEFQJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RvcmFnZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfpq5jmgKfog73jg5XjgqHjgqTjg6vjgrnjg4jjg6zjg7zjgrgnLFxuICAgICAgICAgICAgICAgIHRlY2hub2xvZ3k6ICdBbWF6b24gRlN4IGZvciBOZXRBcHAgT05UQVAnLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBbXSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiAnTkZTL1NNQicsXG4gICAgICAgICAgICAgICAgICAgIGRlZHVwbGljYXRpb246IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbXByZXNzaW9uOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzbmFwc2hvdHM6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnYmVkcm9jaycsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0FtYXpvbiBCZWRyb2NrJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc2VydmljZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBSS9NTOaOqOirluOCteODvOODk+OCuScsXG4gICAgICAgICAgICAgICAgdGVjaG5vbG9neTogJ0FtYXpvbiBCZWRyb2NrJyxcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uczogW10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICBtb2RlbHM6IFsnQ2xhdWRlJywgJ1RpdGFuJ10sXG4gICAgICAgICAgICAgICAgICAgIGVtYmVkZGluZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdGV4dEdlbmVyYXRpb246IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnY29nbml0bycsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0NvZ25pdG8nLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzZWN1cml0eScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfjg6bjg7zjgrbjg7zoqo3oqLzjg7voqo3lj68nLFxuICAgICAgICAgICAgICAgIHRlY2hub2xvZ3k6ICdBbWF6b24gQ29nbml0bycsXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnM6IFsnbGFtYmRhLWFwaSddLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgdXNlclBvb2w6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1mYTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgb2F1dGg6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnY2xvdWR3YXRjaCcsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0Nsb3VkV2F0Y2gnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdtb25pdG9yaW5nJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+ODreOCsOODu+ODoeODiOODquOCr+OCueebo+imlicsXG4gICAgICAgICAgICAgICAgdGVjaG5vbG9neTogJ0FtYXpvbiBDbG91ZFdhdGNoJyxcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uczogWydsYW1iZGEtd2ViJywgJ2xhbWJkYS1hcGknLCAnbGFtYmRhLWVtYmVkJ10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICBsb2dzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXRyaWNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhbGFybXM6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWVybWFpZOWbs+OBrueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgZ2VuZXJhdGVNZXJtYWlkRGlhZ3JhbShjb21wb25lbnRzOiBBcmNoaXRlY3R1cmVDb21wb25lbnRbXSk6IHN0cmluZyB7XG4gICAgICAgIGxldCBkaWFncmFtID0gJ2dyYXBoIFRCXFxuJztcblxuICAgICAgICAvLyDjg47jg7zjg4njga7lrprnvqlcbiAgICAgICAgY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IHRoaXMuZ2V0Tm9kZVNoYXBlKGNvbXBvbmVudC50eXBlKTtcbiAgICAgICAgICAgIGRpYWdyYW0gKz0gYCAgICAke2NvbXBvbmVudC5pZH0ke3NoYXBlfSR7Y29tcG9uZW50Lm5hbWV9PGJyLz4ke2NvbXBvbmVudC50ZWNobm9sb2d5fSR7c2hhcGUucmVwbGFjZSgnWycsICddJykucmVwbGFjZSgnKCcsICcpJyl9XFxuYDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGlhZ3JhbSArPSAnXFxuJztcblxuICAgICAgICAvLyDmjqXntprjga7lrprnvqlcbiAgICAgICAgY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICBjb21wb25lbnQuY29ubmVjdGlvbnMuZm9yRWFjaChjb25uZWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBkaWFncmFtICs9IGAgICAgJHtjb21wb25lbnQuaWR9IC0tPiAke2Nvbm5lY3Rpb259XFxuYDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDjgrnjgr/jgqTjg6vjga7lrprnvqlcbiAgICAgICAgZGlhZ3JhbSArPSAnXFxuJztcbiAgICAgICAgZGlhZ3JhbSArPSAnICAgIGNsYXNzRGVmIHNlcnZpY2UgZmlsbDojZTFmNWZlXFxuJztcbiAgICAgICAgZGlhZ3JhbSArPSAnICAgIGNsYXNzRGVmIGRhdGFiYXNlIGZpbGw6I2YzZTVmNVxcbic7XG4gICAgICAgIGRpYWdyYW0gKz0gJyAgICBjbGFzc0RlZiBzdG9yYWdlIGZpbGw6I2U4ZjVlOFxcbic7XG4gICAgICAgIGRpYWdyYW0gKz0gJyAgICBjbGFzc0RlZiBuZXR3b3JrIGZpbGw6I2ZmZjNlMFxcbic7XG4gICAgICAgIGRpYWdyYW0gKz0gJyAgICBjbGFzc0RlZiBzZWN1cml0eSBmaWxsOiNmZmViZWVcXG4nO1xuICAgICAgICBkaWFncmFtICs9ICcgICAgY2xhc3NEZWYgbW9uaXRvcmluZyBmaWxsOiNmMWY4ZTlcXG4nO1xuXG4gICAgICAgIC8vIOOCr+ODqeOCueOBrumBqeeUqFxuICAgICAgICBjb21wb25lbnRzLmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIGRpYWdyYW0gKz0gYCAgICBjbGFzcyAke2NvbXBvbmVudC5pZH0gJHtjb21wb25lbnQudHlwZX1cXG5gO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGlhZ3JhbTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg47jg7zjg4nlvaLnirbjga7lj5blvpdcbiAgICAgKi9cbiAgICBwcml2YXRlIGdldE5vZGVTaGFwZSh0eXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2UnOiByZXR1cm4gJ1snO1xuICAgICAgICAgICAgY2FzZSAnZGF0YWJhc2UnOiByZXR1cm4gJ1soJztcbiAgICAgICAgICAgIGNhc2UgJ3N0b3JhZ2UnOiByZXR1cm4gJ1svJztcbiAgICAgICAgICAgIGNhc2UgJ25ldHdvcmsnOiByZXR1cm4gJygnO1xuICAgICAgICAgICAgY2FzZSAnc2VjdXJpdHknOiByZXR1cm4gJ3snO1xuICAgICAgICAgICAgY2FzZSAnbW9uaXRvcmluZyc6IHJldHVybiAnKCgnO1xuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuICdbJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOOCouODvOOCreODhuOCr+ODgeODo01hcmtkb3du44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUFyY2hpdGVjdHVyZU1hcmtkb3duKGNvbXBvbmVudHM6IEFyY2hpdGVjdHVyZUNvbXBvbmVudFtdKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IG1hcmtkb3duID0gYCMgJHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0g44K344K544OG44Og44Ki44O844Kt44OG44Kv44OB44OjXFxuXFxuYDtcbiAgICAgICAgbWFya2Rvd24gKz0gYOeUn+aIkOaXpeaZgjogJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCdqYS1KUCcpfVxcblxcbmA7XG5cbiAgICAgICAgLy8g5qaC6KaBXG4gICAgICAgIG1hcmtkb3duICs9ICcjIyDmpoLopoFcXG5cXG4nO1xuICAgICAgICBtYXJrZG93biArPSAnUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtIOOBr+OAgUFtYXpvbiBGU3ggZm9yIE5ldEFwcCBPTlRBUCDjgaggQW1hem9uIEJlZHJvY2sg44KS57WE44G/5ZCI44KP44Gb44Gf44CB44Ko44Oz44K/44O844OX44Op44Kk44K644Kw44Os44O844OJ44GuIFJBR++8iFJldHJpZXZhbC1BdWdtZW50ZWQgR2VuZXJhdGlvbu+8ieOCt+OCueODhuODoOOBp+OBmeOAglxcblxcbic7XG5cbiAgICAgICAgLy8g44Ki44O844Kt44OG44Kv44OB44Oj5ZuzXG4gICAgICAgIG1hcmtkb3duICs9ICcjIyDjgrfjgrnjg4bjg6Dmp4vmiJDlm7NcXG5cXG4nO1xuICAgICAgICBtYXJrZG93biArPSAnYGBgbWVybWFpZFxcbic7XG4gICAgICAgIG1hcmtkb3duICs9IHRoaXMuZ2VuZXJhdGVNZXJtYWlkRGlhZ3JhbShjb21wb25lbnRzKTtcbiAgICAgICAgbWFya2Rvd24gKz0gJ1xcbmBgYFxcblxcbic7XG5cbiAgICAgICAgLy8g44Kz44Oz44Od44O844ON44Oz44OI5Yil6Kqs5piOXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHNCeVR5cGUgPSBjb21wb25lbnRzLnJlZHVjZSgoYWNjLCBjb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgIGlmICghYWNjW2NvbXBvbmVudC50eXBlXSkgYWNjW2NvbXBvbmVudC50eXBlXSA9IFtdO1xuICAgICAgICAgICAgYWNjW2NvbXBvbmVudC50eXBlXS5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LCB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBBcmNoaXRlY3R1cmVDb21wb25lbnRbXT4pO1xuXG4gICAgICAgIGNvbnN0IHR5cGVOYW1lcyA9IHtcbiAgICAgICAgICAgIHNlcnZpY2U6ICfjgrXjg7zjg5PjgrknLFxuICAgICAgICAgICAgZGF0YWJhc2U6ICfjg4fjg7zjgr/jg5njg7zjgrknLFxuICAgICAgICAgICAgc3RvcmFnZTogJ+OCueODiOODrOODvOOCuCcsXG4gICAgICAgICAgICBuZXR3b3JrOiAn44ON44OD44OI44Ov44O844KvJyxcbiAgICAgICAgICAgIHNlY3VyaXR5OiAn44K744Kt44Ol44Oq44OG44KjJyxcbiAgICAgICAgICAgIG1vbml0b3Jpbmc6ICfnm6PoppYnXG4gICAgICAgIH07XG5cbiAgICAgICAgT2JqZWN0LmVudHJpZXMoY29tcG9uZW50c0J5VHlwZSkuZm9yRWFjaCgoW3R5cGUsIGNvbXBzXSkgPT4ge1xuICAgICAgICAgICAgbWFya2Rvd24gKz0gYCMjICR7dHlwZU5hbWVzW3R5cGUgYXMga2V5b2YgdHlwZW9mIHR5cGVOYW1lc10gfHwgdHlwZX1cXG5cXG5gO1xuXG4gICAgICAgICAgICBjb21wcy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYCMjIyAke2NvbXBvbmVudC5uYW1lfVxcblxcbmA7XG4gICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYCoq5oqA6KGTOioqICR7Y29tcG9uZW50LnRlY2hub2xvZ3l9XFxuXFxuYDtcbiAgICAgICAgICAgICAgICBtYXJrZG93biArPSBgKiroqqzmmI46KiogJHtjb21wb25lbnQuZGVzY3JpcHRpb259XFxuXFxuYDtcblxuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhjb21wb25lbnQucHJvcGVydGllcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZG93biArPSAnKirkuLvopoHmqZ/og706KipcXG4nO1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuZW50cmllcyhjb21wb25lbnQucHJvcGVydGllcykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZG93biArPSBgLSAke2tleX06ICR7dmFsdWV9XFxuYDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQuY29ubmVjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZG93biArPSBgKirmjqXntprlhYg6KiogJHtjb21wb25lbnQuY29ubmVjdGlvbnMuam9pbignLCAnKX1cXG5cXG5gO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9ICctLS1cXG5cXG4nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBtYXJrZG93bjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg5XjgqHjgqTjg6vmm7jjgY3ovrzjgb9cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHdyaXRlRmlsZShyZWxhdGl2ZVBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuY29uZmlnLm91dHB1dERpcmVjdG9yeSwgcmVsYXRpdmVQYXRoKTtcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGZ1bGxQYXRoKTtcblxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZ1bGxQYXRoLCBjb250ZW50LCAndXRmOCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAgICogQVBJ44Oe44O844Kv44OA44Km44Oz44OJ44Kt44Ol44Oh44Oz44OI44Gu55Sf5oiQXG4gICAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlQXBpTWFya2Rvd24oZW5kcG9pbnRzOiBBcGlFbmRwb2ludFtdKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IG1hcmtkb3duID0gYCMgJHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0gQVBJIOODieOCreODpeODoeODs+ODiFxcblxcbmA7XG4gICAgICAgIG1hcmtkb3duICs9IGDjg5Djg7zjgrjjg6fjg7M6ICR7dGhpcy5jb25maWcudmVyc2lvbn1cXG5cXG5gO1xuICAgICAgICBtYXJrZG93biArPSBgIyMg5qaC6KaBXFxuXFxuUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtIOOBrkFQSeS7leanmOabuOOBp+OBmeOAglxcblxcbmA7XG5cbiAgICAgICAgLy8g44K/44Kw5Yil44Gr44Ko44Oz44OJ44Od44Kk44Oz44OI44KS44Kw44Or44O844OX5YyWXG4gICAgICAgIGNvbnN0IGdyb3VwZWRFbmRwb2ludHMgPSB0aGlzLmdyb3VwRW5kcG9pbnRzQnlUYWcoZW5kcG9pbnRzKTtcblxuICAgICAgICBmb3IgKGNvbnN0IFt0YWcsIHRhZ0VuZHBvaW50c10gb2YgT2JqZWN0LmVudHJpZXMoZ3JvdXBlZEVuZHBvaW50cykpIHtcbiAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyAke3RhZ31cXG5cXG5gO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVuZHBvaW50IG9mIHRhZ0VuZHBvaW50cykge1xuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyMgJHtlbmRwb2ludC5tZXRob2R9ICR7ZW5kcG9pbnQucGF0aH1cXG5cXG5gO1xuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAke2VuZHBvaW50LmRlc2NyaXB0aW9ufVxcblxcbmA7XG5cbiAgICAgICAgICAgICAgICAvLyDjg5Hjg6njg6Hjg7zjgr9cbiAgICAgICAgICAgICAgICBpZiAoZW5kcG9pbnQucGFyYW1ldGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyMjIOODkeODqeODoeODvOOCv1xcblxcbmA7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGB8IOWQjeWJjSB8IOWgtOaJgCB8IOW/hemgiCB8IOWeiyB8IOiqrOaYjiB8XFxuYDtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYHwtLS0tLS18LS0tLS0tfC0tLS0tLXwtLS0tfC0tLS0tIHxcXG5gO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcGFyYW0gb2YgZW5kcG9pbnQucGFyYW1ldGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYHwgJHtwYXJhbS5uYW1lfSB8ICR7cGFyYW0uaW59IHwgJHtwYXJhbS5yZXF1aXJlZCA/ICfinJMnIDogJyd9IHwgJHtwYXJhbS50eXBlfSB8ICR7cGFyYW0uZGVzY3JpcHRpb259IHxcXG5gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGBcXG5gO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOODrOOCueODneODs+OCuVxuICAgICAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyMjIOODrOOCueODneODs+OCuVxcblxcbmA7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCByZXNwb25zZSBvZiBlbmRwb2ludC5yZXNwb25zZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYCoqJHtyZXNwb25zZS5zdGF0dXNDb2RlfSoqIC0gJHtyZXNwb25zZS5kZXNjcmlwdGlvbn1cXG5cXG5gO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZXhhbXBsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYFxcYFxcYFxcYGpzb25cXG4ke0pTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmV4YW1wbGUsIG51bGwsIDIpfVxcblxcYFxcYFxcYFxcblxcbmA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWFya2Rvd247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQVBJIEhUTUzjg4njgq3jg6Xjg6Hjg7Pjg4jjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlQXBpSHRtbChlbmRwb2ludHM6IEFwaUVuZHBvaW50W10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCB0aXRsZSA9IGAke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfSBBUEkg44OJ44Kt44Ol44Oh44Oz44OIYDtcblxuICAgICAgICBsZXQgaHRtbCA9IGA8IURPQ1RZUEUgaHRtbD5cbjxodG1sIGxhbmc9XCJqYVwiPlxuPGhlYWQ+XG4gICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIj5cbiAgICA8dGl0bGU+JHt0aXRsZX08L3RpdGxlPlxuICAgIDxzdHlsZT5cbiAgICAgICAgYm9keSB7IGZvbnQtZmFtaWx5OiAnU2Vnb2UgVUknLCBUYWhvbWEsIEdlbmV2YSwgVmVyZGFuYSwgc2Fucy1zZXJpZjsgbWFyZ2luOiAwOyBwYWRkaW5nOiAyMHB4OyB9XG4gICAgICAgIC5jb250YWluZXIgeyBtYXgtd2lkdGg6IDEyMDBweDsgbWFyZ2luOiAwIGF1dG87IH1cbiAgICAgICAgLmVuZHBvaW50IHsgYm9yZGVyOiAxcHggc29saWQgI2RkZDsgbWFyZ2luOiAyMHB4IDA7IGJvcmRlci1yYWRpdXM6IDhweDsgfVxuICAgICAgICAuZW5kcG9pbnQtaGVhZGVyIHsgYmFja2dyb3VuZDogI2Y1ZjVmNTsgcGFkZGluZzogMTVweDsgYm9yZGVyLXJhZGl1czogOHB4IDhweCAwIDA7IH1cbiAgICAgICAgLmVuZHBvaW50LWJvZHkgeyBwYWRkaW5nOiAxNXB4OyB9XG4gICAgICAgIC5tZXRob2QgeyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IHBhZGRpbmc6IDRweCA4cHg7IGJvcmRlci1yYWRpdXM6IDRweDsgY29sb3I6IHdoaXRlOyBmb250LXdlaWdodDogYm9sZDsgfVxuICAgICAgICAubWV0aG9kLkdFVCB7IGJhY2tncm91bmQ6ICMyOGE3NDU7IH1cbiAgICAgICAgLm1ldGhvZC5QT1NUIHsgYmFja2dyb3VuZDogIzAwN2JmZjsgfVxuICAgICAgICAubWV0aG9kLlBVVCB7IGJhY2tncm91bmQ6ICNmZmMxMDc7IGNvbG9yOiBibGFjazsgfVxuICAgICAgICAubWV0aG9kLkRFTEVURSB7IGJhY2tncm91bmQ6ICNkYzM1NDU7IH1cbiAgICAgICAgLm1ldGhvZC5QQVRDSCB7IGJhY2tncm91bmQ6ICM2ZjQyYzE7IH1cbiAgICAgICAgcHJlIHsgYmFja2dyb3VuZDogI2Y4ZjlmYTsgcGFkZGluZzogMTVweDsgYm9yZGVyLXJhZGl1czogNHB4OyBvdmVyZmxvdy14OiBhdXRvOyB9XG4gICAgICAgIHRhYmxlIHsgd2lkdGg6IDEwMCU7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IG1hcmdpbjogMTBweCAwOyB9XG4gICAgICAgIHRoLCB0ZCB7IGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7IHBhZGRpbmc6IDhweDsgdGV4dC1hbGlnbjogbGVmdDsgfVxuICAgICAgICB0aCB7IGJhY2tncm91bmQ6ICNmNWY1ZjU7IH1cbiAgICA8L3N0eWxlPlxuPC9oZWFkPlxuPGJvZHk+XG4gICAgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgICAgICA8aDE+JHt0aXRsZX08L2gxPlxuICAgICAgICA8cD7jg5Djg7zjgrjjg6fjg7M6ICR7dGhpcy5jb25maWcudmVyc2lvbn08L3A+XG4gICAgICAgIDxwPlBlcm1pc3Npb24tYXdhcmUgUkFHIFN5c3RlbSDjga5BUEnku5Xmp5jmm7jjgafjgZnjgII8L3A+XG5gO1xuXG4gICAgICAgIGNvbnN0IGdyb3VwZWRFbmRwb2ludHMgPSB0aGlzLmdyb3VwRW5kcG9pbnRzQnlUYWcoZW5kcG9pbnRzKTtcblxuICAgICAgICBmb3IgKGNvbnN0IFt0YWcsIHRhZ0VuZHBvaW50c10gb2YgT2JqZWN0LmVudHJpZXMoZ3JvdXBlZEVuZHBvaW50cykpIHtcbiAgICAgICAgICAgIGh0bWwgKz0gYCAgICAgICAgPGgyPiR7dGFnfTwvaDI+XFxuYDtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBlbmRwb2ludCBvZiB0YWdFbmRwb2ludHMpIHtcbiAgICAgICAgICAgICAgICBodG1sICs9IGAgICAgICAgIDxkaXYgY2xhc3M9XCJlbmRwb2ludFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImVuZHBvaW50LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibWV0aG9kICR7ZW5kcG9pbnQubWV0aG9kfVwiPiR7ZW5kcG9pbnQubWV0aG9kfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Ryb25nPiR7ZW5kcG9pbnQucGF0aH08L3N0cm9uZz5cbiAgICAgICAgICAgICAgICA8cD4ke2VuZHBvaW50LmRlc2NyaXB0aW9ufTwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImVuZHBvaW50LWJvZHlcIj5cbmA7XG5cbiAgICAgICAgICAgICAgICAvLyDjg5Hjg6njg6Hjg7zjgr/jg4bjg7zjg5bjg6tcbiAgICAgICAgICAgICAgICBpZiAoZW5kcG9pbnQucGFyYW1ldGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gYCAgICAgICAgICAgICAgICA8aDQ+44OR44Op44Oh44O844K/PC9oND5cbiAgICAgICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAgICAgICAgIDx0cj48dGg+5ZCN5YmNPC90aD48dGg+5aC05omAPC90aD48dGg+5b+F6aCIPC90aD48dGg+5Z6LPC90aD48dGg+6Kqs5piOPC90aD48L3RyPlxuYDtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYXJhbSBvZiBlbmRwb2ludC5wYXJhbWV0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBodG1sICs9IGAgICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4ke3BhcmFtLm5hbWV9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4ke3BhcmFtLmlufTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+JHtwYXJhbS5yZXF1aXJlZCA/ICfinJMnIDogJyd9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4ke3BhcmFtLnR5cGV9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4ke3BhcmFtLmRlc2NyaXB0aW9ufTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XG5gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gYCAgICAgICAgICAgICAgICA8L3RhYmxlPlxuYDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDjg6zjgrnjg53jg7PjgrnkvotcbiAgICAgICAgICAgICAgICBodG1sICs9IGAgICAgICAgICAgICAgICAgPGg0PuODrOOCueODneODs+OCuTwvaDQ+XG5gO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcmVzcG9uc2Ugb2YgZW5kcG9pbnQucmVzcG9uc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gYCAgICAgICAgICAgICAgICA8cD48c3Ryb25nPiR7cmVzcG9uc2Uuc3RhdHVzQ29kZX08L3N0cm9uZz4gLSAke3Jlc3BvbnNlLmRlc2NyaXB0aW9ufTwvcD5cbmA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5leGFtcGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBodG1sICs9IGAgICAgICAgICAgICAgICAgPHByZT48Y29kZT4ke0pTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmV4YW1wbGUsIG51bGwsIDIpfTwvY29kZT48L3ByZT5cbmA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBodG1sICs9IGAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaHRtbCArPSBgICAgIDwvZGl2PlxuPC9ib2R5PlxuPC9odG1sPmA7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44Ko44Oz44OJ44Od44Kk44Oz44OI44KS44K/44Kw5Yil44Gr44Kw44Or44O844OX5YyWXG4gICAgICovXG4gICAgcHJpdmF0ZSBncm91cEVuZHBvaW50c0J5VGFnKGVuZHBvaW50czogQXBpRW5kcG9pbnRbXSk6IFJlY29yZDxzdHJpbmcsIEFwaUVuZHBvaW50W10+IHtcbiAgICAgICAgY29uc3QgZ3JvdXBlZDogUmVjb3JkPHN0cmluZywgQXBpRW5kcG9pbnRbXT4gPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IGVuZHBvaW50IG9mIGVuZHBvaW50cykge1xuICAgICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgZW5kcG9pbnQudGFncykge1xuICAgICAgICAgICAgICAgIGlmICghZ3JvdXBlZFt0YWddKSB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwZWRbdGFnXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBncm91cGVkW3RhZ10ucHVzaChlbmRwb2ludCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ3JvdXBlZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7Pjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQXJjaGl0ZWN0dXJlRGlhZ3JhbXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgICDwn4+X77iPIOOCouODvOOCreODhuOCr+ODgeODo+OCs+ODs+ODneODvOODjeODs+ODiOOCkuWPjumbhuS4rS4uLicpO1xuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gYXdhaXQgdGhpcy5jb2xsZWN0QXJjaGl0ZWN0dXJlQ29tcG9uZW50cygpO1xuXG4gICAgICAgIC8vIE1lcm1haWTlm7Pjga7nlJ/miJBcbiAgICAgICAgY29uc3QgbWVybWFpZERpYWdyYW0gPSB0aGlzLmdlbmVyYXRlTWVybWFpZERpYWdyYW0oY29tcG9uZW50cyk7XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKCdhcmNoaXRlY3R1cmUvYXJjaGl0ZWN0dXJlLm1tZCcsIG1lcm1haWREaWFncmFtKTtcblxuICAgICAgICAvLyDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Pjg4njgq3jg6Xjg6Hjg7Pjg4jjga7nlJ/miJBcbiAgICAgICAgY29uc3QgYXJjaE1hcmtkb3duID0gdGhpcy5nZW5lcmF0ZUFyY2hpdGVjdHVyZU1hcmtkb3duKGNvbXBvbmVudHMpO1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnYXJjaGl0ZWN0dXJlL1JFQURNRS5tZCcsIGFyY2hNYXJrZG93bik7XG5cbiAgICAgICAgY29uc29sZS5sb2coYCAgIOKchSDjgqLjg7zjgq3jg4bjgq/jg4Hjg6Plm7PnlJ/miJDlrozkuoYgKCR7Y29tcG9uZW50cy5sZW5ndGh944Kz44Oz44Od44O844ON44Oz44OIKWApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOOCouODvOOCreODhuOCr+ODgeODo+OCs+ODs+ODneODvOODjeODs+ODiOOBruWPjumbhlxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY29sbGVjdEFyY2hpdGVjdHVyZUNvbXBvbmVudHMoKTogUHJvbWlzZTxBcmNoaXRlY3R1cmVDb21wb25lbnRbXT4ge1xuICAgICAgICAvLyBDREvjgrnjgr/jg4Pjgq/jgYvjgonjgrPjg7Pjg53jg7zjg43jg7Pjg4jmg4XloLHjgpLmir3lh7pcbiAgICAgICAgY29uc3QgY29tcG9uZW50czogQXJjaGl0ZWN0dXJlQ29tcG9uZW50W10gPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICdjbG91ZGZyb250JyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnQ2xvdWRGcm9udCcsXG4gICAgICAgICAgICAgICAgdHlwZTogJ25ldHdvcmsnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn44Kw44Ot44O844OQ44OrQ0ROJyxcbiAgICAgICAgICAgICAgICB0ZWNobm9sb2d5OiAnQVdTIENsb3VkRnJvbnQnLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBbJ2xhbWJkYS13ZWItYWRhcHRlciddLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgY2FjaGluZzogdHJ1ZSwgc3NsOiB0cnVlIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICdsYW1iZGEtd2ViLWFkYXB0ZXInLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdMYW1iZGEgV2ViIEFkYXB0ZXInLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05leHQuanPjgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7MnLFxuICAgICAgICAgICAgICAgIHRlY2hub2xvZ3k6ICdBV1MgTGFtYmRhICsgTmV4dC5qcycsXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnM6IFsnYXBpLWdhdGV3YXknLCAnZHluYW1vZGInXSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHJ1bnRpbWU6ICdub2RlanMyMC54JyB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnYXBpLWdhdGV3YXknLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdBUEkgR2F0ZXdheScsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUkVTVCBBUEknLFxuICAgICAgICAgICAgICAgIHRlY2hub2xvZ3k6ICdBV1MgQVBJIEdhdGV3YXknLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBbJ2xhbWJkYS1mdW5jdGlvbnMnXSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IGNvcnM6IHRydWUsIGF1dGg6ICdDb2duaXRvJyB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnbGFtYmRhLWZ1bmN0aW9ucycsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0xhbWJkYSBGdW5jdGlvbnMnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+ODkOODg+OCr+OCqOODs+ODieWHpueQhicsXG4gICAgICAgICAgICAgICAgdGVjaG5vbG9neTogJ0FXUyBMYW1iZGEnLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBbJ2R5bmFtb2RiJywgJ29wZW5zZWFyY2gnLCAnYmVkcm9jayddLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgcnVudGltZTogJ25vZGVqczIwLngnIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICdkeW5hbW9kYicsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0R5bmFtb0RCJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGF0YWJhc2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn44K744OD44K344On44Oz566h55CGJyxcbiAgICAgICAgICAgICAgICB0ZWNobm9sb2d5OiAnQVdTIER5bmFtb0RCJyxcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uczogW10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogeyBiaWxsaW5nOiAnb24tZGVtYW5kJyB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnb3BlbnNlYXJjaCcsXG4gICAgICAgICAgICAgICAgbmFtZTogJ09wZW5TZWFyY2ggU2VydmVybGVzcycsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2RhdGFiYXNlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+ODmeOCr+ODiOODq+aknOe0oicsXG4gICAgICAgICAgICAgICAgdGVjaG5vbG9neTogJ0FXUyBPcGVuU2VhcmNoIFNlcnZlcmxlc3MnLFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zOiBbJ2ZzeCddLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdmVjdG9yU2VhcmNoOiB0cnVlIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICdiZWRyb2NrJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnQW1hem9uIEJlZHJvY2snLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FJL01MIOOCteODvOODk+OCuScsXG4gICAgICAgICAgICAgICAgdGVjaG5vbG9neTogJ0FXUyBCZWRyb2NrJyxcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uczogW10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogeyBtb2RlbHM6IFsnQ2xhdWRlJywgJ1RpdGFuJ10gfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogJ2ZzeCcsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0ZTeCBmb3IgTmV0QXBwIE9OVEFQJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RvcmFnZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfpq5jmgKfog73jg5XjgqHjgqTjg6vjgrfjgrnjg4bjg6AnLFxuICAgICAgICAgICAgICAgIHRlY2hub2xvZ3k6ICdBV1MgRlN4JyxcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uczogW10sXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogeyBwcm90b2NvbDogJ05GUy9TTUInIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgICAgICByZXR1cm4gY29tcG9uZW50cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXJtYWlk5Zuz44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZU1lcm1haWREaWFncmFtKGNvbXBvbmVudHM6IEFyY2hpdGVjdHVyZUNvbXBvbmVudFtdKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IG1lcm1haWQgPSBgZ3JhcGggVERcXG5gO1xuXG4gICAgICAgIC8vIOODjuODvOODieOBruWumue+qVxuICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBjb21wb25lbnRzKSB7XG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IHRoaXMuZ2V0TWVybWFpZFNoYXBlKGNvbXBvbmVudC50eXBlKTtcbiAgICAgICAgICAgIG1lcm1haWQgKz0gYCAgICAke2NvbXBvbmVudC5pZH0ke3NoYXBlfSR7Y29tcG9uZW50Lm5hbWV9JHtzaGFwZS5zcGxpdCgnWycpWzFdfVxcbmA7XG4gICAgICAgIH1cblxuICAgICAgICBtZXJtYWlkICs9IGBcXG5gO1xuXG4gICAgICAgIC8vIOaOpee2muOBruWumue+qVxuICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBjb21wb25lbnRzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbm5lY3Rpb24gb2YgY29tcG9uZW50LmNvbm5lY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgbWVybWFpZCArPSBgICAgICR7Y29tcG9uZW50LmlkfSAtLT4gJHtjb25uZWN0aW9ufVxcbmA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDjgrnjgr/jgqTjg6vjga7lrprnvqlcbiAgICAgICAgbWVybWFpZCArPSBgXFxuYDtcbiAgICAgICAgbWVybWFpZCArPSBgICAgIGNsYXNzRGVmIHNlcnZpY2UgZmlsbDojZTFmNWZlXFxuYDtcbiAgICAgICAgbWVybWFpZCArPSBgICAgIGNsYXNzRGVmIGRhdGFiYXNlIGZpbGw6I2YzZTVmNVxcbmA7XG4gICAgICAgIG1lcm1haWQgKz0gYCAgICBjbGFzc0RlZiBzdG9yYWdlIGZpbGw6I2U4ZjVlOFxcbmA7XG4gICAgICAgIG1lcm1haWQgKz0gYCAgICBjbGFzc0RlZiBuZXR3b3JrIGZpbGw6I2ZmZjNlMFxcbmA7XG4gICAgICAgIG1lcm1haWQgKz0gYCAgICBjbGFzc0RlZiBzZWN1cml0eSBmaWxsOiNmZmViZWVcXG5gO1xuXG4gICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIGNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIG1lcm1haWQgKz0gYCAgICBjbGFzcyAke2NvbXBvbmVudC5pZH0gJHtjb21wb25lbnQudHlwZX1cXG5gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1lcm1haWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWVybWFpZOOBruWbs+W9ouOCkuWPluW+l1xuICAgICAqL1xuICAgIHByaXZhdGUgZ2V0TWVybWFpZFNoYXBlKHR5cGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnc2VydmljZSc6IHJldHVybiAnWyc7XG4gICAgICAgICAgICBjYXNlICdkYXRhYmFzZSc6IHJldHVybiAnWygnO1xuICAgICAgICAgICAgY2FzZSAnc3RvcmFnZSc6IHJldHVybiAnWy8nO1xuICAgICAgICAgICAgY2FzZSAnbmV0d29yayc6IHJldHVybiAnKCgnO1xuICAgICAgICAgICAgY2FzZSAnc2VjdXJpdHknOiByZXR1cm4gJ3snO1xuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuICdbJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOOCouODvOOCreODhuOCr+ODgeODo+ODnuODvOOCr+ODgOOCpuODs+OBrueUn+aIkFxuICAgICAqL1xuICAgIHByaXZhdGUgZ2VuZXJhdGVBcmNoaXRlY3R1cmVNYXJrZG93bihjb21wb25lbnRzOiBBcmNoaXRlY3R1cmVDb21wb25lbnRbXSk6IHN0cmluZyB7XG4gICAgICAgIGxldCBtYXJrZG93biA9IGAjICR7dGhpcy5jb25maWcucHJvamVjdE5hbWV9IOOCouODvOOCreODhuOCr+ODgeODo1xcblxcbmA7XG4gICAgICAgIG1hcmtkb3duICs9IGAjIyDjgrfjgrnjg4bjg6DmpoLopoFcXG5cXG5gO1xuICAgICAgICBtYXJrZG93biArPSBgUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtIOOBruOCouODvOOCreODhuOCr+ODgeODo+ani+aIkOWbs+OBp+OBmeOAglxcblxcbmA7XG5cbiAgICAgICAgLy8g44Kz44Oz44Od44O844ON44Oz44OI5LiA6KanXG4gICAgICAgIG1hcmtkb3duICs9IGAjIyDjgrPjg7Pjg53jg7zjg43jg7Pjg4jkuIDopqdcXG5cXG5gO1xuICAgICAgICBtYXJrZG93biArPSBgfCDjgrPjg7Pjg53jg7zjg43jg7Pjg4ggfCDjgr/jgqTjg5cgfCDmioDooZMgfCDoqqzmmI4gfFxcbmA7XG4gICAgICAgIG1hcmtkb3duICs9IGB8LS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tfC0tLS0tLXwtLS0tLS18XFxuYDtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBjb21wb25lbnRzKSB7XG4gICAgICAgICAgICBtYXJrZG93biArPSBgfCAke2NvbXBvbmVudC5uYW1lfSB8ICR7Y29tcG9uZW50LnR5cGV9IHwgJHtjb21wb25lbnQudGVjaG5vbG9neX0gfCAke2NvbXBvbmVudC5kZXNjcmlwdGlvbn0gfFxcbmA7XG4gICAgICAgIH1cblxuICAgICAgICBtYXJrZG93biArPSBgXFxuIyMg44Ki44O844Kt44OG44Kv44OB44Oj5ZuzXFxuXFxuYDtcbiAgICAgICAgbWFya2Rvd24gKz0gYFxcYFxcYFxcYG1lcm1haWRcXG5gO1xuICAgICAgICBtYXJrZG93biArPSB0aGlzLmdlbmVyYXRlTWVybWFpZERpYWdyYW0oY29tcG9uZW50cyk7XG4gICAgICAgIG1hcmtkb3duICs9IGBcXGBcXGBcXGBcXG5cXG5gO1xuXG4gICAgICAgIHJldHVybiBtYXJrZG93bjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg4bjgrnjg4jjg6zjg53jg7zjg4jjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZ2VuZXJhdGVUZXN0UmVwb3J0cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc29sZS5sb2coJyAgIPCfk4og44OG44K544OI57WQ5p6c44KS5Y+O6ZuG5LitLi4uJyk7XG4gICAgICAgIGNvbnN0IHRlc3RSZXBvcnRzID0gYXdhaXQgdGhpcy5jb2xsZWN0VGVzdFJlcG9ydHMoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHJlcG9ydCBvZiB0ZXN0UmVwb3J0cykge1xuICAgICAgICAgICAgY29uc3QgcmVwb3J0TWFya2Rvd24gPSB0aGlzLmdlbmVyYXRlVGVzdFJlcG9ydE1hcmtkb3duKHJlcG9ydCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZShgdGVzdHMvdGVzdC1yZXBvcnQtJHtyZXBvcnQudGVzdFJ1bklkfS5tZGAsIHJlcG9ydE1hcmtkb3duKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOOCteODnuODquODvOODrOODneODvOODiOOBrueUn+aIkFxuICAgICAgICBjb25zdCBzdW1tYXJ5TWFya2Rvd24gPSB0aGlzLmdlbmVyYXRlVGVzdFN1bW1hcnlNYXJrZG93bih0ZXN0UmVwb3J0cyk7XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKCd0ZXN0cy9SRUFETUUubWQnLCBzdW1tYXJ5TWFya2Rvd24pO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDinIUg44OG44K544OI44Os44Od44O844OI55Sf5oiQ5a6M5LqGICgke3Rlc3RSZXBvcnRzLmxlbmd0aH3ku7YpYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44OG44K544OI44Os44Od44O844OI44Gu5Y+O6ZuGXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBjb2xsZWN0VGVzdFJlcG9ydHMoKTogUHJvbWlzZTxUZXN0UmVwb3J0W10+IHtcbiAgICAgICAgLy8g5a6f6Zqb44Gu5a6f6KOF44Gn44Gv44CB44OG44K544OI57WQ5p6c44OV44Kh44Kk44Or44KEQ0kvQ0Tjgrfjgrnjg4bjg6DjgYvjgonlj47pm4ZcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXN0UnVuSWQ6ICdydW4tMDAxJyxcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcsXG4gICAgICAgICAgICAgICAgc3VtbWFyeToge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFRlc3RzOiA0NSxcbiAgICAgICAgICAgICAgICAgICAgcGFzc2VkVGVzdHM6IDQyLFxuICAgICAgICAgICAgICAgICAgICBmYWlsZWRUZXN0czogMixcbiAgICAgICAgICAgICAgICAgICAgc2tpcHBlZFRlc3RzOiAxLFxuICAgICAgICAgICAgICAgICAgICBvdmVyYWxsU2NvcmU6IDkzLjNcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHN1aXRlUmVzdWx0czogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWl0ZU5hbWU6ICdBUEkgVGVzdHMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3JlOiA5NS4wLFxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDEyMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDb3VudDogMjAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxzOiB7IGNvdmVyYWdlOiAnODUlJyB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1aXRlTmFtZTogJ0ludGVncmF0aW9uIFRlc3RzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcmU6IDgwLjAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENvdW50OiAxNSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IHsgZmFpbGVkVGVzdHM6IFsnYXV0aC1mbG93JywgJ2RvY3VtZW50LXVwbG9hZCddIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICfoqo3oqLzjg5Xjg63jg7zjga7jg4bjgrnjg4jjgrHjg7zjgrnjgpLopovnm7TjgZfjgabjgY/jgaDjgZXjgYQnLFxuICAgICAgICAgICAgICAgICAgICAn44OJ44Kt44Ol44Oh44Oz44OI44Ki44OD44OX44Ot44O844OJ5qmf6IO944Gu44Ko44Op44O844OP44Oz44OJ44Oq44Oz44Kw44KS5pS55ZaE44GX44Gm44GP44Gg44GV44GEJ1xuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg4bjgrnjg4jjg6zjg53jg7zjg4jjg57jg7zjgq/jg4Djgqbjg7Pjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlVGVzdFJlcG9ydE1hcmtkb3duKHJlcG9ydDogVGVzdFJlcG9ydCk6IHN0cmluZyB7XG4gICAgICAgIGxldCBtYXJrZG93biA9IGAjIOODhuOCueODiOODrOODneODvOODiCAtICR7cmVwb3J0LnRlc3RSdW5JZH1cXG5cXG5gO1xuICAgICAgICBtYXJrZG93biArPSBgKirlrp/ooYzml6XmmYIqKjogJHtyZXBvcnQudGltZXN0YW1wLnRvTG9jYWxlU3RyaW5nKCdqYS1KUCcpfVxcbmA7XG4gICAgICAgIG1hcmtkb3duICs9IGAqKueSsOWigyoqOiAke3JlcG9ydC5lbnZpcm9ubWVudH1cXG5cXG5gO1xuXG4gICAgICAgIC8vIOOCteODnuODquODvFxuICAgICAgICBtYXJrZG93biArPSBgIyMg44OG44K544OI57WQ5p6c44K144Oe44Oq44O8XFxuXFxuYDtcbiAgICAgICAgbWFya2Rvd24gKz0gYC0gKirnt4/jg4bjgrnjg4jmlbAqKjogJHtyZXBvcnQuc3VtbWFyeS50b3RhbFRlc3RzfVxcbmA7XG4gICAgICAgIG1hcmtkb3duICs9IGAtICoq5oiQ5YqfKio6ICR7cmVwb3J0LnN1bW1hcnkucGFzc2VkVGVzdHN9XFxuYDtcbiAgICAgICAgbWFya2Rvd24gKz0gYC0gKirlpLHmlZcqKjogJHtyZXBvcnQuc3VtbWFyeS5mYWlsZWRUZXN0c31cXG5gO1xuICAgICAgICBtYXJrZG93biArPSBgLSAqKuOCueOCreODg+ODlyoqOiAke3JlcG9ydC5zdW1tYXJ5LnNraXBwZWRUZXN0c31cXG5gO1xuICAgICAgICBtYXJrZG93biArPSBgLSAqKuaIkOWKn+eOhyoqOiAke3JlcG9ydC5zdW1tYXJ5Lm92ZXJhbGxTY29yZS50b0ZpeGVkKDEpfSVcXG5cXG5gO1xuXG4gICAgICAgIC8vIOOCueOCpOODvOODiOWIpee1kOaenFxuICAgICAgICBtYXJrZG93biArPSBgIyMg44K544Kk44O844OI5Yil57WQ5p6cXFxuXFxuYDtcbiAgICAgICAgZm9yIChjb25zdCBzdWl0ZSBvZiByZXBvcnQuc3VpdGVSZXN1bHRzKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBzdWl0ZS5zdWNjZXNzID8gJ+KchScgOiAn4p2MJztcbiAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyMgJHtzdGF0dXN9ICR7c3VpdGUuc3VpdGVOYW1lfVxcblxcbmA7XG4gICAgICAgICAgICBtYXJrZG93biArPSBgLSAqKuOCueOCs+OCoioqOiAke3N1aXRlLnNjb3JlLnRvRml4ZWQoMSl9JVxcbmA7XG4gICAgICAgICAgICBtYXJrZG93biArPSBgLSAqKuWun+ihjOaZgumWkyoqOiAke3N1aXRlLmR1cmF0aW9ufeenklxcbmA7XG4gICAgICAgICAgICBtYXJrZG93biArPSBgLSAqKuODhuOCueODiOaVsCoqOiAke3N1aXRlLnRlc3RDb3VudH1cXG5cXG5gO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5o6o5aWo5LqL6aCFXG4gICAgICAgIGlmIChyZXBvcnQucmVjb21tZW5kYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1hcmtkb3duICs9IGAjIyDmjqjlpajkuovpoIVcXG5cXG5gO1xuICAgICAgICAgICAgZm9yIChjb25zdCByZWNvbW1lbmRhdGlvbiBvZiByZXBvcnQucmVjb21tZW5kYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgbWFya2Rvd24gKz0gYC0gJHtyZWNvbW1lbmRhdGlvbn1cXG5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFya2Rvd24gKz0gYFxcbmA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWFya2Rvd247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44OG44K544OI44K144Oe44Oq44O844Oe44O844Kv44OA44Km44Oz44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVRlc3RTdW1tYXJ5TWFya2Rvd24ocmVwb3J0czogVGVzdFJlcG9ydFtdKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IG1hcmtkb3duID0gYCMgJHt0aGlzLmNvbmZpZy5wcm9qZWN0TmFtZX0g44OG44K544OI44Os44Od44O844OIXFxuXFxuYDtcbiAgICAgICAgbWFya2Rvd24gKz0gYCMjIOacgOaWsOODhuOCueODiOe1kOaenFxcblxcbmA7XG5cbiAgICAgICAgaWYgKHJlcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbGF0ZXN0ID0gcmVwb3J0c1tyZXBvcnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgbWFya2Rvd24gKz0gYCoq5pyA57WC5a6f6KGMKio6ICR7bGF0ZXN0LnRpbWVzdGFtcC50b0xvY2FsZVN0cmluZygnamEtSlAnKX1cXG5gO1xuICAgICAgICAgICAgbWFya2Rvd24gKz0gYCoq5oiQ5Yqf546HKio6ICR7bGF0ZXN0LnN1bW1hcnkub3ZlcmFsbFNjb3JlLnRvRml4ZWQoMSl9JVxcblxcbmA7XG4gICAgICAgIH1cblxuICAgICAgICBtYXJrZG93biArPSBgIyMg44OG44K544OI5bGl5q20XFxuXFxuYDtcbiAgICAgICAgbWFya2Rvd24gKz0gYHwg5a6f6KGMSUQgfCDml6XmmYIgfCDnkrDlooMgfCDmiJDlip/njocgfCDoqbPntLAgfFxcbmA7XG4gICAgICAgIG1hcmtkb3duICs9IGB8LS0tLS0tLS18LS0tLS0tfC0tLS0tLXwtLS0tLS0tLXwtLS0tLS18XFxuYDtcblxuICAgICAgICBmb3IgKGNvbnN0IHJlcG9ydCBvZiByZXBvcnRzKSB7XG4gICAgICAgICAgICBtYXJrZG93biArPSBgfCAke3JlcG9ydC50ZXN0UnVuSWR9IHwgJHtyZXBvcnQudGltZXN0YW1wLnRvTG9jYWxlRGF0ZVN0cmluZygnamEtSlAnKX0gfCAke3JlcG9ydC5lbnZpcm9ubWVudH0gfCAke3JlcG9ydC5zdW1tYXJ5Lm92ZXJhbGxTY29yZS50b0ZpeGVkKDEpfSUgfCBb6Kmz57SwXSguL3Rlc3QtcmVwb3J0LSR7cmVwb3J0LnRlc3RSdW5JZH0ubWQpIHxcXG5gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hcmtkb3duO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmBi+eUqOOCrOOCpOODieOBrueUn+aIkFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBnZW5lcmF0ZU9wZXJhdGlvbmFsR3VpZGVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zb2xlLmxvZygnICAg8J+TliDpgYvnlKjjgqzjgqTjg4njgpLnlJ/miJDkuK0uLi4nKTtcblxuICAgICAgICBjb25zdCBndWlkZXMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6ICdkZXBsb3ltZW50LWd1aWRlLm1kJyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ+ODh+ODl+ODreOCpOODoeODs+ODiOOCrOOCpOODiScsXG4gICAgICAgICAgICAgICAgY29udGVudDogdGhpcy5nZW5lcmF0ZURlcGxveW1lbnRHdWlkZSgpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiAnbW9uaXRvcmluZy1ndWlkZS5tZCcsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfnm6PoppbjgqzjgqTjg4knLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHRoaXMuZ2VuZXJhdGVNb25pdG9yaW5nR3VpZGUoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogJ3Ryb3VibGVzaG9vdGluZy1ndWlkZS5tZCcsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4knLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHRoaXMuZ2VuZXJhdGVUcm91Ymxlc2hvb3RpbmdHdWlkZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBndWlkZSBvZiBndWlkZXMpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMud3JpdGVGaWxlKGBvcGVyYXRpb25zLyR7Z3VpZGUuZmlsZW5hbWV9YCwgZ3VpZGUuY29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhgICAg4pyFIOmBi+eUqOOCrOOCpOODieeUn+aIkOWujOS6hiAoJHtndWlkZXMubGVuZ3RofeODleOCoeOCpOODqylgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjg4fjg5fjg63jgqTjg6Hjg7Pjg4jjgqzjgqTjg4njga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlRGVwbG95bWVudEd1aWRlKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgIyAke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfSDjg4fjg5fjg63jgqTjg6Hjg7Pjg4jjgqzjgqTjg4lcblxuIyMg5YmN5o+Q5p2h5Lu2XG5cbi0gTm9kZS5qcyAyMC545Lul5LiKXG4tIEFXUyBDTEnoqK3lrprmuIjjgb9cbi0gQVdTIENESyB2MuOCpOODs+OCueODiOODvOODq+a4iOOBv1xuXG4jIyDjg4fjg5fjg63jgqTmiYvpoIZcblxuIyMjIDEuIOS+neWtmOmWouS/guOBruOCpOODs+OCueODiOODvOODq1xuXG5cXGBcXGBcXGBiYXNoXG5ucG0gaW5zdGFsbFxuXFxgXFxgXFxgXG5cbiMjIyAyLiBDREvjg5bjg7zjg4jjgrnjg4jjg6njg4Pjg5dcblxuXFxgXFxgXFxgYmFzaFxubnB4IGNkayBib290c3RyYXBcblxcYFxcYFxcYFxuXG4jIyMgMy4g44K544K/44OD44Kv44Gu44OH44OX44Ot44KkXG5cblxcYFxcYFxcYGJhc2hcbiMg6ZaL55m655Kw5aKDXG5ucHggY2RrIGRlcGxveSAtLWFsbCAtYyBlbnZpcm9ubWVudD1kZXZcblxuIyDmnKznlarnkrDlooNcbm5weCBjZGsgZGVwbG95IC0tYWxsIC1jIGVudmlyb25tZW50PXByb2RcblxcYFxcYFxcYFxuXG4jIyDoqK3lrprpoIXnm65cblxufCDpoIXnm64gfCDoqqzmmI4gfCDjg4fjg5Xjgqnjg6vjg4jlgKQgfFxufC0tLS0tLXwtLS0tLS18LS0tLS0tLS0tLS0tLXxcbnwgcHJvamVjdE5hbWUgfCDjg5fjg63jgrjjgqfjgq/jg4jlkI0gfCByYWctc3lzdGVtIHxcbnwgZW52aXJvbm1lbnQgfCDnkrDlooPlkI0gfCBkZXYgfFxufCByZWdpb24gfCBBV1Pjg6rjg7zjgrjjg6fjg7MgfCBhcC1ub3J0aGVhc3QtMSB8XG5cbiMjIOODiOODqeODluODq+OCt+ODpeODvOODhuOCo+ODs+OCsFxuXG4jIyMg44KI44GP44GC44KL5ZWP6aGMXG5cbjEuICoqQ0RL44OW44O844OI44K544OI44Op44OD44OX44Ko44Op44O8KipcbiAgIC0gQVdT6KqN6Ki85oOF5aCx44KS56K66KqN44GX44Gm44GP44Gg44GV44GEXG4gICAtIOmBqeWIh+OBquaoqemZkOOBjOOBguOCi+OBk+OBqOOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhFxuXG4yLiAqKuODh+ODl+ODreOCpOOCv+OCpOODoOOCouOCpuODiCoqXG4gICAtIENsb3VkRm9ybWF0aW9u44Kz44Oz44K944O844Or44Gn44K544K/44OD44Kv44Gu54q25oWL44KS56K66KqN44GX44Gm44GP44Gg44GV44GEXG4gICAtIOW/heimgeOBq+W/nOOBmOOBpuODreODvOODq+ODkOODg+OCr+OBl+OBpuOBj+OBoOOBleOBhFxuYDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnm6PoppbjgqzjgqTjg4njga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlTW9uaXRvcmluZ0d1aWRlKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgIyAke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfSDnm6PoppbjgqzjgqTjg4lcblxuIyMg55uj6KaW6aCF55uuXG5cbiMjIyBMYW1iZGHplqLmlbBcbi0g5a6f6KGM5pmC6ZaTXG4tIOOCqOODqeODvOeOh1xuLSDlkIzmmYLlrp/ooYzmlbBcblxuIyMjIER5bmFtb0RCXG4tIOiqreOBv+WPluOCii/mm7jjgY3ovrzjgb/lrrnph49cbi0g44K544Ot44OD44OI44Oq44Oz44KwXG4tIOOCqOODqeODvOeOh1xuXG4jIyMgT3BlblNlYXJjaFxuLSDjgq/jg6njgrnjgr/jg7znirbmhYtcbi0g5qSc57Si44Os44K544Od44Oz44K55pmC6ZaTXG4tIOOCpOODs+ODh+ODg+OCr+OCueOCteOCpOOCulxuXG4jIyDjgqLjg6njg7zjg4joqK3lrppcblxuIyMjIOmHjeimgeW6pjogQ3JpdGljYWxcbi0gTGFtYmRh6Zai5pWw44Ko44Op44O8546HID4gNSVcbi0gRHluYW1vRELjgrnjg63jg4Pjg4jjg6rjg7PjgrDnmbrnlJ9cbi0gT3BlblNlYXJjaOOCr+ODqeOCueOCv+ODvOeVsOW4uFxuXG4jIyMg6YeN6KaB5bqmOiBXYXJuaW5nXG4tIExhbWJkYeWun+ihjOaZgumWkyA+IDEw56eSXG4tIER5bmFtb0RC5a656YeP5L2/55So546HID4gODAlXG5cbiMjIOODgOODg+OCt+ODpeODnOODvOODiVxuXG5DbG91ZFdhdGNo44OA44OD44K344Ol44Oc44O844OJ44Gn5Lul5LiL44Gu44Oh44OI44Oq44Kv44K544KS55uj6KaW77yaXG5cbjEuIOOCt+OCueODhuODoOWFqOS9k+OBruWBpeWFqOaAp1xuMi4g44OR44OV44Kp44O844Oe44Oz44K544Oh44OI44Oq44Kv44K5XG4zLiDjgqjjg6njg7znjofjgajjg6zjgrnjg53jg7PjgrnmmYLplpNcbmA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog44OI44Op44OW44Or44K344Ol44O844OG44Kj44Oz44Kw44Ks44Kk44OJ44Gu55Sf5oiQXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVRyb3VibGVzaG9vdGluZ0d1aWRlKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgIyAke3RoaXMuY29uZmlnLnByb2plY3ROYW1lfSDjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrDjgqzjgqTjg4lcblxuIyMg44KI44GP44GC44KL5ZWP6aGM44Go6Kej5rG65pa55rOVXG5cbiMjIyAxLiDoqo3oqLzjgqjjg6njg7xcblxuKirnl4fnirYqKjog44Ot44Kw44Kk44Oz44Gn44GN44Gq44GE44CB6KqN6Ki844OI44O844Kv44Oz44GM54Sh5Yq5XG5cbioq5Y6f5ZugKio6XG4tIENvZ25pdG/jg6bjg7zjgrbjg7zjg5fjg7zjg6vjga7oqK3lrprllY/poYxcbi0gSldU44OI44O844Kv44Oz44Gu5pyf6ZmQ5YiH44KMXG5cbioq6Kej5rG65pa55rOVKio6XG4xLiBDb2duaXRv44Kz44Oz44K944O844Or44Gn44Om44O844K244O854q25oWL44KS56K66KqNXG4yLiDjg4jjg7zjgq/jg7Pjga7mnInlirnmnJ/pmZDjgpLnorroqo1cbjMuIOW/heimgeOBq+W/nOOBmOOBpuODiOODvOOCr+ODs+OCkuWGjeeZuuihjFxuXG4jIyMgMi4g5qSc57Si57WQ5p6c44GM6KGo56S644GV44KM44Gq44GEXG5cbioq55eH54q2Kio6IOODgeODo+ODg+ODiOOBp+izquWVj+OBl+OBpuOCguWbnuetlOOBjOi/lOOBo+OBpuOBk+OBquOBhFxuXG4qKuWOn+WboCoqOlxuLSBPcGVuU2VhcmNo44Kk44Oz44OH44OD44Kv44K544GM56m6XG4tIOODmeOCr+ODiOODq+Wfi+OCgei+vOOBv+OBruWVj+mhjFxuLSBCZWRyb2NrIEFQSeOBruWItumZkFxuXG4qKuino+axuuaWueazlSoqOlxuMS4gT3BlblNlYXJjaOOCs+ODs+OCveODvOODq+OBp+OCpOODs+ODh+ODg+OCr+OCueOCkueiuuiqjVxuMi4g44OJ44Kt44Ol44Oh44Oz44OI44Gu5YaN44Kk44Oz44OH44OD44Kv44K5XG4zLiBCZWRyb2NrIEFQSeOBruWItumZkOOCkueiuuiqjVxuXG4jIyMgMy4g44OR44OV44Kp44O844Oe44Oz44K55ZWP6aGMXG5cbioq55eH54q2Kio6IOODrOOCueODneODs+OCueOBjOmBheOBhFxuXG4qKuWOn+WboCoqOlxuLSBMYW1iZGHplqLmlbDjga7jgrPjg7zjg6vjg4njgrnjgr/jg7zjg4hcbi0gRHluYW1vRELjga7lrrnph4/kuI3otrNcbi0gT3BlblNlYXJjaOOBruaAp+iDveWVj+mhjFxuXG4qKuino+axuuaWueazlSoqOlxuMS4gTGFtYmRh6Zai5pWw44Gu44Km44Kp44O844Og44Ki44OD44OXXG4yLiBEeW5hbW9EQuOBruWuuemHj+ioreWumuimi+ebtOOBl1xuMy4gT3BlblNlYXJjaOOBruOCpOODs+OCueOCv+ODs+OCueOCv+OCpOODl+WkieabtFxuXG4jIyDjg63jgrDjga7norroqo3mlrnms5VcblxuIyMjIENsb3VkV2F0Y2ggTG9nc1xuLSBMYW1iZGHplqLmlbDjga7jg63jgrA6IFxcYC9hd3MvbGFtYmRhL1tmdW5jdGlvbi1uYW1lXVxcYFxuLSBBUEkgR2F0ZXdheeOBruODreOCsDogXFxgL2F3cy9hcGlnYXRld2F5L1thcGktaWRdXFxgXG5cbiMjIyBYLVJheSDjg4jjg6zjg7zjgrlcbi0g44Oq44Kv44Ko44K544OI44Gu6Kmz57Sw44Gq6L+96LehXG4tIOODkeODleOCqeODvOODnuODs+OCueODnOODiOODq+ODjeODg+OCr+OBrueJueWumlxuYDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDjgqTjg7Pjg4fjg4Pjgq/jgrnjg5rjg7zjgrjjga7nlJ/miJBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZ2VuZXJhdGVJbmRleFBhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGluZGV4Q29udGVudCA9IGAjICR7dGhpcy5jb25maWcucHJvamVjdE5hbWV9IOODieOCreODpeODoeODs+ODiFxuXG7jg5Djg7zjgrjjg6fjg7M6ICR7dGhpcy5jb25maWcudmVyc2lvbn1cblxuIyMg55uu5qyhXG5cbiMjIyBBUEnku5Xmp5hcbi0gW0FQSeS7leanmOabuF0oLi9hcGkvUkVBRE1FLm1kKVxuLSBbT3BlbkFQSeS7leanmF0oLi9hcGkvb3BlbmFwaS5qc29uKVxuXG4jIyMg44Ki44O844Kt44OG44Kv44OB44OjXG4tIFvjgrfjgrnjg4bjg6DjgqLjg7zjgq3jg4bjgq/jg4Hjg6NdKC4vYXJjaGl0ZWN0dXJlL1JFQURNRS5tZClcbi0gW+OCouODvOOCreODhuOCr+ODgeODo+Wbs10oLi9hcmNoaXRlY3R1cmUvYXJjaGl0ZWN0dXJlLm1tZClcblxuIyMjIOODhuOCueODiFxuLSBb44OG44K544OI44Os44Od44O844OIXSguL3Rlc3RzL1JFQURNRS5tZClcblxuIyMjIOmBi+eUqFxuLSBb44OH44OX44Ot44Kk44Oh44Oz44OI44Ks44Kk44OJXSguL29wZXJhdGlvbnMvZGVwbG95bWVudC1ndWlkZS5tZClcbi0gW+ebo+imluOCrOOCpOODiV0oLi9vcGVyYXRpb25zL21vbml0b3JpbmctZ3VpZGUubWQpXG4tIFvjg4jjg6njg5bjg6vjgrfjg6Xjg7zjg4bjgqPjg7PjgrBdKC4vb3BlcmF0aW9ucy90cm91Ymxlc2hvb3RpbmctZ3VpZGUubWQpXG5cbiMjIOeUn+aIkOaXpeaZglxuJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCdqYS1KUCcpfVxuYDtcblxuICAgICAgICBhd2FpdCB0aGlzLndyaXRlRmlsZSgnUkVBRE1FLm1kJywgaW5kZXhDb250ZW50KTtcbiAgICB9XG59XG5cbi8vIENMSeWun+ihjOeUqOOBruODoeOCpOODs+mWouaVsFxuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcbiAgICBjb25zdCBjb25maWc6IERvY3VtZW50YXRpb25Db25maWcgPSB7XG4gICAgICAgIHByb2plY3ROYW1lOiAnUGVybWlzc2lvbi1hd2FyZSBSQUcgU3lzdGVtJyxcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICAgICAgb3V0cHV0RGlyZWN0b3J5OiAnLi9nZW5lcmF0ZWQtZG9jcycsXG4gICAgICAgIGdlbmVyYXRlQXBpRG9jczogdHJ1ZSxcbiAgICAgICAgZ2VuZXJhdGVBcmNoaXRlY3R1cmVEaWFncmFtczogdHJ1ZSxcbiAgICAgICAgZ2VuZXJhdGVUZXN0UmVwb3J0czogdHJ1ZSxcbiAgICAgICAgZ2VuZXJhdGVPcGVyYXRpb25hbEd1aWRlczogdHJ1ZSxcbiAgICAgICAgaW5jbHVkZUNvZGVFeGFtcGxlczogdHJ1ZSxcbiAgICAgICAgaW5jbHVkZVNjcmVlbnNob3RzOiBmYWxzZSxcbiAgICAgICAgZm9ybWF0czogWydtYXJrZG93bicsICdodG1sJ11cbiAgICB9O1xuXG4gICAgY29uc3QgZ2VuZXJhdG9yID0gbmV3IERvY3VtZW50YXRpb25HZW5lcmF0b3IoY29uZmlnKTtcblxuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGdlbmVyYXRvci5nZW5lcmF0ZUFsbERvY3VtZW50YXRpb24oKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+ODieOCreODpeODoeODs+ODiOeUn+aIkOOBq+WkseaVl+OBl+OBvuOBl+OBnzonLCBlcnJvcik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbi8vIOOCueOCr+ODquODl+ODiOOBqOOBl+OBpuebtOaOpeWun+ihjOOBleOCjOOBn+WgtOWQiOOBruOBv21haW7plqLmlbDjgpLlkbzjgbPlh7rjgZdcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICAgIG1haW4oKTtcbn0iXX0=