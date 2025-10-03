import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AsteroidsController } from './asteroids.controller';
import { AsteroidsService } from './asteroids.service';

@Module({
  imports: [HttpModule],
  controllers: [AsteroidsController],
  providers: [AsteroidsService]
})
export class AsteroidsModule {}
