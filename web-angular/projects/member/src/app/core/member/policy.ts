import { toDate } from '../domain/codes';
import { AssignmentDto } from './member.dto';

/** One policy as the dashboard card and the wallet screen present it. */
export interface Policy {
  readonly id: string;
  readonly holderId: string;
  readonly holderName: string;
  readonly policyNumber: string;
  readonly corporate: string;
  /** The assignment's own period — when this member is actually covered. */
  readonly validFrom: Date | null;
  readonly validTill: Date | null;
}

export function toPolicies(assignments: readonly AssignmentDto[] | undefined): readonly Policy[] {
  return (assignments ?? []).map((dto) => {
    const inner = dto.assignment ?? null;
    const policy = inner?.policyId;

    return {
      // Fall back to the member id so a member without a policy still gets a
      // stable card key rather than colliding on an empty string.
      id: policy?._id ?? dto.userId ?? '',
      holderId: dto.userId ?? '',
      holderName: dto.memberName?.trim() || 'Member',
      policyNumber: policy?.policyNumber?.trim() || 'N/A',
      // The API calls it companyName on some policies and company on others.
      corporate: policy?.companyName?.trim() || policy?.company?.trim() || 'Individual',
      // The assignment period wins over the policy period: a member can be
      // assigned for a shorter window than the policy itself runs.
      validFrom: toDate(inner?.effectiveFrom ?? policy?.effectiveFrom),
      validTill: toDate(inner?.effectiveTo ?? policy?.effectiveTo),
    };
  });
}
