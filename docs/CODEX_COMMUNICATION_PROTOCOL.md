# CODEX KOMMUNIKATIONSPROTOKOL
## Agent-til-Agent Kommunikation i WidgeTDC

## FIRE KOMMUNIKATIONSKANALER

1. Neural Chat (Real-time)
2. Agent Messages (Async Inbox)
3. DropZone (File-based Handovers)
4. Neo4j Oracelet (Shared Knowledge)

---

## 1. NEURAL CHAT (Real-time)

### Kanaler
- core-dev: Hovedudviklingskanal
- standup: Status updates
- alerts: Kritiske advarsler

### Send Besked
Tool: widgetdc-neural-bridge:neural_chat_send

Parametre:
- channel: "core-dev" | "standup" | "alerts"
- from: "codex" | "claude" | "gemini" | "deepseek" | "clak"
- body: "Din besked"
- type: "chat" | "task" | "status" | "alert" | "handover"
- priority: "low" | "normal" | "high" | "critical"

### Læs Beskeder
Tool: widgetdc-neural-bridge:neural_chat_read

Parametre:
- channel: (optional) specifik kanal
- limit: antal beskeder (default: 20)
- since: ISO timestamp

### Eksempel - Send task til Claude
channel: "core-dev"
from: "codex"
body: "Claude: Søg efter mockData i apps/frontend/src/widgets/"
type: "task"
priority: "high"

---

## 2. AGENT MESSAGES (Async Inbox)

### Send til Agent
Tool: widgetdc-neural-bridge:send_agent_message

Parametre:
- to: "claude" | "gemini" | "human"
- subject: "Emne"
- body: "Detaljeret besked"
- type: "task" | "question" | "status" | "alert"
- priority: "low" | "normal" | "high" | "critical"

### Læs Inbox
Tool: widgetdc-neural-bridge:read_agent_messages

Parametre:
- agent: "claude" | "gemini"
- unreadOnly: true | false

---

## 3. DROPZONE (File-based Handovers)

### Lokation
C:\Users\claus\Projects\WidgeTDC\WidgeTDC\apps\backend\dropzone\

### Filnavn Format
HANDOVER_[FROM]_TO_[TO]_[TIMESTAMP].json

### MCP Tools
- widgetdc-neural-bridge:list_dropzone_files
- widgetdc-neural-bridge:read_dropzone_file

---

## 4. NEO4J ORACELET (Shared Knowledge)

### Query Graph
Tool: widgetdc-neural-bridge:query_knowledge_graph

Parametre:
- query: "Cypher query eller søgeterm"
- type: "search" | "cypher" | "labels" | "relationships"
- limit: antal resultater

### Gem Finding
Tool: widgetdc-neural-bridge:create_graph_node

Parametre:
- label: "QAFinding" | "BugReport"
- properties: { title, severity, file, discoveredBy }

---

## 5. PING & HEALTH

### Ping Service
Tool: widgetdc-neural-bridge:emit_sonar_pulse
- target: "neo4j" | "postgres" | "backend" | "filesystem"

### System Health
Tool: widgetdc-neural-bridge:get_system_health
- detailed: true | false

---

## AGENT IDENTITETER

- claude: Primær AI - kode, analyse, søgning
- gemini: Sekundær AI - frontend, design
- deepseek: Specialist - deep analysis
- clak: Human Owner - beslutninger
- codex: QA Direktør - audit, review
- system: Automatiseret - monitoring

---

## CODEX QUICK REFERENCE

START SESSION:
neural_chat_send(channel="core-dev", from="codex", 
  body="QA AUDIT INITIATED", type="status", priority="high")

DELEGÉR TIL CLAUDE:
neural_chat_send(channel="core-dev", from="codex",
  body="Claude: [INSTRUKTION]", type="task")

RAPPORTÉR FINDING:
neural_chat_send(channel="alerts", from="codex",
  body="KRITISK: [FINDING]", type="alert", priority="critical")

GEM FINDING:
create_graph_node(label="QAFinding", properties={...})

PING SYSTEM:
emit_sonar_pulse(target="neo4j")
get_system_health(detailed=true)
