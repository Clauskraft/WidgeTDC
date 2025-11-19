# WidgetBoard - Enterprise Edition

> 🏢 Enterprise-grade widget dashboard platform with MCP integration, AI capabilities, and Microsoft Outlook integration.

[![CI/CD](https://github.com/Clauskraft/WidgeTDC/actions/workflows/ci.yml/badge.svg)](https://github.com/Clauskraft/WidgeTDC/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-A+-brightgreen.svg)](SECURITY.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)

## 🌟 Features

### Core Capabilities

- **🎯 Widget-Based Architecture**: Modular, customizable dashboard with 10+ pre-built widgets
- **🔐 Enterprise Security**: Zero-trust architecture with JWT authentication, rate limiting, and CSP
- **🤖 AI Integration**: Powered by Gemini AI for intelligent features
- **📧 Outlook Integration**: Microsoft Graph API integration for email management
- **🔌 MCP Protocol**: Model Context Protocol for seamless data connectivity
- **📊 RAG Email Analysis**: Intelligent email response suggestions using RAG technology
- **⚡ Real-time Updates**: WebSocket connections with automatic reconnection
- **🎨 Modern UI**: Microsoft Fluent Design-inspired interface

### Enterprise Features

- **OAuth 2.0 Authentication**: Secure authentication with PKCE
- **Circuit Breaker Pattern**: Fault tolerance for external services
- **Comprehensive Logging**: Structured logging with sensitive data redaction
- **Rate Limiting**: DoS protection and API throttling
- **Error Boundaries**: Graceful degradation and error handling
- **Performance Monitoring**: Built-in metrics and performance tracking
- **GDPR Compliance**: Privacy-by-design with data protection controls
- **Multi-tenant Support**: Isolated data and configurations per tenant

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm 9+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Clauskraft/WidgeTDC.git
cd WidgeTDC

# Install dependencies
npm install --legacy-peer-deps

# Copy environment template
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Access the application at `http://localhost:3000`

## 📋 Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional - MCP Server
VITE_MCP_SERVER_URL=wss://localhost:3001/mcp
VITE_MCP_AUTH_ENABLED=true

# Optional - Microsoft Integration
VITE_MS_CLIENT_ID=your_microsoft_client_id
VITE_MS_TENANT_ID=your_tenant_id

# Security (recommended for production)
VITE_ENABLE_CSP=true
VITE_JWT_SECRET=your_32_character_secret
```

See [.env.example](.env.example) for complete configuration options.

## 🏗️ Architecture

```
┌────────────────────────────────────────────┐
│           React Application                │
├────────────────────────────────────────────┤
│  Widgets │ Components │ Contexts           │
│     ↓          ↓            ↓              │
│  ┌──────────────────────────────┐         │
│  │    Security Layer            │         │
│  │  • Input Sanitization        │         │
│  │  • Rate Limiting             │         │
│  │  • JWT Validation            │         │
│  └──────────────────────────────┘         │
│           ↓                                │
│  ┌──────────────────────────────┐         │
│  │    MCP Client                │         │
│  │  • WebSocket (WSS)           │         │
│  │  • Circuit Breaker           │         │
│  │  • Auto-Reconnect            │         │
│  └──────────────────────────────┘         │
└────────────────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test

# Run specific test file
npm test -- utils/security.test.ts
```

**Current Coverage**: 36/36 security tests passing ✅

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## 🏗️ Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory.

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t widgetboard:latest .

# Run container
docker run -p 80:80 \
  -e GEMINI_API_KEY=your_key \
  widgetboard:latest

# Access at http://localhost
```

### Docker Compose

```yaml
version: '3.8'
services:
  widgetboard:
    build: .
    ports:
      - '80:80'
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```

## 📦 Available Widgets

| Widget              | Description                            | Status    |
| ------------------- | -------------------------------------- | --------- |
| Agent Chat          | AI-powered conversational interface    | ✅ Active |
| Agent Builder       | Create custom AI agents                | ✅ Active |
| Email RAG           | Intelligent email response suggestions | ✅ Active |
| MCP Connector       | Data source connections                | ✅ Active |
| Performance Monitor | System metrics dashboard               | ✅ Active |
| Prompt Library      | Reusable prompt templates              | ✅ Active |
| System Settings     | Application configuration              | ✅ Active |
| Widget Importer     | Import Microsoft widgets               | ✅ Active |
| Live Conversation   | Real-time voice/text chat              | ✅ Active |
| Image Analyzer      | AI-powered image analysis              | ✅ Active |

## 🔐 Security

### Security Features

- ✅ Input sanitization (XSS prevention)
- ✅ URL validation (SSRF prevention)
- ✅ File path sanitization (directory traversal prevention)
- ✅ Rate limiting (DoS protection)
- ✅ JWT authentication
- ✅ Content Security Policy (CSP)
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ Secure WebSocket (WSS)
- ✅ Sensitive data redaction
- ✅ Circuit breaker pattern

### Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

Please report security issues to: **security@widgetboard.example.com**

See [SECURITY.md](SECURITY.md) for our complete security policy.

## 📚 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - System architecture and design patterns
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [Security Policy](SECURITY.md) - Security practices and vulnerability reporting
- [API Documentation](docs/API.md) - API reference (coming soon)
- [Contributing Guide](CONTRIBUTING.md) - How to contribute (coming soon)

## 🛠️ Technology Stack

### Frontend

- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6** - Build tool and dev server
- **react-grid-layout** - Dashboard layout system

### Development

- **Vitest** - Unit testing framework
- **ESLint** - Code linting with security rules
- **Prettier** - Code formatting
- **Testing Library** - Component testing utilities

### Enterprise Features

- **WebSocket (WSS)** - Real-time communication
- **JWT** - Authentication tokens
- **Circuit Breaker** - Fault tolerance
- **Structured Logging** - Comprehensive logging system

## 📊 Performance Metrics

| Metric                   | Target | Status |
| ------------------------ | ------ | ------ |
| First Contentful Paint   | < 1.5s | ✅     |
| Largest Contentful Paint | < 2.5s | ✅     |
| Time to Interactive      | < 3.5s | ✅     |
| Test Coverage            | > 70%  | 🎯     |
| Security Score           | A+     | ✅     |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linter (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Microsoft Fluent Design System
- React and TypeScript communities
- All contributors and maintainers

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Clauskraft/WidgeTDC/issues)
- **Email**: support@widgetboard.example.com

## 🗺️ Roadmap

### Q1 2025

- [ ] Kubernetes deployment manifests
- [ ] Advanced analytics dashboard
- [ ] Plugin marketplace
- [ ] Mobile responsive design

### Q2 2025

- [ ] Offline mode with service workers
- [ ] Real-time collaboration
- [ ] Multi-language support (i18n)
- [ ] Accessibility improvements (WCAG 2.1 AA)

### Q3 2025

- [ ] Advanced RAG features
- [ ] Custom widget SDK
- [ ] Enhanced monitoring and alerting
- [ ] Performance optimization phase 2

---

**Built with ❤️ by the WidgetBoard Team**

**Status**: ✅ Enterprise Ready - Grade A+
