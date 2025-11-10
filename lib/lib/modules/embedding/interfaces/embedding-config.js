"use strict";
/**
 * Embedding専用設定インターフェース
 *
 * Agent Steeringルール準拠:
 * - モジュラーアーキテクチャ強制（lib/modules/compute/interfaces/）
 * - TypeScript型安全性の強制
 * - 設定・変更容易性を担保するモジュール化アーキテクチャ
 *
 * 機能:
 * - AWS Batch、ECS on EC2、Spot Fleet の有効化/無効化制御
 * - デプロイ時・運用時パラメータ調整機能
 * - FSx for NetApp ONTAP統合設定
 * - OpenSearch Serverless統合設定
 */
Object.defineProperty(exports, "__esModule", { value: true });
