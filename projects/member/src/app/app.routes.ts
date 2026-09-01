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
        data: { title: 'Cashless letter', reason: 'no-api' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/bookings/bookings-page').then((m) => m.BookingsPage),
      },
      // Pathology and Radiology are one screen; `kind` binds from route data
      // via withComponentInputBinding().
      {
        path: 'lab-tests',
        data: { kind: 'LAB' },
        loadComponent: () => import('./features/lab/lab-tests-page').then((m) => m.LabTestsPage),
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
      // Diagnostics has its own layout in the reference, not the lab hero.
      {
        path: 'diagnostics',
        loadComponent: () =>
          import('./features/lab/diagnostics-page').then((m) => m.DiagnosticsPage),
      },
      // Vision and Dental are one screen; `area` binds from route data.
      {
        path: 'vision',
        data: { area: 'VISION' },
        loadComponent: () =>
          import('./features/services/benefit-services-page').then((m) => m.BenefitServicesPage),
      },
      {
        path: 'dental',
        data: { area: 'DENTAL' },
        loadComponent: () =>
          import('./features/services/benefit-services-page').then((m) => m.BenefitServicesPage),
      },
      {
        /*
         * Sheet flow 3, steps 3-9 — the whole vision journey the sheet and the
         * `Vision Backend` tab describe: start an order, pick partner and mode
         * of purchase, upload the eye prescription, get a coupon code, buy on
         * the partner site.
         *
         * `/member/vision` above is a DIFFERENT model, not a partial one — a
         * clinic booking with slots and a payment page, on `vision-bookings/*`.
         * The order/partner/coupon journey has no endpoint anywhere: no order
         * creation, no partner or mode selection, no prescription upload, no
         * coupon issue. Nothing in the repo mentions a coupon.
         */
        path: 'vision/order',
        data: { title: 'Vision order and coupon', reason: 'no-api' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      {
        /*
         * Sheet flow 4, steps 18-33 — the procedure route that branches off a
         * dental consultation when the dentist recommends one: capture the
         * estimate, create a cart on hold, backend adjudication, adjudicator
         * builds the approved cart, slot with the SAME dentist, pay, confirm.
         *
         * The consultation half is built. The procedure half has no endpoints:
         * `dental-bookings/*` covers booking only, and the admin side is
         * confirm / cancel / reschedule / no-show / complete — no estimate, no
         * adjudication, no cart.
         */
        path: 'dental/procedure',
        data: { title: 'Dental procedure route', reason: 'no-api' },
        loadComponent: () =>
          import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
      // Appointments and Online consult share specialties -> doctors -> confirm.
      // Online skips clinic and slot, matching web-member.
      ...(['appointments', 'online-consult'] as const).flatMap((base) => {
        const mode = base === 'online-consult' ? 'ONLINE' : 'IN_CLINIC';
        return [
          {
            path: base,
            pathMatch: 'full' as const,
            data: { mode },
            loadComponent: () =>
              import('./features/appointments/consult-hub-page').then((m) => m.ConsultHubPage),
          },
          {
            path: `${base}/specialties`,
            data: { mode },
            loadComponent: () =>
              import('./features/appointments/specialties-page').then((m) => m.SpecialtiesPage),
          },
          {
            path: `${base}/doctors`,
            data: { mode },
            loadComponent: () =>
              import('./features/appointments/doctors-page').then((m) => m.DoctorsPage),
          },
          {
            path: `${base}/confirm`,
            data: { mode },
            loadComponent: () =>
              import('./features/appointments/appointment-confirm-page').then(
                (m) => m.AppointmentConfirmPage,
              ),
          },
        ];
      }),
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
        path: 'vaccination',
        loadComponent: () =>
          import('./features/vaccination/vaccination-services-page').then(
            (m) => m.VaccinationServicesPage,
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
        path: 'pharmacy',
        loadComponent: () => import('./features/misc/pharmacy-page').then((m) => m.PharmacyPage),
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
