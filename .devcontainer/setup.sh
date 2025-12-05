#!/bin/bash
# WidgeTDC Codespace Setup Script
# Runs once when the container is created

set -e

echo "=== WidgeTDC Codespace Setup ==="

# Copy Codespace env if .env doesn't exist
if [ ! -f apps/backend/.env ]; then
    echo "Creating .env from .env.codespace..."
    cp apps/backend/.env.codespace apps/backend/.env
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate --schema=./apps/backend/prisma/schema.prisma

# Wait for PostgreSQL to be ready (using Node.js since pg_isready isn't installed)
echo "Waiting for PostgreSQL..."
until node -e "const net = require('net'); const client = new net.Socket(); client.setTimeout(3000); client.connect(5432, 'postgres', () => { client.destroy(); process.exit(0); }); client.on('error', () => process.exit(1)); client.on('timeout', () => { client.destroy(); process.exit(1); });" 2>/dev/null; do
    sleep 2
done
echo "PostgreSQL is ready!"

# Push schema to database
echo "Syncing database schema..."
cd apps/backend
npx prisma db push --accept-data-loss
cd ../..

# Build shared packages
echo "Building shared packages..."
npm run build:shared || true

# Build backend
echo "Building backend..."
cd apps/backend
npm run build || true
cd ../..

echo "=== Setup Complete ==="
echo "Run 'npm run dev' to start both frontend and backend"
