# Portal Testing Guide - User Segregation Migration

## Overview

This guide provides comprehensive testing procedures for all portals after the user segregation migration. Follow these steps to ensure all functionality works correctly with the new dual-collection architecture.

## Prerequisites

Before starting tests:
- ✅ Migration script executed successfully
- ✅ Migration verification tests passed
- ✅ API endpoint tests passed
- ✅ All services running (API + 6 portals)

## Testing Credentials

### Member Portal
- **Email:** john.member@test.com
- **Password:** password
- **Expected User Type:** member

### Admin Portal
- **Email:** john.admin@test.com
- **Password:** password
- **Expected Role:** SUPER_ADMIN or ADMIN
- **Expected User Type:** internal

### TPA Portal
- **Email:** tpa.user@test.com
- **Password:** password
- **Expected Role:** TPA, TPA_ADMIN, or TPA_USER
- **Expected User Type:** internal

### Finance Portal
- **Email:** finance.user@test.com
- **Password:** password
- **Expected Role:** FINANCE_USER
- **Expected User Type:** internal

### Operations Portal
- **Email:** ops.user@test.com
- **Password:** password
- **Expected Role:** OPS
- **Expected User Type:** internal

### Doctor Portal
- **Email:** doctor@test.com
- **Password:** password
- **Expected Role:** DOCTOR
- **Expected User Type:** doctor (remains in users collection)

---

## Portal 1: Member Portal (http://localhost:3001)

### Test 1.1: Member Login
- [ ] Open http://localhost:3001
- [ ] Enter member credentials
- [ ] Click "Login"
- [ ] **Expected:** Successful login, redirected to dashboard
- [ ] **Browser Console:** Check for authentication logs, verify no errors
- [ ] **Network Tab:** Verify POST /auth/login returns userType: 'member'

### Test 1.2: Member Dashboard
- [ ] Verify dashboard loads completely
- [ ] Check all widgets/cards display correctly
- [ ] **Browser Console:** No errors
- [ ] **Expected:** All data loads from users collection seamlessly

### Test 1.3: Profile Page
- [ ] Navigate to Profile/Account page
- [ ] Verify member details display correctly (name, email, phone, UHID, Member ID)
- [ ] **Expected:** All fields populated correctly
- [ ] **Browser Console:** No errors

### Test 1.4: Appointments
- [ ] Navigate to Appointments page
- [ ] Verify past appointments display
- [ ] Try booking a new appointment
- [ ] **Expected:** Appointments work as before
- [ ] **Browser Console:** No errors

### Test 1.5: Claims
- [ ] Navigate to Claims page
- [ ] View existing claims
- [ ] Submit a new claim if possible
- [ ] **Expected:** Claims functionality unchanged
- [ ] **Browser Console:** No errors

### Test 1.6: Family Members (Dependents)
- [ ] Navigate to Family/Dependents page
- [ ] View dependent members
- [ ] **Expected:** Dependent relationships work correctly
- [ ] **Browser Console:** No errors

### Test 1.7: Policies
- [ ] Navigate to Policies page
- [ ] View assigned policies
- [ ] **Expected:** Policy assignments work correctly
- [ ] **Browser Console:** No errors

### Test 1.8: Logout
- [ ] Click Logout
- [ ] **Expected:** Redirected to login page, session cleared
- [ ] **Browser Console:** No errors

---

## Portal 2: Admin Portal (http://localhost:3002)

### Test 2.1: Admin Login
- [ ] Open http://localhost:3002
- [ ] Enter admin credentials
- [ ] Click "Login"
- [ ] **Expected:** Successful login, redirected to dashboard
- [ ] **Browser Console:** Check for authentication logs, verify userType: 'internal'
- [ ] **Network Tab:** Verify POST /auth/login returns correct role

### Test 2.2: Dashboard
- [ ] Verify admin dashboard loads
- [ ] Check statistics/KPIs display correctly
- [ ] **Browser Console:** No errors
- [ ] **Expected:** All aggregated data loads correctly

### Test 2.3: Users Page - External Users Tab

**CRITICAL TEST - API ENDPOINT CHANGE**

- [ ] Navigate to Users page
- [ ] Click "External Users" tab
- [ ] **Network Tab:** Verify API call goes to **GET /members** (not /users)
- [ ] **Expected:** List of members displayed
- [ ] Verify all users shown have role: MEMBER
- [ ] Test pagination
- [ ] Test search functionality
- [ ] **Browser Console:** No errors

**Expected API Call:**
```
GET /members?page=1&limit=10&search=...
```

