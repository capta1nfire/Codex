# CLAUDE.md - AI Agent Guide for CODEX Project

> **🎯 Purpose**: This file provides Claude Code with project-specific context, commands, and workflows to maximize development efficiency and maintain consistency. Aligned with [Anthropic's Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices).

> **📋 Note**: If you're a new AI agent, start with `START_HERE.md` first for project orientation. This file is your practical toolkit after understanding the project context.

> **🔄 Living Document**: This file should be iterated and improved based on effectiveness. Last updated: June 14, 2025

### Recent Updates (June 14, 2025)
- ✅ Added Think-Plan-Execute workflow based on Anthropic best practices
- ✅ Added Test-Driven Development (TDD) workflow
- ✅ Added Visual Iteration workflow for UI/UX development
- ✅ Added Claude Code optimization tips and safety considerations
- ✅ Added section on improving this document iteratively
- ✅ Created complementary `.cursorrules` file for Cursor IDE users

---

## 🚀 Quick Start Commands

```bash
# Start all services (RECOMMENDED - with auto-restart)
./pm2-start.sh

# Stop all services
./stop-services.sh

# View logs
pm2 logs              # All services
pm2 logs codex-backend    # Backend only
pm2 logs codex-frontend   # Frontend only
pm2 logs codex-rust       # Rust generator only

# Monitor services
pm2 status            # Quick status
pm2 monit             # Interactive monitor

# Restart services
pm2 restart all       # All services
pm2 restart codex-backend # Specific service
```

---

## 🧭 Quick Navigation Guide

> **💡 TIP**: Use `.nav.md` to find files and workflows instantly instead of searching manually.

The `.nav.md` file is your **GPS for the project** - it contains:
- 📍 **Quick paths** to all important directories
- 🎯 **Common workflows** with exact file sequences
- 🔧 **Ready-to-use commands** for testing and development
- 🔍 **Search patterns** to find code quickly

**Example workflows from `.nav.md`:**
- Add HTTP Endpoint → Follow 6-step workflow
- Add UI Component → Know exactly which files to modify
- Find API endpoints → Use pre-made grep patterns

```bash
# View the navigation guide
cat .nav.md

# Quick example: Find all v2 endpoints
grep -r "app\.use.*'/api/v[12]/" backend/src
```

---

## 📁 Project Structure & Key Files

```
CODEX Project/
├── 📄 START_HERE.md         # START HERE - Project overview & rules
├── 🧭 .nav.md               # QUICK NAVIGATION - Find files & workflows fast
├── 📄 CODEX.md              # Strategic roadmap & phases
├── 📄 README.md             # Technical setup & documentation
├── 📄 CLAUDE.md             # THIS FILE - AI agent guide
├── 🛡️ ecosystem.config.js   # PM2 configuration
├── 📁 frontend/             # Next.js 14 app (Port 3000)
├── 📁 backend/              # Express API (Port 3004)
└── 📁 rust_generator/       # Rust barcode service (Port 3002)
```

### Critical Files to Read First
1. `START_HERE.md` - Understand project rules and current state
2. `.nav.md` - Quick navigation to find files and workflows efficiently
3. `CODEX.md` - Understand strategic vision and phases
4. `docs/CODEX_DESIGN_SYSTEM.md` - UI/UX guidelines
5. `docs/qr-engine/QR_ENGINE_V2_REFERENCE.md` - ⚠️ QR Engine v2 complete reference (MUST READ)

---

## 🧪 Testing Commands

```bash
# Backend tests
cd backend
npm test                  # All tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage

# Frontend tests
cd frontend
npm test                  # Unit tests
npm run test:e2e          # E2E tests (services must be running)

# Validate implementation
node validate_implementation.js  # From root directory

# FLODEX Architecture Validation
./scripts/validate-flodex.sh    # Check FLODEX compliance
./scripts/flodex-metrics        # View architecture metrics
```

---

## 🔧 Development Workflows

### 1. Feature Development Flow
```bash
# 1. Start services
./pm2-start.sh

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes (use appropriate tools)
# - Use Read/Edit for existing files
# - Use Write only for new files
# - Follow existing patterns

# 4. Test your changes
cd backend && npm test
cd frontend && npm test

# 5. Validate FLODEX compliance
./scripts/validate-flodex.sh

# 6. Check logs for errors
pm2 logs

# 7. Commit with meaningful message
git add .
git commit -m "feat: your feature description

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. Debugging Flow
```bash
# 1. Check service status
pm2 status

# 2. View specific service logs
pm2 logs codex-backend --lines 100

# 3. Check for TypeScript errors
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# 4. Check database
docker exec -it codex_postgres psql -U codex_user -d codex_db

# 5. Test specific endpoint
curl -X POST http://localhost:3004/api/generate \
  -H "Content-Type: application/json" \
  -d '{"barcode_type":"qrcode","data":"Test","options":{"scale":2}}'
```

### 3. UI Development Flow
```bash
# 1. Start services
./pm2-start.sh

# 2. Open browser
open http://localhost:3000

# 3. Make UI changes following design system
# - Check docs/CODEX_DESIGN_SYSTEM.md
# - Use existing Tailwind classes
# - Follow component patterns

# 4. Hot reload will show changes automatically

# 5. Take screenshot for verification
# macOS: Cmd+Shift+5
# Provide screenshot path for visual verification
```

### 4. Think-Plan-Execute Workflow (RECOMMENDED)
```bash
# 1. EXPLORE: Read and understand the codebase
# Use Read tool to explore relevant files
# Check .nav.md for quick navigation

# 2. PLAN: Create a detailed plan
# Ask: "Let me create a plan for this feature/fix"
# Use think modes for complex tasks

# 3. EXECUTE: Implement incrementally
# Break down into small, testable chunks
# Verify each step before proceeding

# 4. VERIFY: Review all changes
# Check diffs carefully
# Run tests to confirm nothing broke
```

### 5. Test-Driven Development (TDD) Flow
```bash
# 1. Write tests first
cd backend/src/__tests__
# Create test file for new feature

# 2. Confirm tests fail
npm test -- --testNamePattern="your test"
# Should see red/failing tests

# 3. Implement minimal code to pass
# Write just enough code to make tests green

# 4. Refactor and verify
# Improve code while keeping tests green
# Ask: "Can you verify this implementation meets all requirements?"
```

### 6. Visual Iteration Workflow (UI/UX)
```bash
# 1. Provide design reference
# Share screenshot, mockup, or design URL
# Be specific about requirements

# 2. Initial implementation
# Claude creates first version
# Take screenshot: Cmd+Shift+5 (macOS)

# 3. Iterate 2-3 times
# "Here's the screenshot. Please adjust [specific elements]"
# Each iteration should improve closer to target

# 4. Final polish
# Fine-tune spacing, colors, animations
# Verify responsive behavior
```

### 7. FLODEX Architecture Workflow
```bash
# 1. Before starting any feature
./scripts/validate-flodex.sh
# Ensure clean baseline

# 2. For cross-service features
# Read the guide first
cat docs/flodex/CROSS_SERVICE_FEATURES_GUIDE.md

# 3. During development
# Keep services independent
# Document in service READMEs

# 4. Before committing
./scripts/validate-flodex.sh
# Fix any violations

# 5. Track metrics over time
./scripts/flodex-metrics
# Monitor architecture health
```

---

## 🧠 Claude Code Optimization Tips

### Context Management
- **Use `/clear`** when switching between major tasks to maintain focus
- **Keep sessions focused** on single feature or bug fix
- **Break complex tasks** into smaller, manageable sessions
- **Provide context upfront**: screenshots, URLs, design specs

### Multi-Claude Workflows
```bash
# For complex features, use multiple Claude instances:
# Claude 1: Architecture planning
# Claude 2: Implementation
# Claude 3: Testing and verification

# Example:
"Can you create a subagent to verify this implementation?"
"Please review this code from a security perspective"
```

### Safety Considerations
- ⚠️ **Always review proposed changes** before executing
- 🔒 **Work in isolated branches** for experimental features
- 🧪 **Test in development first** before production changes
- 📝 **Use `/permissions` carefully** when modifying tool access
- 🐳 **Consider containers** for high-risk operations

### Effective Instructions
- Be **specific** rather than general
- Use **"IMPORTANT"** or **"CRITICAL"** for key requirements
- **Course-correct early** - don't wait for complete implementation
- **Provide examples** of desired output format
- **Reference existing patterns** in the codebase

---

## 💻 Code Style Guidelines

### TypeScript/JavaScript
```typescript
// ✅ Use functional components with TypeScript
export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Implementation
};

