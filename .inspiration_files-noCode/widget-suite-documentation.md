# Corax Widget Suite Documentation

## Oversigt

Dette dokument beskriver to sammenhængende widgets til Corax/WidgeTDC platformen:

1. **ChatCapabilityDesignerV3** - Intuitiv wizard til at oprette chat capabilities
2. **PlatformModelGovernanceWidget** - Central styring af AI modeller for hele platformen

Begge widgets er designet til at arbejde sammen med nedarvning af indstillinger og governance regler.

---

## 1. Chat Capability Designer v3.0

### Formål
Gør det nemt for slutbrugere at oprette AI chat assistenter uden teknisk viden.

### Nøglefeatures

#### 🎯 Use-Case Baseret Tilgang
I stedet for at starte med tomme felter, vælger brugeren først *hvad* de vil bygge:

| Use Case | Beskrivelse | Anbefalet Model | Temperature |
|----------|-------------|-----------------|-------------|
| 🎧 Kundeservice Bot | Hjælp kunder med spørgsmål | GPT-4 Turbo | 0.3 |
| 💼 Salgsassistent | Kvalificer leads | GPT-4 Turbo | 0.5 |
| ✍️ Indholdsproducent | Skriv tekster | GPT-4 Turbo | 0.7 |
| 📊 Data Analytiker | Analyser data | Claude 3 Sonnet | 0.2 |
| 🔧 Teknisk Support | Løs problemer | GPT-3.5 Turbo | 0.3 |
| 🎨 Brugerdefineret | Start fra bunden | GPT-4 Turbo | 0.5 |

#### 🌍 Multi-Language Support
- Dansk (DA) og Engelsk (EN) templates
- Sprog vælges i header
- System prompts oversættes automatisk

#### 🔌 UnifiedDataService Integration
```typescript
// Eksempel på integration
const { data } = useUnifiedData();

// Hent modeller fra central governance
const deployments = await data.ask("List model deployments");

// Hent tilgængelige projekter
const projects = await data.ask("List projects");
```

#### 🧠 Cognitive Memory Integration
```typescript
// Gem brugerens præferencer
await memory.recordPreference('defaultModel', selectedModel);
await memory.recordPreference('preferredLanguage', 'da');
await memory.recordPreference('recentTemplates', ['customer-service', 'sales']);

// Hent præferencer
const favorites = memory.getPreference('favoriteModels');
```

#### 📊 Configuration Health Score
Real-time validering af konfigurationen:

| Komponent | Vægt | Kriterier |
|-----------|------|-----------|
| Navn | 20% | Min. 3 tegn |
| System Prompt | 25% | Min. 50 tegn |
| Model | 20% | Skal være valgt |
| Projekt | 15% | Skal være valgt |
| Temperature | 10% | 0-1 range |
| Template | 10% | Brug af template |

#### 💰 Cost Estimation
- Beregner pris per samtale
- Månedlig estimat (1000 samtaler/dag)
- Sammenligning med billigere alternativer

### Wizard Steps

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: USE CASE          Step 2: CONFIGURE                    │
│  ┌─────────┐ ┌─────────┐   ┌─────────────────────────────────┐  │
│  │🎧 Kunde │ │💼 Salg  │   │ Navn: _______________________  │  │
│  │ service │ │assistant│   │ Projekt: [Dropdown]            │  │
│  └─────────┘ └─────────┘   │ Model: [Radio buttons]         │  │
│  ┌─────────┐ ┌─────────┐   │ System Prompt: [Textarea]      │  │
│  │✍️ Content│ │📊 Data │   │ Temperature: [Slider 0-1]      │  │
│  │ writer  │ │analyst  │   └─────────────────────────────────┘  │
│  └─────────┘ └─────────┘                                        │
├─────────────────────────────────────────────────────────────────┤
│  Step 3: TEST              Step 4: REVIEW & SAVE               │
│  ┌─────────────────────┐   ┌─────────────────────────────────┐  │
│  │ 💬 Live Chat Test   │   │ ✅ Navn: Kundeservice Bot      │  │
│  │                     │   │ ✅ Model: GPT-4 Turbo          │  │
│  │ User: Hej!          │   │ ✅ Health Score: 95%           │  │
│  │ Bot: Hej! Hvordan...│   │ 💰 Est. cost: $125/måned       │  │
│  │                     │   │                                 │  │
│  │ [Input field]       │   │ [Gem Capability]               │  │
│  └─────────────────────┘   └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Platform Model Governance Widget v1.0

### Formål
Central administration af hvilke AI modeller der er tilgængelige på platformen, med budget-kontrol og projekt-overrides.

### Nøglefeatures

#### 🏛️ Central Model Governance
- Definér hvilke modeller der er **godkendte**, **begrænsede** eller **blokerede**
- Sæt én model som **platform default** - alle nye capabilities bruger denne
- Budget limits per model

#### 📁 Projekt Overrides
Projekter nedarver platform defaults, men kan have egne indstillinger:

```
Platform Level (Default)
├── Default Model: GPT-4 Turbo
├── Approved: GPT-4 Turbo, GPT-4o, Claude 3.5 Sonnet, Mistral Large
├── Restricted: Claude 3 Opus (kræver godkendelse)
└── Budget: $15,000/måned total

Project: "Kundeservice Portal" (Override)
├── Default Model: GPT-4 Turbo ← nedarvet
├── Allowed: GPT-4 Turbo, GPT-4o, Claude 3.5 Sonnet ← subset
└── Budget: $2,000/måned ← custom limit

Project: "Salgs Automation" (Override)  
├── Default Model: GPT-4o Mini ← custom
├── Allowed: GPT-4 Turbo, GPT-4o Mini, Mistral Large ← custom
└── Budget: $1,500/måned ← custom limit

Project: "Intern Support" (No Override)
├── Default Model: GPT-4 Turbo ← nedarvet fra platform
├── Allowed: Alle godkendte ← nedarvet
└── Budget: Platform budget ← nedarvet
```

