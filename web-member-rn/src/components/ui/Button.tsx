import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;

  // Variant styles
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-brand-600',
    secondary: 'bg-surface-alt border border-surface-border',
    outline: 'border border-brand-600 bg-transparent',
    ghost: 'bg-transparent',
    danger: 'bg-danger',
  };

  const textVariantClasses: Record<ButtonVariant, string> = {
    primary: 'text-white',
    secondary: 'text-ink-900',
    outline: 'text-brand-600',
    ghost: 'text-ink-700',
    danger: 'text-white',
  };

  // Size styles
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 min-h-[32px]',
    md: 'px-4 py-2.5 min-h-[44px]',
    lg: 'px-6 py-3 min-h-[52px]',
  };

  const textSizeClasses: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center rounded-xl ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''} ${className || ''}`}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#1E3A8C'}
          className="mr-2"
        />
      ) : (
        leftIcon && <View className="mr-2">{leftIcon}</View>
      )}

      <Text
        className={`font-semibold ${textVariantClasses[variant]} ${textSizeClasses[size]}`}
      >
        {children}
      </Text>

      {rightIcon && !loading && <View className="ml-2">{rightIcon}</View>}
    </TouchableOpacity>
  );
}

// Icon Button variant
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  label: string;
}

export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}: IconButtonProps) {
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
  };

  return (
    <TouchableOpacity
      className={`items-center justify-center rounded-full ${sizeClasses[size]} ${className || ''}`}
      accessibilityLabel={label}
      accessibilityRole="button"
      activeOpacity={0.7}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
}
