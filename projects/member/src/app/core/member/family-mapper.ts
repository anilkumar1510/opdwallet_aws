/**
 * Maps `user_relationship_mapping GET_FAMILY_LIST` resources to Member.
 *
 * ponytail: this is a leaf module — it duplicates RELATIONSHIP_BY_CODE from
 * ../domain/codes.ts because a `.ts`-suffixed import fails the app build
 * (TS5097: no allowImportingTsExtensions) and an extensionless import fails
 * under Node (ERR_MODULE_NOT_FOUND), which the check file needs. Same trade
 * as booking-when.ts. If the build ever allows `.ts` imports, delete the
 * table here and import from codes.ts.
 */

export const Relationship = {
  Self: 'SELF',
  Spouse: 'SPOUSE',
  Son: 'SON',
  Daughter: 'DAUGHTER',
  Father: 'FATHER',
  Mother: 'MOTHER',
  Brother: 'BROTHER',
  Sister: 'SISTER',
  FatherInLaw: 'FATHER_IN_LAW',
  MotherInLaw: 'MOTHER_IN_LAW',
  Unknown: 'UNKNOWN',
} as const;

export type Relationship = (typeof Relationship)[keyof typeof Relationship];

const RELATIONSHIP_BY_CODE: ReadonlyMap<string, Relationship> = new Map([
  ['REL001', Relationship.Self],
  ['SELF', Relationship.Self],
  ['REL002', Relationship.Spouse],
  ['SPOUSE', Relationship.Spouse],
  ['REL003', Relationship.Son],
  ['SON', Relationship.Son],
  ['REL004', Relationship.Daughter],
  ['DAUGHTER', Relationship.Daughter],
  ['REL005', Relationship.Father],
  ['FATHER', Relationship.Father],
  ['REL006', Relationship.Mother],
  ['MOTHER', Relationship.Mother],
  ['REL007', Relationship.Brother],
  ['BROTHER', Relationship.Brother],
  ['REL008', Relationship.Sister],
  ['SISTER', Relationship.Sister],
  ['REL009', Relationship.FatherInLaw],
  ['FATHER_IN_LAW', Relationship.FatherInLaw],
  ['REL010', Relationship.MotherInLaw],
  ['MOTHER_IN_LAW', Relationship.MotherInLaw],
]);

function toRelationship(code: string | null | undefined): Relationship {
  if (!code) return Relationship.Unknown;
  return RELATIONSHIP_BY_CODE.get(code.trim().toUpperCase()) ?? Relationship.Unknown;
}

/** One element of the `resource` array returned by GET_FAMILY_LIST. */
export interface FamilyMemberResource {
  id: string;
  mapped_id: string;
  mapped_name: string;
  relationship_code: string;
  uhId: string;
  telecom: string;
  dob: string;
  gender_id: string;
}

function toGender(value: string | undefined): 'MALE' | 'FEMALE' | 'OTHER' | null {
  const normalised = value?.trim().toUpperCase();
  return normalised === 'MALE' || normalised === 'FEMALE' || normalised === 'OTHER'
    ? normalised
    : null;
}

/** The API sends dob as DD/MM/YYYY, which `new Date()` misparses. */
function toDob(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  // Reject rollovers like 31/02/2020.
  return date.getDate() === day && date.getMonth() === month - 1 ? date : null;
}

function splitName(full: string | undefined): { firstName: string; lastName: string } {
  const flat = full?.trim() ?? '';
  if (!flat) return { firstName: '', lastName: '' };
  const [first, ...rest] = flat.split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') };
}

function initialsOf(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return initials.trim() || '?';
}

export function toFamilyMember(resource: FamilyMemberResource, userId: string) {
  const { firstName, lastName } = splitName(resource.mapped_name);
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  // The API omits relationship_code on the signed-in member's own record.
  const isSelf = !resource.relationship_code || resource.mapped_id === userId;
  const relationship = isSelf ? Relationship.Self : toRelationship(resource.relationship_code);

  return {
    id: resource.id,
    memberId: resource.mapped_id,
    firstName,
    lastName,
    fullName: fullName || resource.mapped_id || 'Member',
    initials: initialsOf(firstName, lastName),
    email: null,
    phone: resource.telecom?.trim() || null,
    relationship,
    isPrimary: relationship === Relationship.Self,
    uhid: resource.uhId?.trim() || null,
    dateOfBirth: toDob(resource.dob),
    gender: toGender(resource.gender_id),
  };
}