import { HttpClient, HttpResponse } from '@angular/common/http';
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

  public async getCraterRadius(mass: number, velocity: number) {
    try {
      return this.http.get<number>(`${environment.API_URL}asteroids/explosion?velocity=${velocity}&mass=${mass}`).toPromise();
    } catch (error) {
      console.log(error)
      throw new Error()
    }
  }

  public async getCoordinatesImage(latitude: number, longitude: number, diameter: number) {
    try {
      const response = await this.http.get(`${environment.API_URL}asteroids/image?longitude=${longitude}&latitude=${latitude}&diameter=${diameter}`, { responseType: 'arraybuffer', observe: 'response' }).toPromise();

      console.log(response?.clone().headers.keys())

      return {
        img: response?.body,
        imgId: response?.headers.get('x-image-id')
      }
    } catch (error) {
      console.log(error)
      throw new Error()
    }
  }

  public async getPrediction(latitude: number, longitude: number, radius: number, years: number) {
    try {
      const response = await this.http.get(`${environment.API_URL}asteroids/prediction?longitude=${longitude}&latitude=${latitude}&explosion_radio=${radius}&years=${years}`, {responseType: 'text'}).toPromise();
      return response
    } catch (error) {
      throw error
    }
  }

  public async getModifiedImage(imageId: string, years: number) {
    try {
      const response = await this.http.get(`${environment.API_URL}asteroids/modifiedImage?img_id=${imageId}&years=${years}`, { responseType: 'text' }).toPromise();
      return response
    } catch (error) {
      console.log(error)
      throw new Error()
    }
  }
}
