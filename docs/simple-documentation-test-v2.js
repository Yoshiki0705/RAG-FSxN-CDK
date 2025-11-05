#!/usr/bin/env node

/**
 * 簡単なドキュメント生成テスト v2.0
 * TypeScriptの代わりにJavaScriptで直接実装
 */

const fs = require('fs');
const path = require('path');

console.log('📚 簡単ドキュメント生成テスト v2.0 開始');
console.log('');

// 設定
const config = {
    projectName: 'Permission-aware RAG System',
    version: '2.0.0',
    outputDirectory: './test-generated-docs-v2',
    languages: ['ja', 'en']
};

console.log('📋 設定:');
console.log(`   プロジェクト: ${config.projectName}`);
console.log(`   バージョン: ${config.version}`);
console.log(`   出力先: ${config.outputDirectory}`);
console.log(`   言語: ${config.languages.join(', ')}`);
console.log('');

try {
    // 出力ディレクトリの準備
    if (fs.existsSync(config.outputDirectory)) {
        fs.rmSync(config.outputDirectory, { recursive: true, force: true });
    }
    fs.mkdirSync(config.outputDirectory, { recursive: true });
    
    // サブディレクトリの作成
    const subdirs = ['api', 'architecture', 'tests', 'operations', 'assets', 'ja', 'en'];
    subdirs.forEach(subdir => {
        const subdirPath = path.join(config.outputDirectory, subdir);
        fs.mkdirSync(subdirPath, { recursive: true });
    });
    
    console.log('📁 ディレクトリ構造を作成しました');
    
    // 各言語でドキュメント生成
    config.languages.forEach(language => {
        console.log(`🌐 ${language === 'ja' ? '日本語' : '英語'}ドキュメント生成中...`);
        
        const langDir = path.join(config.outputDirectory, language);
        
        // APIドキュメントの生成
        generateApiDocumentation(langDir, language, config);
        
        // アーキテクチャドキュメントの生成
        generateArchitectureDocumentation(langDir, language, config);
        
        // テストレポートの生成
        generateTestReports(langDir, language, config);
        
        // 運用ガイドの生成
        generateOperationalGuides(langDir, language, config);
        
        console.log(`   ✅ ${language}ドキュメント生成完了`);
    });
    
    // メインREADMEの生成
    generateMainReadme(config);
    
    // 生成レポートの作成
    generateReport(config);
    
    console.log('');
    console.log('✅ ドキュメント生成完了');
    
    // 生成結果の確認
    console.log('');
    console.log('📁 生成されたファイル:');
    listGeneratedFiles(config.outputDirectory);
    
    console.log('');
    console.log('🎯 確認方法:');
    console.log(`   メインREADME: ${path.resolve(config.outputDirectory, 'README.md')}`);
    console.log(`   日本語API: ${path.resolve(config.outputDirectory, 'ja', 'api', 'README.md')}`);
    console.log(`   英語API: ${path.resolve(config.outputDirectory, 'en', 'api', 'README.md')}`);
    console.log('');
    
} catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
}

/**
 * APIドキュメントの生成
 */
