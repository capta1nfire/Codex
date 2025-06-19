# Database Documentation

## Overview

PostgreSQL database configuration for the CODEX project, including schema design, optimization strategies, and troubleshooting history.

**Current Status**: ✅ **RESOLVED AND STABLE**
- **Database**: PostgreSQL 15 (Docker)
- **Port**: 5432
- **Volume**: `codexproject_postgres_data`
- **ORM**: Prisma
- **Migrations**: Fully applied with hierarchical roles

## Quick Links

- **[Schema Design](./schema.md)** - Database tables and relationships
- **[Indexes](./indexes.md)** - Performance optimization indexes
- **[Migration History](./migrations.md)** - Database evolution
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

## Connection Configuration

### Development
```env
DATABASE_URL="postgresql://codex:secure_password_here@localhost:5432/codexdb?schema=public"
```

### Docker Compose
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: codex
      POSTGRES_PASSWORD: secure_password_here
      POSTGRES_DB: codexdb
    ports:
      - "5432:5432"
    volumes:
      - codexproject_postgres_data:/var/lib/postgresql/data
```

## Key Tables

### User
- Core user information
- Hierarchical roles system
- API key management
- Profile data

### ApiKey
- Secure API key storage
- Usage tracking
- Rate limiting integration

## Performance Optimizations

### Implemented Indexes
1. **API Key Lookup**: 97.5% improvement
2. **Email Login**: 90% faster
3. **Role Queries**: 75% faster

### Query Optimizations
- Single query patterns
- Eliminated N+1 queries
- Redis caching layer

## Security

- Bcrypt password hashing
- API key prefixes for fast lookup
- Row-level security considerations
- Encrypted connections in production