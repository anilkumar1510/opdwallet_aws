# Lab Service Mapping Implementation

**Date:** December 5, 2025
**Feature:** Category-Lab Service Mapping for CAT004 (Laboratory)
**Status:** ✅ Deployed

---

## Overview

Implemented a lab service mapping system that allows administrators to configure which lab services from the Lab Services catalog are enabled for the Laboratory category (CAT004) in the Services Management page.

---

## What Changed

### Summary
Added a new mapping system that displays all lab services in the CAT004 (Laboratory) tab of the Services Management page (`/admin/services`). Administrators can now toggle lab services ON/OFF to control which services are available for the Laboratory category. New lab services automatically appear in the interface when created.

---

## New API Endpoints

### 1. Get Lab Services with Mapping Status
**Endpoint:** `GET /api/categories/:categoryId/lab-services`
**Auth:** SUPER_ADMIN or ADMIN role required
**Parameters:**
- `categoryId` (path) - Category ID (currently supports CAT004 only)

**Response:** Array of lab services with mapping status
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "serviceId": "SVC-1234567890-abc",
    "code": "CBC",
    "name": "Complete Blood Count (CBC)",
    "description": "Complete blood count test",
    "category": "PATHOLOGY",
    "sampleType": "Blood",
    "preparationInstructions": "8-10 hours fasting required",
    "isActive": true,
    "displayOrder": 1,
    "isEnabledForCategory": false
  }
]
```

### 2. Toggle Lab Service Mapping
**Endpoint:** `PUT /api/categories/:categoryId/lab-services/:labServiceId/toggle`
**Auth:** SUPER_ADMIN or ADMIN role required
**Parameters:**
- `categoryId` (path) - Category ID (CAT004)
- `labServiceId` (path) - Lab Service MongoDB ObjectId

**Request Body:**
```json
{
  "isEnabled": true
}
```

**Response:** Updated lab service with mapping status
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "serviceId": "SVC-1234567890-abc",
  "code": "CBC",
  "name": "Complete Blood Count (CBC)",
  "category": "PATHOLOGY",
  "isEnabledForCategory": true
}
```

---

## Database Changes

### New Collection
**Collection Name:** `category_lab_service_mapping`

**Schema:**
```javascript
{
  categoryId: String,              // e.g., "CAT004" (uppercase, indexed)
  labServiceId: ObjectId,          // Reference to lab_services collection (indexed)
  isEnabled: Boolean,              // Default: true
  createdBy: String,               // User who created the mapping (optional)
  updatedBy: String,               // User who last updated (optional)
  createdAt: Date,                 // Auto-generated timestamp
  updatedAt: Date                  // Auto-generated timestamp
}
```

**Indexes:**
- Compound unique: `{ categoryId: 1, labServiceId: 1 }` - Prevents duplicate mappings
- Query optimization: `{ categoryId: 1, isEnabled: 1 }` - Speeds up filtering queries

---

## Files Created

### Backend (API) - 5 Files
1. `api/src/modules/masters/schemas/category-lab-service-mapping.schema.ts`
2. `api/src/modules/masters/dto/category-lab-service-mapping.dto.ts`
3. `api/src/modules/masters/category-lab-service-mapping.service.ts`
4. `api/src/modules/masters/category-lab-service-mapping.controller.ts`
5. Updated: `api/src/modules/masters/masters.module.ts`

### Frontend (Admin Portal) - 2 Files
6. `web-admin/app/(admin)/services/components/LabServiceMappingTab.tsx`
7. Updated: `web-admin/lib/constants/categories.ts`
8. Updated: `web-admin/app/(admin)/services/page.tsx`

### Documentation - 1 File
9. Updated: `docs/ADMIN_PORTAL.md`

---

## UI Changes

### Admin Portal - Services Page (`/admin/services`)

**New Component:** LabServiceMappingTab for CAT004

**Features:**
- Displays all active lab services with toggle switches
- Category filter pills: ALL, PATHOLOGY, RADIOLOGY, CARDIOLOGY, ENDOSCOPY, OTHER
- Shows service details: name, code, category badge, description, sample type
- Optimistic UI updates with error handling
- Service counter: "X of Y services enabled"
- Real-time toggle ON/OFF functionality
- Auto-refresh on error

