# Copilot Instructions / Instruktioner for Copilot

Dette dokument hjælper Copilot-coding-agent og bidragsydere med hvordan man arbejder i WidgeTDC-repositoriet.

## Project overview
WidgeTDC — GDPR COMPLIANT enterprise widget platform (TypeScript, React, Node). Dette repo indeholder platform-arkitektur, widget-registry, audit-log, og in-memory services til udvikling.

## Teknologistak
- TypeScript (strict)
- React / Vite
- Node.js 18+/20+
- Vitest for tests
- ESLint + Prettier

## Local setup
1. npm ci
2. npm run build
3. npm run start:dev
4. npm test

## Branching & PR conventions
- Branches: main, develop, feature/*, hotfix/*, release/*
- PRs: opret mod develop (eller main ved releases)
- Titles: kort og beskrivende
- Merge: foretræk squash-merge for dokumentations og feature-branches

## CI / Quality gates
- Tests og lint skal være grønne før merge
- CodeQL og dependency scanning skal passere
- Ingen PII i dev fixtures eller audit logs

## Security & GDPR notes
- Ingen sand data i commits eller test fixtures
- Følg data minimization: log kun IDs/metadata i audit events
- Følg retention policies i .github/architecture/SystemOverSeer-Governance.md

## How Copilot agent should be used in this repo
- Copilot kan oprette og ændre nye filer (f.eks. .github/copilot-instructions.md) og hjælpe med branch-syncing og konfliktløsning.
- Copilot må ikke pushe hemmelige nøgler eller reelle PII-data.
- Automatisk PR-oprettelse er OK for ikke-sensitive ændringer; større ændringer kræver menneskelig review.
- Når Copilot foretager opdateringer i en feature-branch, opret altid en PR og lad en menneskelig reviewer godkende før merge to main.

## Development guidelines
- Brug TypeScript strict, annoter offentlige API'er
- Skriv tests for nye kritiske funktioner
- Hold bundle size i øje for frontend widgets

## Contacts / Owners
- System Director: @Clauskraft
- Chief Architect: @Clauskraft

## Quick commands
- Checkout PR branch: git fetch origin && git checkout copilot/set-up-copilot-instructions
- Mark PR ready (GH CLI): gh pr ready 12 --repo Clauskraft/WidgeTDC
- Merge when green (squash): gh pr merge 12 --squash --repo Clauskraft/WidgeTDC

---

(Denne fil er oprettet af Copilot-coding-agent på anmodning fra repository-ejer for at hjælpe med onboarding og agent-automatisering.)