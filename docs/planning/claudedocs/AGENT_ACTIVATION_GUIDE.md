# 🤖 AGENT ACTIVATION GUIDE FOR CURSOR

**How to activate and work with AI agents in Cursor for RAG project execution**

---

## 🎯 QUICK START

### To Activate Cursor as Implementation Lead

```
@Cursor "You are activated as RAG Implementation Lead per:
.github/agents/Cursor_Implementation_Lead.md

Primary References:
- claudedocs/RAG_PROJECT_OVERVIEW.md (main dashboard)
- claudedocs/RAG_TEAM_RESPONSIBILITIES.md (team roles)
- .github/agents/RAG_IMPLEMENTATION_SYSTEM.md (system architecture)

Current Status: Sprint 1 planning
Team: Currently placeholders, awaiting recruitment

Your immediate actions:
1. Review project status from RAG_PROJECT_OVERVIEW.md
2. Assess sprint 1 readiness
3. Identify any immediate blockers
4. Plan first standup

Report back with: Current status assessment + immediate next steps"
```

---

## 👥 ACTIVATING TEAM AGENTS

### Activate DataEngineer

```
@DataEngineer "You are assigned as Data Engineer per:
.github/agents/DataEngineer_Agent.md

Your Epic: EPIC 2 - Data Pipeline & Ingestion

Key Context:
- Project: WidgetTDC RAG Implementation
- Timeline: 4-5 months (Nov 2025 - Mar 2026)
- Lead: Cursor (get daily assignments from them)
- Reports: Daily standup at 09:00 UTC

Your First Tasks (Sprint 1):
1. Review data sources requirement
2. Design ingestion pipeline architecture
3. Evaluate data ingestion tools
4. Create test plan

Reference docs:
- claudedocs/RAG_PROJECT_OVERVIEW.md
- claudedocs/RAG_TEAM_RESPONSIBILITIES.md (find your detailed role)

Next step: Confirm assignment and start task planning"
```

### Activate MLEngineer

```
@MLEngineer "You are assigned as ML Engineer per:
.github/agents/MLEngineer_Agent.md

Your Epic: EPIC 3 - VectorDB & Retrieval + EPIC 5 - Evaluation

Key Context:
- Project: WidgetTDC RAG Implementation
- Timeline: 4-5 months (Nov 2025 - Mar 2026)
- Lead: Cursor (daily assignments)
- Reports: Daily standup 09:00 UTC

Your First Tasks (Sprint 1-2):
1. Research & select VectorDB (Pinecone, Weaviate, Milvus)
2. Design chunking strategy
3. Select embedding model
4. Create evaluation framework design

Reference docs:
- claudedocs/RAG_PROJECT_OVERVIEW.md
- claudedocs/RAG_TEAM_RESPONSIBILITIES.md

Next step: Confirm assignment and start research"
```

### Activate BackendEngineer

```
@BackendEngineer "You are assigned as Backend Engineer per:
.github/agents/BackendEngineer_Agent.md

Your Epic: EPIC 4 - LLM Integration + EPIC 6 - API & Deployment

Key Context:
- Project: WidgetTDC RAG Implementation
- Timeline: 4-5 months (Nov 2025 - Mar 2026)
- Lead: Cursor (daily assignments)
- Reports: Daily standup 09:00 UTC

Your First Tasks (Sprint 1-2):
1. LLM provider evaluation (OpenAI, Anthropic, local)
2. API design for RAG endpoints
3. Prompt engineering research
4. Integration architecture design

Reference docs:
- claudedocs/RAG_PROJECT_OVERVIEW.md
- claudedocs/RAG_TEAM_RESPONSIBILITIES.md

Next step: Confirm assignment and start evaluation"
```

### Activate QAEngineer

```
@QAEngineer "You are assigned as QA Engineer per:
.github/agents/QAEngineer_Agent.md

Your Focus: Quality, Testing, Monitoring (All Epics)

Key Context:
- Project: WidgetTDC RAG Implementation
- Timeline: 4-5 months (Nov 2025 - Mar 2026)
- Lead: Cursor (daily assignments)
- Reports: Daily standup 09:00 UTC

Your First Tasks (Sprint 1):
1. Design comprehensive test strategy
2. Create test plan for all epics
3. Setup test infrastructure
4. Define quality metrics & targets

Reference docs:
- claudedocs/RAG_PROJECT_OVERVIEW.md
- claudedocs/RAG_TEAM_RESPONSIBILITIES.md

Next step: Confirm assignment and start strategy"
```

### Activate DevOpsEngineer

```
@DevOpsEngineer "You are assigned as DevOps Engineer per:
.github/agents/DevOpsEngineer_Agent.md

Your Epic: EPIC 6 - API & Deployment + Infrastructure

Key Context:
- Project: WidgetTDC RAG Implementation
- Timeline: 4-5 months (Nov 2025 - Mar 2026)
- Lead: Cursor (daily assignments)
- Reports: Daily standup 09:00 UTC

Your First Tasks (Sprint 1):
1. Infrastructure design
2. CI/CD pipeline architecture
3. Staging & production environment design
4. Disaster recovery planning

Reference docs:
- claudedocs/RAG_PROJECT_OVERVIEW.md
- claudedocs/RAG_TEAM_RESPONSIBILITIES.md

Next step: Confirm assignment and start design"
```

