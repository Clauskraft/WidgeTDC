# Deployment Guide

## Steps to Deploy WidgeTDC

### 1. Start Backend Server
```bash
cd apps/backend
npm install
npm run dev
```
Backend will run on: http://localhost:3001

### 2. Start Frontend Server
```bash
cd apps/widget-board
npm install
npm run dev
```
Frontend will run on: http://localhost:5173

### 3. Verify Database Initialization
The backend automatically initializes the SQLite database on startup using `sql.js`.
Database schema is loaded from `apps/backend/src/database/schema.sql`.

### 4. Test Deployment
1. Open http://localhost:5173 in your browser
2. Check browser console for any errors
3. Verify backend is responding at http://localhost:3001/health

### Issues Found & Fixed
- Fixed database initialization race condition by using lazy getters in repositories
- Added `"type": "module"` to root package.json for ESLint support

### Next Steps
- Start both servers
- Verify data is being stored in database
- Test widget functionality