#### 📊 Usage Tracking
- Total requests per model
- Token forbrug
- Faktisk cost
- Gennemsnitlig latency
- Fejlrate

#### 🔐 Audit Logging
Alle ændringer til governance regler logges:
- Hvem ændrede
- Hvad blev ændret
- Hvornår

### Tabs

| Tab | Indhold |
|-----|---------|
| 📊 Oversigt | KPI'er, default model, top modeller |
| 🤖 Modeller | Alle providers og modeller med status |
| 📁 Projekter | Override konfiguration per projekt |
| 📈 Forbrug | Detaljeret usage statistik |
| ⚙️ Indstillinger | Globale governance regler |

---

## 3. Integration Mellem Widgets

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  PLATFORM MODEL GOVERNANCE                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Platform Default: GPT-4 Turbo                              │ │
│  │ Approved Models: [GPT-4 Turbo, GPT-4o, Claude 3.5...]     │ │
│  │ Budget: $15,000/month                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼ nedarves                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Project Override: Kundeservice Portal                      │ │
│  │ Allowed: [GPT-4 Turbo, GPT-4o, Claude 3.5]                │ │
│  │ Budget: $2,000/month                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼ bruges af
┌─────────────────────────────────────────────────────────────────┐
│                  CHAT CAPABILITY DESIGNER                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Step 2: Model Selection                                    │ │
│  │                                                            │ │
│  │ ○ GPT-4 Turbo    [Default] ✓ Available                    │ │
│  │ ○ GPT-4o                   ✓ Available                    │ │
│  │ ○ Claude 3.5 Sonnet        ✓ Available                    │ │
│  │ ○ GPT-4o Mini              ✕ Ikke tilladt i dette projekt │ │
│  │ ○ Claude 3 Opus            ⚠ Kræver godkendelse           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```typescript
// Chat Capability Designer henter governance rules
const deployments = await data.ask("List model deployments for project");

// Returnerer kun modeller der er:
// 1. Godkendt på platform niveau
// 2. Tilladt i det valgte projekt (hvis override findes)
// 3. Inden for budget

// Model objektet inkluderer governance info:
interface ModelDeployment {
  id: string;
  name: string;
  isApproved: boolean;   // Fra platform governance
  isDefault: boolean;    // Platform eller projekt default
  status: 'available' | 'degraded' | 'unavailable';
  // ... andre felter
}
```

---

## 4. Implementering

### Fil Struktur
```
apps/widget-board/widgets/
├── ChatCapabilityDesignerV3.tsx       # Use-case baseret designer
├── PlatformModelGovernanceWidget.tsx  # Central governance
└── shared/
    ├── hooks/
    │   ├── useUnifiedData.ts          # Data service hook
    │   └── useCognitiveMemory.ts      # Memory hook
    └── types/
        └── governance.ts              # Delte typer
```

### Delte Typer

```typescript
// governance.ts
export interface ModelDeployment {
  id: string;
  name: string;
  provider: string;
  status: 'available' | 'degraded' | 'unavailable';
  speedMs: number;
  qualityScore: number;
  costPer1kTokens: number;
  isApproved: boolean;
  isDefault: boolean;
}

export interface ModelGovernanceRule {
  id: string;
  modelId: string;
  status: 'approved' | 'restricted' | 'blocked';
  isDefault: boolean;
  allowedProjects: string[] | 'all';
  maxBudgetPerMonth: number | null;
  requiresApproval: boolean;
  usagePolicy: string;
}

export interface ProjectOverride {
  projectId: string;
  projectName: string;
  allowedModels: string[];
  defaultModelId: string | null;
  budgetLimit: number | null;
}
```

---

## 5. Næste Skridt

### Phase 1: Core Implementation
- [x] Chat Capability Designer v3 med use-cases
- [x] Platform Model Governance widget
- [ ] Forbind til rigtig UnifiedDataService
- [ ] Forbind til rigtig Cognitive Memory

### Phase 2: Integration
- [ ] API endpoints for governance rules
- [ ] Real-time model availability check
- [ ] Budget alerts og notifications

### Phase 3: Advanced Features
- [ ] AI-baseret model anbefaling
- [ ] A/B testing af modeller
- [ ] Cost optimization suggestions
- [ ] Compliance reporting

---

## 6. API Endpoints (Foreslået)

```typescript
// Governance API
GET    /api/governance/models              // Alle modeller med status
GET    /api/governance/models/:id          // Enkelt model
PATCH  /api/governance/models/:id          // Opdater status/budget
GET    /api/governance/default             // Platform default
PUT    /api/governance/default             // Sæt ny default

// Project Overrides API
GET    /api/governance/projects/:id/override
PUT    /api/governance/projects/:id/override
DELETE /api/governance/projects/:id/override

// Usage API
GET    /api/governance/usage               // Samlet forbrug
GET    /api/governance/usage/:modelId      // Per model
GET    /api/governance/usage/projects/:id  // Per projekt

// Audit API
GET    /api/governance/audit               // Audit log
```

---

## 7. Brugerroller

| Rolle | Kan gøre |
|-------|----------|
| **Platform Admin** | Alt i governance, sæt defaults, godkend modeller |
| **Project Admin** | Sæt project overrides, vælg default for projekt |
| **Capability Creator** | Opret capabilities inden for tilladte modeller |
| **Viewer** | Se capabilities og usage |

---

*Dokumentation version 1.0 - November 2024*
