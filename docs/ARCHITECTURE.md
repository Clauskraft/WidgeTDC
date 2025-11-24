# WidgetBoard Architecture

## Overview

WidgetBoard is an enterprise-grade, widget-based dashboard platform built with React, TypeScript, and modern web technologies. The architecture is designed for security, scalability, and maintainability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Client                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Widgets    │  │  Components  │  │   Contexts   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                           │                                      │
│         ┌─────────────────┴─────────────────┐                  │
│         │                                     │                  │
│  ┌──────▼──────┐                    ┌────────▼─────┐           │
│  │ MCP Client  │◄───────────────────┤    Logger    │           │
│  └─────────────┘                    └──────────────┘           │
│         │                                                        │
│         │ WSS (Secure WebSocket)                               │
├─────────┼────────────────────────────────────────────────────┤
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                               │
│  │ MCP Server  │ (External Service)                           │
│  └─────────────┘                                               │
│         │                                                        │
│         ├──────► Microsoft Graph API (Outlook Integration)     │
│         ├──────► Gemini AI API (AI Features)                   │
│         └──────► Other Data Sources                            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Application Layer
- Root application with context providers
- Shell with header, sidebar, and dashboard
- Widget initialization and management

### 2. Widget System
- Central registry for widget definitions
- Dynamic widget loading and lifecycle
- 10+ specialized widgets (Chat, Email RAG, Performance Monitor, etc.)

### 3. Security Layer
- Input sanitization and validation
- Rate limiting and circuit breaker
- JWT authentication
- Sensitive data redaction

### 4. Communication Layer
- MCP Client with WebSocket
- Automatic reconnection
- Request/response handling
- Event subscription

### 5. Logging System
- Structured logging with context
- Multiple transports
- Performance monitoring
- Sensitive data protection

## Data Flow

```
User Action → Widget → Context → MCP Client → WebSocket → Server → Response → Update UI
```

## Security Architecture

### Defense in Depth
1. Input sanitization (XSS, SQLi prevention)
2. WSS with JWT authentication
3. RBAC and feature flags
4. Data encryption and redaction

### Circuit Breaker Pattern
- CLOSED: Normal operation
- OPEN: Reject requests after failures
- HALF_OPEN: Test recovery

## Performance Targets
- FCP: < 1.5s
- LCP: < 2.5s
- TTI: < 3.5s
- Test Coverage: 70%+

See full documentation in [docs/](../docs/) directory.
