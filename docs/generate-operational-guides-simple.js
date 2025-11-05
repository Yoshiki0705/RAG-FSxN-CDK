#!/usr/bin/env node

/**
 * 運用ガイド生成スクリプト（JavaScript版）
 * Permission-aware RAG System の包括的運用ガイドを生成
 */

const fs = require('fs');
const path = require('path');

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG = {
  SYSTEM_NAME: 'Permission-aware RAG System with FSx for NetApp ONTAP',
  VERSION: '2.0.0',
  MAX_SYSTEM_NAME_LENGTH: 100,
  MIN_SYSTEM_NAME_LENGTH: 5,
  SUPPORTED_FORMATS: ['md', 'html', 'pdf'],
  FILE_ENCODING: 'utf-8',
  DIRECTORY_MODE: 0o755,
  FILE_MODE: 0o644
};

// 運用ガイド生成クラス
class OperationalGuidesGenerator {
  constructor(config = {}) {
    // 設定のマージと検証
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validateConfig();
    
    this.systemName = this.config.SYSTEM_NAME;
    this.version = this.config.VERSION;
    this.lastUpdated = new Date().toISOString().split('T')[0];
  }
  
  /**
   * 設定値の検証
   */
  validateConfig() {
    const { SYSTEM_NAME, VERSION } = this.config;
    
    if (!SYSTEM_NAME || typeof SYSTEM_NAME !== 'string') {
      throw new Error('システム名が設定されていません');
    }
    
    if (SYSTEM_NAME.length < this.config.MIN_SYSTEM_NAME_LENGTH || 
        SYSTEM_NAME.length > this.config.MAX_SYSTEM_NAME_LENGTH) {
      throw new Error(`システム名の長さが不正です（${this.config.MIN_SYSTEM_NAME_LENGTH}-${this.config.MAX_SYSTEM_NAME_LENGTH}文字）`);
    }
    
    if (!VERSION || !/^\d+\.\d+\.\d+$/.test(VERSION)) {
      throw new Error('バージョン形式が不正です（例: 1.0.0）');
    }
  }

  generateTroubleshootingGuide() {
    return `# ${this.systemName} - トラブルシューティングガイド

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 🚨 緊急時対応プロトコル

### レベル1: システム全体停止

#### 症状
- Webサイトが完全にアクセス不可
- 全APIエンドポイントが500エラー
- CloudFrontが503エラーを返す
- ユーザーが一切サービスを利用できない

#### 即座実行手順（5分以内）
\`\`\`bash
# 1. システム状態の緊急確認
aws cloudformation describe-stacks --stack-name rag-system-prod-minimal-integrated
aws cloudformation describe-stacks --stack-name rag-system-prod-minimal-production

# 2. CloudFront状態確認
aws cloudfront get-distribution --id <DISTRIBUTION_ID>

# 3. Lambda関数状態確認
aws lambda list-functions --query 'Functions[?contains(FunctionName, \`rag-system\`)].{Name:FunctionName,State:State}'

# 4. 緊急メンテナンスページ有効化
aws s3 cp maintenance.html s3://rag-system-prod-website/index.html
\`\`\`

#### エスカレーション基準
- **15分以内に復旧しない場合**: レベル2エスカレーション
- **データ損失の可能性**: 即座にレベル3エスカレーション

### レベル2: 主要機能障害

#### チャット機能完全停止

##### 症状
- チャット送信でタイムアウト
- AI応答が一切返らない
- 検索結果が空または500エラー

##### 診断手順
\`\`\`bash
# 1. Bedrock接続確認
aws bedrock-runtime invoke-model \\
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \\
  --body '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}' \\
  --region ap-northeast-1 response.json

# 2. OpenSearch接続確認
curl -X GET "https://your-opensearch-endpoint.ap-northeast-1.es.amazonaws.com/_cluster/health"

# 3. Lambda関数ログ確認
aws logs tail /aws/lambda/rag-system-chat-handler --follow --since 1h
\`\`\`

##### 対処手順
\`\`\`bash
# 1. Lambda関数の強制再起動
aws lambda update-function-configuration \\
  --function-name rag-system-chat-handler \\
  --environment Variables='{FORCE_RESTART=true}'

# 2. OpenSearchインデックス確認・修復
curl -X POST "https://your-opensearch-endpoint/_refresh"
curl -X GET "https://your-opensearch-endpoint/_cat/indices?v"
\`\`\`

## 📊 パフォーマンス問題診断

### 応答時間劣化（>5秒）

#### 自動診断スクリプト
\`\`\`bash
#!/bin/bash
# パフォーマンス診断スクリプト

echo "🔍 パフォーマンス診断開始..."

# Lambda関数の平均実行時間確認
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Duration \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 300 \\
  --statistics Average,Maximum

echo "✅ 診断完了"
\`\`\`

## 📞 エスカレーション連絡先

### 緊急連絡先
- **レベル1**: システム管理者 (24時間対応)
- **レベル2**: 開発チームリーダー
- **レベル3**: アーキテクト・セキュリティ責任者

---

**注意**: このガイドは定期的に更新されます。最新版は常にGitリポジトリで確認してください。
`;
  }

