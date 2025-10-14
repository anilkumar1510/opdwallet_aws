# Location Search - Google Maps Implementation Plan

**Date:** October 10, 2025
**Objective:** Convert all location search functionality to use Google Maps API exclusively

---

## EXECUTIVE SUMMARY

**Problem:** City search autocomplete uses OpenStreetMap instead of Google Maps
**Solution:** Add Google Maps autocomplete endpoint + update frontend
**Impact:** 100% Google Maps coverage for all location features
**Estimated Time:** 3-4 hours

---

## IMPLEMENTATION PHASES

### PHASE 1: Backend - Add Autocomplete Method to LocationService ✅

**File:** `api/src/modules/location/location.service.ts`

**Add New Method After `forwardGeocode()`:**

```typescript
/**
 * Search for location suggestions using Google Maps API
 * Returns multiple results for autocomplete functionality
 */
async searchLocations(query: string, limit: number = 5): Promise<GeocodingResult[]> {
  const cacheKey = `search:${query.toLowerCase()}:${limit}`;

  // Check cache first
  if (this.geocodingCache.has(cacheKey)) {
    this.logger.log(`[SearchLocations] Cache hit for ${query}`);
    return JSON.parse(this.geocodingCache.get(cacheKey) || '[]');
  }

  try {
    this.logger.log(`[SearchLocations] Searching Google Maps for query="${query}"`);

    // Add India bias for better results
    const searchQuery = query.includes('India') ? query : `${query}, India`;

    const response = await this.googleMapsClient.geocode({
      params: {
        address: searchQuery,
        key: this.apiKey,
        region: 'in', // India region bias
        components: { country: 'IN' }, // Restrict to India
      },
    });

    if (!response.data.results || response.data.results.length === 0) {
      this.logger.warn(`[SearchLocations] No results for query="${query}"`);
      return [];
    }

    // Parse up to 'limit' results
    const results = response.data.results
      .slice(0, limit)
      .map((result) => {
        const location = result.geometry.location;
        return this.parseGoogleGeocodeResult(result, location.lat, location.lng);
      });

    this.logger.log(`[SearchLocations] Found ${results.length} results`);

    // Cache results (store as JSON string since cache is Map<string, GeocodingResult>)
    this.geocodingCache.set(cacheKey, JSON.stringify(results));

    return results;
  } catch (error: any) {
    this.logger.error(`[SearchLocations] Failed: ${error.message}`);
    return [];
  }
}
```

**Why This Works:**
- Uses existing `googleMapsClient.geocode()` method
- Returns multiple results (up to `limit`)
- Cached for performance
- India-biased for accurate results
- Reuses existing `parseGoogleGeocodeResult()` parser

---

### PHASE 2: Backend - Add Autocomplete Endpoint ✅

**File:** `api/src/modules/location/location.controller.ts`

**Add New Endpoint After `forwardGeocode()`:**

```typescript
@Get('autocomplete')
async searchLocations(
  @Query('query') query: string,
  @Query('limit') limit?: string,
) {
  if (!query || query.trim().length === 0) {
    return { error: 'Query is required' };
  }

  // Require at least 2 characters for autocomplete
  if (query.trim().length < 2) {
    return [];
  }

  const maxLimit = limit ? parseInt(limit, 10) : 5;
  const results = await this.locationService.searchLocations(query, maxLimit);

  return results;
}
```

**Endpoint Specification:**
- **URL:** `GET /api/location/autocomplete`
- **Query Params:**
  - `query` (required): Search term, min 2 characters
  - `limit` (optional): Max results, default 5
- **Response:** Array of `GeocodingResult` objects
- **Example:** `/api/location/autocomplete?query=Bangalore&limit=5`

---

### PHASE 3: Frontend - Update City Search Implementation ✅

**File:** `web-member/app/member/appointments/doctors/page.tsx`

#### Step 3.1: Update City Search useEffect (Replace Lines 370-407)

