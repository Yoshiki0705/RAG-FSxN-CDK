"use strict";
/**
 * Bedrock Guardrailsコンストラクト
 * エンタープライズグレードのコンテンツフィルタリングとPII保護
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
exports.BedrockGuardrailsConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const bedrock = __importStar(require("aws-cdk-lib/aws-bedrock"));
const constructs_1 = require("constructs");
class BedrockGuardrailsConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // enabledフラグがfalseの場合、何も作成しない
        if (!props.enabled) {
            return;
        }
        // Bedrock Guardrail作成
        this.guardrail = this.createGuardrail(props);
        // ARN・ID設定
        this.guardrailArn = this.guardrail.attrGuardrailArn;
        this.guardrailId = this.guardrail.attrGuardrailId;
        this.guardrailVersion = this.guardrail.attrVersion;
        // CloudFormation出力
        new cdk.CfnOutput(this, 'GuardrailArn', {
            value: this.guardrailArn,
            description: 'Bedrock Guardrail ARN',
            exportName: `${props.projectName}-${props.environment}-guardrail-arn`,
        });
        new cdk.CfnOutput(this, 'GuardrailId', {
            value: this.guardrailId,
            description: 'Bedrock Guardrail ID',
            exportName: `${props.projectName}-${props.environment}-guardrail-id`,
        });
        new cdk.CfnOutput(this, 'GuardrailVersion', {
            value: this.guardrailVersion,
            description: 'Bedrock Guardrail Version',
            exportName: `${props.projectName}-${props.environment}-guardrail-version`,
        });
    }
    /**
     * Bedrock Guardrail作成
     */
    createGuardrail(props) {
        const guardrail = new bedrock.CfnGuardrail(this, 'Guardrail', {
            name: props.guardrailName,
            description: props.description,
            blockedInputMessaging: props.blockedInputMessaging || '申し訳ございません。この内容は処理できません。',
            blockedOutputsMessaging: props.blockedOutputsMessaging || '申し訳ございません。この回答は提供できません。',
        });
        // コンテンツポリシー設定
        if (props.contentPolicyConfig) {
            guardrail.contentPolicyConfig = {
                filtersConfig: props.contentPolicyConfig.filtersConfig.map((filter) => ({
                    type: filter.type,
                    inputStrength: filter.inputStrength,
                    outputStrength: filter.outputStrength,
                })),
            };
        }
        // トピックポリシー設定
        if (props.topicPolicyConfig) {
            guardrail.topicPolicyConfig = {
                topicsConfig: props.topicPolicyConfig.topicsConfig.map((topic) => ({
                    name: topic.name,
                    definition: topic.definition,
                    examples: topic.examples,
                    type: topic.type,
                })),
            };
        }
        // 機密情報ポリシー設定
        if (props.sensitiveInformationPolicyConfig) {
            const sensitiveInfoConfig = {};
            if (props.sensitiveInformationPolicyConfig.piiEntitiesConfig) {
                sensitiveInfoConfig.piiEntitiesConfig =
                    props.sensitiveInformationPolicyConfig.piiEntitiesConfig.map((entity) => ({
                        type: entity.type,
                        action: entity.action,
                    }));
            }
            if (props.sensitiveInformationPolicyConfig.regexesConfig) {
                sensitiveInfoConfig.regexesConfig =
                    props.sensitiveInformationPolicyConfig.regexesConfig.map((regex) => ({
                        name: regex.name,
                        pattern: regex.pattern,
                        description: regex.description,
                        action: regex.action,
                    }));
            }
            guardrail.sensitiveInformationPolicyConfig = sensitiveInfoConfig;
        }
        // ワードポリシー設定
        if (props.wordPolicyConfig) {
            const wordConfig = {};
            if (props.wordPolicyConfig.managedWordListsConfig) {
                wordConfig.managedWordListsConfig =
                    props.wordPolicyConfig.managedWordListsConfig.map((list) => ({
                        type: list.type,
                    }));
            }
            if (props.wordPolicyConfig.wordsConfig) {
                wordConfig.wordsConfig = props.wordPolicyConfig.wordsConfig.map((word) => ({
                    text: word.text,
                }));
            }
            guardrail.wordPolicyConfig = wordConfig;
        }
        return guardrail;
    }
}
exports.BedrockGuardrailsConstruct = BedrockGuardrailsConstruct;
