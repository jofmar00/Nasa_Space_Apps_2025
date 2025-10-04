import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AsteroidVisualizer } from '../../components/asteroid-visualizer/asteroid-visualizer';
import { asteroidNames } from '../../../assets/asteroids.data';

@Component({
  standalone: true,
  imports: [CommonModule, AsteroidVisualizer],
  templateUrl: './asteroid.html',
  styleUrl: './asteroid.scss'
})
export class Asteroid implements OnInit{
  private activatedRoute = inject(ActivatedRoute);
  public asteroids = asteroidNames

  constructor() {
    /* this.activatedRoute.params.subscribe((params) => {
      this.asteroidName.set(params['name']);
    }); */
  }

  ngOnInit(): void {
  }
}
