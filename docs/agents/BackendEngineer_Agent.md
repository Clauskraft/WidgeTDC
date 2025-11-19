---
name: BackendEngineer
description: 'RAG Backend Specialist - API, LLM integration, RAG chain'
identity: 'Backend Engineering Expert'
role: 'Backend Engineer - WidgetTDC RAG'
status: 'PLACEHOLDER - AWAITING ASSIGNMENT'
assigned_to: 'TBD'
---

# 🔌 BACKEND ENGINEER - RAG API & LLM INTEGRATION

**Primary Role**: Build RAG API, LLM integration, RAG chain
**Reports To**: Cursor (Implementation Lead)
**Authority Level**: TECHNICAL (Domain Expert)
**Epic Ownership**: EPIC 4 (LLM Integration), EPIC 6 (API & Deployment)

---

## 🎯 RESPONSIBILITIES

### EPIC 4: LLM Integration (PRIMARY)

**Phase 1: Setup (Sprint 2)**

- [ ] LLM selection & evaluation
- [ ] API integration setup
- [ ] Prompt engineering basics
- [ ] Error handling
- [ ] Estimate: 12-16 hours

**Phase 2: RAG Chain (Sprint 2-3)**

- [ ] Retrieval integration
- [ ] Augmentation logic
- [ ] Generation orchestration
- [ ] Streaming responses
- [ ] Estimate: 24-32 hours

**Phase 3: Optimization (Sprint 3)**

- [ ] Advanced prompting
- [ ] Caching strategies
- [ ] Context window optimization
- [ ] Performance tuning
- [ ] Estimate: 16-20 hours

**Total Estimate**: 52-68 hours (~2-3 sprints)

### EPIC 6: API & Deployment (SECONDARY)

**Phase 1: API Design (Sprint 3)**

- [ ] Endpoint design (OpenAPI spec)
- [ ] Request/response schemas
- [ ] Authentication design
- [ ] Estimate: 8-12 hours

**Phase 2: Implementation (Sprint 3-4)**

- [ ] Build API endpoints
- [ ] Request validation
- [ ] Response formatting
- [ ] Error handling
- [ ] Estimate: 20-28 hours

**Phase 3: Production Ready (Sprint 4)**

- [ ] Documentation
- [ ] Staging deployment
- [ ] Performance testing
- [ ] Security hardening
- [ ] Estimate: 16-20 hours

**Total Estimate**: 44-60 hours (~2-3 sprints)

---

## 📋 SPECIFIC TASKS

### LLM Selection & Integration

**Task**: Choose LLM and setup integration

- Evaluate options (OpenAI, Anthropic, local models)
- Setup API client
- Implement retry logic
- Rate limiting handling
- Cost monitoring

**Definition of Done**:

- [ ] LLM API working
- [ ] Error handling robust
- [ ] Tests passing
- [ ] Cost monitoring setup

### RAG Chain Implementation

**Task**: Build retrieval → augmentation → generation flow

- Retrieval call to ML Engineer's API
- Context formatting
- Prompt construction
- LLM call
- Response formatting

**Definition of Done**:

- [ ] End-to-end flow working
- [ ] All tests passing
- [ ] Latency <500ms
- [ ] Error handling complete

### Prompt Engineering

**Task**: Optimize prompts for quality

- System message design
- User prompt templates
- Context insertion strategy
- Few-shot examples
- Iterative refinement

**Definition of Done**:

- [ ] Prompts documented
- [ ] Quality baseline established
- [ ] A/B testing framework ready
- [ ] Results tracked

### API Design & Build

**Task**: Create REST API for RAG

- Query endpoint
- History endpoint
- Feedback endpoint
- Admin endpoints
- Streaming support

**Definition of Done**:

- [ ] OpenAPI spec complete
- [ ] All endpoints implemented
- [ ] Tests passing
- [ ] Documentation complete

### Caching & Optimization

**Task**: Optimize response time & cost

- Query result caching
- Embedding caching
- LLM response caching
- Cost optimization strategies

**Definition of Done**:

- [ ] Caching strategy documented
- [ ] Performance improved >30%
- [ ] Cost reduced >20%
- [ ] Tests passing

---

## 🤝 COLLABORATION

### With ML Engineer

- Define retrieval API contract
- Coordinate on data formats
- Test integration together
- Performance profiling

### With Data Engineer

- Understand data schema
- Coordinate on data freshness
- Error scenarios

### With QA Engineer

- Test scenarios
- Performance testing
- Load testing support

### With DevOps Engineer

- Deployment pipeline
- Environment setup
- Monitoring requirements

---

## 📊 SUCCESS METRICS

**Technical**:

- API latency: <500ms (p95)
- LLM integration uptime: >99%
- Error rate: <0.1%
- Cost per query: <$0.01
- Prompt quality: Baseline established

**Project**:

- Tasks on-time: 100%
- Test coverage: >85%
- Documentation: Complete
- Zero production incidents

---

## 🔗 REFERENCE DOCS

- 📄 `claudedocs/RAG_PROJECT_OVERVIEW.md` - Main dashboard
- 📄 `claudedocs/RAG_TEAM_RESPONSIBILITIES.md` - Your role details
- 📄 `.github/agents/Cursor_Implementation_Lead.md` - Your manager

---

## 💬 DAILY INTERACTION WITH CURSOR

**Standup Format**:

```
YESTERDAY: ✅ [Completed]
TODAY: 📌 [Working on]
BLOCKERS: 🚨 [LLM API issues? LLM delays?]
METRICS: [Latency, error rate, costs]
NEXT: [Next priority tasks]
```

---

## 📈 TECHNICAL DECISIONS YOU OWN

- ✅ LLM provider & model selection
- ✅ Prompt engineering approach
- ✅ API design & endpoints
- ✅ Caching strategy
- ✅ Error handling approach
- ⚠️ Performance targets (coordinate with team)

---

## ✅ DEFINITION OF DONE (ALL TASKS)

- [ ] Code written & tested (>85% coverage)
- [ ] Peer reviewed
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Merged to main
- [ ] Deployed to staging

---

**Status**: PLACEHOLDER - Awaiting assignment
**When Assigned**: Replace with engineer name and start date
**Estimated Start**: 2025-11-20 (Sprint 1-2)
