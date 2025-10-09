# Operations Portal Member Search - Implementation Plan

## Analysis Summary

**Current State:**
- Operations portal exists at `/operations` with navigation for Doctors, Clinics, Appointments, Lab Prescriptions, and Lab Orders
- Backend has user search API (`/api/users`) with search, pagination, and filtering
- Wallet service has methods for transactions and balance retrieval
- Wallet transactions support CREDIT/DEBIT types with proper tracking

**Key Requirements:**
1. New "Members" tab in operations portal navigation
2. Search any member by name, member ID, email, phone
3. Display user profile details and policy information
4. Show wallet transaction history
5. Wallet top-up functionality (operations user adds balance)
6. Top-up must be for primary member only (not dependents)
7. Top-up creates CREDIT transaction with description

---

## Implementation Plan

### Phase 1: Backend API Development

**1.1 Create Operations Module Controller**
- Endpoint: `GET /api/ops/members/search` - Search members with query params
- Endpoint: `GET /api/ops/members/:id` - Get member details with policy & wallet
- Endpoint: `POST /api/ops/members/:id/wallet/topup` - Top-up wallet balance

**1.2 Wallet Top-up Functionality**
- Create new method in `wallet.service.ts`: `topupWallet()`
  - Accept: userId, amount, categoryCode, processedBy (operations user), notes
  - Validate: user must be primary member (relationship === SELF/REL001)
  - Update wallet balances (total + category)
  - Create CREDIT transaction with type: 'ADJUSTMENT'
  - Set `processedBy` to operations user ID
  - Set notes with description (e.g., "Manual top-up by Operations")

**1.3 DTO Creation**
- `TopupWalletDto`: amount, categoryCode, notes

**1.4 Authorization**
- Ensure operations routes use `@Roles(UserRole.OPERATIONS_USER, UserRole.SUPER_ADMIN)`
- JWT guard + Roles guard

---

### Phase 2: Frontend Development

**2.1 Navigation Update**
- File: `/web-admin/app/operations/layout.tsx`
- Add "Members" navigation item (after Appointments)

**2.2 Create Member Search Page**
- File: `/web-admin/app/operations/members/page.tsx`
- Features:
  - Search bar (name, member ID, email, phone)
  - Results table with columns: Member ID, Name, Email, Phone, Relationship, Status
  - Click row to view details
  - Pagination support

**2.3 Create Member Detail Page**
- File: `/web-admin/app/operations/members/[id]/page.tsx`
- Sections:
  1. User Details Card
  2. Policy & Wallet Summary Card
  3. Wallet Transactions Table
  4. Top-up Wallet Section (only for primary members)

**2.4 Create Top-up Wallet Modal**
- File: `/web-admin/components/operations/TopupWalletModal.tsx`
- Form fields: Category, Amount, Notes
- Validation: Primary member check, amount > 0

---

### Phase 3: API Routes Integration

**3.1 Create API Routes**
- `/web-admin/app/api/ops/members/search/route.ts`
- `/web-admin/app/api/ops/members/[id]/route.ts`
- `/web-admin/app/api/ops/members/[id]/wallet/topup/route.ts`

---

## File Structure

```
api/src/modules/
├── operations/                     # Create new module
│   ├── operations.controller.ts    # Search, get member, topup
│   ├── operations.service.ts       # Business logic
│   ├── operations.module.ts        # Module definition
│   └── dto/
│       └── topup-wallet.dto.ts     # Validation DTO

web-admin/app/
├── operations/
│   ├── layout.tsx                  # UPDATE: Add Members nav
│   └── members/
│       ├── page.tsx                # NEW: Search page
│       └── [id]/
│           └── page.tsx            # NEW: Detail page

web-admin/components/operations/
└── TopupWalletModal.tsx            # NEW: Modal component

web-admin/app/api/ops/members/
├── search/route.ts                 # NEW: Search API
├── [id]/route.ts                   # NEW: Get member API
└── [id]/wallet/topup/route.ts      # NEW: Topup API
```

---

## Key Technical Decisions

1. **Primary Member Validation**: Check `relationship === 'REL001' || relationship === 'SELF'` before allowing top-up
2. **Transaction Type**: Use `'ADJUSTMENT'` for manual top-ups by operations
3. **Category Selection**: Only show categories that exist in user's wallet
4. **Audit Trail**: Store `processedBy` (operations user ID) in transaction
5. **Notes Format**: "Manual wallet top-up by [Operations User Name] - [User-entered notes]"

---

## Testing Checklist

- [ ] Search returns correct members with filters
- [ ] Member detail page shows complete information
- [ ] Top-up button disabled for dependents
- [ ] Top-up validation works (amount > 0, category required)
- [ ] Top-up creates correct CREDIT transaction
- [ ] Wallet balance updates correctly (total + category)
- [ ] Transaction appears in user's transaction history
- [ ] Only operations users can access these endpoints
- [ ] Pagination works on search and transactions

---

## Execution Progress

### ✅ Completed
- [x] Plan created and documented
- [x] Phase 1: Backend API Development
  - [x] Created Operations module (controller, service, DTO)
  - [x] Added topupWallet method to wallet.service.ts
  - [x] Registered module in AppModule
  - [x] Fixed TypeScript compilation errors (role enum, relationship types)
  - [x] API compiles successfully with 0 errors
- [x] Phase 2: Frontend Development
  - [x] Updated operations layout navigation with Members tab
  - [x] Created member search page with search, pagination, filters
  - [x] Created member detail page with full user info, wallet, transactions
  - [x] Created TopupWalletModal component with category selection and validation
- [x] Phase 3: API Routes Integration
  - [x] Created /api/ops/members/search route
  - [x] Created /api/ops/members/[id] route
  - [x] Created /api/ops/members/[id]/wallet/topup route

### ⏳ Pending
- [ ] Testing
  - [ ] Start MongoDB
  - [ ] Start API server
  - [ ] Test member search functionality
  - [ ] Test member detail page with wallet display
  - [ ] Test wallet top-up for primary members
  - [ ] Verify dependent members cannot be topped up
  - [ ] Verify transaction creation in database

## Implementation Complete ✅

All code has been written and compiles successfully. The feature is ready for testing once MongoDB is started.
