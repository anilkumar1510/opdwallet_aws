# 🔥 COMPLETE ARCHITECTURE CLEANUP & REBUILD PLAN

Delete Everything Old → Build Clean New System → Test Thoroughly

---
## 🗑️ PHASE 1: COMPLETE DELETION OF OLD ARCHITECTURE

### Step 1: Delete Database Collections ✅ DONE - COMPLETED

```bash
# Execute this to remove ALL old collections
docker exec opd-mongo mongosh "mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" --eval "
  print('=== DELETING OLD ARCHITECTURE COLLECTIONS ===');

  // Delete all plan-related collections
  db.planVersions.drop() && print('✓ Deleted planVersions');
  db.benefitComponents.drop() && print('✓ Deleted benefitComponents');
  db.walletRules.drop() && print('✓ Deleted walletRules');
  db.benefitCoverageMatrix.drop() && print('✓ Deleted benefitCoverageMatrix');

  // Check for any variations/duplicates
  db.benefit_coverage_matrix.drop() && print('✓ Deleted benefit_coverage_matrix');
  db.plan_versions.drop() && print('✓ Deleted plan_versions');
  db.wallet_rules.drop() && print('✓ Deleted wallet_rules');
  db.benefit_components.drop() && print('✓ Deleted benefit_components');

  print('\\n=== REMAINING COLLECTIONS ===');
  db.getCollectionNames().forEach(function(name) {
    print('- ' + name);
  });
"
```

### Step 2: Delete Backend Modules ✅ DONE - COMPLETED

```bash
# Navigate to API directory
cd /Users/turbo/Projects/opdwallet/api/src/modules

# Delete entire module directories
rm -rf plan-versions/
rm -rf benefit-components/
rm -rf wallet-rules/
rm -rf benefit-coverage-matrix/
rm -rf benefits/
rm -rf plan-config-resolver/

# Verify deletion
ls -la | grep -E "plan-versions|benefit-components|wallet-rules|benefit-coverage-matrix|benefits|plan-config"
# Should return nothing
```

### Step 3: Delete Frontend Components ✅ DONE - COMPLETED

```bash
# Navigate to web-admin
cd /Users/turbo/Projects/opdwallet/web-admin

# Delete plan version UI components
rm -rf app/admin/policies/[id]/plan-versions/

# Delete any configuration pages
rm -rf app/admin/policies/[id]/config/
rm -rf app/admin/policies/[id]/benefits/
rm -rf app/admin/policies/[id]/wallet/
rm -rf app/admin/policies/[id]/coverage/

# Delete related lib files
rm -rf lib/api/plan-versions.ts
rm -rf lib/api/benefit-components.ts
rm -rf lib/api/wallet-rules.ts
rm -rf lib/api/coverage.ts
rm -rf lib/constants/coverage.ts
rm -rf lib/constants/benefits.ts
```

### Step 4: Clean app.module.ts ✅ DONE - COMPLETED

```typescript
// Remove these imports from api/src/app.module.ts:
// - PlanVersionsModule
// - BenefitComponentsModule
// - WalletRulesModule
// - BenefitCoverageMatrixModule
// - BenefitsModule
// - PlanConfigResolverModule

// The imports array should now look cleaner:
imports: [
  ConfigModule.forRoot(),
  MongooseModule.forRoot(/* ... */),
  ThrottlerModule.forRoot(/* ... */),
  UsersModule,
  AuthModule,
  PoliciesModule,
  AssignmentsModule,
  MastersModule,
  AuditModule,
  // Remove all plan-related modules
]
```

### Step 5: Clean Policy Module Dependencies ✅ DONE - COMPLETED

```typescript
// In api/src/modules/policies/policies.module.ts
// Remove imports of deleted modules
// Remove any services from providers that belonged to deleted modules
```

### Step 6: Search and Destroy All References ✅ DONE - COMPLETED

```bash
# Find and list all files that reference old modules
grep -r "plan-versions\|planVersions\|PlanVersion" api/src/ --exclude-dir=node_modules
grep -r "benefit-components\|benefitComponents\|BenefitComponent" api/src/ --exclude-dir=node_modules
grep -r "wallet-rules\|walletRules\|WalletRule" api/src/ --exclude-dir=node_modules
grep -r "benefit-coverage-matrix\|benefitCoverageMatrix\|CoverageMatrix" api/src/ --exclude-dir=node_modules

# For each file found, remove the import statements and references
```

---
## 🏗️ PHASE 2: BUILD NEW SIMPLIFIED ARCHITECTURE

### Step 1: Create New Module Structure ✅ DONE - COMPLETED

```bash
# Create new plan-config module
mkdir -p api/src/modules/plan-config/{dto,schemas}
```

