import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppService } from '../../core/http/api.service';
import { LocationStore } from '../../core/location/location.store';
import { BookingsStore } from '../../core/bookings/bookings.store';
import { PaymentGatewayService, PaymentRequest } from '../../core/payment/payment-gateway.service';
import { PolicyStore } from '../../core/member/policy.store';
import { FamilyStore } from '../../core/family/family.store';

/** One saved collection address, decrypted and ready to show. */
export interface CollectionAddress {
    id: string;
    /** `address_type` from the API — Home, Work, Other or whatever was saved. */
    type: string;
    line1: string;
    line2: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
}

/**
 * One bookable leg of the package — an entry of
 * `data.benefits_package_service_tiles` in the AHC_PACKAGE_DETAIL response.
 */
export interface AhcServiceTile {
    id: string;
    /** As sent: 'PATHOLOGY' or 'RADIOLOGY'. */
    serviceType: string;
    order: number;
    /** `serviceItemInfo` arrives as an array of arrays; flattened here. */
    serviceItems: any[];
    raw: any;
}

/**
 * One lab offering one leg of the package — a `service_item` entry of a
 * phc_detail row. The same leg (e.g. pathology) is offered by several labs.
 */
export interface AhcLab {
    /** phc_detail row id + service item code: unique per lab and leg. */
    id: string;
    providerName: string;
    /** `provider_code` — matched against the provider listing to pre-select it. */
    providerCode: string;
    /** As sent, upper-cased: 'PATHOLOGY' or 'RADIOLOGY'. */
    serviceType: string;
    serviceItemName: string;
    serviceItemCode: string;
    /** Profile names in `profile_test_catalog`, e.g. "Lipid", "Thyroid". */
    profiles: string[];
    testCount: number;
    /** The `service_item` entry, sent to the provider, centre and slot calls. */
    serviceItem: any;
    /** The phc_detail row it came from. */
    raw: any;
}

/** What the member picked on the first screen, kept for the later steps. */
export interface AhcSelectedService {
    leg: 'pathology' | 'radiology' | 'package';
    tile: AhcServiceTile | null;
    /** The package row the leg came from; with `lab`, the lab's phc_detail row. */
    package: any;
    /** The lab picked for this leg, when the package offers a choice of labs. */
    lab?: AhcLab | null;
}

/** One row of AHC_PROVIDER_LISTING, with the fields the screens use pulled out. */
export interface AhcProvider {
    id: string;
    name: string;
    /** `provider_code` — sent to the slot query. */
    code: string;
    /** `center_code` — sent to the slot query. */
    centreCode: string;
    address: string;
    /** The row's `data` as sent, for the booking call. */
    raw: any;
}

/** One bookable time from AHC_SLOT_SERVICE_TYPE. */
export interface AhcSlot {
    id: string;
    /** What the member reads, e.g. "9:00 AM – 9:30 AM". */
    label: string;
    available: boolean;
    raw: any;
}

/** One centre row of AHC_DYNAMIC_WELLNESS_SLOTS, for the centre-visit step. */
export interface AhcCentre {
    id: string;
    name: string;
    /** `primary_address` as street1, street2, street3, city, state, country. */
    address: string;
    latitude: number | null;
    longitude: number | null;
    /** Straight-line distance from the member's location; null when either end has no coordinates. */
    distanceKm: number | null;
    /** The row's `data` as sent, for the slot and booking calls. */
    raw: any;
}

/** One booked leg — an entry of `packageServiceItemsStatusInfo` whose stage is 'Booked'. */
export interface AhcBooking {
    id: string;
    /** `serviceType_code`, lower-cased: 'pathology' or 'radiology'. */
    leg: string;
    serviceItemName: string;
    providerName: string;
    /** Centre address for a centre visit, collection address for home; decrypted. */
    address: string;
    mode: 'home' | 'clinic' | null;
    instructions: string;
    amount: number | null;
    /** Epoch ms of the booking; null when the row carries none. */
    bookedAt: number | null;
    stage: string;
    raw: any;
}

/** How a booking attempt ended, for the page to report. */
export type AhcBookingOutcome =
    | { status: 'booked' }
    /** Sent to Razorpay; the member comes back on the payment-status page. */
    | { status: 'redirecting' }
    | { status: 'payment-cancelled' }
    | { status: 'payment-failed'; reason: string }
    | { status: 'failed' };

/** sessionStorage key for the picked provider. */
const SELECTED_PROVIDER_KEY = 'ahcSelectedProvider';

@Injectable({ providedIn: 'root' })

export class AHCStore {
    private readonly location = inject(LocationStore);
    private readonly bookings = inject(BookingsStore);
    private readonly payments = inject(PaymentGatewayService);
    private readonly policyStore = inject(PolicyStore);
    private readonly family = inject(FamilyStore);
    private readonly _ahcList = signal<any | null>(null);
    private readonly _ahcListServiceItemIds = signal<any | null>(null);
    private readonly _ahcServiceItemList = signal<any | null>(null);
    private readonly _ahcSelectedItem = signal<AhcSelectedService | null>(null);
    /** True from the package listing call until the detail call settles. */
    private readonly _ahcPackageLoading = signal(false);
    private readonly _ahcSelectedModeofCollection = signal<any | null>(null);
    private readonly _ahcCollectionAddress = signal<CollectionAddress[]>([]);
    private readonly _collectionAddressLoading = signal(false);
    private readonly _selectedCollectionAddress = signal<CollectionAddress | null>(null);
    // Providers and slots have their own signals: `_ahcList` holds the selected
    // package, which getAHCProviders reads back.
    private readonly _ahcProviders = signal<AhcProvider[]>([]);
    private readonly _providersLoading = signal(false);
    private readonly _selectedProvider = signal<AhcProvider | null>(readStoredProvider());
    private readonly _ahcCentres = signal<AhcCentre[]>([]);
    private readonly _centresLoading = signal(false);
    private readonly _selectedCentre = signal<AhcCentre | null>(null);
    private centreSeq = 0;
    private readonly _ahcSlots = signal<AhcSlot[]>([]);
    private readonly _ahcSlotResponse = signal<any>([]);
    private readonly _ahcSelectedSlot = signal<any>([]);
    private readonly _slotsLoading = signal(false);
    private readonly _ahcCartResponse = signal(<any | null>(null));
    private readonly _ahcCheckoutResponse = signal(<any | null>(null));
    private readonly _isPathologyServiceStatus = signal(<any | null>(null));
    private readonly _ahcBookingInfo = signal(<any | null>(null));
    private readonly _ahcBookings = signal<AhcBooking[]>([]);
    private readonly _ahcIsProceedToBooking = signal<any>(false);
    /** True from cart_add until checkout settles — the copay is unknown until then. */
    private readonly _checkoutLoading = signal(false);
    private readonly _ahcCopayAmount = signal(<any | null>(null));
    
    private slotSeq = 0;
    /** Only the latest package load may write — an earlier visit's late response is dropped. */
    private packageSeq = 0;
    readonly AHC = this._ahcList.asReadonly();
    readonly AHCProviders = this._ahcProviders.asReadonly();
    readonly providersLoading = this._providersLoading.asReadonly();
    readonly AHCSelectedProvider = this._selectedProvider.asReadonly();
    readonly AHCCentres = this._ahcCentres.asReadonly();
    readonly centresLoading = this._centresLoading.asReadonly();
    readonly AHCSelectedCentre = this._selectedCentre.asReadonly();
    readonly AHCSlots = this._ahcSlots.asReadonly();
    readonly AHCSlotResponse = this._ahcSlotResponse.asReadonly();
    readonly AHCSelectedSlot = this._ahcSelectedSlot.asReadonly();
    readonly slotsLoading = this._slotsLoading.asReadonly();
    readonly AHCServiceItemList = this._ahcServiceItemList.asReadonly();
    readonly AHCSelectedItem = this._ahcSelectedItem.asReadonly();
    readonly packageLoading = this._ahcPackageLoading.asReadonly();
    readonly selectedCollectionAddress = this._selectedCollectionAddress.asReadonly();
    readonly AHCCartResponse = this._ahcCartResponse.asReadonly();
    readonly AHCCheckoutResponse = this._ahcCheckoutResponse.asReadonly();
    readonly IsPathologyServiceStatus = this._isPathologyServiceStatus.asReadonly();
    readonly AHCBookingInfo = this._ahcBookingInfo.asReadonly();
    /** Legs of this year's package already booked, from AHC_PACKAGE_DETAIL. */
    readonly AHCBookings = this._ahcBookings.asReadonly();
    readonly AHCIsProceedToBooking = this._ahcIsProceedToBooking.asReadonly();
    readonly checkoutLoading = this._checkoutLoading.asReadonly();
    readonly AHCCopayAmount = this._ahcCopayAmount.asReadonly();
    readonly AHCListServiceItemIds = this._ahcListServiceItemIds.asReadonly();
    startDateTimeStamp: any;
    startDateObj: any;
    dateAndStartTimeTimestamp:any;
    dateAndEndTimeTimestamp:any;
    /**
     * The first package row — `data` of an AHC_PACKAGE_DETAIL row, or a
     * phc_detail row as it is sent (those come unwrapped).
     */
    readonly ahcPackage = computed(() => {
        const rows = this._ahcServiceItemList();
        return Array.isArray(rows) && rows.length ? (rows[0]?.data ?? rows[0] ?? null) : null;
    });

