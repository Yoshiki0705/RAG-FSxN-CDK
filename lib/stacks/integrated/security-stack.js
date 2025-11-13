"use strict";
/**
 * SecurityStack - 統合セキュリティスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合セキュリティコンストラクトによる一元管理
 * - KMS・WAF・GuardDuty・CloudTrail・IAMの統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
// 統合セキュリティコンストラクト（モジュラーアーキテクチャ）
const security_construct_1 = require("../../modules/security/constructs/security-construct");
const bedrock_guardrails_construct_1 = require("../../modules/security/constructs/bedrock-guardrails-construct");
// Guardrailsプリセット
const guardrails_presets_1 = require("../../modules/security/config/guardrails-presets");
// タグ設定
const tagging_config_1 = require("../../config/tagging-config");
/**
 * 統合セキュリティスタック（モジュラーアーキテクチャ対応）
 *
 * 統合セキュリティコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
class SecurityStack extends cdk.Stack {
    /** 統合セキュリティコンストラクト */
    security;
    /** KMSキー（他スタックからの参照用） */
    kmsKey;
    /** WAF WebACL ARN（他スタックからの参照用） */
    wafWebAclArn;
    /** Bedrock Guardrails（Phase 5 - エンタープライズオプション） */
    bedrockGuardrails;
    guardrailArn;
    guardrailId;
    constructor(scope, id, props) {
        super(scope, id, props);
        console.log('🔒 SecurityStack初期化開始...');
        console.log('📝 スタック名:', id);
        console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');
        // コスト配布タグの適用
        const taggingConfig = tagging_config_1.PermissionAwareRAGTags.getStandardConfig(props.projectName, props.environment);
        tagging_config_1.TaggingStrategy.applyTagsToStack(this, taggingConfig);
        // 統合セキュリティコンストラクト作成
        this.security = new security_construct_1.SecurityConstruct(this, 'Security', {
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
    createBedrockGuardrails(props) {
        const presetType = this.node.tryGetContext('guardrailPreset') ?? props.guardrailPreset ?? 'standard';
        const preset = (0, guardrails_presets_1.getGuardrailPreset)(presetType);
        return new bedrock_guardrails_construct_1.BedrockGuardrailsConstruct(this, 'BedrockGuardrails', {
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
    createOutputs() {
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
                value: this.bedrockGuardrails.guardrailArn,
                description: 'Bedrock Guardrail ARN',
                exportName: `${this.stackName}-GuardrailArn`,
            });
            new cdk.CfnOutput(this, 'GuardrailId', {
                value: this.bedrockGuardrails.guardrailId,
                description: 'Bedrock Guardrail ID',
                exportName: `${this.stackName}-GuardrailId`,
            });
            new cdk.CfnOutput(this, 'GuardrailVersion', {
                value: this.bedrockGuardrails.guardrailVersion,
                description: 'Bedrock Guardrail Version',
                exportName: `${this.stackName}-GuardrailVersion`,
            });
        }
        console.log('📤 SecurityStack出力値作成完了');
    }
    /**
     * スタックタグ設定（Agent Steering準拠）
     */
    addStackTags() {
        cdk.Tags.of(this).add('Module', 'Security');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Architecture', 'Modular');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('SecurityCompliance', 'Enabled');
        cdk.Tags.of(this).add('IndividualDeploySupport', 'Yes');
        console.log('🏷️ SecurityStackタグ設定完了');
    }
}
exports.SecurityStack = SecurityStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBR25DLGdDQUFnQztBQUNoQyw2RkFBeUY7QUFDekYsaUhBQTRHO0FBSzVHLGtCQUFrQjtBQUNsQix5RkFBMkc7QUFFM0csT0FBTztBQUNQLGdFQUFzRjtBQWF0Rjs7Ozs7R0FLRztBQUNILE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzFDLHNCQUFzQjtJQUNOLFFBQVEsQ0FBb0I7SUFFNUMseUJBQXlCO0lBQ1QsTUFBTSxDQUFrQjtJQUV4QyxrQ0FBa0M7SUFDbEIsWUFBWSxDQUFVO0lBRXRDLGtEQUFrRDtJQUNsQyxpQkFBaUIsQ0FBOEI7SUFDL0MsWUFBWSxDQUFVO0lBQ3RCLFdBQVcsQ0FBVTtJQUVyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXlCO1FBQ2pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFM0UsYUFBYTtRQUNiLE1BQU0sYUFBYSxHQUFHLHVDQUFzQixDQUFDLGlCQUFpQixDQUM1RCxLQUFLLENBQUMsV0FBVyxFQUNqQixLQUFLLENBQUMsV0FBVyxDQUNsQixDQUFDO1FBQ0YsZ0NBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFF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SyxZQUFZO1FBQ2xCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNqRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4RCxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDekMsQ0FBQztDQUNGO0FBektELHNDQXlLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU2VjdXJpdHlTdGFjayAtIOe1seWQiOOCu+OCreODpeODquODhuOCo+OCueOCv+ODg+OCr++8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo+WvvuW/nO+8iVxuICogXG4gKiDmqZ/og706XG4gKiAtIOe1seWQiOOCu+OCreODpeODquODhuOCo+OCs+ODs+OCueODiOODqeOCr+ODiOOBq+OCiOOCi+S4gOWFg+euoeeQhlxuICogLSBLTVPjg7tXQUbjg7tHdWFyZER1dHnjg7tDbG91ZFRyYWls44O7SUFN44Gu57Wx5ZCIXG4gKiAtIEFnZW50IFN0ZWVyaW5n5rqW5oug5ZG95ZCN6KaP5YmH5a++5b+cXG4gKiAtIOWAi+WIpeOCueOCv+ODg+OCr+ODh+ODl+ODreOCpOWujOWFqOWvvuW/nFxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLy8g57Wx5ZCI44K744Kt44Ol44Oq44OG44Kj44Kz44Oz44K544OI44Op44Kv44OI77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj77yJXG5pbXBvcnQgeyBTZWN1cml0eUNvbnN0cnVjdCB9IGZyb20gJy4uLy4uL21vZHVsZXMvc2VjdXJpdHkvY29uc3RydWN0cy9zZWN1cml0eS1jb25zdHJ1Y3QnO1xuaW1wb3J0IHsgQmVkcm9ja0d1YXJkcmFpbHNDb25zdHJ1Y3QgfSBmcm9tICcuLi8uLi9tb2R1bGVzL3NlY3VyaXR5L2NvbnN0cnVjdHMvYmVkcm9jay1ndWFyZHJhaWxzLWNvbnN0cnVjdCc7XG5cbi8vIOOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuaW1wb3J0IHsgU2VjdXJpdHlDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL3NlY3VyaXR5L2ludGVyZmFjZXMvc2VjdXJpdHktY29uZmlnJztcblxuLy8gR3VhcmRyYWlsc+ODl+ODquOCu+ODg+ODiFxuaW1wb3J0IHsgZ2V0R3VhcmRyYWlsUHJlc2V0LCBHdWFyZHJhaWxQcmVzZXRUeXBlIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9zZWN1cml0eS9jb25maWcvZ3VhcmRyYWlscy1wcmVzZXRzJztcblxuLy8g44K/44Kw6Kit5a6aXG5pbXBvcnQgeyBUYWdnaW5nU3RyYXRlZ3ksIFBlcm1pc3Npb25Bd2FyZVJBR1RhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFnZ2luZy1jb25maWcnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyaXR5U3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcmVhZG9ubHkgY29uZmlnOiBhbnk7IC8vIOe1seWQiOioreWumuOCquODluOCuOOCp+OCr+ODiFxuICByZWFkb25seSBuYW1pbmdHZW5lcmF0b3I/OiBhbnk7IC8vIEFnZW50IFN0ZWVyaW5n5rqW5oug5ZG95ZCN44K444Kn44ON44Os44O844K/44O877yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IHByb2plY3ROYW1lOiBzdHJpbmc7IC8vIOODl+ODreOCuOOCp+OCr+ODiOWQje+8iOOCs+OCueODiOmFjeW4g+eUqO+8iVxuICByZWFkb25seSBlbnZpcm9ubWVudDogc3RyaW5nOyAvLyDnkrDlooPlkI3vvIjjgrPjgrnjg4jphY3luIPnlKjvvIlcbiAgXG4gIC8vIEJlZHJvY2sgR3VhcmRyYWlsc+ioreWumu+8iFBoYXNlIDUgLSDjgqjjg7Pjgr/jg7zjg5fjg6njgqTjgrrjgqrjg5fjgrfjg6fjg7PvvIlcbiAgcmVhZG9ubHkgdXNlQmVkcm9ja0d1YXJkcmFpbHM/OiBib29sZWFuOyAvLyBHdWFyZHJhaWxz5pyJ5Yq55YyW44OV44Op44KwXG4gIHJlYWRvbmx5IGd1YXJkcmFpbFByZXNldD86IEd1YXJkcmFpbFByZXNldFR5cGU7IC8vIOODl+ODquOCu+ODg+ODiOOCv+OCpOODl1xufVxuXG4vKipcbiAqIOe1seWQiOOCu+OCreODpeODquODhuOCo+OCueOCv+ODg+OCr++8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo+WvvuW/nO+8iVxuICogXG4gKiDntbHlkIjjgrvjgq3jg6Xjg6rjg4bjgqPjgrPjg7Pjgrnjg4jjg6njgq/jg4jjgavjgojjgovkuIDlhYPnrqHnkIZcbiAqIOWAi+WIpeOCueOCv+ODg+OCr+ODh+ODl+ODreOCpOWujOWFqOWvvuW/nFxuICovXG5leHBvcnQgY2xhc3MgU2VjdXJpdHlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIC8qKiDntbHlkIjjgrvjgq3jg6Xjg6rjg4bjgqPjgrPjg7Pjgrnjg4jjg6njgq/jg4ggKi9cbiAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5OiBTZWN1cml0eUNvbnN0cnVjdDtcbiAgXG4gIC8qKiBLTVPjgq3jg7zvvIjku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjvvIkgKi9cbiAgcHVibGljIHJlYWRvbmx5IGttc0tleTogY2RrLmF3c19rbXMuS2V5O1xuICBcbiAgLyoqIFdBRiBXZWJBQ0wgQVJO77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJICovXG4gIHB1YmxpYyByZWFkb25seSB3YWZXZWJBY2xBcm4/OiBzdHJpbmc7XG4gIFxuICAvKiogQmVkcm9jayBHdWFyZHJhaWxz77yIUGhhc2UgNSAtIOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCquODl+OCt+ODp+ODs++8iSAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYmVkcm9ja0d1YXJkcmFpbHM/OiBCZWRyb2NrR3VhcmRyYWlsc0NvbnN0cnVjdDtcbiAgcHVibGljIHJlYWRvbmx5IGd1YXJkcmFpbEFybj86IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGd1YXJkcmFpbElkPzogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBTZWN1cml0eVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnNvbGUubG9nKCfwn5SSIFNlY3VyaXR5U3RhY2vliJ3mnJ/ljJbplovlp4suLi4nKTtcbiAgICBjb25zb2xlLmxvZygn8J+TnSDjgrnjgr/jg4Pjgq/lkI06JywgaWQpO1xuICAgIGNvbnNvbGUubG9nKCfwn4+377iPIEFnZW50IFN0ZWVyaW5n5rqW5ougOicsIHByb3BzLm5hbWluZ0dlbmVyYXRvciA/ICdZZXMnIDogJ05vJyk7XG5cbiAgICAvLyDjgrPjgrnjg4jphY3luIPjgr/jgrDjga7pgannlKhcbiAgICBjb25zdCB0YWdnaW5nQ29uZmlnID0gUGVybWlzc2lvbkF3YXJlUkFHVGFncy5nZXRTdGFuZGFyZENvbmZpZyhcbiAgICAgIHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgcHJvcHMuZW52aXJvbm1lbnRcbiAgICApO1xuICAgIFRhZ2dpbmdTdHJhdGVneS5hcHBseVRhZ3NUb1N0YWNrKHRoaXMsIHRhZ2dpbmdDb25maWcpO1xuXG4gICAgLy8g57Wx5ZCI44K744Kt44Ol44Oq44OG44Kj44Kz44Oz44K544OI44Op44Kv44OI5L2c5oiQXG4gICAgdGhpcy5zZWN1cml0eSA9IG5ldyBTZWN1cml0eUNvbnN0cnVjdCh0aGlzLCAnU2VjdXJpdHknLCB7XG4gICAgICBjb25maWc6IHByb3BzLmNvbmZpZy5zZWN1cml0eSxcbiAgICAgIHByb2plY3ROYW1lOiBwcm9wcy5jb25maWcucHJvamVjdC5uYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmNvbmZpZy5lbnZpcm9ubWVudCxcbiAgICAgIG5hbWluZ0dlbmVyYXRvcjogcHJvcHMubmFtaW5nR2VuZXJhdG9yLFxuICAgIH0pO1xuXG4gICAgLy8g5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6aXG4gICAgdGhpcy5rbXNLZXkgPSB0aGlzLnNlY3VyaXR5Lmttc0tleTtcbiAgICB0aGlzLndhZldlYkFjbEFybiA9IHRoaXMuc2VjdXJpdHkud2FmV2ViQWNsPy5hdHRyQXJuO1xuXG4gICAgLy8gQmVkcm9jayBHdWFyZHJhaWxz57Wx5ZCI77yIUGhhc2UgNSAtIOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCquODl+OCt+ODp+ODs++8iVxuICAgIGNvbnN0IHVzZUJlZHJvY2tHdWFyZHJhaWxzID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3VzZUJlZHJvY2tHdWFyZHJhaWxzJykgPz8gcHJvcHMudXNlQmVkcm9ja0d1YXJkcmFpbHMgPz8gZmFsc2U7XG4gICAgaWYgKHVzZUJlZHJvY2tHdWFyZHJhaWxzKSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+boe+4jyBCZWRyb2NrIEd1YXJkcmFpbHPmnInlirnljJYuLi4nKTtcbiAgICAgIHRoaXMuYmVkcm9ja0d1YXJkcmFpbHMgPSB0aGlzLmNyZWF0ZUJlZHJvY2tHdWFyZHJhaWxzKHByb3BzKTtcbiAgICAgIHRoaXMuZ3VhcmRyYWlsQXJuID0gdGhpcy5iZWRyb2NrR3VhcmRyYWlscy5ndWFyZHJhaWxBcm47XG4gICAgICB0aGlzLmd1YXJkcmFpbElkID0gdGhpcy5iZWRyb2NrR3VhcmRyYWlscy5ndWFyZHJhaWxJZDtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQmVkcm9jayBHdWFyZHJhaWxz5L2c5oiQ5a6M5LqGJyk7XG4gICAgfVxuXG4gICAgLy8g44K544K/44OD44Kv5Ye65YqbXG4gICAgdGhpcy5jcmVhdGVPdXRwdXRzKCk7XG5cbiAgICAvLyDjgr/jgrDoqK3lrppcbiAgICB0aGlzLmFkZFN0YWNrVGFncygpO1xuXG4gICAgY29uc29sZS5sb2coJ+KchSBTZWN1cml0eVN0YWNr5Yid5pyf5YyW5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICogQmVkcm9jayBHdWFyZHJhaWxz5L2c5oiQ77yIUGhhc2UgNSAtIOOCqOODs+OCv+ODvOODl+ODqeOCpOOCuuOCquODl+OCt+ODp+ODs++8iVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVCZWRyb2NrR3VhcmRyYWlscyhwcm9wczogU2VjdXJpdHlTdGFja1Byb3BzKTogQmVkcm9ja0d1YXJkcmFpbHNDb25zdHJ1Y3Qge1xuICAgIGNvbnN0IHByZXNldFR5cGUgPSB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnZ3VhcmRyYWlsUHJlc2V0JykgPz8gcHJvcHMuZ3VhcmRyYWlsUHJlc2V0ID8/ICdzdGFuZGFyZCc7XG4gICAgY29uc3QgcHJlc2V0ID0gZ2V0R3VhcmRyYWlsUHJlc2V0KHByZXNldFR5cGUpO1xuXG4gICAgcmV0dXJuIG5ldyBCZWRyb2NrR3VhcmRyYWlsc0NvbnN0cnVjdCh0aGlzLCAnQmVkcm9ja0d1YXJkcmFpbHMnLCB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLnByb2plY3ROYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb3BzLmVudmlyb25tZW50LFxuICAgICAgZ3VhcmRyYWlsTmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LWd1YXJkcmFpbHNgLFxuICAgICAgZGVzY3JpcHRpb246IHByZXNldC5kZXNjcmlwdGlvbixcbiAgICAgIGNvbnRlbnRQb2xpY3lDb25maWc6IHByZXNldC5jb250ZW50UG9saWN5Q29uZmlnLFxuICAgICAgdG9waWNQb2xpY3lDb25maWc6IHByZXNldC50b3BpY1BvbGljeUNvbmZpZyxcbiAgICAgIHNlbnNpdGl2ZUluZm9ybWF0aW9uUG9saWN5Q29uZmlnOiBwcmVzZXQuc2Vuc2l0aXZlSW5mb3JtYXRpb25Qb2xpY3lDb25maWcsXG4gICAgICB3b3JkUG9saWN5Q29uZmlnOiBwcmVzZXQud29yZFBvbGljeUNvbmZpZyxcbiAgICAgIGJsb2NrZWRJbnB1dE1lc3NhZ2luZzogcHJlc2V0LmJsb2NrZWRJbnB1dE1lc3NhZ2luZyxcbiAgICAgIGJsb2NrZWRPdXRwdXRzTWVzc2FnaW5nOiBwcmVzZXQuYmxvY2tlZE91dHB1dHNNZXNzYWdpbmcsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICog44K544K/44OD44Kv5Ye65Yqb5L2c5oiQ77yI5YCL5Yil44OH44OX44Ot44Kk5a++5b+c77yJXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU91dHB1dHMoKTogdm9pZCB7XG4gICAgLy8gS01T44Kt44O85Ye65Yqb77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0ttc0tleUlkJywge1xuICAgICAgdmFsdWU6IHRoaXMuc2VjdXJpdHkua21zS2V5LmtleUlkLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBLTVMgS2V5IElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1LbXNLZXlJZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnS21zS2V5QXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMuc2VjdXJpdHkua21zS2V5LmtleUFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgS01TIEtleSBBUk4nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUttc0tleUFybmAsXG4gICAgfSk7XG5cbiAgICAvLyBXQUYgV2ViQUNM5Ye65Yqb77yI5a2Y5Zyo44GZ44KL5aC05ZCI44Gu44G/77yJXG4gICAgaWYgKHRoaXMuc2VjdXJpdHkud2FmV2ViQWNsKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2FmV2ViQWNsSWQnLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLnNlY3VyaXR5LndhZldlYkFjbC5hdHRySWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV0FGIFdlYiBBQ0wgSUQnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tV2FmV2ViQWNsSWRgLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXYWZXZWJBY2xBcm4nLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLnNlY3VyaXR5LndhZldlYkFjbC5hdHRyQXJuLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dBRiBXZWIgQUNMIEFSTicsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1XYWZXZWJBY2xBcm5gLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR3VhcmREdXR55Ye65Yqb77yI5a2Y5Zyo44GZ44KL5aC05ZCI44Gu44G/77yJXG4gICAgaWYgKHRoaXMuc2VjdXJpdHkuZ3VhcmREdXR5RGV0ZWN0b3IpIHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHdWFyZER1dHlEZXRlY3RvcklkJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5zZWN1cml0eS5ndWFyZER1dHlEZXRlY3Rvci5hdHRySWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnR3VhcmREdXR5IERldGVjdG9yIElEJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUd1YXJkRHV0eURldGVjdG9ySWRgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ2xvdWRUcmFpbOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLnNlY3VyaXR5LmNsb3VkVHJhaWwpIHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZFRyYWlsQXJuJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5zZWN1cml0eS5jbG91ZFRyYWlsLnRyYWlsQXJuLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkVHJhaWwgQVJOJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUNsb3VkVHJhaWxBcm5gLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQmVkcm9jayBHdWFyZHJhaWxz5Ye65Yqb77yI5a2Y5Zyo44GZ44KL5aC05ZCI44Gu44G/77yJXG4gICAgaWYgKHRoaXMuYmVkcm9ja0d1YXJkcmFpbHMpIHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHdWFyZHJhaWxBcm4nLCB7XG4gICAgICAgIHZhbHVlOiB0aGlzLmJlZHJvY2tHdWFyZHJhaWxzLmd1YXJkcmFpbEFybiEsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQmVkcm9jayBHdWFyZHJhaWwgQVJOJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUd1YXJkcmFpbEFybmAsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0d1YXJkcmFpbElkJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5iZWRyb2NrR3VhcmRyYWlscy5ndWFyZHJhaWxJZCEsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQmVkcm9jayBHdWFyZHJhaWwgSUQnLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tR3VhcmRyYWlsSWRgLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHdWFyZHJhaWxWZXJzaW9uJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5iZWRyb2NrR3VhcmRyYWlscy5ndWFyZHJhaWxWZXJzaW9uISxcbiAgICAgICAgZGVzY3JpcHRpb246ICdCZWRyb2NrIEd1YXJkcmFpbCBWZXJzaW9uJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUd1YXJkcmFpbFZlcnNpb25gLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ/Cfk6QgU2VjdXJpdHlTdGFja+WHuuWKm+WApOS9nOaIkOWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+OCv+OCsOioreWumu+8iEFnZW50IFN0ZWVyaW5n5rqW5oug77yJXG4gICAqL1xuICBwcml2YXRlIGFkZFN0YWNrVGFncygpOiB2b2lkIHtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01vZHVsZScsICdTZWN1cml0eScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RhY2tUeXBlJywgJ0ludGVncmF0ZWQnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0FyY2hpdGVjdHVyZScsICdNb2R1bGFyJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdTZWN1cml0eUNvbXBsaWFuY2UnLCAnRW5hYmxlZCcpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnSW5kaXZpZHVhbERlcGxveVN1cHBvcnQnLCAnWWVzJyk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/Cfj7fvuI8gU2VjdXJpdHlTdGFja+OCv+OCsOioreWumuWujOS6hicpO1xuICB9XG59Il19