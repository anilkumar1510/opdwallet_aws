​import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, signal, inject, effect, OnInit } from '@angular/core';
import { OpdConsultationService, Speciality, Doctor, Patient, Slot, BookingResponse, CartSnapshot, CheckoutSnapshot } from '../../services/opd-consultation.service';
import moment from 'moment';
import { BenefitCategory, toBenefitCategory } from '../../core/domain/codes';
import { FamilyStore } from '../../core/family/family.store';
import { findRelationshipInVersion, getPrimaryRelationship, isRelationshipCoveredInPolicy } from '../../core/member/policy.mapper';
import { PolicyStore } from '../../core/member/policy.store';
import { ClaimModeStore } from '../../core/member/claim-mode.store';
import { AppService } from '../../core/http/api.service';
import { ClaimOption } from '../../shared/ui/claim-option';
import { CoverageBannerComponent } from '../../shared/ui/coverage-banner';
import { AgoraService } from '../../services/agora.service';
import { AgoraVideoComponent } from './components/agora-video.component';
import { ConsultHeaderComponent } from './components/consult-header.component';
import { SpecialitySelectionComponent } from './components/speciality-selection.component';
import { DoctorSelectionComponent } from './components/doctor-selection.component';
import { PatientSelectionComponent } from './components/patient-selection.component';
import { WizardStepComponent } from './components/wizard-step.component';
import { AppointmentDateSliderComponent } from './components/appointment-date-slider/appointment-date-slider.component';
import { CommonModule } from '@angular/common';

type Step = 'find' | 'schedule' | 'details' | 'payment' | 'confirmed' | 'consultation' | 'prescription';