    /**
     * Every lab offering a leg: one phc_detail row per provider, each with its
     * `service_item` entries. Inactive rows are left out.
     */
    readonly labs = computed<AhcLab[]>(() => {
        const rows = this._ahcServiceItemList();
        if (!Array.isArray(rows)) return [];
        return rows
            .map((row) => row?.data ?? row)
            .filter((row) => row && textOf(row.status).toLowerCase() !== 'inactive')
            .flatMap((row) =>
                (Array.isArray(row.service_item) ? row.service_item : []).map((item: any): AhcLab => {
                    const catalog: any[] = Array.isArray(item?.profile_test_catalog) ? item.profile_test_catalog : [];
                    return {
                        id: textOf(row.id) + ':' + textOf(item?.service_item_code),
                        providerName: textOf(row.provider_name) || 'Lab',
                        providerCode: textOf(row.provider_code),
                        serviceType: textOf(item?.serviceType_code || item?.serviceType).toUpperCase(),
                        serviceItemName: textOf(item?.service_item) || textOf(row.phc_name),
                        serviceItemCode: textOf(item?.service_item_code),
                        profiles: catalog.map((p) => textOf(p?.profile_name)).filter(Boolean),
                        testCount: catalog.reduce((n, p) => n + (Array.isArray(p?.test_name) ? p.test_name.length : 0), 0),
                        serviceItem: item,
                        raw: row,
                    };
                }),
            );
    });

    /** The labs offering one leg ('PATHOLOGY', 'RADIOLOGY'), in API order. */
    labsFor(serviceType: string): AhcLab[] {
        const type = serviceType.toUpperCase();
        return this.labs().filter((lab) => lab.serviceType === type);
    }

    /**
     * The package's legs in display order: the package's own
     * `benefits_package_service_tiles` when it has them, else one tile per
     * service type the labs offer — pathology first, as it must be booked first.
     */
    readonly serviceTiles = computed<AhcServiceTile[]>(() => {
        const tiles: any[] = this.ahcPackage()?.benefits_package_service_tiles ?? [];
        if (tiles.length) {
            return tiles
                .map((t, index) => ({
                    id: String(t?.id ?? index),
                    serviceType: String(t?.serviceType ?? '').toUpperCase(),
                    order: Number(t?.order ?? index),
                    serviceItems: (t?.serviceItemInfo ?? []).flat(),
                    raw: t,
                }))
                .sort((a, b) => a.order - b.order);
        }
        const rank = (type: string) => (type === 'PATHOLOGY' ? 0 : type === 'RADIOLOGY' ? 1 : 2);
        const types = [...new Set(this.labs().map((lab) => lab.serviceType).filter(Boolean))].sort((a, b) => rank(a) - rank(b));
        return types.map((type, order) => ({
            id: type,
            serviceType: type,
            order,
            serviceItems: this.labsFor(type).map((lab) => lab.serviceItem),
            raw: null,
        }));
    });
    readonly AHCSelectedModeofCollection = this._ahcSelectedModeofCollection.asReadonly();
    readonly AHCCollectionAddress = this._ahcCollectionAddress.asReadonly();
    readonly collectionAddressLoading = this._collectionAddressLoading.asReadonly();
    readonly resolved = computed(() => true);
    constructor(private appService: AppService, private localStore: LocationStore) {}
    async setAHCListInfo(ahc: any): Promise<boolean> {
        this._ahcList.set(ahc);
        return true;
    }

    restore(): Promise<boolean> {
        return Promise.resolve(true);
    }
    setSelectedCollectionAddress(address: any | null){
        this._selectedCollectionAddress.set(address);
        return true;
    }
    setSelectedSlot(selectedSlot: any){
        this._ahcSelectedSlot.set(selectedSlot)
        return true;
    }
    getAHCPackageID(){
        // const policies = this.policyStore.policies()
        const version = this.policyStore.version();
        const ahc_package_codes = version?.relationships?.find(rel => rel.relationship_code === 'self')
                                    ?.categories
                                    ?.find(cat => cat.category_code === 'AHC')
                                    ?.ahc_package_codes ?? [];
        return ahc_package_codes
    }
    getAHCList(userId: any){
        const serviceItemCode: any = this.getAHCPackageID();
        // const serviceItemCode = 'hcl-group-executive-health-check-employee-40-and-above-years-male-year-2026-27-' //this.getAHCPackageID() 
        const userInfo = userId;
        const queryId = 'AHC_PACKAGE_LISTING';
        const applicationName = 'habit-opd';
        const resourceName = 'opd_ahc_booking';
        // const args = 'user_id:' + userInfo?.user_id + ',service_type_code:phc,mode_of_appointment:opd_network';

        // https://api.habithealth.com/
        //master-management/api/v1/?queryId=&args=&filter=serviceItemCode:hyundai-blood-sample-collection-at-home-below-40-female-package,mode_of_appointment:opd_network&page_no=0&page_size=9&search_columns=serviceItemName&search=&order_by=serviceItemName
        const args = 'serviceItemCode:'+ serviceItemCode.toString().replaceAll(',',';'); //'user_id:' + userInfo?.user_id + ',service_type_code:phc,mode_of_appointment:opd_network';
        //  const queryId = 'GET_PAGE';
        // const applicationName = 'master-management';
        // const resourceName = 'service_item_search';
        // const filter = 'serviceItemCode:'+ (serviceItemCode.length > 1 ? serviceItemCode[1] : serviceItemCode[0]) +'';
        const filter = '';
        // const filter = '';
        const page_no= 0 
        const page_size=100
        const search_columns = 'serviceItemName'
        const search='';
        const order_by='serviceItemName'
        const seq = ++this.packageSeq;
        this._ahcPackageLoading.set(true);
        // queryId=GET_PAGE&args=&
    //    const args = '';
    //     const filter = 'serviceType_code%3Aphc%2Cis_searchable%3Atrue%2Cshow_online%3Atrue%2Cpackage_type_code%3Ahealth_check%2Cpackage_sub_type_code%3Ahealth_check%2Cis_home_collection%3Atrue%2Cprovider_code%3ATHD001%23AD001%23RC001%2Cmode_of_appointment%3Aopd_network&page_no=0&page_size=9&search_columns=serviceItemName&search=&order_by=serviceItemName%20ASC&application=master-management
        this.appService.getcall(resourceName, applicationName, 'queryId=' + queryId + '&args=' + args+'&filter='+ filter +'&page_no='+page_no
            +'&page_size='+ page_size
            +'&search_columns='+search_columns
            +'&search='+search
            +'&order_by='+order_by
            +'&application='+ applicationName).subscribe({
            next: (response: any) => {
                if (seq !== this.packageSeq) return;
                const parsed = typeof response === 'string' ? JSON.parse(response) : response;
                const resources: any[] = parsed?.resource ?? [];
                // const selectedPackage = resources.find(
                //         (item: any) =>
                //             item?.data?.id === "17f9d2f0-c21b-11f1-83a6-d6f78dbc4361-65"
                //         //"ddb554b0-c21b-11f1-97e2-eadcbe87e341-78"
                //         // pathalogy "853e6780-c6d1-11f1-9653-4eb7369f2b18-19"  //"853f03c0-c6d1-11f1-9653-4eb7369f2b18-21"
                //         );
                if(resources.length > 0){
                    const selectedPackage = resources[0]
                    const serviceItemIds = resources.map(item => item.data.serviceItemId);
                    this._ahcListServiceItemIds.set(serviceItemIds.toString())
                    this._ahcList.set(selectedPackage ?? null);
                    if (!selectedPackage) {
                        // No matching package on the plan: nothing to detail.
                        this._ahcServiceItemList.set([]);
                        this._ahcPackageLoading.set(false);
                        return;
                    }
                    
                    this.getAHCServiceItems(userInfo, selectedPackage, seq);
                } else{
                    this._ahcServiceItemList.set([]);
                    this._ahcPackageLoading.set(false);
                }
            },
            error: () => {
                if (seq !== this.packageSeq) return;
                this._ahcList.set(null);
                this._ahcServiceItemList.set([]);
                this._ahcPackageLoading.set(false);
            }
        });
    }
    getAHCServiceItems(userInfo: any, packageList: any, seq = this.packageSeq){
        const packageListObj = packageList.data;
        let serviceItemIds = this._ahcListServiceItemIds()
        const resourceName = 'opd_ahc_booking';
        const queryId = 'AHC_PACKAGE_DETAIL';
        const applicationName = 'habit-opd';
        // const args = 'user_id:' + userInfo?.user_id +
        //              ',serviceItemCode:' + packageListObj?.service_item_code +
        //              ',facility_id:' + userInfo?.facilities[0]?.org_id +
        //              ',bp_code:' + packageListObj.bp_code +
        //              ',bg_code:' + packageListObj.bg_code +
        //              ',selling_discount_rate:' + packageListObj.total_share +
        //              ',bp_service_item_id:'+ packageListObj.id;
        //              ',mode_of_appointment: opd_network';
        
        // const filter = 'serviceType_code:' + packageListObj?.service_type_code +
        //                 'is_searchable:true' +
        //                 'package_type_code:health_check' +
        //                 'package_sub_type_code:health_check' + packageListObj.package_sub_type_code +
        //                 'serviceItemCode:' + packageListObj?.service_item_code ;

        // https://api.habithealth.com//api/v1/?queryId=&filter=id%3A600117c0-c6e9-11f1-8974-3e5e3913171d-35%27 
        // const resourceName = 'phc_detail';
        // const queryId = 'GET_PAGE';
        // const applicationName = 'facility-management';
        const args = 'phc_id:'+serviceItemIds.replaceAll(',',';')
        // const args = 'user_id:' + userInfo?.user_id +
        //              ',serviceItemCode:' + packageListObj?.service_item_code +
        //              ',facility_id:' + userInfo?.facilities[0]?.org_id +
        //              ',bp_code:' + packageListObj.bp_code +
        //              ',bg_code:' + packageListObj.bg_code +
        //              ',selling_discount_rate:' + packageListObj.total_share +
        //              ',bp_service_item_id:'+ packageListObj.id;
        //              ',mode_of_appointment: opd_network';
        
        // const filter = 'phc_id:'+packageListObj?.serviceItemId;
        const filter = ''; //'phc_id:'+serviceItemIds.replaceAll(',', '#');
        // 'serviceType_code:' + packageListObj?.service_type_code +
        //                 'is_searchable:true' +
        //                 'package_type_code:health_check' +
        //                 'package_sub_type_code:health_check' + packageListObj.package_sub_type_code +
        //                 'serviceItemCode:' + packageListObj?.service_item_code ;


        this.appService.getcall(resourceName, applicationName, 'queryId=' + queryId + '&args=' + args+'&application='+ applicationName + '&filter=' + filter).subscribe({
            next: (response: any) => {
                if (seq !== this.packageSeq) return;
                const parsed = typeof response === 'string' ? JSON.parse(response) : response;
                const resources: any[] = parsed?.resource ?? [];
                this._ahcServiceItemList.set(resources);
                this._ahcPackageLoading.set(false);
                // phc_detail rows come unwrapped; the package listing row may carry it instead.
                const statusInfo: any[] =
                    resources[0]?.data?.packageServiceItemsStatusInfo ??
                    resources[0]?.packageServiceItemsStatusInfo ??
                    this._ahcList()?.data?.packageServiceItemsStatusInfo ??
                    [];
                const key = userInfo?.api_encryption_key ?? null;
                // Only a leg whose stage is 'Booked' gets a booking status card.
                const bookings = statusInfo
                    .filter((item) => textOf(item?.stage).toLowerCase() === 'booked')
                    .map((item, index) => this.toBooking(item, index, key));
                this._ahcBookings.set(bookings);
                this._isPathologyServiceStatus.set(bookings.some((b) => b.leg === 'pathology'));
                if (statusInfo.length) {
                    this.setPathologyBookingInfo(statusInfo.find((item) => textOf(item?.serviceType_code).toLowerCase() === 'pathology') ?? statusInfo[0]);
                }
            },
            error: () => {
                if (seq !== this.packageSeq) return;
                this._ahcBookings.set([]);
                this._ahcServiceItemList.set([]);
                this._ahcPackageLoading.set(false);
            }
        });
    }
    /**
     * Forgets everything from an earlier visit — package, bookings, providers,
     * centres, slots, checkout — so the screen shows only what the API sends
     * this time. Called when the Annual Health Check screen opens.
     */
    resetForEntry(): void {
        this.packageSeq++;
        this.slotSeq++;
        this.centreSeq++;
        this._ahcList.set(null);
        this._ahcServiceItemList.set(null);
        this._ahcSelectedItem.set(null);
        this._ahcPackageLoading.set(false);
        this._ahcSelectedModeofCollection.set(null);
        this._ahcCollectionAddress.set([]);
        this._collectionAddressLoading.set(false);
        this._selectedCollectionAddress.set(null);
        this._ahcProviders.set([]);
        this._providersLoading.set(false);
        this.setSelectedProvider(null);
        this._ahcCentres.set([]);
        this._centresLoading.set(false);
        this._selectedCentre.set(null);
        this._ahcSlotResponse.set([]);
        this._ahcSelectedSlot.set([]);
        this._ahcCartResponse.set(null);
        this._ahcCheckoutResponse.set(null);
        this._isPathologyServiceStatus.set(null);
        this._ahcBookingInfo.set(null);
        this._ahcBookings.set([]);
        this._ahcIsProceedToBooking.set(false);
        this._checkoutLoading.set(false);
        this._ahcCopayAmount.set(null);
        this.startDateTimeStamp = undefined;
        this.startDateObj = undefined;
        this.dateAndStartTimeTimestamp = undefined;
        this.dateAndEndTimeTimestamp = undefined;
    }

