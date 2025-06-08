# CLAUDE.md - Optimized AI Agent Guide for CODEX Project

> **🎯 Purpose**: This file provides Claude Code with project-specific context, commands, and workflows to maximize development efficiency and maintain consistency.

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

## 📁 Project Structure & Key Files

```
CODEX Project/
├── 📄 CONTEXT_SUMMARY.md    # START HERE - Project overview & rules
├── 📄 CODEX.md              # Strategic roadmap & phases
├── 📄 README.md             # Technical setup & documentation
├── 📄 CLAUDE.md             # THIS FILE - AI agent guide
├── 🛡️ ecosystem.config.js   # PM2 configuration
├── 📁 frontend/             # Next.js 14 app (Port 3000)
├── 📁 backend/              # Express API (Port 3004)
└── 📁 rust_generator/       # Rust barcode service (Port 3002)
```

### Critical Files to Read First
1. `CONTEXT_SUMMARY.md` - Understand project rules and current state
2. `CODEX.md` - Understand strategic vision and phases
3. `docs/CODEX_DESIGN_SYSTEM.md` - UI/UX guidelines

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

# 5. Check logs for errors
pm2 logs

# 6. Commit with meaningful message
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

---

## 🎯 Common Tasks & Solutions

### Generate a Barcode
```bash
# QR Code
curl -X POST http://localhost:3004/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_type": "qrcode",
    "data": "https://example.com",
    "options": {
      "scale": 4,
      "margin": 2,
      "fgcolor": "#000000",
      "bgcolor": "#FFFFFF"
    }
  }'

# Other types: datamatrix, code128, ean13, etc.
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