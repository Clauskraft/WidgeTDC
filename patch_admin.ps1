# Patch for WidgeTDC_Pro.tsx
# Line 219-220: Add admin conditional
# Line 305: Add closing paren

# Find exact content and replace
$file = "apps/widget-board/WidgeTDC_Pro.tsx"
$content = Get-Content $file -Raw

# Replace line 219-220
$old1 = @"
                {/* Widget Grid Area */}
                <div className={``flex-1 overflow-y-auto p-4 scrollbar-thin `${isDarkMode ? 'scrollbar-track-slate-900 scrollbar-thumb-slate-700' : 'scrollbar-track-slate-100 scrollbar-thumb-slate-300'}``}>
                    <div className="max-w-[1920px] mx-auto min-h-full">
"@

$new1 = @"
                {/* Widget Grid Area */}
                <div className={``flex-1 overflow-y-auto p-4 scrollbar-thin `${isDarkMode ? 'scrollbar-track-slate-900 scrollbar-thumb-slate-700' : 'scrollbar-track-slate-100 scrollbar-thumb-slate-300'}``}>
                    {activeTab === 'admin' ? (
                        <AdminDashboard />
                    ) : (
                    <div className="max-w-[1920px] mx-auto min-h-full">
"@

# Find closing div (line ~305)
$old2 = @"
                        )}
                    </div>
                </div>
"@

$new2 = @"
                        )}
                    </div>
                    )}
                </div>
"@

$content = $content.Replace($old1, $new1)
$content = $content.Replace($old2, $new2)

Set-Content $file -Value $content -NoNewline
Write-Output "Admin integration complete"