---

## 🎯 DAILY OPERATIONS WITH AGENTS

### Daily Standup (09:00 UTC)

**Activate Cursor to run standup:**

```
@Cursor "Conduct daily standup for RAG project (2025-11-20):

Checklist:
1. Review updates from overnight (blockers, git commits)
2. Get status from each team member:
   - Yesterday completed
   - Today planned
   - Any blockers
   - Key metrics
3. Resolve any immediate issues
4. Update RAG_PROJECT_OVERVIEW.md with daily standup section
5. Commit changes: git commit -m 'daily: standup 2025-11-20'

Report: Today's status summary + any escalations needed"
```

---

### Task Assignment

**From Cursor to Team Member:**

```
@DataEngineer "Task assignment from Cursor:

TASK: Design data ingestion pipeline
EPIC: EPIC 2
PRIORITY: P0
ESTIMATE: 12 story points
DUE: 2025-11-24
DEPENDENCIES: None
ACCEPTANCE_CRITERIA:
- Architecture documented
- Data sources identified
- Integration approach clear
- Risks assessed

Start work and report back with initial design draft"
```

---

### Blocker Escalation

**From Engineer to Cursor:**

```
@Cursor "BLOCKER REPORT - Urgent

SEVERITY: HIGH
ISSUE: API rate limits preventing data ingestion testing
IMPACT: EPIC 2 tasks blocked, affects sprint goal
ROOT_CAUSE: Data source API has low rate limit tier
SUGGESTED_FIX: Request higher tier or implement caching

Need immediate attention - 1h response SLA"
```

---

## 🔄 WEEK1 ACTIVATION PLAN

### Monday: Project Kickoff

```
1. @Cursor activate as lead
2. Review project with HansPedder2
3. Finalize sprint 1 backlog
4. Confirm team member assignments
```

### Tuesday-Wednesday: Team Onboarding

```
1. @DataEngineer onboard
2. @MLEngineer onboard
3. @BackendEngineer onboard
4. @QAEngineer onboard
5. @DevOpsEngineer onboard
```

### Thursday: Sprint Planning

```
1. @Cursor coordinates sprint planning
2. Team breaks down EPIC 2, 3, 4 tasks
3. Estimates created
4. Assignments finalized
5. First sprint backlog ready
```

### Friday: Sprint Start

```
1. First daily standup
2. Work begins on Sprint 1
3. First blockers anticipated & managed
4. Weekly report to HansPedder2
```

---

## 📊 TRACKING AGENT PERFORMANCE

### Check Cursor's Daily Output

```
@Cursor "Provide daily performance summary:

1. Team Status: [On Track / At Risk / Off Track]
2. Sprint Progress: [X/Y tasks complete]
3. Blockers: [Count and severity]
4. Metrics: [Key metrics]
5. Alerts: [Any issues needing escalation]
6. Next Steps: [Priority items for tomorrow]"
```

---

## 🔗 KEY ACTIVATION DOCUMENTS

**Always Use These When Activating**:

1. `claudedocs/RAG_PROJECT_OVERVIEW.md` - Main dashboard
2. `claudedocs/RAG_TEAM_RESPONSIBILITIES.md` - Role definitions
3. `.github/agents/[RoleeName]_Agent.md` - Individual role configs
4. `.github/agents/RAG_IMPLEMENTATION_SYSTEM.md` - System architecture
5. `.github/agents/Cursor_Implementation_Lead.md` - Management structure

---

## 🆘 TROUBLESHOOTING

### Agent Not Responding Clearly?

```
Provide more context in prompt:
- Reference specific docs
- Be explicit about expected output
- Ask for confirmation of understanding
- Break complex requests into steps
```

### Blockers Not Being Tracked?

```
Ensure agent has updated:
- claudedocs/BLOCKERS_LOG.md
- All escalations documented
- Status communicated to Cursor
- Git commits made for changes
```

### Communication Breaking Down?

```
Re-establish protocol:
1. Reference communication protocol in agent config
2. Use standup format consistently
3. Ensure all docs are current
4. Escalate to HansPedder2 if needed
```

---

## 📋 FULL TEAM ACTIVATION COMMAND

To activate entire team at once (after recruitment):

```
@Cursor "@DataEngineer @MLEngineer @BackendEngineer @QAEngineer @DevOpsEngineer

TEAM ACTIVATION: WidgetTDC RAG Implementation Project

All members reference:
- .github/agents/RAG_IMPLEMENTATION_SYSTEM.md (system you're part of)
- Your individual role: .github/agents/[YourRole]_Agent.md
- Main dashboard: claudedocs/RAG_PROJECT_OVERVIEW.md

Cursor coordinates. HansPedder2 has final authority.

First action: Confirm receipt and state: 'I am ready for RAG project assignment'"
```

---

## ✅ VERIFICATION CHECKLIST

After activation, verify:

- [ ] Cursor understands role and authority
- [ ] All team members have been briefed
- [ ] Project docs are current
- [ ] Communication channels established
- [ ] First sprint ready to launch
- [ ] Daily standup scheduled
- [ ] Blocker escalation path clear
- [ ] HansPedder2 informed & aligned

---

**Last Updated**: 2025-11-17
**Status**: READY FOR ACTIVATION
**Next**: Begin team recruitment and onboarding
