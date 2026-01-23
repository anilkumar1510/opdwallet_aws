'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  validatePayment,
  getPaymentMethodDisplay,
  calculateFinalAmounts,
  PaymentValidationResult
} from '@/lib/paymentValidator';
import {
  createTransaction,
  createPendingPayment
} from '@/lib/transactions';
import {
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface PaymentProcessorProps {
  consultationFee: number;
  userId: string;
  patientId: string;
  patientName: string;
  serviceType: 'APPOINTMENT' | 'ONLINE_CONSULTATION' | 'DENTAL' | 'VISION' | 'LAB' | 'DIAGNOSTIC' | 'AHC';
  bookingId?: string; // Optional booking ID for VISION, DENTAL, LAB, DIAGNOSTIC, and AHC service types
  serviceDetails: {
    doctorName?: string;
    doctorId?: string;
    appointmentId?: string;
    date?: string;
    time?: string;
    clinicName?: string;
    clinicId?: string;
    serviceCode?: string;
    serviceName?: string;
    slotId?: string;
    // AHC-specific fields
    packageId?: string;
    packageName?: string;
    labVendorId?: string;
    labVendorName?: string;
    labSlotId?: string;
    labDate?: string;
    labTime?: string;
    labCollectionType?: string;
    labCollectionAddress?: any;
    diagnosticVendorId?: string;
    diagnosticVendorName?: string;
    diagnosticSlotId?: string;
    diagnosticDate?: string;
    diagnosticTime?: string;
  };
  onPaymentSuccess?: (transaction: any) => void;
  onPaymentFailure?: (error: string) => void;
  children?: (props: PaymentRenderProps) => React.ReactNode;
  // Service transaction limit information (optional)
  serviceLimit?: {
    serviceTransactionLimit: number;
    insuranceEligibleAmount: number;
    insurancePayment: number;
    excessAmount: number;
    wasLimitApplied: boolean;
    copayAmount?: number;
    totalMemberPayment?: number;
  };
}

interface PaymentRenderProps {
  walletBalance: number;
  copayPercentage: number;
  copayAmount: number;
  walletCoverage: number;
  needsPayment: boolean;
  paymentMethod: string;
  isProcessing: boolean;
  error: string | null;
  handlePayment: () => Promise<void>;
  validationResult: PaymentValidationResult | null;
}

export default function PaymentProcessor({
  consultationFee,
  userId,
  patientId,
  patientName,
  serviceType,
  bookingId,
  serviceDetails,
  onPaymentSuccess,
  onPaymentFailure,
  children,
  serviceLimit
}: PaymentProcessorProps) {
  const router = useRouter();
  const [validationResult, setValidationResult] = useState<PaymentValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate payment on component mount
  useEffect(() => {
    validatePaymentDetails();
  }, [patientId, consultationFee]);

  const validatePaymentDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await validatePayment({
        userId,
        patientId,
        consultationFee
      });

      setValidationResult(result);
    } catch (err) {
      console.error('Payment validation error:', err);
      setError('Failed to validate payment details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!validationResult || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const serviceName = serviceType === 'APPOINTMENT'
        ? `In-clinic consultation with ${serviceDetails.doctorName}`
        : serviceType === 'ONLINE_CONSULTATION'
        ? `Online consultation with ${serviceDetails.doctorName}`
        : serviceType === 'AHC'
        ? `AHC Package: ${serviceDetails.packageName || 'Annual Health Check'}`
        : serviceDetails.serviceName || `${serviceType} Service`;

      // Calculate actual user payment amount (includes excess amount if service limit applied)
      const actualUserPayment = serviceLimit?.totalMemberPayment ?? (serviceLimit && serviceLimit.wasLimitApplied
        ? ((serviceLimit.copayAmount || validationResult.copayAmount) + serviceLimit.excessAmount)
        : validationResult.userPayment);

      // Case 1: Fully covered by wallet/insurance
      if (validationResult.paymentMethod === 'WALLET_ONLY') {
        // For appointments, the /api/appointments endpoint handles wallet deduction internally
        // No need to call processWalletPayment separately

        // Create a mock transaction object for the callback
        const transaction = {
          transactionId: `TXN${Date.now()}`,
          userId,
          patientId,
          serviceType,
          serviceName,
          serviceReferenceId: serviceDetails.appointmentId,
          totalAmount: consultationFee,
          walletAmount: consultationFee,
          selfPaidAmount: 0,
          copayAmount: 0,
          paymentMethod: 'WALLET_ONLY',
          status: 'COMPLETED',
          createdAt: new Date()
        };

        onPaymentSuccess?.(transaction);
        return;
      }

      // Case 2: Copay required with sufficient wallet for coverage
      if (validationResult.paymentMethod === 'COPAY' &&
          validationResult.walletBalance >= validationResult.walletCoverage) {

        // Check if user needs to pay copay externally
        if (actualUserPayment > 0) {
          // Create pending payment for copay
          const payment = await createPendingPayment({
            amount: actualUserPayment,
            paymentType: 'COPAY',
            serviceType,
            serviceReferenceId: bookingId || serviceDetails.appointmentId,
            description: `Copay for ${serviceName}`,
            userId,
            patientId,
            metadata: {
              consultationFee,
              walletCoverage: validationResult.walletCoverage,
              copayAmount: validationResult.copayAmount,
              doctorName: serviceDetails.doctorName,
              date: serviceDetails.date,
              time: serviceDetails.time
            }
          });

          // Store booking data in session for completion after payment
          sessionStorage.setItem('pendingBooking', JSON.stringify({
            serviceType,
            serviceDetails,
            patientId,
            patientName,
            userId,
            consultationFee,
            walletCoverage: validationResult.walletCoverage,
            paymentId: payment.paymentId
          }));

          // Redirect to payment gateway
          const redirectUrl = serviceType === 'APPOINTMENT'
            ? '/member/bookings?tab=doctors'
            : serviceType === 'DENTAL'
            ? '/member/bookings?tab=dental'
            : serviceType === 'VISION'
            ? '/member/bookings?tab=vision'
            : serviceType === 'LAB'
            ? '/member/bookings?tab=lab'
            : serviceType === 'DIAGNOSTIC'
            ? '/member/bookings?tab=diagnostic'
            : serviceType === 'AHC'
            ? '/member/bookings?tab=ahc'
            : '/member/online-consult';

          router.push(`/member/payments/${payment.paymentId}?redirect=${redirectUrl}`);
          return;
        }
      }

      // Case 3: Out of pocket or full payment required
      if (validationResult.paymentMethod === 'OUT_OF_POCKET' ||
          validationResult.paymentMethod === 'FULL_PAYMENT') {

        // Create pending payment for the full user payment amount
        const payment = await createPendingPayment({
          amount: actualUserPayment,
          paymentType: validationResult.paymentMethod as any,
          serviceType,
          serviceReferenceId: bookingId || serviceDetails.appointmentId,
          description: serviceName,
          userId,
          patientId,
          metadata: {
            consultationFee,
            walletCoverage: validationResult.walletDeduction,
            doctorName: serviceDetails.doctorName,
            date: serviceDetails.date,
            time: serviceDetails.time
          }
        });

        // Store booking data for completion after payment
        sessionStorage.setItem('pendingBooking', JSON.stringify({
          serviceType,
          serviceDetails: {
            ...serviceDetails,
            slotId: serviceDetails.slotId || `${serviceDetails.doctorId}_${serviceType === 'APPOINTMENT' ? 'IN_CLINIC' : 'ONLINE'}_${serviceDetails.date}_${serviceDetails.time}`
          },
          patientId,
          patientName,
          userId,
          consultationFee,
          walletCoverage: validationResult.walletDeduction,
          paymentId: payment.paymentId
        }));

        // Redirect to payment gateway
        const redirectUrl = serviceType === 'APPOINTMENT'
          ? '/member/bookings?tab=doctors'
          : serviceType === 'DENTAL'
          ? '/member/bookings?tab=dental'
          : serviceType === 'VISION'
          ? '/member/bookings?tab=vision'
          : serviceType === 'LAB'
          ? '/member/bookings?tab=lab'
          : serviceType === 'DIAGNOSTIC'
          ? '/member/bookings?tab=diagnostic'
          : serviceType === 'AHC'
          ? '/member/bookings?tab=ahc'
          : '/member/online-consult';

        router.push(`/member/payments/${payment.paymentId}?redirect=${redirectUrl}`);
      }

    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Failed to process payment');
      onPaymentFailure?.(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Calculating payment details...</span>
      </div>
    );
  }

  // Error state
  if (!validationResult) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Payment Validation Failed</p>
            <p className="text-red-600 text-sm mt-1">
              {error || 'Unable to calculate payment details. Please try again.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderProps: PaymentRenderProps = {
    walletBalance: validationResult.walletBalance,
    copayPercentage: validationResult.copayPercentage,
    copayAmount: validationResult.copayAmount,
    walletCoverage: validationResult.walletCoverage,
    needsPayment: validationResult.userPayment > 0,
    paymentMethod: getPaymentMethodDisplay(validationResult.paymentMethod),
    isProcessing,
    error,
    handlePayment,
    validationResult
  };

  // Custom render using children function
  if (children) {
    return <>{children(renderProps)}</>;
  }

  // Default render
  return (
    <div className="space-y-4">
      {/* Payment Breakdown Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Payment Breakdown</h3>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Consultation Fee</span>
            <span className="font-medium text-gray-900">₹{consultationFee}</span>
          </div>

          {validationResult.walletBalance > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Wallet Balance</span>
              <span className="font-medium text-gray-900">₹{validationResult.walletBalance}</span>
            </div>
          )}

          {((validationResult.copayPercentage > 0 && validationResult.copayAmount > 0) || (serviceLimit && serviceLimit.copayAmount !== undefined && serviceLimit.copayAmount > 0)) && (
            <>
              <div className="flex justify-between text-sm text-red-600">
                <span>Your Copay ({validationResult.copayPercentage}%)</span>
                <span className="font-medium">- ₹{serviceLimit?.copayAmount || validationResult.copayAmount}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600">Insurance Eligible Amount</span>
                <span className="font-medium text-gray-900">₹{serviceLimit ? serviceLimit.insuranceEligibleAmount : (consultationFee - validationResult.copayAmount)}</span>
              </div>
            </>
          )}

          {/* Service Transaction Limit Section */}
          {serviceLimit && serviceLimit.wasLimitApplied && serviceLimit.serviceTransactionLimit > 0 && serviceLimit.excessAmount > 0 && (
            <>
              <div className="flex items-start justify-between text-sm bg-orange-50 -mx-2 px-2 py-1.5 rounded">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 mr-1 mt-0.5 text-orange-600 flex-shrink-0" />
                  <span className="text-orange-800">Service Transaction Limit Applied</span>
                </div>
                <span className="font-medium text-orange-800">Max ₹{serviceLimit.serviceTransactionLimit}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Additional Out-of-Pocket</span>
                <span className="font-medium">- ₹{serviceLimit.excessAmount}</span>
              </div>
            </>
          )}

          {((validationResult.copayPercentage > 0 && validationResult.walletCoverage > 0) || (serviceLimit && serviceLimit.insurancePayment !== undefined && serviceLimit.insurancePayment > 0)) && (
            <div className="border-t pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700 font-medium">Insurance Pays</span>
                <span className="font-medium text-green-600">
                  ₹{serviceLimit ? serviceLimit.insurancePayment : validationResult.walletCoverage}
                </span>
              </div>
            </div>
          )}

          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">You Pay Total</span>
              <span className="font-bold text-lg text-red-600">
                ₹{serviceLimit?.totalMemberPayment ?? (serviceLimit && serviceLimit.wasLimitApplied
                  ? ((serviceLimit.copayAmount || validationResult.copayAmount) + serviceLimit.excessAmount)
                  : validationResult.userPayment)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Badge */}
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-xs text-gray-500">Payment Method:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {getPaymentMethodDisplay(validationResult.paymentMethod)}
          </span>
        </div>

        {/* Service Limit Info Box */}
        {serviceLimit && serviceLimit.wasLimitApplied && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> This service has a transaction limit of ₹{serviceLimit.serviceTransactionLimit}.
              After applying your {validationResult.copayPercentage}% copay (₹{serviceLimit.copayAmount || validationResult.copayAmount}), insurance can pay a maximum of ₹{serviceLimit.insurancePayment}.
              You pay the remaining ₹{serviceLimit.excessAmount} out-of-pocket.
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || !validationResult.canProceed}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
          isProcessing || !validationResult.canProceed
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : (serviceLimit?.totalMemberPayment ?? (serviceLimit && serviceLimit.wasLimitApplied ? ((serviceLimit.copayAmount || validationResult.copayAmount) + serviceLimit.excessAmount) : validationResult.userPayment)) > 0
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (serviceLimit?.totalMemberPayment ?? (serviceLimit && serviceLimit.wasLimitApplied ? ((serviceLimit.copayAmount || validationResult.copayAmount) + serviceLimit.excessAmount) : validationResult.userPayment)) > 0 ? (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay ₹{serviceLimit?.totalMemberPayment ?? (serviceLimit && serviceLimit.wasLimitApplied
              ? ((serviceLimit.copayAmount || validationResult.copayAmount) + serviceLimit.excessAmount)
              : validationResult.userPayment)} & Confirm</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Confirm Booking (Fully Covered)</span>
          </>
        )}
      </button>

      {/* Info Message */}
      {validationResult.insufficientFunds && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">Insufficient Wallet Balance</p>
              <p className="text-xs text-yellow-700 mt-1">
                You will need to pay the remaining amount through our payment gateway.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}