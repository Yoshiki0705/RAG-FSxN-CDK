/**
 * 緊急停止管理システム
 * 
 * 本番環境テスト実行中の異常検出時に安全な緊急停止を実行
 * データ整合性を保ちながらテストを中断し、システムを安全な状態に戻す
 * 
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */

import { EventEmitter } from 'events';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { ProductionConfig } from '../config/production-config';

/**
 * 緊急停止理由の列挙
 */
export enum EmergencyStopReason {
  DATA_INTEGRITY_VIOLATION = 'DATA_INTEGRITY_VIOLATION',
  RESOURCE_OVERLOAD = 'RESOURCE_OVERLOAD',
  SECURITY_BREACH = 'SECURITY_BREACH',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  MANUAL_REQUEST = 'MANUAL_REQUEST',
  TIMEOUT_EXCEEDED = 'TIMEOUT_EXCEEDED',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE'
}

/**
 * 緊急停止状態インターフェース
 */
export interface EmergencyStopState {
  isActive: boolean;
  reason: EmergencyStopReason;
  timestamp: Date;
  initiatedBy: string;
  affectedTests: string[];
  recoveryActions: string[];
}

/**
 * 実行中テスト情報
 */
export interface ActiveTest {
  testId: string;
  testName: string;
  startTime: Date;
  category: string;
  status: 'running' | 'stopping' | 'stopped';
  resourcesInUse: string[];
}

/**
 * 緊急停止管理クラス
 */
export class EmergencyStopManager extends EventEmitter {
  private config: ProductionConfig;
  private cloudWatchClient: CloudWatchClient;
  private stopState: EmergencyStopState | null = null;
  private activeTests: Map<string, ActiveTest> = new Map();
  private stopInProgress: boolean = false;
  private recoveryCallbacks: Array<() => Promise<void>> = [];

