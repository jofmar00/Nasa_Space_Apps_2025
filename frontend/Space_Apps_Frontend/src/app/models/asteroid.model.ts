export interface Asteroid {
  id: string;
  name: string;
}

export interface AsteroidConfig {
  asteroid: Asteroid;
  speed: number;             // km/s (configurable)
  angle: number;             // degrees (configurable)
  impactPoint?: { lat: number; lon: number };
}