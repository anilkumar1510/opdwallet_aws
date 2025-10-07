# END-TO-END TESTING CHECKLIST
**TPA & Finance Portal + Member Integration**

## Testing Date: October 3, 2025
## Testing Scope: Complete workflow testing from Member → TPA → Finance

---

## ✅ TESTING METHODOLOGY

### 1. Frontend Access Points Verification
- Verify every backend endpoint has a frontend entry point
- Verify all UI components are accessible from navigation
- Verify proper authentication and authorization

### 2. Functional Testing
- Test complete workflows end-to-end
- Test all CRUD operations
- Test file uploads and downloads
- Test form validations

### 3. Integration Testing
- Test API endpoint responses
- Test database operations
- Test error handling
- Test success flows

---

## 📋 PART 1: FRONTEND ACCESS POINTS AUDIT

### Member Portal (`/web-member`)

#### Navigation & Layout
- [ ] Main navigation includes Claims link
- [ ] Notification Bell visible in header
- [ ] User profile accessible
- [ ] Logout functionality works

#### Claims Pages
- [ ] `/member/claims` - Claims list page accessible
- [ ] `/member/claims/new` - New claim submission form accessible
- [ ] `/member/claims/[id]` - Claim detail page accessible
- [ ] Pagination works on claims list
- [ ] Search/filter functionality works

#### New Components (Phase 5)
- [ ] Notification Bell component displays in header
- [ ] Notification Bell shows unread count
- [ ] Clicking bell shows dropdown with notifications
- [ ] Status Timeline displays on claim detail page
- [ ] Document Resubmission button visible when status = DOCUMENTS_REQUIRED
- [ ] TPA Notes panel displays on claim detail page

---

### TPA Portal (`/web-admin/app/admin/tpa`)

#### Navigation
- [ ] `/admin/tpa` - TPA Dashboard accessible
- [ ] `/admin/tpa/claims` - All Claims list accessible
- [ ] `/admin/tpa/claims/unassigned` - Unassigned claims accessible (TPA_ADMIN only)
- [ ] `/admin/tpa/claims/assigned` - My assigned claims accessible (TPA_USER)
- [ ] `/admin/tpa/claims/[claimId]` - Claim detail page accessible

#### Dashboard Components
- [ ] Summary cards show correct statistics
- [ ] Recent activity feed displays
- [ ] Quick action buttons work
- [ ] Refresh button updates data

#### Claims Management
- [ ] Claims table displays all columns correctly
- [ ] Search functionality works
- [ ] Filter by status works
- [ ] Filter by assigned user works (TPA_ADMIN)
- [ ] Date range filter works
- [ ] Pagination works
- [ ] Sorting works

#### Action Modals
- [ ] Assignment modal opens for unassigned claims
- [ ] Reassignment modal opens (TPA_ADMIN only)
- [ ] Approval modal opens with form
- [ ] Rejection modal opens with reasons
- [ ] Request Documents modal opens
- [ ] All modals have proper validation
- [ ] All modals show success/error messages

---

### Finance Portal (`/web-admin/app/admin/finance`)

#### Navigation
- [ ] `/admin/finance` - Finance Dashboard accessible
- [ ] `/admin/finance/payments/pending` - Pending payments accessible
- [ ] `/admin/finance/payments/history` - Payment history accessible

#### Dashboard
- [ ] Payment summary cards show correct data
- [ ] Financial metrics display
- [ ] Payment mode distribution chart shows
- [ ] Quick action links work

#### Pending Payments
- [ ] Pending payments table displays
- [ ] Search by claim ID works
- [ ] Search by member name works
- [ ] Days pending indicator shows correct colors
- [ ] "Process Payment" button opens modal
- [ ] Payment modal displays claim details
- [ ] Payment modal shows member bank details
- [ ] Payment form has all required fields
- [ ] Payment form validation works
- [ ] Payment submission works

#### Payment History
- [ ] Payment history table displays
- [ ] Search functionality works
- [ ] Filter by payment mode works
- [ ] Filter by date range works
- [ ] Active filters display correctly
- [ ] "View Details" button opens modal
- [ ] Payment details modal shows complete information

---

## 📋 PART 2: BACKEND ENDPOINTS TESTING

### Member Claims Endpoints