**User Flow:**
1. Navigate to `/admin/services`
2. Click "Laboratory" tab (CAT004)
3. See all lab services from Lab Services catalog
4. Use category filters to narrow down services
5. Toggle services ON/OFF to enable/disable for CAT004
6. Changes save automatically with toast notifications

---

## Technical Implementation

### Architecture Pattern
Follows the existing specialty mapping pattern (`category-specialty-mapping`) with lab-specific adaptations:
- Separate schema for lab service mappings
- Dedicated controller and service layer
- Reusable UI component pattern
- Consistent with existing codebase architecture

### Key Design Decisions
1. **Lab-Specific Mapping:** Created separate mapping instead of reusing specialty mapping for type safety and separation of concerns
2. **ObjectId References:** Lab services use MongoDB ObjectId (not custom IDs like specialties)
3. **Lazy Mapping Creation:** Mappings are only created when explicitly toggled (not pre-populated)
4. **Auto-Detection:** New lab services automatically appear in UI without migration
5. **Category Support:** Currently supports CAT004 only, but designed for extensibility

### Data Flow
1. **Load:** Fetch ALL active lab services + existing mappings → merge with `isEnabledForCategory` flag
2. **Toggle:** Create/update mapping record → optimistic UI update → revert on error
3. **New Service:** When created in Lab Services → automatically appears in CAT004 tab (disabled by default)

---

## Testing Checklist

- [x] CAT004 tab displays all lab services
- [x] Toggle services ON/OFF successfully
- [x] Changes persist after page refresh
- [x] Category filters work correctly
- [x] Service counter updates accurately
- [x] Toast notifications appear on success/error
- [x] Optimistic UI updates with error revert
- [x] New lab services appear automatically
- [x] API endpoints return correct data
- [x] Authorization checks (ADMIN/SUPER_ADMIN only)

---

## Deployment Status

**Environment:** Development
**Date Deployed:** December 5, 2025
**Containers Restarted:** ✅ Yes
**Status:** ✅ Live and operational

**Deployed Services:**
- API (opd-api-dev) - Port 4000
- Admin Portal (opd-web-admin-dev) - Port 3001
- Nginx (opd-nginx-dev) - Port 80

**Access URL:** http://localhost/admin/services → Laboratory tab

---

## API Documentation Updated

Updated `docs/ADMIN_PORTAL.md` with:
- New lab service mapping API endpoints
- Updated Services page description
- Complete request/response examples

---

## Future Enhancements

Potential improvements for future iterations:
1. **Bulk Operations:** Enable/disable multiple lab services at once
2. **Search & Filter:** Search lab services by name or code
3. **Pricing Configuration:** Category-level pricing overrides
4. **Service Bundles:** Group commonly combined tests
5. **Analytics:** Track which services are most frequently enabled
6. **Export/Import:** Configuration export for backup/migration
7. **Additional Categories:** Extend mapping support to other categories beyond CAT004

---

## Migration Notes

**No Data Migration Required:**
- New collection starts empty
- All lab services default to disabled for CAT004
- Administrators manually enable desired services

**Optional Seeding:**
- Could create seed script to enable all lab services by default
- Current approach: Start disabled, manual configuration

---

## Related Documentation

- [Admin Portal Documentation](docs/ADMIN_PORTAL.md) - Complete API endpoint reference
- [Project Overview](docs/PROJECT_OVERVIEW.md) - High-level system architecture
- [Lab Testing Guide](LAB_TESTING_GUIDE.md) - Lab services functionality overview

---

## Support & Troubleshooting

### Common Issues

**Issue:** Lab services not appearing in CAT004 tab
**Solution:** Ensure lab services are marked as `isActive: true` in Lab Services section

**Issue:** Toggle not saving
**Solution:** Check user has ADMIN or SUPER_ADMIN role; verify API endpoint is accessible

**Issue:** Category filter not working
**Solution:** Verify lab services have correct category field (PATHOLOGY, RADIOLOGY, etc.)

### Logs Location
- API logs: `docker-compose logs api`
- Admin Portal logs: `docker-compose logs web-admin`

---

**Document Version:** 1.0
**Last Updated:** December 5, 2025
**Author:** Claude Code Assistant
