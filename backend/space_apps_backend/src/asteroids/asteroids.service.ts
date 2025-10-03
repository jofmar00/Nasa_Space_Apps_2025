import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AsteroidsService {
    private nasa_api = "https://api.nasa.gov/neo/rest/v1/neo";
    private maps_api = "https://maps.googleapis.com/maps/api/staticmap";

    private nasaApiKey: string | undefined;
    private mapsApiKey: string | undefined;
    private asteroid_diameters = new Map<number, number>([
        [2001580, 7112.7898709308],
        [2001620, 5248.5577337793],
        [2002063, 2148.0282007576],
        [2004179, 5200.4386672425],
        [2004486, 4487.8670088081],
        [2004660, 1056.9147985314],
        [2004769, 1968.067450894],
        [2006489, 851.2163929215],
        [2025143, 835.6799428155],
        [2101955, 539.5602891983],
    ]);

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService
    ) {
        this.nasaApiKey = this.configService.get<string>('NASA_API_KEY');
        this.mapsApiKey = this.configService.get<string>('MAPS_API_KEY')
    }

    async getDiameterById(id: number) {
        if (this.asteroid_diameters.has(id)) {
          return this.asteroid_diameters.get(id)!;
        } else {
          // Genera un número aleatorio entre 600 y 7000
          const randomValue = Math.random() * (7000 - 600) + 600;
          this.asteroid_diameters.set(id, randomValue); // guarda en el map
          return randomValue;
        } 
    }

    async getMapImage(latitude: number, longitude: number, diameter: number) {
        const url = `${this.maps_api}?center=${latitude},${longitude}&scale=2&zoom=15&size=1920x1080&format=png&maptype=satellite&key=${this.mapsApiKey}`

        try {
            const response = await firstValueFrom(
            this.httpService.get(url, { responseType: 'arraybuffer' })
            );

            return Buffer.from(response.data, 'binary');
        }
        catch(err) {
            console.error(err);
        }
    }


}
