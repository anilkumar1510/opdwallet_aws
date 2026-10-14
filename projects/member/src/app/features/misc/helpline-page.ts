import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ClaimsStore } from '../../core/claims/claims.store';
import { DisputeApi } from '../../core/disputes/dispute.api';

import {
  ClosedBy,
  DEMO_EXECUTIVE,
  RAISE_WINDOW_MONTHS,
  SEED_ORDERS,
  SEED_TICKETS,
  SUPPORT_PHONE,
  ServiceLine,
  SupportOrder,
  SupportTicket,
  TicketMessage,
  addMonths,
  raiseCutoff,
  reasonsFor,
} from '../support/grievance.data';

/**
 * Support, at `/member/helpline` — the grievance redressal journey, member side.
 *
 * DUMMY / STATIC — there is no support-ticket API yet, so orders, tickets and
 * the grievance configuration come from features/support/grievance.data.ts and
 * nothing is saved. Support's side (respond / resolve and close) is simulated
 * from the ticket screen; the admin queue, assignment and configuration live in
 * the operations portal.
 *
 * Routes in: claims that need help (fast path straight to a reason), every
 * service used (browse → order detail → raise), and something else (no ticket,
 * contact details). A raise checks the raise window and any open ticket on the
 * order; a ticket can be replied to, marked resolved (final), or reopened inside
 * the reopen window; a closed ticket offers the support phone line.
 */

type View = 'home' | 'order' | 'raise' | 'ticket';
type GrievanceStatus = 'none' | 'open' | 'response' | 'closed';

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const SUPPORT_EMAIL = 'support@opdwallet.com';
const NUMBER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

const STATUS_LABEL: Record<GrievanceStatus, string> = {
  none: 'Ask for help',
  open: 'Ticket open',
  response: 'Response received',
  closed: 'Ticket closed',
};
const STATUS_CLASS: Record<GrievanceStatus, string> = {
  none: 'bg-[#EEF3FF] text-[#0F5FDC]',
  open: 'bg-warning-50 text-warning-700',
  response: 'bg-[#F0FDF4] text-success-700',
  closed: 'bg-[#F2F4F8] text-ink-500',
};

