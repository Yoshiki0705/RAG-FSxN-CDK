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
import { SecurityConstruct } from '../../modules/security/constructs/security-construct';
export interface SecurityStackProps extends cdk.StackProps {
    readonly config: any;
    readonly namingGenerator?: any;
}
/**
 * 統合セキュリティスタック（モジュラーアーキテクチャ対応）
 *
 * 統合セキュリティコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
export declare class SecurityStack extends cdk.Stack {
    /** 統合セキュリティコンストラクト */
    readonly security: SecurityConstruct;
    /** KMSキー（他スタックからの参照用） */
    readonly kmsKey: cdk.aws_kms.Key;
    /** WAF WebACL ARN（他スタックからの参照用） */
    readonly wafWebAclArn?: string;
    constructor(scope: Construct, id: string, props: SecurityStackProps);
    /**
     * スタック出力作成（個別デプロイ対応）
     */
    private createOutputs;
    /**
     * スタックタグ設定（Agent Steering準拠）
     */
    private addStackTags;
}
