import { Money } from '../domain/money';

export interface WalletPoolCategory {
  readonly label: string;
  readonly used: Money;
}

/** A pool of balance shared by several benefit categories. */
export interface WalletPool {
  readonly id: string;
  readonly code: string;
  readonly available: Money;
  readonly allocated: Money;
  /** What the pool pays for, as the policy words it. */
  readonly description: string;
  readonly categories: readonly WalletPoolCategory[];
}
