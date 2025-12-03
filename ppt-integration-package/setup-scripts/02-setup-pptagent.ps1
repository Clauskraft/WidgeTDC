# Setup Script 02: Setup PPTAgent Docker
# Starter PPTAgent Docker container

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Step 2: Setup PPTAgent" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Pull Docker image
Write-Host "Pulling PPTAgent Docker image..." -ForegroundColor Yellow
docker pull forceless/pptagent

# Check if container already exists
$existing = docker ps -a --filter "name=pptagent" --format "{{.Names}}"
if($existing -eq "pptagent") {
    Write-Host "Container 'pptagent' already exists. Removing..." -ForegroundColor Yellow
    docker stop pptagent
    docker rm pptagent
}

# Start container
Write-Host "Starting PPTAgent container..." -ForegroundColor Yellow
docker run -dt --name pptagent `
  -e OPENAI_API_KEY=$env:OPENAI_API_KEY `
  -p 9297:9297 -p 8088:8088 `
  -v "$env:USERPROFILE:/root" `
  forceless/pptagent

# Check status
Start-Sleep -Seconds 5
$status = docker ps --filter "name=pptagent" --format "{{.Status}}"
Write-Host "Container status: $status" -ForegroundColor Green

Write-Host ""
Write-Host "✅ PPTAgent Docker container started!" -ForegroundColor Green
Write-Host "Access UI at: http://localhost:8088" -ForegroundColor Cyan
Write-Host "API endpoint: http://localhost:9297" -ForegroundColor Cyan
Write-Host ""
