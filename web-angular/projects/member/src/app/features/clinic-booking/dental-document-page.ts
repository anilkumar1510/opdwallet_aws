import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { DENTAL_ONLY_API } from '../../core/clinic-booking/clinic-booking';
import { VACCINATION_API } from '../../core/vaccination/vaccination';
import { formatMoney, money } from '../../core/domain/money';
import { EmptyView, LoadingView } from '../../shared/ui/state-views';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Both journeys store an address object; vaccination leaves city, state and
 * postcode empty, so the parts are filtered rather than joined blindly.
 *
 * It accepts a plain string too, because the field's TYPE says string on the
 * vaccination side even though the DATA is an object — calling .trim() on it
 * threw inside the template, which silently abandoned the render and left the
 * screen on its loading spinner with no error anywhere.
 */
function formatAddress(value: PostalAddress | string | undefined): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (!value) return null;
  return [value.street, value.city, value.state, value.pincode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ') || null;
}

interface PostalAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/** Some routes wrap the booking in `data`, others return it bare. */
type BookingEnvelope = { data?: BookingDocumentDto } & BookingDocumentDto;

interface BookingDocumentDto {
  bookingId?: string;
  patientName?: string;
  serviceName?: string;
  clinicName?: string;
  clinicAddress?: PostalAddress;
  /**
   * Vaccination names the same two fields vendorName/vendorAddress — but the
   * address is the same object shape dental uses, not a string, whatever the
   * name suggests.
   */
  vendorName?: string;
  vendorAddress?: PostalAddress | string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  billAmount?: number;
  copayAmount?: number;
  insurancePayment?: number;
  totalMemberPayment?: number;
  paymentId?: string;
  invoiceGenerated?: boolean;
}

/**
 * The receipt and the cashless letter — flow 4 steps 12 and 13, and flow 6's
 * steps 12 and 13, which are the same two documents word for word.
 *
 * Both are composed from the booking, because NOTHING issues either one: no
 * service renders a receipt, and no job emails a letter "2 hours before the
 * consult time" as step 13 requires. Everything the sheet says each carries is
 * already on the booking, so the page assembles it and says plainly that it did.
 *
 * Shown rather than withheld because a member told a cashless letter exists
 * will go looking for it, and the clinic verifies one at the door. A page that
 * carries the right details and admits what it is beats a blank apology — and
 * beats a mock-up that pretends to be the issued document, which someone would
 * eventually present at a counter.
 */
