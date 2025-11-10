import React from 'react';
import { BedrockModel } from '../../config/bedrock-models';

interface UnavailableModelsListProps {
  unavailableModels: BedrockModel[];
  unavailableModelsCount?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function UnavailableModelsList({ 
  unavailableModels, 
  unavailableModelsCount,
  isExpanded = false, 
  onToggle 
}: UnavailableModelsListProps) {
  const count = unavailableModelsCount || unavailableModels.length;
  
  if (count === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      {onToggle && (
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>利用不可能なモデル ({count}種類)</span>
          <span className="ml-2">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
      )}
      
      {(isExpanded || !onToggle) && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {unavailableModels.map((model) => (
            <div
              key={model.id}
              className="p-2 bg-red-50 border border-red-200 rounded text-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">❌</span>
                  <span className="font-medium text-gray-900">{model.name}</span>
                  <span className="text-xs text-gray-500">({model.provider})</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-red-600">
                制約: リージョン制限またはアクセス権限不足
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}