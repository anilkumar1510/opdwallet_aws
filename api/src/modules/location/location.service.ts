import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';
import * as https from 'https';
import * as dns from 'dns';

// Force IPv4 for DNS resolution (fixes Docker container IPv6 issues)
dns.setDefaultResultOrder('ipv4first');

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
  private googleMapsWorking = true; // Track if Google Maps is working

  constructor(private configService: ConfigService) {
    this.googleMapsClient = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';

    // Disable Google Maps - use Nominatim directly for faster responses
    // Google Maps can be re-enabled by setting ENABLE_GOOGLE_MAPS=true in env
    const enableGoogleMaps = this.configService.get<string>('ENABLE_GOOGLE_MAPS') === 'true';

    if (!enableGoogleMaps || !this.apiKey || this.apiKey === 'your-google-maps-api-key-here') {
      this.logger.log('📍 Using OpenStreetMap Nominatim for geocoding (fast, free)');
      this.googleMapsWorking = false;
    } else {
      this.logger.log('✅ Google Maps API enabled (with OpenStreetMap fallback)');
    }
  }

  /**
   * Helper function to make HTTPS GET requests
   * Forces IPv4 to avoid Docker container IPv6 routing issues
   */
  private httpsGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'OPDWallet/1.0 (contact@opdwallet.com)',
        },
        family: 4, // Force IPv4
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON response'));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  /**
   * Reverse geocode using OpenStreetMap Nominatim (free fallback)
   */
  private async reverseGeocodeNominatim(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      this.logger.log(`[ReverseGeocode-Nominatim] Fetching for lat=${latitude}, lng=${longitude}`);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`;
      const data = await this.httpsGet(url);

      if (!data || !data.address) {
        this.logger.warn(`[ReverseGeocode-Nominatim] No address found`);
        return null;
      }

      const address = data.address;
      const result: GeocodingResult = {
        pincode: address.postcode || '',
        city: address.city || address.town || address.village || address.county || address.state_district || '',
        state: address.state || '',
        country: address.country || 'India',
        latitude,
        longitude,
        formattedAddress: data.display_name || '',
      };

      this.logger.log(`[ReverseGeocode-Nominatim] Success: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(`[ReverseGeocode-Nominatim] Failed: ${error.message || String(error)}`);
      return null;
    }
  }

  /**
   * Reverse geocode: Convert lat/lng to address with pincode
   * Uses Google Maps API with OpenStreetMap Nominatim as fallback
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `${latitude},${longitude}`;

    if (this.geocodingCache.has(cacheKey)) {
      this.logger.log(`[ReverseGeocode] Cache hit for ${cacheKey}`);
      const cached = this.geocodingCache.get(cacheKey);
      return (cached && !Array.isArray(cached)) ? cached : null;
    }

    // Try Google Maps first if it's working
    if (this.googleMapsWorking && this.apiKey) {
      try {
        this.logger.log(`[ReverseGeocode] Fetching from Google Maps for lat=${latitude}, lng=${longitude}`);

        const response = await this.googleMapsClient.reverseGeocode({
          params: {
            latlng: { lat: latitude, lng: longitude },
            key: this.apiKey,
          },
        });

        if (response.data.results && response.data.results.length > 0) {
          const result = this.parseGoogleGeocodeResult(response.data.results[0], latitude, longitude);
          this.logger.log(`[ReverseGeocode] Google Maps success: ${JSON.stringify(result)}`);
          this.geocodingCache.set(cacheKey, result);
          return result;
        }
      } catch (error: any) {
        this.logger.warn(`[ReverseGeocode] Google Maps failed: ${error.message}. Falling back to Nominatim.`);
        // Mark Google Maps as not working to skip it on future calls
        if (error.message?.includes('403') || error.message?.includes('REQUEST_DENIED')) {
          this.googleMapsWorking = false;
          this.logger.warn(`[ReverseGeocode] Google Maps API disabled, will use Nominatim for all requests`);
        }
      }
    }

    // Fallback to Nominatim
    const result = await this.reverseGeocodeNominatim(latitude, longitude);
    if (result) {
      this.geocodingCache.set(cacheKey, result);
    }
    return result;
  }

  /**
   * Forward geocode using OpenStreetMap Nominatim (free fallback)
   */
  private async forwardGeocodeNominatim(query: string): Promise<GeocodingResult | null> {
    try {
      const searchQuery = query.includes('India') ? query : `${query}, India`;
      this.logger.log(`[ForwardGeocode-Nominatim] Searching for "${searchQuery}"`);

      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=1&countrycodes=in&accept-language=en`;
      const data = await this.httpsGet(url);

      this.logger.log(`[ForwardGeocode-Nominatim] Response data length: ${data?.length || 0}`);

      if (!data || data.length === 0) {
        this.logger.warn(`[ForwardGeocode-Nominatim] No results for "${query}"`);
        return null;
      }

      const firstResult = data[0];
      const address = firstResult.address || {};
      const result: GeocodingResult = {
        pincode: address.postcode || '',
        city: address.city || address.town || address.village || address.county || address.state_district || '',
        state: address.state || '',
        country: address.country || 'India',
        latitude: parseFloat(firstResult.lat),
        longitude: parseFloat(firstResult.lon),
        formattedAddress: firstResult.display_name || '',
      };

      this.logger.log(`[ForwardGeocode-Nominatim] Success: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(`[ForwardGeocode-Nominatim] Failed: ${error.message || String(error)}`);
      return null;
    }
  }

  /**
   * Forward geocode: Convert address/city to coordinates and pincode
   * Uses Google Maps API with OpenStreetMap Nominatim as fallback
   */
  async forwardGeocode(query: string): Promise<GeocodingResult | null> {
    const cacheKey = `query:${query.toLowerCase()}`;

    if (this.geocodingCache.has(cacheKey)) {
      this.logger.log(`[ForwardGeocode] Cache hit for ${query}`);
      const cached = this.geocodingCache.get(cacheKey);
      return (cached && !Array.isArray(cached)) ? cached : null;
    }

    // Try Google Maps first if it's working
    if (this.googleMapsWorking && this.apiKey) {
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

        if (response.data.results && response.data.results.length > 0) {
          const firstResult = response.data.results[0];
          const location = firstResult.geometry.location;
          let result = this.parseGoogleGeocodeResult(firstResult, location.lat, location.lng);

          // If pincode is missing, try reverse geocode to get more detailed information
          if (!result.pincode && location.lat && location.lng) {
            this.logger.log(`[ForwardGeocode] No pincode found, attempting reverse geocode`);
            const reverseResult = await this.reverseGeocode(location.lat, location.lng);
            if (reverseResult && reverseResult.pincode) {
              result = {
                ...result,
                pincode: reverseResult.pincode,
                formattedAddress: reverseResult.formattedAddress || result.formattedAddress,
              };
            }
          }

          this.logger.log(`[ForwardGeocode] Google Maps success: ${JSON.stringify(result)}`);
          this.geocodingCache.set(cacheKey, result);
          return result;
        }
      } catch (error: any) {
        this.logger.warn(`[ForwardGeocode] Google Maps failed: ${error.message}. Falling back to Nominatim.`);
        if (error.message?.includes('403') || error.message?.includes('REQUEST_DENIED')) {
          this.googleMapsWorking = false;
        }
      }
    }

    // Fallback to Nominatim
    let result = await this.forwardGeocodeNominatim(query);

    // If pincode is missing, try reverse geocode
    if (result && !result.pincode && result.latitude && result.longitude) {
      const reverseResult = await this.reverseGeocodeNominatim(result.latitude, result.longitude);
      if (reverseResult && reverseResult.pincode) {
        result = {
          ...result,
          pincode: reverseResult.pincode,
        };
      }
    }

    if (result) {
      this.geocodingCache.set(cacheKey, result);
    }
    return result;
  }

  /**
   * Search for location suggestions using OpenStreetMap Nominatim (free fallback)
   */
  private async searchLocationsNominatim(query: string, limit: number): Promise<GeocodingResult[]> {
    try {
      const searchQuery = query.includes('India') ? query : `${query}, India`;
      this.logger.log(`[SearchLocations-Nominatim] Searching for "${searchQuery}", limit=${limit}`);

      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=${limit}&countrycodes=in&accept-language=en`;
      const data = await this.httpsGet(url);

      if (!data || data.length === 0) {
        this.logger.warn(`[SearchLocations-Nominatim] No results for "${query}"`);
        return [];
      }

      const results: GeocodingResult[] = data.map((item: any) => {
        const address = item.address || {};
        return {
          pincode: address.postcode || '',
          city: address.city || address.town || address.village || address.county || address.state_district || '',
          state: address.state || '',
          country: address.country || 'India',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          formattedAddress: item.display_name || '',
        };
      });

      this.logger.log(`[SearchLocations-Nominatim] Found ${results.length} results`);
      return results;
    } catch (error: any) {
      this.logger.error(`[SearchLocations-Nominatim] Failed: ${error.message || String(error)}`);
      return [];
    }
  }

  /**
   * Search for location suggestions
   * Uses Google Maps API with OpenStreetMap Nominatim as fallback
   */
  async searchLocations(query: string, limit: number = 5): Promise<GeocodingResult[]> {
    const cacheKey = `search:${query.toLowerCase()}:${limit}`;

    // Check cache first
    const cached = this.geocodingCache.get(cacheKey);
    if (cached) {
      this.logger.log(`[SearchLocations] Cache hit for "${query}"`);
      return Array.isArray(cached) ? cached : [];
    }

    // Try Google Maps first if it's working
    if (this.googleMapsWorking && this.apiKey) {
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

        if (response.data.results && response.data.results.length > 0) {
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

          this.logger.log(`[SearchLocations] Google Maps found ${results.length} results`);
          this.geocodingCache.set(cacheKey, results);
          return results;
        }
      } catch (error: any) {
        this.logger.warn(`[SearchLocations] Google Maps failed: ${error.message}. Falling back to Nominatim.`);
        if (error.message?.includes('403') || error.message?.includes('REQUEST_DENIED')) {
          this.googleMapsWorking = false;
        }
      }
    }

    // Fallback to Nominatim
    const results = await this.searchLocationsNominatim(query, limit);
    if (results.length > 0) {
      this.geocodingCache.set(cacheKey, results);
    }
    return results;
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
