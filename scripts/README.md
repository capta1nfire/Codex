# 🛠️ CODEX Scripts Directory

This directory contains utility scripts for the CODEX project.

## 🏗️ FLODEX Architecture Scripts

### `validate-flodex.sh`
Validates that the project follows FLODEX architecture principles.

```bash
./scripts/validate-flodex.sh
```

**Checks:**
- Service structure and independence
- Documentation placement
- Cross-service dependencies
- Port configurations
- Required files

**Output:** Color-coded pass/warn/fail results with actionable feedback.

### `flodex-metrics`
Tracks and measures the effectiveness of FLODEX architecture over time.

```bash
./scripts/flodex-metrics
```

**Metrics Tracked:**
- 📚 Documentation to Code Ratio
- 🏛️ Service Independence Score  
- 🌉 Cross-Service Features Count
- ✅ FLODEX Compliance Score
- 🚀 Development Velocity

**Features:**
- Stores historical data for trend analysis
- Visual dashboard with color-coded results
- Execution time under 5 seconds

## 📂 Other Script Categories

### `/ai-helpers/`
Scripts to assist AI agents with development tasks.

### `/dev/`
Development utilities and automation scripts.

### `/test/`
Testing scripts and utilities.

### `/ops/`
Operational scripts for deployment and maintenance.

## 📝 Adding New Scripts

When adding new scripts:
1. Use `.sh` for bash scripts
2. Use `.cjs` for Node.js scripts (due to ES modules)
3. Make scripts executable: `chmod +x script-name`
4. Add documentation here
5. Follow naming convention: `category-action` (e.g., `flodex-validate`)

## 🎯 Best Practices

- Keep scripts focused on a single purpose
- Provide clear error messages
- Use colors for better readability
- Add `--help` flag support for complex scripts
- Store configuration/data in hidden files (`.filename`)