#### Claim Submission
```bash
POST /api/member/claims
- [ ] Accepts claim data with file upload
- [ ] Validates required fields
- [ ] Generates unique claimId
- [ ] Sets initial status to SUBMITTED
- [ ] Returns created claim
- [ ] Error handling works (missing fields, invalid data)
```

#### Get Member Claims
```bash
GET /api/member/claims
- [ ] Returns user's claims only
- [ ] Supports pagination (page, limit)
- [ ] Supports status filter
- [ ] Returns correct count
- [ ] Authorization: Member can only see own claims
```

#### Get Claim Detail
```bash
GET /api/member/claims/:id
- [ ] Returns complete claim details
- [ ] Includes documents
- [ ] Includes status history
- [ ] Authorization: Member can only see own claim
- [ ] 404 for non-existent claim
```

#### Status Timeline (NEW - Phase 5)
```bash
GET /api/member/claims/:claimId/timeline
- [ ] Returns timeline array
- [ ] Shows all status changes
- [ ] Includes changedBy, changedAt, reason
- [ ] Filters internal notes from members
- [ ] Returns current status
- [ ] Authorization works
```

#### Document Resubmission (NEW - Phase 5)
```bash
POST /api/member/claims/:claimId/resubmit-documents
- [ ] Accepts file upload (multiple files)
- [ ] Only works when status = DOCUMENTS_REQUIRED
- [ ] Adds documents to claim
- [ ] Changes status to SUBMITTED
- [ ] Clears assignment
- [ ] Adds status history entry
- [ ] Returns success message
- [ ] Error: Claim not in DOCUMENTS_REQUIRED status
- [ ] Error: No documents provided
```

#### TPA Notes (NEW - Phase 5)
```bash
GET /api/member/claims/:claimId/tpa-notes
- [ ] Returns filtered notes
- [ ] Shows approval/rejection reasons
- [ ] Shows document requests
- [ ] Hides internal TPA notes
- [ ] Authorization: Member can only see own claim notes
```

---

### TPA Endpoints

#### Get Claims
```bash
GET /api/tpa/claims
- [ ] TPA_ADMIN: Returns all claims
- [ ] TPA_USER: Returns only assigned claims
- [ ] Supports status filter
- [ ] Supports assignedTo filter
- [ ] Supports date range filter
- [ ] Supports pagination
- [ ] Returns correct statistics
```

#### Get Unassigned Claims
```bash
GET /api/tpa/claims/unassigned
- [ ] Returns claims with no assignedTo
- [ ] TPA_ADMIN only
- [ ] Supports pagination
- [ ] Returns total count
- [ ] 403 for non-admin users
```

#### Get Claim Detail
```bash
GET /api/tpa/claims/:claimId
- [ ] Returns complete claim with member info
- [ ] Returns documents
- [ ] Returns status history
- [ ] TPA_ADMIN: Can view any claim
- [ ] TPA_USER: Can only view assigned claims
- [ ] 403 for non-assigned TPA_USER
```

#### Assign Claim
```bash
POST /api/tpa/claims/:claimId/assign
- [ ] Assigns claim to TPA user
- [ ] Updates status to ASSIGNED
- [ ] Adds assignment timestamp
- [ ] Adds to status history
- [ ] TPA_ADMIN only
- [ ] Error: Claim already assigned
- [ ] Error: Invalid assignee
```

#### Reassign Claim
```bash
POST /api/tpa/claims/:claimId/reassign
- [ ] Reassigns claim to different TPA user
- [ ] Updates assignedTo
- [ ] Adds to status history
- [ ] TPA_ADMIN only
- [ ] Requires reason
```

#### Approve Claim
```bash
POST /api/tpa/claims/:claimId/approve
- [ ] Full approval: amountApproved = billAmount
- [ ] Partial approval: amountApproved < billAmount
- [ ] Updates status to APPROVED or PARTIALLY_APPROVED
- [ ] Sets approvedBy, approvedAt
- [ ] Adds to status history
- [ ] Requires approval reason
- [ ] TPA_USER: Only if assigned to them
- [ ] Error: Not assigned to user
- [ ] Error: Invalid amount
```

#### Reject Claim
```bash
POST /api/tpa/claims/:claimId/reject
- [ ] Updates status to REJECTED
- [ ] Sets rejectedBy, rejectedAt, rejectionReason
- [ ] Adds to status history
- [ ] Requires rejection reason
- [ ] TPA_USER: Only if assigned
```

