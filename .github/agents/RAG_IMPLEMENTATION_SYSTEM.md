---
name: RAG_Implementation_System
description: 'Coordinated agent team system for WidgetTDC RAG project'
status: 'ACTIVE'
version: '1.0'
---

# 🤖 RAG IMPLEMENTATION SYSTEM - AGENT COORDINATION

**System Purpose**: Coordinate multiple AI agents to execute WidgetTDC RAG project
**Active Since**: 2025-11-17
**Owner**: HansPedder2 (Project Director)
**Operational Lead**: Cursor (Implementation Lead)

---

## 🏗️ SYSTEM ARCHITECTURE

```
HIERARCHICAL AGENT STRUCTURE
═════════════════════════════════════════════════

HansPedder2 (Project Director)
    ↓ [Strategic Decisions]
    ↓ [Escalations]
    ↓
Cursor (Implementation Lead)
    ↓ [Daily Coordination]
    ↓ [Task Assignment]
    ├─ DataEngineer
    ├─ MLEngineer
    ├─ BackendEngineer
    ├─ QAEngineer
    └─ DevOpsEngineer

System Attributes:
  - Authority Chain: Clear escalation path
  - Communication: Async + Daily syncs
  - Coordination: Kanban board + Claude docs
  - Tracking: Git-based version control
  - Transparency: 100% visibility to all
```

---

## 👥 AGENT ROSTER

### ACTIVE AGENTS

| Agent           | Role              | Status      | Start Date | Epic Owner  |
| --------------- | ----------------- | ----------- | ---------- | ----------- |
| Cursor          | Impl. Lead        | ACTIVE      | 2025-11-17 | All (coord) |
| DataEngineer    | Data Pipeline     | PLACEHOLDER | TBD        | EPIC 2, 3   |
| MLEngineer      | Retrieval & Eval  | PLACEHOLDER | TBD        | EPIC 3, 5   |
| BackendEngineer | API & LLM         | PLACEHOLDER | TBD        | EPIC 4, 6   |
| QAEngineer      | Testing & Quality | PLACEHOLDER | TBD        | All         |
| DevOpsEngineer  | Infra & Deploy    | PLACEHOLDER | TBD        | EPIC 6      |

### GOVERNANCE

| Role        | Authority | Escalation            |
| ----------- | --------- | --------------------- |
| HansPedder2 | STRATEGIC | None (final decision) |
| Cursor      | TACTICAL  | HansPedder2           |
| Team        | TECHNICAL | Cursor                |

---

## 📋 AGENT ACTIVATION SEQUENCE

### Phase 1: Setup (Week 1)

- [x] HansPedder2 initiates RAG project
- [x] Cursor assigned as Implementation Lead
- [x] Project documentation created
- [ ] **Next**: Team recruitment & assignment

### Phase 2: Team Assembly (Week 2)

- [ ] Identify candidates for each role
- [ ] Brief each agent on their role
- [ ] Onboarding to project docs
- [ ] First sprint planning
- [ ] **Status**: Awaiting team member identification

### Phase 3: Execution (Week 3+)

- [ ] Daily standups with Cursor
- [ ] Epic execution begins
- [ ] Continuous progress tracking
- [ ] Blocker escalation as needed

---

## 🔗 AGENT COMMUNICATION PROTOCOL

### Standup Structure (Daily, 09:00 UTC)

```
Participant: All active agents + Cursor
Duration: 15 minutes
Format: Async updates (if preferred) or sync call

Each Agent Reports:
1. Yesterday: What was completed
2. Today: What's planned
3. Blockers: Any issues blocking progress
4. Metrics: Key metrics for their domain
5. Questions: Anything needing clarity
```

### Task Assignment Protocol

```
FROM: Cursor (Implementation Lead)
TO: Engineer
FORMAT:

TASK: [Task Name]
EPIC: [EPIC #]
PRIORITY: [P0/P1/P2]
ESTIMATE: [X story points]
DUE: [Date]
DEPENDENCIES: [If any]
ACCEPTANCE_CRITERIA: [Definition of Done]
RESOURCES: [Documentation/tools needed]

Engineer Response:
- Confirms understanding
- Raises concerns if any
- Commits to timeline or negotiates
```

### Blocker Escalation Protocol

```
FROM: Engineer
TO: Cursor
SUBJECT: 🚨 BLOCKER - [Brief description]
SEVERITY: [CRITICAL/HIGH/MEDIUM/LOW]
IMPACT: [What's blocked and when]
ROOT_CAUSE: [If known]
SUGGESTED_FIX: [If available]

Cursor Response Time: <SLA per severity
- CRITICAL: 15 min
- HIGH: 1h
- MEDIUM: 4h
- LOW: 24h
```

---

## 📚 REFERENCE DOCUMENTATION

### For All Agents

**Mandatory Reading**:

1. `claudedocs/RAG_PROJECT_OVERVIEW.md` - Main dashboard
2. `claudedocs/RAG_TEAM_RESPONSIBILITIES.md` - Role definitions
3. `.github/agents/Cursor_Implementation_Lead.md` - Management structure
4. `.github/agents/HansPedder2_ProjectDirector.md` - Authority structure