    setPathologyBookingInfo(serviceBookingInfo: any){
        if(serviceBookingInfo?.serviceType_code == 'pathology' && serviceBookingInfo?.stage == 'Booked'){
            this._isPathologyServiceStatus.set(serviceBookingInfo?.serviceType_code == 'pathology' && serviceBookingInfo?.stage == 'Booked' ? true : false)
        }
        this._ahcBookingInfo.set(serviceBookingInfo);
    }

    /** The leg picked on the first screen, with its tile and package, for the later steps. */
    setAHCSelctedItem(item: AhcSelectedService | null) {
        this._ahcSelectedItem.set(item);
    }

    setAHCSelctedModeofCollection(item: any) {
        this._ahcSelectedModeofCollection.set(item);
    }
    async getAHCProviders(userInfo: any, modeOfCollection: any): Promise<void> {
        // console.log('_ahcSelectedItem', this.AHCSelectedItem())
        const selectedItem = this.AHCSelectedItem();
        const serviceItem = this.legServiceItem();
        const packageListObj =this.AHC();
        const pincodeAndLocation = this.location.place();
        const phcServiceTypeCode = 'phc';
        const queryId = 'AHC_PROVIDER_LISTING';
        const applicationName = 'habit-opd';
        const resourceName = 'opd_ahc_booking';
        const args = 'user_id:' + userInfo?.user_id +
                        ',service_item_code:' + serviceItem?.service_item_code +
                        ',pin_code:' + pincodeAndLocation?.pincode + 
                        ',mode_of_collection:' + (modeOfCollection === 'home' ? 'home_collection' : 'center_visit') +
                        ',patient_state:'+ pincodeAndLocation?.state +
                        ',serviceType_code:' + serviceItem?.serviceType_code +
                        ',cug_code:' + userInfo?.cug_code +
                        ',facility_id:' + userInfo?.facilities[0]?.org_id +
                        ',bp_code:' + packageListObj?.data?.bg_code +
                        ',package_type_code:' + packageListObj?.data?.package_type_code +
                        ',package_sub_type_code:' + packageListObj?.data?.package_sub_type_code +
                        ',selling_discount_rate:' + packageListObj?.data?.total_share+
                        ',phc_serviceType_code:' + phcServiceTypeCode + 
                        ',phc_service_item_code:'+ packageListObj?.data?.service_item_code +
                        ',latitude:' + pincodeAndLocation?.latitude +
                        ',longitude:' + pincodeAndLocation?.longitude +
                        ',radius:60000' +
                        ',applyRadius:yes' +
                        ',is_sort_location:true' ;

        this._providersLoading.set(true);
        this._ahcProviders.set([]);
        try {
            const response = await firstValueFrom(
                this.appService.getcall(resourceName, applicationName, 'queryId=' + queryId + '&args=' + args+'&application=' + applicationName),
            );
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            const resources: any[] = parsed?.resource ?? [];
            this._ahcProviders.set(resources.map(toProvider));
        } catch {
            this._ahcProviders.set([]);
        } finally {
            this._providersLoading.set(false);
        }
    }

    /**
     * The package's service item for the leg being booked — its
     * `serviceType_code` names the leg ('pathology', 'radiology'). Falls back
     * to the first item, which is what was sent before legs were told apart.
     */
    private legServiceItem(): any {
        const selectedItem = this.AHCSelectedItem();
        // A lab picked on the first screen names its own service item.
        if (selectedItem?.lab?.serviceItem) return selectedItem.lab.serviceItem;
        const items: any[] = selectedItem?.package?.service_item ?? [];
        const leg = selectedItem?.tile?.serviceType?.toLowerCase() || selectedItem?.leg;
        return items.find((item) => String(item?.serviceType_code ?? '').toLowerCase() === leg) ?? items[0];
    }

    /** Keeps the picked provider in the store and in sessionStorage, so a reload keeps it. */
    setSelectedProvider(provider: AhcProvider | null): void {
        this._selectedProvider.set(provider);
        try {
            if (provider) sessionStorage.setItem(SELECTED_PROVIDER_KEY, JSON.stringify(provider));
            else sessionStorage.removeItem(SELECTED_PROVIDER_KEY);
        } catch {
            // Storage unavailable (private mode): the signal still holds it.
        }
        // Slots belong to a provider; another provider's slots no longer apply.
        this.slotSeq++;
        this._ahcSlots.set([]);
        this._slotsLoading.set(false);
    }

