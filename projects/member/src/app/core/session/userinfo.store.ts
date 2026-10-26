import { Injectable, computed, signal } from '@angular/core';
import { AppError } from '../http/app-error';
import { AppService } from './../http/api.service';

/**
 * Manages user identity and session configuration returned by GET_MY_CONFIG
 * (application_master API: /account-management/api/v1/application_master?queryId=GET_MY_CONFIG).
 *
 * NOTE FOR DEVELOPERS:
 * When the GET_FAMILY_LIST API (/account-management/api/v1/user_relationship_mapping) returns
 * family members, the backend omits the `uhId` field for the signed-in primary member (Self).
 * This store extracts the member's canonical `uhid` from `user_roles[0].uhid` or root properties
 * provided by GET_MY_CONFIG so other stores (FamilyStore, PolicyStore, WalletStore) can resolve
 * wallet accounts and passbook ledgers without hardcoded fallbacks.
 */
@Injectable({ providedIn: 'root' })
export class UserInfoStore {
  private readonly _userInfo = signal<any | null>(null);

  readonly userInfo = this._userInfo.asReadonly();
  /** Reactive signal holding the authenticated member's UHID from GET_MY_CONFIG. */
  readonly uhid = computed<string | null>(() => extractUhidFromUserInfo(this._userInfo()));
  readonly busy = signal(false).asReadonly();
  readonly error = signal<AppError | null>(null).asReadonly();
  readonly resolved = computed(() => true);
  readonly isAuthenticated = computed(() => true);

  constructor(private appService: AppService) {}

  async setUserInfo(userInfo: any): Promise<boolean> {
    this._userInfo.set(userInfo);
    this.appService.setCurrentSessionData('userInfo', userInfo);
    this.appService.setCurrentSessionData('encryptKey', userInfo[0]?.api_encryption_key ?? null);
    return true;
  }

  /**
   * Retrieves the authenticated member's UHID from either the active signal state
   * or the fallback session storage data populated during authGuard's GET_MY_CONFIG check.
   */
  getUhid(): string | null {
    return extractUhidFromUserInfo(this._userInfo() || this.appService.getCurrentSessionData('userInfo'));
  }

  restore(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async logout(): Promise<void> {
    /* no-op — there is no login to return to */
  }

  terminate(): void {
    /* no-op — the static session never ends */
  }

  captureRedirect(_url: string): void {
    /* no-op */
  }
  getUserInfo(): any {
    return this._userInfo();
  }
  /** Forgets the user, e.g. when the session is refused. */
  clear(): void {
    this._userInfo.set(null);
    this.appService.setCurrentSessionData('userInfo', []);
    this.appService.setCurrentSessionData('encryptKey', '');
  }
}

/**
 * Extracts the user's canonical UHID from the GET_MY_CONFIG (application_master) session response.
 *
 * Background:
 * GET_MY_CONFIG returns an array of resource objects where user roles contain `{ uhid: "HH-...", role_name: "Patient" }`.
 * This helper inspects both direct properties (`item.uhid`, `item.uhId`) and entries in `item.user_roles`,
 * providing a reliable fallback when GET_FAMILY_LIST omits the primary member's UHID.
 */
export function extractUhidFromUserInfo(userInfo: any): string | null {
  if (!userInfo) return null;
  const list = Array.isArray(userInfo) ? userInfo : [userInfo];
  for (const item of list) {
    if (!item) continue;
    if (typeof item.uhid === 'string' && item.uhid.trim()) {
      return item.uhid.trim();
    }
    if (typeof item.uhId === 'string' && item.uhId.trim()) {
      return item.uhId.trim();
    }
    if (Array.isArray(item.user_roles)) {
      for (const role of item.user_roles) {
        if (typeof role?.uhid === 'string' && role.uhid.trim()) {
          return role.uhid.trim();
        }
        if (typeof role?.uhId === 'string' && role.uhId.trim()) {
          return role.uhId.trim();
        }
      }
    }
  }
  return null;
}
