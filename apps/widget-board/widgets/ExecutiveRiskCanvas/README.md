# Executive Risk Canvas

## Din Styringsflade for Risiko og P&L

Executive Risk Canvas er et **SVP-level dashboard** designet til at give et 30-sekunders overblik over forretnings- og regulatorisk risiko. Fokus ligger på den visuelle klynge af **Hændelse**, **Aftale** og **Beslutning** for kritiske kunder.

---

## 🎯 Koncept: Zoom & Pan for Porteføljestyring

Lærredet er designet til at understøtte to primære synsvinkler:

### **Strategisk Portefølje (Udzoomet)**
- Vis 10-20 risikoklynger (fx 'Top 10 NIS2-kritiske kunder')
- Panorer mellem NIS2-hjørnet og Cloud-portefølje-hjørnet
- Overblik over hele risikoporteføljen

### **Taktisk Krise (Indzoomet)**
- Fokus på én specifik 'case-cluster'
- Detaljerne om kundens økonomi og kontraktuelle forpligtelser er synlige
- Forberedt til præsentation for CEO/bestyrelsen

---

## 📦 Filstruktur

```
ExecutiveRiskCanvas/
├── index.tsx              # Hovedkomponent med zoom/pan canvas
├── types.ts               # TypeScript type definitions
├── canvasStore.ts         # Zustand state management
├── defaultConfig.ts       # Pre-konfigureret Region X scenarie
├── ClusterNodeCard.tsx    # Widget-kort med drag & embed
├── ConnectionLines.tsx    # SVG forbindelseslinjer
├── Minimap.tsx            # Navigator minimap
├── ExecutiveSummaryPanel.tsx # Executive summary metrics
└── README.md              # Denne fil
```

---

## 🔧 De Tre Sammenhængende Widgets

### 1. **Threat Hunt: Region X · FIN-DB Lateral Movement**

| Field | Value |
|-------|-------|
| Header Badge | Kritisk kunde · NIS2 |
| Risk Score | 91 |
| ARR Exposure | 24.5 mio DKK |
| Graph Nodes | FIN-DB-02, Admin-konto, SOC as a Service |

### 2. **Contract View: Rammeaftale – Region X**

| Field | Value |
|-------|-------|
| Header Badge | DPA, NIS2 Annex, Cloud Residency |
| ARR Value | 24.5 mio DKK |
| Key Clause | "Ingen behandling udenfor EU/EØS..." |
| Frameworks | DPA ✅, NIS2 ⚠️, Cloud Residency ✅ |

### 3. **Decision: Region X – Incident 4711 (SVP Ansvar)**

| Field | Value |
|-------|-------|
| Owner | SVP AI Cloud & Cyber |
| Status | Pending board confirmation |
| ARR at Risk | 24.5 mio DKK |
| Potential Penalty | 5 mio DKK |

**Actions:**
1. ⏳ Skift til 100% lokal model for Region X-data
2. ⏳ Varsl DPA og Region X inden kl. 14:00
3. ✅ Freeze udrulning af ny feature

---

## 🔗 Forbindelseslinjer: Argumentationskæden

De visuelle linjer understøtter din forklaring over for ledelsen:

### Kæde: NIS2 Krise

```
┌─────────────┐     "Hændelsen ligger under      ┌─────────────┐
│ Threat Hunt │─────────denne aftale─────────────▶│  Contract   │
│  (Region X) │                                   │   View      │
└──────┬──────┘                                   └──────┬──────┘
       │                                                 │
       │ "Beslutning afledt                             │
       │  af hændelsen"                                 │ "Kontraktuelle
       │                                                │  forpligtelser"
       ▼                                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Decision Card                             │
│                  (SVP Ansvar)                                │
└─────────────────────────────────────────────────────────────┘
```

### SVP Budskaber (Talking Points)

| Forbindelse | SVP Budskab |
|-------------|-------------|
| Threat → Contract | "Den konkrete aktivitet her er reguleret af præcis den klausul her." |
| Threat → Decision | "Dette er ikke mavefornemmelse – det er en konsekvens af databilledet + kontraktbilledet." |
| Contract → Decision | "Vores handlingsrum er defineret af disse klausuler og den økonomiske eksponering." |

---

## 🎹 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset view |
| `Escape` | Deselect |
| `Ctrl+P` | Toggle Presentation Mode |

---

## 🔌 Integration med Eksisterende Widgets

Executive Risk Canvas embedder automatisk disse widgets:

| Node Type | Embedded Widget |
|-----------|-----------------|
| `threat` | CybersecurityOverwatchWidget |
| `contract` | ProcurementIntelligenceWidget |
| `decision` | CmaDecisionWidget |
| `policy` | SragGovernanceWidget |
| `darkweb` | DarkWebMonitorWidget |

---

## 📊 Executive Summary Metrics

Header-baren viser real-time metrics:

- **Critical Incidents**: Antal kritiske hændelser
- **Pending Decisions**: Afventende beslutninger
- **ARR at Risk**: Total annual recurring revenue i risiko
- **Compliance Score**: Samlet compliance-procent

---

## 🚀 Sådan Bruges Det

```tsx
import ExecutiveRiskCanvasWidget from './widgets/ExecutiveRiskCanvas';

// I din app
<ExecutiveRiskCanvasWidget 
  widgetId="executive-canvas-1"
  config={{
    initialCluster: 'cluster-region-x-nis2',
    presentationMode: false,
  }}
/>
```

---

## 🎨 Persona: SVP med P&L/Risikoejerskab

Designet reflekterer den primære persona:
- Alle dataeksempler bruger virkelige scenarier ('Region X', 'NIS2-kunde', 'Cloud residency')
- Lærredet viser dig den kuraterede 'kunde-cluster' før mødet
- Klar til at blive præsenteret for bestyrelsen

---

## 📝 Tilpasning

### Tilføj Ny Cluster

```typescript
const newCluster: RiskCluster = {
  id: 'cluster-pharma-gdpr',
  name: 'Pharma Corp - GDPR Breach',
  nodes: ['node-1', 'node-2'],
  connections: ['conn-1'],
  centerPosition: { x: 1500, y: 200 },
  severity: 'high',
  owner: 'VP Compliance',
  tags: ['GDPR', 'Pharma'],
};

useCanvasStore.getState().addCluster(newCluster);
```

### Tilføj Ny Connection

```typescript
const newConnection: NodeConnection = {
  id: 'conn-custom',
  sourceId: 'node-threat-rx',
  targetId: 'node-decision-rx',
  connectionType: 'causal',
  label: 'Din label her',
  svpBudskab: 'Dit talking point her',
  style: 'solid',
  color: '#EF4444',
};

useCanvasStore.getState().addConnection(newConnection);
```

---

## 🔄 State Persistence

Canvas state gemmes automatisk i localStorage under nøglen `executive-risk-canvas`.

For at resette til default:
```typescript
useCanvasStore.getState().resetToDefault();
```
