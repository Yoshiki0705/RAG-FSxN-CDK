#!/usr/bin/env node
/**
 * Embedding Batch デプロイメントアプリケーション
 *
 * Agent Steeringルール準拠:
 * - 実際のAWS環境へのCDKデプロイ実行
 * - Batchリソース作成確認
 * - FSx for NetApp ONTAPマウント動作確認
 *
 * Requirements: 1.4, 1.5, 8.3
 */
import 'source-map-support/register';
