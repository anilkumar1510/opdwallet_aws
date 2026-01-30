import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  HomeIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  PlusIcon,
  BeakerIcon,
} from '../../../../src/components/icons/InlineSVGs';
import apiClient from '../../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface AHCPackage {
  id: string;
  name: string;
  description?: string;
  tests?: Array<{ name: string }>;
  totalTests?: number;
  totalLabTests?: number;
  totalDiagnosticTests?: number;
}

interface Address {
  _id: string;
  addressId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

interface Vendor {
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

export default function AHCBookingPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Add Address Modal state
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressType: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false,
  });

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [collectionType, setCollectionType] = useState<'HOME_COLLECTION' | 'CENTER_VISIT'>('CENTER_VISIT');

  // Slot selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step tracking
  const [step, setStep] = useState(1); // 1: Vendor, 2: Slot, 3: Summary

  // Get selected address
  const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
  const pincode = selectedAddress?.pincode || '';

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
    fetchAddresses();
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
      const packageData = await AsyncStorage.getItem('ahc_package');
      console.log('[AHCBooking] Package from AsyncStorage:', packageData);
      if (packageData) {
        setAhcPackage(JSON.parse(packageData));
      }
    } catch (err: any) {
      console.error('[AHCBooking] Error loading data:', err);
      setError(err.message || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await apiClient.get('/member/addresses');
      console.log('[AHCBooking] Addresses response:', response.data);

      if (response.data?.success && Array.isArray(response.data.data)) {
        setAddresses(response.data.data);

        // Auto-select default address
        const defaultAddress = response.data.data.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          await fetchVendors(defaultAddress.pincode);
        }
      }
    } catch (error) {
      console.error('[AHCBooking] Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchVendors = async (userPincode: string) => {
    try {
      console.log('[AHCBooking] Fetching vendors for pincode:', userPincode);
      const response = await apiClient.get(`/member/ahc/vendors/lab?pincode=${userPincode}`);
      console.log('[AHCBooking] Vendors API response:', response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        setVendors(response.data.data);
        console.log('[AHCBooking] Found vendors:', response.data.data.length);
      } else if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        setVendors(response.data.vendors);
      } else if (Array.isArray(response.data)) {
        setVendors(response.data);
      } else {
        console.log('[AHCBooking] No vendors in response');
        setVendors([]);
      }
    } catch (err: any) {
      console.error('[AHCBooking] Error fetching vendors:', err);
      setVendors([]);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedVendor || !selectedDate || !pincode) return;

    setLoadingSlots(true);
    try {
      console.log('[AHCBooking] Fetching slots for vendor:', selectedVendor.vendorId, 'date:', selectedDate);
      const response = await apiClient.get(
        `/member/lab/vendors/${selectedVendor.vendorId}/slots?pincode=${pincode}&date=${selectedDate}`
      );
      console.log('[AHCBooking] Slots API response:', response.data);
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('[AHCBooking] Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddAddress = async () => {
    if (!newAddress.addressLine1.trim()) {
      Alert.alert('Missing Field', 'Please enter address line 1');
      return;
    }
    if (!newAddress.city.trim()) {
      Alert.alert('Missing Field', 'Please enter city');
      return;
    }
    if (!newAddress.state.trim()) {
      Alert.alert('Missing Field', 'Please enter state');
      return;
    }
    if (!newAddress.pincode.trim() || newAddress.pincode.length !== 6) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode');
      return;
    }

    setAddingAddress(true);

    try {
      const response = await apiClient.post('/member/addresses', {
        addressType: newAddress.addressType,
        addressLine1: newAddress.addressLine1.trim(),
        addressLine2: newAddress.addressLine2.trim() || undefined,
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        pincode: newAddress.pincode.trim(),
        landmark: newAddress.landmark.trim() || undefined,
        isDefault: newAddress.isDefault,
      });

      if (response.data?.success) {
        setNewAddress({
          addressType: 'HOME',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          landmark: '',
          isDefault: false,
        });

        setShowAddAddressModal(false);
        await fetchAddresses();

        if (response.data.data?._id) {
          setSelectedAddressId(response.data.data._id);
          await fetchVendors(response.data.data.pincode);
        }

        Alert.alert('Success', 'Address added successfully');
      }
    } catch (error: any) {
      console.error('[AHCBooking] Error adding address:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
    setSelectedAddressId(address._id);
    setShowAddressDropdown(false);
    setSelectedVendor(null);
    setSelectedSlot(null);
    setStep(1);
    await fetchVendors(address.pincode);
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSelectedSlot(null);
    // Set default collection type based on vendor options
    if (vendor.centerVisit) {
      setCollectionType('CENTER_VISIT');
    } else if (vendor.homeCollection) {
      setCollectionType('HOME_COLLECTION');
    }
    setStep(2);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const getTotalAmount = () => {
    if (!selectedVendor) return 0;
    const basePrice = selectedVendor.totalDiscountedPrice;
    const homeCollectionCharge =
      collectionType === 'HOME_COLLECTION' ? (selectedVendor.homeCollectionCharges || 0) : 0;
    return basePrice + homeCollectionCharge;
  };

  const handleContinue = async () => {
    if (!selectedVendor || !selectedSlot || !selectedAddress) {
      return;
    }

    const bookingData = {
      packageId: ahcPackage?.id,
      vendorId: selectedVendor.vendorId,
      vendorName: selectedVendor.name,
      collectionType,
      slotDate: selectedDate,
      slotTime: selectedSlot.timeSlot,
      slotId: selectedSlot.slotId,
      price: getTotalAmount(),
      pricing: selectedVendor.pricing,
      totalActualPrice: selectedVendor.totalActualPrice,
      totalDiscountedPrice: selectedVendor.totalDiscountedPrice,
      homeCollectionCharges: collectionType === 'HOME_COLLECTION' ? selectedVendor.homeCollectionCharges : 0,
      // Store address in backend DTO format (fullName and phone will be added in payment page)
      address: {
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2 || '',
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city,
        state: selectedAddress.state || '',
        pincode: selectedAddress.pincode,
      },
    };

    await AsyncStorage.setItem('ahc_booking_data', JSON.stringify(bookingData));

    // Navigate to diagnostic booking or payment
    if (ahcPackage?.totalDiagnosticTests && ahcPackage.totalDiagnosticTests > 0) {
      router.push('/member/ahc/booking/diagnostic');
    } else {
      router.push('/member/ahc/booking/payment');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    if (pincode) {
      await fetchVendors(pincode);
    }
    setRefreshing(false);
  }, [pincode]);

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
          <Text style={styles.headerTitle}>Book Lab Tests</Text>
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
          <Text style={styles.headerTitle}>Book Lab Tests</Text>
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
          <Text style={styles.headerTitle}>Book Lab Tests</Text>
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
            <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Vendor</Text>
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
        {/* Address Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Address</Text>

          {loadingAddresses ? (
            <View style={styles.addressLoadingContainer}>
              <ActivityIndicator size="small" color="#5FA171" />
              <Text style={styles.loadingText}>Loading addresses...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowAddressDropdown(!showAddressDropdown)}
                style={styles.addressDropdown}
              >
                <View style={styles.addressDropdownContent}>
                  <MapPinIcon width={20} height={20} color="#5FA171" />
                  <Text style={[styles.addressDropdownText, !selectedAddress && styles.addressPlaceholder]} numberOfLines={1}>
                    {selectedAddress
                      ? `${selectedAddress.addressLine1}, ${selectedAddress.city} - ${selectedAddress.pincode}`
                      : 'Select an address'}
                  </Text>
                </View>
                <ChevronDownIcon width={20} height={20} color="#666" />
              </TouchableOpacity>

              {showAddressDropdown && (
                <View style={styles.addressDropdownOptions}>
                  {addresses.length === 0 ? (
                    <View style={styles.noAddressContainer}>
                      <Text style={styles.noAddressText}>No addresses found</Text>
                    </View>
                  ) : (
                    addresses.map((address) => (
                      <TouchableOpacity
                        key={address._id}
                        onPress={() => handleAddressSelect(address)}
                        style={[
                          styles.addressOption,
                          selectedAddressId === address._id && styles.addressOptionSelected,
                        ]}
                      >
                        <Text style={styles.addressOptionText}>
                          {address.addressLine1}, {address.city} - {address.pincode}
                          {address.isDefault && ' (Default)'}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setShowAddAddressModal(true)}
                style={styles.addAddressButton}
              >
                <PlusIcon width={18} height={18} color="#5FA171" />
                <Text style={styles.addAddressText}>Add New Address</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* STEP 1: Vendor Selection */}
        {step === 1 && selectedAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Lab Vendor ({vendors.length})</Text>

            {vendors.length === 0 ? (
              <View style={styles.noVendorsCard}>
                <Text style={styles.noVendorsText}>No vendors available in your area for pincode {pincode}</Text>
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

                  {/* Collection Options */}
                  <View style={styles.collectionOptionsRow}>
                    {vendor.homeCollection && (
                      <View style={styles.collectionBadge}>
                        <HomeIcon width={14} height={14} color="#5FA171" />
                        <Text style={styles.collectionBadgeText}>Home Collection</Text>
                        {vendor.homeCollectionCharges > 0 && (
                          <Text style={styles.collectionChargeText}>(+₹{vendor.homeCollectionCharges})</Text>
                        )}
                      </View>
                    )}
                    {vendor.centerVisit && (
                      <View style={styles.collectionBadge}>
                        <BuildingOfficeIcon width={14} height={14} color="#5FA171" />
                        <Text style={styles.collectionBadgeText}>Center Visit</Text>
                      </View>
                    )}
                  </View>

                  {/* Select Button */}
                  <TouchableOpacity
                    onPress={() => handleVendorSelect(vendor)}
                    style={styles.selectVendorButton}
                  >
                    <Text style={styles.selectVendorButtonText}>Select This Vendor</Text>
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
              <Text style={styles.backLinkText}>← Change Vendor</Text>
            </TouchableOpacity>

            <View style={styles.slotSelectionCard}>
              <Text style={styles.selectedVendorTitle}>Selected: {selectedVendor.name}</Text>

              {/* Collection Type */}
              <View style={styles.collectionTypeSection}>
                <Text style={styles.collectionTypeTitle}>Collection Type</Text>
                <View style={styles.collectionTypeRow}>
                  {selectedVendor.centerVisit && (
                    <TouchableOpacity
                      onPress={() => setCollectionType('CENTER_VISIT')}
                      style={[
                        styles.collectionTypeCard,
                        collectionType === 'CENTER_VISIT' && styles.collectionTypeCardSelected,
                      ]}
                    >
                      <BuildingOfficeIcon width={28} height={28} color="#5FA171" />
                      <Text style={styles.collectionTypeCardTitle}>Lab Visit</Text>
                      <Text style={styles.collectionTypeCardDesc}>Visit lab for sample</Text>
                    </TouchableOpacity>
                  )}
                  {selectedVendor.homeCollection && (
                    <TouchableOpacity
                      onPress={() => setCollectionType('HOME_COLLECTION')}
                      style={[
                        styles.collectionTypeCard,
                        collectionType === 'HOME_COLLECTION' && styles.collectionTypeCardSelected,
                      ]}
                    >
                      <HomeIcon width={28} height={28} color="#5FA171" />
                      <Text style={styles.collectionTypeCardTitle}>Home Collection</Text>
                      <Text style={styles.collectionTypeCardDesc}>
                        +₹{selectedVendor.homeCollectionCharges || 0}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

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
              <Text style={styles.summaryTitle}>Booking Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vendor:</Text>
                <Text style={styles.summaryValue}>{selectedVendor.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Collection Type:</Text>
                <Text style={styles.summaryValue}>
                  {collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit'}
                </Text>
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
                <Text style={styles.summaryLabel}>Test Amount:</Text>
                <Text style={styles.summaryValue}>₹{selectedVendor.totalDiscountedPrice}</Text>
              </View>

              {collectionType === 'HOME_COLLECTION' && selectedVendor.homeCollectionCharges > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Home Collection:</Text>
                  <Text style={styles.summaryValue}>₹{selectedVendor.homeCollectionCharges}</Text>
                </View>
              )}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
                <Text style={styles.summaryTotalValue}>₹{getTotalAmount()}</Text>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
              <Text style={styles.continueButtonText}>
                {ahcPackage?.totalDiagnosticTests && ahcPackage.totalDiagnosticTests > 0
                  ? 'Continue to Diagnostic Booking'
                  : 'Proceed to Payment'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={showAddAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddAddressModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity
                onPress={() => setShowAddAddressModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Address Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Type</Text>
                <View style={styles.addressTypeContainer}>
                  {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setNewAddress(prev => ({ ...prev, addressType: type }))}
                      style={[
                        styles.addressTypeButton,
                        newAddress.addressType === type && styles.addressTypeButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.addressTypeButtonText,
                          newAddress.addressType === type && styles.addressTypeButtonTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Address Line 1 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Address Line 1 <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  value={newAddress.addressLine1}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, addressLine1: text }))}
                  placeholder="House/Flat no., Building name"
                  placeholderTextColor="#999"
                  style={styles.formInput}
                  editable={!addingAddress}
                />
              </View>

              {/* Address Line 2 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Line 2 (Optional)</Text>
                <TextInput
                  value={newAddress.addressLine2}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, addressLine2: text }))}
                  placeholder="Street, Area"
                  placeholderTextColor="#999"
                  style={styles.formInput}
                  editable={!addingAddress}
                />
              </View>

              {/* City and State */}
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>
                    City <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    value={newAddress.city}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, city: text }))}
                    placeholder="City"
                    placeholderTextColor="#999"
                    style={styles.formInput}
                    editable={!addingAddress}
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>
                    State <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    value={newAddress.state}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, state: text }))}
                    placeholder="State"
                    placeholderTextColor="#999"
                    style={styles.formInput}
                    editable={!addingAddress}
                  />
                </View>
              </View>

              {/* Pincode and Landmark */}
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>
                    Pincode <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    value={newAddress.pincode}
                    onChangeText={(text) => {
                      const numericText = text.replace(/\D/g, '').slice(0, 6);
                      setNewAddress(prev => ({ ...prev, pincode: numericText }));
                    }}
                    placeholder="6-digit pincode"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={6}
                    style={styles.formInput}
                    editable={!addingAddress}
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Landmark (Optional)</Text>
                  <TextInput
                    value={newAddress.landmark}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, landmark: text }))}
                    placeholder="Nearby landmark"
                    placeholderTextColor="#999"
                    style={styles.formInput}
                    editable={!addingAddress}
                  />
                </View>
              </View>

              {/* Set as Default */}
              <TouchableOpacity
                onPress={() => setNewAddress(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                style={styles.defaultCheckbox}
                disabled={addingAddress}
              >
                <View
                  style={[
                    styles.checkbox,
                    newAddress.isDefault && styles.checkboxChecked,
                  ]}
                >
                  {newAddress.isDefault && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Set as default address</Text>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAddAddress}
                disabled={addingAddress}
                style={[styles.submitButton, addingAddress && styles.submitButtonDisabled]}
              >
                {addingAddress ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Address</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  // Address styles
  addressLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  addressDropdown: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#5FA171',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  addressDropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  addressPlaceholder: {
    color: '#999',
  },
  addressDropdownOptions: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 3,
  },
  noAddressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noAddressText: {
    fontSize: 14,
    color: '#999',
  },
  addressOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addressOptionSelected: {
    backgroundColor: '#E8F5E9',
  },
  addressOptionText: {
    fontSize: 14,
    color: '#333',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5FA171',
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
  collectionOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  collectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  collectionBadgeText: {
    fontSize: 12,
    color: '#5FA171',
  },
  collectionChargeText: {
    fontSize: 11,
    color: '#666',
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
  collectionTypeSection: {
    marginBottom: 20,
  },
  collectionTypeTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  collectionTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  collectionTypeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  collectionTypeCardSelected: {
    borderColor: '#5FA171',
    backgroundColor: '#E8F5E9',
  },
  collectionTypeCardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  collectionTypeCardDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#666',
    lineHeight: 28,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formGroup: {
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#DC2626',
  },
  formInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addressTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  addressTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  addressTypeButtonSelected: {
    borderColor: '#5FA171',
    backgroundColor: '#E8F5E9',
  },
  addressTypeButtonText: {
    fontSize: 13,
    color: '#666',
  },
  addressTypeButtonTextSelected: {
    color: '#5FA171',
    fontWeight: '500',
  },
  defaultCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#5FA171',
    backgroundColor: '#5FA171',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#5FA171',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