// ✅ Use proper typing
interface Props {
  prop1: string;
  prop2?: number;
}

// ✅ Use hooks for state and effects
const [state, setState] = useState<Type>(initialValue);

// ❌ Avoid any type
// ❌ Avoid class components
// ❌ Avoid var declarations
```

### File Organization
```typescript
// Order of imports
import React from 'react';                    // 1. React
import { ExternalLib } from 'external-lib';   // 2. External libraries
import { Component } from '@/components';     // 3. Internal components
import { utility } from '@/lib/utils';        // 4. Utilities
import styles from './Component.module.css';  // 5. Styles

// Component structure
1. Interfaces/Types
2. Component definition
3. Hooks
4. Handlers
5. Render
```

### Tailwind CSS Classes
```jsx
// ✅ Use consistent spacing
className="p-4 m-2 space-y-4"

// ✅ Use design system colors
className="text-slate-700 dark:text-slate-300"
className="bg-blue-600 hover:bg-blue-700"

// ✅ Use responsive modifiers
className="w-full md:w-1/2 lg:w-1/3"

// ❌ Avoid inline styles
// ❌ Avoid arbitrary values when possible
```

---

## 🚨 Critical Rules & Warnings

### NEVER DO:
- ❌ Use `npm run dev` directly (use PM2 instead)
- ❌ Modify `CODEX.md` without explicit permission
- ❌ Create documentation without checking existing files
- ❌ Use experimental Next.js features
- ❌ Commit directly to main branch
- ❌ Add console.logs in production code

### ALWAYS DO:
- ✅ Use PM2 for service management
- ✅ Check existing patterns before implementing
- ✅ Run tests before committing
- ✅ Follow the design system (docs/CODEX_DESIGN_SYSTEM.md)
- ✅ Document significant changes in CHANGELOG.md
- ✅ Use TypeScript strict mode

### 🧪 REGLA DE DOCUMENTACIÓN DE FEATURES:
- ❌ NUNCA documentar features sin probar
- ❌ NUNCA asumir que "conectar cables" = funcional
- ✅ Documentar SOLO después de:
  - Test ejecutado exitosamente
  - Resultado verificado visualmente o con logs
  - Confirmación de que funciona como se espera
- ⚠️ Si no probaste = NO está hecho = NO documentes en CHANGELOG

---

## 🎯 Common Tasks & Solutions

### Generate a Barcode

#### NEW API Structure (v1/v2)
```bash
# QR Code (v2 - High Performance)
curl -X POST http://localhost:3004/api/v2/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://example.com",
    "options": {
      "size": 400,
      "eyeShape": "rounded",
      "gradient": {
        "type": "linear",
        "colors": ["#000000", "#666666"]
      }
    }
  }'

