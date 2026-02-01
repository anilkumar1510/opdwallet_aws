import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  HomeIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  VideoCameraIcon,
  BeakerIcon,
  SparklesIcon,
} from '../../src/components/icons/InlineSVGs';

// ============================================================================
// ADDITIONAL ICONS
// ============================================================================

const WalletIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const CurrencyIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const UsersIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const ChartIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const BellIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const QuestionIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const CogIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const ShoppingBagIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const ClipboardIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ) : (
      <DocumentTextIcon width={width} height={height} color={color} />
    )}
  </View>
);

const CreditCardIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

const UserCircleIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

// ============================================================================
// SERVICES DATA
// ============================================================================

interface Service {
  name: string;
  description: string;
  href: string;
  icon: React.FC<{ width?: number; height?: number; color?: string }>;
  category: string;
  badge?: string;
}

const services: Service[] = [
  // Core Services
  {
    name: 'Dashboard',
    description: 'View your benefits overview and quick stats',
    href: '/member',
    icon: HomeIcon,
    category: 'Core',
  },
  {
    name: 'OPD Wallet',
    description: 'Check balance and transaction history',
    href: '/member/wallet',
    icon: WalletIcon,
    category: 'Core',
  },
  {
    name: 'Profile',
    description: 'View and edit your profile information',
    href: '/member/profile',
    icon: UserCircleIcon,
    category: 'Core',
  },
  {
    name: 'Transactions',
    description: 'View all wallet transactions',
    href: '/member/transactions',
    icon: ChartIcon,
    category: 'Core',
  },

  // Claims & Reimbursements
  {
    name: 'Claims History',
    description: 'View all your past claims',
    href: '/member/claims',
    icon: DocumentTextIcon,
    category: 'Claims',
  },
  {
    name: 'Submit New Claim',
    description: 'File a new reimbursement claim',
    href: '/member/claims/new',
    icon: CreditCardIcon,
    category: 'Claims',
    badge: 'Quick',
  },

  // Healthcare Services
  {
    name: 'In-Clinic Consultation',
    description: 'Schedule doctor appointments at clinics',
    href: '/member/in-clinic-consultation',
    icon: CalendarIcon,
    category: 'Healthcare',
  },
  {
    name: 'Online Consultations',
    description: 'Video consultation with doctors',
    href: '/member/online-consultation',
    icon: VideoCameraIcon,
    category: 'Healthcare',
  },
  {
    name: 'Lab Tests',
    description: 'Book lab tests and view results',
    href: '/member/lab-tests',
    icon: BeakerIcon,
    category: 'Healthcare',
  },
  {
    name: 'Diagnostics',
    description: 'Book diagnostic tests and scans',
    href: '/member/diagnostics',
    icon: ClipboardIcon,
    category: 'Healthcare',
  },
  {
    name: 'Health Records',
    description: 'Access your medical records and prescriptions',
    href: '/member/health-records',
    icon: DocumentTextIcon,
    category: 'Healthcare',
  },
  {
    name: 'Bookings',
    description: 'View all your bookings and appointments',
    href: '/member/bookings',
    icon: ClipboardIcon,
    category: 'Healthcare',
  },
  {
    name: 'Dental Services',
    description: 'Book dental appointments and checkups',
    href: '/member/dental',
    icon: SparklesIcon,
    category: 'Healthcare',
  },
  {
    name: 'Vision Care',
    description: 'Eye checkups and vision services',
    href: '/member/vision',
    icon: SparklesIcon,
    category: 'Healthcare',
  },

  // Wellness
  {
    name: 'Wellness Programs',
    description: 'Health and wellness programs',
    href: '/member/wellness-programs',
    icon: SparklesIcon,
    category: 'Wellness',
  },
  {
    name: 'Annual Health Checkup',
    description: 'Book your annual health checkup',
    href: '/member/ahc',
    icon: BeakerIcon,
    category: 'Wellness',
    badge: 'AHC',
  },

  // Support
  {
    name: 'Helpline',
    description: 'Get help and contact support',
    href: '/member/helpline',
    icon: QuestionIcon,
    category: 'Support',
  },
  {
    name: 'Pharmacy',
    description: 'Order medicines and pharmacy services',
    href: '/member/pharmacy',
    icon: ShoppingBagIcon,
    category: 'Support',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ServicesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const handleServicePress = (href: string) => {
    router.push(href as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7fc' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, borderRadius: 8 }}
          >
            <ArrowLeftIcon width={20} height={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>All Services</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              Browse and access all available services
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          borderRadius: 10,
          paddingHorizontal: 12,
          marginBottom: 12,
        }}>
          <MagnifyingGlassIcon width={20} height={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search services..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 8,
              fontSize: 15,
              color: '#111827',
            }}
          />
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedCategory === category ? '#0E51A2' : '#F3F4F6',
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: selectedCategory === category ? '#FFFFFF' : '#374151',
              }}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Services List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {Object.keys(groupedServices).length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 15, color: '#6B7280' }}>
              No services found matching your search.
            </Text>
          </View>
        ) : (
          Object.entries(groupedServices).map(([category, categoryServices]) => (
            <View key={category} style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 12,
              }}>
                {category}
              </Text>
              <View style={{ gap: 12 }}>
                {categoryServices.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <TouchableOpacity
                      key={service.href}
                      onPress={() => handleServicePress(service.href)}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        padding: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 12 }}>
                          <View style={{
                            padding: 8,
                            backgroundColor: 'rgba(14, 81, 162, 0.08)',
                            borderRadius: 8,
                          }}>
                            <IconComponent width={24} height={24} color="#0E51A2" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: '#111827',
                              }}>
                                {service.name}
                              </Text>
                              {service.badge && (
                                <View style={{
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  backgroundColor: 'rgba(14, 81, 162, 0.1)',
                                  borderRadius: 10,
                                }}>
                                  <Text style={{
                                    fontSize: 11,
                                    fontWeight: '600',
                                    color: '#0E51A2',
                                  }}>
                                    {service.badge}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{
                              fontSize: 13,
                              color: '#6B7280',
                              marginTop: 4,
                            }}>
                              {service.description}
                            </Text>
                          </View>
                        </View>
                        <ChevronRightIcon width={20} height={20} color="#9CA3AF" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
