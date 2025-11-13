"use strict";
/**
 * Bedrock Agentコンストラクト
 * 権限認識型RAGシステムのためのBedrock Agent統合
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
exports.BedrockAgentConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const bedrock = __importStar(require("aws-cdk-lib/aws-bedrock"));
const constructs_1 = require("constructs");
class BedrockAgentConstruct extends constructs_1.Construct {
    /**
     * Bedrock Agent
     */
    agent;
    /**
     * Agent Alias
     */
    agentAlias;
    /**
     * Agent IAMロール
     */
    agentRole;
    /**
     * Agent ARN
     */
    agentArn;
    /**
     * Agent Alias ARN
     */
    agentAliasArn;
    constructor(scope, id, props) {
        super(scope, id);
        // enabledフラグがfalseの場合、何も作成しない
        if (!props.enabled) {
            return;
        }
        // Agent IAMロール作成
        this.agentRole = this.createAgentRole(props);
        // Bedrock Agent作成
        this.agent = this.createAgent(props);
        // Agent Alias作成
        this.agentAlias = this.createAgentAlias(props);
        // ARN設定
        this.agentArn = this.agent.attrAgentArn;
        this.agentAliasArn = this.agentAlias.attrAgentAliasArn;
        // CloudFormation出力
        new cdk.CfnOutput(this, 'AgentArn', {
            value: this.agentArn,
            description: 'Bedrock Agent ARN',
            exportName: `${props.projectName}-${props.environment}-agent-arn`,
        });
        new cdk.CfnOutput(this, 'AgentAliasArn', {
            value: this.agentAliasArn,
            description: 'Bedrock Agent Alias ARN',
            exportName: `${props.projectName}-${props.environment}-agent-alias-arn`,
        });
    }
    /**
     * Agent IAMロール作成
     */
    createAgentRole(props) {
        const role = new iam.Role(this, 'AgentRole', {
            roleName: `${props.projectName}-${props.environment}-bedrock-agent-role`,
            assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
            description: 'IAM role for Bedrock Agent',
        });
        // Bedrock基本権限
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['bedrock:InvokeModel'],
            resources: [
                `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/${props.foundationModel || 'anthropic.claude-v2'}`,
            ],
        }));
        // Knowledge Base権限（指定されている場合）
        if (props.knowledgeBaseArn) {
            role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['bedrock:Retrieve', 'bedrock:RetrieveAndGenerate'],
                resources: [props.knowledgeBaseArn],
            }));
        }
        // Action Groups Lambda実行権限（指定されている場合）
        if (props.actionGroups && props.actionGroups.length > 0) {
            const lambdaArns = props.actionGroups.map((ag) => ag.actionGroupExecutor);
            role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['lambda:InvokeFunction'],
                resources: lambdaArns,
            }));
        }
        return role;
    }
    /**
     * Bedrock Agent作成
     */
    createAgent(props) {
        const agentConfig = {
            agentName: props.agentName,
            agentResourceRoleArn: this.agentRole.roleArn,
            foundationModel: props.foundationModel || 'anthropic.claude-v2',
            instruction: props.instruction,
            description: props.agentDescription,
            idleSessionTtlInSeconds: props.idleSessionTTLInSeconds || 600,
        };
        // Guardrails設定（Phase 5 - SecurityStackから取得）
        if (props.guardrailArn) {
            agentConfig.guardrailConfiguration = {
                guardrailIdentifier: props.guardrailArn,
                guardrailVersion: props.guardrailVersion || 'DRAFT',
            };
        }
        const agent = new bedrock.CfnAgent(this, 'Agent', agentConfig);
        // Knowledge Base関連付け（指定されている場合）
        if (props.knowledgeBaseArn) {
            agent.knowledgeBases = [
                {
                    knowledgeBaseId: this.extractKnowledgeBaseId(props.knowledgeBaseArn),
                    description: 'Permission-aware RAG Knowledge Base',
                    knowledgeBaseState: 'ENABLED',
                },
            ];
        }
        // Action Groups設定（指定されている場合）
        if (props.actionGroups && props.actionGroups.length > 0) {
            agent.actionGroups = props.actionGroups.map((ag) => ({
                actionGroupName: ag.actionGroupName,
                description: ag.description,
                actionGroupExecutor: {
                    lambda: ag.actionGroupExecutor,
                },
                apiSchema: ag.apiSchema.s3BucketName
                    ? {
                        s3: {
                            s3BucketName: ag.apiSchema.s3BucketName,
                            s3ObjectKey: ag.apiSchema.s3ObjectKey,
                        },
                    }
                    : {
                        payload: ag.apiSchema.payload,
                    },
            }));
        }
        return agent;
    }
    /**
     * Agent Alias作成
     */
    createAgentAlias(props) {
        return new bedrock.CfnAgentAlias(this, 'AgentAlias', {
            agentId: this.agent.attrAgentId,
            agentAliasName: `${props.environment}-alias`,
            description: `${props.environment} environment alias`,
        });
    }
    /**
     * Knowledge Base ARNからIDを抽出
     */
    extractKnowledgeBaseId(arn) {
        // ARN形式: arn:aws:bedrock:{region}:{account}:knowledge-base/{id}
        const parts = arn.split('/');
        return parts[parts.length - 1];
    }
}
exports.BedrockAgentConstruct = BedrockAgentConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1hZ2VudC1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJiZWRyb2NrLWFnZW50LWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUNuQyx5REFBMkM7QUFDM0MsaUVBQW1EO0FBQ25ELDJDQUF1QztBQTBHdkMsTUFBYSxxQkFBc0IsU0FBUSxzQkFBUztJQUNsRDs7T0FFRztJQUNhLEtBQUssQ0FBb0I7SUFFekM7O09BRUc7SUFDYSxVQUFVLENBQXlCO0lBRW5EOztPQUVHO0lBQ2EsU0FBUyxDQUFZO0lBRXJDOztPQUVHO0lBQ2EsUUFBUSxDQUFVO0lBRWxDOztPQUVHO0lBQ2EsYUFBYSxDQUFVO0lBRXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBaUM7UUFDekUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQiw4QkFBOEI7UUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixPQUFPO1FBQ1QsQ0FBQztRQUVELGlCQUFpQjtRQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFN0Msa0JBQWtCO1FBQ2xCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVyQyxnQkFBZ0I7UUFDaEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFL0MsUUFBUTtRQUNSLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFDeEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDO1FBRXZELG1CQUFtQjtR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QUFFLEVBQUU7NEJBQ0YsWUFBWSxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWTs0QkFDdkMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsV0FBVzt5QkFDdEM7cUJBQ0Y7b0JBQ0gsQ0FBQyxDQUFDO3dCQUNFLE9BQU8sRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU87cUJBQzlCO2FBQ04sQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQ7O09BRUc7SUFDSyxnQkFBZ0IsQ0FBQyxLQUFpQztRQUN4RCxPQUFPLElBQUksT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ25ELE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBTSxDQUFDLFdBQVc7WUFDaEMsY0FBYyxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVcsUUFBUTtZQUM1QyxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxvQkFBb0I7U0FDdEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0ssc0JBQXNCLENBQUMsR0FBVztRQUN4QyxnRUFBZ0U7UUFDaEUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FDRjtBQTNMRCxzREEyTEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEJlZHJvY2sgQWdlbnTjgrPjg7Pjgrnjg4jjg6njgq/jg4hcbiAqIOaoqemZkOiqjeitmOWei1JBR+OCt+OCueODhuODoOOBruOBn+OCgeOBrkJlZHJvY2sgQWdlbnTntbHlkIhcbiAqL1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgYmVkcm9jayBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYmVkcm9jayc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBCZWRyb2NrQWdlbnRDb25zdHJ1Y3RQcm9wcyB7XG4gIC8qKlxuICAgKiBCZWRyb2NrIEFnZW5044KS5pyJ5Yq55YyW44GZ44KL44GLXG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICBlbmFibGVkPzogYm9vbGVhbjtcblxuICAvKipcbiAgICog44OX44Ot44K444Kn44Kv44OI5ZCNXG4gICAqL1xuICBwcm9qZWN0TmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiDnkrDlooPlkI1cbiAgICovXG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEFnZW505ZCNXG4gICAqL1xuICBhZ2VudE5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogQWdlbnToqqzmmI5cbiAgICovXG4gIGFnZW50RGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIOWfuuebpOODouODh+ODq0lEXG4gICAqIEBkZWZhdWx0IGFudGhyb3BpYy5jbGF1ZGUtdjJcbiAgICovXG4gIGZvdW5kYXRpb25Nb2RlbD86IHN0cmluZztcblxuICAvKipcbiAgICogQWdlbnQgSW5zdHJ1Y3Rpb27vvIjjg5fjg63jg7Pjg5fjg4jvvIlcbiAgICovXG4gIGluc3RydWN0aW9uOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEtub3dsZWRnZSBCYXNlIEFSTu+8iOOCquODl+OCt+ODp+ODs++8iVxuICAgKi9cbiAga25vd2xlZGdlQmFzZUFybj86IHN0cmluZztcblxuICAvKipcbiAgICogQWN0aW9uIEdyb3Vwc++8iOOCquODl+OCt+ODp+ODs++8iVxuICAgKi9cbiAgYWN0aW9uR3JvdXBzPzogQmVkcm9ja0FnZW50QWN0aW9uR3JvdXBbXTtcblxuICAvKipcbiAgICog44Ki44Kk44OJ44Or44K744OD44K344On44Oz44K/44Kk44Og44Ki44Km44OI77yI56eS77yJXG4gICAqIEBkZWZhdWx0IDYwMFxuICAgKi9cbiAgaWRsZVNlc3Npb25UVExJblNlY29uZHM/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEd1YXJkcmFpbCBBUk7vvIjjgqrjg5fjgrfjg6fjg7MgLSBQaGFzZSA177yJXG4gICAqIFNlY3VyaXR5U3RhY2vjgYvjgonlj5blvpfjgZfjgZ9HdWFyZHJhaWwgQVJO44KS5oyH5a6aXG4gICAqL1xuICBndWFyZHJhaWxBcm4/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEd1YXJkcmFpbCBWZXJzaW9u77yI44Kq44OX44K344On44OzIC0gUGhhc2UgNe+8iVxuICAgKiBAZGVmYXVsdCBEUkFGVFxuICAgKi9cbiAgZ3VhcmRyYWlsVmVyc2lvbj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCZWRyb2NrQWdlbnRBY3Rpb25Hcm91cCB7XG4gIC8qKlxuICAgKiBBY3Rpb24gR3JvdXDlkI1cbiAgICovXG4gIGFjdGlvbkdyb3VwTmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBY3Rpb24gR3JvdXDoqqzmmI5cbiAgICovXG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBMYW1iZGHplqLmlbBBUk5cbiAgICovXG4gIGFjdGlvbkdyb3VwRXhlY3V0b3I6IHN0cmluZztcblxuICAvKipcbiAgICogT3BlbkFQSSAzLjDjgrnjgq3jg7zjg57vvIhTM+ODkeOCueOBvuOBn+OBr+OCpOODs+ODqeOCpOODs+OCueOCreODvOODnu+8iVxuICAgKi9cbiAgYXBpU2NoZW1hOiB7XG4gICAgLyoqXG4gICAgICogUzPjg5DjgrHjg4Pjg4jlkI1cbiAgICAgKi9cbiAgICBzM0J1Y2tldE5hbWU/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBTM+OCquODluOCuOOCp+OCr+ODiOOCreODvFxuICAgICAqL1xuICAgIHMzT2JqZWN0S2V5Pzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICog44Kk44Oz44Op44Kk44Oz44K544Kt44O844Oe77yISlNPTuaWh+Wtl+WIl++8iVxuICAgICAqL1xuICAgIHBheWxvYWQ/OiBzdHJpbmc7XG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBCZWRyb2NrQWdlbnRDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAvKipcbiAgICogQmVkcm9jayBBZ2VudFxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGFnZW50PzogYmVkcm9jay5DZm5BZ2VudDtcblxuICAvKipcbiAgICogQWdlbnQgQWxpYXNcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBhZ2VudEFsaWFzPzogYmVkcm9jay5DZm5BZ2VudEFsaWFzO1xuXG4gIC8qKlxuICAgKiBBZ2VudCBJQU3jg63jg7zjg6tcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBhZ2VudFJvbGU/OiBpYW0uUm9sZTtcblxuICAvKipcbiAgICogQWdlbnQgQVJOXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYWdlbnRBcm4/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEFnZW50IEFsaWFzIEFSTlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGFnZW50QWxpYXNBcm4/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEJlZHJvY2tBZ2VudENvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIGVuYWJsZWTjg5Xjg6njgrDjgYxmYWxzZeOBruWgtOWQiOOAgeS9leOCguS9nOaIkOOBl+OBquOBhFxuICAgIGlmICghcHJvcHMuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFnZW50IElBTeODreODvOODq+S9nOaIkFxuICAgIHRoaXMuYWdlbnRSb2xlID0gdGhpcy5jcmVhdGVBZ2VudFJvbGUocHJvcHMpO1xuXG4gICAgLy8gQmVkcm9jayBBZ2VudOS9nOaIkFxuICAgIHRoaXMuYWdlbnQgPSB0aGlzLmNyZWF0ZUFnZW50KHByb3BzKTtcblxuICAgIC8vIEFnZW50IEFsaWFz5L2c5oiQXG4gICAgdGhpcy5hZ2VudEFsaWFzID0gdGhpcy5jcmVhdGVBZ2VudEFsaWFzKHByb3BzKTtcblxuICAgIC8vIEFSTuioreWumlxuICAgIHRoaXMuYWdlbnRBcm4gPSB0aGlzLmFnZW50LmF0dHJBZ2VudEFybjtcbiAgICB0aGlzLmFnZW50QWxpYXNBcm4gPSB0aGlzLmFnZW50QWxpYXMuYXR0ckFnZW50QWxpYXNBcm47XG5cbiAgICAvLyBDbG91ZEZvcm1hdGlvbuWHuuWKm1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBZ2VudEFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFnZW50QXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdCZWRyb2NrIEFnZW50IEFSTicsXG4gICAgICBleHBvcnROYW1lOiBgJHtwcm9wcy5wcm9qZWN0TmFtZX0tJHtwcm9wcy5lbnZpcm9ubWVudH0tYWdlbnQtYXJuYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBZ2VudEFsaWFzQXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMuYWdlbnRBbGlhc0FybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnQmVkcm9jayBBZ2VudCBBbGlhcyBBUk4nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7cHJvcHMucHJvamVjdE5hbWV9LSR7cHJvcHMuZW52aXJvbm1lbnR9LWFnZW50LWFsaWFzLWFybmAsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWdlbnQgSUFN44Ot44O844Or5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUFnZW50Um9sZShwcm9wczogQmVkcm9ja0FnZW50Q29uc3RydWN0UHJvcHMpOiBpYW0uUm9sZSB7XG4gICAgY29uc3Qgcm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQWdlbnRSb2xlJywge1xuICAgICAgcm9sZU5hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS1iZWRyb2NrLWFnZW50LXJvbGVgLFxuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2JlZHJvY2suYW1hem9uYXdzLmNvbScpLFxuICAgICAgZGVzY3JpcHRpb246ICdJQU0gcm9sZSBmb3IgQmVkcm9jayBBZ2VudCcsXG4gICAgfSk7XG5cbiAgICAvLyBCZWRyb2Nr5Z+65pys5qip6ZmQXG4gICAgcm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbJ2JlZHJvY2s6SW52b2tlTW9kZWwnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgYGFybjphd3M6YmVkcm9jazoke2Nkay5TdGFjay5vZih0aGlzKS5yZWdpb259Ojpmb3VuZGF0aW9uLW1vZGVsLyR7XG4gICAgICAgICAgICBwcm9wcy5mb3VuZGF0aW9uTW9kZWwgfHwgJ2FudGhyb3BpYy5jbGF1ZGUtdjInXG4gICAgICAgICAgfWAsXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBLbm93bGVkZ2UgQmFzZeaoqemZkO+8iOaMh+WumuOBleOCjOOBpuOBhOOCi+WgtOWQiO+8iVxuICAgIGlmIChwcm9wcy5rbm93bGVkZ2VCYXNlQXJuKSB7XG4gICAgICByb2xlLmFkZFRvUG9saWN5KFxuICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgIGFjdGlvbnM6IFsnYmVkcm9jazpSZXRyaWV2ZScsICdiZWRyb2NrOlJldHJpZXZlQW5kR2VuZXJhdGUnXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFtwcm9wcy5rbm93bGVkZ2VCYXNlQXJuXSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQWN0aW9uIEdyb3VwcyBMYW1iZGHlrp/ooYzmqKnpmZDvvIjmjIflrprjgZXjgozjgabjgYTjgovloLTlkIjvvIlcbiAgICBpZiAocHJvcHMuYWN0aW9uR3JvdXBzICYmIHByb3BzLmFjdGlvbkdyb3Vwcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBsYW1iZGFBcm5zID0gcHJvcHMuYWN0aW9uR3JvdXBzLm1hcCgoYWcpID0+IGFnLmFjdGlvbkdyb3VwRXhlY3V0b3IpO1xuICAgICAgcm9sZS5hZGRUb1BvbGljeShcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICBhY3Rpb25zOiBbJ2xhbWJkYTpJbnZva2VGdW5jdGlvbiddLFxuICAgICAgICAgIHJlc291cmNlczogbGFtYmRhQXJucyxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvbGU7XG4gIH1cblxuICAvKipcbiAgICogQmVkcm9jayBBZ2VudOS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBZ2VudChwcm9wczogQmVkcm9ja0FnZW50Q29uc3RydWN0UHJvcHMpOiBiZWRyb2NrLkNmbkFnZW50IHtcbiAgICBjb25zdCBhZ2VudENvbmZpZzogYW55ID0ge1xuICAgICAgYWdlbnROYW1lOiBwcm9wcy5hZ2VudE5hbWUsXG4gICAgICBhZ2VudFJlc291cmNlUm9sZUFybjogdGhpcy5hZ2VudFJvbGUhLnJvbGVBcm4sXG4gICAgICBmb3VuZGF0aW9uTW9kZWw6IHByb3BzLmZvdW5kYXRpb25Nb2RlbCB8fCAnYW50aHJvcGljLmNsYXVkZS12MicsXG4gICAgICBpbnN0cnVjdGlvbjogcHJvcHMuaW5zdHJ1Y3Rpb24sXG4gICAgICBkZXNjcmlwdGlvbjogcHJvcHMuYWdlbnREZXNjcmlwdGlvbixcbiAgICAgIGlkbGVTZXNzaW9uVHRsSW5TZWNvbmRzOiBwcm9wcy5pZGxlU2Vzc2lvblRUTEluU2Vjb25kcyB8fCA2MDAsXG4gICAgfTtcblxuICAgIC8vIEd1YXJkcmFpbHPoqK3lrprvvIhQaGFzZSA1IC0gU2VjdXJpdHlTdGFja+OBi+OCieWPluW+l++8iVxuICAgIGlmIChwcm9wcy5ndWFyZHJhaWxBcm4pIHtcbiAgICAgIGFnZW50Q29uZmlnLmd1YXJkcmFpbENvbmZpZ3VyYXRpb24gPSB7XG4gICAgICAgIGd1YXJkcmFpbElkZW50aWZpZXI6IHByb3BzLmd1YXJkcmFpbEFybixcbiAgICAgICAgZ3VhcmRyYWlsVmVyc2lvbjogcHJvcHMuZ3VhcmRyYWlsVmVyc2lvbiB8fCAnRFJBRlQnLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBhZ2VudCA9IG5ldyBiZWRyb2NrLkNmbkFnZW50KHRoaXMsICdBZ2VudCcsIGFnZW50Q29uZmlnKTtcblxuICAgIC8vIEtub3dsZWRnZSBCYXNl6Zai6YCj5LuY44GR77yI5oyH5a6a44GV44KM44Gm44GE44KL5aC05ZCI77yJXG4gICAgaWYgKHByb3BzLmtub3dsZWRnZUJhc2VBcm4pIHtcbiAgICAgIGFnZW50Lmtub3dsZWRnZUJhc2VzID0gW1xuICAgICAgICB7XG4gICAgICAgICAga25vd2xlZGdlQmFzZUlkOiB0aGlzLmV4dHJhY3RLbm93bGVkZ2VCYXNlSWQocHJvcHMua25vd2xlZGdlQmFzZUFybiksXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdQZXJtaXNzaW9uLWF3YXJlIFJBRyBLbm93bGVkZ2UgQmFzZScsXG4gICAgICAgICAga25vd2xlZGdlQmFzZVN0YXRlOiAnRU5BQkxFRCcsXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIC8vIEFjdGlvbiBHcm91cHPoqK3lrprvvIjmjIflrprjgZXjgozjgabjgYTjgovloLTlkIjvvIlcbiAgICBpZiAocHJvcHMuYWN0aW9uR3JvdXBzICYmIHByb3BzLmFjdGlvbkdyb3Vwcy5sZW5ndGggPiAwKSB7XG4gICAgICBhZ2VudC5hY3Rpb25Hcm91cHMgPSBwcm9wcy5hY3Rpb25Hcm91cHMubWFwKChhZykgPT4gKHtcbiAgICAgICAgYWN0aW9uR3JvdXBOYW1lOiBhZy5hY3Rpb25Hcm91cE5hbWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBhZy5kZXNjcmlwdGlvbixcbiAgICAgICAgYWN0aW9uR3JvdXBFeGVjdXRvcjoge1xuICAgICAgICAgIGxhbWJkYTogYWcuYWN0aW9uR3JvdXBFeGVjdXRvcixcbiAgICAgICAgfSxcbiAgICAgICAgYXBpU2NoZW1hOiBhZy5hcGlTY2hlbWEuczNCdWNrZXROYW1lXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIHMzOiB7XG4gICAgICAgICAgICAgICAgczNCdWNrZXROYW1lOiBhZy5hcGlTY2hlbWEuczNCdWNrZXROYW1lLFxuICAgICAgICAgICAgICAgIHMzT2JqZWN0S2V5OiBhZy5hcGlTY2hlbWEuczNPYmplY3RLZXksXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgOiB7XG4gICAgICAgICAgICAgIHBheWxvYWQ6IGFnLmFwaVNjaGVtYS5wYXlsb2FkLFxuICAgICAgICAgICAgfSxcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWdlbnQ7XG4gIH1cblxuICAvKipcbiAgICogQWdlbnQgQWxpYXPkvZzmiJBcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQWdlbnRBbGlhcyhwcm9wczogQmVkcm9ja0FnZW50Q29uc3RydWN0UHJvcHMpOiBiZWRyb2NrLkNmbkFnZW50QWxpYXMge1xuICAgIHJldHVybiBuZXcgYmVkcm9jay5DZm5BZ2VudEFsaWFzKHRoaXMsICdBZ2VudEFsaWFzJywge1xuICAgICAgYWdlbnRJZDogdGhpcy5hZ2VudCEuYXR0ckFnZW50SWQsXG4gICAgICBhZ2VudEFsaWFzTmFtZTogYCR7cHJvcHMuZW52aXJvbm1lbnR9LWFsaWFzYCxcbiAgICAgIGRlc2NyaXB0aW9uOiBgJHtwcm9wcy5lbnZpcm9ubWVudH0gZW52aXJvbm1lbnQgYWxpYXNgLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEtub3dsZWRnZSBCYXNlIEFSTuOBi+OCiUlE44KS5oq95Ye6XG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3RLbm93bGVkZ2VCYXNlSWQoYXJuOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIEFSTuW9ouW8jzogYXJuOmF3czpiZWRyb2NrOntyZWdpb259OnthY2NvdW50fTprbm93bGVkZ2UtYmFzZS97aWR9XG4gICAgY29uc3QgcGFydHMgPSBhcm4uc3BsaXQoJy8nKTtcbiAgICByZXR1cm4gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gIH1cbn1cbiJdfQ==