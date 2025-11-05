'use client';

import { useState, useEffect } from 'react';

interface RegionInfo {
  currentRegion: string;
  availableModels: Array<{
    modelId: string;
    modelName: string;
    providerName: string;
  }>;
  totalModels: number;
}

export function RegionSelector() {
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegionInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bedrock/region-info');
      const data = await response.json();
      
      if (data.success) {
        setRegionInfo(data.data);
      } else {
        setError(data.error || 'Failed to fetch region information');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Region info fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegionInfo();
  }, []);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-gray-700 mb-1">Bedrockリージョン</h3>
      
      {isLoading && (
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span>リージョン情報取得中...</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          ⚠️ {error}
        </div>
      )}

      {regionInfo && (
        <div className="space-y-1">
          <div className="text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-green-600">🌍</span>
              <span className="font-medium text-gray-700">
                {regionInfo.currentRegion}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <div>📊 {regionInfo.totalModels}個のモデル利用可能</div>
            {regionInfo.availableModels.slice(0, 3).map((model, index) => (
              <div key={index} className="ml-2 text-xs text-gray-500">
                • {model.providerName}: {model.modelName}
              </div>
            ))}
            {regionInfo.totalModels > 3 && (
              <div className="ml-2 text-xs text-gray-500">
                ...他{regionInfo.totalModels - 3}個
              </div>
            )}
          </div>
          <button
            onClick={fetchRegionInfo}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            🔄 更新
          </button>
        </div>
      )}
    </div>
  );
}