**BEFORE (OpenStreetMap):**
```typescript
useEffect(() => {
  if (citySearch.trim().length < 2) return

  const timer = setTimeout(async () => {
    setSearchingCity(true)
    try {
      // ❌ OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citySearch + ', India')}&format=json&addressdetails=1&limit=5`,
        { headers: { 'User-Agent': 'OPDWallet/1.0' } }
      )
      const data = await response.json()
      setCitySuggestions(data)
      setShowCitySuggestions(data.length > 0)
    } catch (error) {
      console.error('[Doctors] City search error:', error)
      setLocationError('Failed to search cities')
    } finally {
      setSearchingCity(false)
    }
  }, 300)

  return () => clearTimeout(timer)
}, [citySearch])
```

**AFTER (Google Maps):**
```typescript
useEffect(() => {
  if (citySearch.trim().length < 2) return

  const timer = setTimeout(async () => {
    setSearchingCity(true)
    try {
      console.log('[Doctors] Searching for city:', citySearch)

      // ✅ Google Maps API via backend
      const response = await fetch(
        `/api/location/autocomplete?query=${encodeURIComponent(citySearch)}&limit=5`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Failed to search locations')
      }

      const data = await response.json()
      console.log('[Doctors] City search results:', data)

      setCitySuggestions(data)
      setShowCitySuggestions(Array.isArray(data) && data.length > 0)
    } catch (error) {
      console.error('[Doctors] City search error:', error)
      setLocationError('Failed to search cities')
      setCitySuggestions([])
      setShowCitySuggestions(false)
    } finally {
      setSearchingCity(false)
    }
  }, 300) // 300ms debounce

  return () => clearTimeout(timer)
}, [citySearch])
```

**Changes:**
- ✅ Calls `/api/location/autocomplete` instead of OSM
- ✅ Uses Google Maps API via backend
- ✅ Better error handling
- ✅ Same debounce timing (300ms)

---

#### Step 3.2: Update City Selection Handler (Replace Lines 322-368)

**BEFORE (OSM → Google Maps):**
```typescript
const handleCitySelect = useCallback(async (city: any) => {
  setSearchingCity(true)
  setLocationError('')
  setCitySearch(city.display_name) // OSM format
  setShowCitySuggestions(false)

  try {
    // Get coordinates from OSM result
    const latitude = parseFloat(city.lat)
    const longitude = parseFloat(city.lon)

    // Then call Google Maps reverse geocode
    const response = await fetch(
      `/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`
    )

    const data = await response.json()

    if (data.pincode) {
      setPincode(data.pincode)
      const locationText = [data.city, data.state].filter(Boolean).join(', ')
      setLocationName(locationText)
      localStorage.setItem('userPincode', data.pincode)
      localStorage.setItem('userLocation', locationText)
      setShowCityInput(false)
      setCitySearch('')
    } else {
      setLocationError('Could not find pincode for this location')
    }
  } catch (error) {
    setLocationError('Failed to get location details')
  } finally {
    setSearchingCity(false)
  }
}, [])
```

**AFTER (Direct Google Maps - No Second API Call Needed):**
```typescript
const handleCitySelect = useCallback(async (location: any) => {
  setSearchingCity(true)
  setLocationError('')
  setShowCitySuggestions(false)

  try {
    console.log('[Doctors] Selected location:', location)

    // Google Maps result already has everything we need!
    if (location.pincode) {
      setPincode(location.pincode)

      // Format location name
      const locationText = [location.city, location.state]
        .filter(Boolean)
        .join(', ')

      setLocationName(locationText)
      setCitySearch(location.formattedAddress || locationText)

      // Save to localStorage
      localStorage.setItem('userPincode', location.pincode)
      localStorage.setItem('userLocation', locationText)

      // Close city search input
      setShowCityInput(false)
      setCitySearch('')

      console.log('[Doctors] Location set:', { pincode: location.pincode, location: locationText })
    } else {
      setLocationError('Could not find pincode for this location')
    }
  } catch (error) {
    console.error('[Doctors] City selection error:', error)
    setLocationError('Failed to set location')
  } finally {
    setSearchingCity(false)
  }
}, [])
```

**Changes:**
- ✅ No second API call needed (pincode already in response)
- ✅ Uses `location.formattedAddress` from Google Maps
- ✅ Simplified logic (one-step process)
- ✅ Better performance (50% fewer API calls)

---

#### Step 3.3: Update Suggestions Dropdown UI (Replace Lines 583-600)

**BEFORE (OSM format):**
```typescript
{showCitySuggestions && citySuggestions.length > 0 && (
  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
    {citySuggestions.map((city, index) => (
      <button
        key={index}
        onClick={() => handleCitySelect(city)}
        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
      >
        <div className="font-medium text-sm text-gray-900">
          {city.address?.city || city.address?.town || city.address?.village || city.name}
        </div>
        <div className="text-xs text-gray-500 line-clamp-1">
          {city.display_name}
        </div>
      </button>
    ))}
  </div>
)}
```

**AFTER (Google Maps format):**
```typescript
{showCitySuggestions && citySuggestions.length > 0 && (
  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
    {citySuggestions.map((location, index) => (
      <button
        key={index}
        onClick={() => handleCitySelect(location)}
        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
      >
        <div className="font-medium text-sm text-gray-900">
          {location.city}
          {location.pincode && ` - ${location.pincode}`}
        </div>
        <div className="text-xs text-gray-500 line-clamp-1">
          {location.formattedAddress}
        </div>
      </button>
    ))}
  </div>
)}
```

**Changes:**
- ✅ Uses `location.city` instead of complex OSM parsing
- ✅ Shows pincode directly in suggestion
- ✅ Uses `location.formattedAddress` from Google Maps
- ✅ Cleaner, simpler display

---

### PHASE 4: Testing Checklist ✅

#### Test Case 1: Manual Pincode Entry
- [ ] Enter "560001" → Should save to localStorage
- [ ] Doctors list should filter by pincode
- [ ] Location name should appear below input
- [ ] Clear button should work

#### Test Case 2: Use Current Location
- [ ] Click "📍 Use Current" → Should request browser permission
- [ ] Should show "Locating..." loading state
- [ ] Should call `/api/location/reverse-geocode` (Google Maps)
- [ ] Should display city name (e.g., "Bangalore, Karnataka")
- [ ] Should set pincode and filter doctors
- [ ] Should save to localStorage

#### Test Case 3: Search by City Name
- [ ] Click "Or search by city name"
- [ ] Type "Ban" → Should show loading spinner
- [ ] After 300ms → Should call `/api/location/autocomplete?query=Ban`
- [ ] Should show dropdown with 5 Google Maps suggestions
- [ ] Each suggestion should show: City name, pincode, formatted address
- [ ] Click a suggestion → Should set pincode immediately (no second API call)
- [ ] Should return to pincode input mode
- [ ] Should save to localStorage

#### Test Case 4: Edge Cases
- [ ] Type 1 character → Should not trigger search
- [ ] Type 2+ characters → Should trigger search
- [ ] API error → Should show error message
- [ ] No results → Should show "No results" or empty dropdown
- [ ] Network error → Should handle gracefully

#### Test Case 5: Console Verification
- [ ] Check browser console: No OSM URLs
- [ ] Check browser console: All `/api/location/*` calls successful
- [ ] Check API logs: Google Maps API calls logged
- [ ] No errors in console
- [ ] No mixed content warnings

---

### PHASE 5: Cleanup ✅

#### Remove OSM Code
```typescript
// ❌ DELETE THIS - No longer needed
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?...`,
  { headers: { 'User-Agent': 'OPDWallet/1.0' } }
)
```

#### Update Comments
```typescript
// BEFORE: "Use Nominatim search API directly"
// AFTER: "Use Google Maps Autocomplete API via backend"
```

#### Verify No Direct API Calls
- [ ] Search codebase for "nominatim"
- [ ] Search codebase for "openstreetmap"
- [ ] Confirm all location features use `/api/location/*` endpoints

---

## VERIFICATION STEPS

### Step 1: Check Backend API
```bash
# Test autocomplete endpoint
curl "http://localhost:4000/api/location/autocomplete?query=Bangalore" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
[
  {
    "pincode": "560001",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "formattedAddress": "Bangalore, Karnataka 560001, India"
  },
  ...
]
```

### Step 2: Check Frontend Integration
1. Open browser DevTools → Network tab
2. Navigate to doctors page
3. Click "Or search by city name"
4. Type "Bangalore"
5. Verify:
   - ✅ Request to `/api/location/autocomplete?query=Bangalore`
   - ✅ Response shows Google Maps formatted results
   - ✅ No requests to nominatim.openstreetmap.org
   - ✅ Dropdown shows 5 suggestions with pincodes

### Step 3: Check Backend Logs
```bash
# Watch API logs
cd api && npm run start:dev

# Look for:
✅ [SearchLocations] Searching Google Maps for query="Bangalore"
✅ [SearchLocations] Found 5 results
```

---

## ROLLBACK PLAN

If issues occur, revert changes:

1. **Backend:** Remove `searchLocations()` and `autocomplete` endpoint
2. **Frontend:** Restore OSM code from git history
3. **Test:** Verify OSM search still works

**Git Commands:**
```bash
# View specific file from previous commit
git show HEAD:web-member/app/member/appointments/doctors/page.tsx

# Restore file
git checkout HEAD -- web-member/app/member/appointments/doctors/page.tsx
```

---

## SUCCESS CRITERIA

✅ **Backend:**
- New `searchLocations()` method works
- New `/api/location/autocomplete` endpoint returns results
- Google Maps API is called successfully
- Results are cached

✅ **Frontend:**
- City search uses `/api/location/autocomplete`
- Dropdown shows Google Maps results
- Selection sets pincode directly (no second API call)
- All location features use Google Maps

✅ **Testing:**
- All test cases pass
- No console errors
- No OSM API calls
- Performance is good (<500ms response time)

✅ **Documentation:**
- Analysis document created ✅
- Implementation plan created ✅
- Code comments updated
- README updated (if needed)

---

## ESTIMATED TIMELINE

- **Phase 1 (Backend Method):** 30 minutes
- **Phase 2 (Backend Endpoint):** 15 minutes
- **Phase 3 (Frontend Updates):** 45 minutes
- **Phase 4 (Testing):** 60 minutes
- **Phase 5 (Cleanup):** 15 minutes
- **Buffer:** 15 minutes

**Total: 3 hours**

---

## NEXT STEPS

1. ✅ Review this implementation plan
2. ⏳ Start Phase 1: Add backend autocomplete method
3. ⏳ Continue with Phase 2-5 sequentially
4. ⏳ Test thoroughly
5. ⏳ Deploy to production

---

**Ready to execute? Let's start with Phase 1!**
