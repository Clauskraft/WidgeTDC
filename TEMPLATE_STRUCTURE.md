# Agent-Based Project Template Structure

Reference directory structure for using the agent-based development methodology.

## Directory Layout

```
project-root/
├── .github/
│   ├── workflows/
│   │   ├── agent-block-1-[feature].yml        # Agent 1 workflow
│   │   ├── agent-block-2-[feature].yml        # Agent 2 workflow
│   │   ├── agent-block-3-[feature].yml        # Agent 3 workflow
│   │   ├── agent-block-4-[feature].yml        # Agent 4 workflow
│   │   ├── agent-block-5-[feature].yml        # Agent 5 workflow
│   │   ├── agent-block-6-[feature].yml        # Agent 6 workflow
│   │   └── hanspedder-orchestrator.yml        # Master coordinator
│   └── SECURITY.md                            # Security policy
│
├── .cursor/
│   ├── agents/
│   │   ├── agent-1.md                         # Agent 1 brief
│   │   ├── agent-2.md                         # Agent 2 brief
│   │   ├── agent-3.md                         # Agent 3 brief
│   │   ├── agent-4.md                         # Agent 4 brief
│   │   ├── agent-5.md                         # Agent 5 brief
│   │   ├── agent-6.md                         # Agent 6 brief
│   │   └── orchestrator.md                    # Orchestrator brief
│   ├── AGENT_PROGRESS_TRACKER.md              # Real-time status
│   ├── PHASE_ACTIVATION_LOG.md                # Activation history
│   └── INSTRUCTIONS.md                        # Phase instructions
│
├── claudedocs/
│   ├── ARCHITECTURE.md                        # System architecture
│   ├── PROJECT_PLAN.md                        # Overall project plan
│   ├── COMPLIANCE_*.md                        # Compliance docs (if needed)
│   ├── SECURITY_*.md                          # Security docs (if needed)
│   └── PERFORMANCE_BASELINE.md                # Performance metrics
│
├── apps/
│   ├── app-1/
│   │   └── src/
│   └── app-2/
│       └── src/
│
├── packages/
│   ├── package-1/
│   │   └── src/
│   └── package-2/
│       └── src/
│
├── scripts/
│   ├── migrations/
│   ├── setup/
│   └── utilities/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── project_dashboard.html                    # Kanban board
├── GITHUB_PROJECT_TEMPLATE.md                # This template
├── TEMPLATE_STRUCTURE.md                     # Structure guide
├── MERGE_SUMMARY.md                          # Merge history
├── README.md                                 # Main documentation
├── package.json
├── tsconfig.json
└── jest.config.js
```

## File Purposes

### `.github/workflows/`

**Purpose**: GitHub Actions automation for agent execution

**Files:**

- `agent-block-*.yml`: Individual agent workflows
  - Trigger: Manual dispatch or upstream completion
  - Actions: Checkout, create branch, implement tasks, commit, push, create PR
  - Output: Feature branch with deliverables, PR to main

- `hanspedder-orchestrator.yml`: Master coordination workflow
  - Trigger: On completion of agent workflows
  - Actions: Discover PRs, validate quality, approve, merge
  - Output: Updated main branch, refreshed kanban board

### `.cursor/agents/`

**Purpose**: Agent brief documentation (independent of execution)

**Files:**

- `agent-*.md`: Individual specialist documentation
  - Content: Domain expertise, tasks, acceptance criteria, timeline
  - Status tracking: Ready | Active | Blocked | Complete
  - Dependencies: What each agent waits for
  - Communication: Status updates and blockers

- `orchestrator.md`: Orchestrator brief
  - Content: Coordination strategy, wave planning, merge criteria
  - Status tracking: All agent PRs, quality gates, merge status

### `.cursor/`

**Purpose**: Session-specific progress and communication

**Files:**

- `AGENT_PROGRESS_TRACKER.md`: Real-time status (updated during execution)
  - Content: Live status table, checkpoints, integration points
  - Purpose: User visibility into execution progress
  - Update frequency: Every hour during execution

- `PHASE_ACTIVATION_LOG.md`: Historical record
  - Content: Team composition, execution timeline, git commits
  - Purpose: Audit trail and retrospective analysis
  - Update frequency: At phase start and completion

- `INSTRUCTIONS.md`: Phase-specific instructions
  - Content: What to expect, communication protocol, status signals
  - Purpose: User guidance for monitoring execution
  - Update frequency: At phase start

### `claudedocs/`

**Purpose**: Project documentation (static, not execution-specific)

**Standard files:**

- `ARCHITECTURE.md`: System design and components
- `PROJECT_PLAN.md`: Overall project strategy
- `PERFORMANCE_BASELINE.md`: Performance targets and metrics

**Conditional files** (create if applicable):

- `COMPLIANCE_AUDIT.md`: Compliance verification
- `SECURITY_ARCHITECTURE.md`: Security review results
- `THREAT_MODEL.md`: Threat analysis
- `GDPR_CHECKLIST.md`: GDPR compliance
- `ISO_27001_MAPPING.md`: ISO 27001 controls
- `SOC2_COMPLIANCE.md`: SOC 2 status
- `REMEDIATION_PLAN.md`: Security findings and fixes

### Root Level

**`project_dashboard.html`**

- Purpose: Kanban board for task tracking
- Structure: 4 columns (TO DO, IN PROGRESS, BLOCKED, COMPLETED)
- Update: Manual by orchestrator workflow
- Refresh frequency: After each PR merge

**`README.md`**

- Purpose: Project introduction and documentation index
- Content: Project overview, quick start, architecture summary, usage instructions
- Audience: New team members, stakeholders

