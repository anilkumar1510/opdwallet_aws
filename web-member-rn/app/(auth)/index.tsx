import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../src/contexts/AuthContext';

// Eye icons for password toggle
function EyeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}>
      <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}>
      <Path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </Svg>
  );
}

// Shield icon for feature card
function ShieldIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
      <Path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.replace('/(member)');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Blue Header Strip with Logo */}
          <View className="py-3 px-4" style={{ backgroundColor: '#1E4A8D' }}>
            <Image
              source={require('../../assets/images/habit-logo-white.png')}
              className="h-10 w-auto"
              resizeMode="contain"
              style={{ height: 40 }}
            />
          </View>

          {/* Brand Section with Gradient */}
          <LinearGradient
            colors={['#1E4A8D', '#2563A8', '#1E4A8D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-6 px-4"
          >
            <View className="items-center">
              {/* Member Illustration */}
              <Image
                source={require('../../assets/images/Member.png')}
                className="w-32 h-32 mb-3"
                resizeMode="contain"
                style={{ width: 128, height: 128 }}
              />

              {/* Heading */}
              <Text className="text-2xl font-black text-white text-center mb-1">
                Member Portal
              </Text>
              <Text className="text-sm text-white/90 text-center mb-4">
                Your complete healthcare benefits platform
              </Text>

              {/* Feature Card */}
              <View
                className="w-full p-4 rounded-xl border border-white/40"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.25)',
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                  >
                    <ShieldIcon />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">OPD Coverage</Text>
                    <Text className="text-white/90 text-sm mt-0.5">
                      Complete outpatient care benefits
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Login Form Section */}
          <View className="flex-1 bg-gray-50 px-4 py-6">
            <View className="w-full max-w-md mx-auto">
              {/* Form Header */}
              <View className="mb-6">
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  Welcome Member
                </Text>
                <Text className="text-base text-gray-600">
                  Sign in to access your benefits portal
                </Text>
              </View>

              {/* Email Field */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-base text-gray-900"
                  style={{ minHeight: 48 }}
                />
              </View>

              {/* Password Field */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!loading}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 bg-white text-base text-gray-900"
                    style={{ minHeight: 48 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-0 bottom-0 justify-center"
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {error ? (
                <View className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <Text className="text-sm text-red-600">{error}</Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: loading ? '#6B7280' : '#1E4A8D',
                  minHeight: 48,
                }}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-white font-semibold text-base ml-2">
                      Signing in...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Contact Support */}
              <View className="mt-6">
                <Text className="text-center text-sm text-gray-600">
                  Need help?{' '}
                  <Text className="font-semibold text-gray-900">Contact Support</Text>
                </Text>
              </View>

              {/* Demo Credentials */}
              <View
                className="mt-6 p-4 rounded-lg"
                style={{ backgroundColor: 'rgba(30, 74, 141, 0.1)' }}
              >
                <Text className="text-sm font-medium" style={{ color: '#1E4A8D' }}>
                  Demo Credentials:
                </Text>
                <Text className="text-sm mt-1" style={{ color: '#2563A8' }}>
                  Email: rajesh.kumar@tcs.com{'\n'}
                  Password: Member@123
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
