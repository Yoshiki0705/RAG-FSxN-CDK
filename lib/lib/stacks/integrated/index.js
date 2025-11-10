"use strict";
/**
 * 統合スタック インデックス
 *
 * モジュラーアーキテクチャに基づく6つの統合CDKスタック
 * 依存関係に基づく段階的デプロイメント対応
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEGRATED_STACKS_INFO = exports.STACK_METADATA = exports.STACK_DEPENDENCIES = exports.DEPLOYMENT_ORDER = exports.OperationsStack = exports.AdvancedPermissionStack = exports.WebAppStack = exports.EmbeddingStack = exports.DataStack = exports.NetworkingStack = exports.SecurityStack = void 0;
// 統合スタックのエクスポート
var security_stack_1 = require("./security-stack");
Object.defineProperty(exports, "SecurityStack", { enumerable: true, get: function () { return security_stack_1.SecurityStack; } });
var networking_stack_1 = require("./networking-stack");
Object.defineProperty(exports, "NetworkingStack", { enumerable: true, get: function () { return networking_stack_1.NetworkingStack; } });
var data_stack_1 = require("./data-stack");
Object.defineProperty(exports, "DataStack", { enumerable: true, get: function () { return data_stack_1.DataStack; } });
var embedding_stack_1 = require("./embedding-stack");
Object.defineProperty(exports, "EmbeddingStack", { enumerable: true, get: function () { return embedding_stack_1.EmbeddingStack; } });
var webapp_stack_1 = require("./webapp-stack");
Object.defineProperty(exports, "WebAppStack", { enumerable: true, get: function () { return webapp_stack_1.WebAppStack; } });
var advanced_permission_stack_1 = require("./advanced-permission-stack");
Object.defineProperty(exports, "AdvancedPermissionStack", { enumerable: true, get: function () { return advanced_permission_stack_1.AdvancedPermissionStack; } });
var operations_stack_1 = require("./operations-stack");
Object.defineProperty(exports, "OperationsStack", { enumerable: true, get: function () { return operations_stack_1.OperationsStack; } });
/**
 * 統合スタックのデプロイメント順序
 *
 * 依存関係に基づく推奨デプロイメント順序:
 * 1. SecurityStack - セキュリティ基盤（KMS、WAF、CloudTrail）
 * 2. NetworkingStack - ネットワーク基盤（VPC、サブネット、セキュリティグループ）
 * 3. DataStack - データ・ストレージ（S3、DynamoDB、OpenSearch、FSx）
 * 4. EmbeddingStack - Embedding・AI（Lambda、ECS、Bedrock、AWS Batch）
 * 5. WebAppStack - API・フロントエンド（API Gateway、CloudFront、Cognito）
 * 6. AdvancedPermissionStack - 高度権限制御（時間・地理・動的権限制御）
 * 7. OperationsStack - 監視・エンタープライズ（CloudWatch、SNS、アクセス制御）
 *
 * 注意: AdvancedPermissionStackはWebAppStackの後にデプロイする必要があります
 * （OpenSearchエンドポイントとAPI統合が必要なため）
 */
exports.DEPLOYMENT_ORDER = [
    'SecurityStack',
    'NetworkingStack',
    'DataStack',
    'EmbeddingStack',
    'WebAppStack',
    'AdvancedPermissionStack',
    'OperationsStack',
];
/**
 * スタック間の依存関係マッピング
 *
 * 各スタックが依存する他のスタックを明示的に定義
 * デプロイメント順序の決定とエラー防止に使用
 */
exports.STACK_DEPENDENCIES = {
    SecurityStack: [],
    NetworkingStack: ['SecurityStack'],
    DataStack: ['SecurityStack', 'NetworkingStack'],
    EmbeddingStack: ['SecurityStack', 'NetworkingStack', 'DataStack'],
    WebAppStack: ['SecurityStack', 'NetworkingStack', 'EmbeddingStack'],
    AdvancedPermissionStack: ['SecurityStack', 'NetworkingStack', 'DataStack', 'WebAppStack'],
    OperationsStack: ['SecurityStack', 'NetworkingStack', 'DataStack', 'EmbeddingStack', 'WebAppStack', 'AdvancedPermissionStack'],
};
/**
 * 統合スタックのメタデータ
 */
exports.STACK_METADATA = {
    SecurityStack: {
        description: 'セキュリティ統合管理（KMS、WAF、CloudTrail、IAM）',
        category: 'Security',
        estimatedCost: 'Low',
        deploymentTime: '5-10 minutes',
    },
    NetworkingStack: {
        description: 'ネットワーク基盤統合管理（VPC、サブネット、ゲートウェイ）',
        category: 'Infrastructure',
        estimatedCost: 'Medium',
        deploymentTime: '10-15 minutes',
    },
    DataStack: {
        description: 'データ・ストレージ統合管理（S3、DynamoDB、OpenSearch、FSx）',
        category: 'Data',
        estimatedCost: 'High',
        deploymentTime: '15-30 minutes',
    },
    EmbeddingStack: {
        description: 'Embedding・AI統合管理（Lambda、ECS、Bedrock、AWS Batch）',
        category: 'Embedding',
        estimatedCost: 'Medium',
        deploymentTime: '10-20 minutes',
    },
    WebAppStack: {
        description: 'API・フロントエンド統合管理（API Gateway、CloudFront、Cognito）',
        category: 'Frontend',
        estimatedCost: 'Medium',
        deploymentTime: '15-25 minutes',
    },
    AdvancedPermissionStack: {
        description: '高度権限制御統合管理（時間制限、地理制限、動的権限）',
        category: 'Security',
        estimatedCost: 'Medium',
        deploymentTime: '10-20 minutes',
    },
    OperationsStack: {
        description: '監視・エンタープライズ統合管理（CloudWatch、SNS、アクセス制御）',
        category: 'Operations',
        estimatedCost: 'Low',
        deploymentTime: '5-15 minutes',
    },
};
/**
 * 統合スタックの総合情報
 */
exports.INTEGRATED_STACKS_INFO = {
    totalStacks: 7,
    totalEstimatedDeploymentTime: '65-125 minutes',
    totalEstimatedMonthlyCost: '$275-875 (depending on usage)',
    supportedRegions: [
        'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
        'ap-northeast-1', 'ap-northeast-3', 'ap-southeast-1', 'ap-southeast-2'
    ],
    requiredPermissions: [
        'CloudFormation full access',
        'IAM full access',
        'EC2 full access',
        'S3 full access',
        'Lambda full access',
        'API Gateway full access',
        'CloudFront full access',
        'DynamoDB full access',
        'OpenSearch full access',
        'FSx full access',
        'Bedrock full access',
        'CloudWatch full access',
        'SNS full access',
        'Cognito full access',
        'WAF full access',
        'KMS full access',
        'CloudTrail full access',
    ],
};
