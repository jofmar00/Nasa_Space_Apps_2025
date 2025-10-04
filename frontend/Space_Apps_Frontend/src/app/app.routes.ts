import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/splash-screen/splash-screen').then(m => m.SplashScreen) },
  { path: 'asteroid/:name', loadComponent: () => import('./pages/asteroid/asteroid').then(m => m.Asteroid)  },
  { path: 'simulator', loadComponent: () => import('./pages/simulator/simulator.page').then(m => m.SimulatorPage) },
  { path: 'timeline', loadComponent: () => import('./pages/timeline/timeline').then(m => m.Timeline) }
];