### Step 2: Create plan-config.schema.ts ✅ DONE - COMPLETED

```typescript
// api/src/modules/plan-config/schemas/plan-config.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type PlanConfigDocument = PlanConfig & Document;

@Schema({
  collection: 'plan_configs',
  timestamps: true,
})
export class PlanConfig {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true,
    index: true
  })
  policyId: mongoose.Types.ObjectId;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({
    required: true,
    enum: ['DRAFT', 'PUBLISHED'],
    default: 'DRAFT'
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  isCurrent: boolean;

  // Consolidated Benefits Configuration
  @Prop({ type: Object, default: {} })
  benefits: {
    consultation?: { enabled: boolean; annualLimit?: number; visitLimit?: number; notes?: string };
    pharmacy?: { enabled: boolean; annualLimit?: number; rxRequired?: boolean; notes?: string };
    diagnostics?: { enabled: boolean; annualLimit?: number; rxRequired?: boolean; notes?: string };
    dental?: { enabled: boolean; annualLimit?: number; notes?: string };
    vision?: { enabled: boolean; annualLimit?: number; notes?: string };
    wellness?: { enabled: boolean; annualLimit?: number; notes?: string };
  };

  // Consolidated Wallet Configuration
  @Prop({ type: Object, default: {} })
  wallet: {
    totalAnnualAmount?: number;
    perClaimLimit?: number;
    copay?: { mode: 'PERCENT' | 'AMOUNT'; value: number };
    partialPaymentEnabled?: boolean;
    carryForward?: { enabled: boolean; percent?: number; months?: number };
    topUpAllowed?: boolean;
  };

  // Simplified Coverage (just list of enabled service codes)
  @Prop({ type: [String], default: [] })
  enabledServices: string[];

  @Prop() createdBy?: string;
  @Prop() updatedBy?: string;
  @Prop() publishedBy?: string;
  @Prop({ type: Date }) publishedAt?: Date;
}

export const PlanConfigSchema = SchemaFactory.createForClass(PlanConfig);

// Compound unique index
PlanConfigSchema.index({ policyId: 1, version: 1 }, { unique: true });
```

### Step 3: Create DTOs ✅ DONE - COMPLETED

```typescript
// api/src/modules/plan-config/dto/create-plan-config.dto.ts
export class CreatePlanConfigDto {
  version?: number; // Auto-increment if not provided
  benefits?: any;
  wallet?: any;
  enabledServices?: string[];
}

// api/src/modules/plan-config/dto/update-plan-config.dto.ts
export class UpdatePlanConfigDto {
  benefits?: any;
  wallet?: any;
  enabledServices?: string[];
}
```

### Step 4: Create Service ✅ DONE - COMPLETED

```typescript
// api/src/modules/plan-config/plan-config.service.ts
@Injectable()
export class PlanConfigService {
  constructor(
    @InjectModel(PlanConfig.name)
    private planConfigModel: Model<PlanConfigDocument>,
  ) {}

  async getConfig(policyId: string, version?: number) {
    if (version) {
      return this.planConfigModel.findOne({ policyId, version });
    }
    return this.planConfigModel.findOne({ policyId, isCurrent: true });
  }

  async updateConfig(policyId: string, version: number, updates: UpdatePlanConfigDto) {
    const config = await this.planConfigModel.findOne({ policyId, version, status: 'DRAFT' });
    if (!config) {
      throw new BadRequestException('Can only edit DRAFT configurations');
    }

    Object.assign(config, updates);
    return config.save();
  }

  async publishConfig(policyId: string, version: number, userId: string) {
    const config = await this.planConfigModel.findOne({ policyId, version, status: 'DRAFT' });
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    config.status = 'PUBLISHED';
    config.publishedAt = new Date();
    config.publishedBy = userId;
    return config.save();
  }

  async setCurrentConfig(policyId: string, version: number) {
    // Remove current flag from all configs
    await this.planConfigModel.updateMany(
      { policyId },
      { isCurrent: false }
    );

    // Set new current
    return this.planConfigModel.updateOne(
      { policyId, version, status: 'PUBLISHED' },
      { isCurrent: true }
    );
  }
}
```

### Step 5: Create Controller ✅ DONE - COMPLETED

