#!/usr/bin/env node
/**
 * ドキュメント自動生成システム
 * APIドキュメント、アーキテクチャ図、テストレポートの自動生成
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
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
export declare class DocumentationGenerator {
    protected config: DocumentationConfig;
    protected projectRoot: string;
    constructor(config: DocumentationConfig);
    /**
     * 全ドキュメントの生成
     */
    generateAllDocumentation(): Promise<void>;
    /**
     * 出力ディレクトリの確保
     */
    private ensureOutputDirectory;
    /**
     * パスの検証と解決（セキュリティ対策強化版）
     */
    private validateAndResolvePath;
    /**
     * APIドキュメントの生成
     */
    private generateApiDocumentation;
    /**
     * OpenAPI仕様の生成と書き込み
     */
    private generateAndWriteOpenApiSpec;
    /**
     * APIマークダウンの生成と書き込み
     */
    private generateAndWriteApiMarkdown;
    /**
     * API HTMLの生成と書き込み
     */
    private generateAndWriteApiHtml;
    /**
     * API エンドポイントの収集
     */
    private collectApiEndpoints;
    /**
     * Lambda関数からAPIエンドポイントを抽出
     */
    private scanLambdaFunction;
    /**
     * パスからエンドポイント情報を生成
     */
    private createEndpointFromPath;
    /**
     * 関数名からHTTPメソッドを推測
     */
    private inferMethodFromFunction;
    /**
     * パスからタグを推測
     */
    private inferTagFromPath;
    /**
     * サンプルエンドポイントの取得
     */
    private getSampleEndpoints;
    /**
     * OpenAPI仕様の生成
     */
    private generateOpenApiSpec;
    /**
     * Mermaid図の生成と書き込み
     */
    private generateAndWriteMermaidDiagram;
    /**
     * アーキテクチャマークダウンの生成と書き込み
     */
    private generateAndWriteArchitectureMarkdown;
    /**
     * ノード形状の取得
     */
    private getNodeShape;
    /**
     * エンドポイントをタグ別にグループ化
     */
    private groupEndpointsByTag;
    /**
     * Mermaidの図形を取得
     */
    private getMermaidShape;
    /**
     * テストレポートの生成
     */
    protected generateTestReports(): Promise<void>;
    /**
     * テストレポートの収集
     */
    private collectTestReports;
    /**
     * テストレポートマークダウンの生成
     */
    private generateTestReportMarkdown;
    /**
     * テストサマリーマークダウンの生成
     */
    private generateTestSummaryMarkdown;
    /**
     * 運用ガイドの生成
     */
    protected generateOperationalGuides(): Promise<void>;
    /**
     * デプロイメントガイドの生成
     */
    private generateDeploymentGuide;
    /**
     * 監視ガイドの生成
     */
    private generateMonitoringGuide;
    /**
     * トラブルシューティングガイドの生成
     */
    private generateTroubleshootingGuide;
    /**
     * インデックスページの生成
     */
    protected generateIndexPage(): Promise<void>;
}
