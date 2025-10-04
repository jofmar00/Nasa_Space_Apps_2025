import { Component, signal, viewChild, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsteroidVisualizer } from '../asteroid-visualizer/asteroid-visualizer';
import { AsteroidCatalogDialog } from '../asteroid-catalog-dialog/asteroid-catalog-dialog';
import { asteroidNames } from '../../../assets/asteroids.data';
import { Asteroid } from '../../models/asteroid.model';
import { AsteroidService } from '../../services/asteroid.service';
import { FormsModule } from '@angular/forms';

interface FullAsteroid extends Asteroid {
  mass: number;
  diameter: number;
  speed: number;
}

@Component({
  selector: 'asteroid-info-panel',
  standalone: true,
  imports: [CommonModule, AsteroidVisualizer, AsteroidCatalogDialog, FormsModule],
  templateUrl: './asteroid-info-panel.html',
  styleUrl: './asteroid-info-panel.scss'
})
export class AsteroidInfoPanel implements OnInit {
  // Inputs
  hasTarget = input<boolean>(false);
  isLaunching = input<boolean>(false);

  // Outputs
  launchAsteroid = output<FullAsteroid>();

  protected readonly selectedAsteroid = signal<FullAsteroid | undefined>(undefined);
  protected readonly isPanelOpen = signal<boolean>(true);

  catalogDialog = viewChild.required<AsteroidCatalogDialog>('catalogDialog');

  private readonly asteroidService = inject(AsteroidService);

  async ngOnInit() {
    const response = await this.asteroidService.getAsteroidData(asteroidNames[0].id)
    if (response) {
      this.selectedAsteroid.set({
        ...asteroidNames[0],
        mass: response.mass,
        diameter: response.diameter,
        speed: 10000
      })
    }
  }

  protected openCatalog(): void {
    this.catalogDialog().open();
  }

  protected async onAsteroidSelected(asteroid: Asteroid) {
    const response = await this.asteroidService.getAsteroidData(asteroid.id)
    if (response) {
      this.selectedAsteroid.set({
        ...asteroid,
        mass: response.mass,
        diameter: response.diameter,
        speed: 10000
      })
    }
  }

  protected togglePanel(): void {
    this.isPanelOpen.set(!this.isPanelOpen());
  }

  protected onLaunchClick(): void {
    if (!this.selectedAsteroid()) return;
    this.launchAsteroid.emit(this.selectedAsteroid() as FullAsteroid);
  }

  protected formatDiameter(diameter: number): string {
    return `${diameter.toFixed(2)} m`;
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