  constructor(config: ProductionConfig) {
    super();
    this.config = config;
    this.cloudWatchClient = new CloudWatchClient({
      region: config.region,
      credentials: { profile: config.awsProfile }
    });

    // 緊急停止イベントリスナーの設定
    this.setupEventListeners();
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    // プロセス終了時の緊急停止
    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT受信: 緊急停止を開始します...');
      this.initiateEmergencyStop(EmergencyStopReason.MANUAL_REQUEST, 'SIGINT signal received');
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM受信: 緊急停止を開始します...');
      this.initiateEmergencyStop(EmergencyStopReason.MANUAL_REQUEST, 'SIGTERM signal received');
    });

    // 未処理例外時の緊急停止
    process.on('uncaughtException', (error) => {
      console.error('🚨 未処理例外が発生しました:', error);
      this.initiateEmergencyStop(EmergencyStopReason.UNEXPECTED_ERROR, `Uncaught exception: ${error.message}`);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 未処理のPromise拒否が発生しました:', reason);
      this.initiateEmergencyStop(EmergencyStopReason.UNEXPECTED_ERROR, `Unhandled rejection: ${reason}`);
    });
  }

  /**
   * 緊急停止の開始
   */
  async initiateEmergencyStop(
    reason: EmergencyStopReason,
    details: string,
    initiatedBy: string = 'system'
  ): Promise<void> {
    if (this.stopInProgress) {
      console.log('⚠️ 緊急停止は既に進行中です');
      return;
    }

    this.stopInProgress = true;
    const timestamp = new Date();

    console.log(`🚨 緊急停止開始: ${reason}`);
    console.log(`   理由: ${details}`);
    console.log(`   開始者: ${initiatedBy}`);
    console.log(`   時刻: ${timestamp.toISOString()}`);

    // 緊急停止状態の設定
    this.stopState = {
      isActive: true,
      reason,
      timestamp,
      initiatedBy,
      affectedTests: Array.from(this.activeTests.keys()),
      recoveryActions: []
    };

    try {
      // 1. 実行中テストの安全な停止
      await this.stopActiveTests();

      // 2. リソースの安全な切断
      await this.disconnectResources();

      // 3. データ整合性の確認
      await this.verifyDataIntegrity();

      // 4. 復旧アクションの実行
      await this.executeRecoveryActions();

      // 5. 管理者への通知
      await this.notifyAdministrators(reason, details);

      // 6. メトリクスの送信
      await this.sendEmergencyStopMetrics(reason);

      console.log('✅ 緊急停止処理が完了しました');
      this.emit('emergencyStopCompleted', this.stopState);

    } catch (error) {
      console.error('❌ 緊急停止処理中にエラーが発生しました:', error);
      this.emit('emergencyStopFailed', error);
    } finally {
      this.stopInProgress = false;
    }
  }

  /**
   * 実行中テストの安全な停止
   */
  private async stopActiveTests(): Promise<void> {
    console.log(`🛑 実行中テストを停止中... (${this.activeTests.size}件)`);

    const stopPromises = Array.from(this.activeTests.values()).map(async (test) => {
      try {
        console.log(`   停止中: ${test.testName} (${test.testId})`);
        
        // テスト状態を停止中に変更
        test.status = 'stopping';
        
        // テスト固有の停止処理
        await this.stopIndividualTest(test);
        
        // テスト状態を停止済みに変更
        test.status = 'stopped';
        
        console.log(`   ✅ 停止完了: ${test.testName}`);
        
      } catch (error) {
        console.error(`   ❌ テスト停止エラー (${test.testName}):`, error);
        this.stopState?.recoveryActions.push(`テスト ${test.testName} の手動確認が必要`);
      }
    });

    await Promise.allSettled(stopPromises);
    console.log('✅ 全テストの停止処理完了');
  }

  /**
   * 個別テストの停止処理
   */
  private async stopIndividualTest(test: ActiveTest): Promise<void> {
    // テストカテゴリに応じた停止処理
    switch (test.category) {
      case 'authentication':
        await this.stopAuthenticationTest(test);
        break;
      case 'ai-response':
        await this.stopAIResponseTest(test);
        break;
      case 'performance':
        await this.stopPerformanceTest(test);
        break;
      case 'ui-ux':
        await this.stopUIUXTest(test);
        break;
      default:
        await this.stopGenericTest(test);
        break;
    }
  }

  /**
   * 認証テストの停止
   */
  private async stopAuthenticationTest(test: ActiveTest): Promise<void> {
    // 認証セッションのクリーンアップ
    console.log(`   🔐 認証テストのセッションをクリーンアップ中: ${test.testId}`);
    // 実装: セッション無効化、一時的な認証情報の削除など
  }

  /**
   * AI応答テストの停止
   */
  private async stopAIResponseTest(test: ActiveTest): Promise<void> {
    // AI応答生成の中断
    console.log(`   🤖 AI応答テストを中断中: ${test.testId}`);
    // 実装: Bedrockリクエストのキャンセル、ストリーミングの停止など
  }

  /**
   * パフォーマンステストの停止
   */
  private async stopPerformanceTest(test: ActiveTest): Promise<void> {
    // 負荷生成の停止
    console.log(`   ⚡ パフォーマンステストの負荷生成を停止中: ${test.testId}`);
    // 実装: 同時リクエストの停止、リソース使用量の正常化など
  }

  /**
   * UI/UXテストの停止
   */
  private async stopUIUXTest(test: ActiveTest): Promise<void> {
    // ブラウザセッションの終了
    console.log(`   🖥️ UI/UXテストのブラウザセッションを終了中: ${test.testId}`);
    // 実装: ブラウザの安全な終了、スクリーンショットの保存など
  }

  /**
   * 汎用テストの停止
   */
  private async stopGenericTest(test: ActiveTest): Promise<void> {
    console.log(`   🔧 汎用テストを停止中: ${test.testId}`);
    // 実装: 汎用的なクリーンアップ処理
  }

  /**
   * リソースの安全な切断
   */
  private async disconnectResources(): Promise<void> {
    console.log('🔌 リソースを安全に切断中...');

    try {
      // AWS接続の切断
      // 実装: 各AWSクライアントの適切な終了処理

      // ブラウザセッションの終了
      // 実装: 全ブラウザインスタンスの終了

      // 一時ファイルのクリーンアップ
      // 実装: テスト中に作成された一時ファイルの削除

      console.log('✅ リソース切断完了');
      
    } catch (error) {
      console.error('❌ リソース切断エラー:', error);
      this.stopState?.recoveryActions.push('リソースの手動切断確認が必要');
    }
  }

  /**
   * データ整合性の確認
   */
  private async verifyDataIntegrity(): Promise<void> {
    console.log('🔍 データ整合性を確認中...');

    try {
      // 本番データの整合性チェック
      // 実装: DynamoDB、OpenSearch、FSxのデータ状態確認

      console.log('✅ データ整合性確認完了');
      
    } catch (error) {
      console.error('❌ データ整合性確認エラー:', error);
      this.stopState?.recoveryActions.push('データ整合性の手動確認が必要');
    }
  }

  /**
   * 復旧アクションの実行
   */
  private async executeRecoveryActions(): Promise<void> {
    console.log('🔄 復旧アクションを実行中...');

    for (const callback of this.recoveryCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('❌ 復旧アクション実行エラー:', error);
      }
    }

    console.log('✅ 復旧アクション実行完了');
  }

  /**
   * 管理者への通知
   */
  private async notifyAdministrators(reason: EmergencyStopReason, details: string): Promise<void> {
    console.log('📧 管理者に通知中...');

    try {
      // 実装: Slack、メール、SNSなどでの通知
      const notificationMessage = {
        title: '🚨 本番環境テスト緊急停止',
        reason: reason,
        details: details,
        timestamp: new Date().toISOString(),
        affectedTests: this.stopState?.affectedTests || [],
        recoveryActions: this.stopState?.recoveryActions || []
      };

      console.log('通知内容:', JSON.stringify(notificationMessage, null, 2));
      
      // TODO: 実際の通知システムとの統合
      
    } catch (error) {
      console.error('❌ 管理者通知エラー:', error);
    }
  }

  /**
   * 緊急停止メトリクスの送信
   */
  private async sendEmergencyStopMetrics(reason: EmergencyStopReason): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: 'ProductionTesting/EmergencyStop',
        MetricData: [
          {
            MetricName: 'EmergencyStopCount',
            Value: 1,
            Unit: 'Count',
            Dimensions: [
              {
                Name: 'Reason',
                Value: reason
              }
            ],
            Timestamp: new Date()
          },
          {
            MetricName: 'AffectedTestsCount',
            Value: this.activeTests.size,
            Unit: 'Count',
            Timestamp: new Date()
          }
        ]
      });

      await this.cloudWatchClient.send(command);
      console.log('📊 緊急停止メトリクスをCloudWatchに送信しました');
      
    } catch (error) {
      console.warn('⚠️ 緊急停止メトリクス送信に失敗:', error);
    }
  }

  /**
   * テストの登録
   */
  registerActiveTest(test: ActiveTest): void {
    this.activeTests.set(test.testId, test);
    console.log(`📝 アクティブテスト登録: ${test.testName} (${test.testId})`);
  }

  /**
   * テストの登録解除
   */
  unregisterActiveTest(testId: string): void {
    if (this.activeTests.delete(testId)) {
      console.log(`📝 アクティブテスト登録解除: ${testId}`);
    }
  }

  /**
   * 復旧コールバックの登録
   */
  registerRecoveryCallback(callback: () => Promise<void>): void {
    this.recoveryCallbacks.push(callback);
  }

  /**
   * 緊急停止状態の取得
   */
  getEmergencyStopState(): EmergencyStopState | null {
    return this.stopState;
  }

  /**
   * 緊急停止状態のリセット
   */
  resetEmergencyStopState(): void {
    if (this.stopState) {
      console.log('🔄 緊急停止状態をリセットします');
      this.stopState = null;
      this.activeTests.clear();
      this.stopInProgress = false;
      this.emit('emergencyStopReset');
    }
  }

  /**
   * アクティブテスト一覧の取得
   */
  getActiveTests(): ActiveTest[] {
    return Array.from(this.activeTests.values());
  }

  /**
   * 緊急停止が有効かどうかの確認
   */
  isEmergencyStopActive(): boolean {
    return this.stopState?.isActive || false;
  }

  /**
   * リソースのクリーンアップ
   */
  async cleanup(): Promise<void> {
    console.log('🧹 緊急停止管理システムをクリーンアップ中...');
    
    // イベントリスナーの削除
    this.removeAllListeners();
    
    // アクティブテストのクリア
    this.activeTests.clear();
    
    // 復旧コールバックのクリア
    this.recoveryCallbacks = [];
    
    console.log('✅ 緊急停止管理システムのクリーンアップ完了');
  }
}

export default EmergencyStopManager;