/**
 * Money is a domain type so no template ever receives a bare number that is
 * really an amount. The API sends plain rupee numbers; the currency is not in
 * the payload, so it is fixed here rather than guessed per screen.
 */
export interface Money {
  readonly amount: number;
  readonly currency: 'INR';
}

export const ZERO: Money = { amount: 0, currency: 'INR' };

export function money(amount: number | null | undefined): Money {
  return { amount: Number.isFinite(amount) ? Number(amount) : 0, currency: 'INR' };
}

const FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatMoney(value: Money): string {
  return FORMATTER.format(value.amount);
}

export function isZero(value: Money): boolean {
  return value.amount <= 0;
}

const COMPACT = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 0,
});

/**
 * The short cap the dashboard prints beside a balance: 20,000 -> "20k".
 *
 * Only the thousands suffix is lowercased. "1L" must not become "1l", which
 * reads as a one, and lakh is the common allocation size here.
 */
export function formatCompact(value: Money): string {
  return COMPACT.format(value.amount).replace('K', 'k');
}
