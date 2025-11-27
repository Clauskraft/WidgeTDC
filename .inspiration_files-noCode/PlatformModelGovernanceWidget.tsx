/**
 * PlatformModelGovernanceWidget.tsx
 * 
 * Central styring af AI modeller for hele platformen:
 * - Definér hvilke modeller der er tilgængelige
 * - Sæt platform-wide defaults der nedarves
 * - Tillad override på projekt/capability niveau
 * - Cost budgetter og usage tracking
 * - Compliance og audit logging
 * 
 * @version 1.0.0
 * @author WidgeTDC Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { Button } from '../components/ui/Button';

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

interface ProjectOverride {
  projectId: string;
  projectName: string;
  allowedModels: string[];
  defaultModelId: string | null;
  budgetLimit: number | null;
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

// ============================================================================
// MOCK DATA (Replace with UnifiedDataService)
// ============================================================================

const MOCK_PROVIDERS: ModelProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '🤖',
    status: 'active',
    apiKeyConfigured: true,
    models: [
      { id: 'gpt-4-turbo', providerId: 'openai', name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', description: 'Most capable GPT-4 model, optimized for speed', capabilities: ['chat', 'completion', 'vision', 'function-calling'], contextWindow: 128000, maxOutputTokens: 4096, costPer1kInputTokens: 0.01, costPer1kOutputTokens: 0.03, latencyMs: 450, qualityScore: 95 },
      { id: 'gpt-4o', providerId: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', description: 'Multimodal model with vision and audio', capabilities: ['chat', 'completion', 'vision', 'function-calling'], contextWindow: 128000, maxOutputTokens: 4096, costPer1kInputTokens: 0.005, costPer1kOutputTokens: 0.015, latencyMs: 300, qualityScore: 94 },
      { id: 'gpt-4o-mini', providerId: 'openai', name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', description: 'Affordable small model for fast tasks', capabilities: ['chat', 'completion', 'vision', 'function-calling'], contextWindow: 128000, maxOutputTokens: 16384, costPer1kInputTokens: 0.00015, costPer1kOutputTokens: 0.0006, latencyMs: 150, qualityScore: 82 },
      { id: 'gpt-3.5-turbo', providerId: 'openai', name: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', description: 'Fast and cost-effective for simple tasks', capabilities: ['chat', 'completion', 'function-calling'], contextWindow: 16385, maxOutputTokens: 4096, costPer1kInputTokens: 0.0005, costPer1kOutputTokens: 0.0015, latencyMs: 200, qualityScore: 78 },
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '🧠',
    status: 'active',
    apiKeyConfigured: true,
    models: [
      { id: 'claude-3-5-sonnet', providerId: 'anthropic', name: 'claude-3-5-sonnet-latest', displayName: 'Claude 3.5 Sonnet', description: 'Best balance of intelligence and speed', capabilities: ['chat', 'completion', 'vision', 'function-calling'], contextWindow: 200000, maxOutputTokens: 8192, costPer1kInputTokens: 0.003, costPer1kOutputTokens: 0.015, latencyMs: 350, qualityScore: 96 },
      { id: 'claude-3-haiku', providerId: 'anthropic', name: 'claude-3-haiku', displayName: 'Claude 3 Haiku', description: 'Fastest, most compact model', capabilities: ['chat', 'completion', 'vision'], contextWindow: 200000, maxOutputTokens: 4096, costPer1kInputTokens: 0.00025, costPer1kOutputTokens: 0.00125, latencyMs: 150, qualityScore: 80 },
      { id: 'claude-3-opus', providerId: 'anthropic', name: 'claude-3-opus', displayName: 'Claude 3 Opus', description: 'Most powerful for complex tasks', capabilities: ['chat', 'completion', 'vision', 'function-calling'], contextWindow: 200000, maxOutputTokens: 4096, costPer1kInputTokens: 0.015, costPer1kOutputTokens: 0.075, latencyMs: 600, qualityScore: 98 },
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    logo: '🌀',
    status: 'active',
    apiKeyConfigured: true,
    models: [
      { id: 'mistral-large', providerId: 'mistral', name: 'mistral-large-latest', displayName: 'Mistral Large', description: 'Top-tier reasoning capabilities', capabilities: ['chat', 'completion', 'function-calling'], contextWindow: 128000, maxOutputTokens: 4096, costPer1kInputTokens: 0.002, costPer1kOutputTokens: 0.006, latencyMs: 280, qualityScore: 88 },
      { id: 'mistral-small', providerId: 'mistral', name: 'mistral-small-latest', displayName: 'Mistral Small', description: 'Cost-efficient for simple tasks', capabilities: ['chat', 'completion'], contextWindow: 32000, maxOutputTokens: 4096, costPer1kInputTokens: 0.0002, costPer1kOutputTokens: 0.0006, latencyMs: 150, qualityScore: 75 },
    ]
  },
  {
    id: 'meta',
    name: 'Meta (Llama)',
    logo: '🦙',
    status: 'pending',
    apiKeyConfigured: false,
    models: [
      { id: 'llama-3-70b', providerId: 'meta', name: 'llama-3-70b', displayName: 'Llama 3 70B', description: 'Open-source large model', capabilities: ['chat', 'completion'], contextWindow: 8192, maxOutputTokens: 2048, costPer1kInputTokens: 0.0007, costPer1kOutputTokens: 0.0009, latencyMs: 300, qualityScore: 85 },
    ]
  }
];

const MOCK_GOVERNANCE_RULES: ModelGovernanceRule[] = [
  { id: 'rule-1', modelId: 'gpt-4-turbo', status: 'approved', isDefault: true, allowedProjects: 'all', maxBudgetPerMonth: 5000, requiresApproval: false, usagePolicy: 'Standard brugsregler gælder', addedAt: '2024-01-15', addedBy: 'admin@company.dk' },
  { id: 'rule-2', modelId: 'gpt-4o', status: 'approved', isDefault: false, allowedProjects: 'all', maxBudgetPerMonth: 3000, requiresApproval: false, usagePolicy: 'Standard brugsregler gælder', addedAt: '2024-02-01', addedBy: 'admin@company.dk' },
  { id: 'rule-3', modelId: 'gpt-4o-mini', status: 'approved', isDefault: false, allowedProjects: 'all', maxBudgetPerMonth: null, requiresApproval: false, usagePolicy: 'Ingen begrænsninger', addedAt: '2024-03-01', addedBy: 'admin@company.dk' },
  { id: 'rule-4', modelId: 'claude-3-5-sonnet', status: 'approved', isDefault: false, allowedProjects: 'all', maxBudgetPerMonth: 4000, requiresApproval: false, usagePolicy: 'Standard brugsregler gælder', addedAt: '2024-01-20', addedBy: 'admin@company.dk' },
  { id: 'rule-5', modelId: 'claude-3-opus', status: 'restricted', isDefault: false, allowedProjects: ['proj-1', 'proj-2'], maxBudgetPerMonth: 1000, requiresApproval: true, usagePolicy: 'Kun til komplekse opgaver. Kræver godkendelse.', addedAt: '2024-02-15', addedBy: 'admin@company.dk' },
  { id: 'rule-6', modelId: 'mistral-large', status: 'approved', isDefault: false, allowedProjects: 'all', maxBudgetPerMonth: 2000, requiresApproval: false, usagePolicy: 'Standard brugsregler gælder', addedAt: '2024-03-10', addedBy: 'admin@company.dk' },
  { id: 'rule-7', modelId: 'llama-3-70b', status: 'blocked', isDefault: false, allowedProjects: [], maxBudgetPerMonth: null, requiresApproval: false, usagePolicy: 'Ikke tilgængelig - Provider ikke konfigureret', addedAt: '2024-03-15', addedBy: 'system' },
];

const MOCK_PROJECTS = [
  { id: 'proj-1', name: 'Kundeservice Portal' },
  { id: 'proj-2', name: 'Salgs Automation' },
  { id: 'proj-3', name: 'Intern Support' },
  { id: 'proj-4', name: 'Marketing AI' },
];

const MOCK_PROJECT_OVERRIDES: ProjectOverride[] = [
  { projectId: 'proj-1', projectName: 'Kundeservice Portal', allowedModels: ['gpt-4-turbo', 'gpt-4o', 'claude-3-5-sonnet'], defaultModelId: 'gpt-4-turbo', budgetLimit: 2000 },
  { projectId: 'proj-2', projectName: 'Salgs Automation', allowedModels: ['gpt-4-turbo', 'gpt-4o-mini', 'mistral-large'], defaultModelId: 'gpt-4o-mini', budgetLimit: 1500 },
];

const MOCK_USAGE_STATS: UsageStats[] = [
  { modelId: 'gpt-4-turbo', totalRequests: 45230, totalTokensUsed: 12500000, totalCost: 425.50, averageLatency: 467, errorRate: 0.02, lastUsed: '2024-03-20T14:32:00Z' },
  { modelId: 'gpt-4o', totalRequests: 23450, totalTokensUsed: 8200000, totalCost: 165.20, averageLatency: 312, errorRate: 0.01, lastUsed: '2024-03-20T14:30:00Z' },
  { modelId: 'gpt-4o-mini', totalRequests: 156000, totalTokensUsed: 42000000, totalCost: 28.35, averageLatency: 145, errorRate: 0.005, lastUsed: '2024-03-20T14:35:00Z' },
  { modelId: 'claude-3-5-sonnet', totalRequests: 18900, totalTokensUsed: 9500000, totalCost: 185.00, averageLatency: 358, errorRate: 0.015, lastUsed: '2024-03-20T14:28:00Z' },
  { modelId: 'mistral-large', totalRequests: 8500, totalTokensUsed: 3200000, totalCost: 25.60, averageLatency: 275, errorRate: 0.02, lastUsed: '2024-03-20T12:15:00Z' },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StatusBadge: React.FC<{ status: ModelGovernanceRule['status'] }> = ({ status }) => {
  const config = {
    approved: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', icon: '✓', label: 'Godkendt' },
    restricted: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', icon: '⚠', label: 'Begrænset' },
    blocked: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', icon: '✕', label: 'Blokeret' }
  }[status];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.icon} {config.label}
    </span>
  );
};

const ProviderStatusBadge: React.FC<{ status: ModelProvider['status'] }> = ({ status }) => {
  const config = {
    active: { bg: 'bg-green-500', label: 'Aktiv' },
    inactive: { bg: 'bg-gray-400', label: 'Inaktiv' },
    pending: { bg: 'bg-yellow-500', label: 'Afventer' }
  }[status];
  
  return (
    <span className={`w-2 h-2 rounded-full ${config.bg}`} title={config.label} />
  );
};

const QualityBar: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-blue-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{score}</span>
    </div>
  );
};

const CostDisplay: React.FC<{ amount: number; currency?: string }> = ({ amount, currency = '$' }) => {
  const formatted = amount >= 1000 
    ? `${(amount / 1000).toFixed(1)}k` 
    : amount >= 1 
      ? amount.toFixed(2) 
      : amount.toFixed(4);
  return <span className="font-mono">{currency}{formatted}</span>;
};

// ============================================================================
// MAIN WIDGET COMPONENT
// ============================================================================

const PlatformModelGovernanceWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { state: { user } } = useGlobalState();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'projects' | 'usage' | 'settings'>('overview');
  const [providers, setProviders] = useState<ModelProvider[]>(MOCK_PROVIDERS);
  const [governanceRules, setGovernanceRules] = useState<ModelGovernanceRule[]>(MOCK_GOVERNANCE_RULES);
  const [projectOverrides, setProjectOverrides] = useState<ProjectOverride[]>(MOCK_PROJECT_OVERRIDES);
  const [usageStats, setUsageStats] = useState<UsageStats[]>(MOCK_USAGE_STATS);
  const [selectedModel, setSelectedModel] = useState<ModelDefinition | null>(null);
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set(['openai', 'anthropic']));
  
  // Computed values
  const allModels = providers.flatMap(p => p.models);
  const approvedModels = allModels.filter(m => {
    const rule = governanceRules.find(r => r.modelId === m.id);
    return rule?.status === 'approved';
  });
  const defaultModel = allModels.find(m => governanceRules.find(r => r.modelId === m.id && r.isDefault));
  const totalMonthlyBudget = governanceRules.reduce((sum, r) => sum + (r.maxBudgetPerMonth || 0), 0);
  const totalMonthlySpend = usageStats.reduce((sum, s) => sum + s.totalCost, 0);
  
  // Handlers
  const handleToggleProvider = (providerId: string) => {
    setExpandedProviders(prev => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };
  
  const handleSetDefault = (modelId: string) => {
    setGovernanceRules(prev => prev.map(rule => ({
      ...rule,
      isDefault: rule.modelId === modelId
    })));
  };
  
  const handleUpdateStatus = (modelId: string, status: ModelGovernanceRule['status']) => {
    setGovernanceRules(prev => prev.map(rule => 
      rule.modelId === modelId ? { ...rule, status } : rule
    ));
  };
  
  const handleUpdateBudget = (modelId: string, budget: number | null) => {
    setGovernanceRules(prev => prev.map(rule => 
      rule.modelId === modelId ? { ...rule, maxBudgetPerMonth: budget } : rule
    ));
  };
  
  const handleUpdateProjectOverride = (projectId: string, updates: Partial<ProjectOverride>) => {
    setProjectOverrides(prev => prev.map(override =>
      override.projectId === projectId ? { ...override, ...updates } : override
    ));
  };
  
  const handleAddProjectOverride = (projectId: string) => {
    const project = MOCK_PROJECTS.find(p => p.id === projectId);
    if (!project) return;
    
    setProjectOverrides(prev => [...prev, {
      projectId,
      projectName: project.name,
      allowedModels: approvedModels.map(m => m.id),
      defaultModelId: defaultModel?.id || null,
      budgetLimit: null
    }]);
  };
  
  const handleRemoveProjectOverride = (projectId: string) => {
    setProjectOverrides(prev => prev.filter(o => o.projectId !== projectId));
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="h-full flex flex-col -m-4 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl">
              🏛️
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Platform Model Governance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Central styring af AI modeller og policies
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-gray-900 dark:text-white">{approvedModels.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Godkendte</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600 dark:text-green-400">${totalMonthlySpend.toFixed(0)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">MTD Spend</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600 dark:text-blue-400">${totalMonthlyBudget}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Budget</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 -mb-px">
          {[
            { id: 'overview', label: '📊 Oversigt', icon: '📊' },
            { id: 'models', label: '🤖 Modeller', icon: '🤖' },
            { id: 'projects', label: '📁 Projekter', icon: '📁' },
            { id: 'usage', label: '📈 Forbrug', icon: '📈' },
            { id: 'settings', label: '⚙️ Indstillinger', icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-50 dark:bg-gray-900 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700 border-b-0'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🤖</span>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                    {providers.filter(p => p.status === 'active').length} aktive
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{allModels.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Totale modeller</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">✅</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                    {governanceRules.filter(r => r.status === 'restricted').length} begrænsede
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{approvedModels.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Godkendte modeller</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">💰</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    totalMonthlySpend / totalMonthlyBudget > 0.8
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  }`}>
                    {((totalMonthlySpend / totalMonthlyBudget) * 100).toFixed(0)}% brugt
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalMonthlySpend.toFixed(0)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">af ${totalMonthlyBudget} budget</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🌟</span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{defaultModel?.displayName || 'Ikke sat'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Platform default model</div>
                </div>
              </div>
            </div>
            
            {/* Default Model Highlight */}
            {defaultModel && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{providers.find(p => p.id === defaultModel.providerId)?.logo}</span>
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white">{defaultModel.displayName}</h3>
                      <span className="px-2 py-1 text-xs bg-purple-500 text-white rounded-full">Platform Default</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{defaultModel.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Context:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">{(defaultModel.contextWindow / 1000).toFixed(0)}k tokens</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Latency:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">{defaultModel.latencyMs}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-white">${defaultModel.costPer1kInputTokens}/${defaultModel.costPer1kOutputTokens} per 1k</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Quality:</span>
                        <QualityBar score={defaultModel.qualityScore} />
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setActiveTab('models')}>
                    Skift Default
                  </Button>
                </div>
              </div>
            )}
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">Top Modeller (Denne Måned)</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {usageStats.slice(0, 5).sort((a, b) => b.totalRequests - a.totalRequests).map(stat => {
                    const model = allModels.find(m => m.id === stat.modelId);
                    if (!model) return null;
                    
                    return (
                      <div key={stat.modelId} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{model.displayName}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {providers.find(p => p.id === model.providerId)?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{stat.totalRequests.toLocaleString()} requests</span>
                            <span><CostDisplay amount={stat.totalCost} /></span>
                            <span>{stat.averageLatency}ms avg</span>
                          </div>
                        </div>
                        <div className="w-32">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${(stat.totalRequests / Math.max(...usageStats.map(s => s.totalRequests))) * 100}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400">
                Administrer hvilke modeller der er tilgængelige på platformen
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                  Udvid alle
                </button>
                <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                  Kollaps alle
                </button>
              </div>
            </div>
            
            {providers.map(provider => (
              <div key={provider.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => handleToggleProvider(provider.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.logo}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{provider.name}</span>
                        <ProviderStatusBadge status={provider.status} />
                        {!provider.apiKeyConfigured && (
                          <span className="text-xs text-red-500">API key mangler</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {provider.models.length} modeller • {provider.models.filter(m => governanceRules.find(r => r.modelId === m.id)?.status === 'approved').length} godkendte
                      </span>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedProviders.has(provider.id) ? 'rotate-180' : ''}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {expandedProviders.has(provider.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Model</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Quality</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Cost/1k</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Budget</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Handlinger</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {provider.models.map(model => {
                          const rule = governanceRules.find(r => r.modelId === model.id);
                          
                          return (
                            <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                              <td className="px-4 py-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white">{model.displayName}</span>
                                    {rule?.isDefault && (
                                      <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {model.description}
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {model.capabilities.map(cap => (
                                      <span key={cap} className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                        {cap}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={rule?.status || 'blocked'}
                                  onChange={(e) => handleUpdateStatus(model.id, e.target.value as any)}
                                  className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                                >
                                  <option value="approved">✓ Godkendt</option>
                                  <option value="restricted">⚠ Begrænset</option>
                                  <option value="blocked">✕ Blokeret</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <QualityBar score={model.qualityScore} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs font-mono">
                                  <div><CostDisplay amount={model.costPer1kInputTokens} /> in</div>
                                  <div><CostDisplay amount={model.costPer1kOutputTokens} /> out</div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={rule?.maxBudgetPerMonth || ''}
                                  onChange={(e) => handleUpdateBudget(model.id, e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="Ingen"
                                  className="w-20 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {rule?.status === 'approved' && !rule.isDefault && (
                                    <button
                                      onClick={() => handleSetDefault(model.id)}
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      Sæt som default
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  Projekter nedarver platform defaults, men kan have egne overrides
                </p>
              </div>
            </div>
            
            {/* Platform Defaults Info */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏛️</span>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Platform Defaults</h4>
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                <p>Default model: <strong>{defaultModel?.displayName || 'Ikke sat'}</strong></p>
                <p>Godkendte modeller: <strong>{approvedModels.length}</strong></p>
                <p className="text-xs mt-2 text-purple-600 dark:text-purple-400">
                  Projekter uden overrides bruger automatisk disse indstillinger
                </p>
              </div>
            </div>
            
            {/* Projects List */}
            <div className="space-y-3">
              {MOCK_PROJECTS.map(project => {
                const override = projectOverrides.find(o => o.projectId === project.id);
                const hasOverride = !!override;
                
                return (
                  <div 
                    key={project.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl border ${
                      hasOverride 
                        ? 'border-blue-300 dark:border-blue-700' 
                        : 'border-gray-200 dark:border-gray-700'
                    } overflow-hidden`}
                  >
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📁</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{project.name}</span>
                            {hasOverride ? (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                                Custom
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                Nedarver defaults
                              </span>
                            )}
                          </div>
                          {hasOverride && override && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Default: {allModels.find(m => m.id === override.defaultModelId)?.displayName || 'Platform default'} • 
                              {override.allowedModels.length} modeller • 
                              {override.budgetLimit ? `$${override.budgetLimit} budget` : 'Ingen budget'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasOverride ? (
                          <>
                            <button
                              onClick={() => handleRemoveProjectOverride(project.id)}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline"
                            >
                              Fjern override
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleAddProjectOverride(project.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Tilføj override
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {hasOverride && override && (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                              Projekt Default Model
                            </label>
                            <select
                              value={override.defaultModelId || ''}
                              onChange={(e) => handleUpdateProjectOverride(project.id, { defaultModelId: e.target.value || null })}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                            >
                              <option value="">Brug platform default</option>
                              {override.allowedModels.map(modelId => {
                                const model = allModels.find(m => m.id === modelId);
                                return model ? (
                                  <option key={modelId} value={modelId}>{model.displayName}</option>
                                ) : null;
                              })}
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                              Budget Limit ($/måned)
                            </label>
                            <input
                              type="number"
                              value={override.budgetLimit || ''}
                              onChange={(e) => handleUpdateProjectOverride(project.id, { budgetLimit: e.target.value ? parseInt(e.target.value) : null })}
                              placeholder="Ingen limit"
                              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                              Tilladte Modeller ({override.allowedModels.length})
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {override.allowedModels.slice(0, 3).map(modelId => {
                                const model = allModels.find(m => m.id === modelId);
                                return model ? (
                                  <span key={modelId} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                                    {model.displayName}
                                  </span>
                                ) : null;
                              })}
                              {override.allowedModels.length > 3 && (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                  +{override.allowedModels.length - 3} mere
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">Detaljeret Forbrug</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Model</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Requests</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Tokens</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Avg Latency</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Error Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Sidst Brugt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {usageStats.map(stat => {
                      const model = allModels.find(m => m.id === stat.modelId);
                      const provider = providers.find(p => p.id === model?.providerId);
                      
                      return (
                        <tr key={stat.modelId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{provider?.logo}</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {model?.displayName || stat.modelId}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">
                            {stat.totalRequests.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">
                            {(stat.totalTokensUsed / 1000000).toFixed(1)}M
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-green-600 dark:text-green-400">
                            <CostDisplay amount={stat.totalCost} />
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">
                            {stat.averageLatency}ms
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono text-sm ${
                              stat.errorRate > 0.05 ? 'text-red-500' : stat.errorRate > 0.02 ? 'text-yellow-500' : 'text-green-500'
                            }`}>
                              {(stat.errorRate * 100).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                            {new Date(stat.lastUsed).toLocaleString('da-DK')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                    <tr>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">Total</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                        {usageStats.reduce((sum, s) => sum + s.totalRequests, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                        {(usageStats.reduce((sum, s) => sum + s.totalTokensUsed, 0) / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-green-600 dark:text-green-400">
                        <CostDisplay amount={usageStats.reduce((sum, s) => sum + s.totalCost, 0)} />
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Globale Indstillinger</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-500 rounded" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Kræv godkendelse for nye modeller</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nye modeller fra providers kræver manuel godkendelse</p>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-500 rounded" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Automatisk budget alerts</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Send notifikation ved 80% og 100% af budget</p>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-500 rounded" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Tillad projekt overrides</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Projekter kan vælge andre modeller end platform default</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Audit Log</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Alle ændringer til governance regler logges automatisk
              </p>
              
              <div className="space-y-2">
                {[
                  { action: 'Model godkendt', model: 'GPT-4o Mini', user: 'admin@company.dk', time: '2024-03-20 14:32' },
                  { action: 'Budget ændret', model: 'Claude 3.5 Sonnet', user: 'admin@company.dk', time: '2024-03-19 10:15' },
                  { action: 'Default ændret', model: 'GPT-4 Turbo', user: 'admin@company.dk', time: '2024-03-18 09:00' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{log.action}</span>
                      <span className="text-gray-500 dark:text-gray-400"> – {log.model}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {log.user} • {log.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformModelGovernanceWidget;
