# Architecture Review & Integration Plan

## 1. Overview
This document provides a comprehensive review of the WidgeTDC backend architecture, focusing on System Monitoring, Security Intelligence, and Autonomous Agents. It aims to align the system with best practices from similar open-source solutions (HuggingFace, GitHub) and define clear input/output contracts.

## 2. Component Analysis

### 2.1 System Monitoring (`sys.ts`, `networkController.ts`)
**Purpose:** Monitor local system resources (CPU, RAM, GPU, Network) and control processes.
**Input:** 
- System calls via `systeminformation` library.
- PowerShell commands (Windows-specific) for process details and network connections.
**Output:** 
- JSON endpoints (`/api/sys/system`, `/api/network/spy`).
- Real-time WebSocket broadcasts (planned).

**Critique & Inspiration:**
- **Current State:** Direct API calls, mixed abstraction levels.
- **Inspiration (Glances/Prometheus):** 
  - Should expose a standardized "metrics" endpoint.
  - Needs a "Snapshot" mechanism to store historical state for trend analysis.
- **Action:** Refactor `sys.ts` to return a strictly typed `SystemState` object that can be persisted.

### 2.2 Security Intelligence (`securityService.ts`, `securityController.ts`)
**Purpose:** Ingest, normalize, and search threat intelligence feeds.
**Input:** 
- RSS feeds (OpenPhish, etc.).
- External APIs (Shodan, VirusTotal - planned).
- User search queries.
**Output:** 
- Normalized `SecuritySearchResult` objects.
- Aggregated `FeedMetrics`.

**Critique & Inspiration:**
- **Current State:** Basic ingestion pipeline. Type safety issues in `securityService.ts`.
- **Inspiration (TheHive/MISP):** 
  - Adopt STIX/TAXII standards for data representation where possible.
  - Implement an "Observable" pattern where any data point (IP, Hash) can be pivoted on.
- **Action:** Fix type definitions in `securityService.ts` to strictly match OpenSearch responses.

### 2.3 Autonomous Core (`hansPedder.ts`, `autonomousRouter.ts`)
**Purpose:** Orchestrate agents, handle complex tasks, provide "Project Director" oversight.
**Input:** 
- Natural language queries.
- System events (via `mcpEmitter`).
**Output:** 
- `MCPMessage` for tool execution.
- Synthesized insights/answers.

**Critique & Inspiration:**
- **Current State:** Single-turn LLM interaction.
- **Inspiration (AutoGPT/BabyAGI):** 
  - Needs a "Task Queue" for multi-step reasoning.
  - Needs "Memory" (Vector DB) integration for context retention (partially implemented in `CognitiveMemory`).
- **Action:** Ensure `autonomousRouter.ts` correctly integrates `CognitiveMemory` and `AutonomousAgent`.

## 3. Integration Plan & Data Flow

### 3.1 The "Nervous System" (Event Bus)
All components should communicate via the MCP Event Bus (`mcpEmitter`).
- **Input:** `sys.ts` detects high CPU -> Emits `system.alert`.
- **Processing:** `HansPedder` listens to `system.alert` -> Decides to kill process.
- **Output:** `HansPedder` calls `networkController.killProcess`.

### 3.2 Data Standardization
We will enforce strict TypeScript interfaces for all data crossing module boundaries.
- `SystemMetric`: `{ timestamp: number, type: 'cpu'|'mem', value: number, meta: {} }`
- `SecurityEvent`: `{ timestamp: number, severity: 'low'|'high', source: string, payload: {} }`

## 4. Implementation Steps (Immediate)

1.  **Stabilize Core:** Fix build errors in `autonomousRouter.ts` and `sys.ts`.
2.  **Type Hardening:** Ensure `securityService.ts` uses robust type guards.
3.  **Agent Consolidation:** Verify `HansPedder` has the "Project Director" prompt and error handling directives.

## 5. Implementation Status (Completed)
- [x] **Event Bus:** Created src/mcp/EventBus.ts as the central nervous system.
- [x] **System Integration:** sys.ts now emits system.alert on high CPU load.
- [x] **Agent Integration:** utonomousRouter.ts listens for system.alert.
- [x] **Build Fixes:** Resolved all TypeScript errors in core modules.
