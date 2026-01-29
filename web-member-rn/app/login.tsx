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
  useWindowDimensions,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../src/contexts/AuthContext';

// ============================================================================
// SVG ICONS
// ============================================================================

// Shield icon for OPD Coverage
function ShieldIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </Svg>
  );
}

// Dollar/Circle icon for Easy Claims
function DollarIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </Svg>
  );
}

// Users icon for Family Coverage
function UsersIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </Svg>
  );
}

// Eye icon (password visible)
function EyeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}>
      <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </Svg>
  );
}

// Eye off icon (password hidden)
function EyeOffIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}>
      <Path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </Svg>
  );
}

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        shadowColor: 'rgba(199, 210, 254, 0.3)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{title}</Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, marginTop: 2 }}>
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// MAIN LOGIN SCREEN
// ============================================================================

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { width } = useWindowDimensions();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Responsive breakpoints (matching Tailwind: sm=640, lg=1024)
  const isTablet = width >= 640;
  const isDesktop = width >= 1024;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#1E4A8D" />
      </View>
    );
  }

  // Redirect to member dashboard if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/member" />;
  }

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
        router.replace('/member');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Input style helper
  const getInputStyle = (isFocused: boolean) => ({
    width: '100%' as const,
    paddingHorizontal: 16,
    paddingVertical: isTablet ? 14 : 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isFocused ? '#1E4A8D' : '#d1d5db',
    backgroundColor: 'white',
    fontSize: isTablet ? 16 : 14,
    color: '#111827',
    minHeight: isTablet ? 52 : 48,
    ...(isFocused && Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
      boxShadow: '0 0 0 3px rgba(30, 74, 141, 0.1)',
    }),
  });

  // ============================================================================
  // RENDER: Desktop Layout (side by side)
  // ============================================================================
  if (isDesktop) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Blue Header Strip with Logo */}
          <View style={{ backgroundColor: '#1E4A8D', paddingVertical: 16, paddingHorizontal: 24 }}>
            <Image
              source={require('../assets/images/habit-logo-white.png')}
              resizeMode="contain"
              style={{ height: 48 }}
            />
          </View>

          {/* Main Content - Side by Side */}
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {/* Left Section - Form */}
            <View style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', paddingHorizontal: 48 }}>
              <View style={{ maxWidth: 448, width: '100%', alignSelf: 'center' }}>
                {/* Form Header */}
                <View style={{ marginBottom: 32 }}>
                  <Text style={{ fontSize: 30, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                    Welcome Member
                  </Text>
                  <Text style={{ fontSize: 16, color: '#4b5563' }}>
                    Sign in to access your benefits portal
                  </Text>
                </View>

                {/* Email Field */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                    Email
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={getInputStyle(emailFocused)}
                  />
                </View>

                {/* Password Field */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                    Password
                  </Text>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      editable={!loading}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      style={{
                        ...getInputStyle(passwordFocused),
                        paddingRight: 48,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center',
                      }}
                    >
                      {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Error Message */}
                {error ? (
                  <View
                    style={{
                      marginBottom: 24,
                      padding: 16,
                      borderRadius: 8,
                      backgroundColor: '#fef2f2',
                      borderWidth: 1,
                      borderColor: '#fecaca',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#dc2626' }}>{error}</Text>
                  </View>
                ) : null}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={{
                    width: '100%',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: loading ? '#6B7280' : '#1E4A8D',
                    minHeight: 52,
                  }}
                >
                  {loading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>
                        Signing in...
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Contact Support */}
                <View style={{ marginTop: 24 }}>
                  <Text style={{ textAlign: 'center', fontSize: 14, color: '#4b5563' }}>
                    Need help?{' '}
                    <Text style={{ fontWeight: '600', color: '#111827' }}>Contact Support</Text>
                  </Text>
                </View>

                {/* Demo Credentials */}
                <View
                  style={{
                    marginTop: 24,
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor: 'rgba(30, 74, 141, 0.1)',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#1E4A8D' }}>
                    Demo Credentials:
                  </Text>
                  <Text style={{ fontSize: 14, marginTop: 4, color: '#2563A8' }}>
                    Email: john.doe@company.com{'\n'}
                    Password: Member@123
                  </Text>
                </View>
              </View>
            </View>

            {/* Right Section - Brand */}
            <LinearGradient
              colors={['#1E4A8D', '#2563A8', '#1E4A8D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 40 }}
            >
              <View style={{ maxWidth: 512, width: '100%', alignSelf: 'center' }}>
                {/* Member Illustration */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Image
                    source={require('../assets/images/Member.png')}
                    resizeMode="contain"
                    style={{ width: 320, height: 320 }}
                  />
                </View>

                {/* Heading */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: '900',
                      color: 'white',
                      textAlign: 'center',
                      marginBottom: 12,
                    }}
                  >
                    Member Portal
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      color: 'rgba(255, 255, 255, 0.95)',
                      textAlign: 'center',
                    }}
                  >
                    Your complete healthcare benefits platform
                  </Text>
                </View>

                {/* Feature Cards */}
                <View style={{ gap: 12 }}>
                  <FeatureCard
                    icon={<ShieldIcon />}
                    title="OPD Coverage"
                    description="Complete outpatient care benefits"
                  />
                  <FeatureCard
                    icon={<DollarIcon />}
                    title="Easy Claims"
                    description="Quick and hassle-free claim process"
                  />
                  <FeatureCard
                    icon={<UsersIcon />}
                    title="Family Coverage"
                    description="Manage family health benefits"
                  />
                </View>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // RENDER: Mobile/Tablet Layout (stacked)
  // ============================================================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Blue Header Strip with Logo */}
          <View
            style={{
              backgroundColor: '#1E4A8D',
              paddingVertical: isTablet ? 16 : 12,
              paddingHorizontal: isTablet ? 24 : 16,
            }}
          >
            <Image
              source={require('../assets/images/habit-logo-white.png')}
              resizeMode="contain"
              style={{ height: isTablet ? 48 : 40 }}
            />
          </View>

          {/* Brand Section with Gradient */}
          <LinearGradient
            colors={['#1E4A8D', '#2563A8', '#1E4A8D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: isTablet ? 32 : 12,
              paddingHorizontal: isTablet ? 24 : 16,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              {/* Member Illustration */}
              <Image
                source={require('../assets/images/Member.png')}
                resizeMode="contain"
                style={{
                  width: isTablet ? 256 : 128,
                  height: isTablet ? 256 : 128,
                  marginBottom: isTablet ? 24 : 8,
                }}
              />

              {/* Heading */}
              <Text
                style={{
                  fontSize: isTablet ? 30 : 20,
                  fontWeight: '900',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: isTablet ? 12 : 4,
                }}
              >
                Member Portal
              </Text>

              {/* Subtitle - hidden on mobile */}
              {isTablet && (
                <Text
                  style={{
                    fontSize: 16,
                    color: 'rgba(255, 255, 255, 0.95)',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  Your complete healthcare benefits platform
                </Text>
              )}

              {/* Feature Cards */}
              <View style={{ width: '100%', gap: isTablet ? 12 : 6 }}>
                {/* OPD Coverage - always visible */}
                <FeatureCard
                  icon={<ShieldIcon />}
                  title="OPD Coverage"
                  description="Complete outpatient care benefits"
                />

                {/* Easy Claims - hidden on mobile */}
                {isTablet && (
                  <FeatureCard
                    icon={<DollarIcon />}
                    title="Easy Claims"
                    description="Quick and hassle-free claim process"
                  />
                )}

                {/* Family Coverage - hidden on mobile */}
                {isTablet && (
                  <FeatureCard
                    icon={<UsersIcon />}
                    title="Family Coverage"
                    description="Manage family health benefits"
                  />
                )}
              </View>
            </View>
          </LinearGradient>

          {/* Login Form Section */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#f9fafb',
              paddingHorizontal: isTablet ? 24 : 16,
              paddingVertical: isTablet ? 32 : 12,
            }}
          >
            <View style={{ maxWidth: 448, width: '100%', alignSelf: 'center' }}>
              {/* Form Header */}
              <View style={{ marginBottom: isTablet ? 32 : 12 }}>
                <Text
                  style={{
                    fontSize: isTablet ? 30 : 20,
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: isTablet ? 8 : 4,
                  }}
                >
                  Welcome Member
                </Text>
                {/* Subtitle - hidden on mobile */}
                {isTablet && (
                  <Text style={{ fontSize: 16, color: '#4b5563' }}>
                    Sign in to access your benefits portal
                  </Text>
                )}
              </View>

              {/* Email Field */}
              <View style={{ marginBottom: isTablet ? 24 : 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={getInputStyle(emailFocused)}
                />
              </View>

              {/* Password Field */}
              <View style={{ marginBottom: isTablet ? 24 : 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!loading}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={{
                      ...getInputStyle(passwordFocused),
                      paddingRight: 48,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 0,
                      bottom: 0,
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {error ? (
                <View
                  style={{
                    marginBottom: isTablet ? 24 : 12,
                    padding: isTablet ? 16 : 12,
                    borderRadius: 8,
                    backgroundColor: '#fef2f2',
                    borderWidth: 1,
                    borderColor: '#fecaca',
                  }}
                >
                  <Text style={{ fontSize: isTablet ? 14 : 12, color: '#dc2626' }}>{error}</Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                style={{
                  width: '100%',
                  paddingVertical: isTablet ? 14 : 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: loading ? '#6B7280' : '#1E4A8D',
                  minHeight: isTablet ? 52 : 48,
                }}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text
                      style={{
                        color: 'white',
                        fontWeight: '600',
                        fontSize: isTablet ? 16 : 14,
                        marginLeft: 8,
                      }}
                    >
                      Signing in...
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: isTablet ? 16 : 14 }}>
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* Contact Support - hidden on mobile */}
              {isTablet && (
                <View style={{ marginTop: 24 }}>
                  <Text style={{ textAlign: 'center', fontSize: 14, color: '#4b5563' }}>
                    Need help?{' '}
                    <Text style={{ fontWeight: '600', color: '#111827' }}>Contact Support</Text>
                  </Text>
                </View>
              )}

              {/* Demo Credentials - hidden on mobile */}
              {isTablet && (
                <View
                  style={{
                    marginTop: 24,
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor: 'rgba(30, 74, 141, 0.1)',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#1E4A8D' }}>
                    Demo Credentials:
                  </Text>
                  <Text style={{ fontSize: 14, marginTop: 4, color: '#2563A8' }}>
                    Email: john.doe@company.com{'\n'}
                    Password: Member@123
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
