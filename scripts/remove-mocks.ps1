# Remove Mock Data Script
# This script identifies and helps remove mock data from the codebase

Write-Host "🔍 Scanning for mock data and functions..." -ForegroundColor Yellow

$mockFiles = @()

# Search for mock-related code
$patterns = @(
    "mock",
    "Mock",
    "MOCK",
    "placeholder",
    "TODO.*mock",
    "For now.*mock"
)

foreach ($pattern in $patterns) {
    $results = Get-ChildItem -Path "apps\backend\src" -Recurse -Include *.ts, *.tsx -Exclude *.test.ts, *.spec.ts | 
    Select-String -Pattern $pattern -CaseSensitive:$false
    
    foreach ($result in $results) {
        $mockFiles += [PSCustomObject]@{
            File    = $result.Filename
            Path    = $result.Path
            Line    = $result.LineNumber
            Content = $result.Line.Trim()
        }
    }
}

# Display results
Write-Host "`n📋 Found $($mockFiles.Count) potential mock references:" -ForegroundColor Cyan

$mockFiles | Group-Object -Property File | ForEach-Object {
    Write-Host "`n📄 $($_.Name) ($($_.Count) occurrences)" -ForegroundColor Yellow
    $_.Group | ForEach-Object {
        Write-Host "   Line $($_.Line): $($_.Content)" -ForegroundColor Gray
    }
}

# Critical files to review
$criticalFiles = @(
    "apps\backend\src\mcp\cognitive\MultiModalProcessor.ts",
    "apps\backend\src\services\llm\llmService.ts",
    "apps\backend\src\services\docgen\MCPPowerPointBackend.ts",
    "apps\backend\src\services\agent\agentController.ts",
    "apps\backend\src\mcp\toolHandlers.ts"
)

Write-Host "`n⚠️  CRITICAL FILES TO REVIEW:" -ForegroundColor Red
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Next Steps:" -ForegroundColor Green
Write-Host "1. Review each file listed above"
Write-Host "2. Replace mock functions with real implementations"
Write-Host "3. Remove placeholder comments"
Write-Host "4. Test thoroughly after changes"
Write-Host "5. Run: npm test"

Write-Host "`n💡 Tip: Use 'git diff' to review changes before committing" -ForegroundColor Cyan
