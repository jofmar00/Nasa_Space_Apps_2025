import { Component } from '@angular/core';
import { NasaLogo } from '../../components/nasa-logo/nasa-logo';
import { StarBackground } from '../../components/star-background/star-background';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [NasaLogo, StarBackground, RouterLink],
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.scss'
})
export class SplashScreen {
  public loading = false;
}
