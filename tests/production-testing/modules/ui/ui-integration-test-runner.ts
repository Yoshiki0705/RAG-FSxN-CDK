/**
 * UI統合テストランナー
 * 全UIテストの統合実行と結果集計
 */

import { TestResult } from '../../types/test-types';
import { ResponsiveDesignTest, ResponsiveTestConfig, ResponsiveTestResult } from './responsive-design-test';
import { RealtimeChatTest, RealtimeChatTestConfig, RealtimeChatTestResult } from './realtime-chat-test';
import { DocumentSourceDisplayTest, DocumentSourceTestConfig, DocumentSourceTestResult } from './document-source-display-test';
import { AccessibilityTest, AccessibilityTestConfig, AccessibilityTestResult } from './accessibility-test';

export interface UIIntegrationTestConfig {
  baseUrl: string;
  enabledTests: {
    responsiveDesign: boolean;
    realtimeChat: boolean;
    documentSourceDisplay: boolean;
    accessibility: boolean;
  };
  testEnvironment: 'development' | 'staging' | 'production';
  browserConfig: {
    headless: boolean;
    viewport: { width: number; height: number };
    timeout: number;
  };
  reportingConfig: {
    generateScreenshots: boolean;
    generateVideoRecording: boolean;
    detailedLogs: boolean;
  };
}

export interface UIIntegrationTestResult extends TestResult {
  responsiveDesignResult?: ResponsiveTestResult;
  realtimeChatResult?: RealtimeChatTestResult;
  documentSourceDisplayResult?: DocumentSourceTestResult;
  accessibilityResult?: AccessibilityTestResult;
  overallUIScore: number;
  userExperienceScore: number;
  performanceScore: number;
  accessibilityScore: number;
  functionalityScore: number;
  testSummary: TestSummary;
  recommendations: string[];
}

export interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  testCoverage: number;
  executionTime: number;
}

export class UIIntegrationTestRunner {
  private config: UIIntegrationTestConfig;
  private testStartTime: number = 0;

  constructor(config: UIIntegrationTestConfig) {
    this.config = config;
  }

