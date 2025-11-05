/**
 * ドキュメント生成システム設定
 */
export interface DocumentationConfig {
    /** プロジェクト名 */
    projectName: string;
    /** バージョン */
    version: string;
    /** 出力ディレクトリ */
    outputDirectory: string;
    /** API ドキュメント生成フラグ */
    generateApiDocs: boolean;
    /** アーキテクチャ図生成フラグ */
    generateArchitectureDiagrams: boolean;
    /** テストレポート生成フラグ */
    generateTestReports: boolean;
    /** 運用ガイド生成フラグ */
    generateOperationalGuides: boolean;
    /** コード例の含有フラグ */
    includeCodeExamples: boolean;
    /** スクリーンショット含有フラグ */
    includeScreenshots: boolean;
    /** 生成形式 */
    formats: ('markdown' | 'html' | 'pdf')[];
}
export declare const defaultConfig: DocumentationConfig;
/**
 * 環境別設定
 */
export declare const environmentConfigs: {
    development: {
        projectName: string;
        version: string;
        outputDirectory: string;
        includeScreenshots: boolean;
        /** API ドキュメント生成フラグ */
        generateApiDocs: boolean;
        /** アーキテクチャ図生成フラグ */
        generateArchitectureDiagrams: boolean;
        /** テストレポート生成フラグ */
        generateTestReports: boolean;
        /** 運用ガイド生成フラグ */
        generateOperationalGuides: boolean;
        /** コード例の含有フラグ */
        includeCodeExamples: boolean;
        /** 生成形式 */
        formats: ("markdown" | "html" | "pdf")[];
    };
    staging: {
        projectName: string;
        version: string;
        outputDirectory: string;
        /** API ドキュメント生成フラグ */
        generateApiDocs: boolean;
        /** アーキテクチャ図生成フラグ */
        generateArchitectureDiagrams: boolean;
        /** テストレポート生成フラグ */
        generateTestReports: boolean;
        /** 運用ガイド生成フラグ */
        generateOperationalGuides: boolean;
        /** コード例の含有フラグ */
        includeCodeExamples: boolean;
        /** スクリーンショット含有フラグ */
        includeScreenshots: boolean;
        /** 生成形式 */
        formats: ("markdown" | "html" | "pdf")[];
    };
    production: {
        projectName: string;
        version: string;
        outputDirectory: string;
        formats: string[];
        /** API ドキュメント生成フラグ */
        generateApiDocs: boolean;
        /** アーキテクチャ図生成フラグ */
        generateArchitectureDiagrams: boolean;
        /** テストレポート生成フラグ */
        generateTestReports: boolean;
        /** 運用ガイド生成フラグ */
        generateOperationalGuides: boolean;
        /** コード例の含有フラグ */
        includeCodeExamples: boolean;
        /** スクリーンショット含有フラグ */
        includeScreenshots: boolean;
    };
};
/**
 * テンプレート設定
 */
export interface TemplateConfig {
    /** テンプレートディレクトリ */
    templateDirectory: string;
    /** カスタムテンプレート使用フラグ */
    useCustomTemplates: boolean;
    /** テーマ */
    theme: 'default' | 'corporate' | 'technical';
    /** 言語 */
    language: 'ja' | 'en';
}
export declare const templateConfig: TemplateConfig;
