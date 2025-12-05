# InfoVault

**Information Management med Neo4j Graf, AI Parsing og Agent Delegation**

InfoVault er en del af WidgetTDC økosystemet og giver mulighed for at samle, organisere og analysere information med AI-understøttelse og graph-baseret visualisering.

## Features

### 1. 📊 Neo4j Graph Visualization
- Interaktiv canvas-baseret graf visualisering
- Force-directed layout algoritme
- Zoom, pan og node interaktion
- Farvekodning baseret på node type
- Visning af relationer mellem elementer

### 2. ⚡ Quick Capture med AI Parsing
- Indsæt rå tekst, URL'er, emails, noter
- Automatisk type-genkendelse (person, projekt, task, idé, etc.)
- AI-drevet entity extraction (Ollama, Mistral, Gemini, DeepSeek)
- Hashtag-baseret kategorisering
- Konfidensscoring på parse resultater

### 3. 🤖 Agent Delegation
- Route opgaver til specialiserede AI agents
- Claude: Kompleks analyse og reasoning
- Gemini: Web-søgning og multimodal forståelse
- DeepSeek: Kodning og teknisk dokumentation
- CLAK Agent: Lokal automatisering
- Security Agent: Sikkerhedsanalyse

## Installation

```bash
cd apps/infovault
npm install
npm run dev
```

Åbn http://localhost:5173

## Opsætning

### AI Providers
Konfigurer API nøgler i Settings panelet:
- **Ollama**: Ingen nøgle krævet (lokal)
- **Mistral**: MISTRAL_API_KEY
- **Gemini**: GEMINI_API_KEY  
- **DeepSeek**: DEEPSEEK_API_KEY

### WidgetTDC Backend
InfoVault forbinder automatisk til WidgetTDC backend på `localhost:3002` for:
- Neo4j graph operationer
- Agent routing
- WebSocket real-time updates

## Arkitektur

```
src/
├── App.tsx                 # Hovedkomponent
├── components/
│   ├── GraphVisualization.tsx  # Canvas-baseret graf
│   ├── QuickCapture.tsx        # AI-parsing modal
│   └── AgentDelegation.tsx     # Agent routing panel
├── services/
│   ├── multiProviderAI.ts      # Multi-provider AI client
│   └── widgetTDCClient.ts      # Backend integration
└── types.ts                    # TypeScript interfaces
```

## API Integration

### WidgetTDC Endpoints
- `GET /health` - Health check
- `GET /api/neo4j/graph` - Hent graf data
- `POST /api/neo4j/nodes` - Opret node
- `POST /api/agents/tasks` - Route opgave
- `WS /ws` - Real-time updates

## Sikkerhed

InfoVault understøtter sikkerhedsniveauer:
- 🟢 Public
- 🔵 Internal
- 🟠 Confidential
- 🔴 Restricted

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Canvas API (graf)
- WebSocket (real-time)

## License

MIT - Del af WidgetTDC projektet