  generateOperationalChecklist() {
    return `# ${this.systemName} - 運用チェックリスト

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 📅 日次運用チェック（毎日 9:00 実行）

### 🔍 システム状態確認（所要時間: 15分）

#### 基本機能確認
- [ ] **Webサイト動作確認**
  - [ ] メインページ読み込み（< 3秒）
  - [ ] ログイン機能動作
  - [ ] チャットインターフェース表示
  - [ ] ファイルアップロード機能

- [ ] **API エンドポイント確認**
  \`\`\`bash
  # ヘルスチェックエンドポイント
  curl -f https://your-domain.com/api/health
  
  # 認証エンドポイント
  curl -f https://your-domain.com/api/auth/status
  \`\`\`

#### パフォーマンス確認
- [ ] **応答時間確認**
  - [ ] Webページ読み込み: < 2秒
  - [ ] API応答時間: < 1秒
  - [ ] チャット応答時間: < 10秒

- [ ] **エラー率確認**
  - [ ] HTTP 5xx エラー率: < 0.1%
  - [ ] Lambda エラー率: < 0.5%

### 🔒 セキュリティ確認（所要時間: 10分）

- [ ] **不正アクセス確認**
  - [ ] WAF ブロック状況確認
  - [ ] 異常なアクセスパターン検出
  - [ ] 失敗ログイン試行回数確認

- [ ] **証明書・設定確認**
  - [ ] SSL証明書有効性（有効期限 > 30日）
  - [ ] セキュリティヘッダー設定

## 📅 週次運用チェック（毎週月曜日 10:00 実行）

### 📈 容量・使用量分析（所要時間: 30分）

#### ストレージ使用量確認
- [ ] **DynamoDB使用量**
  \`\`\`bash
  # テーブルサイズ確認
  aws dynamodb describe-table --table-name rag-system-sessions \\
    --query 'Table.{TableSizeBytes:TableSizeBytes,ItemCount:ItemCount}'
  \`\`\`

- [ ] **Lambda実行統計**
  \`\`\`bash
  # 週次実行統計
  aws cloudwatch get-metric-statistics \\
    --namespace AWS/Lambda \\
    --metric-name Invocations \\
    --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
    --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \\
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
    --period 86400 --statistics Sum
  \`\`\`

### 💰 コスト分析（所要時間: 20分）

- [ ] **週次コストレポート確認**
- [ ] **予算アラート確認**
- [ ] **不要リソース特定**

## 📅 月次運用チェック（毎月1日 14:00 実行）

### 📊 パフォーマンス分析（所要時間: 60分）

- [ ] **月次パフォーマンスレポート作成**
- [ ] **ボトルネック分析**
- [ ] **最適化提案作成**

### 🔐 セキュリティ監査（所要時間: 45分）

- [ ] **IAMロール・ポリシー見直し**
- [ ] **ユーザーアクセス監査**
- [ ] **セキュリティ設定見直し**

## ✅ チェックリスト完了確認

### 日次チェック完了基準
- [ ] 全項目チェック完了
- [ ] 異常項目の対応完了または記録
- [ ] 次回チェック予定確認

---

**注意事項**:
- チェック実行時は必ず結果を記録してください
- 異常を発見した場合は即座にエスカレーションしてください
`;
  }

