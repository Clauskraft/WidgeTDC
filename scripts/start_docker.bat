@echo off
title WidgeTDC Docker Launcher
color 0A

echo ===================================================
echo   WidgeTDC - Complete Docker Stack Launcher
echo ===================================================
echo.
echo   All services will run in Docker containers:
echo   - Backend (Node.js)
echo   - Frontend (Nginx + React)
echo   - PostgreSQL (with pgvector)
echo   - Redis (caching)
echo   - Neo4j (knowledge graph)
echo   - Prometheus + Grafana (monitoring)
echo   - NocoDB (admin interface)
echo.
echo ===================================================

echo.
echo [1/4] Checking Docker status...
docker info > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)
echo       Docker is running.

echo.
echo [2/4] Stopping any existing containers...
docker-compose down 2>nul
echo       Done.

echo.
echo [3/4] Building and starting all services...
echo       This may take 5-10 minutes on first run.
echo.
docker-compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to start services!
    echo Run 'docker-compose logs' to see errors.
    pause
    exit /b 1
)

echo.
echo [4/4] Waiting for services to be ready...
timeout /t 30 /nobreak > nul

echo.
echo ===================================================
echo   SYSTEM IS NOW RUNNING!
echo ===================================================
echo.
echo   Access points:
echo   - Frontend Dashboard: http://localhost:8888
echo   - Backend API:        http://localhost:3001
echo   - Grafana Monitoring: http://localhost:3000 (admin/admin)
echo   - Neo4j Browser:      http://localhost:7474 (neo4j/password)
echo   - NocoDB Admin:       http://localhost:8080
echo   - Prometheus:         http://localhost:9090
echo.
echo   Useful commands:
echo   - View logs:    docker-compose logs -f
echo   - Stop system:  docker-compose down
echo   - Full reset:   docker-compose down -v
echo.
echo ===================================================
echo.
pause
