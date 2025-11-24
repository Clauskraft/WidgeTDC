#!/bin/bash
# ============================================
#  DeepSeek SDK Installation Script
#  Tested and verified on Linux/WSL
# ============================================

set -e  # Exit on error

echo "================================================"
echo "  Installing DeepSeek SDK for WidgetTDC"
echo "================================================"
echo ""

# Farver til output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check om vi er i den rigtige mappe
if [ ! -f "package.json" ]; then
    echo -e "${RED}ERROR: package.json ikke fundet!${NC}"
    echo "Kør dette script fra WidgetTDC root mappen"
    exit 1
fi

echo -e "${CYAN}📂 Arbejder i: $(pwd)${NC}"
echo ""

# Stop alle node processer (valgfrit, kun hvis de kører)
echo -e "${YELLOW}🛑 Stopper Node processer...${NC}"
pkill -f "node" 2>/dev/null || echo "   Ingen Node processer kører"
sleep 1

# Ryd op
echo -e "${YELLOW}🗑️  Sletter gamle node_modules og package-lock.json...${NC}"
rm -rf node_modules package-lock.json 2>/dev/null || true
echo "   Slettet!"

# Installer dependencies
echo ""
echo -e "${CYAN}📦 Installerer dependencies...${NC}"
echo "   Dette kan tage et par minutter..."
echo ""

if npm install; then
    echo ""
    echo -e "${GREEN}✅ Installation gennemført!${NC}"
else
    echo ""
    echo -e "${RED}❌ Installation fejlede!${NC}"
    exit 1
fi

# Verificer deepseek-sdk
echo ""
echo -e "${CYAN}🔍 Verificerer installation...${NC}"

if [ -d "node_modules/deepseek-sdk" ]; then
    echo -e "${GREEN}✅ deepseek-sdk installeret korrekt${NC}"
    
    # Vis version info
    DEEPSEEK_VERSION=$(cat node_modules/deepseek-sdk/package.json | grep '"version"' | cut -d'"' -f4)
    echo "   Version: $DEEPSEEK_VERSION"
else
    echo -e "${RED}❌ deepseek-sdk ikke fundet!${NC}"
    exit 1
fi

# Vis statistik
echo ""
echo -e "${CYAN}📊 Installation statistik:${NC}"
npm list --depth=0 2>/dev/null | grep -E "(deepseek|react@)" || true

echo ""
echo "================================================"
echo -e "${GREEN}  ✨ SUCCESS! Alt er klar!${NC}"
echo "================================================"
echo ""
echo "Du kan nu bruge deepseek-sdk i dit projekt:"
echo ""
cat << 'EOF'
  import { DeepSeekAPI } from 'deepseek-sdk';

  const api = new DeepSeekAPI({
    apiKey: process.env.DEEPSEEK_API_KEY
  });

  const response = await api.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: 'Hej!' }]
  });
EOF
echo ""
