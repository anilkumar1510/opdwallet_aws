# Session Management Fix - React Native Member Portal

## Date: January 28, 2025

---

## Issues Validated & Fixed

### ✅ CRITICAL ISSUE #1: Session Lost on Page Refresh

**Status:** VALIDATED & FIXED

**Evidence of Issue:**
```typescript
// BEFORE: web-member-rn/app/index.tsx
export default function Index() {
  return <Redirect href="/(auth)" />;  // ❌ Always redirects to login
}
```

**Problem:**
- App ALWAYS redirected to login page on refresh
- No check for existing authentication state
- Stored token was ignored

**Fix Applied:**
```typescript
// AFTER: web-member-rn/app/index.tsx
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <ActivityIndicator />;  // ✅ Wait for auth check
  }

  if (isAuthenticated) {
    return <Redirect href="/(member)" />;  // ✅ Go to dashboard if logged in
  }

  return <Redirect href="/(auth)" />;  // ✅ Only redirect to login if not authenticated
}
```

**Files Modified:**
- `web-member-rn/app/index.tsx`

---

### ✅ CRITICAL ISSUE #2: Logout on ANY Error

**Status:** VALIDATED & FIXED

**Evidence of Issue:**
```typescript
// BEFORE: web-member-rn/src/contexts/AuthContext.tsx:38-46
try {
  const profileData = await usersApi.getMemberProfile();
  setProfile(profileData);
} catch {
  // Token might be invalid, clear auth state
  await handleLogout();  // ❌ Logs out on network errors, 500s, timeouts
}
```

**Problem:**
- Network errors caused complete logout
- Server errors (500) caused logout
- Timeouts caused logout
- Only 401 (unauthorized) should cause logout

**Fix Applied:**
```typescript
// AFTER: web-member-rn/src/contexts/AuthContext.tsx
// Try to load cached profile data
const cachedProfile = await storage.getItem(PROFILE_DATA_KEY);
if (cachedProfile) {
  setProfile(JSON.parse(cachedProfile));  // ✅ Show cached data first
}

// Fetch fresh profile from server
try {
  const profileData = await usersApi.getMemberProfile();
  setProfile(profileData);
  await storage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileData));
} catch (error: any) {
  // Only logout on 401 (unauthorized) errors
  if (error.response?.status === 401) {
    console.log('Token invalid (401), logging out');
    await handleLogout();  // ✅ Only logout on 401
  } else {
    // Network error or other issue - keep user logged in
    console.warn('Failed to fetch fresh profile, using cached data:', error.message);
    // ✅ Keep user logged in with cached data
  }
}
```

**Benefits:**
- User stays logged in during network issues
- Cached data displayed until network recovers
- Only truly invalid tokens trigger logout
- Better offline experience

**Files Modified:**
- `web-member-rn/src/contexts/AuthContext.tsx`

---

### ✅ HIGH ISSUE #3: Missing FamilyContext

**Status:** VALIDATED & FIXED

**Evidence of Issue:**
```bash
# BEFORE: No family context existed
find web-member-rn -name "*Family*" -o -name "*family*"
# No results
```

**Problem:**
- No ability to switch between family members
- No session persistence for active member selection
- Missing functionality compared to Next.js web portal

**Fix Applied:**

**Created:** `web-member-rn/src/contexts/FamilyContext.tsx` (179 lines)

**Features:**
- ✅ Family member management
- ✅ Active member switching
- ✅ Session persistence (stores active member in storage)
- ✅ Profile data caching
- ✅ Support for multiple dependents
- ✅ Matches Next.js web portal functionality

**Integration:**
```typescript
// web-member-rn/app/(member)/_layout.tsx
export default function MemberLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // ... auth checks ...

  return (
    <FamilyProvider>  {/* ✅ Added FamilyProvider */}
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
        <BottomTabBar />
      </View>
    </FamilyProvider>
  );
}
```

**Usage in Components:**
```typescript
import { useFamily } from '@/contexts/FamilyContext';

function MyComponent() {
  const {
    familyMembers,      // All family members
    activeMember,       // Currently selected member
    viewingUserId,      // ID of active member
    setActiveMember,    // Switch active member
    canSwitchProfiles,  // Whether switching is allowed
  } = useFamily();
}
```

**Files Created:**
- `web-member-rn/src/contexts/FamilyContext.tsx`

**Files Modified:**
- `web-member-rn/app/(member)/_layout.tsx`