### Test 2.4: Users Page - Internal Users Tab

**CRITICAL TEST - API ENDPOINT CHANGE**

- [ ] Click "Internal Users" tab
- [ ] **Network Tab:** Verify API call goes to **GET /internal-users** (not /users with filter)
- [ ] **Expected:** List of internal staff displayed
- [ ] Verify all users shown have internal roles (SUPER_ADMIN, ADMIN, TPA, etc.)
- [ ] Test pagination
- [ ] Test search functionality
- [ ] **Browser Console:** No errors

**Expected API Call:**
```
GET /internal-users?page=1&limit=10&search=...
```

### Test 2.5: Create External User (Member)

**CRITICAL TEST - API ENDPOINT CHANGE**

- [ ] Navigate to Users > New User (or click "Create User")
- [ ] Select "External User" or "Member" type
- [ ] Fill form:
  - UHID: UHID-TEST-001
  - Member ID: MEM-TEST-001
  - Name: Test Member
  - Email: test.member.{timestamp}@test.com
  - Phone: 9876543210
  - Relationship: SELF
  - Status: ACTIVE
- [ ] Click "Create"
- [ ] **Network Tab:** Verify API call goes to **POST /members** (not /users)
- [ ] **Expected:** Member created successfully
- [ ] **Browser Console:** No errors
- [ ] Verify new member appears in External Users tab

**Expected API Call:**
```
POST /members
Body: { uhid, memberId, name, email, phone, relationship, ... }
```

### Test 2.6: Create Internal User (Staff)

**CRITICAL TEST - API ENDPOINT CHANGE**

- [ ] Click "Create User" again
- [ ] Select "Internal User" type
- [ ] Fill form:
  - Employee ID: EMP-TEST-001
  - Name: Test Admin
  - Email: test.admin.{timestamp}@test.com
  - Phone: +91 9876543211
  - Role: ADMIN
  - Department: IT
  - Designation: System Admin
  - Status: ACTIVE
- [ ] Click "Create"
- [ ] **Network Tab:** Verify API call goes to **POST /internal-users** (not /users)
- [ ] **Expected:** Internal user created successfully
- [ ] **Browser Console:** No errors
- [ ] Verify new user appears in Internal Users tab

**Expected API Call:**
```
POST /internal-users
Body: { employeeId, name, email, phone: {countryCode, number}, role, department, ... }
```

### Test 2.7: Edit Member
- [ ] Go to External Users tab
- [ ] Click "Edit" on a member
- [ ] Update name or phone
- [ ] Click "Save"
- [ ] **Network Tab:** Verify **PUT /members/:id**
- [ ] **Expected:** Member updated successfully
- [ ] **Browser Console:** No errors

### Test 2.8: Edit Internal User
- [ ] Go to Internal Users tab
- [ ] Click "Edit" on an internal user
- [ ] Update department or designation
- [ ] Click "Save"
- [ ] **Network Tab:** Verify **PUT /internal-users/:id**
- [ ] **Expected:** Internal user updated successfully
- [ ] **Browser Console:** No errors

### Test 2.9: View Member Details
- [ ] Click "View" on a member
- [ ] **Network Tab:** Verify **GET /members/:id**
- [ ] **Expected:** Member details displayed correctly
- [ ] Verify UHID, Member ID, relationship, CUG details (if applicable)
- [ ] **Browser Console:** No errors

### Test 2.10: View Internal User Details
- [ ] Click "View" on an internal user
- [ ] **Network Tab:** Verify **GET /internal-users/:id**
- [ ] **Expected:** Internal user details displayed correctly
- [ ] Verify Employee ID, department, designation, reporting manager
- [ ] **Browser Console:** No errors

### Test 2.11: Policies Management
- [ ] Navigate to Policies page
- [ ] Create new policy
- [ ] Assign policy to a member
- [ ] **Expected:** Policy assignment works (references to users collection still valid)
- [ ] **Browser Console:** No errors

### Test 2.12: Claims Management
- [ ] Navigate to Claims page
- [ ] View claims
- [ ] Approve/reject a claim
- [ ] **Expected:** Claims workflow unchanged
- [ ] **Browser Console:** No errors

### Test 2.13: Appointments Management
- [ ] Navigate to Appointments page
- [ ] View appointments
- [ ] Create appointment for member
- [ ] **Expected:** Appointments work correctly
- [ ] **Browser Console:** No errors

---

## Portal 3: TPA Portal (http://localhost:3003)

