/**
 * モデル設定管理システム
 * リージョン別に利用可能なBedrockモデルを管理
 */

import { SupportedRegion, RegionConfigManager } from './region-config-manager';

// モデルカテゴリの型定義
export type ModelCategory = 'chat' | 'embedding' | 'image';

// モデルプロバイダーの型定義
export type ModelProvider = 'anthropic' | 'amazon' | 'meta' | 'mistral' | 'ai21' | 'cohere' | 'stability';

// Bedrockモデル情報インターフェース
export interface BedrockModelInfo {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  provider: ModelProvider;
  category: ModelCategory;
  maxTokens: number;
  temperature: number;
  topP: number;
  supportedRegions: SupportedRegion[];
  restrictedRegions?: string[];
  regionNote?: string;
  isRecommended?: boolean;
  isNew?: boolean;
  isPrimary?: boolean;
}

// リージョン別モデル情報
export interface RegionModelInfo {
  region: SupportedRegion;
  regionName: string;
  availableModels: BedrockModelInfo[];
  chatModels: BedrockModelInfo[];
  embeddingModels: BedrockModelInfo[];
  imageModels: BedrockModelInfo[];
  recommendedModels: BedrockModelInfo[];
  defaultChatModel?: BedrockModelInfo;
  defaultEmbeddingModel?: BedrockModelInfo;
  totalModelCount: number;
}

// モデル検証結果
export interface ModelValidationResult {
  isValid: boolean;
  modelId: string;
  region: SupportedRegion;
  message: string;
  suggestedModel?: BedrockModelInfo;
  fallbackModel: BedrockModelInfo;
}

/**
 * モデル設定管理クラス
 * リージョン別モデル取得、チャット用・埋め込み用モデル分類機能を提供
 */