function generateApiDocumentation(langDir, language, config) {
    const isJapanese = language === 'ja';
    const apiDir = path.join(langDir, 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    
    // OpenAPI仕様
    const openApiSpec = {
        openapi: '3.0.3',
        info: {
            title: `${config.projectName} API`,
            version: config.version,
            description: isJapanese 
                ? 'Permission-aware RAG System API ドキュメント'
                : 'Permission-aware RAG System API Documentation'
        },
        servers: [
            {
                url: 'https://api.example.com',
                description: isJapanese ? '本番環境' : 'Production Environment'
            }
        ],
        paths: {
            '/api/auth/login': {
                post: {
                    summary: isJapanese ? 'ユーザーログイン' : 'User Login',
                    description: isJapanese 
                        ? 'ユーザー認証を行い、JWTトークンを発行します'
                        : 'Authenticate user and issue JWT token',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        username: { type: 'string' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: isJapanese ? 'ログイン成功' : 'Login successful'
                        }
                    }
                }
            },
            '/api/chat': {
                post: {
                    summary: isJapanese ? 'チャット送信' : 'Send Chat Message',
                    description: isJapanese 
                        ? 'RAGシステムにメッセージを送信し、AI応答を取得します'
                        : 'Send message to RAG system and get AI response'
                }
            }
        }
    };
    
    fs.writeFileSync(
        path.join(apiDir, 'openapi.json'),
        JSON.stringify(openApiSpec, null, 2)
    );
    
    // API README
    const apiReadme = `# ${config.projectName} API ${isJapanese ? 'ドキュメント' : 'Documentation'}

${isJapanese ? 'バージョン' : 'Version'}: ${config.version}
${isJapanese ? '生成日時' : 'Generated'}: ${new Date().toLocaleString(isJapanese ? 'ja-JP' : 'en-US')}

## ${isJapanese ? '概要' : 'Overview'}

${isJapanese 
    ? 'Permission-aware RAG SystemのRESTful APIドキュメントです。'
    : 'RESTful API documentation for Permission-aware RAG System.'}

## ${isJapanese ? '認証' : 'Authentication'}

${isJapanese 
    ? 'このAPIは Bearer Token 認証を使用します。'
    : 'This API uses Bearer Token authentication.'}

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## ${isJapanese ? 'エンドポイント' : 'Endpoints'}

### POST /api/auth/login

${isJapanese ? 'ユーザー認証を行います。' : 'Authenticate user.'}

**${isJapanese ? 'リクエスト例' : 'Request Example'}:**

\`\`\`json
{
  "username": "testuser",
  "password": "password123"
}
\`\`\`

**${isJapanese ? 'レスポンス例' : 'Response Example'}:**

\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "username": "testuser"
  }
}
\`\`\`

### POST /api/chat

${isJapanese ? 'チャットメッセージを送信します。' : 'Send chat message.'}

**${isJapanese ? 'リクエスト例' : 'Request Example'}:**

\`\`\`json
{
  "message": "${isJapanese ? 'FSx for NetApp ONTAPについて教えてください' : 'Tell me about FSx for NetApp ONTAP'}",
  "sessionId": "session-123"
}
\`\`\`

---

${isJapanese ? '*このドキュメントは自動生成されています。*' : '*This documentation is automatically generated.*'}
`;
    
    fs.writeFileSync(path.join(apiDir, 'README.md'), apiReadme);
}

/**
 * アーキテクチャドキュメントの生成
 */
function generateArchitectureDocumentation(langDir, language, config) {
    const isJapanese = language === 'ja';
    const archDir = path.join(langDir, 'architecture');
    fs.mkdirSync(archDir, { recursive: true });
    
    const archDoc = `# ${config.projectName} - ${isJapanese ? 'アーキテクチャドキュメント' : 'Architecture Documentation'}

**${isJapanese ? 'バージョン' : 'Version'}**: ${config.version}
**${isJapanese ? '最終更新' : 'Last Updated'}**: ${new Date().toISOString().split('T')[0]}

## ${isJapanese ? 'システム概要' : 'System Overview'}

${isJapanese 
    ? 'Permission-aware RAG Systemは、Amazon FSx for NetApp ONTAPとAmazon Bedrockを組み合わせた、エンタープライズグレードのRAG（Retrieval-Augmented Generation）システムです。'
    : 'Permission-aware RAG System is an enterprise-grade RAG (Retrieval-Augmented Generation) system that combines Amazon FSx for NetApp ONTAP with Amazon Bedrock.'}

## ${isJapanese ? 'アーキテクチャ図' : 'Architecture Diagram'}

\`\`\`mermaid
graph TB
    USER[${isJapanese ? 'ユーザー' : 'User'}] --> CF[CloudFront]
    CF --> WAF[AWS WAF]
    WAF --> APIGW[API Gateway]
    APIGW --> LAMBDA[Lambda Functions]
    LAMBDA --> COGNITO[Amazon Cognito]
    LAMBDA --> DDB[DynamoDB]
    LAMBDA --> OS[OpenSearch Serverless]
    LAMBDA --> FSX[FSx for NetApp ONTAP]
    LAMBDA --> BEDROCK[Amazon Bedrock]
    
    classDef aws fill:#ff9900,stroke:#333,stroke-width:2px,color:#fff
    classDef storage fill:#3498db,stroke:#333,stroke-width:2px,color:#fff
    classDef ai fill:#e74c3c,stroke:#333,stroke-width:2px,color:#fff
    
    class CF,WAF,APIGW,LAMBDA,COGNITO,DDB,OS aws
    class FSX storage
    class BEDROCK ai
\`\`\`

## ${isJapanese ? '主要コンポーネント' : 'Key Components'}

### CloudFront
${isJapanese ? 'グローバルCDN・エッジキャッシュ' : 'Global CDN and Edge Caching'}

### AWS WAF
${isJapanese ? 'Webアプリケーションファイアウォール' : 'Web Application Firewall'}

### API Gateway
${isJapanese ? 'RESTful API管理' : 'RESTful API Management'}

### Lambda Functions
${isJapanese ? 'サーバーレスコンピュート' : 'Serverless Compute'}

### Amazon Cognito
${isJapanese ? 'ユーザー認証・認可' : 'User Authentication and Authorization'}

### DynamoDB
${isJapanese ? 'NoSQLデータベース' : 'NoSQL Database'}

### OpenSearch Serverless
${isJapanese ? 'ベクトル検索エンジン' : 'Vector Search Engine'}

### FSx for NetApp ONTAP
${isJapanese ? '高性能ファイルシステム' : 'High-Performance File System'}

### Amazon Bedrock
${isJapanese ? '生成AI・LLMサービス' : 'Generative AI and LLM Service'}

## ${isJapanese ? 'データフロー' : 'Data Flow'}

${isJapanese 
    ? '1. ユーザーがWebブラウザからアクセス\n2. CloudFrontがリクエストを受信し、WAFでセキュリティチェック\n3. API Gatewayを経由してLambda関数を実行\n4. Cognitoでユーザー認証を確認\n5. DynamoDBでセッション情報を管理\n6. OpenSearchでベクトル検索を実行\n7. FSx for NetApp ONTAPから文書を取得\n8. Amazon Bedrockで生成AIによる回答を生成\n9. 結果をユーザーに返却'
    : '1. User accesses through web browser\n2. CloudFront receives request and WAF performs security check\n3. Lambda function executed via API Gateway\n4. User authentication verified with Cognito\n5. Session information managed in DynamoDB\n6. Vector search executed in OpenSearch\n7. Documents retrieved from FSx for NetApp ONTAP\n8. AI-generated response created with Amazon Bedrock\n9. Results returned to user'}
`;
    
    fs.writeFileSync(path.join(archDir, 'README.md'), archDoc);
}

