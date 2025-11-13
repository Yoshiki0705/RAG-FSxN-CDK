"use strict";
/**
 * Cognito認識型Lambda関数コンストラクト
 *
 * Cognito VPC Endpoint有効時のみLambda関数をVPC内に配置
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
exports.CognitoAwareLambda = void 0;
exports.createCognitoAwareLambda = createCognitoAwareLambda;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const constructs_1 = require("constructs");
/**
 * Cognito認識型Lambda関数コンストラクト
 *
 * Cognito VPC Endpoint有効時のみLambda関数をVPC内に配置し、
 * 環境変数で接続モードを通知します。
 *
 * 使用例:
 * ```typescript
 * const authFunction = new CognitoAwareLambda(this, 'AuthFunction', {
 *   functionName: 'auth-function',
 *   code: lambda.Code.fromAsset('lambda/auth'),
 *   handler: 'index.handler',
 *   vpc,
 *   cognitoPrivateEndpointEnabled: true,
 *   projectName: 'my-project',
 *   environment: 'prod',
 * });
 * ```
 */
class CognitoAwareLambda extends constructs_1.Construct {
    /**
     * 作成されたLambda関数
     */
    function;
    /**
     * Cognito接続モード
     * - 'private': VPC Endpoint経由
     * - 'public': インターネット経由
     */
    connectionMode;
    constructor(scope, id, props) {
        super(scope, id);
        // Cognito接続モードの決定
        this.connectionMode = props.cognitoPrivateEndpointEnabled ? 'private' : 'public';
        // 環境変数の準備
        const environment = {
            ...props.environment,
            COGNITO_CONNECTION_MODE: this.connectionMode,
            PROJECT_NAME: props.projectName,
            ENVIRONMENT: props.environment,
        };
        // VPC設定の準備（Private接続モードの場合のみ）
        const vpcConfig = this.connectionMode === 'private' && props.vpc ? {
            vpc: props.vpc,
            vpcSubnets: props.vpcSubnets ?? {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: props.securityGroups,
        } : {};
        // Lambda関数作成
        this.function = new lambda.Function(this, 'Function', {
            functionName: `${props.projectName}-${props.environment}-${props.functionName}`,
            code: props.code,
            handler: props.handler,
            runtime: props.runtime ?? lambda.Runtime.NODEJS_20_X,
            timeout: props.timeout ?? cdk.Duration.seconds(30),
            memorySize: props.memorySize ?? 512,
            environment,
            ...vpcConfig,
        });
        // Private接続モードの場合、VPC Endpointアクセス用IAMポリシー追加
        if (this.connectionMode === 'private') {
            this.addVpcEndpointAccessPolicy();
        }
        // タグ設定
        cdk.Tags.of(this.function).add('ConnectionMode', this.connectionMode);
        cdk.Tags.of(this.function).add('Project', props.projectName);
        cdk.Tags.of(this.function).add('Environment', props.environment);
        // ログ出力
        console.log(`✅ Lambda関数作成: ${this.function.functionName}`);
        console.log(`   接続モード: ${this.connectionMode}`);
        console.log(`   VPC配置: ${this.connectionMode === 'private' ? 'Yes' : 'No'}`);
    }
    /**
     * VPC Endpointアクセス用IAMポリシー追加
     */
    addVpcEndpointAccessPolicy() {
        // Cognito User Pools APIへのアクセス権限
        this.function.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'cognito-idp:AdminInitiateAuth',
                'cognito-idp:AdminGetUser',
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminSetUserPassword',
                'cognito-idp:AdminUpdateUserAttributes',
                'cognito-idp:AdminDeleteUser',
                'cognito-idp:ListUsers',
                'cognito-idp:GetUser',
            ],
            resources: [
                `arn:aws:cognito-idp:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:userpool/*`,
            ],
        }));
        // VPC Endpointへのネットワークアクセス権限（暗黙的に付与される）
        console.log('   IAMポリシー追加: Cognito User Pools API アクセス権限');
    }
    /**
     * Lambda関数に環境変数を追加
     */
    addEnvironment(key, value) {
        this.function.addEnvironment(key, value);
    }
    /**
     * Lambda関数にIAMポリシーを追加
     */
    addToRolePolicy(statement) {
        this.function.addToRolePolicy(statement);
    }
    /**
     * Lambda関数に実行権限を付与
     */
    grantInvoke(grantee) {
        return this.function.grantInvoke(grantee);
    }
}
exports.CognitoAwareLambda = CognitoAwareLambda;
/**
 * Cognito認識型Lambda関数を作成するヘルパー関数
 *
 * @param scope コンストラクトスコープ
 * @param id コンストラクトID
 * @param props Lambda関数プロパティ
 * @returns 作成されたLambda関数
 */
