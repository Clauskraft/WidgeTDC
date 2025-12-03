# WidgeTDC – Copilot instructions

- Dette repo indeholder: WidgeTDC, en Enterprise AI Platform designet til cybersecurity og OSINT analyse. Det er en "Neural Command Center" med en widget-baseret React frontend og en Node.js backend der integrerer Neo4j, PostgreSQL (pgvector) og AI agents.
- Primær backend: `apps/backend` (TypeScript / Node / Express).
- Primær frontend: `apps/widget-board` (React 19 / Vite / Tailwind v4).
- Neo4j kører i hybrid mode (Docker lokalt / AuraDB prod).

## Sådan validerer du ændringer
- Bootstrap (setup): `npm install` (husk at bruge `--legacy-peer-deps` hvis nødvendigt)
- Build (hele stacken): `npm run build`
- Build (kun backend): `npm run build:backend`
- Build (kun frontend): `npm run build:frontend`
- Test (unit/integration): `npm test` (kører Vitest)
- Lint: `npm run lint`
- Run dev (hele stacken): `npm run dev`

## Kode- og git-regler (summary)
- **Semantiske Commits**: Brug formatet `type(scope): beskrivelse`. F.eks. `feat(backend): implement graph-ingestor v2`. Typer: feat, fix, docs, style, refactor, perf, test, chore.
- **Handover Log**: Større arkitektoniske ændringer eller afsluttede sprints skal dokumenteres i `HANDOVER_LOG.md`.
- **Self-Healing**: Backend-kode skal designes robust. Implementer global error handling, try-catch blokke omkring kritiske operationer, og struktureret logging. Systemet skal kunne "hele" sig selv ved f.eks. database-udfald.
- **Autonomous Mindset**: Tænk som "The Architect". Analyser problemer til bunds, og foreslå løsninger der skalerer og er fremtidssikrede.
