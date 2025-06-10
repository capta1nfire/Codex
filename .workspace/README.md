# 🗂️ Workspace Directory

This directory is for temporary work and session management.

## Structure

```
.workspace/
├── temp/           # Temporary files (auto-cleaned)
├── session-logs/   # Work session logs
└── README.md       # This file
```

## Usage

### Temporary Files
Place any temporary test scripts or files in `temp/`. 
These are gitignored and can be safely deleted.

### Session Logs
Each work session should create a log in `session-logs/` with format:
`YYYY-MM-DD-description.md`

## Git Policy
- ✅ `session-logs/` is committed (valuable history)
- ❌ `temp/` is gitignored (disposable files)

## Cleanup
Run `rm -rf .workspace/temp/*` to clean temporary files.