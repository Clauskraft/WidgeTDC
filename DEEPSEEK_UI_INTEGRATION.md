# 🌊 DeepSeek UI Integration Guide

## Din Situation

Du har set DeepSeek i en model dropdown (screenshot), men `deepseek-sdk` npm pakken tilf

øjer **ikke automatisk** DeepSeek til din UI. 

**Hvorfor?** `deepseek-sdk` er et **programmatisk bibliotek** - ikke en UI integration.

## ✅ Løsning: Komplet UI Integration

Jeg har lavet en **komplet løsning** der giver dig:

1. ✅ Model Selector UI component (med DeepSeek)
2. ✅ Unified LLM Provider (understøtter alle providers)
3. ✅ Komplet chat demo app
4. ✅ Klar til produktion

## 📁 Filer Oprettet

```
apps/widget-board/src/utils/
├── llm-models.ts              # Model definitions (inkl. DeepSeek)
├── llm-provider.ts            # Unified provider (alle LLMs)
├── ModelSelector.tsx          # UI dropdown component
├── ModelSelector.css          # Styling
├── LLMChatDemo.tsx           # Demo app
├── LLMChatDemo.css           # Demo styling
└── deepseek-integration.tsx  # Basic DeepSeek helpers
```

## 🚀 Quick Start

### 1. Tilføj API Keys

Opdater din `.env` fil:

```env
# Tilføj DeepSeek API key
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# Optional: Andre providers
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-your-anthropic-key
GOOGLE_API_KEY=your-google-key
```

### 2. Brug Model Selector i din App

```tsx
import { ModelSelector } from './src/utils/ModelSelector';
import { getLLMProvider } from './src/utils/llm-provider';

function MyApp() {
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');

  const handleChat = async (userMessage: string) => {
    const provider = getLLMProvider();
    
    const response = await provider.complete({
      model: selectedModel,
      messages: [{ role: 'user', content: userMessage }]
    });
    
    return response.content;
  };

  return (
    <div>
      <ModelSelector
        value={selectedModel}
        onChange={(id) => setSelectedModel(id)}
        onlyConfigured={true}
      />
      {/* Rest of your app */}
    </div>
  );
}
```

### 3. Kør Demo App

```tsx
import { LLMChatDemo } from './src/utils/LLMChatDemo';

function App() {
  return <LLMChatDemo />;
}
```

## 🎨 Tilgængelige Modeller

### OpenAI
- GPT-4 Turbo (`gpt-4o`)
- GPT-3.5 Turbo (`gpt-3.5-turbo`)

### Anthropic
- Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- Claude Sonnet 3.5 Thinking (`claude-sonnet-3-5-20241022`)

### Google
- Gemini 3 Pro High (`gemini-pro`)
- Gemini 3 Pro Low (`gemini-pro-low`)

### DeepSeek ⭐
- **DeepSeek Chat** (`deepseek-chat`)
  - Excellent coding capabilities
  - 64K context window
  - Very cost-effective ($0.27/$1.1 per 1M tokens)
- **DeepSeek Coder** (`deepseek-coder`)
  - Specialized for code generation
  - Code debugging & refactoring

## 📚 API Reference

### ModelSelector Component

```tsx
<ModelSelector
  value={selectedModel}              // Currently selected model ID
  onChange={(id, model) => {...}}    // Callback when model changes
  filterCapability="code"            // Optional: filter by capability
  onlyConfigured={true}              // Only show configured providers
  className="custom-class"           // Optional custom className
/>
```

### UnifiedLLMProvider

```typescript
import { getLLMProvider } from './utils/llm-provider';

const provider = getLLMProvider();

// Complete a chat
const response = await provider.complete({
  model: 'deepseek-chat',
  messages: [
    { role: 'system', content: 'You are helpful' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  maxTokens: 2000
});

// Check which providers are configured
const configured = provider.getConfiguredProviders();
// => ['deepseek', 'openai', ...]

// Check if specific provider is ready
const isReady = provider.isProviderConfigured('deepseek');
// => true/false
```

### LLM Models

```typescript
import { 
  LLM_MODELS,
  getModelById,
  getModelsByProvider,
  getModelsByCapability 
} from './utils/llm-models';

// Get all DeepSeek models
const deepseekModels = getModelsByProvider('deepseek');

// Get all models with code capability
const codeModels = getModelsByCapability('code');

// Get specific model info
const model = getModelById('deepseek-chat');
// => { id, name, provider, contextWindow, pricing, ... }
```

## 🎯 Brug Cases

### 1. Simple Chat