#### Request Documents
```bash
POST /api/tpa/claims/:claimId/request-documents
- [ ] Updates status to DOCUMENTS_REQUIRED
- [ ] Stores documentsRequested array
- [ ] Adds to status history
- [ ] TPA_USER: Only if assigned
- [ ] Requires at least one document type
```

#### Get TPA Users (NEW - Phase 2)
```bash
GET /api/tpa/users
- [ ] Returns list of TPA users
- [ ] Includes workload metrics
- [ ] TPA_ADMIN only
- [ ] Shows currentWorkload count
- [ ] Shows approval rate
```

#### Analytics Summary
```bash
GET /api/tpa/analytics/summary
- [ ] Returns claim statistics
- [ ] Counts by status
- [ ] Total amounts
- [ ] Average processing time
- [ ] Approval/rejection rates
- [ ] TPA_ADMIN only
```

---

### Finance Endpoints

#### Get Pending Payments
```bash
GET /api/finance/claims/pending
- [ ] Returns APPROVED claims not paid
- [ ] Supports pagination
- [ ] Supports sorting
- [ ] Returns total count
- [ ] Returns totalPendingAmount
- [ ] FINANCE_USER only
```

#### Get Claim for Payment
```bash
GET /api/finance/claims/:claimId
- [ ] Returns claim details
- [ ] Returns member bank details
- [ ] Returns approval details
- [ ] Only for APPROVED claims
- [ ] Error: Claim not approved
```

#### Complete Payment
```bash
POST /api/finance/claims/:claimId/complete-payment
- [ ] Accepts payment details (mode, reference, date, amount)
- [ ] Validates amount matches amountApproved
- [ ] Updates status to PAYMENT_COMPLETED
- [ ] Sets payment fields
- [ ] Adds to status history
- [ ] Returns success message
- [ ] Error: Amount mismatch
- [ ] Error: Claim not approved
```

#### Payment History
```bash
GET /api/finance/payments/history
- [ ] Returns PAYMENT_COMPLETED claims
- [ ] Supports pagination
- [ ] Supports date range filter
- [ ] Supports payment mode filter
- [ ] Returns payment details
```

#### Finance Analytics
```bash
GET /api/finance/analytics/summary
- [ ] Returns payment statistics
- [ ] Pending/processing/completed counts
- [ ] Total amounts
- [ ] Payment mode distribution
- [ ] FINANCE_USER only
```

---

### Notification Endpoints (NEW - Phase 5)

#### Get Notifications
```bash
GET /api/notifications
- [ ] Returns user's notifications
- [ ] Supports unreadOnly filter
- [ ] Supports type filter
- [ ] Supports pagination
- [ ] Returns unread count
- [ ] Sorted by createdAt desc
```

#### Get Unread Count
```bash
GET /api/notifications/unread-count
- [ ] Returns { unreadCount: number }
- [ ] Fast response for badge display
```

#### Mark as Read
```bash
PATCH /api/notifications/:id/read
- [ ] Marks notification as read
- [ ] Sets readAt timestamp
- [ ] User can only mark own notifications
- [ ] 404 for non-existent notification
```

#### Mark All as Read
```bash
PATCH /api/notifications/mark-all-read
- [ ] Marks all user's notifications as read
- [ ] Returns modifiedCount
- [ ] Only affects current user's notifications
```

#### Delete Notification
```bash
DELETE /api/notifications/:id
- [ ] Soft deletes (sets isActive: false)
- [ ] User can only delete own notifications
- [ ] Returns deleted notification
```

---

## 📋 PART 3: END-TO-END WORKFLOW TESTING

### Workflow 1: Claim Submission to Approval

**Steps:**
1. [ ] **Member**: Submit new claim with documents
   - Verify claim created with SUBMITTED status
   - Verify notification not sent (claim not yet assigned)

2. [ ] **TPA Admin**: View unassigned claims
   - Verify new claim appears in unassigned list
   - Verify claim details accessible

3. [ ] **TPA Admin**: Assign claim to TPA User
   - Verify claim status changes to ASSIGNED
   - Verify assignment timestamp set
   - Verify status history updated
   - Verify notification sent to member

4. [ ] **TPA User**: View assigned claims
   - Verify claim appears in "My Assigned Claims"
   - Verify claim detail page accessible

5. [ ] **TPA User**: Update status to UNDER_REVIEW
   - Verify status changes
   - Verify notification sent to member

