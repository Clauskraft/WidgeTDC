# Deployment Guide

## Prerequisites

- Node.js 18+ or 20+
- npm 9+
- Environment variables configured

## Environment Configuration

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Configure required variables:

```env
GEMINI_API_KEY=your_api_key_here
VITE_MCP_SERVER_URL=wss://your-mcp-server.com/mcp
```

3. Validate configuration:

```bash
npm run build
```

## Development Deployment

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Access at http://localhost:3000
```

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Deployment

```bash
# Build image
docker build -t widgetboard:latest .

# Run container
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  widgetboard:latest
```

## Security Checklist

- [ ] All environment variables configured
- [ ] HTTPS/WSS enabled in production
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Authentication configured
- [ ] Logging enabled
- [ ] Error monitoring configured

## Monitoring

- Health check: `/health`
- Metrics: `/metrics`
- Logs: Check console and storage

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues.
