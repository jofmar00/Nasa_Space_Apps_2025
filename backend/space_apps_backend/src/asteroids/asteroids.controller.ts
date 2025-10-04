import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AsteroidsService } from './asteroids.service';
import type { Response } from 'express';

@Controller('asteroids')
export class AsteroidsController {
  constructor(private readonly asteroidService: AsteroidsService) {}

  @Get('info/:id')
  getAsteroidInfo(@Param('id') id: number) {
    return this.asteroidService.getAsteroidInfo(id);
  }

  @Get('image')
  async getImage(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('diameter') diameter: number,
    @Res() res: Response,
  ) {
    console.log(
      `Longitude: ${longitude}, latitude: ${latitude}, diametro ${diameter}`,
    );
    const result = await this.asteroidService.getMapImage(
      latitude,
      longitude,
      diameter,
    );
    const id = result!.id;
    const image = result!.image;
    res.setHeader('Content-Type', 'image/png'); // <-- clave para que el navegador lo renderice
    res.setHeader('X-Image-Id', id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Image-Id');
    res.send(image);
  }

  @Get('explosion')
  getExplosionRadius(
    @Query('velocity') velocity: number,
    @Query('mass') mass: number,
  ) {
    console.log(`Llamando con velocity: ${velocity}, mass: ${mass}`);
    return this.asteroidService.getExplosionRadius(velocity, mass);
  }

  @Get('zoneinfo')
  getZoneInfo(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('radius') radius: number,
  ) {
    return this.asteroidService.getZoneInfo(longitude, latitude, radius);
  }

  @Get('/prediction')
  async getPrediction(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('explosion_radio') explosion_radio: number,
    @Query('years') years: number,
  ) {
    return this.asteroidService.getPrediccion(
      longitude,
      latitude,
      explosion_radio,
      years,
    );
  }

  @Get('/modifiedImage')
  async getModifiedImage(
    @Query('img_id') image_id: string,
    @Query('years') years: number,
    @Res() res: Response,
  ) {
    const imagePath = await this.asteroidService.editImage(image_id, years);
    if (!imagePath) {
      res.status(500).send('Failed to generate image');
      return;
    }
    const filename = imagePath.split('/').pop();
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(`/asteroids/file/${filename}`);
  }

  @Get('/file/:filename')
  async getImageFile(@Param('filename') filename: string, @Res() res: Response) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join('./epico', filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).send('Image not found');
      return;
    }

    const imageBuffer = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(imageBuffer);
  }
}
