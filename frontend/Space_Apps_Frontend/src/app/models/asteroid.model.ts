export interface Asteroid {
  id: string;
  name: string;
  size: number;              // diameter in meters
  mass: number;              // in kg
  defaultSpeed: number;      // km/s
  defaultAngle: number;      // degrees (0-90)
  description: string;
}

export interface AsteroidConfig {
  asteroid: Asteroid;
  speed: number;             // km/s (configurable)
  angle: number;             // degrees (configurable)
  impactPoint?: { lat: number; lon: number };
}