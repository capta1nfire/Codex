# QReable Troubleshooting Guide

> Common issues and their solutions

## Frontend Issues

### Initial QR Code Not Displaying
**Problem**: The default QR code with "https://tu-sitio-web.com" doesn't show on page load.

**Symptoms**:
- Empty preview area shows video placeholder instead of QR code
- QR generation logs show successful API call
- SVG content is received but not displayed

**Root Cause**: 
The `handleQRFormChange` function in `page.tsx` treats the default URL as empty and calls `clearContent()`, clearing the generated QR code immediately after generation.

**Current Status**: Under investigation (as of June 20, 2025)

**Workaround**: 
- The QR code generates correctly when user types any different URL
- No action needed from user perspective - just start typing

**Attempted Fixes**:
1. Added `isInitialMount` check to prevent clearing during initial render
2. Increased generation delay to ensure component readiness
3. Modified initial generation logic with dependencies

**Code Location**: 
- `/frontend/src/app/page.tsx` - Line 355-362
- `/frontend/src/hooks/useBarcodeGenerationV2.ts`
- `/frontend/src/components/generator/PreviewSectionV3.tsx`

---

### QR Studio Placeholder Configuration Lost on Refresh
**Problem**: QR Studio placeholder configuration reverts to default values (circle/circle) after page refresh.

**Symptoms**:
- Studio page shows default eye styles instead of saved configuration
- Console shows config loaded but UI displays wrong values
- Configuration exists in backend but not applied on refresh

**Cause**: Race condition - PlaceholderEditorPage loads before StudioProvider fetches configs from backend.

**Solution**: Wait for StudioProvider to finish loading before applying configuration:
```javascript
// In PlaceholderEditorPage useEffect
useEffect(() => {
  if (isLoading) return; // Wait for configs to load
  const existingConfig = getConfigByType(StudioConfigType.PLACEHOLDER);
  // ... apply config
}, [isLoading, getConfigByType, setActiveConfig]);
```

**Prevention**: Always check loading state when accessing context data that loads asynchronously.

**Code Location**: `/frontend/src/app/studio/placeholder/page.tsx` - Line 64-87

---

## Backend Issues

### PostgreSQL Connection Error on macOS
**Problem**: Prisma/Node.js cannot connect to PostgreSQL Docker container from macOS host.

**Symptoms**:
- Error: "P1010: User was denied access on the database `(not available)`"
- Error: "role qreable_user does not exist"
- psql from macOS shows "role does not exist" even though it exists in Docker container
- Connections work from inside Docker container but fail from macOS host

**Root Cause**:
Local PostgreSQL server (installed via Homebrew) is running on the same port (5432) as the Docker container. When connecting to `localhost:5432`, the connection goes to the local PostgreSQL instance instead of the Docker container.

**Diagnosis**:
```bash
# Check what's listening on port 5432
lsof -i :5432

# You should see:
# - postgres (local macOS process) - THIS IS THE PROBLEM
# - com.docker (Docker Desktop) - This is what you want

# Check if Homebrew PostgreSQL is running
brew services list | grep postgresql
```

**Solution**:
```bash
# Stop the local PostgreSQL service
brew services stop postgresql@14
# or
brew services stop postgresql@16

# Verify only Docker is using port 5432
lsof -i :5432
# Should only show com.docker process

# Test connection from macOS host
PGPASSWORD=qreable_password psql -h localhost -p 5432 -U qreable_user -d qreable_db

# Test Prisma connection
cd backend && npx prisma db push
```

**Prevention**:
- Either keep local PostgreSQL stopped when using Docker
- Or configure Docker PostgreSQL to use a different port (e.g., 5433:5432)

**Alternative Solution** (if you need both PostgreSQL instances):
```yaml
# In docker-compose.yml, change port mapping:
ports:
  - "5433:5432"  # Map Docker's 5432 to host's 5433

# Then update DATABASE_URL in backend/.env:
DATABASE_URL="postgresql://qreable_user:qreable_password@localhost:5433/qreable_db?schema=public"
```

**Code Location**:
- Database configuration: `/backend/.env` - DATABASE_URL
- Docker setup: `docker-compose.yml`

---

### QR v3 Gradient Support
**Clarification**: v3 DOES support gradients, but frontend implementation is incomplete.

**Current State**:
- Backend fully supports gradients via `customization` field
- Frontend only sends `error_correction` parameter
- Gradient options are not being passed from frontend to v3 API

**To Enable Gradients in v3**:
Update `useQRGenerationV3` hook to include full customization options when calling the API.

---

## Performance Issues

### Slow QR Generation
**If QR generation is slow**:
1. Check if Redis cache is running: `docker ps | grep redis`
2. Monitor cache hit rate in backend logs
3. Verify Rust service is running: `pm2 status qreable-rust`

---

## Development Issues

### Services Won't Start
```bash
# Check port availability
lsof -i :3000  # Frontend
lsof -i :3004  # Backend  
lsof -i :3002  # Rust

# Reset all services
pm2 delete all
./pm2-start.sh
```

### TypeScript Errors After Changes
```bash
# Clear caches and rebuild
cd frontend && rm -rf .next node_modules/.cache
cd backend && rm -rf dist
npm install
pm2 restart all
```

---

## Claude Code Issues

### False Positive Policy Violations
**Problem**: Claude Code shows "API Error: Claude Code is unable to respond to this request, which appears to violate our Usage Policy" for legitimate development requests.

**Symptoms**:
- Error appears randomly on normal development tasks
- Same request sometimes works after retrying
- No actual policy violation in the request

**Solutions**:
1. **Break down complex requests** into smaller, specific tasks:
   - Instead of one large request, make multiple focused requests
   - Be explicit about each step you want to accomplish

2. **Use development-friendly language**:
   - Avoid: "hack", "break", "exploit", "vulnerability" without context
   - Use: "debug", "fix", "improve", "enhance", "implement"
   - Always clarify it's for your own development project

3. **Provide clear context**:
   - Start with: "In my development project..."
   - Mention specific files or components you're working on
   - Reference previous context: "Continuing from our previous work..."

4. **Alternative phrasing**:
   - Instead of: "Generate code to bypass X"
   - Try: "Help me implement feature X in my application"
   - Focus on the legitimate purpose of your request

5. **If error persists**:
   - Double-press ESC to edit your message
   - Rephrase using the guidelines above
   - Split into multiple smaller requests
   - Start a new session if needed

**Prevention**: Structure requests clearly, avoid ambiguous terms, and always provide development context.