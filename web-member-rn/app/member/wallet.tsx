import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import {
  ChevronDownIcon,
  CheckIcon,
  ChevronRightIcon,
} from '../../src/components/icons/InlineSVGs';
import { useFamily } from '../../src/contexts/FamilyContext';
import { fetchWalletBalance } from '../../src/lib/api/wallet';

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
};

// ============================================================================
// SVG ICONS - Matching Home Page Style
// ============================================================================

// Wallet Icon (matches home page)
function WalletIcon({ size = 18, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 7H3C2.45 7 2 7.45 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 7.45 21.55 7 21 7ZM20 18H4V9H20V18ZM17 14C17 13.45 17.45 13 18 13C18.55 13 19 13.45 19 14C19 14.55 18.55 15 18 15C17.45 15 17 14.55 17 14Z"
        fill={color}
      />
      <Path d="M20 4H4C2.9 4 2 4.9 2 6V7H22V6C22 4.9 21.1 4 20 4Z" fill={color} />
    </Svg>
  );
}

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

// Category specific icons
function DoctorIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={2} />
      <Path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M15 8H18M16.5 6.5V9.5" stroke={COLORS.orange} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function LabIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3V8L4 14V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V14L15 8V3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 3H15" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="10" cy="15" r="1.5" fill={COLORS.orange} />
      <Circle cx="14" cy="17" r="1" fill={COLORS.orange} />
    </Svg>
  );
}

function PharmacyIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="16" rx="2" stroke={color} strokeWidth={2} />
      <Path d="M9 12H15M12 9V15" stroke={COLORS.orange} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 4V2M15 4V2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function DiagnosticsIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={2} />
      <Path d="M7 12H10L11 9L13 15L14 12H17" stroke={COLORS.orange} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DentalIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8 2 5 5 5 8C5 11 6 13 7 16C8 19 9 22 10.5 22C12 22 12 19 12 19C12 19 12 22 13.5 22C15 22 16 19 17 16C18 13 19 11 19 8C19 5 16 2 12 2Z" stroke={color} strokeWidth={2} />
      <Path d="M10 8V11M14 8V11" stroke={COLORS.orange} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function VisionIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={COLORS.orange} strokeWidth={2} />
      <Path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function OnlineConsultIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="14" rx="2" stroke={color} strokeWidth={2} />
      <Path d="M2 18H22" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="11" r="3" stroke={COLORS.orange} strokeWidth={1.5} />
      <Path d="M9 18V20M15 18V20" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function DefaultCategoryIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="8" height="8" rx="1" stroke={color} strokeWidth={2} />
      <Rect x="13" y="3" width="8" height="8" rx="1" stroke={color} strokeWidth={2} />
      <Rect x="3" y="13" width="8" height="8" rx="1" stroke={color} strokeWidth={2} />
      <Rect x="13" y="13" width="8" height="8" rx="1" fill={COLORS.orange} />
    </Svg>
  );
}

// Get icon for category based on name or code
function getCategoryIcon(categoryCode: string, categoryName: string, size = 20, color = COLORS.primary) {
  const lowerName = categoryName.toLowerCase();
  const lowerCode = categoryCode.toLowerCase();

  if (lowerName.includes('doctor') || lowerName.includes('consult') || lowerCode.includes('cat001')) {
    return <DoctorIcon size={size} color={color} />;
  }
  if (lowerName.includes('lab') || lowerCode.includes('cat004')) {
    return <LabIcon size={size} color={color} />;
  }
  if (lowerName.includes('pharmacy') || lowerName.includes('medicine') || lowerCode.includes('cat002')) {
    return <PharmacyIcon size={size} color={color} />;
  }
  if (lowerName.includes('diagnostic') || lowerCode.includes('cat003')) {
    return <DiagnosticsIcon size={size} color={color} />;
  }
  if (lowerName.includes('dental') || lowerCode.includes('cat006')) {
    return <DentalIcon size={size} color={color} />;
  }
  if (lowerName.includes('vision') || lowerName.includes('eye') || lowerCode.includes('cat007')) {
    return <VisionIcon size={size} color={color} />;
  }
  if (lowerName.includes('online') || lowerName.includes('tele') || lowerCode.includes('cat005')) {
    return <OnlineConsultIcon size={size} color={color} />;
  }
  return <DefaultCategoryIcon size={size} color={color} />;
}

// ============================================================================
// TYPES
// ============================================================================

interface TotalBalance {
  allocated: number;
  current: number;
  consumed: number;
}

interface Category {
  categoryCode: string;
  name: string;
  total: number;
  available: number;
  consumed: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WalletScreen() {
  const router = useRouter();
  const { familyMembers, activeMember, viewingUserId, loggedInUser, canSwitchProfiles } = useFamily();

  // State
  const [walletData, setWalletData] = useState<{
    totalBalance: TotalBalance;
    categories: Category[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedWalletMember, setSelectedWalletMember] = useState<any>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    if (activeMember) {
      setSelectedWalletMember(activeMember);
    }
  }, [activeMember]);

  const effectiveUserId = selectedWalletMember?._id || viewingUserId || activeMember?._id || loggedInUser?._id || '';

