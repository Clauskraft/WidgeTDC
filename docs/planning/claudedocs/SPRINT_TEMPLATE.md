# 📅 SPRINT TEMPLATE - Planning & Tracking

**Use this template for every sprint**

---

## SPRINT HEADER

```markdown
# Sprint [N] - [Sprint Name]

**Duration**: [Start Date] to [End Date] (2 weeks)
**Sprint Goal**: [What we're trying to achieve]
**Team**: [List team members]
**Lead**: Cursor (Implementation Lead)
**Status**: 🟢 On Track / 🟡 At Risk / 🔴 Off Track

## Sprint Metrics
- Target Velocity: [X story points]
- Capacity: [Y hours/person]
- Team Members: [N]
- Days: [10-12 working days]
```

---

## SPRINT PLANNING SECTION

### Sprint Goal

```
ONE sentence describing the sprint objective:
"We will deliver a working data ingestion pipeline
that processes 1000+ documents with >95% quality metrics"
```

### Capacity Planning

| Member | Available Hours | Allocated | Remaining |
|--------|-----------------|-----------|-----------|
| DataEngineer | 80h | 60h (setup overhead) | 20h |
| MLEngineer | 80h | 70h | 10h |
| BackendEngineer | 80h | 50h | 30h |
| QAEngineer | 80h | 60h | 20h |
| DevOpsEngineer | 80h | 40h | 40h |
| **TOTAL** | **400h** | **280h** | **120h** |

### Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Data source API down | Medium | High | Use cached data |
| Team member unavailable | Low | High | Cross-training done |
| Scope creep | Medium | Medium | Cursor manages strictly |

---

## BACKLOG SECTION

### Sprint Backlog (In Progress)

```
┌─────────────────────────────────────────────────────┐
│ BACKLOG | TODO | IN PROGRESS | REVIEW | DONE        │
│   (15)  |  (8) |      (2)     |  (1)   |  (0)        │
└─────────────────────────────────────────────────────┘
```

### Tasks by Epic

#### EPIC 2: Data Pipeline

| ID | Task | Owner | Points | Status | Notes |
|----|------|-------|--------|--------|-------|
| EP2-1 | Identify data sources | DataEng | 3 | ✅ | Completed |
| EP2-2 | Design ingestion pipeline | DataEng | 5 | 🟡 | In progress, 50% done |
| EP2-3 | Implement extraction logic | DataEng | 8 | ⏳ | Blocked on API credentials |
| EP2-4 | Data validation framework | DataEng | 5 | ⏳ | Ready to start |

#### EPIC 3: VectorDB

| ID | Task | Owner | Points | Status | Notes |
|----|------|-------|--------|--------|-------|
| EP3-1 | VectorDB selection | MLEng | 3 | 🟡 | Testing 2 options |
| EP3-2 | Chunking strategy research | MLEng | 5 | ⏳ | Starts after EP3-1 |

#### EPIC 4: LLM Integration

| ID | Task | Owner | Points | Status | Notes |
|----|------|-------|--------|--------|-------|
| EP4-1 | LLM provider evaluation | BackendEng | 3 | ⏳ | Next priority |

#### Testing (QA)

| ID | Task | Owner | Points | Status | Notes |
|----|------|-------|--------|--------|-------|
| QA-1 | Test strategy creation | QAEng | 5 | ✅ | Done |
| QA-2 | Unit test setup | QAEng | 3 | 🟡 | 60% complete |

---

## DAILY STANDUP LOG

### Day 1 - [Date]

**Standup Time**: 09:00 UTC
**Attendance**: All present ✅

**Status Summary**:
- 🟢 Backlog review complete
- 🟢 Sprint goal aligned
- 🟡 1 blocker identified: API credentials delayed

**By Person**:

**DataEngineer**:
- Yesterday: Sprint planning, backlog breakdown
- Today: Finalize data sources document
- Blockers: Waiting on API credentials from external team
- ETA: EOD tomorrow

**MLEngineer**:
- Yesterday: Started VectorDB comparison
- Today: Complete evaluation, decide between Pinecone & Weaviate
- Blockers: None
- Next: Design chunking strategy

**BackendEngineer**:
- Yesterday: Sprint setup, environment ready
- Today: Start LLM provider research
- Blockers: None
- Next: API endpoint design

**QAEngineer**:
- Yesterday: ✅ Test strategy delivered
- Today: Setup test infrastructure
- Blockers: Need access to staging environment
- Next: Implement unit test framework

**DevOpsEngineer**:
- Yesterday: Infrastructure designed
- Today: Provision staging environment
- Blockers: AWS account access pending
- Next: Setup CI/CD pipeline

