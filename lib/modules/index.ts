/**
 * Modular Architecture Index
 * モジュラーアーキテクチャ統合インデックス
 * 
 * 9つの機能別モジュールの統合エクスポート
 */

// 機能別モジュール
export * from './networking';
export * from './security';
export * from './storage';
export * from './database';
export * from './compute';
export * from './api';
export * from './ai';
export * from './monitoring';
export * from './enterprise';

// 統合CDKスタック
export * from '../stacks/networking-stack';
export * from '../stacks/security-stack';
// TODO: 他のスタックも追加予定

// コンプライアンス機能
export * from '../compliance/compliance-mapper';