import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';

export interface GeocodingResult {
  pincode: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly geocodingCache = new Map<string, GeocodingResult | GeocodingResult[]>();
  private readonly googleMapsClient: Client;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.googleMapsClient = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';

    if (!this.apiKey || this.apiKey === 'your-google-maps-api-key-here') {
      this.logger.warn('⚠️ Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in environment variables.');
    } else {
      this.logger.log('✅ Google Maps API initialized successfully');
    }
  }

  /**
   * Reverse geocode: Convert lat/lng to address with pincode using Google Maps API
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `${latitude},${longitude}`;

    if (this.geocodingCache.has(cacheKey)) {
      this.logger.log(`[ReverseGeocode] Cache hit for ${cacheKey}`);
      const cached = this.geocodingCache.get(cacheKey);
      return (cached && !Array.isArray(cached)) ? cached : null;
    }

    try {
      this.logger.log(`[ReverseGeocode] Fetching from Google Maps for lat=${latitude}, lng=${longitude}`);

      const response = await this.googleMapsClient.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          key: this.apiKey,
        },
      });

      if (!response.data.results || response.data.results.length === 0) {
        this.logger.warn(`[ReverseGeocode] No results found for coordinates`);
        return null;
      }

      const result = this.parseGoogleGeocodeResult(response.data.results[0], latitude, longitude);

      this.logger.log(`[ReverseGeocode] Success: ${JSON.stringify(result)}`);
      this.geocodingCache.set(cacheKey, result);

      return result;
    } catch (error: any) {
      this.logger.error(`[ReverseGeocode] Failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Forward geocode: Convert address/city to coordinates and pincode using Google Maps API
   * If pincode is missing from forward geocode, performs reverse geocode to get detailed info
   */
  async forwardGeocode(query: string): Promise<GeocodingResult | null> {
    const cacheKey = `query:${query.toLowerCase()}`;

    if (this.geocodingCache.has(cacheKey)) {
      this.logger.log(`[ForwardGeocode] Cache hit for ${query}`);
      const cached = this.geocodingCache.get(cacheKey);
      return (cached && !Array.isArray(cached)) ? cached : null;
    }

    try {
      this.logger.log(`[ForwardGeocode] Fetching from Google Maps for query="${query}"`);

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
        this.logger.warn(`[ForwardGeocode] No results for query="${query}"`);
        return null;
      }

      const firstResult = response.data.results[0];
      const location = firstResult.geometry.location;
      let result = this.parseGoogleGeocodeResult(firstResult, location.lat, location.lng);

      // If pincode is missing, try reverse geocode to get more detailed information
      if (!result.pincode && location.lat && location.lng) {
        this.logger.log(`[ForwardGeocode] No pincode found, attempting reverse geocode for coordinates`);

        try {
          const reverseResult = await this.reverseGeocode(location.lat, location.lng);
          if (reverseResult && reverseResult.pincode) {
            // Merge results, preferring city/state from forward geocode but taking pincode from reverse
            result = {
              ...result,
              pincode: reverseResult.pincode,
              // Update formatted address if reverse geocode has better detail
              formattedAddress: reverseResult.formattedAddress || result.formattedAddress,
            };
            this.logger.log(`[ForwardGeocode] Enhanced with pincode from reverse geocode: ${result.pincode}`);
          }
        } catch (reverseError: any) {
          this.logger.warn(`[ForwardGeocode] Reverse geocode fallback failed: ${reverseError.message}`);
          // Continue with original result even if reverse geocode fails
        }
      }

      this.logger.log(`[ForwardGeocode] Success: ${JSON.stringify(result)}`);
      this.geocodingCache.set(cacheKey, result);

      return result;
    } catch (error: any) {
      this.logger.error(`[ForwardGeocode] Failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Search for location suggestions using Google Maps API
   * Returns multiple results for autocomplete functionality
   * Similar to Google Maps Places Autocomplete
   */
  async searchLocations(query: string, limit: number = 5): Promise<GeocodingResult[]> {
    const cacheKey = `search:${query.toLowerCase()}:${limit}`;

    // Check cache first
    const cached = this.geocodingCache.get(cacheKey);
    if (cached) {
      this.logger.log(`[SearchLocations] Cache hit for "${query}"`);
      return Array.isArray(cached) ? cached : [];
    }

    try {
      this.logger.log(`[SearchLocations] Searching Google Maps for query="${query}", limit=${limit}`);

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

      // Parse up to 'limit' results and enhance with reverse geocode if needed
      const results = await Promise.all(
        response.data.results
          .slice(0, limit)
          .map(async (result) => {
            const location = result.geometry.location;
            let parsedResult = this.parseGoogleGeocodeResult(result, location.lat, location.lng);

            // If pincode is missing, try reverse geocode
            if (!parsedResult.pincode && location.lat && location.lng) {
              try {
                const reverseResult = await this.reverseGeocode(location.lat, location.lng);
                if (reverseResult && reverseResult.pincode) {
                  parsedResult = {
                    ...parsedResult,
                    pincode: reverseResult.pincode,
                    formattedAddress: reverseResult.formattedAddress || parsedResult.formattedAddress,
                  };
                }
              } catch (err) {
                // Silently continue if reverse geocode fails
              }
            }

            return parsedResult;
          })
      );

      this.logger.log(`[SearchLocations] Found ${results.length} results for "${query}"`);

      // Cache results
      this.geocodingCache.set(cacheKey, results);

      return results;
    } catch (error: any) {
      this.logger.error(`[SearchLocations] Failed for "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Parse Google Maps geocoding result into our GeocodingResult format
   */
  private parseGoogleGeocodeResult(
    result: any,
    latitude: number,
    longitude: number,
  ): GeocodingResult {
    let pincode = '';
    let city = '';
    let state = '';
    let country = '';

    // Extract address components
    result.address_components.forEach((component: any) => {
      if (component.types.includes('postal_code')) {
        pincode = component.long_name;
      }
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_2') && !city) {
        city = component.long_name; // District as fallback
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
      }
    });

    return {
      pincode,
      city,
      state,
      country: country || 'India',
      latitude,
      longitude,
      formattedAddress: result.formatted_address,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