# Other Barcodes (v1)
curl -X POST http://localhost:3004/api/v1/barcode \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_type": "code128",
    "data": "123456789",
    "options": {
      "scale": 2
    }
  }'
```

#### ⚠️ CRITICAL: QR Engine v2 Status
- **100% Active** - All QR codes use v2 engine
- **Gradients NOT working** - Processor exists but not integrated
- **See**: `docs/qr-engine/QR_ENGINE_V2_REFERENCE.md` for complete details
- **Known Issue**: `generator.rs` line 207 uses solid colors instead of gradients

#### Legacy Endpoints (Deprecated - Remove June 2025)
```bash
# Old endpoints still work but show deprecation headers
# /api/generate - All barcode types
# /api/qr/* - QR specific endpoints
```

### Add a New API Endpoint
1. Create route in `backend/src/routes/`
2. Add validation schema in `backend/src/schemas/`
3. Implement service logic in `backend/src/services/`
4. Add tests in `backend/src/__tests__/`
5. Update API documentation

### Add a New UI Component
1. Create component in `frontend/src/components/`
2. Follow existing component patterns
3. Use design system tokens and classes
4. Add to appropriate page/layout
5. Test responsive behavior

### Fix Memory Issues
```bash
# Check memory usage
pm2 status

# Restart specific service
pm2 restart codex-backend

# Clear logs if too large
pm2 flush

# Check system memory
free -h  # Linux
vm_stat  # macOS
```

---

## 📊 Performance Optimization

### Backend Optimization
- API responses are cached in Redis for 5 minutes
- Database queries use proper indexes
- Rate limiting prevents abuse

### Frontend Optimization
- Images use Next.js Image component
- Code splitting with dynamic imports
- Tailwind CSS purges unused styles

### Check Performance
```bash
# Backend metrics
curl http://localhost:3004/metrics

# Frontend bundle analysis
cd frontend && npm run analyze
```

---

## 🐛 Debugging Tips

### Service Won't Start
```bash
# Check port availability
lsof -i :3000  # Frontend
lsof -i :3004  # Backend
lsof -i :3002  # Rust

