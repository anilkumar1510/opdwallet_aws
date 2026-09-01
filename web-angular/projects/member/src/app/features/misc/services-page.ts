import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ServiceLink {
  readonly name: string;
  readonly description: string;
  readonly href: string;
}

/**
 * Directory of everything in the portal, ported from web-member's
 * app/member/services/page.tsx.
 *
 * Two of its entries point at routes that do not exist in either portal
 * (/member/reimbursements, /member/help), so they are dropped rather than
 * shipped as dead links.
 *
 * /member/notifications was dropped for the same reason and has since been
 * built, so it is restored here - this directory was the only place it could
 * be reached from, and without the entry the screen had no entry point in the
 * UI at all. A dropped-links list is a snapshot of what did not exist when it
 * was written; re-check it whenever routes are added.
 */
const SERVICES: readonly ServiceLink[] = [
  { name: 'Dashboard', description: 'View your benefits overview and quick stats', href: '/member' },
  {
    name: 'OPD Wallet',
    description: 'Check balance and transaction history',
    href: '/member/wallet',
  },
  {
    name: 'Benefits',
    description: 'Explore all your healthcare benefits',
    href: '/member/benefits',
  },
  {
    name: 'Notifications',
    description: 'See your alerts and updates',
    href: '/member/notifications',
  },
  {
    name: 'Profile',
    description: 'View and edit your profile information',
    href: '/member/profile',
  },
  { name: 'Claims History', description: 'View all your past claims', href: '/member/claims' },
  {
    name: 'Submit New Claim',
    description: 'File a new reimbursement claim',
    href: '/member/claims/new',
  },
  {
    name: 'In-Clinic Appointments',
    description: 'Schedule doctor appointments at clinics',
    href: '/member/appointments/specialties',
  },
  {
    name: 'Online Consultations',
    description: 'Video consultation with doctors',
    href: '/member/online-consult/specialties',
  },
  {
    name: 'Lab Tests',
    description: 'Book lab tests and view results',
    href: '/member/lab-tests',
  },
  {
    name: 'Health Records',
    description: 'Access your medical records and prescriptions',
    href: '/member/health-records',
  },
  {
    name: 'Bookings',
    description: 'View all your bookings and appointments',
    href: '/member/bookings',
  },
  {
    name: 'Family Hub',
    description: 'Manage family members and dependents',
    href: '/member/family',
  },
  { name: 'Transactions', description: 'View all wallet transactions', href: '/member/transactions' },
  { name: 'Settings', description: 'Manage your account settings', href: '/member/settings' },
];

@Component({
  selector: 'opd-services-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to home"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">All Services</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">Everything available in your portal</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[1240px] px-5 py-6 lg:px-8">
        <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (service of services; track service.href) {
            <li>
              <a
                [routerLink]="service.href"
                class="block h-full rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm transition-colors hover:border-[#0F5FDC]"
              >
                <h2 class="font-semibold text-[#034DA2]">{{ service.name }}</h2>
                <p class="mt-1 text-sm text-ink-700">{{ service.description }}</p>
              </a>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class ServicesPage {
  protected readonly services = SERVICES;
}
