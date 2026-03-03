import { Injectable, Logger } from '@nestjs/common';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressDetails {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  error?: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    try {
      const { lat, lng } = coordinates;
      
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
        {
          headers: {
            'User-Agent': 'recliq-service/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data: AddressDetails = await response.json();
      
      if (!data || data.error) {
        throw new Error('No address found for these coordinates');
      }

      // Build a human-readable address
      const parts: string[] = [];
      
      if (data.address.road) {
        if (data.address.house_number) {
          parts.push(`${data.address.house_number} ${data.address.road}`);
        } else {
          parts.push(data.address.road);
        }
      }
      
      if (data.address.neighbourhood || data.address.suburb) {
        const area = data.address.neighbourhood || data.address.suburb;
        if (area) parts.push(area);
      }
      
      if (data.address.city || data.address.town || data.address.village) {
        const city = data.address.city || data.address.town || data.address.village;
        if (city) parts.push(city);
      }
      
      // If we still don't have enough parts, use the display_name
      if (parts.length < 2 && data.display_name) {
        // Take only the first few parts of display_name to keep it concise
        const displayNameParts = data.display_name.split(',');
        return displayNameParts.slice(0, 3).join(', ');
      }
      
      return parts.join(', ') || data.display_name || 'Unknown location';
    } catch (error) {
      this.logger.error(`Reverse geocoding failed for coordinates ${coordinates.lat}, ${coordinates.lng}:`, error.message);
      // Fallback to coordinates if geocoding fails
      return `Location (${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)})`;
    }
  }

  async reverseGeocodeWithCache(coordinates: Coordinates): Promise<string> {
    // For now, call directly. In production, you might want to add Redis caching
    return this.reverseGeocode(coordinates);
  }
}
