import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { DiagnosticReport, DiagnosticReportsStore } from '../../core/records/diagnostic-reports.store';
import { PrescriptionSource } from '../../core/records/prescription.model';
import { RecordsStore } from '../../core/records/records.store';
import { UserInfoStore } from '../../core/session/userinfo.store';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/state-views';
import { BackLink } from '../../shared/ui/back-link';
import { PageHeader } from '../../shared/ui/page-header';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const FILTERS: readonly { key: PrescriptionSource | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: PrescriptionSource.Digital, label: 'Doctor issued' },
  { key: PrescriptionSource.Uploaded, label: 'Uploaded' },
  { key: PrescriptionSource.Diagnostic, label: 'Diagnostic' },
  { key: PrescriptionSource.Diagnostic, label: 'My Bills' },
];

type RecordsTab =
  | 'prescription'
  | 'diagnostic'
  | 'vitals'
  | 'assessment'
  | 'trends'
  | 'vaccination'
  | 'uploads'
  | 'bills'
  | 'others';

const TABS: readonly { key: RecordsTab; label: string }[] = [
  { key: 'prescription', label: 'Prescription' },
  { key: 'diagnostic', label: 'Diagnostic' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'trends', label: 'Trend Reports' },
  { key: 'vaccination', label: 'Vaccination' },
  { key: 'uploads', label: 'Upload Documents' },
  { key: 'bills', label: 'My Bills' },
  { key: 'others', label: 'Others' },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

/** "11/07/2026 05:00 am"; the time is left off when the row carries none (midnight). */
function formatReportDate(value: Date | null): string {
  if (!value) return 'Date not recorded';
  const day = value.toLocaleDateString('en-GB');
  if (!value.getHours() && !value.getMinutes()) return day;
  return `${day} ${value.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
}

@Component({
  selector: 'opd-health-records-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingView, ErrorView, EmptyView, BackLink, PageHeader],
  template: `
    <opd-page-header title="Health Records" subtitle="Your prescriptions and reports" />

    <div class="mx-auto w-full max-w-[480px] px-5 pb-5 pt-6 lg:max-w-[1240px] lg:px-8 lg:py-6">
      <div class="hidden lg:block">
        <opd-back-link />
        <h1 class="text-2xl font-bold text-black lg:text-3xl">Health Records</h1>
        <p class="mt-0.5 text-sm text-ink-500">Your prescriptions and reports</p>
      </div>

      <!-- Record type tabs -->
      <div class="scrollbar-hide mt-5 flex overflow-x-auto rounded-lg bg-[#F0F0F0]" role="tablist" aria-label="Record type">
        @for (t of tabs; track t.key) {
          <button
            type="button"
            role="tab"
            class="min-h-touch flex-1 shrink-0 whitespace-nowrap px-5 text-sm transition-colors"
            [class]="tab() === t.key ? 'bg-[#034DA2] font-medium text-white' : 'text-ink-700 hover:bg-[#E4E4E4]'"
            [attr.aria-selected]="tab() === t.key"
            (click)="tab.set(t.key)"
          >
            {{ t.label }}
          </button>
        }
      </div>

      @switch (tab()) {
        @case ('diagnostic') {
          <!-- ── Diagnostic: report list + viewer ─────────────────────────── -->
          <div class="mt-4 flex justify-end">
            @if (reports.document(); as doc) {
              <a
                class="flex min-h-[40px] items-center gap-2 rounded-full bg-[#F0F0F0] px-4 text-sm font-medium text-ink-900 hover:bg-[#E4E4E4]"
                [href]="doc.url"
                [attr.download]="doc.fileName"
              >
                Download <span aria-hidden="true">⬇</span>
              </a>
            } @else {
              <button
                type="button"
                class="flex min-h-[40px] items-center gap-2 rounded-full bg-[#F0F0F0] px-4 text-sm font-medium text-ink-400"
                disabled
              >
                Download <span aria-hidden="true">⬇</span>
              </button>
            }
          </div>

          @if (reports.loading()) {
            <opd-loading label="Loading reports" />
          } @else if (reports.error(); as error) {
            <opd-error [error]="error" (retry)="reports.load(reports.page())" />
          } @else if (!reports.reports().length) {
            <opd-empty title="No diagnostic reports yet" detail="Reports from your lab tests and scans will appear here." />
          } @else {
            <div class="mt-3 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,11fr)]">
              <!-- List -->
              <div>
                <ul class="space-y-2" aria-label="Diagnostic reports">
                  @for (r of reports.reports(); track r.id) {
                    <li>
                      <button
                        type="button"
                        class="flex w-full items-center gap-4 rounded-md bg-white px-4 py-3 text-left"
                        style="box-shadow: 0 1px 6px 0 rgba(0,0,0,.08)"
                        [class.border-2]="isSelected(r)"
                        [class.border-[#6B6B6B]]="isSelected(r)"
                        [attr.aria-current]="isSelected(r) ? 'true' : null"
                        (click)="openReport(r)"
                      >
                        <svg viewBox="0 0 24 24" class="h-8 w-8 shrink-0 text-ink-400" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">
                          <path d="M6 2.75h8.5L19.25 7.5v13.75H6z" stroke-linejoin="round" />
                          <path d="M14.5 2.75V7.5h4.75M9 11h7M9 14h7M9 17h7" stroke-linecap="round" />
                        </svg>
                        <span class="min-w-0 flex-1">
                          @if (r.providerName) {
                            <span class="inline-block max-w-full truncate rounded-full bg-[#E8EEFB] px-2.5 py-0.5 text-[11px] text-ink-700">{{ r.providerName }}</span>
                          }
                          <span class="mt-1 block truncate text-sm font-semibold text-ink-900">{{ r.title }}</span>
                          <span class="mt-0.5 block text-xs text-ink-500">{{ reportDate(r.reportedAt) }}</span>
                        </span>
                        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EDE3F3]" aria-hidden="true">
                          <img src="images/icons/home/benefit-pathology.svg" alt="" class="h-6 w-6" />
                        </span>
                      </button>
                    </li>
                  }
                </ul>

                @if (reports.pageCount() > 1) {
                  <nav class="mt-5 flex items-center justify-center gap-2" aria-label="Report pages">
                    <button type="button" class="pager" [disabled]="reports.page() === 0" aria-label="First page" (click)="reports.goToPage(0)">«</button>
                    <button type="button" class="pager" [disabled]="reports.page() === 0" aria-label="Previous page" (click)="reports.goToPage(reports.page() - 1)">‹</button>
                    @for (p of pageNumbers(); track p) {
                      <button
                        type="button"
                        class="pager"
                        [class.pager-current]="p === reports.page()"
                        [attr.aria-current]="p === reports.page() ? 'page' : null"
                        (click)="reports.goToPage(p)"
                      >{{ p + 1 }}</button>
                    }
                    <button type="button" class="pager" [disabled]="reports.page() >= reports.pageCount() - 1" aria-label="Next page" (click)="reports.goToPage(reports.page() + 1)">›</button>
                    <button type="button" class="pager" [disabled]="reports.page() >= reports.pageCount() - 1" aria-label="Last page" (click)="reports.goToPage(reports.pageCount() - 1)">»</button>
                  </nav>
                }
              </div>

              <!-- Viewer -->
              <div #viewer class="relative h-[60vh] min-h-[420px] overflow-hidden border border-surface-border bg-white lg:h-[78vh]">
                <div class="absolute inset-0 overflow-auto bg-[#D1D1D1] lg:inset-x-6">
                  @if (reports.documentLoading()) {
                    <p class="flex h-full items-center justify-center text-sm text-ink-700">Loading report…</p>
                  } @else if (reports.documentError(); as err) {
                    <div class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                      <p class="text-sm text-ink-700" role="alert">{{ err }}</p>
                      <button type="button" class="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#034DA2]" (click)="reports.retryDocument()">Try again</button>
                    </div>
                  } @else if (reports.document(); as doc) {
                    <div
                      class="h-full w-full origin-top transition-transform duration-200"
                      [style.transform]="'scale(' + zoom() + ') rotate(' + rotation() + 'deg)'"
                    >
                      @if (doc.kind === 'pdf') {
                        <iframe class="h-full w-full border-0" [src]="pdfSrc()" [title]="reports.selected()?.title ?? 'Report'"></iframe>
                      } @else {
                        <img class="mx-auto block max-h-full max-w-full object-contain" [src]="doc.url" [alt]="reports.selected()?.title ?? 'Report'" />
                      }
                    </div>
                  } @else {
                    <p class="flex h-full items-center justify-center text-sm text-ink-700">Select a report to view it.</p>
                  }
                </div>

                <!-- Viewer controls -->
                <div class="absolute right-3 top-4 flex flex-col gap-3 lg:right-10">
                  <button type="button" class="viewer-btn" aria-label="Full screen" (click)="fullscreen()">⤢</button>
                  @if (reports.document(); as doc) {
                    <a class="viewer-btn" aria-label="Download" [href]="doc.url" [attr.download]="doc.fileName">⤓</a>
                  }
                  <button type="button" class="viewer-btn" aria-label="Rotate left" [disabled]="!reports.document()" (click)="rotate(-90)">↺</button>
                  <button type="button" class="viewer-btn" aria-label="Rotate right" [disabled]="!reports.document()" (click)="rotate(90)">↻</button>
                  <button type="button" class="viewer-btn" aria-label="Zoom out" [disabled]="!reports.document() || zoom() <= minZoom" (click)="zoomBy(-zoomStep)">−</button>
                  <button type="button" class="viewer-btn" aria-label="Zoom in" [disabled]="!reports.document() || zoom() >= maxZoom" (click)="zoomBy(zoomStep)">+</button>
                </div>
              </div>
            </div>
          }
        }

        @case ('prescription') {
          <!-- ── Prescription: the existing list ──────────────────────────── -->
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
        }

        @default {
          <opd-empty title="Coming soon" detail="These records are not available here yet." />
        }
      }
    </div>
  `,
  styles: `
    .pager {
      display: flex;
      height: 2rem;
      min-width: 2rem;
      align-items: center;
      justify-content: center;
      border-radius: 0.25rem;
      border: 1.5px solid #034da2;
      padding: 0 0.5rem;
      font-size: 0.9rem;
      color: #034da2;
      background: #fff;
    }
    .pager:disabled {
      border-color: #e5e7eb;
      color: #c5cad3;
      background: #f7f7f9;
    }
    .pager-current {
      background: #034da2;
      color: #fff;
    }
    .viewer-btn {
      display: flex;
      height: 2.5rem;
      width: 2.5rem;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      border: 1px solid #c5cad3;
      background: #fff;
      font-size: 1rem;
      color: #303030;
    }
    .viewer-btn:disabled {
      opacity: 0.5;
    }
  `,
})
export class HealthRecordsPage {
  protected readonly store = inject(RecordsStore);
  protected readonly reports = inject(DiagnosticReportsStore);
  private readonly userStore = inject(UserInfoStore);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly filters = FILTERS;
  protected readonly tabs = TABS;

  protected readonly tab = signal<RecordsTab>('diagnostic');

  // Viewer state; reset whenever another report is opened.
  protected readonly zoom = signal(1);
  protected readonly rotation = signal(0);
  protected readonly minZoom = MIN_ZOOM;
  protected readonly maxZoom = MAX_ZOOM;
  protected readonly zoomStep = ZOOM_STEP;
  private readonly viewer = viewChild<ElementRef<HTMLElement>>('viewer');

  /** The browser's own PDF viewer, without its toolbar — the controls are ours. */
  protected readonly pdfSrc = computed(() => {
    const doc = this.reports.document();
    return doc ? this.sanitizer.bypassSecurityTrustResourceUrl(doc.url + '#toolbar=0&navpanes=0') : null;
  });

  /** Up to five page numbers around the current one (zero-based). */
  protected readonly pageNumbers = computed(() => {
    const count = this.reports.pageCount();
    const start = Math.max(0, Math.min(this.reports.page() - 2, count - 5));
    return Array.from({ length: Math.min(5, count) }, (_, i) => start + i);
  });

  private readonly expanded = signal<ReadonlySet<string>>(new Set());
  private loadedFor: string | null = null;

  constructor() {
    // The list loads once the member's UHID is known and the Diagnostic tab is open.
    effect(() => {
      const uhid = this.userStore.userInfo()?.[0]?.user_roles?.[0]?.uhid;
      if (this.tab() !== 'diagnostic' || !uhid || this.loadedFor === uhid) return;
      this.loadedFor = uhid;
      untracked(() => void this.reports.load(0));
    });
    // A newly opened report starts upright and unzoomed.
    effect(() => {
      this.reports.document();
      untracked(() => {
        this.zoom.set(1);
        this.rotation.set(0);
      });
    });
  }

  protected isSelected(report: DiagnosticReport): boolean {
    return this.reports.selected()?.id === report.id;
  }

  protected openReport(report: DiagnosticReport): void {
    void this.reports.select(report);
  }

  protected reportDate(value: Date | null): string {
    return formatReportDate(value);
  }

  protected zoomBy(step: number): void {
    this.zoom.set(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom() + step)));
  }

  protected rotate(degrees: number): void {
    this.rotation.set((this.rotation() + degrees) % 360);
  }

  protected fullscreen(): void {
    const el = this.viewer()?.nativeElement;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }

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
