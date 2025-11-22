# 🚀 DeepSeek Quick Start

## Du er KLAR! Her er hvad der er sat op:

✅ DeepSeek SDK installeret
✅ API Key tilføjet til .env
✅ Provider integration klar
✅ Test page lavet

## 📝 Sådan tester du det:

### Option 1: Test Page (Nemmest)

1. **Åbn `apps/widget-board/App.tsx`** og tilføj:

```tsx
import DeepSeekTestPage from './DeepSeekTestPage';

function App() {
  return (
    <div>
      <DeepSeekTestPage />
    </div>
  );
}

export default App;
```

2. **Start dev server:**
```bash
cd apps/widget-board
npm run dev
```

3. **Åbn browser:** http://localhost:5173

4. **Test det!** Skriv noget og klik "Test DeepSeek"

### Option 2: Direkte i Console

```bash
cd apps/widget-board
npm run dev
```

Åbn browser console (F12) og kør:

```javascript
// Import provider
const { getLLMProvider } = await import('./src/utils/llm-provider');

// Test DeepSeek
const provider = getLLMProvider();
const response = await provider.complete({
  model: 'deepseek-chat',
  messages: [{ role: 'user', content: 'Hej DeepSeek!' }]
});

console.log(response.content);
```

## 🎨 Brug i din egen app:

### Simple Example:

```tsx
import { getLLMProvider } from './src/utils/llm-provider';

function MyComponent() {
  const [response, setResponse] = useState('');
  
  const askDeepSeek = async () => {
    const provider = getLLMProvider();
    const result = await provider.complete({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'What is React?' }]
    });
    setResponse(result.content);
  };
  
  return (
    <div>
      <button onClick={askDeepSeek}>Ask DeepSeek</button>
      <p>{response}</p>
    </div>
  );
}
```

### Med Model Selector:

```tsx
import { ModelSelector } from './src/utils/ModelSelector';
import { getLLMProvider } from './src/utils/llm-provider';

function MyApp() {
  const [model, setModel] = useState('deepseek-chat');
  const [response, setResponse] = useState('');
  
  const chat = async (message) => {
    const provider = getLLMProvider();
    const result = await provider.complete({
      model: model,
      messages: [{ role: 'user', content: message }]
    });
    setResponse(result.content);
  };
  
  return (
    <div>
      <ModelSelector
        value={model}
        onChange={(id) => setModel(id)}
      />
      {/* Your chat UI */}
    </div>
  );
}
```

### Komplet Chat App:

```tsx
import { LLMChatDemo } from './src/utils/LLMChatDemo';

function App() {
  return <LLMChatDemo />;
}
```

## 🔧 Troubleshooting

### Problem: "DeepSeek API key not found"

**Fix:**
1. Check at `.env` filen findes
2. Check at `DEEPSEEK_API_KEY=sk-...` er korrekt
3. Genstart dev server efter at have ændret .env

```bash
# Stop server (Ctrl+C)
# Start igen
npm run dev
```

### Problem: Import errors

**Fix:**
```bash
# Installer dependencies igen
npm install

# Eller clean install
rm -rf node_modules package-lock.json
npm install
```

### Problem: TypeScript errors

**Fix:**
```bash
# Check TypeScript
npm run build

# Eller skip type checking for nu
npm run dev -- --no-type-check
```

## 📚 Næste Skridt

1. ✅ Test at DeepSeek virker (brug test page)
2. 📖 Læs `DEEPSEEK_UI_INTEGRATION.md` for komplet guide
3. 🎨 Tilpas `ModelSelector` til dit design
4. 🚀 Integrer i din app!

## 💡 Tips

**DeepSeek er særligt god til:**
- 💻 Code generation og debugging
- 🌍 Multilingual tasks (især kinesisk)
- 💰 Cost-effective alternativ til GPT-4
- 📊 Technical analysis

**Brug det til:**
- Code reviews
- Bug fixing
- Documentation writing
- Technical Q&A
- Refactoring suggestions

## 🎉 Du er i gang!

Din API key er sat op:
```
DEEPSEEK_API_KEY=sk-a3f8e6b48271466b981396dc97fd904a
```

**Kør bare:**
```bash
cd apps/widget-board
npm run dev
```

Og brug test page til at verificere! 🚀

---

**Need help?** Check:
- `DEEPSEEK_INTEGRATION_README.md` - SDK guide
- `DEEPSEEK_UI_INTEGRATION.md` - UI integration
- Browser console (F12) for detailed logs
