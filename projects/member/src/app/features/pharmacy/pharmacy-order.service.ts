import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { AppService } from '../../core/http/api.service';
import { PharmacyOrderPage, toPharmacyOrder } from './pharmacy-order.model';

const APPLICATION = 'habit-opd';
const RESOURCE = 'opd_pharmacy_cart';
const QUERY_ID = 'GET_PHARMACY_CART_BY_USER';

/**
 * Reads the member's past pharmacy bookings, one page at a time.
 *
 * Paging is server-side: `count` is the total across all pages while `resource`
 * holds only the current page, so a page shorter than the requested size is the
 * end of the list. `page_no` is zero-based, matching `GET_CLAIMS_BY_USER`.
 */
@Injectable({ providedIn: 'root' })
export class PharmacyOrderService {
  private readonly http = inject(HttpClient);
  private readonly appService = inject(AppService);

  async list(pageNo: number, pageSize: number): Promise<PharmacyOrderPage> {
    const arg = `queryId=${QUERY_ID}&page_no=${pageNo}&page_size=${pageSize}`;
    // No catch: an empty page and a failed request must stay distinguishable, or a
    // failure renders as "you have no past orders".
    const raw = await this.appService.getcall(RESOURCE, APPLICATION, arg).toPromise();
    return this.parse(raw);
  }

  private parse(raw: unknown): PharmacyOrderPage {
    const parsed = this.asJson(raw);
    // A refusal arrives as 200 with errCode -1 and no `resource` at all, so this
    // must not assume the key exists.
    const resource = parsed?.['resource'];
    const rows: unknown[] = Array.isArray(resource) ? resource : [];
    const total = num(parsed?.['count']);
    return {
      orders: rows.map(toPharmacyOrder).filter((order): order is NonNullable<typeof order> => order !== null),
      count: total ?? rows.length,
      hasTotal: total !== null,
    };
  }

  private asJson(raw: unknown): Record<string, unknown> | null {
    if (typeof raw === 'string') {
      try {
        const parsed: unknown = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
      } catch {
        return null;
      }
    }
    return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
  }
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(typeof value === 'string' ? value.trim() : NaN);
  return Number.isFinite(parsed) ? parsed : null;
}
