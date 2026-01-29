# Phase 4: Backend Verification - Testing Guide ✅

## Overview
Comprehensive testing checklist for backend implementation verification.

---

## 🧪 Testing Checklist

### 1. API Integration Tests

#### Wallet Balance API
- [ ] **Success Case**
  - Open dashboard
  - Check network tab for `/api/wallet/balance` call
  - Verify wallet data loads correctly
  - Check console for wallet data log

- [ ] **Error Case**
  - Turn off backend server
  - Refresh dashboard
  - Verify error message displays
  - Click "Retry" button
  - Verify retry attempts API call

- [ ] **Empty Data Case**
  - Test with user that has no wallet data
  - Verify app doesn't crash
  - Verify shows ₹0 balances

#### User Switching
- [ ] Switch to different family member
- [ ] Verify wallet data refreshes
- [ ] Verify new user's wallet data loads
- [ ] Check console for new userId in API call

---

### 2. Loading States

#### Initial Load
- [ ] **Cold Start**
  - Close and reopen app
  - Verify loader shows (after 200ms delay)
  - Verify smooth transition to content
  - No flicker or flash

- [ ] **Fast Load**
  - Refresh with fast network
  - Verify no loader flash (200ms delay working)
  - Content appears smoothly

- [ ] **Slow Load**
  - Throttle network to Slow 3G
  - Verify loader shows after 200ms
  - Verify loader remains until data loads

#### Pull-to-Refresh
- [ ] Pull down to refresh
- [ ] Verify refresh indicator shows
- [ ] Verify both profile and wallet data refresh
- [ ] Verify indicator dismisses after complete
- [ ] Verify data updates on screen

---

### 3. Error Handling

#### Network Errors
- [ ] **No Internet**
  - Turn off WiFi/Data
  - Pull to refresh
  - Verify error message shows
  - Turn on internet
  - Click "Retry"
  - Verify data loads

- [ ] **Server Error (500)**
  - Mock 500 response
  - Verify error message shows
  - Verify "Retry" button works

- [ ] **Timeout**
  - Set very slow network
  - Wait for timeout (30s)
  - Verify error handling

#### Auth Errors
- [ ] **401 Unauthorized**
  - Mock 401 response
  - Verify triggers logout
  - Verify redirects to login

- [ ] **403 Forbidden**
  - Mock 403 response
  - Verify error logged
  - Verify graceful degradation

---

### 4. Data Processing

#### Wallet Categories
- [ ] **Sorting**
  - Verify categories sorted by available balance
  - Highest balance should be first
  - Check console log for order

- [ ] **Calculations**
  - Verify totalAvailable = sum of category.available
  - Verify totalLimit = sum of category.total
  - Verify matches API totalBalance values

- [ ] **Currency Formatting**
  - Check amounts formatted with Indian separators
  - Example: 50000 → "50,000"
  - Example: 100000 → "1L" (short format)

#### Policy Data
- [ ] **Policy Cards**
  - Verify shows all family members
  - Verify policy numbers correct
  - Verify expiry dates formatted correctly
  - Verify corporate names display

- [ ] **Member Names**
  - Verify handles string names
  - Verify handles object names { firstName, lastName }
  - Verify no crashes on missing names

---

### 5. State Management

#### Memory Leaks
- [ ] Navigate away from dashboard
- [ ] Navigate back
- [ ] Repeat 10 times
- [ ] Verify no memory leaks
- [ ] Check cleanup functions run

#### State Persistence
- [ ] Load data
- [ ] Switch to another screen
- [ ] Return to dashboard
- [ ] Verify data still present (not refetched unnecessarily)

#### Concurrent Requests
- [ ] Rapidly switch between users
- [ ] Verify no race conditions
- [ ] Verify shows correct user's data
- [ ] Check console for request cancellation

---

### 6. Cross-Platform Testing

#### iOS
- [ ] Initial load
- [ ] Pull-to-refresh
- [ ] Error handling
- [ ] User switching
- [ ] Token authentication
- [ ] SecureStore working

#### Android
- [ ] Initial load
- [ ] Pull-to-refresh
- [ ] Error handling
- [ ] User switching
- [ ] Token authentication
- [ ] SecureStore working

#### Web
- [ ] Initial load
- [ ] Pull-to-refresh (mouse drag)
- [ ] Error handling
- [ ] User switching
- [ ] Token authentication
- [ ] localStorage working

---

### 7. Performance Tests

