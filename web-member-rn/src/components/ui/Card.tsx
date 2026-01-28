import React from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
  clickable?: boolean;
  loading?: boolean;
  onPress?: () => void;
  className?: string;
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  noPadding = false,
  clickable = false,
  loading = false,
  onPress,
  className,
  ...props
}: CardProps) {
  if (loading) {
    return (
      <View
        className={`bg-surface rounded-2xl border border-surface-border ${className || ''}`}
        {...props}
      >
        <View className="px-6 py-4 border-b border-surface-border">
          <View className="h-4 bg-surface-border rounded-md w-1/3 mb-2" />
          <View className="h-3 bg-surface-border rounded-md w-1/2" />
        </View>
        <View className="p-6">
          <View className="space-y-3">
            <View className="h-4 bg-surface-border rounded-md w-full" />
            <View className="h-4 bg-surface-border rounded-md w-2/3" />
          </View>
        </View>
      </View>
    );
  }

  const content = (
    <>
      {(title || subtitle || actions) && (
        <View className="px-6 py-4 border-b border-surface-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              {title && (
                <Text className="text-base font-semibold text-ink-900">{title}</Text>
              )}
              {subtitle && (
                <Text className="text-sm text-ink-500 mt-1">{subtitle}</Text>
              )}
            </View>
            {actions && <View className="flex-row items-center gap-2">{actions}</View>}
          </View>
        </View>
      )}
      <View className={noPadding ? '' : 'p-6'}>{children}</View>
    </>
  );

  if (clickable) {
    return (
      <TouchableOpacity
        className={`bg-surface rounded-2xl border border-surface-border ${className || ''}`}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={`bg-surface rounded-2xl border border-surface-border ${className || ''}`}
      {...props}
    >
      {content}
    </View>
  );
}

// Simple Card variant without header
interface SimpleCardProps extends ViewProps {
  children: React.ReactNode;
  clickable?: boolean;
  onPress?: () => void;
  className?: string;
}

export function SimpleCard({
  children,
  clickable = false,
  onPress,
  className,
  ...props
}: SimpleCardProps) {
  if (clickable) {
    return (
      <TouchableOpacity
        className={`bg-surface rounded-2xl border border-surface-border p-4 ${className || ''}`}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={`bg-surface rounded-2xl border border-surface-border p-4 ${className || ''}`}
      {...props}
    >
      {children}
    </View>
  );
}
