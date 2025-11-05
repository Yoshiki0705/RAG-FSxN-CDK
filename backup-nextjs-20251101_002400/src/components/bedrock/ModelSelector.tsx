'use client';

import { useState } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const models = [
    {
      id: 'anthropic.claude-3-sonnet-20240229-v1:0',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      category: 'General'
    },
    {
      id: 'anthropic.claude-3-haiku-20240307-v1:0',
      name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      category: 'Fast'
    },
    {
      id: 'amazon.nova-pro-v1:0',
      name: 'Amazon Nova Pro',
      provider: 'Amazon',
      category: 'Multimodal'
    },
    {
      id: 'amazon.nova-lite-v1:0',
      name: 'Amazon Nova Lite',
      provider: 'Amazon',
      category: 'Fast'
    }
  ];

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">AIモデル</label>
        {showAdvancedFilters && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? '簡易表示' : '詳細表示'}
          </button>
        )}
      </div>
      
      <select
        value={selectedModelId}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({model.provider})
          </option>
        ))}
      </select>

      {isExpanded && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
          <div className="space-y-1">
            <div><span className="font-medium">プロバイダー:</span> {selectedModel.provider}</div>
            <div><span className="font-medium">カテゴリー:</span> {selectedModel.category}</div>
            <div><span className="font-medium">モデルID:</span> {selectedModel.id}</div>
          </div>
        </div>
      )}
    </div>
  );
}