**Cursor (Lead)**:
- Yesterday: Sprint planning completed
- Today: Manage blockers, coordinate team
- Blockers: 2 external dependencies (API creds, AWS access)
- Action: Escalating to HansPedder2 for expedited access

---

### Day 2 - [Date]

**Summary**: 🟡 At Risk - 2 blockers blocking progress

...

---

### Day 5 - [Date] - MID-SPRINT CHECK

**Sprint Progress**: 2/10 days complete

**Velocity Check**:
- Planned: 20 points
- Completed: 5 points (25% of sprint)
- Projected: 12-15 points (below target)

**Issues**:
- API credentials still pending (blocking EP2)
- AWS access approved, sprint moving

**Adjustments**:
- Shifted to non-dependent tasks
- Started EP3 & EP4 work in parallel
- New blocker tracking enabled

---

### Day 10 - [Date] - SPRINT END

**Final Status**: 🟡 At Risk

**Metrics**:
- Planned: 20 story points
- Completed: 16 story points (80% - GOOD)
- Blockers Resolved: 2/2 (100%)
- Test Coverage: 82% (Target: 85%)

**What Went Well**:
- ✅ Team parallelization worked
- ✅ Blocker escalation was effective
- ✅ Quality maintained
- ✅ Documentation comprehensive

**What to Improve**:
- 🔴 External dependency coordination (API credentials)
- 🔴 Environment setup timing
- 🟡 More buffer for unknown tasks

**Next Sprint Adjustments**:
- More external dependency buffer (2 days)
- Earlier environment setup (Day 1)
- Better vendor communication

---

## SPRINT REVIEW

### Demo/Review Meeting

**Date**: [Last day of sprint]
**Attendees**: Team + HansPedder2 (Stakeholders)

### Completed Items Review

| Item | Owner | Status | Quality |
|------|-------|--------|---------|
| Data Sources Document | DataEng | ✅ DONE | Good |
| Chunking Strategy | MLEng | ✅ DONE | Excellent |
| API Design Document | BackendEng | ✅ DONE | Good |
| Test Strategy | QAEng | ✅ DONE | Excellent |

### Outstanding Items

| Item | Why | Owner | Next Sprint |
|------|-----|-------|-------------|
| Data Pipeline Code | Blocked by API creds | DataEng | Sprint 2 |
| Evaluation Framework | Design only, code Sprint 2 | MLEng | Sprint 2 |

### Feedback from Stakeholders

- HansPedder2: "Good progress despite blockers. External dependencies need better planning."
- No major concerns raised
- Continue current approach with improvements

---

## SPRINT RETROSPECTIVE

### What Went Well ✅

1. Excellent cross-team coordination
2. Blocker escalation was timely
3. Documentation quality high
4. Team communication clear

### What Could Improve 🔄

1. External dependency management
2. Earlier environment provisioning
3. Buffer for unknowns

### Action Items for Next Sprint

| Action | Owner | Sprint |
|--------|-------|--------|
| Establish vendor coordination SLA | Cursor | Sprint 2 |
| Pre-provision environments earlier | DevOps | Sprint 2 |
| Add 15% buffer to estimates | Team | Sprint 2 |

---

## METRICS & REPORTS

### Sprint Velocity

```
Sprint 1:  16 pts
Sprint 2:  [TBD]
Sprint 3:  [TBD]
Avg:       [TBD]
```

### Burndown Chart (Template)

```
Points
  20 |●
     |  ●
  15 |    ●●
     |       ●
  10 |         ●●
     |            ●
   5 |              ●●
     |                 ●●
   0 |_____________________● (Done line)
     Day1 Day2 Day3 Day4 Day5 Day6 Day7 Day8 Day9 Day10
```

### Team Utilization

```
Target: 80%
Actual: 82% (GOOD)
```

---

## NEXT SPRINT PREVIEW

### Sprint 2 Focus

**Primary Objective**:
Implement data pipeline + VectorDB setup

**Planned Epics**:
- EP2 Data Pipeline: Implementation phase
- EP3 VectorDB: Setup & testing
- EP4 LLM: Continued research

**Estimated Velocity**: 20-25 points

**Key Dependencies**:
- External data source confirmations
- Vendor API documentation

---

## APPROVAL

**Sprint Lead**: Cursor - Approved ✅
**Project Director**: HansPedder2 - Approved ✅
**Date Approved**: [Date]

---

**Template Version**: 1.0
**Last Updated**: 2025-11-17
**Next Sprint**: [Date]
