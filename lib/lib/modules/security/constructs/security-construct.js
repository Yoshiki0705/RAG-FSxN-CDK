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
