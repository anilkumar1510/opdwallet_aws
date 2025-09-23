# Coverage Matrix Virtual Row Implementation

## Overview
The Coverage Matrix uses a virtual row resolver pattern to ensure all possible category/service combinations are always returned, regardless of whether they exist in the database. This provides a complete matrix view for configuration.

## Architecture

### Database Schema
- **category_master**: Master list of all categories (CONSULTATION, PHARMACY, DIAGNOSTICS)
- **service_types**: Master list of all services linked to categories
- **benefit_coverage_matrix**: Stores actual coverage settings (enabled/disabled) for specific policy plan versions

### Virtual Row Resolution Pattern

The system implements a LEFT JOIN-like pattern in MongoDB to:
1. Fetch all active categories from `category_master`
2. Fetch all active services from `service_types`
3. Create virtual rows for every possible category/service combination
4. Merge with existing coverage settings from `benefit_coverage_matrix` if they exist
5. Default to `enabled: false` for combinations without database records

## API Endpoints

### GET `/api/admin/policies/{policyId}/plan-versions/{version}/coverage/categories`
Returns all active categories from the master table.

**Response:**
```json
[
  {
    "key": "CONSULTATION",
    "name": "Consultation",
    "description": "Medical consultation services",
    "isActive": true
  },
  {
    "key": "PHARMACY",
    "name": "Pharmacy",
    "description": "Pharmacy and medication services",
    "isActive": true
  }
]
```

### GET `/api/admin/policies/{policyId}/plan-versions/{version}/coverage`
Returns the complete coverage matrix with virtual rows.

**Response:**
```json
{
  "policyId": "...",
  "planVersion": 1,
  "rows": [
    {
      "categoryKey": "CONSULTATION",
      "categoryName": "Consultation",
      "serviceCode": "CONS001",
      "serviceName": "General Practitioner Consultation",
      "enabled": true,
      "notes": ""
    },
    // ... all possible combinations
  ]
}
```

### PUT `/api/admin/policies/{policyId}/plan-versions/{version}/coverage`
Updates the coverage matrix, storing only the enabled rows and notes.

### PUT `/api/admin/policies/{policyId}/plan-versions/{version}/coverage/bulk`
Bulk enable/disable all services in a category.

## Implementation Details

### Service Method: getCoverageMatrix

```typescript
async getCoverageMatrix(policyId: string, planVersion: number) {
  // 1. Get all active categories sorted by display order
  const activeCategories = await this.categoryModel.find({ isActive: true })
    .sort({ displayOrder: 1 });

  // 2. Get all active services sorted by display order
  const activeServices = await this.serviceModel.find({ isActive: true })
    .sort({ displayOrder: 1 });

  // 3. Get existing coverage matrix from database
  const matrix = await this.coverageMatrixModel.findOne({
    policyId: new Types.ObjectId(policyId),
    planVersion,
  });

  // 4. Build virtual rows - all possible combinations
  const virtualRows = [];
  for (const category of activeCategories) {
    const categoryServices = activeServices.filter(service =>
      service.categoryId === category.code
    );

    for (const service of categoryServices) {
      // Find existing coverage row if any
      const existingRow = matrix?.rows?.find(row =>
        row.categoryKey === category.code &&
        row.serviceCode === service.serviceCode
      );

      virtualRows.push({
        categoryKey: category.code,
        categoryName: category.name,
        serviceCode: service.serviceCode,
        serviceName: service.serviceName,
        enabled: existingRow?.enabled || false,
        notes: existingRow?.notes || '',
      });
    }
  }

  return { policyId, planVersion, rows: virtualRows };
}
```

## Canonical Naming Convention

Categories use canonical codes as primary identifiers:
- `CONSULTATION` - Medical consultations
- `PHARMACY` - Pharmacy services
- `DIAGNOSTICS` - Diagnostic tests

Services use unique service codes:
- `CONS001`, `CONS002` - Consultation services
- `PHAR001`, `PHAR002` - Pharmacy services
- `DIAG001`, `DIAG002` - Diagnostic services

## Frontend Integration

The frontend Coverage Matrix tab:
1. Fetches categories from the API to populate dropdowns
2. Displays all virtual rows grouped by category
3. Allows toggling individual services or bulk operations per category
4. Only saves changes when explicitly requested
5. Shows modified rows with visual indicators

## Data Seeding

Run the seed script to populate required categories and services:
```bash
node seed-coverage-data.js
```

This ensures the system has at least:
- 3 categories: CONSULTATION, PHARMACY, DIAGNOSTICS
- 10+ services distributed across categories

## Benefits of Virtual Row Pattern

1. **Complete View**: Always shows all possible options, not just configured ones
2. **Consistent UI**: Dropdowns always populate correctly
3. **Default Behavior**: New services automatically appear as disabled
4. **Data Efficiency**: Only stores actual configuration, not defaults
5. **Forward Compatible**: Adding new categories/services automatically reflects in all plan versions