  generateMonitoringGuide() {
    return `# ${this.systemName} - 監視・アラート設定ガイド

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 📊 監視対象メトリクス

### Lambda 関数監視

#### 重要メトリクス
- **Duration**: 実行時間（目標: < 5秒）
- **Errors**: エラー数（目標: < 1%）
- **Throttles**: スロットリング数（目標: 0）
- **ConcurrentExecutions**: 同時実行数

#### CloudWatch アラーム設定例
\`\`\`bash
# Lambda Duration アラーム
aws cloudwatch put-metric-alarm \\
  --alarm-name "RAG-Lambda-Duration-High" \\
  --alarm-description "Lambda function duration is high" \\
  --metric-name Duration \\
  --namespace AWS/Lambda \\
  --statistic Average \\
  --period 300 \\
  --threshold 5000 \\
  --comparison-operator GreaterThanThreshold \\
  --dimensions Name=FunctionName,Value=rag-system-chat-handler \\
  --evaluation-periods 2
\`\`\`

### DynamoDB 監視

#### 重要メトリクス
- **ConsumedReadCapacityUnits**: 読み込みキャパシティ消費
- **ConsumedWriteCapacityUnits**: 書き込みキャパシティ消費
- **ThrottledRequests**: スロットリングされたリクエスト
- **SystemErrors**: システムエラー

### OpenSearch 監視

#### 重要メトリクス
- **SearchLatency**: 検索レイテンシ（目標: < 1秒）
- **ClusterStatus**: クラスター状態（目標: Green）
- **CPUUtilization**: CPU使用率（目標: < 80%）

## 🔔 アラート通知設定

### アラート重要度レベル

#### Critical (緊急) - 即座対応必要
- **対象**: システム全体停止、データ損失リスク
- **通知先**: SMS + Email + Slack #critical
- **対応時間**: 5分以内に初期対応開始

#### High (高) - 緊急対応必要
- **対象**: 主要機能停止、パフォーマンス大幅低下
- **通知先**: Slack #alerts + Email
- **対応時間**: 30分以内に対応開始

#### Medium (中) - 計画的対応
- **対象**: 軽微な機能障害、容量警告
- **通知先**: Slack #monitoring + Email
- **対応時間**: 4時間以内に確認

## 📈 CloudWatch ダッシュボード設定

### メインダッシュボード構成
- Lambda パフォーマンス監視
- DynamoDB キャパシティ監視
- OpenSearch クラスター監視
- エラー・アラート状況

### ダッシュボード作成スクリプト
\`\`\`bash
#!/bin/bash
# CloudWatch ダッシュボード作成

aws cloudwatch put-dashboard \\
  --dashboard-name "RAG-System-Overview" \\
  --dashboard-body file://dashboard-config.json

echo "✅ ダッシュボード作成完了"
\`\`\`

## 🎯 SLA/SLO 監視

### サービスレベル目標

#### 可用性
- **目標**: 99.9% (月間43分以内のダウンタイム)
- **測定**: ヘルスチェックエンドポイントの成功率

#### パフォーマンス
- **目標**: 95%のリクエストが2秒以内に応答
- **測定**: Lambda Duration メトリクス

#### エラー率
- **目標**: エラー率1%未満
- **測定**: Lambda Errors / Invocations

---

**監視システム運用ガイドライン**:
1. アラートは適切な重要度で分類し、過剰な通知を避ける
2. SLO違反時は必ず根本原因分析を実施する
3. 監視設定は定期的に見直し、ビジネス要件に合わせて調整する
`;
  }

