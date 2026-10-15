import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { toStatus } from '../claims/claim.mapper';
import { ClaimsStore } from '../claims/claims.store';
import { AppService } from '../http/api.service';

/** The claims listing returns 20 a page, the same as the Claims page asks for. */
export const CLAIMS_PAGE_SIZE = 20;

export type ClaimPageResult =
  | { readonly ok: true; readonly rows: readonly any[]; /** A full page: there may be another. */ readonly full: boolean }
  | { readonly ok: false };

/**
 * Pages after the first of the member's claims.
 *
 * `ClaimsStore.getClimListData()` only ever loads page 0, so a member with more
 * than 20 claims would never see the older ones on the Support page. This reads
 * the next pages of the same listing (`GET_CLAIMS_BY_USER`) and maps each row the
 * way the store does, so both can be merged. The store is not changed.
 */
@Injectable({ providedIn: 'root' })
export class ClaimPages {
  private readonly appService = inject(AppService);
  private readonly claims = inject(ClaimsStore);
  private labels: Map<string, string> | null = null;

  async page(pageNo: number): Promise<ClaimPageResult> {
    try {
      const labels = await this.categoryLabels();
      const res = await firstValueFrom(
        this.appService.getcall('claim', 'habit-opd', `queryId=GET_CLAIMS_BY_USER&page_no=${pageNo}&page_size=${CLAIMS_PAGE_SIZE}`),
      );
      const body = JSON.parse(res);
      if (body?.errCode === -1) return { ok: false };
      const raw: any[] = body?.resource ?? [];
      return {
        ok: true,
        full: raw.length >= CLAIMS_PAGE_SIZE,
        rows: raw.map((row) => ({
          ...row,
          category: row?.category && labels.has(row.category) ? labels.get(row.category) : row?.category,
          provider: row?.provider ?? row?.providerName ?? '',
          status: toStatus(row?.claim_status ?? row?.status),
        })),
      };
    } catch (error) {
      console.error('Failed to load more claims:', error);
      return { ok: false };
    }
  }

  private async categoryLabels(): Promise<Map<string, string>> {
    if (!this.labels) {
      const cats = await this.claims.categories();
      this.labels = new Map(cats.map((c) => [c.claimCategory, c.name]));
    }
    return this.labels;
  }
}
