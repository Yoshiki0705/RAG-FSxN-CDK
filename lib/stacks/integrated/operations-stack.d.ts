/**
 * OperationsStack - 統合運用・エンタープライズスタック（モジュラーアーキテクチャ対応）
 *
 * 機能:
 * - 統合監視・エンタープライズコンストラクトによる一元管理
 * - CloudWatch・X-Ray・SNS・BI・組織管理の統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
 */
import * as cdk from 'aws-cdk-lib';
import { MonitoringConstruct } from '../../modules/monitoring/constructs/monitoring-construct';
import { EnterpriseConstruct } from '../../modules/enterprise/constructs/enterprise-construct';
import { SecurityStack } from './security-stack';
import { DataStack } from './data-stack';
import { ComputeStack } from './compute-stack';
import { WebAppStack } from './webapp-stack';
export interface OperationsStackProps extends cdk.StackProps {
    readonly config: any;
    readonly securityStack?: SecurityStack;
    readonly dataStack?: DataStack;
    readonly computeStack?: ComputeStack;
    readonly webAppStack?: WebAppStack;
    readonly namingGenerator?: any;
}
/**
 * 統合運用・エンタープライズスタック（モジュラーアーキテクチャ対応）
 *
 * 統合監視・エンタープライズコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
export declare class OperationsStack extends cdk.Stack {
    /** 統合監視コンストラクト */
    readonly monitoring: MonitoringConstruct;
    /** 統合エンタープライズコンストラクト */
    readonly enterprise: EnterpriseConstruct;
    /** CloudWatchダッシュボードURL（他スタックからの参照用） */
    readonly dashboardUrl?: string;
    /** SNSトピックARN（他スタックからの参照用） */
    readonly snsTopicArns: {
        [key: string]: string;
    };
    /**
     * 他スタックからの参照用プロパティ設定
     */
    private setupCrossStackReferences;
    /** コンプライアンスコンストラクト */
    readonly compliance: ComplianceConstruct;
}
