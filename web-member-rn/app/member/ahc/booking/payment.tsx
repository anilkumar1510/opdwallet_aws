import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  HomeIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '../../../../src/components/icons/InlineSVGs';
import apiClient from '../../../../src/lib/api/client';

// Types
interface AHCPackage {
  id: string;
  packageId: string;
  name: string;
  totalLabTests?: number;
  totalDiagnosticTests?: number;
}

interface LabBookingData {
  packageId?: string;
  vendorId: string;
  vendorName: string;
  collectionType: 'HOME_COLLECTION' | 'CENTER_VISIT';
  slotDate: string;
  slotTime: string;
  slotId: string;
  price?: number;
  totalDiscountedPrice?: number;
  totalActualPrice?: number;
  homeCollectionCharges?: number;
  pricing?: any[];
  address?: {
    // New format (preferred)
    addressLine1?: string;
    addressLine2?: string;
    state?: string;
    // Old format (for backwards compatibility)
    line1?: string;
    line2?: string;
    landmark?: string;
    city: string;
    pincode: string;
  };
}

interface DiagnosticBookingData {
  vendorId: string;
  vendorName: string;
  collectionType: string;
  slotDate: string;
  slotTime: string;
  slotId: string;
  price?: number;
  totalDiscountedPrice?: number;
  totalActualPrice?: number;
  homeCollectionCharges?: number;
  pricing?: any[];
}

// ============ BOOKING SUMMARY CARD ============
interface BookingSummaryProps {
  type: 'lab' | 'diagnostic';
  booking: LabBookingData | DiagnosticBookingData;
}

