/**
 * セキュリティコンストラクト
 *
 * KMS、WAF、GuardDuty、CloudTrail、IAMの統合管理を提供
 */
import * as kms from 'aws-cdk-lib/aws-kms';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';
import { SecurityConfig, SecurityOutputs } from '../interfaces/security-config';
export interface SecurityConstructProps {
    config: SecurityConfig;
    projectName: string;
    environment: string;
    namingGenerator?: any;
}
export declare class SecurityConstruct extends Construct {
    private props;
    readonly outputs: SecurityOutputs;
    readonly kmsKey: kms.Key;
    readonly wafWebAcl?: wafv2.CfnWebACL;
    readonly guardDutyDetector?: guardduty.CfnDetector;
    readonly cloudTrail?: cloudtrail.Trail;
    constructor(scope: Construct, id: string, props: SecurityConstructProps);
    /**
     * KMS Key作成
     */
    private createKmsKey;
    /**
     * WAF WebACL作成
     */
    private createWafWebAcl;
    /**
     * GuardDuty Detector作成（既存チェック付き）
     */
    private createGuardDutyDetector;
    /**
     * CloudTrail作成
     */
    private createCloudTrail;
    /**
     * AWS Config作成
     */
    private createAwsConfig;
    /**
     * Security Hub作成（一時的に無効化）
     */
    /**
     * IAM設定
     */
    private configureIamSettings;
    /**
     * 出力値作成
     */
    private createOutputs;
    /**
     * 設定値の検証
     */
    private validateConfiguration;
    /**
     * タグ適用
     */
    private applyTags;
    /**
     * CloudTrail用S3バケットポリシーの設定
     * Factory Patternによるポリシー作成の抽象化
     */
    private addCloudTrailBucketPolicies;
    /**
     * CloudTrailポリシー作成ファクトリーメソッド
     * Template Method Patternによる共通処理の抽象化
     */
    private createCloudTrailPolicy;
}
