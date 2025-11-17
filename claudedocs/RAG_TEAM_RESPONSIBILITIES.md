# 👥 RAG TEAM - ROLES & RESPONSIBILITIES

**Project**: WidgetTDC RAG Implementation
**Owner**: HansPedder2 (Project Director)
**Lead**: Cursor (Implementation Team Lead)

---

## 🎯 CORE TEAM STRUCTURE

```
HansPedder2 (PROJECT DIRECTOR)
    ↓ Reports to
Cursor (IMPLEMENTATION LEAD)
    ↓ Coordinates
├── Data Engineer
├── ML/Retrieval Engineer
├── Backend Engineer
├── QA Engineer
└── DevOps Engineer
```

---

## 👤 ROLE DEFINITIONS

### 1️⃣ IMPLEMENTATION LEAD (Cursor)

**Primary Responsibility:**
Day-to-day project execution, team coordination, tactical decisions

**Key Responsibilities:**
- ✅ Daily standup coordination
- ✅ Task prioritization & assignment
- ✅ Blocker resolution (or escalation)
- ✅ Team sync & communication
- ✅ Progress tracking & reporting
- ✅ Quality gate enforcement
- ✅ Escalation to HansPedder2 when needed

**Authority:**
- Can make tactical decisions
- Can reassign tasks
- Can adjust sprint priorities
- **Cannot** make strategic decisions (escalates to HansPedder2)

**Reports To:** HansPedder2 (Daily standup, Weekly report)

**Tools:**
- GitHub Projects (Kanban)
- Claude Docs (Documentation)
- Git (Code versioning)

---

### 2️⃣ DATA ENGINEER

**Primary Responsibility:**
Build robust data ingestion & processing pipeline

**Epic Ownership:**
- 📍 **EPIC 2: Data Pipeline** (Owns)
- 📍 **EPIC 3: VectorDB** (Contributes)

**Specific Responsibilities:**
- Design & implement data ingestion pipeline
- Integrate with data sources (APIs, databases, files)
- Implement data cleaning & preprocessing
- Handle error cases & retries
- Monitor data quality metrics
- Document data schema & flows
- Provide metrics (throughput, latency, quality)

**Definition of Done Contributions:**
- [ ] Data pipeline passes all tests
- [ ] Data quality checks automated
- [ ] Schema documented
- [ ] Error handling comprehensive
- [ ] Performance metrics achieved

**Success Criteria:**
- Data ingestion >99% reliable
- Quality metrics >95% (completeness, accuracy)
- Processing latency <5min for batch

---

### 3️⃣ ML/RETRIEVAL ENGINEER

**Primary Responsibility:**
Build optimal retrieval pipeline & evaluation framework

**Epic Ownership:**
- 📍 **EPIC 3: VectorDB & Retrieval** (Owns)
- 📍 **EPIC 5: Evaluation** (Owns)
- 📍 **EPIC 4: LLM Integration** (Contributes)

**Specific Responsibilities:**
- Design & implement chunking strategy
- Select & configure VectorDB (Pinecone, Weaviate, Milvus, etc.)
- Implement embedding pipeline
- Optimize retrieval model (BM25, semantic search, hybrid)
- Design RAGAS evaluation framework
- Monitor retrieval quality metrics
- Implement feedback loop for continuous improvement

**Definition of Done Contributions:**
- [ ] Chunking strategy validated
- [ ] VectorDB operational & tested
- [ ] Retrieval accuracy >90%
- [ ] RAGAS metrics implemented
- [ ] Evaluation dashboard live

**Success Criteria:**
- Retrieval accuracy >90%
- Query latency <200ms (p95)
- RAGAS score >0.85 (context relevance + answer relevancy)

---

### 4️⃣ BACKEND ENGINEER

**Primary Responsibility:**
Build API, LLM integration, & RAG chain

**Epic Ownership:**
- 📍 **EPIC 4: LLM Integration** (Owns)
- 📍 **EPIC 6: API & Deployment** (Owns)

**Specific Responsibilities:**
- Design & implement RAG API
- Implement LLM integration (OpenAI, Anthropic, local, etc.)
- Build RAG chain (retrieval → augmentation → generation)
- Implement prompt engineering & optimization
- Handle streaming responses
- Implement caching & optimization
- Document API endpoints

**Definition of Done Contributions:**
- [ ] API fully documented (OpenAPI/Swagger)
- [ ] All endpoints tested
- [ ] RAG chain end-to-end working
- [ ] Latency targets met
- [ ] Production-ready error handling

**Success Criteria:**
- API latency <200ms (p95)
- Uptime >99.5%
- Error rate <0.1%

---

### 5️⃣ QA/TEST ENGINEER

**Primary Responsibility:**
Ensure quality, testing, & monitoring

**Epic Ownership:**
- 📍 **EPIC 5: Evaluation & Quality** (Contributes)
- 📍 **EPIC 6: API & Deployment** (Contributes)

**Specific Responsibilities:**
- Design comprehensive test strategy
- Implement unit, integration, E2E tests
- Performance testing & benchmarking
- Monitor production metrics
- Alert configuration & management
- Test automation implementation
- Quality reporting

