-- Memory (CMA) tables
CREATE TABLE IF NOT EXISTS memory_entities (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id          TEXT NOT NULL,
  user_id         TEXT,
  entity_type     TEXT NOT NULL,
  content         TEXT NOT NULL,
  importance      INTEGER NOT NULL DEFAULT 3,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory_relations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id          TEXT NOT NULL,
  source_id       INTEGER NOT NULL REFERENCES memory_entities(id),
  target_id       INTEGER NOT NULL REFERENCES memory_entities(id),
  relation_type   TEXT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory_tags (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id       INTEGER NOT NULL REFERENCES memory_entities(id),
  tag             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_entities_org ON memory_entities(org_id);
CREATE INDEX IF NOT EXISTS idx_memory_entities_user ON memory_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_tags_entity ON memory_tags(entity_id);
CREATE INDEX IF NOT EXISTS idx_memory_tags_tag ON memory_tags(tag);

-- SRAG tables
CREATE TABLE IF NOT EXISTS raw_documents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id        TEXT NOT NULL,
  source_type   TEXT NOT NULL,
  source_path   TEXT NOT NULL,
  content       TEXT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS structured_facts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id        TEXT NOT NULL,
  doc_id        INTEGER REFERENCES raw_documents(id),
  fact_type     TEXT NOT NULL,
  json_payload  TEXT NOT NULL,
  occurred_at   DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_documents_org ON raw_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_structured_facts_org ON structured_facts(org_id);
CREATE INDEX IF NOT EXISTS idx_structured_facts_type ON structured_facts(fact_type);

-- Evolution Agent tables
CREATE TABLE IF NOT EXISTS agent_prompts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id      TEXT NOT NULL,
  version       INTEGER NOT NULL,
  prompt_text   TEXT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by    TEXT NOT NULL DEFAULT 'evolution-agent'
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id        TEXT NOT NULL,
  prompt_version  INTEGER NOT NULL,
  input_summary   TEXT,
  output_summary  TEXT,
  kpi_name        TEXT,
  kpi_delta       REAL,
  run_context     TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_prompts_agent ON agent_prompts(agent_id, version);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id);

-- PAL tables
CREATE TABLE IF NOT EXISTS pal_user_profiles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  org_id        TEXT NOT NULL,
  preference_tone TEXT NOT NULL DEFAULT 'neutral',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pal_focus_windows (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  org_id        TEXT NOT NULL,
  weekday       INTEGER NOT NULL,
  start_hour    INTEGER NOT NULL,
  end_hour      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pal_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  org_id        TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  payload       TEXT NOT NULL,
  detected_stress_level TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pal_profiles_user ON pal_user_profiles(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_pal_focus_windows_user ON pal_focus_windows(user_id);
CREATE INDEX IF NOT EXISTS idx_pal_events_user ON pal_events(user_id, org_id);

-- Security Intelligence tables
CREATE TABLE IF NOT EXISTS security_search_templates (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  query         TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'all',
  timeframe     TEXT NOT NULL DEFAULT '24h',
  sources       TEXT NOT NULL DEFAULT '[]',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_search_history (
  id             TEXT PRIMARY KEY,
  query          TEXT NOT NULL,
  severity       TEXT NOT NULL,
  timeframe      TEXT NOT NULL,
  sources        TEXT NOT NULL,
  results_count  INTEGER NOT NULL DEFAULT 0,
  latency_ms     INTEGER NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_security_search_history_created ON security_search_history(created_at DESC);

CREATE TABLE IF NOT EXISTS security_activity_events (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL,
  severity       TEXT NOT NULL,
  source         TEXT NOT NULL,
  rule           TEXT,
  channel        TEXT NOT NULL DEFAULT 'SSE',
  payload        TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_security_activity_events_created ON security_activity_events(created_at DESC);

CREATE TABLE IF NOT EXISTS widget_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  widget_id TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- e.g., 'file_system', 'local_storage', 'drives'
  access_level TEXT NOT NULL CHECK (access_level IN ('none', 'read', 'write')), -- none, read, write
  override BOOLEAN DEFAULT 0, -- 0 for platform default, 1 for widget-specific override
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(widget_id, resource_type)
);
-- ============================================================================
-- COGNITIVE MEMORY LAYER - Autonomous Intelligence
-- ============================================================================

-- Query Pattern Learning
CREATE TABLE IF NOT EXISTS mcp_query_patterns (
  id TEXT PRIMARY KEY,
  widget_id TEXT NOT NULL,
  query_type TEXT NOT NULL,
  query_signature TEXT NOT NULL,
  source_used TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  result_size INTEGER,
  success BOOLEAN NOT NULL,
  user_context TEXT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_query_patterns_widget 
  ON mcp_query_patterns(widget_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_patterns_signature 
  ON mcp_query_patterns(query_signature);

-- Failure Memory
CREATE TABLE IF NOT EXISTS mcp_failure_memory (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT,
  error_context TEXT,
  recovery_action TEXT,
  recovery_success BOOLEAN,
  recovery_time_ms INTEGER,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_failure_memory_source 
  ON mcp_failure_memory(source_name, occurred_at DESC);

-- Source Health Metrics
CREATE TABLE IF NOT EXISTS mcp_source_health (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  health_score REAL NOT NULL,
  latency_p50 REAL,
  latency_p95 REAL,
  latency_p99 REAL,
  success_rate REAL NOT NULL,
  request_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_source_health_source 
  ON mcp_source_health(source_name, timestamp DESC);

-- Decision Log
CREATE TABLE IF NOT EXISTS mcp_decision_log (
  id TEXT PRIMARY KEY,
  query_intent TEXT NOT NULL,
  selected_source TEXT NOT NULL,
  decision_confidence REAL NOT NULL,
  actual_latency_ms INTEGER,
  was_optimal BOOLEAN,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Widget Patterns
CREATE TABLE IF NOT EXISTS mcp_widget_patterns (
  id TEXT PRIMARY KEY,
  widget_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  confidence REAL NOT NULL,
  last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_widget_patterns_widget 
  ON mcp_widget_patterns(widget_id, confidence DESC);

-- ============================================================================
-- PROJECT MEMORY LAYER
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_lifecycle_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type    TEXT NOT NULL, -- 'build', 'test', 'deploy', 'feature'
  status        TEXT NOT NULL, -- 'success', 'failure', 'in_progress'
  details       TEXT,          -- JSON payload
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_features (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL, -- 'planned', 'in_progress', 'completed', 'deprecated'
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- Vector Store (SQLite Fallback)
CREATE TABLE IF NOT EXISTS vector_documents (
  id            TEXT PRIMARY KEY,
  content       TEXT NOT NULL,
  embedding     TEXT, -- JSON string of number[]
  metadata      TEXT, -- JSON string
  namespace     TEXT DEFAULT 'default',
  "userId"      TEXT,
  "orgId"       TEXT,
  "createdAt"   DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vector_documents_namespace ON vector_documents(namespace);
