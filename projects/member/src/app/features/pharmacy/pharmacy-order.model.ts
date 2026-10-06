/**
 * Past pharmacy bookings from `habit-opd/api/v1/opd_pharmacy_booking`.
 *
 * Deliberately separate from `PharmacyAddress`: that models the
 * `master-management` order_address contract, which names its fields
 * `street1`/`house_flat_no`. These rows carry their own `address` block whose
 * streets are encrypted under a different key, so the two must not be merged.
 */

export interface PharmacyOrder {
  readonly id: string;
  /** The booking reference, e.g. `OPD-2026-00027`. Shown as both the id and the title. */
  readonly name: string;
  readonly createdAt: number;
  /** Absent from the current payload; the API is expected to add `totalItems`. */
  readonly totalItems: number | null;
  /** Absent from the current payload; the API is expected to add `totalAmount`. */
  readonly totalAmount: number | null;
  /** Absent from the current payload; the API is expected to add `status`. */
  readonly status: string | null;
  /** City, state and pincode — plaintext in the row, unlike the street fields. */
  readonly locality: string;
}

export interface PharmacyOrderPage {
  readonly orders: readonly PharmacyOrder[];
  /** Total rows matching the query, used to decide whether another page exists. */
  readonly count: number;
  /**
   * Whether the API actually sent `count`. False means the total is unknown and
   * `count` is only this page's row count, so page navigation cannot be offered.
   */
  readonly hasTotal: boolean;
}

interface Row {
  readonly id?: unknown;
  readonly name?: unknown;
  readonly g_creation_time?: unknown;
  readonly totalItems?: unknown;
  readonly totalAmount?: unknown;
  readonly status?: unknown;
  readonly address?: unknown;
}

const str = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value);

/** `totalItems`/`totalAmount` may arrive as strings; anything non-numeric becomes null. */
const num = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(str(value));
  return Number.isFinite(parsed) && str(value) !== '' ? parsed : null;
};

function toLocality(address: unknown): string {
  if (typeof address !== 'object' || address === null) return '';
  const row = address as Record<string, unknown>;
  return [row['cityDisplayName'], row['stateDisplayName'], row['pincode']]
    .map(str)
    .filter((part) => part.length > 0)
    .join(', ');
}

export function toPharmacyOrder(dto: unknown): PharmacyOrder | null {
  if (typeof dto !== 'object' || dto === null) return null;
  const row = dto as Row;

  const name = str(row.name);
  return {
    // `id` keys the list; `name` is what the member recognises, so it is displayed.
    id: str(row.id) || name,
    name,
    createdAt: num(row.g_creation_time) ?? 0,
    totalItems: num(row.totalItems),
    totalAmount: num(row.totalAmount),
    status: str(row.status) || null,
    locality: toLocality(row.address),
  };
}