@Component({
  selector: 'opd-helpline-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none">
        <div class="mx-auto flex max-w-[900px] items-center gap-4 px-5 py-5 lg:px-8">
          @if (view() === 'home') {
            <a routerLink="/member" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back to home">&larr;</a>
          } @else {
            <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50" aria-label="Back" (click)="back()">&larr;</button>
          }
          <div class="min-w-0">
            <h1 class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]">{{ heading() }}</h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">{{ subheading() }}</p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[900px] px-5 pb-32 pt-6 lg:px-8 lg:pb-12">
        @if (notice(); as n) {
          <p class="mb-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-success-700" role="status">{{ n }}</p>
        }

        @switch (view()) {
          @case ('home') {
            <!-- ── Support home: three routes in ─────────────────────────────── -->
            <!-- 1 · Claims that need your help (fast path) -->
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
              <h2 class="text-base font-semibold text-[#0E51A2]">Claims that need your help</h2>
              <p class="mt-0.5 text-xs text-ink-500">Claims waiting on you. Ask for help and go straight to the reason.</p>
              @if (claimsLoading()) {
                <p class="mt-4 text-sm text-ink-500">Loading your claims…</p>
              } @else if (flaggedClaims().length) {
                <ul class="mt-3 divide-y divide-[#EDF0F7]">
                  @for (o of shownClaims(); track o.id) {
                    <li>
                      <ng-container *ngTemplateOutlet="row; context: { $implicit: o, fast: true }" />
                    </li>
                  }
                </ul>
                @if (flaggedClaims().length > claimsShown()) {
                  <button type="button" class="mt-3 min-h-touch w-full rounded-xl border border-surface-border bg-white text-sm font-medium text-brand-700" (click)="claimsShown.set(claimsShown() + pageSize)">Load more</button>
                }
              } @else {
                <p class="mt-4 rounded-xl bg-[#F2F4F8] px-4 py-3 text-sm text-ink-500">No claim needs your attention right now.</p>
              }
            </section>

            <!-- 2 · Services you have used (browse path) -->
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
              <h2 class="text-base font-semibold text-[#0E51A2]">Services you have used</h2>
              <p class="mt-0.5 text-xs text-ink-500">Every consultation, order, procedure and claim — newest first. Pick one to see its detail and raise a grievance.</p>
              <!-- Service buckets. None picked shows everything; tap again to clear. -->
              <div class="scrollbar-hide -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
                @for (b of buckets(); track b) {
                  <button type="button" class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium" [class.border-[#0F5FDC]]="bucket() === b" [class.bg-[#0F5FDC]]="bucket() === b" [class.text-white]="bucket() === b" [class.border-surface-border]="bucket() !== b" [class.bg-white]="bucket() !== b" [class.text-ink-700]="bucket() !== b" [attr.aria-pressed]="bucket() === b" (click)="pickBucket(b)">{{ b }}</button>
                }
              </div>
              <ul class="mt-3 divide-y divide-[#EDF0F7]">
                @for (o of shownOrders(); track o.id) {
                  <li>
                    <ng-container *ngTemplateOutlet="row; context: { $implicit: o, fast: false }" />
                  </li>
                }
              </ul>
              @if (visibleOrders().length > ordersShown()) {
                <button type="button" class="mt-3 min-h-touch w-full rounded-xl border border-surface-border bg-white text-sm font-medium text-brand-700" (click)="ordersShown.set(ordersShown() + pageSize)">Load more</button>
              }
            </section>

            <!-- 3 · Something else (no ticket) -->
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 text-center shadow-sm">
              <h2 class="text-base font-semibold text-[#0E51A2]">Something else?</h2>
              <p class="mx-auto mt-1 max-w-md text-sm text-ink-700">For anything not linked to an order or claim, call or write to us. This doesn't open a ticket.</p>
              <div class="mt-3 flex flex-wrap justify-center gap-3">
                <a [href]="'tel:' + phone" class="rounded-xl border border-[#0F5FDC] px-4 py-2 text-sm font-semibold text-[#0F5FDC]" (click)="onCall($event)">📞 {{ phone }}</a>
                <a [href]="mailHref()" class="rounded-xl border border-surface-border px-4 py-2 text-sm font-semibold text-ink-900" (click)="onMail()">✉ {{ email }}</a>
              </div>
              @if (contactNote(); as c) {
                <p class="mt-3 text-xs text-success-700" role="status">{{ c }}</p>
              }
            </section>
          }

          @case ('order') {
            <!-- ── Order detail ───────────────────────────────────────────────── -->
            @if (order(); as o) {
              <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs text-ink-500">Order ID</p>
                    <p class="text-base font-semibold text-ink-900">{{ o.id }}</p>
                  </div>
                  <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="statusClass(o)">{{ statusLabel(o) }}</span>
                </div>
                <dl class="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <div><dt class="text-xs text-ink-500">Service type</dt><dd class="font-medium text-ink-900">{{ o.service }}</dd></div>
                  <div><dt class="text-xs text-ink-500">Order type</dt><dd class="font-medium text-ink-900">{{ o.type }}</dd></div>
                  <div><dt class="text-xs text-ink-500">Provider</dt><dd class="font-medium text-ink-900">{{ o.provider }}</dd></div>
                  <div><dt class="text-xs text-ink-500">Date and time</dt><dd class="font-medium text-ink-900">{{ dateTime(o.placedAt) }}</dd></div>
                  <div><dt class="text-xs text-ink-500">Status</dt><dd class="font-medium text-ink-900">{{ o.progress }}{{ o.claimFlag ? ' · ' + o.claimFlag : '' }}</dd></div>
                </dl>
              </section>

              <!-- Claims are reimbursements: the payment breakdown does not apply. -->
              @if (o.type !== 'Reimbursement') {
              <section class="mt-4 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <div class="mb-3 flex items-center justify-between">
                  <h2 class="text-sm font-semibold text-ink-900">Amount</h2>
                  <button type="button" class="text-sm font-medium text-[#0F5FDC] underline" (click)="invoiceOpen.set(true)">View invoice</button>
                </div>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-700">Gross amount</dt><dd class="text-ink-900">₹{{ n(o.gross) }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Discount</dt><dd class="text-success-700">− ₹{{ n(o.discount) }}</dd></div>
                  <div class="flex justify-between border-t border-surface-border pt-2"><dt class="font-medium text-ink-900">Net amount</dt><dd class="font-medium text-ink-900">₹{{ n(o.gross - o.discount) }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Paid via wallet</dt><dd class="text-ink-900">₹{{ n(o.paidByWallet) }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-700">Paid by you</dt><dd class="text-ink-900">₹{{ n(o.paidByMember) }}</dd></div>
                </dl>
              </section>
              }

              <!-- The browse path rejoins the fast path here. -->
              <section class="mt-4 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                @switch (orderAction(o)) {
                  @case ('raise') {
                    <p class="text-sm text-ink-700">Something wrong with this {{ o.type === 'Reimbursement' ? 'claim' : 'order' }}? Raise it with our support team.</p>
                    <p class="mt-1 text-xs text-ink-500">You can raise a grievance until {{ date(cutoff(o)) }} ({{ raiseMonths }} months from the order date).</p>
                    <button type="button" class="mt-3 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="startRaise(o)">Raise a grievance</button>
                  }
                  @case ('view') {
                    <p class="text-sm text-ink-700">You already have a ticket on this {{ o.type === 'Reimbursement' ? 'claim' : 'order' }} — {{ ticketFor(o)?.id }}.</p>
                    <button type="button" class="mt-3 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="openTicketFor(o)">View ticket</button>
                  }
                  @case ('expired') {
                    <p class="rounded-xl bg-[#F2F4F8] px-4 py-3 text-sm text-ink-700" role="status">
                      A grievance can be raised within {{ raiseMonths }} months of the order date. This order was on {{ date(o.placedAt) }}, so the window closed on {{ date(cutoff(o)) }}.
                    </p>
                    <p class="mt-3 text-sm text-ink-700">Still need help? Call support on <a [href]="'tel:' + phone" class="font-semibold text-[#0F5FDC]">{{ phone }}</a>.</p>
                  }
                }
              </section>
            }
          }

          @case ('raise') {
            <!-- ── Raise a grievance ──────────────────────────────────────────── -->
            @if (order(); as o) {
              <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <p class="rounded-xl bg-[#F2F4F8] px-4 py-2.5 text-sm text-ink-900">
                  {{ o.service }} · {{ o.id }} <span class="text-ink-500">· {{ o.type }} · {{ date(o.placedAt) }}</span>
                </p>

                <label for="g-reason" class="mb-1 mt-5 block text-sm font-medium text-ink-700">What went wrong? <span class="text-danger-700">*</span></label>
                <select id="g-reason" class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" [value]="reason()" (change)="reason.set($any($event.target).value)">
                  <option value="" disabled>Select a reason</option>
                  @for (r of reasons(); track r) {
                    <option [value]="r">{{ r }}</option>
                  }
                </select>

                <label for="g-detail" class="mb-1 mt-4 block text-sm font-medium text-ink-700">
                  Tell us more @if (reason() === 'Other') { <span class="text-danger-700">*</span> } @else { <span class="font-normal text-ink-500">(optional)</span> }
                </label>
                <textarea id="g-detail" rows="4" class="w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" [placeholder]="reason() === 'Other' ? 'Describe your issue and what you would like us to do' : 'What happened, and what would you like us to do?'" [value]="detail()" (input)="detail.set($any($event.target).value)"></textarea>
                <p class="mt-1 text-xs text-ink-500">We'll notify you in the app, on WhatsApp and by email when support replies.</p>

                <!-- Supporting documents: optional, claims only (they are saved with the ticket). -->
                @if (isLive(o)) {
                  <label for="g-docs" class="mb-1 mt-4 block text-sm font-medium text-ink-700">Upload supporting documents <span class="font-normal text-ink-500">(optional)</span></label>
                  <input id="g-docs" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#EEF3FF] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#0F5FDC]" [disabled]="submitting()" (change)="onFiles($event)" />
                  <p class="mt-1 text-xs text-ink-500">PDF, JPG or PNG, up to 5 MB each.</p>
                  @if (docs().length) {
                    <ul class="mt-2 space-y-1">
                      @for (d of docs(); track d.file) {
                        <li class="flex items-center justify-between rounded-lg bg-[#F2F4F8] px-3 py-1.5 text-xs text-ink-900">
                          <span class="truncate">{{ d.file.name }} · {{ d.state === 'uploading' ? 'uploading…' : d.state === 'done' ? 'uploaded' : 'failed' }}</span>
                          <button type="button" class="ml-3 shrink-0 text-ink-500" [attr.aria-label]="'Remove ' + d.file.name" (click)="removeDoc(d.file)">×</button>
                        </li>
                      }
                    </ul>
                  }
                }
                @if (submitError(); as err) {
                  <p class="mt-3 text-sm text-danger-700" role="alert">{{ err }}</p>
                }
              </section>

              <div class="mt-5 flex gap-3">
                <button type="button" class="flex min-h-touch items-center rounded-xl border border-surface-border bg-white px-6 text-sm font-semibold text-ink-900" (click)="back()">Back</button>
                <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2] disabled:opacity-50" [disabled]="!canSubmit() || submitting() || uploading()" (click)="submit(o)">{{ submitting() ? 'Sending…' : 'Send to support' }}</button>
              </div>
            }
          }

          @case ('ticket') {
            <!-- ── Ticket thread ──────────────────────────────────────────────── -->
            @if (ticket(); as t) {
              <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs text-ink-500">Ticket ID</p>
                    <p class="text-base font-semibold text-ink-900">{{ t.id }}</p>
                  </div>
                  <span class="rounded-full px-2.5 py-1 text-xs font-medium" [class]="ticketClass(t)">{{ ticketLabel(t) }}</span>
                </div>
                <dl class="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div><dt class="text-xs text-ink-500">Linked order</dt><dd><button type="button" class="font-medium text-[#0F5FDC] underline" (click)="openOrderById(t.orderId)">{{ t.orderId }}</button></dd></div>
                  <div><dt class="text-xs text-ink-500">Raised on</dt><dd class="font-medium text-ink-900">{{ dateTime(t.createdAt) }}</dd></div>
                  <div class="sm:col-span-2"><dt class="text-xs text-ink-500">Reason</dt><dd class="font-medium text-ink-900">{{ t.reason }}</dd></div>
                </dl>
              </section>

              <!-- Thread: member, support and system events, each time-stamped. -->
              <section class="mt-4 space-y-3">
                @for (m of t.messages; track $index) {
                  @if (m.from === 'system') {
                    <p class="text-center text-[11px] text-ink-500">{{ m.text }} · {{ dateTime(m.at) }}</p>
                  } @else {
                    <div class="flex" [class.justify-end]="m.from === 'member'">
                      <div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm" [class.bg-[#0F5FDC]]="m.from === 'member'" [class.text-white]="m.from === 'member'" [class.bg-white]="m.from === 'support'" [class.border]="m.from === 'support'" [class.border-[#EDF0F7]]="m.from === 'support'" [class.text-ink-900]="m.from === 'support'">
                        <p class="mb-1 text-[11px] font-medium" [class.text-white/80]="m.from === 'member'" [class.text-[#0F5FDC]]="m.from === 'support'">{{ m.from === 'member' ? 'You' : m.author }}</p>
                        <p class="whitespace-pre-line">{{ m.text }}</p>
                        <p class="mt-1 text-[10px]" [class.text-white/70]="m.from === 'member'" [class.text-ink-400]="m.from === 'support'">{{ dateTime(m.at) }}</p>
                      </div>
                    </div>
                  }
                }
              </section>

              <!-- Member actions -->
              <section class="mt-4 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
                @switch (t.state) {
                  @case ('awaiting_support') {
                    <p class="text-sm text-ink-700">⏳ Waiting on support. We'll notify you in the app, on WhatsApp and by email when they reply.</p>
                    @if (hasSupportReply(t)) {
                      <button type="button" class="mt-3 min-h-touch w-full rounded-xl border border-success-700 px-4 text-sm font-semibold text-success-700" (click)="markResolved(t)">Mark resolved</button>
                    }
                  }
                  @case ('awaiting_member') {
                    <p class="text-sm font-medium text-success-700">💬 Support has replied — over to you.</p>
                    <label for="g-reply" class="mb-1 mt-3 block text-sm font-medium text-ink-700">Reply</label>
                    <textarea id="g-reply" rows="3" class="w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" placeholder="Write your reply" [value]="reply()" (input)="reply.set($any($event.target).value)"></textarea>
                    <div class="mt-3 flex flex-wrap gap-3">
                      <button type="button" class="min-h-touch flex-1 rounded-xl bg-[#0F5FDC] px-4 text-sm font-semibold text-white disabled:opacity-50" [disabled]="!reply().trim()" (click)="sendReply(t)">Send reply</button>
                      <button type="button" class="min-h-touch flex-1 rounded-xl border border-success-700 px-4 text-sm font-semibold text-success-700" (click)="markResolved(t)">Mark resolved</button>
                    </div>
                    <p class="mt-2 text-xs text-ink-500">Mark resolved closes the ticket for good — it can't be reopened.</p>
                  }
                  @case ('closed') {
                    @if (t.closedBy === 'member') {
                      <p class="text-sm text-ink-700">✓ You marked this resolved on {{ date(t.closedAt!) }}. The ticket is closed for good.</p>
                    } @else {
                      <p class="text-sm text-ink-700">{{ closedText(t.closedBy!) }} on {{ date(t.closedAt!) }}.</p>
                      <p class="mt-3 rounded-xl bg-[#F3F7FF] px-4 py-3 text-sm text-[#034DA2]">
                        Want to take it further? Call support on <a [href]="'tel:' + phone" class="font-semibold underline">{{ phone }}</a> and quote {{ t.id }}.
                      </p>
                    }
                  }
                }
              </section>

              <!-- DUMMY — support's side, until the operations portal is wired. -->
              <!-- Real claim tickets are answered from the support system, never simulated here. -->
              @if (t.state === 'awaiting_support' && !isLiveTicket(t)) {
                <section class="mt-4 rounded-2xl border border-dashed border-warning-400 bg-warning-50 p-5">
                  <p class="text-sm font-semibold text-warning-700">🧪 Demo — support's reply</p>
                  <div class="mt-3 flex flex-wrap gap-3">
                    <button type="button" class="min-h-touch flex-1 rounded-xl border border-[#0F5FDC] bg-white px-4 text-sm font-semibold text-[#0F5FDC]" (click)="simulateRespond(t)">Respond (keep open)</button>
                    <button type="button" class="min-h-touch flex-1 rounded-xl border border-success-700 bg-white px-4 text-sm font-semibold text-success-700" (click)="simulateResolve(t)">Resolve and close</button>
                  </div>
                </section>
              }
            }
          }
        }
      </div>

      <!-- One row layout for both lists: what, when and which, then the
           grievance status. A flagged claim's status is the fast-path button. -->
      <ng-template #row let-o let-fast="fast">
        <div class="flex items-center justify-between gap-3 py-3">
          <button type="button" class="min-w-0 flex-1 text-left" (click)="openOrder(o)">
            <p class="text-sm font-medium text-ink-900">{{ o.service }} <span class="font-normal text-ink-500">· {{ o.provider }}</span></p>
            <p class="mt-0.5 text-xs text-ink-500">{{ date(o.placedAt) }} · {{ o.id }} · {{ o.type }}</p>
            <p class="mt-0.5 text-[11px]" [class.text-success-700]="o.progress === 'Completed' && !o.claimFlag" [class.text-[#B45309]]="o.progress !== 'Completed' && o.claimFlag !== 'Rejected'" [class.text-danger-700]="o.claimFlag === 'Rejected'">{{ o.claimFlag ?? o.progress }}</p>
          </button>
          <span class="flex shrink-0 items-center gap-2">
            @if (fast && statusOf(o) === 'none') {
              <button type="button" class="rounded-full bg-[#0F5FDC] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#034DA2]" (click)="fastPath(o)">Ask for help</button>
            } @else if (statusOf(o) === 'none') {
              <button type="button" class="rounded-full px-2.5 py-1 text-[11px] font-medium" [class]="statusClass(o)" (click)="openOrder(o)">{{ statusLabel(o) }}</button>
            } @else {
              <button type="button" class="rounded-full px-2.5 py-1 text-[11px] font-medium" [class]="statusClass(o)" (click)="openTicketFor(o)">{{ statusLabel(o) }}</button>
            }
            <button type="button" class="text-ink-400" [attr.aria-label]="'Open ' + o.id" (click)="openOrder(o)">›</button>
          </span>
        </div>
      </ng-template>

      <!-- Invoice -->
      @if (invoiceOpen() && order(); as o) {
        <div class="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 lg:items-center lg:p-4" (click)="invoiceOpen.set(false)">
          <div class="max-h-[90vh] w-full overflow-y-auto rounded-t-[24px] bg-white p-6 shadow-2xl lg:max-w-[480px] lg:rounded-[24px]" role="dialog" aria-modal="true" aria-label="Invoice" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-lg font-semibold text-ink-900">Invoice</p>
                <p class="text-xs text-ink-500">INV-{{ o.id.replace('ORD-', '').replace('CLM-', '') }} · {{ dateTime(o.placedAt) }}</p>
              </div>
              <button type="button" class="text-2xl leading-none text-ink-700" aria-label="Close" (click)="invoiceOpen.set(false)">×</button>
            </div>
            <p class="mt-4 text-sm font-medium text-ink-900">{{ o.provider }}</p>
            <p class="text-xs text-ink-500">{{ o.service }} · {{ o.type }} · {{ o.id }}</p>
            <ul class="mt-4 divide-y divide-[#EDF0F7] border-y border-[#EDF0F7] text-sm">
              @for (l of o.invoiceLines; track l.label) {
                <li class="flex justify-between py-2"><span class="text-ink-700">{{ l.label }}</span><span class="text-ink-900">₹{{ n(l.amount) }}</span></li>
              }
            </ul>
            <dl class="mt-3 space-y-1 text-sm">
              <div class="flex justify-between"><dt class="text-ink-700">Discount</dt><dd>− ₹{{ n(o.discount) }}</dd></div>
              <div class="flex justify-between font-semibold"><dt>Net amount</dt><dd>₹{{ n(o.gross - o.discount) }}</dd></div>
            </dl>
            <p class="mt-4 text-[11px] text-ink-400">Sample invoice — static demo.</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class HelplinePage {
  protected readonly phone = SUPPORT_PHONE;
  protected readonly email = SUPPORT_EMAIL;
  protected readonly contactNote = signal<string | null>(null);
  protected readonly raiseMonths = RAISE_WINDOW_MONTHS;

  private readonly claimsStore = inject(ClaimsStore);
  private readonly disputeApi = inject(DisputeApi);

  /** Demo orders for every service; the live claims below are kept apart. */
  private readonly seedOrders = signal<SupportOrder[]>([...SEED_ORDERS].sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime()));
  private readonly orders = this.seedOrders;

  /**
   * Reimbursement claims from the same paginated listing API the Claims page
   * uses (GET_CLAIMS_BY_USER). These are real: a grievance on one is submitted
   * to the dispute API.
   */
  private readonly claimOrders = computed<SupportOrder[]>(() =>
    ((this.claimsStore.clailListData() ?? []) as any[])
      .map(toClaimOrder)
      .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime()),
  );
  private readonly claimsFetched = signal(false);
  protected readonly claimsLoading = computed(() => !this.claimsFetched() && this.claimOrders().length === 0);
  private readonly everyOrder = computed(() => [...this.claimOrders(), ...this.orders()]);
  /** Demo tickets, plus the ones raised in this browser tab (see `loadSaved`). */
  private readonly tickets = signal<SupportTicket[]>([...SEED_TICKETS.map(autoClose), ...loadSaved()]);

  protected readonly view = signal<View>('home');
  protected readonly orderId = signal<string | null>(null);
  protected readonly ticketId = signal<string | null>(null);
  /** Where back goes from the raise screen: the order (browse) or home (fast path). */
  private readonly raiseFrom = signal<'home' | 'order'>('order');
  private readonly ticketFrom = signal<View>('home');
  protected readonly notice = signal<string | null>(null);
  protected readonly invoiceOpen = signal(false);

  /** Empty = every service. */
  protected readonly bucket = signal('');
  /** Each list opens on its two most recent; Load more adds five at a time. */
  private readonly firstPage = 2;
  protected readonly pageSize = 5;
  protected readonly claimsShown = signal(2);
  protected readonly ordersShown = signal(2);
  protected readonly reason = signal('');
  protected readonly detail = signal('');
  protected readonly reply = signal('');
  protected readonly docs = signal<UploadedDoc[]>([]);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly uploading = computed(() => this.docs().some((d) => d.state === 'uploading'));

  protected readonly order = computed(() => this.everyOrder().find((o) => o.id === this.orderId()) ?? null);
  protected readonly ticket = computed(() => this.tickets().find((t) => t.id === this.ticketId()) ?? null);

  protected readonly flaggedClaims = computed(() => this.claimOrders());

  protected readonly shownClaims = computed(() => this.flaggedClaims().slice(0, this.claimsShown()));

  protected readonly buckets = computed(() => [...new Set(this.orders().map((o) => o.service))]);
  protected readonly visibleOrders = computed(() => {
    const b = this.bucket();
    return b ? this.orders().filter((o) => o.service === (b as ServiceLine)) : this.orders();
  });
  /** The two most recent, then five more per Load more. */
  protected readonly shownOrders = computed(() => this.visibleOrders().slice(0, this.ordersShown()));

  protected pickBucket(b: string): void {
    this.bucket.set(this.bucket() === b ? '' : b);
    this.ordersShown.set(this.firstPage);
  }

  protected readonly reasons = computed(() => {
    const o = this.order();
    return o ? reasonsFor(o) : [];
  });

  /** A reason is required; "Other" also needs the member's own words. */
  protected readonly canSubmit = computed(() => {
    if (!this.reason()) return false;
    return this.reason() !== 'Other' || this.detail().trim().length > 0;
  });

  constructor() {
    // Until a ticket-list API exists, tickets raised here survive a refresh.
    effect(() => saveTickets(this.tickets()));
    // Same call, same first page (20 newest), as the Claims page.
    void this.claimsStore.getClimListData();
    setTimeout(() => this.claimsFetched.set(true), 4000);
  }

  /** True for a claim from the live listing, whose grievance is really saved. */
  /** A phone can dial; a desktop cannot, so there the number is copied instead. */
  protected async onCall(event: Event): Promise<void> {
    if (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) return;
    event.preventDefault();
    await this.copy(this.phone, `${this.phone} copied — dial it from your phone.`);
  }

  protected onMail(): void {
    this.contactNote.set(`Opening your email app to write to ${this.email}. If nothing opens, write to us at that address.`);
  }

  protected mailHref(): string {
    const body = 'Hello,\n\nMy question is not about a specific order or claim:\n\n';
    return `mailto:${this.email}?subject=${encodeURIComponent('Support request')}&body=${encodeURIComponent(body)}`;
  }

  private async copy(text: string, done: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.contactNote.set(done);
    } catch {
      this.contactNote.set(`Call us on ${text}.`);
    }
  }

  protected isLive(o: SupportOrder): boolean {
    return this.claimOrders().some((c) => c.id === o.id);
  }

  protected isLiveTicket(t: SupportTicket): boolean {
    return this.claimOrders().some((c) => c.id === t.orderId);
  }


  protected heading(): string {
    switch (this.view()) {
      case 'order': return 'Order detail';
      case 'raise': return 'Raise a grievance';
      case 'ticket': return 'Your ticket';
      default: return 'Support';
    }
  }

  protected subheading(): string {
    switch (this.view()) {
      case 'order': return this.order()?.service ?? '';
      case 'raise': return 'Tell us what went wrong';
      case 'ticket': return this.ticket()?.reason ?? '';
      default: return 'Get help with a claim or a service';
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────

  protected ticketFor(o: SupportOrder): SupportTicket | undefined {
    return this.tickets().find((t) => t.orderId === o.id);
  }

  private status(t: SupportTicket | undefined): GrievanceStatus {
    if (!t) return 'none';
    if (t.state === 'closed') return 'closed';
    return t.state === 'awaiting_member' ? 'response' : 'open';
  }

  protected statusOf(o: SupportOrder): GrievanceStatus {
    return this.status(this.ticketFor(o));
  }

  protected statusLabel(o: SupportOrder): string {
    const s = this.statusOf(o);
    // Past the raise window with no ticket: nothing to ask for any more.
    if (s === 'none' && this.isExpired(o)) return 'Window closed';
    return STATUS_LABEL[s];
  }

  protected statusClass(o: SupportOrder): string {
    const s = this.statusOf(o);
    if (s === 'none' && this.isExpired(o)) return STATUS_CLASS.closed;
    return STATUS_CLASS[s];
  }

  protected ticketLabel(t: SupportTicket): string {
    return STATUS_LABEL[this.status(t)];
  }

  protected ticketClass(t: SupportTicket): string {
    return STATUS_CLASS[this.status(t)];
  }

  protected cutoff(o: SupportOrder): Date {
    return raiseCutoff(o);
  }

  private isExpired(o: SupportOrder): boolean {
    return Date.now() > raiseCutoff(o).getTime();
  }

  /** One ticket per order: an existing one is shown rather than a second raised. */
  protected orderAction(o: SupportOrder): 'raise' | 'view' | 'expired' {
    if (this.ticketFor(o)) return 'view';
    return this.isExpired(o) ? 'expired' : 'raise';
  }

  protected hasSupportReply(t: SupportTicket): boolean {
    return t.messages.some((m) => m.from === 'support');
  }

  protected closedText(by: ClosedBy): string {
    return by === 'auto'
      ? `Closed automatically, ${RAISE_WINDOW_MONTHS} months from the order date,`
      : 'Resolved and closed by support';
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  protected openOrder(o: SupportOrder): void {
    this.notice.set(null);
    this.orderId.set(o.id);
    this.view.set('order');
  }

  protected openOrderById(id: string): void {
    const o = this.everyOrder().find((x) => x.id === id);
    if (o) this.openOrder(o);
  }

  /** Fast path from a flagged claim: straight to the reason. */
  protected fastPath(o: SupportOrder): void {
    this.orderId.set(o.id);
    this.raiseFrom.set('home');
    this.resetForm();
    this.notice.set(null);
    this.view.set('raise');
  }

  protected startRaise(o: SupportOrder): void {
    this.orderId.set(o.id);
    this.raiseFrom.set('order');
    this.resetForm();
    this.view.set('raise');
  }

  protected openTicketFor(o: SupportOrder): void {
    const t = this.ticketFor(o);
    if (!t) return;
    this.ticketFrom.set(this.view());
    this.orderId.set(o.id);
    this.ticketId.set(t.id);
    this.reply.set('');
    this.notice.set(null);
    this.view.set('ticket');
  }

  protected back(): void {
    this.notice.set(null);
    switch (this.view()) {
      case 'raise': this.view.set(this.raiseFrom()); break;
      case 'ticket': this.view.set(this.ticketFrom() === 'ticket' ? 'home' : this.ticketFrom()); break;
      default: this.view.set('home');
    }
  }

  private resetForm(): void {
    this.reason.set('');
    this.detail.set('');
    this.docs.set([]);
    this.submitError.set(null);
  }

  // ── Actions ────────────────────────────────────────────────────────────

  protected async submit(o: SupportOrder): Promise<void> {
    if (!this.canSubmit() || this.submitting()) return;
    // The existing-ticket and raise-window checks, again at the point of submit.
    if (this.ticketFor(o) || this.isExpired(o)) { this.view.set('order'); return; }
    const now = new Date();
    const text = this.detail().trim();
    let ticketId = `TKT-${10413 + this.tickets().length}`;
    if (this.isLive(o)) {
      this.submitting.set(true);
      this.submitError.set(null);
      const result = await this.disputeApi.submit({
        claimId: o.id,
        categoryLabel: o.service,
        reason: this.reason(),
        detail: text,
        documentIds: this.docs().filter((d) => d.state === 'done').map((d) => d.documentId!),
      });
      this.submitting.set(false);
      if (!result.ok) { this.submitError.set(result.message); return; }
      if (result.ticketId) ticketId = result.ticketId;
    }
    const t: SupportTicket = {
      id: ticketId,
      orderId: o.id,
      reason: this.reason(),
      detail: text,
      createdAt: now,
      state: 'awaiting_support',
      messages: [
        { from: 'member', text: text ? `${this.reason()}\n\n${text}` : this.reason(), at: now },
        { from: 'system', text: 'Ticket opened', at: now },
      ],
    };
    this.tickets.set([...this.tickets(), t]);
    this.ticketFrom.set('home');
    this.ticketId.set(t.id);
    this.view.set('ticket');
    this.notice.set(`Ticket ${t.id} created for ${o.id}. We'll keep you posted in the app, on WhatsApp and by email.`);
  }

  protected async onFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const chosen = Array.from(input.files ?? []);
    input.value = '';
    for (const file of chosen) {
      const entry: UploadedDoc = { file, state: 'uploading' };
      this.docs.update((list) => [...list, entry]);
      const result = await this.disputeApi.uploadDocument(file);
      this.docs.update((list) => list.map((d) => (d.file === file
        ? (result.ok ? { file, state: 'done', documentId: result.documentId } : { file, state: 'failed' })
        : d)));
      if (!result.ok) this.submitError.set(result.message);
    }
  }

  protected removeDoc(file: File): void {
    this.docs.update((list) => list.filter((d) => d.file !== file));
  }

  protected sendReply(t: SupportTicket): void {
    const text = this.reply().trim();
    if (!text) return;
    this.update(t, { state: 'awaiting_support' }, { from: 'member', text, at: new Date() });
    this.reply.set('');
    this.notice.set('Reply sent. The ticket is back with the support team.');
  }

  protected markResolved(t: SupportTicket): void {
    const now = new Date();
    this.update(t, { state: 'closed', closedAt: now, closedBy: 'member' }, { from: 'system', text: 'Marked resolved by you', at: now });
    this.notice.set('Thanks — the ticket is closed.');
  }

  /** DUMMY — stands in for the executive's Respond. */
  protected simulateRespond(t: SupportTicket): void {
    this.update(t, { state: 'awaiting_member' }, {
      from: 'support', author: DEMO_EXECUTIVE, at: new Date(),
      text: "Thanks for reaching out. We're looking into this with the provider — could you share any receipt or screenshot that shows the issue?",
    });
    this.notice.set('Support replied — you were notified in the app, on WhatsApp and by email.');
  }

  /** DUMMY — stands in for the executive's Resolve and close. */
  protected simulateResolve(t: SupportTicket): void {
    const now = new Date();
    this.update(t, { state: 'closed', closedAt: now, closedBy: 'support' }, {
      from: 'support', author: DEMO_EXECUTIVE, at: now,
      text: "We've sorted this with the provider and adjusted your wallet balance. Closing the ticket.",
    });
    this.tickets.set(this.tickets().map((x) => (x.id === t.id ? { ...x, messages: [...x.messages, { from: 'system', text: 'Resolved and closed by support', at: now }] } : x)));
    this.notice.set('Support resolved and closed the ticket — you were notified in the app, on WhatsApp and by email.');
  }

  private update(t: SupportTicket, patch: Partial<SupportTicket>, message: TicketMessage): void {
    this.tickets.set(this.tickets().map((x) => (x.id === t.id ? { ...x, ...patch, messages: [...x.messages, message] } : x)));
  }

  // ── Formatting ─────────────────────────────────────────────────────────

  protected date(d: Date): string {
    return DATE.format(d);
  }

  protected dateTime(d: Date): string {
    return DATE_TIME.format(d);
  }

  protected n(v: number): string {
    return NUMBER.format(v);
  }
}

/** A ticket still open when its order's raise window ran out is closed automatically. */
function autoClose(t: SupportTicket): SupportTicket {
  if (t.state === 'closed') return t;
  const o = SEED_ORDERS.find((x) => x.id === t.orderId);
  if (!o) return t;
  const cutoff = raiseCutoff(o);
  if (Date.now() <= cutoff.getTime()) return t;
  return {
    ...t,
    state: 'closed',
    closedAt: cutoff,
    closedBy: 'auto',
    messages: [...t.messages, { from: 'system', text: `Closed automatically — ${RAISE_WINDOW_MONTHS} months from the order date`, at: cutoff }],
  };
}

interface UploadedDoc {
  readonly file: File;
  readonly state: 'uploading' | 'done' | 'failed';
  readonly documentId?: string;
}

/** Epoch millis or ISO string from the claims list, as a Date. */
function toDate(raw: unknown): Date {
  const n = Number(raw);
  const d = new Date(Number.isNaN(n) ? String(raw) : n);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** One row of the claims listing, as the Support page's order shape. */
function toClaimOrder(row: any): SupportOrder {
  const code = String(row?.claim_status ?? row?.status?.label ?? '').toUpperCase().replace(/[\s-]+/g, '_');
  const label: string = row?.status?.label ?? '';
  const flag: SupportOrder['claimFlag'] = /DOCUMENT|RESUBMISSION/.test(code) || /document/i.test(label)
    ? 'Documents needed'
    : /REJECT/.test(code) || /reject/i.test(label) ? 'Rejected' : undefined;
  const bill = Number(row?.original_bill_amount ?? 0);
  return {
    id: String(row?.claim_id ?? ''),
    service: String(row?.category ?? 'Reimbursement claim') as ServiceLine,
    type: 'Reimbursement',
    provider: String(row?.provider ?? ''),
    placedAt: toDate(row?.treatment_date ?? row?.submitted_at),
    progress: row?.status?.isFinal || /APPROV|PAID|PAYMENT_(DONE|COMPLETED)|REJECT|CLOSED|CANCEL/.test(code) ? 'Completed' : 'In Progress',
    claimFlag: flag,
    gross: bill,
    discount: 0,
    paidByWallet: 0,
    paidByMember: bill,
    invoiceLines: [],
  };
}

// ── Ticket persistence (stopgap) ──────────────────────────────────────────
// There is no API to read tickets back yet, so a refresh would drop a ticket the
// member has just raised. Until there is, tickets raised in this tab are kept in
// sessionStorage: it survives a refresh, and is cleared when the tab is closed,
// so nothing lingers on a shared computer. Replace with the list API.

const TICKETS_KEY = 'opd.support.tickets.v1';
const SEED_TICKET_IDS = new Set(SEED_TICKETS.map((t) => t.id));

function saveTickets(all: SupportTicket[]): void {
  try {
    sessionStorage.setItem(TICKETS_KEY, JSON.stringify(all.filter((t) => !SEED_TICKET_IDS.has(t.id))));
  } catch {
    // Storage blocked or full: the page still works, tickets just do not survive a refresh.
  }
}

function loadSaved(): SupportTicket[] {
  try {
    const raw = sessionStorage.getItem(TICKETS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as any[]).map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      closedAt: t.closedAt ? new Date(t.closedAt) : undefined,
      messages: (t.messages ?? []).map((m: any) => ({ ...m, at: new Date(m.at) })),
    }));
  } catch {
    return [];
  }
}