### Test 3.1: TPA Login
- [ ] Open http://localhost:3003
- [ ] Enter TPA credentials
- [ ] **Expected:** Successful login
- [ ] **Browser Console:** Verify userType: 'internal'
- [ ] **Network Tab:** Verify correct role (TPA, TPA_ADMIN, TPA_USER)

### Test 3.2: Dashboard
- [ ] Verify TPA dashboard loads
- [ ] Check claims statistics
- [ ] **Browser Console:** No errors

### Test 3.3: Claims Processing
- [ ] Navigate to Claims page
- [ ] View pending claims
- [ ] Process a claim (approve/reject)
- [ ] **Expected:** Claims processing works correctly
- [ ] **Browser Console:** No errors

### Test 3.4: Member Lookup
- [ ] Use member search/lookup feature
- [ ] Search by Member ID or UHID
- [ ] **Expected:** Member details retrieved correctly (from users collection)
- [ ] **Browser Console:** No errors

### Test 3.5: Policy Verification
- [ ] Verify member policy details
- [ ] Check policy validity, coverage
- [ ] **Expected:** Policy data displays correctly
- [ ] **Browser Console:** No errors

---

## Portal 4: Finance Portal (http://localhost:3004)

### Test 4.1: Finance User Login
- [ ] Open http://localhost:3004
- [ ] Enter finance user credentials
- [ ] **Expected:** Successful login
- [ ] **Browser Console:** Verify userType: 'internal', role: 'FINANCE_USER'

### Test 4.2: Dashboard
- [ ] Verify finance dashboard loads
- [ ] Check financial statistics
- [ ] **Browser Console:** No errors

### Test 4.3: Transactions
- [ ] Navigate to Transactions page
- [ ] View member transactions
- [ ] Process payments
- [ ] **Expected:** Transaction processing works correctly
- [ ] **Browser Console:** No errors

### Test 4.4: Claims Reimbursement
- [ ] View approved claims for reimbursement
- [ ] Process reimbursement
- [ ] **Expected:** Reimbursement workflow unchanged
- [ ] **Browser Console:** No errors

### Test 4.5: Reports
- [ ] Generate financial reports
- [ ] Export reports (if applicable)
- [ ] **Expected:** Reports generate correctly
- [ ] **Browser Console:** No errors

---

## Portal 5: Operations Portal (http://localhost:3005)

### Test 5.1: OPS User Login
- [ ] Open http://localhost:3005
- [ ] Enter operations user credentials
- [ ] **Expected:** Successful login
- [ ] **Browser Console:** Verify userType: 'internal', role: 'OPS'

### Test 5.2: Dashboard
- [ ] Verify operations dashboard loads
- [ ] Check operational metrics
- [ ] **Browser Console:** No errors

### Test 5.3: Operations Functions
- [ ] Test any operations-specific features
- [ ] Verify data loads correctly
- [ ] **Expected:** All operations work as before
- [ ] **Browser Console:** No errors

---

## Portal 6: Doctor Portal (http://localhost:3006)

### Test 6.1: Doctor Login
- [ ] Open http://localhost:3006
- [ ] Enter doctor credentials
- [ ] **Expected:** Successful login
- [ ] **Browser Console:** Verify userType: 'doctor' (doctors remain in users collection)

### Test 6.2: Dashboard
- [ ] Verify doctor dashboard loads
- [ ] **Browser Console:** No errors

### Test 6.3: Appointments
- [ ] View scheduled appointments
- [ ] Update appointment status
- [ ] **Expected:** Appointments work correctly
- [ ] **Browser Console:** No errors

### Test 6.4: Patient Records
- [ ] View patient (member) records
- [ ] **Expected:** Patient data retrieved correctly from users collection
- [ ] **Browser Console:** No errors

---

## Critical Flow Tests

### Flow 1: Member Registration → Appointment → Claim

1. **Admin Portal:**
   - [ ] Create new member (External User)
   - [ ] Assign policy to member
   - [ ] Verify member created successfully

2. **Member Portal:**
   - [ ] Login as new member
   - [ ] View assigned policy
   - [ ] Book appointment
   - [ ] Submit claim

3. **TPA Portal:**
   - [ ] Login as TPA user
   - [ ] View submitted claim
   - [ ] Approve claim

4. **Finance Portal:**
   - [ ] Login as finance user
   - [ ] View approved claim
   - [ ] Process reimbursement

**Expected:** Entire flow works seamlessly with dual collections

### Flow 2: Internal User Management

1. **Admin Portal:**
   - [ ] Create new internal user (ADMIN role)
   - [ ] Verify user created in internal_users collection

