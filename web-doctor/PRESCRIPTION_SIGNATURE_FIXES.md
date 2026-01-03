# Prescription Download & Signature Display Fixes

**Date**: January 3, 2026
**Status**: ✅ COMPLETED
**Scope**: Doctor Portal & Member Portal prescription functionality

---

## Executive Summary

Fixed critical prescription download and signature display issues across the doctor and member portals. All prescription downloads now work correctly, signatures display properly in profile preview and are embedded in generated PDFs.

---

## Issues Fixed

### 1. Doctor Profile - Signature Preview Not Displaying
**Problem**: Uploaded signature preview not loading after successful upload
**Root Cause**: Preview URL was relative (`/uploads/signatures/...`) without API server prefix
**Solution**: Prepend API URL to signature preview path

**Files Modified**:
- `components/SignatureUpload.tsx` (Line 164)

**Changes**:
```typescript
// BEFORE
<img src={signatureStatus.previewUrl} />

// AFTER
<img
  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${signatureStatus.previewUrl}`}
  onError={(e) => {
    console.error('Failed to load signature preview');
    e.currentTarget.style.display = 'none';
  }}
/>
```

**Impact**: Signature preview now loads correctly in doctor profile settings

---

### 2. Prescription Downloads - Doctor Portal
**Problem**: Download buttons returning 404 errors or incorrect URLs
**Root Cause**: URLs were using basePath-relative paths instead of direct API URLs

**Files Modified**:
1. `app/doctorview/prescriptions/page.tsx` (Lines 277, 290)
2. `app/doctorview/prescriptions/[prescriptionId]/page.tsx` (Lines 199, 449, 523)

**Changes**:
```typescript
// BEFORE - List Page
href={`/doctor/api/doctor/digital-prescriptions/${id}/download-pdf`}
href={`/api/doctor/prescriptions/${id}/download`}

// AFTER - List Page
href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/doctor/digital-prescriptions/${id}/download-pdf`}
href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/doctor/prescriptions/${id}/download`}

// ADDED: target="_blank" and rel="noopener noreferrer" for security
```

**Impact**: All prescription download buttons now work correctly

---

### 3. Prescription PDF Preview - Doctor Portal
**Problem**: PDF iframe not loading prescription for preview
**Root Cause**: iframe src using basePath-relative URL

**File Modified**:
- `app/doctorview/prescriptions/[prescriptionId]/page.tsx` (Line 523)

**Changes**:
```typescript
// BEFORE
<iframe src={`/doctor/api/doctor/prescriptions/${id}/download`} />

// AFTER
<iframe src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/doctor/prescriptions/${id}/download`} />
```

**Impact**: Prescription detail page now displays PDF preview correctly

---

## Backend Verification

### Signature Inclusion in PDFs ✅
**Status**: ALREADY WORKING - No changes needed

**Verified**: `api/src/modules/doctors/pdf-generation.service.ts` (Lines 413-426)

```typescript
// Doctor signature is embedded in PDF generation
if (doctorSignaturePath && existsSync(doctorSignaturePath)) {
  try {
    doc.image(doctorSignaturePath, 400, doc.y, {
      width: 100,
      height: 40,
      align: 'right'
    });
    doc.moveDown(3);
  } catch (error) {
    console.error('Error embedding signature image:', error);
  }
}
```

**Signature Dimensions in PDF**:
- Width: 100px
- Height: 40px
- Position: Right-aligned at (400, doc.y)

**Validation**: `api/src/modules/doctors/digital-prescription.service.ts` (Lines 40-52)
- Doctors MUST upload signature before generating prescriptions
- MCI compliance enforced

---

### Member Portal Endpoints ✅
**Status**: ALL ENDPOINTS EXIST - No backend changes needed

**Verified Endpoints**:

1. **Digital Prescriptions Download**
   - Path: `/api/member/digital-prescriptions/:prescriptionId/download-pdf`
   - Controller: `MemberDigitalPrescriptionsController` (Line 503)
   - Auto-generates PDF if not already generated
   - Includes signature in PDF

2. **Uploaded Prescriptions Download**
   - Path: `/api/member/prescriptions/:prescriptionId/download`
   - Controller: `MemberPrescriptionsController`
   - Serves stored PDF files

---

## Configuration Details

### Environment Variables

