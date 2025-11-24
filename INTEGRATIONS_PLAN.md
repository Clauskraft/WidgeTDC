# Integration Plan: Grafana, NocoDB, Firecrawl & Rawgraph

## 🎯 Goal
Create a unified strategy for leveraging **Grafana**, **NocoDB**, **Firecrawl**, and **Rawgraph** within the WidgeTDC Enterprise platform to:
- Gain deep observability and monitoring (Grafana)
- Provide low‑code data management and API exposure (NocoDB)
- Enrich the knowledge base with web‑scraped content (Firecrawl)
- Visualise graph‑structured data for insights (Rawgraph)

---

## 📊 1. Grafana – Observability & Metrics

### Why Grafana?
- Central dashboard for **Prometheus** metrics, **logs**, and **traces**.
- Supports alerts, anomaly detection, and team sharing.
- Native integrations for **PostgreSQL**, **Redis**, **PM2**, and **OpenTelemetry**.

### Integration Steps
| Step | Action | Details |
|------|--------|---------|
| 1️⃣ | **Expose Prometheus metrics** | Add `prom-client` to the backend. Create a `/metrics` endpoint that exports:
- HTTP request latency
- DB query duration (Prisma middleware)
- Redis event bus throughput
- Vector store insert/search latency
| 2️⃣ | **PM2 metrics** | Enable `pm2-god` or `pm2-metrics` to expose process CPU, memory, restarts.
| 3️⃣ | **Log shipping** | Configure Winston to write JSON logs to a file (`logs/app.json`). Use **Grafana Loki** as a Docker service to ingest these logs.
| 4️⃣ | **Docker compose** | Add services:
```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  depends_on:
    - prometheus
    - loki
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```
| 5️⃣ | **Grafana dashboards** | Import pre‑built dashboards for:
- Node.js Express metrics (via `node_exporter`)
- PostgreSQL performance (`postgres_exporter`)
- Redis (`redis_exporter`)
- Custom dashboard for **Vector Store** (search latency, insert rate)
| 6️⃣ | **Alerting** | Set alerts for:
- CPU > 80% for > 5m
- DB connection errors
- Vector search latency > 200ms
| 7️⃣ | **Documentation** | Add a section in `ARCHITECTURE.md` under *Observability*.

### Timeline (2 weeks)
- Week 1: Add metrics endpoint, configure Loki & Prometheus.
- Week 2: Build dashboards, alerts, and documentation.

---

## 📋 2. NocoDB – Low‑code Data Management & API

### Why NocoDB?
- Turns any **PostgreSQL** schema into a **REST/GraphQL** API instantly.
- Provides a spreadsheet‑like UI for non‑technical users to view/edit data.
- Supports **role‑based access** and **row‑level security**.

### Integration Steps
| Step | Action | Details |
|------|--------|---------|
| 1️⃣ | **Add NocoDB service** | Add to `docker-compose.yml`:
```yaml
nocodb:
  image: nocodb/nocodb:latest
  ports:
    - "8080:8080"
  environment:
    - NC_DB="postgres://widgetdc:widgetdc_dev@postgres:5432/widgetdc"
    - NC_AUTH_JWT_SECRET=${JWT_SECRET}
    - NC_ALLOW_SIGNUP=false
```
| 2️⃣ | **Expose schemas** | NocoDB will auto‑discover the Prisma schema. Verify tables: `vector_documents`, `agents`, `memory_entities`, etc.
| 3️⃣ | **Configure RBAC** | Use NocoDB UI to create roles (admin, analyst, viewer). Map to PostgreSQL RLS policies already defined.
| 4️⃣ | **Custom API endpoints** | For vector search, create a **NocoDB custom function** that calls the `PgVectorStoreAdapter.search` via a tiny Node wrapper (exposed as a webhook). This gives a REST endpoint `/api/nc/vector-search`.
| 5️⃣ | **Sync with MCP** | Add a small adapter in `apps/backend/src/services/nocodb/NocoAdapter.ts` that forwards MCP tool calls to NocoDB when needed (e.g., `vidensarkiv.add`).
| 6️⃣ | **Documentation** | Add a *Data Management* section in `README.md` with a quick‑start guide.

### Timeline (1 week)
- Day 1: Add service, test connection.
- Day 2‑3: Configure RBAC & RLS.
- Day 4‑5: Implement custom vector‑search webhook.
- Day 6: Write docs.

---

## 🌐 3. Firecrawl – Web Scraping & Knowledge Enrichment

### Why Firecrawl?
- Provides **headless browser crawling** with **HTML → Markdown** conversion.
- Handles JavaScript‑heavy sites, pagination, and rate‑limiting.
- Returns clean text ready for embedding generation.

