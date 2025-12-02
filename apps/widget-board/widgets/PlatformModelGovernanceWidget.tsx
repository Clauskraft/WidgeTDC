import React, { useState } from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { useWidgetSync } from '../src/hooks/useWidgetSync';
import { Shield, Check, X, AlertTriangle, DollarSign, Database } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ModelProvider {
  id: string;
  name: string;
  logo: string;
  status: 'active' | 'inactive' | 'pending';
  apiKeyConfigured: boolean;
  models: ModelDefinition[];
}

interface ModelDefinition {
  id: string;
  providerId: string;
  name: string;
  displayName: string;
  description: string;
  capabilities: ('chat' | 'completion' | 'embedding' | 'vision' | 'function-calling')[];
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  latencyMs: number;
  qualityScore: number; // 0-100
}

interface ModelGovernanceRule {
  id: string;
  modelId: string;
  status: 'approved' | 'restricted' | 'blocked';
  isDefault: boolean;
  allowedProjects: string[] | 'all';
  maxBudgetPerMonth: number | null;
  requiresApproval: boolean;
  usagePolicy: string;
  addedAt: string;
  addedBy: string;
}

interface UsageStats {
  modelId: string;
  totalRequests: number;
  totalTokensUsed: number;
  totalCost: number;
  averageLatency: number;
  errorRate: number;
  lastUsed: string;
}

const MOCK_PROVIDERS: ModelProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '🤖',
    status: 'active',
    apiKeyConfigured: true,
    models: [
      { id: 'gpt-4-turbo', providerId: 'openai', name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', description: 'Speed optimized', capabilities: ['chat'], contextWindow: 128000, maxOutputTokens: 4096, costPer1kInputTokens: 0.01, costPer1kOutputTokens: 0.03, latencyMs: 450, qualityScore: 95 },
      { id: 'gpt-4o', providerId: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', description: 'Multimodal', capabilities: ['chat', 'vision'], contextWindow: 128000, maxOutputTokens: 4096, costPer1kInputTokens: 0.005, costPer1kOutputTokens: 0.015, latencyMs: 300, qualityScore: 94 },
    ]
  },
];

const MOCK_GOVERNANCE_RULES: ModelGovernanceRule[] = [
  { id: 'rule-1', modelId: 'gpt-4-turbo', status: 'approved', isDefault: true, allowedProjects: 'all', maxBudgetPerMonth: 5000, requiresApproval: false, usagePolicy: 'Standard', addedAt: '2024-01-15', addedBy: 'admin' },
];

const PlatformModelGovernanceWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { state: { user } } = useGlobalState();
  const [activeTab, setActiveTab] = useState<'overview' | 'models' >('overview');
  const [providers] = useState<ModelProvider[]>(MOCK_PROVIDERS);
  const [governanceRules] = useState<ModelGovernanceRule[]>(MOCK_GOVERNANCE_RULES);
  
  // Computed values
  const allModels = providers.flatMap(p => p.models);
  const approvedModels = allModels.filter(m => {
    const rule = governanceRules.find(r => r.modelId === m.id);
    return rule?.status === 'approved';
  });

  useWidgetSync(widgetId, {
    approvedModels: approvedModels.length
  });
  
  return (
    <MatrixWidgetWrapper title="AI Governance">
      <div className="flex flex-col h-full gap-4">
        
        {/* Stats Header */}
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 border border-white/10 p-2 rounded-lg text-center">
                <div className="text-[10px] text-gray-400 uppercase">Approved Models</div>
                <div className="text-lg font-bold text-green-400">{approvedModels.length}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-2 rounded-lg text-center">
                <div className="text-[10px] text-gray-400 uppercase">Monthly Spend</div>
                <div className="text-lg font-bold text-white">$452</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-2 rounded-lg text-center">
                <div className="text-[10px] text-gray-400 uppercase">Budget Cap</div>
                <div className="text-lg font-bold text-blue-400">$5000</div>
            </div>
        </div>

        {/* Model List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Active Policies</h4>
            {allModels.map(model => {
                const rule = governanceRules.find(r => r.modelId === model.id);
                const statusColor = rule?.status === 'approved' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10';
                
                return (
                    <div key={model.id} className="p-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl transition-all">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{providers.find(p => p.id === model.providerId)?.logo}</span>
                                <div>
                                    <div className="text-xs font-bold text-white">{model.displayName}</div>
                                    <div className="text-[10px] text-gray-500">{model.id}</div>
                                </div>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border ${statusColor}`}>
                                {rule?.status || 'Unknown'}
                            </span>
                        </div>
                        <div className="flex gap-4 mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-400">
                            <span>${model.costPer1kInputTokens} / 1k in</span>
                            <span>${model.costPer1kOutputTokens} / 1k out</span>
                            <span>Max: {model.maxOutputTokens} tokens</span>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </MatrixWidgetWrapper>
  );
};

export default PlatformModelGovernanceWidget;
