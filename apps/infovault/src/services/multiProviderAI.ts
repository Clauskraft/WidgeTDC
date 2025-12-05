import { AIProvider, AIAnalysisResult, ExtractedEntity, ItemType, Priority } from '../types';

interface ProviderConfig {
  endpoint: string;
  model: string;
  apiKeyEnv?: string;
}

const providerConfigs: Record<AIProvider, ProviderConfig> = {
  ollama: {
    endpoint: 'http://localhost:11434/api/generate',
    model: 'llama3.2',
  },
  mistral: {
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    apiKeyEnv: 'MISTRAL_API_KEY',
  },
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    model: 'gemini-2.0-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
};

class MultiProviderAI {
  private apiKeys: Partial<Record<AIProvider, string>> = {};

  constructor() {
    // Load API keys from localStorage
    this.loadApiKeys();
  }

  private loadApiKeys() {
    try {
      const saved = localStorage.getItem('infovault_api_keys');
      if (saved) {
        this.apiKeys = JSON.parse(saved);
      }
    } catch {
      console.warn('Failed to load API keys');
    }
  }

  setApiKey(provider: AIProvider, key: string) {
    this.apiKeys[provider] = key;
    localStorage.setItem('infovault_api_keys', JSON.stringify(this.apiKeys));
  }

