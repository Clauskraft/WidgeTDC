# PR Orchestration Agent Configuration

**Purpose**: Automate PR management, conflict resolution, and deployment to main branch

## Agent Capabilities

### 1. PR Monitoring & Classification
```yaml
pr_monitoring:
  poll_interval: "30 minutes"
  actions:
    - detect_new_prs
    - classify_by_impact: ["security", "data", "conflicts", "features"]
    - check_mergability
    - identify_blockers
```

### 2. Priority-Based Merge Strategy
```yaml
merge_strategy:
  phase_1_critical:
    - security_vulnerabilities (IMMEDIATE)
    - data_integrity_issues (IMMEDIATE)
    - blocking_conflicts (URGENT)

  phase_2_important:
    - dependency_updates
    - critical_fixes
    - backend_improvements

  phase_3_features:
    - feature_additions
    - ui_improvements
    - documentation
```

### 3. Conflict Resolution Rules
```yaml
conflict_resolution:
  automatic_merges:
    - "accept_main_on: [index.ts, package.json, agent-state.json]"
    - "accept_pr_on: [component files, service files]"

  resolution_strategies:
    - "for_simple_conflicts: auto-resolve"
    - "for_complex_conflicts: require_review"

  post_resolution:
    - commit_message: "chore: Resolve merge conflicts via orchestration agent"
    - push_to_branch
    - retry_merge
```

### 4. Automated Merge Flow
```yaml
merge_flow:
  pre_merge:
    - verify_not_draft
    - ensure_mergeable
    - run_basic_checks

  merge_execution:
    - mark_ready_if_draft
    - resolve_conflicts
    - squash_merge
    - delete_branch

  post_merge:
    - verify_in_main
    - run_tests (async)
    - report_status
```

### 5. Status Reporting
```yaml
reporting:
  channels:
    - pr_comments: "Update PR with status"
    - git_commits: "Auto-generated commit messages"
    - console_output: "Real-time merge progress"

  templates:
    successful_merge: |
      ✅ PR merged to main
      Conflicts resolved: {{conflicts_count}}
      Files affected: {{files_count}}

    failed_merge: |
      ❌ Merge failed - manual review needed
      Blocker: {{blocker_reason}}
      Branch: {{branch_name}}
```

## Deployment Readiness Checklist

### Prerequisites
- [ ] Main branch has 3+ critical PRs merged (security, data, conflicts)
- [ ] Dependencies installed: `npm install --legacy-peer-deps`
- [ ] TypeScript compilation successful
- [ ] Build passes: `npm run build`

### Test Requirements
- [ ] Backend services start without errors
- [ ] MCP gateway WebSocket initializes
- [ ] API endpoints respond
- [ ] No critical ESLint warnings

### Deployment Steps
```bash
# 1. Verify main is clean
git log --oneline -5
git status

# 2. Build project
npm run build:shared
npm run build

# 3. Run tests
npm run test:run

# 4. Tag release
git tag -a v1.0.0-deployment -m "Deployment release with PR orchestration"
git push origin main --tags

# 5. Ready for deployment
echo "✅ Main branch ready for deployment"
```

## Configuration for Agent Systems

### For Claude Code Agents
```javascript
const prOrchestratorConfig = {
  mode: "autonomous",
  strategy: "priority-based-merge",
  conflictHandling: "auto-resolve-with-verification",
  reportingInterval: "30min",

  rules: {
    security: { priority: 1, autoMerge: true },
    dataIntegrity: { priority: 2, autoMerge: true },
    conflicts: { priority: 3, autoMerge: true },
    features: { priority: 4, autoMerge: false }
  }
};
```

### For GitHub Actions
```yaml
name: PR Orchestration

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes

jobs:
  orchestrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run PR Orchestrator
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr list --state open --json number,title,isDraft |
          ./scripts/pr-orchestrator.sh
```

## Next: Automated PR Management

Future enhancements:
1. ✅ Automatic conflict detection and resolution
2. ✅ Priority-based merge ordering
3. 🔲 Integration with CI/CD pipeline
4. 🔲 Slack/Discord notifications
5. 🔲 PR review automation
6. 🔲 Dependency update management
7. 🔲 Performance impact analysis

## Critical Success Factor

**The agent must:**
- Resolve 95%+ of conflicts automatically
- Merge in correct priority order
- Never break main branch
- Provide clear status reports
- Handle edge cases gracefully

---

**Last Updated**: 2025-11-19
**Status**: Ready for deployment
**Maintained By**: Claude Code with Cursor Integration
