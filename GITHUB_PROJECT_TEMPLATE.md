# GitHub Agent-Based Project Template

This document describes the generic project template used in the WidgetTDC project that enables rapid development through autonomous agent teams.

## Overview

This template implements an agent-based development methodology where specialized AI agents work in parallel on different project blocks, coordinated through GitHub Actions workflows and managed via a kanban board.

## Architecture

### Components

1. **Agent Briefs** (`.cursor/agents/*.md`)
   - Individual specialist documentation
   - Clear task definitions and acceptance criteria
   - Timeline and dependencies
   - Agent-specific expertise focus

2. **GitHub Actions Workflows** (`.github/workflows/agent-*.yml`)
   - Executable agent implementations
   - Fully autonomous task execution
   - Feature branch creation and commits
   - PR creation with deliverables

3. **Orchestrator** (`.github/workflows/hanspedder-orchestrator.yml`)
   - Coordinates agent PRs
   - Quality validation
   - Merge coordination
   - Kanban board updates

4. **Project Dashboard** (`project_dashboard.html`)
   - Kanban board (TO DO | IN PROGRESS | BLOCKED | COMPLETED)
   - Real-time task status tracking
   - Visual progress monitoring

5. **Progress Tracking** (`.cursor/AGENT_PROGRESS_TRACKER.md`)
   - Live status table
   - Checkpoint tracking
   - Communication protocol
   - Integration points

## How to Adapt for Your Project

### Step 1: Define Your Project Blocks

Identify 3-7 major work blocks that can be completed in parallel or with minimal dependencies:

```
Block 1: Core Infrastructure (Lead Agent 1) - X story points
Block 2: Feature Set A (Lead Agent 2) - Y story points
Block 3: Feature Set B (Lead Agent 3) - Z story points
...
```

### Step 2: Create Agent Briefs

For each block, create a brief in `.cursor/agents/agent-name.md`:

**Template:**

```markdown
# [AgentName] Specialist

**Domain**: [Domain Area]
**Assignment**: Block [X] - [Block Title] ([Points] pts)
**Status**: 🟡 QUEUED (or 🟢 ACTIVE)
**Start**: [Date] - [Time] UTC

## Mission

[One sentence describing the work]

## Tasks ([Total] story points)

### [Task 1] ([Points] pts)

**Priority**: CRITICAL | **Time**: [X] hours

**Deliverables**:

- [ ] Item 1
- [ ] Item 2

**Acceptance Criteria**:

- Criterion 1
- Criterion 2

**Status**: QUEUED

[Continue for each task...]

## Timeline

- Start: [Time] UTC
- Target: [Time] UTC ([X] hours)
- Checkpoint: Every 2 hours
```

### Step 3: Create GitHub Actions Workflows

For each block, create `.github/workflows/agent-block-X.yml`:

**Template Structure:**

```yaml
name: 📋 Agent Block [X] - [Block Title]

on:
  workflow_dispatch:
  workflow_run:
    workflows: ["🎨 Agent Block [Dependency]"]
    types: [completed]

env:
  AGENT_NAME: AgentName
  BLOCK: [X]
  STORY_POINTS: [Points]
  BRANCH: agent/block-[X]-description

jobs:
  execute-block-[X]:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4
      - name: 🌿 Create agent branch
        run: |
          git config user.name "[AgentName]"
          git config user.email "agent-block-[X]@yourdomain.dev"
          git checkout -b ${{ env.BRANCH }} || git checkout ${{ env.BRANCH }}

      - name: 📝 Task [X].1: [Task Name] ([Points] pts)
        run: |
          # Create directories
          mkdir -p [path]/[to]/[files]

          # Create implementation files
          cat > [file.ts] << 'EOF'
          [Full implementation code]
          EOF

          git add [file.ts]

      [Repeat for each task...]

      - name: ✅ Commit Block [X]
        run: |
          git commit -m "📋 Block [X]: [Block Title] ([Points] pts) - [AgentName]

          Completed:
          [List all deliverables]

          Features:
          [Key features]

          Status: Ready for merge review"

      - name: 🚀 Push to agent branch
        run: git push -u origin ${{ env.BRANCH }} --force

      - name: 📢 Create Pull Request
        uses: actions/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          title: '✅ Block [X]: [Block Title] [READY FOR MERGE]'
          body: |
            **Agent**: [AgentName]
            **Block**: [X] - [Block Title]
            **Story Points**: [Points]
            **Status**: ✅ COMPLETE

            ### Deliverables
            - [x] [X].1: [Task] ([Points] pts)

            ### Quality
            - Test Coverage: [%]+
            - Performance: [Metrics] ✅

            Assigned to: HansPedder for review & merge
          branch: ${{ env.BRANCH }}
```

### Step 4: Configure Kanban Board

Update `project_dashboard.html` with your project blocks:

**Column Structure:**

- **TO DO**: Unstarted tasks
- **IN PROGRESS**: Active tasks
- **BLOCKED**: Dependent tasks awaiting completion
- **COMPLETED**: Finished tasks

**Data Structure:**

```html
<div class="kanban-column" data-status="todo">
  <div class="kanban-card" data-block="1">
    <span class="block-name">Block 1: [Task]</span>
    <span class="story-points">[X] pts</span>
    <span class="status-badge">TO DO</span>
  </div>
</div>
```

### Step 5: Create Progress Tracker

Create `.cursor/AGENT_PROGRESS_TRACKER.md`:

**Template:**

