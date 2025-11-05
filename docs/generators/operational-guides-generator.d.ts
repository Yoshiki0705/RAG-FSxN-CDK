/**
 * 運用ガイド生成システム
 * Permission-aware RAG System with FSx for NetApp ONTAP の包括的運用ガイド生成
 *
 * 機能:
 * - トラブルシューティングガイド
 * - 運用チェックリスト
 * - 監視・アラート設定ガイド
 * - インシデント対応手順
 * - 災害復旧手順
 * - セキュリティ運用ガイド
 * - パフォーマンス最適化ガイド
 */
export declare class OperationalGuidesGenerator {
    private readonly systemName;
    private readonly version;
    private readonly lastUpdated;
    /**
     * 包括的トラブルシューティングガイドの生成
     */
    generateTroubleshootingGuide(): string;
    /**
     * 包括的運用チェックリストの生成
     */
    generateOperationalChecklist(): string;
    /**
     * 包括的監視・アラート設定ガイドの生成
     */
    generateMonitoringGuide(): string;
} /**
   *
 インシデント対応手順ガイドの生成
   */