```typescript
// api/src/modules/plan-config/plan-config.controller.ts
@Controller('api/policies/:policyId/config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanConfigController {
  constructor(private readonly planConfigService: PlanConfigService) {}

  @Get()
  async getConfig(
    @Param('policyId') policyId: string,
    @Query('version') version?: number,
  ) {
    return this.planConfigService.getConfig(policyId, version);
  }

  @Put(':version')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateConfig(
    @Param('policyId') policyId: string,
    @Param('version') version: number,
    @Body() dto: UpdatePlanConfigDto,
  ) {
    return this.planConfigService.updateConfig(policyId, version, dto);
  }

  @Post(':version/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async publishConfig(
    @Param('policyId') policyId: string,
    @Param('version') version: number,
    @Request() req: any,
  ) {
    return this.planConfigService.publishConfig(policyId, version, req.user.userId);
  }

  @Post(':version/set-current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async setCurrentConfig(
    @Param('policyId') policyId: string,
    @Param('version') version: number,
  ) {
    return this.planConfigService.setCurrentConfig(policyId, version);
  }
}
```

### Step 6: Create Module ✅ DONE - COMPLETED

```typescript
// api/src/modules/plan-config/plan-config.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanConfig.name, schema: PlanConfigSchema },
    ]),
  ],
  controllers: [PlanConfigController],
  providers: [PlanConfigService],
  exports: [PlanConfigService],
})
export class PlanConfigModule {}
```

### Step 7: Update app.module.ts ✅ DONE - COMPLETED

```typescript
// Add to imports array
import { PlanConfigModule } from './modules/plan-config/plan-config.module';

imports: [
  // ... other modules
  PlanConfigModule,
]
```

---
## 🧪 PHASE 3: COMPREHENSIVE TESTING PLAN

### Testing Instructions for Claude Developer Mode

#### 1. INITIAL VERIFICATION ✅ DONE - COMPLETED
```bash
# Verify old collections are gone
docker exec opd-mongo mongosh "mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" --eval "
  var collections = db.getCollectionNames();
  var oldCollections = ['planVersions', 'benefitComponents', 'walletRules', 'benefitCoverageMatrix'];
  var found = [];
  oldCollections.forEach(function(col) {
    if (collections.includes(col)) found.push(col);
  });
  if (found.length > 0) {
    print('ERROR: Old collections still exist: ' + found.join(', '));
  } else {
    print('SUCCESS: All old collections removed');
  }
"
```

#### 2. VERIFY NO OLD CODE REFERENCES ✅ DONE - COMPLETED

```bash
# Check for any remaining imports
cd /Users/turbo/Projects/opdwallet

# Should return ZERO results for each:
grep -r "PlanVersion" api/src --exclude-dir=node_modules | grep -v "plan-config"
grep -r "BenefitComponent" api/src --exclude-dir=node_modules
grep -r "WalletRule" api/src --exclude-dir=node_modules
grep -r "CoverageMatrix" api/src --exclude-dir=node_modules

# Check frontend
grep -r "plan-versions" web-admin/app --exclude-dir=node_modules
grep -r "benefit-components" web-admin/app --exclude-dir=node_modules
```

#### 3. TEST NEW API ENDPOINTS - PENDING

##### Create Test Policy First
```bash
curl -X POST http://localhost:4000/api/policies \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "policyNumber": "POL-2024-001",
    "name": "Test Policy",
    "ownerPayer": "CORPORATE",
    "status": "ACTIVE",
    "effectiveFrom": "2024-01-01"
  }'
# Note the returned policyId
```

##### Test Plan Config CRUD
```bash
# 1. Get config (should return null initially)
curl http://localhost:4000/api/policies/[POLICY_ID]/config \
  -H "Authorization: Bearer [TOKEN]"

# 2. Create config (auto-creates with version 1)
curl -X POST http://localhost:4000/api/policies/[POLICY_ID]/config \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "benefits": {
      "consultation": { "enabled": true, "annualLimit": 50000 },
      "pharmacy": { "enabled": true, "rxRequired": true }
    },
    "wallet": {
      "totalAnnualAmount": 100000,
      "perClaimLimit": 5000,
      "copay": { "mode": "PERCENT", "value": 20 }
    },
    "enabledServices": ["CON001", "PHA001", "DIA001"]
  }'

# 3. Update config
curl -X PUT http://localhost:4000/api/policies/[POLICY_ID]/config/1 \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "benefits": {
      "dental": { "enabled": true, "annualLimit": 20000 }
    }
  }'

# 4. Publish config
curl -X POST http://localhost:4000/api/policies/[POLICY_ID]/config/1/publish \
  -H "Authorization: Bearer [TOKEN]"

# 5. Set as current
curl -X POST http://localhost:4000/api/policies/[POLICY_ID]/config/1/set-current \
  -H "Authorization: Bearer [TOKEN]"
```

#### 4. DATABASE VERIFICATION - PENDING

