import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  UserIcon,
  ShieldCheckIcon,
} from '../../src/components/icons/InlineSVGs';
import { useFamily } from '../../src/contexts/FamilyContext';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  _id: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  memberId?: string;
  bloodGroup?: string;
  uhid?: string;
  employeeId?: string;
  corporateName?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

// ============================================================================
// USERS ICON (for family members section)
// ============================================================================

const UsersIcon: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 24,
  height = 24,
  color = '#0F5FDC',
}) => (
  <View style={{ width, height }}>
    {Platform.OS === 'web' ? (
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ) : (
      <UserIcon width={width} height={height} color={color} />
    )}
  </View>
);

// ============================================================================
// EDITABLE FIELD COMPONENT
// ============================================================================

interface EditableFieldProps {
  label: string;
  value: string;
  type?: 'text' | 'email' | 'tel';
  onSave: (value: string) => Promise<void>;
  validation?: (value: string) => string | null;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  type = 'text',
  onSave,
  validation,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(editValue);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setError(null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
          {label}
        </Text>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#0E51A2',
          padding: 12,
        }}>
          <TextInput
            value={editValue}
            onChangeText={setEditValue}
            keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
            autoCapitalize="none"
            style={{ fontSize: 15, color: '#111827' }}
            autoFocus
          />
        </View>
        {error && (
          <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{error}</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              backgroundColor: '#0E51A2',
              paddingVertical: 8,
              borderRadius: 6,
              alignItems: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Save</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCancel}
            style={{
              flex: 1,
              backgroundColor: '#F3F4F6',
              paddingVertical: 8,
              borderRadius: 6,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => setIsEditing(true)}
        style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 8,
          padding: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 15, color: '#111827' }}>{value || '-'}</Text>
        <Text style={{ fontSize: 12, color: '#0E51A2', fontWeight: '500' }}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// DEPENDENT CARD COMPONENT
// ============================================================================

interface DependentCardProps {
  dependent: any;
}

