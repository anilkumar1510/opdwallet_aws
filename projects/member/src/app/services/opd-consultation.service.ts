// Online Consultation Service
// Manages API integration for the teleconsultation journey

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { AppService } from '../core/http/api.service';

// API Response Interfaces
export interface Speciality {
  id?: string;
  name?: string;
  speciality_id?: string;
  speciality_name: string;
  speciality_code: string;
  speciality_type?: string;
  mode_of_appointment?: string;
  code?: string;
  display?: string;
  facility_name?: string;
  facility_id?: string;
  facility_master_type?: string;
  speciality_system_name?: string;
  status?: string;
  status_id?: string;
  applicable_for_appointment?: boolean;
  applicable_for_women?: boolean;
  profile_id?: string;
}

export interface Doctor {
  id?: string;
  name: string;
  qualification?: string;
  experience?: number;
  fee?: number;
  mrp?: number;
  selling_amount?: number;
  selling_discount_rate?: number;
  rating?: number;
  gender?: 'Male' | 'Female';
  languages?: string;
  nextIn?: string;
  next_slot_date_video?: number;
  canConsultNow?: boolean;
  speciality?: string;
  speciality_id?: string;
  speciality_code?: string;
  profile_id?: string;
  profile_path?: string;
  doctor_code?: string;
  facility_id?: string;
  facility_name?: string;
  facility_address?: any;
  department_id?: string;
  department_name?: string;
  subDepartment_id?: string;
  subDepartment_name?: string;
  provider_code?: string;
  provider_name?: string;
  cug_code?: string;
  mode_of_appointment?: string;
  telecom?: string;
}

export interface Slot {
  id?: string;
  doctor_id?: string;
  slot_date?: number;
  slot_start_time?: number;
  slot_end_time?: number;
  slotNo?: number;
  status?: string;
  schedule_id?: string;
  slot_days?: string;
  slot_visibility?: string;
  vip?: boolean;
  total_booked?: number;
  walkIn_over_booking?: boolean;
  still_available?: number;
  reason?: string;
  slotStartTime?: string;
  slotEndTime?: string;
}

export interface Patient {
  id?: string;
  name?: string;
  rel?: string;
  patient_id?: string;
  uhId?: string;
  mapped_id?:string
}

export interface CartSnapshot {
  cart_snapshot?: {
    facility_id?: string;
    patient_id?: string;
    serviceType?: string;
    serviceType_code?: string;
    serviceItemId?: string;
    serviceItemName?: string;
    serviceItemCode?: string;
    service_code?: string;
    provider_name?: string;
    provider_code?: string;
    cug_code?: string;
    mrp?: number;
    selling_discount_rate?: number;
    selling_amount?: number;
    status?: string;
    department_name?: string;
    department_id?: string;
    subDepartment_name?: string;
    subDepartment_id?: string;
    speciality_id?: string;
    serviceDate?: number;
    serviceStartTime?: number;
    serviceEndTime?: number;
    slotId?: string;
    slotNo?: number;
    slot?: string;
    slot_type?: string;
    mode_of_appointment?: string;
    consultation_type_code?: string;
    tag_data?: any[];
    [key: string]: any;
  };
}

export interface OpService {
  serviceItemId?: string;
  serviceItemName?: string;
  speciality_id?: string;
  speciality_name?: string;
  speciality_code?: string;
  service_code?: string;
  part_of_package?: boolean;
  serviceItemCode?: string;
  consultation_type?: string;
  consultation_type_code?: string;
  over_booking_status?: boolean;
  order_date_time?: number;
  speciality_name_upper?: string;
  service_type?: string;
  serviceName?: string;
  appointment_time?: number;
  serviceType?: string;
  serviceType_code?: string;
  slotId?: string;
  extra_data?: {
    edit_price?: boolean;
    speciality_name?: string;
    facility_name?: string;
    qualification?: string;
    [key: string]: any;
  };
  slotNo?: string | number;
  serviceDate?: number;
  serviceStartTime?: number;
  serviceEndTime?: number;
  category?: string;
  department_id?: string;
  department_name?: string;
  subDepartment_id?: string;
  subDepartment_name?: string;
  qty?: number;
  cart_id?: string;
  is_centre_visit?: boolean;
  is_home_collection?: boolean;
  logo_id?: string;
  doctor_profile_path?: string;
  patient_instructions?: string;
  practice_type_code?: string;
  practice_type_name?: string;
  performing_doctor?: string;
  participant?: Array<{
    participantId?: string;
    participantName?: string;
    participantRole?: string;
  }>;
  doctor_experience?: string;
  doctor_telecom?: string;
  [key: string]: any;
}

