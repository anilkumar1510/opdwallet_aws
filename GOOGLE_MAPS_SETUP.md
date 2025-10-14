# Google Maps API Integration

## Overview

The location service has been updated to use **Google Maps Geocoding API** instead of OpenStreetMap Nominatim.

## Benefits

- **Better India Coverage**: Superior accuracy for Indian addresses, pincodes, and landmarks
- **Higher Rate Limits**: Much better than OpenStreetMap's 1 req/sec limit
- **Formatted Addresses**: Returns properly formatted addresses
- **Professional Grade**: Official Google service with SLA guarantees
- **Free Tier**: $200/month credit (~28,000 map loads, 40,000 geocoding requests)

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Geocoding API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key

### 2. Restrict API Key (Security Best Practice)

1. Click on your API key to edit
2. Under **API restrictions**, select "Restrict key"
3. Enable only: **Geocoding API**
4. Under **Application restrictions**, add your server IP or domain

### 3. Configure Environment Variables

#### For Docker (Production/Development)
Edit `.env.docker` file:
```bash
GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

#### For Local Development
Edit `api/.env.development` file:
```bash
GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

### 4. Restart Services

```bash
# For Docker
docker-compose restart api

# For local development
# Just restart your npm run start:dev
```

## API Endpoints

The location service provides the following endpoints:

### Reverse Geocoding (Coordinates → Address)
```
GET /api/location/reverse-geocode?lat=28.7041&lng=77.1025
```

**Response:**
```json
{
  "pincode": "110001",
  "city": "New Delhi",
  "state": "Delhi",
  "country": "India",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "formattedAddress": "Connaught Place, New Delhi, Delhi 110001, India"
}
```

### Forward Geocoding (Address → Coordinates)
```
GET /api/location/geocode?query=Connaught Place Delhi
```

**Response:**
```json
{
  "pincode": "110001",
  "city": "New Delhi",
  "state": "Delhi",
  "country": "India",
  "latitude": 28.6328,
  "longitude": 77.2197,
  "formattedAddress": "Connaught Place, New Delhi, Delhi 110001, India"
}
```

## Features

### Caching
- Built-in memory cache for geocoding results
- Reduces API calls and improves performance
- Cache key based on coordinates or search query

### India Optimization
- Automatic "India" suffix for searches
- Country restriction to India (region: 'in')
- Better handling of Indian pincodes and districts

### Distance Calculation
- Uses Haversine formula (no API calls needed)
- Returns distance in kilometers
- Maintained from previous implementation

```typescript
const distance = locationService.calculateDistance(
  lat1, lng1,
  lat2, lng2
);
// Returns: 12.5 (km)
```

## Usage in Code

```typescript
import { LocationService } from '@/modules/location/location.service';

// Inject in constructor
constructor(private locationService: LocationService) {}

// Reverse geocode
const result = await this.locationService.reverseGeocode(28.7041, 77.1025);

// Forward geocode
const result = await this.locationService.forwardGeocode('Mumbai');

// Calculate distance
const distance = this.locationService.calculateDistance(
  28.7041, 77.1025,  // Point A
  19.0760, 72.8777   // Point B
);
```

## Cost Estimation

### Free Tier Limits
- $200 credit per month
- ~28,000 map loads (if using Maps JS API later)
- ~40,000 geocoding requests per month

### Expected Usage for OPD Wallet
- Assuming 1,000 active users/day
- ~10,000 geocoding requests/month
- **Well within free tier** ✅

### Monitoring
Check usage at: [Google Cloud Console → APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard)

## Troubleshooting

### API Key Not Working
- Check if Geocoding API is enabled in Google Cloud Console
- Verify API key restrictions allow your IP/domain
- Check API key is correctly set in environment variables
- Restart the API service after updating env vars

### "API key not configured" Warning
If you see this in logs:
```
⚠️ Google Maps API key not configured
```
- Update `GOOGLE_MAPS_API_KEY` in `.env.docker` or `api/.env.development`
- Make sure it's not set to placeholder value `your-google-maps-api-key-here`

### Rate Limit Errors
If you exceed free tier:
- Implement Redis-based persistent caching
- Reduce unnecessary geocoding calls
- Consider upgrading to paid tier

## Files Changed

- `api/src/modules/location/location.service.ts` - Complete rewrite with Google Maps
- `api/src/modules/location/location.module.ts` - Added ConfigModule import
- `api/package.json` - Added `@googlemaps/google-maps-services-js` dependency
- `.env.docker` - Added GOOGLE_MAPS_API_KEY
- `api/.env.development` - Added GOOGLE_MAPS_API_KEY
- `docker-compose.yml` - Added GOOGLE_MAPS_API_KEY to API service environment

## Next Steps

1. **Get API Key** from Google Cloud Console
2. **Update environment files** with actual API key
3. **Test endpoints** to verify functionality
4. **Monitor usage** in Google Cloud Console
5. **(Optional) Add Maps JS API** for interactive map UI later