@Component({
  selector: 'opd-online-consult-page',
  standalone: true,
  imports: [
    CommonModule,
    ConsultHeaderComponent,
    CoverageBannerComponent,
    SpecialitySelectionComponent,
    DoctorSelectionComponent,
    PatientSelectionComponent,
    WizardStepComponent,
    AppointmentDateSliderComponent,
    AgoraVideoComponent,
    ClaimOption
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#f7f7fc]">
      <opd-consult-header (back)="headerBack()" />

      <div class="mx-auto max-w-[820px] px-5 py-6 lg:px-8">
        @if (!started()) {
          <opd-coverage-banner [category]="BenefitCategory.OnlineConsultation" />
          @if (claimModes.allowsCashless(BenefitCategory.OnlineConsultation) && policyStore.isCovered()) {
            <button type="button" class="min-h-touch w-full rounded-xl bg-[#0F5FDC] px-6 text-sm font-semibold text-white hover:bg-[#034DA2]" (click)="start()">
              Find a doctor →
            </button>
          }
          <opd-claim-option [category]="BenefitCategory.OnlineConsultation" [label]="'online consultation'" />
        } @else {
          <opd-wizard-step
            [title]="'Book consultation'"
            [stepIndex]="step()"
            [totalSteps]="steps().length"
            [showBackNext]="!isPaymentGatewayOpen()"
            (back)="back()"
            (next)="next()"
            [primaryLabel]="primaryLabel()"
          >
            <ng-container [ngSwitch]="currentStep()">
              <ng-container *ngSwitchCase="'find'">
                <div class="space-y-4">
                  @if (isLoading('specialities')) {
                    <div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div></div>
                  } @else if (getError('specialities'); as err) {
                    <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                      <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="loadSpecialities()">Retry</button>
                    </p>
                  }
                  <opd-speciality-selection [specialities]="specialities()" [selectedSpeciality]="speciality()" (specialitySelected)="pickSpeciality($event)" />
                  @if (speciality()) {
                    <div class="mt-5 border-t border-surface-border pt-4">
                      @if (isLoading('doctors')) {
                        <div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div></div>
                      } @else if (getError('doctors'); as err) {
                        <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                          <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="pickSpeciality(speciality())">Retry</button>
                        </p>
                      }
                      <opd-doctor-selection [speciality]="selectedSpecialityName()" [doctors]="filteredDoctors()" [selectedDoctor]="doctor()" [ceiling]="doctorFeeCeiling()" (searchChanged)="onSearchChange($event)" (doctorSelected)="selectDoctor($event)" />
                    </div>
                  }
                </div>
              </ng-container>

<ng-container *ngSwitchCase="'schedule'">
                <div class="space-y-4">
                  <p class="mb-1 text-sm font-medium text-ink-700">How would you like to consult?</p>
                  <p class="mb-3 text-xs text-ink-500">with {{ doctor()?.name }}{{ doctor()?.nextIn ? ' — ' + doctor()?.nextIn : '' }}</p>
                  <div class="space-y-3">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 text-left transition-all"
                      [class.border-brand-500]="consultNow() === true && doctorAvailableNow()"
                      [class.bg-blue-50]="consultNow() === true && doctorAvailableNow()"
                      [class.border-surface-border]="consultNow() !== true && doctorAvailableNow()"
                      [class.border-gray-200]="!doctorAvailableNow()"
                      [class.bg-gray-100]="!doctorAvailableNow()"
                      [class.cursor-not-allowed]="!doctorAvailableNow()"
                      [class.opacity-50]="!doctorAvailableNow()"
                      [class.grayscale]="!doctorAvailableNow()"
                      [disabled]="!doctorAvailableNow()"
                      (click)="doctorAvailableNow() && consultNow.set(true)"
                    >
                      <span>
                        <span class="block font-semibold" [class.text-[#034DA2]]="doctorAvailableNow()" [class.text-gray-500]="!doctorAvailableNow()">
                          Consult Now
                        </span>
                        <span class="mt-0.5 block text-xs" [class.text-success-700]="doctorAvailableNow()" [class.text-gray-400]="!doctorAvailableNow()">
                          {{ doctorAvailableNow() ? 'Connect instantly' : 'Not available immediately — schedule instead' }}
                        </span>
                      </span>
                      @if (consultNow() === true && doctorAvailableNow()) { <span class="text-brand-700">✓</span> }
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 text-left"
                      [class.border-brand-500]="consultNow() === false"
                      [class.bg-blue-50]="consultNow() === false"
                      [class.border-surface-border]="consultNow() !== false"
                      (click)="consultNow.set(false)"
                    >
                      <span>
                        <span class="block font-semibold text-[#034DA2]">Schedule for Later</span>
                        <span class="mt-0.5 block text-xs text-ink-500">Pick a date and time slot</span>
                      </span>
                      @if (consultNow() === false) { <span class="text-brand-700">✓</span> }
                    </button>
                  </div>
                  @if (consultNow() === false) {
                    <div class="mt-5 border-t border-surface-border pt-4">
                      <app-appointment-date-slider
                        [availableDays]="7"
                        [showPickerButton]="true"
                        [practitionerId]="doctor()?.id || ''"
                        [uhId]="patient()?.uhId || ''"
                        [facilityId]="doctor()?.facility_id || ''"
                        [departmentId]="doctor()?.department_id || ''"
                        (dateSelected)="selectSlotDate($event)"
                      />
                      <div class="mt-4">
                        <div class="mb-2 flex items-center justify-between">
                          <p class="text-sm font-medium text-ink-700">Available time slots</p>
                          @if (!isSlotsLoading() && slots().length > 0) {
                            <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#034DA2]">
                              {{ availableSlotCount() }} Available Slot{{ availableSlotCount() === 1 ? '' : 's' }}
                            </span>
                          }
                        </div>

                        @if (isSlotsLoading()) {
                          <div class="flex justify-center py-6">
                            <div class="h-6 w-6 animate-spin rounded-full border-2 border-[#0F5FDC] border-t-transparent"></div>
                          </div>
                        } @else if (slots().length === 0) {
                          <p class="text-center text-sm text-ink-500 py-4">No slots available for this date</p>
                        } @else {
                          @if (availableSlotCount() === 0) {
                            <p class="mb-3 rounded-xl bg-gray-50 py-3 text-center text-sm text-ink-500">No slots available for this date</p>
                          }
                          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            @for (t of slots(); track t.id || $index) {
                              <button
                                type="button"
                                class="min-h-touch rounded-xl border px-3 text-sm transition-all flex items-center justify-center text-center"
                                [class.border-[#0F5FDC]]="slot()?.id === t.id && isSlotValid(t)"
                                [class.bg-blue-50]="slot()?.id === t.id && isSlotValid(t)"
                                [class.text-[#034DA2]]="slot()?.id === t.id && isSlotValid(t)"
                                [class.font-semibold]="slot()?.id === t.id && isSlotValid(t)"
                                [class.border-surface-border]="slot()?.id !== t.id && isSlotValid(t)"
                                [class.hover:border-blue-300]="isSlotValid(t) && slot()?.id !== t.id"
                                [class.cursor-pointer]="isSlotValid(t)"
                                [class.opacity-40]="!isSlotValid(t)"
                                [class.cursor-not-allowed]="!isSlotValid(t)"
                                [class.bg-gray-100]="!isSlotValid(t)"
                                [class.text-ink-400]="!isSlotValid(t)"
                                [class.border-gray-200]="!isSlotValid(t)"
                                [disabled]="!isSlotValid(t)"
                                (click)="selectSlot(t)"
                              >
                                {{ formatSlotRange(t) }}
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </ng-container>

              <ng-container *ngSwitchCase="'details'">
                <div class="space-y-4">
                  @if (isLoading('family')) {
                    <div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div></div>
                  } @else if (getError('family'); as err) {
                    <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                      <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="loadInitialData()">Retry</button>
                    </p>
                  }
                  <opd-patient-selection [patients]="patients()" [selectedPatient]="patient()" [mode]="mode()" (patientSelected)="selectPatient($event)" (modeChanged)="mode.set($event)" />
                </div>
              </ng-container>

              <ng-container *ngSwitchCase="'payment'">
                @if (!isPaymentGatewayOpen()) {
                  <div class="space-y-4">
                    @if (isLoading('cart') || isLoading('checkout') || isLoading('booking')) {
                      <div class="flex justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></div>
                    } @else if (getError('cart') || getError('checkout') || getError('booking'); as err) {
                      <p class="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
                        <span>⚠</span> {{ err }} <button class="ml-2 underline text-sm" (click)="next()">Retry</button>
                      </p>
                    }
                    <div class="space-y-4">
                      <p class="mb-3 text-sm font-medium text-ink-700">Payment breakdown</p>
                      <dl class="space-y-2 text-sm">
                        <div class="flex justify-between"><dt class="text-ink-700">Consultation fee</dt><dd class="font-medium text-ink-900">₹{{ pay().fee }}</dd></div>
                        <div class="flex justify-between">
                          <dt class="text-ink-700">
                            Wallet eligible
                            @if (pay().ceiling !== null && (pay().ceiling ?? 0) < pay().perTxnLimit) {
                              <span class="text-xs text-ink-500">(ceiling ₹{{ pay().ceiling }})</span>
                            } @else {
                              <span class="text-xs text-ink-500">(limit ₹{{ pay().perTxnLimit }})</span>
                            }
                          </dt>
                          <dd class="font-medium text-ink-900">₹{{ pay().covered }}</dd>
                        </div>
                        @if (pay().copay > 0) {
                          <div class="flex justify-between">
                            <dt class="text-ink-700">Co-payment ({{ copayPct() }}{{ copayMode() === 'flat' ? '' : '%' }})</dt>
                            <dd class="font-medium text-red-700">− ₹{{ pay().copay }}</dd>
                          </div>
                        }
                        <div class="flex justify-between border-t border-surface-border pt-2">
                          <dt class="text-ink-700">Paid from Corporate Wallet</dt>
                          <dd class="font-medium text-green-700">₹{{ pay().walletBlock }}</dd>
                        </div>
                        @if (pay().excess > 0) {
                          <div class="flex justify-between">
                            <dt class="text-ink-700">
                              @if (pay().ceiling !== null && pay().fee > (pay().ceiling ?? 0)) {
                                Above doctor fee ceiling
                              } @else {
                                Above per-transaction limit
                              }
                            </dt>
                            <dd class="font-medium text-ink-900">₹{{ pay().excess }}</dd>
                          </div>
                        }
                        <div class="flex justify-between border-t border-surface-border pt-2">
                          <dt class="font-semibold text-ink-900">Total Payable by Patient</dt>
                          <dd class="text-lg font-bold" [class.text-[#034DA2]]="pay().selfPay > 0" [class.text-green-700]="pay().selfPay === 0">₹{{ pay().selfPay }}</dd>
                        </div>
                      </dl>
                      @if (pay().selfPay > 0) {
                        <p class="mt-3 text-xs text-amber-800 bg-amber-50 rounded-xl p-3 border border-amber-200">
                          ℹ Patient payable amount of <strong>₹{{ pay().selfPay }}</strong>
                          @if (pay().copay > 0 && pay().excess > 0) {
                            (₹{{ pay().copay }} co-payment + ₹{{ pay().excess }} above policy limit)
                          } @else if (pay().copay > 0) {
                            (co-payment)
                          } @else {
                            (above policy limit)
                          }
                          is required. Clicking continue will initiate the payment gateway.
                        </p>
                      } @else {
                        <p class="mt-3 text-xs text-green-800 bg-green-50 rounded-xl p-3 border border-green-200">
                          ✓ 100% covered by your corporate health wallet. No out-of-pocket payment required!
                        </p>
                      }
                    </div>
                  </div>
                } @else {
                  <!-- Initiate Payment Dummy UI (Gateway Simulation) -->
                  <div class="space-y-4 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/40 to-white p-5 shadow-sm">
                    <!-- Gateway Header -->
                    <div class="flex items-center justify-between border-b border-surface-border pb-3">
                      <div class="flex items-center gap-2">
                        <span class="text-xl">💳</span>
                        <div>
                          <p class="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Payment Gateway Simulation</p>
                          <p class="text-sm font-bold text-ink-900">HCL Healthcare Checkout</p>
                        </div>
                      </div>
                      <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Test Mode</span>
                    </div>

                    <!-- Amount Box -->
                    <div class="rounded-xl bg-white p-4 border border-surface-border shadow-xs">
                      <div class="flex items-baseline justify-between">
                        <span class="text-xs font-medium text-ink-500">Amount Due</span>
                        <span class="text-2xl font-extrabold text-[#034DA2]">₹{{ copayToPay() }}</span>
                      </div>
                      <div class="mt-2 text-xs text-ink-500 flex justify-between pt-2 border-t border-gray-100">
                        <span>Ref: {{ dummyTxnId() }}</span>
                        <span>Patient: {{ patient()?.name }}</span>
                      </div>
                    </div>

                    @if (paymentGatewayState() === 'processing') {
                      <!-- Processing State -->
                      <div class="py-8 text-center space-y-3">
                        <div class="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
                        <p class="text-sm font-semibold text-ink-900">Processing payment with bank...</p>
                        <p class="text-xs text-ink-500">Please do not refresh or navigate away.</p>
                      </div>
                    } @else if (paymentGatewayState() === 'failed') {
                      <!-- Failure State -->
                      <div class="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
                        <div class="flex items-start gap-3">
                          <span class="text-2xl">❌</span>
                          <div>
                            <p class="text-sm font-bold text-red-800">Payment Failed</p>
                            <p class="mt-1 text-xs text-red-700">{{ paymentFailureReason() }}</p>
                            <p class="mt-1 text-[11px] text-red-500">Transaction ID: {{ dummyTxnId() }}</p>
                          </div>
                        </div>

                        <div class="flex gap-2 pt-2 border-t border-red-200">
                          <button type="button" class="min-h-touch flex-1 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700" (click)="retryPayment()">
                            Retry Payment
                          </button>
                          <button type="button" class="min-h-touch rounded-xl border border-red-300 bg-white px-4 text-xs font-semibold text-red-700 hover:bg-red-50" (click)="cancelPaymentGateway()">
                            Cancel & Return
                          </button>
                        </div>
                      </div>
                    } @else {
                      <!-- Mock Payment Methods -->
                      <div class="space-y-2">
                        <p class="text-xs font-medium text-ink-700">Select payment method</p>
                        <div class="grid grid-cols-3 gap-2">
                          <button type="button" class="rounded-xl border p-2.5 text-xs font-medium text-center transition-all"
                            [class.border-blue-600]="selectedPaymentMethod() === 'upi'"
                            [class.bg-blue-50]="selectedPaymentMethod() === 'upi'"
                            [class.text-blue-700]="selectedPaymentMethod() === 'upi'"
                            [class.border-gray-200]="selectedPaymentMethod() !== 'upi'"
                            (click)="selectedPaymentMethod.set('upi')">
                            📱 UPI / QR
                          </button>
                          <button type="button" class="rounded-xl border p-2.5 text-xs font-medium text-center transition-all"
                            [class.border-blue-600]="selectedPaymentMethod() === 'card'"
                            [class.bg-blue-50]="selectedPaymentMethod() === 'card'"
                            [class.text-blue-700]="selectedPaymentMethod() === 'card'"
                            [class.border-gray-200]="selectedPaymentMethod() !== 'card'"
                            (click)="selectedPaymentMethod.set('card')">
                            💳 Card
                          </button>
                          <button type="button" class="rounded-xl border p-2.5 text-xs font-medium text-center transition-all"
                            [class.border-blue-600]="selectedPaymentMethod() === 'netbanking'"
                            [class.bg-blue-50]="selectedPaymentMethod() === 'netbanking'"
                            [class.text-blue-700]="selectedPaymentMethod() === 'netbanking'"
                            [class.border-gray-200]="selectedPaymentMethod() !== 'netbanking'"
                            (click)="selectedPaymentMethod.set('netbanking')">
                            🏦 NetBanking
                          </button>
                        </div>
                      </div>

                      <!-- Gateway Simulation Controls -->
                      <div class="pt-2 space-y-2">
                        <button
                          type="button"
                          class="min-h-touch w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 flex items-center justify-center gap-2"
                          (click)="simulatePaymentSuccess()"
                        >
                          <span>✓</span> Simulate Payment Success (Pay ₹{{ copayToPay() }})
                        </button>

                        <button
                          type="button"
                          class="min-h-touch w-full rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                          (click)="simulatePaymentFailure()"
                        >
                          <span>✕</span> Simulate Payment Failure
                        </button>

                        <button
                          type="button"
                          class="w-full text-center text-xs text-ink-500 underline pt-1 hover:text-ink-800"
                          (click)="cancelPaymentGateway()"
                        >
                          ← Cancel and back to payment breakdown
                        </button>
                      </div>
                    }
                  </div>
                }
              </ng-container>

              <ng-container *ngSwitchCase="'confirmed'">
                <div class="text-center">
                  <p class="text-3xl">✅</p>
                  <p class="mt-2 text-base font-bold text-blue-700">Booking confirmed</p>
                  <p class="mt-1 text-sm text-ink-700">Auto-confirmed on payment — no waiting for provider confirmation.</p>
                </div>
                <dl class="mt-4 space-y-2 text-sm">
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Doctor</dt><dd class="text-right font-medium text-ink-900">{{ doctor()?.name }}</dd></div>
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Patient</dt><dd class="text-right font-medium text-ink-900">{{ patient()?.name }}</dd></div>
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Mode</dt><dd class="text-right font-medium text-ink-900">{{ mode() }}</dd></div>
                  <div class="flex justify-between gap-3 border-b border-surface-border pb-2"><dt class="text-ink-500">Paid</dt><dd class="text-right font-medium text-ink-900">₹{{ copayToPay() > 0 ? copayToPay() : pay().selfPay }} (₹{{ pay().walletBlock }} from wallet)</dd></div>
                </dl>
                <p class="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm text-green-700">🧾 Invoice generated and stored under Health Records › Invoices.</p>
              </ng-container>

              <ng-container *ngSwitchCase="'consultation'">
                @if (!inCall()) {
                  <div class="text-center py-8">
                    <p class="text-3xl">{{ mode() === 'Audio' ? '📞' : '🎥' }}</p>
                    <p class="mt-2 text-base font-bold text-blue-700">{{ mode() }} consultation</p>
                    <p class="mt-1 text-sm text-ink-700">with {{ doctor()?.name }}</p>
                    <button type="button" class="mt-4 min-h-touch w-full rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white" (click)="joinVideoCall()">Join {{ mode() }} call</button>
                  </div>
                } @else {
                  <opd-agora-video
                    [serviceRequestId]="consultationRequestId()"
                    [mode]="mode() === 'Audio' ? 'Audio' : 'Video'"
                    [doctorName]="doctor()?.name || 'Doctor'"
                    (callEnded)="endCall()"
                  />
                }
              </ng-container>

              <ng-container *ngSwitchCase="'prescription'">
                <p class="mb-2 text-base font-bold text-blue-700">Prescription</p>
                <p class="text-sm text-ink-700">{{ doctor()?.name }} · {{ patient()?.name }}</p>
                <div class="mt-3 space-y-2 text-sm">
                  @if (prescription(); as rx) {
                    @for (med of rx.medications; track med.name) {
                      <div class="rounded-xl bg-gray-100 px-3 py-2">
                        <span class="font-medium text-ink-900">{{ med.name }}</span> — {{ med.dosage }}, {{ med.duration }}
                      </div>
                    }
                    <p class="rounded-xl bg-green-100 px-3 py-2 text-sm text-green-700">✓ E-prescription saved to Health Records › My Prescriptions.</p>
                  } @else {
                    <p class="text-sm text-ink-500">Loading prescription...</p>
                  }
                </div>
              </ng-container>

              <ng-container *ngSwitchDefault>
                <p class="text-center py-8 text-ink-500">Step not found</p>
              </ng-container>
            </ng-container>

            @if (stepError(); as err) {
              <p class="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700" role="alert">{{ err }}</p>
            }
          </opd-wizard-step>
        }
      </div>
    </div>
  `,
})
export class OnlineConsultPage implements OnInit {
  readonly BenefitCategory = BenefitCategory;

  private readonly consultationService = inject(OpdConsultationService);
  private readonly agoraService = inject(AgoraService);
  protected readonly policyStore = inject(PolicyStore);
  private readonly family = inject(FamilyStore);
  protected readonly claimModes = inject(ClaimModeStore);
  private readonly appService = inject(AppService);
  readonly cdr = inject(ChangeDetectorRef);

  protected getResolvedUhId(): string {
    const pat = this.patient();
    if (pat?.uhId && pat.uhId.trim()) {
      return pat.uhId.trim();
    }
    if ((pat as any)?.uhid && (pat as any).uhid.trim()) {
      return (pat as any).uhid.trim();
    }

    const active = this.family.activeMember();
    if (active?.uhid && active.uhid.trim()) {
      return active.uhid.trim();
    }

    const familyMember = this.family.family().find(
      (m) => (m.id === pat?.id || m.memberId === pat?.patient_id || m.memberId === pat?.mapped_id) && m.uhid?.trim()
    );
    if (familyMember?.uhid && familyMember.uhid.trim()) {
      return familyMember.uhid.trim();
    }

    const walletUserCode = this.policyStore.walletAccount()?.user_code;
    if (walletUserCode && walletUserCode.trim()) {
      return walletUserCode.trim();
    }

    const sessionUserInfo = this.appService.getCurrentSessionData('userInfo');
    const sessionUhId = sessionUserInfo?.[0]?.user_roles?.[0]?.uhid || sessionUserInfo?.[0]?.uhid;
    if (sessionUhId && sessionUhId.trim()) {
      return sessionUhId.trim();
    }

    const anyFamilyUhId = this.family.family().find((m) => m.uhid && m.uhid.trim())?.uhid;
    if (anyFamilyUhId && anyFamilyUhId.trim()) {
      return anyFamilyUhId.trim();
    }

    // Safety fallback for test/dev accounts where UHID is omitted in mock/test data
    return 'HH-448732';
  }

  constructor() {
    effect(() => {
      const pats = this.patients();
      const current = this.patient();
      if (pats.length > 0) {
        if (!current || !pats.some((p) => p.id === current.id)) {
          const active = this.family.activeMember();
          const match = pats.find((p) => p.id === active?.id || p.mapped_id === active?.memberId) || pats[0];
          this.selectPatient(match);
        }
      }
    });
  }

  protected selectPatient(pat: Patient): void {
    this.patient.set(pat);
    if (!this.policyStore.isFloater()) {
      const activeUhId = pat?.uhId?.trim() || null;
      const primaryUhId = this.family.family().find((m) => m.isPrimary)?.uhid?.trim() || null;
      this.policyStore.syncMemberWalletContext(activeUhId, primaryUhId);
    }
  }

  protected readonly policyCategory = computed(() => {
    const version = this.policyStore.version();
    const pat = this.patient();
    const activeMember = this.family.activeMember();
    const relCode = pat?.rel || activeMember?.relationshipCode || (activeMember?.isPrimary ? 'self' : 'self');
    const rel = version
      ? (findRelationshipInVersion(version, relCode) ?? getPrimaryRelationship(version))
      : null;
    return rel?.categories?.find(
      (c) =>
        toBenefitCategory(c.category_code) === BenefitCategory.OnlineConsultation ||
        toBenefitCategory(c.category_name) === BenefitCategory.OnlineConsultation,
    );
  });

  protected readonly perTxn = computed(() => {
    const cat = this.policyCategory();
    return cat?.per_transaction_limit ?? cat?.per_claim_limit ?? 300;
  });

  protected readonly doctorFeeCeiling = computed<number | null>(() => {
    const cat = this.policyCategory();
    if (cat?.doctor_fee_ceiling && typeof cat.doctor_fee_ceiling_amount === 'number' && cat.doctor_fee_ceiling_amount > 0) {
      return cat.doctor_fee_ceiling_amount;
    }
    return null;
  });

  protected readonly copayPct = computed(() => {
    const cat = this.policyCategory();
    return typeof cat?.co_payment_value === 'number' ? cat.co_payment_value : 20;
  });

  protected readonly copayMode = computed(() => {
    const cat = this.policyCategory();
    return cat?.co_payment_mode?.toLowerCase() === 'flat' ? 'flat' : 'percent';
  });

  protected readonly specialities = signal<Speciality[]>([]);
  private readonly _allPatients = signal<Patient[]>([]);
  protected readonly patients = computed<Patient[]>(() => {
    const version = this.policyStore.version();
    const all = this._allPatients();
    if (!version) return all;
    return all.filter((p) => {
      const isSelf = !p.rel || p.rel.trim().toLowerCase() === 'self';
      if (isSelf) return true;
      return isRelationshipCoveredInPolicy(p.rel, version);
    });
  });
  protected readonly slots = signal<Slot[]>([]);
  protected readonly slotDates = signal<number[]>([]);

  protected formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  protected readonly started = signal(false);
  protected readonly consultNow = signal<boolean | null>(null);
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);

  protected readonly speciality = signal<string>('');
  protected readonly search = signal('');
  protected readonly searchTerm = signal('');
  protected readonly doctor = signal<Doctor | null>(null);
  protected readonly filteredDoctors = signal<Doctor[]>([]);
  protected readonly patient = signal<Patient | null>(null);
  protected readonly mode = signal('');
  protected readonly slotDate = signal<number>(0);
  protected readonly slot = signal<Slot | null>(null);
  protected readonly isSlotsLoading = signal(false);
  protected readonly inCall = signal(false);
  protected readonly consultationRequestId = signal<string | null>(null);
  protected readonly cancelNote = signal<string | null>(null);
  protected readonly prescription = signal<any | null>(null);

  // Initiate payment dummy gateway state
  protected readonly isPaymentGatewayOpen = signal(false);
  protected readonly paymentGatewayState = signal<'closed' | 'initiating' | 'processing' | 'failed'>('closed');
  protected readonly copayToPay = signal<number>(0);
  protected readonly dummyTxnId = signal<string>('');
  protected readonly paymentFailureReason = signal<string>('Transaction was declined by bank or user cancelled.');
  protected readonly pendingBookingData = signal<any>(null);
  protected readonly selectedPaymentMethod = signal<'upi' | 'card' | 'netbanking'>('upi');

  // Loading and error states from service
  protected readonly loading = this.consultationService.loading$;
  protected readonly errors = this.consultationService.errors$;

  // Helper to check loading state
  isLoading(key: string): boolean {
    return this.consultationService.isLoading(key);
  }

  getError(key: string): string | undefined {
    return this.consultationService.getError(key);
  }

  // Empanelment side journey
  protected readonly empanelment = signal(false);
  protected readonly empanelSubmitted = signal(false);
  protected readonly empName = signal('');
  protected readonly empClinic = signal('');
  protected readonly empSpec = signal('');

  protected readonly steps = computed<Step[]>(() => [
    'find', 'schedule', 'details', 'payment', 'confirmed', 'consultation', 'prescription',
  ]);
  protected readonly currentStep = computed<Step>(() => this.steps()[this.step()] ?? 'find');

  protected readonly doctorAvailableNow = computed(() => {
    const doc = this.doctor();
    if (!doc) return false;
    if (typeof doc.canConsultNow === 'boolean') {
      return doc.canConsultNow;
    }
    return doc.nextIn === 'Available now';
  });

  /** Available slot count calculated dynamically from valid slots */
  protected readonly availableSlotCount = computed(() => {
    return this.slots().filter(s => this.isSlotValid(s)).length;
  });

  /** Dynamic payment breakdown: per-transaction limit + doctor fee ceiling + co-payment, excess self-paid. */
  protected readonly pay = computed(() => {
    const fee = this.doctor()?.fee ?? 0;
    const perTxnLimit = this.perTxn();
    const ceiling = this.doctorFeeCeiling();
    const cat = this.policyCategory();
    const poolCode = cat?.pool_code?.trim();
    const pool = poolCode
      ? this.policyStore.pools().find(
          (p) =>
            p.code?.trim().toUpperCase() === poolCode?.toUpperCase() ||
            p.id?.trim().toUpperCase() === poolCode?.toUpperCase(),
        )
      : null;
    const availableBalance = pool ? pool.available.amount : this.policyStore.walletTotal().available.amount;

    const effectiveCap = ceiling !== null ? Math.min(perTxnLimit, ceiling) : perTxnLimit;
    const covered = Math.min(fee, effectiveCap, availableBalance);
    const copay = this.copayMode() === 'flat'
      ? Math.min(this.copayPct(), covered)
      : Math.round((covered * this.copayPct()) / 100);
    const walletBlock = Math.max(0, covered - copay);
    const excess = Math.max(0, fee - covered);
    const selfPay = fee - walletBlock;
    return { fee, covered, copay, walletBlock, excess, selfPay, ceiling, perTxnLimit };
  });

  protected readonly selectedSpecialityName = computed(() => {
    const code = this.speciality();
    if (!code) return '';
    const found = this.specialities().find(
      (s) =>
        (s.speciality_code && s.speciality_code.toLowerCase() === code.toLowerCase()) ||
        (s.code && s.code.toLowerCase() === code.toLowerCase()),
    );
    return found?.display || found?.speciality_name || code;
  });

  ngOnInit() {
    this.loadInitialData();
  }

  protected loadSpecialities(): void {
    this.consultationService.getSpecialities().subscribe((specs) => this.specialities.set(specs));
  }

  protected loadInitialData(): void {
    this.loadSpecialities();
    this.consultationService.getFamilyList().subscribe((pats) => {
      this._allPatients.set(pats || []);
    });
  }

  protected start(): void {
    if (!this.policyStore.isCovered() || !this.claimModes.allowsCashless(BenefitCategory.OnlineConsultation)) {
      return;
    }
    this.consultNow.set(null);
    this.started.set(true);
    this.step.set(0);
    this.stepError.set(null);
  }

  protected pickSpeciality(code: string): void {
    this.speciality.set(code);
    this.doctor.set(null);
    this.slot.set(null);
    this.slots.set([]);
    this.slotDate.set(0);
    this.search.set('');
    this.searchTerm.set('');
    const spec = this.specialities().find(s => 
      (s.speciality_code && s.speciality_code.toLowerCase() === code.toLowerCase()) ||
      (s.code && s.code.toLowerCase() === code.toLowerCase()) ||
      (s.speciality_name && s.speciality_name.toLowerCase() === code.toLowerCase()) ||
      (s.display && s.display.toLowerCase() === code.toLowerCase())
    );
    const dynamicCode = spec?.speciality_code || spec?.code || spec?.speciality_system_name || spec?.speciality_name || code;
    this.consultationService.getDoctors(dynamicCode).subscribe(docs => this.filteredDoctors.set(docs));
  }

  protected selectDoctor(doc: Doctor): void {
    this.doctor.set(doc);
    this.consultNow.set(null);
    this.slot.set(null);
    this.slots.set([]);
    this.slotDate.set(0);
  }

  protected onSearchChange(value: string): void {
    if (!value.trim()) {
      const spec = this.specialities().find(s => 
        (s.speciality_code && s.speciality_code.toLowerCase() === this.speciality().toLowerCase()) ||
        (s.code && s.code.toLowerCase() === this.speciality().toLowerCase()) ||
        (s.speciality_name && s.speciality_name.toLowerCase() === this.speciality().toLowerCase()) ||
        (s.display && s.display.toLowerCase() === this.speciality().toLowerCase())
      );
      const dynamicCode = spec?.speciality_code || spec?.code || spec?.speciality_system_name || spec?.speciality_name || this.speciality();
      this.consultationService.getDoctors(dynamicCode).subscribe(docs => {
        this.filteredDoctors.set(docs);
        this.search.set('');
      });
      return;
    }
    this.search.set(value);
    this.filteredDoctors.set(
      this.filteredDoctors().filter(d => 
        d.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  }

  private getSlotDay(timestamp: number): string {
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    return days[new Date(timestamp).getDay()];
  }

  /**
   * Slot validation logic:
   * A slot is valid only if:
   * 1. Status is "available"
   * 2. Start time is in the future
   * 3. End time is in the future
   */
  protected isSlotValid(s: Slot): boolean {
    if (!s) return false;

    // Slot status must be "available"
    const status = (s.status || '').toLowerCase().trim();
    if (status !== 'available') {
      return false;
    }

    const now = Date.now();

    // Check direct timestamp
    if (typeof s.slot_start_time === 'number' && s.slot_start_time > 0) {
      if (s.slot_start_time <= now) return false;
      if (typeof s.slot_end_time === 'number' && s.slot_end_time <= now) return false;
      return true;
    }

    // Fallback: check slot_date and slotStartTime if start timestamp wasn't provided directly
    if (s.slot_date) {
      const slotDayStart = moment(s.slot_date).startOf('day');
      const todayStart = moment().startOf('day');
      if (slotDayStart.isBefore(todayStart)) {
        return false;
      }
      if (slotDayStart.isSame(todayStart) && s.slotStartTime) {
        const timeParts = s.slotStartTime.match(/(\d+):(\d+)/);
        if (timeParts) {
          const slotMoment = slotDayStart.clone()
            .hour(parseInt(timeParts[1], 10))
            .minute(parseInt(timeParts[2], 10));
          if (slotMoment.valueOf() <= now) {
            return false;
          }
        }
      }
    }

    return true;
  }

  protected formatSlotRange(slot: Slot): string {
    if (slot.slot_start_time && slot.slot_end_time) {
      const start = new Date(slot.slot_start_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const end = new Date(slot.slot_end_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `${start} - ${end}`;
    }
    if (slot.slotStartTime && slot.slotEndTime) {
      return `${slot.slotStartTime} - ${slot.slotEndTime}`;
    }
    if (slot.slotNo) {
      return `Slot ${slot.slotNo}`;
    }
    return 'Slot';
  }

  protected selectSlot(t: Slot): void {
    if (!this.isSlotValid(t)) return;
    this.slot.set(t);
  }

  protected selectSlotDate(date: number): void {
    this.slotDate.set(date);
    this.slot.set(null);
    if (this.doctor()) {
      this.isSlotsLoading.set(true);
      const slotDays = this.getSlotDay(date);
      const uhId = this.getResolvedUhId();

      this.consultationService
        .getSlots(
          this.doctor()!.id!,
          date,
          slotDays,
          this.doctor()?.facility_id || '',
          this.doctor()?.department_id || '',
          uhId
        )
        .subscribe({
          next: (slots) => {
            console.log('Slots Response:', slots);
            const slotList = slots || [];
            this.slots.set([...slotList]);

            // Auto-select first valid available slot
            const firstValid = slotList.find(s => this.isSlotValid(s));
            this.slot.set(firstValid ?? null);

            this.isSlotsLoading.set(false);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Slot Error', err);
            this.slots.set([]);
            this.slot.set(null);
            this.isSlotsLoading.set(false);
            this.cdr.detectChanges();
          }
        });
    }
  }

  protected openEmpanelment(): void {
    this.empanelSubmitted.set(false);
    this.empName.set('');
    this.empClinic.set('');
    this.empSpec.set(this.speciality());
    this.empanelment.set(true);
  }

  protected submitEmpanelment(): void {
    if (!this.empName().trim()) return;
    this.empanelSubmitted.set(true);
  }

  protected tryCancel(): void {
    this.cancelNote.set('Cancellation is not allowed for online consultations today. Rescheduling and follow-up are planned.');
  }

  private validate(): string | null {
    switch (this.currentStep()) {
      case 'find':
        if (!this.speciality()) return 'Select a speciality.';
        return this.doctor() ? null : 'Select a doctor.';
      case 'schedule':
        if (this.consultNow() === null) return 'Choose Consult Now or Schedule.';
        if (this.consultNow() === true && !this.doctorAvailableNow()) {
          return 'Doctor is not available for immediate consultation. Please schedule for later.';
        }
        if (this.consultNow() === false) {
          if (!this.slotDate() || !this.slot()?.id) return 'Pick a date and time.';
          if (!this.isSlotValid(this.slot()!)) return 'The selected slot is no longer available. Please select another slot.';
        }
        return null;
      case 'details':
        if (!this.patient()) return 'Select who this is for.';
        return this.mode() ? null : 'Choose Video or Audio.';
      default: return null;
    }
  }

  protected next(): void {
    if (this.currentStep() === 'find' && this.empanelment()) { this.empanelment.set(false); return; }
    const err = this.validate();
    if (err) { this.stepError.set(err); return; }
    this.stepError.set(null);

    if (this.currentStep() === 'payment') {
      // Build cart snapshot and add to cart
      const cartData = this.buildCartSnapshot();
      this.consultationService.addToCart(cartData).subscribe({
        next: (cartRes: any) => {
          const cartId = cartRes?.resource?.[0]?.id || cartRes?.resource?.[0]?.cart_snapshot?.id || cartRes?.id || '';
          // Build checkout snapshot and calculate payment
          const checkoutData = this.buildCheckoutSnapshot(cartId);
          this.consultationService.checkout(checkoutData).subscribe({
            next: (checkoutRes: any) => {
              const checkoutItem = checkoutRes?.resource?.[0]?.checkout_snapshot?.opdCheckout 
                || checkoutRes?.checkout_snapshot?.opdCheckout
                || checkoutRes?.resource?.[0]
                || checkoutRes;
              const checkoutPatientAmount = checkoutItem?.patient_amount ?? checkoutItem?.final_payable;
              const copayAmount = Number(
                checkoutPatientAmount !== undefined && checkoutPatientAmount !== null
                  ? checkoutPatientAmount
                  : (this.pay().selfPay ?? 0)
              );

              const bookingData = this.buildBookingSnapshot(checkoutRes, cartId);

              if (copayAmount > 0) {
                // Out-of-pocket amount > 0: Initiate payment flow
                this.pendingBookingData.set(bookingData);
                this.copayToPay.set(copayAmount);
                this.dummyTxnId.set('TXN_OPD_' + Date.now().toString().slice(-6));
                this.paymentGatewayState.set('initiating');
                this.isPaymentGatewayOpen.set(true);
              } else {
                // Out-of-pocket is 0: Directly proceed to booking
                this.consultationService.bookAppointment(bookingData).subscribe({
                  next: (res: any) => {
                    const sReqId = res?.serviceRequestId || res?.service_request_id || res?.[0]?.serviceRequestId || res?.[0]?.service_request_id || res?.resource?.[0]?.serviceRequestId || res?.resource?.[0]?.service_request_id || res?.[0]?.id || res?.id || '';
                    this.consultationRequestId.set(sReqId);
                    this.onBookingSuccess();
                    this.step.set(this.step() + 1);
                  },
                  error: (err) => this.stepError.set('Booking failed: ' + err.message)
                });
              }
            },
            error: (err) => this.stepError.set('Checkout failed: ' + err.message)
          });
        },
        error: (err) => this.stepError.set('Cart creation failed: ' + err.message)
      });
    } else if (this.currentStep() === 'consultation') {
      // Move to prescription after consultation
      this.loadPrescription();
      this.step.set(this.step() + 1);
    } else if (this.currentStep() === 'prescription') {
      this.finish();
    } else {
      this.step.set(this.step() + 1);
    }
  }

  protected back(): void {
    this.stepError.set(null);
    if (this.isPaymentGatewayOpen()) {
      this.cancelPaymentGateway();
      return;
    }
    if (this.step() === 0) { this.started.set(false); return; }
    this.step.set(this.step() - 1);
  }

  protected cancelPaymentGateway(): void {
    this.isPaymentGatewayOpen.set(false);
    this.paymentGatewayState.set('closed');
    this.dummyTxnId.set('');
    this.pendingBookingData.set(null);
  }

  protected retryPayment(): void {
    this.dummyTxnId.set('TXN_OPD_' + Date.now().toString().slice(-6));
    this.paymentGatewayState.set('initiating');
  }

  protected simulatePaymentSuccess(): void {
    this.paymentGatewayState.set('processing');
    this.stepError.set(null);

    setTimeout(() => {
      const bookingData = this.pendingBookingData();
      this.consultationService.bookAppointment(bookingData).subscribe({
        next: (res: any) => {
          const sReqId = res?.serviceRequestId || res?.service_request_id || res?.[0]?.serviceRequestId || res?.[0]?.service_request_id || res?.resource?.[0]?.serviceRequestId || res?.resource?.[0]?.service_request_id || res?.[0]?.id || res?.id || '';
          this.consultationRequestId.set(sReqId);
          this.onBookingSuccess();
          this.isPaymentGatewayOpen.set(false);
          this.paymentGatewayState.set('closed');
          this.step.set(this.step() + 1);
        },
        error: (err) => {
          this.paymentGatewayState.set('failed');
          this.paymentFailureReason.set('Booking failed after payment: ' + (err.message || 'Unknown error'));
        }
      });
    }, 800);
  }

  protected simulatePaymentFailure(): void {
    this.paymentGatewayState.set('processing');
    setTimeout(() => {
      this.paymentGatewayState.set('failed');
      this.paymentFailureReason.set('Payment was declined by the bank or cancelled by user.');
    }, 600);
  }

  protected headerBack(): void {
    if (this.started()) { this.back(); return; }
    history.back();
  }

  protected primaryLabel(): string {
    switch (this.currentStep()) {
      case 'payment': {
        const selfPay = this.pay().selfPay;
        return selfPay > 0 ? `Proceed to Pay ₹${selfPay}` : 'Confirm & Book Appointment (₹0)';
      }
      case 'prescription': return 'Done';
      case 'confirmed': return 'Join consultation';
      case 'consultation': return 'View prescription';
      default: return 'Continue';
    }
  }

  private onBookingSuccess(): void {
    const pat = this.patient();
    const activeUhId = pat?.uhId?.trim() || this.getResolvedUhId();
    const primaryUhId = this.family.family().find((m) => m.isPrimary)?.uhid?.trim() || null;
    this.policyStore.syncMemberWalletContext(activeUhId, primaryUhId, true);
  }

  protected joinVideoCall(): void {
    this.inCall.set(true);
  }

  protected endCall(): void {
    this.inCall.set(false);
  }

  protected loadPrescription(): void {
    if (this.consultationRequestId()) {
      this.consultationService.getPrescription(this.consultationRequestId()!).subscribe({
        next: (rx) => this.prescription.set(rx),
        error: () => this.prescription.set({ medications: [] })
      });
    }
  }

  private buildCartSnapshot(): CartSnapshot {
    const doc = this.doctor();
    const s = this.slot();
    const pat = this.patient();

    return {
      cart_snapshot: {
        facility_id: doc?.facility_id || '',
        patient_id: pat?.mapped_id || pat?.patient_id || pat?.id || this.family.activeMember()?.id || '',
        serviceType: 'OP Consultation',
        serviceType_code: 'op_consultation',
        serviceItemName: doc?.name || '',
        serviceItemCode: doc?.doctor_code || doc?.id || '',
        service_code: doc?.doctor_code || '',
        serviceItemId: doc?.id || '',
        provider_name: doc?.provider_name || 'HCL Healthcare',
        provider_code: doc?.provider_code || 'HCLHC001',
        cug_code: doc?.cug_code || this.policyStore.version()?.cug_code || this.policyStore.assignment()?.cug_code || '',
        mrp: doc?.mrp ?? doc?.fee ?? 0,
        selling_discount_rate: doc?.selling_discount_rate ?? 0,
        selling_amount: doc?.selling_amount ?? doc?.fee ?? 0,
        status: 'Pending',
        department_name: doc?.department_name || doc?.speciality || '',
        department_id: doc?.department_id || '',
        subDepartment_name: doc?.subDepartment_name || doc?.speciality || '',
        subDepartment_id: doc?.subDepartment_id || '',
        speciality_id: doc?.speciality_id || '',
        serviceDate: s?.slot_date || this.slotDate() || 0,
        serviceStartTime: s?.slot_start_time || 0,
        serviceEndTime: s?.slot_end_time || (s?.slot_start_time ? s.slot_start_time + 900000 : 0),
        slotId: s?.id || '',
        slotNo: s?.slotNo ?? 0,
        slot: s ? this.formatSlotRange(s) : '',
        slot_type: 'dynamic',
        mode_of_appointment: 'opd_network',
        consultation_type_code: (this.mode() || '').toLowerCase() === 'audio' ? 'Audio' : 'Video',
        tag_data: []
      }
    };
  }

  private buildCheckoutSnapshot(cartId?: string): CheckoutSnapshot {
    const doc = this.doctor();
    const s = this.slot();
    const pat = this.patient();
    const policyId = this.policyStore.version()?.policy_id || this.policyStore.assignment()?.policy_id || '';
    const now = Date.now();
    const sDate = s?.slot_date || this.slotDate() || 0;
    const sStart = s?.slot_start_time || 0;
    const sEnd = s?.slot_end_time || (s?.slot_start_time ? s.slot_start_time + 900000 : 0);
    const uhId = this.getResolvedUhId();
    const facilityAddress = doc?.facility_address || null;

    const checkoutBody: any = {
      facility_id: doc?.facility_id || '',
      patient_id: pat?.mapped_id || pat?.patient_id || pat?.id || this.family.activeMember()?.id || '',
      scheme_code: '',
      is_use_wallet: false,
      bg_code: this.policyStore.walletAccount()?.bg_code || '',
      scheme_discount_applicable: false,
      type: '',
      uhId: uhId,
      is_use_care_coin: false,
      orderedFrom: 'Patient Portal',
      old_serviceRequestId: '',
      provider_name: doc?.provider_name || 'HCL Healthcare',
      provider_code: doc?.provider_code || 'HCLHC001',
      op_services: [
        {
          serviceItemId: doc?.id || '',
          serviceItemName: doc?.name || '',
          speciality_id: doc?.speciality_id || '',
          service_code: doc?.doctor_code || '',
          part_of_package: false,
          serviceItemCode: doc?.doctor_code || doc?.id || '',
          consultation_type: 'Tele Consult',
          consultation_type_code: (this.mode() || '').toLowerCase() === 'audio' ? 'Audio' : 'Video',
          over_booking_status: false,
          order_date_time: now,
          speciality_name: doc?.speciality || '',
          service_type: 'OP Consultation',
          serviceName: doc?.name || '',
          appointment_time: sEnd,
          serviceType: 'OP Consultation',
          serviceType_code: 'op_consultation',
          slotId: s?.id || '',
          extra_data: {
            edit_price: false,
            speciality_name: doc?.speciality || '',
            facility_name: doc?.facility_name || '',
            qualification: doc?.qualification || ''
          },
          slotNo: s?.slotNo != null ? String(s.slotNo) : '',
          serviceDate: sDate,
          serviceStartTime: sStart,
          serviceEndTime: sEnd,
          category: (doc?.speciality || '').toUpperCase(),
          speciality_code: (doc?.speciality_code || doc?.speciality || '').toUpperCase(),
          department_id: doc?.department_id || '',
          department_name: doc?.department_name || '',
          subDepartment_id: doc?.subDepartment_id || '',
          subDepartment_name: doc?.subDepartment_name || '',
          qty: 1,
          cart_id: cartId || '',
          is_centre_visit: false,
          is_home_collection: false,
          logo_id: '',
          doctor_profile_path: doc?.profile_path || '',
          patient_instructions: '',
          practice_type_code: 'individual',
          practice_type_name: 'Individual Practice',
          performing_doctor: doc?.name || '',
          participant: doc ? [
            {
              participantId: doc.id || '',
              participantName: doc.name || '',
              participantRole: 'doctor'
            }
          ] : [],
          doctor_experience: doc?.experience != null ? String(doc.experience) : '',
          doctor_telecom: doc?.telecom || ''
        }
      ],
      mode_of_appointment: 'opd_network',
      facility_address: facilityAddress,
      tag_data: []
    };

    return {
      policy_id: policyId,
      ...checkoutBody,
      checkout_snapshot: {
        opdCheckout: checkoutBody
      }
    };
  }

  private buildBookingSnapshot(checkoutRes?: any, cartId?: string): any {
    const doc = this.doctor();
    const s = this.slot();
    const pat = this.patient();
    const now = Date.now();
    const sDate = s?.slot_date || this.slotDate() || 0;
    const sStart = s?.slot_start_time || 0;
    const sEnd = s?.slot_end_time || (s?.slot_start_time ? s.slot_start_time + 900000 : 0);
    const patId = pat?.mapped_id || pat?.patient_id || pat?.id || this.family.activeMember()?.id || '';

    // Extract checkout snapshot and opdCheckout data if available
    const rawCheckoutSnapshot = checkoutRes?.resource?.[0]?.checkout_snapshot 
      || checkoutRes?.checkout_snapshot;
    const checkoutItem = rawCheckoutSnapshot?.opdCheckout 
      || checkoutRes?.resource?.[0]?.checkout_snapshot?.opdCheckout 
      || checkoutRes?.checkout_snapshot?.opdCheckout 
      || checkoutRes?.resource?.[0]
      || checkoutRes;

    const uhId = checkoutItem?.uhId || this.getResolvedUhId();

    const rawPayerInfo = checkoutItem?.payer_info || checkoutItem?.payer_details;
    const payerInfo = {
      id: rawPayerInfo?.id || '79bc4d83-d079-11f1-88bc-8ee28ecd112a-54',
      payer_type: rawPayerInfo?.payer_type || 'cash',
      payer_name: rawPayerInfo?.payer_name || 'Cash',
      payer_id: rawPayerInfo?.payer_id || '833efe10-694b-11ec-b3fb-de281cb5e8f4-27',
      payment_typeId: rawPayerInfo?.payment_typeId || 'cash',
      tariff_id: rawPayerInfo?.tariff_id || '30a43e20-6326-11ec-a778-1a3a2074e682-86'
    };

    const facilityAddress = checkoutItem?.facility_address || doc?.facility_address || {
      street1: 'DZREozj84vsuM/2Xh+RWga0HnFWg7LzoR3b4XN3qLhtdQ+0AfUBkGk+bNW4XTJ8C',
      street2: 'cF1TKmuytkRtTrnx0SVrJw==',
      street3: '',
      city: 'gautam buddha nagar',
      state: 'uttar pradesh',
      pincode: '201301',
      country: 'india',
      latitude: 28.5902174,
      longitude: 77.345956,
      cityDisplayName: 'Gautam Buddha Nagar',
      stateDisplayName: 'Uttar Pradesh',
      pincodeDisplayName: '',
      countryDisplayName: 'India'
    };

    const consultTypeCode = (this.mode() || '').toLowerCase() === 'audio' ? 'Audio' : 'Video';

    const sourceServices = (checkoutItem?.op_services && checkoutItem.op_services.length > 0)
      ? checkoutItem.op_services
      : ((checkoutItem?.op_failed_items && checkoutItem.op_failed_items.length > 0)
        ? checkoutItem.op_failed_items
        : []);

    let bookingServices: any[] = [];
    if (sourceServices.length > 0) {
      bookingServices = sourceServices.map((svc: any) => ({
        id: svc?.id || doc?.id || '',
        serviceItemId: svc?.serviceItemId || doc?.id || '',
        serviceItemCode: svc?.serviceItemCode || doc?.doctor_code || doc?.id || '',
        serviceItemName: svc?.serviceItemName || doc?.name || '',
        serviceType_code: svc?.serviceType_code || 'op_consultation',
        serviceType: svc?.serviceType || 'OP Consultation',
        department_id: svc?.department_id || doc?.department_id || 'fd9249f0-6302-11ec-8c2d-6ef3f61dec40-81',
        department_name: svc?.department_name || doc?.department_name || 'General Physician',
        subDepartment_id: svc?.subDepartment_id || doc?.subDepartment_id || 'a6aa1681-64ac-11ec-a778-1a3a2074e682-64',
        subDepartment_name: svc?.subDepartment_name || doc?.subDepartment_name || 'General Physician',
        priority: svc?.priority || 'Routine',
        priorityCode: svc?.priorityCode || 'routine',
        speciality_code: (svc?.speciality_code || doc?.speciality_code || doc?.speciality || 'GENERAL PHYSICIAN').toUpperCase(),
        speciality_id: svc?.speciality_id || doc?.speciality_id || '72cdfed0-6c7c-11ec-97ad-6ea2ac7af13a-81',
        speciality_name: svc?.speciality_name || doc?.speciality || 'General Physician',
        category: (svc?.category || doc?.speciality || 'GENERAL PHYSICIAN').toUpperCase(),
        qty: svc?.qty ?? 1,
        appointment_time: String(svc?.appointment_time || sEnd || 0),
        // unit_price: svc?.unit_price ?? 0,
        unit_price: 100, // TODO: Revert hardcoded test value later
        // bill_amount: svc?.bill_amount ?? 0,
        bill_amount: 100, // TODO: Revert hardcoded test value later
        // discount: svc?.discount ?? 0,
        discount: 0, // TODO: Revert hardcoded test value later
        // net_amount: svc?.net_amount ?? 0,
        net_amount: 100, // TODO: Revert hardcoded test value later
        // patient_amount: svc?.patient_amount ?? 0,
        patient_amount: 0, // TODO: Revert hardcoded test value later
        // payer_amount: svc?.payer_amount ?? 0,
        payer_amount: 0, // TODO: Revert hardcoded test value later
        // tax: svc?.tax ?? 0,
        tax: 0, // TODO: Revert hardcoded test value later
        consultation_type: svc?.consultation_type || 'Tele Consult',
        consultation_type_code: consultTypeCode,
        cart_id: svc?.cart_id || cartId || '',
        failed_items_message: '',
        is_failed_items: false,
        serviceDate: String(svc?.serviceDate || sDate || 0),
        serviceStartTime: Number(svc?.serviceStartTime || sStart || 0),
        serviceEndTime: Number(svc?.serviceEndTime || sEnd || 0),
        participant: svc?.participant || (doc ? [
          {
            participantId: doc.id || '',
            participantName: doc.name || '',
            participantRole: 'doctor'
          }
        ] : []),
        performing_doctor: svc?.performing_doctor || doc?.name || '',
        slotId: svc?.slotId || s?.id || '',
        over_booking_status: false,
        practice_type_code: 'individual',
        practice_type_name: 'Individual Practice',
        order_date_time: svc?.order_date_time || now,
        referenceId: '',
        common_tax_detail: [],
        patient_instructions: '',
        logo_id: '',
        doctor_profile_path: svc?.doctor_profile_path || doc?.profile_path || '',
        // cug_amount: svc?.cug_amount ?? 0,
        cug_amount: 0, // TODO: Revert hardcoded test value later
        slotNo: Number(svc?.slotNo || s?.slotNo || 3),
        // service_mrp: svc?.service_mrp ?? 0,
        service_mrp: 100, // TODO: Revert hardcoded test value later
        // service_selling_amount: svc?.service_selling_amount ?? 0,
        service_selling_amount: 100, // TODO: Revert hardcoded test value later
        care_coin_discount: 0,
        care_coin_discount_amount: 0,
        used_wallet_amount: 0,
        earn_care_coins: 0,
        service_code: svc?.service_code || doc?.doctor_code || '',
        doctor_experience: String(svc?.doctor_experience || (doc?.experience != null ? doc.experience : '0')),
        is_home_collection: false,
        doctor_telecom: svc?.doctor_telecom || doc?.telecom || '',
        is_centre_visit: false,
        part_of_package: false,
        extra_data: svc?.extra_data || {
          edit_price: false,
          speciality_name: doc?.speciality || 'General Physician',
          facility_name: doc?.facility_name || 'HCL Healthcare',
          qualification: doc?.qualification || 'MBBS'
        },
        floor_name: svc?.floor_name || '',
        room_name: svc?.room_name || ''
      }));
    } else {
      bookingServices = [
        {
          id: doc?.id || '',
          serviceItemId: doc?.id || '',
          serviceItemCode: doc?.doctor_code || doc?.id || '',
          serviceItemName: doc?.name || '',
          serviceType_code: 'op_consultation',
          serviceType: 'OP Consultation',
          department_id: doc?.department_id || 'fd9249f0-6302-11ec-8c2d-6ef3f61dec40-81',
          department_name: doc?.department_name || 'General Physician',
          subDepartment_id: doc?.subDepartment_id || 'a6aa1681-64ac-11ec-a778-1a3a2074e682-64',
          subDepartment_name: doc?.subDepartment_name || 'General Physician',
          priority: 'Routine',
          priorityCode: 'routine',
          speciality_code: (doc?.speciality_code || doc?.speciality || 'GENERAL PHYSICIAN').toUpperCase(),
          speciality_id: doc?.speciality_id || '72cdfed0-6c7c-11ec-97ad-6ea2ac7af13a-81',
          speciality_name: doc?.speciality || 'General Physician',
          category: (doc?.speciality || 'GENERAL PHYSICIAN').toUpperCase(),
          qty: 1,
          appointment_time: String(sEnd || sStart || now),
          // unit_price: 0,
          unit_price: 100, // TODO: Revert hardcoded test value later
          // bill_amount: 0,
          bill_amount: 100, // TODO: Revert hardcoded test value later
          // discount: 0,
          discount: 0, // TODO: Revert hardcoded test value later
          // net_amount: 0,
          net_amount: 100, // TODO: Revert hardcoded test value later
          // patient_amount: 0,
          patient_amount: 0, // TODO: Revert hardcoded test value later
          // payer_amount: 0,
          payer_amount: 0, // TODO: Revert hardcoded test value later
          // tax: 0,
          tax: 0, // TODO: Revert hardcoded test value later
          consultation_type: 'Tele Consult',
          consultation_type_code: consultTypeCode,
          cart_id: cartId || '',
          failed_items_message: '',
          is_failed_items: false,
          serviceDate: String(sDate || now),
          serviceStartTime: Number(sStart || now),
          serviceEndTime: Number(sEnd || now),
          participant: doc ? [
            {
              participantId: doc.id || '',
              participantName: doc.name || '',
              participantRole: 'doctor'
            }
          ] : [],
          performing_doctor: doc?.name || '',
          slotId: s?.id || '',
          over_booking_status: false,
          practice_type_code: 'individual',
          practice_type_name: 'Individual Practice',
          order_date_time: now,
          referenceId: '',
          common_tax_detail: [],
          patient_instructions: '',
          logo_id: '',
          doctor_profile_path: doc?.profile_path || '',
          // cug_amount: 0,
          cug_amount: 0, // TODO: Revert hardcoded test value later
          slotNo: Number(s?.slotNo || 3),
          // service_mrp: 0,
          service_mrp: 100, // TODO: Revert hardcoded test value later
          // service_selling_amount: 0,
          service_selling_amount: 100, // TODO: Revert hardcoded test value later
          care_coin_discount: 0,
          care_coin_discount_amount: 0,
          used_wallet_amount: 0,
          earn_care_coins: 0,
          service_code: doc?.doctor_code || '',
          doctor_experience: doc?.experience != null ? String(doc.experience) : '0',
          is_home_collection: false,
          doctor_telecom: doc?.telecom || '',
          is_centre_visit: false,
          part_of_package: false,
          extra_data: {
            edit_price: false,
            speciality_name: doc?.speciality || 'General Physician',
            facility_name: doc?.facility_name || 'HCL Healthcare',
            qualification: doc?.qualification || 'MBBS'
          },
          floor_name: '',
          room_name: ''
        }
      ];
    }

    const serviceRequestHandler: any = {
      patient_details: {
        patient_id: checkoutItem?.patient_id || patId,
        patientType: 'OP',
        uhId: checkoutItem?.uhId || uhId,
        payer_info: payerInfo
      },
      selectedPackageServiceItemIds: [],
      facility_id: checkoutItem?.facility_id || doc?.facility_id || '7d3e4410-81c0-11ed-adc3-8256d01a1a51-14',
      scheme_code: checkoutItem?.scheme_code || '',
      is_use_wallet: checkoutItem?.is_use_wallet ?? false,
      bg_code: checkoutItem?.bg_code || this.policyStore.walletAccount()?.bg_code || '',
      scheme_discount_applicable: false,
      cug_code: checkoutItem?.cug_code || doc?.cug_code || this.policyStore.version()?.cug_code || 'TC0001',
      doctor_id: doc?.id || '',
      type: '',
      tag_data: [],
      // bill_amount: checkoutItem?.bill_amount ?? 0,
      bill_amount: 100, // TODO: Revert hardcoded test value later
      // net_amount: checkoutItem?.net_amount ?? 0,
      net_amount: 100, // TODO: Revert hardcoded test value later
      // final_payable: checkoutItem?.final_payable ?? 0,
      final_payable: 0, // TODO: Revert hardcoded test value later
      // service_mrp: checkoutItem?.service_mrp ?? 0,
      service_mrp: 100, // TODO: Revert hardcoded test value later
      // service_selling_amount: checkoutItem?.service_selling_amount ?? 0,
      service_selling_amount: 100, // TODO: Revert hardcoded test value later
      home_collection_charges: 0,
      // discount: checkoutItem?.discount ?? 0,
      discount: 0, // TODO: Revert hardcoded test value later
      care_coin_discount: 0,
      care_coin_discount_amount: 0,
      // tax: checkoutItem?.tax ?? 0,
      tax: 0, // TODO: Revert hardcoded test value later
      // patient_amount: checkoutItem?.patient_amount ?? 0,
      patient_amount: 0, // TODO: Revert hardcoded test value later
      // payer_amount: checkoutItem?.payer_amount ?? 0,
      payer_amount: 0, // TODO: Revert hardcoded test value later
      // cug_amount: checkoutItem?.cug_amount ?? 0,
      cug_amount: 0, // TODO: Revert hardcoded test value later
      // authorized_amount: checkoutItem?.authorized_amount ?? 0,
      authorized_amount: 0, // TODO: Revert hardcoded test value later
      // used_wallet_amount: checkoutItem?.used_wallet_amount ?? 0,
      used_wallet_amount: 0, // TODO: Revert hardcoded test value later
      roundOff: 0,
      earn_care_coins: 0,
      is_use_care_coin: false,
      billing_category_id: checkoutItem?.billing_category_id || 'd03e69c1-63e3-11ec-a778-1a3a2074e682-37',
      billing_category_name: checkoutItem?.billing_category_name || 'OP',
      payment_details: [],
      payment_type: 'E-Payment',
      payment_status: 'Pending',
      provider_name: checkoutItem?.provider_name || doc?.provider_name || 'HCL Healthcare',
      provider_code: checkoutItem?.provider_code || doc?.provider_code || 'HCLHC001',
      old_serviceRequestId: '',
      orderedFrom: checkoutItem?.orderedFrom || 'Patient Portal',
      is_walkin: false,
      order_device: 'WEB',
      order_type: 'Patient Portal',
      services: bookingServices,
      rule_code: '',
      facility_address: facilityAddress,
      mode_of_appointment: 'opd_network',
      uhId: uhId,
      area_id: '',
      branch_id: '',
      city_id: '',
      zone_Id: '',
      slot_id: ''
    };

    // Construct or extract checkout_snapshot with opdCheckout
    const rawOpdCheckout = rawCheckoutSnapshot?.opdCheckout || checkoutItem;
    const opdCheckout = {
      id: rawOpdCheckout?.id || '',
      cug_code: rawOpdCheckout?.cug_code || doc?.cug_code || 'TC0001',
      facility_id: rawOpdCheckout?.facility_id || doc?.facility_id || '7d3e4410-81c0-11ed-adc3-8256d01a1a51-14',
      uhId: rawOpdCheckout?.uhId || uhId,
      provider_code: rawOpdCheckout?.provider_code || doc?.provider_code || 'HCLHC001',
      provider_name: rawOpdCheckout?.provider_name || doc?.provider_name || 'HCL Healthcare',
      bg_code: rawOpdCheckout?.bg_code || '',
      billing_category_id: rawOpdCheckout?.billing_category_id || 'd03e69c1-63e3-11ec-a778-1a3a2074e682-37',
      billing_category_name: rawOpdCheckout?.billing_category_name || 'OP',
      scheme_code: rawOpdCheckout?.scheme_code || '',
      scheme_discount_applicable: false,
      patient_id: rawOpdCheckout?.patient_id || patId,
      failed_items: rawOpdCheckout?.failed_items || [],
      op_services: rawOpdCheckout?.op_services || [],
      op_failed_items: rawOpdCheckout?.op_failed_items || [],
      failed_items_message: rawOpdCheckout?.failed_items_message || '',
      is_failed_items: rawOpdCheckout?.is_failed_items ?? false,
      payer_details: rawOpdCheckout?.payer_details || payerInfo,
      type: rawOpdCheckout?.type || '',
      // final_payable: rawOpdCheckout?.final_payable ?? 0,
      final_payable: 0, // TODO: Revert hardcoded test value later
      // paid_amount: rawOpdCheckout?.paid_amount ?? 0,
      paid_amount: 0, // TODO: Revert hardcoded test value later
      is_previous_paid: false,
      previous_paid_details: {},
      excluded_amount: 0,
      orderedFrom: rawOpdCheckout?.orderedFrom || 'Patient Portal',
      // service_mrp: rawOpdCheckout?.service_mrp ?? 0,
      service_mrp: 0, // TODO: Revert hardcoded test value later
      // service_selling_amount: rawOpdCheckout?.service_selling_amount ?? 0,
      service_selling_amount: 0, // TODO: Revert hardcoded test value later
      isNonPayerPaybleItem: false,
      // discount: rawOpdCheckout?.discount ?? 0,
      discount: 0, // TODO: Revert hardcoded test value later
      care_coin_discount: 0,
      care_coin_discount_amount: 0,
      // tax: rawOpdCheckout?.tax ?? 0,
      tax: 0, // TODO: Revert hardcoded test value later
      // bill_amount: rawOpdCheckout?.bill_amount ?? 0,
      bill_amount: 100.0, // TODO: Revert hardcoded test value later
      // net_amount: rawOpdCheckout?.net_amount ?? 0,
      net_amount: 100.0, // TODO: Revert hardcoded test value later
      // patient_amount: rawOpdCheckout?.patient_amount ?? 0,
      patient_amount: 0, // TODO: Revert hardcoded test value later
      // payer_amount: rawOpdCheckout?.payer_amount ?? 0,
      payer_amount: 0, // TODO: Revert hardcoded test value later
      // cug_amount: rawOpdCheckout?.cug_amount ?? 0,
      cug_amount: 0, // TODO: Revert hardcoded test value later
      // authorized_amount: rawOpdCheckout?.authorized_amount ?? 0,
      authorized_amount: 0, // TODO: Revert hardcoded test value later
      // used_wallet_amount: rawOpdCheckout?.used_wallet_amount ?? 0,
      used_wallet_amount: 0, // TODO: Revert hardcoded test value later
      roundOff: 0,
      earn_care_coins: 0,
      is_use_wallet: false,
      is_use_care_coin: false,
      old_serviceRequestId: '',
      facility_address: facilityAddress,
      is_family_member: rawOpdCheckout?.is_family_member ?? false,
      patient_details: rawOpdCheckout?.patient_details || {
        id: patId,
        uhId: uhId,
        cug_code: rawOpdCheckout?.cug_code || 'TC0001'
      },
      mode_of_appointment: 'opd_network',
      tag_data: []
    };

    return {
      booking_snapshot: {
        serviceRequestHandler: serviceRequestHandler
      },
      checkout_snapshot: {
        opdCheckout: opdCheckout
      }
    };
  }

  private finish(): void {
    this.started.set(false);
    this.step.set(0);
    this.inCall.set(false);
    this.cancelNote.set(null);
    this.consultationRequestId.set(null);
  }
}