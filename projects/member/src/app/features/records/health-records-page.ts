import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { PrescriptionSource } from '../../core/records/prescription.model';
import { RecordsStore } from '../../core/records/records.store';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const FILTERS: readonly { key: PrescriptionSource | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: PrescriptionSource.Digital, label: 'Doctor issued' },
  { key: PrescriptionSource.Uploaded, label: 'Uploaded' },
];

@Component({
  selector: 'opd-health-records-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingView, ErrorView, EmptyView, BackLink, PageHeader],
  template: `
    <opd-page-header title="Health Records" subtitle="Prescriptions from your consultations" />

    <div class="mx-auto w-full max-w-[480px] px-5 pb-5 pt-6 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <div class="hidden lg:block">
        <opd-back-link />
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Health Records</h1>
        <p class="mt-0.5 text-sm text-ink-500">Prescriptions from your consultations</p>
      </div>

      @if (store.loading()) {
        <opd-loading label="Loading records" />
      } @else if (store.error(); as error) {
        <opd-error [error]="error" (retry)="store.retry()" />
      } @else {
        @if (store.partial().length) {
          <p class="mt-4 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-700" role="status">
            Could not load {{ store.partial().join(' and ') }}. Everything else is shown below.
          </p>
        }

        <div class="scrollbar-hide mt-5 flex gap-2 overflow-x-auto pb-1">
          @for (filter of filters; track filter.key) {
            <button
              type="button"
              class="min-h-touch shrink-0 rounded-full border px-4 text-sm font-medium transition-colors"
              [class]="
                store.filter() === filter.key
                  ? 'border-[#034DA2] bg-[#034DA2] text-white'
                  : 'border-[#E5E7EB] bg-white text-ink-700 hover:border-[#A4BFFE7A]'
              "
              [attr.aria-pressed]="store.filter() === filter.key"
              (click)="store.setFilter(filter.key)"
            >
              {{ filter.label }} ({{ count(filter.key) }})
            </button>
          }
        </div>

        @if (store.records().length) {
          <ul class="mt-5 space-y-3">
            @for (record of store.records(); track record.id) {
              <li
                class="rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white p-4"
                style="box-shadow: 0 1px 8px 0 rgba(3,77,162,.24)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-[#034DA2]"
                        >{{ record.sourceLabel }}</span
                      >
                      @if (record.isEmergency) {
                        <span
                          class="rounded-md bg-danger-50 px-1.5 py-0.5 text-xs font-medium text-danger-700"
                          >Emergency</span
                        >
                      }
                      <span class="truncate text-xs text-ink-500">{{ record.reference }}</span>
                    </div>

                    <p class="mt-1 truncate text-base font-semibold text-[#034DA2]">
                      {{ record.doctorName }}
                    </p>
                    @if (record.doctorSpecialty) {
                      <p class="text-sm text-ink-700">{{ record.doctorSpecialty }}</p>
                    }
                    <p class="mt-1 text-xs text-ink-500">
                      {{ date(record.issuedAt) }} · {{ record.patientName }}
                    </p>
                  </div>

                  @if (record.hasDownload && record.downloadPath) {
                    <a
                      [href]="downloadUrl(record.downloadPath)"
                      target="_blank"
                      rel="noopener"
                      class="min-h-touch shrink-0 rounded-xl border border-surface-border px-3 py-2 text-sm font-medium text-brand-700 hover:border-[#A4BFFE7A]"
                      >Download</a
                    >
                  }
                </div>

                @if (record.diagnosis || record.chiefComplaint) {
                  <dl class="mt-3 space-y-1 border-t border-surface-border pt-3 text-sm">
                    @if (record.chiefComplaint) {
                      <div class="flex gap-2">
                        <dt class="shrink-0 text-ink-500">Complaint</dt>
                        <dd class="text-ink-900">{{ record.chiefComplaint }}</dd>
                      </div>
                    }
                    @if (record.diagnosis) {
                      <div class="flex gap-2">
                        <dt class="shrink-0 text-ink-500">Diagnosis</dt>
                        <dd class="font-medium text-ink-900">{{ record.diagnosis }}</dd>
                      </div>
                    }
                  </dl>
                }

                @if (record.medicines.length) {
                  <div class="mt-3 border-t border-surface-border pt-3">
                    <button
                      type="button"
                      class="text-sm font-medium text-[#034DA2] hover:underline"
                      [attr.aria-expanded]="isOpen(record.id)"
                      (click)="toggle(record.id)"
                    >
                      {{ isOpen(record.id) ? 'Hide' : 'Show' }}
                      {{ record.medicines.length }} medicine{{
                        record.medicines.length === 1 ? '' : 's'
                      }}
                    </button>

                    @if (isOpen(record.id)) {
                      <ul class="mt-2 space-y-2">
                        @for (medicine of record.medicines; track medicine.name) {
                          <li class="rounded-xl bg-surface-alt p-3">
                            <p class="text-sm font-medium text-ink-900">{{ medicine.name }}</p>
                            <p class="mt-0.5 text-xs text-ink-700">{{ medicine.schedule }}</p>
                            @if (medicine.instructions) {
                              <p class="mt-0.5 text-xs text-ink-500">{{ medicine.instructions }}</p>
                            }
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }

                @if (record.followUpDate) {
                  <p class="mt-3 rounded-lg bg-blue-50 px-2 py-1 text-xs text-[#034DA2]">
                    Follow up on {{ date(record.followUpDate) }}
                  </p>
                }
              </li>
            }
          </ul>
        } @else {
          <opd-empty
            title="No records yet"
            detail="Prescriptions from your consultations will appear here."
          />
        }
      }
    </div>
  `,
})
export class HealthRecordsPage {
  protected readonly store = inject(RecordsStore);
  protected readonly filters = FILTERS;

  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  protected count(key: PrescriptionSource | 'ALL'): number {
    return this.store.counts()[key] ?? 0;
  }

  protected date(value: Date | null): string {
    return value ? DATE.format(value) : 'Date not recorded';
  }

  protected isOpen(id: string): boolean {
    return this.expanded().has(id);
  }

  protected toggle(id: string): void {
    const next = new Set(this.expanded());
    if (!next.delete(id)) next.add(id);
    this.expanded.set(next);
  }

  /**
   * Downloads go straight to the API through the dev proxy, so the session
   * cookie travels and the browser handles the PDF itself.
   */
  protected downloadUrl(path: string): string {
    // Same base the interceptor uses, so the two cannot drift apart.
    return `${environment.apiBaseUrl}/${path}`;
  }
}
