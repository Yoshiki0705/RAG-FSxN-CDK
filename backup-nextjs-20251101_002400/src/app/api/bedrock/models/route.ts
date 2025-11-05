import { NextRequest, NextResponse } from 'next/server';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

export const dynamic = 'force-dynamic';

// Bedrockクライアント初期化
const bedrockClient = new BedrockClient({
  region: process.env.BEDROCK_REGION || 'ap-northeast-1',
});

// モデル情報の型定義
interface BedrockModel {
  id: string;
  name: string;
  description: string;
  provider: 'anthropic' | 'amazon' | 'meta' | 'mistral' | 'ai21' | 'cohere' | 'stability';
  category: 'chat' | 'embedding' | 'image';
  maxTokens: number;
  temperature: number;
  topP: number;
}

// プロバイダーマッピング
function getProviderFromModelId(modelId: string): BedrockModel['provider'] {
  if (modelId.includes('anthropic') || modelId.includes('claude')) return 'anthropic';
  if (modelId.includes('amazon') || modelId.includes('titan') || modelId.includes('nova')) return 'amazon';
  if (modelId.includes('meta') || modelId.includes('llama')) return 'meta';
  if (modelId.includes('mistral')) return 'mistral';
  if (modelId.includes('ai21')) return 'ai21';
  if (modelId.includes('cohere')) return 'cohere';
  if (modelId.includes('stability')) return 'stability';
  return 'amazon'; // デフォルト
}

// モデル名の生成
function generateModelName(modelId: string): string {
  const parts = modelId.split('.');
  const modelPart = parts[parts.length - 1] || modelId;
  
  return modelPart
    .replace(/-/g, ' ')
    .replace(/v\d+/g, '')
    .replace(/:\d+/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

// モデル説明の生成
function generateModelDescription(modelId: string, provider: string): string {
  const name = generateModelName(modelId);
  const providerName = {
    'anthropic': 'Anthropic',
    'amazon': 'Amazon',
    'meta': 'Meta',
    'mistral': 'Mistral AI',
    'ai21': 'AI21 Labs',
    'cohere': 'Cohere',
    'stability': 'Stability AI'
  }[provider] || provider;
  
  return `${name} - ${providerName}製モデル`;
}

// デフォルトパラメータの設定
function getDefaultParameters(modelId: string) {
  if (modelId.includes('haiku') || modelId.includes('micro') || modelId.includes('1b')) {
    return { maxTokens: 2000, temperature: 0.7, topP: 0.9 };
  }
  if (modelId.includes('large') || modelId.includes('opus') || modelId.includes('90b')) {
    return { maxTokens: 4000, temperature: 0.7, topP: 0.9 };
  }
  if (modelId.includes('express')) {
    return { maxTokens: 8000, temperature: 0.7, topP: 0.9 };
  }
  return { maxTokens: 4000, temperature: 0.7, topP: 0.9 };
}

export async function GET(request: NextRequest) {
  console.log('[Bedrock Models API] API endpoint called');
  
  try {
    // Bedrockから利用可能なモデル一覧を取得
    const command = new ListFoundationModelsCommand({
      byOutputModality: 'TEXT',
    });

    const response = await bedrockClient.send(command);
    const foundationModels = response.modelSummaries || [];

    console.log(`[Bedrock Models API] Found ${foundationModels.length} foundation models`);

    // モデル情報を変換
    const models: BedrockModel[] = foundationModels
      .filter(model => {
        const modelId = model.modelId || '';
        return (
          model.inputModalities?.includes('TEXT') &&
          model.outputModalities?.includes('TEXT') &&
          !modelId.includes('embed') &&
          !modelId.includes('rerank')
        );
      })
      .map(model => {
        const modelId = model.modelId || '';
        const provider = getProviderFromModelId(modelId);
        const params = getDefaultParameters(modelId);
        
        return {
          id: modelId,
          name: generateModelName(modelId),
          description: generateModelDescription(modelId, provider),
          provider,
          category: 'chat' as const,
          maxTokens: params.maxTokens,
          temperature: params.temperature,
          topP: params.topP
        };
      })
      .sort((a, b) => {
        // Amazon Novaシリーズを優先表示
        if (a.provider === 'amazon' && a.id.includes('nova') && !(b.provider === 'amazon' && b.id.includes('nova'))) return -1;
        if (b.provider === 'amazon' && b.id.includes('nova') && !(a.provider === 'amazon' && a.id.includes('nova'))) return 1;
        
        // プロバイダー順
        const providerOrder = { amazon: 0, anthropic: 1, meta: 2, mistral: 3, ai21: 4, cohere: 5, stability: 6 };
        const aOrder = providerOrder[a.provider] ?? 99;
        const bOrder = providerOrder[b.provider] ?? 99;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
      });

    // 推奨モデルを動的に決定
    const recommendedModels = models
      .filter(model => 
        model.id.includes('nova-pro') ||
        model.id.includes('claude-3-5-sonnet') ||
        model.id.includes('nova-lite') ||
        model.id.includes('claude-3-sonnet')
      )
      .slice(0, 4)
      .map(model => model.id);

    // デフォルトモデルを動的に決定
    const defaultModel = models.find(model => model.id.includes('nova-pro')) ||
                        models.find(model => model.provider === 'amazon') ||
                        models[0];

    console.log(`[Bedrock Models API] Returning ${models.length} models`);

    return NextResponse.json({
      success: true,
      data: {
        models,
        recommendedModels,
        defaultModelId: defaultModel?.id || 'apac.amazon.nova-pro-v1:0',
        totalCount: models.length,
        lastUpdated: new Date().toISOString(),
        source: 'bedrock-api'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Bedrock Models API] Error:', error);
    
    // エラー時はフォールバック
    const fallbackModels = [
      {
        id: 'apac.amazon.nova-pro-v1:0',
        name: 'Amazon Nova Pro',
        description: 'Amazon Nova Pro - Amazon最新・推奨モデル',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9
      },
      {
        id: 'apac.amazon.nova-lite-v1:0',
        name: 'Amazon Nova Lite',
        description: 'Amazon Nova Lite - 軽量・高速版',
        provider: 'amazon',
        category: 'chat',
        maxTokens: 2000,
        temperature: 0.7,
        topP: 0.9
      },
      {
        id: 'apac.anthropic.claude-3-5-sonnet-20241022-v2:0',
        name: 'Claude 3.5 Sonnet',
        description: 'Claude 3.5 Sonnet - Anthropic高性能モデル',
        provider: 'anthropic',
        category: 'chat',
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        models: fallbackModels,
        recommendedModels: ['apac.amazon.nova-pro-v1:0'],
        defaultModelId: 'apac.amazon.nova-pro-v1:0',
        totalCount: fallbackModels.length,
        lastUpdated: new Date().toISOString(),
        fallback: true,
        source: 'fallback'
      },
      error: `Bedrock API error: ${error}`,
      timestamp: new Date().toISOString()
    });
  }
}
