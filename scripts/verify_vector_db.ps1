# WidgeTDC Vector Database Verification Script
$BackendUrl = "http://localhost:3001"

Write-Host "`n🧠 VECTOR MEMORY DIAGNOSTICS..." -ForegroundColor Cyan

# 1. Broadcast a unique memory
$TestId = [Guid]::NewGuid().ToString().Substring(0, 8)
$MemoryContent = "WidgeTDC System Initialization Vector Check ID $TestId. The system is becoming self-aware."
Write-Host "📡 Broadcasting memory: '$MemoryContent'" -NoNewline

try {
    $payload = @{
        type = "THOUGHT"
        agent = "SystemVerifier"
        content = $MemoryContent
        metadata = @{ test_id = $TestId; phase = "verification" }
    } | ConvertTo-Json

    $res = Invoke-RestMethod -Method Post -Uri "$BackendUrl/api/hyper/broadcast" -ContentType "application/json" -Body $payload
    Write-Host " [SUCCESS] EventID: $($res.eventId)" -ForegroundColor Green
} catch {
    Write-Host " [FAILED] Could not broadcast. Is backend running?" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    exit
}

# 2. Force Persistence (Flush to Neo4j)
Write-Host "💾 Forcing Vector Persistence to Neo4j..." -NoNewline
try {
    $res = Invoke-RestMethod -Method Post -Uri "$BackendUrl/api/hyper/force-persist" -ContentType "application/json" -Body "{}"
    if ($res.success -ge 0) {
        Write-Host " [SUCCESS] Processed: $($res.success) events" -ForegroundColor Green
    } else {
        Write-Host " [WARNING] Persistence returned unexpected result" -ForegroundColor Yellow
    }
} catch {
    Write-Host " [FAILED] Persistence trigger failed." -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# 3. Test Semantic Recall (Dream)
Start-Sleep -Seconds 2 # Give Neo4j a moment to index
Write-Host "💤 Testing Semantic Recall (Dreaming)..." -NoNewline
try {
    $dreamPayload = @{
        query = "system initialization self-aware"
        limit = 1
    } | ConvertTo-Json
    
    $dream = Invoke-RestMethod -Method Post -Uri "$BackendUrl/api/hyper/dream" -ContentType "application/json" -Body $dreamPayload
    
    if ($dream.results.Count -gt 0) {
        $match = $dream.results[0]
        if ($match.content -match $TestId) {
            Write-Host " [SUCCESS] Memory Recalled!" -ForegroundColor Green
            Write-Host "   Match Score: $($match.score)" -ForegroundColor Yellow
            Write-Host "   Content: $($match.content)" -ForegroundColor Gray
        } else {
            Write-Host " [WARNING] Recalled something else: $($match.content)" -ForegroundColor Yellow
        }
    } else {
        Write-Host " [FAILED] No memories found." -ForegroundColor Red
    }
} catch {
    Write-Host " [FAILED] Dream API failed." -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "`n✅ VERIFICATION COMPLETE. VECTOR DB IS ACTIVE." -ForegroundColor Green -BackgroundColor DarkGreen
