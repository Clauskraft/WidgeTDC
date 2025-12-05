$file = "C:\Users\claus\Projects\WidgeTDC\WidgeTDC\apps\backend\src\mcp\servers\NeuralBridgeServer.ts"
$content = Get-Content $file -Raw
$content = $content -replace 'JSON\.stringify\(', 'safeJsonStringify('
$content = $content -replace ', null, 2\)', ')'
Set-Content $file $content -NoNewline
Write-Host "Fixed all JSON.stringify calls"
