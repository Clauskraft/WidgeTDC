# PRIORITY ACTIONS - MCP Adoption, Phase 1.C Acceleration, Multi-tenancy
**Date**: 2025-11-17  
**Status**: Ready for Implementation

---

## 🚨 CRITICAL FINDING: MCP Infrastructure ≠ MCP Adoption

### Current State
- ✅ Backend MCP services BUILT: CMA, SRAG, Evolution, PAL
- ✅ MCP WebSocket server RUNNING: `ws://localhost:3001/mcp/ws`
- ✅ 7 MCP tools REGISTERED with handlers
- ❌ **Frontend widgets using MOCK DATA, not MCP**

### Evidence
```typescript
// MCPEmailRAGWidget.tsx line 32:
"I en rigtig app ville dette være et API-kald via MCP"
// Translation: "In a real app this would be an API call via MCP"

// All major widgets use MOCK_DATA constants instead of API calls
const MOCK_EMAILS: Email[] = [...]
const MOCK_SUGGESTIONS: Record<string, ReplySuggestion[]> = {...}
setEmails(MOCK_EMAILS);  // <- Not calling /api/mcp/route
```

### Impact
- **MCP infrastructure is 100% built but 0% actively used**
- Widgets don't send messages to MCP router
- Services (CMA, SRAG) receive zero traffic
- "MCP as foundation" is only partially true

---

## PRIORITY 1: VERIFY & MAP MCP ADOPTION ✅

### Current Widget Status (16 total)

**Actually Using MCP** (Potentially):
- ❓ AgentChatWidget - Uses GoogleGenAI API key (not MCP)
- ❓ MCPConnectorWidget - Connection manager UI (not MCP calls)
- ❓ McpRouterWidget - NEW widget (check implementation)

**Using Mock Data** (Confirmed):
- ❌ MCPEmailRAGWidget - MOCK_EMAILS, MOCK_SUGGESTIONS
- ❌ IntelligentNotesWidget - Likely mock
- ❌ CybersecurityOverwatchWidget - Likely mock
- ❌ ProcurementIntelligenceWidget - Likely mock
- ❌ LiveConversationWidget - Likely mock
- ❌ Others (12 more to verify)

### Action Items
1. **Check each widget** (5 minutes per widget)
   - Does it import from `../types` and use mock data? → NOT USING MCP
   - Does it call `fetch('/api/mcp/route')` or `ws.send()`? → USING MCP
   - Does it call external API directly? → BYPASSING MCP

2. **Run grep analysis**:
   ```bash
   grep -l "MOCK_" widgets/*.tsx  # Shows which use mocks
   grep -l "/api/mcp" widgets/*.tsx  # Shows which use MCP
   grep -l "fetch\|axios" widgets/*.tsx  # Shows which use external APIs
   ```

3. **Deliverable**: Document `WIDGET_MCP_ADOPTION.md`
   - 16 widgets × 3 categories = matrix
   - Identify which need connecting to MCP
   - Estimate effort to wire each one

### Expected Result
**Hypothesis**: ~0-2 widgets actually use MCP. Rest are mock/external.
**Impact**: MCP adoption = 0-12.5% (probably closer to 0%)

---

## PRIORITY 3: FAST-TRACK PHASE 1.C (START NOW) ⏱️

### Current Timeline vs Reality
```
PLANNED:
Dec 1-15:   Phase 1.B (Dashboard Shell, Registry, Audit)
Dec 16-20:  Phase 1.C (Component Design System)
Dec 21-31:  Phase 1 Quality Gate

ACTUAL:
Nov 17:     Phase 1.B COMPLETED (2 weeks early!)
Nov 18-22:  Phase 1.C can start NOW
Dec 15+:    Extra 3-4 weeks for enhancements
```

### Acceleration Strategy