export interface CheckoutSnapshot {
  policy_id?: string;
  checkout_snapshot?: {
    opdCheckout?: {
      facility_id?: string;
      patient_id?: string;
      scheme_code?: string;
      is_use_wallet?: boolean;
      bg_code?: string;
      scheme_discount_applicable?: boolean;
      type?: string;
      uhId?: string;
      is_use_care_coin?: boolean;
      orderedFrom?: string;
      old_serviceRequestId?: string;
      provider_name?: string;
      provider_code?: string;
      op_services?: OpService[];
      mode_of_appointment?: string;
      facility_address?: any;
      tag_data?: any[];
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export interface BookingResponse {
  serviceRequestId?: string;
  cartId?: string;
  invoiceUrl?: string;
  bookingStatus?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class OpdConsultationService {
  private readonly baseUrl = '/habit-opd/api/v1/opd_tele_booking';

  // Loading and error state management
  private readonly _loading = new BehaviorSubject<Record<string, boolean>>({});
  private readonly _errors = new BehaviorSubject<Record<string, string>>({});

  readonly loading$ = this._loading.asObservable();
  readonly errors$ = this._errors.asObservable();

  private cugCode: string = 'HCLHC001';

  constructor(
    private http: HttpClient,
    private appService: AppService
  ) {
    this.fetchInitialConfig();
  }

  private fetchInitialConfig(): void {
    this.getMyConfig().subscribe(config => {
      this.cugCode = config.cug_code;
    });
  }

  // Helper to manage loading state
  private setLoading(key: string, value: boolean): void {
    const current = this._loading.value;
    this._loading.next({ ...current, [key]: value });
  }

  private setError(key: string, error: string | null): void {
    const current = this._errors.value;
    if (error) {
      this._errors.next({ ...current, [key]: error });
    } else {
      const { [key]: removed, ...rest } = current;
      this._errors.next(rest);
    }
  }

  isLoading(key: string): boolean {
    return this._loading.value[key] === true;
  }

  getError(key: string): string | undefined {
    return this._errors.value[key];
  }

  clearError(key: string): void {
    this.setError(key, null);
  }

  // Helper to build URL with query parameters
  private buildUrl(queryId: string, args: string, application: string = 'habit-opd'): string {
    return `${this.baseUrl}?queryId=${queryId}&args=${encodeURIComponent(args)}&application=${application}`;
  }

  private executeWithLoading<T>(key: string, observable: Observable<T>): Observable<T> {
    this.setLoading(key, true);
    this.setError(key, null);
    return observable.pipe(
      tap(() => this.setError(key, null)),
      catchError(error => {
        const message = error?.message || 'An error occurred';
        this.setError(key, message);
        throw error;
      }),
      finalize(() => this.setLoading(key, false))
    );
  }

  // GET_MY_CONFIG API - Fetches user-specific config including cug_code
  getMyConfig(): Observable<any> {
    return this.http.get<any>(
      '/account-management/api/v1/application_master?queryId=GET_MY_CONFIG&args=dummy:dummy,account_url:www.habithealth.com&application=account-management'
    ).pipe(
      map(response => {
        const resource = response?.resource?.[0];
        if (resource) {
          // Extract cug_code from the first facility in the response
          const cugCode = resource.facilities?.[0]?.cug_code || 'HCLHC001';
          return {
            cug_code: cugCode,
            currency: resource.currency_account || 'INR',
            time_zone: resource.time_zone_account || 'Asia/Kolkata',
            domain: resource.domain || 'HCLHealthcare'
          };
        }
        return { cug_code: 'HCLHC001', currency: 'INR', time_zone: 'Asia/Kolkata', domain: 'HCLHealthcare' };
      }),
      catchError(error => {
        console.error('Error fetching config:', error);
        return error
      })
    );
  }

  // Speciality Listing API
  getSpecialities(): Observable<Speciality[]> {
    const url = this.buildUrl('TELE_SPECIALITY_LISTING', `cug_code:${this.cugCode},mode_of_appointment:opd_network`);
    return this.executeWithLoading('specialities', this.http.get<any>(url))
      .pipe(
        map((response: any) => {
          const parsed = typeof response === 'string' ? JSON.parse(response) : response;
          return parsed?.resource || [];
        }),
        map((items: any[]) =>
          items
            .filter((item: any) => {
              const d = item?.data || item;
              if (!d) return false;
              if (d.applicable_for_appointment === false) return false;
              if (typeof d.status === 'string' && d.status.trim().toLowerCase() === 'inactive') return false;
              if (typeof d.status_id === 'string' && d.status_id.trim().toLowerCase() === 'inactive') return false;
              return true;
            })
            .map((item: any): Speciality => {
              const d = item?.data || item;
              const name = d.display || d.speciality_system_name || d.speciality_name || d.name || '';
              const code = d.specialityCode || d.speciality_code || d.speciality_system_name || d.code || name;
              const id = d.id || item?.id || d.speciality_id || '';
              return {
                id,
                name,
                speciality_id: id,
                speciality_name: name,
                speciality_code: code,
                speciality_type: d.speciality_type || d.facility_master_type,
                mode_of_appointment: d.mode_of_appointment,
                code,
                display: name,
                facility_name: d.facility_name,
                facility_id: d.facility_id,
                facility_master_type: d.facility_master_type,
                speciality_system_name: d.speciality_system_name,
                status: d.status,
                status_id: d.status_id,
                applicable_for_appointment: d.applicable_for_appointment,
                applicable_for_women: d.applicable_for_women,
                profile_id: d.profile_id,
              };
            })
        )
      );
  }

  // Doctor Listing API - TELE_DOCTOR_LISTING
  getDoctors(
    specialityFilterCode: string = 'general physician',
    consultationType: string = 'video',
    facilityId: string = '4c5baa60-db39-11f0-b303-8ae465e2df26-45',
    baseSpecialityCode: string = 'GENERAL PHYSICIAN',
    search: string = '',
    pageSize: number = 20,
    pageNo: number = 0
  ): Observable<Doctor[]> {
    const mode = (consultationType || 'video').toLowerCase();
    const facId = facilityId || '4c5baa60-db39-11f0-b303-8ae465e2df26-45';
    const baseSpec = (baseSpecialityCode || 'GENERAL PHYSICIAN').trim();
    const filterCode = (specialityFilterCode || 'general physician').trim();

    const filter = `specialityCode:${encodeURIComponent(filterCode)}`;
    const searchParam = search ? encodeURIComponent(search.trim()) : '';
    const paging = pageSize ? `&page_size=${pageSize}&page_no=${pageNo}` : '';
    const searchPart = searchParam ? `&search=${searchParam}&search_columns=display_name` : '';

    const url = `${this.baseUrl}?queryId=TELE_DOCTOR_LISTING&filter=${filter}${paging}${searchPart}&application=habit-opd`;

    return this.executeWithLoading('doctors', this.http.get<{ resource: any[] }>(url))
      .pipe(
        map((response: any) => {
          const parsed = typeof response === 'string' ? JSON.parse(response) : response;
          return parsed?.resource || [];
        }),
        map((items: any[]) => items.map((item: any): Doctor => {
          const d = item.data || item;
          const modeKey = mode === 'audio' ? 'audio' : 'video';
          const priceObj = d.price_details?.find((p: any) => p.consultation_type === modeKey)
            || d.price_details?.find((p: any) => p.consultation_type === 'video')
            || d.price_details?.[0];
          const fee = priceObj?.selling_amount ?? priceObj?.mrp ?? d.fee ?? 0;
          const mrp = priceObj?.mrp ?? fee;
          const sellingDiscountRate = priceObj?.selling_discount_rate ?? 0;
          const nextSlotVideo = d.next_slot_date_video ? Number(d.next_slot_date_video) : (d.slot_start_time ? Number(d.slot_start_time) : null);
          let nextInLabel = 'Not available';
          let canConsultNow = false;

          if (d.status === 'available') {
            nextInLabel = 'Available now';
            canConsultNow = true;
          } else if (nextSlotVideo) {
            const diffMinutes = Math.round((nextSlotVideo - Date.now()) / 60000);
            if (diffMinutes >= -5 && diffMinutes <= 5) {
              nextInLabel = 'Available now';
              canConsultNow = true;
            } else if (diffMinutes > 5 && diffMinutes < 60) {
              nextInLabel = `in ${diffMinutes} min`;
              canConsultNow = false;
            } else if (diffMinutes >= 60 && diffMinutes < 24 * 60) {
              const hours = Math.floor(diffMinutes / 60);
              const mins = diffMinutes % 60;
              nextInLabel = mins > 0 ? `in ${hours} hr ${mins} min` : `in ${hours} hr`;
              canConsultNow = false;
            } else if (diffMinutes >= 24 * 60) {
              const days = Math.round(diffMinutes / (24 * 60));
              nextInLabel = `in ${days} day${days > 1 ? 's' : ''}`;
              canConsultNow = false;
            }
          }

          const qualText = Array.isArray(d.qualification)
            ? d.qualification.map((q: any) => q.text || q).join(', ')
            : (d.qualification?.[0]?.text || d.qualification?.text || d.qualification || d.extra_data?.qualification || '');

          const langText = Array.isArray(d.language)
            ? d.language.map((l: any) => l.text || l).join(', ')
            : (d.languages || '');

          return {
            id: d.doctor_id || d.id || item.id,
            name: d.display_name || d.doctor_name || d.name || '',
            qualification: qualText,
            experience: parseInt(d.doctor_experience || d.experience) || 0,
            fee,
            mrp,
            selling_amount: fee,
            selling_discount_rate: sellingDiscountRate,
            rating: d.rating || 0,
            gender: d.gender_name || d.gender,
            languages: langText,
            nextIn: nextInLabel,
            next_slot_date_video: nextSlotVideo || undefined,
            canConsultNow,
            speciality: d.speciality || d.speciality_name || d.specialityCode || filterCode || baseSpec,
            speciality_id: d.speciality_id || '',
            speciality_code: d.speciality_code || d.specialityCode || filterCode || baseSpec,
            facility_id: d.facility_id || facId,
            facility_name: d.facility_name || d.extra_data?.facility_name || '',
            facility_address: d.facility_address || d.address,
            department_id: d.department_id || '',
            department_name: d.department_name || '',
            subDepartment_id: d.subDepartment_id || '',
            subDepartment_name: d.subDepartment_name || '',
            doctor_code: d.doctor_code || d.serviceItemCode || '',
            profile_path: d.doctor_profile_path || d.profile_path || '',
            provider_code: d.provider_code || 'HCLHC001',
            provider_name: d.provider_name || 'HCL Healthcare',
            cug_code: d.cug_code || this.cugCode,
            mode_of_appointment: d.mode_of_appointment || 'opd_network',
            telecom: d.telecom || d.doctor_telecom || ''
          };
        }))
      );
  }

  // Slot Availability API
  getSlots(practitionerId: string, slotDate: number, slotDays: string, facilityId: string, departmentId: string, uhId: string): Observable<Slot[]> {
    const url = this.buildUrl('TELE_SLOT_AVAILABILITY', `practitioner_id:${practitionerId},slot_date:${slotDate},slot_days:${slotDays},serviceItemCode:video,facility_id:${facilityId},practice_type_code:individual,department_id:${departmentId},serviceType_code:op_consultation,uhId:${uhId}`);

    return this.executeWithLoading('slots', this.http.get<{ resource: any[] }>(url))
      .pipe(
        map(response => response.resource || []),
        map(items => items.map(item => ({
          ...item.data,
          slotStartTime: this.formatTime(item.data?.slot_start_time),
          slotEndTime: this.formatTime(item.data?.slot_end_time)
        })) as Slot[])
      );
  }

  private formatTime(timestamp: number | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hourCycle: 'h23'
    });
  }

  // Family Members API
  getFamilyList(): Observable<Patient[]> {
    return this.executeWithLoading('family', this.http.get<{ resource: any[] }>('/account-management/api/v1/user_relationship_mapping?queryId=GET_FAMILY_LIST&args=&application=account-management'))
      .pipe(
        map(response => response.resource || []),
        map(items => {
          const sessionUser = this.appService.getCurrentSessionData('userInfo');
          const sessionUhId = sessionUser?.[0]?.user_roles?.[0]?.uhid || sessionUser?.[0]?.uhid || '';
          return items.map(item => {
            const isSelf = !item.relationship_code || item.relationship_code?.toLowerCase() === 'self' || item.relationship?.toLowerCase() === 'self';
            const uhId = item.uhId || item.uhid || (isSelf ? sessionUhId : '') || '';
            return {
              id: item.id,
              name: item.mapped_name,
              rel: item.relationship || 'self',
              patient_id: item.id,
              uhId: uhId,
              mapped_id: item.mapped_id
            } as Patient;
          });
        })
      );
  }

  // Add to Cart API
  addToCart(cartData: CartSnapshot): Observable<{ resource: { cart_snapshot: any } }> {
    return this.executeWithLoading('cart',
      this.appService.postCall('opd_tele_booking', 'habit-opd', '', cartData, 'cart_add').pipe(
        map((response: any) => typeof response === 'string' ? JSON.parse(response) : response)
      )
    );
  }

  // Checkout API
  checkout(checkoutData: CheckoutSnapshot): Observable<any> {
    return this.executeWithLoading('checkout',
      this.appService.postCall('opd_tele_booking', 'habit-opd', '', checkoutData, 'checkout').pipe(
        map((response: any) => typeof response === 'string' ? JSON.parse(response) : response)
      )
    );
  }

  // Book Appointment API
  bookAppointment(bookingData: any): Observable<BookingResponse> {
    return this.executeWithLoading('booking',
      this.appService.postCall('opd_tele_booking', 'habit-opd', '', bookingData, 'book_appointment').pipe(
        map((response: any) => typeof response === 'string' ? JSON.parse(response) : response),
        map(response => response?.resource || response || {})
      )
    );
  }

  // Video Checkin API
  videoCheckin(serviceRequestId: string): Observable<any> {
    return this.executeWithLoading('videoCheckin',
      this.appService.postCall('opd_tele_booking', 'habit-opd', '', {
        service_request_id: serviceRequestId,
        tag_data: []
      }, 'video_checkin').pipe(
        map((response: any) => typeof response === 'string' ? JSON.parse(response) : response),
        map(response => response?.resource || [])
      )
    );
  }

  // Agora App ID Credentials API
  getAgoraCredentials(): Observable<string> {
    const fallbackAppId = 'e4e1a21b3c8b4488bc3c219e2491bed0';
    return this.appService.getcall('opd_tele_booking', 'habit-opd', 'queryId=TELE_AGORA_CREDENTIALS&args=key:agora_app_id&application=habit-opd').pipe(
      map((response: any) => typeof response === 'string' ? JSON.parse(response) : response),
      map((res: any) => {
        const appId = res?.resource?.[0]?.data?.value;
        return appId && typeof appId === 'string' ? appId.trim() : fallbackAppId;
      }),
      catchError((err) => {
        console.warn('Failed to fetch Agora credentials, using fallback App ID:', err);
        return of(fallbackAppId);
      })
    );
  }

  // Agora Token API
  getAgoraToken(channelName: string): Observable<{ channelId: string; tokenId: string }> {
    return this.appService.getcall('opd_tele_booking', 'habit-opd', `queryId=TELE_AGORA_TOKEN&args=channelName:${channelName}&application=habit-opd`).pipe(
      map((response: any) => typeof response === 'string' ? JSON.parse(response) : response),
      map((res: any) => {
        const data = res?.resource?.[0]?.data || {};
        return {
          channelId: data.channel_id || channelName,
          tokenId: data.token_id || ''
        };
      })
    );
  }

  // Prescription Document API
  getPrescription(serviceRequestId: string): Observable<any> {
    return this.http.get<{ resource: any }>(`${this.baseUrl}?queryId=TELE_PRESCRIPTION_DOCUMENT&args=service_request_id:${serviceRequestId}`)
      .pipe(
        map(response => response.resource || {}),
        catchError(error => {
          console.error('Error fetching prescription:', error);
          throw error;
        })
      );
  }
}