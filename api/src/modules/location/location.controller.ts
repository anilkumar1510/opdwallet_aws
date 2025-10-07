import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('reverse-geocode')
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
}