**`GITHUB_PROJECT_TEMPLATE.md`**

- Purpose: Generic template documentation for reuse
- Content: How to adapt template for different projects
- Audience: Future projects using this template

**`TEMPLATE_STRUCTURE.md`**

- Purpose: Directory layout and file organization reference
- Content: File purposes, required vs optional files, customization points
- Audience: Project setup and troubleshooting

## Block-Specific Files

### Implementation Files (Agent-Created)

Each block creates files matching its domain:

**Block 1 - Frontend:**

```
apps/[app]/src/
├── components/
│   ├── Component1.tsx
│   ├── Component1.css
│   └── ...
├── hooks/
│   ├── useHook1.ts
│   └── ...
└── styles/
    └── ...
```

**Block 2 - Backend:**

```
apps/api/src/
├── routes/
│   ├── [route].ts
│   └── ...
├── services/
│   ├── [service].ts
│   └── ...
└── middleware/
    └── ...
```

**Block 3 - Security/Compliance:**

```
packages/security/src/
├── crypto/
│   ├── hash-chain.ts
│   └── ...
└── compliance/
    ├── gdpr.ts
    └── ...

claudedocs/
├── SECURITY_ARCHITECTURE.md
├── THREAT_MODEL.md
├── GDPR_CHECKLIST.md
└── ...
```

**Block 4 - Database:**

```
packages/database/src/
├── migrations/
│   ├── 001_initial.sql
│   └── ...
├── services/
│   ├── auth-service.ts
│   └── ...
└── models/
    └── ...

scripts/migrations/
├── 001_initial_schema.sql
└── ...
```

**Block 5 - Testing:**

```
apps/[app]/__tests__/
├── component.test.tsx
├── ...
└── ...

packages/[package]/__tests__/
├── service.test.ts
└── ...

e2e/
├── performance.spec.ts
└── ...
```

**Block 6 - Security & Compliance:**

```
claudedocs/
├── SECURITY_ARCHITECTURE.md
├── THREAT_MODEL.md
├── GDPR_CHECKLIST.md
├── ISO_27001_MAPPING.md
├── SOC2_COMPLIANCE.md
└── REMEDIATION_PLAN.md

packages/security/src/
└── security-hardening.ts
```

## File Relationships

```
Execution Flow:
┌─────────────────────────────────────┐
│ Agent Brief (.cursor/agents/*.md)   │
│ (Documentation of work)             │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ GitHub Actions Workflow             │
│ (.github/workflows/agent-*.yml)     │
│ (Execution of work)                 │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Implementation Files                │
│ (app/*/src/*, packages/*/src/*, etc)│
│ (Deliverables)                      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Pull Request to Main                │
│ (Created by agent workflow)         │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Orchestrator Workflow               │
│ (Quality validation, merge)         │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Kanban Board Update                 │
│ (project_dashboard.html)            │
│ (Progress visibility)               │
└─────────────────────────────────────┘
```

## Required vs Optional Files

### Required for Any Project

- `.github/workflows/agent-block-*.yml` (at least 1)
- `.cursor/agents/agent-*.md` (at least 1)
- `project_dashboard.html`
- `README.md`

### Highly Recommended

- `.cursor/AGENT_PROGRESS_TRACKER.md`
- `hanspedder-orchestrator.yml`
- `claudedocs/ARCHITECTURE.md`
- `GITHUB_PROJECT_TEMPLATE.md`

### Optional (Domain-Specific)

- `claudedocs/SECURITY_ARCHITECTURE.md` (security-focused projects)
- `claudedocs/COMPLIANCE_*.md` (regulated industries)
- `e2e/performance.spec.ts` (performance-critical projects)
- `scripts/migrations/` (database-heavy projects)

## Customization Checklist

- [ ] Update agent names (in briefs and workflows)
- [ ] Update email domains (in workflows)
- [ ] Update branch names (in workflows)
- [ ] Update kanban board with project blocks
- [ ] Update story point allocations
- [ ] Update timeline and dates
- [ ] Update file paths to match your structure
- [ ] Update technology stack specifics
- [ ] Update quality gate thresholds
- [ ] Update compliance requirements (if any)

## Common Patterns

### Adding a New Block

1. Create `.cursor/agents/agent-name.md` with brief
2. Create `.github/workflows/agent-block-X-name.yml` with workflow
3. Add to orchestrator's workflow list
4. Add to kanban board
5. Document dependencies
6. Update progress tracker

### Removing a Block

1. Delete `.cursor/agents/agent-name.md`
2. Delete `.github/workflows/agent-block-X-name.yml`
3. Remove from orchestrator
4. Remove from kanban board
5. Update dependent blocks

### Changing Block Dependencies

1. Update workflow trigger: `workflow_run` section
2. Update agent brief: timeline and start date
3. Update progress tracker: wave assignments
4. Test dependency chain

## Quick Reference

### File Update Frequency

- Agent briefs: Once at phase start (rarely changed)
- Workflows: Once per project
- Progress tracker: Every 1-2 hours during execution
- Kanban board: After each PR merge
- Implementation files: Continuously during execution

### Merge Commit Pattern

Each merged block should have:

- Clear commit message listing deliverables
- Reference to story points
- Quality metrics (coverage, performance, etc.)
- Status: Ready for production

### PR Description Pattern

Each PR should include:

- Agent name
- Block number and title
- Story points
- Deliverables checklist
- Quality metrics
- Performance/security notes

---

**Document Version**: 1.0
**Status**: Ready for Reuse
**Last Updated**: 2025-11-17
