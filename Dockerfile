# Multi-stage build for production-ready container

# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy ALL package files first (root + all workspaces)
COPY package*.json ./
COPY apps/widget-board/package.json ./apps/widget-board/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/mcp-types/package.json ./packages/shared/mcp-types/
COPY packages/shared/domain-types/package.json ./packages/shared/domain-types/

# Install ALL dependencies including workspace dependencies
# Use --legacy-peer-deps to handle React 19 peer dep issues
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build application (frontend only for this container)
RUN cd apps/widget-board && npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from widget-board dist
COPY --from=builder /app/apps/widget-board/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Add labels
LABEL maintainer="WidgetBoard Team"
LABEL version="1.0.0"
LABEL description="Enterprise-grade widget dashboard platform"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
