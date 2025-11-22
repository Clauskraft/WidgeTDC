/**
 * Model Selector Component
 * 
 * Dropdown selector for LLM models across all providers
 */

import React, { useState, useEffect } from 'react';
import { LLM_MODELS, type LLMModel, getModelsByProvider } from '../utils/llm-models';
import { getLLMProvider } from '../utils/llm-provider';
import './ModelSelector.css';

export interface ModelSelectorProps {
  /** Currently selected model ID */
  value?: string;
  
  /** Callback when model is selected */
  onChange?: (modelId: string, model: LLMModel) => void;
  
  /** Filter by capability */
  filterCapability?: string;
  
  /** Show only configured providers */
  onlyConfigured?: boolean;
  
  /** Custom className */
  className?: string;
}

/**
 * Model Selector Component
 * 
 * @example
 * ```tsx
 * <ModelSelector
 *   value={selectedModel}
 *   onChange={(id, model) => setSelectedModel(id)}
 *   onlyConfigured={true}
 * />
 * ```
 */
export function ModelSelector({
  value,
  onChange,
  filterCapability,
  onlyConfigured = false,
  className = ''
}: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<string>(value || 'deepseek-chat');
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const provider = getLLMProvider();
    setConfiguredProviders(provider.getConfiguredProviders());
  }, []);

  // Filter models
  let availableModels = LLM_MODELS;
  
  if (filterCapability) {
    availableModels = availableModels.filter(m => 
      m.capabilities.includes(filterCapability)
    );
  }
  
  if (onlyConfigured) {
    availableModels = availableModels.filter(m => 
      configuredProviders.includes(m.provider)
    );
  }

  // Group models by provider
  const modelsByProvider = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, LLMModel[]>);

  const handleSelect = (model: LLMModel) => {
    setSelectedModel(model.id);
    setIsOpen(false);
    onChange?.(model.id, model);
  };

  const selectedModelData = LLM_MODELS.find(m => m.id === selectedModel);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'google': return '🔍';
      case 'deepseek': return '🌊';
      default: return '💬';
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'anthropic': return 'Anthropic';
      case 'google': return 'Google';
      case 'deepseek': return 'DeepSeek';
      default: return provider;
    }
  };

  const isConfigured = (provider: string) => {
    return configuredProviders.includes(provider);
  };

  return (
    <div className={`model-selector ${className}`}>
      <div className="model-selector-label">Model</div>
      
      <button
        className="model-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="model-selector-value">
          {selectedModelData ? (
            <>
              <span className="model-icon">
                {getProviderIcon(selectedModelData.provider)}
              </span>
              <span className="model-name">{selectedModelData.name}</span>
              {!isConfigured(selectedModelData.provider) && (
                <span className="model-warning" title="API key not configured">
                  ⚠️
                </span>
              )}
            </>
          ) : (
            'Select Model'
          )}
        </span>
        <span className="model-selector-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="model-selector-dropdown">
          {Object.entries(modelsByProvider).map(([provider, models]) => (
            <div key={provider} className="model-group">
              <div className="model-group-header">
                <span className="model-group-icon">{getProviderIcon(provider)}</span>
                <span className="model-group-label">{getProviderLabel(provider)}</span>
                {!isConfigured(provider) && (
                  <span className="model-group-status" title="Not configured">
                    ⚠️
                  </span>
                )}
              </div>
              
              {models.map(model => (
                <button
                  key={model.id}
                  className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(model)}
                  disabled={onlyConfigured && !isConfigured(model.provider)}
                  title={model.description}
                >
                  <div className="model-option-main">
                    <span className="model-option-name">{model.name}</span>
                    {!isConfigured(model.provider) && (
                      <span className="model-option-warning">⚠️</span>
                    )}
                  </div>
                  <div className="model-option-meta">
                    <span className="model-context">{(model.contextWindow / 1000).toFixed(0)}K context</span>
                    {model.pricing && (
                      <span className="model-pricing">
                        ${model.pricing.input}/${model.pricing.output}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {selectedModelData && !isConfigured(selectedModelData.provider) && (
        <div className="model-selector-notice">
          ⚠️ {getProviderLabel(selectedModelData.provider)} API key not configured.
          Add <code>{selectedModelData.provider.toUpperCase()}_API_KEY</code> to your .env file.
        </div>
      )}
    </div>
  );
}

/**
 * Simple Model Dropdown (Alternative minimal version)
 */
export function SimpleModelDropdown({ value, onChange }: ModelSelectorProps) {
  return (
    <select
      value={value || 'deepseek-chat'}
      onChange={(e) => {
        const model = LLM_MODELS.find(m => m.id === e.target.value);
        if (model) onChange?.(model.id, model);
      }}
      className="simple-model-dropdown"
    >
      {Object.entries(
        LLM_MODELS.reduce((acc, model) => {
          if (!acc[model.provider]) acc[model.provider] = [];
          acc[model.provider].push(model);
          return acc;
        }, {} as Record<string, LLMModel[]>)
      ).map(([provider, models]) => (
        <optgroup key={provider} label={provider.toUpperCase()}>
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export default ModelSelector;
