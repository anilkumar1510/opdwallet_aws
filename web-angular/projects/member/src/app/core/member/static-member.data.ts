import { Relationship } from '../domain/codes';
import { Member } from './member.model';

/**
 * DUMMY / STATIC signed-in member + family — zero backend.
 *
 * With the login page removed, the app opens straight into the member area as
 * Shivam Jha (primary) with Sayani Kumari (spouse) as a dependant. Replaces the
 * `auth/me` + `member/profile` identity. See REMOVED-APIS.md.
 */

export const STATIC_SELF: Member = {
  id: 'shivam',
  memberId: 'MEM35637',
  firstName: 'Shivam',
  lastName: 'Jha',
  fullName: 'Shivam Jha',
  initials: 'SJ',
  email: 'shivam@example.com',
  phone: '9876500000',
  relationship: Relationship.Self,
  isPrimary: true,
  uhid: 'UHID35637',
  dateOfBirth: new Date('1996-05-14'),
  gender: 'MALE',
};

const SPOUSE: Member = {
  id: 'sayani',
  memberId: 'UHID43673',
  firstName: 'Sayani',
  lastName: 'Kumari',
  fullName: 'Sayani Kumari',
  initials: 'SK',
  email: 'sayani@example.com',
  phone: '9876511111',
  relationship: Relationship.Spouse,
  isPrimary: false,
  uhid: 'UHID43673',
  dateOfBirth: new Date('1999-01-23'),
  gender: 'FEMALE',
};

export const STATIC_FAMILY: readonly Member[] = [STATIC_SELF, SPOUSE];
