
Write-Host "Waiting for backend to start..."
Start-Sleep -Seconds 15

try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -ErrorAction Stop
    Write-Host "Backend Health: $($health.status)"
}
catch {
    Write-Host "Backend not ready yet. Exiting."
    exit 1
}

Write-Host "`n--- Initial Vidensarkiv Stats ---"
try {
    $statsBefore = Invoke-RestMethod -Uri "http://localhost:3001/api/mcp/route" -Method Post -Body '{"tool":"vidensarkiv.stats","payload":{}}' -ContentType "application/json"
    Write-Host ($statsBefore | ConvertTo-Json -Depth 5)
}
catch {
    Write-Host "Failed to get stats: $_"
}

Write-Host "`n--- Triggering Ingestion of Agent Registry ---"
try {
    # Ingest from All Sources (triggers load())
    $ingest = Invoke-RestMethod -Uri "http://localhost:3001/api/mcp/route" -Method Post -Body '{"tool":"ingestion.start","payload":{}}' -ContentType "application/json"
    Write-Host "Ingestion Triggered: $($ingest.success)"
}
catch {
    Write-Host "Failed to trigger ingestion: $_"
}

Write-Host "Waiting for ingestion processing..."
Start-Sleep -Seconds 10

Write-Host "`n--- Final Vidensarkiv Stats ---"
try {
    $statsAfter = Invoke-RestMethod -Uri "http://localhost:3001/api/mcp/route" -Method Post -Body '{"tool":"vidensarkiv.stats","payload":{}}' -ContentType "application/json"
    Write-Host ($statsAfter | ConvertTo-Json -Depth 5)
}
catch {
    Write-Host "Failed to get stats: $_"
}
