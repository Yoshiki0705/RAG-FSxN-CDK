/**
 * ComputeStack - 統合コンピュート・AIスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合コンピュートコンストラクトによる一元管理
 * - Lambda・Batch・ECS・Bedrock・Embeddingの統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
 */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeConstruct } from '../../modules/compute/constructs/compute-construct';
import { AiConstruct } from '../../modules/ai/constructs/ai-construct';
import { SecurityStack } from './security-stack';
export interface ComputeStackProps extends cdk.StackProps {
    readonly config: any;
    readonly existingResourceIds?: any;
    readonly securityStack?: SecurityStack;
    readonly namingGenerator?: any;
}
/**
 * 統合コンピュート・AIスタック（モジュラーアーキテクチャ対応）
 *
 * 統合コンピュート・AIコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
export declare class ComputeStack extends cdk.Stack {
    /** 統合コンピュートコンストラクト */
    readonly compute: ComputeConstruct;
    /** 統合AIコンストラクト */
    readonly ai: AiConstruct;
    /** Lambda関数ARN（他スタックからの参照用） */
    readonly lambdaFunctionArns: {
        [key: string]: string;
    };
    /** Bedrock Model ARN（他スタックからの参照用） */
    readonly bedrockModelArn?: string;
    constructor(scope: Construct, id: string, props: ComputeStackProps);
    /**
     * 他スタックからの参照用プロパティ設定
     */
    private setupCrossStackReferences;
    /**
     * スタック出力作成（個別デプロイ対応）
     */
    private createOutputs;
    /**
     * スタックタグ設定（Agent Steering準拠）
     */
    private addStackTags;
}