**Ongoing References**:

- `claudedocs/BLOCKERS_LOG.md` - Current blockers
- `claudedocs/DECISION_LOG.md` - Decisions made
- GitHub Projects - Kanban board

### For Specific Roles

- DataEngineer: `.github/agents/DataEngineer_Agent.md`
- MLEngineer: `.github/agents/MLEngineer_Agent.md`
- BackendEngineer: `.github/agents/BackendEngineer_Agent.md`
- QAEngineer: `.github/agents/QAEngineer_Agent.md`
- DevOpsEngineer: `.github/agents/DevOpsEngineer_Agent.md`

---

## 🎯 SUCCESS CRITERIA FOR THE SYSTEM

### Operational Success

- ✅ Daily standups 100% adherence
- ✅ Blocker response times within SLA
- ✅ All documentation up-to-date
- ✅ Zero communication breakdowns

### Project Success

- ✅ Milestones delivered on-time: 100%
- ✅ Scope managed (0% unauthorized creep)
- ✅ Budget tracked & optimized
- ✅ Team satisfaction: >8/10

### Technical Success

- ✅ Code quality: >85% coverage
- ✅ Performance: All targets met
- ✅ Production ready by Mar 2026

---

## 🔄 SYSTEM HEALTH MONITORING

### Weekly System Health Check

**Cursor Reviews**:

- Team coordination effectiveness
- Communication quality
- Blocker resolution efficiency
- Morale & satisfaction

**Decision**: Continue current structure or adjust?

### Metrics Tracked

| Metric            | Target | Current | Trend |
| ----------------- | ------ | ------- | ----- |
| Standup Adherence | 100%   | TBD     | -     |
| Blocker Response  | SLA    | TBD     | -     |
| Doc Currency      | 100%   | TBD     | -     |
| Team Satisfaction | >8/10  | TBD     | -     |

---

## 🚀 ACTIVATION COMMANDS FOR CURSOR

To activate the entire system:

```
@Cursor "You are now active as Implementation Lead for WidgetTDC RAG.

Reference:
- .github/agents/Cursor_Implementation_Lead.md (your role)
- .github/agents/RAG_IMPLEMENTATION_SYSTEM.md (this system)
- claudedocs/RAG_PROJECT_OVERVIEW.md (main dashboard)
- claudedocs/RAG_TEAM_RESPONSIBILITIES.md (team structure)

Team status:
- DataEngineer: PLACEHOLDER (awaiting assignment)
- MLEngineer: PLACEHOLDER (awaiting assignment)
- BackendEngineer: PLACEHOLDER (awaiting assignment)
- QAEngineer: PLACEHOLDER (awaiting assignment)
- DevOpsEngineer: PLACEHOLDER (awaiting assignment)

Your tasks:
1. Review project status & backlog
2. Prepare for sprint 1 planning
3. Identify any initial blockers
4. Report: What's the project status?"
```

---

## 🎓 AGENT ONBOARDING PROCEDURE

When a new agent joins:

1. **Document Review** (1 hour)
   - Read role-specific agent config
   - Review project overview
   - Understand team structure

2. **Briefing** (30 min)
   - Cursor explains their role
   - Q&A about responsibilities
   - Introduce them to team

3. **Setup** (30 min)
   - Git repo access
   - Project docs access
   - Kanban board access

4. **First Task** (Simple, low-risk)
   - Get familiar with workflow
   - Build confidence
   - Establish cadence

5. **Integration** (Ongoing)
   - Daily standups
   - Progress tracking
   - Collaborative work

---

## 🛡️ SYSTEM RESILIENCE

### What if an agent goes offline?

- Task reassignment by Cursor
- Escalate to HansPedder2 if critical
- Document in BLOCKERS_LOG.md

### What if a sprint derails?

- Emergency standup
- Reassess priorities
- Adjust timeline if needed
- Escalate to HansPedder2

### What if team conflict occurs?

- Cursor mediates
- Escalate to HansPedder2 if needed
- Document in decision log

---

## 📞 SUPPORT & ESCALATION

**For Technical Issues**:

- Agent → Cursor → HansPedder2

**For Blocker Issues**:

- Agent → Cursor (with escalation timing)

**For Scope/Timeline Changes**:

- Cursor → HansPedder2 (with analysis)

**For Strategic Changes**:

- Any → HansPedder2 (via Cursor)

---

## ✅ SYSTEM INITIALIZATION CHECKLIST

- [x] Project director assigned (HansPedder2)
- [x] Implementation lead assigned (Cursor)
- [x] All agent configs created
- [x] Project documentation complete
- [x] Authority structure documented
- [ ] Team members recruited
- [ ] Team members onboarded
- [ ] First sprint planned
- [ ] First standup scheduled

---

**System Status**: READY FOR TEAM RECRUITMENT
**Last Updated**: 2025-11-17
**Next Step**: Recruit and onboard team members
