#!/bin/bash
# WidgeTDC Auto-Start Services
# Runs each time the Codespace starts

echo "=== Starting WidgeTDC Services ==="

# Create logs directory
mkdir -p /workspaces/WidgeTDC/.devcontainer/logs

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U widgetdc -d widgetdc 2>/dev/null; do
    sleep 2
done

# Ensure database schema is up to date
echo "Syncing database schema..."
cd /workspaces/WidgeTDC/apps/backend
npx prisma db push --accept-data-loss --skip-generate 2>&1 || true

# Start backend in DEV mode (not production)
echo "Starting backend on port 3001..."
cd /workspaces/WidgeTDC/apps/backend
nohup npm run dev > /workspaces/WidgeTDC/.devcontainer/logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend on port 5173..."
cd /workspaces/WidgeTDC/apps/matrix-frontend
nohup npm run dev -- --host 0.0.0.0 > /workspaces/WidgeTDC/.devcontainer/logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Save PIDs for later
echo "$BACKEND_PID" > /workspaces/WidgeTDC/.devcontainer/logs/backend.pid
echo "$FRONTEND_PID" > /workspaces/WidgeTDC/.devcontainer/logs/frontend.pid

echo ""
echo "=== Services Started ==="
echo "Backend:  http://localhost:3001  (logs: .devcontainer/logs/backend.log)"
echo "Frontend: http://localhost:5173  (logs: .devcontainer/logs/frontend.log)"
echo ""
echo "Use 'tail -f .devcontainer/logs/backend.log' to watch backend logs"
echo "Use 'tail -f .devcontainer/logs/frontend.log' to watch frontend logs"
