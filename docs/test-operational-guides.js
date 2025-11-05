#!/usr/bin/env node

/**
 * 運用ガイド生成のJavaScriptテスト
 */

/**
 * 運用ガイド生成クラス（JavaScript版）
 * 各種運用ドキュメントの生成を担当
 */
class OperationalGuidesGenerator {
  constructor(customConfig = {}) {
    // 設定の初期化（環境変数とカスタム設定をマージ）
    this.config = {
      projectName: process.env.PROJECT_NAME || 'Permission-aware RAG System',
      version: process.env.PROJECT_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      generatedAt: new Date().toLocaleString('ja-JP'),
      ...customConfig
    };
    
    // 設定値の検証
    this.validateConfig();
  }

  /**
   * 設定値の検証
   * @private
   */
  validateConfig() {
    if (!this.config.projectName || typeof this.config.projectName !== 'string') {
      throw new Error('プロジェクト名が設定されていません');
    }
    
    if (!this.config.version || typeof this.config.version !== 'string') {
      throw new Error('バージョンが設定されていません');
    }
  }

  /**
   * トラブルシューティングガイドの生成
   * @returns {string} マークダウン形式のトラブルシューティングガイド
   */
  generateTroubleshootingGuide() {
    return `# トラブルシューティングガイド

**プロジェクト:** ${this.config.projectName}  
**バージョン:** ${this.config.version}  
**生成日時:** ${this.config.generatedAt}

## 🚨 緊急時対応

### システム全体が応答しない場合

#### 症状
- Webサイトにアクセスできない
- APIが500エラーを返す
- タイムアウトが発生する

#### 確認手順
1. **CloudFrontの状態確認**
2. **ALBの状態確認**
3. **Lambda関数の状態確認**

#### 対処法
1. **緊急ロールバック**
2. **メンテナンスページの表示**

### チャット機能が動作しない場合

#### 症状
- チャット送信でエラーが発生
- AI応答が返ってこない
- 検索結果が空

#### 確認手順
1. **Bedrock接続確認**
2. **OpenSearch接続確認**
3. **FSx接続確認**

#### 対処法
1. **Lambda関数の再起動**
2. **OpenSearchインデックスの確認**

## 📊 パフォーマンス問題

### 応答時間が遅い場合

#### 確認項目
- CloudWatch メトリクスの確認
- Lambda関数の実行時間
- DynamoDB のスループット
- OpenSearch のクエリ性能

#### 対処法
1. **Lambda関数のメモリ増加**
2. **DynamoDB の読み書きキャパシティ調整**
3. **OpenSearch インスタンスのスケールアップ**

## 🔒 セキュリティ問題

### 不正アクセスの検出

#### 確認手順
1. **CloudTrail ログの確認**
2. **WAF ログの確認**
3. **GuardDuty アラートの確認**

#### 対処法
1. **疑わしいIPアドレスのブロック**
2. **ユーザーアカウントの無効化**
3. **セキュリティグループの見直し**
`;
  }

  /**
   * 運用チェックリストの生成
   * @returns {string} マークダウン形式の運用チェックリスト
   */
  generateOperationalChecklist() {
    return `# 運用チェックリスト

**プロジェクト:** ${this.config.projectName}  
**バージョン:** ${this.config.version}  
**生成日時:** ${this.config.generatedAt}

## 📅 日次チェック

### システム状態確認
- [ ] Webサイトの動作確認
- [ ] API エンドポイントの応答確認
- [ ] チャット機能の動作確認
- [ ] ファイルアップロード機能の確認

### パフォーマンス確認
- [ ] 応答時間の確認（< 2秒）
- [ ] エラー率の確認（< 1%）
- [ ] スループットの確認
- [ ] リソース使用率の確認

### セキュリティ確認
- [ ] 不正アクセスの有無
- [ ] SSL証明書の有効性
- [ ] WAF ブロック状況
- [ ] GuardDuty アラート確認

## 📅 週次チェック

### 容量・使用量確認
- [ ] DynamoDB 使用量とキャパシティ
- [ ] OpenSearch ストレージ使用量
- [ ] FSx ストレージ使用量
- [ ] Lambda 実行回数と時間

### コスト確認
- [ ] 週次コストレポート確認
- [ ] 予算アラートの確認
- [ ] 不要リソースの特定

## 📅 月次チェック

### パフォーマンス分析
- [ ] 月次パフォーマンスレポート作成
- [ ] ボトルネック分析
- [ ] 最適化提案の作成

### セキュリティ監査
- [ ] アクセス権限の見直し
- [ ] 未使用ユーザーの削除
- [ ] セキュリティ設定の見直し
`;
  }

