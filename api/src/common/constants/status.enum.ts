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

export enum EmployeeCount {
  ZERO_TO_500 = '0-500',
  FIVE_HUNDRED_TO_1000 = '500-1000',
  ONE_THOUSAND_TO_5000 = '1000-5000',
  FIVE_THOUSAND_TO_10000 = '5000-10000',
  TEN_THOUSAND_PLUS = '10000+',
}