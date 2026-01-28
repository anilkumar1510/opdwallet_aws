# Component Patterns Reference

This document provides quick reference patterns for building screens in the React Native member portal.

---

## UI Components Available

Located in `web-member-rn/src/components/ui/`:

### Button
```tsx
import { Button } from '@/components/ui';

<Button
  title="Submit"
  onPress={handleSubmit}
  loading={isSubmitting}
  variant="primary"  // or "secondary", "outline"
/>
```

### Card
```tsx
import { Card } from '@/components/ui';

<Card className="p-4">
  <Text>Card content</Text>
</Card>
```

### Input
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
  keyboardType="email-address"
  error={errors.email}
/>
```

---

## Screen Template

Basic authenticated screen structure:

```tsx
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui';

export default function MyScreen() {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // const result = await someApi.getData();
      // setData(result);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Card className="p-4">
          <Text className="text-lg font-semibold">Content here</Text>
        </Card>
      </View>
    </ScrollView>
  );
}
```

---

## API Call Patterns

### Adding a New API Function

In `src/lib/api/users.ts` (or create a new file for different domains):

```typescript
import apiClient from './client';
import { SomeResponseType } from './types';

export const someApi = {
  getItems: async (): Promise<SomeResponseType[]> => {
    const response = await apiClient.get('/some-endpoint');
    return response.data;
  },

  getItem: async (id: string): Promise<SomeResponseType> => {
    const response = await apiClient.get(`/some-endpoint/${id}`);
    return response.data;
  },

  createItem: async (data: CreateItemDto): Promise<SomeResponseType> => {
    const response = await apiClient.post('/some-endpoint', data);
    return response.data;
  },
};
```

### Adding Types

In `src/lib/api/types.ts`:

```typescript
export interface SomeResponseType {
  id: string;
  name: string;
  createdAt: string;
  // ... other fields
}

export interface CreateItemDto {
  name: string;
  // ... other fields
}
```

---

## Navigation Patterns

### Basic Navigation

```tsx
import { router } from 'expo-router';

// Push a new screen
router.push('/member/appointments');

// Push with params
router.push({
  pathname: '/member/claims/[id]',
  params: { id: '123' }
});

// Replace current screen
router.replace('/(auth)');

// Go back
router.back();
```

### Reading Route Params

```tsx
import { useLocalSearchParams } from 'expo-router';

export default function ClaimDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Use id to fetch claim details
}
```

### Link Component

```tsx
import { Link } from 'expo-router';

<Link href="/member/profile" asChild>
  <TouchableOpacity>
    <Text>Go to Profile</Text>
  </TouchableOpacity>
</Link>
```

---

## Styling Reference

### Common Tailwind Classes

```tsx
// Layout
className="flex-1"              // Fill available space
className="flex-row"            // Horizontal layout
className="items-center"        // Center items on cross axis
className="justify-center"      // Center items on main axis
className="justify-between"     // Space between items

// Spacing
className="p-4"                 // Padding all sides
className="px-4 py-2"           // Horizontal/vertical padding
className="m-4"                 // Margin all sides
className="mt-4 mb-2"           // Top/bottom margin
className="gap-4"               // Gap between flex children

// Typography
className="text-lg"             // Large text
className="text-sm"             // Small text
className="font-semibold"       // Semi-bold
className="font-bold"           // Bold
className="text-gray-900"       // Dark text
className="text-gray-500"       // Muted text
className="text-center"         // Center text

// Colors
className="bg-white"            // White background
className="bg-gray-50"          // Light gray background
className="bg-emerald-500"      // Primary green
className="text-emerald-600"    // Primary green text

// Borders
className="rounded-lg"          // Rounded corners
className="rounded-full"        // Circular
className="border border-gray-200"  // Border

// Shadows (may need custom config for RN)
className="shadow-sm"           // Small shadow
```

### Platform-Specific Styling

```tsx
import { Platform } from 'react-native';

<View className={Platform.OS === 'ios' ? 'pt-12' : 'pt-8'}>
  {/* Content */}
</View>
```

---

## Auth Context Usage

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    user,           // Current user data
    profile,        // Full member profile
    isAuthenticated,// Boolean
    isLoading,      // Initial auth check loading
    login,          // (email, password) => Promise
    logout,         // () => Promise
    refreshProfile, // () => Promise - refetch profile
  } = useAuth();

  // Use in component...
}
```

---

## Form Handling Pattern

```tsx
import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button, Input } from '@/components/ui';

export default function FormScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      // await someApi.submit(formData);
      Alert.alert('Success', 'Form submitted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Input
        label="Name"
        value={formData.name}
        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        error={errors.name}
      />

      <Input
        label="Email"
        value={formData.email}
        onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
        keyboardType="email-address"
        error={errors.email}
      />

      <Button
        title="Submit"
        onPress={handleSubmit}
        loading={submitting}
      />
    </View>
  );
}
```

---

## List Rendering Pattern

```tsx
import { FlatList, View, Text, RefreshControl } from 'react-native';

function ItemList() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <Card className="mb-3 p-4">
      <Text className="font-semibold">{item.name}</Text>
      <Text className="text-gray-500">{item.description}</Text>
    </Card>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <Text className="text-center text-gray-500 mt-8">
          No items found
        </Text>
      }
    />
  );
}
```

---

## Image Handling

```tsx
import { Image } from 'react-native';

// Remote image
<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  className="w-16 h-16 rounded-full"
  resizeMode="cover"
/>

// Local image
<Image
  source={require('@/assets/logo.png')}
  className="w-32 h-32"
  resizeMode="contain"
/>
```

---

## Loading States

```tsx
import { ActivityIndicator, View } from 'react-native';

// Inline spinner
<ActivityIndicator size="small" color="#10b981" />

// Full-screen loader
<View className="flex-1 items-center justify-center">
  <ActivityIndicator size="large" color="#10b981" />
  <Text className="mt-4 text-gray-500">Loading...</Text>
</View>

// Button loading
<Button title="Submit" loading={isLoading} onPress={handleSubmit} />
```

---

*This is a living document - add new patterns as they emerge during development.*
