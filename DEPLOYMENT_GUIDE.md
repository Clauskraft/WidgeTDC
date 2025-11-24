# Deployment Guide - WidgeTDC Framework

## Overview

This guide covers deploying the WidgeTDC widget framework to production environments.

## Prerequisites

- Node.js 18+ LTS
- npm 9+
- PostgreSQL 14+ (recommended for production) or SQLite
- Reverse proxy (nginx/Apache)
- SSL certificate

## Production Environment Setup

### 1. Environment Variables

Create `.env` file in `apps/backend/`:

```bash
# Server
PORT=3001
NODE_ENV=production

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/widgettdc

# Security
ALLOWED_ORIGINS=https://yourdomain.com
JWT_SECRET=your-secret-key-here

# Logging
LOG_LEVEL=info
```

### 2. Build for Production

```bash
# Build all packages
npm run build:all

# Or build individually
npm run build --workspace=packages/shared/mcp-types
npm run build --workspace=packages/shared/domain-types
npm run build:backend
npm run build:frontend
```

### 3. Database Migration (Production)

For PostgreSQL, update schema from SQLite:

```sql
-- Convert INTEGER PRIMARY KEY AUTOINCREMENT to SERIAL
-- Convert DATETIME to TIMESTAMP
-- Convert TEXT to VARCHAR or TEXT
-- Adjust other SQLite-specific syntax
```

### 4. Backend Deployment

#### Option A: PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd apps/backend
pm2 start dist/index.js --name widgettdc-backend

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

#### Option B: Docker

Create `apps/backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/mcp-types ./packages/shared/mcp-types
COPY packages/shared/domain-types ./packages/shared/domain-types
COPY apps/backend ./apps/backend

# Install dependencies
RUN npm install --workspace=packages/shared/mcp-types
RUN npm install --workspace=packages/shared/domain-types
RUN npm install --workspace=apps/backend

# Build
RUN npm run build --workspace=apps/backend

# Expose port
EXPOSE 3001

# Start
CMD ["node", "apps/backend/dist/index.js"]
```

Run:
```bash
docker build -t widgettdc-backend -f apps/backend/Dockerfile .
docker run -d -p 3001:3001 --name widgettdc-backend widgettdc-backend
```

### 5. Frontend Deployment

#### Build Static Assets

```bash
cd apps/widget-board
npm run build
```

#### Option A: Nginx

Create `/etc/nginx/sites-available/widgettdc`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        root /var/www/widgettdc/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /mcp/ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable and restart:
```bash
ln -s /etc/nginx/sites-available/widgettdc /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Option B: Docker

Create `apps/widget-board/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/widget-board ./apps/widget-board

RUN npm install --workspace=apps/widget-board
RUN npm run build --workspace=apps/widget-board

FROM nginx:alpine
COPY --from=builder /app/apps/widget-board/dist /usr/share/nginx/html
COPY apps/widget-board/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 6. Security Checklist

- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set secure HTTP headers
- [ ] Enable rate limiting
- [ ] Implement authentication/authorization
- [ ] Regular security updates
- [ ] Database access controls
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using prepared statements)
- [ ] XSS prevention
- [ ] CSRF protection

### 7. Monitoring

#### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs widgettdc-backend

# System metrics
pm2 install pm2-server-monit
```

#### Health Checks

```bash
# Backend health
curl https://yourdomain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "registeredTools": [...]
}
```

### 8. Backup Strategy

#### Database Backup (SQLite)

```bash
# Daily backup
0 2 * * * cp /path/to/widget-tdc.db /backups/widget-tdc-$(date +\%Y\%m\%d).db
```

#### Database Backup (PostgreSQL)

```bash
# Daily backup
0 2 * * * pg_dump widgettdc > /backups/widgettdc-$(date +\%Y\%m\%d).sql
```

### 9. Performance Optimization

#### Backend

1. Enable gzip compression
2. Use connection pooling for database
3. Implement caching (Redis)
4. Use CDN for static assets
5. Enable HTTP/2

#### Frontend

1. Code splitting
2. Lazy loading for widgets
3. Image optimization
4. Browser caching
5. Service worker for offline support

### 10. Scaling

#### Horizontal Scaling

Use load balancer (nginx, HAProxy) with multiple backend instances:

```nginx
upstream backend {
    least_conn;
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

location /api/ {
    proxy_pass http://backend;
}
```

#### Database Scaling

- Read replicas for heavy read workloads
- Connection pooling (pgBouncer)
- Database sharding for multi-tenancy

### 11. Troubleshooting

#### Backend won't start

```bash
# Check logs
pm2 logs widgettdc-backend

# Common issues:
- Port already in use
- Database connection failed
- Missing environment variables
```

#### Frontend not loading

```bash
# Check nginx logs
tail -f /var/log/nginx/error.log

# Common issues:
- CORS configuration
- Wrong API endpoint
- SSL certificate issues
```

#### Database errors

```bash
# Check database connection
sqlite3 widget-tdc.db ".databases"

# Verify schema
sqlite3 widget-tdc.db ".schema"

# Check permissions
ls -la widget-tdc.db
```

### 12. Maintenance

#### Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install --workspaces

# Rebuild
npm run build:all

# Restart services
pm2 restart widgettdc-backend
```

#### Database Migrations

```bash
# Backup first
cp widget-tdc.db widget-tdc.db.backup

# Apply migration
sqlite3 widget-tdc.db < migration.sql

# Verify
sqlite3 widget-tdc.db ".schema"
```

## Production Checklist

- [ ] Build all packages
- [ ] Configure environment variables
- [ ] Set up database (PostgreSQL recommended)
- [ ] Configure reverse proxy (nginx)
- [ ] Enable HTTPS/SSL
- [ ] Set up PM2 or Docker
- [ ] Configure monitoring
- [ ] Set up backups
- [ ] Security hardening
- [ ] Performance testing
- [ ] Load testing
- [ ] Disaster recovery plan

## Support

For production issues:
1. Check logs (PM2, nginx, application)
2. Verify environment variables
3. Test database connectivity
4. Review security settings
5. Check system resources

## Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Note**: This is a general deployment guide. Adjust based on your specific infrastructure and requirements.
