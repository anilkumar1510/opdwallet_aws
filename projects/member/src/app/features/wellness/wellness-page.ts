import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/**
 * Annual Health Check — DUMMY / STATIC journey, zero backend.
 *
 * A self-contained wizard that reproduces patient-flows Section 8 end to end so
 * the whole journey can be experienced without any API: the three entry options,
 * Route A (pathology first, then radiology) and Route B (full package), the
 * per-leg steps (postal code → mode → provider → address / centre → slot →
 * review → confirmed & billed), the grey-out rules, and the once-a-year limit.
 * A demo reset re-opens everything so every scenario is reachable. No network
 * calls are made. See REMOVED-APIS.md.
 */

type Leg = 'pathology' | 'radiology' | 'package';

const PATHOLOGY_PROVIDERS = ['Metropolis Labs', 'Dr Lal PathLabs', 'SRL Diagnostics'];
const RADIOLOGY_PROVIDERS = ['Medanta Diagnostics', 'Fortis Radiology', 'Max Imaging'];
const CENTRES = ['Sector 44, Gurugram', 'Cyber City, Gurugram', 'Sohna Road, Gurugram'];
const SLOT_DATES = ['Mon, 15 Sep', 'Tue, 16 Sep', 'Wed, 17 Sep', 'Thu, 18 Sep'];
const SLOT_TIMES = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'];

type AddressType = 'Home' | 'Work' | 'Other';