```markdown
# Phase [X] Progress Tracker - Real-Time Status

## Live Status Dashboard

| Block | Agent   | Task   | Story Points | Status    | Start | ETA | % Complete |
| ----- | ------- | ------ | ------------ | --------- | ----- | --- | ---------- |
| 1     | [Agent] | [Task] | [Pts]        | 🟡 QUEUED | -     | -   | 0%         |
| 2     | [Agent] | [Task] | [Pts]        | 🟡 QUEUED | -     | -   | 0%         |

## Wave 1 Parallelization (START NOW)

Blocks: 1, 2, 4, 5, 6 (all start simultaneously at [TIME] UTC)
Dependencies: None

## Wave 2 (START AFTER BLOCK [X])

Blocks: 3, 7 (wait for Block 1 completion)
Dependencies: Block 1.1 completion required

## Checkpoint Schedule

- Checkpoint 1: [Date] [Time] (after 2 hours)
- Checkpoint 2: [Date] [Time] (after 4 hours)
- Checkpoint 3: [Date] [Time] (after 6 hours)
- Final: [Date] [Time] (end of wave)

## Integration Points

[Describe where blocks integrate and how dependencies flow]
```

### Step 6: Create Orchestrator Workflow

The orchestrator workflow (`hanspedder-orchestrator.yml`) handles:

- Discovery of agent PRs
- Quality validation
- Approval and merge
- Kanban board updates

This remains the same across projects, just update the list of agent names and blocks.

## Customization Guide

### For Different Project Types

#### Web Application Project

```
Block 1: Frontend/UI (Designer Agent)
Block 2: Backend API (Backend Agent)
Block 3: Database (DB Agent)
Block 4: Testing (QA Agent)
Block 5: Deployment (DevOps Agent)
```

#### Mobile Application Project

```
Block 1: iOS App (iOS Agent)
Block 2: Android App (Android Agent)
Block 3: Backend API (Backend Agent)
Block 4: Cloud Functions (Cloud Agent)
Block 5: Analytics (Analytics Agent)
```

#### ML/Data Science Project

```
Block 1: Data Pipeline (Data Agent)
Block 2: Model Development (ML Agent)
Block 3: Evaluation & Optimization (Research Agent)
Block 4: Deployment (DevOps Agent)
Block 5: Monitoring (Ops Agent)
```

### Configuration Points

**Per-Project Customization:**

1. Agent names and email domains
2. Block titles and descriptions
3. Story point allocations
4. Task dependencies
5. Timeline and dates
6. File paths and project structure
7. Technology stack specifics
8. Quality gate thresholds

**Minimal Customization (Reuse Most):**

1. Kanban board (copy, update block names)
2. Progress tracker (copy, update agents/blocks)
3. Orchestrator workflow (copy, update agent names)
4. Automation scripts (usually generic)

## Integration with Existing Workflows

### Git Strategy

- Agents work on feature branches: `agent/block-X-description`
- PRs created for each agent deliverable
- Orchestrator merges to `main` after quality validation
- Main branch stays production-ready

### Branch Protection

```yaml
main:
  - Require pull request reviews before merging
  - Require status checks to pass (CI/CD)
  - Restrict who can push to matching branches
  - Dismiss stale PR approvals
```

### CI/CD Integration

- GitHub Actions run on every commit
- Tests execute automatically
- Coverage reports generated
- Merge only after all checks pass

## Scalability

### For Larger Projects

- Increase number of blocks (up to 10-12 recommended)
- Create sub-blocks with their own agent teams
- Use multiple waves of parallel execution
- Implement inter-block dependencies carefully

### For Faster Projects

- Reduce number of blocks (3-4 minimum)
- Eliminate or combine dependent tasks
- Increase parallelization (all blocks at once)
- Reduce checkpoint frequency

### For Complex Projects

- Create detailed dependency graphs
- Define clear integration points
- Implement comprehensive testing between blocks
- Use separate QA/validation agents
- Add complexity in Block definitions

## Reuse Checklist

When starting a new project with this template:

- [ ] Define project blocks and agents
- [ ] Create agent briefs (`.cursor/agents/*.md`)
- [ ] Create GitHub Actions workflows (`.github/workflows/agent-*.yml`)
- [ ] Update kanban board (`project_dashboard.html`)
- [ ] Create progress tracker (`.cursor/AGENT_PROGRESS_TRACKER.md`)
- [ ] Create orchestrator workflow
- [ ] Set up git branch protection rules
- [ ] Configure GitHub Actions permissions
- [ ] Update CI/CD status checks
- [ ] Document project-specific integration points
- [ ] Prepare for Phase 1 execution

## Success Metrics

Track these metrics across projects:

- **Velocity**: Story points completed per time unit
- **Quality**: Test coverage %, bugs found in review
- **On-Time**: % of blocks completed on schedule
- **Parallelization**: Actual vs theoretical time savings
- **Agent Effectiveness**: Avg story points per agent per project

## Template Maintenance

This template should be updated when:

- New automation techniques discovered
- Workflow inefficiencies identified
- Tool improvements available
- Process optimizations proven
- Technology stack changes

## Quick Start

To use this template for a new project:

1. Copy this document to your new project
2. Follow the "Adapt for Your Project" steps
3. Create 3-7 project blocks
4. Write agent briefs
5. Generate GitHub Actions workflows
6. Initialize kanban board
7. Run orchestration

**Estimated setup time**: 4-8 hours for experienced users, 1-2 days for new users.

## Support

For questions or improvements to this template:

- Review the WidgetTDC project implementation
- Check agent brief examples
- Examine workflow patterns
- Study orchestrator logic

---

**Template Version**: 1.0
**Last Updated**: 2025-11-17
**Status**: Production Ready
