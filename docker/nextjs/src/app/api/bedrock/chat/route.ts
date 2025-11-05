import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// 型定義
interface PermissionResult {
  allowed: boolean;
  userPermissions?: {
    permissionLevel: string;
  };
  message?: string;
}

interface LogContext {
  userId: string;
  ipAddress: string;
  timestamp: string;
  action: string;
}

// 設定
const LAMBDA_FUNCTION_NAME = process.env.PERMISSION_FILTER_FUNCTION_NAME || 
  'TokyoRegion-permission-aware-rag-prod-PermissionFilter';

const lambdaClient = new LambdaClient({ 
  region: process.env.AWS_REGION || 'ap-northeast-1',
  maxAttempts: 3,
  requestTimeout: 5000
});

// ユーティリティ関数
function getClientIpAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return realIp || forwardedFor?.split(',')[0] || '127.0.0.1';
}

function validateInput(message: string, userId: string): void {
  if (!message || typeof message !== 'string' || message.length > 10000) {
    throw new Error('無効なメッセージ形式です');
  }
  
  if (!userId || typeof userId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error('無効なユーザーID形式です');
  }
}

function createLogContext(userId: string, ipAddress: string): LogContext {
  return {
    userId,
    ipAddress,
    timestamp: new Date().toISOString(),
    action: 'bedrock-chat'
  };
}

async function checkPermissions(userId: string): Promise<PermissionResult> {
  try {
    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      Payload: JSON.stringify({
        userId: userId,
        action: 'bedrock-chat'
      })
    });

    const response = await lambdaClient.send(command);
    if (!response.Payload) {
      throw new Error('権限チェック関数からの応答が空です');
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    if (result.statusCode) {
      const body = JSON.parse(result.body);
      return {
        allowed: result.statusCode === 200 && body.allowed,
        userPermissions: body.userPermissions,
        message: body.message || body.error
      };
    }
    
    return result;
  } catch (error) {
    console.error('権限チェックエラー:', error);
    return {
      allowed: false,
      message: '権限チェック処理中にエラーが発生しました'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();
    const clientIP = getClientIpAddress(request);
    const logContext = createLogContext(userId, clientIP);
    
    console.log('🔐 Bedrock API called', logContext);
    console.log('Request:', { message: message?.substring(0, 50), userId });

    // 入力値検証
    try {
      validateInput(message, userId);
    } catch (validationError) {
      console.log('❌ 入力値検証エラー:', validationError.message);
      return NextResponse.json(
        { success: false, error: validationError.message },
        { status: 400 }
      );
    }

    console.log('🔍 権限チェック実行中...', { userId, ipAddress: clientIP });

    const permissionResult = await checkPermissions(userId);
    console.log('📊 権限チェック結果:', permissionResult);

    if (!permissionResult.allowed) {
      console.log('❌ アクセス拒否:', permissionResult.message);
      return NextResponse.json({
        success: false,
        error: 'アクセス拒否',
        reason: permissionResult.message,
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    console.log('✅ 権限チェック通過');

    return NextResponse.json({
      success: true,
      answer: `こんにちは、${userId}さん！高度権限制御システムが正常に動作しています。権限レベル: ${permissionResult.userPermissions?.permissionLevel || '基本'}。質問: ${message}`,
      userId: userId,
      timestamp: new Date().toISOString(),
      securityInfo: {
        permissionCheckPassed: true,
        ipAddress: clientIP,
        permissionLevel: permissionResult.userPermissions?.permissionLevel || '基本'
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}