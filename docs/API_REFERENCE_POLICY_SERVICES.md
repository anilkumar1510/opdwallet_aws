# API Reference: Service-Level Policy Configuration

**Last Updated:** December 8, 2025
**Feature:** Service-Level Policy Configuration
**Version:** 1.0

---

## Overview

This document describes the API endpoints for managing service-level policy configurations. This feature allows administrators to configure which specific services (specialties, lab categories, service types) are available for each policy benefit, and provides member endpoints to retrieve only the services enabled in their policy.

### What Changed

**Previous Behavior:** Policy benefits were configured at CATEGORY level only (e.g., "In-Clinic Consultation: Enabled"). Members could see ALL active services when accessing any benefit.

**New Behavior:** Admins can now select which specific services are enabled when configuring a policy. Members only see services that are enabled in their policy configuration.

---

## Admin API Endpoints

### 1. Get Available Services for Category

**Endpoint:** `GET /api/admin/categories/:categoryId/available-services`

**Description:** Returns the pool of services available for selection based on category mappings. Used in admin portal for service selection UI.

**Authentication:** Required (Admin/Super Admin role)

**Parameters:**
- `categoryId` (path parameter): Category ID (e.g., "CAT001", "CAT003")

**Response:** Different structure based on category type:
- For specialties (CAT001, CAT005): Array of specialty objects
- For lab services (CAT003, CAT004): Array of lab category objects
- For service types (CAT006, CAT007, CAT008): Array of service type objects

**Example Response (Specialties):**
```json
{
  "categoryId": "CAT001",
  "services": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "specialtyId": "SPEC001",
      "name": "Cardiology",
      "description": "Heart and cardiovascular system",
      "icon": "heart",
      "isActive": true
    }
  ]
}
```

---

### 2. Update Service Configuration

**Endpoint:** `PATCH /api/policies/:policyId/config/:version/services/:categoryId`

**Description:** Updates service selections for a specific benefit in a policy configuration. Only works for DRAFT configurations.

**Authentication:** Required (Admin/Super Admin role)

**Parameters:**
- `policyId` (path): Policy ID (ObjectId string)
- `version` (path): Configuration version number
- `categoryId` (path): Category ID (e.g., "CAT001")