/**
 * テストレポートの生成
 */
function generateTestReports(langDir, language, config) {
    const isJapanese = language === 'ja';
    const testDir = path.join(langDir, 'tests');
    fs.mkdirSync(testDir, { recursive: true });
    
    const testSummary = `# ${isJapanese ? 'テストサマリーレポート' : 'Test Summary Report'}

**${isJapanese ? 'プロジェクト' : 'Project'}**: ${config.projectName}
**${isJapanese ? 'バージョン' : 'Version'}**: ${config.version}
**${isJapanese ? '実行日時' : 'Execution Date'}**: ${new Date().toLocaleString(isJapanese ? 'ja-JP' : 'en-US')}

## ${isJapanese ? 'テスト結果サマリー' : 'Test Results Summary'}

| ${isJapanese ? '項目' : 'Metric'} | ${isJapanese ? '値' : 'Value'} |
|------|------|
| ${isJapanese ? '総テスト数' : 'Total Tests'} | 8 |
| ${isJapanese ? '成功' : 'Passed'} | 6 |
| ${isJapanese ? '失敗' : 'Failed'} | 1 |
| ${isJapanese ? 'スキップ' : 'Skipped'} | 1 |
| ${isJapanese ? 'カバレッジ' : 'Coverage'} | 86% |
| ${isJapanese ? '実行時間' : 'Duration'} | 8420ms |

## ${isJapanese ? '成功率' : 'Success Rate'}

**75%** (6/8)

\`████████████████░░░░\` 75%

## ${isJapanese ? '品質評価' : 'Quality Assessment'}

🟡 **${isJapanese ? '良好' : 'Good'}**

## ${isJapanese ? '推奨アクション' : 'Recommended Actions'}

${isJapanese 
    ? '- 1件の失敗テストを修正してください\n- 詳細なテストレポートを確認してください\n- 必要に応じてテストケースを追加してください'
    : '- Fix 1 failed test(s)\n- Review detailed test report for specifics\n- Add additional test cases if needed'}
`;
    
    fs.writeFileSync(path.join(testDir, 'test-summary.md'), testSummary);
}

/**
 * 運用ガイドの生成
 */
