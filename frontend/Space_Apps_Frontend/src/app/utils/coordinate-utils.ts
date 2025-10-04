import * as THREE from 'three';

/**
 * Utility functions for coordinate conversion and formatting
 */

export interface GeographicCoordinates {
  lat: number;
  lng: number;
}

export interface DMSCoordinate {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: string;
}

/**
 * Calculate latitude from 3D point on unit sphere
 * @param point - 3D point on sphere surface
 * @returns Latitude in degrees (-90 to 90)
 */
export function calculateLatitude(point: THREE.Vector3): number {
  const normalizedPoint = point.clone().normalize();
  const lat = Math.asin(normalizedPoint.y) * (180 / Math.PI);
  return lat;
}

/**
 * Calculate longitude from 3D point on unit sphere
 * @param point - 3D point on sphere surface
 * @param textureRotationOffset - Rotation offset if texture is not aligned (default 0)
 * @returns Longitude in degrees (-180 to 180)
 */
export function calculateLongitude(point: THREE.Vector3): number {
  const normalizedPoint = point.clone().normalize();
  let lng = Math.atan2(normalizedPoint.z, normalizedPoint.x) * (180 / Math.PI);

  return lng * -1; // invert sign
}

/**
 * Calculate geographic coordinates from 3D point
 * @param point - 3D point on sphere surface
 * @param textureRotationOffset - Optional rotation offset
 * @returns Object with lat and lng
 */
export function pointToCoordinates(point: THREE.Vector3, textureRotationOffset: number = 0): GeographicCoordinates {
  return {
    lat: calculateLatitude(point),
    lng: calculateLongitude(point)
  };
}

/**
 * Validate coordinates are within valid ranges
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns True if valid
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Format coordinates as decimal degrees string
 * @param lat - Latitude
 * @param lng - Longitude
 * @param precision - Number of decimal places (default 6)
 * @returns Formatted string
 */
export function formatDecimalDegrees(lat: number, lng: number, precision: number = 6): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  return `${Math.abs(lat).toFixed(precision)}°${latDir}, ${Math.abs(lng).toFixed(precision)}°${lngDir}`;
}

/**
 * Convert decimal degrees to DMS (Degrees, Minutes, Seconds)
 * @param decimal - Decimal degree value
 * @param isLatitude - True for latitude, false for longitude
 * @returns DMS object
 */
export function decimalToDMS(decimal: number, isLatitude: boolean): DMSCoordinate {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60);

  const direction = isLatitude
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');

  return { degrees, minutes, seconds, direction };
}

/**
 * Format coordinates as DMS string
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Formatted DMS string
 */
export function formatDMS(lat: number, lng: number): string {
  const latDMS = decimalToDMS(lat, true);
  const lngDMS = decimalToDMS(lng, false);

  return `${latDMS.degrees}°${latDMS.minutes}'${latDMS.seconds.toFixed(2)}"${latDMS.direction}, ${lngDMS.degrees}°${lngDMS.minutes}'${lngDMS.seconds.toFixed(2)}"${lngDMS.direction}`;
}

/**
 * Format coordinates for display (both decimal and DMS)
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Formatted string with both formats
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${formatDecimalDegrees(lat, lng)} | ${formatDMS(lat, lng)}`;
}

/**
 * Get cardinal direction description
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Descriptive string (e.g., "Northern Hemisphere, Eastern Hemisphere")
 */
export function getCardinalDescription(lat: number, lng: number): string {
  const latDesc = lat > 0 ? 'Northern Hemisphere' :
                  lat < 0 ? 'Southern Hemisphere' :
                  'Equator';

  const lngDesc = lng > 0 ? 'Eastern Hemisphere' :
                  lng < 0 ? 'Western Hemisphere' :
                  'Prime Meridian';

  if (lat === 0 && lng === 0) {
    return 'Null Island (Equator & Prime Meridian)';
  }

  if (Math.abs(lat) > 89.5) {
    return lat > 0 ? 'North Pole' : 'South Pole';
  }

  return `${latDesc}, ${lngDesc}`;
}

/**
 * Handle pole singularity (longitude is undefined at poles)
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Adjusted coordinates
 */
export function handlePoleSingularity(lat: number, lng: number): GeographicCoordinates {
  if (Math.abs(lat) > 89.9) {
    return { lat, lng: 0 }; // Longitude is arbitrary at poles
  }
  return { lat, lng };
}

/**
 * Calculate distance between two geographic coordinates (Haversine formula)
 * @param lat1 - First latitude
 * @param lng1 - First longitude
 * @param lat2 - Second latitude
 * @param lng2 - Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Log coordinates to console with detailed formatting
 * @param lat - Latitude
 * @param lng - Longitude
 * @param point - Optional 3D point
 * @param label - Optional label for the log
 */
export function logCoordinates(lat: number, lng: number, point?: THREE.Vector3, label: string = 'LOCATION'): void {
}