    async getCentreAddress(userInfo: any, modeOfCollection: any): Promise<void> {
        const queryId = 'AHC_DYNAMIC_WELLNESS_SLOTS'; //'GET_WELLNESSCENTRE_DETAILS_BY_SORTED_LOCATION_V2'; //'AHC_DYNAMIC_WELLNESS_SLOTS';
        const applicationName = 'habit-opd'; //'master-management'; //'habit-opd';
        const resourceName = 'opd_ahc_booking'; //'provider_location_mapping'; //'opd_ahc_booking';
        const provider = this._selectedProvider();
        const pincodeAndLocation = this.location.place();
        const serviceItem = this.legServiceItem();
        const isModeofCollectionHome = (modeOfCollection === 'home' ? true : false)
        let args = 'provider_code:' + provider?.code  +
                    ',serviceType_code:'+ serviceItem?.serviceType_code +
                    ',pincode:'+ pincodeAndLocation?.pincode +
                    ',cug_code:' + userInfo?.cug_code +
                    ',patient_state:' + pincodeAndLocation?.state +
                    ',serviceItemCode:' + serviceItem?.service_item_code +
                    ',is_centre_visit:'+ !isModeofCollectionHome +
                    ',is_home_collection:'+  isModeofCollectionHome+
                    
                    // ',inclnic_code:'+  provider?.raw?.extra_data?.inclinic_code +
                    // ',wellness_code:HHO001' +
                    ',latitude:' + pincodeAndLocation?.latitude +
                    ',longitude:' + pincodeAndLocation?.longitude +
                    ',radius:' + 60000+
                    ',applyRadius:'+ 'yes'
        if(serviceItem?.serviceType_code == 'pathology' ){
            args  += ',inclnic_code:'+  provider?.raw?.extra_data?.inclinic_code;
        }
        if(serviceItem?.serviceType_code == 'radiology'){
            args += ',wellness_code:' + provider?.raw?.extra_data?.wellness_centre_code;
        }
        // Only the latest call may write: going back and forth between steps can overlap them.
        const seq = ++this.centreSeq;
        this._centresLoading.set(true);
        this._ahcCentres.set([]);
        this._selectedCentre.set(null);
        try {
            const response = await firstValueFrom(
                this.appService.getcall(resourceName, applicationName, 'queryId=' + queryId + '&args=' + args+'&application=' + applicationName),
            );
            if (seq !== this.centreSeq) return;
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            const resources: any[] = parsed?.resource ?? [];
            const origin = { latitude: toCoord(pincodeAndLocation?.latitude), longitude: toCoord(pincodeAndLocation?.longitude) };
            // Nearest first; centres without coordinates go last.
            const centres = resources
                .map((item, index) => toCentre(item, index, origin))
                .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
            this._ahcCentres.set(centres);
        } catch {
            if (seq === this.centreSeq) this._ahcCentres.set([]);
        } finally {
            if (seq === this.centreSeq) this._centresLoading.set(false);
        }
    }

    setSelectedCentre(centre: AhcCentre | null): void {
        this._selectedCentre.set(centre);
    }
    /**
     * The member's saved collection addresses. Each item carries its details
     * under `address`; `street1` / `street2` arrive encrypted with the user's
     * `api_encryption_key` and are decrypted here so the page shows plain text.
     */
    async getCollectionAddress(userInfo: any): Promise<void> {
        const queryId = 'LIST_ORDER_ADDRESS';
        const applicationName = 'habit-opd';
        const resourceName = 'opd_ahc_booking';
        const args = '';
        const filter = 'patient_id:' + userInfo?.user_id + ',uhId:' + userInfo?.user_roles[0]?.uhid;

        this._collectionAddressLoading.set(true);
        try {
            const response = await firstValueFrom(
                this.appService.getcall(resourceName, applicationName, 'queryId=' + queryId + '&args=' + args+'&application=' + applicationName + '&filter=' + filter),
            );
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            const resources: any[] = parsed?.resource ?? [];
            const key = userInfo?.api_encryption_key ?? null;
            this._ahcCollectionAddress.set(resources.map((item, index) => this.toCollectionAddress(item.data, index, key)));
        } catch {
            this._ahcCollectionAddress.set([]);
        } finally {
            this._collectionAddressLoading.set(false);
        }
    }

    private toCollectionAddress(item: any, index: number, key: string | null): CollectionAddress {
        const a = item?.address ?? item ?? {};
        const text = (value: unknown): string => (value === undefined || value === null ? '' : String(value).trim());
        const street = (value: unknown): string => this.decryptIfEncrypted(text(value), key);
        const coord = (value: unknown): number | null => {
            const n = typeof value === 'number' ? value : parseFloat(text(value));
            return Number.isFinite(n) ? n : null;
        };
        return {
            id: text(item?.id ?? item?._id ?? item?.order_address_id ?? a?.id) || 'address-' + index,
            type: text(a.address_type ?? a.label) || 'Other',
            line1: street(a.street1),
            line2: street(a.street2),
            landmark: street(a.street3),
            city: text(a.cityDisplayName) || text(a.city),
            state: text(a.stateDisplayName) || text(a.state),
            pincode: text(a.pincode),
            country: text(a.country),
            latitude: coord(a.latitude),
            longitude: coord(a.longitude),
        };
    }

    /**
     * Field names below are best guesses at a `packageServiceItemsStatusInfo`
     * row, taken from what the checkout and booking calls send — confirm
     * against a live row and trim to the real ones.
     */
    private toBooking(item: any, index: number, key: string | null): AhcBooking {
        const a = item?.center_address ?? item?.order_address ?? item?.address ?? {};
        const street = (value: unknown): string => this.decryptIfEncrypted(textOf(value), key);
        const address = typeof a === 'string'
            ? a.trim()
            : [
                street(a.street1),
                street(a.street2),
                street(a.street3),
                textOf(a.cityDisplayName) || textOf(a.city),
                textOf(a.stateDisplayName) || textOf(a.state),
                textOf(a.countryDisplayName) || textOf(a.country),
                textOf(a.pincode),
            ].filter(Boolean).join(', ');
        const mode = item?.is_centre_visit === true ? 'clinic' : item?.is_home_collection === true ? 'home' : null;
        const amount = toCoord(item?.final_payable ?? item?.selling_amount ?? item?.amount);
        const bookedAt = toEpoch(item?.booked_date ?? item?.booking_date ?? item?.order_date_time ?? item?.created_at ?? item?.createdAt ?? item?.created_on);
        return {
            id: textOf(item?.id) || textOf(item?.package_serviceRequestId) || 'booking-' + index,
            leg: textOf(item?.serviceType_code).toLowerCase(),
            serviceItemName: pickText(item, 'serviceItemName', 'service_item_name', 'serviceName', 'service_item'),
            providerName: pickText(item, 'provider_name', 'providerName', 'center_name'),
            address,
            mode,
            instructions: pickText(item, 'patient_instructions'),
            amount,
            bookedAt,
            stage: textOf(item?.stage),
            raw: item,
        };
    }

    /**
     * Some street fields are encrypted and some (`street3`) are not, so only a
     * value shaped like AES ciphertext — base64, whole 16-byte blocks — is
     * decrypted, and a failed decrypt falls back to the value as sent.
     */
    private decryptIfEncrypted(value: string, key: string | null): string {
        if (!value || !key) return value;
        const looksEncrypted = value.length >= 24 && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
        if (!looksEncrypted) return value;
        return this.appService.decryptText(value, key) || value;
    }

    /** Saves a new address, then reloads the list. Resolves false when the save fails. */
    async addNewCollectionAddress(address: any, userInfo: any): Promise<boolean> {
        // master-management/api/v1/order_address
        const applicationName = 'habit-opd';
        const resourceName = 'opd_ahc_booking';
        const action = 'add_order_address';
        const payload = {
            "order_address": {
                "address":{
                    "label": address?.type,
                    "street1": address?.line1,
                    "street2": address?.line2,
                    "street3": address?.landmark,
                    "cityDisplayName": address?.city,
                    "city": "",
                    "stateDisplayName": address?.state,
                    "state":"",
                    "pincode": address?.pincode,
                    "country":"India",
                    "latitude":"",
                    "longitude":"",
                    "address_type": address?.type
                },
                "uhId": userInfo?.user_roles[0]?.uhid,
                "patient_id": userInfo?.user_id
            }
        }
        try {
            await firstValueFrom(this.appService.postCall(resourceName, applicationName, '', payload, action));
        } catch {
            return false;
        }
        // The POST answers with the saved row, not the list, so read the list again.
        await this.getCollectionAddress(userInfo);
        return true;
    }

    /**
     * Slots of the selected provider on one day. `date` is that day at local
     * midnight; the query takes it twice, as epoch ms and as dd/MM/yyyy.
     * Changing the date quickly fires several of these, so only the latest
     * may write its result.
     */
    /**. IN Clinic  slot query id AHC_SLOT_SERVICE_TYPE **/

    

    /**.  Home collection slots **/
    /**
     * `,patient_gender:Male|Female|Other` for the member being booked — the
     * signed-in user (the booking's patient_id), read from GET_FAMILY_LIST's
     * `gender_id`. Left out when the API sent no gender, rather than guessing.
     */
    private patientGenderArg(userInfo: any): string {
        const members = this.family.rawFamily();
        const patient =
            members.find((m) => m.memberId === userInfo?.user_id) ??
            members.find((m) => m.isPrimary) ??
            this.family.activeMember();
        const gender = patient?.gender?.toUpperCase();
        if (gender !== 'MALE' && gender !== 'FEMALE' && gender !== 'OTHER') return '';
        return ',patient_gender:' + gender.charAt(0) + gender.slice(1).toLowerCase();
    }

