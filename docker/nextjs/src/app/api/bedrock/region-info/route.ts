import { NextRequest, NextResponse } from 'next/server';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { 
  RegionConfigManager, 
  SupportedRegion,
  RegionSelectOption 
} from '@/config/region-config-manager';
import { 
  ModelConfigManager, 
  BedrockModelInfo,
  RegionModelInfo 
} from '@/config/model-config-manager';

export const dynamic = 'force-dynamic';

// API レスポンス用の型定義
interface RegionInfo {
  region: string;
  regionName: string;
  isCurrentRegion: boolean;
  isSupported: boolean;
  supportLevel: 'full' | 'limited' | 'unsupported';
  modelCount: number;
  description?: string;
}

interface ModelAvailability {
  modelId: string;
  modelName: string;
  modelNameJa: string;
  provider: string;
  category: string;
  available: boolean;
  reason?: string;
  testedAt: string;
  isRecommended?: boolean;

}

interface BedrockRegionInfo {
  currentRegion: string;
  currentRegionName: string;
  currentRegionSupported: boolean;
  availableModels: ModelAvailability[];
  unavailableModels: ModelAvailability[];
  totalModelsCount: number;
  availableModelsCount: number;
  unavailableModelsCount: number;
  lastChecked: string;
  supportedRegions: RegionInfo[];
  unsupportedRegions: RegionInfo[];
  regionModelInfo: RegionModelInfo | null;
  recommendations: {
    chatModel: BedrockModelInfo | null;
    embeddingModel: BedrockModelInfo | null;
  };
}

// BedrockModelInfoをModelAvailabilityに変換
function convertToModelAvailability(model: BedrockModelInfo, available: boolean, reason?: string): ModelAvailability {
  return {
    modelId: model.id,
    modelName: model.name,
    modelNameJa: model.nameJa,
    provider: model.provider,
    category: model.category,
    available,
    reason,
    testedAt: new Date().toISOString(),
    isRecommended: model.isRecommended
  };
}

// リージョン情報を取得
function getRegionInfo(region: string, currentRegion: string): RegionInfo {
  const isSupported = RegionConfigManager.isRegionSupported(region);
  const regionName = RegionConfigManager.getRegionDisplayName(region);
  const modelCount = RegionConfigManager.getRegionModelCount(region);
  
  let supportLevel: 'full' | 'limited' | 'unsupported' = 'unsupported';
  let description: string | undefined;
  
  if (isSupported) {
    supportLevel = 'full';
    description = `${modelCount}個のモデルが利用可能`;
  } else {
    supportLevel = 'unsupported';
    description = 'サポート対象外のリージョン';
  }
  
  return {
    region,
    regionName,
    isCurrentRegion: region === currentRegion,
    isSupported,
    supportLevel,
    modelCount,
    description
  };
}

