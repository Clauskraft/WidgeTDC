# WidgeTDC Frontend - Production Dockerfile
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files for workspaces
COPY package*.json ./
COPY apps/widget-board/package*.json ./apps/widget-board/
COPY packages/domain-types/package*.json ./packages/domain-types/
COPY packages/mcp-types/package*.json ./packages/mcp-types/

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY packages/ ./packages/
COPY apps/widget-board/ ./apps/widget-board/

# Build shared packages (for types if needed)
RUN npm run build:domain-types || true
RUN npm run build:mcp-types || true

# Build frontend with API URL
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

WORKDIR /app/apps/widget-board
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built frontend
COPY --from=build /app/apps/widget-board/dist /usr/share/nginx/html

# Nginx configuration for SPA routing
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA fallback - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Don't cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Health check endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
