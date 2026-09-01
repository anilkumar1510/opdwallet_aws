import { Relationship } from '../domain/codes';

/**
 * The domain model every screen works with. No `_id`, no relationship code,
 * no date strings.
 */
export interface Member {
  readonly id: string;
  readonly memberId: string;
  readonly firstName: string;
  readonly lastName: string;
  /** Pre-composed so templates never concatenate name parts themselves. */
  readonly fullName: string;
  readonly initials: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly relationship: Relationship;
  readonly isPrimary: boolean;
  readonly uhid: string | null;
  readonly dateOfBirth: Date | null;
  readonly gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
}