function BookingSummaryCard({ type, booking }: BookingSummaryProps) {
  const isLab = type === 'lab';
  const labBooking = booking as LabBookingData;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={styles.checkBadge}>
          <CheckCircleIcon width={16} height={16} color="#FFF" />
        </View>
        <Text style={styles.summaryTitle}>
          {isLab ? 'Lab Tests' : 'Diagnostic Tests'}
        </Text>
      </View>

      <View style={styles.summaryDetails}>
        <Text style={styles.vendorName}>{booking.vendorName}</Text>

        <View style={styles.detailRow}>
          <CalendarIcon width={14} height={14} color="#666" />
          <Text style={styles.detailText}>{booking.slotDate}</Text>
        </View>

        <View style={styles.detailRow}>
          <ClockIcon width={14} height={14} color="#666" />
          <Text style={styles.detailText}>{booking.slotTime}</Text>
        </View>

        <View style={styles.detailRow}>
          {(booking as LabBookingData).collectionType === 'HOME_COLLECTION' ? (
            <>
              <HomeIcon width={14} height={14} color="#5FA171" />
              <Text style={[styles.detailText, { color: '#5FA171' }]}>Home Collection</Text>
            </>
          ) : (
            <>
              <BuildingOfficeIcon width={14} height={14} color="#5FA171" />
              <Text style={[styles.detailText, { color: '#5FA171' }]}>Center Visit</Text>
            </>
          )}
        </View>

        {isLab && labBooking.collectionType === 'HOME_COLLECTION' && labBooking.address && (
          <View style={styles.addressSection}>
            <MapPinIcon width={14} height={14} color="#666" />
            <Text style={styles.addressText} numberOfLines={2}>
              {labBooking.address.line1}
              {labBooking.address.city && `, ${labBooking.address.city}`}
              {labBooking.address.pincode && ` - ${labBooking.address.pincode}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Amount</Text>
        <Text style={styles.priceValue}>₹{booking.price || (booking as any).totalDiscountedPrice || 0}</Text>
      </View>
    </View>
  );
}

// ============ MAIN PAYMENT PAGE ============
export default function AHCPaymentPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null);
  const [labBooking, setLabBooking] = useState<LabBookingData | null>(null);
  const [diagnosticBooking, setDiagnosticBooking] = useState<DiagnosticBookingData | null>(null);

  const [userId, setUserId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  // Load data on mount
  useEffect(() => {
    loadBookingData();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Use /auth/me endpoint to get user data
      const response = await apiClient.get('/auth/me');
      const userData = response.data;
      console.log('[AHCPayment] User data:', userData);

      setUserId(userData._id || userData.id);
      setPatientId(userData._id || userData.id);

      // Get patient name - handle different name formats
      let name = 'Member';
      if (userData.name?.firstName && userData.name?.lastName) {
        name = `${userData.name.firstName} ${userData.name.lastName}`;
      } else if (userData.firstName && userData.lastName) {
        name = `${userData.firstName} ${userData.lastName}`;
      } else if (userData.name && typeof userData.name === 'string') {
        name = userData.name;
      }
      setPatientName(name);

      // Get phone number
      const phone = userData.phone || userData.mobile || userData.contactNumber || '';
      setPatientPhone(phone);

      // Fetch wallet balance
      try {
        const walletResponse = await apiClient.get(`/wallet/balance?userId=${userData._id || userData.id}`);
        setWalletBalance(walletResponse.data.totalBalance?.current || walletResponse.data.balance || 0);
      } catch (walletErr) {
        console.warn('[AHCPayment] Could not fetch wallet balance:', walletErr);
      }
    } catch (error) {
      console.error('[AHCPayment] Error fetching user data:', error);
    }
  };

  const loadBookingData = async () => {
    try {
      // Get AHC package
      const packageData = await AsyncStorage.getItem('ahc_package');
      if (!packageData) {
        Alert.alert('Error', 'Package information not found');
        router.replace('/member/wellness-programs');
        return;
      }
      const packageInfo = JSON.parse(packageData);
      setAhcPackage(packageInfo);

      const hasLabTests = (packageInfo.totalLabTests || 0) > 0;
      const hasDiagnosticTests = (packageInfo.totalDiagnosticTests || 0) > 0;

      // Get lab booking (required if package has lab tests)
      if (hasLabTests) {
        const labData = await AsyncStorage.getItem('ahc_booking_data');
        if (!labData) {
          Alert.alert('Error', 'Lab booking information not found');
          router.replace('/member/ahc/booking');
          return;
        }
        setLabBooking(JSON.parse(labData));
      }

      // Get diagnostic booking (required if package has diagnostic tests)
      if (hasDiagnosticTests) {
        const diagnosticData = await AsyncStorage.getItem('ahc_diagnostic_booking');
        console.log('[AHCPayment] Diagnostic booking data from storage:', diagnosticData);
        if (!diagnosticData) {
          Alert.alert('Error', 'Diagnostic booking information not found');
          router.replace('/member/ahc/booking/diagnostic');
          return;
        }
        const parsedDiagnostic = JSON.parse(diagnosticData);
        console.log('[AHCPayment] Parsed diagnostic booking:', parsedDiagnostic);
        setDiagnosticBooking(parsedDiagnostic);
      }
    } catch (error) {
      console.error('[AHCPayment] Error loading booking data:', error);
      Alert.alert('Error', 'Failed to load booking information');
      router.replace('/member/wellness-programs');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pricing
  const calculatePricing = () => {
    const labTotal = labBooking?.price || labBooking?.totalDiscountedPrice || 0;
    const diagnosticTotal = diagnosticBooking?.price || diagnosticBooking?.totalDiscountedPrice || 0;
    const subtotal = labTotal + diagnosticTotal;

    console.log('[AHCPayment] Pricing calculation:', {
      labTotal,
      diagnosticTotal,
      subtotal,
      labBooking: labBooking ? { price: labBooking.price, totalDiscountedPrice: (labBooking as any).totalDiscountedPrice } : null,
      diagnosticBooking: diagnosticBooking ? { price: diagnosticBooking.price, totalDiscountedPrice: diagnosticBooking.totalDiscountedPrice } : null,
    });

    // Placeholder copay calculation (20%) - actual will be server-side
    const copayAmount = Math.round(subtotal * 0.2);
    const walletDeduction = Math.min(subtotal - copayAmount, walletBalance);
    const finalPayable = copayAmount;

    return {
      labTotal,
      diagnosticTotal,
      subtotal,
      copayAmount,
      walletDeduction,
      finalPayable,
    };
  };

  const pricing = calculatePricing();

  // Handle payment
  const handleProcessPayment = useCallback(async () => {
    if (!ahcPackage || (!labBooking && !diagnosticBooking)) {
      Alert.alert('Error', 'Booking data not found');
      return;
    }

    setProcessing(true);

    try {
      // apiClient imported at top

      // Format lab collection address to match backend DTO
      const formattedLabAddress = labBooking?.address ? {
        fullName: patientName,
        phone: patientPhone,
        addressLine1: labBooking.address.addressLine1 || labBooking.address.line1 || '',
        addressLine2: labBooking.address.addressLine2 || labBooking.address.line2 || '',
        pincode: labBooking.address.pincode,
        city: labBooking.address.city,
        state: labBooking.address.state || '',
      } : undefined;

      // Prepare service details
      const serviceDetails = {
        packageId: ahcPackage.packageId || ahcPackage.id,
        packageName: ahcPackage.name,
        labVendorId: labBooking?.vendorId,
        labVendorName: labBooking?.vendorName,
        labSlotId: labBooking?.slotId,
        labDate: labBooking?.slotDate,
        labTime: labBooking?.slotTime,
        labCollectionType: labBooking?.collectionType,
        labCollectionAddress: formattedLabAddress,
        diagnosticVendorId: diagnosticBooking?.vendorId,
        diagnosticVendorName: diagnosticBooking?.vendorName,
        diagnosticSlotId: diagnosticBooking?.slotId,
        diagnosticDate: diagnosticBooking?.slotDate,
        diagnosticTime: diagnosticBooking?.slotTime,
      };

      // If fully covered by wallet
      if (pricing.finalPayable === 0) {
        console.log('[AHCPayment] Fully covered by wallet - processing directly...');

        // Map to the expected CreateAhcOrderDto format
        const ahcOrderPayload = {
          packageId: serviceDetails.packageId,
          // Lab portion
          labVendorId: serviceDetails.labVendorId,
          labSlotId: serviceDetails.labSlotId,
          labCollectionType: serviceDetails.labCollectionType,
          labCollectionDate: serviceDetails.labDate,
          labCollectionTime: serviceDetails.labTime,
          labCollectionAddress: serviceDetails.labCollectionAddress,
          // Diagnostic portion
          diagnosticVendorId: serviceDetails.diagnosticVendorId,
          diagnosticSlotId: serviceDetails.diagnosticSlotId,
          diagnosticAppointmentDate: serviceDetails.diagnosticDate,
          diagnosticAppointmentTime: serviceDetails.diagnosticTime,
        };

        // Create order directly
        const bookingResponse = await apiClient.post('/member/ahc/orders', ahcOrderPayload);

        console.log('[AHCPayment] Booking created:', bookingResponse.data);

        // Store completed booking for display on bookings page
        const completedBooking = {
          _id: bookingResponse.data?.data?._id || bookingResponse.data?._id || `ahc-${Date.now()}`,
          orderId: bookingResponse.data?.data?.orderId || bookingResponse.data?.orderId || `AHC-${Date.now()}`,
          packageName: ahcPackage?.name || 'Annual Health Check',
          status: 'PLACED',
          createdAt: new Date().toISOString(),
          labPortion: labBooking ? {
            vendorId: labBooking.vendorId,
            vendorName: labBooking.vendorName,
            collectionDate: labBooking.slotDate,
            timeSlot: labBooking.slotTime,
            collectionType: labBooking.collectionType,
            items: labBooking.pricing || [],
          } : null,
          diagnosticPortion: diagnosticBooking ? {
            vendorId: diagnosticBooking.vendorId,
            vendorName: diagnosticBooking.vendorName,
            collectionDate: diagnosticBooking.slotDate,
            timeSlot: diagnosticBooking.slotTime,
            collectionType: 'CENTER_VISIT',
            items: diagnosticBooking.pricing || [],
          } : null,
          totalAmount: pricing.subtotal,
          walletDeduction: pricing.walletDeduction,
        };

        console.log('[AHCPayment] Storing completed booking:', completedBooking);
        await AsyncStorage.setItem('ahc_completed_booking', JSON.stringify(completedBooking));

        // Clear session storage
        await AsyncStorage.multiRemove(['ahc_package', 'ahc_booking_data', 'ahc_diagnostic_booking']);

        setPaymentSuccess(true);
        return;
      }

      // Create pending payment
      const paymentData = {
        amount: pricing.finalPayable,
        paymentType: 'COPAY',
        serviceType: 'AHC',
        description: `AHC: ${ahcPackage.name}`,
        userId,
        patientId,
        metadata: serviceDetails,
      };

      console.log('[AHCPayment] Creating pending payment:', paymentData);

      const paymentResponse = await apiClient.post('/payments', paymentData);
      const paymentId = paymentResponse.data.paymentId || paymentResponse.data._id;

      console.log('[AHCPayment] Payment created:', paymentId);

      // Store pending booking data
      const pendingBookingData = {
        serviceType: 'AHC',
        serviceDetails,
        patientId,
        patientName,
        userId,
        consultationFee: pricing.subtotal,
        walletCoverage: pricing.walletDeduction,
        copayAmount: pricing.copayAmount,
        paymentId,
      };

      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBookingData));

      // Navigate to payment gateway
      const redirectUrl = '/member/bookings?tab=ahc';
      router.push(`/member/payments/${paymentId}?redirect=${encodeURIComponent(redirectUrl)}` as any);
    } catch (error: any) {
      console.error('[AHCPayment] Error processing payment:', error);
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  }, [ahcPackage, labBooking, diagnosticBooking, userId, patientId, patientName, pricing, router]);

  const handleViewBookings = useCallback(() => {
    router.push('/member/bookings?tab=ahc' as any);
  }, [router]);

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#90EAA9', '#5FA171']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeftIcon width={24} height={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Summary</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5FA171" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </View>
    );
  }

  // ============ SUCCESS STATE ============
  if (paymentSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconContainer}>
              <CheckCircleIcon width={48} height={48} color="#5FA171" />
            </View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSubtitle}>
              Your Annual Health Check has been booked successfully.
            </Text>
            {ahcPackage && (
              <Text style={styles.successPackage}>{ahcPackage.name}</Text>
            )}
            {pricing.walletDeduction > 0 && (
              <Text style={styles.successWallet}>
                ₹{pricing.walletDeduction} deducted from wallet
              </Text>
            )}
            <TouchableOpacity style={styles.viewBookingsButton} onPress={handleViewBookings}>
              <Text style={styles.viewBookingsText}>View Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ============ MAIN RENDER ============
  const isFullyCovered = pricing.finalPayable === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#90EAA9', '#5FA171']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeftIcon width={24} height={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Payment Summary</Text>
          <Text style={styles.headerSubtitle}>Review & Pay</Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Package Info */}
        {ahcPackage && (
          <View style={styles.packageCard}>
            <Text style={styles.packageName}>{ahcPackage.name}</Text>
            <Text style={styles.packageDetails}>
              Annual Health Check Package
            </Text>
          </View>
        )}

        {/* Booking Summaries */}
        {labBooking && (
          <BookingSummaryCard type="lab" booking={labBooking} />
        )}
        {diagnosticBooking && (
          <BookingSummaryCard type="diagnostic" booking={diagnosticBooking} />
        )}

        {/* Payment Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Payment Breakdown</Text>

          {labBooking && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Lab Tests</Text>
              <Text style={styles.breakdownValue}>₹{pricing.labTotal}</Text>
            </View>
          )}

          {diagnosticBooking && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Diagnostic Tests</Text>
              <Text style={styles.breakdownValue}>₹{pricing.diagnosticTotal}</Text>
            </View>
          )}

          <View style={[styles.breakdownRow, styles.subtotalRow]}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>₹{pricing.subtotal}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Wallet Deduction</Text>
            <Text style={[styles.breakdownValue, styles.greenText]}>-₹{pricing.walletDeduction}</Text>
          </View>

          {pricing.copayAmount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Copay (20%)</Text>
              <Text style={[styles.breakdownValue, styles.orangeText]}>₹{pricing.copayAmount}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={[styles.totalValue, isFullyCovered && styles.greenText]}>
              {isFullyCovered ? 'Fully Covered' : `₹${pricing.finalPayable}`}
            </Text>
          </View>
        </View>

        {/* Wallet Balance */}
        <View style={styles.walletCard}>
          <Text style={styles.walletTitle}>Wallet Balance</Text>
          <View style={styles.walletRow}>
            <Text style={styles.walletLabel}>Current Balance</Text>
            <Text style={styles.walletValue}>₹{walletBalance}</Text>
          </View>
          <View style={styles.walletRow}>
            <Text style={styles.walletLabel}>After Payment</Text>
            <Text style={[styles.walletValue, styles.greenText]}>
              ₹{Math.max(0, walletBalance - pricing.walletDeduction)}
            </Text>
          </View>
        </View>

        {/* Important Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <ExclamationTriangleIcon width={18} height={18} color="#F59E0B" />
            <Text style={styles.infoTitle}>Important Information</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• This is a one-time annual health check benefit</Text>
            <Text style={styles.infoItem}>• Once booked, you cannot cancel or modify the booking</Text>
            <Text style={styles.infoItem}>• Please ensure all details are correct before proceeding</Text>
            <Text style={styles.infoItem}>• Lab reports will be shared within 24-48 hours</Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>Total Payable</Text>
          <Text style={[styles.bottomPriceValue, isFullyCovered && styles.greenText]}>
            {isFullyCovered ? 'Fully Covered' : `₹${pricing.finalPayable}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handleProcessPayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.payButtonText}>
              {isFullyCovered ? 'Confirm Booking' : `Pay ₹${pricing.finalPayable}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Package Card
  packageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#5FA171',
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5FA171',
  },
  packageDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5FA171',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryDetails: {
    paddingLeft: 32,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5FA171',
  },

  // Breakdown Card
  breakdownCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtotalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  greenText: {
    color: '#5FA171',
  },
  orangeText: {
    color: '#F59E0B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },

  // Wallet Card
  walletCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
  },
  walletValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  infoList: {
    gap: 4,
  },
  infoItem: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: '#666',
  },
  bottomPriceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  payButton: {
    backgroundColor: '#5FA171',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Success State
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5FA171',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  successPackage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  successWallet: {
    fontSize: 14,
    color: '#5FA171',
    marginBottom: 24,
  },
  viewBookingsButton: {
    backgroundColor: '#5FA171',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  viewBookingsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
