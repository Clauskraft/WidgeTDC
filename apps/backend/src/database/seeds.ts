import { getDatabase } from './index.js';

export function seedDatabase() {
  const db = getDatabase();
  
  console.log('Seeding database...');

  // Seed memory entities
  const memoryInsert = db.prepare(`
    INSERT INTO memory_entities (org_id, user_id, entity_type, content, importance)
    VALUES (?, ?, ?, ?, ?)
  `);

  const memories = [
    ['org-1', 'user-1', 'DecisionOutcome', 'Decided to use TypeScript for the backend', 5],
    ['org-1', 'user-1', 'CustomerPreference', 'Customer prefers minimal UI with dark mode', 4],
    ['org-1', 'user-1', 'ProjectGoal', 'Launch MVP by end of Q1 2024', 5],
    ['org-1', 'user-2', 'TechnicalDecision', 'Using SQLite for lightweight data storage', 4],
  ];

  for (const mem of memories) {
    const result = memoryInsert.run(...mem);
    const entityId = result.lastInsertRowid;
    
    // Add tags
    db.prepare(`INSERT INTO memory_tags (entity_id, tag) VALUES (?, ?)`).run(entityId, 'technical');
  }

  // Seed raw documents
  const docInsert = db.prepare(`
    INSERT INTO raw_documents (org_id, source_type, source_path, content)
    VALUES (?, ?, ?, ?)
  `);

  docInsert.run('org-1', 'meeting_notes', '/meetings/2024-01-15.md', 
    'Team discussed widget architecture. Decided on React + TypeScript. Backend will use Node.js with Express.');
  docInsert.run('org-1', 'contract', '/contracts/supplier-a.pdf',
    'Supplier A contract for cloud services. Annual cost: $50,000. Renewal date: 2025-01-01.');

  // Seed structured facts
  const factInsert = db.prepare(`
    INSERT INTO structured_facts (org_id, doc_id, fact_type, json_payload, occurred_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  factInsert.run('org-1', 1, 'TechStack', JSON.stringify({
    frontend: 'React + TypeScript',
    backend: 'Node.js + Express',
    database: 'SQLite'
  }), '2024-01-15');

  factInsert.run('org-1', 2, 'SupplierKpi', JSON.stringify({
    supplier: 'Supplier A',
    service: 'Cloud Services',
    annualCost: 50000,
    renewalDate: '2025-01-01'
  }), '2024-01-01');

  // Seed agent prompts
  const promptInsert = db.prepare(`
    INSERT INTO agent_prompts (agent_id, version, prompt_text, created_by)
    VALUES (?, ?, ?, ?)
  `);

  promptInsert.run('procurement-agent', 1, 
    'You are a procurement intelligence agent. Analyze supplier data and provide cost optimization recommendations.',
    'system');
  
  promptInsert.run('cma-agent', 1,
    'You are a contextual memory agent. Use historical context to enhance decision making.',
    'system');

  // Seed agent runs
  const runInsert = db.prepare(`
    INSERT INTO agent_runs (agent_id, prompt_version, input_summary, output_summary, kpi_name, kpi_delta, run_context)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  runInsert.run('procurement-agent', 1, 
    'Analyze Q1 spending', 
    'Recommended 3 cost reduction opportunities',
    'cost_savings',
    0.15,
    JSON.stringify({ quarter: 'Q1', year: 2024 }));

  // Seed PAL user profiles
  const profileInsert = db.prepare(`
    INSERT INTO pal_user_profiles (user_id, org_id, preference_tone)
    VALUES (?, ?, ?)
  `);

  profileInsert.run('user-1', 'org-1', 'professional');
  profileInsert.run('user-2', 'org-1', 'friendly');

  // Seed focus windows
  const focusInsert = db.prepare(`
    INSERT INTO pal_focus_windows (user_id, org_id, weekday, start_hour, end_hour)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Monday-Friday, 9-11 AM focus time for user-1
  for (let day = 1; day <= 5; day++) {
    focusInsert.run('user-1', 'org-1', day, 9, 11);
  }

  // Seed PAL events
  const eventInsert = db.prepare(`
    INSERT INTO pal_events (user_id, org_id, event_type, payload, detected_stress_level)
    VALUES (?, ?, ?, ?, ?)
  `);

  eventInsert.run('user-1', 'org-1', 'meeting', JSON.stringify({
    title: 'Team standup',
    duration: 30
  }), 'low');

  eventInsert.run('user-1', 'org-1', 'email', JSON.stringify({
    subject: 'Urgent: Production issue',
    priority: 'high'
  }), 'high');

  // Seed security search templates if empty
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM security_search_templates').get() as { count: number };
  if (templateCount.count === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO security_search_templates (id, name, description, query, severity, timeframe, sources)
      VALUES (@id, @name, @description, @query, @severity, @timeframe, @sources)
    `);
    const defaultTemplates = [
      {
        id: 'tpl-high-fidelity',
        name: 'High fidelity alerts',
        description: 'Critical events touching finance or executive accounts within 24h.',
        query: 'credential leak finance exec',
        severity: 'critical',
        timeframe: '24h',
        sources: JSON.stringify(['Dark Web', 'Feed Ingestion']),
      },
      {
        id: 'tpl-zero-day',
        name: 'Zero-day exploitation',
        description: 'Vendor advisories mentioning active exploitation or PoC for CVEs.',
        query: 'zero-day vendor advisory exploitation',
        severity: 'high',
        timeframe: '7d',
        sources: JSON.stringify(['Vendor Radar', 'CERT-EU']),
      },
      {
        id: 'tpl-supply-chain',
        name: 'Supply chain monitoring',
        description: 'Events referencing suppliers or tier-2 SaaS incidents.',
        query: 'supplier breach SaaS incident',
        severity: 'all',
        timeframe: '30d',
        sources: JSON.stringify(['Feed Ingestion', 'Internal Telemetry']),
      },
    ];
    defaultTemplates.forEach(template => insertTemplate.run(template));
  }

  // Seed activity events if empty
  const activityCount = db.prepare('SELECT COUNT(*) as count FROM security_activity_events').get() as { count: number };
  if (activityCount.count === 0) {
    const insertActivity = db.prepare(`
      INSERT INTO security_activity_events (
        id, title, description, category, severity, source, rule, channel, payload, created_at, acknowledged
      ) VALUES (
        @id, @title, @description, @category, @severity, @source, @rule, @channel, @payload, @created_at, @acknowledged
      )
    `);

    const now = new Date();
    const sampleEvents = [
      {
        id: 'evt-seed-1',
        title: 'Critical credential dump ingested',
        description: 'Dark web feed normalized 1.2k new credentials tied to finance leadership.',
        category: 'alert',
        severity: 'critical',
        source: 'Feed Ingestion',
        rule: 'critical-credential-dump',
        channel: 'SSE',
        payload: JSON.stringify({ feedId: 'feed-darkweb', documents: 1200 }),
        created_at: now.toISOString(),
        acknowledged: 0,
      },
      {
        id: 'evt-seed-2',
        title: 'Vendor advisory indexed',
        description: 'Vendor Radar pushed CVE-2025-1123 advisory with compensating controls.',
        category: 'ingestion',
        severity: 'high',
        source: 'Vendor Radar',
        rule: 'vendor-critical',
        channel: 'Job',
        payload: JSON.stringify({ cve: 'CVE-2025-1123' }),
        created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        acknowledged: 0,
      },
      {
        id: 'evt-seed-3',
        title: 'Automation run completed',
        description: 'Playbook reset credentials for exposed accounts (14 targets).',
        category: 'automation',
        severity: 'medium',
        source: 'Automation Engine',
        rule: 'auto-reset',
        channel: 'Webhook',
        payload: JSON.stringify({ targets: 14 }),
        created_at: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
        acknowledged: 1,
      },
    ];
    sampleEvents.forEach(event => insertActivity.run(event));
  }

  console.log('✅ Database seeded successfully');
}

// Run seeds if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
  process.exit(0);
}
