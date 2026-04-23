import { Injectable, Logger } from '@nestjs/common';

export interface PlaceSuggestion {
  placeId: string;
  displayName: string;    // "Kodungallur, Thrissur, Kerala, India"
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  type: string;           // "city", "town", "village", etc.
}

export interface ParsedGmapLink {
  latitude: number;
  longitude: number;
  placeName?: string;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  /**
   * Autocomplete place search using OpenStreetMap Nominatim.
   * Free, no API key required. Rate-limited to 1 req/sec by Nominatim policy.
   */
  async autocomplete(query: string, countryCode = 'in'): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    const searchQuery = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&addressdetails=1&limit=6&countrycodes=${countryCode}&accept-language=en`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'BookingPlatform/1.0',
        },
      });

      if (!res.ok) {
        this.logger.warn(`Nominatim returned ${res.status}`);
        return [];
      }

      const results: any[] = await res.json();

      return results
        .filter((r) => r.address)
        .map((r) => ({
          placeId: r.place_id?.toString() || '',
          displayName: this.buildDisplayName(r),
          city:
            r.address.city ||
            r.address.town ||
            r.address.village ||
            r.address.hamlet ||
            r.address.county ||
            '',
          state: r.address.state || '',
          country: r.address.country || '',
          latitude: parseFloat(r.lat),
          longitude: parseFloat(r.lon),
          type: r.type || r.class || 'place',
        }));
    } catch (err) {
      this.logger.error('Nominatim autocomplete failed', err);
      return [];
    }
  }

  /**
   * Reverse geocode: Coordinates → place details.
   */
  async reverseGeocode(lat: number, lng: number): Promise<PlaceSuggestion | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'BookingPlatform/1.0' },
      });

      if (!res.ok) return null;
      const r: any = await res.json();
      if (!r.address) return null;

      return {
        placeId: r.place_id?.toString() || '',
        displayName: this.buildDisplayName(r),
        city:
          r.address.city ||
          r.address.town ||
          r.address.village ||
          r.address.hamlet ||
          r.address.county ||
          '',
        state: r.address.state || '',
        country: r.address.country || '',
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        type: r.type || 'place',
      };
    } catch (err) {
      this.logger.error('Reverse geocode failed', err);
      return null;
    }
  }

  /**
   * Parse Google Maps URL to extract coordinates and optional place name.
   * Supports multiple Google Maps URL formats:
   *   - https://maps.google.com/?q=10.1234,76.5678
   *   - https://www.google.com/maps/@10.1234,76.5678,17z
   *   - https://www.google.com/maps/place/Kodungallur/@10.1234,76.5678,17z
   *   - https://goo.gl/maps/xxxxx (short links - not supported without redirect)
   *   - https://maps.app.goo.gl/xxxxx
   */
  parseGoogleMapsUrl(url: string): ParsedGmapLink | null {
    if (!url || typeof url !== 'string') return null;

    const trimmed = url.trim();

    // Pattern 1: /@lat,lng or @lat,lng
    const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (this.isValidCoord(lat, lng)) {
        const placeName = this.extractPlaceName(trimmed);
        return { latitude: lat, longitude: lng, placeName };
      }
    }

    // Pattern 2: ?q=lat,lng or &q=lat,lng
    const qMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      if (this.isValidCoord(lat, lng)) {
        return { latitude: lat, longitude: lng };
      }
    }

    // Pattern 3: /place/PlaceName/... URL
    const placeMatch = trimmed.match(/\/place\/([^/]+)/);

    // Pattern 4: ll=lat,lng
    const llMatch = trimmed.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llMatch) {
      const lat = parseFloat(llMatch[1]);
      const lng = parseFloat(llMatch[2]);
      if (this.isValidCoord(lat, lng)) {
        return {
          latitude: lat,
          longitude: lng,
          placeName: placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : undefined,
        };
      }
    }

    // Pattern 5: Coordinates in search query ?q=PlaceName
    // Not lat,lng — skip

    // Pattern 6: data=!3d<lat>!4d<lng> format
    const dataMatch = trimmed.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (dataMatch) {
      const lat = parseFloat(dataMatch[1]);
      const lng = parseFloat(dataMatch[2]);
      if (this.isValidCoord(lat, lng)) {
        return {
          latitude: lat,
          longitude: lng,
          placeName: placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : undefined,
        };
      }
    }

    return null;
  }

  /**
   * Parse a Google Maps URL and return full place data (coordinates + reverse geocoded address).
   */
  async parseGmapUrlWithAddress(url: string): Promise<{
    coordinates: { latitude: number; longitude: number };
    address: PlaceSuggestion | null;
    placeName?: string;
  } | null> {
    const parsed = this.parseGoogleMapsUrl(url);
    if (!parsed) return null;

    const address = await this.reverseGeocode(parsed.latitude, parsed.longitude);
    return {
      coordinates: { latitude: parsed.latitude, longitude: parsed.longitude },
      address,
      placeName: parsed.placeName,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildDisplayName(result: any): string {
    const addr = result.address;
    if (!addr) return result.display_name || '';

    const parts: string[] = [];

    // Add the most specific name
    const specificName =
      addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || addr.neighbourhood;
    if (specificName) parts.push(specificName);

    // Add district/county if different
    const district = addr.county || addr.state_district;
    if (district && district !== specificName) parts.push(district);

    // Add state
    if (addr.state && !parts.includes(addr.state)) parts.push(addr.state);

    // Add country
    if (addr.country && !parts.includes(addr.country)) parts.push(addr.country);

    return parts.length > 0 ? parts.join(', ') : result.display_name || '';
  }

  private extractPlaceName(url: string): string | undefined {
    const placeMatch = url.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }
    return undefined;
  }

  private isValidCoord(lat: number, lng: number): boolean {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }
}
