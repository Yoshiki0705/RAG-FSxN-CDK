/**
 * Amazon Bedrock Agent API エンドポイント
 * Bedrock Agentを使用した文書検索と質問応答
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';

// Bedrock Agent設定
const AGENT_ID = process.env.BEDROCK_AGENT_ID || 'PLACEHOLDER_AGENT_ID';
const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID';

const agentClient = new BedrockAgentRuntimeClient({
  region: process.env.BEDROCK_REGION || process.env.AWS_REGION || 'ap-northeast-1',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    console.log('[Bedrock Agent] Request:', {
      userId,
      sessionId,
      messageLength: message.length,
      agentId: AGENT_ID,
    });

    // Bedrock Agent呼び出し
    const command = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId: sessionId || `session-${userId}-${Date.now()}`,
      inputText: message,
    });

    const response = await agentClient.send(command);

    // ストリーミングレスポンスの処理
    let fullResponse = '';
    let citations: any[] = [];
    let trace: any[] = [];

    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk) {
          const chunk = event.chunk;
          if (chunk.bytes) {
            const text = new TextDecoder().decode(chunk.bytes);
            fullResponse += text;
          }
        }
        
        if (event.trace) {
          trace.push(event.trace);
        }
      }
    }

    console.log('[Bedrock Agent] Response received:', {
      responseLength: fullResponse.length,
      citationsCount: citations.length,
      traceCount: trace.length,
    });

    return NextResponse.json({
      success: true,
      answer: fullResponse || 'Agent処理が完了しましたが、レスポンスが空です。',
      metadata: {
        agentMode: true,
        sessionId: sessionId || `session-${userId}-${Date.now()}`,
        agentId: AGENT_ID,
        citations: citations,
        trace: trace.length > 0 ? trace : undefined,
      },
    });

  } catch (error) {
    console.error('[Bedrock Agent] Error:', error);
    
    // エラーの詳細をログ出力
    if (error instanceof Error) {
      console.error('[Bedrock Agent] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }

    // Agent IDが設定されていない場合のフォールバック
    if (AGENT_ID === 'PLACEHOLDER_AGENT_ID') {
      return NextResponse.json({
        success: false,
        error: 'Bedrock Agentが設定されていません',
        message: 'BEDROCK_AGENT_ID環境変数を設定してください。現在は通常モードをご利用ください。',
        fallback: true,
      }, { status: 503 });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
