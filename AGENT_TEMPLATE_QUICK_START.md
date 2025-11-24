# Agent Template Quick Start Guide

Fast reference for setting up a new project using the agent-based methodology.

## IMPORTANT: Code Style Rules

**EMOJIS ARE STRICTLY FORBIDDEN** in all code, comments, documentation, and commit messages. Never use emojis anywhere in the codebase.

## 30-Second Overview

This template enables parallel development by:

1. Breaking your project into 3-7 **blocks** (major features)
2. Assigning each block to an **agent** (AI specialist)
3. Agents work **simultaneously** on feature branches
4. Results are **automatically merged** and tracked on a kanban board

**Result**: 40+ hours of work → 10-12 hours elapsed time

## 5-Minute Setup

### Step 1: Define Your Blocks (5 min)

List 3-7 major work areas:

- What are the key components?
- What can be done in parallel?
- What has hard dependencies?

**Example for E-Commerce:**

- Block 1: Frontend (UI components, pages)
- Block 2: Backend API (endpoints, services)
- Block 3: Database (schema, migrations)
- Block 4: Authentication (login, tokens)
- Block 5: Testing (unit, integration, E2E)

### Step 2: Create One Agent Brief (5 min)

Copy template to `.cursor/agents/agent-name.md`:

```markdown
# AgentName Specialist

**Domain**: [Feature Area]
**Assignment**: Block 1 - [Feature Name] (X story points)
**Status**: QUEUED

## Mission

[One sentence describing the work]

## Tasks (X story points)

### Task 1.1: [Task Name] (X pts)

**Priority**: CRITICAL | **Time**: X hours

**Deliverables**:

- [ ] Build component
- [ ] Add styling
- [ ] Write tests

**Acceptance Criteria**:

- Component renders
- All tests pass
- <100KB bundle size

**Status**: QUEUED

## Timeline

- Start: Now
- Target: [Time] (X hours)
- Checkpoint: Every 2 hours
```

### Step 3: Create One Workflow (5 min)

Copy `.github/workflows/agent-block-1-name.yml`:

**Key sections:**

```yaml
name: Agent Block 1 - [Feature Name]

on:
  workflow_dispatch:

env:
  AGENT_NAME: AgentName
  BLOCK: 1
  STORY_POINTS: X
  BRANCH: agent/block-1-feature

jobs:
  execute-block-1:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - name: Create agent branch
        run: |
          git config user.name "AgentName"
          git config user.email "agent-block-1@domain.dev"
          git checkout -b ${{ env.BRANCH }}

      - name: Task 1.1: [Task Name] (X pts)
        run: |
          mkdir -p path/to/files
          cat > file.ts << 'EOF'
          [Your implementation code here]
          EOF
          git add file.ts

      - name: Commit Block 1
        run: |
          git commit -m "Block 1: [Feature] - AgentName

          Completed:
          - Task 1.1: [Description]
          - Task 1.2: [Description]

          Status: Ready for merge"

      - name: Push to agent branch
        run: git push -u origin ${{ env.BRANCH }} --force

      - name: Create Pull Request
        uses: actions/create-pull-request@v5
        with:
          title: 'Block 1: [Feature] [READY FOR MERGE]'
          body: |
            **Agent**: AgentName
            **Block**: 1
            **Story Points**: X

            ### Deliverables
            - [x] Task 1.1
            - [x] Task 1.2
          branch: ${{ env.BRANCH }}
```

### Step 4: Update Kanban (5 min)

Edit `project_dashboard.html`:

- Update block names
- Update story point totals
- Keep 4 columns (TO DO, IN PROGRESS, BLOCKED, COMPLETED)

### Step 5: Copy Progress Tracker (2 min)

Copy `.cursor/AGENT_PROGRESS_TRACKER.md`, update:

- Agent names
- Block names and story points
- Timeline dates
- Wave assignments

## Full Setup (1 Hour)

1. **Define all blocks** (10 min)
   - List 3-7 work areas
   - Identify dependencies
   - Assign story points

2. **Create all agent briefs** (20 min)
   - One brief per block
   - Clear tasks and criteria
   - Timeline and dependencies

3. **Create all workflows** (20 min)
   - One workflow per block
   - Full implementation code
   - Quality metrics

4. **Initialize board** (5 min)
   - Kanban board with all blocks
   - Progress tracker
   - Instructions doc

5. **Test orchestrator** (5 min)
   - Copy orchestrator workflow
   - Verify configuration
   - Ready for execution

## Running Your First Execution

### Pre-Execution Checklist

- [ ] All agent briefs created
- [ ] All workflows created
- [ ] Kanban board initialized
- [ ] Progress tracker ready
- [ ] Branch protection rules configured
- [ ] GitHub Actions enabled
- [ ] Secrets configured (if needed)

### Execution

1. Manually trigger workflows:
   - Start Wave 1 agents (no dependencies)
   - Wait for Wave 1 to complete
   - Start Wave 2 agents (with dependencies)

2. Monitor progress:
   - Watch progress tracker updates
   - Check kanban board changes
   - Review PR quality metrics

3. Let orchestrator handle merges:
   - Orchestrator discovers PRs
   - Validates quality gates
   - Approves and merges
   - Updates kanban board

### Post-Execution

1. Verify all work on main branch
2. Document lessons learned
3. Update template for next project
4. Plan Phase 2 or next sprint

## Common Block Patterns

### Web Application (5 blocks)

```
Block 1: Frontend UI Components
Block 2: Backend API
Block 3: Database
Block 4: Testing Suite
Block 5: Deployment
```

### Mobile App (4 blocks)

```
Block 1: iOS App
Block 2: Android App
Block 3: Backend API
Block 4: Testing & Deployment
```

### Data Pipeline (4 blocks)