**Request Body:**
```json
{
  "serviceIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Field Mapping by Category:**
- **CAT001, CAT005** (Specialties): `serviceIds` → stored as `allowedSpecialties` (ObjectId array)
- **CAT003, CAT004** (Lab Services): `serviceIds` → stored as `allowedLabServiceCategories` (string array)
- **CAT006, CAT007, CAT008** (Service Types): `serviceIds` → stored as `allowedServiceCodes` (string array)

**Response:**
```json
{
  "success": true,
  "message": "Service configuration updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Configuration not in DRAFT status
- `404 Not Found`: Configuration not found
- `403 Forbidden`: Insufficient permissions

---

## Member API Endpoints

All member endpoints use the `BenefitAccessGuard` to ensure the user has access to the requested benefit category before returning filtered services.

### 1. Get Member Allowed Specialties

**Endpoint:** `GET /api/member/benefits/:categoryId/specialties`

**Description:** Returns only specialties enabled in member's policy configuration. Used for in-clinic (CAT001) and online consultation (CAT005) specialty selection.

**Authentication:** Required (Member role)

**Parameters:**
- `categoryId` (path): Category ID ("CAT001" or "CAT005")

**Response:**
```json
{
  "categoryId": "CAT001",
  "services": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "specialtyId": "SPEC001",
      "code": "CARD",
      "name": "Cardiology",
      "description": "Heart and cardiovascular system",
      "icon": "heart",
      "isActive": true
    }
  ],
  "total": 1
}
```

**Empty State Response:**
```json
{
  "categoryId": "CAT001",
  "services": [],
  "total": 0
}
```

**Error Responses:**
- `403 Forbidden`: Benefit not enabled in policy or no active policy found
- `404 Not Found`: No published plan configuration found

---

### 2. Get Member Allowed Lab Services

**Endpoint:** `GET /api/member/benefits/:categoryId/lab-services`

**Description:** Returns only lab service categories enabled in member's policy configuration. Used for diagnostic (CAT003) and laboratory (CAT004) test ordering.

**Authentication:** Required (Member role)

**Parameters:**
- `categoryId` (path): Category ID ("CAT003" or "CAT004")

**Response:**
```json
{
  "categoryId": "CAT003",
  "labServiceCategories": [
    {
      "category": "RADIOLOGY",
      "name": "Radiology & Imaging",
      "description": "X-Ray, CT Scan, MRI, Ultrasound",
      "testCount": 45
    }
  ],
  "total": 1
}
```

---

### 3. Get Member Allowed Service Types

**Endpoint:** `GET /api/member/benefits/:categoryId/services`

**Description:** Returns only service types enabled in member's policy configuration. Used for dental (CAT006), vision (CAT007), and wellness (CAT008) services.

**Authentication:** Required (Member role)

**Parameters:**
- `categoryId` (path): Category ID ("CAT006", "CAT007", or "CAT008")

**Response:**
```json
{
  "categoryId": "CAT006",
  "services": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "serviceCode": "DEN001",
      "name": "Teeth Cleaning",
      "description": "Professional dental cleaning and scaling",
      "baseCost": 500
    }
  ],
  "total": 1
}
```

---

## Database Schema Changes

### Plan Config Schema Updates

Added service selection fields to each benefit in the `plan_configs` collection:

```typescript
benefits: {
  CAT001?: {
    enabled: boolean;
    claimEnabled: boolean;
    vasEnabled: boolean;
    annualLimit?: number;
    visitLimit?: number;
    notes?: string;
    // NEW FIELD:
    allowedSpecialties?: ObjectId[];  // Array of specialty IDs
  };
  CAT003?: {
    enabled: boolean;
    claimEnabled: boolean;
    vasEnabled: boolean;
    annualLimit?: number;
    notes?: string;
    // NEW FIELD:
    allowedLabServiceCategories?: string[];  // ["RADIOLOGY", "ENDOSCOPY"]
  };
  CAT006?: {
    enabled: boolean;
    claimEnabled: boolean;
    vasEnabled: boolean;
    annualLimit?: number;
    notes?: string;
    // NEW FIELD:
    allowedServiceCodes?: string[];  // ["DEN001", "DEN002"]
  };
  // Same pattern for other categories
}
```

**Default Behavior:**
- `undefined` or `null`: Unrestricted (all category-mapped services allowed)
- `[]` (empty array): Fully restricted (no services allowed)
- `[id1, id2]`: Only specified services allowed

---

## Service Layer Changes

### New Files Created

1. **`policy-services-config.service.ts`** - Core service filtering logic for admin and member operations
2. **`policy-services-config.controller.ts`** - Admin endpoints for service configuration
3. **`member-services.controller.ts`** - Member endpoints for filtered services
4. **`update-services-config.dto.ts`** - DTOs for service configuration updates

### Modified Files

1. **`benefit-access.guard.ts`** - Enhanced to handle ObjectId vs String type mismatches in MongoDB queries
2. **`plan-config.module.ts`** - Registered new controllers and services
3. **`plan-config.service.ts`** - Fixed `publishConfig` to automatically set `isCurrent: true` when publishing
4. **`plan-config.schema.ts`** - Added service selection fields to benefit definitions

---

## Frontend Changes

### Admin Portal

**Modified Files:**
- `BenefitsConfigTab.tsx` - Added expandable rows with service selectors
- `page.tsx` - Passed `isNew` prop to prevent auto-save for unsaved configs

**New Components:**
- `SpecialtySelector.tsx` - Specialty selection for CAT001/CAT005
- `LabCategorySelector.tsx` - Lab category selection for CAT003/CAT004
- `ServiceTypeSelector.tsx` - Service type selection for CAT006/007/008

**Features:**
- Expandable rows beneath each enabled benefit
- Search functionality within service selectors
- Select All / Clear All buttons
- Auto-save for existing configs (skipped for new configs)
- Optimistic UI updates with error handling

### Member Portal

**Modified Files:**
- `web-member/app/member/appointments/specialties/page.tsx` - Updated to use filtered API endpoint (CAT001)
- `web-member/app/member/online-consult/specialties/page.tsx` - Updated to use filtered API endpoint (CAT005)

**Changes:**
- Changed from `/api/specialties` to `/api/member/benefits/:categoryId/specialties`
- Updated to use `apiClient` instead of direct `fetch()` for proper base URL handling
- Added improved empty state messages for when no services are configured

---

## Bug Fixes

### 1. Publish Config Not Setting isCurrent Flag

**Issue:** When publishing a plan configuration, the `isCurrent` flag was not automatically set to `true`, causing published configs to not be recognized as active.

**Root Cause:** The `publishConfig` method only set `status: 'PUBLISHED'` but did not update the `isCurrent` flag. A separate `setCurrentConfig` method existed but was not called automatically.

**Fix:** Modified `publishConfig` method to automatically:
1. Set status to 'PUBLISHED'
2. Remove `isCurrent: true` from all other configs for the policy
3. Set `isCurrent: true` on the newly published config

**File Modified:** `api/src/modules/plan-config/plan-config.service.ts:107-137`

### 2. MongoDB Type Mismatch (ObjectId vs String)

**Issue:** Member API endpoints returning "No published plan configuration found" even though configs existed in database.

**Root Cause:** Policy ID stored as STRING in `plan_configs` collection, but queries used ObjectId type, causing query to return empty results.

**Fix:** Modified queries to use `$or` operator to search for both ObjectId and String formats:

```typescript
const policyIdString = assignment.policyId.toString();
const planConfig = await this.planConfigModel.findOne({
  $or: [
    { policyId: assignment.policyId },
    { policyId: policyIdString }
  ],
  isCurrent: true,
  status: 'PUBLISHED',
});
```

**Files Modified:**
- `api/src/modules/plan-config/policy-services-config.service.ts`
- `api/src/common/guards/benefit-access.guard.ts`

---

## Testing Checklist

- [x] Create new policy, enable benefit, select services → Saved correctly
- [x] Member logs in → Sees only selected services
- [x] Configure empty array → Member sees no services
- [x] Configure undefined → Member sees all category-mapped services
- [x] Publish config → Config automatically set as current (isCurrent: true)
- [x] Member portal updates immediately after publish
- [x] Existing policy without config → Continues working (backwards compatible)
- [x] Admin portal service selectors display correctly
- [x] Service selector auto-save works for existing configs
- [x] Service selector skips save for new configs (isNew: true)
- [x] MongoDB type mismatch handled correctly (ObjectId vs String)

---

## Migration Notes

**No database migration required.** The feature is backwards compatible:
- Existing policies without service configuration continue to work
- `allowedSpecialties: undefined` returns ALL category-mapped services
- New policies can explicitly configure service selections

---

## Future Enhancements

1. **Bulk Selection**: Add ability to select multiple services at once
2. **Service Templates**: Pre-defined service selection templates for common policy types
3. **Service Categories**: Group services by category for easier selection
4. **Service Dependencies**: Define service dependencies (e.g., lab test requires consultation)
5. **Usage Analytics**: Track which services are most commonly selected in policies
