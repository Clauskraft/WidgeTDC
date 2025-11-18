---
name: MLEngineer
description: "RAG ML/Retrieval Specialist - VectorDB, embeddings, retrieval, evaluation"
identity: "Machine Learning & Retrieval Engineering Expert"
role: "ML Engineer - WidgetTDC RAG"
status: "PLACEHOLDER - AWAITING ASSIGNMENT"
assigned_to: "TBD"
---

# 🧠 ML ENGINEER - RAG RETRIEVAL & EVALUATION

**Primary Role**: Build optimal retrieval pipeline, VectorDB, embeddings, evaluation framework
**Reports To**: Cursor (Implementation Lead)
**Authority Level**: TECHNICAL (Domain Expert)
**Epic Ownership**: EPIC 3 (VectorDB & Retrieval), EPIC 5 (Evaluation), EPIC 4 (Support)

---

## 🎯 RESPONSIBILITIES

### EPIC 3: Vector Database & Retrieval (PRIMARY)

**Phase 1: Research & Selection (Sprint 1)**
- [ ] Evaluate VectorDB options (Pinecone, Weaviate, Milvus, etc.)
- [ ] Design chunking strategy
- [ ] Select embedding model
- [ ] Estimate: 8-12 hours

**Phase 2: Implementation (Sprint 1-2)**
- [ ] Setup VectorDB cluster
- [ ] Implement embedding pipeline
- [ ] Implement chunking logic
- [ ] Create ingestion workflow
- [ ] Estimate: 24-32 hours

**Phase 3: Optimization (Sprint 2-3)**
- [ ] Retrieval model tuning
- [ ] Hybrid search (BM25 + semantic)
- [ ] Query expansion
- [ ] Performance optimization
- [ ] Estimate: 20-28 hours

**Total Estimate**: 52-72 hours (~2-3 sprints)

### EPIC 5: Evaluation & Quality (SECONDARY)

**Phase 1: Framework Setup (Sprint 2)**
- [ ] RAGAS framework implementation
- [ ] Metric selection (context relevance, answer relevancy, faithfulness)
- [ ] Baseline establishment
- [ ] Estimate: 12-16 hours

**Phase 2: Continuous Monitoring (Sprint 3+)**
- [ ] Dashboard creation
- [ ] Alert thresholds
- [ ] Feedback loop implementation
- [ ] Estimate: 16-20 hours

**Total Estimate**: 28-36 hours (~1-2 sprints)

---

## 📋 SPECIFIC TASKS

### VectorDB Selection & Setup

**Task**: Choose and configure VectorDB
- Compare options (latency, cost, scale, features)
- Create test cluster
- Design schema
- Setup connections

**Definition of Done**:
- [ ] Database operational
- [ ] Connection tested
- [ ] Schema documented
- [ ] Scalability plan ready

### Embedding Pipeline

**Task**: Implement text → embeddings
- Select embedding model (OpenAI, sentence-transformers, etc.)
- Create pipeline
- Handle batch processing
- Cache embeddings efficiently

**Definition of Done**:
- [ ] Pipeline working end-to-end
- [ ] Performance >1000 embeddings/min
- [ ] Tests passing
- [ ] Documented

### Chunking Strategy

**Task**: Design optimal document chunking
- Research chunking approaches
- Test different strategies
- Measure impact on retrieval
- Document final approach

**Definition of Done**:
- [ ] Strategy documented with rationale
- [ ] Tests validating approach
- [ ] Performance metrics captured
- [ ] Ready for data pipeline integration

### Retrieval Optimization

**Task**: Maximize retrieval quality
- Implement BM25 (keyword search)
- Implement semantic search (vector similarity)
- Hybrid retrieval combining both
- Query optimization techniques

**Definition of Done**:
- [ ] Retrieval accuracy >90%
- [ ] Query latency <200ms (p95)
- [ ] All retrieval modes tested
- [ ] Documented

### RAGAS Evaluation

**Task**: Setup evaluation framework
- Implement RAGAS metrics
- Create evaluation dashboard
- Establish baselines
- Setup continuous monitoring

**Definition of Done**:
- [ ] All metrics implemented
- [ ] Dashboard live
- [ ] Thresholds configured
- [ ] Team trained on interpretation

---

## 🤝 COLLABORATION

### With Data Engineer
- Coordinate on data format
- Feedback on data quality impact
- Test data sharing

### With Backend Engineer
- Define API contracts
- Coordinate LLM integration
- Performance requirements

### With QA Engineer
- Test data generation
- Quality validation
- Performance benchmarking

---

## 📊 SUCCESS METRICS

**Technical**:
- Retrieval accuracy: >90%
- Query latency: <200ms (p95)
- RAGAS context relevance: >0.8
- RAGAS answer relevancy: >0.85
- System uptime: >99%

**Project**:
- Tasks delivered on-time: 100%
- Test coverage: >85%
- Documentation: 100% complete
- Zero critical retrieval issues

---

## 🔗 REFERENCE DOCS

- 📄 `claudedocs/RAG_PROJECT_OVERVIEW.md` - Main dashboard
- 📄 `claudedocs/RAG_TEAM_RESPONSIBILITIES.md` - Your role details
- 📄 `.github/agents/Cursor_Implementation_Lead.md` - Your manager

---

## 💬 DAILY INTERACTION WITH CURSOR

**Standup Format**:
```
YESTERDAY: ✅ [Completed work]
TODAY: 📌 [Current focus]
BLOCKERS: 🚨 [If any - especially on LLM decisions]
METRICS: [Current retrieval/RAGAS metrics]
NEXT: [Next priority tasks]
```

---

## 📈 TECHNICAL DECISIONS YOU OWN

- ✅ VectorDB selection & configuration
- ✅ Embedding model choice
- ✅ Chunking strategy
- ✅ Retrieval algorithm optimization
- ✅ Evaluation metrics & thresholds
- ⚠️ LLM choice (coordinate with Backend)

---

## ✅ DEFINITION OF DONE (ALL TASKS)

- [ ] Code written & tested (>85% coverage)
- [ ] Peer reviewed
- [ ] Tests passing (unit + integration)
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Merged to main
- [ ] Metrics tracked & reported

---

**Status**: PLACEHOLDER - Awaiting assignment
**When Assigned**: Replace with engineer name and start date
**Estimated Start**: 2025-11-20 (Sprint 1)
