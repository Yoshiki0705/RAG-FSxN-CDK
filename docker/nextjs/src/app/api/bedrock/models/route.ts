import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const models = [
      {
        id: 'amazon.nova-pro-v1:0',
        name: 'Amazon Nova Pro',
        description: 'High-performance multimodal model',
        provider: 'Amazon'
      },
      {
        id: 'amazon.nova-lite-v1:0',
        name: 'Amazon Nova Lite',
        description: 'Fast and cost-effective model',
        provider: 'Amazon'
      },
      {
        id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        name: 'Claude 3.5 Sonnet',
        description: 'Advanced reasoning and analysis',
        provider: 'Anthropic'
      }
    ];
    
    return NextResponse.json({
      models,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}