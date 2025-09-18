export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PolicyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

export enum OwnerPayerType {
  CORPORATE = 'CORPORATE',
  INSURER = 'INSURER',
  HYBRID = 'HYBRID',
}

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

export enum RelationshipType {
  SELF = 'SELF',
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  MOTHER = 'MOTHER',
  FATHER = 'FATHER',
  OTHER = 'OTHER',
}