**Definition of Done Contributions:**
- [ ] >85% code coverage
- [ ] All edge cases tested
- [ ] Performance tests passing
- [ ] Monitoring & alerts configured

**Success Criteria:**
- Test coverage >85%
- Critical bugs in production: 0
- MTTR (Mean Time to Resolution) <1h

---

### 6️⃣ DEVOPS ENGINEER

**Primary Responsibility:**
Infrastructure, deployment, & monitoring

**Epic Ownership:**
- 📍 **EPIC 6: API & Deployment** (Owns)

**Specific Responsibilities:**
- Design CI/CD pipeline
- Infrastructure provisioning
- Container/K8s management
- Deployment automation
- Monitoring & alerting setup
- Disaster recovery planning
- Security hardening

**Definition of Done Contributions:**
- [ ] CI/CD pipeline automated
- [ ] Staging & production ready
- [ ] Monitoring comprehensive
- [ ] Rollback procedures tested

**Success Criteria:**
- Deployment time <15min
- Uptime >99.5%
- MTTR <1h

---

## 📊 RESPONSIBILITY MATRIX

| Task Category | Data Eng | ML Eng | Backend | QA | DevOps | Lead |
|---------------|----------|--------|---------|-----|--------|------|
| Data Ingestion | **OWNS** | Supports | - | Tests | - | Tracks |
| VectorDB Setup | Supports | **OWNS** | - | Tests | - | Tracks |
| Chunking | Supports | **OWNS** | - | Tests | - | Tracks |
| Retrieval Model | Supports | **OWNS** | - | Tests | - | Tracks |
| LLM Integration | - | Supports | **OWNS** | Tests | - | Tracks |
| RAG Chain | Supports | Supports | **OWNS** | Tests | - | Tracks |
| API Design | - | - | **OWNS** | Tests | - | Tracks |
| Evaluation/RAGAS | - | **OWNS** | - | Supports | - | Tracks |
| Testing | - | - | - | **OWNS** | - | Tracks |
| Deployment | - | - | - | - | **OWNS** | Tracks |
| Monitoring | Supports | Supports | Supports | **OWNS** | Supports | Tracks |
| Documentation | Owns | Owns | Owns | Owns | Owns | Reviews |

---

## 🎯 SPRINT PLANNING

### How Team Members Participate

1. **Estimation**
   - Each engineer estimates tasks in story points
   - Lead validates & facilitates estimation
   - Data: past velocity, complexity, dependencies

2. **Assignment**
   - Lead assigns tasks based on:
     - Engineer expertise
     - Current capacity
     - Dependencies
   - Team confirms feasibility

3. **Execution**
   - Daily standups (15 min)
   - Async updates if needed
   - Pair programming when blocked

4. **Review & Merge**
   - Code review (peer + lead)
   - Testing & validation
   - Merge to main

---

## 📞 COMMUNICATION PATTERNS

### Daily (09:00 UTC)
**Standup Call (15 min)**
- Status: Yesterday done, today plan, blockers
- Each person: 2 min update
- Lead: 5 min to resolve issues

### Weekly (Every Monday, 14:00 UTC)
**Executive Sync (30 min)**
- Overall status to HansPedder2
- Risks & mitigations
- Budget & resource status
- Any strategic changes needed

### As Needed
**Blocker Escalation**
- Immediate Slack notification
- Lead investigates within 1h
- If critical: escalates to HansPedder2

---

## 🚀 ONBOARDING CHECKLIST

For each new team member:

- [ ] GitHub repo access
- [ ] Documentation reviewed (RAG_PROJECT_OVERVIEW.md)
- [ ] Architecture walkthrough
- [ ] Tech stack intro
- [ ] Local environment setup
- [ ] First task assigned (Low complexity)
- [ ] Paired programming session (if needed)

---

## 📈 PERFORMANCE METRICS

Each engineer is evaluated on:

1. **Task Completion**
   - On-time delivery rate
   - Quality (defects per 100 LOC)
   - Code review feedback incorporation

2. **Collaboration**
   - Blocker resolution time
   - Documentation quality
   - Peer review participation

3. **Quality**
   - Test coverage contribution
   - Bug escape rate
   - Performance vs targets

---

## 🎓 DECISION FRAMEWORK

**When facing decisions:**

1. **Tactical** (Day-to-day)
   - Engineer decides → Implements → Reports
   - Example: How to structure data pipeline

2. **Technical** (Architecture)
   - Engineer proposes → Lead validates → Implements
   - Example: Which VectorDB to use

3. **Strategic** (Direction)
   - Team input → Lead recommends → HansPedder2 decides
   - Example: Pivot to different LLM provider

---

## 🔗 Authority Chain

```
HansPedder2 (Final decision authority)
    ↓
Cursor (Lead - tactical decisions)
    ↓
Each Engineer (Technical decisions in their domain)
```

**Escalation Rules:**
- Blockers: Report to Lead immediately
- Architecture questions: Lead decides
- Strategic changes: Lead escalates to HansPedder2
- Budget/resource: Lead & HansPedder2

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Next Review**: After first sprint
