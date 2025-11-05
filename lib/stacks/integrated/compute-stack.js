"use strict";
/**
 * ComputeStack - 統合コンピュート・AIスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合コンピュートコンストラクトによる一元管理
 * - Lambda・Batch・ECS・Bedrock・Embeddingの統合
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
exports.ComputeStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
// 統合コンピュートコンストラクト（モジュラーアーキテクチャ）
const compute_construct_1 = require("../../modules/compute/constructs/compute-construct");
// 統合AIコンストラクト（モジュラーアーキテクチャ）
const ai_construct_1 = require("../../modules/ai/constructs/ai-construct");
/**
 * 統合コンピュート・AIスタック（モジュラーアーキテクチャ対応）
 *
 * 統合コンピュート・AIコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
class ComputeStack extends cdk.Stack {
    /** 統合コンピュートコンストラクト */
    compute;
    /** 統合AIコンストラクト */
    ai;
    /** Lambda関数ARN（他スタックからの参照用） */
    lambdaFunctionArns = {};
    /** Bedrock Model ARN（他スタックからの参照用） */
    bedrockModelArn;
    constructor(scope, id, props) {
        super(scope, id, props);
        console.log('⚡ ComputeStack初期化開始...');
        console.log('📝 スタック名:', id);
        console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');
        // セキュリティスタックとの依存関係設定（存在する場合）
        if (props.securityStack) {
            this.addDependency(props.securityStack);
            console.log('🔗 SecurityStackとの依存関係設定完了');
        }
        // 統合コンピュートコンストラクト作成
        this.compute = new compute_construct_1.ComputeConstruct(this, 'Compute', {
            config: props.config.compute,
            projectName: props.config.project.name,
            environment: props.config.environment,
            existingResourceIds: props.existingResourceIds,
            kmsKey: props.securityStack?.kmsKey,
            namingGenerator: props.namingGenerator,
        });
        // 統合AIコンストラクト作成
        this.ai = new ai_construct_1.AiConstruct(this, 'AI', {
            config: props.config.ai,
            projectName: props.config.project.name,
            environment: props.config.environment,
            kmsKey: props.securityStack?.kmsKey,
            namingGenerator: props.namingGenerator,
        });
        // 他スタックからの参照用プロパティ設定
        this.setupCrossStackReferences();
        // スタック出力
        this.createOutputs();
        // タグ設定
        this.addStackTags();
        console.log('✅ ComputeStack初期化完了');
    }
    /**
     * 他スタックからの参照用プロパティ設定
     */
    setupCrossStackReferences() {
        // Lambda関数ARNの設定（存在する場合）
        if (this.compute.outputs?.lambdaFunctions) {
            Object.entries(this.compute.outputs.lambdaFunctions).forEach(([name, func]) => {
                if (func && typeof func === 'object' && 'functionArn' in func) {
                    this.lambdaFunctionArns[name] = func.functionArn;
                }
            });
        }
        // Bedrock Model ARNの設定（存在する場合）
        if (this.ai.outputs?.bedrockModelArn) {
            this.bedrockModelArn = this.ai.outputs.bedrockModelArn;
        }
        console.log('🔗 他スタック参照用プロパティ設定完了');
    }
    /**
     * スタック出力作成（個別デプロイ対応）
     */
    createOutputs() {
        // Lambda関数ARN出力（他スタックからの参照用）
        Object.entries(this.lambdaFunctionArns).forEach(([name, arn]) => {
            new cdk.CfnOutput(this, `Lambda${name}Arn`, {
                value: arn,
                description: `Lambda ${name} Function ARN`,
                exportName: `${this.stackName}-Lambda${name}Arn`,
            });
        });
        // Bedrock Model ARN出力（存在する場合のみ）
        if (this.bedrockModelArn) {
            new cdk.CfnOutput(this, 'BedrockModelArn', {
                value: this.bedrockModelArn,
                description: 'Bedrock Model ARN',
                exportName: `${this.stackName}-BedrockModelArn`,
            });
        }
        // コンピュート統合出力（存在する場合のみ）
        if (this.compute.outputs) {
            // Batch Job Queue ARN
            if (this.compute.outputs.batchJobQueueArn) {
                new cdk.CfnOutput(this, 'BatchJobQueueArn', {
                    value: this.compute.outputs.batchJobQueueArn,
                    description: 'Batch Job Queue ARN',
                    exportName: `${this.stackName}-BatchJobQueueArn`,
                });
            }
            // ECS Cluster ARN
            if (this.compute.outputs.ecsClusterArn) {
                new cdk.CfnOutput(this, 'EcsClusterArn', {
                    value: this.compute.outputs.ecsClusterArn,
                    description: 'ECS Cluster ARN',
                    exportName: `${this.stackName}-EcsClusterArn`,
                });
            }
        }
        // AI統合出力（存在する場合のみ）
        if (this.ai.outputs) {
            // Embedding処理結果S3バケット
            if (this.ai.outputs.embeddingBucketName) {
                new cdk.CfnOutput(this, 'EmbeddingBucketName', {
                    value: this.ai.outputs.embeddingBucketName,
                    description: 'Embedding Results S3 Bucket Name',
                    exportName: `${this.stackName}-EmbeddingBucketName`,
                });
            }
            // Vector Database Endpoint
            if (this.ai.outputs.vectorDatabaseEndpoint) {
                new cdk.CfnOutput(this, 'VectorDatabaseEndpoint', {
                    value: this.ai.outputs.vectorDatabaseEndpoint,
                    description: 'Vector Database Endpoint',
                    exportName: `${this.stackName}-VectorDatabaseEndpoint`,
                });
            }
        }
        console.log('📤 ComputeStack出力値作成完了');
    }
    /**
     * スタックタグ設定（Agent Steering準拠）
     */
    addStackTags() {
        cdk.Tags.of(this).add('Module', 'Compute+AI');
        cdk.Tags.of(this).add('StackType', 'Integrated');
        cdk.Tags.of(this).add('Architecture', 'Modular');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('ComputeType', 'Serverless+Container');
        cdk.Tags.of(this).add('AICapabilities', 'Bedrock+Embedding');
        cdk.Tags.of(this).add('IndividualDeploySupport', 'Yes');
        console.log('🏷️ ComputeStackタグ設定完了');
    }
}
exports.ComputeStack = ComputeStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbXB1dGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUduQyxnQ0FBZ0M7QUFDaEMsMEZBQXNGO0FBRXRGLDRCQUE0QjtBQUM1QiwyRUFBdUU7QUFnQnZFOzs7OztHQUtHO0FBQ0gsTUFBYSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDekMsc0JBQXNCO0lBQ04sT0FBTyxDQUFtQjtJQUUxQyxrQkFBa0I7SUFDRixFQUFFLENBQWM7SUFFaEMsK0JBQStCO0lBQ2Ysa0JBQWtCLEdBQThCLEVBQUUsQ0FBQztJQUVuRSxxQ0FBcUM7SUFDckIsZUFBZSxDQUFVO0lBRXpDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBd0I7UUFDaEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUzRSw2QkFBNkI7UUFDN0IsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxvQkFBb0I7UUFDcEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLG9DQUFnQixDQUFDLElBQUksRUFBRSxT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QUFhLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUM3RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUM3RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQS9KRCxvQ0ErSkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbXB1dGVTdGFjayAtIOe1seWQiOOCs+ODs+ODlOODpeODvOODiOODu0FJ44K544K/44OD44Kv77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj5a++5b+c77yJXG4gKiBcbiAqIOapn+iDvTpcbiAqIC0g57Wx5ZCI44Kz44Oz44OU44Ol44O844OI44Kz44Oz44K544OI44Op44Kv44OI44Gr44KI44KL5LiA5YWD566h55CGXG4gKiAtIExhbWJkYeODu0JhdGNo44O7RUNT44O7QmVkcm9ja+ODu0VtYmVkZGluZ+OBrue1seWQiFxuICogLSBBZ2VudCBTdGVlcmluZ+a6luaLoOWRveWQjeimj+WJh+WvvuW/nFxuICogLSDlgIvliKXjgrnjgr/jg4Pjgq/jg4fjg5fjg63jgqTlrozlhajlr77lv5xcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8vIOe1seWQiOOCs+ODs+ODlOODpeODvOODiOOCs+ODs+OCueODiOODqeOCr+ODiO+8iOODouOCuOODpeODqeODvOOCouODvOOCreODhuOCr+ODgeODo++8iVxuaW1wb3J0IHsgQ29tcHV0ZUNvbnN0cnVjdCB9IGZyb20gJy4uLy4uL21vZHVsZXMvY29tcHV0ZS9jb25zdHJ1Y3RzL2NvbXB1dGUtY29uc3RydWN0JztcblxuLy8g57Wx5ZCIQUnjgrPjg7Pjgrnjg4jjg6njgq/jg4jvvIjjg6Ljgrjjg6Xjg6njg7zjgqLjg7zjgq3jg4bjgq/jg4Hjg6PvvIlcbmltcG9ydCB7IEFpQ29uc3RydWN0IH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9haS9jb25zdHJ1Y3RzL2FpLWNvbnN0cnVjdCc7XG5cbi8vIOOCpOODs+OCv+ODvOODleOCp+ODvOOCuVxuaW1wb3J0IHsgQ29tcHV0ZUNvbmZpZyB9IGZyb20gJy4uLy4uL21vZHVsZXMvY29tcHV0ZS9pbnRlcmZhY2VzL2NvbXB1dGUtY29uZmlnJztcbmltcG9ydCB7IEFpQ29uZmlnIH0gZnJvbSAnLi4vLi4vbW9kdWxlcy9haS9pbnRlcmZhY2VzL2FpLWNvbmZpZyc7XG5cbi8vIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruS+neWtmOmWouS/glxuaW1wb3J0IHsgU2VjdXJpdHlTdGFjayB9IGZyb20gJy4vc2VjdXJpdHktc3RhY2snO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbXB1dGVTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICByZWFkb25seSBjb25maWc6IGFueTsgLy8g57Wx5ZCI6Kit5a6a44Kq44OW44K444Kn44Kv44OIXG4gIHJlYWRvbmx5IGV4aXN0aW5nUmVzb3VyY2VJZHM/OiBhbnk7IC8vIOaXouWtmOODquOCveODvOOCuUlE77yI44Kq44OX44K344On44Oz77yJXG4gIHJlYWRvbmx5IHNlY3VyaXR5U3RhY2s/OiBTZWN1cml0eVN0YWNrOyAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgr/jg4Pjgq/vvIjjgqrjg5fjgrfjg6fjg7PvvIlcbiAgcmVhZG9ubHkgbmFtaW5nR2VuZXJhdG9yPzogYW55OyAvLyBBZ2VudCBTdGVlcmluZ+a6luaLoOWRveWQjeOCuOOCp+ODjeODrOODvOOCv+ODvO+8iOOCquODl+OCt+ODp+ODs++8iVxufVxuXG4vKipcbiAqIOe1seWQiOOCs+ODs+ODlOODpeODvOODiOODu0FJ44K544K/44OD44Kv77yI44Oi44K444Ol44Op44O844Ki44O844Kt44OG44Kv44OB44Oj5a++5b+c77yJXG4gKiBcbiAqIOe1seWQiOOCs+ODs+ODlOODpeODvOODiOODu0FJ44Kz44Oz44K544OI44Op44Kv44OI44Gr44KI44KL5LiA5YWD566h55CGXG4gKiDlgIvliKXjgrnjgr/jg4Pjgq/jg4fjg5fjg63jgqTlrozlhajlr77lv5xcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXB1dGVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIC8qKiDntbHlkIjjgrPjg7Pjg5Tjg6Xjg7zjg4jjgrPjg7Pjgrnjg4jjg6njgq/jg4ggKi9cbiAgcHVibGljIHJlYWRvbmx5IGNvbXB1dGU6IENvbXB1dGVDb25zdHJ1Y3Q7XG4gIFxuICAvKiog57Wx5ZCIQUnjgrPjg7Pjgrnjg4jjg6njgq/jg4ggKi9cbiAgcHVibGljIHJlYWRvbmx5IGFpOiBBaUNvbnN0cnVjdDtcbiAgXG4gIC8qKiBMYW1iZGHplqLmlbBBUk7vvIjku5bjgrnjgr/jg4Pjgq/jgYvjgonjga7lj4LnhafnlKjvvIkgKi9cbiAgcHVibGljIHJlYWRvbmx5IGxhbWJkYUZ1bmN0aW9uQXJuczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuICBcbiAgLyoqIEJlZHJvY2sgTW9kZWwgQVJO77yI5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So77yJICovXG4gIHB1YmxpYyByZWFkb25seSBiZWRyb2NrTW9kZWxBcm4/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENvbXB1dGVTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zb2xlLmxvZygn4pqhIENvbXB1dGVTdGFja+WIneacn+WMlumWi+Wniy4uLicpO1xuICAgIGNvbnNvbGUubG9nKCfwn5OdIOOCueOCv+ODg+OCr+WQjTonLCBpZCk7XG4gICAgY29uc29sZS5sb2coJ/Cfj7fvuI8gQWdlbnQgU3RlZXJpbmfmupbmi6A6JywgcHJvcHMubmFtaW5nR2VuZXJhdG9yID8gJ1llcycgOiAnTm8nKTtcblxuICAgIC8vIOOCu+OCreODpeODquODhuOCo+OCueOCv+ODg+OCr+OBqOOBruS+neWtmOmWouS/guioreWumu+8iOWtmOWcqOOBmeOCi+WgtOWQiO+8iVxuICAgIGlmIChwcm9wcy5zZWN1cml0eVN0YWNrKSB7XG4gICAgICB0aGlzLmFkZERlcGVuZGVuY3kocHJvcHMuc2VjdXJpdHlTdGFjayk7XG4gICAgICBjb25zb2xlLmxvZygn8J+UlyBTZWN1cml0eVN0YWNr44Go44Gu5L6d5a2Y6Zai5L+C6Kit5a6a5a6M5LqGJyk7XG4gICAgfVxuXG4gICAgLy8g57Wx5ZCI44Kz44Oz44OU44Ol44O844OI44Kz44Oz44K544OI44Op44Kv44OI5L2c5oiQXG4gICAgdGhpcy5jb21wdXRlID0gbmV3IENvbXB1dGVDb25zdHJ1Y3QodGhpcywgJ0NvbXB1dGUnLCB7XG4gICAgICBjb25maWc6IHByb3BzLmNvbmZpZy5jb21wdXRlLFxuICAgICAgcHJvamVjdE5hbWU6IHByb3BzLmNvbmZpZy5wcm9qZWN0Lm5hbWUsXG4gICAgICBlbnZpcm9ubWVudDogcHJvcHMuY29uZmlnLmVudmlyb25tZW50LFxuICAgICAgZXhpc3RpbmdSZXNvdXJjZUlkczogcHJvcHMuZXhpc3RpbmdSZXNvdXJjZUlkcyxcbiAgICAgIGttc0tleTogcHJvcHMuc2VjdXJpdHlTdGFjaz8ua21zS2V5LFxuICAgICAgbmFtaW5nR2VuZXJhdG9yOiBwcm9wcy5uYW1pbmdHZW5lcmF0b3IsXG4gICAgfSk7XG5cbiAgICAvLyDntbHlkIhBSeOCs+ODs+OCueODiOODqeOCr+ODiOS9nOaIkFxuICAgIHRoaXMuYWkgPSBuZXcgQWlDb25zdHJ1Y3QodGhpcywgJ0FJJywge1xuICAgICAgY29uZmlnOiBwcm9wcy5jb25maWcuYWksXG4gICAgICBwcm9qZWN0TmFtZTogcHJvcHMuY29uZmlnLnByb2plY3QubmFtZSxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5jb25maWcuZW52aXJvbm1lbnQsXG4gICAgICBrbXNLZXk6IHByb3BzLnNlY3VyaXR5U3RhY2s/Lmttc0tleSxcbiAgICAgIG5hbWluZ0dlbmVyYXRvcjogcHJvcHMubmFtaW5nR2VuZXJhdG9yLFxuICAgIH0pO1xuXG4gICAgLy8g5LuW44K544K/44OD44Kv44GL44KJ44Gu5Y+C54Wn55So44OX44Ot44OR44OG44Kj6Kit5a6aXG4gICAgdGhpcy5zZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk7XG5cbiAgICAvLyDjgrnjgr/jg4Pjgq/lh7rliptcbiAgICB0aGlzLmNyZWF0ZU91dHB1dHMoKTtcblxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIHRoaXMuYWRkU3RhY2tUYWdzKCk7XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIENvbXB1dGVTdGFja+WIneacn+WMluWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqOODl+ODreODkeODhuOCo+ioreWumlxuICAgKi9cbiAgcHJpdmF0ZSBzZXR1cENyb3NzU3RhY2tSZWZlcmVuY2VzKCk6IHZvaWQge1xuICAgIC8vIExhbWJkYemWouaVsEFSTuOBruioreWumu+8iOWtmOWcqOOBmeOCi+WgtOWQiO+8iVxuICAgIGlmICh0aGlzLmNvbXB1dGUub3V0cHV0cz8ubGFtYmRhRnVuY3Rpb25zKSB7XG4gICAgICBPYmplY3QuZW50cmllcyh0aGlzLmNvbXB1dGUub3V0cHV0cy5sYW1iZGFGdW5jdGlvbnMpLmZvckVhY2goKFtuYW1lLCBmdW5jXSkgPT4ge1xuICAgICAgICBpZiAoZnVuYyAmJiB0eXBlb2YgZnVuYyA9PT0gJ29iamVjdCcgJiYgJ2Z1bmN0aW9uQXJuJyBpbiBmdW5jKSB7XG4gICAgICAgICAgdGhpcy5sYW1iZGFGdW5jdGlvbkFybnNbbmFtZV0gPSBmdW5jLmZ1bmN0aW9uQXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBCZWRyb2NrIE1vZGVsIEFSTuOBruioreWumu+8iOWtmOWcqOOBmeOCi+WgtOWQiO+8iVxuICAgIGlmICh0aGlzLmFpLm91dHB1dHM/LmJlZHJvY2tNb2RlbEFybikge1xuICAgICAgdGhpcy5iZWRyb2NrTW9kZWxBcm4gPSB0aGlzLmFpLm91dHB1dHMuYmVkcm9ja01vZGVsQXJuO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfwn5SXIOS7luOCueOCv+ODg+OCr+WPgueFp+eUqOODl+ODreODkeODhuOCo+ioreWumuWujOS6hicpO1xuICB9XG5cbiAgLyoqXG4gICAqIOOCueOCv+ODg+OCr+WHuuWKm+S9nOaIkO+8iOWAi+WIpeODh+ODl+ODreOCpOWvvuW/nO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVPdXRwdXRzKCk6IHZvaWQge1xuICAgIC8vIExhbWJkYemWouaVsEFSTuWHuuWKm++8iOS7luOCueOCv+ODg+OCr+OBi+OCieOBruWPgueFp+eUqO+8iVxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMubGFtYmRhRnVuY3Rpb25Bcm5zKS5mb3JFYWNoKChbbmFtZSwgYXJuXSkgPT4ge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYExhbWJkYSR7bmFtZX1Bcm5gLCB7XG4gICAgICAgIHZhbHVlOiBhcm4sXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgTGFtYmRhICR7bmFtZX0gRnVuY3Rpb24gQVJOYCxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUxhbWJkYSR7bmFtZX1Bcm5gLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBCZWRyb2NrIE1vZGVsIEFSTuWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLmJlZHJvY2tNb2RlbEFybikge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0JlZHJvY2tNb2RlbEFybicsIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuYmVkcm9ja01vZGVsQXJuLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0JlZHJvY2sgTW9kZWwgQVJOJyxcbiAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUJlZHJvY2tNb2RlbEFybmAsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDjgrPjg7Pjg5Tjg6Xjg7zjg4jntbHlkIjlh7rlipvvvIjlrZjlnKjjgZnjgovloLTlkIjjga7jgb/vvIlcbiAgICBpZiAodGhpcy5jb21wdXRlLm91dHB1dHMpIHtcbiAgICAgIC8vIEJhdGNoIEpvYiBRdWV1ZSBBUk5cbiAgICAgIGlmICh0aGlzLmNvbXB1dGUub3V0cHV0cy5iYXRjaEpvYlF1ZXVlQXJuKSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCYXRjaEpvYlF1ZXVlQXJuJywge1xuICAgICAgICAgIHZhbHVlOiB0aGlzLmNvbXB1dGUub3V0cHV0cy5iYXRjaEpvYlF1ZXVlQXJuLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQmF0Y2ggSm9iIFF1ZXVlIEFSTicsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUJhdGNoSm9iUXVldWVBcm5gLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gRUNTIENsdXN0ZXIgQVJOXG4gICAgICBpZiAodGhpcy5jb21wdXRlLm91dHB1dHMuZWNzQ2x1c3RlckFybikge1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRWNzQ2x1c3RlckFybicsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5jb21wdXRlLm91dHB1dHMuZWNzQ2x1c3RlckFybixcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VDUyBDbHVzdGVyIEFSTicsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVjc0NsdXN0ZXJBcm5gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBSee1seWQiOWHuuWKm++8iOWtmOWcqOOBmeOCi+WgtOWQiOOBruOBv++8iVxuICAgIGlmICh0aGlzLmFpLm91dHB1dHMpIHtcbiAgICAgIC8vIEVtYmVkZGluZ+WHpueQhue1kOaenFMz44OQ44Kx44OD44OIXG4gICAgICBpZiAodGhpcy5haS5vdXRwdXRzLmVtYmVkZGluZ0J1Y2tldE5hbWUpIHtcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VtYmVkZGluZ0J1Y2tldE5hbWUnLCB7XG4gICAgICAgICAgdmFsdWU6IHRoaXMuYWkub3V0cHV0cy5lbWJlZGRpbmdCdWNrZXROYW1lLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRW1iZWRkaW5nIFJlc3VsdHMgUzMgQnVja2V0IE5hbWUnLFxuICAgICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FbWJlZGRpbmdCdWNrZXROYW1lYCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFZlY3RvciBEYXRhYmFzZSBFbmRwb2ludFxuICAgICAgaWYgKHRoaXMuYWkub3V0cHV0cy52ZWN0b3JEYXRhYmFzZUVuZHBvaW50KSB7XG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdWZWN0b3JEYXRhYmFzZUVuZHBvaW50Jywge1xuICAgICAgICAgIHZhbHVlOiB0aGlzLmFpLm91dHB1dHMudmVjdG9yRGF0YWJhc2VFbmRwb2ludCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ZlY3RvciBEYXRhYmFzZSBFbmRwb2ludCcsXG4gICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LVZlY3RvckRhdGFiYXNlRW5kcG9pbnRgLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn8J+TpCBDb21wdXRlU3RhY2vlh7rlipvlgKTkvZzmiJDlrozkuoYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDjgrnjgr/jg4Pjgq/jgr/jgrDoqK3lrprvvIhBZ2VudCBTdGVlcmluZ+a6luaLoO+8iVxuICAgKi9cbiAgcHJpdmF0ZSBhZGRTdGFja1RhZ3MoKTogdm9pZCB7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNb2R1bGUnLCAnQ29tcHV0ZStBSScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RhY2tUeXBlJywgJ0ludGVncmF0ZWQnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0FyY2hpdGVjdHVyZScsICdNb2R1bGFyJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb21wdXRlVHlwZScsICdTZXJ2ZXJsZXNzK0NvbnRhaW5lcicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQUlDYXBhYmlsaXRpZXMnLCAnQmVkcm9jaytFbWJlZGRpbmcnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0luZGl2aWR1YWxEZXBsb3lTdXBwb3J0JywgJ1llcycpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCfwn4+377iPIENvbXB1dGVTdGFja+OCv+OCsOioreWumuWujOS6hicpO1xuICB9XG59Il19