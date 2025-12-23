'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, CreditCard, Loader2, AlertCircle } from 'lucide-react';

interface PaymentDetails {
  paymentId: string;
  amount: number;
  paymentType: string;
  status: string;
  description: string;
  serviceType: string;
  serviceReferenceId: string;
  createdAt: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = params.paymentId as string;
  const redirectUrl = searchParams.get('redirect') || '/member';

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchPaymentDetails = useCallback(async () => {
    try {
      console.log('🔍 [PaymentPage] Fetching payment details for:', paymentId);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('🔍 [PaymentPage] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }

      const data = await response.json();
      console.log('✅ [PaymentPage] Payment data received:', {
        paymentId: data.paymentId,
        status: data.status,
        amount: data.amount,
        paymentType: data.paymentType,
        serviceType: data.serviceType,
      });

      // Warn if payment is already completed
      if (data.status === 'COMPLETED') {
        console.warn('⚠️ [PaymentPage] Payment is already marked as COMPLETED');
        console.warn('⚠️ [PaymentPage] This payment cannot be processed again');
      }

      setPayment(data);
    } catch (err: any) {
      console.error('❌ [PaymentPage] Error fetching payment:', err);
      setError(err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId, fetchPaymentDetails]);

  const handleMarkAsPaid = async () => {
    console.log('🚀 [PaymentPage] ========== MARK AS PAID CLICKED ==========');
    console.log('🚀 [PaymentPage] Payment ID:', paymentId);
    console.log('🚀 [PaymentPage] Current payment status:', payment?.status);
    console.log('🚀 [PaymentPage] Timestamp:', new Date().toISOString());

    setProcessing(true);
    setError('');

    try {
      // Check if there's a pending booking in session storage
      const pendingBookingData = sessionStorage.getItem('pendingBooking');
      console.log('🔍 [PaymentPage] Pending booking data:', pendingBookingData ? 'EXISTS' : 'NOT FOUND');

      if (pendingBookingData) {
        const bookingData = JSON.parse(pendingBookingData);
        console.log('📦 [PaymentPage] Booking data:', JSON.stringify(bookingData, null, 2));

        // Complete the dental booking creation if pending
        if (bookingData.serviceType === 'DENTAL') {
          console.log('🦷 [PaymentPage] Creating dental booking with booking data...');

          // Verify we have all required fields for dental booking
          if (!bookingData.serviceDetails?.clinicId || !bookingData.serviceDetails?.serviceCode || !bookingData.serviceDetails?.slotId || !bookingData.serviceDetails?.date || !bookingData.serviceDetails?.time) {
            console.error('❌ [PaymentPage] Missing required dental booking details:', {
              hasClinicId: !!bookingData.serviceDetails?.clinicId,
              hasServiceCode: !!bookingData.serviceDetails?.serviceCode,
              hasSlotId: !!bookingData.serviceDetails?.slotId,
              hasDate: !!bookingData.serviceDetails?.date,
              hasTime: !!bookingData.serviceDetails?.time,
            });
            throw new Error('Missing required dental booking details. Please try booking again.');
          }

          // Build dental booking payload
          const dentalBookingPayload = {
            patientId: bookingData.patientId,
            clinicId: bookingData.serviceDetails.clinicId,
            serviceCode: bookingData.serviceDetails.serviceCode,
            serviceName: bookingData.serviceDetails.serviceName || '',
            slotId: bookingData.serviceDetails.slotId,
            price: bookingData.consultationFee,
            appointmentDate: bookingData.serviceDetails.date,
            appointmentTime: bookingData.serviceDetails.time,
            paymentAlreadyProcessed: true  // Payment was already handled by PaymentProcessor
          };

          console.log('[PaymentPage] Dental booking payload:', JSON.stringify(dentalBookingPayload, null, 2));

          // Create the dental booking
          const dentalBookingResponse = await fetch('/api/dental-bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(dentalBookingPayload)
          });

          console.log('[PaymentPage] Dental booking response status:', dentalBookingResponse.status);

          if (!dentalBookingResponse.ok) {
            const errorText = await dentalBookingResponse.text();
            console.error('[PaymentPage] Failed to create dental booking:', {
              status: dentalBookingResponse.status,
              statusText: dentalBookingResponse.statusText,
              errorBody: errorText
            });

            throw new Error(`Failed to create dental booking: ${dentalBookingResponse.status} - ${errorText}`);
          } else {
            const dentalBookingData = await dentalBookingResponse.json();
            console.log('[PaymentPage] Dental booking created successfully:', dentalBookingData);
            console.log('✅ [PaymentPage] Booking ID:', dentalBookingData.bookingId);
          }
        }
        // Vision bookings are already created, payment will be processed on backend
        else if (bookingData.serviceType === 'VISION') {
          console.log('👁️ [PaymentPage] Vision booking already exists, payment will be processed on backend');
          // Vision bookings are already created - backend will handle payment completion
          // The payment service will call visionBookingsService.handlePaymentComplete()
          // which updates booking status, generates invoice, etc.
        }
        // Complete the appointment creation if pending
        else if (bookingData.serviceType === 'APPOINTMENT' || bookingData.serviceType === 'ONLINE_CONSULTATION') {
          console.log('📅 [PaymentPage] Creating appointment with booking data...');

          // Verify we have all required fields
          if (!bookingData.serviceDetails?.doctorId || !bookingData.serviceDetails?.date || !bookingData.serviceDetails?.time) {
            console.error('❌ [PaymentPage] Missing required booking details:', {
              hasDoctorId: !!bookingData.serviceDetails?.doctorId,
              hasDate: !!bookingData.serviceDetails?.date,
              hasTime: !!bookingData.serviceDetails?.time,
            });
            throw new Error('Missing required appointment details. Please try booking again.');
          }

          // Build appointment payload - only include fields that are in the DTO
          const appointmentPayload: any = {
            patientId: bookingData.patientId,
            patientName: bookingData.patientName,
            doctorId: bookingData.serviceDetails?.doctorId,
            doctorName: bookingData.serviceDetails?.doctorName,
            specialty: bookingData.serviceDetails?.specialty || 'General Physician', // Add specialty field
            appointmentType: bookingData.serviceType === 'APPOINTMENT' ? 'IN_CLINIC' : 'ONLINE',
            appointmentDate: bookingData.serviceDetails?.date,
            timeSlot: bookingData.serviceDetails?.time,
            slotId: bookingData.serviceDetails?.slotId ||
                    `${bookingData.serviceDetails?.doctorId}_${bookingData.serviceType === 'APPOINTMENT' ? 'IN_CLINIC' : 'ONLINE'}_${bookingData.serviceDetails?.date}_${bookingData.serviceDetails?.time}`,
            consultationFee: bookingData.consultationFee,
            contactNumber: bookingData.serviceDetails?.contactNumber || '',
            callPreference: bookingData.serviceDetails?.callPreference || 'BOTH'
          };

          // Only add clinic fields for IN_CLINIC appointments
          if (bookingData.serviceType === 'APPOINTMENT') {
            if (bookingData.serviceDetails?.clinicId) {
              appointmentPayload.clinicId = bookingData.serviceDetails.clinicId;
            }
            if (bookingData.serviceDetails?.clinicName) {
              appointmentPayload.clinicName = bookingData.serviceDetails.clinicName;
            }
            if (bookingData.serviceDetails?.clinicAddress) {
              appointmentPayload.clinicAddress = bookingData.serviceDetails.clinicAddress;
            }
          }

          console.log('[PaymentPage] Appointment payload:', JSON.stringify(appointmentPayload, null, 2));
          console.log('🔥🔥🔥 [DEPLOY_V4] About to call /api/appointments endpoint with circular fix 🔥🔥🔥');

          // Create the appointment
          const appointmentResponse = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(appointmentPayload)
          });

          console.log('[PaymentPage] Appointment response status:', appointmentResponse.status);

          if (!appointmentResponse.ok) {
            const errorText = await appointmentResponse.text();
            console.error('[PaymentPage] Failed to create appointment:', {
              status: appointmentResponse.status,
              statusText: appointmentResponse.statusText,
              errorBody: errorText
            });

            // Don't proceed with payment if appointment creation failed
            throw new Error(`Failed to create appointment: ${appointmentResponse.status} - ${errorText}`);
          } else {
            const appointmentData = await appointmentResponse.json();
            console.log('[PaymentPage] Appointment created successfully:', appointmentData);
            console.log('✅ [PaymentPage] Appointment ID:', appointmentData.appointmentId);
          }
        }

        // Transaction is created automatically by the appointments service
        // No need to create it manually here

        // Clear pending booking from session only after successful appointment creation
        console.log('🧹 [PaymentPage] Clearing pending booking from session storage');
        sessionStorage.removeItem('pendingBooking');
      } else {
        console.warn('⚠️ [PaymentPage] No pending booking found in session storage');
        console.warn('⚠️ [PaymentPage] Payment will be marked as paid without creating appointment');
        console.warn('⚠️ [PaymentPage] This might cause issues if appointment was not created yet');
      }

      // Mark payment as completed
      console.log('💳 [PaymentPage] Marking payment as completed...');
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('💳 [PaymentPage] Mark-paid response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [PaymentPage] Failed to mark payment as paid:', errorText);
        throw new Error('Failed to process payment');
      }

      console.log('✅ [PaymentPage] Payment marked as completed successfully');

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(redirectUrl);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/member')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-2">Your payment has been processed successfully.</p>
          <p className="text-sm text-gray-500 mb-6">Redirecting you back...</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">
              Amount Paid: ₹{payment?.amount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return null;
  }

  console.log('🎨 [PaymentPage] Rendering payment page with:', {
    paymentId: payment.paymentId,
    status: payment.status,
    amount: payment.amount,
    isDisabled: processing || payment.status === 'COMPLETED',
    processing,
  });

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      COPAY: 'Co-payment',
      OUT_OF_POCKET: 'Out of Pocket',
      FULL_PAYMENT: 'Full Payment',
      PARTIAL_PAYMENT: 'Partial Payment',
      TOP_UP: 'Wallet Top-up',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Gateway</h1>
          <p className="text-sm text-gray-500">Dummy Payment Service</p>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID:</span>
              <span className="font-medium text-gray-900">{payment.paymentId}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900">
                {getPaymentTypeLabel(payment.paymentType)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium text-gray-900">{payment.serviceType}</span>
            </div>

            {payment.description && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">{payment.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Amount to Pay */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
            <p className="text-4xl font-bold text-blue-600">₹{payment.amount.toFixed(2)}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleMarkAsPaid}
            disabled={processing || payment.status === 'COMPLETED'}
            className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : payment.status === 'COMPLETED' ? (
              <span>Payment Already Completed</span>
            ) : (
              <span>Mark as Paid (Dummy Gateway)</span>
            )}
          </button>

          <button
            onClick={() => router.push(redirectUrl)}
            disabled={processing}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> This is a dummy payment gateway for testing purposes.
            In production, this would integrate with a real payment gateway like Razorpay or Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
