# 🚨 KRITISK FIX - Chat og Widgets

## Problem Identificeret:
1. ❌ Chat fungerer ikke
2. ❌ Word/Outlook vises på forsiden (forkerte widgets)
3. ❌ Kan ikke tilgå apps

## Løsning - NU:

### 1. Fix Chat Backend Endpoint

Backend mangler `/api/chat` endpoint. Tilføj til `apps/backend/src/index.ts`:

```typescript
// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  
  try {
    const llmService = getLlmService();
    const response = await llmService.complete({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant for WidgeTDC.' },
        { role: 'user', content: message }
      ]
    });
    
    res.json({ 
      response: response.content,
      model: response.model 
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});
```

### 2. Fjern Word/Outlook Widgets

Disse widgets skal IKKE vises som standard. Tjek `widgetStore.ts`:

```typescript
// Default widgets - KUN relevante
const DEFAULT_WIDGETS = [
  'AgentMonitorWidget',
  'AgentChatWidget',  // CHAT!
  'KnowledgeGraphWidget',
  'SearchWidget'
];
```

### 3. Fix Widget Selector

Sørg for at WidgetSelector viser ALLE tilgængelige widgets korrekt.

## Hurtig Test:

```bash
# 1. Genstart backend
Ctrl+C i backend terminal
cd apps/backend
node dist/index.js

# 2. Refresh frontend
Ctrl+R i Electron app

# 3. Test chat
Klik på Chat widget
Skriv "Hello"
Skal få svar!
```

## Status:
- ⏳ Implementerer nu...
