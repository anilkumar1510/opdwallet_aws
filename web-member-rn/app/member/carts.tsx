import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, G } from 'react-native-svg';
import { ArrowLeftIcon, CartIcon } from '../../src/components/icons/InlineSVGs';
import { useFamily } from '../../src/contexts/FamilyContext';
import { useAuth } from '../../src/contexts/AuthContext';
import apiClient from '../../src/lib/api/client';

// ============================================================================
// COLORS - Matching Home Page
// ============================================================================
const COLORS = {
  primary: '#034DA2',
  primaryLight: '#0E51A2',
  textDark: '#1c1c1c',
  textGray: '#6B7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  cardBorder: 'rgba(217, 217, 217, 0.48)',
  success: '#16a34a',
  error: '#DC2626',
  selectedBorder: '#86ACD8',
  orange: '#F5821E',
};

// ============================================================================
// TYPES
// ============================================================================
interface CartItem {
  cartId: string;
  items: Array<{ serviceName: string }>;
  status: string;
  createdAt: string;
  patientName?: string;
  type: 'lab' | 'diagnostic';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'CREATED':
      return { backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' };
    case 'PENDING':
      return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
    case 'COMPLETED':
      return { backgroundColor: 'rgba(3, 77, 162, 0.1)', color: '#034DA2' };
    default:
      return { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
  }
};

// ============================================================================
// CUSTOM ICONS
// ============================================================================

// Lab Test Icon - Flask/Beaker
const LabTestIcon = ({ width = 24, height = 24, color = '#034DA2' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.75 3v3.268M9.75 6.268C9.75 7.2 9.011 7.943 8.25 8.5L3 12.5v0a2 2 0 00-.75 1.561v2.689A3.25 3.25 0 005.5 20h13a3.25 3.25 0 003.25-3.25v-2.689a2 2 0 00-.75-1.561l-5.25-4a1.82 1.82 0 01-.75-1.232V3M14.25 3v3.268M14.25 6.268c0 .932.739 1.675 1.5 2.232L21 12.5M6 16h4M9 3h6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Diagnostic Icon - Microscope/Scan
const DiagnosticIcon = ({ width = 24, height = 24, color = '#F5821E' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Arrow Forward Icon - matching home page
const ArrowForwardIcon = () => (
  <Svg width={10} height={10} viewBox="0 0 4.47552 7.81875" fill="none">
    <Path
      d="M0.15365 7.66563C0.357817 7.86979 0.686983 7.86979 0.89115 7.66563L4.35365 4.20313C4.51615 4.04063 4.51615 3.77813 4.35365 3.61563L0.89115 0.153125C0.686983 -0.0510417 0.357817 -0.0510417 0.15365 0.153125C-0.0505168 0.357292 -0.0505168 0.686458 0.15365 0.890625L3.17032 3.91146L0.149483 6.93229C-0.0505168 7.13229 -0.0505168 7.46563 0.15365 7.66563V7.66563Z"
      fill="#303030"
    />
  </Svg>
);

// Empty Cart Illustration
const EmptyCartIllustration = () => (
  <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
    <G>
      {/* Cart body */}
      <Path
        d="M25 35h70l-8 40H33L25 35z"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth={2}
      />
      {/* Cart wheels */}
      <Path
        d="M40 85a5 5 0 1010 0 5 5 0 10-10 0zM70 85a5 5 0 1010 0 5 5 0 10-10 0z"
        fill="#9CA3AF"
      />
      {/* Cart handle */}
      <Path
        d="M15 35h10"
        stroke="#9CA3AF"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* X mark for empty */}
      <Path
        d="M50 50l20 20M70 50l-20 20"
        stroke="#D1D5DB"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </G>
  </Svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function CartsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { viewingUserId, profileData } = useFamily();
  const [carts, setCarts] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // Fetch carts
  const fetchCarts = useCallback(async () => {
    try {
      const userId = viewingUserId || profileData?.user?._id || profile?.user?._id;
      const params = userId ? { userId } : undefined;

      // Fetch both lab and diagnostic carts in parallel
      const [labRes, diagnosticRes] = await Promise.all([
        apiClient.get('/member/lab/carts', { params }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/member/diagnostics/carts', { params }).catch(() => ({ data: { data: [] } })),
      ]);

      const labCarts: CartItem[] = (labRes.data?.data || [])
        .filter((c: any) => c.status === 'ACTIVE' || c.status === 'CREATED')
        .map((c: any) => ({
          cartId: c.cartId,
          items: c.items || [],
          status: c.status,
          createdAt: c.createdAt,
          patientName: c.patientName,
          type: 'lab' as const,
        }));

      const diagnosticCarts: CartItem[] = (diagnosticRes.data?.data || [])
        .filter((c: any) => c.status === 'ACTIVE' || c.status === 'CREATED')
        .map((c: any) => ({
          cartId: c.cartId,
          items: c.items || [],
          status: c.status,
          createdAt: c.createdAt,
          patientName: c.patientName,
          type: 'diagnostic' as const,
        }));

      setCarts([...labCarts, ...diagnosticCarts]);
    } catch (error) {
      console.error('[Carts] Failed to fetch carts:', error);
    } finally {
      setLoading(false);
    }
  }, [viewingUserId, profileData?.user?._id, profile?.user?._id]);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCarts();
    setRefreshing(false);
  };

  const handleCartPress = (cart: CartItem) => {
    const route = cart.type === 'lab'
      ? `/member/pathology-lab/booking/${cart.cartId}`
      : `/member/radiology-cardiology/booking/${cart.cartId}`;
    router.push(route as any);
  };

  const labCarts = carts.filter(c => c.type === 'lab');
  const diagnosticCarts = carts.filter(c => c.type === 'diagnostic');

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* ===== HEADER (STICKY) ===== */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
          ...Platform.select({
            web: {
              position: 'sticky' as any,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 8, borderRadius: 8 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight }}>
                  Your Carts
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  {carts.length} active cart{carts.length !== 1 ? 's' : ''} ready to review
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 16, color: COLORS.textGray, fontSize: 14 }}>
              Loading your carts...
            </Text>
          </View>
        ) : carts.length === 0 ? (
          /* Empty State */
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: 0.08,
              shadowRadius: 23,
              elevation: 3,
            }}
          >
            <EmptyCartIllustration />
            <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 24 }}>
              No Active Carts
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textGray, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              Your lab test and diagnostic carts will appear here once created by our operations team.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/member' as any)}
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: COLORS.primary,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 14 }}>
                Go to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Lab Test Carts Section */}
            {labCarts.length > 0 && (
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: COLORS.cardBorder,
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.08,
                  shadowRadius: 23,
                  elevation: 3,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(3, 77, 162, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <LabTestIcon width={22} height={22} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                      Lab Tests
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                      {labCarts.length} cart{labCarts.length !== 1 ? 's' : ''} available
                    </Text>
                  </View>
                </View>

                {labCarts.map((cart, index) => (
                  <TouchableOpacity
                    key={cart.cartId}
                    onPress={() => handleCartPress(cart)}
                    activeOpacity={0.8}
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: COLORS.selectedBorder,
                      backgroundColor: COLORS.white,
                      marginBottom: index < labCarts.length - 1 ? 12 : 0,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark }}>
                          {cart.items.length} test{cart.items.length !== 1 ? 's' : ''} added
                        </Text>
                        {cart.patientName && (
                          <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 4 }}>
                            Patient: {cart.patientName}
                          </Text>
                        )}
                        <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 4 }}>
                          Cart ID: {cart.cartId}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                          Created: {formatDate(cart.createdAt)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 9999,
                            ...getStatusColor(cart.status),
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '500', color: getStatusColor(cart.status).color }}>
                            {cart.status}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
                            Review Cart
                          </Text>
                          <ArrowForwardIcon />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Diagnostic Carts Section */}
            {diagnosticCarts.length > 0 && (
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: COLORS.cardBorder,
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.08,
                  shadowRadius: 23,
                  elevation: 3,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(245, 130, 30, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <DiagnosticIcon width={22} height={22} color={COLORS.orange} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.orange }}>
                      Diagnostics
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                      {diagnosticCarts.length} cart{diagnosticCarts.length !== 1 ? 's' : ''} available
                    </Text>
                  </View>
                </View>

                {diagnosticCarts.map((cart, index) => (
                  <TouchableOpacity
                    key={cart.cartId}
                    onPress={() => handleCartPress(cart)}
                    activeOpacity={0.8}
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: 'rgba(245, 130, 30, 0.4)',
                      backgroundColor: COLORS.white,
                      marginBottom: index < diagnosticCarts.length - 1 ? 12 : 0,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark }}>
                          {cart.items.length} service{cart.items.length !== 1 ? 's' : ''} added
                        </Text>
                        {cart.patientName && (
                          <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 4 }}>
                            Patient: {cart.patientName}
                          </Text>
                        )}
                        <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 4 }}>
                          Cart ID: {cart.cartId}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                          Created: {formatDate(cart.createdAt)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 9999,
                            ...getStatusColor(cart.status),
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '500', color: getStatusColor(cart.status).color }}>
                            {cart.status}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.orange }}>
                            Review Cart
                          </Text>
                          <ArrowForwardIcon />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        </View>
      </ScrollView>
    </View>
  );
}