# Check logs
pm2 logs codex-backend --err
pm2 logs codex-frontend --err

# Reset PM2
pm2 delete all
./pm2-start.sh
```

### Database Issues
```bash
# Check Docker
docker ps
docker-compose up -d

# Reset database
cd backend
npx prisma migrate reset
npx prisma db seed
```

### TypeScript Errors
```bash
# Check types
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Clear cache
rm -rf node_modules/.cache
rm -rf .next
```

---

## 🔐 Security Considerations

- JWT tokens expire in 1 hour
- API keys are hashed with bcrypt
- Rate limiting: 100 requests per 15 minutes
- Input validation with Zod schemas
- CORS configured for frontend origin only

---

## 📈 Monitoring & Logs

### View Real-time Logs
```bash
pm2 logs --lines 50         # Last 50 lines all services
pm2 logs codex-backend      # Specific service
pm2 logs --err              # Only errors
```

### Log File Locations
```
logs/
├── backend.log
├── backend-error.log
├── frontend.log
├── frontend-error.log
├── rust.log
└── rust-error.log
```

### Health Checks
```bash
# Backend health
curl http://localhost:3004/health/status

# Frontend health
curl http://localhost:3000/api/health

# Rust generator status
curl http://localhost:3002/status
```

---

## 🎨 UI/UX Guidelines

### Design System v2.0
- **Primary Colors**: Blue-600 to Blue-700 gradients
- **Text**: Slate color scale
- **Spacing**: 4px base unit (p-1 = 4px, p-4 = 16px)
- **Shadows**: Use shadow-sm, shadow-md for depth
- **Animations**: transition-all duration-200

### Component Patterns
```jsx
// Card pattern
<Card className="shadow-sm border border-slate-200 dark:border-slate-700">
  <CardHeader>
    <CardTitle className="text-base font-semibold">Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Button pattern
<Button 
  variant="default"
  size="sm"
  className="bg-blue-600 hover:bg-blue-700"
>
  Action
</Button>
```

---

## 🚀 Deployment Preparation

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] API documentation updated
- [ ] CHANGELOG.md updated

### Build Commands
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# Rust
cd rust_generator
cargo build --release
```

---

## 🧹 Best Practices Checklist for AI Agents

> **📋 QUICK REFERENCE**: Use this checklist to maintain order and structure after making important changes.

### ✅ POST-CHANGE CHECKLIST (Execute ALWAYS after significant modifications)

#### 🔧 1. CODE CLEANUP
- [ ] ✅ **Fix linters**: `npm run lint` (frontend/backend), `cargo clippy` (rust)
- [ ] ✅ **Remove unused imports**: Review TypeScript/ESLint warnings
- [ ] ✅ **Remove unused variables/functions**: Use `ts-prune` or manual analysis
- [ ] ✅ **Remove obsolete comments**: Old TODOs, commented code, temporary notes
- [ ] ✅ **Verify builds**: `npm run build` (frontend/backend), `cargo build` (rust)
- [ ] ✅ **Verify tests**: `npm test` (frontend/backend), `cargo test` (rust)
- [ ] ✅ **Validate FLODEX**: `./scripts/validate-flodex.sh` - Ensure architecture compliance

#### 📝 2. CRITICAL CHANGE DOCUMENTATION
- [ ] ✅ **Architecture changes**: Update `CODEX.md` if applicable
- [ ] ✅ **Port/URL changes**: Update `CODEX.md` PORT CONFIGURATION first
- [ ] ✅ **New dependencies**: Document in corresponding README.md
- [ ] ✅ **API changes**: Update `API_DOCUMENTATION.md`
- [ ] ✅ **Resolved issues**: Add to `docs/TROUBLESHOOTING.md`
- [ ] ✅ **Update START_HERE.md**: "Tasks Completed This Session" section

#### 🗂️ 3. TEMPORARY FILES CLEANUP
- [ ] ✅ **Temporary scripts**: Remove test `.sh`, `.js`, `.py` files
- [ ] ✅ **Test documents**: Remove `test_*.md`, `temp_*.txt`, etc.
- [ ] ✅ **Temporary config files**: `.env.test`, `config.temp.json`, etc.
- [ ] ✅ **Development logs**: Clean `*.log`, `debug_*.txt`, `logs/` folders if needed
- [ ] ✅ **Backup files**: `*.bak`, `*.backup`, `*_old.*`
- [ ] ✅ **Debugging screenshots**: `screenshot_*.png`, etc.

