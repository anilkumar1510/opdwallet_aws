import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { toStatus } from '../claims/claim.mapper';
import { ClaimsStore } from '../claims/claims.store';
import { AppService } from '../http/api.service';

/** What the Claims page asks for: `ClaimsStore` loads one page of this size. */
export const CLAIMS_PAGE_SIZE = 20;

/**
 * What this pager asks for. The real listing does not page reliably: walking it
 * 20 at a time returned 39 rows but only 20 distinct claims (every later page
 * repeated the first), so claims were never reachable. A single large page
 * returns them all, so that is what is asked for; only a member with more than
 * this would need a second page.
 */
export const PAGER_SIZE = 100;

export type ClaimPageResult =
  | { readonly ok: true; readonly rows: readonly any[]; /** A full page: there may be another. */ readonly full: boolean }
  | { readonly ok: false };

/**
 * More of the member's claims than `ClaimsStore` loads.
 *
 * `ClaimsStore.getClimListData()` only ever loads one page of 20, so a member
 * with more claims would never see the older ones on the Support page. This
 * reads large pages of the same listing (`GET_CLAIMS_BY_USER`) and maps each row
 * the way the store does, so both can be merged. The store is not changed.
 */
@Injectable({ providedIn: 'root' })
export class ClaimPages {
  private readonly appService = inject(AppService);
  private readonly claims = inject(ClaimsStore);
  private labels: Map<string, string> | null = null;
  private codes: Map<string, string> | null = null;

  async page(pageNo: number): Promise<ClaimPageResult> {
    try {
      const labels = await this.categoryLabels();
      const res = await firstValueFrom(
        this.appService.getcall('claim', 'habit-opd', `queryId=GET_CLAIMS_BY_USER&page_no=${pageNo}&page_size=${PAGER_SIZE}`),
      );
      const body = JSON.parse(res);
      if (body?.errCode === -1) return { ok: false };
      const raw: any[] = body?.resource ?? [];
      return {
        ok: true,
        full: raw.length >= PAGER_SIZE,
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

  /**
   * The claim's own category code (AHC, DENTAL, IN_CLINIC, LABS, ONLINE_CONSULTATION,
   * PHARMACY, …) for the label shown to the member, or null when the label is not a
   * known display name (it is then already the code).
   */
  async categoryCodeOf(label: string): Promise<string | null> {
    await this.categoryLabels();
    return this.codes!.get(label) ?? null;
  }

  private async categoryLabels(): Promise<Map<string, string>> {
    if (!this.labels) {
      const cats = await this.claims.categories();
      this.labels = new Map(cats.map((c) => [c.claimCategory, c.name]));
      this.codes = new Map(cats.map((c) => [c.name, c.claimCategory]));
    }
    return this.labels;
  }
}
