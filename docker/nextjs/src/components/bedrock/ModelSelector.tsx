'use client';

import { useState, useEffect } from 'react';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  category: string;
  available: boolean;
  reason?: string;
  description?: string;
  capabilities?: string[];
}

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  showAdvancedFilters?: boolean;
}

export function ModelSelector({ 
  selectedModelId, 
  onModelChange, 
  showAdvancedFilters = false 
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 拡張されたモデル情報（動的取得 + 静的情報の組み合わせ）
  const extendedModels: ModelInfo[] = [
    {
      id: 'apac.amazon.nova-pro-v1:0',
      name: 'Amazon Nova Pro',
      provider: 'Amazon',
      category: 'マルチモーダル',
      available: true,
      description: 'テキスト・画像・動画対応の高性能モデル',
      capabilities: ['テキスト生成', '画像理解', '動画分析', 'コード生成']
    },
    {
      id: 'apac.amazon.nova-lite-v1:0',
      name: 'Amazon Nova Lite',
      provider: 'Amazon',
      category: '高速処理',
      available: true,
      description: '軽量・高速なテキスト生成モデル',
      capabilities: ['テキスト生成', '要約', '翻訳']
    },
    {
      id: 'apac.amazon.nova-micro-v1:0',
      name: 'Amazon Nova Micro',
      provider: 'Amazon',
      category: '超高速',
      available: true,
      description: '最軽量・最高速のテキスト生成モデル',
      capabilities: ['簡単なテキスト生成', 'チャット']
    },
    {
      id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      name: 'Claude 3.5 Sonnet v2',
      provider: 'Anthropic',
      category: '高性能',
      available: true,
      description: '最新の高性能推論モデル',
      capabilities: ['高度な推論', 'コード生成', '分析']
    },
    {
      id: 'anthropic.claude-3-sonnet-20240229-v1:0',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      category: '汎用',
      available: true,
      description: 'バランスの取れた汎用モデル',
      capabilities: ['テキスト生成', '分析', '要約']
    },
    {
      id: 'anthropic.claude-3-haiku-20240307-v1:0',
      name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      category: '高速',
      available: true,
      description: '高速レスポンスモデル',
      capabilities: ['高速テキスト生成', 'チャット']
    },
    {
      id: 'meta.llama3-2-90b-instruct-v1:0',
      name: 'Llama 3.2 90B Instruct',
      provider: 'Meta',
      category: '大規模',
      available: false,
      reason: 'リージョン制限',
      description: '大規模言語モデル（他リージョンで利用可能）',
      capabilities: ['高度な推論', '多言語対応']
    },
    {
      id: 'cohere.command-r-plus-v1:0',
      name: 'Command R+',
      provider: 'Cohere',
      category: 'RAG特化',
      available: false,
      reason: 'リージョン制限',
      description: 'RAG用途に最適化されたモデル（他リージョンで利用可能）',
      capabilities: ['RAG', '検索拡張生成']
    }
  ];

  const selectedModel = extendedModels.find(m => m.id === selectedModelId) || extendedModels[0];

  const fetchRegionModels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bedrock/region-info');
      const data = await response.json();
      
      if (data.success && data.data.availableModels) {
        // 動的取得したモデル情報と静的情報をマージ
        const dynamicModels = data.data.availableModels.map((model: any) => {
          const staticInfo = extendedModels.find(m => m.id === model.modelId);
          return {
            id: model.modelId,
            name: staticInfo?.name || model.modelName || model.modelId,
            provider: staticInfo?.provider || model.providerName || 'Unknown',
            category: staticInfo?.category || 'General',
            available: true,
            description: staticInfo?.description || `${model.providerName}提供のモデル`,
            capabilities: staticInfo?.capabilities || ['テキスト生成']
          };
        });
        
        setModels(dynamicModels);
      } else {
        // フォールバック: 静的モデル情報を使用
        setModels(extendedModels);
      }
    } catch (err) {
      console.error('Failed to fetch region models:', err);
      setError('モデル情報の取得に失敗しました');
      setModels(extendedModels);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegionModels();
  }, []);

  const availableModels = models.filter(m => m.available);
  const unavailableModels = models.filter(m => !m.available);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">AIモデル選択</h3>
        <button
          onClick={fetchRegionModels}
          disabled={isLoading}
          className="text-xs text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
        >
          {isLoading ? '更新中...' : '🔄 更新'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* 現在選択中のモデル詳細（上部に移動） */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">📊 選択中のモデル</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-base font-semibold text-gray-900">{selectedModel.name}</span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {selectedModel.provider}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              selectedModel.available 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {selectedModel.available ? '✅ 利用可能' : '❌ 利用不可'}
            </span>
          </div>
          {selectedModel.description && (
            <div className="text-sm text-gray-700">{selectedModel.description}</div>
          )}
          {selectedModel.capabilities && (
            <div className="flex flex-wrap gap-1">
              {selectedModel.capabilities.map((cap, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                >
                  {cap}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-500 font-mono">
            ID: {selectedModel.id}
          </div>
        </div>
      </div>

      {/* 利用可能なモデル */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-green-700">✅ 利用可能なモデル</h4>
        <div className="space-y-2">
          {availableModels.map((model) => (
            <div
              key={model.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedModelId === model.id
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => onModelChange(model.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {model.name}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {model.provider}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                      {model.category}
                    </span>
                  </div>
                  {model.description && (
                    <div className="text-xs text-gray-600 mb-2">
                      {model.description}
                    </div>
                  )}
                  {model.capabilities && (
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.map((cap, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {selectedModelId === model.id && (
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 利用不可能なモデル */}
      {unavailableModels.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-700">❌ 利用不可能なモデル</h4>
          <div className="space-y-2">
            {unavailableModels.map((model) => (
              <div
                key={model.id}
                className="p-3 rounded-lg border bg-gray-50 border-gray-200 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">
                        {model.name}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-500 rounded-full">
                        {model.provider}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                        {model.reason || '利用不可'}
                      </span>
                    </div>
                    {model.description && (
                      <div className="text-xs text-gray-500 mb-2">
                        {model.description}
                      </div>
                    )}
                  </div>
                  <div className="text-red-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 高度権限制御の対処方法（改善版） */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">🔐 高度権限制御について</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <div>一部のモデルは権限制御により制限される場合があります。</div>
          <div>
            <div className="font-medium text-yellow-800 mb-1">対処方法:</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">1.</span>
                <div>
                  <div className="font-medium">利用可能なモデルを選択</div>
                  <div className="text-gray-600 text-xs">上記の「✅ 利用可能なモデル」から選択してください</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">2.</span>
                <div>
                  <div className="font-medium">システム管理者に権限拡張を依頼</div>
                  <div className="text-gray-600 text-xs">特定のモデルが必要な場合は管理者にお問い合わせください</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">3.</span>
                <div>
                  <div className="font-medium">業務要件に応じたモデル申請</div>
                  <div className="text-gray-600 text-xs">用途に応じて適切なモデルの利用申請を行ってください</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="font-medium text-blue-800">💡 ヒント:</div>
            <div className="text-blue-700">
              Amazon Nova Proは多くの用途に対応できる高性能モデルです。まずはこちらをお試しください。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}