  generateAllOperationalGuides() {
    return {
      'troubleshooting-guide': this.generateTroubleshootingGuide(),
      'operational-checklist': this.generateOperationalChecklist(),
      'monitoring-guide': this.generateMonitoringGuide()
    };
  }

  generateOperationalGuideIndex() {
    return `# ${this.systemName} - 運用ガイド総合目次

**バージョン**: ${this.version}  
**最終更新**: ${this.lastUpdated}

## 📚 運用ガイド一覧

### 🚨 緊急時対応
1. **[トラブルシューティングガイド](./troubleshooting-guide.md)**
   - システム障害の診断・対処手順
   - レベル別対応プロトコル
   - 緊急連絡先・エスカレーション手順

### 📋 日常運用
2. **[運用チェックリスト](./operational-checklist.md)**
   - 日次・週次・月次チェック項目
   - パフォーマンス確認手順
   - セキュリティ監査項目

3. **[監視・アラート設定ガイド](./monitoring-guide.md)**
   - 監視対象メトリクス
   - アラート通知設定
   - ダッシュボード構成

## 🎯 運用レベル別推奨ガイド

### レベル1: 基本運用（必須）
- ✅ 運用チェックリスト
- ✅ トラブルシューティングガイド
- ✅ 監視・アラート設定ガイド

## 📞 緊急時連絡先

### 24時間対応
- **システム障害**: [緊急連絡先]
- **セキュリティインシデント**: [セキュリティチーム]

### 営業時間対応
- **一般的な運用問題**: [運用チーム]
- **パフォーマンス問題**: [技術チーム]

---

**重要**: 
- 各ガイドは相互に関連しています。包括的な理解のため、関連ガイドも併せて参照してください
- 緊急時は該当するガイドに従って迅速に対応してください
`;
  }
}

/**
 * パス検証（セキュリティ対策）
 */
function validatePath(inputPath) {
  // パストラバーサル攻撃防止
  if (inputPath.includes('..') || inputPath.includes('~')) {
    throw new Error('不正なパスが検出されました');
  }
  
  // プロジェクトルート外へのアクセス防止
  const resolvedPath = path.resolve(inputPath);
  const projectRoot = process.cwd();
  
  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error('プロジェクト外のパスアクセスは禁止されています');
  }
  
  return resolvedPath;
}

