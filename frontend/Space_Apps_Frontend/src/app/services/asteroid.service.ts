import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AsteroidService {
  private readonly http = inject(HttpClient);

  public async getAsteroidData(asteroidId: string): Promise<{ mass: number; diameter: number } | undefined> {
    try {
      return this.http.get<{ mass: number; diameter: number }>(`${environment.API_URL}asteroids/info/${asteroidId}`).toPromise();
    } catch (error) {
      console.log(error)
      throw new Error()
    }
  }
}
