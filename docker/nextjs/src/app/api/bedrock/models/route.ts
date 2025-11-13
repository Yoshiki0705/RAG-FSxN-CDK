import { NextResponse } from 'next/server';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

export async function GET() {
  try {
    const region = process.env.BEDROCK_REGION || 'ap-northeast-1';
    
    const bedrockClient = new BedrockClient({
      region: region,
    });

    const command = new ListFoundationModelsCommand({
      byOutputModality: 'TEXT',
    });

    const response = await bedrockClient.send(command);
    
    const models = (response.modelSummaries || []).map((model) => ({
      id: model.modelId || '',
      name: model.modelName || model.modelId || '',
      description: `${model.providerName} - ${model.modelId}`,
      provider: model.providerName || 'Unknown',
      inputModalities: model.inputModalities || [],
      outputModalities: model.outputModalities || [],
      responseStreamingSupported: model.responseStreamingSupported || false,
    }));

    // 推奨モデルとデフォルトモデルを設定
    const recommendedModels = [
      'amazon.nova-pro-v1:0',
      'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'deepseek.v3-v1:0',
    ].filter(id => models.some(m => m.id === id));
    
    const defaultModelId = models.find(m => m.id === 'amazon.nova-pro-v1:0')?.id || models[0]?.id || '';

    return NextResponse.json({
      success: true,
      data: {
        models,
        region,
        count: models.length,
        recommendedModels,
        defaultModelId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch models from Bedrock',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}