6. [ ] **TPA User**: Approve claim (full approval)
   - Verify status changes to APPROVED
   - Verify approvedBy, approvedAt set
   - Verify amountApproved = billAmount
   - Verify status history updated
   - Verify notification sent to member

7. [ ] **Member**: Check notifications
   - Verify notification received for approval
   - Verify notification priority is HIGH
   - Verify clicking notification goes to claim detail

8. [ ] **Member**: View claim timeline
   - Verify all status changes visible
   - Verify timestamps correct
   - Verify changedBy names correct

---

### Workflow 2: Document Request and Resubmission

**Steps:**
1. [ ] **TPA User**: Request documents on assigned claim
   - Select document types
   - Add reasons for each document
   - Verify status changes to DOCUMENTS_REQUIRED
   - Verify documentsRequested array populated
   - Verify notification sent to member (HIGH priority)

2. [ ] **Member**: Receive documents required notification
   - Verify notification appears
   - Verify priority is HIGH
   - Verify message mentions documents required

3. [ ] **Member**: View claim detail
   - Verify status shows DOCUMENTS_REQUIRED
   - Verify "Resubmit Documents" button visible
   - Verify TPA Notes panel shows required documents
   - Verify each document type and reason displayed

4. [ ] **Member**: Resubmit documents
   - Click "Resubmit Documents" button
   - Upload new files
   - Select document types
   - Add optional notes
   - Verify submission successful
   - Verify status changes to SUBMITTED
   - Verify assignment cleared
   - Verify status history updated

5. [ ] **TPA Admin**: See resubmitted claim in unassigned
   - Verify claim appears in unassigned list
   - Verify status is SUBMITTED
   - Verify new documents visible
   - Reassign to TPA User

6. [ ] **TPA User**: Review resubmitted documents
   - Verify all new documents accessible
   - Verify can download documents
   - Approve or continue review

---

### Workflow 3: Claim Rejection

**Steps:**
1. [ ] **TPA User**: Reject assigned claim
   - Select rejection reason
   - Add detailed explanation
   - Verify status changes to REJECTED
   - Verify rejectedBy, rejectedAt set
   - Verify notification sent to member (URGENT priority)

2. [ ] **Member**: Receive rejection notification
   - Verify notification priority is URGENT
   - Verify notification title mentions rejection
   - Click notification to view claim

3. [ ] **Member**: View rejected claim
   - Verify status shows REJECTED
   - Verify TPA Notes panel shows rejection reason
   - Verify rejection explanation visible
   - Verify timeline shows rejection event

---

### Workflow 4: Payment Processing

**Steps:**
1. [ ] **Finance User**: View pending payments
   - Verify approved claims appear
   - Verify days pending calculated correctly
   - Verify urgency colors (red >7 days, orange >3 days)

2. [ ] **Finance User**: Click "Process Payment"
   - Verify payment modal opens
   - Verify claim details displayed
   - Verify member bank details visible (account number, IFSC, etc.)
   - Verify approved amount pre-filled

3. [ ] **Finance User**: Complete payment
   - Select payment mode (NEFT/RTGS/UPI/etc.)
   - Enter payment reference
   - Verify payment date defaults to today
   - Enter payment amount (must match approved amount)
   - Add optional notes
   - Submit payment
   - Verify validation: amount must match approved amount
   - Verify success message
   - Verify modal closes
   - Verify claim removed from pending list

4. [ ] **Finance User**: View payment history
   - Verify completed payment appears
   - Verify payment details correct
   - Verify payment mode badge shows
   - Click "View Details"
   - Verify all payment information displayed

5. [ ] **Member**: Receive payment completed notification
   - Verify notification received
   - Verify priority is HIGH
   - Verify notification shows amount and payment mode
   - Click notification

6. [ ] **Member**: View paid claim
   - Verify status shows PAYMENT_COMPLETED
   - Verify timeline shows payment event
   - Verify payment date visible

---

### Workflow 5: Partial Approval

**Steps:**
1. [ ] **TPA User**: Partially approve claim
   - Select "Partial Approval"
   - Enter approved amount (less than bill amount)
   - Enter approval reason explaining partial approval
   - Verify status changes to PARTIALLY_APPROVED
   - Verify amountApproved < billAmount
   - Verify notification sent to member