  async analyze(content: string, provider: AIProvider): Promise<AIAnalysisResult> {
    const prompt = `Analyze the following content and extract:
1. A brief summary (1-2 sentences)
2. Key entities (people, places, organizations, dates, etc.)
3. Suggested item type (one of: person, project, note, link, document, idea, task, contact)
4. Suggested tags (max 5)
5. Suggested priority (low, medium, high, or critical)
6. Confidence score (0-1)

Content:
${content}

Respond in JSON format:
{
  "summary": "...",
  "entities": [{"type": "...", "value": "...", "confidence": 0.0}],
  "suggestedType": "...",
  "suggestedTags": ["..."],
  "suggestedPriority": "...",
  "confidence": 0.0
}`;

    try {
      const response = await this.callProvider(provider, prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error(`Analysis failed with ${provider}:`, error);
      return this.fallbackAnalysis(content);
    }
  }

  async parseQuickCapture(content: string, provider: AIProvider): Promise<{
    title: string;
    content: string;
    type: ItemType;
    tags: string[];
    priority: Priority;
    entities: ExtractedEntity[];
    confidence: number;
  }> {
    const prompt = `Parse this raw input and extract structured information:

Input:
${content}

Extract:
1. A clear title (max 100 chars)
2. The main content (cleaned up)
3. Item type (one of: person, project, note, link, document, idea, task, contact)
4. Tags (extract hashtags or suggest relevant ones, max 5)
5. Priority (low, medium, high, critical based on urgency indicators)
6. Entities (URLs, emails, names, dates, etc.)

Respond in JSON format only:
{
  "title": "...",
  "content": "...",
  "type": "...",
  "tags": ["..."],
  "priority": "...",
  "entities": [{"type": "...", "value": "...", "confidence": 0.0}],
  "confidence": 0.0
}`;

    try {
      const response = await this.callProvider(provider, prompt);
      const parsed = this.parseJsonResponse(response);
      return {
        title: parsed.title || content.split('\n')[0].substring(0, 100),
        content: parsed.content || content,
        type: this.validateItemType(parsed.type),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
        priority: this.validatePriority(parsed.priority),
        entities: Array.isArray(parsed.entities) ? parsed.entities : [],
        confidence: parsed.confidence || 0.7,
      };
    } catch (error) {
      console.error(`Quick capture parsing failed with ${provider}:`, error);
      return this.fallbackQuickCapture(content);
    }
  }

  private async callProvider(provider: AIProvider, prompt: string): Promise<string> {
    const config = providerConfigs[provider];
    
    if (provider === 'ollama') {
      return this.callOllama(prompt, config);
    }

    const apiKey = this.apiKeys[provider];
    if (!apiKey && config.apiKeyEnv) {
      throw new Error(`API key required for ${provider}`);
    }

    switch (provider) {
      case 'mistral':
        return this.callMistral(prompt, config, apiKey!);
      case 'gemini':
        return this.callGemini(prompt, config, apiKey!);
      case 'deepseek':
        return this.callDeepSeek(prompt, config, apiKey!);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callOllama(prompt: string, config: ProviderConfig): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  private async callMistral(prompt: string, config: ProviderConfig, apiKey: string): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callGemini(prompt: string, config: ProviderConfig, apiKey: string): Promise<string> {
    const url = `${config.endpoint}?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async callDeepSeek(prompt: string, config: ProviderConfig, apiKey: string): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseJsonResponse(response: string): Record<string, unknown> {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                      response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr);
  }

  private parseAnalysisResponse(response: string): AIAnalysisResult {
    try {
      const parsed = this.parseJsonResponse(response);
      return {
        summary: String(parsed.summary || ''),
        entities: Array.isArray(parsed.entities) ? parsed.entities : [],
        suggestedType: this.validateItemType(parsed.suggestedType),
        suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
        suggestedPriority: this.validatePriority(parsed.suggestedPriority),
        confidence: Number(parsed.confidence) || 0.5,
      };
    } catch {
      return this.fallbackAnalysis('');
    }
  }

  private validateItemType(type: unknown): ItemType {
    const validTypes: ItemType[] = ['person', 'project', 'note', 'link', 'document', 'idea', 'task', 'contact'];
    return validTypes.includes(type as ItemType) ? (type as ItemType) : 'note';
  }

  private validatePriority(priority: unknown): Priority {
    const validPriorities: Priority[] = ['low', 'medium', 'high', 'critical'];
    return validPriorities.includes(priority as Priority) ? (priority as Priority) : 'medium';
  }

  private fallbackAnalysis(content: string): AIAnalysisResult {
    // Extract basic entities without AI
    const urls = content.match(/https?:\/\/[^\s]+/g) || [];
    const emails = content.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    const hashTags = content.match(/#\w+/g)?.map(t => t.substring(1)) || [];

    return {
      summary: content.substring(0, 100),
      entities: [
        ...urls.map(u => ({ type: 'url', value: u, confidence: 1 })),
        ...emails.map(e => ({ type: 'email', value: e, confidence: 1 })),
      ],
      suggestedType: 'note',
      suggestedTags: hashTags.slice(0, 5),
      suggestedPriority: 'medium',
      confidence: 0.3,
    };
  }

  private fallbackQuickCapture(content: string): {
    title: string;
    content: string;
    type: ItemType;
    tags: string[];
    priority: Priority;
    entities: ExtractedEntity[];
    confidence: number;
  } {
    const lines = content.split('\n').filter(l => l.trim());
    const urls = content.match(/https?:\/\/[^\s]+/g) || [];
    const emails = content.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    const hashTags = content.match(/#\w+/g)?.map(t => t.substring(1)) || [];

    // Detect type based on content
    let type: ItemType = 'note';
    const lower = content.toLowerCase();
    if (urls.length > 0) type = 'link';
    else if (emails.length > 0) type = 'contact';
    else if (lower.includes('todo:') || lower.includes('task:')) type = 'task';
    else if (lower.includes('idea:') || lower.includes('💡')) type = 'idea';

    return {
      title: lines[0]?.substring(0, 100) || 'Ny note',
      content,
      type,
      tags: hashTags.slice(0, 5),
      priority: 'medium',
      entities: [
        ...urls.map(u => ({ type: 'url', value: u, confidence: 1 })),
        ...emails.map(e => ({ type: 'email', value: e, confidence: 1 })),
      ],
      confidence: 0.4,
    };
  }
}

export const multiProviderAI = new MultiProviderAI();
