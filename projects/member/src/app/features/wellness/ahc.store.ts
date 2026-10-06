import { Injectable, computed, signal } from '@angular/core';
import { AppService } from './../../core/http/api.service';

@Injectable({ providedIn: 'root' })

export class AHCStore {
    private readonly _ahcList = signal<any | null>(null);
    private readonly _ahcSelectedItem = signal<any | null>(null);
    readonly AHC = this._ahcList.asReadonly();
    readonly AHCSelectedItem = this._ahcSelectedItem.asReadonly();
    readonly resolved = computed(() => true);
    constructor(private appService: AppService) {}
    async setAHCListInfo(ahc: any): Promise<boolean> {
        this._ahcList.set(ahc);
        return true;
    }

    restore(): Promise<boolean> {
        return Promise.resolve(true);
    }

    getAHCList(userId: string){
        const queryId = 'GET_MY_BENEFIT_SERVICE_ITEM';
        const args = 'user_id:' + userId + ',service_type_code:phc';
        this.appService.getcall('user_benefit_plan_service_item', 'master-management', 'queryId=' + queryId + '&args=' + args+'&application=master-management').subscribe({
            next: (response: any) => {
                const parsed = JSON.parse(response);
                const resources: any[] = parsed?.resource ?? [];
                this._ahcList.set(resources);
            },
            error: () => {
                this._ahcList.set(null);
            }
        });
    }
    
}