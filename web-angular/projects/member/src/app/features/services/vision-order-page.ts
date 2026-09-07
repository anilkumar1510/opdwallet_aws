import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FamilyStore } from '../../core/family/family.store';
import { WalletStore } from '../../core/wallet/wallet.store';
import { formatMoney, money } from '../../core/domain/money';
import { VisionPurchaseMode, modeLabel } from '../../core/vision/vision';
import { VisionStore } from '../../core/vision/vision.store';
import { LoadingView } from '../../shared/ui/state-views';

/**
 * Vision order and coupon — patient-flows flow 3, steps 3 and 4.
 *
 * One screen for both, because the `Vision Backend` tab groups them that way:
 * "Start New Order, pick partner and mode, upload prescription" is one step and
 * "Submit request and receive the coupon code" is the next. Splitting them
 * across routes would add two destinations the sheet does not describe.
 *
 * The journey ENDS here. After the coupon the member buys on the partner's own
 * site, and the tab is explicit that order status, approval, rejection and
 * fulfilment are all communicated outside this application — so this screen
 * offers no tracking, and says so rather than implying something will appear.
 */
@Component({
  selector: 'opd-vision-order-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoadingView],
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <header
        class="border-b border-transparent bg-[linear-gradient(180deg,#1F77E0_0%,#0E51A2_100%)] lg:border-surface-border lg:bg-white lg:bg-none"
      >
        <div class="mx-auto flex max-w-[820px] items-center gap-4 px-5 py-5 lg:px-8">
          <a
            routerLink="/member/vision"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 lg:text-[#034DA2] lg:hover:bg-blue-50"
            aria-label="Back to vision"
            >&larr;</a
          >
          <div class="min-w-0">
            <h1
              class="text-[18px] font-medium leading-[1.2] text-white lg:text-2xl lg:font-bold lg:text-[#034DA2]"
            >
              Vision order
            </h1>
            <p class="truncate text-[12px] leading-[1.2] text-white/80 lg:text-sm lg:text-ink-500">
              Get a coupon to spend at a partner
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (store.error(); as problem) {
          <p class="mb-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
            {{ problem }}
          </p>
        }

        @if (store.busy() && !order()) {
          <opd-loading label="Loading your vision order" />
        } @else if (markedUsed()) {
          <!--
            Shown once, straight after marking a coupon used, then gone.
            A used order is finished, so the store stops treating it as current
            and the start screen returns underneath this. Keeping the member
            parked on a spent coupon's screen was the bug this replaces.
          -->
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Coupon marked as used</h2>
            <p class="mt-1 text-sm text-ink-700">
              It has come off your vision cover. If that was a mistake, contact support — it cannot
              be undone here.
            </p>
            <button
              type="button"
              class="mt-4 min-h-touch w-full rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900"
              (click)="markedUsed.set(false)"
            >
              Done
            </button>
          </section>
        } @else if (order(); as current) {
          @if (current.couponCode; as coupon) {
            <!-- Step 7. The journey ends here: what follows happens on the
                 partner's site and is not reported back to this platform. -->
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-6 shadow-sm">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Your coupon</h2>
              <p class="mt-1 text-sm text-ink-700">
                Worth {{ money(current.eligible) }} at {{ current.partnerName }}.
              </p>

              <p
                class="mt-4 select-all rounded-xl border-2 border-dashed border-[#0F5FDC] bg-blue-50 px-4 py-4 text-center text-xl font-bold tracking-[0.15em] text-[#034DA2]"
              >
                {{ coupon }}
              </p>

              <!--
                Deliberately does NOT say who collects the excess, because the
                two sheets disagree and this screen should not pick a side:

                  Patient Flows flow 3 step 8 - "Anything above the coupon value
                  is paid by the member to the partner".
                  Vision Backend row 17 - "the balance is collected through our
                  own channel, not through the member portal wallet and not
                  through Lenskart".

                Naming the wrong one tells the member to expect a bill from
                somewhere it will never come from. Both agree on what the coupon
                covers, so that is all this states. Raised as an open question in
                openspec/changes/member-vision-order.
              -->
              <p class="mt-3 text-sm text-ink-700">
                Enter this in the coupon field when you check out. It covers up to
                {{ money(current.eligible) }} — anything above that is not part of your benefit and
                is payable separately.
              </p>

              <!--
                Says where the money went. The reservation is a real debit, so
                the member's vision cover reads zero from here: without this line
                the wallet looks spent on nothing, which reads as a bug.
              -->
              <p class="mt-2 text-sm text-ink-500">
                This amount is set aside against your vision cover while the coupon is live, so it
                cannot be spent anywhere else. Cancel the order and it goes back.
              </p>

              @if (current.storeUrl; as url) {
                <a
                  [href]="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white hover:bg-[#034DA2]"
                  >Go to {{ current.partnerName }}</a
                >
              }

            </section>

            <!--
              Vision Backend steps 11-14, the stages after the member has bought.
              None of them happens here: payment collection is on our own channel,
              adjudication is on Lenskart's Insurance Dashboard, and fulfilment or
              rejection is Lenskart's.

              Shown as a PLACEHOLDER sequence, not a tracker. The tab is explicit
              that the member has no status visibility - status, approval,
              rejection and fulfilment are all communicated outside the app - so
              nothing here has a state, a tick or a current step. It says what
              will happen, never where the order has got to. Rendering these as
              progress would be inventing a status nobody reports back.
            -->
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">What happens next</h2>
              <p class="mt-1 text-sm text-ink-500">
                These steps happen away from this app, so you will not see them update here.
              </p>

              <ol class="mt-4 flex flex-col gap-4">
                @for (stage of nextStages; track stage.title) {
                  <li class="flex gap-3">
                    <span
                      class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-surface-border"
                      aria-hidden="true"
                    ></span>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-ink-900">{{ stage.title }}</p>
                      <p class="mt-0.5 text-sm text-ink-500">{{ stage.detail }}</p>
                      <p class="mt-0.5 text-xs text-ink-500">{{ stage.where }}</p>
                    </div>
                  </li>
                }
              </ol>

              <p class="mt-4 border-t border-surface-border pt-3 text-xs text-ink-500">
                For anything about this order, contact {{ current.partnerName }} directly.
              </p>
            </section>

            <!--
              Two exits, and which one is offered depends on whether the coupon
              has been spent.

              Cancelling credits the reservation back, and nothing reports
              redemption — so without a way to say "I used it", a member could
              buy at the partner and then cancel to get the same money returned.
              Marking it used makes the reservation a real consumption and takes
              cancellation off the table.

              Self-declared, so it is not proof. It is the only signal that
              exists until a partner redemption callback does.
            -->
            <section class="mt-5 rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm">
              @if (replacing()) {
                <p class="text-sm font-medium text-ink-900">Cancel this coupon?</p>
                <p class="mt-1 text-sm text-ink-700">
                  {{ coupon }} will stop working and {{ money(current.eligible) }} goes back to your
                  vision cover. Only do this if you have not used it.
                </p>
                <div class="mt-3 flex gap-3">
                  <button
                    type="button"
                    class="min-h-touch flex-1 rounded-xl bg-danger-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                    [disabled]="store.busy()"
                    (click)="cancel(current.id)"
                  >
                    {{ store.busy() ? 'Cancelling…' : 'Yes, cancel it' }}
                  </button>
                  <button
                    type="button"
                    class="min-h-touch flex-1 rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900"
                    [disabled]="store.busy()"
                    (click)="replacing.set(false)"
                  >
                    Keep my coupon
                  </button>
                </div>
              } @else {
                <!--
                  The member is NOT asked what the order came to.
                  They have no reason to know it at the moment they leave, and
                  it is not their figure to give: the coupon is a reference id,
                  Lenskart prices the basket, and Lenskart reports the amount
                  back. The cart, the copay and the final wallet split are all
                  built from THEIR number, not a typed one.

                  That inbound report does not exist yet — no partner
                  integration, no callback — so this states the sequence and
                  stops. Asking the member to fill the gap would put a figure
                  nobody verified in front of a copay calculation.
                -->
                <p class="text-sm font-medium text-ink-900">Waiting on {{ current.partnerName }}</p>
                <p class="mt-1 text-sm text-ink-700">
                  Once they tell us what you ordered, we work out your share and settle it against
                  your cover. Until then the full {{ money(current.eligible) }} stays reserved.
                </p>
                <p class="mt-2 text-xs text-ink-500">
                  We have no live link to {{ current.partnerName }} yet, so this will not update on
                  its own.
                </p>

                <!--
                  A real destination for the cart, rather than a line of prose
                  about one. It is a placeholder: the page exists so the gap has
                  an address, and says plainly that nothing populates it yet.
                -->
                <a
                  [routerLink]="['/member/vision/order', current.id, 'cart']"
                  class="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl border border-surface-border px-4 text-sm font-semibold text-ink-900 hover:bg-surface-sunk"
                  >See your cart</a
                >

                <button
                  type="button"
                  class="mt-4 min-h-touch w-full rounded-xl border border-danger-600 px-4 text-sm font-semibold text-danger-700 hover:bg-danger-50"
                  (click)="replacing.set(true)"
                >
                  Cancel this coupon
                </button>
              }
            </section>
          } @else {
            <!-- Steps 5 and 6: prescription, then submit. -->
            <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
              <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">
                {{ current.partnerName }} · {{ modeText(current.mode) }}
              </h2>
              <p class="mt-1 text-sm text-ink-700">For {{ current.patientName }}</p>

              <label class="mt-5 block">
                <span class="text-sm font-medium text-ink-900">Eye prescription</span>
                <span class="mt-0.5 block text-sm text-ink-500">
                  Required before you can get a coupon.
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
                  [disabled]="store.busy()"
                  (change)="upload($event, current.id)"
                  class="mt-2 block w-full text-sm text-ink-700 file:mr-3 file:min-h-touch file:rounded-xl file:border file:border-surface-border file:bg-white file:px-4 file:text-sm file:font-semibold file:text-ink-900"
                />
              </label>

              @if (current.prescriptionName; as name) {
                <p class="mt-2 rounded-xl bg-success-50 px-3 py-2 text-sm text-success-700">
                  {{ name }} uploaded.
                </p>
              }

              <button
                type="button"
                class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white disabled:opacity-60"
                [disabled]="!current.prescriptionName || store.busy()"
                (click)="submit(current.id)"
              >
                {{ store.busy() ? 'Submitting…' : 'Submit and get my coupon' }}
              </button>

              <button
                type="button"
                class="mt-3 min-h-touch w-full rounded-xl border border-surface-border px-5 text-sm font-semibold text-ink-900 disabled:opacity-60"
                [disabled]="store.busy()"
                (click)="cancel(current.id)"
              >
                Cancel this order
              </button>
            </section>
          }
        } @else {
          <!--
            Starting the order. There is no partner or mode picker: the member
            gets a coupon, and where they spend it is a question the coupon
            itself answers. The partner is the empanelled one, and the modes it
            supports are its own property, not a decision to put in front of
            someone who just wants glasses.

            Still an explicit action rather than creating an order on arrival —
            merely opening a screen should not write a record, and the one-open-
            order rule would then lock a member out of nothing they asked for.
          -->
          <section class="rounded-2xl border border-[#EDF0F7] bg-white p-5 shadow-sm lg:p-6">
            <h2 class="text-base font-semibold text-[#0E51A2] lg:text-lg">Get your coupon</h2>
            <p class="mt-1 text-sm text-ink-700">
              Upload your eye prescription and we will issue a coupon to spend at
              {{ defaultPartner()?.name ?? 'our vision partner' }}.
            </p>

            <!--
              Refuse at the START, not at submit.
              The API rightly rejects a coupon with no cover behind it, but that
              is the LAST step: a member could pick a partner, upload a
              prescription, and only then be told there was never anything to
              issue. Checking the cover the screen already displays turns three
              wasted steps into one honest sentence.
            -->
            @if (hasCover()) {
              <button
                type="button"
                class="mt-5 min-h-touch w-full rounded-xl bg-[#0F5FDC] px-5 text-sm font-semibold text-white disabled:opacity-60"
                [disabled]="store.busy() || !defaultPartner()"
                (click)="start()"
              >
                {{ store.busy() ? 'Starting…' : 'Start my vision order' }}
              </button>
            } @else {
              <p class="mt-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
                You have no vision cover left this policy year, so a coupon cannot be issued. It
                resets when your plan renews.
              </p>
            }

            @if (!store.busy() && !defaultPartner()) {
              <p class="mt-3 text-sm text-ink-500">
                No vision partner is available right now. Try again later.
              </p>
            }
          </section>
        }
      </div>
    </div>
  `,
})
export class VisionOrderPage {
  protected readonly store = inject(VisionStore);
  private readonly family = inject(FamilyStore);
  private readonly wallet = inject(WalletStore);
  protected readonly money = formatMoney;

  protected readonly order = computed(() => this.store.order());
  private readonly loaded = signal(false);

  constructor() {
    // Once, on open. Both are needed whichever branch renders: the partner list
    // for a member with no order, the order for one who has started already.
    if (!this.loaded()) {
      this.loaded.set(true);
      void this.store.loadPartners();
      void this.store.loadOrder();
    }
  }

  /**
   * What happens after the member leaves, in the order it really happens.
   *
   * The coupon is a REFERENCE ID, not a payment: Lenskart prices the basket,
   * reports the amount back, and only then is there a cart on our side to apply
   * copay to. Every one of these is a placeholder — none is built, and the
   * inbound report they all depend on has no integration behind it.
   *
   * Static and stateless on purpose. Giving these ticks or a current step would
   * claim knowledge of an order this platform is told nothing about.
   */
  protected readonly nextStages = [
    {
      title: 'You use the coupon code at checkout',
      detail:
        'It identifies you to the partner. It is not a payment — nothing is deducted at that moment.',
      where: 'With the partner',
    },
    {
      title: 'The partner tells us what you ordered',
      detail:
        'They send back the order and its value. This is the figure everything after it is based on.',
      where: 'Not built yet',
    },
    {
      title: 'Your cart is created here',
      detail: 'Built from their figures, not yours — you are never asked to type an amount.',
      where: 'Not built yet',
    },
    {
      title: 'Your share is worked out',
      detail:
        'Copay and any amount above the plan limit come off, and the rest settles against your cover.',
      where: 'Not built yet',
    },
    {
      title: 'The order is approved or rejected',
      detail: 'The whole order together, not item by item. If rejected, someone contacts you.',
      where: 'With the partner',
    },
  ];
  /** Guards the coupon-invalidating path behind a confirmation. */
  protected readonly replacing = signal(false);
  /** Transient: acknowledges a coupon just marked used, then clears. */
  protected readonly markedUsed = signal(false);

  /**
   * The partner the coupon will be for. First active one — the member is not
   * asked to choose.
   */
  protected readonly defaultPartner = computed(() => this.store.partners()[0] ?? null);

  protected modeText(mode: VisionPurchaseMode | null): string {
    return mode ? modeLabel(mode) : '';
  }

  /**
   * Whether there is vision cover to issue a coupon against, read from the
   * wallet the shell already loaded. A missing wallet is a loading state, not
   * "no cover" — the API is the backstop either way.
   */
  protected readonly hasCover = computed(() => {
    const category = this.wallet.wallet()?.categories.find((entry) => entry.code === 'CAT007');
    if (!category) return true;
    return category.isUnlimited || category.available.amount > 0;
  });
  protected async start(): Promise<void> {
    const patient = this.family.activeMember();
    const partner = this.defaultPartner();
    if (!patient || !partner) return;

    await this.store.start({
      patientId: patient.id,
      patientName: patient.fullName,
      partnerId: partner.id,
      // The partner's own first supported mode. ONLINE for a partner that sells
      // both ways, IN_STORE for one that does not sell online at all — the API
      // rejects a mode a partner does not support, so this cannot be assumed.
      mode: partner.modes[0],
    });
  }

  protected async upload(event: Event, orderId: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const ok = await this.store.uploadPrescription(orderId, file);
    // Clear on failure so the same rejected file can be re-picked after the
    // member converts or replaces it; a file input will not re-fire otherwise.
    if (!ok) input.value = '';
  }

  protected async submit(orderId: string): Promise<void> {
    await this.store.submit(orderId);
  }

  protected async cancel(orderId: string): Promise<void> {
    await this.store.cancel(orderId);
    // Back to the picker, not to a confirmation the order no longer has.
    this.replacing.set(false);
  }
}
