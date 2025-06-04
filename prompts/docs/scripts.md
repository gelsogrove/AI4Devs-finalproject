# ShopMefy Scripts Documentation

## 📋 Available Scripts

### 🔄 `reset-development.sh`
**Purpose**: Complete development environment reset

**What it does**:
1. 🧹 Cleans `uploads/documents` directory
2. 🧹 Cleans `prisma/temp` directory  
3. 🌱 Runs database seed
4. 📁 Moves example files to uploads
5. ✅ Verifies final state

**Usage**:
```bash
./scripts/reset-development.sh
# OR via npm
cd backend && npm run db:clean
```

**When to use**: 
- Starting fresh development session
- After corrupted data
- Before testing with clean state

---

### 🚀 `restart-all.sh`
**Purpose**: Restart complete ShopMefy system

**What it does**:
1. 🛑 Kills processes on ports 3001 (backend) and 3000 (frontend)
2. 🐳 Checks if Docker is running (exits if not)
3. 🐳 Restarts Docker containers (database)
4. ⏳ Waits for database to be ready (8 seconds)
5. 🟢 Starts backend (foreground with logs)
6. 🟢 Starts frontend (foreground with logs)

**Usage**:
```bash
./scripts/restart-all.sh
```

**When to use**:
- Complete system restart
- After Docker issues
- When database needs restart
- Fresh start with logs visible

**Requirements**:
- Docker Desktop must be running
- Backend and frontend dependencies installed

---

### 🧪 `run-e2e-tests.sh`
**Purpose**: Automated end-to-end testing with complete system setup

**What it does**:
1. 🚀 Calls `restart-all.sh` for complete system setup
2. ⏳ Waits for backend health check (30 attempts)
3. ⏳ Waits for frontend availability (30 attempts)
4. 🧪 Runs Cypress tests in headless mode
5. ✅ Returns test results (exit code)

**Usage**:
```bash
./scripts/run-e2e-tests.sh
```

**When to use**:
- CI/CD pipeline
- Before deployment
- Automated testing with full environment

**Requirements**:
- Docker Desktop must be running (handled by restart-all.sh)
- Cypress installed
- Backend and frontend dependencies installed

**Note**: This script leverages `restart-all.sh` for system setup, avoiding code duplication.

---

### 📦 `generate-zip-archives.sh`
**Purpose**: Create deployment archives

**What it does**:
1. 🗑️ Removes old `backend.zip` and `frontend.zip`
2. 📦 Creates new `backend.zip` from backend directory
3. 📦 Creates new `frontend.zip` from frontend directory

**Usage**:
```bash
./scripts/generate-zip-archives.sh
```

**When to use**:
- Preparing deployment packages
- Creating backups
- Sharing project code

---

## 🎯 Quick Reference

| Script | Primary Use | Time | Dependencies |
|--------|-------------|------|--------------|
| `reset-development.sh` | Clean environment | ~30s | Database, Prisma |
| `restart-all.sh` | Restart services | ~15s | Node.js, npm, Docker |
| `run-e2e-tests.sh` | Run tests | ~2-5min | restart-all.sh, Cypress |
| `generate-zip-archives.sh` | Create archives | ~5s | zip utility |

## 🔧 Prerequisites

**All scripts require**:
- Node.js and npm installed
- Docker running (for database)
- Proper file permissions (`chmod +x scripts/*.sh`)

**Specific requirements**:
- `reset-development.sh`: Prisma CLI, database connection
- `restart-all.sh`: kill-port package (optional)
- `run-e2e-tests.sh`: Cypress installed
- `generate-zip-archives.sh`: zip utility

## ⚠️ Important Notes

- **Always run from project root**: `./scripts/script-name.sh`
- **Database required**: Most scripts need PostgreSQL running
- **Port conflicts**: Scripts handle common port cleanup
- **Background processes**: Use `Ctrl+C` or manual kill for cleanup
- **Permissions**: Make scripts executable with `chmod +x scripts/*.sh`

## 🚨 CRITICAL ISSUE - PDF FILE MANAGEMENT

**⚠️ RECURRING PROBLEM (10th time!)**: 
The `international-transportation-law.pdf` file in `prisma/temp/` is **NOT** being properly copied to `uploads/documents/` during seeding.

**Expected behavior**:
1. Seed creates PDF in `prisma/temp/`
2. Script copies PDF to `uploads/documents/`
3. PDF remains available for AI processing

**Current issue**:
- File exists in `prisma/temp/` after seed
- File copying logic in `reset-development.sh` was failing
- **FIXED**: Updated script to use `find` instead of `ls -A` pattern matching

**To verify fix works**:
```bash
# After running db:clean, check both locations:
ls -la backend/prisma/temp/
ls -la backend/uploads/documents/
# Both should contain international-transportation-law.pdf
```

**If issue persists**: Check seed script and file copying logic in `reset-development.sh` Step 4.

## 🚨 CRITICAL ISSUE - CYPRESS CONFIGURATION

**⚠️ MAJOR PROBLEM**: 
Cypress was configured with wrong baseUrl pointing to backend instead of frontend.

**Problem**:
- Cypress config had `baseUrl: 'http://localhost:3001'` (backend)
- All E2E tests were failing with 404 errors
- Tests were trying to load frontend pages on backend port

**Solution**:
- **FIXED**: Changed to `baseUrl: 'http://localhost:3000'` (frontend)
- Backend API calls in tasks still use correct port 3001
- Frontend pages now load correctly in tests

**Ports summary**:
- **3000**: Frontend (Cypress baseUrl)
- **3001**: Backend (API calls)
- **5434**: Database (Docker) 