# WidgeTDC Backend - Production Dockerfile
FROM node:20-alpine AS base

# Install dependencies for native modules and openssl for Prisma
RUN apk add --no-cache python3 make g++ git openssl openssl-dev

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

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Build backend
RUN cd apps/backend && npm run build

# Production stage
FROM node:20-alpine AS production

# Install openssl for Prisma runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/domain-types/package*.json ./packages/domain-types/
COPY packages/mcp-types/package*.json ./packages/mcp-types/

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy Prisma schema and client
COPY --from=base /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=base /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma

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

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
