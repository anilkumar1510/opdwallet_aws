import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// COLORS - Matching Home Page
// ============================================================================
const COLORS = {
  primary: '#034DA2',
  orange: '#F5821E',
  textDark: '#303030',
  textGray: '#545454',
  textLight: '#6b7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  success: '#16a34a',
  error: '#ef4444',
};

// ============================================================================
// SVG ICONS
// ============================================================================

// Back Arrow Icon
function BackArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={COLORS.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Chevron Down Icon
function ChevronDownIcon({ size = 20, color = COLORS.textGray }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Chevron Up Icon
function ChevronUpIcon({ size = 20, color = COLORS.textGray }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15l-6-6-6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Shield Check Icon
function ShieldCheckIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Document Icon
function DocumentTextIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 13H8M16 17H8M10 9H8"
        stroke={COLORS.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Building Office Icon
function BuildingOfficeIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Calendar Icon
function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="15" r="2" fill={COLORS.orange} />
    </Svg>
  );
}

// Check Circle Icon - Blue with orange accent (matching home page style)
function CheckCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// X Circle Icon - Blue with orange accent (matching home page style)
function XCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'overview' | 'coverage' | 'exclusions';

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
// ACCORDION ITEM COMPONENT
// ============================================================================

interface AccordionItemProps {
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  type: 'inclusion' | 'exclusion';
}

function AccordionItem({ title, description, isExpanded, onToggle, type }: AccordionItemProps) {
  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 14,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.textDark,
            flex: 1,
          }}
        >
          {title}
        </Text>
        {isExpanded ? (
          <ChevronUpIcon size={20} color={COLORS.textGray} />
        ) : (
          <ChevronDownIcon size={20} color={COLORS.textGray} />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 14,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: COLORS.textGray,
              lineHeight: 20,
            }}
          >
            {description}
          </Text>
        </View>
      )}
    </View>
  );
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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Toggle accordion item
  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Fetch policy details from API
  const fetchPolicyDetails = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      console.log('[PolicyDetails] Fetching policy details for policyId:', policyId);

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

  useEffect(() => {
    fetchPolicyDetails();
  }, [fetchPolicyDetails]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPolicyDetails(true);
  }, [fetchPolicyDetails]);

  const handleRetry = useCallback(() => {
    fetchPolicyDetails();
  }, [fetchPolicyDetails]);

  // Tab configuration
  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'coverage', label: 'COVERAGE' },
    { id: 'exclusions', label: 'EXCLUSIONS' },
  ];

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !policy) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 32 }}>
            <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  padding: 32,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(217, 217, 217, 0.48)',
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.08,
                  shadowRadius: 23,
                  elevation: 3,
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
                  <XCircleIcon size={32} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, textAlign: 'center' }}>
                  Unable to Load Policy Details
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 24, textAlign: 'center', paddingHorizontal: 16 }}>
                  {error || 'Policy information not available'}
                </Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={handleRetry}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      backgroundColor: COLORS.primary,
                      borderRadius: 12,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
                      Retry
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/member')}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      backgroundColor: COLORS.border,
                      borderRadius: 12,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: COLORS.textDark, fontSize: 16, fontWeight: '600' }}>
                      Go Back
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // SUCCESS STATE - DATA DISPLAY
  // ============================================================================

  const hasInclusions = policy.policyDescription?.inclusions && policy.policyDescription.inclusions.length > 0;
  const hasExclusions = policy.policyDescription?.exclusions && policy.policyDescription.exclusions.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: COLORS.white,
          }}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/member')}
                style={{
                  padding: 8,
                  borderRadius: 12,
                }}
                activeOpacity={0.7}
              >
                <BackArrowIcon />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  {policy.policyName || 'Policy Details'}
                </Text>
              </View>
              {/* Spacer for centering */}
              <View style={{ width: 40 }} />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
            <View style={{ flexDirection: 'row' }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      alignItems: 'center',
                      borderBottomWidth: 3,
                      borderBottomColor: isActive ? COLORS.primary : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: isActive ? COLORS.primary : COLORS.textGray,
                        letterSpacing: 0.5,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <View style={{ paddingTop: 20, paddingHorizontal: 16 }}>
                {/* Policy Summary Card */}
                <View
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(217, 217, 217, 0.48)',
                    shadowColor: '#000',
                    shadowOffset: { width: -2, height: 11 },
                    shadowOpacity: 0.08,
                    shadowRadius: 23,
                    elevation: 3,
                  }}
                >
                  {/* Header with Icon */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: 'rgba(3, 77, 162, 0.08)',
                        borderRadius: 22,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <ShieldCheckIcon size={24} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>
                      Policy Summary
                    </Text>
                  </View>

                  {/* Policy Details */}
                  <View style={{ gap: 16 }}>
                    {/* Policy Number */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: 'rgba(3, 77, 162, 0.08)',
                          borderRadius: 18,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <DocumentTextIcon size={18} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 2 }}>
                          Policy Number
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textDark }}>
                          {policy.policyNumber}
                        </Text>
                      </View>
                    </View>

                    {/* Corporate Name */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: 'rgba(3, 77, 162, 0.08)',
                          borderRadius: 18,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <BuildingOfficeIcon size={18} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 2 }}>
                          Corporate Name
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textDark }}>
                          {policy.corporateName || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Valid Till */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: 'rgba(3, 77, 162, 0.08)',
                          borderRadius: 18,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <CalendarIcon size={18} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 2 }}>
                          Valid Till
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textDark }}>
                          {policy.validTill}
                        </Text>
                      </View>
                    </View>

                    {/* Policy Name */}
                    {policy.policyName && (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            backgroundColor: 'rgba(3, 77, 162, 0.08)',
                            borderRadius: 18,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <ShieldCheckIcon size={18} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 2 }}>
                            Policy Name
                          </Text>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textDark }}>
                            {policy.policyName}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Coverage Tab (Inclusions) */}
            {activeTab === 'coverage' && (
              <View style={{ paddingTop: 20, paddingHorizontal: 16 }}>
                {/* Accordion Items */}
                {hasInclusions ? (
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(217, 217, 217, 0.48)',
                      shadowColor: '#000',
                      shadowOffset: { width: -2, height: 11 },
                      shadowOpacity: 0.08,
                      shadowRadius: 23,
                      elevation: 3,
                    }}
                  >
                    {/* Section Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: 'rgba(3, 77, 162, 0.08)',
                          borderRadius: 22,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <CheckCircleIcon size={24} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>
                        Included in your coverage
                      </Text>
                    </View>

                    {/* Accordion Items */}
                    <View style={{ gap: 10 }}>
                      {policy.policyDescription!.inclusions!.map((item, index) => (
                        <AccordionItem
                          key={`inclusion-${index}`}
                          title={item.headline}
                          description={item.description}
                          isExpanded={expandedItems.has(`inclusion-${index}`)}
                          onToggle={() => toggleItem(`inclusion-${index}`)}
                          type="inclusion"
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: 16,
                      padding: 32,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(217, 217, 217, 0.48)',
                      shadowColor: '#000',
                      shadowOffset: { width: -2, height: 11 },
                      shadowOpacity: 0.08,
                      shadowRadius: 23,
                      elevation: 3,
                    }}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor: 'rgba(3, 77, 162, 0.08)',
                        borderRadius: 28,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <DocumentTextIcon size={28} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 8, textAlign: 'center' }}>
                      No Coverage Details Available
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20 }}>
                      Coverage information has not been configured for this policy yet.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Exclusions Tab */}
            {activeTab === 'exclusions' && (
              <View style={{ paddingTop: 20, paddingHorizontal: 16 }}>
                {/* Accordion Items */}
                {hasExclusions ? (
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(217, 217, 217, 0.48)',
                      shadowColor: '#000',
                      shadowOffset: { width: -2, height: 11 },
                      shadowOpacity: 0.08,
                      shadowRadius: 23,
                      elevation: 3,
                    }}
                  >
                    {/* Section Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: 'rgba(3, 77, 162, 0.08)',
                          borderRadius: 22,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <XCircleIcon size={24} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>
                        Not covered by your policy
                      </Text>
                    </View>

                    {/* Accordion Items */}
                    <View style={{ gap: 10 }}>
                      {policy.policyDescription!.exclusions!.map((item, index) => (
                        <AccordionItem
                          key={`exclusion-${index}`}
                          title={item.headline}
                          description={item.description}
                          isExpanded={expandedItems.has(`exclusion-${index}`)}
                          onToggle={() => toggleItem(`exclusion-${index}`)}
                          type="exclusion"
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: 16,
                      padding: 32,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(217, 217, 217, 0.48)',
                      shadowColor: '#000',
                      shadowOffset: { width: -2, height: 11 },
                      shadowOpacity: 0.08,
                      shadowRadius: 23,
                      elevation: 3,
                    }}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor: 'rgba(3, 77, 162, 0.08)',
                        borderRadius: 28,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <DocumentTextIcon size={28} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 8, textAlign: 'center' }}>
                      No Exclusion Details Available
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20 }}>
                      Exclusion information has not been configured for this policy yet.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
