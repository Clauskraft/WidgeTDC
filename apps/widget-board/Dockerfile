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

# Build frontend
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app/apps/widget-board
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built frontend
COPY --from=build /app/apps/widget-board/dist /usr/share/nginx/html

# Nginx configuration for SPA routing and API proxy
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA fallback - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