2. [ ] **Member**: Receive partial approval notification
   - Verify notification mentions partial approval
   - View claim to see approved vs claimed amount

3. [ ] **Finance User**: Process partial payment
   - Verify pending amount shows approved amount (not bill amount)
   - Complete payment for approved amount only
   - Verify validation allows approved amount

---

## 📋 PART 4: ERROR HANDLING & EDGE CASES

### Authentication & Authorization
- [ ] Non-authenticated user cannot access any API
- [ ] MEMBER cannot access TPA endpoints
- [ ] MEMBER cannot access Finance endpoints
- [ ] TPA_USER cannot access unassigned claims endpoint
- [ ] TPA_USER cannot assign/reassign claims
- [ ] TPA_USER cannot view claims assigned to others
- [ ] TPA_USER cannot act on claims not assigned to them
- [ ] FINANCE_USER cannot access TPA endpoints
- [ ] FINANCE_USER cannot modify claims

### Validation Errors
- [ ] Claim submission without required fields fails
- [ ] Claim submission without documents fails
- [ ] Approval without reason fails
- [ ] Approval with invalid amount fails
- [ ] Rejection without reason fails
- [ ] Document request without document types fails
- [ ] Payment with amount mismatch fails
- [ ] Payment on non-approved claim fails
- [ ] Document resubmission on non-DOCUMENTS_REQUIRED claim fails

### Not Found Errors
- [ ] Invalid claimId returns 404
- [ ] Invalid notificationId returns 404
- [ ] Non-existent user assignment fails

### Concurrent Operations
- [ ] Two TPA admins assigning same claim simultaneously
- [ ] TPA user acting on claim while admin reassigns it
- [ ] Member resubmitting documents while TPA reviews

---

## 📋 PART 5: PERFORMANCE & UX TESTING

### Loading States
- [ ] All tables show loading spinner while fetching
- [ ] All modals show loading during submission
- [ ] Notification bell shows loading when fetching
- [ ] Timeline shows loading state
- [ ] TPA notes show loading state

### Error Messages
- [ ] Network errors show user-friendly messages
- [ ] Validation errors highlight specific fields
- [ ] API errors display clear messages
- [ ] Success messages display and auto-dismiss

### Responsive Design
- [ ] TPA portal usable on tablet (landscape)
- [ ] Finance portal usable on tablet
- [ ] Member portal fully responsive on mobile
- [ ] Tables scroll horizontally on small screens
- [ ] Modals fit on mobile screens

### Real-time Updates
- [ ] Notification count updates every 30 seconds
- [ ] Claims list refreshes after actions
- [ ] Payment list updates after processing
- [ ] Dashboard stats refresh on page load

---

## 📊 TESTING RESULTS SUMMARY

**Total Test Cases:** ~150+

### Categories:
- Frontend Access Points: 40 tests
- Backend Endpoints: 60 tests
- End-to-End Workflows: 30 tests
- Error Handling: 20 tests
- Performance & UX: 15 tests

---

## ✅ TESTING PROTOCOL

### For Each Test:
1. **Execute** the test case
2. **Verify** expected result
3. **Document** any failures with:
   - Error message
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshot if applicable
4. **Mark** test as ✅ Pass or ❌ Fail

### Test Execution Order:
1. **Day 1**: Frontend Access Points (Part 1)
2. **Day 2**: Backend Endpoints (Part 2)
3. **Day 3**: End-to-End Workflows (Part 3)
4. **Day 4**: Error Handling & Edge Cases (Part 4)
5. **Day 5**: Performance & UX Testing (Part 5)
6. **Day 6**: Regression testing and bug fixes

---

## 📝 CRITICAL PATHS (Must Pass)

These flows MUST work for production:
1. ✅ Member can submit claim
2. ✅ TPA can assign and approve claim
3. ✅ Finance can process payment
4. ✅ Member receives notifications
5. ✅ Member can resubmit documents
6. ✅ Status timeline displays correctly
7. ✅ All authorization rules enforced

---

## 🐛 BUG REPORTING TEMPLATE

```
**Bug ID:** BUG-001
**Severity:** High/Medium/Low
**Test Case:** [Test case ID]
**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
**Actual Result:**
**Screenshot:**
**Console Errors:**
**API Response:**
**Status:** Open/In Progress/Fixed
```

---

**Testing Completed By:** _________________
**Date:** _________________
**Sign-off:** _________________
