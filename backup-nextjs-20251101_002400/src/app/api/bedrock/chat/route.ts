import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    // 基本的なレスポンス（実際のBedrock統合は後で実装）
    return NextResponse.json({
      response: `Echo: ${message}`,
      model: 'amazon.nova-pro-v1:0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bedrock chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Bedrock Chat API is running',
    timestamp: new Date().toISOString()
  });
}