// Multi-Provider AI Service for Quick Capture and Analysis
import type { 
  AIProvider, 
  AIProviderConfig, 
  AIAnalysisResult, 
  QuickCaptureResult,
  ItemType 
} from '../types';

const PROVIDER_CONFIGS: Record<AIProvider, AIProviderConfig> = {
  ollama: {
    id: 'ollama',
    name: 'Ollama (Lokal)',
    description: 'Kører lokalt - ingen API nøgle',
    apiKeyRequired: false,
    endpoint: 'http://localhost:11434/api/generate',
    model: 'llama3.2',
    capabilities: ['parsing', 'analysis', 'summarization']
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral (EU)',
    description: 'GDPR-venlig EU hosting',
    apiKeyRequired: true,
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    capabilities: ['parsing', 'analysis', 'summarization', 'classification']
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google søgning og grounding',
    apiKeyRequired: true,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-2.0-flash-exp',
    capabilities: ['parsing', 'analysis', 'search', 'grounding']
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Hurtig og billig',
    apiKeyRequired: true,
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    capabilities: ['parsing', 'analysis', 'code']
  }
};

class AIService {
  private activeProvider: AIProvider = 'ollama';
  private apiKeys: Partial<Record<AIProvider, string>> = {};

  constructor() {
    this.loadApiKeys();
  }

  private loadApiKeys() {
    try {
      const stored = localStorage.getItem('infovault_api_keys');
      if (stored) {
        this.apiKeys = JSON.parse(stored);
      }
    } catch { /* ignore */ }
  }

  setApiKey(provider: AIProvider, key: string) {
    this.apiKeys[provider] = key;
    localStorage.setItem('infovault_api_keys', JSON.stringify(this.apiKeys));
  }

  setActiveProvider(provider: AIProvider) {
    this.activeProvider = provider;
  }

  getActiveProvider(): AIProvider {
    return this.activeProvider;
  }

  getProviderConfig(provider: AIProvider): AIProviderConfig {
    return PROVIDER_CONFIGS[provider];
  }

  getAllProviders(): AIProviderConfig[] {
    return Object.values(PROVIDER_CONFIGS);
  }

  // Quick Capture - Parse raw text into structured data
  async parseQuickCapture(rawText: string): Promise<QuickCaptureResult> {
    const prompt = `Du er en dansk informationsparser. Analyser følgende tekst og udtræk struktureret information.

Tekst:
${rawText}

Returner JSON i dette format:
{
  "title": "Foreslået titel",
  "type": "person|project|note|link|document|idea|task|contact",
  "content": "Renset og formateret indhold",
  "tags": ["tag1", "tag2"],
  "priority": "low|medium|high|critical",
  "entities": [
    {"type": "person|org|date|url|email|phone", "value": "...", "confidence": 0.9}
  ],
  "suggestions": ["Forslag til relaterede emner"]
}

Kun JSON, ingen forklaring.`;

    try {
      const response = await this.callProvider(prompt);
      const parsed = JSON.parse(response);
      
      return {
        raw: rawText,
        parsed: {
          title: parsed.title || rawText.substring(0, 50),
          type: parsed.type as ItemType || 'note',
          content: parsed.content || rawText,
          tags: parsed.tags || [],
          priority: parsed.priority || 'medium',
        },
        entities: parsed.entities || [],
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      console.error('Parse error:', error);
      return {
        raw: rawText,
        parsed: {
          title: rawText.substring(0, 50),
          type: 'note',
          content: rawText,
          tags: [],
          priority: 'medium',
        },
        entities: [],
        suggestions: []
      };
    }
  }

  // Analyze existing item
  async analyzeItem(title: string, content: string): Promise<AIAnalysisResult> {
    const prompt = `Analyser dette element og giv en struktureret vurdering.

Titel: ${title}
Indhold: ${content}

Returner JSON:
{
  "summary": "Kort sammenfatning (max 100 ord)",
  "entities": [{"type": "person|org|concept|technology", "value": "...", "confidence": 0.9}],
  "suggestedType": "person|project|note|link|document|idea|task|contact",
  "suggestedTags": ["tag1", "tag2"],
  "suggestedPriority": "low|medium|high|critical",
  "confidence": 0.85
}`;

    try {
      const response = await this.callProvider(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Analyze error:', error);
      return {
        summary: 'Kunne ikke analysere indhold',
        entities: [],
        suggestedType: 'note',
        suggestedTags: [],
        suggestedPriority: 'medium',
        confidence: 0
      };
    }
  }

  // Call the active provider
  private async callProvider(prompt: string): Promise<string> {
    const provider = this.activeProvider;
    const config = PROVIDER_CONFIGS[provider];
    const apiKey = this.apiKeys[provider];

    if (config.apiKeyRequired && !apiKey) {
      throw new Error(`API nøgle kræves for ${config.name}`);
    }

    switch (provider) {
      case 'ollama':
        return this.callOllama(prompt, config);
      case 'mistral':
        return this.callMistral(prompt, config, apiKey!);
      case 'gemini':
        return this.callGemini(prompt, config, apiKey!);
      case 'deepseek':
        return this.callDeepSeek(prompt, config, apiKey!);
      default:
        throw new Error(`Ukendt provider: ${provider}`);
    }
  }

  private async callOllama(prompt: string, config: AIProviderConfig): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: false,
        format: 'json'
      })
    });
    
    if (!response.ok) throw new Error('Ollama request failed');
    const data = await response.json();
    return data.response;
  }

  private async callMistral(prompt: string, config: AIProviderConfig, apiKey: string): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) throw new Error('Mistral request failed');
    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callGemini(prompt: string, config: AIProviderConfig, apiKey: string): Promise<string> {
    const url = `${config.endpoint}/${config.model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });
    
    if (!response.ok) throw new Error('Gemini request failed');
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async callDeepSeek(prompt: string, config: AIProviderConfig, apiKey: string): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) throw new Error('DeepSeek request failed');
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export const aiService = new AIService();
export default aiService;
