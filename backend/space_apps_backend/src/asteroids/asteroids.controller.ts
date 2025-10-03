import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AsteroidsService } from './asteroids.service';
import type { Response } from 'express';

@Controller('asteroids')
export class AsteroidsController {
    constructor(private readonly asteroidService: AsteroidsService){}

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
        console.log(`Longitude: ${longitude}, latitude: ${latitude}, diametro ${diameter}`)
        const image = await this.asteroidService.getMapImage(latitude, longitude, diameter);
        res.setHeader('Content-Type', 'image/png'); // <-- clave para que el navegador lo renderice
        res.send(image);
    }

    @Get('explosion')
    getExplosionRadius(@Query('velocity') velocity: number, @Query('mass') mass: number) {
        console.log(`Llamando con velocity: ${velocity}, mass: ${mass}`);
        return this.asteroidService.getExplosionRadius(velocity, mass);
    }
}