function createCognitoAwareLambda(scope, id, props) {
    const cognitoAwareLambda = new CognitoAwareLambda(scope, id, props);
    return cognitoAwareLambda.function;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by1hd2FyZS1sYW1iZGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2duaXRvLWF3YXJlLWxhbWJkYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpT0gsNERBT0M7QUF0T0QsaURBQW1DO0FBQ25DLCtEQUFpRDtBQUNqRCx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLDJDQUF1QztBQWdGdkM7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWtCRztBQUNILE1BQWEsa0JBQW1CLFNBQVEsc0JBQVM7SUFDL0M7O09BRUc7SUFDYSxRQUFRLENBQWtCO0lBRTFDOzs7O09BSUc7SUFDYSxjQUFjLENBQXVCO0lBRXJELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBOEI7UUFDdEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixrQkFBa0I7UUFDbEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBRWpGLFVBQVU7UUFDVixNQUFNLFdBQVcsR0FBRztZQUNsQixHQUFHLEtBQUssQ0FBQyxXQUFXO1lBQ3BCLHVCQUF1QixFQUFFLElBQUksQ0FBQyxjQUFjO1lBQzVDLFlBQVksRUFBRSxLQUFLLENBQUMsV0FBVztZQUMvQixXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7U0FDL0IsQ0FBQztRQUVGLDhCQUE4QjtRQUM5QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRSxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7WUFDZCxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVUsSUFBSTtnQkFDOUIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1C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Q0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7T0FFRztJQUNJLGVBQWUsQ0FBQyxTQUE4QjtRQUNuRCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxXQUFXLENBQUMsT0FBdUI7UUFDeEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QyxDQUFDO0NBQ0Y7QUE5R0QsZ0RBOEdDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLHdCQUF3QixDQUN0QyxLQUFnQixFQUNoQixFQUFVLEVBQ1YsS0FBOEI7SUFFOUIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEUsT0FBTyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7QUFDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29nbml0b+iqjeitmOWei0xhbWJkYemWouaVsOOCs+ODs+OCueODiOODqeOCr+ODiFxuICogXG4gKiBDb2duaXRvIFZQQyBFbmRwb2ludOacieWKueaZguOBruOBv0xhbWJkYemWouaVsOOCklZQQ+WGheOBq+mFjee9rlxuICovXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLyoqXG4gKiBDb2duaXRv6KqN6K2Y5Z6LTGFtYmRh6Zai5pWw44Gu44OX44Ot44OR44OG44KjXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29nbml0b0F3YXJlTGFtYmRhUHJvcHMge1xuICAvKipcbiAgICogTGFtYmRh6Zai5pWw5ZCNXG4gICAqL1xuICBmdW5jdGlvbk5hbWU6IHN0cmluZztcbiAgXG4gIC8qKlxuICAgKiBMYW1iZGHplqLmlbDjgrPjg7zjg4lcbiAgICovXG4gIGNvZGU6IGxhbWJkYS5Db2RlO1xuICBcbiAgLyoqXG4gICAqIExhbWJkYemWouaVsOODj+ODs+ODieODqeODvFxuICAgKi9cbiAgaGFuZGxlcjogc3RyaW5nO1xuICBcbiAgLyoqXG4gICAqIExhbWJkYemWouaVsOODqeODs+OCv+OCpOODoFxuICAgKiBAZGVmYXVsdCBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWFxuICAgKi9cbiAgcnVudGltZT86IGxhbWJkYS5SdW50aW1lO1xuICBcbiAgLyoqXG4gICAqIExhbWJkYemWouaVsOOCv+OCpOODoOOCouOCpuODiFxuICAgKiBAZGVmYXVsdCBjZGsuRHVyYXRpb24uc2Vjb25kcygzMClcbiAgICovXG4gIHRpbWVvdXQ/OiBjZGsuRHVyYXRpb247XG4gIFxuICAvKipcbiAgICogTGFtYmRh6Zai5pWw44Oh44Oi44Oq44K144Kk44K6XG4gICAqIEBkZWZhdWx0IDUxMlxuICAgKi9cbiAgbWVtb3J5U2l6ZT86IG51bWJlcjtcbiAgXG4gIC8qKlxuICAgKiDnkrDlooPlpInmlbBcbiAgICovXG4gIGVudmlyb25tZW50PzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbiAgXG4gIC8qKlxuICAgKiBWUEPvvIhDb2duaXRvIFByaXZhdGUgRW5kcG9pbnTmnInlirnmmYLjgavkvb/nlKjvvIlcbiAgICovXG4gIHZwYz86IGVjMi5JVnBjO1xuICBcbiAgLyoqXG4gICAqIFZQQ+WGheOBq+mFjee9ruOBmeOCi+OCteODluODjeODg+ODiOmBuOaKnlxuICAgKiBAZGVmYXVsdCB7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MgfVxuICAgKi9cbiAgdnBjU3VibmV0cz86IGVjMi5TdWJuZXRTZWxlY3Rpb247XG4gIFxuICAvKipcbiAgICog44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OXXG4gICAqL1xuICBzZWN1cml0eUdyb3Vwcz86IGVjMi5JU2VjdXJpdHlHcm91cFtdO1xuICBcbiAgLyoqXG4gICAqIENvZ25pdG8gVlBDIEVuZHBvaW5044GM5pyJ5Yq544GL44Gp44GG44GLXG4gICAqIFxuICAgKiAtIHRydWU6IExhbWJkYemWouaVsOOCklZQQ+WGheOBq+mFjee9rlxuICAgKiAtIGZhbHNlOiBMYW1iZGHplqLmlbDjgpJWUEPlpJbjgavphY3nva7vvIjjg4fjg5Xjgqnjg6vjg4jvvIlcbiAgICogXG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICBjb2duaXRvUHJpdmF0ZUVuZHBvaW50RW5hYmxlZD86IGJvb2xlYW47XG4gIFxuICAvKipcbiAgICog44OX44Ot44K444Kn44Kv44OI5ZCNXG4gICAqL1xuICBwcm9qZWN0TmFtZTogc3RyaW5nO1xuICBcbiAgLyoqXG4gICAqIOeSsOWig+WQjVxuICAgKi9cbn1cblxuLyoqXG4gKiBDb2duaXRv6KqN6K2Y5Z6LTGFtYmRh6Zai5pWw44Kz44Oz44K544OI44Op44Kv44OIXG4gKiBcbiAqIENvZ25pdG8gVlBDIEVuZHBvaW505pyJ5Yq55pmC44Gu44G/TGFtYmRh6Zai5pWw44KSVlBD5YaF44Gr6YWN572u44GX44CBXG4gKiDnkrDlooPlpInmlbDjgafmjqXntprjg6Ljg7zjg4njgpLpgJrnn6XjgZfjgb7jgZnjgIJcbiAqIFxuICog5L2/55So5L6LOlxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgYXV0aEZ1bmN0aW9uID0gbmV3IENvZ25pdG9Bd2FyZUxhbWJkYSh0aGlzLCAnQXV0aEZ1bmN0aW9uJywge1xuICogICBmdW5jdGlvbk5hbWU6ICdhdXRoLWZ1bmN0aW9uJyxcbiAqICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGEvYXV0aCcpLFxuICogICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gKiAgIHZwYyxcbiAqICAgY29nbml0b1ByaXZhdGVFbmRwb2ludEVuYWJsZWQ6IHRydWUsXG4gKiAgIHByb2plY3ROYW1lOiAnbXktcHJvamVjdCcsXG4gKiAgIGVudmlyb25tZW50OiAncHJvZCcsXG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQ29nbml0b0F3YXJlTGFtYmRhIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgLyoqXG4gICAqIOS9nOaIkOOBleOCjOOBn0xhbWJkYemWouaVsFxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGZ1bmN0aW9uOiBsYW1iZGEuRnVuY3Rpb247XG4gIFxuICAvKipcbiAgICogQ29nbml0b+aOpee2muODouODvOODiVxuICAgKiAtICdwcml2YXRlJzogVlBDIEVuZHBvaW5057WM55SxXG4gICAqIC0gJ3B1YmxpYyc6IOOCpOODs+OCv+ODvOODjeODg+ODiOe1jOeUsVxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNvbm5lY3Rpb25Nb2RlOiAncHJpdmF0ZScgfCAncHVibGljJztcbiAgXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDb2duaXRvQXdhcmVMYW1iZGFQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG4gICAgXG4gICAgLy8gQ29nbml0b+aOpee2muODouODvOODieOBruaxuuWumlxuICAgIHRoaXMuY29ubmVjdGlvbk1vZGUgPSBwcm9wcy5jb2duaXRvUHJpdmF0ZUVuZHBvaW50RW5hYmxlZCA/ICdwcml2YXRlJyA6ICdwdWJsaWMnO1xuICAgIFxuICAgIC8vIOeSsOWig+WkieaVsOOBrua6luWCmVxuICAgIGNvbnN0IGVudmlyb25tZW50ID0ge1xuICAgICAgLi4ucHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICBDT0dOSVRPX0NPTk5FQ1RJT05fTU9ERTogdGhpcy5jb25uZWN0aW9uTW9kZSxcbiAgICAgIFBST0pFQ1RfTkFNRTogcHJvcHMucHJvamVjdE5hbWUsXG4gICAgICBFTlZJUk9OTUVOVDogcHJvcHMuZW52aXJvbm1lbnQsXG4gICAgfTtcbiAgICBcbiAgICAvLyBWUEPoqK3lrprjga7mupblgpnvvIhQcml2YXRl5o6l57aa44Oi44O844OJ44Gu5aC05ZCI44Gu44G/77yJXG4gICAgY29uc3QgdnBjQ29uZmlnID0gdGhpcy5jb25uZWN0aW9uTW9kZSA9PT0gJ3ByaXZhdGUnICYmIHByb3BzLnZwYyA/IHtcbiAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgdnBjU3VibmV0czogcHJvcHMudnBjU3VibmV0cyA/PyB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICB9LFxuICAgICAgc2VjdXJpdHlHcm91cHM6IHByb3BzLnNlY3VyaXR5R3JvdXBzLFxuICAgIH0gOiB7fTtcbiAgICBcbiAgICAvLyBMYW1iZGHplqLmlbDkvZzmiJBcbiAgICB0aGlzLmZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnRnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGAke3Byb3BzLnByb2plY3ROYW1lfS0ke3Byb3BzLmVudmlyb25tZW50fS0ke3Byb3BzLmZ1bmN0aW9uTmFtZX1gLFxuICAgICAgY29kZTogcHJvcHMuY29kZSxcbiAgICAgIGhhbmRsZXI6IHByb3BzLmhhbmRsZXIsXG4gICAgICBydW50aW1lOiBwcm9wcy5ydW50aW1lID8/IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgdGltZW91dDogcHJvcHMudGltZW91dCA/PyBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBtZW1vcnlTaXplOiBwcm9wcy5tZW1vcnlTaXplID8/IDUxMixcbiAgICAgIGVudmlyb25tZW50LFxuICAgICAgLi4udnBjQ29uZmlnLFxuICAgIH0pO1xuICAgIFxuICAgIC8vIFByaXZhdGXmjqXntprjg6Ljg7zjg4njga7loLTlkIjjgIFWUEMgRW5kcG9pbnTjgqLjgq/jgrvjgrnnlKhJQU3jg53jg6rjgrfjg7zov73liqBcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uTW9kZSA9PT0gJ3ByaXZhdGUnKSB7XG4gICAgICB0aGlzLmFkZFZwY0VuZHBvaW50QWNjZXNzUG9saWN5KCk7XG4gICAgfVxuICAgIFxuICAgIC8vIOOCv+OCsOioreWumlxuICAgIGNkay5UYWdzLm9mKHRoaXMuZnVuY3Rpb24pLmFkZCgnQ29ubmVjdGlvbk1vZGUnLCB0aGlzLmNvbm5lY3Rpb25Nb2RlKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmZ1bmN0aW9uKS5hZGQoJ1Byb2plY3QnLCBwcm9wcy5wcm9qZWN0TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5mdW5jdGlvbikuYWRkKCdFbnZpcm9ubWVudCcsIHByb3BzLmVudmlyb25tZW50KTtcbiAgICBcbiAgICAvLyDjg63jgrDlh7rliptcbiAgICBjb25zb2xlLmxvZyhg4pyFIExhbWJkYemWouaVsOS9nOaIkDogJHt0aGlzLmZ1bmN0aW9uLmZ1bmN0aW9uTmFtZX1gKTtcbiAgICBjb25zb2xlLmxvZyhgICAg5o6l57aa44Oi44O844OJOiAke3RoaXMuY29ubmVjdGlvbk1vZGV9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIFZQQ+mFjee9rjogJHt0aGlzLmNvbm5lY3Rpb25Nb2RlID09PSAncHJpdmF0ZScgPyAnWWVzJyA6ICdObyd9YCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWUEMgRW5kcG9pbnTjgqLjgq/jgrvjgrnnlKhJQU3jg53jg6rjgrfjg7zov73liqBcbiAgICovXG4gIHByaXZhdGUgYWRkVnBjRW5kcG9pbnRBY2Nlc3NQb2xpY3koKTogdm9pZCB7XG4gICAgLy8gQ29nbml0byBVc2VyIFBvb2xzIEFQSeOBuOOBruOCouOCr+OCu+OCueaoqemZkFxuICAgIHRoaXMuZnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2NvZ25pdG8taWRwOkFkbWluSW5pdGlhdGVBdXRoJyxcbiAgICAgICAgJ2NvZ25pdG8taWRwOkFkbWluR2V0VXNlcicsXG4gICAgICAgICdjb2duaXRvLWlkcDpBZG1pbkNyZWF0ZVVzZXInLFxuICAgICAgICAnY29nbml0by1pZHA6QWRtaW5TZXRVc2VyUGFzc3dvcmQnLFxuICAgICAgICAnY29nbml0by1pZHA6QWRtaW5VcGRhdGVVc2VyQXR0cmlidXRlcycsXG4gICAgICAgICdjb2duaXRvLWlkcDpBZG1pbkRlbGV0ZVVzZXInLFxuICAgICAgICAnY29nbml0by1pZHA6TGlzdFVzZXJzJyxcbiAgICAgICAgJ2NvZ25pdG8taWRwOkdldFVzZXInLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW1xuICAgICAgICBgYXJuOmF3czpjb2duaXRvLWlkcDoke2Nkay5TdGFjay5vZih0aGlzKS5yZWdpb259OiR7Y2RrLlN0YWNrLm9mKHRoaXMpLmFjY291bnR9OnVzZXJwb29sLypgLFxuICAgICAgXSxcbiAgICB9KSk7XG4gICAgXG4gICAgLy8gVlBDIEVuZHBvaW5044G444Gu44ON44OD44OI44Ov44O844Kv44Ki44Kv44K744K55qip6ZmQ77yI5pqX6buZ55qE44Gr5LuY5LiO44GV44KM44KL77yJXG4gICAgY29uc29sZS5sb2coJyAgIElBTeODneODquOCt+ODvOi/veWKoDogQ29nbml0byBVc2VyIFBvb2xzIEFQSSDjgqLjgq/jgrvjgrnmqKnpmZAnKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIExhbWJkYemWouaVsOOBq+eSsOWig+WkieaVsOOCkui/veWKoFxuICAgKi9cbiAgcHVibGljIGFkZEVudmlyb25tZW50KGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5mdW5jdGlvbi5hZGRFbnZpcm9ubWVudChrZXksIHZhbHVlKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIExhbWJkYemWouaVsOOBq0lBTeODneODquOCt+ODvOOCkui/veWKoFxuICAgKi9cbiAgcHVibGljIGFkZFRvUm9sZVBvbGljeShzdGF0ZW1lbnQ6IGlhbS5Qb2xpY3lTdGF0ZW1lbnQpOiB2b2lkIHtcbiAgICB0aGlzLmZ1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShzdGF0ZW1lbnQpO1xuICB9XG4gIFxuICAvKipcbiAgICogTGFtYmRh6Zai5pWw44Gr5a6f6KGM5qip6ZmQ44KS5LuY5LiOXG4gICAqL1xuICBwdWJsaWMgZ3JhbnRJbnZva2UoZ3JhbnRlZTogaWFtLklHcmFudGFibGUpOiBpYW0uR3JhbnQge1xuICAgIHJldHVybiB0aGlzLmZ1bmN0aW9uLmdyYW50SW52b2tlKGdyYW50ZWUpO1xuICB9XG59XG5cbi8qKlxuICogQ29nbml0b+iqjeitmOWei0xhbWJkYemWouaVsOOCkuS9nOaIkOOBmeOCi+ODmOODq+ODkeODvOmWouaVsFxuICogXG4gKiBAcGFyYW0gc2NvcGUg44Kz44Oz44K544OI44Op44Kv44OI44K544Kz44O844OXXG4gKiBAcGFyYW0gaWQg44Kz44Oz44K544OI44Op44Kv44OISURcbiAqIEBwYXJhbSBwcm9wcyBMYW1iZGHplqLmlbDjg5fjg63jg5Hjg4bjgqNcbiAqIEByZXR1cm5zIOS9nOaIkOOBleOCjOOBn0xhbWJkYemWouaVsFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29nbml0b0F3YXJlTGFtYmRhKFxuICBzY29wZTogQ29uc3RydWN0LFxuICBpZDogc3RyaW5nLFxuICBwcm9wczogQ29nbml0b0F3YXJlTGFtYmRhUHJvcHNcbik6IGxhbWJkYS5GdW5jdGlvbiB7XG4gIGNvbnN0IGNvZ25pdG9Bd2FyZUxhbWJkYSA9IG5ldyBDb2duaXRvQXdhcmVMYW1iZGEoc2NvcGUsIGlkLCBwcm9wcyk7XG4gIHJldHVybiBjb2duaXRvQXdhcmVMYW1iZGEuZnVuY3Rpb247XG59XG4iXX0=