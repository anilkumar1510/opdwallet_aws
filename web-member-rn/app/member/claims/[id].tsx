import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

const ChevronLeftIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function ClaimDetailPage() {
  const { id } = useLocalSearchParams();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 12,
            }}
          >
            <ChevronLeftIcon width={24} height={24} color="#0E51A2" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>Claim Details</Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              View claim information
            </Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', textAlign: 'center' }}>
            Claim Detail Page
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
            Claim ID: {id}
          </Text>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 16, textAlign: 'center' }}>
            This page is under development
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