  /**
   * UI統合テストの実行
   */
  async runTests(): Promise<UIIntegrationTestResult> {
    console.log('🎨 UI統合テストを開始します...');
    console.log(`🌐 テスト環境: ${this.config.testEnvironment}`);
    console.log(`🔗 ベースURL: ${this.config.baseUrl}`);
    
    this.testStartTime = Date.now();

    try {
      const results: Partial<UIIntegrationTestResult> = {
        testName: 'UIIntegrationTest',
        success: false,
        duration: 0,
        details: {}
      };

      // レスポンシブデザインテスト
      if (this.config.enabledTests.responsiveDesign) {
        console.log('\n📱 レスポンシブデザインテストを実行中...');
        results.responsiveDesignResult = await this.runResponsiveDesignTest();
      }

      // リアルタイムチャットテスト
      if (this.config.enabledTests.realtimeChat) {
        console.log('\n💬 リアルタイムチャットテストを実行中...');
        results.realtimeChatResult = await this.runRealtimeChatTest();
      }

      // 文書ソース表示テスト
      if (this.config.enabledTests.documentSourceDisplay) {
        console.log('\n📚 文書ソース表示テストを実行中...');
        results.documentSourceDisplayResult = await this.runDocumentSourceDisplayTest();
      }

      // アクセシビリティテスト
      if (this.config.enabledTests.accessibility) {
        console.log('\n♿ アクセシビリティテストを実行中...');
        results.accessibilityResult = await this.runAccessibilityTest();
      }

      // 結果の統合と評価
      const finalResult = this.aggregateResults(results);
      
      // レポート生成
      await this.generateReports(finalResult);

      return finalResult;

    } catch (error) {
      console.error('❌ UI統合テストでエラーが発生:', error);
      
      return {
        testName: 'UIIntegrationTest',
        success: false,
        duration: Date.now() - this.testStartTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          testEnvironment: this.config.testEnvironment
        },
        overallUIScore: 0,
        userExperienceScore: 0,
        performanceScore: 0,
        accessibilityScore: 0,
        functionalityScore: 0,
        testSummary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 1,
          criticalIssues: 1,
          majorIssues: 0,
          minorIssues: 0,
          testCoverage: 0,
          executionTime: Date.now() - this.testStartTime
        },
        recommendations: [
          'システムの接続と設定を確認してください',
          'テスト環境の準備状況を確認してください'
        ]
      };
    }
  }

  /**
   * レスポンシブデザインテストの実行
   */
  private async runResponsiveDesignTest(): Promise<ResponsiveTestResult> {
    const config: ResponsiveTestConfig = {
      baseUrl: this.config.baseUrl,
      testPages: [
        '/',
        '/chatbot',
        '/login',
        '/dashboard'
      ],
      devices: [
        {
          name: 'iPhone 12',
          width: 390,
          height: 844,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          deviceType: 'mobile',
          touchEnabled: true
        },
        {
          name: 'iPad Air',
          width: 820,
          height: 1180,
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          deviceType: 'tablet',
          touchEnabled: true
        },
        {
          name: 'Desktop 1920x1080',
          width: 1920,
          height: 1080,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          deviceType: 'desktop',
          touchEnabled: false
        }
      ],
      performanceThresholds: {
        loadTime: 2000,
        renderTime: 1000,
        interactionTime: 100
      },
      accessibilityThresholds: {
        minScore: 85,
        wcagLevel: 'AA'
      }
    };

    const test = new ResponsiveDesignTest(config);
    return await test.runTest();
  }

  /**
   * リアルタイムチャットテストの実行
   */
  private async runRealtimeChatTest(): Promise<RealtimeChatTestResult> {
    const config: RealtimeChatTestConfig = {
      baseUrl: this.config.baseUrl,
      testUsers: [
        {
          userId: 'testuser',
          username: 'testuser',
          role: 'user',
          permissions: ['chat:read', 'chat:write']
        },
        {
          userId: 'admin',
          username: 'admin',
          role: 'admin',
          permissions: ['chat:read', 'chat:write', 'chat:moderate']
        }
      ],
      messageTypes: [
        { type: 'text' },
        { type: 'file', maxSize: 10485760, allowedFormats: ['pdf', 'doc', 'txt'] },
        { type: 'ai_response' }
      ],
      performanceThresholds: {
        messageDeliveryTime: 500,
        typingIndicatorDelay: 200,
        connectionEstablishmentTime: 2000,
        messageHistoryLoadTime: 1000
      },
      concurrencyLimits: {
        maxConcurrentUsers: 100,
        maxMessagesPerSecond: 50
      }
    };

    const test = new RealtimeChatTest(config);
    return await test.runTest();
  }

  /**
   * 文書ソース表示テストの実行
   */
  private async runDocumentSourceDisplayTest(): Promise<DocumentSourceTestResult> {
    const config: DocumentSourceTestConfig = {
      baseUrl: this.config.baseUrl,
      testQueries: [
        {
          id: 'query_1',
          query: 'AWS Lambda の設定方法について教えてください',
          expectedSourceCount: 3,
          expectedSourceTypes: ['document', 'api'],
          category: 'technical',
          complexity: 'medium'
        },
        {
          id: 'query_2',
          query: 'セキュリティベストプラクティスは何ですか',
          expectedSourceCount: 4,
          expectedSourceTypes: ['document'],
          category: 'business',
          complexity: 'complex'
        }
      ],
      expectedSources: [],
      displayRequirements: [
        {
          element: '.source-citation',
          required: true,
          format: 'inline',
          accessibility: true,
          interactivity: true
        },
        {
          element: '.source-link',
          required: true,
          format: 'hyperlink',
          accessibility: true,
          interactivity: true
        }
      ],
      accuracyThresholds: {
        sourceAttributionAccuracy: 85,
        citationFormatCompliance: 90,
        linkValidityRate: 95,
        contentRelevanceScore: 80
      }
    };

    const test = new DocumentSourceDisplayTest(config);
    return await test.runTest();
  }

  /**
   * アクセシビリティテストの実行
   */
  private async runAccessibilityTest(): Promise<AccessibilityTestResult> {
    const config: AccessibilityTestConfig = {
      baseUrl: this.config.baseUrl,
      testPages: [
        '/',
        '/chatbot',
        '/login',
        '/dashboard'
      ],
      wcagLevel: 'AA',
      wcagVersion: '2.1',
      testCategories: [
        {
          name: 'perceivable',
          principles: [],
          weight: 0.25,
          required: true
        },
        {
          name: 'operable',
          principles: [],
          weight: 0.25,
          required: true
        },
        {
          name: 'understandable',
          principles: [],
          weight: 0.25,
          required: true
        },
        {
          name: 'robust',
          principles: [],
          weight: 0.25,
          required: true
        }
      ],
      complianceThresholds: {
        overallScore: 85,
        categoryMinimums: {
          perceivable: 80,
          operable: 85,
          understandable: 80,
          robust: 85
        },
        criticalIssueLimit: 0
      }
    };

    const test = new AccessibilityTest(config);
    return await test.runTest();
  }

  /**
   * 結果の統合と評価
   */
  private aggregateResults(results: Partial<UIIntegrationTestResult>): UIIntegrationTestResult {
    const duration = Date.now() - this.testStartTime;
    
    // 各テストのスコア収集
    const scores = {
      responsive: results.responsiveDesignResult?.overallResponsiveScore || 0,
      chat: results.realtimeChatResult?.overallChatScore || 0,
      sourceDisplay: results.documentSourceDisplayResult?.overallSourceScore || 0,
      accessibility: results.accessibilityResult?.overallAccessibilityScore || 0
    };

    // 重み付きスコア計算
    const weights = {
      responsive: 0.25,
      chat: 0.25,
      sourceDisplay: 0.25,
      accessibility: 0.25
    };

    const overallUIScore = Object.entries(scores).reduce((sum, [key, score]) => {
      return sum + (score * weights[key as keyof typeof weights]);
    }, 0);

    // カテゴリ別スコア計算
    const userExperienceScore = (scores.responsive + scores.chat) / 2;
    const performanceScore = this.calculatePerformanceScore(results);
    const accessibilityScore = scores.accessibility;
    const functionalityScore = (scores.chat + scores.sourceDisplay) / 2;

    // テストサマリーの作成
    const testSummary = this.createTestSummary(results, duration);

    // 推奨事項の生成
    const recommendations = this.generateRecommendations(results, scores);

    // 成功判定
    const success = overallUIScore >= 85 && 
                   testSummary.criticalIssues === 0 && 
                   accessibilityScore >= 85;

    return {
      testName: 'UIIntegrationTest',
      success,
      duration,
      details: {
        testEnvironment: this.config.testEnvironment,
        enabledTests: this.config.enabledTests,
        overallScore: overallUIScore,
        individualScores: scores
      },
      ...results,
      overallUIScore,
      userExperienceScore,
      performanceScore,
      accessibilityScore,
      functionalityScore,
      testSummary,
      recommendations
    } as UIIntegrationTestResult;
  }

  /**
   * パフォーマンススコアの計算
   */
  private calculatePerformanceScore(results: Partial<UIIntegrationTestResult>): number {
    let totalScore = 0;
    let count = 0;

    if (results.responsiveDesignResult) {
      totalScore += results.responsiveDesignResult.performanceScore;
      count++;
    }

    if (results.realtimeChatResult) {
      totalScore += results.realtimeChatResult.performanceScore;
      count++;
    }

    return count > 0 ? totalScore / count : 0;
  }

  /**
   * テストサマリーの作成
   */
  private createTestSummary(results: Partial<UIIntegrationTestResult>, duration: number): TestSummary {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let criticalIssues = 0;
    let majorIssues = 0;
    let minorIssues = 0;

    // レスポンシブデザインテスト
    if (results.responsiveDesignResult) {
      totalTests++;
      if (results.responsiveDesignResult.success) passedTests++;
      else failedTests++;

      results.responsiveDesignResult.deviceResults.forEach(device => {
        device.pageResults.forEach(page => {
          page.issues.forEach(issue => {
            if (issue.severity === 'critical') criticalIssues++;
            else if (issue.severity === 'major') majorIssues++;
            else minorIssues++;
          });
        });
      });
    }

    // リアルタイムチャットテスト
    if (results.realtimeChatResult) {
      totalTests++;
      if (results.realtimeChatResult.success) passedTests++;
      else failedTests++;
    }

    // 文書ソース表示テスト
    if (results.documentSourceDisplayResult) {
      totalTests++;
      if (results.documentSourceDisplayResult.success) passedTests++;
      else failedTests++;

      results.documentSourceDisplayResult.queryResults.forEach(query => {
        query.issues.forEach(issue => {
          if (issue.severity === 'critical') criticalIssues++;
          else if (issue.severity === 'major') majorIssues++;
          else minorIssues++;
        });
      });
    }

    // アクセシビリティテスト
    if (results.accessibilityResult) {
      totalTests++;
      if (results.accessibilityResult.success) passedTests++;
      else failedTests++;

      criticalIssues += results.accessibilityResult.criticalIssueCount;
      // 他の問題レベルも集計
    }

    const testCoverage = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      criticalIssues,
      majorIssues,
      minorIssues,
      testCoverage,
      executionTime: duration
    };
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(
    results: Partial<UIIntegrationTestResult>, 
    scores: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // レスポンシブデザインの推奨事項
    if (scores.responsive < 85) {
      recommendations.push('レスポンシブデザインの改善が必要です。特にモバイル表示の最適化を行ってください。');
    }

    // チャット機能の推奨事項
    if (scores.chat < 85) {
      recommendations.push('リアルタイムチャット機能の安定性とパフォーマンスを改善してください。');
    }

    // ソース表示の推奨事項
    if (scores.sourceDisplay < 85) {
      recommendations.push('文書ソースの表示精度と引用フォーマットを改善してください。');
    }

    // アクセシビリティの推奨事項
    if (scores.accessibility < 85) {
      recommendations.push('WCAG 2.1 AA準拠のためのアクセシビリティ改善が必要です。');
    }

    // 重要な問題がある場合
    if (results.accessibilityResult?.criticalIssueCount && results.accessibilityResult.criticalIssueCount > 0) {
      recommendations.push(`重要なアクセシビリティ問題 ${results.accessibilityResult.criticalIssueCount}件 を優先的に修正してください。`);
    }

    // パフォーマンス関連
    const performanceScore = this.calculatePerformanceScore(results);
    if (performanceScore < 80) {
      recommendations.push('ページ読み込み時間とインタラクション応答時間の改善が必要です。');
    }

    // 一般的な推奨事項
    if (recommendations.length === 0) {
      recommendations.push('すべてのUIテストが良好な結果を示しています。現在の品質を維持してください。');
    }

    return recommendations;
  }

  /**
   * レポート生成
   */
  private async generateReports(result: UIIntegrationTestResult): Promise<void> {
    if (!this.config.reportingConfig.detailedLogs) return;

    console.log('\n📊 UI統合テスト最終結果:');
    console.log('=' .repeat(60));
    console.log(`✅ 総合UIスコア: ${result.overallUIScore.toFixed(1)}/100`);
    console.log(`👤 ユーザーエクスペリエンス: ${result.userExperienceScore.toFixed(1)}/100`);
    console.log(`⚡ パフォーマンス: ${result.performanceScore.toFixed(1)}/100`);
    console.log(`♿ アクセシビリティ: ${result.accessibilityScore.toFixed(1)}/100`);
    console.log(`🔧 機能性: ${result.functionalityScore.toFixed(1)}/100`);

    console.log('\n📈 テストサマリー:');
    console.log(`  総テスト数: ${result.testSummary.totalTests}`);
    console.log(`  合格: ${result.testSummary.passedTests}`);
    console.log(`  不合格: ${result.testSummary.failedTests}`);
    console.log(`  テストカバレッジ: ${result.testSummary.testCoverage.toFixed(1)}%`);
    console.log(`  実行時間: ${(result.testSummary.executionTime / 1000).toFixed(1)}秒`);

    if (result.testSummary.criticalIssues > 0 || result.testSummary.majorIssues > 0) {
      console.log('\n⚠️  検出された問題:');
      if (result.testSummary.criticalIssues > 0) {
        console.log(`  🔴 重要: ${result.testSummary.criticalIssues}件`);
      }
      if (result.testSummary.majorIssues > 0) {
        console.log(`  🟡 主要: ${result.testSummary.majorIssues}件`);
      }
      if (result.testSummary.minorIssues > 0) {
        console.log(`  🟢 軽微: ${result.testSummary.minorIssues}件`);
      }
    }

    console.log('\n💡 推奨事項:');
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    if (result.success) {
      console.log('\n🎉 UI統合テスト: 合格');
      console.log('   すべてのUIコンポーネントが品質基準を満たしています');
    } else {
      console.log('\n❌ UI統合テスト: 不合格');
      console.log('   UIの品質改善が必要です');
    }

    console.log('=' .repeat(60));
  }
}

/**
 * デフォルト設定でのUI統合テスト実行
 */
export async function runUIIntegrationTest(
  baseUrl: string = 'http://localhost:3000',
  testEnvironment: 'development' | 'staging' | 'production' = 'development'
): Promise<UIIntegrationTestResult> {
  const config: UIIntegrationTestConfig = {
    baseUrl,
    enabledTests: {
      responsiveDesign: true,
      realtimeChat: true,
      documentSourceDisplay: true,
      accessibility: true
    },
    testEnvironment,
    browserConfig: {
      headless: false,
      viewport: { width: 1920, height: 1080 },
      timeout: 30000
    },
    reportingConfig: {
      generateScreenshots: true,
      generateVideoRecording: false,
      detailedLogs: true
    }
  };

  const runner = new UIIntegrationTestRunner(config);
  return await runner.runTests();
}