    async getAHCDynamicSlots(userInfo: any, date: Date, modeofCollection: any): Promise<void> {
        const provider = this._selectedProvider();
        const selectedItem: any = this.AHCSelectedItem();
        const packageListObj =this.AHC();
        const selectedCollectionAddress: any = this.selectedCollectionAddress();
        const selectedCentre = this.AHCSelectedCentre();
        const seq = ++this.slotSeq;
         console.log('provider--', provider, 'selectedCollectionAddress --', selectedCollectionAddress)
        this._ahcSlots.set([]);
        if (!provider) {
            this._slotsLoading.set(false);
            return;
        }
        console.log(' modeofCollection.  ', modeofCollection, 'selectedCentre. :', selectedCentre)
        // const queryId = 'AHC_DYNAMIC_SLOTS';
        const queryId = modeofCollection === 'home' ? 'AHC_DYNAMIC_SLOTS' : 'AHC_SLOT_SERVICE_TYPE';
        const applicationName = 'habit-opd';
        const resourceName = 'opd_ahc_booking';
//         /diagnostic/api/v1/?queryId=&args=service_type_code:<CODE1>#<CODE2>,provider_code:<PROVIDER_CODE>,center_code:<CENTER_
//   CODE>,date:<EPOCH_MS>,slotDate:<DD/MM/YYYY>
        // const queryId = modeofCollection === 'home' ? 'GET_DYNAMIC_SLOTS_BY_PINCODE' : 'GET_SLOTS_SERVICETYPE_WISE';
        // const applicationName = modeofCollection === 'home' ? 'master-management' : 'diagnostic';
        // const resourceName = modeofCollection === 'home' ? 'provider' : 'common_utility';
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const slotDate = [day.getDate(), day.getMonth() + 1].map((n) => String(n).padStart(2, '0')).join('/') + '/' + day.getFullYear();
        console.log('.day ', day, 'slotDate ', slotDate)
        this.startDateObj = day;
        const timestamp = this.startDateObj.getTime();
        this.startDateTimeStamp = timestamp;
        let args = "";
        console.log('------this.patientGenderArg(userInfo)-->', this.patientGenderArg(userInfo))
        // http://localhost:4590/master-management/api/v1/provider?queryId=GET_DYNAMIC_SLOTS_BY_PINCODE&
        // args=provider_code:THD001,date:1792780200000,pincode:600129,facility_id:e2df9fe0-b395-11ef-b263-d21cb9dedc2c-41,
        // patient_gender:Male,collection_code:P1522,address.street1:HC NO,address.street2:Noida st,address.street3:street 2,
        // address.city:chennai,address.state:tamil nadu,address.pincode:600129,address.country:india,
        // address.latitude:12.9945394,address.longitude:80.21506649999999,address.cityDisplayName:Chennai,address.stateDisplayName:Tamil Nadu,
        // address.countryDisplayName:India,latitude:12.9945394,longitude:80.21506649999999
        // &application=master-management
        if(modeofCollection == 'home'){
            args = 'provider_code:' + provider.code +
                ',date:' + timestamp +
                ',facility_id:' + userInfo?.facilities[0]?.org_id +
                this.patientGenderArg(userInfo) +
                ',pincode:' + selectedCollectionAddress?.pincode +
                ',collection_code:'+ packageListObj?.data?.home_collection_code+
                ',address.street1:' + selectedCollectionAddress?.line1 +
                ',address.street2:' + selectedCollectionAddress?.line2 +
                ',address.pincode:' + selectedCollectionAddress?.pincode +
                ',address.country:' + selectedCollectionAddress?.country +
                ',address.city:' + selectedCollectionAddress?.city + 
                ',address.state:' + selectedCollectionAddress?.state +
                ',address.cityDisplayName:' + selectedCollectionAddress?.city + 
                ',address.stateDisplayName:' + selectedCollectionAddress?.state +
                ',address.countryDisplayName:' + selectedCollectionAddress?.country +
                ",address.address_type:" + selectedCollectionAddress?.type +
                ',address.latitude:' + selectedCollectionAddress?.latitude +
                ',address.longitude:' + selectedCollectionAddress?.longitude
                ',latitude:' + selectedCollectionAddress?.latitude +
                ',longitude:' + selectedCollectionAddress?.longitude
        } else{
            args =  'provider_code:' + provider.code +
                    ',service_type_code:'+ packageListObj?.data?.serviceType_code +
                    ',center_code:TN'+ //**************************** */
                    ',date:' + timestamp +
                    ',slotDate:'+ slotDate
        }
        // if(modeofCollection == 'home'){
        //     args = 'provider_code:' + provider.code +
        //         ',date:' + timestamp +
        //         ',facility_id:' + userInfo?.facilities[0]?.org_id +
        //         ',patient_gender:Male' + //-------------------------------------------------
        //         ',pincode:' + selectedCollectionAddress?.pincode +
        //         ',collection_code:'+ provider?.raw?.extra_data?.home_collection_code +
        //         ',address.street1:' + selectedCollectionAddress?.line1 +
        //         ',address.street2:' + selectedCollectionAddress?.line2 +
        //         ',address.pincode:' + selectedCollectionAddress?.pincode +
        //         ',address.country:' + selectedCollectionAddress?.country +
        //         ',address.cityDisplayName:' + selectedCollectionAddress?.city + 
        //         ',address.stateDisplayName:' + selectedCollectionAddress?.state +
        //         ",address.address_type:" + selectedCollectionAddress?.type +
        //         ',latitude:' + selectedCollectionAddress?.latitude +
        //         ',longitude:' + selectedCollectionAddress?.longitude
        // } else{
        //     args = 'service_type_code:'+ packageListObj?.data?.service_type_code +
        //         ',provider_code:' + provider.code +
        //         ',center_code:' + selectedCentre?.raw?.center_code +
        //         ',date:'+ timestamp+
        //         ',slotDate:'+ slotDate
        // }
        this._slotsLoading.set(true);
        try {
            const response = await firstValueFrom(
                this.appService.getcall(resourceName, applicationName, 'queryId=' + queryId + '&args=' + args+'&application=' + applicationName),
            );
            if (seq !== this.slotSeq) return;
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            const resources: any[] = parsed?.resource ?? [];
            // this._ahcSlotResponse.set(resources[0]?.data)
            // this._ahcSlots.set(toSlots(resources[0]?.data?.outSourceCenterSlot ?? [], day));
            this._ahcSlotResponse.set(resources[0])
            this._ahcSlots.set(toSlots(resources[0]?.data?.outSourceCenterSlot ?? [], day));
        } catch {
            if (seq !== this.slotSeq) return;
            this._ahcSlots.set([]);
            this._ahcSlotResponse.set(null)
        } finally {
            if (seq === this.slotSeq) this._slotsLoading.set(false);
        }
    }
    