```
Block 1: Data Ingestion
Block 2: Processing & ETL
Block 3: Storage & Analytics
Block 4: Visualization & Reporting
```

### Microservices (6 blocks)

```
Block 1: Service 1
Block 2: Service 2
Block 3: Service 3
Block 4: API Gateway
Block 5: Database & Cache
Block 6: Testing & Deployment
```

## Dependency Patterns

### All Parallel (Fastest)

```
Blocks 1-5 start immediately
No dependencies
Elapsed time = longest single block
```

### Sequential (Slowest)

```
Block 1 → Block 2 → Block 3 → Block 4 → Block 5
Elapsed time = sum of all blocks
```

### Optimal Mixed (Recommended)

```
Wave 1 (Parallel):
  Block 1 (Frontend UI)
  Block 2 (Backend API)
  Block 3 (Database)
  Block 4 (Testing - depends on 1,2,3)

Wave 2 (Parallel):
  Block 5 (Integration - depends on 1,2,3,4)
  Block 6 (Deployment - depends on 5)
```

## File Checklist for New Project

### Essential Files

```
.github/workflows/
├── agent-block-1-*.yml
├── agent-block-2-*.yml
└── hanspedder-orchestrator.yml

.cursor/
├── agents/
│   ├── agent-1.md
│   ├── agent-2.md
│   └── orchestrator.md
├── AGENT_PROGRESS_TRACKER.md
└── PHASE_ACTIVATION_LOG.md

project_dashboard.html
README.md
```

### Recommended Files

```
claudedocs/
├── ARCHITECTURE.md
├── PROJECT_PLAN.md

.github/SECURITY.md
GITHUB_PROJECT_TEMPLATE.md
TEMPLATE_STRUCTURE.md
```

### Domain-Specific Files

```
claudedocs/
├── SECURITY_ARCHITECTURE.md (security projects)
├── GDPR_CHECKLIST.md (data handling)
├── COMPLIANCE_*.md (regulated industries)

scripts/
├── migrations/ (database projects)
├── setup/ (deployment projects)
```

## Customization Points

**Before Starting Project:**

- [ ] Agent names and domains
- [ ] Block titles and descriptions
- [ ] Story point estimates
- [ ] Timeline and dates
- [ ] Technology stack
- [ ] Quality gate thresholds

**Before Execution:**

- [ ] Verify all workflows syntactically correct
- [ ] Check branch naming consistent
- [ ] Confirm agent email domains work
- [ ] Validate workflow triggers
- [ ] Test GitHub Actions permissions

**During Execution:**

- [ ] Monitor progress tracker updates
- [ ] Track kanban board status
- [ ] Review PR quality metrics
- [ ] Adjust timelines if needed

## Troubleshooting

### Workflow Not Triggering

- Check `on:` condition matches previous workflow name
- Verify `workflow_dispatch` enabled for manual triggers
- Check GitHub Actions permissions

### PRs Not Being Created

- Verify `uses: actions/create-pull-request@v5` syntax
- Check GitHub token has write permissions
- Ensure branch name doesn't exist

### Kanban Not Updating

- Verify orchestrator has write permissions
- Check HTML structure matches update script
- Test manually updating to verify structure

### Quality Gates Failing

- Review acceptance criteria for each task
- Check test coverage thresholds
- Verify performance benchmarks

## Performance Metrics

Track for optimization:

| Metric                 | Target  | Typical   | Notes                          |
| ---------------------- | ------- | --------- | ------------------------------ |
| Parallel efficiency    | 70%+    | 60-75%    | Time saved by parallelization  |
| Merge success rate     | 95%+    | 90-98%    | % of PRs merged without issues |
| Quality gate pass rate | 95%+    | 85-95%    | % of PRs passing checks        |
| Average PR review time | <1 hour | 30-90 min | Time from PR to merge          |

## Advanced Usage

### Multi-Wave Execution

- Define Wave 1 (no dependencies)
- Wait for Wave 1 completion
- Trigger Wave 2 (depends on Wave 1)
- Scale to 3-4 waves for complex projects

### Conditional Blocks

- Use `workflow_run` to create sequential workflows
- Multiple workflows can wait for same upstream
- Enable complex dependency graphs

### Sub-Blocks

- Create sub-agents within a block
- Use separate workflows for each sub-block
- Merge sub-results before creating block PR

### Automated Rollback

- Keep feature branches available
- Add rollback workflow if needed
- Document rollback procedures

## Integration with CI/CD

### Pre-Merge Testing

1. Agent workflow creates PR
2. GitHub Actions runs tests automatically
3. Status checks block merge if tests fail
4. Orchestrator only merges after checks pass

### Post-Merge Deployment

1. Main branch updated
2. Trigger deployment workflow
3. Deploy to staging first
4. Manual promotion to production

### Monitoring

- Track metrics in observability tool
- Set up alerts for failures
- Post metrics to dashboard

## Next Steps

1. **Now**: Study the WidgetTDC project implementation
2. **Tomorrow**: Copy template to your project
3. **This week**: Customize for your first blocks
4. **Next week**: Run Phase 1 execution
5. **Next month**: Optimize based on results

## Resources

- `GITHUB_PROJECT_TEMPLATE.md` - Detailed customization guide
- `TEMPLATE_STRUCTURE.md` - Directory layout reference
- WidgetTDC project - Full working example
- Agent briefs - Real examples of task definition
- Workflow files - Real implementation patterns

## Support

For questions:

1. Check template documentation
2. Review WidgetTDC implementation
3. Study existing agent briefs
4. Examine working workflows
5. Test with small pilot first

---

**Quick Start Version**: 1.0
**Status**: Ready to Use
**Time to First Execution**: 1-2 hours
**Time to Production**: 10-12 hours (6 parallel agents)
