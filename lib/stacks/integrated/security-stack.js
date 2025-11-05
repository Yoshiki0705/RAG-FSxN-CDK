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
    constructor(scope, id, props) {
        super(scope, id, props);
        console.log('🔒 SecurityStack初期化開始...');
        console.log('📝 スタック名:', id);
        console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');
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
        // スタック出力
        this.createOutputs();
        // タグ設定
        this.addStackTags();
        console.log('✅ SecurityStack初期化完了');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBR25DLGdDQUFnQztBQUNoQyw2RkFBeUY7QUFVekY7Ozs7O0dBS0c7QUFDSCxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMxQyxzQkFBc0I7SUFDTixRQUFRLENBQW9CO0lBRTVDLHlCQUF5QjtJQUNULE1BQU0sQ0FBa0I7SUFFeEMsa0NBQWtDO0lBQ2xCLFlBQVksQ0FBVTtJQUV0QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXlCO1FBQ2pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFM0Usb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxzQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQ3RELE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVE7WUFDN0IsV0FBVyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUk7WUFDdEMsV0FBVyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVztZQUNyQyxlQUFlLEVBQUUsS0FBSyxDQUFDLGVBQWU7U0FDdkMsQ0FBQyxDQUFDO1FBRUgscUJBQXFCO1FBQ3JCLElBQUksQ0FBQyxN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QyxHQUFHLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2pELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDakQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdkQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhELE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBQ0Y7QUF4R0Qsc0NBd0dDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTZWN1cml0eVN0YWNrIC0g57Wx5ZCI44K744Kt44Ol44Oq44OG44Kj44K544K/44OD44Kv77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj5a++5b+c77yJXG4gKiBcbiAqIOapn+iDvTpcbiAqIC0g57Wx5ZCI44K744Kt44Ol44Oq44OG44Kj44Kz44Oz44K544OI44Op44Kv44OI44Gr44KI44KL5LiA5YWD566h55CGXG4gKiAtIEtNU+ODu1dBRuODu0d1YXJkRHV0eeODu0Nsb3VkVHJhaWzjg7tJQU3jga7ntbHlkIhcbiAqIC0gQWdlbnQgU3RlZXJpbmfmupbmi6Dlkb3lkI3opo/liYflr77lv5xcbiAqIC0g5YCL5Yil44K544K/44OD44Kv44OH44OX44Ot44Kk5a6M5YWo5a++5b+cXG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vLyDntbHlkIjjgrvjgq3jg6Xjg6rjg4bjgqPjgrPjg7Pjgrnjg4jjg6njgq/jg4jvvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6PvvIlcbmltcG9ydCB7IFNlY3VyaXR5Q29uc3RydWN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9zZWN1cml0eS9jb25zdHJ1Y3RzL3NlY3VyaXR5LWNvbnN0cnVjdCc7XG5cbi8vIOOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuaW1wb3J0IHsgU2VjdXJpdHlDb25maWcgfSBmcm9tICcuLi8uLi9tb2R1bGVzL3NlY3VyaXR5L2ludGVyZmFjZXMvc2VjdXJpdHktY29uZmlnJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHJlYWRvbmx5IGNvbmZpZzogYW55OyAvLyDntbHlkIjoqK3lrprjgqrjg5bjgrjjgqfjgq/jg4hcbiAgcmVhZG9ubHkgbmFtaW5nR2VuZXJhdG9yPzogYW55OyAvLyBBZ2VudCBTdGVlcmluZ+a6luaLoOWRveWQjeOCuOOCp+ODjeODrOODvOOCv+ODvO+8iOOCquODl+OCt+ODp+ODs++8iVxufVxuXG4vKipcbiAqIOe1seWQiOOCu+OCreODpeODquODhuOCo+OCueOCv+ODg+OCr++8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo+WvvuW/nO+8iVxuICogXG4gKiDntbHlkIjjgrvjgq3jg6Xjg6rjg4bjgqPjgrPjg7Pjgrnjg4jjg6njgq/jg4jjgavjgojjgovkuIDlhYPnrqHnkIZcbiAqIOWAi+WIpeOCueOCv+ODg+OCr+ODh+ODl+ODreOCpOWujOWFqOWvvuW/nFxuICovXG5leHBvcnQgY2xhc3MgU2VjdXJpdHlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIC8qKiDntbHlkIjjgrvjgq3jg6Xjg6rjg4bjgqPjgrPjg7Pjgrnjg4jjg6njgq/jg4ggKi9cbiAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5OiBTZWN1cml0eUNvbnN0cnVjdDtcbiAgXG4gIC8qKiBLTVPjgq3jg7zvvIjku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjvvIkgKi9cbiAgcHVibGljIHJlYWRvbmx5IGttc0tleTogY2RrLmF3c19rbXMuS2V5O1xuICBcbiAgLyoqIFdBRiBXZWJBQ0wgQVJO77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJICovXG4gIHB1YmxpYyByZWFkb25seSB3YWZXZWJBY2xBcm4/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFNlY3VyaXR5U3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc29sZS5sb2coJ/CflJIgU2VjdXJpdHlTdGFja+WIneacn+WMlumWi+Wniy4uLicpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OdIOOCueOCv+ODg+OCr+WQjTonLCBpZCk7XG4gICAgY29uc29sZS5sb2coJ/Cfj7fvuI8gQWdlbnQgU3RlZXJpbmfmupbmi6A6JywgcHJvcHMubmFtaW5nR2VuZXJhdG9yID8gJ1llcycgOiAnTm8nKTtcblxuICAgIC8vIOe1seWQiOOCu+OCreODpeODquODhuOCo+OCs+ODs+OCueODiOODqeOCr+ODiOS9nOaIkFxuICAgIHRoaXMuc2VjdXJpdHkgPSBuZXcgU2VjdXJpdHlDb25zdHJ1Y3QodGhpcywgJ1NlY3VyaXR5Jywge1xuICAgICAgY29uZmlnOiBwcm9wcy5jb25maWcuc2VjdXJpdHksXG4gICAgICBwcm9qZWN0TmFtZTogcHJvcHMuY29uZmlnLnByb2plY3QubmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5jb25maWcuZW52aXJvbm1lbnQsXG4gICAgICBuYW1pbmdHZW5lcmF0b3I6IHByb3BzLm5hbWluZ0dlbmVyYXRvcixcbiAgICB9KTtcblxuICAgIC8vIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqOODl+ODreODkeODhuOCo+ioreWumlxuICAgIHRoaXMua21zS2V5ID0gdGhpcy5zZWN1cml0eS5rbXNLZXk7XG4gICAgdGhpcy53YWZXZWJBY2xBcm4gPSB0aGlzLnNlY3VyaXR5LndhZldlYkFjbD8uYXR0ckFybjtcblxuICAgIC8vIOOCueOCv+ODg+OCr+WHuuWKm1xuICAgIHRoaXMuY3JlYXRlT3V0cHV0cygpO1xuXG4gICAgLy8g44K/44Kw6Kit5a6aXG4gICAgdGhpcy5hZGRTdGFja1RhZ3MoKTtcblxuICAgIGNvbnNvbGUubG9nKCfinIUgU2VjdXJpdHlTdGFja+WIneacn+WMluWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+WHuuWKm+S9nOaIkO+8iOWAi+WIpeODh+ODl+ODreOCpOWvvuW/nO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRzKCk6IHZvaWQge1xuICAgIC8vIEtNU+OCreODvOWHuuWKm++8iOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqO+8iVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdLbXNLZXlJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnNlY3VyaXR5Lmttc0tleS5rZXlJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgS01TIEtleSBJRCcsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tS21zS2V5SWRgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0ttc0tleUFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnNlY3VyaXR5Lmttc0tleS5rZXlBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IEtNUyBLZXkgQVJOJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1LbXNLZXlBcm5gLFxuICAgIH0pO1xuXG4gICAgLy8gV0FGIFdlYkFDTOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLnNlY3VyaXR5LndhZldlYkFjbCkge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dhZldlYkFjbElkJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5zZWN1cml0eS53YWZXZWJBY2wuYXR0cklkLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dBRiBXZWIgQUNMIElEJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVdhZldlYkFjbElkYCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2FmV2ViQWNsQXJuJywge1xuICAgICAgICB2YWx1ZTogdGhpcy5zZWN1cml0eS53YWZXZWJBY2wuYXR0ckFybixcbiAgICAgICAgZGVzY3JpcHRpb246ICdXQUYgV2ViIEFDTCBBUk4nLFxuICAgICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tV2FmV2ViQWNsQXJuYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEd1YXJkRHV0eeWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLnNlY3VyaXR5Lmd1YXJkRHV0eURldGVjdG9yKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnR3VhcmREdXR5RGV0ZWN0b3JJZCcsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuc2VjdXJpdHkuZ3VhcmREdXR5RGV0ZWN0b3IuYXR0cklkLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0d1YXJkRHV0eSBEZXRlY3RvciBJRCcsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1HdWFyZER1dHlEZXRlY3RvcklkYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENsb3VkVHJhaWzlh7rlipvvvIjlrZjlnKjjgZnjgovloLTlkIjjga7jgb/vvIlcbiAgICBpZiAodGhpcy5zZWN1cml0eS5jbG91ZFRyYWlsKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2xvdWRUcmFpbEFybicsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuc2VjdXJpdHkuY2xvdWRUcmFpbC50cmFpbEFybixcbiAgICAgICAgZGVzY3JpcHRpb246ICdDbG91ZFRyYWlsIEFSTicsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1DbG91ZFRyYWlsQXJuYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfwn5OkIFNlY3VyaXR5U3RhY2vlh7rlipvlgKTkvZzmiJDlrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgr/jg4Pjgq/jgr/jgrDoqK3lrprvvIhBZ2VudCBTdGVlcmluZ+a6luaLoO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhZGRTdGFja1RhZ3MoKTogdm9pZCB7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNb2R1bGUnLCAnU2VjdXJpdHknKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1N0YWNrVHlwZScsICdJbnRlZ3JhdGVkJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdBcmNoaXRlY3R1cmUnLCAnTW9kdWxhcicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU2VjdXJpdHlDb21wbGlhbmNlJywgJ0VuYWJsZWQnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0luZGl2aWR1YWxEZXBsb3lTdXBwb3J0JywgJ1llcycpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn4+377iPIFNlY3VyaXR5U3RhY2vjgr/jgrDoqK3lrprlrozkuoYnKTtcbiAgfVxufSJdfQ==