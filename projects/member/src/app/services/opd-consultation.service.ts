// Online Consultation Service
// Manages API integration for the teleconsultation journey

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';

// API Response Interfaces
export interface Speciality {
  id?: string;
  name: string;
  speciality_id?: string;
  speciality_name: string;
  speciality_code: string;
  speciality_type?: string;
  mode_of_appointment?: string;
}

export interface Doctor {
  id?: string;
  name: string;
  qualification?: string;
  experience?: number;
  fee?: number;
  rating?: number;
  gender?: 'Male' | 'Female';
  languages?: string;
  nextIn?: string;
  speciality?: string;
  speciality_id?: string;
  profile_id?: string;
  profile_path?: string;
  doctor_code?: string;
  facility_id?: string;
  department_id?: string;
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
}

export interface CartSnapshot {
  cart_snapshot?: {
    opdcart?: {
      id?: string;
      facility_id?: string;
      facility_name?: string;
      patient_id?: string;
      speciality_id?: string;
      serviceType?: string;
      serviceType_code?: string;
      serviceItemId?: string;
      serviceItemName?: string;
      serviceItemCode?: string;
      service_code?: string;
      provider_name?: string;
      provider_code?: string;
      mode_of_appointment?: string;
      extra_data?: any;
      tag_data?: any[];
      facility_address?: {
        street1?: string;
        street2?: string;
        street3?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
        cityDisplayName?: string;
        stateDisplayName?: string;
        pincodeDisplayName?: string;
        countryDisplayName?: string;
      };
      status?: string;
      specility_code?: string;
      specility_display?: string;
      doctor_experience?: string;
    };
  };
}

export interface CheckoutSnapshot {
  checkout_snapshot?: {
    patient_id?: string;
    checkoutsnapshot?: {
      facility_id?: string;
      doctor_id?: string;
      speciality_id?: string;
      consultation_type?: string;
      consultation_type_code?: string;
      patient_type?: string;
      slot_id?: string;
      serviceDate?: number;
      serviceStartTime?: number;
      serviceEndTime?: number;
      overdure?: number;
      penalty?: number;
      serviceItemId?: string;
    };
  };
}

export interface BookingResponse {
  serviceRequestId?: string;
  cartId?: string;
  invoiceUrl?: string;
  bookingStatus?: string;
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

  constructor(private http: HttpClient) {
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
    return this.executeWithLoading('specialities', this.http.get<{ resource: any[] }>(url))
      .pipe(
        map(response => response.resource || []),
        map(items => items.map(item => ({
          speciality_id: item.data?.speciality_id,
          speciality_name: item.data?.speciality_name,
          speciality_code: item.data?.speciality_code,
          speciality_type: item.data?.speciality_type,
          mode_of_appointment: item.data?.mode_of_appointment
        })) as Speciality[])
      );
  }

  // Doctor Listing API
  getDoctors(specialityCode: string, consultationType: string = 'video'): Observable<Doctor[]> {
    const url = this.buildUrl('TELE_DOCTOR_LISTING', `consultation_type:${consultationType},speciality_code:${specialityCode},provider_code:${this.cugCode},serviceType_code:op_consultation,doctor_mode:yes,cug_code:${this.cugCode}`);

return this.executeWithLoading('doctors', this.http.get<{ resource: any[] }>(url))
      .pipe(
        map((response: any) => response.resource || []),
        map((items: any[]) => items.map((item: any): Doctor => {
          const videoFee = item.data?.price_details?.find((p: any) => p.consultation_type === 'video')?.selling_amount || 0;
          return {
            id: item.data?.doctor_id,
            name: item.data?.display_name,
            qualification: item.data?.qualification?.[0]?.text,
            experience: parseInt(item.data?.doctor_experience) || 0,
            fee: videoFee,
            rating: 0,
            gender: item.data?.gender_name,
            languages: item.data?.language?.map((l: any) => l.text).join(', '),
            nextIn: item.data?.status_code === 'active' ? 'Available now' : 'in ' + Math.round((item.data?.next_slot_date_video - Date.now()) / 60000) + ' min',
            speciality: item.data?.speciality,
            speciality_id: item.data?.speciality_id,
            facility_id: item.data?.facility_id,
            department_id: item.data?.department_id,
            doctor_code: item.data?.doctor_code,
            profile_path: item.data?.profile_path
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
        map(items => items.map(item => ({
          id: item.id,
          name: item.mapped_name,
          rel: item.relationship||'self',
          patient_id: item.id,
          uhId: item.uhId
        })) as Patient[])
      );
  }

  // Add to Cart API
  addToCart(cartData: CartSnapshot): Observable<{ resource: { cart_snapshot: any } }> {
    const body = {
      resource: btoa(JSON.stringify(cartData)),
      action: 'cart_add'
    };

    return this.executeWithLoading('cart', this.http.post<{ resource: { cart_snapshot: any } }>(this.baseUrl, body));
  }

  // Checkout API
  checkout(checkoutData: CheckoutSnapshot): Observable<any> {
    const body = {
      resource: btoa(JSON.stringify(checkoutData)),
      action: 'checkout'
    };

    return this.executeWithLoading('checkout', this.http.post<any>(this.baseUrl, body));
  }

  // Book Appointment API
  bookAppointment(bookingData: any): Observable<BookingResponse> {
    const body = {
      resource: btoa(JSON.stringify(bookingData)),
      action: 'book_appointment'
    };

    return this.executeWithLoading('booking', this.http.post<{ resource: BookingResponse }>(this.baseUrl, body))
      .pipe(
        map(response => response.resource || {})
      );
  }

  // Video Checkin API
  videoCheckin(serviceRequestId: string): Observable<any> {
    const body = {
      resource: btoa(JSON.stringify({
        service_request_id: serviceRequestId,
        tag_data: []
      })),
      action: 'video_checkin'
    };

    return this.executeWithLoading('videoCheckin', this.http.post(this.baseUrl, body))
      .pipe(
        map(response => (response as any).resource || [])
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