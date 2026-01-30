import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
} from '../../../../src/components/icons/InlineSVGs';
import apiClient from '../../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface AHCPackage {
  id: string;
  name: string;
  totalLabTests?: number;
  totalDiagnosticTests?: number;
}

interface LabBooking {
  packageId?: string;
  vendorId: string;
  vendorName: string;
  collectionType: string;
  slotDate: string;
  slotTime: string;
  slotId: string;
  price: number;
  pricing?: any[];
  totalActualPrice?: number;
  totalDiscountedPrice: number;
  homeCollectionCharges: number;
  address?: {
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    pincode: string;
  };
}

interface DiagnosticVendor {
  _id: string;
  vendorId: string;
  name: string;
  code: string;
  homeCollection: boolean;
  centerVisit: boolean;
  homeCollectionCharges: number;
  totalActualPrice: number;
  totalDiscountedPrice: number;
  totalWithHomeCollection: number;
  pricing: Array<{
    serviceId: string;
    serviceName: string;
    serviceCode: string;
    actualPrice: number;
    discountedPrice: number;
  }>;
}

interface TimeSlot {
  slotId: string;
  date: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  currentBookings: number;
  isActive: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AHCDiagnosticBookingPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null);
  const [labBooking, setLabBooking] = useState<LabBooking | null>(null);
  const [vendors, setVendors] = useState<DiagnosticVendor[]>([]);
  const [pincode, setPincode] = useState('');

  const [selectedVendor, setSelectedVendor] = useState<DiagnosticVendor | null>(null);

  // Slot selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step tracking
  const [step, setStep] = useState(1); // 1: Vendor, 2: Slot, 3: Summary

  // Generate next 7 days for date selection
  const getDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: date.getDate(),
      });
    }
    return dates;
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadInitialData();
    // Set today's date as default
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedVendor && selectedDate && pincode) {
      fetchAvailableSlots();
    }
  }, [selectedVendor, selectedDate, pincode]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get AHC package
      const packageData = await AsyncStorage.getItem('ahc_package');
      console.log('[AHCDiagnostic] Package from AsyncStorage:', packageData);
      if (packageData) {
        setAhcPackage(JSON.parse(packageData));
      } else {
        setError('Package information not found');
        setLoading(false);
        return;
      }

      // Get lab booking data (should exist from previous step)
      const labData = await AsyncStorage.getItem('ahc_booking_data');
      let userPincode = '';

      if (labData) {
        const labBookingData = JSON.parse(labData);
        setLabBooking(labBookingData);
        console.log('[AHCDiagnostic] Lab booking data:', labBookingData);

        // Get pincode from lab booking address
        if (labBookingData.address?.pincode) {
          userPincode = labBookingData.address.pincode;
          console.log('[AHCDiagnostic] Pincode from lab booking address:', userPincode);
        }
      }

      // If no pincode from lab booking, fetch from user profile
      if (!userPincode) {
        console.log('[AHCDiagnostic] Fetching user profile for pincode...');
        const userResponse = await apiClient.get('/auth/me');
        const userData = userResponse.data;

        if (userData.address?.pincode) {
          userPincode = userData.address.pincode;
        } else if (userData.pincode) {
          userPincode = userData.pincode;
        }
      }

      if (!userPincode) {
        setError('No pincode found. Please go back and select an address.');
        setLoading(false);
        return;
      }

      setPincode(userPincode);
      await fetchVendors(userPincode);
    } catch (err: any) {
      console.error('[AHCDiagnostic] Error loading data:', err);
      setError(err.message || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async (userPincode: string) => {
    try {
      console.log('[AHCDiagnostic] Fetching vendors for pincode:', userPincode);
      const response = await apiClient.get(`/member/ahc/vendors/diagnostic?pincode=${userPincode}`);
      console.log('[AHCDiagnostic] Vendors API response:', response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        setVendors(response.data.data);
      } else if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        setVendors(response.data.vendors);
      } else if (Array.isArray(response.data)) {
        setVendors(response.data);
      } else {
        console.log('[AHCDiagnostic] No vendors in response');
        setVendors([]);
      }
    } catch (err: any) {
      console.error('[AHCDiagnostic] Error fetching vendors:', err);
      setVendors([]);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedVendor || !selectedDate || !pincode) return;

    setLoadingSlots(true);
    try {
      console.log('[AHCDiagnostic] Fetching slots for vendor:', selectedVendor.vendorId, 'date:', selectedDate);
      const response = await apiClient.get(
        `/member/diagnostics/vendors/${selectedVendor.vendorId}/slots?pincode=${pincode}&date=${selectedDate}`
      );
      console.log('[AHCDiagnostic] Slots API response:', response.data);
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('[AHCDiagnostic] Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleVendorSelect = (vendor: DiagnosticVendor) => {
    setSelectedVendor(vendor);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleContinue = async () => {
    if (!selectedVendor || !selectedSlot) {
      return;
    }

    const diagnosticBookingData = {
      vendorId: selectedVendor.vendorId,
      vendorName: selectedVendor.name,
      collectionType: 'CENTER_VISIT', // Diagnostics always center visit
      slotDate: selectedDate,
      slotTime: selectedSlot.timeSlot,
      slotId: selectedSlot.slotId,
      price: selectedVendor.totalDiscountedPrice, // For payment page compatibility
      pricing: selectedVendor.pricing,
      totalActualPrice: selectedVendor.totalActualPrice,
      totalDiscountedPrice: selectedVendor.totalDiscountedPrice,
      homeCollectionCharges: 0,
    };

    console.log('[AHCDiagnostic] Storing diagnostic booking data:', diagnosticBookingData);
    await AsyncStorage.setItem('ahc_diagnostic_booking', JSON.stringify(diagnosticBookingData));

    router.push('/member/ahc/booking/payment');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const dateOptions = getDateOptions();

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#90EAA9', '#5FA171']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeftIcon width={24} height={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Diagnostic Tests</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5FA171" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#90EAA9', '#5FA171']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeftIcon width={24} height={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Diagnostic Tests</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#90EAA9', '#5FA171']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeftIcon width={24} height={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Book Diagnostic Tests</Text>
          {ahcPackage && (
            <Text style={styles.headerSubtitle}>{ahcPackage.name}</Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
            </View>
            <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Center</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>
            </View>
            <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Slot</Text>
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, step >= 3 && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, step >= 3 && styles.stepNumberActive]}>3</Text>
            </View>
            <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Confirm</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5FA171']} />
        }
      >
        {/* Lab Booking Summary */}
        {labBooking && (
          <View style={styles.labBookingCard}>
            <View style={styles.labBookingHeader}>
              <View style={styles.checkCircle}>
                <CheckCircleIcon width={16} height={16} color="#FFF" />
              </View>
              <Text style={styles.labBookingTitle}>Lab Tests Booked</Text>
            </View>
            <Text style={styles.labBookingDetails}>
              {labBooking.vendorName} • {formatDate(labBooking.slotDate)} • {labBooking.slotTime}
            </Text>
            <Text style={styles.labBookingType}>
              {labBooking.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit'}
            </Text>
          </View>
        )}

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            <Text style={styles.infoNoteBold}>Note: </Text>
            Diagnostic tests require a center visit. Home collection is not available.
          </Text>
        </View>

        {/* STEP 1: Vendor Selection */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Diagnostic Center ({vendors.length})</Text>

            {vendors.length === 0 ? (
              <View style={styles.noVendorsCard}>
                <Text style={styles.noVendorsText}>No diagnostic centers available in your area for pincode {pincode}</Text>
              </View>
            ) : (
              vendors.map((vendor) => (
                <View key={vendor._id} style={styles.vendorCard}>
                  {/* Vendor Header */}
                  <View style={styles.vendorHeader}>
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>{vendor.name}</Text>
                      <View style={styles.vendorCodeBadge}>
                        <Text style={styles.vendorCodeText}>{vendor.code}</Text>
                      </View>
                    </View>
                    <View style={styles.vendorPriceContainer}>
                      <Text style={styles.vendorPrice}>₹{vendor.totalDiscountedPrice}</Text>
                      {vendor.totalActualPrice > vendor.totalDiscountedPrice && (
                        <Text style={styles.vendorMrp}>₹{vendor.totalActualPrice}</Text>
                      )}
                    </View>
                  </View>

                  {/* Test Pricing Breakdown */}
                  {vendor.pricing && vendor.pricing.length > 0 && (
                    <View style={styles.pricingSection}>
                      <Text style={styles.pricingTitle}>Test Pricing:</Text>
                      {vendor.pricing.map((item, idx) => (
                        <View key={idx} style={styles.pricingRow}>
                          <Text style={styles.pricingServiceName}>{item.serviceName}</Text>
                          <Text style={styles.pricingServicePrice}>₹{item.discountedPrice}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Center Visit Badge */}
                  <View style={styles.centerVisitBadge}>
                    <BuildingOfficeIcon width={14} height={14} color="#5FA171" />
                    <Text style={styles.centerVisitText}>Center Visit Only</Text>
                  </View>

                  {/* Select Button */}
                  <TouchableOpacity
                    onPress={() => handleVendorSelect(vendor)}
                    style={styles.selectVendorButton}
                  >
                    <Text style={styles.selectVendorButtonText}>Select This Center</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* STEP 2: Slot Selection */}
        {step === 2 && selectedVendor && (
          <View style={styles.section}>
            {/* Back to Vendor */}
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Change Center</Text>
            </TouchableOpacity>

            <View style={styles.slotSelectionCard}>
              <Text style={styles.selectedVendorTitle}>Selected: {selectedVendor.name}</Text>

              {/* Date Selection */}
              <View style={styles.dateSection}>
                <Text style={styles.dateSectionTitle}>Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dateRow}>
                    {dateOptions.map((date) => (
                      <TouchableOpacity
                        key={date.value}
                        onPress={() => {
                          setSelectedDate(date.value);
                          setSelectedSlot(null);
                        }}
                        style={[
                          styles.dateCard,
                          selectedDate === date.value && styles.dateCardSelected,
                        ]}
                      >
                        <Text style={[styles.dateDay, selectedDate === date.value && styles.dateDaySelected]}>
                          {date.day}
                        </Text>
                        <Text style={[styles.dateNum, selectedDate === date.value && styles.dateNumSelected]}>
                          {date.dateNum}
                        </Text>
                        {date.label === 'Today' && (
                          <Text style={styles.todayLabel}>Today</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Time Slots */}
              <View style={styles.slotsSection}>
                <Text style={styles.slotsSectionTitle}>Select Time Slot</Text>
                {loadingSlots ? (
                  <View style={styles.slotsLoading}>
                    <ActivityIndicator size="small" color="#5FA171" />
                    <Text style={styles.loadingText}>Loading slots...</Text>
                  </View>
                ) : availableSlots.length === 0 ? (
                  <View style={styles.noSlotsContainer}>
                    <Text style={styles.noSlotsText}>No slots available for this date</Text>
                  </View>
                ) : (
                  <View style={styles.slotsGrid}>
                    {availableSlots.map((slot) => {
                      const isAvailable = slot.currentBookings < slot.maxBookings;
                      const slotsRemaining = slot.maxBookings - slot.currentBookings;
                      const isSelected = selectedSlot?.slotId === slot.slotId;

                      return (
                        <TouchableOpacity
                          key={slot.slotId}
                          onPress={() => isAvailable && handleSlotSelect(slot)}
                          disabled={!isAvailable}
                          style={[
                            styles.slotCard,
                            !isAvailable && styles.slotCardDisabled,
                            isSelected && styles.slotCardSelected,
                          ]}
                        >
                          <View style={styles.slotTimeRow}>
                            <ClockIcon width={16} height={16} color={isSelected ? '#FFF' : '#5FA171'} />
                            <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                              {slot.timeSlot}
                            </Text>
                          </View>
                          <Text style={[
                            styles.slotAvailability,
                            !isAvailable && styles.slotAvailabilityFull,
                            isSelected && styles.slotAvailabilitySelected,
                          ]}>
                            {isAvailable ? `${slotsRemaining} slots available` : 'Fully booked'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: Booking Summary */}
        {step === 3 && selectedVendor && selectedSlot && (
          <View style={styles.section}>
            {/* Back to Slot */}
            <TouchableOpacity onPress={() => setStep(2)} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Change Slot</Text>
            </TouchableOpacity>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Diagnostic Booking Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Center:</Text>
                <Text style={styles.summaryValue}>{selectedVendor.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Visit Type:</Text>
                <Text style={styles.summaryValue}>Center Visit</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{selectedSlot.timeSlot}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
                <Text style={styles.summaryTotalValue}>₹{selectedVendor.totalDiscountedPrice}</Text>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

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
  progressContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
    marginHorizontal: 'auto',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#5FA171',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#5FA171',
  },
  stepLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: '#5FA171',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5FA171',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Lab booking card
  labBookingCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#5FA171',
  },
  labBookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5FA171',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labBookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5FA171',
  },
  labBookingDetails: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  labBookingType: {
    fontSize: 12,
    color: '#666',
  },
  // Info note
  infoNote: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F7DCAF',
  },
  infoNoteText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  infoNoteBold: {
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  // Vendor styles
  noVendorsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noVendorsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  vendorCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vendorCodeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  vendorCodeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5FA171',
  },
  vendorPriceContainer: {
    alignItems: 'flex-end',
  },
  vendorPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5FA171',
  },
  vendorMrp: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  pricingSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginBottom: 12,
  },
  pricingTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pricingServiceName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  pricingServicePrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  centerVisitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  centerVisitText: {
    fontSize: 12,
    color: '#5FA171',
  },
  selectVendorButton: {
    backgroundColor: '#5FA171',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectVendorButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Back link
  backLink: {
    marginBottom: 12,
  },
  backLinkText: {
    fontSize: 13,
    color: '#5FA171',
  },
  // Slot selection
  slotSelectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedVendorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateCard: {
    width: 70,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  dateCardSelected: {
    borderColor: '#5FA171',
    backgroundColor: '#E8F5E9',
  },
  dateDay: {
    fontSize: 11,
    color: '#666',
  },
  dateDaySelected: {
    color: '#5FA171',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginVertical: 2,
  },
  dateNumSelected: {
    color: '#5FA171',
  },
  todayLabel: {
    fontSize: 10,
    color: '#5FA171',
    fontWeight: '500',
  },
  slotsSection: {},
  slotsSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  noSlotsContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#999',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  slotCardDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  slotCardSelected: {
    borderColor: '#5FA171',
    backgroundColor: '#5FA171',
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  slotTimeSelected: {
    color: '#FFF',
  },
  slotAvailability: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  slotAvailabilityFull: {
    color: '#EF4444',
  },
  slotAvailabilitySelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  // Summary
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5FA171',
  },
  continueButton: {
    backgroundColor: '#5FA171',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
