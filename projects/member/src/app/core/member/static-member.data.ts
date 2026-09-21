import { Relationship } from '../domain/codes';
import { Member } from './member.model';

/**
 * DUMMY / STATIC signed-in member — zero backend.
 *
 * With the login page removed, the app opens straight into the member area as
 * Shivam Jha. The family itself now comes from `user_relationship_mapping`
 * (GET_FAMILY_LIST) via FamilyStore.load(); only the signed-in member stays
 * static here. Replaces the `auth/me` + `member/profile` identity. See
 * REMOVED-APIS.md.
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


