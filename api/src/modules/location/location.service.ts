import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface GeocodingResult {
  pincode: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly geocodingCache = new Map<string, GeocodingResult>();

  /**
   * Reverse geocode: Convert lat/lng to address with pincode
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `${latitude},${longitude}`;

    if (this.geocodingCache.has(cacheKey)) {
      this.logger.log(`[ReverseGeocode] Cache hit for ${cacheKey}`);
      return this.geocodingCache.get(cacheKey) || null;
    }

    try {
      this.logger.log(`[ReverseGeocode] Fetching for lat=${latitude}, lng=${longitude}`);

      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'OPDWallet/1.0',
        },
      });

      const address = response.data.address;

      const result: GeocodingResult = {
        pincode: address.postcode || '',
        city: address.city || address.town || address.village || address.county || '',
        state: address.state || '',
        country: address.country || 'India',
        latitude,
        longitude,
      };

      this.logger.log(`[ReverseGeocode] Success: ${JSON.stringify(result)}`);
      this.geocodingCache.set(cacheKey, result);

      return result;
    } catch (error) {
      this.logger.error(`[ReverseGeocode] Failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Forward geocode: Convert address/city to coordinates and pincode
   */
  async forwardGeocode(query: string): Promise<GeocodingResult | null> {
    const cacheKey = `query:${query.toLowerCase()}`;

    if (this.geocodingCache.has(cacheKey)) {
      this.logger.log(`[ForwardGeocode] Cache hit for ${query}`);
      return this.geocodingCache.get(cacheKey) || null;
    }

    try {
      this.logger.log(`[ForwardGeocode] Fetching for query="${query}"`);

      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query + ', India',
          format: 'json',
          addressdetails: 1,
          limit: 1,
        },
        headers: {
          'User-Agent': 'OPDWallet/1.0',
        },
      });

      if (!response.data || response.data.length === 0) {
        this.logger.warn(`[ForwardGeocode] No results for query="${query}"`);
        return null;
      }

      const result = response.data[0];
      const address = result.address;

      const geocodingResult: GeocodingResult = {
        pincode: address.postcode || '',
        city: address.city || address.town || address.village || address.county || '',
        state: address.state || '',
        country: address.country || 'India',
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };

      this.logger.log(`[ForwardGeocode] Success: ${JSON.stringify(geocodingResult)}`);
      this.geocodingCache.set(cacheKey, geocodingResult);

      return geocodingResult;
    } catch (error) {
      this.logger.error(`[ForwardGeocode] Failed: ${error.message}`);
      return null;
    }
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
