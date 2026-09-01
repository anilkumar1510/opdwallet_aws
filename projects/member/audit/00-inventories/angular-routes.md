# Angular route table (web-angular/projects/member)

**Source:** exhaustive read of `src/app/app.routes.ts` (351 lines), with every loop
expanded by hand. Cross-checked against `tools/parity-inventory.mjs`, which parses
the same file independently.

Two `flatMap` loops generate routes. Both are expanded below into the real URLs
they emit; neither appears as a literal path string in the source.

- `app.routes.ts:133` — `['appointments', 'online-consult']` × 4 legs = **8 routes**.
  `mode` is `IN_CLINIC` for `appointments`, `ONLINE` for `online-consult`.
- `app.routes.ts:182` — `['vision', 'dental']` × 4 legs = **8 routes**.
  `area` is `VISION` / `DENTAL`.

## Top level

| URL | Guard | Component |
|---|---|---|
| `/` | — | redirect → `/member` |
| `/login` | `anonymousGuard` | `LoginPage` |
| `/member` | `authGuard` | `MemberShell` (layout, children below) |
| `**` | — | redirect → `/member` |

## `/member` children — 60 addressable routes

| # | URL | Component | Notes |
|---|---|---|---|
| 1 | `/member` | `HomePage` | `pathMatch: 'full'` |
| 2 | `/member/wallet` | `WalletPage` | |
| 3 | `/member/claims` | `ClaimsPage` | |
| 4 | `/member/claims/new` | `NewClaimPage` | |
| 5 | `/member/claims/:claimId` | `ClaimDetailPage` | |
| 6 | `/member/bookings` | `BookingsPage` | |
| 7 | `/member/lab-tests` | `LabTestsPage` | `kind: 'LAB'` |
| 8 | `/member/lab-tests/upload` | `UploadPrescriptionPage` | |
| 9 | `/member/lab-tests/cart/:cartId` | `CartPage` | |
| 10 | `/member/lab-tests/cart/:cartId/vendor/:vendorId` | `VendorBookingPage` | `kind: 'LAB'` |
| 11 | `/member/lab-tests/orders` | `LabOrdersPage` | `kind: 'LAB'` |
| 12 | `/member/lab-tests/orders/:orderId` | `LabOrderDetailPage` | `kind: 'LAB'` |
| 13 | `/member/diagnostics/upload` | `UploadPrescriptionPage` | `kind: 'DIAGNOSTIC'` |
| 14 | `/member/diagnostics/cart/:cartId` | `CartPage` | `kind: 'DIAGNOSTIC'` |
| 15 | `/member/diagnostics/cart/:cartId/vendor/:vendorId` | `VendorBookingPage` | `kind: 'DIAGNOSTIC'` |
| 16 | `/member/diagnostics/orders` | `LabOrdersPage` | `kind: 'DIAGNOSTIC'` |
| 17 | `/member/diagnostics/orders/:orderId` | `LabOrderDetailPage` | `kind: 'DIAGNOSTIC'` |
| 18 | `/member/diagnostics` | `DiagnosticsPage` | own layout, not the lab hero |
| 19 | `/member/vision` | `BenefitServicesPage` | `area: 'VISION'` |
| 20 | `/member/dental` | `BenefitServicesPage` | `area: 'DENTAL'` |
| 21 | `/member/appointments` | `ConsultHubPage` | **loop 1**, `mode: IN_CLINIC`, `pathMatch: full` |
| 22 | `/member/appointments/specialties` | `SpecialtiesPage` | **loop 1** |
| 23 | `/member/appointments/doctors` | `DoctorsPage` | **loop 1** |
| 24 | `/member/appointments/confirm` | `AppointmentConfirmPage` | **loop 1** |
| 25 | `/member/online-consult` | `ConsultHubPage` | **loop 1**, `mode: ONLINE` |
| 26 | `/member/online-consult/specialties` | `SpecialtiesPage` | **loop 1** |
| 27 | `/member/online-consult/doctors` | `DoctorsPage` | **loop 1** |
| 28 | `/member/online-consult/confirm` | `AppointmentConfirmPage` | **loop 1** |
| 29 | `/member/appointments/select-patient` | `AppointmentPatientPage` | in-clinic only |
| 30 | `/member/appointments/select-slot` | `AppointmentSlotPage` | in-clinic only |
| 31 | `/member/vision/clinics` | `ClinicsPage` | **loop 2** |
| 32 | `/member/vision/select-patient` | `SelectPatientPage` | **loop 2** |
| 33 | `/member/vision/select-slot` | `SelectSlotPage` | **loop 2** |
| 34 | `/member/vision/confirm` | `ConfirmBookingPage` | **loop 2** |
| 35 | `/member/dental/clinics` | `ClinicsPage` | **loop 2** |
| 36 | `/member/dental/select-patient` | `SelectPatientPage` | **loop 2** |
| 37 | `/member/dental/select-slot` | `SelectSlotPage` | **loop 2** |
| 38 | `/member/dental/confirm` | `ConfirmBookingPage` | **loop 2** |
| 39 | `/member/vision/payment/:bookingId` | `VisionPaymentPage` | vision only |
| 40 | `/member/wellness` | `WellnessPage` | |
| 41 | `/member/ahc/booking` | `AhcBookingPage` | `leg: 'lab'` |
| 42 | `/member/ahc/booking/diagnostic` | `AhcBookingPage` | `leg: 'diagnostic'` |
| 43 | `/member/ahc/booking/payment` | `AhcPaymentPage` | |
| 44 | `/member/policy-details/:policyId` | `PolicyDetailsPage` | |
| 45 | `/member/benefits` | `BenefitsPage` | `pathMatch: full` |
| 46 | `/member/benefits/:categoryId` | `BenefitDetailPage` | input-bound param |
| 47 | `/member/transactions` | `TransactionsPage` | |
| 48 | `/member/orders` | `TransactionsPage` | same component as 47 — see divergence #2 |
| 49 | `/member/orders/:transactionId` | `TransactionDetailPage` | |
| 50 | `/member/payments/:paymentId` | `PaymentDetailPage` | |
| 51 | `/member/health-records` | `HealthRecordsPage` | |
| 52 | `/member/family` | `FamilyPage` | |
| 53 | `/member/profile` | `ProfilePage` | |
| 54 | `/member/services` | `ServicesPage` | |
| 55 | `/member/health-checkup` | `HealthCheckupPage` | |
| 56 | `/member/helpline` | `HelplinePage` | |
| 57 | `/member/pharmacy` | `PharmacyPage` | |
| 58 | `/member/settings` | `SettingsPage` | |
| 59 | `/member/notifications` | `NotificationsPage` | **added 2026-08-07 this session** |
| 60 | `/member/vaccination` | `PlaceholderPage` | deliberate placeholder (NOTE, not a defect) |
| — | `/member/**` | `NotFoundPage` | wildcard |

## Count reconciliation

The task brief expected **55**. Actual is **60** `/member` children (+ `/login` + 2 redirects + 2 wildcards).

The gap is explained by loop expansion: counting the two `flatMap` blocks as source
literals rather than as the 16 routes they emit undercounts by 12, and `notifications`
was added this session. Anyone counting `path:` occurrences in the file will get the
wrong number — that is why this table is expanded.
