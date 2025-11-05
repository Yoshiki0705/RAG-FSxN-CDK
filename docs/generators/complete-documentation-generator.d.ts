#!/usr/bin/env node
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
    languages: ('ja' | 'en')[];
}
/**
 * デフォルト設定の定義
 */
export declare const DEFAULT_DOCUMENTATION_CONFIG: Partial<DocumentationConfig>;
/**
 * 設定のマージ関数
 */
export declare function mergeDocumentationConfig(userConfig: Partial<DocumentationConfig> & {
    projectName: string;
}): DocumentationConfig;
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
/**
 * アーキテクチャコンポーネントの型定義
 */
export interface ArchitectureComponent {
    id: string;
    name: string;
    type: 'cdn' | 'api' | 'compute' | 'database' | 'search' | 'storage' | 'ai';
    description: string;
}
/**
 * アーキテクチャ接続の型定義
 */
export interface ArchitectureConnection {
    from: string;
    to: string;
}
/**
 * アーキテクチャデータの型定義
 */
export interface ArchitectureData {
    title: string;
    components: ArchitectureComponent[];
    connections: ArchitectureConnection[];
}
/**
 * 完全なドキュメント生成システムの実装クラス
 */
export declare class CompleteDocumentationGenerator {
    private readonly config;
    private readonly startTime;
    constructor(config: DocumentationConfig);
    /**
     * 全ドキュメントの生成（メイン処理）
     */
    generateAllDocumentation(): Promise<void>;
    /**
     * 設定値の検証（セキュリティ対策）
     */
    private validateConfiguration;
    /**
     * 出力ディレクトリの準備
     */
    private ensureOutputDirectory;
    /**
     * APIドキュメントの生成
     */
    private generateApiDocumentation;
    /**
     * アーキテクチャ図の生成
     */
    private generateArchitectureDiagrams;
    /**
     * テストレポートの生成
     */
    private generateTestReports;
    /**
     * 運用ガイドの生成
     */
    private generateOperationalGuides;
    /**
     * 統合インデックスの生成
     */
    private generateMasterIndex;
    /**
     * ファイル書き込み（安全性確保）
     */
    private writeFile;
    private generateOpenApiSpec;
    private generateApiMarkdown;
    private generateMermaidDiagram;
    private generateTestReport;
    private generateOperationalGuide;
}
export declare class CompleteDocumentationGenerator {
    protected config: DocumentationConfig;
    protected projectRoot: string;
    protected systemName: string;
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
     * 言語別ドキュメント生成
     */
    private generateDocumentationForLanguage;
    /**
      * APIドキュメントの生成
      */
    private generateApiDocumentation;
    /**
     * アーキテクチャ図の生成
     */
    private generateArchitectureDiagrams;
    /**
     * テストレポートの生成
     */
    private generateTestReports;
    /**
     * 運用ガイドの生成
     */
    private generateOperationalGuides;
    /**
         * OpenAPI仕様の生成
         */
    private generateOpenApiSpec;
    /**
     * OpenAPIパスの構築
     */
    private buildOpenApiPaths;
    /**
         * API Markdownドキュメントの生成
         */
    private generateApiMarkdown;
    /**
     * アーキテクチャデータの取得
     */
    private getArchitectureData;
    /**
     * Mermaid図の生成
     */
    private generateMermaidDiagram;
    /**
     * アーキテクチャドキュメントの生成
     */
    private generateArchitectureDocument; /**

     * テスト結果の収集
     */
    private collectTestResults;
    /**
     * テストサマリーレポートの生成
     */
    private generateTestSummaryReport;
    /**
     * 詳細テストレポートの生成
     */
    private generateDetailedTestReport;
    /**
     * カバレッジレポートの生成
     */
    private generateCoverageReport;
}
