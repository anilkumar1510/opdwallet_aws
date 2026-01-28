import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

// Eye icon for password visibility toggle
function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2}>
        <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <Path d="M1 1l22 22" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2}>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </Svg>
  );
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View className={containerClassName}>
      {label && (
        <Text className="text-sm font-medium text-ink-700 mb-1.5">{label}</Text>
      )}

      <View
        className={`flex-row items-center bg-surface border rounded-xl px-4 min-h-[48px] ${
          error ? 'border-danger' : 'border-surface-border'
        }`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className="flex-1 text-base text-ink-900 py-3"
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !isPasswordVisible}
          autoCapitalize="none"
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="ml-2 p-1"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <EyeIcon visible={isPasswordVisible} />
          </TouchableOpacity>
        ) : (
          rightIcon && <View className="ml-2">{rightIcon}</View>
        )}
      </View>

      {error && <Text className="text-sm text-danger mt-1.5">{error}</Text>}
      {helperText && !error && (
        <Text className="text-sm text-ink-500 mt-1.5">{helperText}</Text>
      )}
    </View>
  );
}
