# 🔍 Widget Evaluation & Matrix Unification Plan

**Dato:** 2. december 2025
**Status:** Analyse Komplet
**Mål:** Unificering af 40+ widgets i "Matrix" Design Systemet

---

## 1. Nuværende Situation
Vi har en blanding af "Legacy" widgets (standard Tailwind farver, ingen tema-støtte) og nye "Matrix" komponenter.

### Widget Typer
Vi har identificeret 3 hovedkategorier af widgets i `widgets/` mappen:

| Type | Beskrivelse | Eksempler | Strategi |
|------|-------------|-----------|----------|
| **Micro-Widgets** | Enkle displays, ingen state. | `SystemMonitor`, `StatusWidget` | Skal wrappes i standard `MatrixCard`. |
| **Interactive Tools** | Funktionelle værktøjer, intern state. | `AgentChat`, `SearchInterface` | Skal bruge `MatrixTheme` hooks. |
| **Macro-Apps** | Komplekse multi-view applikationer. | `StrategicCockpit`, `ExecutiveRiskCanvas` | Skal have "Maximized Mode" eller dedikeret view. |

---

## 2. "Matrix" Design Systemet (Definition)
For at sikre ensartethed skal alle widgets overholde følgende regler:

1.  **Container:** Må IKKE medbringe egen baggrund. Skal acceptere en parent container eller bruge `Transparent` baggrund.
2.  **Farve Palette:**
    *   **Primær:** `#051e3c` (Deep Navy)
    *   **Accent:** `#00B5CB` (Matrix Cyan)
    *   **Tekst:** `text-gray-100` (Primary), `text-[#00B5CB]` (Highlight)
3.  **Typography:** "Inter" eller system sans-serif.
4.  **Behavior:**
    *   Skal håndtere `resize` events (responsive).
    *   Skal implementere `ErrorBoundary`.
    *   Skal understøtte "Offline Mode" (ingen backend kald ved render).

---

## 3. Evaluerings-Matrix (Sample)

| Widget | Status | Mangler | Action |
|--------|--------|---------|--------|
| `SystemMonitor` | ⚠️ Legacy | Hardcoded grå/hvid farver. Direkte fetch i render. | Omskriv UI til Matrix farver. Flyt data-fetch til hook. |
| `StrategicCockpit` | ✅ Modern | Allerede avanceret, men tjek farve-palette match. | Verificer farvekoder mod `MainLayout`. |
| `HansPedderMonitor` | ❓ Unknown | Skal tjekkes for styling. | Audit og opdater. |
| `AgentChatWidget` | ⚠️ Legacy | Bruger sandsynligvis standard chat UI. | Opdater til "Glass" chat bobler. |

---

## 4. Forslag til Gruppering (The 5 Pillars)
For at rydde op i listen på 40+ widgets, foreslår jeg følgende strukturering i UI'et:

### 🛡️ Ops & Security (The Shield)
*Fokus: Overvågning og Beskyttelse*
- `SystemMonitor`, `NetworkSpy`, `CybersecurityOverwatch`, `DarkWebMonitor`, `SragGovernance`.

### 🧠 Neural Nexus (The Brain)
*Fokus: AI Agenter og Intelligens*
- `AgentChat`, `TheArchitect`, `Visionary`, `EvolutionAgent`, `PersonaCoordinator`.

### 💼 Executive Command (The Bridge)
*Fokus: Strategi og Beslutning*
- `StrategicCockpit`, `ExecutiveRiskCanvas`, `CmaDecision`, `ProcurementIntelligence`.

### 🛠️ Builder's Forge (The Workshop)
*Fokus: Udvikling og Skabelse*
- `AgentBuilder`, `CodeAnalysis`, `NexusTerminal`, `PromptLibrary`.

### 📚 Knowledge Base (The Archive)
*Fokus: Information og Data*
- `LocalWiki`, `IntelligentNotes`, `FeedIngestion`, `SearchInterface`.

---

## 5. Næste Skridt: Implementation
Jeg vil nu implementere følgende "Tools" for at muliggøre denne transformation:

1.  **`MatrixWidgetWrapper`**: En HOC (Higher Order Component) der automatisk giver "Legacy" widgets det korrekte glas-look og error handling.
2.  **`WidgetGroupingConfig`**: En konfigurationsfil der definerer ovenstående 5 søjler, så menuen kan opdeles logisk.
3.  **`ThemeMigration`**: En guide/script til at søge/erstatte gamle Tailwind farver (f.eks. `bg-white`, `text-gray-900`) med Matrix farver (`bg-white/5`, `text-white`).
