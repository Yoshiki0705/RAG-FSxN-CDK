#!/usr/bin/env node

/**
 * ドキュメント自動生成システム
 * APIドキュメント、アーキテクチャ図、テストレポートの自動生成
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DocumentationConfig {
    projectName: string;
    version: string;
    outputDirectory: string;
    generateApiDocs: boolean;
    generateArchitectureDiagrams: boolean;
    generateTestReports: boolean;
    generateOperationalGuides: boolean;
    includeCodeExamples: boolean;
    includeScreenshots: boolean;
    formats: ('markdown' | 'html' | 'pdf')[];
}

export interface ApiEndpoint {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    summary: string;
    description: string;
    parameters: ApiParameter[];
    requestBody?: ApiRequestBody;
    responses: ApiResponse[];
    tags: string[];
    security?: string[];
}

export interface ApiParameter {
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    required: boolean;
    type: string;
    description: string;
    example?: any;
}

export interface ApiRequestBody {
    description: string;
    contentType: string;
    schema: any;
    example?: any;
}

export interface ApiResponse {
    statusCode: number;
    description: string;
    contentType?: string;
    schema?: any;
    example?: any;
}

export interface ArchitectureComponent {
    id: string;
    name: string;
    type: 'service' | 'database' | 'storage' | 'network' | 'security' | 'monitoring';
    description: string;
    technology: string;
    connections: string[];
    properties: Record<string, any>;
}

export interface TestReport {
    testRunId: string;
    timestamp: Date;
    environment: string;
    summary: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        skippedTests: number;
        overallScore: number;
    };
    suiteResults: TestSuiteReport[];
    recommendations: string[];
}

export interface TestSuiteReport {
    suiteName: string;
    success: boolean;
    score: number;
    duration: number;
    testCount: number;
    details: any;
}

export class DocumentationGenerator {
    protected config: DocumentationConfig;
    protected projectRoot: string;

    constructor(config: DocumentationConfig) {
        this.config = config;
        this.projectRoot = process.cwd();
    }

    /**
     * 全ドキュメントの生成
     */
    async generateAllDocumentation(): Promise<void> {
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

        } catch (error) {
            console.error('❌ ドキュメント生成エラー:', error);
            throw error;
        }
    }

    /**
     * 出力ディレクトリの確保
     */
    private async ensureOutputDirectory(): Promise<void> {
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
    private validateAndResolvePath(inputPath: string): string {
        // 入力値の基本検証
        if (!inputPath || typeof inputPath !== 'string') {
            throw new Error('無効なパスが指定されました');
        }

        // 危険な文字列パターンの検証
        const dangerousPatterns = [
            /\.\./,           // パストラバーサル
            /~/,              // ホームディレクトリ参照
            /\0/,             // ヌル文字
            /[<>:"|?*]/,      // 無効なファイル名文字
            /^\/+/,           // 絶対パス
            /\\+/             // バックスラッシュ
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
    protected async writeFile(relativePath: string, content: string): Promise<void> {
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
    private async generateApiDocumentation(): Promise<void> {
        console.log('   📊 APIエンドポイントを収集中...');
        const apiEndpoints = await this.collectApiEndpoints();

        console.log(`   📝 ${apiEndpoints.length}個のエンドポイントを処理中...`);

        // 並列処理でドキュメント生成を高速化
        const tasks: Promise<void>[] = [];

        // OpenAPI仕様の生成
        tasks.push(
            this.generateAndWriteOpenApiSpec(apiEndpoints)
        );

        // Markdownドキュメントの生成
        tasks.push(
            this.generateAndWriteApiMarkdown(apiEndpoints)
        );

        // HTMLドキュメントの生成（必要な場合のみ）
        if (this.config.formats.includes('html')) {
            tasks.push(
                this.generateAndWriteApiHtml(apiEndpoints)
            );
        }

        // 全ての生成タスクを並列実行
        await Promise.all(tasks);

        console.log(`   ✅ APIドキュメント生成完了 (${apiEndpoints.length}エンドポイント)`);
    }

    /**
     * OpenAPI仕様の生成と書き込み
     */
    private async generateAndWriteOpenApiSpec(apiEndpoints: ApiEndpoint[]): Promise<void> {
        const openApiSpec = this.generateOpenApiSpec(apiEndpoints);
        await this.writeFile('api/openapi.json', JSON.stringify(openApiSpec, null, 2));
    }

    /**
     * APIマークダウンの生成と書き込み
     */
    private async generateAndWriteApiMarkdown(apiEndpoints: ApiEndpoint[]): Promise<void> {
        const apiMarkdown = this.generateApiMarkdown(apiEndpoints);
        await this.writeFile('api/README.md', apiMarkdown);
    }

    /**
     * API HTMLの生成と書き込み
     */
    private async generateAndWriteApiHtml(apiEndpoints: ApiEndpoint[]): Promise<void> {
        const apiHtml = this.generateApiHtml(apiEndpoints);
        await this.writeFile('api/index.html', apiHtml);
    }

    /**
     * API エンドポイントの収集
     */
    private async collectApiEndpoints(): Promise<ApiEndpoint[]> {
        // 実際のコードベースからAPIエンドポイントを自動検出
        const endpoints: ApiEndpoint[] = [];

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
    private async scanLambdaFunction(functionPath: string): Promise<ApiEndpoint[]> {
        const endpoints: ApiEndpoint[] = [];

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
        } catch (error) {
            console.warn(`Lambda関数の解析に失敗: ${functionPath}`, error);
        }

        return endpoints;
    }

    /**
     * パスからエンドポイント情報を生成
     */
    private createEndpointFromPath(apiPath: string, functionPath: string): ApiEndpoint {
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
    private inferMethodFromFunction(functionName: string): 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' {
        if (functionName.includes('get') || functionName.includes('list')) return 'GET';
        if (functionName.includes('create') || functionName.includes('upload')) return 'POST';
        if (functionName.includes('update')) return 'PUT';
        if (functionName.includes('delete')) return 'DELETE';
        return 'POST'; // デフォルト
    }

    /**
     * パスからタグを推測
     */
    private inferTagFromPath(apiPath: string): string {
        if (apiPath.includes('/auth')) return '認証';
        if (apiPath.includes('/chat')) return 'チャット';
        if (apiPath.includes('/document')) return 'ドキュメント';
        if (apiPath.includes('/user')) return 'ユーザー';
        return 'その他';
    }

    /**
     * サンプルエンドポイントの取得
     */
    private getSampleEndpoints(): ApiEndpoint[] {
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
    private generateOpenApiSpec(endpoints: ApiEndpoint[]): any {
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
                }, {} as any),
                security: endpoint.security ? endpoint.security.map(sec => ({ [sec]: [] })) : undefined
            };
        });

        return spec;
    }
    /**
      * API Markdownドキュメントの生成
      */
    private generateApiMarkdown(endpoints: ApiEndpoint[]): string {
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
    private generateApiHtml(endpoints: ApiEndpoint[]): string {
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
            ${[...new Set(endpoints.flatMap(e => e.tags))].map(tag =>
            `<a href="#${tag.toLowerCase()}">${tag}</a>`
        ).join('')}
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
    private async generateArchitectureDiagrams(): Promise<void> {
        console.log('   🏗️ アーキテクチャコンポーネントを収集中...');
        const components = await this.collectArchitectureComponents();

        console.log(`   📊 ${components.length}個のコンポーネントを処理中...`);

        // 並列処理でドキュメント生成を高速化
        const tasks: Promise<void>[] = [];

        // Mermaid図の生成
        tasks.push(
            this.generateAndWriteMermaidDiagram(components)
        );

        // アーキテクチャドキュメントの生成
        tasks.push(
            this.generateAndWriteArchitectureMarkdown(components)
        );

        // 全ての生成タスクを並列実行
        await Promise.all(tasks);

        console.log(`   ✅ アーキテクチャ図生成完了 (${components.length}コンポーネント)`);
    }

    /**
     * Mermaid図の生成と書き込み
     */
    private async generateAndWriteMermaidDiagram(components: ArchitectureComponent[]): Promise<void> {
        const mermaidDiagram = this.generateMermaidDiagram(components);
        await this.writeFile('architecture/system-architecture.md', `# システムアーキテクチャ\n\n\`\`\`mermaid\n${mermaidDiagram}\n\`\`\`\n`);
    }

    /**
     * アーキテクチャマークダウンの生成と書き込み
     */
    private async generateAndWriteArchitectureMarkdown(components: ArchitectureComponent[]): Promise<void> {
        const archMarkdown = this.generateArchitectureMarkdown(components);
        await this.writeFile('architecture/README.md', archMarkdown);

        console.log(`   ✅ アーキテクチャ図生成完了 (${components.length}コンポーネント)`);
    }

    /**
     * アーキテクチャコンポーネントの収集
     */
    private async collectArchitectureComponents(): Promise<ArchitectureComponent[]> {
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
    private generateMermaidDiagram(components: ArchitectureComponent[]): string {
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
    private getNodeShape(type: string): string {
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
    private generateArchitectureMarkdown(components: ArchitectureComponent[]): string {
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
            if (!acc[component.type]) acc[component.type] = [];
            acc[component.type].push(component);
            return acc;
        }, {} as Record<string, ArchitectureComponent[]>);

        const typeNames = {
            service: 'サービス',
            database: 'データベース',
            storage: 'ストレージ',
            network: 'ネットワーク',
            security: 'セキュリティ',
            monitoring: '監視'
        };

        Object.entries(componentsByType).forEach(([type, comps]) => {
            markdown += `## ${typeNames[type as keyof typeof typeNames] || type}\n\n`;

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
    private async writeFile(relativePath: string, content: string): Promise<void> {
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
    private generateApiMarkdown(endpoints: ApiEndpoint[]): string {
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
    private generateApiHtml(endpoints: ApiEndpoint[]): string {
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
    private groupEndpointsByTag(endpoints: ApiEndpoint[]): Record<string, ApiEndpoint[]> {
        const grouped: Record<string, ApiEndpoint[]> = {};

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
    private async generateArchitectureDiagrams(): Promise<void> {
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
    private async collectArchitectureComponents(): Promise<ArchitectureComponent[]> {
        // CDKスタックからコンポーネント情報を抽出
        const components: ArchitectureComponent[] = [
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
    private generateMermaidDiagram(components: ArchitectureComponent[]): string {
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
    private getMermaidShape(type: string): string {
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
    private generateArchitectureMarkdown(components: ArchitectureComponent[]): string {
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
    protected async generateTestReports(): Promise<void> {
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
    private async collectTestReports(): Promise<TestReport[]> {
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
    private generateTestReportMarkdown(report: TestReport): string {
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
    private generateTestSummaryMarkdown(reports: TestReport[]): string {
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
    protected async generateOperationalGuides(): Promise<void> {
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
    private generateDeploymentGuide(): string {
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
    private generateMonitoringGuide(): string {
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
    private generateTroubleshootingGuide(): string {
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
    protected async generateIndexPage(): Promise<void> {
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

// CLI実行用のメイン関数
async function main() {
    const config: DocumentationConfig = {
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
    } catch (error) {
        console.error('ドキュメント生成に失敗しました:', error);
        process.exit(1);
    }
}

// スクリプトとして直接実行された場合のみmain関数を呼び出し
if (require.main === module) {
    main();
}