    async ahcAddToCart(userInfo: any){
        const applicationName = 'habit-opd';
        const resourceName = 'opd_ahc_booking';
        const actionName = 'cart_add';
        const packageListObj =this.AHC();
        const selectedItem: any = this.AHCSelectedItem();
        const provider = this._selectedProvider();
        const pincodeAndLocation = this.location.place();
        const selectedSlots = this.AHCSelectedSlot()
        const slotResponse = this.AHCSlotResponse();
        const selectedCollectionAddress: any = this.selectedCollectionAddress();
        const selectedCentre = this.AHCSelectedCentre();
        console.log(' selectedSlots :', selectedSlots, ' dynamicSlotResponse :', slotResponse, 'this.startDateObj :', this.startDateObj, 'selectedCentre ', selectedCentre)
        // Home slots carry the time as text ("9:00 AM - 9:30 AM"); centre slots as
        // epoch event_start_time / event_end_time, whose time of day is what counts.
        // if (selectedSlots?.raw?.slot) {
        //     const slotTime = selectedSlots.raw.slot.find(' - ')?.split(' - ');
        //     this.dateAndStartTimeTimestamp = addTimeToDate(new Date(this.startDateObj), slotTime[0]).getTime();
        //     this.dateAndEndTimeTimestamp = addTimeToDate(new Date(this.startDateObj), slotTime[1]).getTime();
        // } else {
        //     this.dateAndStartTimeTimestamp = atTimeOfDay(this.startDateObj, selectedSlots?.raw?.event_start_time);
        //     this.dateAndEndTimeTimestamp = atTimeOfDay(this.startDateObj, selectedSlots?.raw?.event_end_time);
        // }

        if (selectedSlots?.raw?.slot) {
            const slot = selectedSlots.raw.slot;
            if (slot.includes(' - ')) {
                // Format: "9:00 AM - 9:30 AM"
                const [startTime, endTime] = slot.split(' - ');
                this.dateAndStartTimeTimestamp = addTimeToDate(
                    new Date(this.startDateObj),
                    startTime
                ).getTime();
                this.dateAndEndTimeTimestamp = addTimeToDate(
                    new Date(this.startDateObj),
                    endTime
                ).getTime();
            } else {
                // Format: "9:00 AM"
                this.dateAndStartTimeTimestamp = addTimeToDate(
                    new Date(this.startDateObj),
                    slot
                ).getTime();

                // Use event_end_time if available
                this.dateAndEndTimeTimestamp = atTimeOfDay(
                    this.startDateObj,
                    selectedSlots?.raw?.event_end_time
                );
            }
        } else {
            this.dateAndStartTimeTimestamp = atTimeOfDay(
                this.startDateObj,
                selectedSlots?.raw?.event_start_time
            );
            this.dateAndEndTimeTimestamp = atTimeOfDay(
                this.startDateObj,
                selectedSlots?.raw?.event_end_time
            );
        }
        console.log('dateAndStartTimeTimestamp :', this.dateAndStartTimeTimestamp)
        console.log('dateAndStartTimeTimestamp :', this.dateAndEndTimeTimestamp)
        let payload: any= {
            cart_snapshot: {
                // opdcart: {
                    "facility_id": userInfo?.facilities[0]?.org_id,
                    "patient_id": userInfo?.user_id,
                    "serviceType": packageListObj?.data?.serviceType, //"OP Package",
                    "serviceType_code": packageListObj?.data?.serviceType_code,
                    "serviceItemName": packageListObj?.data?.serviceItemName,
                    "serviceItemCode": packageListObj?.data?.serviceItemCode,
                    "service_code": selectedItem?.package?.serviceItemSearch?.service_code,
                    "provider_name": provider?.raw?.provider_name,
                    "provider_code": provider?.raw?.provider_code,
                    "is_home_collection": packageListObj?.data?.is_home_collection,
                    "is_centre_visit": packageListObj?.data?.is_centre_visit,
                    "home_collection_code": packageListObj?.data?.home_collection_code,
                    "inclinic_code": packageListObj?.data?.inclinic_code,
                    "mrp": selectedItem?.package?.serviceItemSearch?.mrp,
                    "selling_discount_rate": selectedItem?.package?.serviceItemSearch?.selling_discount_rate,
                    "selling_amount": selectedItem?.package?.serviceItemSearch?.selling_amount,
                    "popular": selectedItem?.package?.serviceItemSearch?.popular,
                    "patient_instructions": selectedItem?.package?.serviceItemSearch?.patient_instructions,
                    "logo_id": selectedItem?.package?.serviceItemSearch?.logo_id,
                    "add_to_cart": false,
                    "status": "Pending",
                    "patient_pincode": pincodeAndLocation?.pincode,
                    "patient_city": pincodeAndLocation?.city,
                    "patient_state": pincodeAndLocation?.state,
                    "department_name": packageListObj?.data?.department_name,
                    "department_id": packageListObj?.data?.department_id,
                    "subDepartment_name": packageListObj?.data?.subDepartment_name,
                    "subDepartment_id": packageListObj?.data?.subDepartment_id,
                    "serviceItemId": packageListObj?.data?.serviceItemId,
                    "is_cug": packageListObj?.data?.is_cug,
                    "cug_code": packageListObj?.data?.cug_code,
                    "patient_latitude": pincodeAndLocation?.latitude,
                    "patient_longitude": pincodeAndLocation?.longitude,
                    "is_clear_current_cart": null,
                    "package_sub_type": packageListObj?.data?.package_sub_type,
                    "package_sub_type_code": packageListObj?.data?.package_sub_type_code,
                    "package_type": packageListObj?.data?.package_type,
                    "package_type_code": packageListObj?.data?.package_type_code,
                    "mode_of_appointment": "opd_network",
                    
                    // "wellness_centre_code": "",
                    // "bg_code": packageListObj?.data?.bg_code,
                    // "bg_name": packageListObj?.data?.bg_name,
                    // "bp_code": packageListObj?.data?.bp_code,
                    // "bp_name": packageListObj?.data?.bp_name,
                    // "bp_service_item_id": "ddb97360-c21b-11f1-97e2-eadcbe87e341-51",
                    // "bp_service_item_id": packageListObj?.data?.id,
                    "payer_id": packageListObj?.data?.payer_id,
                    "payer_name": packageListObj?.data?.payer_name,
                    // "tag_data": [],
                    "serviceDate": this.startDateTimeStamp,
                    "serviceStartTime": this.dateAndStartTimeTimestamp,
                    "serviceEndTime": this.dateAndEndTimeTimestamp,
                    "slotId": selectedSlots?.raw?.id,
                    "slotNo": selectedSlots?.raw?.slot_id,
                    "slot": selectedSlots?.raw?.slot || selectedSlots?.label,
                    "slot_type": slotResponse?.slot_type,
                // }
            }
        }
        if(provider?.raw?.extra_data?.is_centre_visit){
            // payload.cart_snapshot.opdcart.center_name = provider?.name;
            // payload.cart_snapshot.opdcart.center_code = provider?.code;
            // payload.cart_snapshot.opdcart.center_address = {
            payload.cart_snapshot.center_name = provider?.name;
            payload.cart_snapshot.center_code = provider?.code;
            payload.cart_snapshot.center_address = {
                        "street1": selectedCentre?.raw?.primary_address?.street1 ,
                        "street2": selectedCentre?.raw?.primary_address?.street2 ,
                        "street3": "",
                        "city": selectedCentre?.raw?.primary_address?.city ,
                        "cityDisplayName": selectedCentre?.raw?.primary_address?.cityDisplayName ,
                        "state": selectedCentre?.raw?.primary_address?.state ,
                        "stateDisplayName": selectedCentre?.raw?.primary_address?.stateDisplayName ,
                        "pincode": selectedCentre?.raw?.primary_address?.pincode ,
                        "pincodeDisplayName": "",
                        "country": selectedCentre?.raw?.primary_address?.country ,
                        "countryDisplayName": selectedCentre?.raw?.primary_address?.countryDisplayName ,
                        "latitude": selectedCentre?.raw?.primary_address?.latitude ,
                        "longitude": selectedCentre?.raw?.primary_address?.longitude 
                    }
        } else {
            // payload.cart_snapshot.opdcart.order_address = {
            payload.cart_snapshot.order_address = {
                        "id": selectedCollectionAddress?.id,
                        "label": selectedCollectionAddress?.type,
                        "isDefault": false,
                        "fullAddress": (selectedCollectionAddress?.line1+", "+selectedCollectionAddress?.line2,+", "+selectedCollectionAddress?.landmark +", "+selectedCollectionAddress?.city+", "+selectedCollectionAddress?.state+", "+selectedCollectionAddress?.pincode),
                        "selected": true,
                        "pincode": selectedCollectionAddress?.pincode,
                        "latitude": selectedCollectionAddress?.latitude,
                        "longitude": selectedCollectionAddress?.longitude,
                        "street1": selectedCollectionAddress?.line1,
                        "street2": selectedCollectionAddress?.line2,
                        "city": selectedCollectionAddress?.city,
                        "city_code": "",
                        "state": selectedCollectionAddress?.state,
                        "state_code": "",
                        "cityDisplayName": selectedCollectionAddress?.city,
                        "stateDisplayName": selectedCollectionAddress?.state,
                    }
        }
        // A previous leg's checkout must not be booked or paid for while this one loads.
        this._ahcCheckoutResponse.set(null);
        this._ahcIsProceedToBooking.set(false);
        this._ahcCopayAmount.set(0);
        this._checkoutLoading.set(true);
        try {
            const response = await firstValueFrom( this.appService.postCall(resourceName, applicationName, '', payload, actionName));
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            if(parsed?.errCode !== -1){
                const resources: any[] = parsed?.resource ?? [];
                this._ahcCartResponse.set(resources[0])
                await this.ahcCheckout(userInfo, resources[0], selectedItem)
            } else{
                this._ahcCartResponse.set(null)
            }
            return true;
        } catch (error) {
            console.error('AHC cart_add failed:', error);
            this._ahcCartResponse.set(null)
            return false;
        } finally {
            this._checkoutLoading.set(false);
        }

    }
    async ahcCheckout(userInfo: any, cartResponse: any, selectedItem: any){
        const applicationName = 'habit-opd';
        const resorceName = 'opd_ahc_booking';
        const actionName = 'checkout';
        const provider = this._selectedProvider();
        const pincodeAndLocation = this.location.place();
        const packageListObj =this.AHC();
        const selectedSlots = this.AHCSelectedSlot();
        const assignment = this.policyStore.assignment()
        // const cartRes = cartResponse?.cart_snapshot?.opdcart;
        const cartRes = cartResponse?.cart_snapshot;
        const cartId = cartResponse?.id
        let payload = {
            policy_id: assignment?.policy_id,
            ahc_route: selectedItem?.tile?.serviceType,
            checkout_snapshot: {
                opdCheckout: {
                    "mode_of_appointment": "opd_network",
                    "facility_id": cartRes?.facility_id,
                    "patient_id": cartRes?.patient_id,
                    "scheme_code": "",
                    "is_use_wallet": false,
                    // "bg_code": cartRes?.bg_code,  //-**************
                    "scheme_discount_applicable": false,
                    "type": "",
                    "uhId": userInfo?.user_roles[0]?.uhid,
                    "is_use_care_coin": false,
                    "orderedFrom": "Patient Portal",
                    // "ordering_facility_id": cartRes?.facility_id,
                    "old_serviceRequestId": "",
                    "provider_name": provider?.raw?.provider_name,
                    "provider_code": provider?.raw?.provider_code,
                     "op_services" : [
                        {
                            "serviceItemId": cartRes?.serviceItemId,
                            "serviceItemName": cartRes?.serviceItemName,
                            "service_code": cartRes?.service_code,
                            "part_of_package": true, // -----------------
                            "serviceItemCode": cartRes?.serviceItemCode,
                            "over_booking_status": false,
                            "order_date_time": new Date().getTime(),  //need to confirm this value
                            "service_type": cartRes.serviceType,
                            "serviceName": provider?.raw?.extra_data?.serviceItemName,
                            "appointment_time": cartRes?.serviceEndTime,  //need to confirm this value
                            "serviceType": cartRes?.serviceType,
                            "serviceType_code": cartRes?.serviceType_code,
                            "slotId": cartRes?.slotId,
                            "extra_data": {
                                "edit_price": false
                            },
                            "slotNo": cartRes?.slotNo,
                            "serviceDate": cartRes?.serviceDate,
                            "serviceStartTime": cartRes?.serviceStartTime,
                            "serviceEndTime": cartRes?.serviceEndTime,
                            "department_id": cartRes?.department_id, //"fcf91730-6302-11ec-8c2d-6ef3f61dec40-51",
                            "department_name": cartRes?.department_name,//"Health Checkup",
                            "subDepartment_id": cartRes?.subDepartment_id,//"a5c81af1-64ac-11ec-a778-1a3a2074e682-83",
                            "subDepartment_name": cartRes?.subDepartment_name, //"Health Checkup",
                            "qty": 1,  //need to confirm this value
                            "cart_id": cartRes?.id , //cartId,  //need to confirm this value
                            "inclinic_code": cartRes?.inclinic_code,
                            "is_centre_visit": cartRes?.is_centre_visit,
                            "is_home_collection": cartRes?.is_home_collection,
                            "logo_id": cartRes?.logo_id,
                            "doctor_profile_path": "",
                            "patient_instructions": cartRes?.patient_instructions,
                            "slot_type": cartRes?.slot_type,
                            "slot": cartRes?.slot,
                            "center_name": provider?.name,
                            "center_code": provider?.code,
                            "home_collection_code": cartRes?.home_collection_code,
                            // "bp_service_item_id": packageListObj?.data?.id,
                            "patient_pincode": cartRes?.patient_pincode,
                            "patient_city": pincodeAndLocation?.city,
                            "patient_state": cartRes?.patient_state,
                            "package_sub_type": cartRes?.package_sub_type,
                            "package_sub_type_code": cartRes?.package_sub_type_code,
                            "package_type": cartRes?.package_type,
                            "package_type_code": cartRes?.package_type_code,
                            // package_serviceRequestId: selectedItem?.package?.packageServiceItemsStatusInfo && selectedItem?.package?.packageServiceItemsStatusInfo.length > 0 && selectedItem?.package?.packageServiceItemsStatusInfo[0]?.package_serviceRequestId?.package_serviceRequestId ?  selectedItem?.package?.packageServiceItemsStatusInfo[0]?.package_serviceRequestId : ""

                        }
                    ],
                    // "bg_name": cartRes?.bg_name,
                    // "bp_code": cartRes?.bp_code,
                    // "bp_name": cartRes?.bp_name,
                    // "payer_details": {
                    //     "payer_id": cartRes?.payer_id
                    // },
                    // "order_address": {
                    "center_address": {
                        "street1": this.appService.decryptText(cartRes?.center_address?.street1 || cartRes?.order_address?.street1, userInfo?.api_encryption_key), //decreypt
                        "street2": this.appService.decryptText(cartRes?.center_address?.street2 || cartRes?.order_address?.street2, userInfo?.api_encryption_key), //decreypt
                        "city": cartRes?.center_address?.city || cartRes?.order_address?.city,
                        "state": cartRes?.center_address?.state || cartRes?.order_address?.state,
                        "pincode": cartRes?.center_address?.pincode || cartRes?.order_address?.pincode,
                        "street3": "",
                        "pincodeDisplayName": cartRes?.center_address?.pincodeDisplayName || cartRes?.order_address?.pincodeDisplayName,
                        "country": cartRes?.center_address?.country || cartRes?.order_address?.country,
                        "countryDisplayName": cartRes?.center_address?.countryDisplayName || cartRes?.order_address?.countryDisplayName,
                        "latitude": cartRes?.center_address?.latitude || cartRes?.order_address?.latitude,
                        "longitude": cartRes?.center_address?.longitude || cartRes?.order_address?.longitude,
                        "cityDisplayName": cartRes?.center_address?.cityDisplayName || cartRes?.order_address?.cityDisplayName,
                        "stateDisplayName": cartRes?.center_address?.stateDisplayName || cartRes?.order_address?.stateDisplayName
                    },
                    "tag_data": []
                }
            }
        }
        
        console.log('checkout payload :', payload)
        try {
            const response = await firstValueFrom( this.appService.postCall(resorceName, applicationName, '', payload, actionName));
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            if(parsed?.errCode !== -1){
                const resources: any[] = parsed?.resource ?? [];
                console.log('checkout resources ', resources)
                this._ahcCheckoutResponse.set(resources[0])
                this._ahcIsProceedToBooking.set(true)
                this._ahcCopayAmount.set(resources[0]?.checkout_snapshot?.copay_amount)
            } else{
                this._ahcCheckoutResponse.set(null)
                this._ahcIsProceedToBooking.set(false)
                this._ahcCopayAmount.set(0)
            }
            // await this.ahcBookAppointment(userInfo, resources[0])
            return true;
        } catch (error) {
            console.error('AHC checkout failed:', error);
            this._ahcCheckoutResponse.set(null)
            this._ahcCopayAmount.set(0)
            return false;
        }

    }
    async ahcBookAppointment(userInfo: any): Promise<AhcBookingOutcome> {
        const applicationName = 'habit-opd';
        const resorceName = 'opd_ahc_booking';
        const actionName = 'book_appointment';
        const selectedItem: any = this.AHCSelectedItem();
        const checkoutResponse = this._ahcCheckoutResponse();
        
        const checkoutRes = checkoutResponse?.checkout_snapshot?.opdCheckout;
        const checkoutCenterAddress = checkoutResponse?.checkout_snapshot?.opdCheckout?.center_address;
        const checkoutPatientDetails = checkoutResponse?.checkout_snapshot?.opdCheckout?.patient_details;
        const checkoutOpServiceDetails = checkoutResponse?.checkout_snapshot?.opdCheckout?.op_services;
        let finalPayableAmount = checkoutRes?.final_payable
        let homeCollectionCharges = 0.00;
        if(finalPayableAmount <= 2000){
            homeCollectionCharges = 0.00;
            finalPayableAmount = finalPayableAmount + 0;
            // homeCollectionCharges = 200;
            // finalPayableAmount = finalPayableAmount + homeCollectionCharges;
        }
        let payload: any = {
                ahc_route: selectedItem?.tile?.serviceType,
                booking_snapshot: {
                    serviceRequestHandler: {
                        "patient_details": {
                            "patient_id": checkoutRes?.patient_id, // "7b6c2950-da45-11f0-86ee-7a0716908f90-64",
                            "patientType": "OP", //
                            "uhId": checkoutRes?.uhId,
                            "payer_info": { ...checkoutRes?.payer_details}
                        },
                        // "order_address": { ...checkoutCenterAddress},
                        // "center_address": { ...checkoutCenterAddress},
                        "selectedPackageServiceItemIds": [ checkoutOpServiceDetails[0].serviceItemCode
                            //"hyundai-blood-sample-collection-at-home-below-40-female" //service_item_code
                        ],
                        "facility_id": checkoutRes?.facility_id,
                        "scheme_code": "",
                        "is_use_wallet": checkoutRes?.is_use_wallet,
                        // "bg_code": checkoutRes?.bg_code,
                        // "bp_code": checkoutRes?.bp_code,
                        // "bg_name": checkoutRes?.bg_name,
                        // "bp_name": checkoutRes?.bp_name,
                        "scheme_discount_applicable": checkoutRes?.scheme_discount_applicable,
                        "cug_code": checkoutRes?.cug_code,
                        "doctor_id": "",
                        "type": "",
                        "tag_data": [],
                        "bill_amount": checkoutRes?.bill_amount,
                        "net_amount": checkoutRes?.net_amount, 
                        "final_payable": finalPayableAmount, //checkoutRes?.final_payable,
                        "service_mrp": checkoutRes?.service_mrp,
                        "service_selling_amount": checkoutRes?.service_selling_amount,
                        "home_collection_charges": homeCollectionCharges,
                        "discount": checkoutRes?.discount, //0,
                        "care_coin_discount": checkoutRes?.care_coin_discount,
                        "care_coin_discount_amount": checkoutRes?.care_coin_discount_amount,
                        "tax": checkoutRes?.tax,
                        "patient_amount": checkoutRes?.patient_amount,
                        "payer_amount": checkoutRes?.payer_amount,
                        "cug_amount": checkoutRes?.cug_amount,
                        "authorized_amount": checkoutRes?.authorized_amount,
                        "used_wallet_amount": checkoutRes?.used_wallet_amount,
                        "roundOff": checkoutRes?.roundOff,
                        "earn_care_coins": checkoutRes?.earn_care_coins,
                        "is_use_care_coin": checkoutRes?.is_use_care_coin,
                        "billing_category_id": checkoutRes?.billing_category_id,
                        "billing_category_name": checkoutRes?.billing_category_name,
                        "payment_details": [],
                        "payer_details": {
                            "payer_id": checkoutRes?.payer_details?.payer_id
                        },
                        "payment_type": checkoutPatientDetails?.payment_typeId ,// "E-Payment",
                        "payment_status": "Pending",
                        "provider_name": checkoutRes?.provider_name, //"Redcliff Wellness Center",
                        "provider_code": checkoutRes?.provider_code,
                        "old_serviceRequestId": "",
                        "orderedFrom": "Patient Portal",
                        "is_walkin": false,
                        "order_device": "WEB",
                        "order_type": "Patient Portal",
                        "ordering_facility_id": checkoutRes?.facility_id,
                        "services": checkoutOpServiceDetails,
                        "rule_code": "",
                        // "mode_of_appointment": "opd_network",
                        "area_id": "",
                        "branch_id": "",
                        "city_id": "",
                        "zone_Id": "",
                        "slot_id": ""
                    }
                }
            }
            if(payload && payload?.booking_snapshot && payload?.booking_snapshot?.serviceRequestHandler && checkoutOpServiceDetails[0]?.is_home_collection){
                payload.booking_snapshot.serviceRequestHandler.order_address = { ...checkoutCenterAddress}
            } 
            if(payload && payload?.booking_snapshot && payload?.booking_snapshot?.serviceRequestHandler && checkoutOpServiceDetails[0]?.is_centre_visit){
                payload.booking_snapshot.serviceRequestHandler.center_address = { ...checkoutCenterAddress}
            } 
            // if ( payload && payload.booking_snapshot && payload.booking_snapshot.serviceRequestHandler && payload.booking_snapshot.serviceRequestHandler.services?.length) {
            //     payload.booking_snapshot.serviceRequestHandler.services[0].part_of_package = true;
            //     payload.booking_snapshot.serviceRequestHandler.services[0].package_serviceRequestId = selectedItem?.package?.packageServiceItemsStatusInfo[0]?.package_serviceRequestId;
            // }
        console.log('booking payload :', payload)
        try {
            console.log('AHC book_appointment request starting');
            const response = await firstValueFrom( this.appService.postCall(resorceName, applicationName, '', payload, actionName));
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            if (parsed?.errCode === -1) return { status: 'failed' };
            const resources: any[] = parsed?.resource ?? [];
            console.log('Booking response ', resources)
            const patientAmount = Number(checkoutResponse?.checkout_snapshot?.copay_amount) || 0;
            let outcome: AhcBookingOutcome = { status: 'booked' };
            // The member's share is taken through the payment gateway once the booking exists.
            if (patientAmount > 0) {
                const payment = await this.payments.pay(this.paymentRequest(userInfo, checkoutRes, resources, patientAmount));
                outcome =
                    payment.status === 'redirecting' ? { status: 'redirecting' }
                    : payment.status === 'cancelled' ? { status: 'payment-cancelled' }
                    : { status: 'payment-failed', reason: payment.reason };
            }
            // if (outcome.status !== 'redirected') {
            //     this.getAHCList(userInfo);
            //     // The new booking belongs on the bookings screen too.
            //     void this.bookings.refresh();
            // }
            return outcome;
        } catch (error) {
            console.error('AHC book_appointment failed:', error);
            this._ahcCheckoutResponse.set(null)
            return { status: 'failed' };
        }
    }

