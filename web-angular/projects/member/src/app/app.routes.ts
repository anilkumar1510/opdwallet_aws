import { Routes } from '@angular/router';

import { anonymousGuard, authGuard } from './core/session/auth.guard';

/**
 * One route tree for every viewport width. There is no mobile-only route and
 * no device-based redirect: a URL identifies a screen, not a screen-and-device.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'member' },
  {
    path: 'login',
    canActivate: [anonymousGuard],
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'member',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/member-shell').then((m) => m.MemberShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'wallet',
        loadComponent: () => import('./features/wallet/wallet-page').then((m) => m.WalletPage),
      },
      {
        path: 'claims',
        loadComponent: () => import('./features/claims/claims-page').then((m) => m.ClaimsPage),
      },
      {
        /*
         * Flow 9 step 9 — "credit goes to the member bank account, not the
         * wallet", with the bank details "captured once in the profile".
         *
         * Nothing in this system holds a bank account: no field on the user, no
         * payout service, no capture on first submission. A reimbursement is
         * approved and then has nowhere to go, which is the one gap in this
         * flow a member would feel directly.
         */
        path: 'claims/bank-details',
        data: { title: 'Where your money goes', reason: 'no-api' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        path: 'claims/new',
        loadComponent: () =>
          import('./features/claims/new-claim-page').then((m) => m.NewClaimPage),
      },
      {
        path: 'claims/:claimId',
        loadComponent: () =>
          import('./features/claims/claim-detail-page').then((m) => m.ClaimDetailPage),
      },
      {
        /*
         * The cashless letter — sheet flow 2 step 15, flow 4 steps 13 and 30,
         * flow 6 step 13: "Letter is available in the application and is
         * emailed", carrying the patient, provider and approved amount.
         *
         * Nothing generates one. A search of the whole API for cashless, letter
         * or preauth returns no route; the only trace anywhere is a
         * `cashlessAvailable` boolean on the doctor record and a
         * CASHLESS_PREAUTH claim type, neither of which produces a document.
         *
         * The payment step before it is settled by the dummy gateway and works;
         * this is the one step after it with no backend at all.
         */
        path: 'bookings/:reference/cashless-letter',
        data: { kind: 'cashless-letter', area: 'dental' },
        loadComponent: () =>
          import('./features/clinic-booking/dental-document-page').then(
            (m) => m.DentalDocumentPage,
          ),
      },
      {
        /*
         * Flow 4 steps 12 and 27 — "Receipt generated ... Receipt confirms the
         * payment only. It is not the tax invoice."
         *
         * Nothing issues one. An invoice exists and is downloadable, but it is
         * a different document raised at a different moment, so showing it here
         * would be answering a question the member did not ask.
         */
        /*
         * Flow 4 step 17 — "No show on the consultation".
         *
         * The sheet puts this on the network ("no show information comes from
         * the network") and leaves the consequence open: "penalisation is still
         * to be discussed". So there is nothing for a member to submit, and
         * nothing decided about what happens if they do. It stands here so the
         * branch is visible in the journey rather than silently absent.
         */
        /*
         * Flow 4 steps 7 and 8 — operations confirm the slot with the clinic.
         *
         * A real step that works, with no member-facing screen because there is
         * nothing for a member to do in it. It is here so the wait has a name:
         * without it, a booking sits at "pending confirmation" and the member
         * cannot tell whether something is expected of them.
         */
        path: 'bookings/:reference/confirmation',
        data: { title: 'Waiting on us', reason: 'with-us' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        path: 'bookings/:reference/not-attended',
        loadComponent: () =>
          import('./features/clinic-booking/not-attended-page').then((m) => m.NotAttendedPage),
      },
      {
        path: 'bookings/:reference/receipt',
        data: { kind: 'receipt', area: 'dental' },
        loadComponent: () =>
          import('./features/clinic-booking/dental-document-page').then(
            (m) => m.DentalDocumentPage,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/bookings-page').then((m) => m.BookingsPage),
      },
      // Pathology (lab-tests) and Radiology & Cardiology (diagnostics) share one
      // self-contained STATIC journey; `kind` binds from route data. See
      // features/diagnostics/diagnostics-page.ts and REMOVED-APIS.md.
      {
        path: 'lab-tests',
        data: { kind: 'PATHOLOGY' },
        loadComponent: () => import('./features/diagnostics/diagnostics-page').then((m) => m.DiagnosticsPage),
      },

      /*
       * PATIENT-FLOWS GAPS — routed, not built, because the API has nothing
       * behind them. Each entry names the sheet steps it stands in for and the
       * endpoints that would have to exist first. `reason: 'no-api'` is what
       * separates these from a migration gap: there is no current-portal screen
       * to fall back to either.
       *
       * These are destinations, not journeys. Nothing links to them yet — they
       * exist so the gap has an address to point at, in the audit and in review,
       * instead of a dead route.
       */
      {
        // Sheet flow 7, steps 2-6: tabs by health concern -> select test ->
        // select provider -> mode of collection. The built journey is
        // prescription-first (`lab-tests/upload`), which never browses a
        // catalogue. Needs a member-side test catalogue: there is none —
        // `admin/lab/master-tests` is admin-only.
        /*
         * Flow 7 as the sheet describes it, test-first: concerns, test,
         * provider, collection, slot, review, hold. One set of screens for both
         * cards — `area` binds from route data, the way vision and dental
         * share theirs.
         *
         * The prescription-first journey stays where it is. This is the second
         * door the sheet opens on, not a replacement for the one that works.
         */
        path: 'pathology/flow',
        data: { area: 'pathology' },
        loadComponent: () =>
          import('./features/diagnostics-flow/concerns-page').then((m) => m.ConcernsPage),
      },
      {
        path: 'radiology/flow',
        data: { area: 'radiology' },
        loadComponent: () =>
          import('./features/diagnostics-flow/concerns-page').then((m) => m.ConcernsPage),
      },
      ...(['pathology', 'radiology'] as const).flatMap((area) => [
        {
          path: `${area}/flow/test`,
          loadComponent: () =>
            import('./features/diagnostics-flow/test-detail-page').then((m) => m.TestDetailPage),
        },
        {
          path: `${area}/flow/provider`,
          loadComponent: () =>
            import('./features/diagnostics-flow/provider-page').then((m) => m.ProviderPage),
        },
        {
          path: `${area}/flow/collection`,
          loadComponent: () =>
            import('./features/diagnostics-flow/collection-mode-page').then(
              (m) => m.CollectionModePage,
            ),
        },
        {
          path: `${area}/flow/slot`,
          loadComponent: () =>
            import('./features/diagnostics-flow/slot-page').then((m) => m.DiagnosticsSlotPage),
        },
        {
          path: `${area}/flow/review`,
          loadComponent: () =>
            import('./features/diagnostics-flow/order-review-page').then((m) => m.OrderReviewPage),
        },
        {
          path: `${area}/flow/hold`,
          loadComponent: () =>
            import('./features/diagnostics-flow/order-hold-page').then((m) => m.OrderHoldPage),
        },
        {
          // Steps 8 to 17, one screen each, walked with Back and Next.
          path: `${area}/flow/step/:step`,
          loadComponent: () =>
            import('./features/diagnostics-flow/order-progress-page').then(
              (m) => m.OrderProgressPage,
            ),
        },
      ]),
      {
        path: 'lab-tests/browse',
        data: {
          title: 'Browse tests by health concern',
          reason: 'no-api',
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        // Same gap on the radiology card. `admin/diagnostics/master-tests` is
        // likewise admin-only.
        path: 'diagnostics/browse',
        data: {
          title: 'Browse scans by health concern',
          reason: 'no-api',
        },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      // Lab journey: prescription -> cart -> lab -> slot -> order.
      // `data.kind` is NOT optional on these two, despite the component inputs
      // carrying a LAB default. withComponentInputBinding() sets an input the
      // route does not supply to `undefined`, which overrides the initializer —
      // so `kind() === LabKind.Lab` was false here and the cart's vendor link
      // pointed at /member/diagnostics/…, dead-ending the lab ordering journey.
      {
        path: 'lab-tests/upload',
        data: { kind: 'LAB' },
        loadComponent: () =>
          import('./features/lab/upload-prescription-page').then((m) => m.UploadPrescriptionPage),
      },
      {
        path: 'lab-tests/cart/:cartId',
        data: { kind: 'LAB' },
        loadComponent: () => import('./features/lab/cart-page').then((m) => m.CartPage),
      },
      {
        path: 'lab-tests/cart/:cartId/vendor/:vendorId',
        data: { kind: 'LAB' },
        loadComponent: () =>
          import('./features/lab/vendor-booking-page').then((m) => m.VendorBookingPage),
      },
      {
        path: 'lab-tests/orders',
        data: { kind: 'LAB' },
        loadComponent: () => import('./features/lab/lab-orders-page').then((m) => m.LabOrdersPage),
      },
      {
        path: 'lab-tests/orders/:orderId',
        data: { kind: 'LAB' },
        loadComponent: () =>
          import('./features/lab/lab-order-detail-page').then((m) => m.LabOrderDetailPage),
      },

      // Diagnostics is the same journey on the member/diagnostics/* prefix.
      {
        path: 'diagnostics/upload',
        data: { kind: 'DIAGNOSTIC' },
        loadComponent: () =>
          import('./features/lab/upload-prescription-page').then((m) => m.UploadPrescriptionPage),
      },
      {
        path: 'diagnostics/cart/:cartId',
        data: { kind: 'DIAGNOSTIC' },
        loadComponent: () => import('./features/lab/cart-page').then((m) => m.CartPage),
      },
      {
        path: 'diagnostics/cart/:cartId/vendor/:vendorId',
        data: { kind: 'DIAGNOSTIC' },
        loadComponent: () =>
          import('./features/lab/vendor-booking-page').then((m) => m.VendorBookingPage),
      },
      {
        path: 'diagnostics/orders',
        data: { kind: 'DIAGNOSTIC' },
        loadComponent: () => import('./features/lab/lab-orders-page').then((m) => m.LabOrdersPage),
      },
      {
        path: 'diagnostics/orders/:orderId',
        data: { kind: 'DIAGNOSTIC' },
        loadComponent: () =>
          import('./features/lab/lab-order-detail-page').then((m) => m.LabOrderDetailPage),
      },
      // Radiology & Cardiology — same static journey as lab-tests, kind=RADIOLOGY.
      {
        path: 'diagnostics',
        data: { kind: 'RADIOLOGY' },
        loadComponent: () =>
          import('./features/diagnostics/diagnostics-page').then((m) => m.DiagnosticsPage),
      },
      // Vision is a self-contained STATIC coupon journey (no backend, no wallet
      // block). See features/vision/vision-page.ts and REMOVED-APIS.md.
      {
        path: 'vision',
        loadComponent: () =>
          import('./features/vision/vision-page').then((m) => m.VisionPage),
      },
      {
        // Dental is a self-contained STATIC journey (no backend): consultation
        // + optional procedure route. See features/dental/dental-page.ts.
        path: 'dental',
        loadComponent: () =>
          import('./features/dental/dental-page').then((m) => m.DentalPage),
      },
      {
        /*
         * The vision cart, built from what the partner reported.
         *
         * Two states, no input: waiting on the partner, or settled. The member
         * never enters an amount — the coupon is a reference id, Lenskart
         * prices the basket and reports its value, and operations record it
         * (`ops/vision/orders/:id/report`) until an integration replaces them.
         *
         * Addressed per order so a member with two orders in a year does not
         * share one page.
         */
        path: 'vision/order/:orderId/cart',
        loadComponent: () =>
          import('./features/services/vision-cart-page').then((m) => m.VisionCartPage),
      },
      {
        /*
         * Sheet flow 3, steps 3-7 — the member's half of the vision journey:
         * start an order, pick partner and mode of purchase, upload the eye
         * prescription, submit, receive a coupon bound to the order id.
         *
         * Steps 8-14 are NOT missing. They run on Lenskart's checkout and its
         * Insurance Dashboard, per the sheet's `Vision Backend` tab, and never
         * belonged to this portal.
         *
         * `/member/vision` above is a different model — a clinic booking with
         * slots on `vision-bookings/*`, which appears in neither sheet and has
         * no clinics on the live database. Both are routed while retiring one
         * is an open decision in openspec/changes/member-vision-order.
         */
        path: 'vision/order',
        loadComponent: () =>
          import('./features/services/vision-order-page').then((m) => m.VisionOrderPage),
      },
      {
        // Flow 4 step 2 — "Compare dentists", as the entry point the sheet
        // describes rather than a list two steps in. The service picker lives
        // inside it, because a fee is per service and there is otherwise
        // nothing to put in the fee column.
        path: 'dental/compare',
        loadComponent: () =>
          import('./features/clinic-booking/compare-dentists-page').then(
            (m) => m.CompareDentistsPage,
          ),
      },
      {
        // Flow 4 step 15 — the visit is over: upload the prescription and answer
        // whether a procedure was recommended. That answer is the branch the
        // whole second half of the flow turns on.
        path: 'dental/visit/:bookingId/close',
        loadComponent: () =>
          import('./features/clinic-booking/close-visit-page').then((m) => m.CloseVisitPage),
      },
      {
        // Flow 4 steps 18-19 — add the estimate the dentist quoted; the cart
        // then waits on adjudication. Nothing is charged at this point.
        path: 'dental/procedure/:bookingId/estimate',
        loadComponent: () =>
          import('./features/clinic-booking/procedure-estimate-page').then(
            (m) => m.ProcedureEstimatePage,
          ),
      },
      {
        /*
         * Flow 4 steps 22-28 — the procedure cart: what was approved and what
         * was not, a slot at the same clinic, payment, then the wait while
         * operations confirm with the clinic.
         *
         * Adjudication (20-21) and confirmation (29) are deliberately absent:
         * they are decisions made ABOUT the member, so they live on ops.
         */
        /*
         * Flow 4 steps 27, 30 and 32 — the three documents the procedure route
         * promises after payment. None is produced, so each says so on its own
         * page rather than being left off the screen: a member told a cashless
         * letter exists will look for it, and finding nothing reads as a fault
         * with their booking.
         *
         * Step 30's letter is the same missing generator as the consultation's
         * step 13, and step 32's invoice exists for a CONSULTATION only —
         * dental-bookings raises one, dental-procedures has no equivalent.
         */
        path: 'dental/procedure/:procedureId/document/:kind',
        data: { reason: 'not-issued' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        path: 'dental/procedure/:procedureId',
        loadComponent: () =>
          import('./features/clinic-booking/procedure-detail-page').then(
            (m) => m.ProcedureDetailPage,
          ),
      },
      // Online consultation is a self-contained STATIC journey (no backend) —
      // see features/online-consult/online-consult-page.ts and REMOVED-APIS.md.
      {
        path: 'online-consult',
        loadComponent: () =>
          import('./features/online-consult/online-consult-page').then((m) => m.OnlineConsultPage),
      },
      // In-clinic consultation is now a self-contained STATIC journey (no backend).
      // See features/appointments/inclinic-page.ts and REMOVED-APIS.md.
      {
        path: 'appointments',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/appointments/inclinic-page').then((m) => m.InClinicPage),
      },
      {
        // The benefit card historically deep-linked to /specialties; keep it working.
        path: 'appointments/specialties',
        loadComponent: () =>
          import('./features/appointments/inclinic-page').then((m) => m.InClinicPage),
      },
      {
        path: 'appointments/select-patient',
        loadComponent: () =>
          import('./features/appointments/appointment-patient-page').then(
            (m) => m.AppointmentPatientPage,
          ),
      },
      {
        path: 'appointments/select-slot',
        loadComponent: () =>
          import('./features/appointments/appointment-slot-page').then(
            (m) => m.AppointmentSlotPage,
          ),
      },
      // Everything after an in-clinic request is raised: waiting on the clinic,
      // the cart, payment, letter, visit, prescription, invoice. One screen,
      // because the member returns to the same booking for each of them.
      {
        path: 'appointments/journey/:appointmentId',
        loadComponent: () =>
          import('./features/appointments/inclinic-journey-page').then(
            (m) => m.InClinicJourneyPage,
          ),
      },
      // Side journey off the doctor list, for a doctor who is not in the network.
      {
        path: 'appointments/suggest-doctor',
        loadComponent: () =>
          import('./features/appointments/empanelment-page').then((m) => m.EmpanelmentPage),
      },

      // Vision and Dental share one clinic-booking journey:
      // clinics -> select-patient -> select-slot -> confirm (-> payment).
      ...(['vision', 'dental'] as const).flatMap((base) => {
        const area = base === 'vision' ? 'VISION' : 'DENTAL';
        return [
          {
            path: `${base}/clinics`,
            data: { area },
            loadComponent: () =>
              import('./features/clinic-booking/clinics-page').then((m) => m.ClinicsPage),
          },
          {
            path: `${base}/select-patient`,
            data: { area },
            loadComponent: () =>
              import('./features/clinic-booking/select-patient-page').then(
                (m) => m.SelectPatientPage,
              ),
          },
          {
            path: `${base}/select-slot`,
            data: { area },
            loadComponent: () =>
              import('./features/clinic-booking/select-slot-page').then((m) => m.SelectSlotPage),
          },
          {
            path: `${base}/confirm`,
            data: { area },
            loadComponent: () =>
              import('./features/clinic-booking/confirm-booking-page').then(
                (m) => m.ConfirmBookingPage,
              ),
          },
        ];
      }),
      {
        path: 'vision/payment/:bookingId',
        loadComponent: () =>
          import('./features/clinic-booking/vision-payment-page').then((m) => m.VisionPaymentPage),
      },

      // Vaccination: services -> vendors -> select-patient -> select-slot -> confirm.
      // An extra step versus vision/dental, since the vaccine itself is chosen
      // before the vendor rather than being a fixed category.
      {
        // Vaccination is a self-contained STATIC journey (no backend).
        // See features/vaccination/vaccination-page.ts and REMOVED-APIS.md.
        path: 'vaccination',
        loadComponent: () =>
          import('./features/vaccination/vaccination-page').then((m) => m.VaccinationPage),
      },
      {
        /*
         * Flow 6 step 3 — the optional prescription, between choosing the
         * vaccine and choosing the provider, where the sheet puts it.
         */
        path: 'vaccination/prescription',
        loadComponent: () =>
          import('./features/vaccination/vaccination-prescription-page').then(
            (m) => m.VaccinationPrescriptionPage,
          ),
      },
      {
        path: 'vaccination/vendors',
        loadComponent: () =>
          import('./features/vaccination/vaccination-vendors-page').then(
            (m) => m.VaccinationVendorsPage,
          ),
      },
      {
        path: 'vaccination/select-patient',
        loadComponent: () =>
          import('./features/vaccination/vaccination-patient-page').then(
            (m) => m.VaccinationPatientPage,
          ),
      },
      {
        path: 'vaccination/select-slot',
        loadComponent: () =>
          import('./features/vaccination/vaccination-slot-page').then(
            (m) => m.VaccinationSlotPage,
          ),
      },
      {
        /*
         * Flow 6 steps 12 and 13 — the receipt and the cashless letter, which
         * are the same two documents dental raises, so they are the same
         * screen with the vendor's wording.
         */
        /*
         * Flow 6 steps 15 and 16 — the vendor's report and the invoice. Both
         * are other people's actions, so the screen tells rather than asks.
         */
        path: 'vaccination/booking/:reference/outcome',
        loadComponent: () =>
          import('./features/vaccination/vaccination-outcome-page').then(
            (m) => m.VaccinationOutcomePage,
          ),
      },
      {
        /*
         * Flow 6 step 16 — the invoice. A real one is generated when the
         * vendor confirms the dose, and the appointment page hands that over;
         * this stands in before it exists, and shows the same figures after,
         * so the step is never a dead end.
         */
        path: 'vaccination/booking/:reference/invoice',
        data: { kind: 'invoice', area: 'vaccination' },
        loadComponent: () =>
          import('./features/clinic-booking/dental-document-page').then(
            (m) => m.DentalDocumentPage,
          ),
      },
      {
        path: 'vaccination/booking/:reference/receipt',
        data: { kind: 'receipt', area: 'vaccination' },
        loadComponent: () =>
          import('./features/clinic-booking/dental-document-page').then(
            (m) => m.DentalDocumentPage,
          ),
      },
      {
        path: 'vaccination/booking/:reference/cashless-letter',
        data: { kind: 'cashless-letter', area: 'vaccination' },
        loadComponent: () =>
          import('./features/clinic-booking/dental-document-page').then(
            (m) => m.DentalDocumentPage,
          ),
      },
      {
        path: 'vaccination/confirm',
        loadComponent: () =>
          import('./features/vaccination/vaccination-confirm-page').then(
            (m) => m.VaccinationConfirmPage,
          ),
      },
      {
        path: 'wellness',
        loadComponent: () =>
          import('./features/wellness/wellness-page').then((m) => m.WellnessPage),
      },
      {
        path: 'ahc/booking',
        data: { leg: 'lab' },
        loadComponent: () =>
          import('./features/wellness/ahc-booking-page').then((m) => m.AhcBookingPage),
      },
      {
        path: 'ahc/booking/diagnostic',
        data: { leg: 'diagnostic' },
        loadComponent: () =>
          import('./features/wellness/ahc-booking-page').then((m) => m.AhcBookingPage),
      },
      {
        // Sheet flow 8, after step 10 — the placed order, both legs and their
        // reports. Was a placeholder while the API's ownership check compared a
        // populated document as a string and refused every member their own
        // order; that is fixed, so this is the real screen.
        path: 'ahc/orders/:orderId',
        loadComponent: () =>
          import('./features/wellness/ahc-order-page').then((m) => m.AhcOrderPage),
      },
      {
        // Flow 8's 23 steps, one screen each — see AhcWalkthroughPage.
        path: 'ahc/walkthrough/:step',
        loadComponent: () =>
          import('./features/wellness/ahc-walkthrough-page').then((m) => m.AhcWalkthroughPage),
      },
      {
        path: 'ahc/booking/payment',
        loadComponent: () =>
          import('./features/wellness/ahc-payment-page').then((m) => m.AhcPaymentPage),
      },
      {
        path: 'policy-details/:policyId',
        loadComponent: () =>
          import('./features/policy/policy-details-page').then((m) => m.PolicyDetailsPage),
      },
      {
        path: 'benefits',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/benefits/benefits-page').then((m) => m.BenefitsPage),
      },
      {
        // Route param binds to the component's `categoryId` input via
        // withComponentInputBinding().
        path: 'benefits/:categoryId',
        loadComponent: () =>
          import('./features/benefits/benefit-detail-page').then((m) => m.BenefitDetailPage),
      },
      // MATCHES THE REFERENCE, as of session 54: /member/transactions is the
      // WALLET LEDGER and /member/orders is the service-order list, exactly as
      // web-member routes them. Angular had these swapped (parity register
      // entry 2), which left the home quicklink labelled "Transaction History"
      // opening a list of service orders.
      // The reference routes the room at /member/consultations/[appointmentId];
      // same path here. NOT linked from anywhere yet — a "Join call" control
      // would promise a connection this cannot make until the API mints Agora
      // tokens. See audit/41-agora-scaffold.md.
      {
        path: 'consultations/:appointmentId',
        loadComponent: () =>
          import('./features/consultations/consultation-room-page').then(
            (m) => m.ConsultationRoomPage,
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transaction-history-page').then(
            (m) => m.TransactionHistoryPage,
          ),
      },
      // The service-order list, with the same four summary cards the reference
      // renders — the difference is two server-side filters (status,
      // serviceType), noted in tools/parity-divergences.md.
      {
        path: 'orders',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/transactions/transactions-page').then((m) => m.TransactionsPage),
      },
      // The reference exposes transaction detail under /member/orders/:id.
      {
        path: 'orders/:transactionId',
        loadComponent: () =>
          import('./features/transactions/transaction-detail-page').then(
            (m) => m.TransactionDetailPage,
          ),
      },
      {
        path: 'payments/:paymentId',
        loadComponent: () =>
          import('./features/transactions/payment-detail-page').then((m) => m.PaymentDetailPage),
      },
      {
        path: 'health-records',
        loadComponent: () =>
          import('./features/records/health-records-page').then((m) => m.HealthRecordsPage),
      },
      {
        /*
         * A floater — one pot of cover shared by the whole family — as flow 6
         * and the wallet configuration sheet describe it.
         *
         * `allocationType` is a single PLAN-WIDE setting ('INDIVIDUAL' or
         * 'FLOATER') on the plan config's wallet block. There is no per-benefit
         * allocation, so "vaccination is shared but dental is not" has nowhere
         * to live: it needs a field on the benefit and `wallet.service.ts` to
         * read it where it now reads the plan-level one.
         *
         * Marked 'not-modelled' rather than 'no-api' for exactly that reason —
         * this is a schema decision, not a missing screen.
         */
        path: 'wallet/shared-cover',
        data: { title: 'Shared with your family', reason: 'not-modelled' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        path: 'family',
        loadComponent: () => import('./features/family/family-page').then((m) => m.FamilyPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'services',
        loadComponent: () => import('./features/misc/services-page').then((m) => m.ServicesPage),
      },
      {
        path: 'health-checkup',
        loadComponent: () =>
          import('./features/misc/health-checkup-page').then((m) => m.HealthCheckupPage),
      },
      {
        path: 'helpline',
        loadComponent: () => import('./features/misc/helpline-page').then((m) => m.HelplinePage),
      },
      {
        // Pharmacy is a self-contained STATIC prescription-led journey (no
        // backend). See features/pharmacy/pharmacy-page.ts and REMOVED-APIS.md.
        path: 'pharmacy',
        loadComponent: () => import('./features/pharmacy/pharmacy-page').then((m) => m.PharmacyPage),
      },
      {
        // Flow 5 step 11 — the partner picking, packing and delivering. There
        // is no partner and no tracking feed, so the step is walkable but says
        // so. Clickable because a flow you cannot step through cannot be shown.
        path: 'pharmacy/orders/:orderId/delivery',
        data: { title: 'The pharmacy delivers your order', reason: 'no-api' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        // Flow 5 step 15. Half of this is real — the cover is credited back by
        // `cancel()` — but the member's own share has no payout to go to.
        path: 'pharmacy/orders/:orderId/refund',
        data: { title: 'Refund if the order fails', reason: 'no-api' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        // Flow 5 step 12 — the receipt, built from the order's own figures.
        path: 'pharmacy/orders/:orderId/receipt',
        loadComponent: () =>
          import('./features/misc/pharmacy-receipt-page').then((m) => m.PharmacyReceiptPage),
      },
      {
        path: 'pharmacy/orders/:orderId',
        loadComponent: () =>
          import('./features/misc/pharmacy-order-page').then((m) => m.PharmacyOrderPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/misc/settings-page').then((m) => m.SettingsPage),
      },
      // The shell's bell dropdown covers this on desktop; the route exists
      // because web-member-rn has a full screen and a phone needs one.
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications-page').then((m) => m.NotificationsPage),
      },

      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
  { path: '**', redirectTo: 'member' },
];