---

### ✅ HIGH ISSUE #4: Better Error Logging

**Status:** FIXED

**Enhancement Applied:**
```typescript
// BEFORE
} catch {
  // Ignore logout API errors  // ❌ Silent failure
}

// AFTER
} catch (error: any) {
  // Log logout API errors but don't block logout
  console.warn('Logout API call failed:', error.message);  // ✅ Logged
}
```

**Files Modified:**
- `web-member-rn/src/contexts/AuthContext.tsx`

---

## How Session Persistence Now Works

### On App Start / Refresh:

1. **Root Index (`app/index.tsx`)**
   - Checks `isAuthenticated` from AuthContext
   - Shows loading spinner while checking
   - Redirects to `/(member)` if authenticated
   - Redirects to `/(auth)` if not authenticated

2. **AuthContext Initialization**
   - Retrieves stored token from secure storage
   - Loads cached user data (instant display)
   - Loads cached profile data (instant display)
   - Fetches fresh profile in background
   - Only logs out on 401 errors
   - Keeps user logged in on network errors

3. **FamilyContext Initialization** (if authenticated)
   - Fetches member profile with dependents
   - Retrieves stored active member selection
   - Sets active member (with persistence)
   - Enables family member switching

### Flow Diagram:

```
App Refresh
    ↓
index.tsx checks isAuthenticated
    ↓
if loading → Show spinner
    ↓
if authenticated → /(member) → FamilyContext loads
    ↓
if not authenticated → /(auth)
```

---

## Testing Checklist

### Session Persistence Tests:
- [x] Login → Close app → Reopen → Should stay logged in
- [x] Login → Refresh page → Should stay logged in
- [x] Login → Airplane mode → Refresh → Should show cached data
- [x] Login → Wait for token expiry → Should logout
- [x] Logout → Should clear all data and redirect to login

### Family Switching Tests:
- [ ] Login as primary member with dependents → Should see all members
- [ ] Switch to dependent → Refresh → Should remember selection
- [ ] Switch back to primary → Refresh → Should remember selection
- [ ] Login as dependent → Should not see switching option

### Error Handling Tests:
- [x] Network error during profile fetch → Should keep user logged in
- [x] 500 error during profile fetch → Should keep user logged in
- [x] 401 error during profile fetch → Should logout
- [x] Timeout during profile fetch → Should keep user logged in

---

## Comparison with Next.js Web Portal

| Feature | Next.js Web | RN App (Before) | RN App (After) |
|---------|-------------|-----------------|----------------|
| Session Persistence | ✅ Cookies | ❌ Lost on refresh | ✅ Token storage |
| Auth State Check | ✅ Middleware | ❌ Always redirects | ✅ Route protection |
| Error Handling | ✅ Only 401 logout | ❌ Any error logout | ✅ Only 401 logout |
| Cached Data | ✅ Server cache | ❌ None | ✅ Local storage |
| Family Context | ✅ Yes | ❌ No | ✅ Yes |
| Member Switching | ✅ Yes | ❌ No | ✅ Yes |
| Session Persistence | ✅ sessionStorage | ❌ No | ✅ AsyncStorage |

---

## Files Changed Summary

### Modified Files (3):
1. `web-member-rn/app/index.tsx` - Added auth state check
2. `web-member-rn/src/contexts/AuthContext.tsx` - Fixed error handling
3. `web-member-rn/app/(member)/_layout.tsx` - Added FamilyProvider

### Created Files (1):
1. `web-member-rn/src/contexts/FamilyContext.tsx` - New family management context

---

## Next Steps (Recommended)

### Additional Enhancements:
1. **Token Refresh Mechanism**
   - Implement automatic token refresh before expiry
   - Add refresh token support

2. **Better Offline Support**
   - Cache more data for offline usage
   - Implement sync when back online

3. **Profile Photo Support**
   - Add avatar upload in family context
   - Display user avatars in member switcher

4. **Session Timeout Warning**
   - Warn user before session expires
   - Offer to extend session

---

## Migration Notes

**For Existing Users:**
- No migration needed - fixes are backward compatible
- Existing tokens will continue to work
- Users will need to login again only if token is expired

**For Developers:**
- Import `useFamily` hook to access family member data
- Use `viewingUserId` to filter data by active member
- Use `setActiveMember` to switch between family members

---

*Last Updated: January 28, 2025*
