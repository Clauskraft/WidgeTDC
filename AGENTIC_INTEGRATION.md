# Agentic Workflow Integration

## Overview

WidgeTDC will incorporate **agentic workflow tools** from two open‑source projects:

1. **[agentset-ai/agentset](https://github.com/agentset-ai/agentset)** – a lightweight library for building **autonomous agents**, tool registration, and **MCP‑compatible** message routing.
2. **[AgentEra/Agently](https://github.com/AgentEra/Agently)** – provides a **visual workflow editor** and runtime engine that can render complex agentic pipelines as interactive graphs.

The goal is to **leverage Agentset** for the core agent orchestration (already used in the MCP layer) and **use Agently** as the **best‑in‑class visualisation** for designing, debugging, and monitoring these workflows.

---

## Why These Tools?

| Feature | Agentset | Agently |
|---------|----------|---------|
| **MCP Compatibility** | Directly supports the `MCPMessage` interface used throughout WidgeTDC. | Can wrap any async function, so we can embed Agentset‑based agents. |
| **Lightweight** | Small runtime, pure TypeScript, no heavy UI dependencies. | Focused on UI/UX for workflow design. |
| **Extensible** | Easy to register custom tools (e.g., `vidensarkiv.search`). | Drag‑and‑drop node editor, live execution view. |
| **Visualization** | Minimal (text‑based). | **Rich interactive graph** (SVG/Canvas) with node status, logs, and metrics. |
| **Community** | Actively maintained, good docs. | Growing community, integrates with React/Vite. |

**Conclusion:** Use **Agentset** for the **backend orchestration** and **Agently** for the **frontend workflow visualisation** – the combination gives us a powerful, observable agentic system.

---

## Integration Steps

### 1️⃣ Add Dependencies
```bash
# Backend (Agentset)
cd apps/backend
npm install agentset@latest

# Frontend (Agently)
cd ../../apps/widget-board
npm install agently@latest
```

### 2️⃣ Backend – Agentset Wrapper
Create a thin wrapper that adapts the existing MCP router to Agentset's `Agent` class.

**File:** `apps/backend/src/services/agentic/AgentsetAdapter.ts`
```typescript
import { Agent, Tool } from 'agentset';
import { MCPMessage } from '../../mcp/types';
import { routeMcpMessage } from '../../mcp/mcpRouter';

/**
 * AgentsetAdapter – bridges existing MCP tools to Agentset agents.
 */
export class AgentsetAdapter {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({ name: 'WidgeTDC-Agent' });
    // Register all existing MCP tools as Agentset tools
    const tools: Tool[] = [];
    // Example: register vidensarkiv.search
    tools.push({
      name: 'vidensarkiv.search',
      description: 'Semantic search over vector store',
      async run(payload: any) {
        const msg: MCPMessage = { tool: 'vidensarkiv.search', payload };
        return await routeMcpMessage(msg);
      },
    });
    // Add more tools as needed …
    this.agent.registerTools(tools);
  }

  /**
   * Execute a tool via Agentset – returns the tool's response.
   */
  async execute(toolName: string, payload: any) {
    return await this.agent.runTool(toolName, payload);
  }
}

// Export a singleton for the rest of the backend
let adapter: AgentsetAdapter | null = null;
export function getAgentsetAdapter(): AgentsetAdapter {
  if (!adapter) adapter = new AgentsetAdapter();
  return adapter;
}
```

### 3️⃣ Frontend – Agently Workflow UI
Create a new widget that hosts the Agently editor.

**File:** `apps/widget-board/src/widgets/AgenticWorkflowWidget.tsx`
```tsx
import React, { useEffect, useRef } from 'react';
import { Agently } from 'agently';
import './AgenticWorkflowWidget.css';

/**
 * AgenticWorkflowWidget – embeds the Agently visual editor.
 * The editor loads a JSON definition of the workflow and can
 * trigger execution via the backend AgentsetAdapter.
 */
export const AgenticWorkflowWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const agently = new Agently({
      container: containerRef.current,
      // Basic theme – can be customised later
      theme: 'dark',
    });

    // Load a starter workflow (can be edited by the user)
    agently.loadWorkflow({
      nodes: [
        { id: 'start', type: 'trigger', name: 'Start' },
        { id: 'search', type: 'tool', name: 'vidensarkiv.search' },
        { id: 'end', type: 'action', name: 'DisplayResults' },
      ],
      edges: [
        { from: 'start', to: 'search' },
        { from: 'search', to: 'end' },
      ],
    });

    // Hook up execution – when the user clicks "Run"
    agently.on('run', async (workflow) => {
      const response = await fetch('/api/agentic/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      const result = await response.json();
      agently.showResult(result);
    });
  }, []);

  return <div className="agentic-workflow" ref={containerRef} />;
};
```

Add a route in the backend to receive the workflow JSON and execute via `AgentsetAdapter`:

**File:** `apps/backend/src/routes/agentic.ts`
```typescript
import { Router } from 'express';
import { getAgentsetAdapter } from '../services/agentic/AgentsetAdapter';

const router = Router();

router.post('/run', async (req, res) => {
  const { nodes, edges } = req.body;
  // Very simple execution: find the first tool node and run it
  const toolNode = nodes.find((n: any) => n.type === 'tool');
  if (!toolNode) return res.status(400).json({ error: 'No tool node found' });

  const adapter = getAgentsetAdapter();
  const result = await adapter.execute(toolNode.name, {});
  res.json({ result });
});

export default router;
```
Register the route in `apps/backend/src/index.ts`:
```typescript
import agenticRouter from './routes/agentic';
app.use('/api/agentic', agenticRouter);
```

### 4️⃣ Visualisation Choice – Agently
Agently provides:
- **Drag‑and‑drop node editor** (supports custom tool nodes).
- **Live execution view** with step‑by‑step status (running, success, error).
- **Export/Import** of workflow JSON for version control.
- **Theming** to match the existing dark UI of WidgeTDC.

Thus, Agently is the **best agentic workflow visualisation** for our platform.

---

## Documentation Updates
- **`ARCHITECTURE.md`** – add a new subsection under *Cognitive Layer* → *Agentic Orchestration* describing Agentset + Agently.
- **`QUICK_START.md`** – add installation steps for the two new packages and a note on the new `AgenticWorkflowWidget`.
- **`TODO.md`** – add high‑priority tasks for completing the integration (tests, UI polishing, security review).

---

## Timeline (2 weeks)
| Day | Milestone |
|-----|-----------|
| 1‑2 | Add npm dependencies, create `AgentsetAdapter` wrapper. |
| 3‑4 | Implement backend `/api/agentic/run` endpoint. |
| 5‑7 | Build `AgenticWorkflowWidget` with Agently, integrate into widget board. |
| 8‑9 | Update docs (`ARCHITECTURE.md`, `QUICK_START.md`). |
| 10‑11 | Write unit tests for `AgentsetAdapter` and API route. |
| 12 | Demo: design a simple search workflow, run it, verify results. |

---

## Success Criteria
- **Agentset** can invoke any existing MCP tool via `execute`.
- **Agently** UI loads, allows editing, and can trigger execution.
- Workflow execution returns correct results (e.g., semantic search).
- All new code passes TypeScript strict compilation and linting.
- Documentation reflects the new integration and guides a new developer to set it up.

---

**Next steps:**
1. Add the dependency installation commands to `setup-enterprise.ps1`.
2. Create the placeholder files listed above.
3. Update `INTEGRATIONS_PLAN.md` with a reference to this new section.

Feel free to tell me which part you’d like to implement first, or if you need any of the placeholder files created now.
