# 📁 Scripts Directory Organization

## Structure

```
scripts/
├── ai-helpers/     # Tools to help AI agents work efficiently
├── dev/           # Development utilities
├── test/          # Testing scripts
├── ops/           # Operational/deployment scripts
└── README.md      # This file
```

## 📂 Directory Purposes

### `ai-helpers/`
Scripts specifically designed to help AI agents navigate and work with the codebase:
- Session management tools
- Code navigation helpers
- Quick status checks
- Cleanup utilities

### `dev/`
Development workflow scripts:
- Code generation helpers
- Database migrations
- Local environment setup
- Hot-reload utilities

### `test/`
Testing and validation scripts:
- Load testing tools
- Integration test runners
- Performance benchmarks
- API endpoint testers

### `ops/`
Operational and deployment scripts:
- Performance optimization
- Service management
- Deployment automation
- Monitoring setup

## 🚀 Quick Access

### For AI Agents
```bash
# Start a new session
./scripts/ai-helpers/session-start.sh

# Get project status
./scripts/ai-helpers/project-status.sh

# Find recently modified files
./scripts/ai-helpers/recent-changes.sh

# Clean workspace
./scripts/ai-helpers/session-cleanup.sh
```

### For Testing
```bash
# Run load tests
node ./scripts/test/gradual-test-with-token.js

# Test authentication
node ./scripts/test/direct-auth-test.js
```

### For Operations
```bash
# Optimize performance
./scripts/ops/optimize-performance.sh

# Setup load balancer
./scripts/ops/setup-rust-load-balancer.sh
```

## 📝 Creating New Scripts

1. Place in appropriate subdirectory
2. Add execution permissions: `chmod +x script.sh`
3. Include header comment with purpose
4. Update this README if significant

## 🏷️ Naming Conventions

- Shell scripts: `kebab-case.sh`
- Node scripts: `kebab-case.js`
- Test scripts: `test-*.js` or `*-test.js`
- Helper scripts: Purpose-first naming (e.g., `session-start.sh`)

---
*Organization implemented: June 10, 2025*