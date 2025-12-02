# 🗺️ Strategic Roadmap: WidgeTDC Expansion

**Status:** DRAFT
**Date:** 2025-12-01
**Author:** Gemini 3.0 (The Architect)

## 1. Executive Summary
WidgeTDC has evolved into a Cyber Intelligence Platform (Dark Sentry + Omni-Sentry). The next strategic leap is **Economic Intelligence**. We will build a "Tender Harvester" to monitor public procurement opportunities, specifically in Cybersecurity, ensuring WidgeTDC can bid on relevant contracts autonomously or assist the user in doing so.

## 2. Core Modules

### Phase I: The Tender Harvester (Next Priority)
*   **Objective:** Scrape and ingest public tenders (udbud) from EU (TED) and DK (Udbud.dk).
*   **Data Sources:**
    *   **TED (Tenders Electronic Daily):** EU's public procurement journal. (Open API / CSV export).
    *   **Udbud.dk:** Danish public tenders.
*   **Keywords:** `Cybersecurity`, `NIS2`, `GDPR`, `Cloud Migration`, `DevOps`, `Intelligence Platform`.
*   **Graph Schema:**
    *   `(:Tender {title: "...", budget: "...", deadline: "..."})`
    *   `(:Authority {name: "Københavns Kommune"})`
    *   `(:Authority)-[:PUBLISHED]->(:Tender)`
    *   `(:Tender)-[:REQUIRES]->(:Skill {name: "Neo4j"})` (Semantic matching with our skillset).

### Phase II: The Bid Assistant (Future)
*   **Objective:** Use LLM (Claude/Gemini) to analyze tender documents (PDFs) and draft initial responses.
*   **Workflow:**
    1.  **Ingest:** Download tender documents -> Vector Store.
    2.  **Analyze:** "Summarize requirements for Tender X".
    3.  **Draft:** "Write a capability statement based on WidgeTDC's architecture (Neo4j/React)".

## 3. Integration with Existing Systems
*   **Omni-Sentry Correlation:**
    *   If ENISA warns about "Ransomware in Energy Sector" (Public Threat), and we see a Tender for "Energy Sector Security Upgrade" (Tender Harvester), highlight this as a **High Value Opportunity**.
    *   *Logic:* Threat drives Demand.

## 4. Technical Requirements
*   **Scraper:** Python (BeautifulSoup/Scrapy) or TypeScript (Puppeteer/Playwright) for sites without clean APIs.
*   **Storage:** Existing Neo4j Graph.
*   **Notifications:** Slack/Teams/Email alert when a "Perfect Match" tender is found.

## 5. Action Plan
1.  **Research:** Verify TED API access keys and rate limits.
2.  **Prototype:** Build a simple script to fetch "Cybersecurity" tenders from TED RSS feed.
3.  **Ingest:** Map to Graph.

## 6. Strategic Expansion (Hybrid Warfare)

**Executive Order:** Expand intelligence capabilities to cover hybrid threats against DK/EU (DDoS, Drones, Sabotage).

### Core Operations

#### Operation "Visual Recon" (Dashboard V2)
*   **Objective:** Geographic visualization of threats.
*   **Action:** Create `ThreatMapWidget.tsx` displaying real-time attacks on the EU zone.

#### Operation "Silent Alarm" (Active Monitoring)
*   **Objective:** Immediate alerting for threats against critical infrastructure.
*   **Keywords:** "Denmark", "Copenhagen", "Energinet", "Mærsk", "Banedanmark", "NATO".
*   **Action:** Trigger alerts to `docs/ALERTS.md` upon detection.

#### Operation "Neural Match" (Vector Intelligence)
*   **Objective:** Semantic correlation of cross-domain incidents (e.g., drone sightings vs. cyber threats).
*   **Action:** Implement vector embeddings for pattern recognition.

#### Operation "Hacktivist Watch" (DDoS Intel)
*   **Objective:** Early detection of planned DDoS attacks.
*   **Target:** Telegram channels of *NoName057(16)*, *Anonymous Sudan*.
*   **Signal:** Target lists containing `.dk` domains.
*   **Action:** Create `scripts/telegram_harvester.ts`.

#### Operation "Ghost Protocol" (Defensive Measures)
*   **Objective:** Anonymize intelligence gathering.
*   **Action:** Route backend traffic through Tor.
