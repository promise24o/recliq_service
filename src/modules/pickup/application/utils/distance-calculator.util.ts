import { Coordinates } from '../../domain/types/pickup.types';

export class DistanceCalculator {
  private static readonly EARTH_RADIUS_KM = 6371;

  static calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const lat1Rad = this.toRadians(point1.lat);
    const lat2Rad = this.toRadians(point2.lat);
    const deltaLat = this.toRadians(point2.lat - point1.lat);
    const deltaLng = this.toRadians(point2.lng - point1.lng);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c;
  }

  static estimateArrivalTime(distanceKm: number, averageSpeedKmh: number = 30): number {
    return Math.ceil((distanceKm / averageSpeedKmh) * 60);
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
