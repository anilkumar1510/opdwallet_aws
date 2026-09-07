import { toDate } from '../domain/codes';
import { Money, money } from '../domain/money';

/**
 * Vision orders and coupons — patient-flows flow 3, and the `Vision Backend`
 * tab behind it.
 *
 * **Only four of that flow's fourteen steps are ours.** Steps 5 to 14 — the
 * checkout, the Insurance Dashboard, adjudication, fulfilment — run on
 * Lenskart's own platforms. This portal's job ends when the member holds a
 * coupon code, which is why there is no order-tracking or status-polling here:
 * the tab records that the member has no status visibility after that point,
 * and everything downstream is communicated outside the application.
 *
 * Distinct from `clinic-booking`'s VISION branch, which books a clinic visit
 * with slots and a payment. That journey is in neither sheet, and its clinic
 * list is empty on the live database. The two are left side by side because
 * retiring one is a decision, recorded open in
 * `openspec/changes/member-vision-order`.
 */
export const VISION_API = {
  partners: 'member/vision/partners',
  orders: 'member/vision/orders',
  orderById: (orderId: string) => `member/vision/orders/${orderId}`,
  /** Multipart, field name `file`. Mandatory before submit — flow 3 step 5. */
  prescription: (orderId: string) => `member/vision/orders/${orderId}/prescription`,
  /** Validates and issues the coupon in one call, as the tab groups them. */
  submit: (orderId: string) => `member/vision/orders/${orderId}/submit`,
  /** The member's own confirmation that the coupon was spent. */
  markUsed: (orderId: string) => `member/vision/orders/${orderId}/used`,
  cancel: (orderId: string) => `member/vision/orders/${orderId}/cancel`,
} as const;

/** Every route here wraps its payload as `{ success, data }`. */
export interface VisionEnvelopeDto<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

export type VisionPurchaseMode = 'ONLINE' | 'IN_STORE';

export interface VisionPartnerDto {
  partnerId?: string;
  name?: string;
  description?: string;
  modes?: string[];
}

export interface VisionOrderDto {
  partnerOrderId?: string;
  orderValue?: number;
  copayAmount?: number;
  walletPaid?: number;
  memberPays?: number;
  excessAmount?: number;
  reportedAt?: string;
  paymentId?: string;
  payableHere?: number;
  orderId?: string;
  status?: string;
  partnerId?: string;
  partnerName?: string;
  mode?: string;
  patientName?: string;
  couponCode?: string;
  eligibleAmount?: number;
  couponIssuedAt?: string;
  storeUrl?: string | null;
  prescription?: { originalName?: string; uploadedAt?: string };
  createdAt?: string;
}

export interface VisionCouponDto {
  orderId?: string;
  couponCode?: string;
  eligibleAmount?: number;
  partnerName?: string;
  storeUrl?: string | null;
}

export interface VisionPartner {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Which modes this partner supports. A store-only partner has no ONLINE. */
  readonly modes: readonly VisionPurchaseMode[];
}

export interface VisionOrder {
  readonly id: string;
  readonly statusCode: string;
  readonly statusLabel: string;
  readonly partnerName: string;
  readonly mode: VisionPurchaseMode | null;
  readonly patientName: string;
  readonly prescriptionName: string | null;
  /** Set once the coupon is issued; null while the order is still a draft. */
  readonly couponCode: string | null;
  readonly eligible: Money;
  readonly storeUrl: string | null;
  readonly placedAt: Date | null;
  /** Whether the member can still start a different order. */
  readonly isOpen: boolean;
  /** The member said they spent it. Terminal — no cancel, no release. */
  readonly isUsed: boolean;
  /**
   * The partner has reported an order, so there is a cart and a settled split.
   * Null until then — the member is never asked for these figures.
   */
  readonly cart: {
    readonly partnerOrderId: string | null;
    readonly orderValue: Money;
    readonly copay: Money;
    readonly walletPaid: Money;
    readonly memberPays: Money;
    readonly overLimit: Money;
    readonly reportedAt: Date | null;
    /**
     * The copay, collected here on the dummy gateway. Null when nothing is
     * owed to us — the over-limit amount is paid to the partner and never
     * appears in the member payment flow.
     */
    readonly paymentId: string | null;
    readonly payableHere: Money;
  } | null;
}

const MODE_LABELS: Readonly<Record<VisionPurchaseMode, string>> = {
  ONLINE: 'Buy online',
  IN_STORE: 'Buy in store',
};

export function modeLabel(mode: VisionPurchaseMode): string {
  return MODE_LABELS[mode];
}

const STATUS_LABELS: Readonly<Record<string, string>> = {
  DRAFT: 'Not submitted',
  COUPON_ISSUED: 'Coupon issued',
  REPORTED: 'Order received',
  USED: 'Coupon used',
  CANCELLED: 'Cancelled',
};

function toMode(value: string | undefined): VisionPurchaseMode | null {
  return value === 'ONLINE' || value === 'IN_STORE' ? value : null;
}

export function toVisionPartner(dto: VisionPartnerDto): VisionPartner {
  const modes = (dto.modes ?? [])
    .map(toMode)
    .filter((mode): mode is VisionPurchaseMode => mode !== null);
  return {
    id: dto.partnerId ?? '',
    name: dto.name?.trim() || 'Partner',
    description: dto.description?.trim() || '',
    // A partner the API sent with no recognised mode would render a picker with
    // nothing to pick. Default to online rather than showing a dead card.
    modes: modes.length ? modes : ['ONLINE'],
  };
}

export function toVisionOrder(dto: VisionOrderDto): VisionOrder {
  const status = dto.status?.trim() ?? 'DRAFT';
  return {
    id: dto.orderId ?? '',
    statusCode: status,
    // Unknown statuses show their raw value rather than a wrong friendly label.
    statusLabel: STATUS_LABELS[status] ?? status,
    partnerName: dto.partnerName?.trim() || 'Partner',
    mode: toMode(dto.mode),
    patientName: dto.patientName?.trim() || '',
    prescriptionName: dto.prescription?.originalName?.trim() || null,
    couponCode: dto.couponCode?.trim() || null,
    eligible: money(dto.eligibleAmount),
    storeUrl: dto.storeUrl?.trim() || null,
    placedAt: toDate(dto.createdAt),
    isOpen: status !== 'CANCELLED',
    isUsed: status === 'USED',
    cart:
      status === 'REPORTED'
        ? {
            partnerOrderId: dto.partnerOrderId?.trim() || null,
            orderValue: money(dto.orderValue),
            copay: money(dto.copayAmount),
            walletPaid: money(dto.walletPaid),
            memberPays: money(dto.memberPays),
            overLimit: money(dto.excessAmount),
            reportedAt: toDate(dto.reportedAt),
            paymentId: dto.paymentId?.trim() || null,
            payableHere: money(dto.payableHere),
          }
        : null,
  };
}