export class ModelConfigManager {
  // リージョン別モデル設定データ
  private static readonly REGION_MODEL_CONFIG: Record<SupportedRegion, BedrockModelInfo[]> = {
    'ap-northeast-1': [
      // 東京リージョン - プライマリリージョン
      {
        id: 'amazon.nova-pro-v1:0',
        name: 'Amazon Nova Pro',
        nameJa: 'Amazon Nova Pro',
        description: 'Amazon最新・推奨モデル - 高性能チャット',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      },
      {
        id: 'amazon.nova-lite-v1:0',
        name: 'Amazon Nova Lite',
        nameJa: 'Amazon Nova Lite',
        description: '軽量・高速版チャットモデル',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 2000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true
      },
      {
        id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        name: 'Claude 3.5 Sonnet v2',
        nameJa: 'Claude 3.5 Sonnet v2',
        description: 'Anthropic高性能モデル - 最新版',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true
      },
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet',
        nameJa: 'Claude 3 Sonnet',
        description: 'Anthropic安定版モデル',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1']
      },
      {
        id: 'amazon.titan-embed-text-v2:0',
        name: 'Titan Embed Text v2',
        nameJa: 'Titan 埋め込みテキスト v2',
        description: 'Amazon埋め込みモデル - 最新版',
        provider: 'amazon',
        category: 'embedding',
        maxTokens: 8192,
        temperature: 0.0,
        topP: 1.0,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      }
    ],
    'ap-northeast-3': [
      // 大阪リージョン - 新規追加
      {
        id: 'amazon.nova-pro-v1:0',
        name: 'Amazon Nova Pro',
        nameJa: 'Amazon Nova Pro',
        description: 'Amazon最新・推奨モデル - 高性能チャット',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      },
      {
        id: 'amazon.nova-lite-v1:0',
        name: 'Amazon Nova Lite',
        nameJa: 'Amazon Nova Lite',
        description: '軽量・高速版チャットモデル',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 2000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true
      },
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet',
        nameJa: 'Claude 3 Sonnet',
        description: 'Anthropic安定版モデル',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1']
      },
      {
        id: 'amazon.titan-embed-text-v2:0',
        name: 'Titan Embed Text v2',
        nameJa: 'Titan 埋め込みテキスト v2',
        description: 'Amazon埋め込みモデル - 最新版',
        provider: 'amazon',
        category: 'embedding',
        maxTokens: 8192,
        temperature: 0.0,
        topP: 1.0,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      }
    ],
    'us-east-1': [
      // バージニア北部 - 最多モデル対応
      {
        id: 'amazon.nova-pro-v1:0',
        name: 'Amazon Nova Pro',
        nameJa: 'Amazon Nova Pro',
        description: 'Amazon最新・推奨モデル - 高性能チャット',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      },
      {
        id: 'amazon.nova-lite-v1:0',
        name: 'Amazon Nova Lite',
        nameJa: 'Amazon Nova Lite',
        description: '軽量・高速版チャットモデル',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 2000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true
      },
      {
        id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        name: 'Claude 3.5 Sonnet v2',
        nameJa: 'Claude 3.5 Sonnet v2',
        description: 'Anthropic高性能モデル - 最新版',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true
      },
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet',
        nameJa: 'Claude 3 Sonnet',
        description: 'Anthropic安定版モデル',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1']
      },
      {
        id: 'anthropic.claude-3-haiku-20240307-v1:0',
        name: 'Claude 3 Haiku',
        nameJa: 'Claude 3 Haiku',
        description: 'Anthropic軽量・高速モデル',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['us-east-1', 'us-west-2']
      },
      {
        id: 'meta.llama3-2-90b-instruct-v1:0',
        name: 'Llama 3.2 90B Instruct',
        nameJa: 'Llama 3.2 90B Instruct',
        description: 'Meta高性能言語モデル',
        provider: 'meta',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['us-east-1', 'us-west-2'],
        restrictedRegions: ['ap-northeast-1', 'ap-northeast-3']
      },
      {
        id: 'mistral.mistral-large-2402-v1:0',
        name: 'Mistral Large',
        nameJa: 'Mistral Large',
        description: 'Mistral高性能言語モデル',
        provider: 'mistral',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['us-east-1', 'us-west-2'],
        restrictedRegions: ['ap-northeast-1', 'ap-northeast-3']
      },
      {
        id: 'amazon.titan-embed-text-v2:0',
        name: 'Titan Embed Text v2',
        nameJa: 'Titan 埋め込みテキスト v2',
        description: 'Amazon埋め込みモデル - 最新版',
        provider: 'amazon',
        category: 'embedding',
        maxTokens: 8192,
        temperature: 0.0,
        topP: 1.0,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      }
    ],
    'us-west-2': [
      // オレゴン - 安定運用対応
      {
        id: 'amazon.nova-pro-v1:0',
        name: 'Amazon Nova Pro',
        nameJa: 'Amazon Nova Pro',
        description: 'Amazon最新・推奨モデル - 高性能チャット',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      },
      {
        id: 'amazon.nova-lite-v1:0',
        name: 'Amazon Nova Lite',
        nameJa: 'Amazon Nova Lite',
        description: '軽量・高速版チャットモデル',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 2000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true
      },
      {
        id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        name: 'Claude 3.5 Sonnet v2',
        nameJa: 'Claude 3.5 Sonnet v2',
        description: 'Anthropic高性能モデル - 最新版',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true
      },
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet',
        nameJa: 'Claude 3 Sonnet',
        description: 'Anthropic安定版モデル',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1']
      },
      {
        id: 'amazon.titan-embed-text-v2:0',
        name: 'Titan Embed Text v2',
        nameJa: 'Titan 埋め込みテキスト v2',
        description: 'Amazon埋め込みモデル - 最新版',
        provider: 'amazon',
        category: 'embedding',
        maxTokens: 8192,
        temperature: 0.0,
        topP: 1.0,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      }
    ],
    'eu-west-1': [
      // アイルランド - GDPR準拠
      {
        id: 'amazon.nova-pro-v1:0',
        name: 'Amazon Nova Pro',
        nameJa: 'Amazon Nova Pro',
        description: 'Amazon最新・推奨モデル - 高性能チャット',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      },
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet',
        nameJa: 'Claude 3 Sonnet',
        description: 'Anthropic安定版モデル',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1']
      },
      {
        id: 'amazon.titan-embed-text-v2:0',
        name: 'Titan Embed Text v2',
        nameJa: 'Titan 埋め込みテキスト v2',
        description: 'Amazon埋め込みモデル - 最新版',
        provider: 'amazon',
        category: 'embedding',
        maxTokens: 8192,
        temperature: 0.0,
        topP: 1.0,
        supportedRegions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-west-2', 'eu-west-1'],
        isRecommended: true,
        isPrimary: true
      }
    ]
  };

  /**
   * 指定リージョンで利用可能なモデル一覧を取得
   */
  public static getAvailableModels(region: SupportedRegion): BedrockModelInfo[] {
    return this.REGION_MODEL_CONFIG[region] || [];
  }

  /**
   * 指定リージョンのチャット用モデル一覧を取得
   */
  public static getChatModels(region: SupportedRegion): BedrockModelInfo[] {
    return this.getAvailableModels(region).filter(model => model.category === 'chat');
  }

  /**
   * 指定リージョンの埋め込み用モデル一覧を取得
   */
  public static getEmbeddingModels(region: SupportedRegion): BedrockModelInfo[] {
    return this.getAvailableModels(region).filter(model => model.category === 'embedding');
  }

  /**
   * 指定リージョンの画像生成用モデル一覧を取得
   */
  public static getImageModels(region: SupportedRegion): BedrockModelInfo[] {
    return this.getAvailableModels(region).filter(model => model.category === 'image');
  }

  /**
   * 指定リージョンの推奨モデル一覧を取得
   */
  public static getRecommendedModels(region: SupportedRegion): BedrockModelInfo[] {
    return this.getAvailableModels(region).filter(model => model.isRecommended);
  }

  /**
   * 指定リージョンのデフォルトチャットモデルを取得
   */
  public static getDefaultChatModel(region: SupportedRegion): BedrockModelInfo | null {
    const chatModels = this.getChatModels(region);
    
    // プライマリモデルを優先
    const primaryModel = chatModels.find(model => model.isPrimary);
    if (primaryModel) return primaryModel;
    
    // 推奨モデルを次に優先
    const recommendedModel = chatModels.find(model => model.isRecommended);
    if (recommendedModel) return recommendedModel;
    
    // 最初のモデルを返す
    return chatModels[0] || null;
  }

  /**
   * 指定リージョンのデフォルト埋め込みモデルを取得
   */
  public static getDefaultEmbeddingModel(region: SupportedRegion): BedrockModelInfo | null {
    const embeddingModels = this.getEmbeddingModels(region);
    
    // プライマリモデルを優先
    const primaryModel = embeddingModels.find(model => model.isPrimary);
    if (primaryModel) return primaryModel;
    
    // 推奨モデルを次に優先
    const recommendedModel = embeddingModels.find(model => model.isRecommended);
    if (recommendedModel) return recommendedModel;
    
    // 最初のモデルを返す
    return embeddingModels[0] || null;
  }

  /**
   * モデルIDからモデル情報を取得
   */
  public static getModelById(modelId: string, region?: SupportedRegion): BedrockModelInfo | null {
    if (region) {
      return this.getAvailableModels(region).find(model => model.id === modelId) || null;
    }

    // 全リージョンから検索
    for (const regionModels of Object.values(this.REGION_MODEL_CONFIG)) {
      const model = regionModels.find(model => model.id === modelId);
      if (model) return model;
    }

    return null;
  }

  /**
   * プロバイダー別にモデルを取得
   */
  public static getModelsByProvider(provider: ModelProvider, region: SupportedRegion): BedrockModelInfo[] {
    return this.getAvailableModels(region).filter(model => model.provider === provider);
  }

  /**
   * カテゴリ別にモデルを取得
   */
  public static getModelsByCategory(category: ModelCategory, region: SupportedRegion): BedrockModelInfo[] {
    return this.getAvailableModels(region).filter(model => model.category === category);
  }

  /**
   * リージョン別モデル情報を取得
   */
  public static getRegionModelInfo(region: SupportedRegion): RegionModelInfo {
    const availableModels = this.getAvailableModels(region);
    const chatModels = this.getChatModels(region);
    const embeddingModels = this.getEmbeddingModels(region);
    const imageModels = this.getImageModels(region);
    const recommendedModels = this.getRecommendedModels(region);

    return {
      region,
      regionName: RegionConfigManager.getRegionDisplayName(region),
      availableModels,
      chatModels,
      embeddingModels,
      imageModels,
      recommendedModels,
      defaultChatModel: this.getDefaultChatModel(region) || undefined,
      defaultEmbeddingModel: this.getDefaultEmbeddingModel(region) || undefined,
      totalModelCount: availableModels.length
    };
  }

  /**
   * 全サポート対象リージョンのモデル統計情報を取得
   */
  public static getModelStatistics() {
    const supportedRegions = RegionConfigManager.getSupportedRegions();
    const allModels = new Set<string>();
    const regionStats = supportedRegions.map(region => {
      const regionInfo = this.getRegionModelInfo(region);
      regionInfo.availableModels.forEach(model => allModels.add(model.id));
      
      return {
        region,
        regionName: regionInfo.regionName,
        totalModels: regionInfo.totalModelCount,
        chatModels: regionInfo.chatModels.length,
        embeddingModels: regionInfo.embeddingModels.length,
        imageModels: regionInfo.imageModels.length,
        recommendedModels: regionInfo.recommendedModels.length
      };
    });

    return {
      totalUniqueModels: allModels.size,
      totalSupportedRegions: supportedRegions.length,
      regionStats,
      mostModelsRegion: regionStats.reduce((prev, current) => 
        prev.totalModels > current.totalModels ? prev : current
      ),
      leastModelsRegion: regionStats.reduce((prev, current) => 
        prev.totalModels < current.totalModels ? prev : current
      )
    };
  }

  // ===== リージョン別モデル対応表と検証機能 =====

  /**
   * モデル・リージョン組み合わせの妥当性をチェック
   */
  public static validateModelRegionCombination(modelId: string, region: SupportedRegion): {
    isValid: boolean;
    model?: BedrockModelInfo;
    message: string;
    reason?: string;
  } {
    // リージョンの妥当性チェック
    if (!RegionConfigManager.isRegionSupported(region)) {
      return {
        isValid: false,
        message: `サポート外のリージョン「${region}」が指定されました。`,
        reason: 'UNSUPPORTED_REGION'
      };
    }

    // モデルの存在チェック
    const model = this.getModelById(modelId, region);
    if (!model) {
      return {
        isValid: false,
        message: `モデル「${modelId}」は${RegionConfigManager.getRegionDisplayName(region)}リージョンでは利用できません。`,
        reason: 'MODEL_NOT_AVAILABLE'
      };
    }

    // 制限リージョンチェック
    if (model.restrictedRegions && model.restrictedRegions.includes(region)) {
      return {
        isValid: false,
        model,
        message: `モデル「${model.nameJa}」は${RegionConfigManager.getRegionDisplayName(region)}リージョンでは制限されています。`,
        reason: 'REGION_RESTRICTED'
      };
    }

    // サポートリージョンチェック
    if (!model.supportedRegions.includes(region)) {
      return {
        isValid: false,
        model,
        message: `モデル「${model.nameJa}」は${RegionConfigManager.getRegionDisplayName(region)}リージョンではサポートされていません。`,
        reason: 'REGION_NOT_SUPPORTED'
      };
    }

    return {
      isValid: true,
      model,
      message: `モデル「${model.nameJa}」は${RegionConfigManager.getRegionDisplayName(region)}リージョンで正常に利用できます。`
    };
  }

  /**
   * 大阪リージョンで利用可能なモデル一覧を明確化
   */
  public static getOsakaRegionModels(): {
    availableModels: BedrockModelInfo[];
    chatModels: BedrockModelInfo[];
    embeddingModels: BedrockModelInfo[];
    recommendedModels: BedrockModelInfo[];
    comparisonWithTokyo: {
      commonModels: BedrockModelInfo[];
      osakaOnlyModels: BedrockModelInfo[];
      tokyoOnlyModels: BedrockModelInfo[];
    };
  } {
    const osakaModels = this.getAvailableModels('ap-northeast-3');
    const tokyoModels = this.getAvailableModels('ap-northeast-1');
    
    const osakaModelIds = new Set(osakaModels.map(m => m.id));
    const tokyoModelIds = new Set(tokyoModels.map(m => m.id));
    
    const commonModels = osakaModels.filter(model => tokyoModelIds.has(model.id));
    const osakaOnlyModels = osakaModels.filter(model => !tokyoModelIds.has(model.id));
    const tokyoOnlyModels = tokyoModels.filter(model => !osakaModelIds.has(model.id));

    return {
      availableModels: osakaModels,
      chatModels: this.getChatModels('ap-northeast-3'),
      embeddingModels: this.getEmbeddingModels('ap-northeast-3'),
      recommendedModels: this.getRecommendedModels('ap-northeast-3'),
      comparisonWithTokyo: {
        commonModels,
        osakaOnlyModels,
        tokyoOnlyModels
      }
    };
  }

  /**
   * リージョン間でのモデル利用可能性を比較
   */
  public static compareModelAvailabilityAcrossRegions(modelId: string): {
    modelInfo?: BedrockModelInfo;
    availability: {
      region: SupportedRegion;
      regionName: string;
      available: boolean;
      reason?: string;
    }[];
    supportedRegions: SupportedRegion[];
    unsupportedRegions: SupportedRegion[];
  } {
    const supportedRegions = RegionConfigManager.getSupportedRegions();
    const modelInfo = this.getModelById(modelId);
    
    const availability = supportedRegions.map(region => {
      const validation = this.validateModelRegionCombination(modelId, region);
      return {
        region,
        regionName: RegionConfigManager.getRegionDisplayName(region),
        available: validation.isValid,
        reason: validation.reason
      };
    });

    const supportedRegionsList = availability
      .filter(item => item.available)
      .map(item => item.region);
    
    const unsupportedRegionsList = availability
      .filter(item => !item.available)
      .map(item => item.region);

    return {
      modelInfo: modelInfo || undefined,
      availability,
      supportedRegions: supportedRegionsList,
      unsupportedRegions: unsupportedRegionsList
    };
  }

  /**
   * リージョン別モデル対応表を生成
   */
  public static generateModelRegionMatrix(): {
    models: string[];
    regions: SupportedRegion[];
    matrix: boolean[][];
    summary: {
      modelId: string;
      modelName: string;
      supportedRegionCount: number;
      supportedRegions: SupportedRegion[];
    }[];
  } {
    const supportedRegions = RegionConfigManager.getSupportedRegions();
    const allModelIds = new Set<string>();
    
    // 全モデルIDを収集
    supportedRegions.forEach(region => {
      this.getAvailableModels(region).forEach(model => {
        allModelIds.add(model.id);
      });
    });

    const models = Array.from(allModelIds).sort();
    const matrix: boolean[][] = [];
    const summary = models.map(modelId => {
      const modelInfo = this.getModelById(modelId);
      const row: boolean[] = [];
      const supportedRegions: SupportedRegion[] = [];
      
      RegionConfigManager.getSupportedRegions().forEach(region => {
        const validation = this.validateModelRegionCombination(modelId, region);
        const isSupported = validation.isValid;
        row.push(isSupported);
        
        if (isSupported) {
          supportedRegions.push(region);
        }
      });
      
      matrix.push(row);
      
      return {
        modelId,
        modelName: modelInfo?.nameJa || modelId,
        supportedRegionCount: supportedRegions.length,
        supportedRegions
      };
    });

    return {
      models,
      regions: supportedRegions,
      matrix,
      summary
    };
  }

  /**
   * 特定リージョンで利用不可能なモデルを取得
   */
  public static getUnavailableModelsForRegion(region: SupportedRegion): {
    unavailableModels: {
      modelId: string;
      modelName: string;
      reason: string;
      availableInRegions: SupportedRegion[];
    }[];
    totalUnavailableCount: number;
  } {
    const allModelIds = new Set<string>();
    
    // 全リージョンから全モデルIDを収集
    RegionConfigManager.getSupportedRegions().forEach(r => {
      this.getAvailableModels(r).forEach(model => {
        allModelIds.add(model.id);
      });
    });

    const unavailableModels = Array.from(allModelIds)
      .map(modelId => {
        const validation = this.validateModelRegionCombination(modelId, region);
        if (validation.isValid) return null;
        
        const comparison = this.compareModelAvailabilityAcrossRegions(modelId);
        const modelInfo = this.getModelById(modelId);
        
        return {
          modelId,
          modelName: modelInfo?.nameJa || modelId,
          reason: validation.message,
          availableInRegions: comparison.supportedRegions
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      unavailableModels,
      totalUnavailableCount: unavailableModels.length
    };
  }

  // ===== モデル検証とフォールバック機能 =====

  /**
   * モデル検証結果を取得
   */
  public static validateModel(modelId: string, region: SupportedRegion): ModelValidationResult {
    const validation = this.validateModelRegionCombination(modelId, region);
    
    if (validation.isValid && validation.model) {
      return {
        isValid: true,
        modelId,
        region,
        message: validation.message,
        fallbackModel: validation.model
      };
    }

    // フォールバックモデルを決定
    const fallbackModel = this.getFallbackModel(modelId, region);
    
    return {
      isValid: false,
      modelId,
      region,
      message: validation.message,
      suggestedModel: validation.model,
      fallbackModel
    };
  }

  /**
   * 利用不可能なモデル選択時のフォールバック処理
   */
  public static handleInvalidModel(modelId: string, region: SupportedRegion, options?: {
    preferSameProvider?: boolean;
    preferSameCategory?: boolean;
    logError?: boolean;
  }): {
    originalModel: string;
    fallbackModel: BedrockModelInfo;
    wasChanged: boolean;
    reason: string;
    warnings: string[];
  } {
    const opts = {
      preferSameProvider: true,
      preferSameCategory: true,
      logError: true,
      ...options
    };

    const warnings: string[] = [];
    const validation = this.validateModel(modelId, region);

    if (validation.isValid) {
      return {
        originalModel: modelId,
        fallbackModel: validation.fallbackModel,
        wasChanged: false,
        reason: '指定されたモデルは有効です。',
        warnings: []
      };
    }

    // フォールバックモデルを取得
    const fallbackModel = this.getFallbackModel(modelId, region, {
      preferSameProvider: opts.preferSameProvider,
      preferSameCategory: opts.preferSameCategory
    });

    warnings.push(`指定されたモデル「${modelId}」は${RegionConfigManager.getRegionDisplayName(region)}リージョンでは利用できません。`);
    warnings.push(`フォールバックモデル「${fallbackModel.nameJa}」を使用します。`);

    if (opts.logError) {
      console.warn(`[ModelConfigManager] モデルフォールバック: ${modelId} → ${fallbackModel.id} (${region})`);
      warnings.forEach(warning => console.warn(`[ModelConfigManager] ${warning}`));
    }

    return {
      originalModel: modelId,
      fallbackModel,
      wasChanged: true,
      reason: validation.message,
      warnings
    };
  }

  /**
   * フォールバックモデルを取得
   */
  public static getFallbackModel(originalModelId: string, region: SupportedRegion, options?: {
    preferSameProvider?: boolean;
    preferSameCategory?: boolean;
  }): BedrockModelInfo {
    const opts = {
      preferSameProvider: true,
      preferSameCategory: true,
      ...options
    };

    const availableModels = this.getAvailableModels(region);
    if (availableModels.length === 0) {
      throw new Error(`${RegionConfigManager.getRegionDisplayName(region)}リージョンには利用可能なモデルがありません。`);
    }

    // 元のモデル情報を取得（他のリージョンから）
    const originalModel = this.getModelById(originalModelId);
    
    if (originalModel && opts.preferSameProvider && opts.preferSameCategory) {
      // 同じプロバイダー・同じカテゴリを優先
      const sameProviderCategoryModel = availableModels.find(model => 
        model.provider === originalModel.provider && 
        model.category === originalModel.category
      );
      if (sameProviderCategoryModel) return sameProviderCategoryModel;
    }

    if (originalModel && opts.preferSameCategory) {
      // 同じカテゴリを優先
      const sameCategoryModel = availableModels.find(model => 
        model.category === originalModel.category
      );
      if (sameCategoryModel) return sameCategoryModel;
    }

    if (originalModel && opts.preferSameProvider) {
      // 同じプロバイダーを優先
      const sameProviderModel = availableModels.find(model => 
        model.provider === originalModel.provider
      );
      if (sameProviderModel) return sameProviderModel;
    }

    // デフォルトモデルを取得
    const defaultChatModel = this.getDefaultChatModel(region);
    if (defaultChatModel) return defaultChatModel;

    // 推奨モデルを取得
    const recommendedModels = this.getRecommendedModels(region);
    if (recommendedModels.length > 0) return recommendedModels[0];

    // 最初の利用可能なモデルを返す
    return availableModels[0];
  }

  /**
   * エラー時のデフォルトモデル選択機能
   */
  public static getEmergencyFallbackModel(region: SupportedRegion, category?: ModelCategory): BedrockModelInfo {
    try {
      // カテゴリが指定されている場合
      if (category) {
        switch (category) {
          case 'chat':
            const defaultChat = this.getDefaultChatModel(region);
            if (defaultChat) return defaultChat;
            break;
          case 'embedding':
            const defaultEmbedding = this.getDefaultEmbeddingModel(region);
            if (defaultEmbedding) return defaultEmbedding;
            break;
          case 'image':
            const imageModels = this.getImageModels(region);
            if (imageModels.length > 0) return imageModels[0];
            break;
        }
      }

      // 推奨モデルから選択
      const recommendedModels = this.getRecommendedModels(region);
      if (recommendedModels.length > 0) return recommendedModels[0];

      // 利用可能な任意のモデル
      const availableModels = this.getAvailableModels(region);
      if (availableModels.length > 0) return availableModels[0];

      // 最後の手段：東京リージョンのデフォルトモデル
      if (region !== 'ap-northeast-1') {
        const tokyoDefault = this.getDefaultChatModel('ap-northeast-1');
        if (tokyoDefault) {
          console.warn(`[ModelConfigManager] 緊急フォールバック: 東京リージョンのデフォルトモデルを使用`);
          return tokyoDefault;
        }
      }

      throw new Error('緊急フォールバックモデルが見つかりません。');
    } catch (error) {
      console.error(`[ModelConfigManager] 緊急フォールバック失敗:`, error);
      throw new Error(`緊急フォールバックモデルの取得に失敗しました: ${error}`);
    }
  }

  /**
   * モデル・リージョン組み合わせの安全な取得
   */
  public static getSafeModelForRegion(modelId: string, region: SupportedRegion): {
    model: BedrockModelInfo;
    wasChanged: boolean;
    originalModelId: string;
    warnings: string[];
  } {
    const fallbackResult = this.handleInvalidModel(modelId, region);
    
    return {
      model: fallbackResult.fallbackModel,
      wasChanged: fallbackResult.wasChanged,
      originalModelId: fallbackResult.originalModel,
      warnings: fallbackResult.warnings
    };
  }

  /**
   * 複数モデルの一括検証
   */
  public static validateMultipleModels(modelIds: string[], region: SupportedRegion): {
    valid: BedrockModelInfo[];
    invalid: string[];
    validationResults: ModelValidationResult[];
    fallbackModels: BedrockModelInfo[];
  } {
    const valid: BedrockModelInfo[] = [];
    const invalid: string[] = [];
    const validationResults: ModelValidationResult[] = [];
    const fallbackModels: BedrockModelInfo[] = [];

    modelIds.forEach(modelId => {
      const result = this.validateModel(modelId, region);
      validationResults.push(result);

      if (result.isValid) {
        valid.push(result.fallbackModel);
      } else {
        invalid.push(modelId);
        fallbackModels.push(result.fallbackModel);
      }
    });

    return {
      valid,
      invalid,
      validationResults,
      fallbackModels
    };
  }

  /**
   * モデル検証のユーティリティ関数
   */
  public static getModelValidationSummary(modelId: string, region: SupportedRegion): string {
    const validation = this.validateModel(modelId, region);
    
    if (validation.isValid) {
      return `✅ ${validation.fallbackModel.nameJa} - ${RegionConfigManager.getRegionDisplayName(region)}で利用可能`;
    } else {
      return `❌ ${modelId} - ${validation.message}`;
    }
  }
}