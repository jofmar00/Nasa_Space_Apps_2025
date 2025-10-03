import { Component, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsteroidVisualizer } from '../asteroid-visualizer/asteroid-visualizer';
import { AsteroidCatalogDialog } from '../asteroid-catalog-dialog/asteroid-catalog-dialog';
import { asteroidNames } from '../../../assets/asteroids.data';
import { Asteroid } from '../../models/asteroid.model';

@Component({
  selector: 'asteroid-info-panel',
  standalone: true,
  imports: [CommonModule, AsteroidVisualizer, AsteroidCatalogDialog],
  templateUrl: './asteroid-info-panel.html',
  styleUrl: './asteroid-info-panel.scss'
})
export class AsteroidInfoPanel {
  protected readonly selectedAsteroid = signal<Asteroid>(asteroidNames[0]);
  protected readonly isPanelOpen = signal<boolean>(true);

  catalogDialog = viewChild.required<AsteroidCatalogDialog>('catalogDialog');

  protected openCatalog(): void {
    this.catalogDialog().open();
  }

  protected onAsteroidSelected(asteroid: Asteroid): void {
    this.selectedAsteroid.set(asteroid);
  }

  protected togglePanel(): void {
    this.isPanelOpen.set(!this.isPanelOpen());
  }

  protected formatMass(mass: number): string {
    const exponent = Math.floor(Math.log10(mass));
    const mantissa = mass / Math.pow(10, exponent);
    return `${mantissa.toFixed(1)} × 10${this.toSuperscript(exponent)} kg`;
  }

  private toSuperscript(num: number): string {
    const superscriptMap: { [key: string]: string } = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '-': '⁻'
    };
    return num.toString().split('').map(c => superscriptMap[c] || c).join('');
  }
}
