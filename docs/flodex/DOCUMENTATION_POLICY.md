# 📚 **CODEX Documentation Policy**

**Version:** 1.0  
**Last Updated:** June 19, 2025  
**Status:** 🟢 Active - Single Source of Truth

---

## 📋 **Table of Contents**

1. [Core Philosophy](#1-core-philosophy)
2. [The 80/20 Rule (FOCUS)](#2-the-8020-rule-focus)
3. [Documentation Hierarchy](#3-documentation-hierarchy)
4. [Creation Policies](#4-creation-policies)
5. [Update Policies](#5-update-policies)
6. [Deletion Policies](#6-deletion-policies)
7. [FLODEX Architecture Rules](#7-flodex-architecture-rules)
8. [Anti-Patterns](#8-anti-patterns)
9. [Templates](#9-templates)
10. [Enforcement](#10-enforcement)

---

## 1. **Core Philosophy**

### **🎯 Guiding Principles**

1. **Documentation serves code, not vice versa** - Code is the priority
2. **Update over create** - Always prefer updating existing docs
3. **Test before document** - Only document what actually works
4. **Keep it maintainable** - Every doc needs an owner and purpose
5. **Ask when in doubt** - Uncertainty means ask the user first

### **📊 The Cost of Documentation**
- Every unnecessary file = 10+ minutes of human cleanup time
- Documentation debt compounds faster than technical debt
- Outdated docs are worse than no docs

---

## 2. **The 80/20 Rule (FOCUS)**

### **⚡ FOCUS Methodology**

```
80% Code - Writing actual functionality
20% Documentation - Only critical updates to existing files
```

### **🎯 Before Creating ANY File**

```
STOP and ask yourself:

0. Do I have ANY doubt? 
   → ASK THE USER FIRST

1. Does this file already exist? 
   → ASK "Does X.md already exist?"

2. Can I update an existing file? 
   → YES = Update that file

3. Is this temporary information? 
   → YES = Don't create

4. Did the user explicitly request this file? 
   → NO = Don't create

5. Will this be obsolete in 30 days? 
   → YES = Don't create
```

### **⏰ Time Checks**
Every 30 minutes ask yourself:
- Minutes since last code change? (>10 = refocus on code)
- New files created? (>0 = justify each one)
- CHANGELOG.md updated? (No = update now)

---

## 3. **Documentation Hierarchy**

### **📝 Priority Order**

| Priority | Location | Use For | Max Size |
|----------|----------|---------|----------|
| 1 | **Code Comments** | Implementation details, complex logic | As needed |
| 2 | **CHANGELOG.md** | What changed, when, and why | 2-5 lines per entry |
| 3 | **Service README** | Service-specific docs, API contracts | 8 sections template |
| 4 | **TROUBLESHOOTING.md** | Recurring issues with solutions | Problem + Solution |
| 5 | **Existing /docs/** | Architecture, guides, policies | Update only |

### **🏗️ FLODEX Service Structure**

```
backend/
  └── README.md          # All backend documentation
frontend/
  └── README.md          # All frontend documentation
rust_generator/
  └── README.md          # All Rust documentation
docs/
  └── flodex/           # Cross-service documentation only
      ├── features/     # Multi-service feature docs
      └── *.md          # Architecture policies
```

---

## 4. **Creation Policies**

### **✅ When to Create New Documentation**

**ONLY create new documentation when ALL conditions are met:**

1. **User explicitly requested it** OR
2. **It's a cross-service feature** (goes in `/docs/flodex/features/`)
3. **No existing file can hold the information**
4. **It will remain relevant for >90 days**
5. **You have a clear maintenance plan**

### **📝 Required Information for New Docs**

Every new document MUST include:
```markdown
**Version:** X.Y  
**Last Updated:** YYYY-MM-DD  
**Owner:** [Service|Team]  
**Review Frequency:** [Monthly|Quarterly|On Change]
```

### **🚫 NEVER Create**

```
❌ implementation-notes-YYYYMMDD.md
❌ feature-x-planning.md
❌ session-summary-x.md
❌ temporary-analysis.md
❌ research-notes.md
❌ meeting-notes.md
❌ todo-list.md
❌ ideas.md
```

---

## 5. **Update Policies**

### **📝 What to Update and Where**

| Change Type | Update Location | Format |
|-------------|----------------|---------|
| **Bug Fix** | CHANGELOG.md | `🔧 Fixed: [description] in [component]` |
| **New Feature** | CHANGELOG.md + Service README | `✅ Added: [feature] in [service]` |
| **API Change** | Service README (API Contract section) | Full endpoint documentation |
| **Breaking Change** | CHANGELOG.md + Migration Guide | `💥 BREAKING: [what changed]` |
| **New Dependency** | Service README (Stack section) | Table with version and purpose |
| **Configuration** | Service README (Environment section) | Variable name, type, description |
| **Known Issue** | TROUBLESHOOTING.md | Problem, Solution, Prevention |

### **🔄 Update Rules**

1. **Update immediately** - Don't batch documentation updates
2. **Be concise** - 2-5 lines for CHANGELOG, bullet points preferred
3. **Include context** - Why the change was made
4. **Test first** - Only document what you've verified works

### **🚨 CRITICAL: Test Before Document**

```
❌ NUNCA documentar features sin probar
❌ NUNCA asumir que "conectar cables" = funcional
✅ Documentar SOLO después de:
   - Test ejecutado exitosamente
   - Resultado verificado visualmente o con logs
   - Confirmación de que funciona como se espera
⚠️ Si no probaste = NO está hecho = NO documentes
```

---

## 6. **Deletion Policies**

### **🗑️ When to Delete Documentation**

**Delete immediately:**
- Temporary files before committing
- Duplicate information (consolidate first)
- Documentation for removed features
- Files older than 6 months with no updates

**Archive don't delete:**
- Historical implementation decisions → `/docs/archive/`
- Deprecated but still referenced docs → `/docs/archive/`
- Migration guides for past versions → `/docs/archive/`

### **📦 Archival Process**

1. Create archive directory: `/docs/archive/[YYYY-MM-DD]_[topic]/`
2. Move files with explanation README
3. Update any references to point to archive
4. Add entry to CHANGELOG.md

---

## 7. **FLODEX Architecture Rules**

### **🏛️ Service Independence**

Each service maintains its own documentation:

```
✅ CORRECT:
backend/README.md       → All backend documentation
frontend/README.md      → All frontend documentation
rust_generator/README.md → All Rust documentation

❌ INCORRECT:
docs/backend-guide.md   → Should be in backend/README.md
docs/frontend-api.md    → Should be in frontend/README.md
```

### **🌉 Cross-Service Documentation**

**ONLY these cases warrant `/docs/flodex/` documentation:**

1. Features affecting 2+ services
2. Integration patterns between services
3. System-wide policies (like this document)
4. Architecture decisions affecting all services

**Use the Cross-Service Template:**
```bash
# Create from template
cp docs/flodex/templates/FEATURE_TEMPLATE.md \
   docs/flodex/features/[feature_name].md
```

---

## 8. **Anti-Patterns**

### **❌ Documentation Anti-Patterns to Avoid**

#### **1. The Daily Journal**
```
❌ 2025-01-15-progress.md
❌ sprint-3-notes.md
❌ week-23-updates.md
```
**Why bad:** Creates clutter, quickly outdated
**Solution:** Use CHANGELOG.md with proper entries

#### **2. The Duplicate**
```
❌ frontend-setup-guide.md (when frontend/README.md exists)
❌ api-v2-docs.md (when backend/README.md has API section)
```
**Why bad:** Information drift, maintenance nightmare
**Solution:** Update existing files

#### **3. The Wishlist**
```
❌ future-features.md
❌ nice-to-have.md
❌ roadmap-ideas.md
```
**Why bad:** Belongs in issue tracker, not docs
**Solution:** Use GitHub Issues/Projects

#### **4. The Code Dumper**
```
❌ code-snippets.md
❌ useful-functions.md
❌ examples.md
```
**Why bad:** Code without context rots quickly
**Solution:** Code comments or service README examples

---

## 9. **Templates**

### **📝 CHANGELOG Entry Template**

```markdown
### YYYY-MM-DD
- ✅ Added: [feature] in [file/component]
- 🔧 Fixed: [bug description] in [component]
- 📝 Updated: [what changed] in [where]
- 💥 BREAKING: [breaking change description]
- 🗑️ Removed: [deprecated feature]
```

### **🔧 TROUBLESHOOTING Entry Template**

```markdown
## Problem: [Clear problem description]
**Symptoms:** What user sees
**Cause:** Root cause
**Solution:** Step-by-step fix
**Prevention:** How to avoid
```

### **📋 Decision Log Template**

```markdown
## Decision: [Title]
**Date:** YYYY-MM-DD
**Status:** Accepted|Rejected|Superseded
**Context:** Why this decision was needed
**Decision:** What we decided
**Consequences:** What this means
**Alternatives:** What else we considered
```

---

## 10. **Enforcement**

### **🚔 Validation Tools**

```bash
# Before committing
./scripts/validate-flodex.sh    # Checks documentation placement
./scripts/validate-focus.sh     # Checks 80/20 rule compliance
```

### **🎯 Pull Request Checklist**

Every PR must verify:
- [ ] No new documentation files without approval
- [ ] CHANGELOG.md updated for significant changes
- [ ] Service READMEs updated for service changes
- [ ] No temporary files included
- [ ] All documentation tested/verified

### **📊 Metrics**

Track documentation health with:
```bash
./scripts/flodex-metrics
```

Key metrics:
- Documentation to code ratio (target: <20%)
- Outdated file detection
- Cross-service documentation count

### **🚨 Consequences**

**For violations:**
1. First offense: PR comment with policy link
2. Second offense: PR requires senior review
3. Persistent violations: Revoke direct commit access

---

## 📞 **Questions?**

**For clarification on policies:**
1. Check this document first
2. Ask in PR comments
3. Propose updates via PR to this file

**Remember:** When in doubt, ASK before creating new documentation.

---

*This document is the single source of truth for all documentation policies in the CODEX project.*