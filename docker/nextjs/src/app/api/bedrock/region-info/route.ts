import { NextRequest, NextResponse } from 'next/server';
import { BedrockService } from '../../../../lib/bedrock/bedrock-service';
import { getCurrentBedrockRegion } from '../../../../lib/bedrock/bedrock-config';
import { validateRegionChangeRequest } from '../../../../lib/validation/api-validation';

/**
 * Bedrockリージョン情報API
 * 現在のリージョンで利用可能なモデル情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    // BedrockServiceのシングルトンインスタンスを取得
    const bedrockService = BedrockService.getInstance();
    
    // リージョン情報を取得（キャッシュ機能付き）
    const regionInfo = await bedrockService.getRegionInfo();
    
    // 成功時のレスポンス
    if (regionInfo.success) {
      return NextResponse.json(regionInfo);
    }
    
    // エラー時のレスポンス（500ステータス）
    return NextResponse.json(regionInfo, { status: 500 });

  } catch (error) {
    console.error('Bedrockリージョン情報API エラー:', error);
    
    // 予期しないエラー時のフォールバック
    const fallbackResponse = {
      success: false,
      error: 'Bedrockリージョン情報の取得に失敗しました',
      data: {
        currentRegion: getCurrentBedrockRegion(),
        availableModels: [],
        totalModels: 0,
        timestamp: new Date().toISOString(),
      },
      errorDetails: error instanceof Error ? error.message : '不明なエラー',
    };

    return NextResponse.json(fallbackResponse, { status: 500 });
  }
}

/**
 * リージョン変更設定API（将来の拡張用）
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディの解析
    const body = await request.json();
    
    // 入力値検証
    const validation = validateRegionChangeRequest(body);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    const { newRegion } = validation.data!;
    const currentRegion = getCurrentBedrockRegion();

    // 同じリージョンの場合の処理
    if (newRegion === currentRegion) {
      return NextResponse.json({
        success: true,
        message: '既に指定されたリージョンが設定されています',
        data: {
          currentRegion,
          requestedRegion: newRegion,
          changeInstructions: [],
          timestamp: new Date().toISOString(),
        },
      });
    }

    // リージョン変更の案内レスポンス
    const response = {
      success: true,
      message: 'リージョン変更リクエストを受け付けました',
      data: {
        currentRegion,
        requestedRegion: newRegion,
        changeInstructions: [
          '1. BEDROCK_REGION環境変数を更新してください',
          '2. アプリケーションを再デプロイしてください', 
          '3. 新しいリージョンでのモデル可用性を確認してください',
        ],
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('リージョン変更API エラー:', error);
    
    return NextResponse.json({
      success: false,
      error: 'リージョン変更リクエストの処理に失敗しました',
      details: error instanceof Error ? error.message : '不明なエラー',
    }, { status: 500 });
  }
}