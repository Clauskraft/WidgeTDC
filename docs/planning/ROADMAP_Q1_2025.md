# WidgeTDC: Q1 2025 Roadmap - "The Neural Convergence"

**Status:** DRAFT v2 (Aligned with Claude's Neural Cortex Vision)
**Owner:** Gemini (Project Manager)
**Contributors:** Claude, DeepSeek, CLAK

---

## 🌍 Vision: "Neural Cortex" (The Unified Intelligence Layer)
By the end of Q1 2025, WidgeTDC will evolve from a dashboard into a **Neural Cortex**—a living system where Chat, Knowledge Graph, Code, and Documentation are inextricably linked. The goal is not just to *see* data, but to *converse* with the entire system.

---

## 💎 Key Strategic Pillars

### 1. Neural Cortex (Formerly Cognitive Architecture)
*   **Goal:** A unified intelligence layer that connects all system inputs.
*   **Key Features (Aligned with Claude):**
    *   **Auto-Linking:** Chat conversations automatically create or link to Graph Nodes (Tasks, Bugs, Concepts).
    *   **Pattern Recognition:** Hybrid analysis (Real-time stream + Batch nightly) to detect team velocity trends and architectural anomalies.
    *   **Decision Traceability:** Every AI action is logged with a "Reasoning Chain" linked to the specific graph node it affected.

### 2. Neural Chat (The Interface)
*   **Goal:** The "Command Line" for the GUI.
*   **Focus:**
    *   **Universal Addressability:** Talk to *anything* (e.g., "@bug-123 why are you open?", "@feature-login draft a test").
    *   **Capability Broker:** Full routing of tasks between Gemini (Context), Claude (Deep Logic), and DeepSeek (Code).
    *   **Voice/Audio:** Bidirectional voice interface.

### 3. Enterprise Robustness (The Backbone)
*   **Goal:** Stable, deployable, and secure infrastructure (Hybrid-Cloud).
*   **Focus:**
    *   **Hybrid-Cloud:** Railway for Data (Postgres, Redis, Neo4j) + Local for Compute/UI.
    *   **Tech Stack:** 
        *   **Embeddings:** HuggingFace (Xenova/transformers) for privacy & cost.
        *   **Vector Store:** Pgvector (Railway) for semantic search.
        *   **Graph:** Neo4j (Railway) for structural relationships.
    *   **Host Parity:** Solved via `engineType="binary"` and proper dependency management.

### 4. Visual Intelligence (The Experience)
*   **Goal:** High-fidelity, interactive 3D data visualization.
*   **Focus:**
    *   **3D Knowledge Graph:** Interactive WebGL exploration of the Neural Cortex.
    *   **Widget Ecosystem:** Standardized API for 3rd party widget development.

---

## 📅 Monthly Execution Plan

### 🟢 January: Foundation & The Cortex
*   **Theme:** "Connecting the Brain"
*   **Key Deliverables:**
    *   [x] **Fix:** Windows/Prisma Binary Incompatibility (Done).
    *   [ ] **Infra:** Full migration to Railway (Postgres & Redis done, Neo4j pending).
    *   [ ] **Feature:** **Auto-Linking v1** - Simple chat-to-node creation.
    *   [ ] **Agent:** "HansPedder" (The Testing Agent) fully autonomous.

### 🟡 February: Expansion & Deep Insight
*   **Theme:** "Seeing the Patterns"
*   **Key Deliverables:**
    *   [ ] **Feature:** **Unified GraphRAG** implementation (Vector + Graph queries combined).
    *   [ ] **Analysis:** Real-time anomaly detection (Error spikes, security alerts).
    *   [ ] **UX:** "Intent Recognition" - UI adapts based on conversation context.

### 🔴 March: Enterprise Scale & Polish
*   **Theme:** "Production Ready"
*   **Key Deliverables:**
    *   [ ] **Feature:** **Decision Traceability** Dashboard (Audit log of AI decisions).
    *   [ ] **Scale:** Stress testing with 1M+ nodes.
    *   [ ] **Launch:** WidgeTDC Enterprise Edition v1.0 Release Candidate.

---

## 📝 Immediate Next Steps (Week 1)
1.  **Infra:** Add Neo4j to Railway to complete the "Hybrid-Cloud" transition.
2.  **Code:** Implement `NeuralCortex.ts` service (as started by Claude) to handle the Auto-Linking logic.
3.  **Test:** Verify the full Capability Broker loop (Gemini -> Claude -> Result).