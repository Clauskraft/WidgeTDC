# Development Commands Reference

## Quick Start
```bash
npm install                 # Install all dependencies
npm run dev                 # Run frontend dev server (Vite)
npm run build               # Build all packages for production
```

## Backend Development
```bash
cd apps/backend
npm run dev                 # Start backend API server (watch mode)
npm run build               # Build backend TypeScript
npm run seed                # Seed database with test data
```

## Frontend Development  
```bash
cd apps/widget-board
npm run dev                 # Start Vite dev server with hot reload
npm run build               # Build for production
npm run preview             # Preview production build
```

## Testing & Quality
```bash
npm run test                # Run all tests (watch mode)
npm run test:run            # Run tests once (CI mode)
npm run test:ui             # Open test UI in browser
npm run test:coverage       # Generate coverage report

npm run lint                # Check code style with ESLint
npm run lint:fix            # Fix linting issues automatically
npm run format              # Format all code with Prettier
npm run format:check        # Check formatting without changes
```

## Database & Data
```bash
cd apps/backend
npm run build
node dist/database/seeds.js # Seed test data into SQLite
```

## Monorepo Workspace Commands
```bash
npm test --workspaces                    # Run tests in all workspaces
npm test --workspace=apps/backend        # Test backend only
npm test --workspace=apps/widget-board   # Test frontend only
npm run build:all                        # Build all packages
```

## Git Workflow (Essential)
```bash
git status              # Check current branch and changes
git checkout -b feature/name  # Create feature branch
git add .               # Stage all changes
git commit -m "message" # Commit with message
git push origin feature/name  # Push branch
```

## Docker & Deployment
```bash
docker build -t widget-tdc .      # Build Docker image
docker run -p 3001:3001 widget-tdc # Run container
```

## Windows-Specific Commands
```bash
cd "path/with spaces"   # Always quote paths with spaces
echo %PATH%             # Check environment variables
dir                     # List files (instead of ls)
```

## CI/CD Checks (Before Committing)
```bash
npm run lint:fix        # 1️⃣ Fix linting issues
npm run format          # 2️⃣ Format code
npm run test:run        # 3️⃣ Run tests (once)
npm run build           # 4️⃣ Verify build succeeds
```

## Essential Debugging
```bash
npm run test:ui         # Visual test debugging
npm run test -- --reporter=verbose  # Detailed test output
npm run build -- --sourcemap  # Build with source maps

# Frontend debugging
npm run dev -- --inspect  # Run with debugging enabled
```

## Useful Utility Commands
```bash
npm ls                  # List all installed dependencies
npm ls [package-name]   # Check specific package version
npm outdated            # Check for outdated packages
npm audit               # Security vulnerability check
npm audit fix           # Auto-fix vulnerabilities
```

## Performance Profiling
```bash
npm run test:coverage   # Generate test coverage report
npm run build -- --minify  # Check minified bundle size
```

## Note on Phase 1.B Requirements (Dec 1-15)
These commands are critical for meeting sprint deliverables:
- ✅ Before each commit: `npm run lint:fix && npm run test:run && npm run build`
- ✅ MCP-related changes: Test with `/api/mcp/route` endpoint
- ✅ Widget changes: Verify in both dev and production builds
- ✅ Database changes: Seed test data and verify schema
