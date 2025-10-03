import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { features } from 'node:process';
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

    // TODO DARLE TAMBIEN LA MASA
    getDiameterById(id: number) {
        if (this.asteroid_diameters.has(id)) {
          return this.asteroid_diameters.get(id)!;
        } else {
          // Genera un número aleatorio entre 600 y 7000
          const randomValue = Math.random() * (7000 - 600) + 600;
          this.asteroid_diameters.set(id, randomValue); // guarda en el map
          return randomValue;
        } 
    }

    getAsteroidInfo(id: number) {
        const diameter_kilometers = this.getDiameterById(id)
        const diameter_centimeters = diameter_kilometers * 100_000;
        const area = Math.pow((diameter_centimeters /2),2) * Math.PI * 4;
        const masa = (area * 5) / 1_000;

        return {
            mass: masa / 50,
            diameter: diameter_kilometers
        }
    }

    
    getExplosionRadius(velocity: number, mass: number) {
        let E = 0.5 * mass * velocity * velocity;
        console.log(`E: ${E}`)
        let W = E / (4.18e6);
        console.log(`W: ${W}`)
        let R = Math.pow(W, 1/3) * 4.5;
        return R;
    }

    async getMapImage(latitude: number, longitude: number, diameter: number) {
        const zoom = this.getZoom(diameter);
        const url = `${this.maps_api}?center=${latitude},${longitude}&scale=2&zoom=${zoom}&size=1920x1080&format=png&maptype=satellite&key=${this.mapsApiKey}`

        try {
            const response = await firstValueFrom(
            this.httpService.get(url, { responseType: 'arraybuffer' }));

            return Buffer.from(response.data, 'binary');
        }
        catch(err) {
            console.error(err);
        }
    }

    getZoom(diameter: number) {
        if (diameter < 125) return 19;
        else if (diameter < 250) return 18;
        else if (diameter < 500) return 17;
        else if (diameter < 1000) return 16;
        else if (diameter < 2000) return 15;
        else if (diameter < 4000) return 14;
        else if (diameter < 8000) return 13;
        else if (diameter < 16000) return 12;
        else if (diameter < 32000) return 11;
        else if (diameter < 32000) return 10;
        else if (diameter < 64000) return 9;
        else if (diameter < 128000) return 8;
        else if (diameter < 256000) return 7;
        else if (diameter < 512000) return 6;
        else if (diameter < 1024000) return 5;
        else return 3;

    }

    async getZoneInfo(longitud: number, latitud: number, radio_metros: number) {
        const url = `https://api.geoapify.com/v2/places?categories=populated_place&filter=circle:${longitud},${latitud},${radio_metros}&bias=proximity:${longitud},${latitud}&limit=20&apiKey=f96d276a61904cf08414922723b78977`;
        try {
            const response = await firstValueFrom(this.httpService.get(url));
            let population_count = 0;
            response.data.features.forEach(feature => {
                let population = feature?.properties?.datasource?.raw?.population;
                if (population) {
                    population_count += population;
                }
            });

            return population_count;
        }
        catch (err) {
            console.error(err);
        }
    }

}
