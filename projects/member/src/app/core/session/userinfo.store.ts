import { Injectable, computed, signal } from '@angular/core';
import { AppError } from '../http/app-error';
import { AppService } from './../http/api.service';

@Injectable({ providedIn: 'root' })

export class UserInfoStore {
  private readonly _userInfo = signal<any | null>(null);

  readonly userInfo = this._userInfo.asReadonly();
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
  getApplicationMasterByUaser(){
    this.appService.getcall('application_master', 'account-management', 'queryId=GET_MY_CONFIG&args=dummy:dummy,account_url:wellnessdevhh.hclhealthcare.in&application=account-management').subscribe({
      next: (response: any) => {
        const parsed = JSON.parse(response);
        const resources: any[] = parsed?.resource ?? [];
        this._userInfo.set(resources);
      },
      error: () => {
        this._userInfo.set(null);
      }
    });
  }
  
}