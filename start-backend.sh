#!/bin/bash
# Start backend server

cd apps/backend

# Ensure schema is in dist
mkdir -p dist/database
cp src/database/schema.sql dist/database/ 2>/dev/null || true

echo "🚀 Starting backend server on http://localhost:3001"
echo "📡 MCP WebSocket will be available at ws://localhost:3001/mcp/ws"
echo ""

npm run dev