```bash
docker exec opd-mongo mongosh "mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" --eval "
  // Check new collection exists
  var config = db.plan_configs.findOne();
  if (!config) {
    print('ERROR: No plan_configs documents found');
  } else {
    print('SUCCESS: plan_configs collection working');
    printjson(config);
  }

  // Verify structure
  if (config) {
    var requiredFields = ['policyId', 'version', 'status', 'benefits', 'wallet', 'enabledServices'];
    var missing = [];
    requiredFields.forEach(function(field) {
      if (!(field in config)) missing.push(field);
    });
    if (missing.length > 0) {
      print('ERROR: Missing fields: ' + missing.join(', '));
    } else {
      print('SUCCESS: All required fields present');
    }
  }
"
```

#### 5. BUILD VERIFICATION ✅ DONE - COMPLETED

```bash
# Backend should compile without errors
cd api && npm run build
# Should complete without TypeScript errors

# Frontend should compile
cd ../web-admin && npm run build
# Should complete without import errors
```

#### 6. ERROR SCENARIOS TO TEST - PENDING

##### Test 1: Cannot edit published config
```bash
# First publish a config, then try to edit it
curl -X PUT http://localhost:4000/api/policies/[POLICY_ID]/config/1 \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"benefits": {"consultation": {"enabled": false}}}'
# Should return 400 Bad Request
```

##### Test 2: Cannot publish non-existent version
```bash
curl -X POST http://localhost:4000/api/policies/[POLICY_ID]/config/999/publish \
  -H "Authorization: Bearer [TOKEN]"
# Should return 404 Not Found
```

##### Test 3: Only published can be set as current
```bash
# Try to set DRAFT as current
curl -X POST http://localhost:4000/api/policies/[POLICY_ID]/config/2/set-current \
  -H "Authorization: Bearer [TOKEN]"
# Should fail if version 2 is DRAFT
```

#### 7. PERFORMANCE TEST - PENDING

```bash
# Create multiple configs and measure response time
time for i in {1..10}; do
  curl -X GET http://localhost:4000/api/policies/[POLICY_ID]/config \
    -H "Authorization: Bearer [TOKEN]" \
    -o /dev/null -s -w "%{time_total}\\n"
done
# Average should be < 100ms
```

#### 8. FINAL VALIDATION CHECKLIST - PENDING

- [ ] No TypeScript compilation errors
- [ ] No runtime errors in console
- [ ] All old collections deleted
- [ ] New plan_configs collection exists
- [ ] CRUD operations work
- [ ] Publish workflow works
- [ ] Status validations work
- [ ] No references to old modules
- [ ] Response times acceptable
- [ ] Error handling works properly

---

## 🐛 DEBUGGING GUIDE

### Common Issues and Solutions

#### Issue 1: "Module not found" errors
```bash
# Check for lingering imports
grep -r "import.*plan-versions" api/src/
grep -r "import.*benefit-components" api/src/
# Remove any found imports
```

#### Issue 2: "Collection not found" errors
```bash
# Verify collection exists
docker exec opd-mongo mongosh "mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" --eval "db.plan_configs.countDocuments()"
```

#### Issue 3: API returns 404
```bash
# Check if module is registered
cat api/src/app.module.ts | grep PlanConfigModule
# Should show the module in imports array
```

#### Issue 4: Cannot create/update config
```bash
# Check MongoDB logs
docker logs opd-mongo --tail 50
# Look for connection or permission issues
```

#### Issue 5: Frontend still shows old UI
```bash
# Clear Next.js cache
rm -rf web-admin/.next
npm run dev
```

### DEBUGGING COMMANDS

1. Check all collections
```bash
docker exec opd-mongo mongosh "mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" --eval "db.getCollectionNames()"
```

2. Check running services
```bash
docker-compose ps
```

3. Check API logs
```bash
docker logs opd-api --tail 100
```

4. Check for compilation errors
```bash
cd api && npm run build
```

5. Check for unused dependencies
```bash
npm ls | grep -E "plan-version|benefit-component|wallet-rule"
```

---

## 🎨 FRONTEND IMPLEMENTATION ✅ DONE - COMPLETED

Created complete frontend UI for the new plan-config module:
1. API client library (`/lib/api/plan-config.ts`)
2. Plan configuration list page with version management
3. Plan configuration edit page with:
   - Benefits configuration (all 6 types)
   - Wallet configuration with copay and carry-forward
   - Service enablement
4. Navigation integrated into policy details page
5. Full CRUD operations with Draft/Published workflow

## ✅ SUCCESS CRITERIA

The migration is complete when:

1. **Database**: Only these collections exist:
   - users
   - policies
   - plan_configs (NEW)
   - assignments
   - category_master
   - service_master
   - auditLogs
   - counters

2. **Backend**:
   - No references to old modules
   - Clean compilation
   - All endpoints working

3. **Frontend**:
   - No old configuration pages
   - Clean build
   - Simplified UI working

4. **Testing**:
   - All test scenarios pass
   - No errors in logs
   - Performance acceptable