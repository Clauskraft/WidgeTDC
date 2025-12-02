Write-Host "Starting WidgeTDC Systems..." -ForegroundColor Cyan

# Start Backend
Write-Host "Launching Backend (Port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/backend; npm run dev"

# Start Frontend
Write-Host "Launching Frontend (Vite)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/widget-board; npm run dev"

Write-Host "Systems launching in separate windows." -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3001/api/market/opportunities"
Write-Host "Frontend: http://localhost:5173"
