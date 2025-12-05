# ANTIGRAVITY: Arkitektur-analyse & Fremtidsvision

**Dato:** 24. November 2025  
**Fokus:** Autonomi, Læring, Skalerbarhed & Innovation

---

## 1. Executive Summary
WidgeTDC ("Antigravity") har udviklet sig fra et dashboard til en **proto-kognitiv arkitektur**. Vi har nu "sanserne" på plads (Data Ingestion Engine) og "kroppen" (WidgetBoard + Backend). 

**Hovedkonklusion:**  
Vi står ved en skillevej. Vi er rigtig gode til at *samle* data og *vise* data. Men vi mangler det **kognitive lag**, der forbinder de to. Lige nu har vi en "hjerne" (UnifiedMemorySystem), der fungerer som et arkivskab, men den burde fungere som et neuralt netværk. For at opnå ægte autonomi skal vi gå fra **Opbevaring** til **Syntese**.

---

## 2. Forudsætninger for Autonomi & Læring
For at systemet ikke bare er en "avanceret lommeregner", men en autonom agent, kræves tre søjler. Her er status på dem:

### A. Sansning (Data Ingestion) - *STATUS: GODT PÅ VEJ*
*   **Hvad vi har:** En solid `DataIngestionEngine` med en fleksibel `DataSourceAdapter` struktur. Vi kan læse filer, browserhistorik, mails og (via placeholders) sky-tjenester.
*   **Mangler:** Realtids-lytning. Lige nu er det "pull"-baseret (vi henter data, når vi beder om det). Autonomi kræver "push" eller kontinuerlig overvågning (streams).

### B. Hukommelse & Syntese (The Brain) - *STATUS: KRITISK MANGLER*
*   **Hvad vi har:** `UnifiedMemorySystem` med koncepter for episodisk og semantisk hukommelse.
*   **Problemet:** Data lander som "døde" rækker i en database eller JSON-filer.
*   **Løsningen:** Vi mangler en **Vector Store (RAG)**. Alt indsamlet data (mails, filer, chats) skal *embeddes* (laves til tal-vektorer), så agenten kan søge på *betydning* og ikke kun *nøgleord*. Uden dette kan agenten ikke "lære" af fortiden, kun slå op i den.

### C. Handling (Actuation) - *STATUS: MIDDEL*
*   **Hvad vi har:** MCP-værktøjer til at skrive filer, køre kommandoer osv.
*   **Mangler:** En **OODA-loop** (Observe, Orient, Decide, Act) der kører i baggrunden. Lige nu handler HansPedder kun, når *du* beder ham om det. Han skal have en "heartbeat"-proces, der selv tjekker: "Er der nye data? Betyder de noget? Skal jeg gøre noget?"

---

## 3. Det Gode: Hvad skal vi dyrke mere? (Keep & Grow)

1.  **MCP (Model Context Protocol) Implementeringen:**
    *   **Hvorfor:** Det er genialt. Det afkobler AI-modellen fra værktøjerne. Det gør, at vi kan skifte "hjernen" (LLM) ud uden at ødelægge "kroppen" (koden).
    *   **Action:** Udvid MCP til *alt*. Selv frontend-widgets bør ideelt set kommunikere via MCP-lignende kontrakter.

2.  **Adapter Pattern i Ingestion Engine:**
    *   **Hvorfor:** Det, at vi kunne tilføje 8 nye datakilder (Twitter, Gmail, etc.) på få minutter, beviser, at arkitekturen er sund.
    *   **Action:** Bevar denne struktur. Gør det muligt for agenten selv at skrive nye adaptere (Self-coding).

3.  **Monorepo Strukturen:**
    *   **Hvorfor:** Opdelingen mellem `apps/backend`, `apps/matrix-frontend` og `packages/shared` sikrer, at vi ikke blander tingene sammen, men stadig kan dele typer.
    *   **Action:** Håndhæv strengere regler for, hvad der må importeres hvor.

---

## 4. Hvor skal der strammes op? (Fix & Tighten)

1.  **Sikkerhed (Critical):**
    *   **Problem:** Vi har API-nøgler (Google GenAI) eksponeret i frontend-widgets.
    *   **Løsning:** **Proxy Server.** Frontend må ALDRIG kalde AI-API'er direkte. Alt skal gå gennem Backenden (`/api/ai/generate`), som holder nøglerne hemmelige. Dette skal fikses NU.

2.  **"Placeholder" Kulturen:**
    *   **Problem:** Vores nye adaptere (OneDrive, Gmail, etc.) læser bare statiske JSON-filer. Det er fint til demo, men ubrugeligt til drift.
    *   **Løsning:** Vi skal implementere rigtig **OAuth2**. Det er besværligt, men nødvendigt. Uden rigtige live-data er systemet dødt.

3.  **Database Valg:**
    *   **Problem:** `sql.js` (SQLite i memory/fil) er fint til start, men hvis vi skal gemme millioner af vektorer og log-linjer, vil det knække.
    *   **Løsning:** Forbered migrering til **PostgreSQL med pgvector** eller en dedikeret vector-db (som ChromaDB eller Qdrant) kørende lokalt i Docker.

---

## 5. Hvor skal vi starte forfra / Innovere? (Re-think)

Her ligger nøglen til det næste niveau af WidgeTDC:

### A. Fra "Database" til "Knowledge Graph"
I stedet for tabeller (`users`, `logs`), skal vi tænke i **Grafer**.
*   *Eksempel:* "Claus" (Node) -> "har sendt" (Edge) -> "Email" (Node) -> "omhandler" (Edge) -> "Projekt X" (Node).
*   **Innovation:** Når data kommer ind, skal en lille LLM analysere det og opdatere en graf-database. Det giver agenten mulighed for at forstå *relationer* ("Hvem kender hvem?", "Hvad påvirker hvad?").

### B. "The Dreaming Phase" (Offline Processing)
Systemet bør ikke kun arbejde, når du ser på det.
*   **Innovation:** Implementer en "Drømme-tilstand". Om natten (eller når systemet er idle) skal den gennemgå dagens logs og data, komprimere dem, opdatere sin langtidshukommelse og "reflektere" over, hvad der gik godt/skidt. Det er her, *læring* sker.

### C. Multi-Agent Orkestrering
Lige nu er HansPedder én stor monolitisk agent.
*   **Innovation:** Split ham op.
    *   **The Librarian:** Ansvarlig KUN for at organisere hukommelse.
    *   **The Watchdog:** Ansvarlig KUN for sikkerhed og system-helbred.
    *   **The Coder:** Ansvarlig for at skrive/rette kode.
    *   **The Director:** (HansPedder) der koordinerer dem.

---

## 6. Konkret Køreplan (Roadmap)

1.  **Fase 1: Oprydning & Sikkerhed (Nu)**
    *   Flyt API-kald til backend (Proxy).
    *   Fjern hardcodede stier, brug config.

2.  **Fase 2: Den Kognitive Motor (Næste uge)**
    *   Implementer en lokal Vector DB (eller brug en simpel in-memory embedding til start).
    *   Forbind `DataIngestionEngine` til denne Vector DB. Nu bliver data søgbart.

3.  **Fase 3: Live Data (Om 2 uger)**
    *   Udskift JSON-adaptere med rigtige API-kald (start med én, f.eks. Gmail).

4.  **Fase 4: Ægte Autonomi (Fremtid)**
    *   Aktiver "Background Loop" der selv tager initiativ baseret på graf-data.

---
*Denne analyse er lagt i roden af projektet for fremtidig reference.*
