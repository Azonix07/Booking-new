import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { AutocompleteDto, ReverseGeocodeDto, ParseGmapDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('location')
@Public()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * GET /location/autocomplete?q=kodungall&country=in
   * Returns place suggestions with city, state, country, coordinates.
   */
  @Get('autocomplete')
  async autocomplete(@Query() query: AutocompleteDto) {
    const results = await this.locationService.autocomplete(
      query.q,
      query.country || 'in',
    );
    return { success: true, data: results };
  }

  /**
   * GET /location/reverse?lat=10.23&lng=76.19
   * Reverse geocode coordinates to address.
   */
  @Get('reverse')
  async reverseGeocode(@Query() query: ReverseGeocodeDto) {
    const result = await this.locationService.reverseGeocode(query.lat, query.lng);
    return { success: true, data: result };
  }

  /**
   * POST /location/parse-gmap
   * Parse a Google Maps URL and return coordinates + address.
   */
  @Post('parse-gmap')
  async parseGmapUrl(@Body() dto: ParseGmapDto) {
    const result = await this.locationService.parseGmapUrlWithAddress(dto.url);
    return { success: true, data: result };
  }
}