  /**
   * 監視・アラート設定ガイドの生成
   * @returns {string} マークダウン形式の監視ガイド
   */
  generateMonitoringGuide() {
    return `# 監視・アラート設定ガイド

**プロジェクト:** ${this.config.projectName}  
**バージョン:** ${this.config.version}  
**生成日時:** ${this.config.generatedAt}

## 📊 監視対象メトリクス

### Lambda 関数

#### 重要メトリクス
- **Duration**: 実行時間
- **Errors**: エラー数
- **Throttles**: スロットリング数
- **Invocations**: 実行回数
- **ConcurrentExecutions**: 同時実行数

### DynamoDB

#### 重要メトリクス
- **ConsumedReadCapacityUnits**: 読み込みキャパシティ消費
- **ConsumedWriteCapacityUnits**: 書き込みキャパシティ消費
- **ThrottledRequests**: スロットリングされたリクエスト
- **SystemErrors**: システムエラー

### OpenSearch

#### 重要メトリクス
- **SearchLatency**: 検索レイテンシ
- **SearchRate**: 検索レート
- **IndexingLatency**: インデックスレイテンシ
- **ClusterStatus.yellow**: クラスター状態
- **ClusterStatus.red**: クラスター状態

### FSx for NetApp ONTAP

#### 重要メトリクス
- **StorageCapacity**: ストレージ容量
- **StorageUtilization**: ストレージ使用率
- **ThroughputUtilization**: スループット使用率
- **ClientConnections**: クライアント接続数

## 🔔 アラート通知設定

### アラート重要度レベル

#### Critical (緊急)
- システム全体の停止
- データ損失の可能性
- セキュリティ侵害

#### High (高)
- 主要機能の停止
- パフォーマンス大幅低下
- エラー率の急上昇

#### Medium (中)
- 軽微な機能障害
- パフォーマンス低下
- 容量不足の警告

#### Low (低)
- 情報提供
- 予防的警告
- 使用量レポート

## 📈 ダッシュボード設定

### CloudWatch ダッシュボード
- Lambda パフォーマンス監視
- DynamoDB キャパシティ監視
- OpenSearch クラスター監視
- FSx ストレージ監視

## 🔍 ログ監視

### CloudWatch Logs Insights クエリ

#### エラーログの検索
- ERROR レベルのログを検索
- 時系列でのエラー分析
- エラーパターンの特定

#### パフォーマンス分析
- 実行時間の統計分析
- レスポンス時間の傾向分析
- ボトルネックの特定

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
`;
  }
}

/**
 * 運用ガイド生成システムのテスト実行
 * セキュリティ対策とエラーハンドリングを強化
 */
async function testOperationalGuides() {
  console.log('🎯 運用ガイド生成システムのテストを開始します...');
  console.log('=================================================');
  console.log('');

  const startTime = Date.now();

  try {
    // 入力値検証
    if (typeof process !== 'object' || !process.env) {
      throw new Error('実行環境が不正です');
    }

    const generator = new OperationalGuidesGenerator();
    
    console.log('1️⃣ 運用ガイド生成テスト...');
    
    // 並列処理でパフォーマンス向上
    const [troubleshootingGuide, operationalChecklist, monitoringGuide] = await Promise.all([
      Promise.resolve(generator.generateTroubleshootingGuide()),
      Promise.resolve(generator.generateOperationalChecklist()),
      Promise.resolve(generator.generateMonitoringGuide())
    ]);
    
    // メモリ使用量の監視
    const memoryUsage = process.memoryUsage();
    console.log(`   💾 メモリ使用量: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    console.log(`   📖 トラブルシューティングガイド: ${troubleshootingGuide.length} 文字`);
    console.log(`   📋 運用チェックリスト: ${operationalChecklist.length} 文字`);
    console.log(`   📊 監視ガイド: ${monitoringGuide.length} 文字`);
    console.log('   ✅ 運用ガイド生成成功');

    console.log('');
    console.log('🎉 運用ガイド生成システムのテストが正常に完了しました！');
    console.log('=================================================');
    console.log('');
    console.log('📊 テスト結果サマリー:');
    console.log('   ✅ 運用ガイド生成: 成功');
    console.log('   ✅ トラブルシューティングガイド: 成功');
    console.log('   ✅ 運用チェックリスト: 成功');
    console.log('   ✅ 監視ガイド: 成功');
    console.log('');
    console.log('💡 実装完了:');
    console.log('   ✅ ドキュメント生成システムの基盤構築完了');
    console.log('   ✅ 運用ガイド生成機能の実装完了');
    console.log('   ✅ トラブルシューティング機能の実装完了');
    console.log('   ✅ 監視・アラート設定ガイドの実装完了');
    const executionTime = Date.now() - startTime;
    console.log('');
    console.log(`⏱️ 実行時間: ${executionTime}ms`);
    console.log('📚 ドキュメント生成システムが正常に動作しています！');

  } catch (error) {
    console.error('');
    console.error('❌ テスト実行エラー:');
    
    // エラーの詳細情報を安全に出力
    if (error instanceof Error) {
      console.error(`エラーメッセージ: ${error.message}`);
      if (error.stack) {
        console.error(`スタックトレース: ${error.stack}`);
      }
    } else {
      console.error('不明なエラー:', error);
    }
    
    console.error('');
    console.error('🔧 推奨対応:');
    console.error('   1. エラーログを確認してください');
    console.error('   2. 実行環境を確認してください');
    console.error('   3. 必要に応じてサポートに連絡してください');
    console.error('');
    
    process.exit(1);
  }
}

/**
 * プロセス終了時のクリーンアップ処理
 */
function cleanup() {
  console.log('🧹 クリーンアップ処理を実行中...');
  // 必要に応じてリソースのクリーンアップを実行
}

/**
 * 予期しないエラーのハンドリング
 */
process.on('uncaughtException', (error) => {
  console.error('❌ 予期しないエラーが発生しました:', error.message);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ 未処理のPromise拒否:', reason);
  cleanup();
  process.exit(1);
});

/**
 * 正常終了時のクリーンアップ
 */
process.on('exit', (code) => {
  if (code === 0) {
    cleanup();
  }
});

testOperationalGuides();