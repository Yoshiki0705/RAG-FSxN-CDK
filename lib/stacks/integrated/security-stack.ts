/**
 * SecurityStack - 統合セキュリティスタック（モジュラーアーキテクチャ対応）
 * 
 * 機能:
 * - 統合セキュリティコンストラクトによる一元管理
 * - KMS・WAF・GuardDuty・CloudTrail・IAMの統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// 統合セキュリティコンストラクト（モジュラーアーキテクチャ）
import { SecurityConstruct } from '../../modules/security/constructs/security-construct';

// インターフェース
import { SecurityConfig } from '../../modules/security/interfaces/security-config';

// タグ設定
import { TaggingStrategy, PermissionAwareRAGTags } from '../../config/tagging-config';

export interface SecurityStackProps extends cdk.StackProps {
  readonly config: any; // 統合設定オブジェクト
  readonly namingGenerator?: any; // Agent Steering準拠命名ジェネレーター（オプション）
  readonly projectName: string; // プロジェクト名（コスト配布用）
  readonly environment: string; // 環境名（コスト配布用）
}

/**
 * 統合セキュリティスタック（モジュラーアーキテクチャ対応）
 * 
 * 統合セキュリティコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
export class SecurityStack extends cdk.Stack {
  /** 統合セキュリティコンストラクト */
  public readonly security: SecurityConstruct;
  
  /** KMSキー（他スタックからの参照用） */
  public readonly kmsKey: cdk.aws_kms.Key;
  
  /** WAF WebACL ARN（他スタックからの参照用） */
  public readonly wafWebAclArn?: string;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    console.log('🔒 SecurityStack初期化開始...');
    console.log('📝 スタック名:', id);
    console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');

    // コスト配布タグの適用
    const taggingConfig = PermissionAwareRAGTags.getStandardConfig(
      props.projectName,
      props.environment
    );
    TaggingStrategy.applyTagsToStack(this, taggingConfig);

    // 統合セキュリティコンストラクト作成
    this.security = new SecurityConstruct(this, 'Security', {
      config: props.config.security,
      projectName: props.config.project.name,
      environment: props.config.environment,
      namingGenerator: props.namingGenerator,
    });

    // 他スタックからの参照用プロパティ設定
    this.kmsKey = this.security.kmsKey;
    this.wafWebAclArn = this.security.wafWebAcl?.attrArn;

    // スタック出力
    this.createOutputs();

    // タグ設定
    this.addStackTags();

    console.log('✅ SecurityStack初期化完了');
  }

  /**
   * スタック出力作成（個別デプロイ対応）
   */
  private createOutputs(): void {
    // KMSキー出力（他スタックからの参照用）
    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.security.kmsKey.keyId,
      description: 'Security KMS Key ID',
      exportName: `${this.stackName}-KmsKeyId`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.security.kmsKey.keyArn,
      description: 'Security KMS Key ARN',
      exportName: `${this.stackName}-KmsKeyArn`,
    });

    // WAF WebACL出力（存在する場合のみ）
    if (this.security.wafWebAcl) {
      new cdk.CfnOutput(this, 'WafWebAclId', {
        value: this.security.wafWebAcl.attrId,
        description: 'WAF Web ACL ID',
        exportName: `${this.stackName}-WafWebAclId`,
      });

      new cdk.CfnOutput(this, 'WafWebAclArn', {
        value: this.security.wafWebAcl.attrArn,
        description: 'WAF Web ACL ARN',
        exportName: `${this.stackName}-WafWebAclArn`,
      });
    }

    // GuardDuty出力（存在する場合のみ）
    if (this.security.guardDutyDetector) {
      new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
        value: this.security.guardDutyDetector.attrId,
        description: 'GuardDuty Detector ID',
        exportName: `${this.stackName}-GuardDutyDetectorId`,
      });
    }

    // CloudTrail出力（存在する場合のみ）
    if (this.security.cloudTrail) {
      new cdk.CfnOutput(this, 'CloudTrailArn', {
        value: this.security.cloudTrail.trailArn,
        description: 'CloudTrail ARN',
        exportName: `${this.stackName}-CloudTrailArn`,
      });
    }

    console.log('📤 SecurityStack出力値作成完了');
  }

  /**
   * スタックタグ設定（Agent Steering準拠）
   */
  private addStackTags(): void {
    cdk.Tags.of(this).add('Module', 'Security');
    cdk.Tags.of(this).add('StackType', 'Integrated');
    cdk.Tags.of(this).add('Architecture', 'Modular');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('SecurityCompliance', 'Enabled');
    cdk.Tags.of(this).add('IndividualDeploySupport', 'Yes');
    
    console.log('🏷️ SecurityStackタグ設定完了');
  }
}