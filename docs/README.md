# 📚 CODEX Documentation Hub - FLODEX Architecture

## 🏗️ FLODEX Service Documentation

Under the FLODEX architecture, each service maintains its own comprehensive documentation:

### **Service Contracts (Primary Documentation)**
- **[/backend/README.md](/backend/README.md)** - Backend API Gateway contract
- **[/frontend/README.md](/frontend/README.md)** - Frontend Web Application contract  
- **[/rust_generator/README.md](/rust_generator/README.md)** - Rust Generator Engine contract

### **Global Documentation**
- **[/CODEX.md](/CODEX.md)** - Strategic vision and roadmap
- **[/CHANGELOG.md](/CHANGELOG.md)** - Project change history
- **[/CLAUDE.md](/CLAUDE.md)** - AI agent development guide

### **FLODEX Architecture Guides**
- **[flodex/DOCUMENTATION_POLICY.md](./flodex/DOCUMENTATION_POLICY.md)** - Single source of truth for all documentation rules
  - When to create, update, or delete documentation
  - 80/20 rule (FOCUS methodology)
  - Templates and anti-patterns
- **[flodex/CROSS_SERVICE_FEATURES_GUIDE.md](./flodex/CROSS_SERVICE_FEATURES_GUIDE.md)** - How to implement features across services
  - Required reading for multi-service features
  - Templates and best practices included
- **[flodex/features/](./flodex/features/)** - Cross-service feature documentation
  - Design documents for features affecting multiple services

### **QR Engine v2 (Cross-Service Module)**
- **[qr-engine/](./qr-engine/)** - QR Engine v2 documentation
  - Active development module affecting all services
  - Will be distributed post-stabilization

---

## 🔄 Migration Notice (June 19, 2025)

This project has transitioned to the **FLODEX methodology**. Legacy documentation has been archived in `/docs/archive/FLODEX_migration/`.

For any specific technical information:
1. First check the relevant service README
2. Then check global documentation
3. Legacy docs are in archive for historical reference only

---

## 🚀 For New Contributors

1. **Understand Architecture**: Read about FLODEX in each service README
2. **Pick Your Service**: Navigate to the specific service you'll work on
3. **Read the Contract**: Each service README is the authoritative source

*This hub is maintained for navigation purposes under FLODEX principles.*