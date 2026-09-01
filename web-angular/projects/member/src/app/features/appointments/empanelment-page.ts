import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const STORAGE_KEY = 'opd.member.empanelment-requests.v1';

interface EmpanelmentRequest {
  readonly doctorName: string;
  readonly clinicName: string;
  readonly specialty: string;
  readonly submittedAt: string;
}

/**
 * The side journey off the doctor list: "my doctor is not here".
 *
 * Requests are held on this device. There is no empanelment queue behind this —
 * nothing in the API accepts one — so the status shown is Submitted and never
 * advances. Said plainly on the screen rather than implying a review is under
 * way, because a fake "under review" is a promise the platform cannot keep.
 */
@Component({
  selector: 'opd-empanelment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/appointments"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Suggest a doctor
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Ask us to add your doctor to the network
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
          <label for="doctorName" class="mb-1 block text-sm font-medium text-ink-700"
            >Doctor's name</label
          >
          <input
            id="doctorName"
            type="text"
            class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
            [value]="doctorName()"
            (input)="doctorName.set($any($event.target).value)"
          />

          <label for="clinicName" class="mb-1 mt-4 block text-sm font-medium text-ink-700"
            >Clinic or hospital</label
          >
          <input
            id="clinicName"
            type="text"
            class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
            [value]="clinicName()"
            (input)="clinicName.set($any($event.target).value)"
          />

          <label for="specialty" class="mb-1 mt-4 block text-sm font-medium text-ink-700"
            >Speciality</label
          >
          <input
            id="specialty"
            type="text"
            class="min-h-touch w-full rounded-xl border border-surface-border px-3 text-sm"
            [value]="specialty()"
            (input)="specialty.set($any($event.target).value)"
          />

          @if (problem(); as message) {
            <p class="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
              {{ message }}
            </p>
          }

          <button
            type="button"
            class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#034DA2]"
            (click)="submit()"
          >
            Submit request
          </button>
          <p class="mt-2 text-center text-xs text-ink-500">
            Requests are kept on this device. There is no empanelment queue behind this yet.
          </p>
        </section>

        @if (requests().length) {
          <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Your requests</h2>
            <ul class="mt-3 space-y-3">
              @for (request of requests(); track request.submittedAt) {
                <li class="flex items-start justify-between gap-3 border-t border-surface-border pt-3 first:border-0 first:pt-0">
                  <div class="min-w-0">
                    <p class="font-medium text-ink-900">{{ request.doctorName }}</p>
                    <p class="text-sm text-ink-700">
                      {{ request.specialty }} — {{ request.clinicName }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#034DA2]"
                    >Submitted</span
                  >
                </li>
              }
            </ul>
          </section>
        }
      </div>
    </div>
  `,
})
export class EmpanelmentPage {
  protected readonly doctorName = signal('');
  protected readonly clinicName = signal('');
  protected readonly specialty = signal('');
  protected readonly problem = signal<string | null>(null);

  private readonly _requests = signal<readonly EmpanelmentRequest[]>(read());
  protected readonly requests = computed(() => this._requests());

  protected submit(): void {
    const doctorName = this.doctorName().trim();
    const clinicName = this.clinicName().trim();
    const specialty = this.specialty().trim();
    if (!doctorName || !clinicName || !specialty) {
      this.problem.set('Tell us the doctor, the clinic and the speciality.');
      return;
    }
    this.problem.set(null);
    const next = [
      { doctorName, clinicName, specialty, submittedAt: new Date().toISOString() },
      ...this._requests(),
    ];
    this._requests.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keeping the request on screen matters more than persisting it.
    }
    this.doctorName.set('');
    this.clinicName.set('');
    this.specialty.set('');
  }
}

function read(): readonly EmpanelmentRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as EmpanelmentRequest[]) : [];
  } catch {
    return [];
  }
}
