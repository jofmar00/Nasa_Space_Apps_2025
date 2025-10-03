import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AsteroidsService } from './asteroids.service';
import type { Response } from 'express';

@Controller('asteroids')
export class AsteroidsController {
    constructor(private readonly asteroidService: AsteroidsService){}

    @Get('diameter/:id')
    getDiameterById(@Param('id') id: number) {
        return this.asteroidService.getDiameterById(id);
    }

    @Get('image')
    async getImage(
        @Query('longitude') longitude: number,
        @Query('latitude') latitude: number,
        @Res() res: Response,
    ) {
        console.log(`Longitude: ${longitude}, latitude: ${latitude}`)
        const image = await this.asteroidService.getMapImage(latitude, longitude, 1);
        res.setHeader('Content-Type', 'image/png'); // <-- clave para que el navegador lo renderice
        res.send(image);
    }
}
