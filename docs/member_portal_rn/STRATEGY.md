# React Native Member Portal - Development Strategy

## Project Overview

We are replicating the **OPD Wallet web-member portal** (Next.js) as a **React Native (Expo)** application. The goal is to create a mobile-first experience with visual fidelity almost identical to the web portal, using the **same backend API** with **no backend changes required**.

### Key Constraints
- **Same backend/database** - No API modifications (only auth compatibility additions were made)
- **Parallel operation** - Both web and RN portals must work simultaneously
- **Visual parity** - Match the web portal's look and feel as closely as possible
- **Code reuse** - Share types and API patterns where sensible

---

## Technical Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Expo SDK | 54 | Managed workflow, cross-platform |
| Expo Router | v6 | File-based routing (like Next.js App Router) |
| NativeWind | v4 | Tailwind CSS for React Native |
| React Native | 0.81.5 | Core framework |
| TypeScript | 5.9 | Type safety |
| Axios | 1.13 | HTTP client |
| expo-secure-store | 15.0 | Secure token storage (native) |

---

## Authentication Strategy

### Problem
The web portal uses **HTTP-only cookies** for authentication. React Native (especially on native platforms) cannot use cookies reliably.

### Solution: Dual Authentication Support
The backend now supports **both** authentication methods:

1. **Cookie-based auth** (web portal) - Unchanged behavior
2. **Bearer token auth** (RN app) - Token in `Authorization: Bearer <token>` header

### Backend Changes Made

#### 1. JWT Strategy (`api/src/modules/auth/strategies/jwt.strategy.ts`)
```typescript
jwtFromRequest: ExtractJwt.fromExtractors([
  // First try Authorization header (for mobile apps)
  ExtractJwt.fromAuthHeaderAsBearerToken(),
  // Then try cookie (for web apps)
  (request: Request) => request?.cookies?.[cookieName],
]),
```

#### 2. Login Response (`api/src/modules/auth/auth.controller.ts`)
```typescript
return {
  ...result.user,      // Spread for backward compatibility (web)
  user: result.user,   // Nested object for new clients
  token: result.token, // Token for mobile clients
};
```

#### 3. CORS Configuration (`api/src/main.ts` and `docker-compose.yml`)
Added Expo development ports: `8081`, `8082`, `8083`, `19006`

---

## Cross-Platform Storage

The RN app uses a cross-platform storage abstraction:

**Location:** `web-member-rn/src/lib/api/client.ts`

```typescript
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);  // Native: encrypted storage
  },
  // ... setItem, removeItem
};
```

- **Web platform**: Uses `localStorage`
- **iOS/Android**: Uses `expo-secure-store` (encrypted)

---

## Project Structure

```
web-member-rn/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (AuthProvider, fonts)
│   ├── index.tsx                 # Entry redirect logic
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   └── index.tsx             # Login screen
│   └── (member)/                 # Member group (authenticated)
│       ├── _layout.tsx           # Bottom tab navigation
│       └── index.tsx             # Dashboard screen
├── src/
│   ├── components/
│   │   ├── navigation/
│   │   │   └── BottomTabBar.tsx  # Custom bottom navigation
│   │   └── ui/                   # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── index.ts
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth state management
│   └── lib/
│       └── api/
│           ├── client.ts         # Axios instance + token management
│           ├── types.ts          # API response types
│           └── users.ts          # User/auth API calls
├── tailwind.config.js            # NativeWind configuration
├── global.css                    # Global Tailwind styles
└── package.json
```

---

## Routing Architecture

Using **Expo Router v6** with file-based routing (similar to Next.js App Router):

| Route Group | Purpose | Auth Required |
|-------------|---------|---------------|
| `(auth)/` | Login, registration | No |
| `(member)/` | All authenticated screens | Yes |

### Route Protection
The root `_layout.tsx` handles auth state and redirects:
- If not authenticated → redirect to `/(auth)`
- If authenticated → redirect to `/(member)`

---

## Current Progress

### Completed Screens

| Screen | Web Equivalent | Status |
|--------|---------------|--------|
| Login | `/` (login page) | Done |
| Dashboard | `/member` | Done |

### Remaining Screens to Build

Based on `web-member/app/member/**/*.tsx`, approximately **50+ screens** need to be replicated:

#### Core Features
- [ ] Profile (`/member/profile`)
- [ ] Settings (`/member/settings`)
- [ ] Wallet (`/member/wallet`)
- [ ] Transactions (`/member/transactions`)
- [ ] Benefits (`/member/benefits`)

#### Appointments
- [ ] Appointments List (`/member/appointments`)
- [ ] Specialties Selection (`/member/appointments/specialties`)
- [ ] Doctors List (`/member/appointments/doctors`)
- [ ] Select Patient (`/member/appointments/select-patient`)
- [ ] Select Slot (`/member/appointments/select-slot`)
- [ ] Confirm Booking (`/member/appointments/confirm`)

#### Claims
- [ ] Claims List (`/member/claims`)
- [ ] Claim Details (`/member/claims/[id]`)
- [ ] New Claim (`/member/claims/new`)