const DependentCard: React.FC<DependentCardProps> = ({ dependent }) => {
  const getRelationshipLabel = (relationship: string) => {
    const map: { [key: string]: string } = {
      'REL001': 'Primary Member',
      'SELF': 'Primary Member',
      'REL002': 'Spouse',
      'REL003': 'Child',
      'REL004': 'Parent',
      'REL005': 'Other',
    };
    return map[relationship] || relationship || 'Dependent';
  };

  const fullName = dependent.name
    ? `${dependent.name.firstName || ''} ${dependent.name.lastName || ''}`.trim()
    : 'Unknown';

  const initials = dependent.name
    ? `${dependent.name.firstName?.charAt(0) || ''}${dependent.name.lastName?.charAt(0) || ''}`.toUpperCase()
    : 'U';

  return (
    <View style={{
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    }}>
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0E51A2',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{fullName}</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
          {getRelationshipLabel(dependent.relationship)}
        </Text>
        {dependent.memberId && (
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            ID: {dependent.memberId}
          </Text>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfilePage() {
  const router = useRouter();
  const { profileData, isLoading, refreshFamilyData } = useFamily();
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleUpdateField = async (field: 'email' | 'mobile', value: string) => {
    // TODO: Implement API call to update profile
    console.log('[Profile] Update field:', field, value);
    throw new Error('Profile update not yet implemented');
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validateMobile = (mobile: string): string | null => {
    if (!mobile) return 'Mobile number is required';
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return 'Please enter a valid 10-digit mobile number';
    }
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7fc' }}>
        <ActivityIndicator size="large" color="#0E51A2" />
      </View>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7fc', padding: 16 }}>
        <Text style={{ color: '#EF4444', marginBottom: 16, textAlign: 'center' }}>
          {error || 'Failed to load profile'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: '#0E51A2',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, dependents, assignments } = profileData;
  const fullName = user.name
    ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim()
    : 'User';

  const primaryAssignment = assignments?.find((a: any) => a.userId === user._id);
  const assignment = primaryAssignment?.assignment;
  const policyDetails = assignment?.policyId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7fc' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            borderRadius: 8,
          }}
        >
          <ArrowLeftIcon width={20} height={20} color="#374151" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>My Profile</Text>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Personal Details Section */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{
              padding: 8,
              backgroundColor: 'rgba(14, 81, 162, 0.1)',
              borderRadius: 8,
            }}>
              <UserIcon width={24} height={24} color="#0E51A2" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Personal Details</Text>
          </View>

          <View style={{ gap: 16 }}>
            {/* Full Name */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Full Name</Text>
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 15, color: '#111827' }}>{fullName}</Text>
              </View>
            </View>

            {/* Member ID */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Member ID</Text>
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 15, color: '#111827' }}>{user.memberId || '-'}</Text>
              </View>
            </View>

            {/* UHID */}
            {user.uhid && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>UHID</Text>
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 15, color: '#111827' }}>{user.uhid}</Text>
                </View>
              </View>
            )}

            {/* Employee ID */}
            {user.employeeId && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Employee ID</Text>
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 15, color: '#111827' }}>{user.employeeId}</Text>
                </View>
              </View>
            )}

            {/* Email - Editable */}
            <EditableField
              label="Email"
              value={user.email || ''}
              type="email"
              onSave={(value) => handleUpdateField('email', value)}
              validation={validateEmail}
            />

            {/* Mobile - Editable */}
            <EditableField
              label="Mobile"
              value={user.phone || ''}
              type="tel"
              onSave={(value) => handleUpdateField('mobile', value)}
              validation={validateMobile}
            />

            {/* Date of Birth */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Date of Birth</Text>
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 15, color: '#111827' }}>{formatDate(user.dob)}</Text>
              </View>
            </View>

            {/* Gender */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Gender</Text>
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 15, color: '#111827' }}>{user.gender || '-'}</Text>
              </View>
            </View>

            {/* Blood Group */}
            {user.bloodGroup && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Blood Group</Text>
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 15, color: '#111827' }}>{user.bloodGroup}</Text>
                </View>
              </View>
            )}

            {/* Address */}
            {user.address && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Address</Text>
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 15, color: '#111827' }}>
                    {[
                      user.address.line1,
                      user.address.line2,
                      user.address.city,
                      user.address.state,
                      user.address.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Policy Details Section */}
        {policyDetails && (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <View style={{
                padding: 8,
                backgroundColor: 'rgba(14, 81, 162, 0.1)',
                borderRadius: 8,
              }}>
                <ShieldCheckIcon width={24} height={24} color="#0E51A2" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Policy Details</Text>
            </View>

            <View style={{ gap: 16 }}>
              {/* Policy Number */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Policy Number</Text>
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 15, color: '#111827', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                    {policyDetails.policyNumber || '-'}
                  </Text>
                </View>
              </View>

              {/* Policy Name */}
              {policyDetails.name && (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Policy Name</Text>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                    <Text style={{ fontSize: 15, color: '#111827' }}>{policyDetails.name}</Text>
                  </View>
                </View>
              )}

              {/* Policy Status */}
              {policyDetails.status && (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Policy Status</Text>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                    <View style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: policyDetails.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: policyDetails.status === 'ACTIVE' ? '#065F46' : '#991B1B',
                      }}>
                        {policyDetails.status}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Policy Validity */}
              {policyDetails.effectiveFrom && (
                <>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Valid From</Text>
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                      <Text style={{ fontSize: 15, color: '#111827' }}>{formatDate(policyDetails.effectiveFrom)}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>Valid To</Text>
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 }}>
                      <Text style={{ fontSize: 15, color: '#111827' }}>{formatDate(policyDetails.effectiveTo)}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Family Members Section */}
        {dependents && dependents.length > 0 && (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <View style={{
                padding: 8,
                backgroundColor: 'rgba(14, 81, 162, 0.1)',
                borderRadius: 8,
              }}>
                <UsersIcon width={24} height={24} color="#0E51A2" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                Family Members ({dependents.length})
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {dependents.map((dependent: any) => (
                <DependentCard key={dependent._id || dependent.id} dependent={dependent} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