    /**
     * The payment for a just-booked AHC leg. Ids are read off the
     * book_appointment response — field names are best guesses, confirm
     * against a live response.
     */
    private paymentRequest(userInfo: any, checkoutRes: any, resources: any[], amount: number): PaymentRequest {
        const rows = resources.flatMap((row) => (row?.data ? [row.data, row] : [row]));
        const first = (...keys: string[]): string => {
            for (const row of rows) for (const key of keys) if (textOf(row?.[key])) return textOf(row[key]);
            return '';
        };
        const listed: unknown[] = rows.find((row) => Array.isArray(row?.serviceRequestIds))?.serviceRequestIds ?? [];
        const fromServices = rows.flatMap((row) => (Array.isArray(row?.services) ? row.services : []))
            .map((service: any) => textOf(service?.serviceRequestId ?? service?.id));
        const serviceRequestIds = (listed.length ? listed.map(textOf) : fromServices).filter(Boolean);
        const facilityId = textOf(checkoutRes?.facility_id) || textOf(userInfo?.facilities?.[0]?.org_id);
        const name = pickText(userInfo, 'full_name', 'name', 'display_name') ||
            [userInfo?.first_name, userInfo?.last_name].map(textOf).filter(Boolean).join(' ');
        return {
            amount,
            orderId: first('orderId', 'order_id', 'order_no', 'orderNo'),
            gatewayFacilityId: textOf(checkoutRes?.ordering_facility_id) || facilityId,
            facilityId,
            uhId: textOf(checkoutRes?.uhId) || textOf(userInfo?.user_roles?.[0]?.uhid),
            serviceRequestIds: serviceRequestIds.length ? serviceRequestIds : [first('serviceRequestId')].filter(Boolean),
            serviceRequestHandlerId: first('service_request_handler_id', 'serviceRequestHandlerId', 'id'),
            description: this.AHC()?.data?.service_item || 'Annual Health Check',
            returnTo: '/member/wellness',
            returnLabel: 'Back to Annual Health Check',
            prefill: {
                name,
                email: pickText(userInfo, 'email', 'email_id'),
                contact: pickText(userInfo, 'mobile', 'mobile_no', 'mobile_number', 'phone'),
            },
        };
    }
}