#### Bookings
- [ ] Bookings List (`/member/bookings`)
- [ ] New Booking (`/member/bookings/new`)

#### Orders
- [ ] Orders List (`/member/orders`)
- [ ] Order Details (`/member/orders/[transactionId]`)

#### Lab Tests / Diagnostics
- [ ] Lab Tests (`/member/lab-tests`)
- [ ] Diagnostics (`/member/diagnostics`)
- [ ] Cart (`/member/lab-tests/cart/[id]`)
- [ ] Vendor Selection (`/member/lab-tests/cart/[id]/vendor/[vendorId]`)
- [ ] Booking (`/member/lab-tests/booking/[cartId]`)
- [ ] Orders (`/member/lab-tests/orders`)
- [ ] Order Details (`/member/lab-tests/orders/[orderId]`)
- [ ] Upload (`/member/lab-tests/upload`)

#### Healthcare Services
- [ ] Online Consult (`/member/online-consult`)
- [ ] Consultation Room (`/member/consultations/[appointmentId]`)
- [ ] Dental (`/member/dental`)
- [ ] Vision (`/member/vision`)
- [ ] Pharmacy (`/member/pharmacy`)
- [ ] Health Checkup (`/member/health-checkup`)
- [ ] Wellness (`/member/wellness`)
- [ ] Health Records (`/member/health-records`)

#### Family Management
- [ ] Family Members (`/member/family`)
- [ ] Add Family Member (`/member/family/add`)

#### Other
- [ ] Policy Details (`/member/policy-details/[policyId]`)
- [ ] Services (`/member/services`)
- [ ] Helpline (`/member/helpline`)
- [ ] Payments (`/member/payments/[paymentId]`)
- [ ] AHC Booking (`/member/ahc/booking`)

---

## Development Patterns

### 1. Screen Replication Workflow

When building a new screen:

1. **Read the web version** first to understand the UI and API calls
2. **Check existing components** in `src/components/ui/` before creating new ones
3. **Follow NativeWind patterns** - use Tailwind classes via `className` prop
4. **Use the same API endpoints** - add types to `src/lib/api/types.ts`
5. **Match the visual design** as closely as possible

### 2. API Integration

All API calls go through the axios client with automatic token attachment:

```typescript
// src/lib/api/users.ts
export const usersApi = {
  getMemberProfile: async (): Promise<MemberProfileResponse> => {
    const response = await apiClient.get('/members/profile');
    return response.data;
  },
};
```

### 3. Styling with NativeWind

```tsx
// Use Tailwind classes
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-semibold text-gray-900">
    Hello World
  </Text>
</View>
```

### 4. Navigation

```tsx
import { router } from 'expo-router';

// Navigate to a screen
router.push('/member/appointments');

// Replace current screen
router.replace('/(auth)');

// Go back
router.back();
```

---

## Running the Project

### Development

```bash
cd web-member-rn

# Install dependencies
npm install

# Start Expo dev server
npm start

# Or start for specific platform
npm run web      # Web browser
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

### Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

For production, this would point to the production API.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout, AuthProvider setup |
| `app/(member)/_layout.tsx` | Bottom tab navigation setup |
| `src/contexts/AuthContext.tsx` | Auth state, login/logout logic |
| `src/lib/api/client.ts` | Axios setup, token management |
| `src/lib/api/types.ts` | TypeScript types for API responses |
| `src/components/ui/*.tsx` | Reusable UI components |

---

## API Compatibility Notes

The RN app uses the **same API endpoints** as the web portal. Key endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Login (returns token) |
| `/auth/logout` | POST | Logout |
| `/auth/me` | GET | Get current user |
| `/members/profile` | GET | Get member profile with policies |

All endpoints accept Bearer token authentication.

---

## Testing Checklist

Before considering a screen complete:

- [ ] Visual match with web portal
- [ ] All API integrations working
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Works on web platform
- [ ] Works on iOS (if testing native)
- [ ] Works on Android (if testing native)
- [ ] Navigation flows correctly

---

## Troubleshooting

### Common Issues

1. **SecureStore error on web**: The cross-platform storage in `client.ts` handles this by using localStorage on web.

2. **401 errors**: Check that the token is being sent in the Authorization header. The axios interceptor in `client.ts` handles this automatically.

3. **CORS errors**: Ensure your API's CORS config includes the Expo dev server port (usually 8081-8083 or 19006).

4. **Styling not applying**: Make sure `global.css` is imported in `_layout.tsx` and NativeWind is properly configured.

---

## Next Steps

The recommended approach for continuing development:

1. **Build screens incrementally** - Start with simpler screens (Profile, Settings) before complex flows (Appointments booking)

2. **Share components** - Build reusable components as you go, add them to `src/components/ui/`

3. **Test on multiple platforms** - Regularly test on web, iOS, and Android

4. **Match web portal behavior** - When in doubt, check how the web portal handles a particular case

---

*Last Updated: January 2025*