interface SavedAddress {
  id: string;
  type: AddressType;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

/** Static, in-memory saved addresses — placeholder for the profile addresses API. */
const SEED_ADDRESSES: SavedAddress[] = [
  { id: 'a1', type: 'Home', line1: 'B-402, Green Avenue', line2: 'Sector 45', landmark: 'Near City Park', city: 'Gurugram', state: 'Haryana', pincode: '122003' },
  { id: 'a2', type: 'Work', line1: 'DLF Cyber City, Tower B', line2: 'Phase 2', landmark: '', city: 'Gurugram', state: 'Haryana', pincode: '122002' },
];

function formatAddress(a: SavedAddress): string {
  return [a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.pincode}`]
    .filter((p) => p && p.trim())
    .join(', ');
}

@Component({
  selector: 'opd-wellness-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            (click)="headerBack()"
          >
            &larr;
          </button>
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">Annual Health Check</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Once a year — pathology and radiology
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <!-- Demo-only note -->
        <p class="mb-4 rounded-xl border border-dashed border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          🧪 Static demo journey — no data is saved. Use “Start over” to try every route again.
        </p>

        @if (confirmation(); as msg) {
          <div class="mb-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
            <p class="text-sm font-semibold text-success-700">{{ msg }}</p>
          </div>
        }

        <!-- ── Landing: three options ─────────────────────────────────────── -->
        @if (!activeLeg()) {
          @if (fullyUsed()) {
            <div class="mb-5 rounded-2xl border border-[#CDDDFE] bg-[#F3F7FF] p-5">
              <p class="text-base font-semibold text-[#034DA2]">Annual Health Check used for this year</p>
              <p class="mt-1 text-sm text-ink-700">
                This benefit can be taken only once a year. Both pathology and radiology are booked.
              </p>
            </div>
          } @else {
            <h2 class="mb-1 text-lg font-bold text-[#034DA2]">Choose how to book</h2>
            <p class="mb-3 text-sm text-ink-700">
              Book pathology and radiology individually, or the entire package in one go. Choosing a
              route closes the other.
            </p>
            @if (!pathologyBooked() && !radiologyBooked() && !packageBooked()) {
              <p class="mb-4 rounded-xl border border-[#CDDDFE] bg-[#F3F7FF] px-3 py-2 text-xs text-[#034DA2]">
                ⓘ On the individual route, <strong>pathology must be booked first</strong> — radiology
                opens only after the pathology booking is done.
              </p>
            }
          }

          <div class="space-y-3">
            <!-- Book Pathology -->
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4 text-left disabled:opacity-50"
              style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
              [disabled]="!canBook('pathology')"
              (click)="startLeg('pathology')"
            >
              <span>
                <span class="block font-semibold text-[#034DA2]">Book Pathology</span>
                <span class="mt-0.5 block text-xs text-ink-500">Home collection or centre visit</span>
              </span>
              <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="pathologyBooked()" [class.text-ink-400]="!pathologyBooked()">
                {{ pathologyBooked() ? '✓ Booked' : 'Book →' }}
              </span>
            </button>

            <!-- Book Radiology (only after pathology, on the individual route) -->
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4 text-left disabled:opacity-50"
              style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
              [disabled]="!canBook('radiology')"
              (click)="startLeg('radiology')"
            >
              <span>
                <span class="block font-semibold text-[#034DA2]">Book Radiology</span>
                <span class="mt-0.5 block text-xs text-ink-500">
                  {{ pathologyBooked() || radiologyBooked() ? 'Centre visit' : 'Book pathology first' }}
                </span>
              </span>
              <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="radiologyBooked()" [class.text-ink-400]="!radiologyBooked()">
                {{ radiologyBooked() ? '✓ Booked' : 'Book →' }}
              </span>
            </button>

            <!-- Book the entire package -->
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#CDDDFE] bg-[#F3F7FF] p-4 text-left disabled:opacity-50"
              style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.10)"
              [disabled]="!canBook('package')"
              (click)="startLeg('package')"
            >
              <span>
                <span class="block font-semibold text-[#034DA2]">Book the entire package</span>
                <span class="mt-0.5 block text-xs text-ink-500">Pathology + radiology together, one booking</span>
              </span>
              <span class="shrink-0 text-xs font-semibold" [class.text-success-700]="packageBooked()" [class.text-ink-400]="!packageBooked()">
                {{ packageBooked() ? '✓ Booked' : 'Book →' }}
              </span>
            </button>
          </div>

          @if (pathologyBooked() && !radiologyBooked() && !packageBooked()) {
            <p class="mt-4 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700">
              Pathology is booked and billed. Complete the radiology leg — the benefit is billed
              either way, so an unbooked radiology leg is paid for and not used.
            </p>
          }

          @if (pathologyBooked() || radiologyBooked() || packageBooked()) {
            <button
              type="button"
              class="mt-6 text-sm font-medium text-brand-700 underline"
              (click)="reset()"
            >
              Start over (demo reset)
            </button>
          }
        }

        <!-- ── Wizard for the active leg ──────────────────────────────────── -->
        @else {
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#034DA2]">{{ legLabel() }}</h2>
            <span class="text-xs text-ink-500">Step {{ step() + 1 }} of {{ steps().length }}</span>
          </div>

          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
            @switch (currentStep()) {
              @case ('postal') {
                <label class="block text-sm font-medium text-ink-700">Address postal code</label>
                <p class="mb-2 text-xs text-ink-500">Drives which providers can serve you.</p>
                <button
                  type="button"
                  class="mb-3 flex min-h-touch w-full items-center justify-center gap-2 rounded-xl border border-[#0F5FDC] bg-blue-50 px-4 text-sm font-semibold text-[#0F5FDC]"
                  (click)="detectLocation()"
                >
                  📍 Auto-detect my location
                </button>
                @if (detected(); as loc) {
                  <p class="mb-3 rounded-xl bg-[#F0FDF4] px-3 py-2 text-xs text-success-700">
                    Detected: {{ loc }}
                  </p>
                }
                <input
                  class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500"
                  inputmode="numeric"
                  placeholder="Enter postal code"
                  [value]="postalCode()"
                  (input)="postalCode.set($any($event.target).value)"
                />
              }
              @case ('mode') {
                <p class="mb-2 text-sm font-medium text-ink-700">Mode of collection</p>
                <div class="grid gap-3 sm:grid-cols-2">
                  @for (m of ['home','centre']; track m) {
                    <button
                      type="button"
                      class="min-h-touch rounded-xl border px-4 text-sm font-medium"
                      [class.border-brand-500]="mode() === m"
                      [class.bg-blue-50]="mode() === m"
                      [class.text-brand-700]="mode() === m"
                      [class.border-surface-border]="mode() !== m"
                      [class.text-ink-700]="mode() !== m"
                      (click)="mode.set($any(m))"
                    >
                      {{ m === 'home' ? 'Home collection' : 'Visit collection centre' }}
                    </button>
                  }
                </div>
              }
              @case ('provider') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select provider</p>
                <p class="mb-3 text-xs text-ink-500">Serviceable at {{ postalCode() }}.</p>
                <div class="space-y-2">
                  @for (p of providers(); track p) {
                    <button
                      type="button"
                      class="flex min-h-touch w-full items-center justify-between rounded-xl border px-4 text-sm"
                      [class.border-brand-500]="provider() === p"
                      [class.bg-blue-50]="provider() === p"
                      [class.border-surface-border]="provider() !== p"
                      (click)="provider.set(p)"
                    >
                      <span class="font-medium text-ink-900">{{ p }}</span>
                      @if (provider() === p) { <span class="text-brand-700">✓</span> }
                    </button>
                  }
                </div>
              }
              @case ('address') {
                <p class="text-sm font-medium text-ink-700">Collection address</p>
                <p class="mb-3 text-xs text-ink-500">Required for home collection.</p>

                @if (!addingAddress()) {
                  <div class="space-y-2">
                    @for (addr of savedAddresses(); track addr.id) {
                      <button
                        type="button"
                        class="flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left"
                        [class.border-brand-500]="selectedAddressId() === addr.id"
                        [class.bg-blue-50]="selectedAddressId() === addr.id"
                        [class.border-surface-border]="selectedAddressId() !== addr.id"
                        (click)="selectedAddressId.set(addr.id)"
                      >
                        <span class="min-w-0">
                          <span class="mb-0.5 inline-block rounded-md bg-[#EEF3FF] px-1.5 py-0.5 text-[11px] font-semibold text-[#034DA2]">{{ addr.type }}</span>
                          <span class="block text-sm text-ink-900">{{ formatAddress(addr) }}</span>
                        </span>
                        @if (selectedAddressId() === addr.id) { <span class="shrink-0 text-brand-700">✓</span> }
                      </button>
                    }
                  </div>
                  <button
                    type="button"
                    class="mt-3 min-h-touch w-full rounded-xl border border-dashed border-[#0F5FDC] px-4 text-sm font-semibold text-[#0F5FDC]"
                    (click)="startAddAddress()"
                  >
                    + Add new address
                  </button>
                } @else {
                  <div class="rounded-2xl border border-surface-border p-4">
                    <p class="mb-2 text-sm font-medium text-ink-700">Address type</p>
                    <div class="mb-4 flex gap-2">
                      @for (t of addressTypes; track t) {
                        <button
                          type="button"
                          class="min-h-touch flex-1 rounded-xl border px-3 text-sm font-medium"
                          [class.border-brand-500]="naType() === t"
                          [class.bg-blue-50]="naType() === t"
                          [class.text-brand-700]="naType() === t"
                          [class.border-surface-border]="naType() !== t"
                          (click)="naType.set(t)"
                        >{{ t }}</button>
                      }
                    </div>
                    <div class="grid gap-3">
                      <div>
                        <label class="mb-1 block text-xs font-medium text-ink-700">Address line 1 <span class="text-danger-700">*</span></label>
                        <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="House / flat, building" [value]="naLine1()" (input)="naLine1.set($any($event.target).value)" />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-ink-700">Address line 2</label>
                        <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Area, street, sector" [value]="naLine2()" (input)="naLine2.set($any($event.target).value)" />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-ink-700">Landmark</label>
                        <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" placeholder="Nearby landmark (optional)" [value]="naLandmark()" (input)="naLandmark.set($any($event.target).value)" />
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="mb-1 block text-xs font-medium text-ink-700">City <span class="text-danger-700">*</span></label>
                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" [value]="naCity()" (input)="naCity.set($any($event.target).value)" />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs font-medium text-ink-700">State <span class="text-danger-700">*</span></label>
                          <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" [value]="naState()" (input)="naState.set($any($event.target).value)" />
                        </div>
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-ink-700">Pincode <span class="text-danger-700">*</span></label>
                        <input class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm outline-none focus:border-brand-500" inputmode="numeric" [value]="naPincode()" (input)="naPincode.set($any($event.target).value)" />
                      </div>
                    </div>
                    @if (addressError(); as err) {
                      <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700">{{ err }}</p>
                    }
                    <div class="mt-4 flex gap-3">
                      <button type="button" class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900" (click)="addingAddress.set(false)">Cancel</button>
                      <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white" (click)="saveNewAddress()">Save address</button>
                    </div>
                  </div>
                }
              }
              @case ('centre') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select centre</p>
                <p class="mb-3 text-xs text-ink-500">Must offer the required scans / package.</p>
                <div class="space-y-2">
                  @for (c of centres; track c) {
                    <button
                      type="button"
                      class="flex min-h-touch w-full items-center justify-between rounded-xl border px-4 text-sm"
                      [class.border-brand-500]="centre() === c"
                      [class.bg-blue-50]="centre() === c"
                      [class.border-surface-border]="centre() !== c"
                      (click)="centre.set(c)"
                    >
                      <span class="font-medium text-ink-900">{{ c }}</span>
                      @if (centre() === c) { <span class="text-brand-700">✓</span> }
                    </button>
                  }
                </div>
              }
              @case ('slot') {
                <p class="mb-2 text-sm font-medium text-ink-700">Select date and time</p>
                <div class="scrollbar-hide mb-3 flex gap-2 overflow-x-auto">
                  @for (d of slotDates; track d) {
                    <button
                      type="button"
                      class="min-h-touch shrink-0 rounded-full border px-4 text-sm"
                      [class.border-brand-500]="slotDate() === d"
                      [class.bg-blue-50]="slotDate() === d"
                      [class.border-surface-border]="slotDate() !== d"
                      (click)="slotDate.set(d)"
                    >{{ d }}</button>
                  }
                </div>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  @for (t of slotTimes; track t) {
                    <button
                      type="button"
                      class="min-h-touch rounded-xl border px-3 text-sm"
                      [class.border-brand-500]="slotTime() === t"
                      [class.bg-blue-50]="slotTime() === t"
                      [class.border-surface-border]="slotTime() !== t"
                      (click)="slotTime.set(t)"
                    >{{ t }}</button>
                  }
                </div>
                @if (activeLeg() === 'pathology') {
                  <p class="mt-3 text-xs text-ink-500">ⓘ Please fast for 10–12 hours before your collection.</p>
                }
              }
              @case ('review') {
                <p class="mb-3 text-sm font-medium text-ink-700">Review your booking</p>
                <dl class="space-y-2 text-sm">
                  @for (row of reviewRows(); track row.label) {
                    <div class="flex justify-between gap-3 border-b border-surface-border pb-2">
                      <dt class="text-ink-500">{{ row.label }}</dt>
                      <dd class="text-right font-medium text-ink-900">{{ row.value }}</dd>
                    </div>
                  }
                </dl>
                <p class="mt-3 rounded-xl bg-[#F3F7FF] px-3 py-2 text-xs text-ink-600">
                  Annual Health Check is a once-a-year benefit — checked against the yearly frequency
                  limit, not a money limit. Billing is done on confirmation.
                </p>
              }
            }

            @if (stepError(); as err) {
              <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{{ err }}</p>
            }
          </section>

          <div class="mt-5 flex gap-3">
            <button
              type="button"
              class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900 hover:border-[#A4BFFE7A]"
              (click)="back()"
            >
              Back
            </button>
            <button
              type="button"
              class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]"
              (click)="next()"
            >
              {{ currentStep() === 'review' ? 'Proceed to booking' : 'Continue' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class WellnessPage {
  protected readonly packageBooked = signal(false);
  protected readonly pathologyBooked = signal(false);
  protected readonly radiologyBooked = signal(false);
  protected readonly confirmation = signal<string | null>(null);

  protected readonly activeLeg = signal<Leg | null>(null);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly postalCode = signal('122001');
  protected readonly detected = signal<string | null>(null);
  protected readonly mode = signal<'home' | 'centre' | null>(null);
  protected readonly provider = signal('');
  protected readonly centre = signal('');
  protected readonly slotDate = signal('');
  protected readonly slotTime = signal('');

  // Address selection (static placeholder — no profile-addresses API).
  protected readonly savedAddresses = signal<SavedAddress[]>([...SEED_ADDRESSES]);
  protected readonly selectedAddressId = signal<string | null>(null);
  protected readonly addingAddress = signal(false);
  protected readonly addressError = signal<string | null>(null);
  protected readonly addressTypes: AddressType[] = ['Home', 'Work', 'Other'];
  protected readonly naType = signal<AddressType>('Home');
  protected readonly naLine1 = signal('');
  protected readonly naLine2 = signal('');
  protected readonly naLandmark = signal('');
  protected readonly naCity = signal('');
  protected readonly naState = signal('');
  protected readonly naPincode = signal('');
  protected readonly formatAddress = formatAddress;

  protected readonly centres = CENTRES;
  protected readonly slotDates = SLOT_DATES;
  protected readonly slotTimes = SLOT_TIMES;

  protected readonly fullyUsed = computed(
    () => this.packageBooked() || (this.pathologyBooked() && this.radiologyBooked()),
  );

  protected readonly providers = computed(() =>
    this.activeLeg() === 'pathology' ? PATHOLOGY_PROVIDERS : RADIOLOGY_PROVIDERS,
  );

  /** The steps for the active leg; pathology adds an address step for home collection. */
  protected readonly steps = computed<string[]>(() => {
    const leg = this.activeLeg();
    if (leg === 'pathology') {
      const s = ['postal', 'mode', 'provider'];
      if (this.mode() === 'home') s.push('address');
      s.push('slot', 'review');
      return s;
    }
    if (leg === 'radiology' || leg === 'package') return ['postal', 'provider', 'centre', 'slot', 'review'];
    return [];
  });

  protected readonly currentStep = computed(() => this.steps()[this.step()] ?? 'postal');

  protected legLabel(): string {
    switch (this.activeLeg()) {
      case 'pathology': return 'Book Pathology';
      case 'radiology': return 'Book Radiology';
      case 'package': return 'Book the entire package';
      default: return '';
    }
  }

  /** Grey-out rules from the spec. */
  protected canBook(leg: Leg): boolean {
    if (this.packageBooked()) return false; // package taken → everything closed
    if (leg === 'pathology') return !this.pathologyBooked();
    if (leg === 'radiology') return this.pathologyBooked() && !this.radiologyBooked();
    // package: only if the individual route has not started
    return !this.pathologyBooked() && !this.radiologyBooked();
  }

  protected startLeg(leg: Leg): void {
    if (!this.canBook(leg)) return;
    this.activeLeg.set(leg);
    this.step.set(0);
    this.stepError.set(null);
    this.confirmation.set(null);
    this.mode.set(null);
    this.provider.set('');
    this.centre.set('');
    this.slotDate.set('');
    this.slotTime.set('');
    this.selectedAddressId.set(null);
    this.addingAddress.set(false);
    this.addressError.set(null);
  }

  /** Placeholder geolocation — fills a detected postal code, no API. */
  protected detectLocation(): void {
    this.postalCode.set('122018');
    this.detected.set('Gurugram, Haryana 122018');
  }

  protected startAddAddress(): void {
    this.addressError.set(null);
    this.naType.set('Home');
    this.naLine1.set('');
    this.naLine2.set('');
    this.naLandmark.set('');
    this.naCity.set('');
    this.naState.set('');
    this.naPincode.set('');
    this.addingAddress.set(true);
  }

  protected saveNewAddress(): void {
    if (!this.naLine1().trim()) return this.addressError.set('Enter address line 1.');
    if (!this.naCity().trim()) return this.addressError.set('Enter the city.');
    if (!this.naState().trim()) return this.addressError.set('Enter the state.');
    if (!/^\d{6}$/.test(this.naPincode().trim())) return this.addressError.set('Enter a valid 6-digit pincode.');
    const id = 'a' + (this.savedAddresses().length + 1);
    const addr: SavedAddress = {
      id,
      type: this.naType(),
      line1: this.naLine1().trim(),
      line2: this.naLine2().trim(),
      landmark: this.naLandmark().trim(),
      city: this.naCity().trim(),
      state: this.naState().trim(),
      pincode: this.naPincode().trim(),
    };
    this.savedAddresses.set([...this.savedAddresses(), addr]);
    this.selectedAddressId.set(id);
    this.addingAddress.set(false);
    this.addressError.set(null);
  }

  private selectedAddress(): SavedAddress | undefined {
    return this.savedAddresses().find((a) => a.id === this.selectedAddressId());
  }

  protected reviewRows(): { label: string; value: string }[] {
    const rows = [
      { label: 'Booking', value: this.legLabel() },
      { label: 'Postal code', value: this.postalCode() },
    ];
    if (this.activeLeg() === 'pathology') {
      rows.push({ label: 'Mode', value: this.mode() === 'home' ? 'Home collection' : 'Centre visit' });
    }
    rows.push({ label: 'Provider', value: this.provider() });
    if (this.centre()) rows.push({ label: 'Centre', value: this.centre() });
    const addr = this.selectedAddress();
    if (this.mode() === 'home' && addr) rows.push({ label: 'Address', value: `${addr.type} · ${formatAddress(addr)}` });
    rows.push({ label: 'Slot', value: `${this.slotDate()} · ${this.slotTime()}` });
    return rows;
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'postal': return this.postalCode().trim() ? null : 'Enter your postal code.';
      case 'mode': return this.mode() ? null : 'Choose a mode of collection.';
      case 'provider': return this.provider() ? null : 'Select a provider.';
      case 'centre': return this.centre() ? null : 'Select a centre.';
      case 'address':
        if (this.addingAddress()) return 'Save or cancel the new address first.';
        return this.selectedAddressId() ? null : 'Select a collection address.';
      case 'slot': return this.slotDate() && this.slotTime() ? null : 'Pick a date and time.';
      default: return null;
    }
  }

  protected next(): void {
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);
    if (this.currentStep() === 'review') { this.confirm(); return; }
    this.step.set(this.step() + 1);
  }

  protected back(): void {
    this.stepError.set(null);
    if (this.step() === 0) { this.activeLeg.set(null); return; }
    this.step.set(this.step() - 1);
  }

  protected headerBack(): void {
    if (this.activeLeg()) { this.back(); return; }
    history.back();
  }

  private confirm(): void {
    const leg = this.activeLeg();
    if (leg === 'pathology') {
      this.pathologyBooked.set(true);
      this.confirmation.set('Pathology booked and billed. You can now book the radiology leg.');
    } else if (leg === 'radiology') {
      this.radiologyBooked.set(true);
      this.confirmation.set('Radiology booked and confirmed. Your annual health check is complete.');
    } else if (leg === 'package') {
      this.packageBooked.set(true);
      this.confirmation.set('Package booked and billed — pathology and radiology are both confirmed.');
    }
    this.activeLeg.set(null);
    this.step.set(0);
  }

  protected reset(): void {
    this.packageBooked.set(false);
    this.pathologyBooked.set(false);
    this.radiologyBooked.set(false);
    this.confirmation.set(null);
    this.activeLeg.set(null);
    this.step.set(0);
  }
}
