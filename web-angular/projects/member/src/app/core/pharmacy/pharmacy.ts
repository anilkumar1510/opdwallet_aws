import { Money, money } from '../domain/money';

/**
 * Pharmacy (CAT002) — cart, adjudicate, pay. Mirrors the lab/diagnostics
 * cart->order shape, but under its own `member/pharmacy` prefix and with no
 * vendor/slot concept: the sheet names one implicit partner, not a choice.
 */
export const PHARMACY_API = {
  medicines: 'member/pharmacy/medicines',
  carts: 'member/pharmacy/carts',
  cartById: (cartId: string) => `member/pharmacy/carts/${cartId}`,
  cartItems: (cartId: string) => `member/pharmacy/carts/${cartId}/items`,
  cartItem: (cartId: string, medicineId: string) => `member/pharmacy/carts/${cartId}/items/${medicineId}`,
  orders: 'member/pharmacy/orders',
  orderById: (orderId: string) => `member/pharmacy/orders/${orderId}`,
  pay: (orderId: string) => `member/pharmacy/orders/${orderId}/pay`,
  cancel: (orderId: string) => `member/pharmacy/orders/${orderId}/cancel`,
  invoice: (orderId: string) => `member/pharmacy/orders/${orderId}/invoice`,
} as const;

export interface MedicineDto {
  medicineId?: string;
  name?: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  packSize?: string;
  price?: number;
  inStock?: boolean;
  requiresPrescription?: boolean;
}

export interface Medicine {
  readonly id: string;
  readonly name: string;
  readonly genericName: string | null;
  readonly category: string;
  readonly packSize: string | null;
  readonly price: Money;
  readonly inStock: boolean;
  readonly requiresPrescription: boolean;
}

export function toMedicine(dto: MedicineDto): Medicine {
  return {
    id: dto.medicineId ?? '',
    name: dto.name?.trim() || 'Medicine',
    genericName: dto.genericName?.trim() || null,
    category: dto.category?.trim() || 'General',
    packSize: dto.packSize?.trim() || null,
    price: money(dto.price),
    inStock: dto.inStock !== false,
    requiresPrescription: dto.requiresPrescription === true,
  };
}

export interface CartItemDto {
  medicineId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  requiresPrescription?: boolean;
}

export interface CartDto {
  _id?: string;
  cartId?: string;
  patientId?: string;
  patientName?: string;
  prescriptionFileName?: string;
  items?: CartItemDto[];
  status?: string;
}

export interface CartItem {
  readonly medicineId: string;
  readonly name: string;
  readonly price: Money;
  readonly quantity: number;
  readonly requiresPrescription: boolean;
  readonly lineTotal: Money;
}

export interface Cart {
  readonly id: string;
  readonly hasPrescription: boolean;
  readonly items: readonly CartItem[];
  readonly total: Money;
  /** True if any item needs a prescription the cart doesn't carry — shown before submit, not just after. */
  readonly hasUnmetPrescriptionRequirement: boolean;
}

export function toCart(dto: CartDto): Cart {
  const hasPrescription = !!dto.prescriptionFileName?.trim();
  const items = (dto.items ?? []).map((item) => {
    const quantity = item.quantity ?? 1;
    const price = money(item.price);
    return {
      medicineId: item.medicineId ?? '',
      name: item.name?.trim() || 'Medicine',
      price,
      quantity,
      requiresPrescription: item.requiresPrescription === true,
      lineTotal: money(price.amount * quantity),
    };
  });
  return {
    id: dto.cartId ?? '',
    hasPrescription,
    items,
    total: money(items.reduce((sum, item) => sum + item.lineTotal.amount, 0)),
    hasUnmetPrescriptionRequirement: !hasPrescription && items.some((item) => item.requiresPrescription),
  };
}

export interface OrderItemDto {
  medicineId?: string;
  name?: string;
  requestedQuantity?: number;
  price?: number;
  retained?: boolean;
  removedReason?: string;
}

export interface DeliveryAddressDto {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  city?: string;
  state?: string;
}

export interface OrderDto {
  _id?: string;
  orderId?: string;
  patientName?: string;
  items?: OrderItemDto[];
  deliveryAddress?: DeliveryAddressDto;
  status?: string;
  billAmount?: number;
  copayAmount?: number;
  walletDebitAmount?: number;
  excessAmount?: number;
  totalMemberPayment?: number;
  paymentId?: string;
  paymentStatus?: string;
  invoiceGenerated?: boolean;
  createdAt?: string;
  confirmedAt?: string;
}

export interface OrderItem {
  readonly medicineId: string;
  readonly name: string;
  readonly requestedQuantity: number;
  readonly price: Money;
  readonly retained: boolean;
  readonly removedReason: string | null;
}

export interface Order {
  readonly id: string;
  readonly patientName: string;
  readonly items: readonly OrderItem[];
  readonly retainedItems: readonly OrderItem[];
  readonly removedItems: readonly OrderItem[];
  /** Pre-composed for display, same convention as `Address.lines`. */
  readonly deliveryAddressLines: readonly string[];
  readonly status: string;
  readonly billAmount: Money;
  readonly copayAmount: Money;
  readonly walletDebitAmount: Money;
  readonly excessAmount: Money;
  readonly totalMemberPayment: Money;
  readonly paymentId: string | null;
  readonly paymentStatus: string;
  readonly invoiceGenerated: boolean;
  readonly walletWasDebited: boolean;
}

export function toOrder(dto: OrderDto): Order {
  const items = (dto.items ?? []).map((item) => ({
    medicineId: item.medicineId ?? '',
    name: item.name?.trim() || 'Medicine',
    requestedQuantity: item.requestedQuantity ?? 1,
    price: money(item.price),
    retained: item.retained !== false,
    removedReason: item.removedReason?.trim() || null,
  }));
  return {
    id: dto.orderId ?? '',
    patientName: dto.patientName?.trim() || 'Member',
    items,
    retainedItems: items.filter((item) => item.retained),
    removedItems: items.filter((item) => !item.retained),
    deliveryAddressLines: [
      dto.deliveryAddress?.addressLine1?.trim(),
      dto.deliveryAddress?.addressLine2?.trim(),
      [dto.deliveryAddress?.city?.trim(), dto.deliveryAddress?.state?.trim()].filter(Boolean).join(', '),
      dto.deliveryAddress?.pincode?.trim(),
    ].filter((line): line is string => Boolean(line)),
    status: dto.status?.trim().toUpperCase() || 'ON_HOLD',
    billAmount: money(dto.billAmount),
    copayAmount: money(dto.copayAmount),
    walletDebitAmount: money(dto.walletDebitAmount),
    excessAmount: money(dto.excessAmount),
    totalMemberPayment: money(dto.totalMemberPayment),
    paymentId: dto.paymentId?.trim() || null,
    paymentStatus: dto.paymentStatus?.trim().toUpperCase() || 'PENDING',
    invoiceGenerated: dto.invoiceGenerated === true,
    walletWasDebited: Boolean(dto.confirmedAt),
  };
}