**Option A: Run Phase 1.C in Parallel** (Recommended)
- **Now (Nov 17-22)**: Start Block 1 (Design System) + Block 3 (Security remediation)
- **Parallel Nov 18-20**: Continue with Block 2 (E2E tests) + Block 4 (Quality gate prep)
- **Result**: Complete Phase 1.C by Dec 1 instead of Dec 20 (19 days early)

**Option B: Sprint Phase 1.C** (Aggressive)
- **Nov 18-19 (2 days)**: Component Design System finalization
- **Nov 20-21 (2 days)**: E2E test acceleration + Performance tuning
- **Nov 22 (1 day)**: Quality gate review
- **Result**: Complete Phase 1.C by Nov 22 (24 days early!)

### Phase 1.C Blocks (Quick Recap)

| Block | Task | Duration | Owner | Status |
|-------|------|----------|-------|--------|
| 1 | Design System Completion | 2d | Chief GUI Designer | Ready |
| 2 | E2E Test Acceleration | 2d | QA Team | Ready |
| 3 | Security Remediation | 2d | Security Architect | Ready |
| 4 | Quality Gate Review | 1d | Project Manager | Ready |

### Implementation Plan

**Week 1 (Nov 18-22): Design System**
- [ ] Nov 18: Review component library from Phase 1.B
- [ ] Nov 19: Create Storybook 7 setup
- [ ] Nov 20: Write 100+ component stories
- [ ] Nov 21: Accessibility verification
- [ ] Nov 22: Documentation complete

**Week 2 (Nov 25-29): Testing & QA**
- [ ] Nov 25: E2E test framework review
- [ ] Nov 26-27: Expand tests (50 → 100 scenarios)
- [ ] Nov 28: Performance optimization sprint
- [ ] Nov 29: Performance baseline confirmed

**Week 3 (Dec 2-6): Security & Gate**
- [ ] Dec 2-3: Security audit completion
- [ ] Dec 4-5: GDPR compliance verification
- [ ] Dec 6: Final quality gate assessment

**Result**: Phase 1 complete by Dec 6 (ready for Phase 2 by Dec 10)

### Deliverables by Dec 1
- ✅ Component Design System (Storybook live)
- ✅ 95%+ E2E test coverage
- ✅ All performance targets confirmed
- ✅ Security audit PASS
- ✅ GDPR compliance verified
- ✅ Quality gate approved
- ✅ Ready for Phase 2 IMMEDIATE START

---

## PRIORITY 4: FOCUS ON MULTI-TENANCY FOR PHASE 2 🏢

### Why Multi-tenancy is Critical
```
Current: Single-org WidgetTDC
€10M ARR Requires: Multi-org SaaS

1 customer = €1M ARR
10 customers = €10M ARR
→ Need seamless multi-tenant deployment
```

### Multi-tenancy Requirements

**Row-Level Security (RLS)**
```sql
-- Each widget data isolated by org_id, user_id
SELECT * FROM widget_data 
WHERE org_id = current_user.org_id
  AND (shared = true OR owner_id = current_user.id);
```

**Namespace Isolation**
- Dashboard 1 (Org A) ≠ Dashboard 1 (Org B)
- MCP tools scoped to org
- Audit logs per tenant

**Auth Layer** (Must implement Phase 2.A)
- OAuth2 for org sign-up
- JWT with org_id + user_id in claims
- RBAC (roles: admin, user, viewer)

### Database Changes (PostgreSQL)

```sql
-- Add tenant isolation to every table
ALTER TABLE widget_data ADD COLUMN org_id UUID NOT NULL DEFAULT NULL;
ALTER TABLE dashboard ADD COLUMN org_id UUID NOT NULL DEFAULT NULL;
ALTER TABLE audit_log ADD COLUMN org_id UUID NOT NULL DEFAULT NULL;

-- Create RLS policies
CREATE POLICY org_isolation ON widget_data
  USING (org_id = current_user.org_id);

-- Create indexes
CREATE INDEX idx_widget_org ON widget_data(org_id);
```

### MCP & Multi-tenancy

