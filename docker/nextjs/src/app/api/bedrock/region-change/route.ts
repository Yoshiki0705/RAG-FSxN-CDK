import { NextRequest, NextResponse } from 'next/server';
import { 
  RegionConfigManager, 
  SupportedRegion,
  RegionInfo 
} from '@/config/region-config-manager';
import { 
  ModelConfigManager, 
  BedrockModelInfo 
} from '@/config/model-config-manager';
import { ErrorHandler, ErrorFactory, ErrorLevel } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

interface RegionChangeRequest {
  newRegion: string;
  currentRegion?: string;
  validateOnly?: boolean;
  includeModels?: boolean;
  includeRecommendations?: boolean;
}

interface RegionChangeResponse {
  success: boolean;
  validation: RegionValidationResult;
  regionInfo: {
    region: SupportedRegion;
    regionName: string;
    isSupported: boolean;
    modelCount: number;
  };
  models?: {
    available: BedrockModelInfo[];
    chatModels: BedrockModelInfo[];
    embeddingModels: BedrockModelInfo[];
    imageModels: BedrockModelInfo[];
    recommended: BedrockModelInfo[];
  };
  recommendations?: {
    chatModel: BedrockModelInfo | null;
    embeddingModel: BedrockModelInfo | null;
  };
  regionModelInfo?: RegionModelInfo | null;
  changes?: {
    fromRegion: string;
    toRegion: string;
    modelCountChange: number;
    newlyAvailable: BedrockModelInfo[];
    noLongerAvailable: BedrockModelInfo[];
  };
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  fallback?: {
    region: SupportedRegion;
    regionName: string;
  };
  timestamp: string;
}

function calculateRegionChanges(
  fromRegion: string, 
  toRegion: SupportedRegion
): {
  modelCountChange: number;
  newlyAvailable: BedrockModelInfo[];
  noLongerAvailable: BedrockModelInfo[];
} {
  try {
    const fromSupported = RegionConfigManager.isRegionSupported(fromRegion);
    const fromModels = fromSupported ? ModelConfigManager.getAvailableModels(fromRegion as SupportedRegion) : [];
    const toModels = ModelConfigManager.getAvailableModels(toRegion);
    
    const fromModelIds = new Set(fromModels.map(m => m.id));
    const toModelIds = new Set(toModels.map(m => m.id));
    
    const newlyAvailable = toModels.filter(model => !fromModelIds.has(model.id));
    const noLongerAvailable = fromModels.filter(model => !toModelIds.has(model.id));
    
    return {
      modelCountChange: toModels.length - fromModels.length,
      newlyAvailable,
      noLongerAvailable
    };
  } catch (error) {
    console.warn('[API] Error calculating region changes:', error);
    return {
      modelCountChange: 0,
      newlyAvailable: [],
      noLongerAvailable: []
    };
  }
}

