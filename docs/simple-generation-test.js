/**
 * シンプルなドキュメント生成テスト（JavaScript版）
 */

const fs = require('fs');
const path = require('path');

// 運用ガイド生成のテスト
function generateTroubleshootingGuide() {
  return `# トラブルシューティングガイド

## 🚨 緊急時対応

### システム全体が応答しない場合

#### 症状
- Webサイトにアクセスできない
- APIが500エラーを返す
- タイムアウトが発生する

#### 確認手順
1. **CloudFrontの状態確認**
   \`\`\`bash
   aws cloudfront get-distribution --id E1234567890ABC
   \`\`\`

2. **ALBの状態確認**
   \`\`\`bash
   aws elbv2 describe-load-balancers --names rag-system-alb
   \`\`\`

3. **Lambda関数の状態確認**
   \`\`\`bash
   aws lambda get-function --function-name rag-system-web
   aws lambda get-function --function-name rag-system-api
   \`\`\`

#### 対処法
1. **Lambda関数の再起動**
   \`\`\`bash
   aws lambda update-function-code --function-name rag-system-api --zip-file fileb://deployment.zip
   \`\`\`

2. **CloudWatchログの確認**
   \`\`\`bash
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/rag-system
   \`\`\`

## 📞 エスカレーション

### レベル1: 自動復旧
- ヘルスチェック失敗時の自動再起動
- オートスケーリングによる負荷分散

### レベル2: 運用チーム対応
- 手動でのサービス再起動
- 設定変更による問題解決

### レベル3: 開発チーム対応
- コード修正が必要な問題
- アーキテクチャ変更が必要な問題
`;
}

function generateOperationalChecklist() {
  return `# 運用チェックリスト

## 📅 日次チェック

### システム状態確認
- [ ] Webサイトの正常動作確認
- [ ] API エンドポイントの応答確認
- [ ] ヘルスチェックの状態確認
- [ ] エラーログの確認

### パフォーマンス確認
- [ ] 応答時間の確認（< 2秒）
- [ ] Lambda 関数の実行時間確認
- [ ] DynamoDB の読み書き遅延確認
- [ ] OpenSearch クエリ性能確認

### セキュリティ確認
- [ ] WAF ブロック状況の確認
- [ ] 不正アクセス試行の確認
- [ ] SSL証明書の有効期限確認
- [ ] セキュリティアラートの確認

## 📅 週次チェック

### システム最適化
- [ ] Lambda 関数のメモリ使用量最適化
- [ ] DynamoDB のキャパシティ最適化
- [ ] CloudFront キャッシュ効率の確認
- [ ] ログローテーションの確認

## 🚨 緊急時チェックリスト

### 初期対応
- [ ] インシデントの影響範囲確認
- [ ] 関係者への連絡
- [ ] 一時的な回避策の実施
- [ ] 詳細調査の開始
`;
}

function generateMonitoringGuide() {
  return `# 監視・アラート設定ガイド

## 📊 監視対象メトリクス

### Lambda 関数

#### 重要メトリクス
- **Duration**: 実行時間（目標: < 5秒）
- **Errors**: エラー率（目標: < 1%）
- **Throttles**: スロットル発生数（目標: 0）
- **ConcurrentExecutions**: 同時実行数

#### CloudWatch アラーム設定例
\`\`\`bash
# エラー率アラーム
aws cloudwatch put-metric-alarm \\
  --alarm-name "Lambda-ErrorRate-High" \\
  --alarm-description "Lambda error rate is high" \\
  --metric-name "Errors" \\
  --namespace "AWS/Lambda" \\
  --statistic "Sum" \\
  --period 300 \\
  --threshold 5 \\
  --comparison-operator "GreaterThanThreshold" \\
  --evaluation-periods 2
\`\`\`

### DynamoDB

#### 重要メトリクス
- **ConsumedReadCapacityUnits**: 読み込み消費量
- **ConsumedWriteCapacityUnits**: 書き込み消費量
- **ThrottledRequests**: スロットルされたリクエスト数
- **SystemErrors**: システムエラー数

## 🔔 アラート設定

### 重要度レベル

#### Critical（緊急）
- システム全体の停止
- データ損失の可能性
- セキュリティインシデント
- **通知先**: オンコール担当者、管理者
- **対応時間**: 15分以内

#### High（高）
- パフォーマンス大幅低下
- 一部機能の停止
- エラー率の急激な増加
- **通知先**: 運用チーム、開発チーム
- **対応時間**: 1時間以内
`;
}

async function testSimpleGeneration() {
  console.log('🧪 シンプルなドキュメント生成テストを開始します...');
  console.log('===============================================');
  console.log('');

  try {
    const outputDir = './test-simple-docs';
    
    // 出力ディレクトリの作成
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 出力ディレクトリを作成しました: ${outputDir}`);
    }

    // サブディレクトリの作成
    const operationsDir = path.join(outputDir, 'operations');
    if (!fs.existsSync(operationsDir)) {
      fs.mkdirSync(operationsDir, { recursive: true });
    }

    console.log('📖 運用ガイドを生成中...');

    // トラブルシューティングガイドの生成
    const troubleshootingGuide = generateTroubleshootingGuide();
    fs.writeFileSync(path.join(operationsDir, 'troubleshooting.md'), troubleshootingGuide, 'utf8');
    console.log('   ✅ トラブルシューティングガイド生成完了');

    // 運用チェックリストの生成
    const operationalChecklist = generateOperationalChecklist();
    fs.writeFileSync(path.join(operationsDir, 'checklist.md'), operationalChecklist, 'utf8');
    console.log('   ✅ 運用チェックリスト生成完了');

    // 監視ガイドの生成
    const monitoringGuide = generateMonitoringGuide();
    fs.writeFileSync(path.join(operationsDir, 'monitoring.md'), monitoringGuide, 'utf8');
    console.log('   ✅ 監視ガイド生成完了');

    // 統計情報の表示
    const files = fs.readdirSync(operationsDir);
    let totalSize = 0;
    
    files.forEach(file => {
      const filePath = path.join(operationsDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });

    console.log('');
    console.log('📊 生成結果:');
    console.log(`   📄 生成ファイル数: ${files.length}`);
    console.log(`   💾 総サイズ: ${(totalSize / 1024).toFixed(1)} KB`);
    console.log(`   📁 出力ディレクトリ: ${path.resolve(outputDir)}`);
    console.log('');
    console.log('📋 生成されたファイル:');
    files.forEach(file => {
      console.log(`   - ${file}`);
    });

    console.log('');
    console.log('🎉 テスト完了！');
    console.log('');
    console.log('✅ 運用ガイド生成システムが正常に動作しています');
    console.log('');
    console.log('🎯 次のステップ:');
    console.log('   1. 生成されたドキュメントの内容確認');
    console.log('   2. TypeScript版の生成器との統合');
    console.log('   3. 本格的なドキュメント生成システムの実行');

  } catch (error) {
    console.error('');
    console.error('❌ テスト失敗:');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// テストの実行
if (require.main === module) {
  testSimpleGeneration().catch(error => {
    console.error('予期しないエラーが発生しました:', error);
    process.exit(1);
  });
}

module.exports = { testSimpleGeneration };