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