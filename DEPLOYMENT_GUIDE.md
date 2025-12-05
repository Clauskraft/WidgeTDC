# Deployment Guide - WidgeTDC

## 🎉 Ready for Deployment

**Version:** 2.0.0  
**Date:** 2025-11-26  
**Status:** ✅ All code committed and pushed to main

---

## 📋 Pre-Deployment Checklist

### Environment Variables Required

Create `.env` file in `apps/backend/`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/widgetdc
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# LLM Providers (at least one required)
OPENAI_API_KEY=sk-...
# OR
DEEPSEEK_API_KEY=sk-...
# OR
GOOGLE_API_KEY=...

# Optional: Multi-Modal Features
CLIP_MODEL_PATH=/path/to/clip/model
AUDIO_MODEL_PATH=/path/to/audio/model
VIDEO_MODEL_PATH=/path/to/video/model

# Environment
NODE_ENV=production
PORT=3000
```

---

## 🚀 Deployment Steps

### 1. Install Dependencies

```bash
# Root
npm install

# Backend
cd apps/backend
npm install

# Frontend
cd apps/matrix-frontend
npm install
```

### 2. Database Setup

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Start Neo4j
docker-compose up -d neo4j

# Run migrations (if any)
npm run migrate --prefix apps/backend
```

### 3. Build Applications

```bash
# Build backend
npm run build --prefix apps/backend

# Build frontend
npm run build --prefix apps/matrix-frontend
```

### 4. Run Tests

```bash
# Backend tests
npm test --prefix apps/backend

# Frontend tests
npm test --prefix apps/matrix-frontend

# Integration tests
npm run test:integration
```

### 5. Start Services

```bash
# Development
npm run dev

# Production
npm run start
```

---

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Individual Services

```bash
# Backend
docker build -t widgetdc-backend ./apps/backend
docker run -p 3000:3000 widgetdc-backend

# Frontend
docker build -t widgetdc-frontend ./apps/matrix-frontend
docker run -p 5173:5173 widgetdc-frontend
```

---

## ✅ Health Checks

After deployment, verify:

```bash
# Overall health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/database

# Neo4j health
curl http://localhost:3000/api/health/neo4j

# Approval system
curl http://localhost:3000/api/approvals/stats
```

Expected responses:
- Status: 200 OK
- All services: "healthy"

---

## 🔧 Configuration

### Feature Flags

Enable/disable features in `.env`:

```bash
# Multi-modal features
ENABLE_MULTIMODAL=true

# External integrations
ENABLE_SLACK=true
ENABLE_GITHUB=true
ENABLE_JIRA=true

# Advanced features
ENABLE_PLUGINS=true
ENABLE_META_LEARNING=true
```

### Security

```bash
# JWT Secret
JWT_SECRET=your-secret-key

# Session Secret
SESSION_SECRET=your-session-secret

# CORS Origins
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## 📊 Monitoring

### Observability Endpoints

```bash
# Traces
GET /api/observability/traces

# Metrics
GET /api/observability/metrics

# Dashboard
GET /api/observability/dashboard
```

### Logs

```bash
# View logs
docker-compose logs -f backend

# Filter by service
docker-compose logs -f neo4j
```

---

## 🔄 Updates & Rollback

### Update

```bash
# Pull latest
git pull origin main

# Rebuild
docker-compose build

# Restart
docker-compose up -d
```

### Rollback

```bash
# Stop services
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose build
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL
```

**Neo4j Not Responding**
```bash
# Check Neo4j
docker-compose logs neo4j

# Verify credentials
echo $NEO4J_URI
```

**LLM API Errors**
```bash
# Verify API key
echo $OPENAI_API_KEY

# Check logs
docker-compose logs backend | grep LLM
```

---

## 📈 Performance Optimization

### Database

```sql
-- Add indexes
CREATE INDEX idx_entities_type ON memory_entities(type);
CREATE INDEX idx_relations_from ON memory_relations(from_id);
```

### Caching

```bash
# Enable Redis caching
ENABLE_CACHE=true
CACHE_TTL=3600
```

### Load Balancing

```nginx
upstream backend {
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

---

## 🔒 Security Checklist

- [ ] All API keys in environment variables
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] SQL injection protection
- [ ] XSS protection headers
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] Audit logging enabled

---

## 📝 Post-Deployment

### Verification Steps

1. ✅ All health checks pass
2. ✅ Can create approval request
3. ✅ Can search in Neo4j
4. ✅ LLM responses working
5. ✅ Frontend loads correctly
6. ✅ WebSocket connections stable
7. ✅ Metrics being collected
8. ✅ Logs being written

### Monitoring Setup

```bash
# Setup alerts
curl -X POST http://localhost:3000/api/alerts/configure

# Enable notifications
curl -X POST http://localhost:3000/api/notifications/enable
```

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ All services running
- ✅ Health checks green
- ✅ No errors in logs
- ✅ Response times < 200ms
- ✅ Database connections stable
- ✅ Frontend accessible
- ✅ API endpoints responding
- ✅ Tests passing

---

## 📞 Support

**Issues:** GitHub Issues  
**Docs:** https://docs.widgetdc.com  
**Status:** https://status.widgetdc.com

---

**Deployed by:** Antigravity AI  
**Deployment Date:** 2025-11-26  
**Version:** 2.0.0  
**Status:** ✅ READY FOR PRODUCTION
