# WidgetTDC - TODO List

## 🔴 CRITICAL - Widget System Integration
**Status:** IN PROGRESS ✅ 
**Priority:** P0

### Problem
- ~~Kun AgentMonitorWidget er integreret i WidgeTDC_Pro.jsx~~ 
- ~~35 andre widgets eksisterer men er ikke tilgængelige~~
- ~~Ingen widget registry/loader system aktivt~~

### Solution
1. **Implementer Widget Registry System** ✅
   - [x] Opret central widget registry i WidgeTDC_Pro
   - [x] Auto-discover alle widgets fra `/widgets` folder
   - [x] Brug WidgetRegistryContext til at administrere widgets
   
2. **Tilføj Widget Sidebar/Menu** ✅
   - [x] Tilføj "Add Widget" knap i header
   - [x] Vis liste af tilgængelige widgets
   - [x] Tillad click-to-add til dashboard
   
3. **Integrer Eksisterende Widgets** 🔄
   - [ ] Verificer at alle widgets loader korrekt
   - [ ] Test widget instances
   - [ ] Fix eventualle TypeScript errors
   - [ ] ActivityStreamWidget
   - [ ] AgentBuilderWidget
   - [ ] AgentChatWidget
   - [ ] AiPalWidget
   - [ ] AudioTranscriberWidget
   - [ ] CmaDecisionWidget
   - [ ] CodeAnalysisWidget
   - [ ] CybersecurityOverwatchWidget
   - [ ] DarkWebMonitorWidget
   - [ ] EvolutionAgentWidget
   - [ ] FeedIngestionWidget
   - [ ] ImageAnalyzerWidget
   - [ ] IntelligentNotesWidget
   - [ ] KanbanWidget
   - [ ] LiveConversationWidget
   - [ ] LocalScanWidget
   - [ ] MCPConnectorWidget
   - [ ] MCPEmailRAGWidget
   - [ ] McpRouterWidget
   - [ ] NetworkSpyWidget
   - [ ] NexusTerminalWidget
   - [ ] PerformanceMonitorWidget
   - [ ] PersonaCoordinatorWidget
   - [ ] PersonalAgentWidget
   - [ ] Phase1CFastTrackKanbanWidget
   - [ ] ProcurementIntelligenceWidget
   - [ ] PromptLibraryWidget
   - [ ] SearchInterfaceWidget
   - [ ] SragGovernanceWidget
   - [ ] StatusWidget
   - [ ] SystemMonitorWidget
   - [ ] SystemSettingsWidget
   - [ ] VideoAnalyzerWidget
   - [ ] WidgetImporterWidget

## 🟡 HIGH PRIORITY - Neural Mesh Enhancements

### WebSocket Event Bus
- [ ] Implementer WebSocket connection i backend
- [ ] Opret event emitter for agent status changes
- [ ] Subscribe til events i AgentMonitorWidget
- [ ] Fjern polling, brug real-time updates

### Agent Discovery
- [ ] Auto-reload når registry.yml ændres
- [ ] Hot-reload af agent definitions
- [ ] Notifikationer når nye agenter tilføjes

### MCP Resource Expansion
- [ ] Tilføj `agents://logs` resource
- [ ] Tilføj `agents://metrics` resource
- [ ] Tilføj `agents://dependencies` resource

## 🟢 MEDIUM PRIORITY - UI/UX Improvements

### Dashboard Enhancements
- [ ] Gem widget layout i localStorage
- [ ] Tilføj widget resize functionality
- [ ] Implementer widget minimize/maximize
- [ ] Tilføj widget settings panel

### Agent Monitor Widget
- [ ] Tilføj filter/search functionality
- [ ] Vis agent dependencies som graph
- [ ] Tilføj agent execution history
- [ ] Implementer agent logs viewer

## 🔵 LOW PRIORITY - Future Features

### Security & Compliance
- [ ] Implementer MCP authentication
- [ ] Tilføj rate limiting til MCP endpoints
- [ ] Audit log for agent triggers
- [ ] RBAC for agent management

### Performance
- [ ] Lazy load widgets
- [ ] Virtualize long widget lists
- [ ] Optimize re-renders
- [ ] Add service worker for offline support

### Developer Experience
- [ ] Widget development CLI
- [ ] Widget template generator
- [ ] Hot module replacement for widgets
- [ ] Widget testing framework

## 📝 Notes
- DeepSeek agent tilføjet til registry (Block 8, 30 SP)
- Backend MCP system fungerer korrekt
- Frontend kan hente data via `/api/mcp/resources`
- Alle 8 agenter vises korrekt i Agent Monitor Widget

## 🐛 Known Issues
- `tsconfigRootDir` ESLint warning (non-blocking)
- Framer-motion var ikke installeret (fixed)
- Nogle widgets mangler TypeScript types
- CSS backdrop-filter vendor prefix warnings

---
**Last Updated:** 2025-11-21 10:37
**Version:** 1.0.0