#### 📋 4. DOCUMENTATION ORGANIZATION
- [ ] ✅ **Verify hierarchy**: Follow structure defined in START_HERE.md
- [ ] ✅ **Avoid duplication**: Don't create new docs if you can update existing ones
- [ ] ✅ **Cross-references**: Update links between documents if necessary
- [ ] ✅ **Versioning**: Update "last updated" dates in modified docs

#### 💾 5. VERSION CONTROL
- [ ] ✅ **Atomic commits**: Make frequent commits with descriptive messages
- [ ] ✅ **Check git status**: Ensure no important untracked files
- [ ] ✅ **Push to remote**: `git push` to safeguard changes
- [ ] ✅ **Check .gitignore**: Ensure temporary files aren't uploaded

#### 🎯 6. FINAL VALIDATION
- [ ] ✅ **Functionality intact**: Verify changes didn't break anything
- [ ] ✅ **Development scripts**: Test `./pm2-start.sh` or main command
- [ ] ✅ **Development URLs**: Verify services start on correct ports
- [ ] ✅ **Updated documentation**: Review that docs info matches reality

#### 💾 7. SAVE TO REMOTE REPOSITORY
- [ ] ✅ **Check git status**: `git status` - review modified files
- [ ] ✅ **Add changes**: `git add .` - stage modified files
- [ ] ✅ **Descriptive commit**: `git commit -m "clear description of changes"`
- [ ] ✅ **Push to remote**: `git push` - safeguard work in repository
- [ ] ✅ **Verify successful push**: Confirm no conflicts

> **🚨 IMPORTANT**: Only execute step 7 if steps 1-6 are completely successful and there are NO linter, build or test errors.

### 🚨 SITUATIONS REQUIRING THIS CHECKLIST

**Execute complete checklist after:**
- ✅ Configuration changes (ports, URLs, env vars)
- ✅ Adding/removing important dependencies
- ✅ Architecture or file structure modifications
- ✅ Complex bug fixes
- ✅ New feature implementations
- ✅ Long development sessions (>30 min of changes)

**Execute partial checklist (steps 1, 5, 6) after:**
- ✅ Minor code fixes
- ✅ Documentation updates
- ✅ Minor configuration changes

### 📞 QUICK REFERENCE FOR USERS

**To reference this checklist:**
```
"Execute the best practices checklist (CLAUDE.md section 🧹)"
"Clean the code according to defined best practices"
"Apply the post-changes checklist before finishing"
```

### 🏆 PHILOSOPHY OF ORDER

**Core principles:**
1. **Leave it cleaner than you found it** - Always improve the code state
2. **Document as you go** - Document important changes immediately
3. **Commit early, commit often** - Save progress frequently
4. **Clean up temporarily** - Remove traces of temporary work
5. **Verify before finishing** - Ensure everything works before finishing

---

## 📝 Commit Message Format

```
<type>: <description>

[optional body]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

---

## 🆘 Getting Help

1. Check existing documentation first
2. Search codebase for similar patterns
3. Review test files for usage examples
4. Check logs for detailed error messages

Remember: Context is key. Read relevant files before making changes.

---

## 🔄 Improving This Document

### How to Tune CLAUDE.md
- **Keep it concise** - Remove outdated or rarely-used information
- **Iterate based on effectiveness** - If Claude misses something repeatedly, add clearer instructions
- **Use emphasis strategically** - Add "IMPORTANT", "CRITICAL" for frequently missed requirements
- **Test with real tasks** - Observe where Claude struggles and update accordingly
- **Version control** - Track changes to see what improvements work

### Signs This File Needs Updates
- Claude repeatedly makes the same mistakes
- New patterns or conventions are established
- Project structure changes significantly
- Team discovers better workflows
- Anthropic releases new Claude Code features

### Contribution Guidelines
```bash
# When updating CLAUDE.md:
1. Make changes based on actual pain points
2. Test effectiveness with real development tasks
3. Commit with clear explanation of why change was needed
4. Update "Last updated" date in header
```

### Relationship with .cursorrules
- **CLAUDE.md** - Primary source of truth for all AI agents
- **.cursorrules** - Minimal companion file for Cursor IDE
- **Maintenance** - Keep .cursorrules lightweight, pointing to CLAUDE.md
- **Updates** - Major changes go in CLAUDE.md, Cursor-specific tweaks in .cursorrules

---

## ⚡ FOCUS Methodology - Preventing Documentation Overload

### The Problem
AI agents spend 50%+ time creating unnecessary documentation, forcing humans to waste time cleaning up.

### The Solution: FOCUS (80/20 Rule)
- **80% Code** - Writing actual functionality
- **20% Documentation** - Only critical updates to existing files

### 🎯 Core Principles

#### 1. Before Creating ANY New File (Code or Docs)
```
STOP and ask:
0. Do I have ANY doubt? → ASK THE USER FIRST
1. Does this file already exist? → ASK "Does X.tsx already exist?"
2. Can I update an existing file? → YES = Update that file
3. Is this temporary information? → YES = Don't create
4. Did the user explicitly request this file? → NO = Don't create
5. Will this be obsolete in 30 days? → YES = Don't create
```

**🚨 CARDINAL RULE: WHEN IN DOUBT, ASK**
- "Is there already a component for X?"
- "Where should this functionality go?"
- "I found page.tsx, should I modify it or create a new one?"
- "There's already userService.ts, should I add to it?"

#### 2. Documentation Hierarchy
```
PRIORITY ORDER:
1. Code comments - Best place for implementation details
2. CHANGELOG.md - 2-5 lines per feature/fix
3. TROUBLESHOOTING.md - Only for NEW recurring issues
4. Existing docs in /docs - Update, don't create new
5. README.md files - Only for setup changes
```

#### 3. Anti-Patterns to AVOID
```
DOCUMENTATION:
❌ implementation-notes-YYYYMMDD.md
❌ feature-x-planning.md
❌ session-summary-x.md
❌ temporary-analysis.md
❌ research-notes.md