**Doctor Portal** (`web-doctor/.env.local` or environment):
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api  # For local dev
# Production: https://eliktron.com/api
```

**Member Portal** (`web-member/.env.local`):
```bash
NEXT_PUBLIC_API_URL=/api           # Uses Next.js rewrites
API_URL=http://localhost:4000      # Backend URL
```

### Next.js Configuration

**Doctor Portal** (`next.config.js`):
```javascript
{
  basePath: '/doctor',
  // API routes at /doctor/api/* map to backend
}
```

**Member Portal** (`next.config.js`):
```javascript
{
  async rewrites() {
    return [{
      source: '/api/:path*',
      destination: 'http://localhost:4000/api/:path*'
    }]
  }
}
```

---

## Testing Performed

### Doctor Portal ✅
- [x] Signature upload in profile
- [x] Signature preview display
- [x] Signature deletion
- [x] Digital prescription PDF download (list page)
- [x] Digital prescription PDF download (detail page)
- [x] Uploaded prescription PDF download (list page)
- [x] Uploaded prescription PDF download (detail page)
- [x] PDF preview iframe rendering
- [x] Frontend build successful (no errors)

### Backend ✅
- [x] Signature stored in uploads/signatures/
- [x] Signature embedded in generated PDFs
- [x] PDF generation for digital prescriptions
- [x] Doctor signature validation before prescription creation
- [x] Member prescription download endpoints accessible
- [x] Auto PDF generation for members

---

## Deployment Notes

### Local Development
1. Start API server: `cd api && npm run start:dev`
2. Start Doctor portal: `cd web-doctor && npm run dev` (Port 3000)
3. Start Member portal: `cd web-member && PORT=3001 npm run dev` (Port 3001)
4. Or use Docker: Doctor on 3003, Member on 3002

### Production
- All URLs automatically use production API endpoint
- Signature files persist in `api/uploads/signatures/`
- PDF files persist in `api/uploads/prescriptions/`
- nginx handles routing:
  - `/doctor/*` → Doctor portal
  - `/member/*` → Member portal
  - `/api/*` → Backend API

---

## Known Limitations

1. **Signature Dimensions**: Fixed at 100x40px in PDF - may need adjustment for different signature aspect ratios
2. **PDF File Storage**: PDFs stored on server filesystem - consider cloud storage (S3) for scalability
3. **Member Portal Local**: Requires separate dev server or Docker to test locally

---

## Related Files

### Frontend - Doctor Portal
- `components/SignatureUpload.tsx` - Signature upload/preview component
- `app/doctorview/profile/page.tsx` - Profile page
- `app/doctorview/prescriptions/page.tsx` - Prescriptions list
- `app/doctorview/prescriptions/[prescriptionId]/page.tsx` - Prescription detail
- `lib/api/auth.ts` - Auth API functions
- `lib/api/prescriptions.ts` - Prescription API functions
- `lib/api/digital-prescriptions.ts` - Digital prescription API functions

### Frontend - Member Portal
- `components/ViewPrescriptionButton.tsx` - Prescription view component
- `app/member/health-records/page.tsx` - Health records page
- `app/member/bookings/page.tsx` - Bookings page (if prescription viewing needed)

### Backend - API
- `src/modules/doctors/doctor-auth.service.ts` - Signature upload/management
- `src/modules/doctors/doctor-auth.controller.ts` - Signature endpoints
- `src/modules/doctors/pdf-generation.service.ts` - PDF generation with signature
- `src/modules/doctors/digital-prescription.service.ts` - Prescription business logic
- `src/modules/doctors/digital-prescription.controller.ts` - Doctor & Member endpoints
- `src/modules/doctors/prescriptions.controller.ts` - Uploaded prescription endpoints
- `src/modules/doctors/schemas/doctor.schema.ts` - Doctor model with signature fields

---

## Future Enhancements

1. **Signature Image Optimization**
   - Auto-resize/compress uploads
   - Support transparent backgrounds
   - Validate image dimensions

2. **PDF Improvements**
   - Watermark for digital prescriptions
   - QR code for verification
   - Better mobile responsiveness

3. **Member Portal**
   - Prescription history filtering
   - Download analytics
   - Print-friendly view

---

## Support

For issues or questions:
1. Check console logs in browser (F12)
2. Check API server logs for backend errors
3. Verify environment variables are set correctly
4. Ensure all services are running (API, Doctor portal, Member portal)

---

**Last Updated**: January 3, 2026
**Version**: 1.0
**Author**: Claude Sonnet 4.5 (Automated Documentation)
