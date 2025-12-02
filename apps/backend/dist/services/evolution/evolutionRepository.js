import { getDatabase } from '../../database/index.js';
export class EvolutionRepository {
    get db() {
        return getDatabase();
    }
    createPrompt(agentId, promptText, createdBy = 'evolution-agent') {
        // Get current max version for this agent
        const maxVersionRow = this.db.prepare(`
      SELECT MAX(version) as max_version FROM agent_prompts WHERE agent_id = ?
    `).get(agentId);
        const nextVersion = (maxVersionRow?.max_version || 0) + 1;
        const result = this.db.prepare(`
      INSERT INTO agent_prompts (agent_id, version, prompt_text, created_by)
      VALUES (?, ?, ?, ?)
    `).run(agentId, nextVersion, promptText, createdBy);
        return result.lastInsertRowid;
    }
    getLatestPrompt(agentId) {
        return this.db.prepare(`
      SELECT * FROM agent_prompts
      WHERE agent_id = ?
      ORDER BY version DESC
      LIMIT 1
    `).get(agentId);
    }
    getAllPrompts(agentId) {
        return this.db.prepare(`
      SELECT * FROM agent_prompts
      WHERE agent_id = ?
      ORDER BY version DESC
    `).all(agentId);
    }
    recordRun(report) {
        const result = this.db.prepare(`
      INSERT INTO agent_runs (
        agent_id, prompt_version, input_summary, output_summary,
        kpi_name, kpi_delta, run_context
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(report.agentId, report.promptVersion, report.inputSummary, report.outputSummary, report.kpiName, report.kpiDelta, JSON.stringify(report.runContext));
        return result.lastInsertRowid;
    }
    getRecentRuns(agentId, limit = 10) {
        const rows = this.db.prepare(`
      SELECT * FROM agent_runs
      WHERE agent_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(agentId, limit);
        return rows.map((row) => {
            let runContext = {};
            try {
                runContext = JSON.parse(row.run_context || '{}');
            }
            catch (error) {
                console.error('Error parsing run_context JSON:', error);
                runContext = {};
            }
            return {
                ...row,
                run_context: runContext,
            };
        });
    }
    getAverageKpiDelta(agentId, limit = 10) {
        const result = this.db.prepare(`
      SELECT AVG(kpi_delta) as avg_delta
      FROM (
        SELECT kpi_delta FROM agent_runs
        WHERE agent_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      )
    `).get(agentId, limit);
        return result?.avg_delta || 0;
    }
}
