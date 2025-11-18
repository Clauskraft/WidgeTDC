#!/bin/bash

# Fix multi-line commit messages that break YAML parsing
# Replace the multi-line commits with single-line messages

# Block 1
sed -i '150,159d' .github/workflows/agent-block-1-dashboard.yml
sed -i '149a\          git commit -m "feat: Add React dashboard shell UI with sidebar navigation - AlexaGPT-Frontend Block 1 (18pts)"' .github/workflows/agent-block-1-dashboard.yml

# Block 2
sed -i '200,210d' .github/workflows/agent-block-2-registry.yml
sed -i '199a\          git commit -m "feat: Implement Widget Registry 2.0 with versioning - GoogleCloudArch Block 2 (42pts)"' .github/workflows/agent-block-2-registry.yml

# Block 3
sed -i '234,245d' .github/workflows/agent-block-3-audit.yml
sed -i '233a\          git commit -m "feat: Implement audit log hash-chain system - CryptographyExpert Block 3 (40pts)"' .github/workflows/agent-block-3-audit.yml

# Block 4
sed -i '112,122d' .github/workflows/agent-block-4-foundation.yml
sed -i '111a\          git commit -m "feat: Implement foundation systems with database layer - DatabaseMaster Block 4 (50pts)"' .github/workflows/agent-block-4-foundation.yml

# Block 5  
sed -i '/git commit -m "feat: Create E2E testing infrastructure/,/QASpecialist/c\          git commit -m "feat: Create E2E testing infrastructure - QASpecialist Block 5 (32pts)"' .github/workflows/agent-block-5-testing.yml

# Block 6
sed -i '/git commit -m "feat: Implement security scanning/,/SecurityCompliance/c\          git commit -m "feat: Implement security scanning and compliance - SecurityCompliance Block 6 (28pts)"' .github/workflows/agent-block-6-security.yml

echo "✓ All workflows fixed"
