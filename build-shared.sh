#!/bin/bash
# Build Shared Packages Script
# Dette script bygger shared packages i den rigtige rækkefølge

set -e  # Exit on error

echo "=== Building Widget TDC Shared Packages ==="

# Byg domain-types først
echo ""
echo "Step 1: Building @widget-tdc/domain-types..."
cd packages/shared/domain-types
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
echo "Building..."
npm run build

# Byg mcp-types derefter
echo ""
echo "Step 2: Building @widget-tdc/mcp-types..."
cd ../mcp-types
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
echo "Building..."
npm run build

# Gå tilbage til root
cd ../../..

echo ""
echo "=== Build Complete! ==="
echo "Both packages built successfully."
