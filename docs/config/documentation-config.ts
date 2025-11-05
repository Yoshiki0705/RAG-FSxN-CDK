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

export const defaultConfig: DocumentationConfig = {
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

/**
 * 環境別設定
 */
export const environmentConfigs = {
  development: {
    ...defaultConfig,
    projectName: 'RAG System (Development)',
    version: '1.0.0-dev',
    outputDirectory: './dev-docs',
    includeScreenshots: true
  },
  
  staging: {
    ...defaultConfig,
    projectName: 'RAG System (Staging)',
    version: '1.0.0-staging',
    outputDirectory: './staging-docs'
  },
  
  production: {
    ...defaultConfig,
    projectName: 'Permission-aware RAG System',
    version: '1.0.0',
    outputDirectory: './production-docs',
    formats: ['markdown', 'html', 'pdf']
  }
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

export const templateConfig: TemplateConfig = {
  templateDirectory: './docs/templates',
  useCustomTemplates: true,
  theme: 'technical',
  language: 'ja'
};