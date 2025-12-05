# DEPRECATED: Legacy patch script for widget-board
# This script was used to patch WidgeTDC_Pro.tsx in the old widget-board frontend.
# The widget-board has been replaced with matrix-frontend which has a different structure.
# This script is kept for historical reference only.

Write-Warning "This script is deprecated. The widget-board frontend has been replaced with matrix-frontend."
Write-Warning "The file 'apps/matrix-frontend/WidgeTDC_Pro.tsx' does not exist in the new structure."
exit 1

# Original patch code (preserved for reference):
# Patch for WidgeTDC_Pro.tsx
# Line 219-220: Add admin conditional
# Line 305: Add closing paren

# Find exact content and replace
# $file = "apps/matrix-frontend/WidgeTDC_Pro.tsx"
# $content = Get-Content $file -Raw
# ... (rest of the original patch code)
