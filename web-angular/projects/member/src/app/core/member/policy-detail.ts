/**
 * GET /policies/:policyId/current — the member-readable view of a policy,
 * with its current plan config folded in.
 *
 * Note `validTill` arrives already formatted ("27 Apr 2026"), not as an ISO
 * timestamp, so it is passed through as a string rather than parsed. Parsing
 * and reformatting it would only risk turning a correct date into an
 * Invalid Date on a locale the API did not have in mind.
 *
 * Small read-only resource, so dto/model/mapper live in one file — same as
 * address.ts.
 */
export interface PolicyDescriptionEntryDto {
  headline?: string;
  description?: string;
}

export interface PolicyDetailDto {
  policyNumber?: string;
  policyName?: string;
  corporateName?: string;
  validTill?: string;
  policyDescription?: {
    inclusions?: PolicyDescriptionEntryDto[];
    exclusions?: PolicyDescriptionEntryDto[];
  };
}

export interface PolicyClause {
  readonly headline: string;
  readonly description: string | null;
}

export interface PolicyDetail {
  readonly policyNumber: string;
  readonly policyName: string;
  readonly corporateName: string;
  readonly validTill: string;
  readonly inclusions: readonly PolicyClause[];
  readonly exclusions: readonly PolicyClause[];
}

function toClauses(entries: PolicyDescriptionEntryDto[] | undefined): readonly PolicyClause[] {
  return (entries ?? [])
    .map((entry) => ({
      headline: entry.headline?.trim() ?? '',
      // The API writes "NA" when there is nothing to say; that is noise to a member.
      description:
        entry.description?.trim() && entry.description.trim().toUpperCase() !== 'NA'
          ? entry.description.trim()
          : null,
    }))
    .filter((clause) => clause.headline.length > 0);
}

export function toPolicyDetail(dto: PolicyDetailDto): PolicyDetail {
  return {
    policyNumber: dto.policyNumber?.trim() || 'N/A',
    policyName: dto.policyName?.trim() || 'Policy',
    corporateName: dto.corporateName?.trim() || 'Individual',
    validTill: dto.validTill?.trim() || 'No expiry',
    inclusions: toClauses(dto.policyDescription?.inclusions),
    exclusions: toClauses(dto.policyDescription?.exclusions),
  };
}