export async function POST(request: NextRequest) {
  console.log('[Region Change API] POST request received');
  const errorHandler = ErrorHandler.getInstance();
  
  try {
    let requestBody: RegionChangeRequest;
    
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('[API] Invalid JSON in request body:', parseError);
      
      // エラーハンドリングシステムでの処理
      const error = ErrorFactory.validationFailed('request_body', 'invalid', 'Valid JSON required');
      await errorHandler.handleError(error);
      
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        timestamp: new Date().toISOString()
      } as ErrorResponse, { status: 400 });
    }
    
    const {
      newRegion,
      currentRegion,
      validateOnly = false,
      includeModels = true,
      includeRecommendations = true
    } = requestBody;
    
    if (!newRegion) {
      const error = ErrorFactory.validationFailed('newRegion', 'missing', 'newRegion parameter is required');
      await errorHandler.handleError(error);
      
      return NextResponse.json({
        success: false,
        error: 'newRegion parameter is required',
        code: 'MISSING_REGION',
        timestamp: new Date().toISOString()
      } as ErrorResponse, { status: 400 });
    }
    
    console.log(`[API] Processing region change: ${currentRegion || 'unknown'} -> ${newRegion}`);
    
    // リージョン管理システムの初期化
    const regionManager = new RegionConfigManager();
    const modelManager = new ModelConfigManager();
    
    // リージョンサポート状況の確認
    if (!regionManager.isRegionSupported(newRegion)) {
      const error = ErrorFactory.invalidRegion(newRegion);
      await errorHandler.handleError(error);
      
      return NextResponse.json({
        success: false,
        error: `リージョン「${newRegion}」はサポートされていません`,
        code: 'INVALID_REGION',
        details: {
          requestedRegion: newRegion,
          supportedRegions: regionManager.getSupportedRegions()
        },
        fallback: {
          region: 'ap-northeast-1',
          regionName: '東京 (ap-northeast-1)'
        },
        timestamp: new Date().toISOString()
      } as ErrorResponse, { status: 400 });
    }
    
    const targetRegion = newRegion as SupportedRegion;
    
    if (validateOnly) {
      const validation = RegionConfigManager.validateRegion(targetRegion);
      return NextResponse.json({
        success: true,
        validation,
        regionInfo: {
          region: targetRegion,
          regionName: RegionConfigManager.getRegionDisplayName(targetRegion),
          isSupported: true,
          modelCount: RegionConfigManager.getRegionModelCount(targetRegion)
        },
        timestamp: new Date().toISOString()
      } as RegionChangeResponse);
    }
    
    const regionInfo = {
      region: targetRegion,
      regionName: RegionConfigManager.getRegionDisplayName(targetRegion),
      isSupported: RegionConfigManager.isRegionSupported(targetRegion),
      modelCount: RegionConfigManager.getRegionModelCount(targetRegion)
    };
    
    let models: RegionChangeResponse['models'] | undefined;
    let regionModelInfo: RegionModelInfo | null = null;
    
    if (includeModels) {
      try {
        const availableModels = ModelConfigManager.getAvailableModels(targetRegion);
        const chatModels = ModelConfigManager.getChatModels(targetRegion);
        const embeddingModels = ModelConfigManager.getEmbeddingModels(targetRegion);
        const imageModels = ModelConfigManager.getImageModels(targetRegion);
        const recommendedModels = ModelConfigManager.getRecommendedModels(targetRegion);
        
        models = {
          available: availableModels,
          chatModels,
          embeddingModels,
          imageModels,
          recommended: recommendedModels
        };
        
        regionModelInfo = ModelConfigManager.getRegionModelInfo(targetRegion);
        
        console.log(`[API] Retrieved ${availableModels.length} models for ${targetRegion}`);
      } catch (modelError) {
        console.error(`[API] Error retrieving models for ${targetRegion}:`, modelError);
      }
    }
    
    let recommendations: RegionChangeResponse['recommendations'] | undefined;
    
    if (includeRecommendations) {
      try {
        recommendations = {
          chatModel: ModelConfigManager.getDefaultChatModel(targetRegion),
          embeddingModel: ModelConfigManager.getDefaultEmbeddingModel(targetRegion)
        };
      } catch (recommendationError) {
        console.warn(`[API] Could not get recommendations for ${targetRegion}:`, recommendationError);
        recommendations = {
          chatModel: null,
          embeddingModel: null
        };
      }
    }
    
    let changes: RegionChangeResponse['changes'] | undefined;
    
    if (currentRegion && currentRegion !== targetRegion) {
      changes = {
        fromRegion: currentRegion,
        toRegion: targetRegion,
        ...calculateRegionChanges(currentRegion, targetRegion)
      };
      
      console.log(`[API] Region change analysis: ${changes.modelCountChange > 0 ? '+' : ''}${changes.modelCountChange} models, ${changes.newlyAvailable.length} new, ${changes.noLongerAvailable.length} removed`);
    }
    
    const response: RegionChangeResponse = {
      success: true,
      validation,
      regionInfo,
      models,
      recommendations,
      regionModelInfo,
      changes,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[API] Region change successful: ${targetRegion}`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Unexpected error in region change:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error during region change',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    } as ErrorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('[Region Change API] GET request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const fromRegion = searchParams.get('from');
    const toRegion = searchParams.get('to');
    
    if (!fromRegion && !toRegion) {
      const supportedRegions = RegionConfigManager.getSupportedRegions();
      const regionOptions = RegionConfigManager.getRegionSelectOptions();
      
      return NextResponse.json({
        success: true,
        supportedRegions,
        regionOptions,
        defaultRegion: RegionConfigManager.getDefaultRegion(),
        timestamp: new Date().toISOString()
      });
    }
    
    if (fromRegion && toRegion) {
      const fromValidation = RegionConfigManager.validateRegion(fromRegion);
      const toValidation = RegionConfigManager.validateRegion(toRegion);
      
      if (!toValidation.isValid) {
        return NextResponse.json({
          success: false,
          error: `Invalid target region: ${toRegion}`,
          code: 'INVALID_TARGET_REGION',
          timestamp: new Date().toISOString()
        } as ErrorResponse, { status: 400 });
      }
      
      const changes = calculateRegionChanges(fromRegion, toRegion as SupportedRegion);
      
      return NextResponse.json({
        success: true,
        analysis: {
          fromRegion,
          fromRegionValid: fromValidation.isValid,
          toRegion,
          toRegionValid: toValidation.isValid,
          changes
        },
        timestamp: new Date().toISOString()
      });
    }
    
    const region = toRegion || fromRegion;
    if (region) {
      const validation = RegionConfigManager.validateRegion(region);
      
      return NextResponse.json({
        success: true,
        region,
        validation,
        regionInfo: validation.isValid ? {
          regionName: RegionConfigManager.getRegionDisplayName(region as SupportedRegion),
          modelCount: RegionConfigManager.getRegionModelCount(region as SupportedRegion)
        } : null,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'No valid parameters provided',
      code: 'MISSING_PARAMETERS',
      timestamp: new Date().toISOString()
    } as ErrorResponse, { status: 400 });
    
  } catch (error) {
    console.error('[API] Error in GET region change:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    } as ErrorResponse, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}