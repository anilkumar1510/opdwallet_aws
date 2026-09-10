import { Injectable, computed, signal } from '@angular/core';

import { AppError } from '../http/app-error';
import { Address, AddressInput } from './address';

/**
 * Saved addresses — DUMMY / STATIC, zero backend.
 *
 * Replaces the `member/addresses` GET/POST. Held in memory; save() adds or
 * updates. Public surface unchanged. See REMOVED-APIS.md.
 */

function toAddress(id: string, input: AddressInput): Address {
  const type = input.addressType.trim().toUpperCase();
  return {
    id,
    typeLabel: type.charAt(0) + type.slice(1).toLowerCase(),
    lines: [input.addressLine1, input.addressLine2 ?? ''].filter((l) => l && l.trim()),
    pincode: input.pincode || null,
    city: input.city || null,
    state: input.state || null,
    isDefault: input.isDefault === true,
    input,
  };
}

const SEED: Address[] = [
  toAddress('a1', { addressType: 'HOME', addressLine1: 'B-402, Green Avenue', addressLine2: 'Sector 45', city: 'Gurugram', state: 'Haryana', pincode: '122003', isDefault: true }),
  toAddress('a2', { addressType: 'WORK', addressLine1: 'DLF Cyber City, Tower B', addressLine2: 'Phase 2', city: 'Gurugram', state: 'Haryana', pincode: '122002' }),
];

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly _addresses = signal<readonly Address[]>([...SEED]);
  private seq = 2;

  readonly addresses = this._addresses.asReadonly();
  readonly loading = signal(false).asReadonly();
  readonly error = signal<AppError | null>(null).asReadonly();
  readonly saving = signal(false).asReadonly();
  readonly saveError = signal<AppError | null>(null).asReadonly();

  readonly pincode = computed(() => {
    const list = this._addresses();
    return (list.find((a) => a.isDefault) ?? list[0])?.pincode ?? null;
  });

  retry(): void {
    /* static — nothing to refetch */
  }

  async load(): Promise<void> {
    /* static — already seeded */
  }

  async save(input: AddressInput, id?: string): Promise<Address | null> {
    const addr = toAddress(id ?? 'a' + ++this.seq, input);
    const list = this._addresses();
    // A new default clears the flag on the others.
    const cleared = addr.isDefault ? list.map((a) => ({ ...a, isDefault: false })) : list;
    this._addresses.set(id ? cleared.map((a) => (a.id === id ? addr : a)) : [...cleared, addr]);
    return addr;
  }
}