@Component({
  selector: 'opd-dental-document-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView, EmptyView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/bookings"
            [queryParams]="{ tab: area() }"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to bookings"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              {{ isInvoice() ? 'Invoice' : isLetter() ? 'Cashless letter' : 'Payment receipt' }}
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              {{ reference() }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (loading()) {
          <opd-loading label="Loading your booking" />
        } @else if (details(); as visit) {
          <!--
            Said before the document, not after it. Someone who reads the
            details and stops has still been told what this is.
          -->
          <p class="mb-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700" role="note">
            @if (isInvoice()) {
              @if (visit.hasInvoice) {
                The issued invoice is on your appointment page — this is the same figures, laid out
                here.
              } @else {
                This is not the invoice. It is raised once the visit is complete and the amounts
                are final; until then this shows what it will carry.
              }
            } @else if (isLetter()) {
              We do not issue cashless letters yet. This shows what yours will carry — the
              {{ isVaccination() ? 'vendor' : 'clinic' }} cannot accept it. Ask them to call us to
              verify your cover.
            } @else {
              We do not issue receipts yet. This shows what yours will carry, from your booking. It
              is not a tax invoice.
            }
          </p>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            @if (isInvoice()) {
              <p class="text-3xl font-bold text-[#0B2C63]">{{ fmt(visit.fee) }}</p>
              <p class="mt-0.5 text-sm text-ink-700">Total billed</p>
            } @else if (isLetter()) {
              <p class="text-sm text-ink-700">
                {{ visit.clinicName }} may
                {{ isVaccination() ? 'give this dose' : 'treat this patient' }} without payment at
                the counter, up to the amount below.
              </p>
              <p class="mt-4 text-3xl font-bold text-[#0B2C63]">{{ fmt(visit.approved) }}</p>
              <p class="mt-0.5 text-sm text-ink-700">Approved from their cover</p>
            } @else {
              <p class="text-3xl font-bold text-[#0B2C63]">{{ fmt(visit.memberPaid) }}</p>
              <p class="mt-0.5 text-sm text-ink-700">Paid by you</p>
            }

            <dl class="mt-5 space-y-2 border-t border-surface-border pt-4 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Patient</dt>
                <dd class="font-medium text-ink-900">{{ visit.patientName }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">{{ isVaccination() ? 'Vendor' : 'Clinic' }}</dt>
                <dd class="text-right font-medium text-ink-900">
                  {{ visit.clinicName }}
                  @if (visit.clinicAddress) {
                    <span class="block text-xs font-normal text-ink-500">{{
                      visit.clinicAddress
                    }}</span>
                  }
                </dd>
              </div>
              <!--
                Flow 4 step 13 wants the DENTIST named. A dental booking records
                a clinic and no dentist, so the line stays and says who assigns
                one rather than disappearing — a letter that silently drops a
                named party is a letter nobody can check at the counter. Flow 6
                names no practitioner at all, so vaccination has no such line.
              -->
              @if (!isVaccination()) {
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Dentist</dt>
                  <dd class="font-medium text-ink-900">
                    {{ visit.doctorName ?? 'Assigned by the clinic' }}
                  </dd>
                </div>
              }
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">{{ isVaccination() ? 'Vaccine' : 'Treatment' }}</dt>
                <dd class="font-medium text-ink-900">{{ visit.serviceName }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Appointment</dt>
                <dd class="font-medium text-ink-900">
                  {{ visit.appointmentDate }} at {{ visit.appointmentTime }}
                </dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-ink-700">Booking</dt>
                <dd class="font-medium text-ink-900">{{ reference() }}</dd>
              </div>

              @if (!isLetter()) {
                <div class="flex justify-between gap-3 border-t border-surface-border pt-2">
                  <dt class="text-ink-700">{{ isVaccination() ? 'Price' : 'Clinic fee' }}</dt>
                  <dd class="font-medium text-ink-900">{{ fmt(visit.fee) }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Paid from your cover</dt>
                  <dd class="font-medium text-success-700">{{ fmt(visit.approved) }}</dd>
                </div>
                @if (visit.copay.amount > 0) {
                  <div class="flex justify-between gap-3">
                    <dt class="text-ink-700">Co-payment</dt>
                    <dd class="font-medium text-ink-900">{{ fmt(visit.copay) }}</dd>
                  </div>
                }
                <div class="flex justify-between gap-3">
                  <dt class="text-ink-700">Payment</dt>
                  <dd class="font-medium text-ink-900">{{ visit.paymentId ?? 'Not recorded' }}</dd>
                </div>
              }
            </dl>

            @if (isLetter()) {
              <p class="mt-4 rounded-xl bg-surface-sunk px-4 py-3 text-sm text-ink-500">
                Yours will be emailed two hours before the appointment once we start issuing them.
                Anything above {{ fmt(visit.approved) }} is settled
                {{ isVaccination() ? 'with the vendor' : 'at the clinic' }}.
              </p>
            }
          </section>

          @if (visit.paymentId; as paymentId) {
            <a
              [routerLink]="['/member/payments', paymentId]"
              class="mt-5 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
              >See your payment</a
            >
          }
        } @else {
          <opd-empty title="Booking not found" detail="We could not find that booking." />
        }
      </div>
    </div>
  `,
})
export class DentalDocumentPage {
  readonly reference = input<string>('');
  /** 'receipt' or 'cashless-letter', from the route data. */
  readonly kind = input<string>('receipt');
  /** 'dental' or 'vaccination' — which journey's booking to read. */
  readonly area = input<string>('dental');

  private readonly http = inject(HttpClient);
  protected readonly fmt = formatMoney;

  protected isLetter(): boolean {
    return this.kind() === 'cashless-letter';
  }

  /**
   * The invoice, step 16 for vaccination and 32 for a dental procedure.
   *
   * It shares the receipt's layout because it carries the same figures — what
   * separates them is WHEN and WHY: a receipt confirms a payment the moment it
   * clears, an invoice is raised after the visit and is the tax document. The
   * sheet is explicit that the receipt "is not the tax invoice", so conflating
   * the two would be the one mistake worth avoiding here.
   */
  protected isInvoice(): boolean {
    return this.kind() === 'invoice';
  }

  protected isVaccination(): boolean {
    return this.area() === 'vaccination';
  }

  private readonly record = signal<BookingDocumentDto | null>(null);
  protected readonly loading = signal(true);

  /**
   * Fetched into plain signals rather than through `resource()`.
   *
   * The resource resolved — its loader logged a value for the vaccination URL
   * exactly as it did for dental — yet the view never left "Loading your
   * booking" for vaccination while dental rendered from the identical code. I
   * could not account for that, and a screen that hangs is worse than a screen
   * built out of smaller parts, so this reads the way it renders: request,
   * set, done. If the resource behaviour is ever explained, this is three
   * lines to put back.
   */
  constructor() {
    effect(() => {
      const url =
        this.area() === 'vaccination'
          ? VACCINATION_API.byId(this.reference())
          : DENTAL_ONLY_API.bookingById(this.reference());

      this.loading.set(true);
      firstValueFrom(this.http.get<BookingEnvelope>(url))
        .then((body) => this.record.set(body?.data ?? body ?? null))
        .catch(() => this.record.set(null))
        .finally(() => this.loading.set(false));
    });
  }

  protected details() {
    const dto = this.record();
    if (!dto?.bookingId) return null;

    const address = dto.clinicAddress ?? dto.vendorAddress;
    return {
      patientName: dto.patientName?.trim() || 'Not recorded',
      serviceName: dto.serviceName?.trim() || 'Dental consultation',
      clinicName: (dto.clinicName ?? dto.vendorName)?.trim() || 'the clinic',
      clinicAddress: formatAddress(address),
      doctorName: dto.doctorName?.trim() || null,
      appointmentDate: dto.appointmentDate ? DATE.format(new Date(dto.appointmentDate)) : 'Not set',
      appointmentTime: dto.appointmentTime?.trim() || '',
      fee: money(dto.billAmount),
      approved: money(dto.insurancePayment),
      copay: money(dto.copayAmount),
      memberPaid: money(dto.totalMemberPayment),
      paymentId: dto.paymentId?.trim() || null,
      hasInvoice: dto.invoiceGenerated === true,
    };
  }
}
