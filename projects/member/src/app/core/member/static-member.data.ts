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
  id: '62381260-cc83-11f1-9ef8-4270a1b31eb1-60',
  memberId: '97945158-c95c-11f1-9ab3-062314d4b409-18',
  firstName: 'Shailab',
  lastName: '',
  fullName: 'Mr Shailab',
  initials: 'MS',
  email: 'Shailabhopd@yopmail.com',
  phone: '8826395311',
  relationship: Relationship.Self,
  relationshipCode: 'self',
  isPrimary: true,
  uhid: 'HH-448725',
  dateOfBirth: null,
  gender: 'MALE',
};