#### Load Time
- [ ] **Dashboard Load**
  - Measure time to interactive
  - Target: < 1 second (fast network)
  - Target: < 3 seconds (slow network)

- [ ] **API Response**
  - Measure wallet API response time
  - Target: < 500ms
  - Log in console

#### Optimization
- [ ] **useMemo**
  - Verify computed values don't recalculate unnecessarily
  - Add console logs to confirm

- [ ] **useCallback**
  - Verify handlers don't recreate on every render
  - Check with React DevTools Profiler

#### Memory
- [ ] Monitor memory usage
- [ ] No memory leaks after navigation
- [ ] Cleanup on unmount

---

### 8. Console Verification

#### Expected Logs
```
✅ "Wallet data fetched: { totalCurrent: 50000, totalAllocated: 100000, categoriesCount: 7 }"
✅ Network request: GET /api/wallet/balance?userId=...
✅ Status: 200
```

#### Error Logs
```
❌ "Failed to fetch wallet data: [error details]"
❌ "Refresh failed: [error details]"
```

#### No Errors
- [ ] No red errors in console
- [ ] No yellow warnings (except expected)
- [ ] No TypeScript errors

---

### 9. Integration Tests

#### With AuthContext
- [ ] Login flow
- [ ] Token stored correctly
- [ ] Token sent in API requests
- [ ] Logout clears token
- [ ] 401 triggers logout

#### With FamilyContext
- [ ] Profile data loaded
- [ ] Family members list correct
- [ ] Active member state synced
- [ ] viewingUserId updates trigger refresh

#### With Bottom Navigation
- [ ] Navigate to other tabs
- [ ] Return to dashboard
- [ ] Data persists correctly
- [ ] No unnecessary refetches

---

### 10. Edge Cases

#### Empty States
- [ ] No wallet categories
- [ ] No policies
- [ ] No family members
- [ ] All amounts = 0

#### Invalid Data
- [ ] Null/undefined wallet data
- [ ] Missing required fields
- [ ] Invalid date formats
- [ ] Negative amounts

#### User Flow
- [ ] New user (first time)
- [ ] Primary user with dependents
- [ ] Dependent user (limited access)
- [ ] User with expired policy

---

## 📊 Test Results Template

### Test Session Info
- **Date**: [Date]
- **Tester**: [Name]
- **Platform**: iOS / Android / Web
- **Environment**: Dev / Staging / Production

### Results
| Test Category | Pass | Fail | Notes |
|--------------|------|------|-------|
| API Integration | ✅ | ❌ | |
| Loading States | ✅ | ❌ | |
| Error Handling | ✅ | ❌ | |
| Data Processing | ✅ | ❌ | |
| State Management | ✅ | ❌ | |
| Cross-Platform | ✅ | ❌ | |
| Performance | ✅ | ❌ | |
| Console Logs | ✅ | ❌ | |
| Integration | ✅ | ❌ | |
| Edge Cases | ✅ | ❌ | |

### Issues Found
1. [Description]
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**:
   - **Expected**:
   - **Actual**:
   - **Fix**:

---

## 🔧 Debugging Tools

### Network Monitoring
```typescript
// Add to fetchWalletBalance in wallet.ts
console.log('Fetching wallet for userId:', userId);
console.time('wallet-api');
const response = await apiClient.get<WalletBalance>('/api/wallet/balance', { params: { userId } });
console.timeEnd('wallet-api');
console.log('Wallet response:', response.data);
```

### State Monitoring
```typescript
// Add to dashboard
useEffect(() => {
  console.log('Dashboard state:', {
    loading,
    showLoader,
    hasWalletData: !!walletData,
    error,
    refreshing,
    viewingUserId
  });
}, [loading, showLoader, walletData, error, refreshing, viewingUserId]);
```

### Performance Profiling
- Use React DevTools Profiler
- Enable "Highlight updates" in React DevTools
- Monitor render count and time
- Check for unnecessary re-renders

---

## ✅ Verification Checklist

Before marking Phase 4 complete:

- [ ] All API calls working
- [ ] Loading states working correctly
- [ ] Error handling robust
- [ ] Pull-to-refresh functional
- [ ] Data processing accurate
- [ ] User switching works
- [ ] No console errors
- [ ] Cross-platform tested
- [ ] Performance acceptable
- [ ] Edge cases handled

---

## 🎯 Phase 4 Status

**Backend Verification**: ⏳ **IN PROGRESS**

**Next**: User Testing Request (Phase 5)
