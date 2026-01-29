import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuth } from '../../src/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Format currency in Indian format
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
};

// Icons
function NotificationIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#034DA2" strokeWidth={2}>
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function WalletIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="#034DA2">
      <Path d="M21 7H3C2.45 7 2 7.45 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 7.45 21.55 7 21 7ZM20 18H4V9H20V18ZM17 14C17 13.45 17.45 13 18 13C18.55 13 19 13.45 19 14C19 14.55 18.55 15 18 15C17.45 15 17 14.55 17 14Z" />
      <Path d="M20 4H4C2.9 4 2 4.9 2 6V7H22V6C22 4.9 21.1 4 20 4Z" />
    </Svg>
  );
}

function CartIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="#034DA2">
      <Path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.49 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 16 16" fill="none">
      <Path d="M6 3L10.5 8L6 13" stroke="#000000" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Category Icons
function DoctorIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#034DA2" strokeWidth={2}>
      <Path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </Svg>
  );
}

function VideoIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#034DA2" strokeWidth={2}>
      <Path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </Svg>
  );
}

function LabIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#034DA2" strokeWidth={2}>
      <Path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </Svg>
  );
}

function DiagnosticsIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#034DA2" strokeWidth={2}>
      <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </Svg>
  );
}

function DentalIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#034DA2" strokeWidth={2}>
      <Path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </Svg>
  );
}

function VisionIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#034DA2" strokeWidth={2}>
      <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <Path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </Svg>
  );
}

// Quick Links data
const QUICK_LINKS = [
  { id: 'health-records', label: 'Health Records', href: '/member/health-records' },
  { id: 'bookings', label: 'My Bookings', href: '/member/bookings' },
  { id: 'claims', label: 'Claims', href: '/member/claims' },
  { id: 'download-policy', label: 'Download Policy', href: '#' },
  { id: 'transactions', label: 'Transaction History', href: '/member/transactions' },
];

// Health Benefits data
const HEALTH_BENEFITS = [
  { id: 'CAT001', name: 'Doctor Consult', icon: DoctorIcon, amount: 15000, total: 20000 },
  { id: 'CAT005', name: 'Online Consult', icon: VideoIcon, amount: 5000, total: 8000 },
  { id: 'CAT004', name: 'Lab Tests', icon: LabIcon, amount: 8000, total: 10000 },
  { id: 'CAT003', name: 'Diagnostics', icon: DiagnosticsIcon, amount: 12000, total: 15000 },
  { id: 'CAT006', name: 'Dental', icon: DentalIcon, amount: 7000, total: 10000 },
  { id: 'CAT007', name: 'Vision', icon: VisionIcon, amount: 4000, total: 5000 },
];

