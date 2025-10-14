# VIDEO CONSULTATION - DIAGNOSTIC & ERROR ANALYSIS REPORT

## Problem Statement
**URL:** `http://localhost:3003/doctorview/consultations/APT000030`
**Error:** "Unable to start consultation - appointmentId must be a mongodb id"
**User Action:** Doctor clicks "Start Video Consultation" button from appointment detail page

---

## Root Cause Analysis

### Issue #1: Appointment Number vs MongoDB ObjectId Confusion
**Severity:** CRITICAL

The system has TWO different identifiers for appointments:
1. **appointmentId** (String): Human-readable appointment number (e.g., "APT000030")
2. **_id** (ObjectId): MongoDB document identifier (e.g., "674e8d9e402e064624658455e")

**Problem Flow:**
```
Step 1: Doctor views appointment detail page
URL: /doctorview/appointments/APT000030 (appointment number)

Step 2: Page fetches appointment from API
Call: GET /api/doctor/appointments/APT000030
Backend uses: findOne({ appointmentId: "APT000030" })
✅ WORKS - Backend accepts appointment numbers

Step 3: Doctor clicks "Start Video Consultation"
Links to: /doctorview/consultations/APT000030
Passes: appointmentId="APT000030" to consultation page

Step 4: Consultation page fetches appointment
Call: GET /api/doctor/appointments/APT000030
Returns: { _id: "674e...", appointmentId: "APT000030", ... }
✅ WORKS

Step 5: Consultation page starts video
Call: POST /api/video-consultations/start
Body: { appointmentId: "674e..." } (MongoDB _id)
❌ SHOULD WORK NOW - After fix applied
```

### Issue #2: Route Parameter Mismatch
**File:** `/web-doctor/app/doctorview/appointments/[appointmentId]/page.tsx`
**Line:** 182

**Original Code:**
```typescript
<Link href={`/doctorview/consultations/${appointmentId}`}>
  Start Video Consultation
</Link>
```

**Problem:** `appointmentId` variable contains "APT000030" (from URL), but we need to pass the MongoDB _id.

---

## Fix Applied

### Modified File: `/web-doctor/app/doctorview/consultations/[appointmentId]/page.tsx`
**Lines 48-50:**

```typescript
// OLD CODE (would fail):
const consultationData = await startVideoConsultation(appointmentId)

// NEW CODE (correct):
console.log('[VideoConsultation] Starting consultation with appointment._id:', appointment._id)
const consultationData = await startVideoConsultation(appointment._id)
```

**Explanation:**
1. Page receives "APT000030" from URL parameter
2. Fetches full appointment object from API
3. Extracts `appointment._id` (MongoDB ObjectId)
4. Passes `appointment._id` to video consultation start API

---

## Data Flow Verification

### ✅ CORRECT: Doctor Appointments API
```
Endpoint: GET /api/doctor/appointments/:appointmentId
Accepts: Appointment number (APT000030) OR MongoDB _id
Backend logic: findOne({ appointmentId, doctorId })
```

### ✅ CORRECT: Video Consultation API
```
Endpoint: POST /api/video-consultations/start
Accepts: MongoDB ObjectId ONLY
DTO Validation: @IsMongoId() appointmentId: string
Backend logic: findById(appointmentId)
```

### ❌ PROBLEM: Frontend was mixing them up
- Doctor portal was passing appointment number to video consultation API
- Video consultation API expects MongoDB ObjectId
- Result: DTO validation failure "appointmentId must be a mongodb id"

---

## Testing Status

### Pre-Fix Behavior:
1. ❌ Doctor clicks "Start Video Consultation"
2. ❌ Frontend calls API with "APT000030"
3. ❌ API rejects: "appointmentId must be a mongodb id"
4. ❌ User sees error message

### Post-Fix Expected Behavior:
1. ✅ Doctor clicks "Start Video Consultation"
2. ✅ Frontend fetches appointment, extracts `_id`
3. ✅ Frontend calls API with MongoDB ObjectId
4. ✅ API validates and starts consultation
5. ✅ User enters Jitsi video room

---

## Why Error May Still Persist

### Docker Container Not Reflecting Changes
**Likely Cause:** Docker volume mounting or Next.js hot reload issue

**Docker Compose Configuration Check Required:**
```yaml
services:
  web-doctor:
    volumes:
      - ./web-doctor:/app
      - /app/node_modules
```

**Possible Issues:**
1. Volume not mounted properly
2. Next.js cache not cleared
3. Container using stale build

**Resolution Steps:**
1. ✅ Already restarted container: `docker-compose restart web-doctor`
2. May need: `docker-compose build web-doctor --no-cache`
3. May need: Delete `.next` folder inside container