function readStoredProvider(): AhcProvider | null {
    try {
        const stored = sessionStorage.getItem(SELECTED_PROVIDER_KEY);
        return stored ? (JSON.parse(stored) as AhcProvider) : null;
    } catch {
        return null;
    }
}

const textOf = (value: unknown): string => (value === undefined || value === null ? '' : String(value).trim());
/** First non-empty of `keys` on `obj`. */
const pickText = (obj: any, ...keys: string[]): string => {
    for (const key of keys) {
        const value = textOf(obj?.[key]);
        if (value) return value;
    }
    return '';
};

/**
 * Field names below are best guesses at AHC_PROVIDER_LISTING's `data` — confirm
 * against a live row and trim to the real ones.
 */
function toProvider(row: any, index: number): AhcProvider {
    const d = row?.data ?? row ?? {};
    const addr = d.address;
    const address = typeof addr === 'string'
        ? addr.trim()
        : [addr?.street1, addr?.street2, addr?.cityDisplayName ?? addr?.city, addr?.stateDisplayName ?? addr?.state, addr?.pincode]
            .map(textOf).filter(Boolean).join(', ') || pickText(d, 'full_address', 'center_address', 'centre_address');
    return {
        id: textOf(row?.id) || textOf(d.id) || 'provider-' + index,
        name: pickText(d, 'provider_name', 'center_name', 'centre_name', 'facility_name', 'org_name', 'name', 'display_name') || 'Provider',
        code: pickText(d, 'provider_code', 'code'),
        centreCode: pickText(d, 'center_code', 'centre_code'),
        address,
        raw: d,
    };
}

const toCoord = (value: unknown): number | null => {
    const n = typeof value === 'number' ? value : parseFloat(textOf(value));
    return Number.isFinite(n) ? n : null;
};

/** Epoch ms from epoch ms (number or digits) or a date string; null otherwise. */
const toEpoch = (value: unknown): number | null => {
    const text = textOf(value);
    if (!text) return null;
    const n = /^\d+$/.test(text) ? Number(text) : Date.parse(text);
    return Number.isFinite(n) ? n : null;
};

/** Great-circle (haversine) distance in kilometres. */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * A centre row of AHC_DYNAMIC_WELLNESS_SLOTS. Coordinates come from
 * `primary_address`, falling back to the GeoJSON `location_coordinate`
 * (`[longitude, latitude]`).
 */
function toCentre(row: any, index: number, origin: { latitude: number | null; longitude: number | null }): AhcCentre {
    const d = row?.data ?? row ?? {};
    const a = d.primary_address ?? {};
    const parts = [
        a.street1,
        a.street2,
        a.street3,
        textOf(a.cityDisplayName) || a.city,
        textOf(a.stateDisplayName) || a.state,
        textOf(a.countryDisplayName) || a.country,
    ].map(textOf).filter(Boolean);
    // street2 often repeats the city ("Noida", "Noida"): show each part once.
    const address = parts.filter((p, i) => parts.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i).join(', ');

    const point: unknown[] = Array.isArray(d.location_coordinate?.coordinates) ? d.location_coordinate.coordinates : [];
    const latitude = toCoord(a.latitude) ?? toCoord(point[1]);
    const longitude = toCoord(a.longitude) ?? toCoord(point[0]);
    const distance =
        latitude !== null && longitude !== null && origin.latitude !== null && origin.longitude !== null
            ? distanceKm(origin.latitude, origin.longitude, latitude, longitude)
            : null;

    return {
        id: textOf(row?.id) || textOf(d.id) || 'centre-' + index,
        name: pickText(d, 'name', 'center_name', 'centre_name') || 'Centre',
        address,
        latitude,
        longitude,
        distanceKm: distance,
        raw: d,
    };
}

/**
 * Slots may come one per row or grouped under a `slots` array; both are
 * flattened. Field names are best guesses — confirm against a live response.
 */
function toSlots(rows: any[], day?: Date): AhcSlot[] {
    const items: any[] = rows.flatMap((row) => {
        const d = row?.data ?? row;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.slots)) return d.slots;
        return [d];
    });
    const weekday = day ? day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() : '';
    return items
        .filter((item) => item && typeof item === 'object')
        // Centre slots list the weekdays they run on (`days`); drop the ones not on the picked day.
        .filter((item) => !weekday || !Array.isArray(item.days) || !item.days.length ||
            item.days.some((d: any) => [d?.id, d?.text, d].some((v) => textOf(typeof v === 'object' ? '' : v).toLowerCase() === weekday)))
        .map((item, index) => {
            const start = timeText(item, 'start_time', 'startTime', 'from_time', 'slot_start_time', 'event_start_time', 'slot_time', 'time');
            const end = timeText(item, 'end_time', 'endTime', 'to_time', 'slot_end_time', 'event_end_time');
            const status = pickText(item, 'status', 'slot_status').toLowerCase();
            const available = !(
                item.is_booked === true || item.available === false || item.is_available === false ||
                status === 'booked' || status === 'unavailable' || status === 'blocked'
            );
            return {
                // `slot_id` repeats across centre slots (all 1), and `id` is not guaranteed
                // either, so the index keeps every slot distinct for selection and `track`.
                id: (pickText(item, 'id', 'slot_id') || 'slot') + '-' + index,
                label: pickText(item, 'slot_label', 'display_time', 'slot') || [start, end].filter(Boolean).join(' – ') || 'Slot ' + (index + 1),
                available,
                raw: item,
            };
        });
}

/** A time field as "9:00 AM": epoch ms is formatted, anything else is shown as sent. */
function timeText(item: any, ...keys: string[]): string {
    const value = pickText(item, ...keys);
    if (/^\d{12,}$/.test(value)) {
        return new Date(Number(value)).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return value;
}
/** `day` at the local time of day of the epoch `ms`; null when `ms` is not a time. */
function atTimeOfDay(day: Date, ms: unknown): number | null {
    const time = new Date(Number(ms));
    if (!day || !Number.isFinite(time.getTime())) return null;
    const out = new Date(day);
    out.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return out.getTime();
}

function addTimeToDate(dateObj: any, timeString: any) {
  const newDate = new Date(dateObj); // Clone original date to avoid mutation
  let [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}