CODE FILES:
❌ page-v2.tsx (when page.tsx exists)
❌ page-optimized.tsx (when page.tsx exists)
❌ userService-new.ts (when userService.ts exists)
❌ auth-improved.ts (when auth.ts exists)
```

### 📊 Session Workflow

#### Start of Session
1. Read task requirement
2. Find relevant existing files (use .nav.md)
3. Start coding immediately
4. Document inline as you go

#### Every 30 Minutes
Ask yourself:
- Minutes since last code change? (>10 = refocus)
- New files created? (>0 = justify or delete)
- CHANGELOG.md updated? (No = update now)

#### End of Session
1. Update CHANGELOG.md (2-5 lines max)
2. Delete any temporary files
3. Verify no orphan documentation

### 🚀 Examples

#### ❌ BAD Approach (Documentation)
```
User: "Add user notifications"
AI: Creates notification-plan.md
AI: Creates notification-architecture.md
AI: Creates notification-implementation-guide.md
AI: Finally writes some code
Result: 3 files that will be obsolete tomorrow
```

#### ❌ BAD Approach (Code Duplication)
```
User: "Optimize the main page"
AI: Creates page-optimized.tsx
AI: Creates page-v2.tsx
AI: Leaves original page.tsx untouched
Result: 3 versions of the same component!
```

#### ✅ GOOD Approach (Ask First)
```
User: "Add user notifications"
AI: "Should I add this to the existing userService.ts or create a new notificationService.ts?"
User: "Create new service"
AI: Creates notificationService.ts with clear purpose
AI: Updates CHANGELOG.md
Result: Clear architecture, no duplication
```

#### ✅ GOOD Approach (Update Existing)
```
User: "Optimize the main page"
AI: "I found page.tsx. Should I update it directly or create a new version?"
User: "Update directly"
AI: Modifies page.tsx with improvements
AI: Updates CHANGELOG.md: "Optimized main page performance"
Result: One file, clear history, no confusion
```

### 📋 Quick Templates

#### CHANGELOG Entry
```markdown
### 2025-XX-XX
- ✅ Added: [feature] in [file]
- 🔧 Fixed: [bug] in [component]
- 📝 Updated: [what] in [where]
```

#### When Tempted to Create New Doc
```
"This information belongs in:
- Code comments for implementation details
- CHANGELOG.md for what changed
- TROUBLESHOOTING.md for new issues
- Existing /docs file for architectural info"
```

#### Questions to Ask Before Creating Files
```
"I need to [implement X]. I found these related files:
- fileA.ts
- fileB.tsx
Should I modify one of these or create a new file?"

"There's already a page.tsx. Should I:
a) Update it directly
b) Create a new version
c) Refactor into components?"

"I'm about to create [filename]. Does this already exist somewhere?"
```

### 🔒 Enforcement

**Every new .md file requires:**
1. Explicit user permission
2. Justification why existing docs don't work
3. Addition to a navigation/index file
4. Clear maintenance plan

**Remember**: Every unnecessary file = 10+ minutes of human cleanup time