**MCP Tools Need Tenant Context**
```typescript
// Tool handler needs org_id in payload
interface MCPMessage {
  id: string;
  tool: string;
  orgId: string;  // <- REQUIRED
  userId: string; // <- REQUIRED
  payload: any;
}

// CMA service filters by org_id
const memories = db
  .query('SELECT * FROM memory_entities')
  .where('org_id', orgId)
  .where('user_id', userId)
  .execute();
```

### Phase 2 Roadmap

**Phase 2.A (Jan 1-15): Authentication**
- [ ] OAuth2 setup (Google, Microsoft, GitHub)
- [ ] JWT implementation
- [ ] User signup/login flows
- [ ] RBAC scaffolding

**Phase 2.B (Jan 15-31): Multi-tenancy**
- [ ] Add org_id to all tables
- [ ] Implement RLS policies
- [ ] Scope MCP tools to org
- [ ] Update audit logging

**Phase 2.C (Feb 1-15): Advanced**
- [ ] Workspace invite system
- [ ] Team management UI
- [ ] Billing integration (Stripe)
- [ ] Observability per tenant

### Success Metrics
- [ ] 5+ test organizations created
- [ ] Each org isolated (verified with SQL query)
- [ ] MCP calls scoped correctly
- [ ] Audit logs show org separation
- [ ] No data leakage between orgs

---

## IMPLEMENTATION TIMELINE

### This Week (Nov 18-22)
- [ ] **Priority 1**: Map MCP adoption in widgets (5 hours)
  - Deliverable: `WIDGET_MCP_ADOPTION.md`
- [ ] **Priority 3a**: Start Phase 1.C Block 1 (Design System)
  - Deliverable: Storybook live with 50+ stories
- [ ] **Priority 4**: Begin multi-tenancy design doc
  - Deliverable: `MULTITENANCY_ARCHITECTURE.md`

### Next Week (Nov 25-29)
- [ ] **Priority 3b**: E2E test acceleration + Performance tuning
  - Deliverable: 100 E2E tests, performance baselines
- [ ] **Priority 4**: Multi-tenancy database schema
  - Deliverable: SQL migrations, RLS policies

### Week 3 (Dec 2-6)
- [ ] **Priority 3c**: Security audit + Quality gate
  - Deliverable: Phase 1.C PASS approval
- [ ] **Priority 4**: Multi-tenancy implementation plan
  - Deliverable: Phase 2 detailed roadmap

### Phase 2 (Jan 1 - Mar 1)
- [ ] Multi-tenancy implementation (6 weeks)
- [ ] €10M ARR pipeline activation

---

## SUCCESS CRITERIA

### Priority 1: MCP Adoption Verification ✅
- [ ] All 16 widgets analyzed
- [ ] MCP adoption percentage known
- [ ] Roadmap created for widget wiring
- [ ] Acceptance: Document submitted, actionable

### Priority 3: Phase 1.C Acceleration ✅
- [ ] Phase 1.C started by Nov 18
- [ ] Component Design System LIVE by Nov 22
- [ ] 95%+ E2E coverage by Nov 29
- [ ] Quality gate PASS by Dec 6
- [ ] Acceptance: Phase 1 complete 2-3 weeks early

### Priority 4: Multi-tenancy Foundation ✅
- [ ] Architecture documented
- [ ] Database schema designed
- [ ] MCP integration scoped
- [ ] Phase 2 roadmap detailed
- [ ] Acceptance: Ready to implement Jan 1

---

## WHO OWNS WHAT

| Priority | Owner | Duration | Dependency |
|----------|-------|----------|------------|
| 1: MCP Verification | Frontend Lead | 5 hours | None |
| 3: Phase 1.C Sprint | Design + QA + Security | 2 weeks | Phase 1.B done ✅ |
| 4: Multi-tenancy Design | Backend Lead | 1 week | None |

---

**Ready to Execute. Awaiting approval.**