  const shouldShowFamilyDropdown = useMemo(() => {
    const currentlyViewingPrimary = activeMember?.isPrimary || activeMember?._id === loggedInUser?._id;
    const hasFamilyMembers = familyMembers.length > 1;
    return currentlyViewingPrimary && hasFamilyMembers && canSwitchProfiles;
  }, [activeMember, loggedInUser, familyMembers, canSwitchProfiles]);

  const handleMemberSelect = (member: any) => {
    setSelectedWalletMember(member);
    setIsDropdownOpen(false);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!effectiveUserId) return;

      try {
        setLoading(true);
        console.log('[Wallet] Fetching data for userId:', effectiveUserId);

        const balanceResponse = await fetchWalletBalance(effectiveUserId);

        setWalletData({
          totalBalance: balanceResponse.totalBalance,
          categories: balanceResponse.categories,
        });
      } catch (error) {
        console.error('[Wallet] Error fetching data:', error);
        setWalletData({
          totalBalance: { allocated: 0, current: 0, consumed: 0 },
          categories: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [effectiveUserId]);

  // Navigate to transactions page filtered by category
  const handleCategoryPress = (categoryCode: string) => {
    router.push(`/member/transactions?category=${categoryCode}` as any);
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalBalance = walletData?.totalBalance || { allocated: 0, current: 0, consumed: 0 };
  const categories = walletData?.categories || [];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header with Back Button */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <BackArrowIcon />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                OPD Wallet
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingTop: 16 }}>

          {/* View Wallet For - Family Selector */}
          {shouldShowFamilyDropdown && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textGray, marginBottom: 8 }}>
                View Wallet For
              </Text>
              <TouchableOpacity
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  backgroundColor: COLORS.white,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                  {selectedWalletMember?.name?.firstName} {selectedWalletMember?.name?.lastName}
                  {selectedWalletMember?.isPrimary ? ' (Self)' : ` (${selectedWalletMember?.relationship})`}
                </Text>
                <View style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}>
                  <ChevronDownIcon width={18} height={18} color={COLORS.textGray} />
                </View>
              </TouchableOpacity>

              {isDropdownOpen && (
                <View
                  style={{
                    marginTop: 4,
                    backgroundColor: COLORS.white,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  {familyMembers.map((member) => {
                    const isSelected = selectedWalletMember?._id === member._id;
                    return (
                      <TouchableOpacity
                        key={member._id}
                        onPress={() => handleMemberSelect(member)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          backgroundColor: isSelected ? '#f0f7ff' : COLORS.white,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: isSelected ? '600' : '400', color: COLORS.textDark }}>
                          {member.name.firstName} {member.name.lastName}
                          {member.isPrimary ? ' (Self)' : ` (${member.relationship})`}
                        </Text>
                        {isSelected && <CheckIcon width={16} height={16} color={COLORS.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Total Available Balance Card */}
          <LinearGradient
            colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: '#86ACD8',
            }}
          >
            {/* Total Available Balance Label */}
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>
              Total Available Balance
            </Text>

            {/* Balance Amount - Format: ₹Y Left / X */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 14 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#0E51A2' }}>
                ₹{totalBalance.current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.textGray }}>
                {' '}Left
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>
                {' '}/ {totalBalance.allocated.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Total Money Used Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: COLORS.white,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <WalletIcon size={16} color={COLORS.orange} />
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginLeft: 8 }}>
                  Total Money Used
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.orange }}>
                {totalBalance.consumed.toLocaleString('en-IN')} /-
              </Text>
            </View>
          </LinearGradient>

          {/* Category Balances Section */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 16 }}>
            Category Balances
          </Text>

          {categories.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <WalletIcon size={48} color={COLORS.textLight} />
              <Text style={{ fontSize: 14, color: COLORS.textGray, marginTop: 12 }}>
                No categories available
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.categoryCode}
                  onPress={() => handleCategoryPress(category.categoryCode)}
                  activeOpacity={0.7}
                  style={{ width: '48%' }}
                >
                  <LinearGradient
                    colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 2,
                      borderColor: '#86ACD8',
                      minHeight: 160,
                    }}
                  >
                    {/* Category Icon & Name */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: COLORS.white,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 8,
                        }}
                      >
                        {getCategoryIcon(category.categoryCode, category.name, 16)}
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textDark, flex: 1 }} numberOfLines={2}>
                        {category.name}
                      </Text>
                    </View>

                    {/* Balance Info - Format: Y Left / X */}
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0E51A2' }}>
                        ₹{category.available.toLocaleString('en-IN')}
                      </Text>
                      <Text style={{ fontSize: 10, color: COLORS.textGray }}>
                        {' '}Left
                      </Text>
                      <Text style={{ fontSize: 10, color: COLORS.textGray }}>
                        {' '}/ {category.total.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* Total Money Used Bar */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: COLORS.white,
                        borderRadius: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <WalletIcon size={12} color={COLORS.orange} />
                        <Text style={{ fontSize: 9, color: COLORS.textGray, marginLeft: 4 }}>
                          Used
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.orange }}>
                        ₹{category.consumed.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* View All Transactions Link */}
          <TouchableOpacity
            onPress={() => router.push('/member/transactions' as any)}
            style={{
              marginTop: 24,
              paddingVertical: 14,
              backgroundColor: COLORS.white,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <WalletIcon size={18} color={COLORS.primary} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
              View All Transactions
            </Text>
            <ChevronRightIcon width={16} height={16} color={COLORS.primary} />
          </TouchableOpacity>

        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