// 実際のBedrockAPIでモデル利用可能性をテスト（フォールバック用）
async function testModelAvailabilityWithBedrock(region: string, modelId: string): Promise<boolean> {
  try {
    const client = new BedrockClient({ region });
    const command = new ListFoundationModelsCommand({});
    
    const response = await client.send(command);
    const models = response.modelSummaries || [];
    return models.some(model => model.modelId === modelId);
  } catch (error) {
    console.warn(`[API] Bedrock test failed for ${modelId} in ${region}:`, error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  console.log('[Bedrock Region Info API] API endpoint called');
  
  // URLパラメータからリージョンを取得（指定がない場合はデフォルト）
  const { searchParams } = new URL(request.url);
  const requestedRegion = searchParams.get('region');
  
  let currentRegion: SupportedRegion;
  
  if (requestedRegion) {
    // リクエストされたリージョンの検証
    const validation = RegionConfigManager.validateRegion(requestedRegion);
    if (validation.isValid) {
      currentRegion = requestedRegion as SupportedRegion;
    } else {
      // 無効なリージョンの場合はフォールバック
      currentRegion = validation.fallbackRegion;
      console.warn(`[API] Invalid region ${requestedRegion}, using fallback: ${currentRegion}`);
    }
  } else {
    // 環境変数またはデフォルトリージョンを使用
    const envRegion = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'ap-northeast-1';
    const validation = RegionConfigManager.validateRegion(envRegion);
    currentRegion = validation.isValid ? envRegion as SupportedRegion : validation.fallbackRegion;
  }
  
  const currentRegionName = RegionConfigManager.getRegionDisplayName(currentRegion);
  const currentRegionSupported = RegionConfigManager.isRegionSupported(currentRegion);
  
  try {
    console.log(`[API] Processing region info for: ${currentRegion} (${currentRegionName})`);
    
    // 1. 新しい設定管理システムを使用してモデル情報を取得
    let availableModels: ModelAvailability[] = [];
    let unavailableModels: ModelAvailability[] = [];
    let regionModelInfo: RegionModelInfo | null = null;
    
    if (currentRegionSupported) {
      try {
        // サポート対象リージョンの場合、ModelConfigManagerを使用
        const models = ModelConfigManager.getAvailableModels(currentRegion);
        availableModels = models.map(model => convertToModelAvailability(model, true));
        
        // リージョンモデル情報を取得
        regionModelInfo = ModelConfigManager.getRegionModelInfo(currentRegion);
        
        console.log(`[API] Found ${availableModels.length} available models in ${currentRegion}`);
      } catch (error) {
        console.error(`[API] Error getting models for ${currentRegion}:`, error);
        
        // フォールバック: Bedrockクライアントで直接取得を試行
        try {
          const bedrockClient = new BedrockClient({ region: currentRegion });
          const command = new ListFoundationModelsCommand({
            byOutputModality: 'TEXT',
          });
          const response = await bedrockClient.send(command);
          const foundationModels = response.modelSummaries || [];
          
          availableModels = foundationModels
            .filter(model => {
              const modelId = model.modelId || '';
              return (
                model.inputModalities?.includes('TEXT') &&
                model.outputModalities?.includes('TEXT') &&
                !modelId.includes('embed') &&
                !modelId.includes('rerank')
              );
            })
            .map(model => ({
              modelId: model.modelId || '',
              modelName: model.modelName || model.modelId || '',
              modelNameJa: model.modelName || model.modelId || '',
              provider: 'Unknown',
              category: 'chat',
              available: true,
              testedAt: new Date().toISOString()
            }));
          
          console.log(`[API] Fallback: Found ${availableModels.length} models via Bedrock API`);
        } catch (bedrockError) {
          console.error(`[API] Bedrock API fallback failed:`, bedrockError);
        }
      }
    } else {
      // サポート外リージョンの場合
      console.log(`[API] Region ${currentRegion} is not supported`);
      unavailableModels.push({
        modelId: 'unsupported-region',
        modelName: 'サポート外リージョン',
        modelNameJa: 'サポート外リージョン',
        provider: 'System',
        category: 'system',
        available: false,
        reason: `${currentRegionName}はサポート対象外のリージョンです`,
        testedAt: new Date().toISOString()
      });
    }
    
    // 2. 推奨モデル情報を取得
    let recommendations = {
      chatModel: null as BedrockModelInfo | null,
      embeddingModel: null as BedrockModelInfo | null
    };
    
    if (currentRegionSupported) {
      try {
        recommendations.chatModel = ModelConfigManager.getDefaultChatModel(currentRegion);
        recommendations.embeddingModel = ModelConfigManager.getDefaultEmbeddingModel(currentRegion);
      } catch (error) {
        console.warn(`[API] Could not get recommendations for ${currentRegion}:`, error);
      }
    }
    
    // 3. 全リージョン情報を取得
    const supportedRegionsList = RegionConfigManager.getSupportedRegions();
    const allRegions = [...supportedRegionsList, 'ap-northeast-3', 'ap-southeast-1', 'ap-southeast-2', 'ap-south-1', 'us-west-1', 'eu-central-1', 'eu-west-2', 'ca-central-1', 'sa-east-1'] as string[];
    const supportedRegions: RegionInfo[] = [];
    const unsupportedRegions: RegionInfo[] = [];
    
    allRegions.forEach(region => {
      const regionInfo = getRegionInfo(region, currentRegion);
      if (regionInfo.isSupported) {
        supportedRegions.push(regionInfo);
      } else {
        unsupportedRegions.push(regionInfo);
      }
    });
    
    // 4. レスポンスデータの構築
    const regionInfo: BedrockRegionInfo = {
      currentRegion,
      currentRegionName,
      currentRegionSupported,
      availableModels,
      unavailableModels,
      totalModelsCount: availableModels.length + unavailableModels.length,
      availableModelsCount: availableModels.length,
      unavailableModelsCount: unavailableModels.length,
      lastChecked: new Date().toISOString(),
      supportedRegions,
      unsupportedRegions,
      regionModelInfo,
      recommendations
    };

    console.log(`[API] Response summary:`);
    console.log(`  - Region: ${currentRegion} (${currentRegionSupported ? 'supported' : 'unsupported'})`);
    console.log(`  - Available models: ${availableModels.length}`);
    console.log(`  - Unavailable models: ${unavailableModels.length}`);
    console.log(`  - Supported regions: ${supportedRegions.length}`);
    console.log(`  - Unsupported regions: ${unsupportedRegions.length}`);

    return NextResponse.json({
      success: true,
      data: regionInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    
    // エラー時のフォールバック
    const fallbackRegionInfo: BedrockRegionInfo = {
      currentRegion,
      currentRegionName,
      currentRegionSupported,
      availableModels: currentRegionSupported ? [
        {
          modelId: 'amazon.nova-pro-v1:0',
          modelName: 'Amazon Nova Pro',
          modelNameJa: 'Amazon Nova Pro',
          provider: 'Amazon',
          category: 'chat',
          available: true,
          testedAt: new Date().toISOString()
        }
      ] : [],
      unavailableModels: currentRegionSupported ? [] : [
        {
          modelId: 'error-fallback',
          modelName: 'エラーフォールバック',
          modelNameJa: 'エラーフォールバック',
          provider: 'System',
          category: 'system',
          available: false,
          reason: `${currentRegionName}でエラーが発生しました`,
          testedAt: new Date().toISOString()
        }
      ],
      totalModelsCount: currentRegionSupported ? 1 : 1,
      availableModelsCount: currentRegionSupported ? 1 : 0,
      unavailableModelsCount: currentRegionSupported ? 0 : 1,
      lastChecked: new Date().toISOString(),
      supportedRegions: RegionConfigManager.getSupportedRegions().map(region => 
        getRegionInfo(region, currentRegion)
      ),
      unsupportedRegions: [],
      regionModelInfo: null,
      recommendations: {
        chatModel: null,
        embeddingModel: null
      }
    };

    return NextResponse.json({
      success: true,
      data: fallbackRegionInfo,
      fallback: true,
      error: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
}