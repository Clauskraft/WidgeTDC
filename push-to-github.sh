#!/bin/bash

# WidgeTDC - Push Script
# Dette script pusher commits til GitHub på den nemmeste måde

set -e

REPO_DIR="/workspaces/WidgeTDC"
cd "$REPO_DIR"

echo "🚀 WidgeTDC Push Script"
echo "======================"
echo ""

# Tjek status
echo "📊 Tjekker status..."
COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")

if [ "$COMMITS_AHEAD" -eq "0" ]; then
    echo "✅ Ingen commits at pushe - alt er opdateret!"
    exit 0
fi

echo "✅ $COMMITS_AHEAD commit(s) klar til push:"
git log origin/main..HEAD --oneline --format="   - %h %s"
echo ""

# Prøv at pushe
echo "🔄 Prøver at pushe til GitHub..."
echo ""

# Prøv direkte push først
if git push origin main 2>&1; then
    echo ""
    echo "✅ SUCCESS! Commits er nu pushet til GitHub!"
    echo ""
    git status -sb
    exit 0
fi

# Hvis push fejlede, giv instruktioner
echo ""
echo "⚠️  Push fejlede - autentificering kræves"
echo ""
echo "📋 LØSNING:"
echo ""
echo "1. Opret Personal Access Token:"
echo "   → Gå til: https://github.com/settings/tokens"
echo "   → Klik 'Generate new token (classic)'"
echo "   → Vælg scope: 'repo' (fuld kontrol)"
echo "   → Kopier tokenen"
echo ""
echo "2. Kør dette script igen, eller push manuelt:"
echo "   git push origin main"
echo "   (Brug token som password)"
echo ""
echo "3. ELLER: Sæt token i environment variabel:"
echo "   export GITHUB_TOKEN='din_token_her'"
echo "   ./push-to-github.sh"
echo ""

# Hvis GITHUB_TOKEN er sat, prøv at bruge den
if [ -n "$GITHUB_TOKEN" ]; then
    echo "🔑 Bruger GITHUB_TOKEN fra environment..."
    git remote set-url origin "https://${GITHUB_TOKEN}@github.com/Clauskraft/WidgeTDC.git"
    
    if git push origin main 2>&1; then
        # Skift tilbage til normal URL
        git remote set-url origin "https://github.com/Clauskraft/WidgeTDC.git"
        echo ""
        echo "✅ SUCCESS! Commits er nu pushet til GitHub!"
        exit 0
    else
        # Skift tilbage til normal URL
        git remote set-url origin "https://github.com/Clauskraft/WidgeTDC.git"
        echo ""
        echo "❌ Push fejlede selv med token. Tjek at tokenen har 'repo' scope."
    fi
fi

exit 1