// More Services data
const MORE_SERVICES = [
  { id: 'helpline', label: '24/7 Helpline' },
  { id: 'claims', label: 'Claims' },
  { id: 'health-records', label: 'Health Records' },
  { id: 'transactions', label: 'Transaction History' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile, logout, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (!profile) {
      refreshProfile();
    }
  }, []);

  const firstName = profile?.name?.firstName || user?.name?.firstName || user?.fullName?.split(' ')[0] || 'Member';
  const initials = `${profile?.name?.firstName?.[0] || ''}${profile?.name?.lastName?.[0] || 'M'}`.toUpperCase();

  // Wallet data from profile
  const totalBalance = profile?.wallet?.totalBalance?.current || 50000;
  const allocatedBalance = profile?.wallet?.totalBalance?.allocated || 100000;

  // Categories from profile or mock data
  const walletCategories = profile?.walletCategories || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    router.replace('/login');
  };

  // User Greeting Component
  const UserGreeting = () => (
    <View className="px-5 pt-4 pb-3" style={{ backgroundColor: '#f7f7fc' }}>
      <View className="flex-row items-center justify-between">
        {/* Left: Avatar + Greeting */}
        <View className="flex-row items-center gap-2">
          {/* Avatar Circle */}
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#0E51A2' }}
          >
            <Text className="text-white font-medium text-sm">{initials}</Text>
          </TouchableOpacity>

          {/* Greeting Text */}
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            className="flex-col"
          >
            <View className="flex-row items-center gap-1">
              <Text className="text-base font-medium text-black">Hi {firstName}!</Text>
              <ChevronRightIcon />
            </View>
            <Text className="text-xs text-gray-500">welcome to OPD Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Right: Icons */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: '#fbfdfe' }}
          >
            <NotificationIcon />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: '#fbfdfe' }}
          >
            <WalletIcon />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: '#fbfdfe' }}
          >
            <CartIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu */}
      {showDropdown && (
        <View
          className="absolute top-16 left-5 w-44 bg-white rounded-xl py-2 z-50"
          style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}
        >
          <TouchableOpacity className="px-4 py-3">
            <Text className="text-sm text-gray-700">Switch Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-3">
            <Text className="text-sm text-gray-700">Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-3">
            <Text className="text-sm text-gray-700">All Services</Text>
          </TouchableOpacity>
          <View className="border-t border-gray-100 my-1" />
          <TouchableOpacity className="px-4 py-3" onPress={handleLogout}>
            <Text className="text-sm text-red-500">Log Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Policy Card Component
  const PolicyCard = ({ policy }: { policy: any }) => (
    <View
      className="rounded-2xl p-4 mr-4"
      style={{
        width: SCREEN_WIDTH - 60,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(3, 77, 162, 0.11)',
      }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-xs text-gray-500">Policy Number</Text>
          <Text className="text-sm font-semibold text-gray-900">{policy.policyNumber}</Text>
        </View>
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(4, 120, 87, 0.1)' }}
        >
          <Text className="text-xs font-medium" style={{ color: '#047857' }}>Active</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-xs text-gray-500">Coverage</Text>
          <Text className="text-lg font-bold" style={{ color: '#034DA2' }}>
            ₹{formatCurrency(policy.coverageAmount)}
          </Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500 text-right">Valid Till</Text>
          <Text className="text-sm font-medium text-gray-700">{policy.expiryDate}</Text>
        </View>
      </View>
    </View>
  );

  // Quick Link Item
  const QuickLinkItem = ({ link }: { link: any }) => (
    <TouchableOpacity
      className="flex-row items-center gap-2 h-9 px-4 rounded-2xl mr-2"
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(3, 77, 162, 0.11)',
      }}
    >
      <Text className="text-base text-gray-700">{link.label}</Text>
      <ChevronRightIcon />
    </TouchableOpacity>
  );

  // Wallet Balance Card
  const WalletBalanceSection = () => (
    <View className="px-5 mt-4">
      <TouchableOpacity activeOpacity={0.9}>
        <LinearGradient
          colors={['#5CA3FA', '#2266B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-2xl p-3 pr-24 relative overflow-hidden"
          style={{ minHeight: 95 }}
        >
          <Text className="text-sm font-medium text-white">Total Available Balance</Text>

          <View className="flex-row items-center gap-1 mt-0.5">
            <Text className="text-lg font-semibold text-white">
              {formatCurrency(totalBalance)}
            </Text>
            <Text className="text-xs" style={{ color: '#B1D2FC' }}>Left</Text>
            <Text className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.63)' }}>/</Text>
            <Text className="text-sm text-white">{formatCurrency(allocatedBalance)}</Text>
          </View>

          <Text className="text-xs mt-1.5" style={{ color: '#B1D2FC' }}>
            Your total usage cannot exceed this amount
          </Text>

          {/* Wallet Illustration */}
          <View className="absolute right-2 top-1/2" style={{ transform: [{ translateY: -30 }] }}>
            <Svg width={65} height={55} viewBox="0 0 75 65">
              <Rect x="5" y="15" width="60" height="40" rx="8" fill="#4A90D9" opacity={0.5} />
              <Rect x="0" y="10" width="65" height="45" rx="10" fill="#FFFFFF" opacity={0.2} />
              <Circle cx="55" cy="32" r="8" fill="#FFFFFF" opacity={0.3} />
            </Svg>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Health Benefit Card
  const BenefitCard = ({ benefit, isHighlighted }: { benefit: any; isHighlighted?: boolean }) => {
    const IconComponent = benefit.icon;
    return (
      <TouchableOpacity
        className="rounded-2xl p-4 mb-3"
        style={{
          width: (SCREEN_WIDTH - 52) / 2,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: isHighlighted ? '#034DA2' : 'rgba(0, 0, 0, 0.06)',
        }}
        activeOpacity={0.8}
      >
        <View
          className="w-11 h-11 rounded-xl items-center justify-center mb-3"
          style={{ backgroundColor: 'rgba(3, 77, 162, 0.08)' }}
        >
          <IconComponent />
        </View>

        <Text className="text-sm font-medium text-gray-900 mb-1">{benefit.name}</Text>

        <View className="flex-row items-baseline">
          <Text className="text-lg font-bold" style={{ color: '#034DA2' }}>
            ₹{formatCurrency(benefit.amount)}
          </Text>
          <Text className="text-xs text-gray-400 ml-1">/ {formatCurrency(benefit.total)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // More Services Item
  const MoreServiceItem = ({ service }: { service: any }) => (
    <TouchableOpacity
      className="items-center mr-4"
      style={{ width: 80 }}
    >
      <View
        className="w-14 h-14 rounded-full items-center justify-center mb-2"
        style={{
          backgroundColor: 'rgba(3, 77, 162, 0.08)',
        }}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="#034DA2">
          <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </Svg>
      </View>
      <Text className="text-xs text-gray-700 text-center" numberOfLines={2}>
        {service.label}
      </Text>
    </TouchableOpacity>
  );

  // Mock policies data
  const policies = [
    {
      policyId: '1',
      policyNumber: 'POL-2024-001234',
      policyHolder: firstName,
      coverageAmount: allocatedBalance,
      expiryDate: 'Mar 31, 2025',
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f7f7fc' }} edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Greeting */}
        <UserGreeting />

        {/* Policy Carousel */}
        <View className="pt-3">
          <Text
            className="text-lg font-medium text-black mb-3 px-5"
            style={{ fontFamily: 'System' }}
          >
            Your Policies
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5"
          >
            {policies.map((policy) => (
              <PolicyCard key={policy.policyId} policy={policy} />
            ))}
          </ScrollView>
        </View>

        {/* Quick Links */}
        <View className="pt-4">
          <Text
            className="text-lg font-medium text-black mb-2 px-5"
            style={{ fontFamily: 'System' }}
          >
            Quick Links
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5"
          >
            {QUICK_LINKS.map((link) => (
              <QuickLinkItem key={link.id} link={link} />
            ))}
          </ScrollView>
        </View>

        {/* Wallet Balance Card */}
        <WalletBalanceSection />

        {/* Health Benefits */}
        <View className="pt-6 px-5">
          <Text
            className="text-lg font-medium text-black mb-4"
            style={{ fontFamily: 'System' }}
          >
            Health Benefits
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {HEALTH_BENEFITS.map((benefit, index) => (
              <BenefitCard key={benefit.id} benefit={benefit} isHighlighted={index === 0} />
            ))}
          </View>
        </View>

        {/* More Services */}
        <View className="pt-4 pb-6">
          <Text
            className="text-lg font-medium text-black mb-3 px-5"
            style={{ fontFamily: 'System' }}
          >
            More Services
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5"
          >
            {MORE_SERVICES.map((service) => (
              <MoreServiceItem key={service.id} service={service} />
            ))}
          </ScrollView>
        </View>

        {/* Bottom padding for navigation */}
        <View className="h-24" />
      </ScrollView>

      {/* Close dropdown when tapping outside */}
      {showDropdown && (
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
          style={{ zIndex: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
