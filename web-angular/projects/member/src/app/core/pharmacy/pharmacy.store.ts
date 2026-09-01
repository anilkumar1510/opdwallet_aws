import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppError, appError, isAppError } from '../http/app-error';
import { SessionStore } from '../session/session.store';
import {
  Cart,
  CartDto,
  DeliveryAddressDto,
  Medicine,
  MedicineDto,
  Order,
  OrderDto,
  PHARMACY_API,
  toCart,
  toMedicine,
  toOrder,
} from './pharmacy';

@Injectable({ providedIn: 'root' })
export class PharmacyStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  private readonly _medicines = signal<readonly Medicine[]>([]);
  private readonly _medicinesLoading = signal(false);
  private readonly _medicinesError = signal<AppError | null>(null);

  private readonly _cart = signal<Cart | null>(null);
  private readonly _cartLoading = signal(false);
  private readonly _cartActionError = signal<string | null>(null);

  private readonly _order = signal<Order | null>(null);
  private readonly _submitting = signal(false);
  private readonly _paying = signal(false);
  private readonly _orderError = signal<string | null>(null);

  readonly medicines = this._medicines.asReadonly();
  readonly medicinesLoading = this._medicinesLoading.asReadonly();
  readonly medicinesError = this._medicinesError.asReadonly();

  readonly cart = this._cart.asReadonly();
  readonly cartLoading = this._cartLoading.asReadonly();
  readonly cartActionError = this._cartActionError.asReadonly();

  readonly order = this._order.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly paying = this._paying.asReadonly();
  readonly orderError = this._orderError.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) this.reset();
    });
  }

  /** Step 3: search the catalogue. Empty query returns everything active. */
  async searchMedicines(query = ''): Promise<void> {
    this._medicinesLoading.set(true);
    this._medicinesError.set(null);
    try {
      let params = new HttpParams();
      if (query.trim()) params = params.set('search', query.trim());
      const response = await firstValueFrom(
        this.http.get<{ medicines?: MedicineDto[] }>(PHARMACY_API.medicines, { params }),
      );
      this._medicines.set((response.medicines ?? []).map(toMedicine));
    } catch (error: unknown) {
      this._medicines.set([]);
      this._medicinesError.set(isAppError(error) ? error : appError('server'));
    } finally {
      this._medicinesLoading.set(false);
    }
  }

  /** Gets or creates the member's open cart, then loads it. */
  async openCart(patientId: string, patientName: string, prescriptionFileName?: string): Promise<void> {
    this._cartLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<CartDto>(PHARMACY_API.carts, { patientId, patientName, prescriptionFileName }),
      );
      this._cart.set(toCart(response));
    } catch {
      this._cart.set(null);
    } finally {
      this._cartLoading.set(false);
    }
  }

  async addItem(medicineId: string, quantity: number): Promise<void> {
    const cartId = this._cart()?.id;
    if (!cartId) return;
    this._cartActionError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<CartDto>(PHARMACY_API.cartItems(cartId), { medicineId, quantity }),
      );
      this._cart.set(toCart(response));
    } catch (error: unknown) {
      this._cartActionError.set(isAppError(error) ? error.message : 'We could not add that medicine.');
    }
  }

  /** Abandon the in-progress cart locally so the page re-asks the prescription question. The server-side cart is untouched — answering again resumes it. */
  clearCart(): void {
    this._cart.set(null);
    this._cartActionError.set(null);
  }

  async removeItem(medicineId: string): Promise<void> {
    const cartId = this._cart()?.id;
    if (!cartId) return;
    try {
      const response = await firstValueFrom(
        this.http.delete<CartDto>(PHARMACY_API.cartItem(cartId, medicineId)),
      );
      this._cart.set(toCart(response));
    } catch {
      // Leave the cart as-is — a failed remove is not worth surfacing.
    }
  }

  /** Steps 4-6 in one call: submit for adjudication, get the adjusted order back. */
  async submitCart(deliveryAddress: DeliveryAddressDto): Promise<Order | null> {
    const cartId = this._cart()?.id;
    if (!cartId) return null;
    this._submitting.set(true);
    this._orderError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<OrderDto>(PHARMACY_API.orders, { cartId, deliveryAddress }),
      );
      const order = toOrder(response);
      this._order.set(order);
      return order;
    } catch (error: unknown) {
      this._orderError.set(isAppError(error) ? error.message : 'We could not submit that cart.');
      return null;
    } finally {
      this._submitting.set(false);
    }
  }

  async loadOrder(orderId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<OrderDto>(PHARMACY_API.orderById(orderId)));
      this._order.set(toOrder(response));
    } catch (error: unknown) {
      this._orderError.set(isAppError(error) ? error.message : 'We could not load that order.');
    }
  }

  /** Step 8: pay against the adjudicated breakdown. */
  async pay(orderId: string): Promise<Order | null> {
    this._paying.set(true);
    this._orderError.set(null);
    try {
      const response = await firstValueFrom(this.http.post<OrderDto>(PHARMACY_API.pay(orderId), {}));
      const order = toOrder(response);
      this._order.set(order);
      return order;
    } catch (error: unknown) {
      this._orderError.set(isAppError(error) ? error.message : 'We could not complete that payment.');
      return null;
    } finally {
      this._paying.set(false);
    }
  }

  /**
   * Step 13: cancel — allowed up through CONFIRMED (paid, not yet
   * delivered). The API refunds the wallet debit when one was made.
   */
  async cancel(orderId: string, reason = 'Cancelled by member'): Promise<Order | null> {
    this._orderError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<OrderDto>(PHARMACY_API.cancel(orderId), { reason }),
      );
      const order = toOrder(response);
      this._order.set(order);
      return order;
    } catch (error: unknown) {
      this._orderError.set(isAppError(error) ? error.message : 'We could not cancel that order.');
      return null;
    }
  }

  private reset(): void {
    this._medicines.set([]);
    this._cart.set(null);
    this._order.set(null);
    this._medicinesError.set(null);
    this._cartActionError.set(null);
    this._orderError.set(null);
  }
}
