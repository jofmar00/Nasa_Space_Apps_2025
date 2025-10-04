import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { delay, firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import sharp from 'sharp';

@Injectable()
export class AsteroidsService {
  private nasa_api = 'https://api.nasa.gov/neo/rest/v1/neo';
  private maps_api = 'https://maps.googleapis.com/maps/api/staticmap';

  private nasaApiKey: string | undefined;
  private mapsApiKey: string | undefined;
  private openaiApiKey: string | undefined;
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
  private images = new Map<string, Buffer>();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.nasaApiKey = this.configService.get<string>('NASA_API_KEY');
    this.mapsApiKey = this.configService.get<string>('MAPS_API_KEY');
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
  }
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    const diameter_kilometers = this.getDiameterById(id);
    const diameter_centimeters = diameter_kilometers * 100_000;
    const area = Math.pow(diameter_centimeters / 2, 2) * Math.PI * 4;
    const masa = (area * 5) / 1_000;

    return {
      mass: masa / 50,
      diameter: diameter_kilometers,
    };
  }

  getExplosionRadius(velocity: number, mass: number) {
    const E = 0.5 * mass * velocity * velocity;
    console.log(`E: ${E}`);
    const W = E / 4.18e6;
    console.log(`W: ${W}`);
    const R = Math.pow(W, 1 / 3) * 4.5;
    return R;
  }

  async getMapImage(latitude: number, longitude: number, diameter: number) {
    const zoom = this.getZoom(diameter);
    console.log({ maps: this.mapsApiKey });
    const url = `${this.maps_api}?center=${latitude},${longitude}&scale=2&zoom=${zoom}&size=1920x1080&format=png&maptype=satellite&key=${this.mapsApiKey}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );

      const id = uuidv4();
      const image = Buffer.from(response.data, 'binary');
      this.images.set(id, image);

      return {
        id,
        image,
      };
    } catch (err) {
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
      response.data.features.forEach((feature) => {
        const population = feature?.properties?.datasource?.raw?.population;
        if (population) {
          population_count += population;
        }
      });

      return population_count;
    } catch (err) {
      console.error(err);
    }
  }

  async getPrediccion(
    longitud: number,
    latitud: number,
    radio: number,
    momento_temporal: number,
  ) {
    const client = new OpenAI({ apiKey: this.openaiApiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Vas a generar un escenario lo más realista posible después del impacto de un meteorito en el planeta tierra.' +
            'Te darán datos sobre el radio de la explosión que genera el impacto del meteorito, una localizacion en formato longitud, latitud y una cantidad de tiempo desde el impacto ' +
            'A partir de estos datos, crea un escenario realista de las consecuencias del impacto en el momento temporal indicado, abarcando como este impacto afecta al terreno,' +
            ' a la civilizacion, a la situacion medioambiental y a la situacion geopolitica en ese momento dado de tiempo.' +
            'No des generalidades, la respuesta debe de estar construida para la localizacion que se te indica, debes de tratar de enfocar la respuesta a la zona afectada, con nombres ' +
            'especificos de ciudades y zonas afectadas, es extremadamente importante que no menciones en ningun momento las coordenadas, ni las palabras "latitud" y "longitud".' +
            'Si el instante temporal es mayor a 0 años, habla del proceso de recuperacion de estos factores en la region afectada' +
            'Hila el contenido de tu respuesta sin mencionar los temas que te hemos pedido directamente, especificamente, no nombres de manera directa "geopolitica" y "situacion medioambiental" ' +
            'Redacta la respuesta como un narrador omnisciente en tercera persona',
        },
        {
          role: 'user',
          content: `Ha caido un meteorito en longitud: ${longitud}, latitud: ${latitud}, con un radio de impacto: ${radio} km. Dame las situacion del impacto despues de ${momento_temporal} años`,
        },
      ],
      max_tokens: 350,
    });

    client.images.edit;

    return response.choices[0].message.content;
  }

  async editImage(img_id: string, years: number) {
    // Creamos cliente
    const client = new OpenAI({ apiKey: this.openaiApiKey });
    if (!this.images.has(img_id)) {
      console.error(`No está cacheada la imagen ${img_id} TONTO`);
      return;
    }

    // Guaradmos la imagen
    const image = this.images.get(img_id)!;
    const buffer = Buffer.from(image);
    await fs.writeFile(`./epico/${img_id}.png`, buffer, (err) => {
      if (err) throw err;
      console.log('Imagen guardada correctamente');
    });
    await this.delay(5_000);
    const rgbaBuffer = await sharp(`./epico/${img_id}.png`)
      .ensureAlpha() // añade canal alfa si no existe
      .png()
      .toBuffer();

    const mascara = await sharp(`./epico/mask.png`)
      .ensureAlpha() // añade canal alfa si no existe
      .png()
      .toBuffer();

    const form = new FormData();

    form.append('image', rgbaBuffer, {
      contentType: 'image/png',
      filename: `${img_id}.png`,
    });

    form.append('mask', mascara, {
      contentType: 'image/png',
      filename: `mask.png`,
    });

    let prompt;
    // Creamos prompt
    if (years == 0) {
      prompt =
        'Modify a satellite image of Earth. Focus only on the center:  ' +
        '- If the center shows land, replace it with a realistic sinkhole or crater, deep and irregular, with cracks, shadows, displaced soil, and natural color variations, blending seamlessly with the surrounding terrain.  ' +
        '- If the center shows water, replace it with strong turbulent waves, with foam, ripples, and light reflections, contrasting with calmer water around.  ' +
        'Keep the overall image looking like an authentic satellite photo, with natural Earth tones, realistic lighting, consistent resolution, and no alterations outside the central area.  ';
    } else if (years == 1) {
      prompt =
        'Create a realistic satellite image showing the same location one year after a meteorite impact. The scene must depict visible post-impact changes: a large eroded crater with softened edges, scattered debris, altered terrain textures, and signs of vegetation regrowth or sediment accumulation. If the area was water, show disturbed coastlines, sediment plumes, and partial flooding around the impact site. Maintain the appearance of an authentic satellite photograph with natural Earth tones, accurate lighting, and seamless blending with the surroundings, as if captured by a real Earth observation satellite. ';
    } else {
    }
    form.append('prompt', prompt);
    form.append('n', 1);
    form.append('size', '1024x1024');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });
    const data: any = await response.json();
    console.log(data);
    return data.data[0].url;
  }
}
