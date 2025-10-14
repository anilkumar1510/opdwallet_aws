import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Test endpoint without auth - can be removed after testing
  @Get('test-geocode')
  async testGeocode(@Query('query') query: string) {
    if (!query) {
      query = 'Connaught Place, Delhi'; // Default test query
    }

    const result = await this.locationService.forwardGeocode(query);

    if (!result) {
      return { error: 'Location not found', query };
    }

    return {
      success: true,
      query,
      result,
      message: 'Google Maps API is working!',
    };
  }

  @Get('reverse-geocode')
  @UseGuards(JwtAuthGuard)
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return { error: 'Invalid coordinates' };
    }

    const result = await this.locationService.reverseGeocode(latitude, longitude);

    if (!result) {
      return { error: 'Location not found' };
    }

    return result;
  }

  @Get('geocode')
  @UseGuards(JwtAuthGuard)
  async forwardGeocode(@Query('query') query: string) {
    if (!query || query.trim().length === 0) {
      return { error: 'Query is required' };
    }

    const result = await this.locationService.forwardGeocode(query);

    if (!result) {
      return { error: 'Location not found' };
    }

    return result;
  }

  @Get('autocomplete')
  @UseGuards(JwtAuthGuard)
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

    // Validate limit is reasonable (1-10)
    if (isNaN(maxLimit) || maxLimit < 1 || maxLimit > 10) {
      return { error: 'Limit must be between 1 and 10' };
    }

    const results = await this.locationService.searchLocations(query, maxLimit);

    return results;
  }
}
