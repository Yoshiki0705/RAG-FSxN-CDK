'use client';

import { useState, useEffect } from 'react';
import { 
  RegionConfigManager, 
  SupportedRegion, 
  RegionSelectOption 
} from '../../config/region-config-manager';
import { ModelConfigManager } from '../../config/model-config-manager';

interface RegionInfo {
  region: string;
  regionName: string;
  isCurrentRegion: boolean;
  supported?: boolean;
  modelCount?: number;
  description?: string;
  warningMessage?: string;
  isPrimary?: boolean;
  isNew?: boolean;
}

interface RegionSelectorProps {
  onRegionChange?: (region: string) => void;
  showRegionInfo?: boolean;
  showUnsupportedRegions?: boolean;
  enableTooltips?: boolean;
}

export function RegionSelector({ 
  onRegionChange, 
  showRegionInfo = true,
  showUnsupportedRegions = true,
  enableTooltips = true
}: RegionSelectorProps) {
  const [currentRegion, setCurrentRegion] = useState<SupportedRegion>('ap-northeast-1');
  const [supportedRegions, setSupportedRegions] = useState<RegionInfo[]>([]);
  const [unsupportedRegions, setUnsupportedRegions] = useState<RegionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // リージョン情報の取得（新しいRegionConfigManagerを使用）
  useEffect(() => {
    const loadRegionInfo = async () => {
      setIsLoading(true);
      try {
        // 新しいRegionConfigManagerからリージョン情報を取得
        const regionOptions = RegionConfigManager.getRegionSelectOptions();
        const currentRegionFromEnv = RegionConfigManager.getDefaultRegion(); // 環境変数から取得する場合
        
        // サポート対象リージョンとサポート外リージョンを分離
        const supported: RegionInfo[] = [];
        const unsupported: RegionInfo[] = [];
        
        regionOptions.forEach(option => {
          const regionInfo: RegionInfo = {
            region: option.value,
            regionName: option.labelJa,
            isCurrentRegion: option.value === currentRegionFromEnv,
            supported: option.supported,
            modelCount: option.modelCount,
            description: option.description,
            warningMessage: option.warningMessage,
            isPrimary: option.isPrimary,
            isNew: option.isNew
          };
          
          if (option.supported) {
            supported.push(regionInfo);
          } else {
            unsupported.push(regionInfo);
          }
        });
        
        setCurrentRegion(currentRegionFromEnv);
        setSupportedRegions(supported);
        setUnsupportedRegions(unsupported);
        
        console.log('[RegionSelector] リージョン情報を読み込みました:', {
          currentRegion: currentRegionFromEnv,
          supportedCount: supported.length,
          unsupportedCount: unsupported.length
        });
        
        // 既存APIからの情報も取得（フォールバック用）
        try {
          const response = await fetch('/api/bedrock/region-info');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // APIから取得した現在のリージョンで更新
              const apiCurrentRegion = data.data.currentRegion;
              if (RegionConfigManager.isRegionSupported(apiCurrentRegion)) {
                setCurrentRegion(apiCurrentRegion as SupportedRegion);
                
                // 現在のリージョン情報を更新
                setSupportedRegions(prev => prev.map(region => ({
                  ...region,
                  isCurrentRegion: region.region === apiCurrentRegion
                })));
              }
            }
          }
        } catch (apiError) {
          console.warn('[RegionSelector] API情報の取得に失敗（新しい設定を使用）:', apiError);
        }
        
      } catch (error) {
        console.error('[RegionSelector] リージョン情報の読み込みに失敗:', error);
        
        // フォールバック: デフォルト設定を使用
        const fallbackRegion = RegionConfigManager.getDefaultRegion();
        setCurrentRegion(fallbackRegion);
        setSupportedRegions([{
          region: fallbackRegion,
          regionName: RegionConfigManager.getRegionDisplayName(fallbackRegion),
          isCurrentRegion: true,
          supported: true,
          modelCount: 0,
          description: 'デフォルトリージョン'
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRegionInfo();
  }, []);

  const handleRegionChange = (newRegion: string) => {
    // リージョンの妥当性チェック
    const validation = RegionConfigManager.validateRegion(newRegion);
    
    if (!validation.isValid) {
      alert(`⚠️ ${validation.message}\n\n推奨リージョン: ${RegionConfigManager.getRegionDisplayName(validation.fallbackRegion)}`);
      return;
    }
    
    if (onRegionChange) {
      onRegionChange(newRegion);
    } else {
      // デフォルトの動作: より詳細な説明とコピー可能な設定値を提供
      const allRegions = [...supportedRegions, ...unsupportedRegions];
      const regionInfo = allRegions.find(r => r.region === newRegion);
      const regionName = regionInfo?.regionName || newRegion;
      
      // サポート外リージョンの場合は警告
      if (regionInfo && !regionInfo.supported) {
        alert(`❌ ${regionName}は現在サポートされていません。\n\n${regionInfo.warningMessage || '将来的にサポート予定です。'}`);
        return;
      }
      
      // モデル数の情報を含める
      const modelCount = regionInfo?.modelCount || 0;
      const modelInfo = modelCount > 0 ? `\n\n利用可能なモデル数: ${modelCount}個` : '';
      
      const message = `リージョンを ${regionName} (${newRegion}) に変更するには、以下の手順が必要です：

1. 環境変数を設定:
   BEDROCK_REGION=${newRegion}

2. アプリケーションを再起動

3. 利用可能なモデルが変更される可能性があります${modelInfo}

この設定値をクリップボードにコピーしますか？`;
      
      if (confirm(message)) {
        // クリップボードにコピー
        navigator.clipboard.writeText(`BEDROCK_REGION=${newRegion}`).then(() => {
          alert('設定値をクリップボードにコピーしました！');
        }).catch(() => {
          alert(`手動でコピーしてください: BEDROCK_REGION=${newRegion}`);
        });
      }
    }
  };

  const currentRegionInfo = supportedRegions.find(r => r.region === currentRegion);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Bedrockリージョン</label>
        <div className="flex items-center space-x-2">
          {/* 統計情報表示 */}
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <span>✅ {supportedRegions.length}</span>
            {showUnsupportedRegions && unsupportedRegions.length > 0 && (
              <span>❌ {unsupportedRegions.length}</span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? '閉じる' : '変更'}
          </button>
        </div>
      </div>

      {/* 現在のリージョン表示 */}
      <div className={`p-3 rounded-lg border-2 ${
        currentRegionInfo?.isPrimary 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-sm' 
          : currentRegionInfo?.isNew
          ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300 shadow-sm'
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-sm'
      }`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className={`text-lg ${
              currentRegionInfo?.isPrimary 
                ? 'text-blue-600' 
                : currentRegionInfo?.isNew 
                ? 'text-orange-600'
                : 'text-green-600'
            }`}>
              {currentRegionInfo?.isPrimary ? '🏆' : currentRegionInfo?.isNew ? '🆕' : '🌍'}
            </span>
            <span className={`font-semibold ${
              currentRegionInfo?.isPrimary 
                ? 'text-blue-900' 
                : currentRegionInfo?.isNew 
                ? 'text-orange-900'
                : 'text-green-900'
            }`}>
              {currentRegionInfo?.regionName || RegionConfigManager.getRegionDisplayName(currentRegion)}
            </span>
            <span className={`font-mono text-xs ${
              currentRegionInfo?.isPrimary 
                ? 'text-blue-700' 
                : currentRegionInfo?.isNew 
                ? 'text-orange-700'
                : 'text-green-700'
            }`}>
              ({currentRegion})
            </span>
            {currentRegionInfo?.isNew && (
              <span className="px-2 py-1 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-full text-xs font-bold border border-orange-200">
                NEW
              </span>
            )}
          </div>
          {currentRegionInfo?.modelCount !== undefined && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">🤖</span>
              <span className={`text-xs font-bold ${
                currentRegionInfo?.isPrimary 
                  ? 'text-blue-800' 
                  : currentRegionInfo?.isNew 
                  ? 'text-orange-800'
                  : 'text-green-800'
              }`}>
                {currentRegionInfo.modelCount}個
              </span>
            </div>
          )}
        </div>
        <div className={`text-xs mt-2 font-medium ${
          currentRegionInfo?.isPrimary 
            ? 'text-blue-800' 
            : currentRegionInfo?.isNew 
            ? 'text-orange-800'
            : 'text-green-800'
        }`}>
          {currentRegionInfo?.isPrimary && '🏆 プライマリリージョン（推奨）'}
          {currentRegionInfo?.isNew && '🆕 新規追加リージョン（災害復旧・負荷分散対応）'}
          {!currentRegionInfo?.isPrimary && !currentRegionInfo?.isNew && '✅ サポート対象リージョン'}
        </div>
      </div>

      {/* リージョン選択 */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="space-y-3">
            {/* サポート対象リージョン */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <span>✅ サポート対象リージョン</span>
                <span className="text-gray-500">({supportedRegions.length}個)</span>
              </div>
              
              {isLoading ? (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span>リージョン情報を取得中...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {supportedRegions.map((region) => (
                    <div
                      key={region.region}
                      className="relative"
                      onMouseEnter={() => enableTooltips && setHoveredRegion(region.region)}
                      onMouseLeave={() => enableTooltips && setHoveredRegion(null)}
                    >
                      <button
                        onClick={() => handleRegionChange(region.region)}
                        disabled={region.isCurrentRegion}
                        className={`w-full text-left p-3 rounded-lg text-xs transition-all duration-200 transform hover:scale-[1.02] ${
                          region.isCurrentRegion
                            ? region.isPrimary
                              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 border-2 border-blue-400 cursor-default shadow-md'
                              : region.isNew
                              ? 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-900 border-2 border-orange-400 cursor-default shadow-md'
                              : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-900 border-2 border-green-400 cursor-default shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 cursor-pointer shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">
                              {region.isCurrentRegion 
                                ? (region.isPrimary ? '🏆' : region.isNew ? '🆕' : '✅')
                                : (region.isPrimary ? '🏆' : region.isNew ? '🆕' : '🌍')
                              }
                            </span>
                            <div className="flex flex-col">
                              <span className="font-semibold">{region.regionName}</span>
                              <span className="text-xs text-gray-500 font-mono">({region.region})</span>
                            </div>
                            {region.isNew && (
                              <span className="px-2 py-1 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-full text-xs font-bold border border-orange-200">
                                NEW
                              </span>
                            )}
                            {region.isPrimary && !region.isCurrentRegion && (
                              <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
                                推奨
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {region.modelCount !== undefined && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-600">🤖</span>
                                <span className="text-gray-700 text-xs font-medium">
                                  {region.modelCount}個
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {region.isCurrentRegion && (
                          <div className={`text-xs mt-2 font-medium ${
                            region.isPrimary 
                              ? 'text-blue-700' 
                              : region.isNew 
                              ? 'text-orange-700'
                              : 'text-green-700'
                          }`}>
                            {region.isPrimary && '🏆 プライマリリージョン（現在使用中）'}
                            {region.isNew && '🆕 新規追加リージョン（現在使用中）'}
                            {!region.isPrimary && !region.isNew && '✅ 現在使用中'}
                          </div>
                        )}
                      </button>
                      
                      {/* ツールチップ */}
                      {enableTooltips && hoveredRegion === region.region && (
                        <div className="absolute z-10 left-0 top-full mt-1 p-3 bg-gray-800 text-white text-xs rounded shadow-lg max-w-sm border border-gray-600">
                          <div className="font-medium text-white mb-2">{region.regionName}</div>
                          <div className="text-gray-200 mb-2">{region.description}</div>
                          
                          {region.modelCount !== undefined && (
                            <div className="mb-2">
                              <span className="text-green-300">✅ 利用可能モデル: {region.modelCount}個</span>
                            </div>
                          )}
                          
                          {region.isPrimary && (
                            <div className="mb-1">
                              <span className="text-blue-300">🏆 プライマリリージョン（推奨）</span>
                            </div>
                          )}
                          
                          {region.isNew && (
                            <div className="mb-1">
                              <span className="text-orange-300">🆕 新規追加リージョン</span>
                            </div>
                          )}
                          
                          {/* モデル詳細情報 */}
                          {region.supported && RegionConfigManager.isRegionSupported(region.region) && (
                            <div className="mt-2 pt-2 border-t border-gray-600">
                              <div className="text-gray-300 text-xs">
                                {(() => {
                                  const regionModelInfo = ModelConfigManager.getRegionModelInfo(region.region as SupportedRegion);
                                  return (
                                    <div className="space-y-1">
                                      <div>チャット: {regionModelInfo.chatModels.length}個</div>
                                      <div>埋め込み: {regionModelInfo.embeddingModels.length}個</div>
                                      <div>推奨: {regionModelInfo.recommendedModels.length}個</div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* サポート外リージョン */}
            {showUnsupportedRegions && unsupportedRegions.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center space-x-2">
                  <span>❌ サポート外リージョン</span>
                  <span className="text-gray-400">({unsupportedRegions.length}個)</span>
                </div>
                <div className="space-y-1">
                  {unsupportedRegions.map((region) => (
                    <div
                      key={region.region}
                      className="relative"
                      onMouseEnter={() => enableTooltips && setHoveredRegion(region.region)}
                      onMouseLeave={() => enableTooltips && setHoveredRegion(null)}
                    >
                      <button
                        onClick={() => handleRegionChange(region.region)}
                        disabled={true}
                        className="w-full text-left p-3 rounded-lg text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed opacity-60 hover:opacity-70 transition-opacity"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">❌</span>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-600">{region.regionName}</span>
                              <span className="text-xs text-gray-400 font-mono">({region.region})</span>
                            </div>
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-bold border border-gray-300">
                              準備中
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400">🚫</span>
                            <span className="text-gray-400 text-xs font-medium">
                              0個
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs mt-2 font-medium">
                          ❌ 現在サポート対象外（将来的にサポート予定）
                        </div>
                      </button>
                      
                      {/* ツールチップ */}
                      {enableTooltips && hoveredRegion === region.region && (
                        <div className="absolute z-10 left-0 top-full mt-1 p-3 bg-gray-800 text-white text-xs rounded shadow-lg max-w-sm border border-gray-600">
                          <div className="font-medium text-white mb-2">{region.regionName}</div>
                          <div className="text-gray-200 mb-2">{region.description}</div>
                          
                          <div className="mb-2">
                            <span className="text-red-300">❌ 現在サポート対象外</span>
                          </div>
                          
                          <div className="text-yellow-300 mb-2">
                            {region.warningMessage || '将来的にサポート予定です。'}
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <div className="text-gray-300 text-xs">
                              <div>利用可能モデル: 0個</div>
                              <div>ステータス: 準備中</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 注意事項 */}
            <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
              <div className="text-yellow-800 text-xs">
                <div className="font-medium">⚠️ 注意事項:</div>
                <div className="mt-1 space-y-1">
                  <div>• リージョン変更にはアプリケーションの再起動が必要です</div>
                  <div>• 利用可能なモデルはリージョンによって異なります</div>
                  <div>• データ主権・コンプライアンス要件をご確認ください</div>
                  <div>• 大阪リージョンは災害復旧・負荷分散用です</div>
                </div>
              </div>
            </div>

            {/* 環境変数設定方法 */}
            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-blue-800 text-xs">
                <div className="font-medium">💡 設定方法:</div>
                <div className="mt-1 font-mono bg-blue-100 p-1 rounded">
                  BEDROCK_REGION={currentRegion}
                </div>
              </div>
            </div>

            {/* リージョン統計情報 */}
            {showRegionInfo && (
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                <div className="text-gray-800 text-xs">
                  <div className="font-medium">📊 リージョン統計:</div>
                  <div className="mt-1 space-y-1">
                    <div>• サポート対象: {supportedRegions.length}リージョン</div>
                    <div>• サポート外: {unsupportedRegions.length}リージョン</div>
                    <div>• 現在のモデル数: {currentRegionInfo?.modelCount || 0}個</div>
                    {currentRegionInfo?.isPrimary && (
                      <div>• プライマリリージョン（推奨）</div>
                    )}
                    {currentRegionInfo?.isNew && (
                      <div>• 新規追加リージョン</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}