async function generateOperationalGuides() {
  console.log('🚀 運用ガイド生成開始...');
  
  const generator = new OperationalGuidesGenerator();
  const outputDir = validatePath(path.join(__dirname, 'operations'));
  
  // 出力ディレクトリ作成（セキュアな権限設定）
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true, mode: 0o755 });
  }
  
  try {
    // 全運用ガイド生成
    const guides = generator.generateAllOperationalGuides();
    
    // 各ガイドをファイルに出力（並列処理で高速化）
    const writeFileAsync = (filename, content) => {
      return new Promise((resolve) => {
        try {
          const filePath = path.join(outputDir, `${filename}.md`);
          
          // ファイル名の検証
          if (!/^[a-zA-Z0-9\-_]+$/.test(filename)) {
            throw new Error(`不正なファイル名: ${filename}`);
          }
          
          // コンテンツの検証
          if (!content || typeof content !== 'string') {
            throw new Error(`無効なコンテンツ: ${filename}`);
          }
          
          fs.writeFileSync(filePath, content, { encoding: 'utf-8', mode: 0o644 });
          console.log(`✅ 生成完了: ${filename}.md`);
          resolve({ filename, success: true });
        } catch (error) {
          console.error(`❌ 生成失敗: ${filename}.md - ${error.message}`);
          resolve({ filename, success: false, error: error.message });
        }
      });
    };
    
    // 並列処理でファイル書き込み
    const writePromises = Object.entries(guides).map(([filename, content]) => 
      writeFileAsync(filename, content)
    );
    
    const results = await Promise.all(writePromises);
    
    // 目次ファイル生成（メモリ効率化）
    try {
      const indexContent = generator.generateOperationalGuideIndex();
      const indexPath = path.join(outputDir, 'README.md');
      
      // 大きなファイルの場合はストリーム書き込み
      if (indexContent.length > 1024 * 1024) { // 1MB以上
        const writeStream = fs.createWriteStream(indexPath, { encoding: 'utf-8' });
        writeStream.write(indexContent);
        writeStream.end();
        
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      } else {
        fs.writeFileSync(indexPath, indexContent, { encoding: 'utf-8', mode: 0o644 });
      }
      
      console.log('✅ 目次生成完了: README.md');
    } catch (error) {
      console.error('❌ 目次生成失敗:', error.message);
      throw error;
    }
    
    // 生成サマリー
    console.log('\n📊 運用ガイド生成サマリー:');
    console.log(`   出力ディレクトリ: ${outputDir}`);
    console.log(`   生成ファイル数: ${Object.keys(guides).length + 1}`);
    console.log('   生成されたガイド:');
    
    Object.keys(guides).forEach(filename => {
      console.log(`     - ${filename}.md`);
    });
    console.log('     - README.md (目次)');
    
    // ファイルサイズ情報（エラーハンドリング付き）
    console.log('\n📏 ファイルサイズ情報:');
    const files = [...Object.keys(guides).map(f => `${f}.md`), 'README.md'];
    let totalSize = 0;
    let successCount = 0;
    
    files.forEach(filename => {
      try {
        const filePath = path.join(outputDir, filename);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const sizeKB = Math.round(stats.size / 1024);
          totalSize += stats.size;
          successCount++;
          console.log(`     ${filename}: ${sizeKB} KB`);
        } else {
          console.log(`     ${filename}: ファイルが見つかりません`);
        }
      } catch (error) {
        console.error(`     ${filename}: サイズ取得エラー - ${error.message}`);
      }
    });
    
    console.log(`   総サイズ: ${Math.round(totalSize / 1024)} KB`);
    console.log(`   成功率: ${Math.round((successCount / files.length) * 100)}% (${successCount}/${files.length})`);
    
    // 失敗したファイルがある場合の警告
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('\n⚠️ 生成に失敗したファイル:');
      failedResults.forEach(result => {
        console.log(`     - ${result.filename}: ${result.error}`);
      });
    }
    
    // 使用方法の表示
    console.log('\n🎯 使用方法:');
    console.log('   1. docs/operations/ ディレクトリを確認');
    console.log('   2. README.md から必要なガイドを選択');
    console.log('   3. 各ガイドの手順に従って運用を実施');
    console.log('   4. 定期的にガイドを見直し・更新');
    
    console.log('\n✅ 運用ガイド生成完了！');
    
  } catch (error) {
    console.error('❌ 運用ガイド生成エラー:', error);
    process.exit(1);
  }
}

/**
 * クリーンアップ処理
 */
function cleanup() {
  // 機密情報のクリア
  if (global.gc) {
    global.gc(); // ガベージコレクション実行（可能な場合）
  }
  
  console.log('🧹 クリーンアップ処理完了');
}

/**
 * エラーハンドリング
 */
process.on('uncaughtException', (error) => {
  console.error('❌ 予期しないエラー:', error.message);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ 未処理のPromise拒否:', reason);
  cleanup();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 処理を中断しています...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 プロセスを終了しています...');
  cleanup();
  process.exit(0);
});

// メイン実行
if (require.main === module) {
  generateOperationalGuides().catch(error => {
    console.error('❌ Fatal error:', error);
    cleanup();
    process.exit(1);
  });
}

module.exports = { generateOperationalGuides, OperationalGuidesGenerator };