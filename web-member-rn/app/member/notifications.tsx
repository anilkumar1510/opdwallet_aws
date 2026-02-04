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
import { ArrowLeftIcon } from '../../src/components/icons/InlineSVGs';
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
  warning: '#F59E0B',
  orange: '#F5821E',
};

// ============================================================================
// TYPES
// ============================================================================
interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: {
    cartType?: string;
    appointmentType?: string;
    [key: string]: any;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'CART_CREATED':
      return { icon: 'cart', color: COLORS.primary, bgColor: 'rgba(3, 77, 162, 0.1)' };
    case 'CLAIM_APPROVED':
    case 'PAYMENT_COMPLETED':
      return { icon: 'check', color: COLORS.success, bgColor: 'rgba(22, 163, 74, 0.1)' };
    case 'CLAIM_REJECTED':
      return { icon: 'x', color: COLORS.error, bgColor: 'rgba(220, 38, 38, 0.1)' };
    case 'APPOINTMENT_CREATED':
    case 'APPOINTMENT_CONFIRMED':
      return { icon: 'calendar', color: COLORS.primary, bgColor: 'rgba(3, 77, 162, 0.1)' };
    case 'APPOINTMENT_CANCELLED':
      return { icon: 'calendar-x', color: COLORS.error, bgColor: 'rgba(220, 38, 38, 0.1)' };
    case 'APPOINTMENT_RESCHEDULED':
      return { icon: 'calendar-clock', color: COLORS.warning, bgColor: 'rgba(245, 158, 11, 0.1)' };
    default:
      return { icon: 'bell', color: COLORS.primary, bgColor: 'rgba(3, 77, 162, 0.1)' };
  }
};

// ============================================================================
// CUSTOM ICONS
// ============================================================================

const BellIcon = ({ width = 24, height = 24, color = '#034DA2' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CartNotificationIcon = ({ width = 24, height = 24, color = '#034DA2' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarIcon = ({ width = 24, height = 24, color = '#034DA2' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckCircleIcon = ({ width = 24, height = 24, color = '#16a34a' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const XCircleIcon = ({ width = 24, height = 24, color = '#DC2626' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClockIcon = ({ width = 24, height = 24, color = '#F59E0B' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const XMarkIcon = ({ width = 16, height = 16, color = '#6B7280' }: { width?: number; height?: number; color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 18L18 6M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Empty state illustration
const EmptyNotificationsIllustration = () => (
  <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
    <G>
      {/* Bell body */}
      <Path
        d="M60 20c-16.569 0-30 13.431-30 30v20l-5 10h70l-5-10V50c0-16.569-13.431-30-30-30z"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth={2}
      />
      {/* Bell top */}
      <Path
        d="M60 15a5 5 0 100-10 5 5 0 000 10z"
        fill="#9CA3AF"
      />
      {/* Bell bottom */}
      <Path
        d="M50 85c0 5.523 4.477 10 10 10s10-4.477 10-10"
        stroke="#9CA3AF"
        strokeWidth={2}
      />
      {/* Check mark for no notifications */}
      <Path
        d="M45 55l10 10 20-20"
        stroke="#D1D5DB"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  </Svg>
);

const NotificationIconComponent = ({ type }: { type: string }) => {
  const config = getNotificationIcon(type);

  switch (config.icon) {
    case 'cart':
      return <CartNotificationIcon width={22} height={22} color={config.color} />;
    case 'check':
      return <CheckCircleIcon width={22} height={22} color={config.color} />;
    case 'x':
      return <XCircleIcon width={22} height={22} color={config.color} />;
    case 'calendar':
    case 'calendar-x':
    case 'calendar-clock':
      return <CalendarIcon width={22} height={22} color={config.color} />;
    default:
      return <BellIcon width={22} height={22} color={config.color} />;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  // Fetch notifications (limit to 6 most recent)
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/notifications', {
        params: { limit: 6, page: 1 },
      });
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error('[Notifications] Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleDismiss = async (notificationId: string) => {
    setDismissingId(notificationId);
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('[Notifications] Failed to dismiss notification:', error);
    } finally {
      setDismissingId(null);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    apiClient.patch(`/notifications/${notification._id}/read`).catch(() => {});

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('[Notifications] Failed to mark all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ padding: 8, borderRadius: 8 }}
                  activeOpacity={0.7}
                >
                  <ArrowLeftIcon width={20} height={20} color="#374151" />
                </TouchableOpacity>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight }}>
                    Notifications
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </Text>
                </View>
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllRead}
                  style={{ padding: 8 }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
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
                Loading notifications...
              </Text>
            </View>
          ) : notifications.length === 0 ? (
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
              <EmptyNotificationsIllustration />
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 24 }}>
                No Notifications
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                You're all caught up! New notifications about your carts, appointments, and claims will appear here.
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
            /* Notifications List */
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              {notifications.map((notification, index) => {
                const iconConfig = getNotificationIcon(notification.type);
                const isLast = index === notifications.length - 1;
                const isDismissing = dismissingId === notification._id;

                return (
                  <TouchableOpacity
                    key={notification._id}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      padding: 16,
                      backgroundColor: notification.isRead ? COLORS.white : 'rgba(3, 77, 162, 0.03)',
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: COLORS.border,
                      opacity: isDismissing ? 0.5 : 1,
                    }}
                  >
                    {/* Icon */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: iconConfig.bgColor,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <NotificationIconComponent type={notification.type} />
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: notification.isRead ? '500' : '600',
                              color: COLORS.textDark,
                            }}
                          >
                            {notification.title}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              color: COLORS.textGray,
                              marginTop: 4,
                              lineHeight: 18,
                            }}
                            numberOfLines={2}
                          >
                            {notification.message}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                            {formatTimeAgo(notification.createdAt)}
                          </Text>
                        </View>

                        {/* Dismiss Button */}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification._id);
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: COLORS.background,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          activeOpacity={0.7}
                          disabled={isDismissing}
                        >
                          {isDismissing ? (
                            <ActivityIndicator size="small" color={COLORS.textGray} />
                          ) : (
                            <XMarkIcon width={14} height={14} color={COLORS.textGray} />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <View
                          style={{
                            position: 'absolute',
                            left: -20,
                            top: 18,
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: COLORS.primary,
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
