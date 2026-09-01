import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackLink } from '../../shared/ui/back-link';

/** Hardcoded in the reference; there is no endpoint behind this screen. */
const FEATURES: readonly string[] = [
  'Comprehensive health packages',
  'Age-specific screenings',
  'Home sample collection',
  'Digital health reports',
  'Doctor consultations',
  'Insurance coverage',
];

/**
 * Annual Health Check at /member/health-checkup.
 *
 * Static "Coming Soon", matching the reference — including its emerald/teal
 * palette, which is the only screen in the portal not on the blue theme.
 *
 * Note this is *not* the AHC booking journey: CAT008 is bookable today via
 * /member/wellness -> /member/ahc/booking. This screen is a separate,
 * unbuilt entry point that web-member also leaves unbuilt.
 */
@Component({
  selector: 'opd-health-checkup-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BackLink],
  template: `
    <div
      class="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-6"
    >
      <div class="w-full max-w-2xl">
        <div class="rounded-2xl bg-white p-8 text-center shadow-2xl lg:p-12">
          <span
            class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
            aria-hidden="true"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>

          <opd-back-link />
          <h1 class="mb-4 text-3xl font-bold text-gray-800 lg:text-4xl">Annual Health Check</h1>

          <p
            class="mb-6 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2 text-sm font-semibold text-white shadow-md"
          >
            Coming Soon!
          </p>

          <p class="mb-8 text-lg leading-relaxed text-gray-600">
            We're preparing comprehensive health checkup packages tailored for you. Soon you'll be
            able to book preventive health screenings, track your health metrics, and get
            personalized health insights.
          </p>

          <ul class="mb-8 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
            @for (feature of features; track feature) {
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-green-500" aria-hidden="true">&#10003;</span>
                <span class="text-gray-700">{{ feature }}</span>
              </li>
            }
          </ul>

          <div class="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-left">
            <h2 class="mb-1 font-semibold text-gray-800">Why Annual Health Checks?</h2>
            <p class="text-sm text-gray-600">
              Regular health checkups help detect potential health issues early, monitor your
              wellness progress, and provide peace of mind for you and your family.
            </p>
          </div>

          <a
            routerLink="/member"
            class="inline-flex min-h-touch items-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-8 font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
            >Back to Dashboard</a
          >
        </div>

        <p class="mt-8 text-center text-sm text-gray-600">
          Interested in early access? Contact our support team to be notified when this feature
          launches.
        </p>
      </div>
    </div>
  `,
})
export class HealthCheckupPage {
  protected readonly features = FEATURES;
}
