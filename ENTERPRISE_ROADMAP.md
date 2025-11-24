# WidgeTDC: Enterprise Roadmap
**Fra Proto-AGI til Enterprise Platform**

Dette dokument beskriver de 5 strategiske skridt, der er nødvendige for at hærde platformen til produktionsbrug i stor skala.

---

## 1. Robust Data Layer (PostgreSQL Migration)

**Nuværende Status:**
- Vi bruger `SQLite` til relationelle data.
- Vi bruger lokal `ChromaDB` til vektorer.
- Vi bruger filsystemet til logs.

**Risiko:**
- SQLite låser ved høj skrive-belastning (concurrency issues).
- Ingen indbygget High Availability (HA) eller automatisk backup.
- Svært at skalere horisontalt.

**Anbefaling:**
1.  **Migrer til PostgreSQL 16+:** Dette bliver den primære "Source of Truth".
2.  **Overvej `pgvector`:** I stedet for at vedligeholde en separat ChromaDB instans, kan vi gemme vektorer direkte i Postgres. Det forenkler arkitekturen markant (ACID-transaktioner på tværs af metadata og vektorer).
3.  **ORM Migration:** Skift fra rå SQL/simple queries til en robust ORM som **Prisma** eller **Drizzle** for typesikkerhed og migrations-håndtering.

---

## 2. Distributed Nervous System (Redis Event Bus)

**Nuværende Status:**
- `EventBus.ts` er en in-memory `EventEmitter`.
- Events lever kun så længe Node-processen kører.

**Risiko:**
- **Data Loss:** Hvis serveren crasher midt i en ingestion, tabes eventet.
- **Ingen Skalering:** Vi kan ikke køre flere backend-instanser, da de ikke deler events.

**Anbefaling:**
1.  **Implementer Redis Streams:** Brug Redis som en persistent event-log.
2.  **Consumer Groups:** Tillad flere "workers" at lytte på samme kø (f.eks. 5 workers til at tygge tunge PDF-filer parallelt).
3.  **Dead Letter Queues:** Hvis en opgave fejler 3 gange, skal den flyttes til en "fejl-kø" til manuel inspektion, i stedet for at forsvinde.

---

## 3. LLM Ops & Observability (OpenTelemetry)

**Nuværende Status:**
- Vi logger til `console.log`.
- Vi ved ikke, hvor lang tid hvert trin i en "Chain of Thought" tager.
- Vi har ingen historik over token-forbrug pr. bruger/agent.

**Anbefaling:**
1.  **OpenTelemetry (OTEL):** Instrumenter koden til at sende traces. Vi skal kunne se en "Flame Graph" over en RAG-forespørgsel:
    *   *Total tid: 2.5s*
    *   *-> Embedding: 0.1s*
    *   *-> Vector Search: 0.4s*
    *   *-> LLM Generation: 2.0s*
2.  **LangFuse / LangSmith:** Integrer et dedikeret LLM-monitoreringsværktøj. Det giver mulighed for at "replaye" fejlslagne chats og rette prompts.
3.  **Golden Datasets:** Opret et sæt af 100 spørgsmål/svar par, som vi kører automatisk hver gang vi ændrer koden, for at sikre at "intelligensen" ikke falder (Regression Testing for AI).

---

## 4. Zero-Trust Security & RBAC

**Nuværende Status:**
- API-nøgler er nu sikret (Proxy).
- Men intern logik antager ofte `userId: 'system'`.
- Ingen granulær adgangskontrol (hvis du har adgang, kan du se alt).

**Anbefaling:**
1.  **Identity Provider (IdP):** Integrer Auth0, Clerk eller Azure AD. Stop med at håndtere brugere selv.
2.  **Row Level Security (RLS):** Hvis vi bruger Postgres, slå RLS til. Det sikrer, at selvom en udvikler laver en fejl i en SQL-query, kan databasen fysisk ikke returnere data fra en anden 'Tenant'.
3.  **Audit Logs:** Alt hvad agenten gør (læser en fil, sletter en note) skal logges i en uforanderlig Audit Log tabel ("Hvem gjorde hvad, hvornår?").

---

## 5. Human-in-the-Loop Governance

**Nuværende Status:**
- `AutonomousTaskEngine` kører bare.
- Den "tør" ikke gøre farlige ting endnu, fordi vi ikke har kodet det.

**Anbefaling:**
1.  **Approval Workflow:** Indfør en ny task-status: `WAITING_FOR_APPROVAL`.
2.  **Risk Classification:** Klassificer værktøjer:
    *   *Læsning (Safe):* Kør bare.
    *   *Skrivning (Medium):* Kræver logning.
    *   *Sletning/Send (High):* Kræver menneskelig godkendelse.
3.  **Kill Switch:** En fysisk/digital knap i Dashboardet, der øjeblikkeligt pauser alle autonome loops, hvis agenten begynder at opføre sig uhensigtsmæssigt.

---

**Konklusion:**
WidgeTDC har potentialet. Koden er modulær nok til at disse komponenter kan udskiftes en efter en. Start med **Database** og **Events** – det er fundamentet for alt andet.
