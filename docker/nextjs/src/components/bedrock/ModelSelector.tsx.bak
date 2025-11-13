'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ModelStatusBadge } from './ModelStatusBadge';
import { UnavailableModelsList } from './UnavailableModelsList';
import { SelectedModelInfo } from './SelectedModelInfo';
import { AvailableModelsList } from './AvailableModelsList';
import { 
  processModelsFromRegionInfo, 
  handleModelSelection, 
  getSelectedModel,
  type BedrockRegionInfo,
  type ProcessedModel 
} from './modelUtils';
import { MODEL_DISPLAY_LIMITS } from './constants';

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  showAdvancedFilters?: boolean;
}

// カスタムフックでデータ取得ロジックを分離
function useBedrockRegionInfo() {
  const [regionInfo, setRegionInfo] = useState<BedrockRegionInfo | null>(null);
  const [isLoadingRegionInfo, setIsLoadingRegionInfo] = useState(false);

  useEffect(() => {
    const fetchRegionInfo = async () => {
      setIsLoadingRegionInfo(true);
      try {
        const response = await fetch('/api/bedrock/region-info');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setRegionInfo(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch region info:', error);
      } finally {
        setIsLoadingRegionInfo(false);
      }
    };

    fetchRegionInfo();
  }, []);

  return { regionInfo, isLoadingRegionInfo };
}

export function ModelSelector({ 
  selectedModelId, 
  onModelChange, 
  showAdvancedFilters = false 
}: ModelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRegionInfo, setShowRegionInfo] = useState(false);
  const { regionInfo, isLoadingRegionInfo } = useBedrockRegionInfo();

  // デバッグ用ログ
  console.log('🔍 ModelSelector rendered with:', { 
    selectedModelId, 
    showAdvancedFilters,
    regionInfo: regionInfo ? {
      availableCount: regionInfo.availableModelsCount,
      unavailableCount: regionInfo.unavailableModelsCount
    } : null
  });

  // モデル一覧の処理（メモ化）
  const allModels = useMemo(() => processModelsFromRegionInfo(regionInfo), [regionInfo]);
  const selectedModel = useMemo(() => getSelectedModel(allModels, selectedModelId), [allModels, selectedModelId]);

  // 利用可能なモデル一覧（選択中のモデルを除外）- メモ化でパフォーマンス最適化
  const availableModelsFiltered = useMemo(() => {
    return allModels.filter(model => 
      model.available && model.id !== selectedModelId
    );
  }, [allModels, selectedModelId]);

  // モデル選択ハンドラー（メモ化）
  const handleModelChange = useCallback((modelId: string) => {
    const targetModel = allModels.find(m => m.id === modelId);
    handleModelSelection(targetModel, onModelChange, modelId);
  }, [allModels, onModelChange]);

  return (
    <div className="space-y-4" data-component="ModelSelector" data-testid="model-selector">
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">AIモデル選択</label>
          {regionInfo && (
            <div className="flex items-center space-x-1 text-xs">
              <ModelStatusBadge isAvailable={true} count={regionInfo.availableModelsCount} />
              {regionInfo.unavailableModelsCount > 0 && (
                <ModelStatusBadge isAvailable={false} count={regionInfo.unavailableModelsCount} />
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {regionInfo && (
            <button
              onClick={() => setShowRegionInfo(!showRegionInfo)}
              className="text-xs text-green-600 hover:text-green-800 flex items-center space-x-1 px-2 py-1 rounded hover:bg-green-50"
              title="リージョン情報を表示"
            >
              <span>🌍</span>
              <span>{regionInfo.currentRegionName}</span>
            </button>
          )}
          {showAdvancedFilters && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
            >
              {isExpanded ? '📋 簡易' : '📋 詳細'}
            </button>
          )}
        </div>
      </div>

      {/* 選択中のモデル情報を上部に固定表示 */}
      <SelectedModelInfo 
        model={selectedModel}
        onModelChange={onModelChange}
        availableModels={availableModelsFiltered}
        showRecommendations={true}
      />
      
      {/* 利用可能なモデル一覧（選択中のモデルを除外してカテゴリ別グループ化） */}
      <AvailableModelsList 
        models={allModels}
        selectedModelId={selectedModelId}
        onModelSelect={handleModelChange}
        showCategories={true}
      />

      {/* リージョン情報表示 */}
      {showRegionInfo && regionInfo && (
        <div className="mt-2 p-3 bg-blue-50 rounded-md text-xs border border-blue-200">
          <div className="space-y-2">
            <div className="font-medium text-blue-900 flex items-center space-x-2">
              <span>🌍</span>
              <span>Bedrockリージョン情報</span>
            </div>
            <div className="space-y-1 text-blue-800">
              <div><span className="font-medium">現在のリージョン:</span> {regionInfo.currentRegionName} ({regionInfo.currentRegion})</div>
              <div><span className="font-medium">利用可能モデル:</span> {regionInfo.availableModelsCount}個</div>
              <div><span className="font-medium">利用不可モデル:</span> {regionInfo.unavailableModelsCount}個</div>
              <div><span className="font-medium">最終確認:</span> {new Date(regionInfo.lastChecked).toLocaleString('ja-JP')}</div>
            </div>
            {regionInfo.unavailableModelsCount > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                <div className="text-yellow-800 text-xs">
                  <div className="font-medium">⚠️ 利用不可能なモデル:</div>
                  <div className="mt-1 space-y-1">
                    {regionInfo.unavailableModels.slice(0, MODEL_DISPLAY_LIMITS.UNAVAILABLE_MODELS_PREVIEW).map(model => (
                      <div key={model.modelId} className="text-xs">
                        • {model.modelName} ({model.provider}) - {model.reason}
                      </div>
                    ))}
                    {regionInfo.unavailableModels.length > MODEL_DISPLAY_LIMITS.UNAVAILABLE_MODELS_PREVIEW && (
                      <div className="text-xs text-yellow-600">
                        ...他 {regionInfo.unavailableModels.length - MODEL_DISPLAY_LIMITS.UNAVAILABLE_MODELS_PREVIEW}個
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* 利用不可能なモデル一覧表示 */}
      {regionInfo && regionInfo.unavailableModelsCount > 0 && (
        <UnavailableModelsList 
          unavailableModels={regionInfo.unavailableModels.map(model => ({
            id: model.modelId,
            name: model.modelName,
            description: `${model.provider}の${model.modelName}`,
            provider: model.provider as any,
            category: 'chat' as any,
            maxTokens: 4000,
            temperature: 0.7,
            topP: 0.9,
            availableRegions: [],
            type: 'chat' as any
          }))}
          unavailableModelsCount={regionInfo.unavailableModelsCount}
        />
      )}

      {/* 詳細情報表示 */}
      {isExpanded && (
        <div className="space-y-3">
          {selectedModel && (
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="space-y-2">
                <div className="font-semibold text-gray-800 mb-2">📋 選択中モデルの詳細情報</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-800"><span className="font-medium">プロバイダー:</span> {selectedModel.provider}</div>
                  <div className="text-gray-800"><span className="font-medium">カテゴリー:</span> {selectedModel.category}</div>
                  <div className="flex items-center space-x-2 col-span-2">
                    <span className="font-medium text-gray-800">利用可能性:</span>
                    {selectedModel.available ? (
                      <span className="text-green-700 flex items-center space-x-1 font-medium">
                        <span>✅</span>
                        <span>利用可能</span>
                      </span>
                    ) : (
                      <span className="text-red-700 flex items-center space-x-1 font-medium">
                        <span>❌</span>
                        <span>利用不可</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-gray-800 text-xs">
                  <span className="font-medium">モデルID:</span> 
                  <code className="ml-1 px-1 py-0.5 bg-gray-200 rounded text-xs font-mono text-gray-900">
                    {selectedModel.id}
                  </code>
                </div>
                {selectedModel.reason && (
                  <div className="text-red-700 text-xs">
                    <span className="font-medium">理由:</span> {selectedModel.reason}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 統計情報 */}
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <div className="space-y-2">
              <div className="font-semibold text-blue-800 mb-2">📊 モデル統計</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                <div><span className="font-medium">全モデル数:</span> {allModels.length}個</div>
                <div><span className="font-medium">利用可能:</span> {allModels.filter(m => m.available).length}個</div>
                <div><span className="font-medium">利用不可:</span> {allModels.filter(m => !m.available).length}個</div>
                <div><span className="font-medium">選択可能:</span> {availableModelsFiltered.length}個</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ローディング表示 */}
      {isLoadingRegionInfo && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span>リージョン情報を取得中...</span>
        </div>
      )}
    </div>
  );
}