### Integration Steps
| Step | Action | Details |
|------|--------|---------|
| 1️⃣ | **Create Firecrawl service** | Add a small Node wrapper `FirecrawlService.ts` that calls the public API (`https://api.firecrawl.dev/v0/crawl`). Store the API key in `.env` (`FIRECRAWL_API_KEY`).
| 2️⃣ | **Ingestion pipeline extension** | Extend `DataIngestionEngine` to accept a **URL** payload. The engine will:
- Call Firecrawl → get markdown content.
- Pass content to `EmbeddingService` → generate embedding.
- Upsert into `PgVectorStoreAdapter` with metadata `{source: url}`.
| 3️⃣ | **Rate limiting & queue** | Use a **BullMQ** queue (Redis‑backed) to schedule crawls and avoid hitting API limits.
| 4️⃣ | **Metadata enrichment** | Store crawl timestamp, page title, and raw HTML (optional) in a new table `web_pages` (add to Prisma schema).
| 5️⃣ | **MCP tool** | Add a new tool `web.crawlAndIngest` in `mcpRouter.ts` that triggers the above flow.
| 6️⃣ | **UI widget** | Create a new widget `WebCrawlerWidget` on the dashboard allowing users to input URLs and view crawl status.
| 7️⃣ | **Documentation** | Add a *Web Enrichment* section in `SEMANTIC_SEARCH_GUIDE.md`.

### Timeline (2 weeks)
- Week 1: Service wrapper, queue, and schema migration.
- Week 2: MCP tool, widget, and docs.

---

## 📈 4. Rawgraph – Graph Visualisation

### Why Rawgraph?
- Open‑source visualisation tool for **network/graph data**.
- Accepts CSV/JSON and produces interactive SVG/HTML visualisations.
- Perfect for visualising the **knowledge graph** (`Neo4jGraphAdapter`).

### Integration Steps
| Step | Action | Details |
|------|--------|---------|
| 1️⃣ | **Deploy Rawgraph** | Add a Docker service:
```yaml
rawgraph:
  image: rawgraph/rawgraph:latest
  ports:
    - "8081:8080"
```
| 2️⃣ | **Export graph data** | Implement an endpoint `/api/graph/export` that returns **CSV** with columns `source,target,weight` from Neo4j (or from `memory_entities` relationships).
| 3️⃣ | **Import into Rawgraph** | Users can open Rawgraph UI, load the CSV via URL (`http://localhost:8081/data.csv`).
| 4️⃣ | **Embedding‑driven edges** | After a semantic search, generate a **sub‑graph** of top‑N related entities and feed it to Rawgraph for visual exploration.
| 5️⃣ | **Widget integration** | Add a `GraphViewerWidget` that embeds Rawgraph via an `<iframe>` pointing to the service with the generated CSV URL.
| 6️⃣ | **Documentation** | Add a *Graph Visualisation* chapter in `ARCHITECTURE.md` and a quick‑start in `QUICK_START.md`.

### Timeline (1 week)
- Day 1‑2: Deploy Rawgraph, create export endpoint.
- Day 3‑4: Build widget and iframe integration.
- Day 5: Write docs and demo screenshots.

---

## 📅 Overall Roadmap (4 weeks total)
| Week | Focus |
|------|-------|
| 1 | Grafana metrics, Prometheus & Loki setup.
| 2 | Grafana dashboards, alerts, and documentation.
| 3 | NocoDB service, RBAC, and vector‑search webhook.
| 4 | Firecrawl integration + Rawgraph visualisation (parallel work).

## 📌 Deliverables
- **Docker compose** updates with new services.
- **Environment variables** (`FIRECRAWL_API_KEY`, `GRAFANA_ADMIN_PASSWORD`).
- **Updated Prisma schema** (`web_pages` table).
- **New source files**:
  - `apps/backend/src/services/web/FirecrawlService.ts`
  - `apps/backend/src/services/nocodb/NocoAdapter.ts`
  - `apps/backend/src/services/graph/GraphExportController.ts`
  - `apps/backend/src/widgets/WebCrawlerWidget.tsx`
  - `apps/backend/src/widgets/GraphViewerWidget.tsx`
- **Documentation** updates:
  - `ARCHITECTURE.md` – Observability & Integration sections.
  - `QUICK_START.md` – New services.
  - `SEMANTIC_SEARCH_GUIDE.md` – Firecrawl enrichment.
  - `README.md` – NocoDB & Rawgraph quick start.
- **TODO.md** entries for each integration (high‑priority).

---

## ✅ Success Criteria
- **Grafana** shows real‑time metrics and alerts without manual config.
- **NocoDB** provides a functional UI for all tables and a working REST endpoint for vector search.
- **Firecrawl** can ingest a URL and make the content searchable within 30 seconds.
- **Rawgraph** visualises a sub‑graph of at least 20 nodes with interactive controls.
- All new services are **docker‑compose up**‑able and documented.

---

**Next Action:**
1. Add the Docker services to `docker-compose.yml`.
2. Create the new source files (placeholders) and commit.
3. Update `TODO.md` with the tasks above.

Feel free to let me know which integration you’d like to start with, or if you need any of the placeholder files created now.
