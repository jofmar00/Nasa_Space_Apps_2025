import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/splash-screen/splash-screen').then(m => m.SplashScreen) },
];