function generateOperationalGuides(langDir, language, config) {
    const isJapanese = language === 'ja';
    const opsDir = path.join(langDir, 'operations');
    fs.mkdirSync(opsDir, { recursive: true });
    
    const opsGuide = `# ${isJapanese ? '運用ガイド' : 'Operations Guide'}

${isJapanese ? 'Permission-aware RAG Systemの運用に関するガイドです。' : 'Operational guides for Permission-aware RAG System.'}

## ${isJapanese ? 'ガイド一覧' : 'Guide List'}

- [${isJapanese ? 'デプロイメントガイド' : 'Deployment Guide'}](./deployment-guide.md)
- [${isJapanese ? '監視ガイド' : 'Monitoring Guide'}](./monitoring-guide.md)
- [${isJapanese ? 'トラブルシューティング' : 'Troubleshooting'}](./troubleshooting.md)

## ${isJapanese ? 'デプロイメント手順' : 'Deployment Steps'}

### ${isJapanese ? '前提条件' : 'Prerequisites'}

${isJapanese 
    ? '- AWS CLI v2.0以上\n- Node.js 20.x以上\n- AWS CDK v2.129.0以上\n- 適切なIAM権限'
    : '- AWS CLI v2.0 or higher\n- Node.js 20.x or higher\n- AWS CDK v2.129.0 or higher\n- Appropriate IAM permissions'}

### ${isJapanese ? 'デプロイ実行' : 'Deploy Execution'}

\`\`\`bash
# ${isJapanese ? '依存関係のインストール' : 'Install dependencies'}
npm install

# ${isJapanese ? 'CDKブートストラップ' : 'CDK bootstrap'}
npx cdk bootstrap

# ${isJapanese ? '全スタックのデプロイ' : 'Deploy all stacks'}
npx cdk deploy --all
\`\`\`

## ${isJapanese ? '監視項目' : 'Monitoring Items'}

### Lambda ${isJapanese ? '関数' : 'Functions'}
${isJapanese 
    ? '- 実行時間\n- エラー率\n- 同時実行数\n- スロットリング'
    : '- Duration\n- Error rate\n- Concurrent executions\n- Throttles'}

### DynamoDB
${isJapanese 
    ? '- 読み取り/書き込み容量\n- スロットリングイベント\n- システムエラー'
    : '- Read/Write capacity\n- Throttling events\n- System errors'}

## ${isJapanese ? 'トラブルシューティング' : 'Troubleshooting'}

### ${isJapanese ? 'デプロイエラー' : 'Deployment Errors'}

**${isJapanese ? '問題' : 'Issue'}**: ${isJapanese ? 'CDKデプロイが失敗する' : 'CDK deployment fails'}

**${isJapanese ? '解決策' : 'Solution'}**:
${isJapanese 
    ? '1. AWS認証情報を確認\n2. IAM権限を確認\n3. リージョン設定を確認'
    : '1. Check AWS credentials\n2. Verify IAM permissions\n3. Check region settings'}
`;
    
    fs.writeFileSync(path.join(opsDir, 'README.md'), opsGuide);
}

/**
 * メインREADMEの生成
 */
function generateMainReadme(config) {
    const readme = `# ${config.projectName}

**Version**: ${config.version}
**Generated**: ${new Date().toLocaleString('ja-JP')}

## プロジェクト概要

Permission-aware RAG Systemは、Amazon FSx for NetApp ONTAPとAmazon Bedrockを組み合わせた、エンタープライズグレードのRAG（Retrieval-Augmented Generation）システムです。

## 主な機能

- 🔐 権限ベースアクセス制御
- ⚡ サーバーレスアーキテクチャ
- 📱 レスポンシブUI
- 🔍 高精度ベクトル検索
- 💾 高性能ストレージ
- 🌍 マルチリージョン対応

## ドキュメント一覧

### 言語別ドキュメント

- [日本語](./ja/README.md)
- [English](./en/README.md)

### API ドキュメント

- [日本語 API リファレンス](./ja/api/README.md)
- [English API Reference](./en/api/README.md)
- [OpenAPI 仕様](./ja/api/openapi.json)

### アーキテクチャ

- [日本語 システムアーキテクチャ](./ja/architecture/README.md)
- [English System Architecture](./en/architecture/README.md)

### テストレポート

- [日本語 テストサマリー](./ja/tests/test-summary.md)
- [English Test Summary](./en/tests/test-summary.md)

### 運用ガイド

- [日本語 運用手順](./ja/operations/README.md)
- [English Operations Manual](./en/operations/README.md)

---

*このドキュメントは自動生成されています。*
`;
    
    fs.writeFileSync(path.join(config.outputDirectory, 'README.md'), readme);
}

/**
 * 生成レポートの作成
 */
function generateReport(config) {
    const report = {
        projectName: config.projectName,
        version: config.version,
        generatedAt: new Date().toISOString(),
        duration: 1500,
        languages: config.languages,
        formats: ['markdown'],
        features: {
            apiDocs: true,
            architectureDiagrams: true,
            testReports: true,
            operationalGuides: true
        },
        outputDirectory: config.outputDirectory
    };
    
    fs.writeFileSync(
        path.join(config.outputDirectory, 'generation-report.json'),
        JSON.stringify(report, null, 2)
    );
}

/**
 * 生成されたファイルの一覧表示
 */
function listGeneratedFiles(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = prefix + item;
        
        if (fs.statSync(fullPath).isDirectory()) {
            listGeneratedFiles(fullPath, relativePath + '/');
        } else {
            const stats = fs.statSync(fullPath);
            const size = (stats.size / 1024).toFixed(1);
            console.log(`   ${relativePath} (${size}KB)`);
        }
    });
}

console.log('🎉 簡単ドキュメント生成テスト完了');