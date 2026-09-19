import assert from 'node:assert/strict';
import { Relationship, toFamilyMember } from './family-mapper.ts';

const self = toFamilyMember(
  {
    id: 'r1',
    mapped_id: 'MEM35637',
    mapped_name: 'Shivam Kumar',
    relationship_code: '',
    uhId: 'UHID123',
    telecom: '9876543210',
    dob: '14/05/1996',
    gender_id: 'male',
  },
  'MEM35637',
);

assert.equal(self.relationship, Relationship.Self);
assert.equal(self.isPrimary, true);
assert.equal(self.fullName, 'Shivam Kumar');
assert.equal(self.firstName, 'Shivam');
assert.equal(self.lastName, 'Kumar');
assert.equal(self.initials, 'SK');
assert.equal(self.uhid, 'UHID123');
assert.equal(self.phone, '9876543210');
assert.equal(self.dateOfBirth?.getFullYear(), 1996);
assert.equal(self.dateOfBirth?.getMonth(), 4); // May
assert.equal(self.dateOfBirth?.getDate(), 14);
assert.equal(self.gender, 'MALE');

const father = toFamilyMember(
  {
    id: 'r2',
    mapped_id: 'MEM999',
    mapped_name: 'Ramesh Kumar',
    relationship_code: 'father',
    uhId: '',
    telecom: '',
    dob: '01/01/1960',
    gender_id: 'MALE',
  },
  'MEM35637',
);

assert.equal(father.relationship, Relationship.Father);
assert.equal(father.isPrimary, false);
assert.equal(father.uhid, null);
assert.equal(father.phone, null);

const unknown = toFamilyMember(
  {
    id: 'r3',
    mapped_id: 'MEM888',
    mapped_name: '',
    relationship_code: 'REL999',
    uhId: '',
    telecom: '',
    dob: '31/02/2020',
    gender_id: 'x',
  },
  'MEM35637',
);

assert.equal(unknown.relationship, Relationship.Unknown);
assert.equal(unknown.fullName, 'MEM888');
assert.equal(unknown.initials, '?');
assert.equal(unknown.dateOfBirth, null);
assert.equal(unknown.gender, null);

console.log('family-mapper.check: ok');