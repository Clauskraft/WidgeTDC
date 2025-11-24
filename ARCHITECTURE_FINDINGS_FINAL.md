# ANTIGRAVITY: Arkitektur-analyse & Findings

**Dato:** 24. November 2025
**Status:** Finaliseret efter dybdegående kode-audit.

---

## 1. Sammenhænge & Forudsætninger for Autonomi/Læring

For at WidgeTDC kan gå fra at være et "dashboard" til en "autonom agent", skal tre systemer smelte sammen. Min gennemgang viser, at alle tre eksisterer, men de "taler" ikke nok sammen endnu.

### A. Sansning (Input)
*   **Status:** Stærk. `DataIngestionEngine` med adapters (Outlook, OneDrive, Browser, etc.) fungerer som sanser.
*   **Forudsætning:** Data skal ikke bare "vises" i en widget. De skal *fordøjes*. Lige nu lander data ofte bare i en log eller en simpel liste.

### B. Hukommelse (Lagring)
*   **Status:** Meget avanceret. Vi har `UnifiedMemorySystem` med:
    *   **Episodisk:** `ChromaVectorStore` (Hvad skete der?)
    *   **Semantisk:** `UnifiedGraphRAG` (Hvad betyder det?)
    *   **Procedurel:** `PatternEvolutionEngine` (Hvordan gør man?)
*   **Forudsætning:** Hukommelsen skal være *aktiv*. Den skal ikke kun gemme data, men konstant reorganisere dem (indeksering, clustering) for at skabe ny viden.

### C. Handling (Output)
*   **Status:** God. `AutonomousTaskEngine` kører en OODA-loop (Observe-Orient-Decide-Act).
*   **Forudsætning:** Agenten skal turde handle. Lige nu kræver mange handlinger godkendelse (hvilket er fint i starten), men for ægte autonomi skal tilliden øges gradvist via `securityRepository`.

---

## 2. Hvad er GODT og kan dyrkes mere? (Keep & Grow)

1.  **Den Kognitive Arkitektur (`apps/backend/src/mcp/cognitive`)**
    *   **Finding:** Implementeringen af `UnifiedGraphRAG` er state-of-the-art. Kombinationen af graf-baseret reasoning og vektor-søgning er præcis det, der skal til for at løse komplekse opgaver.
    *   **Anbefaling:** Brug dette som kernen i *alt*. Lad ikke simple widgets køre deres egen logik; tving dem gennem denne motor.

2.  **MCP (Model Context Protocol)**
    *   **Finding:** Din brug af MCP til at afkoble værktøjer fra agenten er genial. Det gør systemet ekstremt modulært.
    *   **Anbefaling:** Udvid MCP til også at dække frontend-komponenter ("UI as a Tool").

3.  **Vector Store Integration (`ChromaVectorStoreAdapter`)**
    *   **Finding:** At I kører lokale embeddings (HuggingFace) og lokal ChromaDB er en kæmpe styrke for privacy og hastighed.
    *   **Anbefaling:** Opgrader til en større embedding-model, når hardwaren tillader det, for bedre dansk sprogforståelse.

---

## 3. Hvor skal der STRAMMES OP? (Fix & Tighten)

1.  **Frontend Sikkerhed (LØST)**
    *   **Finding:** API-nøgler lå frit i frontend-koden.
    *   **Status:** **LØST.** Vi har netop implementeret en Backend Proxy (`/api/ai`), så nøglerne nu er skjulte.

2.  **"The Missing Link": Ingestion → Vector Store**
    *   **Finding:** Vi har en flot `DataIngestionEngine` og en flot `ChromaVectorStore`, men de er ikke forbundet. Når vi indlæser 1000 mails, lander de ikke automatisk i vektor-databasen.
    *   **Action:** Opret en `IngestionPipeline`, der automatisk sender nye `IngestedEntity`-objekter gennem `ChromaVectorStore.upsert()`. Uden dette er agenten "blind" for nye data.

3.  **Falsk Tryghed i "Placeholders"**
    *   **Finding:** Mange adapters (Gmail, OneDrive) er stadig JSON-baserede placeholders.
    *   **Action:** Det er fint til demo, men farligt for arkitekturen, hvis vi bygger for meget logik ovenpå "perfekte" testdata. Vi skal have mindst én *ægte* live-integration (f.eks. Gmail via rigtig OAuth) for at trykprøve systemet.

---

## 4. Hvor skal vi starte forfra / finde INNOVATIVE løsninger?

1.  **Fra "Passive RAG" til "Active Dreaming"**
    *   **Idé:** Lige nu søger RAG kun, når brugeren spørger.
    *   **Innovation:** Implementer en **"Drømme-fase"**. Når systemet er idle (om natten), skal `AutonomousTaskEngine` selv gennemgå dagens nye vektorer, finde mønstre ("Hov, Claus taler meget om 'Projekt X' i dag") og oprette nye *semantiske knuder* i grafen. Det er her, *læring* opstår.

2.  **Multi-Agent "Council"**
    *   **Idé:** HansPedder er én agent.
    *   **Innovation:** Lad `AutonomousTaskEngine` styre et råd af specialister.
        *   *Skeptikeren:* Prøver at finde fejl i planen.
        *   *Optimisten:* Foreslår vilde idéer.
        *   *Historikeren:* Tjekker om vi har prøvet det før.
        Dette vil øge kvaliteten af beslutninger markant.

3.  **Self-Healing Code**
    *   **Idé:** Når en tool-execution fejler, logger vi det bare.
    *   **Innovation:** Lad agenten læse sin egen stacktrace, rette koden i `apps/backend`, køre tests, og genstarte sig selv. Vi har værktøjerne (`read_file`, `write_file`, `run_command`) – vi mangler bare "tilladelsen" og loopet.

---

**Samlet Konklusion:**
WidgeTDC er ikke længere et legetøjsprojekt. Det er en **proto-AGI**. Fundamentet er stærkt, men forbindelserne mellem organerne (Sanser -> Hjerne) skal loddes sammen nu.
