"use strict";
/**
 * セキュリティコンストラクト
 *
 * KMS、WAF、GuardDuty、CloudTrail、IAMの統合管理を提供
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
exports.SecurityConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const kms = __importStar(require("aws-cdk-lib/aws-kms"));
const wafv2 = __importStar(require("aws-cdk-lib/aws-wafv2"));
const cloudtrail = __importStar(require("aws-cdk-lib/aws-cloudtrail"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const constructs_1 = require("constructs");
class SecurityConstruct extends constructs_1.Construct {
    props;
    outputs;
    kmsKey;
    wafWebAcl;
    guardDutyDetector;
    cloudTrail;
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
        // 設定値の検証
        this.validateConfiguration();
        // KMS Key作成
        this.kmsKey = this.createKmsKey();
        // WAF WebACL作成
        if (this.props.config.waf.enabled) {
            this.wafWebAcl = this.createWafWebAcl();
        }
        // GuardDuty Detector作成（一時的に無効化）
        // if (this.props.config.guardDuty.enabled) {
        //   this.guardDutyDetector = this.createGuardDutyDetector();
        // }
        // CloudTrail作成（一時的に無効化）
        // if (this.props.config.cloudTrail.enabled) {
        //   this.cloudTrail = this.createCloudTrail();
        // }
        // AWS Config作成（一時的に無効化）
        // if (this.props.config.config.enabled) {
        //   this.createAwsConfig();
        // }
        // Security Hub作成（一時的に無効化）
        // if (this.props.config.monitoring.enableSecurityHub) {
        //   this.createSecurityHub();
        // }
        // IAM設定
        this.configureIamSettings();
        // 出力値の設定
        this.outputs = this.createOutputs();
        // タグ設定
        this.applyTags();
    }
    /**
     * KMS Key作成
     */
    createKmsKey() {
        const key = new kms.Key(this, 'SecurityKey', {
            description: `${this.props.projectName} Security Key`,
            enableKeyRotation: this.props.config.kms.enableKeyRotation,
            keySpec: kms.KeySpec[this.props.config.kms.keySpec],
            keyUsage: kms.KeyUsage[this.props.config.kms.keyUsage],
            removalPolicy: this.props.environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        // KMS Key Alias作成
        new kms.Alias(this, 'SecurityKeyAlias', {
            aliasName: `alias/${this.props.projectName}-${this.props.environment}-security`,
            targetKey: key,
        });
        return key;
    }
    /**
     * WAF WebACL作成
     */
    createWafWebAcl() {
        // CloudFrontスコープのWAFはus-east-1でのみ作成可能
        // ap-northeast-1ではREGIONALスコープのみ使用可能
        if (this.props.config.waf.scope === 'CLOUDFRONT' && cdk.Stack.of(this).region !== 'us-east-1') {
            console.warn('CloudFront WAF is only supported in us-east-1. Skipping WAF creation.');
            return undefined;
        }
        const rules = [];
        // AWS Managed Rules
        if (this.props.config.waf.rules.enableAWSManagedRules) {
            rules.push({
                name: 'AWSManagedRulesCommonRuleSet',
                priority: 1,
                overrideAction: { none: {} },
                statement: {
                    managedRuleGroupStatement: {
                        vendorName: 'AWS',
                        name: 'AWSManagedRulesCommonRuleSet',
                    },
                },
                visibilityConfig: {
                    sampledRequestsEnabled: true,
                    cloudWatchMetricsEnabled: true,
                    metricName: 'CommonRuleSetMetric',
                },
            });
        }
        // Rate Limiting Rule
        if (this.props.config.waf.rules.enableRateLimiting) {
            rules.push({
                name: 'RateLimitRule',
                priority: 2,
                action: { block: {} },
                statement: {
                    rateBasedStatement: {
                        limit: this.props.config.waf.rules.rateLimit,
                        aggregateKeyType: 'IP',
                    },
                },
                visibilityConfig: {
                    sampledRequestsEnabled: true,
                    cloudWatchMetricsEnabled: true,
                    metricName: 'RateLimitMetric',
                },
            });
        }
        // Geo Blocking Rule
        if (this.props.config.waf.rules.enableGeoBlocking && this.props.config.waf.rules.blockedCountries) {
            rules.push({
                name: 'GeoBlockingRule',
                priority: 3,
                action: { block: {} },
                statement: {
                    geoMatchStatement: {
                        countryCodes: this.props.config.waf.rules.blockedCountries,
                    },
                },
                visibilityConfig: {
                    sampledRequestsEnabled: true,
                    cloudWatchMetricsEnabled: true,
                    metricName: 'GeoBlockingMetric',
                },
            });
        }
        return new wafv2.CfnWebACL(this, 'WebACL', {
            scope: this.props.config.waf.scope,
            defaultAction: { allow: {} },
            rules,
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: `${this.props.projectName}WebACLMetric`,
            },
            name: `${this.props.projectName}-${this.props.environment}-waf`,
            description: `WAF WebACL for ${this.props.projectName}`,
        });
    }
    /**
     * GuardDuty Detector作成（既存チェック付き）
     */
    createGuardDutyDetector() {
        // 設定による制御
        if (!this.props.config.guardDuty.enabled) {
            cdk.Annotations.of(this).addInfo('GuardDuty Detector: 設定により無効化されています。' +
                '有効化する場合は config.guardDuty.enabled を true に設定してください。');
            return undefined;
        }
        // 既存のDetectorとの競合チェック
        cdk.Annotations.of(this).addWarning('GuardDuty Detector: 既存のDetectorとの競合を避けるため一時的に無効化されています。' +
            '本番環境では既存のGuardDuty設定の使用を推奨します。');
        return undefined;
        // 以下は将来的に有効化する場合のコード
        /*
        return new guardduty.CfnDetector(this, 'GuardDutyDetector', {
          enable: true,
          findingPublishingFrequency: this.props.config.guardDuty.findingPublishingFrequency,
          dataSources: {
            s3Logs: {
              enable: this.props.config.guardDuty.enableS3Protection,
            },
            kubernetes: {
              auditLogs: {
                enable: this.props.config.guardDuty.enableEKSProtection,
              },
            },
            malwareProtection: {
              scanEc2InstanceWithFindings: {
                ebsVolumes: this.props.config.guardDuty.enableMalwareProtection,
              },
            },
          },
        });
        */
    }
    /**
     * CloudTrail作成
     */
    createCloudTrail() {
        // CloudTrail用S3バケット作成
        const bucketName = this.props.config.cloudTrail.s3BucketName ||
            `${this.props.projectName}-${this.props.environment}-cloudtrail-${cdk.Stack.of(this).account}`;
        const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
            bucketName: bucketName,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: this.kmsKey,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            lifecycleRules: [{
                    id: 'CloudTrailLogRetention',
                    enabled: true,
                    transitions: [{
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(30),
                        }, {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(90),
                        }],
                    expiration: cdk.Duration.days(365),
                }],
            removalPolicy: this.props.environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        // CloudTrail用のバケットポリシーを追加
        this.addCloudTrailBucketPolicies(cloudTrailBucket);
        return new cloudtrail.Trail(this, 'CloudTrail', {
            bucket: cloudTrailBucket,
            s3KeyPrefix: this.props.config.cloudTrail.s3KeyPrefix || 'cloudtrail-logs/',
            includeGlobalServiceEvents: this.props.config.cloudTrail.includeGlobalServiceEvents,
            isMultiRegionTrail: this.props.config.cloudTrail.isMultiRegionTrail,
            enableFileValidation: this.props.config.cloudTrail.enableLogFileValidation,
            encryptionKey: this.kmsKey,
            sendToCloudWatchLogs: true,
        });
    }
    /**
     * AWS Config作成
     */
    createAwsConfig() {
        // AWS Configは一時的に無効化（管理ポリシーの問題を避けるため）
        console.log('AWS Configは管理ポリシーの問題を避けるため一時的に無効化されています');
        // 以下は将来的に有効化する場合のコード
        /*
        // Config用S3バケット作成
        const bucketName = this.props.config.config.s3BucketName ||
          `${this.props.projectName}-${this.props.environment}-config-${cdk.Stack.of(this).account}`;
        
        const configBucket = new s3.Bucket(this, 'ConfigBucket', {
          bucketName: bucketName,
          encryption: s3.BucketEncryption.KMS,
          encryptionKey: this.kmsKey,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          versioned: true,
          removalPolicy: this.props.environment === 'prod'
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        });
    
        // Config Service Role作成
        const configRole = new iam.Role(this, 'ConfigRole', {
          assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole'),
          ],
        });
    
        // Config Configuration Recorder作成
        new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
          name: `${this.props.projectName}-${this.props.environment}-recorder`,
          roleArn: configRole.roleArn,
          recordingGroup: {
            allSupported: this.props.config.config.enableAllSupported,
            includeGlobalResourceTypes: this.props.config.config.includeGlobalResourceTypes,
          },
        });
    
        // Config Delivery Channel作成
        new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
          name: `${this.props.projectName}-${this.props.environment}-delivery-channel`,
          s3BucketName: configBucket.bucketName,
        });
        */
    }
    /**
     * Security Hub作成（一時的に無効化）
     */
    // private createSecurityHub(): void {
    //   new securityhub.CfnHub(this, 'SecurityHub', {
    //     tags: {
    //       'Name': `${this.props.projectName}-${this.props.environment}-security-hub`,
    //     },
    //   });
    // }
    /**
     * IAM設定
     */
    configureIamSettings() {
        // Access Analyzer作成（一時的に無効化 - 制限超過のため）
        // if (this.props.config.iam.enableAccessAnalyzer) {
        //   new cdk.CfnResource(this, 'AccessAnalyzer', {
        //     type: 'AWS::AccessAnalyzer::Analyzer',
        //     properties: {
        //       Type: 'ACCOUNT',
        //       AnalyzerName: `${this.props.projectName}-${this.props.environment}-access-analyzer`,
        //     },
        //   });
        // }
        // パスワードポリシー設定は一時的に無効化（CloudFormationでサポートされていないため）
        // 代替手段: AWS CLIまたはAWS Consoleで手動設定が必要
        console.log('IAM設定が完了しました（Access Analyzerは一時的に無効化）');
    }
    /**
     * 出力値作成
     */
    createOutputs() {
        return {
            kmsKeyId: this.kmsKey.keyId,
            kmsKeyArn: this.kmsKey.keyArn,
            wafWebAclId: this.wafWebAcl?.attrId,
            wafWebAclArn: this.wafWebAcl?.attrArn,
            guardDutyDetectorId: this.guardDutyDetector?.attrId,
            // cloudTrailArn: this.cloudTrail?.trailArn, // 一時的に無効化
        };
    }
    /**
     * 設定値の検証
     */
    validateConfiguration() {
        console.log('🔍 デバッグ: 検証開始 - プロジェクト名 =', this.props.projectName);
        console.log('🔍 デバッグ: 検証開始 - 環境名 =', this.props.environment);
        console.log('🔍 デバッグ: props全体 =', JSON.stringify(this.props, null, 2));
        // プロジェクト名の検証
        if (!this.props.projectName || this.props.projectName.length === 0) {
            throw new Error('プロジェクト名が設定されていません');
        }
        // 環境名の検証
        const validEnvironments = ['dev', 'staging', 'prod'];
        if (!validEnvironments.includes(this.props.environment)) {
            throw new Error(`無効な環境名です: ${this.props.environment}`);
        }
    }
    /**
     * タグ適用
     */
    applyTags() {
        const tags = this.props.config.tags;
        cdk.Tags.of(this).add('SecurityLevel', tags.SecurityLevel);
        cdk.Tags.of(this).add('EncryptionRequired', tags.EncryptionRequired.toString());
        if (tags.ComplianceFramework) {
            cdk.Tags.of(this).add('ComplianceFramework', tags.ComplianceFramework);
        }
        if (tags.DataClassification) {
            cdk.Tags.of(this).add('DataClassification', tags.DataClassification);
        }
    }
    /**
     * CloudTrail用S3バケットポリシーの設定
     * Factory Patternによるポリシー作成の抽象化
     */
    addCloudTrailBucketPolicies(bucket) {
        // 定数定義による保守性向上
        const CLOUDTRAIL_SERVICE = 'cloudtrail.amazonaws.com';
        const S3_ACL_CONDITION_KEY = 's3:x-amz-acl';
        const BUCKET_OWNER_FULL_CONTROL = 'bucket-owner-full-control';
        // CloudTrail ACLチェック権限
        const aclCheckPolicy = this.createCloudTrailPolicy({
            sid: 'AWSCloudTrailAclCheck',
            actions: ['s3:GetBucketAcl'],
            resources: [bucket.bucketArn],
            servicePrincipal: CLOUDTRAIL_SERVICE,
        });
        // CloudTrail書き込み権限
        const writePolicy = this.createCloudTrailPolicy({
            sid: 'AWSCloudTrailWrite',
            actions: ['s3:PutObject'],
            resources: [`${bucket.bucketArn}/*`],
            servicePrincipal: CLOUDTRAIL_SERVICE,
            conditions: {
                StringEquals: {
                    [S3_ACL_CONDITION_KEY]: BUCKET_OWNER_FULL_CONTROL,
                },
            },
        });
        // ポリシーをバケットに適用
        bucket.addToResourcePolicy(aclCheckPolicy);
        bucket.addToResourcePolicy(writePolicy);
        console.log('✅ CloudTrail用S3バケットポリシー設定完了');
    }
    /**
     * CloudTrailポリシー作成ファクトリーメソッド
     * Template Method Patternによる共通処理の抽象化
     */
    createCloudTrailPolicy(config) {
        const policyConfig = {
            sid: config.sid,
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal(config.servicePrincipal)],
            actions: config.actions,
            resources: config.resources,
        };
        // 条件が指定されている場合のみ追加
        if (config.conditions) {
            policyConfig.conditions = config.conditions;
        }
        return new iam.PolicyStatement(policyConfig);
    }
}
exports.SecurityConstruct = SecurityConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktY29uc3RydWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VjdXJpdHktY29uc3RydWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztHQUlHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUNuQyx5REFBMkM7QUFDM0MsNkRBQStDO0FBRS9DLHVFQUF5RDtBQUV6RCx5REFBMkM7QUFDM0MsdURBQXlDO0FBQ3pDLDJDQUF1QztBQVV2QyxNQUFhLGlCQUFrQixTQUFRLHNCQUFTO0lBT0k7SUFObEMsT0FBTyxDQUFrQjtJQUN6QixNQUFNLENBQVU7SUFDaEIsU0FBUyxDQUFtQjtJQUM1QixpQkFBaUIsQ0FBeUI7SUFDMUMsVUFBVSxDQUFvQjtJQUU5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFVLEtBQTZCO1FBQzdFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFEK0IsVUFBSyxHQUFMLEtBQUssQ0FBd0I7UUFHN0UsU0FBUztRQUNULElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBRTdCLFlBQVk7UUFDWixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUVsQyxlQUFlO1FBQ2YsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDMUMsQ0FBQztRQUVELGdDQUFnQztRQUNoQyw2Q0FBNkM7UUFDN0MsNkRBQTZEO1FBQzdELElBQUk7UUFFSix3QkFBd0I7UUFDeEIsOENBQThDO1FBQzlDLCtDQUErQztRQUMvQyxJQUFJO1FBRUosd0JBQXdCO1FBQ3hCLDBDQUEwQztRQUMxQyw0QkFBNEI7UUFDNUIsSUFBSTtRQUVKLDBCQUEwQjtRQUMxQix3REFBd0Q7UUFDeEQsOEJBQThC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T0FBTyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUNGO0FBOWJELDhDQThiQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog44K744Kt44Ol44Oq44OG44Kj44Kz44Oz44K544OI44Op44Kv44OIXG4gKiBcbiAqIEtNU+OAgVdBRuOAgUd1YXJkRHV0eeOAgUNsb3VkVHJhaWzjgIFJQU3jga7ntbHlkIjnrqHnkIbjgpLmj5DkvptcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuaW1wb3J0ICogYXMgd2FmdjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXdhZnYyJztcbmltcG9ydCAqIGFzIGd1YXJkZHV0eSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZ3VhcmRkdXR5JztcbmltcG9ydCAqIGFzIGNsb3VkdHJhaWwgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkdHJhaWwnO1xuaW1wb3J0ICogYXMgY29uZmlnIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb25maWcnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgU2VjdXJpdHlDb25maWcsIFNlY3VyaXR5T3V0cHV0cyB9IGZyb20gJy4uL2ludGVyZmFjZXMvc2VjdXJpdHktY29uZmlnJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eUNvbnN0cnVjdFByb3BzIHtcbiAgY29uZmlnOiBTZWN1cml0eUNvbmZpZztcbiAgcHJvamVjdE5hbWU6IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgbmFtaW5nR2VuZXJhdG9yPzogYW55OyAvLyBBZ2VudCBTdGVlcmluZ+a6luaLoOWRveWQjeimj+WJh+OCuOOCp+ODjeODrOODvOOCv+ODvO+8iOOCquODl+OCt+ODp+ODs++8iVxufVxuXG5leHBvcnQgY2xhc3MgU2VjdXJpdHlDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgb3V0cHV0czogU2VjdXJpdHlPdXRwdXRzO1xuICBwdWJsaWMgcmVhZG9ubHkga21zS2V5OiBrbXMuS2V5O1xuICBwdWJsaWMgcmVhZG9ubHkgd2FmV2ViQWNsPzogd2FmdjIuQ2ZuV2ViQUNMO1xuICBwdWJsaWMgcmVhZG9ubHkgZ3VhcmREdXR5RGV0ZWN0b3I/OiBndWFyZGR1dHkuQ2ZuRGV0ZWN0b3I7XG4gIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsPzogY2xvdWR0cmFpbC5UcmFpbDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcml2YXRlIHByb3BzOiBTZWN1cml0eUNvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIOioreWumuWApOOBruaknOiovFxuICAgIHRoaXMudmFsaWRhdGVDb25maWd1cmF0aW9uKCk7XG5cbiAgICAvLyBLTVMgS2V55L2c5oiQXG4gICAgdGhpcy5rbXNLZXkgPSB0aGlzLmNyZWF0ZUttc0tleSgpO1xuXG4gICAgLy8gV0FGIFdlYkFDTOS9nOaIkFxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy53YWYuZW5hYmxlZCkge1xuICAgICAgdGhpcy53YWZXZWJBY2wgPSB0aGlzLmNyZWF0ZVdhZldlYkFjbCgpO1xuICAgIH1cblxuICAgIC8vIEd1YXJkRHV0eSBEZXRlY3RvcuS9nOaIkO+8iOS4gOaZgueahOOBq+eEoeWKueWMlu+8iVxuICAgIC8vIGlmICh0aGlzLnByb3BzLmNvbmZpZy5ndWFyZER1dHkuZW5hYmxlZCkge1xuICAgIC8vICAgdGhpcy5ndWFyZER1dHlEZXRlY3RvciA9IHRoaXMuY3JlYXRlR3VhcmREdXR5RGV0ZWN0b3IoKTtcbiAgICAvLyB9XG5cbiAgICAvLyBDbG91ZFRyYWls5L2c5oiQ77yI5LiA5pmC55qE44Gr54Sh5Yq55YyW77yJXG4gICAgLy8gaWYgKHRoaXMucHJvcHMuY29uZmlnLmNsb3VkVHJhaWwuZW5hYmxlZCkge1xuICAgIC8vICAgdGhpcy5jbG91ZFRyYWlsID0gdGhpcy5jcmVhdGVDbG91ZFRyYWlsKCk7XG4gICAgLy8gfVxuXG4gICAgLy8gQVdTIENvbmZpZ+S9nOaIkO+8iOS4gOaZgueahOOBq+eEoeWKueWMlu+8iVxuICAgIC8vIGlmICh0aGlzLnByb3BzLmNvbmZpZy5jb25maWcuZW5hYmxlZCkge1xuICAgIC8vICAgdGhpcy5jcmVhdGVBd3NDb25maWcoKTtcbiAgICAvLyB9XG5cbiAgICAvLyBTZWN1cml0eSBIdWLkvZzmiJDvvIjkuIDmmYLnmoTjgavnhKHlirnljJbvvIlcbiAgICAvLyBpZiAodGhpcy5wcm9wcy5jb25maWcubW9uaXRvcmluZy5lbmFibGVTZWN1cml0eUh1Yikge1xuICAgIC8vICAgdGhpcy5jcmVhdGVTZWN1cml0eUh1YigpO1xuICAgIC8vIH1cblxuICAgIC8vIElBTeioreWumlxuICAgIHRoaXMuY29uZmlndXJlSWFtU2V0dGluZ3MoKTtcblxuICAgIC8vIOWHuuWKm+WApOOBruioreWumlxuICAgIHRoaXMub3V0cHV0cyA9IHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgLy8g44K/44Kw6Kit5a6aXG4gICAgdGhpcy5hcHBseVRhZ3MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBLTVMgS2V55L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUttc0tleSgpOiBrbXMuS2V5IHtcbiAgICBjb25zdCBrZXkgPSBuZXcga21zLktleSh0aGlzLCAnU2VjdXJpdHlLZXknLCB7XG4gICAgICBkZXNjcmlwdGlvbjogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0gU2VjdXJpdHkgS2V5YCxcbiAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0aGlzLnByb3BzLmNvbmZpZy5rbXMuZW5hYmxlS2V5Um90YXRpb24sXG4gICAgICBrZXlTcGVjOiBrbXMuS2V5U3BlY1t0aGlzLnByb3BzLmNvbmZpZy5rbXMua2V5U3BlY10sXG4gICAgICBrZXlVc2FnZToga21zLktleVVzYWdlW3RoaXMucHJvcHMuY29uZmlnLmttcy5rZXlVc2FnZV0sXG4gICAgICByZW1vdmFsUG9saWN5OiB0aGlzLnByb3BzLmVudmlyb25tZW50ID09PSAncHJvZCcgXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOIFxuICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBLTVMgS2V5IEFsaWFz5L2c5oiQXG4gICAgbmV3IGttcy5BbGlhcyh0aGlzLCAnU2VjdXJpdHlLZXlBbGlhcycsIHtcbiAgICAgIGFsaWFzTmFtZTogYGFsaWFzLyR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1zZWN1cml0eWAsXG4gICAgICB0YXJnZXRLZXk6IGtleSxcbiAgICB9KTtcblxuICAgIHJldHVybiBrZXk7XG4gIH1cblxuICAvKipcbiAgICogV0FGIFdlYkFDTOS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVXYWZXZWJBY2woKTogd2FmdjIuQ2ZuV2ViQUNMIHwgdW5kZWZpbmVkIHtcbiAgICAvLyBDbG91ZEZyb25044K544Kz44O844OX44GuV0FG44GvdXMtZWFzdC0x44Gn44Gu44G/5L2c5oiQ5Y+v6IO9XG4gICAgLy8gYXAtbm9ydGhlYXN0LTHjgafjga9SRUdJT05BTOOCueOCs+ODvOODl+OBruOBv+S9v+eUqOWPr+iDvVxuICAgIGlmICh0aGlzLnByb3BzLmNvbmZpZy53YWYuc2NvcGUgPT09ICdDTE9VREZST05UJyAmJiBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uICE9PSAndXMtZWFzdC0xJykge1xuICAgICAgY29uc29sZS53YXJuKCdDbG91ZEZyb250IFdBRiBpcyBvbmx5IHN1cHBvcnRlZCBpbiB1cy1lYXN0LTEuIFNraXBwaW5nIFdBRiBjcmVhdGlvbi4nKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IHJ1bGVzOiB3YWZ2Mi5DZm5XZWJBQ0wuUnVsZVByb3BlcnR5W10gPSBbXTtcblxuICAgIC8vIEFXUyBNYW5hZ2VkIFJ1bGVzXG4gICAgaWYgKHRoaXMucHJvcHMuY29uZmlnLndhZi5ydWxlcy5lbmFibGVBV1NNYW5hZ2VkUnVsZXMpIHtcbiAgICAgIHJ1bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiAnQVdTTWFuYWdlZFJ1bGVzQ29tbW9uUnVsZVNldCcsXG4gICAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgICBvdmVycmlkZUFjdGlvbjogeyBub25lOiB7fSB9LFxuICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICBtYW5hZ2VkUnVsZUdyb3VwU3RhdGVtZW50OiB7XG4gICAgICAgICAgICB2ZW5kb3JOYW1lOiAnQVdTJyxcbiAgICAgICAgICAgIG5hbWU6ICdBV1NNYW5hZ2VkUnVsZXNDb21tb25SdWxlU2V0JyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgc2FtcGxlZFJlcXVlc3RzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ0NvbW1vblJ1bGVTZXRNZXRyaWMnLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gUmF0ZSBMaW1pdGluZyBSdWxlXG4gICAgaWYgKHRoaXMucHJvcHMuY29uZmlnLndhZi5ydWxlcy5lbmFibGVSYXRlTGltaXRpbmcpIHtcbiAgICAgIHJ1bGVzLnB1c2goe1xuICAgICAgICBuYW1lOiAnUmF0ZUxpbWl0UnVsZScsXG4gICAgICAgIHByaW9yaXR5OiAyLFxuICAgICAgICBhY3Rpb246IHsgYmxvY2s6IHt9IH0sXG4gICAgICAgIHN0YXRlbWVudDoge1xuICAgICAgICAgIHJhdGVCYXNlZFN0YXRlbWVudDoge1xuICAgICAgICAgICAgbGltaXQ6IHRoaXMucHJvcHMuY29uZmlnLndhZi5ydWxlcy5yYXRlTGltaXQsXG4gICAgICAgICAgICBhZ2dyZWdhdGVLZXlUeXBlOiAnSVAnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHZpc2liaWxpdHlDb25maWc6IHtcbiAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgIGNsb3VkV2F0Y2hNZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnUmF0ZUxpbWl0TWV0cmljJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEdlbyBCbG9ja2luZyBSdWxlXG4gICAgaWYgKHRoaXMucHJvcHMuY29uZmlnLndhZi5ydWxlcy5lbmFibGVHZW9CbG9ja2luZyAmJiB0aGlzLnByb3BzLmNvbmZpZy53YWYucnVsZXMuYmxvY2tlZENvdW50cmllcykge1xuICAgICAgcnVsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6ICdHZW9CbG9ja2luZ1J1bGUnLFxuICAgICAgICBwcmlvcml0eTogMyxcbiAgICAgICAgYWN0aW9uOiB7IGJsb2NrOiB7fSB9LFxuICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICBnZW9NYXRjaFN0YXRlbWVudDoge1xuICAgICAgICAgICAgY291bnRyeUNvZGVzOiB0aGlzLnByb3BzLmNvbmZpZy53YWYucnVsZXMuYmxvY2tlZENvdW50cmllcyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgc2FtcGxlZFJlcXVlc3RzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ0dlb0Jsb2NraW5nTWV0cmljJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgd2FmdjIuQ2ZuV2ViQUNMKHRoaXMsICdXZWJBQ0wnLCB7XG4gICAgICBzY29wZTogdGhpcy5wcm9wcy5jb25maWcud2FmLnNjb3BlLFxuICAgICAgZGVmYXVsdEFjdGlvbjogeyBhbGxvdzoge30gfSxcbiAgICAgIHJ1bGVzLFxuICAgICAgdmlzaWJpbGl0eUNvbmZpZzoge1xuICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIG1ldHJpY05hbWU6IGAke3RoaXMucHJvcHMucHJvamVjdE5hbWV9V2ViQUNMTWV0cmljYCxcbiAgICAgIH0sXG4gICAgICBuYW1lOiBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LXdhZmAsXG4gICAgICBkZXNjcmlwdGlvbjogYFdBRiBXZWJBQ0wgZm9yICR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX1gLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEd1YXJkRHV0eSBEZXRlY3RvcuS9nOaIkO+8iOaXouWtmOODgeOCp+ODg+OCr+S7mOOBje+8iVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVHdWFyZER1dHlEZXRlY3RvcigpOiBndWFyZGR1dHkuQ2ZuRGV0ZWN0b3IgfCB1bmRlZmluZWQge1xuICAgIC8vIOioreWumuOBq+OCiOOCi+WItuW+oVxuICAgIGlmICghdGhpcy5wcm9wcy5jb25maWcuZ3VhcmREdXR5LmVuYWJsZWQpIHtcbiAgICAgIGNkay5Bbm5vdGF0aW9ucy5vZih0aGlzKS5hZGRJbmZvKFxuICAgICAgICAnR3VhcmREdXR5IERldGVjdG9yOiDoqK3lrprjgavjgojjgornhKHlirnljJbjgZXjgozjgabjgYTjgb7jgZnjgIInICtcbiAgICAgICAgJ+acieWKueWMluOBmeOCi+WgtOWQiOOBryBjb25maWcuZ3VhcmREdXR5LmVuYWJsZWQg44KSIHRydWUg44Gr6Kit5a6a44GX44Gm44GP44Gg44GV44GE44CCJ1xuICAgICAgKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8g5pei5a2Y44GuRGV0ZWN0b3Ljgajjga7nq7blkIjjg4Hjgqfjg4Pjgq9cbiAgICBjZGsuQW5ub3RhdGlvbnMub2YodGhpcykuYWRkV2FybmluZyhcbiAgICAgICdHdWFyZER1dHkgRGV0ZWN0b3I6IOaXouWtmOOBrkRldGVjdG9y44Go44Gu56u25ZCI44KS6YG/44GR44KL44Gf44KB5LiA5pmC55qE44Gr54Sh5Yq55YyW44GV44KM44Gm44GE44G+44GZ44CCJyArXG4gICAgICAn5pys55Wq55Kw5aKD44Gn44Gv5pei5a2Y44GuR3VhcmREdXR56Kit5a6a44Gu5L2/55So44KS5o6o5aWo44GX44G+44GZ44CCJ1xuICAgICk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBcbiAgICAvLyDku6XkuIvjga/lsIbmnaXnmoTjgavmnInlirnljJbjgZnjgovloLTlkIjjga7jgrPjg7zjg4lcbiAgICAvKlxuICAgIHJldHVybiBuZXcgZ3VhcmRkdXR5LkNmbkRldGVjdG9yKHRoaXMsICdHdWFyZER1dHlEZXRlY3RvcicsIHtcbiAgICAgIGVuYWJsZTogdHJ1ZSxcbiAgICAgIGZpbmRpbmdQdWJsaXNoaW5nRnJlcXVlbmN5OiB0aGlzLnByb3BzLmNvbmZpZy5ndWFyZER1dHkuZmluZGluZ1B1Ymxpc2hpbmdGcmVxdWVuY3ksXG4gICAgICBkYXRhU291cmNlczoge1xuICAgICAgICBzM0xvZ3M6IHtcbiAgICAgICAgICBlbmFibGU6IHRoaXMucHJvcHMuY29uZmlnLmd1YXJkRHV0eS5lbmFibGVTM1Byb3RlY3Rpb24sXG4gICAgICAgIH0sXG4gICAgICAgIGt1YmVybmV0ZXM6IHtcbiAgICAgICAgICBhdWRpdExvZ3M6IHtcbiAgICAgICAgICAgIGVuYWJsZTogdGhpcy5wcm9wcy5jb25maWcuZ3VhcmREdXR5LmVuYWJsZUVLU1Byb3RlY3Rpb24sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWFsd2FyZVByb3RlY3Rpb246IHtcbiAgICAgICAgICBzY2FuRWMySW5zdGFuY2VXaXRoRmluZGluZ3M6IHtcbiAgICAgICAgICAgIGVic1ZvbHVtZXM6IHRoaXMucHJvcHMuY29uZmlnLmd1YXJkRHV0eS5lbmFibGVNYWx3YXJlUHJvdGVjdGlvbixcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgICAqL1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3VkVHJhaWzkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQ2xvdWRUcmFpbCgpOiBjbG91ZHRyYWlsLlRyYWlsIHtcbiAgICAvLyBDbG91ZFRyYWls55SoUzPjg5DjgrHjg4Pjg4jkvZzmiJBcbiAgICBjb25zdCBidWNrZXROYW1lID0gdGhpcy5wcm9wcy5jb25maWcuY2xvdWRUcmFpbC5zM0J1Y2tldE5hbWUgfHwgXG4gICAgICBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LWNsb3VkdHJhaWwtJHtjZGsuU3RhY2sub2YodGhpcykuYWNjb3VudH1gO1xuICAgIFxuICAgIGNvbnN0IGNsb3VkVHJhaWxCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdDbG91ZFRyYWlsQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYnVja2V0TmFtZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TLFxuICAgICAgZW5jcnlwdGlvbktleTogdGhpcy5rbXNLZXksXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFt7XG4gICAgICAgIGlkOiAnQ2xvdWRUcmFpbExvZ1JldGVudGlvbicsXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIHRyYW5zaXRpb25zOiBbe1xuICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLklORlJFUVVFTlRfQUNDRVNTLFxuICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgICB9LCB7XG4gICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuR0xBQ0lFUixcbiAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDkwKSxcbiAgICAgICAgfV0sXG4gICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDM2NSksXG4gICAgICB9XSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IHRoaXMucHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kJyBcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkVHJhaWznlKjjga7jg5DjgrHjg4Pjg4jjg53jg6rjgrfjg7zjgpLov73liqBcbiAgICB0aGlzLmFkZENsb3VkVHJhaWxCdWNrZXRQb2xpY2llcyhjbG91ZFRyYWlsQnVja2V0KTtcblxuICAgIHJldHVybiBuZXcgY2xvdWR0cmFpbC5UcmFpbCh0aGlzLCAnQ2xvdWRUcmFpbCcsIHtcbiAgICAgIGJ1Y2tldDogY2xvdWRUcmFpbEJ1Y2tldCxcbiAgICAgIHMzS2V5UHJlZml4OiB0aGlzLnByb3BzLmNvbmZpZy5jbG91ZFRyYWlsLnMzS2V5UHJlZml4IHx8ICdjbG91ZHRyYWlsLWxvZ3MvJyxcbiAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiB0aGlzLnByb3BzLmNvbmZpZy5jbG91ZFRyYWlsLmluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzLFxuICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiB0aGlzLnByb3BzLmNvbmZpZy5jbG91ZFRyYWlsLmlzTXVsdGlSZWdpb25UcmFpbCxcbiAgICAgIGVuYWJsZUZpbGVWYWxpZGF0aW9uOiB0aGlzLnByb3BzLmNvbmZpZy5jbG91ZFRyYWlsLmVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uLFxuICAgICAgZW5jcnlwdGlvbktleTogdGhpcy5rbXNLZXksXG4gICAgICBzZW5kVG9DbG91ZFdhdGNoTG9nczogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBV1MgQ29uZmln5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUF3c0NvbmZpZygpOiB2b2lkIHtcbiAgICAvLyBBV1MgQ29uZmln44Gv5LiA5pmC55qE44Gr54Sh5Yq55YyW77yI566h55CG44Od44Oq44K344O844Gu5ZWP6aGM44KS6YG/44GR44KL44Gf44KB77yJXG4gICAgY29uc29sZS5sb2coJ0FXUyBDb25maWfjga/nrqHnkIbjg53jg6rjgrfjg7zjga7llY/poYzjgpLpgb/jgZHjgovjgZ/jgoHkuIDmmYLnmoTjgavnhKHlirnljJbjgZXjgozjgabjgYTjgb7jgZknKTtcbiAgICBcbiAgICAvLyDku6XkuIvjga/lsIbmnaXnmoTjgavmnInlirnljJbjgZnjgovloLTlkIjjga7jgrPjg7zjg4lcbiAgICAvKlxuICAgIC8vIENvbmZpZ+eUqFMz44OQ44Kx44OD44OI5L2c5oiQXG4gICAgY29uc3QgYnVja2V0TmFtZSA9IHRoaXMucHJvcHMuY29uZmlnLmNvbmZpZy5zM0J1Y2tldE5hbWUgfHwgXG4gICAgICBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LWNvbmZpZy0ke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50fWA7XG4gICAgXG4gICAgY29uc3QgY29uZmlnQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnQ29uZmlnQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYnVja2V0TmFtZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TLFxuICAgICAgZW5jcnlwdGlvbktleTogdGhpcy5rbXNLZXksXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogdGhpcy5wcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2QnIFxuICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiBcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gQ29uZmlnIFNlcnZpY2UgUm9sZeS9nOaIkFxuICAgIGNvbnN0IGNvbmZpZ1JvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0NvbmZpZ1JvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnY29uZmlnLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NfQ29uZmlnUm9sZScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIENvbmZpZyBDb25maWd1cmF0aW9uIFJlY29yZGVy5L2c5oiQXG4gICAgbmV3IGNvbmZpZy5DZm5Db25maWd1cmF0aW9uUmVjb3JkZXIodGhpcywgJ0NvbmZpZ1JlY29yZGVyJywge1xuICAgICAgbmFtZTogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1yZWNvcmRlcmAsXG4gICAgICByb2xlQXJuOiBjb25maWdSb2xlLnJvbGVBcm4sXG4gICAgICByZWNvcmRpbmdHcm91cDoge1xuICAgICAgICBhbGxTdXBwb3J0ZWQ6IHRoaXMucHJvcHMuY29uZmlnLmNvbmZpZy5lbmFibGVBbGxTdXBwb3J0ZWQsXG4gICAgICAgIGluY2x1ZGVHbG9iYWxSZXNvdXJjZVR5cGVzOiB0aGlzLnByb3BzLmNvbmZpZy5jb25maWcuaW5jbHVkZUdsb2JhbFJlc291cmNlVHlwZXMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ29uZmlnIERlbGl2ZXJ5IENoYW5uZWzkvZzmiJBcbiAgICBuZXcgY29uZmlnLkNmbkRlbGl2ZXJ5Q2hhbm5lbCh0aGlzLCAnQ29uZmlnRGVsaXZlcnlDaGFubmVsJywge1xuICAgICAgbmFtZTogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1kZWxpdmVyeS1jaGFubmVsYCxcbiAgICAgIHMzQnVja2V0TmFtZTogY29uZmlnQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgfSk7XG4gICAgKi9cbiAgfVxuXG4gIC8qKlxuICAgKiBTZWN1cml0eSBIdWLkvZzmiJDvvIjkuIDmmYLnmoTjgavnhKHlirnljJbvvIlcbiAgICovXG4gIC8vIHByaXZhdGUgY3JlYXRlU2VjdXJpdHlIdWIoKTogdm9pZCB7XG4gIC8vICAgbmV3IHNlY3VyaXR5aHViLkNmbkh1Yih0aGlzLCAnU2VjdXJpdHlIdWInLCB7XG4gIC8vICAgICB0YWdzOiB7XG4gIC8vICAgICAgICdOYW1lJzogYCR7dGhpcy5wcm9wcy5wcm9qZWN0TmFtZX0tJHt0aGlzLnByb3BzLmVudmlyb25tZW50fS1zZWN1cml0eS1odWJgLFxuICAvLyAgICAgfSxcbiAgLy8gICB9KTtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBJQU3oqK3lrppcbiAgICovXG4gIHByaXZhdGUgY29uZmlndXJlSWFtU2V0dGluZ3MoKTogdm9pZCB7XG4gICAgLy8gQWNjZXNzIEFuYWx5emVy5L2c5oiQ77yI5LiA5pmC55qE44Gr54Sh5Yq55YyWIC0g5Yi26ZmQ6LaF6YGO44Gu44Gf44KB77yJXG4gICAgLy8gaWYgKHRoaXMucHJvcHMuY29uZmlnLmlhbS5lbmFibGVBY2Nlc3NBbmFseXplcikge1xuICAgIC8vICAgbmV3IGNkay5DZm5SZXNvdXJjZSh0aGlzLCAnQWNjZXNzQW5hbHl6ZXInLCB7XG4gICAgLy8gICAgIHR5cGU6ICdBV1M6OkFjY2Vzc0FuYWx5emVyOjpBbmFseXplcicsXG4gICAgLy8gICAgIHByb3BlcnRpZXM6IHtcbiAgICAvLyAgICAgICBUeXBlOiAnQUNDT1VOVCcsXG4gICAgLy8gICAgICAgQW5hbHl6ZXJOYW1lOiBgJHt0aGlzLnByb3BzLnByb2plY3ROYW1lfS0ke3RoaXMucHJvcHMuZW52aXJvbm1lbnR9LWFjY2Vzcy1hbmFseXplcmAsXG4gICAgLy8gICAgIH0sXG4gICAgLy8gICB9KTtcbiAgICAvLyB9XG5cbiAgICAvLyDjg5Hjgrnjg6/jg7zjg4njg53jg6rjgrfjg7zoqK3lrprjga/kuIDmmYLnmoTjgavnhKHlirnljJbvvIhDbG91ZEZvcm1hdGlvbuOBp+OCteODneODvOODiOOBleOCjOOBpuOBhOOBquOBhOOBn+OCge+8iVxuICAgIC8vIOS7o+abv+aJi+autTogQVdTIENMSeOBvuOBn+OBr0FXUyBDb25zb2xl44Gn5omL5YuV6Kit5a6a44GM5b+F6KaBXG4gICAgXG4gICAgY29uc29sZS5sb2coJ0lBTeioreWumuOBjOWujOS6huOBl+OBvuOBl+OBn++8iEFjY2VzcyBBbmFseXplcuOBr+S4gOaZgueahOOBq+eEoeWKueWMlu+8iScpO1xuICB9XG5cbiAgLyoqXG4gICAqIOWHuuWKm+WApOS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRzKCk6IFNlY3VyaXR5T3V0cHV0cyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGttc0tleUlkOiB0aGlzLmttc0tleS5rZXlJZCxcbiAgICAgIGttc0tleUFybjogdGhpcy5rbXNLZXkua2V5QXJuLFxuICAgICAgd2FmV2ViQWNsSWQ6IHRoaXMud2FmV2ViQWNsPy5hdHRySWQsXG4gICAgICB3YWZXZWJBY2xBcm46IHRoaXMud2FmV2ViQWNsPy5hdHRyQXJuLFxuICAgICAgZ3VhcmREdXR5RGV0ZWN0b3JJZDogdGhpcy5ndWFyZER1dHlEZXRlY3Rvcj8uYXR0cklkLFxuICAgICAgLy8gY2xvdWRUcmFpbEFybjogdGhpcy5jbG91ZFRyYWlsPy50cmFpbEFybiwgLy8g5LiA5pmC55qE44Gr54Sh5Yq55YyWXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiDoqK3lrprlgKTjga7mpJzoqLxcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVDb25maWd1cmF0aW9uKCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKCfwn5SNIOODh+ODkOODg+OCsDog5qSc6Ki86ZaL5aeLIC0g44OX44Ot44K444Kn44Kv44OI5ZCNID0nLCB0aGlzLnByb3BzLnByb2plY3ROYW1lKTtcbiAgICBjb25zb2xlLmxvZygn8J+UjSDjg4fjg5Djg4PjgrA6IOaknOiovOmWi+WniyAtIOeSsOWig+WQjSA9JywgdGhpcy5wcm9wcy5lbnZpcm9ubWVudCk7XG4gICAgY29uc29sZS5sb2coJ/CflI0g44OH44OQ44OD44KwOiBwcm9wc+WFqOS9kyA9JywgSlNPTi5zdHJpbmdpZnkodGhpcy5wcm9wcywgbnVsbCwgMikpO1xuXG4gICAgLy8g44OX44Ot44K444Kn44Kv44OI5ZCN44Gu5qSc6Ki8XG4gICAgaWYgKCF0aGlzLnByb3BzLnByb2plY3ROYW1lIHx8IHRoaXMucHJvcHMucHJvamVjdE5hbWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODl+ODreOCuOOCp+OCr+ODiOWQjeOBjOioreWumuOBleOCjOOBpuOBhOOBvuOBm+OCkycpO1xuICAgIH1cblxuICAgIC8vIOeSsOWig+WQjeOBruaknOiovFxuICAgIGNvbnN0IHZhbGlkRW52aXJvbm1lbnRzID0gWydkZXYnLCAnc3RhZ2luZycsICdwcm9kJ107XG4gICAgaWYgKCF2YWxpZEVudmlyb25tZW50cy5pbmNsdWRlcyh0aGlzLnByb3BzLmVudmlyb25tZW50KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGDnhKHlirnjgarnkrDlooPlkI3jgafjgZk6ICR7dGhpcy5wcm9wcy5lbnZpcm9ubWVudH1gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog44K/44Kw6YGp55SoXG4gICAqL1xuICBwcml2YXRlIGFwcGx5VGFncygpOiB2b2lkIHtcbiAgICBjb25zdCB0YWdzID0gdGhpcy5wcm9wcy5jb25maWcudGFncztcbiAgICBcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1NlY3VyaXR5TGV2ZWwnLCB0YWdzLlNlY3VyaXR5TGV2ZWwpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRW5jcnlwdGlvblJlcXVpcmVkJywgdGFncy5FbmNyeXB0aW9uUmVxdWlyZWQudG9TdHJpbmcoKSk7XG4gICAgXG4gICAgaWYgKHRhZ3MuQ29tcGxpYW5jZUZyYW1ld29yaykge1xuICAgICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb21wbGlhbmNlRnJhbWV3b3JrJywgdGFncy5Db21wbGlhbmNlRnJhbWV3b3JrKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHRhZ3MuRGF0YUNsYXNzaWZpY2F0aW9uKSB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0RhdGFDbGFzc2lmaWNhdGlvbicsIHRhZ3MuRGF0YUNsYXNzaWZpY2F0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRUcmFpbOeUqFMz44OQ44Kx44OD44OI44Od44Oq44K344O844Gu6Kit5a6aXG4gICAqIEZhY3RvcnkgUGF0dGVybuOBq+OCiOOCi+ODneODquOCt+ODvOS9nOaIkOOBruaKveixoeWMllxuICAgKi9cbiAgcHJpdmF0ZSBhZGRDbG91ZFRyYWlsQnVja2V0UG9saWNpZXMoYnVja2V0OiBzMy5CdWNrZXQpOiB2b2lkIHtcbiAgICAvLyDlrprmlbDlrprnvqnjgavjgojjgovkv53lrojmgKflkJHkuIpcbiAgICBjb25zdCBDTE9VRFRSQUlMX1NFUlZJQ0UgPSAnY2xvdWR0cmFpbC5hbWF6b25hd3MuY29tJztcbiAgICBjb25zdCBTM19BQ0xfQ09ORElUSU9OX0tFWSA9ICdzMzp4LWFtei1hY2wnO1xuICAgIGNvbnN0IEJVQ0tFVF9PV05FUl9GVUxMX0NPTlRST0wgPSAnYnVja2V0LW93bmVyLWZ1bGwtY29udHJvbCc7XG5cbiAgICAvLyBDbG91ZFRyYWlsIEFDTOODgeOCp+ODg+OCr+aoqemZkFxuICAgIGNvbnN0IGFjbENoZWNrUG9saWN5ID0gdGhpcy5jcmVhdGVDbG91ZFRyYWlsUG9saWN5KHtcbiAgICAgIHNpZDogJ0FXU0Nsb3VkVHJhaWxBY2xDaGVjaycsXG4gICAgICBhY3Rpb25zOiBbJ3MzOkdldEJ1Y2tldEFjbCddLFxuICAgICAgcmVzb3VyY2VzOiBbYnVja2V0LmJ1Y2tldEFybl0sXG4gICAgICBzZXJ2aWNlUHJpbmNpcGFsOiBDTE9VRFRSQUlMX1NFUlZJQ0UsXG4gICAgfSk7XG5cbiAgICAvLyBDbG91ZFRyYWls5pu444GN6L6844G/5qip6ZmQXG4gICAgY29uc3Qgd3JpdGVQb2xpY3kgPSB0aGlzLmNyZWF0ZUNsb3VkVHJhaWxQb2xpY3koe1xuICAgICAgc2lkOiAnQVdTQ2xvdWRUcmFpbFdyaXRlJyxcbiAgICAgIGFjdGlvbnM6IFsnczM6UHV0T2JqZWN0J10sXG4gICAgICByZXNvdXJjZXM6IFtgJHtidWNrZXQuYnVja2V0QXJufS8qYF0sXG4gICAgICBzZXJ2aWNlUHJpbmNpcGFsOiBDTE9VRFRSQUlMX1NFUlZJQ0UsXG4gICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgIFtTM19BQ0xfQ09ORElUSU9OX0tFWV06IEJVQ0tFVF9PV05FUl9GVUxMX0NPTlRST0wsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8g44Od44Oq44K344O844KS44OQ44Kx44OD44OI44Gr6YGp55SoXG4gICAgYnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3koYWNsQ2hlY2tQb2xpY3kpO1xuICAgIGJ1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KHdyaXRlUG9saWN5KTtcblxuICAgIGNvbnNvbGUubG9nKCfinIUgQ2xvdWRUcmFpbOeUqFMz44OQ44Kx44OD44OI44Od44Oq44K344O86Kit5a6a5a6M5LqGJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvdWRUcmFpbOODneODquOCt+ODvOS9nOaIkOODleOCoeOCr+ODiOODquODvOODoeOCveODg+ODiVxuICAgKiBUZW1wbGF0ZSBNZXRob2QgUGF0dGVybuOBq+OCiOOCi+WFsemAmuWHpueQhuOBruaKveixoeWMllxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVDbG91ZFRyYWlsUG9saWN5KGNvbmZpZzoge1xuICAgIHNpZDogc3RyaW5nO1xuICAgIGFjdGlvbnM6IHN0cmluZ1tdO1xuICAgIHJlc291cmNlczogc3RyaW5nW107XG4gICAgc2VydmljZVByaW5jaXBhbDogc3RyaW5nO1xuICAgIGNvbmRpdGlvbnM/OiBhbnk7XG4gIH0pOiBpYW0uUG9saWN5U3RhdGVtZW50IHtcbiAgICBjb25zdCBwb2xpY3lDb25maWc6IGlhbS5Qb2xpY3lTdGF0ZW1lbnRQcm9wcyA9IHtcbiAgICAgIHNpZDogY29uZmlnLnNpZCxcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoY29uZmlnLnNlcnZpY2VQcmluY2lwYWwpXSxcbiAgICAgIGFjdGlvbnM6IGNvbmZpZy5hY3Rpb25zLFxuICAgICAgcmVzb3VyY2VzOiBjb25maWcucmVzb3VyY2VzLFxuICAgIH07XG5cbiAgICAvLyDmnaHku7bjgYzmjIflrprjgZXjgozjgabjgYTjgovloLTlkIjjga7jgb/ov73liqBcbiAgICBpZiAoY29uZmlnLmNvbmRpdGlvbnMpIHtcbiAgICAgIHBvbGljeUNvbmZpZy5jb25kaXRpb25zID0gY29uZmlnLmNvbmRpdGlvbnM7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHBvbGljeUNvbmZpZyk7XG4gIH1cbn0iXX0=