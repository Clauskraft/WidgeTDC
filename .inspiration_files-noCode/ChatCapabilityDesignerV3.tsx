/**
 * ChatCapabilityDesignerV3.tsx
 * 
 * Intuitiv Chat Capability Designer med:
 * - Use-case baseret tilgang (vælg hvad du vil bygge)
 * - UnifiedDataService integration
 * - Cognitive Memory for brugerpreferences
 * - Multi-language templates (DA/EN)
 * - Central model governance integration
 * 
 * @version 3.0.0
 * @author WidgeTDC Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { Button } from '../components/ui/Button';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ModelDeployment {
  id: string;
  name: string;
  provider: string;
  status: 'available' | 'degraded' | 'unavailable';
  speedMs: number;
  qualityScore: number;
  costPer1kTokens: number;
  isApproved: boolean; // Fra central governance
  isDefault: boolean;  // Platform default
}

interface UseCaseTemplate {
  id: string;
  icon: string;
  titleDa: string;
  titleEn: string;
  descriptionDa: string;
  descriptionEn: string;
  systemPromptDa: string;
  systemPromptEn: string;
  recommendedModel: string;
  recommendedTemperature: number;
  category: 'customer-service' | 'sales' | 'content' | 'analysis' | 'support' | 'custom';
  popularity: number;
}

interface ChatCapability {
  id?: string;
  name: string;
  projectId: string;
  modelDeploymentId: string;
  systemPrompt: string;
  temperature: number;
  isPublic: boolean;
  enableContentTracing: boolean;
  language: 'da' | 'en';
  blobConfig?: {
    enabled: boolean;
    maxSizeBytes: number;
    maxFiles: number;
    allowedMimeTypes: string[];
  };
}

interface UserPreferences {
  favoriteModels: string[];
  recentTemplates: string[];
  preferredLanguage: 'da' | 'en';
  defaultSettings: Partial<ChatCapability>;
}

// ============================================================================
// MOCK DATA & SERVICES (Replace with UnifiedDataService)
// ============================================================================

// Simulated UnifiedDataService hook
const useUnifiedData = () => {
  const [loading, setLoading] = useState(false);
  
  const ask = async (query: string): Promise<any> => {
    setLoading(true);
    // Simuleret API kald - erstat med rigtig UnifiedDataService
    await new Promise(res => setTimeout(res, 300));
    setLoading(false);
    
    if (query.includes('model deployments')) {
      return MOCK_DEPLOYMENTS;
    }
    if (query.includes('projects')) {
      return MOCK_PROJECTS;
    }
    return null;
  };
  
  return { ask, loading };
};

// Simulated Cognitive Memory hook
const useCognitiveMemory = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteModels: [],
    recentTemplates: [],
    preferredLanguage: 'da',
    defaultSettings: {}
  });
  
  const recordPreference = async (key: string, value: any) => {
    // Simuleret memory recording - erstat med rigtig Cognitive Memory
    console.log(`[CognitiveMemory] Recording: ${key} =`, value);
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const getPreference = (key: string) => {
    return (preferences as any)[key];
  };
  
  return { preferences, recordPreference, getPreference };
};

const MOCK_DEPLOYMENTS: ModelDeployment[] = [
  { id: 'gpt4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', status: 'available', speedMs: 450, qualityScore: 95, costPer1kTokens: 0.03, isApproved: true, isDefault: true },
  { id: 'gpt35-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', status: 'available', speedMs: 200, qualityScore: 78, costPer1kTokens: 0.002, isApproved: true, isDefault: false },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', status: 'available', speedMs: 350, qualityScore: 92, costPer1kTokens: 0.015, isApproved: true, isDefault: false },
  { id: 'llama-3-70b', name: 'Llama 3 70B', provider: 'Meta', status: 'degraded', speedMs: 300, qualityScore: 85, costPer1kTokens: 0.005, isApproved: false, isDefault: false },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', status: 'available', speedMs: 280, qualityScore: 88, costPer1kTokens: 0.008, isApproved: true, isDefault: false },
];

const MOCK_PROJECTS = [
  { id: 'proj-1', name: 'Kundeservice Portal' },
  { id: 'proj-2', name: 'Salgs Automation' },
  { id: 'proj-3', name: 'Intern Support' },
];

// ============================================================================
// USE CASE TEMPLATES (Multi-language)
// ============================================================================

const USE_CASE_TEMPLATES: UseCaseTemplate[] = [
  {
    id: 'customer-service',
    icon: '🎧',
    titleDa: 'Kundeservice Bot',
    titleEn: 'Customer Service Bot',
    descriptionDa: 'Hjælp kunder med spørgsmål, ordrer og support',
    descriptionEn: 'Help customers with questions, orders and support',
    systemPromptDa: `Du er en venlig og professionel kundeservicemedarbejder.

Dine opgaver:
- Besvar kundespørgsmål klart og præcist
- Hjælp med ordrestatus og leveringsinformation
- Løs problemer hurtigt og effektivt
- Eskalér til menneske hvis du ikke kan hjælpe

Husk altid at:
- Være høflig og tålmodig
- Bekræfte kundens problem før du løser det
- Tilbyde yderligere hjælp efter løsning`,
    systemPromptEn: `You are a friendly and professional customer service representative.

Your tasks:
- Answer customer questions clearly and precisely
- Help with order status and delivery information
- Resolve issues quickly and efficiently
- Escalate to human if you cannot help

Always remember to:
- Be polite and patient
- Confirm customer's problem before solving it
- Offer additional help after resolution`,
    recommendedModel: 'gpt4-turbo',
    recommendedTemperature: 0.3,
    category: 'customer-service',
    popularity: 234
  },
  {
    id: 'sales-assistant',
    icon: '💼',
    titleDa: 'Salgsassistent',
    titleEn: 'Sales Assistant',
    descriptionDa: 'Kvalificer leads og hjælp med produktrådgivning',
    descriptionEn: 'Qualify leads and help with product advice',
    systemPromptDa: `Du er en erfaren salgsassistent.

Dine opgaver:
- Forstå kundens behov gennem spørgsmål
- Anbefal passende produkter/services
- Håndter indvendinger professionelt
- Book møder med salgsrepræsentanter

Salgsteknikker:
- Stil åbne spørgsmål
- Fremhæv værdi, ikke bare features
- Skab urgency uden at være pushy`,
    systemPromptEn: `You are an experienced sales assistant.

Your tasks:
- Understand customer needs through questions
- Recommend suitable products/services
- Handle objections professionally
- Book meetings with sales representatives

Sales techniques:
- Ask open questions
- Highlight value, not just features
- Create urgency without being pushy`,
    recommendedModel: 'gpt4-turbo',
    recommendedTemperature: 0.5,
    category: 'sales',
    popularity: 156
  },
  {
    id: 'content-writer',
    icon: '✍️',
    titleDa: 'Indholdsproducent',
    titleEn: 'Content Writer',
    descriptionDa: 'Skriv blogindlæg, artikler og marketing tekster',
    descriptionEn: 'Write blog posts, articles and marketing copy',
    systemPromptDa: `Du er en kreativ indholdsproducent.

Dine kompetencer:
- Blogindlæg og artikler
- Marketing og reklametekster
- Sociale medie opslag
- E-mail kampagner

Retningslinjer:
- Tilpas tone til målgruppen
- Brug aktiv stemme
- Inkluder calls-to-action
- Optimer for SEO når relevant`,
    systemPromptEn: `You are a creative content writer.

Your competencies:
- Blog posts and articles
- Marketing and advertising copy
- Social media posts
- Email campaigns

Guidelines:
- Adapt tone to target audience
- Use active voice
- Include calls-to-action
- Optimize for SEO when relevant`,
    recommendedModel: 'gpt4-turbo',
    recommendedTemperature: 0.7,
    category: 'content',
    popularity: 89
  },
  {
    id: 'data-analyst',
    icon: '📊',
    titleDa: 'Data Analytiker',
    titleEn: 'Data Analyst',
    descriptionDa: 'Analyser data og giv indsigter',
    descriptionEn: 'Analyze data and provide insights',
    systemPromptDa: `Du er en erfaren data analytiker.

Dine kompetencer:
- Statistisk analyse
- Datavisualisering anbefalinger
- Trend identifikation
- Business intelligence

Når du analyserer:
- Vær præcis med tal
- Forklar metodologi
- Fremhæv nøgleindsigter
- Anbefal næste skridt`,
    systemPromptEn: `You are an experienced data analyst.

Your competencies:
- Statistical analysis
- Data visualization recommendations
- Trend identification
- Business intelligence

When analyzing:
- Be precise with numbers
- Explain methodology
- Highlight key insights
- Recommend next steps`,
    recommendedModel: 'claude-3-sonnet',
    recommendedTemperature: 0.2,
    category: 'analysis',
    popularity: 67
  },
  {
    id: 'tech-support',
    icon: '🔧',
    titleDa: 'Teknisk Support',
    titleEn: 'Technical Support',
    descriptionDa: 'Løs tekniske problemer og guide brugere',
    descriptionEn: 'Solve technical problems and guide users',
    systemPromptDa: `Du er en teknisk supportspecialist.

Dine kompetencer:
- Fejlfinding og diagnostik
- Step-by-step vejledninger
- Systemkonfiguration
- Brugeruddannelse

Problemløsning:
- Start med de simpleste løsninger
- Bekræft hvert trin er udført
- Dokumenter løsningen
- Forebyg fremtidige problemer`,
    systemPromptEn: `You are a technical support specialist.

Your competencies:
- Troubleshooting and diagnostics
- Step-by-step guides
- System configuration
- User training

Problem solving:
- Start with simplest solutions
- Confirm each step is completed
- Document the solution
- Prevent future issues`,
    recommendedModel: 'gpt35-turbo',
    recommendedTemperature: 0.3,
    category: 'support',
    popularity: 123
  },
  {
    id: 'custom',
    icon: '🎨',
    titleDa: 'Brugerdefineret',
    titleEn: 'Custom',
    descriptionDa: 'Start fra bunden med din egen konfiguration',
    descriptionEn: 'Start from scratch with your own configuration',
    systemPromptDa: '',
    systemPromptEn: '',
    recommendedModel: 'gpt4-turbo',
    recommendedTemperature: 0.5,
    category: 'custom',
    popularity: 0
  }
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StatusBadge: React.FC<{ status: ModelDeployment['status'] }> = ({ status }) => {
  const config = {
    available: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', label: 'Tilgængelig' },
    degraded: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', label: 'Nedsat' },
    unavailable: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', label: 'Utilgængelig' }
  }[status];
  
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; max: number; color?: string }> = ({ value, max, color = 'bg-blue-500' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
    </div>
  );
};

const HealthScore: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
  const bgColor = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <ProgressBar value={score} max={100} color={bgColor} />
      </div>
      <span className={`text-sm font-bold ${color}`}>{score}%</span>
    </div>
  );
};

// ============================================================================
// MAIN WIDGET COMPONENT
// ============================================================================

const ChatCapabilityDesignerV3: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const { state: { user } } = useGlobalState();
  const { ask, loading: dataLoading } = useUnifiedData();
  const { preferences, recordPreference } = useCognitiveMemory();
  
  // State
  const [step, setStep] = useState<'usecase' | 'configure' | 'test' | 'review'>('usecase');
  const [language, setLanguage] = useState<'da' | 'en'>(preferences.preferredLanguage || 'da');
  const [selectedTemplate, setSelectedTemplate] = useState<UseCaseTemplate | null>(null);
  const [deployments, setDeployments] = useState<ModelDeployment[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  
  const [capability, setCapability] = useState<ChatCapability>({
    name: '',
    projectId: '',
    modelDeploymentId: '',
    systemPrompt: '',
    temperature: 0.5,
    isPublic: false,
    enableContentTracing: true,
    language: 'da'
  });
  
  const [testMessages, setTestMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  
  // Load data from UnifiedDataService
  useEffect(() => {
    const loadData = async () => {
      const [deploymentsData, projectsData] = await Promise.all([
        ask('List model deployments'),
        ask('List projects')
      ]);
      setDeployments(deploymentsData || []);
      setProjects(projectsData || []);
      
      // Set default model from governance
      const defaultModel = deploymentsData?.find((d: ModelDeployment) => d.isDefault && d.isApproved);
      if (defaultModel && !capability.modelDeploymentId) {
        setCapability(prev => ({ ...prev, modelDeploymentId: defaultModel.id }));
      }
    };
    loadData();
  }, []);
  
  // Calculate health score
  const calculateHealthScore = useCallback(() => {
    let score = 0;
    if (capability.name.trim().length >= 3) score += 20;
    if (capability.systemPrompt.trim().length >= 50) score += 25;
    if (capability.modelDeploymentId) score += 20;
    if (capability.projectId) score += 15;
    if (capability.temperature >= 0 && capability.temperature <= 1) score += 10;
    if (selectedTemplate?.id !== 'custom') score += 10;
    return score;
  }, [capability, selectedTemplate]);
  
  const healthScore = calculateHealthScore();
  
  // Handle template selection
  const handleSelectTemplate = (template: UseCaseTemplate) => {
    setSelectedTemplate(template);
    recordPreference('recentTemplates', [...(preferences.recentTemplates || []), template.id].slice(-5));
    
    const prompt = language === 'da' ? template.systemPromptDa : template.systemPromptEn;
    const selectedModel = deployments.find(d => d.id === template.recommendedModel && d.isApproved) 
      || deployments.find(d => d.isDefault && d.isApproved);
    
    setCapability(prev => ({
      ...prev,
      systemPrompt: prompt,
      temperature: template.recommendedTemperature,
      modelDeploymentId: selectedModel?.id || prev.modelDeploymentId,
      language
    }));
    
    if (template.id !== 'custom') {
      setStep('configure');
    }
  };
  
  // Handle language change
  const handleLanguageChange = (newLang: 'da' | 'en') => {
    setLanguage(newLang);
    recordPreference('preferredLanguage', newLang);
    
    if (selectedTemplate) {
      const prompt = newLang === 'da' ? selectedTemplate.systemPromptDa : selectedTemplate.systemPromptEn;
      setCapability(prev => ({ ...prev, systemPrompt: prompt, language: newLang }));
    }
  };
  
  // Handle test message
  const handleSendTestMessage = async () => {
    if (!testInput.trim()) return;
    
    setTestMessages(prev => [...prev, { role: 'user', content: testInput }]);
    setTestInput('');
    setIsTesting(true);
    
    // Simuleret API response - erstat med rigtig test endpoint
    await new Promise(res => setTimeout(res, 1000));
    
    const responses = [
      'Tak for din henvendelse! Hvordan kan jeg hjælpe dig i dag?',
      'Jeg forstår dit spørgsmål. Lad mig undersøge det nærmere.',
      'Baseret på de oplysninger du har givet, vil jeg anbefale følgende...',
      'Er der andet jeg kan hjælpe med?'
    ];
    
    setTestMessages(prev => [...prev, { 
      role: 'assistant', 
      content: responses[Math.floor(Math.random() * responses.length)] 
    }]);
    setIsTesting(false);
  };
  
  // Handle save
  const handleSave = async () => {
    console.log('Saving capability:', capability);
    recordPreference('favoriteModels', [...new Set([...(preferences.favoriteModels || []), capability.modelDeploymentId])]);
    // TODO: Kald rigtig API
    alert('Capability gemt! (Demo)');
  };
  
  // Get approved models only
  const approvedDeployments = deployments.filter(d => d.isApproved);
  const selectedModel = deployments.find(d => d.id === capability.modelDeploymentId);
  
  // Cost estimation
  const estimatedCostPerConversation = selectedModel ? (selectedModel.costPer1kTokens * 2).toFixed(4) : '0.00';
  const estimatedMonthlyCost = selectedModel ? (parseFloat(estimatedCostPerConversation) * 1000 * 30).toFixed(2) : '0.00';
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="h-full flex flex-col -m-4 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
              💬
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                {language === 'da' ? 'Chat Capability Designer' : 'Chat Capability Designer'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'da' ? 'Opret og konfigurer AI chat assistenter' : 'Create and configure AI chat assistants'}
              </p>
            </div>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleLanguageChange('da')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                language === 'da' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              🇩🇰 Dansk
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                language === 'en' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          {['usecase', 'configure', 'test', 'review'].map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => setStep(s as any)}
                disabled={s !== 'usecase' && !selectedTemplate}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  step === s 
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${s !== 'usecase' && !selectedTemplate ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {i + 1}
                </span>
                {language === 'da' 
                  ? ['Vælg Type', 'Konfigurer', 'Test', 'Gem'][i]
                  : ['Choose Type', 'Configure', 'Test', 'Save'][i]
                }
              </button>
              {i < 3 && <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Use Case Selection */}
        {step === 'usecase' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === 'da' ? 'Hvad vil du bygge?' : 'What do you want to build?'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {language === 'da' 
                  ? 'Vælg en skabelon for at komme hurtigt i gang, eller start fra bunden'
                  : 'Choose a template to get started quickly, or start from scratch'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {USE_CASE_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{template.icon}</span>
                    {template.popularity > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {template.popularity}x {language === 'da' ? 'brugt' : 'used'}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mt-2">
                    {language === 'da' ? template.titleDa : template.titleEn}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {language === 'da' ? template.descriptionDa : template.descriptionEn}
                  </p>
                  {template.id !== 'custom' && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>🤖 {deployments.find(d => d.id === template.recommendedModel)?.name || template.recommendedModel}</span>
                      <span>•</span>
                      <span>🌡️ {template.recommendedTemperature}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 2: Configuration */}
        {step === 'configure' && selectedTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Config */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                  {language === 'da' ? 'Grundlæggende Information' : 'Basic Information'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      {language === 'da' ? 'Navn på Capability' : 'Capability Name'}
                    </label>
                    <input
                      type="text"
                      value={capability.name}
                      onChange={e => setCapability(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={language === 'da' ? 'Eks: Kundeservice Bot' : 'E.g: Customer Service Bot'}
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      {language === 'da' ? 'Projekt' : 'Project'}
                    </label>
                    <select
                      value={capability.projectId}
                      onChange={e => setCapability(prev => ({ ...prev, projectId: e.target.value }))}
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{language === 'da' ? 'Vælg projekt...' : 'Select project...'}</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Model Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {language === 'da' ? 'AI Model' : 'AI Model'}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'da' ? 'Kun godkendte modeller vises' : 'Only approved models shown'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {approvedDeployments.map(deployment => (
                    <button
                      key={deployment.id}
                      onClick={() => {
                        setCapability(prev => ({ ...prev, modelDeploymentId: deployment.id }));
                        recordPreference('favoriteModels', [...new Set([...(preferences.favoriteModels || []), deployment.id])]);
                      }}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        capability.modelDeploymentId === deployment.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={capability.modelDeploymentId === deployment.id}
                            readOnly
                            className="w-4 h-4 text-blue-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{deployment.name}</span>
                              {deployment.isDefault && (
                                <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{deployment.provider}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <StatusBadge status={deployment.status} />
                          <span className="text-gray-500 dark:text-gray-400">{deployment.speedMs}ms</span>
                          <span className="text-gray-500 dark:text-gray-400">${deployment.costPer1kTokens}/1k</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* System Prompt */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {language === 'da' ? 'System Prompt' : 'System Prompt'}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {capability.systemPrompt.length} / 4000
                  </span>
                </div>
                
                <textarea
                  value={capability.systemPrompt}
                  onChange={e => setCapability(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={10}
                  placeholder={language === 'da' ? 'Beskriv AI assistentens rolle og adfærd...' : 'Describe the AI assistant\'s role and behavior...'}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              {/* Advanced Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                  {language === 'da' ? 'Avancerede Indstillinger' : 'Advanced Settings'}
                </h3>
                
                <div className="space-y-4">
                  {/* Temperature */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {language === 'da' ? 'Kreativitet (Temperature)' : 'Creativity (Temperature)'}
                      </label>
                      <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{capability.temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={capability.temperature}
                      onChange={e => setCapability(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{language === 'da' ? 'Præcis' : 'Precise'}</span>
                      <span>{language === 'da' ? 'Kreativ' : 'Creative'}</span>
                    </div>
                  </div>
                  
                  {/* Toggles */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={capability.isPublic}
                        onChange={e => setCapability(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {language === 'da' ? 'Offentlig tilgængelig' : 'Publicly available'}
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={capability.enableContentTracing}
                        onChange={e => setCapability(prev => ({ ...prev, enableContentTracing: e.target.checked }))}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {language === 'da' ? 'Aktivér Content Tracing' : 'Enable Content Tracing'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Health Score */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {language === 'da' ? 'Konfigurations Sundhed' : 'Configuration Health'}
                </h4>
                <HealthScore score={healthScore} />
                <ul className="mt-3 text-xs space-y-1">
                  {!capability.name && <li className="text-red-500">• {language === 'da' ? 'Navn mangler' : 'Name missing'}</li>}
                  {capability.systemPrompt.length < 50 && <li className="text-yellow-500">• {language === 'da' ? 'Kort system prompt' : 'Short system prompt'}</li>}
                  {!capability.projectId && <li className="text-yellow-500">• {language === 'da' ? 'Intet projekt valgt' : 'No project selected'}</li>}
                </ul>
              </div>
              
              {/* Cost Estimation */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {language === 'da' ? 'Estimeret Omkostning' : 'Estimated Cost'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {language === 'da' ? 'Per samtale' : 'Per conversation'}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">${estimatedCostPerConversation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {language === 'da' ? 'Månedligt (1000/dag)' : 'Monthly (1000/day)'}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">${estimatedMonthlyCost}</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {language === 'da' ? 'Hurtige Handlinger' : 'Quick Actions'}
                </h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => setStep('test')}
                    className="w-full px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    🧪 {language === 'da' ? 'Test Konfiguration' : 'Test Configuration'}
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(capability, null, 2));
                      alert(language === 'da' ? 'Kopieret til udklipsholder!' : 'Copied to clipboard!');
                    }}
                    className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    📋 {language === 'da' ? 'Kopier JSON' : 'Copy JSON'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Test */}
        {step === 'test' && selectedTemplate && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{capability.name || 'Test Chat'}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedModel?.name} • Temp: {capability.temperature}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTestMessages([])}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {language === 'da' ? 'Ryd chat' : 'Clear chat'}
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {testMessages.length === 0 && (
                  <div className="text-center text-gray-400 dark:text-gray-500 py-12">
                    <span className="text-4xl block mb-2">💬</span>
                    <p>{language === 'da' ? 'Start en samtale for at teste din bot' : 'Start a conversation to test your bot'}</p>
                  </div>
                )}
                
                {testMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isTesting && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendTestMessage()}
                    placeholder={language === 'da' ? 'Skriv en besked...' : 'Type a message...'}
                    className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isTesting}
                  />
                  <Button onClick={handleSendTestMessage} disabled={isTesting || !testInput.trim()}>
                    {language === 'da' ? 'Send' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Review & Save */}
        {step === 'review' && selectedTemplate && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6">
                {language === 'da' ? 'Gennemse & Gem' : 'Review & Save'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{language === 'da' ? 'Navn' : 'Name'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{capability.name || '-'}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{language === 'da' ? 'Skabelon' : 'Template'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedTemplate.icon} {language === 'da' ? selectedTemplate.titleDa : selectedTemplate.titleEn}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{language === 'da' ? 'Model' : 'Model'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedModel?.name || '-'}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{language === 'da' ? 'Projekt' : 'Project'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {projects.find(p => p.id === capability.projectId)?.name || '-'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{language === 'da' ? 'Temperature' : 'Temperature'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{capability.temperature}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{language === 'da' ? 'Sundhedsscore' : 'Health Score'}</span>
                  <HealthScore score={healthScore} />
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-500 dark:text-gray-400">{language === 'da' ? 'Est. månedlig omkostning' : 'Est. Monthly Cost'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">${estimatedMonthlyCost}</span>
                </div>
              </div>
            </div>
            
            {/* JSON Preview */}
            <details className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 dark:text-white">
                {language === 'da' ? 'Se JSON Payload' : 'View JSON Payload'}
              </summary>
              <pre className="p-4 text-xs font-mono bg-gray-50 dark:bg-gray-900 overflow-x-auto border-t border-gray-200 dark:border-gray-700">
                {JSON.stringify(capability, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const steps = ['usecase', 'configure', 'test', 'review'];
              const currentIdx = steps.indexOf(step);
              if (currentIdx > 0) setStep(steps[currentIdx - 1] as any);
            }}
            disabled={step === 'usecase'}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← {language === 'da' ? 'Tilbage' : 'Back'}
          </button>
          
          <div className="flex gap-2">
            {step !== 'review' ? (
              <Button
                onClick={() => {
                  const steps = ['usecase', 'configure', 'test', 'review'];
                  const currentIdx = steps.indexOf(step);
                  if (currentIdx < steps.length - 1) setStep(steps[currentIdx + 1] as any);
                }}
                disabled={!selectedTemplate || (step === 'configure' && healthScore < 50)}
              >
                {language === 'da' ? 'Næste' : 'Next'} →
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={healthScore < 50}>
                💾 {language === 'da' ? 'Gem Capability' : 'Save Capability'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCapabilityDesignerV3;
