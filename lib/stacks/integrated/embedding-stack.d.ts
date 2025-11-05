/**
 * 統合Embeddingスタック
 *
 * モジュラーアーキテクチャに基づくEmbedding・AI統合管理
 * - Lambda 関数（Embedding処理）
 * - AI/ML サービス (Bedrock)
 * - バッチ処理（AWS Batch）
 * - コンテナサービス (ECS)
 * - 統一命名規則: Component="Embedding"
 */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeConstruct } from '../../modules/compute/constructs/compute-construct';
import { ComputeConfig } from '../../modules/compute/interfaces/compute-config';
import { AiConfig } from '../../modules/ai/interfaces/ai-config';
import { EmbeddingBatchIntegration } from '../../modules/embedding/constructs/embedding-batch-integration';
import { BatchIntegrationTest } from '../../modules/embedding/constructs/batch-integration-test';
import { SqliteLoadTest } from '../../modules/embedding/constructs/sqlite-load-test';
import { WindowsSqlite } from '../../modules/embedding/constructs/windows-sqlite';
import { EmbeddingConfig } from '../../modules/ai/interfaces/embedding-config';
export interface EmbeddingStackProps extends cdk.StackProps {
    computeConfig: ComputeConfig;
    aiConfig: AiConfig;
    projectName: string;
    environment: string;
    vpcId?: string;
    privateSubnetIds?: string[];
    securityGroupIds?: string[];
    kmsKeyArn?: string;
    s3BucketArns?: string[];
    dynamoDbTableArns?: string[];
    openSearchCollectionArn?: string;
    enableBatchIntegration?: boolean;
    enableBatchTesting?: boolean;
    imagePath?: string;
    imageTag?: string;
    enableSqliteLoadTest?: boolean;
    enableWindowsLoadTest?: boolean;
    fsxFileSystemId?: string;
    fsxSvmId?: string;
    fsxVolumeId?: string;
    fsxMountPath?: string;
    fsxNfsEndpoint?: string;
    fsxCifsEndpoint?: string;
    fsxCifsShareName?: string;
    keyPairName?: string;
    bedrockRegion?: string;
    bedrockModelId?: string;
    scheduleExpression?: string;
    maxvCpus?: number;
    instanceTypes?: string[];
    windowsInstanceType?: string;
}
export declare class EmbeddingStack extends cdk.Stack {
    readonly computeConstruct: ComputeConstruct;
    readonly aiConstruct: AiConstruct;
    readonly embeddingBatchIntegration?: EmbeddingBatchIntegration;
    readonly batchIntegrationTest?: BatchIntegrationTest;
    readonly embeddingConfig: EmbeddingConfig;
    readonly sqliteLoadTest?: SqliteLoadTest;
    readonly windowsSqlite?: WindowsSqlite;
    readonly lambdaFunctions: {
        [key: string]: cdk.aws_lambda.Function;
    };
    readonly ecsCluster?: cdk.aws_ecs.Cluster;
    readonly batchJobQueue?: cdk.aws_batch.JobQueue;
    readonly bedrockModels: {
        [key: string]: string;
    };
    readonly embeddingFunction?: cdk.aws_lambda.Function;
    constructor(scope: Construct, id: string, props: EmbeddingStackProps);
    /**
     * 共通リソース作成
     */
    private createCommonResources;
    /**
     * 共通サービスロール作成
     */
    private createCommonServiceRole;
    /**
     * 共通ロググループ作成
     */
    private createCommonLogGroup;
    /**
     * CloudFormation出力の作成（統一命名規則適用）
     */
    private createOutputs;
    /**
     * スタックレベルのタグ設定（統一命名規則適用）
     */
    private applyStackTags;
    /**
     * 他のスタックで使用するためのEmbeddingリソース情報を取得
     */
    getEmbeddingInfo(): {
        lambdaFunctions: {
            [key: string]: cdk.aws_lambda.Function;
        };
        ecsCluster: cdk.aws_ecs.Cluster;
        batchJobQueue: cdk.aws_batch.JobQueue;
        bedrockModels: {
            [key: string]: string;
        };
        embeddingFunction: cdk.aws_lambda.Function;
    };
    /**
     * 特定のLambda関数を取得
     */
    getLambdaFunction(name: string): cdk.aws_lambda.Function | undefined;
    /**
     * 特定のBedrockモデルIDを取得
     */
    getBedrockModelId(name: string): string | undefined;
    /**
     * Lambda関数用のIAMポリシーステートメントを生成
     */
    getLambdaExecutionPolicyStatements(): cdk.aws_iam.PolicyStatement[];
    /**
     * ECS タスク用のIAMポリシーステートメントを生成
     */
    getEcsTaskPolicyStatements(): cdk.aws_iam.PolicyStatement[];
    /**
     * Batch統合情報を取得
     */
    getBatchIntegrationInfo(): Record<string, any> | undefined;
    /**
     * Batchジョブを実行
     */
    submitBatchJob(jobName: string, parameters: Record<string, string>): Promise<string | undefined>;
    /**
     * Batchジョブ状況を取得
     */
    getBatchJobStatus(): Record<string, any> | undefined;
    /**
     * Batch統合テスト実行
     */
    runBatchIntegrationTest(testType?: 'basic' | 'fsx' | 'recovery'): Promise<string | undefined>;
    /**
     * Embedding設定を取得
     */
    getEmbeddingConfig(): EmbeddingConfig;
    /**
     * SQLite負荷試験ジョブを実行
     */
    submitSqliteLoadTestJob(jobName?: string): string | undefined;
    /**
     * SQLite負荷試験統合情報を取得
     */
    getSqliteLoadTestInfo(): Record<string, any> | undefined;
    /**
     * Windows SQLite負荷試験情報を取得
     */
    getWindowsSqliteInfo(): Record<string, any> | undefined;
    /**
     * CDKコンテキスト設定例を取得
     */
    static getContextExample(environment: string): Record<string, any>;
}
