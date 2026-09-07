import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { DENTAL_ONLY_API } from '../../core/clinic-booking/clinic-booking';
import { isAppError } from '../../core/http/app-error';

/** The upload endpoint's own limits, checked here so the file is named. */
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Flow 4 step 15 — "Upload prescription and answer whether a procedure was
 * recommended, yes or no".
 *
 * The single most consequential screen in the dental flow: the answer is the
 * branch the entire second half turns on. **No** closes the consultation.
 * **Yes** closes it too and opens the procedure route, steps 18 to 33.
 *
 * Both answers are given equal weight on screen. Making "yes" the prominent
 * one would nudge members toward a route that commits them to an estimate, an
 * adjudication and a second payment.
 */
@Component({
  selector: 'opd-close-visit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/bookings"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to bookings"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              After your visit
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ bookingId() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (error(); as problem) {
          <p class="mb-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
            {{ problem }}
          </p>
        }

        <!--
          Step 15 sits after step 8. The API refuses to close a visit that
          operations have not confirmed, and it used to refuse it AFTER the
          upload — so the member picked a file, waited, and was then told the
          booking was in the wrong state. Ask first, upload second.
        -->
        @if (booking.isLoading()) {
          <p class="text-sm text-ink-500">Loading your visit…</p>
        } @else if (status() && status() !== 'CONFIRMED') {
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
              @if (status() === 'COMPLETED') {
                This visit is already closed
              } @else {
                Not yet
              }
            </h2>
            <p class="mt-1 text-sm text-ink-700">
              @if (status() === 'COMPLETED') {
                You have already sent the prescription for this visit.
              } @else if (status() === 'PENDING_CONFIRMATION') {
                We are still confirming this visit with the clinic. Once they confirm it and you
                have been, come back to send your prescription.
              } @else {
                This visit is {{ status()?.toLowerCase() }}, so there is no prescription to send.
              }
            </p>
            <div class="mt-4 flex flex-col gap-3 sm:flex-row">
              @if (status() === 'PENDING_CONFIRMATION') {
                <a
                  [routerLink]="['/member/bookings', bookingId(), 'confirmation']"
                  class="flex min-h-touch flex-1 items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                  >What is this step?</a
                >
              }
              <a
                [routerLink]="['/member/bookings']"
                [queryParams]="{ tab: 'dental' }"
                class="flex min-h-touch flex-1 items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                >Back to your bookings</a
              >
            </div>

            <!--
              Demonstration only, and labelled as such. Nobody is ringing a
              clinic on a demo database, so without this the dental journey
              stops dead at step 8 and the whole second half is unreachable.
              The API refuses it outside development.
            -->
            @if (status() === 'PENDING_CONFIRMATION') {
              <div class="mt-5 border-t border-surface-border pt-4">
                <p class="text-xs text-ink-500">
                  For demonstrations: stand in for our team and confirm this visit, so you can walk
                  the rest of the journey.
                </p>
                <button
                  type="button"
                  class="mt-2 min-h-touch w-full rounded-xl border border-dashed border-surface-border px-4 text-sm font-semibold text-ink-700 hover:bg-surface-sunk disabled:opacity-60"
                  [disabled]="busy()"
                  (click)="demoConfirm()"
                >
                  {{ busy() ? 'Confirming…' : 'Confirm as our team (demo)' }}
                </button>
              </div>
            }
          </section>
        } @else {
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Your prescription</h2>
          <p class="mt-1 text-sm text-ink-700">
            Upload the prescription your dentist gave you. This closes the consultation.
          </p>

          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
            [disabled]="busy()"
            (change)="pick($event)"
            class="mt-4 block w-full text-sm text-ink-700 file:mr-3 file:min-h-touch file:rounded-xl file:border file:border-surface-border file:bg-white file:px-4 file:text-sm file:font-semibold file:text-ink-900"
          />

          @if (chosen(); as file) {
            <p class="mt-2 rounded-xl bg-success-50 px-3 py-2 text-sm text-success-700">
              {{ file.name }} ready to send.
            </p>
          }
        </section>

        <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
            Did the dentist recommend a procedure?
          </h2>
          <p class="mt-1 text-sm text-ink-700">
            Say yes only if they quoted you for further treatment. You will be asked for the
            estimate next.
          </p>

          <!--
            Equal weight, deliberately. "Yes" opens a route that commits the
            member to an estimate, an adjudication and a second payment, so it
            must not be the easy default.
          -->
          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk disabled:opacity-60"
              [disabled]="!chosen() || busy()"
              (click)="close(false)"
            >
              {{ busy() ? 'Sending…' : 'No, that is everything' }}
            </button>
            <button
              type="button"
              class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk disabled:opacity-60"
              [disabled]="!chosen() || busy()"
              (click)="close(true)"
            >
              {{ busy() ? 'Sending…' : 'Yes, a procedure was recommended' }}
            </button>
          </div>

          @if (!chosen()) {
            <p class="mt-3 text-sm text-ink-500">Upload the prescription first.</p>
          }
        </section>

        <!--
          The procedure route, steps 18 to 33, laid out where the branch is
          actually taken.
          
          Not on the payment screen, where it sat before: someone who has just
          paid for a consultation has not seen a dentist yet, and reading about
          estimates and second payments there is answering a question they have
          not been asked. Here they are holding the prescription and about to
          say yes or no, so this is the moment the second half becomes real.

          Steps we do are written as steps we do. A member cannot adjudicate
          their own cart or confirm their own slot, and a button implying
          otherwise would misstate who is waiting on whom.
        -->
        <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
            If you say yes, what follows
          </h2>
          <ol class="mt-3 space-y-2.5">
            <li class="text-sm text-ink-900">You enter the estimate the dentist quoted.</li>
            <li class="text-sm text-ink-500">
              We check it against your plan and the prescription. Nothing comes out of your cover
              while it is on hold.
            </li>
            <li class="text-sm text-ink-500">
              We tell you when the cart is ready, with what was approved and what was not.
            </li>
            <li class="text-sm text-ink-900">
              You pick a slot at {{ clinicName() ?? 'the same clinic' }} and pay your share.
            </li>
            <li class="text-sm text-ink-500">
              We confirm the slot with the clinic and issue your cashless letter.
            </li>
            <li class="text-sm text-ink-500">
              After the procedure, your invoice is raised and your cover is settled with the clinic.
            </li>
          </ol>
        </section>
        }
      </div>
    </div>
  `,
})
export class CloseVisitPage {
  readonly bookingId = input<string>('');

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly booking = resource({
    params: () => ({ id: this.bookingId() }),
    loader: ({ params }) =>
      firstValueFrom(
        this.http.get<{ data?: { status?: string }; status?: string }>(
          DENTAL_ONLY_API.bookingById(params.id),
        ),
      ).catch(() => null),
  });

  /** Named on the list above, so "the same clinic" is a place, not a phrase. */
  protected clinicName(): string | null {
    const body = this.booking.value() as { data?: { clinicName?: string }; clinicName?: string } | null;
    return (body?.data?.clinicName ?? body?.clinicName)?.trim() || null;
  }

  /** Null while loading or if the read failed — the form stays offered then. */
  protected status(): string | null {
    const body = this.booking.value();
    return body?.data?.status ?? body?.status ?? null;
  }

  protected readonly chosen = signal<File | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  /** See `DENTAL_ONLY_API.demoConfirm` — development only, refused elsewhere. */
  protected async demoConfirm(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.post(DENTAL_ONLY_API.demoConfirm(this.bookingId()), {}));
      this.booking.reload();
    } catch (error: unknown) {
      this.error.set(
        isAppError(error) ? error.message : 'We could not confirm that visit. Try again.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.error.set(null);

    if (file && !ACCEPTED.includes(file.type)) {
      this.error.set('Upload a PDF or a photo (JPG, PNG, GIF or WebP).');
      this.chosen.set(null);
      input.value = '';
      return;
    }
    if (file && file.size > MAX_BYTES) {
      this.error.set('That file is larger than 15 MB. Try a smaller scan or photo.');
      this.chosen.set(null);
      input.value = '';
      return;
    }
    this.chosen.set(file);
  }

  /**
   * `procedureRecommended` is sent as a STRING because the body is multipart.
   * The API compares it to 'true' rather than coercing, since 'false' is
   * truthy — reading it the other way opens the procedure route for everyone.
   */
  protected async close(procedureRecommended: boolean): Promise<void> {
    const file = this.chosen();
    if (!file) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('procedureRecommended', String(procedureRecommended));
      await firstValueFrom(
        this.http.post(DENTAL_ONLY_API.closeVisit(this.bookingId()), form),
      );
      await this.router.navigate(
        procedureRecommended
          ? ['/member/dental/procedure', this.bookingId(), 'estimate']
          : ['/member/bookings'],
        { queryParams: procedureRecommended ? undefined : { tab: 'dental' } },
      );
    } catch (error: unknown) {
      this.error.set(
        isAppError(error) ? error.message : 'We could not close that visit. Try again.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
