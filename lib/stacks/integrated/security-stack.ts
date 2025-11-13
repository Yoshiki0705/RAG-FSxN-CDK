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
import { BedrockGuardrailsConstruct } from '../../modules/security/constructs/bedrock-guardrails-construct';

// インターフェース
import { SecurityConfig } from '../../modules/security/interfaces/security-config';

// Guardrailsプリセット
import { getGuardrailPreset, GuardrailPresetType } from '../../modules/security/config/guardrails-presets';

// タグ設定
import { TaggingStrategy, PermissionAwareRAGTags } from '../../config/tagging-config';

export interface SecurityStackProps extends cdk.StackProps {
  readonly config: any; // 統合設定オブジェクト
  readonly namingGenerator?: any; // Agent Steering準拠命名ジェネレーター（オプション）
  readonly projectName: string; // プロジェクト名（コスト配布用）
  readonly environment: string; // 環境名（コスト配布用）
  
  // Bedrock Guardrails設定（Phase 5 - エンタープライズオプション）
  readonly useBedrockGuardrails?: boolean; // Guardrails有効化フラグ
  readonly guardrailPreset?: GuardrailPresetType; // プリセットタイプ
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
  
  /** Bedrock Guardrails（Phase 5 - エンタープライズオプション） */
  public readonly bedrockGuardrails?: BedrockGuardrailsConstruct;
  public readonly guardrailArn?: string;
  public readonly guardrailId?: string;

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

    // Bedrock Guardrails統合（Phase 5 - エンタープライズオプション）
    const useBedrockGuardrails = this.node.tryGetContext('useBedrockGuardrails') ?? props.useBedrockGuardrails ?? false;
    if (useBedrockGuardrails) {
      console.log('🛡️ Bedrock Guardrails有効化...');
      this.bedrockGuardrails = this.createBedrockGuardrails(props);
      this.guardrailArn = this.bedrockGuardrails.guardrailArn;
      this.guardrailId = this.bedrockGuardrails.guardrailId;
      console.log('✅ Bedrock Guardrails作成完了');
    }

    // スタック出力
    this.createOutputs();

    // タグ設定
    this.addStackTags();

    console.log('✅ SecurityStack初期化完了');
  }

  /**
   * Bedrock Guardrails作成（Phase 5 - エンタープライズオプション）
   */
  private createBedrockGuardrails(props: SecurityStackProps): BedrockGuardrailsConstruct {
    const presetType = this.node.tryGetContext('guardrailPreset') ?? props.guardrailPreset ?? 'standard';
    const preset = getGuardrailPreset(presetType);

    return new BedrockGuardrailsConstruct(this, 'BedrockGuardrails', {
      enabled: true,
      projectName: props.projectName,
      environment: props.environment,
      guardrailName: `${props.projectName}-${props.environment}-guardrails`,
      description: preset.description,
      contentPolicyConfig: preset.contentPolicyConfig,
      topicPolicyConfig: preset.topicPolicyConfig,
      sensitiveInformationPolicyConfig: preset.sensitiveInformationPolicyConfig,
      wordPolicyConfig: preset.wordPolicyConfig,
      blockedInputMessaging: preset.blockedInputMessaging,
      blockedOutputsMessaging: preset.blockedOutputsMessaging,
    });
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

    // Bedrock Guardrails出力（存在する場合のみ）
    if (this.bedrockGuardrails) {
      new cdk.CfnOutput(this, 'GuardrailArn', {
        value: this.bedrockGuardrails.guardrailArn!,
        description: 'Bedrock Guardrail ARN',
        exportName: `${this.stackName}-GuardrailArn`,
      });

      new cdk.CfnOutput(this, 'GuardrailId', {
        value: this.bedrockGuardrails.guardrailId!,
        description: 'Bedrock Guardrail ID',
        exportName: `${this.stackName}-GuardrailId`,
      });

      new cdk.CfnOutput(this, 'GuardrailVersion', {
        value: this.bedrockGuardrails.guardrailVersion!,
        description: 'Bedrock Guardrail Version',
        exportName: `${this.stackName}-GuardrailVersion`,
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