import { isPrimary, toDate, toRelationship } from '../domain/codes';
import { LoginResponseDto, MemberProfileDto, NameDto, UserDto } from './member.dto';
import { Member } from './member.model';

/**
 * Every URL these resources use, beside the shapes they return. Changing an
 * endpoint means editing this file only.
 */
export const AUTH_API = {
  login: 'auth/login',
  logout: 'auth/logout',
  me: 'auth/me',
  /*
   * REMOVED — `auth/refresh`. The API serves it (`auth.controller.ts:70`) and
   * login does return a `refreshToken`, so this is an unused API capability
   * rather than a missing portal feature.
   *
   * NOT ported, deliberately: neither web-member nor web-member-rn implements a
   * refresh flow — both ride the 7-day JWT, and `api/.env` is pinned at
   * `JWT_EXPIRY=7d` for this audit. Building one here would invent
   * authentication behaviour with no reference to check it against, on the one
   * code path where getting it wrong logs members out or keeps them signed in
   * when they should not be.
   *
   * If session length ever shortens, this is the endpoint to wire, and it should
   * be designed rather than copied from a declaration.
   */
} as const;

export const MEMBER_API = {
  profile: 'member/profile',
  family: 'member/family',
  addresses: 'member/addresses',
  policyCurrent: (policyId: string) => `policies/${policyId}/current`,
  /*
   * REMOVED — `assignments/my-policy`. React fetches it to derive the copay
   * percentage CLIENT-SIDE (`lib/paymentValidator.ts:69-120`). Angular does not
   * need it: the copay comes back on the cover-check response and is the
   * server's own computation (`core/domain/cover-check.ts`).
   *
   * This is a divergence where Angular is the safer one. React's fallback when
   * the fetch fails is `percentage: 0` — a failed policy read silently charges
   * the member NO copay, which is a money error presented as a working screen.
   */
} as const;

function splitName(dto: UserDto): { firstName: string; lastName: string } {
  // The API sends `name` as an object on some endpoints and a flat string on
  // others, and occasionally only `fullName`. Normalise all three here so no
  // screen has to.
  if (dto.name && typeof dto.name === 'object') {
    const name = dto.name as NameDto;
    return { firstName: name.firstName?.trim() ?? '', lastName: name.lastName?.trim() ?? '' };
  }
  const flat = (typeof dto.name === 'string' ? dto.name : dto.fullName)?.trim() ?? '';
  if (!flat) return { firstName: '', lastName: '' };
  const [first, ...rest] = flat.split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') };
}

function initialsOf(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return initials.trim() || '?';
}

function toGender(value: string | undefined): Member['gender'] {
  const normalised = value?.trim().toUpperCase();
  return normalised === 'MALE' || normalised === 'FEMALE' || normalised === 'OTHER'
    ? normalised
    : null;
}

export function toMember(dto: UserDto): Member {
  const { firstName, lastName } = splitName(dto);
  const relationship = toRelationship(dto.relationship);
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  return {
    // Login sends `id`, everything else `_id`. Without this fallback the
    // session member has no id, and every "is this me?" comparison fails.
    id: dto._id ?? dto.id ?? '',
    memberId: dto.memberId ?? '',
    firstName,
    lastName,
    // Never render an empty name; the member id is a stable last resort.
    fullName: fullName || dto.memberId || 'Member',
    initials: initialsOf(firstName, lastName),
    email: dto.email?.trim() || null,
    phone: dto.phone?.trim() || dto.phoneNumber?.trim() || null,
    relationship,
    isPrimary: isPrimary(relationship),
    uhid: dto.uhid?.trim() || null,
    dateOfBirth: toDate(dto.dob ?? dto.dateOfBirth),
    gender: toGender(dto.gender),
  };
}

/** Login echoes the user both at the top level and nested; prefer the nested one. */
export function toMemberFromLogin(dto: LoginResponseDto): Member {
  return toMember(dto.user ?? dto);
}

/**
 * The family is the signed-in member plus their dependents, de-duplicated —
 * `familyMembers` sometimes already contains the signed-in member and
 * sometimes does not, depending on the endpoint.
 */
export function toFamily(dto: MemberProfileDto): { self: Member; family: readonly Member[] } {
  const self = toMember(dto.user);
  const others = [...(dto.dependents ?? []), ...(dto.familyMembers ?? [])].map(toMember);

  const byId = new Map<string, Member>([[self.id, self]]);
  for (const member of others) {
    if (member.id && !byId.has(member.id)) byId.set(member.id, member);
  }

  // Signed-in member first, then dependents in the order the API returned them.
  return { self, family: [...byId.values()] };
}
