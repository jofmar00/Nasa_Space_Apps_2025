import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsteroidVisualizer } from '../asteroid-visualizer/asteroid-visualizer';
import { asteroidNames } from '../../../assets/asteroids.data';
import { Asteroid } from '../../models/asteroid.model';

@Component({
  selector: 'asteroid-catalog-dialog',
  standalone: true,
  imports: [CommonModule, AsteroidVisualizer],
  templateUrl: './asteroid-catalog-dialog.html',
  styleUrl: './asteroid-catalog-dialog.scss'
})
export class AsteroidCatalogDialog {
  protected readonly asteroids = asteroidNames;
  protected readonly isOpen = signal<boolean>(false);

  asteroidSelected = output<Asteroid>();

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectAsteroid(asteroid: Asteroid): void {
    this.asteroidSelected.emit(asteroid);
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