```tsx
import { getLLMProvider } from './utils/llm-provider';

const provider = getLLMProvider();

const response = await provider.complete({
  model: 'deepseek-chat',
  messages: [{ role: 'user', content: 'Explain React hooks' }]
});

console.log(response.content);
```

### 2. Multi-turn Conversation

```tsx
const conversation: ChatMessage[] = [
  { role: 'system', content: 'You are a coding assistant' },
  { role: 'user', content: 'How do I use useState?' }
];

const response1 = await provider.complete({
  model: 'deepseek-chat',
  messages: conversation
});

conversation.push({ role: 'assistant', content: response1.content });
conversation.push({ role: 'user', content: 'Show me an example' });

const response2 = await provider.complete({
  model: 'deepseek-chat',
  messages: conversation
});
```

### 3. Code Generation

```tsx
const response = await provider.complete({
  model: 'deepseek-coder',
  messages: [{
    role: 'user',
    content: 'Write a TypeScript function to debounce a callback'
  }],
  temperature: 0.3, // Lower temperature for code
  maxTokens: 1000
});
```

### 4. Model Comparison

```tsx
const models = ['deepseek-chat', 'gpt-4o', 'claude-sonnet-4-5-20250929'];

const results = await Promise.all(
  models.map(model =>
    provider.complete({
      model,
      messages: [{ role: 'user', content: 'Explain async/await' }]
    })
  )
);

results.forEach((result, i) => {
  console.log(`${models[i]}: ${result.content}`);
});
```

## 🎨 Customization

### Tilføj Custom Models

Edit `llm-models.ts`:

```typescript
export const LLM_MODELS: LLMModel[] = [
  // ... existing models
  {
    id: 'custom-model',
    name: 'My Custom Model',
    provider: 'deepseek',
    description: 'Custom fine-tuned model',
    contextWindow: 32000,
    capabilities: ['chat', 'code']
  }
];
```

### Style Model Selector

Override CSS in `ModelSelector.css`:

```css
.model-selector-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

### Custom Provider

Extend `UnifiedLLMProvider` in `llm-provider.ts`:

```typescript
export class CustomLLMProvider extends UnifiedLLMProvider {
  async completeCustom(options: ChatCompletionOptions) {
    // Your custom implementation
  }
}
```

## 🔧 Troubleshooting

### Problem: Model ikke synlig i dropdown

**Årsag:** API key ikke konfigureret

**Løsning:**
```env
# Tilføj til .env
DEEPSEEK_API_KEY=sk-your-key-here
```

### Problem: "Provider not configured" fejl

**Løsning:**
```typescript
const provider = getLLMProvider();

// Check før brug
if (!provider.isProviderConfigured('deepseek')) {
  console.error('DeepSeek not configured. Add DEEPSEEK_API_KEY to .env');
  return;
}
```

### Problem: TypeScript errors

**Løsning:**
```bash
# Installer types
npm install --save-dev @types/react @types/node

# Rebuild hvis nødvendigt
npm run build
```

## 📊 Performance Tips

### 1. Model Selection

- **DeepSeek Chat**: Best for code + general chat
- **DeepSeek Coder**: Best for pure code generation
- **GPT-4**: Best for complex reasoning
- **Gemini Pro**: Best for large context (1M tokens)

### 2. Temperature Settings

```typescript
// Code generation
temperature: 0.3

// Creative writing
temperature: 0.8

// Balanced
temperature: 0.7
```

### 3. Context Management

```typescript
// Keep conversation under token limit
const MAX_MESSAGES = 20;

if (conversation.length > MAX_MESSAGES) {
  conversation = [
    conversation[0], // Keep system prompt
    ...conversation.slice(-MAX_MESSAGES + 1)
  ];
}
```

## 🚀 Production Checklist

- [ ] API keys i environment variables (ikke hardcoded)
- [ ] Error handling implementeret
- [ ] Rate limiting hvis nødvendigt
- [ ] Loading states i UI
- [ ] Token usage tracking
- [ ] Cost monitoring
- [ ] User feedback for fejl

## 📚 Eksempler

Se `LLMChatDemo.tsx` for komplet working example med:
- Model selection
- Multi-turn chat
- Error handling
- Loading states
- Responsive design

## 🎉 Du er klar!

Du har nu:

1. ✅ Model Selector UI med DeepSeek
2. ✅ Unified provider til alle LLMs
3. ✅ Komplet demo app
4. ✅ Production-ready kode

**Næste skridt:**

1. Tilføj `DEEPSEEK_API_KEY` til `.env`
2. Import `ModelSelector` i din app
3. Brug `getLLMProvider()` til at chatte
4. Enjoy! 🎊

---

**Lavet af Claude** 🤖
Med DeepSeek integration ✅