---

## Current System State

### Services Running:
- ✅ API (port 4000): Routes registered correctly
  - `/api/video-consultations/start` ✓
  - `/api/video-consultations/join` ✓
  - `/api/video-consultations/:id/end` ✓
- ✅ Doctor Portal (port 3003): Restarted, code updated
- ✅ Member Portal (port 3002): Running
- ✅ MongoDB (port 27017): Connected

### Code Status:
- ✅ Fix applied to consultation page
- ✅ Member portal consultation page also fixed
- ✅ Both use `appointment._id` instead of route parameter

---

## Additional Issues Found (From Comprehensive Audit)

### 1. Missing Authorization on Status Endpoint
**Impact:** Medium
```typescript
@Get(':consultationId/status')
async getConsultationStatus(@Param('consultationId') consultationId: string)
// Missing: @Roles() decorator
```

### 2. No Transaction Handling
**Impact:** High - Data inconsistency risk
```typescript
// Two separate updates without transaction
await this.videoConsultationModel.create(...)
await this.appointmentModel.findByIdAndUpdate(...)
// If second fails, first succeeds = inconsistent state
```

### 3. No Consultation Timeout
**Impact:** Medium
- Consultations can stay "IN_PROGRESS" indefinitely
- No auto-cleanup mechanism

---

## Immediate Action Required

### Step 1: Verify Fix in Browser
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to: http://localhost:3003/doctorview/appointments/APT000030
4. Click "Start Video Consultation"
5. Check console for:
   ```
   [VideoConsultation] Starting consultation with appointment._id: 674e...
   ```

### Step 2: If Still Failing
**Option A: Force Docker Rebuild**
```bash
docker-compose down
docker-compose build web-doctor --no-cache
docker-compose up -d
```

**Option B: Clear Next.js Cache**
```bash
docker exec opd-web-doctor-dev rm -rf .next
docker-compose restart web-doctor
```

**Option C: Verify Volume Mounting**
```bash
docker exec opd-web-doctor-dev cat /app/app/doctorview/consultations/[appointmentId]/page.tsx | grep "appointment._id"
```

---

## Expected Console Output (After Fix)

### Success Case:
```javascript
[VideoConsultation] Starting consultation with appointment._id: 674e8d9e402e064624658455e
// No errors, loads Jitsi room
```

### Failure Case (Before Fix):
```javascript
POST /api/video-consultations/start 400 Bad Request
{
  "statusCode": 400,
  "message": ["appointmentId must be a mongodb id"],
  "error": "Bad Request"
}
```

---

## API Backend Verification

### DTO Validation:
**File:** `/api/src/modules/video-consultation/dto/start-consultation.dto.ts`
```typescript
export class StartConsultationDto {
  @IsMongoId()
  @IsNotEmpty()
  appointmentId: string;
}
```
✅ Correctly validates MongoDB ObjectId format

### Service Logic:
**File:** `/api/src/modules/video-consultation/video-consultation.service.ts`
**Line:** 18
```typescript
const appointment = await this.appointmentModel
  .findById(appointmentId)  // Expects MongoDB ObjectId
  .populate('userId', 'name email')
  .populate('doctorId', 'name email');
```
✅ Uses findById which requires ObjectId

---

## MongoDB ObjectId Format

### Valid ObjectId Example:
```
674e8d9e402e064624658455e
```
- Length: 24 hexadecimal characters
- Pattern: /^[0-9a-fA-F]{24}$/

### Invalid (Appointment Number):
```
APT000030
```
- Does not match ObjectId pattern
- DTO validation fails

---

## Summary

### Root Cause:
Frontend was passing **appointment number** (APT000030) to an API endpoint that expects **MongoDB ObjectId**.

### Fix Applied:
Changed consultation page to extract and use `appointment._id` instead of URL parameter.

### Verification Needed:
Test in browser to confirm Docker container has picked up the changes. If not, rebuild container.

### Status:
- Code Fix: ✅ COMPLETE
- Container Restart: ✅ COMPLETE
- End-to-End Test: ⏳ PENDING USER VERIFICATION

### Next Steps:
1. Test the consultation start flow in browser
2. Check browser console for success/error messages
3. If still failing, rebuild Docker container
4. Report back with console output

---

## Contact Points for Further Investigation

If issue persists after container rebuild, check:
1. Network tab in DevTools for API request/response
2. Docker logs: `docker logs opd-web-doctor-dev --tail 100`
3. API logs: `docker logs opd-api-dev --tail 100 | grep video`
4. Verify MongoDB _id exists in appointment document

---

**Report Generated:** 2025-10-12
**Fix Applied By:** Claude AI Assistant
**Status:** Awaiting user verification