2. **New Admin Login:**
   - [ ] Logout from current admin session
   - [ ] Login with new admin credentials
   - [ ] Verify access to admin portal
   - [ ] Verify userType: 'internal'

3. **Admin Portal (as new admin):**
   - [ ] View External Users tab
   - [ ] View Internal Users tab
   - [ ] Create a member
   - [ ] Create another internal user (TPA role)

**Expected:** New internal user has correct permissions

### Flow 3: Family/Dependent Relationships

1. **Admin Portal:**
   - [ ] Create primary member (relationship: SELF)
   - [ ] Note primary member's Member ID

2. **Admin Portal:**
   - [ ] Create dependent member (relationship: SPOUSE/CHILD)
   - [ ] Set Primary Member ID to above member's ID
   - [ ] Verify dependent created successfully

3. **Member Portal:**
   - [ ] Login as primary member
   - [ ] Navigate to Family/Dependents page
   - [ ] Verify dependent appears in list

**Expected:** Family relationships work correctly

---

## Browser Console Monitoring

For EVERY test, check browser console for:

### Expected Logs (Good)
- ✅ `[Auth] Login successful`
- ✅ `[API] GET /members - 200`
- ✅ `[API] POST /members - 201`
- ✅ `[API] GET /internal-users - 200`
- ✅ Token refresh logs

### Error Indicators (Bad)
- ❌ `401 Unauthorized` - Authentication failed
- ❌ `403 Forbidden` - Authorization failed (RBAC issue)
- ❌ `404 Not Found` - Endpoint not found
- ❌ `500 Internal Server Error` - Backend error
- ❌ `TypeError` - JavaScript error
- ❌ `Cannot read property of undefined` - Data structure issue
- ❌ CORS errors
- ❌ Network errors

---

## Network Tab Monitoring

For API calls, verify:

### Members Endpoints
- **GET /members** - List members
- **POST /members** - Create member
- **GET /members/:id** - Get member details
- **PUT /members/:id** - Update member
- **DELETE /members/:id** - Delete member
- **GET /members/:id/dependents** - Get dependents

### Internal Users Endpoints
- **GET /internal-users** - List internal users
- **POST /internal-users** - Create internal user
- **GET /internal-users/:id** - Get internal user details
- **PUT /internal-users/:id** - Update internal user
- **DELETE /internal-users/:id** - Delete internal user

### Old Endpoints (Should NOT be called)
- ~~GET /users~~ (deprecated - use /members or /internal-users)
- ~~POST /users~~ (deprecated)

---

## Test Results Template

Use this template to record results:

```
## Test Results - [Portal Name] - [Date]

### Tester: [Your Name]
### Environment: Local Development

| Test Case | Status | Notes | Console Errors |
|-----------|--------|-------|----------------|
| Login     | ✅ PASS | -     | None           |
| Dashboard | ✅ PASS | -     | None           |
| ...       | ❌ FAIL | Error message | TypeError at line X |

### Critical Issues Found:
1. [Describe issue]
2. [Describe issue]

### Non-Critical Issues:
1. [Describe issue]

### Overall Assessment:
- [ ] Ready for production
- [ ] Needs fixes before production
```

---

## Post-Testing Checklist

After completing all tests:

- [ ] All 6 portals tested
- [ ] All critical flows tested
- [ ] No console errors found
- [ ] All API endpoints calling correct URLs
- [ ] Authentication works for all user types
- [ ] Authorization (RBAC) working correctly
- [ ] Data integrity verified
- [ ] Performance acceptable
- [ ] Test results documented

---

## Rollback Criteria

If ANY of these occur, STOP and consider rollback:

1. ❌ Any portal completely non-functional
2. ❌ Authentication broken for any user type
3. ❌ Critical flow broken (cannot create users, policies, claims)
4. ❌ Data loss detected
5. ❌ Widespread console errors across portals
6. ❌ API endpoints returning 500 errors consistently
7. ❌ Performance significantly degraded

**Rollback Command:**
```bash
cd /Users/nitendraagarwal/opdwallet_aws/api
node dist/scripts/rollback-user-segregation.js
```

---

## Success Criteria

✅ All portals accessible and functional
✅ No authentication errors
✅ Correct API endpoints called (/members, /internal-users)
✅ All critical flows work end-to-end
✅ No console errors
✅ No data loss
✅ Performance acceptable

---

## Notes

- Take screenshots of any errors
- Record network requests for failed API calls
- Document any unexpected behavior
- Keep browser DevTools open during all tests
- Test with different user roles for RBAC validation

---

**Last Updated:** [Date]
**Version:** 1.0
