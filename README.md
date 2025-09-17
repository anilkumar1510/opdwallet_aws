# OPD Wallet Application

Healthcare benefits management platform with member and admin portals.

## Quick Start
```bash
# Clone and run with Docker
git clone <repository-url>
cd opdwallet
docker-compose up -d

# Access applications
open http://localhost:3002  # Member Portal
open http://localhost:3001  # Admin Portal
```

## Test Credentials
- **Member**: member@test.com / Test123!
- **Admin**: admin@test.com / Test123!

## Documentation
All project documentation is maintained in three central files:
1. **[01_PRODUCT_ARCHITECTURE.md](01_PRODUCT_ARCHITECTURE.md)** - Product vision, architecture, deployment
2. **[02_DATA_SCHEMA_AND_CREDENTIALS.md](02_DATA_SCHEMA_AND_CREDENTIALS.md)** - Database schemas, configurations
3. **[03_TODO_CHANGELOG.md](03_TODO_CHANGELOG.md)** - Tasks, decisions, changelog

## Deployment Status
✅ **Live at**: http://51.20.125.246
✅ **CI/CD**: Automated via GitHub Actions
✅ **Success Rate**: 100%

### Access Points
- 🌐 Member Portal: http://51.20.125.246
- 👨‍💼 Admin Portal: http://51.20.125.246/admin
- 🔧 API: http://51.20.125.246/api
