# Multi-stage build for production-ready container

# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files (root first)
COPY package*.json ./

# Copy workspace package.json files to ensure npm ci installs workspace dependencies
COPY apps/widget-board/package.json ./apps/widget-board/package.json
COPY packages/shared/mcp-types/package.json ./packages/shared/mcp-types/package.json
COPY packages/shared/domain-types/package.json ./packages/shared/domain-types/package.json

# Install dependencies (this will install workspace dependencies)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Install Node.js for health checks (optional)

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

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
