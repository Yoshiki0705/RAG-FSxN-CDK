"use strict";
/**
 * モジュール間インターフェース定義
 *
 * Agent Steeringルール準拠:
 * - モジュラーアーキテクチャ強制（lib/modules/compute/interfaces/）
 * - AWS Batch、ECS、Spot Fleet間の連携インターフェース定義
 * - 共通リソース（VPC、セキュリティグループ）の管理インターフェース
 *
 * Requirements: 4.5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingModuleStatus = exports.EmbeddingSharedResourceType = exports.EmbeddingCommunicationType = void 0;
/**
 * Embedding通信タイプ
 */
var EmbeddingCommunicationType;
(function (EmbeddingCommunicationType) {
    /** 直接API呼び出し */
    EmbeddingCommunicationType["DIRECT_API"] = "DIRECT_API";
    /** SQSキュー経由 */
    EmbeddingCommunicationType["SQS_QUEUE"] = "SQS_QUEUE";
    /** SNSトピック経由 */
    EmbeddingCommunicationType["SNS_TOPIC"] = "SNS_TOPIC";
    /** EventBridge経由 */
    EmbeddingCommunicationType["EVENT_BRIDGE"] = "EVENT_BRIDGE";
    /** 共有ストレージ経由 */
    EmbeddingCommunicationType["SHARED_STORAGE"] = "SHARED_STORAGE";
})(EmbeddingCommunicationType || (exports.EmbeddingCommunicationType = EmbeddingCommunicationType = {}));
/**
 * Embedding共有リソースタイプ
 */
var EmbeddingSharedResourceType;
(function (EmbeddingSharedResourceType) {
    /** VPC */
    EmbeddingSharedResourceType["VPC"] = "VPC";
    /** セキュリティグループ */
    EmbeddingSharedResourceType["SECURITY_GROUP"] = "SECURITY_GROUP";
    /** IAMロール */
    EmbeddingSharedResourceType["IAM_ROLE"] = "IAM_ROLE";
    /** ロググループ */
    EmbeddingSharedResourceType["LOG_GROUP"] = "LOG_GROUP";
    /** FSxファイルシステム */
    EmbeddingSharedResourceType["FSX_FILESYSTEM"] = "FSX_FILESYSTEM";
    /** ECRリポジトリ */
    EmbeddingSharedResourceType["ECR_REPOSITORY"] = "ECR_REPOSITORY";
})(EmbeddingSharedResourceType || (exports.EmbeddingSharedResourceType = EmbeddingSharedResourceType = {}));
/**
 * Embeddingモジュール状態
 */
var EmbeddingModuleStatus;
(function (EmbeddingModuleStatus) {
    /** 初期化中 */
    EmbeddingModuleStatus["INITIALIZING"] = "INITIALIZING";
    /** 実行中 */
    EmbeddingModuleStatus["RUNNING"] = "RUNNING";
    /** 停止中 */
    EmbeddingModuleStatus["STOPPING"] = "STOPPING";
    /** 停止済み */
    EmbeddingModuleStatus["STOPPED"] = "STOPPED";
    /** エラー */
    EmbeddingModuleStatus["ERROR"] = "ERROR";
    /** メンテナンス中 */
    EmbeddingModuleStatus["MAINTENANCE"] = "MAINTENANCE";
})(EmbeddingModuleStatus || (exports.EmbeddingModuleStatus = EmbeddingModuleStatus = {}));
