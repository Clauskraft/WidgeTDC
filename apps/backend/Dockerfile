# WidgeTDC Backend - Monorepo Dockerfile
# Bygger fra projekt-roden for at inkludere shared packages

FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite

# Copy root package files (for workspaces)
COPY package*.json ./

# Copy shared packages that backend depends on
COPY packages/domain-types ./packages/domain-types
COPY packages/mcp-types ./packages/mcp-types

# Copy backend
COPY apps/backend ./apps/backend

# Install all dependencies from root
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Build shared packages first
WORKDIR /app/packages/mcp-types
RUN npm run build 2>/dev/null || echo "mcp-types build skipped"

WORKDIR /app/packages/domain-types
RUN npm run build 2>/dev/null || echo "domain-types build skipped"

# Build backend
WORKDIR /app/apps/backend
# RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache sqlite

# Copy built artifacts
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package*.json ./

# Copy runtime assets (schema.sql)
COPY --from=builder /app/apps/backend/src/database/schema.sql ./dist/schema.sql

# Copy external modules from root node_modules (hoisted)
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder /app/node_modules/prebuild-install ./node_modules/prebuild-install
COPY --from=builder /app/node_modules/gpt-3-encoder ./node_modules/gpt-3-encoder

# Create data directories
RUN mkdir -p /app/data /app/logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
