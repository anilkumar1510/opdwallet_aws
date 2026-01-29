import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface PolicyDescriptionEntry {
  headline: string;
  description: string;
}

interface PolicyData {
  policyNumber: string;
  policyName: string;
  corporateName: string;
  validTill: string;
  policyDescription?: {
    inclusions?: PolicyDescriptionEntry[];
    exclusions?: PolicyDescriptionEntry[];
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PolicyDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const policyId = params.policyId as string;

  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch policy details from API
  const fetchPolicyDetails = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      console.log('[PolicyDetails] Fetching policy details for policyId:', policyId);

      // API endpoint: /policies/{policyId}/current
      const response = await apiClient.get<PolicyData>(`/policies/${policyId}/current`);

      console.log('[PolicyDetails] Policy details loaded:', {
        policyNumber: response.data.policyNumber,
        corporateName: response.data.corporateName,
        hasInclusions: !!response.data.policyDescription?.inclusions?.length,
        hasExclusions: !!response.data.policyDescription?.exclusions?.length,
      });

      setPolicy(response.data);
    } catch (err: any) {
      console.error('[PolicyDetails] Error fetching policy details:', err);

      // Handle specific error cases
      if (err.response?.status === 404) {
        setError('Policy not found. It may have been removed or you may not have access.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this policy.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load policy details');
      }
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [policyId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchPolicyDetails();
  }, [fetchPolicyDetails]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPolicyDetails(true);
  }, [fetchPolicyDetails]);

  // Retry handler for error state
  const handleRetry = useCallback(() => {
    fetchPolicyDetails();
  }, [fetchPolicyDetails]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0F5FDC" />
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !policy) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 32 }}>
          <View style={{ maxWidth: 672, marginHorizontal: 'auto', width: '100%' }}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 32,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#FEE2E2',
                  borderRadius: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <XCircleIcon width={32} height={32} color="#DC2626" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#303030', marginBottom: 8, textAlign: 'center' }}>
                Unable to Load Policy Details
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center', paddingHorizontal: 16 }}>
                {error || 'Policy information not available'}
              </Text>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={handleRetry}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    backgroundColor: '#0F5FDC',
                    borderRadius: 12,
                    shadowColor: '#0F5FDC',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                    Retry
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
                    Go Back
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // SUCCESS STATE - DATA DISPLAY
  // ============================================================================

  const hasInclusions = policy.policyDescription?.inclusions && policy.policyDescription.inclusions.length > 0;
  const hasExclusions = policy.policyDescription?.exclusions && policy.policyDescription.exclusions.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
      {/* ===== HEADER (STICKY) ===== */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
          ...Platform.select({
            web: {
              position: 'sticky',
              top: 0,
              zIndex: 10,
            },
          }),
        }}
      >
        <SafeAreaView edges={['top']}>
          <View
            style={{
              maxWidth: 480,
              marginHorizontal: 'auto',
              width: '100%',
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  padding: 8,
                  borderRadius: 12,
                }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={24} height={24} color="#0E51A2" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2', marginBottom: 2 }}>
                  Policy Details
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {policy.policyName || 'Policy Information'}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ===== MAIN CONTENT ===== */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
          paddingBottom: 96,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0F5FDC"
            colors={['#0F5FDC']}
          />
        }
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 20 }}>
          {/* ===== POLICY SUMMARY CARD ===== */}
          <LinearGradient
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 24,
              borderWidth: 2,
              borderColor: '#86ACD8',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Header with Icon */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <ShieldCheckIcon width={24} height={24} color="#0E51A2" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                Policy Summary
              </Text>
            </View>

            {/* Policy Details - 3 Rows */}
            <View style={{ gap: 16 }}>
              {/* Policy Number */}
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <DocumentTextIcon width={20} height={20} color="#0F5FDC" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    Policy Number
                  </Text>
                  <Text
                    style={{ fontSize: 14, fontWeight: '700', color: '#0E51A2' }}
                    numberOfLines={1}
                  >
                    {policy.policyNumber}
                  </Text>
                </View>
              </View>

              {/* Corporate Name */}
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <BuildingOfficeIcon width={20} height={20} color="#0F5FDC" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    Corporate Name
                  </Text>
                  <Text
                    style={{ fontSize: 14, fontWeight: '700', color: '#0E51A2' }}
                    numberOfLines={1}
                  >
                    {policy.corporateName || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Valid Till */}
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <CalendarIcon width={20} height={20} color="#0F5FDC" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    Valid Till
                  </Text>
                  <Text
                    style={{ fontSize: 14, fontWeight: '700', color: '#0E51A2' }}
                    numberOfLines={1}
                  >
                    {policy.validTill}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* ===== INCLUSIONS SECTION ===== */}
          {hasInclusions && (
            <LinearGradient
              colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: '#86ACD8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {/* Section Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <CheckCircleIcon width={24} height={24} color="#16a34a" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  What's Covered
                </Text>
              </View>

              {/* Inclusion Items */}
              <View style={{ gap: 16 }}>
                {policy.policyDescription!.inclusions!.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: 12,
                      padding: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0E51A2', marginBottom: 8 }}>
                      {item.headline}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
                      {item.description}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          )}

          {/* ===== EXCLUSIONS SECTION ===== */}
          {hasExclusions && (
            <LinearGradient
              colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: '#86ACD8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {/* Section Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <XCircleIcon width={24} height={24} color="#ef4444" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  What's Not Covered
                </Text>
              </View>

              {/* Exclusion Items */}
              <View style={{ gap: 16 }}>
                {policy.policyDescription!.exclusions!.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: 12,
                      padding: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0E51A2', marginBottom: 8 }}>
                      {item.headline}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
                      {item.description}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          )}

          {/* ===== NO DESCRIPTION AVAILABLE ===== */}
          {!hasInclusions && !hasExclusions && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 32,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
                borderWidth: 2,
                borderColor: '#E5E7EB',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <DocumentTextIcon width={32} height={32} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#303030', marginBottom: 8, textAlign: 'center' }}>
                Policy Description Not Available
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 }}>
                Detailed policy inclusions and exclusions have not been configured yet. Please contact your administrator for more information.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
