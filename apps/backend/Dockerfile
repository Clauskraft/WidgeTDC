# WidgeTDC Backend - Production Dockerfile
FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/domain-types/package*.json ./packages/domain-types/
COPY packages/mcp-types/package*.json ./packages/mcp-types/

# Install all dependencies
RUN npm ci --include=dev

# Copy source code
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

# Build shared packages first
RUN npm run build:domain-types
RUN npm run build:mcp-types

# Build backend
RUN cd apps/backend && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/domain-types/package*.json ./packages/domain-types/
COPY packages/mcp-types/package*.json ./packages/mcp-types/

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts
COPY --from=base /app/packages/domain-types/dist ./packages/domain-types/dist
COPY --from=base /app/packages/mcp-types/dist ./packages/mcp-types/dist
COPY --from=base /app/apps/backend/dist ./apps/backend/dist

# Copy package.json for ESM resolution
COPY --from=base /app/packages/domain-types/package.json ./packages/domain-types/
COPY --from=base /app/packages/mcp-types/package.json ./packages/mcp-types/

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/apps/backend

CMD ["node", "dist/index.js"]
