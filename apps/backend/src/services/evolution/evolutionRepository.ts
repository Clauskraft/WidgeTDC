import { getDatabase } from '../../database/index.js';
import { AgentRunReport } from '@widget-tdc/mcp-types';

export class EvolutionRepository {
  private db = getDatabase();

  createPrompt(agentId: string, promptText: string, createdBy: string = 'evolution-agent'): number {
    // Get current max version for this agent
    const maxVersionRow = this.db.prepare(`
      SELECT MAX(version) as max_version FROM agent_prompts WHERE agent_id = ?
    `).get(agentId) as any;
    
    const nextVersion = (maxVersionRow?.max_version || 0) + 1;

    const result = this.db.prepare(`
      INSERT INTO agent_prompts (agent_id, version, prompt_text, created_by)
      VALUES (?, ?, ?, ?)
    `).run(agentId, nextVersion, promptText, createdBy);

    return result.lastInsertRowid as number;
  }

  getLatestPrompt(agentId: string): any {
    return this.db.prepare(`
      SELECT * FROM agent_prompts
      WHERE agent_id = ?
      ORDER BY version DESC
      LIMIT 1
    `).get(agentId);
  }

  getAllPrompts(agentId: string): any[] {
    return this.db.prepare(`
      SELECT * FROM agent_prompts
      WHERE agent_id = ?
      ORDER BY version DESC
    `).all(agentId);
  }

  recordRun(report: AgentRunReport): number {
    const result = this.db.prepare(`
      INSERT INTO agent_runs (
        agent_id, prompt_version, input_summary, output_summary,
        kpi_name, kpi_delta, run_context
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      report.agentId,
      report.promptVersion,
      report.inputSummary,
      report.outputSummary,
      report.kpiName,
      report.kpiDelta,
      JSON.stringify(report.runContext)
    );

    return result.lastInsertRowid as number;
  }

  getRecentRuns(agentId: string, limit: number = 10): any[] {
    const rows = this.db.prepare(`
      SELECT * FROM agent_runs
      WHERE agent_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(agentId, limit);

    return rows.map((row: any) => {
      let runContext = {};
      try {
        runContext = JSON.parse(row.run_context || '{}');
      } catch (error) {
        console.error('Error parsing run_context JSON:', error);
        runContext = {};
      }
      return {
        ...row,
        run_context: runContext,
      };
    });
  }

  getAverageKpiDelta(agentId: string, limit: number = 10): number {
    const result = this.db.prepare(`
      SELECT AVG(kpi_delta) as avg_delta
      FROM (
        SELECT kpi_delta FROM agent_runs
        WHERE agent_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      )
    `).get(agentId, limit) as any;

    return result?.avg_delta || 0;
  }
}
